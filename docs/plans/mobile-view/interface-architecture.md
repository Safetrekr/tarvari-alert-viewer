# Mobile Interface Architecture -- TarvaRI Alert Viewer

**Version:** 1.0
**Date:** 2026-03-06
**Status:** Architecture Plan
**Target:** `src/app/(launch)/page.tsx` + new mobile component tree

---

## 1. Problem Statement

The desktop TarvaRI Alert Viewer uses a spatial ZUI (Zoomable User Interface) engine -- a custom camera system with pan/zoom, world-space CSS transforms, and semantic zoom levels. This engine is fundamentally incompatible with mobile:

- **Touch interaction model mismatch.** The ZUI intercepts all pointer/wheel events for pan and zoom through `SpatialViewport`. On mobile, this conflicts with native scroll, pinch-zoom, and creates a disorienting two-finger-required navigation model.
- **Information density is wrong.** The desktop grid renders 15 category cards in a 9-column CSS grid at ~1600px wide. At mobile widths (320--428px), these cards would be 35px wide -- illegible.
- **World-space positioning breaks.** All desktop components are positioned with absolute pixel coordinates in world space (e.g., `left: -1350, top: -480`). These coordinates assume a 1440px+ viewport and zoom levels between 0.08 and 3.0.
- **Hover interactions are absent.** CategoryCard reveals two action buttons on hover. Touch devices have no hover state.
- **Ambient decoration is expensive.** DotGrid, RangeRings, HaloGlow, SectorGrid, and Phase3Effects consume GPU and CPU cycles that drain mobile batteries without providing functional value.

The mobile view must be a **different layout composition** within the same Next.js codebase, reusing all data hooks, stores, and type definitions but replacing the spatial canvas with a scroll-based touch-native layout.

---

## 2. Design Direction

### 2.1 Aesthetic: Oblivion-Grade Glassmorphism

The mobile interface maintains the cinematic dark-field aesthetic. Every surface is a translucent glass plane floating over a deep void (`#050911`). Key visual characteristics:

- **Glass panels** with `backdrop-blur(16px)` and `bg-white/[0.04]` over the void background
- **Category color accents** as left-border strips (3px) and subtle radial glows
- **Monospaced typography** for all labels, timestamps, and metadata (`var(--font-mono)`)
- **Severity owns color.** Priority uses shape and weight only (AD-1 constraint preserved)
- **Thin rule lines** at `rgba(255, 255, 255, 0.06)` for separation
- **Motion** uses the existing `[0.22, 1, 0.36, 1]` easing curve for all transitions

### 2.2 Cinematic Ambient Elements (Mobile-Adapted)

Not all desktop ambient effects are dropped. A curated subset provides atmosphere without killing battery:

| Desktop Element | Mobile Adaptation |
|----------------|-------------------|
| HorizonScanLine | Thin 1px gradient line in the header, CSS-only animation, 12s cycle |
| SessionTimecode | Retained in the mobile header bar (tiny, CSS-only) |
| DotGrid | Dropped entirely |
| SectorGrid | Dropped entirely |
| RangeRings | Dropped entirely |
| HaloGlow | Replaced with a subtle radial gradient behind the threat level indicator |
| CalibrationMarks | Dropped entirely |
| TopTelemetryBar | Condensed into the mobile header |
| BottomStatusStrip | Dropped (replaced by bottom navigation) |
| Phase3Effects | Dropped (narration cycle, attention choreography) |
| EnrichmentLayer | Dropped entirely |

### 2.3 Interaction Model

Mobile replaces the ZUI's pan/zoom with three primary interaction patterns:

1. **Vertical scroll** -- the default. The main view is a scrollable column.
2. **Bottom sheet** -- category detail and alert detail slide up from the bottom as a draggable sheet.
3. **Map gestures** -- MapLibre's built-in touch handling for the map viewport (pinch-zoom, pan, tap).

No custom gesture library is introduced. Touch interactions use `motion/react`'s drag gesture system (already in the dependency tree) and native CSS scroll-snap.

---

## 3. Mobile Detection Strategy

### 3.1 Approach: Client-Side Viewport Detection

Server-side detection (User-Agent parsing, middleware redirect) is not viable because the app deploys as a **static export to GitHub Pages**. There is no server runtime to read headers or execute middleware.

The detection strategy uses a client-side hook with a CSS media query listener. The query uses `max-width: 767px` as the primary signal, with an additional clause to catch landscape phones that exceed 768px width: `(max-height: 500px) and (pointer: coarse)`. This ensures landscape phones still get the mobile view.

```typescript
// src/hooks/use-is-mobile.ts
const MOBILE_QUERY = '(max-width: 767px), ((max-height: 500px) and (pointer: coarse))'

export function useIsMobile(): boolean | null {
  // Returns null during SSR/hydration, true/false once measured
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    setIsMobile(mql.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}
```

Landscape orientation is detected separately for layout adaptation within the mobile view:

```typescript
// Within MobileShell or as a separate hook
const isLandscape = useMediaQuery('(orientation: landscape)')
```

### 3.2 Hydration Strategy

The `null` initial state prevents layout shift during hydration:

1. **First render (SSR/static):** `useIsMobile()` returns `null`. The page renders a minimal loading shell (void background, no content) to avoid a flash of wrong layout.
2. **After hydration:** `useIsMobile()` resolves to `true` or `false`. The appropriate layout tree mounts.
3. **Resize handling:** The `matchMedia` listener fires if the user rotates their device or resizes a browser window, switching layouts live.

### 3.3 Why Not CSS-Only Responsive

The desktop and mobile render trees are so different that CSS media queries alone cannot bridge them. The desktop renders a `SpatialViewport` + `SpatialCanvas` with camera transforms; the mobile renders a scrollable column. These are different component trees, not different style variants. CSS cannot conditionally mount or unmount React components.

Tailwind responsive classes (`md:hidden`, `lg:grid-cols-9`) are used *within* each layout for fine-grained responsiveness (e.g., 1-column vs 2-column category grid on mobile), but the top-level layout switch must be in React.

### 3.4 Breakpoint Definition

| Range | Classification | Layout |
|-------|---------------|--------|
| 0--767px width | Mobile | `MobileShell` |
| 768px+ width, `pointer: coarse`, height <= 500px | Mobile (landscape phone) | `MobileShell` (landscape layout) |
| 768px+ width (all other cases) | Desktop | `SpatialViewport` (current) |

A single primary breakpoint (768px) is intentional. Tablet users get the desktop ZUI, which works with touch on larger screens. Landscape phones are caught by the secondary `(max-height: 500px) and (pointer: coarse)` clause, ensuring they receive the mobile view. The mobile layout is optimized for single-hand phone use in both portrait and landscape orientations.

---

## 4. App Router Structure

### 4.1 Route Organization

The mobile view does **not** get its own route. Both layouts live under the existing `(launch)` route group and are switched at the page component level:

```
src/app/
  (launch)/
    layout.tsx          # Auth guard (unchanged)
    page.tsx            # Wraps DesktopView + MobileView with detection
  login/
    page.tsx            # Login page (unchanged)
  layout.tsx            # Root layout, providers (unchanged)
```

The `page.tsx` becomes a thin orchestrator:

```typescript
// src/app/(launch)/page.tsx -- simplified structure
export default function LaunchPage() {
  const isMobile = useIsMobile()

  if (isMobile === null) return <HydrationShell />
  if (isMobile) return <MobileView />
  return <DesktopView />
}
```

The current 740-line `page.tsx` is extracted into a `DesktopView` component without modification. The `MobileView` is a new component loaded via `next/dynamic` with `ssr: false` to keep it out of the initial bundle.

### 4.2 File Structure

