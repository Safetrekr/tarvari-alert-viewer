# Phase 4 Overview: Map

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** MASTER-PLAN.md (pending creation -- see Phase 1 Gap 6, Phase 2 Gap 5, Phase 3 Gap 7)
> **Date:** 2026-03-04
> **Workstreams:** WS-4.1 (Map Feature)
> **Final Phase:** Yes -- this is the last phase of the Coverage Grid Launch Page project.

---

## 1. Executive Summary

Phase 4 delivers the interactive geographic map that completes the TarvaRI Alert Viewer's coverage dashboard. It installs MapLibre GL JS and react-map-gl, creates four new component/utility files (`CoverageMap.tsx`, `MapMarkerLayer.tsx`, `MapPopup.tsx`, `map-utils.ts`), one CSS override file (`maplibre-overrides.css`), and replaces the map placeholder `<div>` established by WS-3.1 (Section 4.1.7) in `CategoryDetailScene` with a live, interactive map.

This is a single-workstream phase. **WS-4.1 (Map Feature)** resolves Decision 5 from the combined-recommendations document (MapLibre GL JS in the district view overlay). The map renders inside the `DistrictViewOverlay` component (`position: fixed; inset: 0; zIndex: 30`, verified at `district-view-overlay.tsx` lines 86-89), which is outside the CSS `transform: scale()` hierarchy of the spatial ZUI engine. This placement avoids the WebGL-in-CSS-transforms rendering problem identified in Discovery Phase 5.

When a user drills into any category from the coverage grid, the lower-right quadrant of `CategoryDetailScene` displays a MapLibre map with CARTO dark-matter tiles, severity-colored circle markers for that category's geo-located intel items, automatic bounds fitting, marker clustering at low zoom levels, and clickable marker popups showing alert title, severity badge, and relative ingested timestamp. The `CoverageMap` component is dynamically imported via `next/dynamic` with `ssr: false` to prevent `window is not defined` errors during Next.js static generation.

**Scale:** 4 new files, 1 new CSS file, 1 file update (`CategoryDetailScene.tsx`), 1 layout import addition (`layout.tsx`). Two new npm dependencies (`maplibre-gl`, `react-map-gl`). Approximately 8--12 hours of implementation effort.

**Bundle size impact:** MapLibre GL JS adds approximately 200KB gzipped. This cost is fully deferred -- the map chunk loads on-demand only when a user enters a category detail view, during the morph animation's `entering-district` phase which provides a natural loading window. The initial page bundle is unaffected.

**Project completion:** Upon Phase 4 gate verification, all 8 work areas (WA1--WA8) across 4 phases are complete. The coverage grid launch page replaces the tarva-launch capsule ring with a data-driven coverage dashboard backed by live TarvaRI intel data.

## 2. Key Findings (grouped by theme)

### Map Placement and WebGL Constraints

- The map renders exclusively inside the district view overlay, which uses `position: fixed; inset: 0; zIndex: 30` (verified: `district-view-overlay.tsx` lines 86-89). The overlay is a direct child of the root layout, not a descendant of `SpatialCanvas` (which carries the CSS `transform: scale()` for the ZUI). This means the MapLibre WebGL canvas is never inside a CSS-transformed ancestor, eliminating the rendering distortion problem.
- The map appears only when drilling into a category detail view, not on the launch page overview. There is no world-space map component. This is a deliberate constraint from Decision 5, not a limitation to be worked around.
- DOM inspection during implementation should verify the ancestor chain from `CoverageMap` up to the document root contains no `transform` property. WS-4.1 Risk R-1 documents this verification step.

### SSR and Static Export Compatibility

- MapLibre GL JS accesses `window` at module evaluation time. Since this app uses Next.js 16 and targets GitHub Pages static export (per CLAUDE.md Phase 2 scope), all map code must be excluded from the server/build-time bundle.
- WS-4.1 uses `next/dynamic` with `ssr: false` (Deliverable 4.6.1) to completely exclude `CoverageMap` from server-side rendering. This is the standard Next.js pattern and is more reliable than `React.lazy` (which defers rendering but does not prevent webpack from bundling the module) or conditional `typeof window` checks (which are fragile).
- The current `next.config.ts` (verified: 7 lines, only `transpilePackages: ['@tarva/ui']`) does not yet have `output: 'export'` for static generation. When that is added (Phase 2 out-of-scope item from combined-recommendations), the `ssr: false` dynamic import will still work correctly -- `next/dynamic` with `ssr: false` is compatible with both SSR and static export modes.
- All imports from `maplibre-gl` must be inside dynamically imported modules only. If a type import inadvertently pulls runtime code (e.g., `import type { ExpressionSpecification } from 'maplibre-gl'` in `map-utils.ts`), the SSR build could fail. WS-4.1 Risk R-2 documents this and recommends using `import type` for all type-only references from `maplibre-gl`.

### Bundle Size and Loading Strategy

