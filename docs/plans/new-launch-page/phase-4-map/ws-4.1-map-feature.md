# WS-4.1: Map Feature

> **Workstream ID:** WS-4.1
> **Phase:** 4 -- Map
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-04
> **Last Updated:** 2026-03-04
> **Depends On:** WS-1.3 (Data Layer), WS-3.1 (District View Adaptation)
> **Blocks:** None (final workstream)
> **Resolves:** Decision 5 (MapLibre GL JS in district view overlay)

## 1. Objective

Add an interactive geographic map to the `CategoryDetailScene` by installing MapLibre GL JS and react-map-gl, creating a `CoverageMap` component with severity-colored markers and optional clustering, and replacing the map placeholder `<div>` established by WS-3.1 (Section 4.1.7) with the live map. The map renders inside the district view overlay (`position: fixed; inset: 0;`) to avoid the WebGL-in-CSS-transforms problem identified in Discovery Phase 5. Markers are filtered to the currently selected category and auto-zoom to the geographic bounding box computed by `calculateBounds()` from `coverage-utils.ts` (WS-1.3).

The gate criterion is: drill into any category from the coverage grid, and see a MapLibre map in the lower-right quadrant of `CategoryDetailScene` with severity-colored circle markers for that category's intel items. The map auto-zooms to fit all visible markers. Clicking a marker shows a popup with the alert title, severity badge, and ingested timestamp. The map displays a dark tile style consistent with the app's dark theme. `pnpm typecheck` and `pnpm build` both pass with zero errors.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Dependency installation | Add `maplibre-gl` and `react-map-gl` to `package.json` via `pnpm add` |
| New file: `map-utils.ts` | Pure utility functions: `markersToGeoJSON()` for converting `MapMarker[]` to GeoJSON `FeatureCollection`, `SEVERITY_MAP_COLORS` constant mapping severity levels to hex colors for the circle layer, `clusterProperties` configuration |
| New file: `MapPopup.tsx` | Popup component rendered when a marker is clicked. Displays alert title, severity badge, and relative ingested timestamp. Uses the existing district-view design language (mono font, glass styling). |
| New file: `MapMarkerLayer.tsx` | Renders a GeoJSON `<Source>` with clustering enabled and a `<Layer>` using `circle` type with severity-based `circle-color` paint expression. Includes a cluster count layer. Handles the data-driven styling via MapLibre expressions. |
| New file: `CoverageMap.tsx` | Main map component wrapping `react-map-gl/maplibre` `<Map>` with dark tile style, `NavigationControl`, auto-bounds from `calculateBounds()`, loading overlay, WebGL error detection, and screen-reader accessible labeling. Dynamically imported with `ssr: false`. |
| Update: `CategoryDetailScene.tsx` | Replace the map placeholder `<div>` (WS-3.1 Section 4.1.7) with the dynamically imported `CoverageMap`. Pass `categoryId`, `markers`, and bounds as props. |
| MapLibre CSS import | Import `maplibre-gl/dist/maplibre-gl.css` in the app layout or via a CSS import so MapLibre controls render correctly |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Production tile source procurement | Decision D-1 selects CARTO dark-matter for dev/launch. Production tile source (e.g., MapTiler, Protomaps, self-hosted) is a future operational decision. |
| Map in world-space (on the launch page overview) | Decision 5 explicitly places the map only in the district view overlay. WebGL canvases do not render correctly inside CSS `transform: scale()` containers. |
| Non-Point geometry rendering | `toMarkers()` (WS-1.3) already filters to `Point` geometries only. Polygon/LineString rendering on the map is a future enhancement. |
| Realtime marker updates | Markers refresh via `useCoverageMapData` polling (30-second `refetchInterval` from WS-1.3). Supabase Realtime subscriptions are not needed. |
| Marker animation or transition effects | Static markers are sufficient for the coverage dashboard. Animated marker entry is a polish item for a future workstream. |
| Map export or screenshot feature | Not required for the coverage dashboard. |
| Server-side map rendering | This app targets GitHub Pages static export. All map rendering is client-side via WebGL. |
| Additional filter controls on the map (severity, date range) | The map inherits the category filter from the `CategoryDetailScene`. Severity and date range filters within the map are deferred to a future workstream. WS-1.3 OQ-4 anticipated this deferral. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/hooks/use-coverage-map-data.ts` (WS-1.3) | `useCoverageMapData({ category })` returning `MapMarker[]` with `id`, `lat`, `lng`, `title`, `severity`, `category`, `sourceId`, `ingestedAt` fields. Query is already invoked by `CategoryDetailScene` (WS-3.1 Section 4.1.2). | Created by WS-1.3 |
| `src/lib/coverage-utils.ts` (WS-1.3) | `calculateBounds(markers)` returning `MapBounds` with `center?: [lng, lat]`, `zoom?: number`, `bounds?: [[minLng, minLat], [maxLng, maxLat]]`. Used to auto-zoom the map to the category's geographic footprint. | Created by WS-1.3 |
| `src/lib/coverage-utils.ts` (WS-1.3) | `MapMarker` type definition with `id`, `lat`, `lng`, `title`, `severity`, `category`, `sourceId`, `ingestedAt` fields | Created by WS-1.3 |
| `src/lib/interfaces/coverage.ts` (WS-1.2) | `SEVERITY_LEVELS`, `SEVERITY_COLORS`, `SeverityLevel` for severity badge rendering in `MapPopup`. `getCategoryMeta()` for display names. | Created by WS-1.2 |
| `src/components/district-view/scenes/CategoryDetailScene.tsx` (WS-3.1) | The scene already fetches `markers` from `useCoverageMapData({ category: categoryId })` (Section 4.1.2) and renders a placeholder `<div>` in the lower-right quadrant (Section 4.1.7, styled with `role="img"` and dashed border). This workstream replaces that placeholder. | Created by WS-3.1 |
| `src/components/district-view/district-view-overlay.tsx` | The overlay uses `position: fixed; inset: 0; zIndex: 30` (verified: lines 86-89). The map renders inside this overlay (via CategoryDetailScene inside DistrictViewContent), ensuring it is NOT inside any CSS `transform: scale()` container. The spatial ZUI transforms are on `SpatialCanvas`, which is a sibling of the overlay, not an ancestor. | Available (125 lines) |
| `src/components/providers/query-provider.tsx` | `QueryProvider` wrapping the app. `useCoverageMapData` is already called by CategoryDetailScene so the TanStack Query context is guaranteed available. | Available |
| `package.json` | Current dependencies include React 19, Next.js 16, motion/react 12, TanStack Query 5, Zustand 5. No existing map library. Node >= 22 required. Uses `pnpm`. | Available (48 lines) |
| `next.config.ts` | Current config: `transpilePackages: ['@tarva/ui']`. No `output: 'export'` yet (Phase 2 scope). MapLibre is client-side only, compatible with both SSR and static export modes. | Available (7 lines) |

## 4. Deliverables

### 4.1 Install Dependencies

Add `maplibre-gl` and `react-map-gl` to the project.

#### 4.1.1 Installation Command

```bash
pnpm add maplibre-gl react-map-gl
```

#### 4.1.2 Expected `package.json` Changes

**Before (relevant section of `dependencies`):**

```json
{
  "dependencies": {
    "motion": "^12.0.0",
    "nanoid": "^5.0.0",
    "next": "16.1.6",
    "next-themes": "^0.4.6",
    "react": "19.2.4"
  }
}
```

**After (new entries, alphabetical insertion):**

```json
{
  "dependencies": {
    "maplibre-gl": "^5.1.0",
    "motion": "^12.0.0",
    "nanoid": "^5.0.0",
    "next": "16.1.6",
    "next-themes": "^0.4.6",
    "react": "19.2.4",
    "react-map-gl": "^8.0.0"
  }
}
```

`react-map-gl` v8 supports MapLibre GL JS v4+ as a peer dependency via the `react-map-gl/maplibre` entry point. No Mapbox token is needed when using the MapLibre backend.

#### 4.1.3 Bundle Size Impact

MapLibre GL JS is approximately 200KB gzipped. Since the `CoverageMap` component is dynamically imported with `ssr: false` and only loads when a user drills into a category detail view, the initial page bundle is unaffected. The map chunk loads on-demand during the `entering-district` morph phase, which provides a natural loading window.

---

### 4.2 Create Utility Module -- `src/components/coverage/map-utils.ts`

**Path:** `src/components/coverage/map-utils.ts`

Pure functions and constants for map data transformation. No React imports, no side effects.

#### 4.2.1 `SEVERITY_MAP_COLORS`

Hex color values for each severity level, used by the MapLibre `circle-color` paint expression. These are concrete hex values derived from the severity color names in `TYPESCRIPT-TYPES.md` and consistent with the dark-theme design language.

```typescript
/**
 * Hex colors for map marker circles, keyed by severity level.
 * Used in MapLibre data-driven circle-color paint expressions.
 */
