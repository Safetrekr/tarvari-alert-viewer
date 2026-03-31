# Mobile Implementation Overview -- TarvaRI Alert Viewer

> **Version:** 1.0.0 | **Date:** 2026-03-06
> **Status:** Ready for implementation (all client decisions resolved)
> **Master Reference:** This document synthesizes all specialist documents into a single actionable reference.

---

## 1. Executive Summary

### What We Are Building

A mobile view for the TarvaRI Alert Viewer -- a spatial intelligence dashboard used by security analysts at SafeTrekr to monitor global threat intelligence. The desktop application uses a Zoomable User Interface (ZUI) engine with a 20,000x20,000px pannable/zoomable canvas, hover interactions, and GPU-intensive ambient effects. This paradigm is fundamentally incompatible with mobile devices.

The mobile view provides a purpose-built, touch-native experience within the same Next.js codebase. It replaces the spatial canvas with a 3-tab vertical layout (Situation, Map, Intel) using bottom sheets for drill-down, while preserving the cinematic Oblivion dark-field aesthetic with glassmorphism, monospace typography, and severity-colored accents.

### Who It Serves

Security analysts and operations staff who need situational awareness of global threat intelligence while away from their desk. Primary workflows: check threat posture (<2 seconds), investigate P1 alerts (1-2 taps), explore categories (1-2 taps), review geographic intelligence (1-2 taps).

### Core Architectural Decision

**Separate mobile component tree, shared data layer.** The desktop and mobile views are entirely different React component trees, switched at the page level by a `useIsMobile()` hook. Both trees share 100% of the data layer:

- All TanStack Query hooks (5+ hooks, polling intervals)
- Both Zustand stores (`ui.store.ts`, `coverage.store.ts`)
- All TypeScript interfaces (`coverage.ts`, `intel-bundles.ts`, etc.)
- The TarvaRI API client (`tarvari-api.ts`)
- All utility functions (`coverage-utils.ts`, `buildAllGridItems()`, etc.)

Desktop users never download mobile components. Mobile users never download the spatial engine, camera system, ambient effects, or morph orchestrator. Code splitting via `next/dynamic` with `ssr: false` enforces this boundary.

See: `every-time-synthesis.md` Section 1 (consensus), `interface-architecture.md` Section 4.3 (code splitting).

### Timeline Overview

| Phase | Duration | Focus | Lead Specification |
|-------|----------|-------|-------------------|
| 1. Foundation | Week 1 | Detection hook, layout shell, tab navigation, design tokens | `interface-architecture.md` |
| 2. Situation Tab | Week 2 | Threat banner, category grid, priority strip | `information-architecture.md` + `ui-design-system.md` |
| 3. Map Tab + Bottom Sheet | Week 2-3 | Map integration, bottom sheet component, marker interaction | `interface-architecture.md` + `ui-design-system.md` |
| 4. Category Detail + Alert Detail | Week 3-4 | Morph fast path, category drill-down, alert detail sheets | `interface-architecture.md` + `information-architecture.md` |
| 5. Intel Tab + Search | Week 4 | Priority feed, geo summaries, search overlay | `information-architecture.md` + `ux-strategy.md` |
| 6. Landscape + Polish | Week 5 | Landscape layouts, expand-to-fullscreen, accessibility audit, PWA | `ui-design-system.md` + `interface-architecture.md` |

---

## 2. Resolved Decisions

Every canonical decision for the mobile implementation, with its source and section reference. Where documents disagreed, the resolution from `every-time-synthesis.md` is authoritative.

### 2.1 Consensus Decisions (All Documents Agree)

| # | Decision | Value | Source | Section |
|---|----------|-------|--------|---------|
| C1 | Component tree strategy | Separate mobile component tree (not responsive CSS on desktop components) | All 4 documents | `every-time-synthesis.md` Section 1 |
| C2 | Route strategy | Same codebase, same route; viewport-based detection (no `/mobile` route) | All 4 documents | `every-time-synthesis.md` Section 1 |
| C3 | Data layer sharing | All TanStack Query hooks, Zustand stores, TypeScript types, API client shared | All 4 documents | `every-time-synthesis.md` Section 1 |
| C4 | Drill-down mechanism | Bottom sheets for alert detail, category detail, and secondary panels | All 4 documents | `every-time-synthesis.md` Section 1 |
| C5 | Aesthetic | Dark Oblivion aesthetic preserved (`#050911` void background, glassmorphism, monospace, severity colors) | All 4 documents | `every-time-synthesis.md` Section 1 |
| C6 | Map library | MapLibre GL JS retained (touch-native, GPU-accelerated markers, dark CARTO tiles) | All 4 documents | `every-time-synthesis.md` Section 1 |
| C7 | Desktop ambient effects | Mostly dropped (DotGrid, SectorGrid, RangeRings, EdgeFragments, etc.) | All 4 documents | `every-time-synthesis.md` Section 1 |
| C8 | Category grid layout | 2-column grid on mobile | 3/4 majority (UI, Interface, IA) | `every-time-synthesis.md` Section 1 |
| C9 | Reduced motion | `prefers-reduced-motion` fully respected | All 4 documents | `every-time-synthesis.md` Section 1 |
| C10 | Hover states | No hover states; tap replaces hover, long-press for secondary actions | All 4 documents | `every-time-synthesis.md` Section 1 |
| C11 | CategoryCard interaction | Hover overlay removed, replaced by tap + long-press | All 4 documents | `every-time-synthesis.md` Section 1 |
| C12 | ViewModeToggle | Preserved on mobile (triaged/all-bundles/raw) | All 4 documents | `every-time-synthesis.md` Section 1 |
| C13 | Search access | Search accessible via header icon | All 4 documents | `every-time-synthesis.md` Section 1 |
| C14 | MapNavControls | D-pad removed on mobile; replaced by native MapLibre touch gestures | All 4 documents | `every-time-synthesis.md` Section 1 |

### 2.2 Conflict Resolutions

| # | Decision | Value | Source | Section |
|---|----------|-------|--------|---------|
| R1 | Navigation model | 3-tab ghost tab bar (Situation, Map, Intel) + hamburger for settings | `information-architecture.md` | Section 4.2 |
| R2 | Default tab | Situation (threat posture visible within 1 second of load) | `information-architecture.md` | Section 5.1 |
| R3 | Category card sizing | ~165x80px cards in 2-column grid | `information-architecture.md` | Section 12.3 |
| R4 | Morph transition | 3-phase fast path: `idle -> entering-district -> district` via `startMorph(id, { fast: true })` | `interface-architecture.md` | Section 6.3 |
| R5 | Bottom sheet snap points | Per-context snap points (different content types have different height needs) | `ux-strategy.md` | Section 9 |
| R6 | Touch target minimum | 44px as WCAG compliance threshold, 48px as design target | Composite | `every-time-synthesis.md` Section 2 Conflict 5 |
| R7 | Detection hook name | `useIsMobile()` returning `boolean \| null` | `interface-architecture.md` | Section 3.1 |
| R8 | Breakpoint value | `max-width: 767px` (mobile = <768px; 768px iPads get desktop ZUI) | `interface-architecture.md` | Section 3.4 |
| R9 | Ambient effects | Curated set: scan line (12s), session timecode, ThreatPulseBackground, marker animations, edge glow | Composite | `every-time-synthesis.md` Section 2 Conflict 4 |
| R10 | Glassmorphism performance | 3-tier system: always-on, scroll-rest, simplified | `ui-design-system.md` | Section 6 |
| R11 | Typography floor | 10px minimum for any readable text | `ui-design-system.md` | Section 4 |
| R12 | OLED background | Keep `#050911` (prevent OLED smear, not pure black) | `ui-design-system.md` | Section 13 |
| R13 | Contrast tiers | Primary 0.70-0.90, Secondary 0.45-0.55, Ambient 0.30-0.40 | `information-architecture.md` | Section 17.3 |
| R14 | Code splitting | Dynamic import for both `MobileView` and `DesktopView` with `ssr: false` | `interface-architecture.md` | Section 4.3 |
| R15 | Hydration | `null` initial state with `HydrationShell` placeholder | `interface-architecture.md` | Section 3.2 |
| R16 | Viewport meta | `viewport-fit=cover`, NO `user-scalable=no` | `interface-architecture.md` (modified by client Q8) | Section 10 |
| R17 | Design tokens | Mobile token layer in `src/styles/mobile-tokens.css` | `ui-design-system.md` | Section 3 |
| R18 | Category card ordering | Sorted by `alertCount` descending, KNOWN_CATEGORIES order for tie-breaking, re-sort on refresh or delta >= 2 | `information-architecture.md` + client Q6 | Section 13.3 |
| R19 | Gesture library | No external library; `motion/react` v12 drag/tap handlers are sufficient | `interface-architecture.md` | Section 8.1 |

### 2.3 Client Decisions (Resolved 2026-03-06)

| # | Question | Decision | Implementation Impact | Source |
|---|----------|----------|----------------------|--------|
| Q1 | Offline support | **No offline.** No caching, no PWA service worker for data. Online-only. | Phase 6 PWA scope reduced. Manifest + icons for installability only. No service worker. | `every-time-synthesis.md` Section 3 |
| Q2 | Landscape orientation | **Both portrait and landscape.** Landscape layout must be designed. | Each tab needs a landscape layout variant. Bottom sheets max ~60% height in landscape. Map tab straightforward (MapLibre handles resize). | `every-time-synthesis.md` Section 3 |
| Q3 | Push notifications | **Not now.** Polling only. Revisit when backend supports push. | No push infrastructure in initial build. Architecture should not preclude future addition. | `every-time-synthesis.md` Section 3 |
| Q4 | "Intel" tab label | **"Intel" is fine.** Ship as-is. | No label change needed. | `every-time-synthesis.md` Section 3 |
| Q5 | Ambient effects default | **On by default** with toggle in settings. | Edge glow and threat pulse enabled on first load. Settings toggle to disable. | `every-time-synthesis.md` Section 3 |
| Q6 | Dynamic category sort | **Yes, with dampening.** Re-sort on refresh or when delta >= 2. | Sort by alert count descending. Only re-sort when alert count difference >= 2 to prevent visual jitter. | `every-time-synthesis.md` Section 3 |
| Q7 | Alert detail presentation | **Bottom sheet that can expand to full-screen via button.** Default is bottom sheet (preserves context); user can tap expand button to go full-screen. | `MobileBottomSheet` needs a third mode: expand-to-full-screen button in sheet header that transitions to full-viewport overlay with collapse button. | `every-time-synthesis.md` Section 3 |
| Q8 | Viewport zoom | **Yes, allow.** No `user-scalable=no`. WCAG compliant. | Remove any `user-scalable=no` from viewport meta. Users can pinch-zoom the entire page. | `every-time-synthesis.md` Section 3 |

---

## 3. Component Architecture

### 3.1 Component Tree Diagram

