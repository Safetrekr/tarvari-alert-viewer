# Phase 2 Overview: Core UI

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** MASTER-PLAN.md (pending creation -- see Phase 1 Gap 6)
> **Date:** 2026-03-04
> **Workstreams:** WS-2.1 (Coverage Grid), WS-2.2 (Morph Adaptation)

---

## 1. Executive Summary

Phase 2 delivers the visual and interactive core of the TarvaRI Alert Viewer's new launch page. It replaces the tarva-launch 6-capsule circular ring with a CSS Grid of coverage category cards backed by live Supabase intel data, and rewires the morph drill-down animation to work with the grid layout instead of ring geometry.

The phase is split into two strictly sequential workstreams. **WS-2.1 (Coverage Grid)** creates four new components (`CoverageGrid`, `CategoryCard`, `CategoryIconGrid`, `CoverageOverviewStats`), a shared `CategoryGridItem` display type, CSS custom properties for category colors, and wires the launch page to pass live hook data instead of `MOCK_CAPSULE_DATA`. The semantic zoom system switches between the icon grid at Z0 and the full card grid at Z1+. The morph drill-down is intentionally left non-functional: clicking a card updates morph state but produces no visible panel or animation, because all positioning logic is still ring-specific.

**WS-2.2 (Morph Adaptation)** completes the drill-down. It rewires the morph orchestrator, choreography hook, detail panel, morph CSS, and variant definitions so that clicking a `CategoryCard` triggers a scale+fade animation (selected card scales to 1.2x, siblings fade to 0.3 opacity, detail panel slides in from the viewport right). It replaces the `?district=` URL parameter with `?category=`, removes all ring rotation and capsule center computation, and archives 9 ring/capsule-era component files (~1109 lines). The morph phase state machine itself is unchanged -- only the visual expression and positioning are adapted.

By the end of Phase 2, the user sees a live data-driven grid of up to 15 coverage categories, can zoom between the compact icon overview (Z0) and full card view (Z1+), click any card to trigger a smooth morph animation with a detail panel, and reverse the morph with Escape or click-outside. The URL reflects the selected category. The district view overlay will render blank for category IDs (expected -- WS-3.1 in Phase 3 provides the data-driven content). The ring and capsule components are archived. The codebase transitions fully from the 6-district capsule metaphor to the N-category grid metaphor.

**Scale:** 4 new component files, 1 new CSS file, 1 shared type addition, 6+ file rewrites/updates, 9 files archived. Approximately 18--26 hours of implementation effort across both workstreams.

## 2. Key Findings (grouped by theme)

### Grid Layout and Spatial Integration

- The grid container is sized 1500x400px centered at world origin (0, 0), fitting between the existing ambient panels (`SystemStatusPanel` at x:-1200 and `FeedPanel` at x:+880) with ~130px clearance on each side. Two rows of 8 columns at 160x180px cards with 16px gaps.
- Both the icon grid (Z0) and the full card grid (Z1+) share the same 1500x400px world-space footprint, ensuring the Z0-to-Z1 crossfade reads as icons expanding into cards in place. This mirrors how the original `ConstellationView` and `CapsuleRing` shared the 840x840 container.
- `CoverageOverviewStats` (3 KPI cards) sits above the grid in world-space and is zoom-gated to Z1+ via `ZoomGate`. It uses `@tarva/ui KpiCard` with glass material overrides to match the spatial aesthetic.
- Category cards are built on `@tarva/ui Card` with the same glass effect (`backdrop-blur-[12px]`, semi-transparent background) used by the existing `DistrictCapsule`. A 3px left border accent in the category color provides quick visual identification.

### Morph System Adaptation

- The morph phase state machine (`idle -> expanding -> settled -> entering-district -> district`) is completely unchanged. Only the visual expression changes: ring rotation becomes scale+fade, capsule center computation becomes fixed-right panel docking.
- Selected card variant changes from `{ opacity: 0.25, scale: 1 }` to `{ opacity: 1, scale: 1.2 }` -- the emphasis shifts from dimming the selected item to scaling it up as a visual anchor. Siblings change from `{ opacity: 0.5 }` to `{ opacity: 0.3 }` for stronger dimming.
- Variant transition durations align to `MORPH_TIMING.expanding` (400ms), up from the previous 350ms.
- The detail panel always docks to the right side of the viewport (`right: 40px`, vertically centered) -- no left/right decision needed because the grid is centered and all cards are left-of-center relative to viewport midpoint. This eliminates `computeRingRotation`, `PanelSide` branching, `dockSide` prop, and ring shift computation.
- Connector lines are removed entirely. The ring layout needed them to disambiguate which of 6 rotating capsules connected to the offset panel. In the grid layout, the scaled+highlighted card is self-evident.

