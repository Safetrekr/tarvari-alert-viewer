'use client'

/**
 * TanStack Query hook for a single bundle with resolved member intel items.
 *
 * This is a dependent query -- it only runs when bundleId is non-null.
 * Used for the bundle drill-down / detail view.
 *
 * @module use-bundle-detail
 */

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { IntelBundleRow, TriageDecisionRow, IntelNormalizedRow } from '@/lib/supabase/types'
import type { BundleWithMembers } from '@/lib/interfaces/intel-bundles'

// ============================================================================
// Query function
// ============================================================================

async function fetchBundleDetail(bundleId: string): Promise<BundleWithMembers | null> {
  const supabase = getSupabaseBrowserClient()

  // Step 1: Fetch bundle with embedded triage decisions
  const { data: bundleData, error: bundleError } = await supabase
    .from('intel_bundles')
    .select(`
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
    `)
    .eq('id', bundleId)
    .single()

  if (bundleError) throw bundleError
  if (!bundleData) return null

  const bundle = bundleData as unknown as IntelBundleRow & {
    triage_decisions: TriageDecisionRow[]
  }

  // Step 2: Resolve member intel items
  const memberIds = bundle.member_intel_ids ?? []

  let members: IntelNormalizedRow[] = []
  if (memberIds.length > 0) {
    const { data: memberData, error: memberError } = await supabase
      .from('intel_normalized')
      .select('id, title, severity, category, source_id, geo, ingested_at')
      .in('id', memberIds)

    if (memberError) throw memberError
    members = (memberData as unknown as IntelNormalizedRow[]) ?? []
  }

  // Extract latest triage decision (highest version)
  const decisions = bundle.triage_decisions ?? []
  const latestDecision = decisions.length > 0
    ? decisions.reduce((latest, d) => d.version > latest.version ? d : latest)
    : null

  // Resolve primary intel item
  const primaryIntel = members.find((m) => m.id === bundle.primary_intel_id) ?? null

  // Strip embedded triage_decisions to match IntelBundleRow shape
  const { triage_decisions: _, ...bundleRow } = bundle

  return {
    bundle: bundleRow as IntelBundleRow,
    decision: latestDecision,
    members,
    primaryIntel,
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches a single bundle with its triage decision and resolved members.
 *
 * Dependent query: only runs when bundleId is non-null.
 * staleTime: 60s (detail view is less frequently changing)
 */
export function useBundleDetail(bundleId: string | null) {
  return useQuery<BundleWithMembers | null>({
    queryKey: ['intel', 'bundle', bundleId],
    queryFn: () => {
      if (!bundleId) return Promise.resolve(null)
      return fetchBundleDetail(bundleId)
    },
    enabled: bundleId != null,
    staleTime: 60_000,
  })
}
