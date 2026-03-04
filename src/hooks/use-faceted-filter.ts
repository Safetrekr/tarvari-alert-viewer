/**
 * Hook for managing Evidence Ledger faceted filter state.
 *
 * Provides toggle actions for each facet group (source, event type,
 * severity, time range) and converts the UI state into ReceiptFilters
 * compatible with the ReceiptStore.query() API.
 *
 * Filter logic:
 * - Within a facet group: OR (any selected value matches)
 * - Across facet groups: AND (all active groups must match)
 * - Empty selection within a group: no filter applied (show all)
 *
 * @module use-faceted-filter
 * @see WS-3.2 Section 4.4
 */

'use client'

import { useCallback, useMemo, useState } from 'react'

import type { EventType, ReceiptSource, Severity } from '@/lib/interfaces/types'
import type { ReceiptFilters } from '@/lib/interfaces/receipt-store'
import {
  type FacetedFilterState,
  TIME_RANGE_PRESETS,
} from '@/lib/evidence-ledger-types'

// ============================================================================
// Return type
// ============================================================================

export interface UseFacetedFilterReturn {
  /** Current filter UI state. */
  readonly filters: FacetedFilterState
  /** Toggle a source filter on/off. */
  readonly toggleSource: (source: ReceiptSource) => void
  /** Toggle an event type filter on/off. */
  readonly toggleEventType: (eventType: EventType) => void
  /** Toggle a severity filter on/off. */
  readonly toggleSeverity: (severity: Severity) => void
  /** Set the active time range preset. */
  readonly setTimeRange: (presetId: string) => void
  /** Reset all filters to defaults. */
  readonly resetAll: () => void
  /** Whether any filters are currently active. */
  readonly hasActiveFilters: boolean
  /** Convert current filter state to ReceiptFilters for querying. */
  readonly toReceiptFilters: (options?: { limit?: number; offset?: number }) => ReceiptFilters
}

// ============================================================================
// Initial state
// ============================================================================

const INITIAL_STATE: FacetedFilterState = {
  sources: [],
  eventTypes: [],
  severities: [],
  timeRangePresetId: 'all',
}

// ============================================================================
// Hook
// ============================================================================

export function useFacetedFilter(): UseFacetedFilterReturn {
  const [filters, setFilters] = useState<FacetedFilterState>(INITIAL_STATE)

  const toggleSource = useCallback((source: ReceiptSource) => {
    setFilters((prev) => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source],
    }))
  }, [])

  const toggleEventType = useCallback((eventType: EventType) => {
    setFilters((prev) => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter((t) => t !== eventType)
        : [...prev.eventTypes, eventType],
    }))
  }, [])

  const toggleSeverity = useCallback((severity: Severity) => {
    setFilters((prev) => ({
      ...prev,
      severities: prev.severities.includes(severity)
        ? prev.severities.filter((s) => s !== severity)
        : [...prev.severities, severity],
    }))
  }, [])

  const setTimeRange = useCallback((presetId: string) => {
    setFilters((prev) => ({
      ...prev,
      timeRangePresetId: presetId,
    }))
  }, [])

  const resetAll = useCallback(() => {
    setFilters(INITIAL_STATE)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.sources.length > 0 ||
      filters.eventTypes.length > 0 ||
      filters.severities.length > 0 ||
      filters.timeRangePresetId !== 'all'
    )
  }, [filters])

  const toReceiptFilters = useCallback(
    (options?: { limit?: number; offset?: number }): ReceiptFilters => {
      const result: ReceiptFilters = {
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      }

      if (filters.sources.length > 0) {
        return {
          ...result,
          sources: filters.sources,
          eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
          severities: filters.severities.length > 0 ? filters.severities : undefined,
          timeRange: resolveTimeRange(filters.timeRangePresetId),
        }
      }

      return {
        ...result,
        sources: filters.sources.length > 0 ? filters.sources : undefined,
        eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
        severities: filters.severities.length > 0 ? filters.severities : undefined,
        timeRange: resolveTimeRange(filters.timeRangePresetId),
      }
    },
    [filters],
  )

  return {
    filters,
    toggleSource,
    toggleEventType,
    toggleSeverity,
    setTimeRange,
    resetAll,
    hasActiveFilters,
    toReceiptFilters,
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert a time range preset ID to start/end ISO timestamps.
 * Returns undefined if preset is 'all' (no time filter).
 */
function resolveTimeRange(
  presetId: string,
): { start: string; end: string } | undefined {
  if (presetId === 'all') return undefined

  const preset = TIME_RANGE_PRESETS.find((p) => p.id === presetId)
  if (!preset || preset.ms === 0) return undefined

  const now = new Date()
  const start = new Date(now.getTime() - preset.ms)

  return {
    start: start.toISOString(),
    end: now.toISOString(),
  }
}

// Re-export for consumer convenience
export type { FacetedFilterState } from '@/lib/evidence-ledger-types'
