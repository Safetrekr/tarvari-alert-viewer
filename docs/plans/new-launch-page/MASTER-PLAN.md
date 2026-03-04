# MASTER-PLAN.md

> **Project:** TarvaRI Alert Viewer -- Coverage Grid Launch Page
> **Status:** PLANNING COMPLETE -- Ready for Implementation
> **Created:** 2026-03-04
> **Last Updated:** 2026-03-04
> **Author:** Synthesis Lead (`chief-technology-architect`)
> **Phases:** 4/4 planned, 4/4 reviewed, 0/4 implemented

---

## 1. Executive Summary

Replace the tarva-launch capsule ring (6 hardcoded districts in a circular layout) with a coverage-category card grid backed by live TarvaRI intel data. The spatial ZUI engine, ambient effects, morph choreography, header/footer, and navigation HUD all stay. The old ring becomes a CSS Grid of coverage category cards. Clicking a card triggers the existing morph drill-down into a data-driven district view populated with filtered alerts, severity breakdown, source health, and an interactive MapLibre map.

**Scope:** ~16 new files, ~18 modified, ~20+ archived. 8 workstreams across 4 phases. 45 architecture decisions. 34 open questions tracked. 15 issues logged. All 4 phase reviews passed (PASS WITH ISSUES). All SOWs graded A or A-.

**Total estimated effort:** 48--70 effective hours (6--9 working days for a single developer).

**Key decisions preserved from discovery:**
- Keep the spatial ZUI, ambient effects, header/footer -- the visual design stays
- Keep Launch-to-District drill-down -- clicking a category card opens a district view
- Direct Supabase queries (not TarvaRI API) -- client-side only, static export target
- Client-side aggregation -- `intel_sources` is ~38 rows, no server rollups needed
- Two queries total -- `useCoverageMetrics()` + `useCoverageMapData()`

---

## 2. Phase Structure

| Phase | Title | Workstreams | Est. Effort | Effective Duration | Primary Risk | Gate |
|-------|-------|-------------|-------------|--------------------|-------------|------|
| 1 | Foundation | WS-1.1, WS-1.2, WS-1.3 | 11--15h | 11--15h (serial) | Type cascade, Supabase schema mismatch | PASS |
| 2 | Core UI | WS-2.1, WS-2.2 | 18--26h | 18--26h (serial) | Morph system rewrite, animation fidelity | PASS |
| 3 | Detail + Chrome | WS-3.1, WS-3.2 | 14--20h | 10--14h (parallel) | Data shape compatibility, upstream readiness | PASS |
| 4 | Map | WS-4.1 | 8--12h | 8--12h (single WS) | Library compatibility, SSR/WebGL | PASS |
| **Total** | | **8 workstreams** | **51--73h** | **47--67h** | | **4/4 PASS** |

### Phase Summaries

**Phase 1 -- Foundation:** Invisible to end users. Archives the current page, widens `DistrictId` to `NodeId = string`, introduces 15-category coverage metadata, creates TanStack Query hooks and Zustand store for live Supabase data. No runtime behavior changes. Gate: `pnpm typecheck` passes, hooks return data.

**Phase 2 -- Core UI:** First visible changes. Replaces capsule ring with CSS Grid of CategoryCards, rewires morph drill-down from ring rotation to scale+fade animation, replaces `?district=` URL param with `?category=`, archives 9 ring-era files. Gate: grid renders with live data, full morph cycle works.

**Phase 3 -- Detail + Chrome:** Two parallel workstreams. WS-3.1 creates the data-driven CategoryDetailScene with alert list, severity breakdown, source health, and map placeholder. WS-3.2 updates chrome labels to TarvaRI branding, repositions ambient panels for wider grid. Gate: morph into any category shows live data, chrome shows TarvaRI identity.

**Phase 4 -- Map:** Installs MapLibre GL JS, creates interactive map in the district view overlay (outside CSS transforms), replaces the WS-3.1 placeholder. Severity-colored markers, clustering, popups, auto-bounds. Gate: map renders with filtered markers for any category.

---

## 3. Workstream Registry

| WS ID | Title | Phase | Agent | Dependencies | Status | Est. Effort | Complexity |
|-------|-------|-------|-------|-------------|--------|-------------|------------|
| WS-1.1 | Archive Current Page | 1 -- Foundation | `general-purpose` | None | Planned | 0.5h | LOW |
| WS-1.2 | Type Foundation | 1 -- Foundation | `react-developer` | None | Planned | 4--6h | MEDIUM |
| WS-1.3 | Data Layer | 1 -- Foundation | `react-developer` | WS-1.2 | Planned | 6--8h | MEDIUM |
| WS-2.1 | Coverage Grid | 2 -- Core UI | `react-developer` | WS-1.2, WS-1.3 | Planned | 8--12h | HIGH |
| WS-2.2 | Morph Adaptation | 2 -- Core UI | `react-developer` | WS-1.2, WS-2.1 | Planned | 10--14h | HIGH |
| WS-3.1 | District View Adaptation | 3 -- Detail + Chrome | `react-developer` | WS-1.2, WS-1.3, WS-2.2 | Planned | 10--14h | HIGH |
| WS-3.2 | Chrome & Panels | 3 -- Detail + Chrome | `react-developer` | WS-1.2 | Planned | 4--6h | LOW-MEDIUM |
| WS-4.1 | Map Feature | 4 -- Map | `react-developer` | WS-1.2, WS-1.3, WS-3.1 | Planned | 8--12h | HIGH |

