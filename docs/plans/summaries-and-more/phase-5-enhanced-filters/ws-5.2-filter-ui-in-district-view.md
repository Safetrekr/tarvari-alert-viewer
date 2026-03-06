# WS-5.2: Filter UI in District View

> **Workstream ID:** WS-5.2
> **Phase:** 5 -- Enhanced Filters
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-5.1
> **Blocks:** None
> **Resolves:** None

## 1. Objective

Add a "Filters" toggle to the district view that reveals an expandable panel with two filter controls: (1) a source selector dropdown that filters alerts to a specific intel source, and (2) a bounding-box toggle that, when enabled, constrains the map data query to the current map viewport and auto-updates on pan/zoom. These filters flow through the enhanced `useCoverageMapData` params introduced by WS-5.1 (bbox 4-tuple and `source_key` string), sending server-side filter requests rather than filtering client-side. The filter panel is hidden by default, matching the "power-user feature" positioning established in the project's discovery analysis (Tier 3 -- Available).

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Filters toggle button | A "FILTERS" button added to the `DistrictViewHeader` component, positioned between the category name label and the dock panel side. Toggles the filter panel visibility. Badge indicator when any filter is active. |
| Filter panel component | `DistrictFilterPanel` -- a glass-material panel that slides down from the header area when the toggle is active. Contains the source selector and bbox toggle. Positioned as a fixed overlay at z-index 33 (above district content at z-30, below triage panel at z-45). |
| Source selector | A custom dropdown listing all known sources for the current category. Data sourced from `useCoverageMetrics().sourcesByCoverage` filtered by category. Single-select with an "All Sources" default option. Selection stored in coverage store and passed as `source_key` to the map data hook. |
| Bbox toggle | A toggle switch labeled "Filter to Viewport" with a brief description. When enabled, reads the current MapLibre map bounds via `mapRef.getBounds()` and passes a `[west, south, east, north]` 4-tuple to the map data hook. Auto-updates on `moveend` events (debounced at 300ms). When disabled, bbox param is omitted (full global data). |
| Map ref forwarding | Expose a callback ref or imperative handle from `CoverageMap` that allows the filter panel to read current map bounds and subscribe to `moveend` events. The map component already holds a `MapRef` internally; this workstream adds a mechanism for the parent to access viewport bounds. |
| Coverage store additions | `districtSourceFilter: string | null` and `districtBboxEnabled: boolean` added to `CoverageState`. Actions: `setDistrictSourceFilter(sourceKey: string | null)`, `setDistrictBboxEnabled(enabled: boolean)`, `clearDistrictFilters()`. |
| Filter clearing on exit | When the morph state machine transitions to `leaving-district`, all district-scoped filters are cleared (`clearDistrictFilters()`) to prevent stale filter state from carrying into subsequent district visits. |
| Active filter indicator | When any district filter is active (source selected or bbox enabled), a small dot indicator appears on the FILTERS toggle button to signal active filtering without requiring the panel to be open. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Time range filtering in district view | The `TimeRangeSelector` already exists on the main page. Integrating it into the district filter panel would add scope. Can be considered in a follow-up. |
| Priority filtering in district view | WS-1.4 defines the priority filter separately. The district filter panel focuses on the two new WS-5.1 params (bbox, source). |
| Multi-source selection | Single-select source filtering keeps the UX simple and matches the API contract from WS-5.1 (single `source_key` param). Multi-select would require API changes or client-side filtering. |
| Severity filtering | The severity breakdown chart already provides visual filtering context. Adding severity to the filter panel is deferred. |
| AlertList filtering by source/bbox | The district filter panel filters the map data (via `useCoverageMapData`). Whether the `AlertList` (powered by `useCategoryIntel`) should also accept these filters is an open question. The alert list fetches all items for the category and sorts/displays them. Adding bbox/source filtering to the alert list would require extending `useCategoryIntel` with those params, which is outside WS-5.1 scope. |
| Persisting filter state in URL | District filters are transient (cleared on exit). URL sync is not needed for a sub-view that is already navigation-transient. |
| Draw-a-box manual bbox selection | The discovery analysis mentioned "draw-a-box or radius tool." This workstream implements viewport-based bbox (simpler, automatic). Manual drawing tools are deferred. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-5.1 `bbox` and `source_key` params on `useCoverageMapData` | The `CoverageMapFilters` type extended with `bbox?: [number, number, number, number]` (west, south, east, north) and `sourceKey?: string`. The `fetchCoverageMapData` function passes these through to `/console/coverage/map-data?bbox=...&source_key=...`. | Draft SOW expected, not yet implemented |
| Backend Phase B.3 enhanced filter params | The `/console/coverage/map-data` endpoint must accept `bbox` (comma-separated 4-tuple) and `source_key` query parameters and return filtered GeoJSON. Without this, the params are sent but ignored. | Backend dependency, status unknown |
| `CoverageMap` MapRef access | The `CoverageMap` component holds a `useRef<MapRef>(null)` internally. This workstream needs to either forward this ref or expose a bounds-reading callback. The existing component does not expose the ref. | Available -- requires modification |
| `useCoverageMetrics` source data | `useCoverageMetrics().data.sourcesByCoverage` provides `SourceCoverage[]` with `sourceKey`, `name`, `category`, `status`. Used to populate the source selector dropdown. Already implemented and available. | Available |
| `DistrictViewHeader` component | The existing header renders the category name (top center) and a back button (left side, vertically centered). The FILTERS toggle will be added to this component's top strip. | Available -- reviewed |
| `DistrictViewOverlay` component | The overlay manages district view lifecycle (enter/exit), selected alert state, and renders the header, content, and dock. Filter panel insertion and exit-time cleanup will hook into this component. | Available -- reviewed |