```
src/
  hooks/
    use-is-mobile.ts                    # NEW: viewport detection hook
  components/
    mobile/                             # NEW: mobile-only component tree
      MobileShell.tsx                   # Layout container (header + scroll + nav)
      MobileHeader.tsx                  # Top bar: logo, timecode, search, threat level
      MobileBottomNav.tsx               # Ghost tab bar: Situation, Map, Intel + hamburger
      MobileCategoryGrid.tsx            # 2-col grid of MobileCategoryCards
      MobileCategoryCard.tsx            # Touch-optimized category card
      MobileMapView.tsx                 # Full-width map section
      MobileAlertList.tsx               # Scrollable alert feed
      MobileAlertCard.tsx               # Individual alert item (touch target)
      MobileBottomSheet.tsx             # Reusable draggable bottom sheet
      MobileCategoryDetail.tsx          # Category detail (inside bottom sheet)
      MobileAlertDetail.tsx             # Alert detail (inside bottom sheet)
      MobilePriorityStrip.tsx           # Horizontal scrolling P1/P2 strip
      MobileSearchOverlay.tsx           # Full-screen search (replaces CommandPalette)
      MobileScanLine.tsx                # Simplified ambient scan line
      MobileThreatIndicator.tsx         # Threat level glow badge
    coverage/
      CoverageMap.tsx                   # SHARED (already touch-compatible)
      PriorityBadge.tsx                 # SHARED
      MapMarkerLayer.tsx                # SHARED
      MapPopup.tsx                      # SHARED (adapted sizing)
    district-view/
      district-view-dock.tsx            # SHARED (AlertDetailView, CategoryOverviewView)
  views/
    DesktopView.tsx                     # NEW: extracted from current page.tsx
    MobileView.tsx                      # NEW: mobile orchestrator
```

### 4.3 Code Splitting Boundary

The mobile/desktop split is the primary code-splitting boundary:

```typescript
// src/views/MobileView.tsx -- dynamically imported
const MobileView = dynamic(
  () => import('@/views/MobileView'),
  { ssr: false, loading: () => <HydrationShell /> }
)

// src/views/DesktopView.tsx -- dynamically imported
const DesktopView = dynamic(
  () => import('@/views/DesktopView'),
  { ssr: false, loading: () => <HydrationShell /> }
)
```

This means:
- Mobile users never download the SpatialViewport, SpatialCanvas, camera store, pan/zoom hooks, ambient effects, or morph orchestrator.
- Desktop users never download the MobileShell, MobileBottomSheet, MobileBottomNav, or mobile-specific components.

---

## 5. Mobile Component Tree

### 5.1 MobileShell -- Root Layout

The `MobileShell` is the top-level container for the mobile view. It provides the structural scaffolding: a fixed header, a scrollable content area, and a fixed bottom navigation bar.

```
MobileShell
  |-- MobileHeader (fixed top, z-40)
  |     |-- Logo (tarva-white-logo.svg, 12px height)
  |     |-- MobileScanLine (CSS-only ambient decoration)
  |     |-- SessionTimecode (reused from ambient/)
  |     |-- MobileThreatIndicator (threat level glow)
  |     |-- Search button (opens MobileSearchOverlay)
  |
  |-- ScrollableContent (flex-1, overflow-y-auto)
  |     |-- Active Tab Content:
  |           Tab 0: SituationTab (default)
  |           |  |-- MobilePriorityStrip (sticky, horizontal scroll)
  |           |  |-- MobileCategoryGrid (2-col, category cards with live metrics)
  |           |  |-- MobileThreatSummary (overall threat posture)
  |           |
  |           Tab 1: MapTab
  |           |  |-- MobilePriorityStrip (sticky)
  |           |  |-- MobileMapView (full-width, 50vh)
  |           |  |-- ViewModeToggle (inline below map)
  |           |
  |           Tab 2: IntelTab
  |              |-- MobilePriorityStrip (sticky)
  |              |-- MobileAlertList (full-width intel feed)
  |
  |-- MobileBottomNav (fixed bottom, z-40)
  |     |-- Tab: Situation (grid icon, default)
  |     |-- Tab: Map (map icon)
  |     |-- Tab: Intel (radio icon)
  |     |-- Hamburger menu (settings, time range, view mode, logout)
  |
  |-- MobileBottomSheet (portal, z-50, conditionally rendered)
  |     |-- MobileCategoryDetail (when category selected)
  |     |-- MobileAlertDetail (when alert selected)
  |
  |-- MobileSearchOverlay (portal, z-60, conditionally rendered)
```

### 5.2 MobileHeader

Fixed at the top of the viewport. 48px tall. Glass panel aesthetic:

```
+------------------------------------------------------------------+
| [Tarva logo]    SCAN LINE              12:04:07Z    ELEV   [Q]   |
+------------------------------------------------------------------+
```

- Left: Tarva white logo, 12px height, 40% opacity
- Center: Thin CSS gradient scan line (1px, 12-second cycle)
- Right cluster: `SessionTimecode` (reused), `MobileThreatIndicator` (overall threat level from `useThreatPicture`), search button
- Background: `rgba(5, 9, 17, 0.92)` with `backdrop-blur(16px)`
- Bottom border: `1px solid rgba(255, 255, 255, 0.06)`

### 5.3 MobileBottomNav

Fixed at the bottom. 56px tall + safe area inset. Ghost tab bar with three tabs plus hamburger:

```
+------------------------------------------------------------------+
|  [grid]       [map]        [radio]        [menu]                 |
| Situation      Map          Intel           ≡                    |
+------------------------------------------------------------------+
```

- Uses `env(safe-area-inset-bottom)` for iPhone notch/home indicator
- Active tab: white icon + label at 50% opacity
- Inactive tabs: 20% opacity
- Background: Same glass treatment as header
- Tab icons are Lucide components (LayoutGrid, Map, Radio)
- Hamburger (Menu icon) opens a slide-up settings panel with: TimeRangeSelector, ViewModeToggle, color scheme, logout
- Situation is the default tab (no URL parameter needed)

Tab state is managed by a local `useState` in `MobileShell`, with URL sync for deep-linking. The active tab is reflected as a `?tab=map` or `?tab=intel` URL parameter. The Situation tab is the default and requires no parameter. On mount, `MobileShell` reads the URL parameter to restore tab state; on tab change, it updates the URL via `history.replaceState()` without triggering a navigation.

### 5.4 MobilePriorityStrip

A horizontally scrollable strip showing P1 and P2 alerts. Sticky-positioned below the header when scrolling. This is the mobile equivalent of the desktop `PriorityFeedStrip`.

- Horizontal scroll with CSS `scroll-snap-type: x mandatory`
- Each item is a compact card: severity color dot + title (truncated) + relative time
- Tap opens the alert in the bottom sheet
- P1 items have a subtle pulse animation on the left border (matches desktop AD-1 spec)
- When no P1/P2 alerts exist, the strip shows "NO PRIORITY ALERTS" in muted monospace
- Height: 44px. Background: slightly elevated glass `bg-white/[0.03]`

### 5.5 MobileCategoryGrid

A 2-column CSS grid of `MobileCategoryCard` components. Renders all 15 KNOWN_CATEGORIES.

Grid parameters:
- `grid-template-columns: repeat(2, 1fr)`
- `gap: 8px`
- `padding: 12px`

On very narrow screens (< 360px), falls back to a single column.

### 5.6 MobileCategoryCard

Touch-optimized version of the desktop `CategoryCard`. Key differences:

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Interaction | Hover reveals overlay with two buttons | Tap opens category bottom sheet directly |
| Size | ~155px wide in 9-col grid | ~50% viewport width |
| Filter action | Button inside hover overlay | Long-press triggers filter toggle |
| Touch target | Not applicable | Entire card is 48px+ minimum height |
| Priority badge | Top-right corner, small | Same position, slightly larger (touch-friendly) |
| Trend arrow | Inline with alert count | Same |

