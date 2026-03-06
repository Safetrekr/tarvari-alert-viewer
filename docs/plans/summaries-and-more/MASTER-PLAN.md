# MASTER-PLAN.md -- TarvaRI Alert Viewer: Summaries & More

> **Synthesized by:** CTA + SPO + STW + PMO
> **Date:** 2026-03-05
> **Status:** Implementation-ready (all phases PASS WITH ISSUES -- no blockers)
> **Source documents:** 1 combined-recommendations + 7 phase overviews + 7 phase reviews (15 total)
> **Scope:** 7 phases, 27 workstreams, 12-18 developer-days

---

## 1. Executive Summary

This plan delivers the frontend work for the TarvaRI Alert Viewer "Summaries & More" initiative. The backend (TarvaRI Touch-Ups 3) delivers 5 phases (A-E) of new API endpoints; this plan defines 7 phases (0-6) of viewer work to consume that data in the spatial dashboard.

**What gets built:**

- Priority badges on all alert surfaces using an achromatic visual channel (shape/weight/animation, never color)
- Persistent P1/P2 priority feed strip in world-space with real-time push notifications
- Async keyword search in command palette with fast morph navigation (300ms)
- Geographic intelligence slide-over panel (World / Region / Country hierarchy)
- Enhanced map filters (bounding box, source)
- Public deployment to GitHub Pages via Next.js static export + Supabase direct reads

**Key numbers:**

| Metric | Value |
|--------|-------|
| Phases | 7 (0-6) |
| Workstreams | 27 |
| Total effort | 12-18 developer-days |
| Architecture decisions | 10 project-level + 19 Phase-0-local + many phase-local |
| Review issues found | 14 HIGH, 22 MEDIUM, 23 LOW across all phases |
| Review issues blocking | 0 (all HIGH issues are text corrections, not redesigns) |
| Backend dependency phases | 5 (A-E), estimated 7-10 days for the longest (Phase D) |
| New files created | ~20 |
| Existing files modified | ~25 |
| Agent assignment | 26 WS to react-developer, 1 WS to devops-platform-engineer |

**Systemic issue across all reviews:** Overview conflict resolutions were documented but not propagated back into individual SOW texts. Implementers must cross-reference the Phase Overview when reading any SOW.

---

## 2. Phase Gate Summary

All 7 phases passed review with a PASS WITH ISSUES verdict. No phase has blocking issues -- all HIGH items are specification text corrections fixable in under 30 minutes each.

| Phase | Name | Verdict | HIGH | MED | LOW | Required Fixes Before Implementation |
|-------|------|---------|------|-----|-----|---------------------------------------|
| 0 | Consolidate & Prepare | PASS WITH ISSUES | 0 | 3 | 4 | M-3: Amend WS-0.2 ACs for missing test runner. |
| 1 | Priority Badges | PASS WITH ISSUES | 3 | 3 | 4 | H-1: Fix field name in WS-1.3 (`priority` -> `operationalPriority`). H-2: Fix GeoJSON property name in WS-1.1. H-3: Add `use-coverage-metrics.ts` to WS-1.1 scope. |
| 2 | P1/P2 Feed & Notifications | PASS WITH ISSUES | 3 | 6 | 5 | H-2: Add `startMorph` call to WS-2.5 browser notification onclick. H-3: Add WS-2.6 to WS-2.5 dependency list. M-5: Add integration wiring spec between WS-2.4 and WS-2.5. |
| 3 | Search Integration | PASS WITH ISSUES | 3 | 5 | 3 | H-1: Resolve handler placement contradiction (adopt callback prop). H-2: Correct overview codebase claim about `useMorphChoreography`. H-3: Update WS-3.2 hook integration to match WS-3.1 API. M-2: Address `SEVERITY_COLORS` type mismatch. |
| 4 | Geographic Intelligence | PASS WITH ISSUES | 1 | 4 | 5 | H-1: Fix `openGeoSummary` default params to preserve state on no-arg reopen. |
| 5 | Enhanced Filters | PASS WITH ISSUES | 1 | 3 | 2 | H-1: Fix JSDoc endpoint reference in WS-5.1. |
| 6 | Public Deployment | PASS WITH ISSUES | 3 | 3 | 4 | H-1: Update WS-6.1 import names to match WS-6.2 exports. H-2: Replace `'tarvari'` with `'console'` in WS-6.3. H-3: Add `use-bundle-detail.ts` to WS-6.1 scope. |

**Totals:** 14 HIGH, 22 MEDIUM, 23 LOW issues across 15 review documents.

---

## 3. Cross-Phase Dependency Chain

### Backend Dependencies

```
Backend Phase A  -->  Viewer Phase 1 (Priority Badges)
                           |
Backend Phase B  -->  Viewer Phase 2 (P1/P2 Feed + Notifications)
         |
         +-------->  Viewer Phase 5 (Enhanced Filters)
         |
Backend Phase C  -->  Viewer Phase 3 (Search)

Backend Phase D  -->  Viewer Phase 4 (Geo Intelligence)

Backend Phase E  -->  Viewer Phase 6 (Public Deploy)
```

### Viewer-Internal Dependencies

```
Phase 0 ---> Phase 1 ---> Phase 2
  |
  +--------> Phase 3 (independent of 1 and 2)
  |
  +--------> Phase 5 (independent of 1, 2, and 3)
  |
  +--------> Phase 6 (independent of 1-5)

Phase 4 has no viewer-internal dependency beyond Phase 0
```

### Intra-Phase Critical Paths

