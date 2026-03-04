'use client'

import { useCallback, useState } from 'react'
import type { ReceiptStore, ReceiptInput } from '@/lib/interfaces/receipt-store'
import type { AppIdentifier } from '@/lib/interfaces/types'

// ============================================================================
// Types
// ============================================================================

export interface ReceiptStampState {
  /** Whether the stamp overlay is currently visible. */
  readonly isVisible: boolean
  /** Trace ID of the most recent stamp (4-char uppercase hex). */
  readonly traceId: string | null
  /** Timestamp of the most recent stamp (ISO 8601). */
  readonly timestamp: string | null
  /** Result summary of the most recent stamp. */
  readonly result: string | null
}

export interface UseReceiptStampReturn {
  /** Current stamp animation state. */
  readonly stampState: ReceiptStampState
  /**
   * Record an action receipt and trigger the stamp animation.
   *
   * @param actionId - The StationAction.id that was triggered.
   * @param result - Human-readable result summary (max 120 chars).
   * @returns The generated 4-char trace ID.
   */
  readonly stampReceipt: (actionId: string, result: string) => string
}

// ============================================================================
// Helpers
// ============================================================================

/** Generate a 4-character uppercase hex trace ID. */
function generateTraceId(): string {
  return Math.random().toString(16).slice(2, 6).toUpperCase()
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for creating receipt records and managing the stamp animation.
 *
 * Usage:
 * ```tsx
 * const { stampState, stampReceipt } = useReceiptStamp({
 *   receiptStore,
 *   districtId: 'agent-builder',
 *   stationName: 'Pipeline',
 * })
 *
 * // In an action handler:
 * stampReceipt('refresh-runs', 'Refreshed 12 pipeline runs')
 * ```
 *
 * The stamp animation auto-hides after 2000ms.
 *
 * @param receiptStore - The ReceiptStore to record receipts to.
 * @param districtId - The district this station belongs to.
 * @param stationName - The station name for the receipt summary.
 */
export function useReceiptStamp({
  receiptStore,
  districtId,
  stationName,
}: {
  receiptStore: ReceiptStore
  districtId: AppIdentifier
  stationName: string
}): UseReceiptStampReturn {
  const [stampState, setStampState] = useState<ReceiptStampState>({
    isVisible: false,
    traceId: null,
    timestamp: null,
    result: null,
  })

  const stampReceipt = useCallback(
    (actionId: string, result: string): string => {
      const traceId = generateTraceId()
      const timestamp = new Date().toISOString()

      // Build the receipt input per WS-1.7 ReceiptInput shape.
      // Note: detail is Record<string, unknown>, not a string.
      // The ReceiptInput interface does not have `target` or `tags` fields.
      const receiptInput: ReceiptInput = {
        source: 'launch',
        eventType: 'action',
        severity: 'info',
        summary: `${stationName}: ${result}`.slice(0, 120),
        detail: {
          actionId,
          stationName,
          districtId,
          description: `Action "${actionId}" executed in ${stationName} station of district "${districtId}".`,
        },
        actor: 'human',
        location: {
          semanticLevel: 'Z3',
          district: districtId,
          station: stationName,
        },
      }

      // Record to the store (InMemoryReceiptStore in Phase 2).
      receiptStore.record(receiptInput)

      // Show the stamp animation.
      setStampState({
        isVisible: true,
        traceId,
        timestamp,
        result,
      })

      // Auto-hide after 2000ms.
      setTimeout(() => {
        setStampState((prev) => ({ ...prev, isVisible: false }))
      }, 2000)

      return traceId
    },
    [receiptStore, districtId, stationName]
  )

  return { stampState, stampReceipt }
}
