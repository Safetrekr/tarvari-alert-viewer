# TarvaRI Alert Viewer -- Mobile UI Design System

**Version:** 1.0
**Date:** 2026-03-06
**Status:** Draft
**Aesthetic baseline:** Oblivion (2013) -- dark cinematic, glassmorphism, ambient intelligence

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Responsive Detection Strategy](#2-responsive-detection-strategy)
3. [Design Tokens -- Mobile Adaptations](#3-design-tokens--mobile-adaptations)
4. [Typography System](#4-typography-system)
5. [Touch Target Specification](#5-touch-target-specification)
6. [Glassmorphism on Mobile](#6-glassmorphism-on-mobile)
7. [Ambient Effects Budget](#7-ambient-effects-budget)
8. [Component Inventory](#8-component-inventory)
9. [Mobile Layout Architecture](#9-mobile-layout-architecture)
10. [Map Interactions](#10-map-interactions)
11. [Bottom Sheet and Drawer Patterns](#11-bottom-sheet-and-drawer-patterns)
12. [Card Layouts at Mobile Widths](#12-card-layouts-at-mobile-widths)
13. [Color and Contrast -- OLED Considerations](#13-color-and-contrast--oled-considerations)
14. [Animation Performance Budget](#14-animation-performance-budget)
15. [CSS and Tailwind Patterns](#15-css-and-tailwind-patterns)
16. [Accessibility](#16-accessibility)
17. [Implementation Phases](#17-implementation-phases)

---

## 1. Design Philosophy

The desktop TarvaRI Alert Viewer is a spatial Zoomable User Interface (ZUI) -- a world-space canvas that users pan and zoom through with a mouse. This paradigm does not translate directly to mobile. A phone user holds the device in one hand, navigates with a thumb, and expects vertically scrolling content with clear affordances.

The mobile version is not a scaled-down desktop. It is a **re-orchestrated experience** that preserves the cinematic Oblivion aesthetic while respecting the physics of thumb-driven interaction.

### Guiding Principles

1. **Same visual DNA, different choreography.** The dark void background, glassmorphism cards, corner brackets, monospace typography, severity color language, and ambient glow effects remain. The spatial ZUI engine, camera system, and two-dimensional world-space canvas are replaced by a vertical scrolling shell with bottom-sheet overlays and full-screen transitions.

2. **Cinematic framing over spatial freedom.** On desktop, users are explorers navigating a spatial world. On mobile, the interface frames content cinematically -- each view is a deliberate composition, not a viewport into infinite space. Transitions between views use the same morph easing curves (`--ease-morph: cubic-bezier(0.22, 1, 0.36, 1)`) to maintain the sense of a living system.

3. **Ambient presence, not ambient computation.** Mobile GPUs have lower thermal headroom. Ambient effects are simplified but never removed entirely. A single scan line, a subtle breathing glow on status indicators, and the severity-colored ping rings on map markers are retained. Heavy effects (dot grid pulse, range rings, radar sweep, sector grid, edge fragments) are either dropped or replaced with static hints.

4. **Touch-first, not touch-adapted.** Every interactive element is designed for 44px WCAG-minimum touch targets (48px design target) from the start. The 9-column category grid becomes a 2-column card layout. Hover states become press states. The hover overlay on `CategoryCard` becomes a long-press radial menu or a direct tap action.

5. **Performance is part of the aesthetic.** A 60fps interface feels cinematic. A janky one does not. Every animation, blur, and glow must hit the 16ms frame budget on a mid-range Android device (Snapdragon 7xx class, circa 2024).

---

## 2. Responsive Detection Strategy

### Breakpoint Definition

Mobile is defined as viewport width below 768px. This is detected with a CSS media query and a React hook, not a user-agent string.

```
Mobile:   < 768px    (phones in portrait and landscape)
Tablet:   768-1024px (future scope, not covered in v1)
Desktop:  > 1024px   (current spatial ZUI)
```

### Implementation Approach

A `useIsMobile()` hook wraps `matchMedia('(max-width: 767px)')` and returns `boolean | null` (`null` during SSR/hydration before `matchMedia` is available). The main `(launch)/page.tsx` uses this to render one of two layouts:

- **Desktop:** Existing `SpatialViewport` + `SpatialCanvas` + world-space positioning.
- **Mobile:** A new `MobileShell` component that renders a vertical scrolling layout with shared data hooks (`useCoverageMetrics`, `useCoverageMapData`, `useThreatPicture`, etc.).

Shared between both layouts:
- All data hooks (TanStack Query)
- All Zustand stores (`coverage.store.ts`, `ui.store.ts`)
- Component primitives (`CategoryCard`, `MapPopup`, `PriorityBadge`, `ConfidenceIndicator`)
- All design tokens (CSS custom properties)
- All type definitions

Exclusive to desktop:
- `SpatialViewport`, `SpatialCanvas`, `SpatialBreadcrumb`
- `DotGrid`, `SectorGrid`, `EdgeFragments`, `DeepZoomDetails`
- `RangeRings`, `CoordinateOverlays`, `MicroChronometer`
- `Minimap`, `ZoomIndicator`, `ZoomGate`
- `MorphOrchestrator` component (visual animation), `CategoryIconGrid`
- Camera physics, pan pause, semantic zoom
- Note: The morph **state machine** (`ui.store.ts`) is shared; mobile uses the 3-phase fast path via `startMorph(id, { fast: true })`

Exclusive to mobile:
- `MobileShell` (vertical scroll container)
- `MobileBottomSheet` (alert detail, district view, geo summary)
- `MobileCategoryGrid` (2-column touch-optimized layout)
- `MobileMapView` (full-width map with touch gesture controls)
- `MobileHeader` (compact status bar with priority indicator)
- `MobileNavBar` (bottom tab navigation)

### Tailwind Breakpoint Usage

```css
/* Mobile-first: base styles apply to mobile */
/* Desktop overrides use md: or lg: prefixes */
.category-card {
  /* mobile layout */
  @apply w-full;
}

@media (min-width: 768px) {
  /* desktop retains existing world-space positioning */
}
```

---

## 3. Design Tokens -- Mobile Adaptations

The existing design tokens from `spatial-tokens.css` and `coverage.css` are fully shared. Mobile adds overrides for a narrow set of values related to spacing, blur intensity, and animation timing.

### New Mobile Token Layer

Add to `src/styles/mobile-tokens.css`, imported after `spatial-tokens.css` inside a media query:

```css
@media (max-width: 767px) {
  :root {
    /* Spacing: tighter for small screens */
    --space-card-padding: 14px;
    --space-card-gap: 10px;
    --space-section-gap: 16px;
    --space-header-height: 48px;
    --space-bottom-nav-height: 56px;
    --space-bottom-sheet-handle: 24px;
    --space-safe-area-bottom: env(safe-area-inset-bottom, 0px);

    /* Glass: reduce blur radius for GPU savings */
    --blur-ambient: 6px;
    --blur-standard: 8px;
    --blur-active: 12px;
    --blur-heavy: 16px;

    /* Animation: slightly faster transitions feel snappier on mobile */
    --duration-hover: 150ms;
    --duration-transition: 250ms;
    --duration-morph: 400ms;
    --duration-morph-complex: 600ms;

    /* Touch target: 44px WCAG minimum, 48px design target */
    --touch-target-min: 44px;
    --touch-target-comfortable: 48px;

    /* Corner bracket sizing (smaller on mobile) */
    --corner-bracket-size: 10px;
    --corner-bracket-offset: -4px;
    --corner-bracket-thickness: 1px;
  }
}
```

### Token Mapping Summary

| Token | Desktop | Mobile | Rationale |
|-------|---------|--------|-----------|
| `--blur-standard` | 12px | 8px | GPU savings; visually indistinguishable at phone viewing distance |
| `--blur-heavy` | 24px | 16px | Heavy blur causes frame drops on mid-range Android |
| `--duration-morph` | 600ms | 400ms | Shorter transitions feel more responsive on touch |
| `--space-capsule-padding` | 20px | 14px | Preserve content density without cramping |
| `--space-capsule-gap` | 48px | 10px | Tight gap for 2-column card grid |

---

## 4. Typography System

### Font Stack (Shared)

```css
--font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
--font-sans: 'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Monospace typography is central to the Oblivion aesthetic. On mobile, the smallest monospace sizes used on desktop (7px, 8px, 9px) become unreadable. The mobile type scale enforces a **10px floor** for any text that must be read (not purely decorative).

### Mobile Type Scale

| Role | Desktop Size | Mobile Size | Font | Weight | Tracking |
|------|-------------|-------------|------|--------|----------|
| **Hero metric** (big number in ThreatPictureCard) | 24px | 28px | Mono | 700 | -0.02em |
| **Card metric** (alert count in CategoryCard) | 24px (text-2xl) | 22px | Mono | 700 | 0 |
| **Section heading** | 18px | 16px | Mono | 500 | 0.08em |
| **Card title** (category display name) | 11px | 12px | Sans | 600 | 0.06em |
| **Body text** (summary, description) | 11px | 13px | Mono | 400 | 0.02em |
| **Label** (SOURCES, ALERTS, section headers) | 9-10px | 11px | Mono | 500 | 0.12em |
| **Caption / timestamp** | 9px | 10px | Mono | 400 | 0.04em |
| **Ghost text** (decorative labels) | 9px | 10px | Mono | 500 | 0.12em |
| **Decorative micro** (calibration marks, etc.) | 7-8px | Omit or 9px | Mono | 400 | 0.08em |

### Readability Rules

1. **Minimum readable size:** 10px for monospace, 11px for sans-serif. Anything smaller is decorative only and carries `aria-hidden="true"`.
2. **Line height:** 1.5 for body text, 1.3 for labels, 1.0 for single-line metrics.
3. **Letter spacing:** Increase tracking by ~0.02em on mobile versus desktop for uppercase monospace labels to prevent character collision at small sizes.
4. **Truncation:** Use `text-overflow: ellipsis` with `overflow: hidden` and `white-space: nowrap` for alert titles and descriptions. Provide full text in the detail sheet.
5. **Dynamic type:** Respect iOS Dynamic Type and Android font scale settings. Test at 200% system font size. The layout must not break; cards may grow vertically.

---

## 5. Touch Target Specification

Every interactive element must have a minimum touch area of **44 x 44 dp** (CSS px on web) for WCAG 2.2 Level AA compliance (Success Criterion 2.5.8). The design target is **48 x 48 dp** where space permits. The visual affordance may be smaller than 44px, but the tappable area must not be.

### Touch Target Implementation Pattern

```css
/* Visual element is 32px, touch area is 48px */
.touch-target-expanded {
  position: relative;
  min-width: 32px;
  min-height: 32px;
}
.touch-target-expanded::before {
  content: '';
  position: absolute;
  inset: -8px; /* expands 32px visual to 48px touch */
  /* transparent -- purely for hit area */
}
```

### Component Touch Target Audit

| Element | Desktop Size | Mobile Touch Area | Strategy |
|---------|-------------|-------------------|----------|
| CategoryCard | ~160x140px | Full card tappable | Already large enough |
| Map marker dot | 6-8px circle | 48x48px | Invisible expanded hit area on MapLibre layer |
| MapPopup INSPECT button | 24px tall | 48px tall, full width | Increase padding |
| PriorityFeedStrip | 40px tall | 48px tall | Increase height |
| ViewModeToggle segments | ~80x28px | 48px tall minimum | Increase segment height |
| TimeRangeSelector pills | ~60x24px | 48px tall minimum | Increase pill height |
| Filter button (CategoryCard overlay) | ~36px tall | 48px tall | Increase padding |
| Back button (district view) | ~28x28px | 48x48px | Padding expansion |
| Close (X) button (panels) | ~24x24px | 48x48px | Padding expansion |
| Bottom sheet handle | N/A (new) | 48px tall drag area | New component |
| Bottom nav tab | N/A (new) | 48x48px minimum | New component |

### Spacing Between Targets

Adjacent interactive elements must have at least **8px** of visual separation to prevent accidental taps. Where two buttons are side by side (e.g., ViewModeToggle segments), they must have either 8px gap or distinct visual boundaries.

---

## 6. Glassmorphism on Mobile

The Oblivion glass aesthetic is the single most important visual differentiator. On mobile, `backdrop-filter: blur()` is expensive but supported on all modern browsers (Safari iOS 9+, Chrome Android 76+).

### Performance Tiers

**Tier 1 -- Always On (essential glass)**
These elements are always visible and define the aesthetic. Keep `backdrop-filter` with reduced blur radius.

- `MobileHeader`: `backdrop-filter: blur(8px) saturate(120%)` on `rgba(5, 9, 17, 0.85)`
- `MobileBottomSheet`: `backdrop-filter: blur(12px) saturate(130%)` on `rgba(255, 255, 255, 0.04)`
- `MobileNavBar`: `backdrop-filter: blur(8px) saturate(120%)` on `rgba(5, 9, 17, 0.90)`
- Map overlays (loading, empty): `backdrop-filter: blur(4px)` on dark rgba

**Tier 2 -- On Scroll Rest (glass when stationary)**
These elements disable `backdrop-filter` during fast scroll to maintain 60fps, re-enabling after scroll settles (200ms debounce).

- `CategoryCard`: `backdrop-filter: blur(8px) saturate(120%)` at rest, `backdrop-filter: none` during scroll
- `CoverageOverviewStats`: Same pattern

**Tier 3 -- Simplified (static opacity instead of blur)**
Elements where glass blur is visually imperceptible or not worth the GPU cost.

- `MapPopup` on mobile: Replace `backdrop-filter: blur(12px)` with solid `rgba(10, 14, 24, 0.95)` background -- popups are small and over a map; blur of the map beneath is not perceptible.
- Decorative panels (if any ambient panels are retained): Solid dark background only.

### Scroll-Gated Glass Implementation

```tsx
function useScrollGatedGlass(scrollRef: RefObject<HTMLElement>) {
  const [isScrolling, setIsScrolling] = useState(false)
  const timeoutRef = useRef<number>()

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      setIsScrolling(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false)
      }, 200)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [scrollRef])

  return isScrolling
}
```

```css
[data-scrolling='true'] .glass-tier-2 {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
```

### Corner Bracket Preservation

Corner brackets are a defining visual element. On mobile, they are reduced in size but retained on:

- The map container (all four corners)
- The bottom sheet header area (top two corners)
- The threat posture card (all four corners)

Mobile corner bracket spec:
```
size: 10px (desktop: 14px)
offset: -4px (desktop: -6px)
thickness: 1px (desktop: 1.5px)
color: rgba(255, 255, 255, 0.15) (same)
```

---

## 7. Ambient Effects Budget

### Effect Audit: Keep, Simplify, or Drop

| Effect | Desktop Implementation | Mobile Decision | Rationale |
|--------|----------------------|-----------------|-----------|
| **HorizonScanLine** | CSS translateY sweep across viewport | **Keep (simplified)** | Signature Oblivion effect. 12s cycle time. Reduce opacity to 0.03 (from 0.05). Single line, no box-shadow glow. |
| **SessionTimecode** | Fixed-position running clock with REC dot | **Keep** | Tiny, no GPU cost. Reposition to mobile header. |
| **CalibrationMarks** | Corner tick marks on viewport | **Drop** | Redundant with corner brackets on cards. Adds no value on small screen. |
| **TopTelemetryBar** | Fixed top strip with data readouts | **Drop** | Replaced by MobileHeader with condensed info. |
| **BottomStatusStrip** | Fixed bottom data strip | **Drop** | Replaced by MobileNavBar. |
| **DotGrid** | 20000x20000px particle grid with radial pulse | **Drop** | Massive; only visible in ZUI spatial canvas. |
| **SectorGrid** | Faint 2000px grid with sector labels | **Drop** | Spatial ZUI only. |
| **HaloGlow** | 8s breathing radial glow at world origin | **Drop** | Only visible in zoomed-out spatial view. |
| **RangeRings** | Concentric circles at world origin | **Drop** | Spatial ZUI only. |
| **CoordinateOverlays** | Lat/lon grid lines in world space | **Drop** | Spatial ZUI only. |
| **MicroChronometer** | SVG circular timer at world origin | **Drop** | Spatial ZUI only. |
| **SignalPulseMonitor** | Ambient oscilloscope display | **Drop** | Decorative; no value on mobile. |
| **FeedPanel** | Scrolling intel feed in world space | **Adapt** | Becomes part of the Intel tab in MobileNavBar. |
| **ActivityTicker** | Slow-scrolling ambient text ticker | **Drop** | Decorative; no value on mobile. |
| **SystemStatusPanel** | System health indicators | **Drop** | Data available via settings or pull-to-refresh. |
| **EdgeFragments** | Decorative edge circuit graphics | **Drop** | Spatial ZUI only. |
| **DeepZoomDetails** | Discovery details at deep zoom | **Drop** | No deep zoom on mobile. |
| **Map marker ping rings** | rAF-driven expanding circles on new alerts | **Keep** | Core informational animation. Runs on MapLibre GL (GPU-accelerated). |
| **Map marker breathing glow** | rAF-driven opacity cycle on new alerts | **Keep** | Subtle, GPU-accelerated via MapLibre paint properties. |
| **P1 priority glow** | Achromatic halo behind P1 markers | **Keep** | Important for P1 visibility. GPU-accelerated. |
| **Priority feed pulse** | 2.5s CSS opacity pulse on P1 active state | **Keep** | Single CSS animation, negligible cost. |
| **ThreatPulseBackground** | N/A (new for mobile) | **Add** | CSS radial gradient keyed to posture level. 4s cycle at ELEVATED, 6s at HIGH, off at LOW. Counts as 1 CSS `@keyframes`. Low-cost: single gradient opacity animation on a full-viewport div behind all content. |
| **Card hover glow** | box-shadow glow on hover | **Adapt** | Becomes press-state glow (`:active`), same glow values. |
| **District ambient stagger** | 400ms stagger entrance for dock elements | **Keep (simplified)** | Reduces stagger to 3 elements max (from 6). |

### Mobile Animation Budget

Total concurrent CSS animations allowed: **4 maximum**
Total concurrent rAF loops: **1** (map marker animation only)
Maximum `backdrop-filter` elements visible simultaneously: **3**
Maximum `box-shadow` glow elements visible simultaneously: **6**

---

## 8. Component Inventory

### Shared Components (Reused from Desktop)

These components render identically or with minor prop-driven adjustments on mobile.

| Component | Adaptations for Mobile |
|-----------|----------------------|
| `CategoryCard` | Remove hover overlay. Tap goes directly to district view. Long-press shows filter option. Increase padding for touch targets. See Section 12. |
| `MapPopup` | Increase padding and font sizes. Replace `backdrop-filter` with solid background. Increase INSPECT button height to 48px. |
| `PriorityBadge` | No changes needed. Already size-variant (`sm`, `md`, `lg`). |
| `ConfidenceIndicator` | No changes needed. |
| `CoverageMap` | Remove `MapNavControls` (replaced by native touch gestures). Remove corner bracket decorations (applied by parent). See Section 10. |
| `MapMarkerLayer` | No changes. All animations are MapLibre GPU-driven paint properties. |
| `ViewModeToggle` | Increase segment height to 48px. Increase font to 11px. |
| `TimeRangeSelector` | Increase pill height to 40px. Consider collapsing into a dropdown. |

### New Mobile-Only Components

| Component | Purpose |
|-----------|---------|
| `MobileShell` | Root layout for mobile. Manages scroll container, header, bottom nav, and active bottom sheet. |
| `MobileHeader` | 48px fixed header. Shows: Tarva logo (left), session timecode (center), priority indicator dot (right). Glassmorphism background. |
| `MobileNavBar` | 56px fixed bottom nav with `env(safe-area-inset-bottom)` padding. 3 ghost tabs: Situation (default), Map, Intel + hamburger icon for settings. Glass background with top border glow. |
| `MobileBottomSheet` | Spring-physics bottom sheet for alert detail, district view, triage rationale, and geo summary. See Section 11. |
| `MobileCategoryGrid` | 2-column CSS grid of CategoryCards with 10px gap. Vertically scrollable. |
| `MobileThreatBanner` | Condensed threat posture banner at top of Grid tab. Shows posture level, trend, P1/P2 counts. Tappable to open geo summary sheet. |
| `MobileAlertDetail` | Full-screen bottom sheet content for alert inspection. Replaces `AlertDetailPanel` sidebar. |
| `MobileDistrictView` | Full-screen view replacing `DistrictViewOverlay`. Map top half, alert list bottom half, with alert detail as a nested bottom sheet. |

### Dropped Components (Desktop Only)

| Component | Reason |
|-----------|--------|
| `SpatialViewport` | ZUI engine not used on mobile |
| `SpatialCanvas` | World-space canvas not used on mobile |
| `Minimap` | No spatial canvas to miniaturize |
| `ZoomIndicator` | No zoom levels on mobile |
| `SpatialBreadcrumb` | No spatial navigation on mobile |
| `CommandPalette` | Replaced by native search in header |
| `NavigationHUD` | Replaced by MobileHeader + MobileNavBar |
| `MorphOrchestrator` | Component not loaded on mobile. The morph **state machine** (in `ui.store.ts`) is still used via `startMorph(id, { fast: true })` for 3-phase fast-path transitions, but the `MorphOrchestrator` **React component** (visual animation) is desktop-only. |
| `CategoryIconGrid` | Z0 semantic zoom not applicable |
| `DotGrid`, `SectorGrid`, etc. | Spatial ZUI decorations |
| `MapLedger` | Data shown inline in Grid tab |

---

## 9. Mobile Layout Architecture

### Screen Structure

```
+------------------------------------------+
|  MobileHeader (48px, fixed top, z-40)    |
|  [Logo]     [Timecode]     [P1 dot]     |
+------------------------------------------+
|                                          |
|  Scrollable Content Area                 |
|  (varies by active tab)                  |
|                                          |
|  Tab: Situation -> ThreatBanner + Grid   |
|  Tab: Map       -> Full-bleed map        |
|  Tab: Intel     -> Priority alerts +     |
|                    geo summary cards      |
|                                          |
+------------------------------------------+
|  MobileNavBar (56px + safe area, z-40)   |
|  [Situation] [Map] [Intel] [≡ Settings] |
+------------------------------------------+
```

### Tab Views

**Situation Tab (default)**
- `MobileThreatBanner` at top (threat posture, P1/P2 counts)
- `PriorityFeedStrip` below banner (tappable to expand priority feed sheet)
- `MobileCategoryGrid`: 2-column grid of `CategoryCard` components
- Each card tap opens `MobileDistrictView` via full-screen slide-up transition
- `CoverageOverviewStats` rendered as a horizontal stat bar between banner and grid

**Map Tab**
- Full-bleed `CoverageMap` stretching from header to nav bar
- `ViewModeToggle` overlaid at top of map (floating, glass background)
- Tapping a marker opens `MapPopup`; tapping INSPECT opens `MobileAlertDetail` bottom sheet
- Filter chips scroll horizontally below the map if category filters are active

**Intel Tab**
- Vertical scrolling list of priority alerts (P1 and P2)
- Each item shows: severity dot, title, category tag, relative time
- Tap opens `MobileAlertDetail` bottom sheet
- Pull-to-refresh triggers data refetch
- Geo summary content from `GeoSummaryPanel`, reformatted as cards below the priority list
- Threat level per region, trend arrows, key events
- Tap a region card to see detail

### Z-Index Stacking

```
z-50: Bottom sheet (when open, above everything)
z-45: Triage rationale sheet (nested above alert detail)
z-40: MobileHeader + MobileNavBar (persistent chrome)
z-30: MobileDistrictView (full-screen overlay)
z-20: Floating map controls (ViewModeToggle, filter chips)
z-10: Map loading/empty overlay
z-0:  Content area
```

---

## 10. Map Interactions

### Touch Gesture Handling

MapLibre GL JS natively supports multi-touch gestures. On mobile, the custom `MapNavControls` (directional pad + zoom buttons) are **removed** and replaced with native gestures:

| Gesture | Action |
|---------|--------|
| Single finger drag | Pan map |
| Pinch | Zoom in/out |
| Double tap | Zoom in one level |
| Two-finger tap | Zoom out one level |
| Single tap on marker | Show `MapPopup` |
| Single tap on cluster | Expand cluster (zoom to cluster bounds) |
| Long press on empty area | (Reserved for future: drop pin, measure distance) |

### MapPopup Mobile Adaptation

The popup is triggered by tap (not hover). On mobile, the popup:

1. Appears anchored to the marker with a bottom anchor
2. Has **increased padding** (12px 14px instead of 8px 10px)
3. Has **increased font sizes** (title 12px, severity 10px, timestamp 10px)
4. INSPECT button is **48px tall**, full width, with clear tap affordance
5. Background is **solid** `rgba(10, 14, 24, 0.95)` (no backdrop-filter)
6. Close action: tap anywhere outside the popup, or swipe down

### Map Container Styling

The map fills the entire viewport between header and nav bar in the Map tab. Corner brackets are applied to the outer container (not the map itself) at the mobile-reduced size (10px, 1px thickness).

```css
.mobile-map-container {
  position: relative;
  width: 100%;
  height: calc(100vh - var(--space-header-height) - var(--space-bottom-nav-height) - var(--space-safe-area-bottom));
  /* Corner brackets via ::before and ::after pseudo-elements */
}
```

The CARTO dark tile style remains unchanged. Raster paint properties (`raster-brightness-max: 0.45`, `raster-saturation: -0.3`, `raster-hue-rotate: 200`) are identical.

### Map in District View

When viewing a category district on mobile, the map occupies the **top 45%** of the screen. The alert list occupies the **bottom 55%** as a draggable area. This ratio adjusts:

- Map expands to 65% when the alert list is collapsed (user drags list down)
- Map shrinks to 30% when an alert is selected (detail view pushes up)

The transition uses `motion/react` `layout` animations with the morph easing curve.

---

## 11. Bottom Sheet and Drawer Patterns

Bottom sheets are the primary overlay pattern on mobile, replacing the desktop's side panels (`DistrictViewDock`, `TriageRationalePanel`, `GeoSummaryPanel`, `AlertDetailPanel`, `PriorityFeedPanel`).

### Sheet Anatomy

```
+------------------------------------------+
|  ===  Handle (drag indicator)  ===       |  24px
|------------------------------------------|
|  Header: Title + Close button            |  48px
|  [Corner brackets on top corners]        |
|------------------------------------------|
|                                          |
|  Scrollable content area                 |
|                                          |
|  (glassmorphism background               |
|   with category tint gradient)           |
|                                          |
+------------------------------------------+
```

### Handle Design

The drag handle follows the Oblivion aesthetic -- not a rounded gray bar, but a thin luminous line with a subtle glow:

```css
.sheet-handle {
  width: 40px;
  height: 2px;
  margin: 11px auto;
  background: rgba(255, 255, 255, 0.20);
  border-radius: 1px;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.06);
}
```

### Sheet Snap Points

Bottom sheet snap points are context-specific, implemented with spring physics via `motion/react`. Each sheet type defines its own set of snap positions:

| Sheet Context | Snap Points | Notes |
|---------------|-------------|-------|
| **Alert Detail** | 70%, 100% | 70% shows summary; 100% for full detail with metadata and timeline |
| **Category Detail** | 35%, 65%, 100% | 35% peek shows category name + count; 65% shows alert list; 100% full district view |
| **Priority Feed** | 60%, 100% | 60% shows top P1/P2 alerts; 100% for full scrollable feed |
| **Filter / Time Range** | 40% | Single snap; lightweight overlay for filter controls |

Spring configuration:
```ts
const SHEET_SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}
```

### Sheet Glassmorphism

Bottom sheets use the heaviest glass treatment on mobile because they are the most prominent overlay:

```css
.mobile-bottom-sheet {
  background: rgba(5, 9, 17, 0.92);
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px 16px 0 0;
  box-shadow:
    0 -4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```

### Category Tint Gradient

When a bottom sheet is contextual to a category (district view, category detail), apply the same tint gradient from `district-view-overlay.tsx`:

```css
.sheet-category-tint {
  background:
    radial-gradient(
      ellipse at 50% 0%,
      var(--sheet-category-tint, rgba(255, 255, 255, 0.03)) 0%,
      transparent 60%
    );
}
```

The tint color is computed the same way as `getCategoryTint()` -- extracting the hex from the category color and applying 5% opacity.

### Sheet Types

| Sheet | Replaces Desktop | Snap Points | Content |
|-------|-----------------|-------------|---------|
| **Alert Detail** | `AlertDetailPanel` + `DistrictViewDock` alert view | 70%, 100% | Severity badge, title, summary, metadata, timestamps |
| **Category Detail** | `DistrictViewOverlay` | 35%, 65%, 100% | Category name + count (35%), alert list (65%), full district view (100%) |
| **Triage Rationale** | `TriageRationalePanel` | 70%, 100% | Decision verdict, rationale, confidence, timeline |
| **Geo Summary** | `GeoSummaryPanel` | 70%, 100% | Threat levels by region, key events, trend data |
| **Priority Feed** | `PriorityFeedPanel` | 60%, 100% | Scrolling P1/P2 alert list |
| **Filter / Time Range** | `DistrictFilterPanel` | 40% | Source filter, geographic filter, severity filter, time range controls |

---

## 12. Card Layouts at Mobile Widths

### CategoryCard Mobile Layout

The desktop `CategoryCard` is ~160px wide in a 9-column grid. On mobile, the 2-column grid makes each card approximately `(viewport_width - 16px_padding - 10px_gap) / 2` wide, which is ~172px on a 375px screen.

**Changes from desktop:**

1. **Remove hover overlay.** The hover state with "View District" and "Show on Map" buttons does not work on touch. Instead:
   - **Tap** the card: opens the district view (full-screen slide-up)
   - **Long press** (500ms): shows a context menu with "Show on Map" filter toggle

2. **Increase minimum card height** to accommodate touch-friendly sizing:
   ```css
   .category-card-mobile {
     min-height: 120px;
     padding: 14px;
   }
   ```

3. **Icon size:** Keep at 24px (already good for mobile).

4. **Category name:** Increase from 11px to 12px.

5. **Alert count:** Keep at `text-2xl` (24px) but use Geist Mono for tabular numerals.

6. **Source count:** Increase from 10px to 11px.

7. **Priority badge:** Position unchanged (top-right corner). Badge size `md`.

8. **Trend arrow:** Keep at 14px. Position next to alert count.

9. **Left border accent:** Keep the 3px category-colored left border.

10. **Filter state glow:** Keep the `box-shadow` glow when filtered:
    ```css
    box-shadow: inset 0 0 12px ${meta.color}20, 0 0 8px ${meta.color}10;
    ```

### CategoryCard Mobile Active State

Replace hover glow with active (press) state:

```css
.category-card-mobile:active {
  transform: scale(0.97);
  transition: transform 100ms var(--ease-default);
}
```

The scale-down on press provides tactile feedback without expensive glow recalculation.

### ThreatPictureCard Mobile Layout

The desktop `ThreatPictureCard` is 320px wide with a 3-column internal layout. On mobile, it becomes a **full-width banner** with a stacked vertical layout:

```
+------------------------------------------+
| [Shield] THREAT POSTURE  [ELEVATED]  [^] |
| 142 ACTIVE  |  P1: 3  |  P2: 12        |
|------------------------------------------|
| Top Threats          | Top Regions       |
| Seismic ........ 45  | Mid East ..... 32 |
| Weather ........ 28  | E. Europe .... 18 |
| Conflict ....... 19  | S/C Asia ..... 14 |
+------------------------------------------+
```

Width: `100%` with `14px` horizontal padding.
Height: Auto (content-driven).
Intelligence Summaries row: Collapsed by default on mobile; shown on tap of "Full Briefing" footer.

### Alert List Items (Feed Tab, District Alert List)

Each alert in a scrolling list needs a consistent mobile treatment:

```
+------------------------------------------+
| [sev dot]  Alert Title (truncated)       |
|            CATEGORY    2h ago       [>]  |
+------------------------------------------+
```

- Height: minimum 64px (48px content + 16px vertical padding)
- Severity dot: 8px circle, left-aligned
- Title: 13px Mono, `color: rgba(255, 255, 255, 0.5)`, single line truncated
- Category: 10px Mono uppercase, category color, tracking 0.06em
- Timestamp: 10px Mono, `color: rgba(255, 255, 255, 0.2)`
- Chevron: 12px, `color: rgba(255, 255, 255, 0.15)`, right-aligned
- Separator: 1px line at `rgba(255, 255, 255, 0.04)` between items
- Touch area: Full width, full height of the row

---

## 13. Color and Contrast -- OLED Considerations

### OLED-Optimized Background

The base background `--color-void: #050911` is nearly true black. On OLED screens, this is ideal -- pixels are physically off, saving battery and providing infinite contrast ratio. However, the slight blue tint (`rgb(5, 9, 17)`) prevents the "black smear" artifact common on OLED panels during scrolling.

**Decision:** Keep `#050911` as-is. Do not change to pure `#000000`.

### Text Contrast Ratios

All text must meet WCAG 2.2 AA minimum contrast against the void background:

| Text Level | Color | Opacity | Hex Equivalent | Contrast vs #050911 | Meets AA? |
|-----------|-------|---------|---------------|---------------------|-----------|
| Primary | `--color-text-primary` | 1.0 | `#def6ff` | 17.2:1 | Yes (AAA) |
| Secondary | `--color-text-secondary` | 1.0 | `#92a9b4` | 7.1:1 | Yes (AA) |
| Tertiary | `--color-text-tertiary` | 1.0 | `#55667a` | 3.2:1 | No -- use only for decorative |
| Ghost | `--color-text-ghost` | 1.0 | `#33445a` | 1.8:1 | No -- decorative only |

**Mobile adjustment:** Any text that conveys information (not purely decorative) must use `--color-text-secondary` or brighter. The desktop uses `rgba(255, 255, 255, 0.25)` frequently for secondary data -- on mobile, raise this to `rgba(255, 255, 255, 0.40)` minimum for readability in outdoor lighting conditions.

### Severity Color Contrast

Severity colors are used as badge backgrounds, dot fills, and text colors. On mobile, they appear smaller and must be verifiable against the dark background.

| Severity | Color Token | Hex | Contrast vs #050911 | Mobile Adjustment |
|----------|------------|-----|---------------------|-------------------|
| Extreme | `--severity-extreme` | `#ef4444` | 4.6:1 | Passes AA. No change. |
| Severe | `--severity-severe` | `#f97316` | 5.3:1 | Passes AA. No change. |
| Moderate | `--severity-moderate` | `#eab308` | 6.8:1 | Passes AA. No change. |
| Minor | `--severity-minor` | `#3b82f6` | 4.0:1 | Borderline. Increase to `#60a5fa` on mobile for 5.2:1. |
| Unknown | `--severity-unknown` | `#6b7280` | 3.5:1 | Below AA. Increase to `#9ca3af` for text usage. |

### Category Color Adjustments

Most category colors pass AA contrast against the void background. Two exceptions:

| Category | Hex | Contrast | Mobile Fix |
|----------|-----|----------|-----------|
| Multi-Hazard | `#6b7280` | 3.5:1 | Use `#9ca3af` for text; keep original for dots and borders |
| Other | `#9ca3af` | 5.8:1 | Passes. No change. |

### OLED-Specific Guidelines

1. **Avoid large pure-white areas.** White text on OLED is high-power. The design already uses dim whites (`rgba(255, 255, 255, 0.3-0.6)`) which is ideal.
2. **Glow effects benefit OLED.** The soft glows (`box-shadow` with colored rgba) look especially striking on OLED because they bloom from true black.
3. **Category accent colors pop on OLED.** The saturated category colors (`#ef4444`, `#3b82f6`, etc.) against the near-black background create the vivid cinematic look the client loves.
4. **Dark mode only.** The mobile view does not support the SafeTrekr light color scheme. The Oblivion aesthetic is inherently dark. If a light scheme is needed later, it is a separate design effort.

---

## 14. Animation Performance Budget

### Frame Budget

Target: **60fps** (16.67ms per frame) on a Snapdragon 7xx-class Android device and iPhone 12 or later.

### Animation Tiers (Mobile)

**Tier A -- CSS Transforms and Opacity (compositor-only, free)**
- Card press scale (`transform: scale(0.97)`)
- Bottom sheet slide (`transform: translateY(...)`)
- Tab switch crossfade (`opacity`)
- Scan line sweep (`transform: translateY(...)`)
- Priority feed pulse (`opacity`)
- District view slide-up (`transform: translateY(0)`)

**Tier B -- CSS Animations with Reflow Caution (use carefully)**
- Bottom sheet spring physics (via `motion/react`, which uses transforms)
- Card entrance stagger (opacity + translateY, 3 elements max)

**Tier C -- GPU-Painted (MapLibre, runs on GPU shader)**
- Marker ping rings (circle-radius + circle-stroke-opacity via `setPaintProperty`)
- Marker breathing glow (circle-opacity)
- P1 achromatic halo (circle-opacity)
- Cluster expansion animation

**Tier D -- AVOID on Mobile**
- `box-shadow` animation (causes paint on every frame)
- `filter: drop-shadow()` animation
- `backdrop-filter` changes during animation (extremely expensive)
- Any animation that triggers layout (width, height, padding, margin changes)

### motion/react Configuration for Mobile

```ts
// Reduced motion config for mobile
const MOBILE_TRANSITION_DEFAULTS = {
  type: 'tween' as const,
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1], // --ease-morph
}

// Spring config for bottom sheets only
const MOBILE_SHEET_SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}
```

### Reduced Motion Respect

All animations must respect `prefers-reduced-motion: reduce`. On mobile, this means:

1. All CSS animations get `animation: none !important`
2. All `motion/react` components use `duration: 0` (instant state change)
3. Bottom sheets snap without spring physics (instant translateY)
4. Map marker ping rings are disabled (static dot only)
5. Scan line is hidden

Implementation pattern:
```tsx
const prefersReducedMotion = usePrefersReducedMotion()

const transition = prefersReducedMotion
  ? { duration: 0 }
  : MOBILE_TRANSITION_DEFAULTS
```

### Concurrent Animation Limits

| Category | Max Concurrent | Enforced By |
|----------|---------------|-------------|
| CSS `@keyframes` | 4 | Developer discipline |
| `motion/react` layout animations | 2 | Component design |
| MapLibre rAF loop | 1 | Single `useMarkerAnimation` hook |
| `backdrop-filter` elements in view | 3 | Scroll-gated glass pattern |
| Total animated elements | 8 | Performance testing |

---

## 15. CSS and Tailwind Patterns

### Mobile-First Utility Classes

Define in `src/styles/mobile.css`, imported conditionally or via `@media`:

```css
/* Mobile shell layout */
.mobile-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh; /* dynamic viewport height for mobile browsers */
  overflow: hidden;
  background: var(--color-void);
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}

/* Prevent rubber-banding on iOS */
.mobile-shell {
  position: fixed;
  inset: 0;
}

/* Glass card (mobile variant) */
.glass-card-mobile {
  background: rgba(var(--ambient-ink-rgb), 0.05);
  backdrop-filter: blur(var(--blur-standard)) saturate(120%);
  -webkit-backdrop-filter: blur(var(--blur-standard)) saturate(120%);
  border: 1px solid rgba(var(--ambient-ink-rgb), 0.10);
  border-radius: 14px;
}

/* Corner brackets (mobile size) */
.corner-brackets {
  position: relative;
}
.corner-brackets::before,
.corner-brackets::after {
  content: '';
  position: absolute;
  width: var(--corner-bracket-size, 10px);
  height: var(--corner-bracket-size, 10px);
  pointer-events: none;
  z-index: 15;
}
.corner-brackets::before {
  top: var(--corner-bracket-offset, -4px);
  left: var(--corner-bracket-offset, -4px);
  border-top: var(--corner-bracket-thickness, 1px) solid rgba(255, 255, 255, 0.15);
  border-left: var(--corner-bracket-thickness, 1px) solid rgba(255, 255, 255, 0.15);
}
.corner-brackets::after {
  top: var(--corner-bracket-offset, -4px);
  right: var(--corner-bracket-offset, -4px);
  border-top: var(--corner-bracket-thickness, 1px) solid rgba(255, 255, 255, 0.15);
  border-right: var(--corner-bracket-thickness, 1px) solid rgba(255, 255, 255, 0.15);
}
/* Bottom corners need additional pseudo-elements via a wrapper or data-attributes */

/* Mobile header */
.mobile-header {
  height: var(--space-header-height);
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: rgba(5, 9, 17, 0.85);
  backdrop-filter: blur(var(--blur-standard)) saturate(120%);
  -webkit-backdrop-filter: blur(var(--blur-standard)) saturate(120%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
}

/* Mobile bottom nav */
.mobile-nav {
  height: calc(var(--space-bottom-nav-height) + var(--space-safe-area-bottom));
  padding-bottom: var(--space-safe-area-bottom);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(5, 9, 17, 0.90);
  backdrop-filter: blur(var(--blur-standard)) saturate(120%);
  -webkit-backdrop-filter: blur(var(--blur-standard)) saturate(120%);
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
}
/* 3 ghost tabs + hamburger settings icon */

/* Nav tab */
.mobile-nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 48px;
  min-height: 48px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  transition: color var(--duration-hover) var(--ease-default);
}
.mobile-nav-tab[data-active='true'] {
  color: rgba(255, 255, 255, 0.6);
}
.mobile-nav-tab[data-active='true'] .nav-icon {
  filter: drop-shadow(0 0 4px rgba(var(--ember-rgb), 0.3));
}

/* 2-column category grid */
.mobile-category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-card-gap);
  padding: 16px;
}

/* Scan line (mobile -- viewport-locked, reduced opacity) */
.mobile-scan-line {
  position: fixed;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.03) 20%,
    rgba(255, 255, 255, 0.03) 80%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 39;
  animation: enrichment-horizon-sweep-vp 12s linear infinite;
  animation-delay: 8s;
}

/* Separator line (shared pattern) */
.separator-line {
  height: 1px;
  background: rgba(255, 255, 255, 0.04);
  margin: 12px 0;
}

/* Ghost text label */
.ghost-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.15);
}
```

### Tailwind Utility Patterns

```html
<!-- Mobile glass card -->
<div class="rounded-xl border border-white/[0.10] bg-white/[0.05]
            backdrop-blur-[8px] backdrop-saturate-[120%]
            p-3.5">

<!-- Ghost label -->
<span class="font-mono text-[10px] font-medium uppercase tracking-widest
             text-white/15">

<!-- Touch-target button -->
<button class="min-h-[48px] min-w-[48px] flex items-center justify-center
               rounded-lg border border-white/[0.08] bg-white/[0.04]
               active:scale-[0.97] active:bg-white/[0.08]
               transition-transform duration-100">

<!-- Severity dot -->
<span class="inline-block h-2 w-2 shrink-0 rounded-full"
      style="background-color: var(--severity-extreme)">
```

### Safe Area Handling

```css
/* iOS notch and home indicator */
.mobile-shell {
  padding-top: env(safe-area-inset-top, 0px);
}
.mobile-nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.mobile-bottom-sheet {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### Dynamic Viewport Height

Use `100dvh` instead of `100vh` to account for mobile browser chrome (address bar, toolbar) that shrinks the viewport:

```css
.mobile-shell {
  height: 100dvh;
}
```

---

## 16. Accessibility

### Mobile-Specific Accessibility Requirements

1. **Touch target sizes:** All interactive elements meet the 44px WCAG minimum, with 48px design target where space permits (Section 5).

2. **Focus management for bottom sheets:** When a bottom sheet opens:
   - Move focus to the sheet's first interactive element (or the close button)
   - Trap focus within the sheet
   - On close, return focus to the triggering element
   - Announce sheet title via `aria-label` on the sheet's root `role="dialog"`

3. **Screen reader announcements:**
   - Priority feed state changes: Use `aria-live="polite"` region (already implemented in `PriorityFeedStrip`)
   - Map marker count changes: Use `aria-live="polite"` region (already implemented in `CoverageMap`)
   - Tab navigation: Each tab has `role="tab"` with `aria-selected`, content area has `role="tabpanel"`
   - Bottom sheet open/close: Announce via `aria-expanded` on trigger

4. **Reduced motion:** Full respect for `prefers-reduced-motion: reduce` (Section 14).

5. **Color not sole indicator:** Severity is communicated via both color AND text label. Priority uses shape AND text (diamond for P1, triangle for P2 per AD-1).

6. **Orientation support:** Layout must work in both portrait and landscape. In landscape on phone, the bottom sheet max height reduces to 80% of viewport to keep some content visible behind.

7. **Text scaling:** Layout must not break at 200% system font size. Cards may grow vertically. Horizontal truncation with `text-overflow: ellipsis` prevents horizontal overflow.

### Gesture Alternatives

Every gesture-driven interaction must have a button alternative:

| Gesture | Button Alternative |
|---------|-------------------|
| Swipe down to close sheet | Close (X) button in sheet header |
| Long press on CategoryCard | Three-dot menu icon (appears on card, always visible) |
| Pinch to zoom map | Floating +/- buttons (32px visual, 48px touch area) |
| Pull to refresh | Refresh button in header or tab bar |
| Swipe between tabs | Bottom nav bar tab buttons |

---

## 17. Implementation Phases

### Phase 1: Foundation (Week 1-2)

- [ ] Create `useIsMobile()` hook
- [ ] Create `MobileShell` layout component (fixed header + content + nav)
- [ ] Create `MobileHeader` component
- [ ] Create `MobileNavBar` component with 3-tab routing (Situation, Map, Intel) + hamburger settings
- [ ] Create `mobile-tokens.css` with mobile-specific overrides
- [ ] Create `mobile.css` with shell layout styles
- [ ] Wire up conditional rendering in `(launch)/page.tsx`: desktop vs mobile
- [ ] Verify all data hooks work in mobile layout (no spatial dependencies)

### Phase 2: Map Tab (Week 2-3)

- [ ] Create `MobileMapView` component (full-bleed CoverageMap)
- [ ] Adapt `MapPopup` for touch (increased sizes, solid background, 48px INSPECT button)
- [ ] Remove `MapNavControls` on mobile; verify native touch gestures work
- [ ] Add floating `ViewModeToggle` overlay on map
- [ ] Add floating zoom +/- buttons for gesture alternative
- [ ] Implement category filter chips (horizontal scroll, below map controls)
- [ ] Create `MobileAlertDetail` bottom sheet
- [ ] Wire INSPECT flow: marker tap -> popup -> INSPECT -> bottom sheet

### Phase 3: Situation Tab (Week 3-4)

- [ ] Create `MobileCategoryGrid` (2-column layout)
- [ ] Adapt `CategoryCard` for touch (remove hover overlay, add press state, long-press filter)
- [ ] Create `MobileThreatBanner` (condensed ThreatPictureCard)
- [ ] Adapt `PriorityFeedStrip` for mobile (48px height, full width)
- [ ] Adapt `CoverageOverviewStats` as horizontal stat bar
- [ ] Create `MobileDistrictView` (full-screen slide-up)
- [ ] Wire district view: card tap -> full-screen transition -> map + alert list

### Phase 4: Intel Tab (Week 4-5)

- [ ] Create Intel tab with priority alert list and geo summary cards
- [ ] Adapt `GeoSummaryPanel` content for card layout
- [ ] Implement pull-to-refresh on Intel tab
- [ ] Wire bottom sheet for triage rationale

### Phase 5: Polish and Ambient (Week 5-6)

- [ ] Implement scan line effect (mobile variant)
- [ ] Implement scroll-gated glass optimization
- [ ] Add corner brackets to key containers (map, bottom sheets, threat banner)
- [ ] Session timecode in mobile header
- [ ] P1 indicator dot animation in header
- [ ] Reduced motion testing
- [ ] OLED contrast audit
- [ ] Touch target audit (verify all 44px WCAG minimums, 48px design targets)
- [ ] Performance testing on mid-range Android device
- [ ] Accessibility testing with VoiceOver (iOS) and TalkBack (Android)

### Phase 6: Transitions and Choreography (Week 6-7)

- [ ] Tab switch animations (crossfade)
- [ ] District view entrance transition (slide up with morph easing)
- [ ] Bottom sheet spring physics tuning
- [ ] Alert detail entrance animation in bottom sheet
- [ ] Card press feedback animations
- [ ] Priority feed expansion animation
- [ ] Final 60fps performance validation

---

## Appendix A: Desktop-to-Mobile Component Mapping

| Desktop Component | Mobile Equivalent | Adaptation Type |
|-------------------|------------------|-----------------|
| `SpatialViewport` + `SpatialCanvas` | `MobileShell` | Replace |
| `MorphOrchestrator` component + `CategoryIconGrid` | `MobileCategoryGrid` (morph state machine retained via 3-phase fast path) | Replace component, keep state machine |
| `CategoryCard` | `CategoryCard` (shared, prop-adjusted) | Adapt |
| `CoverageMap` | `CoverageMap` (shared, no MapNavControls) | Adapt |
| `MapPopup` | `MapPopup` (shared, size-adjusted) | Adapt |
| `MapMarkerLayer` | `MapMarkerLayer` (shared, no changes) | Reuse |
| `CoverageOverviewStats` | Horizontal stat bar | Adapt |
| `ThreatPictureCard` | `MobileThreatBanner` | Replace |
| `PriorityFeedStrip` | `PriorityFeedStrip` (shared, height-adjusted) | Adapt |
| `PriorityFeedPanel` | Bottom sheet | Replace |
| `AlertDetailPanel` | `MobileAlertDetail` bottom sheet | Replace |
| `DistrictViewOverlay` | `MobileDistrictView` full-screen | Replace |
| `DistrictViewDock` | Bottom sheet content | Replace |
| `DistrictViewHeader` | `MobileDistrictView` header | Replace |
| `TriageRationalePanel` | Bottom sheet | Replace |
| `GeoSummaryPanel` | Briefing tab + bottom sheet | Replace |
| `NavigationHUD` | `MobileHeader` + `MobileNavBar` | Replace |
| `CommandPalette` | Search bar in header (future) | Replace |
| `HorizonScanLine` | `mobile-scan-line` (reduced) | Adapt |
| `SessionTimecode` | In `MobileHeader` | Adapt |
| `ViewModeToggle` | Floating overlay on map tab | Adapt |
| `TimeRangeSelector` | Dropdown in map tab (future) | Adapt |
| All enrichment/ambient components | Dropped | Drop |

## Appendix B: Token Quick Reference

```css
/* Core colors (shared, from spatial-tokens.css) */
--color-void: #050911;
--color-abyss: #0a0f18;
--color-deep: #0f161f;
--color-surface: #121720;
--color-text-primary: #def6ff;
--color-text-secondary: #92a9b4;
--color-ember: #e05200;
--color-teal: #277389;

/* Severity (from coverage.ts) */
--severity-extreme: #ef4444;
--severity-severe: #f97316;
--severity-moderate: #eab308;
--severity-minor: #3b82f6;     /* Mobile override: #60a5fa */
--severity-unknown: #6b7280;

/* Glass recipe (mobile) */
background: rgba(var(--ambient-ink-rgb), 0.05);
backdrop-filter: blur(var(--blur-standard)) saturate(120%);
border: 1px solid rgba(var(--ambient-ink-rgb), 0.10);

/* Corner bracket recipe (mobile) */
size: 10px;
offset: -4px;
thickness: 1px;
color: rgba(255, 255, 255, 0.15);

/* Easing curves (shared) */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-morph: cubic-bezier(0.22, 1, 0.36, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Touch target: 44px WCAG minimum, 48px design target */
--touch-target-min: 44px;
--touch-target-comfortable: 48px;
```

## Appendix C: File Structure

```
src/
  components/
    mobile/
      MobileShell.tsx           # Root mobile layout
      MobileHeader.tsx          # Fixed top header
      MobileNavBar.tsx          # Fixed bottom tab nav
      MobileBottomSheet.tsx     # Reusable spring-physics sheet
      MobileCategoryGrid.tsx    # 2-column card grid
      MobileThreatBanner.tsx    # Condensed threat posture
      MobileAlertDetail.tsx     # Alert detail sheet content
      MobileDistrictView.tsx    # Full-screen district view
      MobileMapView.tsx         # Map tab wrapper
      MobileIntelTab.tsx         # Intel tab (priority feed + geo summary)
    coverage/
      CategoryCard.tsx          # Shared (add mobile prop variants)
      CoverageMap.tsx           # Shared (remove controls on mobile)
      MapPopup.tsx              # Shared (size adjustments via props)
      MapMarkerLayer.tsx        # Shared (no changes)
      PriorityBadge.tsx         # Shared (no changes)
      PriorityFeedStrip.tsx     # Shared (height adjustment)
      ViewModeToggle.tsx        # Shared (height adjustment)
  hooks/
    use-is-mobile.ts            # Viewport width detection hook (returns boolean | null)
  styles/
    mobile-tokens.css           # Mobile token overrides
    mobile.css                  # Mobile layout utilities
```


---

## #every-time Review

**Reviewer:** every-time protocol v3.2
**Date:** 2026-03-06
**Cross-referenced against:** ux-strategy.md, interface-architecture.md, information-architecture.md
**Codebase verified:** Yes (design tokens, component paths, CSS custom properties confirmed)

### Rating: A- -> A+ (after revisions)

All 8 required changes from the every-time review have been applied: 3-tab model aligned, default tab set to Situation, ThreatPulseBackground added, per-context bottom sheet snap points defined, hook renamed to `useIsMobile()`, touch targets clarified (44px WCAG / 48px design), morph state machine vs component distinction documented, and scan line cycle time settled at 12s.

This is the most implementation-ready document of the four. The design token specifications, glassmorphism performance tiers, typography scale, animation budget, and CSS patterns are detailed enough to begin coding immediately. The scroll-gated glass technique is a genuinely novel optimization. The OLED considerations and contrast audit demonstrate deep platform knowledge. The primary issue is that its navigation model (4 tabs: Map, Grid, Feed, Briefing) disagrees with every other document.

### Strengths

- **Glassmorphism performance tier system is the best idea across all four documents.** The three-tier model (always-on, scroll-rest, simplified) with the `useScrollGatedGlass` hook is practical, novel, and directly addresses the core tension between Oblivion aesthetics and mobile GPU constraints. This should be adopted as canon.
- **Design tokens are implementation-ready.** The mobile token layer with exact CSS custom property values, the typography scale with size/weight/tracking for every role, and the token mapping summary table provide a complete design specification.
- **OLED-specific analysis is unique to this document** and demonstrates platform expertise. The decision to keep `#050911` instead of pure black to prevent OLED smear is well-researched.
- **Animation performance budget with concrete tier classification** (CSS transforms/opacity = free, rAF loops = limited to 1, backdrop-filter = max 3 concurrent) gives implementers clear guardrails.
- **Corner bracket preservation specification** maintains aesthetic DNA while reducing size appropriately for mobile (10px from 14px, 1px from 1.5px thickness).
- **CSS patterns are thorough** -- `100dvh` for mobile browser chrome, `overscroll-behavior-y: contain`, safe area insets, and the complete `.mobile-shell` layout are all production-ready.

### Issues Found

1. **The 4-tab model (Map, Grid, Feed, Briefing) is unique to this document** and conflicts with all three others. The IA's 3-tab model (Situation, Map, Intel) is better justified with systematic evaluation. Recommendation: Adopt IA's model.

2. **Map as the default tab** contradicts the IA's recommendation that Situation should be default. The primary use case (check threat posture) requires posture level and P1 count visible on load with 0 taps.

3. **48px touch target minimum differs from 44px in the other three documents.** Recommendation: Use 44px as the WCAG-driven minimum; design for 48px where space permits.

4. **`useIsMobile()` hook name** differs from `useIsMobile()` used in UX Strategy and Interface Architecture. Recommend `useIsMobile()`.

5. **MorphOrchestrator listed as "Dropped"** but the morph state machine should be retained (3-phase fast path). What should be dropped is the `MorphOrchestrator` React component, not the morph concept itself.

6. **Scan line cycle time (25s)** conflicts with UX Strategy (8s) and Interface Architecture (12s).

7. **Missing: ThreatPulseBackground.** The UX Strategy proposes a viewport-covering ambient gradient that shifts with threat posture. This is high-impact, low-cost and should be adopted.

8. **The bottom sheet snap points (0%/50%/92%) are generic.** Per-context snap points (from UX Strategy) are more appropriate.

9. **Phase plan is 6-7 weeks**, the longest of any document. Animation polish should be integrated into each component's implementation, not deferred to the end.

### Cross-Document Conflicts

| Decision Point | This Document | Conflicts With |
|---|---|---|
| Tab count | 4 (Map, Grid, Feed, Briefing) | UX (4-item nav rail), Interface (3 tabs), IA (3 tabs) |
| Default tab | Map | IA: Situation, UX: Command scene (posture-first) |
| Touch target minimum | 48px | UX (44px), Interface (44px), IA (44px) |
| Hook name | `useIsMobile()` | UX and Interface use `useIsMobile()` |
| MorphOrchestrator | Dropped | Interface keeps morph state machine (3-phase) |
| Scan line cycle | 25s | UX (8s), Interface (12s) |
| Bottom sheet snaps | Generic 0%/50%/92% | UX defines per-context snap points |

### Recommendations

1. **Adopt the IA's 3-tab model** (Situation, Map, Intel).
2. **Add ThreatPulseBackground** to the ambient effects budget.
3. **Define per-context bottom sheet snap points** rather than one-size-fits-all.
4. **Align touch target to 44px minimum** with 48px as design aspiration.
5. **Rename hook to `useIsMobile()`** for cross-document consistency.
6. **Clarify morph status**: MorphOrchestrator component dropped, morph state machine retained.
7. **Integrate animation polish into per-component phases** rather than deferring to Week 6-7.

### Required Changes Before Implementation

- [x] Reconcile tab model to 3-tab (Situation, Map, Intel)
- [x] Change default tab from Map to Situation
- [x] Add ThreatPulseBackground to ambient effects budget
- [x] Define per-context bottom sheet snap points
- [x] Rename `useIsMobile()` to `useIsMobile()` (done -- all references updated)
- [x] Align touch target minimum: 44px WCAG threshold, 48px design target
- [x] Clarify morph state machine vs MorphOrchestrator component
- [x] Settle scan line cycle time with other documents (12s)


---

## Client Decisions (2026-03-06)

The following client decisions affect this document:

- **Q1 -- No offline support.** No service worker. PWA manifest + icons for installability only.
- **Q2 -- Landscape supported.** All components need landscape layout variants. Bottom sheets max ~60% height in landscape. Situation tab: side-by-side posture strip + category grid. Map: full-bleed (already handles resize). Design tokens should include landscape-specific spacing if needed.
- **Q5 -- Ambient effects ON by default.** Add ThreatPulseBackground to the ambient effects budget. All cinematic effects on by default.
- **Q6 -- Dynamic category sort with dampening.** Cards sorted by alert count descending, re-sort only on manual refresh or delta >= 2.
- **Q7 -- Bottom sheet with expand-to-full-screen.** `MobileBottomSheet` needs three modes: half-sheet, full-sheet, and full-screen overlay. Full-screen triggered by an expand button in the sheet header. Design the expand/collapse button to match the Oblivion aesthetic (glass pill, subtle glow).
- **Q8 -- Allow viewport zoom.** No `user-scalable=no`. Ensure all layouts handle zoom gracefully.
