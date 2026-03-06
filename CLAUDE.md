# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

TarvaRI Alert Viewer — a spatial dashboard for viewing triaged intel alerts from the TarvaRI intelligence system. Built on the tarva-launch spatial ZUI (Zoomable User Interface) engine.

Part of the SafeTrekr platform. All data flows through the TarvaRI backend API at `localhost:8000` via `/console/*` endpoints. The Supabase client exists in the codebase but data hooks have been switched to use the TarvaRI API directly.

**Origin:** Cloned from `tarva-launch`. The spatial ZUI engine, ambient effects, morph choreography, and design system are inherited.

**Deployment target:** GitHub Pages (Next.js static export).

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5.9
- **Styling:** Tailwind CSS v4 + @tarva/ui (workspace dep from `../../tarva-ui-library`)
- **State:** Zustand 5 + Immer
- **Data fetching:** TanStack Query 5 via `src/lib/tarvari-api.ts` (typed fetch wrapper)
- **Map:** MapLibre GL JS via react-map-gl (loaded with `next/dynamic` ssr:false)
- **Animation:** motion/react v12 + CSS @keyframes + rAF physics (camera)
- **Package manager:** pnpm (never npm)

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server (http://localhost:3000) — uses --webpack flag
pnpm build            # Production build — uses --webpack flag
pnpm typecheck        # TypeScript check (tsc --noEmit)
pnpm lint             # ESLint
pnpm format           # Prettier
```

Requires Node >= 22. Path alias: `@/*` maps to `./src/*`.

**Prerequisite:** TarvaRI backend must be running on port 8000 for data. Start it from `../TarvaRI/` or via the root `dev.sh start --intel`.

## Architecture

### Data Flow

All data comes from the TarvaRI backend API (`NEXT_PUBLIC_TARVARI_API_URL`, default `http://localhost:8000`). The API client is `src/lib/tarvari-api.ts` — a simple typed `tarvariGet<T>(endpoint, params?)` wrapper.

Five TanStack Query hooks fetch data:

| Hook | API Endpoint | Returns | Poll |
|------|-------------|---------|------|
| `useCoverageMetrics` | `/console/coverage` + `/console/intel` | Source counts, alert counts per category | 60s |
| `useCoverageMapData` | `/console/coverage/map-data` | `MapMarker[]` from GeoJSON FeatureCollection | 30s |
| `useIntelFeed` | `/console/intel?limit=50` | Recent intel items for feed panels | 30s |
| `useIntelBundles` | `/console/bundles` | Clustered intel bundles | 45s |
| `useBundleDetail` | `/console/bundles/:id` | Single bundle with full detail | on-demand |

All hooks live in `src/hooks/` and normalize API snake_case responses to camelCase TypeScript types. Shared types are in `src/lib/coverage-utils.ts` (`MapMarker`, `CoverageByCategory`, `CoverageMetrics`).

### Two-Store Architecture

**`ui.store.ts`** — animation & navigation state
- Morph state machine (phase, direction, targetId)
- Selected district ID
- Command palette visibility
- Only `useMorphChoreography()` should call `setMorphPhase()` directly

**`coverage.store.ts`** — data filtering & view modes
- Selected categories for map filtering (empty = show all)
- View mode: `'triaged' | 'all-bundles' | 'raw'`
- Selected bundle ID for detail panel
- URL sync helpers: `syncCoverageFromUrl()`, `syncCategoriesToUrl()`, `syncViewModeToUrl()`

Design decision: animation state and data filtering are deliberately separate stores.

### Morph State Machine

The core navigation pattern. When a user clicks a category card, a 6-phase state machine drives the transition from grid view to full-screen district view.

```
Forward:  idle → expanding (400ms) → settled (200ms hold) → entering-district (600ms) → district
Reverse:  district → leaving-district (400ms) → idle
```

Defined in `src/lib/morph-types.ts`. Driven exclusively by `useMorphChoreography()` hook — no other code should call `setMorphPhase()`.

### Semantic Zoom (Z-Levels)

The grid switches representation based on camera zoom via `useSemanticZoom()`:

- **Z0** (far): `CategoryIconGrid` — colored dots with short codes (SEIS, WX, FIR...)
- **Z1+** (closer): `CoverageGrid` — 9-column CSS Grid of `CategoryCard` components with live metrics

`MorphOrchestrator` swaps between the two with `AnimatePresence mode="wait"`. The `ZoomGate` component gates child visibility by zoom level.

### Page Composition (`src/app/(launch)/page.tsx`)

The main page wires together all layers in the spatial canvas:

1. **Background:** DotGrid, SectorGrid, enrichment effects (HaloGlow, RangeRings)
2. **Data layer:** ViewModeToggle → CoverageMap → CoverageOverviewStats → MorphOrchestrator (grid/icons)
3. **Panels:** SystemStatusPanel, FeedPanel, ActivityTicker (ambient data panels)
4. **Overlays:** DistrictViewOverlay (z-30), TriageRationalePanel (z-45), NavigationHUD (z-40)
5. **Fixed chrome:** HorizonScanLine, SessionTimecode, CalibrationMarks, TopTelemetryBar, BottomStatusStrip

Grid layout constants (world-space pixels): `GRID_WIDTH=1600`, `GRID_HEIGHT=400`, `GRID_COLUMNS=9`.

### Authentication

Passphrase auth inherited from tarva-launch. Login at `/login`, session stored in sessionStorage. The `(launch)/layout.tsx` guard redirects unauthenticated users.

## Configuration

`.env.local` requires:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TARVARI_API_URL=http://localhost:8000
```

## Conventions

- Import `motion/react` (never `framer-motion`)
- Use `pnpm` (never `npm`)
- Types: `src/lib/interfaces/` for shared contracts, feature-local otherwise. Never `src/types/`.
- Severity levels: Extreme (red), Severe (orange), Moderate (yellow), Minor (blue), Unknown (gray)
- 15 known categories defined in `src/lib/interfaces/coverage.ts` (`KNOWN_CATEGORIES` array)
- All timestamps ISO 8601 UTC
- GeoJSON for geometry data
- `SpatialCanvas` disables pointer-events on children; re-enable with `style={{ pointerEvents: 'auto' }}` on interactive elements

## Related Projects

| Project | Path | Relationship |
|---------|------|-------------|
| TarvaRI (backend) | `../TarvaRI/` | Intel API + workers — the data source for this app |
| @tarva/ui | `../../tarva-ui-library/` | Shared component library (workspace dependency) |
| SafeTrekr App | `../safetrekr-app-v2/` | Main SafeTrekr app (also reads trip_alerts) |
