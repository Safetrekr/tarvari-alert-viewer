# Discovery Log -- Mobile View -- TarvaRI Alert Viewer

> **Started:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Current Phase:** 7. Validate & Synthesize (COMPLETE)
> **Discovery Depth:** STANDARD

## Phase Status

| Phase | Status | Key Findings |
|-------|--------|--------------|
| 1. Understand Intent | COMPLETE | 10 stated goals, 7 implicit goals, 8 technical + 5 design constraints, 7 ambiguities, 9 assumptions, 13 risks identified. Scope calibration: STANDARD. |
| 2. Explore Codebase | COMPLETE | 45 hooks, 12 stores, 20+ components per subdirectory, zero mobile code. All 8+ referenced data hooks exist. settings.store has effectsEnabled + audioNotificationsEnabled. startMorph fast path exists at ui.store.ts:111. |
| 3. Assess Current State | COMPLETE | FULLY EXISTS: All data hooks, all stores, all types, API client, morph fast path, settings store. PARTIALLY EXISTS: page.tsx (needs extraction), URL sync (needs ?tab= param). COMPLETELY MISSING: All 20+ mobile-only components, useIsMobile, mobile-tokens.css, bottom sheet, landscape layouts, protective ops hooks. Zero touch handlers in codebase. |
| 4. Identify Gaps & Decisions | COMPLETE | 7 critical gaps resolved, 7 architecture decisions made, 12 risks, 4 open questions, 14 deferred items, 13 assumptions (10 validated). PO consultation completed. |
| 5. Decompose into Work Areas | COMPLETE | 6 phases (A-F), 21 work areas. Phase F split into 5 workstreams to address overload risk. MVS = Phases A-C (foundation + situation + map + bottom sheet). |
| 6. Select Agents | COMPLETE | 3 agents assigned: react-developer (18 WS), world-class-ui-designer (2 WS), quality-engineering-lead (1 WS). 3 standing roles. 4 optional supporting agents. |
| 7. Validate & Synthesize | COMPLETE | All goals covered, phase ordering validated, 7 gaps resolved, 7 AD decisions made, 12 risks, 4 open questions. Deliverables written. |

## Key Findings (running log)

### Phase 1

- **10 stated goals** extracted (SG-1 through SG-10), all HIGH confidence, all resolved with client decisions
- **7 implicit goals** identified: field operator viability (IG-1), performance validation before full build (IG-2), dual component tree maintainability (IG-3), battery efficiency (IG-4), data freshness trust (IG-5), automated test coverage (IG-6), interaction discoverability (IG-7)
- **7 ambiguities** found: category detail push-nav vs bottom-sheet (A-1), polling frequency authority (A-2), fullscreen mode architecture (A-3), landscape 3-col sizing (A-4), morph+tab-switch conflict (A-5), Show-on-Map fly-to without coordinates (A-6), shared vs new category card (A-7)
- **3 critical risks**: bottom sheet as load-bearing abstraction (RS-1), aesthetic vs accessibility structural tension (RS-2), aggressive 5-week timeline with Phase 6 overload (RS-3)
- **Pre-existing bug found**: Login page doesn't work on mobile -- virtual keyboard "Go"/"Enter" doesn't submit because there's no `<form>` wrapper. Fixed outside discovery scope (passphrase-field.tsx).

### Phase 2

- **45 hooks** in `src/hooks/` (all custom)
- **12 Zustand stores** in `src/stores/` (ui, coverage, settings, camera, auth, narration, districts, attention, ai, triage, builder, enrichment)
- **All referenced data hooks exist and are production-ready:**
  - `useThreatPicture()` -- `/console/threat-picture`, 120s poll, returns ThreatPicture
  - `usePriorityFeed()` -- `/console/priority-feed`, 15s poll, returns PriorityFeedSummary with p1Count/p2Count/mostRecentP1
  - `useCoverageMetrics()` -- `/console/coverage` + `/console/intel`, 60s poll
  - `useCoverageMapData()` -- `/console/coverage/map-data`, 30s poll, returns MapMarker[]
  - `useCategoryIntel(categoryId)` -- `/console/intel?category=`, 45s poll, returns CategoryIntelItem[]
  - `useIntelSearch(query)` -- `/console/search/intel`, on-demand, returns SearchResult[]
  - `useLatestGeoSummary()` + `useGeoSummaryHistory()` + `useAllGeoSummaries()` -- `/console/summaries/*`, 120s poll
  - `useIntelBundles()` -- `/console/bundles`, 45s poll
- **settings.store.ts** already has: `effectsEnabled`, `audioNotificationsEnabled`, `notificationConsent`
- **startMorph with `{ fast: true }`** exists at ui.store.ts line 111-114 (skips expanding+settled, jumps to entering-district)
- **Zero mobile code exists**: No `matchMedia('max-width')`, no touch handlers, no responsive breakpoints