- `maplibre-gl` is approximately 200KB gzipped. This is the single largest dependency addition in the project (the next largest existing dependency, `react` at 19.2.4, is ~45KB gzipped).
- The cost is fully deferred via dynamic import. The map chunk loads only when a user drills into a category detail view. The morph animation duration (~600ms `entering-district` phase) provides a natural loading window during which the `next/dynamic` `loading` fallback renders (a styled placeholder matching the WS-3.1 map placeholder design).
- `react-map-gl` adds approximately 30KB gzipped on top of `maplibre-gl`. The combined ~230KB is reasonable for a full-featured vector map with clustering, popups, and navigation controls.
- No code-splitting beyond the existing `next/dynamic` is needed. The map component and its dependencies form a single chunk that webpack isolates automatically.

### Tile Source and Dark Theme

- CARTO dark-matter (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) is selected for development and initial launch (Decision D-1). It is free, requires no API key, provides dark tiles consistent with the app's visual language, and has global coverage.
- Production tile source procurement is explicitly out of scope (OQ-1). The tile source is a single URL string in `CoverageMap.tsx` and can be swapped to MapTiler, Protomaps, or Stadia Maps without code changes.
- MapLibre's default control styling (white backgrounds, light icons) is overridden by `maplibre-overrides.css` which applies dark glass backgrounds, inverted icons, and reduced-opacity attribution text. All overrides target `.maplibregl-*` class names with `!important` to ensure they win regardless of cascade layer ordering.

### Marker Rendering and Clustering

- Markers use MapLibre GeoJSON source with WebGL `circle` layers (Decision D-3), not HTML `<Marker>` components. This approach handles 1000 markers at 60fps because rendering is GPU-based with zero DOM nodes per marker.
- Markers are colored by severity (Decision D-2): Extreme=red, Severe=orange, Moderate=yellow, Minor=blue, Unknown=gray. Category coloring is intentionally not used because the map already filters to a single category -- all markers would be the same color.
- Built-in MapLibre clustering (Decision D-4) is enabled via `cluster: true` on the GeoJSON source. Clusters appear at low zoom levels with a count label and a semi-transparent circle. Clicking a cluster zooms in to expand it. Clustering stops at zoom 14+ where individual markers are visible.
- The 1000-marker cap comes from WS-1.3's `useCoverageMapData` query (`.limit(1000)`). If performance is a concern on lower-end devices, this limit can be reduced without code changes to the map component.

### Popup and Interaction Design

- Marker popups use a custom `MapPopup` component with the dark glass aesthetic (rgba(10,14,24,0.92) background, backdrop-blur, mono font). MapLibre's default white popup styling is completely overridden via CSS.
- Popups display three fields: alert title (truncated with ellipsis), severity badge (colored dot + uppercase label), and relative ingested timestamp (e.g., "2h ago"). No "view details" link is included because no alert detail page exists (deferred per OQ-3, consistent with WS-3.1 OQ-1).
- Popup dismissal is handled by clicking elsewhere on the map. The default MapLibre close button is hidden. This is simpler and consistent with the minimal dark-theme UI.

### Accessibility

- The map container uses `role="application"` (signaling a complex interactive widget with its own keyboard handling), `aria-roledescription="map"`, and a dynamic `aria-label` that describes the marker count and category name (e.g., "Interactive map showing 42 Weather alerts").
- A visually hidden `aria-live="polite"` region announces data state changes to screen readers.
- Keyboard navigation is natively supported by MapLibre: Tab into the canvas, arrow keys pan, +/- keys zoom. This does not conflict with the app's global shortcuts (Escape for morph reverse is handled by a global listener; Cmd+K for command palette is handled by `CommandPalette`).
- The popup's severity information is communicated via text label (not color alone), meeting color-independence requirements.
- This is a significant improvement over the WS-3.1 map placeholder, which used `role="img"` with a static label.

### Data Dependencies on Prior Phases

- `useCoverageMapData({ category })` from WS-1.3 is already invoked by `CategoryDetailScene` (WS-3.1 Section 4.1.2). The hook returns `MapMarker[]` with `id`, `lat`, `lng`, `title`, `severity`, `category`, `sourceId`, `ingestedAt` fields. WS-4.1 adds a second consumer of the same data -- the `CoverageMap` component. Because TanStack Query caches the data, no additional network request is made.
- `calculateBounds(markers)` from `coverage-utils.ts` (WS-1.3) computes the geographic bounding box for auto-zoom. It returns either `{ bounds: [[minLng, minLat], [maxLng, maxLat]] }` for 2+ markers, `{ center: [lng, lat], zoom: 8 }` for 1 marker, or `{ center: [0, 0], zoom: 2 }` for 0 markers.
- `SEVERITY_LEVELS`, `SEVERITY_COLORS`, and `getCategoryMeta()` from `coverage.ts` (WS-1.2) are used by the popup for severity badge rendering and category display names.

## 3. Cross-Workstream Conflicts

Not applicable. Phase 4 contains a single workstream (WS-4.1). There are no internal conflicts to resolve.

WS-4.1 modifies only two existing files: `CategoryDetailScene.tsx` (replacing the map placeholder) and `layout.tsx` (adding a CSS import). Neither file is modified by any concurrent workstream since Phase 4 is sequential -- all prior phases must be gated before WS-4.1 begins.

## 4. Architecture Decisions (consolidated table)

