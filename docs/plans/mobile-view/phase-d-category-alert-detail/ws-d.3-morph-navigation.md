# WS-D.3: Morph + Navigation

> **Workstream ID:** WS-D.3
> **Phase:** D -- Category Detail + Alert Detail
> **Assigned Agent:** `react-developer`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-C.1 (MobileBottomSheet component with `isOpen`, `onDismiss`, `config` props, snap point API, `SheetContext`), WS-C.2 (`useSheetHistory` hook integrated inside MobileBottomSheet -- provides pushState on open, popstate dismissal, removeSheetState on programmatic close; also provides fullscreen mode, focus trap, `aria-modal`), WS-B.2 (MobileCategoryGrid with `handleCardTap` calling `startMorph(categoryId, { fast: true })`), WS-D.1 (MobileCategoryDetail content component rendered inside the morph-driven sheet), WS-D.2 (MobileAlertDetail content component with "View Category" and "Show on Map" action buttons)
> **Blocks:** WS-E.3 (Cross-Tab Links extends the `navigateToCategory` and `navigateToMap` handlers established here to all alert contexts: P1 banner, Intel tab alert cards, geo summary "View on Map")
> **Resolves:** OVERVIEW Section 4.4 morph flow, `interface-architecture.md` Section 6.3 mobile morph path, `information-architecture.md` Section 9.2 cross-tab navigation, Section 9.3 back navigation, OQ-4 from WS-C.2 (tab switch + morph cleanup race condition)

---

> **Review Fixes Applied (Phase D Review):**
>
> - **H-4 (integration code misalignment):** Updated `MobileCategoryDetail` rendering to use D.1's authoritative props: `onAlertTap` (not `onViewAlert`), removed `onNavigateToMap`, added `onBack`, `currentSnap`, `selectedAlertId`.
> - **M-4 (dependency table D.1 row):** Changed `onViewAlert` to `onAlertTap` in Section 3 WS-D.1 dependency description.
> - **M-5 (dependency table D.2 row):** Added `basic` parameter to `onShowOnMap` signature to match D.3's own `navigateToMap` type.

---

## 1. Objective

Wire the morph state machine to the mobile bottom sheet lifecycle so that tapping a category card on the Situation tab opens a category detail bottom sheet, dismissing the sheet reverses the morph, and the browser back button dismisses the sheet instead of navigating away. Additionally, implement the two cross-tab navigation handlers ("View Category" and "Show on Map") that WS-D.2's alert detail action buttons invoke.

The desktop morph system drives a 6-phase animation sequence through `useMorphChoreography`, culminating in a full-screen overlay (`DistrictViewOverlay`). On mobile, the morph system reuses the same state machine and choreography hook but drives a bottom sheet instead of an overlay. The fast path (`startMorph(id, { fast: true })`) skips the `expanding` and `settled` phases, producing a 3-phase mobile sequence: `idle -> entering-district (300ms) -> district`. The bottom sheet's spring animation runs concurrently with the `entering-district` phase, so the user perceives a single seamless open gesture.

