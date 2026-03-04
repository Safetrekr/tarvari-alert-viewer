'use client'

/**
 * TanStack Query hook for coverage map data.
 *
 * Fetches `intel_normalized` rows that have GeoJSON geometry and
 * transforms them into `MapMarker[]` for map rendering. Supports
 * optional filtering by category, severity, and date range.
 *
 * @module use-coverage-map-data
 * @see WS-1.3 Section 4.4
 * @see HOOKS-SPEC.md
 */

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toMarkers, type MapMarker } from '@/lib/coverage-utils'
import type { IntelNormalizedRow } from '@/lib/supabase/types'

// ============================================================================
// Types
// ============================================================================

/** Optional filters for the coverage map data query. */
export interface CoverageMapFilters {
  category?: string
  severity?: string
  startDate?: string // ISO 8601
  endDate?: string // ISO 8601
}

// ============================================================================
// Query function
// ============================================================================

async function fetchCoverageMapData(filters?: CoverageMapFilters): Promise<MapMarker[]> {
  const supabase = getSupabaseBrowserClient()

  let query = supabase
    .from('intel_normalized')
    .select('id, title, severity, category, source_id, geo, ingested_at')
    .not('geo', 'is', null)
    .limit(1000)

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.severity) query = query.eq('severity', filters.severity)
  if (filters?.startDate) query = query.gte('ingested_at', filters.startDate)
  if (filters?.endDate) query = query.lte('ingested_at', filters.endDate)

  const { data, error } = await query

  if (error) throw error
  if (!data) return []

  // Type-assert the untyped Supabase response to our known row shape.
  const typedData = data as unknown as IntelNormalizedRow[]

  return toMarkers(typedData)
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches intel items with geographic data for map rendering.
 *
 * Transforms `intel_normalized` rows into `MapMarker[]`, filtering to
 * Point geometries and flipping GeoJSON [lng, lat] to { lat, lng }.
 * Returns `[]` when no matching data exists.
 *
 * - queryKey: `['coverage', 'map-data', filters]`
 * - staleTime: 30 seconds (intel is ingested continuously)
 * - refetchInterval: 30 seconds (background polling)
 *
 * @param filters - Optional category, severity, and date range filters.
 *   When filters change, TanStack Query automatically refetches.
 */
export function useCoverageMapData(filters?: CoverageMapFilters) {
  return useQuery<MapMarker[]>({
    queryKey: ['coverage', 'map-data', filters],
    queryFn: () => fetchCoverageMapData(filters),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}
