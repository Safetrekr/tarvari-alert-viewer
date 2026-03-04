# Phase 3 Overview: Detail + Chrome

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** MASTER-PLAN.md (pending creation -- see Phase 1 Gap 6)
> **Date:** 2026-03-04
> **Workstreams:** WS-3.1 (District View Adaptation), WS-3.2 (Chrome & Panels)

---

## 1. Executive Summary

Phase 3 delivers the data-driven detail experience and identity refresh for the TarvaRI Alert Viewer. It replaces all remaining hard-coded district-era content with category-aware, live-data-driven components across two independent workstreams that can execute in parallel.

**WS-3.1 (District View Adaptation)** is the higher-risk workstream. It creates `CategoryDetailScene`, a single generic scene component (implementing Decision 6) that renders four data sections -- filtered alert list, severity breakdown, source health table, and a map placeholder -- all populated by the `useCoverageMetrics` and `useCoverageMapData` hooks from WS-1.3. It rewires the four district-view chrome components (`district-view-content.tsx`, `district-view-overlay.tsx`, `district-view-dock.tsx`, `district-view-header.tsx`) to resolve metadata dynamically from `getCategoryMeta()` instead of the 6-entry `DISTRICTS` array. It fixes the Phase 2 Review H-1 issue by replacing the broken `DistrictContent` render in `detail-panel.tsx` with a category-aware content preview. Six legacy scene files are archived.

**WS-3.2 (Chrome & Panels)** is the lower-risk workstream. It updates viewport-fixed chrome elements (top telemetry bar, bottom status strip) and world-space ambient panels (Minimap, SystemStatusPanel, FeedPanel, SignalPulseMonitor, ActivityTicker) to reflect the TarvaRI Coverage Monitor identity. Labels change from "Tarva Launch" to "TarvaRI", district-specific health labels become intel-pipeline labels, the Minimap transitions from 6 ring-positioned dots to up to 15 grid-positioned category dots, all four ambient panels are pushed outward to clear the wider 1500x400px coverage grid from WS-2.1, and the `APP_NAME`/`APP_DESCRIPTION` constants are updated.

The two workstreams touch entirely disjoint file sets, enabling true parallel execution. WS-3.1 modifies district-view components and the detail panel; WS-3.2 modifies ambient panels and viewport HUD elements. The only shared dependency is `src/lib/interfaces/coverage.ts` from WS-1.2, which both consume read-only.

By the end of Phase 3, the user can click any coverage category card, morph into a data-driven detail view showing live alerts, severity breakdown, source health, and a map placeholder, all with correct category-specific colors and labels. The chrome elements display TarvaRI branding and intel-pipeline status. The Minimap reflects the grid layout. All ambient panels are correctly positioned around the wider grid. The codebase is fully purged of hard-coded 6-district data structures in the district-view and chrome layers.

**Scale:** 1 new component file, 10 file rewrites/updates, 6 files archived, 1 file (district-content.tsx) recommended for archival. Approximately 14--20 hours of implementation effort; 10--14 hours effective duration due to parallel execution.

## 2. Key Findings (grouped by theme)

### District View Data-Driven Transformation

- The 6 hand-crafted ambient scenes (agent-builder, tarva-chat, project-room, tarva-core, tarva-erp, tarva-code) are replaced by a single `CategoryDetailScene` that renders the same four-section layout for any category ID. This implements Decision 6 from combined-recommendations. The scene fetches data from `useCoverageMetrics()` (category-level aggregates) and `useCoverageMapData({ category })` (filtered map markers).
- The `SCENE_MAP` lookup in `district-view-content.tsx` (verified: lines 26-33, a 6-entry `Record<DistrictId, Component>`) is replaced with a direct `CategoryDetailScene` render. The container also drops `pointerEvents: 'none'` and `aria-hidden="true"` since the new scene contains interactive, data-bearing content (alert list, sortable table).
- The `DISTRICT_TINTS` record in `district-view-overlay.tsx` (verified: lines 36-43, 6 hard-coded rgba values) is replaced by a `getCategoryTint()` function that extracts the hex fallback from `getCategoryColor()` and converts it to a 0.05-opacity rgba for the radial gradient. This handles all 15+ categories dynamically.
- The `STATION_CONFIG` record in `district-view-dock.tsx` (verified: lines 28-59, 6-entry config with description, URL, and stations) is replaced by category metadata: display name, short code, description, source counts, and geographic region tags. The "Open" button and port display are removed as categories have no external URLs.
- The `getPanelSideForDistrict()` helper in `district-view-overlay.tsx` (verified: lines 49-53, uses `computeRingRotation`) simplifies to always return `'right'`, consistent with the grid layout Decision 3 from WS-2.2 which eliminated left/right panel branching.

### Phase 2 H-1 Resolution

- The DistrictContent gap (Phase 2 Review H-1) is explicitly resolved by WS-3.1 Section 4.6. The `detail-panel.tsx` file currently renders `<DistrictContent districtId={districtId} />` at line 149 (verified: import at line 25, render at line 149). The `DistrictContent` component uses a `DISTRICT_CONFIG` record keyed by the 6 legacy IDs, so category strings like `'seismic'` resolve to `undefined`.
- The fix replaces the import with a lightweight `CategoryPanelContent` inline component that shows category description, source count, and region tags using `getCategoryMeta()` and `useCoverageMetrics()`. This serves as transitional content during the `expanding`/`settled` morph phases before the full-screen overlay takes over.
- The detail panel header display name also transitions from raw `categoryId` strings to `getCategoryMeta(categoryId).displayName`, resolving Phase 2 OQ-16.