### Data Integration

- `MOCK_CAPSULE_DATA` is fully replaced by `useCoverageMetrics()` hook output from WS-1.3. The `buildGridItems()` function joins `KNOWN_CATEGORIES` metadata with live `CoverageByCategory` metrics, producing a `CategoryGridItem[]` for rendering. Only categories with at least one source appear (Decision 4 from combined-recommendations).
- The URL parameter transitions from `?district={id}` to `?category={id}`. The choreography hook's `syncUrlDistrict` becomes `syncUrlCategory`. The coverage store's `syncCoverageFromUrl` (WS-1.3) reads the same `?category=` param on page mount.
- The legacy `useInitialDistrictFromUrl` hook (reads `?district=`) is left in place by WS-2.1 as a no-op. WS-2.2's URL param rename makes it fully obsolete. It should be removed or disabled during WS-2.2 implementation. (Resolves Phase 1 OQ-09.)

### Component Archival

- 9 ring/capsule-era files (~1109 lines) are archived to `src/components/districts/_archived/`: `capsule-ring.tsx`, `constellation-view.tsx`, `district-capsule.tsx`, `capsule-telemetry.tsx`, `capsule-sparkline.tsx`, `capsule-health-bar.tsx`, `district-beacon.tsx`, `global-metrics.tsx`, `connector-lines.tsx`.
- Archival follows the same pattern as WS-1.1's page archive -- files are moved (not deleted) to preserve reference code during transition.

### Accessibility

- `CategoryCard` includes `role="button"`, `tabIndex={0}`, Enter/Space key handlers, and an `aria-label` describing category name and source count. This matches the accessibility pattern from the original `DistrictCapsule`.
- `focus-visible` outline uses `--color-ember-bright` for keyboard navigation visibility.
- Reduced motion support is maintained: `@media (prefers-reduced-motion: reduce)` disables all morph transitions, and `MORPH_TIMING_REDUCED` zeroes all phase durations.

## 3. Cross-Workstream Conflicts

### Conflict 1: Morph Orchestrator Double-Touch

**WS-2.1** modifies `morph-orchestrator.tsx` (Section 4.8) to replace `CapsuleRing`/`ConstellationView` renders with `CoverageGrid`/`CategoryIconGrid`, change the props interface, and update callback type signatures. **WS-2.2** then rewrites the same file (Section 4.1) more extensively: removing ring-specific `useMemo` computations, updating panel render props, changing the `handleBeaconSelect` to `handleIconSelect`, and removing connector lines.

**WS-2.2 Risk R-5** acknowledges this: "WS-2.1 may have already removed some ring-specific code, meaning the line numbers and code blocks referenced in this SOW are stale."

**Resolution:** Strict sequential execution (WS-2.1 completes fully before WS-2.2 begins) is mandatory. WS-2.2's implementer must use semantic identifiers (function names, variable names, patterns) rather than line number references. The WS-2.1 gate criterion must be verified before WS-2.2 starts. Both SOWs describe their changes by intent, which remains valid regardless of line shifts.

### Conflict 2: Implicit Contract on CategoryCard Attributes

**WS-2.2** depends on `CategoryCard` (created by WS-2.1) having two specific implementation details that are not formalized in WS-2.1's props interface:

1. A `data-category-card` HTML attribute on the root element (consumed by morph CSS selectors in WS-2.2 Section 4.5).
2. The `capsuleStateVariants` from `use-morph-variants.ts` wired as the `variants` prop with `resolveMorphVariant()` driving the `animate` value (consumed by variant changes in WS-2.2 Section 4.7).

WS-2.1 Section 4.3 describes "the same variant pattern as `DistrictCapsule`" and references the variant hook, but does not list `data-category-card` as a required attribute in the props interface or acceptance criteria.

**Resolution:** WS-2.1's `CategoryCard` implementation must include both: (a) `data-category-card` attribute on the root `motion.div` (add to WS-2.1 AC or implementation checklist), and (b) `capsuleStateVariants` / `resolveMorphVariant()` wiring (already implied by Section 4.3.3 but should be verified at the WS-2.1 gate). WS-2.2 Risks R-1 and R-2 provide mitigations if these are missing, but prevention is preferable.

### Conflict 3: Variant Export Rename Timing

**WS-2.2 OQ-4** proposes renaming `capsuleStateVariants` to `cardStateVariants`. If this rename happens in WS-2.2, it requires updating the import in `CategoryCard.tsx` (created in WS-2.1). This is a cross-workstream modification: WS-2.2 would change a file delivered by WS-2.1.

