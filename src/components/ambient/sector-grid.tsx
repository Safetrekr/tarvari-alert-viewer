/**
 * SectorGrid -- world-space SVG overlay rendering a faint sector grid
 * across the spatial canvas.
 *
 * Draws a 20000x20000 SVG centered at (-10000, -10000) with grid lines at
 * 2000px intervals, creating an 8x8 extended sector grid. Each grid cell
 * is labeled with a sector identifier (e.g., SEC A1, SEC D8) in monospace
 * text at ghost-level opacity.
 *
 * The grid extends far enough to remain visible at all zoom levels,
 * providing spatial orientation cues and a "technical schematic" aesthetic.
 *
 * Visible at Z0+ (all zoom levels). Self-gates via ZoomGate.
 *
 * @module sector-grid
 * @see Phase E: Ambient enrichments
 */

'use client'

import { ZoomGate } from './zoom-gate'

// ---------------------------------------------------------------------------
// Layout constants (world-space pixels)
// ---------------------------------------------------------------------------

const SVG_SIZE = 20000
const CENTER = SVG_SIZE / 2
const GRID_INTERVAL = 2000

/** Grid spans -10000 to +10000, lines at every 2000px. */
const GRID_POSITIONS: number[] = []
for (let p = -10000; p <= 10000; p += GRID_INTERVAL) {
  GRID_POSITIONS.push(p)
}

/** Row labels A-H, col labels 1-10, for cells starting at each grid intersection. */
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] as const

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const LINE_STROKE = 'rgba(255, 255, 255, 0.02)'
const LABEL_FILL = 'rgba(255, 255, 255, 0.03)'

/** Offset from intersection to label position (world-space pixels). */
const LABEL_OFFSET_X = 12
const LABEL_OFFSET_Y = 12

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SectorGrid() {
  return (
    <ZoomGate show={['Z0', 'Z1', 'Z2', 'Z3']}>
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
          {/* Vertical grid lines */}
          {GRID_POSITIONS.map((x) => (
            <line
              key={`v-${x}`}
              x1={x + CENTER}
              y1={0}
              x2={x + CENTER}
              y2={SVG_SIZE}
              stroke={LINE_STROKE}
              strokeWidth={1}
            />
          ))}

          {/* Horizontal grid lines */}
          {GRID_POSITIONS.map((y) => (
            <line
              key={`h-${y}`}
              x1={0}
              y1={y + CENTER}
              x2={SVG_SIZE}
              y2={y + CENTER}
              stroke={LINE_STROKE}
              strokeWidth={1}
            />
          ))}

          {/* Sector labels -- only place at every other intersection to avoid clutter */}
          {ROW_LABELS.map((row, ri) => {
            if (ri >= GRID_POSITIONS.length - 1) return null
            const worldY = GRID_POSITIONS[ri]
            return COL_LABELS.map((col, ci) => {
              if (ci >= GRID_POSITIONS.length - 1) return null
              const worldX = GRID_POSITIONS[ci]
              return (
                <text
                  key={`sec-${row}${col}`}
                  x={worldX + CENTER + LABEL_OFFSET_X}
                  y={worldY + CENTER + LABEL_OFFSET_Y}
                  fill={LABEL_FILL}
                  fontFamily="var(--font-mono, monospace)"
                  fontSize={18}
                  letterSpacing="0.12em"
                  dominantBaseline="hanging"
                  style={{ textTransform: 'uppercase' } as React.CSSProperties}
                >
                  {`SEC ${row}${col}`}
                </text>
              )
            })
          })}
        </svg>
      </div>
    </ZoomGate>
  )
}
