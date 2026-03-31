# Phase C Overview: Map Tab + Bottom Sheet

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** combined-recommendations.md (Phase Decomposition, Phase C)
> **Date:** 2026-03-06
> **Status:** Draft

---

## 1. Executive Summary

Phase C delivers the two highest-risk subsystems in the mobile view: the bottom sheet interaction framework and the map tab. It contains five workstreams (WS-C.1 through WS-C.5) spanning the full bottom sheet lifecycle (core drag-and-snap, advanced accessibility and fullscreen, map view wrapper, map interaction wiring, and settings sheet), making it the largest and most architecturally significant phase in the mobile build.

The bottom sheet (`MobileBottomSheet`) is the load-bearing UI abstraction for the entire mobile experience. Every drill-down flow in Phases D, E, and F renders content inside this component. A defect in C.1 blocks five downstream workstreams directly (C.2, C.4, D.1, D.2, C.5) and every Phase D/E workstream transitively. This concentration of risk was anticipated -- the combined-recommendations elevated the bottom sheet from a single task to two dedicated workstreams (Gap 1, Risk 7).

The map tab wraps the existing shared `CoverageMap` component with zero modification, adding mobile-specific controls (filter chips, floating toggles, GPS center-on-me) and wiring marker taps to the bottom sheet through the existing `coverage.store` state. The settings sheet, promoted from Phase F, provides ambient effect and audio toggles needed during Phase C development and testing.

**Risk profile:** High. This is the highest-risk phase in the mobile build. The bottom sheet's spring physics, scroll-vs-drag conflict resolution, and browser history integration are complex interaction patterns with no existing codebase precedent. One cross-workstream interface conflict has been identified (snap point format mismatch between C.1 and C.4) that must be resolved before implementation. The remaining cross-workstream interfaces have been validated and are clean.

**Key deliverables at phase exit:**
- A reusable `MobileBottomSheet` component with spring-animated drag-to-snap, per-context snap point configurations, scroll-vs-drag conflict resolution, expand-to-fullscreen, browser back button integration, focus trap, and landscape height constraint
- A full-bleed map tab with lazy-loaded `CoverageMap`, horizontal filter chip bar, floating view mode and time range controls, and GPS center-on-me button
- Marker tap opens an alert detail bottom sheet at 70% viewport height with a stub detail component (replaced by WS-D.2)
- Filter chips, view mode toggle, and time range selector wired to `coverage.store` with URL sync
- Settings sheet accessible via hamburger button, with ambient effects toggle, P1 sound toggle, idle lock timeout selector, session info, API health status, and logout
- `settings.store.ts` extended with `idleLockTimeoutMinutes` field and updated persist configuration
- Desktop rendering remains byte-for-byte identical

---

## 2. Key Findings (grouped by theme)

### 2.1 Bottom Sheet Core Architecture

- **Spring physics spec (CTA):** WS-C.1 specifies `motion/react` v12 spring config `{ stiffness: 400, damping: 35, mass: 0.8 }` for all snap-to animations and drag release. These values are tokenized via CSS custom properties (`--sheet-spring-stiffness`, `--sheet-spring-damping`, `--sheet-spring-mass`) defined in WS-A.3's `mobile-tokens.css`. The JavaScript reads these at mount time and passes them to `motion/react`'s spring transition. This indirection is appropriate for tunability but means the CSS tokens are read-once (not reactive to runtime changes). This is acceptable -- spring constants are not expected to change at runtime.

- **Snap point format (CTA -- CRITICAL):** WS-C.1 defines snap points as **integer percentages of viewport height (0-100)**. The type is `SnapPointPercent = number` with documentation "0 = closed (bottom of viewport). 100 = top of viewport." The predefined configs use this format: Alert Detail `[70, 100]`, Category Detail `[35, 65, 100]`, Priority Feed `[60, 100]`, Filter/Time Range `[40]`, Settings `[60, 100]`. **WS-C.4 uses decimal format** (`[0.7, 1.0]`) in its `MobileBottomSheet` usage code. This is a **cross-workstream interface incompatibility** -- see Conflict 1 in Section 3.

- **Scroll-vs-drag resolution (CTA):** WS-C.1 implements the `overscroll-behavior: contain` strategy from combined-recommendations Risk 3. The algorithm: (1) track the sheet's internal scroll container scroll position, (2) when `scrollTop > 0`, disable sheet drag by not attaching drag constraints to the sheet motion div, (3) when `scrollTop === 0` AND the user drags downward, re-enable sheet drag. The drag handle always enables sheet drag regardless of scroll state. This is a sound approach that matches iOS native sheet behavior.

- **Portal rendering (CTA):** WS-C.1 renders the sheet via React portal to `document.body`. This is correct for z-index stacking (the sheet overlays the map, filter chips, and floating controls) and avoids `overflow: hidden` clipping issues from parent containers. The backdrop overlay sits between the portal root and the sheet content.

- **Velocity-based snap selection (SPO):** WS-C.1's `onDragEnd` handler reads `velocity.y` and `point.y` from `motion/react`'s `PanInfo` type. Downward velocity above 500px/s dismisses the sheet. Upward velocity above 500px/s promotes to the next snap point. Between thresholds, the handler snaps to the nearest snap point based on current position. These thresholds are defined in `SHEET_VELOCITY_THRESHOLDS` and are reasonable defaults for mobile interaction.

### 2.2 Bottom Sheet Advanced Capabilities

- **Browser history integration (CTA):** WS-C.2's `useSheetHistory` hook pushes a history state entry on sheet open (`history.pushState({ sheet: sheetId }, '')`) and listens for `popstate` to dismiss the sheet. This enables the system back button (and back swipe gesture on iOS) to close the sheet instead of navigating away from the app. The hook supports nested sheets (each open pushes a separate entry) via a history stack counter. This is a critical UX requirement per `information-architecture.md` Section 9.3.

- **replaceState vs pushState compatibility (CTA):** WS-C.4's URL sync uses `history.replaceState` (via `syncCategoriesToUrl`, `syncViewModeToUrl`), while WS-C.2 uses `history.pushState` for sheet lifecycle. These are **complementary** -- `replaceState` overwrites the current history entry's URL without creating a new entry, while `pushState` creates a new entry. Filter changes update the current entry's params; sheet open/close push/pop entries. No conflict expected. Verified by inspecting `coverage.store.ts` URL sync functions, which all use `replaceState`.

- **Focus trap (SPO):** WS-C.2's `useSheetFocusTrap` hook implements a custom focus trap (no external library) that cycles Tab/Shift+Tab through focusable elements within the sheet, handles Escape key dismissal, moves focus to the first interactive element on open, and returns focus to the triggering element on close. `aria-modal="true"` and `aria-hidden="true"` on sibling content ensure screen readers cannot interact with background content. This satisfies WCAG 2.1 SC 1.3.2 (Meaningful Sequence) and OVERVIEW Section 8.2 items A5, A11, A12.

- **Landscape constraint (CTA):** Non-fullscreen sheets are capped at `var(--sheet-landscape-max-height)` (60% viewport) in landscape orientation, per client Q2. WS-C.2 reads `isLandscape` from `MobileShell`'s orientation detection (provided by WS-A.2) and clamps snap point calculations when landscape is active. Fullscreen mode is exempt (always 100dvh). This is correct and ensures the sheet does not occlude the entire landscape viewport.

- **Reduced motion (SPO):** WS-C.2 respects `prefers-reduced-motion: reduce` by setting expand/collapse transition duration to 0. Uses `@tarva/ui/motion`'s `useReducedMotion` hook (existing dependency). This is consistent with WS-B.3's approach for `ThreatPulseBackground`.

### 2.3 Map Tab Surface

