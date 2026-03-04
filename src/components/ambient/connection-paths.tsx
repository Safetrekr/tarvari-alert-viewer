/**
 * ConnectionPaths -- SVG bezier curves between district capsules
 * showing data flow relationships.
 *
 * Draws 6 connections on a 1600x1600 SVG (same coordinate system as
 * RangeRings) with animated dashed strokes to convey "data flowing"
 * between the 6 Tarva districts. Most paths use a teal tint; the
 * TarvaCORE "reasoning" path to hub center uses ember.
 *
 * Bezier control points are pushed outward from center by ~80px so
 * curves bow away from the hub glyph and don't overlap it.
 *
 * Gated by ZoomGate to only appear at Z1/Z2. CSS animation
 * (`enrichment-flow` in enrichment.css) scrolls the dash pattern.
 *
 * @module connection-paths
 * @see WS-1.6 Ambient Effects Layer
 */

'use client'

import { useEnrichmentStore } from '@/stores/enrichment.store'
import type { DistrictId, HealthState } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Layout constants (world-space pixels)
// ---------------------------------------------------------------------------

/** SVG viewBox matches range-rings for consistent layering. */
const SVG_SIZE = 1600
const CENTER = SVG_SIZE / 2

/** Capsule ring radius (must match district layout in page.tsx). */
const RING_RADIUS = 300

/** How far the bezier control point is pushed outward from the midpoint. */
const CURVE_OUTWARD_PUSH = 80

// ---------------------------------------------------------------------------
// Capsule positions
// ---------------------------------------------------------------------------

/**
 * Compute the angle (in degrees) for a capsule at the given ring index.
 * Index 0 is at 12 o'clock (-90deg), each successive capsule is +60deg.
 */
const capsuleAngle = (index: number): number => -90 + index * 60

/** World-space X coordinate for a capsule, offset by SVG center. */
const capsuleX = (index: number): number =>
  CENTER + Math.cos((capsuleAngle(index) * Math.PI) / 180) * RING_RADIUS

/** World-space Y coordinate for a capsule, offset by SVG center. */
const capsuleY = (index: number): number =>
  CENTER + Math.sin((capsuleAngle(index) * Math.PI) / 180) * RING_RADIUS

// ---------------------------------------------------------------------------
// Connection definitions
// ---------------------------------------------------------------------------

interface Connection {
  /** Source capsule ring index (0-5), or null for hub center. */
  from: number | null
  /** Destination capsule ring index (0-5), or null for hub center. */
  to: number | null
  /** Descriptive label (not rendered, for code readability). */
  label: string
  /** Whether this is the special REASONING connection (tarva-core -> hub). */
  isReasoning: boolean
}

/**
 * Static connection geometry definitions. Order matches the enrichment store's
 * `connections` array so we can use array index to look up health.
 */
const CONNECTIONS: Connection[] = [
  { from: 0, to: 2, label: 'agent-builder -> project-room (deployment)', isReasoning: false },
  { from: 0, to: 1, label: 'agent-builder -> tarva-chat (deployment)', isReasoning: false },
  { from: 5, to: 0, label: 'tarvacode -> agent-builder (knowledge)', isReasoning: false },
  { from: 5, to: 1, label: 'tarvacode -> tarva-chat (knowledge)', isReasoning: false },
  { from: 4, to: 2, label: 'tarva-erp -> project-room (manufacturing)', isReasoning: false },
  { from: 3, to: null, label: 'tarvacore -> hub center (reasoning)', isReasoning: true },
]

// ---------------------------------------------------------------------------
// Health → stroke color mapping
// ---------------------------------------------------------------------------

/**
 * Derive stroke color from connection health and connection type.
 * The REASONING connection uses ember instead of teal when OPERATIONAL.
 */
function strokeForHealth(health: HealthState, isReasoning: boolean): string {
  switch (health) {
    case 'OPERATIONAL':
      return isReasoning ? 'rgba(var(--ember-rgb), 0.08)' : 'rgba(14, 165, 233, 0.12)'
    case 'DEGRADED':
      return 'rgba(245, 158, 11, 0.15)'
    case 'DOWN':
      return 'rgba(255, 255, 255, 0.04)'
    case 'OFFLINE':
    case 'UNKNOWN':
    default:
      return 'rgba(255, 255, 255, 0.03)'
  }
}

