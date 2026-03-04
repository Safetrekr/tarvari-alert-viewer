/**
 * MorphOrchestrator -- coordinates the capsule ring, detail panel,
 * connector lines, and constellation view across semantic zoom levels.
 *
 * Responsibilities:
 * 1. At Z0: renders ConstellationView (beacons + global metrics).
 * 2. At Z1+: hosts the capsule ring and morph state.
 * 3. When a capsule is selected, renders DetailPanel offset to the
 *    appropriate side with SVG ConnectorLines.
 * 4. Handles click-outside for deselection (Escape key handled by choreography).
 *
 * @module morph-orchestrator
 * @see WS-2.1 Section 4.6
 * @see WS-2.7 Section 4.7
 */

'use client'

import { useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'motion/react'
import { useMorphChoreography } from '@/hooks/use-morph-choreography'
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import { useCameraStore } from '@/stores/camera.store'
import { getDistrictWorldPosition, getDistrictById } from '@/lib/spatial-actions'
import { computeRingRotation, RING_SHIFT } from '@/lib/morph-types'
import { CapsuleRing, computeCapsuleCenter, RING_CENTER } from './capsule-ring'
import { ConstellationView } from './constellation-view'
import { DetailPanel } from './detail-panel'
import { ConnectorLines } from './connector-lines'
import type { CapsuleData, DistrictId } from '@/lib/interfaces/district'

interface MorphOrchestratorProps {
  /** Capsule data from the telemetry system. */
  data: CapsuleData[]
  /** Whether the user prefers reduced motion. */
  prefersReducedMotion: boolean
  /** Whether the ZUI viewport is actively panning. */
  isPanning?: boolean
}

export function MorphOrchestrator({
  data,
  prefersReducedMotion,
  isPanning = false,
}: MorphOrchestratorProps) {
  const { isConstellation } = useSemanticZoom()
  const { phase, direction, targetId, startMorph, reverseMorph } = useMorphChoreography({
    prefersReducedMotion,
  })

  // Handle capsule selection (Z1+ click)
  const handleCapsuleSelect = useCallback(
    (id: DistrictId) => {
      if (phase === 'idle') {
        startMorph(id)
      }
    },
    [phase, startMorph],
  )

  // Handle beacon selection (Z0 click): zoom in to district, then morph.
  const handleBeaconSelect = useCallback(
    (id: DistrictId) => {
      if (phase !== 'idle') return

      const district = getDistrictById(id)
      if (!district) return

      const pos = getDistrictWorldPosition(district.ringIndex)
      const { viewportWidth, viewportHeight, flyTo } = useCameraStore.getState()

      const targetZoom = 1.0
      const targetOffsetX = viewportWidth / 2 - pos.x * targetZoom
      const targetOffsetY = viewportHeight / 2 - pos.y * targetZoom
      flyTo(targetOffsetX, targetOffsetY, targetZoom)

      setTimeout(() => {
        startMorph(id)
      }, 350)
    },
    [phase, startMorph],
  )

  // Compute capsule center for the selected district
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

  // Show panel when not idle (expanding, settled, entering-district, district)
  // Hide panel during reverse expanding (AnimatePresence handles exit)
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

  // Always use the portalled (promoted) panel — no inline panel, no blink
  const showPromotedPanel = showPanel && targetId && selectedRingIndex !== null

  return (
    <>
      {/* Z0/Z1+ switching: constellation beacons vs capsule ring */}
      <AnimatePresence mode="wait">
        {isConstellation ? (
          <ConstellationView key="z0" isPanning={isPanning} onBeaconSelect={handleBeaconSelect} />
        ) : (
          <CapsuleRing
            key="z1"
            data={data}
            selectedId={targetId}
            onSelect={handleCapsuleSelect}
            morphPhase={phase}
            panelSide={panelSide}
            ringRotation={ringRotation}
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
            {/* Panel is always rendered via portal below */}
          </CapsuleRing>
        )}
      </AnimatePresence>

      {/* Promoted (viewport-fixed) panel during district view — portalled to body */}
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
