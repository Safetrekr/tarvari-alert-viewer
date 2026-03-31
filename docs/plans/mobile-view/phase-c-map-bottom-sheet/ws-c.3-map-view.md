# WS-C.3: Map View

> **Workstream ID:** WS-C.3
> **Phase:** C -- Map + Bottom Sheet
> **Assigned Agent:** `world-class-ux-designer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.2 (MobileShell `mapContent` slot, `MobileStateView`, tab state), WS-A.3 (spacing/glass/touch target/filter chips tokens, corner bracket tokens, animation timing tokens), WS-C.1 (MobileBottomSheet for marker tap -> alert detail at half-height)
> **Blocks:** WS-C.4 (Map Interactions wires marker tap events, filter chip events, and gesture handlers through these components)
> **Resolves:** None

---

## 1. Objective

Build the Map tab's visual surface: a full-bleed `MobileMapView` wrapper around the shared `CoverageMap`, a `MobileFilterChips` horizontal pill bar for category multi-select, floating `ViewModeToggle` and `TimeRangeSelector` controls at the map's bottom edge, and a GPS "center on me" button using MapLibre's `GeolocateControl` with Oblivion-styled CSS overrides.

This workstream delivers the Map tab's **static structure and data binding**. All markers render, filter chips toggle category state in the coverage store, floating controls switch view mode and time range, and the GPS button geolocates the user. The marker tap -> bottom sheet interaction is **structurally wired** here (the `onMarkerClick` and `onInspect` callbacks call `coverage.store.selectMapAlert()`) but the bottom sheet rendering that responds to that store change is WS-C.1's responsibility, and the full gesture and event coordination is WS-C.4's scope.

The desktop experience must remain completely unchanged.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `MobileMapView` component | Full-bleed wrapper around `CoverageMap`. Height fills available space via flexbox. Lazy-loaded via `next/dynamic` with `ssr: false`. Removes desktop's `MapNavControls` (native MapLibre touch gestures per C14). Removes desktop corner bracket decorations. Adds `GeolocateControl` with Oblivion CSS override. |
| `MobileFilterChips` component | 40px-tall horizontal scroll bar above the map. Renders an `[All]` chip plus one chip per `KNOWN_CATEGORIES` entry. Multi-select via `coverage.store.toggleCategory()`. Scroll-snap alignment. Fade-out gradient at scroll edges. Category-colored active chip accents. |
| Floating `ViewModeToggle` | Shared `ViewModeToggle` component positioned as a floating glass pill at the bottom-left of the map area. 48px minimum touch targets. Glass background per `--glass-header-bg` / `--glass-header-blur`. |
| Floating `TimeRangeSelector` | Shared `TimeRangeSelector` component positioned as a floating glass pill at the bottom-right of the map area. Same glass treatment. |
| GPS "center on me" button | MapLibre `GeolocateControl` added to the map instance with Oblivion-styled CSS overrides. Lower-right floating position, above the controls bar. 48px touch target. |
| Map data wiring | `useCoverageMapData(filters)` called with filters derived from `coverage.store` state (`selectedCategories`, `mapTimePreset`, `customTimeStart`, `customTimeEnd`). Markers passed to `CoverageMap`. |
| Marker tap handler | `onMarkerClick` callback calls `coverage.store.selectMapAlert()` which stores the alert ID, category, and basic data. WS-C.1's `MobileBottomSheet` listens to this store field and opens at half-height. |
| `onInspect` handler | Calls `coverage.store.selectMapAlert()` from the `MapPopup`'s INSPECT button. On mobile, the popup itself may be suppressed in favor of direct bottom-sheet opening (decision in D-3). |
| CSS file `mobile-map-view.css` | Layout for map tab container, filter chips scrolling, floating controls positioning, `GeolocateControl` CSS overrides, fade gradients. |
| Integration in `MobileView` | Wire `MobileMapView` + `MobileFilterChips` + floating controls into MobileShell's `mapContent` prop. |
| Unit tests | Filter chip selection sync, map height calculation, GPS control rendering, filter chip scroll behavior. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileBottomSheet` component | WS-C.1 builds the sheet. This WS calls `selectMapAlert()` in the store; the sheet responds. |
| Alert detail sheet content | WS-D.2 (Alert Detail) builds the content rendered inside the half-height sheet. |
| Full marker tap gesture coordination | WS-C.4 (Map Interactions) handles the complete event flow: suppress popup on mobile, fly-to animation, sheet open timing, and dismiss coordination. |
| Map Ledger (severity color legend) | Deferred to Phase F or cut. The legend is P3-Low priority per information-architecture Section 2.1. |
| Cluster tap -> expand behavior | Already handled by `CoverageMap`'s existing `handleClick` (line 283-307). No modification needed. |
| Landscape layout variant | WS-F.1 scope. This WS builds portrait-first. |
| Pull-to-refresh on map tab | WS-F.5 scope. Map tab does not scroll; pull-to-refresh is not applicable to the map surface itself. |
| `CoverageMap` component modifications | The shared component is used as-is. No changes to its internal behavior, marker rendering, clustering, or styling. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-A.2 `MobileShell` | `mapContent` prop slot in `MobileShellProps` for rendering the map tab | Pending (WS-A.2) |
| WS-A.2 `MobileStateView` | `MobileStateView` component for loading/error states when map data is fetching | Pending (WS-A.2 D-8) |
| WS-A.3 `mobile-tokens.css` | `--space-filter-chips-height` (40px), `--space-header-height` (48px), `--space-bottom-nav-height` (56px), `--glass-header-bg`, `--glass-header-blur`, `--touch-target-comfortable` (48px), `--touch-target-min` (44px), `--duration-transition` (250ms mobile), `--corner-bracket-size` (10px), `--corner-bracket-offset` (-4px), `--corner-bracket-thickness` (1px), `--corner-bracket-color`, `--space-content-padding` (12px) | Pending (WS-A.3) |
| WS-A.4 `viewport-fit=cover` | `env(safe-area-inset-bottom)` active on notched devices; `--safe-area-bottom` token | Pending (WS-A.4) |
| WS-C.1 `MobileBottomSheet` | Sheet that listens to `coverage.store.selectedMapAlertId` and opens at half-height when non-null | Pending (WS-C.1) |
| `src/components/coverage/CoverageMap.tsx` | Shared map component accepting `markers`, `categoryId`, `categoryName`, `isLoading`, `overview`, `onMarkerClick`, `onInspect`, `selectedMarkerId`, `externalMapRef` props | EXISTS (536 lines) |
| `src/components/coverage/MapMarkerLayer.tsx` | GeoJSON marker layer with clustering, severity coloring, new-alert animations | EXISTS (315 lines) |
| `src/components/coverage/MapPopup.tsx` | Glass-themed popup with INSPECT button | EXISTS (168 lines) |
| `src/components/coverage/ViewModeToggle.tsx` | Segmented toggle for view mode switching | EXISTS (125 lines) |
| `src/components/coverage/TimeRangeSelector.tsx` | Time preset pills + custom date picker | EXISTS (290 lines) |
| `src/hooks/use-coverage-map-data.ts` | `useCoverageMapData(filters?)` returning `UseQueryResult<MapMarker[]>` | EXISTS (135 lines) |
| `src/stores/coverage.store.ts` | `selectedCategories`, `toggleCategory()`, `clearSelection()`, `viewMode`, `setViewMode()`, `mapTimePreset`, `setMapTimePreset()`, `customTimeStart`, `customTimeEnd`, `setCustomTimeRange()`, `selectMapAlert()`, `selectedMapAlertId` | EXISTS (467 lines) |
| `src/lib/interfaces/coverage.ts` | `KNOWN_CATEGORIES`, `CategoryMeta`, `getCategoryColor()`, `getCategoryMeta()` | EXISTS (412 lines) |
| `src/lib/coverage-utils.ts` | `MapMarker` type | EXISTS |
| `maplibre-gl` | `GeolocateControl` class for GPS positioning | EXISTS (dependency) |
| `react-map-gl/maplibre` | `useMap()` hook for accessing map instance to add `GeolocateControl` | EXISTS (dependency) |
| Lucide React icons | `LocateFixed` (GPS button fallback if needed), `X` (clear filter) | EXISTS (dependency) |
| `src/lib/interfaces/mobile.ts` | `MobileTab` type | Pending (WS-A.2) |

