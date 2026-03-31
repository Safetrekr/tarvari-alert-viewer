# Combined Recommendations -- Mobile View -- TarvaRI Alert Viewer

## Context

This discovery analyzed the TarvaRI Alert Viewer codebase (`/Users/jessetms/Sites/Safetrekr/tarvari-alert-viewer`) against 7 input signal documents: a master OVERVIEW.md, 4 specialist strategies (UX, UI Design System, Information Architecture, Interface Architecture), a cross-document synthesis (every-time-synthesis.md), and a protective operations review. The input signals describe building a mobile view for a spatial intelligence dashboard used by security analysts at SafeTrekr.

The desktop application uses a Zoomable User Interface (ZUI) engine with a 20,000x20,000px pannable/zoomable canvas -- fundamentally incompatible with mobile. The mobile view provides a purpose-built, touch-native experience within the same Next.js 16 codebase, using a 3-tab vertical layout (Situation, Map, Intel) with bottom sheets for drill-down.

**Key reframe from discovery:** The codebase is far more mature than a typical greenfield mobile project would expect. All 8+ TanStack Query data hooks, all 12 Zustand stores, all TypeScript interfaces, and all API client code already exist and are production-ready. The mobile effort is purely a **presentation layer build** -- no data layer, API, or state management work is needed. This significantly de-risks the project but focuses all complexity on UI component development, gesture handling, and the bottom sheet framework.

---

## Critical Gap Resolutions

### Gap 1: Bottom Sheet Under-Scoped

**Decision:** Elevate MobileBottomSheet from a single task (OVERVIEW 3.3, size L) to a dedicated workstream with 4 sub-tasks.

- The bottom sheet is the load-bearing UI abstraction for the entire mobile experience. It powers alert detail, category detail, settings, time range selection, and triage rationale.
- Required capabilities: spring physics (`motion/react` drag), 4 per-context snap point configurations, scroll-vs-drag conflict resolution (`overscroll-behavior: contain` + scroll position gating), expand-to-fullscreen transition (client Q7), `history.pushState` / `popstate` for browser back, focus trap (`dialog` role), landscape-aware max height (~60%), backdrop click-to-dismiss.
- A bug in this component blocks Phases D, E, and F.
- **Sub-tasks:** (1) Core drag + snap physics, (2) Per-context snap point configs + scroll conflict, (3) Expand-to-fullscreen + collapse, (4) popstate integration + focus trap + accessibility.
- Per OVERVIEW `interface-architecture.md` Section 5.7, `ui-design-system.md` Section 11.

### Gap 2: Pull-to-Refresh Has No Implementation Path

**Decision:** Create a `usePullToRefresh` hook that wraps TanStack Query's `queryClient.invalidateQueries()` with a touch gesture detector.

- Pull-to-refresh is referenced in OVERVIEW Sections 4.1 (Situation), 4.3 (Intel), and 4.2 (Map implicitly) but has no implementation detail.
- No touch event handlers exist anywhere in the current codebase (verified: zero `touchstart`/`touchmove`/`touchend` references in `src/`).
- Implementation: Custom hook using `touchstart`/`touchmove`/`touchend` on the scroll container. When pulled past 60px threshold from scroll-top-0, trigger `queryClient.invalidateQueries()` for the active tab's queries. Animate with `MobileScanLine` sweep.
- No external library needed -- the gesture is simple enough for a custom ~80-line hook.
- Per OVERVIEW `ux-strategy.md` Section 4.1.

### Gap 3: Category Detail Architecture Ambiguity (A-1)

**Decision:** Category detail is a **bottom sheet** (not push navigation), with an internal back button in the sheet header.

- The OVERVIEW title says "Bottom Sheet / Push Navigation" but the morph state machine (`startMorph(id, { fast: true })` -> `entering-district` -> `district`) maps to bottom sheet lifecycle, not route-level navigation.
- The wireframe shows `<- Back` in the header, which is an internal back button within the sheet content, not route-level back.
- `popstate` integration handles browser/device back button -> dismisses sheet -> calls `reverseMorph()`.
- Per OVERVIEW `interface-architecture.md` Section 6.3, `information-architecture.md` Section 8.4.

### Gap 4: "Show on Map" Without Coordinates (A-6)

**Decision:** When an alert has no geographic coordinates (only country code `geo_scope`), "Show on Map" performs a country-level fly-to using a static centroid lookup table.

- Alerts have `geoScope: string[] | null` which contains ISO country codes (e.g., `["PG", "AU"]`), not coordinates.
- `MapMarker` objects from `useCoverageMapData()` DO have lat/lng coordinates (GeoJSON properties).
- Strategy: (1) If the alert ID matches a `MapMarker`, fly to that marker's coordinates. (2) If no marker match, use the first `geoScope` country code to look up a centroid from a static `COUNTRY_CENTROIDS` map. (3) If no `geoScope`, disable the "Show on Map" button with a tooltip "No location data available."
- Static centroid lookup is ~200 entries, ~3KB gzipped, no API call needed.
- Per OVERVIEW `information-architecture.md` Section 9.2.

### Gap 5: Mobile-Specific Polling Intervals (A-2)

