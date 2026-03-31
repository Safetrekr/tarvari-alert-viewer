# Master Plan: Mobile View -- TarvaRI Alert Viewer

> **Synthesized by:** CTA (manual)
> **Date:** 2026-03-06
> **Status:** Complete
> **Total Workstreams:** 23
> **Total Phases:** 6
> **Estimated Total Effort:** 175-237 hours
> **Agents Required:** 4 (react-developer, world-class-ui-designer, world-class-ux-designer, information-architect)

---

## 1. Executive Summary

This plan delivers a complete mobile view for the TarvaRI Alert Viewer -- a spatial intelligence dashboard that currently renders only on desktop via a Zoomable User Interface (ZUI). The mobile view transforms the dashboard into a field-ready tool for security analysts on phones, preserving all critical functionality while adapting to the constraints and opportunities of mobile interaction.

The plan spans 6 phases (A-F), 23 workstreams, across 4 specialized agents. Each phase has been synthesized by a chief technology architect, reviewed against the live codebase by a structured reasoning agent, and all identified issues (39 total) have been resolved with concrete fixes applied to the SOW documents.

**Architecture:** The mobile view is code-split from the desktop ZUI via `next/dynamic` and renders a three-tab layout (Situation, Map, Intel) with a `motion/react` bottom sheet system, glassmorphism design tokens on the Oblivion dark-field aesthetic, and full cross-tab navigation. Two Zustand stores (`ui.store` for animation, `coverage.store` for data) are shared between desktop and mobile. All data flows through TanStack Query hooks consuming the TarvaRI API.

---

## 2. Phase Summary

| Phase | Name | Workstreams | Est. Hours | Parallelism | Key Deliverables |
|-------|------|-------------|------------|-------------|------------------|
| A | Foundation | 4 (S, M, M, S) | 13-19h | Partial | Mobile detection, shell layout, design tokens, viewport/safe areas |
| B | Situation Tab | 3 (M, M, S) | 19-26h | Partial | Threat banner, category grid, ambient effects, data freshness |
| C | Map + Bottom Sheet | 5 (M, M, M, M, S) | 34-48h | Partial | Bottom sheet core+advanced, map view, map interactions, settings |
| D | Category/Alert Detail | 3 (L, M, M) | 22-33h | Partial | Category detail sheet, alert detail card, morph navigation |
| E | Intel Tab + Search | 3 (M, M, M) | 36-41h | None | Intel tab, region detail+search, cross-tab links |
| F | Landscape + Polish | 5 (M, M, M, M, M) | 55-69h | High | Landscape layouts, accessibility audit, performance+PWA, protective ops, pull-to-refresh |
| **Total** | | **23** | **175-237h** | | |

---

## 3. Phase Details

### Phase A: Foundation (4 workstreams)

Establishes the mobile detection boundary, shell layout, design token system, and viewport configuration. After Phase A, the app detects mobile viewports, renders a three-tab shell with header and bottom nav, applies the Oblivion glassmorphism aesthetic via CSS custom properties, and handles safe areas for notched phones.

| WS | Title | Agent | Depends On | Blocks |
|----|-------|-------|-----------|--------|
| A.1 | Detection + Code Splitting | react-developer | None | A.2 |
| A.2 | Mobile Layout Shell | world-class-ui-designer | A.1, A.3, A.4 | B.1, B.2, C.1, all downstream |
| A.3 | Design Tokens + Ambient | world-class-ui-designer | None | A.2, all component styling |
| A.4 | Viewport Meta + Safe Areas | react-developer | None | A.2, F.1 |

**Critical path:** A.1 + A.3 → A.2 (A.4 is off critical path)

### Phase B: Situation Tab (3 workstreams)

Delivers the default tab content: threat posture banner, P1/P2 priority strip, 2-column category card grid, ambient threat effects, connectivity monitoring, and data staleness detection.

