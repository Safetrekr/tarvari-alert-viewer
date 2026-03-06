# Combined Recommendations — TarvaRI Alert Viewer — Summaries & More

> **Discovery Pass:** 1 (foundation) | **Depth:** STANDARD | **Date:** 2026-03-05
> **Input Signals:** `summaries-and-more.md` (protective agent analysis) + TarvaRI Touch-Ups 3 `combined-recommendations.md` (backend plan)
> **Validation:** `#every-time` structured reasoning (Phases 1 + 7)
> **Specialist Consultations:** `#spo` (product owner), `#wcud` (UX designer), `#ia` (information architect)

---

## Executive Summary

This plan covers the **viewer-side (frontend) work** to consume new API endpoints being built in TarvaRI Touch-Ups 3. The backend plan delivers 5 phases (A-E) of new endpoints; this plan defines 7 phases (0-6) of viewer work to surface that data in the spatial dashboard.

**8 stated goals** across 3 prominence tiers, mapped to **7 phases** containing **27 work areas**. Phase 0 is a prerequisite consolidation phase with no backend dependency. Phases 1-6 each depend on specific backend phases completing first.

**Key additions to the viewer:**
- Priority badges on all alert surfaces (achromatic visual channel — shape/weight, not color)
- Persistent P1/P2 priority feed strip in world-space
- Real-time push notifications (Supabase Realtime + sonner + Browser Notification API)
- Async keyword search in command palette with fast morph navigation
- Geographic intelligence slide-over panel (World → Region → Country hierarchy)
- Enhanced map filters (bbox, source)
- Public deployment via GitHub Pages (static export + Supabase direct)

**Estimated total viewer effort:** 12-18 days across 7 phases (parallelizable with backend delivery).

---

## Architecture Decisions

### AD-1: Priority Uses Achromatic Visual Channel

**Decision:** Priority (P1-P4) uses shape, weight, and animation — NOT color. Severity continues to own the color channel.

**Rationale:** Treisman 1985 pre-attentive processing theory — two different visual dimensions (color vs. shape) are searchable in parallel. If both severity and priority used color, they'd compete for the same perceptual channel, forcing serial processing.

**Implementation:**
- P1: Bold weight + diamond/chevron shape + subtle pulse animation
- P2: Medium weight + triangle shape + static
- P3: Normal weight + text label only (visible in detail views, not list views)
- P4: Invisible by default (progressive disclosure — only shown when explicitly filtered)

**Source:** IA specialist consultation, validated by UX specialist.

### AD-2: P1/P2 Strip is World-Space

**Decision:** The persistent P1/P2 priority feed strip is positioned in the SpatialCanvas at `y=-842` (above the toolbar at `y=-794`), not viewport-fixed.

**Rationale:** User explicitly requested world-space placement. The strip sits in its own ZoomGate (visible at Z1+), outside the `morph-panels-scatter` wrapper so it remains visible and un-blurred during morph transitions.

**Constraints:**
- Must re-enable `pointer-events: auto` (SpatialCanvas disables pointer-events on children)
- Must not interfere with TopTelemetryBar (viewport-fixed, separate z-context)
- When count is 0, shows muted "ALL CLEAR" state (absence of alerts is information)

**Source:** User direction + UX specialist placement recommendation.

### AD-3: Geo Summary Panel is a 560px Slide-Over

**Decision:** Geographic intelligence summaries display in a 560px slide-over panel from the right edge, at `z-42` (between district overlay z-30 and triage panel z-45).

**Rationale:** UX and IA specialists agreed that a slide-over preserves spatial context (the map and grid remain partially visible), unlike a full-screen overlay. 560px provides enough width for the hierarchical content (threat level, key developments, recommendations, watch items) without dominating the viewport.

**Behavior:**
- Entry point: "THREAT PICTURE" button in CoverageOverviewStats or NavigationHUD
- Hierarchy: World overview → Region drill-down → Country detail
- Hourly deltas in "What's Changed" section
- Daily comprehensive as the primary brief
- Dismissible via Escape or click-outside

**Source:** UX + IA specialist consensus.

### AD-4: Fast Morph for Search Navigation

**Decision:** Search result clicks trigger a "fast morph" — 300ms total instead of ~1200ms, skipping the `expanding` and `settled` phases entirely.

