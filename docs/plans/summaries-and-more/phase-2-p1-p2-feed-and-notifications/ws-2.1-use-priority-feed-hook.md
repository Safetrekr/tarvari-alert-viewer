# WS-2.1: usePriorityFeed Hook

> **Workstream ID:** WS-2.1
> **Phase:** 2 — P1/P2 Feed & Real-Time Notifications
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.2, WS-1.1
> **Blocks:** WS-2.2, WS-2.3
> **Resolves:** None

## 1. Objective

Create the `usePriorityFeed` TanStack Query hook that fetches P1 and P2 priority intel items from the dedicated `/console/priority-feed` backend endpoint. This hook is the single data source for the PriorityFeedStrip (WS-2.2) and PriorityFeedPanel (WS-2.3) -- the highest-value protective intelligence surface in the viewer. It polls at 15-second intervals (twice the frequency of the general intel feed at 30s) to minimize latency for critical alerts, and exposes its query key as a named constant so that WS-2.4's Supabase Realtime subscription can trigger immediate cache invalidation on P1/P2 INSERT events.

The hook follows the established data hook pattern: typed API response (snake_case) normalized to a camelCase TypeScript interface, with a standalone `queryFn` and exported hook function. It additionally exports pre-computed summary values (P1 count, P2 count, most recent item per priority level) that both downstream consumers need, avoiding redundant derivation logic in WS-2.2 and WS-2.3.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `PriorityFeedItem` interface | Exported camelCase type for a single P1/P2 feed item with all fields needed by WS-2.2 (strip) and WS-2.3 (panel): id, title, severity, category, operationalPriority, shortSummary, eventType, geoScope, ingestedAt. |
| `ApiPriorityFeedItem` interface | Local snake_case type mirroring the `/console/priority-feed` response schema. |
| `ApiPriorityFeedResponse` interface | Local type for the full endpoint response: `items` array + `total_count` + `p1_count` + `p2_count`. |
| `PriorityFeedSummary` interface | Exported type carrying pre-computed aggregate values: `p1Count`, `p2Count`, `totalCount`, `mostRecentP1`, `mostRecentP2`, `items`. |
| `fetchPriorityFeed` query function | Standalone async function calling `tarvariGet<ApiPriorityFeedResponse>('/console/priority-feed')` and normalizing the response. |
| `usePriorityFeed` hook | Exported TanStack Query hook with 15s poll interval, `placeholderData: keepPreviousData` for flicker-free updates, and `staleTime: 10s`. |
| `PRIORITY_FEED_QUERY_KEY` constant | Exported query key `['priority', 'feed'] as const` for external invalidation by WS-2.4. |
| JSDoc documentation | All exports documented with `@see` references to WS-2.2, WS-2.3, WS-2.4, and AD-2. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| PriorityFeedStrip component | WS-2.2 consumes this hook's output to render the world-space strip. |
| PriorityFeedPanel component | WS-2.3 consumes this hook's output for the expanded feed list. |
| Supabase Realtime subscription | WS-2.4 creates the real-time channel and invalidates this hook's cache via `PRIORITY_FEED_QUERY_KEY`. |
| Notification system | WS-2.5 subscribes to new P1/P2 arrivals (triggered by WS-2.4) and fires sonner/Browser notifications. |
| Coverage store `priorityFeedExpanded` state | WS-2.6 adds the UI toggle state. This hook is data-only. |
| Backend `/console/priority-feed` endpoint | Backend Phase B.1 implements the endpoint. This hook consumes it. |
| P3/P4 items | This hook is P1+P2 exclusive. General intel (including P3/P4) is served by `useIntelFeed`. |
| Sorting logic | The backend is responsible for returning items sorted by priority (P1 before P2) then by recency (most recent first). The hook preserves backend sort order. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.2 deliverables | `OperationalPriority` type, `getPriorityMeta()` helper in `src/lib/interfaces/coverage.ts` | Pending (WS-0.2 not yet implemented) |
| WS-1.1 deliverables | `operationalPriority: OperationalPriority \| null` field established on `IntelFeedItem`, `MapMarker`, and normalizer patterns for the `operational_priority` API field | Pending (WS-1.1 not yet implemented) |
| Backend Phase B.1 | `GET /console/priority-feed` endpoint returning P1+P2 items with sort, counts, and full item detail | Pending (backend work) |
| `src/lib/tarvari-api.ts` | `tarvariGet<T>(endpoint, params?)` API client | Available -- reviewed (lines 20-44) |
| `src/hooks/use-intel-feed.ts` | Pattern reference: `'use client'` directive, local `Api*` type, exported normalized type, standalone `queryFn`, exported hook with `queryKey`/`staleTime`/`refetchInterval` | Available -- reviewed |
| `@tanstack/react-query` v5 | `useQuery`, `keepPreviousData` function import for `placeholderData` | Available (`^5.0.0` in `package.json`) |