// ---------------------------------------------------------------------------
// Path computation
// ---------------------------------------------------------------------------

/**
 * Build a quadratic bezier SVG path string between two points, with
 * the control point pushed outward from center so curves bow away
 * from the hub.
 */
function computePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  // Midpoint between source and destination
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2

  // Direction from center to midpoint (outward push direction)
  const dx = mx - CENTER
  const dy = my - CENTER
  const dist = Math.sqrt(dx * dx + dy * dy) || 1

  // For hub-targeted paths where midpoint is nearly collinear with center
  // and source, push perpendicular instead to create a visible curve
  const edgeDx = x2 - x1
  const edgeDy = y2 - y1
  const edgeLen = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy) || 1
  const perpX = -edgeDy / edgeLen
  const perpY = edgeDx / edgeLen

  // Use perpendicular offset when outward push is too aligned with the path
  const dot = Math.abs((dx / dist) * (edgeDx / edgeLen) + (dy / dist) * (edgeDy / edgeLen))
  const usePerpendicular = dot > 0.9

  const cx = usePerpendicular
    ? mx + perpX * CURVE_OUTWARD_PUSH
    : mx + (dx / dist) * CURVE_OUTWARD_PUSH
  const cy = usePerpendicular
    ? my + perpY * CURVE_OUTWARD_PUSH
    : my + (dy / dist) * CURVE_OUTWARD_PUSH

  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}

// ---------------------------------------------------------------------------
// District ID -> ring index mapping (for focus highlighting)
// ---------------------------------------------------------------------------

const DISTRICT_RING_INDEX: Record<DistrictId, number> = {
  'agent-builder': 0,
  'tarva-chat': 1,
  'project-room': 2,
  'tarva-core': 3,
  'tarva-erp': 4,
  'tarva-code': 5,
}

/**
 * Check whether a connection touches a given ring index.
 * A null endpoint (hub center) never matches a district ring index.
 */
function connectionTouchesIndex(conn: Connection, ringIndex: number): boolean {
  return conn.from === ringIndex || conn.to === ringIndex
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectionPaths() {
  const connections = useEnrichmentStore((s) => s.connections)
  const focusedDistrictId = useEnrichmentStore((s) => s.focusedDistrictId)

  const focusedRingIndex =
    focusedDistrictId !== null ? DISTRICT_RING_INDEX[focusedDistrictId] : null

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
        {CONNECTIONS.map((conn, i) => {
          const x1 = conn.from !== null ? capsuleX(conn.from) : CENTER
          const y1 = conn.from !== null ? capsuleY(conn.from) : CENTER
          const x2 = conn.to !== null ? capsuleX(conn.to) : CENTER
          const y2 = conn.to !== null ? capsuleY(conn.to) : CENTER

          const d = computePath(x1, y1, x2, y2)

          // Derive stroke and animation state from enrichment store
          const storeConn = connections[i]
          const health = storeConn?.health ?? 'OPERATIONAL'
          const isDown = health === 'DOWN'

          // Focus highlighting: brighten connections to focused district,
          // dim others when a district is focused
          let stroke: string
          let width: number = 1

          if (focusedRingIndex !== null) {
            if (connectionTouchesIndex(conn, focusedRingIndex)) {
              // Highlighted: increase opacity and stroke width
              stroke = conn.isReasoning
                ? 'rgba(var(--ember-rgb), 0.25)'
                : 'rgba(14, 165, 233, 0.35)'
              width = 1.5
            } else {
              // Dimmed: reduce to near-invisible
              stroke = 'rgba(255, 255, 255, 0.03)'
            }
          } else {
            // No focus: default health-based stroke
            stroke = strokeForHealth(health, conn.isReasoning)
          }

          return (
            <path
              key={i}
              d={d}
              stroke={stroke}
              strokeWidth={width}
              strokeDasharray="4 8"
              className="enrichment-flow"
              fill="none"
              style={{
                transition: 'stroke 200ms ease, stroke-width 200ms ease',
                ...(isDown ? { animationPlayState: 'paused' } : {}),
              }}
            />
          )
        })}
      </svg>
    </div>
  )
}
