# WS-1.4: Priority Filter in Coverage Store

> **Workstream ID:** WS-1.4
> **Phase:** 1 -- Priority Badges
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.2, WS-1.1
> **Blocks:** None
> **Resolves:** None

## 1. Objective

Add client-side priority filtering to the coverage store and district view, allowing analysts to isolate alerts by operational priority level (P1--P4). The store addition follows the established `selectedCategories` toggle pattern: a `selectedPriorities: OperationalPriority[]` array where empty means "show all." A filter control in the district view toolbar lets users toggle individual priority levels on and off. URL synchronization enables deep-linking to filtered views via `?priority=P1&priority=P2` query parameters.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Store state field | `selectedPriorities: OperationalPriority[]` added to `CoverageState` in `coverage.store.ts`. Empty array = show all priorities (mirrors `selectedCategories` semantics). |
| Store actions | `togglePriority(priority: OperationalPriority)` -- adds if absent, removes if present. `clearPriorities()` -- resets to empty array. Both added to `CoverageActions`. |
| Store selectors | `hasPrioritySelection` (boolean) and `selectedPriorities` (array getter) added to `coverageSelectors`. |
| URL sync -- read | Extend `syncCoverageFromUrl()` to read `?priority=P1&priority=P2` params on page mount and call `togglePriority` for each valid value. |
| URL sync -- write | New `syncPrioritiesToUrl(priorities: OperationalPriority[])` function that pushes the current selection to URL params via `replaceState`. Omits the param entirely when the array is empty (cleaner URLs, same pattern as `syncCategoriesToUrl`). |
| Filter control UI | A row of toggle buttons (P1, P2, P3, P4) rendered in the `AlertList` header area of `CategoryDetailScene`, positioned alongside the existing Severity/Time sort controls. Each button shows its short label and toggles the corresponding priority in the store. |
| Filter/visibility interaction | Define the semantic rule for how `selectedPriorities` interacts with `isPriorityVisible` from WS-0.2: when the filter is active (non-empty), it overrides default visibility rules, showing exactly the selected priorities regardless of `defaultVisibility`. When the filter is inactive (empty), `isPriorityVisible` governs what is shown. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `OperationalPriority` type definition | Defined in WS-0.2. This workstream imports it. |
| Adding `operationalPriority` field to data types (`CategoryIntelItem`, `MapMarker`, etc.) | WS-1.1 extends the API types. This workstream consumes the field for filtering. |
| Map marker filtering by priority | Map markers are filtered separately in `MapMarkerLayer`. If priority filtering should also apply to the map, that belongs in a follow-up workstream (or WS-1.5 map marker scaling). This workstream scopes filtering to the district view alert list. |
| Priority counts on `CategoryCard` or `CoverageByCategory` | WS-1.2 handles per-priority counts on grid cards. |
| PriorityBadge component rendering | WS-0.4 builds the visual badge. This workstream filters data; it does not render priority indicators. |
| Priority filter on the main grid/hub page | Filtering applies within the district view (single-category detail). Hub-level priority filtering is not part of Phase 1. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.2 `OperationalPriority` type | The `OperationalPriority` union type (`'P1' \| 'P2' \| 'P3' \| 'P4'`), `PRIORITY_LEVELS` const array, and `isPriorityVisible` helper. Imported from `src/lib/interfaces/coverage.ts`. | Draft SOW complete, not yet implemented |
| WS-1.1 `operationalPriority` on data types | `CategoryIntelItem.operationalPriority: OperationalPriority` field added by the API normalizer in `use-category-intel.ts`. Without this field, the filter has nothing to match against. | Not yet started |
| `coverage.store.ts` current structure | The existing `selectedCategories` pattern (state, actions, selectors, URL sync) as the template for the parallel priority implementation. | Available -- reviewed |
| `CategoryDetailScene.tsx` AlertList component | The existing sort toggle header area where priority filter buttons will be placed. | Available -- reviewed |

## 4. Deliverables

### 4.1 Store State Addition

Add `selectedPriorities` to `CoverageState` in `coverage.store.ts`:

```
selectedPriorities: OperationalPriority[]
```

Initialized to `[]` (empty array = show all). No `persist` middleware -- priority selection is session-transient, same as `selectedCategories`. Deep-linking via URL params is the persistence mechanism.

### 4.2 Store Actions

Add two actions to `CoverageActions`:

| Action | Signature | Behavior |
|--------|-----------|----------|
| `togglePriority` | `(priority: OperationalPriority) => void` | Toggle a priority in the filter set. Uses `indexOf` + `splice`/`push` via Immer, identical to `toggleCategory`. |
| `clearPriorities` | `() => void` | Reset `selectedPriorities` to `[]`. Identical pattern to `clearSelection`. |

Implementation uses the Immer `set` pattern already established in the store. The `togglePriority` action should validate that the input is a member of `PRIORITY_LEVELS` before toggling (guard against invalid URL params or programmatic misuse). If the value is not a valid `OperationalPriority`, the action is a no-op.

### 4.3 Store Selectors

Add two selectors to `coverageSelectors`:

| Selector | Signature | Returns |
|----------|-----------|---------|
| `hasPrioritySelection` | `(state: CoverageStore) => boolean` | `state.selectedPriorities.length > 0` |
| `selectedPriorities` | `(state: CoverageStore) => OperationalPriority[]` | `state.selectedPriorities` |

These parallel `hasSelection` and `selectedCategories` exactly.

### 4.4 URL Synchronization

**Read (extend `syncCoverageFromUrl`):**

After the existing category sync block, add a priority sync block:

```
// Sync priorities
const priorities = params.getAll('priority')
for (const p of priorities) {
  if (PRIORITY_LEVELS.includes(p as OperationalPriority)) {
    useCoverageStore.getState().togglePriority(p as OperationalPriority)
  }
}
```

The `PRIORITY_LEVELS.includes()` guard ensures only valid values (`'P1'`--`'P4'`) are applied. Invalid URL params like `?priority=P5` or `?priority=high` are silently ignored.

**Write (new `syncPrioritiesToUrl`):**

```
function syncPrioritiesToUrl(priorities: OperationalPriority[]): void
```

Follows the `syncCategoriesToUrl` pattern exactly:
- SSR guard (`typeof window === 'undefined'`)
- Deletes all existing `priority` params, then appends one per active filter
- Uses `replaceState` (no history entries)
- When `priorities` is empty, all `priority` params are removed (clean URL)

### 4.5 Filter Control Placement

The priority filter buttons go in the `AlertList` component's header row inside `CategoryDetailScene.tsx`, alongside the existing Severity/Time sort buttons. The current header layout:

```
[ALERTS label] ........................ [Severity] [Time]
```

Becomes:

```
[ALERTS label] ... [P1] [P2] [P3] [P4] ... [Severity] [Time]
```

The priority buttons are separated from the sort buttons by a subtle vertical divider (1px, `rgba(255, 255, 255, 0.06)`) to visually distinguish filter controls from sort controls.

Each priority button:
- Displays the short label (`P1`, `P2`, `P3`, `P4`) from `PRIORITY_META`
- Uses the same mono 9px uppercase styling as the existing sort buttons
- When active (priority selected): background `rgba(255, 255, 255, 0.08)`, text `rgba(255, 255, 255, 0.5)`, border `rgba(255, 255, 255, 0.12)` -- matching the active sort button style
- When inactive: transparent background, text `rgba(255, 255, 255, 0.15)`, border `rgba(255, 255, 255, 0.04)` -- matching the inactive sort button style
- `onClick` calls `togglePriority` from the store
- `aria-pressed` attribute reflects the toggle state for accessibility

A "clear all" gesture is provided by clicking the `ALERTS` label (or adding a small x icon that appears when any filter is active). This calls `clearPriorities()`.

### 4.6 Filter Application in AlertList

The `AlertList` component's `sorted` useMemo currently filters and sorts items. With priority filtering, the pipeline becomes:

1. Read `selectedPriorities` from `useCoverageStore`
2. If `selectedPriorities` is non-empty: filter `items` to those whose `operationalPriority` is in `selectedPriorities`
3. If `selectedPriorities` is empty: apply `isPriorityVisible(item.operationalPriority, 'list')` to enforce default visibility rules (P4 items hidden unless explicitly filtered)
4. Sort the filtered result by the existing `sortBy` logic

This establishes the interaction between the explicit filter and the default visibility system from WS-0.2:
- **Filter active:** user has explicitly chosen which priorities to see. Default visibility is bypassed. If the user selects P4, they see P4 items.
- **Filter inactive:** default visibility applies. P1/P2 always shown, P3 shown (since district view is detail context), P4 hidden.

