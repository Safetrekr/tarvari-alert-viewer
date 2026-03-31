# Phase D Overview: Category + Alert Detail

> **Synthesized by:** CTA
> **Parent Plan:** combined-recommendations.md (Phase Decomposition, Phase D)
> **Date:** 2026-03-06
> **Status:** Draft

---

## 1. Phase Summary

Phase D delivers the detail drill-down experience for the mobile view: the category detail bottom sheet, the alert card and alert detail components, and the morph state machine wiring that connects them. When an analyst taps a category card on the Situation tab, a bottom sheet opens with progressive disclosure content (summary at 35%, alert list at 65%, source health at 100%). Tapping an alert row opens a nested alert detail sheet with full metadata, geographic scope, confidence bar, and three action buttons ("Show on Map", "View Category", "Share"). The morph state machine bridges the Zustand UI store to the bottom sheet lifecycle, and two cross-tab navigation handlers enable flowing from any alert context to the Map tab or a different category's detail view.

Phase D contains three workstreams totaling approximately 5 new files, 3 modified files, and 2 CSS files. All components consume existing TanStack Query hooks (`useCategoryIntel`, `useCoverageMapData`, `useCoverageMetrics`) and introduce no new API endpoints or Zustand store fields. One new static data file (`COUNTRY_CENTROIDS`) is introduced for the "Show on Map" country-level fallback.

**Risk profile:** Medium. The workstreams are individually well-specified, but **four cross-SOW interface conflicts** have been identified, two of which are BLOCKING. These involve mismatched prop names and incompatible callback signatures between the components D.1 defines, D.2 defines, and D.3 consumes. All four must be resolved before implementation begins.

**Key deliverables at phase exit:**
- Tapping a category card opens a progressive disclosure bottom sheet with header, summary, severity bar, sortable/filterable alert list, List/Map toggle, and source health accordion
- Each alert in the list is a 64px touch-optimized card with severity dot, title, priority badge, category tag, and timestamp
- Tapping an alert card opens a nested alert detail sheet with full metadata, confidence bar, geo scope tags, and action buttons
- "Show on Map" switches to the Map tab, flies to the marker, and opens the alert detail sheet -- with country centroid fallback when no precise coordinates exist
- "View Category" switches to the Situation tab and opens the target category's detail sheet via the morph state machine
- Browser back button dismisses the topmost sheet instead of navigating away
- Tab switching while a sheet is open instantly resets morph state and closes the sheet
- Desktop rendering remains byte-for-byte identical

---

## 2. SOW Summary Table

| SOW | Title | Agent | Size | New Files | Modified Files | Depends On | Blocks |
|-----|-------|-------|------|-----------|----------------|------------|--------|
| WS-D.1 | Category Detail | `information-architect` | L | `MobileCategoryDetail.tsx`, `mobile-category-detail.css`, `MOBILE_ICON_MAP` (inline or extracted) | -- | WS-C.1, WS-C.2, WS-B.2, WS-A.3 | WS-D.3 |
| WS-D.2 | Alert Detail + Card | `information-architect` | M | `MobileAlertCard.tsx`, `MobileAlertDetail.tsx`, `mobile-alert.css`, `country-centroids.ts` | `MobileView.tsx` (stub swap) | WS-C.1, WS-C.4, WS-D.1, WS-A.3 | WS-D.3, WS-E.3 |
| WS-D.3 | Morph + Navigation | `react-developer` | M | `use-mobile-morph-bridge.ts`, `mobile-morph-bridge.test.ts` | `MobileView.tsx`, `MobileShell.tsx` | WS-C.1, WS-C.2, WS-B.2, WS-D.1, WS-D.2 | WS-E.3 |

**Agent split:** D.1 and D.2 are assigned to `information-architect` (content components, visual spec, progressive disclosure). D.3 is assigned to `react-developer` (hook authoring, state machine wiring, navigation logic).

**Critical path:** WS-D.1 and WS-D.2 can begin in parallel once Phase C is complete. WS-D.3 depends on both D.1 and D.2 and is the phase's integration layer.

---

## 3. Cross-SOW Conflicts