### Chrome Identity Refresh

- The top telemetry bar center label (verified: line 20 imports `DISTRICTS`, lines 191-195 compute `centerLabel`) transitions from `'TARVA LAUNCH // MISSION CONTROL'` to `'TARVARI // COVERAGE MONITOR'`. In district view, it shows `'TARVARI // {CATEGORY_NAME}'` via `getCategoryMeta()`.
- The bottom status strip health labels (verified: line 140 `DEFAULT_HEALTH_LABELS`, lines 142-149 `DISTRICT_HEALTH_LABELS`, lines 199-201 conditional selection) simplify from a per-district label set (6 distinct arrays) to a single `INTEL_HEALTH_LABELS` array: `['SRC', 'ING', 'NRM', 'BND', 'TRI', 'RTR']` representing intel pipeline stages.
- `APP_NAME` and `APP_DESCRIPTION` in `src/lib/constants.ts` (verified: lines 15-16) update to `'TarvaRI Alert Viewer'` and `'Spatial coverage monitor for TarvaRI intelligence'`.

### Minimap Adaptation

- The Minimap transitions from 6 district dots on a ring (verified: imports at lines 23-29, world bounds +/-600 at lines 41-44, `STATUS_COLORS` at lines 55-61, `EMBER_COLOR` at line 67) to up to 15 category dots on a grid layout matching the coverage grid's column/row structure.
- World bounds widen from +/-600 to +/-1800 (x-axis) and +/-800 (y-axis) to encompass the wider 1500px grid and outward-pushed ambient panels.
- The hub center dot is removed (no "hub" concept in the grid layout). The `useDistrictsStore`, `getDistrictWorldPosition`, and `AppTelemetry`/`AppStatus` imports are replaced with `KNOWN_CATEGORIES` and grid-position math.
- Category dot labels use 6px font size (down from 8px for districts) to accommodate 15 labels in a denser arrangement. Some label overlap is expected and acceptable for the decorative minimap.

### Panel Position Adjustments

- All four world-space ambient panels are pushed outward to clear the wider 1500x400px coverage grid from WS-2.1:

| Panel | Old x | New x | Delta | New Clearance from Grid Edge |
|-------|-------|-------|-------|------------------------------|
| SystemStatusPanel (320x680) | -1200 | -1400 | -200 | 330px from grid left (-750) |
| SignalPulseMonitor (480x120) | -1200 | -1400 | -200 | 170px from grid left (-750) |
| FeedPanel (320x580) | 880 | 1100 | +220 | 350px from grid right (+750) |
| ActivityTicker (260x240) | 880 | 1100 | +220 | 350px from grid right (+750) |

- All four PANEL_X values verified in the codebase (system-status-panel.tsx line 38, signal-pulse-monitor.tsx line 35, feed-panel.tsx line 38, activity-ticker.tsx line 40).
- The asymmetric shift (200px left, 220px right) reflects the different panel widths: SignalPulseMonitor is 480px wide (its right edge already close to the grid), while right-side panels are narrower.

### Scene and Component Archival

- 6 legacy scene files are moved to `src/components/district-view/scenes/_archived/`: all 6 verified present in the current `scenes/` directory (agent-builder-scene.tsx, tarva-chat-scene.tsx, project-room-scene.tsx, tarva-core-scene.tsx, tarva-erp-scene.tsx, tarva-code-scene.tsx).
- `scenes/index.ts` transitions from 6 named exports to a single `CategoryDetailScene` export.
- WS-3.1 OQ-4 recommends additionally archiving `district-content.tsx` (from `src/components/districts/`) since it has zero active consumers after the H-1 fix removes its only import in `detail-panel.tsx`.

### Accessibility

- `CategoryDetailScene` contains interactive, data-bearing content and is NOT `aria-hidden` (unlike the legacy ambient scenes which were `aria-hidden="true"` and `pointerEvents: 'none'`). Alert list uses `role="list"`/`role="listitem"`. Source health table uses semantic `<table>` with `<thead>`/`<th scope="col">`. Severity breakdown has a descriptive `aria-label`. Loading states use `aria-busy="true"`. Map placeholder uses `role="img"`.
- This is a significant accessibility improvement over the legacy scenes, which were purely decorative.

## 3. Cross-Workstream Conflicts

### Conflict Analysis: No Shared Files

WS-3.1 modifies: `district-view-content.tsx`, `district-view-overlay.tsx`, `district-view-dock.tsx`, `district-view-header.tsx`, `detail-panel.tsx`, `scenes/index.ts`. Creates: `CategoryDetailScene.tsx`. Archives: 6 scene files.

WS-3.2 modifies: `top-telemetry-bar.tsx`, `bottom-status-strip.tsx`, `Minimap.tsx`, `system-status-panel.tsx`, `signal-pulse-monitor.tsx`, `feed-panel.tsx`, `activity-ticker.tsx`, `constants.ts`.

**These file sets are completely disjoint.** Unlike Phase 2 (where WS-2.1 and WS-2.2 both modified `morph-orchestrator.tsx`), Phase 3's workstreams have zero shared files. Both read from `coverage.ts` (WS-1.2) but neither modifies it.