---

## 4. Deliverables

### D-1: `MobileMapView` component (`src/components/mobile/MobileMapView.tsx`)

A wrapper around the shared `CoverageMap` that adapts it for the mobile Map tab context. Loaded via `next/dynamic` with `ssr: false` to match the existing pattern for WebGL components.

**Dynamic import (in parent):**

```typescript
const MobileMapView = dynamic(
  () => import('@/components/mobile/MobileMapView').then((m) => ({ default: m.MobileMapView })),
  { ssr: false },
)
```

**Props interface:**

```typescript
interface MobileMapViewProps {
  /** Map markers from useCoverageMapData. */
  readonly markers: MapMarker[]
  /** Whether marker data is loading. */
  readonly isLoading?: boolean
  /** Currently selected alert ID for highlight ring. */
  readonly selectedMarkerId?: string | null
  /** Called when an unclustered marker is tapped. */
  readonly onMarkerTap?: (markerId: string) => void
  /** Called when INSPECT is tapped on a marker popup. */
  readonly onInspect?: (id: string, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void
}
```

**Key behaviors:**

1. **Container sizing:** The `MobileMapView` renders a `<div>` with `flex: 1` and `min-height: 0` so it fills the remaining vertical space in the map tab's flex column layout. Width is `100%` (full-bleed). No explicit `calc()` -- the parent flex container handles sizing (see D-6).

2. **CoverageMap prop mapping:**

   | MobileMapView behavior | CoverageMap prop | Value | Rationale |
   |------------------------|-----------------|-------|-----------|
   | Full-bleed, not overview | `overview` | `false` (default) | Desktop uses `overview` for the global map that stays zoomed out. Mobile map auto-fits to marker bounds for immediate geographic context. |
   | Category label | `categoryId` | `'all'` | Mobile map shows all categories; filtering is via `useCoverageMapData` query params, not CoverageMap props. |
   | Category name (ARIA) | `categoryName` | `'All Categories'` or dynamic label based on selectedCategories | When 1 category is selected, use its display name. When multiple, use "N categories". When none, use "All Categories". |
   | Markers | `markers` | Passed through from prop | Filtered markers from `useCoverageMapData`. |
   | Loading | `isLoading` | Passed through from prop | Shows loading overlay inside CoverageMap. |
   | Marker click | `onMarkerClick` | `onMarkerTap` prop | Forwarded. Parent wires to `selectMapAlert()`. |
   | Inspect action | `onInspect` | `onInspect` prop | Forwarded. Parent wires to `selectMapAlert()`. |
   | Selected marker | `selectedMarkerId` | Passed through from prop | Highlight ring on the selected marker. |
   | External map ref | `externalMapRef` | Internal `useRef<MapRef>(null)` | Held internally for `GeolocateControl` attachment. |

3. **Desktop `MapNavControls` suppression:** The `CoverageMap` component renders `MapNavControls` internally (line 465). Since `CoverageMap` is a shared component and we cannot modify it per the scope constraint, the mobile CSS override hides the nav controls. The mobile CSS file targets the control container's position (absolute, top: 10px, left: 10px) and hides it within the mobile viewport:

   ```css
   @media (max-width: 767px) {
     .mobile-map-container [style*="top: 10"][style*="left: 10"] {
       display: none !important;
     }
   }
   ```

   **Alternative (preferred):** Add a `hideNavControls` boolean prop to `CoverageMap`. This is a minimal, backward-compatible change (defaults to `false`). When `true`, the `<MapNavControls>` render is skipped. Desktop passes nothing (controls render); mobile passes `hideNavControls`. See D-9 for this modification.

4. **Corner bracket suppression:** The desktop `CoverageMap` renders decorative corner brackets (lines 406-412). On mobile, these are suppressed by the same mechanism as MapNavControls (D-9 adds a `hideBrackets` prop, or CSS hides them). The map renders full-bleed without decorative framing.

5. **GeolocateControl attachment:** After the map's `onLoad` event fires, a MapLibre `GeolocateControl` is instantiated and added to the map instance via `mapRef.current.getMap().addControl(geoControl, 'bottom-right')`. The control is configured with `positionOptions: { enableHighAccuracy: true }`, `trackUserLocation: false` (single-shot), and `showUserLocation: true`. See D-4 for CSS overrides.

6. **Popup behavior on mobile:** The `CoverageMap`'s built-in popup (`MapPopup`) renders on marker click. On mobile, this popup is acceptable as a brief tooltip before the bottom sheet opens. WS-C.4 may later choose to suppress it via the `onMarkerClick` callback (by setting popup to null immediately). For this workstream, the popup renders as-is.

### D-2: `MobileFilterChips` component (`src/components/mobile/MobileFilterChips.tsx`)

A 40px horizontal scroll bar rendering category filter pills above the map.

**Props interface:**

```typescript
interface MobileFilterChipsProps {
  /** Currently selected category IDs. Empty = all selected. */
  readonly selectedCategories: string[]
  /** Called when a category chip is toggled. */
  readonly onToggle: (categoryId: string) => void
  /** Called when the [All] chip is tapped (clears all filters). */
  readonly onClearAll: () => void
}
```

**Structure:**

```
<div class="mobile-filter-chips" role="toolbar" aria-label="Category filters">
  <div class="mobile-filter-chips-scroll">
    <button class="mobile-chip mobile-chip-all" data-active={noneSelected}>
      All
    </button>
    {KNOWN_CATEGORIES.map(cat => (
      <button class="mobile-chip" data-active={isSelected} style={{ --chip-color: cat.color }}>
        <span class="mobile-chip-icon">{icon}</span>
        {cat.shortName}
      </button>
    ))}
  </div>
</div>
```

**Visual specification:**

