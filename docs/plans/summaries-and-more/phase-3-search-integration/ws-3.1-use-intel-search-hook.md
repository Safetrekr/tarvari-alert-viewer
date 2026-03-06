# WS-3.1: useIntelSearch Hook

> **Workstream ID:** WS-3.1
> **Phase:** 3 -- Search Integration
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.2, WS-1.1
> **Blocks:** WS-3.2, WS-3.3
> **Resolves:** None

## 1. Objective

Create the `useIntelSearch` TanStack Query hook that performs debounced full-text search against the `/console/search/intel` backend endpoint. This hook is the single data source for the async search results group in the CommandPalette (WS-3.2) and the fast-morph navigation flow (WS-3.3). It accepts a query string and optional filters (category, severity, date range), debounces input at 300ms to avoid excessive API calls during typing, and returns ranked `SearchResult[]` items that include `ts_headline` HTML snippets for keyword-in-context display.

The hook follows the established data hook pattern: typed API response (snake_case) normalized to a camelCase TypeScript interface, with a standalone `queryFn` and exported hook function. It uses TanStack Query's `enabled` option gated on `query.length >= 3` to prevent searches on trivially short strings, and disables polling entirely (search is on-demand, not periodic). The debounce is implemented at the hook level using a `useDeferredValue` + local state pattern so that TanStack Query only fires when the debounced query stabilizes.

The hook additionally exports its query key factory as a function (`intelSearchKey(params)`) so that consumers can programmatically inspect or invalidate specific search results if needed.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `SearchResult` interface | Exported camelCase type for a single search result: `id`, `title`, `snippet` (ts_headline HTML string), `severity`, `category`, `operationalPriority`, `score` (relevance rank from PostgreSQL `ts_rank`). |
| `ApiSearchResult` interface | Local snake_case type mirroring the `/console/search/intel` response item shape. |
| `ApiSearchResponse` interface | Local type for the full endpoint response envelope: `results` array + `total_count`. |
| `IntelSearchParams` interface | Exported type for the hook's input parameters: `query` (string), plus optional `category`, `severity`, `dateFrom`, `dateTo`, `limit`, `offset`. |
| `fetchIntelSearch` query function | Standalone async function calling `tarvariGet<ApiSearchResponse>('/console/search/intel', params)` and normalizing the response to `SearchResult[]`. |
| `useIntelSearch` hook | Exported TanStack Query hook with 300ms debounce, `enabled: debouncedQuery.length >= 3`, no polling, no `staleTime` (every search is fresh). |
| `intelSearchKey` factory | Exported function returning the query key array for a given `IntelSearchParams`, enabling external cache inspection. |
| 300ms debounce | Implemented via `useState` + `useEffect` with a `setTimeout`/`clearTimeout` pattern inside the hook. The debounced query value is passed to TanStack Query's `queryKey` and `queryFn`. |
| JSDoc documentation | All exports documented with `@see` references to WS-3.2 (CommandPalette consumer) and WS-3.3 (fast morph navigation). |

### Out of Scope