WS-3.1 Risk R-7 flags potential conflict with WS-3.2 on `district-view-overlay.tsx`, but upon inspection WS-3.2 does not touch this file. WS-3.2's scope is limited to chrome elements (telemetry bar, status strip, minimap) and ambient panels (SystemStatusPanel, FeedPanel, SignalPulseMonitor, ActivityTicker). The overlay is a district-view component modified only by WS-3.1.

**Verdict: True parallel execution is safe. No coordination needed on shared files.**

### Potential Implicit Conflict: Category Metadata Shape

Both workstreams consume `getCategoryMeta()` and `KNOWN_CATEGORIES` from WS-1.2. WS-3.1 accesses `.displayName`, `.shortName`, `.description`, `.color`, and `.icon`. WS-3.2 accesses `.displayName`, `.shortName`, and `.color`. If WS-1.2's `CategoryMeta` type is missing any of these fields (particularly `.description`, which is used extensively by WS-3.1 Section 4.1 and 4.4 but was not explicitly enumerated in Phase 1 OQ tracking), both workstreams would encounter type errors.

**Resolution:** Verify that WS-1.2's `CategoryMeta` interface includes a `description: string` field before either workstream starts. If absent, add it to WS-1.2's deliverables as a required field. This is a blocking pre-condition for WS-3.1.

## 4. Architecture Decisions (consolidated table)

| ID | Decision | Source SOW | Rationale |
|----|----------|-----------|-----------|
| AD-26 | Single `CategoryDetailScene` for all categories, accepting `categoryId: string` prop (Decision 6) | WS-3.1 D-1 | 15+ categories make per-category scenes impractical; data-driven approach means new DB categories render automatically; all categories share the same data shape (alerts, severity, sources, map) |
| AD-27 | `getCategoryTint()` extracts hex fallback from CSS `var()` string, does not use CSS custom property in gradient computation | WS-3.1 D-2 | Inline `style` attributes cannot use `var()` inside `rgba()` in a computed gradient string; hex extraction via regex is reliable because all KNOWN_CATEGORIES entries use hex fallbacks; unknown categories get a neutral gray fallback |
| AD-28 | `getPanelSideForCategory()` always returns `'right'`; ring rotation logic removed | WS-3.1 D-3 | WS-2.2 removed ring rotation; grid layout Decision 3 (AD-20) docks panel to the right; simplification eliminates dead code path |
| AD-29 | Keep `districtId` prop name in overlay/dock/header child components; do not rename to `categoryId` | WS-3.1 D-4 | Prop name is passed from parent `DistrictViewOverlay`; renaming requires cascading change through 4 files for zero functional benefit; type widened to `NodeId = string` by WS-1.2 covers the semantic shift |
| AD-30 | `CategoryPanelContent` (H-1 fix) defined inline in `detail-panel.tsx`, not extracted to separate file | WS-3.1 D-5 | Component is ~30 lines, has single consumer, and serves as bridge content during morph `expanding`/`settled` phases; extraction adds a file for a transitional component |
| AD-31 | Map placeholder uses styled `<div>` with dashed border and label, not a canvas or WebGL stub | WS-3.1 D-6 | Avoids adding MapLibre dependency to this workstream; WS-4.1 owns MapLibre install and needs to mount fresh; styled placeholder communicates "slot reserved" without technical debt |
| AD-32 | Top telemetry bar center label uses condensed `'TARVARI // COVERAGE MONITOR'`, not full `APP_NAME` | WS-3.2 D-1 | Top bar has limited horizontal space (7px font); shorter text reads better at small scale; `APP_NAME` in constants is full name for metadata/title contexts |
| AD-33 | Single `INTEL_HEALTH_LABELS` array replaces both `DEFAULT_HEALTH_LABELS` and `DISTRICT_HEALTH_LABELS` | WS-3.2 D-2 | Coverage monitor views pipeline stages, not individual district subsystems; all categories share the same pipeline (ingest, normalize, bundle, triage, route); per-category source labels are dynamic and unsuitable for a fixed 6-dot display |
| AD-34 | Left panels shifted x:-200, right panels shifted x:+220 (asymmetric) for clearance from 1500px grid | WS-3.2 D-3 | Right-side panels were originally closer (130px clearance); +220 creates 350px clearance; left shift -200 creates 330px (SystemStatusPanel) and 170px (SignalPulseMonitor, wider at 480px); asymmetry reflects different panel widths |
| AD-35 | Minimap world bounds hardcoded to +/-1800 x +/-800, not dynamically computed from panel positions | WS-3.2 D-4 | Static bounds match existing hardcoded pattern (+/-600); dynamic computation adds complexity for a layout that changes rarely; bounds accommodate all panels plus margin |
| AD-36 | Hub center dot removed from Minimap, not replaced with grid center marker | WS-3.2 D-5 | Coverage grid has no central hub concept; the rectangular grid centered at origin has no semantic "center node"; adding a decorative center marker would be misleading |
| AD-37 | Feed panel `resolveTargetName()` uses two-step lookup (category first, then legacy district) for forward+backward compatibility | WS-3.2 D-6 | Activity events in enrichment store may still carry legacy district IDs; removing district support would show raw IDs for existing mock events; two-step lookup handles both new category and legacy district targets |

## 5. Cross-Workstream Dependencies

### Phase 3 Internal Dependencies

