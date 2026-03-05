'use client'

/**
 * TanStack Query hook for intel bundles with triage decisions.
 *
 * Fetches bundles from `intel_bundles` with embedded `triage_decisions`,
 * filtered by the current view mode. Returns BundleWithDecision[] for
 * both 'triaged' and 'all-bundles' modes. Disabled for 'raw' mode
 * (raw mode uses existing useIntelFeed / useCoverageMapData hooks).
 *
 * @module use-intel-bundles
 */

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { IntelBundleRow, TriageDecisionRow } from '@/lib/supabase/types'
import type { BundleWithDecision, ViewMode } from '@/lib/interfaces/intel-bundles'

// ============================================================================
// Select string (shared between triaged and all-bundles queries)
// ============================================================================

const BUNDLE_SELECT = `
  id, title, summary, status, final_severity, categories,
  confidence_aggregate, risk_score, source_count, intel_count,
  member_intel_ids, primary_intel_id,
  representative_coordinates, geographic_scope, temporal_scope,
  risk_details, source_breakdown, analyst_notes,
  routed_at, routed_alert_count,
  created_at, updated_at,
  triage_decisions (
    id, bundle_id, version, decision, bucket, delivery_bucket,
    reviewer_id, note, decided_at,
    edited_title, edited_summary, edited_severity, edited_geo,
    suggested_trip_ids, selected_trip_ids, selected_trips,
    excluded_trips, impacted_orgs, diff
  )
` as const

// ============================================================================
// Response normalization
// ============================================================================

type RawBundleRow = IntelBundleRow & { triage_decisions: TriageDecisionRow[] }

function normalizeBundleResponse(data: unknown[]): BundleWithDecision[] {
  const rows = data as RawBundleRow[]

  return rows.map((row) => {
    const decisions = row.triage_decisions ?? []
    const latestDecision =
      decisions.length > 0
        ? decisions.reduce((latest, d) => (d.version > latest.version ? d : latest))
        : null

    const { triage_decisions: _, ...bundleRow } = row

    return {
      bundle: bundleRow as IntelBundleRow,
      decision: latestDecision,
    }
  })
}

// ============================================================================
// Query functions
// ============================================================================

async function fetchTriagedBundles(): Promise<BundleWithDecision[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('intel_bundles')
    .select(BUNDLE_SELECT)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  if (!data) return []

  return normalizeBundleResponse(data)
}

async function fetchAllBundles(): Promise<BundleWithDecision[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('intel_bundles')
    .select(BUNDLE_SELECT)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  if (!data) return []

  return normalizeBundleResponse(data)
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches intel bundles with triage decisions based on the current view mode.
 *
 * - 'triaged': bundles WHERE status = 'approved'
 * - 'all-bundles': all bundles regardless of status
 * - 'raw': disabled (raw mode uses useIntelFeed / useCoverageMapData)
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
