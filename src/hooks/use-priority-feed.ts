'use client'

/**
 * TanStack Query hook for the P1/P2 priority alert feed.
 *
 * Fetches from the dedicated `/console/priority-feed` endpoint
 * at a 15-second interval (2x the general intel feed frequency).
 * Exposes pre-computed summary values consumed by WS-2.2
 * (PriorityFeedStrip) and WS-2.3 (PriorityFeedPanel).
 *
 * @module use-priority-feed
 * @see WS-2.1
 * @see WS-2.2 (PriorityFeedStrip consumer)
 * @see WS-2.3 (PriorityFeedPanel consumer)
 * @see WS-2.4 (Realtime invalidation via PRIORITY_FEED_QUERY_KEY)
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import { DATA_MODE } from '@/lib/data-mode'
import { fetchPriorityFeedFromSupabase } from '@/lib/supabase/queries'
import type { OperationalPriority } from '@/lib/interfaces/coverage'

// ============================================================================
// API response types (snake_case, local)
// ============================================================================

interface ApiPriorityFeedItem {
  id: string
  title: string
  severity: string
  category: string
  event_type: string | null
  source_key: string | null
  confidence: number | null
  geo_scope: string[] | null
  short_summary: string | null
  ingested_at: string
  sent_at: string | null
  /** Always present — endpoint only returns P1/P2 items. */
  operational_priority: string
}

interface ApiPriorityFeedResponse {
  items: ApiPriorityFeedItem[]
  total_count: number
  p1_count?: number
  p2_count?: number
}

// ============================================================================
// Exported types (camelCase)
// ============================================================================

/**
 * A single P1/P2 priority feed item (normalized).
 * @see WS-2.2, WS-2.3
 */
export interface PriorityFeedItem {
  id: string
  title: string
  severity: string
  category: string
  /** Always 'P1' or 'P2' for this feed. */
  operationalPriority: OperationalPriority
  shortSummary: string | null
  eventType: string | null
  geoScope: string[] | null
  sourceKey: string | null
  ingestedAt: string
  sentAt: string | null
}

/**
 * Pre-computed summary returned by `usePriorityFeed`.
 * @see WS-2.2, WS-2.3
 */
export interface PriorityFeedSummary {
  items: PriorityFeedItem[]
  p1Count: number
  p2Count: number
  totalCount: number
  mostRecentP1: PriorityFeedItem | null
  mostRecentP2: PriorityFeedItem | null
}

// ============================================================================
// Query key (exported for WS-2.4 cache invalidation)
// ============================================================================

/**
 * Query key for the priority feed. Import this in WS-2.4
 * to call `queryClient.invalidateQueries({ queryKey: PRIORITY_FEED_QUERY_KEY })`.
 * @see WS-2.4
 */
export const PRIORITY_FEED_QUERY_KEY = ['priority', 'feed'] as const

// ============================================================================
// Query function
// ============================================================================

async function fetchPriorityFeed(): Promise<PriorityFeedSummary> {
  const data = await tarvariGet<ApiPriorityFeedResponse>('/console/priority-feed')

  const items: PriorityFeedItem[] = data.items.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity,
    category: r.category,
    operationalPriority: r.operational_priority as OperationalPriority,
    shortSummary: r.short_summary,
    eventType: r.event_type,
    geoScope: r.geo_scope,
    sourceKey: r.source_key,
    ingestedAt: r.ingested_at,
    sentAt: r.sent_at,
  }))

  // Prefer server-provided counts; fall back to client-side derivation
  const p1Count = data.p1_count ?? items.filter((i) => i.operationalPriority === 'P1').length
  const p2Count = data.p2_count ?? items.filter((i) => i.operationalPriority === 'P2').length

  return {
    items,
    p1Count,
    p2Count,
    totalCount: data.total_count,
    mostRecentP1: items.find((i) => i.operationalPriority === 'P1') ?? null,
    mostRecentP2: items.find((i) => i.operationalPriority === 'P2') ?? null,
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches P1/P2 priority intel items from `/console/priority-feed`.
 *
 * - queryKey: `['priority', 'feed']`
 * - staleTime: 10 seconds
 * - refetchInterval: 15 seconds
 * - placeholderData: keeps previous data during refetch (flicker-free)
 *
 * @see WS-2.2 (PriorityFeedStrip)
 * @see WS-2.3 (PriorityFeedPanel)
 */
export function usePriorityFeed() {
  return useQuery<PriorityFeedSummary>({
    queryKey: [...PRIORITY_FEED_QUERY_KEY, DATA_MODE],
    queryFn: DATA_MODE === 'supabase' ? fetchPriorityFeedFromSupabase : fetchPriorityFeed,
    staleTime: 10_000,
    refetchInterval: 15_000,
    placeholderData: keepPreviousData,
  })
}
