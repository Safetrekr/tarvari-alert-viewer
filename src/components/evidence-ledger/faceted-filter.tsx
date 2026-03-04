/**
 * FacetedFilter -- Faceted filter bar for the Evidence Ledger timeline.
 *
 * Four facet rows:
 * 1. Source -- Filter by app or Launch origin.
 * 2. Type -- Filter by event classification.
 * 3. Severity -- Filter by urgency level.
 * 4. Time -- Filter by time range preset.
 *
 * Multi-select within each facet (OR logic).
 * AND logic across facets.
 *
 * @module faceted-filter
 * @see WS-3.2 Section 4.4
 */

'use client'

import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import {
  ALL_APP_IDS,
  APP_DISPLAY_NAMES,
  type EventType,
  type ReceiptSource,
  type Severity,
} from '@/lib/interfaces/types'
import { TIME_RANGE_PRESETS } from '@/lib/evidence-ledger-types'
import type { FacetedFilterState } from '@/hooks/use-faceted-filter'
import { FacetChip } from './facet-chip'
import './evidence-ledger.css'

// ============================================================================
// Constants
// ============================================================================

/** All source options: 'launch' + each app identifier. */
const SOURCE_OPTIONS: readonly { id: ReceiptSource; label: string }[] = [
  { id: 'launch', label: 'Launch' },
  ...ALL_APP_IDS.map((id) => ({ id: id as ReceiptSource, label: APP_DISPLAY_NAMES[id] })),
]

const EVENT_TYPE_OPTIONS: readonly { id: EventType; label: string }[] = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'action', label: 'Action' },
  { id: 'error', label: 'Error' },
  { id: 'approval', label: 'Approval' },
  { id: 'system', label: 'System' },
]

const SEVERITY_OPTIONS: readonly { id: Severity; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'warning', label: 'Warning' },
  { id: 'error', label: 'Error' },
  { id: 'critical', label: 'Critical' },
]

// ============================================================================
// Props
// ============================================================================

export interface FacetedFilterProps extends ComponentProps<'div'> {
  /** Current filter state. */
  readonly filters: FacetedFilterState
  /** Toggle a source in the filter. */
  readonly onToggleSource: (source: ReceiptSource) => void
  /** Toggle an event type in the filter. */
  readonly onToggleEventType: (eventType: EventType) => void
  /** Toggle a severity level in the filter. */
  readonly onToggleSeverity: (severity: Severity) => void
  /** Set the time range preset. */
  readonly onSetTimeRange: (presetId: string) => void
  /** Reset all filters to default (no filters). */
  readonly onResetAll: () => void
  /** Whether any filters are active (for showing reset button). */
  readonly hasActiveFilters: boolean
}

// ============================================================================
// Component
// ============================================================================

export function FacetedFilter({
  filters,
  onToggleSource,
  onToggleEventType,
  onToggleSeverity,
  onSetTimeRange,
  onResetAll,
  hasActiveFilters,
  className,
  ...props
}: FacetedFilterProps) {
  return (
    <div className={cn('facet-bar', className)} role="group" aria-label="Receipt filters" {...props}>
      {/* Source facet */}
      <div className="facet-row">
        <span className="facet-label">Source</span>
        {SOURCE_OPTIONS.map((opt) => (
          <FacetChip
            key={opt.id}
            label={opt.label}
            active={filters.sources.includes(opt.id)}
            onToggle={() => onToggleSource(opt.id)}
          />
        ))}
      </div>

      {/* Type facet */}
      <div className="facet-row">
        <span className="facet-label">Type</span>
        {EVENT_TYPE_OPTIONS.map((opt) => (
          <FacetChip
            key={opt.id}
            label={opt.label}
            active={filters.eventTypes.includes(opt.id)}
            onToggle={() => onToggleEventType(opt.id)}
          />
        ))}
      </div>

      {/* Severity facet */}
      <div className="facet-row">
        <span className="facet-label">Severity</span>
        {SEVERITY_OPTIONS.map((opt) => (
          <FacetChip
            key={opt.id}
            label={opt.label}
            active={filters.severities.includes(opt.id)}
            onToggle={() => onToggleSeverity(opt.id)}
          />
        ))}
      </div>

      {/* Time range facet */}
      <div className="facet-row">
        <span className="facet-label">Time</span>
        {TIME_RANGE_PRESETS.map((preset) => (
          <FacetChip
            key={preset.id}
            label={preset.label}
            active={filters.timeRangePresetId === preset.id}
            onToggle={() => onSetTimeRange(preset.id)}
          />
        ))}
        {hasActiveFilters && (
          <button
            type="button"
            className="ml-auto font-sans text-[10px] font-medium tracking-wider uppercase text-[var(--color-ember-bright,#ff773c)] opacity-70 hover:opacity-100 transition-opacity"
            onClick={onResetAll}
            aria-label="Reset all filters"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