export const SEVERITY_MAP_COLORS: Record<string, string> = {
  Extreme: '#ef4444',   // red-500
  Severe: '#f97316',    // orange-500
  Moderate: '#eab308',  // yellow-500
  Minor: '#3b82f6',     // blue-500
  Unknown: '#6b7280',   // gray-500
} as const

/** Fallback color for markers with unrecognized severity values. */
export const DEFAULT_MARKER_COLOR = '#6b7280' // gray-500
```

#### 4.2.2 `markersToGeoJSON()`

Converts `MapMarker[]` to a GeoJSON `FeatureCollection` for use as a MapLibre `Source`. Flips the coordinate order back from `{ lat, lng }` (MapMarker format) to `[lng, lat]` (GeoJSON standard, which MapLibre uses natively).

```typescript
import type { MapMarker } from '@/lib/coverage-utils'

interface MarkerFeatureProperties {
  id: string
  title: string
  severity: string
  category: string
  sourceId: string
  ingestedAt: string
}

export interface MarkerFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: { type: 'Point'; coordinates: [number, number] }
    properties: MarkerFeatureProperties
  }>
}

/**
 * Convert MapMarker[] to GeoJSON FeatureCollection for MapLibre.
 * Coordinates are [lng, lat] per GeoJSON/MapLibre convention.
 */
export function markersToGeoJSON(markers: MapMarker[]): MarkerFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: markers.map((m) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [m.lng, m.lat] as [number, number],
      },
      properties: {
        id: m.id,
        title: m.title,
        severity: m.severity,
        category: m.category,
        sourceId: m.sourceId,
        ingestedAt: m.ingestedAt,
      },
    })),
  }
}
```

#### 4.2.3 `buildCircleColorExpression()`

Generates a MapLibre `match` expression for data-driven circle coloring by severity.

```typescript
import type { ExpressionSpecification } from 'maplibre-gl'

/**
 * Build a MapLibre 'match' expression that maps the 'severity' property
 * to the corresponding hex color.
 *
 * Output: ['match', ['get', 'severity'], 'Extreme', '#ef4444', ..., '#6b7280']
 */
export function buildCircleColorExpression(): ExpressionSpecification {
  return [
    'match',
    ['get', 'severity'],
    'Extreme', SEVERITY_MAP_COLORS.Extreme,
    'Severe', SEVERITY_MAP_COLORS.Severe,
    'Moderate', SEVERITY_MAP_COLORS.Moderate,
    'Minor', SEVERITY_MAP_COLORS.Minor,
    'Unknown', SEVERITY_MAP_COLORS.Unknown,
    DEFAULT_MARKER_COLOR,  // fallback
  ]
}
```

#### 4.2.4 `formatRelativeTime()`

Formats an ISO 8601 timestamp as a relative time string (e.g., "2h ago", "3d ago"). Used by `MapPopup` for the ingested timestamp.

```typescript
/**
 * Format an ISO 8601 timestamp as a relative time string.
 * e.g., "2m ago", "3h ago", "1d ago", "2w ago"
 */
export function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  if (Number.isNaN(diffMs) || diffMs < 0) return 'just now'

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}
```

---

### 4.3 Create Popup Component -- `src/components/coverage/MapPopup.tsx`

**Path:** `src/components/coverage/MapPopup.tsx`

A lightweight popup displayed when a marker is clicked. Renders inside the react-map-gl `<Popup>` container, positioned at the marker's coordinates.

#### 4.3.1 Props Interface

```typescript
'use client'

import { SEVERITY_MAP_COLORS, DEFAULT_MARKER_COLOR, formatRelativeTime } from './map-utils'

interface MapPopupProps {
  /** Alert title */
  readonly title: string
  /** Severity level (Extreme, Severe, Moderate, Minor, Unknown) */
  readonly severity: string
  /** ISO 8601 timestamp of when the alert was ingested */
  readonly ingestedAt: string
  /** Callback to close the popup */
  readonly onClose: () => void
}
```

#### 4.3.2 Visual Design

The popup follows the district-view design language established by WS-3.1 Section 4.1.8:

- Background: `rgba(10, 14, 24, 0.92)` with `backdrop-filter: blur(12px)` (glass effect)
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Border radius: `8px`
- Padding: `12px`
- Max width: `240px`
- Title: `font-mono text-[11px] text-white/60` (truncated with ellipsis if long)
- Severity badge: Small colored dot (8x8px circle) + `font-mono text-[9px] uppercase tracking-[0.1em]` label in the severity's color
- Timestamp: `font-mono text-[9px] text-white/25` showing relative time via `formatRelativeTime()`

```typescript
export function MapPopup({ title, severity, ingestedAt, onClose }: MapPopupProps) {
  const severityColor = SEVERITY_MAP_COLORS[severity] ?? DEFAULT_MARKER_COLOR

  return (
    <div
      style={{
        background: 'rgba(10, 14, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
        padding: 12,
        maxWidth: 240,
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.6)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      {/* Severity + Timestamp row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Severity badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: severityColor,
              display: 'inline-block',
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: severityColor,
            }}
          >
            {severity}
          </span>
        </div>

        {/* Timestamp */}
        <span style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.25)' }}>
          {formatRelativeTime(ingestedAt)}
        </span>
      </div>
    </div>
  )
}
```

#### 4.3.3 Popup CSS Override

MapLibre's default popup styling (`.maplibregl-popup-content`) includes a white background, box shadow, and close button. These must be overridden. Add a global CSS rule in the same file where `maplibre-gl/dist/maplibre-gl.css` is imported (see Deliverable 4.7):

```css
/* Override MapLibre popup styles for dark theme */
.maplibregl-popup-content {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
}

