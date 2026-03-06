# WS-4.1: useThreatPicture Hook

> **Workstream ID:** WS-4.1
> **Phase:** 4 — Geographic Intelligence
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.2, WS-1.1
> **Blocks:** WS-4.3, WS-4.4, WS-4.5
> **Resolves:** None

## 1. Objective

Create a TanStack Query hook (`useThreatPicture`) that fetches aggregated threat intelligence data from `GET /console/threat-picture` and returns a normalized, typed `ThreatPicture` object for consumption by downstream Phase 4 workstreams. The hook provides the data backbone for the geographic summary panel (WS-4.3), trend indicators on category cards (WS-4.4), and the "THREAT PICTURE" entry point in CoverageOverviewStats/NavigationHUD (WS-4.5).

Per AD-8, threat picture data is consumed by the geo summary panel — it is not a standalone dashboard element. This hook is pure data plumbing: it fetches, normalizes (snake_case to camelCase), and caches the response. No UI components. No visual changes.

The `/console/threat-picture` endpoint returns slow-changing aggregated data (counts, distributions, trends computed server-side). A 120-second poll interval reflects this characteristic — significantly slower than the 30-60s intervals used by real-time intel hooks (`useIntelFeed` at 30s, `useCoverageMetrics` at 60s).

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `ThreatPicture` client-side type | camelCase typed interface representing the full response: category counts, severity distribution, priority breakdown, region breakdown, trend direction, generation timestamp. |
| `ApiThreatPictureResponse` type | snake_case interface mirroring the raw JSON from `GET /console/threat-picture`. All string/number fields match the wire format. |
| `ThreatCategoryCount` type | Per-category aggregation: `category`, `count`, `trend` (`'up' \| 'down' \| 'stable'`). |
| `SeverityDistribution` type | Per-severity count: `severity` (reuses `SeverityLevel` from `interfaces/coverage.ts`), `count`, `percentage`. |
| `PriorityBreakdown` type | Per-priority count: `priority` (reuses `OperationalPriority` from WS-0.2), `count`, `percentage`. |
| `RegionBreakdown` type | Per-region aggregation: `region`, `alertCount`, `topCategory`, `trend`. |
| `TrendDirection` type | Union: `'up' \| 'down' \| 'stable'`. Shared by category and region trend fields. |
| `fetchThreatPicture` query function | Calls `tarvariGet<ApiThreatPictureResponse>('/console/threat-picture')`, normalizes the response to `ThreatPicture`. |
| `useThreatPicture` hook | TanStack Query wrapper with `queryKey: ['threat-picture']`, `staleTime: 90_000`, `refetchInterval: 120_000`. |
| `emptyThreatPicture()` utility | Returns a zero-valued `ThreatPicture` for use as a fallback during loading or error states. |
| Type exports | All types exported from the hook file for consumption by WS-4.3, WS-4.4, WS-4.5, WS-4.6. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| GeoSummaryPanel component | WS-4.3 builds the panel; this hook provides one of its data inputs. |
| Trend arrows on CategoryCard | WS-4.4 consumes `ThreatCategoryCount.trend` from this hook. |
| "THREAT PICTURE" button | WS-4.5 adds the entry point; it reads this hook's `isLoading`/`data` for button state. |
| Coverage store extensions | WS-4.6 adds `geoSummaryOpen`, `summaryGeoLevel`, etc. This hook has no store interaction. |
| `useGeoSummaries` hook | WS-4.2 handles the separate `/console/summaries` endpoints. Different data, different poll interval. |
| Region polygon overlays on the map | Deferred per combined-recommendations (after Phase 4 is live). |
| Backend endpoint implementation | Backend Phase D (D.6) builds `GET /console/threat-picture`. This workstream consumes it. |
| Priority normalization (case conversion) | If needed, handled by the same approach established in WS-1.1 D-4 (cast with fallback). |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.2 deliverables | `OperationalPriority` type (`'P1' \| 'P2' \| 'P3' \| 'P4'`) in `src/lib/interfaces/coverage.ts` | Pending (WS-0.2 not yet implemented) |
| WS-1.1 deliverables | Established pattern for API type normalization (snake_case `string \| null` on API types, typed camelCase on client types, `as OperationalPriority` cast in normalizers) | Pending (WS-1.1 not yet implemented) |
| `SeverityLevel` type | `SeverityLevel` union from `src/lib/interfaces/coverage.ts` (line 116): `'Extreme' \| 'Severe' \| 'Moderate' \| 'Minor' \| 'Unknown'` | Available [CODEBASE] |
| `src/lib/tarvari-api.ts` | `tarvariGet<T>(endpoint, params?)` typed fetch wrapper (lines 20-44) | Available [CODEBASE] |
| Backend Phase D (D.6) | `GET /console/threat-picture` endpoint returning aggregated threat data | Pending (backend work, ~7-10 days) |
| Existing hook patterns | `useIntelFeed` (lines 80-87), `useCoverageMetrics` (lines 116-123) — structural patterns for TanStack Query hooks with poll intervals | Available [CODEBASE] |