## 4. Deliverables

### 4.1 File: `src/hooks/use-priority-feed.ts`

A single new file containing all types, the query function, the query key constant, and the hook. This follows the established pattern where each hook owns its API and normalized types locally (see `use-intel-feed.ts`, `use-category-intel.ts`).

### 4.2 `ApiPriorityFeedItem` (local interface)

The snake_case type mirroring the `/console/priority-feed` response item shape. Fields match the `ApiIntelItem` pattern from `use-category-intel.ts` (the richest existing API type) with the guaranteed-present `operational_priority` field.

```
interface ApiPriorityFeedItem {
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
  operational_priority: string        // Always present (never null) -- endpoint only returns P1/P2 items
}
```

**Design note on `operational_priority: string` (not `string | null`):** Unlike the general `/console/intel` endpoint where priority may be null during backend migration, the dedicated `/console/priority-feed` endpoint is defined to return only items with a valid P1 or P2 priority. The field is non-nullable on this API type. The cast to `OperationalPriority` in the normalizer remains appropriate because the backend is the authoritative source.

### 4.3 `ApiPriorityFeedResponse` (local interface)

The full endpoint response envelope.

```
interface ApiPriorityFeedResponse {
  items: ApiPriorityFeedItem[]
  total_count: number
  p1_count: number
  p2_count: number
}
```

**Rationale for server-side counts:** The backend computes `p1_count` and `p2_count` authoritatively. The hook could derive these client-side from the items array, but server-provided counts are more reliable when the endpoint applies a limit to the items returned (the client may receive a subset while the counts reflect the full population). This matters when there are more P1/P2 items than the fetch limit.

**Fallback if the backend does not provide counts:** If the endpoint response does not include `p1_count`/`p2_count` fields during early integration, the normalizer will derive them from the items array (see Deliverable 4.5, fallback logic). This avoids blocking frontend work on a specific backend response shape.

### 4.4 `PriorityFeedItem` (exported interface)

The normalized camelCase type exported for consumption by WS-2.2 and WS-2.3. Richer than `IntelFeedItem` (from `use-intel-feed.ts`) because the priority feed surfaces need additional context fields.

```
export interface PriorityFeedItem {
  /** Unique identifier for this intel item. */
  id: string
  /** Alert title / headline. */
  title: string
  /** Severity level (e.g., 'Extreme', 'Severe'). Drives color per AD-1. */
  severity: string
  /** Intel category identifier (e.g., 'seismic', 'conflict'). */
  category: string
  /** Operational priority level. Always 'P1' or 'P2' for this feed. */
  operationalPriority: OperationalPriority
  /** Brief summary text for preview display. */
  shortSummary: string | null
  /** Event type classification from the intel source. */
  eventType: string | null
  /** Geographic scope identifiers (country codes, region names). */
  geoScope: string[] | null
  /** Source identifier for attribution. */
  sourceKey: string | null
  /** ISO 8601 timestamp of when the item was ingested. Used for time-ago display. */
  ingestedAt: string
  /** ISO 8601 timestamp of when the source sent the alert. */
  sentAt: string | null
}
```