| Property | Value | Token Reference |
|----------|-------|----------------|
| Container height | 40px | `var(--space-filter-chips-height)` |
| Container background | `rgba(5, 9, 17, 0.85)` | `var(--glass-header-bg)` |
| Container backdrop-filter | `blur(8px) saturate(120%)` | `var(--glass-header-blur)` |
| Bottom border | `1px solid rgba(255, 255, 255, 0.06)` | `var(--color-border-subtle)` |
| Scroll padding | `0 12px` | `var(--space-content-padding)` |
| Chip gap | `8px` | `var(--space-inline-gap)` |
| Chip height | `28px` | -- (centered in 40px container) |
| Chip padding | `0 10px` | -- |
| Chip border-radius | `14px` (pill) | -- |
| Chip font | `var(--font-mono)`, 10px, weight 600, uppercase, `letter-spacing: 0.06em` | `var(--text-caption)`, `var(--font-mono)` |
| Chip icon size | 12px | -- |

**Chip visual states:**

| State | Background | Border | Text color | Icon opacity |
|-------|-----------|--------|------------|-------------|
| Inactive (no filter active, "All" mode) | `rgba(255, 255, 255, 0.04)` | `1px solid rgba(255, 255, 255, 0.08)` | `rgba(255, 255, 255, 0.35)` | 0.35 |
| Active (this category selected) | `color-mix(in srgb, var(--chip-color) 15%, transparent)` | `1px solid color-mix(in srgb, var(--chip-color) 30%, transparent)` | `var(--chip-color)` at 0.8 opacity | 0.8 |
| All chip active (no filters = all shown) | `rgba(255, 255, 255, 0.08)` | `1px solid rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.60)` | -- |
| All chip inactive (some filters active) | Same as inactive chip | Same as inactive chip | `rgba(255, 255, 255, 0.25)` | -- |

**Scroll behavior:**

- `overflow-x: auto` with `-webkit-overflow-scrolling: touch`.
- `scroll-snap-type: x mandatory` on the scroll container.
- `scroll-snap-align: start` on each chip.
- `scrollbar-width: none` / `::-webkit-scrollbar { display: none }` to hide the scrollbar.
- Fade-out gradients at left and right edges using `::before` and `::after` pseudo-elements with `linear-gradient(to right, var(--color-void), transparent)` / `linear-gradient(to left, var(--color-void), transparent)`. Width: 24px each. `pointer-events: none`. Only the right gradient shows at initial scroll position; both show when scrolled to the middle; only left when scrolled to the end. Scroll position is detected via an `onScroll` handler that checks `scrollLeft` and `scrollWidth - scrollLeft - clientWidth`.

**Selection logic:**

- When `selectedCategories` is empty, the `[All]` chip renders as active. All category chips render as inactive (neutral state -- all categories are shown).
- Tapping a category chip calls `onToggle(categoryId)` which calls `coverage.store.toggleCategory(id)`. If the category was not selected, it becomes selected (active). If it was selected, it becomes deselected.
- Tapping `[All]` calls `onClearAll()` which calls `coverage.store.clearSelection()`.
- When one or more categories are selected, only those chips show as active. The `[All]` chip shows as inactive.
- The active chip state uses the category's own color (`getCategoryColor(id)`) for the tinted background, border, and text, creating a colored glow effect matching the Oblivion aesthetic.

**Accessibility:**

- Container: `role="toolbar"`, `aria-label="Category filters"`.
- Each chip: `role="button"`, `aria-pressed={isActive}`, `aria-label="Filter by {displayName}"` (e.g., "Filter by Seismic").
- `[All]` chip: `aria-label="Show all categories"`, `aria-pressed={noneSelected}`.
- Focus order follows DOM order (left-to-right scroll).

### D-3: Floating Controls Bar (`src/components/mobile/MobileMapControls.tsx`)

A fixed-position bar at the bottom of the map area containing `ViewModeToggle` and `TimeRangeSelector`.

**Props interface:**

```typescript
interface MobileMapControlsProps {
  /** Current view mode. */
  readonly viewMode: ViewMode
  /** Called when view mode changes. */
  readonly onViewModeChange: (mode: ViewMode) => void
  /** Optional count badges for view mode segments. */
  readonly viewModeCounts?: Partial<Record<ViewMode, number>>
  /** Current time preset. */
  readonly timePreset: TimePreset | 'custom'
  /** Custom start date (ISO 8601). */
  readonly customTimeStart: string | null
  /** Custom end date (ISO 8601). */
  readonly customTimeEnd: string | null
  /** Called when a time preset is selected. */
  readonly onTimePresetChange: (preset: TimePreset) => void
  /** Called when custom date range changes. */
  readonly onCustomTimeChange: (start: string | null, end: string | null) => void
}
```

**Structure:**

```
<div class="mobile-map-controls">
  <ViewModeToggle value={viewMode} onChange={onViewModeChange} counts={viewModeCounts} />
  <TimeRangeSelector
    value={timePreset}
    customStart={customTimeStart}
    customEnd={customTimeEnd}
    onPresetChange={onTimePresetChange}
    onCustomChange={onCustomTimeChange}
  />
</div>
```

**Visual specification:**

| Property | Value | Token Reference |
|----------|-------|----------------|
| Height | `auto` (content-driven, typically ~40px) | -- |
| Position | Relative, at the bottom of the map tab flex column | -- |
| Background | `rgba(5, 9, 17, 0.85)` | `var(--glass-header-bg)` |
| Backdrop-filter | `blur(8px) saturate(120%)` | `var(--glass-header-blur)` |
| Top border | `1px solid rgba(255, 255, 255, 0.06)` | `var(--color-border-subtle)` |
| Padding | `6px 12px` | -- |
| Display | `flex`, `justify-content: space-between`, `align-items: center` | -- |
| Touch targets | Both child controls already have >= 44px touch targets from their internal button sizing | Per WCAG SC 2.5.8 |

**Design decision -- reuse vs. wrap:** The `ViewModeToggle` and `TimeRangeSelector` are used as-is (zero modifications). Their existing styling (glass pill backgrounds, mono font, motion layoutId animations) is consistent with the mobile aesthetic. The `MobileMapControls` wrapper provides only the layout positioning and glass backdrop.

**TimeRangeSelector mobile adaptation:** The existing `TimeRangeSelector` renders all 10 presets in a single row. On a 375px-wide mobile screen, this overflows. The controls bar container allows horizontal overflow scrolling (`overflow-x: auto`) so the TimeRangeSelector can be scrolled if it overflows. The `ViewModeToggle` is `flex-shrink: 0` to keep it visible. For very narrow screens, the TimeRangeSelector's custom date picker expands downward (as designed) which may overlap the bottom nav. This is acceptable; WS-C.4 can add a bottom-sheet variant if usability testing reveals issues.

### D-4: GPS "Center on Me" (`GeolocateControl` CSS Override)

MapLibre's native `GeolocateControl` provides GPS positioning, accuracy circle display, and a locate button. It is added programmatically to the map instance after load.

**Implementation (inside `MobileMapView`):**

```typescript
const geoControlRef = useRef<maplibregl.GeolocateControl | null>(null)

const handleMapLoad = useCallback(() => {
  const map = mapRef.current?.getMap()
  if (!map || geoControlRef.current) return

  const geoControl = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: false,
    showUserLocation: true,
    showAccuracyCircle: false,
  })

  geoControlRef.current = geoControl
  map.addControl(geoControl, 'bottom-right')
}, [])
```

**CSS overrides for Oblivion aesthetic:**