```
WS-3.1 (District View Adaptation)  ---- depends on WS-1.2, WS-1.3, WS-2.2 ----> blocks WS-4.1
                                   ---- CAN PARALLEL with WS-3.2

WS-3.2 (Chrome & Panels)          ---- depends on WS-1.2 ----> blocks nothing
                                   ---- CAN PARALLEL with WS-3.1
```

WS-3.1 and WS-3.2 are fully independent within Phase 3. They share no modified files and consume `coverage.ts` (WS-1.2) as a read-only input. WS-3.2 has a shallower dependency tree (only WS-1.2), while WS-3.1 depends on the full Phase 1 + Phase 2 chain.

### Phase 1 and Phase 2 Inputs Consumed

| Prior Output | Consumed By | What It Provides |
|--------------|-------------|------------------|
| `coverage.ts` module (WS-1.2) | WS-3.1 (all deliverables), WS-3.2 (4.1, 4.3, 4.6) | `getCategoryMeta()`, `getCategoryColor()`, `getCategoryIcon()`, `KNOWN_CATEGORIES`, `SEVERITY_LEVELS`, `SEVERITY_COLORS`, `CategoryMeta`, `SeverityLevel` |
| `NodeId` type (WS-1.2) | WS-3.1 (type annotations) | Generic string ID alias replacing `DistrictId` in component interfaces |
| `useCoverageMetrics` hook (WS-1.3) | WS-3.1 (scene + dock + H-1 fix) | `CoverageMetrics` with `byCategory: CoverageByCategory[]` and `sourcesByCoverage: SourceCoverage[]` |
| `useCoverageMapData` hook (WS-1.3) | WS-3.1 (scene alert list + severity breakdown) | `MapMarker[]` filtered by category with `.title`, `.severity`, `.ingestedAt` fields |
| Functional morph drill-down (WS-2.2) | WS-3.1 (gate testing) | Working morph cycle to test `CategoryDetailScene` inside the district view overlay |
| `?category=` URL sync (WS-2.2) | WS-3.1 (data filtering) | URL parameter drives category selection for detail scene data queries |
| Grid dimensions (WS-2.1) | WS-3.2 (Minimap 4.3.2) | `GRID_WIDTH = 1500`, `GRID_HEIGHT = 400`, `GRID_COLUMNS = 8` constants for dot positioning |
| Archived ring-era files (WS-2.2) | WS-3.1, WS-3.2 | Ring components removed; no downstream accounting needed |

### Phase 3 Outputs for Phase 4

| Phase 3 Output | Consumed By | What It Provides |
|----------------|-------------|------------------|
| `CategoryDetailScene` with map placeholder (WS-3.1) | WS-4.1 (Map Feature) | WS-4.1 replaces the placeholder `<div>` with `<CoverageMap category={categoryId} markers={markers} />` |
| Updated `district-view-content.tsx` routing (WS-3.1) | WS-4.1 | Scene is rendered dynamically; WS-4.1 only modifies the scene's map section |
| Correct panel positions (WS-3.2) | WS-4.1 | Ambient panels correctly positioned; WS-4.1 does not need to adjust panel layout |
| Updated Minimap bounds (WS-3.2) | WS-4.1 | Minimap correctly encompasses the wider grid + panels; WS-4.1 map is inside the overlay (viewport-fixed), not in world-space |

### Critical Path

The overall project critical path remains: **WS-1.2 -> WS-1.3 -> WS-2.1 -> WS-2.2 -> WS-3.1 -> WS-4.1**. WS-3.2 is off the critical path (it depends only on WS-1.2 and blocks nothing). Any delay in WS-3.1 directly delays Phase 4. WS-3.2 can absorb schedule slip without impacting the project timeline.

## 6. Consolidated Open Questions (flag blocking)