**Resolution:** This is a low-risk cosmetic change (2-line diff). Two options: (a) rename in WS-2.2 and accept the cross-workstream file touch, or (b) defer the rename to a cleanup pass. Recommendation: rename in WS-2.2 since it is the workstream that updates `use-morph-variants.ts` and the rename aligns with the broader capsule-to-card terminology shift happening in that workstream.

### Conflict 4: URL Parameter Dual-Write Race

**WS-2.2 Risk R-6** identifies that `use-morph-choreography.ts` writes `?category=` via `history.replaceState` (during morph settle), while `coverage.store.ts` (WS-1.3) reads `?category=` via `syncCoverageFromUrl` (on page mount). Both operate on the same URL parameter.

**Resolution:** No runtime conflict exists during normal operation because the coverage store reads on mount (once) and the choreography hook writes during morph (later). However, if the user loads a URL with `?category=seismic`, both paths activate: the store reads it and sets `selectedCategory`, and `useInitialDistrictFromUrl` (if still active) ignores it (different param name). The potential issue arises if a morph-settle URL write triggers a React re-render that re-runs the coverage store's `syncCoverageFromUrl`. Mitigation: ensure `syncCoverageFromUrl` runs in a `useEffect` with an empty dependency array so it executes only once on mount, not on URL changes.

## 4. Architecture Decisions (consolidated table)

| ID | Decision | Source SOW | Rationale |
|----|----------|-----------|-----------|
| AD-13 | Grid container sized 1500x400px at world origin (not 840x840 ring container) | WS-2.1 D-1 | Rectangular grid fits 8-column layout; fits between ambient panels with ~130px clearance per side; two rows at 180px + 16px gap = 376px within 400px |
| AD-14 | Use `@tarva/ui Card` as base with glass effect overlay, not custom card | WS-2.1 D-2 | Reuses shared component library; Card provides data-slot attributes, semantic structure, consistent padding/border-radius; glass effect applied via className override |
| AD-15 | Static icon lookup map (`ICON_MAP`) for Lucide icons, not dynamic imports | WS-2.1 D-3 | Dynamic icon loading not supported at build time; static map of 15 imports is explicit, tree-shakeable, and type-safe; stable category list makes maintenance trivial |
| AD-16 | Morph drill-down non-functional in WS-2.1 (panel does not appear for grid categories) | WS-2.1 D-4 | Ring-specific geometry does not apply to grid categories; adapting morph is WS-2.2's explicit scope; WS-2.1 gate criterion only requires grid rendering and Z0/Z1+ switching |
| AD-17 | `CategoryIconGrid` uses same 1500x400px world-space footprint as `CoverageGrid` | WS-2.1 D-5 | Matching footprints ensure Z0-to-Z1 crossfade reads as icons expanding into cards in place, preserving spatial continuity |
| AD-18 | `CoverageOverviewStats` in world-space above grid, not fixed HUD overlay | WS-2.1 D-6 | Stats should zoom with the spatial canvas; fixed HUD breaks spatial metaphor; ZoomGate hides at Z0 where text is unreadable |
| AD-19 | Category CSS custom properties in new `coverage.css` file, not root CSS or Tailwind config | WS-2.1 D-7 | Follows existing feature-scoped CSS pattern (atrium.css, morph.css, etc.); keeps coverage tokens grouped; `:root`-scoped for global availability |
| AD-20 | Detail panel always docks right (`right: 40px`, vertically centered), no left/right decision | WS-2.2 D-1 | Grid is centered; all cards are left-of-center relative to viewport; eliminates `computeRingRotation`, `PanelSide` branching, `dockSide` prop |
| AD-21 | Remove connector lines entirely rather than simplifying for grid | WS-2.2 D-2 | Selected card scales 1.2x + siblings fade 0.3 makes selection unambiguous without drawn connector; cross-coordinate-system math (world-space card to viewport-space panel) is fragile; Decision 3 does not mention connectors |
| AD-22 | Archive connector-lines.tsx with the other 8 ring-era files (9 total), not delete | WS-2.2 D-3 | Preserves code for reference; consistent with WS-1.1 archive pattern |
| AD-23 | Selected card variant: `scale: 1.2, opacity: 1` (scale up, not dim down) | WS-2.2 D-4 | Decision 3 states "scales to 1.2x"; scaled card provides visual anchor for the panel; previous dim-to-0.25 no longer appropriate for grid |
| AD-24 | Variant transition durations 0.4s (up from 0.35s) to match `MORPH_TIMING.expanding` | WS-2.2 D-5 | Aligns visual transition completion with phase timer boundary; 50ms mismatch eliminated |
| AD-25 | Rename `syncUrlDistrict` to `syncUrlCategory`, URL param `district` to `category` | WS-2.2 D-6 | Clean terminology break; function is private (no external API impact); Decision 7 from combined-recommendations specifies `?category={id}` |