| Area | Rationale |
|------|-----------|
| CommandPalette integration | WS-3.2 consumes this hook's output to render the async `<CommandGroup>`. |
| Fast morph navigation | WS-3.3 uses `SearchResult.category` to call `startMorph(category, { fast: true })`. |
| Fast morph implementation in ui.store | WS-3.4 extends `startMorph()` with `options.fast` support. |
| Snippet sanitization | WS-3.2 handles `dangerouslySetInnerHTML` rendering of `snippet` with sanitization. This hook passes the raw HTML string through. |
| Pagination UI | The hook accepts `limit` and `offset` params, but no pagination component is built in this workstream. WS-3.2 shows a fixed max of 10 results. |
| Backend `/console/search/intel` endpoint | Backend Phase C.2 implements the endpoint with PostgreSQL full-text search and `ts_headline`. This hook consumes it. |
| Search analytics / instrumentation | Deferred to a future workstream. No event tracking on search queries in this phase. |
| Caching / result persistence | Search results are not cached beyond TanStack Query's default GC behavior. Each new query triggers a fresh fetch. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.2 deliverables | `OperationalPriority` type in `src/lib/interfaces/coverage.ts` | Pending (WS-0.2 not yet implemented) |
| WS-1.1 deliverables | Established pattern for `operationalPriority: OperationalPriority \| null` on normalized types, `as OperationalPriority` cast pattern in normalizers | Pending (WS-1.1 not yet implemented) |
| Backend Phase C.2 | `GET /console/search/intel?q=&category=&severity=&date_from=&date_to=&limit=10&offset=0` endpoint returning ranked results with `ts_headline` snippets, `category`, `severity`, `operational_priority`, and relevance `score` | Pending (backend work) |
| `src/lib/tarvari-api.ts` | `tarvariGet<T>(endpoint, params?)` API client -- reviewed (lines 20-44). Accepts `Record<string, string \| number \| undefined>` params, filters out `undefined` values, appends as URL search params. | Available [CODEBASE] |
| `src/hooks/use-intel-feed.ts` | Pattern reference: `'use client'` directive, local `Api*` type, exported normalized type, standalone `queryFn`, exported hook with `queryKey`/`staleTime`/`refetchInterval` | Available -- reviewed |
| `src/hooks/use-category-intel.ts` | Pattern reference: conditional `enabled` flag gated on a truthy parameter, parameterized `queryKey` that includes the filter argument, `queryFn` arrow function forwarding the parameter | Available -- reviewed |
| `@tanstack/react-query` v5 | `useQuery`, `UseQueryResult` | Available (`^5.0.0` in `package.json`) |

## 4. Deliverables

### 4.1 File: `src/hooks/use-intel-search.ts`

A single new file containing all types, the query function, the query key factory, the debounce logic, and the hook. This follows the established pattern where each hook owns its API and normalized types locally (see `use-intel-feed.ts`, `use-category-intel.ts`, `use-priority-feed.ts`).

### 4.2 `ApiSearchResult` (local interface)

The snake_case type mirroring a single result item from the `/console/search/intel` response.

```
interface ApiSearchResult {
  id: string
  title: string
  snippet: string                       // ts_headline HTML with <b> tags
  severity: string
  category: string
  operational_priority: string | null   // May be null during backend migration
  score: number                         // ts_rank relevance score (0.0-1.0)
}
```

**Field notes:**

- `snippet` contains HTML produced by PostgreSQL's `ts_headline()` function. The backend wraps matched terms in `<b>` tags (e.g., `"...earthquake struck <b>central</b> Turkey..."`). This hook passes the raw HTML through; sanitization is WS-3.2's responsibility.
- `operational_priority` is `string | null` on the API type (not `OperationalPriority | null`) because API response types reflect the wire protocol's unvalidated strings. Type narrowing happens in the normalizer. This matches the pattern established by WS-1.1 across all API types.
- `score` is the PostgreSQL `ts_rank` value. Higher values indicate stronger relevance. The backend returns results pre-sorted by score descending.

### 4.3 `ApiSearchResponse` (local interface)

The full endpoint response envelope.

```
interface ApiSearchResponse {
  results: ApiSearchResult[]
  total_count: number
}
```

**Design note:** The endpoint returns `results` (not `items`) to distinguish search responses from feed/list responses. The `total_count` reflects the total number of matches across all pages, not just the returned subset. This enables WS-3.2 to show "Showing 10 of 47 results" if desired.

### 4.4 `SearchResult` (exported interface)

The normalized camelCase type exported for consumption by WS-3.2 (CommandPalette rendering) and WS-3.3 (fast morph navigation).

```
export interface SearchResult {
  /** Unique identifier for this intel item. */
  id: string
  /** Alert title / headline. */
  title: string
  /** ts_headline HTML snippet with matched terms in <b> tags. Raw HTML -- sanitize before rendering. */
  snippet: string
  /** Severity level (e.g., 'Extreme', 'Severe'). Drives color per AD-1. */
  severity: string
  /** Intel category identifier (e.g., 'seismic', 'conflict'). Used by WS-3.3 for morph target. */
  category: string
  /** Operational priority level, or null if not yet assigned. */
  operationalPriority: OperationalPriority | null
  /** Relevance score from PostgreSQL ts_rank (0.0-1.0). Higher = more relevant. */
  score: number
}
```