| ID | Question | Source SOW | Blocking? | Assigned To | Target Phase |
|----|----------|-----------|-----------|-------------|--------------|
| OQ-21 | Should `CategoryDetailScene` alert list items be clickable (linking to a full alert detail view)? No destination view exists. | WS-3.1 OQ-1 | No | react-developer | Phase 5 (post-map). Rec: display-only list. Add interactivity in a future workstream. |
| OQ-22 | Should the severity breakdown use a horizontal stacked bar or a donut/ring chart? | WS-3.1 OQ-2 | No | react-developer | Phase 3 (this WS). Rec: horizontal bar. Simpler, reads well at small size, avoids charting library dependency. |
| OQ-23 | Should `shared-scene-primitives.tsx` be archived alongside the 6 scene files? It has zero active consumers after archival but contains generic reusable primitives (`DataStream`, `GhostText`, etc.). | WS-3.1 OQ-3 | No | react-developer | Phase 3 (this WS). Rec: keep. Primitives are generic, well-documented, zero maintenance cost. Archive in cleanup workstream if unused after Phase 4. |
| OQ-24 | Should `district-content.tsx` (with legacy `DISTRICT_CONFIG` and `StationCard`) be archived? After the H-1 fix, it has zero active consumers. | WS-3.1 OQ-4 | No | react-developer | Phase 3 (this WS). Rec: archive to `src/components/districts/_archived/district-content.tsx`. It is dead code after the H-1 fix. |
| OQ-25 | Should the dock support a future "Open category dashboard" button? Categories have no external URLs. | WS-3.1 OQ-5 | No | react-developer | Post-Phase 4. Rec: no button in this workstream. Navigation via morph back button only. |
| OQ-26 | Should Minimap category dots use per-category `CategoryMeta.color` values or a uniform color? District dots used health-state colors; category dots have no health state but have branding colors. | WS-3.2 OQ-1 | No | react-developer | Phase 3 (this WS). Rec: use per-category colors. Minimap is small enough that color variety provides identification without overwhelming. |
| OQ-27 | Should `SystemStatusPanel` content (district list, resource bars, uptime) be stubbed or left as-is? It reads from enrichment store which seeds 6 district entries. | WS-3.2 OQ-2 | No | Planning Agent | Phase 3. Rec: leave content as-is. Panel is decorative ambient instrumentation. Content rewrite deferred to future workstream. |
| OQ-28 | Should `ActivityTicker` static fallback events (referencing `'project-room'`, `'agent-builder'`, etc.) be replaced with category IDs? | WS-3.2 OQ-3 | No | react-developer | Phase 3 (this WS). Rec: defer. Static events are fallback data; will be replaced when enrichment engine generates coverage-aware events. |
| OQ-29 | Should all `APP_NAME` consumers be verified as part of the WS-3.2 gate? Multiple files may import it. | WS-3.2 OQ-4 | No | react-developer | Phase 3 (this WS). Rec: yes. Add a grep-based check (`grep -r 'APP_NAME\|APP_DESCRIPTION' src/`) to the gate verification. |
| OQ-07 | `intel_sources.id` column ambiguity (carried from Phase 1 H-1). Verify the actual primary key column against live Supabase schema. | Phase 1 Review | **Yes -- blocking for WS-3.1** | react-developer | Phase 3. Must be resolved before WS-3.1 starts. The `CategoryDetailScene` source health table depends on `SourceCoverage` which references intel_sources fields. |
| OQ-06 | Should `intel_normalized` queries include a default date range filter (e.g., last 7 days)? (Carried from Phase 1, deferred from Phase 2.) | WS-1.3 | No (affects volume, not correctness) | Planning Agent | Phase 3 (WS-3.1). Rec: add 7-day default filter to `useCoverageMapData` to prevent unbounded result sets in the detail scene alert list (capped at 50 items regardless, but query efficiency matters). |

## 7. Phase Exit Criteria

### WS-3.1 Exit Criteria

| Criterion | Met? | Evidence |
|-----------|------|----------|
| `CategoryDetailScene` renders without errors for all 15 known category IDs | Pending | Pass each ID; no runtime console errors |
| `CategoryDetailScene` renders fallback for unknown category IDs | Pending | Pass `'nonexistent'`; renders with "Other" styling |
| Alert list shows filtered intel items from `useCoverageMapData({ category: id })` | Pending | Navigate to category with known data; list populates |
| Alert list shows loading skeleton, empty state, and error state correctly | Pending | Test each state path |
| Severity breakdown bar renders proportional segments with correct colors | Pending | Visual check against alert severity counts |
| Source health table shows sources filtered to selected category | Pending | Compare table rows with `sourcesByCoverage` data |
| Map placeholder renders with dashed border and "Map -- WS-4.1" label | Pending | Visual check |
| `DistrictViewContent` renders `CategoryDetailScene` for any ID (no `SCENE_MAP`) | Pending | Grep for `SCENE_MAP` returns zero results |
| Content area is NOT `aria-hidden` and NOT `pointerEvents: 'none'` | Pending | DOM inspection |
| Overlay tint uses selected category color (red for seismic, blue for weather, etc.) | Pending | Navigate to multiple categories; observe matching gradient |
| No static `DISTRICT_TINTS` record remains in overlay | Pending | Grep verification |
| Dock shows category display name, description, source counts, region tags | Pending | Visual inspection + data comparison |
| No static `STATION_CONFIG` record remains in dock | Pending | Grep verification |
| No "Open" button or port display in dock | Pending | Visual check |
| Header shows category display name and color indicator dot | Pending | Navigate to multiple categories |
| Detail panel renders category content for H-1 fix (no `DistrictContent` import) | Pending | Grep for `DistrictContent` in `detail-panel.tsx` returns zero |
| Detail panel shows display name (not raw ID) in header | Pending | Click 'seismic'; header shows "Seismic" |
| 6 legacy scene files archived to `scenes/_archived/` | Pending | `ls _archived/` shows 6 files |
| `scenes/index.ts` exports only `CategoryDetailScene` | Pending | Code review |
| `pnpm typecheck` passes with zero errors | Pending | CLI output |
| `pnpm build` succeeds | Pending | CLI output |
| No active-code imports reference archived scene names | Pending | Grep verification |
| Full morph cycle works: card click -> morph -> detail view -> Escape -> back to grid | Pending | Manual test |

### WS-3.2 Exit Criteria

