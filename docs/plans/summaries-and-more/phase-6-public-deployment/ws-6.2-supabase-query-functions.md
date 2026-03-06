# WS-6.2: Supabase Query Functions

> **Workstream ID:** WS-6.2
> **Phase:** 6 -- Public Deployment
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** None (within Phase 6)
> **Blocks:** WS-6.1
> **Resolves:** None

## 1. Objective

Create a module of typed Supabase query functions at `src/lib/supabase/queries.ts` that mirror the five existing TarvaRI API fetch functions used by the application's TanStack Query hooks. Each function uses the Supabase JS client (`getSupabaseBrowserClient()` from `src/lib/supabase/client.ts`) to query public Postgres views instead of the TarvaRI backend REST API (`tarvariGet`).

This module is the data layer that enables the application to run as a static GitHub Pages deployment without a running TarvaRI backend server. When WS-6.1 implements data mode branching, each hook's internal `queryFn` will switch between `tarvariGet`-based fetchers (console/development mode) and the Supabase query functions defined here (public deployment mode), based on the `NEXT_PUBLIC_DATA_MODE` environment variable.

**Assumption:** Backend Phase E.1 creates three Supabase views with Row Level Security policies that expose only approved, non-sensitive intel data through the anon key:

| Supabase View | Mirrors API Endpoint | Purpose |
|---------------|---------------------|---------|
| `public_intel_feed` | `GET /console/intel` | Recent normalized intel items |
| `public_coverage_map` | `GET /console/coverage/map-data` | Geo-located intel with Point geometry |
| `public_bundles` | `GET /console/bundles` | Approved intel bundles |
| `public_bundle_detail` | `GET /console/bundles/:id` | Single bundle with full detail |

Coverage metrics (`GET /console/coverage`) have no dedicated view -- they are derived by aggregating `public_intel_feed` rows client-side, since the source metadata (source counts, geographic regions, update frequencies) is not appropriate for public exposure. See Deliverable 4.3 and Decision D-3 for the derivation strategy.

