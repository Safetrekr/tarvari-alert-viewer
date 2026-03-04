# Final Synthesis -- Coverage Grid Launch Page

> **Author:** Synthesis Lead (chief-technology-architect)
> **Date:** 2026-03-04
> **Project:** TarvaRI Alert Viewer -- Coverage Grid Launch Page
> **Status:** Planning complete. All 4 phases specified, reviewed, and gated. Implementation not yet started.

---

## 1. Project Summary

The Coverage Grid Launch Page project replaces the tarva-launch capsule ring (6 hardcoded districts in a circular layout) with a data-driven coverage-category card grid backed by live TarvaRI intel data from a shared Supabase instance. The spatial ZUI engine, ambient effects, morph drill-down choreography, and chrome elements are preserved and adapted rather than rewritten.

The project spans 4 phases and 8 workstreams:

| Phase | Title | Workstreams | What It Delivers |
|-------|-------|-------------|------------------|
| 1 | Foundation | WS-1.1 Archive, WS-1.2 Types, WS-1.3 Data Layer | Preserved reference of original page; widened type system (`NodeId = string`); TanStack Query hooks + Zustand filter store for live Supabase data |
| 2 | Core UI | WS-2.1 Coverage Grid, WS-2.2 Morph Adaptation | CSS Grid of up to 15 category cards with semantic zoom (Z0 icons / Z1+ cards); morph drill-down rewired for scale+fade animation; 9 ring-era files archived |
| 3 | Detail + Chrome | WS-3.1 District View, WS-3.2 Chrome & Panels | Single generic `CategoryDetailScene` with alert list, severity breakdown, source health, and map placeholder; TarvaRI branding; intel-pipeline health labels; wider panel positions; adapted Minimap |
| 4 | Map | WS-4.1 Map Feature | MapLibre GL JS map inside district view overlay with severity-colored markers, clustering, popups, auto-bounds, and dark theme |

The planning pipeline produced 28 documents: 7 discovery specs, 1 combined-recommendations document, 8 SOWs, 4 phase overviews, 4 phase reviews, 1 planning log, 1 planning prompt, 1 agent roster, and 1 README.

---

## 2. Planning Pipeline Assessment

### 2.1 Pipeline Structure

The planning pipeline followed a repeating cycle per phase:

```
Discovery Specs --> Combined Recommendations --> SOW(s) --> Phase Overview --> Phase Review --> Gate
```

Each phase overview was synthesized by four roles (CTA, SPO, STW, PMO) examining the SOWs through different lenses: architecture coherence, requirements completeness, documentation clarity, and schedule feasibility. Each phase review was performed by a dedicated reviewer agent (`every-time`) that spot-checked codebase references against the actual source files.

### 2.2 Quantitative Output

| Artifact | Count |
|----------|-------|
| SOWs | 8 |
| Phase Overviews | 4 |
| Phase Reviews | 4 |
| Acceptance Criteria | 158 |
| Architecture Decisions (AD-01 to AD-45) | 45 |
| Open Questions (OQ-01 to OQ-34) | 34 |
| Risk Register Entries | 54 |
| Gaps Identified in Overviews | 28 |
| Review Issues (HIGH) | 2 unique (carried across phases) |
| Review Issues (MEDIUM) | 13 unique |
| Review Issues (LOW) | ~15 |
| Codebase Line References Verified | 100+ across 16+ files |

### 2.3 Pipeline Strengths

**Deep codebase grounding.** Every SOW references specific line numbers in the existing codebase, and the reviewer verified 100+ of these references against the actual source files. This level of grounding means implementation agents can locate the exact code to modify rather than guessing. All 4 reviews confirmed accuracy within +/-1 line.

**Conflict detection across workstreams.** The overview layer caught 7 cross-workstream conflicts (3 in Phase 1, 4 in Phase 2, 1 implicit in Phase 3, 0 in Phase 4) and provided explicit resolutions for each. The most valuable catches were: the `Record<DistrictId, X>` type cascade (Phase 1 Conflict 1), the implicit `data-category-card` attribute contract (Phase 2 Conflict 2), and the URL parameter coexistence (Phase 1 Conflict 2 / Phase 2 Conflict 4).

