'use client'

/**
 * TanStack Query hook for coverage metrics.
 *
 * Fetches all rows from `intel_sources` via the Supabase browser client
 * and computes aggregate metrics client-side. The query is lightweight
 * (~38 rows) so no pagination is needed.
 *
 * @module use-coverage-metrics
 * @see WS-1.3 Section 4.3
 * @see HOOKS-SPEC.md
 */

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  buildCategoryMetrics,
  emptyMetrics,
  type CoverageMetrics,
  type SourceCoverage,
} from '@/lib/coverage-utils'
import type { IntelSourceRow } from '@/lib/supabase/types'

// ============================================================================
// Query function
// ============================================================================

async function fetchCoverageMetrics(): Promise<CoverageMetrics> {
  const supabase = getSupabaseBrowserClient()

  const { data: sources, error } = await supabase
    .from('intel_sources')
    .select('source_key, name, category, status, coverage')

  if (error) throw error
  if (!sources || sources.length === 0) return emptyMetrics()

  // Type-assert the untyped Supabase response to our known row shape.
  // The Supabase client in this codebase is not generically typed to Database.
  const typedSources = sources as unknown as IntelSourceRow[]

  // Build flat source list for the details table
  const sourcesByCoverage: SourceCoverage[] = typedSources.map((s) => ({
    sourceKey: s.source_key,
    name: s.name,
    category: s.category,
    status: s.status,
    geographicCoverage: s.coverage?.geo ?? null,
    updateFrequency: s.coverage?.frequency ?? null,
  }))

  // Aggregate by category
  const byCategory = buildCategoryMetrics(typedSources)

  return {
    totalSources: typedSources.length,
    activeSources: typedSources.filter((s) => s.status === 'active').length,
    categoriesCovered: byCategory.length,
    sourcesByCoverage,
    byCategory,
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches intel source coverage metrics from Supabase.
 *
 * Returns aggregate counts (total sources, active sources, categories covered),
 * a flat source list, and per-category breakdowns. Returns `emptyMetrics()` when
 * the table is empty.
 *
 * - queryKey: `['coverage', 'metrics']`
 * - staleTime: 45 seconds (sources change infrequently)
 * - refetchInterval: 60 seconds (background polling)
 */
export function useCoverageMetrics() {
  return useQuery<CoverageMetrics>({
    queryKey: ['coverage', 'metrics'],
    queryFn: fetchCoverageMetrics,
    staleTime: 45_000,
    refetchInterval: 60_000,
  })
}
