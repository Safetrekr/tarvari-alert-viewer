'use client'

/**
 * TanStack Query hook for the live intel feed.
 *
 * Fetches the most recent `intel_normalized` rows (newest first)
 * for display in the FeedPanel and ActivityTicker. Polls every 30s.
 *
 * @module use-intel-feed
 */

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { IntelNormalizedRow } from '@/lib/supabase/types'

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
}

// ============================================================================
// Query function
// ============================================================================

async function fetchIntelFeed(): Promise<IntelFeedItem[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('intel_normalized')
    .select('id, title, severity, category, source_id, ingested_at')
    .order('ingested_at', { ascending: false })
    .limit(50)

  if (error) throw error
  if (!data) return []

  const rows = data as unknown as IntelNormalizedRow[]

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity,
    category: r.category,
    sourceId: r.source_id,
    ingestedAt: r.ingested_at,
  }))
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
