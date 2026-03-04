/**
 * MicroChronometer -- world-space SVG progress ring centered at (0, 0)
 * around the hub center star glyph.
 *
 * Renders a teal circle with a stroke-dasharray that fills progressively
 * over 60 seconds, creating a "minute hand" indicator. The filled portion
 * grows from 0% to 100% then resets, providing a subtle ambient timing
 * reference.
 *
 * Implementation: uses a single `<circle>` with `stroke-dashoffset`
 * animated via CSS keyframes (`enrichment-chrono-fill`). The animation
 * is 60s linear, infinite, and resets at the end of each cycle.
 *
 * SVG viewport: 80x80, positioned at (-40, -40) in world-space so the
 * ring is perfectly centered at the origin. At default zoom 0.5, the
 * 28px-radius ring renders as 14px on screen.
 *
 * Visible at Z1+ (self-gates via ZoomGate).
 *
 * @module micro-chronometer
 * @see Phase E: Ambient enrichments
 */

'use client'

import { ZoomGate } from './zoom-gate'

// ---------------------------------------------------------------------------
// Layout constants (world-space pixels)
// ---------------------------------------------------------------------------

const SVG_SIZE = 80
const CENTER = SVG_SIZE / 2
const RADIUS = 28
const STROKE_WIDTH = 2

/** Circumference of the circle (2 * PI * r). */
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const RING_STROKE = 'rgba(14, 165, 233, 0.15)'
const BG_RING_STROKE = 'rgba(14, 165, 233, 0.04)'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MicroChronometer() {
  return (
    <ZoomGate show={['Z1', 'Z2', 'Z3']}>
      <div
        className="absolute"
        style={{
          left: -(SVG_SIZE / 2),
          top: -(SVG_SIZE / 2),
          width: SVG_SIZE,
          height: SVG_SIZE,
          pointerEvents: 'none',
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          width={SVG_SIZE}
          height={SVG_SIZE}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background ring -- always visible, very faint */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={BG_RING_STROKE}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />

          {/* Progress ring -- fills over 60s via CSS animation */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            stroke={RING_STROKE}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            strokeLinecap="round"
            className="enrichment-chrono-fill"
            style={{
              // Rotate so progress starts from 12 o'clock (top)
              transformOrigin: `${CENTER}px ${CENTER}px`,
              transform: 'rotate(-90deg)',
            }}
          />
        </svg>
      </div>
    </ZoomGate>
  )
}