MapLibre's `GeolocateControl` renders a `<button>` inside a `<div class="maplibregl-ctrl maplibregl-ctrl-group">`. The default styling is white with a blue active state. The overrides in `mobile-map-view.css` restyle it to match the dark-field aesthetic:

```css
@media (max-width: 767px) {
  /* GeolocateControl container -- Oblivion dark glass */
  .mobile-map-container .maplibregl-ctrl-bottom-right {
    bottom: 8px;
    right: 8px;
  }

  .mobile-map-container .maplibregl-ctrl-group {
    background: rgba(5, 9, 17, 0.85);
    backdrop-filter: blur(8px) saturate(120%);
    -webkit-backdrop-filter: blur(8px) saturate(120%);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .mobile-map-container .maplibregl-ctrl-group:not(:empty) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  /* GeolocateControl button */
  .mobile-map-container .maplibregl-ctrl-geolocate {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* Geolocate icon SVG -- recolor to white at low opacity */
  .mobile-map-container .maplibregl-ctrl-geolocate .maplibregl-ctrl-icon {
    background-image: none;
  }

  .mobile-map-container .maplibregl-ctrl-geolocate svg,
  .mobile-map-container .maplibregl-ctrl-geolocate .maplibregl-ctrl-icon {
    filter: invert(1) brightness(0.6);
    opacity: 0.5;
    transition: opacity 150ms ease;
  }

  /* Active state (GPS acquired) */
  .mobile-map-container .maplibregl-ctrl-geolocate.maplibregl-ctrl-geolocate-active svg,
  .mobile-map-container .maplibregl-ctrl-geolocate.maplibregl-ctrl-geolocate-active .maplibregl-ctrl-icon {
    filter: invert(1) brightness(1);
    opacity: 0.8;
  }

  /* Waiting state (GPS acquiring) */
  .mobile-map-container .maplibregl-ctrl-geolocate.maplibregl-ctrl-geolocate-waiting svg,
  .mobile-map-container .maplibregl-ctrl-geolocate.maplibregl-ctrl-geolocate-waiting .maplibregl-ctrl-icon {
    animation: gps-pulse 1.5s ease-in-out infinite;
  }

  /* User location dot -- restyle from blue to white */
  .mobile-map-container .maplibregl-user-location-dot {
    background-color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.4);
    width: 10px;
    height: 10px;
  }

  .mobile-map-container .maplibregl-user-location-dot::before {
    background-color: rgba(255, 255, 255, 0.15);
  }

  /* Hide the default accuracy circle (we disabled it in options, but belt-and-suspenders) */
  .mobile-map-container .maplibregl-user-location-accuracy-circle {
    display: none;
  }
}

@keyframes gps-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
```

**Positioning:** The `GeolocateControl` is placed at `bottom-right` by MapLibre. The CSS overrides shift it 8px from the bottom-right corner of the map container. This positions it above the `MobileMapControls` bar (which is outside the map container, in the parent flex layout).

**Permissions:** The browser will prompt for geolocation permission on first tap. If denied, the control shows an error state (MapLibre handles this natively). No custom error handling is needed.

**Accessibility:** MapLibre's `GeolocateControl` includes `aria-label="Find my location"` and `role="button"` by default. The Oblivion CSS overrides do not alter these attributes.

### D-5: `MobileMapTabContent` component (`src/components/mobile/MobileMapTabContent.tsx`)

The orchestration component that wires data hooks, store state, and child components together. This is the component that gets passed to MobileShell's `mapContent` prop.

**Structure:**

```typescript
'use client'

import dynamic from 'next/dynamic'
import { useMemo, useCallback } from 'react'
import { useCoverageMapData, type CoverageMapFilters } from '@/hooks/use-coverage-map-data'
import { useIntelBundles } from '@/hooks/use-intel-bundles'
import { useCoverageStore, timePresetToStartDate } from '@/stores/coverage.store'
import type { TimePreset } from '@/stores/coverage.store'
import { MobileFilterChips } from './MobileFilterChips'
import { MobileMapControls } from './MobileMapControls'
import { MobileStateView } from './MobileStateView'

const MobileMapView = dynamic(
  () => import('./MobileMapView').then((m) => ({ default: m.MobileMapView })),
  { ssr: false, loading: () => <MobileMapViewSkeleton /> },
)

function MobileMapViewSkeleton() {
  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(10, 14, 24, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.15)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Initializing map...
      </span>
    </div>
  )
}
```

**Data wiring:**

```typescript
export function MobileMapTabContent() {
  // Store state
  const selectedCategories = useCoverageStore((s) => s.selectedCategories)
  const toggleCategory = useCoverageStore((s) => s.toggleCategory)
  const clearSelection = useCoverageStore((s) => s.clearSelection)
  const viewMode = useCoverageStore((s) => s.viewMode)
  const setViewMode = useCoverageStore((s) => s.setViewMode)
  const mapTimePreset = useCoverageStore((s) => s.mapTimePreset)
  const customTimeStart = useCoverageStore((s) => s.customTimeStart)
  const customTimeEnd = useCoverageStore((s) => s.customTimeEnd)
  const setMapTimePreset = useCoverageStore((s) => s.setMapTimePreset)
  const setCustomTimeRange = useCoverageStore((s) => s.setCustomTimeRange)
  const selectMapAlert = useCoverageStore((s) => s.selectMapAlert)
  const selectedMapAlertId = useCoverageStore((s) => s.selectedMapAlertId)

  // Build filters from store state (same pattern as desktop page.tsx lines 200-214)
  const mapFilters = useMemo<CoverageMapFilters | undefined>(() => {
    const f: CoverageMapFilters = {}
    if (selectedCategories.length > 0) {
      f.categories = selectedCategories
    }
    if (mapTimePreset !== 'all' && mapTimePreset !== 'custom') {
      f.startDate = timePresetToStartDate(mapTimePreset)
    }
    if (mapTimePreset === 'custom') {
      if (customTimeStart) f.startDate = customTimeStart
      if (customTimeEnd) f.endDate = customTimeEnd
    }
    return Object.keys(f).length > 0 ? f : undefined
  }, [selectedCategories, mapTimePreset, customTimeStart, customTimeEnd])

  const { data: mapMarkers = [], isLoading } = useCoverageMapData(mapFilters)
  const { data: bundles = [] } = useIntelBundles(viewMode)

  // Marker tap -> store selection for bottom sheet
  const handleMarkerTap = useCallback((markerId: string) => {
    // The marker ID is stored; WS-C.4 coordinates the full flow.
    // For now, this is a no-op placeholder. The actual selectMapAlert call
    // happens via onInspect (which has the full data).
  }, [])

  const handleInspect = useCallback(
    (id: string, category: string, basic: { title: string; severity: string; ingestedAt: string }) => {
      selectMapAlert(id, category, basic)
    },
    [selectMapAlert],
  )

  return (
    <div className="mobile-map-tab">
      <MobileFilterChips
        selectedCategories={selectedCategories}
        onToggle={toggleCategory}
        onClearAll={clearSelection}
      />
      <MobileMapView
        markers={mapMarkers}
        isLoading={isLoading}
        selectedMarkerId={selectedMapAlertId}
        onMarkerTap={handleMarkerTap}
        onInspect={handleInspect}
      />
      <MobileMapControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewModeCounts={{
          'all-bundles': bundles.length > 0 ? bundles.length : undefined,
        }}
        timePreset={mapTimePreset}
        customTimeStart={customTimeStart}
        customTimeEnd={customTimeEnd}
        onTimePresetChange={setMapTimePreset}
        onCustomTimeChange={setCustomTimeRange}
      />
    </div>
  )
}
```

