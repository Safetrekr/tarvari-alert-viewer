# Phase 5 Overview -- Enhanced Filters

> **Synthesized by:** CTA + SPO + STW + PMO
> **Date:** 2026-03-05
> **Workstreams:** WS-5.1 through WS-5.2
> **Phase prerequisite:** Phase 0 (WS-0.2 OperationalPriority type) complete
> **Backend dependency:** Phase B (B.3 -- `bbox` and `source_key` query parameters on `/console/coverage/map-data`)

---

## 1. Executive Summary

Phase 5 delivers geographic and source-based server-side filtering to the TarvaRI Alert Viewer's map data layer and district view. It is the smallest phase in the project plan (2 workstreams: 1S + 1M) with an estimated effort of 1-2 developer-days.

The phase is structured as a clean two-layer stack. The **data plumbing layer** (WS-5.1) extends the existing `useCoverageMapData` hook with two new optional filter parameters -- `bbox` (a geographic bounding box as a `[west, south, east, north]` 4-tuple) and `sourceKey` (an intel source identifier) -- passing them through to the backend API as `bbox` and `source_key` query strings. This workstream touches a single file (~12 lines added) and has zero visual impact. The **UI layer** (WS-5.2) builds a "FILTERS" toggle button in the district view header that reveals an expandable glass-material panel containing a source selector dropdown and a viewport-based bbox toggle. The filter panel introduces three new coverage store fields, a new `useMapBbox` hook for debounced viewport tracking, and map ref forwarding from `CoverageMap` to the consuming filter panel.

One cross-workstream conflict was identified: WS-5.2's type specifications use inline `[number, number, number, number]` tuples in multiple locations rather than importing WS-5.1's exported `BBox` type alias. This is a specification inconsistency, not an architectural disagreement. The resolution is straightforward -- WS-5.2 should import and use `BBox` everywhere it references the bounding box 4-tuple.

The phase's primary risk is backend readiness. Both workstreams depend on backend Phase B.3 adding `bbox` and `source_key` support to `/console/coverage/map-data`. However, both SOWs are designed for safe degradation: WS-5.1's hook sends unsupported query parameters that the backend silently ignores (standard HTTP behavior), and WS-5.2's filter controls render and store state regardless of whether the API honors the filter values. The entire phase can be built, merged, and used before the backend catches up -- filters will "activate" without any frontend change when B.3 lands.

Estimated total effort: 1.5-2.0 developer-days for a single developer. WS-5.1 has no intra-phase dependencies and should be built first (0.5 day). WS-5.2 follows immediately, consuming WS-5.1's type exports and hook extensions (1.0-1.5 days).

---

## 2. Key Findings

Findings are grouped by theme, not by workstream.

### Data Architecture

- **Pure data plumbing with zero behavioral change.** WS-5.1 is exclusively additive -- two optional fields on an existing interface and two lines of param-building logic. No new files, no deleted files, no changes to the GeoJSON parsing, `MapMarker` mapping, or query key structure. The `CoverageMapFilters` interface is widened, not modified. All existing consumers (`page.tsx`, `CategoryDetailScene.tsx`) continue to work without changes because the new fields are optional.

- **TanStack Query structural comparison handles new cache dimensions automatically.** The existing query key `['coverage', 'map-data', filters]` already uses deep structural comparison on the `filters` object. Adding `bbox` and `sourceKey` to the filters object creates distinct cache entries for each unique filter combination without any key structure change. This is a significant architectural advantage -- no query invalidation patterns need updating.

- **Bbox serialization follows OGC/GeoJSON conventions.** The `BBox` type is a named tuple `[west: number, south: number, east: number, north: number]` matching the `[minLng, minLat, maxLng, maxLat]` convention from GeoJSON and OGC WFS. Serialization is `filters.bbox.join(',')` producing a single `bbox=west,south,east,north` query parameter. This is the de facto standard for spatial APIs and aligns with the expected backend Phase B.3 contract.

- **Bbox values are transient, not stored in global state.** WS-5.2 D-1 makes a deliberate decision: the boolean "is bbox filtering enabled" lives in the Zustand coverage store, but the actual 4-tuple coordinates live in a `useRef` managed by the `useMapBbox` hook. This prevents rapidly-changing viewport coordinates (which update on every pan/zoom gesture) from triggering re-renders across unrelated store subscribers. The hook returns a debounced bbox value that the consuming component passes directly into the `useCoverageMapData` filter.

