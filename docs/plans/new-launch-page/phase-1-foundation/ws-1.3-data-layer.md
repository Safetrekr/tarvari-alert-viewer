# WS-1.3: Data Layer

> **Workstream ID:** WS-1.3
> **Phase:** 1 — Foundation
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-03
> **Last Updated:** 2026-03-03
> **Depends On:** WS-1.2
> **Blocks:** WS-2.1, WS-3.1, WS-4.1
> **Resolves:** Decision 4 (Hybrid Category List), Decision 7 (Filter State Store)

## 1. Objective

Create the data layer that powers the Coverage Grid Launch Page by delivering four artifacts: two TanStack Query hooks that fetch intel data from Supabase (`useCoverageMetrics`, `useCoverageMapData`), a pure utility module that transforms raw rows into display-ready structures (`coverage-utils.ts`), and a Zustand filter store that holds the currently selected category with URL sync (`coverage.store.ts`). Additionally, extend the Supabase type file to include `intel_sources` and `intel_normalized` table definitions so all queries are type-safe.

The gate criterion is: both hooks return data from the shared Supabase instance (or a graceful empty state with no runtime errors) when the dev server is running, and `pnpm typecheck` continues to pass.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| TanStack Query hook: `useCoverageMetrics` | Fetches `intel_sources`, computes aggregate metrics (total sources, active sources, categories covered, per-category breakdown), returns typed `CoverageMetrics` |
| TanStack Query hook: `useCoverageMapData` | Fetches `intel_normalized` rows with GeoJSON geometry, transforms to `MapMarker[]`, supports category/severity/date range filters |
| Utility module: `coverage-utils.ts` | Pure functions: `buildCategoryMetrics()`, `toMarkers()`, `calculateBounds()` — extracted from hook query functions for testability |
| Zustand store: `coverage.store.ts` | `selectedCategory: string | null`, `setSelectedCategory()`, `clearSelection()` — URL sync with `?category={id}` query parameter |
| Supabase type extension | Add `intel_sources` and `intel_normalized` table definitions to `src/lib/supabase/types.ts` within the existing `Database` interface |
| Graceful empty/error states | All hooks return sensible defaults when tables are empty, unreachable, or have schema mismatches — no runtime crashes |

### Out of Scope