**Decision:** Use the same polling intervals as desktop. No mobile-specific optimization needed.

- All hooks already use reasonable intervals: `usePriorityFeed` 15s, `useCoverageMapData` 30s, `useCoverageMetrics` 60s, `useThreatPicture` 120s, `useGeoSummaries` 120s.
- Add `document.visibilityState` gating: disable all polling when the app is backgrounded (tab hidden). TanStack Query's `refetchOnWindowFocus` already handles the reverse (refetch when foregrounded).
- Per OVERVIEW `information-architecture.md` Section 17.1 R5, `interface-architecture.md` Section 6.5.

### Gap 6: Morph + Tab Switch Conflict (A-5)

**Decision:** If the user switches tabs during an active morph (unlikely but possible), immediately cancel the morph by calling `resetMorph()`.

- The morph fast path is 300ms total. Tab switching during this window is extremely unlikely.
- If it happens: `MobileShell`'s tab-switch handler checks `morph.phase !== 'idle'` and calls `resetMorph()` before switching tabs.
- Per OVERVIEW `every-time-synthesis.md` ambiguity A-5.

### Gap 7: Landscape Phone Detection

**Decision:** Use `window.matchMedia('(orientation: landscape)')` listener in `MobileShell` to switch layout variants. No separate hook needed.

- Landscape detection is purely a layout concern within `MobileShell`.
- CSS Grid with `@media (orientation: landscape)` handles most layout changes.
- Bottom sheet max height constraint (60%) uses the same media query.
- Per OVERVIEW `interface-architecture.md` Section 5.1, client Q2.

---

## Architecture Decisions

### AD-1: Separate Mobile Component Tree

**Decision:** Build entirely separate mobile components, switched at the page level by `useIsMobile()`. Shared data layer only.

- `page.tsx` becomes a thin orchestrator: `useIsMobile()` -> `null` renders `HydrationShell`, `true` renders `MobileView` (dynamic import), `false` renders `DesktopView` (dynamic import).
- Both `MobileView` and `DesktopView` use `next/dynamic` with `ssr: false` to enforce code splitting and prevent mobile users from downloading desktop components (and vice versa).
- All current `page.tsx` contents (~742 lines) extract into `DesktopView.tsx` WITHOUT modification.
- Key types/files shared: `src/hooks/use-*.ts`, `src/stores/*.ts`, `src/lib/interfaces/*.ts`, `src/lib/tarvari-api.ts`, `src/lib/coverage-utils.ts`.
- Per OVERVIEW Section 1, `interface-architecture.md` Section 4.

### AD-2: Custom Bottom Sheet (No External Library)

**Decision:** Build `MobileBottomSheet` using `motion/react` v12 drag handlers. No external bottom sheet library.

- `motion/react` is already a dependency and provides `drag`, `dragConstraints`, `dragElastic`, and spring animations.
- External libraries (react-spring-bottom-sheet, vaul) add bundle size and may conflict with the existing motion/react animation system.
- Custom implementation allows precise control over: per-context snap points, Oblivion-aesthetic glass background, expand-to-fullscreen transition, and integration with the morph state machine.
- Estimated implementation: ~300 lines for the core component + ~100 lines for scroll conflict resolution.
- Per OVERVIEW `interface-architecture.md` Section 5.7, R19 (no external gesture library).

### AD-3: Tab State Management

**Decision:** Local `useState` in `MobileShell` for tab state, with URL sync on initial load only.

- On mount, `MobileShell` reads `?tab=map|intel` from URL to set initial tab. Default is Situation (no param needed).
- Tab switches update `useState` locally. URL is NOT updated on every tab switch (avoids polluting browser history with tab changes).
- Deep-link support: `?tab=map&category=seismic` works on page load.
- `?district=seismic` on page load sets initial tab to Situation and opens category detail bottom sheet.
- Per OVERVIEW `interface-architecture.md` Section 6.2, Section 5.4.

### AD-4: Mobile Component Directory

**Decision:** All mobile-only components in `src/components/mobile/` (flat directory, no nesting).

- 20+ mobile components in a single directory is manageable with clear naming (`Mobile` prefix on all except `IntelTab`, `ThreatPulseBackground`, `EdgeGlowIndicators`, `HydrationShell`).
- Entry point `src/views/MobileView.tsx` composes the mobile component tree.
- Per OVERVIEW Section 3.1 component tree diagram.

### AD-5: Code Splitting Boundaries

**Decision:** Three chunks for mobile: (1) core shell + Situation tab, (2) Map tab (MapLibre), (3) Bottom sheet + detail views.

- Core chunk: `MobileView` -> `MobileShell` + `MobileHeader` + `MobileBottomNav` + Situation tab components. Target: <60KB gzipped.
- Map chunk: `MobileMapView` wrapping `CoverageMap` + `MapMarkerLayer`. Lazy-loaded when Map tab is first accessed. Target: <180KB gzipped (MapLibre GL JS is ~160KB).
- Detail chunk: `MobileBottomSheet` + `MobileCategoryDetail` + `MobileAlertDetail` + `MobileSearchOverlay`. Lazy-loaded on first interaction. Target: <25KB gzipped.
- Per OVERVIEW `interface-architecture.md` Section 9.1.

