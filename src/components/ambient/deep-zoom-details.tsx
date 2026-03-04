/**
 * DeepZoomDetails -- visual rewards for users who zoom in to Z2/Z3.
 *
 * Contains three sub-elements that create a PCB/circuit board aesthetic:
 *
 * 1. **Circuit Traces** (Z2+): L-shaped dashed SVG paths scattered around
 *    the ring area, resembling printed circuit board traces.
 *
 * 2. **Data Inscriptions** (Z3 only): Tiny monospace text labels at specific
 *    coordinates that reward deep-zoom exploration. Like manufacturing
 *    labels stamped on circuit boards -- nearly invisible until zoomed in.
 *
 * 3. **Capacitor Dots** (Z2+): Small glowing dots at trace endpoints/corners,
 *    resembling solder points on a PCB. One or two pulse slowly.
 *
 * Each sub-element self-gates via ZoomGate so the parent component can
 * be placed anywhere in the tree without additional gating logic.
 *
 * @module deep-zoom-details
 * @see Phase D: Discovery elements & polish
 */

'use client'

import { ZoomGate } from './zoom-gate'
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'

// ---------------------------------------------------------------------------
// Circuit Traces (Z2+)
// ---------------------------------------------------------------------------

interface CircuitTrace {
  /** Starting X coordinate (world-space, relative to ring center). */
  x: number
  /** Starting Y coordinate (world-space, relative to ring center). */
  y: number
  /** Length of horizontal segment. */
  hLen: number
  /** Length of vertical segment. */
  vLen: number
  /** Direction: 'right-down' | 'right-up' | 'left-down' | 'left-up'. */
  dir: 'rd' | 'ru' | 'ld' | 'lu'
}

const CIRCUIT_TRACES: CircuitTrace[] = [
  { x: -450, y: -380, hLen: 60, vLen: 40, dir: 'rd' },
  { x: 420,  y: -350, hLen: 50, vLen: 70, dir: 'ld' },
  { x: -500, y: 200,  hLen: 80, vLen: 50, dir: 'ru' },
  { x: 480,  y: 250,  hLen: 40, vLen: 60, dir: 'lu' },
  { x: -380, y: 500,  hLen: 70, vLen: 45, dir: 'rd' },
  { x: 350,  y: 480,  hLen: 55, vLen: 55, dir: 'ld' },
  { x: -550, y: -100, hLen: 65, vLen: 40, dir: 'rd' },
  { x: 520,  y: -80,  hLen: 45, vLen: 50, dir: 'lu' },
]

const TRACE_STROKE = 'rgba(var(--ember-rgb), 0.04)'

/**
 * Build an SVG path string for an L-shaped trace.
 * The path goes horizontal first, then turns 90 degrees vertically.
 */
function tracePath(trace: CircuitTrace): string {
  const { x, y, hLen, vLen, dir } = trace
  const hSign = dir === 'rd' || dir === 'ru' ? 1 : -1
  const vSign = dir === 'rd' || dir === 'ld' ? 1 : -1

  const cornerX = x + hLen * hSign
  const cornerY = y
  const endX = cornerX
  const endY = cornerY + vLen * vSign

  return `M ${x} ${y} L ${cornerX} ${cornerY} L ${endX} ${endY}`
}

/**
 * Get the corner point of an L-shaped trace (where it turns 90 degrees).
 */
function traceCorner(trace: CircuitTrace): { x: number; y: number } {
  const hSign = trace.dir === 'rd' || trace.dir === 'ru' ? 1 : -1
  return { x: trace.x + trace.hLen * hSign, y: trace.y }
}

/**
 * Get the endpoint of an L-shaped trace.
 */
function traceEnd(trace: CircuitTrace): { x: number; y: number } {
  const hSign = trace.dir === 'rd' || trace.dir === 'ru' ? 1 : -1
  const vSign = trace.dir === 'rd' || trace.dir === 'ld' ? 1 : -1
  const cornerX = trace.x + trace.hLen * hSign
  return { x: cornerX, y: trace.y + trace.vLen * vSign }
}

/** SVG viewport size -- large enough to contain all traces. */
const SVG_SIZE = 1400
const CENTER = SVG_SIZE / 2