## 5. Cross-Workstream Dependencies

### Internal Phase 2 Dependencies

```
WS-2.1 (Coverage Grid)  ---- depends on WS-1.2, WS-1.3 ----> blocks WS-2.2

WS-2.2 (Morph Adaptation) ---- depends on WS-1.2, WS-2.1 ----> blocks WS-3.1
```

- **WS-2.1 is the entry point for Phase 2.** It cannot start until WS-1.2 (types) and WS-1.3 (data layer) are gated. It produces the grid components that WS-2.2 then wires into the morph system.
- **WS-2.2 is strictly sequential after WS-2.1.** It modifies the same morph-orchestrator file that WS-2.1 touches and depends on specific implementation details of `CategoryCard`. No parallel execution is possible.

### Phase 1 Inputs Consumed

| Phase 1 Output | Consumed By | What It Provides |
|----------------|-------------|------------------|
| `NodeId` type (WS-1.2) | WS-2.1 (grid props), WS-2.2 (morph callbacks) | Generic string ID for category identifiers in all component interfaces |
| `coverage.ts` module (WS-1.2) | WS-2.1 (card rendering) | `getCategoryMeta()`, `getCategoryColor()`, `getCategoryIcon()`, `KNOWN_CATEGORIES` |
| `useCoverageMetrics` hook (WS-1.3) | WS-2.1 (grid data source) | Live source counts and category breakdown for `buildGridItems()` |
| `coverage.store.ts` (WS-1.3) | WS-2.1 (selection state) | `selectedCategory`, `setSelectedCategory()`, `syncCoverageFromUrl()` |
| `coverage-utils.ts` (WS-1.3) | WS-2.1 (type imports) | `CoverageByCategory`, `CoverageMetrics` types |
| `page.archived.tsx` (WS-1.1) | WS-2.1, WS-2.2 (reference) | Original composition patterns for comparison during rewrite |

### Phase 2 Outputs for Phase 3+

| Phase 2 Output | Consumed By | What It Provides |
|----------------|-------------|------------------|
| `CoverageGrid` + `CategoryCard` (WS-2.1) | WS-3.1 (district view), WS-3.2 (chrome) | Grid components that render the launch page; WS-3.1 provides content when drilling into a category |
| Functional morph drill-down (WS-2.2) | WS-3.1 (district view) | WS-3.1 needs the morph to work to test `CategoryDetailScene` inside the district view overlay |
| `?category=` URL sync (WS-2.2) | WS-3.1, WS-4.1 | URL parameter drives data filtering in the detail scene and map |
| Archived ring-era files (WS-2.2) | WS-3.1, WS-3.2 | Files archived; downstream workstreams do not need to account for ring components |
| Grid morph CSS (`morph.css` updates, WS-2.2) | WS-3.1, WS-3.2 | CSS selectors target `[data-category-card]`; downstream CSS additions must use this convention |

### Critical Path

The critical path through the overall project is: **WS-1.2 -> WS-1.3 -> WS-2.1 -> WS-2.2 -> WS-3.1**. Phase 2 owns the middle two links. Any delay in WS-2.1 directly delays WS-2.2, which delays Phase 3's district view work. There is no parallel execution opportunity within Phase 2 itself.

## 6. Consolidated Open Questions (flag blocking)

