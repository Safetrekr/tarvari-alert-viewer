'use client'

/**
 * useIntelSearch -- debounced full-text search hook for TarvaRI intel.
 *
 * Searches the `/console/search/intel` endpoint with 300ms debounce,
 * returning ranked results with ts_headline HTML snippets. Gated on
 * query length >= 3 characters.
 *
 * @module use-intel-search
 * @see WS-3.1
 * @see WS-3.2 (CommandPalette consumer)
 * @see WS-3.3 (fast morph navigation)
 */

import { useState, useEffect } from 'react'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import { DATA_MODE } from '@/lib/data-mode'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { OperationalPriority } from '@/lib/interfaces/coverage'

// ============================================================================
// API types (snake_case, local)
// ============================================================================

interface ApiSearchResult {
  id: string
  title: string
  snippet: string
  severity: string
  category: string
  operational_priority: string | null
  score: number
}

interface ApiSearchResponse {
  results: ApiSearchResult[]
  total_count: number
}

// ============================================================================
// Exported types
// ============================================================================

/** A single search result, normalized to camelCase. */
export interface SearchResult {
  id: string
  title: string
  /** ts_headline HTML snippet with matched terms in <b> tags. Raw HTML -- sanitize before rendering. */
  snippet: string
  severity: string
  /** Intel category identifier (e.g., 'seismic', 'conflict'). Used by WS-3.3 for morph target. */
  category: string
  /** Operational priority level, or null if not yet assigned. */
  operationalPriority: OperationalPriority | null
  /** Relevance score from PostgreSQL ts_rank (0.0-1.0). Higher = more relevant. */
  score: number
}

/** Input parameters for the useIntelSearch hook. */
export interface IntelSearchParams {
  /** The search query string. Searches are enabled when this is >= 3 characters. */
  query: string
  category?: string
  severity?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}

/** Composite return type wrapping TanStack Query result + debounced query. */
export interface UseIntelSearchResult {
  /** The TanStack Query result containing SearchResult[] data. */
  queryResult: UseQueryResult<SearchResult[]>
  /** The debounced query string currently being searched. */
  debouncedQuery: string
}

// ============================================================================
// Query key factory
// ============================================================================

/**
 * Build a TanStack Query key for intel search.
 * @see WS-3.1 D-8
 */
export function intelSearchKey(params: IntelSearchParams): readonly unknown[] {
  return ['intel', 'search', {
    q: params.query,
    category: params.category,
    severity: params.severity,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    limit: params.limit,
    offset: params.offset,
  }] as const
}

// ============================================================================
// Query function
// ============================================================================

async function fetchIntelSearch(params: IntelSearchParams): Promise<SearchResult[]> {
  const apiParams: Record<string, string | number | undefined> = {
    q: params.query,
    category: params.category,
    severity: params.severity,
    date_from: params.dateFrom,
    date_to: params.dateTo,
    limit: params.limit ?? 10,
    offset: params.offset ?? 0,
  }

  const data = await tarvariGet<ApiSearchResponse>('/console/search/intel', apiParams)

  return data.results.map((r) => ({
    id: r.id,
    title: r.title,
    snippet: r.snippet,
    severity: r.severity,
    category: r.category,
    operationalPriority: (r.operational_priority as OperationalPriority) ?? null,
    score: r.score,
  }))
}

async function fetchIntelSearchFromSupabase(params: IntelSearchParams): Promise<SearchResult[]> {
  const supabase = getSupabaseBrowserClient()

  let query = supabase
    .from('public_intel_feed')
    .select('id, title, severity, category, operational_priority')
    .ilike('title', `%${params.query}%`)
    .order('ingested_at', { ascending: false })
    .limit(params.limit ?? 10)

  if (params.category) {
    query = query.eq('category', params.category)
  }
  if (params.severity) {
    query = query.eq('severity', params.severity)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Supabase search failed: ' + error.message)
  }

  return (data ?? []).map((r: Record<string, unknown>, i: number) => ({
    id: r.id as string,
    title: r.title as string,
    snippet: r.title as string,
    severity: r.severity as string,
    category: r.category as string,
    operationalPriority: (r.operational_priority as OperationalPriority) ?? null,
    score: 1 - i * 0.01,
  }))
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Debounced full-text search for intel items.
 *
 * 300ms debounce prevents API hammering during typing.
 * Gated on debounced query length >= 3 characters.
 * No polling, no window-focus refetch.
 *
 * @see WS-3.1
 */
export function useIntelSearch(params: IntelSearchParams): UseIntelSearchResult {
  const [debouncedQuery, setDebouncedQuery] = useState(params.query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(params.query)
    }, 300)
    return () => clearTimeout(timer)
  }, [params.query])

  const debouncedParams = { ...params, query: debouncedQuery }

  const queryResult = useQuery<SearchResult[]>({
    queryKey: intelSearchKey(debouncedParams),
    queryFn: () =>
      DATA_MODE === 'supabase'
        ? fetchIntelSearchFromSupabase(debouncedParams)
        : fetchIntelSearch(debouncedParams),
    enabled: debouncedQuery.length >= 3,
    refetchOnWindowFocus: false,
  })

  return { queryResult, debouncedQuery }
}
