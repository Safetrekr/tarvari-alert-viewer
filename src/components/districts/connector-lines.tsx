/**
 * ConnectorLines -- SVG connector from shifted capsule edge to detail panel edge.
 *
 * Renders a dashed ember-colored line with animated pathLength draw-in.
 * Positioned absolutely within the ring container, sharing its coordinate system.
 *
 * When the ring shifts (split-screen morph), the connector endpoints account
 * for the ring's translate + scale transform so the line visually connects
 * the capsule to the panel.
 *
 * @module connector-lines
 * @see WS-2.1 Section 4.11
 */

'use client'

import { motion } from 'motion/react'

import {
  CAPSULE_DIMENSIONS,
  DETAIL_PANEL_DIMENSIONS,
  getPanelSide,
  computePanelPosition,
} from '@/lib/morph-types'
import { RING_SIZE, RING_CENTER } from './capsule-ring'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConnectorLinesProps {
  ringIndex: number
  capsuleCenter: { x: number; y: number }
  /** Current ring shift state: x offset, scale factor, and rotation in degrees. */
  ringShift: { x: number; scale: number; rotation: number }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectorLines({ ringIndex, capsuleCenter, ringShift }: ConnectorLinesProps) {
  const side = getPanelSide(ringIndex)
  const panelPos = computePanelPosition(ringIndex, RING_CENTER)
  const { scale, x: shiftX, rotation } = ringShift

  // Compute the shifted + rotated capsule center in ring container coordinates.
  // The motion.div transform: rotate(deg) + scale(s) from center, then translate(shiftX, 0).
  // First rotate around ring center:
  const radians = (rotation * Math.PI) / 180
  const relX = capsuleCenter.x - RING_CENTER
  const relY = capsuleCenter.y - RING_CENTER
  const rotatedRelX = relX * Math.cos(radians) - relY * Math.sin(radians)
  const rotatedRelY = relX * Math.sin(radians) + relY * Math.cos(radians)
  // Then scale from center and shift:
  const shiftedCx = RING_CENTER + rotatedRelX * scale + shiftX
  const shiftedCy = RING_CENTER + rotatedRelY * scale

  // Capsule half-width also scales with the ring
  const halfCapsuleScaled = (CAPSULE_DIMENSIONS.width / 2) * scale

  // Start: shifted capsule edge center (right or left edge depending on panel side)
  const startX = side === 'right'
    ? shiftedCx + halfCapsuleScaled
    : shiftedCx - halfCapsuleScaled
  const startY = shiftedCy

  // End: panel near edge at the shifted capsule's Y level
  // Clamp Y to panel bounds so line connects to the panel surface
  const panelTop = panelPos.top
  const panelBottom = panelPos.top + DETAIL_PANEL_DIMENSIONS.height
  const endY = Math.max(panelTop + 20, Math.min(panelBottom - 20, shiftedCy))

  const endX = side === 'right'
    ? panelPos.left
    : panelPos.left + DETAIL_PANEL_DIMENSIONS.width

  // Straight line or very gentle curve
  const d = `M ${startX} ${startY} L ${endX} ${endY}`

  return (
    <svg
      className="pointer-events-none absolute"
      style={{
        left: 0,
        top: 0,
        width: RING_SIZE,
        height: RING_SIZE,
        overflow: 'visible',
        zIndex: 15,
      }}
    >
      <motion.path
        d={d}
        stroke="rgba(var(--ember-rgb), 0.5)"
        strokeWidth={2}
        fill="none"
        strokeDasharray="8 6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.7 }}
        exit={{
          pathLength: 0,
          opacity: 0,
          transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
        }}
        transition={{
          pathLength: { duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.2, delay: 0.05 },
        }}
      />
    </svg>
  )
}
