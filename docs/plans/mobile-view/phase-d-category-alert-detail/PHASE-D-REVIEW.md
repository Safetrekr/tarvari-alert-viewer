# Phase D Review: Category + Alert Detail

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-06
> **Documents Reviewed:** 4 (ws-d.1, ws-d.2, ws-d.3, PHASE-D-OVERVIEW)
> **Codebase Files Verified:** `coverage.store.ts`, `ui.store.ts`, `morph-types.ts`, `coverage.ts` (interfaces), `use-category-intel.ts`, `use-coverage-metrics.ts`, `use-coverage-map-data.ts`, `coverage-utils.ts`, `CoverageMap.tsx`, `CategoryDetailScene.tsx`, `district-view-overlay.tsx`, `district-view-dock.tsx`, `PriorityBadge.tsx`, `time-utils.ts`, `use-morph-choreography.ts`, `district.ts` (NodeId type)

## Review Verdict: PASS WITH ISSUES

All three SOWs are thorough, well-structured, and demonstrate deep codebase knowledge. The OVERVIEW provides excellent cross-SOW analysis and correctly identifies five interface conflicts, three of which are BLOCKING. Every codebase reference (file path, type name, store action, hook signature, line number) was verified and found accurate. The OVERVIEW's conflict resolutions are sound and implementable. **Five blocking issues** (three interface mismatches plus one D.3 integration code misalignment plus one D.1 internal dependency table contradiction) must be resolved before implementation begins -- all have clear resolutions specified in the OVERVIEW. One additional medium-severity issue (D.1's internal dependency table contradicts D.2's actual interface) was not caught by the OVERVIEW.

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-D.1 | Excellent. All 8 sections. 7 deliverables, detailed visual specs with code samples, 7 sections of progressive disclosure content, unit tests specified. | Strong. All hook signatures, store actions, type references verified accurate. Line number references to `CategoryDetailScene.tsx` confirmed. | H-1, H-2, H-5, M-1, M-2 | PASS with fixes |
| WS-D.2 | Excellent. All 8 sections. 5 deliverables, detailed visual specs with exact pixel/opacity values, comprehensive CSS file spec, unit tests specified. | Strong. All `CategoryIntelItem` fields match exactly. `SEVERITY_COLORS`, `PRIORITY_META`, `PriorityBadge` props all verified. `relativeTimeAgo` confirmed at `time-utils.ts` line 21. | H-3, M-3, M-1 | PASS with fixes |
| WS-D.3 | Excellent. All 8 sections. 7 deliverables, detailed flow diagrams, integration code, 27 unit tests specified. | Strong. All `ui.store` actions (`startMorph`, `reverseMorph`, `resetMorph`) verified. `MorphPhase`, `MorphState`, `StartMorphOptions`, `MORPH_TIMING_FAST` all confirmed. `coverage.store` actions (`toggleCategory`, `clearSelection`, `selectMapAlert`, `clearMapAlert`, `clearDistrictFilters`) all verified. `NodeId = string` confirmed. | H-4, M-4, M-5, L-2 | PASS with fixes |
| PHASE-D-OVERVIEW | Excellent. Correctly identifies all 5 cross-SOW conflicts with clear resolutions. Dependency chain verification is thorough with bidirectional cross-reference audit. Risk register is comprehensive (9 risks). | Strong. All "Verified" claims in the dependency table confirmed against actual codebase. | Missed H-5 (D.1 internal dependency table contradiction) | PASS |

---

## Issues Found

### HIGH Severity

#### H-1: `MobileAlertCard` prop name mismatch -- BLOCKING (OVERVIEW Conflict 1)

D.1 Section F renders `<MobileAlertCard alert={item} .../>` but D.2 defines the props interface as `item: CategoryIntelItem`. TypeScript will reject `alert` as an unknown prop.

**Fix:** D.1 must change its rendering in Section F to `<MobileAlertCard item={item} .../>`. The OVERVIEW resolution is correct.