**Layout CSS class `.mobile-map-tab`:**

```css
.mobile-map-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;  /* Map tab does not scroll */
}
```

This flex column stacks: `MobileFilterChips` (40px fixed) -> `MobileMapView` (flex: 1, fills remaining) -> `MobileMapControls` (auto height, ~40px).

### D-6: CSS file (`src/styles/mobile-map-view.css`)

Dedicated CSS for all Map tab components. Imported by `MobileMapTabContent.tsx`.

**Contents:**

```css
/* ==========================================================================
   Mobile Map View -- layout, filter chips, controls, GPS override
   Phase C / WS-C.3
   ========================================================================== */

/* Map tab flex container -- fills MobileShell content area */
.mobile-map-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* --------------------------------------------------------------------------
   Filter Chips
   -------------------------------------------------------------------------- */

.mobile-filter-chips {
  position: relative;
  height: var(--space-filter-chips-height, 40px);
  flex-shrink: 0;
  background: var(--glass-header-bg, rgba(5, 9, 17, 0.85));
  backdrop-filter: var(--glass-header-blur, blur(8px) saturate(120%));
  -webkit-backdrop-filter: var(--glass-header-blur, blur(8px) saturate(120%));
  border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
  z-index: 1;
}

.mobile-filter-chips-scroll {
  display: flex;
  align-items: center;
  gap: var(--space-inline-gap, 8px);
  height: 100%;
  padding: 0 var(--space-content-padding, 12px);
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.mobile-filter-chips-scroll::-webkit-scrollbar {
  display: none;
}

/* Fade gradients at scroll edges */
.mobile-filter-chips::before,
.mobile-filter-chips::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease;
}

.mobile-filter-chips::before {
  left: 0;
  background: linear-gradient(to right, var(--color-void, #050911), transparent);
}

.mobile-filter-chips::after {
  right: 0;
  background: linear-gradient(to left, var(--color-void, #050911), transparent);
}

.mobile-filter-chips[data-scroll-left='true']::before {
  opacity: 1;
}

.mobile-filter-chips[data-scroll-right='true']::after {
  opacity: 1;
}

/* Individual chip */
.mobile-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.35);
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  scroll-snap-align: start;
  transition:
    background var(--duration-hover, 150ms) ease,
    border-color var(--duration-hover, 150ms) ease,
    color var(--duration-hover, 150ms) ease;
  -webkit-tap-highlight-color: transparent;
}

/* Active category chip -- uses CSS custom property --chip-color set via inline style */
.mobile-chip[data-active='true'] {
  background: color-mix(in srgb, var(--chip-color, rgba(255, 255, 255, 0.15)) 15%, transparent);
  border-color: color-mix(in srgb, var(--chip-color, rgba(255, 255, 255, 0.30)) 30%, transparent);
  color: var(--chip-color, rgba(255, 255, 255, 0.8));
}

/* All chip active (no filters) */
.mobile-chip-all[data-active='true'] {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.60);
}

/* All chip inactive (some filters active) */
.mobile-chip-all[data-active='false'] {
  color: rgba(255, 255, 255, 0.25);
}

/* Chip icon */
.mobile-chip-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  opacity: 0.5;
}

.mobile-chip[data-active='true'] .mobile-chip-icon {
  opacity: 0.9;
}

/* --------------------------------------------------------------------------
   Map Container
   -------------------------------------------------------------------------- */

.mobile-map-container {
  flex: 1;
  min-height: 0;
  position: relative;
  width: 100%;
}

/* Hide desktop MapNavControls (d-pad and zoom buttons) on mobile */
@media (max-width: 767px) {
  .mobile-map-container .maplibregl-ctrl-top-left {
    display: none !important;
  }
}

/* --------------------------------------------------------------------------
   Floating Controls Bar
   -------------------------------------------------------------------------- */

.mobile-map-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 6px var(--space-content-padding, 12px);
  background: var(--glass-header-bg, rgba(5, 9, 17, 0.85));
  backdrop-filter: var(--glass-header-blur, blur(8px) saturate(120%));
  -webkit-backdrop-filter: var(--glass-header-blur, blur(8px) saturate(120%));
  border-top: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.mobile-map-controls::-webkit-scrollbar {
  display: none;
}

/* Ensure ViewModeToggle stays visible when TimeRangeSelector overflows */
.mobile-map-controls > :first-child {
  flex-shrink: 0;
}

/* --------------------------------------------------------------------------
   GeolocateControl -- Oblivion dark glass override
   -------------------------------------------------------------------------- */

@media (max-width: 767px) {
  .mobile-map-container .maplibregl-ctrl-bottom-right {
    bottom: 8px;
    right: 8px;
  }

  .mobile-map-container .maplibregl-ctrl-group {
    background: rgba(5, 9, 17, 0.85);
    backdrop-filter: blur(8px) saturate(120%);
    -webkit-backdrop-filter: blur(8px) saturate(120%);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .mobile-map-container .maplibregl-ctrl-geolocate {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  /* Recolor the SVG icon to match Oblivion white-on-dark */
  .mobile-map-container .maplibregl-ctrl-icon.maplibregl-ctrl-geolocate {
    filter: invert(1) brightness(0.6);
    opacity: 0.5;
    transition: opacity 150ms ease;
  }

  .mobile-map-container .maplibregl-ctrl-geolocate.maplibregl-ctrl-geolocate-active .maplibregl-ctrl-icon {
    filter: invert(1) brightness(1);
    opacity: 0.8;
  }

  .mobile-map-container .maplibregl-ctrl-geolocate.maplibregl-ctrl-geolocate-waiting .maplibregl-ctrl-icon {
    animation: gps-pulse 1.5s ease-in-out infinite;
  }

  /* User location dot -- white instead of MapLibre default blue */
  .mobile-map-container .maplibregl-user-location-dot {
    background-color: rgba(255, 255, 255, 0.8) !important;
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.4) !important;
    width: 10px !important;
    height: 10px !important;
    border: none !important;
  }

  .mobile-map-container .maplibregl-user-location-dot::before {
    background-color: rgba(255, 255, 255, 0.15) !important;
  }

  .mobile-map-container .maplibregl-user-location-accuracy-circle {
    display: none !important;
  }
}

@keyframes gps-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}

/* --------------------------------------------------------------------------
   MapPopup touch adaptation
   -------------------------------------------------------------------------- */

@media (max-width: 767px) {
  /* Increase popup tap targets on mobile */
  .mobile-map-container .maplibregl-popup-content {
    padding: 0;
  }

  /* Enlarge the close button hit area */
  .mobile-map-container .maplibregl-popup-close-button {
    width: 44px;
    height: 44px;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* --------------------------------------------------------------------------
   Reduced motion
   -------------------------------------------------------------------------- */

@media (prefers-reduced-motion: reduce) {
  .mobile-chip {
    transition: none;
  }

  @keyframes gps-pulse {
    0%, 100% { opacity: 0.5; }
  }
}
```

