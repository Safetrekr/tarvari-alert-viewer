# WS-6.1: Data Mode Branching in Hooks

> **Workstream ID:** WS-6.1
> **Phase:** 6 -- Public Deployment
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-6.2 (Supabase query functions)
> **Blocks:** None
> **Resolves:** AD-10 (Build-time data mode switching)

## 1. Objective

Introduce build-time data source branching into every TanStack Query data hook so the alert viewer can run in two modes: `console` (current behavior -- fetches from TarvaRI backend API via `tarvariGet`) and `supabase` (reads approved intel directly from Supabase via the browser client). The branching is controlled by `NEXT_PUBLIC_DATA_MODE`, a build-time environment variable. Only the fetch function changes per hook -- TanStack Query configuration (queryKey, staleTime, refetchInterval, enabled conditions) remains identical regardless of mode. This enables the GitHub Pages static export (WS-6.3, WS-6.4) to serve a fully functional read-only viewer without requiring the TarvaRI backend to be running.

The pattern is: each hook defines an internal `fetcher` that checks the resolved data mode constant and delegates to either the existing `tarvariGet`-based function or a new Supabase query function from `src/lib/supabase/queries.ts` (delivered by WS-6.2). The hooks themselves remain the sole owners of response normalization and TanStack Query wiring.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Data mode constant | Create `src/lib/data-mode.ts` exporting a resolved `DATA_MODE` constant (`'console' \| 'supabase'`) derived from `process.env.NEXT_PUBLIC_DATA_MODE`, defaulting to `'console'`. |
| `use-intel-feed.ts` | Replace the direct `fetchIntelFeed` call with a `fetcher` that branches on `DATA_MODE`. Console path calls existing `tarvariGet<ApiIntelFeedResponse>`. Supabase path calls `supabaseIntelFeed()` from WS-6.2. Both return `IntelFeedItem[]`. |
| `use-coverage-map-data.ts` | Replace `fetchCoverageMapData` with a branching fetcher. Console path calls existing `tarvariGet<GeoJSONFeatureCollection>`. Supabase path calls `supabaseCoverageMapData(filters?)` from WS-6.2. Both return `MapMarker[]`. |
| `use-coverage-metrics.ts` | Replace `fetchCoverageMetrics` with a branching fetcher. Console path calls both `/console/coverage` and `/console/intel` in parallel (existing logic). Supabase path calls `supabaseCoverageMetrics()` from WS-6.2. Both return `CoverageMetrics`. |
| `use-intel-bundles.ts` | Replace `fetchTriagedBundles` and `fetchAllBundles` with branching fetchers. Console path calls existing `tarvariGet<ApiBundlesList>`. Supabase path calls `supabaseIntelBundles(viewMode)` from WS-6.2. Both return `BundleWithDecision[]`. |
| `use-category-intel.ts` | Replace `fetchCategoryIntel` with a branching fetcher. Console path calls existing `tarvariGet<ApiIntelResponse>`. Supabase path calls `fetchCategoryIntelFromSupabase(category)` from WS-6.2. Both return `CategoryIntelItem[]`. |
| `use-bundle-detail.ts` | Replace `fetchBundleDetail` with a branching fetcher. Console path calls existing `tarvariGet<ApiBundleDetail>`. Supabase path calls `fetchBundleDetailFromSupabase(bundleId)` from WS-6.2. Both return `BundleWithMembers \| null`. |
| `.env.example` | Add `NEXT_PUBLIC_DATA_MODE=console` entry with explanatory comment. |
| Type contract | Define a `DataMode` type union (`'console' \| 'supabase'`) exported from `data-mode.ts` for use in WS-6.2 and WS-6.3. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Implementing Supabase query functions | Belongs to WS-6.2. This workstream imports them; WS-6.2 delivers them. |
| Creating Supabase public views (SQL) | Backend Phase E.1 responsibility. |
| Static export configuration | Belongs to WS-6.3. |
| GitHub Actions workflow | Belongs to WS-6.4. |
| Runtime mode detection (dynamic switching) | AD-10 explicitly chooses build-time switching. No runtime toggle, no user-facing mode selector. |
| Modifying TanStack Query configuration | queryKey, staleTime, refetchInterval, enabled -- all remain unchanged. Only the `queryFn` implementation branches. |
| Modifying API response types | The existing `Api*` interfaces in each hook are console-mode contracts. Supabase mode uses its own internal types within WS-6.2 query functions, then normalizes to the same output types each hook already defines (`IntelFeedItem`, `MapMarker`, etc.). |
| Removing `tarvariGet` or `tarvari-api.ts` | The console path still uses it. The module stays. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/hooks/use-intel-feed.ts` | Current hook: 87 lines, exports `useIntelFeed()`, `IntelFeedItem`. queryFn calls `tarvariGet<ApiIntelFeedResponse>('/console/intel')`. | Available |
| `src/hooks/use-coverage-map-data.ts` | Current hook: 109 lines, exports `useCoverageMapData(filters?)`, `CoverageMapFilters`. queryFn calls `tarvariGet<GeoJSONFeatureCollection>('/console/coverage/map-data')`. | Available |
| `src/hooks/use-coverage-metrics.ts` | Current hook: 123 lines, exports `useCoverageMetrics()`. queryFn calls two parallel `tarvariGet` requests (`/console/coverage` + `/console/intel`). | Available |
| `src/hooks/use-intel-bundles.ts` | Current hook: 119 lines, exports `useIntelBundles(viewMode)`. queryFn branches by `ViewMode` to call `/console/bundles` with different params. | Available |
| `src/hooks/use-category-intel.ts` | Current hook: 103 lines, exports `useCategoryIntel(categoryId)`. queryFn calls `tarvariGet<ApiIntelResponse>('/console/intel', { category })`. | Available |
| `src/hooks/use-bundle-detail.ts` | Current hook: exports `useBundleDetail(bundleId)`. queryFn calls `tarvariGet<ApiBundleDetail>('/console/bundles/:id')`. | Available |
| `src/lib/tarvari-api.ts` | Current API client: 44 lines, exports `tarvariGet<T>(endpoint, params?)`. | Available |
| `src/lib/supabase/client.ts` | Supabase browser client singleton: `getSupabaseBrowserClient()`. | Available |
| `src/lib/supabase/queries.ts` | Supabase query functions matching each hook's return type. | **Not yet available** -- delivered by WS-6.2. |
| AD-10 | Architecture decision: build-time `NEXT_PUBLIC_DATA_MODE` (`'console' \| 'supabase'`). | Approved |

## 4. Deliverables

### 4.1 Create `src/lib/data-mode.ts`

A small module that resolves the data mode from the environment variable and exports it as a typed constant. This is the single source of truth for which data source the application uses.

```typescript
/**
 * Build-time data mode resolution.
 *
 * NEXT_PUBLIC_DATA_MODE controls whether hooks fetch from the TarvaRI
 * backend API ('console') or from Supabase directly ('supabase').
 * Defaults to 'console' when unset.
 *
 * @module data-mode
 * @see AD-10
 */

