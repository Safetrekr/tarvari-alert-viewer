'use client'

/**
 * React hook providing a SupabaseReceiptStore instance.
 *
 * Creates a singleton SupabaseReceiptStore and provides it to components.
 * This hook replaces InMemoryReceiptStore everywhere it was used in Phase 2.
 *
 * Usage:
 * ```tsx
 * const { receiptStore, offlineQueueLength } = useSupabaseReceipts()
 *
 * // Pass to StationPanel (WS-2.6)
 * <StationPanel receiptStore={receiptStore} ... />
 *
 * // Record a receipt directly
 * await receiptStore.record(createLoginReceipt())
 * ```
 *
 * References:
 * - WS-2.6: StationPanel accepts receiptStore prop
 * - WS-1.7: ReceiptStore interface
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { SupabaseReceiptStore } from '@/lib/receipt-store/supabase-receipt-store'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'

// ============================================================================
// Types
// ============================================================================

export interface UseSupabaseReceiptsReturn {
  /** The SupabaseReceiptStore instance. Stable reference across re-renders. */
  readonly receiptStore: SupabaseReceiptStore
  /** Number of receipts queued for offline flush. */
  readonly offlineQueueLength: number
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Provides a SupabaseReceiptStore instance.
 *
 * @param getSystemSnapshot - Optional function to get the current system snapshot.
 *   If provided, every receipt will be linked to a snapshot for rehydration.
 *   Typically: `() => systemStateProvider.getSnapshot()`
 */
export function useSupabaseReceipts(
  getSystemSnapshot?: () => SystemSnapshot | null
): UseSupabaseReceiptsReturn {
  const [offlineQueueLength, setOfflineQueueLength] = useState(0)
  const snapshotRef = useRef(getSystemSnapshot)
  snapshotRef.current = getSystemSnapshot

  const receiptStore = useMemo(() => {
    const client = getSupabaseBrowserClient()
    return new SupabaseReceiptStore({
      client,
      captureSnapshotPerReceipt: true,
      getSystemSnapshot: () => snapshotRef.current?.() ?? null,
    })
  }, [])

  // Periodically check offline queue length and attempt to flush.
  useEffect(() => {
    const interval = setInterval(() => {
      setOfflineQueueLength(receiptStore.offlineQueueLength)

      if (receiptStore.offlineQueueLength > 0) {
        receiptStore.flushOfflineQueue().catch(() => {
          // Flush failed; items remain queued. Will retry next interval.
        })
      }
    }, 10_000) // Check every 10 seconds.

    return () => clearInterval(interval)
  }, [receiptStore])

  return { receiptStore, offlineQueueLength }
}
