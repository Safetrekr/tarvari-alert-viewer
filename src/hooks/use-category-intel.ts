'use client'

/**
 * TanStack Query hook for fetching full intel items for a specific category.
 *
 * Returns richer data than useCoverageMapData (which only has GeoJSON properties).
 * Includes short_summary, event_type, confidence, geo_scope, sent_at.
 *
 * Used by CategoryDetailScene for the alert list + dock detail panel.
 *
 * @module use-category-intel
 */

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import { DATA_MODE } from '@/lib/data-mode'
import { fetchCategoryIntelFromSupabase } from '@/lib/supabase/queries'
import type { OperationalPriority } from '@/lib/interfaces/coverage'

// ============================================================================
// Types
// ============================================================================

export interface CategoryIntelItem {
  id: string
  title: string
  severity: string
  category: string
  eventType: string | null
  sourceKey: string | null
  confidence: number | null
  geoScope: string[] | null
  shortSummary: string | null
  ingestedAt: string
  sentAt: string | null
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

interface ApiIntelResponse {
  items: ApiIntelItem[]
  total_count: number
}

// ============================================================================
// Query function
// ============================================================================

async function fetchCategoryIntelFromConsole(category: string): Promise<CategoryIntelItem[]> {
  const data = await tarvariGet<ApiIntelResponse>('/console/intel', {
    category,
    limit: 200,
  })

  return data.items.map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity,
    category: r.category,
    eventType: r.event_type,
    sourceKey: r.source_key,
    confidence: r.confidence != null && r.confidence > 1 ? r.confidence / 100 : r.confidence,
    geoScope: r.geo_scope,
    shortSummary: r.short_summary,
    ingestedAt: r.ingested_at,
    sentAt: r.sent_at,
    operationalPriority: (r.operational_priority as OperationalPriority) ?? null,
  }))
}

async function fetchCategoryIntel(category: string): Promise<CategoryIntelItem[]> {
  if (DATA_MODE === 'supabase') return fetchCategoryIntelFromSupabase(category)
  return fetchCategoryIntelFromConsole(category)
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches up to 200 intel items for a specific category with full detail.
 *
 * - queryKey: `['intel', 'category', categoryId]`
 * - staleTime: 30 seconds
 * - refetchInterval: 45 seconds
 * - enabled: only when categoryId is truthy
 */
export function useCategoryIntel(categoryId: string | null) {
  return useQuery<CategoryIntelItem[]>({
    queryKey: ['intel', 'category', categoryId],
    queryFn: () => fetchCategoryIntel(categoryId!),
    enabled: !!categoryId,
    staleTime: 30_000,
    refetchInterval: 45_000,
    placeholderData: keepPreviousData,
  })
}
