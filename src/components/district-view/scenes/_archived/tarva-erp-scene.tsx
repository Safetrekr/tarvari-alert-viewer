/**
 * TarvaErpScene -- ambient background for the Tarva ERP district.
 *
 * Theme: "Industrial / Manufacturing" -- Manufacturing ERP frontend.
 * Desktop app with no web port.
 *
 * Composed from shared scene primitives (GhostText, GhostCounter) plus
 * custom inline SVG elements for the warehouse schematic and data table.
 * Pure decorative -- no interactivity.
 *
 * @module tarva-erp-scene
 * @see src/components/district-view/shared-scene-primitives.tsx
 */

'use client'

import { memo, useMemo } from 'react'
import type { PanelSide } from '@/lib/morph-types'
import {
  GhostText,
  GhostCounter,
} from '@/components/district-view/shared-scene-primitives'

// ---------------------------------------------------------------------------
// Module status definitions
// ---------------------------------------------------------------------------

interface ErpModule {
  name: string
  pct: number
  fillColor: string
}

const ERP_MODULES: ErpModule[] = [
  { name: 'INVENTORY ', pct: 62, fillColor: 'rgba(245, 158, 11, 0.2)' },
  { name: 'PRODUCTION', pct: 78, fillColor: 'rgba(var(--healthy-rgb), 0.2)' },
  { name: 'QUALITY   ', pct: 91, fillColor: 'rgba(var(--healthy-rgb), 0.2)' },
  { name: 'LOGISTICS ', pct: 45, fillColor: 'rgba(245, 158, 11, 0.2)' },
  { name: 'PURCHASING', pct: 83, fillColor: 'rgba(var(--healthy-rgb), 0.2)' },
]

const BAR_WIDTH = 20

/**
 * Renders a single ERP module row:  MODULE_NAME [=====---] XX%
 */
function ModuleStatusRow({ mod }: { mod: ErpModule }) {
  const filled = Math.round((mod.pct / 100) * BAR_WIDTH)
  const empty = BAR_WIDTH - filled

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        fontFamily: 'var(--font-mono, monospace)',
        whiteSpace: 'pre',
      }}
    >
      {/* Module name */}
      <span style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.15)' }}>
        {mod.name}
      </span>

      {/* Opening bracket */}
      <span style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.08)' }}>
        [
      </span>

      {/* Filled segments */}
      <span style={{ fontSize: 9, color: mod.fillColor }}>
        {'='.repeat(filled)}
      </span>

      {/* Empty segments */}
      <span style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.08)' }}>
        {'-'.repeat(empty)}
      </span>

      {/* Closing bracket */}
      <span style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.08)' }}>
        ]
      </span>

      {/* Percentage */}
      <span style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.15)' }}>
        {String(mod.pct).padStart(2, ' ')}%
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Data table ghost -- faux spreadsheet / AG Grid representation
// ---------------------------------------------------------------------------

const TABLE_HEADERS = ['PART#', 'QTY', 'STATUS', 'LOC', 'DATE']
const TABLE_COL_WIDTHS = [80, 50, 70, 50, 70]
const TABLE_WIDTH = 380
const TABLE_ROW_HEIGHT = 20
const TABLE_ROWS = 4

/**
 * Simulates a ghosted AG Grid / spreadsheet table with barely-visible
 * header text and blurred data rectangles in 4 rows.
 */
