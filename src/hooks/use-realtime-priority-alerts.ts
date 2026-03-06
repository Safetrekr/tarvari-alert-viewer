'use client'

/**
 * Supabase Realtime subscription for P1/P2 priority alert INSERTs.
 *
 * Dual-channel architecture: WebSocket push signals cache invalidation
 * while TanStack Query remains the single source of truth. The hook
 * never calls `setQueryData` — only `invalidateQueries`.
 *
 * @module use-realtime-priority-alerts
 * @see WS-2.4
 * @see WS-2.1 (PRIORITY_FEED_QUERY_KEY for invalidation)
 * @see WS-2.5 (onAlert callback for notification dispatch)
 */

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { DATA_MODE } from '@/lib/data-mode'
import { PRIORITY_FEED_QUERY_KEY } from '@/hooks/use-priority-feed'

// ============================================================================
// Types
// ============================================================================

/** Raw Realtime INSERT payload from `intel_normalized`. */
export interface RealtimeAlertPayload {
  id: string
  title: string
  severity: string
  category: string
  operational_priority: string | null
  ingested_at: string
  source_id: string
  geo: Record<string, unknown> | null
}

/** WebSocket connection status. */
export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/** Hook configuration. */
export interface UseRealtimePriorityAlertsOptions {
  /** Called when a P1/P2 alert arrives via Realtime. */
  onAlert?: (payload: RealtimeAlertPayload) => void
  /** Whether the subscription is active. Default: true. */
  enabled?: boolean
}

/** Hook return value. */
export interface UseRealtimePriorityAlertsReturn {
  connectionStatus: RealtimeConnectionStatus
  isConnected: boolean
  lastEventAt: string | null
  eventCount: number
}

// ============================================================================
// Constants
// ============================================================================

const PRIORITY_ALERT_CHANNEL_NAME = 'priority-alerts-p1-p2'

// ============================================================================
// Hook
// ============================================================================

/**
 * Subscribe to Supabase Realtime P1/P2 INSERT events on `intel_normalized`.
 *
 * On each event:
 * 1. Fires `onAlert` callback for immediate notification dispatch (WS-2.5)
 * 2. Invalidates TanStack Query caches (priority feed + secondary queries)
 *
 * @see WS-2.4
 */
export function useRealtimePriorityAlerts(
  options: UseRealtimePriorityAlertsOptions = {},
): UseRealtimePriorityAlertsReturn {
  const { onAlert, enabled: enabledOption = true } = options
  const enabled = enabledOption && DATA_MODE !== 'supabase'

  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('disconnected')
  const [lastEventAt, setLastEventAt] = useState<string | null>(null)
  const [eventCount, setEventCount] = useState(0)

  const onAlertRef = useRef(onAlert)
  onAlertRef.current = onAlert

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) {
      setConnectionStatus('disconnected')
      return
    }

    const supabase = getSupabaseBrowserClient()
    setConnectionStatus('connecting')

    const channel = supabase
      .channel(PRIORITY_ALERT_CHANNEL_NAME)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'intel_normalized',
          filter: 'operational_priority=in.(P1,P2)',
        },
        (payload) => {
          const newRow = payload.new as RealtimeAlertPayload

          // Client-side fallback guard (in case server-side filter unsupported)
          if (newRow.operational_priority !== 'P1' && newRow.operational_priority !== 'P2') {
            return
          }

          // 1. Fire notification callback
          onAlertRef.current?.(newRow)

          // 2. Invalidate TanStack Query caches
          queryClient.invalidateQueries({ queryKey: PRIORITY_FEED_QUERY_KEY })
          queryClient.invalidateQueries({ queryKey: ['intel', 'feed'] })
          queryClient.invalidateQueries({ queryKey: ['coverage', 'metrics'] })
          queryClient.invalidateQueries({ queryKey: ['coverage', 'map-data'] })

          // 3. Update diagnostics
          setEventCount((prev) => prev + 1)
          setLastEventAt(new Date().toISOString())
        },
      )
      .subscribe((status) => {
        switch (status) {
          case 'SUBSCRIBED':
            setConnectionStatus('connected')
            break
          case 'TIMED_OUT':
          case 'CHANNEL_ERROR':
            setConnectionStatus('error')
            break
          case 'CLOSED':
            setConnectionStatus('disconnected')
            break
        }
      })

    return () => {
      supabase.removeChannel(channel)
      setConnectionStatus('disconnected')
    }
  }, [enabled, queryClient])

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    lastEventAt,
    eventCount,
  }
}