- **CoverageMap zero-modification strategy (CTA -- VERIFIED):** WS-C.3 wraps the shared `CoverageMap` component without any modification. The `CoverageMap` props interface was verified against the codebase (`src/components/coverage/CoverageMap.tsx`, 535 lines). All props C.3 needs are already optional: `onMarkerClick?: (markerId: string) => void`, `onInspect?`, `selectedMarkerId?: string | null`, `externalMapRef?: React.RefObject<MapRef | null>`. Desktop rendering passes these as `undefined` (the default), producing identical behavior. This is a clean separation.

- **MapMarkerLayer selection ring (CTA -- VERIFIED):** `MapMarkerLayer.tsx` (314 lines) accepts `selectedMarkerId?: string | null` and renders a selection ring via an always-mounted `SELECTED_LAYER_ID` MapLibre layer with a filter that matches nothing when no selection is active. When C.4 passes `selectedMapAlertId` from `coverage.store` through `CoverageMap` as `selectedMarkerId`, the ring appears automatically. No modification to `MapMarkerLayer` is needed.

- **Filter chips (SPO):** WS-C.3's `MobileFilterChips` component renders a 40px horizontal scroll bar with `scroll-snap-type: x mandatory`, an `[All]` chip to clear filters, and one chip per `KNOWN_CATEGORIES` entry (15 categories). Chips are multi-select, synced with `coverage.store.selectedCategories` via `toggleCategory()`. The chip bar uses fade-out gradients at scroll edges for visual polish. Touch targets are 40px height (below the 44px WCAG minimum), but the chip interaction area extends to the full 40px row height. This is acceptable for a non-critical secondary control.

- **GPS center-on-me (SPO):** WS-C.3 adds MapLibre's native `GeolocateControl` to the map instance with Oblivion-styled CSS overrides. The control is positioned lower-right, above the floating controls bar, with a 48px touch target. This satisfies protective-ops C4.

- **Dynamic import pattern (CTA):** `MobileMapView` uses `next/dynamic` with `ssr: false`, matching the existing `CoverageMapDynamic` pattern in `page.tsx` (line 29-32). This ensures WebGL (MapLibre GL JS, ~160KB) is only loaded when the Map tab is accessed, keeping the core mobile chunk under the 60KB budget.

### 2.4 Map Interaction Wiring

- **Marker tap flow (CTA -- VERIFIED):** WS-C.4 defines `handleMobileMarkerTap(markerId)` which: (1) resolves the marker ID to full `MapMarker` data from the `displayMarkers` array via `.find()`, (2) calls `coverage.store.selectMapAlert(id, category, { title, severity, ingestedAt })`, (3) calls `mapRef.current.flyTo()` to center on the marker. The `selectMapAlert` action was verified in `coverage.store.ts` -- it stores `selectedMapAlertId`, `selectedMapAlertCategory`, and `selectedMapAlertBasic`, and reads `useCameraStore.getState()` for `preFlyCamera` (which stores harmless default values on mobile). The flow is correct.

- **Bottom sheet visibility (CTA):** Sheet open/close is NOT managed by a dedicated boolean state or store field. Instead, the bottom sheet is conditionally rendered based on domain state: `{selectedMapAlertId && <MobileBottomSheet>...</MobileBottomSheet>}`. When `clearMapAlert()` sets `selectedMapAlertId` to null, React unmounts the sheet. This is an **implicit state management pattern** -- the sheet's existence is a derived consequence of the selection state, not an independently managed piece of state. This is architecturally sound because it prevents the sheet and the selection state from diverging (an impossible-state elimination).

- **MapPopup coexistence (STW):** WS-C.4 DM-1 accepts that `CoverageMap`'s internal `MapPopup` will appear briefly on mobile marker tap. The popup renders at the marker location (upper screen) while the bottom sheet slides up from below -- they do not visually conflict. The zero-modification constraint on `CoverageMap` prevents suppressing the popup. WS-C.4 OQ-3 proposes a CSS-only suppression via `@media (max-width: 767px) { .maplibregl-popup { display: none; } }` in `mobile-map-view.css` as a potential resolution. This is a cosmetic concern, not a functional one.

- **displayMarkers computation (SPO):** The `displayMarkers` memo in WS-C.4 D-5 converts bundle data to `MapMarker[]` format, identical to the existing logic in `page.tsx` (lines 224-245). WS-C.4 either extracts this or duplicates it in `MobileView.tsx`. Since the logic is a pure transformation (~20 lines), duplication in `MobileView.tsx` is acceptable and follows the separate-component-trees principle (AD-1).

### 2.5 Settings Sheet and Store Extension

- **Settings store extension (CTA -- VERIFIED):** WS-C.5 adds `idleLockTimeoutMinutes: number` (default 5, options: 1/5/15/0 for never) to `settings.store.ts`, per AD-6. The existing store uses `persist(immer(...))` middleware with a `partialize` function that explicitly lists 8 fields (lines 164-173). WS-C.5 must add `idleLockTimeoutMinutes` to BOTH the `SettingsState` interface AND the `partialize` function. Failure to update `partialize` would mean the new field is not persisted to localStorage. The field name `idleLockTimeoutMinutes` does not conflict with any existing field. The addition is purely additive and backward-compatible -- existing localStorage data (keyed `tarva-launch-settings`) will simply lack this field on first load, and the default value (5) will be used.

- **`useApiHealth` hook (CTA):** WS-C.5 introduces `useApiHealth` at `src/hooks/use-api-health.ts`. This hook monitors TanStack Query `dataUpdatedAt` timestamps from `useCoverageMetrics` and `usePriorityFeed`, combined with `navigator.onLine`, to derive a tri-state health signal: `'healthy' | 'degraded' | 'offline'`. This is conceptually similar to WS-B.3's `useDataFreshness` hook. The relationship needs clarification: either `useApiHealth` should wrap or consume `useDataFreshness` (avoiding duplicated freshness logic), or the two hooks should be clearly distinguished by purpose (data freshness for staleness banners vs API health for the settings display). See OQ-C6 in Section 6.

- **Hamburger wiring (SPO):** WS-C.5 wires `MobileShell.onMenuPress` (provided by WS-A.2) to toggle settings sheet visibility via local state in `MobileView`. The settings sheet is opened/closed via a `useState<boolean>` (or equivalent local state), which is distinct from the domain-driven conditional rendering used for the alert detail sheet. This is correct -- settings open/close is a pure UI action with no domain state implication.

- **Logout flow (SPO):** WS-C.5 implements logout as: tap Logout button -> inline confirmation step (not a separate dialog) -> `useAuthStore.logout()` (clears sessionStorage) -> `router.push('/login')`. The inline confirmation pattern avoids the complexity of a nested dialog inside a bottom sheet, which would require stacking focus traps.

### 2.6 Two-Store Architecture Preserved

- **coverage.store.ts (CTA -- VERIFIED):** All map interaction wiring (C.3 and C.4) operates through the existing `coverage.store` actions: `selectMapAlert`, `clearMapAlert`, `toggleCategory`, `setViewMode`, `setMapTimePreset`, `setCustomTimeRange`. No new store fields are introduced for the map tab. URL sync functions (`syncCategoriesToUrl`, `syncViewModeToUrl`) are reused. The coverage store has NO persist middleware -- it is session-transient and URL-driven, which is correct for filter state.

- **ui.store.ts (CTA -- VERIFIED):** WS-C.2 references `resetMorph()` (line 145-149) for coordinated dismissal when back button fires during morph. WS-C.4 does not interact with `ui.store` directly -- the morph state machine is only entered from category card tap (WS-B.2) and exited from sheet dismiss (WS-D.3). This separation is clean.