```
src/app/(launch)/page.tsx          [MODIFIED -- thin orchestrator]
  |
  +-- useIsMobile() -> boolean | null
  |
  +-- [null]  -> HydrationShell (void background, no content)
  |
  +-- [true]  -> MobileView (dynamic import, ssr: false)
  |     |
  |     +-- MobileShell                              [NEW: src/components/mobile/MobileShell.tsx]
  |           |
  |           +-- MobileHeader                       [NEW: src/components/mobile/MobileHeader.tsx]
  |           |     +-- Tarva logo (SVG, shared asset)
  |           |     +-- MobileScanLine               [NEW: src/components/mobile/MobileScanLine.tsx]
  |           |     +-- SessionTimecode              [SHARED: src/components/ambient/session-timecode.tsx]
  |           |     +-- MobileThreatIndicator        [NEW: src/components/mobile/MobileThreatIndicator.tsx]
  |           |     +-- Search button (icon)
  |           |
  |           +-- Tab Content Area (scrollable)
  |           |     |
  |           |     +-- [Tab: Situation] (default)
  |           |     |     +-- MobileThreatBanner     [NEW: src/components/mobile/MobileThreatBanner.tsx]
  |           |     |     +-- MobilePriorityStrip    [NEW: src/components/mobile/MobilePriorityStrip.tsx]
  |           |     |     +-- MobileCategoryGrid     [NEW: src/components/mobile/MobileCategoryGrid.tsx]
  |           |     |           +-- MobileCategoryCard (x15) [NEW: src/components/mobile/MobileCategoryCard.tsx]
  |           |     |
  |           |     +-- [Tab: Map]
  |           |     |     +-- MobileFilterChips      [NEW: src/components/mobile/MobileFilterChips.tsx]
  |           |     |     +-- MobileMapView          [NEW: src/components/mobile/MobileMapView.tsx]
  |           |     |     |     +-- CoverageMap      [SHARED: src/components/coverage/CoverageMap.tsx]
  |           |     |     |     +-- MapMarkerLayer   [SHARED: src/components/coverage/MapMarkerLayer.tsx]
  |           |     |     +-- ViewModeToggle (floating) [SHARED: src/components/coverage/ViewModeToggle.tsx]
  |           |     |     +-- TimeRangeSelector      [SHARED: src/components/coverage/TimeRangeSelector.tsx]
  |           |     |
  |           |     +-- [Tab: Intel]
  |           |           +-- IntelTab               [NEW: src/components/mobile/IntelTab.tsx]
  |           |           |     +-- Priority feed section
  |           |           |     |     +-- MobileAlertCard (x N) [NEW: src/components/mobile/MobileAlertCard.tsx]
  |           |           |     +-- Geographic intelligence section
  |           |           |           +-- Region summary cards
  |           |           +-- MobileRegionDetail     [NEW: src/components/mobile/MobileRegionDetail.tsx]
  |           |
  |           +-- MobileBottomNav                    [NEW: src/components/mobile/MobileBottomNav.tsx]
  |           |     +-- Tab: Situation (shield icon)
  |           |     +-- Tab: Map (map icon)
  |           |     +-- Tab: Intel (radio icon)
  |           |     +-- Hamburger: Settings (menu icon)
  |           |
  |           +-- ThreatPulseBackground              [NEW: src/components/mobile/ThreatPulseBackground.tsx]
  |           +-- EdgeGlowIndicators                 [NEW: src/components/mobile/EdgeGlowIndicators.tsx]
  |           |
  |           +-- [Overlays -- conditional, portal-mounted]
  |                 +-- MobileBottomSheet            [NEW: src/components/mobile/MobileBottomSheet.tsx]
  |                 |     +-- MobileCategoryDetail   [NEW: src/components/mobile/MobileCategoryDetail.tsx]
  |                 |     +-- MobileAlertDetail      [NEW: src/components/mobile/MobileAlertDetail.tsx]
  |                 |     +-- (Geo summary content)
  |                 |     +-- (Triage rationale content)
  |                 |
  |                 +-- MobileSearchOverlay          [NEW: src/components/mobile/MobileSearchOverlay.tsx]
  |
  +-- [false] -> DesktopView (dynamic import, ssr: false)
        +-- (current page.tsx contents, extracted unchanged)
```

### 3.2 Component Classification

#### Shared Components (Zero Modification)

| Component | Path | Data Hook(s) | Specified In |
|-----------|------|-------------|--------------|
| All TanStack Query hooks | `src/hooks/use-coverage-*.ts`, `use-intel-*.ts`, etc. | (self) | `interface-architecture.md` Section 7.1 |
| `ui.store.ts` | `src/stores/ui.store.ts` | -- | `interface-architecture.md` Section 6.1 |
| `coverage.store.ts` | `src/stores/coverage.store.ts` | -- | `interface-architecture.md` Section 6.1 |
| `CoverageMap` | `src/components/coverage/CoverageMap.tsx` | `useCoverageMapData` | `interface-architecture.md` Section 7.1 |
| `MapMarkerLayer` | `src/components/coverage/MapMarkerLayer.tsx` | -- | `interface-architecture.md` Section 7.1 |
| `MapPopup` | `src/components/coverage/MapPopup.tsx` | -- | `ui-design-system.md` Section 10 |
| `PriorityBadge` | `src/components/coverage/PriorityBadge.tsx` | -- | `interface-architecture.md` Section 7.1 |
| `ViewModeToggle` | `src/components/coverage/ViewModeToggle.tsx` | `coverage.store` | `ui-design-system.md` Section 8 |
| `TimeRangeSelector` | `src/components/coverage/TimeRangeSelector.tsx` | `coverage.store` | `ui-design-system.md` Section 8 |
| `SessionTimecode` | `src/components/ambient/session-timecode.tsx` | -- | `interface-architecture.md` Section 7.1 |
| All type definitions | `src/lib/interfaces/*.ts` | -- | `interface-architecture.md` Section 7.1 |
| `coverage-utils.ts` | `src/lib/coverage-utils.ts` | -- | `interface-architecture.md` Section 7.1 |
| `tarvari-api.ts` | `src/lib/tarvari-api.ts` | -- | `interface-architecture.md` Section 7.1 |

#### Mobile-Only Components (New)

| Component | Path | Data Hook(s) | Desktop Equivalent | Specified In |
|-----------|------|-------------|-------------------|--------------|
| `MobileShell` | `src/components/mobile/MobileShell.tsx` | -- | `SpatialViewport` + `SpatialCanvas` | `interface-architecture.md` Section 5.1 |
| `MobileHeader` | `src/components/mobile/MobileHeader.tsx` | `useThreatPicture` | `NavigationHUD` + `TopTelemetryBar` | `interface-architecture.md` Section 5.2 |
| `MobileBottomNav` | `src/components/mobile/MobileBottomNav.tsx` | -- | None (desktop has no tab bar) | `information-architecture.md` Section 5.1 |
| `MobileThreatBanner` | `src/components/mobile/MobileThreatBanner.tsx` | `useThreatPicture` + `usePriorityFeed` | `ThreatPictureCard` + `PriorityFeedStrip` | `information-architecture.md` Section 8.1 |
| `MobileCategoryGrid` | `src/components/mobile/MobileCategoryGrid.tsx` | `useCoverageMetrics` | `MorphOrchestrator` + `CoverageGrid` | `interface-architecture.md` Section 5.5 |
| `MobileCategoryCard` | `src/components/mobile/MobileCategoryCard.tsx` | -- (props from grid) | `CategoryCard` | `interface-architecture.md` Section 5.6, `ui-design-system.md` Section 12 |
| `MobilePriorityStrip` | `src/components/mobile/MobilePriorityStrip.tsx` | `usePriorityFeed` | `PriorityFeedStrip` | `interface-architecture.md` Section 5.4 |
| `MobileMapView` | `src/components/mobile/MobileMapView.tsx` | `useCoverageMapData` | World-space `CoverageMap` div | `interface-architecture.md` Section 5.10 |
| `MobileBottomSheet` | `src/components/mobile/MobileBottomSheet.tsx` | -- | `DistrictViewOverlay` + side panels | `interface-architecture.md` Section 5.7, `ui-design-system.md` Section 11 |
| `MobileCategoryDetail` | `src/components/mobile/MobileCategoryDetail.tsx` | `useCategoryIntel` + `useCoverageMapData` | `CategoryDetailScene` + `DistrictViewDock` | `interface-architecture.md` Section 5.8 |
| `MobileAlertDetail` | `src/components/mobile/MobileAlertDetail.tsx` | `useCategoryIntel` | `AlertDetailPanel` + `AlertDetailView` | `interface-architecture.md` Section 5.9 |
| `MobileAlertCard` | `src/components/mobile/MobileAlertCard.tsx` | -- (props) | Alert list rows | `ui-design-system.md` Section 12 |
| `MobileSearchOverlay` | `src/components/mobile/MobileSearchOverlay.tsx` | `useIntelSearch` | `CommandPalette` | `interface-architecture.md` Section 5.11 |
| `MobileFilterChips` | `src/components/mobile/MobileFilterChips.tsx` | `coverage.store` | N/A (new for mobile) | `information-architecture.md` Section 10.2, `ui-design-system.md` Section 6.2 |
| `MobileRegionDetail` | `src/components/mobile/MobileRegionDetail.tsx` | `useLatestGeoSummary` | N/A (new for mobile) | `information-architecture.md` Section 5.1 |
| `IntelTab` | `src/components/mobile/IntelTab.tsx` | `usePriorityFeed` + `useAllGeoSummaries` | Intel feed panels | `information-architecture.md` Section 8.3 |
| `MobileScanLine` | `src/components/mobile/MobileScanLine.tsx` | -- | `HorizonScanLine` (simplified) | `interface-architecture.md` Section 2.2 |
| `MobileThreatIndicator` | `src/components/mobile/MobileThreatIndicator.tsx` | `useThreatPicture` | `ThreatPictureCard` (condensed) | `interface-architecture.md` Section 5.2 |
| `ThreatPulseBackground` | `src/components/mobile/ThreatPulseBackground.tsx` | `useThreatPicture` | None (new) | `ux-strategy.md` Section 2.2 |
| `EdgeGlowIndicators` | `src/components/mobile/EdgeGlowIndicators.tsx` | -- | None (new) | `ux-strategy.md` Section 3.3 |
| `HydrationShell` | `src/components/mobile/HydrationShell.tsx` | -- | None (new) | `interface-architecture.md` Section 3.2 |

#### Desktop-Only Components (Not Loaded on Mobile)

The full exclusion list is documented in `interface-architecture.md` Section 7.4. Key exclusions:

- `SpatialViewport`, `SpatialCanvas` -- ZUI engine
- `MorphOrchestrator`, `CategoryIconGrid`, `CoverageGrid` -- semantic zoom display
- `DotGrid`, `SectorGrid`, `EnrichmentLayer`, `HaloGlow`, `RangeRings` -- ambient effects
- `NavigationHUD`, `Minimap`, `ZoomIndicator`, `SpatialBreadcrumb` -- spatial navigation
- `CalibrationMarks`, `TopTelemetryBar`, `BottomStatusStrip` -- desktop chrome
- `Phase3Effects` -- narration cycle, attention choreography
- `AlertDetailPanel`, `ThreatPictureCard`, `MapLedger` -- desktop-positioned panels
- Camera store, `use-pan.ts`, `use-zoom.ts`, `use-semantic-zoom.ts` -- ZUI physics
- All morph variant hooks (`use-morph-variants.ts`, `use-district-position.ts`)

---

## 4. Screen-by-Screen Specification

### 4.1 Situation Tab (Default)

**Wireframe reference:** `information-architecture.md` Section 8.1

**Purpose:** Answer "Is anything on fire right now?" within 1 second of load. See `information-architecture.md` Section 3.1.

**Layout (portrait):**

```
+------------------------------------------+
|  TARVA logo            [search] [menu]   |  Header: 48px
|------------------------------------------|
|  THREAT POSTURE: #### ELEVATED ####      |  MobileThreatBanner: 56px
|  247 active  |  P1: 3  |  P2: 12  | +5% |  Tap P1/P2 -> Intel tab priority feed
|------------------------------------------|
|  LATEST P1: "7.2 Earthquake near..."     |  P1 Banner: 64px (conditional, P1 > 0)
|  Extreme | Seismic | 4m ago         [>]  |  Tap -> Alert Detail bottom sheet
|                                          |  **Persists until tapped/acknowledged
|                                          |  or superseded. No auto-dismiss.**
|------------------------------------------|
|  [priority strip - horizontal scroll]     |  MobilePriorityStrip: 44px (sticky)
|------------------------------------------|
|  +-------------+ +-------------+         |
|  | SEIS     P1  | | CON        |         |  MobileCategoryGrid: 2-col
|  |    47   up   | |    23   -- |         |  Cards: ~165x80px
|  | 3 src        | | 5 src      |         |  Sorted by alertCount desc
|  | ############ | | ########## |         |  (see R18 for dampening rule)
|  +-------------+ +-------------+         |
|  ... (scrollable, 15 cards total)         |
+------------------------------------------+
|  [Situation] [Map] [Intel]      [menu]   |  MobileBottomNav: 56px + safe area
+------------------------------------------+
```

**Data requirements:**
- `useThreatPicture()` -- posture level, active count, trend, top categories, top regions (120s poll)
- `usePriorityFeed()` -- P1/P2 counts, most recent P1 alert, full P1/P2 list (15s poll)
- `useCoverageMetrics()` -- category card data: alert counts, source counts per category (60s poll)
- `buildAllGridItems()` -- merge live metrics with KNOWN_CATEGORIES (utility, not a hook)

**Touch interactions:**
- Tap posture strip -> expand to threat picture detail (bottom sheet). See `information-architecture.md` Section 3.2.
- Tap P1 banner -> alert detail bottom sheet. See `ux-strategy.md` Section 4.1.
- Tap category card -> `startMorph(categoryId, { fast: true })` -> category detail bottom sheet. See `interface-architecture.md` Section 6.3.
- Long-press category card (500ms) -> toggle map filter for that category. See `interface-architecture.md` Section 5.6.
- Pull-to-refresh -> all queries refetch with scan-line sweep animation. See `ux-strategy.md` Section 4.1.

**Design tokens:**
- Background: `#050911` with `ThreatPulseBackground` ambient gradient. See `ux-strategy.md` Section 2.2.
- Card glass: `backdrop-blur(var(--blur-standard))` + `bg-white/[0.04]` + `border-white/[0.06]`. See `ui-design-system.md` Section 6.
- Card press state: `transform: scale(0.97)`, 100ms. See `ui-design-system.md` Section 12.
- Posture badge colors: severity color mapping from `SEVERITY_COLORS` in `coverage.ts`.
- Touch targets: cards ~165x80px (exceeds 44px minimum). See `information-architecture.md` Section 15.2.