| Area | Rationale |
|------|-----------|
| UI components (grid, cards, map) | WS-2.1 (Coverage Grid) and WS-4.1 (Map Feature) consume these hooks |
| Morph animation wiring | WS-2.2 (Morph Adaptation) connects card clicks to morph transitions |
| District view scene | WS-3.1 (District View Adaptation) creates `CategoryDetailScene` using this data |
| Authentication changes | Auth swap from passphrase to Supabase Auth is a separate effort |
| Server-side data fetching | This app targets GitHub Pages static export — all fetching is client-side |
| RLS policy changes in Supabase | Data access is governed by the anon key and existing RLS policies on the TarvaRI tables |
| Realtime subscriptions | Polling via `refetchInterval` is sufficient for this dashboard; Supabase Realtime is not needed |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/lib/supabase/client.ts` | `getSupabaseBrowserClient()` singleton — used by both hooks to query Supabase. Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars. Auth disabled (`persistSession: false`). | Available |
| `src/lib/supabase/types.ts` | Existing `Database` interface with `launch_receipts` and `launch_snapshots` table definitions. Needs extension for `intel_sources` and `intel_normalized`. | Available (needs modification) |
| `src/components/providers/query-provider.tsx` | `QueryProvider` wrapping the app with TanStack Query `QueryClient`. Default `staleTime: 30_000`, `refetchOnWindowFocus: false`. | Available |
| `src/lib/interfaces/coverage.ts` | `CategoryId`, `CategoryMeta`, `KNOWN_CATEGORIES`, `SeverityLevel`, `SourceStatus` — created by WS-1.2. Used by utility functions to map raw rows to display types. | Created by WS-1.2 |
| `docs/plans/new-launch-page/HOOKS-SPEC.md` | Near-complete hook implementations for `useCoverageMetrics` and `useCoverageMapData`. Query shapes, interface definitions, staleTime/refetchInterval values. | Available (reference) |
| `docs/plans/new-launch-page/DERIVED-METRICS.md` | `buildCategoryMetrics()`, `toMarkers()`, `calculateBounds()` function specifications with TypeScript signatures. | Available (reference) |
| `docs/plans/new-launch-page/TYPESCRIPT-TYPES.md` | `IntelSourceRow`, `IntelNormalizedRow`, `SourceCoverage`, `CoverageByCategory`, `CoverageMetrics`, `MapMarker`, `GeoJSONFeature` type definitions. | Available (reference) |
| `docs/plans/new-launch-page/COVERAGE-DATA-SPEC.md` | Table schemas for `intel_sources` (5 columns, ~38 rows) and `intel_normalized` (7 columns, up to 1000 rows). Query shapes with filter examples. | Available (reference) |
| Supabase instance | Shared TarvaRI Supabase instance with `intel_sources` and `intel_normalized` tables populated by TarvaRI backend workers. Accessed via the same `NEXT_PUBLIC_SUPABASE_URL` already configured. | Assumed available (risk R-1) |

## 4. Deliverables

### 4.1 Extend Supabase Types — `src/lib/supabase/types.ts`

Add `intel_sources` and `intel_normalized` table definitions to the existing `Database` interface. These types follow the same pattern established by `launch_receipts` and `launch_snapshots`: separate `Row`, `Insert`, and `Update` interfaces.

#### 4.1.1 `IntelSourceRow` (Row type for `intel_sources`)

```typescript
/** Row type for intel_sources table (SELECT result). */
export interface IntelSourceRow {
  source_key: string          // text, unique slug (e.g. 'nws-alerts')
  name: string                // text, display name (e.g. 'NOAA National Weather Service')
  category: string            // text, hazard category (e.g. 'weather', 'seismic')
  status: string              // text, 'active' | 'staging' | 'quarantine' | 'disabled'
  coverage: {                 // jsonb, nullable
    geo?: string              // geographic area: 'US', 'Global', 'EU', 'Asia-Pacific'
    languages?: string[]      // ISO 639-1 codes: ['en']
    frequency?: string        // polling cadence: '1min', '5min', '15min', '1hr'
  } | null
}
```

Per COVERAGE-DATA-SPEC.md, `status` values are `'active' | 'staging' | 'quarantine' | 'disabled'`. The row type uses `string` rather than a union to tolerate unexpected values from the database. The `SourceStatus` union type from WS-1.2's `coverage.ts` is used at the display layer for type narrowing.

#### 4.1.2 `IntelNormalizedRow` (Row type for `intel_normalized`)

```typescript
/** Row type for intel_normalized table (SELECT result). */
export interface IntelNormalizedRow {
  id: string                  // uuid, primary key
  title: string               // text, alert title
  severity: string            // text, 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'
  category: string            // text, same categories as intel_sources
  source_id: string           // uuid, FK to intel_sources.id
  geo: {                      // jsonb, nullable — GeoJSON geometry
    type: string              // 'Point' | 'LineString' | 'Polygon'
    coordinates: number[] | number[][] | number[][][]
  } | null
  ingested_at: string         // timestamptz, ISO 8601
}
```

#### 4.1.3 `Database` interface extension

Add to the `Tables` property inside the existing `Database.public` definition:

```typescript
intel_sources: {
  Row: IntelSourceRow
  Insert: Omit<IntelSourceRow, never>     // all fields required for insert
  Update: Partial<IntelSourceRow>
}
intel_normalized: {
  Row: IntelNormalizedRow
  Insert: Omit<IntelNormalizedRow, never>
  Update: Partial<IntelNormalizedRow>
}
```

This workstream only reads from these tables (no insert/update), so the `Insert` and `Update` types are included for completeness and consistency with the existing pattern but are not exercised.

---

### 4.2 Create Utility Module — `src/lib/coverage-utils.ts`

**Path:** `src/lib/coverage-utils.ts`

Pure functions extracted from the hook query logic. These are independently testable and reusable by multiple consumers (hooks, components, tests).

#### 4.2.1 `buildCategoryMetrics()`

Aggregates `intel_sources` rows by category. Implements Decision 4 (Hybrid Category List): the function groups raw source rows by their `category` field, producing a `CoverageByCategory[]` sorted by `sourceCount` descending. Only categories with at least one source appear in the output.

```typescript
import type { IntelSourceRow } from '@/lib/supabase/types'