- **Single-source API contract.** WS-5.1 defines `sourceKey` as a single string, not an array. WS-5.2's source selector is single-select. This matches the API contract (single `source_key` query parameter). Multi-source selection is explicitly deferred as an API-level change (WS-5.1 OQ-3).

### Visual & Interaction Design

- **Filter panel uses glass-material aesthetic.** The `DistrictFilterPanel` continues the Tarva visual language: `backdrop-blur-[16px]`, `backdrop-saturate-[130%]`, `rgba(255, 255, 255, 0.04)` background, `rgba(255, 255, 255, 0.06)` border. Entry/exit animations via `motion/react` (200ms slide-down in, 150ms slide-up out). This matches the existing district view header and dock panel styling.

- **Power-user positioning.** The filter panel is hidden by default (WS-5.2 Section 1: "Tier 3 -- Available"). The FILTERS toggle button is a small mono-text element in the district header, and the active-filter indicator is a subtle 4px dot. This deliberately avoids drawing attention from the primary map and alert list content. Users must opt into filtering, consistent with the project's discovery analysis tiering.

- **Custom dropdown for source selector.** WS-5.2 D-5 rejects native `<select>` elements for styling limitations and specifies a custom dropdown with status dots (green/blue/yellow/gray for source status). The dropdown lists sources filtered to the current category from `useCoverageMetrics().sourcesByCoverage`. If the `@tarva/ui` library includes a Select/Dropdown primitive, it should be preferred over a fully custom implementation (WS-5.2 OQ-4).

- **z-index 33 placement.** The filter panel slots between district content (z-30), dock panel (z-31), header elements (z-32), and triage panel (z-45). This positions it as secondary navigation chrome -- more prominent than the scene content but less prominent than detail overlays.

### State Architecture

- **Three new coverage store fields.** `districtSourceFilter: string | null` (selected source), `districtBboxEnabled: boolean` (bbox toggle state), and three actions (`setDistrictSourceFilter`, `setDistrictBboxEnabled`, `clearDistrictFilters`). All follow the existing Immer `set` pattern. No `persist` middleware -- these are district-view-transient state.

- **Automatic cleanup on district exit.** `clearDistrictFilters()` is called during the `leaving-district` morph phase transition, ensuring stale filter state does not carry into subsequent district visits. This is consistent with `selectedAlertId` being cleared on exit. WS-5.2 D-4 documents the rationale: source filters are category-specific (a source valid for "Seismic" may not exist in "Weather"), so clearing is safer than persisting.

- **No URL synchronization.** District filters are transient (cleared on exit). URL sync is not needed for a sub-view that is already navigation-transient. This is consistent with the `selectedBundleId` and `selectedMapAlertId` patterns which are also session-transient and not URL-synced.

### Performance Considerations

- **Debounce prevents API flooding.** WS-5.2 D-6 specifies a 300ms debounce on `moveend` events for bbox updates. At this interval, a 2-second pan generates at most 6-7 API calls, which is acceptable API load. The `useMapBbox` hook handles debouncing internally -- the consuming component receives a stable, debounced bbox value.

- **`keepPreviousData` prevents visual gaps.** When bbox filtering is enabled and the user pans, each debounced bbox update triggers a new query with a new cache key. `placeholderData: keepPreviousData` keeps the previous marker set rendered while the new query resolves, preventing empty-flash during panning. This is the same TanStack Query v5 feature used by `useLatestGeoSummary` in Phase 4.

- **`moveend` event avoids excessive handler invocations.** WS-5.2 D-7 selects `moveend` over `move` because `move` fires continuously during pan (many times per frame). Combined with 300ms debounce, `moveend` captures the final resting position efficiently.

---

## 3. Cross-Workstream Conflicts

One conflict identified. It is a specification inconsistency resolvable at implementation time without architectural changes.

### Conflict 1: WS-5.2 uses inline tuple types instead of WS-5.1's `BBox` type alias

**SOWs involved:** WS-5.1, WS-5.2

**WS-5.1 specifies (Section 4.1):**
> `export type BBox = [west: number, south: number, east: number, north: number]` -- a named tuple type alias exported from `src/hooks/use-coverage-map-data.ts` for downstream consumption.