| ID | Question | Source SOW | Blocking? | Assigned To | Target Phase |
|----|----------|-----------|-----------|-------------|--------------|
| OQ-10 | Should `CategoryCard` show geographic regions (first 3 + "+N more") or defer to district view? Card is 160x180px, tight for additional text. | WS-2.1 OQ-1 | No | react-developer | Phase 2 (WS-2.1). Rec: defer to district view. |
| OQ-11 | Should `CoverageOverviewStats` position be in a shared spatial-layout module or inline in `page.tsx`? | WS-2.1 OQ-2 | No | react-developer | Phase 2 (WS-2.1). Rec: keep inline, consistent with existing pattern. |
| OQ-12 | Should `CategoryIconGrid` aggregate metrics bar reuse/adapt `GlobalMetrics` or create a new component? | WS-2.1 OQ-3 | No | react-developer | Phase 2 (WS-2.1). Rec: create new. `GlobalMetrics` reads from legacy `districtsStore`. |
| OQ-13 | When grid has < 8 categories, should cards stretch or left-align with empty cells? | WS-2.1 OQ-4 | No | react-developer | Phase 2 (WS-2.1). Rec: left-align (default CSS Grid behavior). |
| OQ-14 | Should `CategoryCard` include sparkline for source count over time? Historical data not available from `intel_sources`. | WS-2.1 OQ-5 | No | Planning Agent | Phase 3. Defer until historical data is available. |
| OQ-15 | Should `CategoryGridItem` include a `gridIndex` for position tracking, or rely on array index? | WS-2.1 OQ-6 | No | react-developer | Phase 2 (WS-2.1). Rec: rely on array index. CSS Grid positions by document order. |
| OQ-16 | Should `detail-panel.tsx` resolve category display name now (via `getCategoryMeta`) or defer to WS-3.1? | WS-2.2 OQ-1 | No | react-developer | Phase 2 (WS-2.2). Rec: resolve now (one-line import, avoids shipping raw IDs in the header). |
| OQ-17 | Should the district view overlay show a stub for category IDs, or remain blank until WS-3.1? | WS-2.2 OQ-2 | No | react-developer | Phase 2 (WS-2.2). Rec: leave blank. Morph gate criterion is the animation cycle. |
| OQ-18 | Should the `DetailPanel` portal target remain `document.body` or move to a dedicated portal container? | WS-2.2 OQ-3 | No | react-developer | Phase 2 (WS-2.2). Rec: keep `document.body`. Works correctly, matches existing pattern. |
| OQ-19 | Should `capsuleStateVariants` be renamed to `cardStateVariants`? Requires updating CategoryCard import. | WS-2.2 OQ-4 | No | react-developer | Phase 2 (WS-2.2). Rec: rename (2-line change, aligns with capsule-to-card terminology shift). |
| OQ-20 | Is 350ms Z0-to-Z1 flyTo delay sufficient to cover both camera zoom and AnimatePresence crossfade (300ms)? | WS-2.2 OQ-5 | No | react-developer | Phase 2 (WS-2.2). Rec: yes, 350ms covers both. Exit animation starts immediately on zoom level change. |
| OQ-09 | When should `useInitialDistrictFromUrl` be deprecated? (Carried from Phase 1) | Phase 1 Conflict 2 | No | react-developer | Phase 2 (WS-2.2). **Resolution: WS-2.2 should remove or disable this hook when it renames the URL param.** |
| OQ-06 | Should `intel_normalized` queries include a default date range filter (e.g., last 7 days)? (Carried from Phase 1) | WS-1.3 | No | Planning Agent | Phase 2 (WS-2.1). Rec: defer to WS-3.1 when the detail scene design is concrete. |
| OQ-03 | Should `DistrictMeta.ringIndex` be widened to `number`? (Carried from Phase 1) | WS-1.2 | No | react-developer | Phase 2. **Resolution: moot. WS-2.2 archives the ring-era files. `ringIndex` is no longer referenced in active code.** |

## 7. Phase Exit Criteria

| Criterion | Met? | Evidence |
|-----------|------|----------|
| `CoverageGrid` renders a CSS Grid with `repeat(8, 1fr)` columns and 16px gaps, sized 1500x400px centered at world origin | Pending | Browser DevTools inspection at Z1 zoom |
| `CategoryCard` renders icon, name, source count, active indicator with glass material for each active category | Pending | Visual inspection at Z1 zoom |
| `CategoryCard` supports keyboard interaction (`role="button"`, `tabIndex={0}`, Enter/Space, `aria-label`) | Pending | Manual keyboard testing; code review |
| `CategoryIconGrid` renders colored dots with 3-letter codes at Z0 zoom | Pending | Zoom to Z0 (below 0.27) and verify |
| Z0/Z1+ crossfade works via `AnimatePresence mode="wait"` (300ms transition) | Pending | Zoom in/out through Z0-Z1 threshold |
| `CoverageOverviewStats` renders 3 KPI cards above the grid at Z1+, hidden at Z0 | Pending | Visual inspection at Z0 and Z1 |
| Grid renders with live Supabase data (source counts match database) | Pending | Dev server with valid Supabase credentials |
| Grid renders empty state gracefully when no intel sources exist (no console errors) | Pending | Empty Supabase instance test |
| Only categories with >= 1 source appear in the grid | Pending | Verify against database |
| Category colors resolve from CSS custom properties (`var(--category-seismic, ...)`) | Pending | DevTools computed styles inspection |
| `MOCK_CAPSULE_DATA` is no longer imported or referenced in `page.tsx` | Pending | grep verification |
| Click a `CategoryCard` triggers forward morph: `idle` -> `expanding` -> `settled` with 400ms timing | Pending | React DevTools morph state inspection |
| Selected card scales to 1.2x, siblings fade to opacity 0.3 during morph | Pending | Visual + DevTools computed transform/opacity |
| Detail panel slides in from the right (`right: 40px`, vertically centered) | Pending | Visual inspection |
| Press Escape reverses morph (card to 1.0 scale, siblings to 1.0 opacity, panel exits) | Pending | Manual keyboard test |
| Click-outside backdrop triggers reverse morph | Pending | Manual click test |
| URL updates to `?category={id}` on morph settle, clears on reverse | Pending | Browser URL bar inspection |
| `morph-panels-scatter` CSS still pushes ambient panels outward during morph | Pending | Visual inspection of ambient panels |
| Reduced motion: all morph animations instant (0ms per `MORPH_TIMING_REDUCED`) | Pending | Enable OS "Reduce motion"; verify instant state changes |
| All 9 archived files exist in `src/components/districts/_archived/` | Pending | `ls _archived/` lists all 9 files |
| No active source file imports from any archived file | Pending | grep verification per WS-2.2 Section 4.8.1 |
| `morph-types.ts` no longer exports ring-geometry functions | Pending | grep for removed identifiers |
| `morph.css` uses `[data-category-card]` selectors, not `.district-capsule` | Pending | Code review |
| `pnpm typecheck` passes with zero errors | Pending | CLI output |
| No console errors during a full forward+reverse morph cycle | Pending | Browser console inspection |
| Existing ambient effects (dot grid, halo, particles, scan lines) render normally | Pending | Visual smoke test across Z0-Z2 zoom levels |