export interface CoverageByCategory {
  category: string
  sourceCount: number
  activeSources: number
  geographicRegions: string[]
}

/**
 * Group intel sources by category and aggregate counts.
 * Returns categories sorted by sourceCount descending.
 * Categories with zero sources are excluded.
 */
export function buildCategoryMetrics(sources: IntelSourceRow[]): CoverageByCategory[]
```

Per DERIVED-METRICS.md, geographic regions are collected from `source.coverage?.geo`, deduplicated per category.

#### 4.2.2 `toMarkers()`

Converts `intel_normalized` rows with GeoJSON Point geometry into `MapMarker[]` for map rendering. Filters out rows where `geo` is null, not a Point, or has malformed coordinates. Handles the GeoJSON `[longitude, latitude]` to `[lat, lng]` flip.

```typescript
import type { IntelNormalizedRow } from '@/lib/supabase/types'

export interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  severity: string
  category: string
  sourceId: string
  ingestedAt: string
}

/**
 * Convert intel_normalized rows to map markers.
 * Filters to Point geometries only. Flips GeoJSON [lng, lat] to [lat, lng].
 * Rows with null/invalid geo are silently excluded.
 */
export function toMarkers(items: IntelNormalizedRow[]): MapMarker[]
```

#### 4.2.3 `calculateBounds()`

Computes the geographic bounding box for a set of markers. Returns a center/zoom for single-marker or empty cases, and a bounds rectangle for multiple markers.

```typescript
export interface MapBounds {
  center?: [number, number]   // [lng, lat]
  zoom?: number
  bounds?: [[number, number], [number, number]]  // [[minLng, minLat], [maxLng, maxLat]]
}

/**
 * Calculate geographic bounds for a set of markers.
 * - 0 markers: center at [0, 0], zoom 2 (world view)
 * - 1 marker: center on that marker, zoom 8
 * - 2+ markers: bounding box of all markers
 */
export function calculateBounds(markers: MapMarker[]): MapBounds
```

#### 4.2.4 `emptyMetrics()`

Returns the zero-state `CoverageMetrics` object used as default when the query returns no data.

```typescript
export interface CoverageMetrics {
  totalSources: number
  activeSources: number
  categoriesCovered: number
  sourcesByCoverage: SourceCoverage[]
  byCategory: CoverageByCategory[]
}

export interface SourceCoverage {
  sourceKey: string
  name: string
  category: string
  status: string
  geographicCoverage: string | null
  updateFrequency: string | null
}

/**
 * Returns a CoverageMetrics object with all counts at zero and empty arrays.
 * Used as the default value when Supabase returns no data or on error.
 */
export function emptyMetrics(): CoverageMetrics
```

---

### 4.3 Create TanStack Query Hook — `src/hooks/use-coverage-metrics.ts`

**Path:** `src/hooks/use-coverage-metrics.ts`

Fetches all rows from `intel_sources` via `getSupabaseBrowserClient()` and computes aggregate metrics client-side. The query is lightweight (~38 rows per COVERAGE-DATA-SPEC.md) so no pagination is needed.

#### 4.3.1 Query configuration

```typescript
import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { buildCategoryMetrics, emptyMetrics, type CoverageMetrics, type SourceCoverage } from '@/lib/coverage-utils'