### 4.7 Filtered Count Display

When any priority filter is active, the `ALERTS` label should display the filtered count vs. total:

```
ALERTS (12 of 47)
```

When no filter is active, it shows just `ALERTS` (no count annotation), keeping the default state clean. This provides immediate feedback that filtering is reducing the visible set.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `selectedPriorities` exists on the coverage store, typed as `OperationalPriority[]`, initialized to `[]` | `pnpm typecheck`; store inspection in React DevTools |
| AC-2 | `togglePriority('P1')` adds `'P1'` to the array; calling again removes it | Manual test or unit test calling the store action and checking state |
| AC-3 | `clearPriorities()` resets `selectedPriorities` to `[]` regardless of prior state | Unit test |
| AC-4 | `togglePriority` with an invalid value (e.g., `'P5'`, `'high'`) is a no-op | Unit test -- verify array unchanged after invalid input |
| AC-5 | `coverageSelectors.hasPrioritySelection` returns `true` when array is non-empty, `false` when empty | Unit test |
| AC-6 | `syncCoverageFromUrl()` reads `?priority=P1&priority=P3` and populates `selectedPriorities` with `['P1', 'P3']` | Manual test with URL params; unit test with mocked `window.location` |
| AC-7 | `syncPrioritiesToUrl(['P1', 'P2'])` writes `?priority=P1&priority=P2` to the URL via `replaceState` | Unit test with `replaceState` spy |
| AC-8 | Invalid URL params like `?priority=P5` are silently ignored by `syncCoverageFromUrl()` | Unit test -- verify `selectedPriorities` remains empty |
| AC-9 | Four priority filter buttons (P1, P2, P3, P4) appear in the AlertList header, left of the sort controls | Visual inspection in district view |
| AC-10 | Clicking a priority button toggles its filter state and visually updates the button (active/inactive styling) | Manual interaction test |
| AC-11 | When priorities are filtered, the alert list shows only items matching the selected priorities | Manual test -- select P1, verify only P1 items shown |
| AC-12 | When no priorities are filtered, default visibility rules apply (P4 items hidden in list context) | Manual test -- verify P4 items not shown in unfiltered state |
| AC-13 | When P4 is explicitly selected in the filter, P4 items appear despite `defaultVisibility: 'filter-only'` | Manual test -- toggle P4 on, verify P4 items visible |
| AC-14 | Priority filter buttons have `aria-pressed` attributes reflecting toggle state | DOM inspection or accessibility audit |
| AC-15 | Filtered count annotation appears when filter is active (e.g., "ALERTS (12 of 47)") | Visual inspection |
| AC-16 | `pnpm typecheck` passes with zero errors | CI or local typecheck |
| AC-17 | `pnpm build` succeeds without errors | CI or local build |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Mirror the `selectedCategories` pattern exactly (toggle action, clear action, boolean selector, URL sync) | Consistency is the primary design driver. Any developer who understands `selectedCategories` immediately understands `selectedPriorities`. Reduces cognitive overhead and review friction. | Custom filter object with min/max priority range -- rejected because toggle semantics are simpler and match the discrete P1--P4 levels. |
| D-2 | Empty array means "show all" (subject to default visibility rules) | Consistent with `selectedCategories` where empty = no filter. Avoids the need for a separate "filter active" boolean. The array length IS the active signal. | Boolean `priorityFilterEnabled` + separate array -- rejected as redundant; the array emptiness already encodes this. |
| D-3 | Place filter buttons in the `AlertList` header, not in a separate toolbar component | The filter directly governs the alert list content below it. Co-locating filter and content follows the principle of proximity. The existing sort controls in the same row establish a precedent for data controls here. | Dedicated toolbar between header and content -- over-engineered for a single filter dimension. Could be refactored later if more filters are added (time range, severity, confidence). |
| D-4 | Client-side filtering (not API-level) | Priority filtering is a view-layer concern. The API already returns all items for the category. Filtering client-side avoids additional API calls, provides instant toggle response, and keeps the API interface stable. | API query param `?priority=P1,P2` -- rejected because it adds API complexity for a filter that applies to already-fetched data (max 200 items per category from `useCategoryIntel`). |
| D-5 | URL param name is `priority` (not `operational_priority` or `p`) | Short, readable, consistent with `category` param naming. `operational_priority` is too verbose for URLs. `p` is too terse and ambiguous. | `op` or `prio` -- insufficiently descriptive. `operational_priority` -- too long for URL params. |
| D-6 | `togglePriority` validates input against `PRIORITY_LEVELS` | Prevents invalid values from entering the store via URL params or programmatic misuse. A silent no-op for invalid input is preferable to throwing, since URL params are user-controllable input. | No validation (trust callers) -- fragile. Throw on invalid input -- too aggressive for a URL-driven flow. |
| D-7 | When filter is active, default visibility (`isPriorityVisible`) is bypassed entirely | If a user explicitly selects P4 in the filter, they are expressing intent to see P4 items. Respecting `defaultVisibility: 'filter-only'` for P4 while the user has P4 selected would create confusing "nothing happened" behavior. The explicit filter is the user's override. | Always apply `isPriorityVisible` on top of the filter -- would make P4 filter button appear broken (selected but no items shown). |
| D-8 | When filter is inactive, apply `isPriorityVisible` with `'list'` context in the alert list, but use `'detail'` context in the dock panel | The alert list is a list context; the dock detail panel is a detail context. P3 items should appear in both (since district view is already a detail-level view), but P4 items should remain hidden unless explicitly filtered. Using `'detail'` context for the list view would be more permissive but would blur the semantic distinction. | Use `'detail'` for both -- since district view is inherently a detail view, this is defensible. However, preserving the context distinction keeps the `isPriorityVisible` semantics clean and allows future differentiation if needed. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the priority filter also apply to the severity breakdown chart and coverage map within the district view, or only to the alert list? Filtering the map by priority would require `MapMarker` to carry `operationalPriority` (WS-1.1 scope) and the map layer to read `selectedPriorities`. | react-developer | Phase 1 implementation |
| OQ-2 | Should the priority filter persist when navigating between districts (e.g., click back to hub, click into a different category)? Currently `selectedAlertId` is reset on exit. Priority filter is in the global store so it would persist by default. Is that the desired UX? | react-developer | Phase 1 implementation |
| OQ-3 | Should the filter buttons show per-priority item counts (e.g., "P1 (3)") to help users understand the distribution before filtering? This requires counting items by priority in the component, which is cheap but adds visual density. | react-developer | Phase 1 implementation |
| OQ-4 | Should `isPriorityVisible` use `'detail'` context (not `'list'`) for the AlertList when inside district view, since the district view is semantically a detail-level view? This would make P3 items visible by default in the unfiltered state. Current decision (D-8) uses `'list'` context. | react-developer | Phase 1 implementation |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-1.1 has not yet added `operationalPriority` to `CategoryIntelItem`, so the filter has no field to match against | High (dependency not started) | High -- filter buttons render but filtering produces no results or runtime errors | Guard the filter logic: if `item.operationalPriority` is `undefined`, treat it as matching any filter (pass-through) or apply the P4 fallback from `getPriorityMeta`. This graceful degradation allows the store and UI to land before WS-1.1 completes, with full filtering activating once the data field exists. |
| R-2 | URL parameter collision: another tool or system writes a `priority` query param to the URL | Low | Low -- filter would activate unexpectedly | The `PRIORITY_LEVELS.includes()` validation ensures only exact `'P1'`--`'P4'` values are accepted. Arbitrary `priority=high` params are ignored. |
| R-3 | Priority filter buttons add too much visual clutter to the AlertList header, especially on narrow viewports | Medium | Medium -- degrades the district view UX on smaller screens | The buttons use the same compact 9px mono styling as existing sort controls. On narrow viewports, consider collapsing into a dropdown or single "Priority" button with a popover. Evaluate during implementation -- the header row has adequate horizontal space in the current two-column layout. |
| R-4 | Interaction between `selectedPriorities` and `isPriorityVisible` creates edge cases where items appear or disappear unexpectedly | Medium | Medium -- confusing UX when toggling filters | Document the interaction rule clearly (D-7, D-8). The rule is simple: filter active = show exactly what's selected; filter inactive = show per default visibility. Unit test both paths. |
| R-5 | Priority filter persists in global store across district view entries, potentially surprising users who filtered P1 in "Seismic" and then see a filtered state when entering "Weather" | Medium | Low -- filter state is visible in the UI (active buttons) so it's not invisible | This is arguably correct behavior (the user wants to see P1 across categories). If it proves confusing, add a `clearPriorities()` call to the morph `reverseMorph` or district entry flow. Flag for UX review in OQ-2. |
