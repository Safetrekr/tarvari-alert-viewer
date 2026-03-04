# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

TarvaRI Alert Viewer -- a spatial dashboard for viewing triaged intel alerts from the TarvaRI intelligence system. Built on top of the tarva-launch spatial ZUI (Zoomable User Interface) engine.

Part of the SafeTrekr platform. Reads approved intel bundles, triage decisions, and trip alerts from a shared Supabase instance populated by the TarvaRI backend workers.

**Origin:** Cloned from `tarva-launch` (Tarva spatial mission-control hub). The spatial ZUI engine, ambient effects, morph choreography, and design system are all inherited from that project.

**Deployment target:** GitHub Pages (Next.js static export). No server-side features needed.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5.9
- **Styling:** Tailwind CSS v4 + @tarva/ui (workspace dep from `../../tarva-ui-library`)
- **State:** Zustand 5 + Immer
- **Data fetching:** TanStack Query 5 + @supabase/supabase-js v2
- **Animation:** motion/react v12 + CSS @keyframes + rAF physics (camera)
- **Spatial:** CSS Transforms ZUI engine (pan/zoom/morph)
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

## Architecture

### Spatial ZUI Engine (inherited from tarva-launch)

The app uses a zoomable spatial interface with CSS transforms. Key components:

- `src/components/spatial/SpatialViewport.tsx` -- Main viewport with pan/zoom
- `src/components/spatial/SpatialCanvas.tsx` -- Infinite canvas container
- `src/components/spatial/NavigationHUD.tsx` -- Breadcrumb + minimap + zoom
- `src/components/spatial/CommandPalette.tsx` -- Cmd+K search/navigation
- `src/components/spatial/ViewportCuller.tsx` -- Performance culling
- `src/components/districts/` -- Spatial node containers (capsules, rings, connectors)
- `src/components/ambient/` -- Visual effects layer (dot grid, halo, scan lines, particles)

### State Management (Zustand stores in `src/stores/`)

| Store | Purpose |
|-------|---------|
| `auth.store.ts` | Authentication state |
| `ui.store.ts` | Morph state machine, modal visibility, camera pan |
| `camera.store.ts` | Camera position, zoom level |
| `settings.store.ts` | User preferences |
| `enrichment.store.ts` | Ambient effect toggles |
| `districts.store.ts` | District/node data + navigation |
| `triage.store.ts` | Exception classification (adapt for alert triage) |
| `ai.store.ts` | AI provider state |
| `builder.store.ts` | Builder mode state |
| `attention.store.ts` | Attention choreography |
| `narration.store.ts` | Narration state |

### Data Source

All data comes from TarvaRI's Supabase instance via client-side queries:

```typescript
// Approved alerts
const { data } = await supabase
  .from('intel_bundles')
  .select('*, triage_decisions(*)')
  .eq('status', 'approved')
  .order('created_at', { ascending: false })
  .limit(50)
```

Key TarvaRI tables:
- `intel_bundles` -- Clustered intel with risk scores, categories, GeoJSON geometry
- `triage_decisions` -- Approve/reject decisions with rationale and confidence
- `trip_alerts` -- Alerts matched to trips with relevance scores
- `intel_normalized` -- Raw parsed intel (member data for bundles)
- `intel_sources` -- Source configs and health metrics

### Authentication

Currently uses passphrase auth (inherited from tarva-launch). Plan is to swap for Supabase Auth (email/magic link) which shares auth with the rest of SafeTrekr.

## Configuration

Copy `.env.example` to `.env.local` and fill in values:

```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional — Claude AI features
ANTHROPIC_API_KEY=          # Only if using Claude AI features
ANTHROPIC_MODEL=            # Override default (claude-sonnet-4-20250514)
NEXT_PUBLIC_OLLAMA_URL=http://localhost:11434  # Only if using local AI
```

## Conventions

- Import `motion/react` (never `framer-motion`)
- Use `pnpm` (never `npm`)
- Types go in `src/lib/interfaces/` (contracts) or feature-local, never `src/types/`
- Severity colors: Extreme (red), Severe (orange), Moderate (yellow), Minor (blue), Unknown (gray)
- Categories: weather, seismic, health, conflict, humanitarian, infrastructure, fire, flood, storm, other
- All timestamps ISO 8601 UTC
- GeoJSON for geometry data

## What Needs To Be Done

### Phase 1: Adapt for Alert Viewing
- Connect to TarvaRI Supabase instance
- Replace/adapt district content with alert data visualization
- Add alert list, detail panels, and map views to the spatial interface
- Swap passphrase auth for Supabase Auth

### Phase 2: Remove Unused Server Features
- Remove `/api/*` routes (not needed for GitHub Pages static export)
- Configure `next.config.ts` with `output: 'export'` for static build
- Set up GitHub Pages deployment (build + push `out/` to `gh-pages` branch)

## Related Projects

| Project | Path | Relationship |
|---------|------|-------------|
| TarvaRI (backend) | `../TarvaRI/` | Intel API + workers -- writes the data this app reads |
| @tarva/ui | `../../tarva-ui-library/` | Shared component library (workspace dependency) |
| SafeTrekr App | `../safetrekr-app-v2/` | Main SafeTrekr app (also reads trip_alerts) |

## File Structure

```
src/
  app/                    # Next.js App Router pages
    (launch)/             # Main spatial layout + page
    api/                  # Server API routes (to be removed for GitHub Pages)
    login/                # Login page
  components/
    spatial/              # ZUI engine (viewport, canvas, HUD, command palette)
    districts/            # Spatial nodes (capsules, rings, connectors, dot grid)
    district-view/        # District detail views and scenes
    ambient/              # Visual effects (glow, particles, scan lines, etc.)
    stations/             # Station panels (content containers)
    auth/                 # Login UI components
    telemetry/            # Health badges, sparklines, metrics
    providers/            # React Query + Theme providers
    ui/                   # Shared UI components
    ai/                   # AI integration components
    evidence-ledger/      # Timeline/ledger components
  hooks/                  # ~31 custom hooks (camera, morph, shortcuts, etc.)
  stores/                 # Zustand state stores
  styles/                 # CSS modules (spatial tokens, morph, enrichment)
  lib/                    # Utilities, types, AI, interfaces, Supabase client
docs/                     # Design docs and planning artifacts from tarva-launch
public/                   # Static assets (logos, favicons)
supabase/                 # Supabase migrations (launch-specific, may be replaced)
```