**Design note on `operationalPriority: OperationalPriority` (non-nullable):** This is the key difference from the general `IntelFeedItem` (WS-1.1) where the field is `OperationalPriority | null`. The priority feed endpoint guarantees P1/P2 presence. Making this non-nullable allows downstream consumers to use priority unconditionally without null checks -- cleaner rendering logic in WS-2.2 and WS-2.3.

**Import required:** `import type { OperationalPriority } from '@/lib/interfaces/coverage'`

### 4.5 `PriorityFeedSummary` (exported interface)

Pre-computed aggregate values that both WS-2.2 (strip) and WS-2.3 (panel) need. Derived once in the query function, consumed by multiple components.

```
export interface PriorityFeedSummary {
  /** All P1/P2 items in server-provided order (priority desc, then recency desc). */
  items: PriorityFeedItem[]
  /** Total count of P1 items (from server, or derived from items as fallback). */
  p1Count: number
  /** Total count of P2 items (from server, or derived from items as fallback). */
  p2Count: number
  /** Total count of all P1+P2 items. */
  totalCount: number
  /** Most recent P1 item, or null if no P1 items exist. */
  mostRecentP1: PriorityFeedItem | null
  /** Most recent P2 item, or null if no P2 items exist. */
  mostRecentP2: PriorityFeedItem | null
}
```

**Rationale for `mostRecentP1` / `mostRecentP2`:** WS-2.2 (PriorityFeedStrip) displays "most recent title + time-ago" for the highest-priority active item. Pre-computing these references avoids `.find()` calls in the render path of a component that updates every 15s.

### 4.6 `PRIORITY_FEED_QUERY_KEY` (exported constant)

```
export const PRIORITY_FEED_QUERY_KEY = ['priority', 'feed'] as const
```

This constant serves two purposes:

1. **Internal use:** The `usePriorityFeed` hook uses it as its `queryKey` value.
2. **External invalidation (WS-2.4):** The `useRealtimePriorityAlerts` hook imports this constant and calls `queryClient.invalidateQueries({ queryKey: PRIORITY_FEED_QUERY_KEY })` when a Supabase Realtime INSERT event arrives for a P1/P2 item.

**Query key design rationale:** The key `['priority', 'feed']` is namespaced under `'priority'` (not `'intel'`) to distinguish it from the general intel feed (`['intel', 'feed']`). This prevents accidental cross-invalidation when either feed is refreshed. If the priority feed later needs parameterization (e.g., time range filters), additional segments can be appended without breaking existing invalidation calls because `invalidateQueries` performs prefix matching by default.

### 4.7 `fetchPriorityFeed` (standalone query function)

The async function that performs the API call and normalizes the response.

```
async function fetchPriorityFeed(): Promise<PriorityFeedSummary>
```

Implementation outline:

1. Call `tarvariGet<ApiPriorityFeedResponse>('/console/priority-feed')`.
2. Map each `ApiPriorityFeedItem` to `PriorityFeedItem` (snake_case to camelCase).
3. Use server-provided `p1_count` and `p2_count` when available; fall back to client-side derivation from the items array if the fields are missing or undefined.
4. Compute `mostRecentP1` as the first P1 item in the array (backend sorts by priority then recency, so the first P1 is the most recent P1). Compute `mostRecentP2` similarly.
5. Return the assembled `PriorityFeedSummary`.

**Normalizer mapping (per field):**

| API field (snake_case) | Normalized field (camelCase) | Transformation |
|------------------------|------------------------------|----------------|
| `id` | `id` | Pass-through |
| `title` | `title` | Pass-through |
| `severity` | `severity` | Pass-through |
| `category` | `category` | Pass-through |
| `event_type` | `eventType` | Pass-through |
| `source_key` | `sourceKey` | Pass-through |
| `confidence` | (not mapped) | Not needed by feed consumers. Available in API type if future use emerges. |
| `geo_scope` | `geoScope` | Pass-through |
| `short_summary` | `shortSummary` | Pass-through |
| `ingested_at` | `ingestedAt` | Pass-through |
| `sent_at` | `sentAt` | Pass-through |
| `operational_priority` | `operationalPriority` | Cast `as OperationalPriority` -- safe because endpoint only returns P1/P2 |

