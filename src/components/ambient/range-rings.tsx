/**
 * RangeRings -- concentric SVG circles with compass markings and a
 * rotating radar-sweep indicator.
 *
 * Renders a 1600x1600 SVG centered at world-space (0, 0), containing:
 * 1. Three concentric circles at radii 450, 560, 700px (just outside
 *    the 300px capsule orbit radius), with ghost-white 1px strokes.
 * 2. Tick marks at 15-degree intervals on the middle ring (560px).
 * 3. Cardinal direction labels (N, E, S, W) on the outer ring (700px)
 *    in ghost-white monospace text at 18px world-space size.
 * 4. A single radar-sweep line from center to outer radius, rotating
 *    at 24s/revolution via CSS `@keyframes` (defined in enrichment.css).
 *
 * At default zoom 0.5, the outer ring renders at ~350px screen radius,
 * providing a subtle "mission control" feel beyond the capsule orbit.
 *
 * Gated by ZoomGate to only appear at Z1/Z2 (not at Z0 constellation
 * or Z3 station views where the detail would be too far/too close).
 *
 * @module range-rings
 * @see WS-1.6 Ambient Effects Layer
 */

'use client'

import { useAttentionStore } from '@/stores/attention.store'

// ---------------------------------------------------------------------------
// Layout constants (world-space pixels)
// ---------------------------------------------------------------------------

/** SVG viewBox size -- large enough to cover rings visible at Z0. */
const SVG_SIZE = 12000
const CENTER = SVG_SIZE / 2

/** Radii for concentric rings -- extend outward so they remain visible at all zoom levels. */
const RING_RADII = [450, 560, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000] as const

/** Tick marks are placed on the middle ring at this interval. */
const TICK_INTERVAL_DEG = 15
const TICK_LENGTH = 12
const TICK_RING_INDEX = 1

/** Cardinal labels are placed on the outer ring. */
const CARDINAL_RING_INDEX = 2
const LABEL_OFFSET = 24 // Extra offset beyond the outer ring for labels

/** The radar sweep line extends from center to the outermost ring. */
const SWEEP_RADIUS = RING_RADII[RING_RADII.length - 1]

/** Ghost-white stroke color. */
const RING_STROKE = 'rgba(var(--ambient-ink-rgb), 0.06)'
const TICK_STROKE = 'rgba(var(--ambient-ink-rgb), 0.08)'
const SWEEP_STROKE = 'rgba(var(--ember-rgb), 0.12)'
const LABEL_FILL = 'rgba(var(--ambient-ink-rgb), 0.10)'

// ---------------------------------------------------------------------------
// Static geometry (computed once at module level)
// ---------------------------------------------------------------------------

/** Tick mark endpoints on the middle ring. */
const TICK_MARKS: Array<{ x1: number; y1: number; x2: number; y2: number }> = []

for (let deg = 0; deg < 360; deg += TICK_INTERVAL_DEG) {
  // Skip cardinal positions -- those get labels instead
  if (deg % 90 === 0) continue

  const rad = (deg * Math.PI) / 180
  const innerR = RING_RADII[TICK_RING_INDEX] - TICK_LENGTH / 2
  const outerR = RING_RADII[TICK_RING_INDEX] + TICK_LENGTH / 2

  TICK_MARKS.push({
    x1: CENTER + innerR * Math.cos(rad),
    y1: CENTER + innerR * Math.sin(rad),
    x2: CENTER + outerR * Math.cos(rad),
    y2: CENTER + outerR * Math.sin(rad),
  })
}

/** Cardinal direction labels with their positions. */
const CARDINALS: Array<{ label: string; x: number; y: number }> = [
  {
    label: 'N / SYS',
    x: CENTER,
    y: CENTER - RING_RADII[CARDINAL_RING_INDEX] - LABEL_OFFSET,
  },
  {
    label: 'E / OPS',
    x: CENTER + RING_RADII[CARDINAL_RING_INDEX] + LABEL_OFFSET,
    y: CENTER,
  },
  {
    label: 'S / DOCK',
    x: CENTER,
    y: CENTER + RING_RADII[CARDINAL_RING_INDEX] + LABEL_OFFSET,
  },
  {
    label: 'W / FORGE',
    x: CENTER - RING_RADII[CARDINAL_RING_INDEX] - LABEL_OFFSET,
    y: CENTER,
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RangeRings() {
  const isTightening = useAttentionStore((s) => s.attentionState === 'tighten')

  const baseRingOpacity = isTightening ? 0.18 : 0.10
  const tickStroke = `rgba(var(--ambient-ink-rgb), ${isTightening ? 0.14 : 0.08})`

  /** Fade outer rings: first 3 at full opacity, then steep fade so large rings stay behind cards. */
  function ringStrokeForIndex(i: number): string {
    const fade = i < 3 ? 1.0 : Math.max(0.12, 1.0 - (i - 2) * 0.25)
    return `rgba(var(--ambient-ink-rgb), ${(baseRingOpacity * fade).toFixed(4)})`
  }

  return (
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
        style={{ transition: 'opacity 500ms ease' }}
      >
        {/* Concentric rings -- outer rings progressively fade */}
        {RING_RADII.map((radius, i) => (
          <circle
            key={radius}
            cx={CENTER}
            cy={CENTER}
            r={radius}
            stroke={ringStrokeForIndex(i)}
            strokeWidth={1}
            style={{ transition: 'stroke 500ms ease' }}
          />
        ))}

        {/* Tick marks on the middle ring */}
        {TICK_MARKS.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke={tickStroke}
            strokeWidth={1}
            style={{ transition: 'stroke 500ms ease' }}
          />
        ))}

        {/* Cardinal direction labels */}
        {CARDINALS.map((cardinal) => (
          <text
            key={cardinal.label}
            x={cardinal.x}
            y={cardinal.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={LABEL_FILL}
            fontFamily="var(--font-mono, monospace)"
            fontSize={18}
            letterSpacing="0.1em"
          >
            {cardinal.label}
          </text>
        ))}

        {/* Gradient definition (outside rotating group for correctness) */}
        <defs>
          <linearGradient
            id="sweep-gradient"
            x1={CENTER}
            y1={CENTER}
            x2={CENTER}
            y2={CENTER - SWEEP_RADIUS}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="rgba(var(--ember-rgb), 0.18)" />
            <stop offset="100%" stopColor="rgba(var(--ember-rgb), 0)" />
          </linearGradient>
        </defs>

        {/* Radar sweep line (rotates via CSS animation) */}
        <g className="enrichment-sweep">
          <line
            x1={CENTER}
            y1={CENTER}
            x2={CENTER}
            y2={CENTER - SWEEP_RADIUS}
            stroke={SWEEP_STROKE}
            strokeWidth={1}
          />
          {/* Faint gradient trail on the sweep line */}
          <line
            x1={CENTER}
            y1={CENTER}
            x2={CENTER}
            y2={CENTER - SWEEP_RADIUS}
            stroke="url(#sweep-gradient)"
            strokeWidth={2}
            opacity={0.3}
          />
        </g>
      </svg>
    </div>
  )
}