**Landscape variant (Q2 decision):**

```
+-------------------------------------------------------------------------------------+
|  TARVA logo            [search] [conn] [menu]                          Header: 48px |
|-------------------------------------------------------------------------------------|
|  THREAT POSTURE: ELEVATED    |  +-------------+ +-------------+ +-------------+     |
|  247 active | P1:3 | P2:12  |  | SEIS     P1  | | CON        | | WX          |     |
|  LATEST P1: "7.2 Quake..."  |  |    47   up   | |    23   -- | |    18  down |     |
|  [priority strip h-scroll]   |  +-------------+ +-------------+ +-------------+     |
|                              |  +-------------+ +-------------+ +-------------+     |
|   (~40% width)               |  | FIR        | | DIS        | | ...         |     |
|                              |  +-------------+ +-------------+ +-------------+     |
|                              |       (~60% width, 3-column grid)                    |
|-------------------------------------------------------------------------------------|
|  [Situation] [Map] [Intel]                                              [menu]      |
+-------------------------------------------------------------------------------------+
```

Side-by-side layout: posture strip + priority strip on the left (~40% width), category grid on the right (~60% width). The category grid switches to 3-column to use the wider space. See `every-time-synthesis.md` Section 3 Q2 impact.

### 4.2 Map Tab

**Wireframe reference:** `information-architecture.md` Section 8.2

**Purpose:** Answer "Where is it happening?" with full-screen geographic awareness.

**Layout (portrait):**

```
+------------------------------------------+
|  TARVA logo            [search] [menu]   |  Header: 48px
|------------------------------------------|
|  [All] [SEIS] [CON] [WX] [FIR] [->]     |  Filter chips: 40px, h-scroll
|------------------------------------------|
|                                          |
|         Full-Bleed CoverageMap           |  Map: fills remaining space
|         (severity-colored markers)       |  (~500-640px depending on device)
|         (MapLibre GL JS, touch-native)   |
|                                          |
|                                          |
|                                          |
|------------------------------------------|
|  [Triaged|Bundles|Raw]    [Time: 24h ->] |  Controls: 40px
|------------------------------------------|
|  [Situation] [Map] [Intel]      [menu]   |  Tab bar
+------------------------------------------+
```

**Data requirements:**
- `useCoverageMapData(filters)` -- map markers with severity/category/coordinates (30s poll when tab active)
- `useIntelBundles(viewMode)` -- bundle data when in triaged/all-bundles mode (45s poll)
- `coverage.store` -- `selectedCategories`, `viewMode`, `mapTimePreset`

**Touch interactions:**
- Single-finger drag: pan map. Native MapLibre. See `ui-design-system.md` Section 10.
- Pinch: zoom map. Native MapLibre.
- Double-tap: zoom in one level.
- Tap marker -> alert detail bottom sheet (half-height, map visible behind). See `information-architecture.md` Section 8.2.
- Tap category filter chip -> toggle category in `coverage.store.selectedCategories`. See `information-architecture.md` Section 10.2.
- Tap ViewModeToggle segment -> `setViewMode()`. See `ui-design-system.md` Section 8.
- Tap TimeRangeSelector -> bottom sheet or inline selector. See `information-architecture.md` Section 10.2.

**Design tokens:**
- Map container: `100vw` width, height = `calc(100vh - header - filter_chips - controls - tab_bar - safe_area)`. See `ui-design-system.md` Section 10.
- Map tiles: CARTO dark style, same paint properties as desktop (raster-brightness-max: 0.45, raster-saturation: -0.3). See `ui-design-system.md` Section 10.
- Corner brackets: 10px, 1px thickness, `rgba(255,255,255,0.15)` on map container. See `ui-design-system.md` Section 6.
- Floating controls: glass background `rgba(5,9,17,0.85)` + `backdrop-blur(8px)`. See `ui-design-system.md` Section 6 Tier 1.

**Landscape variant:**

```
+-------------------------------------------------------------------------------------+
|  TARVA logo            [search] [conn] [menu]                          Header: 48px |
|-------------------------------------------------------------------------------------|
|  [All] [SEIS] [CON] [WX] [FIR] [->]   |                                            |
|                                         |                                            |
|   Full-Bleed CoverageMap                |   [Triaged|Bundles|Raw]                    |
|   (severity-colored markers)            |   [Time: 24h ->]                           |
|   (MapLibre GL JS, touch-native)        |   [GPS center-on-me]                       |
|                                         |                                            |
|   Filter chips left rail (~30%)         |   Controls right rail (~15%)               |
|                                         |                                            |
|-------------------------------------------------------------------------------------|
|  [Situation] [Map] [Intel]                                              [menu]      |
+-------------------------------------------------------------------------------------+
```

Full-bleed map. MapLibre handles resize automatically. Filter chips move to a left-side vertical rail. Controls move to a right-side rail. Bottom sheet max height ~60%.

### 4.3 Intel Tab

**Wireframe reference:** `information-architecture.md` Section 8.3

**Purpose:** Answer "What should I know about it?" with analytical briefing.

**Layout (portrait):**

```
+------------------------------------------+
|  TARVA logo            [search] [menu]   |  Header
|------------------------------------------|
|  PRIORITY ALERTS                         |  Section header
|  +--------------------------------------+|
|  | P1  Extreme | SEIS                   ||  Alert card (MobileAlertCard)
|  | 7.2 Earthquake off coast...          ||  Tap -> alert detail sheet
|  |                              4m ago  ||
|  +--------------------------------------+|
|  +--------------------------------------+|
|  | P2  Severe | CON                     ||  Alert card
|  | Armed clashes in northern...         ||
|  +--------------------------------------+|
|  ... more P1/P2 alerts                   |
|------------------------------------------|
|  GEOGRAPHIC INTELLIGENCE                 |  Section header
|  +--------------------------------------+|
|  | World  ELEVATED   up                 ||  Global summary card
|  | Heightened seismic activity across... ||
|  +--------------------------------------+|
|  +--------------------------------------+|
|  | Middle East  HIGH   up               ||  Regional card
|  | Escalating conflict in...            ||
|  +--------------------------------------+|
|  ... more regional summaries             |
|------------------------------------------|
|  [Situation] [Map] [Intel]      [menu]   |  Tab bar
+------------------------------------------+
```

**Data requirements:**
- `usePriorityFeed()` -- P1/P2 alert list (15s poll)
- `useAllGeoSummaries()` or `useLatestGeoSummary(level, key)` -- geographic AI summaries (120s poll when tab active)
- `useThreatPicture()` -- severity/priority/regional breakdowns for expandable detail (120s poll)

**Touch interactions:**
- Tap alert card -> alert detail bottom sheet. See `information-architecture.md` Section 9.1.
- Tap global summary card -> full summary view (push navigation or bottom sheet). See `information-architecture.md` Section 8.3.
- Tap regional card -> region detail screen (push navigation). See `information-architecture.md` Section 5.1.
- Pull-to-refresh -> refetch priority feed + geo summaries.

**Design tokens:**
- Alert card: min-height 64px (48px content + 16px vertical padding). See `ui-design-system.md` Section 12.
- Severity dot: 8px circle, category color for category tag (10px mono uppercase). See `ui-design-system.md` Section 12.
- Section headers: 11px mono, `tracking-[0.12em]`, uppercase, `rgba(255,255,255,0.45)`. See `ui-design-system.md` Section 4.

**Landscape variant:**

```
+-------------------------------------------------------------------------------------+
|  TARVA logo            [search] [conn] [menu]                          Header: 48px |
|-------------------------------------------------------------------------------------|
|  PRIORITY ALERTS               |  GEOGRAPHIC INTELLIGENCE                           |
|  +---------------------------+ |  +-----------------------------------------------+ |
|  | P1  Extreme | SEIS        | |  | World  ELEVATED   up                         | |
|  | 7.2 Earthquake off coast  | |  | Heightened seismic activity across...         | |
|  +---------------------------+ |  +-----------------------------------------------+ |
|  +---------------------------+ |  +-----------------------------------------------+ |
|  | P2  Severe | CON          | |  | Middle East  HIGH   up                       | |
|  | Armed clashes in north... | |  | Escalating conflict in...                    | |
|  +---------------------------+ |  +-----------------------------------------------+ |
|  ... (scrollable)              |  ... (scrollable independently)                    |
|-------------------------------------------------------------------------------------|
|  [Situation] [Map] [Intel]                                              [menu]      |
+-------------------------------------------------------------------------------------+
```

Two-column layout: priority alerts on the left (~45%), geographic intelligence on the right (~55%). Each column scrolls independently.

### 4.4 Category Detail (Bottom Sheet / Push Navigation)

**Wireframe reference:** `information-architecture.md` Section 8.4

**Triggered by:** Tapping a category card on Situation tab. Uses `startMorph(categoryId, { fast: true })`.

**Layout:**

```
+------------------------------------------+
|  <- Back         SEISMIC    lightning     |  Header with back nav
|------------------------------------------|
|  47 alerts  |  3 sources  |  trend up    |  Summary strip
|  ############ Severity breakdown         |  Inline severity bar
|------------------------------------------|
|  [List]  [Map]                           |  View toggle (segmented control)
|------------------------------------------|
|  Sort: [Severity] [Time]                 |  Sort + filter controls
|  Filter: [P1] [P2] [P3] [P4]            |  Priority filter pills
|------------------------------------------|
|  +--------------------------------------+|
|  | Extreme  P1                          ||  Alert row (MobileAlertCard)
|  | 7.2 Earthquake off coast...          ||  Tap -> alert detail sheet
|  |                              4m ago  ||
|  +--------------------------------------+|
|  ... scrollable alert list               |
|------------------------------------------|
|  > Source Health (3 sources)             |  Expandable accordion
+------------------------------------------+
```

**Data requirements:**
- `useCategoryIntel(categoryId)` -- alert list for this category (45s poll)
- `useCoverageMapData({ categories: [categoryId] })` -- category-filtered markers (30s poll)
- `useCoverageMetrics()` -- source count, severity breakdown (60s poll, already cached)

**Touch interactions:**
- Tap alert row -> nested alert detail (content swap within sheet, or nested sheet). See `interface-architecture.md` Section 5.8.
- Swipe down on sheet -> dismiss, call `reverseMorph()`. See `interface-architecture.md` Section 6.3.
- Back button or left-edge swipe -> return to Situation tab. See `information-architecture.md` Section 9.3.
- Toggle List/Map view -> segmented control switch. See `information-architecture.md` Section 8.4.
- Expand source health -> accordion toggle. See `information-architecture.md` Section 6.2.

### 4.5 Alert Detail (Bottom Sheet)

**Wireframe reference:** `information-architecture.md` Section 8.5

**Triggered by:** Tapping an alert row (any context), tapping a map marker, or tapping the P1 banner.

**Layout:**

```
+------------------------------------------+
|          (context visible behind)         |  Translucent backdrop
|                                          |
|--------- === drag handle === ------------|  Drag handle (glowing line)
|  EXTREME                                 |  Severity badge
|  CRITICAL (P1)                           |  Priority badge
|------------------------------------------|
|  7.2 Magnitude Earthquake Off            |  Title
|  the Coast of Papua New Guinea           |
|------------------------------------------|
|  A 7.2 magnitude earthquake struck       |  Summary text
|  45km NW of Rabaul...                    |
|------------------------------------------|
|  Event Type    earthquake                |  Metadata rows
|  Source        usgs-feed                 |
|  Confidence    ######### 82%            |  Confidence bar
|  Scope         PG, AU, SB               |  Geographic scope tags
|------------------------------------------|
|  Ingested    Mar 6, 2026 14:23           |  Timestamps
|  Sent        Mar 6, 2026 14:25           |
|------------------------------------------|
|  [View Category: Seismic    ->]          |  Cross-tab action
|  [Expand to Full Screen     ->]          |  Expand button (Q7 decision)
+------------------------------------------+
```

**Snap points (per-context, from UX Strategy):**
- Alert detail sheet: 70% (half) / 100% (full). See `ux-strategy.md` Section 9.
- Expand-to-full-screen button transitions to full-viewport overlay mode (client Q7). See `every-time-synthesis.md` Section 3.

**Design tokens:**
- Sheet background: `rgba(5, 9, 17, 0.92)` + `backdrop-blur(16px) saturate(130%)`. See `ui-design-system.md` Section 11.
- Drag handle: 40px wide, 2px tall, `rgba(255,255,255,0.20)`, 8px glow. See `ui-design-system.md` Section 11.
- Sheet border-radius: `16px 16px 0 0`. See `ui-design-system.md` Section 11.
- Sheet shadow: `0 -4px 24px rgba(0,0,0,0.4)`, `inset 0 1px 0 rgba(255,255,255,0.04)`. See `ui-design-system.md` Section 11.