**Design note on `category` field:** This field is critical for WS-3.3 (search-to-morph navigation). When a user clicks a search result, WS-3.3 reads `result.category` to determine which district to morph into via `startMorph(category, { fast: true })`. This was flagged as validation finding M-2 in the combined-recommendations: "Search results need `category` field for morph target. Ensure `/console/search/intel` response includes `category`." The backend Phase C.2 specification must include `category` in the response schema.

**Design note on `operationalPriority: OperationalPriority | null`:** Unlike `PriorityFeedItem` (WS-2.1) where priority is non-nullable (the priority feed endpoint guarantees P1/P2), search results span all priority levels including items that may not yet have a priority assignment. The field is nullable here, matching the general pattern from WS-1.1.

**Import required:** `import type { OperationalPriority } from '@/lib/interfaces/coverage'`

### 4.5 `IntelSearchParams` (exported interface)

The hook's input parameter type. Exported so that WS-3.2 can construct the params object and pass it to the hook.

```
export interface IntelSearchParams {
  /** The search query string. Searches are enabled when this is >= 3 characters. */
  query: string
  /** Optional category filter (e.g., 'seismic', 'conflict'). */
  category?: string
  /** Optional severity filter (e.g., 'Extreme', 'Severe'). */
  severity?: string
  /** Optional start date filter (ISO 8601 string). */
  dateFrom?: string
  /** Optional end date filter (ISO 8601 string). */
  dateTo?: string
  /** Maximum number of results to return. Defaults to 10. */
  limit?: number
  /** Offset for pagination. Defaults to 0. */
  offset?: number
}
```

**Parameter mapping to API query params:**

| `IntelSearchParams` field | API query param | Transformation |
|--------------------------|-----------------|----------------|
| `query` | `q` | Pass-through |
| `category` | `category` | Pass-through (undefined values filtered by `tarvariGet`) |
| `severity` | `severity` | Pass-through |
| `dateFrom` | `date_from` | CamelCase to snake_case |
| `dateTo` | `date_to` | CamelCase to snake_case |
| `limit` | `limit` | Pass-through (defaults to 10 in `fetchIntelSearch`) |
| `offset` | `offset` | Pass-through (defaults to 0 in `fetchIntelSearch`) |

### 4.6 `intelSearchKey` (exported query key factory)

```
export function intelSearchKey(params: IntelSearchParams): readonly unknown[]
```

Returns a stable query key array incorporating the search parameters. The key structure is:

```
['intel', 'search', { q: params.query, category, severity, dateFrom, dateTo, limit, offset }]
```

The key is namespaced under `['intel', 'search']` to distinguish it from:
- `['intel', 'feed']` (general intel feed)
- `['intel', 'category', categoryId]` (category-specific intel)
- `['priority', 'feed']` (priority feed)

The third segment is an object containing all search parameters. TanStack Query performs deep equality comparison on objects in query keys, so changing any parameter produces a new cache entry.

**Rationale for exporting the factory:** WS-3.2 does not currently need external access to the query key, but exporting it follows the pattern established by WS-2.1 (`PRIORITY_FEED_QUERY_KEY`). It enables future use cases such as: prefetching search results when the command palette opens, or invalidating stale search caches when new intel is ingested.

### 4.7 `fetchIntelSearch` (standalone query function)

```
async function fetchIntelSearch(params: IntelSearchParams): Promise<SearchResult[]>
```

Implementation outline:

1. Build the API params object, mapping camelCase field names to snake_case API query params:

```
const apiParams: Record<string, string | number | undefined> = {
  q: params.query,
  category: params.category,
  severity: params.severity,
  date_from: params.dateFrom,
  date_to: params.dateTo,
  limit: params.limit ?? 10,
  offset: params.offset ?? 0,
}
```

2. Call `tarvariGet<ApiSearchResponse>('/console/search/intel', apiParams)`.

3. Map each `ApiSearchResult` to `SearchResult` (snake_case to camelCase).

