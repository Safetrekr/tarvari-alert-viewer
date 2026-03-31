# TarvaRI Alert Viewer -- Mobile UX Strategy

**Document version:** 1.0
**Date:** 2026-03-06
**Status:** DRAFT -- Pending client review
**Design aesthetic:** Oblivion (2013) -- cinematic dark UI, glassmorphism, monospace type, ambient glow


---

## 1. Executive Summary

The TarvaRI Alert Viewer is a spatial intelligence dashboard built on a 20,000x20,000px pannable/zoomable world-space canvas (the "Spatial ZUI"). This paradigm is fundamentally incompatible with mobile viewports. Attempting to make the ZUI touch-friendly would compromise both usability and the cinematic aesthetic the client values.

This document proposes a **parallel mobile view** within the same Next.js codebase that shares 100% of the data layer (TanStack Query hooks, Zustand stores, TypeScript types, TarvaRI API client) while providing a purpose-built mobile navigation paradigm. The mobile view replaces the spatial canvas with a **vertically-stacked, gesture-driven, full-screen scene model** -- each scene occupies the full viewport and transitions use cinematic motion choreography inspired by the Oblivion aesthetic.

The key architectural insight is that the desktop ZUI's semantic zoom levels (Z0 icon grid, Z1 category cards, Z2+ detail panels) already define a natural information hierarchy. On mobile, these zoom levels become discrete scenes in a vertical navigation stack, connected by directional swipe gestures and animated morph transitions.

### What stays the same

- All TanStack Query hooks (`useCoverageMetrics`, `useCoverageMapData`, `useCategoryIntel`, `useIntelBundles`, `useThreatPicture`, `usePriorityFeed`)
- Both Zustand stores (`ui.store.ts` morph state machine, `coverage.store.ts` filter state)
- All TypeScript interfaces (`coverage.ts`, `intel-bundles.ts`, `MapMarker`, etc.)
- The MapLibre GL JS map component (already touch-native)
- The morph state machine concept (forward/reverse phase transitions)
- The TarvaRI API client (`tarvari-api.ts`)
- Auth flow and session management

### What changes

- Page composition: new `MobileShell` replaces `SpatialViewport` + `SpatialCanvas`
- Navigation: vertical scene stack replaces pannable world-space
- Category grid: 2-column CSS grid (~165x80px cards) replaces 9-column CSS Grid
- District view: stacked vertical layout replaces side-by-side two-column
- Panels and overlays: bottom sheet pattern replaces side dock drawers
- Ambient effects: reduced set, performance-gated
- All interactions: touch gestures replace mouse hover/click/scroll


---

## 2. Design Principles

### 2.1 Non-negotiable constraints

1. **Same codebase.** Mobile view lives in the same Next.js app, sharing hooks, stores, types, and API client. Detection is viewport-based (CSS media queries + a `useIsMobile()` hook), not a separate route tree.
2. **Aesthetic parity.** The mobile view must feel like the same product. Dark backgrounds (`rgba(5, 9, 17, ...)`), glassmorphism (`backdrop-blur`, `backdrop-saturate`), monospace typography, severity-color coding, and ambient glow effects must carry through.
3. **Performance ceiling.** Mobile devices have less GPU headroom. All ambient effects (scan line, dot grid, glow, range rings) are gated behind `prefers-reduced-motion` and a performance budget. The map is the single most GPU-intensive element and gets priority.
4. **Touch-first, not touch-adapted.** Every interaction must be designed for fingers from the start. No hover states. No right-click context menus. No keyboard shortcuts. Minimum tap target: 44x44px (WCAG 2.5.8).

### 2.2 Unconventional UX commitments

The client has explicitly asked to "move outside of convention" for wow factor. These are the places where we break from standard mobile patterns:

- **Edge-glow navigation indicators** as supplementary delight on top of a 3-tab ghost tab bar (Situation, Map, Intel). Subtle gradient light bands along the left/right/bottom edges of the viewport pulse to indicate available navigation directions, reminiscent of the Tet station's edge lighting in Oblivion. The tab bar is the primary navigation affordance; edge glows enhance discoverability but are never the sole navigation cue.
- **Scene morph transitions** instead of standard slide/fade page transitions. When moving between scenes, elements that exist in both scenes (e.g., a category color dot, an alert count number) perform a shared-element morph across the transition, creating continuity.
- **Threat-pulse ambient background** instead of a static dark background. The viewport background subtly shifts hue based on the current global threat posture (LOW = no shift, ELEVATED = faint amber pulse, CRITICAL = slow red throb), using CSS `@keyframes` on a full-screen radial gradient. This creates a subliminal awareness of threat level without consuming screen space.
- **Swipe-reveal information panels** instead of navigation-based drill-downs. Long-pressing an alert card reveals a frosted-glass detail panel that slides up from below, covering the bottom 70% of the screen. The panel can be flicked to full-screen or dismissed with a downward swipe.
- **Cinematic data loading states** instead of spinners. Data loads show a horizontal scan-line sweep (matching the desktop's `HorizonScanLine`) that wipes across the content area, revealing data as it arrives.

### 2.3 Aesthetic language

Every visual element on mobile must pass the "Oblivion test": would this feel at home in a heads-up display inside the Bubbleship cockpit? Specific tokens:

| Element | Mobile treatment |
|---------|-----------------|
| Background | `rgba(5, 9, 17, 0.98)` with subtle radial gradient center glow |
| Card surfaces | `backdrop-blur-[16px]` + `bg-white/[0.04]` + `border-white/[0.06]` |
| Primary text | `rgba(255, 255, 255, 0.6)` monospace |
| Secondary text | `rgba(255, 255, 255, 0.25)` monospace, 9px, `tracking-[0.1em]` uppercase |
| Interactive elements | `border-white/[0.08]` with `border-white/[0.18]` on `:active` |
| Severity colors | Same tokens as desktop (`--severity-extreme` through `--severity-unknown`) |
| Category colors | Same CSS custom properties (`--category-seismic`, etc.) |
| Corner brackets | Preserved at 10px on key cards for visual identity |
| Scan line | Thinner (1px), 12s cycle, viewport-fixed at top |


---

## 3. Mobile Navigation Paradigm

### 3.1 The scene stack model

The desktop ZUI presents everything simultaneously in a spatial plane. Mobile replaces this with a **depth-first scene stack** -- a vertical hierarchy of full-screen scenes where deeper scenes represent more specific data.

```
Level 0: Command (threat posture summary + priority feed + map thumbnail)
Level 1: Theater (full-screen map with markers + 2-column category grid overlay)
Level 2: District (category detail -- alert list + map + severity breakdown)
Level 3: Alert (full alert detail -- summary, metadata, geographic scope)
```

Navigation between levels uses directional gestures:

| Gesture | Action |
|---------|--------|
| Tap category card (L0/L1) | Push to L2 (District) with morph transition |
| Tap alert row (L2) | Push to L3 (Alert detail) with bottom-sheet slide |
| Swipe right from left edge (L1/L2/L3) | Pop to parent level |
| Swipe down from top (L3 bottom sheet) | Dismiss to L2 |
| Swipe up on map (L1) | Expand map to full-screen immersive mode |
| Long-press alert marker on map | Show alert preview tooltip (glass card) |
| Pinch on map | Standard MapLibre zoom (native touch handling) |

### 3.2 MobileShell component architecture

```
MobileShell (viewport container, gesture handler, edge-glow renderer)
  |
  +-- MobileHeader (threat posture badge, time, search icon)
  |
  +-- SceneContainer (AnimatePresence, manages scene stack)
  |     |
  |     +-- CommandScene (L0)
  |     +-- TheaterScene (L1)
  |     +-- DistrictScene (L2)
  |     +-- AlertDetailSheet (L3, bottom sheet overlay)
  |
  +-- MobileTabBar (bottom, translucent, 3 ghost tabs: Situation / Map / Intel + hamburger for settings)
  |
  +-- EdgeGlowIndicators (left, right, bottom edge light bands)
  |
  +-- ThreatPulseBackground (ambient threat-level gradient)
  |
  +-- MobileScanLine (viewport-fixed, 1px horizontal sweep)
```

### 3.3 Edge-glow navigation system (unconventional)

Instead of a traditional tab bar or hamburger menu, navigation affordances are communicated through **luminous edge bands** -- thin (3px) gradient strips along the viewport edges that glow when navigation is available in that direction.

- **Left edge glow:** Visible when the user can swipe right to go back. Color matches the parent scene's accent (e.g., category color when in District view). Pulses gently (2s cycle) when the back gesture is active.
- **Bottom edge glow:** Visible when a bottom sheet or panel can be pulled up. White glow at 10% opacity, brightens on touch-start.
- **Right edge glow:** Reserved for "next" navigation in sequential contexts (e.g., swiping between categories in District view).

The glows are implemented as `position: fixed` gradient divs with `pointer-events: none`, animated with CSS `@keyframes` and gated by the current scene's navigation capabilities.

The primary navigation is a **3-tab ghost tab bar** (Situation, Map, Intel) with a hamburger icon for settings access. The tab bar is 44px tall, translucent glass (`backdrop-blur-[16px]`), with monospace labels at 8px and Lucide icons at 18px. Edge glows supplement the tab bar as a delightful enhancement but are never the sole navigation cue.

### 3.4 Browser history and system back button behavior

Scene transitions push entries onto the browser history stack using `window.history.pushState()`. This ensures that:

- **Browser back button** (desktop) and **Android system back gesture/button** pop the current scene and return to the parent level.
- **iOS Safari swipe-back** is handled by the browser natively via history navigation.
- **History state shape:** Each entry stores `{ scene: 'command' | 'theater' | 'district' | 'alert', categoryId?: string, alertId?: string }`.
- **Deep linking:** The URL reflects the current scene (e.g., `#map`, `#intel/seismic`, `#intel/seismic/alert-123`). On initial load, the app reads the URL hash and restores the corresponding scene.
- **Bottom sheets** do not push history entries. Dismissing a bottom sheet does not trigger a history pop. The system back button while a bottom sheet is open dismisses the sheet (via a `popstate` listener that intercepts the event when a sheet is visible).

Navigation hierarchy for back button:

```
L3 (Alert sheet open) -> dismiss sheet (no history pop)
L2 (District)         -> pop to L1 (Map tab)
L1 (Map tab)          -> pop to L0 (Situation tab)
L0 (Situation tab)    -> browser default (exit app or previous page)
```

### 3.5 Detection and routing

The mobile view is activated by viewport width, not user-agent sniffing:

```typescript
// hooks/use-is-mobile.ts
export function useIsMobile(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}
```

Returns `null` during SSR and initial hydration (before `useEffect` runs), `true` for mobile viewports (max-width: 767px), and `false` for desktop. Consumers should handle the `null` state to avoid layout flash.

The main `page.tsx` conditionally renders either `LaunchPage` (existing desktop) or `MobileLaunchPage` (new):

```typescript
export default function Page() {
  const isMobile = useIsMobile()
  if (isMobile === null) return null // avoid layout flash during hydration
  return isMobile ? <MobileLaunchPage /> : <LaunchPage />
}
```

Both components consume the same hooks and stores. No data layer duplication.


---

## 4. Touch Gesture Mapping

### 4.1 Gesture vocabulary

| Gesture | Context | Action | Feedback |
|---------|---------|--------|----------|
| Tap | Category card | Open district view (morph transition) | Card scales to 0.95 on touch-start, glass flash on release |
| Tap | Alert list row | Select alert, open detail sheet | Row border-left illuminates with severity color |
| Tap | Map marker | Show popup with title + severity + INSPECT button | Marker pulses once on tap |
| Tap | Map cluster | Zoom into cluster (MapLibre native) | Smooth zoom animation |
| Tap | Priority feed strip | Expand priority feed panel (bottom sheet) | Strip slides up, chevron rotates |
| Long-press (300ms) | Alert list row | Show quick-action menu (inspect, filter, share) | Haptic feedback (if available), glass overlay |
| Long-press (300ms) | Map marker | Show floating preview card without navigating | Card appears at marker position with glass blur |
| Tap | Category card (2-column grid) | Open district view (morph transition) | Card scales to 0.95 on touch-start |
| Swipe right from left edge | Any scene except L0 | Navigate back one level | Left edge glow brightens, scene slides right with parallax |
| Swipe up | Bottom sheet handle | Expand sheet to full-screen | Sheet snaps to 70% or 100% height |
| Swipe down | Bottom sheet | Collapse or dismiss sheet | Sheet snaps to 40%, 0% (dismissed) |
| Swipe down from top | L0 Command scene | Pull-to-refresh all data | Scan-line sweep animation |
| Pinch in/out | Map | Zoom map (native MapLibre) | Standard map behavior |
| Two-finger rotate | Map | Rotate map bearing | Standard MapLibre behavior |
| Double-tap | Map | Zoom in one level | Smooth zoom to tap point |

### 4.2 Gesture conflict resolution

The primary conflict is between map gestures and navigation gestures. Resolution:

1. **Map receives all gestures when it is the active surface.** When the map is in focus (the user's last touch was on the map), swipe gestures are consumed by MapLibre. Edge-swipe navigation requires the gesture to start within 20px of the viewport edge.
2. **Edge-swipe always wins.** The 20px edge zone is reserved for navigation. MapLibre's `dragPan` is configured to ignore touches that start in this zone.
3. **Bottom sheet gestures override map.** When a bottom sheet is visible, vertical swipes on the sheet handle (a 44x4px grab bar) are consumed by the sheet, not the map beneath it.

### 4.3 Haptic feedback strategy

On devices that support the Vibration API, the following haptic patterns are used:

| Event | Pattern | Rationale |
|-------|---------|-----------|
| Scene transition start | Single light tap (10ms) | Confirms navigation intent |
| P1 alert notification | Double tap (15ms, 50ms gap, 15ms) | Urgency signal |
| Long-press activation | Single medium tap (20ms) | Confirms hold threshold reached |
| Pull-to-refresh release | Single tap (10ms) | Confirms refresh initiated |
| Error state | Triple short (10ms x 3, 30ms gap) | Distinct from navigation feedback |


---

## 5. Information Hierarchy on Small Screens

### 5.1 Priority-first information architecture

On a 375px-wide viewport, every pixel must justify its presence. The information hierarchy is:

```
1. THREAT POSTURE (is the world on fire?)
   -> Posture level badge (CRITICAL / HIGH / ELEVATED / GUARDED / LOW)
   -> P1 and P2 counts
   -> Overall trend direction

2. PRIORITY ALERTS (what needs attention now?)
   -> P1 alerts, sorted by recency
   -> P2 alerts, sorted by recency
   -> Most recent alert title + severity + time-ago

3. GEOGRAPHIC PICTURE (where is it happening?)
   -> Full-screen map with clustered severity markers
   -> Category filter chips overlaying the map bottom

4. CATEGORY BREAKDOWN (what kinds of threats?)
   -> 2-column grid of category cards (~165x80px each)
   -> Each card: icon + name + alert count + trend arrow + priority badge

5. CATEGORY DETAIL (drill-down)
   -> Alert list, sortable by severity or time
   -> Category-filtered map
   -> Severity breakdown bar
   -> Source health summary

6. ALERT DETAIL (individual alert)
   -> Severity + priority badges
   -> Title + summary
   -> Event type, source, confidence, geo scope
   -> Timestamps (ingested, sent)
```

### 5.2 Progressive disclosure on mobile

The desktop version shows all six levels simultaneously across the spatial canvas. Mobile uses strict progressive disclosure:

- **L0 Command scene** shows levels 1-2 (posture + priority alerts). This is the "glanceable" view -- a user opening the app gets threat posture and any urgent alerts within 1 second.
- **L1 Theater scene** shows levels 3-4 (map + category grid). This is the "exploration" view -- the user pans/zooms the map and browses categories.
- **L2 District scene** shows level 5 (category detail). This is the "investigation" view -- the user reads alert lists and drills into source data.
- **L3 Alert sheet** shows level 6 (individual alert). This is the "inspection" view -- full metadata for a single alert.

### 5.3 Content truncation rules

| Content type | Desktop | Mobile | Truncation method |
|---|---|---|---|
| Alert title | Full, up to 200 chars | 2 lines, ellipsis | `line-clamp-2` |
| Alert summary | Full paragraph | 3 lines + "Read more" | `line-clamp-3` with expand toggle |
| Category name | Full name | Short code if < 360px width | `meta.shortName` (e.g., "SEIS") below 360px |
| Geographic scope tags | Inline wrap | Horizontal scroll | `overflow-x-auto` with snap |
| Source health table | Full table | Collapsed accordion | Expand per-source |
| Severity breakdown legend | Inline grid | Below bar, two-column | Responsive reflow |
| Timestamps | Full locale string | Relative time only | `relativeTime()` helper |


---

## 6. Feature-by-Feature Mobile Translation

### Feature 1: Global Map with Clustered Intel Markers

**Desktop:** 1600x900px MapLibre map in world-space, with severity-colored markers, clustering, and glass-themed popups. Decorative corner brackets frame the map. Loading and empty states overlay the map.

**Mobile:** Full-viewport-width map occupying approximately 60% of the Theater scene (L1). The map extends edge-to-edge horizontally for maximum geographic coverage. Touch gestures (pinch-zoom, pan, rotate) are native MapLibre behavior.

**Key adaptations:**
- Remove the `MapNavControls` d-pad (desktop only -- touch replaces it entirely).
- Marker popups render as a bottom-anchored glass card (not a MapLibre native popup) to avoid the popup being clipped by the viewport edge. The card shows title, severity badge, priority badge, time-ago, and an INSPECT button.
- Cluster tap behavior is unchanged (zoom to expand).
- Corner brackets are removed on mobile (decorative, waste 12px of map edge).
- The dark CARTO raster basemap and paint properties (`raster-brightness-max: 0.45`, `raster-saturation: -0.3`, `raster-hue-rotate: 200`) are unchanged -- they are essential to the aesthetic.
- `interactiveLayerIds` remain the same for marker touch handling.

**Gesture mapping:**
- Pinch: zoom map
- Pan: pan map
- Tap marker: show bottom glass card popup
- Tap cluster: zoom into cluster
- Long-press marker: show floating preview card at marker location
- Swipe up from bottom 20%: pull up category grid overlay

### Feature 2: 15-Category Grid (CategoryCards)

**Desktop:** 9-column CSS Grid of `CategoryCard` components with icon, name, alert count, trend arrow, priority badge. Hover reveals a two-button overlay (View District / Show on Map). Morph selection scales the selected card to 1.2x and dims siblings to 0.3 opacity.

**Mobile:** 2-column CSS grid of condensed category cards (~165x80px each), displayed in the Intel tab or as an overlay on the Map tab. Each card shows icon, name, alert count, trend arrow, and priority badge.

**Key adaptations:**
- The hover overlay is replaced by **tap to navigate** (opens district) and **long-press to filter** (toggles map filter). This is communicated via an onboarding tooltip on first use.
- The `isHovered` state and `AnimatePresence` hover overlay are removed entirely.
- Card dimensions shrink from approximately 160x180px to ~165x80px in a 2-column grid layout.
- The `displayName` label uses `meta.shortName` (e.g., "SEIS", "WX", "FIR") below 360px viewport width.
- The filter-active state (`isFiltered`) is shown by a solid category-color bottom border (3px) instead of the box-shadow glow.
- The dimming behavior (`isDimmedByFilter`) is preserved -- non-filtered cards dim to 0.4 opacity.
- Category color left-border is preserved on the card.
- Grid scrolls vertically within its container.

**Layout:**
```
+--map (60% of viewport)----------+
|                                  |
|       [markers]                  |
|                                  |
+--category grid (2-col)-----------+
| [SEIS  23 ^]   [GEO   7  -]    |
| [DIS   12 v]   [HUM   4  ^]    |
| [WX    19 ^]   [FIR   8  -]    |
| ...                              |
+----------------------------------+
```

### Feature 3: Morph Animation (Category Card -> District View)

**Desktop:** 6-phase state machine (`idle -> expanding -> settled -> entering-district -> district`). The selected `CategoryCard` scales to 1.2x, siblings dim, then the card expands to fill the viewport, and the `DistrictViewOverlay` fades in as a fixed full-screen layer with a tinted radial gradient.

**Mobile:** The morph state machine is shared from `ui.store.ts`, but mobile always uses the **3-phase fast path** (`idle -> entering-district -> district`) via `startMorph(id, { fast: true })`. This skips the `expanding` and `settled` phases for a snappier mobile experience:

The morph uses the **3-phase fast path**: `idle -> entering-district -> district` via `startMorph(id, { fast: true })`.

1. **`idle -> entering-district`** (400ms): The tapped category card in the grid scales to 0.95x, siblings dim. The card's category color dissolves into the `DistrictScene` background tint (`getCategoryTint()`). The district's alert list and map fade in with staggered entry (list first at 0ms, map at 100ms, severity bar at 200ms).
2. **`entering-district -> district`**: Scene is fully interactive.
3. **Reverse (`district -> leaving-district -> idle`)** (300ms): Content fades out, category color contracts back to card position, grid reappears.

The `useMorphChoreography()` hook drives timing with the `fast` flag always enabled on mobile.

**Performance note:** The expanding color circle uses a CSS `clip-path: circle()` animation, which is GPU-composited and does not trigger layout reflow. This is critical for 60fps on mobile.

### Feature 4: District View (Category Detail)

**Desktop:** Full-screen overlay with a two-column layout -- left column has a scrollable alert list; right column has severity breakdown, coverage map (70%), and source health table (30%). A 360px-wide glass dock slides in from the right showing either category overview or selected alert detail.

**Mobile:** Full-screen scene (L2) with a vertically stacked layout. The dock panel becomes a bottom sheet.

**Layout:**
```
+--header (category name + back arrow)--+
|                                        |
| [Severity breakdown bar]              |
|                                        |
| +--map (50% of remaining height)----+ |
| |                                    | |
| |  [category-filtered markers]       | |
| |                                    | |
| +------------------------------------+ |
|                                        |
| +--alert list (scrollable)----------+ |
| | [Extreme] Earthquake M6.2  3m ago | |
| | [Severe]  Aftershock seq.   8m ago | |
| | [Moderate] Building damage 22m ago | |
| | ...                                | |
| +------------------------------------+ |
|                                        |
+---bottom sheet (alert detail)---------+
```

**Key adaptations:**
- The `DistrictViewDock` (360px side panel) becomes a draggable bottom sheet at 40% viewport height (collapsed) / 70% (half) / 100% (full). The sheet renders `CategoryOverviewView` when no alert is selected, and `AlertDetailView` when one is selected.
- The `DistrictViewContent` two-column grid becomes a single-column vertical stack.
- The `AlertList` sort controls (Severity / Time buttons, P1-P4 filter chips) move into a horizontal scrollable toolbar above the list.
- The `SourceHealthTable` is collapsed into an expandable accordion section below the alert list, defaulting to collapsed. Most mobile users do not need source health data.
- The `DistrictFilterPanel` (source filter + bbox toggle) is accessed via a filter icon in the header, opening as a compact bottom sheet.
- The `DistrictViewHeader` back button becomes a left-arrow icon (24px) with swipe-right-from-edge as an equivalent gesture.
- The category color tint radial gradient background is preserved but simplified to a single `rgba` color instead of a positioned ellipse (mobile screens are too narrow for the ellipse to read properly).

### Feature 5: Priority Feed Strip

**Desktop:** World-space horizontal bar with P1 count, P2 count, most recent alert title/severity/time-ago, and expand chevron. Clicking opens the `PriorityFeedPanel` slide-over.

**Mobile:** This becomes the top section of the Command scene (L0). Two visual treatments:

**Collapsed (L0 top bar):** A fixed-position 48px-tall glass bar at the top of the Command scene showing the posture badge, P1 count, P2 count, and a truncated latest alert title. Tapping opens the Priority Feed as a full-screen bottom sheet.

**Expanded (bottom sheet):** The `PriorityFeedPanel` content renders in a bottom sheet at 70% height, scrollable, with the same alert list as desktop but formatted for single-column mobile.

**Key adaptations:**
- The `priority-feed-pulse` CSS animation is preserved for P1 active state (it is lightweight and high-impact visually).
- The ALL CLEAR state renders as a centered confirmation with a larger check icon (24px vs 12px desktop).
- The expand/collapse chevron is replaced by the bottom sheet drag handle.

### Feature 6: Threat Posture Card

**Desktop:** 320px-wide card in world-space showing posture level, active alert count, P1/P2 breakdown, top threats, top regions, and intelligence summary availability. Clicking opens `GeoSummaryPanel`.

**Mobile:** This is the hero element of the Command scene (L0), occupying the full viewport width with generous padding (16px). The card's vertical layout is already mobile-friendly. Adaptations:

- The three-column inner layout (categories | separator | regions) becomes a two-row stacked layout (categories on top, regions below).
- The "Intelligence Summaries" section is collapsed behind a "View Summaries" tap target to reduce initial height.
- The posture badge size increases from 10px to 14px font for better readability on small screens.
- The "Full Briefing" footer button becomes a prominent call-to-action that opens the Geo Summary as a full-screen scene transition (not a bottom sheet -- briefings are long-form content that deserves full screen).
- Tap on the card opens the Geo Summary panel.

### Feature 7: Geo Summary Slide-Over Panel

**Desktop:** Fixed-position slide-over panel at z-42, occupying approximately 400px width on the right side. Shows AI-generated geographic intelligence briefs with world/region/country drill-down and hourly/daily toggle.

**Mobile:** Full-screen scene transition from the Command scene (L0). The geo summary content fills the entire viewport with comfortable margins. The geographic hierarchy navigation (world -> region -> country) uses horizontal swipe pagination or a segmented control.

**Key adaptations:**
- The drill-down from world to region becomes a tap on a region row, which pushes a new sub-scene with a right-to-left slide transition.
- The hourly/daily toggle becomes a segmented control at the top of the content area.
- Long-form summary text uses 14px font (up from 11px desktop) for mobile readability.
- The close button is replaced by swipe-right-from-edge back gesture plus a header back arrow.

### Feature 8: ViewMode Toggle (Raw / All Bundles / Triaged)

**Desktop:** Three-button segmented control positioned above the map in world-space, with alert counts per mode.

**Mobile:** Compact segmented control rendered as a horizontal pill group at the top of the Theater scene (L1), above the map. Uses abbreviated labels to save space:

| Desktop label | Mobile label |
|---------------|-------------|
| "Triaged (42)" | "TRI 42" |
| "All Bundles (78)" | "ALL 78" |
| "Raw (156)" | "RAW 156" |

The control is 36px tall, glass-styled, and positioned absolutely at the top-right of the map area with 8px margin.

### Feature 9: Time Range Selector

**Desktop:** Dropdown/button group showing preset time ranges (1m, 10m, 30m, 1h, ..., 7d, All) positioned above the map.

**Mobile:** Horizontal scrollable chip row below the ViewMode toggle. Each chip is a 32px-tall monospace pill showing the preset label. The active chip has a bright border and slightly elevated background. Custom date range opens a native date picker bottom sheet.

Layout on the Theater scene map:
```
+--[TRI 42] [ALL 78] [RAW 156]----top-right--+
|                                              |
|  map content                                 |
|                                              |
+--[1h] [2h] [4h] [12h] [24h] [7d] [All]--bot+
```

### Feature 10: Command Palette (Cmd+K Search)

**Desktop:** Dialog overlay at z-50 with keyboard-driven search. Fuzzy-matches intel items by title, category, severity, source. Results navigated with arrow keys, Enter to select.

**Mobile:** Full-screen search scene activated by tapping the search icon in the `MobileHeader`. The search input is auto-focused with the keyboard opening immediately. Results render in a scrollable list below the input.

**Key adaptations:**
- No keyboard shortcuts (Cmd+K is desktop-only).
- The search input is full-width with a cancel button on the right.
- Results show the same data as desktop (title, category, severity, source) in a card format.
- Tapping a result uses the `startMorph(category, { fast: true })` path with `setDistrictPreselectedAlertId` to navigate directly to the alert in its category district view.
- Recent searches are persisted in `sessionStorage` and shown as ghost chips below the input when empty.

### Feature 11: Ambient Effects

**Desktop:** HorizonScanLine, DotGrid, HaloGlow, RangeRings, CalibrationMarks, TopTelemetryBar, BottomStatusStrip, SessionTimecode, SectorGrid, EdgeFragments, MicroChronometer, CoordinateOverlays.

**Mobile:** Dramatically reduced set. The goal is to keep the cinematic feel without burning mobile GPU:

| Effect | Mobile status | Rationale |
|--------|--------------|-----------|
| HorizonScanLine | KEEP (1px, 12s cycle) | Signature visual, near-zero GPU cost |
| DotGrid | REMOVE | 20,000x20,000px canvas, no spatial viewport to contain it |
| HaloGlow | REPLACE with ThreatPulseBackground | Ambient glow via full-viewport radial gradient, simpler |
| RangeRings | REMOVE | Spatial ZUI context only |
| CalibrationMarks | REMOVE | Spatial ZUI context only |
| TopTelemetryBar | KEEP (simplified) | 1 line: time + posture badge + connection status |
| BottomStatusStrip | REPLACE with tab bar | Space occupied by bottom navigation |
| SessionTimecode | KEEP | Tiny, high-aesthetic-value, fixed top-right |
| SectorGrid | REMOVE | Spatial ZUI context only |
| EdgeFragments | REMOVE | Spatial ZUI context only |
| MicroChronometer | REMOVE | Spatial ZUI context only, too small for mobile |
| CoordinateOverlays | REMOVE | Spatial ZUI context only |

**New mobile-only ambient effects:**
- **ThreatPulseBackground:** A viewport-covering `div` behind all content with a `radial-gradient` that slowly shifts opacity based on `useThreatPicture()` posture level. LOW = invisible. CRITICAL = `rgba(220, 38, 38, 0.04)` with a 4s CSS animation cycle. This creates subliminal awareness.
- **EdgeGlowIndicators:** Navigation affordance as described in Section 3.3.
- **DataScanReveal:** A horizontal scan-line sweep (2px, cyan glow) that wipes across content areas during data loading, revealing content progressively. Replaces conventional loading skeletons for the most prominent data loads (map markers, alert list).


---

## 7. Transition and Animation Strategy

### 7.1 Motion budget

Mobile animations must complete within the following budgets to maintain 60fps and avoid perceived sluggishness:

| Transition type | Max duration | Easing |
|----------------|-------------|--------|
| Scene push (L0 -> L1, L1 -> L2) | 400ms | `[0.22, 1, 0.36, 1]` (match desktop morph) |
| Scene pop (back navigation) | 300ms | `[0.22, 1, 0.36, 1]` |
| Bottom sheet expand | 300ms | `[0.22, 1, 0.36, 1]` |
| Bottom sheet dismiss | 250ms | `[0.4, 0, 1, 1]` (fast exit) |
| Card press feedback | 100ms | `ease-out` |
| Data scan reveal | 600ms | `linear` |
| Threat pulse cycle | 4000ms | `ease-in-out` |
| Edge glow pulse | 2000ms | `ease-in-out` |
| Alert row highlight | 150ms | `ease-out` |
| Filter toggle | 200ms | `[0.22, 1, 0.36, 1]` |

### 7.2 Motion choreography for scene transitions

**L0 (Command) -> L1 (Theater):**
1. (0ms) Command scene content fades out (opacity 1 -> 0, 200ms).
2. (100ms) Map begins fading in from below (translate-y: 40px -> 0, opacity 0 -> 1, 300ms).
3. (200ms) Category grid slides up from bottom (translate-y: 100% -> 0, 250ms).
4. (250ms) ViewMode toggle and time selector fade in (opacity 0 -> 1, 150ms).

**L1 (Theater) -> L2 (District):**
This uses the 3-phase fast morph (`idle -> entering-district -> district` via `startMorph(id, { fast: true })`). The visual steps are:
1. (0ms) Tapped category card scales to 0.95x, siblings dim to 0.3 opacity.
2. (100ms) Category color dissolves into district background tint. District scene content fades in with stagger:
   - Alert list (0ms offset)
   - Map (100ms offset)
   - Severity breakdown (200ms offset)
3. (400ms) Scene is fully interactive.

**L2 (District) -> L3 (Alert Detail Sheet):**
1. (0ms) Selected alert row's left border illuminates with severity color.
2. (50ms) Bottom sheet slides up from below viewport (translate-y: 100% -> 30%, 250ms).
3. (100ms) Sheet content fades in (opacity 0 -> 1, 200ms).
4. User can swipe up to expand sheet to 70% or 100%.

**All reverse transitions:** Content fades out, container slides in the reverse direction, previous scene content fades back in. Duration is 75% of forward transition.

### 7.3 Reduced motion support

All animations respect `prefers-reduced-motion: reduce`:
- Scene transitions become instant opacity crossfades (100ms).
- Bottom sheets snap without animation.
- Threat pulse background is static.
- Edge glows are static (no pulse).
- Data scan reveals are replaced by standard opacity fades.
- The `priority-feed-pulse` animation is disabled (already handled in existing CSS).

Implementation: The existing `usePrefersReducedMotion()` hook is reused. All `motion/react` components read this value and swap their transition configs.


---

## 8. User Flows

### 8.1 Flow 1: Check Threat Picture (primary task)

**User goal:** "What is the current global threat posture? Are there any critical alerts I need to know about?"

**Expected frequency:** Multiple times per day. This is the app's "pull-to-check" use case.

```
STEP 1: Open app
  -> App loads to L0 Command scene.
  -> Within 1 second, the user sees:
     [THREAT POSTURE: ELEVATED]
     [P1: 2]  [P2: 7]
     [Latest: "M6.1 earthquake reported in Tonga region" -- 3m ago]
  -> The ThreatPulseBackground has a faint amber glow (ELEVATED posture).
  -> Decision point: Is the posture acceptable?

STEP 2a: Posture acceptable -- glance complete (3 seconds total)
  -> User closes app or leaves it open.
  -> No further interaction needed.

STEP 2b: Posture concerning -- drill into briefing (5-10 seconds)
  -> User taps the Threat Posture Card.
  -> Full-screen transition to Geo Summary scene.
  -> User reads the AI-generated daily briefing.
  -> User taps a region (e.g., "Oceania") to read the regional brief.
  -> User swipes right to return to Command scene.

STEP 2c: P1 alert needs attention (10-30 seconds)
  -> User taps the Priority Feed Strip.
  -> Bottom sheet opens with P1 and P2 alerts, sorted by priority then recency.
  -> User taps a P1 alert row.
  -> Alert detail renders in the bottom sheet (severity, title, summary, metadata).
  -> User swipes down to dismiss, or taps "View in District" to navigate to the
     category's District scene with that alert pre-selected.
```

**Wireframe (L0 Command scene):**
```
+----------------------------------------+
| TARVA          10:42:07 UTC   [search] |  <- MobileHeader
+----------------------------------------+
|                                        |
| +------------------------------------+ |
| | [shield] THREAT POSTURE  [ELEVATED]| |
| |                                    | |
| |  147 ACTIVE     P1 2    P2 7      | |
| |                                    | |
| |  Top Threats        Top Regions    | |
| |  Seismic    23      Oceania   31   | |
| |  Weather    19      E. Europe 28   | |
| |  Conflict   17      Mid East  22   | |
| |                                    | |
| |        [Full Briefing ->]          | |
| +------------------------------------+ |
|                                        |
| +------------------------------------+ |
| | P1 [*] 2  |  P2 [>] 7  | M6.1... | |  <- PriorityFeedStrip
| +------------------------------------+ |
|                                        |
| +------------------------------------+ |
| | [map thumbnail -- 200px tall]      | |  <- Tappable to go to L1
| | "Tap to explore map"               | |
| +------------------------------------+ |
|                                        |
+----------------------------------------+
| [Situation] [Map] [Intel]  [≡]        |  <- MobileTabBar
+----------------------------------------+
```

### 8.2 Flow 2: Inspect a Specific Alert (secondary task)

**User goal:** "I saw a notification about an earthquake. I want to read the full details including source, confidence, and geographic scope."

**Expected frequency:** Several times per day when alerts are active.

```
STEP 1: Enter via notification or search
  OPTION A: Push notification -> app opens to L0 -> user taps the alert
    in the Priority Feed -> bottom sheet shows detail.
  OPTION B: User taps search icon -> types "earthquake" ->
    results show matching alerts -> user taps result ->
    fast morph to District scene with alert pre-selected.

STEP 2: Read alert detail
  -> Alert detail sheet shows:
     [EXTREME severity badge]  [P1 priority badge]
     "M6.1 earthquake reported in Tonga region"
     ----
     SUMMARY: "A magnitude 6.1 earthquake struck 47km SSW of
     Pangai, Tonga at 06:23 UTC. No tsunami warning issued.
     USGS reports depth of 10km. Multiple aftershocks expected."
     ----
     EVENT TYPE: natural_disaster
     SOURCE: usgs_earthquake_feed
     CONFIDENCE: [====----] 82%
     GEO SCOPE: [TO] [FJ] [WS]
     ----
     INGESTED: Mar 6, 2026, 06:24 AM UTC
     SENT: Mar 6, 2026, 06:23 AM UTC

STEP 3: Navigate to category context (optional)
  -> User taps "View in Seismic District" button at bottom of detail sheet.
  -> Morph transition to L2 District scene for Seismic category.
  -> Alert is pre-selected in the alert list (auto-scrolled to).
  -> Map shows all seismic markers, with the inspected alert highlighted.

STEP 4: Return
  -> User swipes right from left edge to return to Theater (L1).
  -> Or taps the back arrow in the District header.
```

### 8.3 Flow 3: Browse a Category (exploratory task)

**User goal:** "I want to see what is happening in the Weather category -- how many alerts, what severity, which regions."

**Expected frequency:** Once or twice per session.

```
STEP 1: Navigate to Theater scene
  -> From L0 Command, user taps the map thumbnail or the Map tab in the tab bar.
  -> Transition to L1 Theater scene (full map + category grid).

STEP 2: Find Weather in category grid
  -> User scrolls the 2-column category grid vertically.
  -> Each card shows: icon, name, alert count, trend arrow.
  -> User finds "WX 19" (Weather, 19 alerts) with a trend-up arrow.

STEP 3: Open Weather district
  -> User taps the WX card.
  -> Morph transition: card scales, category color (blue) expands, district scene fades in.
  -> L2 District scene shows:
     - Weather category header (blue accent)
     - Severity breakdown bar (3 Severe, 8 Moderate, 8 Minor)
     - Map with weather-only markers
     - Scrollable alert list (19 items, sorted by severity)

STEP 4: Browse alerts
  -> User scrolls the alert list.
  -> Taps "Severe -- Tropical cyclone forming in Bay of Bengal".
  -> Bottom sheet slides up with full alert detail.
  -> User reads summary, checks confidence (91%), notes geo scope [IN, BD, MM].

STEP 5: Filter (optional)
  -> User taps the filter icon in the header.
  -> Small bottom sheet shows source filter chips and bbox toggle.
  -> User selects "met_office_uk" source to see only UK Met Office alerts.
  -> Alert list and map markers update.

STEP 6: Return
  -> User swipes right from left edge.
  -> Reverse morph: district content fades, blue color contracts, grid returns.
  -> Back at L1 Theater scene, the WX card is visible in the grid.
```


---

## 9. Bottom Sheet System

Bottom sheets are the mobile equivalent of the desktop's side dock drawers and slide-over panels. A reusable `MobileBottomSheet` component handles all sheet interactions.

### 9.1 Sheet snap points

| Sheet context | Collapsed | Half | Full |
|---|---|---|---|
| Alert detail (L3) | -- | 70% viewport | 100% viewport |
| Priority feed | -- | 60% viewport | 100% viewport |
| Category overview (dock) | 35% viewport | 65% viewport | 100% viewport |
| Filter panel | -- | 40% viewport | -- |
| Search results | -- | -- | 100% viewport |

### 9.2 Sheet visual treatment

```
+-------- viewport edge --------+
|                                |
|    (dimmed content beneath)    |
|                                |
+================================+  <- sheet top, rounded corners (16px)
|         [====]                 |  <- drag handle, 40x4px, centered, white/10%
|                                |
|     Sheet content here         |
|     Glass background:          |
|     bg-[rgba(10,14,24,0.95)]   |
|     backdrop-blur-[20px]       |
|     border-t: 1px white/8%    |
|                                |
+================================+
```

### 9.3 Sheet gestures

- **Drag handle:** Vertical swipe on the 44x44px touch target centered at the top of the sheet. Dragging up expands to next snap point; dragging down collapses or dismisses.
- **Content scroll interaction:** When sheet content is scrollable, scrolling up at the top of the content expands the sheet (if not already full). Scrolling down at scroll position 0 collapses the sheet.
- **Backdrop tap:** Tapping the dimmed area above the sheet dismisses it (equivalent to desktop Escape key).
- **Velocity-based snap:** If the user flicks the sheet quickly (> 500px/s), it snaps to the nearest snap point in the flick direction, regardless of current position.


---

## 10. Accessibility Considerations for Touch

### 10.1 WCAG 2.2 AA compliance requirements

| Criterion | Requirement | Implementation |
|-----------|------------|----------------|
| 2.5.1 Pointer Gestures | All gesture-based actions have single-tap alternatives | Every swipe has a button equivalent (back arrow, tab bar icons) |
| 2.5.2 Pointer Cancellation | Actions fire on touch-end, not touch-start | All tap handlers use `onClick` (fires on release) |
| 2.5.5 Target Size | Minimum 44x44px for all interactive targets | All buttons, list rows, and cards meet this minimum |
| 2.5.8 Target Size (Enhanced) | Minimum 24x24px with 24px spacing | Category cards are ~165x80px, alert rows are full-width x 48px |
| 1.4.3 Contrast | 4.5:1 for normal text, 3:1 for large text | All text/background pairs verified against dark backgrounds |
| 1.4.11 Non-text Contrast | 3:1 for UI components | Severity dots, card borders, and interactive boundaries verified |
| 4.1.2 Name, Role, Value | All controls have accessible names | `aria-label` on all icon-only buttons, `role="list"` on alert lists |

### 10.2 Touch-specific accessibility patterns

**Gesture alternatives:** Every swipe-based navigation has a visible button alternative:
- Swipe-right-to-go-back is paired with a visible back arrow button (top-left, 44x44px).
- Swipe-up-on-map is paired with the "Intel" tab in the tab bar.
- Bottom sheet dismiss-swipe is paired with a "Close" button or backdrop tap.
- Edge-glow indicators are supplementary -- they enhance discoverability but are never the only navigation cue.

**Screen reader support:**
- Scene transitions announce the new scene name via `aria-live="assertive"` on the scene container.
- Bottom sheets announce their open/close state via `aria-expanded` on the trigger.
- Alert severity and priority are announced as part of the alert's `aria-label`.
- The threat posture badge announces the full posture level (e.g., "Threat posture: Elevated. 147 active alerts.").
- Map markers have `aria-label` attributes with title, severity, and category.

**Focus management:**
- When a scene pushes, focus moves to the first interactive element in the new scene.
- When a scene pops, focus returns to the element that triggered the push.
- Bottom sheets trap focus when open. Escape (hardware back button on Android) dismisses the sheet.
- The search scene auto-focuses the search input on open.

**Reduced motion:** All animations respect `prefers-reduced-motion` as detailed in Section 7.3.

### 10.3 One-handed operation

The mobile layout is designed for bottom-heavy interaction, keeping primary actions within the lower 60% of the viewport (thumb reach zone on a standard smartphone held in one hand):

- The tab bar is at the bottom.
- Category cards are in the lower 40% of the Theater scene (2-column grid).
- The priority feed strip is tap-accessible from the Command scene mid-section.
- The search trigger is accessible from the header or via the hamburger settings menu.
- Bottom sheets emerge from the bottom, keeping their handles in the thumb zone.

The only top-reach elements are the back arrow and the MobileHeader, which are infrequently used (the swipe-right gesture replaces the back arrow for most users).


---

## 11. Technical Implementation Notes

### 11.1 New components to build

| Component | Location | Description |
|-----------|----------|-------------|
| `MobileShell` | `src/components/mobile/MobileShell.tsx` | Root container, gesture handler, scene manager |
| `MobileHeader` | `src/components/mobile/MobileHeader.tsx` | Top bar: logo, time, posture badge, search |
| `MobileTabBar` | `src/components/mobile/MobileTabBar.tsx` | Bottom nav: 3 ghost tabs (Situation / Map / Intel) + hamburger |
| `MobileBottomSheet` | `src/components/mobile/MobileBottomSheet.tsx` | Reusable snap-point bottom sheet |
| `CommandScene` | `src/components/mobile/scenes/CommandScene.tsx` | L0: posture + priority + map thumb |
| `TheaterScene` | `src/components/mobile/scenes/TheaterScene.tsx` | L1: full map + 2-column category grid |
| `DistrictScene` | `src/components/mobile/scenes/DistrictScene.tsx` | L2: category detail (stacked layout) |
| `AlertDetailSheet` | `src/components/mobile/scenes/AlertDetailSheet.tsx` | L3: alert detail bottom sheet |
| `MobileCategoryGrid` | `src/components/mobile/MobileCategoryGrid.tsx` | 2-column category card grid (~165x80px cards) |
| `EdgeGlowIndicators` | `src/components/mobile/EdgeGlowIndicators.tsx` | Navigation edge light bands |
| `ThreatPulseBackground` | `src/components/mobile/ThreatPulseBackground.tsx` | Ambient posture gradient |
| `MobileScanLine` | `src/components/mobile/MobileScanLine.tsx` | Simplified scan line |
| `MobileSearchScene` | `src/components/mobile/scenes/MobileSearchScene.tsx` | Full-screen search |
| `useIsMobile` | `src/hooks/use-is-mobile.ts` | Viewport detection hook |
| `useMobileGestures` | `src/hooks/use-mobile-gestures.ts` | Edge-swipe + swipe direction detection |
| `MobileLaunchPage` | `src/app/(launch)/mobile-page.tsx` | Mobile page composition |

### 11.2 Shared code (no changes needed)

All existing hooks, stores, types, and API utilities are consumed as-is:
- `src/hooks/use-coverage-metrics.ts`
- `src/hooks/use-coverage-map-data.ts`
- `src/hooks/use-category-intel.ts`
- `src/hooks/use-intel-bundles.ts`
- `src/hooks/use-threat-picture.ts`
- `src/hooks/use-priority-feed.ts`
- `src/hooks/use-realtime-priority-alerts.ts`
- `src/hooks/use-intel-search.ts`
- `src/stores/ui.store.ts`
- `src/stores/coverage.store.ts`
- `src/stores/auth.store.ts`
- `src/stores/settings.store.ts`
- `src/lib/tarvari-api.ts`
- `src/lib/coverage-utils.ts`
- `src/lib/interfaces/coverage.ts`
- `src/lib/interfaces/intel-bundles.ts`
- `src/lib/morph-types.ts`

### 11.3 Components that can be reused with mobile adaptations

- `CoverageMap` -- works on mobile as-is; remove `MapNavControls` conditionally
- `PriorityBadge` -- size prop already supports `sm`, `md`, `lg`
- `MapMarkerLayer` + `MapPopup` -- functional as-is
- `ViewModeToggle` -- needs abbreviated labels on mobile
- `TimeRangeSelector` -- needs horizontal chip layout on mobile

### 11.4 Performance considerations

1. **Map tile loading:** The CARTO dark raster tiles are 256px. On mobile Retina displays, @2x tiles are already configured. No change needed, but consider lazy-loading the map on the Theater scene (do not load it on Command scene).
2. **Animation GPU compositing:** All mobile transitions must use GPU-composited properties only (`transform`, `opacity`, `clip-path`). No `width`, `height`, `top`, `left` animations.
3. **Bundle size:** The `MobileShell` and all mobile scenes should be code-split using `next/dynamic` so they are not loaded on desktop.
4. **Image loading:** No images are used in the current UI (all icons are Lucide SVGs, all data is text/map). This is ideal for mobile performance.
5. **Data polling:** The existing refetch intervals (30-60s) are appropriate for mobile. Consider increasing to 90s when the app is in the background (using `visibilitychange` event).

### 11.5 Viewport meta tag

Ensure the following viewport meta tag is set in `layout.tsx`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

The `viewport-fit=cover` is critical for edge-to-edge map rendering on devices with notches. Safe area insets are handled via `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` on the MobileHeader and MobileTabBar respectively.


---

## 12. Phased Delivery Plan

### Phase 1: Foundation (1 week)
- `useIsMobile` hook and conditional rendering in `page.tsx`
- `MobileShell` with scene stack management
- `MobileHeader` and `MobileTabBar`
- `ThreatPulseBackground` ambient effect
- `MobileScanLine`

### Phase 2: Command Scene (1 week)
- `CommandScene` with `ThreatPictureCard` (mobile layout)
- `PriorityFeedStrip` (mobile adaptation)
- Map thumbnail with tap-to-navigate

### Phase 3: Theater Scene (1.5 weeks)
- `TheaterScene` with full-screen `CoverageMap`
- `MobileCategoryGrid` with 2-column layout
- `ViewModeToggle` and `TimeRangeSelector` mobile layouts
- `EdgeGlowIndicators`
- Map marker popups as glass bottom cards

### Phase 4: District Scene + Morph (1.5 weeks)
- `DistrictScene` with stacked layout
- `MobileBottomSheet` reusable component
- `AlertDetailSheet`
- Mobile morph choreography (clip-path circle transition)
- Alert list mobile layout with sort/filter toolbar

### Phase 5: Search + Geo Summary (1 week)
- `MobileSearchScene`
- Geo Summary full-screen scene
- Region drill-down navigation

### Phase 6: Polish + Accessibility (1 week)
- Screen reader testing (VoiceOver, TalkBack)
- Reduced motion verification
- Touch target audit (44px minimum)
- Performance profiling on mid-range devices
- Edge-swipe gesture tuning
- Haptic feedback integration


---

## 13. Open Questions for Client

1. **Notification integration:** Should the mobile view integrate with push notifications (FCM/APNs via a service worker) so P1 alerts can wake the user's phone? This is technically feasible with the existing `useRealtimePriorityAlerts` hook but requires service worker setup.

2. **Offline behavior:** Should the mobile view cache the last-known threat posture and alert list for offline viewing? The current architecture requires a live connection to the TarvaRI API.

3. **Orientation lock:** Should the app lock to portrait mode, or should landscape be supported for map exploration? Landscape would require additional layout work for the Theater and District scenes.

4. **Category grid order:** Should the 2-column grid be ordered by alert count (descending), priority count, alphabetically, or in the fixed order defined by `KNOWN_CATEGORIES`? Desktop uses the fixed order.

5. **Ambient effect intensity:** The ThreatPulseBackground and EdgeGlowIndicators are unconventional. Should these be on by default with a settings toggle to disable, or off by default as an opt-in "immersive mode"?

6. **Bottom sheet vs. full-screen for alert detail:** The current plan uses a bottom sheet (L3) for alert detail. An alternative is a full-screen scene transition (matching the Geo Summary treatment). Full-screen gives more room for long summaries but adds a navigation step. Preference?


---

## 14. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to threat posture (L0 load) | < 2 seconds | First contentful paint of posture badge |
| Time to first alert detail | < 4 taps from app open | Task analysis |
| Map interaction FPS | 60fps on iPhone 13+ | Lighthouse + device profiling |
| Scene transition FPS | 60fps, no dropped frames | Performance observer |
| Touch target compliance | 100% of targets >= 44x44px | Automated audit |
| WCAG 2.2 AA violations | 0 | axe-core automated scan |
| Gesture discoverability | > 80% of testers find swipe-back within 30s | Usability testing |
| Reduced motion compliance | All animations respect preference | Manual verification |


---

*End of document.*


---

## #every-time Review

**Reviewer:** every-time protocol v3.2
**Date:** 2026-03-06
**Cross-referenced against:** ui-design-system.md, interface-architecture.md, information-architecture.md
**Codebase verified:** Yes (hooks, stores, interfaces confirmed at expected paths)

### Rating: B+ -> A+ (after revisions)

All eight required changes have been applied. The document now aligns with the canonical decisions from every-time-synthesis.md and OVERVIEW.md: 3-tab ghost tab bar navigation, 2-column category grid, no user-scalable=no, 12s scan line cycle, 3-phase fast morph, browser history specification, 767px breakpoint, and useIsMobile() returning boolean | null.

This document brings the strongest creative vision of the four and most directly addresses the client's request to "move outside of convention." The scene stack model is conceptually elegant -- mapping ZUI zoom levels to discrete mobile scenes is an insightful reframe. The edge-glow navigation, ThreatPulseBackground, and DataScanReveal ideas are exactly the kind of unconventional choices the client wants. However, the navigation model conflicts fundamentally with the other three documents, and several specific proposals create implementation risk without clear fallbacks.

### Strengths

- **Scene stack concept is the strongest conceptual framework.** Mapping Z0/Z1/Z2+ semantic zoom levels to L0/L1/L2/L3 scenes is the most intellectually coherent bridge between the desktop ZUI and mobile. Even if the exact scene stack implementation is not adopted, this mental model should inform how all documents think about information hierarchy.
- **Unconventional UX commitments directly address the brief.** Edge-glow indicators, ThreatPulseBackground, DataScanReveal, and scene morph transitions are genuinely novel. The client asked for "wow factor" and this document delivers it. The other three documents are more conservative.
- **Gesture vocabulary is the most complete.** The 14-entry gesture table with context, action, and feedback columns is the most thorough gesture specification across all four documents.
- **User flow documentation is excellent.** Three detailed step-by-step flows with wireframes give implementers a clear picture of the intended experience. No other document provides this level of flow detail.
- **Accessibility gesture alternatives are well-specified.** Correctly pairs every swipe with a button alternative, and the one-handed operation analysis is thoughtful.
- **Haptic feedback strategy is unique to this document** and adds a tactile dimension the others miss entirely.

### Issues Found

1. **Scene stack is the most complex navigation model** but is presented without comparative evaluation. The Information Architecture document evaluated four navigation models with a scoring matrix and arrived at a different conclusion (3-tab hybrid). This document should justify the scene stack against alternatives.

2. **Edge-glow as primary navigation is a significant discoverability risk.** The document acknowledges this by including a supplementary nav rail but describes the edge glows as the primary affordance and the nav rail as supplementary. This inversion is dangerous -- edge-glow navigation has no established convention and the 80% discoverability target may be optimistic without onboarding. Recommendation: Invert the hierarchy. The tab bar is primary; edge-glow is supplementary delight.

3. **Category carousel (72x100px pills) is at odds with 3 of 4 documents.** The UI Design System, Interface Architecture, and Information Architecture all recommend a 2-column grid. A carousel of 15 items requires horizontal scrolling to see all categories, showing approximately 4-5 at a time on a 375px screen. The 2-column grid shows 6-8 simultaneously.

4. **The nav rail has 4 items (Map, Categories, Priorities, Search)** which differs from every other document. "Search" as a primary nav item is unusual for a dashboard -- it is an action, not a destination. The IA's 3-tab model (Situation, Map, Intel) is better justified.

5. **The viewport meta tag includes `user-scalable=no`.** This directly violates WCAG 1.4.4 (Resize Text) and conflicts with the accessibility commitments. Remove `maximum-scale=1, user-scalable=no` from the recommendation.

6. **The scan line cycle time (8s) conflicts** with the UI Design System (25s) and Interface Architecture (12s). This needs a single canonical value.

7. **The breakpoint definition says `max-width: 768px`** which includes 768px as mobile. The Interface Architecture and UI Design System use `max-width: 767px`. Align to 767px (mobile = < 768px).

8. **Full 6-phase morph reuse on mobile is over-engineered.** The Interface Architecture's 3-phase fast-path simplification (`idle -> entering-district -> district`) is more appropriate for mobile. The 400ms expanding + 200ms settled + 600ms entering-district chain totals 1.2 seconds -- too slow for mobile.

9. **Missing: how the scene stack interacts with browser history.** If a user at L2 (District) taps the browser back button or the Android system back gesture, which level do they return to?

### Cross-Document Conflicts

| Decision Point | This Document | Conflicts With |
|---|---|---|
| Navigation model | 4-level scene stack + 4-item nav rail | UI (4 tabs), Interface (3 tabs), IA (3 tabs) |
| Category display | Horizontal carousel, 72x100px pills | UI, Interface, IA all recommend 2-column grid |
| Default landing | L0 Command scene (posture-first) | UI (Map tab default), Interface (Map tab default). Agrees with IA. |
| Morph transition | Full 6-phase morph with clip-path circle | UI (morph dropped), Interface (3-phase fast path) |
| Scan line cycle | 8s | UI (25s), Interface (12s) |
| Breakpoint | max-width: 768px (includes 768) | UI/Interface use max-width: 767px |
| Hook name | `useIsMobile()` | UI uses `useMobileDetect()` |

### Recommendations

1. **Adopt the IA's 3-tab model as the navigation foundation**, but incorporate the scene stack's information hierarchy mapping (L0 = Situation tab, L1 = Map tab, L2 = category detail push screen, L3 = alert detail bottom sheet).
2. **Keep the unconventional effects as enhancement layers**, not primary navigation. Edge-glow, ThreatPulseBackground, and DataScanReveal should be implemented but not depended upon for wayfinding.
3. **Replace the carousel with a 2-column grid.** Align with the other three documents.
4. **Use the Interface Architecture's 3-phase fast morph** instead of the full 6-phase sequence.
5. **Remove `user-scalable=no`** from the viewport meta tag.
6. **Align scan line cycle time** to a single canonical value (suggest 12s as a middle ground).

### Required Changes Before Implementation

- [x] Reconcile navigation model with IA's 3-tab recommendation
- [x] Replace horizontal carousel with 2-column grid
- [x] Remove `user-scalable=no` from viewport meta tag
- [x] Align scan line cycle time with other documents
- [x] Simplify morph to 3-phase fast path
- [x] Add browser history / system back button behavior specification
- [x] Clarify breakpoint: 767px max-width
- [x] Rename hook to consistent name across all documents (`useIsMobile` with `boolean | null` return)


---

## Client Decisions (2026-03-06)

The following client decisions affect this document:

- **Q1 -- No offline support.** No service worker or data caching. Online-only.
- **Q2 -- Landscape supported.** All scenes/views must work in both portrait and landscape. Landscape layouts need design consideration (side-by-side arrangements where appropriate).
- **Q3 -- No push notifications for now.** Polling only.
- **Q5 -- Ambient effects ON by default.** Edge glow, ThreatPulseBackground, and scan line are on by default with toggle in settings.
- **Q7 -- Bottom sheet with expand-to-full-screen.** Alert detail starts as bottom sheet but includes an expand button to go full-screen. Collapse button returns to sheet mode. Update user flows accordingly.
- **Q8 -- Allow viewport zoom.** Remove `user-scalable=no` from viewport meta tag recommendation.