### D-7: `CoverageMap` minimal modification (`src/components/coverage/CoverageMap.tsx`)

Add two optional boolean props to the shared `CoverageMap` to allow mobile to suppress desktop-specific decorative elements without CSS hacks.

**Change scope:** Add props to the interface and wrap the existing render logic in conditionals.

**Props additions:**

```typescript
interface CoverageMapProps {
  // ... existing props unchanged ...
  /** When true, hides the MapNavControls (d-pad + zoom). Default: false. */
  readonly hideNavControls?: boolean
  /** When true, hides the decorative corner bracket overlays. Default: false. */
  readonly hideBrackets?: boolean
}
```

**Render changes:**

Line 406-412 (corner brackets): wrap in `{!hideBrackets && ( ... )}`.

Line 465 (`<MapNavControls mapRef={mapRef} />`): wrap in `{!hideNavControls && <MapNavControls mapRef={mapRef} />}`.

**Backward compatibility:** Both props default to `false`/`undefined`. The desktop page passes neither prop, so desktop behavior is unchanged. `MobileMapView` passes `hideNavControls` and `hideBrackets`.

### D-8: Integration in `MobileView`

After WS-A.2 creates the `MobileView.tsx` stub, add the map content:

```typescript
import { MobileMapTabContent } from '@/components/mobile/MobileMapTabContent'

// Inside MobileView render:
<MobileShell
  mapContent={<MobileMapTabContent />}
  // ... other slots
/>
```

This is a single line addition. `MobileMapTabContent` handles all its own data fetching and store subscriptions.

### D-9: Unit Tests

**`src/components/mobile/__tests__/MobileFilterChips.test.tsx`:**

| Test | Description |
|------|-------------|
| TC-1 | Renders `[All]` chip plus 15 category chips (16 total buttons). |
| TC-2 | When `selectedCategories=[]`, `[All]` chip has `data-active="true"`, all category chips have `data-active="false"`. |
| TC-3 | Tapping a category chip calls `onToggle` with the correct category ID. |
| TC-4 | Tapping `[All]` chip calls `onClearAll`. |
| TC-5 | When `selectedCategories=['seismic']`, the Seismic chip has `data-active="true"`, all others have `data-active="false"`, and `[All]` has `data-active="false"`. |
| TC-6 | When `selectedCategories=['seismic', 'weather']`, both Seismic and Weather chips are active. |
| TC-7 | Each chip has correct `aria-pressed` value matching its active state. |
| TC-8 | Scroll container has `scroll-snap-type: x mandatory` computed style. |

**`src/components/mobile/__tests__/MobileMapView.test.tsx`:**

| Test | Description |
|------|-------------|
| TC-9 | Renders `CoverageMap` with `overview={false}` (verify prop forwarded). |
| TC-10 | Renders `CoverageMap` with `hideNavControls` and `hideBrackets` props. |
| TC-11 | Forwards `markers`, `isLoading`, `selectedMarkerId` to `CoverageMap`. |
| TC-12 | `onMarkerTap` callback is forwarded as `onMarkerClick`. |
| TC-13 | `onInspect` callback is forwarded. |
| TC-14 | Map container has class `mobile-map-container`. |

**`src/components/mobile/__tests__/MobileMapTabContent.test.tsx`:**

| Test | Description |
|------|-------------|
| TC-15 | Calls `useCoverageMapData` with correct filters when `selectedCategories` has values. |
| TC-16 | Calls `useCoverageMapData` with `undefined` filters when no categories selected and time is `'all'`. |
| TC-17 | Renders `MobileFilterChips`, (lazy) `MobileMapView`, and `MobileMapControls`. |
| TC-18 | `handleInspect` calls `selectMapAlert` on coverage store with correct arguments. |

**`src/components/coverage/__tests__/CoverageMap.test.tsx` (additions):**