| Criterion | Met? | Evidence |
|-----------|------|----------|
| Top telemetry bar displays `'TARVARI // COVERAGE MONITOR'` as center label | Pending | Visual inspection |
| Top telemetry bar displays `'TARVARI // {CATEGORY_NAME}'` during morph | Pending | Trigger morph; verify label |
| Top telemetry bar no longer imports `DISTRICTS` | Pending | Grep verification |
| Bottom status strip displays `['SRC', 'ING', 'NRM', 'BND', 'TRI', 'RTR']` labels | Pending | Visual inspection |
| Bottom status strip no longer contains `DISTRICT_HEALTH_LABELS` | Pending | Grep verification |
| Bottom status strip no longer imports from `ui.store` or `district.ts` | Pending | Grep verification |
| Minimap renders up to 15 category dots in 8-column grid pattern | Pending | Visual inspection |
| Minimap world bounds are +/-1800 x +/-800 | Pending | Code review |
| Minimap no longer renders hub center dot | Pending | Visual + code review |
| Minimap category dot labels use `shortName` from `KNOWN_CATEGORIES` | Pending | Visual inspection |
| SystemStatusPanel at x:-1400 (was -1200) | Pending | Code review |
| SignalPulseMonitor at x:-1400 (was -1200) | Pending | Code review |
| FeedPanel at x:+1100 (was +880) | Pending | Code review |
| ActivityTicker at x:+1100 (was +880) | Pending | Code review |
| No ambient panel overlaps the 1500x400px coverage grid | Pending | Visual inspection at Z1 default zoom |
| `APP_NAME` is `'TarvaRI Alert Viewer'` | Pending | Code review |
| `APP_DESCRIPTION` is `'Spatial coverage monitor for TarvaRI intelligence'` | Pending | Code review |
| FeedPanel resolves category short names and legacy district names | Pending | Visual inspection or DevTools |
| `pnpm typecheck` passes with zero errors | Pending | CLI output |
| No runtime errors in browser console after all changes | Pending | DevTools console |

## 8. Inputs Required by Next Phase

Phase 4 (Map: WS-4.1 Map Feature) requires the following from Phase 3:

### From WS-3.1 (District View Adaptation)

- **`CategoryDetailScene` with map placeholder** -- WS-4.1 replaces the placeholder `<div>` (Section 4.1.7) with `<CoverageMap category={categoryId} markers={markers} />`. The placeholder's position in the four-section layout (lower-right quadrant) establishes the map's dimensions and spatial allocation.
- **Updated `district-view-content.tsx`** -- The scene is now rendered dynamically for any category ID. WS-4.1 only modifies the scene component, not the routing layer.
- **`useCoverageMapData` hook integration** -- WS-3.1 already fetches `MapMarker[]` via `useCoverageMapData({ category: categoryId })` and passes it to the severity breakdown and alert list. WS-4.1 adds a third consumer: the `CoverageMap` component which renders markers on the map. The hook is already warm (data cached by the scene).
- **Accessibility contracts** -- The map placeholder currently uses `role="img"` with `aria-label`. WS-4.1 should maintain or improve this accessibility when replacing with the real MapLibre component.

### From WS-3.2 (Chrome & Panels)

- **Updated Minimap bounds (+/-1800 x +/-800)** -- The map component lives inside the district view overlay (viewport-fixed, per Decision 5), so it does not appear on the Minimap. No direct dependency, but the wider bounds ensure the Minimap correctly represents the spatial layout including outward-pushed panels.
- **Correct panel positions** -- WS-4.1 does not need to account for panel overlap since WS-3.2 has already pushed all panels to safe positions.

### Unresolved Items Phase 4 Must Address

- **MapLibre GL JS installation** -- WS-4.1 owns the `maplibre-gl` + `react-map-gl` dependency addition. The `CategoryDetailScene` map placeholder is a plain `<div>` with no map library dependency.
- **WebGL in viewport-fixed overlay** -- Per Decision 5, the map renders inside the district view overlay (`position: fixed; inset: 0`) to avoid CSS transforms. WS-4.1 must verify this works correctly at all zoom levels.
- **Geographic bounds calculation** -- WS-4.1 uses `useCoverageMapData` markers to compute bounding box for the category-specific map view. The `calculateBounds` utility from `coverage-utils.ts` (WS-1.3) should be verified before WS-4.1 starts.

## 9. Gaps and Recommendations

### Gap 1: `CategoryMeta.description` Field Not Confirmed in WS-1.2 (CTA + SPO)

WS-3.1 extensively uses `getCategoryMeta(id).description` in the `CategoryDetailScene` (Section 4.1), the dock panel (Section 4.4), and the H-1 fix `CategoryPanelContent` (Section 4.6). However, the `CategoryMeta` interface defined in WS-1.2 was not explicitly verified to include a `description: string` field in the Phase 1 or Phase 2 overviews. The combined-recommendations document mentions `display name, color, and icon` but not `description`.

**Recommendation:** Before WS-3.1 begins, verify that WS-1.2's `CategoryMeta` includes `description: string`. If absent, add it as a required field to `KNOWN_CATEGORIES`. This is a **blocking pre-condition** for WS-3.1. Descriptions can be brief (~10-20 words per category, e.g., "Earthquake, tsunami, and volcanic activity monitoring").

### Gap 2: `CoverageByCategory` Shape Assumptions (CTA)

WS-3.1 accesses `categoryData.sourceCount`, `categoryData.activeSources`, and `categoryData.geographicRegions` from the `CoverageByCategory` type (WS-1.3). The Phase 1 data layer SOW defines `CoverageByCategory` but the exact field names should be verified against the WS-1.3 implementation. If the fields are named differently (e.g., `source_count` vs `sourceCount`), the dock and scene code will fail at runtime.

**Recommendation:** Cross-reference WS-3.1's data field usage with WS-1.3's `CoverageByCategory` type definition. Add a field-by-field compatibility table to WS-3.1 or confirm field names during the Phase 2 exit review. A one-line TypeScript assertion (e.g., `satisfies { sourceCount: number; activeSources: number; geographicRegions: string[] }`) in the component would catch mismatches at compile time.

### Gap 3: No Test Deliverables (SPO + CTA -- Recurring)