### Phase 3

**FULLY EXISTS (shared data layer -- zero modifications needed):**
- All 8+ TanStack Query hooks
- Both primary stores (ui.store.ts, coverage.store.ts)
- settings.store.ts
- tarvari-api.ts client
- All TypeScript interfaces
- coverage-utils.ts + buildAllGridItems()
- CoverageMap, MapMarkerLayer, MapPopup
- SessionTimecode
- ViewModeToggle, TimeRangeSelector
- passphrase-field.tsx (form wrapper fix applied)
- Morph fast path

**PARTIALLY EXISTS:**
- page.tsx (~742 lines) -- needs extraction into DesktopView.tsx (no logic changes)
- URL sync in coverage.store.ts -- works but needs `?tab=` parameter

**COMPLETELY MISSING (30+ items):**
- useIsMobile() hook
- HydrationShell
- MobileView entry point
- All 20+ mobile-only components (MobileShell, MobileHeader, MobileBottomNav, MobileBottomSheet, MobileThreatBanner, MobileCategoryGrid, MobileCategoryCard, MobilePriorityStrip, MobileMapView, MobileFilterChips, MobileCategoryDetail, MobileAlertCard, MobileAlertDetail, IntelTab, MobileRegionDetail, MobileSearchOverlay, MobileSettings, ThreatPulseBackground, EdgeGlowIndicators, MobileScanLine, MobileThreatIndicator)
- src/styles/mobile-tokens.css
- New hooks: useIdleLock, useP1AudioAlert, useScrollGatedGlass, usePullToRefresh
- PWA manifest + icons
- Landscape layouts
- All accessibility ARIA patterns

**Key reframe:** This is a pure presentation layer build. No data, API, or state management work needed.

### Phase 4

**7 critical gaps resolved:**
1. Bottom sheet elevated from single task to 2 dedicated workstreams
2. Pull-to-refresh: custom hook with touch events + TanStack Query invalidation
3. Category detail: bottom sheet (not push nav), with internal back button
4. "Show on Map" without coordinates: static country centroid fallback table
5. Mobile polling intervals: same as desktop + visibility gating
6. Morph + tab switch conflict: cancel morph on tab switch
7. Landscape detection: matchMedia orientation listener in MobileShell

**7 architecture decisions made:**
AD-1 through AD-7 documented in combined-recommendations.md

### Phase 5

6 phases, 21 work areas. Phase F (19 tasks from OVERVIEW) split into 5 workstreams.

### Phase 6

4 primary agents with distributed ownership: react-developer (8 WS), world-class-ui-designer (6 WS), world-class-ux-designer (5 WS), information-architect (4 WS). Promotes quality-engineering-lead to optional supporting role. PO recommendation incorporated: safe areas promoted to Phase A (WS-A.4), Settings promoted to Phase C (WS-C.5).

### Phase 7

DISCOVERY PASS. 4 minor findings incorporated: (1) 3 deferred items added (IG-6 test coverage, N1 route overlay, N4 offline cache), (2) iOS Safari compatibility risk added (#13), (3) Pull-to-refresh Chrome conflict risk added (#14), (4) MobileStateView implementation note added for error/loading/empty states.

## Unresolved Questions
- A-1: RESOLVED -- Category detail is bottom sheet with internal back button (Gap 3)
- A-2: RESOLVED -- Same polling intervals as desktop + visibility gating (Gap 5)
- A-5: RESOLVED -- Cancel morph on tab switch (Gap 6)

## Open Questions (for stakeholder)
1. "Show on Map" for alerts without coordinates: disable or fly to centroid?
2. 15 categories in 2-col grid: acceptable or implement super-categories?
3. Pull-to-refresh animation: scan-line sweep or standard spinner?
4. Settings logout: require confirmation?

## Specialist Consultations
| Agent | Question | Response Summary |
|-------|----------|-----------------|
| every-time | Phase 1 intent analysis | Comprehensive 7-section analysis with 10 stated goals, 7 implicit goals, 7 ambiguities, 9 assumptions, 13 risk signals |
| software-product-owner | Phase 4 priority/scope validation | Move safe areas + viewport meta to Phase A. Move Settings to Phase C. Bottom sheet spike recommended. Phase C = viable MVS with settings addition. Error/loading/empty states need explicit acceptance criteria per workstream. |
| every-time | Phase 6 agent selection | Distributed roster: react-developer 8, ui-designer 6, ux-designer 5, info-architect 4. quality-engineering-lead demoted to optional. |
| every-time | Phase 7 final validation | DISCOVERY PASS. 4 minor findings: missing deferred items (IG-6, N1, N4), iOS Safari risk, EdgeGlow placement note, pull-to-refresh Chrome conflict. |

## Deliverables
- `combined-recommendations.md` -- Written
- `agent-roster.md` -- Written