- **settings.store.ts (CTA -- VERIFIED):** WS-C.5 extends this store with one new field (`idleLockTimeoutMinutes`) and one new action (`setIdleLockTimeout`). The existing `effectsEnabled` and `audioNotificationsEnabled` fields are consumed by the settings UI but not modified (they use existing toggle/set actions). The persist middleware with `partialize` requires an explicit update. The two-store separation (animation in ui.store, data filtering in coverage.store, user preferences in settings.store) is maintained.

---

## 3. Cross-Workstream Conflicts

### Conflict 1: Snap Point Format Mismatch (WS-C.1 vs WS-C.4) -- BLOCKING

**WS-C.1** defines snap points as **integer percentages (0-100):**
```typescript
export type SnapPointPercent = number
// "0 = closed (bottom of viewport). 100 = top of viewport."

export const SHEET_CONFIGS = {
  alertDetail: { snapPoints: [70, 100] },
  categoryDetail: { snapPoints: [35, 65, 100] },
  priorityFeed: { snapPoints: [60, 100] },
  filterTimeRange: { snapPoints: [40] },
  settings: { snapPoints: [60, 100] },
}
```

**WS-C.4** passes snap points as **decimals (0-1)** in the D-6 integration code:
```tsx
<MobileBottomSheet
  snapPoints={[0.7, 1.0]}
  initialSnap={0}
  onClose={handleCloseMapAlert}
>
```

**Disagreement:** `[0.7, 1.0]` (decimal) vs `[70, 100]` (integer percentage). WS-C.4's code would pass a 0.7% snap point to C.1's component, which expects a 70% snap point. The sheet would render as a barely-visible 0.7% sliver instead of a half-height sheet.

**Resolution recommendation (CTA):** WS-C.1's integer percentage format is the authoritative type definition. WS-C.4 must update its usage to match:
```tsx
<MobileBottomSheet
  snapPoints={[70, 100]}
  initialSnap={0}
  onClose={handleCloseMapAlert}
>
```

Alternatively, WS-C.4 should use the named config constant from C.1:
```tsx
<MobileBottomSheet
  config={SHEET_CONFIGS.alertDetail}
  onClose={handleCloseMapAlert}
>
```

The named config approach is preferred because it centralizes snap point definitions and prevents per-usage format errors.

**Proposed action:** Update WS-C.4 D-6 code to use integer percentages or named config constants. Add a TypeScript branded type (`type SnapPointPercent = number & { __brand: 'SnapPointPercent' }`) to C.1 to catch format errors at compile time, or add a runtime assertion (`if (snapPoints.some(p => p < 1)) throw new Error('Snap points must be 0-100, not 0-1')`) to the component.

### Conflict 2: C.1 Props API Surface Inconsistency (WS-C.1 vs WS-C.2 vs WS-C.5) -- NON-BLOCKING

WS-C.1 D-1 defines the `MobileBottomSheet` component props but the three consuming workstreams reference slightly different prop names:

- **WS-C.4** (D-6): Uses `snapPoints`, `initialSnap`, `onClose`, `ariaLabel`, `children`
- **WS-C.5** (D-3): References `isOpen`, `onClose`, and expects the sheet config ID string
- **WS-C.2** (D-1): References `isOpen`, `onDismiss`, `currentSnap`, `snapPoints`

The differences are minor naming variations (`onClose` vs `onDismiss`, `ariaLabel` vs `aria-label`), not structural conflicts. WS-C.1 defines the canonical API; consumers must align.

**Resolution recommendation (STW):** WS-C.1 should publish its final props interface as part of D-1. All consuming workstreams (C.2, C.4, C.5) must reference that interface. The prop naming should be:
- `onClose` (not `onDismiss` -- matches React convention and is shorter)
- `ariaLabel: string` (component applies it as `aria-label` attribute)
- `snapPoints: SnapPointPercent[]` (integer percentages)
- `initialSnap: number` (index into `snapPoints` array)
- `children: ReactNode`

### Conflict 3: `useApiHealth` vs `useDataFreshness` Overlap (WS-C.5 vs WS-B.3) -- NON-BLOCKING

WS-C.5 creates `useApiHealth` (tri-state: healthy/degraded/offline) to derive API connection status. WS-B.3 creates `useDataFreshness` (tri-state: fresh/stale/offline) for the staleness banner and connectivity dot.

Both hooks monitor TanStack Query `dataUpdatedAt` timestamps and `navigator.onLine`. The logic is conceptually identical, differing only in naming and consumer context.

**Resolution recommendation (CTA):** WS-C.5's `useApiHealth` should **consume** WS-B.3's `useDataFreshness` hook rather than reimplementing freshness detection:

```typescript
function useApiHealth(): 'healthy' | 'degraded' | 'offline' {
  const freshness = useDataFreshness()
  if (freshness === 'offline') return 'offline'
  if (freshness === 'stale') return 'degraded'
  return 'healthy'
}
```

This eliminates duplicated freshness detection logic. The naming translation (fresh->healthy, stale->degraded) is appropriate for the settings display context.

---

## 4. Architecture Decisions (consolidated)

