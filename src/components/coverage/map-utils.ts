/**
 * Pure utility functions for the CoverageMap component.
 *
 * Transforms MapMarker[] into GeoJSON FeatureCollections, builds
 * MapLibre style expressions for severity-based coloring, and
 * formats timestamps for popup display.
 *
 * @module map-utils
 * @see WS-4.1
 */

import type { MapMarker } from '@/lib/coverage-utils'

// ============================================================================
// New-alert threshold
// ============================================================================

/** Alerts ingested within this window are flagged as "new" on the map. */
export const NEW_ALERT_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

// ============================================================================
// Severity color map (hex values for MapLibre GL paint properties)
// ============================================================================

/**
 * Hex color values for each severity level, used in MapLibre GL
 * circle paint expressions. These are concrete values (not CSS vars)
 * because MapLibre operates outside the DOM CSS context.
 */
export const SEVERITY_MAP_COLORS: Record<string, string> = {
  Extreme: '#ef4444',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#3b82f6',
  Unknown: '#6b7280',
}

/** Fallback color for markers with unrecognized severity levels. */
export const DEFAULT_MARKER_COLOR = '#6b7280'

// ============================================================================
// GeoJSON conversion
// ============================================================================

/** GeoJSON FeatureCollection of Point features with marker properties. */
export interface MarkerFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: {
      type: 'Point'
      coordinates: [number, number] // [lng, lat]
    }
    properties: {
      id: string
      title: string
      severity: string
      category: string
      sourceId: string
      ingestedAt: string
      /** True if the alert was ingested within the last NEW_ALERT_THRESHOLD_MS. */
      isNew: boolean
      /** Operational priority for marker sizing. 'P4' when absent. */
      priority: string
    }
  }>
}

/**
 * Convert an array of MapMarker objects into a GeoJSON FeatureCollection.
 *
 * Coordinates are in [lng, lat] order per the GeoJSON specification.
 * Properties are carried through for popup display and styling.
 */
export function markersToGeoJSON(markers: MapMarker[]): MarkerFeatureCollection {
  const now = Date.now()

  return {
    type: 'FeatureCollection',
    features: markers.map((marker) => {
      const ingestedMs = new Date(marker.ingestedAt).getTime()
      const isNew = !Number.isNaN(ingestedMs) && now - ingestedMs < NEW_ALERT_THRESHOLD_MS

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [marker.lng, marker.lat] as [number, number],
        },
        properties: {
          id: marker.id,
          title: marker.title,
          severity: marker.severity,
          category: marker.category,
          sourceId: marker.sourceId,
          ingestedAt: marker.ingestedAt,
          isNew,
          priority: marker.operationalPriority ?? 'P4',
        },
      }
    }),
  }
}

// ============================================================================
// MapLibre style expressions
// ============================================================================

/**
 * Severity-based circle color expression for MapLibre GL paint properties.
 *
 * A data-driven `match` expression that maps the `severity` feature
 * property to the corresponding hex color. Unknown severity values
 * fall back to DEFAULT_MARKER_COLOR.
 *
 * Defined as a const tuple to preserve the literal types that
 * MapLibre's `DataDrivenPropertyValueSpecification<string>` expects.
 */
// ============================================================================
// Priority radius constants
// ============================================================================

/** Base circle radius for P1 markers (1.5x default). */
export const PRIORITY_RADIUS_P1 = 9
/** Base circle radius for P2 markers (1.25x default). */
export const PRIORITY_RADIUS_P2 = 7.5
/** Default circle radius for P3/P4/unknown markers. */
export const PRIORITY_RADIUS_DEFAULT = 6

/**
 * Priority-based circle radius expression for MapLibre GL paint properties.
 * Maps the `priority` feature property to a numeric radius.
 */
export const CIRCLE_RADIUS_EXPRESSION = [
  'match',
  ['get', 'priority'],
  'P1', PRIORITY_RADIUS_P1,
  'P2', PRIORITY_RADIUS_P2,
  'P3', PRIORITY_RADIUS_DEFAULT,
  'P4', PRIORITY_RADIUS_DEFAULT,
  PRIORITY_RADIUS_DEFAULT,
] as const

/**
 * Priority-scaled new-alert glow radius expression.
 * Maintains ~2.33x ratio to marker radius per priority level.
 */
export const NEW_GLOW_RADIUS_EXPRESSION = [
  'match',
  ['get', 'priority'],
  'P1', 21,
  'P2', 17.5,
  14,
] as const

/**
 * Priority-scaled selected highlight ring radius expression.
 * Maintains 8px gap between marker edge and ring for all priority levels.
 */
export const SELECTED_RING_RADIUS_EXPRESSION = [
  'match',
  ['get', 'priority'],
  'P1', 17,
  'P2', 15.5,
  14,
] as const

// ============================================================================
// MapLibre style expressions
// ============================================================================

export const CIRCLE_COLOR_EXPRESSION = [
  'match',
  ['get', 'severity'],
  'Extreme',
  SEVERITY_MAP_COLORS.Extreme,
  'Severe',
  SEVERITY_MAP_COLORS.Severe,
  'Moderate',
  SEVERITY_MAP_COLORS.Moderate,
  'Minor',
  SEVERITY_MAP_COLORS.Minor,
  'Unknown',
  SEVERITY_MAP_COLORS.Unknown,
  DEFAULT_MARKER_COLOR,
] as const

// ============================================================================
// Timestamp formatting
// ============================================================================

/**
 * Format an ISO 8601 timestamp as a human-readable relative time string.
 *
 * Examples: "12s ago", "5m ago", "3h ago", "2d ago".
 * Returns "just now" for invalid or future timestamps.
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  if (Number.isNaN(diffMs) || diffMs < 0) return 'just now'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