## 8. Inputs Required by Next Phase

Phase 3 (Detail + Chrome: WS-3.1 District View Adaptation, WS-3.2 Chrome & Panels) requires the following from Phase 2:

### From WS-2.1 (Coverage Grid)
- **`CoverageGrid` and `CategoryCard` components** -- WS-3.1 tests its `CategoryDetailScene` by triggering the morph from a category card.
- **`CategoryGridItem` type** -- WS-3.1 may extend this type or consume it for the detail scene header.
- **`coverage.css` custom properties** -- WS-3.2 uses category colors in chrome panel labels.
- **`CoverageOverviewStats`** -- WS-3.2 may adjust KPI card labels or add new metrics.

### From WS-2.2 (Morph Adaptation)
- **Functional morph drill-down** -- WS-3.1 cannot test `CategoryDetailScene` without a working morph that transitions through `entering-district` to `district` phase.
- **`?category=` URL parameter sync** -- WS-3.1 reads the selected category from the URL to fetch filtered data for the detail scene.
- **Archived ring-era files** -- WS-3.1 and WS-3.2 do not need to account for `CapsuleRing`, `ConstellationView`, or related ring components.
- **Updated `morph-types.ts`** -- WS-3.1 consumes `DETAIL_PANEL_DIMENSIONS`, `GRID_PANEL_POSITION`, and `MorphPhase` type. Ring-geometry exports are removed.
- **Updated `morph.css`** -- WS-3.2 extends morph CSS for chrome elements; it must use `[data-category-card]` convention.

### Unresolved Items Phase 3 Must Address
- **District view overlay content:** The overlay renders blank for category IDs after Phase 2 (WS-2.2 OQ-2). WS-3.1 must create `CategoryDetailScene` to populate it.
- **Detail panel display name:** If WS-2.2 defers category display name resolution (OQ-16), WS-3.1 must resolve it when replacing panel content.
- **`intel_sources.id` column ambiguity:** Phase 1 OQ-07 (blocking for Phase 3) -- verify the actual `intel_sources` primary key against the live Supabase schema before WS-3.1 starts.
- **Default date range filter:** Phase 1 OQ-06 / Phase 2 OQ-06 -- decide whether `intel_normalized` queries in the detail scene should filter by date range.
- **`useInitialDistrictFromUrl` removal:** If WS-2.2 did not fully remove it (OQ-09 recommendation: remove in WS-2.2), WS-3.1 or WS-3.2 must clean it up.

## 9. Gaps and Recommendations

### Gap 1: No Test Deliverables for New Components (SPO + CTA)

Neither WS-2.1 nor WS-2.2 includes test files as formal deliverables. Four new components (`CoverageGrid`, `CategoryCard`, `CategoryIconGrid`, `CoverageOverviewStats`) have no unit test specs, and the morph adaptation (a high-risk rewrite) has no integration test.

**Recommendation:** Add the following as formal deliverables or verification steps:
- `src/components/coverage/__tests__/CoverageGrid.test.tsx` -- Verify grid renders correct number of cards, respects the >= 1 source filter, handles empty state.
- `src/components/coverage/__tests__/CategoryCard.test.tsx` -- Verify keyboard interaction, aria-label content, variant resolution.
- A manual morph cycle test script (or Playwright test) that exercises: card click -> morph forward -> Escape -> morph reverse -> URL param check.

This extends Phase 1 Gap 1 (no test deliverables for utilities). The pattern of skipping test specs risks compounding as the project grows.

