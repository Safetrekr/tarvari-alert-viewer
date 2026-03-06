/**
 * Supabase query functions for public deployment mode.
 *
 * Each function mirrors a TarvaRI API fetch function used by the
 * application's TanStack Query hooks. When NEXT_PUBLIC_DATA_MODE is
 * 'supabase', hooks import these functions instead of tarvariGet-based
 * fetchers (see WS-6.1).
 *
 * All queries target public Supabase views created by backend Phase E.1:
 * - public_intel_feed
 * - public_coverage_map
 * - public_bundles
 * - public_bundle_detail
 *
 * These views expose only approved, non-sensitive intel data through
 * RLS policies on the anon key.
 *
 * @module supabase/queries
 */

import { getSupabaseBrowserClient } from './client'
import type { ThreatPicture } from '@/hooks/use-threat-picture'
import type { PriorityFeedSummary, PriorityFeedItem } from '@/hooks/use-priority-feed'
import type { GeoSummary } from '@/hooks/use-geo-summaries'
import type { IntelFeedItem } from '@/hooks/use-intel-feed'
import type { CoverageMapFilters } from '@/hooks/use-coverage-map-data'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import type { MapMarker, CoverageMetrics, CoverageByCategory } from '@/lib/coverage-utils'
import type { IntelBundleRow } from '@/lib/supabase/types'
import type { BundleWithDecision, BundleWithMembers, ViewMode } from '@/lib/interfaces/intel-bundles'

// ============================================================================
// fetchIntelFeedFromSupabase
// ============================================================================

/**
 * Fetch recent intel items from the `public_intel_feed` view.
 *
 * Mirrors `fetchIntelFeed()` in `use-intel-feed.ts`.
 * Returns the 50 most recent items ordered by ingested_at desc.
 */
export async function fetchIntelFeedFromSupabase(): Promise<IntelFeedItem[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('public_intel_feed')
    .select('id, title, severity, category, source_key, ingested_at')
    .order('ingested_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error('Supabase query failed (public_intel_feed): ' + error.message)
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: r.title as string,
    severity: r.severity as string,
    category: r.category as string,
    sourceId: (r.source_key as string) ?? '',
    ingestedAt: r.ingested_at as string,
    operationalPriority: null,
  }))
}

// ============================================================================
// fetchCoverageMapDataFromSupabase
// ============================================================================

/**
 * Fetch geo-located intel items from the `public_coverage_map` view.
 *
 * Mirrors `fetchCoverageMapData()` in `use-coverage-map-data.ts`.
 * Supports category, severity, and date range filters.
 * bbox and sourceKey filters are not supported in the Supabase path.
 */
export async function fetchCoverageMapDataFromSupabase(
  filters?: CoverageMapFilters,
): Promise<MapMarker[]> {
  const supabase = getSupabaseBrowserClient()

  let query = supabase
    .from('public_coverage_map')
    .select('id, title, severity, category, source_key, ingested_at, geo')

  if (filters?.categories && filters.categories.length > 0) {
    query = query.in('category', filters.categories)
  } else if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity)
  }
  if (filters?.startDate) {
    query = query.gte('ingested_at', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('ingested_at', filters.endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Supabase query failed (public_coverage_map): ' + error.message)
  }

  if (!data) return []

  return data
    .filter((r: Record<string, unknown>) => {
      const geo = r.geo as { type?: string; coordinates?: unknown } | null
      if (!geo || geo.type !== 'Point') return false
      const coords = geo.coordinates
      return (
        Array.isArray(coords) &&
        coords.length >= 2 &&
        typeof coords[0] === 'number' &&
        typeof coords[1] === 'number'
      )
    })
    .map((r: Record<string, unknown>) => {
      const geo = r.geo as { coordinates: number[] }
      return {
        id: (r.id as string) ?? crypto.randomUUID(),
        lat: geo.coordinates[1],
        lng: geo.coordinates[0],
        title: (r.title as string) ?? 'Intel Item',
        severity: (r.severity as string) ?? 'Unknown',
        category: (r.category as string) ?? 'other',
        sourceId: (r.source_key as string) ?? '',
        ingestedAt: (r.ingested_at as string) ?? '',
        operationalPriority: null,
      }
    })
}

// ============================================================================
// fetchCoverageMetricsFromSupabase
// ============================================================================

/**
 * Derive coverage metrics from the `public_intel_feed` view.
 *
 * Mirrors `fetchCoverageMetrics()` in `use-coverage-metrics.ts`.
 * Source-level fields are zeroed -- not available in public deployment.
 * Alert counts and category breakdowns are derived from row counts.
 */
export async function fetchCoverageMetricsFromSupabase(): Promise<CoverageMetrics> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('public_intel_feed')
    .select('category')
    .limit(10000)

  if (error) {
    throw new Error('Supabase query failed (public_intel_feed/metrics): ' + error.message)
  }

  const rows = data ?? []

  const categoryCounts = new Map<string, number>()
  for (const row of rows) {
    const cat = (row as Record<string, unknown>).category as string
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
  }

  const byCategory: CoverageByCategory[] = Array.from(categoryCounts.entries()).map(
    ([category, count]) => ({
      category,
      sourceCount: 0,
      activeSources: 0,
      geographicRegions: [],
      alertCount: count,
      p1Count: 0,
      p2Count: 0,
    }),
  )

  return {
    totalSources: 0,
    activeSources: 0,
    categoriesCovered: categoryCounts.size,
    totalAlerts: rows.length,
    sourcesByCoverage: [],
    byCategory,
  }
}