**WS-5.2 specifies (Sections 4.5, 4.6):**
> `UseMapBboxReturn.bbox` typed as `[number, number, number, number] | null` (unnamed 4-tuple).
> `DistrictFilterPanelProps.onBboxChange` typed as `(bbox: [number, number, number, number] | null) => void`.
> `CategoryDetailScene` integration example uses `currentBbox` without referencing the `BBox` type.

**Nature of conflict:** WS-5.1 exports a named tuple type alias specifically designed for WS-5.2 consumption (Section 4.6 export table: "Consumers: WS-5.2"). WS-5.2 uses structurally identical but nominally distinct inline 4-tuples in three locations. TypeScript treats these as structurally compatible, so no compilation error occurs. However, using the exported `BBox` type provides (a) named tuple elements (`west:`, `south:`, etc.) for IDE documentation, (b) a single refactor point if the type ever changes, and (c) explicit dependency traceability between the two workstreams.

**Resolution:** WS-5.2's `useMapBbox` hook, `DistrictFilterPanelProps`, and `CategoryDetailScene` integration should import `BBox` from `use-coverage-map-data.ts` and use `BBox | null` instead of `[number, number, number, number] | null`. This is a type import change with no runtime impact.

**Owner:** react-developer, resolved during WS-5.2 implementation (WS-5.1 is built first, so the `BBox` export is available).

---

## 4. Architecture Decisions

Consolidated from both workstreams. Decisions are grouped thematically.

| ID | Decision | Source | Rationale |
|----|----------|--------|-----------|
| **Data Layer** | | | |
| WS-5.1 D-1 | `BBox` type is a named tuple `[west: number, south: number, east: number, north: number]`, not an object. | WS-5.1 | Tuples serialize naturally with `.join(',')` to produce the comma-separated bbox query parameter format. Named elements provide IDE documentation. Matches GeoJSON/OGC `[minLng, minLat, maxLng, maxLat]` convention. |
| WS-5.1 D-2 | `BBox` type defined in the hook file (`use-coverage-map-data.ts`), not in `interfaces/coverage.ts`. | WS-5.1 | Follows established pattern: types live with their producing/consuming hook. `CoverageMapFilters` is already in this file. If `BBox` is later needed by unrelated modules, extract to `interfaces/`. |
| WS-5.1 D-3 | Bbox serialized as single comma-separated `bbox=west,south,east,north` parameter. | WS-5.1 | OGC/Mapbox/PostGIS de facto standard. Single parameter is simpler to log, debug, and reproduce in curl. Matches expected backend Phase B.3 contract. |
| WS-5.1 D-4 | `sourceKey` (camelCase) mapped to `source_key` (snake_case) for API. | WS-5.1 | Consistent with `startDate`->`start_date`, `endDate`->`end_date`, and all other camelCase-to-snake_case mappings in the codebase. |
| WS-5.1 D-5 | No query key structure change. Structural comparison of `filters` object handles new fields. | WS-5.1 | Adding fields to `CoverageMapFilters` is handled identically by TanStack Query's deep comparison. Avoids breaking existing invalidation patterns. |
| WS-5.1 D-6 | No debouncing in the hook. Callers are responsible for debouncing bbox updates. | WS-5.1 | Hook is a stateless data-fetching primitive. Debouncing is a UI concern. WS-5.2 handles it via the `useMapBbox` hook (300ms debounce). |
| **State Architecture** | | | |
| WS-5.2 D-1 | Bbox-enabled boolean in Zustand; actual bbox coordinates in `useRef` + hook-local state. | WS-5.2 | Bbox 4-tuple changes on every pan/zoom (potentially dozens of times per second before debouncing). Storing in Zustand would trigger re-renders across all store subscribers. Boolean flag changes rarely and is readable by the FILTERS toggle indicator in a different component tree branch. |
| WS-5.2 D-4 | Clear district filters on exit (not persist across visits). | WS-5.2 | Source filters are category-specific. A source valid for "Seismic" is meaningless in "Weather." Clearing on exit provides a clean slate. Users can re-enable in two clicks. |
| **Visual Design** | | | |
| WS-5.2 D-2 | Filter panel as fixed-position overlay below header, not inside scene content area. | WS-5.2 | Panel governs data that flows into the scene but is not part of the scene's layout. Fixed positioning avoids disrupting the two-column CSS Grid layout. |
| WS-5.2 D-3 | Single-select source filter (not multi-select). | WS-5.2 | WS-5.1 API contract passes a single `source_key` string. Multi-select would require API changes, multiple API calls, or client-side filtering -- all outside scope. |
| WS-5.2 D-5 | Custom dropdown component (not native `<select>`) for source selector. | WS-5.2 | Native `<select>` cannot be styled for glass aesthetic. Source list includes status dots requiring custom rendering. If `@tarva/ui` has a Select primitive, prefer it. |
| WS-5.2 D-6 | Debounce bbox updates at 300ms. | WS-5.2 | Balance between responsiveness (user perceives near-real-time updates) and API load (max ~3 calls/second). `keepPreviousData` prevents visual gaps between refetches. |
| WS-5.2 D-7 | Use `moveend` event (not `move`) for bbox subscription. | WS-5.2 | `move` fires continuously during pan. `moveend` fires once after gesture completes. More efficient combined with debounce. |
| WS-5.2 D-8 | Filter panel z-index 33. | WS-5.2 | Between district content (z-30), dock (z-31), header (z-32), and triage panel (z-45). Positions filter panel as secondary chrome. |