## 4. Deliverables

### 4.1 Types — `TrendDirection`

**File:** `src/hooks/use-threat-picture.ts`

A union type for directional trend indicators. Shared across category and region breakdowns.

```
type TrendDirection = 'up' | 'down' | 'stable'
```

Exported for use by WS-4.4 (trend arrows on CategoryCard).

---

### 4.2 Types — `ThreatCategoryCount`

**File:** `src/hooks/use-threat-picture.ts`

Per-category aggregation of active threat counts with trend direction.

```
interface ThreatCategoryCount {
  category: string
  count: number
  trend: TrendDirection
}
```

- `category` is a string (not `CategoryId`) to match the existing pattern in `CoverageByCategory` where the category field is `string` and lookup functions like `getCategoryMeta()` handle unknown values.
- `count` is the number of active (non-expired) intel items in the current period.
- `trend` compares current period to previous period (server-computed).

---

### 4.3 Types — `SeverityDistribution`

**File:** `src/hooks/use-threat-picture.ts`

Per-severity breakdown with absolute count and percentage.

```
interface SeverityDistribution {
  severity: SeverityLevel
  count: number
  percentage: number
}
```

- Imports `SeverityLevel` from `@/lib/interfaces/coverage`.
- `percentage` is a 0-100 float computed server-side (avoids client-side rounding inconsistencies).

---

### 4.4 Types — `PriorityBreakdown`

**File:** `src/hooks/use-threat-picture.ts`

Per-priority breakdown with absolute count and percentage.

```
interface PriorityBreakdown {
  priority: OperationalPriority
  count: number
  percentage: number
}
```

- Imports `OperationalPriority` from `@/lib/interfaces/coverage` (WS-0.2 deliverable).
- `percentage` is a 0-100 float computed server-side.

---

### 4.5 Types — `RegionBreakdown`

**File:** `src/hooks/use-threat-picture.ts`

Per-region aggregation. Regions follow the 11 travel-security geographic regions defined in AD-7.

```
interface RegionBreakdown {
  region: string
  alertCount: number
  topCategory: string
  trend: TrendDirection
}
```

- `region` is a string identifier (e.g., `'middle-east'`, `'east-africa'`, `'southeast-asia'`). Not enum-restricted at the hook layer because the region list may evolve on the backend.
- `topCategory` is the category with the highest alert count in that region.
- `trend` indicates whether threat volume in the region is increasing, decreasing, or stable.

---

### 4.6 Types — `ThreatPicture` (composite client-side type)

**File:** `src/hooks/use-threat-picture.ts`

The normalized, camelCase composite type returned by the hook.

```
interface ThreatPicture {
  totalActiveAlerts: number
  byCategory: ThreatCategoryCount[]
  bySeverity: SeverityDistribution[]
  byPriority: PriorityBreakdown[]
  byRegion: RegionBreakdown[]
  overallTrend: TrendDirection
  generatedAt: string   // ISO 8601 UTC
  periodStart: string   // ISO 8601 UTC — start of the current comparison window
  periodEnd: string     // ISO 8601 UTC — end of the current comparison window
}
```

- `byCategory` is sorted by `count` descending (highest-activity categories first), matching the sort convention in `buildCategoryMetrics()` (coverage-utils.ts line 111).
- `byRegion` is sorted by `alertCount` descending (hottest regions first).
- `bySeverity` is ordered by severity level descending (Extreme first), matching the `SEVERITY_LEVELS` constant order.
- `byPriority` is ordered P1 first through P4.
- `generatedAt` is the server timestamp of when the aggregation was computed.
- `periodStart`/`periodEnd` define the time window the backend used for comparison (e.g., last 24 hours vs previous 24 hours). Displayed by WS-4.3 to show data freshness.