### 4.6 Search Overlay

**Wireframe reference:** `information-architecture.md` Section 10.1

**Triggered by:** Tapping the search icon in the header.

**Layout:**

```
+------------------------------------------+
|  [x]  Search intel alerts...             |  Auto-focused input
|------------------------------------------|
|  SEISMIC (12 results)                    |  Category group header
|  +--------------------------------------+|
|  | Extreme  7.2 Earthquake...           ||  Result row
|  | PG, AU | 4m ago                      ||
|  +--------------------------------------+|
|  DISASTER (3 results)                    |  Next category group
|  ...                                     |
+------------------------------------------+
```

**Data requirements:**
- `useIntelSearch(query)` -- debounced search results (on-demand)

**Touch interactions:**
- Type query -> debounced search. See `information-architecture.md` Section 10.1.
- Tap result -> opens alert detail, closes overlay. On desktop, search results use `startMorph(category, { fast: true })`. On mobile, open alert detail bottom sheet directly.
- System back gesture or X button -> dismiss overlay.

### 4.7 Settings (Hamburger Menu)

**Triggered by:** Tapping the hamburger/gear icon in the bottom nav.

**Presentation:** Bottom sheet (half-height snap). See `ui-design-system.md` Section 11 for sheet styling.

**Layout:**

```
+------------------------------------------+
|          (tab content visible behind)     |  Translucent backdrop
|                                          |
|--------- === drag handle === ------------|  Drag handle
|  SETTINGS                          [x]  |  Sheet header
|------------------------------------------|
|  Ambient Effects          [ON / off]     |  Toggle (client Q5)
|  Sound Alerts (P1)        [ON / off]     |  Toggle (protective ops C6)
|  Auto-Lock Timeout        [5 min  v]     |  Selector (protective ops C5)
|------------------------------------------|
|  Color Scheme             Dark (v1)      |  Read-only in v1
|------------------------------------------|
|  SESSION                                 |  Section header
|  Analyst Session #247                    |  SessionTimecode (shared)
|  Connected 2h 14m                        |
|  API Health: OK                          |  Connectivity status
|------------------------------------------|
|  [Logout]                                |  Destructive action, bottom
+------------------------------------------+
```

**Content (from `information-architecture.md` Section 5.1):**
- Ambient effects toggle (on/off, per client Q5)
- Sound alerts toggle (P1 audible notifications, per `protective-ops-review.md` C6)
- Auto-lock timeout selector (1m / 5m / 15m / never, per `protective-ops-review.md` C5)
- Color scheme (Dark only in v1 per `ui-design-system.md` Section 13)
- Session info
- Logout

### 4.8 Error, Loading, and Empty States

All non-happy-path UI states, applied consistently across all tabs and bottom sheets.

**Loading state (skeleton shimmer):**
- Background: `rgba(255,255,255,0.03)` with `linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%)` sweeping horizontally, 1.5s infinite.
- Threat banner: single 56px skeleton block.
- Category cards: 2-column grid of `165x80px` skeleton rectangles with rounded corners.
- Alert cards: stacked 64px skeleton rows.
- Map: CARTO tiles load independently; marker layer shows a centered `Loading markers...` text at `opacity: 0.40` until data arrives.

**Error state (query failure):**
```
+------------------------------------------+
|                                          |
|           [!] CONNECTION ISSUE           |  Icon + title
|                                          |
|   Unable to reach TarvaRI API.           |  Body text, opacity: 0.55
|   Last data: 4m ago.                     |  Staleness indicator
|                                          |
|         [RETRY]        [DISMISS]         |  Action buttons
|                                          |
+------------------------------------------+
```
- Applies per-section (e.g., threat banner fails independently of category grid).
- Uses TanStack Query `isError` + `error.message`. On retry, `queryClient.invalidateQueries()`.
- Staleness banner (protective ops C1): If any query's `dataUpdatedAt` is >3 minutes stale OR `navigator.onLine === false`, show a persistent `DATA STALE` or `OFFLINE` banner below the header in `rgba(234,179,8,0.15)` (warning yellow tint).

**Empty state (no data):**
```
+------------------------------------------+
|                                          |
|              [shield icon]               |  Category icon or generic
|                                          |
|         NO ACTIVE ALERTS                 |  Title, opacity: 0.70
|                                          |
|   All clear across monitored sources.    |  Body, opacity: 0.45
|   Last checked: 2m ago.                  |
|                                          |
+------------------------------------------+
```
- Per-context empty messages:
  - Situation tab (all clear): "NO ACTIVE ALERTS -- All clear across monitored sources."
  - Category detail (no alerts in category): "NO [CATEGORY] ALERTS -- This category has no active alerts."
  - Intel tab priority feed (no P1/P2): "NO PRIORITY ALERTS -- No P1 or P2 alerts at this time."
  - Search (no results): "NO RESULTS -- Try a different search term or check your filters."
  - Map (no markers): "NO MARKERS IN VIEW -- Adjust filters or zoom out."

---

## 5. Navigation & State Flow

### 5.1 Tab Navigation Flow

```
+-------------------+     +-----------+     +-------------------+
|                   |     |           |     |                   |
|    SITUATION      |<--->|    MAP    |<--->|      INTEL        |
|    (default)      |     |           |     |                   |
|                   |     |           |     |                   |
+---------+---------+     +-----+-----+     +---------+---------+
          |                     |                     |
          v                     v                     v
  +-------+--------+    +------+------+     +--------+--------+
  | Category Detail |    | Alert Detail|     | Region Detail   |
  | (push nav)      |    | (btm sheet) |     | (push nav)      |
  +-------+--------+    +-------------+     +-----------------+
          |
          v
  +-------+--------+
  | Alert Detail   |
  | (nested sheet) |
  +----------------+

Cross-Tab Links:
  Alert Detail -> "View Category" -> Category Detail (on Situation tab)
  Alert Detail -> "Show on Map" -> Map tab filtered to marker
  Category Card -> Long-press -> Map tab filtered to category
  Geo Summary -> "View on Map" -> Map tab filtered to region
```

Tab state is managed by local `useState` in `MobileShell`, not in Zustand. Switching tabs does not clear data filters. See `interface-architecture.md` Section 6.2.

### 5.2 Bottom Sheet State Machine

The `MobileBottomSheet` component manages its own state independently of the morph state machine. It has four states per the client Q7 decision:

```
        +---> COLLAPSED (0% visible, closed)
        |         |
        |    [open trigger: tap card / tap marker / tap alert]
        |         |
        |         v
        +---- HALF (content-dependent snap point)
        |         |
        |    [drag up]          [drag down past threshold]
        |         |                       |
        |         v                       |
        +---- FULL (90% viewport)         |
        |         |                       |
        |    [tap expand button]          |
        |         |                       |
        |         v                       |
        +- FULLSCREEN (100% viewport)     |
                  |                       |
             [tap collapse button]        |
                  |                       |
                  v                       v
              FULL -----------------> COLLAPSED
```

**Per-context snap points (from `ux-strategy.md` Section 9, adopted per R5):**

| Sheet Context | Half Snap | Full Snap | Fullscreen | Source |
|--------------|-----------|-----------|------------|--------|
| Alert detail | 70% | 100% | Via expand button | `ux-strategy.md` Section 9 |
| Category detail | 35% / 65% | 100% | Via expand button | `ux-strategy.md` Section 9 |
| Priority feed | 60% | 100% | Via expand button | `ux-strategy.md` Section 9 |
| Filter / Time range | 40% | -- | -- | `ux-strategy.md` Section 9 |

**Spring configuration (from `ui-design-system.md` Section 11):**

```typescript
const SHEET_SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}
```

**Landscape constraint:** Bottom sheets max ~60% viewport height in landscape orientation. See `every-time-synthesis.md` Section 3 Q2 impact.

### 5.3 Morph Phase Mapping (Mobile 3-Phase Fast Path)

The desktop morph has 6 phases. Mobile uses only 3 via `startMorph(id, { fast: true })`, which already exists in `ui.store.ts` (line 111-114):

```
Desktop (6 phases):
  idle -> expanding (400ms) -> settled (200ms) -> entering-district (600ms) -> district
  district -> leaving-district (400ms) -> idle

Mobile (3 phases):
  idle -> entering-district (300ms) -> district
  district -> leaving-district (300ms) -> idle
```

**How it works on mobile:**
1. User taps category card -> `startMorph(categoryId, { fast: true })` sets `morph.phase = 'entering-district'`
2. `MobileShell` reads `morph.phase === 'entering-district'` and opens `MobileBottomSheet` with `MobileCategoryDetail`
3. `useMorphChoreography` advances to `morph.phase = 'district'` after 300ms
4. On dismiss: `reverseMorph()` sets `morph.phase = 'leaving-district'`
5. After 300ms, `resetMorph()` returns to `morph.phase = 'idle'`

`useMorphChoreography` remains the single code path that calls `setMorphPhase()`. This constraint is preserved on mobile. See `interface-architecture.md` Section 6.3.

### 5.4 URL Sync Strategy

All existing URL sync functions in `coverage.store.ts` work identically on mobile:

| Parameter | URL Format | Store Function | Mobile Behavior |
|-----------|-----------|----------------|-----------------|
| Category filters | `?category=seismic&category=conflict` | `syncCategoriesToUrl()` | Same as desktop |
| View mode | `?view=raw` | `syncViewModeToUrl()` | Same as desktop |
| Priority filters | `?priority=P1&priority=P2` | `syncPrioritiesToUrl()` | Same as desktop |
| District selection | `?district=seismic` | URL-based initial load | Opens category detail sheet directly |

Mobile adds one new URL parameter:

| Parameter | URL Format | Purpose |
|-----------|-----------|---------|
| Active tab | `?tab=map` or `?tab=intel` | Deep-link to specific tab (Situation is default, no param needed) |

See `interface-architecture.md` Section 6.1, `coverage.store.ts` lines 386-466.

### 5.5 Browser Back Button Behavior

| Context | Back Button Effect | Implementation |
|---------|-------------------|----------------|
| Category Detail screen | Return to Situation tab (scroll position preserved) | `window.history.pushState` on category open, `popstate` listener triggers `reverseMorph()` |
| Region Detail screen | Return to Intel tab (scroll position preserved) | Same pushState pattern |
| Alert Detail bottom sheet | Dismiss sheet | `pushState` on sheet open, `popstate` dismisses |
| Search overlay | Dismiss overlay | Same pattern |
| Tab at top level | Exit app / browser default | No custom handling |

See `information-architecture.md` Section 9.3 for back navigation table.

---

## 6. Implementation Task Breakdown

### Phase 1: Foundation (Week 1)

**Lead spec:** `interface-architecture.md`
**Gate:** Desktop renders identically. Mobile renders shell with header, empty content, bottom nav. Tab switching works. Static export builds.

| # | Task | Source | Dependencies | Size | Files |
|---|------|--------|-------------|------|-------|
| 1.1 | Create `useIsMobile()` hook with `boolean \| null` return type, `max-width: 767px` breakpoint | `interface-architecture.md` Section 3.1 | None | S | `src/hooks/use-is-mobile.ts` (new) |
| 1.2 | Extract current `page.tsx` into `DesktopView.tsx` (no modifications to logic) | `interface-architecture.md` Section 4.1 | None | M | `src/views/DesktopView.tsx` (new), `src/app/(launch)/page.tsx` (modified) |
| 1.3 | Create `MobileView.tsx` stub with dynamic import | `interface-architecture.md` Section 4.3 | 1.1, 1.2 | S | `src/views/MobileView.tsx` (new) |
| 1.4 | Update `page.tsx` as thin orchestrator: `useIsMobile` -> `HydrationShell` / `MobileView` / `DesktopView` | `interface-architecture.md` Section 4.1 | 1.1, 1.2, 1.3 | S | `src/app/(launch)/page.tsx` (modified) |
| 1.5 | Create `HydrationShell` component (void background placeholder during `null` state) | `interface-architecture.md` Section 3.2 | None | S | `src/components/mobile/HydrationShell.tsx` (new) |
| 1.6 | Create `MobileShell` layout container (fixed header + scroll area + bottom nav + safe areas) | `interface-architecture.md` Section 5.1 | 1.3 | M | `src/components/mobile/MobileShell.tsx` (new) |
| 1.7 | Create `MobileHeader` (48px, glass background, logo + search button placeholder) | `interface-architecture.md` Section 5.2, `ui-design-system.md` Section 9 | 1.6 | M | `src/components/mobile/MobileHeader.tsx` (new) |
| 1.8 | Create `MobileBottomNav` (3 tabs: Situation, Map, Intel + hamburger icon) | `information-architecture.md` Section 5.1, `ui-design-system.md` Section 9 | 1.6 | M | `src/components/mobile/MobileBottomNav.tsx` (new) |
| 1.9 | Create `src/styles/mobile-tokens.css` with all mobile design token overrides | `ui-design-system.md` Section 3 | None | M | `src/styles/mobile-tokens.css` (new) |
| 1.10 | Create `MobileScanLine` (12s CSS-only gradient sweep, 1px, `opacity: 0.03`) | `ui-design-system.md` Section 7, `every-time-synthesis.md` Section 2 Conflict 4 | 1.7 | S | `src/components/mobile/MobileScanLine.tsx` (new) |
| 1.11 | Verify desktop experience is completely unchanged (manual + `pnpm build` + visual comparison) | All documents | 1.4 | S | No files (verification task) |
| 1.12 | Add connectivity indicator dot in `MobileHeader` (8px, green/yellow/red based on `navigator.onLine` + TanStack Query health) | `protective-ops-review.md` C7 | 1.7 | S | `src/components/mobile/MobileHeader.tsx` (modified) |