---

## 5. Cross-Workstream Dependencies

```
Phase 0 Deliverables
  WS-0.2 (OperationalPriority type) ──────────────┐
                                                   |
Backend Phase B.3 ────────────────────────────┐    |
  (/console/coverage/map-data bbox+source_key) |    |
                                              |    |
                                              v    v
                                    WS-5.1 (Hook Extension)
                                              |
                                              | exports: BBox type,
                                              | CoverageMapFilters (widened),
                                              | fetchCoverageMapData (extended)
                                              |
                                              v
                                    WS-5.2 (Filter UI)
                                              |
                                              | imports: BBox, CoverageMapFilters
                                              | extends: coverage.store.ts
                                              | creates: useMapBbox hook,
                                              |          DistrictFilterPanel component
                                              v
                                         (Done)
```

**Detailed dependency table:**

| Upstream | Downstream | What Is Needed | Nature |
|----------|-----------|----------------|--------|
| WS-0.2 | WS-5.1 | Phase 0 complete (foundational types in place). No direct type import, but build order requires Phase 0 first. | Soft -- no type dependency, sequencing only |
| Backend B.3 | WS-5.1 | `bbox` and `source_key` query parameter support on `/console/coverage/map-data` | Soft -- hook sends params regardless; backend ignoring them is safe fallback |
| Backend B.3 | WS-5.2 | Same endpoint support, so filter controls produce visible results | Soft -- filters render and store state regardless of backend readiness |
| WS-5.1 | WS-5.2 | `BBox` type export, `CoverageMapFilters` interface with `bbox` and `sourceKey` fields, `fetchCoverageMapData` passing those params to the API | Hard -- WS-5.2 constructs filter objects and passes bbox tuples typed as `BBox` |
| `CoverageMap` component | WS-5.2 | Map ref forwarding via optional `mapRef` prop to access `MapRef.getBounds()` | Hard -- WS-5.2 modifies `CoverageMapProps` interface |
| `useCoverageMetrics` hook | WS-5.2 | `sourcesByCoverage` data for populating the source selector dropdown | Available -- already implemented |
| Morph state machine (`ui.store.ts`) | WS-5.2 | `leaving-district` phase transition triggers `clearDistrictFilters()` | Coordination -- WS-5.2 hooks into existing morph lifecycle |

**Critical path:** WS-5.1 -> WS-5.2 (simple linear dependency)

**External dependencies:**

| Dependency | Required By | Status | Risk |
|------------|-------------|--------|------|
| Phase 0 complete | WS-5.1 | Phase 0 deliverable | LOW -- Phase 5 starts after Phase 0 per sequencing |
| Backend Phase B.3 | Both | Backend work, status unknown | HIGH for filtering to actually work, NONE for frontend build -- params sent but safely ignored |
| `useCoverageMetrics().sourcesByCoverage` | WS-5.2 | Available in codebase | LOW -- already implemented and fetching data |

---

## 6. Consolidated Open Questions

Questions from both workstreams, deduplicated and grouped. Blocking questions are flagged.