The query functions return the same TypeScript types already consumed by the hooks (`IntelFeedItem[]`, `MapMarker[]`, `CoverageMetrics`, `BundleWithDecision[]`, `BundleWithMembers | null`), so WS-6.1's branching logic requires zero type gymnastics at the hook level.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `fetchIntelFeedFromSupabase` | Query `public_intel_feed` view, select relevant columns, order by `ingested_at` desc, limit 50. Map snake_case columns to camelCase `IntelFeedItem[]`. |
| `fetchCoverageMapDataFromSupabase` | Query `public_coverage_map` view with optional category, severity, and date range filters. Parse the `geo` JSONB column (GeoJSON Point geometry), filter to valid Points, and map to `MapMarker[]`. |
| `fetchCoverageMetricsFromSupabase` | Query `public_intel_feed` to derive category counts and alert totals. Return `CoverageMetrics` with zeroed source-level fields (`sourcesByCoverage: []`, per-category `activeSources: 0`, `geographicRegions: []`). Public deployment does not expose source metadata. |
| `fetchBundlesFromSupabase` | Query `public_bundles` view with optional status filter (`approved` for triaged mode, no filter for all-bundles mode). Map to `BundleWithDecision[]`. |
| `fetchBundleDetailFromSupabase` | Query `public_bundle_detail` view by `id`. Map to `BundleWithMembers | null`. |
| `fetchCategoryIntelFromSupabase` | Query `public_intel_feed` view filtered by category. Map to `CategoryIntelItem[]` with null fallbacks for fields not available in the public view. |
| Type reuse | All return types are imported from existing modules (`use-intel-feed.ts`, `use-category-intel.ts`, `coverage-utils.ts`, `interfaces/intel-bundles.ts`, `supabase/types.ts`). No new types defined. |
| Column-to-field mapping | Each function documents the exact column-to-field mapping between Supabase view columns (snake_case) and the existing TypeScript interface fields (camelCase). |
| Error handling | Supabase client returns `{ data, error }`. Each function checks `error` and throws a descriptive `Error` to match the `tarvariGet` throw-on-failure contract. TanStack Query catches these and populates `query.error`. |
| JSDoc documentation | Module-level and per-function documentation describing the view queried, columns selected, filters applied, and return type. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Data mode branching in hooks | WS-6.1 implements the `NEXT_PUBLIC_DATA_MODE` switch in each hook. This workstream provides the Supabase fetcher functions that WS-6.1 imports. |
| Supabase view creation | Backend Phase E.1 creates the `public_intel_feed`, `public_coverage_map`, `public_bundles`, and `public_bundle_detail` views with appropriate RLS policies. |
| RLS policy design | Backend Phase E.1 responsibility. This workstream assumes anon key access returns only approved, non-sensitive rows. |
| Static export configuration | WS-6.3 configures `next.config.ts` for `output: 'export'`. |
| GitHub Actions workflow | WS-6.4 creates the deployment pipeline. |
| `Database` type updates | The `Database` interface in `src/lib/supabase/types.ts` currently has `Views: Record<string, never>`. When the views exist, this interface should be updated to include them. However, Supabase views can be queried with `.from('view_name')` without typed view definitions -- the client treats them as tables. Updating the `Database` interface is desirable for type safety but is not blocking. It can be done in this workstream or deferred. See Decision D-5. |
| `bbox` and `sourceKey` filtering on Supabase queries | WS-5.1 adds these parameters to the TarvaRI API path. The Supabase PostgREST path would need server-side `ST_Within` or equivalent spatial filtering, which is a backend concern. For the initial public deployment, bbox filtering is omitted from the Supabase path. The map returns all geo-located items and client-side filtering can be applied if needed. See Decision D-6. |
| Supabase Realtime subscriptions | WS-2.4 creates the Realtime channel for priority alerts. That subscription uses the same Supabase client but is architecturally separate from the query functions defined here. |
| Coverage source metadata | The public deployment intentionally does not expose source-level metadata (source keys, source names, geographic coverage, update frequencies). The `CoverageMetrics` returned by `fetchCoverageMetricsFromSupabase` zeroes out all source-level fields. See Decision D-3. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/lib/supabase/client.ts` | `getSupabaseBrowserClient()` -- singleton Supabase client for browser-side queries. Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Auth disabled (`persistSession: false, autoRefreshToken: false`). | Available [CODEBASE] |
| `src/lib/supabase/types.ts` | `IntelBundleRow`, `IntelNormalizedRow`, `TriageDecisionRow` -- row types for the underlying tables. Used to type Supabase `.select()` results before mapping to display types. | Available [CODEBASE] |
| `src/hooks/use-intel-feed.ts` | `IntelFeedItem` interface (lines 20-27) and `fetchIntelFeed` implementation (lines 56-67) -- the return type and transformation logic to mirror. | Available [CODEBASE] |
| `src/hooks/use-coverage-map-data.ts` | `CoverageMapFilters` interface (lines 23-29), `fetchCoverageMapData` implementation (lines 53-89) -- filter contract and GeoJSON-to-MapMarker transformation to mirror. | Available [CODEBASE] |
| `src/hooks/use-coverage-metrics.ts` | `fetchCoverageMetrics` implementation (lines 64-103) -- the dual-fetch aggregation pattern to adapt for Supabase. | Available [CODEBASE] |
| `src/hooks/use-intel-bundles.ts` | `fetchTriagedBundles` and `fetchAllBundles` implementations (lines 79-90), `apiToBundle` normalization (lines 45-73) -- bundle mapping to mirror. | Available [CODEBASE] |
| `src/hooks/use-bundle-detail.ts` | `fetchBundleDetail` implementation (lines 46-81) -- single-bundle mapping to mirror. | Available [CODEBASE] |
| `src/lib/coverage-utils.ts` | `MapMarker`, `CoverageMetrics`, `CoverageByCategory`, `SourceCoverage` types -- return types for map data and metrics functions. | Available [CODEBASE] |
| `src/lib/interfaces/intel-bundles.ts` | `BundleWithDecision`, `BundleWithMembers`, `ViewMode` types -- return types for bundle functions. | Available [CODEBASE] |
| Backend Phase E.1 | Supabase views `public_intel_feed`, `public_coverage_map`, `public_bundles`, `public_bundle_detail` with RLS policies granting SELECT to anon role. Column schemas described in Deliverables section. | Pending (backend work) |

## 4. Deliverables

### 4.1 Function -- `fetchIntelFeedFromSupabase`

**File:** `src/lib/supabase/queries.ts`

Mirrors: `fetchIntelFeed()` in `src/hooks/use-intel-feed.ts` (lines 56-67).

Queries the `public_intel_feed` Supabase view and returns `IntelFeedItem[]`.

**Assumed view columns** (based on `ApiIntelItem` in `use-intel-feed.ts`):

| View Column | Type | Maps To |
|-------------|------|---------|
| `id` | uuid | `IntelFeedItem.id` |
| `title` | text | `IntelFeedItem.title` |
| `severity` | text | `IntelFeedItem.severity` |
| `category` | text | `IntelFeedItem.category` |
| `source_key` | text (nullable) | `IntelFeedItem.sourceId` (fallback `''`) |
| `ingested_at` | timestamptz | `IntelFeedItem.ingestedAt` |

**Query logic:**

```
supabase
  .from('public_intel_feed')
  .select('id, title, severity, category, source_key, ingested_at')
  .order('ingested_at', { ascending: false })
  .limit(50)