### Phase 2: Situation Tab (Week 2)

**Lead spec:** `information-architecture.md` (content structure), `ui-design-system.md` (visual specs)
**Gate:** Situation tab shows threat posture, P1/P2 counts, latest P1 alert headline, and all 15 category cards.

| # | Task | Source | Dependencies | Size | Files |
|---|------|--------|-------------|------|-------|
| 2.1 | Create `MobileThreatBanner` (posture level + P1/P2 counts + trend + latest P1 headline) | `information-architecture.md` Section 8.1, `ui-design-system.md` Section 12 | Phase 1 | M | `src/components/mobile/MobileThreatBanner.tsx` (new) |
| 2.2 | Create `MobileCategoryGrid` (2-column CSS grid, `gap: 8px`, `padding: 12px`) | `interface-architecture.md` Section 5.5, `information-architecture.md` Section 12.3 | Phase 1 | S | `src/components/mobile/MobileCategoryGrid.tsx` (new) |
| 2.3 | Create `MobileCategoryCard` (~165x80px, tap=detail, long-press=filter, press scale feedback) | `interface-architecture.md` Section 5.6, `ui-design-system.md` Section 12, `information-architecture.md` Section 12.3 | 2.2 | M | `src/components/mobile/MobileCategoryCard.tsx` (new) |
| 2.4 | Wire `useCoverageMetrics()` + `useThreatPicture()` + `buildAllGridItems()` into Situation tab | `information-architecture.md` Appendix A | 2.1, 2.2, 2.3 | S | `src/views/MobileView.tsx` (modified) |
| 2.5 | Create `MobilePriorityStrip` (horizontal P1/P2 scroll, sticky, CSS scroll-snap, 44px height) | `interface-architecture.md` Section 5.4 | Phase 1 | M | `src/components/mobile/MobilePriorityStrip.tsx` (new) |
| 2.6 | Wire `usePriorityFeed()` into `MobileThreatBanner` + `MobilePriorityStrip` | `information-architecture.md` Appendix A | 2.1, 2.5 | S | Modified: `MobileThreatBanner.tsx`, `MobilePriorityStrip.tsx` |
| 2.7 | Create `ThreatPulseBackground` (CSS radial gradient keyed to posture level, 4s/6s/off cycles) | `ux-strategy.md` Section 2.2, `every-time-synthesis.md` Section 2 Conflict 4 | Phase 1 | S | `src/components/mobile/ThreatPulseBackground.tsx` (new) |
| 2.8 | Implement dynamic category sort with dampening (sort by alertCount desc, re-sort when delta >= 2) | `information-architecture.md` Section 13.3, client Q6 | 2.3 | S | `src/components/mobile/MobileCategoryGrid.tsx` (modified) |
| 2.9 | Implement `MobileThreatIndicator` in header (threat level glow badge) | `interface-architecture.md` Section 5.2 | 2.1 | S | `src/components/mobile/MobileThreatIndicator.tsx` (new) |
| 2.10 | Add data staleness indicator + offline warning banner (uses TanStack Query `dataUpdatedAt` + `navigator.onLine`) | `protective-ops-review.md` C1 | 2.1 | S | `src/components/mobile/MobileThreatBanner.tsx` (modified) |
| 2.11 | Implement P1 banner persistence until tapped/acknowledged or superseded (no auto-dismiss) | `protective-ops-review.md` C2 | 2.1 | S | `src/components/mobile/MobileThreatBanner.tsx` (modified) |

### Phase 3: Map Tab + Bottom Sheet (Week 2-3)

**Lead spec:** `interface-architecture.md` (technical), `ui-design-system.md` (visual)
**Gate:** Map renders with markers. Marker tap opens alert detail sheet. Category filter chips work. ViewModeToggle and TimeRangeSelector functional.

| # | Task | Source | Dependencies | Size | Files |
|---|------|--------|-------------|------|-------|
| 3.1 | Create `MobileMapView` wrapper (full-bleed `CoverageMap`, lazy-loaded with `next/dynamic`) | `interface-architecture.md` Section 5.10, Section 9.3 | Phase 1 | M | `src/components/mobile/MobileMapView.tsx` (new) |
| 3.2 | Wire `useCoverageMapData()` with category filters from `coverage.store` | `interface-architecture.md` Section 5.10 | 3.1 | S | `src/components/mobile/MobileMapView.tsx` (modified) |
| 3.3 | Create `MobileBottomSheet` (spring physics, per-context snap points, drag handle, glass background) | `interface-architecture.md` Section 5.7, `ui-design-system.md` Section 11 | Phase 1 | L | `src/components/mobile/MobileBottomSheet.tsx` (new) |
| 3.4 | Implement bottom sheet expand-to-fullscreen button + collapse button (client Q7) | `every-time-synthesis.md` Section 3 Q7 | 3.3 | M | `src/components/mobile/MobileBottomSheet.tsx` (modified) |
| 3.5 | Wire marker tap -> alert detail bottom sheet (via `MobileBottomSheet` + `MobileAlertDetail` stub) | `information-architecture.md` Section 8.2 | 3.1, 3.3 | M | `src/views/MobileView.tsx` (modified) |
| 3.6 | Create horizontal category filter chips at top of map (multi-select, scroll-snap) | `information-architecture.md` Section 10.2, `ui-design-system.md` Section 6.2 | 3.1 | M | `src/components/mobile/MobileFilterChips.tsx` (new) |
| 3.7 | Add floating ViewModeToggle (glass control, touch targets increased to 48px height) | `ui-design-system.md` Section 8 | 3.1 | S | `src/components/mobile/MobileMapView.tsx` (modified) |
| 3.8 | Add TimeRangeSelector as inline/bottom-sheet control | `information-architecture.md` Section 10.2 | 3.1, 3.3 | S | `src/components/mobile/MobileMapView.tsx` (modified) |
| 3.9 | Implement `EdgeGlowIndicators` as supplementary navigation cues (CSS gradient divs, pointer-events: none) | `ux-strategy.md` Section 3.3, `every-time-synthesis.md` Section 2 Conflict 4 | Phase 1 | S | `src/components/mobile/EdgeGlowIndicators.tsx` (new) |
| 3.10 | Add GPS "center on me" button using MapLibre `GeolocateControl` with Oblivion-styled CSS override, lower-right floating position | `protective-ops-review.md` C4 | 3.1 | S | `src/components/mobile/MobileMapView.tsx` (modified) |

### Phase 4: Category Detail + Alert Detail (Week 3-4)

**Lead spec:** `interface-architecture.md` (morph), `information-architecture.md` (content structure)
**Gate:** Category card tap opens detail. Alert list loads within category. Alert detail renders in sheet. Back gesture returns to Situation. Morph state machine transitions cleanly.

| # | Task | Source | Dependencies | Size | Files |
|---|------|--------|-------------|------|-------|
| 4.1 | Wire `startMorph(id, { fast: true })` on category card tap, `reverseMorph()` on sheet dismiss | `interface-architecture.md` Section 6.3 | Phase 2, 3.3 | M | `src/components/mobile/MobileCategoryCard.tsx`, `src/views/MobileView.tsx` (modified) |
| 4.2 | Create `MobileCategoryDetail` (bottom sheet content: header + severity bar + map + alert list) | `interface-architecture.md` Section 5.8, `information-architecture.md` Section 8.4 | 3.3 | L | `src/components/mobile/MobileCategoryDetail.tsx` (new) |
| 4.3 | Create `MobileAlertCard` (64px height, severity dot + title + category + timestamp + chevron) | `ui-design-system.md` Section 12 | None | M | `src/components/mobile/MobileAlertCard.tsx` (new) |
| 4.4 | Create `MobileAlertDetail` (full alert detail: severity, priority, title, summary, metadata, timestamps) | `interface-architecture.md` Section 5.9, `information-architecture.md` Section 8.5 | 3.3 | M | `src/components/mobile/MobileAlertDetail.tsx` (new) |
| 4.5 | Wire `useCategoryIntel(categoryId)` for category alert list | `information-architecture.md` Appendix A | 4.2 | S | `src/components/mobile/MobileCategoryDetail.tsx` (modified) |
| 4.6 | Implement List/Map view toggle in category detail (segmented control) | `information-architecture.md` Section 8.4 | 4.2 | S | `src/components/mobile/MobileCategoryDetail.tsx` (modified) |
| 4.7 | Implement source health expandable accordion in category detail footer | `information-architecture.md` Section 8.4, Section 6.2 | 4.2 | S | `src/components/mobile/MobileCategoryDetail.tsx` (modified) |
| 4.8 | Implement cross-tab navigation: "View Category" button in alert detail | `information-architecture.md` Section 9.2 | 4.4 | S | `src/components/mobile/MobileAlertDetail.tsx` (modified) |
| 4.9 | Wire browser back button / popstate for sheet dismissal | `information-architecture.md` Section 9.3 | 3.3, 4.1 | M | `src/components/mobile/MobileBottomSheet.tsx` (modified) |

### Phase 5: Intel Tab + Search (Week 4)

**Lead spec:** `information-architecture.md` (content structure), `ux-strategy.md` (search UX)
**Gate:** Intel tab shows priority alerts and geographic summaries. Search finds alerts across categories. Cross-tab links work.

| # | Task | Source | Dependencies | Size | Files |
|---|------|--------|-------------|------|-------|
| 5.1 | Implement Intel tab priority feed section (P1/P2 alert cards, sorted by time desc) | `information-architecture.md` Section 8.3 | Phase 4 (Task 4.3: MobileAlertCard) | M | `src/views/MobileView.tsx` or `src/components/mobile/IntelTab.tsx` (new) |
| 5.2 | Implement Intel tab geographic intelligence section (world + regional summary cards) | `information-architecture.md` Section 8.3 | Phase 1 | M | Same as 5.1 |
| 5.3 | Wire `usePriorityFeed()` for Intel tab priority section | `information-architecture.md` Appendix A | 5.1 | S | Modified: Intel tab component |
| 5.4 | Wire `useAllGeoSummaries()` + `useLatestGeoSummary(level, key)` for Intel tab geo section | `information-architecture.md` Appendix A | 5.2 | S | Modified: Intel tab component |
| 5.5 | Create Region Detail screen (push navigation: AI summary, key events, recommendations, history) | `information-architecture.md` Section 5.1 | 5.2 | M | `src/components/mobile/MobileRegionDetail.tsx` (new) |
| 5.6 | Create `MobileSearchOverlay` (full-screen, auto-focus input, results grouped by category) | `interface-architecture.md` Section 5.11, `information-architecture.md` Section 10.1 | Phase 1 | M | `src/components/mobile/MobileSearchOverlay.tsx` (new) |
| 5.7 | Wire `useIntelSearch()` into search overlay | `information-architecture.md` Appendix A | 5.6 | S | Modified: `MobileSearchOverlay.tsx` |
| 5.8 | Implement cross-tab navigation links (alert detail -> category, alert -> map, geo -> map). Ensure "Show on Map" works from all alert contexts: P1 banner sheet, category detail sheet, Intel tab alert cards (`protective-ops-review.md` C3) | `information-architecture.md` Section 9.2, `protective-ops-review.md` C3 | Phase 4 | M | Multiple mobile components (modified) |

### Phase 6: Landscape + Polish (Week 5)

**Lead spec:** `ui-design-system.md` (polish), `interface-architecture.md` (landscape)
**Gate:** Landscape renders correctly on all tabs. Bottom sheet expands to full-screen and collapses. Lighthouse >= 85. All touch targets >= 44px. 60fps on mid-range devices.