### Workstream Deliverable Summary

| WS ID | New Files | Modified Files | Archived Files | Key Deliverables |
|-------|-----------|----------------|----------------|------------------|
| WS-1.1 | 1 | 0 | 0 | `page.archived.tsx` |
| WS-1.2 | 1 | ~8 (import updates) | 0 | `coverage.ts` module, `NodeId` type, `DistrictId` alias |
| WS-1.3 | 5 | 1 | 0 | `useCoverageMetrics`, `useCoverageMapData`, `coverage-utils.ts`, `coverage.store.ts`, Supabase types |
| WS-2.1 | 5 | 2 | 0 | `CoverageGrid`, `CategoryCard`, `CategoryIconGrid`, `CoverageOverviewStats`, `coverage.css` |
| WS-2.2 | 0 | 6 | 9 | Morph rewrite (orchestrator, choreography, panel, CSS, types, variants) |
| WS-3.1 | 1 | 5 | 6 | `CategoryDetailScene`, district-view chrome rewrites, H-1 fix |
| WS-3.2 | 0 | 8 | 0 | Telemetry bar, status strip, minimap, panel positions, constants |
| WS-4.1 | 5 | 2 | 0 | `CoverageMap`, `MapMarkerLayer`, `MapPopup`, `map-utils.ts`, `maplibre-overrides.css` |

---

## 4. Critical Path

```
WS-1.1 (archive) .............. immediate, off critical path
       |
WS-1.2 (types) ................ Phase 1 -- CRITICAL PATH START
       |
       +-- WS-1.3 (data layer) . Phase 1
       |        |
       |        +-- WS-2.1 (grid) ......... Phase 2
       |        |        |
       |        |        +-- WS-2.2 (morph) . Phase 2
       |        |                 |
       |        |                 +-- WS-3.1 (district view) . Phase 3
       |        |                          |
       |        |                          +-- WS-4.1 (map) . Phase 4 -- CRITICAL PATH END
       |        |
       |        +-- (data also consumed by WS-3.1, WS-4.1)
       |
       +-- WS-3.2 (chrome) .... Phase 3 -- OFF CRITICAL PATH (parallel with WS-3.1)
```

**Critical path:** WS-1.2 -> WS-1.3 -> WS-2.1 -> WS-2.2 -> WS-3.1 -> WS-4.1

**Off critical path:** WS-1.1 (any time before Phase 2), WS-3.2 (after WS-1.2, parallel with anything)

**Parallelization opportunities:**
- WS-1.1 can run in parallel with any Phase 1 workstream
- WS-3.1 and WS-3.2 execute in parallel (disjoint file sets verified)
- WS-3.2 could overlap with Phase 2 workstreams (depends only on WS-1.2)
- No parallelization within Phase 2 (WS-2.1 and WS-2.2 modify shared files)

---

## 5. Architecture Decision Log

### Phase 1 -- Foundation (AD-01 through AD-12)

| ID | Decision | Source | Rationale |
|----|----------|--------|-----------|
| AD-01 | Archive current page to `page.archived.tsx` with export removed | WS-1.1 | Co-location preserves IDE context; `.archived.tsx` suffix is not a Next.js route convention |
| AD-02 | Widen `DistrictId` to `type NodeId = string` | WS-1.2 | Categories are data-driven from Supabase; union requires code changes for every new category |
| AD-03 | Keep `DistrictId` as deprecated alias for `NodeId` | WS-1.2 | Minimizes diff size (22 files untouched); files slated for archival compile without changes |
| AD-04 | Use `Partial<Record<string, X>>` for sparse legacy lookups | WS-1.2 | Forces `undefined` handling at call sites where `undefined` is a real possibility |
| AD-05 | Store Lucide icon references as string names, not components | WS-1.2 | Preserves tree-shaking; decouples type module from React |
| AD-06 | CSS custom properties with hex fallbacks for category colors | WS-1.2 | Enables future theming without constant changes; consistent with `HEALTH_STATE_MAP` pattern |
| AD-07 | Extract data transformation into pure `coverage-utils.ts` | WS-1.3 | Independently testable without React hook wrappers |
| AD-08 | Use `string` for categorical fields in Supabase row types | WS-1.3 | Tolerates unexpected DB values; narrower union types at display layer |
| AD-09 | URL sync via standalone functions, not Zustand middleware | WS-1.3 | Keeps store pure and testable without browser globals |
| AD-10 | Differentiated refetch: 60s metrics, 30s map data | WS-1.3 | Reflects data change frequency |
| AD-11 | Cap `intel_normalized` query at 1000 rows | WS-1.3 | Prevents unbounded result sets; MapLibre handles 1000+ markers efficiently |
| AD-12 | No `persist` middleware on coverage store | WS-1.3 | URL is the persistence mechanism; localStorage would create stale state conflicts |

### Phase 2 -- Core UI (AD-13 through AD-25)