export type DataMode = 'console' | 'supabase'

const raw = process.env.NEXT_PUBLIC_DATA_MODE

export const DATA_MODE: DataMode =
  raw === 'supabase' ? 'supabase' : 'console'

export const isSupabaseMode = DATA_MODE === 'supabase'
export const isConsoleMode = DATA_MODE === 'console'
```

Design notes:

- **Strict parsing:** Any value other than `'supabase'` falls back to `'console'`. This prevents typos from silently breaking the application. The fallback matches current behavior (all hooks call `tarvariGet` today).
- **Named boolean exports:** `isSupabaseMode` and `isConsoleMode` allow clean conditionals without string comparison at each call site, but the primary branching pattern in hooks uses `DATA_MODE` directly for clarity (see 4.2).
- **No validation error:** An unset `NEXT_PUBLIC_DATA_MODE` silently defaults to `'console'` because the existing codebase has no `DATA_MODE` env var and must continue working without one.
- **Build-time inlining:** Next.js replaces `process.env.NEXT_PUBLIC_*` references with literal strings at build time. The unused branch is dead-code-eliminated by the bundler (Webpack/Turbopack), so the `supabase` import path is tree-shaken out of console builds and vice versa.

### 4.2 Branching Pattern for Each Hook

Every hook follows the same structural pattern. The existing `fetch*` function is preserved as-is for the console path. A new conditional fetcher delegates based on `DATA_MODE`.

**Structural pattern (applied to each hook in 4.3-4.7):**

```typescript
import { DATA_MODE } from '@/lib/data-mode'
import { tarvariGet } from '@/lib/tarvari-api'
// Supabase query import -- WS-6.2 delivers this module
import { fetchXxxFromSupabase } from '@/lib/supabase/queries'