| # | Task | Source | Dependencies | Size | Files |
|---|------|--------|-------------|------|-------|
| 6.1 | Implement landscape layout for Situation tab (side-by-side posture+grid) | Client Q2 decision, `every-time-synthesis.md` Section 3 | Phase 2 | M | Modified: `MobileShell.tsx`, Situation tab components |
| 6.2 | Implement landscape layout for Map tab (full-bleed, controls repositioned) | Client Q2 decision | Phase 3 | S | Modified: `MobileMapView.tsx` |
| 6.3 | Implement landscape layout for Intel tab (two-column: alerts + geo summaries) | Client Q2 decision | Phase 5 | M | Modified: Intel tab component |
| 6.4 | Implement landscape-aware bottom sheet snap points (max ~60% height in landscape) | Client Q2 decision, `every-time-synthesis.md` Section 3 | Phase 3 | S | Modified: `MobileBottomSheet.tsx` |
| 6.5 | Implement scroll-gated glassmorphism (`useScrollGatedGlass` hook) | `ui-design-system.md` Section 6 | Phase 2 | M | `src/hooks/use-scroll-gated-glass.ts` (new), modified: card components |
| 6.6 | Add corner bracket decoration on key containers (map, bottom sheet, posture card) | `ui-design-system.md` Section 6 | Phase 2, Phase 3 | S | CSS updates in `mobile-tokens.css` or component styles |
| 6.7 | Spring constant tuning on all bottom sheet contexts | `ui-design-system.md` Section 11 | Phase 3 | S | Modified: `MobileBottomSheet.tsx` |
| 6.8 | PWA manifest + icons (no service worker per client Q1) | `interface-architecture.md` Section 10.2 | None | S | `public/manifest.json` (new), `public/android-chrome-*.png` (new), `src/app/layout.tsx` (modified) |
| 6.9 | Accessibility audit: screen reader, ARIA roles, focus management, contrast ratios | `information-architecture.md` Section 15 | All phases | L | Multiple files (modified) |
| 6.10 | Touch target audit: verify all interactive elements >= 44px | `information-architecture.md` Section 15.2, `ui-design-system.md` Section 5 | All phases | M | Multiple files (modified) |
| 6.11 | `prefers-reduced-motion` verification (all animations respect it) | `ui-design-system.md` Section 14, `information-architecture.md` Section 15.4 | All phases | M | Multiple files (verified/modified) |
| 6.12 | Performance profiling: Lighthouse >= 85 on mid-range device | `ui-design-system.md` Section 14 | All phases | M | No files (testing task) |
| 6.13 | Safe area inset handling (`env(safe-area-inset-*)` on header, bottom nav, bottom sheet) | `ui-design-system.md` Section 9, `interface-architecture.md` Section 5.3 | Phase 1 | S | Modified: `MobileShell.tsx`, `MobileBottomNav.tsx`, `MobileBottomSheet.tsx` |
| 6.14 | Haptic feedback integration (`navigator.vibrate` for filter toggle, sheet snap, P1 notification) | `interface-architecture.md` Section 8.4 | Phase 2, Phase 3 | S | Modified: `MobileCategoryCard.tsx`, `MobileBottomSheet.tsx` |
| 6.15 | Viewport meta tag update (`viewport-fit=cover`, no `user-scalable=no` per client Q8) | `interface-architecture.md` Section 10, client Q8 | None | S | `src/app/layout.tsx` (modified) |
| 6.16 | Implement session auto-lock after idle timeout (default 5 min, configurable in settings, clears session on timeout) | `protective-ops-review.md` C5 | Phase 1 | M | `src/hooks/use-idle-lock.ts` (new), `src/components/mobile/MobileShell.tsx` (modified) |
| 6.17 | Add audible P1 notification via Web Audio API when P1 count increases (respect sound toggle in settings) | `protective-ops-review.md` C6 | Phase 2 | S-M | `src/hooks/use-p1-audio-alert.ts` (new), `src/components/mobile/MobileThreatBanner.tsx` (modified) |
| 6.18 | Add `SessionTimecode` mobile positioning override (reposition from desktop fixed bottom-right to mobile header area) | `interface-architecture.md` Section 5.2 | 1.7 | S | `src/components/mobile/MobileHeader.tsx` (modified) |
| 6.19 | Create Settings bottom sheet (hamburger trigger): ambient effects toggle, session auto-lock config, sound toggle, session info, logout | `information-architecture.md` Section 5.1, `protective-ops-review.md` C5/C6 | Phase 1 | M | `src/components/mobile/MobileSettings.tsx` (new) |

---

## 7. Design Token Quick Reference

All mobile design tokens from `ui-design-system.md` Section 3, consolidated. Defined in `src/styles/mobile-tokens.css` inside `@media (max-width: 767px)`.

### Spacing

| Token | Value | Desktop Equivalent | Notes |
|-------|-------|-------------------|-------|
| `--space-card-padding` | `14px` | `20px` | Tighter for small screens |
| `--space-card-gap` | `10px` | `48px` | Tight gap for 2-column grid |
| `--space-section-gap` | `16px` | N/A | Between content sections |
| `--space-header-height` | `48px` | N/A | Fixed mobile header |
| `--space-bottom-nav-height` | `56px` | N/A | Fixed bottom nav bar |
| `--space-bottom-sheet-handle` | `24px` | N/A | Drag handle area |
| `--space-safe-area-bottom` | `env(safe-area-inset-bottom, 0px)` | N/A | iPhone home indicator |

### Blur / Glassmorphism

| Token | Value | Desktop Equivalent | Notes |
|-------|-------|-------------------|-------|
| `--blur-ambient` | `6px` | N/A | Lightest glass effect |
| `--blur-standard` | `8px` | `12px` | Default card glass |
| `--blur-active` | `12px` | N/A | Active/focused elements |
| `--blur-heavy` | `16px` | `24px` | Bottom sheet, header |

### Animation Timing

| Token | Value | Desktop Equivalent | Notes |
|-------|-------|-------------------|-------|
| `--duration-hover` | `150ms` | `150ms` | Press state feedback |
| `--duration-transition` | `250ms` | `300ms` | General transitions |
| `--duration-morph` | `400ms` | `600ms` | Morph phase duration |
| `--duration-morph-complex` | `600ms` | `900ms` | Complex morph sequences |
| `--ease-morph` | `cubic-bezier(0.22, 1, 0.36, 1)` | Same | Shared easing curve |

### Touch Targets

| Token | Value | Notes |
|-------|-------|-------|
| `--touch-target-min` | `48px` | Design target (44px WCAG minimum) |

### Corner Brackets

| Token | Value | Desktop Equivalent |
|-------|-------|-------------------|
| `--corner-bracket-size` | `10px` | `14px` |
| `--corner-bracket-offset` | `-4px` | `-6px` |
| `--corner-bracket-thickness` | `1px` | `1.5px` |

### Typography Scale

| Role | Size | Font | Weight | Tracking | Source |
|------|------|------|--------|----------|--------|
| Hero metric | 28px | Mono | 700 | -0.02em | `ui-design-system.md` Section 4 |
| Card metric | 22px | Mono | 700 | 0 | `ui-design-system.md` Section 4 |
| Section heading | 16px | Mono | 500 | 0.08em | `ui-design-system.md` Section 4 |
| Card title | 12px | Sans | 600 | 0.06em | `ui-design-system.md` Section 4 |
| Body text | 13px | Mono | 400 | 0.02em | `ui-design-system.md` Section 4 |
| Label | 11px | Mono | 500 | 0.12em | `ui-design-system.md` Section 4 |
| Caption / timestamp | 10px | Mono | 400 | 0.04em | `ui-design-system.md` Section 4 |
| Ghost text | 10px | Mono | 500 | 0.12em | `ui-design-system.md` Section 4 |
| **Minimum readable** | **10px** | Mono | -- | -- | Below this = decorative + `aria-hidden` |

### Contrast Tiers

| Tier | Desktop Alpha | Mobile Alpha | WCAG | Used For | Source |
|------|-------------|-------------|------|---------|--------|
| Primary | 0.40-0.60 | 0.70-0.90 | AA (4.5:1) | Alert titles, category names, counts | `information-architecture.md` Section 17.3 |
| Secondary | 0.20-0.30 | 0.45-0.55 | AA (4.5:1) | Timestamps, source names, metadata | `information-architecture.md` Section 17.3 |
| Ambient | 0.10-0.15 | 0.30-0.40 | Fails AA | Section labels, decorative text | `information-architecture.md` Section 17.3 |

### Colors

| Token | Value | Notes |
|-------|-------|-------|
| `--color-void` | `#050911` | Background (OLED-safe, not pure black) |
| Severity Extreme | `#ef4444` | No mobile adjustment needed |
| Severity Severe | `#f97316` | No mobile adjustment needed |
| Severity Moderate | `#eab308` | No mobile adjustment needed |
| Severity Minor | `#3b82f6` -> `#60a5fa` on mobile | Increase for 5.2:1 contrast |
| Severity Unknown | `#6b7280` -> `#9ca3af` for text | Increase for AA contrast |

See `ui-design-system.md` Section 13 for full color table.

### Glassmorphism Recipes

| Element | Background | Blur | Border | Source |
|---------|-----------|------|--------|--------|
| Header | `rgba(5, 9, 17, 0.85)` | `8px saturate(120%)` | `1px solid rgba(255,255,255,0.04)` bottom | `ui-design-system.md` Section 6 |
| Bottom Nav | `rgba(5, 9, 17, 0.90)` | `8px saturate(120%)` | `1px solid rgba(255,255,255,0.04)` top | `ui-design-system.md` Section 6 |
| Bottom Sheet | `rgba(5, 9, 17, 0.92)` | `16px saturate(130%)` | `1px solid rgba(255,255,255,0.08)` top | `ui-design-system.md` Section 11 |
| Category Card | `rgba(white, 0.04)` | `8px saturate(120%)` | `1px solid rgba(255,255,255,0.06)` | `ui-design-system.md` Section 6 |
| MapPopup (mobile) | `rgba(10, 14, 24, 0.95)` solid | None (Tier 3) | -- | `ui-design-system.md` Section 6 |

### Ambient Effects

| Effect | Specification | Default State | Source |
|--------|--------------|--------------|--------|
| Scan line | 1px, 12s translateY sweep, `opacity: 0.03` | On (client Q5) | `every-time-synthesis.md` Section 2 Conflict 4 |
| Session timecode | Reused from desktop, repositioned to header | On | `interface-architecture.md` Section 5.2 |
| ThreatPulseBackground | CSS radial gradient, 4s (ELEVATED), 6s (HIGH), off (LOW) | On (client Q5) | `ux-strategy.md` Section 2.2 |
| Edge glow indicators | 3px gradient strips on viewport edges, 2s pulse | On (client Q5) | `ux-strategy.md` Section 3.3 |
| Map marker ping/glow | Existing MapLibre paint properties (GPU-accelerated) | On | `ui-design-system.md` Section 7 |

### Animation Limits

| Category | Max Concurrent | Source |
|----------|---------------|--------|
| CSS `@keyframes` | 4 | `ui-design-system.md` Section 14 |
| `motion/react` layout animations | 2 | `ui-design-system.md` Section 14 |
| MapLibre rAF loop | 1 | `ui-design-system.md` Section 14 |
| `backdrop-filter` elements in view | 3 | `ui-design-system.md` Section 14 |
| Total animated elements | 8 | `ui-design-system.md` Section 14 |

---

## 8. Testing & Quality Gates

### 8.1 Phase Gates

| Phase | Gate Criteria | Source |
|-------|-------------|--------|
| **1. Foundation** | Desktop renders identically (visual comparison). Mobile renders shell with header, empty content, bottom nav. Tab switching works. `pnpm build` succeeds. `pnpm typecheck` passes. | `every-time-synthesis.md` Section 5, Phase 1 |
| **2. Situation Tab** | Situation tab shows: threat posture badge, P1/P2 counts, latest P1 alert headline (when P1 > 0), and all 15 category cards in 2-column grid sorted by alert count. | `every-time-synthesis.md` Section 5, Phase 2 |
| **3. Map + Sheet** | Map renders with severity-colored markers. Marker tap opens alert detail bottom sheet (half-height). Category filter chips toggle map markers. ViewModeToggle and TimeRangeSelector work. | `every-time-synthesis.md` Section 5, Phase 3 |
| **4. Category + Alert** | Category card tap opens category detail (bottom sheet). Alert list loads within category. Alert row tap shows alert detail. Back gesture returns to Situation tab. Morph state machine transitions: idle -> entering-district -> district -> leaving-district -> idle. | `every-time-synthesis.md` Section 5, Phase 4 |
| **5. Intel + Search** | Intel tab shows priority alert cards (P1/P2) and geographic summary cards. Search overlay finds alerts across categories. Cross-tab navigation links work (alert -> category, alert -> map). | `every-time-synthesis.md` Section 5, Phase 5 |
| **6. Landscape + Polish** | Landscape renders correctly on all 3 tabs. Bottom sheet expands to full-screen (Q7) and collapses back. Lighthouse Performance >= 85. All touch targets >= 44px. 60fps on Snapdragon 7xx / iPhone 12. `prefers-reduced-motion` disables all animations. | `every-time-synthesis.md` Section 5, Phase 6 |