### Gap 2: Implicit Contract Between WS-2.1 and WS-2.2 (CTA)

WS-2.2 depends on `CategoryCard` implementation details (`data-category-card` attribute, `capsuleStateVariants` wiring) that are described narratively in WS-2.1 but not codified in props interfaces or acceptance criteria.

**Recommendation:** Add two explicit acceptance criteria to WS-2.1:
- AC-20: `CategoryCard` root element includes `data-category-card` attribute.
- AC-21: `CategoryCard` consumes `capsuleStateVariants` from `use-morph-variants.ts` and drives `animate` from `resolveMorphVariant()`.

This converts the implicit contract (identified in Conflict 2) into a verifiable gate condition.

### Gap 3: Empty State UX Not Formally Specified (SPO)

WS-2.1 Risk R-4 recommends an empty state message for `CoverageGrid` when `items.length === 0`, but this is not listed as a deliverable or acceptance criterion.

**Recommendation:** Add an explicit acceptance criterion to WS-2.1: "When `items` array is empty, `CoverageGrid` renders a centered message ('No coverage data available') with a muted icon, consistent with PAGE-LAYOUT.md empty state pattern." This prevents a blank grid that could be mistaken for a loading failure.

### Gap 4: No Visual Regression Baseline (STW + PMO)

Phase 2 makes the first visible changes to the launch page. There is no visual regression baseline captured from Phase 1 (the archived page is a code file, not a visual snapshot).

**Recommendation:** Before WS-2.1 modifies `page.tsx`, capture reference screenshots at Z0, Z1 (default), and Z2 zoom levels using the existing dev server. Store in `docs/plans/new-launch-page/visual-baselines/phase-1/`. This provides a before/after comparison surface for Phase 2 review.

### Gap 5: MASTER-PLAN.md Still Does Not Exist (PMO)

Phase 1 Gap 6 flagged the absence of a formal master plan document. The combined-recommendations document continues to serve as the de facto plan, but it lacks versioning, status tracking, and formal phase linkage.

**Recommendation:** Create `docs/plans/new-launch-page/MASTER-PLAN.md` before Phase 2 implementation begins. It should formalize the 4-phase structure, link to each phase overview, and provide a single status dashboard. This becomes increasingly important as more phases reference a parent plan that does not exist.

### Gap 6: `useInitialDistrictFromUrl` Deprecation Path Unclear (CTA)

Phase 1 Conflict 2 identified that both `?district=` and `?category=` URL schemes coexist after Phase 1. WS-2.1 leaves the legacy hook in place. WS-2.2 renames the morph URL param to `?category=` but does not explicitly state whether it removes `useInitialDistrictFromUrl` from `page.tsx`.

**Recommendation:** WS-2.2 should include as a sub-deliverable: "Remove or comment out `useInitialDistrictFromUrl` call from `page.tsx` and its import. Add a comment noting it was replaced by `syncCoverageFromUrl` from `coverage.store.ts`." This resolves Phase 1 OQ-09 definitively.

### Gap 7: Phase 1 OQ-04 Resolution Confirmation (STW)

Phase 1 Overview deferred CSS custom properties for category colors to WS-2.1 (OQ-04). WS-2.1 Deliverable 4.6 addresses this by creating `src/styles/coverage.css` with all 15 `--category-*` tokens. This resolves the open question, but the resolution is not explicitly cross-referenced.

**Recommendation:** Mark Phase 1 OQ-04 as resolved in the Phase 1 Overview or in a central OQ tracking table. The resolution is: "WS-2.1 Section 4.6 creates `coverage.css` with all 15 CSS custom properties."

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream | Estimated Effort | Complexity | Agent | Notes |
|------------|-----------------|------------|-------|-------|
| WS-2.1 Coverage Grid | 8--12 hours | HIGH | react-developer | 4 new component files (detailed specs reduce ambiguity), 1 CSS file, 1 type addition, 2 major file modifications (page.tsx and morph-orchestrator.tsx). Main effort is CategoryCard (visual fidelity + accessibility) and the page.tsx wiring (replacing mock data with live hooks). Icon map creation and CSS custom properties are mechanical. Risk: @tarva/ui Card glass effect integration may require iteration. |
| WS-2.2 Morph Adaptation | 10--14 hours | HIGH | react-developer | 6 file rewrites (morph-orchestrator, choreography hook, detail panel, morph CSS, morph-types, morph-variants), 9 file archival + import verification. The morph-orchestrator rewrite is the highest-risk item: removing ring geometry while preserving the panel and backdrop behavior requires careful understanding of the state machine. Connector line removal and file archival are low-effort. Morph CSS selector updates are mechanical but must be tested across all morph phases. |
| **Phase 2 Total** | **18--26 hours** | | | |