| ID | Decision | Source SOW | Rationale | Status |
|----|----------|-----------|-----------|--------|
| AD-C1 | Custom bottom sheet using `motion/react` v12 drag handlers, no external library | WS-C.1, combined-rec AD-2 | `motion/react` is an existing dependency. Custom implementation provides precise control over snap points, glass aesthetics, and morph state machine integration. External libraries (vaul, react-spring-bottom-sheet) add bundle size and may conflict with existing animation system. | Accepted |
| AD-C2 | Snap points expressed as integer percentages (0-100) of viewport height | WS-C.1 D-1 | Clear, human-readable values. `[70, 100]` is immediately understandable as "70% and 100% of viewport." Avoids decimal confusion. | Accepted -- **C.4 must update** |
| AD-C3 | Five predefined `SHEET_CONFIGS` for context-dependent snap behavior | WS-C.1 D-1 | Each sheet context (alertDetail, categoryDetail, priorityFeed, filterTimeRange, settings) has distinct interaction requirements. Named configs centralize snap point definitions and prevent per-usage format errors. | Accepted |
| AD-C4 | Sheet renders via React portal to `document.body` | WS-C.1 D-1 | Avoids z-index stacking context issues. Sheet overlays map, filter chips, and floating controls without being clipped by parent `overflow: hidden`. | Accepted |
| AD-C5 | Scroll-vs-drag conflict resolved by scroll position gating + `overscroll-behavior: contain` | WS-C.1 D-1 | Drag is disabled when internal scroll position > 0. Drag handle always enables sheet drag regardless of scroll state. `overscroll-behavior: contain` prevents scroll chaining to parent. Matches iOS native sheet behavior. | Accepted |
| AD-C6 | `useSheetHistory` hook manages browser history lifecycle | WS-C.2 D-1 | System back button dismisses sheets instead of navigating away. Supports nested sheets via history stack counter. `pushState` on open, `popstate` listener for dismiss. Critical UX requirement per `information-architecture.md` Section 9.3. | Accepted |
| AD-C7 | `useSheetFocusTrap` hook -- custom implementation, no external library | WS-C.2 D-2 | Avoids adding `focus-trap-react` or similar dependency. The trap logic is ~60 lines (query focusable elements, cycle Tab/Shift+Tab, handle Escape). Custom implementation integrates cleanly with the sheet's open/close lifecycle. | Accepted |
| AD-C8 | `aria-modal="true"` + `aria-hidden="true"` on siblings when sheet is open | WS-C.2 D-3 | WCAG 2.1 SC 1.3.2 compliance. Screen readers cannot interact with background content while modal sheet is open. `role="dialog"` on sheet container. `aria-live="polite"` region announces sheet state changes. | Accepted |
| AD-C9 | Landscape height constraint: non-fullscreen sheets capped at 60% viewport | WS-C.2 D-4 | Per client Q2. Prevents sheet from occluding entire landscape viewport. Fullscreen mode exempt (always 100dvh). Uses `var(--sheet-landscape-max-height)` token from WS-A.3. | Accepted |
| AD-C10 | `MobileMapView` wraps shared `CoverageMap` with zero modification | WS-C.3 D-1 | All needed props are already optional in `CoverageMap`'s interface. Desktop rendering is unaffected. Mobile wrapper adds full-bleed sizing, GPS control, and removes desktop corner bracket decorations. | Accepted -- **verified against codebase** |
| AD-C11 | `MobileFilterChips` as a horizontal scroll bar above the map | WS-C.3 D-2 | 40px height, `scroll-snap-type: x mandatory`, multi-select. `[All]` chip clears filters. Category-colored active chip accents. Fade-out gradients at scroll edges. | Accepted |
| AD-C12 | Alert detail sheet visibility driven by `selectedMapAlertId !== null` (conditional rendering) | WS-C.4 D-6, DM-2 | Sheet existence is derived from selection state. Eliminates impossible state where sheet is open but no alert is selected (or vice versa). No separate `isSheetOpen` boolean needed. | Accepted |
| AD-C13 | MapPopup coexistence accepted on mobile (zero-modification constraint) | WS-C.4 DM-1 | Popup appears at marker location (upper screen) while sheet slides up from below. CSS suppression via mobile media query proposed as optional enhancement (OQ-C3). Does not affect functionality. | Accepted |
| AD-C14 | `displayMarkers.find()` for marker ID resolution (not MapLibre feature properties) | WS-C.4 DM-4 | `displayMarkers` is the authoritative data array already computed in MobileView. Contains all fields needed for the store action. `onMarkerClick` from `CoverageMap` only exposes the marker ID, not the full feature. `.find()` is O(n) but the array is <500 items. | Accepted |
| AD-C15 | Map fly-to on marker tap with 500ms duration and minimum zoom 6 | WS-C.4 DM-3 | Centers marker in visible map area above the sheet. 500ms duration is short enough to feel responsive. Minimum zoom of 6 ensures geographic context without zooming past the user's current view. | Accepted |
| AD-C16 | Settings sheet open/close managed by local `useState` (not store-driven) | WS-C.5 DM (implicit) | Settings sheet has no domain-state association. Opening settings is a pure UI action. Local state in MobileView is sufficient. Contrast with alert detail sheet, whose visibility is derived from `selectedMapAlertId`. | Accepted |
| AD-C17 | `idleLockTimeoutMinutes` added to `settings.store.ts` with persist | WS-C.5 D-1, combined-rec AD-6 | Extends existing store rather than creating new one. Must update both `SettingsState` interface and `partialize` function. Options: 1, 5, 15, 0 (never). Default: 5. WS-F.4 consumes this for actual idle lock timer implementation. | Accepted -- **verified compatible** |
| AD-C18 | `MobileAlertDetailStub` as a separate component file (not inline JSX) | WS-C.4 DM-5 | Temporary stub (~80 lines) replaced by WS-D.2's `MobileAlertDetail`. Separate file enables independent testing, code review visibility, and easy locate-and-replace. | Accepted |
| AD-C19 | `useApiHealth` wraps `useDataFreshness` from WS-B.3 | WS-C.5 D-3 (recommended) | Avoids duplicating freshness detection logic. Maps fresh/stale/offline to healthy/degraded/offline. Settings display consumes the mapped signal. | **Pending** -- requires Conflict 3 resolution |
| AD-C20 | Logout requires inline confirmation (not a separate dialog) | WS-C.5 D-6 | Avoids nested dialog-in-sheet focus trap complexity. Inline confirm button appears below the logout button on first tap. Second tap executes logout. | Accepted |

---

## 5. Cross-Workstream Dependencies

### Dependency Diagram

```
Phase A (all WSs)     Phase B (WS-B.3)
       |                    |
       v                    | useDataFreshness (for C.5 useApiHealth)
  ┌────────────┐            |
  │  WS-C.1:   │───────────┤
  │  Bottom     │           |
  │  Sheet Core │           |
  └──────┬─────┘            |
         │                  |
    ┌────┴────┐             |
    │         │             |
    v         v             v
┌───────┐  ┌───────┐  ┌───────┐
│ WS-C.2│  │ WS-C.4│  │ WS-C.5│
│ Sheet │  │ Map   │  │ Sett- │
│ Adv.  │  │ Inter │  │ ings  │
└───┬───┘  └───┬───┘  └───────┘
    │          │
    │     ┌────┘
    │     │
    v     v
┌───────────┐
│  WS-C.3:  │
│  Map View  │
└───────────┘

C.3 blocks C.4 (provides MobileMapView, MobileFilterChips, mapRef)
C.1 blocks C.2, C.4, C.5 (provides MobileBottomSheet)
C.1 blocks D.1, D.2 (bottom sheet content renders inside C.1's component)
```

### Dependency Analysis

| Upstream | Downstream | What Flows | Validated? |
|----------|-----------|------------|------------|
| Phase A (all) | WS-C.1 | Glass tokens (`--glass-sheet-*`), spring config tokens (`--sheet-spring-*`), drag handle tokens (`--drag-handle-*`), snap point tokens (`--sheet-snap-*`), `--sheet-landscape-max-height`, `--space-bottom-sheet-handle`, `--safe-area-bottom` | Yes -- all defined in WS-A.3 token file spec |
| Phase A (all) | WS-C.3 | `MobileShell` with `mapContent` slot, `MobileStateView`, spacing/glass/touch target tokens, safe area tokens | Yes -- all prerequisites verified in Phase A SOWs |
| Phase A (WS-A.2) | WS-C.5 | `MobileBottomNav` hamburger button + `onMenuPress` prop, `MobileShell.onMenuPress` threading, `SessionTimecode` inline mode | Yes -- all defined in WS-A.2 |
| Phase B (WS-B.3) | WS-C.5 | `useDataFreshness` hook for `useApiHealth` wrapper | Yes -- hook specified in WS-B.3 D-1 |
| WS-C.1 | WS-C.2 | `MobileBottomSheet` base component, `useSheetDrag` hook, spring config, `mobile-sheet.css`, sheet state type | Yes -- C.2 extends C.1's deliverables |
| WS-C.1 | WS-C.4 | `MobileBottomSheet` component with snap points API, `onClose` callback | Yes -- **snap point format must be resolved (Conflict 1)** |
| WS-C.1 | WS-C.5 | `MobileBottomSheet` component for rendering settings content | Yes -- C.5 uses C.1 as a container |
| WS-C.1 | WS-D.1, WS-D.2 | `MobileBottomSheet` for category detail and alert detail content | Yes -- downstream phases consume C.1's sheet |
| WS-C.3 | WS-C.4 | `MobileMapView` wrapper, `MobileFilterChips` component, floating controls integration, `mapRef` forwarding | Yes -- C.4 wires event handlers into C.3's components |
| WS-C.4 | WS-D.2 | `MobileAlertDetailStub` replaced by `MobileAlertDetail`; marker tap -> store -> sheet flow established | Yes -- replacement path documented |
| WS-C.4 | WS-E.3 | Fly-to + filter pattern reused by cross-tab "Show on Map" | Yes -- pattern documented in C.4 scope |
| `coverage.store.ts` | WS-C.3, WS-C.4 | `selectMapAlert`, `clearMapAlert`, `toggleCategory`, `setViewMode`, `setMapTimePreset`, `syncCategoriesToUrl`, `syncViewModeToUrl` | Yes -- **all verified against codebase** |
| `settings.store.ts` | WS-C.5 | Existing `effectsEnabled`, `audioNotificationsEnabled`, `toggleEffects`, `setAudioNotifications` + new `idleLockTimeoutMinutes`, `setIdleLockTimeout` | Yes -- **existing fields verified, new field compatible** |