| Phase | Critical Path | Bottleneck |
|-------|---------------|------------|
| 0 | WS-0.2 -> WS-0.4 | Type definitions block badge component |
| 1 | WS-1.1 -> WS-1.2 (longest) | API type plumbing blocks all downstream WS |
| 2 | WS-2.6 -> WS-2.1 -> WS-2.4 -> WS-2.5 | Store extensions block data hook block realtime block notifications |
| 3 | WS-3.4 (independent) then WS-3.1 -> WS-3.2 -> WS-3.3 | Hook API blocks UI blocks navigation |
| 4 | Data track (WS-4.1, WS-4.2) then UI track (WS-4.3, WS-4.4, WS-4.5, WS-4.6) | Backend Phase D is the real bottleneck |
| 5 | WS-5.1 -> WS-5.2 | Data hook blocks filter UI |
| 6 | WS-6.2 -> WS-6.1 -> WS-6.3 -> WS-6.4 | Strictly serial, no parallelism |

### Blocking Open Questions (require backend resolution)

| ID | Question | Blocks | Owner |
|----|----------|--------|-------|
| OQ-1.1 | Backend `operational_priority` field casing (`'P1'` vs `'p1'` vs `1`) | Phase 1 (WS-1.1) | Backend team |
| OQ-1.2 | GeoJSON properties format for priority field | Phase 1 (WS-1.5) | Backend team |
| OQ-2.B1 | `/console/priority-feed` endpoint existence and shape | Phase 2 (WS-2.1) | Backend team |
| OQ-2.B4 | Supabase Realtime RLS configuration for reviewer role | Phase 2 (WS-2.4) | Backend team |
| OQ-3.C2 | `/console/search/intel` endpoint existence and `ts_headline` config | Phase 3 (WS-3.1) | Backend team |
| OQ-5.B3 | `bbox` format and `source_key` param support on `/console/coverage/map-data` | Phase 5 (WS-5.1) | Backend team |
| OQ-4.D | Geo summary endpoint (`/console/summaries`) and `structured_breakdown` format | Phase 4 (WS-4.1, WS-4.2) | Backend team |

---

## 4. Implementation Sequence

### Recommended Execution Order

```
Day  1:        Phase 0 (consolidate)                          ~1 day
Day  2-4:      Phase 1 (priority badges)                      ~2-3 days
Day  3-6:      Phase 3 (search) -- parallel with Phase 1      ~2.5-3.5 days
Day  5-9:      Phase 2 (P1/P2 feed + notifications)           ~4-5 days
Day  7-8:      Phase 5 (enhanced filters) -- parallel         ~1.5-2 days
Day  10-15:    Phase 4 (geo intelligence)                      ~4-6 days
Day  12-15:    Phase 6 (public deploy) -- parallel with 4      ~3-4 days
```

### Parallel Execution Opportunities

| Slot | Track A | Track B | Notes |
|------|---------|---------|-------|
| Day 2-4 | Phase 1 | Phase 3 (WS-3.4 first) | Both need only Phase 0 complete; independent backend deps |
| Day 5-9 | Phase 2 | Phase 5 (day 7-8) | Both depend on Backend Phase B; no viewer dependency between them |
| Day 10-15 | Phase 4 | Phase 6 | Independent backend deps (D and E); no viewer dependency |

### Phase 0 Internal Sequence (single developer)

1. WS-0.2 (priority types) -- critical path start
2. WS-0.1 (stats cleanup) -- while WS-0.2 is in IA review
3. WS-0.3 (sonner install) -- fastest, fill any gap
4. WS-0.4 (PriorityBadge) -- must follow WS-0.2

### Phase 1 Internal Sequence

1. WS-1.1 (API type threading) -- blocks everything
2. WS-1.2 (CategoryCard priority counts) -- largest WS in phase
3. WS-1.3 + WS-1.4 (district wiring + filter store) -- can parallel
4. WS-1.5 (map marker scaling) -- independent after WS-1.1

### Phase 2 Internal Sequence

1. WS-2.6 (store extensions) -- blocks WS-2.2, WS-2.3, WS-2.5
2. WS-2.1 (priority feed hook) -- blocks WS-2.2, WS-2.3, WS-2.4
3. WS-2.2 + WS-2.3 (strip + panel) -- can parallel after WS-2.1
4. WS-2.4 (realtime hook) -- after WS-2.1
5. WS-2.5 (notification system) -- after WS-2.4 + WS-2.6

### Phase 3 Internal Sequence

1. WS-3.4 (fast morph) -- independent, highest-risk, do first
2. WS-3.1 (search hook)
3. WS-3.2 (CommandPalette search group)
4. WS-3.3 (search-to-morph navigation)

### Phase 4 Internal Sequence

Data track runs first, then UI track:
1. WS-4.1 (useThreatPicture hook) + WS-4.2 (useGeoSummaries hook) -- parallel
2. WS-4.6 (store extensions) -- after data hooks
3. WS-4.3 (GeoSummaryPanel) -- largest WS in entire project (Size L)
4. WS-4.4 (trend indicators) + WS-4.5 (entry point) -- parallel, after WS-4.3

### Phase 5 Internal Sequence

1. WS-5.1 (extend map data hook with bbox/source params)
2. WS-5.2 (filter UI in district view)

### Phase 6 Internal Sequence

Strictly serial:
1. WS-6.2 (Supabase query functions)
2. WS-6.1 (data mode branching in hooks)
3. WS-6.3 (static export configuration)
4. WS-6.4 (GitHub Actions workflow)

---

## 5. Effort Summary

### By Phase

| Phase | WS Count | Sizes | Effort Estimate | Backend Gate |
|-------|----------|-------|-----------------|--------------|
| 0 | 4 | 4S | 3.5-4.5 hours (~1 day) | None |
| 1 | 5 | 1M + 4S | 6-8 hours (~2-3 days) | Phase A |
| 2 | 6 | 1S + 5M | 4.5-5 dev-days | Phase B |
| 3 | 4 | 2S + 2M | 2.25-2.75 dev-days | Phase C |
| 4 | 6 | 3S + 2M + 1L | 4-6 dev-days | Phase D |
| 5 | 2 | 1S + 1M | 1.5-2 dev-days | Phase B.3 |
| 6 | 4 | 1S + 3M | 3.5-4.5 dev-days | Phase E |
| **Total** | **27** | **15S + 11M + 1L** | **~12-18 dev-days** | |