### 8.2 Accessibility Checklist

From `information-architecture.md` Section 15.

| # | Requirement | Implementation | WCAG |
|---|-------------|---------------|------|
| A1 | Tab bar semantic markup | `<nav role="tablist">` + `<button role="tab">` + `aria-selected` + `aria-controls` | 4.1.2 |
| A2 | Tab panels | `<div role="tabpanel" aria-labelledby="{tab-id}">` | 4.1.2 |
| A3 | Category grid | `<ul role="list">` + `<li role="listitem">` | 1.3.1 |
| A4 | Alert lists | `<ul role="list">` + `role="listitem"` + `aria-current="true"` on selected | 1.3.1 |
| A5 | Bottom sheets | `<div role="dialog" aria-modal="true" aria-label="{context}">` + focus trap + return focus on dismiss | 2.4.3, 2.1.2 |
| A6 | Posture strip | `role="status"` + `aria-live="polite"` (count updates), `aria-live="assertive"` (P1 changes) | 4.1.3 |
| A7 | Search overlay | `<div role="search">` + `<input type="search" aria-label="...">` + results in `role="listbox"` | 1.3.1 |
| A8 | Severity badges | `aria-label` includes severity level text (not color-only) | 1.4.1 |
| A9 | Priority badges | `aria-label` includes "Critical," "High," etc. (shape+weight are achromatic per AD-1) | 1.4.1 |
| A10 | Focus on tab switch | Focus moves to first focusable element in new panel | 2.4.3 |
| A11 | Focus on sheet open | Focus moves to first element in sheet, trapped inside | 2.4.3, 2.1.2 |
| A12 | Focus on sheet close | Focus returns to triggering element | 2.4.3 |
| A13 | Reduced motion | All animations disabled/instant when `prefers-reduced-motion: reduce` | 2.3.3 |
| A14 | Touch targets | All interactive elements >= 44x44px | 2.5.8 |
| A15 | Viewport zoom | No `user-scalable=no` (client Q8) | 1.4.4 |
| A16 | Text contrast | Primary text: 4.5:1 minimum against `#050911` | 1.4.3 |

### 8.3 Performance Targets

| Metric | Target | Measurement | Source |
|--------|--------|-------------|--------|
| Lighthouse Performance | >= 85 | Chrome DevTools on mid-range device | `ui-design-system.md` Section 14 |
| Frame rate | 60fps (16.67ms per frame) | DevTools performance panel during interaction | `ui-design-system.md` Section 14 |
| Time to interactive | < 3 seconds on 4G | Lighthouse TTI | `interface-architecture.md` Section 9 |
| Mobile shell + core JS | < 60 KB gzipped | Build output analysis | `interface-architecture.md` Section 9.1 |
| Map chunk | < 180 KB gzipped | Build output analysis (lazy-loaded) | `interface-architecture.md` Section 9.1 |
| Bottom sheet + detail JS | < 25 KB gzipped | Build output analysis (lazy-loaded) | `interface-architecture.md` Section 9.1 |
| Total mobile JS | < 275 KB gzipped | Excluding shared framework | `interface-architecture.md` Section 9.1 |
| Concurrent CSS animations | <= 4 | Developer audit | `ui-design-system.md` Section 14 |
| Concurrent backdrop-filter elements | <= 3 | Developer audit | `ui-design-system.md` Section 14 |
| Threat posture visible | < 1 second from load | Manual measurement | `information-architecture.md` Section 1 |

### 8.4 Device Testing Matrix

| Device | OS | Viewport | Rationale |
|--------|-----|---------|-----------|
| iPhone SE (3rd gen) | iOS 17+ | 375 x 667 | Smallest supported (minimum viewport) |
| iPhone 15 | iOS 17+ | 390 x 844 | Common mid-range iPhone |
| iPhone 15 Pro Max | iOS 17+ | 430 x 932 | Largest common iPhone |
| Samsung Galaxy S24 | Android 14+ | 360 x 780 | Common Android flagship |
| Pixel 7a | Android 13+ | 412 x 915 | Mid-range Android (Snapdragon 7xx class) |
| Samsung Galaxy A54 | Android 13+ | 360 x 780 | Budget Android (performance floor) |

Each device must be tested in both portrait and landscape orientations (client Q2).

### 8.5 Validation Studies (Pre-Build)

From `information-architecture.md` Section 14 and 16.

| Study | Method | Participants | When | Success Metric |
|-------|--------|-------------|------|----------------|
| Mobile content organization | Open card sort | 15-20 analysts | Before implementation | Dendrogram validates 3-tab grouping |
| Category grouping | Closed card sort | 12-15 analysts | Before implementation | >80% agreement on super-categories |
| Navigation structure | Tree test (Treejack) | 20-25 analysts | Before implementation | >70% correct path on all tasks, >80% on P0 tasks |
| Wireframe validation | First-click test | 10-15 analysts | After wireframes | Correct first click on 4 core tasks |
| Prototype usability | Usability test | 8-10 analysts | After initial build | Task completion, satisfaction |
| Live analytics | Navigation analytics + search logs | All users (quantitative) | 2 weeks after deploy | Monitor search-to-nav ratio, zero results rate |

---

## 9. Risk Register

Risks from all documents, deduplicated and consolidated.

| # | Risk | Severity | Likelihood | Mitigation | Owner | Source |
|---|------|----------|-----------|------------|-------|--------|
| R1 | MapLibre GL JS performance on low-end mobile (180KB, GPU-intensive) | High | Medium | Lazy-load on Map tab (not initial bundle). Aggressive marker clustering. Test on Galaxy A54. | Engineering | `information-architecture.md` Section 17.1, `every-time-synthesis.md` Section 6 |
| R2 | WCAG contrast failures from Oblivion aesthetic (dark + low-alpha text) | High | High | Adopt IA contrast tiers: primary 0.70+, secondary 0.45+. Audit all text against AA 4.5:1 ratio. `#6b7280` severity colors increased to `#9ca3af`/`#60a5fa`. | UX + Engineering | `information-architecture.md` Section 17.3, `ui-design-system.md` Section 13 |
| R3 | Bottom sheet vs internal scroll conflicts (scroll within a draggable sheet) | Medium | Medium | `overscroll-behavior: contain` on sheet scroll areas. Disable sheet drag when scroll position > 0. | Engineering | `every-time-synthesis.md` Section 6 |
| R4 | Long-press conflicts with browser context menu | Medium | Medium | `e.preventDefault()` on `contextmenu` event for category cards. | Engineering | `every-time-synthesis.md` Section 6 |
| R5 | 15 categories too many for 2-column mobile grid (visual overwhelm) | Medium | Medium | Sort by alert count (most relevant on top). Card sort study may reveal super-category grouping. Dampened re-sort (delta >= 2). | IA + Product | `information-architecture.md` Section 17.1 R2 |
| R6 | P1 banner consumes 64px of scarce vertical space | Low | Low | Banner is conditional (only when P1 > 0). Space reclaimed when all clear. | Engineering | `information-architecture.md` Section 17.1 R3 |
| R7 | Bottom sheet obscures map markers user wants to cross-reference | Medium | Medium | Half-sheet default (map visible above). Full-sheet only on explicit drag-up. | UX | `information-architecture.md` Section 17.1 R4 |
| R8 | Real-time polling (15s for priority feed) drains battery | Low | Low | Poll only when tab is active and app is in foreground (`document.visibilityState`). Consider mobile-specific intervals per `interface-architecture.md` Section 6.5. | Engineering | `information-architecture.md` Section 17.1 R5 |
| R9 | Camera store import in `coverage.store.ts` may prevent tree-shaking on mobile | Low | Low | Verify tree-shaking. On mobile, `selectMapAlert` is not called (bottom sheet opens directly). If needed, extract camera reference conditionally. | Engineering | `every-time-synthesis.md` Section 6 |
| R10 | Category card position jitter from dynamic sort on every poll | Low | Medium | Dampened re-sort: only on refresh or when alert count delta >= 2 (client Q6 resolved). | Engineering | `every-time-synthesis.md` Section 6 |
| R11 | Long-press for map filter shortcut is undiscoverable | Medium | Medium | Not critical path. Category filter chips on Map tab are the primary mechanism. Long-press is a power-user accelerator. No remediation needed. | UX | `information-architecture.md` Section 17.1 R8 |
| R12 | Desktop experience regression from `page.tsx` refactor | High | Low | Task 1.11 explicitly verifies desktop is unchanged. All desktop logic moves to `DesktopView.tsx` without modification. | Engineering | `interface-architecture.md` Section 4 |
| R13 | Landscape layout implementation complexity (client Q2) | Medium | Medium | Landscape is Phase 6. Map tab is trivial (MapLibre resizes). Situation and Intel tabs need CSS grid layout variants. Bottom sheets need landscape-aware snap points. | Engineering | `every-time-synthesis.md` Section 3 Q2 |

---

## 10. Future Scope (Post-Launch)

Items from the protective operations review (`protective-ops-review.md`) that are deferred beyond the initial 5-week build. These are tracked here so they are not lost.

### UI-Only Enhancements (Phase 7+, no backend changes)

| # | Item | Description | Effort | Source |
|---|------|-------------|--------|--------|
| I1 | Location-aware threat summary | "Is it safe HERE?" using client-side distance calc from `MapMarker[]` + Geolocation API | M | `protective-ops-review.md` I1 |
| I3 | High-contrast outdoor mode | Alternate CSS token set with boosted contrast + settings toggle | M | `protective-ops-review.md` I3 |
| I6 | Proximity filter "Near Me" | Client-side GPS filter on all views to show only nearby alerts | S | `protective-ops-review.md` I6 |
| I9 | Saved filter profiles | Persist category/priority/region filter presets to `localStorage` | S | `protective-ops-review.md` I9 |
| N5 | OPSEC reduced-info mode | Conditional text rendering to hide sensitive details in public settings | M | `protective-ops-review.md` N5 |
| N6 | Glove mode | Alternate token set with 56px+ touch targets for field use with gloves | S | `protective-ops-review.md` N6 |

### Backend-Dependent Enhancements (Requires API changes)

| # | Item | Description | Blocked By | Source |
|---|------|-------------|-----------|--------|
| I2 | Rally point display | Show safe rally points on map | Needs `/console/rally-points` API | `protective-ops-review.md` I2 |
| I4 | P1 acknowledgment tracking | Log acknowledgments server-side for audit trail | Needs ack logging endpoint | `protective-ops-review.md` I4 |
| I5 | Role-aware default tab | Different default tab per user role | Blocked by passphrase auth (no role info) | `protective-ops-review.md` I5 |
| I7 | Emergency button | One-tap emergency alert to HQ | Belongs in SafeTrekr App, not alert viewer | `protective-ops-review.md` I7 |
| N2 | Field reporting | Submit field observations to TarvaRI | Needs new TarvaRI ingest endpoint | `protective-ops-review.md` N2 |
| N3 | Team check-ins | GPS-based team status board | Entirely new SafeTrekr core feature | `protective-ops-review.md` N3 |

---

## 11. Document Index

| Document | File Path | Author Perspective | Rating | Authoritative For |
|----------|-----------|-------------------|--------|-------------------|
| **UX Strategy** | `docs/plans/mobile-view/ux-strategy.md` | UX/Interaction Design | B+ | Gesture vocabulary, unconventional effects (edge glow, threat pulse), user flows, haptic feedback, per-context bottom sheet snap points |
| **UI Design System** | `docs/plans/mobile-view/ui-design-system.md` | Visual Design / Design Systems | A- | Design tokens, typography scale, glassmorphism performance tiers, OLED considerations, animation budgets, CSS/Tailwind patterns, corner brackets |
| **Interface Architecture** | `docs/plans/mobile-view/interface-architecture.md` | Software Architecture | B+ | Code architecture, file structure, state management, code splitting, PWA readiness, `useIsMobile` hook, morph simplification (3-phase), component reuse matrix, bundle budgets |
| **Information Architecture** | `docs/plans/mobile-view/information-architecture.md` | Information Architecture | A | Navigation model (3-tab ghost bar), content inventory and prioritization, progressive disclosure, screen-level content mapping, contextual navigation flows, search/filter IA, validation plan, accessibility specification, contrast tiers |
| **Cross-Document Synthesis** | `docs/plans/mobile-view/every-time-synthesis.md` | Review Protocol | -- | Conflict resolution, canonical decisions, client decision integration, implementation phasing, risk summary |
| **Protective Ops Review** | `docs/plans/mobile-view/protective-ops-review.md` | Secret Service Protective Operations | C+ | Field operator usability assessment, 7 critical items (C1-C7), communication/escalation gap analysis, IMPORTANT/NICE-TO-HAVE prioritization |
| **CLAUDE.md (Project)** | `CLAUDE.md` | Project Documentation | -- | Stack, commands, conventions, architecture, data flow, store descriptions, morph state machine |