### Conflict 1: `MobileAlertCard` prop name mismatch -- BLOCKING

**WS-D.1** renders `MobileAlertCard` in its Section F alert list (line 343 of SOW):

```typescript
<MobileAlertCard
  alert={item}        // <-- prop name: "alert"
  onTap={onAlertTap}
  isSelected={selectedAlertId === item.id}
/>
```

**WS-D.2** defines `MobileAlertCardProps` (Section 4, D-1):

```typescript
export interface MobileAlertCardProps {
  readonly item: CategoryIntelItem   // <-- prop name: "item"
  readonly onTap: (item: CategoryIntelItem) => void
  readonly isSelected?: boolean
}
```

**Conflict:** D.1 passes the data via a prop named `alert`, but D.2 expects a prop named `item`. This is a compile-time error -- TypeScript will reject `alert` as an unknown prop and require `item`.

**Resolution:** Align on D.2's prop name `item`. D.1 must change its rendering to `<MobileAlertCard item={item} .../>`. D.2 is the component author and owns the interface.

---

### Conflict 2: `onAlertTap` callback signature mismatch -- BLOCKING

**WS-D.1** defines `MobileCategoryDetailProps.onAlertTap`:

```typescript
onAlertTap: (alertId: string) => void
```

This is the callback D.1 fires when a list row or map marker is tapped. D.1 passes `onAlertTap` directly as the `onTap` prop to `MobileAlertCard`:

```typescript
<MobileAlertCard
  alert={item}
  onTap={onAlertTap}   // (alertId: string) => void
  isSelected={selectedAlertId === item.id}
/>
```

**WS-D.2** defines `MobileAlertCardProps.onTap`:

```typescript
readonly onTap: (item: CategoryIntelItem) => void
```

The `onTap` callback receives the **full `CategoryIntelItem` object**, not just its `id` string. D.2's implementation:

```typescript
const handleTap = useCallback(() => onTap(item), [onTap, item])
```

**Conflict:** D.1 expects `onTap` to accept `(alertId: string)` and passes its `onAlertTap: (alertId: string) => void` directly. D.2 calls `onTap(item)` where `item` is a `CategoryIntelItem`. TypeScript will reject this at the call site -- D.1 passes a function expecting a `string` where D.2 expects a function accepting `CategoryIntelItem`.

**Resolution:** Two options:

**(a) Align on D.2's richer signature** (recommended). Change `MobileCategoryDetailProps.onAlertTap` to `(alertId: string, item: CategoryIntelItem) => void` or `(item: CategoryIntelItem) => void`. D.1 wraps the call: `onTap={(item) => onAlertTap(item.id)}`. D.3's handler receives the full item (useful for the nested alert detail sheet's data prefill). This keeps `MobileAlertCard` a clean presentation component that passes through its received data.

**(b) Align on D.1's string ID signature.** Change D.2's `MobileAlertCard.onTap` to `(alertId: string) => void` and update the internal handler to `useCallback(() => onTap(item.id), [onTap, item.id])`. This is simpler but loses the ability to prefill the alert detail sheet from the list item data.

**Recommendation:** Option (a). D.3's `navigateToMap` handler needs `coords`, `category`, and `basic` data from the alert item, which D.1 can extract from the full `CategoryIntelItem` passed through `onTap`. However, D.1's `onAlertTap` prop should remain `(alertId: string) => void` for simplicity -- D.1 wraps D.2's callback internally.

---

### Conflict 3: `onShowOnMap` signature mismatch -- BLOCKING

**WS-D.2** defines `MobileAlertDetailProps.onShowOnMap`:

```typescript
readonly onShowOnMap: (alertId: string) => void
```

**WS-D.3** defines `navigateToMap` and expects the alert detail component to pass coordinates and metadata:

```typescript
const navigateToMap: (
  alertId: string,
  coords: { lat: number; lng: number },
  category: string,
  basic: { title: string; severity: string; ingestedAt: string },
) => void
```

D.3's Section 5.4 flow diagram shows:

```
MobileAlertDetail calls onShowOnMap(alertId, coords, category, basic)
```

And D.3's dependency table (Section 3, WS-D.2 row) states:

```
WS-D.2 MobileAlertDetail: Content component accepting
  onShowOnMap: (alertId: string, coords: { lat: number; lng: number }, category: string) => void
```

**Conflict:** D.2's `onShowOnMap` accepts only `alertId`. D.3 expects `alertId`, `coords`, `category`, and `basic`. The signatures are incompatible.

**Resolution:** The coordinate resolution logic (including the `COUNTRY_CENTROIDS` fallback from Gap 4) must live somewhere. Two options:

**(a) MobileAlertDetail resolves coordinates internally** (recommended). `MobileAlertDetail` already has access to the full `CategoryIntelItem`, the `displayMarkers` array (from `useCoverageMapData`), and the `COUNTRY_CENTROIDS` lookup. It can resolve coordinates before calling the prop. Change `onShowOnMap` to:

```typescript
readonly onShowOnMap: (
  alertId: string,
  coords: { lat: number; lng: number },
  category: string,
  basic: { title: string; severity: string; ingestedAt: string },
) => void
```

The `canShowOnMap` prop already gates whether the button is enabled, so the coordinate resolution has already been evaluated. `MobileAlertDetail` passes the resolved coordinates to the handler.

**(b) D.3 resolves coordinates in the handler.** Keep D.2's simple `onShowOnMap(alertId)` and make D.3's handler look up the alert's coordinates from the store or the markers array. This adds coupling between D.3 and the data layer but keeps D.2 simpler.

**Recommendation:** Option (a). D.2 already imports `COUNTRY_CENTROIDS` and `resolveAlertCentroid()`, so the data is available. The handler receives all the information D.3 needs to execute `flyTo` without additional lookups. Update D.2's `MobileAlertDetailProps.onShowOnMap` to match D.3's expected signature.

---

### Conflict 4: `MobileCategoryDetail` prop name for alert callback -- WARNING

**WS-D.3** renders `MobileCategoryDetail` in its D-3 integration code (Section 4, D-3):

```tsx
<MobileCategoryDetail
  categoryId={morphCategoryId}
  onViewAlert={handleViewAlertFromCategory}   // <-- "onViewAlert"
  onNavigateToMap={handleNavigateToMap}
/>
```

**WS-D.1** defines `MobileCategoryDetailProps`:

```typescript
export interface MobileCategoryDetailProps {
  categoryId: string
  onBack: () => void
  onAlertTap: (alertId: string) => void     // <-- "onAlertTap"
  currentSnap: number
  selectedAlertId?: string | null
}
```

**Issues:**
1. D.3 uses `onViewAlert` -- D.1 defines `onAlertTap`. Name mismatch.
2. D.3 passes `onNavigateToMap` -- D.1's interface has no such prop.
3. D.3 does not pass `onBack`, `currentSnap`, or `selectedAlertId` -- all defined in D.1.

**Resolution:** D.3 must update its integration code to match D.1's authoritative interface. Use `onAlertTap` instead of `onViewAlert`. Pass `onBack`, `currentSnap`, and `selectedAlertId` as required. The `onNavigateToMap` prop is not part of D.1's interface; if D.1 needs it, add it explicitly (but it may not -- the map navigation from a category context goes through D.3's handling of the alert detail sheet, not through the category detail component directly).

---

### Conflict 5: `MOBILE_ICON_MAP` file location ambiguity -- WARNING

**WS-D.1** creates `MOBILE_ICON_MAP` and states it "can be placed inline in the component file or extracted to `src/lib/icon-map.ts`."

**WS-D.2** imports `MOBILE_ICON_MAP` with:

```typescript
import { MOBILE_ICON_MAP } from '@/components/mobile/icon-map'
```

**Issue:** D.1 is ambiguous about file location (three options: inline, `src/lib/icon-map.ts`, or potentially `src/components/mobile/icon-map.ts`). D.2 hardcodes an import from `@/components/mobile/icon-map`.

**Resolution:** D.1 must extract `MOBILE_ICON_MAP` to `src/components/mobile/icon-map.ts` to match D.2's import path. Remove the ambiguity.

---

## 4. Architecture Decisions Digest

Collected from all three SOWs. Indexed sequentially for Phase D.

| ID | SOW | Decision | Rationale |
|----|-----|----------|-----------|
| AD-D.1 | D.1 | Progressive disclosure gated by sheet snap point (35%/65%/100%) | Reduces cognitive load on peek; reveals working content at default snap; deep analysis at full height. Content gates use integer comparison (`currentSnap >= 65`). |
| AD-D.2 | D.1 | List/Map segmented control as local `useState` (not Zustand) | View toggle is ephemeral UI state, not application state. Resetting on sheet close is the desired behavior. Matches Phase A AD-3 (tab state is local). |
| AD-D.3 | D.1 | Source health accordion at 100% snap only | Source health is a secondary investigation tool. Hiding it at lower snap points prevents information overload in the primary alert browsing workflow. |
| AD-D.4 | D.1 | Priority filter state shared with `coverage.store.selectedPriorities` | Reuses the desktop's existing priority filter state, ensuring filter selections persist across category navigation. URL sync via `syncPrioritiesToUrl()` maintains deep-link consistency. |
| AD-D.5 | D.2 | Achromatic priority badges in detail context (per existing AD-1 from coverage.ts) | `PriorityBadge` renders shape + weight + animation without color. Severity badge carries the color signal. Avoids double-coding the threat level in the detail view. |
| AD-D.6 | D.2 | Content crossfade with `AnimatePresence mode="wait"` for alert detail | Provides visual continuity when switching between basic data (from store) and full data (from query). Prevents layout shift. |
| AD-D.7 | D.2 | Country centroid fallback for "Show on Map" (Gap 4 resolution) | When no `MapMarker` match exists for an alert, `resolveAlertCentroid()` falls back to `COUNTRY_CENTROIDS` using the alert's first `geoScope` entry (ISO 3166-1 alpha-2). The button is disabled only when no centroid can be resolved. |
| AD-D.8 | D.3 | Mount `useMorphChoreography` in `MobileView` (not `MobileShell`) | `MobileView` owns the data layer and sheet rendering. `MobileShell` is a layout container and should not know about morph. The choreography hook needs proximity to the sheet wiring. |
| AD-D.9 | D.3 | `isOpen` excludes `leaving-district` phase | Sheet close animation and morph leaving-district timer run concurrently. Setting `isOpen = false` immediately on `reverseMorph()` lets the sheet's spring-to-zero animation begin without delay. |
| AD-D.10 | D.3 | Tab switch uses `resetMorph()` (instant) not `reverseMorph()` (animated) | Tab switch is an explicit navigation intent. Animating a 300ms close before the new tab appears adds latency and confusion. `resetMorph()` is instant; the sheet's spring close runs concurrently with the tab content mount. |
| AD-D.11 | D.3 | `navigateToCategory` uses `queueMicrotask` for `startMorph` scheduling | Provides explicit ordering: `resetMorph` applies, React can commit, `startMorph` reads idle state. Robust against future batching behavior changes. |
| AD-D.12 | D.3 | `navigateToMap` uses `setTimeout(100)` for `flyTo` | MapLibre GL JS needs to mount and initialize its WebGL context before `flyTo` can execute. 100ms is conservative. A `mapRef.onLoad` approach is deferred to WS-E.3. |
| AD-D.13 | D.3 | Category filter is additive on "Show on Map" navigation | Preserves the user's existing filter context. If filters are active and exclude the target category, the category is added (not replaced). If no filters are active (showing all), only the target category is activated. |
| AD-D.14 | D.3 | No `fromPopstate` flag -- single dismiss handler for all sources | WS-C.2's `useSheetHistory` manages the history stack internally. The `onDismiss` callback is source-agnostic. `reverseMorph()` is idempotent for already-reversed phases. |

---

## 5. Dependency Chain Verification

### 5.1 Upstream Dependencies (from prior phases)

| Dependency | Provider | Consumer(s) | Status | Verified |
|------------|----------|-------------|--------|----------|
| `MobileBottomSheet` component | WS-C.1 | D.1, D.2, D.3 | Pending (Phase C) | Props match: `isOpen`, `onDismiss`, `config`, `ariaLabel`, `sheetId`, `children` |
| `SHEET_CONFIGS.categoryDetail` `[35, 65, 100]` | WS-C.1 | D.1, D.3 | Pending (Phase C) | Integer percentages confirmed in both SOWs |
| `SHEET_CONFIGS.alertDetail` `[70, 100]` | WS-C.1 | D.2 | Pending (Phase C) | Integer percentages confirmed |
| `useSheetHistory` hook | WS-C.2 | D.3 (transitively) | Pending (Phase C) | Consumed by MobileBottomSheet internally, not directly by D.3 |
| `useSheetFocusTrap`, `aria-modal`, fullscreen mode | WS-C.2 | D.1 (transitively) | Pending (Phase C) | Consumed by MobileBottomSheet internally |
| `MobileCategoryCard` tap -> `startMorph(id, { fast: true })` | WS-B.2 | D.3 | Pending (Phase B) | Verified: `startMorph` exists in `ui.store.ts` |
| `MobileAlertDetailStub` | WS-C.4 | D.2 (replaces it) | Pending (Phase C) | D.2 replaces stub with full `MobileAlertDetail` |
| Glass, severity, typography, spacing, touch target tokens | WS-A.3 | D.1, D.2 | Pending (Phase A) | Token names verified consistent across SOWs |
| `MobileStateView` | WS-A.2 | D.1 | Pending (Phase A) | Note: Phase A and B overviews flagged this as unassigned (MobileStateView gap). D.1 assumes it exists. |
| `useCategoryIntel`, `useCoverageMapData`, `useCoverageMetrics` | Existing codebase | D.1, D.2 | Exists | Verified at `src/hooks/` |
| `CategoryIntelItem` type | `src/hooks/use-category-intel.ts` | D.1, D.2 | Exists | Verified |
| `getCategoryMeta`, `getCategoryColor`, `SEVERITY_COLORS`, `PRIORITY_META`, `isPriorityVisible` | `src/lib/interfaces/coverage.ts` | D.1, D.2 | Exists | Verified |
| `selectedMapAlertId`, `selectedMapAlertCategory`, `selectedMapAlertBasic`, `clearMapAlert()`, `selectMapAlert()` | `src/stores/coverage.store.ts` | D.2, D.3 | Exists | Verified |
| `startMorph()`, `reverseMorph()`, `resetMorph()`, `morph.phase`, `morph.targetId` | `src/stores/ui.store.ts` | D.3 | Exists | Verified |
| `useMorphChoreography` | `src/hooks/use-morph-choreography.ts` | D.3 | Exists | Verified |
| `PriorityBadge` | `src/components/coverage/PriorityBadge.tsx` | D.1, D.2 | Exists | Verified |
| `relativeTimeAgo` | `src/lib/time-utils.ts` | D.2 | Exists | Verified |
| `CoverageMap` | `src/components/coverage/CoverageMap.tsx` | D.1 (map view) | Exists | Loaded via `next/dynamic ssr:false` |

### 5.2 Intra-Phase Dependencies

```
WS-D.1 -----+
             |---> WS-D.3 (integration layer)
WS-D.2 -----+
```

- D.1 and D.2 can be implemented **in parallel**. Neither directly depends on the other at build time (D.2's dependency on D.1 is a runtime context dependency -- MobileAlertCard renders inside MobileCategoryDetail's list, but the component is imported independently).
- D.3 depends on both D.1 and D.2 -- it wires them together in `MobileView.tsx`. D.3 cannot be completed until D.1 and D.2 are delivered.

### 5.3 Downstream Dependencies (blocking future phases)

| Downstream | What It Needs from Phase D |
|------------|---------------------------|
| WS-E.3 (Cross-Tab Links) | `navigateToCategory` and `navigateToMap` handler patterns from D.3. `MobileAlertDetail.onShowOnMap` and `onViewCategory` callback signatures from D.2. |
| WS-E.1 (Intel Tab Priority Feed) | `MobileAlertCard` component from D.2. |
| WS-E.2 (Search) | `MobileAlertCard` component from D.2. |

### 5.4 Bidirectional Cross-Reference Audit

| Source SOW | Claims It Depends On | Target SOW Claims It Blocks | Match? |
|------------|---------------------|-----------------------------|--------|
| D.1 | WS-C.1 | Phase C Overview: C.1 blocks D.1 | Yes |
| D.1 | WS-C.2 | Phase C Overview: C.2 blocks D.1 (transitively) | Yes |
| D.1 | WS-B.2 | Phase B Overview: B.2 blocks D.1 (via morph) | Yes |
| D.1 | WS-A.3 | Phase A Overview: A.3 blocks all token consumers | Yes |
| D.1 | "Blocks: WS-D.3" | D.3 "Depends On: WS-D.1" | Yes |
| D.2 | WS-C.1 | Phase C Overview: C.1 blocks D.2 | Yes |
| D.2 | WS-C.4 | Phase C Overview: C.4 blocks D.2 (stub replacement) | Yes |
| D.2 | WS-D.1 | D.1 does NOT claim to block D.2 directly | **Asymmetric** |
| D.2 | WS-A.3 | Phase A Overview: A.3 blocks all token consumers | Yes |
| D.2 | "Blocks: WS-D.3" | D.3 "Depends On: WS-D.2" | Yes |
| D.2 | "Blocks: WS-E.3" | combined-recommendations Phase E mentions E.3 | Yes |
| D.3 | WS-D.1 | D.1 "Blocks: WS-D.3" | Yes |
| D.3 | WS-D.2 | D.2 "Blocks: WS-D.3" | Yes |
| D.3 | WS-C.1 | Phase C Overview: C.1 blocks D.3 (transitively) | Yes |
| D.3 | WS-C.2 | Phase C Overview: C.2 blocks D.3 (transitively) | Yes |
| D.3 | WS-B.2 | Phase B Overview: B.2 blocks D.3 | Yes |
| D.3 | "Blocks: WS-E.3" | combined-recommendations Phase E mentions E.3 | Yes |

**Asymmetry found:** D.2 declares a dependency on D.1 ("MobileCategoryDetail provides the alert list context in which MobileAlertCard is rendered; exposes onAlertTap callback"), but D.1 does not list D.2 in its "Blocks" field -- D.1 only claims to block D.3. This is technically correct (D.2 does not need D.1 to compile; the dependency is contextual/runtime). However, D.2's dependency table entry should be clarified as a **runtime context dependency**, not a build dependency.

---

## 6. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| R-D.1 | Interface conflicts (Conflicts 1-3) block implementation until resolved | High | High | Resolve all BLOCKING conflicts before sprint planning. The resolutions are specified in Section 3. Estimated resolution effort: 1 hour to update both SOWs. | CTA |
| R-D.2 | Dual `useMorphChoreography` mount (desktop MorphOrchestrator + mobile MobileView) causes double phase advancement if both trees render | Very Low | High | Desktop and mobile trees are mutually exclusive (code-split via `next/dynamic`, gated by `useIsMobile()`). Add a dev-mode warning in `useMorphChoreography` if it detects being mounted twice (module-level counter). | D.3 agent |
| R-D.3 | `queueMicrotask` in `navigateToCategory` fires before `resetMorph` state applies, causing `startMorph`'s idle guard to reject | Very Low | Medium | Zustand's immer middleware applies state synchronously. The microtask fires after the current synchronous work. Test T-15 verifies this. Fallback: replace with `setTimeout(0)`. | D.3 agent |
| R-D.4 | `setTimeout(100)` in `navigateToMap` is insufficient for MapLibre initialization on slow devices | Low | Medium | 100ms is conservative for React commit + MapLibre init. If insufficient, increase to 200ms or implement a `mapRef.onLoad` callback (deferred to WS-E.3). User sees a brief flash of uncentered map. | D.3 agent |
| R-D.5 | `MobileStateView` component (dependency from Phase A) is still unassigned | Medium | Medium | D.1 lists `MobileStateView` as a dependency from WS-A.2. Phase A and B overviews both flagged this as an unresolved gap. If not delivered, D.1 must inline loading/error/empty states. | CTA to assign |
| R-D.6 | Scroll-vs-drag conflict within the category detail sheet's alert list | Medium | Medium | Depends on WS-C.1's scroll-vs-drag resolution algorithm. If the algorithm fails when nested inside progressive disclosure content (snap < 100%), the list may be undraggable. Test with real device during C.1 delivery. | D.1 agent + C.1 agent |
| R-D.7 | Map view within the category detail sheet (D.1 Section F alt) conflicts with sheet drag gestures | Medium | Medium | D.1 specifies `touch-action: none` and `data-sheet-scroll-lock="true"` on the map container. Depends on WS-C.1 respecting this attribute. Must be verified with real-device testing. | D.1 agent |
| R-D.8 | `COUNTRY_CENTROIDS` static file (~200 entries, ~3KB gzipped) increases bundle size | Low | Low | Static data is tree-shaken into only the mobile chunk. 3KB is well within budget. No mitigation needed. | D.2 agent |
| R-D.9 | Desktop regression from `useMorphChoreography` mount in `MobileView` | Very Low | High | `MobileView` is loaded only on mobile via `next/dynamic`. Desktop never loads this module. Verify with `pnpm build` + desktop smoke test. | D.3 agent |

---

## 7. Estimated Effort

| SOW | Size | Estimated Hours | Confidence | Notes |
|-----|------|-----------------|------------|-------|
| WS-D.1 | L | 10-14 hours | Medium | Complex progressive disclosure, 7 sub-sections, map view dynamic import, sort/filter logic, source health accordion. High visual spec detail reduces ambiguity. |
| WS-D.2 | M | 6-9 hours | High | Two components with detailed visual specs. `COUNTRY_CENTROIDS` is boilerplate. Stub replacement is trivial. |
| WS-D.3 | M | 5-8 hours | Medium | Hook authoring is straightforward but integration testing across morph states, tab switches, and navigation flows requires thorough manual verification. 27 unit tests specified. |
| **Conflict resolution** | -- | 1-2 hours | High | Updating SOWs for Conflicts 1-4 and propagating changes. |
| **Phase total** | -- | **22-33 hours** | -- | -- |

Comparison to prior phases: Phase A was 13-19h (4 SOWs), Phase B was 19-26h (3 SOWs), Phase C was the largest (5 SOWs, highest risk). Phase D is mid-range by effort but lower risk than Phase C -- the bottom sheet framework (the highest-risk subsystem) was delivered in Phase C.

---

## 8. Open Questions

| ID | Question | Source | Blocking? | Proposed Resolution |
|----|----------|--------|-----------|---------------------|
| OQ-D.1 | Should `MobileAlertCard.onTap` pass the full `CategoryIntelItem` or just the `alertId` string? | Conflict 2 | Yes (BLOCKING) | Pass full `CategoryIntelItem` (D.2's current design). D.1 wraps with `(item) => onAlertTap(item.id)`. D.3 can use the full item to prefill the alert detail sheet. |
| OQ-D.2 | Should `MobileAlertDetail.onShowOnMap` include coordinates and metadata, or just `alertId`? | Conflict 3 | Yes (BLOCKING) | Include coordinates, category, and basic metadata (match D.3's `navigateToMap` signature). D.2 resolves coordinates internally using `resolveAlertCentroid()`. |
| OQ-D.3 | Where should `MOBILE_ICON_MAP` be exported from? | Conflict 5 | No | `src/components/mobile/icon-map.ts` to match D.2's import path. |
| OQ-D.4 | Who delivers `MobileStateView`? | R-D.5 | Potentially | Assign to WS-D.1 as a sub-deliverable, or create WS-D.0 to deliver it before D.1 begins. |
| OQ-D.5 | Should `navigateToMap` use `setTimeout(100)` or wait for `mapRef.onLoad`? | AD-D.12, R-D.4 | No | Use `setTimeout(100)` for Phase D. Upgrade to `onLoad` in WS-E.3 when all cross-tab contexts are wired. |
| OQ-D.6 | How does D.3 pass `currentSnap` to `MobileCategoryDetail`? | Conflict 4 | No | `MobileBottomSheet` must expose `currentSnap` via context or render prop. WS-C.1 specifies this capability exists ("Exposes currentSnap via context or callback"). D.3 reads it from `SheetContext` and passes to D.1. |
| OQ-D.7 | How does D.3 track `selectedAlertId` for the category detail context? | Conflict 4 | No | D.3 manages `selectedAlertId` as local state in `MobileView`. When an alert card tap fires, D.3 sets this state and opens the alert detail sheet. When the sheet closes, clear it. Pass to D.1 via prop. |

---

## 9. Recommendations

### 9.1 Resolve BLOCKING conflicts before sprint planning

Conflicts 1, 2, and 3 are interface mismatches that will produce TypeScript compilation errors. They must be resolved by updating the SOWs:

1. **D.1 Section F:** Change `alert={item}` to `item={item}` in `MobileAlertCard` usage.
2. **D.1 `onAlertTap` callback:** Keep as `(alertId: string) => void`. D.1 wraps D.2's `onTap` callback: `onTap={(item) => onAlertTap(item.id)}`.
3. **D.2 `onShowOnMap` prop:** Expand to `(alertId: string, coords: { lat: number; lng: number }, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void`. D.2's "Show on Map" button handler resolves coordinates via `resolveAlertCentroid()` before calling the prop.
4. **D.3 integration code:** Replace `onViewAlert` with `onAlertTap`. Add `onBack`, `currentSnap`, and `selectedAlertId` props to the `MobileCategoryDetail` rendering.

### 9.2 Assign `MobileStateView` ownership

This gap has persisted through Phase A (flagged in Section 9.1), Phase B (flagged in Conflict 3), and now Phase D. `MobileStateView` is consumed by D.1 for loading/error/empty states across all data-dependent sections. Options:

- **(a)** Add it as a sub-deliverable of WS-D.1. D.1's agent creates a simple `MobileStateView` component before building the category detail.
- **(b)** Create WS-D.0 (Foundation Supplement) as a 2-hour sprint-zero ticket.
- **(c)** D.1 inlines loading/error/empty state rendering without the shared component. This creates duplication when D.2, E.1, and E.2 need the same states.

**Recommendation:** Option (a). The component is small (~50 lines) and D.1 is the first consumer.

### 9.3 Extract `MOBILE_ICON_MAP` to `src/components/mobile/icon-map.ts`

D.1 must extract the icon map to a dedicated file at the path D.2 imports from. This is a minor deliverable but must be listed explicitly in D.1's file manifest to avoid implementation confusion.

### 9.4 D.3 must pass all D.1 props

D.3's integration code (Section 4, D-3) is missing several props from D.1's interface:

| D.1 Prop | Source in D.3 |
|----------|---------------|
| `categoryId` | `morphCategoryId` from `useMobileMorphBridge` |
| `onBack` | `handleCategorySheetDismiss` from `useMobileMorphBridge` |
| `onAlertTap` | Local handler in `MobileView` that sets `selectedAlertId` state and opens alert detail sheet |
| `currentSnap` | Read from `SheetContext` (provided by `MobileBottomSheet` from WS-C.1) |
| `selectedAlertId` | Local `useState` in `MobileView` |

D.3's SOW should be updated to show the complete prop pass-through.

### 9.5 Consider `usePrefersReducedMotion` extraction

D.3 notes that `usePrefersReducedMotion` is defined inline in `page.tsx` (lines 126-129) and proposes duplicating it in `MobileView`. Per AD-1 (separate component trees), duplication is acceptable. However, extracting it to `src/hooks/use-prefers-reduced-motion.ts` is trivially low-cost and benefits both trees. Recommend extraction as a Phase D prerequisite.

### 9.6 Add `displayMarkers` to D.2's dependency list

D.2's `MobileAlertDetail` needs access to the `displayMarkers` array to resolve whether a marker exists for the alert (used for `canShowOnMap` determination and for `resolveAlertCentroid()` coordinate lookup). This dependency is not explicitly listed in D.2's input dependencies table. Either:

- Pass `displayMarkers` as a prop to `MobileAlertDetail` (D.3 sources it from `MobileView`)
- Have `MobileAlertDetail` call `useCoverageMapData()` directly (it already calls `useCategoryIntel()`)

Recommend the latter for simplicity -- the data is already cached by TanStack Query (30s stale time) and involves no additional network request.