## 4. Deliverables

### 4.1 Coverage Store Additions

Add three state fields to `CoverageState` in `coverage.store.ts`:

```
districtSourceFilter: string | null
districtBboxEnabled: boolean
```

Initialized to `null` and `false` respectively. No `persist` middleware -- these are district-view-transient state, cleared on every district exit.

Note: The actual bbox 4-tuple (`[west, south, east, north]`) is NOT stored in Zustand. It is derived in real-time from the map's current viewport bounds and stored in a `useRef` within the component tree. Storing a rapidly-changing value (updates on every pan/zoom) in a global store would cause unnecessary re-renders across unrelated subscribers. The store only holds the boolean "is bbox filtering enabled," and the component holding the map ref reads the bounds imperatively when constructing the query.

### 4.2 Coverage Store Actions

Add three actions to `CoverageActions`:

| Action | Signature | Behavior |
|--------|-----------|----------|
| `setDistrictSourceFilter` | `(sourceKey: string \| null) => void` | Set the source filter for district view. `null` = no filter (all sources). |
| `setDistrictBboxEnabled` | `(enabled: boolean) => void` | Toggle bounding-box filtering. When toggled off, any pending debounced bbox update is implicitly abandoned (the component effect handles this). |
| `clearDistrictFilters` | `() => void` | Reset both `districtSourceFilter` to `null` and `districtBboxEnabled` to `false`. Called on district exit. |

Implementation uses the existing Immer `set` pattern:

```
setDistrictSourceFilter: (sourceKey) =>
  set((state) => { state.districtSourceFilter = sourceKey }),

setDistrictBboxEnabled: (enabled) =>
  set((state) => { state.districtBboxEnabled = enabled }),

clearDistrictFilters: () =>
  set((state) => {
    state.districtSourceFilter = null
    state.districtBboxEnabled = false
  }),
```

### 4.3 Coverage Store Selectors

Add selectors to `coverageSelectors`:

| Selector | Signature | Returns |
|----------|-----------|---------|
| `hasDistrictFilter` | `(state: CoverageStore) => boolean` | `state.districtSourceFilter !== null \|\| state.districtBboxEnabled` |
| `districtSourceFilter` | `(state: CoverageStore) => string \| null` | `state.districtSourceFilter` |
| `districtBboxEnabled` | `(state: CoverageStore) => boolean` | `state.districtBboxEnabled` |

