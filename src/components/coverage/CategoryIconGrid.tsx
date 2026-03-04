'use client'

/**
 * CategoryIconGrid -- Z0 zoomed-out representation of coverage categories.
 *
 * Replaces ConstellationView. Shows minimal colored dots with 3-letter
 * category codes in a compact grid layout. Uses the same world-space
 * footprint as CoverageGrid so the Z0-to-Z1 crossfade reads as icons
 * expanding into cards in place.
 *
 * @module CategoryIconGrid
 * @see WS-2.1 Section 4.4
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'

import { GRID_WIDTH, GRID_HEIGHT, GRID_COLUMNS } from './CoverageGrid'
import type { CategoryGridItem } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CategoryIconGridProps {
  /** Categories with live metrics. */
  items: CategoryGridItem[]
  /** Whether the ZUI viewport is actively panning (disables glow effects). */
  isPanning?: boolean
  /** Callback when an icon is clicked (triggers zoom + morph). */
  onIconSelect?: (id: NodeId) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryIconGrid({
  items,
  isPanning = false,
  onIconSelect,
}: CategoryIconGridProps) {
  const handleIconClick = useCallback(
    (id: NodeId) => {
      onIconSelect?.(id)
    },
    [onIconSelect],
  )

  // Aggregate metrics for the bar below the icons
  const totalCategories = items.length
  const totalSources = items.reduce((sum, item) => sum + item.metrics.sourceCount, 0)
  const totalActive = items.reduce((sum, item) => sum + item.metrics.activeSources, 0)

  return (
    <motion.div
      key="category-icons"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="absolute"
      style={{
        left: -(GRID_WIDTH / 2),
        top: -(GRID_HEIGHT / 2),
        width: GRID_WIDTH,
        height: GRID_HEIGHT,
        pointerEvents: 'auto',
      }}
    >
      {/* Icon grid */}
      <div
        className="grid w-full place-items-center"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
          gap: 12,
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleIconClick(item.id)}
            className="flex flex-col items-center gap-1 rounded-lg p-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember-bright)]"
            aria-label={`${item.meta.displayName} -- ${item.metrics.sourceCount} sources`}
          >
            {/* Colored dot */}
            <div
              className="rounded-full"
              style={{
                width: 12,
                height: 12,
                backgroundColor: item.meta.color,
                boxShadow: isPanning ? 'none' : `0 0 8px ${item.meta.color}`,
              }}
            />
            {/* 3-letter code */}
            <span className="text-text-tertiary font-mono text-[9px] leading-none">
              {item.meta.shortName}
            </span>
          </button>
        ))}
      </div>

      {/* Aggregate metrics bar */}
      <div className="mt-4 flex items-center justify-center gap-8">
        <MetricLabel label="Categories" value={totalCategories} />
        <MetricLabel label="Sources" value={totalSources} />
        <MetricLabel label="Active" value={totalActive} />
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: Metric label for the aggregate bar
// ---------------------------------------------------------------------------

function MetricLabel({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-primary font-mono text-sm font-bold tabular-nums">
        {value}
      </span>
      <span className="text-text-tertiary font-mono text-[9px] uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}