| ID | Decision | Source | Rationale |
|----|----------|--------|-----------|
| AD-13 | Grid container 1500x400px at world origin | WS-2.1 | Fits between ambient panels with ~130px clearance; two rows at 180px + gap |
| AD-14 | `@tarva/ui Card` as base with glass effect overlay | WS-2.1 | Reuses shared component library; consistent padding/border-radius |
| AD-15 | Static icon lookup map for Lucide icons | WS-2.1 | Dynamic loading not supported at build time; static map is explicit and type-safe |
| AD-16 | Morph drill-down non-functional in WS-2.1 | WS-2.1 | Ring-specific geometry does not apply; morph is WS-2.2 scope |
| AD-17 | `CategoryIconGrid` same 1500x400px footprint as grid | WS-2.1 | Z0-to-Z1 crossfade reads as icons expanding into cards in place |
| AD-18 | `CoverageOverviewStats` in world-space, not fixed HUD | WS-2.1 | Stats should zoom with spatial canvas; fixed HUD breaks spatial metaphor |
| AD-19 | Category CSS properties in feature-scoped `coverage.css` | WS-2.1 | Follows existing pattern (morph.css, enrichment.css, atrium.css) |
| AD-20 | Detail panel always docks right, no left/right decision | WS-2.2 | Grid is centered; eliminates `computeRingRotation`, `PanelSide` branching |
| AD-21 | Remove connector lines entirely | WS-2.2 | Scale+fade makes selection unambiguous; cross-coordinate math is fragile |
| AD-22 | Archive connector-lines.tsx with 8 other ring-era files | WS-2.2 | Preserves code for reference; consistent with archive pattern |
| AD-23 | Selected card variant: `scale: 1.2, opacity: 1` | WS-2.2 | Decision 3 states "scales to 1.2x"; provides visual anchor for the panel |
| AD-24 | Variant transition 0.4s to match `MORPH_TIMING.expanding` | WS-2.2 | Aligns visual transition with phase timer; 50ms mismatch eliminated |
| AD-25 | Rename URL param from `district` to `category` | WS-2.2 | Clean terminology break; Decision 7 specifies `?category={id}` |

### Phase 3 -- Detail + Chrome (AD-26 through AD-37)

| ID | Decision | Source | Rationale |
|----|----------|--------|-----------|
| AD-26 | Single `CategoryDetailScene` for all categories | WS-3.1 | 15+ categories make per-category scenes impractical; data-driven approach |
| AD-27 | `getCategoryTint()` extracts hex from CSS `var()` string | WS-3.1 | Inline `style` cannot use `var()` inside `rgba()` in computed gradient |
| AD-28 | `getPanelSideForCategory()` always returns `'right'` | WS-3.1 | WS-2.2 removed ring rotation; grid layout docks panel right |
| AD-29 | Keep `districtId` prop name in overlay/dock/header | WS-3.1 | Renaming cascades through 4 files for zero functional benefit; type covers semantic shift |
| AD-30 | `CategoryPanelContent` (H-1 fix) inline in detail-panel | WS-3.1 | ~30 lines, single consumer, transitional bridge content |
| AD-31 | Map placeholder uses styled `<div>`, not WebGL stub | WS-3.1 | Avoids MapLibre dependency in this workstream; WS-4.1 mounts fresh |
| AD-32 | Condensed center label `'TARVARI // COVERAGE MONITOR'` | WS-3.2 | Limited horizontal space (7px font); shorter text reads better |
| AD-33 | Single `INTEL_HEALTH_LABELS` replaces per-district labels | WS-3.2 | Coverage monitor views pipeline stages, not individual subsystems |
| AD-34 | Asymmetric panel shifts (x:-200 left, x:+220 right) | WS-3.2 | Reflects different panel widths; creates 170--350px clearance |
| AD-35 | Minimap bounds hardcoded +/-1800 x +/-800 | WS-3.2 | Static bounds match existing pattern; dynamic adds complexity for rare changes |
| AD-36 | Hub center dot removed from Minimap | WS-3.2 | Grid has no central hub concept; center marker would be misleading |
| AD-37 | Feed panel two-step lookup (category first, then legacy) | WS-3.2 | Handles both new category and legacy district targets during transition |

### Phase 4 -- Map (AD-38 through AD-45)

| ID | Decision | Source | Rationale |
|----|----------|--------|-----------|
| AD-38 | CARTO dark-matter tiles for dev and launch | WS-4.1 | Free, no API key, dark theme, global coverage; single URL swap for production |
| AD-39 | Color markers by severity, not category | WS-4.1 | Map already filters to one category; severity shows risk density |
| AD-40 | MapLibre GeoJSON source with circle layers, not HTML Markers | WS-4.1 | WebGL-rendered handles 1000 markers at 60fps; zero DOM per marker |
| AD-41 | Built-in MapLibre clustering, not Supercluster | WS-4.1 | GPU-computed, configurable, no additional dependency |
| AD-42 | `next/dynamic` with `ssr: false` for map import | WS-4.1 | Completely excludes module from server bundle; standard Next.js pattern |
| AD-43 | MapLibre CSS via dedicated override file with `@import` | WS-4.1 | Global import prevents FOUC; co-locates all overrides; follows existing pattern |
| AD-44 | `react-map-gl/maplibre` entry point, not runtime `mapLib` prop | WS-4.1 | First-class MapLibre types; tree-shakes Mapbox code |
| AD-45 | Hide attribution control; rely on tile source metadata | WS-4.1 | Default UI visually noisy in constrained quadrant; compliance review recommended |

