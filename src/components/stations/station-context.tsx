'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'

// ============================================================================
// Context Shape
// ============================================================================

export interface StationContextValue {
  /** Which district this station belongs to. */
  readonly districtId: AppIdentifier
  /** The template driving this station's layout. */
  readonly template: StationTemplate
  /** The receipt store for recording actions. */
  readonly receiptStore: ReceiptStore
  /**
   * Trigger a receipt stamp for a station action.
   * Returns the generated trace ID (4-char hex, e.g., "7F2A").
   *
   * @param actionId - The StationAction.id that was triggered.
   * @param result - Human-readable result summary (max 120 chars).
   */
  readonly stampReceipt: (actionId: string, result: string) => string
}

// ============================================================================
// Context
// ============================================================================

const StationContext = createContext<StationContextValue | null>(null)

/** Read station context. Throws if used outside a StationPanel. */
export function useStationContext(): StationContextValue {
  const ctx = useContext(StationContext)
  if (!ctx) {
    throw new Error(
      'useStationContext must be used within a <StationPanel>. ' +
        'Ensure the component is rendered inside a StationPanel.'
    )
  }
  return ctx
}

// ============================================================================
// Provider
// ============================================================================

export interface StationProviderProps {
  readonly value: StationContextValue
  readonly children: ReactNode
}

export function StationProvider({ value, children }: StationProviderProps) {
  return <StationContext.Provider value={value}>{children}</StationContext.Provider>
}