### Critical Path

```
WS-C.1 (L) ──> WS-C.2 (M, extends C.1)
           └──> WS-C.3 (M, parallel with C.2) ──> WS-C.4 (S, wires C.3 + C.1)
           └──> WS-C.5 (S, parallel with C.2/C.3)
```

**Critical path:** C.1 -> C.3 -> C.4. WS-C.2 and WS-C.5 are off the critical path (they can execute in parallel with C.3 after C.1 completes).

---

## 6. Consolidated Open Questions

| ID | Question | Source | Blocking? | Assigned To | Target |
|----|----------|--------|-----------|-------------|--------|
| OQ-C1 | **Should WS-C.4 use named config constants (`SHEET_CONFIGS.alertDetail`) or inline snap point arrays when opening the bottom sheet?** Named configs are preferred for consistency but add an import dependency. | Conflict 1 resolution | **Yes** | WS-C.1 author + WS-C.4 author | Before C.4 implementation |
| OQ-C2 | Should tapping a marker on mobile also pass `onInspect` to `CoverageMap`, providing a two-path flow (direct sheet via `onMarkerClick` + fallback via popup INSPECT button)? Currently C.4 uses `onMarkerClick` only. | WS-C.4 OQ-1 | No | planning-coordinator | Phase C review gate |
| OQ-C3 | Should `MobileMapView` apply a CSS override to hide the `.maplibregl-popup` element on mobile viewports? (`@media (max-width: 767px) { .maplibregl-popup { display: none; } }`) This suppresses the popup without modifying shared code. | WS-C.4 OQ-3 | No | world-class-ux-designer | Phase C review gate |
| OQ-C4 | When the bottom sheet is open and the user taps a DIFFERENT marker, should the sheet content swap in place, or should the sheet close and reopen? Current implementation swaps in place (store overwrite causes re-render). | WS-C.4 OQ-2 | No | world-class-ux-designer | Phase C review gate |
| OQ-C5 | Should the map fly-to on marker tap use an offset to account for the bottom sheet covering the lower ~70% of the viewport? Currently the fly-to centers in the full viewport, meaning the marker may end up behind the sheet. | WS-C.4 OQ-4 | No | world-class-ux-designer | Phase C |
| OQ-C6 | **Should `useApiHealth` (WS-C.5) wrap `useDataFreshness` (WS-B.3), or be an independent hook?** Wrapping avoids duplication but creates a dependency on Phase B. Independent implementation is simpler but duplicates logic. | Conflict 3, WS-C.5 D-3 | No | WS-C.5 author | Before C.5 implementation |
| OQ-C7 | WS-C.1 uses `motion.div` with `drag="y"` for the sheet drag gesture. On iOS Safari, this may conflict with the browser's swipe-to-go-back gesture when the sheet is near the left edge. Should a horizontal dead zone be added? | WS-C.1 (implicit) | No | world-class-ux-designer | Phase C implementation |
| OQ-C8 | Should the bottom sheet support a `configId` prop (string) that looks up snap points from `SHEET_CONFIGS`, or should consumers pass `snapPoints` arrays directly? The config ID approach prevents format errors; the direct approach is more flexible. | WS-C.1 D-1 | No | WS-C.1 author | Before C.1 implementation |

---

## 7. Phase Exit Criteria

| Criterion | Source | Evidence Required |
|-----------|--------|-------------------|
| `MobileBottomSheet` renders at context-dependent snap points with spring animation on drag release | WS-C.1 AC-1 through AC-7 | On a 375x812 viewport: open a sheet, verify spring-animated snap to target height. Drag and release at various velocities -- verify velocity-based snap selection (dismiss on fast downward, promote on fast upward). |
| Scroll-vs-drag conflict resolution works: sheet does not drag when internal content is scrolled away from top | WS-C.1 AC-8 through AC-10 | Scroll internal content down. Attempt to drag the sheet -- it should not move. Scroll back to top, then drag down -- sheet should drag. Drag handle always enables sheet drag regardless of scroll position. |
| Backdrop tap dismisses the sheet | WS-C.1 AC-11 | Tap the translucent area above the sheet. Verify sheet dismisses with exit animation. |
| Expand-to-fullscreen button transitions sheet to 100dvh with collapse button; collapse returns to previous snap | WS-C.2 AC-1 through AC-3 | Open a sheet at half-height. Tap expand button. Verify sheet animates to full viewport. Verify drag handle hides and collapse button appears. Tap collapse. Verify return to previous snap. |
| System back button (and back swipe on iOS) dismisses the sheet, does not navigate away | WS-C.2 AC-4, AC-5 | Open a sheet. Press system back button. Verify sheet closes. Verify page remains on the map tab (no browser navigation). |
| Focus trap active when sheet is open: Tab cycles through sheet elements, Escape dismisses | WS-C.2 AC-6 through AC-8 | Open a sheet. Press Tab repeatedly -- verify focus cycles within the sheet. Press Escape -- verify sheet dismisses. Verify focus returns to the element that triggered the sheet. |
| Landscape sheets capped at 60% viewport height (non-fullscreen) | WS-C.2 AC-9 | Rotate device to landscape. Open a non-fullscreen sheet. Verify max height is 60%. Open in fullscreen mode -- verify 100dvh. |
| `MobileMapView` renders full-bleed `CoverageMap` with markers in the map tab | WS-C.3 AC-1 through AC-3 | Switch to Map tab at 375x812. Verify map fills available space. Verify markers render. Verify no desktop corner brackets or `MapNavControls`. |
| `MobileFilterChips` renders horizontal scrollable chip bar with multi-select | WS-C.3 AC-4 through AC-7 | Tap a category chip -- verify active state. Tap another -- verify multi-select (both active). Tap "All" -- verify all deselect. Scroll chips horizontally -- verify snap behavior and fade gradients. |
| GPS center-on-me button geolocates and centers map | WS-C.3 AC-8 | Grant location permission. Tap GPS button. Verify map centers on device location. Verify 48px touch target. |
| Tapping a marker opens the alert detail bottom sheet at 70% viewport with stub content | WS-C.4 AC-1, AC-2 | Tap an unclustered marker. Verify bottom sheet slides up to ~70%. Verify stub shows title, severity badge, category short code, and relative timestamp. Verify map remains visible above sheet. |
| Tapped marker receives selection ring highlight | WS-C.4 AC-4 | Tap a marker. Verify colored ring appears around the marker dot. |
| Map flies to center on tapped marker | WS-C.4 AC-5 | Tap a marker near the edge. Verify map pans to center on marker within ~500ms. |
| Dismissing bottom sheet clears selection (no ring, store reset) | WS-C.4 AC-6 | Open sheet via marker tap. Dismiss (drag down or tap backdrop). Verify selection ring disappears and `selectedMapAlertId` is null. |
| Filter chip toggle updates map markers reactively | WS-C.4 AC-7, AC-8, AC-9 | Tap "SEIS" chip. Verify only seismic markers remain. Verify URL contains `?category=seismic`. Deselect. Verify all markers return and URL param removed. |
| View mode toggle switches marker data source | WS-C.4 AC-11 | Switch to "Raw". Verify store `viewMode: 'raw'` and URL `view=raw`. Verify markers reflect raw alert data. |
| Settings sheet opens via hamburger button with correct controls | WS-C.5 AC-1 through AC-6 | Tap hamburger in bottom nav. Verify settings sheet slides up. Verify ambient effects toggle, P1 sound toggle, auto-lock selector, color scheme display, session info, API health, and logout are present. |
| Ambient effects toggle syncs with `settings.store.effectsEnabled` | WS-C.5 AC-7 | Toggle ambient effects off. Verify `effectsEnabled` is false in store. Verify toggle reflects store state on reopen. |
| Auto-lock timeout selector syncs with `settings.store.idleLockTimeoutMinutes` and persists | WS-C.5 AC-9 | Select "15m". Refresh page. Reopen settings. Verify selector shows "15m". Verify localStorage contains the updated value. |
| Logout flow: tap -> confirm -> clear session -> redirect to `/login` | WS-C.5 AC-11, AC-12 | Tap Logout. Verify inline confirmation appears. Tap confirm. Verify redirect to `/login`. Verify sessionStorage cleared. |
| Desktop rendering is byte-for-byte identical at >= 768px viewport | All SOWs | Visual comparison at 1440x900. No changes to `CoverageMap.tsx`, `MapMarkerLayer.tsx`, `MapPopup.tsx`, `coverage.store.ts`, `map-utils.ts`, or `settings.store.ts` behavior. |
| `pnpm typecheck` and `pnpm build` pass with zero errors | All SOWs | CLI execution. |

