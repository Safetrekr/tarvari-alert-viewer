/**
 * Hook for querying receipts with the current filter state.
 *
 * Uses the SupabaseReceiptStore (or InMemoryReceiptStore fallback)
 * for data fetching with pagination. Subscribes to new receipts
 * via ReceiptStore.subscribe() for real-time updates.
 *
 * @module use-receipt-timeline
 * @see WS-3.2 Section 4
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type { LaunchReceipt, ReceiptFilters, ReceiptStore } from '@/lib/interfaces/receipt-store'
import type { FacetedFilterState } from '@/lib/evidence-ledger-types'
import { TIME_RANGE_PRESETS } from '@/lib/evidence-ledger-types'
import { APP_DISPLAY_NAMES, type AppIdentifier } from '@/lib/interfaces/types'

// ============================================================================
// Types
// ============================================================================

export interface UseReceiptTimelineOptions {
  /** The receipt store instance. */
  readonly receiptStore: ReceiptStore
  /** Current faceted filter state. */
  readonly filters: FacetedFilterState
  /** Number of receipts to fetch per page. Default: 50. */
  readonly pageSize?: number
}

export interface UseReceiptTimelineReturn {
  /** The current page of receipts. */
  readonly receipts: LaunchReceipt[]
  /** Whether the initial load is in progress. */
  readonly isLoading: boolean
  /** Whether an error occurred during fetching. */
  readonly error: string | null
  /** Total count of receipts matching the current filters. */
  readonly totalCount: number
  /** Current page offset. */
  readonly offset: number
  /** Whether there are more receipts to load. */
  readonly hasMore: boolean
  /** Load the next page of receipts. */
  readonly loadMore: () => void
  /** Refresh the receipt list (re-query). */
  readonly refresh: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function useReceiptTimeline({
  receiptStore,
  filters,
  pageSize = 50,
}: UseReceiptTimelineOptions): UseReceiptTimelineReturn {
  const [receipts, setReceipts] = useState<LaunchReceipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)

  // Track filter changes to reset pagination
  const filtersRef = useRef(filters)

  // Build query filters from the faceted filter state
  const buildFilters = useCallback(
    (currentOffset: number): ReceiptFilters => {
      // Resolve time range
      let timeRange: { start: string; end: string } | undefined
      if (filters.timeRangePresetId !== 'all') {
        const preset = TIME_RANGE_PRESETS.find((p) => p.id === filters.timeRangePresetId)
        if (preset && preset.ms > 0) {
          const now = new Date()
          timeRange = {
            start: new Date(now.getTime() - preset.ms).toISOString(),
            end: now.toISOString(),
          }
        }
      }

      return {
        sources: filters.sources.length > 0 ? filters.sources : undefined,
        eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : undefined,
        severities: filters.severities.length > 0 ? filters.severities : undefined,
        timeRange,
        limit: pageSize,
        offset: currentOffset,
      }
    },
    [filters, pageSize],
  )

  // Fetch receipts
  const fetchReceipts = useCallback(
    async (currentOffset: number, append: boolean) => {
      try {
        setIsLoading(true)
        setError(null)

        const queryFilters = buildFilters(currentOffset)

        const [data, count] = await Promise.all([
          receiptStore.query(queryFilters),
          receiptStore.count(queryFilters),
        ])

        if (append) {
          setReceipts((prev) => [...prev, ...data])
        } else {
          setReceipts(data)
        }

        setTotalCount(count)
        setOffset(currentOffset)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load receipts'
        setError(message)
        console.error('[useReceiptTimeline] Query error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [receiptStore, buildFilters],
  )

  // Reset and re-fetch when filters change
  useEffect(() => {
    const filtersChanged =
      JSON.stringify(filters) !== JSON.stringify(filtersRef.current)

    if (filtersChanged) {
      filtersRef.current = filters
    }

    setOffset(0)
    fetchReceipts(0, false)
  }, [filters, fetchReceipts])

  // Subscribe to new receipts for real-time updates
  useEffect(() => {
    const unsubscribe = receiptStore.subscribe((newReceipt) => {
      // Check if the new receipt matches the current filters
      if (matchesFilters(newReceipt, filters)) {
        setReceipts((prev) => [newReceipt, ...prev])
        setTotalCount((prev) => prev + 1)
      }
    })

    return unsubscribe
  }, [receiptStore, filters])

  const hasMore = offset + pageSize < totalCount

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      const nextOffset = offset + pageSize
      fetchReceipts(nextOffset, true)
    }
  }, [hasMore, isLoading, offset, pageSize, fetchReceipts])

  const refresh = useCallback(() => {
    setOffset(0)
    fetchReceipts(0, false)
  }, [fetchReceipts])

  return {
    receipts,
    isLoading,
    error,
    totalCount,
    offset,
    hasMore,
    loadMore,
    refresh,
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if a receipt matches the current filter state (client-side).
 * Used for real-time subscription to decide whether to prepend new receipts.
 */
function matchesFilters(receipt: LaunchReceipt, filters: FacetedFilterState): boolean {
  // Source filter
  if (filters.sources.length > 0 && !filters.sources.includes(receipt.source)) {
    return false
  }

  // Event type filter
  if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(receipt.eventType)) {
    return false
  }

  // Severity filter
  if (filters.severities.length > 0 && !filters.severities.includes(receipt.severity)) {
    return false
  }

  // Time range filter
  if (filters.timeRangePresetId !== 'all') {
    const preset = TIME_RANGE_PRESETS.find((p) => p.id === filters.timeRangePresetId)
    if (preset && preset.ms > 0) {
      const receiptTime = new Date(receipt.timestamp).getTime()
      const cutoff = Date.now() - preset.ms
      if (receiptTime < cutoff) return false
    }
  }

  return true
}

/**
 * Get a display-friendly source label for a receipt.
 */
export function getSourceLabel(source: string): string {
  if (source === 'launch') return 'Launch'
  return APP_DISPLAY_NAMES[source as AppIdentifier] ?? source
}

/**
 * Format an ISO timestamp for display in the timeline.
 */
export function formatReceiptTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  if (isToday) return timeStr

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return `${dateStr}, ${timeStr}`
}