#### H-2: `onAlertTap` callback signature mismatch -- BLOCKING (OVERVIEW Conflict 2)

D.1 defines `MobileCategoryDetailProps.onAlertTap: (alertId: string) => void` and passes it directly as `onTap` to `MobileAlertCard`. D.2 defines `MobileAlertCardProps.onTap: (item: CategoryIntelItem) => void`. The signatures are incompatible -- D.1 passes a function expecting `string` where D.2 expects a function accepting `CategoryIntelItem`.

**Fix:** D.1 wraps the callback: `onTap={(item) => onAlertTap(item.id)}`. D.1's `onAlertTap` prop remains `(alertId: string) => void` for simplicity. The OVERVIEW's recommended resolution (option a) is correct.

#### H-3: `onShowOnMap` signature mismatch -- BLOCKING (OVERVIEW Conflict 3)

D.2 defines `MobileAlertDetailProps.onShowOnMap: (alertId: string) => void`. D.3 expects `(alertId: string, coords: { lat: number; lng: number }, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void`. The signatures are incompatible.

**Fix:** D.2 must expand `onShowOnMap` to match D.3's expected signature. D.2's `resolveAlertCentroid()` resolves coordinates internally (including `COUNTRY_CENTROIDS` fallback) before calling the prop. The OVERVIEW's recommended resolution (option a) is correct.

#### H-4: D.3 `MobileCategoryDetail` integration code misalignment -- BLOCKING (OVERVIEW Conflict 4)

D.3's D-3 integration code (Section 4) renders `MobileCategoryDetail` with three props that do not match D.1's interface:

| D.3 Passes | D.1 Expects | Status |
|-------------|-------------|--------|
| `categoryId={morphCategoryId}` | `categoryId: string` | MATCH |
| `onViewAlert={handleViewAlertFromCategory}` | `onAlertTap: (alertId: string) => void` | NAME MISMATCH |
| `onNavigateToMap={handleNavigateToMap}` | *(not in D.1 interface)* | EXTRA PROP |
| *(not passed)* | `onBack: () => void` | MISSING |
| *(not passed)* | `currentSnap: number` | MISSING |
| *(not passed)* | `selectedAlertId?: string \| null` | MISSING |

**Fix:** D.3 must update its integration code to:
1. Use `onAlertTap` instead of `onViewAlert`
2. Remove `onNavigateToMap` (navigation from category detail goes through alert detail, which D.3 wires separately)
3. Pass `onBack={handleCategorySheetDismiss}`
4. Pass `currentSnap` (read from `SheetContext` or `MobileBottomSheet` callback)
5. Pass `selectedAlertId` (managed as local `useState` in `MobileView`)

The OVERVIEW Section 9.4 provides the correct prop mapping table.

#### H-5: D.1 input dependencies table internally contradicts D.2's interface

D.1's Section 3 (Input Dependencies) row for WS-D.2 states:
> Props: `alert: CategoryIntelItem`, `onTap: (id: string) => void`, `isSelected?: boolean`.

This contradicts D.2's actual interface on **two** points:
1. Prop name is `item`, not `alert`
2. `onTap` signature is `(item: CategoryIntelItem) => void`, not `(id: string) => void`

The OVERVIEW catches the rendering-time manifestation of these mismatches (Conflicts 1 and 2) but does not flag that D.1's own dependency table is wrong as a documentation issue.

**Fix:** Update D.1 Section 3 dependency table row for WS-D.2 to:
> Props: `item: CategoryIntelItem`, `onTap: (item: CategoryIntelItem) => void`, `isSelected?: boolean`.

---

### MEDIUM Severity

#### M-1: `MOBILE_ICON_MAP` file location ambiguity (OVERVIEW Conflict 5)

D.1 says `MOBILE_ICON_MAP` can be "placed inline in the component file or extracted to `src/lib/icon-map.ts`." D.2 hardcodes an import from `@/components/mobile/icon-map`. Three possible locations creates implementation confusion.

