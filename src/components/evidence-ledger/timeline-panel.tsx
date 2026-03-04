/**
 * TimelinePanel -- Z3 full interactive panel.
 *
 * Combines FacetedFilter + scrollable list of TimelineItems.
 * Uses ReceiptStore for receipt data fetching with pagination.
 * Shows loading skeleton, empty state, and error state gracefully.
 *
 * @module timeline-panel
 * @see WS-3.2 Section 4
 */

'use client'

import { motion } from 'motion/react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LaunchReceipt, ReceiptStore } from '@/lib/interfaces/receipt-store'
import { useReceiptTimeline } from '@/hooks/use-receipt-timeline'
import { useFacetedFilter } from '@/hooks/use-faceted-filter'
import { FacetedFilter } from './faceted-filter'
import { TimelineItem } from './timeline-item'
import './evidence-ledger.css'

// ============================================================================
// Props
// ============================================================================

export interface TimelinePanelProps {
  /** The receipt store instance for data fetching. */
  readonly receiptStore: ReceiptStore
  /** Callback when a receipt is rehydrated (camera navigation). */
  readonly onRehydrate?: (receipt: LaunchReceipt) => void
}

// ============================================================================
// Component
// ============================================================================

export function TimelinePanel({ receiptStore, onRehydrate }: TimelinePanelProps) {
  const {
    filters,
    toggleSource,
    toggleEventType,
    toggleSeverity,
    setTimeRange,
    resetAll,
    hasActiveFilters,
  } = useFacetedFilter()

  const {
    receipts,
    isLoading,
    error,
    totalCount,
    hasMore,
    loadMore,
    refresh,
  } = useReceiptTimeline({
    receiptStore,
    filters,
    pageSize: 50,
  })

  return (
    <motion.div
      className="timeline-panel"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Header */}
      <div className="timeline-panel-header">
        <span className="timeline-panel-title">Evidence Ledger</span>
        <div className="flex items-center gap-2">
          <span className="timeline-panel-count">
            {isLoading ? '...' : `${totalCount} receipt${totalCount !== 1 ? 's' : ''}`}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="p-1 rounded opacity-40 hover:opacity-80 transition-opacity"
            aria-label="Refresh receipts"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[var(--color-text-secondary,#92a9b4)]" />
          </button>
        </div>
      </div>

      {/* Faceted filter bar */}
      <FacetedFilter
        filters={filters}
        onToggleSource={toggleSource}
        onToggleEventType={toggleEventType}
        onToggleSeverity={toggleSeverity}
        onSetTimeRange={setTimeRange}
        onResetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Receipt list */}
      <div
        className="flex-1 overflow-y-auto min-h-0"
        role="list"
        aria-label="Receipt timeline"
      >
        {/* Error state */}
        {error && (
          <div className="timeline-empty">
            <span className="timeline-empty-icon">!</span>
            <p className="timeline-empty-text">
              Failed to load receipts: {error}
            </p>
            <button
              type="button"
              className="mt-3 text-[var(--color-ember-bright,#ff773c)] font-sans text-[12px] font-medium hover:opacity-80"
              onClick={refresh}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && receipts.length === 0 && !error && (
          <div>
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && receipts.length === 0 && (
          <div className="timeline-empty">
            <span className="timeline-empty-icon" aria-hidden="true">
              {hasActiveFilters ? 'x' : '-'}
            </span>
            <p className="timeline-empty-text">
              {hasActiveFilters
                ? 'No receipts match the current filters.'
                : 'No receipts recorded yet.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="mt-3 text-[var(--color-ember-bright,#ff773c)] font-sans text-[12px] font-medium hover:opacity-80"
                onClick={resetAll}
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Receipt items */}
        {receipts.map((receipt) => (
          <div key={receipt.id} role="listitem">
            <TimelineItem receipt={receipt} onRehydrate={onRehydrate} />
          </div>
        ))}

        {/* Load more */}
        {hasMore && !isLoading && (
          <div className="timeline-load-more">
            <button
              type="button"
              className="font-sans text-[12px] font-medium text-[var(--color-text-secondary,#92a9b4)] hover:text-[var(--color-text-primary,#def6ff)] transition-colors"
              onClick={loadMore}
            >
              Load more receipts
            </button>
          </div>
        )}

        {/* Loading indicator for pagination */}
        {isLoading && receipts.length > 0 && (
          <div className="timeline-load-more">
            <span className="font-mono text-[11px] text-[var(--color-text-tertiary,#55667a)] opacity-50">
              Loading...
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ============================================================================
// Skeleton
// ============================================================================

function SkeletonItem() {
  return (
    <div className="timeline-skeleton-item">
      <div className="timeline-skeleton-bar" style={{ width: 28, height: 28, borderRadius: 6 }} />
      <div className="flex-1">
        <div className="timeline-skeleton-bar" style={{ width: '80%', height: 14, marginBottom: 6 }} />
        <div className="timeline-skeleton-bar" style={{ width: '50%', height: 10 }} />
      </div>
    </div>
  )
}
