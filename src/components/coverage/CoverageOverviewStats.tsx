'use client'

/**
 * CoverageOverviewStats -- three KPI metric cards for the coverage grid.
 *
 * Positioned above the CoverageGrid in world-space. Uses @tarva/ui KpiCard
 * with glass material overrides for the spatial ZUI context.
 *
 * Zoom-gated to Z1+ (wired in page.tsx, not here -- keeps component zoom-agnostic).
 *
 * @module CoverageOverviewStats
 * @see WS-2.1 Section 4.5
 */

import { Database, Activity, Grid3x3 } from 'lucide-react'
import { KpiCard } from '@tarva/ui'

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
// Glass material class string for overriding KpiCard bg-card
// ---------------------------------------------------------------------------

const GLASS_CLASSES =
  'bg-[rgba(var(--ambient-ink-rgb),0.05)] backdrop-blur-[12px] backdrop-saturate-[120%] border-[rgba(var(--ambient-ink-rgb),0.10)]'

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
    <div className="flex items-stretch gap-[25px]">
      <KpiCard
        className={GLASS_CLASSES}
        label="Total Sources"
        value={totalSources}
        valueFormat="number"
        icon={<Database size={16} />}
        size="sm"
        glow={false}
        loading={isLoading}
      />
      <KpiCard
        className={GLASS_CLASSES}
        label="Active Sources"
        value={activeSources}
        valueFormat="number"
        icon={<Activity size={16} />}
        size="sm"
        glow={activeSources > 0}
        loading={isLoading}
      />
      <KpiCard
        className={GLASS_CLASSES}
        label="Categories"
        value={categoriesCovered}
        valueFormat="number"
        icon={<Grid3x3 size={16} />}
        size="sm"
        glow={false}
        loading={isLoading}
      />
    </div>
  )
}