Neither WS-3.1 nor WS-3.2 includes test files as formal deliverables. This is the third consecutive phase without test specs (Phase 1 Gap 1, Phase 2 Gap 1). `CategoryDetailScene` is the most complex new component in the project (four data sections, three loading states, accessibility requirements) and would benefit from unit tests.

**Recommendation:** Add the following as formal deliverables or post-phase tasks:
- `src/components/district-view/scenes/__tests__/CategoryDetailScene.test.tsx` -- Verify all 4 sections render, loading/empty/error states, accessibility attributes, fallback for unknown categories.
- A manual test script for the full WS-3.1 gate: morph cycle through 3+ categories, verify data, verify empty state category, verify Escape reversal.
- WS-3.2 test: grep-based verification script for all label changes and panel positions.

### Gap 4: `MapMarker` Type Shape Not Verified (CTA)

WS-3.1 Section 4.1.4 references `MapMarker.title`, `MapMarker.severity`, and `MapMarker.ingestedAt` for the alert list. The `MapMarker` type is produced by `useCoverageMapData` (WS-1.3) via the `toMarkers()` utility in `coverage-utils.ts`. The exact field names should be verified against the WS-1.3 spec to ensure the alert list renders correctly.

**Recommendation:** Add a type import assertion or interface re-export in `CategoryDetailScene` that explicitly declares the fields it consumes from `MapMarker`. This provides compile-time safety if the WS-1.3 type shape changes.

### Gap 5: `district-content.tsx` Archival Not Formalized (STW)

WS-3.1 OQ-4 recommends archiving `district-content.tsx` (247 lines, zero consumers after H-1 fix), but this is listed as an open question rather than a deliverable. Dead code that appears to be active can confuse future developers.

**Recommendation:** Promote OQ-24 to a formal sub-deliverable of WS-3.1: move `src/components/districts/district-content.tsx` to `src/components/districts/_archived/district-content.tsx`. This is a 1-minute task that prevents confusion. Include the grep verification from WS-3.1 Section 4.7.3 pattern to confirm zero active imports before archiving.

### Gap 6: ViewportCuller Compatibility Not Verified for New Panel Positions (CTA)

WS-3.2 Risk R-3 briefly addresses `ViewportCuller` bounds but relies on a rough calculation. The `VIEWPORT_CULL_MARGIN` constant determines how far off-screen an element can be before it is culled (hidden). With panels pushed to x:+/-1400, they are further from the viewport center. If the cull margin is too small relative to the new positions, panels could disappear at certain zoom levels.

**Recommendation:** After WS-3.2 implementation, verify all four ambient panels are visible at three zoom levels: Z0 (0.08), Z1 default (0.5), and Z2 (1.5). If any panel is culled, increase `VIEWPORT_CULL_MARGIN` in `constants.ts`. This should be added as a manual verification step in the WS-3.2 gate.

### Gap 7: MASTER-PLAN.md Still Does Not Exist (PMO -- Recurring)

This is the third consecutive phase overview referencing a parent plan that does not exist (Phase 1 Gap 6, Phase 2 Gap 5). With three phase overviews, two phase reviews, and a combined-recommendations document now in place, the absence of a formal master plan with status tracking becomes increasingly problematic for cross-phase traceability.

**Recommendation:** Create `docs/plans/new-launch-page/MASTER-PLAN.md` before Phase 3 implementation begins. It should formalize the 4-phase structure, link to each phase overview and review, track OQ resolution status, and provide a single status dashboard. This is a 30-minute documentation task.

### Gap 8: Phase 1 OQ-07 Still Blocking (SPO -- Carried Forward)

Phase 1 Review H-1 flagged `intel_sources.id` column ambiguity as a blocking issue for WS-1.3. Phase 2 Overview Section 8 carried this forward as an unresolved item for Phase 3. WS-3.1's source health table renders `SourceCoverage` data derived from `intel_sources`. If the schema introspection has not been performed, WS-3.1's data display could break at runtime.

**Recommendation:** Run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'intel_sources'` against the live Supabase instance before WS-3.1 starts. Update the `IntelSourceRow` type (WS-1.3) if needed. This is a **hard blocker** that has been carried for two phases.

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream | Estimated Effort | Complexity | Agent | Notes |
|------------|-----------------|------------|-------|-------|
| WS-3.1 District View Adaptation | 10--14 hours | HIGH | react-developer | 1 new component file (CategoryDetailScene with 4 data sections, 3 loading states, accessibility), 5 file rewrites (content, overlay, dock, header, detail-panel), 1 barrel export update, 6 file archival. Main effort: CategoryDetailScene (~200-250 lines with layout, data fetching, severity chart, source table, skeleton states). Dock rewrite (~100 lines replacing STATION_CONFIG). H-1 fix is moderate (~40 lines). Scene archival is mechanical. |
| WS-3.2 Chrome & Panels | 4--6 hours | LOW-MEDIUM | react-developer | 8 file modifications (telemetry bar, status strip, minimap, 4 panel position files, constants). All changes are well-specified with exact before/after code blocks. The Minimap adaptation (replacing DistrictDot with CategoryDot, new grid-position math) is the most involved change (~80 lines of new code). All other changes are 1-5 line edits. Feed panel resolveTargetName is ~15 lines. |
| **Phase 3 Total** | **14--20 hours** | | | |

### Resource Loading

Both workstreams are assigned to the `react-developer` agent. Unlike Phase 2 (where WS-2.1 and WS-2.2 were strictly sequential), **Phase 3's workstreams can execute in parallel** because they modify completely disjoint file sets. If a second agent is available, both can run simultaneously. If the same agent handles both, they can be interleaved or serialized in either order.

### Parallel Execution Opportunities

| Opportunity | Feasible? | Risk |
|-------------|-----------|------|
| WS-3.1 + WS-3.2 in parallel | **Yes** | Zero shared files. Both consume `coverage.ts` read-only. Fully independent. |
| WS-3.1 + WS-4.1 overlap | **No** | WS-4.1 depends on WS-3.1's `CategoryDetailScene` and map placeholder. |
| WS-3.2 + WS-4.1 overlap | **Conditionally** | WS-4.1 does not depend on WS-3.2 (map is in the overlay, not affected by panel positions). Could run in parallel if WS-3.1 is complete. |

### Recommended Execution Order

```
Prerequisites:
  WS-1.2 gated (types) ........... required by WS-3.1 + WS-3.2
  WS-1.3 gated (data layer) ...... required by WS-3.1
  WS-2.2 gated (morph) ........... required by WS-3.1
  OQ-07 resolved (intel_sources schema) ... blocking for WS-3.1
  CategoryMeta.description verified ..... blocking for WS-3.1

