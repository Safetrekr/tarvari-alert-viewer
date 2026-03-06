'use client'

/**
 * TanStack Query hook for the live intel feed.
 *
 * Fetches the most recent normalized intel items from the
 * TarvaRI backend API (`/console/intel`) for display in the
 * FeedPanel and ActivityTicker. Polls every 30s.
 *
 * @module use-intel-feed
 */

import { useQuery } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import { DATA_MODE } from '@/lib/data-mode'
import { fetchIntelFeedFromSupabase } from '@/lib/supabase/queries'
import type { OperationalPriority } from '@/lib/interfaces/coverage'

// ============================================================================
// Types
// ============================================================================

export interface IntelFeedItem {
  id: string
  title: string
  severity: string
  category: string
  sourceId: string
  ingestedAt: string // ISO 8601
  operationalPriority: OperationalPriority | null
}

// ============================================================================
// API response type
// ============================================================================

interface ApiIntelItem {
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
  operational_priority: string | null
}

interface ApiIntelFeedResponse {
  items: ApiIntelItem[]
  total_count: number
}

// ============================================================================
// Query function
// ============================================================================

async function fetchIntelFeedFromConsole(): Promise<IntelFeedItem[]> {
  const data = await tarvariGet<ApiIntelFeedResponse>('/console/intel', { limit: 50 })

  return data.items.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity,
    category: r.category,
    sourceId: r.source_key ?? '',
    ingestedAt: r.ingested_at,
    operationalPriority: (r.operational_priority as OperationalPriority) ?? null,
  }))
}

async function fetchIntelFeed(): Promise<IntelFeedItem[]> {
  if (DATA_MODE === 'supabase') return fetchIntelFeedFromSupabase()
  return fetchIntelFeedFromConsole()
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches the 50 most recent intel items for the live feed panels.
 *
 * - queryKey: `['intel', 'feed']`
 * - staleTime: 20 seconds
 * - refetchInterval: 30 seconds
 */
export function useIntelFeed() {
  return useQuery<IntelFeedItem[]>({
    queryKey: ['intel', 'feed'],
    queryFn: fetchIntelFeed,
    staleTime: 20_000,
    refetchInterval: 30_000,
  })
}