---

## 8. Inputs Required by Next Phase

Phase D (Category Detail + Alert Detail) and Phase E (Intel Tab + Search) require the following from Phase C:

| Input | Source WS | Consumer WS | Description |
|-------|-----------|-------------|-------------|
| `MobileBottomSheet` component (core + advanced) | WS-C.1, WS-C.2 | WS-D.1, WS-D.2, WS-E.2 | Container for all drill-down content. Provides snap points, drag, expand-to-fullscreen, focus trap, popstate integration. |
| `SHEET_CONFIGS` with named snap point presets | WS-C.1 | WS-D.1, WS-D.2 | `categoryDetail: [35, 65, 100]` for three-stop category detail sheet. `alertDetail: [70, 100]` for alert detail. |
| `useSheetHistory` hook | WS-C.2 | WS-D.3 | Browser back button integration for sheet dismissal. Coordinates with morph state machine reverse. |
| `useSheetFocusTrap` hook | WS-C.2 | WS-D.1, WS-D.2 | Accessibility: focus management for all sheet content. |
| Marker tap -> store -> sheet pattern | WS-C.4 | WS-D.2 | `MobileAlertDetailStub` replaced by `MobileAlertDetail`. The store-driven conditional rendering pattern carries forward. |
| `MobileAlertDetailStub` location | WS-C.4 | WS-D.2 | File to replace: `src/components/mobile/MobileAlertDetailStub.tsx`. |
| Filter chip + fly-to pattern | WS-C.4 | WS-E.3 | Cross-tab "Show on Map" reuses the fly-to + category filter pattern established in C.4. |
| `MobileFilterChips` component | WS-C.3 | WS-E.3 | Reused on Map tab when navigating from Intel tab's "Show on Map" action. |
| `MobileMapView` with `externalMapRef` | WS-C.3 | WS-E.3 | Map ref enables programmatic `flyTo` from cross-tab navigation. |
| `settings.store.idleLockTimeoutMinutes` field | WS-C.5 | WS-F.4 | Consumed by `useIdleLock` hook for actual idle timer implementation. |
| `settings.store.audioNotificationsEnabled` toggle (UI in settings) | WS-C.5 | WS-F.4 | Consumed by `useP1AudioAlert` hook for Web Audio API playback gating. |
| `useApiHealth` hook | WS-C.5 | (self-contained, displayed in settings) | No downstream consumer beyond the settings sheet. |

---

## 9. Gaps and Recommendations

### 9.1 Snap Point Format Must Be Standardized Before Implementation (CTA) -- BLOCKING

**Status:** See Conflict 1 above.

**Impact:** If WS-C.4 is implemented with decimal format `[0.7, 1.0]` against C.1's integer percentage API `[70, 100]`, the alert detail sheet will render as a barely-visible 0.7% sliver. This is a functional break, not a cosmetic issue.

**Recommendation:** Add a compile-time or runtime guard to WS-C.1's component. TypeScript branded types can catch this at compile time:
```typescript
type SnapPointPercent = number & { __brand: 'SnapPointPercent' }
function snapPoint(pct: number): SnapPointPercent {
  if (pct < 1 || pct > 100) throw new RangeError(`Snap point must be 1-100, got ${pct}`)
  return pct as SnapPointPercent
}
```
Alternatively, add a simple runtime assertion in `MobileBottomSheet`'s effect:
```typescript
if (snapPoints.some(p => p > 0 && p < 1)) {
  console.warn('MobileBottomSheet: snapPoints should be 0-100, not 0-1. Did you mean', snapPoints.map(p => p * 100), '?')
}
```

### 9.2 C.1-C.2 Interface Contract Not Formalized (STW)

WS-C.2 extends WS-C.1's component with fullscreen mode, history integration, focus trap, and landscape constraint. However, C.2's dependency description references C.1 deliverables by informal names ("sheet state type," "SheetContext or equivalent API," "imperative API or prop-based control for programmatic snap changes") rather than specific interface contracts.

**Impact:** If C.1 delivers a different API surface than C.2 expects, C.2 must adapt, potentially requiring rework.

**Recommendation:** WS-C.1 should define and export a `MobileBottomSheetRef` imperative handle (via `forwardRef` + `useImperativeHandle`) that C.2 can use for programmatic snap changes:
```typescript
interface MobileBottomSheetRef {
  snapTo: (snapIndex: number) => void
  dismiss: () => void
  getCurrentSnap: () => number
}
```
This formalizes the C.1 -> C.2 interface and eliminates ambiguity.

### 9.3 No Integration Test for Full Marker Tap Flow (PMO)

WS-C.4 specifies unit tests for individual handlers and store interactions, but no integration test covers the full flow: marker tap -> store write -> sheet open -> stub render -> sheet dismiss -> store clear -> ring disappear. This end-to-end flow spans C.1 (sheet), C.3 (map view), and C.4 (wiring).

**Recommendation:** Add an integration test to WS-C.4 that mounts the full map tab section of `MobileView` (with mocked `MobileBottomSheet` and `MobileMapView`) and exercises the complete marker tap -> dismiss cycle. This catches composition errors that unit tests miss.

### 9.4 `useApiHealth` / `useDataFreshness` Relationship Needs Decision (CTA)

**Status:** See Conflict 3 above. WS-C.5 creates `useApiHealth` which has significant conceptual overlap with WS-B.3's `useDataFreshness`.

**Impact:** Two hooks monitoring the same TanStack Query timestamps creates maintenance burden and potential divergence (e.g., one hook's staleness threshold changes while the other doesn't).

**Recommendation:** If B.3's `useDataFreshness` is available when C.5 is implemented, wrap it. If B.3 has not been implemented yet (Phase B may be in progress), C.5 can create `useApiHealth` independently with a TODO note to consolidate when B.3 ships. The staleness threshold (3 minutes) should be defined as a shared constant in `src/lib/constants.ts`.

### 9.5 WS-C.5 Settings Store Modification Requires Careful Sequencing (PMO)

WS-C.5 modifies `settings.store.ts` (a file shared between mobile and desktop). The modification is additive (new field, new action, updated `partialize`), but if another workstream modifies the same file concurrently, merge conflicts will occur.

**Impact:** Low. No other Phase C workstream modifies `settings.store.ts`. The risk is limited to concurrent work from other phases.

**Recommendation:** WS-C.5's store modification should be committed as a separate, atomic change (not bundled with the UI component) to minimize merge conflict surface. The field addition and `partialize` update are 4 lines total.

### 9.6 Bottom Sheet Spring Constant Tunability (CTA)

WS-C.1 tokenizes spring constants as CSS custom properties (`--sheet-spring-stiffness`, `--sheet-spring-damping`, `--sheet-spring-mass`). These are read at component mount time via `getComputedStyle`. If the tokens are changed (e.g., via a future theme switch), the running sheet instance will not pick up the new values until remount.