Parallel Track A (critical path):
  [1] WS-3.1 District View Adaptation ..... 10-14h  (react-developer)
      Gate: morph into any category -> data-driven detail view,
            H-1 fix verified, 6 scenes archived,
            pnpm typecheck + pnpm build pass

Parallel Track B (off critical path):
  [2] WS-3.2 Chrome & Panels ............. 4-6h   (react-developer or second agent)
      Gate: all labels show TarvaRI, intel health labels,
            minimap shows category dots, panels cleared from grid,
            pnpm typecheck passes, no console errors

Post-gate (30 min):
  [3] Phase 3 Exit Verification ........... 0.5h   (any agent)
      Full morph cycle through 3+ categories
      Visual smoke test: all chrome labels, panel positions, minimap
      Ambient effects render normally at Z0/Z1/Z2
```

### Effective Duration

If executed in parallel: **10--14 hours** (WS-3.1 is the long pole; WS-3.2 completes within WS-3.1's window).

If serialized (single agent): **14--20 hours**. Recommended serial order: WS-3.2 first (lower risk, faster feedback cycle, verifies `coverage.ts` dependency works), then WS-3.1.

### Bottlenecks

1. **WS-3.1 data dependency chain:** WS-3.1 depends on WS-1.2, WS-1.3, and WS-2.2. If any of these has unresolved issues (particularly the `CategoryMeta.description` gap or `CoverageByCategory` field shape), WS-3.1 will be blocked. WS-3.2 has only one dependency (WS-1.2) and can proceed independently.
2. **CategoryDetailScene complexity:** The scene is the most complex new component in the project -- four data sections, three state variants (loading/empty/error), data filtering from two hooks, accessibility requirements, and a two-column layout with dock-side clearance. Iteration on layout and styling is likely.
3. **OQ-07 (intel_sources schema) still unresolved:** This has been a blocking issue since Phase 1 Review. If it remains unresolved, the source health table in `CategoryDetailScene` and the `SourceCoverage` data in the dock panel could render incorrect data. This is the highest schedule risk for WS-3.1.
4. **`getCategoryTint()` hex extraction fragility:** The regex-based hex extraction from CSS `var()` strings is a non-standard pattern. While WS-3.1 Risk R-4 provides a fallback, any future change to the `getCategoryColor()` return format (e.g., switching from hex to hsl fallbacks) would silently degrade to gray tints.

### Schedule Risk Assessment

- **Best case:** 12 hours across 1 day. WS-3.2 completes in morning; WS-3.1 completes in afternoon. Both workstreams have clear before/after code blocks with verified line references.
- **Expected case:** 16 hours across 1.5 days. CategoryDetailScene layout iteration adds ~2 hours (four-section responsive layout in the district view overlay's constrained space). Dock rewrite requires careful styling matching (~1 hour extra).
- **Worst case:** 24 hours across 2.5 days. `CategoryMeta.description` is missing, requiring a patch to WS-1.2 (+2h). `CoverageByCategory` field names mismatch (+2h debugging). OQ-07 unresolved, requiring live schema introspection and type updates (+2h). ViewportCuller clips outward-pushed panels at Z0 zoom, requiring margin adjustment (+1h).
- **Overall Phase 3 schedule risk:** MEDIUM-LOW. Both workstreams are well-specified with detailed code sketches and verified line references. The primary risk is upstream dependency readiness (WS-1.2 type completeness, WS-1.3 data shape accuracy), not the Phase 3 implementation itself. The parallel execution opportunity significantly reduces calendar time compared to Phase 2's strictly sequential workstreams.

### Comparison to Phase 2

Phase 3 is approximately 0.7--0.8x the effort of Phase 2 (14--20h vs 18--26h) and carries lower risk. Phase 2's complexity was dominated by the morph system rewrite (WS-2.2), which involved interconnected state machine, CSS selectors, animations, and portal rendering. Phase 3's main complexity is data integration (fetching, filtering, and displaying live Supabase data) which is more predictable. The ability to parallelize WS-3.1 and WS-3.2 reduces effective duration to ~60% of Phase 2's serial execution time. The risk profile shifts from "animation fidelity" (Phase 2) to "data shape compatibility" (Phase 3).
