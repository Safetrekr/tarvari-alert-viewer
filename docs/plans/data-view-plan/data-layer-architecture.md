# Data Layer Architecture: View Mode Toggle

> TarvaRI Alert Viewer -- data layer design for Triaged / All Bundles / Raw Alerts view modes.
>
> **Date:** 2026-03-04
> **Status:** Plan
> **Depends on:** Existing hooks (`useCoverageMetrics`, `useCoverageMapData`, `useIntelFeed`), `coverage.store.ts`, `coverage-utils.ts`

---

## Table of Contents

1. [TypeScript Type Definitions](#1-typescript-type-definitions)
2. [Query Design](#2-query-design)
3. [Hook Design](#3-hook-design)
4. [State Management](#4-state-management)
5. [Data Transformation Layer](#5-data-transformation-layer)
6. [Performance Considerations](#6-performance-considerations)
7. [Error Handling & Edge Cases](#7-error-handling--edge-cases)
8. [Implementation Order](#8-implementation-order)

---

## 1. TypeScript Type Definitions

### 1.1 New Row Types for `src/lib/supabase/types.ts`

These types match the actual database columns verified against `information_schema`. The existing file uses string types for enum-like fields (rather than union types) to tolerate unexpected values -- this plan follows that convention.

```typescript
// ============================================================================
// intel_bundles
// ============================================================================

/**
 * Row type for intel_bundles table (SELECT result).
 *
 * Represents a clustered group of related intel items that have been
 * scored and optionally triaged. The `member_intel_ids` array references
 * rows in `intel_normalized`. The `primary_intel_id` is the FK to the
 * most representative member.
 *
 * Note: `categories` and `member_intel_ids` are Postgres arrays, which
 * Supabase returns as JavaScript arrays.
 */
export interface IntelBundleRow {
  id: string                          // uuid, PK
  title: string | null                // text, nullable -- display title
  summary: string | null              // text, nullable -- LLM-generated summary
  status: string                      // text, 'pending' | 'approved' | 'rejected' (default 'pending')
  final_severity: string              // text, 'Extreme' | 'Severe' | 'Moderate' | 'Minor'
  categories: string[] | null         // text[], nullable -- e.g. ['weather', 'storm']
  confidence_aggregate: number        // integer, 0-100
  risk_score: string | null           // numeric (Supabase returns numeric as string), nullable
  source_count: number                // integer
  intel_count: number | null          // integer, nullable (default 0)
  member_intel_ids: string[]          // uuid[], NOT NULL -- references intel_normalized.id
  primary_intel_id: string            // uuid, NOT NULL, FK to intel_normalized.id
  dedup_hash: string                  // text, NOT NULL
  representative_coordinates: {       // jsonb, nullable
    lat: number | null
    lon: number | null
  } | null
  geographic_scope: {                 // jsonb, nullable
    type: string                      // 'point' | 'polygon' | 'region'
    radius_km?: number
    coordinates?: { lat: number | null; lon: number | null }
  } | null
  temporal_scope: {                   // jsonb, nullable
    start: string                     // ISO 8601
    end: string                       // ISO 8601
  } | null
  risk_details: Record<string, unknown> | null  // jsonb, nullable
  source_breakdown: Record<string, unknown> | null  // jsonb, nullable
  analyst_notes: string | null        // text, nullable
  routed_at: string | null            // timestamptz, nullable
  routed_alert_count: number | null   // integer, nullable (default 0)
  created_at: string                  // timestamptz
  updated_at: string                  // timestamptz
}

// ============================================================================
// triage_decisions
// ============================================================================

/**
 * Row type for triage_decisions table (SELECT result).
 *
 * Represents an LLM or analyst verdict on an intel bundle.
 * One bundle can have multiple decisions (versioned), but typically
 * only the latest version matters. The `note` field contains the
 * full LLM rationale or analyst comment.
 */
export interface TriageDecisionRow {
  id: string                           // uuid, PK
  bundle_id: string                    // uuid, FK to intel_bundles.id
  version: number                      // integer, default 1
  decision: string                     // text, 'approve' | 'reject'
  bucket: string | null                // text, nullable -- triage bucket/category
  delivery_bucket: string | null       // text, nullable -- delivery schedule bucket
  reviewer_id: string                  // uuid, FK to users.id (00000000... for auto-triage)
  note: string | null                  // text, nullable -- full LLM rationale
  decided_at: string                   // timestamptz
  edited_title: string | null          // text, nullable -- analyst override
  edited_summary: string | null        // text, nullable -- analyst override
  edited_severity: string | null       // text, nullable -- analyst override
  edited_geo: Record<string, unknown> | null  // jsonb, nullable -- analyst geo override
  suggested_trip_ids: string[] | null  // uuid[], nullable
  selected_trip_ids: string[] | null   // uuid[], nullable
  selected_trips: string[] | null      // text[], nullable (default '{}')
  excluded_trips: string[] | null      // text[], nullable (default '{}')
  impacted_orgs: string[] | null       // text[], nullable (default '{}')
  diff: Record<string, unknown> | null // jsonb, nullable -- change diff
}

// ============================================================================
// trip_alerts (future use -- included for completeness)
// ============================================================================

/**
 * Row type for trip_alerts table (SELECT result).
 *
 * Represents an alert matched to a specific trip, routed from an
 * approved bundle. Currently 0 rows in production.
 */
export interface TripAlertRow {
  id: string                           // uuid, PK
  bundle_id: string | null             // uuid, nullable, FK to intel_bundles.id
  trip_id: string                      // text, NOT NULL
  org_id: string                       // text, NOT NULL
  delivery_bucket: string | null       // text, nullable (default 'am')
  routed_by: string | null             // text, nullable
  routed_at: string | null             // timestamptz, nullable
  requires_acknowledgment: boolean | null  // boolean, nullable (default false)
  priority: string | null              // text, nullable (default 'medium')
  status: string | null                // text, nullable (default 'active')
  relevance_score: string | null       // numeric (returned as string), nullable
  severity: string | null              // text, nullable (default 'medium')
  category: string | null              // text, nullable
  full_summary: string | null          // text, nullable
  scoring_details: Record<string, unknown> | null  // jsonb, nullable
  copy_variants: Record<string, unknown> | null    // jsonb, nullable
  created_at: string | null            // timestamptz
  updated_at: string | null            // timestamptz
}
```

### 1.2 Database Interface Additions

Add the three new tables to the `Database` interface in `src/lib/supabase/types.ts`:

```typescript
export interface Database {
  public: {
    Tables: {
      // ... existing tables (launch_receipts, launch_snapshots, intel_sources, intel_normalized) ...

      intel_bundles: {
        Row: IntelBundleRow
        Insert: Omit<IntelBundleRow, never>
        Update: Partial<IntelBundleRow>
      }
      triage_decisions: {
        Row: TriageDecisionRow
        Insert: Omit<TriageDecisionRow, never>
        Update: Partial<TriageDecisionRow>
      }
      trip_alerts: {
        Row: TripAlertRow
        Insert: Omit<TripAlertRow, never>
        Update: Partial<TripAlertRow>
      }
    }
    // ... Views, Functions, Enums unchanged ...
  }
}
```

### 1.3 Derived / Composite Types

These go in a new file `src/lib/interfaces/intel-bundles.ts`:

```typescript
/**
 * Derived types for intel bundle display.
 *
 * Composites that join bundle rows with their triage decisions and
 * resolved member intel items. Used by hooks and UI components.
 *
 * @module intel-bundles
 */

import type { IntelBundleRow, TriageDecisionRow, IntelNormalizedRow } from '@/lib/supabase/types'

// ============================================================================
// View mode
// ============================================================================

/**
 * The three data view modes for the spatial dashboard.
 *
 * - 'triaged': Only approved bundles (post-triage). The analyst's curated view.
 * - 'all-bundles': All bundles regardless of status. Full pipeline visibility.
 * - 'raw': Individual intel_normalized items. Unprocessed feed view.
 */
export type ViewMode = 'triaged' | 'all-bundles' | 'raw'

/** Human-readable labels for each view mode. */
export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  'triaged': 'Triaged',
  'all-bundles': 'All Bundles',
  'raw': 'Raw Alerts',
} as const

/** Default view mode on initial load. */
export const DEFAULT_VIEW_MODE: ViewMode = 'triaged'

// ============================================================================
// Composite types
// ============================================================================

/**
 * A bundle with its latest triage decision attached.
 *
 * This is the primary display type for both "Triaged" and "All Bundles"
 * modes. The `decision` field is null only if the bundle has never been
 * triaged (status='pending'), which is a valid state in "All Bundles" mode.
 */
export interface BundleWithDecision {
  /** The full bundle row. */
  bundle: IntelBundleRow
  /** The latest triage decision, or null if the bundle is still pending. */
  decision: TriageDecisionRow | null
}

/**
 * A bundle with its triage decision AND all member intel items resolved.
 *
 * Used for the bundle detail / drill-down view. The `members` array
 * contains the full intel_normalized rows referenced by
 * `bundle.member_intel_ids`. Members that no longer exist in the database
 * (stale references) are silently excluded.
 */
export interface BundleWithMembers extends BundleWithDecision {
  /** Resolved member intel items from intel_normalized. */
  members: IntelNormalizedRow[]
  /** The primary intel item (resolved from bundle.primary_intel_id). Null if deleted. */
  primaryIntel: IntelNormalizedRow | null
}

// ============================================================================
// Bundle status helpers
// ============================================================================

/** Possible bundle statuses from the database. */
export type BundleStatus = 'pending' | 'approved' | 'rejected'

/** Possible triage decision values from the database. */
export type TriageDecision = 'approve' | 'reject'

/** Whether a reviewer_id represents auto-triage (all-zeros UUID). */
export const AUTO_TRIAGE_REVIEWER_ID = '00000000-0000-0000-0000-000000000000'

/** Check if a triage decision was made by the auto-triage system. */
export function isAutoTriaged(decision: TriageDecisionRow): boolean {
  return decision.reviewer_id === AUTO_TRIAGE_REVIEWER_ID
}

/**
 * Get the effective display title for a bundle.
 * Prefers analyst-edited title from the triage decision,
 * then falls back to the bundle's own title, then a generated fallback.
 */
export function getBundleDisplayTitle(
  bundle: IntelBundleRow,
  decision: TriageDecisionRow | null,
): string {
  if (decision?.edited_title) return decision.edited_title
  if (bundle.title) return bundle.title
  const categories = bundle.categories?.join(', ') ?? 'Unknown'
  return `${bundle.final_severity} ${categories} Bundle`
}

/**
 * Get the effective display summary for a bundle.
 * Prefers analyst-edited summary from the triage decision,
 * then falls back to the bundle's own summary.
 */
export function getBundleDisplaySummary(
  bundle: IntelBundleRow,
  decision: TriageDecisionRow | null,
): string | null {
  if (decision?.edited_summary) return decision.edited_summary
  return bundle.summary
}

/**
 * Get the effective severity for display.
 * Prefers analyst-edited severity from triage, falls back to bundle.
 */
export function getBundleDisplaySeverity(
  bundle: IntelBundleRow,
  decision: TriageDecisionRow | null,
): string {
  if (decision?.edited_severity) return decision.edited_severity
  return bundle.final_severity
}
```

---

## 2. Query Design

### 2.1 Database Relationships (verified from FK constraints)

```
intel_bundles.primary_intel_id  -->  intel_normalized.id
triage_decisions.bundle_id     -->  intel_bundles.id
triage_decisions.reviewer_id   -->  users.id
trip_alerts.bundle_id          -->  intel_bundles.id
```

Supabase PostgREST uses these FK relationships for embedded selects (the `select('*, triage_decisions(*)')` syntax).

### 2.2 Triaged Mode Query

Fetches approved bundles with their triage decisions embedded. This is the default view showing only curated, analyst-approved intelligence.

```typescript
async function fetchTriagedBundles(): Promise<BundleWithDecision[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
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
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  if (!data) return []

  return normalizeBundleResponse(data)
}
```

### 2.3 All Bundles Mode Query

Same as triaged but without the `status` filter. Shows pending, approved, and rejected bundles for full pipeline visibility.

```typescript
async function fetchAllBundles(): Promise<BundleWithDecision[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
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
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  if (!data) return []

  return normalizeBundleResponse(data)
}
```

### 2.4 Raw Alerts Mode

This is the existing `intel_normalized` query from `useCoverageMapData` and `useIntelFeed`. No new query needed. The view mode toggle simply switches which hook's data drives the UI.

### 2.5 Bundle Detail Query (Drill-Down)

Two-step query: fetch the bundle with its decision, then resolve member intel items using the `member_intel_ids` array. This is a dependent query pattern.

```typescript
async function fetchBundleDetail(bundleId: string): Promise<BundleWithMembers | null> {
  const supabase = getSupabaseBrowserClient()

  // Step 1: Fetch bundle with triage decisions
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

  // Step 2: Resolve member intel items via .in() on the member_intel_ids array
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

  // Strip the embedded triage_decisions from the bundle to match IntelBundleRow shape
  const { triage_decisions: _, ...bundleRow } = bundle

  return {
    bundle: bundleRow as IntelBundleRow,
    decision: latestDecision,
    members,
    primaryIntel,
  }
}
```

### 2.6 Response Normalization Helper

Supabase returns `triage_decisions` as a nested array on each bundle row. This helper normalizes the shape into our `BundleWithDecision` type, extracting the latest decision per bundle.

```typescript
/**
 * Normalize the raw Supabase response (bundles with embedded triage_decisions arrays)
 * into our BundleWithDecision[] shape.
 *
 * For each bundle, selects the triage decision with the highest `version` number.
 * Bundles with no decisions get `decision: null`.
 */
function normalizeBundleResponse(
  data: unknown[],
): BundleWithDecision[] {
  type RawRow = IntelBundleRow & { triage_decisions: TriageDecisionRow[] }

  const rows = data as RawRow[]

  return rows.map((row) => {
    const decisions = row.triage_decisions ?? []
    const latestDecision = decisions.length > 0
      ? decisions.reduce((latest, d) => d.version > latest.version ? d : latest)
      : null

    // Strip embedded triage_decisions to get a clean IntelBundleRow
    const { triage_decisions: _, ...bundleRow } = row

    return {
      bundle: bundleRow as IntelBundleRow,
      decision: latestDecision,
    }
  })
}
```

---

## 3. Hook Design

### 3.1 `useIntelBundles(viewMode)` -- Primary Bundle Hook

File: `src/hooks/use-intel-bundles.ts`

```typescript
'use client'

/**
 * TanStack Query hook for intel bundles with triage decisions.
 *
 * Fetches bundles from `intel_bundles` with embedded `triage_decisions`,
 * filtered by the current view mode. Returns BundleWithDecision[] for
 * both 'triaged' and 'all-bundles' modes. Returns null for 'raw' mode
 * (raw mode uses existing useIntelFeed / useCoverageMapData hooks).
 *
 * @module use-intel-bundles
 */

import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { IntelBundleRow, TriageDecisionRow } from '@/lib/supabase/types'
import type { BundleWithDecision, ViewMode } from '@/lib/interfaces/intel-bundles'

// ============================================================================
// Select string (shared between triaged and all-bundles queries)
// ============================================================================

const BUNDLE_SELECT = `
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
` as const

// ============================================================================
// Response normalization
// ============================================================================

type RawBundleRow = IntelBundleRow & { triage_decisions: TriageDecisionRow[] }

function normalizeBundleResponse(data: unknown[]): BundleWithDecision[] {
  const rows = data as RawBundleRow[]

  return rows.map((row) => {
    const decisions = row.triage_decisions ?? []
    const latestDecision =
      decisions.length > 0
        ? decisions.reduce((latest, d) => (d.version > latest.version ? d : latest))
        : null

    const { triage_decisions: _, ...bundleRow } = row

    return {
      bundle: bundleRow as IntelBundleRow,
      decision: latestDecision,
    }
  })
}

// ============================================================================
// Query functions
// ============================================================================

async function fetchTriagedBundles(): Promise<BundleWithDecision[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('intel_bundles')
    .select(BUNDLE_SELECT)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  if (!data) return []

  return normalizeBundleResponse(data)
}

async function fetchAllBundles(): Promise<BundleWithDecision[]> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('intel_bundles')
    .select(BUNDLE_SELECT)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  if (!data) return []

  return normalizeBundleResponse(data)
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Fetches intel bundles with triage decisions based on the current view mode.
 *
 * - 'triaged' mode: bundles WHERE status = 'approved'
 * - 'all-bundles' mode: all bundles regardless of status
 * - 'raw' mode: query is disabled (enabled: false) -- raw mode uses
 *   existing useIntelFeed() and useCoverageMapData() hooks instead.
 *
 * Query key conventions:
 * - ['intel', 'bundles', 'triaged']
 * - ['intel', 'bundles', 'all-bundles']
 *
 * staleTime: 30 seconds (bundles update when triage pipeline runs)
 * refetchInterval: 45 seconds (less frequent than raw feed since bundles
 * are batched and change less often)
 */
export function useIntelBundles(viewMode: ViewMode) {
  const isEnabled = viewMode !== 'raw'

  return useQuery<BundleWithDecision[]>({
    queryKey: ['intel', 'bundles', viewMode],
    queryFn: () => {
      if (viewMode === 'triaged') return fetchTriagedBundles()
      if (viewMode === 'all-bundles') return fetchAllBundles()
      // 'raw' mode should not reach here because enabled = false
      return Promise.resolve([])
    },
    enabled: isEnabled,
    staleTime: 30_000,
    refetchInterval: 45_000,
  })
}
```

### 3.2 `useBundleDetail(bundleId)` -- Single Bundle with Resolved Members

File: `src/hooks/use-bundle-detail.ts`

```typescript
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

  type RawRow = IntelBundleRow & { triage_decisions: TriageDecisionRow[] }
  const raw = bundleData as unknown as RawRow

  // Step 2: Resolve member intel items
  const memberIds = raw.member_intel_ids ?? []
  let members: IntelNormalizedRow[] = []

  if (memberIds.length > 0) {
    const { data: memberData, error: memberError } = await supabase
      .from('intel_normalized')
      .select('id, title, severity, category, source_id, geo, ingested_at')
      .in('id', memberIds)

    if (memberError) throw memberError
    members = (memberData as unknown as IntelNormalizedRow[]) ?? []
  }

  // Extract latest triage decision
  const decisions = raw.triage_decisions ?? []
  const latestDecision =
    decisions.length > 0
      ? decisions.reduce((latest, d) => (d.version > latest.version ? d : latest))
      : null

  // Resolve primary intel
  const primaryIntel = members.find((m) => m.id === raw.primary_intel_id) ?? null

  // Strip embedded decisions from the bundle row
  const { triage_decisions: _, ...bundleRow } = raw

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
 * Fetches a single bundle with its resolved member intel items.
 *
 * Dependent query: only executes when `bundleId` is non-null.
 * Used for bundle drill-down / detail panel views.
 *
 * - queryKey: `['intel', 'bundle-detail', bundleId]`
 * - staleTime: 60 seconds (detail view is opened intentionally, data
 *   does not need aggressive polling)
 * - refetchInterval: disabled (manual refetch only while viewing detail)
 *
 * @param bundleId - UUID of the bundle to fetch, or null to disable the query.
 */
export function useBundleDetail(bundleId: string | null) {
  return useQuery<BundleWithMembers | null>({
    queryKey: ['intel', 'bundle-detail', bundleId],
    queryFn: () => {
      if (!bundleId) return Promise.resolve(null)
      return fetchBundleDetail(bundleId)
    },
    enabled: bundleId !== null,
    staleTime: 60_000,
    // No refetchInterval -- detail view is read-once until manually refreshed
  })
}
```

### 3.3 Hook Interaction Summary

```
View Mode Toggle
     |
     +--> viewMode === 'raw'
     |        |
     |        +--> useIntelFeed()           (existing, unchanged)
     |        +--> useCoverageMapData()     (existing, unchanged)
     |        +--> useCoverageMetrics()     (existing, unchanged)
     |
     +--> viewMode === 'triaged' | 'all-bundles'
              |
              +--> useIntelBundles(viewMode)   (NEW)
              |        Returns BundleWithDecision[]
              |
              +--> useCoverageMetrics()        (existing, unchanged -- always active)
              |
              +--> useBundleDetail(selectedBundleId)  (NEW, dependent)
                       Returns BundleWithMembers | null
```

**Key design decisions:**

1. `useCoverageMetrics()` is always active regardless of view mode. Source health is mode-independent.

2. `useIntelFeed()` and `useCoverageMapData()` continue to run in 'raw' mode only. In bundle modes, the bundle data provides equivalent feed and map data via transformations (see Section 5).

3. `useIntelBundles()` is disabled (`enabled: false`) in 'raw' mode to avoid unnecessary network requests.

4. `useBundleDetail()` is a dependent query that only fires when a specific bundle is selected for drill-down. It has no polling interval since the detail view is ephemeral.

### 3.4 queryKey Convention

All keys use a hierarchical namespace for predictable invalidation:

| Hook | queryKey | Invalidation scope |
|------|----------|-------------------|
| `useCoverageMetrics` | `['coverage', 'metrics']` | `queryClient.invalidateQueries({ queryKey: ['coverage'] })` |
| `useCoverageMapData` | `['coverage', 'map-data', filters]` | `queryClient.invalidateQueries({ queryKey: ['coverage'] })` |
| `useIntelFeed` | `['intel', 'feed']` | `queryClient.invalidateQueries({ queryKey: ['intel'] })` |
| `useIntelBundles` | `['intel', 'bundles', viewMode]` | `queryClient.invalidateQueries({ queryKey: ['intel', 'bundles'] })` |
| `useBundleDetail` | `['intel', 'bundle-detail', bundleId]` | `queryClient.invalidateQueries({ queryKey: ['intel', 'bundle-detail'] })` |

**Invalidation groups:**
- `['coverage']` -- invalidates all source/metrics data
- `['intel']` -- invalidates all intel data (feed, bundles, details)
- `['intel', 'bundles']` -- invalidates only bundle list data (both modes)

### 3.5 Timing Configuration

| Hook | staleTime | refetchInterval | Rationale |
|------|-----------|-----------------|-----------|
| `useCoverageMetrics` | 45s | 60s | Sources change infrequently |
| `useCoverageMapData` | 30s | 30s | Intel ingested continuously |
| `useIntelFeed` | 20s | 30s | Feed should feel near-real-time |
| `useIntelBundles` | 30s | 45s | Bundles batch-processed, less volatile than raw |
| `useBundleDetail` | 60s | none | Intentional read, no polling needed |

---

## 4. State Management

### 4.1 Extending `coverage.store.ts`

`viewMode` belongs in `coverage.store.ts` alongside `selectedCategories` because both are data-filtering concerns that affect which queries run and how results are displayed. They share the same lifecycle (session-transient, URL-synced).

**Updated store:**

```typescript
/**
 * Coverage filter store -- manages category selection and view mode
 * for the Coverage Grid Launch Page.
 *
 * @module coverage.store
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ViewMode } from '@/lib/interfaces/intel-bundles'
import { DEFAULT_VIEW_MODE } from '@/lib/interfaces/intel-bundles'

// ============================================================================
// State
// ============================================================================

interface CoverageState {
  /** Currently selected category IDs for map filtering. Empty = show all. */
  selectedCategories: string[]
  /** Current data view mode. */
  viewMode: ViewMode
  /** Currently selected bundle ID for detail view. Null = no detail open. */
  selectedBundleId: string | null
}

// ============================================================================
// Actions
// ============================================================================

interface CoverageActions {
  /** Toggle a category in the filter set. */
  toggleCategory: (id: string) => void
  /** Clear all category filters (show all). */
  clearSelection: () => void
  /** Set the data view mode. */
  setViewMode: (mode: ViewMode) => void
  /** Select a bundle for detail view. */
  selectBundle: (bundleId: string | null) => void
}

export type CoverageStore = CoverageState & CoverageActions

// ============================================================================
// Store
// ============================================================================

export const useCoverageStore = create<CoverageStore>()(
  immer((set) => ({
    selectedCategories: [],
    viewMode: DEFAULT_VIEW_MODE,
    selectedBundleId: null,

    toggleCategory: (id) =>
      set((state) => {
        const idx = state.selectedCategories.indexOf(id)
        if (idx >= 0) {
          state.selectedCategories.splice(idx, 1)
        } else {
          state.selectedCategories.push(id)
        }
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedCategories = []
      }),

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode
        // Clear bundle selection when switching modes
        state.selectedBundleId = null
      }),

    selectBundle: (bundleId) =>
      set((state) => {
        state.selectedBundleId = bundleId
      }),
  })),
)

// ============================================================================
// Selectors
// ============================================================================

export const coverageSelectors = {
  /** Whether any category filter is active. */
  hasSelection: (state: CoverageStore): boolean => state.selectedCategories.length > 0,

  /** The selected category IDs. */
  selectedCategories: (state: CoverageStore): string[] => state.selectedCategories,

  /** The current view mode. */
  viewMode: (state: CoverageStore): ViewMode => state.viewMode,

  /** The selected bundle ID for detail view. */
  selectedBundleId: (state: CoverageStore): string | null => state.selectedBundleId,

  /** Whether a bundle detail view is open. */
  isBundleDetailOpen: (state: CoverageStore): boolean => state.selectedBundleId !== null,
} as const
```

### 4.2 URL Synchronization

Extend the existing URL sync pattern (already used for `?category=`) to include view mode. URL becomes the persistence mechanism for deep-linking.

Add these functions to `coverage.store.ts`:

```typescript
// ============================================================================
// URL Synchronization (extended)
// ============================================================================

/**
 * Initialize store from URL query parameters.
 * Call once on page mount.
 *
 * Reads:
 * - `?category={id}` (multi-value) -- category filter
 * - `?view={mode}` -- view mode ('triaged' | 'all-bundles' | 'raw')
 * - `?bundle={id}` -- selected bundle for detail view
 */
export function syncCoverageFromUrl(): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const store = useCoverageStore.getState()

  // Sync categories (existing logic)
  const categories = params.getAll('category')
  for (const cat of categories) {
    store.toggleCategory(cat)
  }

  // Sync view mode
  const viewParam = params.get('view')
  if (viewParam === 'triaged' || viewParam === 'all-bundles' || viewParam === 'raw') {
    store.setViewMode(viewParam)
  }

  // Sync bundle detail
  const bundleParam = params.get('bundle')
  if (bundleParam) {
    store.selectBundle(bundleParam)
  }
}

/**
 * Push current state to URL query parameters.
 * Uses replaceState to avoid creating browser history entries.
 */
export function syncCoverageToUrl(state: CoverageStore): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)

  // Categories
  url.searchParams.delete('category')
  for (const cat of state.selectedCategories) {
    url.searchParams.append('category', cat)
  }

  // View mode (omit if default to keep URL clean)
  url.searchParams.delete('view')
  if (state.viewMode !== DEFAULT_VIEW_MODE) {
    url.searchParams.set('view', state.viewMode)
  }

  // Bundle detail
  url.searchParams.delete('bundle')
  if (state.selectedBundleId) {
    url.searchParams.set('bundle', state.selectedBundleId)
  }

  window.history.replaceState({}, '', url.toString())
}
```

### 4.3 How viewMode Affects Active Hooks

The page component uses `viewMode` from the store to decide which hooks are active:

```typescript
// In page.tsx or the main spatial layout component

const viewMode = useCoverageStore((s) => s.viewMode)
const selectedBundleId = useCoverageStore((s) => s.selectedBundleId)
const selectedCategories = useCoverageStore((s) => s.selectedCategories)

// Always active -- source health is mode-independent
const { data: metrics } = useCoverageMetrics()

// Active only in 'raw' mode
const { data: feedItems } = useIntelFeed()
const { data: mapMarkers } = useCoverageMapData(
  selectedCategories.length > 0
    ? { categories: selectedCategories }
    : undefined,
)

// Active only in bundle modes
const { data: bundles } = useIntelBundles(viewMode)

// Active only when a bundle is selected for detail
const { data: bundleDetail } = useBundleDetail(selectedBundleId)
```

**Note:** `useIntelFeed()` and `useCoverageMapData()` will still run even in bundle modes (TanStack Query caches them). If the performance cost of the extra queries is a concern, we can add `enabled: viewMode === 'raw'` to those hooks. However, with 44 rows and 2 bundles, the cost is negligible and keeping them warm allows instant mode switching.

### 4.4 Selector Patterns for Derived Data

Create selectors that transform bundle data into the same shapes consumed by existing components:

```typescript
// In the page or a container component:

/**
 * Derive map markers from the current view mode's data.
 * Raw mode: use useCoverageMapData markers directly.
 * Bundle modes: transform bundles into markers.
 */
const currentMarkers = useMemo(() => {
  if (viewMode === 'raw') return mapMarkers ?? []
  if (!bundles) return []
  return bundlesToMarkers(bundles)
}, [viewMode, mapMarkers, bundles])

/**
 * Derive feed items from the current view mode's data.
 * Raw mode: use useIntelFeed items directly.
 * Bundle modes: transform bundles into feed items.
 */
const currentFeedItems = useMemo(() => {
  if (viewMode === 'raw') return feedItems ?? []
  if (!bundles) return []
  return bundlesToFeedItems(bundles)
}, [viewMode, feedItems, bundles])
```

---

## 5. Data Transformation Layer

### 5.1 New File: `src/lib/bundle-transforms.ts`

Pure utility functions for transforming bundle data into display-ready structures. Follows the same pattern as `coverage-utils.ts` -- stateless, side-effect-free, independently testable.

```typescript
/**
 * Pure utility functions for transforming intel bundles into
 * display-ready structures for map markers, feed items, and
 * category metrics.
 *
 * All functions are stateless and side-effect-free.
 *
 * @module bundle-transforms
 */

import type { MapMarker, CoverageByCategory } from '@/lib/coverage-utils'
import type { IntelFeedItem } from '@/hooks/use-intel-feed'
import type { BundleWithDecision } from '@/lib/interfaces/intel-bundles'
import {
  getBundleDisplayTitle,
  getBundleDisplaySeverity,
  getBundleDisplaySummary,
} from '@/lib/interfaces/intel-bundles'

// ============================================================================
// Bundle --> Map Markers
// ============================================================================

/**
 * Transform bundles into map markers using representative coordinates.
 *
 * Uses the bundle's `representative_coordinates` field for positioning.
 * Bundles with null coordinates or null lat/lon are excluded.
 *
 * The marker's severity and category are derived from the bundle's
 * effective values (respecting analyst edits from triage decisions).
 */
export function bundlesToMarkers(bundles: BundleWithDecision[]): MapMarker[] {
  return bundles
    .filter((b) => {
      const coords = b.bundle.representative_coordinates
      return coords !== null && coords.lat !== null && coords.lon !== null
    })
    .map((b) => {
      const coords = b.bundle.representative_coordinates!
      return {
        id: b.bundle.id,
        lat: coords.lat!,
        lng: coords.lon!,
        title: getBundleDisplayTitle(b.bundle, b.decision),
        severity: getBundleDisplaySeverity(b.bundle, b.decision),
        category: b.bundle.categories?.[0] ?? 'other',
        sourceId: b.bundle.primary_intel_id,
        ingestedAt: b.bundle.created_at,
      }
    })
}

// ============================================================================
// Bundle --> Feed Items
// ============================================================================

/**
 * Transform bundles into feed panel items.
 *
 * Maps each bundle to an IntelFeedItem shape compatible with the
 * existing FeedPanel and ActivityTicker components. Uses the bundle's
 * effective title and severity (respecting analyst edits).
 */
export function bundlesToFeedItems(bundles: BundleWithDecision[]): IntelFeedItem[] {
  return bundles.map((b) => ({
    id: b.bundle.id,
    title: getBundleDisplayTitle(b.bundle, b.decision),
    severity: getBundleDisplaySeverity(b.bundle, b.decision),
    category: b.bundle.categories?.[0] ?? 'other',
    sourceId: b.bundle.primary_intel_id,
    ingestedAt: b.bundle.created_at,
  }))
}

// ============================================================================
// Bundle --> Category Metrics
// ============================================================================

/**
 * Compute category-based metrics from bundles for the CoverageGrid cards.
 *
 * Groups bundles by their primary category (first element of `categories[]`).
 * Returns CoverageByCategory[] sorted by bundle count descending.
 *
 * This mirrors buildCategoryMetrics() from coverage-utils.ts but operates
 * on bundles instead of sources.
 */
export function bundlesToCategoryMetrics(bundles: BundleWithDecision[]): BundleCategoryMetrics[] {
  const categoryMap = new Map<string, BundleCategoryMetrics>()

  for (const b of bundles) {
    const cats = b.bundle.categories ?? ['other']
    for (const cat of cats) {
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          category: cat,
          bundleCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          pendingCount: 0,
          totalIntelCount: 0,
          maxSeverity: 'Minor',
        })
      }

      const entry = categoryMap.get(cat)!
      entry.bundleCount++
      entry.totalIntelCount += b.bundle.intel_count ?? 0

      if (b.bundle.status === 'approved') entry.approvedCount++
      else if (b.bundle.status === 'rejected') entry.rejectedCount++
      else entry.pendingCount++

      // Track highest severity seen
      entry.maxSeverity = higherSeverity(entry.maxSeverity, b.bundle.final_severity)
    }
  }

  return Array.from(categoryMap.values()).sort((a, b) => b.bundleCount - a.bundleCount)
}

/** Per-category metrics derived from bundles. */
export interface BundleCategoryMetrics {
  category: string
  bundleCount: number
  approvedCount: number
  rejectedCount: number
  pendingCount: number
  totalIntelCount: number
  maxSeverity: string
}

// ============================================================================
// Severity aggregation
// ============================================================================

/** Severity ordering for comparison (higher index = more severe). */
const SEVERITY_ORDER: Record<string, number> = {
  'Unknown': 0,
  'Minor': 1,
  'Moderate': 2,
  'Severe': 3,
  'Extreme': 4,
}

/**
 * Return the higher of two severity levels.
 * Unknown values are treated as the lowest severity.
 */
export function higherSeverity(a: string, b: string): string {
  const aOrder = SEVERITY_ORDER[a] ?? 0
  const bOrder = SEVERITY_ORDER[b] ?? 0
  return aOrder >= bOrder ? a : b
}

/**
 * Compute the aggregate severity for a set of bundles.
 * Returns the highest severity found across all bundles.
 */
export function aggregateSeverity(bundles: BundleWithDecision[]): string {
  return bundles.reduce(
    (max, b) => higherSeverity(max, getBundleDisplaySeverity(b.bundle, b.decision)),
    'Unknown',
  )
}

// ============================================================================
// Confidence aggregation
// ============================================================================

/**
 * Compute mean confidence across a set of bundles.
 * Returns 0 if the input is empty.
 */
export function meanConfidence(bundles: BundleWithDecision[]): number {
  if (bundles.length === 0) return 0
  const sum = bundles.reduce((acc, b) => acc + b.bundle.confidence_aggregate, 0)
  return Math.round(sum / bundles.length)
}

/**
 * Compute mean risk score across bundles.
 * risk_score is stored as numeric (string). Returns 0 for empty input.
 */
export function meanRiskScore(bundles: BundleWithDecision[]): number {
  const scored = bundles.filter((b) => b.bundle.risk_score !== null)
  if (scored.length === 0) return 0
  const sum = scored.reduce((acc, b) => acc + Number(b.bundle.risk_score), 0)
  return Math.round(sum / scored.length)
}

// ============================================================================
// Status counts
// ============================================================================

/** Count bundles by status. */
export interface BundleStatusCounts {
  approved: number
  rejected: number
  pending: number
  total: number
}

export function countByStatus(bundles: BundleWithDecision[]): BundleStatusCounts {
  const counts: BundleStatusCounts = { approved: 0, rejected: 0, pending: 0, total: bundles.length }
  for (const b of bundles) {
    if (b.bundle.status === 'approved') counts.approved++
    else if (b.bundle.status === 'rejected') counts.rejected++
    else counts.pending++
  }
  return counts
}

// ============================================================================
// Severity counts (for severity breakdown panels)
// ============================================================================

/** Count bundles by severity level. */
export function countBySeverity(
  bundles: BundleWithDecision[],
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const b of bundles) {
    const sev = getBundleDisplaySeverity(b.bundle, b.decision)
    counts[sev] = (counts[sev] ?? 0) + 1
  }
  return counts
}
```

---

## 6. Performance Considerations

### 6.1 Query Sizes

Current data volumes are extremely small:

| Table | Row count | Payload size (est.) |
|-------|-----------|-------------------|
| `intel_sources` | 5 | ~2 KB |
| `intel_normalized` | 44 | ~15 KB |
| `intel_bundles` | 2 | ~4 KB (including member_intel_ids arrays) |
| `triage_decisions` | 2 | ~2 KB |
| `trip_alerts` | 0 | 0 |

**No pagination is needed.** The `LIMIT 100` on bundle queries and `LIMIT 1000` on map data queries are generous safety limits, not pagination boundaries.

### 6.2 Cache Behavior on View Mode Changes

When the user toggles view mode, TanStack Query behavior is:

1. **First switch to a mode:** Cache miss. Query fires, shows loading state, then renders data.
2. **Return to a previously visited mode:** Cache hit (if within staleTime). Data renders instantly. Background refetch may fire if stale.
3. **Cache key structure:** Each mode has its own cache entry (`['intel', 'bundles', 'triaged']` vs `['intel', 'bundles', 'all-bundles']`). Mode switching never invalidates the other mode's cache.

This means **no special cache invalidation is needed** when modes change. TanStack Query handles it automatically.

### 6.3 Prefetch Strategy

**Recommendation: Lazy-load, do not prefetch.**

With 2 bundles and 44 raw alerts, the query latency is under 100ms. Prefetching all modes on mount would add unnecessary network requests for data the user may never view. The instant-switch benefit is negligible given the query speed.

If the dataset grows to hundreds of bundles, revisit with prefetching:

```typescript
// Future optimization -- NOT recommended for current data volume
const queryClient = useQueryClient()
useEffect(() => {
  queryClient.prefetchQuery({
    queryKey: ['intel', 'bundles', 'all-bundles'],
    queryFn: fetchAllBundles,
    staleTime: 30_000,
  })
}, [queryClient])
```

### 6.4 Supabase Connection Pooling

The app uses a **browser-side singleton** (`getSupabaseBrowserClient()`). Supabase JS client v2 uses the REST API (PostgREST) under the hood, not persistent WebSocket connections. Each query is an HTTP request.

**No connection pooling concerns for static export.** Each browser tab has its own singleton, and PostgREST connections are short-lived.

### 6.5 member_intel_ids Resolution Cost

The bundle detail query resolves `member_intel_ids` via `.in('id', memberIds)`. The largest bundle currently has 24 member IDs. Supabase translates `.in()` to a `WHERE id IN (...)` clause, which uses the primary key index. Even with hundreds of member IDs, this is a single indexed query that completes in milliseconds.

**No batching needed.** If bundles grow to thousands of members (unlikely in the triage model), split into batches of 100 IDs per query.

---

## 7. Error Handling & Edge Cases

### 7.1 No Bundles Yet (Empty Triage Pipeline)

When `intel_bundles` is empty (no bundles have been created by the triage pipeline):

- `useIntelBundles()` returns `data: []` (empty array, not `undefined`).
- Transform functions produce empty arrays for markers, feed items, metrics.
- UI shows "No triaged intel" or "No bundles" empty state.
- `useCoverageMetrics()` continues working normally (sources exist even without bundles).

**Component handling:**

```typescript
const { data: bundles = [], isLoading, error } = useIntelBundles(viewMode)

if (isLoading) return <LoadingSkeleton />
if (error) return <ErrorState error={error} />
if (bundles.length === 0) return <EmptyState viewMode={viewMode} />
```

### 7.2 Bundle With No Triage Decision

This happens when `status='pending'` -- the bundle exists but has not been triaged yet. Visible in "All Bundles" mode.

- `BundleWithDecision.decision` is `null`.
- `getBundleDisplayTitle()` falls back to `bundle.title`, then generates a fallback.
- `getBundleDisplaySeverity()` falls back to `bundle.final_severity`.
- UI should show a "Pending" badge and dimmed styling.

### 7.3 Stale Data (Bundle References Deleted Intel Items)

When `member_intel_ids` references intel items that have been deleted from `intel_normalized` (e.g., by a retention job):

- The `.in('id', memberIds)` query returns only the rows that still exist.
- `members.length` will be less than `member_intel_ids.length`.
- `primaryIntel` will be `null` if the primary item was deleted.

**Detection and handling:**

```typescript
// In bundle-transforms.ts or a display component
export function getMissingMemberCount(detail: BundleWithMembers): number {
  const expectedCount = detail.bundle.member_intel_ids.length
  const actualCount = detail.members.length
  return expectedCount - actualCount
}

// UI can show a warning:
// "3 of 24 member alerts are no longer available (expired or deleted)"
```

### 7.4 Network Errors / Supabase Down

TanStack Query provides built-in retry behavior. The existing hooks do not customize retry settings, so defaults apply (3 retries with exponential backoff).

**Recommended: keep defaults.** For consistency, do not add custom retry config to the new hooks unless the existing hooks change their policy.

Error states are surfaced via `useQuery` return values:

```typescript
const { data, error, isError, failureCount } = useIntelBundles(viewMode)

// error: the Error object from the last failed attempt
// isError: true when all retries are exhausted
// failureCount: number of consecutive failures (resets on success)
```

### 7.5 View Mode Mismatch with URL

If the URL contains `?view=all-bundles` but the user's session has a different mode, `syncCoverageFromUrl()` wins (called once on mount). This matches the existing `?category=` behavior.

Invalid `?view=` values (e.g., `?view=foo`) are ignored, and the default mode is used.

### 7.6 Race Condition: Mode Switch During Loading

If the user switches view mode while a bundle query is in-flight:

1. TanStack Query cancels the in-flight query for the old mode (if using `AbortController`, which Supabase JS supports).
2. A new query starts for the new mode.
3. The old query's cache entry remains in its last known state (stale or loading).

No special handling needed. TanStack Query's cache key isolation handles this correctly.

### 7.7 Supabase PostgREST Embedded Select Failures

If the `triage_decisions` FK relationship is broken (e.g., the FK constraint is dropped), the embedded select will silently return an empty array for `triage_decisions`. The `normalizeBundleResponse` function handles this gracefully by setting `decision: null`.

---

## 8. Implementation Order

### Phase 1: Types and Store (no UI changes)

1. Add `IntelBundleRow`, `TriageDecisionRow`, `TripAlertRow` to `src/lib/supabase/types.ts`
2. Create `src/lib/interfaces/intel-bundles.ts` with `ViewMode`, `BundleWithDecision`, `BundleWithMembers`, helpers
3. Extend `coverage.store.ts` with `viewMode`, `selectedBundleId`, and URL sync

### Phase 2: Hooks (data layer wiring)

4. Create `src/hooks/use-intel-bundles.ts`
5. Create `src/hooks/use-bundle-detail.ts`
6. Verify queries work against live Supabase data

### Phase 3: Transforms (client-side data processing)

7. Create `src/lib/bundle-transforms.ts` with all transform functions
8. Unit test transform functions against known bundle shapes

### Phase 4: UI Integration

9. Add view mode toggle UI component
10. Wire view mode to existing components (FeedPanel, ActivityTicker, CoverageMap, CoverageGrid)
11. Add bundle detail panel/view
12. Add empty states and error states for bundle modes

---

## Appendix A: Verified Database Schema

The following column inventory was verified against `information_schema.columns` on 2026-03-04.

### intel_bundles (25 columns)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `primary_intel_id` | uuid | NO | -- |
| `dedup_hash` | text | NO | -- |
| `member_intel_ids` | uuid[] | NO | -- |
| `source_count` | integer | NO | -- |
| `categories` | text[] | YES | -- |
| `confidence_aggregate` | integer | NO | -- |
| `final_severity` | text | NO | -- |
| `status` | text | NO | `'pending'` |
| `created_at` | timestamptz | NO | `now()` |
| `updated_at` | timestamptz | NO | `now()` |
| `risk_score` | numeric | YES | -- |
| `routed_at` | timestamptz | YES | -- |
| `routed_alert_count` | integer | YES | `0` |
| `title` | text | YES | -- |
| `summary` | text | YES | -- |
| `intel_count` | integer | YES | `0` |
| `risk_details` | jsonb | YES | -- |
| `representative_coordinates` | jsonb | YES | -- |
| `geographic_scope` | jsonb | YES | -- |
| `temporal_scope` | jsonb | YES | -- |
| `analyst_notes` | text | YES | -- |
| `deduplication_keys` | text[] | YES | `'{}'` |
| `source_breakdown` | jsonb | YES | `'{}'` |

### triage_decisions (19 columns)

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | `uuid_generate_v4()` |
| `bundle_id` | uuid | NO | -- |
| `version` | integer | NO | `1` |
| `decision` | text | NO | -- |
| `bucket` | text | YES | -- |
| `suggested_trip_ids` | uuid[] | YES | -- |
| `selected_trip_ids` | uuid[] | YES | -- |
| `excluded_trip_ids` | uuid[] | YES | -- |
| `edited_title` | text | YES | -- |
| `edited_summary` | text | YES | -- |
| `edited_severity` | text | YES | -- |
| `edited_geo` | jsonb | YES | -- |
| `reviewer_id` | uuid | NO | -- |
| `note` | text | YES | -- |
| `decided_at` | timestamptz | NO | `now()` |
| `diff` | jsonb | YES | -- |
| `selected_trips` | text[] | YES | `'{}'` |
| `excluded_trips` | text[] | YES | `'{}'` |
| `impacted_orgs` | text[] | YES | `'{}'` |
| `delivery_bucket` | text | YES | -- |

### Foreign Key Constraints

| Table | Column | References |
|-------|--------|-----------|
| `intel_bundles` | `primary_intel_id` | `intel_normalized.id` |
| `triage_decisions` | `bundle_id` | `intel_bundles.id` |
| `triage_decisions` | `reviewer_id` | `users.id` |
| `trip_alerts` | `bundle_id` | `intel_bundles.id` |

### Current Data Snapshot (2026-03-04)

**intel_bundles: 2 rows**

| id | status | title | final_severity | categories | intel_count | confidence |
|----|--------|-------|---------------|------------|-------------|------------|
| `a1c655c5...` | approved | Severe Weather - Unknown Location | Severe | `['weather']` | 24 | 88 |
| `b516ea2a...` | rejected | Minor Seismic - Unknown Location | Severe | `['seismic']` | 20 | 99 |

Both bundles have `representative_coordinates` with null lat/lon, meaning **bundle map markers will not render until the triage pipeline populates coordinates**. The transform functions handle this gracefully (filter out null coords).

**triage_decisions: 2 rows**

| bundle_id | decision | reviewer_id | note (truncated) |
|-----------|----------|-------------|---------|
| `a1c655c5...` | approve | `00000000-...` | [AUTO-TRIAGE] Confidence: 0.90... |
| `b516ea2a...` | reject | `00000000-...` | [AUTO-TRIAGE] Confidence: 0.90... |

Both decisions were auto-triaged (reviewer = all-zeros UUID).
