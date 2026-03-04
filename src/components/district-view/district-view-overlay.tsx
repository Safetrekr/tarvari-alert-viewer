/**
 * DistrictViewOverlay -- full-screen overlay that appears when the
 * morph state machine reaches the `entering-district` phase.
 *
 * Viewport-fixed, fades in/out with AnimatePresence. Contains:
 * - Tinted radial gradient background (per-category color)
 * - DistrictViewContent (CategoryDetailScene)
 * - DistrictViewHeader (back button, name, category color dot)
 * - DistrictViewDock (glass panel with category metadata)
 *
 * The dock always appears on the right side (WS-2.2 Decision D-1).
 *
 * @module district-view-overlay
 * @see WS-3.1 Section 4.3
 */

'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useUIStore } from '@/stores/ui.store'
import { getCategoryColor } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'
import { DistrictViewHeader } from './district-view-header'
import { DistrictViewDock } from './district-view-dock'
import { DistrictViewContent } from './district-view-content'

// ---------------------------------------------------------------------------
// Category tint helper
// ---------------------------------------------------------------------------

/**
 * Compute a subtle radial gradient tint color from a category's display color.
 * Extracts the hex fallback from the CSS var() string and converts to rgba at 0.05 opacity.
 */
function getCategoryTint(categoryId: string): string {
  const color = getCategoryColor(categoryId)
  // getCategoryColor returns e.g. 'var(--category-seismic, #ef4444)'
  // Extract the hex fallback for inline style usage
  const hexMatch = color.match(/#([0-9a-fA-F]{6})/)
  if (!hexMatch) return 'rgba(255, 255, 255, 0.03)' // safe fallback
  const hex = hexMatch[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.05)`
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

  const districtId = targetId as NodeId | null

  // Panel always docks to the right for the grid layout (WS-2.2 Decision D-1).
  const panelSide = 'right' as const

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
              background: `radial-gradient(ellipse at ${gradientOrigin}, ${getCategoryTint(districtId)} 0%, transparent 70%)`,
              backgroundColor: 'rgba(5, 9, 17, 0.95)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />

          {/* Category detail scene content */}
          <DistrictViewContent districtId={districtId} panelSide={panelSide} />

          {/* Header (category name + back button) */}
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
