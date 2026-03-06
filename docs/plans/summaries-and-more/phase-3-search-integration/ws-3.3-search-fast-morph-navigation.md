# WS-3.3: Search -> Fast Morph Navigation

> **Workstream ID:** WS-3.3
> **Phase:** 3 -- Search Integration
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-3.1, WS-3.2, WS-3.4
> **Blocks:** None
> **Resolves:** None

## 1. Objective

Wire the click handler on intel search result items in the `CommandPalette` (WS-3.2) so that clicking a search result: (1) closes the command palette, (2) stores the result's alert ID via `setDistrictPreselectedAlertId`, (3) initiates a fast morph to the result's category district via `startMorph(category, { fast: true })`. This reuses the established `districtPreselectedAlertId` consumption pattern from the INSPECT -> VIEW DISTRICT flow, where `DistrictViewOverlay` reads and consumes the preselected ID on mount (district-view-overlay.tsx lines 62-70). The fast morph option (WS-3.4) skips the `expanding` and `settled` phases, transitioning directly from `idle` to `entering-district` in ~300ms -- appropriate for intentional search-driven navigation where the user has already identified their target.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Search result click handler | Add an `onSelect` handler to each intel search result `CommandItem` in `CommandPalette.tsx` (or the search results group added by WS-3.2). The handler executes the 4-step navigation sequence: preselect alert ID, close palette, start fast morph. |
| Store interaction sequence | Call `setDistrictPreselectedAlertId(resultId)` before `startMorph(category, { fast: true })` to ensure the ID is available when `DistrictViewOverlay` mounts during the `entering-district` phase. |
| Command palette closure | Close the palette via `setOpen(false)` (from `useCommandPalette`) as part of the click handler, before initiating the morph. |
| Category resolution | Extract the `category` field from the search result object (`SearchResult.category` as defined by WS-3.1). Map it to the morph target ID (category IDs are used as district/node IDs throughout the morph system). |
| Morph idle guard | Respect the existing `startMorph` guard that only fires when `morph.phase === 'idle'` (ui.store.ts line 104). If a morph is already in progress, the click is silently ignored. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `useIntelSearch` hook implementation | Delivered by WS-3.1. This workstream consumes `SearchResult` objects from the hook's output. |
| Search result rendering in CommandPalette | Delivered by WS-3.2. This workstream adds/modifies the `onSelect` callback on the already-rendered `CommandItem` components. |
| Fast morph implementation in `ui.store.ts` / `useMorphChoreography` | Delivered by WS-3.4. This workstream calls `startMorph(id, { fast: true })` and depends on WS-3.4 to handle the phase-skipping logic. |
| Keyboard navigation of search results | Handled by cmdk (via `CommandItem`). Arrow keys and Enter selection work out of the box via the cmdk library. |
| Tests | No test infrastructure (`pnpm test:unit` is not configured). Verification is via `pnpm typecheck`, `pnpm build`, and visual inspection. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-3.1 `useIntelSearch()` hook | `src/hooks/use-intel-search.ts` -- TanStack Query hook returning `SearchResult[]`. Each result must include `id: string` (alert ID) and `category: string` (category ID matching `KNOWN_CATEGORIES` entries). | Pending (WS-3.1 not yet implemented) |
| WS-3.1 `SearchResult` type | Exported interface from `src/hooks/use-intel-search.ts` with at minimum: `id`, `title`, `category`, `severity`, `priority`, `score`. | Pending (WS-3.1 not yet implemented) |
| WS-3.2 Search result `CommandItem` components | The intel search results group rendered inside `CommandPalette.tsx`. Each result is a `CommandItem` with an `onSelect` callback. WS-3.3 defines what that callback does. | Pending (WS-3.2 not yet implemented) |
| WS-3.4 Fast morph support | Extended `startMorph(targetId, options?)` signature in `ui.store.ts` where `options.fast === true` causes `useMorphChoreography` to skip `expanding` + `settled` phases, transitioning directly `idle -> entering-district` with 300ms total duration. | Pending (WS-3.4 not yet implemented) |
| `setDistrictPreselectedAlertId()` | `useCoverageStore.getState().setDistrictPreselectedAlertId(id)` -- sets the alert ID to pre-select when entering district view. Consumed once by `DistrictViewOverlay` on mount. | Available [CODEBASE: `src/stores/coverage.store.ts` lines 196-199] |
| `startMorph()` | `useUIStore.getState().startMorph(nodeId)` -- initiates the morph state machine. Guards: only fires when `morph.phase === 'idle'`. Will be extended by WS-3.4 to accept an optional second argument. | Available [CODEBASE: `src/stores/ui.store.ts` lines 102-110] |
| `setCommandPaletteOpen()` / `setOpen()` | `useUIStore.getState().setCommandPaletteOpen(false)` -- closes the command palette. Also available as `setOpen(false)` from `useCommandPalette()` hook return. | Available [CODEBASE: `src/stores/ui.store.ts` lines 146-149, `src/hooks/use-command-palette.ts` line 63] |
| `DistrictViewOverlay` preselection consumption | The overlay reads `districtPreselectedAlertId` in a `useEffect` gated by `isVisible`, passes it to local `setSelectedAlertId`, and clears the store field. No changes needed. | Available [CODEBASE: `src/components/district-view/district-view-overlay.tsx` lines 62-70] |