### AD-6: Settings Store Reuse

**Decision:** Reuse the existing `settings.store.ts` for mobile settings. Add 1 new field for idle lock timeout.

- `settings.store.ts` already has `effectsEnabled` (for ambient toggle) and `audioNotificationsEnabled` (for P1 sound toggle). These map directly to the mobile Settings sheet controls.
- Add `idleLockTimeoutMinutes: number` (default 5, options: 1/5/15/0 for never) to the store.
- The persist middleware with localStorage ensures settings survive page reloads.
- Per OVERVIEW `protective-ops-review.md` C5, settings.store.ts.

### AD-7: Error/Loading/Empty State Pattern

**Decision:** Use a shared `MobileStateView` component that renders skeleton, error, or empty state based on TanStack Query status.

- Accepts `query: UseQueryResult`, `skeletonComponent`, `emptyTitle`, `emptyMessage`, `retryLabel`.
- Renders skeleton shimmer during loading, error card with retry on failure, context-specific empty message when data is empty.
- Staleness detection: if any query's `dataUpdatedAt` is >3 minutes old AND `navigator.onLine === false`, show a persistent yellow banner.
- **Implementation note (PO):** Every component that consumes a TanStack Query hook must handle loading/error/empty states explicitly. Each Phase B-E workstream SOW should include acceptance criteria for all three states. `MobileStateView` should be built in Phase A or early Phase B.
- Per OVERVIEW Section 4.8.

---

## Detailed Requirements

### Detection & Routing

- `useIsMobile()` hook: `window.matchMedia('(max-width: 767px)')`. Returns `boolean | null` (null during SSR/hydration). Uses `addEventListener('change', ...)` for live updates. File: `src/hooks/use-is-mobile.ts`. Per `interface-architecture.md` Section 3.1.
- `HydrationShell`: Renders `#050911` void background during the `null` state. No content, no layout shift. File: `src/components/mobile/HydrationShell.tsx`. Per `interface-architecture.md` Section 3.2.
- Page orchestrator: `page.tsx` imports `useIsMobile()`, renders `HydrationShell` for null, `dynamic(() => import('@/views/MobileView'), { ssr: false })` for true, `dynamic(() => import('@/views/DesktopView'), { ssr: false })` for false. Per `interface-architecture.md` Section 4.1.
- Desktop extraction: All ~742 lines of current `page.tsx` logic move to `src/views/DesktopView.tsx` with ZERO modifications. Per `interface-architecture.md` Section 4.

### Mobile Layout Shell

- `MobileShell`: Flexbox column layout. Fixed header (48px), scrollable content area, fixed bottom nav (56px + `env(safe-area-inset-bottom)`). Manages tab state via `useState<'situation' | 'map' | 'intel'>`. Per `interface-architecture.md` Section 5.1.
- `MobileHeader`: 48px fixed, glass background (`rgba(5,9,17,0.85)` + `backdrop-blur(8px) saturate(120%)`). Contains: Tarva logo SVG, `MobileScanLine`, `SessionTimecode` (shared), `MobileThreatIndicator`, search button (icon), connectivity dot (8px, green/yellow/red). Per `interface-architecture.md` Section 5.2, `protective-ops-review.md` C7.
- `MobileBottomNav`: 56px + safe area inset. 3 tab buttons (Situation/shield, Map/map, Intel/radio) + hamburger/settings. Ghost tab bar aesthetic: minimal chrome, selected tab has severity-colored underline. Per `information-architecture.md` Section 5.1.
- `MobileScanLine`: 1px horizontal gradient sweep, 12s cycle, `opacity: 0.03`. CSS-only `@keyframes`. Per `every-time-synthesis.md` Section 2 Conflict 4.

### Situation Tab

- `MobileThreatBanner`: 56px. Shows posture level badge (color-coded), active alert count, P1/P2 counts, trend indicator. Tap P1/P2 count -> switch to Intel tab. Data: `useThreatPicture()`. Per `information-architecture.md` Section 8.1.
- P1 Banner: 64px, conditional (P1 > 0 only). Shows most recent P1 alert headline with category + severity + time. **Persists until tapped/acknowledged or superseded. No auto-dismiss.** Tap -> alert detail bottom sheet. Data: `usePriorityFeed().mostRecentP1`. Per `protective-ops-review.md` C2.
- `MobilePriorityStrip`: 44px sticky, horizontal scroll with `scroll-snap-type: x mandatory`. Shows P1/P2 alert pills. Per `interface-architecture.md` Section 5.4.
- `MobileCategoryGrid`: 2-column CSS Grid, `gap: 8px`, `padding: 12px`. Renders all 15 KNOWN_CATEGORIES via `buildAllGridItems()`. Sorted by `alertCount` descending with KNOWN_CATEGORIES order for tie-breaking. **Sort dampening: only re-sort when `delta >= 2`** to prevent visual jitter. Per `information-architecture.md` Section 12.3, client Q6.
- `MobileCategoryCard`: ~165x80px. Shows category icon, short code, alert count, source count, trend, severity breakdown mini-bar. **Tap** -> `startMorph(categoryId, { fast: true })` -> category detail bottom sheet. **Long-press (500ms)** -> toggle map filter for that category (haptic feedback). **Press state:** `scale(0.97)` for 100ms. Per `interface-architecture.md` Section 5.6, `ui-design-system.md` Section 12.
- `ThreatPulseBackground`: CSS radial gradient keyed to posture level. 4s cycle (ELEVATED), 6s (HIGH), off (LOW/UNKNOWN). Respects `effectsEnabled` from `settings.store`. Per `ux-strategy.md` Section 2.2.
- Data staleness indicator: If any query's `dataUpdatedAt` > 3 minutes stale OR `navigator.onLine === false`, show persistent banner below header: "DATA STALE" or "OFFLINE" in `rgba(234,179,8,0.15)`. Per `protective-ops-review.md` C1.

