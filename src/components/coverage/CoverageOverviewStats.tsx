'use client'

/**
 * CoverageOverviewStats -- three KPI stat rows for the coverage grid.
 *
 * Stacked vertically to the left of the CoverageGrid in world-space.
 * Each row shows icon + label + value in a single horizontal line.
 *
 * Zoom-gated to Z1+ (wired in page.tsx, not here).
 *
 * @module CoverageOverviewStats
 * @see WS-2.1 Section 4.5
 */

import { Database, Activity, Grid3x3, type LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CoverageOverviewStatsProps {
  /** Total intel sources across all categories. */
  totalSources: number
  /** Sources with status === 'active'. */
  activeSources: number
  /** Number of unique categories with >= 1 source. */
  categoriesCovered: number
  /** Whether the data is still loading (shows skeleton state). */
  isLoading?: boolean
}

// ---------------------------------------------------------------------------
// Stat row
// ---------------------------------------------------------------------------

function StatRow({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: LucideIcon
  label: string
  value: number
  isLoading: boolean
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3
        bg-[rgba(var(--ambient-ink-rgb),0.05)] backdrop-blur-[12px] backdrop-saturate-[120%]
        border-[rgba(var(--ambient-ink-rgb),0.10)]"
    >
      <Icon size={16} className="shrink-0 text-[var(--color-text-tertiary)]" />
      <span className="text-[var(--color-text-secondary)] font-mono text-[11px] tracking-wider uppercase whitespace-nowrap">
        {label}
      </span>
      <span className="ml-auto text-[var(--color-text-primary)] font-mono text-lg font-bold tabular-nums">
        {isLoading ? '—' : value}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CoverageOverviewStats({
  totalSources,
  activeSources,
  categoriesCovered,
  isLoading = false,
}: CoverageOverviewStatsProps) {
  return (
    <div className="flex flex-col gap-3" style={{ width: 200 }}>
      <StatRow icon={Database} label="Total Sources" value={totalSources} isLoading={isLoading} />
      <StatRow icon={Activity} label="Active Sources" value={activeSources} isLoading={isLoading} />
      <StatRow icon={Grid3x3} label="Categories" value={categoriesCovered} isLoading={isLoading} />
    </div>
  )
}