.maplibregl-popup-close-button {
  display: none !important;
}

.maplibregl-popup-tip {
  border-top-color: rgba(10, 14, 24, 0.92) !important;
}
```

These overrides are scoped to the MapLibre popup class names and do not affect other components. The close button is hidden because dismissal is handled by clicking elsewhere on the map.

---

### 4.4 Create Marker Layer Component -- `src/components/coverage/MapMarkerLayer.tsx`

**Path:** `src/components/coverage/MapMarkerLayer.tsx`

Renders the GeoJSON marker data as a MapLibre source with circle layers. Handles clustering, severity-based coloring, and click interaction.

#### 4.4.1 Props Interface

```typescript
'use client'

import { useCallback } from 'react'
import { Source, Layer, type LayerProps, type MapLayerMouseEvent } from 'react-map-gl/maplibre'
import { buildCircleColorExpression } from './map-utils'
import type { MarkerFeatureCollection } from './map-utils'

interface MapMarkerLayerProps {
  /** GeoJSON FeatureCollection of markers */
  readonly data: MarkerFeatureCollection
  /** Callback when a marker feature is clicked. Receives feature properties + coordinates. */
  readonly onMarkerClick?: (properties: Record<string, unknown>, coordinates: [number, number]) => void
}
```

#### 4.4.2 Source Configuration

The GeoJSON source enables clustering to prevent visual clutter at low zoom levels:

```typescript
<Source
  id="coverage-markers"
  type="geojson"
  data={data}
  cluster={true}
  clusterMaxZoom={14}
  clusterRadius={50}
>
  {/* Layers rendered as children */}
</Source>
```

- `cluster: true` enables MapLibre's built-in point clustering.
- `clusterMaxZoom: 14` stops clustering at zoom 14+ (individual markers visible).
- `clusterRadius: 50` (pixels) determines how close points must be to cluster.

#### 4.4.3 Layer Definitions

Three layers render inside the source:

**Layer 1: Cluster circles** -- Aggregated clusters shown as larger, semi-transparent circles with the count.

```typescript
const clusterLayer: LayerProps = {
  id: 'clusters',
  type: 'circle',
  source: 'coverage-markers',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': 'rgba(255, 255, 255, 0.08)',
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      18,   // radius for count < 10
      10, 24,   // radius for count 10-99
      100, 32,  // radius for count 100+
    ],
    'circle-stroke-width': 1,
    'circle-stroke-color': 'rgba(255, 255, 255, 0.15)',
  },
}
```

**Layer 2: Cluster count labels** -- Text showing the number of points in each cluster.

```typescript
const clusterCountLayer: LayerProps = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'coverage-markers',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['Open Sans Regular'],
    'text-size': 11,
  },
  paint: {
    'text-color': 'rgba(255, 255, 255, 0.5)',
  },
}
```

**Layer 3: Individual marker circles** -- Unclustered points colored by severity.

```typescript
const markerLayer: LayerProps = {
  id: 'unclustered-point',
  type: 'circle',
  source: 'coverage-markers',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': buildCircleColorExpression(),
    'circle-radius': 6,
    'circle-stroke-width': 1.5,
    'circle-stroke-color': 'rgba(0, 0, 0, 0.4)',
    'circle-opacity': 0.85,
  },
}
```

The stroke provides contrast against both the dark map tiles and overlapping markers.

#### 4.4.4 Click Handling

Marker clicks are handled by adding `interactiveLayerIds` to the parent `<Map>` component (passed up via the `onMarkerClick` callback) and a click handler:

```typescript
export function MapMarkerLayer({ data, onMarkerClick }: MapMarkerLayerProps) {
  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature || !feature.properties) return

      // If it's a cluster, zoom into it
      if (feature.properties.cluster) {
        // Cluster expansion is handled by CoverageMap via map ref
        return
      }

      // Individual marker clicked
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      onMarkerClick?.(feature.properties, coords)
    },
    [onMarkerClick],
  )

  return (
    <Source
      id="coverage-markers"
      type="geojson"
      data={data}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={50}
    >
      <Layer {...clusterLayer} />
      <Layer {...clusterCountLayer} />
      <Layer {...markerLayer} />
    </Source>
  )
}
```

The click handler is wired to the `<Map>` component's `onClick` prop in `CoverageMap.tsx` (Deliverable 4.5), filtered to the `interactiveLayerIds: ['clusters', 'unclustered-point']`.

---

### 4.5 Create Map Component -- `src/components/coverage/CoverageMap.tsx`

**Path:** `src/components/coverage/CoverageMap.tsx`

The main map component. Wraps `react-map-gl/maplibre` with dark tiles, auto-bounds, marker layers, popup, and accessibility labeling.

#### 4.5.1 Props Interface

```typescript
'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Map, { NavigationControl, Popup, type MapRef, type MapLayerMouseEvent } from 'react-map-gl/maplibre'
import type { MapMarker } from '@/lib/coverage-utils'
import { calculateBounds } from '@/lib/coverage-utils'
import { markersToGeoJSON, formatRelativeTime } from './map-utils'
import { MapMarkerLayer } from './MapMarkerLayer'
import { MapPopup } from './MapPopup'

interface CoverageMapProps {
  /** Category ID for display context */
  readonly categoryId: string
  /** Category display name for accessibility labeling */
  readonly categoryName: string
  /** Filtered markers for this category */
  readonly markers: MapMarker[]
  /** Whether the marker data is still loading */
  readonly isLoading?: boolean
}
```

#### 4.5.2 Auto-Bounds Calculation

The map auto-fits to the geographic extent of the visible markers using `calculateBounds()` from `coverage-utils.ts`:

```typescript
const mapRef = useRef<MapRef>(null)

const geojson = useMemo(() => markersToGeoJSON(markers), [markers])
const bounds = useMemo(() => calculateBounds(markers), [markers])