**Rationale:** When the user has already identified their target via search, the morph animation is a delay, not a wayfinding aid. The fast path jumps directly from `idle` → `entering-district` (600ms reduced to 300ms).

**Implementation:** Add `options?: { fast?: boolean }` parameter to `startMorph()` in `ui.store.ts`. `useMorphChoreography()` checks the flag and adjusts phase durations.

**Source:** UX specialist recommendation.

### AD-5: Sonner for Toast Notifications

**Decision:** Use `sonner` as the toast/notification library.

**Rationale:** shadcn/ui compatible, lightweight, Next.js ecosystem standard. No existing toast library is installed.

### AD-6: Two-Step Browser Notification Consent

**Decision:** Browser Notification API permission is requested via a two-step pattern: (1) in-app prompt explaining the value proposition, (2) native browser permission dialog only after user accepts the in-app prompt.

**Rationale:** Cold-requesting `Notification.requestPermission()` on page load has high denial rates. The in-app step lets us explain "Get immediate alerts when P1 threats are detected" before the browser dialog appears.

**Source:** UX specialist recommendation.

### AD-7: 11 Travel-Security Geographic Regions

**Decision:** Custom taxonomy of 11 regions (not UN M.49):

1. North America
2. Central America & Caribbean
3. South America
4. Western Europe
5. Eastern Europe
6. Middle East
7. North Africa
8. Sub-Saharan Africa
9. South & Central Asia
10. East & Southeast Asia
11. Oceania

Turkey maps to Middle East. Russia maps to Eastern Europe.

**Rationale:** These align with how travel security professionals think about risk regions, not statistical subdivisions. User provided the initial list; IA specialist refined.

### AD-8: Threat Picture Lives in Geo Summary Panel

**Decision:** The `/console/threat-picture` data is consumed by the geo summary panel (Phase 4), not displayed as a standalone dashboard element.

**Rationale:** IA specialist identified that threat picture data (category counts, severity distribution, trends) is most useful as context within geographic summaries, not as a separate surface competing for attention with the P1/P2 feed.

### AD-9: Phase 0 Consolidation

**Decision:** Remove redundant stats from CoverageOverviewStats (Sources and Active rows) before adding new elements, reducing from 5 rows to 3 (All button, Total Alerts, Categories).

**Rationale:** IA specialist identified that "Active Sources" and "Sources" are redundant with information already available in category cards. Removing them before Phase 1 prevents the stats panel from becoming overcrowded when priority counts and geo summary entry points are added.

### AD-10: Build-Time Data Mode Switching

**Decision:** `NEXT_PUBLIC_DATA_MODE` environment variable (`'console'` | `'supabase'`) controls whether hooks fetch from TarvaRI API or Supabase directly.

**Rationale:** The public GitHub Pages deployment cannot reach the TarvaRI backend. It reads approved intel directly from Supabase via anon key + RLS. The console (dev/internal) mode continues using the TarvaRI API. Build-time switching keeps the runtime simple — no dynamic mode detection needed.

---

## Phase Plan

### Phase 0: Consolidate & Prepare (no backend dependency)

**Goal:** Clean up redundancies, establish type foundations, and install dependencies before adding new features. Zero backend dependency — can start immediately.

| WS | Description | Size | Agent | Key Detail |
|----|-------------|------|-------|------------|
| 0.1 | Simplify CoverageOverviewStats | S | react-developer | Remove "Sources" and "Active" rows. Keep: All button, Total Alerts, Categories. 3 rows. |
| 0.2 | Add priority types to interfaces | S | react-developer | `OperationalPriority` type (`'P1' \| 'P2' \| 'P3' \| 'P4'`), `PRIORITY_LEVELS` constant with display metadata (label, shape, weight) in `interfaces/coverage.ts` |
| 0.3 | Install sonner | S | react-developer | `pnpm add sonner`. Add `<Toaster />` to root layout. |
| 0.4 | Create PriorityBadge component | S | react-developer | Achromatic badge: P1 = bold + diamond + pulse, P2 = medium + triangle, P3 = text-only, P4 = hidden. Located at `src/components/coverage/PriorityBadge.tsx`. |

**Dependencies:** None. Can start day 1.
**Total:** 4 WS, all S. ~1 day.

---