| Test | Description |
|------|-------------|
| TC-19 | When `hideNavControls` is `true`, `MapNavControls` is not rendered. |
| TC-20 | When `hideBrackets` is `true`, corner bracket divs are not rendered. |
| TC-21 | When neither prop is passed, both MapNavControls and brackets render (backward compat). |

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Map tab renders a full-bleed `CoverageMap` filling the space between the filter chips bar and the controls bar. No horizontal gaps, no corner brackets. | Visual inspection at 375x812 (iPhone 14) in Chrome DevTools responsive mode. |
| AC-2 | `MobileFilterChips` renders a 40px bar with `[All]` plus 15 category chips. The bar scrolls horizontally. Chips snap to start alignment on scroll. | Visual inspection + swipe through chips. |
| AC-3 | Tapping a category chip toggles it in `coverage.store.selectedCategories`. Map markers update within the next poll cycle (30s) or immediately if the query key changes. | Tap "SEIS" chip; verify it highlights. Check `useCoverageStore.getState().selectedCategories` in React DevTools. Verify map marker query refires. |
| AC-4 | Tapping `[All]` chip clears all category filters. All chips return to inactive state. Map shows all markers. | Tap [All] after selecting categories. Verify all chips are inactive. Verify `selectedCategories` is empty. |
| AC-5 | Active category chips display a tinted background and border using the category's own color. | Select "SEIS" (red). Verify chip has red-tinted glass background. Select "WX" (blue). Verify blue tint. |
| AC-6 | Fade gradients appear at scroll edges. Right gradient visible at initial position. Left gradient appears after scrolling right. | Scroll the chip bar; observe gradient appearance at edges. |
| AC-7 | `ViewModeToggle` renders at bottom-left of map area with glass background. Tapping segments switches `coverage.store.viewMode`. | Tap each segment; verify store state changes. |
| AC-8 | `TimeRangeSelector` renders at bottom-right of map area. Selecting a preset updates `coverage.store.mapTimePreset`. Map markers update on next poll. | Tap "1 hr" preset; verify store state. |
| AC-9 | GPS "center on me" button renders in the lower-right of the map with dark glass styling (not MapLibre default white). | Visual inspection. Compare against MapLibre default styling (white background) to confirm Oblivion override. |
| AC-10 | Tapping the GPS button triggers a geolocation request. If granted, the map flies to the user's location and shows a white dot. | Test on a real device or Chrome DevTools with geolocation override. |
| AC-11 | GPS button has a 48x48px touch target. | Inspect computed styles in DevTools. |
| AC-12 | Map markers render with severity colors, clustering, new-alert animations -- identical behavior to desktop. | Compare markers on mobile vs desktop with the same data. |
| AC-13 | Tapping a map marker shows the `MapPopup` with title, severity, timestamp, and INSPECT button. Tapping INSPECT calls `coverage.store.selectMapAlert()`. | Tap a marker; verify popup. Tap INSPECT; verify `selectedMapAlertId` in store. |
| AC-14 | Desktop `MapNavControls` (d-pad + zoom buttons) do not render on mobile. | Inspect the map; verify no control overlay in top-left. |
| AC-15 | Desktop `CoverageMap` behavior is unchanged: corner brackets render, `MapNavControls` render, `hideNavControls` and `hideBrackets` default to false. | Load desktop at 1920x1080; visual comparison. |
| AC-16 | `MobileMapView` is lazy-loaded via `next/dynamic` with `ssr: false`. A "INITIALIZING MAP..." skeleton shows during load. | Throttle network in DevTools; observe skeleton before map renders. |
| AC-17 | All filter chip buttons have `aria-pressed` reflecting their selection state. The chip container has `role="toolbar"`. | Inspect DOM attributes. |
| AC-18 | `pnpm typecheck` passes with zero errors. | Run `pnpm typecheck` from project root. |
| AC-19 | `pnpm build` completes with zero errors. | Run `pnpm build` from project root. |
| AC-20 | `prefers-reduced-motion: reduce` disables chip transition animations and GPS pulse animation. | Enable reduced motion in OS settings; verify no transitions. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | `MobileMapView` wraps the shared `CoverageMap` with `overview={false}` (default). | Desktop uses `overview={true}` to keep the global map zoomed out (markers pulse/fade but map never auto-fits). Mobile users need the map to auto-fit to marker bounds for immediate geographic context -- the full-screen map is the primary geographic interface, not a background decoration. | (a) `overview={true}` matching desktop: rejected because mobile users viewing the Map tab expect the map to show where alerts actually are, not a static global view. (b) Custom initial bounds: rejected as unnecessary -- `CoverageMap` already auto-fits when `overview` is false. |
| D-2 | Add `hideNavControls` and `hideBrackets` props to the shared `CoverageMap` rather than CSS-only suppression. | CSS-only suppression (targeting inline style attributes) is fragile and breaks if the component's implementation changes. Adding boolean props is a minimal, explicit, backward-compatible change (~4 lines of code). It follows the principle of composition over hacking. | (a) CSS `display: none` targeting inline styles: rejected as fragile. (b) Fork `CoverageMap` into `MobileCoverageMap`: rejected as it duplicates 536 lines and creates maintenance burden. (c) CSS class-based toggle on a wrapper: partially viable but still targets internal structure. |
| D-3 | Keep the `MapPopup` rendering on marker tap (do not suppress it). | The popup provides immediate context (title, severity, time) before the bottom sheet opens. On mobile, the popup sits above the half-height sheet. WS-C.4 can later suppress the popup if it proves redundant (by calling `setPopup(null)` in the `onMarkerClick` handler before the sheet opens). | (a) Suppress popup entirely on mobile, go straight to bottom sheet: rejected for WS-C.3 because it requires coordinating with the bottom sheet timing, which is WS-C.4's scope. (b) Replace popup with a toast: over-engineering for Phase C. |
| D-4 | `MobileFilterChips` is a new mobile-only component rather than adapting the desktop category card clicks. | The desktop has no equivalent "filter chip bar" -- filtering is done by clicking category cards in the grid (which is not visible on the Map tab). The mobile Map tab needs an independent, always-visible filter mechanism. A horizontal chip bar is the standard mobile pattern for multi-select category filtering. | (a) Vertical filter sidebar: rejected, consumes too much map real estate on a phone. (b) Bottom sheet with checkboxes: too many taps for a frequent action. (c) Long-press on map to open filter: undiscoverable (information-architecture Risk R8). |
| D-5 | Use `color-mix(in srgb, ...)` for active chip tinted backgrounds. | `color-mix` is supported in all target browsers (Chrome 111+, Safari 16.2+, Firefox 113+). It allows using the category color CSS variable directly without JavaScript color manipulation. The result is a consistent 15% tint of the category color, creating the "colored glow" effect described in the aesthetic spec. | (a) Hardcode 15 separate background colors: rejected as unmaintainable. (b) Use JavaScript to compute rgba from hex: works but adds runtime cost for a purely visual effect. (c) CSS `opacity` on a pseudo-element with the category color: viable but more DOM elements. |
| D-6 | `MobileMapTabContent` is a separate orchestration component rather than inlining all logic in `MobileView`. | Follows the pattern established by WS-B.2 (`MobileCategoryGrid` owns its data wiring). Keeps the `MobileView` / `MobileShell` clean -- it just passes `<MobileMapTabContent />` as a prop. The tab content component owns its hooks, store subscriptions, and handler wiring. | (a) Wire all hooks in `MobileView` and pass as props: rejected because it clutters the orchestrator with map-specific logic that other tabs don't need. |
| D-7 | GPS `GeolocateControl` is added programmatically rather than using `react-map-gl`'s `<GeolocateControl>` JSX component. | MapLibre's `GeolocateControl` renders its own DOM elements with specific CSS classes that we need to override for the Oblivion aesthetic. The programmatic approach gives us direct access to the control instance and its configuration options. `react-map-gl` does offer a `<GeolocateControl>` component, but its CSS class targeting is identical -- either approach works. We choose programmatic for consistency with how the desktop adds navigation controls. | (a) `react-map-gl` `<GeolocateControl>` JSX: equally viable, would also work. Not rejected, just not chosen. (b) Custom GPS button outside the map: rejected because it would need to interact with the map instance's `flyTo` which is more complex than using MapLibre's built-in control. |
| D-8 | `TimeRangeSelector` overflows horizontally in the controls bar rather than being replaced with a simplified version. | The existing `TimeRangeSelector` works as-is with its full set of presets. On narrower screens, the controls bar scrolls horizontally. This avoids creating a mobile-specific variant for a Phase C deliverable. If usability testing shows the horizontal scroll is problematic, WS-C.4 or Phase F can replace it with a bottom-sheet selector triggered by a single "Time" button. | (a) Create `MobileTimeRangeSelector` with fewer presets: added complexity without clear need. (b) Replace with a button that opens a bottom-sheet picker: better UX but significantly more work, better for Phase F. |
| D-9 | The map tab container uses `overflow: hidden` (no scroll). | The map is the primary content; it handles its own pan/zoom via MapLibre touch gestures. Scroll on the container would conflict with map panning (a well-known problem in map UIs). The filter chips and controls are always visible above and below the map. | (a) Scrollable container with map inside: rejected because scroll-vs-pan conflicts are a known usability problem. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the `MapPopup` be suppressed on mobile in favor of going directly to the bottom sheet? The current decision (D-3) keeps the popup. If the popup + bottom sheet feels redundant during user testing, WS-C.4 should suppress it. | WS-C.4 author | Phase C |
| OQ-2 | The `TimeRangeSelector` has 10 presets. On a 375px screen with the `ViewModeToggle` also in the controls bar, the total width exceeds the viewport. Should we reduce to 5-6 presets for mobile, or is horizontal scroll acceptable? | UX designer | Phase C / Phase F |
| OQ-3 | Should marker tap targets be enlarged beyond the visual 6-12px dot to meet the 44px WCAG minimum? MapLibre's `interactiveLayerIds` uses the visual circle radius as the hit area. The `CIRCLE_RADIUS_EXPRESSION` ranges from 6-9px. A `circle-pitch-alignment: 'viewport'` approach could help, but increasing the hit area may cause overlapping targets in dense marker regions. | WS-C.4 author | Phase C |
| OQ-4 | The `GeolocateControl` uses the browser's Geolocation API, which requires HTTPS in production. The dev server runs on `http://localhost:3000`. Does the development workflow need an HTTPS proxy for GPS testing? | DevOps | Phase C |
| OQ-5 | Should the map retain its WebGL context when the user switches to another tab and back? Currently, WS-A.2 unmounts inactive tabs (DM-2). This causes the map to fully remount, losing pan/zoom state and incurring a re-initialization lag. Should this WS implement a keep-alive pattern (rendering with `display: none` instead of unmounting)? | WS-A.2 author | Phase C review |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `CoverageMap` remounts on every tab switch (WS-A.2 DM-2 uses conditional rendering), causing a visible WebGL re-initialization delay (~300-500ms black flash). | High | Medium | Accept for Phase C. Document in OQ-5 for the Phase C review gate. If the delay is noticeable, upgrade to keep-alive pattern: render map tab with `<div style={{ display: isActive ? 'block' : 'none' }}>` instead of conditional unmount. The `next/dynamic` lazy load still applies (map only loads on first Map tab visit). |
| R-2 | `color-mix(in srgb, ...)` is not supported on older browsers (pre-Chrome 111, pre-Safari 16.2). Active chip styling degrades to a plain white tint. | Low | Low | Provide a fallback: `.mobile-chip[data-active='true'] { background: rgba(255, 255, 255, 0.10); }` as the base rule. The `color-mix` rule overrides it in supporting browsers. Graceful degradation -- chips still show as active, just without the category color tint. |
| R-3 | MapLibre `GeolocateControl` CSS class names change in a future MapLibre release, breaking the Oblivion CSS overrides. | Low | Medium | Pin `maplibre-gl` version in `package.json`. The CSS overrides target well-established class names (`.maplibregl-ctrl-geolocate`, `.maplibregl-user-location-dot`) that have been stable across MapLibre GL JS versions. Document the targeted classes in the CSS file comments. |
| R-4 | The `TimeRangeSelector` date picker (custom range) expands downward below the controls bar, overlapping the `MobileBottomNav`. | Medium | Low | The date picker's `AnimatePresence` expand pushes content down. On the map tab, the controls bar is at the bottom. The picker would need to expand upward. The current `TimeRangeSelector` always expands downward. For Phase C, accept the overlap; Phase F can flip the expand direction on mobile or move the picker to a bottom sheet. |
| R-5 | `useCoverageMapData` refetches every 30s with potentially changing filters, causing marker flicker on the map (markers briefly disappear and reappear). | Low | Low | `keepPreviousData` is already configured in the hook (line 132 of `use-coverage-map-data.ts`). This keeps the old markers visible until new data arrives. No additional mitigation needed. |
| R-6 | GPS permission denied by user. The `GeolocateControl` shows a brief error state that may be styled incorrectly with the dark theme overrides. | Medium | Low | MapLibre's error state adds a class `maplibregl-ctrl-geolocate-background-error` which changes the icon. The CSS overrides apply `filter: invert(1)` globally to the icon, which may not distinguish the error state. Add a specific error state CSS rule: `.maplibregl-ctrl-geolocate-background-error .maplibregl-ctrl-icon { filter: invert(1) brightness(0.4); opacity: 0.3; }`. |
| R-7 | Modifying `CoverageMap` to add `hideNavControls` and `hideBrackets` props could theoretically cause a desktop regression if the default values are incorrectly implemented. | Very Low | High | The change is purely additive: two new optional boolean props that default to `false`/`undefined`. When falsy, the existing render paths execute unchanged. AC-15 explicitly verifies desktop is unchanged. TC-21 tests backward compatibility. |