// Fit bounds when markers change
useEffect(() => {
  const map = mapRef.current
  if (!map) return

  if (bounds.bounds) {
    map.fitBounds(bounds.bounds, {
      padding: 60,
      maxZoom: 12,
      duration: 800,
    })
  } else if (bounds.center && bounds.zoom) {
    map.flyTo({
      center: bounds.center,
      zoom: bounds.zoom,
      duration: 800,
    })
  }
}, [bounds])
```

- `padding: 60` provides visual breathing room around the marker extent.
- `maxZoom: 12` prevents over-zooming on sparse data (e.g., a single marker).
- `duration: 800` provides a smooth animated transition when bounds change.
- For 0 markers: `calculateBounds` returns `{ center: [0, 0], zoom: 2 }` -- a world view.
- For 1 marker: `calculateBounds` returns `{ center: [lng, lat], zoom: 8 }`.
- For 2+ markers: `calculateBounds` returns `{ bounds: [[minLng, minLat], [maxLng, maxLat]] }`.

#### 4.5.3 Popup State

```typescript
const [popupInfo, setPopupInfo] = useState<{
  longitude: number
  latitude: number
  title: string
  severity: string
  ingestedAt: string
} | null>(null)

const handleMarkerClick = useCallback(
  (properties: Record<string, unknown>, coordinates: [number, number]) => {
    setPopupInfo({
      longitude: coordinates[0],
      latitude: coordinates[1],
      title: String(properties.title ?? 'Intel Item'),
      severity: String(properties.severity ?? 'Unknown'),
      ingestedAt: String(properties.ingestedAt ?? ''),
    })
  },
  [],
)

const handleClosePopup = useCallback(() => setPopupInfo(null), [])
```

#### 4.5.4 Cluster Expansion

When a cluster is clicked, the map zooms into it to reveal individual markers:

```typescript
const handleMapClick = useCallback(
  (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) {
      // Clicked empty space -- close popup
      setPopupInfo(null)
      return
    }

    if (feature.properties?.cluster) {
      // Zoom into cluster
      const map = mapRef.current
      if (!map) return
      const source = map.getSource('coverage-markers')
      if (source && 'getClusterExpansionZoom' in source) {
        const clusterId = feature.properties.cluster_id as number
        ;(source as maplibregl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err: Error | null, zoom: number | null | undefined) => {
            if (err || zoom == null) return
            const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
            map.flyTo({ center: coords, zoom, duration: 500 })
          },
        )
      }
      return
    }

    // Individual marker click
    const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
    handleMarkerClick(feature.properties ?? {}, coords)
  },
  [handleMarkerClick],
)
```

#### 4.5.5 Loading State

While the map tiles are loading or while `isLoading` is `true` (marker data still fetching), render an overlay:

```typescript
const [mapLoaded, setMapLoaded] = useState(false)
const showLoadingOverlay = !mapLoaded || isLoading

return (
  <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}>
    <Map
      ref={mapRef}
      onLoad={() => setMapLoaded(true)}
      // ... rest of props
    >
      {/* layers and controls */}
    </Map>

    {/* Loading overlay */}
    {showLoadingOverlay && (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(5, 9, 17, 0.8)',
          borderRadius: 8,
          zIndex: 1,
        }}
        aria-live="polite"
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          Loading Map...
        </span>
      </div>
    )}
  </div>
)
```

#### 4.5.6 Error State (WebGL Unavailable)

MapLibre requires WebGL. If the browser does not support WebGL, the map will fail to initialize. Detect this and show a fallback:

```typescript
const [mapError, setMapError] = useState<string | null>(null)

// Check WebGL support on mount
useEffect(() => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) {
      setMapError('WebGL is not supported by your browser.')
    }
  } catch {
    setMapError('WebGL detection failed.')
  }
}, [])

if (mapError) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed rgba(255, 255, 255, 0.08)',
        borderRadius: 8,
      }}
      role="img"
      aria-label={`Map unavailable: ${mapError}`}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          fontSize: 9,
          color: 'rgba(255, 255, 255, 0.15)',
          textAlign: 'center',
          padding: 16,
        }}
      >
        {mapError}
      </span>
    </div>
  )
}
```

#### 4.5.7 Empty State (No Markers)

When `markers` is empty but the map is loaded, display the map at the default world view (zoom 2, center [0, 0]) with a subtle overlay message:

```typescript
{markers.length === 0 && mapLoaded && (
  <div
    style={{
      position: 'absolute',
      bottom: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      fontFamily: 'var(--font-mono, ui-monospace, monospace)',
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'rgba(255, 255, 255, 0.2)',
      backgroundColor: 'rgba(5, 9, 17, 0.7)',
      padding: '4px 12px',
      borderRadius: 4,
      zIndex: 1,
      pointerEvents: 'none',
    }}
  >
    No geo-located alerts for {categoryName}
  </div>
)}
```

The map itself still renders (dark tiles visible), providing visual context. Only the marker data is empty.

#### 4.5.8 Full Component Render

```typescript
export function CoverageMap({ categoryId, categoryName, markers, isLoading }: CoverageMapProps) {
  // ... all state and handlers from above ...

  if (mapError) {
    return /* error fallback from 4.5.6 */
  }

  const markerCount = markers.length

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' }}
      role="application"
      aria-label={`Interactive map showing ${markerCount} ${categoryName} alert${markerCount === 1 ? '' : 's'}`}
      aria-roledescription="map"
    >
      <Map
        ref={mapRef}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        initialViewState={{
          longitude: 0,
          latitude: 20,
          zoom: 2,
        }}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapLoaded(true)}
        onClick={handleMapClick}
        interactiveLayerIds={['clusters', 'unclustered-point']}
        cursor="default"
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {markerCount > 0 && (
          <MapMarkerLayer data={geojson} onMarkerClick={handleMarkerClick} />
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={handleClosePopup}
            closeButton={false}
            closeOnClick={false}
            offset={12}
          >
            <MapPopup
              title={popupInfo.title}
              severity={popupInfo.severity}
              ingestedAt={popupInfo.ingestedAt}
              onClose={handleClosePopup}
            />
          </Popup>
        )}
      </Map>

      {/* Loading overlay */}
      {showLoadingOverlay && /* loading overlay from 4.5.5 */}

      {/* Empty state message */}
      {markerCount === 0 && mapLoaded && !isLoading && /* empty overlay from 4.5.7 */}

      {/* Screen-reader summary (visually hidden) */}
      <div className="sr-only" aria-live="polite">
        {isLoading
          ? `Loading ${categoryName} alerts on map`
          : `Map displaying ${markerCount} ${categoryName} alert${markerCount === 1 ? '' : 's'}`}
      </div>
    </div>
  )
}
```

Key prop decisions for `<Map>`:

- **`mapStyle`:** CARTO dark-matter (free, no API key, dark theme compatible). See Decision D-1.
- **`initialViewState`:** Centered at `[0, 20]` zoom 2 as a default world view. Immediately overridden by `fitBounds` in the `useEffect` when markers load.
- **`attributionControl: false`:** CARTO attribution is embedded in the tile JSON. The default MapLibre attribution control is visually noisy against the dark theme. If needed, a discrete attribution link can be added later.
- **`interactiveLayerIds`:** Enables click events only on the marker and cluster layers.
- **`showCompass: false`:** Navigation control shows zoom +/- only. Compass is unnecessary for a 2D data map.

#### 4.5.9 Accessibility

- `role="application"` signals that the map is a complex interactive widget with its own keyboard handling. MapLibre natively supports arrow keys for panning and +/- for zooming when focused.
- `aria-roledescription="map"` provides a semantic description.
- `aria-label` dynamically describes the map content (count of alerts and category name).
- A visually hidden (`sr-only`) `aria-live="polite"` region announces data changes to screen readers.
- The popup content (4.3) uses semantic markup with the severity color communicated via text label (not color alone).
- Tab into the map container focuses the MapLibre canvas, enabling keyboard-driven pan/zoom.

---

### 4.6 Integrate into `CategoryDetailScene.tsx`

**Path:** `src/components/district-view/scenes/CategoryDetailScene.tsx`

Replace the map placeholder `<div>` created by WS-3.1 (Section 4.1.7) with the dynamically imported `CoverageMap` component.

#### 4.6.1 Add Dynamic Import

MapLibre GL JS requires the DOM (`window`, `document`, WebGL context). Since Next.js performs server-side rendering during build (even for static export), the import must be deferred to client-side only using `next/dynamic`:

```typescript
import dynamic from 'next/dynamic'