| ID | Decision | Source SOW | Rationale |
|----|----------|-----------|-----------|
| AD-38 | Use CARTO dark-matter as tile source for dev and initial launch; production tile source is a post-launch operational decision | WS-4.1 D-1 | Free, no API key, dark theme match, reliable CDN, global coverage. Tile source is a single URL string in `CoverageMap.tsx`, swappable without code changes. MapTiler, Protomaps, Stadia Maps are production alternatives. |
| AD-39 | Color markers by severity (not by category) using MapLibre data-driven `circle-color` paint expression | WS-4.1 D-2 | Map already filters to a single category, so category color would make all markers identical. Severity coloring provides geographic risk density at a glance. Aligns with severity color system used throughout the detail scene. |
| AD-40 | Use MapLibre GeoJSON source with circle layers, not HTML `<Marker>` components | WS-4.1 D-3 | WebGL-rendered circles handle 1000 markers at 60fps with zero DOM nodes. HTML markers create one DOM element per point, degrading above ~100. Circle layers enable data-driven styling via MapLibre expressions without per-marker React re-renders. |
| AD-41 | Enable built-in MapLibre clustering via `cluster: true` on GeoJSON source, not external Supercluster library | WS-4.1 D-4 | Prevents visual clutter at low zoom. Built-in clustering is GPU-computed, configurable (maxZoom=14, radius=50), and requires no additional dependency. Cluster circles show count labels and expand on click. |
| AD-42 | Dynamically import `CoverageMap` via `next/dynamic` with `ssr: false`, not `React.lazy` or conditional `typeof window` check | WS-4.1 D-5 | `next/dynamic` with `ssr: false` completely excludes the module from the server bundle. `React.lazy` defers rendering but does not prevent webpack from bundling (causing `window is not defined`). Conditional checks are fragile. Standard Next.js pattern for WebGL components. |
| AD-43 | MapLibre CSS imported via dedicated `maplibre-overrides.css` with `@import` for base styles, not via JS import in the dynamically loaded component | WS-4.1 D-6 | Global import in layout ensures styles are available from page load, preventing FOUC when the map chunk loads. Co-locates all `.maplibregl-*` overrides in one file. Follows the existing feature-scoped CSS pattern (`morph.css`, `enrichment.css`, `atrium.css`, etc. in `src/styles/`). |
| AD-44 | Use `react-map-gl/maplibre` entry point, not `react-map-gl` with `mapLib` runtime prop | WS-4.1 D-7 | First-class MapLibre entry point provides correct TypeScript types, avoids runtime `mapLib` indirection, and tree-shakes Mapbox-specific code. `maplibre-gl` is a peer dependency via this path. |
| AD-45 | Hide MapLibre attribution control via `attributionControl={false}`; rely on tile source metadata for attribution | WS-4.1 D-8 | Default attribution UI is visually noisy in the constrained lower-right quadrant and clashes with the dark theme. CARTO's style JSON includes attribution metadata in the tile response. If explicit attribution is required, a discrete text link can be added below the map. |

## 5. Cross-Workstream Dependencies

### What Phase 4 Needs from Prior Phases

```
WS-4.1 (Map Feature) ---- depends on WS-1.2, WS-1.3, WS-3.1 ----> blocks nothing (final)
```

| Prior Output | Consumed By | What It Provides |
|--------------|-------------|------------------|
| `coverage.ts` module (WS-1.2) | WS-4.1 (MapPopup, CoverageMap) | `SEVERITY_LEVELS`, `SEVERITY_COLORS`, `SeverityLevel` for popup badge rendering; `getCategoryMeta()` for `categoryName` prop |
| `useCoverageMapData` hook (WS-1.3) | WS-4.1 (CategoryDetailScene integration) | `MapMarker[]` with `id`, `lat`, `lng`, `title`, `severity`, `category`, `sourceId`, `ingestedAt`. Already invoked by `CategoryDetailScene` (WS-3.1); WS-4.1 adds the `CoverageMap` as a second consumer of the same cached data. |
| `calculateBounds()` from `coverage-utils.ts` (WS-1.3) | WS-4.1 (CoverageMap auto-bounds) | `MapBounds` with `center?: [lng, lat]`, `zoom?: number`, `bounds?: [[minLng, minLat], [maxLng, maxLat]]` for fitting the map viewport to the category's geographic extent |
| `MapMarker` type (WS-1.3) | WS-4.1 (map-utils, CoverageMap, MapMarkerLayer) | Type definition for the marker data shape consumed by the map components |
| `CategoryDetailScene` with map placeholder (WS-3.1) | WS-4.1 (Deliverable 4.6) | WS-4.1 replaces the placeholder `<div>` (Section 4.1.7, identifiable by `role="img"` and `aria-label="Map placeholder, coming soon"`) with `<CoverageMap>`. The placeholder's position in the four-section layout (lower-right quadrant) establishes the map's dimensions. |
| Updated `district-view-content.tsx` routing (WS-3.1) | WS-4.1 (no changes needed) | Scene is rendered dynamically for any category ID. WS-4.1 only modifies `CategoryDetailScene`, not the routing layer. |
| Functional morph drill-down (WS-2.2) | WS-4.1 (gate testing) | Working morph cycle to verify map mounts/unmounts cleanly during drill-in and Escape reversal |
| Panel positions (WS-3.2) | WS-4.1 (no direct dependency) | Ambient panels are correctly positioned around the wider grid. The map is inside the overlay (viewport-fixed), not in world-space, so panel positions are irrelevant to map rendering. |