**Fix:** D.1 must extract `MOBILE_ICON_MAP` to `src/components/mobile/icon-map.ts` to match D.2's import path. Remove the ambiguity from D.1's deliverables section and add the file to D.1's file manifest explicitly.

#### M-2: `MobileStateView` still not implemented -- 4th phase flagging this gap

D.1 depends on `MobileStateView` for loading/error/empty states across all data-dependent sections. This component was:
- Phase A Review H-3: Flagged as unassigned, recommended adding to WS-A.2
- Phase B Review M-2: Noted it was added to WS-A.2 D-8
- Phase C Review M-4: Noted as resolved
- Phase D OVERVIEW R-D.5: Flagged as still a risk

Verified: `MobileStateView` does **not exist** in the codebase. If it was added to A.2's spec, it has not been implemented yet. D.1 will fail to build without it.

**Fix:** Confirm WS-A.2 D-8 includes `MobileStateView` and ensure it is delivered before D.1 implementation begins. If Phase A has not been implemented yet, this is not blocking for planning but will block D.1 implementation.

#### M-3: D.2 missing `useCoverageMapData` in input dependencies

D.2's `resolveAlertCentroid()` function needs access to the `displayMarkers` array from `useCoverageMapData` to check whether a `MapMarker` match exists for the alert before falling back to `COUNTRY_CENTROIDS`. This dependency is not listed in D.2's Section 3 input dependencies table.

**Fix:** Either:
- (a) D.2 calls `useCoverageMapData()` directly (data is cached by TanStack Query, no extra network request)
- (b) D.3 passes `displayMarkers` as a prop from `MobileView`

Add the chosen approach to D.2's input dependencies table.

#### M-4: D.3 dependency table row for D.1 uses wrong prop name

D.3's Section 3 input dependencies table (WS-D.1 row) states:
> `MobileCategoryDetail` content component accepting `categoryId: string`, `onViewAlert: (alertId: string) => void`

D.1's actual interface uses `onAlertTap`, not `onViewAlert`. This is the same underlying issue as H-4 but manifests in D.3's dependency documentation, not just the integration code.

**Fix:** Update D.3 Section 3 WS-D.1 row to match D.1's actual interface.

#### M-5: D.3 internal inconsistency in `onShowOnMap` signature

D.3's Section 3 dependency table (WS-D.2 row) describes `onShowOnMap` as:
```
onShowOnMap: (alertId: string, coords: { lat: number; lng: number }, category: string) => void
```

But D.3's own `navigateToMap` type signature (D-6) includes a fourth parameter `basic`:
```
navigateToMap: (alertId: string, coords: {...}, category: string, basic: {...}) => void
```

The dependency table is missing `basic` from the signature.

**Fix:** Update D.3 Section 3 WS-D.2 row to include the `basic` parameter in the `onShowOnMap` signature.

---

### LOW Severity

#### L-1: D.2 -> D.1 dependency asymmetry (OVERVIEW Section 5.4)

D.2 declares a dependency on D.1 but D.1 does not list D.2 in its "Blocks" field. The OVERVIEW correctly identifies this as a runtime context dependency (not build dependency) and the asymmetry is technically correct. No fix required, but the OVERVIEW's suggestion to clarify D.2's dependency as a "runtime context dependency" in its header would improve clarity.

#### L-2: `usePrefersReducedMotion` duplication

D.3 proposes duplicating the `usePrefersReducedMotion` hook from `page.tsx` into `MobileView`. The OVERVIEW Section 9.5 recommends extracting it to `src/hooks/use-prefers-reduced-motion.ts`. This is a trivially low-cost improvement that benefits both component trees. Not blocking.

#### L-3: D.1 uses `categories: [categoryId]` instead of `category: categoryId`