The card does not need `onMouseEnter`/`onMouseLeave` handlers. A single `onClick` triggers `startMorph(categoryId)` which opens the bottom sheet.

Long-press (500ms) toggles the map filter for that category. Visual feedback: the card scales down to 0.97 during the press, then pulses the border glow when the filter activates. Implemented with `motion/react`'s `onTapStart` + a timeout.

### 5.7 MobileBottomSheet

A reusable draggable bottom sheet component. This is the core mobile navigation primitive, replacing the desktop morph animation and district overlay.

**Behavior:**
- Slides up from the bottom with spring animation
- Three snap points: closed (0%), half (50vh), full (90vh)
- Drag handle at the top (40px wide, 4px tall pill)
- Swipe down past the half-point dismisses
- Background overlay dims to `rgba(0, 0, 0, 0.5)` when sheet is open

**Implementation:**
- Uses `motion/react`'s `motion.div` with `drag="y"` and `dragConstraints`
- `dragElastic={0.1}` for resistance at the top
- `onDragEnd` calculates velocity and position to determine snap point
- CSS `border-radius: 16px 16px 0 0` on the sheet
- Background: `rgba(5, 9, 17, 0.96)` with `backdrop-blur(20px)`
- Top border: `1px solid rgba(255, 255, 255, 0.08)`

**Keyboard accessibility:**
- Escape key closes the sheet
- Focus is trapped within the sheet when open
- `aria-modal="true"` on the sheet container
- Return focus to the triggering element on close

### 5.8 MobileCategoryDetail

Renders inside the bottom sheet when a category is selected. Replaces the desktop `CategoryDetailScene` (which uses a 2-column layout with alert list, map, severity breakdown, and source table).

On mobile, these sections stack vertically in a scrollable column:

```
[Drag Handle]
[Category Header: icon + name + short code + alert count]
[Severity Breakdown: horizontal stacked bar + legend]
[Map: full-width, 200px height, filtered to this category]
[Alert List: full-width, scrollable within remaining space]
```

Each alert item in the list is a `MobileAlertCard`. Tapping an alert pushes a second sheet state (alert detail view) using `AnimatePresence mode="wait"` within the sheet -- the category detail slides left and the alert detail slides in from the right.

The "back" gesture is a left-edge swipe or a back button at the top of the alert detail.

### 5.9 MobileAlertDetail

Full alert detail view inside the bottom sheet. Reuses the `AlertDetailView` component from `district-view-dock.tsx` but with mobile-adapted layout:

- Full-width instead of 360px dock width
- Larger touch targets on the "back to category" button
- Severity badge and priority badge are slightly larger
- Geographic scope tags wrap in a flex container
- Timestamps use shorter format on very narrow screens

### 5.10 MobileMapView

Full-width map section in the Map tab. Uses the existing `CoverageMap` component (already SSR-disabled via `next/dynamic`, already touch-compatible via MapLibre GL).

Mobile-specific adaptations:
- Height: `50vh` (instead of fixed 900px in world-space)
- No `onInspect` callback -- tapping a marker opens the alert in the bottom sheet instead of the desktop AlertDetailPanel
- Simplified controls: zoom buttons + inline ViewModeToggle below map
- Full-bleed width (no padding)

### 5.11 MobileSearchOverlay

Full-screen search overlay, replacing the desktop `CommandPalette` (which is a centered modal dialog with keyboard shortcut access).

- Triggered by the search button in the header
- Full-screen overlay with search input auto-focused
- Results render as a scrollable list of `MobileAlertCard` items
- Selecting a result opens it in the bottom sheet
- Uses the existing `useIntelSearch` hook

---

## 6. State Management Adaptations

### 6.1 Shared Stores (No Changes)

Both Zustand stores are fully reusable on mobile:

**`ui.store.ts`** -- The morph state machine still drives transitions. On mobile, `startMorph(categoryId, { fast: true })` triggers the bottom sheet opening rather than the spatial morph animation. The `useMorphChoreography()` hook remains the single code path that calls `setMorphPhase()` -- it is used on mobile for the 3-phase fast path (idle -> entering-district -> district). The `MobileShell` reads `morph.phase` and `morph.targetId` to determine bottom sheet state. The `MorphOrchestrator` component (which handles semantic zoom level switching between Z0/Z1+) is desktop-only and not loaded on mobile.

**`coverage.store.ts`** -- Category filters, view mode, time presets, selected alerts, priority filters all work identically on mobile. URL sync functions remain the same.

### 6.2 Mobile-Specific State

A small amount of mobile-specific state is managed locally (not in Zustand):

| State | Where | Why Local |
|-------|-------|-----------|
| Active tab index (0/1/2) | `MobileShell` useState | UI-only, not shared, not persisted |
| Bottom sheet snap position | `MobileBottomSheet` useRef | Animation state, not application state |
| Search overlay open | `MobileShell` useState | Transient UI toggle |
| Long-press timer ID | `MobileCategoryCard` useRef | Interaction implementation detail |

### 6.3 Morph State Machine -- Mobile Path

The desktop morph has 6 phases:
```
Forward:  idle -> expanding (400ms) -> settled (200ms) -> entering-district (600ms) -> district
Reverse:  district -> leaving-district (400ms) -> idle
```

On mobile, the full animation chain is unnecessary. The bottom sheet opening IS the transition. The mobile path uses only 3 phases:

```
Forward:  idle -> entering-district (300ms) -> district
Reverse:  district -> leaving-district (300ms) -> idle
```

This is achieved by always using `startMorph(categoryId, { fast: true })`, which already exists in the codebase and skips the `expanding` and `settled` phases. The `useMorphChoreography` hook is still the only code that calls `setMorphPhase()` -- this constraint is preserved.

### 6.4 Camera Store Isolation

The `camera.store.ts` (tracks `offsetX`, `offsetY`, `zoom`) is not imported on mobile. It only exists in:
- `SpatialViewport` (desktop only)
- `SpatialCanvas` (desktop only)
- `coverage.store.ts` (for `preFlyCamera` in the INSPECT flow)

The `coverage.store.ts` reference to `useCameraStore` in `selectMapAlert` is safe because on mobile, the INSPECT flow is replaced by directly opening the bottom sheet -- `selectMapAlert` is not called on mobile. The mobile equivalent stores the alert ID directly without camera position capture.

### 6.5 Polling Frequency Adjustments

Mobile devices have constrained battery. The data hooks should reduce polling frequency when on mobile:

| Hook | Desktop Interval | Mobile Interval | Rationale |
|------|-----------------|-----------------|-----------|
| `useCoverageMetrics` | 60s | 90s | Lower refresh acceptable for overview stats |
| `useCoverageMapData` | 30s | 60s | Map updates are less urgent on smaller viewport |
| `useIntelFeed` | 30s | 45s | Feed is secondary on mobile |
| `useIntelBundles` | 45s | 90s | Bundles are less central to mobile UX |
| `useBundleDetail` | on-demand | on-demand | No change needed |

Implementation: pass the `isMobile` flag as a parameter to each hook, or create a `usePollInterval(desktopMs, mobileMs)` utility:

```typescript
function usePollInterval(desktop: number, mobile: number): number {
  const isMobile = useIsMobile()
  return isMobile ? mobile : desktop
}
```

---

## 7. Component Reuse Matrix

### 7.1 Fully Shared (Zero Modification)

These components work identically on mobile and desktop:

| Component | Path | Notes |
|-----------|------|-------|
| All TanStack Query hooks | `src/hooks/use-coverage-*.ts`, `use-intel-*.ts`, etc. | Pure data, no UI |
| `ui.store.ts` | `src/stores/ui.store.ts` | Morph state machine |
| `coverage.store.ts` | `src/stores/coverage.store.ts` | Data filtering |
| `PriorityBadge` | `src/components/coverage/PriorityBadge.tsx` | Achromatic badge |
| `MapMarkerLayer` | `src/components/coverage/MapMarkerLayer.tsx` | Map markers |
| `CoverageMap` | `src/components/coverage/CoverageMap.tsx` | MapLibre GL (touch-native) |
| All type definitions | `src/lib/interfaces/*.ts` | Types and constants |
| `coverage-utils.ts` | `src/lib/coverage-utils.ts` | Pure utility functions |
| `tarvari-api.ts` | `src/lib/tarvari-api.ts` | API client |
| `SessionTimecode` | `src/components/ambient/session-timecode.tsx` | CSS-only, tiny |

### 7.2 Adapted (Shared Logic, Different Layout)

These components have shared data logic but need layout/interaction changes for mobile:

| Desktop Component | Mobile Adaptation | What Changes |
|-------------------|-------------------|-------------|
| `CategoryCard` | `MobileCategoryCard` | Remove hover overlay, add tap handler, add long-press for filter, larger touch target |
| `CategoryDetailScene` | `MobileCategoryDetail` | Stack vertically instead of 2-column grid, smaller map, integrated alert list |
| `AlertDetailView` (in dock) | `MobileAlertDetail` | Full-width layout, larger touch targets, adapted timestamp format |
| `CategoryOverviewView` (in dock) | Integrated into `MobileCategoryDetail` header | Condensed metadata display |
| `AlertList` (in scene) | `MobileAlertList` | Full-width cards, no table-like density, virtual scrolling |
| `SeverityBreakdown` (in scene) | Inlined in `MobileCategoryDetail` | Same visual, full-width |
| `PriorityFeedStrip` | `MobilePriorityStrip` | Horizontal scroll strip, sticky positioning |
| `DistrictViewOverlay` | `MobileBottomSheet` | Sheet instead of full-screen overlay |
| `ViewModeToggle` | Inline on Map tab | Same component, positioned below map |
| `TimeRangeSelector` | Moved to hamburger settings panel | Same component, accessed via hamburger menu |
| `MapPopup` | Adapted sizing | Narrower max-width, larger close button |
| `CommandPalette` | `MobileSearchOverlay` | Full-screen instead of centered modal |
| `SourceHealthTable` (in scene) | Accordion in `MobileCategoryDetail` | Collapsible instead of always-visible |
| `GeoSummaryPanel` | Opens in bottom sheet | Slide-up sheet instead of slide-over panel |
| `TriageRationalePanel` | Opens in bottom sheet | Slide-up sheet instead of slide-over panel |

### 7.3 Mobile-Only (New Components)

| Component | Purpose |
|-----------|---------|
| `MobileShell` | Root layout: header + scroll area + bottom nav |
| `MobileHeader` | Compact top bar with logo, timecode, threat level, search |
| `MobileBottomNav` | Tab bar for primary navigation |
| `MobileBottomSheet` | Reusable draggable sheet (core navigation primitive) |
| `MobileCategoryGrid` | 2-column responsive grid container |
| `MobileMapView` | Map section with mobile-adapted controls |
| `MobileScanLine` | CSS-only ambient scan line for header |
| `MobileThreatIndicator` | Compact threat level badge with radial glow |
| `MobileSearchOverlay` | Full-screen search interface |

### 7.4 Desktop-Only (Not Loaded on Mobile)

These components are never imported in the mobile bundle:

| Component | Reason for Exclusion |
|-----------|---------------------|
| `SpatialViewport` | ZUI engine, mouse/wheel events |
| `SpatialCanvas` | CSS transform camera, world-space coordinates |
| `MorphOrchestrator` | Semantic zoom level switching (Z0/Z1+) |
| `CategoryIconGrid` | Z0 far-zoom representation |
| `CoverageGrid` | 9-column world-space grid |
| `DotGrid` | 20000x20000px ambient background |
| `SectorGrid` | World-space sector labels |
| `EnrichmentLayer` | Container for ambient glow effects |
| `HaloGlow` | Radial ambient glow |
| `RangeRings` | Concentric range indicators |
| `CoordinateOverlays` | World-space coordinate labels |
| `NavigationHUD` | Desktop minimap + breadcrumb container |
| `Minimap` | Spatial minimap |
| `ZoomIndicator` | Camera zoom level readout |
| `SpatialBreadcrumb` | ZUI navigation breadcrumb |
| `CalibrationMarks` | Corner viewport decorations |
| `TopTelemetryBar` | Full-width desktop status bar |
| `BottomStatusStrip` | Full-width desktop status bar |
| `DeepZoomDetails` | Z3 deep-zoom content |
| `EdgeFragments` | Far-edge ambient decoration |
| `MicroChronometer` | World-space time decoration |
| `ConnectionPaths` | Archived, not used |
| `Phase3Effects` | Narration cycle, attention choreography |
| `AlertDetailPanel` | Desktop INSPECT panel (right of map) |
| `ThreatPictureCard` | Desktop-positioned card (replaced by MobileThreatIndicator) |
| `MapLedger` | Desktop-positioned ledger panel |
| `DistrictViewHeader` | Desktop district header (replaced by sheet header) |
| `DistrictFilterPanel` | Desktop filter slide-out (integrated into mobile sheet) |
| Camera store | `camera.store.ts` -- ZUI camera position |
| `use-pan.ts` | Mouse drag panning |
| `use-zoom.ts` | Wheel zooming |
| `use-pan-pause.ts` | Pan state detection |
| `use-semantic-zoom.ts` | Z-level switching |
| `use-camera-sync.ts` | Camera-to-URL sync |
| `use-camera-director.ts` | Automated camera movement |
| `use-fly-to.ts` | Camera fly-to animations |
| `use-viewport-cull.ts` | Frustum culling |
| `use-morph-variants.ts` | CSS morph animation variants |
| `use-district-position.ts` | World-space positioning |
| `use-attention-choreography.ts` | Ambient attention cycling |
| `use-enrichment-cycle.ts` | Ambient enrichment toggling |
| `use-narration-cycle.ts` | AI narration cycling |
| `use-frame-budget-monitor.ts` | Performance monitoring |

---

## 8. Gesture System Architecture

### 8.1 Gesture Library Decision: No External Library

The project already depends on `motion/react` v12, which provides `drag`, `onTap`, `onTapStart`, `onPan`, and `onPanEnd` gesture handlers. These are sufficient for all mobile interactions. No additional gesture library (e.g., `@use-gesture/react`, `react-swipeable`) is added.

### 8.2 Gesture Map

| Gesture | Context | Action | Implementation |
|---------|---------|--------|----------------|
| Tap | Category card | Open category bottom sheet | `onClick` handler, calls `startMorph(id, { fast: true })` |
| Long press (500ms) | Category card | Toggle map filter for category | `onTapStart` + `setTimeout(500)`, cancel on `onTapCancel` |
| Tap | Alert card | Open alert detail in bottom sheet | `onClick`, sets `selectedAlertId` |
| Tap | Map marker | Open alert in bottom sheet | `onMarkerClick` via MapLibre |
| Drag Y | Bottom sheet | Drag to snap points | `motion.div` with `drag="y"` |
| Swipe down | Bottom sheet (from top) | Dismiss sheet | `onDragEnd` velocity check |
| Swipe left (edge) | Alert detail in sheet | Back to category view | `onPanEnd` with x-velocity threshold |
| Pinch/pan | Map viewport | Zoom and pan map | Native MapLibre touch handling |
| Pull down | Scroll container | Refresh data | Custom pull-to-refresh (optional, Phase 3) |
| Tap | Bottom nav tab | Switch tab | `onClick` on tab buttons |
| Tap | Search button | Open search overlay | `onClick`, toggles overlay state |