### Map Tab

- `MobileMapView`: Full-bleed `CoverageMap` wrapper. Height = `calc(100vh - header - filter_chips - controls - tab_bar - safe_area)`. Lazy-loaded via `next/dynamic`. Per `interface-architecture.md` Section 5.10.
- `MobileFilterChips`: 40px horizontal scroll bar above map. Category filter pills (40px height, multi-select). `[All]` chip to clear filters. Synced with `coverage.store.selectedCategories`. Per `information-architecture.md` Section 10.2.
- Floating controls: `ViewModeToggle` (glass background, 48px touch targets) and `TimeRangeSelector` at bottom of map. Per `ui-design-system.md` Section 8.
- Marker tap -> alert detail bottom sheet at half-height (map visible behind). Per `information-architecture.md` Section 8.2.
- GPS "center on me": MapLibre `GeolocateControl` with Oblivion-styled CSS override, lower-right floating position. Per `protective-ops-review.md` C4.

### Bottom Sheet

- `MobileBottomSheet`: 4 states: COLLAPSED (closed), HALF (context-dependent snap), FULL (90% viewport), FULLSCREEN (100% viewport).
- Spring config: `{ stiffness: 400, damping: 35, mass: 0.8 }`. Per `ui-design-system.md` Section 11.
- Per-context snap points: Alert detail 70%/100%, Category detail 35%/65%/100%, Priority feed 60%/100%, Filter/Time 40%. Per `ux-strategy.md` Section 9.
- Glass background: `rgba(5,9,17,0.92)` + `backdrop-blur(16px) saturate(130%)`. Per `ui-design-system.md` Section 11.
- Drag handle: 40px wide, 2px tall, `rgba(255,255,255,0.20)`, 8px glow. Per `ui-design-system.md` Section 11.
- Scroll conflict: `overscroll-behavior: contain` on internal scrollable areas. Disable sheet drag when internal scroll position > 0. Per `every-time-synthesis.md` Section 6.
- Expand-to-fullscreen: Button in sheet header transitions to 100% viewport with collapse button. Per client Q7.
- Landscape: Max ~60% viewport height. Per client Q2.
- `history.pushState` on open, `popstate` listener to dismiss. Per `information-architecture.md` Section 9.3.
- Focus trap: `role="dialog"` + `aria-modal="true"` + focus trap + return focus on dismiss. Per OVERVIEW Section 8.2.

### Category Detail

- `MobileCategoryDetail`: Bottom sheet content. Header with back button + category name + icon. Summary strip (alert count, source count, trend). Severity breakdown bar. List/Map toggle (segmented control). Alert list using `MobileAlertCard` components. Source health expandable accordion. Per `interface-architecture.md` Section 5.8, `information-architecture.md` Section 8.4.
- Data: `useCategoryIntel(categoryId)` for alert list (45s poll), `useCoverageMapData({ categories: [categoryId] })` for map view, `useCoverageMetrics()` for source count (cached).
- Sort/filter: Sort by severity or time. Filter by P1/P2/P3/P4 priority pills (40px touch targets).

### Alert Detail

- `MobileAlertDetail`: Bottom sheet content. Severity badge, priority badge, title, summary text, metadata rows (event type, source, confidence bar, geographic scope tags), timestamps (ingested, sent). Cross-tab actions: "View Category" -> opens category detail, "Show on Map" -> switches to Map tab and flies to marker, "Expand to Full Screen" -> fullscreen mode. Per `interface-architecture.md` Section 5.9, `information-architecture.md` Section 8.5.
- `MobileAlertCard`: 64px height. Severity dot (8px, category color), title, category tag (10px mono uppercase), timestamp, chevron. Tap -> alert detail sheet. Per `ui-design-system.md` Section 12.

### Intel Tab

- `IntelTab`: Two sections: Priority Alerts (P1/P2 `MobileAlertCard` list) and Geographic Intelligence (global + regional summary cards). Per `information-architecture.md` Section 8.3.
- Data: `usePriorityFeed()` for alerts, `useAllGeoSummaries()` for geographic summaries.
- `MobileRegionDetail`: Push navigation screen for region drill-down. AI summary, key events, recommendations, history. Per `information-architecture.md` Section 5.1.

### Search