```

**Transformation:** Map each row from snake_case view columns to camelCase `IntelFeedItem` fields. `source_key` maps to `sourceId` with `?? ''` fallback for null values, matching the existing API normalization in `use-intel-feed.ts` line 64.

**Error handling:** If `error` is non-null, throw `new Error('Supabase query failed (public_intel_feed): ' + error.message)`.

**Return type:** `Promise<IntelFeedItem[]>`

---

### 4.2 Function -- `fetchCoverageMapDataFromSupabase`

**File:** `src/lib/supabase/queries.ts`

Mirrors: `fetchCoverageMapData()` in `src/hooks/use-coverage-map-data.ts` (lines 53-89).

Queries the `public_coverage_map` Supabase view with optional filters and returns `MapMarker[]`.

**Assumed view columns:**

| View Column | Type | Maps To |
|-------------|------|---------|
| `id` | uuid | `MapMarker.id` |
| `title` | text (nullable) | `MapMarker.title` (fallback `'Intel Item'`) |
| `severity` | text (nullable) | `MapMarker.severity` (fallback `'Unknown'`) |
| `category` | text (nullable) | `MapMarker.category` (fallback `'other'`) |
| `source_key` | text (nullable) | `MapMarker.sourceId` (fallback `''`) |
| `ingested_at` | timestamptz | `MapMarker.ingestedAt` |
| `geo` | jsonb (nullable) | GeoJSON geometry -- extract `coordinates[1]` as `lat`, `coordinates[0]` as `lng` |

**Query logic:**

```
let query = supabase
  .from('public_coverage_map')
  .select('id, title, severity, category, source_key, ingested_at, geo')