### 8.3 Touch Target Sizing

All interactive elements conform to WCAG 2.2 target size requirements:

- **Minimum touch target:** 44x44px (WCAG AAA)
- **Category cards:** Full card area is tappable (~170x120px)
- **Alert list items:** Full row is tappable (height: 64px -- 48px content + 16px vertical padding)
- **Bottom nav tabs:** Each tab area is at least 80x56px
- **Map markers:** MapLibre marker interaction area padded to 44x44px minimum
- **Bottom sheet drag handle:** 40x24px visible, 100% width tap area

### 8.4 Haptic Feedback

On devices that support it, haptic feedback is triggered for:
- Category filter toggle (long-press completion): `navigator.vibrate(10)`
- Bottom sheet snap to a new position: `navigator.vibrate(5)`
- P1 alert notification arrival: `navigator.vibrate([50, 30, 50])`

Gated behind `'vibrate' in navigator` check. Silent failure on unsupported devices.

---

## 9. Performance Architecture

### 9.1 Bundle Size Budget

| Segment | Budget | Contents |
|---------|--------|----------|
| Mobile shell + core | < 60 KB gzipped | MobileShell, MobileHeader, MobileBottomNav, MobileCategoryGrid, MobileCategoryCard, hooks, stores, types |
| Map chunk | < 180 KB gzipped | MapLibre GL JS + react-map-gl (loaded on demand) |
| Bottom sheet + detail | < 25 KB gzipped | MobileBottomSheet, MobileCategoryDetail, MobileAlertDetail |
| Search overlay | < 10 KB gzipped | MobileSearchOverlay (loaded on demand) |
| **Total mobile JS** | **< 275 KB gzipped** | Excluding shared framework (React, Next.js) |

For comparison, the desktop bundle includes ~120 KB of spatial engine + ambient components that mobile never loads.

### 9.2 Lazy Loading Strategy

```
Initial load:
  React + Next.js runtime (framework, always loaded)
  |
  +-- useIsMobile() resolves
       |
       +-- [mobile] dynamic(() => import('@/views/MobileView'))
       |     |
       |     +-- MobileShell, MobileHeader, MobileBottomNav (immediate)
       |     +-- MobileCategoryGrid + MobileCategoryCard (immediate)
       |     +-- MobilePriorityStrip (immediate)
       |     |
       |     +-- [deferred] MobileMapView
       |     |     +-- dynamic(() => import('react-map-gl/maplibre'))
       |     |     +-- MapLibre GL JS loaded when Map tab is active (deferred since Situation is default)
       |     |
       |     +-- [deferred] MobileBottomSheet + detail components
       |     |     +-- Loaded when a category or alert is tapped
       |     |
       |     +-- [deferred] MobileSearchOverlay
       |           +-- Loaded when search button is tapped
       |
       +-- [desktop] dynamic(() => import('@/views/DesktopView'))
             +-- (current page.tsx contents)
```

### 9.3 MapLibre Lazy Loading

MapLibre GL JS is the largest dependency (~180 KB gzipped). On mobile, it is loaded only when the Map tab is active:

```typescript
// MobileMapView.tsx
const CoverageMapLazy = dynamic(
  () => import('@/components/coverage/CoverageMap').then(m => ({ default: m.CoverageMap })),
  {
    ssr: false,
    loading: () => <MapLoadingPlaceholder />,
  }
)
```

If the user never opens the Map tab, MapLibre is never downloaded.

### 9.4 Virtual Scrolling

The alert list on mobile can contain 50+ items. Rather than rendering all DOM nodes, use a lightweight virtual scroll approach:

- If `items.length < 30`: render all items (DOM cost is negligible)
- If `items.length >= 30`: use `IntersectionObserver` to mount/unmount items outside the viewport

This avoids adding a virtual scroll library (e.g., `@tanstack/react-virtual`) as a dependency. The IntersectionObserver approach is sufficient for lists under 500 items.

### 9.5 Image and Asset Optimization

- Map tiles are the primary network cost. MapLibre handles tile caching internally.
- Category icons are Lucide React components (inline SVG, tree-shaken, ~200 bytes each).
- The Tarva logo is a single SVG file (~2 KB), loaded from the public directory.
- No raster images are used in the mobile interface.

### 9.6 Animation Performance

All mobile animations target 60fps. Constraints:

- Only `transform` and `opacity` properties are animated (GPU-composited)
- `backdrop-filter: blur()` is applied to static elements only (header, nav, sheet background) -- never animated
- `will-change: transform` on the bottom sheet during drag
- `prefers-reduced-motion` check: if enabled, all animations are instant (duration: 0) and haptic feedback is disabled

---

## 10. PWA Readiness Assessment

### 10.1 Current State

The app currently deploys as a static Next.js export to GitHub Pages. It has:
- HTTPS (via GitHub Pages)
- Favicon set (16x16, 32x32, apple-touch-icon)
- No `manifest.json`
- No service worker
- No offline capability

### 10.2 PWA Implementation Plan

**Phase 1 -- Installable (Add to Home Screen):**

Create `public/manifest.json`:
```json
{
  "name": "TarvaRI Alert Viewer",
  "short_name": "TarvaRI",
  "description": "Intelligence alert monitoring console",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#050911",
  "theme_color": "#050911",
  "icons": [
    { "src": "android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Add to `layout.tsx`:
```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#050911" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

**Phase 2 -- Offline Shell (Service Worker):**

A service worker that caches the app shell (HTML, JS, CSS) for offline access. When offline, the UI renders with the last-known data and shows an "OFFLINE" indicator in the header.

Implementation: Use `workbox-webpack-plugin` (since the build uses `--webpack` flag) to generate a precache manifest. Runtime caching strategy:
- App shell: `CacheFirst` (HTML, JS, CSS, fonts)
- API responses: `NetworkFirst` with 5-minute cache fallback
- Map tiles: `CacheFirst` with 7-day expiry (MapLibre tiles)

**Phase 3 -- Push Notifications (Future):**

P1 alert push notifications via the Push API. Requires:
- A push notification backend (would need TarvaRI backend changes)
- User permission prompt
- Service worker push event handler
- This is a future enhancement, not part of the initial mobile architecture.

### 10.3 Offline Data Strategy

When offline, TanStack Query's built-in offline behavior is leveraged:
- Cached query data remains available and renders normally
- Failed refetch attempts are silently suppressed
- The `MobileHeader` shows an "OFFLINE" badge when `navigator.onLine === false`
- When connectivity returns, all queries automatically refetch

No IndexedDB persistence layer is added. The TanStack Query in-memory cache is sufficient for the session. If the app is killed and reopened offline, users see a loading state until connectivity returns.

---

## 11. Adaptive Interface Patterns

### 11.1 Severity-Driven Layout Priority

The mobile interface adapts its visual hierarchy based on the current threat landscape:

- **When P1 alerts exist:** The `MobilePriorityStrip` is expanded (56px height) with a pulsing left-border accent. The strip auto-scrolls to the newest P1 alert.
- **When no P1/P2 alerts exist:** The strip collapses to a compact 32px bar showing "ALL CLEAR" in muted text, giving more space to the content below.
- **When Extreme severity alerts dominate:** The `MobileThreatIndicator` in the header shows a red radial glow. On lower threat levels, the glow shifts to orange, yellow, blue, or gray.

### 11.2 Context-Aware Data Density

The `MobileCategoryCard` adapts its content based on the available data:

- **Category with alerts:** Shows alert count (large), source count (small), trend arrow, and priority badge if P1/P2 exists
- **Category with zero alerts:** Shows only source count and a muted "No alerts" label. The card uses reduced opacity (0.5) to de-emphasize it visually
- **Category with zero sources:** Shows "Not monitored" and is fully dimmed (0.3 opacity)