| WS | Title | Agent | Depends On | Blocks |
|----|-------|-------|-----------|--------|
| B.1 | Threat Banner + Priority | world-class-ui-designer | A.2, A.3 | B.3, D.1 |
| B.2 | Category Grid | world-class-ux-designer | A.2, A.3 | D.1, F.1 |
| B.3 | Ambient + Protective Ops | world-class-ui-designer | A.2, A.3, B.1 | F.4 |

**Critical path:** B.1 → B.3 (B.2 runs in parallel)

### Phase C: Map + Bottom Sheet (5 workstreams)

Delivers the `motion/react` bottom sheet system (core drag/snap + advanced features), the map tab with MapLibre GL JS, map marker interactions, and settings sheet. The bottom sheet is the primary detail container for Phases D and E.

| WS | Title | Agent | Depends On | Blocks |
|----|-------|-------|-----------|--------|
| C.1 | Bottom Sheet Core | world-class-ux-designer | A.2, A.3 | C.2, C.4, C.5, D.1, E.2 |
| C.2 | Bottom Sheet Advanced | world-class-ui-designer | C.1 | F.1 |
| C.3 | Map View | world-class-ux-designer | A.2 | C.4, E.3, F.1 |
| C.4 | Map Interactions | react-developer | C.1, C.3 | D.3 |
| C.5 | Settings Sheet | react-developer | C.1 | F.4 |

**Critical path:** C.1 → C.2 and C.1 → C.4 (C.3 runs in parallel with C.1)

### Phase D: Category/Alert Detail (3 workstreams)

Delivers the category detail bottom sheet (progressive disclosure with three snap points), alert detail card with action buttons, and the morph navigation system that drives category drill-down via the morph state machine's fast path.

| WS | Title | Agent | Depends On | Blocks |
|----|-------|-------|-----------|--------|
| D.1 | Category Detail | information-architect | B.1, B.2, C.1, D.2 | E.1, F.1 |
| D.2 | Alert Detail + Card | information-architect | A.3, C.1 | D.1, D.3, E.1, E.2, E.3 |
| D.3 | Morph + Navigation | react-developer | C.4, D.1, D.2 | E.3 |

