/**
 * MorphOrchestrator -- coordinates the coverage grid, detail panel,
 * and category icon grid across semantic zoom levels.
 *
 * Responsibilities:
 * 1. At Z0: renders CategoryIconGrid (colored dots + codes).
 * 2. At Z1+: hosts the coverage grid and morph state.
 * 3. When a card is selected, triggers startMorph. The detail panel
 *    slides in from the right with scale+fade animation (Decision 3).
 * 4. Handles click-outside for deselection (Escape key handled by choreography).
 *
 * @module morph-orchestrator
 * @see WS-2.2 Section 4.1
 */

'use client'

import { useCallback } from 'react'
import { AnimatePresence } from 'motion/react'
import { useMorphChoreography } from '@/hooks/use-morph-choreography'
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import { useCameraStore } from '@/stores/camera.store'
import { CoverageGrid } from '@/components/coverage/CoverageGrid'
import { CategoryIconGrid } from '@/components/coverage/CategoryIconGrid'
import type { CategoryGridItem } from '@/lib/interfaces/coverage'
import type { CoverageMetrics } from '@/lib/coverage-utils'
import type { NodeId } from '@/lib/interfaces/district'

interface MorphOrchestratorProps {
  /** Category grid items with live metrics. */
  items: CategoryGridItem[]
  /** Full coverage metrics (used for overview stats, passed through). */
  metrics: CoverageMetrics | undefined
  /** Whether the user prefers reduced motion. */
  prefersReducedMotion: boolean
  /** Whether the ZUI viewport is actively panning. */
  isPanning?: boolean
  /** Currently filtered category IDs. */
  filteredIds?: string[]
  /** Callback when a card's filter button is clicked. */
  onFilter?: (id: NodeId) => void
}

export function MorphOrchestrator({
  items,
  metrics: _metrics,
  prefersReducedMotion,
  isPanning = false,
  filteredIds,
  onFilter,
}: MorphOrchestratorProps) {
  const { isConstellation } = useSemanticZoom()
  const { phase, targetId, startMorph } = useMorphChoreography({
    prefersReducedMotion,
  })

  // Handle card selection (Z1+ click)
  const handleCapsuleSelect = useCallback(
    (id: NodeId) => {
      if (phase === 'idle') {
        startMorph(id)
      }
    },
    [phase, startMorph],
  )

  // Handle icon selection (Z0 click): zoom to Z1 center, then morph.
  // For category IDs, zoom to world origin (grid is centered there).
  const handleIconSelect = useCallback(
    (id: NodeId) => {
      if (phase !== 'idle') return

      const { viewportWidth, viewportHeight, flyTo } = useCameraStore.getState()
      const targetZoom = 1.0
      const targetOffsetX = viewportWidth / 2
      const targetOffsetY = viewportHeight / 2
      flyTo(targetOffsetX, targetOffsetY, targetZoom)

      setTimeout(() => {
        startMorph(id)
      }, 350)
    },
    [phase, startMorph],
  )

  return (
    <>
      {/* Z0/Z1+ switching: category icon dots vs coverage grid */}
      <AnimatePresence mode="wait">
        {isConstellation ? (
          <CategoryIconGrid
            key="z0"
            items={items}
            isPanning={isPanning}
            onIconSelect={handleIconSelect}
          />
        ) : (
          <CoverageGrid
            key="z1"
            items={items}
            selectedId={targetId}
            onSelect={handleCapsuleSelect}
            morphPhase={phase}
            filteredIds={filteredIds}
            onFilter={onFilter}
          />
        )}
      </AnimatePresence>
    </>
  )
}
