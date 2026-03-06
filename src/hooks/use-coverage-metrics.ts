'use client'

/**
 * TanStack Query hook for coverage metrics.
 *
 * Fetches aggregate source/category metrics from the TarvaRI
 * backend API (`/console/coverage`) and alert counts per category
 * from `/console/intel`.
 *
 * @module use-coverage-metrics
 * @see WS-1.3 Section 4.3
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import { DATA_MODE } from '@/lib/data-mode'
import { fetchCoverageMetricsFromSupabase } from '@/lib/supabase/queries'
import {
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

interface ApiIntelItem {
  category: string
  operational_priority: string | null
  [key: string]: unknown
}

interface ApiIntelResponse {
  items: ApiIntelItem[]
  total_count: number
}

// ============================================================================
// Query function
// ============================================================================

async function fetchCoverageMetricsFromConsole(): Promise<CoverageMetrics> {
  // Fetch both coverage (sources) and intel (alerts) in parallel
  const [coverageData, intelData] = await Promise.all([
    tarvariGet<ApiCoverageResponse>('/console/coverage'),
    tarvariGet<ApiIntelResponse>('/console/intel', { limit: 1000 }),
  ])

  // Count alerts and priority breakdown per category
  const categoryCounts = new Map<string, { total: number; p1: number; p2: number }>()
  for (const item of intelData.items) {
    const cat = item.category
    if (!categoryCounts.has(cat)) {
      categoryCounts.set(cat, { total: 0, p1: 0, p2: 0 })
    }
    const counts = categoryCounts.get(cat)!
    counts.total++
    if (item.operational_priority === 'P1') counts.p1++
    else if (item.operational_priority === 'P2') counts.p2++
  }

  const sourcesByCoverage: SourceCoverage[] = coverageData.sources_by_coverage.map((s) => ({
    sourceKey: s.source_key,
    name: s.name,
    category: s.category,
    status: s.status,
    geographicCoverage: s.geographic_coverage,
    updateFrequency: s.update_frequency,
  }))

  const byCategory: CoverageByCategory[] = coverageData.by_category.map((c) => {
    const counts = categoryCounts.get(c.category)
    return {
      category: c.category,
      sourceCount: c.source_count,
      activeSources: c.active_sources,
      geographicRegions: c.geographic_regions,
      alertCount: counts?.total ?? 0,
      p1Count: counts?.p1 ?? 0,
      p2Count: counts?.p2 ?? 0,
    }
  })

  return {
    totalSources: coverageData.total_sources,
    activeSources: coverageData.active_sources,
    categoriesCovered: coverageData.categories_covered,
    totalAlerts: intelData.total_count,
    sourcesByCoverage,
    byCategory,
  }
}

async function fetchCoverageMetrics(): Promise<CoverageMetrics> {
  if (DATA_MODE === 'supabase') return fetchCoverageMetricsFromSupabase()
  return fetchCoverageMetricsFromConsole()
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
    placeholderData: keepPreviousData,
  })
}
