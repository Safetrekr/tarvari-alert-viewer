'use client'

/**
 * CoverageGrid -- CSS Grid container for coverage category cards.
 *
 * Renders at Z1+ zoom levels, positioned at world origin. Replaces
 * the CapsuleRing circular layout with a flat 8-column grid.
 *
 * @module CoverageGrid
 * @see WS-2.1 Section 4.2
 */

import type { ReactNode } from 'react'
import { motion } from 'motion/react'

import { CategoryCard } from './CategoryCard'
import type { CategoryGridItem } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'
import type { MorphPhase } from '@/lib/morph-types'

// ---------------------------------------------------------------------------
// Layout constants (world-space pixels, per Decision 2)
// ---------------------------------------------------------------------------

/** Grid container dimensions in world-space pixels. */
export const GRID_WIDTH = 1600
export const GRID_HEIGHT = 400
export const GRID_COLUMNS = 9
export const GRID_GAP = 16

/** Card dimensions within the grid. */
export const CARD_WIDTH = 160
export const CARD_HEIGHT = 180

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CoverageGridProps {
  /** Categories with live metrics, pre-filtered to those with >= 1 source. */
  items: CategoryGridItem[]
  /** Currently selected category ID, or null. */
  selectedId: NodeId | null
  /** Callback when a card is clicked. */
  onSelect: (id: NodeId) => void
  /** Current morph phase (controls dim/scale on cards). */
  morphPhase?: MorphPhase
  /** Currently filtered category IDs. */
  filteredIds?: string[]
  /** Callback when a card's filter button is clicked. */
  onFilter?: (id: NodeId) => void
  /** Children rendered inside the grid container (e.g. ConnectorLines overlay). */
  children?: ReactNode
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CoverageGrid({
  items,
  selectedId,
  onSelect,
  morphPhase,
  filteredIds = [],
  onFilter,
  children,
}: CoverageGridProps) {
  const hasSelection = selectedId !== null
  const hasFilter = filteredIds.length > 0
  const activeMorphPhase = morphPhase ?? 'idle'

  return (
    <motion.div
      key="coverage-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="absolute"
      data-morph-phase={activeMorphPhase}
      style={{
        left: -(GRID_WIDTH / 2),
        top: -(GRID_HEIGHT / 2),
        width: GRID_WIDTH,
        height: GRID_HEIGHT,
        pointerEvents: 'auto',
      }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
          gap: GRID_GAP,
        }}
      >
        {items.map((item) => (
          <CategoryCard
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            hasSelection={hasSelection}
            onSelect={onSelect}
            onFilter={onFilter}
            isFiltered={filteredIds.includes(item.id)}
            isDimmedByFilter={hasFilter && !filteredIds.includes(item.id)}
          />
        ))}
      </div>
      {children}
    </motion.div>
  )
}
