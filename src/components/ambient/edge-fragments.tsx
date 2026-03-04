/**
 * EdgeFragments -- world-space discovery elements positioned at extreme
 * distances from the hub center (3000-6000px out).
 *
 * Rewards exploration with 8 "found message" blocks scattered at the
 * edges of the navigable space. Each block contains monospace text with
 * a lore/system aesthetic -- signal intercepts, operator logs, navigation
 * marks, and calibration records.
 *
 * Visual treatment:
 * - At Z2+: small crosshair marks (+) become visible at each position,
 *   hinting that something is there
 * - At Z3: the full text blocks become readable
 *
 * Text is intentionally at extremely low opacity (0.06) with the first
 * line slightly brighter (0.12) to create a hierarchy of discovery.
 *
 * Self-gates via ZoomGate for both visibility tiers.
 *
 * @module edge-fragments
 * @see Phase E: Ambient enrichments
 */

'use client'

import { ZoomGate } from './zoom-gate'

// ---------------------------------------------------------------------------
// Fragment data
// ---------------------------------------------------------------------------

interface Fragment {
  x: number
  y: number
  lines: string[]
}

const FRAGMENTS: Fragment[] = [
  {
    x: -4200,
    y: -3100,
    lines: ['SIGNAL DECODED', 'TARVA GENESIS', 'EPOCH 0'],
  },
  {
    x: 3800,
    y: -2700,
    lines: ['OPERATOR LOG', '"The workspace is alive."'],
  },
  {
    x: -3500,
    y: 4200,
    lines: ['SUBSYSTEM TRACE', 'MODULE: SPATIAL_ENGINE', 'STATUS: NOMINAL'],
  },
  {
    x: 4500,
    y: 3800,
    lines: ['MEMORY FRAGMENT', '"Everything connects."'],
  },
  {
    x: -5000,
    y: 1200,
    lines: ['CALIBRATION RECORD', 'DATUM: 2026-02-27', 'VERIFIED'],
  },
  {
    x: 5200,
    y: -1500,
    lines: ['COMM INTERCEPT', 'FREQ: 11434 MHz', 'OLLAMA LINK'],
  },
  {
    x: 2800,
    y: 5500,
    lines: ['NAVIGATION MARK', 'DIST: 5.2 KM', 'BRG: 127\u00B0'],
  },
  {
    x: -3200,
    y: -5000,
    lines: ['SYSTEM LOG', '"The first agent was built here."'],
  },
]

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CROSSHAIR_SIZE = 12
const CROSSHAIR_COLOR = 'rgba(255, 255, 255, 0.04)'
const TEXT_COLOR = 'rgba(255, 255, 255, 0.06)'
const HEADING_COLOR = 'rgba(255, 255, 255, 0.12)'
const BORDER_COLOR = 'rgba(255, 255, 255, 0.03)'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Small + crosshair mark at a world-space position. */
function Crosshair({ x, y }: { x: number; y: number }) {
  const half = CROSSHAIR_SIZE / 2
  return (
    <div
      className="absolute"
      style={{
        left: x - half,
        top: y - half,
        width: CROSSHAIR_SIZE,
        height: CROSSHAIR_SIZE,
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox={`0 0 ${CROSSHAIR_SIZE} ${CROSSHAIR_SIZE}`}
        width={CROSSHAIR_SIZE}
        height={CROSSHAIR_SIZE}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Horizontal arm */}
        <line
          x1={0}
          y1={half}
          x2={CROSSHAIR_SIZE}
          y2={half}
          stroke={CROSSHAIR_COLOR}
          strokeWidth={1}
        />
        {/* Vertical arm */}
        <line
          x1={half}
          y1={0}
          x2={half}
          y2={CROSSHAIR_SIZE}
          stroke={CROSSHAIR_COLOR}
          strokeWidth={1}
        />
      </svg>
    </div>
  )
}

/** Text block with bordered container. */
function FragmentBlock({ fragment }: { fragment: Fragment }) {
  return (
    <div
      className="absolute"
      style={{
        left: fragment.x,
        top: fragment.y + CROSSHAIR_SIZE,
        maxWidth: 240,
        padding: 16,
        border: `1px solid ${BORDER_COLOR}`,
        pointerEvents: 'none',
      }}
    >
      {fragment.lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 14,
            fontWeight: 400,
            color: i === 0 ? HEADING_COLOR : TEXT_COLOR,
            letterSpacing: '0.08em',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Composite Component
// ---------------------------------------------------------------------------

export function EdgeFragments() {
  return (
    <>
      {/* Crosshairs visible at Z2+ */}
      <ZoomGate show={['Z2', 'Z3']}>
        {FRAGMENTS.map((frag, i) => (
          <Crosshair key={`xh-${i}`} x={frag.x} y={frag.y} />
        ))}
      </ZoomGate>

      {/* Full text blocks visible at Z3 only */}
      <ZoomGate show={['Z3']}>
        {FRAGMENTS.map((frag, i) => (
          <FragmentBlock key={`fb-${i}`} fragment={frag} />
        ))}
      </ZoomGate>
    </>
  )
}