function CircuitTraces() {
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
      >
        {CIRCUIT_TRACES.map((trace, i) => (
          <path
            key={i}
            d={tracePath({
              ...trace,
              x: trace.x + CENTER,
              y: trace.y + CENTER,
            })}
            stroke={TRACE_STROKE}
            strokeWidth={1}
            strokeDasharray="3 3"
            fill="none"
          />
        ))}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Capacitor Dots (Z2+)
// ---------------------------------------------------------------------------

interface CapacitorDot {
  x: number
  y: number
  /** Whether this dot should pulse. */
  pulse: boolean
}

/**
 * Generate capacitor dots from trace start points, corners, and endpoints.
 * Select a subset for visual variety (not every trace point gets a dot).
 */
const CAPACITOR_DOTS: CapacitorDot[] = [
  // Trace start points (4 selected)
  { x: CIRCUIT_TRACES[0].x, y: CIRCUIT_TRACES[0].y, pulse: false },
  { x: CIRCUIT_TRACES[2].x, y: CIRCUIT_TRACES[2].y, pulse: true },
  { x: CIRCUIT_TRACES[5].x, y: CIRCUIT_TRACES[5].y, pulse: false },
  { x: CIRCUIT_TRACES[7].x, y: CIRCUIT_TRACES[7].y, pulse: false },
  // Trace corners (4 selected)
  { ...traceCorner(CIRCUIT_TRACES[1]), pulse: false },
  { ...traceCorner(CIRCUIT_TRACES[3]), pulse: true },
  { ...traceCorner(CIRCUIT_TRACES[6]), pulse: false },
  { ...traceCorner(CIRCUIT_TRACES[4]), pulse: false },
  // Trace endpoints (4 selected)
  { ...traceEnd(CIRCUIT_TRACES[0]), pulse: false },
  { ...traceEnd(CIRCUIT_TRACES[2]), pulse: false },
  { ...traceEnd(CIRCUIT_TRACES[5]), pulse: false },
  { ...traceEnd(CIRCUIT_TRACES[7]), pulse: false },
]

const DOT_COLOR = 'rgba(14, 165, 233, 0.06)'
const DOT_RADIUS = 1.5 // 3px diameter in world-space

function CapacitorDots() {
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
      >
        {CAPACITOR_DOTS.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x + CENTER}
            cy={dot.y + CENTER}
            r={DOT_RADIUS}
            fill={DOT_COLOR}
            className={dot.pulse ? 'enrichment-capacitor-pulse' : undefined}
          />
        ))}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Data Inscriptions (Z3 only)
// ---------------------------------------------------------------------------

interface Inscription {
  text: string
  x: number
  y: number
  /** Whether this inscription contains dynamic zoom data. */
  dynamic?: boolean
}

const INSCRIPTIONS: Inscription[] = [
  // Original 7
  { text: 'SPATIAL_ENGINE: CSS_TRANSFORMS', x: -380, y: 350 },
  { text: 'TARVA LAUNCH // MISSION CONTROL', x: 0, y: 480 },
  { text: 'EMBER: #E05200 // TEAL: #0EA5E9', x: 350, y: -350 },
  { text: 'BUILD: NEXT.JS_16 // REACT_19', x: -350, y: -450 },
  { text: '', x: 400, y: 400, dynamic: true },
  { text: 'AGENT_PLATFORM // LOCAL_FIRST', x: -480, y: 50 },
  { text: 'SPATIAL_CANVAS // WORLD_ORIGIN', x: 200, y: -500 },
  // Extended inscriptions (8 more, spread across quadrants)
  { text: 'AGENT_GEN_CLI // PYTHON_3.12', x: -520, y: -300 },
  { text: 'SUPABASE_PG // PORT_54521', x: 480, y: -480 },
  { text: 'OLLAMA_LLM // PORT_11434', x: 550, y: 120 },
  { text: 'KNOWLEDGE_MCP // ACTIVE', x: -560, y: 400 },
  { text: 'CAPSULE_RING // R_300PX', x: 320, y: 550 },
  { text: 'ZUSTAND_5 // IMMER_MW', x: -420, y: -550 },
  { text: 'DEPLOY_TARGET // VERCEL_EDGE', x: 500, y: -180 },
  { text: '', x: -300, y: 580, dynamic: true },
]

const INSCRIPTION_FILL = 'rgba(255, 255, 255, 0.04)'

function DataInscriptions() {
  const { level, zoom } = useSemanticZoom()

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
      >
        {INSCRIPTIONS.map((ins, i) => {
          const displayText = ins.dynamic
            ? `ZOOM: ${level} // SCALE: ${zoom.toFixed(2)}`
            : ins.text

          // Center the middle inscription horizontally
          const anchor =
            ins.x === 0 ? 'middle' : ins.x > 0 ? 'start' : 'end'

          return (
            <text
              key={i}
              x={ins.x + CENTER}
              y={ins.y + CENTER}
              textAnchor={anchor}
              fill={INSCRIPTION_FILL}
              fontFamily="var(--font-mono, monospace)"
              fontSize={14}
              letterSpacing="0.15em"
              style={{ textTransform: 'uppercase' } as React.CSSProperties}
            >
              {displayText}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Composite Component
// ---------------------------------------------------------------------------

export function DeepZoomDetails() {
  return (
    <>
      <ZoomGate show={['Z2', 'Z3']}>
        <CircuitTraces />
        <CapacitorDots />
      </ZoomGate>
      <ZoomGate show={['Z3']}>
        <DataInscriptions />
      </ZoomGate>
    </>
  )
}
