/**
 * Evidence Ledger type definitions.
 *
 * Types for the NW-quadrant Evidence Ledger district, which displays
 * receipt timeline data at two zoom representations:
 * - Z2 (TimelineStrip): compressed density bar
 * - Z3 (TimelinePanel): full interactive panel with faceted filtering
 *
 * @module evidence-ledger-types
 * @see WS-3.2 (Evidence Ledger)
 */

import type {
  Actor,
  EventType,
  ReceiptSource,
  Severity,
} from './interfaces/types'

// ============================================================================
// View Mode
// ============================================================================

/** Which representation the Evidence Ledger renders. */
export type LedgerViewMode = 'strip' | 'panel'

// ============================================================================
// Faceted Filter
// ============================================================================

/** A single option within a facet group. */
export interface FacetOption<T extends string = string> {
  /** Unique identifier for the option. */
  readonly id: T
  /** Display label shown in the chip. */
  readonly label: string
}

/** A group of related filter options (one facet row). */
export interface FacetGroup<T extends string = string> {
  /** Unique identifier for the facet group. */
  readonly id: string
  /** Label displayed at the start of the facet row. */
  readonly label: string
  /** Available options in this group. */
  readonly options: readonly FacetOption<T>[]
}

/** Active filter state for the Evidence Ledger. */
export interface FacetedFilterState {
  /** Active source filters (OR logic within). */
  readonly sources: readonly ReceiptSource[]
  /** Active event type filters (OR logic within). */
  readonly eventTypes: readonly EventType[]
  /** Active severity filters (OR logic within). */
  readonly severities: readonly Severity[]
  /** Active time range preset ID, or null for 'all'. */
  readonly timeRangePresetId: string
}

// ============================================================================
// Timeline Strip (Z2)
// ============================================================================

/** A single segment in the Z2 density bar. */
export interface DensitySegment {
  /** Start time of the segment. */
  readonly start: string
  /** End time of the segment. */
  readonly end: string
  /** Number of human-initiated receipts in this time window. */
  readonly humanCount: number
  /** Number of AI-initiated receipts in this time window. */
  readonly aiCount: number
  /** Number of system-initiated receipts in this time window. */
  readonly systemCount: number
  /** Total receipt count (human + ai + system). */
  readonly total: number
}

// ============================================================================
// Timeline Item (Z3)
// ============================================================================

/** Display-ready data for a single receipt in the timeline list. */
export interface TimelineItemData {
  /** Receipt ID (UUID v7). */
  readonly id: string
  /** Human-readable summary text (max 120 chars). */
  readonly summary: string
  /** Formatted timestamp for display (e.g., "2:34 PM" or "Feb 26, 2:34 PM"). */
  readonly formattedTime: string
  /** Raw ISO timestamp for sorting. */
  readonly timestamp: string
  /** Source app display name. */
  readonly sourceLabel: string
  /** Raw source identifier. */
  readonly source: ReceiptSource
  /** Event type. */
  readonly eventType: EventType
  /** Severity level. */
  readonly severity: Severity
  /** Actor type (human/ai/system). */
  readonly actor: Actor
  /** Whether this item has a rehydration target. */
  readonly hasTarget: boolean
  /** Whether this item has detail data. */
  readonly hasDetail: boolean
  /** Correlation ID for linking related receipts. */
  readonly correlationId: string | null
  /** Duration in ms (if applicable). */
  readonly durationMs: number | null
}

// ============================================================================
// Rehydration
// ============================================================================

/** State of a rehydration action in progress. */
export interface RehydrationState {
  /** Whether rehydration is currently in progress. */
  readonly isRehydrating: boolean
  /** The receipt ID being rehydrated. */
  readonly receiptId: string | null
}

// ============================================================================
// Time Range Presets
// ============================================================================

/** A time range preset option for the filter bar. */
export interface TimeRangePreset {
  /** Unique preset ID. */
  readonly id: string
  /** Display label (e.g., "1h", "24h"). */
  readonly label: string
  /** Duration in milliseconds. 0 means "all time". */
  readonly ms: number
}

/** Available time range presets. */
export const TIME_RANGE_PRESETS: readonly TimeRangePreset[] = [
  { id: '1h', label: '1h', ms: 60 * 60 * 1000 },
  { id: '24h', label: '24h', ms: 24 * 60 * 60 * 1000 },
  { id: '7d', label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
  { id: 'all', label: 'All', ms: 0 },
] as const