**Count fallback logic:**

```
// Prefer server-provided counts; fall back to client-side derivation
const p1Count = data.p1_count ?? items.filter(i => i.operationalPriority === 'P1').length
const p2Count = data.p2_count ?? items.filter(i => i.operationalPriority === 'P2').length
```

This pattern ensures the hook works during early integration when the backend may not yet return count fields.

### 4.8 `usePriorityFeed` (exported hook)

```
export function usePriorityFeed(): UseQueryResult<PriorityFeedSummary>
```

TanStack Query configuration:

| Option | Value | Rationale |
|--------|-------|-----------|
| `queryKey` | `PRIORITY_FEED_QUERY_KEY` | Stable, importable constant for external invalidation. |
| `queryFn` | `fetchPriorityFeed` | Standalone function per codebase pattern. |
| `staleTime` | `10_000` (10 seconds) | Slightly below the 15s poll interval. Data is considered fresh for 10s after fetch, preventing duplicate requests when components re-mount within the stale window. |
| `refetchInterval` | `15_000` (15 seconds) | 2x the frequency of the general intel feed (30s). P1/P2 items are critical and warrant faster polling. |
| `placeholderData` | `keepPreviousData` | TanStack Query v5 replacement for the removed `keepPreviousData: true` option. Ensures the strip/panel shows the previous fetch result while new data loads, preventing UI flicker every 15s. |
| `refetchOnWindowFocus` | `true` (default) | User returning to tab should get fresh P1/P2 data immediately. Default behavior is correct. |

**Import for `keepPreviousData`:** In TanStack Query v5, `keepPreviousData` is a function imported from `@tanstack/react-query`, used as the value for `placeholderData`. This is a codebase-first usage -- no existing hook uses this pattern, but it is the documented v5 equivalent of the removed `keepPreviousData: true` option.

```
import { useQuery, keepPreviousData } from '@tanstack/react-query'
```

**No `enabled` flag:** Unlike `useCategoryIntel` (which gates on `categoryId`), this hook has no conditional enable. The priority feed should poll continuously from the moment the viewer is loaded. P1/P2 visibility is always-on per the product requirement.

### 4.9 Confidence field exclusion

