/**
 * Pure utility functions for transforming raw Supabase rows into
 * display-ready structures for the Coverage Grid Launch Page.
 *
 * Extracted from hook query logic for independent testability.
 * All functions are stateless and side-effect-free.
 *
 * @module coverage-utils
 * @see WS-1.3 Section 4.2
 * @see DERIVED-METRICS.md
 */

import type { IntelSourceRow, IntelNormalizedRow } from '@/lib/supabase/types'

// ============================================================================
// Types
// ============================================================================

/** Category rollup for the coverage card grid. */
export interface CoverageByCategory {
  category: string
  sourceCount: number
  activeSources: number
  geographicRegions: string[]
}

/** Simplified marker for map rendering. */
export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  severity: string
  category: string
  sourceId: string
  ingestedAt: string
}

/** Geographic bounds for a set of map markers. */
export interface MapBounds {
  center?: [number, number] // [lng, lat]
  zoom?: number
  bounds?: [[number, number], [number, number]] // [[minLng, minLat], [maxLng, maxLat]]
}

/** Processed source for the details table. */
export interface SourceCoverage {
  sourceKey: string
  name: string
  category: string
  status: string
  geographicCoverage: string | null
  updateFrequency: string | null
}

/** Combined metrics response from useCoverageMetrics. */
export interface CoverageMetrics {
  totalSources: number
  activeSources: number
  categoriesCovered: number
  sourcesByCoverage: SourceCoverage[]
  byCategory: CoverageByCategory[]
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Group intel sources by category and aggregate counts.
 *
 * Returns categories sorted by sourceCount descending.
 * Categories with zero sources are excluded (since they cannot
 * appear in the input data).
 *
 * Geographic regions are collected from `source.coverage?.geo`
 * and deduplicated per category.
 */
export function buildCategoryMetrics(sources: IntelSourceRow[]): CoverageByCategory[] {
  const categoryMap = new Map<string, CoverageByCategory>()

  for (const source of sources) {
    const cat = source.category

    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        category: cat,
        sourceCount: 0,
        activeSources: 0,
        geographicRegions: [],
      })
    }

    const entry = categoryMap.get(cat)!
    entry.sourceCount++

    if (source.status === 'active') {
      entry.activeSources++
    }

    const geo = source.coverage?.geo
    if (geo && !entry.geographicRegions.includes(geo)) {
      entry.geographicRegions.push(geo)
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => b.sourceCount - a.sourceCount)
}

/**
 * Convert intel_normalized rows to map markers.
 *
 * Filters to Point geometries only. Flips GeoJSON [lng, lat]
 * coordinate order to { lat, lng } for map libraries.
 * Rows with null, non-Point, or malformed geo are silently excluded.
 */
export function toMarkers(items: IntelNormalizedRow[]): MapMarker[] {
  return items
    .filter(
      (item): item is IntelNormalizedRow & { geo: { type: string; coordinates: number[] } } =>
        item.geo !== null &&
        item.geo.type === 'Point' &&
        Array.isArray(item.geo.coordinates) &&
        item.geo.coordinates.length >= 2 &&
        typeof item.geo.coordinates[0] === 'number' &&
        typeof item.geo.coordinates[1] === 'number',
    )
    .map((item) => ({
      id: item.id,
      lat: item.geo.coordinates[1], // GeoJSON is [lng, lat]
      lng: item.geo.coordinates[0],
      title: item.title ?? 'Intel Item',
      severity: item.severity ?? 'Unknown',
      category: item.category ?? 'other',
      sourceId: item.source_id,
      ingestedAt: item.ingested_at,
    }))
}

/**
 * Calculate geographic bounds for a set of markers.
 *
 * - 0 markers: center at [0, 0], zoom 2 (world view)
 * - 1 marker: center on that marker, zoom 8
 * - 2+ markers: bounding box of all markers
 */
export function calculateBounds(markers: MapMarker[]): MapBounds {
  if (markers.length === 0) {
    return { center: [0, 0], zoom: 2 }
  }

  if (markers.length === 1) {
    return { center: [markers[0].lng, markers[0].lat], zoom: 8 }
  }

  const lngs = markers.map((m) => m.lng)
  const lats = markers.map((m) => m.lat)

  return {
    bounds: [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
  }
}

/**
 * Returns a CoverageMetrics object with all counts at zero and empty arrays.
 * Used as the default value when Supabase returns no data or on error.
 */
export function emptyMetrics(): CoverageMetrics {
  return {
    totalSources: 0,
    activeSources: 0,
    categoriesCovered: 0,
    sourcesByCoverage: [],
    byCategory: [],
  }
}
