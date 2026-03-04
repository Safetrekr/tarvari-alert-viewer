/**
 * use-telemetry -- TanStack Query hook for the telemetry pipeline.
 *
 * Polls GET /api/telemetry with adaptive intervals:
 * - Alert state (DEGRADED / DOWN)      -> 5 s
 * - All stable (OPERATIONAL / OFFLINE)  -> 30 s (after 5 stable cycles)
 * - Otherwise                           -> 15 s
 *
 * On each successful fetch the hook merges the server snapshot into the
 * Zustand districts store, preserving client-side response-time history
 * and contact state.
 *
 * @module use-telemetry
 * @see WS-1.5
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

import {
  POLLING_INTERVALS,
  SPARKLINE_HISTORY_LENGTH,
} from '@/lib/telemetry-config'
import type { AppTelemetry, SystemSnapshot } from '@/lib/telemetry-types'
import { useDistrictsStore } from '@/stores/districts.store'

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function fetchTelemetry(): Promise<SystemSnapshot> {
  const response = await fetch('/api/telemetry')

  if (!response.ok) {
    throw new Error(`Telemetry fetch failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<SystemSnapshot>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTelemetry() {
  const currentInterval = useRef<number>(POLLING_INTERVALS.normal)
  const stableCycleCount = useRef(0)

  const syncSnapshot = useDistrictsStore((s) => s.syncSnapshot)
  const existingDistricts = useDistrictsStore((s) => s.districts)

  // We need a stable ref to existing districts so the select callback
  // does not cause infinite re-renders.
  const existingDistrictsRef = useRef(existingDistricts)
  useEffect(() => {
    existingDistrictsRef.current = existingDistricts
  }, [existingDistricts])

  /**
   * Merge server snapshot with client-side state:
   * - Preserve and extend responseTimeHistory
   * - Preserve hasBeenContacted (union of server + client)
   * - Preserve lastSuccessfulContact (most recent wins)
   */
  const mergeAndSync = useCallback(
    (snapshot: SystemSnapshot): SystemSnapshot => {
      const merged: Record<string, AppTelemetry> = {}
      const existing = existingDistrictsRef.current

      for (const [id, serverTelemetry] of Object.entries(snapshot.apps)) {
        const prev = existing[id]

        // Build rolling response-time history
        let history: number[] = prev?.responseTimeHistory ?? []
        if (serverTelemetry.responseTimeMs !== null) {
          history = [...history, serverTelemetry.responseTimeMs]
          if (history.length > SPARKLINE_HISTORY_LENGTH) {
            history = history.slice(history.length - SPARKLINE_HISTORY_LENGTH)
          }
        }

        // Union contact state
        const hasBeenContacted =
          serverTelemetry.hasBeenContacted || (prev?.hasBeenContacted ?? false)

        // Most recent successful contact wins
        let lastSuccessfulContact = serverTelemetry.lastSuccessfulContact
        if (
          prev?.lastSuccessfulContact &&
          (!lastSuccessfulContact ||
            new Date(prev.lastSuccessfulContact) > new Date(lastSuccessfulContact))
        ) {
          lastSuccessfulContact = prev.lastSuccessfulContact
        }

        merged[id] = {
          ...serverTelemetry,
          responseTimeHistory: history,
          hasBeenContacted,
          lastSuccessfulContact,
        }
      }

      // Sync merged state into Zustand store
      syncSnapshot(merged, snapshot.timestamp)

      return {
        ...snapshot,
        apps: merged,
      }
    },
    [syncSnapshot],
  )

  const query = useQuery<SystemSnapshot>({
    queryKey: ['telemetry'],
    queryFn: fetchTelemetry,
    refetchInterval: () => currentInterval.current,
    refetchIntervalInBackground: true,
    staleTime: 0,
    select: mergeAndSync,
  })

  // ---------------------------------------------------------------------------
  // Adaptive interval logic
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!query.data) return

    const { summary } = query.data

    const hasAlertState = summary.degraded > 0 || summary.down > 0
    const allStable =
      summary.degraded === 0 &&
      summary.down === 0 &&
      summary.unknown === 0

    if (hasAlertState) {
      // Alert: poll faster
      currentInterval.current = POLLING_INTERVALS.alert
      stableCycleCount.current = 0
    } else if (allStable) {
      // Stable: increment counter, relax after threshold
      stableCycleCount.current++
      if (stableCycleCount.current >= POLLING_INTERVALS.stableCyclesThreshold) {
        currentInterval.current = POLLING_INTERVALS.relaxed
      } else {
        currentInterval.current = POLLING_INTERVALS.normal
      }
    } else {
      // Normal
      currentInterval.current = POLLING_INTERVALS.normal
      stableCycleCount.current = 0
    }
  }, [query.data])

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    currentIntervalMs: currentInterval.current,
  }
}
