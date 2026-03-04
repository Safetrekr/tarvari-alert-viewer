/**
 * FacetChip -- A toggle chip for a single facet filter value.
 *
 * Multi-select: multiple chips within a facet group can be active
 * simultaneously (OR logic within the facet).
 *
 * Typography: 11px Geist Sans, 400 weight, 0.02em tracking.
 * Active state: ember background tint with ember border.
 *
 * @module facet-chip
 * @see WS-3.2 Section 4.3
 */

'use client'

import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import './evidence-ledger.css'

// ============================================================================
// Props
// ============================================================================

export interface FacetChipProps extends Omit<ComponentProps<'button'>, 'onChange' | 'onToggle'> {
  /** The display label for the chip. */
  readonly label: string
  /** Whether this chip is currently active (selected). */
  readonly active: boolean
  /** Called when the chip is toggled. */
  readonly onToggle: (active: boolean) => void
  /** Optional count badge (e.g., number of matching receipts). */
  readonly count?: number
}

// ============================================================================
// Component
// ============================================================================

export function FacetChip({ label, active, onToggle, count, className, ...props }: FacetChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      className={cn('facet-chip', active && 'facet-chip--active', className)}
      onClick={() => onToggle(!active)}
      {...props}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className="font-mono text-[9px] opacity-50"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