This workstream is the integration layer between three independently-delivered subsystems: the morph state machine (existing), the bottom sheet framework (WS-C.1 + WS-C.2), and the mobile navigation model (WS-A.2's tab system). It introduces no new visual components -- only hooks, handlers, and wiring code.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `useMobileMorphBridge` hook | Reads morph state from `ui.store` and derives bottom sheet control props: `isOpen`, `categoryId`, `onDismiss`. Bridges the morph state machine to the sheet lifecycle. |
| `useMorphChoreography` mount in `MobileView` | Mount the existing choreography hook in the mobile component tree so phase timers advance on mobile (entering-district -> district, leaving-district -> idle). Without this mount, the morph state machine stalls at `entering-district` forever. |
| Sheet dismiss -> `reverseMorph()` coordination | Wire the bottom sheet's `onDismiss` callback to call `reverseMorph()`. Handle the distinction between programmatic dismiss (swipe, backdrop, Escape) and popstate dismiss (back button) -- both converge on the same handler because WS-C.2's `useSheetHistory` manages history cleanup internally. |
| Browser back button sheet dismissal | Verify and document that WS-C.2's built-in `useSheetHistory` handles popstate -> onDismiss -> reverseMorph -> sheet closes. No additional popstate listener needed in this workstream; the integration is through the `onDismiss` prop. |
| Tab switch morph guard | When the user switches tabs while a morph is active (phase !== `idle`), instantly reset the morph state via `resetMorph()`. This prevents a stale morph from blocking subsequent interactions. Answers OQ-4 from WS-C.2. |
| `navigateToCategory` handler | Cross-tab action: close the current sheet (if any), switch to the Situation tab, call `startMorph(categoryId, { fast: true })` to open the category detail sheet. Used by WS-D.2's "View Category" button. |
| `navigateToMap` handler | Cross-tab action: close the current sheet (if any), reset morph state, switch to the Map tab, set category filter, fly the map to the alert's coordinates, and optionally highlight the marker. Used by WS-D.2's "Show on Map" button. |
| `MobileView` integration | Wire all hooks and handlers into the `MobileView` component. Pass `navigateToCategory` and `navigateToMap` down to `MobileCategoryDetail` and `MobileAlertDetail` as props. |
| Unit tests | Tests for `useMobileMorphBridge`, tab switch guard, cross-tab navigation handlers, and morph phase advancement on mobile. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileBottomSheet` component | WS-C.1 + WS-C.2 scope. This WS consumes it via props. |
| `useSheetHistory` hook implementation | WS-C.2 scope. This WS relies on it being integrated inside `MobileBottomSheet`. |
| `MobileCategoryDetail` content | WS-D.1 scope. This WS provides the sheet container and open/close mechanism. |
| `MobileAlertDetail` content | WS-D.2 scope. This WS provides the navigation handlers that D.2's buttons invoke. |
| Card tap gesture (`useLongPress`, `MobileCategoryCard`) | WS-B.2 scope. This WS receives the `startMorph` call as an upstream input. |
| Desktop morph behavior changes | All wiring is within `MobileView.tsx` and mobile-specific hooks. Desktop rendering is unaffected. |
| Wiring "Show on Map" / "View Category" from all contexts | WS-E.3 scope. This WS establishes the handler pattern; E.3 wires it into P1 banner, Intel tab alert cards, and geo summary. |
| Landscape layout | WS-F.1 scope. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/stores/ui.store.ts` | `startMorph(nodeId, options?)`, `reverseMorph()`, `resetMorph()`, `morph.phase`, `morph.targetId`, `morph.fast`, `morph.direction` | Exists |
| `src/lib/morph-types.ts` | `MorphPhase`, `MorphDirection`, `MorphState`, `StartMorphOptions`, `MORPH_TIMING_FAST` (enteringDistrict: 300ms, leavingDistrict: 400ms) | Exists |
| `src/hooks/use-morph-choreography.ts` | `useMorphChoreography({ prefersReducedMotion })` returning `{ phase, direction, targetId, isMorphing, startMorph, reverseMorph }`. Drives phase timers. | Exists |
| `src/stores/coverage.store.ts` | `toggleCategory(id)`, `clearSelection()`, `selectMapAlert(id, category, basic)`, `clearMapAlert()`, `selectedMapAlertId`, `selectedCategories`, `setDistrictPreselectedAlertId(id)` | Exists |
| WS-C.1 `MobileBottomSheet` | Component with props: `isOpen: boolean`, `onDismiss: () => void`, `config: BottomSheetConfig`, `ariaLabel: string`, `sheetId: string`, `children: ReactNode` | Pending (WS-C.1 + WS-C.2) |
| WS-C.2 `useSheetHistory` | Integrated inside `MobileBottomSheet`. Pushes history state on open, listens for popstate, calls `onDismiss` on back button, calls `removeSheetState` on programmatic close. Idempotent `removeSheetState`. | Pending (WS-C.2) |
| WS-C.1 `SHEET_CONFIGS` | `SHEET_CONFIGS.categoryDetail` with snap points `[35, 65, 100]` for the category detail sheet | Pending (WS-C.1) |
| WS-A.2 `MobileShell` | `activeTab` state, `setActiveTab(tab)` setter, tab change callback mechanism | Pending (WS-A.2) |
| WS-B.2 `MobileCategoryGrid` | Calls `startMorph(categoryId, { fast: true })` in its `handleCardTap` handler | Pending (WS-B.2) |
| WS-D.1 `MobileCategoryDetail` | Content component accepting `categoryId: string`, `onAlertTap: (alertId: string) => void`, `onBack: () => void`, `currentSnap: number`, `selectedAlertId?: string \| null` | Pending (WS-D.1) |
| WS-D.2 `MobileAlertDetail` | Content component accepting `onViewCategory: (categoryId: string) => void`, `onShowOnMap: (alertId: string, coords: { lat: number; lng: number }, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void` | Pending (WS-D.2) |
| WS-C.3 `MobileMapView` | Exposes `externalMapRef` for programmatic `flyTo` control | Pending (WS-C.3) |

---

## 4. Deliverables

### D-1: `useMobileMorphBridge` hook (`src/hooks/use-mobile-morph-bridge.ts`)

A bridge hook that reads the morph state machine from `ui.store` and derives the props needed to control a `MobileBottomSheet` for the category detail drill-down. This hook does not call `setMorphPhase` -- it is a read-only observer of morph state.

**Type signature:**

```typescript
export interface MobileMorphBridgeReturn {
  /**
   * Whether the category detail bottom sheet should be open.
   * True when morph.phase is 'entering-district' or 'district'.
   * False for 'idle', 'leaving-district', 'expanding', 'settled'.
   *
   * 'leaving-district' maps to false (not true) because the sheet's
   * own spring-to-zero animation handles the visual close. If we kept
   * isOpen=true during leaving-district, the sheet would appear frozen
   * for 300ms before beginning its close animation.
   */
  isOpen: boolean

  /**
   * The category ID being viewed. Null when morph is idle.
   * Derived from morph.targetId.
   */
  categoryId: string | null

  /**
   * Dismiss handler to pass as the sheet's onDismiss prop.
   * Calls reverseMorph() from ui.store.
   *
   * This handler is safe to call from any dismiss source (swipe,
   * backdrop, Escape, popstate) because:
   * - For programmatic dismiss: MobileBottomSheet's internal
   *   useSheetHistory calls removeSheetState() before onDismiss.
   * - For popstate dismiss: the history entry was already popped
   *   by the browser; useSheetHistory calls onDismiss without
   *   calling history.back().
   * - reverseMorph() is idempotent for non-applicable phases.
   */
  onDismiss: () => void
}

export function useMobileMorphBridge(): MobileMorphBridgeReturn
```

**Implementation:**

```typescript
import { useCallback } from 'react'
import { useUIStore } from '@/stores/ui.store'
import { useCoverageStore } from '@/stores/coverage.store'

export function useMobileMorphBridge(): MobileMorphBridgeReturn {
  const phase = useUIStore((s) => s.morph.phase)
  const targetId = useUIStore((s) => s.morph.targetId)
  const reverseMorph = useUIStore((s) => s.reverseMorph)
  const clearDistrictFilters = useCoverageStore((s) => s.clearDistrictFilters)

  const isOpen = phase === 'entering-district' || phase === 'district'

  const onDismiss = useCallback(() => {
    clearDistrictFilters()
    reverseMorph()
  }, [reverseMorph, clearDistrictFilters])

  return {
    isOpen,
    categoryId: targetId,
    onDismiss,
  }
}
```

**Design decisions:**

| Decision | Value | Rationale |
|----------|-------|-----------|
| `isOpen` excludes `leaving-district` | `phase === 'entering-district' \|\| phase === 'district'` | The sheet's spring close animation provides the visual exit. Including `leaving-district` in `isOpen` would delay the close by 300ms (the morph timer duration) before the sheet begins animating. By setting `isOpen = false` immediately when `reverseMorph()` transitions to `leaving-district`, the sheet begins its spring-to-zero animation concurrently with the morph timer. Both complete in approximately 300ms. |
| `isOpen` includes `entering-district` | Yes | The sheet opens as soon as the morph begins. The sheet's spring-from-zero animation (opening) runs concurrently with the morph's `entering-district` timer (300ms). The user perceives a single open gesture. |
| `onDismiss` calls `clearDistrictFilters()` | Matches desktop `DistrictViewOverlay.handleBack` | The desktop overlay clears district-scoped filters (source filter, bbox filter) on back navigation. Mobile preserves this behavior. |
| No `fromPopstate` flag | Single handler for all dismiss sources | WS-C.2's `useSheetHistory` manages the history stack internally. The `onDismiss` callback doesn't need to know whether it was triggered by popstate or programmatic close. `reverseMorph()` is safe to call regardless. |

**File location:** `src/hooks/use-mobile-morph-bridge.ts`

**Estimated size:** ~40 lines.

---

### D-2: `useMorphChoreography` mount in `MobileView` (`src/components/mobile/MobileView.tsx` -- modified)

The existing `useMorphChoreography` hook must be mounted in the mobile component tree to drive phase timer advancement. On desktop, it is mounted inside `MorphOrchestrator` (which is not loaded on mobile). Without this mount, calling `startMorph(id, { fast: true })` sets `morph.phase = 'entering-district'` but the phase never advances to `district` because no timer fires.

**Integration point in `MobileView`:**

```typescript
import { useMorphChoreography } from '@/hooks/use-morph-choreography'

export function MobileView() {
  const prefersReducedMotion = usePrefersReducedMotion()

  // Mount morph choreography to drive phase timers on mobile.
  // On desktop this is mounted in MorphOrchestrator. On mobile,
  // MorphOrchestrator is not loaded, so we mount it here.
  // The hook drives: entering-district (300ms) -> district (forward)
  // and leaving-district (300ms) -> idle (reverse).
  const { phase } = useMorphChoreography({ prefersReducedMotion })

  // ... rest of MobileView
}
```

The `usePrefersReducedMotion` hook is already defined in `page.tsx` (lines 126-129). Extract it to a shared location (`src/hooks/use-prefers-reduced-motion.ts`) or duplicate it in MobileView. Given the separate mobile component tree principle (AD-1), duplication is acceptable.

**Timing on mobile (fast path):**

| Phase | Duration | What Happens |
|-------|----------|-------------|
| `idle` | -- | Resting state. No sheet. |
| `entering-district` | 300ms (`MORPH_TIMING_FAST.enteringDistrict`) | Sheet opens (spring animation). URL synced with `?category={id}`. Timer advances to `district`. |
| `district` | Stable | Sheet fully interactive. Category detail content rendered. |
| `leaving-district` | 400ms (`MORPH_TIMING_FAST.leavingDistrict`) | Sheet closing (spring-to-zero). Timer advances to `idle` via `resetMorph()`. URL `?category=` param removed. |
| `idle` | -- | Morph reset. Sheet closed. |

**Reduced motion:** When `prefers-reduced-motion: reduce` is active, `MORPH_TIMING_REDUCED` is used (all durations = 0). The morph phase advances instantly. The sheet still animates using its own reduced-motion handling (per WS-C.2), which also uses `duration: 0` for spring transitions.

**What the hook does NOT do on mobile:**
- The hook's Escape key handler fires `reverseMorph()` for phases `settled`, `district`, and `entering-district`. On mobile, the `MobileBottomSheet`'s focus trap (WS-C.2) also handles Escape via `onEscape` -> `onDismiss`. Both paths converge on `reverseMorph()`. The morph's Escape handler fires first (window-level keydown) but `reverseMorph()` is idempotent for phases already in reverse -- the second call from the sheet is a no-op.
- The hook syncs the URL with `?category={id}` via `syncUrlCategory()`. This is desired on mobile for deep-linking.

---

### D-3: Category detail sheet wiring in `MobileView` (`src/components/mobile/MobileView.tsx` -- modified)

Wire the `useMobileMorphBridge` hook to a `MobileBottomSheet` instance that renders `MobileCategoryDetail` content (from WS-D.1).

**Integration code:**

```tsx
import { useMobileMorphBridge } from '@/hooks/use-mobile-morph-bridge'
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet'
import { MobileCategoryDetail } from '@/components/mobile/MobileCategoryDetail'
import { SHEET_CONFIGS } from '@/components/mobile/sheet-configs'

export function MobileView() {
  // ... existing code ...

  const {
    isOpen: isCategorySheetOpen,
    categoryId: morphCategoryId,
    onDismiss: handleCategorySheetDismiss,
  } = useMobileMorphBridge()

  // ... in the JSX return:
  return (
    <>
      <MobileShell /* ... existing props ... */>
        {/* ... tab content ... */}
      </MobileShell>

      {/* Category detail bottom sheet -- driven by morph state machine */}
      <MobileBottomSheet
        isOpen={isCategorySheetOpen}
        onDismiss={handleCategorySheetDismiss}
        config={SHEET_CONFIGS.categoryDetail}
        sheetId="category-detail"
        ariaLabel={
          morphCategoryId
            ? `${getCategoryMeta(morphCategoryId)?.displayName ?? morphCategoryId} category detail`
            : 'Category detail'
        }
      >
        {morphCategoryId && (
          <MobileCategoryDetail
            categoryId={morphCategoryId}
            onAlertTap={handleViewAlertFromCategory}
            onBack={handleCategorySheetDismiss}
            currentSnap={categorySheetSnap}
            selectedAlertId={selectedAlertId}
          />
        )}
      </MobileBottomSheet>

      {/* ... other sheets (alert detail, settings, etc.) ... */}
    </>
  )
}
```

**Sheet configuration:** Uses `SHEET_CONFIGS.categoryDetail` with snap points `[35, 65, 100]` (per WS-C.1). The `sheetId` value `'category-detail'` is used by `useSheetHistory` for history state identification and nested sheet ordering.

**`ariaLabel` derivation:** Uses `getCategoryMeta()` from `src/lib/interfaces/coverage.ts` to produce a human-readable label like "Seismic category detail". Falls back to the raw `morphCategoryId` string if meta lookup fails.

**Content guard:** The `{morphCategoryId && ...}` guard prevents rendering `MobileCategoryDetail` with a null `categoryId`. The sheet component itself handles the visual open/close animation; the content only mounts when a valid category is selected.

---

### D-4: Tab switch morph guard (`src/components/mobile/MobileShell.tsx` or `MobileView.tsx` -- modified)

**Problem:** If the user taps a tab in the bottom navigation while a category detail sheet is open (morph phase = `district`), the morph state must be cleaned up. Without this guard, switching to the Map tab leaves `morph.phase = 'district'` and `morph.targetId` set, which blocks future `startMorph` calls (the idle guard in `startMorph` prevents re-entry) and leaves a stale history entry.

**Resolution (OQ-4 from WS-C.2):** The tab switch handler calls `resetMorph()` directly (instant, no animation) rather than `reverseMorph()` (which would queue a 300ms `leaving-district` animation during a tab switch -- disorienting). The `MobileBottomSheet`'s cleanup handles the history entry:

1. Tab switch fires `setActiveTab(newTab)`.
2. Guard: if `morph.phase !== 'idle'`, call `resetMorph()`.
3. `resetMorph()` sets `morph.phase = 'idle'`, clears `targetId`, `direction`, `fast`.
4. `useMobileMorphBridge.isOpen` becomes `false`.
5. `MobileBottomSheet` receives `isOpen = false` -> begins spring-to-zero close animation.
6. Sheet's internal `useSheetHistory` detects `isOpen` going false -> calls `removeSheetState()` -> `history.back()` to clean the stale entry.
7. The `hasPushedState` guard in `useSheetHistory` prevents double-pop if the entry was already consumed.

**Implementation (modify tab change handler):**

```typescript
// In MobileShell or MobileView, wherever the tab switch handler lives:
import { useUIStore } from '@/stores/ui.store'
import { useCoverageStore } from '@/stores/coverage.store'

const morphPhase = useUIStore((s) => s.morph.phase)
const resetMorph = useUIStore((s) => s.resetMorph)
const clearDistrictFilters = useCoverageStore((s) => s.clearDistrictFilters)

const handleTabChange = useCallback((newTab: TabId) => {
  // Guard: clean up active morph before switching tabs.
  // Uses resetMorph (instant) rather than reverseMorph (animated)
  // because the tab switch itself provides the navigation feedback.
  if (morphPhase !== 'idle') {
    clearDistrictFilters()
    resetMorph()
  }

  setActiveTab(newTab)
}, [morphPhase, resetMorph, clearDistrictFilters, setActiveTab])
```

**Why `resetMorph()` instead of `reverseMorph()`:** The tab switch is an explicit navigation action. Animating a sheet close (300ms spring + 300ms morph timer) before the tab content appears would add 300-600ms of latency to tab switches. `resetMorph()` is instant, and the sheet's spring close animation (driven by `isOpen = false`) runs concurrently with the tab content mount.

**Edge case: rapid tab switching during morph animation.** If the user taps a card (entering-district phase begins) and immediately switches tabs before the morph reaches `district`:
- `morphPhase` is `entering-district` at the time of tab switch.
- `resetMorph()` clears the state, cancelling the pending choreography timer.
- `useMorphChoreography`'s timer ref is cleaned up by React's effect cleanup when the phase changes.
- No orphaned timers.

---

### D-5: `navigateToCategory` handler (`src/components/mobile/MobileView.tsx` -- modified)

Cross-tab navigation handler invoked by the "View Category" action button in WS-D.2's `MobileAlertDetail`. Closes the current context, switches to the Situation tab, and opens the category detail sheet via the morph state machine.

**Type signature:**

```typescript
/**
 * Navigate from any context to a category detail bottom sheet.
 *
 * Flow:
 * 1. If a map alert is selected (INSPECT mode), clear it.
 * 2. If morph is active, reset it instantly.
 * 3. Switch to the Situation tab.
 * 4. Schedule startMorph with a microtask delay (allows React to
 *    commit the tab switch and resetMorph before starting a new morph).
 * 5. The morph state machine opens the category detail sheet.
 *
 * @param categoryId - The category to navigate to (e.g., 'seismic').
 */
const navigateToCategory: (categoryId: string) => void
```

**Implementation:**

```typescript
const navigateToCategory = useCallback((categoryId: string) => {
  // 1. Clear any open map alert selection
  const store = useCoverageStore.getState()
  if (store.selectedMapAlertId) {
    store.clearMapAlert()
  }

  // 2. Reset active morph (if navigating from one category to another)
  const uiState = useUIStore.getState()
  if (uiState.morph.phase !== 'idle') {
    store.clearDistrictFilters()
    uiState.resetMorph()
  }

  // 3. Switch to Situation tab
  setActiveTab('situation')

  // 4. Schedule morph after React commits the reset + tab switch.
  // queueMicrotask runs after the current synchronous work but before
  // the next paint, ensuring resetMorph has been applied to the store
  // and the idle guard in startMorph will pass.
  queueMicrotask(() => {
    useUIStore.getState().startMorph(categoryId, { fast: true })
  })
}, [setActiveTab])
```

**Why `queueMicrotask`:** Zustand state updates are synchronous, but `startMorph` has an idle guard (`if (phase !== 'idle') return`). If `resetMorph` and `startMorph` are called synchronously in the same handler, `startMorph` reads the state after `resetMorph` has applied (Zustand updates are sync with immer), so the guard passes. However, using `queueMicrotask` provides an explicit ordering guarantee that works even if the internal batching behavior changes. It also allows React to process the tab switch render before the morph begins, preventing a flash of the old tab content with the new morph state.

**Prop threading:** The `navigateToCategory` handler is defined in `MobileView` and passed down through the component tree:

```
MobileView (defines navigateToCategory)
  -> MobileBottomSheet (category detail)
    -> MobileCategoryDetail (receives as onNavigateToCategory -- not used here)
      -> MobileAlertDetail (receives as onViewCategory)
        -> "View Category: {name}" button calls onViewCategory(categoryId)
  -> MobileBottomSheet (map alert detail)
    -> MobileAlertDetail (receives as onViewCategory)
      -> "View Category: {name}" button calls onViewCategory(categoryId)
```

**Nested sheet handling:** When navigating from an alert detail sheet (nested inside category detail) to a different category, the flow is:

1. Alert detail's "View Category: Weather" tapped.
2. `navigateToCategory('weather')` runs.
3. Step 2 calls `resetMorph()` -> morph.phase = idle -> `useMobileMorphBridge.isOpen = false`.
4. Category detail sheet closes (isOpen = false). Its `useSheetHistory` cleanup pops the history entry.
5. The alert detail sheet was nested inside the category detail. When the category detail unmounts, the alert detail unmounts too. The alert detail's `useSheetHistory` cleanup pops its history entry.
6. Step 3 switches to Situation tab (may already be there).
7. Step 4 schedules `startMorph('weather', { fast: true })`.
8. New category detail sheet opens for Weather.

---

### D-6: `navigateToMap` handler (`src/components/mobile/MobileView.tsx` -- modified)

Cross-tab navigation handler invoked by the "Show on Map" action button in WS-D.2's `MobileAlertDetail`. Closes the current context, switches to the Map tab, filters to the alert's category, and flies the map to the alert's location.

**Type signature:**

```typescript
/**
 * Navigate from any context to the Map tab, centered on a specific alert.
 *
 * Flow:
 * 1. If morph is active, reset it instantly.
 * 2. Clear any existing map alert selection.
 * 3. Set category filter to include the alert's category.
 * 4. Switch to the Map tab.
 * 5. After the map tab mounts, fly to the alert's coordinates.
 * 6. Optionally select the alert marker to open the map alert detail sheet.
 *
 * @param alertId - The alert to highlight on the map.
 * @param coords - The geographic coordinates to fly to.
 * @param category - The alert's category (for filter activation).
 * @param basic - Basic alert data for the map alert detail sheet.
 */
const navigateToMap: (
  alertId: string,
  coords: { lat: number; lng: number },
  category: string,
  basic: { title: string; severity: string; ingestedAt: string },
) => void
```

**Implementation:**

```typescript
const mapRef = useRef<MapRef>(null)  // Shared ref passed to MobileMapView

const navigateToMap = useCallback((
  alertId: string,
  coords: { lat: number; lng: number },
  category: string,
  basic: { title: string; severity: string; ingestedAt: string },
) => {
  const coverageStore = useCoverageStore.getState()
  const uiState = useUIStore.getState()

  // 1. Reset active morph
  if (uiState.morph.phase !== 'idle') {
    coverageStore.clearDistrictFilters()
    uiState.resetMorph()
  }

  // 2. Clear any existing map alert
  coverageStore.clearMapAlert()

  // 3. Set category filter (ensure the target category is in the filter set).
  // If no filters are active (showing all), activate just this category.
  // If filters are active but don't include this category, add it.
  const currentFilters = coverageStore.selectedCategories
  if (currentFilters.length === 0) {
    // Currently showing all. Set filter to just this category
    // so the marker is visible and contextual.
    coverageStore.toggleCategory(category)
  } else if (!currentFilters.includes(category)) {
    // Filters active but this category excluded. Add it.
    coverageStore.toggleCategory(category)
  }
  // If the category is already in the filter set, no change needed.

  // 4. Switch to Map tab
  setActiveTab('map')

  // 5. Fly to coordinates + select marker after the map tab mounts.
  // Use setTimeout to allow React to commit the tab switch and
  // the map to initialize before calling flyTo.
  setTimeout(() => {
    // Fly map to the alert's location
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [coords.lng, coords.lat],
        zoom: Math.max(mapRef.current.getZoom?.() ?? 4, 6),
        duration: 800,
        padding: { bottom: Math.round(window.innerHeight * 0.7) },
      })
    }

    // Select the alert marker to open the map alert detail sheet
    coverageStore.selectMapAlert(alertId, category, basic)
  }, 100) // 100ms: enough for React commit + MapLibre initialization
}, [setActiveTab])
```

**Why `setTimeout(100)` instead of `queueMicrotask`:** The Map tab content (including MapLibre GL JS) may not be mounted yet at the time of the tab switch. MapLibre needs at least one animation frame to initialize its WebGL context and receive the forwarded `mapRef`. A 100ms delay is conservative; the map's `onLoad` callback could be used instead, but that requires additional plumbing through `MobileMapView` that is better addressed in WS-E.3 when all cross-tab contexts are wired.

**`flyTo` padding:** The `padding.bottom` parameter accounts for the bottom sheet that will open for the selected alert (70% viewport height per `SHEET_CONFIGS.alertDetail`). This matches the pattern established in WS-C.4 (Issue 18 fix: "Add `padding.bottom` to `flyTo` call so marker centers in visible area above the sheet").

**Category filter behavior:** Three cases handled:

| Current Filter State | Action | Result |
|---------------------|--------|--------|
| No filters (showing all) | Toggle target category ON | Map shows only target category. Marker is visible. |
| Filters active, includes target | No change | Marker already visible in current filter set. |
| Filters active, excludes target | Toggle target category ON | Add to filter set. Marker becomes visible. |

This is a heuristic. A simpler alternative (always set filters to `[category]`) was rejected because it would discard the user's existing filter selections. The additive approach preserves context.

---

### D-7: Unit tests (`src/__tests__/mobile-morph-bridge.test.ts`)

Test file covering the bridge hook, tab switch guard, and cross-tab navigation handlers. Uses React Testing Library + Vitest.

**`useMobileMorphBridge` tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-1 | `isOpen` is false when morph.phase is idle | Set `ui.store.morph.phase = 'idle'`. Render hook. | `result.current.isOpen === false` |
| T-2 | `isOpen` is true when morph.phase is entering-district | Call `startMorph('seismic', { fast: true })`. Render hook. | `result.current.isOpen === true` |
| T-3 | `isOpen` is true when morph.phase is district | Advance to `district` phase. Render hook. | `result.current.isOpen === true` |
| T-4 | `isOpen` is false when morph.phase is leaving-district | Call `reverseMorph()` from district. Render hook. | `result.current.isOpen === false` |
| T-5 | `categoryId` matches morph.targetId | Call `startMorph('conflict')`. Render hook. | `result.current.categoryId === 'conflict'` |
| T-6 | `categoryId` is null when morph is idle | Set idle state. Render hook. | `result.current.categoryId === null` |
| T-7 | `onDismiss` calls `reverseMorph` | Set phase to `district`. Call `result.current.onDismiss()`. | `morph.phase === 'leaving-district'` AND `morph.direction === 'reverse'` |
| T-8 | `onDismiss` calls `clearDistrictFilters` | Set district source filter. Call `onDismiss()`. | `districtSourceFilter === null` AND `districtBboxEnabled === false` |
| T-9 | `onDismiss` is safe to call when already idle | Set idle state. Call `result.current.onDismiss()`. | No error. Phase remains `idle`. |

**Tab switch morph guard tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-10 | Tab switch during district phase resets morph | Set phase to `district`. Simulate tab switch. | `morph.phase === 'idle'`. `morph.targetId === null`. |
| T-11 | Tab switch during entering-district resets morph | Set phase to `entering-district`. Simulate tab switch. | `morph.phase === 'idle'`. |
| T-12 | Tab switch during idle is a no-op | Set phase to `idle`. Simulate tab switch. | `morph.phase === 'idle'`. `resetMorph` NOT called. |
| T-13 | Tab switch clears district filters | Set `districtSourceFilter = 'usgs'`. Set phase to `district`. Simulate tab switch. | `districtSourceFilter === null`. |

**`navigateToCategory` tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-14 | Clears map alert selection | Set `selectedMapAlertId = 'alert-1'`. Call `navigateToCategory('seismic')`. | `selectedMapAlertId === null`. |
| T-15 | Resets active morph before starting new one | Set phase to `district` with target `'conflict'`. Call `navigateToCategory('seismic')`. Wait for microtask. | Phase transitions through idle then to `entering-district` with `targetId = 'seismic'`. |
| T-16 | Switches to Situation tab | Call `navigateToCategory('weather')`. | `setActiveTab` called with `'situation'`. |
| T-17 | Starts morph with fast path after microtask | Call `navigateToCategory('seismic')`. Flush microtasks. | `startMorph` called with `('seismic', { fast: true })`. |
| T-18 | Works when morph is already idle | Set idle state. Call `navigateToCategory('seismic')`. Flush microtasks. | Phase = `entering-district`. Target = `'seismic'`. No error. |

**`navigateToMap` tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-19 | Resets morph and clears map alert | Set phase to `district`, `selectedMapAlertId = 'x'`. Call `navigateToMap(...)`. | `morph.phase === 'idle'`. `selectedMapAlertId === null` (then re-set). |
| T-20 | Adds category to filter when no filters active | Set `selectedCategories = []`. Call `navigateToMap('a', coords, 'seismic', basic)`. | `selectedCategories === ['seismic']`. |
| T-21 | Adds category to filter when excluded | Set `selectedCategories = ['conflict']`. Call `navigateToMap('a', coords, 'seismic', basic)`. | `selectedCategories` includes `'seismic'`. |
| T-22 | Does not modify filter when category already included | Set `selectedCategories = ['seismic']`. Call `navigateToMap('a', coords, 'seismic', basic)`. | `selectedCategories === ['seismic']` (no duplicate). |
| T-23 | Switches to Map tab | Call `navigateToMap(...)`. | `setActiveTab` called with `'map'`. |
| T-24 | Selects map alert after timeout | Mock `setTimeout`. Call `navigateToMap('alert-1', coords, 'seismic', basic)`. Advance timers by 100ms. | `selectMapAlert` called with `('alert-1', 'seismic', basic)`. |

**Morph phase advancement tests (verifying choreography works on mobile):**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-25 | Fast morph advances entering-district -> district | Call `startMorph('seismic', { fast: true })`. Mount `useMorphChoreography`. Advance timer by 300ms. | `morph.phase === 'district'`. |
| T-26 | reverseMorph transitions district -> leaving-district -> idle | Set phase to `district`. Call `reverseMorph()`. Advance timer by 400ms. | `morph.phase === 'idle'`. `morph.targetId === null`. |
| T-27 | Reduced motion: instant phase advancement | Mock `prefers-reduced-motion: reduce`. Call `startMorph`. | Phase advances to `district` with 0ms delay. |

**Test setup notes:**
- Use `@testing-library/react` `renderHook` for hook tests.
- Use a fresh Zustand store state per test via `useUIStore.setState({ morph: { phase: 'idle', direction: 'forward', targetId: null, phaseStartedAt: null, fast: false } })`.
- Use `vi.useFakeTimers()` for timer-dependent tests (morph phase advancement, setTimeout in navigateToMap).
- Use `vi.spyOn(window.history, 'pushState')` for history integration tests (covered by WS-C.2 tests, not duplicated here).
- Mock `mapRef.current.flyTo` as `vi.fn()` for navigateToMap tests.

**File location:** `src/__tests__/mobile-morph-bridge.test.ts`

**Estimated size:** ~300 lines.

---

## 5. Step-by-Step Morph Flows

### 5.1 Forward Flow: Card Tap -> Sheet Open

```
User taps category card (Situation tab)
  |
  v
MobileCategoryCard.onTap(categoryId) fires
  |
  v
MobileCategoryGrid.handleCardTap(categoryId) [WS-B.2]
  |  Guard: morph.phase !== 'idle' -> return
  |
  v
ui.store.startMorph(categoryId, { fast: true })
  |  Sets: morph.phase = 'entering-district'
  |         morph.fast = true
  |         morph.targetId = categoryId
  |         morph.direction = 'forward'
  |         morph.phaseStartedAt = performance.now()
  |         selectedDistrictId = categoryId
  |
  v
useMorphChoreography detects: phase = 'entering-district', direction = 'forward'
  |  Calls syncUrlCategory(categoryId) -> URL gets ?category=seismic
  |  Starts timer: setTimeout(300ms) -> setMorphPhase('district')
  |
  |  CONCURRENTLY:
  |
  v
useMobileMorphBridge reads: phase = 'entering-district'
  |  Returns: isOpen = true, categoryId = 'seismic'
  |
  v
MobileBottomSheet receives isOpen = true
  |  Internal: useSheetHistory.pushSheetState()
  |            -> history.pushState({ sheetId: 'category-detail', ... })
  |  Internal: Spring animation begins (sheet slides up from 0 to snap point)
  |  Internal: Focus trap activates, aria-modal="true" applied
  |
  v
MobileCategoryDetail mounts with categoryId='seismic'
  |  Begins fetching category data via useCategoryIntel('seismic')
  |
  v
[300ms later] useMorphChoreography timer fires
  |  setMorphPhase('district')
  |  useMobileMorphBridge.isOpen remains true (district is included)
  |
  v
Morph stable at 'district' phase. Sheet fully interactive.
```

### 5.2 Reverse Flow: Sheet Dismiss -> Morph Reset

Four dismiss sources all converge on the same handler:

```
                    Swipe Down        Backdrop Tap        Escape Key        Back Button
                        |                  |                  |                 |
                        v                  v                  v                 v
              MobileBottomSheet    MobileBottomSheet    useSheetFocusTrap    popstate event
              detects velocity    detects backdrop tap   fires onEscape      fires
                    |                  |                  |                     |
                    v                  v                  v                     v
              removeSheetState()  removeSheetState()  removeSheetState()    (no removeSheetState
              -> history.back()   -> history.back()   -> history.back()     -- already popped)
                    |                  |                  |                     |
                    +------------------+------------------+---------------------+
                                                |
                                                v
                                  MobileBottomSheet calls onDismiss prop
                                                |
                                                v
                              useMobileMorphBridge.onDismiss()
                                                |
                                     clearDistrictFilters()
                                                |
                                        reverseMorph()
                                                |
                               Sets: morph.phase = 'leaving-district'
                                      morph.direction = 'reverse'
                                                |
                    +--------------------------+--------------------------+
                    |                                                    |
                    v                                                    v
          useMobileMorphBridge reads:                     useMorphChoreography detects:
          phase = 'leaving-district'                      phase = 'leaving-district'
          isOpen = false                                  direction = 'reverse'
                    |                                     Starts timer: 400ms -> resetMorph()
                    v
          MobileBottomSheet receives isOpen = false
          Spring-to-zero animation begins (sheet slides down)
          Focus trap deactivates
          aria-hidden removed from siblings
                    |
                    v
          [~300ms] Sheet spring animation completes
                    |
                    v
          [400ms] useMorphChoreography timer fires
          resetMorph() -> phase = 'idle', targetId = null
          syncUrlCategory(null) -> ?category= param removed
                    |
                    v
          Morph fully reset. Ready for next interaction.
```

### 5.3 Cross-Tab: "View Category" Flow

```
User is viewing alert detail (any context)
  |
  v
Taps "View Category: Seismic" button [WS-D.2]
  |
  v
MobileAlertDetail calls onViewCategory('seismic')
  |
  v
navigateToCategory('seismic') [D-5]
  |
  +-- 1. coverageStore.clearMapAlert() (if map alert selected)
  |
  +-- 2. uiState.resetMorph() (if morph active -- instant, no animation)
  |      -> morph.phase = 'idle'
  |      -> MobileBottomSheet isOpen = false -> sheet closes
  |      -> useSheetHistory cleanup pops history entries
  |
  +-- 3. setActiveTab('situation') -> Situation tab renders
  |
  +-- 4. queueMicrotask -> startMorph('seismic', { fast: true })
  |      -> morph.phase = 'entering-district'
  |      -> useMobileMorphBridge.isOpen = true
  |      -> MobileBottomSheet opens with MobileCategoryDetail
  |
  v
Category detail sheet opens on Situation tab.
```

### 5.4 Cross-Tab: "Show on Map" Flow

```
User is viewing alert detail (any context)
  |
  v
Taps "Show on Map" button [WS-D.2]
  |
  v
MobileAlertDetail calls onShowOnMap(alertId, coords, category, basic)
  |
  v
navigateToMap(alertId, coords, category, basic) [D-6]
  |
  +-- 1. uiState.resetMorph() (if morph active -- instant)
  |      -> category detail sheet closes
  |
  +-- 2. coverageStore.clearMapAlert() (clear previous selection)
  |
  +-- 3. coverageStore.toggleCategory(category) (ensure category visible)
  |      -> markers for this category appear on the map
  |
  +-- 4. setActiveTab('map') -> Map tab renders
  |
  +-- 5. setTimeout(100ms):
           |
           +-- mapRef.current.flyTo({ center, zoom, padding })
           |   -> map flies to alert location (800ms animation)
           |   -> padding.bottom accounts for bottom sheet
           |
           +-- coverageStore.selectMapAlert(alertId, category, basic)
               -> selectedMapAlertId set
               -> MobileBottomSheet (alert detail) opens at 70% snap
               -> marker gets selection ring highlight
  |
  v
Map tab showing with marker highlighted and alert detail sheet open.
```

---

## 6. Architectural Decisions

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| AD-1 | Mount `useMorphChoreography` in `MobileView` (not MobileShell) | MobileView is the component that owns the data layer and sheet rendering. MobileShell is a layout container. The choreography hook needs proximity to the sheet wiring. | (a) Mount in MobileShell: too high in the tree, MobileShell shouldn't know about morph. (b) Create a new mobile-specific choreography hook: violates the "useMorphChoreography is the only code that calls setMorphPhase" constraint from interface-architecture.md. |
| AD-2 | `isOpen` excludes `leaving-district` | Sheet close animation and morph leaving-district timer run concurrently. If `isOpen` included `leaving-district`, the sheet would remain at its current snap height for 300-400ms before starting to close. | (a) Include `leaving-district` in `isOpen` and drive a CSS fade-out: adds complexity for no UX benefit. (b) Shorten `leavingDistrict` timer to 0 on mobile: would break URL sync timing in useMorphChoreography. |
| AD-3 | Tab switch uses `resetMorph()` (instant) not `reverseMorph()` (animated) | Tab switch is an explicit navigation intent. Animating a 300ms close before the new tab appears adds latency and confusion. | (a) `reverseMorph()` with animation: 300-600ms delay before tab content. (b) Prevent tab switching while morph is active: overly restrictive. |
| AD-4 | `navigateToCategory` uses `queueMicrotask` for startMorph scheduling | Provides explicit ordering: resetMorph applies -> React can commit -> startMorph reads idle state. While Zustand's sync updates would make a direct call work today, the microtask is more robust. | (a) Direct sequential calls: works with Zustand's sync semantics but fragile if batching changes. (b) `setTimeout(0)`: too slow -- introduces a full tick delay visible as a flash of the idle state. (c) `requestAnimationFrame`: also too slow for this purpose. |
| AD-5 | `navigateToMap` uses `setTimeout(100)` for flyTo | MapLibre GL JS needs to be mounted and its WebGL context initialized before `flyTo` can execute. The Map tab may not be mounted at the time `setActiveTab('map')` is called. 100ms is conservative. | (a) Use MapLibre's `onLoad` callback: requires additional plumbing through MobileMapView to expose a "map ready" signal. Better approach for WS-E.3 when all cross-tab contexts are wired. (b) `queueMicrotask`: too early -- React may not have committed the tab switch yet. |
| AD-6 | Category filter is additive (toggle ON), not replacement (set to [category]) | Preserves the user's existing filter context. If they had `[conflict, weather]` selected and navigate to a seismic alert on the map, the result is `[conflict, weather, seismic]` -- they see their previous context plus the new marker. | (a) Replace with `[category]`: discards user's filter work. Simpler but more surprising. (b) Clear all filters (show all): marker is visible but no category focus. |
| AD-7 | No new CSS file needed | This workstream is pure wiring (hooks and handlers). The sheet animations are handled by MobileBottomSheet (C.1 + C.2). The morph phase transitions have no visual representation on mobile -- the sheet IS the visual. | (a) Add a CSS transition for the sheet opening: already handled by MobileBottomSheet's spring config. |

---

## 7. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Tapping a category card on the Situation tab opens the category detail bottom sheet within 300ms (fast morph timing). | Manual testing on mobile device. Measure with React DevTools Profiler. |
| AC-2 | The morph state machine advances correctly: `idle -> entering-district (300ms) -> district`. | Unit test T-25. Manual verification via React DevTools store inspector. |
| AC-3 | Swiping the sheet down past the dismiss threshold closes the sheet and resets morph to idle. | Manual testing. Verify `morph.phase === 'idle'` and `morph.targetId === null` after dismiss. |
| AC-4 | Tapping the sheet backdrop closes the sheet and resets morph to idle. | Manual testing. |
| AC-5 | Pressing the browser back button (or iOS back swipe gesture) while the category detail sheet is open dismisses the sheet instead of navigating away from the page. | Manual testing on a real iOS device and Android device. Verify page remains, sheet closes. |
| AC-6 | After dismissing the sheet via any method, the browser back button navigates normally (no "ghost" history entry). | Manual testing. Press back after sheet dismiss. Verify navigation occurs (e.g., to login page or browser default). |
| AC-7 | Switching tabs while the category detail sheet is open instantly closes the sheet and resets morph. The new tab's content appears without delay. | Manual testing. Tap Map tab while category detail is open. Sheet closes immediately, map loads. |
| AC-8 | "View Category" from alert detail: closes current sheet, switches to Situation tab, opens category detail for the specified category. | Manual testing end-to-end. Open an alert on Map tab -> tap "View Category" -> verify Situation tab active, correct category detail open. |
| AC-9 | "Show on Map" from alert detail: closes current sheet, switches to Map tab, map flies to marker location, marker is highlighted, alert detail sheet opens. | Manual testing end-to-end. Open category detail -> select alert -> tap "Show on Map" -> verify Map tab active, map centered on marker, alert detail sheet open. |
| AC-10 | The URL updates with `?category={id}` when a category detail sheet opens and clears when it closes. | Inspect URL bar during sheet open/close. Verify param presence/absence. |
| AC-11 | Rapidly tapping a card, then switching tabs, then tapping another card does not leave the morph in a broken state. | Manual stress testing. After the sequence, verify a new card tap opens the sheet correctly. |
| AC-12 | `prefers-reduced-motion: reduce` causes instant morph phase transitions (0ms timers). | Toggle reduced motion in OS settings. Verify sheet appears/disappears without animation delay from the morph system (the sheet's own reduced motion handling is tested in WS-C.2). |
| AC-13 | Desktop rendering is unchanged. The `useMorphChoreography` mount in `MobileView` does not affect the desktop `MorphOrchestrator`. | Run `pnpm build`. Load desktop view. Verify morph animation is identical to current behavior. |
| AC-14 | All 27 unit tests pass. | `pnpm test:unit -- --run src/__tests__/mobile-morph-bridge.test.ts` |

---

## 8. Risks and Mitigations

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Dual `useMorphChoreography` mount (desktop MorphOrchestrator + mobile MobileView) causes double phase advancement if both are somehow rendered. | Very Low | High | The desktop and mobile component trees are mutually exclusive (code-split via `next/dynamic` with `ssr: false`, gated by `useIsMobile()`). Only one tree is ever mounted. If this invariant breaks, the morph timers would fire twice, potentially advancing phases too quickly. Defense: add a dev-mode warning in `useMorphChoreography` if it detects being mounted twice (via a module-level mount counter). |
| R-2 | `queueMicrotask` in `navigateToCategory` fires before React commits the `resetMorph` state change, causing `startMorph`'s idle guard to reject the call. | Very Low | Medium | Zustand's immer middleware applies state synchronously. `resetMorph()` updates the store before `queueMicrotask` runs. The microtask fires after the synchronous work completes. Test T-15 verifies this. Fallback: if this fails in practice, replace `queueMicrotask` with `setTimeout(0)`. |
| R-3 | `setTimeout(100)` in `navigateToMap` is not long enough for MapLibre to initialize on slow devices. `flyTo` call fails silently or targets the wrong map instance. | Low | Medium | 100ms is conservative for React commit + MapLibre init (typically 30-50ms). If `mapRef.current` is null when the timeout fires, the `if (mapRef.current)` guard prevents errors. The marker selection (`selectMapAlert`) still works -- the sheet opens, the fly animation just doesn't happen. WS-E.3 should implement a proper "map ready" callback for robustness. |
| R-4 | Back button race condition: popstate fires during sheet open animation (entering-district phase). Sheet is opening while `onDismiss` tries to close it. | Low | Low | `reverseMorph()` is valid from both `entering-district` and `district` phases. From `entering-district`, it transitions to `leaving-district` and then to `idle`. The sheet's spring animation handles the visual reversal smoothly because it simply reverses direction from wherever it currently is (motion/react springs support interruption). |
| R-5 | Nested sheet history stack corruption when `navigateToCategory` is called from within a nested alert detail sheet. Two history entries (category detail + alert detail) need to be cleaned up before the new morph begins. | Low | Medium | `resetMorph()` sets `isOpen = false` for the outer sheet, which unmounts the inner sheet. Each sheet's `useSheetHistory` cleanup calls `history.back()` on unmount if a state was pushed (per WS-C.2 D-1 behavior 5). The two `history.back()` calls execute sequentially (sync), popping both entries. `queueMicrotask` then fires `startMorph` with a clean history stack. Test this scenario manually with Chrome DevTools History panel. |
| R-6 | Tab switch during `leaving-district` phase causes `resetMorph` while `useMorphChoreography` has a pending timer for the `leaving-district -> idle` transition. Orphaned timer fires `resetMorph` again. | Very Low | Very Low | `resetMorph` is idempotent -- calling it when already idle is a no-op (it overwrites the state with the same initial values). The orphaned timer in `useMorphChoreography` fires, reads the current phase (idle), and the effect guard (`if (direction !== 'reverse') return`) prevents action since `direction` was reset to `'forward'` by `resetMorph`. Additionally, React's effect cleanup clears the timer when the phase changes. |

---

## 9. Open Questions

| ID | Question | Owner | Resolution Deadline |
|----|----------|-------|---------------------|
| OQ-1 | Should `navigateToMap` clear ALL category filters and set just `[category]`, or should it be additive (AD-6)? The additive approach preserves user context but may show irrelevant markers. The replacement approach is cleaner but discards filter state. Current decision: additive. Revisit after user testing. | react-developer + information-architect | Phase E review gate |
| OQ-2 | Should `navigateToCategory` pre-select a specific alert within the category detail sheet (via `setDistrictPreselectedAlertId`)? The desktop `handleViewDistrict` in `page.tsx` does this. The mobile flow currently does not pass through an alertId to pre-select. This may be needed for the "View Category" flow from alert detail (user expects to see the alert they were just viewing). | information-architect | WS-D.2 implementation |
| OQ-3 | The `useMorphChoreography` hook has an Escape key handler that calls `reverseMorph()` for phases `settled`, `district`, and `entering-district`. On mobile with a hardware keyboard (iPad), this fires in addition to the sheet's focus trap Escape handler. Both call `reverseMorph()`, but the second call is a no-op. Is there a timing issue where both handlers race? | react-developer | Phase D integration testing |

---

## 10. Interaction Matrix with Dependent Workstreams

| This WS Provides | Consumer WS | Interface Contract |
|-------------------|-------------|-------------------|
| `navigateToCategory(categoryId)` handler | WS-E.3 | Function signature: `(categoryId: string) => void`. Defined in `MobileView`, threaded via props. WS-E.3 wires this to P1 banner alert detail, Intel tab alert cards, and any other "View Category" buttons. |
| `navigateToMap(alertId, coords, category, basic)` handler | WS-E.3 | Function signature: `(alertId: string, coords: { lat: number; lng: number }, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void`. WS-E.3 wires this to all "Show on Map" contexts (category detail alerts, Intel tab alerts, geo summary). |
| Tab switch morph guard pattern | WS-E.3 | WS-E.3's cross-tab navigation flows call `resetMorph()` before tab switches. The guard pattern in D-4 is the reference implementation. |
| `useMobileMorphBridge` hook | WS-D.1 | WS-D.1's `MobileCategoryDetail` is rendered inside the sheet controlled by this bridge. The bridge provides `isOpen` and `categoryId`. D.1 receives `categoryId` as a prop. |
| Bottom sheet `sheetId = 'category-detail'` | WS-C.2 | The `sheetId` is used by `useSheetHistory` for history state management. If WS-D.2's alert detail sheet is nested inside category detail, it uses `sheetId = 'alert-detail'`. The two IDs must be unique. |
