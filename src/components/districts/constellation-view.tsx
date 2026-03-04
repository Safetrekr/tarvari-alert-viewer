/**
 * ConstellationView -- Z0 zoomed-out representation of the Launch.
 *
 * When the semantic zoom level is Z0, districts collapse from full
 * capsules into luminous beacons: small colored dots with status-driven
 * glow, compact two-letter codes, and three global metrics that
 * aggregate telemetry across all apps.
 *
 * Renders 6 beacons at the same ring positions as the capsule layout,
 * plus a global metrics bar centered below the ring.
 *
 * @module constellation-view
 * @see WS-2.7 Section 4.3
 */

'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'

import { CAPSULE_RING_RADIUS, CAPSULE_ANGULAR_SPACING } from '@/lib/constants'
import { useDistrictsStore } from '@/stores/districts.store'
import type { AppTelemetry } from '@/lib/telemetry-types'
import {
  DISTRICTS,
  DISTRICT_CODES,
  type BeaconData,
  type ConstellationMetrics,
  type DistrictId,
  type HealthState,
} from '@/lib/interfaces/district'
import { DistrictBeacon } from './district-beacon'
import { GlobalMetrics } from './global-metrics'

// ---------------------------------------------------------------------------
// Layout constants (mirror capsule-ring.tsx)
// ---------------------------------------------------------------------------

/** Ring container matches capsule ring: 840x840px. */
const RING_SIZE = 840

/** Center of the ring container. */
const RING_CENTER = RING_SIZE / 2

/** Beacon container is 40x40px. */
const BEACON_SIZE = 40

/** Starting angle: 12 o'clock = -90 degrees. */
const START_ANGLE_DEG = -90

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the top-left position for a beacon at a given ring index.
 * Positions mirror the capsule ring layout so the spatial transition
 * between Z1 and Z0 reads as capsules collapsing to dots in place.
 */
function computeBeaconPosition(ringIndex: number): { left: number; top: number } {
  const angleDeg = START_ANGLE_DEG + ringIndex * CAPSULE_ANGULAR_SPACING
  const angleRad = (angleDeg * Math.PI) / 180

  const cx = RING_CENTER + CAPSULE_RING_RADIUS * Math.cos(angleRad)
  const cy = RING_CENTER + CAPSULE_RING_RADIUS * Math.sin(angleRad)

  return {
    left: cx - BEACON_SIZE / 2,
    top: cy - BEACON_SIZE / 2,
  }
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

/** Health state severity for worst-of comparison. */
const HEALTH_SEVERITY: Record<HealthState, number> = {
  OPERATIONAL: 0,
  DEGRADED: 1,
  DOWN: 2,
  OFFLINE: -1, // Excluded from "worst-of" -- intentionally absent
  UNKNOWN: -1, // Excluded from "worst-of" -- no data to judge
}

/**
 * Compute aggregate metrics from the districts store.
 *
 * - Alert Count: sum of all district alertCount values.
 * - Active Work: sum of parsed numeric prefix from pulse strings
 *   (e.g., "3 runs active" -> 3). Falls back to 0 if no pulse data.
 * - System Pulse: worst health state across online districts
 *   (excludes OFFLINE and UNKNOWN).
 */
function computeMetrics(apps: Record<string, AppTelemetry>): ConstellationMetrics {
  let alertCount = 0
  let activeWork = 0
  let worstSeverity = 0
  let worstHealth: HealthState = 'OPERATIONAL'

  for (const app of Object.values(apps)) {
    alertCount += app.alertCount

    // AppTelemetry doesn't carry a pulse string yet; this is a
    // forward-compatible guard for when the telemetry contract adds it.
    // The 'pulse' property exists on CapsuleTelemetry but not AppTelemetry.
    const pulse = 'pulse' in app ? (app as unknown as { pulse: string }).pulse : undefined
    if (typeof pulse === 'string') {
      const pulseMatch = pulse.match(/^(\d+)/)
      if (pulseMatch) {
        activeWork += parseInt(pulseMatch[1], 10)
      }
    }

    // Worst-of-five: only consider apps that are online
    const severity = HEALTH_SEVERITY[app.status as HealthState]
    if (severity > worstSeverity) {
      worstSeverity = severity
      worstHealth = app.status as HealthState
    }
  }

  return { alertCount, activeWork, systemPulse: worstHealth }
}

/**
 * Derive beacon data for each district from the store telemetry.
 * If a district has no telemetry entry, it defaults to UNKNOWN state.
 */
function deriveBeacons(apps: Record<string, AppTelemetry>): BeaconData[] {
  return DISTRICTS.map((district) => {
    const app = apps[district.id]
    return {
      id: district.id,
      code: DISTRICT_CODES[district.id],
      health: app ? (app.status as HealthState) : 'UNKNOWN',
      alerts: app ? app.alertCount : 0,
      ringIndex: district.ringIndex,
    }
  })
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConstellationViewProps {
  /** Whether the ZUI viewport is actively panning (disables glow effects). */
  isPanning?: boolean
  /** Callback when a beacon is clicked (triggers zoom + morph). */
  onBeaconSelect?: (id: DistrictId) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConstellationView({ isPanning = false, onBeaconSelect }: ConstellationViewProps) {
  const apps = useDistrictsStore((state) => state.districts)

  const beacons = useMemo(() => deriveBeacons(apps), [apps])
  const metrics = useMemo(() => computeMetrics(apps), [apps])

  return (
    <motion.div
      key="constellation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="absolute"
      style={{
        left: -(RING_SIZE / 2),
        top: -(RING_SIZE / 2),
        width: RING_SIZE,
        height: RING_SIZE,
        pointerEvents: 'auto',
      }}
      data-panning={isPanning || undefined}
    >
      {/* Beacons in ring layout */}
      {beacons.map((beacon) => (
        <DistrictBeacon
          key={beacon.id}
          data={beacon}
          style={computeBeaconPosition(beacon.ringIndex)}
          isPanning={isPanning}
          onSelect={onBeaconSelect}
        />
      ))}

      {/* Global metrics bar, centered below the ring */}
      <GlobalMetrics metrics={metrics} />
    </motion.div>
  )
}