### Phase 1: Priority Badges (backend Phase A dependency)

**Goal:** Make operational priority visible on every existing alert surface — cards, lists, detail panels, map markers. This is the foundational visual layer that enables all subsequent priority-dependent features.

| WS | Description | Size | Agent | Key Detail |
|----|-------------|------|-------|------------|
| 1.1 | Extend API types with operational_priority | S | react-developer | Add `operational_priority` to `ApiIntelItem` (snake_case), `IntelFeedItem`, `MapMarker`, `ApiBundleItem`. Update `use-intel-feed.ts`, `use-coverage-map-data.ts`, `use-intel-bundles.ts` normalizers. |
| 1.2 | Add P1/P2 count to CoverageByCategory + CategoryCard | M | react-developer | Extend `CoverageByCategory` with `p1Count`, `p2Count`. CategoryCard shows PriorityBadge in top-right corner when p1Count + p2Count > 0. Requires `/console/coverage` endpoint to include priority breakdown — **if not available from backend yet, derive from `/console/intel` response**. |
| 1.3 | Wire priority into district alert list + INSPECT | S | react-developer | Add PriorityBadge to `CategoryDetailScene` alert list rows. Add priority display to INSPECT detail panel (`TriageRationalePanel` or equivalent). |
| 1.4 | Priority filter in coverage store | S | react-developer | Add `selectedPriorities: OperationalPriority[]` to coverage store. Add filter control in district view toolbar. Empty = show all. |
| 1.5 | Map marker priority scaling | S | react-developer | P1 markers: `circle-radius: 9` (vs default 6) + glow effect. P2: `circle-radius: 7.5`. P3/P4: default 6. Update `CIRCLE_COLOR_EXPRESSION` replacement or add a parallel `CIRCLE_RADIUS_EXPRESSION` in `map-utils.ts`. Note: this is radius by priority, NOT color — color stays severity-driven. |

**Dependencies:** Backend Phase A (specifically A.5 — console endpoints return `operational_priority`).
**Total:** 5 WS (1M + 4S). ~2-3 days.

---

### Phase 2: P1/P2 Feed & Real-Time Notifications (backend Phase B dependency)

**Goal:** Deliver the highest-value protective intelligence feature — persistent visibility of P1/P2 alerts with interrupt-level notifications for new P1 arrivals.

| WS | Description | Size | Agent | Key Detail |
|----|-------------|------|-------|------------|
| 2.1 | usePriorityFeed hook | M | react-developer | `src/hooks/use-priority-feed.ts` — polls `GET /console/priority-feed`, returns `PriorityFeedItem[]` (P1+P2 only, sorted by priority then recency). Poll interval: 15s (faster than regular intel at 30s). TanStack Query with `keepPreviousData: true`. |
| 2.2 | PriorityFeedStrip component | M | react-developer | `src/components/coverage/PriorityFeedStrip.tsx` — persistent strip in SpatialCanvas at `y=-842`, `x` centered on grid. Shows: total P1 count (pulsing if > 0) + P2 count + most recent title + time-ago. Muted "ALL CLEAR" when both counts are 0. Click expands to PriorityFeedPanel. Own ZoomGate (Z1+), outside `morph-panels-scatter`, `pointer-events: auto`. |
| 2.3 | PriorityFeedPanel (expanded view) | M | react-developer | `src/components/coverage/PriorityFeedPanel.tsx` — slide-down or overlay panel showing full P1/P2 feed list. Similar UX to existing FeedPanel but filtered. Each item shows: PriorityBadge + severity color + title + category + time-ago. Click item → navigate to district (using existing morph + districtPreselectedAlertId pattern). |
| 2.4 | useRealtimePriorityAlerts hook | M | react-developer | `src/hooks/use-realtime-priority-alerts.ts` — Supabase Realtime subscription on `intel_normalized` table filtered to `operational_priority IN ('P1', 'P2')`. Uses existing `src/lib/supabase/client.ts`. On INSERT: invalidate priority feed query cache + trigger notification. Graceful fallback to polling if Realtime connection fails. |
| 2.5 | Notification system | M | react-developer | Two notification channels: (1) **In-app:** sonner toast with title, severity icon, category, "View" action button. Auto-dismiss after 8s for P2, persist until dismissed for P1. (2) **Browser:** `Notification` API for background tabs. Two-step consent: settings toggle → in-app explainer → native permission request. Audio cue configurable (off by default). Store consent state in `localStorage`. |
| 2.6 | Coverage store extensions | S | react-developer | Add to coverage.store.ts: `priorityFeedExpanded: boolean`, `setPriorityFeedExpanded(open: boolean)`, `notificationConsent: 'undecided' \| 'granted' \| 'denied'`, `setNotificationConsent(state)`. |