### Codebase Files Referenced

| File | Path | Relevance |
|------|------|-----------|
| Main page | `src/app/(launch)/page.tsx` | Current 742-line desktop page to be extracted into `DesktopView.tsx` |
| UI store | `src/stores/ui.store.ts` | Morph state machine (shared). Contains `startMorph(id, { fast: true })` on line 111. |
| Coverage store | `src/stores/coverage.store.ts` | Data filtering (shared). URL sync functions. Camera store reference (R9 risk). |
| Coverage types | `src/lib/interfaces/coverage.ts` | `KNOWN_CATEGORIES` (15 items), `CategoryMeta`, `SEVERITY_COLORS`, `PRIORITY_META`, `buildAllGridItems()` |
| Coverage metrics hook | `src/hooks/use-coverage-metrics.ts` | Pattern for all TanStack Query hooks. `staleTime: 45s`, `refetchInterval: 60s`. |

---

## Appendix A: Z-Index Stacking Order (Mobile)

From `ui-design-system.md` Section 9.

| Z-Index | Element | Notes |
|---------|---------|-------|
| z-60 | `MobileSearchOverlay` | Full-screen, above everything |
| z-50 | `MobileBottomSheet` (when open) | Above all content |
| z-45 | Triage rationale sheet (nested) | Above alert detail sheet |
| z-40 | `MobileHeader` + `MobileBottomNav` | Persistent chrome |
| z-30 | Category detail full-screen mode | Full-screen overlay |
| z-20 | Floating map controls (ViewModeToggle, filter chips) | Above map |
| z-10 | Map loading/empty overlay | Above map tiles |
| z-0 | Content area | Base layer |

## Appendix B: Data Hook Polling Summary

| Hook | Desktop Poll | Mobile Poll (Recommended) | Notes | Source |
|------|-------------|--------------------------|-------|--------|
| `usePriorityFeed` | 15s | 15s | Same. P1 latency must match. | `information-architecture.md` Section 11.2 |
| `useCoverageMetrics` | 60s | 60-90s | Overview stats, not latency-sensitive. | `interface-architecture.md` Section 6.5 |
| `useCoverageMapData` | 30s | 30s when Map tab active, paused otherwise | Save bandwidth when not visible. | `information-architecture.md` Section 11.2 |
| `useThreatPicture` | 120s | 120s | Aggregated, slow-changing. | `information-architecture.md` Section 11.2 |
| `useAllGeoSummaries` | 120s | 120s when Intel tab active, paused otherwise | Save bandwidth. | `information-architecture.md` Section 11.2 |
| `useCategoryIntel` | 45s | 45s when category detail open | On-demand when drill-down is active. | `information-architecture.md` Appendix A |
| `useIntelBundles` | 45s | 45-90s | Less central on mobile. | `interface-architecture.md` Section 6.5 |
| `useIntelSearch` | on-demand | on-demand | No change. | `information-architecture.md` Appendix A |

---

*Document version: 1.0.0 | Created: 2026-03-06 | Status: Ready for implementation*
*All client decisions resolved. All cross-document conflicts resolved per every-time-synthesis.md.*


---

## #every-time Review

> **Reviewer:** every-time protocol v3.2
> **Date:** 2026-03-06
> **Documents cross-referenced:** All 6 source documents, 4 codebase files (page.tsx, ui.store.ts, coverage.store.ts, coverage.ts), protective-ops-review.md
> **Review scope:** Completeness, accuracy, internal consistency, implementability, dependency accuracy, protective ops integration

### Rating: B+ -> A+ (after revisions)

**Original assessment:** Strong synthesis document. Exceptionally thorough at 1054 lines. All source references verified accurate. The rating was held below A due to: one internal inconsistency on header height (44px vs 48px in different sections), component tree gaps (3 components created in tasks but missing from the tree), absent error/loading/empty state specifications, a dependency error in Phase 5, and no consideration of protective operations findings.

**Post-revision:** All 11 required changes have been applied. Header heights corrected. Component tree and table now include all components referenced in tasks. Error/loading/empty states fully specified (Section 4.8). Task 5.1 dependency corrected. P1 banner lifecycle documented. Settings wireframe added. Protective ops tasks (C1-C7) integrated into task breakdown. Landscape wireframes added for all 3 tabs. Future scope section captures deferred protective ops items. `protective-ops-review.md` added to document index.

### Completeness Assessment

- All 8 client decisions (Q1-Q8): **Present and accurate**
- All 14 consensus decisions: **Present as C1-C14**
- All 8 conflict resolutions: **Present and expanded to R1-R19 (good)**
- All 6 source documents referenced: **Yes, in Section 10**
- Protective ops review referenced: **No (expected -- written concurrently)**
- Error/loading/empty states: **MISSING -- no specification for any non-happy-path UI state**
- Settings menu implementation: **UNDERSPECIFIED -- 4 items listed, no wireframe, no component, no task**
- Landscape wireframes: **MISSING -- prose descriptions only ("side-by-side", "two-column")**

### Accuracy Spot-Checks

| # | Reference in OVERVIEW | Source Document Content | Verdict |
|---|---|---|---|
| 1 | R1: `information-architecture.md` Section 4.2 -- navigation model | Section 4.2 "Recommendation" recommends 3-tab ghost tab bar | **CORRECT** |
| 2 | R4: `interface-architecture.md` Section 6.3 -- morph fast path | Section 6.3 "Morph State Machine -- Mobile Path" describes 3-phase fast path | **CORRECT** |
| 3 | R13: `information-architecture.md` Section 17.3 -- contrast tiers | Section 17.3 "Aesthetic Risk" defines primary/secondary/ambient contrast table | **CORRECT** |
| 4 | R3: `information-architecture.md` Section 12.3 -- category card sizing | Section 12.3 "Category Card -- Mobile Design" specifies ~165x80px | **CORRECT** |
| 5 | Section 10: `startMorph(id, { fast: true })` on line 111 of `ui.store.ts` | Line 111 is `if (options?.fast)` -- the fast path check | **CORRECT** |
| 6 | R5: `ux-strategy.md` Section 9 -- per-context snap points | Section 9.1 "Sheet snap points" contains the snap point table | **CORRECT** |
| 7 | Task 1.7: `interface-architecture.md` Section 5.2 -- MobileHeader 48px | Section 5.2 says "48px tall" | **CORRECT** (but contradicts wireframes -- see IC-1) |

### Internal Consistency Issues

- **IC-1 (Header height):** Wireframes in Sections 4.1/4.2/4.3 say `Header: 44px`. Task 1.7, design tokens, and `interface-architecture.md` Section 5.2 all say `48px`. The 48px value is correct. Wireframes must be updated to 48px.
- **IC-2 (Component tree gaps):** `MobileRegionDetail` (Task 5.5), `MobileFilterChips` (Task 3.6), and `IntelTab` (Task 5.1) are created in tasks but absent from the component tree diagram (Section 3.1) and mobile-only component table (Section 3.2).
- **IC-3 (Task 5.1 dependency):** States dependency "Phase 2 (MobileAlertCard)" but MobileAlertCard is Task 4.3 in Phase 4. Should read "Phase 4 (Task 4.3)".
- **IC-4 (P1 banner lifecycle):** No explicit statement on whether P1 banner auto-dismisses or persists. Must state: **P1 banner persists until tapped/acknowledged or superseded. No auto-dismiss.**
- **IC-5 (SessionTimecode reuse):** Listed as "SHARED" but desktop version uses `position: fixed; bottom-right`. Needs mobile repositioning task or CSS override.

### Protective Ops Integration

#### Critical items to add to task breakdown:

| Item | Phase | Task | Effort |
|---|---|---|---|
| C1: Data staleness indicator + offline warning | Phase 2 (new task 2.10) | Add "DATA STALE" / "OFFLINE" banner using TanStack Query `dataUpdatedAt` + `navigator.onLine` | S |
| C2: P1 persistence until acknowledgment | Phase 2 (modify task 2.1) | Remove auto-dismiss, add "Acknowledge" tap target on P1 banner | S |
| C3: "Show on Map" from all alert contexts | Phase 5 (modify task 5.8) | Ensure cross-tab "Show on Map" covers P1 banner sheet, category detail sheet, Intel tab alert cards | S |
| C4: GPS "center on me" button | Phase 3 (new task 3.10) | MapLibre GeolocateControl with Oblivion-styled CSS override, lower-right floating position | S |
| C5: Session auto-lock | Phase 6 (new task 6.16) | Idle timer (default 5 min), clears session on timeout, configurable in settings | M |
| C6: Audible P1 notification | Phase 6 (extend task 6.14) | Play alert tone via Web Audio API when P1 count increases, respect sound toggle | S-M |
| C7: Connectivity indicator in header | Phase 1 (new task 1.12) | 8px status dot in MobileHeader: green/yellow/red based on query health + navigator.onLine | S |

#### New components needed:

None require top-level new components. C1 integrates into `MobileThreatBanner` or `MobileHeader`. C4 uses MapLibre's built-in `GeolocateControl`. C7 integrates into `MobileHeader`.

#### Items requiring backend changes (future scope):

- I2 (rally points): Needs `/console/rally-points` API endpoint
- I4 (P1 ack tracking): Needs server-side acknowledgment logging endpoint
- I5 (role-aware default tab): Blocked by passphrase auth (no role info)
- I7 (emergency button): Belongs in SafeTrekr App, not alert viewer
- N2 (field reporting): Requires new TarvaRI ingest endpoint
- N3 (team check-ins): Entirely new SafeTrekr core feature

#### Items achievable as future UI-only work (Phase 7+):

- I1 (location-aware threat summary): Client-side distance calc from `MapMarker[]` + Geolocation API
- I3 (high-contrast outdoor mode): Alternate CSS token set + settings toggle
- I6 (proximity filter "Near Me"): Client-side GPS filter on all views
- I9 (saved filter profiles): `localStorage` persistence
- N5 (OPSEC reduced-info mode): Conditional text rendering
- N6 (glove mode): Alternate token set with 56px+ targets

### Recommendations

1. **Resolve header to 48px.** Update wireframe annotations in Sections 4.1, 4.2, 4.3 from 44px to 48px.
2. **Add the 7 protective ops tasks** (C1-C7) to the task breakdown. Total added effort: ~4 S tasks + 2 M tasks. Fits within existing 5-week timeline.
3. **Add error/loading/empty state specs** for all 3 tabs and bottom sheet. At minimum: (a) skeleton shimmer for loading, (b) error message with retry, (c) empty state copy.
4. **Add a Settings task** to Phase 6. Define presentation (recommendation: bottom sheet from hamburger) with a wireframe.
5. **Update the component tree** to include `MobileRegionDetail`, `MobileFilterChips`, and `IntelTab`.
6. **Add landscape wireframes** for Situation, Map, and Intel tabs.
7. **Add the protective ops review** to the Document Index (Section 10).

### Required Changes

- [x] Fix wireframe header heights from 44px to 48px (Sections 4.1, 4.2, 4.3)
- [x] Fix Task 5.1 dependency from "Phase 2" to "Phase 4 (Task 4.3)"
- [x] Add P1 banner lifecycle statement: "Persists until tapped/acknowledged or superseded. No auto-dismiss."
- [x] Add MobileRegionDetail, MobileFilterChips, IntelTab to component tree (Section 3.1) and component table (Section 3.2)
- [x] Add protective ops tasks: C1 (staleness banner), C2 (P1 persistence), C3 (Show on Map contexts), C4 (GPS center), C5 (auto-lock), C6 (audible P1), C7 (connectivity dot)
- [x] Add error/loading/empty state specifications (new Section 4.8)
- [x] Add Settings menu wireframe and task to the breakdown (Section 4.7 + Task 6.19)
- [x] Add `protective-ops-review.md` to Document Index (Section 11)
- [x] Add landscape wireframes for Sections 4.1, 4.2, 4.3 landscape variants
- [x] Add SessionTimecode mobile positioning task (Task 6.18)
- [x] Add future scope section referencing protective ops I1-I9 and N1-N6 items (new Section 10)

*Review completed: 2026-03-06 | Reviewer: every-time protocol v3.2*