// Existing console-mode fetch function (UNCHANGED)
async function fetchXxxFromConsole(...): Promise<Xxx[]> {
  const data = await tarvariGet<ApiXxxResponse>('/console/...')
  return data.items.map(normalize)
}

// Branching fetcher
async function fetchXxx(...): Promise<Xxx[]> {
  if (DATA_MODE === 'supabase') {
    return fetchXxxFromSupabase(...)
  }
  return fetchXxxFromConsole(...)
}

// Hook (UNCHANGED except queryFn now calls the branching fetcher)
export function useXxx() {
  return useQuery<Xxx[]>({
    queryKey: ['xxx'],
    queryFn: fetchXxx,
    // ... staleTime, refetchInterval unchanged
  })
}
```

Key constraints on this pattern:

1. **The existing fetch function is renamed, not deleted.** It becomes `fetchXxxFromConsole` (or similar) to preserve readability and git blame. The original logic, including response normalization (snake_case to camelCase), is untouched.
2. **The branching fetcher replaces the original function name.** The hook's `queryFn` reference does not need to change if the branching fetcher takes the original name. Alternatively, the fetch function can keep its original name and the branching logic wraps it. The important thing is: one place branches, and it's above the `useQuery` call.
3. **WS-6.2 Supabase functions must return the same TypeScript type** as the console path. `supabaseIntelFeed()` returns `IntelFeedItem[]`, `supabaseCoverageMapData(filters?)` returns `MapMarker[]`, etc. The hook is the type contract boundary.
4. **No dynamic imports.** Both paths are statically imported. The bundler eliminates the unused path at build time via dead-code elimination on the `DATA_MODE` constant (which is inlined by Next.js as a string literal).

### 4.3 Modify `src/hooks/use-intel-feed.ts`

**Add imports:**
```typescript
import { DATA_MODE } from '@/lib/data-mode'
import { fetchIntelFeedFromSupabase } from '@/lib/supabase/queries'
```

**Rename existing function:**
- `fetchIntelFeed` becomes `fetchIntelFeedFromConsole` (lines 56-67). No other changes to this function.

**Add branching fetcher:**
```typescript
async function fetchIntelFeed(): Promise<IntelFeedItem[]> {
  if (DATA_MODE === 'supabase') {
    return fetchIntelFeedFromSupabase()
  }
  return fetchIntelFeedFromConsole()
}
```

**Hook (`useIntelFeed`):** No changes needed. It already calls `fetchIntelFeed` as its `queryFn`.

### 4.4 Modify `src/hooks/use-coverage-map-data.ts`

**Add imports:**
```typescript
import { DATA_MODE } from '@/lib/data-mode'
import { fetchCoverageMapDataFromSupabase } from '@/lib/supabase/queries'
```

**Rename existing function:**
- `fetchCoverageMapData` becomes `fetchCoverageMapDataFromConsole` (lines 53-89). No other changes.

**Add branching fetcher:**
```typescript
async function fetchCoverageMapData(filters?: CoverageMapFilters): Promise<MapMarker[]> {
  if (DATA_MODE === 'supabase') {
    return fetchCoverageMapDataFromSupabase(filters)
  }
  return fetchCoverageMapDataFromConsole(filters)
}
```

**Hook (`useCoverageMapData`):** No changes needed. The `queryFn` arrow function `() => fetchCoverageMapData(filters)` already calls the correct name.

**Note on filter passthrough:** The `CoverageMapFilters` interface is passed to both the console and Supabase paths. WS-6.2 is responsible for translating these filters into Supabase query conditions (`.eq('category', filters.category)`, `.gte('ingested_at', filters.startDate)`, etc.).

### 4.5 Modify `src/hooks/use-coverage-metrics.ts`

**Add imports:**
```typescript
import { DATA_MODE } from '@/lib/data-mode'
import { fetchCoverageMetricsFromSupabase } from '@/lib/supabase/queries'
```

**Rename existing function:**
- `fetchCoverageMetrics` becomes `fetchCoverageMetricsFromConsole` (lines 64-103). No other changes. This function's parallel `Promise.all` of two `tarvariGet` calls is entirely console-specific and stays intact.

**Add branching fetcher:**
```typescript
async function fetchCoverageMetrics(): Promise<CoverageMetrics> {
  if (DATA_MODE === 'supabase') {
    return fetchCoverageMetricsFromSupabase()
  }
  return fetchCoverageMetricsFromConsole()
}
```

**Hook (`useCoverageMetrics`):** No changes needed.

**Note:** This is the most complex hook because it currently makes two parallel API calls and aggregates the results. The Supabase path (WS-6.2) may use a different strategy (e.g., a single query against a materialized view, or its own parallel queries against `intel_sources` and `intel_normalized`). This complexity is isolated within `supabaseCoverageMetrics()` and does not affect the hook.

### 4.6 Modify `src/hooks/use-intel-bundles.ts`

**Add imports:**
```typescript
import { DATA_MODE } from '@/lib/data-mode'
import { fetchBundlesFromSupabase } from '@/lib/supabase/queries'
```

**Rename existing functions:**
- `fetchTriagedBundles` becomes `fetchTriagedBundlesFromConsole` (lines 79-85)
- `fetchAllBundles` becomes `fetchAllBundlesFromConsole` (lines 87-90)

**Add branching fetchers:**
```typescript
async function fetchTriagedBundles(): Promise<BundleWithDecision[]> {
  if (DATA_MODE === 'supabase') {
    return fetchBundlesFromSupabase('triaged')
  }
  return fetchTriagedBundlesFromConsole()
}