**Impact:** Very low. Spring constants are not expected to change at runtime. The tokenization is for cross-workstream value sharing, not runtime reactivity.

**Recommendation:** No action needed. Document in WS-C.1's component JSDoc that spring constants are read-once at mount.

### 9.7 Missing: Reduced Motion Support in C.1 (SPO)

WS-C.2 explicitly handles `prefers-reduced-motion` for expand/collapse transitions (duration: 0). However, WS-C.1 does not mention reduced motion for the core drag-to-snap spring animation. A user with reduced motion enabled will still see spring-animated snapping.

**Recommendation:** WS-C.1 should check `prefers-reduced-motion` and, when active, replace spring transitions with instant snap (`duration: 0`) or linear transitions. The check can use `@tarva/ui/motion`'s `useReducedMotion` hook (same as C.2 uses).

### 9.8 Map Tab Keep-Alive Not Specified (CTA)

AD-10 (from Phase A) specifies conditional rendering with unmount for inactive tabs. However, the Map tab contains a WebGL context (MapLibre) that is expensive to initialize (~2s on mobile). Unmounting and remounting on every tab switch creates noticeable latency.

WS-C.3 does not address this. The `next/dynamic` lazy load handles the first load, but subsequent tab switches would remount the MapLibre instance.

**Recommendation:** Override AD-10 specifically for the Map tab. Use CSS `display: none` (visibility hidden, keep mounted) for the map tab container instead of conditional rendering. This preserves the WebGL context across tab switches. TanStack Query's polling continues regardless of visibility (controlled by `document.visibilityState`, not tab state). Add this as an AD-C amendment: "Map tab uses keep-alive (CSS hidden) instead of unmount. Exception to AD-10."

---

## 10. Effort and Sequencing Assessment (PMO)

### 10.1 Effort Estimates

| WS | SOW Size | Estimated Effort | Complexity | Rationale |
|----|----------|-----------------|------------|-----------|
| WS-C.1 | L | 12-16 hours | High | Core bottom sheet component (~300 lines) + `useBottomSheetDrag` hook (~150 lines) + scroll-vs-drag resolution (~100 lines) + type definitions + CSS file + unit tests. This is the most complex single component in the mobile view. Spring physics, velocity-based snap selection, and scroll conflict gating all require precise implementation and extensive manual testing. |
| WS-C.2 | M | 8-12 hours | Medium-High | Extends C.1 with 4 capabilities: fullscreen mode (~80 lines), `useSheetHistory` hook (~60 lines), `useSheetFocusTrap` hook (~60 lines), landscape constraint (~30 lines). Each capability is independently testable but all must integrate cleanly with C.1's base component. History/popstate integration requires careful testing with browser navigation state. |
| WS-C.3 | M | 6-8 hours | Medium | `MobileMapView` wrapper (~120 lines, wrapping existing `CoverageMap`), `MobileFilterChips` (~150 lines), floating control positioning, GPS button CSS overrides, CSS file. The map wrapper is straightforward (passing props through). Filter chips are a moderately complex scrolling UI. GPS control is MapLibre native with CSS overrides. |
| WS-C.4 | S | 4-6 hours | Low-Medium | Wiring handlers (~100 lines), `MobileAlertDetailStub` (~80 lines), `MobileView` integration (~50 lines), unit tests. All data flows use existing store actions. Complexity is in the reactive rendering pattern (conditional sheet based on store state) and the `displayMarkers` computation. |
| WS-C.5 | S | 4-6 hours | Low-Medium | `MobileSettings` component (~250 lines), store extension (4 lines), `useApiHealth` hook (~30 lines), hamburger wiring (~10 lines), CSS file, unit tests. Well-scoped with clear data contracts. Logout flow requires inline confirmation UX. |

**Total Phase C:** 34-48 hours of implementation effort (excluding review and verification).

### 10.2 Resource Loading

| Agent/Role | Workstreams | Conflict Risk |
|------------|-------------|---------------|
| `world-class-ux-designer` | WS-C.1, WS-C.3 | **Sequential** -- C.1 must complete before C.3 can be fully tested with the bottom sheet. Same agent for both, which eliminates handoff risk but makes them serial. |
| `world-class-ui-designer` | WS-C.2 | Depends on C.1. Different agent from C.1, so can start once C.1's base component is available. |
| `react-developer` | WS-C.4, WS-C.5 | **Parallel** -- C.4 depends on C.1 + C.3; C.5 depends on C.1 only. Same agent, but C.5 can start as soon as C.1 delivers while C.4 waits for C.3. |

### 10.3 Parallel Execution Opportunities

**Wave 1 (single workstream, highest priority):**
- WS-C.1 (`world-class-ux-designer`): Bottom sheet core -- the critical path bottleneck. All other C workstreams depend on this. (12-16 hours)

**Wave 2 (parallel, after C.1 completes):**
- WS-C.2 (`world-class-ui-designer`): Bottom sheet advanced -- extends C.1 (8-12 hours)
- WS-C.3 (`world-class-ux-designer`): Map view -- wraps CoverageMap, builds filter chips (6-8 hours)
- WS-C.5 (`react-developer`): Settings sheet -- consumes C.1 as container (4-6 hours)

These three have no file conflicts and different agents.

**Wave 3 (after C.3 completes):**
- WS-C.4 (`react-developer`): Map interactions -- wires C.3's components to stores (4-6 hours)

### 10.4 Recommended Execution Order

```
Pre-flight: Resolve OQ-C1 (snap point format standardization -- Conflict 1)
            Confirm OQ-C8 (config ID vs direct snapPoints prop API)
            Resolve OQ-C6 (useApiHealth vs useDataFreshness relationship)

Day 1-2:  WS-C.1 (bottom sheet core) -- critical path, highest priority
Day 3:    WS-C.2 + WS-C.3 + WS-C.5 (parallel, all depend on C.1)
Day 4:    WS-C.3 completion + WS-C.4 (depends on C.3)
Day 4+:   WS-C.2 completion, integration testing
Day 5:    Phase C review gate, device testing (iOS Safari, Chrome Android),
          full marker tap -> dismiss flow verification
```

### 10.5 Bottleneck Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **WS-C.1 delays block entire phase** | Medium | Critical | C.1 is the only phase-wide bottleneck. If drag-to-snap or scroll conflict resolution proves harder than estimated, all downstream workstreams are delayed. Mitigation: start C.3 (map view) without the bottom sheet integration -- the map renders and filter chips work independently of the sheet. C.4 can develop and test handler functions against mock sheet components. |
| **Snap point format mismatch (Conflict 1) causes runtime bug** | High (if unresolved) | High | Resolve before implementation. Add runtime assertion or branded type to catch format errors at development time, not production. |
| **iOS Safari scroll-vs-drag conflict** | Medium | High | `overscroll-behavior: contain` has known iOS Safari quirks (rubber-band scrolling, `-webkit-overflow-scrolling: touch` interaction). Budget extra time for iOS testing. WS-C.1 should test on a real iOS device, not just Chrome DevTools simulation. |
| **MapLibre `flyTo` + bottom sheet spring animation jank** | Medium | Low | Both are GPU-accelerated (WebGL + CSS transforms). If jank is observed on low-end devices, delay the `flyTo` by 200ms via `requestAnimationFrame`. WS-C.4 R-3 documents this mitigation. |
| **History stack corruption from rapid sheet open/close** | Low | Medium | `useSheetHistory` must handle edge cases: rapid open/close, close during open animation, close via backdrop while popstate is firing. Add debounce or guard flag to prevent double-fire. |
| **Settings store `partialize` update missed** | Low | High | If `idleLockTimeoutMinutes` is added to the state but NOT to `partialize`, the field will not persist to localStorage. Users' timeout preference resets on page reload. Add a test that verifies the `partialize` function includes all state fields. |
| **`useApiHealth` / `useDataFreshness` duplication** | Medium | Low | If both are implemented independently, two hooks monitor the same timestamps. Not a runtime bug, but a maintenance burden. Wrap or consolidate per Conflict 3 recommendation. |
| **Map tab remount latency (9.8)** | Medium | Medium | If AD-10 is followed (unmount inactive tabs), switching back to Map tab re-initializes MapLibre (~2s). Users may perceive this as slow. Implement keep-alive (CSS hidden) for the map tab per Section 9.8 recommendation. |