**Incremental complexity layering.** The phase structure correctly orders work from invisible (Phase 1: no visual changes) to foundational visual (Phase 2: grid + morph) to data-driven content (Phase 3: detail scenes + chrome) to specialized integration (Phase 4: MapLibre). Each phase has a clear gate criterion that validates its output before the next phase can start.

**Parallel execution identification.** The pipeline correctly identified that Phase 3's two workstreams (WS-3.1 and WS-3.2) touch entirely disjoint file sets and can run in parallel, reducing the effective phase duration from 14-20h to 10-14h. All other phase pairs were correctly flagged as serial.

### 2.4 Pipeline Weaknesses

**Carried-forward issues not resolved between phases.** OQ-07 (`intel_sources.id` column ambiguity) was flagged as a blocking issue in Phase 1 Review and carried forward through every subsequent phase without resolution. A 10-minute SQL query against the live Supabase instance would have resolved it. The pipeline's review step correctly escalated it each time, but no mechanism forced resolution before the next phase's planning began.

**Recurring gaps not addressed structurally.** The test-debt gap was identified independently in all 4 phase overviews and all 4 phase reviews. Each time it was flagged as a recommendation but never promoted to a mandatory deliverable. The pipeline lacks a mechanism to elevate recurring recommendations into requirements.

**MASTER-PLAN.md never created despite 4 references.** Every phase overview references a parent `MASTER-PLAN.md` that does not exist. The pipeline produced the content that would go into such a document (phase structure, dependency graph, OQ tracking) but distributed it across 4 separate overview documents rather than consolidating it.

**Effort estimates showed inconsistency.** Phase 1 was estimated at 11-15h in its own overview but reported as 12-18h in Phase 4's full project summary table. The Phase 2 Review estimated WS-2.1 at 6-8h and WS-2.2 at 4-6h (total 10-14h), while the Phase 2 Overview estimated 18-26h. These discrepancies suggest the overview and review agents used different estimation models.

---

## 3. Recurring Themes

### 3.1 Test Debt: Every Phase, Never Addressed

| Phase | Where Flagged | What Was Recommended | What Happened |
|-------|---------------|---------------------|---------------|
| 1 | Overview Gap 1, Review M-1 | Add `coverage-utils.test.ts` as Deliverable 4.7 | Not added to SOW |
| 2 | Overview Gap 1 | Add `CoverageGrid.test.tsx`, `CategoryCard.test.tsx`, Playwright morph cycle test | Not added to SOW |
| 3 | Overview Gap 3, Review M-2 | Add `CategoryDetailScene.test.tsx`, manual test script, grep verification | Not added to SOW |
| 4 | Overview Gap 2, Review M-3 | Add `map-utils.test.ts`, `CoverageMap.test.tsx`, manual AC script | Not added to SOW |

The project produces 158 acceptance criteria across 8 workstreams but zero test files. The most testable artifacts -- `coverage-utils.ts` (pure functions), `map-utils.ts` (pure functions), `CategoryDetailScene` (complex component with 4 data sections and 3 loading states) -- are the strongest candidates for automated tests but have none. This creates a compound risk: as later phases modify files created by earlier phases, there is no regression safety net.

### 3.2 OQ-07: Four Phases Without Resolution