function DataTableGhost() {
  // Pre-compute pseudo-random cell widths for data rectangles.
  // Uses a simple deterministic pattern so the layout is stable.
  const cellWidths = useMemo(() => {
    const widths: number[][] = []
    for (let r = 0; r < TABLE_ROWS; r++) {
      const row: number[] = []
      for (let c = 0; c < TABLE_HEADERS.length; c++) {
        // Deterministic "random" width based on row + col
        const base = TABLE_COL_WIDTHS[c]
        const w = base * (0.3 + ((r * 7 + c * 13) % 10) / 20)
        row.push(Math.round(w))
      }
      widths.push(row)
    }
    return widths
  }, [])

  // Compute x offsets for each column
  const colOffsets = useMemo(() => {
    const offsets: number[] = [0]
    for (let i = 1; i < TABLE_COL_WIDTHS.length; i++) {
      offsets.push(offsets[i - 1] + TABLE_COL_WIDTHS[i - 1] + 8)
    }
    return offsets
  }, [])

  const totalHeight = TABLE_ROW_HEIGHT + TABLE_ROWS * TABLE_ROW_HEIGHT + 4

  return (
    <svg
      width={TABLE_WIDTH}
      height={totalHeight}
      viewBox={`0 0 ${TABLE_WIDTH} ${totalHeight}`}
      style={{ display: 'block' }}
    >
      {/* Header row text */}
      {TABLE_HEADERS.map((header, i) => (
        <text
          key={`h-${header}`}
          x={colOffsets[i] + 4}
          y={12}
          fill="rgba(255, 255, 255, 0.1)"
          fontFamily="var(--font-mono, monospace)"
          fontSize={8}
          letterSpacing="0.06em"
        >
          {header}
        </text>
      ))}

      {/* Column separators */}
      {colOffsets.slice(1).map((x, i) => (
        <line
          key={`sep-${i}`}
          x1={x - 4}
          y1={0}
          x2={x - 4}
          y2={totalHeight}
          stroke="rgba(255, 255, 255, 0.03)"
          strokeWidth={1}
        />
      ))}

      {/* Data rows */}
      {Array.from({ length: TABLE_ROWS }, (_, r) => {
        const rowY = TABLE_ROW_HEIGHT + r * TABLE_ROW_HEIGHT + 2
        return (
          <g key={`row-${r}`}>
            {/* Horizontal row divider */}
            <line
              x1={0}
              y1={rowY}
              x2={TABLE_WIDTH}
              y2={rowY}
              stroke="rgba(255, 255, 255, 0.03)"
              strokeWidth={1}
            />
            {/* Blurred data cell rectangles */}
            {cellWidths[r].map((w, c) => (
              <rect
                key={`cell-${r}-${c}`}
                x={colOffsets[c] + 4}
                y={rowY + 5}
                width={w}
                height={6}
                rx={1}
                fill="rgba(255, 255, 255, 0.03)"
              />
            ))}
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Warehouse schematic SVG
// ---------------------------------------------------------------------------

interface WarehouseZone {
  label: string
  x: number
  y: number
  w: number
  h: number
  active?: boolean
}

const ZONES: WarehouseZone[] = [
  { label: 'RAW', x: 4, y: 4, w: 100, h: 60 },
  { label: 'WIP', x: 116, y: 4, w: 120, h: 60, active: true },
  { label: 'FG', x: 4, y: 76, w: 100, h: 60 },
  { label: 'SHIP', x: 116, y: 76, w: 120, h: 60 },
]

function WarehouseSchematic() {
  return (
    <svg
      width={240}
      height={160}
      viewBox="0 0 240 160"
      style={{ display: 'block' }}
    >
      {ZONES.map((z) => (
        <g key={z.label}>
          <rect
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            rx={2}
            fill={z.active ? 'rgba(255, 255, 255, 0.01)' : 'transparent'}
            stroke={
              z.active
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.04)'
            }
            strokeWidth={1}
          />
          <text
            x={z.x + z.w / 2}
            y={z.y + z.h / 2 + 3}
            fill="rgba(255, 255, 255, 0.06)"
            fontFamily="var(--font-mono, monospace)"
            fontSize={8}
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            {z.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Production ticker text
// ---------------------------------------------------------------------------

const TICKER_TEXT =
  'WO-2847 COMPLETE  //  WO-2848 IN PROGRESS  //  PO-1923 PENDING  //  WO-2849 QUEUED  //  QC-441 PASS  //  WO-2850 SCHEDULED'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TarvaErpScene = memo(function TarvaErpScene({ dockSide }: { dockSide: PanelSide }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* 1. Module Status Grid -- center-left */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: 160,
          ...(dockSide === 'right' ? { left: 60 } : { right: 60 }),
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {ERP_MODULES.map((mod) => (
          <ModuleStatusRow key={mod.name} mod={mod} />
        ))}
      </div>

      {/* 2. Data Table Ghost -- center area */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: '35%',
          ...(dockSide === 'right' ? { left: '25%' } : { right: '25%' }),
        }}
      >
        <DataTableGhost />
      </div>

      {/* 3. Production Ticker -- bottom area */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          bottom: 80,
          ...(dockSide === 'right' ? { left: 40 } : { right: 40 }),
          maxWidth: 'calc(100% - 460px)',
          overflow: 'hidden',
        }}
      >
        <GhostText
          text={TICKER_TEXT}
          size={8}
          opacity={0.06}
          letterSpacing="0.12em"
        />
      </div>

      {/* 4. Warehouse Schematic -- upper-right (leaving dock space) */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: 80,
          ...(dockSide === 'right' ? { right: 440 } : { left: 440 }),
        }}
      >
        <WarehouseSchematic />
      </div>

      {/* 5. Units Counter -- center */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: '50%',
          ...(dockSide === 'right' ? { left: '38%' } : { right: '38%' }),
          transform: 'translateY(-50%)',
        }}
      >
        <GhostCounter value="1,247" label="UNITS PRODUCED" size={64} />
      </div>
    </div>
  )
})
