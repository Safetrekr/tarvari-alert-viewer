# Phase 4 Review: Map

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-04
> **Documents Reviewed:** 4 (`ws-4.1-map-feature.md`, `combined-recommendations.md`, `PHASE-3-REVIEW.md`, `PHASE-3-OVERVIEW.md`)
> **Codebase Files Spot-Checked:** 12 (`district-view-overlay.tsx`, `district-view-content.tsx`, `detail-panel.tsx`, `district-content.tsx`, `package.json`, `next.config.ts`, `layout.tsx`, `query-provider.tsx`, `SpatialCanvas.tsx`, `constants.ts`, `globals.css`, `page.tsx`)

## Review Verdict: PASS WITH ISSUES

WS-4.1 is a thoroughly prepared SOW with 8 deliverable groups, 36 acceptance criteria, 8 design decisions with alternatives considered, 5 open questions with owners and recommendations, and 10 risk register entries. The codebase grounding is excellent -- all 6 verified line-number references match the actual source files exactly. The WebGL-in-CSS-transforms concern is handled correctly and verified: `DistrictViewOverlay` is rendered as a sibling of `SpatialViewport` at `page.tsx` line 326, completely outside the CSS `transform: scale()` chain on `SpatialCanvas`. The dynamic import strategy using `next/dynamic` with `ssr: false` is the correct approach for Next.js with browser-only WebGL libraries. The tile source decision (CARTO dark-matter) is appropriate for development and launch. Bundle size impact is well-addressed via on-demand loading during the morph animation window.

The primary concerns are: (1) dead code in the `MapMarkerLayer` component design where `handleClick` and the `onMarkerClick` prop are defined but never wired in the JSX; (2) the `getClusterExpansionZoom` callback-style API in the cluster expansion code, which may be outdated for MapLibre GL JS v5 (which uses a Promise-based API); (3) the ongoing 4th-consecutive-phase absence of test deliverables; and (4) no explicit tracking section for carried-forward issues from Phases 1-3. None of these are blocking for implementation, but the first two will cause confusion or errors during coding.

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-4.1 Map Feature | Exceptional. 8 deliverable groups (install, utils, popup, marker layer, map component, scene integration, CSS, verification), 36 ACs, 8 decisions, 5 OQs, 10 risks. Full code sketches for all new files. Integration path into CategoryDetailScene clearly specified. | Excellent. 6 line references verified against the actual codebase: `district-view-overlay.tsx` lines 86-89 (fixed/inset/zIndex), `package.json` (48 lines, all deps correct), `next.config.ts` (7 lines, transpilePackages), `district-view-content.tsx` SCENE_MAP at lines 26-33, `detail-panel.tsx` DistrictContent import at line 25 and render at line 149. DOM ancestry verified via `page.tsx` line 326. All accurate. | 2 MEDIUM (dead code in MapMarkerLayer, cluster API style), 3 LOW (attribution, popup tip, utility placement) + 2 recurring MEDIUM (no tests, no carried-forward tracking) | A- |

## Issues Found

### HIGH Severity

None new. Two pre-existing HIGH issues remain from prior phases:

**H-1 (Carried, 4th phase): OQ-07 `intel_sources.id` column ambiguity (Phase 1 Review H-1)**
WS-4.1 does not directly depend on `intel_sources` schema but depends transitively via `useCoverageMapData` (WS-1.3) which queries `intel_normalized` joined through `source_id`. Four phases of carry-forward on a blocking schema verification is a project management concern.

**H-2 (Carried): `CategoryMeta.description` field not confirmed in WS-1.2 (Phase 3 Overview Gap 1)**
WS-4.1 uses `categoryMeta.displayName` and `categoryName` from `getCategoryMeta()`. The `description` field gap from Phase 3 does not directly impact WS-4.1, but the broader WS-3.1 dependency chain remains affected.

### MEDIUM Severity

**M-1: `MapMarkerLayer` contains dead code -- `handleClick` and `onMarkerClick` prop never used**
Section 4.4.4 defines a `handleClick` callback inside `MapMarkerLayer` and the component accepts an `onMarkerClick` prop. However, the component's JSX returns `<Source>...<Layer/>...</Source>` with no click handler attached. In react-map-gl, click events are handled at the `<Map>` level via `onClick` + `interactiveLayerIds`, which is exactly what `CoverageMap.tsx` does in Section 4.5.4. The `MapMarkerLayer.onMarkerClick` prop is passed but never invoked within `MapMarkerLayer` because `Source`/`Layer` children cannot receive mouse events directly.