### By Size Category

| Size | Count | Typical Effort | Total Effort Band |
|------|-------|----------------|-------------------|
| S (Small) | 15 | 0.5-1.5 hours | 7.5-22.5 hours |
| M (Medium) | 11 | 3-6 hours | 33-66 hours |
| L (Large) | 1 | 8-12 hours | 8-12 hours |

### By Agent

| Agent | WS Count | Phases |
|-------|----------|--------|
| react-developer | 26 | 0, 1, 2, 3, 4, 5, 6 (WS-6.1 through WS-6.3) |
| devops-platform-engineer | 1 | 6 (WS-6.4 only) |

### Capacity Utilization Notes

- With a single react-developer, the critical path is approximately 15-18 days (Phases 0-4 serial, Phases 5 and 6 filling gaps).
- With two react-developers, Tracks A/B parallelism reduces wall-clock time to approximately 10-12 days.
- Phase 4 is gated on Backend Phase D (estimated 7-10 days into backend work), which may idle the viewer developer regardless of capacity.
- Phase 6 WS-6.4 requires a devops-platform-engineer for approximately 0.5-1 day; this can be scheduled late.

---

## 6. Risk Heat Map

### Severity x Likelihood Matrix

```
             LOW Likelihood    MEDIUM Likelihood    HIGH Likelihood
HIGH Impact  R1 (Phase A       R3 (Phase D
              delayed)          delayed)
             R7 (MapLibre       R5 (Strip vs
              static export)     TopTelemetryBar)

MED Impact                     R2 (Realtime RLS)
                               R9 (Search UX
                                confusion)
                               R10 (GeoPanel vs
                                DistrictOverlay)

LOW Impact   R4 (sonner         R6 (Fast morph       R8 (Notification
              z-index)           jarring)              denied)
```

### Risk Register (from combined-recommendations, annotated with review findings)

| ID | Risk | Impact | Likelihood | Mitigation | Review Status |
|----|------|--------|------------|------------|---------------|
| R1 | Backend Phase A delayed -- blocks Phases 1 + 2 | HIGH | LOW | Phase 0 proceeds. Phase 3 and 6 are independent. Build Phase 1 with mock priority data if needed. | No new findings. |
| R2 | Supabase Realtime RLS fails for reviewer role | MEDIUM | MEDIUM | WS-2.4 falls back to 10-second polling. Acceptable latency for trip safety context. | No new findings. |
| R3 | Backend Phase D delayed (7-10 day estimate) -- blocks Phase 4 | MEDIUM | MEDIUM | Phase 4 is the last viewer phase. Build GeoSummaryPanel shell with mock data for layout validation. | No new findings. |
| R4 | Sonner conflicts with CSS/z-index stack | LOW | LOW | Sonner accepts `className` and `position` props. Test against z-30/z-40/z-42/z-45/z-50 stack. | No new findings. |
| R5 | P1/P2 strip visual competition with TopTelemetryBar | MEDIUM | MEDIUM | Strip is world-space, TopTelemetryBar is viewport-fixed. UX specialist should validate spacing during Phase 2. | No new findings. |
| R6 | Fast morph (300ms) feels jarring | LOW | MEDIUM | Use ease-out curve. If too abrupt, increase to 400ms. WS-3.4 review: PASS, no issues found. | Validated by review. |
| R7 | Static export breaks MapLibre dynamic import | MEDIUM | LOW | MapLibre already uses `next/dynamic` with `ssr: false`. Verify in Phase 6. Fallback: `<script>` tag loader. | No new findings. |
| R8 | Browser Notification permanently denied | LOW | MEDIUM | Two-step consent mitigates. Degrade to sonner toasts only. Never re-prompt after native denial. | No new findings. |
| R9 | Command palette search + sync results confusing | MEDIUM | MEDIUM | Async group below sync groups with clear separator. Different visual treatment (snippets). | No new findings. |
| R10 | GeoSummaryPanel z-42 overlaps DistrictViewOverlay z-30 | LOW | LOW | z-42 above z-30. Add mutual exclusion logic in coverage store. Phase 4 review confirmed approach is sound. | Validated by review. |

### New Risks Surfaced by Reviews

