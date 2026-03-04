'use client'

/**
 * React hook for periodic system snapshot storage.
 *
 * Captures a SystemSnapshot every `intervalMs` milliseconds and stores
 * it in the launch_snapshots table as a 'periodic' snapshot.
 *
 * These periodic snapshots serve as baseline data for the Evidence Ledger
 * (WS-3.2) and receipt rehydration metric comparison. They provide
 * continuous state tracking independent of user actions.
 *
 * References:
 * - combined-recommendations.md WS-3.1: "periodic system snapshot storage"
 * - AD-5: telemetry polling cadence (adaptive, but snapshots are fixed 30s)
 */

import { useEffect, useRef } from 'react'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import { SystemSnapshotStore } from '@/lib/receipt-store/snapshot-store'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ============================================================================
// Types
// ============================================================================

export interface UseSnapshotPollingOptions {
  /**
   * Function that returns the current system snapshot.
   * Typically: `() => systemStateProvider.getSnapshot()`
   */
  readonly getSnapshot: () => SystemSnapshot | null
  /**
   * Polling interval in milliseconds.
   * Default: 30000 (30 seconds, matching narration cadence per AD-6).
   */
  readonly intervalMs?: number
  /**
   * Whether polling is enabled.
   * Default: true. Set to false to pause snapshot capture.
   */
  readonly enabled?: boolean
}

// ============================================================================
// Hook
// ============================================================================

export function useSnapshotPolling(options: UseSnapshotPollingOptions): void {
  const { getSnapshot, intervalMs = 30_000, enabled = true } = options

  // Use refs to avoid re-creating the interval when callbacks change.
  const getSnapshotRef = useRef(getSnapshot)
  getSnapshotRef.current = getSnapshot

  const storeRef = useRef<SystemSnapshotStore | null>(null)

  // Initialize the snapshot store once.
  useEffect(() => {
    storeRef.current = new SystemSnapshotStore({
      client: getSupabaseBrowserClient(),
    })
  }, [])

  // Periodic snapshot capture.
  useEffect(() => {
    if (!enabled) return

    const capture = async () => {
      const snapshot = getSnapshotRef.current()
      if (!snapshot || !storeRef.current) return

      await storeRef.current.store(snapshot, 'periodic')
    }

    // Capture immediately on mount, then on interval.
    capture()
    const interval = setInterval(capture, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs, enabled])
}