4. Return the mapped array.

**Normalizer mapping (per field):**

| API field (snake_case) | Normalized field (camelCase) | Transformation |
|------------------------|------------------------------|----------------|
| `id` | `id` | Pass-through |
| `title` | `title` | Pass-through |
| `snippet` | `snippet` | Pass-through (raw HTML preserved) |
| `severity` | `severity` | Pass-through |
| `category` | `category` | Pass-through |
| `operational_priority` | `operationalPriority` | Cast `as OperationalPriority` with `?? null` fallback |
| `score` | `score` | Pass-through |

**Priority normalization:** The cast `(r.operational_priority as OperationalPriority) ?? null` follows the pattern established by WS-1.1 across all normalizers. The `?? null` ensures null-safety when the backend has not yet populated the priority field.

**Empty results:** When the API returns an empty `results` array, `fetchIntelSearch` returns `[]`. No special handling is needed; TanStack Query treats this as a successful query with an empty data set.

### 4.8 Debounce Implementation

The 300ms debounce is implemented inside the hook using React state and effects, not as a wrapper around the query function. This ensures TanStack Query only creates cache entries for stabilized queries, avoiding cache pollution from intermediate keystrokes.

**Implementation pattern:**

```
function useIntelSearch(params: IntelSearchParams) {
  const [debouncedQuery, setDebouncedQuery] = useState(params.query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(params.query)
    }, 300)
    return () => clearTimeout(timer)
  }, [params.query])

  const debouncedParams = { ...params, query: debouncedQuery }

  return useQuery<SearchResult[]>({
    queryKey: intelSearchKey(debouncedParams),
    queryFn: () => fetchIntelSearch(debouncedParams),
    enabled: debouncedQuery.length >= 3,
    // No staleTime -- each search is fresh
    // No refetchInterval -- search is on-demand
    // No refetchOnWindowFocus -- stale search results on tab return are acceptable
    refetchOnWindowFocus: false,
  })
}
```

**Design rationale for `useState` + `useEffect` over `useDeferredValue`:**

`useDeferredValue` was considered but rejected because:
1. `useDeferredValue` defers rendering, not fetching. The query would still fire immediately in TanStack Query's cache layer, creating cache entries for every keystroke.
2. The `setTimeout`/`clearTimeout` pattern provides a true 300ms debounce that prevents the network request entirely until the user pauses typing.
3. This pattern is well-established in the React ecosystem for search inputs and is straightforward to test with `vi.useFakeTimers()`.

**Design rationale for debounce inside the hook (not in the consumer):**

Placing the debounce inside `useIntelSearch` ensures consistent behavior regardless of which component consumes it. If the debounce were left to WS-3.2 (CommandPalette), a future consumer could forget to debounce and hammer the API. The hook is self-protecting.

**Exported `debouncedQuery` for UI state:** The hook also exports the current `debouncedQuery` value alongside the TanStack Query result, so that WS-3.2 can show a "Searching for..." indicator that reflects the actual query being searched (not the in-flight keystroke).

Updated return signature:

```
export function useIntelSearch(params: IntelSearchParams): UseIntelSearchResult
```

Where:

```
export interface UseIntelSearchResult {
  /** The TanStack Query result containing SearchResult[] data. */
  queryResult: UseQueryResult<SearchResult[]>
  /** The debounced query string currently being searched. */
  debouncedQuery: string
}
```

This allows WS-3.2 to distinguish between three states:
1. **User is typing** (`params.query !== debouncedQuery`): show "Searching..." spinner.
2. **Query is in flight** (`params.query === debouncedQuery && queryResult.isFetching`): show loading spinner.
3. **Results ready** (`queryResult.data` is populated): show results.
4. **Query too short** (`debouncedQuery.length < 3`): show "Type 3+ characters to search".

### 4.9 `useIntelSearch` (exported hook)

TanStack Query configuration:

| Option | Value | Rationale |
|--------|-------|-----------|
| `queryKey` | `intelSearchKey(debouncedParams)` | Parameterized key factory. Includes the debounced query and all filter params. Each unique combination of params creates a separate cache entry. |
| `queryFn` | `() => fetchIntelSearch(debouncedParams)` | Arrow function forwarding debounced params, matching the `useCategoryIntel` pattern. |
| `enabled` | `debouncedQuery.length >= 3` | Prevents searches on 0-2 character queries. The 3-character minimum reduces noise (single/double-character searches return too many irrelevant results from full-text search). Uses the debounced value, not the raw input, to avoid a flash of disabled state during typing. |
| `staleTime` | `undefined` (default: 0) | Every search should hit the backend. Cached results for the same query may be stale if new intel has been ingested since the last search. Users expect search to reflect current data. |
| `refetchInterval` | `undefined` (disabled) | Search is on-demand. There is no polling. The user triggers searches by typing, not by waiting. |
| `refetchOnWindowFocus` | `false` | Returning to the tab should not re-trigger the last search. The command palette may be closed, and the user's context has likely shifted. This differs from feed hooks where window focus refetch is desirable. |
| `gcTime` | `5 * 60 * 1000` (5 minutes, default) | TanStack Query's default garbage collection time. Search results for recent queries remain in cache for 5 minutes, enabling instant re-display if the user re-opens the command palette and types the same query. No custom value needed. |

**No `placeholderData`:** Unlike `usePriorityFeed` (WS-2.1) which uses `keepPreviousData` to prevent flicker during polling, search results change entirely when the query changes. Showing previous query's results while the new query loads would be misleading. The loading state (spinner in WS-3.2) is the correct UX for query transitions.

### 4.10 `'use client'` directive