---

## 6. Open Questions Registry

### Resolved

| ID | Question | Resolved In | Resolution |
|----|----------|-------------|------------|
| OQ-03 | Should `DistrictMeta.ringIndex` be widened to `number`? | Phase 2 | Moot. WS-2.2 archives ring-era files; `ringIndex` no longer referenced. |
| OQ-04 | Should CSS custom properties for category colors be defined in Phase 1? | Phase 2 | Deferred to WS-2.1, which creates `coverage.css` with all 15 tokens. |
| OQ-09 | When should `useInitialDistrictFromUrl` be deprecated? | Phase 2 | WS-2.2 should remove or disable this hook when renaming URL param. |

### Open -- Blocking

| ID | Question | Source | Blocking For | Assigned To | Action Required |
|----|----------|--------|-------------|-------------|-----------------|
| OQ-07 | Does `intel_sources` have a UUID `id` column? How does `intel_normalized.source_id` relate to it vs `source_key`? | WS-1.3, Phase 1 Review H-1 | WS-3.1, WS-4.1 | react-developer | Run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'intel_sources'` against live Supabase. **4-phase carry-forward. Resolve immediately.** |
| OQ-11* | Does `CategoryMeta` include `description: string`? | Phase 3 Overview Gap 1 | WS-3.1 | react-developer | Verify WS-1.2 `CategoryMeta` interface includes `description`. If absent, add to `KNOWN_CATEGORIES`. |

### Open -- Non-Blocking

| ID | Question | Source | Target Phase | Recommendation |
|----|----------|--------|-------------|----------------|
| OQ-01 | Should `LEGACY_DISTRICT_IDS` be removed in WS-2.2 or kept longer? | WS-1.2 | Phase 2 | Remove during WS-2.2 capsule archival. |
| OQ-02 | Should `SCENE_MAP` return `null` or placeholder for unknown IDs? | WS-1.2 | Phase 1 | Return `null`. |
| OQ-05 | Should `useCoverageMapData` support an `orderBy` param? | WS-1.3 | Phase 4 | Defer. |
| OQ-06 | Should `intel_normalized` queries include a date range filter? | WS-1.3 | Phase 3 | Add 7-day default to prevent unbounded sets. |
| OQ-08 | Should coverage store hold `selectedSeverity` and `dateRange`? | WS-1.3 | Phase 4 | Defer to WS-4.1. |
| OQ-10 | Should `CategoryCard` show geographic regions? | WS-2.1 | Phase 2 | Defer to district view. Card is 160x180px, tight for extra text. |
| OQ-11 | Should `CoverageOverviewStats` position be in a shared module? | WS-2.1 | Phase 2 | Keep inline, consistent with existing pattern. |
| OQ-12 | Should `CategoryIconGrid` aggregate metrics bar reuse `GlobalMetrics`? | WS-2.1 | Phase 2 | Create new. `GlobalMetrics` reads legacy `districtsStore`. |
| OQ-13 | Grid with < 8 categories: stretch or left-align? | WS-2.1 | Phase 2 | Left-align (default CSS Grid behavior). |
| OQ-14 | Should `CategoryCard` include sparkline for count over time? | WS-2.1 | Phase 3+ | Defer until historical data is available. |
| OQ-15 | Should `CategoryGridItem` include `gridIndex`? | WS-2.1 | Phase 2 | Rely on array index. CSS Grid positions by document order. |
| OQ-16 | Should detail panel resolve category display name now? | WS-2.2 | Phase 2 | Resolve now (one-line import). |
| OQ-17 | Should district view overlay show stub for category IDs? | WS-2.2 | Phase 2 | Leave blank until WS-3.1. |
| OQ-18 | Should DetailPanel portal target remain `document.body`? | WS-2.2 | Phase 2 | Keep. Works correctly, matches existing pattern. |
| OQ-19 | Should `capsuleStateVariants` rename to `cardStateVariants`? | WS-2.2 | Phase 2 | Rename in WS-2.2 (2-line change, aligns with terminology shift). |
| OQ-20 | Is 350ms Z0-to-Z1 flyTo delay sufficient? | WS-2.2 | Phase 2 | Yes, covers both camera zoom and crossfade. |
| OQ-21 | Should alert list items be clickable (link to alert detail)? | WS-3.1 | Post-Phase 4 | Display-only. No destination view exists. |
| OQ-22 | Severity breakdown: horizontal bar or donut chart? | WS-3.1 | Phase 3 | Horizontal bar. Simpler, reads well at small size. |
| OQ-23 | Should `shared-scene-primitives.tsx` be archived? | WS-3.1 | Phase 3 | Keep. Generic, well-documented, zero maintenance cost. |
| OQ-24 | Should `district-content.tsx` be archived? | WS-3.1 | Phase 3 | Yes, archive. Zero consumers after H-1 fix. |
| OQ-25 | Should dock support future "Open category dashboard" button? | WS-3.1 | Post-Phase 4 | No button. Navigation via morph back only. |
| OQ-26 | Should Minimap dots use per-category colors? | WS-3.2 | Phase 3 | Yes. Color variety provides identification. |
| OQ-27 | Should `SystemStatusPanel` content be stubbed? | WS-3.2 | Phase 3 | Leave as-is. Decorative ambient instrumentation. |
| OQ-28 | Should `ActivityTicker` fallback events use category IDs? | WS-3.2 | Phase 3 | Defer. Static events replaced when enrichment engine updates. |
| OQ-29 | Should all `APP_NAME` consumers be verified at WS-3.2 gate? | WS-3.2 | Phase 3 | Yes. Add grep-based check. |
| OQ-30 | What is the production tile source? | WS-4.1 | Post-launch | CARTO suitable for launch. Evaluate MapTiler, Protomaps, Stadia Maps. |
| OQ-31 | Should map support severity filter within category view? | WS-4.1 | Post-Phase 4 | Hook supports it. Needs UI design. |
| OQ-32 | Should marker popups include "View details" link? | WS-4.1 | Post-Phase 4 | No. Same timeline as OQ-21. |
| OQ-33 | Should cluster labels have custom font fallback? | WS-4.1 | Phase 4 | Accept system sans-serif. |
| OQ-34 | Should overrides use Tailwind `@layer` or `!important`? | WS-4.1 | Phase 4 | Plain CSS with `!important`. No class overlap with Tailwind. |

---

## 7. Issues Log

Consolidated from PLANNING-LOG.md. All 15 issues are open and tracked for resolution during implementation.

| # | Phase | SOW | Issue | Severity | Resolution | Status |
|---|-------|-----|-------|----------|------------|--------|
| 1 | 1 | WS-1.3 | `IntelSourceRow` missing `id` column | HIGH | Verify against live Supabase before WS-1.3 impl | Open |
| 2 | 1 | WS-1.3 | No test file deliverable for `coverage-utils.ts` | MEDIUM | Add as Deliverable 4.7 | Open |
| 3 | 1 | WS-1.3 | R-5 contradicts declared dependency | MEDIUM | Amend: parallel is emergency fallback only | Open |
| 4 | 2 | WS-2.2 | `DistrictContent` component not addressed in morph path | HIGH | Add placeholder/empty state in detail panel | Open |
| 5 | 2 | WS-2.1 | `CategoryCard` data attributes implicit contract | MEDIUM | Add explicit AC for `data-category-card`/`data-selected` | Open |
| 6 | 2 | WS-2.2 | URL param ownership ambiguous | MEDIUM | Clarify `syncCoverageFromUrl` vs `useInitialDistrictFromUrl` | Open |
| 7 | 3 | WS-3.1 | `detail-panel.tsx` line refs assume pre-WS-2.2 state | MEDIUM | Add note: refs must be re-verified after WS-2.2 | Open |
| 8 | 3 | ALL | No test deliverables (recurring, 3rd consecutive phase) | MEDIUM | Add `CategoryDetailScene.test.tsx` as deliverable | Open |
| 9 | 3 | WS-3.1 | `CoverageByCategory` field shape not verified vs WS-1.3 | MEDIUM | Add compile-time `satisfies` assertion | Open |
| 10 | 1-3 | WS-1.3-3.1 | `intel_sources.id` still unresolved (3 phases carried) | HIGH | Schema introspection required before implementation | Open |
| 11 | 3 | WS-3.1 | `CategoryMeta.description` not confirmed in WS-1.2 | HIGH | Verify or add to WS-1.2 deliverables | Open |
| 12 | 4 | WS-4.1 | `MapMarkerLayer` dead code (`handleClick`/`onMarkerClick`) | MEDIUM | Remove from component, make pure render | Open |
| 13 | 4 | WS-4.1 | `getClusterExpansionZoom` callback API may be outdated for v5 | MEDIUM | Verify against MapLibre v5 docs | Open |
| 14 | 4 | WS-4.1 | `react-map-gl` v8 + MapLibre v5 + React 19 compatibility | MEDIUM | Tighten version pinning | Open |
| 15 | 4 | ALL | No test deliverables (4th consecutive phase) | MEDIUM | Add `map-utils.test.ts` as deliverable | Open |

### Issue Severity Summary

| Severity | Count | Notes |
|----------|-------|-------|
| HIGH | 4 | Issues 1, 4, 10, 11 -- all must be resolved before implementation of dependent workstreams |
| MEDIUM | 11 | Actionable during implementation; none are blocking |

---

## 8. Risk Summary

Top risks across all phases, ordered by impact.

| Risk | Severity | Phase | Mitigation | Current Status |
|------|----------|-------|------------|----------------|
| `intel_sources` schema mismatch (OQ-07) | HIGH | 1-4 | Run schema introspection before WS-1.3 | **Unresolved -- 4-phase carry** |
| `CategoryMeta.description` missing from WS-1.2 | HIGH | 3 | Verify interface before WS-3.1 | **Unresolved** |
| DistrictContent gap during morph (Phase 2 H-1) | HIGH | 2-3 | WS-3.1 Section 4.6 resolves with `CategoryPanelContent` | Mitigation planned |
| DistrictId type cascade breaks build | HIGH | 1 | Deprecated alias absorbs blast radius; gate with `pnpm typecheck` | Mitigation designed |
| WebGL map inside CSS transforms | HIGH | 4 | Map placed in district view overlay (fixed position, no transforms); verified | Mitigation verified |
| Morph orchestrator rewrite breaks animations | HIGH | 2 | Phase state machine unchanged; only visual expression changes | Mitigation designed |
| react-map-gl v8 + MapLibre v5 + React 19 compat | MEDIUM | 4 | Tighten version pinning; verify immediately after install | Open |
| `CoverageByCategory` field name mismatch | MEDIUM | 3 | Add `satisfies` assertion at compile time | Open |
| MapLibre `getClusterExpansionZoom` API change | MEDIUM | 4 | Verify against v5 docs; update to Promise-based if needed | Open |
| `@tarva/ui Card` glass effect integration | LOW | 2 | `bg-black/70 backdrop-blur-sm` confirmed in exploration | Verified |
| Grid too wide at some zoom levels | LOW | 2 | CSS Grid responsive; cards wrap; test Z0-Z2 | Low risk |

---

## 9. Quality Gates

### Gate Criteria by Phase

**Phase 1 -- Foundation**

| Criterion | Status |
|-----------|--------|
| `page.archived.tsx` exists with no `export default` | Pending |
| Original `page.tsx` unmodified by Phase 1 work | Pending |
| `NodeId = string` exported from `district.ts` | Pending |
| `coverage.ts` exports all 13 symbols (15 categories, 5 severity levels, 4 source statuses) | Pending |
| All `Record<DistrictId, X>` in persisting files have runtime fallbacks | Pending |
| `pnpm typecheck` passes with zero errors | Pending |
| `useCoverageMetrics` returns data or graceful `emptyMetrics()` | Pending |
| `useCoverageMapData` returns `MapMarker[]` or graceful `[]` | Pending |
| Coverage store manages `selectedCategory` with URL sync | Pending |
| Existing launch page loads identically -- no visual regressions | Pending |

**Phase 1 Review Verdict:** PASS WITH ISSUES (A, A, B+ SOW grades)

**Phase 2 -- Core UI**

| Criterion | Status |
|-----------|--------|
| Grid renders with live Supabase data, `repeat(8, 1fr)` columns | Pending |
| Z0/Z1+ crossfade works via `AnimatePresence` | Pending |
| `CategoryCard` keyboard accessible (`role="button"`, `tabIndex`, Enter/Space) | Pending |
| Click card -> forward morph -> panel appears -> Escape reverses | Pending |
| Selected card 1.2x, siblings 0.3 opacity | Pending |
| URL updates to `?category={id}` on settle, clears on reverse | Pending |
| `morph-panels-scatter` pushes ambient panels during morph | Pending |
| All 9 archived files in `_archived/`, no active imports | Pending |
| `pnpm typecheck` passes, no console errors during full morph cycle | Pending |
| Reduced motion: all transitions instant | Pending |

**Phase 2 Review Verdict:** PASS WITH ISSUES (A, A- SOW grades)

**Phase 3 -- Detail + Chrome**

| Criterion | Status |
|-----------|--------|
| `CategoryDetailScene` renders for all 15 known categories without errors | Pending |
| Alert list, severity breakdown, source health table populated with live data | Pending |
| Loading skeleton, empty state, and error state render correctly | Pending |
| Overlay tint uses selected category color | Pending |
| No `SCENE_MAP`, `DISTRICT_TINTS`, or `STATION_CONFIG` in active code | Pending |
| H-1 fix: no `DistrictContent` import in `detail-panel.tsx` | Pending |
| Top bar: `'TARVARI // COVERAGE MONITOR'`; bottom strip: `['SRC','ING','NRM','BND','TRI','RTR']` | Pending |
| Minimap: up to 15 category dots, grid layout, no hub dot | Pending |
| All 4 panels at new positions (x:-1400, x:-1400, x:+1100, x:+1100) | Pending |
| `APP_NAME` = `'TarvaRI Alert Viewer'` | Pending |
| `pnpm typecheck` and `pnpm build` pass | Pending |

**Phase 3 Review Verdict:** PASS WITH ISSUES (A, A SOW grades)

**Phase 4 -- Map**

| Criterion | Status |
|-----------|--------|
| `maplibre-gl` and `react-map-gl` installed, `pnpm typecheck`/`pnpm build` pass | Pending |
| Map renders inside overlay (no CSS-transform ancestor) | Pending |
| CARTO dark-matter tiles, dark-themed controls | Pending |
| Markers severity-colored, cluster at low zoom, expand on click | Pending |
| Auto-bounds fit to category markers on drill-in | Pending |
| Marker popup: title, severity badge, relative timestamp | Pending |
| `role="application"`, `aria-roledescription="map"`, dynamic `aria-label` | Pending |
| `CoverageMap` dynamically imported with `ssr: false` | Pending |
| Morph reverse unmounts map cleanly, no WebGL errors | Pending |
| Full morph cycle through 3+ categories end-to-end | Pending |

**Phase 4 Review Verdict:** PASS WITH ISSUES (A- SOW grade)

### Project-Wide Exit Criteria

| Criterion | Status |
|-----------|--------|
| All 8 workstreams gated and complete | Pending |
| Coverage grid renders with live Supabase data on launch page | Pending |
| Morph drill-down works for any category with data-driven detail view | Pending |
| Map renders in detail view with severity-colored markers | Pending |
| Chrome shows TarvaRI branding and intel pipeline labels | Pending |
| No legacy 6-district hardcoded data in active code | Pending |
| `pnpm typecheck` and `pnpm build` pass | Pending |
| No runtime errors in browser console during full user journey | Pending |

---

## 10. Total Effort Estimate

### By Phase

| Phase | Workstreams | Estimated Effort | Effective Duration | Schedule Risk |
|-------|-------------|------------------|--------------------|--------------|
| 1 -- Foundation | 3 | 11--15h | 11--15h (serial) | LOW-MEDIUM |
| 2 -- Core UI | 2 | 18--26h | 18--26h (serial) | MEDIUM |
| 3 -- Detail + Chrome | 2 | 14--20h | 10--14h (parallel) | MEDIUM-LOW |
| 4 -- Map | 1 | 8--12h | 8--12h (single) | MEDIUM |
| **Total** | **8** | **51--73h** | **47--67h** | |

### By Complexity

| Complexity | Workstreams | Combined Effort |
|-----------|-------------|-----------------|
| LOW | WS-1.1 | 0.5h |
| LOW-MEDIUM | WS-3.2 | 4--6h |
| MEDIUM | WS-1.2, WS-1.3 | 10--14h |
| HIGH | WS-2.1, WS-2.2, WS-3.1, WS-4.1 | 36--52h |

### Schedule Scenarios

| Scenario | Total Hours | Working Days | Assumptions |
|----------|-------------|-------------|-------------|
| Best case | 47h | 6 days | No schema issues, glass effect works first try, morph rewrite clean, MapLibre compat OK |
| Expected case | 58h | 7.5 days | Minor iteration on card styling, morph testing, one upstream type fix, map bounds tuning |
| Worst case | 80h | 10 days | Schema mismatch requires backend coordination, morph edge cases, MapLibre compat issues, type cascade surprises |

### Resource Loading

`react-developer` handles 7 of 8 workstreams. `general-purpose` handles WS-1.1 only. No resource contention -- all workstreams on the critical path are serialized on the same agent. The only parallelization opportunity (Phase 3) still uses the same agent for both tracks.

---

## 11. Document Index

### Discovery Phase

| Document | Path | Content |
|----------|------|---------|
| Discovery Prompt | `DISCOVERY-PROMPT.md` | 7-phase discovery protocol |
| Discovery Log | `DISCOVERY-LOG.md` | Running log of all 7 discovery phases |
| Combined Recommendations | `combined-recommendations.md` | 7 decisions, 8 work areas, risk mitigation |
| Agent Roster | `agent-roster.md` | Agent assignments per work area |
| Coverage Data Spec | `COVERAGE-DATA-SPEC.md` | Supabase tables, columns, queries |
| Derived Metrics | `DERIVED-METRICS.md` | Client-side aggregation, category rollups |
| TypeScript Types | `TYPESCRIPT-TYPES.md` | Copy-paste types, constants, enums |
| Hooks Spec | `HOOKS-SPEC.md` | TanStack Query hooks with Supabase queries |
| Page Layout | `PAGE-LAYOUT.md` | Section-by-section layout reference |
| README | `README.md` | Plan directory overview |

### Planning Phase

| Document | Path | Content |
|----------|------|---------|
| Planning Prompt | `PLANNING-PROMPT.md` | SOW generation pipeline |
| Planning Log | `PLANNING-LOG.md` | Running log: WS mapping, status, issues, deviations |
| **MASTER-PLAN.md** | `MASTER-PLAN.md` | **This document** -- authoritative project plan |

### Phase 1 -- Foundation

| Document | Path | Content |
|----------|------|---------|
| WS-1.1 SOW | `phase-1-foundation/ws-1.1-archive-current-page.md` | Archive current page (Grade: A) |
| WS-1.2 SOW | `phase-1-foundation/ws-1.2-type-foundation.md` | Type widening + coverage metadata (Grade: A) |
| WS-1.3 SOW | `phase-1-foundation/ws-1.3-data-layer.md` | Hooks, utils, store (Grade: B+) |
| Phase 1 Overview | `phase-1-foundation/PHASE-1-OVERVIEW.md` | CTA+SPO+STW+PMO synthesis |
| Phase 1 Review | `phase-1-foundation/PHASE-1-REVIEW.md` | PASS WITH ISSUES |

### Phase 2 -- Core UI

| Document | Path | Content |
|----------|------|---------|
| WS-2.1 SOW | `phase-2-core-ui/ws-2.1-coverage-grid.md` | Grid + cards (Grade: A) |
| WS-2.2 SOW | `phase-2-core-ui/ws-2.2-morph-adaptation.md` | Morph rewrite (Grade: A-) |
| Phase 2 Overview | `phase-2-core-ui/PHASE-2-OVERVIEW.md` | CTA+SPO+STW+PMO synthesis |
| Phase 2 Review | `phase-2-core-ui/PHASE-2-REVIEW.md` | PASS WITH ISSUES |

### Phase 3 -- Detail + Chrome

| Document | Path | Content |
|----------|------|---------|
| WS-3.1 SOW | `phase-3-detail-and-chrome/ws-3.1-district-view-adaptation.md` | District view + scenes (Grade: A) |
| WS-3.2 SOW | `phase-3-detail-and-chrome/ws-3.2-chrome-and-panels.md` | Chrome labels + panel positions (Grade: A) |
| Phase 3 Overview | `phase-3-detail-and-chrome/PHASE-3-OVERVIEW.md` | CTA+SPO+STW+PMO synthesis |
| Phase 3 Review | `phase-3-detail-and-chrome/PHASE-3-REVIEW.md` | PASS WITH ISSUES |

### Phase 4 -- Map

| Document | Path | Content |
|----------|------|---------|
| WS-4.1 SOW | `phase-4-map/ws-4.1-map-feature.md` | MapLibre map (Grade: A-) |
| Phase 4 Overview | `phase-4-map/PHASE-4-OVERVIEW.md` | CTA+SPO+STW+PMO synthesis |
| Phase 4 Review | `phase-4-map/PHASE-4-REVIEW.md` | PASS WITH ISSUES |

---

## 12. Pre-Implementation Blockers

Before any implementation begins, the following must be resolved:

1. **OQ-07 -- `intel_sources` schema verification** (HIGH, 4-phase carry-forward)
   - Action: Run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'intel_sources'` against live Supabase
   - Update `IntelSourceRow` in WS-1.3 if needed
   - Blocks: WS-1.3 (Phase 1), WS-3.1 (Phase 3), WS-4.1 (Phase 4)
   - Estimated effort: 10 minutes

