'use client'

/**
 * TanStack Query hooks for the TarvaRI digest/briefing system.
 *
 * @module use-digests
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import type {
  DigestListResponse,
  DigestResponse,
  DigestEvidenceResponse,
  DigestStatus,
  DigestPeriod,
} from '@/lib/interfaces/digest'

// ---------------------------------------------------------------------------
// List digests
// ---------------------------------------------------------------------------

export interface UseDigestsParams {
  tripId?: string
  period?: DigestPeriod
  status?: DigestStatus
  limit?: number
  offset?: number
}

/**
 * Fetches a paginated list of digests from `/console/digests`.
 *
 * - queryKey: `['digests', 'list', params]`
 * - staleTime: 60 seconds
 * - refetchInterval: 120 seconds
 */
export function useDigests(params: UseDigestsParams = {}) {
  return useQuery<DigestListResponse>({
    queryKey: ['digests', 'list', params],
    queryFn: () =>
      tarvariGet<DigestListResponse>('/console/digests', {
        trip_id: params.tripId,
        period: params.period,
        status: params.status,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      }),
    staleTime: 60_000,
    refetchInterval: 120_000,
    placeholderData: keepPreviousData,
  })
}

// ---------------------------------------------------------------------------
// Single digest detail
// ---------------------------------------------------------------------------

/**
 * Fetches a single digest by ID from `/console/digests/:id`.
 *
 * - queryKey: `['digests', 'detail', digestId]`
 * - staleTime: 30 seconds
 * - Enabled only when digestId is truthy
 */
export function useDigestDetail(digestId: string | null) {
  return useQuery<DigestResponse>({
    queryKey: ['digests', 'detail', digestId],
    queryFn: () => tarvariGet<DigestResponse>(`/console/digests/${digestId}`),
    enabled: !!digestId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

// ---------------------------------------------------------------------------
// Digest evidence (provenance chain)
// ---------------------------------------------------------------------------

/**
 * Fetches the evidence chain for a digest from `/console/digests/:id/evidence`.
 *
 * - queryKey: `['digests', 'evidence', digestId]`
 * - staleTime: 60 seconds
 * - Enabled only when digestId is truthy
 */
export function useDigestEvidence(digestId: string | null) {
  return useQuery<DigestEvidenceResponse>({
    queryKey: ['digests', 'evidence', digestId],
    queryFn: () =>
      tarvariGet<DigestEvidenceResponse>(
        `/console/digests/${digestId}/evidence`,
      ),
    enabled: !!digestId,
    staleTime: 60_000,
  })
}

// ---------------------------------------------------------------------------
// Latest published digest (convenience)
// ---------------------------------------------------------------------------

/**
 * Fetches the most recent published digest.
 * Useful for the situation tab briefing card.
 *
 * - queryKey: `['digests', 'latest-published']`
 * - staleTime: 60 seconds
 * - refetchInterval: 120 seconds
 */
export function useLatestDigest() {
  return useQuery<DigestResponse | null>({
    queryKey: ['digests', 'latest-published'],
    queryFn: async () => {
      const res = await tarvariGet<DigestListResponse>('/console/digests', {
        status: 'published',
        limit: 1,
        offset: 0,
      })
      return res.digests[0] ?? null
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
    placeholderData: keepPreviousData,
  })
}