- `MobileSearchOverlay`: Full-screen overlay. Auto-focused input with debounced search (300ms, min 3 chars). Results grouped by category. Tap result -> alert detail bottom sheet. System back or X dismisses. Per `interface-architecture.md` Section 5.11, `information-architecture.md` Section 10.1.
- Data: `useIntelSearch(query)` (existing hook).

### Settings

- Settings bottom sheet (hamburger trigger): Ambient effects toggle (`settings.store.effectsEnabled`), P1 sound toggle (`settings.store.audioNotificationsEnabled`), auto-lock timeout selector (1m/5m/15m/never), color scheme (read-only "Dark v1"), session info (`SessionTimecode`), API health status, logout button. Per `information-architecture.md` Section 5.1, `protective-ops-review.md` C5/C6.

### Protective Operations

- **C1:** Data staleness indicator -- yellow banner when data >3 min stale or offline. Per `protective-ops-review.md`.
- **C2:** P1 banner persistence -- no auto-dismiss, persists until tapped or superseded. Per `protective-ops-review.md`.
- **C3:** "Show on Map" from all alert contexts (P1 banner, category detail, Intel tab). Per `protective-ops-review.md`.
- **C4:** GPS center-on-me button on map. Per `protective-ops-review.md`.
- **C5:** Session auto-lock after idle timeout (default 5 min). Per `protective-ops-review.md`.
- **C6:** P1 audio notification via Web Audio API. Per `protective-ops-review.md`.
- **C7:** Connectivity indicator dot in header. Per `protective-ops-review.md`.

---

## Phase Decomposition

### Phase A: Foundation

**Objective:** Establish the mobile/desktop detection, code splitting boundary, mobile layout shell, and design tokens. Desktop must remain completely unchanged.

**Unblocks:** All subsequent phases depend on the shell, header, bottom nav, and detection hook.

**Estimated Complexity:** Medium (13 tasks, mostly scaffolding)

Work Areas:
1. **WS-A.1: Detection + Code Splitting** -- Frontend -- S -- Create `useIsMobile()`, extract `DesktopView.tsx`, create `MobileView.tsx` stub, update `page.tsx` orchestrator, create `HydrationShell`. Files: `src/hooks/use-is-mobile.ts`, `src/views/DesktopView.tsx`, `src/views/MobileView.tsx`, `src/components/mobile/HydrationShell.tsx`, `src/app/(launch)/page.tsx`.
2. **WS-A.2: Mobile Layout Shell** -- Frontend -- M -- Create `MobileShell` (flexbox layout, tab state, safe areas), `MobileHeader` (48px glass, logo, search button, connectivity dot), `MobileBottomNav` (3 tabs + hamburger). Files: `src/components/mobile/MobileShell.tsx`, `MobileHeader.tsx`, `MobileBottomNav.tsx`.
3. **WS-A.3: Design Tokens + Ambient** -- Design/Frontend -- M -- Create `src/styles/mobile-tokens.css` with all spacing, blur, animation, typography, contrast, and corner bracket tokens. Create `MobileScanLine` (12s CSS sweep). Verify desktop unchanged (`pnpm build` + visual comparison).
4. **WS-A.4: Viewport Meta + Safe Areas** -- Frontend -- S -- Add viewport meta (`viewport-fit=cover`, no `user-scalable=no`). Implement `env(safe-area-inset-*)` handling in MobileShell, MobileHeader, MobileBottomNav. *Promoted from Phase F per PO recommendation — safe areas are foundational, not polish.*

### Phase B: Situation Tab

**Objective:** Build the primary landing experience. Analysts see threat posture, P1/P2 counts, and category grid within 1 second of load.

**Unblocks:** Phase D (category detail requires category cards), Phase F (landscape requires tab content).

**Estimated Complexity:** Medium (11 tasks, all new components consuming existing hooks)

Work Areas:
1. **WS-B.1: Threat Banner + Priority** -- Frontend -- M -- Create `MobileThreatBanner` (posture + counts + trend), P1 banner (persistent, conditional), `MobileThreatIndicator` (header glow badge), `MobilePriorityStrip` (sticky horizontal scroll). Wire `useThreatPicture()` and `usePriorityFeed()`.
2. **WS-B.2: Category Grid** -- Frontend -- M -- Create `MobileCategoryGrid` (2-col CSS Grid) + `MobileCategoryCard` (tap/long-press, press feedback, severity mini-bar). Implement sort dampening (delta >= 2). Wire `useCoverageMetrics()` + `buildAllGridItems()`.
3. **WS-B.3: Ambient + Protective Ops** -- Frontend -- S -- Create `ThreatPulseBackground` (CSS radial gradient keyed to posture level). Add data staleness indicator + offline warning banner. Implement connectivity indicator dot in header.

### Phase C: Map Tab + Bottom Sheet

**Objective:** Build the bottom sheet framework and map tab. This is the highest-risk phase due to bottom sheet complexity.

**Unblocks:** Phases D and E (both use bottom sheet for drill-down).

**Estimated Complexity:** Large (bottom sheet is the most complex single component)