2. **Issue #11 -- `CategoryMeta.description` field** (HIGH)
   - Action: Confirm WS-1.2 `CategoryMeta` interface includes `description: string`
   - If absent, add brief descriptions (~10-20 words per category) to `KNOWN_CATEGORIES`
   - Blocks: WS-3.1 (Phase 3)
   - Estimated effort: 15 minutes

3. **Issue #4 -- DistrictContent gap** (HIGH)
   - Action: WS-2.2 must add placeholder/empty state for `DistrictContent` when category IDs are passed
   - Resolved by: WS-3.1 Section 4.6 (the permanent fix)
   - Blocks: clean morph cycle between Phase 2 gate and Phase 3

4. **Issue #1 -- `IntelSourceRow` missing `id`** (HIGH)
   - Same root cause as OQ-07. Resolved by the same schema introspection.

---

## 13. Recommended Execution Schedule

```
Pre-Implementation (30 min):
  [0] Resolve OQ-07 (schema introspection) .......... 10 min
  [0] Confirm CategoryMeta.description field ......... 15 min

Phase 1 -- Foundation (2 days):
  Day 1 AM:  WS-1.1 Archive .........................  0.5h (general-purpose)
  Day 1:     WS-1.2 Type Foundation ..................  4-6h (react-developer)
             Gate: pnpm typecheck passes
  Day 2:     WS-1.3 Data Layer .......................  6-8h (react-developer)
             Gate: hooks return data, typecheck passes

Phase 2 -- Core UI (2.5 days):
  Day 3:     WS-2.1 Coverage Grid ....................  8-12h (react-developer)
             Gate: grid renders live data, Z0/Z1+ switch
  Day 4-5:   WS-2.2 Morph Adaptation .................  10-14h (react-developer)
             Gate: full morph cycle, URL sync, 9 files archived

Phase 3 -- Detail + Chrome (1.5 days, parallel):
  Day 6:     WS-3.1 District View (critical path) ....  10-14h (react-developer)
  Day 6:     WS-3.2 Chrome & Panels (parallel) .......  4-6h  (react-developer or second agent)
             Gate: morph into category shows live data, chrome shows TarvaRI

Phase 4 -- Map (1 day):
  Day 7:     WS-4.1 Map Feature ......................  8-12h (react-developer)
             Gate: map renders with filtered markers, full morph cycle end-to-end

Post-Implementation:
  [ ] Create visual regression baselines
  [ ] Add output: 'export' to next.config.ts
  [ ] Set up GitHub Pages deployment
  [ ] Review CARTO attribution compliance
  [ ] Evaluate production tile source
```

