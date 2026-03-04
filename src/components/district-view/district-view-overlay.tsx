/**
 * DistrictViewOverlay -- full-screen overlay that appears when the
 * morph state machine reaches the `entering-district` phase.
 *
 * Viewport-fixed, fades in/out with AnimatePresence. Contains:
 * - Tinted radial gradient background (per-district color)
 * - DistrictViewContent (ambient scene)
 * - DistrictViewHeader (back button, name, health dot)
 * - DistrictViewDock (glass panel with controls)
 *
 * The layout mirrors based on `panelSide`: districts whose morph
 * panel opened on the right keep the dock on the right and back
 * button on the left. Districts that opened on the left get the
 * opposite — dock on the left, back button on the right — so the
 * spatial illusion of "moving toward" the clicked capsule is
 * preserved.
 *
 * @module district-view-overlay
 */

'use client'

import { useMemo } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useUIStore } from '@/stores/ui.store'
import { DISTRICTS, type DistrictId } from '@/lib/interfaces/district'
import { computeRingRotation, type PanelSide } from '@/lib/morph-types'
import { DistrictViewHeader } from './district-view-header'
import { DistrictViewDock } from './district-view-dock'
import { DistrictViewContent } from './district-view-content'

// ---------------------------------------------------------------------------
// Per-district background tints
// ---------------------------------------------------------------------------

const DISTRICT_TINTS: Record<DistrictId, string> = {
  'agent-builder': 'rgba(var(--ember-rgb), 0.06)',
  'tarva-chat': 'rgba(14, 165, 233, 0.06)',
  'project-room': 'rgba(var(--healthy-rgb), 0.04)',
  'tarva-core': 'rgba(168, 85, 247, 0.05)',
  'tarva-erp': 'rgba(245, 158, 11, 0.04)',
  'tarva-code': 'rgba(99, 102, 241, 0.04)',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPanelSideForDistrict(districtId: DistrictId): PanelSide {
  const district = DISTRICTS.find((d) => d.id === districtId)
  if (!district) return 'right'
  return computeRingRotation(district.ringIndex).panelSide
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictViewOverlay() {
  const phase = useUIStore((s) => s.morph.phase)
  const targetId = useUIStore((s) => s.morph.targetId)
  const reverseMorph = useUIStore((s) => s.reverseMorph)

  const isVisible =
    phase === 'entering-district' ||
    phase === 'district' ||
    phase === 'leaving-district'

  const districtId = targetId as DistrictId | null

  const panelSide = useMemo(
    () => (districtId ? getPanelSideForDistrict(districtId) : 'right'),
    [districtId],
  )

  // Gradient origin follows the dock side
  const gradientOrigin = panelSide === 'right' ? '40% 50%' : '60% 50%'

  return (
    <AnimatePresence>
      {isVisible && districtId && (
        <motion.div
          key="district-view-overlay"
          className="district-view-active"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 30,
            overflow: 'hidden',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Tinted radial gradient background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at ${gradientOrigin}, ${DISTRICT_TINTS[districtId]} 0%, transparent 70%)`,
              backgroundColor: 'rgba(5, 9, 17, 0.95)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />

          {/* Ambient scene content */}
          <DistrictViewContent districtId={districtId} panelSide={panelSide} />

          {/* Header (district name + back button) */}
          <DistrictViewHeader
            districtId={districtId}
            panelSide={panelSide}
            onBack={reverseMorph}
          />

          {/* Dock panel */}
          <DistrictViewDock districtId={districtId} panelSide={panelSide} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
