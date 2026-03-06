# Final Synthesis -- TarvaRI Alert Viewer "Summaries & More"

> **Author:** Chief Technology Architect
> **Date:** 2026-03-05
> **Classification:** HIGH
> **Documents Analyzed:** 15 (7 phase overviews, 7 phase reviews, 1 combined-recommendations)
> **Scope:** Cross-phase analytical synthesis. Implementation details are in MASTER-PLAN.md.

---

## 1. Executive Summary

The "Summaries & More" specification set defines 27 workstreams across 7 phases (0-6) to transform the TarvaRI Alert Viewer from a passive polling dashboard into an active, multi-channel operational intelligence platform. Estimated total effort is 12-18 developer-days, parallelizable with backend delivery across 5 backend phases (A-E).

The specification quality is high. All 7 phases received a "PASS WITH ISSUES" review verdict -- none were blocked, and no architectural redesigns were required. 64 total issues were cataloged across all reviews (14 HIGH, 27 MEDIUM, 23 LOW). Critically, 11 of 14 HIGH issues are naming or reference mismatches between SOW documents, not design flaws. Only 1 genuine specification bug was found (Phase 2 H-2: missing `startMorph` call in browser notification onclick handler), and only 1 behavioral contradiction was identified (Phase 4 H-1: `openGeoSummary` default parameters overwriting preserved state).

One systemic documentation issue pervades Phases 2-6: overview conflict resolutions are documented but never propagated back into the individual SOW texts. This forces implementers to cross-reference two documents for every conflicted section. The pattern was first identified in Phase 2 and confirmed in every subsequent phase.

The 10 architecture decisions (AD-1 through AD-10) are internally consistent, well-justified, and validated without reversals. The most consequential are AD-1 (achromatic priority channel, enforced structurally via type-system exclusion of color fields) and AD-10 (build-time data mode switching, enabling dead-code elimination for the public deployment).

---

## 2. Problem Statement

The TarvaRI Alert Viewer in its current state is a spatial dashboard that displays triaged intel alerts via REST polling. Six capability gaps motivated this specification effort:

1. **No priority differentiation.** All alerts render identically regardless of operational priority (P1/P2/P3/P4). Operators have no pre-attentive visual channel to distinguish urgent alerts from routine ones.

2. **No active alerting.** The viewer relies entirely on operator attention -- there is no push notification, no audio cue, no persistent priority feed. High-priority alerts can go unnoticed if the operator is focused on a different part of the spatial canvas.

3. **No search capability.** The command palette supports only local-filtering (sync) navigation. Operators cannot find specific intel items by keyword, title, or content across the full dataset.

4. **No geographic intelligence.** While the map shows individual alert markers, there is no aggregated geographic threat assessment -- no regional summaries, no trend analysis, no hierarchical drill-down from world to region to country.

5. **No server-side filtering.** Map data is fetched unfiltered; geographic (viewport bounding box) and source-based filtering would reduce bandwidth and improve relevance for operators focused on specific areas or sources.

6. **No public deployment path.** The viewer runs only in console mode against a local TarvaRI API server. There is no mechanism for a static public-facing deployment reading from Supabase.

Each gap maps to one or more phases: gap 1 to Phases 0-1, gap 2 to Phase 2, gap 3 to Phase 3, gap 4 to Phase 4, gap 5 to Phase 5, gap 6 to Phase 6.

---

## 3. Solution Overview

The solution is structured as 7 phases with a strict prerequisite chain rooted in Phase 0. The architecture introduces three significant new patterns to the codebase while preserving the existing morph state machine, two-store architecture, and spatial ZUI engine intact.

### New Pattern 1: Dual-Channel Visual Encoding

AD-1 establishes that priority uses the achromatic channel (shape, weight, animation) while severity retains exclusive ownership of color. This is enforced structurally: the `PriorityMeta` type deliberately excludes color fields, preventing downstream consumers from accidentally mapping priority to color. The enforcement is stronger than a code review convention because TypeScript will reject any attempt to access a color property on `PriorityMeta`.

The perceptual basis is Treisman 1985 pre-attentive processing theory: two different visual dimensions (color vs. shape) are searchable in parallel. If both severity and priority used color, they would compete for the same perceptual channel, forcing serial processing.

### New Pattern 2: Dual-Channel Data Architecture

Phase 2 introduces the project's first WebSocket integration (Supabase Realtime), creating a dual-channel data model: REST polling for baseline refresh + WebSocket push for immediate notification. The critical architectural invariant is that WebSocket events serve exclusively as cache-invalidation signals. They never call `setQueryData`, never write directly to Zustand stores. TanStack Query's cache remains the single source of truth.

This invariant prevents split-brain scenarios where the polling path and push path disagree on current state.

### New Pattern 3: Build-Time Data Mode Switching

Phase 6 introduces `NEXT_PUBLIC_DATA_MODE` as a build-time constant that determines whether data hooks fetch from the TarvaRI API (`'console'` mode) or from Supabase directly (`'supabase'` mode). Because Next.js replaces `process.env.NEXT_PUBLIC_*` with literal strings at build time, the unused code path is eliminated by dead-code analysis -- the `'supabase'` build contains no TarvaRI API references, and vice versa.

### Preserved Architecture