### BLOCKING -- must be resolved before implementation can be fully validated

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-B1 | What is the exact `bbox` query parameter format expected by backend Phase B.3? WS-5.1 assumes `bbox=west,south,east,north` as a single comma-separated parameter (OGC convention). The backend may expect a different format (e.g., `bbox[]=west&bbox[]=south...` or `min_lng=&min_lat=&max_lng=&max_lat=`). | WS-5.1 OQ-1 | Backend team |
| OQ-B2 | Does the backend accept `source_key` as a query parameter on `/console/coverage/map-data`? The endpoint currently may only support `category`, `severity`, `start_date`, `end_date`. Backend Phase B.3 must confirm `source_key` filtering is supported on this specific endpoint. | WS-5.1 OQ-2 | Backend team |

### NON-BLOCKING -- can be resolved during or after implementation

**API contract questions:**

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-1 | Should the hook accept multiple `sourceKey` values (array) for multi-source filtering? Currently single-select. WS-5.2's source selector is single-select. If multi-select is needed later, field type changes to `string[]`. | WS-5.1 OQ-3 | react-developer |
| OQ-2 | Does the backend validate bbox coordinate ranges (longitude -180 to 180, latitude -90 to 90)? MapLibre's `getBounds()` can return longitudes outside -180/180 for maps panned across the antimeridian. | WS-5.1 OQ-4 | Backend team / react-developer |

**Filter behavior questions:**

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-3 | Should the source filter also apply to the `AlertList` (via `useCategoryIntel`), not just map markers? If the user filters the map to source X, seeing all sources in the alert list may be confusing. Requires `useCategoryIntel` to accept `source_key` param and backend `/console/intel` to support it. | WS-5.2 OQ-1 | react-developer |
| OQ-4 | Should the bbox filter also apply to the `AlertList`? Requires `useCategoryIntel` bbox support and backend endpoint changes or client-side coordinate filtering. `CategoryIntelItem` does not currently carry coordinate data. | WS-5.2 OQ-2 | react-developer |
| OQ-5 | Should the filter panel include a count annotation (e.g., "12 markers shown") to confirm filter impact? The map shows marker counts implicitly, but explicit feedback would confirm the filter is working, especially for bbox where the difference may be subtle. | WS-5.2 OQ-3 | react-developer |

**Component implementation questions:**

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-6 | If `@tarva/ui` includes a Select/Dropdown primitive, should WS-5.2 use it instead of building a custom dropdown? Using the design system primitive would be more consistent but may require adaptation for status dot rendering. | WS-5.2 OQ-4 | react-developer |
| OQ-7 | Should the bbox toggle show a visual indicator on the map itself (e.g., subtle border or shaded area)? Since the bbox IS the viewport, this is somewhat redundant, but it would distinguish "no markers in area" from "filter is off." | WS-5.2 OQ-5 | react-developer |

**Summary:** Two blocking questions (OQ-B1 and OQ-B2) require backend team confirmation of the exact `bbox` and `source_key` query parameter formats before implementation can be fully validated. Both questions have low-risk mitigation paths -- the serialization logic is a 1-3 line change if the format differs from the assumed OGC convention. All other questions are non-blocking and can be resolved during implementation.

---

## 7. Phase Exit Criteria

All criteria must pass before Phase 5 is considered complete.