The `hasDistrictFilter` selector drives the active-filter indicator on the toggle button.

### 4.4 Map Ref Forwarding

The `CoverageMap` component currently holds a `useRef<MapRef>(null)` (`mapRef`) that is not exposed to parent components. This workstream adds a `mapRef` forwarded ref prop:

```
interface CoverageMapProps {
  // ... existing props ...
  /** Forwarded ref to access the MapLibre map instance for bounds reading. */
  readonly mapRef?: React.Ref<MapRef>
}
```

Internally, `CoverageMap` merges the forwarded ref with its internal ref using a callback ref pattern (or `useImperativeHandle` if a subset of the `MapRef` API is preferred). The parent (`CategoryDetailScene`) passes a ref down that the filter panel can read.

The ref is used exclusively for reading bounds (`mapRef.current.getBounds()`) and subscribing to `moveend` events. It does not modify map state.

### 4.5 Bbox Subscription Hook

A custom hook `useMapBbox` encapsulates the bbox-reading and event subscription logic:

```
interface UseMapBboxOptions {
  mapRef: React.RefObject<MapRef | null>
  enabled: boolean
  debounceMs?: number // default: 300
}

interface UseMapBboxReturn {
  bbox: [number, number, number, number] | null // [west, south, east, north]
}

function useMapBbox(options: UseMapBboxOptions): UseMapBboxReturn
```

Behavior:
- When `enabled` is `false`, returns `{ bbox: null }` and does not subscribe to events.
- When `enabled` is `true`:
  1. Reads initial bounds from `mapRef.current.getBounds()` synchronously.
  2. Subscribes to the underlying MapLibre `moveend` event via `mapRef.current.getMap().on('moveend', ...)`.
  3. On `moveend`, reads new bounds and updates state (debounced at `debounceMs`).
  4. Returns the current bbox as `[west, south, east, north]`.
- Cleans up the event subscription on unmount or when `enabled` changes to `false`.

This hook lives in `src/hooks/use-map-bbox.ts`. It keeps the debounced bbox calculation out of both the Zustand store and the component body.

### 4.6 DistrictFilterPanel Component

New component: `src/components/district-view/district-filter-panel.tsx`

**Visual design:**
- Glass-material panel: `backdrop-blur-[16px] backdrop-saturate-[130%]`, background `rgba(255, 255, 255, 0.04)`, border `rgba(255, 255, 255, 0.06)`.
- Fixed position below the header area, horizontally centered, max-width `480px`.
- z-index 33 (above district content at 30, below triage panel at 45).
- Entry animation: slide down + fade in via `motion/react` (200ms, ease-out).
- Exit animation: slide up + fade out (150ms, ease-in).

**Layout:**

```
+----------------------------------------------------+
|  SOURCE                        GEOGRAPHIC           |
|  [All Sources         v]       [ ] Filter to        |
|                                    Viewport         |
|                                                     |
|  {source name, status dot}     Constrains map data  |
|                                to the visible area. |
|                                Auto-updates on      |
|                                pan/zoom.            |
+----------------------------------------------------+
```

Two sections in a horizontal layout (flex row, gap-8):

**Source section:**
- Label: "SOURCE" (mono 9px, uppercase, tracking, `rgba(255, 255, 255, 0.15)`)
- Custom dropdown component styled to match the Tarva glass aesthetic (not a native `<select>`):
  - Trigger button showing the selected source name (or "All Sources")
  - Dropdown list of sources filtered to the current category
  - Each option shows: source name + status dot (green=active, blue=staging, yellow=quarantine, gray=disabled)
  - Click selects the source and closes the dropdown
  - "All Sources" option at the top to clear the filter
- Reads sources from `useCoverageMetrics().data.sourcesByCoverage.filter(s => s.category === categoryId)`

**Bbox section:**
- Label: "GEOGRAPHIC" (same label styling)
- Toggle switch: a small custom toggle (not a checkbox) with "Filter to Viewport" label
- Description text below: "Constrains map data to the visible area. Auto-updates on pan/zoom." (mono 9px, `rgba(255, 255, 255, 0.15)`)
- When enabled, the toggle background transitions to `rgba(255, 255, 255, 0.12)` with a subtle accent