## 4. Deliverables

### 4.1 Navigation Handler Function

A callback function defined in `page.tsx` and passed to `CommandPalette` via the `onSearchResultSelect` callback prop (WS-3.2 D-2). The function accepts a search result and performs the 4-step sequence.

**Sequence (must execute in this order):**

```
Step 1: setDistrictPreselectedAlertId(result.id)
Step 2: setOpen(false)                              // close command palette
Step 3: startMorph(result.category, { fast: true }) // fast morph to district
```

Step 1 must precede Step 3 because `startMorph` triggers the morph state machine, which eventually causes `DistrictViewOverlay` to mount and read `districtPreselectedAlertId`. If the ID is not set before the morph begins, the overlay will mount with no preselection.

Step 2 (closing the palette) should occur before Step 3 (starting the morph) so the palette is no longer visible when the morph animation begins. The command palette sits at z-50 (via Dialog), which would overlay the district entrance animation at z-30. Closing first ensures visual clarity.

**Signature sketch:**

```typescript
const handleSearchResultSelect = useCallback(
  (result: SearchResult) => {
    setDistrictPreselectedAlertId(result.id)
    setOpen(false)
    startMorph(result.category, { fast: true })
  },
  [setDistrictPreselectedAlertId, setOpen, startMorph],
)
```

### 4.2 Wiring to Search Result CommandItems

The handler from 4.1 is passed as the `onSelect` callback to each search result `CommandItem` rendered by WS-3.2's intel search group. The exact integration point depends on how WS-3.2 structures the search results group, but the pattern follows the existing command item selection:

```tsx
<CommandItem
  key={result.id}
  value={result.id}
  onSelect={() => handleSearchResultSelect(result)}
>
  {/* result display content (rendered by WS-3.2) */}
</CommandItem>
```

If WS-3.2 renders search results as a sub-component or via a render function, the handler is threaded through accordingly. The key contract is: when the user clicks or presses Enter on a search result, `handleSearchResultSelect` is called with the full `SearchResult` object.

### 4.3 Store Reads Required

The handler needs access to three store actions. These are obtained via hooks at the component level and closed over in the callback:

| Store | Selector / Action | Purpose |
|-------|-------------------|---------|
| `useCoverageStore` | `setDistrictPreselectedAlertId` | Set the alert ID for the district overlay to consume |
| `useUIStore` | `startMorph` | Initiate the fast morph to the target category district |
| `useCommandPalette` | `setOpen` | Close the command palette |

