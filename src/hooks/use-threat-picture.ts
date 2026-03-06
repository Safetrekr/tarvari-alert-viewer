'use client'

/**
 * TanStack Query hook for the aggregated threat picture.
 *
 * Fetches threat intelligence aggregations from the TarvaRI
 * backend API (`/console/threat-picture`) for display in the
 * geo summary panel and category card trend indicators.
 * Polls every 120s (slow-changing aggregated data).
 *
 * @module use-threat-picture
 * @see WS-4.1
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'
import type { SeverityLevel, OperationalPriority, TrendDirection } from '@/lib/interfaces/coverage'

// ============================================================================
// API types (snake_case, local)
// ============================================================================

interface ApiThreatPictureResponse {
  // The API uses varying field names — accept both shapes
  total_active_alerts?: number
  total_active?: number
  as_of?: string
  time_window_hours?: number
  by_category: Array<{
    category: string
    count: number
    trend?: string
    top_severity?: string
  }> | Record<string, number>
  by_severity: Array<{
    severity: string
    count: number
    percentage: number
  }> | Record<string, number>
  by_priority: Array<{
    priority: string
    count: number
    percentage: number
  }> | Record<string, number>
  by_region?: Array<{
    region: string
    alert_count: number
    top_category: string
    trend: string
  }>
  top_regions?: Array<{
    region: string
    count: number
    top_priority: string
  }>
  overall_trend?: string
  trend?: {
    direction: string
    delta: number
    pct_change: number
    current_count: number
    previous_count: number
  }
  generated_at?: string
  period_start?: string
  period_end?: string
}

// ============================================================================
// Exported types
// ============================================================================

/** Per-category aggregation of active threat counts with trend direction. */
export interface ThreatCategoryCount {
  category: string
  count: number
  trend: TrendDirection
}

/** Per-severity breakdown with absolute count and percentage. */
export interface SeverityDistribution {
  severity: SeverityLevel
  count: number
  percentage: number
}

/** Per-priority breakdown with absolute count and percentage. */
export interface PriorityBreakdown {
  priority: OperationalPriority
  count: number
  percentage: number
}

/** Per-region aggregation with top category and trend. */
export interface RegionBreakdown {
  region: string
  alertCount: number
  topCategory: string
  trend: TrendDirection
}

/** Trend delta information from the API. */
export interface ThreatTrend {
  direction: TrendDirection
  delta: number
  pctChange: number
}

/** Normalized composite threat picture returned by the hook. */
export interface ThreatPicture {
  totalActiveAlerts: number
  byCategory: ThreatCategoryCount[]
  bySeverity: SeverityDistribution[]
  byPriority: PriorityBreakdown[]
  byRegion: RegionBreakdown[]
  overallTrend: TrendDirection
  trendDetail: ThreatTrend | null
  generatedAt: string
  periodStart: string
  periodEnd: string
}

// ============================================================================
// Empty fallback
// ============================================================================

/** Returns a zero-valued ThreatPicture for loading/error fallback. */
export function emptyThreatPicture(): ThreatPicture {
  return {
    totalActiveAlerts: 0,
    byCategory: [],
    bySeverity: [],
    byPriority: [],
    byRegion: [],
    overallTrend: 'stable',
    trendDetail: null,
    generatedAt: '',
    periodStart: '',
    periodEnd: '',
  }
}

// ============================================================================
// Query function
// ============================================================================

/** Normalize trend string from API to TrendDirection. */
function normalizeTrend(raw: string | undefined): TrendDirection {
  if (raw === 'increasing' || raw === 'up') return 'up'
  if (raw === 'decreasing' || raw === 'down') return 'down'
  return 'stable'
}

async function fetchThreatPicture(): Promise<ThreatPicture> {
  const data = await tarvariGet<ApiThreatPictureResponse>('/console/threat-picture')

  // by_category: may be array of objects
  const byCategory: ThreatCategoryCount[] = Array.isArray(data.by_category)
    ? data.by_category.map((c) => ({
        category: c.category,
        count: c.count,
        trend: normalizeTrend(c.trend),
      }))
    : []

  // by_severity: may be Record<string, number> or array
  let bySeverity: SeverityDistribution[]
  if (Array.isArray(data.by_severity)) {
    bySeverity = data.by_severity.map((s) => ({
      severity: s.severity as SeverityLevel,
      count: s.count,
      percentage: s.percentage,
    }))
  } else if (data.by_severity && typeof data.by_severity === 'object') {
    const total = Object.values(data.by_severity).reduce((a, b) => a + b, 0) || 1
    bySeverity = Object.entries(data.by_severity)
      .filter(([, count]) => count > 0)
      .map(([sev, count]) => ({
        severity: (sev.charAt(0).toUpperCase() + sev.slice(1)) as SeverityLevel,
        count,
        percentage: Math.round((count / total) * 100),
      }))
  } else {
    bySeverity = []
  }

  // by_priority: may be Record<string, number> or array
  let byPriority: PriorityBreakdown[]
  if (Array.isArray(data.by_priority)) {
    byPriority = data.by_priority.map((p) => ({
      priority: p.priority as OperationalPriority,
      count: p.count,
      percentage: p.percentage,
    }))
  } else if (data.by_priority && typeof data.by_priority === 'object') {
    const total = Object.values(data.by_priority).reduce((a, b) => a + b, 0) || 1
    byPriority = Object.entries(data.by_priority).map(([pri, count]) => ({
      priority: pri.toUpperCase() as OperationalPriority,
      count,
      percentage: Math.round((count / total) * 100),
    }))
  } else {
    byPriority = []
  }

  // by_region / top_regions
  let byRegion: RegionBreakdown[]
  if (Array.isArray(data.by_region)) {
    byRegion = data.by_region.map((r) => ({
      region: r.region,
      alertCount: r.alert_count,
      topCategory: r.top_category,
      trend: normalizeTrend(r.trend),
    }))
  } else if (Array.isArray(data.top_regions)) {
    byRegion = data.top_regions.map((r) => ({
      region: r.region,
      alertCount: r.count,
      topCategory: r.top_priority,
      trend: 'stable' as TrendDirection,
    }))
  } else {
    byRegion = []
  }

  // trend: may be object or string
  const overallTrend = data.trend
    ? normalizeTrend(data.trend.direction)
    : normalizeTrend(data.overall_trend)

  const trendDetail: ThreatTrend | null = data.trend
    ? {
        direction: normalizeTrend(data.trend.direction),
        delta: data.trend.delta,
        pctChange: data.trend.pct_change,
      }
    : null

  const now = new Date().toISOString()

  return {
    totalActiveAlerts: data.total_active ?? data.total_active_alerts ?? 0,
    byCategory,
    bySeverity,
    byPriority,
    byRegion,
    overallTrend,
    trendDetail,
    generatedAt: data.generated_at ?? data.as_of ?? now,
    periodStart: data.period_start ?? now,
    periodEnd: data.period_end ?? data.as_of ?? now,
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetch the aggregated threat picture from `/console/threat-picture`.
 * Polls every 120s. staleTime 90s.
 *
 * @see WS-4.1
 */
export function useThreatPicture(): UseQueryResult<ThreatPicture> {
  return useQuery<ThreatPicture>({
    queryKey: ['threat-picture'],
    queryFn: fetchThreatPicture,
    staleTime: 90_000,
    refetchInterval: 120_000,
  })
}