// ============================================================================
// fetchBundlesFromSupabase
// ============================================================================

/**
 * Fetch intel bundles from the `public_bundles` view.
 *
 * Mirrors `fetchTriagedBundles()` / `fetchAllBundles()` in `use-intel-bundles.ts`.
 * Accepts a ViewMode parameter to apply status filtering:
 * - 'triaged': only approved bundles
 * - 'all-bundles': all bundles
 * - 'raw': caller should not invoke this function
 */
export async function fetchBundlesFromSupabase(
  viewMode: ViewMode,
): Promise<BundleWithDecision[]> {
  const supabase = getSupabaseBrowserClient()

  let query = supabase
    .from('public_bundles')
    .select(
      'id, title, status, final_severity, intel_count, source_count, risk_score, created_at, routed_at, routed_alert_count',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (viewMode === 'triaged') {
    query = query.eq('status', 'approved')
  }

  const { data, error } = await query

  if (error) {
    throw new Error('Supabase query failed (public_bundles): ' + error.message)
  }

  return (data ?? []).map((r: Record<string, unknown>) => {
    const bundle: IntelBundleRow = {
      id: r.id as string,
      title: (r.title as string) ?? null,
      summary: null,
      status: r.status as string,
      final_severity: (r.final_severity as string) ?? 'Unknown',
      categories: null,
      confidence_aggregate: null,
      risk_score: r.risk_score != null ? String(r.risk_score) : null,
      source_count: (r.source_count as number) ?? 0,
      intel_count: (r.intel_count as number) ?? 0,
      member_intel_ids: [],
      primary_intel_id: '',
      dedup_hash: '',
      representative_coordinates: null,
      geographic_scope: null,
      temporal_scope: null,
      risk_details: null,
      source_breakdown: null,
      analyst_notes: null,
      routed_at: (r.routed_at as string) ?? null,
      routed_alert_count: (r.routed_alert_count as number) ?? 0,
      created_at: r.created_at as string,
      updated_at: '',
    }

    return { bundle, decision: null, operationalPriority: null }
  })
}

// ============================================================================
// fetchBundleDetailFromSupabase
// ============================================================================

/**
 * Fetch a single bundle from the `public_bundle_detail` view.
 *
 * Mirrors `fetchBundleDetail()` in `use-bundle-detail.ts`.
 * Returns null when no row matches the given ID (PGRST116).
 */
export async function fetchBundleDetailFromSupabase(
  bundleId: string,
): Promise<BundleWithMembers | null> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('public_bundle_detail')
    .select(
      'id, title, summary, status, final_severity, intel_count, source_count, confidence_aggregate, risk_score, risk_details, created_at, updated_at, routed_at, routed_alert_count, representative_coordinates, geographic_scope, temporal_scope, analyst_notes',
    )
    .eq('id', bundleId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error('Supabase query failed (public_bundle_detail): ' + error.message)
  }

  if (!data) return null

  const r = data as Record<string, unknown>

  const bundle: IntelBundleRow = {
    id: r.id as string,
    title: (r.title as string) ?? null,
    summary: (r.summary as string) ?? null,
    status: r.status as string,
    final_severity: (r.final_severity as string) ?? 'Unknown',
    categories: null,
    confidence_aggregate:
      r.confidence_aggregate != null ? String(r.confidence_aggregate) : null,
    risk_score: r.risk_score != null ? String(r.risk_score) : null,
    source_count: (r.source_count as number) ?? 0,
    intel_count: (r.intel_count as number) ?? 0,
    member_intel_ids: [],
    primary_intel_id: '',
    dedup_hash: '',
    representative_coordinates: r.representative_coordinates as IntelBundleRow['representative_coordinates'],
    geographic_scope: r.geographic_scope as IntelBundleRow['geographic_scope'],
    temporal_scope: r.temporal_scope as IntelBundleRow['temporal_scope'],
    risk_details: r.risk_details as IntelBundleRow['risk_details'],
    source_breakdown: null,
    analyst_notes: (r.analyst_notes as string) ?? null,
    routed_at: (r.routed_at as string) ?? null,
    routed_alert_count: (r.routed_alert_count as number) ?? 0,
    created_at: r.created_at as string,
    updated_at: (r.updated_at as string) ?? '',
  }

  return {
    bundle,
    decision: null,
    operationalPriority: null,
    members: [],
    primaryIntel: null,
  }
}