---

### 4.7 Types — `ApiThreatPictureResponse` (raw wire type)

**File:** `src/hooks/use-threat-picture.ts`

snake_case interface matching the expected JSON from `GET /console/threat-picture`.

```
interface ApiThreatPictureResponse {
  total_active_alerts: number
  by_category: Array<{
    category: string
    count: number
    trend: string
  }>
  by_severity: Array<{
    severity: string
    count: number
    percentage: number
  }>
  by_priority: Array<{
    priority: string
    count: number
    percentage: number
  }>
  by_region: Array<{
    region: string
    alert_count: number
    top_category: string
    trend: string
  }>
  overall_trend: string
  generated_at: string
  period_start: string
  period_end: string
}
```

**Design note:** All enum-like fields (`trend`, `severity`, `priority`) are typed as `string` on the API type, not as their TypeScript union equivalents. This follows the WS-1.1 D-2 convention: API response types reflect the unvalidated wire format. Type narrowing happens in the normalizer.

---

### 4.8 `fetchThreatPicture` query function

**File:** `src/hooks/use-threat-picture.ts`

```
async function fetchThreatPicture(): Promise<ThreatPicture>
```

Implementation:

1. Call `tarvariGet<ApiThreatPictureResponse>('/console/threat-picture')`.
2. Normalize the response:
   - Map `by_category` entries: pass `category` and `count` through; cast `trend as TrendDirection`.
   - Map `by_severity` entries: cast `severity as SeverityLevel`; pass `count` and `percentage` through.
   - Map `by_priority` entries: cast `priority as OperationalPriority`; pass `count` and `percentage` through.
   - Map `by_region` entries: camelCase `alert_count` to `alertCount`, `top_category` to `topCategory`; cast `trend as TrendDirection`.
   - Map top-level fields: `total_active_alerts` to `totalActiveAlerts`; `overall_trend` cast `as TrendDirection`; `generated_at` to `generatedAt`; `period_start` to `periodStart`; `period_end` to `periodEnd`.

**Design note on type casts:** Follows the WS-1.1 D-4 pattern. The casts (`as TrendDirection`, `as SeverityLevel`, `as OperationalPriority`) are acceptable because:
- The backend is the authoritative source.
- Consuming components handle unknown values gracefully (e.g., `getCategoryMeta()` falls back to 'other', `getPriorityMeta()` falls back to P4).
- Runtime Zod validation is disproportionate for small, well-defined unions and is not the pattern used by any existing normalizer in this codebase.

---

### 4.9 `emptyThreatPicture` utility function

**File:** `src/hooks/use-threat-picture.ts`

```
function emptyThreatPicture(): ThreatPicture
```

Returns a zero-valued `ThreatPicture` for use as a fallback when the query is loading or has errored. Follows the `emptyMetrics()` pattern in `coverage-utils.ts` (line 175).

```
{
  totalActiveAlerts: 0,
  byCategory: [],
  bySeverity: [],
  byPriority: [],
  byRegion: [],
  overallTrend: 'stable',
  generatedAt: '',
  periodStart: '',
  periodEnd: '',
}
```

Exported for use by WS-4.3 and WS-4.5 as default/fallback data.

---

### 4.10 `useThreatPicture` hook

**File:** `src/hooks/use-threat-picture.ts`

```
function useThreatPicture(): UseQueryResult<ThreatPicture>
```

TanStack Query configuration:

| Option | Value | Rationale |
|--------|-------|-----------|
| `queryKey` | `['threat-picture']` | Single-segment key: there are no parameterized variants of this endpoint (unlike `['intel', 'category', id]`). |
| `queryFn` | `fetchThreatPicture` | See deliverable 4.8. |
| `staleTime` | `90_000` (90s) | Data is pre-aggregated and changes slowly. 90s stale time avoids redundant requests when components mount/unmount within the same 2-minute cycle. |
| `refetchInterval` | `120_000` (120s) | Matches the spec (120s poll for slow-changing data). Longest interval of any hook in the codebase, reflecting the aggregate nature of the data. |

The hook re-exports the full `UseQueryResult` shape (`data`, `isLoading`, `isError`, `error`, `refetch`, etc.), consistent with every other data hook in the codebase. Consumers destructure what they need.