**Dependencies:** Backend Phase B (B.1 for feed endpoint, B.4 for Realtime RLS). WS-2.4 specifically blocked on Supabase Realtime RLS verification — if blocked, fall back to 10s polling in usePriorityFeed.
**Total:** 6 WS (1S + 5M). ~4-5 days.

---

### Phase 3: Search Integration (backend Phase C dependency)

**Goal:** Replace the command palette's sync-only filtering with real backend search, and provide fast navigation from search results to district views.

| WS | Description | Size | Agent | Key Detail |
|----|-------------|------|-------|------------|
| 3.1 | useIntelSearch hook | M | react-developer | `src/hooks/use-intel-search.ts` — calls `GET /console/search/intel?q=&category=&severity=&date_from=&date_to=&limit=10&offset=0`. Debounced at 300ms. Returns `SearchResult[]` with `id`, `title`, `snippet` (ts_headline HTML), `severity`, `category`, `priority`, `score`. Uses TanStack Query with `enabled: query.length >= 3`. |
| 3.2 | Async search group in CommandPalette | M | react-developer | Add `<CommandGroup heading="Intel Search">` below existing groups. Shows loading spinner while debouncing/fetching. Results display: PriorityBadge + severity dot + title + snippet (dangerouslySetInnerHTML for ts_headline `<b>` tags — sanitize first). Empty state: "No results" or "Type 3+ characters to search". Max 10 results shown. |
| 3.3 | Search → fast morph navigation | S | react-developer | Click search result: (1) close command palette, (2) determine category from result, (3) call `startMorph(category, { fast: true })`, (4) set `districtPreselectedAlertId` to result ID. Reuses existing INSPECT → VIEW DISTRICT pre-selection pattern. |
| 3.4 | Fast morph support in ui.store | S | react-developer | Extend `startMorph(targetId, options?)` in `ui.store.ts`. When `options.fast === true`, `useMorphChoreography()` skips `expanding` + `settled` phases, transitions directly `idle → entering-district` with 300ms duration. |

**Dependencies:** Backend Phase C (C.2 — search endpoint). Phase 3 is independent of Phases 1-2.
**Total:** 4 WS (2S + 2M). ~3 days.

---

### Phase 4: Geographic Intelligence (backend Phase D dependency)

**Goal:** Surface periodic geographic threat assessments in a hierarchical panel, and add trend indicators to existing category cards.