**Critical path:** D.2 → D.1 → D.3 (D.1 and D.2 can start in parallel; D.1 consumes D.2's `MobileAlertCard`)

### Phase E: Intel Tab + Search (3 workstreams)

Delivers the Intel tab (feed + geographic intelligence), region detail bottom sheet, full-screen search overlay, and cross-tab navigation handlers that connect all three tabs into a cohesive system with URL deep linking.

| WS | Title | Agent | Depends On | Blocks |
|----|-------|-------|-----------|--------|
| E.1 | Intel Tab | information-architect | D.2, A.2, A.3, B.1 | E.2, E.3 |
| E.2 | Region Detail + Search | information-architect | E.1, D.2, C.1, A.3 | E.3 |
| E.3 | Cross-Tab Links | react-developer | D.2, D.3, E.1, E.2, C.3 | F.4, F.5 |

**Critical path:** E.1 → E.2 → E.3 (strictly sequential, no parallelism)

### Phase F: Landscape + Polish (5 workstreams)

Delivers landscape orientation support, WCAG 2.1 AA accessibility compliance, performance budget enforcement, PWA installability, session auto-lock, P1 audio alerts, pull-to-refresh, and edge polish.

| WS | Title | Agent | Depends On (F-internal) | Blocks |
|----|-------|-------|------------------------|--------|
| F.1 | Landscape Layouts | world-class-ui-designer | None | F.2 |
| F.2 | Accessibility Audit | react-developer | F.1 | None |
| F.3 | Performance + PWA | react-developer | None | None |
| F.4 | Protective Ops Hooks | world-class-ux-designer | None | None |
| F.5 | Pull-to-Refresh + Edge Polish | world-class-ux-designer | None | None |

**Critical path:** F.1 → F.2 (F.3, F.4, F.5 all run in parallel with F.1)

---

## 4. Agent Assignments

| Agent | Workstreams | Total |
|-------|-----------|-------|
| `react-developer` | A.1, A.4, C.4, C.5, D.3, E.3, F.2, F.3 | 8 |
| `world-class-ui-designer` | A.2, A.3, B.1, B.3, C.2, F.1 | 6 |
| `world-class-ux-designer` | B.2, C.1, C.3, F.4, F.5 | 5 |
| `information-architect` | D.1, D.2, E.1, E.2 | 4 |

---

## 5. Cross-Phase Dependency Graph

```
Phase A (Foundation)
  A.1 ──→ A.2 ──→ [All subsequent phases]
  A.3 ──→ A.2
  A.4 ──→ A.2

Phase B (Situation Tab)
  B.1 ──→ B.3
  B.2 ──→ (parallel with B.1)

Phase C (Map + Bottom Sheet)
  C.1 ──→ C.2, C.4, C.5
  C.3 ──→ C.4

Phase D (Category/Alert Detail)
  D.2 ──→ D.1, D.3
  D.1 ──→ D.3

Phase E (Intel Tab + Search)
  E.1 ──→ E.2 ──→ E.3

Phase F (Landscape + Polish)
  F.1 ──→ F.2
  F.3, F.4, F.5 ──→ (independent)
```

**Inter-phase critical path:** A.1 → A.2 → B.1 → B.3 (for freshness), and A.2 → C.1 → C.4 → D.3 → E.3 → F.4/F.5. The longest chain is the bottom-sheet-to-cross-tab path through C and D.

---

## 6. Key Architecture Decisions (Cross-Cutting)

| Decision | Description | Impact |
|----------|-------------|--------|
| Two-store architecture | `ui.store` (animation) and `coverage.store` (data) remain separate, shared between desktop and mobile | Zero store refactoring needed |
| Code splitting via `next/dynamic` | Desktop ZUI and mobile view are separate component trees, never co-rendered | Clean bundle separation, no cross-platform CSS leaks |
| `motion/react` bottom sheet | Custom drag/snap/velocity physics, not a third-party sheet library | Full control over interaction, no external dependency |
| Config-based sheet API | `SHEET_CONFIGS` centralizes snap points, labels, and behavior per sheet type | Consistent sheet behavior across 5+ sheet contexts |
| Morph fast path | Mobile skips `expanding` + `settled` phases: `idle → entering-district → district` | 600ms faster navigation than desktop |
| TanStack Query for all data | Same hooks, same polling, same caching as desktop | Zero data layer duplication |
| CSS custom properties for tokens | Design tokens scoped in `@media (max-width: 767px)` | Desktop styles completely isolated |
| `ThreatLevel` type alignment | All SOWs use codebase `ThreatLevel` (`LOW|MODERATE|ELEVATED|HIGH|CRITICAL`) | No type conflicts |
| `GeoRegionKey` alignment | 11 keys matching codebase `GEO_REGION_KEYS` (verified and corrected in review) | Compile-time exhaustiveness |

---

## 7. Issues Resolved

39 issues identified and resolved across 6 phase reviews:

| Phase | HIGH | MEDIUM | LOW | Total |
|-------|------|--------|-----|-------|
| A | 4 | 4 | 0 | 8 |
| B | 4 | 2 | 0 | 6 |
| C | 3 | 1 | 0 | 4 |
| D | 5 | 4 | 0 | 9 |
| E | 2 | 4 | 0 | 6 |
| F | 2 | 3 | 1 | 6 |
| **Total** | **20** | **18** | **1** | **39** |

**Notable catches:**
- E.3: REGION_CENTROIDS used 14 fabricated region keys vs. 11 actual `GEO_REGION_KEYS` (would have caused TypeScript compile failure)
- E.1/E.2: THREAT_LEVEL_COLORS defined in two files with divergent hex values (would have caused inconsistent badge colors)
- D.1/D.2: MobileAlertCard prop name mismatch (`alert` vs `item`) and callback signature mismatch
- B.1/B.3: Staleness hook and posture derivation duplicated across two SOWs
- C.1/C.4: Bottom sheet API mismatch (config-based vs individual props) and snap point format (integers vs fractions)

---

## 8. Persistent Gaps

| Gap | First Flagged | Status | Resolution |
|-----|---------------|--------|------------|
| MobileStateView component | Phase A (Issue #3) | Undelivered after 7 phase reviews | Must be implemented as a prerequisite before Phase F (F.2 audits it, F.5 polishes its shimmers). ~60 lines. Assigned to whichever agent implements first. |

---

## 9. File Index

### Plan Documents

| File | Description |
|------|-------------|
| `docs/plans/mobile-view/MASTER-PLAN.md` | This document |
| `docs/plans/mobile-view/FINAL-SYNTHESIS.md` | Architecture decisions, patterns, implementation guidance |
| `docs/plans/mobile-view/FINAL-VALIDATION-REPORT.md` | End-to-end validation of plan completeness |
| `docs/plans/mobile-view/PLANNING-LOG.md` | Living progress tracker |

### Phase Overviews and Reviews

| Phase | Overview | Review |
|-------|----------|--------|
| A | `phase-a-foundation/PHASE-A-OVERVIEW.md` | `phase-a-foundation/PHASE-A-REVIEW.md` |
| B | `phase-b-situation-tab/PHASE-B-OVERVIEW.md` | `phase-b-situation-tab/PHASE-B-REVIEW.md` |
| C | `phase-c-map-bottom-sheet/PHASE-C-OVERVIEW.md` | `phase-c-map-bottom-sheet/PHASE-C-REVIEW.md` |
| D | `phase-d-category-alert-detail/PHASE-D-OVERVIEW.md` | `phase-d-category-alert-detail/PHASE-D-REVIEW.md` |
| E | `phase-e-intel-search/PHASE-E-OVERVIEW.md` | `phase-e-intel-search/PHASE-E-REVIEW.md` |
| F | `phase-f-landscape-polish/PHASE-F-OVERVIEW.md` | `phase-f-landscape-polish/PHASE-F-REVIEW.md` |

### SOW Documents (23 total)

| WS ID | File |
|-------|------|
| A.1 | `phase-a-foundation/ws-a.1-detection-code-splitting.md` |
| A.2 | `phase-a-foundation/ws-a.2-mobile-layout-shell.md` |
| A.3 | `phase-a-foundation/ws-a.3-design-tokens-ambient.md` |
| A.4 | `phase-a-foundation/ws-a.4-viewport-meta-safe-areas.md` |
| B.1 | `phase-b-situation-tab/ws-b.1-threat-banner-priority.md` |
| B.2 | `phase-b-situation-tab/ws-b.2-category-grid.md` |
| B.3 | `phase-b-situation-tab/ws-b.3-ambient-protective-ops.md` |
| C.1 | `phase-c-map-bottom-sheet/ws-c.1-bottom-sheet-core.md` |
| C.2 | `phase-c-map-bottom-sheet/ws-c.2-bottom-sheet-advanced.md` |
| C.3 | `phase-c-map-bottom-sheet/ws-c.3-map-view.md` |
| C.4 | `phase-c-map-bottom-sheet/ws-c.4-map-interactions.md` |
| C.5 | `phase-c-map-bottom-sheet/ws-c.5-settings-sheet.md` |
| D.1 | `phase-d-category-alert-detail/ws-d.1-category-detail.md` |
| D.2 | `phase-d-category-alert-detail/ws-d.2-alert-detail-card.md` |
| D.3 | `phase-d-category-alert-detail/ws-d.3-morph-navigation.md` |
| E.1 | `phase-e-intel-search/ws-e.1-intel-tab.md` |
| E.2 | `phase-e-intel-search/ws-e.2-region-detail-search.md` |
| E.3 | `phase-e-intel-search/ws-e.3-cross-tab-links.md` |
| F.1 | `phase-f-landscape-polish/ws-f.1-landscape-layouts.md` |
| F.2 | `phase-f-landscape-polish/ws-f.2-accessibility-audit.md` |
| F.3 | `phase-f-landscape-polish/ws-f.3-performance-pwa.md` |
| F.4 | `phase-f-landscape-polish/ws-f.4-protective-ops-hooks.md` |
| F.5 | `phase-f-landscape-polish/ws-f.5-pull-to-refresh.md` |