Work Areas:
1. **WS-C.1: Bottom Sheet Core** -- Frontend -- L -- Create `MobileBottomSheet`: spring drag physics, per-context snap points, glass background, drag handle. Scroll-vs-drag conflict resolution.
2. **WS-C.2: Bottom Sheet Advanced** -- Frontend -- M -- Expand-to-fullscreen button + collapse transition. `history.pushState`/`popstate` integration. Focus trap + `aria-modal`. Landscape max height constraint.
3. **WS-C.3: Map View** -- Frontend -- M -- Create `MobileMapView` wrapper (full-bleed, lazy-loaded). `MobileFilterChips` (horizontal category pills, multi-select). Floating `ViewModeToggle` + `TimeRangeSelector`. GPS center-on-me button.
4. **WS-C.4: Map Interactions** -- Frontend -- S -- Wire marker tap -> alert detail bottom sheet (half-height). Wire filter chip toggle -> `coverage.store.selectedCategories`.
5. **WS-C.5: Settings Sheet** -- Frontend -- S -- Create `MobileSettings` bottom sheet (hamburger trigger): ambient effects toggle, P1 sound toggle, auto-lock config, session info, API health status, logout. *Promoted from Phase F per PO recommendation — settings are needed for testing ambient/sound toggles during Phase C development.*

### Phase D: Category Detail + Alert Detail

**Objective:** Complete the drill-down flow. Category card tap opens detail, alert row tap opens alert detail. Morph state machine transitions cleanly.

**Unblocks:** Phase E (Intel tab reuses MobileAlertCard).

**Estimated Complexity:** Medium-Large (morph wiring is the complex part)

Work Areas:
1. **WS-D.1: Category Detail** -- Frontend -- L -- Create `MobileCategoryDetail` (bottom sheet content): header with back + category name, summary strip, severity breakdown, List/Map toggle (segmented control), alert list, source health accordion. Wire `useCategoryIntel()` + `useCoverageMapData()`.
2. **WS-D.2: Alert Detail + Card** -- Frontend -- M -- Create `MobileAlertCard` (64px, severity dot, title, category, timestamp, chevron). Create `MobileAlertDetail` (bottom sheet content): severity/priority badges, title, summary, metadata, timestamps, cross-tab actions ("View Category", "Show on Map", "Expand to Full Screen").
3. **WS-D.3: Morph + Navigation** -- Frontend -- M -- Wire `startMorph(id, { fast: true })` on category card tap. Wire `reverseMorph()` on sheet dismiss. Implement browser back / popstate for sheet dismissal. Implement "View Category" and "Show on Map" cross-tab navigation.

### Phase E: Intel Tab + Search

**Objective:** Complete the third tab and search overlay. Cross-tab navigation links work end-to-end.

**Unblocks:** Phase F (landscape requires all 3 tabs).

**Estimated Complexity:** Medium

Work Areas:
1. **WS-E.1: Intel Tab** -- Frontend -- M -- Create `IntelTab` with two sections: priority alerts (P1/P2 `MobileAlertCard` list using `usePriorityFeed()`) and geographic intelligence (global + regional summary cards using `useAllGeoSummaries()`).
2. **WS-E.2: Region Detail + Search** -- Frontend -- M -- Create `MobileRegionDetail` (push navigation: AI summary, key events, recommendations). Create `MobileSearchOverlay` (full-screen, auto-focus, debounced search, results grouped by category). Wire `useIntelSearch()`.
3. **WS-E.3: Cross-Tab Links** -- Frontend -- M -- Wire all cross-tab navigation: alert detail -> "View Category" -> Situation tab + category detail sheet. Alert -> "Show on Map" -> Map tab + fly-to + filter. Geo summary -> "View on Map" -> Map tab + region filter. Ensure "Show on Map" works from P1 banner, category detail, and Intel tab contexts (protective ops C3).

### Phase F: Landscape + Polish + Protective Ops

**Objective:** Add landscape layouts, accessibility, performance, and protective operations features. Ship-ready quality.

**Unblocks:** Nothing (final phase).

**Estimated Complexity:** Large (19 tasks, recommended split into 2 sub-phases)

Work Areas:
1. **WS-F.1: Landscape Layouts** -- Frontend -- M -- Implement landscape variants for all 3 tabs: Situation (side-by-side posture + 3-col grid), Map (full-bleed + rail controls), Intel (two-column priority + geo). Landscape-aware bottom sheet snap points.
2. **WS-F.2: Accessibility Audit** -- Frontend/QA -- L -- Full ARIA audit: `role="tablist"` + `aria-selected` on nav, `role="dialog" aria-modal` on sheets, `role="status" aria-live` on posture strip, focus management on tab switch + sheet open/close, `aria-label` on severity/priority badges. Touch target audit (all >= 44px). `prefers-reduced-motion` verification.
3. **WS-F.3: Performance + PWA** -- Frontend/DevOps -- M -- Performance profiling (Lighthouse >= 85, 60fps target). Bundle analysis (core <60KB, map <180KB, detail <25KB). PWA manifest + icons (no service worker per client Q1). Viewport meta (`viewport-fit=cover`, no `user-scalable=no`). Safe area inset handling.
4. **WS-F.4: Protective Ops Hooks** -- Frontend -- M -- Implement `useIdleLock` hook (auto-lock after timeout). Implement `useP1AudioAlert` hook (Web Audio API). Haptic feedback (`navigator.vibrate`) on filter toggle, sheet snap, P1 notification. *(Settings sheet moved to WS-C.5.)*
5. **WS-F.5: Pull-to-Refresh + Edge Polish** -- Frontend -- S -- Create `usePullToRefresh` hook. Create `EdgeGlowIndicators`. Spring constant tuning on all sheet contexts. Corner bracket decorations. `useScrollGatedGlass` hook.

