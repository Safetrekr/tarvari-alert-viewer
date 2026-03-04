/**
 * Spatial Index -- Structured description of the Launch spatial layout.
 *
 * Assembles context for LLM prompts by reading from the districts store
 * and camera store. Provides the AI with a structured description of:
 * - Which districts exist and their display names
 * - Current health status and alert counts
 * - Current camera position and semantic zoom level
 *
 * This is a lightweight, read-only index that is rebuilt on each AI query.
 * No persistent state -- it reads from existing stores.
 *
 * References:
 * - AD-7 (AI Integration Architecture)
 * - WS-1.7 SystemStateProvider
 *
 * @module spatial-index
 * @see WS-3.4 Section 4.5
 */

import { ALL_APP_IDS, APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type { AppIdentifier } from '@/lib/interfaces/types'

// ============================================================================
// Spatial Entity
// ============================================================================

/** A single navigable entity in the spatial canvas. */
export interface SpatialEntity {
  /** Unique identifier. */
  readonly id: AppIdentifier
  /** Human-readable display name. */
  readonly displayName: string
  /** Current health state. */
  readonly health: string
  /** Number of active alerts. */
  readonly alertCount: number
  /** Human-readable pulse/activity string. */
  readonly pulse: string
  /** Whether this entity has meaningful issues. */
  readonly hasIssues: boolean
}

// ============================================================================
// Camera Context
// ============================================================================

/** Current camera state for LLM context. */
export interface CameraContext {
  /** Current X offset in world pixels. */
  readonly offsetX: number
  /** Current Y offset in world pixels. */
  readonly offsetY: number
  /** Current zoom level. */
  readonly zoom: number
  /** Current semantic zoom level name. */
  readonly semanticLevel: string
}

// ============================================================================
// Spatial Index Snapshot
// ============================================================================

/** Complete spatial context assembled for an AI query. */
export interface SpatialIndexSnapshot {
  /** All navigable entities with their current state. */
  readonly entities: readonly SpatialEntity[]
  /** Current camera position and zoom. */
  readonly camera: CameraContext
  /** Total alert count across all districts. */
  readonly totalAlerts: number
  /** Number of districts in non-healthy state. */
  readonly unhealthyCount: number
  /** Timestamp when this snapshot was assembled. */
  readonly assembledAt: string
}

// ============================================================================
// Input Types (for store data)
// ============================================================================

/**
 * Minimal district telemetry the spatial index needs.
 * Maps to AppTelemetry from districts.store or SystemSnapshot.apps[id].
 */
export interface DistrictTelemetryInput {
  readonly status: string
  readonly alertCount: number
  readonly checks?: Record<string, unknown>
}

/** Minimal camera state the spatial index needs. */
export interface CameraStateInput {
  readonly offsetX: number
  readonly offsetY: number
  readonly zoom: number
  readonly semanticLevel: string
}

// ============================================================================
// Spatial Index Builder
// ============================================================================

/**
 * Build a SpatialIndexSnapshot from current store data.
 *
 * @param districts - Per-district telemetry keyed by district ID.
 * @param camera - Current camera state.
 * @returns Assembled spatial context for AI prompts.
 */
export function buildSpatialIndex(
  districts: Readonly<Record<string, DistrictTelemetryInput>>,
  camera: CameraStateInput,
): SpatialIndexSnapshot {
  const entities: SpatialEntity[] = ALL_APP_IDS.map((id) => {
    const telemetry = districts[id]
    const health = telemetry?.status ?? 'UNKNOWN'
    const alertCount = telemetry?.alertCount ?? 0

    return {
      id,
      displayName: APP_DISPLAY_NAMES[id],
      health,
      alertCount,
      pulse: formatPulse(telemetry),
      hasIssues: health === 'DOWN' || health === 'DEGRADED' || alertCount > 0,
    }
  })

  const totalAlerts = entities.reduce((sum, e) => sum + e.alertCount, 0)
  const unhealthyCount = entities.filter(
    (e) => e.health === 'DOWN' || e.health === 'DEGRADED',
  ).length

  return {
    entities,
    camera: {
      offsetX: camera.offsetX,
      offsetY: camera.offsetY,
      zoom: camera.zoom,
      semanticLevel: camera.semanticLevel,
    },
    totalAlerts,
    unhealthyCount,
    assembledAt: new Date().toISOString(),
  }
}

/**
 * Convert a SpatialIndexSnapshot to a concise text description
 * suitable for inclusion in an LLM prompt.
 *
 * Keeps total output under ~500 tokens for fast inference.
 */
export function spatialIndexToText(snapshot: SpatialIndexSnapshot): string {
  const lines: string[] = [
    '=== Tarva Launch Spatial Context ===',
    '',
    `Camera: zoom=${snapshot.camera.zoom.toFixed(2)}, level=${snapshot.camera.semanticLevel}, position=(${Math.round(snapshot.camera.offsetX)}, ${Math.round(snapshot.camera.offsetY)})`,
    `System: ${snapshot.totalAlerts} total alert${snapshot.totalAlerts !== 1 ? 's' : ''}, ${snapshot.unhealthyCount} unhealthy district${snapshot.unhealthyCount !== 1 ? 's' : ''}`,
    '',
    'Districts:',
  ]

  for (const entity of snapshot.entities) {
    const alertTag = entity.alertCount > 0 ? ` [${entity.alertCount} alert${entity.alertCount !== 1 ? 's' : ''}]` : ''
    const healthIcon = healthToIcon(entity.health)
    lines.push(
      `  - ${entity.id} (${entity.displayName}): ${healthIcon} ${entity.health}${alertTag}${entity.pulse ? `, pulse: ${entity.pulse}` : ''}`,
    )
  }

  return lines.join('\n')
}

// ============================================================================
// Helpers
// ============================================================================

function formatPulse(telemetry: DistrictTelemetryInput | undefined): string {
  if (!telemetry) return '--'
  if (telemetry.status === 'OFFLINE' || telemetry.status === 'UNKNOWN') return '--'
  return 'active'
}

function healthToIcon(health: string): string {
  switch (health) {
    case 'OPERATIONAL': return '[OK]'
    case 'DEGRADED': return '[WARN]'
    case 'DOWN': return '[DOWN]'
    case 'OFFLINE': return '[OFF]'
    default: return '[?]'
  }
}