const CoverageMap = dynamic(
  () => import('@/components/coverage/CoverageMap').then((mod) => mod.CoverageMap),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
        }}
        role="img"
        aria-label="Loading map"
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.15)',
          }}
        >
          Loading Map...
        </span>
      </div>
    ),
  },
)
```

The `loading` component visually matches the WS-3.1 map placeholder so the user sees a smooth transition from placeholder to loading state to live map.

#### 4.6.2 Replace Placeholder

**Before (WS-3.1 Section 4.1.7 map placeholder):**

```typescript
{/* Section D: Map Placeholder */}
<div
  style={{
    minHeight: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px dashed rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  }}
  role="img"
  aria-label="Map placeholder, coming soon"
>
  <span
    style={{
      fontFamily: 'var(--font-mono, ui-monospace, monospace)',
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'rgba(255, 255, 255, 0.15)',
    }}
  >
    Map -- WS-4.1
  </span>
</div>
```

**After:**

```typescript
{/* Section D: Coverage Map */}
<div style={{ minHeight: 280, height: '100%', position: 'relative' }}>
  <CoverageMap
    categoryId={categoryId}
    categoryName={categoryMeta.displayName}
    markers={markers}
    isLoading={mapLoading}
  />
</div>
```

Where `categoryMeta` is already resolved in the scene via `getCategoryMeta(categoryId)`, `markers` is the result of `useCoverageMapData({ category: categoryId })`, and `mapLoading` is the `isLoading` state from that hook. All three values already exist in `CategoryDetailScene` per WS-3.1 Section 4.1.2.

The `minHeight: 280` (increased from 200) ensures the map has sufficient vertical space for the MapLibre canvas to render meaningfully. The `height: '100%'` allows the map to expand to fill available space in the grid cell.

#### 4.6.3 Updated Accessibility

The placeholder's `role="img"` and `aria-label="Map placeholder, coming soon"` are replaced by the `CoverageMap` component's own `role="application"`, `aria-roledescription="map"`, and dynamic `aria-label` (Deliverable 4.5.9). The screen-reader experience upgrades from a static "coming soon" label to live data descriptions.

---

### 4.7 Import MapLibre CSS

**Path:** `src/styles/maplibre-overrides.css` (new file) and import in `src/app/layout.tsx`

#### 4.7.1 Create CSS Override File

**New file: `src/styles/maplibre-overrides.css`**

```css
/* MapLibre GL JS base styles */
@import 'maplibre-gl/dist/maplibre-gl.css';

/* ==========================================================================
   Dark theme overrides for MapLibre controls and popups.
   Scoped to .maplibregl-* class names.
   ========================================================================== */

/* Popup: transparent background, no shadow (custom glass popup in MapPopup.tsx) */
.maplibregl-popup-content {
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
}

/* Hide default close button (popup closed by clicking elsewhere) */
.maplibregl-popup-close-button {
  display: none !important;
}

/* Popup tip arrow: match glass background color */
.maplibregl-popup-tip {
  border-top-color: rgba(10, 14, 24, 0.92) !important;
}