---

## Risk Register

| # | Risk | Likelihood | Impact | Severity | Blocking? | Mitigation |
|---|------|-----------|--------|----------|-----------|------------|
| 1 | MapLibre GL JS performance on low-end mobile (180KB, GPU-intensive) | Medium | High | Critical | No | Lazy-load on Map tab only. Aggressive marker clustering. Test on Galaxy A54. Per OVERVIEW R1. |
| 2 | WCAG contrast failures from Oblivion dark aesthetic | High | High | Critical | No | Adopt contrast tiers: primary 0.70+, secondary 0.45+. Audit all text. Increase `#6b7280` to `#9ca3af`/`#60a5fa`. Per OVERVIEW R2. |
| 3 | Bottom sheet scroll-vs-drag conflict | Medium | Medium | High | No | `overscroll-behavior: contain` on sheet scroll areas. Disable sheet drag when scroll position > 0. Per OVERVIEW R3. |
| 4 | Long-press conflicts with browser context menu | Medium | Medium | High | No | `e.preventDefault()` on `contextmenu` event for category cards. Test on iOS Safari and Chrome Android. Per OVERVIEW R4. |
| 5 | Desktop experience regression from page.tsx extraction | Low | High | High | Yes | Task 1.11 explicitly verifies desktop unchanged. All desktop logic moves to `DesktopView.tsx` without modification. Per OVERVIEW R12. |
| 6 | Phase F overload (19 tasks in "polish" phase) | High | Medium | High | No | Split into 5 work areas with clear ownership. Prioritize accessibility (WS-F.2) and performance (WS-F.3) before settings/haptics. |
| 7 | Bottom sheet is under-scoped (mini-framework complexity) | Medium | High | High | No | Elevated to 2 dedicated workstreams (WS-C.1 + WS-C.2). Start in Phase C week 2 to allow iteration time. Per Gap Resolution 1. |
| 8 | Pull-to-refresh has no existing implementation pattern | Low | Low | Medium | No | Custom ~80-line hook using touch events + TanStack Query invalidation. Low risk, well-understood pattern. Per Gap Resolution 2. |
| 9 | "Show on Map" for alerts without coordinates | Medium | Low | Medium | No | Static country centroid fallback table. Disable button when no location data. Per Gap Resolution 4. |
| 10 | 15 categories may overwhelm 2-col mobile grid | Medium | Medium | Medium | No | Sort by alert count (most relevant on top). Card sort study may reveal super-categories. Dampened re-sort. Per OVERVIEW R5. |
| 11 | Real-time polling (15s) drains battery | Low | Low | Low | No | Poll only when tab active + app in foreground (`document.visibilityState`). Per OVERVIEW R8. |
| 12 | Camera store import may prevent tree-shaking | Low | Low | Low | No | Verify tree-shaking via bundle analysis in Phase F. Per OVERVIEW R9. |
| 13 | iOS Safari compatibility bugs (rubber-band scroll, 100vh, safe areas) | Medium | Medium | High | No | Test all sheet interactions on real iOS device. Use `100dvh` instead of `100vh`. Apply `-webkit-overflow-scrolling: touch`. Per Phase 7 validation. |
| 14 | Pull-to-refresh conflicts with Chrome's native page reload gesture | Medium | Medium | High | No | Use `overscroll-behavior-y: contain` on the scroll container to disable Chrome's native pull-to-refresh. Per PO consultation. |

---

## Open Questions for Stakeholder

| # | Question | Context | Needed By |
|---|----------|---------|-----------|
| 1 | Should the "Show on Map" action for alerts without coordinates be disabled entirely, or fly to country centroid? | Gap 4 resolution proposes centroid fallback, but product may prefer disabling to avoid confusion | Before Phase D |
| 2 | Is 15 categories in 2-col grid acceptable for launch, or should we implement category grouping (super-categories) now? | Risk 10. Current plan ships with 15 ungrouped categories sorted by alert count | Before Phase B |
| 3 | Should pull-to-refresh trigger a scan-line sweep animation, or is a standard spinner sufficient? | Gap 2. OVERVIEW references scan-line sweep but this adds implementation complexity | Before Phase B |
| 4 | For the Settings sheet, should "Logout" require confirmation (double-tap or confirm dialog)? | Protective ops concern -- accidental logout during field operations could be disruptive | Before Phase F |

---

## Constraints and Non-Negotiables

