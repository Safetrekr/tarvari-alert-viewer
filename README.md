# TarvaRI Alert Viewer

A spatial intelligence dashboard for viewing triaged intel alerts from the TarvaRI intelligence system. Built on a custom CSS-transform ZUI (Zoomable User Interface) engine with semantic zoom levels, morph-choreographed drill-down navigation, and a MapLibre GL map overlay.

Part of the [SafeTrekr](https://safetrekr.com) platform. All data flows through the TarvaRI backend API.

<!-- Screenshot placeholder: add a screenshot of the dashboard at Z1 zoom level -->
<!-- ![TarvaRI Alert Viewer](docs/images/screenshot.png) -->

---

## Features

- **Spatial ZUI engine** -- pan, zoom, and navigate an infinite canvas with momentum physics and spring-animated flyTo
- **Semantic zoom** -- the interface changes representation at four zoom levels (Z0-Z3) with hysteresis to prevent flicker
- **15 intel categories** -- seismic, weather, conflict, health, fire, flood, storm, and more, each with color-coded cards and icons
- **Interactive map** -- MapLibre GL dark-matter basemap with clustered severity-colored markers and auto-fitted bounds
- **Category drill-down** -- click a category card to trigger a 6-phase morph animation into a full-screen district view
- **Three view modes** -- Triaged (approved bundles), All Bundles (full pipeline), Raw Alerts (unprocessed feed)
- **URL-synced filters** -- category selection and view mode persist to URL params for deep linking
- **Ambient effects layer** -- dot grid, halo glow, range rings, scan lines, calibration marks, and a session timecode -- all gated behind a user preference toggle
- **Command palette** -- Cmd+K search and navigation
- **Live polling** -- TanStack Query hooks poll the TarvaRI API at 30-60s intervals

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1 |
| UI | React | 19.2 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS v4 + @tarva/ui | 4.1 |
| State | Zustand + Immer | 5.0 |
| Data fetching | TanStack Query | 5.x |
| Map | MapLibre GL JS + react-map-gl | 5.19 / 8.1 |
| Animation | motion/react + CSS keyframes + rAF physics | 12.x |
| Package manager | pnpm | -- |

Requires **Node >= 22**.

---

## Prerequisites

1. **Node.js >= 22** and **pnpm** installed
2. **TarvaRI backend** running on port 8000 -- this is the data source
3. **@tarva/ui** workspace dependency linked from `../../tarva-ui-library/`

The TarvaRI backend provides the `/console/*` API endpoints that this dashboard reads from. Without it, the dashboard loads but shows no data.

---

## Getting Started

```bash
# 1. Clone and install
cd tarvari-alert-viewer
pnpm install

# 2. Start the TarvaRI backend (from the project root)
cd ../TarvaRI
uvicorn app.main:app --reload --port 8000
# Or use the orchestration script:
# cd .. && ./dev.sh start --intel

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
#   NEXT_PUBLIC_TARVARI_API_URL=http://localhost:8000

# 4. Start the dev server
pnpm dev
# Open http://localhost:3000
# Login passphrase: tarva
```

### Available Commands

```bash
pnpm dev          # Dev server (webpack mode, port 3000)
pnpm build        # Production build (webpack mode)
pnpm typecheck    # tsc --noEmit
pnpm lint         # ESLint
pnpm format       # Prettier
```

---

## Architecture Overview

### The Spatial ZUI Concept

The entire interface is a pannable, zoomable 2D canvas. Content is positioned at world-space coordinates and rendered through a single CSS transform:

```
translate(offsetX, offsetY) scale(zoom)
```

Two components form the engine core:

- **`SpatialViewport`** -- fills the screen, captures pointer/wheel events, measures viewport dimensions
- **`SpatialCanvas`** -- the CSS-transformed container. Uses `useCameraStore.subscribe()` for direct DOM writes, bypassing React reconciliation entirely during pan/zoom. This is the critical performance pattern.

```
SpatialViewport (fixed, fills screen, captures events)
  SpatialCanvas (absolute, CSS transform: translate + scale)
    DotGrid (20000x20000 background)
    SectorGrid (2000px grid with sector labels)
    EnrichmentLayer (halo, rings, coordinates)
    CoverageMap (MapLibre GL)
    MorphOrchestrator (category grid or icon dots)
    SystemStatusPanel, FeedPanel, ActivityTicker
  /SpatialCanvas
/SpatialViewport

NavigationHUD (fixed overlay, z-40)
DistrictViewOverlay (fixed overlay, z-30)
TriageRationalePanel (fixed overlay, z-45)
CommandPalette (Dialog, z-50)
HorizonScanLine, SessionTimecode, etc. (fixed chrome)
```

**Key constraint:** `SpatialCanvas` sets `pointer-events: none` on itself. Any interactive child must explicitly re-enable pointer events with `style={{ pointerEvents: 'auto' }}`.

### Semantic Zoom Levels

The camera zoom value (range: 0.08 to 3.0) maps to four semantic levels. The interface changes its representation at each level. Transitions use 10% hysteresis bands to prevent flicker at boundaries.

```
Zoom value:  0.08 -------- 0.27/0.30 -------- 0.72/0.80 -------- 1.35/1.50 -------- 3.0

Semantic:    |---- Z0 ----|---- Z1 ----------|---- Z2 ----------|---- Z3 ---------|
             Constellation  Atrium (default)   District            Station

What shows:  Colored dots   Category cards     Category cards      Deep zoom details
             + short codes  + live metrics     + map + panels      + edge fragments
                            + map overlay
                            + ambient panels
```

| Level | Name | Zoom Range | What Renders |
|-------|------|-----------|-------------|
| Z0 | Constellation | < 0.27 | `CategoryIconGrid` -- colored dots with 3-letter codes (SEIS, WX, FIR) |
| Z1 | Atrium | 0.30 - 0.79 | `CoverageGrid` -- 9-column card grid, map, overview stats, ambient panels |
| Z2 | District | 0.80 - 1.49 | Same as Z1 with coordinate overlays |
| Z3 | Station | >= 1.50 | Deep zoom details, edge fragments |

The `ZoomGate` component conditionally mounts/unmounts children based on the current semantic level:

```tsx
<ZoomGate show={['Z1', 'Z2']}>
  <SystemStatusPanel />  {/* Only mounted at Z1 and Z2 */}
</ZoomGate>
```

Components are fully unmounted (not hidden with CSS) when outside their zoom range, releasing GPU and memory resources.

### Morph State Machine

When a user clicks a category card, a 6-phase state machine drives the transition from grid view to full-screen district view:

```
FORWARD FLOW:

  idle ──startMorph(id)──> expanding ──400ms──> settled ──200ms──> entering-district ──600ms──> district
         │                  │                   │                   │                            │
         │                  │ Card scales 1.2x  │ URL updated       │ Overlay fades in           │ Interactive
         │                  │ Siblings dim 0.3  │ Brief hold        │ Gradient background        │ district view
         │                  │                   │                   │                            │

REVERSE FLOW (from district):

  district ──reverseMorph()──> leaving-district ──400ms──> idle
                                │                          │
                                │ Overlay fades out        │ resetMorph() clears all state
                                │                          │ URL category param removed

REVERSE FLOW (from settled):

  settled ──reverseMorph()──> expanding (reverse) ──300ms──> idle
```

The state machine is defined in `src/lib/morph-types.ts` and driven exclusively by the `useMorphChoreography()` hook. No other code should call `setMorphPhase()` directly.

**Reduced motion:** When `prefers-reduced-motion: reduce` is detected, all morph durations are set to 0ms (instant transitions).

---

## Data Flow

```
TarvaRI Backend API (localhost:8000)
       │
       │  /console/coverage ──────────────> useCoverageMetrics()  ──> CoverageOverviewStats
       │  /console/intel ─────────────────>                           CategoryCard (alert counts)
       │
       │  /console/coverage/map-data ─────> useCoverageMapData()  ──> CoverageMap (MapLibre GL)
       │    (GeoJSON FeatureCollection)
       │
       │  /console/intel?limit=50 ────────> useIntelFeed()        ──> FeedPanel, ActivityTicker
       │
       │  /console/bundles ───────────────> useIntelBundles()     ──> ViewModeToggle counts
       │    ?status=approved (triaged)                                TriageRationalePanel
       │    (no filter for all-bundles)
       │
       │  /console/bundles/:id ───────────> useBundleDetail()     ──> Bundle detail panel
       │
       └──────────── tarvariGet<T>() ── src/lib/tarvari-api.ts (typed fetch wrapper)
```

### API Client

All data flows through a single typed fetch wrapper:

```typescript
// src/lib/tarvari-api.ts
const BASE_URL = process.env.NEXT_PUBLIC_TARVARI_API_URL ?? 'http://localhost:8000'

export async function tarvariGet<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
): Promise<T>
```

### Data Hooks

| Hook | Endpoint | Poll Interval | Returns |
|------|----------|--------------|---------|
| `useCoverageMetrics()` | `/console/coverage` + `/console/intel` | 60s | Source counts, alert counts per category |
| `useCoverageMapData(filters?)` | `/console/coverage/map-data` | 30s | `MapMarker[]` from GeoJSON |
| `useIntelFeed()` | `/console/intel?limit=50` | 30s | Recent intel items for ambient panels |
| `useIntelBundles(viewMode)` | `/console/bundles` | 45s | Clustered bundles (disabled for `raw` mode) |
| `useBundleDetail(id)` | `/console/bundles/:id` | on-demand | Single bundle with full detail |

All hooks normalize API snake_case responses to camelCase TypeScript types. Shared types live in `src/lib/coverage-utils.ts`.

### Two-Store Architecture

Data state and animation state are deliberately separated into two Zustand stores:

```
ui.store.ts (animation & navigation)          coverage.store.ts (data & filtering)
├── morph.phase (idle/expanding/settled/...)   ├── selectedCategories: string[]
├── morph.direction (forward/reverse)          ├── viewMode: 'triaged'|'all-bundles'|'raw'
├── morph.targetId                             ├── selectedBundleId: string | null
├── selectedDistrictId                         └── URL sync helpers
└── commandPaletteOpen
```

**Design decision:** The morph system drives visual transitions. The coverage store drives data queries. They do not cross-reference each other.

---

## Component Layering

The page composes five visual layers. Understanding the z-index stacking order is essential for debugging layout issues.

```
Layer 5 (z-50)  CommandPalette (Dialog)
Layer 4 (z-45)  TriageRationalePanel (slide-out)
Layer 3 (z-40)  NavigationHUD (breadcrumb, minimap, logo, zoom indicator, color scheme)
                HorizonScanLine, SessionTimecode, CalibrationMarks
                TopTelemetryBar, BottomStatusStrip
Layer 2 (z-30)  DistrictViewOverlay (full-screen, morph-gated)
Layer 1 (z-auto) SpatialViewport > SpatialCanvas
                  ├── Background: DotGrid, SectorGrid
                  ├── Enrichment: HaloGlow, MicroChronometer, RangeRings, CoordinateOverlays
                  ├── Data: ViewModeToggle, CoverageMap, CoverageOverviewStats, MapLedger
                  ├── Content: MorphOrchestrator (CoverageGrid or CategoryIconGrid)
                  ├── Panels: SystemStatusPanel, FeedPanel, SignalPulseMonitor, ActivityTicker
                  └── Discovery: DeepZoomDetails, EdgeFragments
```

**World-space vs. viewport-space:**

- Layers 1 (inside `SpatialCanvas`) are in **world space** -- they move and scale with the camera
- Layers 2-5 are **viewport-fixed** (`position: fixed`) -- they stay in place regardless of pan/zoom

---

## Key Concepts

### World-Space Coordinates

Content inside `SpatialCanvas` is positioned with `position: absolute` at world-space pixel coordinates. The origin (0, 0) is the center of the coverage grid. The grid dimensions are:

```
GRID_WIDTH  = 1600px  (world-space)
GRID_HEIGHT =  400px  (world-space)
GRID_COLUMNS = 9
```

The grid is centered at origin: `left: -(GRID_WIDTH / 2)`, `top: -(GRID_HEIGHT / 2)`.

### Camera Model

The camera state (`camera.store.ts`) tracks:

- `offsetX`, `offsetY` -- world-space translation in pixels
- `zoom` -- scale factor (0.08 to 3.0, default 0.5)
- `semanticLevel` -- derived Z0/Z1/Z2/Z3
- `isAnimating`, `isPanning` -- motion flags

The camera uses spring physics for `flyTo` animations (stiffness: 120, damping: 20, mass: 1.1).

### Enrichment System

Ambient visual effects (dot grid, glow, range rings, scan lines, particles) are gated behind the `effectsEnabled` user preference in `settings.store.ts`. The `EnrichmentLayer` component:

1. Returns `null` when effects are disabled (children unmounted entirely)
2. Wraps children with `aria-hidden="true"` and `pointer-events: none`
3. Propagates a `data-panning` attribute that CSS keyframes use to pause animations during camera motion

The enrichment store (`enrichment.store.ts`) holds simulated telemetry data (uptime, response times, health states) that feeds the ambient panels. The `useEnrichmentCycle` hook ticks the store every 2 seconds.

### View Modes

The `ViewModeToggle` switches between three data views:

| Mode | Data Source | Description |
|------|-----------|-------------|
| **Triaged** | `useIntelBundles('triaged')` | Approved bundles only. Analyst-curated view. |
| **All Bundles** | `useIntelBundles('all-bundles')` | All bundles regardless of status. Full pipeline visibility. |
| **Raw** | `useCoverageMapData()` + `useIntelFeed()` | Individual normalized intel items. Unprocessed feed. |

View mode syncs to the URL as `?view=all-bundles` (omitted for the default `triaged` mode).

### Categories and Severity

**15 categories** defined in `src/lib/interfaces/coverage.ts`:

`seismic`, `geological`, `disaster`, `humanitarian`, `health`, `aviation`, `maritime`, `infrastructure`, `weather`, `conflict`, `fire`, `flood`, `storm`, `multi-hazard`, `other`

Each has a display name, 3-letter short code, Lucide icon, CSS color variable, and description.

**5 severity levels:** Extreme (red), Severe (orange), Moderate (yellow), Minor (blue), Unknown (gray).

---

## Configuration

Copy `.env.example` to `.env.local`:

```bash
# Required -- Supabase credentials (shared across SafeTrekr platform)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# TarvaRI backend API URL (defaults to http://localhost:8000 if omitted)
NEXT_PUBLIC_TARVARI_API_URL=http://localhost:8000

# Optional -- Claude AI features
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

User preferences (minimap, effects, breadcrumb visibility) are persisted to `localStorage` under the key `tarva-launch-settings`.

Authentication sessions are stored in `sessionStorage` under `tarva-launch-session`.

---

## Project Structure

```
src/
  app/
    (launch)/             # Main spatial layout + page (auth-guarded)
    api/                  # Server API routes (to be removed for static export)
    login/                # Login page
  components/
    spatial/              # ZUI engine core
      SpatialViewport     #   Screen-filling container, pan/zoom event capture
      SpatialCanvas       #   CSS-transform container, direct DOM writes
      NavigationHUD       #   Fixed overlay: breadcrumb, minimap, controls
      CommandPalette      #   Cmd+K search and navigation
      Minimap, ZoomIndicator
    coverage/             # Data visualization components
      CoverageGrid        #   9-column CSS Grid of CategoryCards
      CategoryCard        #   Individual category card with hover actions
      CategoryIconGrid    #   Z0 compact dot representation
      CoverageMap         #   MapLibre GL map with clustered markers
      CoverageOverviewStats   # Source/alert count summary
      ViewModeToggle      #   Triaged / All Bundles / Raw switch
      MapLedger           #   Map legend panel
      TriageRationalePanel    # Bundle detail slide-out
    districts/            # Morph orchestration
      morph-orchestrator  #   Z0/Z1 switching + morph triggering
      dot-grid            #   Background dot pattern
    district-view/        # Full-screen category detail
      district-view-overlay   # Fixed overlay, morph-gated
      district-view-header    # Back button, category name
      district-view-dock      # Glass metadata panel
      district-view-content   # Category detail scene
    ambient/              # Visual effects (30+ components)
      enrichment-layer    #   Effects toggle gate
      zoom-gate           #   Zoom-level conditional rendering
      halo-glow, range-rings, scan-line, dot-grid, particles, ...
    ui/                   # Shared UI (breadcrumb, color scheme switcher)
  hooks/                  # ~37 custom hooks
    use-pan, use-zoom     #   Core camera interaction
    use-semantic-zoom     #   Z-level detection
    use-morph-choreography    # Morph state machine driver
    use-coverage-metrics  #   TanStack Query: coverage data
    use-coverage-map-data #   TanStack Query: map markers
    use-intel-feed        #   TanStack Query: live feed
    use-intel-bundles     #   TanStack Query: bundle data
    use-camera-sync       #   URL <-> camera state
    use-fly-to            #   Spring-animated camera movement
    use-pan-pause         #   Pause effects during motion
    use-keyboard-shortcuts    # Declarative shortcut registration
    use-enrichment-cycle  #   2s tick for ambient data
    use-narration-cycle   #   Narration state cycling
    use-attention-choreography    # Visual attention system
  stores/                 # Zustand state stores
    camera.store          #   Camera position, zoom, semantic level
    ui.store              #   Morph state machine, selection, command palette
    coverage.store        #   Category filters, view mode, bundle selection
    settings.store        #   User preferences (persisted to localStorage)
    enrichment.store      #   Ambient telemetry data
    auth.store            #   Passphrase authentication
    attention.store       #   Attention choreography state
    narration.store       #   Narration state
  lib/
    tarvari-api.ts        #   Typed fetch wrapper for TarvaRI backend
    spatial-math.ts       #   Zoom-to-cursor, hysteresis, momentum, springs
    constants.ts          #   All spatial constants (zoom range, thresholds, timing)
    morph-types.ts        #   Morph state machine types and timing config
    coverage-utils.ts     #   Data transformation utilities
    interfaces/
      coverage.ts         #   Category metadata, severity levels, grid types
      intel-bundles.ts    #   View modes, bundle composite types
      district.ts         #   District/node identifiers
  styles/                 # CSS modules (atrium, morph, enrichment, coverage)
docs/                     # Planning artifacts and design specs
```

---

## Adding a New Data Hook

To add a new TanStack Query hook that fetches from the TarvaRI API:

```typescript
// src/hooks/use-my-data.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { tarvariGet } from '@/lib/tarvari-api'

// 1. Define the API response type (snake_case)
interface ApiMyDataResponse {
  items: Array<{ item_id: string; display_name: string }>
  total_count: number
}

// 2. Define your camelCase return type
export interface MyDataItem {
  itemId: string
  displayName: string
}

// 3. Write the query function with normalization
async function fetchMyData(): Promise<MyDataItem[]> {
  const data = await tarvariGet<ApiMyDataResponse>('/console/my-endpoint')
  return data.items.map((item) => ({
    itemId: item.item_id,
    displayName: item.display_name,
  }))
}

// 4. Export the hook
export function useMyData() {
  return useQuery<MyDataItem[]>({
    queryKey: ['my-data'],
    queryFn: fetchMyData,
    staleTime: 30_000,       // 30 seconds
    refetchInterval: 45_000, // 45 seconds
  })
}
```

---

## Development Notes

### Performance: The Subscribe Pattern

`SpatialCanvas` is the hottest component. It updates its CSS transform on every camera change (potentially every animation frame). It avoids React re-renders entirely by using `useCameraStore.subscribe()` for direct DOM writes:

```typescript
// Direct DOM write -- never triggers React reconciliation
const unsubscribe = useCameraStore.subscribe((state) => {
  canvas.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`
})
```

Use `useCameraStore()` with selectors only for low-frequency reads (e.g., reading `semanticLevel` for content switching).

### Pointer Events on SpatialCanvas

`SpatialCanvas` disables `pointer-events` on itself so that pan/zoom events pass through to the viewport. Every interactive child must re-enable them:

```tsx
<SpatialCanvas>
  {/* This div is not clickable -- pointer events are disabled by the canvas */}
  <div>Not interactive</div>

  {/* This div IS clickable */}
  <div style={{ pointerEvents: 'auto' }}>
    <button onClick={handleClick}>Click me</button>
  </div>
</SpatialCanvas>
```

This is the most common gotcha when adding new interactive elements to the canvas.

### Morph Choreography Ownership

Only `useMorphChoreography()` may call `setMorphPhase()`. If you need to trigger a morph from outside the orchestrator, call `startMorph(nodeId)` or `reverseMorph()` on the UI store -- the choreography hook handles the phase sequencing.

### Import Conventions

- **motion/react** -- always import from `motion/react`, never `framer-motion`
- **pnpm** -- always use `pnpm`, never `npm`
- **Types** -- shared contracts go in `src/lib/interfaces/`. Feature-local types stay in the feature. Never use `src/types/`.

### Webpack Mode

Both `pnpm dev` and `pnpm build` use the `--webpack` flag. This is required for compatibility with the current dependency graph and MapLibre GL dynamic imports.

### Reduced Motion

The app detects `prefers-reduced-motion: reduce` and passes it through to the morph choreography, which sets all transition durations to 0ms. Ambient effects are separately controlled by the settings store toggle.

---

## Related Projects

| Project | Path | Relationship |
|---------|------|-------------|
| **TarvaRI** (backend) | `../TarvaRI/` | Intel API + workers. The data source for this dashboard. |
| **@tarva/ui** | `../../tarva-ui-library/` | Shared component library (workspace dependency). |
| **SafeTrekr App** | `../safetrekr-app-v2/` | Main SafeTrekr app. Also reads trip_alerts for end-user display. |

---

## License

See LICENSE file.
