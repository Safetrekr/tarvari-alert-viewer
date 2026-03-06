'use client'

/**
 * TanStack Query hook for intel bundles.
 *
 * Fetches bundles from the TarvaRI backend API (`/console/bundles`),
 * filtered by the current view mode. Returns BundleWithDecision[] for
 * both 'triaged' and 'all-bundles' modes. Disabled for 'raw' mode
 * (raw mode uses existing useIntelFeed / useCoverageMapData hooks).
 *
 * @module use-intel-bundles
 */

import { useQuery } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import { DATA_MODE } from '@/lib/data-mode'
import { fetchBundlesFromSupabase } from '@/lib/supabase/queries'
import type { IntelBundleRow } from '@/lib/supabase/types'
import type { BundleWithDecision, ViewMode } from '@/lib/interfaces/intel-bundles'
import type { OperationalPriority } from '@/lib/interfaces/coverage'

// ============================================================================
// API response types
// ============================================================================

interface ApiBundleItem {
  id: string
  title: string | null
  status: string
  final_severity: string | null
  intel_count: number
  source_count: number
  risk_score: number | null
  created_at: string
  routed_at: string | null
  routed_alert_count: number | null
  operational_priority: string | null
}

interface ApiBundlesList {
  items: ApiBundleItem[]
  total_count: number
}

// ============================================================================
// Response normalization
// ============================================================================

function apiToBundle(item: ApiBundleItem): BundleWithDecision {
  const bundle: IntelBundleRow = {
    id: item.id,
    title: item.title,
    summary: null,
    status: item.status,
    final_severity: item.final_severity ?? 'Unknown',
    categories: null,
    confidence_aggregate: null,
    risk_score: item.risk_score != null ? String(item.risk_score) : null,
    source_count: item.source_count,
    intel_count: item.intel_count,
    member_intel_ids: [],
    primary_intel_id: '',
    dedup_hash: '',
    representative_coordinates: null,
    geographic_scope: null,
    temporal_scope: null,
    risk_details: null,
    source_breakdown: null,
    analyst_notes: null,
    routed_at: item.routed_at,
    routed_alert_count: item.routed_alert_count ?? 0,
    created_at: item.created_at,
    updated_at: '',
  }

  return {
    bundle,
    decision: null,
    operationalPriority: (item.operational_priority as OperationalPriority) ?? null,
  }
}

// ============================================================================
// Query functions
// ============================================================================

async function fetchTriagedBundlesFromConsole(): Promise<BundleWithDecision[]> {
  const data = await tarvariGet<ApiBundlesList>('/console/bundles', {
    status: 'approved',
    limit: 100,
  })
  return data.items.map(apiToBundle)
}

async function fetchAllBundlesFromConsole(): Promise<BundleWithDecision[]> {
  const data = await tarvariGet<ApiBundlesList>('/console/bundles', { limit: 100 })
  return data.items.map(apiToBundle)
}

async function fetchTriagedBundles(): Promise<BundleWithDecision[]> {
  if (DATA_MODE === 'supabase') return fetchBundlesFromSupabase('triaged')
  return fetchTriagedBundlesFromConsole()
}

async function fetchAllBundles(): Promise<BundleWithDecision[]> {
  if (DATA_MODE === 'supabase') return fetchBundlesFromSupabase('all-bundles')
  return fetchAllBundlesFromConsole()
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches intel bundles based on the current view mode.
 *
 * - 'triaged': bundles with status = 'approved'
 * - 'all-bundles': all bundles regardless of status
 * - 'raw': disabled
 *
 * staleTime: 30s, refetchInterval: 45s
 */
export function useIntelBundles(viewMode: ViewMode) {
  const isEnabled = viewMode !== 'raw'

  return useQuery<BundleWithDecision[]>({
    queryKey: ['intel', 'bundles', viewMode],
    queryFn: () => {
      if (viewMode === 'triaged') return fetchTriagedBundles()
      if (viewMode === 'all-bundles') return fetchAllBundles()
      return Promise.resolve([])
    },
    enabled: isEnabled,
    staleTime: 30_000,
    refetchInterval: 45_000,
  })
}