| ID | Criterion | Verification |
|----|-----------|-------------|
| PE-1 | `BBox` type alias is exported from `src/hooks/use-coverage-map-data.ts` as `[west: number, south: number, east: number, north: number]` with JSDoc. | Code review + `pnpm typecheck`. |
| PE-2 | `CoverageMapFilters` interface includes optional `bbox?: BBox` field. | Code review. |
| PE-3 | `CoverageMapFilters` interface includes optional `sourceKey?: string` field. | Code review. |
| PE-4 | When `filters.bbox` is provided, API request URL includes `bbox=west,south,east,north` (comma-separated). | Manual test: log URL in `tarvariGet`, pass bbox filter, verify URL. |
| PE-5 | When `filters.sourceKey` is provided, API request URL includes `source_key=<value>`. | Manual test: same as PE-4. |
| PE-6 | When `filters.bbox` is `undefined`, no `bbox` query parameter appears in request URL. | Code review of the `if (filters?.bbox)` guard. |
| PE-7 | When `filters.sourceKey` is `undefined`, no `source_key` query parameter appears in request URL. | Code review of the `if (filters?.sourceKey)` guard. |
| PE-8 | Existing consumers (`page.tsx`, `CategoryDetailScene.tsx`) work without changes. | `pnpm typecheck` passes; manual smoke test of main page and district view. |
| PE-9 | Query key produces distinct cache entries for different bbox/sourceKey values. | TanStack Query DevTools or separate network requests for different filter combinations. |
| PE-10 | "FILTERS" toggle button appears in district view header, positioned right of category name and clear of dock panel. | Visual inspection in district view. |
| PE-11 | Clicking FILTERS toggles an expandable filter panel with glass-material styling. | Manual interaction test. |
| PE-12 | Filter panel contains a source selector dropdown and a bbox toggle. | Visual inspection. |
| PE-13 | Source selector lists sources for the current category, sourced from `useCoverageMetrics`. | Open dropdown; verify list matches category sources. |
| PE-14 | Selecting a source updates map markers (when backend B.3 is available). Selecting "All Sources" clears the filter. | Select source; verify map markers change (or verify `source_key` param in network request). |
| PE-15 | Bbox toggle is labeled "Filter to Viewport" and is off by default. | Visual inspection on first district entry. |
| PE-16 | Enabling bbox toggle constrains map data to current viewport bounds (when backend B.3 is available). | Enable toggle; verify `bbox` param in network request. |
| PE-17 | Panning/zooming with bbox enabled auto-updates filtered data (debounced at ~300ms). | Pan map with bbox on; verify marker set updates after brief delay. |
| PE-18 | Disabling bbox toggle removes bbox from query, restoring full dataset. | Toggle bbox off; verify `bbox` param disappears from request. |
| PE-19 | Active-filter indicator (4px dot) appears on FILTERS button when any filter is active. | Activate a filter, close panel, verify dot visible. |
| PE-20 | All district filters are cleared when navigating back from district view. | Activate filters, click back, re-enter same district, verify filters are off. |
| PE-21 | `districtSourceFilter` and `districtBboxEnabled` exist on coverage store with correct types and defaults (`null`, `false`). | `pnpm typecheck`; store inspection in React DevTools. |
| PE-22 | `clearDistrictFilters()` resets both fields to defaults. | Manual verification via React DevTools. |
| PE-23 | FILTERS button has `aria-expanded` reflecting panel state and `aria-controls` pointing to panel ID. | DOM inspection. |
| PE-24 | Source dropdown is keyboard-accessible (ArrowUp/ArrowDown, Enter, Escape). | Keyboard navigation test. |
| PE-25 | Filter panel has `role="region"` and `aria-label="District view filters"`. | DOM inspection. |
| PE-26 | Previous marker data is shown during bbox refetch (no empty flash during panning). | Pan with bbox enabled; observe no flicker. |
| PE-27 | `useMapBbox` hook exists at `src/hooks/use-map-bbox.ts`, returns `{ bbox: BBox | null }`, subscribes to `moveend` events when enabled, debounces at ~300ms. | Code review. |
| PE-28 | `CoverageMap` accepts an optional `mapRef` prop for forwarding the `MapRef` instance. | Code review + `pnpm typecheck`. |
| PE-29 | `pnpm typecheck` passes with zero errors. | CLI verification. |
| PE-30 | `pnpm build` completes without errors. | CLI verification. |

---

## 8. Inputs Required by Next Phase

These artifacts or decisions must be finalized during Phase 5 to unblock subsequent work.

| Input | Produced By | Consumed By | Description |
|-------|-------------|-------------|-------------|
| `BBox` type alias | WS-5.1 | Any future feature needing geographic viewport bounds (e.g., map region overlays, bbox filtering on other hooks). | Canonical 4-tuple type for bounding box coordinates. |
| `CoverageMapFilters` (extended) | WS-5.1 | Any component constructing map data queries with bbox or source filters. | Interface contract now includes `bbox` and `sourceKey` fields. |
| `useMapBbox` hook | WS-5.2 | Any future feature needing debounced viewport tracking (e.g., bbox-filtered alert list, viewport-scoped statistics). | Reusable hook for reading and debouncing map viewport bounds. |
| Map ref forwarding pattern | WS-5.2 | Any future feature needing to read `MapRef` state from outside `CoverageMap` (e.g., map annotation tools, region overlay positioning). | Established pattern for exposing `CoverageMap`'s internal `MapRef` via optional prop. |
| `districtSourceFilter` / `districtBboxEnabled` store fields | WS-5.2 | Future district view enhancements (e.g., alert list filtering by source, bbox-scoped statistics panel). | Store interface for district-scoped filter state. |
| `clearDistrictFilters()` action | WS-5.2 | Any code managing district view lifecycle that needs to ensure clean filter state on transitions. | Standard cleanup action for district exit. |
| Validated bbox/source_key API contract | WS-5.1 (via backend B.3 confirmation) | Phase 6 (public deployment may need Supabase equivalents), future filtering features. | Confirmed query parameter format for geographic and source-based server-side filtering. |