The file must begin with `'use client'` because it uses React hooks (`useState`, `useEffect`, `useQuery`). This matches all existing hook files in the codebase.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `useIntelSearch` returns a `UseIntelSearchResult` with `queryResult: UseQueryResult<SearchResult[]>` and `debouncedQuery: string`. | `pnpm typecheck` -- verify type assignment; unit test asserting return shape. |
| AC-2 | `SearchResult.operationalPriority` is typed as `OperationalPriority \| null` (nullable). TypeScript accepts `null` assignment. | `pnpm typecheck`. |
| AC-3 | `SearchResult.category` is a required string field (not optional, not nullable). | `pnpm typecheck` -- verify access without null check; code review confirming the field is present for WS-3.3 morph navigation. |
| AC-4 | `SearchResult.snippet` is a string field containing raw HTML. No sanitization is performed in the hook. | Code review of `fetchIntelSearch` normalizer -- `snippet` is passed through unchanged. |
| AC-5 | The hook debounces at 300ms: changing `params.query` does not trigger a TanStack Query fetch until 300ms after the last change. | Unit test with `vi.useFakeTimers()`: change query at t=0, assert no fetch at t=200, advance to t=300, assert fetch fires. |
| AC-6 | Rapid consecutive query changes (typing) result in only one fetch for the final stabilized value. | Unit test: set query to "ear", then "eart", then "earth" in rapid succession (< 300ms between each). Assert exactly one fetch with query "earth". |
| AC-7 | The hook does not fetch when `debouncedQuery.length < 3`. | Unit test: set query to "ab" (2 characters), advance past debounce timer, assert no fetch. Set to "abc" (3 characters), advance past debounce timer, assert fetch fires. |
| AC-8 | `fetchIntelSearch` normalizes all snake_case API fields to camelCase TypeScript fields per the mapping table in Deliverable 4.7. | Unit test: provide a mock `ApiSearchResponse` with snake_case fields and assert the normalized output has camelCase equivalents. |
| AC-9 | `fetchIntelSearch` maps `operational_priority` to `operationalPriority` using the `as OperationalPriority` cast with `?? null` fallback. When the API field is `null`, the normalized field is `null`. When the API field is `'P1'`, the normalized field is `'P1'`. | Unit test with both null and non-null priority values. |
| AC-10 | `fetchIntelSearch` returns `[]` when the API returns an empty `results` array. | Unit test with empty response: `{ results: [], total_count: 0 }`. |
| AC-11 | `intelSearchKey({ query: 'earthquake', category: 'seismic' })` returns a key array that includes the query and category. Different params produce different keys. | Unit test: compare keys for different params; assert deep inequality. |
| AC-12 | `refetchOnWindowFocus` is `false` -- returning to the tab does not re-trigger the search. | Code review of hook configuration. |
| AC-13 | No `refetchInterval` is set -- the hook does not poll. | Code review of hook configuration. |
| AC-14 | `IntelSearchParams.limit` defaults to 10 when not provided. `IntelSearchParams.offset` defaults to 0 when not provided. | Unit test: call `fetchIntelSearch({ query: 'test' })` and assert the API is called with `limit=10&offset=0`. |
| AC-15 | `debouncedQuery` in the return value reflects the current debounced (stabilized) query, not the in-flight raw input. | Unit test: set query to "earth", assert `debouncedQuery` is still the previous value, advance 300ms, assert `debouncedQuery` is now "earth". |
| AC-16 | `pnpm typecheck` passes with zero errors across the full project after adding the new file. | Run `pnpm typecheck`. |
| AC-17 | `pnpm build` succeeds. | Run `pnpm build`. |
| AC-18 | The file begins with `'use client'` directive. | Code review. |
| AC-19 | All exports have JSDoc documentation with `@see` references to consuming workstreams (WS-3.2, WS-3.3). | Code review. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Debounce at 300ms inside the hook using `useState` + `useEffect` + `setTimeout`/`clearTimeout`. | Self-protecting: every consumer gets debounce automatically. 300ms is the standard search debounce interval -- long enough to prevent rapid-fire requests during normal typing (~200ms between keystrokes), short enough to feel responsive. The pattern is testable with `vi.useFakeTimers()`. | Debounce in the consumer (WS-3.2): rejected because a future consumer could forget to debounce, hammering the API. `useDeferredValue`: rejected because it defers rendering, not fetching -- TanStack Query would still create cache entries for every keystroke. `lodash.debounce` on the `queryFn`: rejected because TanStack Query manages its own fetch lifecycle; wrapping the `queryFn` in a debounce creates unpredictable behavior with cache keys and stale data detection. |
| D-2 | Gate on `debouncedQuery.length >= 3` (not raw `query.length >= 3`). | Using the debounced value for the `enabled` check prevents a flash of enabled/disabled state as the user types. If the raw value were used, typing "ab" (disabled) then "abc" (enabled) would immediately enable the query before the debounce stabilizes, potentially firing a request that gets cancelled 300ms later when the user continues typing. | Raw `query.length >= 3`: rejected because it bypasses the debounce for the enable/disable decision. `query.length >= 2`: rejected because 2-character full-text searches produce excessive noise. `query.length >= 4`: rejected as too restrictive for short search terms like "war", "flu", "fire". |
| D-3 | `SearchResult.operationalPriority` is `OperationalPriority \| null` (nullable), unlike `PriorityFeedItem` where it is non-nullable. | Search results span all priority levels (P1--P4) and include items that may not yet have a priority assignment during the backend migration period. The nullable type is honest about the data contract and matches the general pattern from WS-1.1. | Non-nullable `OperationalPriority`: rejected because search results are not filtered to P1/P2 only -- items without priority would need a synthetic default, which would be misleading. |
| D-4 | Return `SearchResult[]` (flat array), not a summary object like `PriorityFeedSummary`. | Unlike the priority feed where pre-computed aggregates (p1Count, mostRecentP1) are needed by multiple consumers, search results are consumed as a simple list by a single consumer (WS-3.2). WS-3.3 only reads `category` from a clicked result. A wrapper object would add ceremony without value. | `SearchSummary` with `results`, `totalCount`, `query`: considered, but `totalCount` is available from the TanStack Query result metadata if needed, and `query` is already in the caller's scope. |
| D-5 | No polling (`refetchInterval: undefined`). `refetchOnWindowFocus: false`. | Search is inherently on-demand -- the user triggers it by typing. Polling search results would waste bandwidth on a query the user may have abandoned. Window focus refetch is disabled because the command palette is typically closed when the user switches tabs; re-triggering a stale search on return adds no value. | `refetchInterval: 60_000` (background refresh): rejected because search context is ephemeral. `refetchOnWindowFocus: true`: rejected because it would fire a request when the user returns to the tab, even if the command palette is closed. |
| D-6 | Pass `snippet` (raw HTML) through without sanitization. | Sanitization is a rendering concern, not a data-fetching concern. The hook's job is to deliver the API response faithfully. WS-3.2 is responsible for sanitizing the HTML before rendering via `dangerouslySetInnerHTML`. Splitting concerns keeps the hook testable without DOM dependencies. | Sanitize in the hook with DOMPurify: rejected because (a) it adds a DOM dependency to a data hook, (b) DOMPurify requires DOM APIs that may not be available in all test environments, (c) the sanitization policy (which tags to allow) is a rendering decision that belongs in WS-3.2. |
| D-7 | Export `UseIntelSearchResult` composite return type (wrapping `UseQueryResult` + `debouncedQuery`) rather than returning bare `UseQueryResult`. | WS-3.2 needs access to `debouncedQuery` to distinguish between "user is still typing" (raw query !== debounced query) and "query is in flight" (both equal but `isFetching` is true). Without this, the CommandPalette cannot differentiate the debounce waiting state from the network loading state, leading to a confusing UX. | Return bare `UseQueryResult`, expose debounced query via a ref: rejected because it forces the consumer to manage two separate return values. Return `[queryResult, debouncedQuery]` tuple: less self-documenting than a named interface. |
| D-8 | Query key factory is `intelSearchKey(params)` (function), not a static constant like `PRIORITY_FEED_QUERY_KEY`. | Search queries are parameterized -- every combination of query + filters produces a different cache entry. A static constant cannot represent this variability. A factory function generates the correct key for any parameter set. This is the TanStack Query recommended pattern for parameterized queries. | Static constant `INTEL_SEARCH_QUERY_KEY = ['intel', 'search']` used as a prefix: would work for invalidation via prefix matching, but does not help with constructing parameterized keys. The factory serves both purposes (call with params for a specific key, use the prefix portion for broad invalidation). |
| D-9 | CamelCase-to-snake_case param mapping happens in `fetchIntelSearch`, not in a shared utility. | Only two fields need mapping (`dateFrom` -> `date_from`, `dateTo` -> `date_to`). A generic camelCase-to-snake_case utility would be over-engineering for two fields. The explicit mapping is clearer and more maintainable. If more hooks need this pattern, extraction can happen later. | Generic `toSnakeCase(params)` utility: rejected as premature abstraction for a two-field mapping. |
| D-10 | Default `limit` to 10 and `offset` to 0 in `fetchIntelSearch` when not provided. | 10 results is the CommandPalette's display maximum (WS-3.2 shows max 10). Defaulting in the query function (not the hook) ensures consistent behavior even if a future consumer omits these params. Offset 0 is the natural starting point. | Default in `IntelSearchParams` type with required fields: TypeScript interfaces cannot have runtime defaults. Default in the hook: would separate defaults from the fetch logic, making the query function less self-contained. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Does the `/console/search/intel` endpoint return `operational_priority` on each result item, or must it be added to the backend Phase C.2 specification? The combined-recommendations validation finding M-2 flags this: "Search results need `category` field for morph target." Priority was not explicitly listed in the original endpoint description but is needed for PriorityBadge rendering in WS-3.2. | Backend team | Phase 3 (before implementation) |
| OQ-2 | What is the exact `ts_headline` configuration on the backend? Specifically: (a) which HTML tags wrap matched terms (`<b>`, `<mark>`, or custom), (b) what is the snippet length / fragment count, and (c) are start/stop markers configurable? This affects WS-3.2's sanitization allowlist. | Backend team | Phase 3 (before implementation) |
| OQ-3 | Does the `/console/search/intel` endpoint support multiple category filters (e.g., `?category=seismic&category=conflict`) or only a single category? The `IntelSearchParams.category` field is typed as a single string. If multi-category search is needed, the type should be `category?: string \| string[]`. | Backend team | Phase 3 (can be deferred -- easy to extend) |
| OQ-4 | Should the 300ms debounce interval be configurable (e.g., via a `debounceMs` parameter on the hook)? The current implementation hardcodes 300ms. Different contexts (e.g., a dedicated search page vs. the command palette) might benefit from different intervals. | react-developer | Phase 3 (recommend: hardcode for now, parameterize if a second consumer emerges) |
| OQ-5 | Should the hook expose `totalCount` from the API response? Currently, `fetchIntelSearch` returns only `SearchResult[]`, discarding `total_count`. If WS-3.2 needs "Showing 10 of N results" display, `totalCount` must be threaded through. | react-developer / WS-3.2 | Phase 3 (resolve during WS-3.2 scoping) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Backend `/console/search/intel` endpoint is not available when frontend work begins. | High | Low | The hook can be built and tested with MSW (Mock Service Worker) or a hardcoded mock `queryFn`. The `tarvariGet` pattern is a standard fetch -- switching from mock to real endpoint requires no structural changes. All acceptance criteria can be verified with mocks. |
| R-2 | Backend does not include `category` in search results, breaking WS-3.3 morph navigation. | Medium | High | This was flagged as validation finding M-2 in the combined-recommendations. If `category` is absent, WS-3.3 cannot determine the morph target. Mitigation: (a) confirm with backend team during Phase C.2 scoping that `category` is included, (b) if absent, fall back to opening the alert in a detail panel instead of morphing (degraded but functional UX). |
| R-3 | Backend does not include `operational_priority` in search results. | Medium | Low | The `operationalPriority` field is nullable (`OperationalPriority \| null`). If absent from the API response, the `?? null` fallback produces `null`. WS-3.2 renders PriorityBadge conditionally -- null priority simply means no badge is shown. No crash, no broken layout. |
| R-4 | 300ms debounce feels too slow for fast typists who expect instant results. | Low | Low | 300ms is the industry standard for search debounce (Google, VS Code, Slack all use 250-400ms). If user feedback indicates it feels slow, the interval can be reduced to 200ms or made configurable (OQ-4). The change is a single constant. |
| R-5 | The `snippet` HTML from `ts_headline` contains unexpected tags or attributes that create XSS risk when rendered via `dangerouslySetInnerHTML` in WS-3.2. | Low | High | The HTML comes from PostgreSQL's `ts_headline()` function running on our own backend -- not from user-generated content. `ts_headline` produces a controlled set of tags (configurable via `StartSel`/`StopSel` parameters, defaulting to `<b>`/`</b>`). WS-3.2 should still sanitize with a strict allowlist (only `<b>` tags) as defense-in-depth. The risk to this hook is zero because it passes the HTML through without rendering. |
| R-6 | TanStack Query cache accumulates many search entries (one per unique query + filter combination), consuming memory. | Low | Low | TanStack Query's default `gcTime` (5 minutes) garbage-collects inactive cache entries automatically. A user would need to perform hundreds of unique searches within 5 minutes to cause meaningful memory pressure. If this becomes a concern, `gcTime` can be reduced to 60 seconds for search queries specifically. |
| R-7 | WS-0.2 (`OperationalPriority` type) is not implemented when WS-3.1 work begins, blocking the import. | Medium | Medium | If blocked, temporarily use `type OperationalPriority = 'P1' \| 'P2' \| 'P3' \| 'P4'` as a local type alias in the hook file with a `// TODO: Import from @/lib/interfaces/coverage when WS-0.2 lands` comment. Remove the local type and add the import once WS-0.2 completes. This is the same mitigation pattern documented in WS-1.1 R-6 and WS-2.1 R-4. |
| R-8 | The debounce `useEffect` cleanup does not fire correctly in React 19 strict mode, causing double fetches in development. | Very Low | Low | React strict mode double-invokes effects in development only (not production). The `clearTimeout` cleanup in the effect return handles this correctly: the first effect fires, the strict-mode remount clears it and fires a second effect, which is the one that stabilizes. This is standard React behavior and does not affect production. Unit tests should use `vi.useFakeTimers()` with strict mode enabled to verify. |