export function useCoverageMetrics() {
  return useQuery<CoverageMetrics>({
    queryKey: ['coverage', 'metrics'],
    queryFn: fetchCoverageMetrics,
    staleTime: 45_000,        // 45 seconds — sources change infrequently
    refetchInterval: 60_000,  // poll every 60 seconds
  })
}
```

- **`queryKey`:** `['coverage', 'metrics']` — namespaced under `coverage` for cache invalidation grouping.
- **`staleTime: 45_000`:** Intel sources change infrequently (configuration data), so a 45-second stale window reduces redundant fetches.
- **`refetchInterval: 60_000`:** Background poll every 60 seconds keeps dashboard current without aggressive polling.
- **`refetchOnWindowFocus`:** Inherits `false` from the `QueryClient` defaults in `query-provider.tsx`.

#### 4.3.2 Query function

```typescript
async function fetchCoverageMetrics(): Promise<CoverageMetrics> {
  const supabase = getSupabaseBrowserClient()

  const { data: sources, error } = await supabase
    .from('intel_sources')
    .select('source_key, name, category, status, coverage')

  if (error) throw error
  if (!sources || sources.length === 0) return emptyMetrics()

  const sourcesByCoverage: SourceCoverage[] = sources.map((s) => ({
    sourceKey: s.source_key,
    name: s.name,
    category: s.category,
    status: s.status,
    geographicCoverage: s.coverage?.geo ?? null,
    updateFrequency: s.coverage?.frequency ?? null,
  }))

  const byCategory = buildCategoryMetrics(sources)

  return {
    totalSources: sources.length,
    activeSources: sources.filter((s) => s.status === 'active').length,
    categoriesCovered: byCategory.length,
    sourcesByCoverage,
    byCategory,
  }
}
```

The Supabase query selects only the 5 columns needed (per COVERAGE-DATA-SPEC.md). No joins, no RPC calls.

#### 4.3.3 Return type

The hook returns `UseQueryResult<CoverageMetrics>`, which provides `data`, `isLoading`, `isError`, `error`, `refetch`, and all standard TanStack Query state fields. Consumers use these to render loading/error/empty/loaded states.

#### 4.3.4 Export

The hook is the default export of the module. The `CoverageMetrics`, `SourceCoverage`, and `CoverageByCategory` types are re-exported from `coverage-utils.ts` for consumer convenience.

---

### 4.4 Create TanStack Query Hook — `src/hooks/use-coverage-map-data.ts`

**Path:** `src/hooks/use-coverage-map-data.ts`

Fetches `intel_normalized` rows that have GeoJSON geometry and transforms them into `MapMarker[]` for map rendering. Supports optional filtering by category, severity, and date range.

#### 4.4.1 Filter interface

```typescript
export interface CoverageMapFilters {
  category?: string
  severity?: string
  startDate?: string   // ISO 8601
  endDate?: string     // ISO 8601
}
```

#### 4.4.2 Query configuration

```typescript
import { useQuery } from '@tanstack/react-query'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { toMarkers, type MapMarker } from '@/lib/coverage-utils'