| WS | Description | Size | Agent | Key Detail |
|----|-------------|------|-------|------------|
| 4.1 | useThreatPicture hook | M | react-developer | `src/hooks/use-threat-picture.ts` — calls `GET /console/threat-picture`. Returns aggregated data: counts by category, severity distribution, priority breakdown, region breakdown, trend direction (up/down/stable). Poll interval: 120s (slow-changing data). |
| 4.2 | useGeoSummaries hook | M | react-developer | `src/hooks/use-geo-summaries.ts` — calls `GET /console/summaries?geo_level=&geo_key=&type=` and `GET /console/summaries/latest?geo_level=&geo_key=`. Returns `GeoSummary` with `summaryText`, `structuredBreakdown` (threats_by_category, severity_distribution, key_events, risk_trend, recommendations), `generatedAt`, `validatedAt`. |
| 4.3 | GeoSummaryPanel component | L | react-developer | `src/components/coverage/GeoSummaryPanel.tsx` — 560px slide-over from right at z-42. **Content structure:** (1) Header with geo level breadcrumb (World > Europe > France), (2) Threat level badge (LOW/MODERATE/ELEVATED/HIGH/CRITICAL), (3) Executive summary text, (4) "What's Changed" section (hourly delta), (5) Structured breakdown: threats-by-category mini chart, severity distribution bar, key events list, recommendations, (6) Region/country drill-down navigation. Uses `motion/react` for slide animation. Escape to dismiss. |
| 4.4 | Trend indicators on CategoryCard | S | react-developer | Small up/down/stable arrow icon next to alert count on CategoryCard. Driven by threat picture data (comparing current period to previous). Arrow: `↑` red-tinted for increase, `↓` green-tinted for decrease, `→` gray for stable. |
| 4.5 | Entry point in stats/HUD | S | react-developer | "THREAT PICTURE" button in CoverageOverviewStats (replaces one of the removed rows' space) or as a NavigationHUD command. One click to open GeoSummaryPanel at World level. |
| 4.6 | Coverage store extensions | S | react-developer | Add: `geoSummaryOpen: boolean`, `summaryGeoLevel: 'world' \| 'region' \| 'country'`, `summaryGeoKey: string` (e.g., "world", "middle-east", "TR"), `summaryType: 'hourly' \| 'daily'`. Actions: `openGeoSummary(level?, key?)`, `closeGeoSummary()`, `drillDownGeo(level, key)`. |

**Dependencies:** Backend Phase D (D.6 — summary API endpoints). This is the last backend phase to complete (~7-10 days into backend work).
**Total:** 6 WS (3S + 2M + 1L). ~4-6 days.

---

### Phase 5: Enhanced Filters (backend Phase B.3 dependency)

**Goal:** Add geographic (bbox) and source-based filtering to the map and district views.

| WS | Description | Size | Agent | Key Detail |
|----|-------------|------|-------|------------|
| 5.1 | Extend map data hook with bbox/source params | S | react-developer | Add `bbox` (4-tuple: west, south, east, north) and `source_key` params to `useCoverageMapData`. Pass through to `/console/coverage/map-data` endpoint. Bbox derived from current map viewport bounds. |
| 5.2 | Filter UI in district view | M | react-developer | "Filters" toggle button in district view toolbar. Expandable panel with: (1) source selector (dropdown of known sources), (2) bbox toggle (when enabled, filters to current map viewport — auto-updates on pan/zoom). Not visible by default. |

**Dependencies:** Backend Phase B (B.3 — enhanced filter params on console endpoints).
**Total:** 2 WS (1S + 1M). ~1-2 days.

---

### Phase 6: Public Deployment (backend Phase E dependency)

**Goal:** Deploy the alert viewer to GitHub Pages as a static Next.js export reading from Supabase directly.

| WS | Description | Size | Agent | Key Detail |
|----|-------------|------|-------|------------|
| 6.1 | Data mode branching in hooks | M | react-developer | All data hooks check `NEXT_PUBLIC_DATA_MODE`. When `'supabase'`: import from `src/lib/supabase/queries.ts` instead of `tarvariGet`. Pattern: each hook has an internal `fetcher` that switches based on mode. Avoid duplicating TanStack Query logic — only the fetch function changes. |
| 6.2 | Supabase query functions | M | react-developer | `src/lib/supabase/queries.ts` — typed functions mirroring each hook's API call. Uses `supabase.from('public_intel_feed').select(...)` etc. against the public views created by backend Phase E.1. Types shared with existing hook types. |
| 6.3 | Static export configuration | M | react-developer | `next.config.ts`: add `output: 'export'` (conditional on env var or build script). Handle `@tarva/ui` workspace dependency for CI (may need to vendor or use `transpilePackages`). Verify MapLibre GL `next/dynamic` with `ssr: false` works in static export. Remove/stub any API routes if present. |
| 6.4 | GitHub Actions deployment workflow | S | devops-platform-engineer | `.github/workflows/deploy-pages.yml` — trigger on push to main. Steps: checkout, setup Node 22 + pnpm, install, build with `NEXT_PUBLIC_DATA_MODE=supabase` + Supabase env vars, deploy to GitHub Pages. Secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (safe with RLS). |

**Dependencies:** Backend Phase E (E.1-E.2 — public views + Supabase data layer).
**Total:** 4 WS (1S + 3M). ~3-4 days.

---

## Dependency Map

```
Backend Phase A ──► Viewer Phase 1 (Priority Badges)
                         │
Backend Phase B ──► Viewer Phase 2 (P1/P2 Feed + Notifications)
         │
         ├──────► Viewer Phase 5 (Enhanced Filters)
         │
Backend Phase C ──► Viewer Phase 3 (Search)

Backend Phase D ──► Viewer Phase 4 (Geo Intelligence)

Backend Phase E ──► Viewer Phase 6 (Public Deploy)

Viewer Phase 0 ──► All other phases (prerequisite)
```

**Parallel execution:** Phases 1, 3, 5 can proceed independently once their backend deps are met. Phase 2 depends on Phase 1 completing (needs priority types). Phase 4 is blocked on the latest backend delivery (Phase D). Phase 6 is independent.

**Recommended execution order:**
```
Day 1:       Phase 0 (consolidate)
Day 2-4:     Phase 1 (priority badges) — when backend Phase A lands
Day 3-6:     Phase 3 (search) — when backend Phase C lands (parallel with Phase 1)
Day 5-9:     Phase 2 (P1/P2 feed + notifications) — after Phase 1
Day 7-8:     Phase 5 (enhanced filters) — when backend Phase B.3 lands
Day 10-15:   Phase 4 (geo intelligence) — when backend Phase D lands
Day 12-15:   Phase 6 (public deploy) — when backend Phase E lands (parallel with Phase 4)
```

---

## Phase 7 Validation Results (`#every-time`)

**Overall verdict: CONFIRMED — plan is sound with actionable concerns.**

### Architecture Decisions: All 10 CONFIRMED

All architecture decisions (AD-1 through AD-10) passed structured reasoning validation. No reversals needed.

### Concerns Raised

**HIGH (3):**
1. **WS-2.4 Supabase Realtime divergence** — The Realtime subscription bypasses the `tarvariGet()` pattern used by all other hooks. This creates two data paths (REST polling + WebSocket push) that must be kept consistent. **Mitigation:** Realtime events invalidate TanStack Query cache rather than directly updating UI state. The query cache is the single source of truth.
2. **WS-6.3 @tarva/ui workspace dependency** — `@tarva/ui` is a workspace symlink (`../../tarva-ui-library/`). GitHub Actions CI won't have this path. **Mitigation:** Either (a) pre-build @tarva/ui and publish to npm, (b) copy the built package into the repo for CI, or (c) use `transpilePackages` with a monorepo-aware CI setup. Investigate during Phase 6.
3. **WS-3.4 fast morph modifies core navigation** — Adding `options.fast` to `startMorph` touches the most sensitive code path in the app. **Mitigation:** The fast flag only changes timing constants in `useMorphChoreography`, not the phase sequence. Add integration test for both normal and fast morph paths.

**MEDIUM (5):**
1. **Phase 5 could run parallel with Phase 2** — Both depend on backend Phase B. No need to wait for Phase 2 to complete. Adjust execution schedule.
2. **Search results need `category` field for morph target** — WS-3.3 calls `startMorph(category)` but search results must include the category. Ensure `/console/search/intel` response includes `category`.
3. **GeoSummaryPanel z-42 vs NavigationHUD z-40** — These are close in z-space. Ensure they don't visually overlap when both visible.
4. **Notification denied state** — Plan mentions two-step consent but doesn't specify UI for "permanently denied" state. Add a disabled toggle with tooltip in settings.
5. **`useCategoryIntel` hook missing from WS-1.1** — This hook also needs `operational_priority` added to its types. Added to WS-1.1 scope.

### Missing Items (integrated into plan)

1. **Notification preference toggle** — Should live in `settings.store.ts` (already has 4 toggles with localStorage persist), not coverage.store.ts. WS-2.6 updated.
2. **Typecheck gating** — Each phase should pass `pnpm typecheck` before merging. Added to acceptance criteria.
3. **`useCategoryIntel` priority field** — Added to WS-1.1 scope explicitly.

---

## Risk Register

| ID | Risk | Impact | Likelihood | Mitigation |
|----|------|--------|------------|------------|
| R1 | Backend Phase A delayed — blocks Phases 1 + 2 | HIGH | LOW | Phase 0 work proceeds. Phase 3 (search) and Phase 6 (public deploy) are independent. Build Phase 1 with mock priority data if needed. |
| R2 | Supabase Realtime RLS fails for reviewer role | MEDIUM | MEDIUM | WS-2.4 falls back to 10-second polling in usePriorityFeed. Acceptable latency for trip safety context. |
| R3 | Backend Phase D delayed (7-10 day estimate) — blocks Phase 4 | MEDIUM | MEDIUM | Phase 4 is the last viewer phase. All other phases can complete first. Build GeoSummaryPanel shell with mock data for layout validation. |
| R4 | sonner conflicts with existing CSS/z-index stack | LOW | LOW | sonner's Toaster accepts `className` and `position` props. Test z-index against existing z-30/z-40/z-42/z-45/z-50 stack. |
| R5 | P1/P2 strip visual competition with TopTelemetryBar | MEDIUM | MEDIUM | Strip is world-space (scrolls with canvas), TopTelemetryBar is viewport-fixed. At default zoom they're visually adjacent. UX specialist should validate spacing during Phase 2. |
| R6 | Fast morph (300ms) feels jarring without animation easing | LOW | MEDIUM | Use ease-out curve. If too abrupt, increase to 400ms. Test with real district content loading. |
| R7 | Static export breaks MapLibre dynamic import | MEDIUM | LOW | MapLibre is already loaded via `next/dynamic` with `ssr: false`. Verify in Phase 6 that static export preserves this pattern. Fallback: use `<script>` tag loader. |
| R8 | Browser Notification permission denied permanently | LOW | MEDIUM | Two-step consent pattern mitigates. If denied, gracefully degrade to in-app sonner toasts only. Never re-prompt after native denial. |
| R9 | CommandPalette search results + existing sync results create confusing UX | MEDIUM | MEDIUM | Async search group renders below sync groups with clear visual separator. Sync results answer "navigate to X"; async results answer "find intel about X". Different visual treatment (async results show snippets). |
| R10 | GeoSummaryPanel at z-42 overlaps with DistrictViewOverlay at z-30 | LOW | LOW | z-42 is above z-30, so panel renders on top. However, both are slide-overs from the right. If both open simultaneously, close the geo panel when district opens (or prevent opening). Add mutual exclusion logic in coverage store. |

---

## Constraints

1. **No code in this discovery pass.** This document is research and analysis only.
2. **All data hooks use `tarvariGet()` for console mode.** No direct Supabase queries in console mode (reserved for public mode only).
3. **Priority uses shape/weight, severity uses color.** Never assign colors to priority levels.
4. **World-space for new data elements.** Viewport-fixed chrome (TopTelemetryBar, BottomStatusStrip) is inherited and stable. New elements go in world-space per user direction.
5. **`pnpm` only.** Never `npm`.
6. **`motion/react` for animation.** Never `framer-motion` (same library, different import path).
7. **Morph state machine is sacred.** Only `useMorphChoreography()` calls `setMorphPhase()`. Fast morph modifies timing, not the phase sequence.
8. **SpatialCanvas disables pointer-events.** Every interactive element must re-enable with `style={{ pointerEvents: 'auto' }}`.
9. **Z-index budget:** z-30 (district), z-40 (HUD), z-42 (geo summary), z-45 (triage), z-50 (command palette). New surfaces must fit within this stack.
10. **No type files in `src/types/`.** Shared types go in `src/lib/interfaces/`. Feature-local types stay in their component/hook file.

---

## Deferred Items

| Item | Why Deferred | Trigger to Revisit |
|------|-------------|-------------------|
| Map marker color-by-priority mode | Conflicts with AD-1 (achromatic priority). Severity color is the primary map visual. | If users report difficulty distinguishing priority on the map despite size scaling |
| Priority sort in district alert list | Sort-by-priority option adds complexity to existing sort logic | After priority badges are live and users request sorting |
| Related Intel section in alert detail | Requires search endpoint + UX design for contextual recommendations | After Phase 3 search is live |
| Geographic region overlays on map | Color-coded region polygons on the main map | After Phase 4 geo summaries are live and users want spatial region context |
| Notification sound selection UI | Audio cue is configurable but only on/off in v1 | If users request different sounds for P1 vs P2 |
| Offline/PWA support for public viewer | Service worker caching for GitHub Pages deployment | If public viewer needs offline access |
| Deep linking to specific alert/district | URL-based navigation to a specific alert or category | After search + fast morph are stable |

---

## Open Questions (for implementation phase)

1. **P1/P2 feed strip height:** How tall should the strip be? Protective agent recommends minimal (32-40px) to avoid crowding the toolbar. UX should validate.
2. **Geo summary "What's Changed" empty state:** When the hourly delta has no changes, show "No changes in the last hour" or hide the section entirely?
3. **Search snippet sanitization:** ts_headline returns HTML with `<b>` tags. Use DOMPurify or a simpler allowlist sanitizer? (Recommend: simple `<b>`-only allowlist since the source is our own PostgreSQL.)
4. **Supabase Realtime channel naming:** What channel/topic pattern for P1/P2 subscriptions? Depends on backend Phase B.4 implementation.
5. **Static export and auth:** Does the public viewer need the passphrase auth gate? If yes, it needs to work without API routes (client-side only). If no, remove the auth guard for public mode.

---

## Assumptions

1. Backend Phase A will add `operational_priority` to all `/console/*` response models.
2. Backend Phase B.1 will provide a dedicated `/console/priority-feed` endpoint (not just filtered `/console/intel`).
3. Backend Phase C.2 will return `ts_headline` snippets in search results.
4. Backend Phase D.6 will provide `structured_breakdown` as parsed JSON (not a JSON string).
5. Backend Phase E.1 will create Supabase views named `public_intel_feed`, `public_bundles`, `public_bundle_detail`.
6. The `/console/coverage` endpoint can be extended to include P1/P2 counts per category (or this data can be derived client-side from `/console/intel`).
7. MapLibre GL's `next/dynamic` with `ssr: false` pattern is compatible with Next.js static export.
8. The `@tarva/ui` workspace dependency can be resolved in CI via `transpilePackages` or pre-built package.

---

## Acceptance Criteria Summary

### Phase 0
- [ ] CoverageOverviewStats shows exactly 3 rows: All, Total Alerts, Categories
- [ ] `OperationalPriority` type exists in `interfaces/coverage.ts`
- [ ] `sonner` installed and `<Toaster />` renders without errors
- [ ] PriorityBadge renders correctly for all 4 priority levels
- [ ] `pnpm typecheck` passes

### Phase 1
- [ ] All API types include `operational_priority` field
- [ ] CategoryCard shows P1/P2 badge when count > 0
- [ ] District alert list rows show PriorityBadge
- [ ] INSPECT panel shows priority
- [ ] Priority filter works in coverage store
- [ ] P1 map markers are visually larger than P3/P4

### Phase 2
- [ ] P1/P2 strip visible at Z1+ zoom, shows count + most recent title
- [ ] "ALL CLEAR" state when no P1/P2 alerts
- [ ] Click strip → expanded feed panel
- [ ] Click feed item → navigate to district with alert pre-selected
- [ ] New P1 arrival triggers sonner toast within 5 seconds (Realtime) or 15 seconds (polling fallback)
- [ ] Browser notification fires for P1 when tab is backgrounded (if consent granted)
- [ ] Two-step consent flow works correctly
- [ ] P1 toast persists until dismissed; P2 auto-dismisses after 8s

### Phase 3
- [ ] Command palette shows "Intel Search" group when query >= 3 characters
- [ ] Search results show snippet, severity, priority, category
- [ ] Click result → command palette closes → fast morph to district → alert pre-selected
- [ ] Fast morph completes in ~300ms (no expanding/settled phases)
- [ ] Empty search shows "No results" message

### Phase 4
- [ ] "THREAT PICTURE" button opens 560px slide-over
- [ ] World-level summary displays on open
- [ ] Drill-down to Region → Country works
- [ ] Breadcrumb navigation (World > Europe > France)
- [ ] "What's Changed" section shows hourly delta
- [ ] Structured breakdown renders: category chart, severity bar, key events, recommendations
- [ ] Escape dismisses panel
- [ ] CategoryCard trend arrows display (up/down/stable)

### Phase 5
- [ ] Map data filters by current viewport bbox when enabled
- [ ] Source selector filters to specific source
- [ ] Filters toggle in district view works

### Phase 6
- [ ] `NEXT_PUBLIC_DATA_MODE=supabase` build succeeds
- [ ] Static export generates functional site
- [ ] GitHub Actions workflow deploys to Pages
- [ ] Public viewer shows approved intel only (no unapproved, no sensitive fields)
- [ ] Console mode (`DATA_MODE=console`) still works normally