OQ-07 asks whether `intel_sources` has a UUID `id` column, and how `intel_normalized.source_id` relates to it versus `source_key`. This is a factual question about the live database schema that can be answered by a single SQL query:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'intel_sources';
```

It was first identified in Phase 1 (WS-1.3 Conflict 3), flagged as HIGH in Phase 1 Review (H-1), carried forward in Phase 2 Overview (Section 8), escalated as blocking for WS-3.1 in Phase 3 Overview (Section 6), and carried again in Phase 4 Overview (Section 6). The Phase 3 Review called three phases of carry-forward "unacceptable." The Phase 4 Review called four phases of carry-forward "a project management concern."

This is the single most important item to resolve before any implementation begins. It blocks WS-3.1, which blocks WS-4.1.

### 3.3 MASTER-PLAN.md Absence

Every phase overview declares `Parent Plan: MASTER-PLAN.md (pending creation)`. Each overview and review flags this as a gap and recommends creating it. The document was never created during the planning phase. The Phase 4 Overview (Section 8.4) estimates it as a 1-2 hour task and provides a content specification.

The absence is not blocking for implementation but creates a cross-phase traceability problem: there is no single document that tracks OQ resolution status, AD consolidation, or phase gate status. This information is distributed across 4 overviews, 4 reviews, and the planning log.

### 3.4 Implicit Contracts Between Workstreams

Several workstreams depend on implementation details of prior workstreams that are described narratively but not codified in interfaces or acceptance criteria:

| Consumer WS | Producer WS | Implicit Contract | First Flagged |
|-------------|-------------|-------------------|---------------|
| WS-2.2 | WS-2.1 | `data-category-card` HTML attribute on `CategoryCard` root element | Phase 2 Overview Conflict 2 |
| WS-2.2 | WS-2.1 | `capsuleStateVariants` wiring in `CategoryCard` | Phase 2 Overview Conflict 2 |
| WS-3.1 | WS-1.2 | `CategoryMeta.description` field exists | Phase 3 Overview Gap 1 |
| WS-3.1 | WS-1.3 | `CoverageByCategory.sourceCount`, `.activeSources`, `.geographicRegions` field names | Phase 3 Overview Gap 2 |
| WS-3.1 | WS-1.3 | `MapMarker.title`, `.severity`, `.ingestedAt` field names | Phase 3 Overview Gap 4 |
| WS-4.1 | WS-3.1 | Map placeholder `<div>` with `role="img"` identifiable in `CategoryDetailScene` | Phase 4 Overview Section 5 |

The overview layer caught all of these, but only the Phase 2 Review converted the first two into explicit recommended ACs (M-1). The pattern suggests that SOW authors tend to describe their own deliverables in detail but assume upstream shapes will match their expectations without formal verification.

### 3.5 Line Number Fragility

WS-3.1 references `detail-panel.tsx` line numbers (import at line 25, render at line 149) verified against the current codebase. However, WS-2.2 modifies this same file before WS-3.1 executes. The Phase 3 Review (M-1) correctly flagged that these line numbers will be invalid after WS-2.2.

This pattern appears wherever a later workstream references a file that an earlier workstream modifies. The SOWs mitigate this with Risk entries that say "read the actual file at implementation time," but the stated line numbers create false confidence in the planning documents.

---

## 4. Architectural Coherence

### 4.1 Decision Chain Integrity

The 7 technical decisions from the combined-recommendations document flow coherently through the 45 Architecture Decisions across 8 SOWs:

```
Decision 1 (NodeId = string)
  --> AD-02, AD-03, AD-04 (Phase 1: type widening with deprecated alias)
  --> AD-29 (Phase 3: keep `districtId` prop name, NodeId covers semantic shift)

Decision 2 (Grid Layout 1500x400)
  --> AD-13 (Phase 2: grid container dimensions)
  --> AD-17 (Phase 2: icon grid matches card grid footprint)
  --> AD-34 (Phase 3: asymmetric panel push for clearance)
  --> AD-35 (Phase 3: Minimap world bounds widen)

Decision 3 (Scale + Fade Morph)
  --> AD-20 (Phase 2: detail panel always docks right)
  --> AD-21 (Phase 2: connector lines removed)
  --> AD-23 (Phase 2: selected card scale 1.2x)
  --> AD-24 (Phase 2: timing aligned to MORPH_TIMING.expanding)
  --> AD-28 (Phase 3: panel side always 'right')

Decision 4 (Hybrid Category List)
  --> AD-05, AD-06 (Phase 1: icon strings, CSS custom properties)
  --> AD-15 (Phase 2: static ICON_MAP)
  --> AD-26 (Phase 3: single generic scene for all categories)

Decision 5 (MapLibre in District View Overlay)
  --> AD-31 (Phase 3: map placeholder, not WebGL stub)
  --> AD-38-45 (Phase 4: all 8 map decisions)

