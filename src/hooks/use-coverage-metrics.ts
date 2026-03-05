'use client'

/**
 * TanStack Query hook for coverage metrics.
 *
 * Fetches aggregate source/category metrics from the TarvaRI
 * backend API (`/console/coverage`).
 *
 * @module use-coverage-metrics
 * @see WS-1.3 Section 4.3
 */

import { useQuery } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import {
  emptyMetrics,
  type CoverageMetrics,
  type CoverageByCategory,
  type SourceCoverage,
} from '@/lib/coverage-utils'

// ============================================================================
// API response types
// ============================================================================

interface ApiSourceCoverage {
  source_key: string
  name: string
  category: string
  status: string
  geographic_coverage: string | null
  update_frequency: string | null
}

interface ApiCategoryMetric {
  category: string
  source_count: number
  active_sources: number
  geographic_regions: string[]
}

interface ApiCoverageResponse {
  total_sources: number
  active_sources: number
  categories_covered: number
  sources_by_coverage: ApiSourceCoverage[]
  by_category: ApiCategoryMetric[]
}

// ============================================================================
// Query function
// ============================================================================

async function fetchCoverageMetrics(): Promise<CoverageMetrics> {
  const data = await tarvariGet<ApiCoverageResponse>('/console/coverage')

  const sourcesByCoverage: SourceCoverage[] = data.sources_by_coverage.map((s) => ({
    sourceKey: s.source_key,
    name: s.name,
    category: s.category,
    status: s.status,
    geographicCoverage: s.geographic_coverage,
    updateFrequency: s.update_frequency,
  }))

  const byCategory: CoverageByCategory[] = data.by_category.map((c) => ({
    category: c.category,
    sourceCount: c.source_count,
    activeSources: c.active_sources,
    geographicRegions: c.geographic_regions,
  }))

  return {
    totalSources: data.total_sources,
    activeSources: data.active_sources,
    categoriesCovered: data.categories_covered,
    sourcesByCoverage,
    byCategory,
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches intel source coverage metrics from the TarvaRI API.
 *
 * - queryKey: `['coverage', 'metrics']`
 * - staleTime: 45 seconds
 * - refetchInterval: 60 seconds
 */
export function useCoverageMetrics() {
  return useQuery<CoverageMetrics>({
    queryKey: ['coverage', 'metrics'],
    queryFn: fetchCoverageMetrics,
    staleTime: 45_000,
    refetchInterval: 60_000,
  })
}