The `confidence` field is present in `ApiPriorityFeedItem` (it comes from the backend response) but is deliberately omitted from `PriorityFeedItem`. Neither WS-2.2 (strip) nor WS-2.3 (panel) displays confidence values. If a future workstream needs confidence on priority feed items, the normalized type can be extended additively without breaking existing consumers.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `usePriorityFeed` returns a `UseQueryResult<PriorityFeedSummary>` with `items`, `p1Count`, `p2Count`, `totalCount`, `mostRecentP1`, `mostRecentP2`. | `pnpm typecheck` -- verify type assignment; unit test asserting return shape against mock data. |
| AC-2 | `PriorityFeedItem.operationalPriority` is typed as `OperationalPriority` (non-nullable). TypeScript rejects assignment of `null` to this field. | `pnpm typecheck` -- assign `null` and verify compile error. |
| AC-3 | `PRIORITY_FEED_QUERY_KEY` is exported as `readonly ['priority', 'feed']`. | Code review; import the constant in a test file and verify `typeof`. |
| AC-4 | The hook polls at 15-second intervals (`refetchInterval: 15_000`). | Code review; integration test with `vi.useFakeTimers()` verifying refetch count after 30s equals 2. |
| AC-5 | The hook uses `placeholderData: keepPreviousData` to prevent data flash during refetch cycles. | Code review; unit test verifying that `data` is not `undefined` between refetch cycles when previous data exists. |
| AC-6 | `staleTime` is 10 seconds (`10_000`). | Code review of hook configuration. |
| AC-7 | `fetchPriorityFeed` normalizes all snake_case API fields to camelCase TypeScript fields per the mapping table in Deliverable 4.7. | Unit test: provide a mock `ApiPriorityFeedResponse` with snake_case fields and assert the normalized output has camelCase equivalents. |
| AC-8 | `mostRecentP1` is the first item in the array with `operationalPriority === 'P1'`, or `null` if no P1 items exist. Likewise for `mostRecentP2`. | Unit test with mixed P1/P2 items; unit test with P1-only; unit test with empty items array. |
| AC-9 | When the API response omits `p1_count` / `p2_count` fields, the hook falls back to deriving counts from the items array without error. | Unit test with a mock response that excludes count fields. |
| AC-10 | When the API returns an empty `items` array, the hook returns `p1Count: 0`, `p2Count: 0`, `totalCount: 0`, `mostRecentP1: null`, `mostRecentP2: null`, `items: []`. | Unit test with empty response. |
| AC-11 | External cache invalidation works: calling `queryClient.invalidateQueries({ queryKey: PRIORITY_FEED_QUERY_KEY })` triggers an immediate refetch of the priority feed data. | Integration test using `@tanstack/react-query`'s `QueryClient` and `vi.fn()` spy on the fetch function. |
| AC-12 | `pnpm typecheck` passes with zero errors across the full project after adding the new file. | Run `pnpm typecheck`. |
| AC-13 | `pnpm build` succeeds. | Run `pnpm build`. |
| AC-14 | The file begins with `'use client'` directive (required for hooks using `useQuery` in Next.js App Router). | Code review. |
| AC-15 | All exports have JSDoc documentation with `@see` references to consuming workstreams (WS-2.2, WS-2.3) and the invalidating workstream (WS-2.4). | Code review. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Use a dedicated endpoint (`/console/priority-feed`) rather than filtering `/console/intel` client-side. | The dedicated endpoint enables server-side sorting (priority then recency), server-side count aggregation across the full dataset (not just the fetched page), and future backend optimizations (e.g., a materialized view or index on priority). Assumption #2 from combined-recommendations confirms the backend will provide this endpoint. | Client-side filter on `useIntelFeed` data: rejected because (a) `useIntelFeed` fetches only 50 items so P1/P2 items beyond that window would be missed, (b) requires the general feed to increase its limit to ensure P1/P2 coverage, coupling two independent concerns. |
| D-2 | `PriorityFeedItem.operationalPriority` is non-nullable (`OperationalPriority`), unlike the general `IntelFeedItem` where it is `OperationalPriority \| null`. | The priority feed endpoint returns only P1/P2 items by definition. Making the field non-nullable removes unnecessary null checks in the two downstream component workstreams (WS-2.2, WS-2.3). The narrower type is honest about the data contract. | `OperationalPriority \| null` for consistency with WS-1.1: rejected because it forces consumers to handle an impossible state (a priority feed item without a priority). |
| D-3 | Return `PriorityFeedSummary` (items + counts + most-recent references) rather than a bare `PriorityFeedItem[]`. | Both WS-2.2 and WS-2.3 need the same derived values (p1Count, p2Count, mostRecentP1/P2). Computing them once in the query function is DRY and avoids re-derivation on every render in two separate components. | Return bare array, let consumers derive: rejected because it scatters identical logic across WS-2.2 and WS-2.3. Return items + counts without mostRecent: rejected because WS-2.2 explicitly needs the most recent title for the strip display. |
| D-4 | Use `placeholderData: keepPreviousData` (TanStack Query v5 pattern) instead of the removed `keepPreviousData: true` option. | `keepPreviousData: true` was removed in TanStack Query v5. The v5 equivalent is importing the `keepPreviousData` function from `@tanstack/react-query` and passing it as the `placeholderData` value. The codebase is on `@tanstack/react-query ^5.0.0` and no existing hook uses this pattern, making this the first instance. | `placeholderData: (prev) => prev`: functionally identical but less idiomatic -- the library provides the named function for readability. Omit entirely: rejected because the strip would show a loading state every 15s, creating distracting flicker. |
| D-5 | Query key is `['priority', 'feed']`, not `['intel', 'priority-feed']` or `['intel', 'feed', 'priority']`. | Namespacing under `'priority'` rather than `'intel'` prevents accidental co-invalidation with the general intel feed (`['intel', 'feed']`). `invalidateQueries` performs prefix matching -- if the priority feed key started with `'intel'`, invalidating `['intel']` would also trigger a priority feed refetch (and vice versa), which may be undesirable. | `['intel', 'priority-feed']`: rejected due to prefix overlap with general intel queries. `['priority-feed']`: single-segment keys are less structured; the two-segment `['priority', 'feed']` allows future `['priority', 'something-else']` keys without conflict. |
| D-6 | Export `PRIORITY_FEED_QUERY_KEY` as a named constant for external invalidation. | WS-2.4 needs to invalidate this hook's cache when Supabase Realtime events arrive. Hardcoding the key string in WS-2.4 would create a fragile coupling that breaks silently if the key changes. Importing the constant ensures compile-time safety. This is a deliberate API surface for cross-hook communication. | Hardcode `['priority', 'feed']` in WS-2.4: rejected for fragility. Export a helper function `invalidatePriorityFeed(queryClient)`: reasonable but over-abstraction for a single call -- the constant is sufficient. |
| D-7 | Exclude `confidence` from `PriorityFeedItem`. | Neither WS-2.2 nor WS-2.3 displays confidence values. Including unused fields adds noise to the type and the normalized data. The field remains on `ApiPriorityFeedItem` and can be threaded through to `PriorityFeedItem` in a future workstream if needed (additive, non-breaking change). | Include all fields from `ApiPriorityFeedItem`: rejected because unused data in the normalized type creates a misleading API surface that suggests rendering confidence is expected. |
| D-8 | `staleTime: 10_000` (10s) with `refetchInterval: 15_000` (15s). | Setting staleTime below refetchInterval creates a 5s window where the data is stale but a refetch has not yet started. This matches the existing `useIntelFeed` pattern (staleTime 20s, refetchInterval 30s -- same 10s delta). The staleTime prevents duplicate fetches when components mount/unmount within the fresh window. | `staleTime: 0` (always stale): would cause a refetch on every mount, even if data was fetched 1 second ago. `staleTime: 15_000` (equal to interval): would prevent background refetch triggers from `invalidateQueries` since the data would still be considered fresh. |
| D-9 | Trust backend sort order rather than re-sorting client-side. | The combined-recommendations specify that the endpoint returns items "sorted by priority then recency." Re-sorting client-side would be redundant and would add a maintenance burden if the sort criteria change. The `mostRecentP1` / `mostRecentP2` derivation relies on this order (first P1 in the array is the most recent P1). | Client-side sort after fetch: rejected because it duplicates backend logic and adds O(n log n) work on every 15s poll cycle for a dataset that is already sorted. |
| D-10 | Include `shortSummary`, `eventType`, `geoScope`, `sourceKey`, `sentAt` on `PriorityFeedItem` (richer than `IntelFeedItem`). | WS-2.3 (PriorityFeedPanel) displays a feed list where each item shows "PriorityBadge + severity color + title + category + time-ago." Future iterations will likely add summary text and geo context. Including these fields now avoids a type-change workstream later and is consistent with `CategoryIntelItem` (which carries the same field set). The marginal cost of mapping 5 extra fields is negligible. | Match `IntelFeedItem` exactly (6 fields only): rejected because WS-2.3 would likely need `shortSummary` for item previews, requiring a type change that touches this hook and both consumers. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Does the `/console/priority-feed` endpoint accept optional query parameters (e.g., `limit`, `since` ISO timestamp, `category`)? If so, the hook may need a filter argument and the query key would need additional segments. The SOW assumes no parameters for the initial implementation. | Backend team | Phase 2 (before implementation) |
| OQ-2 | Does the `/console/priority-feed` response include `p1_count` and `p2_count` as top-level fields, or only the `items` array and `total_count`? The hook includes fallback logic for both scenarios (Deliverable 4.5), but confirming the response shape avoids dead code. | Backend team | Phase 2 (before implementation) |
| OQ-3 | What is the maximum number of items the endpoint returns by default? If unbounded, the hook should pass a `limit` parameter (e.g., `limit: 100`) to prevent large payloads on systems with many P1/P2 items. | Backend team | Phase 2 (before implementation) |
| OQ-4 | Should the 15-second poll interval be configurable (e.g., via an environment variable or a hook parameter)? The combined-recommendations specify 15s, but operational contexts with bandwidth constraints may prefer 30s. | Product / react-developer | Phase 2 (can be deferred -- easy to parameterize later) |
| OQ-5 | When WS-2.4 (Realtime) invalidates this cache, should the poll interval temporarily increase to avoid a redundant scheduled refetch immediately after the invalidation-triggered fetch? TanStack Query's default behavior handles this correctly (invalidation triggers an immediate fetch; the next scheduled poll starts the interval timer from the latest fetch), so this may be a non-issue. | react-developer | WS-2.4 implementation |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Backend `/console/priority-feed` endpoint is not available when frontend work begins. | High | Low | The hook can be built and tested with MSW (Mock Service Worker) or a hardcoded mock `queryFn` during development. The `tarvariGet` pattern is a standard fetch -- switching from mock to real endpoint requires no structural changes. All acceptance criteria except AC-11 can be verified with mocks. |
| R-2 | Backend returns items not sorted by priority then recency, breaking `mostRecentP1`/`mostRecentP2` derivation. | Low | Medium | The `mostRecentP1`/`mostRecentP2` values are derived by scanning the items array with `.find()` -- not by taking `items[0]`. The derivation is correct regardless of sort order. The `items` array in `PriorityFeedSummary` would reflect the backend order, which may surprise consumers expecting sorted data. Mitigation: add a defensive client-side sort if backend order is unreliable (Decision D-9 can be revisited). |
| R-3 | 15-second polling causes excessive backend load under many concurrent viewers. | Low | Medium | The 15s interval is for a single dedicated endpoint that is simpler than the general `/console/intel` query (pre-filtered to P1/P2, likely backed by an index or materialized view). If load is a concern, the interval can be increased to 30s or the endpoint can implement HTTP caching headers (`Cache-Control: max-age=10`). WS-2.4 (Realtime) will eventually reduce polling dependency by pushing updates, at which point the poll interval can be increased to 60s as a fallback. |
| R-4 | WS-0.2 (`OperationalPriority` type) is not implemented when WS-2.1 work begins, blocking the import. | Medium | Medium | If blocked, temporarily use `type OperationalPriority = 'P1' \| 'P2' \| 'P3' \| 'P4'` as a local type alias in the hook file with a `// TODO: Import from @/lib/interfaces/coverage when WS-0.2 lands` comment. Remove the local type and add the import once WS-0.2 completes. This is the same mitigation pattern documented in WS-1.1 R-6. |
| R-5 | `keepPreviousData` import from `@tanstack/react-query` does not exist in the installed version. | Very Low | Low | The `keepPreviousData` function was introduced in `@tanstack/react-query` v5.0.0. The project declares `^5.0.0`. If for some reason the function is missing, the fallback is `placeholderData: (previousData) => previousData` -- functionally identical. |
| R-6 | Dual data channel divergence: WS-2.4 (Realtime) invalidates the cache, causing the hook to refetch stale data from an endpoint that has not yet indexed the new item. | Low | Medium | This is a race condition where the Realtime event arrives before the backend endpoint reflects the new item. TanStack Query's default retry behavior (3 retries with exponential backoff) helps. Additionally, the 15s poll provides a natural self-healing mechanism -- even if the invalidation-triggered fetch misses the new item, the next scheduled poll will catch it. The worst case is a ~15s delay, which is acceptable for an initial implementation. |
| R-7 | The `PriorityFeedItem` type diverges from `CategoryIntelItem` and `IntelFeedItem`, creating three similar-but-different item types that confuse consumers. | Medium | Low | The three types serve different display contexts with different field requirements: `IntelFeedItem` (6 fields, minimal), `CategoryIntelItem` (11 fields, detail view), `PriorityFeedItem` (11 fields, priority-specific). The field overlap is intentional -- each type is the minimal contract for its consumers. A shared `BaseIntelItem` could be extracted in a future cleanup workstream if the duplication becomes burdensome. |