**Required action:** Remove `handleClick` and `onMarkerClick` from `MapMarkerLayer`, making it a pure render component for `<Source>` + `<Layer>` elements.

**M-2: `getClusterExpansionZoom` uses callback-style API that may be outdated for MapLibre GL JS v5**
Section 4.5.4 uses callback-style API. MapLibre GL JS v4+ transitioned to a Promise-based API. The SOW targets `maplibre-gl: ^5.1.0`. If v5 has dropped the callback overload, this code will fail at runtime.

**Required action:** Verify the `getClusterExpansionZoom` signature in `maplibre-gl` v5 API docs. If Promise-based, update to `const zoom = await source.getClusterExpansionZoom(clusterId)`.

**M-3: No test deliverables (recurring, 4th consecutive phase)**
WS-4.1 creates 4 new files with `map-utils.ts` containing 3 pure functions ideal for unit testing. No test file is listed as a deliverable.

**M-4: No explicit carried-forward issues section**
The SOW does not track resolution status of prior-phase blockers (OQ-07, `CategoryMeta.description`, MASTER-PLAN.md absence, test debt).

**M-5: react-map-gl v8 + MapLibre GL JS v5 + React 19 triple compatibility unverified**
The SOW specifies `react-map-gl: ^8.0.0` and `maplibre-gl: ^5.1.0` with React 19.2.4. Version pinning should be tighter or the compatibility matrix explicitly verified before implementation.

### LOW Severity

- **L-1:** `attributionControl: false` may not comply with CARTO terms of service. No attribution deliverable included.
- **L-2:** Popup tip CSS override only handles bottom-anchored popups. Top-anchored tip not covered.
- **L-3:** `formatRelativeTime` is a general-purpose utility placed in map-specific `map-utils.ts`. Limits reuse discoverability.
- **L-4:** MASTER-PLAN.md still does not exist (recurring, 4th phase).
- **L-5:** Incomplete `package.json` "before" snippet in Section 4.1.2 (shows 5 of 14 deps).

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | OK | Decision 5 (MapLibre GL JS in district view overlay) fully implemented. All 8 decisions trace to combined-recommendations constraints. |
| Dependencies on WS-1.3 and WS-3.1 are correct | OK | Input Dependencies correctly identifies hooks, types, and integration points. |
| WebGL-in-CSS-transforms mitigation is sound | VERIFIED | `DistrictViewOverlay` at `page.tsx` line 326 is sibling of `SpatialViewport` (lines 199-323). No CSS transform ancestor. |
| Dynamic import strategy correct for static export | OK | `next/dynamic` with `ssr: false` is standard Next.js pattern for browser-only libraries. |
| Acceptance criteria are measurable | OK | All 36 ACs have specific verification methods. |
| Open questions have owners and target phases | OK | 5 OQs all assigned with reasonable deferrals. |
| Risk register is comprehensive | OK | 10 risks covering WebGL, SSR, tiles, bundle, compatibility, bounds, keyboard, divergence, performance, CSS. |
| Phase 3 outputs consumed correctly | OK | Map placeholder from WS-3.1 Section 4.1.7 and overlay context correctly referenced. |
| File deliverables do not conflict with prior phases | OK | All 5 new files in previously non-existent paths. Only modification is CategoryDetailScene.tsx (WS-3.1) and layout.tsx (CSS import). |
| `package.json` versions in SOW match codebase | OK | Verified all dependency versions. |
| Phase 1-3 carried-forward issues acknowledged | ISSUE | M-4: No explicit tracking section. |

## Blocking Assessment

**Blocking for next phase?** N/A (final phase)

**Required fixes before implementation:**
1. M-1: Resolve `MapMarkerLayer` dead code. Remove `handleClick`/`onMarkerClick` from the component.
2. M-2: Verify `getClusterExpansionZoom` API signature against MapLibre GL JS v5 docs. Update if Promise-based.
3. H-1 (Carried): OQ-07 must be resolved before WS-1.3 implementation. Run schema introspection. Four phases of carry-forward is unacceptable.

**Recommended fixes (non-blocking):**
1. M-3: Add `map-utils.test.ts` as formal deliverable.
2. M-4: Add carried-forward issues section to the SOW.
3. M-5: Tighten version pinning (e.g., `react-map-gl: ^8.0.3`).
4. L-1: Add discrete attribution line or restore `attributionControl` with dark theme override.
5. L-2: Add CSS override for top-anchored popup tip.
6. L-3: Move `formatRelativeTime` to a shared utility module.
7. L-4: Create `MASTER-PLAN.md` before implementation begins.