### 10.6 Phase C Summary

Phase C is the highest-risk phase in the mobile build. The bottom sheet (`MobileBottomSheet`) is the most complex single component, and its correctness gates five downstream workstreams directly and all of Phases D and E transitively. The one blocking conflict (snap point format mismatch, Conflict 1) is a straightforward naming/format issue that must be resolved before implementation but does not require architectural changes.

The remaining four workstreams (C.2 through C.5) are well-scoped with clear interfaces and no inter-workstream file conflicts. Once C.1 delivers a stable base component, the remaining work parallelizes well across three agents over 2-3 days. Total elapsed time for the phase is estimated at 5-6 working days with the three-agent assignment, dominated by C.1's 2-day critical path.

The map tab (C.3 + C.4) benefits from the zero-modification strategy for `CoverageMap` -- all verified props are already optional, and the shared component's behavior is preserved unchanged. The settings sheet (C.5) is a low-risk UI build with the only structural concern being the `partialize` update in `settings.store.ts`.

Post-implementation, the most important verification is the full marker tap -> bottom sheet -> dismiss cycle on real iOS and Android devices. Chrome DevTools simulation does not reliably reproduce scroll-vs-drag conflicts, `overscroll-behavior` behavior, or `history.pushState`/`popstate` timing on mobile browsers.

---

## Appendix A: File Change Summary

| File | Change Type | Source WS | Description |
|------|-------------|-----------|-------------|
| `src/components/mobile/MobileBottomSheet.tsx` | New | WS-C.1 | Core bottom sheet component (~300 lines): spring drag, snap points, glass background, drag handle, scroll-vs-drag resolution, backdrop overlay |
| `src/hooks/use-bottom-sheet-drag.ts` | New | WS-C.1 | Drag-to-snap calculation, scroll conflict gating, spring animation state |
| `src/lib/interfaces/mobile.ts` | Modified | WS-C.1 | Append `BottomSheetConfig`, `SnapPointPercent`, `SHEET_CONFIGS`, `SHEET_VELOCITY_THRESHOLDS` type definitions |
| `src/styles/mobile-bottom-sheet.css` | New | WS-C.1 | Glass surface, drag handle, scroll container, backdrop styles |
| `src/hooks/use-sheet-history.ts` | New | WS-C.2 | Browser history integration for sheet lifecycle (`pushState`/`popstate`) |
| `src/hooks/use-sheet-focus-trap.ts` | New | WS-C.2 | Focus trap, Escape key dismissal, focus return on close |
| `src/styles/mobile-bottom-sheet.css` | Modified | WS-C.2 | Fullscreen state, landscape constraint, focus-visible, expand/collapse button styles |
| `src/components/mobile/MobileMapView.tsx` | New | WS-C.3 | Full-bleed `CoverageMap` wrapper with dynamic import, GPS control, mobile sizing |
| `src/components/mobile/MobileFilterChips.tsx` | New | WS-C.3 | Horizontal scroll category pill bar with multi-select |
| `src/styles/mobile-map-view.css` | New | WS-C.3 | Map tab layout, filter chips scrolling, floating controls positioning, GPS control CSS overrides |
| `src/components/mobile/MobileAlertDetailStub.tsx` | New | WS-C.4 | Temporary alert detail placeholder (~80 lines), replaced by WS-D.2 |
| `src/views/MobileView.tsx` | Modified | WS-C.4 | Wire marker tap, filter chip, view mode, time range handlers into map tab section |
| `src/components/mobile/MobileSettings.tsx` | New | WS-C.5 | Settings bottom sheet: toggles, auto-lock selector, session info, API health, logout |
| `src/hooks/use-api-health.ts` | New | WS-C.5 | Tri-state API health signal derived from TanStack Query timestamps |
| `src/styles/mobile-settings.css` | New | WS-C.5 | Settings-specific styles |
| `src/stores/settings.store.ts` | Modified | WS-C.5 | Add `idleLockTimeoutMinutes` field, `setIdleLockTimeout` action, update `partialize` |

## Appendix B: Protective-Ops Resolution Mapping

| Protective-Ops Requirement | Assigned To | Deliverable | Phase C Status |
|---------------------------|-------------|-------------|----------------|
| C1: Data staleness indicator | WS-B.3 (Phase B) | `useDataFreshness` + `DataStaleBanner` | Not in Phase C scope -- delivered by Phase B |
| C2: P1 banner persistence | WS-B.1 (Phase B) | `MobileP1Banner` | Not in Phase C scope -- delivered by Phase B |
| C3: "Show on Map" from all contexts | WS-E.3 (Phase E) | Cross-tab fly-to + filter pattern | Phase C establishes the pattern (C.4); Phase E wires all contexts |
| C4: GPS center-on-me | **WS-C.3** | `GeolocateControl` with Oblivion CSS | **Delivered in Phase C** |
| C5: Session auto-lock configuration | **WS-C.5** | `idleLockTimeoutMinutes` store field + settings UI | **Store field + UI delivered in Phase C; timer implementation deferred to WS-F.4** |
| C6: P1 audio notification toggle | **WS-C.5** | Settings toggle bound to `audioNotificationsEnabled` | **Toggle UI delivered in Phase C; Web Audio playback deferred to WS-F.4** |
| C7: Connectivity indicator dot | WS-B.3 (Phase B) | `ConnectivityDot` | Not in Phase C scope -- delivered by Phase B |

## Appendix C: Cross-Phase Interface Verification Summary

The five key checks requested in the task prompt:

| Check | Result | Details |
|-------|--------|---------|
| **C.1 and C.2 interface compatibility** | Partially verified -- informal contract | C.2 references C.1 deliverables by description, not by typed interface. Gap 9.2 recommends a `MobileBottomSheetRef` imperative handle to formalize the contract. Props API naming differences (Conflict 2) are minor and resolvable. |
| **C.3 and C.4 marker tap -> bottom sheet flow with C.1's API** | **CONFLICT: snap point format mismatch** | C.4 passes `[0.7, 1.0]` (decimal) but C.1 expects `[70, 100]` (integer percentage). Must resolve before implementation. See Conflict 1. Store flow verified: `selectMapAlert` -> `selectedMapAlertId` -> conditional sheet render is correct. |
| **C.5 settings store extension with existing persist middleware** | Verified compatible | `idleLockTimeoutMinutes` is a new field name (no collision). Must update BOTH `SettingsState` interface AND `partialize` function (lines 164-173). Existing localStorage data lacks the field -- default value (5) applies on first load. |
| **C.3's optional props on CoverageMap.tsx not breaking desktop** | Verified safe | All props C.3 needs (`onMarkerClick`, `onInspect`, `selectedMarkerId`, `externalMapRef`) are already optional in `CoverageMap`'s interface. Desktop rendering passes `undefined`. Zero modification to shared component. |
| **Bottom sheet state management location** | Implicit conditional rendering | No dedicated store, context, or local boolean for sheet open/close. Alert detail sheet visibility is derived from `selectedMapAlertId !== null`. Settings sheet uses local `useState`. This eliminates impossible states (sheet open without selection) and is architecturally sound. |
