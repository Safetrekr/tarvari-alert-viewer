'use client'

/**
 * TanStack Query hook for coverage map data.
 *
 * Fetches geo-located intel items from the TarvaRI backend API
 * (`/console/intel/locations`) and transforms them into `MapMarker[]`
 * for map rendering. Supports optional filtering by category, severity,
 * date range, bounding box, and intel source.
 *
 * @module use-coverage-map-data
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import { DATA_MODE } from '@/lib/data-mode'
import { fetchCoverageMapDataFromSupabase } from '@/lib/supabase/queries'
import type { MapMarker } from '@/lib/coverage-utils'
import type { OperationalPriority } from '@/lib/interfaces/coverage'

// ============================================================================
// Types
// ============================================================================

/**
 * Geographic bounding box as a 4-tuple: [west, south, east, north].
 * Coordinates are WGS84 longitude/latitude.
 * Serialized to a comma-separated query parameter for API calls.
 */
export type BBox = [west: number, south: number, east: number, north: number]

/** Optional filters for the coverage map data query. */
export interface CoverageMapFilters {
  category?: string
  categories?: string[]
  severity?: string
  startDate?: string // ISO 8601
  endDate?: string // ISO 8601
  /** Geographic bounding box filter. When provided, only items within this
   *  viewport are returned. Format: [west, south, east, north] in WGS84. */
  bbox?: BBox
  /** Intel source identifier filter. When provided, only items from this
   *  source are returned (e.g., 'nws-alerts', 'gdacs-rss'). */
  sourceKey?: string
}

// ============================================================================
// API response type (GeoJSON)
// ============================================================================

interface GeoJSONFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: number[] | number[][] | number[][][]
  }
  properties: Record<string, unknown>
}

interface GeoJSONFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// ============================================================================
// Query function
// ============================================================================

async function fetchCoverageMapDataFromConsole(filters?: CoverageMapFilters): Promise<MapMarker[]> {
  const params: Record<string, string | undefined> = {}

  // API accepts single category filter
  if (filters?.categories && filters.categories.length > 0) {
    params.category = filters.categories[0]
  } else if (filters?.category) {
    params.category = filters.category
  }
  if (filters?.severity) params.severity = filters.severity
  if (filters?.startDate) params.start_date = filters.startDate
  if (filters?.endDate) params.end_date = filters.endDate
  if (filters?.bbox) params.bbox = filters.bbox.join(',')
  if (filters?.sourceKey) params.source_key = filters.sourceKey

  const data = await tarvariGet<GeoJSONFeatureCollection>('/console/coverage/map-data', params)

  if (!data.features) return []

  return data.features
    .filter(
      (f): f is GeoJSONFeature & { geometry: { type: 'Point'; coordinates: number[] } } =>
        f.geometry?.type === 'Point' &&
        Array.isArray(f.geometry.coordinates) &&
        f.geometry.coordinates.length >= 2 &&
        typeof f.geometry.coordinates[0] === 'number' &&
        typeof f.geometry.coordinates[1] === 'number',
    )
    .map((f) => ({
      id: (f.properties.id as string) ?? crypto.randomUUID(),
      lat: f.geometry.coordinates[1], // GeoJSON is [lng, lat]
      lng: f.geometry.coordinates[0],
      title: (f.properties.title as string) ?? 'Intel Item',
      severity: (f.properties.severity as string) ?? 'Unknown',
      category: (f.properties.category as string) ?? 'other',
      sourceId: (f.properties.source_key as string) ?? '',
      ingestedAt: (f.properties.ingested_at as string) ?? '',
      operationalPriority: (f.properties.operational_priority as OperationalPriority | null) ?? null,
    }))
}

async function fetchCoverageMapData(filters?: CoverageMapFilters): Promise<MapMarker[]> {
  if (DATA_MODE === 'supabase') return fetchCoverageMapDataFromSupabase(filters)
  return fetchCoverageMapDataFromConsole(filters)
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches intel items with geographic data for map rendering.
 *
 * - queryKey: `['coverage', 'map-data', filters]`
 * - staleTime: 30 seconds
 * - refetchInterval: 30 seconds
 */
export function useCoverageMapData(filters?: CoverageMapFilters) {
  return useQuery<MapMarker[]>({
    queryKey: ['coverage', 'map-data', filters],
    queryFn: () => fetchCoverageMapData(filters),
    staleTime: 30_000,
    refetchInterval: 30_000,
    placeholderData: keepPreviousData,
  })
}
