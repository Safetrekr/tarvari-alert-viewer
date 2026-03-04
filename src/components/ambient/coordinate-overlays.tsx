/**
 * CoordinateOverlays -- registration marks and crosshairs that give
 * the spatial canvas a "technical drawing" feel.
 *
 * Renders a 1000x1000 SVG centered at world-space (0, 0) containing:
 * 1. Hub crosshair: two perpendicular lines through center with a
 *    32px gap so the hub star glyph shows through.
 * 2. Corner registration marks: 4 L-shaped brackets at the corners
 *    of a 900x900 bounding box.
 * 3. Axis labels: small monospace text at each crosshair endpoint
 *    (X+, X-, Y+, Y-).
 *
 * All elements are static (no animation). Extremely low opacity
 * ensures they register as subtle environmental detail without
 * competing with interactive elements.
 *
 * @module coordinate-overlays
 * @see WS-1.6 Ambient Effects Layer
 */

'use client'

// ---------------------------------------------------------------------------
// Layout constants (world-space pixels)
// ---------------------------------------------------------------------------

const SVG_SIZE = 1000
const CENTER = SVG_SIZE / 2

/** Crosshair arm length from center (half-length of each full line). */
const CROSSHAIR_ARM = 40

/** Gap radius around center so the hub star remains visible. */
const CROSSHAIR_GAP = 16

/** Bounding box side for corner registration marks. */
const REG_BOX = 900
const REG_HALF = REG_BOX / 2
const REG_ARM = 20

/** Stroke colors. */
const CROSSHAIR_STROKE = 'rgba(255, 255, 255, 0.04)'
const REG_STROKE = 'rgba(255, 255, 255, 0.06)'
const LABEL_FILL = 'rgba(255, 255, 255, 0.04)'

// ---------------------------------------------------------------------------
// Corner bracket data
// ---------------------------------------------------------------------------

interface Corner {
  /** Corner position (x, y) in SVG coordinates. */
  x: number
  y: number
  /** Horizontal arm direction: +1 (right) or -1 (left). */
  hDir: 1 | -1
  /** Vertical arm direction: +1 (down) or -1 (up). */
  vDir: 1 | -1
}

const CORNERS: Corner[] = [
  { x: CENTER - REG_HALF, y: CENTER - REG_HALF, hDir: 1, vDir: 1 },   // top-left
  { x: CENTER + REG_HALF, y: CENTER - REG_HALF, hDir: -1, vDir: 1 },  // top-right
  { x: CENTER + REG_HALF, y: CENTER + REG_HALF, hDir: -1, vDir: -1 }, // bottom-right
  { x: CENTER - REG_HALF, y: CENTER + REG_HALF, hDir: 1, vDir: -1 },  // bottom-left
]

// ---------------------------------------------------------------------------
// Axis label data
// ---------------------------------------------------------------------------

interface AxisLabel {
  label: string
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  baseline: 'auto' | 'central' | 'hanging'
}

const AXIS_LABELS: AxisLabel[] = [
  {
    label: 'X+',
    x: CENTER + CROSSHAIR_ARM + 8,
    y: CENTER,
    anchor: 'start',
    baseline: 'central',
  },
  {
    label: 'X\u2212',
    x: CENTER - CROSSHAIR_ARM - 8,
    y: CENTER,
    anchor: 'end',
    baseline: 'central',
  },
  {
    label: 'Y+',
    x: CENTER,
    y: CENTER + CROSSHAIR_ARM + 12,
    anchor: 'middle',
    baseline: 'hanging',
  },
  {
    label: 'Y\u2212',
    x: CENTER,
    y: CENTER - CROSSHAIR_ARM - 12,
    anchor: 'middle',
    baseline: 'auto',
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CoordinateOverlays() {
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
        {/* Hub crosshair -- horizontal line with center gap */}
        <line
          x1={CENTER - CROSSHAIR_ARM}
          y1={CENTER}
          x2={CENTER - CROSSHAIR_GAP}
          y2={CENTER}
          stroke={CROSSHAIR_STROKE}
          strokeWidth={1}
        />
        <line
          x1={CENTER + CROSSHAIR_GAP}
          y1={CENTER}
          x2={CENTER + CROSSHAIR_ARM}
          y2={CENTER}
          stroke={CROSSHAIR_STROKE}
          strokeWidth={1}
        />

        {/* Hub crosshair -- vertical line with center gap */}
        <line
          x1={CENTER}
          y1={CENTER - CROSSHAIR_ARM}
          x2={CENTER}
          y2={CENTER - CROSSHAIR_GAP}
          stroke={CROSSHAIR_STROKE}
          strokeWidth={1}
        />
        <line
          x1={CENTER}
          y1={CENTER + CROSSHAIR_GAP}
          x2={CENTER}
          y2={CENTER + CROSSHAIR_ARM}
          stroke={CROSSHAIR_STROKE}
          strokeWidth={1}
        />

        {/* Corner registration brackets */}
        {CORNERS.map((corner, i) => (
          <g key={i}>
            {/* Horizontal arm */}
            <line
              x1={corner.x}
              y1={corner.y}
              x2={corner.x + REG_ARM * corner.hDir}
              y2={corner.y}
              stroke={REG_STROKE}
              strokeWidth={1}
            />
            {/* Vertical arm */}
            <line
              x1={corner.x}
              y1={corner.y}
              x2={corner.x}
              y2={corner.y + REG_ARM * corner.vDir}
              stroke={REG_STROKE}
              strokeWidth={1}
            />
          </g>
        ))}

        {/* Axis labels */}
        {AXIS_LABELS.map((axis) => (
          <text
            key={axis.label}
            x={axis.x}
            y={axis.y}
            textAnchor={axis.anchor}
            dominantBaseline={axis.baseline}
            fill={LABEL_FILL}
            fontFamily="var(--font-mono, monospace)"
            fontSize={14}
            letterSpacing="0.08em"
          >
            {axis.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