| ID | Risk | Impact | Likelihood | Source |
|----|------|--------|------------|--------|
| R11 | `@tarva/ui` workspace dependency breaks GitHub Actions CI | HIGH | MEDIUM | Phase 6 review, Phase 7 validation (concern #2). Workspace symlink `../../tarva-ui-library/` unavailable in CI. |
| R12 | Test infrastructure absent (`pnpm test:unit` not configured) | LOW | HIGH | Phases 0-3 reviews. Multiple ACs reference unit tests. Fallback: `pnpm typecheck` + manual verification. |
| R13 | Systemic SOW/Overview desynchronization | MEDIUM | HIGH | Phases 2, 3, 6 reviews. Overview resolutions not propagated to SOW texts. Implementer must cross-reference. |

---

## 7. Decision Log

### Project-Level Architecture Decisions

| ID | Decision | Rationale | Source |
|----|----------|-----------|--------|
| AD-1 | Priority uses achromatic visual channel (shape/weight/animation). Severity owns color exclusively. | Treisman 1985 pre-attentive processing: two dimensions (color vs. shape) searchable in parallel. | IA + UX specialists |
| AD-2 | P1/P2 strip is world-space at y=-842, outside `morph-panels-scatter`, own ZoomGate at Z1+. | User direction. Strip scrolls with canvas, does not interfere with viewport-fixed TopTelemetryBar. | User + UX specialist |
| AD-3 | Geo Summary Panel is a 560px slide-over from right at z-42. | UX + IA consensus. Preserves spatial context (map/grid partially visible). | UX + IA specialists |
| AD-4 | Fast morph: 300ms, skips `expanding` + `settled` phases, jumps to `entering-district`. | UX specialist. When user has identified target via search, full animation is delay, not wayfinding. | UX specialist |
| AD-5 | Sonner for toast notifications. | shadcn/ui compatible, lightweight, Next.js standard. No existing toast library installed. | CTA |
| AD-6 | Two-step browser notification consent (in-app explainer then native dialog). | Cold-requesting permission has high denial rates. In-app step provides value proposition context. | UX specialist |
| AD-7 | 11 travel-security geographic regions (custom taxonomy, not UN M.49). | Aligns with how travel security professionals think about risk regions. | User + IA specialist |
| AD-8 | Threat picture data consumed by Geo Summary Panel, not a standalone element. | IA specialist. Threat data is context within geographic summaries, not a competing surface. | IA specialist |
| AD-9 | Phase 0 consolidation: remove redundant Sources/Active rows from stats panel (5 rows -> 3). | IA specialist. Redundant with per-category source counts on CategoryCards. Clears space for Phase 4. | IA specialist |
| AD-10 | Build-time data mode switching via `NEXT_PUBLIC_DATA_MODE` (`'console'` or `'supabase'`). | Public GitHub Pages deployment cannot reach TarvaRI API. Supabase direct reads via anon key + RLS. | CTA |

### Z-Index Budget

| z-level | Surface | Owner Phase |
|---------|---------|-------------|
| z-30 | District view overlay | Existing |
| z-33 | Filter panel | Phase 5 (WS-5.2) |
| z-34 | Backdrop (PriorityFeedPanel) | Phase 2 (WS-2.3) |
| z-35 | PriorityFeedPanel | Phase 2 (WS-2.3) |
| z-40 | NavigationHUD | Existing |
| z-42 | GeoSummaryPanel | Phase 4 (WS-4.3) |
| z-45 | TriageRationalePanel | Existing |
| z-50 | CommandPalette | Existing |

### Phase-0-Level Architecture Decisions (representative subset)

| ID | Decision | Rationale |
|----|----------|-----------|
| D-0.2.1 | `'P1' \| 'P2' \| 'P3' \| 'P4'` string literals (not enums) | Match backend field values directly. No mapping layer needed. |
| D-0.2.4 | Unknown priority falls back to P4 (invisible) | Conservative: missing data = lowest priority = invisible by default. |
| D-0.4.2 | CSS `@keyframes` for P1 pulse (not `motion/react`) | Continuous ambient animation with no state interaction. Compositor-driven, zero JS cost. |
| D-0.4.3 | P4 returns `null` (no DOM node) | Zero DOM overhead. P4 items are the majority of intel. |

---

## 8. File Impact Summary

### New Files Created

| File Path | Created By | Size | Purpose |
|-----------|------------|------|---------|
| `src/components/coverage/PriorityBadge.tsx` | WS-0.4 | S | Achromatic priority indicator (diamond/triangle/text/null) |
| `src/hooks/use-priority-feed.ts` | WS-2.1 | M | TanStack Query hook for `/console/priority-feed` |
| `src/components/coverage/PriorityFeedStrip.tsx` | WS-2.2 | M | World-space P1/P2 summary strip at y=-842 |
| `src/components/coverage/PriorityFeedPanel.tsx` | WS-2.3 | M | Viewport-fixed expanded P1/P2 feed panel at z-35 |
| `src/hooks/use-realtime-priority-alerts.ts` | WS-2.4 | M | Supabase Realtime WebSocket subscription + cache invalidation |
| `src/lib/time-utils.ts` | WS-2.2 | S | Shared `relativeTimeAgo()` utility |
| `src/hooks/use-intel-search.ts` | WS-3.1 | M | TanStack Query hook for `/console/search/intel` with debounce |
| `src/lib/sanitize-snippet.ts` | WS-3.2 | S | `<b>`-only HTML allowlist for `ts_headline` output |
| `src/hooks/use-threat-picture.ts` | WS-4.1 | M | TanStack Query hook for `/console/threat-picture` |
| `src/hooks/use-geo-summaries.ts` | WS-4.2 | M | TanStack Query hook for `/console/summaries` |
| `src/components/coverage/GeoSummaryPanel.tsx` | WS-4.3 | L | 560px slide-over with World/Region/Country hierarchy |
| `src/lib/supabase/queries.ts` | WS-6.2 | M | Typed Supabase query functions mirroring API hooks |
| `.github/workflows/deploy-pages.yml` | WS-6.4 | S | GitHub Actions workflow for Pages deployment |

### Existing Files Modified

| File Path | Modified By | Nature of Change |
|-----------|------------|------------------|
| `src/lib/interfaces/coverage.ts` | WS-0.2, WS-1.1, WS-1.2 | Add `OperationalPriority` type, `PRIORITY_META`, `getPriorityMeta()`, extend `CoverageByCategory` with `p1Count`/`p2Count` |
| `src/components/coverage/CoverageOverviewStats.tsx` | WS-0.1, WS-4.5 | Remove 2 stat rows (Phase 0), add THREAT PICTURE entry point (Phase 4) |
| `src/app/(launch)/page.tsx` | WS-0.1, WS-2.2, WS-2.3, WS-3.3 | Remove stats props, add PriorityFeedStrip, add PriorityFeedPanel, wire search callback |
| `src/app/layout.tsx` | WS-0.3 | Add `<Toaster />` component |
| `src/hooks/use-intel-feed.ts` | WS-1.1 | Add `operationalPriority` to normalizer |
| `src/hooks/use-coverage-map-data.ts` | WS-1.1, WS-5.1 | Add `operationalPriority` to normalizer, add `bbox`/`source_key` params |
| `src/hooks/use-intel-bundles.ts` | WS-1.1 | Add `operationalPriority` to normalizer |
| `src/hooks/use-category-intel.ts` | WS-1.1 | Add `operationalPriority` to normalizer |
| `src/hooks/use-coverage-metrics.ts` | WS-1.1 (H-3 fix), WS-1.2 | Extend `ApiIntelItem`, add P1/P2 counting logic |
| `src/hooks/use-bundle-detail.ts` | WS-6.1 (H-3 fix) | Add data mode branching |
| `src/components/coverage/CategoryCard.tsx` | WS-1.2, WS-4.4 | Add PriorityBadge rendering, add trend indicators |
| `src/components/coverage/MapMarkerLayer.tsx` | WS-1.5 | Priority-based radius expression, P1 glow layer |
| `src/components/coverage/map-utils.ts` | WS-1.1, WS-1.5 | Add priority to GeoJSON properties, radius expression |
| `src/lib/coverage-utils.ts` | WS-1.1 | Add `operationalPriority` to `MapMarker` type |
| `src/components/district-view/scenes/CategoryDetailScene.tsx` | WS-1.3, WS-1.4 | Add PriorityBadge to alert list, add priority filter |
| `src/components/district-view/district-view-dock.tsx` | WS-1.3 | Add PriorityBadge to INSPECT panel |
| `src/stores/coverage.store.ts` | WS-1.4, WS-2.6, WS-4.6 | Add `selectedPriorities`, `priorityFeedExpanded`, geo summary state |
| `src/stores/settings.store.ts` | WS-2.6 | Add notification consent + preference fields |
| `src/stores/ui.store.ts` | WS-3.4 | Add `options?: { fast?: boolean }` to `startMorph()` |
| `src/lib/morph-types.ts` | WS-3.4 | Add `MORPH_TIMING_FAST` constant, extend `MorphState` |
| `src/hooks/use-morph-choreography.ts` | WS-3.4 | Add fast timing path conditional |
| `src/components/command-palette/CommandPalette.tsx` | WS-3.2, WS-3.3 | Add Intel Search group, add `onSearchResultSelect` callback prop |
| `src/components/district-view/district-view-overlay.tsx` | WS-5.2 | Add filter panel, thread map ref |
| `src/components/district-view/district-view-content.tsx` | WS-5.2 | Thread map ref through props |
| `src/components/coverage/CoverageMap.tsx` | WS-5.2 | Accept ref for viewport bounds access |
| `next.config.ts` | WS-6.3 | Conditional `output: 'export'`, `basePath`, `transpilePackages` |
| `package.json` | WS-0.3, WS-6.3 | Add `sonner` dependency, add `build:pages` script |

### File Contention Points (multi-WS modifications)

These files are modified by multiple workstreams. Sequencing per the critical path eliminates merge conflicts:

| File | Workstreams | Resolution |
|------|-------------|------------|
| `page.tsx` | WS-0.1, WS-2.2, WS-2.3, WS-3.3 | Phases 0, 2, 3 are sequential; changes are additive |
| `coverage.store.ts` | WS-1.4, WS-2.6, WS-4.6 | Phases 1, 2, 4 are sequential; Immer patterns additive |
| `coverage.ts` (interfaces) | WS-0.2, WS-1.1, WS-1.2 | Phases 0, 1 are sequential; additions to different sections |
| `CategoryDetailScene.tsx` | WS-1.3, WS-1.4 | Both in Phase 1; add coordination note |
| `map-utils.ts` | WS-1.1, WS-1.5 | Both in Phase 1; add coordination note |
| `use-coverage-map-data.ts` | WS-1.1, WS-5.1 | Phases 1, 5 are sequential |

---

## 9. Pre-Implementation Checklist

### Required Before Any Phase Begins

- [ ] Read this MASTER-PLAN.md and the combined-recommendations.md
- [ ] Confirm TarvaRI backend is running on port 8000 (`dev.sh start --intel`)
- [ ] Verify `pnpm typecheck` passes on current codebase
- [ ] Verify `pnpm build` succeeds on current codebase
- [ ] Establish visual baseline screenshots of CoverageOverviewStats at Z1+ zoom (Gap 5 from Phase 0 Overview)

### Required Before Each Phase

- [ ] Read the Phase Overview document (cross-workstream conflicts and resolutions)
- [ ] Read the Phase Review document (required fixes to apply mentally during implementation)
- [ ] Confirm backend dependency is met (endpoint exists and returns expected shape)
- [ ] Resolve all blocking open questions for that phase

### Required After Each Phase

- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm build` completes without errors
- [ ] Phase exit criteria (from Phase Overview Section 7) all met
- [ ] All acceptance criteria verified (manual or automated as available)
- [ ] No regressions in existing functionality (visual spot-check at minimum)

### Phase-Specific Pre-Reqs

| Phase | Pre-Req |
|-------|---------|
| 0 | Resolve OQ-1 (PriorityMeta `description` field). Default: include as optional. |
| 0 | Decide test infrastructure: set up minimal Vitest config (~30 min) or use typecheck-only verification. |
| 1 | Backend Phase A must have landed `operational_priority` on `/console/*` responses. |
| 2 | Backend Phase B.1 (`/console/priority-feed`) must exist. If not, fall back to filtered `/console/intel`. |
| 2 | Backend Phase B.4 (Supabase Realtime RLS) must be verified. If not, WS-2.4 uses polling fallback. |
| 3 | Backend Phase C.2 (`/console/search/intel`) must exist. |
| 4 | Backend Phase D.6 (summary API endpoints) must exist. This is the latest backend delivery. |
| 5 | Backend Phase B.3 (bbox/source params on console endpoints) must be ready. |
| 6 | Backend Phase E.1-E.2 (public Supabase views) must exist. |
| 6 | Resolve `@tarva/ui` CI dependency strategy (vendoring, npm publish, or transpilePackages). |

---

## 10. Acceptance Criteria Summary

### Phase 0: Consolidate & Prepare (13 criteria)

- [ ] AC-0.1: CoverageOverviewStats shows exactly 3 rows: All, Total Alerts, Categories
- [ ] AC-0.2: `CoverageOverviewStatsProps` no longer includes `totalSources` or `activeSources`
- [ ] AC-0.3: `OperationalPriority` type resolves to `'P1' | 'P2' | 'P3' | 'P4'`
- [ ] AC-0.4: `PRIORITY_META` contains complete entries for all four levels with zero color fields
- [ ] AC-0.5: `getPriorityMeta()` and `isPriorityVisible()` return correct values with safe fallbacks
- [ ] AC-0.6: `sonner` appears in `package.json` dependencies
- [ ] AC-0.7: `<Toaster />` renders in root layout with correct position, theme, and offset
- [ ] AC-0.8: Toast is visible, dismissible, does not overlap fixed chrome
- [ ] AC-0.9: PriorityBadge renders P1 (diamond + pulse), P2 (triangle), P3 (text-only or null), P4 (null)
- [ ] AC-0.10: All three size variants (sm/md/lg) render correctly
- [ ] AC-0.11: Priority visuals are fully achromatic (no color channel used)
- [ ] AC-0.12: All priority elements have `aria-label` attributes
- [ ] AC-0.13: `pnpm typecheck` and `pnpm build` pass with zero errors

### Phase 1: Priority Badges (20+ criteria)

- [ ] AC-1.1: All API types include `operational_priority` field with `?? null` fallback
- [ ] AC-1.2: CategoryCard shows PriorityBadge in top-right corner when p1Count + p2Count > 0
- [ ] AC-1.3: `CoverageByCategory` type includes `p1Count` and `p2Count` fields
- [ ] AC-1.4: District alert list rows show PriorityBadge (size="sm", no label)
- [ ] AC-1.5: INSPECT dock panel shows PriorityBadge (size="lg", with label)
- [ ] AC-1.6: Priority filter works: `selectedPriorities` in coverage store toggles visibility
- [ ] AC-1.7: Empty priority filter = show all (respecting default visibility rules)
- [ ] AC-1.8: P1 map markers render at radius 9, P2 at 7.5, P3/P4 at default 6
- [ ] AC-1.9: P1 markers have white achromatic glow with 4-second breathing pulse
- [ ] AC-1.10: Null `operationalPriority` items display without badge (graceful degradation)
- [ ] AC-1.11: `pnpm typecheck` and `pnpm build` pass

### Phase 2: P1/P2 Feed & Notifications (25+ criteria)

- [ ] AC-2.1: P1/P2 strip visible at Z1+ zoom, shows count + most recent title
- [ ] AC-2.2: "ALL CLEAR" state renders when no P1/P2 alerts
- [ ] AC-2.3: Click strip opens expanded feed panel
- [ ] AC-2.4: Click feed item navigates to district with alert pre-selected
- [ ] AC-2.5: New P1 triggers sonner toast within 5s (Realtime) or 15s (polling fallback)
- [ ] AC-2.6: P1 toast persists until dismissed; P2 auto-dismisses after 8s
- [ ] AC-2.7: Browser notification fires for P1 when tab is backgrounded (if consent granted)
- [ ] AC-2.8: Two-step consent flow works correctly
- [ ] AC-2.9: Browser notification onclick calls `startMorph` (Review H-2 fix required)
- [ ] AC-2.10: Realtime WebSocket connects or falls back to polling gracefully
- [ ] AC-2.11: `pnpm typecheck` and `pnpm build` pass

### Phase 3: Search Integration (15+ criteria)

- [ ] AC-3.1: Command palette shows "Intel Search" group when query >= 3 characters
- [ ] AC-3.2: Search results show snippet, severity dot, PriorityBadge, category
- [ ] AC-3.3: Click result closes palette, fast-morphs to district, alert pre-selected
- [ ] AC-3.4: Fast morph completes in ~300ms (no expanding/settled phases)
- [ ] AC-3.5: `prefers-reduced-motion` users see 0ms morph (overrides fast morph)
- [ ] AC-3.6: Empty search shows "No results" message
- [ ] AC-3.7: Debounce prevents API calls for intermediate keystrokes (300ms)
- [ ] AC-3.8: URL sync works correctly for fast morph (settled phase skipped)
- [ ] AC-3.9: `pnpm typecheck` and `pnpm build` pass

### Phase 4: Geographic Intelligence (25+ criteria)

- [ ] AC-4.1: "THREAT PICTURE" button opens 560px slide-over at z-42
- [ ] AC-4.2: World-level summary displays on open
- [ ] AC-4.3: Drill-down to Region and Country works with breadcrumb navigation
- [ ] AC-4.4: "What's Changed" section shows hourly delta
- [ ] AC-4.5: Structured breakdown renders: category chart, severity bar, key events, recommendations
- [ ] AC-4.6: Escape dismisses panel
- [ ] AC-4.7: CategoryCard trend arrows display (up/down/stable)
- [ ] AC-4.8: `openGeoSummary()` with no args resumes prior state (Review H-1 fix required)
- [ ] AC-4.9: Mutual exclusion with district view respects morph phase
- [ ] AC-4.10: `pnpm typecheck` and `pnpm build` pass

### Phase 5: Enhanced Filters (10+ criteria)

- [ ] AC-5.1: Map data filters by current viewport bbox when enabled
- [ ] AC-5.2: Source selector filters to specific source
- [ ] AC-5.3: Filters toggle in district view works
- [ ] AC-5.4: Map ref successfully threaded through component hierarchy
- [ ] AC-5.5: `pnpm typecheck` and `pnpm build` pass

### Phase 6: Public Deployment (15+ criteria)

- [ ] AC-6.1: `NEXT_PUBLIC_DATA_MODE=supabase` build succeeds with static export
- [ ] AC-6.2: All hooks correctly branch between `tarvariGet` and Supabase query functions
- [ ] AC-6.3: `use-bundle-detail.ts` included in branching (Review H-3 fix required)
- [ ] AC-6.4: Data mode value is `'console'` not `'tarvari'` (Review H-2 fix required)
- [ ] AC-6.5: Import names match: `fetch*FromSupabase` convention (Review H-1 fix required)
- [ ] AC-6.6: Static export generates functional site
- [ ] AC-6.7: GitHub Actions workflow deploys to Pages
- [ ] AC-6.8: Public viewer shows approved intel only
- [ ] AC-6.9: Console mode (`DATA_MODE=console`) still works normally
- [ ] AC-6.10: `@tarva/ui` dependency resolved in CI
- [ ] AC-6.11: `pnpm typecheck` and `pnpm build` pass for both modes

---

## 11. SOW Inventory

### Complete Workstream Listing

| WS ID | Phase | Name | Size | Agent | Backend Dep | Intra-Phase Deps | Key Review Issues |
|-------|-------|------|------|-------|-------------|-------------------|-------------------|
| WS-0.1 | 0 | Simplify CoverageOverviewStats | S | react-developer | None | None | None |
| WS-0.2 | 0 | Add priority types to interfaces | S | react-developer | None | None | M-3 (test infra) |
| WS-0.3 | 0 | Install sonner | S | react-developer | None | None | None |
| WS-0.4 | 0 | Create PriorityBadge component | S | react-developer | None | WS-0.2 | M-1, M-2 (codebase refs) |
| WS-1.1 | 1 | Extend API types with operational_priority | S | react-developer | Phase A | WS-0.2 | H-2 (GeoJSON prop), H-3 (missing scope) |
| WS-1.2 | 1 | P1/P2 count in CategoryCard | M | react-developer | Phase A | WS-0.4, WS-1.1 | None |
| WS-1.3 | 1 | Wire priority into district/INSPECT | S | react-developer | Phase A | WS-0.4, WS-1.1 | H-1 (wrong field name) |
| WS-1.4 | 1 | Priority filter in coverage store | S | react-developer | Phase A | WS-1.1 | None |
| WS-1.5 | 1 | Map marker priority scaling | S | react-developer | Phase A | WS-1.1 | H-2 (GeoJSON prop) |
| WS-2.1 | 2 | usePriorityFeed hook | M | react-developer | Phase B.1 | WS-2.6 | None |
| WS-2.2 | 2 | PriorityFeedStrip component | M | react-developer | Phase B | WS-2.1, WS-2.6 | H-1 (wrong type name) |
| WS-2.3 | 2 | PriorityFeedPanel (expanded view) | M | react-developer | Phase B | WS-2.1, WS-2.6 | None |
| WS-2.4 | 2 | useRealtimePriorityAlerts hook | M | react-developer | Phase B.4 | WS-2.1 | M-1 (adaptive polling) |
| WS-2.5 | 2 | Notification system | M | react-developer | Phase B | WS-0.3, WS-0.4, WS-2.4, WS-2.6 | H-2 (missing startMorph), H-3 (missing dep) |
| WS-2.6 | 2 | Coverage store extensions | S | react-developer | None | None | M-2 (scope not expanded) |
| WS-3.1 | 3 | useIntelSearch hook | M | react-developer | Phase C.2 | None | M-4, M-5 (debounce text, sizing) |
| WS-3.2 | 3 | Async search in CommandPalette | M | react-developer | Phase C.2 | WS-0.4, WS-3.1 | H-3 (hook API), M-1, M-2 |
| WS-3.3 | 3 | Search -> fast morph navigation | S | react-developer | None | WS-3.2, WS-3.4 | H-1 (handler placement) |
| WS-3.4 | 3 | Fast morph support in ui.store | S | react-developer | None | None | None |
| WS-4.1 | 4 | useThreatPicture hook | M | react-developer | Phase D | None | None |
| WS-4.2 | 4 | useGeoSummaries hook | M | react-developer | Phase D | None | None |
| WS-4.3 | 4 | GeoSummaryPanel component | L | react-developer | Phase D | WS-4.1, WS-4.2, WS-4.6 | M-1, M-2, M-3 |
| WS-4.4 | 4 | Trend indicators on CategoryCard | S | react-developer | Phase D | WS-4.1 | L-1 (field name) |
| WS-4.5 | 4 | Entry point in stats/HUD | S | react-developer | Phase D | WS-4.6, WS-0.1 | None |
| WS-4.6 | 4 | Coverage store extensions (geo) | S | react-developer | None | None | H-1 (default params) |
| WS-5.1 | 5 | Extend map data hook with bbox/source | S | react-developer | Phase B.3 | None | H-1 (wrong JSDoc) |
| WS-5.2 | 5 | Filter UI in district view | M | react-developer | Phase B.3 | WS-5.1 | M-1, M-2 |
| WS-6.1 | 6 | Data mode branching in hooks | M | react-developer | Phase E | WS-6.2 | H-1 (naming mismatch), H-3 (missing hook) |
| WS-6.2 | 6 | Supabase query functions | M | react-developer | Phase E | None | None |
| WS-6.3 | 6 | Static export configuration | M | react-developer | Phase E | WS-6.1 | H-2 (mode value), M-3 |
| WS-6.4 | 6 | GitHub Actions deployment workflow | S | devops-platform-engineer | Phase E | WS-6.3 | M-1, M-2 |

### SOW Document Locations

All SOW documents are located under:
```
docs/plans/summaries-and-more/
  phase-0-consolidate-and-prepare/
    ws-0.1-simplify-coverage-overview-stats.md
    ws-0.2-add-priority-types.md
    ws-0.3-install-sonner.md
    ws-0.4-create-priority-badge.md
    PHASE-0-OVERVIEW.md
    PHASE-0-REVIEW.md
  phase-1-priority-badges/
    ws-1.1-extend-api-types.md
    ws-1.2-category-card-priority.md
    ws-1.3-district-inspect-priority.md
    ws-1.4-priority-filter.md
    ws-1.5-map-marker-priority.md
    PHASE-1-OVERVIEW.md
    PHASE-1-REVIEW.md
  phase-2-p1-p2-feed-and-notifications/
    ws-2.1-priority-feed-hook.md
    ws-2.2-priority-feed-strip.md
    ws-2.3-priority-feed-panel.md
    ws-2.4-realtime-priority-alerts.md
    ws-2.5-notification-system.md
    ws-2.6-coverage-store-extensions.md
    PHASE-2-OVERVIEW.md
    PHASE-2-REVIEW.md
  phase-3-search-integration/
    ws-3.1-intel-search-hook.md
    ws-3.2-command-palette-search.md
    ws-3.3-search-navigation.md
    ws-3.4-fast-morph.md
    PHASE-3-OVERVIEW.md
    PHASE-3-REVIEW.md
  phase-4-geographic-intelligence/
    ws-4.1-threat-picture-hook.md
    ws-4.2-geo-summaries-hook.md
    ws-4.3-geo-summary-panel.md
    ws-4.4-trend-indicators.md
    ws-4.5-entry-point.md
    ws-4.6-coverage-store-extensions.md
    PHASE-4-OVERVIEW.md
    PHASE-4-REVIEW.md
  phase-5-enhanced-filters/
    ws-5.1-extend-map-data-hook.md
    ws-5.2-filter-ui.md
    PHASE-5-OVERVIEW.md
    PHASE-5-REVIEW.md
  phase-6-public-deployment/
    ws-6.1-data-mode-branching.md
    ws-6.2-supabase-queries.md
    ws-6.3-static-export.md
    ws-6.4-github-actions.md
    PHASE-6-OVERVIEW.md
    PHASE-6-REVIEW.md
  combined-recommendations.md
  MASTER-PLAN.md  (this document)
```

### Review Issue Counts by Phase

| Phase | Reviewed Docs | HIGH | MEDIUM | LOW | Total Issues |
|-------|---------------|------|--------|-----|-------------|
| 0 | 6 (4 SOWs + overview + combined-rec) | 0 | 3 | 4 | 7 |
| 1 | 7 (5 SOWs + overview + combined-rec) | 3 | 3 | 4 | 10 |
| 2 | 7 (6 SOWs + overview) | 3 | 6 | 5 | 14 |
| 3 | 5 (4 SOWs + overview) | 3 | 5 | 3 | 11 |
| 4 | 7 (6 SOWs + overview) | 1 | 4 | 5 | 10 |
| 5 | 3 (2 SOWs + overview) | 1 | 3 | 2 | 6 |
| 6 | 5 (4 SOWs + overview) | 3 | 3 | 4 | 10 |
| **Total** | **40** | **14** | **27** | **27** | **68** |

---

## Appendix A: Constraints (from combined-recommendations)

1. All data hooks use `tarvariGet()` for console mode. No direct Supabase queries in console mode.
2. Priority uses shape/weight, severity uses color. Never assign colors to priority levels.
3. World-space for new data elements. Viewport-fixed chrome is inherited and stable.
4. `pnpm` only. Never `npm`.
5. `motion/react` for animation. Never `framer-motion`.
6. Morph state machine is sacred. Only `useMorphChoreography()` calls `setMorphPhase()`. Fast morph modifies timing, not phase sequence.
7. SpatialCanvas disables pointer-events. Every interactive element must re-enable with `style={{ pointerEvents: 'auto' }}`.
8. Z-index budget: z-30 (district), z-34 (backdrop), z-35 (priority panel), z-40 (HUD), z-42 (geo summary), z-45 (triage), z-50 (command palette).
9. No type files in `src/types/`. Shared types go in `src/lib/interfaces/`. Feature-local types stay in their component/hook file.
10. All timestamps ISO 8601 UTC.

## Appendix B: Assumptions (from combined-recommendations)

1. Backend Phase A will add `operational_priority` to all `/console/*` response models.
2. Backend Phase B.1 will provide a dedicated `/console/priority-feed` endpoint.
3. Backend Phase C.2 will return `ts_headline` snippets in search results.
4. Backend Phase D.6 will provide `structured_breakdown` as parsed JSON (not a JSON string).
5. Backend Phase E.1 will create Supabase views named `public_intel_feed`, `public_bundles`, `public_bundle_detail`.
6. The `/console/coverage` endpoint can be extended to include P1/P2 counts per category.
7. MapLibre GL's `next/dynamic` with `ssr: false` pattern is compatible with Next.js static export.
8. The `@tarva/ui` workspace dependency can be resolved in CI via `transpilePackages` or pre-built package.

## Appendix C: Deferred Items

| Item | Why Deferred | Trigger to Revisit |
|------|-------------|-------------------|
| Map marker color-by-priority mode | Conflicts with AD-1 (achromatic priority) | Users report difficulty distinguishing priority on map despite size scaling |
| Priority sort in district alert list | Adds complexity to existing sort logic | Users request sorting after priority badges are live |
| Related Intel section in alert detail | Requires search endpoint + UX design | After Phase 3 search is live |
| Geographic region overlays on map | Color-coded region polygons | After Phase 4 geo summaries are live |
| Notification sound selection UI | Audio cue is on/off only in v1 | Users request different sounds for P1 vs P2 |
| Offline/PWA support for public viewer | Service worker caching | Public viewer needs offline access |
| Deep linking to specific alert/district | URL-based navigation | After search + fast morph are stable |