### Resource Loading

Both workstreams are assigned to the `react-developer` agent and are strictly sequential. No parallelization is possible. The effective Phase 2 duration is the sum of both workstreams.

### Parallel Execution Opportunities

| Opportunity | Feasible? | Risk |
|-------------|-----------|------|
| WS-2.1 + WS-2.2 in parallel | **No** | WS-2.2 depends on WS-2.1 output (grid components, data attributes, variant wiring). Both modify `morph-orchestrator.tsx`. |
| WS-2.1 + WS-3.2 (Chrome) in parallel | **Conditionally** | WS-3.2 depends only on WS-1.2 (types). It could start once Phase 1 is complete, in parallel with WS-2.1. Risk: WS-3.2 modifies chrome panels that WS-2.1 references for spatial positioning. Low conflict if WS-3.2 only changes labels, not positions. |
| WS-2.2 + WS-3.2 (Chrome) in parallel | **Yes** | WS-3.2 does not depend on WS-2.2. Different file sets (chrome panels vs morph system). |

### Recommended Execution Order

```
Prerequisites:
  WS-1.2 (types) and WS-1.3 (data layer) -- must be gated before Phase 2 starts.

Day 1:
  [1] WS-2.1 Coverage Grid .............. 8-12h  (react-developer)
      Gate: grid renders with live data, Z0/Z1+ zoom switch works,
            pnpm typecheck passes, CategoryCard has data-category-card
            attribute and variant wiring

Day 2 (or Day 1 afternoon if WS-2.1 completes early):
  [2] WS-2.2 Morph Adaptation ........... 10-14h (react-developer)
      Gate: click card -> morph -> panel -> Escape reverses,
            URL syncs with ?category=, 9 files archived,
            pnpm typecheck passes, no console errors

Day 2 (final hour):
  [3] Phase 2 Exit Verification ......... 1h     (any agent)
      Full morph cycle test at Z0/Z1/Z2 zoom levels
      Ambient effects visual smoke test
      Reduced motion verification
      URL parameter round-trip test
```

### Bottlenecks

1. **Single-agent serialization:** Both workstreams are on the `react-developer` agent and cannot be parallelized. This is the primary schedule constraint for Phase 2.
2. **WS-2.1 gate fidelity:** If WS-2.1 ships `CategoryCard` without the `data-category-card` attribute or variant wiring (Gap 2), WS-2.2 will spend time diagnosing and patching. Mitigation: add explicit ACs to WS-2.1 (Gap 2 recommendation).
3. **Morph orchestrator complexity:** The rewrite in WS-2.2 removes ~60 lines of ring geometry and replaces with ~15 lines of grid-aware logic, but the surrounding state machine, portal rendering, and backdrop interactions are delicate. Misunderstanding a phase guard could break the morph sequence. Mitigation: the morph phase state machine is explicitly unchanged; only positioning and visual expression change.
4. **Cross-coordinate-system testing:** The detail panel (viewport-space, fixed position) must appear correctly alongside the grid (world-space, CSS-transformed). Testing this at various zoom levels (Z1 at 0.5, Z2 at 0.8-1.5) is critical but manual. Mitigation: document specific zoom levels to test in the exit verification step.

### Schedule Risk Assessment

- **Best case:** 18 hours across 2 days. WS-2.1 completes in one session; WS-2.2 in the next.
- **Expected case:** 22 hours across 2.5 days. Glass effect iteration on CategoryCard adds ~2 hours to WS-2.1; morph-orchestrator rewrite requires careful testing of all phase transitions.
- **Worst case:** 30 hours across 4 days. `@tarva/ui Card` styling conflicts require significant workaround (WS-2.1 R-2). Morph state machine has undocumented edge cases that surface during ring geometry removal (WS-2.2 R-5). File archival breaks unexpected imports in Storybook or test files (WS-2.2 R-4).
- **Overall Phase 2 schedule risk:** MEDIUM. The workstreams are well-specified with detailed code sketches, but the morph system adaptation is inherently high-risk due to the interconnected nature of the phase machine, CSS selectors, variant animations, and portal rendering. The strict sequential dependency means any delay in WS-2.1 directly extends the phase.

### Comparison to Phase 1

Phase 2 is approximately 1.5--2x the effort of Phase 1 (18--26h vs 11--15h) and carries higher complexity due to visible UI changes and the morph system rewrite. Phase 1 was "invisible to end users" with a binary `pnpm typecheck` gate; Phase 2 requires visual and interactive verification across zoom levels and morph phases. The risk profile shifts from "type cascade" (Phase 1) to "animation fidelity and spatial positioning" (Phase 2).
