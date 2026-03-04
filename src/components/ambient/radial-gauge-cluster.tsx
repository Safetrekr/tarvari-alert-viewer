/**
 * RadialGaugeCluster -- three concentric semi-arc SVG gauges positioned
 * above the capsule ring.
 *
 * Displays three gauges as semicircular arcs (open at bottom):
 * - Inner arc (radius 80): System Health -- green (from store systemHealthPct)
 * - Middle arc (radius 110): Throughput -- teal (from store throughputPct)
 * - Outer arc (radius 140): Agent Capacity -- ember (from store agentCapacityPct)
 *
 * Each gauge has a dim track (full semicircle), a filled arc showing
 * the percentage, 18 tick marks at 10-degree intervals along the
 * semicircle, and a small percentage label.
 *
 * Positioned at world-space (0, -580) -- above the ring -- via an
 * absolutely positioned wrapper. At zoom 0.5, the cluster appears
 * as a subtle heads-up instrument reading.
 *
 * Values are read live from the enrichment store performance metrics.
 *
 * @module radial-gauge-cluster
 * @see WS-1.6 Ambient Effects Layer
 */

'use client'

import { useMemo } from 'react'
import { useEnrichmentStore } from '@/stores/enrichment.store'

// ---------------------------------------------------------------------------
// Layout constants (world-space pixels)
// ---------------------------------------------------------------------------

/** Position of the gauge cluster center in world space, relative to (0,0). */
const CLUSTER_Y = -580

/** SVG canvas size (must contain the largest arc + labels). */
const SVG_W = 400
const SVG_H = 240
const SVG_CX = SVG_W / 2
const SVG_CY = SVG_H - 20 // Arc center near bottom of SVG

// ---------------------------------------------------------------------------
// Gauge definitions (static parts -- percent comes from store)
// ---------------------------------------------------------------------------

interface GaugeDef {
  /** Arc radius in SVG pixels. */
  radius: number
  /** Stroke color for the filled arc. */
  color: string
  /** Gauge label. */
  label: string
}

const GAUGE_DEFS: GaugeDef[] = [
  { radius: 80, color: 'rgba(var(--healthy-rgb), 0.35)', label: 'SYS' },
  { radius: 110, color: 'rgba(14, 165, 233, 0.35)', label: 'THR' },
  { radius: 140, color: 'rgba(var(--ember-rgb), 0.30)', label: 'AGT' },
]

/** Track (background) color for unfilled arcs. */
const TRACK_COLOR = 'rgba(255, 255, 255, 0.03)'

/** Tick mark color. */
const TICK_COLOR = 'rgba(255, 255, 255, 0.04)'

/** Label text color. */
const LABEL_COLOR = 'rgba(255, 255, 255, 0.18)'

// ---------------------------------------------------------------------------
// Arc geometry helpers
// ---------------------------------------------------------------------------

/**
 * Semicircle arc spans from 180deg to 0deg (left to right, open at bottom).
 * In SVG coordinates: 180deg = leftmost, 0deg = rightmost.
 */
const ARC_START_DEG = 180
const ARC_END_DEG = 0
const ARC_SPAN_DEG = 180

/** Convert degrees to radians. */
const toRad = (deg: number): number => (deg * Math.PI) / 180

/** Get x,y on the arc for a given angle in degrees and radius. */
const arcX = (deg: number, r: number): number => SVG_CX + r * Math.cos(toRad(deg))
const arcY = (deg: number, r: number): number => SVG_CY + r * Math.sin(toRad(deg))

/**
 * Build an SVG arc path for a semicircle from startDeg to endDeg.
 * Uses the standard SVG arc command (A).
 */
function semiArcPath(radius: number, startDeg: number, endDeg: number): string {
  const x1 = arcX(startDeg, radius)
  const y1 = arcY(startDeg, radius)
  const x2 = arcX(endDeg, radius)
  const y2 = arcY(endDeg, radius)

  // Sweep flag: 1 for clockwise from start to end
  // Large arc flag: 0 since we never exceed 180 degrees
  return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`
}

/**
 * Build an SVG arc path for a partial fill of the semicircle.
 * `percent` determines how much of the 180deg arc is filled.
 * Fills from left (180deg) toward right (0deg).
 */
function filledArcPath(radius: number, percent: number): string {
  const fillDeg = ARC_START_DEG - (percent / 100) * ARC_SPAN_DEG
  return semiArcPath(radius, ARC_START_DEG, fillDeg)
}

// ---------------------------------------------------------------------------
// Tick marks
// ---------------------------------------------------------------------------

const TICK_COUNT = 18
const TICK_LENGTH = 6

interface TickMark {
  x1: number
  y1: number
  x2: number
  y2: number
}

function generateTicks(radius: number): TickMark[] {
  const ticks: TickMark[] = []
  for (let i = 0; i <= TICK_COUNT; i++) {
    const deg = ARC_START_DEG - (i / TICK_COUNT) * ARC_SPAN_DEG
    ticks.push({
      x1: arcX(deg, radius - TICK_LENGTH / 2),
      y1: arcY(deg, radius - TICK_LENGTH / 2),
      x2: arcX(deg, radius + TICK_LENGTH / 2),
      y2: arcY(deg, radius + TICK_LENGTH / 2),
    })
  }
  return ticks
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RadialGaugeCluster() {
  const performance = useEnrichmentStore((s) => s.performance)

  // Map store metrics to gauge order: inner=systemHealthPct, middle=throughputPct, outer=agentCapacityPct
  const gaugePercents = useMemo(
    () => [
      Math.round(performance.systemHealthPct),
      Math.round(performance.throughputPct),
      Math.round(performance.agentCapacityPct),
    ],
    [performance.systemHealthPct, performance.throughputPct, performance.agentCapacityPct],
  )

  return (
    <div
      className="absolute"
      style={{
        left: -(SVG_W / 2),
        top: CLUSTER_Y - SVG_H / 2,
        width: SVG_W,
        height: SVG_H,
        pointerEvents: 'none',
      }}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width={SVG_W}
        height={SVG_H}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {GAUGE_DEFS.map((gauge, idx) => {
          const percent = gaugePercents[idx]
          const ticks = generateTicks(gauge.radius)

          // Label position: at the 3 o'clock position (0deg) of the arc
          const labelX = arcX(0, gauge.radius) + 10
          const labelY = arcY(0, gauge.radius)

          return (
            <g key={gauge.radius}>
              {/* Track (full semicircle background) */}
              <path
                d={semiArcPath(gauge.radius, ARC_START_DEG, ARC_END_DEG)}
                stroke={TRACK_COLOR}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />

              {/* Filled arc (percentage) */}
              <path
                d={filledArcPath(gauge.radius, percent)}
                stroke={gauge.color}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
              />

              {/* Tick marks */}
              {ticks.map((tick, i) => (
                <line
                  key={i}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={TICK_COLOR}
                  strokeWidth={1}
                />
              ))}

              {/* Percentage label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="start"
                dominantBaseline="central"
                fill={LABEL_COLOR}
                fontFamily="var(--font-mono, monospace)"
                fontSize={16}
                letterSpacing="0.05em"
              >
                {percent}%
              </text>

              {/* Gauge name label (at 9 o'clock / 180deg position) */}
              <text
                x={arcX(180, gauge.radius) - 10}
                y={arcY(180, gauge.radius)}
                textAnchor="end"
                dominantBaseline="central"
                fill={LABEL_COLOR}
                fontFamily="var(--font-mono, monospace)"
                fontSize={14}
                letterSpacing="0.08em"
                opacity={0.7}
              >
                {gauge.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