### Critical Path (Full Project)

```
WS-1.1 (archive) -> WS-1.2 (types) -> WS-1.3 (data) -> WS-2.1 (grid) -> WS-2.2 (morph) -> WS-3.1 (district view) -> WS-4.1 (map)
                                                                                                                          ^
WS-3.2 (chrome) parallel with WS-3.1, off critical path ---------------------------------- no downstream dependency ------/
```

WS-4.1 is the terminal node on the critical path. Any delay in WS-3.1 directly delays Phase 4. WS-3.2 has no dependency relationship with WS-4.1 and can complete at any time before, during, or after Phase 4 without impact.

## 6. Consolidated Open Questions (continued from OQ-29)

| ID | Question | Source SOW | Blocking? | Assigned To | Target Phase |
|----|----------|-----------|-----------|-------------|--------------|
| OQ-30 | What is the production tile source? CARTO dark-matter is suitable for dev and initial launch. For production at scale, options include MapTiler (API key, generous free tier), Protomaps (self-hosted, one-time cost, offline-capable), or Stadia Maps (API key, free tier). Tile source is a single URL string swap. | WS-4.1 OQ-1 | No | DevOps / Product | Post-launch. CARTO is suitable for launch. |
| OQ-31 | Should the map support a severity filter within the category view? Hook already supports the parameter (`useCoverageMapData` accepts `severity` per WS-1.3 Section 4.4.1). Requires UI design for the filter control. | WS-4.1 OQ-2 | No | react-developer | Post-Phase 4. |
| OQ-32 | Should marker popups include a "View details" link to a full alert detail page? No such page exists. Consistency with WS-3.1 OQ-1 (alert list interactivity) suggests both should gain navigation simultaneously. | WS-4.1 OQ-3 | No | react-developer | Post-Phase 4 (same timeline as OQ-21). |
| OQ-33 | Should MapLibre's `Open Sans Regular` font reference in cluster count labels have a custom font stack fallback, or is system sans-serif acceptable? | WS-4.1 OQ-4 | No | react-developer | Phase 4. Rec: accept fallback. System sans-serif is acceptable for numeric cluster count labels. Configuring custom fonts in MapLibre style JSON adds complexity for minimal visual benefit. |
| OQ-34 | Should `maplibre-overrides.css` use Tailwind `@layer` for cascade ordering, or is plain CSS with `!important` sufficient? | WS-4.1 OQ-5 | No | react-developer | Phase 4. Rec: plain CSS with `!important`. MapLibre class names (`.maplibregl-*`) have no overlap with Tailwind utilities. If issues arise, wrap in `@layer overrides { ... }` as a fix. |
| OQ-07 | `intel_sources.id` column ambiguity. **Carried forward for the fourth time** (Phase 1 Review H-1, Phase 2 Section 8, Phase 3 Section 6). Verify the actual primary key column against live Supabase schema. | Phase 1 Review | **Yes -- blocking for WS-3.1, which blocks WS-4.1** | react-developer | Must be resolved before WS-3.1 starts. |
| OQ-06 | Should `intel_normalized` queries include a default date range filter? Carried from Phase 1, deferred from Phase 2, recommended in Phase 3 (7-day default). | WS-1.3 | No (affects volume, not correctness) | Planning Agent | Phase 3. Not blocking for Phase 4. |

### Carried-Forward Issue Summary

Two open questions have been carried forward across multiple phase overviews:

- **OQ-07** (`intel_sources.id` column ambiguity) has been flagged as blocking since Phase 1 Review. It is now a four-phase carry-forward. WS-3.1's source health table and WS-4.1's marker data both depend on correct `intel_sources` field resolution. This item must be resolved before WS-3.1 implementation begins. The resolution is a single SQL query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'intel_sources'` against the live Supabase instance.
- **OQ-06** (date range filter for `intel_normalized`) has been carried since Phase 1. It affects query efficiency but not correctness. The 1000-row `.limit()` cap in WS-1.3 provides a safety net. Recommended but not blocking.

## 7. Phase Exit Criteria

### WS-4.1 Exit Criteria

| Criterion | Met? | Evidence |
|-----------|------|----------|
| `maplibre-gl` and `react-map-gl` listed in `package.json` dependencies | Pending | `pnpm list maplibre-gl react-map-gl` shows both packages |
| `pnpm install` resolves without errors or unresolved peer dependency warnings | Pending | CLI output |
| `pnpm typecheck` passes with zero errors | Pending | CLI exit code 0 |
| `pnpm build` succeeds with no SSR errors (`window is not defined`, `document is not defined`) | Pending | CLI exit code 0; build log clean |
| Map renders inside district view overlay (not in CSS-transformed world-space) | Pending | DOM inspection: no `transform` ancestor between layout root and `CoverageMap` |
| Map uses CARTO dark-matter tiles (dark background) | Pending | Visual check |
| Map displays zoom +/- navigation controls in top-right corner (no compass) | Pending | Visual check |
| Markers shown only for the currently selected category | Pending | Drill into Seismic -> seismic markers only; drill into Weather -> weather markers only |
| Markers colored by severity: Extreme=red, Severe=orange, Moderate=yellow, Minor=blue, Unknown=gray | Pending | Visual check; compare marker color with popup severity label |
| Markers cluster at low zoom with count labels on cluster circles | Pending | Zoom out until markers merge; verify count labels |
| Clicking a cluster zooms to expand it | Pending | Click cluster; verify zoom + split |
| At zoom 14+ all markers are individual (no clustering) | Pending | Zoom to 14+; no cluster circles remain |
| Map auto-zooms to fit all markers when detail view opens | Pending | Drill into category with spread-out markers; viewport encompasses all with padding |
| Single-marker category centers at ~zoom 8 | Pending | Drill into 1-marker category |
| Zero-marker category shows world view (zoom ~2) with "No geo-located alerts for {name}" label | Pending | Drill into empty category |
| Clicking an individual marker shows popup with title, severity badge, and relative timestamp | Pending | Click marker; inspect popup content |
| Clicking elsewhere on map dismisses popup | Pending | Open popup then click empty area |
| Popup has dark glass styling (not default white MapLibre popup) | Pending | Visual check |
| "Loading Map..." overlay visible while tiles load | Pending | Visual check (or DevTools network throttling) |
| WebGL-unavailable fallback message renders instead of blank map | Pending | Disable WebGL in browser flags |
| Map container has `role="application"` and `aria-roledescription="map"` | Pending | DOM inspection |
| Dynamic `aria-label` includes marker count and category name | Pending | DOM inspection |
| Screen-reader-only `aria-live="polite"` region present | Pending | DOM inspection |
| Keyboard navigation works: Tab into map, arrow keys pan, +/- keys zoom | Pending | Manual keyboard test |
| MapLibre CSS loaded globally (controls render correctly) | Pending | Visual check: zoom buttons properly styled |
| MapLibre CSS overrides do not affect non-map components | Pending | Visual smoke test of full app (launch page, morph, panels, command palette) |
| WS-3.1 map placeholder `<div>` with "Map -- WS-4.1" label fully removed | Pending | `grep -r 'Map -- WS-4.1' src/` returns zero results |
| No `role="img"` with `aria-label="Map placeholder, coming soon"` remains in CategoryDetailScene | Pending | `grep -r 'Map placeholder' src/` returns zero results |
| `CoverageMap` is dynamically imported with `ssr: false` | Pending | Code review: `next/dynamic` with `{ ssr: false }` |
| Morph reverse (Escape) unmounts map cleanly with no WebGL errors | Pending | DevTools console clean after drill-in -> Escape |
| `maplibre-overrides.css` import added to `layout.tsx` after `globals.css` import | Pending | Code review |
| Full morph cycle through 3+ categories works end-to-end | Pending | Manual test: Seismic -> back -> Weather -> back -> Conflict -> back |

### Project-Wide Exit Criteria (Phase 4 = Final Phase)

| Criterion | Met? | Evidence |
|-----------|------|----------|
| All 8 work areas (WA1-WA8) gated and complete | Pending | All phase exit criteria from Phases 1-4 verified |
| Coverage grid renders with live Supabase data on the launch page | Pending | Visual + network inspection |
| Morph drill-down works for any category with data-driven detail view | Pending | Full morph cycle through multiple categories |
| Map renders in detail view with severity-colored markers | Pending | Phase 4 gate criterion |
| Chrome elements show TarvaRI branding and intel pipeline labels | Pending | Phase 3 WS-3.2 gate |
| Ambient panels positioned correctly around wider grid | Pending | Phase 3 WS-3.2 gate |
| No references to legacy 6-district hardcoded data in active code | Pending | `grep -r 'agent-builder\|tarva-chat\|project-room\|tarva-core\|tarva-erp\|tarva-code' src/ --include='*.ts' --include='*.tsx'` excludes `_archived/` |
| `pnpm typecheck` passes | Pending | CLI exit code 0 |
| `pnpm build` succeeds | Pending | CLI exit code 0 |
| No runtime errors in browser console during full user journey | Pending | DevTools console |

## 8. Post-Project Considerations

Phase 4 is the final phase. There is no "next phase" requiring inputs. Instead, this section captures post-project items that should be addressed after the coverage grid launch page is complete.

### 8.1 Production Tile Source (OQ-30)

CARTO dark-matter is suitable for development and initial launch but is not ideal for production at scale. Evaluate:

- **MapTiler:** API key required; generous free tier (100K tiles/month); premium dark tiles with better detail at high zoom; commercial support.
- **Protomaps:** Self-hosted PMTiles; one-time generation cost; offline-capable; no external dependency; requires hosting infrastructure.
- **Stadia Maps:** API key required; competitive free tier; good dark style options.

The tile source is a single URL string in `CoverageMap.tsx` (`mapStyle` prop). Swapping requires changing one line and (for key-based services) adding an environment variable. No code changes to the map component, layers, or popup.

### 8.2 Performance Monitoring

With MapLibre adding ~200KB gzipped to the on-demand bundle:

- **Measure:** Track the map chunk's load time in production. The morph animation provides a ~600ms loading window. If the chunk takes longer (slow connections, large datasets), users see the `loading` fallback.
- **Baseline:** Establish a bundle-size baseline with `pnpm build` output sizes. Add a CI check that fails if the map chunk exceeds a threshold (e.g., 300KB gzipped) to catch accidental dependency bloat.
- **Marker performance:** Monitor frame rate with 500+ markers on lower-end devices. MapLibre's WebGL rendering should handle 1000 markers at 60fps, but real-world performance depends on device GPU, marker count, and clustering configuration. The `clusterRadius` (currently 50px) and `.limit(1000)` in the data hook are the primary tuning knobs.

### 8.3 Visual Regression Tests

The coverage grid launch page is now a complex, multi-state UI:

- **States to capture:** Z0 icon view, Z1 card view, Z1 with morph active, detail view with populated map, detail view with empty map, map popup open, map with clusters, map fully zoomed to individual markers.
- **Tool recommendation:** Playwright screenshot tests against a seeded Supabase instance. The existing `pnpm test:e2e` script (Playwright) referenced in the root CLAUDE.md can be extended.
- **Critical regression vectors:** MapLibre CSS overrides leaking to non-map components; popup styling reverting to MapLibre defaults after library update; cluster circle sizing at different zoom levels.

### 8.4 MASTER-PLAN.md Creation (Recurring Gap -- Phase 1 Gap 6, Phase 2 Gap 5, Phase 3 Gap 7)

Now that all four phases are fully specified, `docs/plans/new-launch-page/MASTER-PLAN.md` should be created as a final project documentation artifact. It should:

- Formalize the 4-phase structure with links to each phase overview and review document.
- Track OQ resolution status (open, resolved, carried, deferred to post-project).
- Provide a single status dashboard showing all 8 work areas with gate status.
- List all 45 Architecture Decisions (AD-01 through AD-45) as a consolidated registry.
- Serve as the entry point for any future developer who needs to understand why the launch page was rebuilt.

This is a 1--2 hour documentation task that should be completed after Phase 4 gate verification.

### 8.5 `output: 'export'` Configuration

The combined-recommendations document (Phase 2 scope) mentions configuring `next.config.ts` with `output: 'export'` for GitHub Pages static export and removing `/api/*` routes. This was not included in any workstream SOW. After Phase 4 is complete, a follow-up task should:

- Add `output: 'export'` to `next.config.ts`.
- Remove or archive `/api/*` routes under `src/app/api/`.
- Set up GitHub Pages deployment (build + push `out/` to `gh-pages` branch).
- Verify that `pnpm build` with `output: 'export'` succeeds with the dynamically imported MapLibre component.

### 8.6 Supabase Auth Migration

Per CLAUDE.md, the app currently uses passphrase auth (inherited from tarva-launch). The plan is to swap for Supabase Auth (email/magic link) shared with the rest of SafeTrekr. This is independent of the coverage grid work and should be scheduled as a separate project.

### 8.7 Deferred Feature Enhancements

Several features were explicitly deferred during the 4-phase project:

| Feature | Source | Rationale for Deferral |
|---------|--------|----------------------|
| Alert detail page (click alert -> full detail) | OQ-21, OQ-32 | No destination view exists. Requires new page design. |
| Severity filter within map view | OQ-31 | Hook supports it; needs UI design for filter control. |
| Non-Point geometry rendering (polygons, lines) | WS-4.1 Out of Scope | `toMarkers()` filters to Points only. Polygon rendering requires additional layer types. |
| Marker animation/transition effects | WS-4.1 Out of Scope | Static markers sufficient for dashboard. Animated entry is polish. |
| Category sparklines (source count over time) | OQ-14 | Historical data not available from `intel_sources`. |
| Realtime marker updates (Supabase Realtime) | WS-4.1 Out of Scope | 30-second polling via TanStack Query sufficient. Realtime adds connection management complexity. |
| SystemStatusPanel content rewrite | OQ-27 | Panel is decorative ambient instrumentation. Content uses enrichment store mock data. |
| ActivityTicker static fallback event replacement | OQ-28 | Static events are fallback data using legacy district IDs. Will be replaced when enrichment engine generates coverage-aware events. |

## 9. Gaps and Recommendations

### Gap 1: Bundle Size Monitoring Not Formalized (CTA)

MapLibre GL JS (~200KB gzipped) is the largest single dependency addition. While the dynamic import strategy correctly defers the cost, there is no mechanism to detect bundle size regression if future changes (e.g., adding MapLibre plugins, switching to a heavier tile library, or accidentally importing MapLibre in a non-dynamic module) increase the initial page bundle.

**Recommendation:** After Phase 4 implementation, add a `pnpm build` size check to the CI pipeline. Record the baseline size of the `CoverageMap` chunk and the initial page bundle. Fail the build if either exceeds a threshold (e.g., initial bundle +5%, map chunk >300KB gzipped). This is a 30-minute CI configuration task.

### Gap 2: No Test Deliverables (SPO + CTA -- Recurring, 4th consecutive phase)

WS-4.1 includes no test files as formal deliverables. This continues the pattern from Phase 1 (Gap 1), Phase 2 (Gap 1), and Phase 3 (Gap 3). The map component has several testable concerns: GeoJSON conversion, relative time formatting, severity color mapping, bounds calculation, WebGL error detection, and dynamic import behavior.

**Recommendation:** Add the following as formal deliverables or immediate post-phase tasks:

- `src/components/coverage/__tests__/map-utils.test.ts` -- Unit tests for `markersToGeoJSON()`, `buildCircleColorExpression()`, and `formatRelativeTime()`. These are pure functions with no React or MapLibre dependency; highly testable.
- `src/components/coverage/__tests__/CoverageMap.test.tsx` -- Integration test verifying dynamic import, loading state, empty state, and error state rendering (mock MapLibre). Does not require a real WebGL context.
- Manual test script covering all 36 acceptance criteria (AC-1 through AC-36) from WS-4.1 Section 5. Can be executed during gate verification.

### Gap 3: MapLibre CSS Override Fragility (CTA)

The `maplibre-overrides.css` file uses `!important` on all overrides to ensure they win against MapLibre's default styles. While this works today, a future MapLibre version could change class names, add higher-specificity selectors, or restructure its CSS architecture. The overrides would silently fail, reverting to white-background popups and light-themed controls.

**Recommendation:** Add a visual regression test that captures the map popup and navigation control styling. If a MapLibre version bump causes a visual regression, the test will catch it. The override file should also include a comment documenting the MapLibre version it was tested against (currently v5.1.x).

### Gap 4: `ExpressionSpecification` Type Import from `maplibre-gl` (CTA)

`map-utils.ts` imports `ExpressionSpecification` from `maplibre-gl` for typing the `buildCircleColorExpression()` return value. While this is a type-only import, it must use the `import type` syntax to ensure TypeScript/webpack does not emit a runtime import of the `maplibre-gl` module. If `map-utils.ts` is imported by a server-rendered module (even indirectly), a runtime import of `maplibre-gl` would cause `window is not defined`.

**Recommendation:** Verify that `map-utils.ts` uses `import type { ExpressionSpecification } from 'maplibre-gl'` (with the `type` keyword). Alternatively, type the return value as a generic array type (e.g., `unknown[]`) to eliminate the `maplibre-gl` import entirely from the utility module. The latter approach is safer for static export compatibility.

### Gap 5: CARTO Dark-Matter Attribution Compliance (SPO)

WS-4.1 Decision D-8 hides the MapLibre attribution control via `attributionControl={false}`, stating that CARTO's style JSON includes attribution metadata in the tile response. However, CARTO's terms of service may require visible attribution in the map UI. The SOW acknowledges this ("If explicit attribution is required by CARTO's terms, a discrete text link can be added") but does not resolve it.

**Recommendation:** Before launch, review CARTO's terms of service for dark-matter tiles. If visible attribution is required, add a small, styled attribution link below the map (e.g., `<a>` with `font-size: 8px; color: rgba(255,255,255,0.2)`). This is a 5-minute addition that prevents a compliance issue.

### Gap 6: OQ-07 Four-Phase Carry-Forward (SPO -- Critical)

`intel_sources.id` column ambiguity (OQ-07) has been flagged as blocking since Phase 1 Review and carried forward through every subsequent phase overview. It is now a four-phase carry-forward. WS-3.1's source health table and (transitively) WS-4.1 both depend on correct field resolution.

**Recommendation:** This is a critical process failure. The resolution requires a single SQL query against the live Supabase instance (10-minute task). It should have been resolved before Phase 2 started. Resolve immediately and update the `IntelSourceRow` type in WS-1.3 if needed. Do not carry this item to a fifth document.

### Gap 7: No `output: 'export'` Verification with MapLibre (CTA)

The app targets GitHub Pages via Next.js static export (`output: 'export'` in `next.config.ts`), but this configuration has not yet been added (it was listed as Phase 2 scope in the combined-recommendations but not included in any workstream SOW). The `next/dynamic` with `ssr: false` pattern is documented as compatible with static export, but this has not been verified with MapLibre's specific module structure.

**Recommendation:** After Phase 4, add `output: 'export'` to `next.config.ts` and run `pnpm build` to verify. If MapLibre causes issues during static generation (e.g., webpack analyzing the dynamic import differently in export mode), the fix is likely adding `maplibre-gl` to `transpilePackages` or adjusting the dynamic import boundary. This should be tested before the GitHub Pages deployment pipeline is set up.

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream | Estimated Effort | Complexity | Agent | Notes |
|------------|-----------------|------------|-------|-------|
| WS-4.1 Map Feature | 8--12 hours | HIGH | react-developer | 4 new component/utility files (~350 lines total: CoverageMap ~150 lines, MapMarkerLayer ~60 lines, MapPopup ~50 lines, map-utils ~90 lines). 1 new CSS file (~60 lines). 1 file update (CategoryDetailScene placeholder replacement, ~15 lines changed). 1 import addition (layout.tsx, 1 line). 2 new npm dependencies. Main effort: CoverageMap component with auto-bounds, popup state, cluster expansion, loading/error/empty states, accessibility, and dynamic import wiring. |
| **Phase 4 Total** | **8--12 hours** | | | |

### Resource Loading

Single agent (react-developer). No parallelization opportunity within Phase 4 since there is only one workstream. However, all deliverables within WS-4.1 are independent until the integration step (Deliverable 4.6), so the implementation order is: 4.1 (install) -> 4.2 (utils) -> 4.3 (popup) and 4.4 (layer) in parallel -> 4.5 (map component) -> 4.6 (scene integration) -> 4.7 (CSS) -> 4.8 (verification).

### Prerequisites

All of the following must be gated before WS-4.1 can begin:

| Prerequisite | Status | Blocking? |
|-------------|--------|-----------|
| WS-1.2 gated (types: `SEVERITY_LEVELS`, `SEVERITY_COLORS`, `getCategoryMeta()`) | Created by Phase 1 | Yes |
| WS-1.3 gated (data: `useCoverageMapData`, `calculateBounds`, `MapMarker` type) | Created by Phase 1 | Yes |
| WS-3.1 gated (district view: `CategoryDetailScene` with map placeholder) | Created by Phase 3 | Yes -- on critical path |
| OQ-07 resolved (`intel_sources` schema verified) | **Unresolved (4-phase carry)** | Yes -- blocks WS-3.1 which blocks WS-4.1 |
| WS-3.2 gated (chrome & panels) | Created by Phase 3 | No -- off critical path |

### Recommended Execution Order

```
Prerequisites (must be complete):
  All Phase 1, Phase 2, Phase 3 workstreams gated
  OQ-07 resolved (intel_sources schema)

Implementation:
  [1] Install dependencies (pnpm add) ......... 0.5h
      Verify: pnpm list, pnpm typecheck, pnpm build
  [2] Create map-utils.ts ..................... 1h
      Verify: type-only import of maplibre-gl, pure functions
  [3] Create MapPopup.tsx ..................... 1h
      Verify: standalone render in isolation (Storybook or inline test)
  [4] Create MapMarkerLayer.tsx ............... 1.5h
      Verify: layer definitions compile, click handler typed
  [5] Create CoverageMap.tsx .................. 3-4h (main effort)
      Verify: auto-bounds, popup state, loading/error/empty,
              cluster expansion, accessibility, keyboard nav
  [6] Create maplibre-overrides.css ........... 0.5h
      Add import to layout.tsx
  [7] Integrate into CategoryDetailScene ...... 1h
      Replace placeholder, wire dynamic import, verify ssr:false
  [8] Gate verification ....................... 1h
      Run all 36 acceptance criteria (AC-1 through AC-36)
      Full morph cycle through 3+ categories
      DevTools console clean, pnpm typecheck, pnpm build

Total: 9.5-11.5h (aligns with 8-12h estimate)
```

### Schedule Risk Assessment

- **Best case:** 8 hours across 1 day. All dependencies are in good shape from prior phases. MapLibre + react-map-gl install cleanly with React 19 and Next.js 16. CARTO tiles load reliably. Auto-bounds calculation works correctly on first attempt. CSS overrides cover all MapLibre controls.
- **Expected case:** 10 hours across 1.5 days. Minor iteration on CoverageMap styling (popup position offset, cluster circle sizing, navigation control placement). One round of bounds calculation tuning (padding, maxZoom values). CSS override adjustments for edge cases (attribution control visibility, popup tip arrow color).
- **Worst case:** 16 hours across 2 days. `react-map-gl` v8 has a compatibility issue with React 19 or MapLibre v5, requiring version pinning or fallback to v7 (+2h). `maplibre-gl` causes `window is not defined` during build despite `ssr: false`, requiring investigation of transitive imports (+2h). CARTO dark-matter CDN has intermittent issues in the development environment, requiring tile source debugging or fallback (+1h). `calculateBounds()` returns unexpected values for edge cases (antimeridian-crossing data, single-point categories), requiring utility fixes (+1h).
- **Overall Phase 4 schedule risk:** MEDIUM. The primary risk is library compatibility (React 19 + MapLibre v5 + react-map-gl v8 + Next.js 16 is a relatively new combination). The implementation itself is well-specified with detailed code sketches. The SSR/static-export concern is mitigated by the standard `next/dynamic` pattern but should be verified immediately after dependency installation.

### Comparison to Prior Phases

Phase 4 is the smallest phase by effort (8-12h vs Phase 1: 12-18h, Phase 2: 18-26h, Phase 3: 14-20h) and by file count (4 new + 1 CSS + 2 modified vs Phase 2: 22 files touched). The complexity is concentrated in a single component (`CoverageMap.tsx`) rather than spread across interconnected files. The risk profile shifts from "animation fidelity" (Phase 2) and "data shape compatibility" (Phase 3) to "third-party library integration" (Phase 4), which is more binary -- it either works or it does not -- and therefore faster to diagnose.

### Full Project Summary

| Phase | Workstreams | Estimated Effort | Effective Duration (parallel) | Primary Risk |
|-------|-------------|-----------------|-------------------------------|-------------|
| Phase 1: Foundation | WS-1.1, WS-1.2, WS-1.3 | 12--18h | 12--18h (serial) | Type cascade, Supabase schema mismatch |
| Phase 2: Core UI | WS-2.1, WS-2.2 | 18--26h | 18--26h (serial) | Morph system rewrite, animation fidelity |
| Phase 3: Detail + Chrome | WS-3.1, WS-3.2 | 14--20h | 10--14h (parallel) | Data shape compatibility, upstream readiness |
| Phase 4: Map | WS-4.1 | 8--12h | 8--12h (single WS) | Library compatibility, SSR/WebGL |
| **Total** | **8 workstreams** | **52--76h** | **48--70h** | |

The full project spans approximately 48--70 effective hours across 4 phases. If a single developer executes all workstreams serially, this is approximately 7--9 working days. With parallel execution in Phase 3, the effective duration reduces to approximately 6--8 working days.