The handler is defined in `page.tsx` (per D-2), where `startMorph` is already available via `useUIStore((s) => s.startMorph)` (line 251) and `setDistrictPreselectedAlertId` via `useCoverageStore((s) => s.setDistrictPreselectedAlertId)`. The handler is passed to `CommandPalette` via the `onSearchResultSelect` callback prop (WS-3.2 D-2). `setOpen` is called internally by `CommandPalette` when the callback fires (the palette closes itself before propagating the selection).

```typescript
// In page.tsx:
const handleSearchResultSelect = useCallback(
  (result: SearchResult) => {
    setDistrictPreselectedAlertId(result.id)
    startMorph(result.category, { fast: true })
  },
  [setDistrictPreselectedAlertId, startMorph],
)

// Passed as prop:
<CommandPalette onSearchResultSelect={handleSearchResultSelect} />
```

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Clicking a search result in the command palette closes the palette and navigates to the result's category district. | Open command palette (Cmd+K), type a search query that returns results, click a result. The palette closes, the morph animation plays, and the `DistrictViewOverlay` appears showing the correct category. |
| AC-2 | The district overlay opens with the clicked search result's alert pre-selected in the dock panel. | After navigation completes, the `DistrictViewDock` shows the alert detail view for the clicked result (not the default category metadata view). The alert's title matches the search result that was clicked. |
| AC-3 | The morph uses the fast path (AD-4): ~300ms total, skipping `expanding` and `settled` phases, transitioning directly `idle -> entering-district -> district`. | Add a console.log or use React DevTools to observe morph phase transitions. Confirm the phases are `idle -> entering-district -> district` (no `expanding` or `settled`). Total animation duration is approximately 300ms. |
| AC-4 | `districtPreselectedAlertId` is set before `startMorph` is called. | Add a breakpoint or console.log in both `setDistrictPreselectedAlertId` and `startMorph`. Confirm `setDistrictPreselectedAlertId` fires first with the correct result ID, then `startMorph` fires with the correct category ID. |
| AC-5 | The command palette is closed before the morph animation begins. | Observe visually: the palette dialog is dismissed before the district overlay starts fading in. No z-index stacking conflict between the palette (z-50) and the district overlay (z-30). |
| AC-6 | If the morph state machine is not in `idle` when a search result is clicked, the click is silently ignored (no error, no partial state change). | While a morph is in progress (e.g., a district is already open), open the command palette, search, and click a result. Nothing happens. No console errors. No store state corruption. |
| AC-7 | Pressing Enter on a keyboard-focused search result triggers the same navigation as clicking. | Open command palette, type a query, arrow-key to a result, press Enter. Same behavior as AC-1 through AC-5. |
| AC-8 | `pnpm typecheck` passes with no errors after the changes. | TypeScript compiler exits with code 0. |
| AC-9 | `pnpm build` completes without errors. | Build pipeline exits 0. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Reuse the `districtPreselectedAlertId` pattern rather than introducing a new navigation mechanism. | The pattern is already proven: (1) `page.tsx` `handleViewDistrict` sets the ID then calls `startMorph` (lines 254-264), (2) `DistrictViewOverlay` consumes the ID in a `useEffect` gated by `isVisible` (lines 62-70). The search navigation has identical semantics -- navigate to a district with a specific alert pre-selected. Reusing the pattern means zero changes to `DistrictViewOverlay`, `DistrictViewDock`, or `DistrictViewContent`. | (a) Pass the alert ID as a parameter to `startMorph` and thread it through the morph state machine -- rejected: would require adding an `alertId` field to `MorphState`, modifying `ui.store.ts`, and adding consumption logic in the overlay. Significant scope increase for no user-facing benefit. The existing store field is designed for exactly this purpose. (b) URL-based navigation (`?district=seismic&alert=abc-123`) -- rejected: would require URL parsing in the overlay, and the morph state machine does not currently support URL-driven activation for the entering-district phase. Over-engineering for a transient navigation action. |
| D-2 | Define the handler in `page.tsx` and pass it to `CommandPalette` via the `onSearchResultSelect` callback prop (WS-3.2 D-2). | Keeps `CommandPalette` decoupled from the coverage/district store -- it does not need to import `useCoverageStore` or `useUIStore`. Page.tsx already has `startMorph` (line 251) and `setDistrictPreselectedAlertId`, so the handler requires no new store subscriptions. The callback prop pattern established by WS-3.2 D-2 is the canonical integration point. | (a) Define inside `CommandPalette.tsx` with direct store imports -- rejected: contradicts WS-3.2 D-2 which decouples the palette from coverage/district stores via callback prop. Would require `CommandPalette` to import `useCoverageStore` and `useUIStore`. (b) Add to `useCommandPalette` hook -- rejected: the hook manages the structured command registry. Search navigation is not a registered command. (c) Create a new `useSearchNavigation` hook -- rejected: the handler is ~5 lines of store calls with no reusable logic. |
| D-3 | Use fast morph (`{ fast: true }`) for all search result navigation. | Search is an intentional, targeted navigation action. The user has typed a query, scanned results, and clicked a specific one. The standard morph's `expanding` (400ms) + `settledHold` (200ms) phases exist to provide spatial context during exploratory browsing (clicking category cards in the grid). In search-driven navigation, that spatial context is unnecessary -- the user already knows where they want to go. The fast morph's 300ms `idle -> entering-district` transition provides responsive feedback without the intermediate phases. | (a) Use the standard morph (1200ms total through all phases) -- rejected: feels sluggish for intentional search navigation. The intermediate `expanding` and `settled` phases show the category card expanding in the grid, which provides no value when the user navigated from a search result rather than the grid. (b) Make the morph speed configurable per result (e.g., fast for high-confidence results, standard for low-confidence) -- rejected: over-engineering. The user's intent is the same regardless of search score. |
| D-4 | Close the palette before starting the morph (Step 2 before Step 3). | The command palette renders at z-50 (via Dialog component). The district overlay renders at z-30. If the morph starts while the palette is open, the palette visually covers the entrance animation. Closing first ensures the user sees the transition. The palette close is synchronous (state update via `setOpen(false)`) and renders in the same React commit, so there is no timing gap between palette close and morph start. | (a) Close the palette after the morph reaches `entering-district` or `district` -- rejected: the palette would visually cover the morph animation for 300ms, which looks broken. (b) Close the palette simultaneously with the morph (same statement) -- rejected: functionally identical to closing first since both are synchronous state updates batched by React, but expressing them as separate ordered steps makes the intent clearer in code review. |
| D-5 | Do not guard against `morph.phase !== 'idle'` in the handler; rely on `startMorph`'s built-in guard. | `startMorph` in `ui.store.ts` (line 104) already contains the guard: `if (state.morph.phase !== 'idle') return`. Adding a duplicate guard in the click handler would be defensive duplication. The `setDistrictPreselectedAlertId` call before `startMorph` is harmless if the morph is skipped -- the preselected ID will be ignored (no overlay mounts to consume it) and overwritten by the next successful navigation. | (a) Add a pre-check in the handler: `if (morphPhase !== 'idle') return` -- rejected: requires subscribing to `morph.phase` in the component for a guard that already exists in the store. The pre-check would also need to prevent `setDistrictPreselectedAlertId` from being called, which adds complexity for an edge case with no user-facing consequence (an unconsumed preselected ID is a no-op). |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | If the user is already viewing a district (morph.phase === 'district') and searches for an alert in a different category, should the handler trigger a reverse morph first, then a forward fast morph to the new category? Currently, `startMorph` guards against `phase !== 'idle'`, so the click would be silently ignored. This means the user must manually close the current district before searching for alerts in a different category. | react-developer | Phase 3 (during implementation, once fast morph is testable. May require a `switchDistrict(fromCategory, toCategory, alertId)` helper that chains reverse + forward morphs.) |
| Q-2 | If the user searches for an alert in the same category as the currently open district (morph.phase === 'district' and morph.targetId === result.category), should the handler skip the morph entirely and directly set `districtPreselectedAlertId` + trigger a re-read in the overlay? This would instantly scroll/highlight the alert without a close-and-reopen animation. | react-developer | Phase 3 (during implementation. This is the same question as WS-2.3 Q-2, now applied to search results.) |
| Q-3 | Should the `districtPreselectedAlertId` value be cleared if the fast morph is silently blocked by the idle guard (D-5)? Currently a blocked morph leaves an orphaned preselected ID in the store. The value is harmless (overwritten on next navigation, ignored if no overlay mounts), but it is technically stale state. | react-developer | Phase 3 (low priority, address during implementation if it causes observable issues) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-3.4 (fast morph support) is not implemented when WS-3.3 begins, causing `startMorph(id, { fast: true })` to ignore the options argument and run the standard morph. | Medium | Low | The standard morph still works correctly. The user experiences the full 1200ms morph animation instead of the 300ms fast morph. The `districtPreselectedAlertId` pattern is unaffected by morph speed. Implement with the `{ fast: true }` option and accept the standard morph as a graceful fallback until WS-3.4 lands. No code changes needed when WS-3.4 is delivered -- it extends `startMorph` to recognize the option. |
| R-2 | WS-3.2 (search results group in CommandPalette) structures the results in a way that makes wiring `onSelect` non-trivial (e.g., results rendered in a child component without callback props). | Low | Low | WS-3.2's description specifies `CommandItem` components for results, which accept `onSelect` natively. If the rendering is delegated to a sub-component, the handler can be passed as a prop or accessed via store actions directly (using `getState()` inside the child). The handler is 3 store calls with no component-level dependencies. |
| R-3 | `SearchResult.category` does not match `KNOWN_CATEGORIES` IDs, causing `startMorph` to target an invalid district. | Low | Medium | WS-3.1 defines `SearchResult.category` as the category ID returned by the backend search endpoint. The backend uses the same category taxonomy as the frontend (`KNOWN_CATEGORIES` in `src/lib/interfaces/coverage.ts`). If a mismatch occurs, `startMorph` will set `morph.targetId` to the invalid ID, and `DistrictViewOverlay` will render with no matching category data. Mitigation: add a guard in the handler to validate `result.category` against `KNOWN_CATEGORIES` before calling `startMorph`. Log a warning if the category is unrecognized and skip navigation. |
| R-4 | The `districtPreselectedAlertId` is consumed by `DistrictViewOverlay` before the search result's corresponding alert data is available in the district's data hooks, causing the dock panel to show a loading or not-found state for the preselected alert. | Low | Low | This is a timing issue inherent to the preselection pattern, not specific to search. The `DistrictViewOverlay` sets `selectedAlertId` from the preselected value, and the dock panel fetches or finds the alert data via `useCategoryIntel`. If the alert data has not loaded yet, the dock shows a loading state -- which is the correct behavior. The same situation can occur in the INSPECT -> VIEW DISTRICT flow. No mitigation needed beyond the existing loading state handling. |
| R-5 | Race condition: user clicks a search result, palette closes, but React batches the `setOpen(false)` and `startMorph` state updates such that the morph begins before the palette DOM is removed. | Very Low | Very Low | React 18+ batches state updates within the same synchronous event handler. Both `setOpen(false)` and `startMorph()` are synchronous Zustand state updates. They will be batched into a single render cycle. The palette's `AnimatePresence` exit animation may still be in progress when the morph begins, but since the palette is at z-50 and the district overlay is at z-30, the palette's fade-out overlays the morph entrance -- this is visually acceptable and consistent with how the palette dismisses during structured command execution today. |