// ============================================================================
// fetchCategoryIntelFromSupabase
// ============================================================================

/**
 * Fetch intel items for a specific category from the `public_intel_feed` view.
 *
 * Mirrors `fetchCategoryIntel()` in `use-category-intel.ts`.
 * Fields not available in the public view (eventType, confidence,
 * geoScope, shortSummary, sentAt) are returned as null.
 */
export async function fetchCategoryIntelFromSupabase(
  category: string,
): Promise<CategoryIntelItem[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('public_intel_feed')
    .select('id, title, severity, category, source_key, ingested_at')
    .eq('category', category)
    .order('ingested_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error(
      'Supabase query failed (public_intel_feed/category): ' + error.message,
    )
  }

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: r.title as string,
    severity: r.severity as string,
    category: r.category as string,
    eventType: null,
    sourceKey: (r.source_key as string) ?? null,
    confidence: null,
    geoScope: null,
    shortSummary: null,
    ingestedAt: r.ingested_at as string,
    sentAt: null,
    operationalPriority: null,
  }))
}

// ============================================================================
// fetchThreatPictureFromSupabase
// ============================================================================

/**
 * Derive an approximate threat picture from `public_intel_feed`.
 *
 * Mirrors `fetchThreatPicture()` in `use-threat-picture.ts`.
 * Priority and region breakdowns are not available — returned as empty.
 */
export async function fetchThreatPictureFromSupabase(): Promise<ThreatPicture> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('public_intel_feed')
    .select('category, severity')
    .limit(10000)

  if (error) {
    throw new Error('Supabase query failed (public_intel_feed/threat-picture): ' + error.message)
  }

  const rows = data ?? []

  const categoryCounts = new Map<string, number>()
  const severityCounts = new Map<string, number>()

  for (const row of rows) {
    const r = row as Record<string, unknown>
    const cat = r.category as string
    const sev = r.severity as string
    categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
    severityCounts.set(sev, (severityCounts.get(sev) ?? 0) + 1)
  }

  const total = rows.length || 1

  return {
    totalActiveAlerts: rows.length,
    byCategory: Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count, trend: 'stable' as const })),
    bySeverity: Array.from(severityCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([severity, count]) => ({
        severity: severity as import('@/lib/interfaces/coverage').SeverityLevel,
        count,
        percentage: Math.round((count / total) * 100),
      })),
    byPriority: [],
    byRegion: [],
    overallTrend: 'stable',
    trendDetail: null,
    generatedAt: new Date().toISOString(),
    periodStart: new Date().toISOString(),
    periodEnd: new Date().toISOString(),
  }
}