---

## 9. Gaps and Recommendations

### Gap 1: WS-5.2 does not use WS-5.1's exported `BBox` type

**Description:** Conflict 1 identifies that WS-5.2 uses inline `[number, number, number, number]` tuples in three locations (`UseMapBboxReturn`, `DistrictFilterPanelProps`, `CategoryDetailScene` integration) rather than importing WS-5.1's exported `BBox` type alias. WS-5.1 explicitly exports `BBox` for WS-5.2 consumption (Section 4.6 export table), but WS-5.2's specifications do not reference this export.

**Recommendation (CTA):** WS-5.2's implementer should `import type { BBox } from '@/hooks/use-coverage-map-data'` and use `BBox | null` in all three locations. This provides named tuple elements for IDE documentation, establishes a single refactor point, and creates explicit dependency traceability. The change is type-level only with no runtime impact.

**Priority:** HIGH -- prevents a nominal type divergence that complicates future refactoring.

### Gap 2: Alert list and map filter mismatch

**Description:** WS-5.2 OQ-1 and OQ-2 identify that the source and bbox filters apply only to the map data (via `useCoverageMapData`), not to the alert list (via `useCategoryIntel`). If a user filters the map to source X, the alert list continues to show all sources. This asymmetry may confuse users who expect the filters to affect all data surfaces in the district view.

**Recommendation (SPO):** Accept this limitation for Phase 5. Extending `useCategoryIntel` with `source_key` and `bbox` params requires backend changes to `/console/intel` and a separate workstream. Document the asymmetry in the filter panel UI: consider a subtle annotation like "Filters apply to map markers only" below the filter controls. If user testing reveals confusion, add a WS-5.3 workstream to extend `useCategoryIntel` with matching filter params.

**Priority:** MEDIUM -- known UX limitation with a clear mitigation path.

### Gap 3: No test infrastructure for Phase 5 deliverables

**Description:** Consistent with Phases 1-4, neither SOW includes a test plan. WS-5.2's coverage store extensions (`setDistrictSourceFilter`, `setDistrictBboxEnabled`, `clearDistrictFilters`) are pure state mutations amenable to unit testing. The `useMapBbox` hook's debounce behavior and event subscription logic would benefit from integration tests.

**Recommendation (PMO):** If Vitest is available, write targeted tests for:
- **WS-5.2 store actions:** `setDistrictSourceFilter` sets value, `setDistrictBboxEnabled` sets boolean, `clearDistrictFilters` resets both to defaults.
- **WS-5.1 serialization:** `fetchCoverageMapData` with bbox produces correct URL; without bbox produces no `bbox` param.

If Vitest is not available, verification is via `pnpm typecheck`, `pnpm build`, and manual testing -- adequate for a 2-workstream phase.

**Priority:** LOW -- small phase with limited blast radius.

### Gap 4: Antimeridian bbox wrapping is unresolved

**Description:** WS-5.1 R-4 identifies that MapLibre's `getBounds()` can return `west > east` when the map spans the antimeridian (e.g., `west: 170, east: -170` for a Pacific-spanning viewport). The backend may not handle wrapped coordinates, and neither SOW specifies a normalization strategy.

**Recommendation (CTA):** For Phase 5, treat this as a non-issue: the alert viewer's primary use case is focused on specific geographic regions, not trans-Pacific views. If an antimeridian case is encountered, the backend receiving `west > east` will likely return no results (empty marker set), which is a safe degradation. If this proves problematic in practice, add a normalization step in `useMapBbox` that splits the query into two non-wrapping boxes or clamps coordinates. Document as a known limitation.

**Priority:** LOW -- edge case with safe degradation behavior.

### Gap 5: Source dropdown data dependency on `useCoverageMetrics`

**Description:** WS-5.2 specifies that the source selector reads from `useCoverageMetrics().data.sourcesByCoverage.filter(s => s.category === categoryId)`. This assumes `sourcesByCoverage` includes a `category` field on each `SourceCoverage` item. The `useCoverageMetrics` hook fetches from `/console/coverage` and `/console/intel` -- the exact shape of `sourcesByCoverage` and whether it includes per-category filtering should be verified against the current implementation.