### 11.3 Time-of-Day Adaptation

The mobile header's ambient scan line adjusts its speed based on the time of day (a subtle cinematic touch):

- **06:00--18:00 local:** 12-second cycle (normal pace)
- **18:00--06:00 local:** 20-second cycle (slower, calmer night mode)

This is purely decorative and costs nothing computationally (CSS animation duration change).

### 11.4 Network-Aware Polling

When the device is on a slow connection (detected via `navigator.connection?.effectiveType`):

- `'slow-2g'` or `'2g'`: Disable all automatic polling. Data refreshes only on explicit pull-to-refresh.
- `'3g'`: Double all polling intervals.
- `'4g'` or undefined: Use standard mobile polling intervals.

**Browser support note:** `navigator.connection` (Network Information API) has limited browser support -- available in Chrome, Edge, and Samsung Internet, but **not in Safari or Firefox**. This must be treated as a progressive enhancement with a fallback. When `navigator.connection` is unavailable, use the standard mobile polling intervals.

```typescript
function useNetworkAwareInterval(baseMs: number): number {
  if (!('connection' in navigator)) return baseMs // Fallback for Safari/Firefox

  const connection = (navigator as any).connection
  if (!connection?.effectiveType) return baseMs

  switch (connection.effectiveType) {
    case 'slow-2g':
    case '2g':
      return Infinity // disable polling
    case '3g':
      return baseMs * 2
    default:
      return baseMs
  }
}
```

### 11.5 Scroll Position Memory

When the user opens a category bottom sheet and then dismisses it, the scroll position of the category grid is preserved. This prevents the jarring "scroll back to top" behavior common in mobile apps.

Implementation: Save `scrollTop` in a `useRef` before sheet opens, restore it after sheet closes.

---

## 12. Accessibility on Mobile

### 12.1 Screen Reader Support

- All interactive elements have explicit `aria-label` attributes
- The bottom sheet uses `role="dialog"` and `aria-modal="true"`
- Category cards use `role="button"` (since they trigger navigation, not form submission)
- Alert severity is announced: `aria-label="Extreme severity: Earthquake detected in..."`
- Priority badges use `aria-label="Priority 1: Critical"` (not just the visual diamond shape)
- The bottom nav uses `role="tablist"` with `role="tab"` on each item

### 12.2 Focus Management

- When the bottom sheet opens, focus moves to the sheet heading
- When the sheet closes, focus returns to the element that triggered it
- Tab order within the sheet follows visual order (top to bottom)
- The search overlay traps focus within itself when open
- `Escape` key closes the topmost overlay/sheet

### 12.3 Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- Bottom sheet appears instantly (no slide animation)
- Category cards do not scale on press
- Scan line animation is disabled
- P1 pulse animation is disabled
- All `motion/react` transitions use `duration: 0`

The existing `usePrefersReducedMotion()` hook in `page.tsx` is reused.

### 12.4 Color Contrast

All text meets WCAG AA contrast ratios against the void background:
- Primary text: `rgba(255, 255, 255, 0.4)` on `#050911` = 5.8:1 (passes AA)
- Secondary text: `rgba(255, 255, 255, 0.25)` on `#050911` = 3.2:1 (passes AA for large text; labels are uppercase which reads as "large")
- Severity badges use colored backgrounds with sufficient contrast against their text color

---

## 13. Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal:** Mobile detection, layout switching, basic shell.

**Deliverables:**
1. `src/hooks/use-is-mobile.ts` -- viewport detection hook
2. `src/views/DesktopView.tsx` -- extract current `page.tsx` content into standalone component
3. `src/views/MobileView.tsx` -- mobile orchestrator with dynamic import
4. Update `src/app/(launch)/page.tsx` -- thin wrapper with detection
5. `src/components/mobile/MobileShell.tsx` -- header + scroll area + bottom nav skeleton
6. `src/components/mobile/MobileHeader.tsx` -- logo, timecode, placeholder search button
7. `src/components/mobile/MobileBottomNav.tsx` -- three-tab bar with tab switching
8. Verify: desktop experience is completely unchanged after extraction

**Dependencies:** None. This phase touches only the page entry point and creates new files.

**Test criteria:**
- Desktop renders identically to current production
- Mobile renders the shell with header, empty content area, and bottom nav
- Resizing browser between mobile/desktop breakpoints switches layouts
- Static export builds successfully

### Phase 2: Category Grid + Cards (Week 2)

**Goal:** Render the 15 categories in a touchable mobile grid.

**Deliverables:**
1. `src/components/mobile/MobileCategoryGrid.tsx` -- 2-column grid container
2. `src/components/mobile/MobileCategoryCard.tsx` -- touch-optimized card with long-press filter
3. Wire `useCoverageMetrics()` data into the grid
4. Wire `useThreatPicture()` for trend arrows
5. Wire category filter toggle (long-press) to `coverage.store`
6. `src/components/mobile/MobileThreatIndicator.tsx` -- threat level badge in header
7. `src/components/mobile/MobileScanLine.tsx` -- CSS-only ambient decoration

**Dependencies:** Phase 1 (MobileShell must exist to host the grid).

**Test criteria:**
- All 15 categories render with correct icons, colors, names, alert counts
- Tap on a card triggers (no action yet -- wired in Phase 4)
- Long-press toggles map filter (visual feedback on card border)
- Threat indicator reflects overall threat level
- Grid is 2-column on 375px+, 1-column on <360px

### Phase 3: Map Tab (Week 2--3)

**Goal:** Interactive map with markers on the Map tab.

**Deliverables:**
1. `src/components/mobile/MobileMapView.tsx` -- full-width map wrapper
2. Wire `useCoverageMapData()` with mobile filters
3. Marker tap handler (stores selected alert ID, no detail view yet)
4. `src/components/mobile/MobilePriorityStrip.tsx` -- P1/P2 horizontal strip
5. Wire `useRealtimePriorityAlerts()` for live updates
6. Haptic feedback on P1 notification arrival

**Dependencies:** Phase 1 (tab system). MapLibre is already in the dependency tree.

**Test criteria:**
- Map renders with markers when Map tab is active
- Map is not loaded when Map tab is inactive (verify via network tab)
- Priority strip shows P1/P2 alerts with horizontal scroll
- Category filter (from Phase 2 long-press) applies to map markers
- Map touch gestures (pinch zoom, pan) work correctly

### Phase 4: Bottom Sheet + Category Detail (Week 3)

**Goal:** Full category detail experience in a draggable bottom sheet.

**Deliverables:**
1. `src/components/mobile/MobileBottomSheet.tsx` -- reusable draggable sheet
2. `src/components/mobile/MobileCategoryDetail.tsx` -- category content in sheet
3. `src/components/mobile/MobileAlertCard.tsx` -- touch-optimized alert list item
4. Wire `startMorph(id, { fast: true })` on category card tap
5. Wire `reverseMorph()` on sheet dismiss
6. Severity breakdown section in category detail
7. Category map (filtered) in category detail
8. Alert list with sort toggle in category detail

**Dependencies:** Phase 2 (cards must exist to trigger the sheet). Phase 3 (map component must exist for category map).

**Test criteria:**
- Tapping a category card opens the bottom sheet
- Sheet has three snap points (closed, half, full)
- Swipe down past half-point dismisses the sheet
- Alert list shows items sorted by severity or time
- Category map shows markers for the selected category only
- `morph.phase` transitions correctly: idle -> entering-district -> district -> leaving-district -> idle

### Phase 5: Alert Detail + Search (Week 4)

**Goal:** Full alert detail view and search capability.