The morph state machine (6-phase choreography), the two-store separation (`ui.store.ts` for animation, `coverage.store.ts` for data filtering), the semantic zoom system (Z0 icons, Z1+ cards), and the spatial canvas composition model are all preserved without modification. Phase 3's fast morph extension modifies only timing constants, not the phase sequence.

---

## 4. Phase Summaries

### Phase 0: Consolidate & Prepare

**Scope:** 4 workstreams (WS-0.1 through WS-0.4), all Size S, ~1 day.
**Backend dependency:** None.
**Review verdict:** PASS WITH ISSUES (0 HIGH, 3 MEDIUM, 4 LOW).

Phase 0 establishes prerequisites consumed by all subsequent phases: the `OperationalPriority` type system and `PriorityBadge` component (consumed by 8+ downstream workstreams), the Sonner toast notification infrastructure (consumed by Phase 2), and visual cleanup of the stats panel (freeing space for Phase 4's threat picture entry point). The critical path runs WS-0.2 (types) into WS-0.4 (badge component). No cross-workstream conflicts exist -- the four workstreams touch orthogonal concerns with zero file-level overlap.

The most significant deliverable is the `PriorityMeta` interface, which structurally enforces AD-1 by excluding color fields. The `defaultVisibility` field (`'always' | 'detail' | 'filter-only'`) centralizes progressive disclosure rules, preventing re-implementation by each consumer.

**Key risk:** Test infrastructure. `pnpm test:unit` is not configured, but multiple acceptance criteria reference unit tests. The review recommends fallback verification via `pnpm typecheck` + manual inspection.

### Phase 1: Priority Badges

**Scope:** 5 workstreams (WS-1.1 through WS-1.5), 1M + 4S, ~2-3 days.
**Backend dependency:** Phase A (A.5 -- `operational_priority` on console endpoints).
**Review verdict:** PASS WITH ISSUES (3 HIGH, 3 MEDIUM, 4 LOW).

Phase 1 makes operational priority visible on every alert surface: grid cards, district lists, INSPECT panels, map markers, and the coverage store filter. WS-1.1 is the critical-path linchpin -- it threads `operationalPriority` through four data hook normalizers. All downstream workstreams depend on it.

The achromatic priority channel is implemented through three distinct mechanisms: geometric shape (diamond for P1, triangle for P2) on badges, size scaling (1.5x radius for P1, 1.25x for P2) on map markers, and a white glow pulse (4-second cycle, distinct from severity's 3-second colored glow) on P1 markers.

P1/P2 counts per category are derived client-side from the `/console/intel?limit=1000` response. This is architecturally sound as the derivation adds only a loop extension to existing counting logic, but the `limit=1000` cap means counts are approximate for high-volume categories.

All 3 HIGH issues are naming mismatches between SOWs: `item.priority` vs. `item.operationalPriority` (WS-1.3), GeoJSON property name disagreement (WS-1.1 vs. WS-1.5), and a missing file scope (WS-1.1 omits `use-coverage-metrics.ts`).

### Phase 2: P1/P2 Feed & Real-Time Notifications

**Scope:** 6 workstreams (WS-2.1 through WS-2.6), 1S + 5M, ~4-5 days.
**Backend dependency:** Phase B (B.1 -- priority feed endpoint, B.4 -- Supabase Realtime).
**Review verdict:** PASS WITH ISSUES (3 HIGH, 6 MEDIUM, 5 LOW).

Phase 2 is the most architecturally significant phase. It transforms the viewer from passive polling to active alerting, introducing the dual-channel data architecture (REST + WebSocket), the first Supabase Realtime integration, a two-step browser notification consent flow, and priority-differentiated notification persistence (P1 persists indefinitely, P2 auto-dismisses after 8 seconds).

The critical path is WS-2.6 (store extensions) -> WS-2.1 (data hook) -> WS-2.4 (WebSocket) -> WS-2.5 (notifications). WS-2.2 (feed strip) and WS-2.3 (feed panel) branch in parallel off WS-2.1.

The single genuine specification bug in the entire project was found here: WS-2.5's browser notification onclick handler sets `setDistrictPreselectedAlertId` but does not call `startMorph`, meaning clicking a browser notification would bring the tab to the foreground without actually navigating to the district view. The alert ID would sit unused in the store until some other interaction triggers a morph.

This phase also introduced the first observation of the systemic issue: overview conflict resolutions (7 identified, all correct) not propagated back into SOW texts.

Three similar item types coexist after this phase (`IntelFeedItem`, `CategoryIntelItem`, `PriorityFeedItem`), which is acknowledged as technical debt with a deferred `BaseIntelItem` extraction.

### Phase 3: Search Integration

**Scope:** 4 workstreams (WS-3.1 through WS-3.4), 2S + 2M, ~2.5-3.5 days.
**Backend dependency:** Phase C (C.2 -- `/console/search/intel` endpoint).
**Review verdict:** PASS WITH ISSUES (3 HIGH, 5 MEDIUM, 3 LOW).

Phase 3 is architecturally self-contained -- its only Phase 0 dependencies are the `OperationalPriority` type and `PriorityBadge` component, making it independent of Phases 1 and 2. This independence enables parallel execution on the critical path.

The fast morph extension (WS-3.4) is the highest-risk workstream in this phase because it modifies the morph state machine, but its scope is tightly bounded: a boolean flag on `startMorph`, a timing constant, and one conditional branch in `useMorphChoreography`. The phase sequence is unchanged.

A genuinely new issue missed by the overview was found by the reviewer: a TypeScript type mismatch when indexing `SEVERITY_COLORS` (a `Record<SeverityLevel, string>`) with the `string`-typed `SearchResult.severity` field. This requires a type-safe helper function or cast.

The handler placement contradiction between WS-3.2 (callback prop on CommandPalette) and WS-3.3 (handler defined inside CommandPalette with direct store imports) is the most significant specification inconsistency. The callback prop pattern is the correct resolution -- it preserves the component's decoupling from the coverage/district store.

### Phase 4: Geographic Intelligence

**Scope:** 6 workstreams (WS-4.1 through WS-4.6), 3S + 2M + 1L, ~4-6 days.
**Backend dependency:** Phase D (D.6 -- summary API endpoints).
**Review verdict:** PASS WITH ISSUES (1 HIGH, 4 MEDIUM, 5 LOW).

Phase 4 is the largest and most complex phase, introducing the most new UI surface area (GeoSummaryPanel at ~600-800 lines) and the most new data patterns (parameterized query keys, `keepPreviousData` for drill-down transitions, 120-second poll intervals for pre-aggregated data).

The three-level geographic hierarchy (World -> Region -> Country) with 11 custom travel-security regions is the most domain-specific design decision in the project. The panel preserves navigation context on close (level, key, type retained in the store), enabling "resume on reopen" behavior.

The sole HIGH issue is a genuine behavioral contradiction: `openGeoSummary` uses default parameters (`level='world'`, `key='world'`) that overwrite preserved state on every call, even when called with no arguments to resume. The fix is to use `undefined` defaults and only set `geoSummaryOpen = true` when no args are provided.

Type duplication is the dominant conflict pattern in this phase (5 of 6 conflicts): `TrendDirection`, `GeoLevel`, `ThreatLevel`, geographic region constants, and vocabulary differences (`RiskTrend` vs. `TrendDirection`) are all defined in multiple SOWs. The resolution is to centralize all shared types in `src/lib/interfaces/coverage.ts` during WS-4.6, which has no intra-phase dependencies and should be built first.

Mutual exclusion between GeoSummaryPanel (z-42) and DistrictViewOverlay (z-30) uses two complementary strategies: Direction 1 (reactive `useEffect` closes panel when district opens) and Direction 2 (synchronous guard prevents panel open during non-idle morph).

### Phase 5: Enhanced Filters

**Scope:** 2 workstreams (WS-5.1, WS-5.2), 1S + 1M, ~1.5-2 days.
**Backend dependency:** Phase B (B.3 -- bbox and source_key params).
**Review verdict:** PASS WITH ISSUES (1 HIGH, 3 MEDIUM, 0 LOW).

Phase 5 is the smallest and most mechanically straightforward phase. WS-5.1 adds two optional parameters to an existing hook (~12 lines), and WS-5.2 builds the filter UI.

The most notable design decision is storing bbox coordinates in a `useRef` rather than the Zustand coverage store. Rapidly-changing viewport coordinates (updated on every pan/zoom gesture) would trigger re-renders across all store subscribers. The ref isolates the high-frequency updates while the debounced bbox value is passed directly to `useCoverageMapData`.

The safe degradation design is a project highlight: both workstreams can be built, merged, and used before the backend supports the filter parameters. Unsupported query parameters are silently ignored by the HTTP protocol. Filters "activate" without any frontend change when backend B.3 lands.

The sole HIGH issue is an incorrect JSDoc endpoint path (`/console/intel/locations` should be `/console/coverage/map-data`).

### Phase 6: Public Deployment

**Scope:** 4 workstreams (WS-6.1 through WS-6.4), 1S + 3M, ~3-4 days.
**Backend dependency:** Phase E (E.1-E.2 -- public Supabase views).
**Review verdict:** PASS WITH ISSUES (3 HIGH, 3 MEDIUM, 0 LOW).

Phase 6 is unique in being strictly serial (WS-6.2 -> WS-6.1 -> WS-6.3 -> WS-6.4 -- no parallelism possible) and in involving two agents (react-developer for WS-6.1-6.3, devops-platform-engineer for WS-6.4).

The `@tarva/ui` workspace dependency (`../../tarva-ui-library/`) is the highest-risk item in the entire project. 50 consumer files import from 3 entry points. GitHub Actions CI will not have the workspace path available. Four resolution strategies are documented (pre-build + publish, vendoring, transpilePackages, monorepo CI), but none is prescribed -- this is deliberate, as the best strategy depends on the `@tarva/ui` library's build output structure.

Source metadata is deliberately zeroed in the public deployment (no source names, no sensitive fields), which raises a UI design question: components displaying source information will show empty or zero values. No SOW specifies UI adaptation for this case.

All 3 HIGH issues are cross-SOW mismatches: import names in WS-6.1 do not match export names in WS-6.2 (would cause TypeScript compilation failure), WS-6.3 uses `'tarvari'` mode value while WS-6.1 defines `DataMode = 'console' | 'supabase'`, and `useBundleDetail` is missing from WS-6.1's branching scope despite WS-6.2 creating `fetchBundleDetailFromSupabase`.

---

## 5. Consolidated Architecture Decisions

All 10 architecture decisions passed structured reasoning validation without reversals. They are listed below with cross-phase impact annotations.

| ID | Decision | Rationale | Phases Impacted | Risk Level |
|----|----------|-----------|-----------------|------------|
| AD-1 | Priority uses achromatic visual channel (shape, weight, animation), never color | Treisman 1985 pre-attentive processing -- two visual dimensions enable parallel search | 0, 1, 2, 3, 4 | LOW -- structurally enforced via PriorityMeta type |
| AD-2 | P1/P2 strip is world-space at y=-842 | User-directed; preserves spatial context; subject to ZoomGate | 2 | MEDIUM -- proximity to TopTelemetryBar needs validation |
| AD-3 | Geo summary panel is 560px slide-over at z-42 | UX/IA consensus; preserves spatial context; wide enough for hierarchical content | 4 | LOW -- z-index slot is clear |
| AD-4 | Fast morph for search navigation (~300ms vs ~1200ms) | Search implies known target; animation is delay not wayfinding | 3 | MEDIUM -- modifies morph state machine timing |
| AD-5 | Sonner as toast notification library | Lightweight, built-in severity coloring, richColors support | 0, 2 | LOW -- additive installation |
| AD-6 | Two-step browser notification consent | In-app explainer before native dialog increases grant rate | 2 | LOW -- graceful degradation to in-app toasts |
| AD-7 | 11 travel-security geographic regions | Custom taxonomy matching SafeTrekr domain model | 4 | LOW -- definitional, no runtime risk |
| AD-8 | Threat picture data consumed by geo summary panel | Pre-aggregated data enables 120s poll intervals and keepPreviousData transitions | 4 | LOW -- depends on backend Phase D quality |
| AD-9 | Stats panel simplified from 5 rows to 3 | Frees space for Phase 4 threat picture entry point; removes redundant data | 0 | LOW -- purely subtractive |
| AD-10 | Build-time data mode switching via NEXT_PUBLIC_DATA_MODE | Enables dead-code elimination; no runtime branching overhead | 6 | MEDIUM -- requires consistent mode values across SOWs |

### Decision Patterns

Three patterns emerge from the architecture decisions:

**Structural enforcement over convention.** AD-1 is the strongest example: rather than documenting "do not use color for priority" as a guideline, the `PriorityMeta` type physically lacks color fields. TypeScript rejects attempts to access them. AD-10 uses build-time constant replacement to make unused code paths unreachable. Both patterns make violations impossible rather than merely discouraged.

**Graceful degradation by default.** AD-6 (two-step consent), AD-10 (mode branching), and the cross-cutting null-safety pattern all design for the case where the preferred behavior is unavailable. Browser notifications denied? Fall back to in-app toasts. Backend Phase A not yet deployed? `operationalPriority ?? null` in every normalizer ensures P4 (invisible) treatment for unmigrated items.

**Spatial context preservation.** AD-2 (world-space strip), AD-3 (slide-over panel, not full-screen overlay), and AD-4 (fast morph that preserves phase sequence) all prioritize maintaining the operator's spatial awareness. The map and grid remain partially visible during panel interactions.

---

## 6. Cross-Phase Dependency Map

### External Dependencies (Backend)

```
Backend Phase A -------> Viewer Phase 1 (Priority Badges)
                              |
Backend Phase B -------> Viewer Phase 2 (P1/P2 Feed + Notifications)
         |
         +-------------> Viewer Phase 5 (Enhanced Filters)

Backend Phase C -------> Viewer Phase 3 (Search)

Backend Phase D -------> Viewer Phase 4 (Geo Intelligence)

Backend Phase E -------> Viewer Phase 6 (Public Deploy)
```

### Internal Dependencies (Viewer Phases)

```
Phase 0 ---------> Phase 1 ---------> Phase 2
    |                                      |
    +-----------> Phase 3                  | (independent)
    |                                      |
    +-----------> Phase 5                  | (independent)
    |                                      |
    +-----------> Phase 4                  | (independent)
    |                                      |
    +-----------> Phase 6                  | (independent)
```

Phase 0 is the sole internal prerequisite. Phases 1, 3, 4, 5, and 6 are mutually independent. Phase 2 depends on Phase 1 (needs priority types threaded through hooks). This independence enables aggressive parallelization -- 5 of 7 phases can proceed concurrently once their respective backend dependencies land.

### Critical Observations

1. **Phase 2 is the only intra-viewer bottleneck.** It cannot start until Phase 1 completes. All other phases depend only on Phase 0.
2. **Phase 4 is blocked on the latest backend delivery** (Phase D, estimated 7-10 days into backend work). It is the natural candidate for the final viewer phase.
3. **Phase 3 can execute in parallel with Phase 1** because its Phase 0 dependencies (OperationalPriority type, PriorityBadge component) are available immediately after Phase 0.
4. **Phase 5 can execute in parallel with Phase 2** (both depend on backend Phase B, but on different sub-phases: B.1 for Phase 2, B.3 for Phase 5).
5. **Phase 6 is fully independent** and can proceed whenever backend Phase E is ready, regardless of viewer progress on other phases.

---

## 7. Cross-Phase Conflicts and Resolutions

26 cross-workstream conflicts were identified across all phases. Phase 0 had zero conflicts (orthogonal concerns). The distribution:

| Phase | Conflicts | Dominant Pattern |
|-------|-----------|-----------------|
| 0 | 0 | N/A |
| 1 | 3 | Field name discrepancies |
| 2 | 7 | Type name mismatches, scope overlaps, integration gaps |
| 3 | 4 | API shape mismatches, handler placement contradictions |
| 4 | 6 | Type duplication across SOWs |
| 5 | 1 | Type alias inconsistency |
| 6 | 5 | Naming mismatches between SOWs, mode value inconsistency |

### Resolution Categories

All 26 conflicts were resolvable without architectural changes. They fall into four categories:

**Category A: Naming/reference mismatches (15 conflicts).** One SOW uses a different name than the SOW that defines the export. Examples: `item.priority` vs. `item.operationalPriority` (Phase 1), `PriorityFeedData` vs. `PriorityFeedSummary` (Phase 2), `useIntelSearch(inputValue)` vs. `useIntelSearch({ query: inputValue })` (Phase 3), `supabaseIntelFeed` vs. `fetchIntelFeedFromSupabase` (Phase 6). Resolution: find-replace to match the defining SOW's names.

**Category B: Type duplication (6 conflicts).** The same type or constant is defined in multiple SOWs with slightly different names or structures. Concentrated in Phase 4 (`TrendDirection`, `GeoLevel`, `ThreatLevel`, geographic regions, `RiskTrend`). Resolution: centralize in `src/lib/interfaces/coverage.ts` and import.

**Category C: Scope/responsibility gaps (3 conflicts).** Integration wiring between two SOWs is not specified by either. Examples: payload type bridge between WS-2.4 and WS-2.5 (Phase 2), handler placement between WS-3.2 and WS-3.3 (Phase 3). Resolution: assign the integration work to the consuming SOW.

**Category D: Value/behavior inconsistencies (2 conflicts).** Semantic disagreement about a value or behavior. Examples: `'tarvari'` vs. `'console'` mode value (Phase 6), adaptive polling vs. fixed polling (Phase 2). Resolution: adopt the canonical definition from the authoritative SOW.

### Systemic Issue: Non-Propagation of Resolutions

In Phases 2, 3, 5, and 6, every overview correctly identified all cross-workstream conflicts and proposed sound resolutions. However, in no case were the resolutions propagated back into the individual SOW texts. This creates a documentation layering problem:

- The SOW text says one thing (the conflict).
- The overview says another thing (the resolution).
- The implementer must consult both documents and mentally apply the resolution.

This is not an architectural problem but a specification process problem. The recommendation is to either: (a) propagate resolutions into SOW text before handing to implementers, or (b) produce a single "implementation-ready" version of each SOW that incorporates all applicable resolutions.

---

## 8. Consolidated Risk Register

The combined-recommendations document identifies 10 risks (R1-R10). The phase reviews surfaced additional risks. Below is the consolidated register, organized by severity.

### HIGH Risk

| ID | Risk | Impact | Mitigation | Status |
|----|------|--------|------------|--------|
| R1 | Backend Phase A delayed -- blocks Phases 1 + 2 | Critical path blocked | Phase 0 proceeds independently; Phase 3 and Phase 6 are unaffected; build Phase 1 with mock data if needed | Open |
| R-NEW-1 | `@tarva/ui` workspace dependency unavailable in CI (Phase 6) | GitHub Pages deployment fails | Four documented strategies: pre-build + npm publish, vendoring, transpilePackages, monorepo CI. Decision deferred to Phase 6 implementation. | Open |
| R-NEW-2 | WS-2.5 browser notification onclick missing `startMorph` (Phase 2 H-2) | Broken navigation from browser notifications | Specification fix required before implementation; the only genuine specification bug found across all phases | Fixed (specification amendment prescribed) |
| R-NEW-3 | Test infrastructure absent (`pnpm test:unit` not configured) | Acceptance criteria referencing unit tests are unexecutable | Fallback: `pnpm typecheck` + manual verification. Longer-term: configure Vitest. Recurs across ALL phases. | Open |

### MEDIUM Risk

| ID | Risk | Impact | Mitigation | Status |
|----|------|--------|------------|--------|
| R2 | Supabase Realtime RLS fails for reviewer role | Fallback to 10s polling | Acceptable latency for trip safety context | Open |
| R3 | Backend Phase D delayed (7-10 day estimate) | Phase 4 blocked | Phase 4 is last viewer phase; all others complete first; build panel shell with mock data | Open |
| R5 | P1/P2 strip visual competition with TopTelemetryBar | UI clutter at default zoom | Strip is world-space (scrolls), TopTelemetryBar is viewport-fixed; UX validation needed during Phase 2 | Open |
| R6 | Fast morph (300ms) feels jarring | UX regression | Ease-out curve; fallback to 400ms; test with real district content | Open |
| R7 | Static export breaks MapLibre dynamic import | Map broken on GitHub Pages | MapLibre already uses `next/dynamic` with `ssr: false`; verify in Phase 6; fallback to `<script>` tag loader | Open |
| R9 | Command palette sync + async results create confusing UX | Operator confusion | Distinct visual treatment: sync results = navigation, async results = intel with snippets | Open |
| R10 | GeoSummaryPanel (z-42) overlaps with DistrictViewOverlay (z-30) | Both are right-edge slide-overs | Mutual exclusion logic: Direction 1 (reactive useEffect) + Direction 2 (synchronous guard) | Mitigated by design |
| R-NEW-4 | Conflict resolutions not propagated to SOW texts (systemic) | Implementer confusion, risk of implementing conflicted version | Produce implementation-ready SOW versions incorporating all resolutions | Open |
| R-NEW-5 | 4 Supabase views assumed but unconfirmed (Phase 6) | Supabase query functions cannot be implemented | Depends on backend Phase E; view schemas in WS-6.2 are explicitly flagged as assumptions | Open |

### LOW Risk

| ID | Risk | Impact | Mitigation | Status |
|----|------|--------|------------|--------|
| R4 | Sonner conflicts with existing CSS/z-index stack | Toast rendering issues | Sonner's high z-index is above all decorative layers; `pointer-events: none` on those layers prevents interaction conflicts | Mitigated by design |
| R8 | Browser notification permission denied permanently | No browser push notifications | Two-step consent mitigates; graceful degradation to in-app sonner toasts; never re-prompt after native denial | Mitigated by design |

---

## 9. Consolidated Open Questions

Open questions are drawn from the combined-recommendations (5), phase overviews, and phase reviews. They are grouped by blocking status.

### Blocking (Must Resolve Before Implementation)

| ID | Question | Source | Owner | Target |
|----|----------|--------|-------|--------|
| OQ-B1 | Does `/console/priority-feed` endpoint exist or need to be created? | Phase 2 | Backend team | Before Phase 2 |
| OQ-B2 | Is Supabase Realtime configured for `intel_normalized` INSERT events? | Phase 2 | Backend team | Before Phase 2 |
| OQ-B3 | What channel/topic pattern for P1/P2 Realtime subscriptions? | Phase 2, combined-recommendations | Backend team | Before Phase 2 |
| OQ-B4 | Does `/console/search/intel` endpoint exist with `ts_headline` support? | Phase 3 | Backend team | Before Phase 3 |
| OQ-B5 | What is the `/console/search/intel` response shape (pagination, total count)? | Phase 3 | Backend team | Before Phase 3 |
| OQ-B6 | What are the exact response shapes for `/console/threat-picture` and `/console/summaries`? | Phase 4 | Backend team | Before Phase 4 |
| OQ-B7 | Do Supabase views `public_intel_feed`, `public_bundles`, `public_bundle_detail` exist? What columns do they expose? | Phase 6 | Backend team | Before Phase 6 |

### Non-Blocking (Resolve During Implementation)

| ID | Question | Source | Recommendation |
|----|----------|--------|----------------|
| OQ-NB1 | What should the `PriorityMeta.description` field contain? | Phase 0 WS-0.2 | Default to human-readable label ("Critical", "Urgent", "Routine", "Low") |
| OQ-NB2 | P1/P2 feed strip height (32-40px range)? | Combined-recommendations | UX validation during Phase 2; start at 36px |
| OQ-NB3 | Geo summary "What's Changed" empty state -- hide or show "No changes"? | Combined-recommendations | Show "No changes in the last hour" (absence of change is information, per AD-2 "ALL CLEAR" precedent) |
| OQ-NB4 | Does the public viewer need passphrase auth? | Phase 6, combined-recommendations | Unresolved; if yes, must work without API routes (client-side only) |
| OQ-NB5 | How should UI components handle zeroed source metadata in public deployment? | Phase 6 | Conditionally hide source-related UI elements when `DATA_MODE === 'supabase'` |
| OQ-NB6 | Should `useRef` vs. Zustand decision for bbox coordinates be documented as a project-wide pattern for high-frequency transient state? | Phase 5 | Yes -- add to CLAUDE.md conventions |
| OQ-NB7 | Should query key namespacing conventions be documented project-wide? | Phase 2, Phase 3 | Yes -- `['priority', 'feed']` vs. `['intel', 'feed']` namespacing pattern prevents accidental co-invalidation |

---

## 10. Deferred Items

Items explicitly deferred across all phases, with deferral rationale and trigger conditions for revisiting.

| Item | Deferred From | Rationale | Trigger to Revisit |
|------|--------------|-----------|-------------------|
| Map marker color-by-priority mode | Phase 1 | Conflicts with AD-1 (achromatic priority channel) | Users report difficulty distinguishing priority on map despite size scaling |
| Priority sort in district alert list | Phase 1 | Adds complexity to existing sort logic | After priority badges are live and users request sorting |
| `BaseIntelItem` type extraction | Phase 2 | Three similar types (`IntelFeedItem`, `CategoryIntelItem`, `PriorityFeedItem`) are acceptable for Phase 2 scope | When a 4th item type is introduced, or when maintenance burden becomes visible |
| Related Intel section in alert detail | Phase 3 | Requires search endpoint + UX design for contextual recommendations | After Phase 3 search is live |
| Adaptive polling (reduce interval when WebSocket connected) | Phase 2 | Deferred per Conflict 5 resolution; fixed 15s polling is simpler | When polling load becomes measurable or when WebSocket reliability is proven |
| Geographic region overlays on map | Phase 4 | Color-coded region polygons add map complexity | After Phase 4 geo summaries are live and users want spatial region context |
| Notification sound selection UI | Phase 2 | Audio cue is on/off in v1 | Users request different sounds for P1 vs. P2 |
| Offline/PWA support for public viewer | Phase 6 | Service worker caching for GitHub Pages | Public viewer needs offline access |
| Deep linking to specific alert/district | Phase 3 | URL-based navigation to a specific alert | After search + fast morph are stable |
| Multi-source filter selection | Phase 5 | API contract is single `source_key`; multi-select is an API-level change | Backend Phase B extends to support array parameter |
| Database type updates for Supabase views | Phase 6 | Views do not exist yet; pragmatic to skip | When views are confirmed and schema is stable |
| Map marker filtering by priority | Phase 1 | Filter scope deliberately limited to district view alert list | After priority badges are live on map and users request filtering |

---

## 11. Success Criteria

Success criteria are organized into three tiers: per-phase exit criteria (drawn from acceptance criteria summaries), cross-cutting quality gates, and project-level outcomes.

### Per-Phase Exit Criteria (Summary)

| Phase | AC Count | Key Measurable Criteria |
|-------|----------|------------------------|
| 0 | ~16 | Stats panel shows exactly 3 rows; `OperationalPriority` type exists; Sonner renders; PriorityBadge renders 4 levels; `pnpm typecheck` passes |
| 1 | ~30 | All API types include `operational_priority`; badges visible on cards, lists, INSPECT, map markers; priority filter toggles work; P1 markers 1.5x radius |
| 2 | ~60+ | P1/P2 strip visible at Z1+; "ALL CLEAR" when no P1/P2; click strip opens panel; new P1 triggers toast within 5s (Realtime) or 15s (polling); browser notification fires when backgrounded; two-step consent works; P1 toast persists; P2 auto-dismisses 8s |
| 3 | ~32 | Command palette shows Intel Search for >= 3 chars; results show snippet + severity + priority + category; click result triggers fast morph (~300ms) to district; empty state shows "No results" |
| 4 | ~35+ | "THREAT PICTURE" button opens 560px panel; world-level summary on open; drill-down World -> Region -> Country works; breadcrumb navigation; "What's Changed" hourly delta; structured breakdown renders; Escape dismisses; CategoryCard trend arrows display |
| 5 | ~32 | Map data filters by viewport bbox when enabled; source selector filters to specific source; FILTERS toggle works in district view; filter state cleared on district exit |
| 6 | ~60 | `NEXT_PUBLIC_DATA_MODE=supabase` build succeeds; static export generates functional site; GitHub Actions deploys to Pages; public viewer shows approved intel only; console mode still works |

**Total acceptance criteria across all phases: ~265.**

### Cross-Cutting Quality Gates

These criteria apply to every phase:

1. `pnpm typecheck` passes with zero errors after phase completion.
2. `pnpm build` succeeds without warnings related to the phase's changes.
3. No runtime console errors on page load or during primary interaction flows.
4. AD-1 compliance: no color assigned to priority levels on any visual surface.
5. All new interactive elements re-enable `pointer-events: auto` within SpatialCanvas.
6. All new z-indexed elements fit within the documented z-index budget.
7. All new data hooks follow the established pattern: `tarvariGet` fetch, snake_case -> camelCase normalization, TanStack Query with appropriate poll interval.
8. All new Zustand store extensions use Immer `set` pattern consistent with existing stores.

### Project-Level Outcomes

1. **Operator response time improvement.** P1 alerts are surfaced within 5 seconds (Realtime path) or 15 seconds (polling fallback) via three channels: visual badge, persistent feed strip, and toast notification.
2. **Zero false-positives in priority visual channel.** Items with missing `operationalPriority` default to P4 (invisible), never P1.
3. **Geographic context available.** Operators can access threat assessments at world, region, and country levels without leaving the spatial dashboard.
4. **Search latency within budget.** Debounced search query to results rendered: target < 1 second including 300ms debounce + network round-trip.
5. **Public deployment functional.** Static export on GitHub Pages serves approved intel data from Supabase with no TarvaRI API dependency.
6. **Console mode preserved.** All existing functionality continues to work in `DATA_MODE=console` after Phase 6 changes.

---

## 12. Implementation Sequencing

### Recommended Execution Order

```
Day 1:        Phase 0 (consolidate) -- no backend dependency
Day 2-4:      Phase 1 (priority badges) -- when backend Phase A lands
Day 3-6:      Phase 3 (search) -- when backend Phase C lands (parallel with Phase 1)
Day 5-9:      Phase 2 (P1/P2 feed + notifications) -- after Phase 1
Day 7-8:      Phase 5 (enhanced filters) -- when backend Phase B.3 lands
Day 10-15:    Phase 4 (geo intelligence) -- when backend Phase D lands
Day 12-15:    Phase 6 (public deploy) -- when backend Phase E lands (parallel with Phase 4)
```

### Sequencing Rationale

1. **Phase 0 first** because it has no backend dependency and its deliverables are consumed by every subsequent phase.
2. **Phase 1 early** because Phase 2 depends on it, making Phase 1 part of the longest internal chain (Phase 0 -> Phase 1 -> Phase 2).
3. **Phase 3 in parallel with Phase 1** because Phase 3 depends only on Phase 0, not Phase 1 or 2. A single developer can alternate between them; two developers can execute them concurrently.
4. **Phase 2 after Phase 1** because it consumes priority types threaded through hooks by Phase 1.
5. **Phase 5 mid-sequence** because it is small (1.5-2 days), independent, and can fill a gap between larger phases.
6. **Phase 4 late** because it depends on the latest backend delivery (Phase D, ~7-10 days) and is the largest single phase.
7. **Phase 6 last** because it is independent and benefits from all other viewer work being stable before the public deployment pipeline is activated.

### Critical Path

The longest dependency chain is:

```
Phase 0 (1 day) -> Phase 1 (2-3 days) -> Phase 2 (4-5 days) = 7-9 days
```

This is the internal critical path. The external critical path depends on backend delivery timing, which is outside the viewer team's control.

### Parallelization Opportunities

| Opportunity | Prerequisite | Savings |
|-------------|-------------|---------|
| Phase 3 parallel with Phase 1 | Phase 0 complete, backend Phase C ready | 2-3 days |
| Phase 5 parallel with Phase 2 | Phase 0 complete, backend Phase B.3 ready | 1-2 days |
| Phase 6 parallel with Phase 4 | Backend Phase E ready | 3-4 days |

Maximum parallelization with two developers could compress the 12-18 day estimate to approximately 9-12 days, assuming backend dependencies land on schedule.

### Pre-Implementation Checklist

Before beginning implementation:

- [ ] All 14 HIGH-severity specification issues have been resolved (text amendments to SOW documents)
- [ ] Overview conflict resolutions have been propagated to SOW texts (or implementation-ready SOW versions produced)
- [ ] Blocking open questions (OQ-B1 through OQ-B7) have answers from the backend team for the target phase
- [ ] `pnpm typecheck` and `pnpm build` pass on the current codebase (clean baseline)
- [ ] Backend Phase A endpoint contract confirmed (response shape for `operational_priority`)

---

## Appendix A: Issue Statistics

### By Severity

| Severity | Count | Percentage |
|----------|-------|------------|
| HIGH | 14 | 21.9% |
| MEDIUM | 27 | 42.2% |
| LOW | 23 | 35.9% |
| **Total** | **64** | **100%** |

### By Phase

| Phase | HIGH | MEDIUM | LOW | Total |
|-------|------|--------|-----|-------|
| 0 | 0 | 3 | 4 | 7 |
| 1 | 3 | 3 | 4 | 10 |
| 2 | 3 | 6 | 5 | 14 |
| 3 | 3 | 5 | 3 | 11 |
| 4 | 1 | 4 | 5 | 10 |
| 5 | 1 | 3 | 0 | 4 |
| 6 | 3 | 3 | 0 | 6 |
| **Total** | **14** | **27** | **23** | **64** |

### HIGH Issue Classification

| Category | Count | Examples |
|----------|-------|---------|
| Naming/reference mismatches between SOWs | 11 | `priority` vs. `operationalPriority`, `PriorityFeedData` vs. `PriorityFeedSummary`, import names vs. export names |
| Behavioral contradiction | 1 | `openGeoSummary` default parameters overwrite preserved state (Phase 4 H-1) |
| Genuine specification bug | 1 | Missing `startMorph` in browser notification onclick (Phase 2 H-2) |
| Missing scope | 1 | `useBundleDetail` hook not covered by any SOW (Phase 6 H-3) |

The 11-of-14 ratio of naming mismatches to total HIGH issues indicates that the specification process produces sound architecture but suffers from cross-document coordination failures. The two non-naming HIGH issues (behavioral contradiction and specification bug) are the only ones that represent genuine design errors.

### Systemic Patterns

1. **Non-propagation of conflict resolutions.** Observed in Phases 2, 3, 5, 6. Every overview correctly identifies conflicts and proposes sound resolutions, but the resolutions are never applied back to the SOW texts.

2. **Field name discrepancies.** `priority` vs. `operationalPriority` recurs across Phases 1 and 3. The canonical name is `operationalPriority` (defined in Phase 0 WS-0.2).

3. **Test infrastructure gap.** `pnpm test:unit` is not configured. Multiple acceptance criteria across ALL phases reference unit tests as verification methods. This is a project infrastructure issue, not a per-phase issue.

4. **Type duplication.** Concentrated in Phase 4 (5 conflicts) and Phase 2 (1 conflict). The root cause is parallel SOW authoring without a shared type registry.

5. **Every phase passes review.** No phase was rated FAIL or BLOCKED. All issues are correctable with text amendments to specification documents. No architectural redesign was required anywhere.

6. **Codebase grounding is exceptional.** Reviewers verified 100+ line-number references across 20+ source files. Inaccuracies are rare (2 in Phase 0, 1 in Phase 3, 1 in Phase 5) and always cosmetic (off-by-one, wrong file attribution) rather than structural.