Decision 6 (Single Generic Scene)
  --> AD-26 (Phase 3: CategoryDetailScene for all categories)
  --> AD-27 (Phase 3: category tint extraction)
  --> AD-30 (Phase 3: inline CategoryPanelContent)

Decision 7 (Separate Coverage Store)
  --> AD-09, AD-10, AD-12 (Phase 1: URL sync, refetch intervals, no persist)
  --> AD-25 (Phase 2: URL param rename district -> category)
```

There are no contradictions between decisions. Each builds on the prior phase's output without invalidating it. The morph phase state machine (`idle -> expanding -> settled -> entering-district -> district`) is explicitly preserved across all phases -- only the visual expression and positioning are adapted. This is the correct architectural choice: the state machine is the most fragile part of the morph system, and changing it would cascade into every component that observes morph phase.

### 4.2 Critical Path Validation

The critical path through the project is:

```
WS-1.2 (types) -> WS-1.3 (data) -> WS-2.1 (grid) -> WS-2.2 (morph) -> WS-3.1 (district view) -> WS-4.1 (map)
```

This is correctly identified in every phase overview and verified by dependency analysis:

- WS-1.1 (archive) is independent -- can run anytime before Phase 2 modifies `page.tsx`.
- WS-3.2 (chrome) depends only on WS-1.2 -- off the critical path entirely.
- Every other workstream has exactly one predecessor on the critical path.

The dependency chain is sound. No workstream attempts to consume an output that has not yet been produced by its prerequisites.

### 4.3 Data Flow Coherence

Data flows correctly from Supabase through the hook layer to the UI:

```
Supabase (intel_sources, intel_normalized)
  --> useCoverageMetrics (WS-1.3) --> CoverageGrid (WS-2.1) --> CategoryCard (WS-2.1)
  --> useCoverageMapData (WS-1.3) --> CategoryDetailScene (WS-3.1) --> CoverageMap (WS-4.1)
                                                                   --> Alert list (WS-3.1)
                                                                   --> Severity breakdown (WS-3.1)