**Props:**

```
interface DistrictFilterPanelProps {
  readonly categoryId: string
  readonly mapRef: React.RefObject<MapRef | null>
  readonly onBboxChange: (bbox: [number, number, number, number] | null) => void
}
```

The `onBboxChange` callback flows the current bbox (or null when disabled) up to the parent, which passes it into the `useCoverageMapData` filter. This avoids the filter panel needing to own the data-fetching concern.

### 4.7 Filters Toggle Button

Added to `DistrictViewHeader` as a new element in the top strip, positioned to the left of the dock panel side (right-aligned since the dock is on the right):

```
[← BACK]  ........  [Category Name ●]  ........  [FILTERS ●]
                     (center)                     (right area)
```

The button:
- Label: "FILTERS" (mono 9px, uppercase, tracking-wider)
- Same glass styling as the back button: `rgba(255, 255, 255, 0.03)` background, `rgba(255, 255, 255, 0.06)` border, rounded
- Horizontal orientation (unlike the vertical back button)
- Fixed position: `top: 56px`, `right: 380px` (clearing the 360px dock + 20px gap)
- z-index 32 (matching the header elements)
- `aria-expanded` attribute reflecting panel state
- `aria-controls` pointing to the panel's ID
- Active-filter indicator: a small 4px dot (same as the category color dot) positioned top-right of the button, visible only when `hasDistrictFilter` is true. Color: `rgba(255, 255, 255, 0.5)`.

**Props addition to `DistrictViewHeader`:**

```
interface DistrictViewHeaderProps {
  // ... existing props ...
  readonly filtersOpen: boolean
  readonly hasActiveFilter: boolean
  readonly onToggleFilters: () => void
}
```

### 4.8 Integration in CategoryDetailScene

The `CategoryDetailScene` component receives the bbox and source filter values and incorporates them into its `useCoverageMapData` call. Currently the hook call is:

```
const { data: markers, isLoading: markersLoading } = useCoverageMapData({ category: categoryId })
```

With WS-5.2 filters applied, this becomes:

```
const districtSourceFilter = useCoverageStore((s) => s.districtSourceFilter)
const districtBboxEnabled = useCoverageStore((s) => s.districtBboxEnabled)

const mapFilters: CoverageMapFilters = useMemo(() => {
  const f: CoverageMapFilters = { category: categoryId }
  if (districtSourceFilter) f.sourceKey = districtSourceFilter
  if (districtBboxEnabled && currentBbox) f.bbox = currentBbox
  return f
}, [categoryId, districtSourceFilter, districtBboxEnabled, currentBbox])

const { data: markers, isLoading: markersLoading } = useCoverageMapData(mapFilters)
```

The `currentBbox` value comes from the `useMapBbox` hook, which subscribes to the map's viewport bounds.

### 4.9 Integration in DistrictViewOverlay

The overlay component manages the filter panel visibility state and cleans up filters on exit:

**Filter panel state:** A local `useState<boolean>(false)` for `filtersOpen` -- this is ephemeral UI state (panel open/closed), not data filtering state.

**Panel rendering:** The `DistrictFilterPanel` renders inside the overlay, conditionally based on `filtersOpen`, wrapped in `AnimatePresence` for entry/exit animation.

**Exit cleanup:** Add a `clearDistrictFilters()` call to the `handleBack` callback and to the `AnimatePresence.onExitComplete` handler, ensuring district-scoped filter state is reset when leaving the view.

**Prop threading:** Pass `filtersOpen`, `hasActiveFilter`, and `onToggleFilters` down to `DistrictViewHeader`. Pass `mapRef` through `DistrictViewContent` to `CategoryDetailScene` to `CoverageMap` for bounds reading.

### 4.10 Stale Query Prevention

When the bbox filter is enabled and the user pans/zooms, the `useCoverageMapData` query key changes on each debounced bbox update. This creates rapid successive queries. To prevent stale data flicker:

- Use `keepPreviousData: true` (TanStack Query v5: `placeholderData: keepPreviousData`) on the map data query when bbox filtering is enabled. This keeps the previous marker set rendered while the new bbox query resolves, preventing empty-flash on pan.
- The debounce interval (300ms) limits query frequency to roughly 3 queries/second maximum during continuous panning, which is acceptable API load.
- When bbox filtering is disabled (toggle off), immediately refetch with no bbox param to restore the full dataset.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | "FILTERS" toggle button appears in the district view header, positioned right of the category name and clear of the dock panel | Visual inspection in district view |
| AC-2 | Clicking FILTERS toggles an expandable filter panel with glass-material styling | Manual interaction test |
| AC-3 | Filter panel contains a source selector dropdown and a bbox toggle | Visual inspection |
| AC-4 | Source selector lists sources for the current category, sourced from `useCoverageMetrics` | Open dropdown in a category that has sources, verify list matches |
| AC-5 | Selecting a source filters the map markers to only that source's data | Select a source, verify map markers reduce to only that source |
| AC-6 | Selecting "All Sources" clears the source filter | Select "All Sources" after a specific source, verify full marker set returns |
| AC-7 | Bbox toggle labeled "Filter to Viewport" is off by default | Visual inspection on first district entry |
| AC-8 | Enabling the bbox toggle constrains map data to the current viewport bounds | Enable toggle, verify markers outside viewport disappear on next refetch |
| AC-9 | Panning or zooming the map with bbox enabled auto-updates the filtered data (debounced) | Pan the map with bbox on, verify marker set updates after brief delay |
| AC-10 | Disabling the bbox toggle restores the full dataset | Toggle bbox off, verify global markers return |
| AC-11 | Active-filter indicator (dot) appears on the FILTERS button when source or bbox filter is active | Activate a filter, close the panel, verify dot visible on button |
| AC-12 | All district filters are cleared when navigating back from district view | Activate filters, click back, re-enter same district, verify filters are off |
| AC-13 | `districtSourceFilter` and `districtBboxEnabled` exist on the coverage store with correct types | `pnpm typecheck`; store inspection in React DevTools |
| AC-14 | `clearDistrictFilters()` resets both state fields to defaults | Unit test or manual verification via React DevTools |
| AC-15 | FILTERS button has `aria-expanded` reflecting panel state and `aria-controls` pointing to the panel | DOM inspection or accessibility audit |
| AC-16 | Source dropdown is keyboard-accessible (arrow keys to navigate, Enter to select, Escape to close) | Keyboard navigation test |
| AC-17 | Filter panel has `role="region"` and `aria-label="District view filters"` | DOM inspection |
| AC-18 | Previous marker data is shown during bbox refetch (no empty flash during panning) | Pan with bbox enabled, observe no flicker |
| AC-19 | `pnpm typecheck` passes with zero errors | CI or local typecheck |
| AC-20 | `pnpm build` succeeds without errors | CI or local build |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Store the bbox-enabled boolean in Zustand but keep the actual bbox coordinates in a `useRef` + hook-local state | The bbox 4-tuple changes on every pan/zoom (potentially dozens of times per second before debouncing). Storing it in Zustand would trigger re-renders across all store subscribers on every viewport movement. The boolean flag ("is bbox filtering on?") changes rarely and belongs in the store. The coordinates are derived, transient, and consumed only by the data-fetching hook. | Store full bbox in Zustand -- rejected due to re-render cost. Store nothing in Zustand (all local) -- rejected because the "is filtering active?" signal needs to be readable by the FILTERS toggle indicator in the header, which is a different component tree branch. |
| D-2 | Place the filter panel as a fixed-position overlay below the header rather than inside the CategoryDetailScene content area | The filter panel governs data that flows into the scene but is not part of the scene's layout. Positioning it as a fixed overlay (like the header and dock) keeps it visually associated with the navigation chrome rather than the data content. It also avoids disrupting the scene's two-column CSS Grid layout. | Inside the scene above the grid -- would push down content and require layout recalculation. Inside the dock panel -- would mix filter controls with detail/overview content, muddling the dock's purpose. |
| D-3 | Single-select source filter (not multi-select) | The WS-5.1 API contract passes a single `source_key` string to the endpoint. Multi-select would require either comma-separated params (API change), multiple API calls (performance), or client-side filtering (defeats the purpose of server-side filtering). Single-select matches the API and keeps the UX simple. | Multi-select with client-side filtering -- rejected because the goal of WS-5.1/5.2 is server-side filtering for performance. Multi-select with repeated params -- would require API changes beyond WS-5.1 scope. |
| D-4 | Clear district filters on exit (not persist across district visits) | District filters are contextual to the current category. A source filter set for "Seismic" is meaningless in "Weather" (different sources). Bbox may or may not be relevant across categories depending on the user's geographic focus. Clearing on exit provides a clean slate for each district entry. Users who want the same filter can re-enable it quickly (two clicks). | Persist across visits -- rejected because source filters are category-specific and would either fail silently (source not in new category) or require complex validation logic on entry. Persist bbox only -- introduces inconsistency (one filter persists, the other doesn't). |
| D-5 | Custom dropdown component (not native `<select>`) for source selector | Native `<select>` elements cannot be styled to match the Tarva glass aesthetic. The source list includes status dots (colored indicators for active/staging/quarantine/disabled), which require custom rendering. A custom dropdown also supports keyboard navigation, filtering (if the source list grows large), and consistent cross-browser styling. | Native `<select>` -- rejected for styling limitations. shadcn/ui `<Select>` -- would work if the @tarva/ui library includes it, but the glass material styling would still need customization. If @tarva/ui has a suitable primitive, prefer it over a fully custom implementation. |
| D-6 | Debounce bbox updates at 300ms | 300ms provides a balance: fast enough that the user perceives near-real-time updates after panning, slow enough to avoid hammering the API during continuous drag. At 300ms debounce, a 2-second pan generates at most 6-7 API calls. The `keepPreviousData` strategy prevents visual gaps between refetches. | No debounce -- would fire on every `moveend` (including intermediate frames during animated transitions), excessive API load. 1000ms debounce -- too sluggish, user perceives a disconnect between viewport and data. 100ms debounce -- too aggressive for a network-bound operation. |
| D-7 | Use `moveend` event (not `move`) for bbox subscription | `move` fires continuously during pan (many times per frame), making even debounced handlers wasteful. `moveend` fires once after a pan/zoom gesture completes or after an animated fly-to settles. Combined with 300ms debounce, it captures the final resting position efficiently. | `move` with heavy throttle -- still more frequent than needed. `idle` event -- not available in all MapLibre versions. `moveend` is the standard approach. |
| D-8 | Filter panel z-index 33, between district content (30) and triage panel (45) | The filter panel sits above the category scene content (which should remain interactable beneath it via pointer-events passthrough on the panel's background) but below any future triage/rationale overlays that demand full attention. z-index 33 is between the dock (31) and the header elements (32), placing it logically as a secondary chrome element. | z-index 35 -- unnecessarily high, reduces available range for future overlays. z-index 31 (same as dock) -- could cause stacking conflicts with the dock on narrow viewports. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the source filter also apply to the `AlertList` (via `useCategoryIntel`), not just the map markers? Currently `useCategoryIntel` fetches all intel for the category without source filtering. If the user filters the map to source X, seeing all sources in the alert list may be confusing. However, adding `source_key` to `useCategoryIntel` requires the `/console/intel` endpoint to accept that param -- which is outside WS-5.1 scope. | react-developer | Phase 5 implementation |
| OQ-2 | Should the bbox filter also apply to the `AlertList`? This would require `useCategoryIntel` to accept bbox params and the backend to support bbox filtering on `/console/intel`. Alternatively, the list could be client-side filtered by checking each item's coordinates (if available) against the bbox. However, `CategoryIntelItem` does not currently carry coordinate data. | react-developer | Phase 5 implementation |
| OQ-3 | Should the filter panel include a count annotation (e.g., "12 markers shown") to provide feedback on filter impact? The map already shows marker counts implicitly (visible markers), but an explicit count would confirm the filter is working, especially for bbox filtering where the difference may be subtle. | react-developer | Phase 5 implementation |
| OQ-4 | If the @tarva/ui library includes a Select/Dropdown primitive, should this workstream use it instead of building a custom dropdown? Using the design system primitive would be more consistent but may require adaptation for the status dot rendering. | react-developer | Phase 5 implementation |
| OQ-5 | Should the bbox toggle show a visual indicator on the map itself (e.g., a subtle border or shaded area showing the current bbox)? Since the bbox IS the viewport, this is somewhat redundant, but it would make the active filter state more visible and distinguish "no markers in area" from "filter is off." | react-developer | Phase 5 implementation |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-5.1 has not yet added `bbox` and `sourceKey` to `CoverageMapFilters`, so the filter values are passed but not transmitted to the API | High (dependency not started) | High -- filter controls render and store state updates, but map data is unfiltered. User perceives the filters as broken. | Guard with a graceful degradation path: if the `useCoverageMapData` hook does not yet support `bbox`/`sourceKey` params, the filter panel can still render and store the user's selections, but a muted "(available soon)" label replaces the live-filtering behavior. Once WS-5.1 lands, filters activate automatically. |
| R-2 | Backend Phase B.3 has not implemented `bbox` or `source_key` query params on `/console/coverage/map-data` | High (backend dependency) | High -- API ignores the params and returns unfiltered data. Same user perception as R-1. | The API client (`tarvariGet`) sends the params regardless. If the backend ignores them, the user sees unfiltered data (safe fallback). No error. When the backend adds support, filtering activates without frontend changes. Document this in the filter panel UI: "Requires API v2.x" note if needed. |
| R-3 | Bbox updates on every pan/zoom create excessive API calls even with debouncing | Medium | Medium -- API rate limiting triggers, degraded data freshness, increased backend load | 300ms debounce limits calls to ~3/second maximum during active panning. `keepPreviousData` prevents visual gaps. If API load is a concern, increase debounce to 500ms or add a "manual refresh" mode where the user clicks a button to apply the current bbox rather than auto-updating. |
| R-4 | The `CoverageMap` MapRef forwarding changes the component's API contract, potentially affecting the main page's map usage | Low | Medium -- could break the overview map if the ref prop is not backward-compatible | The `mapRef` prop is optional. Existing usages that do not pass a ref continue to work unchanged. The internal ref remains the primary ref; the forwarded ref is additive. |
| R-5 | The filter panel overlaps with map navigation controls (MapNavControls) on the map | Medium | Low -- visual clutter, controls partially hidden | The filter panel is positioned below the header (top ~85px) and horizontally centered. MapNavControls are positioned `top: 10, left: 10` within the map container, which starts at `top: 80` in the scene layout (below the header). No overlap expected, but verify during implementation. If overlap occurs, add a `top` offset to MapNavControls when the filter panel is visible. |
| R-6 | Custom dropdown for source selector introduces accessibility gaps (focus trap, screen reader announcement, keyboard navigation) | Medium | Medium -- fails WCAG 2.2 AA compliance | Implement the dropdown with proper ARIA: `role="listbox"` on the list, `role="option"` on items, `aria-activedescendant` for focus management, `aria-expanded` on the trigger, keyboard handlers for ArrowUp/ArrowDown/Enter/Escape. Consider using Radix UI `Select` primitive (via @tarva/ui or direct) as a foundation to inherit accessible patterns. |
| R-7 | District filter clearing on exit may surprise users who intentionally set a source filter and then briefly exit to check the hub before re-entering the same category | Low | Low -- the filter is two clicks to re-enable (open panel, select source). The clear-on-exit behavior is documented and consistent with `selectedAlertId` being cleared on exit. | If user feedback indicates this is a friction point, consider adding a "remember filters" toggle or persisting the source filter (but not bbox) in the store until a different category is entered. |