export function useCoverageMapData(filters?: CoverageMapFilters) {
  return useQuery<MapMarker[]>({
    queryKey: ['coverage', 'map-data', filters],
    queryFn: () => fetchCoverageMapData(filters),
    staleTime: 30_000,        // 30 seconds
    refetchInterval: 30_000,  // poll every 30 seconds
  })
}
```

- **`queryKey`:** `['coverage', 'map-data', filters]` — includes the filter object so TanStack Query automatically refetches when filters change (e.g., when `selectedCategory` changes in the coverage store).
- **`staleTime: 30_000`:** Intel items are ingested continuously, so a shorter stale window than metrics.
- **`refetchInterval: 30_000`:** Matches staleTime for consistent freshness.

#### 4.4.3 Query function

```typescript
async function fetchCoverageMapData(filters?: CoverageMapFilters): Promise<MapMarker[]> {
  const supabase = getSupabaseBrowserClient()

  let query = supabase
    .from('intel_normalized')
    .select('id, title, severity, category, source_id, geo, ingested_at')
    .not('geo', 'is', null)
    .limit(1000)

  if (filters?.category) query = query.eq('category', filters.category)
  if (filters?.severity) query = query.eq('severity', filters.severity)
  if (filters?.startDate) query = query.gte('ingested_at', filters.startDate)
  if (filters?.endDate) query = query.lte('ingested_at', filters.endDate)

  const { data, error } = await query
  if (error) throw error
  if (!data) return []

  return toMarkers(data)
}
```

The `.not('geo', 'is', null)` filter excludes rows without geographic data at the database level, reducing transfer size. The `.limit(1000)` cap prevents unbounded result sets (per COVERAGE-DATA-SPEC.md).

#### 4.4.4 Integration with coverage store

Consumers wire the `selectedCategory` from the coverage store (Deliverable 4.5) into the `filters` parameter:

```typescript
// Example usage in a page or component (WS-2.1 / WS-3.1):
const selectedCategory = useCoverageStore((s) => s.selectedCategory)
const { data: markers = [], isLoading } = useCoverageMapData({
  category: selectedCategory ?? undefined,
})
```

This wiring is out of scope for WS-1.3 but documented here for downstream consumers.

---

### 4.5 Create Zustand Store — `src/stores/coverage.store.ts`

**Path:** `src/stores/coverage.store.ts`

Manages the filter state for the coverage page. Implements Decision 7 (Separate Zustand Store): keeps data filtering separate from morph animation state (`ui.store.ts`). The morph system drives visual transitions; the coverage store drives data queries. Card click triggers both.

#### 4.5.1 State and actions

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface CoverageState {
  /** Currently selected category ID, or null for "all categories". */
  selectedCategory: string | null
}

interface CoverageActions {
  /** Select a category for filtering. Updates URL query parameter. */
  setSelectedCategory: (id: string) => void
  /** Clear category selection (show all). Removes URL query parameter. */
  clearSelection: () => void
}

export type CoverageStore = CoverageState & CoverageActions
```

#### 4.5.2 Store implementation

Follows the pattern established by `ui.store.ts` and `settings.store.ts`: `create<StoreType>()(immer((set) => ({ ... })))`.

```typescript
export const useCoverageStore = create<CoverageStore>()(
  immer((set) => ({
    selectedCategory: null,

    setSelectedCategory: (id) =>
      set((state) => {
        state.selectedCategory = id
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedCategory = null
      }),
  }))
)
```

#### 4.5.3 Selectors

```typescript
export const coverageSelectors = {
  /** Whether any category is currently selected. */
  hasSelection: (state: CoverageStore): boolean => state.selectedCategory !== null,

  /** The selected category ID or null. */
  selectedCategory: (state: CoverageStore): string | null => state.selectedCategory,
} as const
```

#### 4.5.4 URL synchronization

The store provides URL sync via a `syncFromUrl()` initializer and a `syncToUrl()` side effect. The URL parameter name is `?category={id}`, replacing the legacy `?district={id}` parameter.

```typescript
/**
 * Initialize store from URL query parameter.
 * Call once on page mount (e.g., in a useEffect in the page component).
 */
export function syncCoverageFromUrl(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const category = params.get('category')
  if (category) {
    useCoverageStore.getState().setSelectedCategory(category)
  }
}

/**
 * Push current selection to URL query parameter.
 * Call after setSelectedCategory() or clearSelection().
 */
export function syncCoverageToUrl(category: string | null): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (category) {
    url.searchParams.set('category', category)
  } else {
    url.searchParams.delete('category')
  }
  window.history.replaceState({}, '', url.toString())
}
```

URL sync is implemented as standalone functions rather than middleware to keep the store pure and testable. The page component (WS-2.1) wires `syncFromUrl` on mount and subscribes to store changes to call `syncToUrl`.

#### 4.5.5 No persistence middleware