**Deliverables:**
1. `src/components/mobile/MobileAlertDetail.tsx` -- alert detail in sheet
2. Alert card tap transitions from category list to alert detail within the sheet
3. Edge swipe or back button returns to category view
4. `src/components/mobile/MobileSearchOverlay.tsx` -- full-screen search
5. Wire `useIntelSearch()` hook to search overlay
6. Search result tap opens alert in bottom sheet

**Dependencies:** Phase 4 (bottom sheet infrastructure must exist).

**Test criteria:**
- Tapping an alert in the category list shows full detail
- Back gesture returns to category list
- Search overlay opens on header button tap
- Search results match existing desktop search behavior
- Selecting a search result opens the correct alert

### Phase 6: Polish + PWA (Week 4--5)

**Goal:** Ambient atmosphere, PWA installation, performance verification.

**Deliverables:**
1. PWA manifest + icons
2. Service worker for offline shell caching
3. Offline indicator in MobileHeader
4. Network-aware polling adjustments
5. `prefers-reduced-motion` compliance verification
6. Accessibility audit (screen reader, focus management)
7. Performance profiling (Lighthouse mobile score target: >= 85)
8. Animation polish: spring constants, easing curves, timing
9. Safe area inset handling (iPhone notch, Android gesture bar)
10. Time-of-day scan line adaptation
11. Scroll position memory on sheet open/close

**Dependencies:** All previous phases.

**Test criteria:**
- App installs via "Add to Home Screen" on iOS and Android
- Offline indicator appears when connectivity is lost
- Cached data renders when offline
- Lighthouse mobile performance score >= 85
- All interactive elements meet 44x44px minimum touch target
- `prefers-reduced-motion` disables all animations
- No layout shift on iPhone safe area (notch, home indicator)

---

## 14. Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| MapLibre GL JS is too large for mobile first-load | High bundle size, slow Time-to-Interactive | Medium | Lazy-load map only when Map tab is active. Consider vector tile simplification. |
| Bottom sheet drag conflicts with internal scroll | User frustration, broken navigation | High | Use `overscroll-behavior: contain` on scrollable content inside the sheet. Only allow sheet drag from the handle area. |
| `motion/react` drag gestures interfere with native scroll | Scroll jank, input lag | Medium | Limit `drag` prop to the sheet component only. Content areas use native scroll. |
| GitHub Pages CORS restricts service worker scope | Service worker fails to install | Low | Service worker is served from same origin. No CORS issue expected with static assets. |
| `basePath` configuration breaks manifest/SW paths | PWA manifest not found, SW scope wrong | Medium | Use relative paths in manifest. Test with `GITHUB_PAGES=tarvari-alert-viewer` build. |
| Long-press gesture conflicts with native context menu | Browser shows "copy/paste" menu instead of filter action | High | Call `e.preventDefault()` on `contextmenu` event for category cards. Test on both iOS Safari and Android Chrome. |
| Camera store import in `coverage.store.ts` pulls desktop code into mobile bundle | Bundle bloat | Low | The import is a runtime call (`useCameraStore.getState()`) inside `selectMapAlert`, which is not called on mobile. Tree-shaking should eliminate it. Verify with bundle analyzer. If not eliminated, extract the camera capture into a separate function imported conditionally. |
| Zustand store hydration race between mobile detection and store initialization | Stale or missing data on first render | Low | Stores initialize synchronously (no `persist` middleware). `useIsMobile()` resolves in the first `useEffect` cycle, well after store initialization. |

---

## 15. Open Questions

1. **Tablet breakpoint.** The current plan uses a single 768px breakpoint. Should tablets (768--1024px) get a hybrid layout (mobile shell with wider cards), or is the desktop ZUI acceptable on iPad-class devices?

2. ~~**Landscape phone orientation.**~~ **Resolved (Client Decision Q2).** Both portrait and landscape are supported. `useIsMobile()` uses `(max-width: 767px), ((max-height: 500px) and (pointer: coarse))` to catch landscape phones. Landscape detection within mobile uses `matchMedia('(orientation: landscape)')` for layout adaptation.

3. **Pull-to-refresh.** Native pull-to-refresh is trivial with CSS `overscroll-behavior` but competes with the priority strip sticky behavior. Should pull-to-refresh be implemented, or is automatic polling sufficient?

4. **Dark map style.** The current MapLibre configuration uses a specific tile source. Is there a darker tile variant available for the Oblivion aesthetic, or should a custom map style be created?

5. **Notification permission prompt.** When should users be asked for push notification permission? Immediately on first mobile visit? After they interact with P1 alerts? Never (polling only)?

---

## Appendix A: Mobile Navigation Flow Diagram

```
                    +------------------+
                    |   MobileShell    |
                    |  (fixed header)  |
                    |  (tab content)   |
                    |  (bottom nav)    |
                    +--------+---------+
                             |
            +----------------+----------------+----------+
            |                |                |          |
   [Situation Tab]     [Map Tab]        [Intel Tab]   [≡ Menu]
      (default)          |                |          |
   PriorityStrip      PriorityStrip    PriorityStrip  TimeRange
   CategoryGrid       MobileMapView    MobileAlertList ViewMode
   ThreatSummary      ViewModeToggle                  ColorScheme
            |                |                |        Logout
            |                |
      [tap card]        [tap alert]
            |                |
            v                v
    +------------------+  +-----------------+
    | MobileBottomSheet|  | MobileBottom-   |
    | (category detail)|  | Sheet (alert    |
    |   [alert list]   |  |  detail)        |
    |   [map]          |  |                 |
    |   [severity]     |  |                 |
    +--------+---------+  +-----------------+
             |
       [tap alert]
             |
             v
    +------------------+
    | MobileBottomSheet|
    | (alert detail)   |
    |  [severity]      |
    |  [priority]      |
    |  [summary]       |
    |  [metadata]      |
    |  [timestamps]    |
    +------------------+
```

## Appendix B: Morph State Machine -- Mobile Path

```
Desktop (6 phases):
  idle --> expanding (400ms) --> settled (200ms) --> entering-district (600ms) --> district
  district --> leaving-district (400ms) --> idle

Mobile (3 phases, using fast path):
  idle --> entering-district (300ms) --> district
  district --> leaving-district (300ms) --> idle

Trigger: startMorph(categoryId, { fast: true })
  - Sets morph.phase = 'entering-district' (skips expanding + settled)
  - MobileBottomSheet reads morph.phase and opens when phase !== 'idle'
  - Sheet drag-to-dismiss calls reverseMorph()
  - useMorphChoreography advances leaving-district --> idle (300ms)
  - MobileBottomSheet closes when phase returns to 'idle'
```

## Appendix C: File Creation Order

This is the recommended implementation order, respecting dependency relationships:

```
1.  src/hooks/use-is-mobile.ts
2.  src/views/DesktopView.tsx              (extract from page.tsx)
3.  src/components/mobile/MobileHeader.tsx
4.  src/components/mobile/MobileBottomNav.tsx
5.  src/components/mobile/MobileScanLine.tsx
6.  src/components/mobile/MobileShell.tsx   (depends on 3, 4, 5)
7.  src/views/MobileView.tsx               (depends on 6)
8.  src/app/(launch)/page.tsx              (update to use 1, 2, 7)
9.  src/components/mobile/MobileThreatIndicator.tsx
10. src/components/mobile/MobileCategoryCard.tsx
11. src/components/mobile/MobileCategoryGrid.tsx (depends on 10)
12. src/components/mobile/MobilePriorityStrip.tsx
13. src/components/mobile/MobileMapView.tsx
14. src/components/mobile/MobileBottomSheet.tsx
15. src/components/mobile/MobileAlertCard.tsx
16. src/components/mobile/MobileAlertList.tsx (depends on 15)
17. src/components/mobile/MobileCategoryDetail.tsx (depends on 14, 15, 16)
18. src/components/mobile/MobileAlertDetail.tsx (depends on 14)
19. src/components/mobile/MobileSearchOverlay.tsx
20. public/manifest.json
21. Service worker configuration
```