**Total: ~7 working days (expected case)**

---

## 14. Post-Project Items

Captured across all phase overviews and reviews. Not in scope for the 4-phase project.

| Item | Source | Priority |
|------|--------|----------|
| `output: 'export'` static build config | Combined Recommendations Phase 2 | High -- required for GitHub Pages |
| GitHub Pages deployment pipeline | Combined Recommendations Phase 2 | High |
| Production tile source evaluation | OQ-30, Phase 4 Overview 8.1 | Medium |
| Supabase Auth migration (replace passphrase) | CLAUDE.md Phase 1 | Medium |
| Alert detail page (click alert -> full detail) | OQ-21, OQ-32 | Medium |
| Severity filter in map view | OQ-31 | Low |
| Non-point geometry rendering (polygons) | WS-4.1 Out of Scope | Low |
| Category sparklines (historical data) | OQ-14 | Low |
| Realtime marker updates (Supabase Realtime) | WS-4.1 Out of Scope | Low |
| SystemStatusPanel content rewrite | OQ-27 | Low |
| ActivityTicker coverage-aware events | OQ-28 | Low |
| Bundle size CI monitoring | Phase 4 Overview Gap 1 | Low |
| Visual regression test suite (Playwright) | Phase 4 Overview 8.3 | Low |
| Test file backlog (4 phases without test deliverables) | Issues 2, 8, 15 | Medium |
| CARTO attribution compliance review | Phase 4 Review L-1 | Medium |

---

*This document is the single authoritative plan for the Coverage Grid Launch Page project. All phase overviews, SOWs, and reviews are subordinate to this plan. Status updates should be made here as workstreams are gated.*