- **pnpm only** (never npm). Per CLAUDE.md.
- **Import `motion/react`** (never `framer-motion`). Per CLAUDE.md.
- **No `user-scalable=no`** in viewport meta. WCAG 1.4.4 compliance. Per client Q8.
- **No offline/PWA data caching.** Online-only. Manifest + icons for installability only. Per client Q1.
- **Desktop experience must be IDENTICAL** after mobile code is added. Zero visual or behavioral changes.
- **`#050911` void background** (not pure black). Prevents OLED smear. Per R12.
- **44px minimum WCAG touch targets**, 48px design target. Per R6.
- **10px minimum readable text**. Below 10px = decorative only + `aria-hidden`. Per R11.
- **`useMorphChoreography`** remains the single code path that calls `setMorphPhase()`. Per OVERVIEW Section 5.3.
- **Static export to GitHub Pages.** No SSR, no server components with data fetching. Per CLAUDE.md.
- **Node >= 22.** Per CLAUDE.md.
- **All timestamps ISO 8601 UTC.** Per CLAUDE.md.
- **Types in `src/lib/interfaces/`**, never `src/types/`. Per CLAUDE.md.

---

## Deferred Items (Out of Scope)

| # | Item | Why Deferred | Revisit Trigger |
|---|------|-------------|-----------------|
| 1 | Location-aware threat summary ("Is it safe HERE?") | UI-only but requires significant geo-distance logic | Post-launch, user feedback indicates need |
| 2 | Rally point display on map | Needs `/console/rally-points` API (doesn't exist) | TarvaRI backend adds endpoint |
| 3 | High-contrast outdoor mode | Alternate CSS token set, M effort | Field operator feedback requests it |
| 4 | P1 acknowledgment tracking | Needs server-side ack logging endpoint | Backend audit trail feature |
| 5 | Role-aware default tab | Blocked by passphrase auth (no role info available) | Auth system upgrade |
| 6 | Emergency button | Belongs in SafeTrekr App, not alert viewer | Product decision |
| 7 | Proximity filter "Near Me" | Client-side GPS filter, S effort, but not MVP | Post-launch user request |
| 8 | Saved filter profiles | localStorage persistence of filter presets, S effort | Power user feedback |
| 9 | OPSEC reduced-info mode | Conditional text rendering for public settings | Security review request |
| 10 | Glove mode (56px+ targets) | Alternate token set for field use | Field operator feedback |
| 11 | Field reporting (submit observations) | Needs new TarvaRI ingest endpoint | Backend feature |
| 12 | Team check-ins (GPS status board) | Entirely new SafeTrekr core feature | Separate project |
| 13 | Push notifications | Backend doesn't support push. Polling only. | Backend adds push infrastructure |
| 14 | Validation studies (card sort, tree test) | Pre-build UX research, separate workstream | UX research capacity |
| 15 | Automated test coverage (unit + integration + E2E) | IG-6 implicit goal; separate quality workstream | Post-launch quality sprint |
| 16 | Route overlay for active trip paths | Needs `/console/rally-points` API (N1 from OVERVIEW) | TarvaRI backend adds endpoint |
| 17 | Offline data cache with service worker | Client Q1 ruled out offline for MVP (N4 from OVERVIEW) | Product decision to add offline support |

---

## Assumptions Register

| # | Assumption | Status | Source |
|---|-----------|--------|--------|
| 1 | All TanStack Query hooks return data in the shapes documented | VALIDATED | Read all hook source files (use-threat-picture.ts, use-priority-feed.ts, use-coverage-metrics.ts, use-coverage-map-data.ts, use-category-intel.ts, use-intel-search.ts, use-geo-summaries.ts) |
| 2 | `startMorph(id, { fast: true })` exists and skips to `entering-district` phase | VALIDATED | ui.store.ts lines 111-114 |
| 3 | `settings.store.ts` has `effectsEnabled` and `audioNotificationsEnabled` toggles | VALIDATED | settings.store.ts lines 41, 56 |
| 4 | `useAllGeoSummaries()` hook exists | VALIDATED | use-geo-summaries.ts line 328 |
| 5 | No mobile-specific code exists in the codebase | VALIDATED | Zero `matchMedia('max-width')`, zero touch handlers, zero responsive breakpoints in src/ |
| 6 | MapLibre GL JS handles touch gestures natively (pan, pinch, double-tap zoom) | VALIDATED | MapLibre GL JS documentation confirms touch support |
| 7 | `next/dynamic` with `ssr: false` prevents unused code from being included in the other view's bundle | VALIDATED | Next.js code splitting behavior with dynamic imports |
| 8 | The TarvaRI backend API at `localhost:8000` is available during development | UNVALIDATED | Requires `./dev.sh start --intel` or manual backend start |
| 9 | `navigator.vibrate()` is available on target mobile browsers | UNVALIDATED | Available on Chrome Android, NOT available on iOS Safari. Haptic feedback will be Android-only. |
| 10 | Web Audio API is available for P1 audio alerts | VALIDATED | Supported on all target browsers (Chrome, Safari, Firefox mobile) |
| 11 | `env(safe-area-inset-*)` CSS values work on all target devices | VALIDATED | Supported on iOS Safari 11.2+ and Chrome Android 69+ |
| 12 | TanStack Query's `refetchOnWindowFocus` handles app foregrounding correctly on mobile | UNVALIDATED | Needs testing -- `visibilitychange` event may behave differently on mobile browsers |
| 13 | 5-week timeline is achievable with agent-assisted development | UNVALIDATED | Depends on agent execution speed and integration complexity |
