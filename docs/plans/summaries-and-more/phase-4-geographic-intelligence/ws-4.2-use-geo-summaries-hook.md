# WS-4.2: useGeoSummaries Hook

> **Workstream ID:** WS-4.2
> **Phase:** 4 -- Geographic Intelligence
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.2
> **Blocks:** WS-4.3
> **Resolves:** None

## 1. Objective

Create the `useGeoSummaries` TanStack Query hook that fetches periodic geographic threat summaries from two TarvaRI backend endpoints: `GET /console/summaries` (filtered list) and `GET /console/summaries/latest` (most recent for a given scope). This hook is the sole data source for the GeoSummaryPanel (WS-4.3) -- the 560px slide-over that displays hierarchical threat assessments at World, Region, and Country levels per AD-3 and AD-7.

The hook manages two complementary data flows:

1. **Latest summary** -- the primary display path. When the GeoSummaryPanel opens or the user drills down to a new geographic level, the hook fetches the most recent validated summary for that scope via `/console/summaries/latest`. This drives the panel's main content: executive summary text, structured breakdown (threats by category, severity distribution, key events, risk trend, recommendations), generation timestamp, and validation timestamp.

2. **Summary history** -- the secondary path. When the user views the "What's Changed" section or scrolls through previous summaries, the hook fetches filtered summary history via `/console/summaries` with `geo_level`, `geo_key`, and `type` parameters. This supports both hourly deltas and daily comprehensives.

The hook follows the established data hook pattern in this codebase: typed snake_case API response interfaces, normalized camelCase exported types, standalone `queryFn` functions, and exported query key constants for external cache management. It additionally introduces a **parameterized query key** pattern (new to this codebase) because the same hook serves different geographic scopes -- the query key includes the `geoLevel`, `geoKey`, and `type` parameters so that TanStack Query caches each scope independently.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `GeoSummary` interface | Exported camelCase type for a single geographic summary: `id`, `geoLevel`, `geoKey`, `summaryType`, `summaryText`, `structuredBreakdown`, `threatLevel`, `generatedAt`, `validatedAt`. |
| `StructuredBreakdown` interface | Exported type for the parsed JSON breakdown object: `threatsByCategory`, `severityDistribution`, `keyEvents`, `riskTrend`, `recommendations`. |
| `ThreatLevel` type | Union type `'LOW' \| 'MODERATE' \| 'ELEVATED' \| 'HIGH' \| 'CRITICAL'` for the threat level badge in WS-4.3. |
| `GeoLevel` type | Union type `'world' \| 'region' \| 'country'` representing the geographic hierarchy. Reuses the type defined in WS-4.6 coverage store extensions (or defines locally if WS-4.6 is not yet implemented). |
| `ApiGeoSummary` interface | Local snake_case type mirroring the `/console/summaries` response item shape. |
| `ApiSummariesResponse` interface | Local type for the `/console/summaries` list endpoint response envelope. |
| `fetchLatestSummary` query function | Standalone async function calling `tarvariGet<ApiGeoSummary>('/console/summaries/latest', { geo_level, geo_key })` and normalizing the response. |
| `fetchSummaryHistory` query function | Standalone async function calling `tarvariGet<ApiSummariesResponse>('/console/summaries', { geo_level, geo_key, type })` and normalizing the items. |
| `useLatestGeoSummary` hook | Exported TanStack Query hook for the latest summary at a given scope. Conditionally enabled based on `geoLevel` and `geoKey` parameters. Poll interval: 120s (slow-changing data). |
| `useGeoSummaryHistory` hook | Exported TanStack Query hook for summary history at a given scope and type. Conditionally enabled. No polling -- fetched on demand. |
| `GEO_SUMMARY_QUERY_KEYS` constant | Exported query key factory object with `latest(geoLevel, geoKey)` and `history(geoLevel, geoKey, type)` methods for structured key generation and external invalidation. |
| JSDoc documentation | All exports documented with `@see` references to WS-4.3 (panel consumer), WS-4.6 (store extensions), AD-3 (slide-over panel), AD-7 (11-region taxonomy). |

### Out of Scope

