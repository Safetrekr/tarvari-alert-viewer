/**
 * CalibrationMarks -- fixed-position viewport overlay with four L-shaped
 * corner registration marks and contextual center labels.
 *
 * Creates a "viewfinder" aesthetic with:
 * - Four L-shaped corner marks (12px from each viewport edge)
 * - Top-center label showing the current sector (derived from camera
 *   position mapped to the sector grid)
 * - Bottom-center "DATUM FEED" label
 *
 * This is a viewport-fixed element (NOT world-space) -- it stays pinned
 * to the viewport edges regardless of camera position or zoom.
 *
 * Only visible at Z2+ (district and station zoom levels).
 *
 * Sector derivation: Camera world-space coordinates are mapped to the
 * 4x4 sector grid (-4000 to +4000 on both axes, 2000px intervals).
 * Row = A-D (top to bottom), Col = 1-4 (left to right).
 *
 * @module calibration-marks
 * @see Phase E: Ambient enrichments
 */

'use client'

import { useCameraStore } from '@/stores/camera.store'
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Distance from viewport edge to corner marks. */
const EDGE_OFFSET = 12

/** Length of each L-shape arm. */
const ARM_LENGTH = 16

/** Line color for corner marks. */
const MARK_COLOR = 'rgba(255, 255, 255, 0.06)'

/** Label text color. */
const LABEL_COLOR = 'rgba(255, 255, 255, 0.08)'

// ---------------------------------------------------------------------------
// Sector derivation
// ---------------------------------------------------------------------------

const ROW_LABELS = ['A', 'B', 'C', 'D'] as const
const COL_LABELS = ['1', '2', '3', '4'] as const

/**
 * Convert camera world-space position to a sector label.
 *
 * The camera store holds offsetX/offsetY which are CSS translate values.
 * World-space origin (0,0) corresponds to offset = (viewportWidth/2, viewportHeight/2)
 * at zoom 1.0. The world-space coordinate the camera is looking at:
 *   worldX = (viewportWidth/2 - offsetX) / zoom
 *   worldY = (viewportHeight/2 - offsetY) / zoom
 *
 * Then map worldX/worldY into the sector grid:
 *   -4000...-2000 = col 1 / row A
 *   -2000...0     = col 2 / row B
 *   0...2000      = col 3 / row C
 *   2000...4000   = col 4 / row D
 */
function deriveSector(
  offsetX: number,
  offsetY: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
): string {
  const worldX = (viewportWidth / 2 - offsetX) / zoom
  const worldY = (viewportHeight / 2 - offsetY) / zoom

  // Clamp to grid bounds and compute index (0-3)
  const colIndex = Math.min(3, Math.max(0, Math.floor((worldX + 4000) / 2000)))
  const rowIndex = Math.min(3, Math.max(0, Math.floor((worldY + 4000) / 2000)))

  return `SEC ${ROW_LABELS[rowIndex]}${COL_LABELS[colIndex]}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalibrationMarks() {
  const { level } = useSemanticZoom()
  const offsetX = useCameraStore((s) => s.offsetX)
  const offsetY = useCameraStore((s) => s.offsetY)
  const zoom = useCameraStore((s) => s.zoom)
  const viewportWidth = useCameraStore((s) => s.viewportWidth)
  const viewportHeight = useCameraStore((s) => s.viewportHeight)

  // Only visible at Z2+
  if (level !== 'Z2' && level !== 'Z3') return null

  const sector = deriveSector(offsetX, offsetY, zoom, viewportWidth, viewportHeight)

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: 9,
    fontWeight: 500,
    color: LABEL_COLOR,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    pointerEvents: 'none',
    lineHeight: 1,
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Top-right L-mark */}
      <div
        style={{
          position: 'absolute',
          top: EDGE_OFFSET,
          right: EDGE_OFFSET,
          width: ARM_LENGTH,
          height: ARM_LENGTH,
          borderTop: `1px solid ${MARK_COLOR}`,
          borderRight: `1px solid ${MARK_COLOR}`,
        }}
      />

      {/* Top-left L-mark */}
      <div
        style={{
          position: 'absolute',
          top: EDGE_OFFSET,
          left: EDGE_OFFSET,
          width: ARM_LENGTH,
          height: ARM_LENGTH,
          borderTop: `1px solid ${MARK_COLOR}`,
          borderLeft: `1px solid ${MARK_COLOR}`,
        }}
      />

      {/* Bottom-left L-mark */}
      <div
        style={{
          position: 'absolute',
          bottom: EDGE_OFFSET,
          left: EDGE_OFFSET,
          width: ARM_LENGTH,
          height: ARM_LENGTH,
          borderBottom: `1px solid ${MARK_COLOR}`,
          borderLeft: `1px solid ${MARK_COLOR}`,
        }}
      />

      {/* Bottom-right L-mark */}
      <div
        style={{
          position: 'absolute',
          bottom: EDGE_OFFSET,
          right: EDGE_OFFSET,
          width: ARM_LENGTH,
          height: ARM_LENGTH,
          borderBottom: `1px solid ${MARK_COLOR}`,
          borderRight: `1px solid ${MARK_COLOR}`,
        }}
      />

      {/* Top-center sector label */}
      <div
        style={{
          position: 'absolute',
          top: EDGE_OFFSET,
          left: '50%',
          transform: 'translateX(-50%)',
          ...labelStyle,
        }}
      >
        {sector}
      </div>

      {/* Bottom-center DATUM FEED label */}
      <div
        style={{
          position: 'absolute',
          bottom: EDGE_OFFSET,
          left: '50%',
          transform: 'translateX(-50%)',
          ...labelStyle,
        }}
      >
        DATUM FEED
      </div>
    </div>
  )
}