Unlike `settings.store.ts` (which uses `persist` middleware for localStorage), the coverage store does not persist. Category selection is transient within a session and driven by URL parameters. This is intentional: bookmarking `?category=seismic` should work, but localStorage would create stale state conflicts.

---

### 4.6 Integration Verification

This deliverable is not a file but a verification step. After all files above are created:

1. Start the dev server (`pnpm dev`).
2. Open browser DevTools console.
3. Verify `useCoverageMetrics` returns data:
   - If `intel_sources` table has data: `data.totalSources > 0`, `data.byCategory.length > 0`.
   - If `intel_sources` table is empty: `data.totalSources === 0`, no errors.
   - If Supabase is unreachable: `isError === true`, `error` contains a descriptive message.
4. Verify `useCoverageMapData` returns data:
   - If `intel_normalized` table has geo data: `data.length > 0`, each marker has `lat`/`lng`/`title`.
   - If table is empty or has no geo data: `data` is `[]`, no errors.
5. Verify `coverage.store.ts`:
   - `setSelectedCategory('weather')` updates state.
   - `clearSelection()` resets to `null`.
   - URL parameter `?category=weather` is reflected after `syncCoverageToUrl` call.
6. Run `pnpm typecheck` — zero errors.

This verification can be done with a temporary test component or via React DevTools / TanStack Query DevTools.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `src/lib/supabase/types.ts` exports `IntelSourceRow` and `IntelNormalizedRow` interfaces, and the `Database` interface includes `intel_sources` and `intel_normalized` table definitions | Import each type in a scratch file; `pnpm typecheck` passes |
| AC-2 | `src/lib/coverage-utils.ts` exports `buildCategoryMetrics`, `toMarkers`, `calculateBounds`, and `emptyMetrics` functions with correct TypeScript signatures | Import and call each function with mock data in a test; verify return shapes |
| AC-3 | `buildCategoryMetrics([])` returns `[]`; `buildCategoryMetrics(sources)` returns categories sorted by `sourceCount` descending, with `activeSources` counted correctly and `geographicRegions` deduplicated | Unit test with mock `IntelSourceRow[]` data |
| AC-4 | `toMarkers()` filters out rows where `geo` is null or not a Point, correctly flips `[lng, lat]` to `{ lat, lng }`, and maps all fields | Unit test with mixed geo types (Point, Polygon, null) |
| AC-5 | `calculateBounds([])` returns `{ center: [0, 0], zoom: 2 }`; single marker returns center + zoom 8; multiple markers return a bounding box | Unit test with 0, 1, and 3+ markers |
| AC-6 | `useCoverageMetrics()` hook returns `UseQueryResult<CoverageMetrics>` with `queryKey: ['coverage', 'metrics']`, `staleTime: 45_000`, and `refetchInterval: 60_000` | Code review of hook configuration |
| AC-7 | `useCoverageMapData(filters?)` hook returns `UseQueryResult<MapMarker[]>` with `queryKey: ['coverage', 'map-data', filters]`, `staleTime: 30_000`, and `refetchInterval: 30_000` | Code review of hook configuration |
| AC-8 | When `intel_sources` is empty or unreachable, `useCoverageMetrics` returns `emptyMetrics()` (no crash, no unhandled error) | Start dev server with empty Supabase or invalid credentials; verify `data` is the empty metrics object or `isError` is `true` with a descriptive `error` |
| AC-9 | When `intel_normalized` has no geo data, `useCoverageMapData` returns `[]` (no crash) | Query with no matching rows; verify `data` is `[]` |
| AC-10 | `src/stores/coverage.store.ts` exports `useCoverageStore` with `selectedCategory`, `setSelectedCategory()`, `clearSelection()` and `coverageSelectors` | Import and call each action; verify state transitions |
| AC-11 | `syncCoverageFromUrl()` reads `?category=seismic` from the URL and sets `selectedCategory` to `'seismic'` | Call function with URL containing the parameter; verify store state |
| AC-12 | `syncCoverageToUrl('weather')` updates the URL to include `?category=weather`; `syncCoverageToUrl(null)` removes the parameter | Call function; verify `window.location.search` |
| AC-13 | `pnpm typecheck` passes with zero errors after all deliverables are complete | Run `pnpm typecheck` |
| AC-14 | Coverage store uses `immer` middleware, consistent with existing stores (`ui.store.ts`, `settings.store.ts`) | Code review |
| AC-15 | Hook query functions use `getSupabaseBrowserClient()` (not `createSupabaseServerClient()`) since all fetching is client-side | Code review |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Extract `buildCategoryMetrics`, `toMarkers`, `calculateBounds` into a separate `coverage-utils.ts` module rather than inlining in hook files | Pure utility functions are independently testable without React hook wrappers. Multiple consumers (hooks, components, potential future tests) can import them directly. Follows separation of concerns: hooks manage async state, utils manage data transformation. | (a) Inline in hook files — harder to test in isolation, duplicated if both hooks need the same logic; (b) Methods on a class — unnecessary OOP for stateless transforms |
| D-2 | Use `string` (not union types) for `status`, `severity`, and `category` fields in Supabase row types | Database values may include unexpected strings (new categories added to TarvaRI, typos, future status values). Using `string` at the row level avoids runtime type assertion failures. The narrower union types (`SourceStatus`, `SeverityLevel`, `CategoryId`) from WS-1.2's `coverage.ts` are used at the display layer where fallback rendering is controlled. | (a) Use union types in row definitions — would require runtime validation or `as` casts on every query result; (b) Use Zod schemas — adds dependency complexity for a low-risk read-only scenario |
| D-3 | URL sync via standalone `syncCoverageFromUrl` / `syncCoverageToUrl` functions rather than Zustand middleware or `useSearchParams` | Standalone functions keep the store pure and testable without browser globals. `useSearchParams` from Next.js would couple the store to React rendering. Zustand `subscribeWithSelector` middleware adds complexity for a single field. The page component (WS-2.1) orchestrates the sync on mount and on state change. | (a) Zustand `subscribe` middleware with auto-sync — side effects in store make testing harder; (b) Next.js `useSearchParams` — couples store to React/Next.js lifecycle; (c) No URL sync — loses deep-linking capability |
| D-4 | `refetchInterval: 60_000` for metrics, `30_000` for map data | Sources (`intel_sources`) are configuration data that changes infrequently (admin adds/removes feeds). A 60-second poll is sufficient. Intel items (`intel_normalized`) are ingested continuously by TarvaRI workers, so 30 seconds provides better freshness for the map view. Both intervals are well above the `staleTime` to avoid redundant requests. | (a) No polling — stale data until manual refresh; (b) Supabase Realtime subscriptions — adds complexity and a persistent WebSocket connection for a dashboard that tolerates 30-60s latency; (c) Same interval for both — either too aggressive for sources or too stale for intel |
| D-5 | `.limit(1000)` on `intel_normalized` query | Per COVERAGE-DATA-SPEC.md, the map pins query is capped at 1000 rows. This prevents unbounded result sets from overwhelming the browser (memory, rendering). MapLibre can handle 1000+ markers efficiently. If the dataset grows, pagination or server-side clustering can be added later. | (a) No limit — risk of 10k+ rows causing browser slowdown; (b) `.limit(500)` — too restrictive for global coverage; (c) Cursor-based pagination — over-engineering for current data volumes |
| D-6 | No `persist` middleware on coverage store | Category selection is session-transient and driven by URL parameters. Deep-linking via `?category=seismic` is the persistence mechanism. localStorage persistence would create stale state conflicts (user bookmarks one category, localStorage has another). Consistent with how the existing `ui.store.ts` handles `selectedDistrictId` (no persistence). | (a) `persist` middleware with localStorage — stale state conflicts with URL params; (b) `persist` with sessionStorage — slightly better but still conflicts with URL as source of truth |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should `useCoverageMapData` support an `orderBy` parameter (e.g., most recent first), or is the default Supabase ordering sufficient for map pins? | react-developer | Phase 4 (WS-4.1) — defer until map rendering reveals ordering needs |
| OQ-2 | Should `intel_normalized` queries include a default date range filter (e.g., last 7 days) to avoid loading stale historical data, or should all available data be shown? | Planning Agent | Phase 2 (WS-2.1) — depends on how the grid's overview stats should reflect freshness |
| OQ-3 | The `source_id` field in `intel_normalized` is a UUID FK to `intel_sources.id`, but `intel_sources` uses `source_key` (text slug) as its primary identifier. Should the map marker include both `sourceId` (UUID) and the resolved `sourceKey` (slug) for display purposes, or is a join/lookup needed? | react-developer | Phase 3 (WS-3.1) — needed when `CategoryDetailScene` shows source attribution per marker |
| OQ-4 | Should `coverage.store.ts` also hold `selectedSeverity` and `dateRange` filter state for the map, or should those be added in WS-4.1 when the map feature is built? | Planning Agent | Phase 4 (WS-4.1) — defer to avoid speculative state until map UI design is concrete |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Supabase tables (`intel_sources`, `intel_normalized`) do not exist or have a different schema than documented in COVERAGE-DATA-SPEC.md | Medium | High (hooks return errors, blocks downstream) | Both hooks handle errors gracefully: `useCoverageMetrics` returns `emptyMetrics()` on empty data and throws on error (TanStack Query surfaces via `isError`). `useCoverageMapData` returns `[]`. Verify table existence early by running the Supabase queries manually in the Supabase dashboard or via `psql`. If tables are missing, create them using the schema from COVERAGE-DATA-SPEC.md or coordinate with TarvaRI backend. |
| R-2 | `intel_sources.coverage` JSONB shape differs from expected `{ geo, languages, frequency }` structure | Medium | Medium (null/undefined field access in `buildCategoryMetrics`) | All JSONB field access uses optional chaining (`s.coverage?.geo ?? null`). Unknown fields are ignored. Missing fields result in `null` display values rather than crashes. |
| R-3 | `intel_normalized.geo` contains non-Point geometries (LineString, Polygon) that are filtered out, resulting in fewer map markers than expected | Low | Low (reduced map density but no errors) | `toMarkers()` explicitly filters to `geo.type === 'Point'`. Per COVERAGE-DATA-SPEC.md, "most are Point." If non-Point support is needed, it can be added in WS-4.1 (centroid calculation for polygons). |
| R-4 | `pnpm typecheck` fails after extending `Database` interface because the Supabase client infers different column types than documented | Medium | Medium (blocks AC-13) | The Supabase client is not generically typed to the `Database` interface in the current codebase (`getSupabaseBrowserClient()` returns untyped `SupabaseClient`). The row types serve as documentation and are used for explicit type annotations on query results (`const { data } = await supabase.from('intel_sources').select(...) as { data: IntelSourceRow[] | null, error }`). If the client is later typed generically, mismatches will surface as type errors that can be resolved by running `supabase gen types typescript`. |
| R-5 | WS-1.2 (Type Foundation) is not complete when WS-1.3 starts, meaning `coverage.ts` types are not available | Low | High (blocks utility function imports) | The utility functions reference `IntelSourceRow` and `IntelNormalizedRow` from `supabase/types.ts` (created in this workstream), not from `coverage.ts`. The only dependency on WS-1.2 is for `CategoryMeta` lookups in future display logic, which is not needed by the hooks or utils themselves. If WS-1.2 is delayed, WS-1.3 can proceed by defining local interim types. |
| R-6 | TanStack Query `refetchInterval` causes excessive Supabase API calls during development (browser tab left open) | Low | Low (rate limiting, Supabase free tier quota) | `refetchOnWindowFocus: false` is set globally in `query-provider.tsx`. `refetchInterval` only runs while the component is mounted and the tab is active. Development usage is well within Supabase free tier limits (~38 rows per metrics call, ~1000 rows per map call). |