D.1 calls `useCoverageMapData({ categories: [categoryId] })`. The hook accepts both `categories?: string[]` and `category?: string`. Both work. Using `category: categoryId` would be simpler. Not blocking.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| Phase A token refs | OK | All token names (`--glass-card-bg`, `--severity-*`, `--font-mono`, `--touch-target-min`, `--duration-card-press`, etc.) are consistent with WS-A.3 token definitions. |
| Phase B component refs | OK | D.1 dependency on WS-B.2 `MobileCategoryCard` tap -> `startMorph(id, { fast: true })` is consistent with B.2 spec. |
| Phase C bottom sheet API | OK | All SOWs use C.1's config-based API (`isOpen`, `onDismiss`, `config: BottomSheetConfig`), consistent with Phase C Review H-1 resolution. Integer percentage snap points used consistently (`[35, 65, 100]` for category detail, `[70, 100]` for alert detail), consistent with Phase C Review H-2 resolution. |
| Intra-D dependency chain | ISSUE | D.3's integration code does not match D.1's authoritative prop interface (H-4). D.2's `onShowOnMap` signature does not match D.3's expected signature (H-3). D.1's dependency table description of D.2's props does not match D.2's actual interface (H-5). |
| D -> E dependency chain | OK | D.3 blocks WS-E.3 with `navigateToCategory` and `navigateToMap` handler patterns. D.2 blocks WS-E.1 and WS-E.2 with `MobileAlertCard` component. These downstream dependencies are correctly documented. |
| MobileStateView gap | ISSUE | Component still does not exist in codebase despite being flagged in A, B, C, and D reviews (M-2). |
| `usePrefersReducedMotion` extraction | OK (LOW) | Not yet extracted. D.3 proposes duplication, OVERVIEW recommends extraction. Non-blocking. |
| `NodeId` type compatibility | OK | `NodeId = string` (verified). Category ID strings are compatible with `startMorph(nodeId: NodeId)`. |
| `useMorphChoreography` signature | OK | Hook takes `{ prefersReducedMotion: boolean }`, returns `{ phase, direction, targetId, isMorphing, startMorph, reverseMorph }`. D.3's usage matches. |
| `CoverageMap` prop names | OK | D.1 uses the same props as verified in `CoverageMap.tsx`: `categoryId`, `categoryName`, `markers`, `isLoading`, `onMarkerClick`, `selectedMarkerId`, `externalMapRef`. |

---

## Blocking Assessment

**Blocking for next phase planning?** No -- Phase E planning can proceed. All blocking issues have clear resolutions specified in the OVERVIEW.

**Required fixes before implementation:**

1. **H-1:** D.1 Section F -- change `alert={item}` to `item={item}` in `MobileAlertCard` usage
2. **H-2:** D.1 Section F -- wrap D.2's `onTap` callback: `onTap={(item) => onAlertTap(item.id)}`
3. **H-3:** D.2 -- expand `onShowOnMap` signature to `(alertId: string, coords: { lat: number; lng: number }, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void`. D.2's button handler calls `resolveAlertCentroid()` before invoking the prop.
4. **H-4:** D.3 D-3 integration code -- replace `onViewAlert` with `onAlertTap`, remove `onNavigateToMap`, add `onBack`, `currentSnap`, `selectedAlertId` props per OVERVIEW Section 9.4 mapping table
5. **H-5:** D.1 Section 3 dependency table -- update WS-D.2 row to show `item: CategoryIntelItem` and `onTap: (item: CategoryIntelItem) => void`

**Recommended fixes (non-blocking):**

6. **M-1:** D.1 must extract `MOBILE_ICON_MAP` to `src/components/mobile/icon-map.ts` (remove ambiguity, match D.2's import path)
7. **M-2:** Confirm `MobileStateView` is in WS-A.2 D-8 deliverables; ensure delivery before D.1 implementation
8. **M-3:** Add `useCoverageMapData` to D.2's input dependencies (or note that `MobileAlertDetail` calls it directly)
9. **M-4:** D.3 Section 3 WS-D.1 row -- change `onViewAlert` to `onAlertTap`
10. **M-5:** D.3 Section 3 WS-D.2 row -- add `basic` parameter to `onShowOnMap` signature
11. **L-2:** Extract `usePrefersReducedMotion` to `src/hooks/use-prefers-reduced-motion.ts` as a Phase D prerequisite