// ============================================================================
// fetchPriorityFeedFromSupabase
// ============================================================================

/**
 * Fetch P1/P2 priority items from `public_intel_feed`.
 *
 * Mirrors `fetchPriorityFeed()` in `use-priority-feed.ts`.
 */
export async function fetchPriorityFeedFromSupabase(): Promise<PriorityFeedSummary> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('public_intel_feed')
    .select('id, title, severity, category, source_key, ingested_at, operational_priority')
    .in('operational_priority', ['P1', 'P2'])
    .order('ingested_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error('Supabase query failed (public_intel_feed/priority): ' + error.message)
  }

  const items: PriorityFeedItem[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: r.title as string,
    severity: r.severity as string,
    category: r.category as string,
    operationalPriority: (r.operational_priority as string) as PriorityFeedItem['operationalPriority'],
    shortSummary: null,
    eventType: null,
    geoScope: null,
    sourceKey: (r.source_key as string) ?? null,
    ingestedAt: r.ingested_at as string,
    sentAt: null,
  }))

  const p1Count = items.filter((i) => i.operationalPriority === 'P1').length
  const p2Count = items.filter((i) => i.operationalPriority === 'P2').length

  return {
    items,
    p1Count,
    p2Count,
    totalCount: items.length,
    mostRecentP1: items.find((i) => i.operationalPriority === 'P1') ?? null,
    mostRecentP2: items.find((i) => i.operationalPriority === 'P2') ?? null,
  }
}

// ============================================================================
// fetchSummaryAvailabilityFromSupabase
// ============================================================================

/**
 * Fetch summary availability from the `public_geo_summaries` view.
 *
 * Returns the same shape used by ThreatPictureCard's summary availability.
 */
export async function fetchSummaryAvailabilityFromSupabase(): Promise<{
  global: { hourly: string | null; daily: string | null }
  regions: Array<{ key: string; type: string; generatedAt: string }>
}> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('public_geo_summaries')
    .select('geo_level, geo_key, summary_type, generated_at')
    .order('generated_at', { ascending: false })

  if (error) {
    return { global: { hourly: null, daily: null }, regions: [] }
  }

  let hourly: string | null = null
  let daily: string | null = null
  const regions: Array<{ key: string; type: string; generatedAt: string }> = []

  for (const row of data ?? []) {
    const r = row as Record<string, unknown>
    const level = r.geo_level as string
    const type = r.summary_type as string
    const genAt = r.generated_at as string

    if (level === 'world') {
      if (type === 'hourly' && !hourly) hourly = genAt
      if (type === 'daily' && !daily) daily = genAt
    } else if (level === 'region' || level === 'country') {
      regions.push({ key: r.geo_key as string, type, generatedAt: genAt })
    }
  }

  return { global: { hourly, daily }, regions }
}

// ============================================================================
// fetchGeoSummariesFromSupabase
// ============================================================================

/**
 * Fetch all geo summaries from the `public_geo_summaries` view.
 *
 * Mirrors `useAllGeoSummaries` query function. Returns raw rows in the
 * ApiGeoSummary shape so the existing `normalizeGeoSummary` can process them.
 */
export async function fetchGeoSummariesFromSupabase(): Promise<
  Array<{
    id: string
    geo_level: string
    geo_key: string
    summary_type: string
    summary_text: string
    structured_breakdown: Record<string, unknown> | string
    generated_at: string
    validated_at: string | null
  }>
> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('public_geo_summaries')
    .select('id, geo_level, geo_key, summary_type, summary_text, structured_breakdown, generated_at, validated_at')
    .order('generated_at', { ascending: false })

  if (error) {
    throw new Error('Supabase query failed (public_geo_summaries): ' + error.message)
  }

  return (data ?? []) as Array<{
    id: string
    geo_level: string
    geo_key: string
    summary_type: string
    summary_text: string
    structured_breakdown: Record<string, unknown> | string
    generated_at: string
    validated_at: string | null
  }>
}