**Recommendation (STW):** Verify at implementation time that `sourcesByCoverage` provides the necessary data shape. If the current `useCoverageMetrics` response does not include category-scoped sources, the source selector will need to use a different data source or filter client-side based on available source metadata.

**Priority:** MEDIUM -- implementation-time verification needed.

---

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream | Size | Estimate | Complexity Drivers |
|------------|------|----------|--------------------|
| WS-5.1 | S | 0.5 days | Single file modification. ~12 lines added: type alias, 2 interface fields, 2 param-building lines, JSDoc. Zero new files. Zero visual impact. Well-defined scope with clear before/after. |
| WS-5.2 | M | 1.0-1.5 days | New component (`DistrictFilterPanel`), new hook (`useMapBbox`), coverage store extension (3 fields, 3 actions, 3 selectors), map ref forwarding, header modification, overlay integration, custom dropdown with status dots, keyboard accessibility. Multiple files touched (~6). Glass-material styling. Animation. Debounce logic. |

**Total estimate:** 1.5-2.0 developer-days (single developer).

This aligns with the combined-recommendations estimate of "1-2 days" for Phase 5.

### Recommended Sequencing

```
Prerequisite: Phase 0 complete (WS-0.2) + ideally OQ-B1/OQ-B2 answered

Day 1 (morning):
  WS-5.1 -- Extend map data hook with bbox/source params
    - BBox type alias + JSDoc
    - 2 fields on CoverageMapFilters
    - 2 param-building lines in fetchCoverageMapData
    - Module JSDoc update
    - Verify: pnpm typecheck + pnpm build
    - Verify: existing consumers unaffected (smoke test main page + district view)
    - Deliverable: BBox type and extended filters available for WS-5.2

Day 1 (afternoon) through Day 2:
  WS-5.2 -- Filter UI in district view
    Build order within WS-5.2:
    1. Coverage store additions (fields, actions, selectors) -- no UI dependency
    2. useMapBbox hook (debounced viewport tracking) -- needs MapRef type only
    3. CoverageMap mapRef forwarding -- modify CoverageMapProps interface
    4. DistrictFilterPanel component (glass panel, source dropdown, bbox toggle)
    5. FILTERS toggle button in DistrictViewHeader
    6. Integration in CategoryDetailScene (wire filters into useCoverageMapData)
    7. Integration in DistrictViewOverlay (panel visibility, exit cleanup)
    8. keepPreviousData configuration on map data query when bbox is active
    - Verify: pnpm typecheck + pnpm build
    - Verify: all 20 acceptance criteria
```

### Schedule Context

Per the combined-recommendations execution timeline, Phase 5 is scheduled for "Day 7-8: when backend Phase B.3 lands." Phase 5 can also run in parallel with Phase 2 (both depend on backend Phase B, no mutual dependency between them -- noted as a MEDIUM concern in the combined-recommendations Phase 7 validation).

If backend Phase B.3 is delayed, the entire phase can still be built and merged. The filter controls will render, store state will update, and the `bbox`/`source_key` query parameters will be sent to the API. The backend will ignore unrecognized parameters (standard HTTP behavior). When B.3 lands, filtering activates without any frontend change. This zero-risk frontend-first pattern matches WS-5.1 R-1 and WS-5.2 R-2.

### Risk Summary

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backend B.3 not ready | High | None (frontend) | Params sent but ignored; filters activate when B.3 lands |
| Backend bbox format differs from assumed OGC | Medium | Low | 1-3 line serialization change in `fetchCoverageMapData` |
| Excessive cache entries from bbox changes | Medium | Low | TanStack Query `gcTime` evicts stale entries; 300ms debounce limits creation rate |
| MapRef forwarding breaks existing consumers | Low | Low | Optional prop; existing usages unaffected |
| Antimeridian bbox wrapping | Low | Medium | Safe degradation (empty results); document as known limitation |
| Custom dropdown accessibility gaps | Medium | Medium | Implement with ARIA `listbox`/`option` pattern; consider Radix UI `Select` primitive |
| Filter panel overlaps map navigation controls | Medium | Low | Panel positioned below header; MapNavControls positioned within map container at different offset; verify during implementation |