---

## Appendix A: Component File Inventory

| File | Type | Lines (est.) | Description |
|------|------|-------------|-------------|
| `src/components/mobile/MobileMapView.tsx` | Component | ~90 | `CoverageMap` wrapper with GPS control attachment |
| `src/components/mobile/MobileFilterChips.tsx` | Component | ~120 | Horizontal category filter pill bar |
| `src/components/mobile/MobileMapControls.tsx` | Component | ~45 | Layout wrapper for ViewModeToggle + TimeRangeSelector |
| `src/components/mobile/MobileMapTabContent.tsx` | Component | ~100 | Orchestration: hooks, store, wiring |
| `src/styles/mobile-map-view.css` | CSS | ~250 | All Map tab styles including GeolocateControl overrides |
| `src/components/coverage/CoverageMap.tsx` | Modified | +8 | Two new optional props, two conditional wrappers |
| `src/components/mobile/__tests__/MobileFilterChips.test.tsx` | Test | ~120 | 8 test cases |
| `src/components/mobile/__tests__/MobileMapView.test.tsx` | Test | ~80 | 6 test cases |
| `src/components/mobile/__tests__/MobileMapTabContent.test.tsx` | Test | ~90 | 4 test cases |
| `src/components/coverage/__tests__/CoverageMap.test.tsx` | Test (additions) | +40 | 3 test cases for new props |

**Total new code:** ~580 lines of components, ~250 lines of CSS, ~330 lines of tests.

## Appendix B: Data Flow Diagram

```
coverage.store.ts
  ├── selectedCategories ──────────┐
  ├── mapTimePreset ───────────────┤
  ├── customTimeStart ─────────────┤
  ├── customTimeEnd ───────────────┘
  │                                │
  │                    MobileMapTabContent
  │                    ├── useMemo(mapFilters)
  │                    │         │
  │                    │   useCoverageMapData(filters)
  │                    │         │
  │                    │     MapMarker[]
  │                    │         │
  │                    ├─────────┼──> MobileMapView
  │                    │         │       └── CoverageMap
  │                    │         │            ├── MapMarkerLayer
  │                    │         │            └── MapPopup
  │                    │         │
  ├── viewMode ────────┼──────────> MobileMapControls
  │                    │              ├── ViewModeToggle
  │                    │              └── TimeRangeSelector
  │                    │
  ├── toggleCategory ──┼──────────> MobileFilterChips
  ├── clearSelection ──┤              └── [All] [SEIS] [CON] ...
  │                    │
  ├── selectMapAlert ──┼── onInspect callback
  └── selectedMapAlertId ──────────> MobileMapView.selectedMarkerId
                                     WS-C.1 MobileBottomSheet (listens)
```

## Appendix C: Token Consumption Map

| Token | Consumed By | Purpose |
|-------|-------------|---------|
| `--space-filter-chips-height` | `.mobile-filter-chips` | Fixed 40px height |
| `--space-content-padding` | `.mobile-filter-chips-scroll`, `.mobile-map-controls` | Horizontal padding (12px) |
| `--space-inline-gap` | `.mobile-filter-chips-scroll` | Chip gap (8px) |
| `--glass-header-bg` | `.mobile-filter-chips`, `.mobile-map-controls` | Glass background |
| `--glass-header-blur` | `.mobile-filter-chips`, `.mobile-map-controls` | Backdrop blur |
| `--color-border-subtle` | `.mobile-filter-chips`, `.mobile-map-controls` | Divider borders |
| `--color-void` | `.mobile-filter-chips::before/after` | Fade gradient base color |
| `--font-mono` | `.mobile-chip` | Chip typography |
| `--text-caption` | `.mobile-chip` | Chip font size (10px) |
| `--duration-hover` | `.mobile-chip` | Chip state transitions (150ms) |
| `--touch-target-comfortable` | GeolocateControl CSS | 48px GPS button |