async function fetchAllBundles(): Promise<BundleWithDecision[]> {
  if (DATA_MODE === 'supabase') {
    return fetchBundlesFromSupabase('all-bundles')
  }
  return fetchAllBundlesFromConsole()
}
```

**Hook (`useIntelBundles`):** No changes needed. The `queryFn` already branches by `viewMode` to call `fetchTriagedBundles()` or `fetchAllBundles()`.

**Design note:** The Supabase path uses a single `supabaseIntelBundles(viewMode)` function that takes the `ViewMode` parameter, while the console path has two separate functions. This is intentional -- the Supabase query functions can share most of their logic (same table, different `.eq('status', ...)` filter), whereas the console path uses different API endpoints. The branching fetchers adapt the console pattern to match the hook's existing call structure.

**`apiToBundle` normalizer:** The `apiToBundle` function (lines 45-73) is only used by the console path. It stays in this file as a console-specific normalizer. The Supabase path has its own normalization in WS-6.2 that maps Supabase `IntelBundleRow` directly to `BundleWithDecision`.

### 4.7 Modify `src/hooks/use-category-intel.ts`

**Add imports:**
```typescript
import { DATA_MODE } from '@/lib/data-mode'
import { fetchCategoryIntelFromSupabase } from '@/lib/supabase/queries'
```

**Rename existing function:**
- `fetchCategoryIntel` becomes `fetchCategoryIntelFromConsole` (lines 62-81). No other changes.

**Add branching fetcher:**
```typescript
async function fetchCategoryIntel(category: string): Promise<CategoryIntelItem[]> {
  if (DATA_MODE === 'supabase') {
    return fetchCategoryIntelFromSupabase(category)
  }
  return fetchCategoryIntelFromConsole(category)
}
```

**Hook (`useCategoryIntel`):** No changes needed. The `queryFn` `() => fetchCategoryIntel(categoryId!)` already uses the correct name.

### 4.8 Modify `src/hooks/use-bundle-detail.ts`

**Add imports:**
```typescript
import { DATA_MODE } from '@/lib/data-mode'
import { fetchBundleDetailFromSupabase } from '@/lib/supabase/queries'
```

**Rename existing function:**
- `fetchBundleDetail` becomes `fetchBundleDetailFromConsole` (lines 46-81). No other changes.

**Add branching fetcher:**
```typescript
async function fetchBundleDetail(bundleId: string): Promise<BundleWithMembers | null> {
  if (DATA_MODE === 'supabase') {
    return fetchBundleDetailFromSupabase(bundleId)
  }
  return fetchBundleDetailFromConsole(bundleId)
}
```

**Hook (`useBundleDetail`):** No changes needed. The `queryFn` `() => fetchBundleDetail(bundleId!)` already uses the correct name.

### 4.9 Update `.env.example`

Add the `NEXT_PUBLIC_DATA_MODE` entry below the existing TarvaRI API URL entry:

```bash
# Data mode: 'console' (TarvaRI API) or 'supabase' (direct Supabase queries)
# Console mode requires TarvaRI backend running. Supabase mode is for static/public builds.
# Defaults to 'console' if omitted.
NEXT_PUBLIC_DATA_MODE=console
```

### 4.10 No Changes to Existing Modules

The following files are explicitly unchanged by this workstream:

| File | Reason |
|------|--------|
| `src/lib/tarvari-api.ts` | Still used by console-mode fetch functions. No modification needed. |
| `src/lib/supabase/client.ts` | Already provides `getSupabaseBrowserClient()`. Used by WS-6.2 query functions, not by hooks directly. |
| `src/lib/supabase/types.ts` | Existing Supabase row types (`IntelBundleRow`, `IntelNormalizedRow`, etc.) are consumed by WS-6.2, not by this workstream. |
| `src/lib/coverage-utils.ts` | Output types (`MapMarker`, `CoverageMetrics`, etc.) are unchanged. Both console and supabase paths produce these types. |
| `src/stores/coverage.store.ts` | Store is unaware of data mode. It consumes hook output, which is mode-agnostic. |
| `src/app/(launch)/page.tsx` | No changes. Components call hooks, hooks branch internally. |

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `src/lib/data-mode.ts` exports `DataMode`, `DATA_MODE`, `isSupabaseMode`, `isConsoleMode`. | Import in a test file or `pnpm typecheck` confirms exports. |
| AC-2 | `DATA_MODE` defaults to `'console'` when `NEXT_PUBLIC_DATA_MODE` is unset. | Remove `NEXT_PUBLIC_DATA_MODE` from `.env.local`, import `DATA_MODE` in a component, verify it equals `'console'` via console.log or test. |
| AC-3 | `DATA_MODE` resolves to `'supabase'` when `NEXT_PUBLIC_DATA_MODE=supabase`. | Set in `.env.local`, restart dev server, verify via console.log or build output inspection. |
| AC-4 | `DATA_MODE` resolves to `'console'` for any value other than `'supabase'` (e.g., `'invalid'`, `''`, `'CONSOLE'`). | Unit test `data-mode.ts` with mocked `process.env`. |
| AC-5 | All 6 hooks (`useIntelFeed`, `useCoverageMapData`, `useCoverageMetrics`, `useIntelBundles`, `useCategoryIntel`, `useBundleDetail`) import from `@/lib/data-mode` and `@/lib/supabase/queries`. | Grep confirms import statements in all 6 files. |
| AC-6 | Console mode (`DATA_MODE='console'`) produces identical behavior to the current codebase. | Run dev server with `NEXT_PUBLIC_DATA_MODE=console` (or unset). All 6 hooks fetch from TarvaRI API. Network tab shows requests to `localhost:8000/console/*`. No requests to Supabase. Functional parity with pre-change behavior. |
| AC-7 | `pnpm typecheck` passes with zero errors. | `pnpm typecheck` exits 0. Both branches in each hook satisfy the same return type. |
| AC-8 | `pnpm build` succeeds in console mode. | `NEXT_PUBLIC_DATA_MODE=console pnpm build` exits 0. |
| AC-9 | `pnpm build` succeeds in supabase mode (requires WS-6.2 stubs or implementation). | `NEXT_PUBLIC_DATA_MODE=supabase pnpm build` exits 0. Note: if WS-6.2 is not yet complete, this can be verified with stub functions that return empty arrays/objects matching the expected types. |
| AC-10 | TanStack Query configuration (queryKey, staleTime, refetchInterval, enabled) is identical in both modes for all 6 hooks. | Code review confirms no query config changes. Diff between pre- and post-change shows only fetch function modifications, not `useQuery` option changes. |
| AC-11 | `.env.example` includes `NEXT_PUBLIC_DATA_MODE=console` with explanatory comment. | File inspection. |
| AC-12 | No hook directly imports from `@/lib/supabase/client`. Hooks import only from `@/lib/supabase/queries`. | Grep confirms no `supabase/client` import in `src/hooks/` files. The Supabase client is an implementation detail of the query functions. |
| AC-13 | `pnpm lint` passes with no new warnings or errors. | `pnpm lint` exits 0. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Use a single `DATA_MODE` constant resolved once at module load, not a function call per fetch. | `NEXT_PUBLIC_*` variables are replaced by the bundler at build time with literal strings. A constant gives the bundler the best chance at dead-code elimination. A function would work but obscures the build-time nature of the decision. | `getDataMode()` function. Rejected: adds indirection without benefit since the value cannot change at runtime. |
| D-2 | Default to `'console'` when `NEXT_PUBLIC_DATA_MODE` is unset. | The current codebase has no `DATA_MODE` env var. All existing deployments and dev setups must continue working without configuration changes. Console mode is the existing behavior. | Default to `'supabase'`. Rejected: would break all existing dev environments. Require explicit setting (throw on missing). Rejected: unnecessary friction for a value with a safe default. |
| D-3 | Branch inside each hook file rather than creating a generic `createDualModeFetcher` abstraction. | Each hook has unique parameters (filters, viewMode, categoryId) and unique normalization. A generic wrapper would need to handle all these signatures via generics, adding complexity without reducing code. The branching pattern is 3-4 lines per hook -- minimal duplication. | Generic `createDualModeFetcher<TParams, TResult>(consoleFn, supabaseFn)`. Rejected: over-abstraction for 5 call sites. The type signatures differ enough that the generic would be harder to read than the explicit branches. |
| D-4 | Rename existing fetch functions to `*FromConsole` rather than wrapping them. | Preserves the original logic untouched (important for git blame and debugging). The new branching function takes the original name, so the hook's `queryFn` reference requires no change. | Keep original name and add a `*FromSupabase` wrapper. Rejected: then the branching logic would need a third function, or the branch would be inlined in the queryFn, which would be harder to read. Inline the branch in the `queryFn` directly. Rejected: clutters the `useQuery` options object. |
| D-5 | Static imports for both paths (no dynamic `import()`). | Next.js build-time constant replacement ensures the bundler can tree-shake the unused path. Dynamic imports add async complexity to `queryFn` (which is already async, but the conditional `await import()` is harder to reason about and harder for the bundler to optimize). Static imports are simpler and achieve the same dead-code elimination result. | Dynamic `import()` to avoid loading Supabase client in console builds. Rejected: the Supabase client module (`@supabase/supabase-js`) is already in the dependency tree via `src/lib/supabase/client.ts`. Dynamic import would not reduce bundle size meaningfully and adds complexity. |
| D-6 | One `supabaseIntelBundles(viewMode)` function rather than separate `supabaseTriagedBundles` / `supabaseAllBundles`. | The Supabase queries against `intel_bundles` differ only by a `.eq('status', 'approved')` filter. A single function with a `viewMode` parameter is cleaner. The console path has two functions because the API endpoint accepts `status` as a query param, but the two console functions already duplicate most of their logic. | Two separate Supabase functions mirroring the console pattern. Rejected: unnecessary duplication. The hook's existing `if (viewMode === 'triaged')` / `if (viewMode === 'all-bundles')` branching handles dispatch; the Supabase function handles the query variation internally. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | Should supabase mode disable refetchInterval entirely (since the public viewer is read-only and polling a cloud database may be unnecessary)? Or should polling remain to show near-real-time updates? | Product | Phase 6 (WS-6.1 implementation) |
| Q-2 | If WS-6.2 is not complete when WS-6.1 is implemented, should the supabase query functions be stubbed (return empty arrays) or should WS-6.1 be sequenced strictly after WS-6.2? | react-developer | Phase 6 planning |
| Q-3 | Are there additional hooks beyond the 6 identified (useIntelFeed, useCoverageMapData, useCoverageMetrics, useIntelBundles, useCategoryIntel, useBundleDetail) that fetch from the TarvaRI API and need branching? A grep for `tarvariGet` should confirm. | react-developer | Pre-implementation check |
| Q-4 | Should `data-mode.ts` log a console warning in development when `NEXT_PUBLIC_DATA_MODE` is set to an unrecognized value (e.g., `'postgrest'`), or silently default? | react-developer | Implementation |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-6.2 is not yet delivered when WS-6.1 implementation begins, causing import errors from `@/lib/supabase/queries`. | Medium | Low | Implement WS-6.1 with a stub `queries.ts` that exports all 5 functions with correct type signatures but throws `new Error('Supabase queries not yet implemented')`. Replace stubs when WS-6.2 delivers. `pnpm typecheck` and `pnpm build` will pass in console mode regardless. |
| R-2 | Dead-code elimination does not remove the unused branch, inflating bundle size in one mode. | Low | Low | `NEXT_PUBLIC_*` variables are replaced by Next.js at build time with string literals. The conditional `if ('console' === 'supabase')` is trivially eliminated by any minifier. Verify with `pnpm build && npx @next/bundle-analyzer` that `@supabase/supabase-js` is not in the console build's client chunks (and `tarvari-api.ts` is not in the supabase build's chunks). If tree-shaking is incomplete, consider dynamic `import()` as a fallback (see D-5). |
| R-3 | A future workstream adds a new hook that calls `tarvariGet` but forgets to add the data mode branch. | Medium | Medium | Document the pattern in `data-mode.ts` JSDoc and in the project CLAUDE.md (under Conventions). Add a grep-based lint check in CI: `grep -r 'tarvariGet' src/hooks/ --files-with-matches` should return 0 results in supabase-mode builds (or be explicitly flagged). Alternatively, Q-3's pre-implementation grep establishes the baseline. |
| R-4 | Supabase query functions return data with subtle type differences (e.g., `null` where the console path returns `''`), causing runtime errors in downstream components. | Medium | Medium | WS-6.2 acceptance criteria must include type-level parity tests: for each function, verify the return value satisfies the hook's existing exported type (`IntelFeedItem[]`, `MapMarker[]`, etc.) via TypeScript. Integration tests should render a component in supabase mode and verify no runtime errors. |
| R-5 | The `NEXT_PUBLIC_DATA_MODE` env var is accidentally committed to `.env.local` as `'supabase'` in a developer's environment, causing the dev server to attempt Supabase queries without the backend running. | Low | Low | Default is `'console'`, which matches current behavior. `.env.local` is gitignored. `.env.example` documents the default. The failure mode (Supabase queries against public views that may not exist locally) would produce clear error messages from the Supabase client. |
| R-6 | TypeScript cannot verify that the supabase and console branches return identical types if WS-6.2 functions use `any` or loose typing. | Low | High | WS-6.2 functions must have explicit return types matching the hook's output type (e.g., `supabaseIntelFeed(): Promise<IntelFeedItem[]>`). The hook's `useQuery<IntelFeedItem[]>` generic enforces that both branches satisfy the constraint. TypeScript strict mode prevents silent type widening. |