| Area | Rationale |
|------|-----------|
| GeoSummaryPanel component | WS-4.3 consumes this hook's output to render the 560px slide-over panel. |
| Trend indicators on CategoryCard | WS-4.4 uses WS-4.1 (`useThreatPicture`) data, not this hook. |
| "THREAT PICTURE" entry point button | WS-4.5 adds the button that opens the panel. This hook provides data, not navigation triggers. |
| Coverage store geo summary state | WS-4.6 adds `geoSummaryOpen`, `summaryGeoLevel`, `summaryGeoKey`, `summaryType` to the store. This hook reads those values as parameters, it does not own them. |
| Backend `/console/summaries` endpoint | Backend Phase D.6 implements the endpoint. This hook consumes it. |
| The 11-region taxonomy definition | AD-7 defines the region list. The hook treats `geoKey` as an opaque string -- the taxonomy is enforced by the backend and displayed by WS-4.3. |
| `useThreatPicture` data | WS-4.1 handles the `/console/threat-picture` endpoint. Geographic summaries and threat picture are distinct data sources that WS-4.3 composes together. |
| Summary generation or validation triggers | The backend generates and validates summaries on its own schedule. This hook is read-only. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.2 deliverables | `SeverityLevel` type (used in `severityDistribution` typing) from `src/lib/interfaces/coverage.ts`. The `OperationalPriority` type is not directly needed here but `SeverityLevel` pattern is referenced for consistency. | Pending (WS-0.2 not yet implemented, but `SeverityLevel` already exists) |
| Backend Phase D.6 | `GET /console/summaries?geo_level=&geo_key=&type=` and `GET /console/summaries/latest?geo_level=&geo_key=` endpoints returning summary objects with `summary_text`, `structured_breakdown` (parsed JSON), `generated_at`, `validated_at`. | Pending (backend work -- estimated 7-10 days into backend delivery) |
| `src/lib/tarvari-api.ts` | `tarvariGet<T>(endpoint, params?)` API client | Available -- reviewed (lines 20-44) |
| `src/hooks/use-intel-feed.ts` | Pattern reference: `'use client'` directive, local `Api*` type, exported normalized type, standalone `queryFn`, exported hook with `queryKey`/`staleTime`/`refetchInterval` | Available -- reviewed |
| `src/hooks/use-coverage-metrics.ts` | Pattern reference: parallel `Promise.all()` fetch pattern (not needed for this hook's initial implementation, but validates the pattern if future extensions compose multiple fetches) | Available -- reviewed |
| `@tanstack/react-query` v5 | `useQuery`, `keepPreviousData` function import for `placeholderData` | Available (`^5.0.0` in `package.json`) |
| AD-3 | Geo summary panel is a 560px slide-over at z-42. Hierarchy: World > Region > Country. Hourly deltas + daily comprehensives. | Confirmed in combined-recommendations.md |
| AD-7 | 11 travel-security geographic regions (not UN M.49). Custom taxonomy. | Confirmed in combined-recommendations.md |
| AD-8 | Threat picture data is consumed by the geo summary panel, not standalone. | Confirmed in combined-recommendations.md |
| WS-4.6 (coverage store) | `summaryGeoLevel`, `summaryGeoKey`, `summaryType` store fields that this hook reads as parameters. If WS-4.6 is not yet implemented, the hook accepts these as direct function arguments instead. | Pending (may be implemented in parallel) |

## 4. Deliverables

### 4.1 File: `src/hooks/use-geo-summaries.ts`

A single new file containing all types, query functions, query key factory, and both hooks. This follows the established pattern where each hook file owns its API and normalized types locally. The file exports two hooks (`useLatestGeoSummary` and `useGeoSummaryHistory`) because they share the same API types and normalization logic, and together form the complete data surface for the GeoSummaryPanel.

### 4.2 `ThreatLevel` (exported type)

A union type for the overall threat assessment level assigned to a geographic scope. These levels map to the badge in the GeoSummaryPanel header (WS-4.3).

```
export type ThreatLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL'
```

**Display mapping (for WS-4.3 reference):**

| Level | Badge Style | Semantic |
|-------|-------------|----------|
| LOW | Muted gray | No significant threats detected |
| MODERATE | Blue | Minor or localized threats |
| ELEVATED | Yellow/amber | Increased threat activity, requires monitoring |
| HIGH | Orange | Significant active threats, heightened risk |
| CRITICAL | Red | Extreme threat level, immediate attention required |

The hook does not assign visual styles to these levels -- that is WS-4.3's responsibility. The type is exported here because WS-4.3 needs it for badge rendering and WS-4.6 may store it.

### 4.3 `GeoLevel` (exported type)

```
export type GeoLevel = 'world' | 'region' | 'country'
```

If WS-4.6 has already defined this type in the coverage store, this hook imports it from there instead of redeclaring. If WS-4.6 is not yet implemented, the hook defines it locally and adds a `// TODO: Move to shared types or import from coverage store when WS-4.6 lands` comment.

**Hierarchy semantics per AD-7:**

| Level | `geoKey` examples | Description |
|-------|-------------------|-------------|
| `'world'` | `'world'` | Global aggregate. Only one key. |
| `'region'` | `'middle-east'`, `'western-europe'`, `'east-southeast-asia'` | One of the 11 travel-security regions per AD-7. |
| `'country'` | `'TR'`, `'FR'`, `'JP'` | ISO 3166-1 alpha-2 country code. |

### 4.4 `StructuredBreakdown` (exported interface)

The parsed JSON object containing the quantitative and qualitative breakdown of a geographic summary. The backend stores this as a JSON column and returns it as a parsed object (Assumption #4 from combined-recommendations).

```
export interface StructuredBreakdown {
  /** Alert counts keyed by category ID (e.g., { seismic: 12, conflict: 5 }). */
  threatsByCategory: Record<string, number>
  /** Alert counts keyed by severity level (e.g., { Extreme: 2, Severe: 5, Moderate: 15 }). */
  severityDistribution: Record<string, number>
  /** Notable events within the summary period. Ordered by significance. */
  keyEvents: KeyEvent[]
  /** Directional risk trend compared to the previous period. */
  riskTrend: RiskTrend
  /** Actionable recommendations for the geographic scope. */
  recommendations: string[]
}
```

**Supporting types:**

```
export interface KeyEvent {
  /** Brief title or headline of the event. */
  title: string
  /** Category of the event (e.g., 'conflict', 'weather'). */
  category: string
  /** Severity of the event. */
  severity: string
  /** ISO 8601 timestamp of when the event occurred or was reported. */
  timestamp: string
}

export type RiskTrend = 'increasing' | 'stable' | 'decreasing'
```

**Design notes:**

- `threatsByCategory` uses `Record<string, number>` rather than an array of objects. This mirrors how the backend stores it (a simple JSON object with category keys) and makes lookup by category ID O(1) for WS-4.3's mini-chart rendering.
- `severityDistribution` uses `Record<string, number>` keyed by severity label strings (matching `SeverityLevel` values) rather than a formal `Record<SeverityLevel, number>`. This avoids a strict dependency on every severity level being present -- the backend may omit levels with zero counts.
- `keyEvents` is an ordered array because significance ordering is determined by the backend's summary generation logic. The hook preserves backend order.
- `recommendations` is a simple string array. Each string is a standalone recommendation sentence. The backend formats these for display.

### 4.5 `GeoSummary` (exported interface)

The normalized camelCase type exported for consumption by WS-4.3.

```
export interface GeoSummary {
  /** Unique identifier for this summary. */
  id: string
  /** Geographic hierarchy level of this summary. */
  geoLevel: GeoLevel
  /** Geographic scope key (e.g., 'world', 'middle-east', 'TR'). */
  geoKey: string
  /** Summary type: 'hourly' for delta updates, 'daily' for comprehensive briefs. */
  summaryType: 'hourly' | 'daily'
  /** Overall threat assessment level for this geographic scope. */
  threatLevel: ThreatLevel
  /** Narrative summary text -- the executive brief. */
  summaryText: string
  /** Quantitative and qualitative breakdown of the threat landscape. */
  structuredBreakdown: StructuredBreakdown
  /** ISO 8601 timestamp of when this summary was generated by the AI pipeline. */
  generatedAt: string
  /** ISO 8601 timestamp of when a human analyst validated this summary. Null if not yet validated. */
  validatedAt: string | null
}
```

**Key design decisions:**

- `summaryType` is typed as `'hourly' | 'daily'` rather than a generic string, matching the combined-recommendations specification. If the backend introduces additional types in the future, the union can be extended.
- `validatedAt` is nullable. A summary may be generated but awaiting human review. WS-4.3 should display a "pending validation" indicator when this is null.
- `threatLevel` is a first-class field (not buried in `structuredBreakdown`) because it drives the most prominent visual element in WS-4.3 -- the threat level badge in the panel header.

### 4.6 `ApiGeoSummary` (local interface)

The snake_case type mirroring the backend response shape for a single summary object.

```
interface ApiGeoSummary {
  id: string
  geo_level: string
  geo_key: string
  summary_type: string
  threat_level: string
  summary_text: string
  structured_breakdown: ApiStructuredBreakdown
  generated_at: string
  validated_at: string | null
}
```

**Supporting API types:**

```
interface ApiStructuredBreakdown {
  threats_by_category: Record<string, number>
  severity_distribution: Record<string, number>
  key_events: ApiKeyEvent[]
  risk_trend: string
  recommendations: string[]
}

interface ApiKeyEvent {
  title: string
  category: string
  severity: string
  timestamp: string
}
```

**Design note on `structured_breakdown`:** Assumption #4 from the combined-recommendations states that the backend returns `structured_breakdown` as parsed JSON (not a JSON string). If the backend returns it as a string, the normalizer must `JSON.parse()` it. The hook includes a defensive check for this case (see Deliverable 4.9, normalizer logic).

### 4.7 `ApiSummariesResponse` (local interface)

The response envelope for the `/console/summaries` list endpoint.

```
interface ApiSummariesResponse {
  items: ApiGeoSummary[]
  total_count: number
}
```

The list endpoint returns multiple summaries matching the filter criteria, wrapped in the standard `items` + `total_count` envelope used by other console endpoints (`/console/intel`, `/console/priority-feed`).

### 4.8 `GEO_SUMMARY_QUERY_KEYS` (exported constant)

A query key factory object that generates structured, parameterized query keys. This is a new pattern in the codebase -- existing hooks use simple constant arrays (e.g., `['intel', 'feed']`, `['priority', 'feed']`). Geographic summaries require parameterized keys because the same hook serves different scopes, and TanStack Query must cache each scope independently.

```
export const GEO_SUMMARY_QUERY_KEYS = {
  all: ['geo-summary'] as const,
  latest: (geoLevel: GeoLevel, geoKey: string) =>
    ['geo-summary', 'latest', geoLevel, geoKey] as const,
  history: (geoLevel: GeoLevel, geoKey: string, type: 'hourly' | 'daily') =>
    ['geo-summary', 'history', geoLevel, geoKey, type] as const,
} as const
```

**Query key design rationale:**

- The `all` key (`['geo-summary']`) enables invalidating all geo summary caches at once (e.g., when the backend reports a bulk summary regeneration).
- The `latest` key includes `geoLevel` and `geoKey` but not `type` because the `/console/summaries/latest` endpoint returns the most recent summary regardless of type (it returns whichever is newer -- hourly or daily).
- The `history` key includes `type` because the `/console/summaries` list endpoint filters by `type` and the results are distinct per type.
- The namespace `'geo-summary'` is distinct from both `'intel'` and `'priority'` to prevent prefix-match cross-invalidation.

**External invalidation use cases:**

| Scenario | Key to invalidate | Effect |
|----------|-------------------|--------|
| User drills into a new region | No invalidation needed -- new key triggers fresh fetch | New cache entry |
| Backend publishes new summary | `GEO_SUMMARY_QUERY_KEYS.all` | Refreshes all cached scopes |
| Panel close + reopen at same scope | No invalidation -- cached data served from staleTime window | Instant render |

### 4.9 `normalizeGeoSummary` (local function)

A normalization function that converts a single `ApiGeoSummary` to a `GeoSummary`. Extracted as a named function because both `fetchLatestSummary` and `fetchSummaryHistory` use it.

```
function normalizeGeoSummary(api: ApiGeoSummary): GeoSummary
```

**Normalizer mapping (per field):**

| API field (snake_case) | Normalized field (camelCase) | Transformation |
|------------------------|------------------------------|----------------|
| `id` | `id` | Pass-through |
| `geo_level` | `geoLevel` | Cast `as GeoLevel` -- validated by backend |
| `geo_key` | `geoKey` | Pass-through |
| `summary_type` | `summaryType` | Cast `as 'hourly' \| 'daily'` |
| `threat_level` | `threatLevel` | Cast `as ThreatLevel` -- validated by backend |
| `summary_text` | `summaryText` | Pass-through |
| `structured_breakdown` | `structuredBreakdown` | Normalize nested object (see below) |
| `generated_at` | `generatedAt` | Pass-through |
| `validated_at` | `validatedAt` | Pass-through (preserves null) |

**Nested `structured_breakdown` normalization:**

| API field (snake_case) | Normalized field (camelCase) | Transformation |
|------------------------|------------------------------|----------------|
| `threats_by_category` | `threatsByCategory` | Pass-through (already `Record<string, number>`) |
| `severity_distribution` | `severityDistribution` | Pass-through (already `Record<string, number>`) |
| `key_events` | `keyEvents` | Map each `ApiKeyEvent` -- all fields are already camelCase-compatible pass-throughs |
| `risk_trend` | `riskTrend` | Cast `as RiskTrend` |
| `recommendations` | `recommendations` | Pass-through (already `string[]`) |

**Defensive `structured_breakdown` parsing:**

If the backend returns `structured_breakdown` as a JSON string instead of a parsed object (contrary to Assumption #4), the normalizer applies `JSON.parse()`:

```
const breakdown = typeof api.structured_breakdown === 'string'
  ? JSON.parse(api.structured_breakdown) as ApiStructuredBreakdown
  : api.structured_breakdown
```

This is a defensive check, not an expected path. If triggered, it should log a console warning so the discrepancy between Assumption #4 and reality is visible during integration.

### 4.10 `fetchLatestSummary` (standalone query function)

```
async function fetchLatestSummary(
  geoLevel: GeoLevel,
  geoKey: string,
): Promise<GeoSummary>
```

Implementation:

1. Call `tarvariGet<ApiGeoSummary>('/console/summaries/latest', { geo_level: geoLevel, geo_key: geoKey })`.
2. Normalize the response with `normalizeGeoSummary()`.
3. Return the normalized `GeoSummary`.

**Error handling:** If the endpoint returns a 404 (no summary exists for this scope), `tarvariGet` throws an `Error` with `TarvaRI API 404: ...`. The hook's `queryFn` does not catch this -- TanStack Query surfaces it via `error` state, which WS-4.3 renders as "No summary available for this region." This is the expected empty state, not an application error.

### 4.11 `fetchSummaryHistory` (standalone query function)

```
async function fetchSummaryHistory(
  geoLevel: GeoLevel,
  geoKey: string,
  type: 'hourly' | 'daily',
): Promise<GeoSummary[]>
```

Implementation:

1. Call `tarvariGet<ApiSummariesResponse>('/console/summaries', { geo_level: geoLevel, geo_key: geoKey, type })`.
2. Map `data.items` through `normalizeGeoSummary()`.
3. Return the normalized array.

**Note:** The endpoint returns items in reverse chronological order (most recent first). The hook preserves backend order, consistent with Decision D-9 from WS-2.1 (trust backend sort order).

### 4.12 `useLatestGeoSummary` (exported hook)

The primary data hook for the GeoSummaryPanel's main content.

```
export function useLatestGeoSummary(
  geoLevel: GeoLevel | null,
  geoKey: string | null,
): UseQueryResult<GeoSummary>
```

TanStack Query configuration:

| Option | Value | Rationale |
|--------|-------|-----------|
| `queryKey` | `GEO_SUMMARY_QUERY_KEYS.latest(geoLevel!, geoKey!)` | Parameterized per scope. `!` assertions are safe because the key is only computed when `enabled` is `true` (both params non-null). |
| `queryFn` | `() => fetchLatestSummary(geoLevel!, geoKey!)` | Closure captures the validated parameters. |
| `enabled` | `geoLevel != null && geoKey != null` | Prevents fetching when the panel is closed or no scope is selected. This is the same conditional-enable pattern used by `useCategoryIntel` (which gates on `categoryId`). |
| `staleTime` | `60_000` (60 seconds) | Summaries update at most once per hour (hourly deltas). 60s staleTime allows instant render when drilling back to a recently viewed scope while still picking up new summaries within a reasonable window. |
| `refetchInterval` | `120_000` (120 seconds) | Matches the combined-recommendations specification for slow-changing data. The panel polls for new summaries every 2 minutes while open. When the panel is closed (`enabled: false`), polling stops automatically. |
| `placeholderData` | `keepPreviousData` | When the user drills from one scope to another (e.g., World to Middle East), the panel shows the previous scope's data briefly while the new scope loads. This prevents a flash of empty state during the transition. |
| `refetchOnWindowFocus` | `true` (default) | User returning to tab should get fresh summary data. |
| `retry` | `1` | Summaries are non-critical informational data. A single retry is sufficient. 404 responses (no summary for this scope) should not trigger excessive retries. |

**Parameter null-safety:** The hook accepts `null` for both `geoLevel` and `geoKey` to support the closed-panel state where no scope is selected. When either is null, `enabled: false` prevents any fetch. This pattern avoids the need for the calling component to conditionally render the hook.

### 4.13 `useGeoSummaryHistory` (exported hook)

The secondary data hook for the "What's Changed" section and summary history browsing.

```
export function useGeoSummaryHistory(
  geoLevel: GeoLevel | null,
  geoKey: string | null,
  type: 'hourly' | 'daily' | null,
): UseQueryResult<GeoSummary[]>
```

TanStack Query configuration:

| Option | Value | Rationale |
|--------|-------|-----------|
| `queryKey` | `GEO_SUMMARY_QUERY_KEYS.history(geoLevel!, geoKey!, type!)` | Parameterized per scope and type. |
| `queryFn` | `() => fetchSummaryHistory(geoLevel!, geoKey!, type!)` | Closure captures validated parameters. |
| `enabled` | `geoLevel != null && geoKey != null && type != null` | All three parameters required. Prevents fetch when the history section is collapsed or no type is selected. |
| `staleTime` | `120_000` (120 seconds) | History changes less frequently than the latest summary. 2-minute staleTime is appropriate. |
| `refetchInterval` | `false` (no polling) | History is fetched on demand when the user opens the "What's Changed" section or switches between hourly/daily tabs. No background polling for historical data. |
| `placeholderData` | `keepPreviousData` | Smooth transition when switching between hourly and daily history views. |
| `retry` | `1` | Single retry, same rationale as `useLatestGeoSummary`. |

**No polling rationale:** Unlike `useLatestGeoSummary` (which polls to detect new summaries), the history endpoint returns historical data that does not change once generated. The only scenario where history data changes is when a new summary is generated and appended -- but the latest-summary hook's polling already detects that event, and WS-4.3 can trigger a history refetch when it observes a new `generatedAt` timestamp on the latest summary.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `useLatestGeoSummary` returns a `UseQueryResult<GeoSummary>` with all fields defined in Deliverable 4.5 (`id`, `geoLevel`, `geoKey`, `summaryType`, `threatLevel`, `summaryText`, `structuredBreakdown`, `generatedAt`, `validatedAt`). | `pnpm typecheck` -- verify type assignment; unit test asserting return shape against mock data. |
| AC-2 | `useGeoSummaryHistory` returns a `UseQueryResult<GeoSummary[]>` with items matching the same `GeoSummary` shape. | `pnpm typecheck`; unit test asserting array item shape. |
| AC-3 | `useLatestGeoSummary(null, null)` does not trigger a network request (`enabled: false`). | Unit test with `vi.fn()` spy on `tarvariGet` verifying zero calls. |
| AC-4 | `useLatestGeoSummary('region', 'middle-east')` calls `tarvariGet('/console/summaries/latest', { geo_level: 'region', geo_key: 'middle-east' })`. | Unit test with mock `tarvariGet` asserting endpoint and params. |
| AC-5 | `useGeoSummaryHistory('region', 'middle-east', 'hourly')` calls `tarvariGet('/console/summaries', { geo_level: 'region', geo_key: 'middle-east', type: 'hourly' })`. | Unit test with mock `tarvariGet` asserting endpoint and params. |
| AC-6 | `GeoSummary.structuredBreakdown` contains all five sections: `threatsByCategory`, `severityDistribution`, `keyEvents`, `riskTrend`, `recommendations`. | `pnpm typecheck` -- verify type structure; unit test asserting each field is present in normalized output. |
| AC-7 | The normalizer handles `structured_breakdown` as both a parsed JSON object and a JSON string (defensive parsing per Deliverable 4.9). | Unit test: provide mock response with `structured_breakdown` as a string, verify normalized output matches expected shape. Verify console warning is emitted. |
| AC-8 | `GEO_SUMMARY_QUERY_KEYS.latest('world', 'world')` returns `['geo-summary', 'latest', 'world', 'world']`. | Unit test asserting key factory output. |
| AC-9 | `GEO_SUMMARY_QUERY_KEYS.history('region', 'middle-east', 'daily')` returns `['geo-summary', 'history', 'region', 'middle-east', 'daily']`. | Unit test asserting key factory output. |
| AC-10 | `useLatestGeoSummary` polls at 120-second intervals (`refetchInterval: 120_000`). | Code review; integration test with `vi.useFakeTimers()` verifying refetch trigger. |
| AC-11 | `useGeoSummaryHistory` does not poll (`refetchInterval: false`). | Code review; integration test verifying no automatic refetch after initial fetch. |
| AC-12 | Both hooks use `placeholderData: keepPreviousData` to prevent content flash during scope transitions. | Code review of hook configuration. |
| AC-13 | `GeoSummary.validatedAt` is `string | null`. When the API returns `null`, the normalized field is `null` (not `undefined`). | Unit test with `validated_at: null` in mock response. |
| AC-14 | External cache invalidation works: calling `queryClient.invalidateQueries({ queryKey: GEO_SUMMARY_QUERY_KEYS.all })` triggers refetch of all cached geo summary queries. | Integration test using `@tanstack/react-query`'s `QueryClient` and `vi.fn()` spy. |
| AC-15 | `pnpm typecheck` passes with zero errors across the full project after adding the new file. | Run `pnpm typecheck`. |
| AC-16 | `pnpm build` succeeds. | Run `pnpm build`. |
| AC-17 | The file begins with `'use client'` directive (required for hooks using `useQuery` in Next.js App Router). | Code review. |
| AC-18 | All exports have JSDoc documentation with `@see` references to consuming workstreams (WS-4.3) and architecture decisions (AD-3, AD-7, AD-8). | Code review. |
| AC-19 | `ThreatLevel`, `GeoLevel`, `StructuredBreakdown`, `GeoSummary`, `RiskTrend`, and `KeyEvent` are all exported for consumption by WS-4.3. | `pnpm typecheck` -- import all types in a test file and verify. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Two hooks (`useLatestGeoSummary` + `useGeoSummaryHistory`) in one file rather than a single combined hook. | The two endpoints serve different use cases with different caching strategies: the latest summary polls at 120s for ambient freshness, while the history is fetched on demand without polling. Combining them into one hook would conflate these concerns and force both to use the same polling/caching configuration. Separate hooks allow WS-4.3 to mount `useGeoSummaryHistory` only when the "What's Changed" section is expanded, avoiding unnecessary fetches. | Single `useGeoSummaries` hook with a `mode` parameter: rejected because caching behavior (poll vs. on-demand) should not be controlled by a runtime flag -- it is a fundamental design choice. Two separate files: rejected because the shared types and normalizer logic justify co-location. |
| D-2 | Use a query key factory object (`GEO_SUMMARY_QUERY_KEYS`) rather than simple constant arrays. | Geographic summaries are the first parameterized data source in this codebase. Simple constant arrays (`['geo-summary', 'latest']`) cannot encode the scope parameters needed for per-scope caching. The factory pattern (`GEO_SUMMARY_QUERY_KEYS.latest(level, key)`) generates structured keys that TanStack Query uses for independent cache management per scope. The `all` key enables bulk invalidation. This pattern is documented in TanStack Query best practices and is well-established in the ecosystem. | Flat constants with manual array construction in each hook: rejected because it scatters key assembly logic and makes bulk invalidation fragile. Dynamic keys without a factory: rejected because it lacks the `all` key for cross-scope invalidation. |
| D-3 | Accept `null` parameters on both hooks (conditional enable) rather than requiring the caller to conditionally render the hook. | React hooks cannot be called conditionally (Rules of Hooks). By accepting `null` parameters and using `enabled: false` when any required param is null, the hook can be called unconditionally in the component tree. This matches the `useCategoryIntel` pattern in the existing codebase. The alternative -- using a wrapper component that conditionally renders -- adds unnecessary nesting in WS-4.3. | Wrapper component pattern: rejected because it adds a component boundary that complicates WS-4.3's layout. `enabled: !!geoLevel` without null params: rejected because it loses type safety on the parameter values when enabled. |
| D-4 | `staleTime: 60_000` for latest, `staleTime: 120_000` for history. | Summaries are generated at most hourly. The latest-summary hook uses a 60s staleTime to balance freshness against unnecessary refetches when the user navigates back to a recently viewed scope. The history hook uses 120s because historical data is even more stable -- once generated, a summary's content does not change. Both values are well below the generation cadence, ensuring new summaries are detected promptly. | `staleTime: 0`: would refetch on every component mount, wasting bandwidth for data that changes at most hourly. `staleTime: 300_000` (5 min): too aggressive -- a new hourly summary could be missed for up to 5 minutes after generation. |
| D-5 | `refetchInterval: 120_000` for latest, `false` for history. | The latest-summary hook needs ambient polling because the panel may be open while a new summary is generated. 120s matches the combined-recommendations specification for slow-changing data. The history hook does not poll because historical data is append-only -- WS-4.3 can trigger a manual refetch when it detects a new summary via the latest hook. | Equal polling for both: rejected because history polling wastes bandwidth for data that only grows when a new summary arrives, which the latest hook already detects. Longer polling (300s): risks missing a summary update for too long when the panel is actively open. |
| D-6 | Export `StructuredBreakdown`, `KeyEvent`, `RiskTrend`, and `ThreatLevel` as standalone types rather than inline in `GeoSummary`. | WS-4.3 needs to reference these types independently for sub-component props: the threats-by-category mini-chart receives `threatsByCategory`, the severity bar receives `severityDistribution`, the key events list receives `keyEvents[]`, and the trend arrow receives `riskTrend`. Inlining all of these inside `GeoSummary` would force WS-4.3 to destructure deeply nested types or re-declare them. | Inline all as nested `GeoSummary['structuredBreakdown']['threatsByCategory']` paths: rejected because it makes WS-4.3 component prop types verbose and hard to read. Single flat interface with all fields promoted to top level: rejected because the structured breakdown is a distinct conceptual unit generated by the backend as a single JSON object. |
| D-7 | Defensive `JSON.parse()` for `structured_breakdown` with console warning. | Assumption #4 states the backend returns parsed JSON. The defensive check guards against the common backend pattern of returning JSONB columns as strings in some serialization contexts (e.g., certain PostgreSQL client configurations). The console warning makes the assumption violation visible during integration without silently accepting incorrect behavior. | Trust Assumption #4 entirely (no defensive check): rejected because this is the first hook consuming a JSON-typed column, and the serialization behavior has not been verified. Always `JSON.parse()`: rejected because double-parsing an already-parsed object throws a runtime error. |
| D-8 | Treat 404 on `/console/summaries/latest` as an expected empty state, not an application error. | Not all geographic scopes will have summaries, especially during initial deployment. A country-level summary may not exist until the backend has processed sufficient intel for that country. TanStack Query surfaces the 404 via `error` state, which WS-4.3 can render as a "No summary available" message. Swallowing the 404 in the hook (returning `null`) would lose the error information. | Catch 404 and return `null` (change return type to `GeoSummary \| null`): rejected because it conflates "no data available" with "data not yet loaded" -- `useQuery`'s existing `error` vs. `data: undefined` states handle this distinction correctly. Catch 404 and return empty object: rejected because a partial `GeoSummary` would violate the type contract. |
| D-9 | `retry: 1` for both hooks. | Summaries are informational, non-critical data. Unlike the priority feed (which has protective intelligence urgency), a failed summary fetch can be retried manually by the user closing and reopening the panel. A single retry handles transient network errors without hammering the backend on genuine 404s or 500s. | Default `retry: 3` (TanStack Query default): excessive for 404s on scopes without summaries -- would cause three unnecessary retries each time. `retry: 0`: too aggressive -- a single transient network blip would show an error that disappears on manual retry. |
| D-10 | `keyEvents` uses `KeyEvent[]` (custom interface) rather than a generic `Record<string, unknown>[]`. | The combined-recommendations describe key events with specific fields (title, category, severity, timestamp). Typing these explicitly enables WS-4.3 to render event lists without runtime field existence checks. The backend's summary generation pipeline produces structured output, so the field contract is stable. | `Record<string, unknown>[]`: rejected because it forces runtime validation on every render. `string[]` (just event titles): rejected because WS-4.3 needs category and severity for visual treatment (category icon, severity color). |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Does the `/console/summaries/latest` endpoint return a single summary object directly, or wrap it in an `{ item: ... }` envelope? The SOW assumes a direct object response (not wrapped) for the latest endpoint, vs. the `{ items: [...], total_count }` envelope for the list endpoint. This affects the `tarvariGet` type parameter. | Backend team | Phase 4 (before implementation) |
| OQ-2 | What happens when `/console/summaries/latest` is called for a scope with no summaries? Does it return 404, 200 with `null`, or 200 with an empty object? Decision D-8 assumes 404. | Backend team | Phase 4 (before implementation) |
| OQ-3 | Does `/console/summaries` accept pagination parameters (`limit`, `offset`)? If the history grows large, the hook may need to limit the initial fetch and support "load more" behavior. The SOW assumes the endpoint returns a reasonably bounded set (e.g., last 24 hourly summaries or last 30 daily summaries). | Backend team | Phase 4 (before implementation) |
| OQ-4 | Does the `key_events` array in `structured_breakdown` include a stable `id` field for React list rendering keys? If not, WS-4.3 will need to use `index` as the key or generate a composite key from `title + timestamp`. | Backend team | Phase 4 (can be addressed during WS-4.3 implementation) |
| OQ-5 | Are the `geo_key` values for regions (e.g., `'middle-east'`, `'western-europe'`) finalized, or will they be slugified differently (e.g., `'MIDDLE_EAST'`, `'middle_east'`)? The hook treats `geoKey` as an opaque string, so this only matters for WS-4.3's display mapping and WS-4.6's store initialization. | Backend team / IA | Phase 4 (before WS-4.3 implementation) |
| OQ-6 | Should `useLatestGeoSummary` automatically open with `geoLevel: 'world', geoKey: 'world'` when the panel opens, or does WS-4.6's store handle this default? The hook is passive -- it fetches based on provided parameters. The question is whether the default scope initialization belongs in the store (WS-4.6) or the panel component (WS-4.3). | react-developer | Phase 4 (WS-4.3 / WS-4.6 implementation) |
| OQ-7 | Does the backend enforce that `threat_level` values are exactly `'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL'`, or could unknown values appear? If unknown values are possible, the normalizer should include a fallback (e.g., default to `'MODERATE'`) rather than casting blindly. | Backend team | Phase 4 (before implementation) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Backend Phase D.6 (`/console/summaries` endpoints) is not available when frontend work begins. | High | Low | The hook can be built and tested with MSW (Mock Service Worker) or hardcoded mock `queryFn` functions during development. The `tarvariGet` pattern is a standard fetch -- switching from mock to real endpoint requires no structural changes. Combined-recommendations identifies Phase D as 7-10 days into backend work, confirming this is the last backend phase to land. All acceptance criteria can be verified with mocks. |
| R-2 | Backend returns `structured_breakdown` as a JSON string instead of a parsed object (contrary to Assumption #4). | Medium | Low | Defensive `JSON.parse()` in the normalizer (Deliverable 4.9) handles this case transparently. A console warning alerts developers during integration so the backend team can fix the serialization if it is unintentional. |
| R-3 | The 11 travel-security regions (AD-7) change after the hook is implemented, invalidating cached `geoKey` values. | Low | Low | The hook treats `geoKey` as an opaque string -- no region taxonomy is hardcoded. Region changes require only backend updates and WS-4.3 display label changes. The hook itself is unaffected. |
| R-4 | The `/console/summaries/latest` endpoint returns a different response shape than assumed (e.g., wrapped in an envelope, or returning an array instead of a single object). | Medium | Medium | The normalizer is a simple mapping function. If the response shape differs, only the `fetchLatestSummary` function needs adjustment -- the `normalizeGeoSummary` function and all exported types remain stable. OQ-1 tracks this question for pre-implementation resolution. |
| R-5 | WS-4.6 (coverage store extensions) is not implemented when WS-4.2 work begins, leaving `GeoLevel` type undefined in the store. | Medium | Low | The hook defines `GeoLevel` locally with a `// TODO` comment for future import alignment. When WS-4.6 lands, the local type is removed and the import is added. The type is a simple 3-member union -- no divergence risk. |
| R-6 | The `staleTime` (60s) and `refetchInterval` (120s) for `useLatestGeoSummary` cause the panel to show a stale summary for up to 2 minutes after a new one is generated. | Low | Low | For hourly summaries, a 2-minute maximum staleness is negligible relative to the generation cadence. If near-real-time summary delivery is needed in the future, a Supabase Realtime subscription (similar to WS-2.4's pattern) can invalidate the cache on new summary INSERT events, reducing latency to seconds. |
| R-7 | Large `structured_breakdown` payloads (many key events, long recommendation lists) cause slow normalization or large memory usage. | Very Low | Low | The normalizer performs O(n) mapping with no heavy computation. Even a structured breakdown with 50 key events and 20 recommendations would normalize in sub-millisecond time. If payload size becomes a concern, the backend should paginate or truncate -- this is a backend optimization, not a frontend concern. |
| R-8 | Parameterized query keys cause cache fragmentation -- many scope-specific cache entries accumulate as the user drills through regions and countries. | Low | Low | TanStack Query's garbage collection removes inactive cache entries after `gcTime` (default 5 minutes). A user browsing 11 regions and 50 countries would accumulate ~61 cache entries of modest size (~2-5KB each), well within acceptable memory bounds. If needed, `gcTime` can be reduced on these queries. |
| R-9 | `keepPreviousData` causes the panel to briefly show the old scope's summary when drilling to a new scope, which may confuse users who expect an immediate loading state. | Low | Medium | This is a UX tradeoff. WS-4.3 should display a subtle indicator (e.g., a loading shimmer overlay on the content area) when `isFetching && isPlaceholderData` to signal that the displayed data is from the previous scope. The benefit (no content flash) outweighs the cost (brief stale display) because the breadcrumb navigation already updates immediately, providing context for the transition. |