**File header:**

```
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
 */
```

---

### 4.11 Summary of all exports

| Export | Type | Consumers |
|--------|------|-----------|
| `TrendDirection` | type | WS-4.4 (trend arrow component), WS-4.3 (panel display), WS-4.6 (store type if needed) |
| `ThreatCategoryCount` | interface | WS-4.4 (drives per-category trend arrows on CategoryCard) |
| `SeverityDistribution` | interface | WS-4.3 (severity chart in geo summary panel) |
| `PriorityBreakdown` | interface | WS-4.3 (priority breakdown in geo summary panel) |
| `RegionBreakdown` | interface | WS-4.3 (region list in geo summary panel), WS-4.5 (region count in button label) |
| `ThreatPicture` | interface | WS-4.3, WS-4.4, WS-4.5 (all consume the composite type) |
| `emptyThreatPicture` | function | WS-4.3, WS-4.5 (fallback during loading/error) |
| `useThreatPicture` | function (hook) | WS-4.3, WS-4.4, WS-4.5 (primary consumers) |

---

### 4.12 New imports required

| Import | From | Reason |
|--------|------|--------|
| `useQuery` | `@tanstack/react-query` | TanStack Query hook wrapper |
| `tarvariGet` | `@/lib/tarvari-api` | API fetch function |
| `type SeverityLevel` | `@/lib/interfaces/coverage` | Severity distribution typing |
| `type OperationalPriority` | `@/lib/interfaces/coverage` | Priority breakdown typing (WS-0.2 deliverable) |

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `useThreatPicture` hook exists at `src/hooks/use-threat-picture.ts` with `'use client'` directive. | File exists; code review. |
| AC-2 | Hook calls `tarvariGet<ApiThreatPictureResponse>('/console/threat-picture')` with no query parameters. | Code review of `fetchThreatPicture`. |
| AC-3 | Hook uses `queryKey: ['threat-picture']`. | Code review; verify no key collisions with existing hooks (none: existing keys are `['coverage', ...]`, `['intel', ...]`, `['bundles', ...]`). |
| AC-4 | `refetchInterval` is `120_000` (120 seconds). | Code review. |
| AC-5 | `staleTime` is `90_000` (90 seconds). | Code review. |
| AC-6 | All snake_case fields from `ApiThreatPictureResponse` are normalized to camelCase on `ThreatPicture`. | Code review; verify field mapping covers all 9 top-level fields plus nested array fields. |
| AC-7 | `TrendDirection` is exported as `'up' \| 'down' \| 'stable'`. | TypeScript compilation rejects non-members; code review. |
| AC-8 | `SeverityDistribution.severity` uses the `SeverityLevel` type from `interfaces/coverage.ts`. | Import statement references the correct type; `pnpm typecheck` passes. |
| AC-9 | `PriorityBreakdown.priority` uses the `OperationalPriority` type from `interfaces/coverage.ts`. | Import statement references the correct type; `pnpm typecheck` passes. |
| AC-10 | `emptyThreatPicture()` returns a valid `ThreatPicture` with zero counts, empty arrays, and `'stable'` trend. | Code review; TypeScript assignability check. |
| AC-11 | `pnpm typecheck` passes with zero errors across the full project after adding the new file. | Run `pnpm typecheck`. |
| AC-12 | `pnpm build` succeeds (no runtime import errors from new imports). | Run `pnpm build`. |
| AC-13 | No existing UI behavior changes — this is a new file with no consumers yet. Existing grid, map, feed, and district views function identically. | Manual smoke test. |
| AC-14 | When `GET /console/threat-picture` is not yet available (404 or network error), the hook enters error state without crashing the application. | Manual test against backend without the endpoint; error boundary does not trigger. |
| AC-15 | When `GET /console/threat-picture` returns an empty or minimal response (e.g., `by_category: []`), the normalizer produces valid `ThreatPicture` with empty arrays (no crash on `.map()` of undefined). | Manual test with mock empty response. |
| AC-16 | All 8 named types/interfaces and 2 functions listed in deliverable 4.11 are exported from the module. | Code review of export statements. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | All types defined in the hook file (`use-threat-picture.ts`), not in `interfaces/coverage.ts`. | Follows the established pattern: `IntelFeedItem` is defined in `use-intel-feed.ts`, `CategoryIntelItem` in `use-category-intel.ts`. Types live with their producing hook. Only shared foundation types (`SeverityLevel`, `OperationalPriority`, `CategoryMeta`) live in `interfaces/`. The threat picture types are consumed by 3 downstream workstreams but are produced by exactly one hook, making colocation appropriate. | Move types to `interfaces/threat-picture.ts` — rejected because no other hook follows this pattern and it would create a file with no logic. Move types to `interfaces/coverage.ts` — rejected because that file is already large (191 lines) and threat picture is a distinct data domain. |
| D-2 | Single `queryKey: ['threat-picture']` without nested segments. | The endpoint takes no parameters. There is no `useThreatPicture(region)` variant — regional data comes from `useGeoSummaries` (WS-4.2). A flat key avoids unnecessary hierarchy. | `['threat', 'picture']` — rejected because it creates a false namespace relationship with non-existent sibling keys. `['coverage', 'threat-picture']` — rejected because threat picture is not a sub-resource of coverage (different endpoint, different data shape). |
| D-3 | `staleTime: 90_000` (90 seconds), not matching `refetchInterval` exactly. | 90s stale time with 120s poll means: if a component unmounts and remounts within 90s, it gets cached data instantly (no loading state flicker). If it remounts after 90s but before 120s, it shows stale data and refetches in the background. This is the same relationship used by `useCoverageMetrics` (45s stale / 60s poll) and `useIntelFeed` (20s stale / 30s poll). | `staleTime: 120_000` (match poll) — rejected because it means data is never considered stale between polls, eliminating background refetch on remount. `staleTime: 60_000` — unnecessarily aggressive for slow-changing data. |
| D-4 | `percentage` fields are numbers (0-100 floats from server), not computed client-side. | Server-side percentage computation avoids floating-point rounding inconsistencies across clients and ensures percentages always sum correctly (the server can adjust). The client renders the number directly (e.g., `42.7%`). | Compute client-side from counts — rejected because multiple components computing percentages independently could show slightly different values due to rounding. Send as 0-1 fraction — rejected because it requires client-side `* 100` formatting; 0-100 is more display-ready. |
| D-5 | `TrendDirection` is a standalone exported type, not inlined in each interface. | Reused by 3 interfaces (`ThreatCategoryCount`, `RegionBreakdown`, `ThreatPicture.overallTrend`) and by WS-4.4's trend arrow component. A named type enables `switch` exhaustiveness checks and shared display logic. | Inline `'up' \| 'down' \| 'stable'` in each field — rejected because it prevents exhaustiveness checking and forces WS-4.4 to re-derive the union. |
| D-6 | `region` field is `string`, not a union of the 11 AD-7 region identifiers. | The region list may evolve on the backend (AD-7 notes "user provided the initial list; IA specialist refined"). Hardcoding 11 values in a frontend union creates a coupling that requires frontend deployment for every backend region change. The `getCategoryMeta()` pattern (string input, fallback for unknown) is the established approach for evolving enums. | `type ThreatRegion = 'middle-east' \| 'east-africa' \| ...` — rejected because it creates a deployment coupling. If a region constant is needed later (e.g., for display labels), it can be added in a follow-up without changing the hook's type. |
| D-7 | Use `as TrendDirection` / `as SeverityLevel` / `as OperationalPriority` casts in the normalizer (no runtime validation). | Follows WS-1.1 D-4 convention. All existing normalizers in this codebase use casts for enum-like fields. Adding Zod runtime validation for this hook alone would be inconsistent and disproportionate. | Zod `.parse()` on the full response — rejected for consistency with existing hooks. `isTrendDirection()` type guard — reasonable but adds ceremony; revisit if data quality issues emerge. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | What is the exact JSON shape of `GET /console/threat-picture`? The API type in deliverable 4.7 is a best-guess based on the combined-recommendations description ("counts by category, severity distribution, priority breakdown, region breakdown, trend direction"). The backend team should confirm field names and nesting before implementation begins. | Backend team | Phase D (before WS-4.1 implementation) |
| OQ-2 | Does `by_severity` include all 5 severity levels even when count is 0, or only levels with non-zero counts? If the backend omits zero-count levels, the frontend normalizer should be resilient (it already is — `.map()` on an array with fewer than 5 elements produces fewer than 5 `SeverityDistribution` entries). However, WS-4.3's severity chart may want to display all 5 levels. Decide whether the backend fills zeros or the frontend does. | Backend team / react-developer | Phase D |
| OQ-3 | Does `by_priority` include all 4 priority levels (P1-P4) even when count is 0? Same question as OQ-2 but for priority. Affects how WS-4.3 renders the priority breakdown. | Backend team / react-developer | Phase D |
| OQ-4 | What time window does the backend use for trend comparison? The SOW assumes the backend exposes `period_start` and `period_end` fields so the frontend can display the comparison window. If the backend uses a fixed window (e.g., always "last 24h vs previous 24h"), the fields are still useful for display ("Data as of ..."). Confirm the backend includes these fields. | Backend team | Phase D |
| OQ-5 | Should the hook accept an optional `enabled` flag (like `useCategoryIntel` which uses `enabled: !!categoryId`)? Currently the threat picture is always fetched when any consumer mounts. If WS-4.5's entry point button is rendered on the main page, the hook would be called on every page load. This is likely acceptable (120s poll, single lightweight GET), but confirm there is no concern about unnecessary requests before the geo summary panel is opened. | react-developer | WS-4.1 implementation |
| OQ-6 | Are the trend direction strings from the backend lowercase (`'up'`, `'down'`, `'stable'`) or could they be capitalized (`'Up'`, `'Down'`, `'Stable'`)? If capitalized, a `.toLowerCase()` normalization step is needed in the normalizer. | Backend team | Phase D |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Backend Phase D (D.6) is not ready when Phase 4 frontend work begins. Combined-recommendations estimates D.6 at 7-10 days into backend work. | High | Medium | Build the hook with the types and normalizer against mock data. The hook file is self-contained (no consumers in WS-4.1). WS-4.3/4.4/4.5 can also be built with `emptyThreatPicture()` as a placeholder. The hook will "just work" when the endpoint lands. |
| R-2 | Actual API response shape differs from the assumed shape in deliverable 4.7. | Medium | Medium | The `ApiThreatPictureResponse` type and normalizer are isolated in a single file. Adjusting field names or nesting is a localized change. No downstream consumers reference API-layer types directly (they consume the normalized `ThreatPicture`). |
| R-3 | WS-0.2 (`OperationalPriority` type) is not implemented when WS-4.1 work begins, blocking the import. | Medium | Low | WS-4.1 is in Phase 4 (days 10-15 in the recommended execution order). WS-0.2 is in Phase 0 (day 1). It is unlikely to still be pending. If blocked, temporarily use `string` for `PriorityBreakdown.priority` and add a `// TODO: WS-0.2` comment, then tighten when WS-0.2 lands. This is the same fallback strategy described in WS-1.1 R-6. |
| R-4 | Backend returns `trend` values outside the `'up' \| 'down' \| 'stable'` union (e.g., `'increasing'`, `'decreasing'`, `null`). | Low | Low | The `as TrendDirection` cast would produce an invalid value at the TypeScript level, but consuming components should use a `switch` with a `default` case that renders the `'stable'` visual treatment. A `null` trend from the backend would require a `?? 'stable'` fallback in the normalizer — add this defensively regardless. |
| R-5 | The 120s poll interval causes the threat picture to feel stale to users who expect real-time updates. | Low | Low | The threat picture is aggregated data, not a live feed. Users who want real-time alert-by-alert updates have `useIntelFeed` (30s) and the P1/P2 push notifications (WS-2.x). The 120s interval is appropriate for a "how does the landscape look?" summary. If users report staleness, the interval can be reduced without any structural changes. |
| R-6 | Query key `['threat-picture']` collides with a future hook. | Very Low | Low | No existing key uses this prefix. The naming convention is consistent (`['intel', ...]`, `['coverage', ...]`, `['bundles', ...]`) and `['threat-picture']` is clearly a distinct namespace. If a parameterized variant is needed later (e.g., `['threat-picture', region]`), TanStack Query's prefix matching with `queryClient.invalidateQueries({ queryKey: ['threat-picture'] })` will correctly invalidate all variants. |
| R-7 | The `percentage` fields from the backend do not sum to exactly 100 due to floating-point arithmetic. | Low | Low | This is a display concern for WS-4.3, not for this hook. The normalizer passes the values through without modification. WS-4.3 can adjust the last percentage to ensure visual totals are correct (standard chart rendering practice). |
