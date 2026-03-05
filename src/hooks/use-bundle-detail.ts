'use client'

/**
 * TanStack Query hook for a single bundle detail.
 *
 * Fetches a bundle from the TarvaRI backend API (`/console/bundles/:id`).
 * This is a dependent query -- it only runs when bundleId is non-null.
 *
 * @module use-bundle-detail
 */

import { useQuery } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import type { IntelBundleRow } from '@/lib/supabase/types'
import type { BundleWithMembers } from '@/lib/interfaces/intel-bundles'

// ============================================================================
// API response type
// ============================================================================

interface ApiBundleDetail {
  id: string
  title: string | null
  summary: string | null
  status: string
  final_severity: string | null
  intel_count: number
  source_count: number
  confidence_aggregate: number | null
  risk_score: number | null
  risk_details: Record<string, unknown> | null
  created_at: string
  updated_at: string | null
  routed_at: string | null
  routed_alert_count: number | null
  representative_coordinates: Record<string, unknown> | null
  geographic_scope: Record<string, unknown> | null
  temporal_scope: Record<string, unknown> | null
  analyst_notes: string | null
}

// ============================================================================
// Query function
// ============================================================================

async function fetchBundleDetail(bundleId: string): Promise<BundleWithMembers | null> {
  const data = await tarvariGet<ApiBundleDetail>(`/console/bundles/${bundleId}`)

  const bundle: IntelBundleRow = {
    id: data.id,
    title: data.title,
    summary: data.summary,
    status: data.status,
    final_severity: data.final_severity ?? 'Unknown',
    categories: null,
    confidence_aggregate: data.confidence_aggregate != null ? String(data.confidence_aggregate) : null,
    risk_score: data.risk_score != null ? String(data.risk_score) : null,
    source_count: data.source_count,
    intel_count: data.intel_count,
    member_intel_ids: [],
    primary_intel_id: '',
    dedup_hash: '',
    representative_coordinates: data.representative_coordinates as IntelBundleRow['representative_coordinates'],
    geographic_scope: data.geographic_scope as IntelBundleRow['geographic_scope'],
    temporal_scope: data.temporal_scope as IntelBundleRow['temporal_scope'],
    risk_details: data.risk_details as IntelBundleRow['risk_details'],
    source_breakdown: null,
    analyst_notes: data.analyst_notes,
    routed_at: data.routed_at,
    routed_alert_count: data.routed_alert_count ?? 0,
    created_at: data.created_at,
    updated_at: data.updated_at ?? '',
  }

  return {
    bundle,
    decision: null, // Detail endpoint doesn't include triage decisions yet
    members: [],
    primaryIntel: null,
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches a single bundle detail from the TarvaRI API.
 *
 * Dependent query: only runs when bundleId is non-null.
 * staleTime: 60s
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
