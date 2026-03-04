/**
 * MorphOrchestrator -- coordinates the coverage grid, detail panel,
 * connector lines, and category icon grid across semantic zoom levels.
 *
 * Responsibilities:
 * 1. At Z0: renders CategoryIconGrid (colored dots + codes).
 * 2. At Z1+: hosts the coverage grid and morph state.
 * 3. When a card is selected, triggers startMorph. The detail panel and
 *    connector lines remain from the legacy ring system and will short-circuit
 *    for category IDs (panel does not appear -- WS-2.2 adapts positioning).
 * 4. Handles click-outside for deselection (Escape key handled by choreography).
 *
 * @module morph-orchestrator
 * @see WS-2.1 Section 4.8
 * @see WS-2.2 (morph adaptation for grid layout)
 */

'use client'

import { useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'motion/react'
import { useMorphChoreography } from '@/hooks/use-morph-choreography'
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import { useCameraStore } from '@/stores/camera.store'
import { getDistrictById } from '@/lib/spatial-actions'
import { computeRingRotation, RING_SHIFT } from '@/lib/morph-types'
import { computeCapsuleCenter } from './capsule-ring'
import { CoverageGrid } from '@/components/coverage/CoverageGrid'
import { CategoryIconGrid } from '@/components/coverage/CategoryIconGrid'
import { DetailPanel } from './detail-panel'
import { ConnectorLines } from './connector-lines'
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
}

export function MorphOrchestrator({
  items,
  metrics: _metrics,
  prefersReducedMotion,
  isPanning = false,
}: MorphOrchestratorProps) {
  const { isConstellation } = useSemanticZoom()
  const { phase, direction, targetId, startMorph, reverseMorph } = useMorphChoreography({
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
  // For category IDs (not legacy districts), zoom to world origin.
  const handleBeaconSelect = useCallback(
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

  // ---------------------------------------------------------------------------
  // Ring-specific geometry (short-circuits for category IDs)
  // ---------------------------------------------------------------------------
  // Category IDs like 'seismic' are not in DISTRICTS, so getDistrictById
  // returns undefined. This means selectedRingIndex/selectedCapsuleCenter
  // are null, showPanel is false, and no panel or connectors appear.
  // This is intentional per AC-17 -- WS-2.2 adapts positioning for the grid.

  const selectedRingIndex = useMemo(() => {
    if (!targetId) return null
    const district = getDistrictById(targetId)
    return district?.ringIndex ?? null
  }, [targetId])

  const selectedCapsuleCenter = useMemo(() => {
    if (selectedRingIndex === null) return null
    return computeCapsuleCenter(selectedRingIndex)
  }, [selectedRingIndex])

  // Compute ring rotation and panel side
  const { panelSide, ringRotation } = useMemo(() => {
    if (targetId === null || selectedRingIndex === null || phase === 'idle') {
      return { panelSide: null, ringRotation: 0 }
    }
    const result = computeRingRotation(selectedRingIndex)
    return { panelSide: result.panelSide, ringRotation: result.rotation }
  }, [targetId, selectedRingIndex, phase])

  // Compute ring shift values for connector line endpoint calculation
  const ringShift = useMemo(() => {
    if (!panelSide) return { x: 0, scale: 1, rotation: 0 }
    return {
      x: panelSide === 'right' ? -RING_SHIFT.offset : RING_SHIFT.offset,
      scale: RING_SHIFT.scale,
      rotation: ringRotation,
    }
  }, [panelSide, ringRotation])

  // Show panel when not idle and ring geometry is available
  // For category IDs, selectedCapsuleCenter is null so showPanel is false.
  const showPanel =
    targetId !== null &&
    selectedCapsuleCenter !== null &&
    selectedRingIndex !== null &&
    (phase === 'expanding' && direction === 'forward' ||
     phase === 'settled' ||
     phase === 'entering-district' ||
     phase === 'district')

  // Panel is "promoted" to fixed viewport-centered during district view
  const isDistrictView = phase === 'entering-district' || phase === 'district'

  // Hide connector lines once the district overlay takes over
  const showConnector = showPanel && !isDistrictView

  // Always use the portalled (promoted) panel
  const showPromotedPanel = showPanel && targetId && selectedRingIndex !== null

  return (
    <>
      {/* Z0/Z1+ switching: category icon dots vs coverage grid */}
      <AnimatePresence mode="wait">
        {isConstellation ? (
          <CategoryIconGrid
            key="z0"
            items={items}
            isPanning={isPanning}
            onIconSelect={handleBeaconSelect}
          />
        ) : (
          <CoverageGrid
            key="z1"
            items={items}
            selectedId={targetId}
            onSelect={handleCapsuleSelect}
            morphPhase={phase}
          >
            {/* Click-outside backdrop: closes the panel when clicking off it */}
            {showPanel && !isDistrictView && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 10,
                  pointerEvents: 'auto',
                }}
                onClick={reverseMorph}
              />
            )}
            <AnimatePresence>
              {showConnector && selectedCapsuleCenter && selectedRingIndex !== null && (
                <ConnectorLines
                  key="connector"
                  ringIndex={selectedRingIndex}
                  capsuleCenter={selectedCapsuleCenter}
                  ringShift={ringShift}
                />
              )}
            </AnimatePresence>
          </CoverageGrid>
        )}
      </AnimatePresence>

      {/* Promoted (viewport-fixed) panel during district view -- portalled to body */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showPromotedPanel && (
              <DetailPanel
                key="promoted-panel"
                districtId={targetId!}
                ringIndex={selectedRingIndex!}
                onClose={reverseMorph}
                promoted
                dockSide={panelSide ?? 'right'}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