/* Navigation control: dark theme */
.maplibregl-ctrl-group {
  background: rgba(10, 14, 24, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(8px);
  border-radius: 6px !important;
}

.maplibregl-ctrl-group button {
  border-color: rgba(255, 255, 255, 0.06) !important;
}

.maplibregl-ctrl-group button + button {
  border-top-color: rgba(255, 255, 255, 0.06) !important;
}

/* Navigation control icons: light for dark background */
.maplibregl-ctrl-group button .maplibregl-ctrl-icon {
  filter: invert(1) brightness(0.6);
}

/* Attribution control: subtle on dark */
.maplibregl-ctrl-attrib {
  background: rgba(0, 0, 0, 0.4) !important;
  color: rgba(255, 255, 255, 0.25) !important;
  font-size: 9px !important;
}

.maplibregl-ctrl-attrib a {
  color: rgba(255, 255, 255, 0.3) !important;
}
```

#### 4.7.2 Import in Layout

**File: `src/app/layout.tsx`**

Add the CSS import alongside existing global style imports. The import must be at the application root so MapLibre styles are available when the map component mounts inside the district view overlay.

**Before (add to existing imports):**

```typescript
import '@/styles/maplibre-overrides.css'
```

This single import handles both the base MapLibre CSS (`@import 'maplibre-gl/dist/maplibre-gl.css'` inside the override file) and the dark theme overrides. Only one import is needed in the layout.

If the current layout already imports styles via Tailwind or a global CSS file, the MapLibre import should be placed after the Tailwind import to ensure proper cascade order:

```typescript
import '@/styles/globals.css'           // or whatever the existing global CSS is
import '@/styles/maplibre-overrides.css' // MapLibre base + dark theme overrides
```

---

### 4.8 Integration Verification

This deliverable is not a file but a verification step. After all files above are created:

1. Start the dev server (`pnpm dev`).
2. Navigate to the spatial canvas (launch page).
3. Click a category card (e.g., "Seismic") to trigger the morph drill-down.
4. Observe the district view overlay with `CategoryDetailScene`.
5. Verify the map renders in the lower-right quadrant:
   - Dark tiles visible (CARTO dark-matter).
   - Severity-colored circle markers visible (if the category has geo-located intel).
   - Markers are clustered at low zoom, individual at high zoom.
   - Navigation controls (zoom +/-) visible in top-right corner of the map.
6. Click a marker: popup appears with title, severity badge, and relative timestamp.
7. Click elsewhere on the map: popup dismisses.
8. Click a cluster: map zooms in to reveal individual markers.
9. Press Escape: morph reverses, map unmounts cleanly (no WebGL console errors).
10. Navigate to a category with no geo data: map shows at world view with "No geo-located alerts" message.
11. Run `pnpm typecheck` -- zero errors.
12. Run `pnpm build` -- succeeds, no SSR errors from MapLibre.

## 5. Acceptance Criteria

### Gate Criterion

**AC-GATE:** Drill into any category from the coverage grid and see a MapLibre map in the lower-right quadrant of `CategoryDetailScene` with severity-colored markers for that category's geo-located intel items. The map auto-zooms to fit all visible markers. Clicking a marker shows a popup. `pnpm typecheck` and `pnpm build` both pass. Press Escape to reverse the morph cleanly.

### Dependencies & Build (4.1)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-1 | `maplibre-gl` and `react-map-gl` are listed in `package.json` dependencies | `pnpm list maplibre-gl react-map-gl` shows both packages |
| AC-2 | `pnpm install` resolves all dependencies without errors or peer dependency warnings for maplibre-gl | Run `pnpm install`; verify no unresolved peer deps |
| AC-3 | `pnpm typecheck` passes with zero errors after all deliverables are complete | Run `pnpm typecheck`; exit code 0 |
| AC-4 | `pnpm build` succeeds with no SSR-related errors from MapLibre | Run `pnpm build`; exit code 0; no `window is not defined` or `document is not defined` errors in build log |

### Map Rendering (4.5)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-5 | Map renders inside the district view overlay (not in CSS-transformed world-space) | Drill into a category; inspect DOM: `CoverageMap` is a descendant of the `district-view-overlay` element which has `position: fixed; inset: 0;`. No ancestor has a CSS `transform` property. |
| AC-6 | Map uses dark tile style consistent with the app's dark theme | Visual check: map tiles have dark background (CARTO dark-matter) |
| AC-7 | Map displays navigation controls (zoom +/-) in the top-right corner | Visual check: navigation buttons visible and functional |
| AC-8 | Map does not display a compass control | Visual check: no compass circle in the navigation control group |

### Markers & Data (4.2, 4.4)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-9 | Map shows markers only for the currently selected category | Drill into "Seismic"; markers are all seismic alerts. Drill into "Weather"; markers change to weather alerts. |
| AC-10 | Markers are colored by severity: Extreme=red, Severe=orange, Moderate=yellow, Minor=blue, Unknown=gray | Visual check: compare marker colors with their severity values (inspect via popup) |
| AC-11 | Markers cluster at low zoom levels with a count label displayed on each cluster circle | Zoom out until markers merge into clusters; verify count labels appear |
| AC-12 | Clicking a cluster zooms the map to expand that cluster | Click a cluster; verify map zooms in and cluster splits into individual markers or sub-clusters |
| AC-13 | At zoom 14+ all markers are individual (no clustering) | Zoom to level 14+; verify no cluster circles remain |

### Auto-Bounds (4.5.2)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-14 | Map auto-zooms to fit all markers for the selected category when the detail view opens | Drill into a category with multiple spread-out markers; verify the map viewport encompasses all markers with padding |
| AC-15 | Single-marker categories center on the marker at approximately zoom 8 | Drill into a category with exactly 1 geo-located alert; verify map is centered on that marker |
| AC-16 | Categories with no geo-located alerts show the map at world view (zoom ~2) with the empty state message | Drill into a category with no geo data; verify world view and "No geo-located alerts" label |

### Popup (4.3)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-17 | Clicking an individual marker shows a popup with the alert title | Click a marker; verify popup displays the `title` field |
| AC-18 | Popup shows a severity badge with a colored dot and the severity label in the corresponding color | Visual check: dot and label color match the marker color |
| AC-19 | Popup shows a relative timestamp (e.g., "2h ago") | Visual check: timestamp displayed and appears reasonable |
| AC-20 | Clicking elsewhere on the map dismisses the popup | Click empty map area after opening a popup; verify popup disappears |
| AC-21 | Popup styling matches the dark glass aesthetic (glass background, mono font, no default white MapLibre popup styling) | Visual check: popup has dark glass background, not the white default MapLibre popup |

### Loading & Error States (4.5.5, 4.5.6, 4.5.7)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-22 | While the map tiles are loading, a "Loading Map..." overlay is visible | Observe initial render (or throttle network in DevTools); loading overlay appears before tiles are visible |
| AC-23 | If WebGL is unavailable, a fallback message is displayed instead of the map | Disable WebGL in browser flags or use a software renderer; verify error message appears |
| AC-24 | Empty state message displays the category display name (e.g., "No geo-located alerts for Weather"), not the raw category ID | Drill into category with no markers; verify display name is used |

### Accessibility (4.5.9, 4.6.3)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-25 | Map container has `role="application"` and `aria-roledescription="map"` | Inspect DOM attributes |
| AC-26 | Map container has a dynamic `aria-label` that includes the marker count and category name | Inspect DOM: `aria-label` reads e.g. "Interactive map showing 42 Weather alerts" |
| AC-27 | A screen-reader-only live region announces data state changes | Inspect DOM: element with `aria-live="polite"` and `sr-only` class contains descriptive text |
| AC-28 | Keyboard navigation works: Tab into map, arrow keys pan, +/- keys zoom | Focus the map via Tab; use arrow keys and +/- keys to navigate |

### CSS & Styling (4.7)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-29 | MapLibre CSS is loaded globally (navigation controls, popups render correctly) | Visual check: zoom +/- buttons have proper styling, not unstyled HTML buttons |
| AC-30 | MapLibre popup has the custom dark glass styling, not the default white MapLibre popup | Visual check: compare with the custom `MapPopup` design |
| AC-31 | Navigation control has the dark theme override (dark background, light icons) | Visual check: control group has dark glass background |
| AC-32 | MapLibre CSS overrides do not affect non-map components | Visual check: navigate the rest of the app; no styling regressions |

### Integration & Cleanup (4.6)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-33 | The WS-3.1 map placeholder `<div>` with "Map -- WS-4.1" label is fully removed from `CategoryDetailScene.tsx` | Grep for `Map -- WS-4.1` in the file; zero results |
| AC-34 | No `role="img"` with `aria-label="Map placeholder, coming soon"` remains | Grep for `Map placeholder` in `CategoryDetailScene.tsx`; zero results |
| AC-35 | `CoverageMap` is dynamically imported with `ssr: false` (no SSR for MapLibre) | Code review: `next/dynamic` with `{ ssr: false }` wrapping the import |
| AC-36 | Morph reverse (Escape key) unmounts the map cleanly with no WebGL errors in the console | Open DevTools console; drill into category; press Escape; verify no errors logged |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Use CARTO dark-matter as the tile source (`https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`) | Free, no API key, dark theme that matches the app's visual language, good global coverage, reliable CDN. The combined-recommendations document specified "free, no token" as a requirement for Decision 5. CARTO dark-matter is the standard free dark tile for MapLibre projects. | (a) MapLibre demo tiles (`https://demotiles.maplibre.org/style.json`) -- usable for dev but visually basic, not dark-themed, limited detail; (b) MapTiler dark -- requires API key and free tier has rate limits; (c) Protomaps self-hosted -- excellent but requires tile hosting infrastructure not in scope; (d) Stamen Toner -- no longer freely available. Production tile source can be swapped later by changing one URL string (see OQ-1). |
| D-2 | Color markers by severity (not category) using MapLibre data-driven `circle-color` paint expression | The map already filters to a single category, so category color would make all markers the same color. Severity coloring provides useful information density: the user can see geographic clusters of high-severity alerts at a glance. This aligns with the severity color system already defined in `TYPESCRIPT-TYPES.md` and used throughout the detail scene. | (a) Single category color for all markers -- low information density since the category filter is already applied; (b) Color by source -- too many sources, hard to distinguish, no existing color map; (c) Color by recency -- less actionable than severity for a safety-focused dashboard |
| D-3 | Use MapLibre GeoJSON source with circle layers (not HTML `<Marker>` components) | GeoJSON source + circle layers render via WebGL, handling 1000 markers at 60fps. HTML `<Marker>` components create individual DOM elements, which degrades performance above ~100 markers. The `useCoverageMapData` hook fetches up to 1000 markers (per `.limit(1000)` in WS-1.3 Section 4.4.3). Circle layers also enable data-driven styling via MapLibre expressions (severity-based coloring) without per-marker React re-renders. | (a) react-map-gl `<Marker>` components -- simple API but DOM-heavy, 1000 markers creates 1000 DOM nodes; (b) Symbol layer with custom icons -- more complex, requires icon atlas, overkill for dots; (c) Heatmap layer -- loses individual marker identity, cannot click individual points |
| D-4 | Enable built-in MapLibre clustering via `cluster: true` on the GeoJSON source | Prevents visual clutter at low zoom levels when markers overlap. MapLibre's built-in clustering is performant (computed on the GPU), configurable (max zoom, radius), and requires no additional library. Cluster circles show the count and expand on click. This provides a better UX than 1000 overlapping circle markers at world zoom. | (a) No clustering -- acceptable for small datasets but cluttered at 1000 markers; (b) Supercluster library -- more customizable but redundant when MapLibre has clustering built-in; (c) Server-side clustering -- requires backend changes, over-engineering for this data volume |
| D-5 | Dynamically import `CoverageMap` via `next/dynamic` with `ssr: false` rather than a React `lazy` wrapper | `next/dynamic` with `ssr: false` is the standard Next.js pattern for components that require browser APIs (WebGL, `window`, `document`). MapLibre GL JS accesses `window` at module evaluation time, which crashes during Next.js SSR/static-generation. `React.lazy` would also defer loading but does not prevent the module from being included in the server bundle. `next/dynamic` with `ssr: false` completely excludes the module from server-side rendering. | (a) `React.lazy` + `Suspense` -- defers rendering but module is still imported on the server, causing `window is not defined`; (b) Conditional `typeof window !== 'undefined'` check -- fragile, does not prevent webpack from bundling the module; (c) Client Component boundary only (`'use client'`) -- marks the component as client-only for rendering but webpack may still evaluate the import at build time |
| D-6 | MapLibre CSS imported via a dedicated `maplibre-overrides.css` file with `@import` for the base styles, not via a JS `import` in the component | CSS `@import` in a dedicated override file keeps all MapLibre styling in one place: base styles and dark theme overrides. Importing MapLibre CSS via JavaScript (`import 'maplibre-gl/dist/maplibre-gl.css'`) in a dynamically loaded component can cause a flash of unstyled content (FOUC) when the map chunk loads. Global import in the layout ensures styles are available from page load. The override file is also easier to maintain: all `.maplibregl-*` overrides are co-located. | (a) JS import in CoverageMap.tsx -- FOUC risk, styles load with the dynamic chunk; (b) Copy MapLibre CSS into the project -- maintenance burden on library updates; (c) Tailwind `@plugin` -- MapLibre styles are not Tailwind-compatible |
| D-7 | Use `react-map-gl/maplibre` import path (not `react-map-gl` with a `mapLib` prop) | `react-map-gl` v8 provides a first-class MapLibre entry point at `react-map-gl/maplibre` that types all APIs against MapLibre GL JS (not Mapbox GL JS). This gives correct TypeScript types, avoids the `mapLib` runtime prop, and tree-shakes out Mapbox-specific code. The `maplibre-gl` package is listed as a peer dependency via this entry point. | (a) `import Map from 'react-map-gl'` with `mapLib={maplibregl}` prop -- works but types are Mapbox-flavored, and `mapLib` is a runtime indirection; (b) Use `maplibre-gl` directly without react-map-gl -- more boilerplate for React integration (imperative map lifecycle, manual cleanup, no declarative layers) |
| D-8 | Hide the MapLibre attribution control via `attributionControl={false}` and rely on tile source attribution | CARTO's dark-matter style JSON includes attribution metadata that MapLibre renders in the tile JSON response. The default MapLibre attribution control UI is visually noisy against the dark theme and overlaps the map content area in the constrained lower-right quadrant. Hiding the control does not remove attribution credit -- it is included in the tile source metadata. If explicit attribution is required by CARTO's terms, a discrete text link can be added to the `CategoryDetailScene` below the map. | (a) Keep default attribution control -- visually cluttered, inconsistent with dark theme; (b) Custom attribution component -- extra work for information already in tile metadata |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | What is the production tile source? CARTO dark-matter is selected for development and initial launch (free, no API key). For production at scale, options include MapTiler (API key, generous free tier, premium dark tiles), Protomaps (self-hosted, one-time cost, offline-capable), or Stadia Maps (API key, free tier). The tile source is a single URL string in `CoverageMap.tsx` and can be swapped without code changes. | DevOps / Product | Post-launch. Non-blocking for WS-4.1. CARTO is suitable for launch. |
| OQ-2 | Should the map support a severity filter within the category view? Currently, the map shows all markers for the selected category. Adding a severity toggle (e.g., "Show Extreme only") would allow users to focus on critical alerts. This requires extending the `useCoverageMapData` filter to include `severity` (already supported by the hook per WS-1.3 Section 4.4.1) and adding a control UI. | react-developer | Post-Phase 4. The hook already supports the filter parameter. UI design needed. |
| OQ-3 | Should marker popups include a "View details" link that navigates to a full alert detail page? No such page exists in the current app. WS-3.1 OQ-1 deferred this for the alert list as well. Consistency suggests both the map popup and alert list should gain interactivity at the same time. | react-developer | Post-Phase 4 (same timeline as WS-3.1 OQ-1). Requires a dedicated alert detail view. |
| OQ-4 | CARTO dark-matter style JSON references `Open Sans Regular` for text labels (cluster counts, map labels). If this font is not available (e.g., blocked by CSP, offline), MapLibre falls back to the system sans-serif. Should a custom font stack be configured, or is the fallback acceptable? | react-developer | Phase 4 (this WS). Recommendation: accept the fallback. The cluster count label is the only text rendered via MapLibre. System sans-serif is acceptable for numeric labels. Configuring custom fonts in MapLibre's style JSON adds complexity for minimal visual benefit. |
| OQ-5 | Should `maplibre-overrides.css` use Tailwind `@layer` for proper cascade ordering, or is a plain CSS file sufficient given the `!important` overrides? Tailwind v4 uses `@layer` internally. If MapLibre styles conflict with Tailwind's reset layer, the override specificity may need adjustment. | react-developer | Phase 4 (this WS). Recommendation: plain CSS with `!important` is sufficient. MapLibre class names (`.maplibregl-*`) have no overlap with Tailwind utility classes. The `!important` flags ensure overrides win regardless of cascade layer ordering. If issues arise, wrap in `@layer overrides { ... }` as a fix. |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WebGL canvas renders incorrectly due to unexpected CSS transforms in the ancestor chain of the district view overlay | Low | High (map appears blank, distorted, or offset) | Decision 5 explicitly places the map inside the district view overlay which uses `position: fixed; inset: 0; zIndex: 30` (verified at `district-view-overlay.tsx` lines 86-89). The overlay is a direct child of the root layout, not a child of `SpatialCanvas` (which carries the CSS `transform: scale()` for the ZUI). Verify with DOM inspection that no ancestor between the layout root and the overlay has a `transform` property. If an ancestor adds `transform` (e.g., for portal rendering), restructure the overlay mount point. |
| R-2 | `pnpm build` fails with `window is not defined` or `document is not defined` during SSR/static generation | Medium | High (build blocked) | `CoverageMap` is imported via `next/dynamic` with `ssr: false` (Deliverable 4.6.1), which excludes it from the server bundle. However, if `maplibre-gl` is imported transitively by a non-dynamic module (e.g., a type import that pulls in runtime code), the error can surface. Mitigation: ensure all imports from `maplibre-gl` are inside dynamically imported modules only. If the error persists, add `maplibre-gl` to Next.js `transpilePackages` and/or use `import type` for type-only imports. |
| R-3 | CARTO dark-matter tile CDN is unavailable or rate-limited, resulting in a blank map | Low | Medium (map shows but tiles are missing; markers still render on empty background) | CARTO's CDN is globally distributed and highly available. If it goes down, the map canvas renders with a dark background (no tiles) but markers are still visible as colored circles against the dark canvas. The `mapStyle` URL is a single string in `CoverageMap.tsx` and can be swapped to an alternative tile source (MapTiler, Protomaps) without code changes. Add a `onError` handler to the `<Map>` component that logs tile fetch failures for monitoring. |
| R-4 | Bundle size impact of MapLibre GL JS (~200KB gzipped) exceeds acceptable thresholds | Low | Low (map chunk is loaded on-demand, not in initial bundle) | The `CoverageMap` component is dynamically imported with `ssr: false` and only loads when a user drills into a category detail view. The initial page load bundle is unaffected. The 200KB cost is amortized by the morph animation duration (~600ms entering-district phase), providing a natural loading window. If bundle size is a concern, `maplibre-gl` can be loaded from a CDN via `importScripts` or module federation, but this is over-engineering for the current use case. |
| R-5 | `react-map-gl` v8 has a breaking change or incompatibility with MapLibre GL JS v5 or React 19 | Medium | Medium (type errors or runtime failures at integration) | Pin specific versions in `package.json` (`"maplibre-gl": "^5.1.0"`, `"react-map-gl": "^8.0.0"`). Test the integration immediately after installation (AC-1, AC-2). react-map-gl v8 officially supports MapLibre as a first-class backend via the `/maplibre` entry point. React 19 compatibility should be verified in the react-map-gl changelog. If incompatible, `react-map-gl` v7 with the `mapLib` prop pattern is the fallback. |
| R-6 | `calculateBounds()` from `coverage-utils.ts` returns bounds that are too tight or too wide, causing the map to zoom to an unexpected level | Low | Low (poor initial zoom, but user can manually zoom) | `calculateBounds()` (WS-1.3) computes a bounding box from marker coordinates. The `fitBounds` call in `CoverageMap` adds `padding: 60` and caps at `maxZoom: 12` (Deliverable 4.5.2). These safeguards prevent over-zooming on tight clusters and under-zooming on spread data. If the bounds are still unsatisfactory, adjust the `padding` value or add a minimum bounds extent check. |
| R-7 | MapLibre keyboard navigation (arrow keys, +/-) conflicts with the app's existing keyboard shortcuts (e.g., Escape for morph reverse, Cmd+K for command palette) | Low | Low (degraded keyboard experience) | MapLibre handles keyboard events only when its canvas has focus. The morph reverse (Escape) is handled by a global `useEffect` listener in the morph orchestrator (WS-2.2), which fires regardless of focus. Cmd+K for the command palette is handled by the `CommandPalette` component. Neither conflicts with MapLibre's per-canvas keyboard handling. If a conflict is discovered, add `event.stopPropagation()` guards in the map's key event handler. |
| R-8 | WS-3.1 `CategoryDetailScene` has diverged from the expected structure (e.g., placeholder removed, layout changed, `markers` variable renamed) when WS-4.1 implementation starts | Medium | Low (requires minor adaptation) | Read the actual `CategoryDetailScene.tsx` file at implementation time. The integration point is a single `<div>` with `role="img"` and `aria-label="Map placeholder, coming soon"` text, identifiable by grep. The `markers` variable comes from `useCoverageMapData({ category: categoryId })` which is a stable hook call. If the variable is renamed, the TanStack Query hook return shape is unchanged. Adapt the replacement code to match the actual file state. |
| R-9 | 1000 markers with clustering causes noticeable jank on lower-end devices | Low | Low (degraded experience on weak hardware, not a crash) | MapLibre's WebGL rendering and built-in clustering are optimized for this scale. Circle layers render entirely on the GPU. Clustering reduces the rendered feature count at low zoom levels. If performance is an issue, reduce `.limit(1000)` in the `useCoverageMapData` query (WS-1.3) or increase `clusterRadius` to merge more aggressively. |
| R-10 | MapLibre CSS overrides in `maplibre-overrides.css` cause visual regressions in non-map components | Low | Low (styling leak) | All overrides target `.maplibregl-*` class names which are namespaced to MapLibre components. No Tailwind utility classes are overridden. The `!important` flags are scoped to MapLibre selectors only. Run a visual smoke test of the full app (launch page, morph, panels, command palette) after adding the CSS file. If any regression is found, wrap the overrides in a `.coverage-map-container` parent selector for additional scoping. |