```

The differentiated polling intervals (60s for source metrics, 30s for intel data) correctly reflect data change frequency. The 1000-row limit on `intel_normalized` queries (AD-11) provides a safety cap that aligns with MapLibre's demonstrated 60fps performance at 1000 WebGL circle markers.

### 4.4 Weak Points

**The `getCategoryTint()` hex extraction.** AD-27 (Phase 3) introduces a regex-based hex extraction from CSS `var(--category-seismic, #ef4444)` strings. This works because all `KNOWN_CATEGORIES` entries use hex fallbacks, but it is fragile: any future switch to hsl or rgb fallbacks would silently degrade to gray tints. A dedicated `getCategoryHex()` function in `coverage.ts` would be more robust.

**The `next/dynamic` SSR boundary.** AD-42 (Phase 4) correctly uses `next/dynamic` with `ssr: false` for MapLibre, but the boundary is at the component level. If any non-dynamic module inadvertently imports a runtime symbol from `maplibre-gl` (even through a re-export chain), the SSR/static build will fail. The SOW (Risk R-2) acknowledges this but relies on developer discipline rather than a structural guard.

**The morph orchestrator double-touch.** `morph-orchestrator.tsx` is modified by both WS-2.1 and WS-2.2. While strict sequential execution prevents runtime conflict, the second workstream's line-number references are guaranteed to be invalid. The SOW mitigates this with semantic identifiers, but the planning documents present stale line numbers as "verified."

---

## 5. Risk Assessment

The following are the top 5 project-wide risks, de-duplicated from the 54 risk register entries across 8 SOWs and prioritized by impact and likelihood:

### Risk 1: `intel_sources` Schema Mismatch (CRITICAL)

**Source:** WS-1.3 R-1, Phase 1 Review H-1, OQ-07 (4-phase carry)
**Impact:** WS-1.3 hooks return incorrect data; WS-3.1 source health table renders wrong fields; WS-4.1 markers may lack source attribution.
**Likelihood:** MEDIUM -- the schema was specified in the TarvaRI backend but never verified against the live Supabase instance during planning.
**Mitigation:** Run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'intel_sources'` before any implementation. Update `IntelSourceRow` type if needed. 10-minute task.

### Risk 2: React 19 + MapLibre v5 + react-map-gl v8 Compatibility (HIGH)

**Source:** WS-4.1 R-4, Phase 4 Review M-5
**Impact:** Dynamic import fails, WebGL canvas does not render, or event handlers misfire. Would block Phase 4 entirely.
**Likelihood:** LOW-MEDIUM -- react-map-gl v8 targets React 18; React 19 compatibility is not guaranteed. MapLibre v5 is relatively new.
**Mitigation:** Install dependencies as the first Phase 4 step and run `pnpm typecheck` + `pnpm build` immediately. If incompatible, pin to react-map-gl v7 + maplibre-gl v4 as fallback.

### Risk 3: Morph System Regression During Rewrite (HIGH)

**Source:** WS-2.2 R-5, combined-recommendations Risk 3
**Impact:** Morph animation breaks (phases skip, panel does not appear, Escape does not reverse). Would require debugging the state machine.
**Likelihood:** LOW -- the morph phase state machine is explicitly unchanged; only visual expression and positioning are adapted. However, the interconnected nature of phase guards, CSS selectors, variant animations, and portal rendering creates a wide surface for subtle regressions.
**Mitigation:** Preserve the state machine verbatim. Test every morph phase transition (`idle -> expanding -> settled -> entering-district -> district -> reverse`). Check reduced-motion mode separately.

### Risk 4: `CategoryMeta.description` Missing from WS-1.2 (HIGH)

**Source:** Phase 3 Overview Gap 1, Phase 3 Review H-2
**Impact:** WS-3.1's `CategoryDetailScene`, dock panel, and H-1 fix all access `.description`. If absent, 3 components fail to compile.
**Likelihood:** MEDIUM -- the combined-recommendations mentions "display name, color, and icon" but not description. The WS-1.2 SOW lists 13 exports from `coverage.ts` but the field list was not exhaustively verified.
**Mitigation:** Verify or add `description: string` to `CategoryMeta` before WS-3.1 starts. Brief 10-20 word descriptions per category.

### Risk 5: Cumulative Test Debt Creates Undetectable Regressions (MEDIUM)

**Source:** Phase 1-4 Gap (recurring), Phase 1-4 Review M (recurring)
**Impact:** Later phases modify files created by earlier phases with no automated regression detection. A type change in WS-1.2 could break a utility in WS-1.3 that is consumed by WS-3.1, and no test would catch it until manual verification.
**Likelihood:** MEDIUM -- the project produces 158 ACs but all are verified manually. The pure utility functions (`coverage-utils.ts`, `map-utils.ts`) are the highest-value test targets.
**Mitigation:** Create test files for pure utility modules (`coverage-utils.test.ts`, `map-utils.test.ts`) at minimum. These require no DOM, no React, no mocking -- just input/output assertions.

---

## 6. Implementation Recommendations

These are concrete, ordered recommendations for the agents executing the 8 workstreams:

### 6.1 Resolve OQ-07 FIRST

Before any implementation begins, run the schema introspection query against the live Supabase instance. This is a 10-minute task that has been deferred for 4 planning phases. The result determines whether `IntelSourceRow` needs an `id: string` field and whether `intel_normalized.source_id` references a UUID or a text slug. Update the WS-1.3 type definition accordingly.

### 6.2 Add `CategoryMeta.description` to WS-1.2

Verify that the `CategoryMeta` interface in `coverage.ts` includes `description: string`. If absent, add it with brief descriptions for all 15 categories (e.g., "Earthquake, tsunami, and volcanic activity monitoring" for seismic). This is a blocking pre-condition for WS-3.1 that was identified in Phase 3 but should be resolved during Phase 1 implementation.

### 6.3 Create Tests Alongside Components

Do not defer tests to a "cleanup phase." At minimum, create:

| File | Phase | Why |
|------|-------|-----|
| `src/lib/__tests__/coverage-utils.test.ts` | Phase 1 | Pure functions with edge cases (empty arrays, null GeoJSON, coordinate flipping) |
| `src/components/coverage/__tests__/map-utils.test.ts` | Phase 4 | Pure functions (GeoJSON conversion, color expression, time formatting) |

These are zero-dependency unit tests that take 30-60 minutes to write and provide lasting regression safety for the foundational utility modules consumed by every downstream workstream.

### 6.4 Tighten MapLibre/react-map-gl Version Pinning

The WS-4.1 SOW specifies `maplibre-gl: ^5.1.0` and `react-map-gl: ^8.0.0`. These are semver ranges that allow major-compatible updates. Given the React 19 compatibility uncertainty, pin to exact versions initially (e.g., `maplibre-gl: 5.1.0`, `react-map-gl: 8.0.3`). Widen ranges only after verifying compatibility.

### 6.5 Verify `detail-panel.tsx` Line Numbers After Each Phase

WS-3.1 references `detail-panel.tsx` line 25 (import) and line 149 (render). WS-2.2 modifies this file before WS-3.1 executes. After WS-2.2 completes, re-read `detail-panel.tsx` to find the actual locations of the `DistrictContent` import and render. Do not trust the WS-3.1 SOW's line numbers -- they are pre-WS-2.2 snapshots.

### 6.6 Add `data-category-card` Attribute Explicitly

When implementing WS-2.1's `CategoryCard`, include `data-category-card` on the root `motion.div` element and `data-selected` as a boolean attribute when the card is the morph target. WS-2.2's morph CSS selectors depend on these attributes. This was flagged as Phase 2 Review M-1 and should be treated as a required AC for WS-2.1.

### 6.7 Verify `getClusterExpansionZoom` API for MapLibre v5

WS-4.1's cluster expansion code uses a callback-style API for `getClusterExpansionZoom`. MapLibre GL JS v4+ transitioned to a Promise-based API. Before implementing the cluster expansion handler, check the MapLibre v5 API documentation. If Promise-based, use `const zoom = await source.getClusterExpansionZoom(clusterId)`.

### 6.8 Run `pnpm typecheck` After Every Workstream

Every workstream's gate criterion includes `pnpm typecheck` passing with zero errors. This is the single most reliable automated gate in the project. Run it after completing each workstream, not just at phase boundaries. A type error introduced in WS-2.1 that is not caught until WS-2.2 will be harder to diagnose.

---

## 7. Deferred Items

The following items were explicitly identified during planning and pushed out of scope for the 4-phase project:

### 7.1 Infrastructure and Deployment

| Item | Source | Notes |
|------|--------|-------|
| `output: 'export'` in `next.config.ts` | combined-recommendations Phase 2 scope, Phase 4 Overview Section 8.5 | Required for GitHub Pages static export. Must be verified with MapLibre's dynamic import. |
| GitHub Pages deployment pipeline | CLAUDE.md Phase 2 scope | Build + push `out/` to `gh-pages` branch. Depends on `output: 'export'`. |
| Remove `/api/*` routes | CLAUDE.md Phase 2 scope | Server routes are not needed for static export. |
| Production tile source procurement | OQ-30, Phase 4 Overview Section 8.1 | CARTO dark-matter is suitable for launch. MapTiler, Protomaps, or Stadia Maps for production. Single URL swap. |

### 7.2 Authentication

| Item | Source | Notes |
|------|--------|-------|
| Supabase Auth migration | CLAUDE.md, Phase 4 Overview Section 8.6 | Replace passphrase auth with email/magic link. Shared auth with SafeTrekr platform. Independent project. |

### 7.3 Content and Data

| Item | Source | Notes |
|------|--------|-------|
| SystemStatusPanel content rewrite | OQ-27 | Panel is decorative ambient instrumentation reading from enrichment store mock data. |
| FeedPanel/ActivityTicker content rewrite | OQ-28 | Static fallback events reference legacy district IDs. Will be replaced when enrichment engine generates coverage-aware events. |
| Category sparklines (source count over time) | OQ-14 | Historical data not available from `intel_sources`. |
| Default date range filter for queries | OQ-06 | Affects query efficiency but not correctness. 1000-row limit provides safety net. |

### 7.4 Feature Enhancements

| Item | Source | Notes |
|------|--------|-------|
| Alert detail page (click alert to view full detail) | OQ-21, OQ-32 | No destination view exists. Requires new page design. |
| Severity filter within map view | OQ-31 | Hook already supports the parameter. Needs UI design for filter control. |
| Non-point geometry rendering (polygons, lines) | WS-4.1 Out of Scope | `toMarkers()` filters to Points only. Polygon rendering requires additional MapLibre layer types. |
| Marker animation/transition effects | WS-4.1 Out of Scope | Static markers sufficient for dashboard. Animated entry is polish. |
| Realtime marker updates (Supabase Realtime) | WS-4.1 Out of Scope | 30-second polling via TanStack Query is sufficient. Realtime adds connection management complexity. |
| `useInitialDistrictFromUrl` removal | OQ-09 | Should be removed in WS-2.2. If not, carry to WS-3.1 or WS-3.2 cleanup. |

---

## 8. Final Metrics

### 8.1 Planning Artifacts

| Category | Count |
|----------|-------|
| Discovery specifications | 5 (COVERAGE-DATA-SPEC, DERIVED-METRICS, TYPESCRIPT-TYPES, HOOKS-SPEC, PAGE-LAYOUT) |
| Combined recommendations | 1 |
| SOWs | 8 |
| Phase overviews | 4 |
| Phase reviews | 4 |
| Planning log | 1 |
| Agent roster | 1 |
| Planning prompt | 1 |
| README | 1 |
| Discovery log | 1 |
| Discovery prompt | 1 |
| **Total planning documents** | **28** |

### 8.2 Specification Density

| Metric | Total | Per SOW Average |
|--------|-------|-----------------|
| Acceptance Criteria | 158 | 19.8 |
| Architecture Decisions | 45 | 5.6 |
| Open Questions | 34 | 4.3 |
| Risk Register Entries | 54 | 6.8 |
| Gaps Identified | 28 | 3.5 per overview |

### 8.3 Acceptance Criteria by Phase

| Phase | WS | ACs | Subtotal |
|-------|-----|-----|----------|
| 1 | WS-1.1 | 4 | |
| 1 | WS-1.2 | 11 | |
| 1 | WS-1.3 | 15 | **30** |
| 2 | WS-2.1 | 19 | |
| 2 | WS-2.2 | 20 | **39** |
| 3 | WS-3.1 | 33 | |
| 3 | WS-3.2 | 20 | **53** |
| 4 | WS-4.1 | 36 | **36** |
| | | **Total** | **158** |

### 8.4 Open Question Resolution Status

| Status | Count | IDs |
|--------|-------|-----|
| Resolved in later phase | 4 | OQ-03 (moot after WS-2.2 archives ring files), OQ-04 (resolved by WS-2.1 coverage.css), OQ-09 (resolved in WS-2.2 scope), OQ-16 (resolved by WS-3.1 H-1 fix) |
| Deferred to post-project | 11 | OQ-05, OQ-14, OQ-21, OQ-25, OQ-27, OQ-28, OQ-30, OQ-31, OQ-32, OQ-33, OQ-34 |
| To resolve during implementation | 12 | OQ-01, OQ-02, OQ-10, OQ-11, OQ-12, OQ-13, OQ-15, OQ-17, OQ-18, OQ-19, OQ-20, OQ-22 |
| Recommended resolved but needs confirmation | 3 | OQ-06 (date filter), OQ-23 (shared-scene-primitives), OQ-26 (minimap dot colors) |
| Blocking -- must resolve pre-implementation | 2 | **OQ-07** (intel_sources schema), OQ-08 (coverage store filter state -- recommended defer) |
| Resolved with recommendation adopted | 2 | OQ-24 (archive district-content.tsx), OQ-29 (verify APP_NAME consumers) |

### 8.5 Effort Estimates

| Phase | Estimated Effort | Effective Duration (with parallel) | Primary Risk |
|-------|-----------------|-----------------------------------|--------------|
| Phase 1: Foundation | 11--15h | 11--15h (serial) | Type cascade, Supabase schema mismatch |
| Phase 2: Core UI | 18--26h | 18--26h (serial) | Morph system rewrite, animation fidelity |
| Phase 3: Detail + Chrome | 14--20h | 10--14h (WS-3.1 and WS-3.2 parallel) | Data shape compatibility, upstream readiness |
| Phase 4: Map | 8--12h | 8--12h (single WS) | Library compatibility, SSR/WebGL |
| **Total** | **51--73h** | **47--67h** | |

Single-developer serial execution: approximately 7--9 working days.
With Phase 3 parallelization: approximately 6--8 working days.

### 8.6 File Impact

| Category | Count | Details |
|----------|-------|---------|
| New files created | ~17 | Phase 1: 6 (archive, coverage.ts types, coverage-utils, 2 hooks, coverage store, supabase types). Phase 2: 5 (CoverageGrid, CategoryCard, CategoryIconGrid, CoverageOverviewStats, coverage.css). Phase 3: 1 (CategoryDetailScene). Phase 4: 5 (CoverageMap, MapMarkerLayer, MapPopup, map-utils, maplibre-overrides.css). |
| Existing files modified | ~18 | district.ts, ui.store.ts, morph-types.ts, morph-orchestrator.tsx, page.tsx, district-view-content.tsx, district-view-overlay.tsx, district-view-dock.tsx, district-view-header.tsx, detail-panel.tsx, use-morph-choreography.ts, use-morph-variants.ts, morph.css, top-telemetry-bar.tsx, bottom-status-strip.tsx, Minimap.tsx, constants.ts, layout.tsx, + 4 panel position files |
| Files archived | 16 | Phase 1: 1 (page.archived.tsx). Phase 2: 9 (capsule-ring, constellation-view, district-capsule, capsule-telemetry, capsule-sparkline, capsule-health-bar, district-beacon, global-metrics, connector-lines). Phase 3: 6 (6 legacy scene files) + 1 recommended (district-content.tsx). |
| New npm dependencies | 2 | maplibre-gl, react-map-gl (Phase 4 only) |

### 8.7 Review Verdicts

| Phase | Verdict | New HIGH Issues | New MEDIUM Issues | Carried Issues |
|-------|---------|-----------------|-------------------|----------------|
| 1 | PASS WITH ISSUES | 1 (schema gap) | 2 (no tests, R-5 contradiction) | -- |
| 2 | PASS WITH ISSUES | 1 (DistrictContent gap) | 3 (implicit attributes, URL ownership, column width) | -- |
| 3 | PASS WITH ISSUES | 0 | 3 (line refs, no tests, field shape) | 2 HIGH (OQ-07, CategoryMeta.description) |
| 4 | PASS WITH ISSUES | 0 | 5 (dead code, cluster API, no tests, no tracking, version pinning) | 2 HIGH (OQ-07, CategoryMeta.description) |

All 4 phases received PASS WITH ISSUES. No phase was blocked. The two HIGH issues (OQ-07 and `CategoryMeta.description`) are pre-implementation blockers that must be resolved before the corresponding workstreams begin.

---

## 9. Conclusion

The planning pipeline produced an exceptionally detailed specification for a project of moderate technical complexity. 158 acceptance criteria, 45 architecture decisions, and 100+ verified codebase references provide implementation agents with an unusually high-fidelity blueprint. The architectural choices are coherent: the `NodeId = string` type widening, grid-based spatial layout, preserved morph state machine, single generic scene component, and MapLibre-in-overlay placement all reinforce each other without contradiction.

The pipeline's primary failure mode was carrying unresolved blocking issues across phases rather than forcing resolution. OQ-07 is a 10-minute SQL query that was identified in Phase 1 and remains unresolved after Phase 4. The secondary failure mode was repeatedly identifying the test-debt gap without promoting it to a requirement.

Before implementation begins:

1. **Resolve OQ-07** by querying the live Supabase schema.
2. **Confirm `CategoryMeta.description`** exists or add it to WS-1.2.
3. **Create the MASTER-PLAN.md** to consolidate phase status, OQ tracking, and the AD registry into a single entry point.
4. **Commit to creating `coverage-utils.test.ts` and `map-utils.test.ts`** alongside their respective workstreams.

With those four items addressed, the project is ready for implementation.