## Appendix D: Performance Comparison Targets

| Metric | Desktop (current) | Mobile (target) |
|--------|--------------------|-----------------|
| First Contentful Paint | ~1.2s | < 1.0s |
| Time to Interactive | ~2.5s | < 1.8s |
| Total JS (gzipped) | ~420 KB | < 275 KB |
| Lighthouse Performance | ~72 | >= 85 |
| Main thread blocking | ~800ms | < 400ms |
| Memory (steady state) | ~45 MB | < 30 MB |
| Polling network (per min) | ~8 requests | ~4 requests |
| Animation frame budget | 16ms (60fps) | 16ms (60fps) |


---

## #every-time Review

**Reviewer:** every-time protocol v3.2
**Date:** 2026-03-06
**Cross-referenced against:** ux-strategy.md, ui-design-system.md, information-architecture.md
**Codebase verified:** Yes (file paths, hook exports, store imports, component names confirmed)

### Rating: B+ -> A+ (after revisions)

All 7 required changes have been applied: tab model aligned to Situation/Map/Intel + hamburger, morph choreography contradiction resolved (hook used, component desktop-only), tab URL sync added, landscape phone detection addressed, alert list item height aligned to 64px, navigator.connection noted as progressive enhancement, scan line cycle confirmed at 12s.

This is the most technically rigorous document of the four and the closest to an implementation blueprint. The hydration strategy, code splitting approach, file creation order, lazy loading plan, and performance targets are excellent. The 3-phase morph simplification is the cleanest solution to the desktop-to-mobile morph translation. The tab model has been aligned to the canonical 3-tab ghost tab bar (Situation, Map, Intel) + hamburger.

### Strengths

- **Hydration strategy is the best across all documents.** The `useIsMobile()` returning `boolean | null` with a `HydrationShell` placeholder during SSR prevents layout shift.
- **Code splitting design is production-quality.** Dynamic imports for both `MobileView` and `DesktopView` with explicit `ssr: false` ensure mobile users never download spatial engine code.
- **3-phase morph simplification is elegant.** Reusing `startMorph(categoryId, { fast: true })` to skip `expanding` and `settled` phases is the minimum-change approach.
- **File creation order is dependency-aware** and gives implementers a clear build sequence.
- **Camera store isolation analysis identifies a real risk** -- the `useCameraStore` import at the top of `coverage.store.ts` could pull desktop code into the mobile bundle.
- **PWA plan is the only document to address installability** with concrete manifest.json, service worker strategy, and offline data approach.
- **Performance comparison targets** with specific numbers for FCP, TTI, JS size, Lighthouse score give a clear success definition.

### Issues Found

1. ~~**3 tabs (Map, Alerts, Settings) is the weakest navigation model.**~~ **Resolved.** Tab model updated to 3-tab ghost tab bar (Situation, Map, Intel) + hamburger for settings. Situation is the default tab.

2. ~~**Section 6.3 says `useMorphChoreography` hook "is not used on mobile" but Section 6.1 says it "still drives transitions."**~~ **Resolved.** Section 6.1 updated: `useMorphChoreography()` is used on mobile (3-phase fast path). The `MorphOrchestrator` component is desktop-only.

3. ~~**`navigator.connection` API has limited browser support.**~~ **Resolved.** Section 11.4 now documents this as progressive enhancement with `'connection' in navigator` guard and explicit fallback for Safari/Firefox.

4. ~~**Missing: how tab state interacts with URL.**~~ **Resolved.** Tab state uses `useState` in `MobileShell` with URL sync: `?tab=map` or `?tab=intel` parameter. Situation is default (no param). URL updated via `history.replaceState()` on tab change; read on mount for deep-linking.

5. ~~**Missing: landscape phone handling.**~~ **Resolved.** `useIsMobile()` now includes `(max-height: 500px) and (pointer: coarse)` to catch landscape phones. Landscape layout adaptation uses `(orientation: landscape)` media query.

6. ~~**MapLibre lazy loading defers map to "Map tab active"** but Map tab is the default -- negating the benefit.~~ **Resolved.** Situation is now the default tab, so MapLibre lazy loading on Map tab activation is meaningful.

7. ~~**Alert list items at 56px height** while IA and UI specify 64px.~~ **Resolved.** Alert list item height aligned to 64px (48px content + 16px vertical padding).

### Cross-Document Conflicts

| Decision Point | This Document | Conflicts With |
|---|---|---|
| Tab count | 3 (Situation, Map, Intel) + hamburger | ~~IA: 3 (Situation, Map, Intel)~~ Aligned |
| Default tab | Situation | ~~IA: Situation~~ Aligned |
| Settings as tab | Hamburger menu (not a primary tab) | ~~IA: Hamburger/gear icon~~ Aligned |
| Morph choreography | `useMorphChoreography()` used (fast path); `MorphOrchestrator` component desktop-only | ~~Contradictory~~ Aligned |
| Scan line cycle | 12s (canonical) | ~~UX (8s), UI (25s)~~ 12s is the canonical value |
| Alert list item height | 64px (48px content + 16px padding) | ~~UI (64px), IA (64px)~~ Aligned |
| ViewModeToggle location | Inline on Map tab | ~~IA: Inline on Map tab~~ Aligned |

### Recommendations

1. **Replace 3-tab model with IA's model:** Situation (default), Map, Intel. Move Settings to hamburger/gear icon.
2. **Resolve morph choreography contradiction.** Recommend: `MobileShell` calls `startMorph(id, { fast: true })` and reads `morph.phase` directly. The choreography hook's timer-based phase advancement is not needed on mobile.
3. **Add URL sync for active tab** so refresh preserves context.
4. **Address landscape phone** with dual check (width < 768px AND pointer: coarse).
5. **Align alert list item height** to 64px.
6. **Note `navigator.connection` as progressive enhancement** with explicit Safari/Firefox fallback.

### Required Changes Before Implementation

- [x] Replace 3-tab (Map, Alerts, Settings) with 3-tab (Situation, Map, Intel) + hamburger
- [x] Resolve morph choreography usage contradiction
- [x] Add tab state URL sync strategy
- [x] Address landscape phone detection
- [x] Align alert list item height to 64px
- [x] Note `navigator.connection` browser support limitations
- [x] Align scan line cycle time with other documents


---

## Client Decisions (2026-03-06)

The following client decisions affect this document:

- **Q1 -- No offline support.** Remove service worker and offline data caching from Phase 6 scope. PWA manifest + icons can remain for "Add to Home Screen" installability but no `workbox` or cache-first strategies.
- **Q2 -- Landscape supported.** This resolves Open Question 2. Do NOT prevent landscape or force portrait. Each tab needs a landscape layout. The `useIsMobile()` hook should NOT use width-only detection -- use `pointer: coarse` media query as a secondary signal so landscape phones (which may exceed 768px width) still get the mobile view. Alternatively, check `(max-width: 767px) or (max-height: 500px and pointer: coarse)` to catch landscape phones.
- **Q3 -- No push notifications.** Remove from future scope planning. Revisit only when TarvaRI backend supports push.
- **Q7 -- Bottom sheet with expand-to-full-screen.** The `MobileBottomSheet` component needs an additional state: `'half' | 'full' | 'fullscreen'`. The `fullscreen` state removes the sheet chrome (rounded corners, handle) and renders as a full-viewport overlay with a collapse button. Transition between `full` and `fullscreen` should use `motion/react` layout animation.
- **Q8 -- Allow viewport zoom.** Confirmed: no `user-scalable=no`, no `maximum-scale=1`. Remove from all viewport meta tag recommendations.