// Apply optional filters
if (filters?.categories?.length) {
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
```

**Key difference from API path:** The Supabase PostgREST query supports `in()` for multi-category filtering (the API path only sends `filters.categories[0]` due to the single `category` query param constraint on the backend -- see `use-coverage-map-data.ts` line 57). This is a minor improvement in the Supabase path.

**Transformation:** Filter to rows where `geo` is a valid GeoJSON Point (non-null, `type === 'Point'`, coordinates array has >= 2 numbers), then map to `MapMarker` with GeoJSON `[lng, lat]` to `{ lat, lng }` coordinate flip. Identical logic to `use-coverage-map-data.ts` lines 70-88, applied to JSONB column data instead of GeoJSON API response features.

**Accepts:** `CoverageMapFilters` (from `use-coverage-map-data.ts`). The `bbox` and `sourceKey` fields (added by WS-5.1) are ignored in the Supabase path -- see Decision D-6.

**Error handling:** Throw on non-null `error`.

**Return type:** `Promise<MapMarker[]>`

---

### 4.3 Function -- `fetchCoverageMetricsFromSupabase`

**File:** `src/lib/supabase/queries.ts`

Mirrors: `fetchCoverageMetrics()` in `src/hooks/use-coverage-metrics.ts` (lines 64-103).

The existing API-based function fetches two endpoints in parallel (`/console/coverage` for source metadata and `/console/intel` for alert counts) and merges them. The Supabase public deployment does not expose source metadata (source keys, names, geographic coverage, update frequencies) because these are operationally sensitive. The public function derives what it can from the intel feed alone.

**Query logic:**

```
supabase
  .from('public_intel_feed')
  .select('category')
```

This returns all rows with only the `category` column, which is sufficient to compute:
- `totalAlerts`: total row count
- `byCategory[].alertCount`: count per category
- `byCategory[].category`: distinct category values
- `categoriesCovered`: count of distinct categories

**Zeroed fields** (not available in public deployment):

| Field | Value | Rationale |
|-------|-------|-----------|
| `totalSources` | `0` | Source metadata not exposed publicly |
| `activeSources` | `0` | Source metadata not exposed publicly |
| `sourcesByCoverage` | `[]` | Source metadata not exposed publicly |
| `byCategory[].sourceCount` | `0` | Source metadata not exposed publicly |
| `byCategory[].activeSources` | `0` | Source metadata not exposed publicly |
| `byCategory[].geographicRegions` | `[]` | Source metadata not exposed publicly |

**Transformation:** Group rows by `category`, count occurrences for `alertCount`, aggregate to `CoverageByCategory[]`, wrap in `CoverageMetrics`.

**Error handling:** Throw on non-null `error`.

**Return type:** `Promise<CoverageMetrics>`

**UI impact note:** Components that display source counts (e.g., `CoverageOverviewStats`, `CategoryCard`) will show `0` for source-related metrics in public mode. WS-6.1 or the consuming components may conditionally hide source-count UI when `NEXT_PUBLIC_DATA_MODE === 'supabase'`. This is not a concern for this workstream.

---

### 4.4 Function -- `fetchBundlesFromSupabase`

**File:** `src/lib/supabase/queries.ts`

Mirrors: `fetchTriagedBundles()` and `fetchAllBundles()` in `src/hooks/use-intel-bundles.ts` (lines 79-90).

A single function that accepts a `ViewMode` parameter and applies the appropriate status filter.

**Assumed view columns** (based on `ApiBundleItem` in `use-intel-bundles.ts`):

| View Column | Type | Maps To |
|-------------|------|---------|
| `id` | uuid | `IntelBundleRow.id` |
| `title` | text (nullable) | `IntelBundleRow.title` |
| `status` | text | `IntelBundleRow.status` |
| `final_severity` | text (nullable) | `IntelBundleRow.final_severity` (fallback `'Unknown'`) |
| `intel_count` | integer | `IntelBundleRow.intel_count` |
| `source_count` | integer | `IntelBundleRow.source_count` |
| `risk_score` | numeric (nullable) | `IntelBundleRow.risk_score` (convert to string) |
| `created_at` | timestamptz | `IntelBundleRow.created_at` |
| `routed_at` | timestamptz (nullable) | `IntelBundleRow.routed_at` |
| `routed_alert_count` | integer (nullable) | `IntelBundleRow.routed_alert_count` (fallback `0`) |

**Query logic:**

```
let query = supabase
  .from('public_bundles')
  .select('id, title, status, final_severity, intel_count, source_count, risk_score, created_at, routed_at, routed_alert_count')
  .order('created_at', { ascending: false })
  .limit(100)

if (viewMode === 'triaged') {
  query = query.eq('status', 'approved')
}
// 'all-bundles' mode: no status filter
// 'raw' mode: caller should not invoke this function (hook disables query)
```

**Transformation:** Map each row to `IntelBundleRow` (filling non-available fields with defaults: `summary: null`, `categories: null`, `confidence_aggregate: null`, `member_intel_ids: []`, `primary_intel_id: ''`, `dedup_hash: ''`, `representative_coordinates: null`, `geographic_scope: null`, `temporal_scope: null`, `risk_details: null`, `source_breakdown: null`, `analyst_notes: null`, `updated_at: ''`). Wrap in `BundleWithDecision` with `decision: null`. This matches the `apiToBundle` normalization in `use-intel-bundles.ts` lines 45-73.

**Error handling:** Throw on non-null `error`.

**Return type:** `Promise<BundleWithDecision[]>`

---

### 4.5 Function -- `fetchBundleDetailFromSupabase`

**File:** `src/lib/supabase/queries.ts`

Mirrors: `fetchBundleDetail()` in `src/hooks/use-bundle-detail.ts` (lines 46-81).

Queries the `public_bundle_detail` view for a single bundle by ID.

**Assumed view columns** (based on `ApiBundleDetail` in `use-bundle-detail.ts`):

| View Column | Type | Maps To |
|-------------|------|---------|
| `id` | uuid | `IntelBundleRow.id` |
| `title` | text (nullable) | `IntelBundleRow.title` |
| `summary` | text (nullable) | `IntelBundleRow.summary` |
| `status` | text | `IntelBundleRow.status` |
| `final_severity` | text (nullable) | `IntelBundleRow.final_severity` (fallback `'Unknown'`) |
| `intel_count` | integer | `IntelBundleRow.intel_count` |
| `source_count` | integer | `IntelBundleRow.source_count` |
| `confidence_aggregate` | numeric (nullable) | `IntelBundleRow.confidence_aggregate` (convert to string) |
| `risk_score` | numeric (nullable) | `IntelBundleRow.risk_score` (convert to string) |
| `risk_details` | jsonb (nullable) | `IntelBundleRow.risk_details` |
| `created_at` | timestamptz | `IntelBundleRow.created_at` |
| `updated_at` | timestamptz (nullable) | `IntelBundleRow.updated_at` (fallback `''`) |
| `routed_at` | timestamptz (nullable) | `IntelBundleRow.routed_at` |
| `routed_alert_count` | integer (nullable) | `IntelBundleRow.routed_alert_count` (fallback `0`) |
| `representative_coordinates` | jsonb (nullable) | `IntelBundleRow.representative_coordinates` |
| `geographic_scope` | jsonb (nullable) | `IntelBundleRow.geographic_scope` |
| `temporal_scope` | jsonb (nullable) | `IntelBundleRow.temporal_scope` |
| `analyst_notes` | text (nullable) | `IntelBundleRow.analyst_notes` |

**Query logic:**

```
supabase
  .from('public_bundle_detail')
  .select('id, title, summary, status, final_severity, intel_count, source_count, confidence_aggregate, risk_score, risk_details, created_at, updated_at, routed_at, routed_alert_count, representative_coordinates, geographic_scope, temporal_scope, analyst_notes')
  .eq('id', bundleId)
  .single()
```

**Transformation:** Map to `IntelBundleRow` (filling non-available fields with defaults), wrap in `BundleWithMembers` with `decision: null`, `members: []`, `primaryIntel: null`. This matches `fetchBundleDetail` in `use-bundle-detail.ts` lines 49-81.

**Error handling:** If `error` is non-null and `error.code !== 'PGRST116'` (PostgREST "no rows found"), throw. If `PGRST116`, return `null` (bundle not found -- consistent with the API path where a 404 would be caught).

**Return type:** `Promise<BundleWithMembers | null>`

---

### 4.6 Function -- `fetchCategoryIntelFromSupabase`

**File:** `src/lib/supabase/queries.ts`

Mirrors: `fetchCategoryIntel()` in `src/hooks/use-category-intel.ts` (lines 62-81).

Queries the `public_intel_feed` Supabase view filtered by category and returns `CategoryIntelItem[]`.

**Assumed view columns** (reuses `public_intel_feed` -- same view as 4.1, filtered by category):

| View Column | Type | Maps To |
|-------------|------|---------|
| `id` | uuid | `CategoryIntelItem.id` |
| `title` | text | `CategoryIntelItem.title` |
| `severity` | text | `CategoryIntelItem.severity` |
| `category` | text | `CategoryIntelItem.category` |
| `source_key` | text (nullable) | `CategoryIntelItem.sourceId` (fallback `''`) |
| `ingested_at` | timestamptz | `CategoryIntelItem.ingestedAt` |

**Fields not available in public view** (null fallbacks):

| Field | Value | Rationale |
|-------|-------|-----------|
| `eventType` | `null` | Not exposed in `public_intel_feed` |
| `confidence` | `null` | Not exposed in `public_intel_feed` |
| `geoScope` | `null` | Not exposed in `public_intel_feed` |
| `shortSummary` | `null` | Not exposed in `public_intel_feed` |
| `sentAt` | `null` | Not exposed in `public_intel_feed` |

**Query logic:**

```
supabase
  .from('public_intel_feed')
  .select('id, title, severity, category, source_key, ingested_at')
  .eq('category', category)
  .order('ingested_at', { ascending: false })
  .limit(100)
```

**Transformation:** Map each row from snake_case view columns to camelCase `CategoryIntelItem` fields with null fallbacks for fields not present in the public view. `source_key` maps to `sourceId` with `?? ''` fallback.

**Error handling:** If `error` is non-null, throw `new Error('Supabase query failed (public_intel_feed/category): ' + error.message)`.

**Return type:** `Promise<CategoryIntelItem[]>`

---

### 4.7 Module structure

**File:** `src/lib/supabase/queries.ts`

```
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
import type { IntelFeedItem } from '@/hooks/use-intel-feed'
import type { CoverageMapFilters } from '@/hooks/use-coverage-map-data'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import type { MapMarker, CoverageMetrics, CoverageByCategory } from '@/lib/coverage-utils'
import type { IntelBundleRow } from '@/lib/supabase/types'
import type { BundleWithDecision, BundleWithMembers, ViewMode } from '@/lib/interfaces/intel-bundles'

// 6 exported async functions (4.1 through 4.6)
```

**No default export.** All functions are named exports for tree-shaking and explicit import by WS-6.1.

---

### 4.8 Exports summary

| Export | Type | Consumers |
|--------|------|-----------|
| `fetchIntelFeedFromSupabase` | async function | WS-6.1 (branching in `use-intel-feed.ts`) |
| `fetchCoverageMapDataFromSupabase` | async function | WS-6.1 (branching in `use-coverage-map-data.ts`) |
| `fetchCoverageMetricsFromSupabase` | async function | WS-6.1 (branching in `use-coverage-metrics.ts`) |
| `fetchBundlesFromSupabase` | async function | WS-6.1 (branching in `use-intel-bundles.ts`) |
| `fetchBundleDetailFromSupabase` | async function | WS-6.1 (branching in `use-bundle-detail.ts`) |
| `fetchCategoryIntelFromSupabase` | async function | WS-6.1 (branching in `use-category-intel.ts`) |

### 4.9 Changed files summary

| File | Nature |
|------|--------|
| `src/lib/supabase/queries.ts` (NEW) | ~220-260 lines. 6 exported async functions, module-level JSDoc, imports from 7 existing modules. |

No modifications to any existing file. This workstream is purely additive.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `src/lib/supabase/queries.ts` exists and exports 6 named async functions: `fetchIntelFeedFromSupabase`, `fetchCoverageMapDataFromSupabase`, `fetchCoverageMetricsFromSupabase`, `fetchBundlesFromSupabase`, `fetchBundleDetailFromSupabase`, `fetchCategoryIntelFromSupabase`. | Code review; `pnpm typecheck` confirms exports are importable. |
| AC-2 | `fetchIntelFeedFromSupabase()` returns `Promise<IntelFeedItem[]>`. The return type matches the existing `fetchIntelFeed()` return type exactly. | TypeScript compilation. Assign result to `IntelFeedItem[]` variable; no type error. |
| AC-3 | `fetchCoverageMapDataFromSupabase(filters?)` returns `Promise<MapMarker[]>`. Accepts optional `CoverageMapFilters` parameter with the same interface used by `useCoverageMapData`. | TypeScript compilation. |
| AC-4 | `fetchCoverageMetricsFromSupabase()` returns `Promise<CoverageMetrics>`. Source-level fields (`totalSources`, `activeSources`, `sourcesByCoverage`, per-category `sourceCount`/`activeSources`/`geographicRegions`) are zeroed. `totalAlerts` and per-category `alertCount` are computed from row counts. | Code review; unit test asserting zeroed source fields and correct alert counts. |
| AC-5 | `fetchBundlesFromSupabase('triaged')` queries with `.eq('status', 'approved')`. `fetchBundlesFromSupabase('all-bundles')` queries without status filter. | Code review of conditional query construction. |
| AC-6 | `fetchBundleDetailFromSupabase(bundleId)` returns `null` when no row matches the given ID, rather than throwing. | Code review of `PGRST116` error handling. |
| AC-7 | All functions throw an `Error` with a descriptive message when the Supabase client returns a non-null `error` (excluding `PGRST116` in the bundle detail case). Error messages include the view name for debuggability. | Code review of error handling in all 5 functions. |
| AC-8 | All functions use `getSupabaseBrowserClient()` from `src/lib/supabase/client.ts`. No direct `createClient` calls. | Code review; grep for `createClient` in the new file returns zero hits. |
| AC-9 | The module has no side effects. No code executes at import time (no top-level `getSupabaseBrowserClient()` call). The client is obtained inside each function. | Code review. |
| AC-10 | `pnpm typecheck` passes with zero errors across the full project. | Run `pnpm typecheck`. |
| AC-11 | `pnpm build` succeeds. | Run `pnpm build`. |
| AC-12 | `pnpm lint` passes with no new warnings or errors. | Run `pnpm lint`. |
| AC-13 | The GeoJSON Point filtering logic in `fetchCoverageMapDataFromSupabase` matches the existing validation in `use-coverage-map-data.ts` lines 70-78: non-null `geo`, `type === 'Point'`, coordinates array with >= 2 numeric elements. | Code review; side-by-side comparison with existing implementation. |
| AC-14 | No existing files are modified. This workstream is purely additive (1 new file). | `git diff --stat` shows only the new file. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Function naming convention: `fetch<Domain>FromSupabase`. Example: `fetchIntelFeedFromSupabase`, `fetchCoverageMapDataFromSupabase`. | The `FromSupabase` suffix makes the data source explicit when WS-6.1 imports both the API-based and Supabase-based fetchers into the same hook file. It avoids ambiguity (e.g., `fetchIntelFeed` already exists as the API-based version). The prefix `fetch` matches the existing naming convention (`fetchIntelFeed`, `fetchCoverageMapData`, etc.). | Suffix `Supabase` without `From` (e.g., `fetchIntelFeedSupabase`) -- rejected because `FromSupabase` reads more naturally as a prepositional phrase. Prefix `supabase` (e.g., `supabaseFetchIntelFeed`) -- rejected because it breaks the `fetch*` naming pattern. Namespace via module path only (same function names, different import paths) -- rejected because WS-6.1 may import both in the same file for the branching logic, creating name collisions. |
| D-2 | All 5 functions in a single file (`src/lib/supabase/queries.ts`) rather than one file per function. | The functions are small (20-40 lines each), share imports (`getSupabaseBrowserClient`, type imports), and are always consumed as a group by WS-6.1. A single file reduces import boilerplate and keeps the Supabase query layer discoverable in one location. The `src/lib/supabase/` directory already has `client.ts` and `types.ts` -- adding `queries.ts` follows the same flat structure. | One file per function in `src/lib/supabase/queries/` directory -- rejected because 5 small files with identical import headers creates unnecessary fragmentation. Co-locating with hooks (e.g., Supabase fetcher inside `use-intel-feed.ts`) -- rejected because it couples the Supabase dependency to files that currently only depend on `tarvariGet`, and WS-6.1's branching pattern is cleaner with a separate import source. |
| D-3 | `fetchCoverageMetricsFromSupabase` derives metrics from `public_intel_feed` only, zeroing all source-level fields. | The TarvaRI API-based `fetchCoverageMetrics` fetches `/console/coverage` (source metadata) + `/console/intel` (alert data). Source metadata includes source keys, names, geographic coverage, and update frequencies -- operationally sensitive information that should not be exposed in a public deployment. Backend Phase E.1 is not expected to create a `public_coverage` view for sources. Rather than guessing at what a public source view might look like, the Supabase function works with what is available (`public_intel_feed`) and zeroes the rest. Components that display source counts will show `0` in public mode, which is acceptable for a public-facing dashboard focused on alert visibility, not operational internals. | Create a `public_coverage` view exposing sanitized source data -- rejected because it is a backend Phase E decision, not a frontend one. This function should work with whatever views exist. If a `public_coverage` view is later created, this function can be extended. Omit `fetchCoverageMetricsFromSupabase` entirely and return `emptyMetrics()` -- rejected because alert counts and category breakdowns are valuable for the public dashboard and can be derived from `public_intel_feed`. |
| D-4 | `fetchBundlesFromSupabase` accepts `ViewMode` as a parameter rather than exposing separate `fetchTriagedBundlesFromSupabase` / `fetchAllBundlesFromSupabase` functions. | The API-based path in `use-intel-bundles.ts` has two separate functions (`fetchTriagedBundles`, `fetchAllBundles`) because the API path differs (`status=approved` param vs. no param). The Supabase path uses a single query with a conditional `.eq()` filter, making a single function with a parameter cleaner. The hook in WS-6.1 passes `viewMode` to the Supabase function directly. | Two separate functions matching the API pattern -- rejected because the Supabase implementation is a single query with a conditional filter clause, not two distinct query paths. Splitting into two functions would duplicate 90% of the code. |
| D-5 | Do not update the `Database` interface in `types.ts` to include view type definitions. Supabase views are queried as `.from('view_name')` without typed view definitions -- the client returns `any`-typed rows which are then mapped to existing TypeScript interfaces manually. | Updating the `Database` interface requires knowing the exact column types of the views, which are defined by backend Phase E.1. Until those views exist and their schemas are confirmed, adding speculative type definitions creates a maintenance burden (they would need to be updated when the actual views are created). The manual mapping approach (`.select('col1, col2')` with explicit row-to-interface mapping) provides equivalent runtime safety. If strict Supabase typing is desired, it can be added after the views exist by running `supabase gen types typescript` or manually updating the `Views` section of the `Database` interface. | Update `Database.public.Views` with assumed column types -- rejected because the view schemas are backend-defined and not yet confirmed. Speculative types risk divergence from actual schemas. Use `supabase gen types typescript` now -- rejected because the views do not exist yet. |
| D-6 | Omit `bbox` and `sourceKey` filtering from Supabase query functions. Only `category`, `severity`, `startDate`, and `endDate` filters are supported in the Supabase path. | The `bbox` filter requires server-side spatial queries (e.g., PostGIS `ST_Within` or a spatial index). Supabase PostgREST does not natively support bounding box queries on JSONB geometry columns -- it would require a custom RPC function or a generated column with a spatial index. This is a backend Phase E concern, not a frontend concern. The `sourceKey` filter exposes source identifiers, which conflicts with the Decision D-3 principle of not exposing source metadata publicly. For the initial public deployment, the map renders all geo-located items from `public_coverage_map` without spatial or source filtering. Client-side filtering (in JS after fetch) can provide bbox functionality if needed, though at the cost of fetching more data. | Implement client-side bbox filtering after fetch -- viable but deferred. The hook consumer (WS-6.1) could apply a post-fetch filter step. This optimization can be added without changing the function signature. Add a Supabase RPC function for spatial queries -- viable but is a backend Phase E concern, not specified in Phase E.1 scope. |
| D-7 | Obtain `getSupabaseBrowserClient()` inside each function call, not at module level. | The Supabase client is a singleton (memoized in `client.ts`), so calling `getSupabaseBrowserClient()` repeatedly has negligible cost. Obtaining it inside each function avoids module-level side effects and ensures the module can be imported in server-side contexts (like `pnpm typecheck` or Next.js build) without triggering environment variable validation before it is needed. This matches the pattern used by other Supabase consumers in the codebase (e.g., `use-supabase-receipts.ts`). | Module-level `const supabase = getSupabaseBrowserClient()` -- rejected because it executes at import time, which (a) triggers env var validation even if the functions are never called (e.g., in console mode), and (b) could fail during SSR/build if `NEXT_PUBLIC_SUPABASE_URL` is not set. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | What are the exact column names and types of the `public_intel_feed`, `public_coverage_map`, `public_bundles`, and `public_bundle_detail` views? This SOW assumes column names that match the existing API response fields (snake_case). If the views use different column names (e.g., `created` instead of `created_at`, or `lat`/`lng` columns instead of a `geo` JSONB column), the `.select()` calls and mapping logic will need adjustment. | Backend team | Phase E.1 |
| OQ-2 | Does `public_coverage_map` store geometry as a JSONB `geo` column (matching `intel_normalized.geo`) or as separate `lat`/`lng` numeric columns? If the view flattens geometry to separate columns, the Point validation and coordinate extraction logic changes significantly (no GeoJSON parsing needed, just null checks on `lat`/`lng`). | Backend team | Phase E.1 |
| OQ-3 | Should the public deployment expose `public_bundles` and `public_bundle_detail` at all? The combined-recommendations document lists them, but a public-facing alert viewer may only need the intel feed and map data. Exposing bundles reveals the triage pipeline structure. If bundles are excluded from public deployment, `fetchBundlesFromSupabase` and `fetchBundleDetailFromSupabase` can be stubbed to return empty arrays / null. | Product / Backend team | Phase E.1 |
| OQ-4 | Will the RLS policies on public views filter by status (e.g., only `status = 'approved'` rows in `public_bundles`), or does the view itself encode that filter? If the view already filters to approved-only, the `fetchBundlesFromSupabase` function's `.eq('status', 'approved')` filter for triaged mode is redundant but harmless. However, the `all-bundles` mode would then also return only approved bundles, which changes the semantics of that view mode in public deployment. | Backend team | Phase E.1 |
| OQ-5 | Should `fetchCoverageMetricsFromSupabase` fetch with `.select('category')` (downloading all rows, counting client-side) or should a Supabase RPC function provide pre-aggregated counts? For a small dataset (< 5,000 intel items), client-side aggregation is acceptable. For larger datasets, a `public_coverage_summary` view or RPC returning `{category, count}` rows would be more efficient. | Backend team / react-developer | Phase E.1 / Phase 6 implementation |
| OQ-6 | What is the expected row count in `public_intel_feed`? The current API-based `fetchCoverageMetrics` fetches up to 1,000 items (`limit: 1000`) for client-side category aggregation. If the public view contains significantly more rows, the `.select('category')` query in `fetchCoverageMetricsFromSupabase` (which has no limit) could return a large payload. A reasonable limit (e.g., 5,000) or server-side aggregation may be needed. | Backend team | Phase E.1 |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Backend Phase E.1 is not ready when this workstream is implemented. The Supabase views do not exist yet. | High | None | This module can be built and merged without the views existing. The functions will throw errors when called (Supabase returns a "relation does not exist" error), but they are never called until WS-6.1 activates the `supabase` data mode via `NEXT_PUBLIC_DATA_MODE`. In console/development mode (the default), these functions are dead code. `pnpm typecheck` and `pnpm build` succeed because the Supabase client's `.from()` accepts any string. |
| R-2 | View column names differ from assumptions in this SOW. The functions' `.select()` calls and row-to-interface mappings reference columns that do not match the actual view schema. | Medium | Low | Each function's column mapping is isolated and explicit (no dynamic column discovery). Fixing a column name mismatch is a 1-2 line change per function (update the `.select()` string and the mapping). The functions will fail at runtime with clear Supabase errors ("column X does not exist") that are easy to diagnose. |
| R-3 | `public_coverage_map` uses a different geometry storage format than assumed (e.g., PostGIS `geometry` column instead of JSONB, or separate `lat`/`lng` columns instead of GeoJSON). | Medium | Medium | The Point validation and coordinate extraction logic in `fetchCoverageMapDataFromSupabase` is modeled on the JSONB `geo` column format from `intel_normalized`. If the view uses a different format, this function needs rewriting. Mitigation: confirm with backend team before implementation (OQ-2). The function is self-contained (~30 lines), so rewriting is low-effort. |
| R-4 | Client-side category aggregation in `fetchCoverageMetricsFromSupabase` is slow for large datasets. If `public_intel_feed` has tens of thousands of rows, fetching all of them to count categories is wasteful. | Low | Medium | The current API path also fetches up to 1,000 items for client-side counting (`use-coverage-metrics.ts` line 68). The Supabase path selects only the `category` column (minimal payload: ~20 bytes per row). For 10,000 rows, this is ~200KB -- acceptable. For 100,000+, a server-side aggregation view or RPC is needed (OQ-5). Add a `.limit(10000)` safety cap to prevent unbounded fetches. |
| R-5 | Type safety is weaker than the API path because Supabase `.from('view_name')` returns `any`-typed rows when the view is not defined in the `Database` interface (D-5). A typo in a column name or an incorrect type assumption would not be caught at compile time. | Medium | Low | Each mapping function explicitly casts row fields to the target interface types. Runtime errors will surface clearly in development when the Supabase path is tested. Adding view definitions to the `Database` interface (after views exist) would provide compile-time safety. This is a follow-up improvement, not blocking. |
| R-6 | The `public_bundles` view's RLS policy already filters to `status = 'approved'`, making the `.eq('status', 'approved')` filter in triaged mode redundant and making the `all-bundles` mode return only approved bundles (semantically identical to triaged mode in public deployment). | Medium | Low | Redundant filters are harmless (PostgREST applies them as additional WHERE clauses). If `all-bundles` mode is semantically identical to triaged mode in public deployment, the UI should either (a) hide the view mode toggle, or (b) accept that both modes show the same data. This is a WS-6.1 / UI concern, not a query function concern. |
| R-7 | Importing types from hook files (`use-intel-feed.ts`, `use-coverage-map-data.ts`) creates a dependency from `src/lib/` to `src/hooks/`. This is a layer violation (lib should not depend on hooks). | Low | Low | The imported items are pure TypeScript types/interfaces (`IntelFeedItem`, `CoverageMapFilters`), not runtime values or React hooks. TypeScript type imports are erased at compile time and create no runtime dependency. If the layer violation is unacceptable, the types can be extracted to `src/lib/interfaces/` in a follow-up refactor. The existing codebase already has cross-layer type imports (e.g., `coverage.ts` imports from `supabase/types.ts`). |
