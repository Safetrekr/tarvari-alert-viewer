# Tech Decisions — Tarva Launch

## Design Constraints Summary

Tarva Launch is a spatial mission-control webapp for the Tarva AI agent platform. The vision requires: a Zoomable User Interface (ZUI) with 4 semantic zoom levels, cinematic morphing transitions between zoom states, ambient "living" effects (particles, glows, pulses, scanlines), real-time telemetry from 5 existing Tarva apps, an AI-driven camera director and disposable station system, and a theatrical login experience. The aesthetic benchmark is "Oblivion workstation + NASA mission control + Apple materials/motion polish." All tech must be free/open-source. Deployment is localhost only.

---

## Core Stack

| Layer           | Choice                       | Why                                                                                                                                                                     |
| --------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router)      | Matches existing Tarva ecosystem; Route Handlers provide a server-side telemetry aggregator that eliminates CORS; React 19 features (ViewTransition, use) are available |
| Package Manager | pnpm                         | Matches existing Tarva ecosystem; strict dependency resolution; disk-efficient                                                                                          |
| Language        | TypeScript 5.x (strict mode) | Matches existing ecosystem; the spatial math, camera state, and receipt schema benefit from strong typing                                                               |
| Runtime         | Node.js 22+                  | Required by Next.js 16; enables native fetch in Route Handlers                                                                                                          |
| React           | React 19                     | Required by Next.js 16; ViewTransition API support for scene changes                                                                                                    |

---

## Spatial Engine

**Recommendation**: CSS Transforms on a single DOM container (Option C)

This is the most consequential decision for the project. Three approaches were evaluated:

### Option A: react-three-fiber (R3F) + DOM Overlay (CTA recommendation)

R3F renders a WebGL scene for ambient effects (particles, glow planes, post-processing), with interactive UI floating on top as DOM elements positioned via CSS transforms. Provides the most visual richness.

**Why not chosen for MVP**: WebGL adds substantial complexity — shader compilation, GL context management, canvas-vs-DOM event routing, accessibility of WebGL content, and a steeper debugging surface. The UI Designer's visual specification demonstrates that the target aesthetic (glass panels, luminous borders, glow effects, particle drift) is achievable with CSS `box-shadow`, `backdrop-filter`, and a single HTML5 Canvas overlay. R3F becomes the natural upgrade path if the CSS ceiling is reached.

### Option B: tldraw SDK as the infinite canvas engine

Purpose-built for infinite canvas ergonomics (camera, pan/zoom, performance optimizations). Skin it to the Tarva aesthetic.

**Why not chosen**: tldraw's opinions about shapes, selections, and tool modes add friction for a non-drawing-tool use case. The camera math for a ZUI is ~100 lines of code; the rest of tldraw's surface area becomes dead weight.

### Option C: CSS Transforms (chosen)

A single `<div>` receives `transform: translate(x, y) scale(z)`. All spatial content is positioned inside it with `position: absolute` at world coordinates. The browser composites the entire subtree as one GPU layer.

**Key trade-offs**:

- **Gain**: Full DOM accessibility, standard React devtools, no WebGL context, @tarva/ui components work natively inside the spatial canvas, simpler debugging, faster build times
- **Gain**: 60fps pan/zoom via direct `element.style.transform` writes that bypass React reconciliation (Zustand `subscribe()` pattern)
- **Give up**: True 3D depth (parallax limited to CSS `perspective`), shader-based post-processing (bloom, depth-of-field), instanced rendering for large particle counts
- **Mitigation**: Particles (18 count) use a single HTML5 Canvas overlay; glow/bloom is approximated with multi-layer `box-shadow`; the aesthetic gap is small for this use case

**Integration approach**:

```
<SpatialViewport>        — fixed, overflow: hidden, captures input events
  <ParticleCanvas />     — HTML5 Canvas, fixed overlay, pointer-events: none
  <SpatialCanvas>        — the CSS-transformed container (will-change: transform)
    <ViewportCuller>     — unmounts off-screen children
      <DistrictNode />   — positioned at world coordinates
      ...
    </ViewportCuller>
  </SpatialCanvas>
  <ScanlineOverlay />    — CSS, fixed overlay, pointer-events: none
  <Minimap />            — SVG, fixed overlay, bottom-right
  <ZoomIndicator />      — fixed overlay
  <CommandPalette />     — fixed overlay, z-50
</SpatialViewport>
```

**Upgrade path**: If the CSS approach hits visual limits, R3F can be introduced as a background layer (behind the DOM canvas) for ambient 3D effects without changing the interactive UI layer. The CameraController interface (defined in architecture decisions) abstracts the camera from its implementation.

---

## Motion & Animation

| Concern                                    | Choice                                          | Why                                                                                                                                        |
| ------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Layout transitions / morphs                | Framer Motion (`motion/react` v12+)             | MIT licensed, React-native, `animate` prop for coordinated morph sequences, `AnimatePresence` for enter/exit, spring physics built in      |
| Camera animations (flyTo, momentum)        | Manual `requestAnimationFrame` + spring physics | Camera updates at 60fps via direct DOM writes; Framer Motion's declarative API doesn't suit imperative, high-frequency camera manipulation |
| Ambient effects (pulses, glows, breathing) | CSS `@keyframes`                                | Runs on compositor thread (GPU), zero main-thread cost, `prefers-reduced-motion` media query for accessibility                             |
| Particles                                  | HTML5 Canvas 2D API                             | 18 particles with Brownian drift — trivial for Canvas, avoids WebGL setup cost                                                             |
| View transitions (scene-level)             | React 19 `<ViewTransition>`                     | Native browser API for cross-component morph; used for login→hub transition                                                                |

### Three-Tier Animation Architecture

| Tier         | Technology                                    | Responsibility                                          | Thread             |
| ------------ | --------------------------------------------- | ------------------------------------------------------- | ------------------ |
| Physics      | `requestAnimationFrame` + manual spring/decay | Camera momentum, flyTo, zoom-to-cursor                  | Main (via rAF)     |
| Choreography | Framer Motion `animate` prop                  | Morph transitions, enter/exit, staggered station reveal | Main (declarative) |
| Ambient      | CSS `@keyframes` + custom properties          | Particles, pulses, glows, breathing, grid pulse         | Compositor (GPU)   |

**Important**: Do NOT use Framer Motion's `layout` animations inside the CSS-transformed spatial canvas — they conflict with the parent transform. Use `animate` prop with explicit values instead.

---

## UI Layer

| Concern           | Choice                                                                                        | Why                                                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Component library | **@tarva/ui** (internal Tarva library)                                                        | Shared component library across the Tarva ecosystem; built on Radix + Tailwind v4 + CVA; 60+ components; dark mode with `tarva-core` color scheme (orange primary, teal accent); works inside CSS-transformed containers |
| Base primitives   | Radix UI (via @tarva/ui)                                                                      | Accessible primitives for dialogs, popovers, command palette                                                                                                                                                             |
| Styling           | Tailwind CSS v4                                                                               | Matches ecosystem; `@theme` directive for design tokens; JIT compilation                                                                                                                                                 |
| Design tokens     | @tarva/ui semantic tokens + Launch spatial tokens (CSS custom properties + Tailwind `@theme`) | @tarva/ui provides base palette (`--background`, `--foreground`, `--primary`, `--accent`, `--border`, `--status-*`); Launch extends with ~89 spatial tokens for glows, glass, and ambient effects                        |
| Icons             | Lucide React                                                                                  | Already in Tarva ecosystem via @tarva/ui; MIT licensed; tree-shakeable                                                                                                                                                   |
| Fonts             | Geist Sans + Geist Mono (Vercel)                                                              | SIL Open Font License; native Next.js integration via `next/font`; "technical-but-clean" aesthetic                                                                                                                       |
| Command palette   | cmdk (via @tarva/ui)                                                                          | Already in ecosystem; keyboard-first; composable with custom rendering                                                                                                                                                   |

### @tarva/ui Integration

The Launch imports components and the `ThemeProvider` from `@tarva/ui`. The `tarva-core` color scheme provides the base dark palette:

| @tarva/ui Token    | Value     | Launch Usage                                       |
| ------------------ | --------- | -------------------------------------------------- |
| `--background`     | `#050911` | Void/canvas background                             |
| `--foreground`     | `#def6ff` | Primary text                                       |
| `--primary`        | `#e05200` | Ember accent (interactive, selection, active glow) |
| `--ring`           | `#ff773c` | Ember bright (focus rings, highlights)             |
| `--accent`         | `#277389` | Teal accent (telemetry, data display, sparklines)  |
| `--card`           | `#0f161f` | Deep surface (panels)                              |
| `--border`         | `#232933` | Default border                                     |
| `--muted`          | `#1c222b` | Raised surfaces                                    |
| `--status-success` | `#22c55e` | OPERATIONAL status                                 |
| `--status-warning` | `#eab308` | DEGRADED status                                    |
| `--status-danger`  | `#ef4444` | DOWN/ERROR status                                  |
| `--status-neutral` | `#6b7280` | OFFLINE status                                     |

### Design Token Categories (~89 tokens total)

| Category                | Count | Source                                                             |
| ----------------------- | ----- | ------------------------------------------------------------------ |
| Background colors       | 6     | `#050911` (void) to `#28313e` (overlay) — from @tarva/ui           |
| Border scale            | 5     | 3% to 18% white + `#232933` default — from @tarva/ui               |
| Text colors             | 4     | `#def6ff` (primary) to `#33445a` (ghost) — from @tarva/ui          |
| Ember accent (primary)  | 6     | `#3a1800` (dim) to `#ffd4b8` (white) — from @tarva/ui --primary    |
| Teal accent (secondary) | 6     | `#0f2a35` (dim) to `#a8e0ef` (white) — from @tarva/ui --accent     |
| Status colors (4 × 3)   | 12    | Operational/Warning/Error/Offline × dim/main/glow — from @tarva/ui |
| Glow shadows            | 8     | 3 ember + 2 teal + 3 status intensities                            |
| Spatial spacing         | 8     | 16px to 300px                                                      |
| Durations               | 11    | 100ms to 45,000ms                                                  |
| Easing curves           | 6     | `--ease-default` through `--ease-out-expo`                         |
| Opacity levels          | 10    | 0.015 to 0.80                                                      |
| Blur radii              | 4     | 8px to 24px                                                        |
| Typography              | 7     | 2 font families + 5 tracking levels                                |

Full specification: `VISUAL-DESIGN-SPEC.md`

---

## Data & Telemetry

| Concern                            | Choice                                 | Why                                                                                                                                                                                                            |
| ---------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telemetry protocol (Launch ↔ apps) | HTTP polling via Next.js Route Handler | Route Handler fetches all 6 apps server-side (eliminates CORS); returns aggregated JSON; client polls every 10-15s; tarvaCODE returns OFFLINE until it exists                                                  |
| Client-side data fetching          | TanStack Query v5                      | Automatic retry, background refetch, caching, devtools; `refetchInterval` for polling; `refetchIntervalInBackground: true`                                                                                     |
| Launch database                    | Supabase (shared instance)             | Stores receipts, navigation history, system snapshots; consistent with the Tarva ecosystem's existing Supabase usage; provides Realtime subscriptions as a future upgrade path; RLS for Launch-specific tables |
| State management                   | Zustand 5 (4 stores)                   | Matches ecosystem; `subscribe()` enables 60fps camera updates without React re-renders; immer middleware for immutable updates                                                                                 |
| Real-time updates                  | Polling (not WebSocket/SSE)            | Simpler; 10-15s refresh is sufficient for mission-control monitoring; adaptive interval (tighten to 5s when issues detected)                                                                                   |

### Zustand Store Slices

| Store             | Purpose                 | Key State                                                |
| ----------------- | ----------------------- | -------------------------------------------------------- |
| `camera.store`    | Spatial camera position | `offsetX`, `offsetY`, `zoom`, `semanticLevel`            |
| `districts.store` | App telemetry data      | `Record<string, AppTelemetry>`                           |
| `ui.store`        | UI interaction state    | `selectedDistrictId`, `morphPhase`, `commandPaletteOpen` |
| `auth.store`      | Authentication          | `authenticated`, `sessionKey`                            |

### Telemetry Aggregator Endpoint

`GET /api/telemetry` — Next.js Route Handler that:

1. Fetches `/api/health` from all 6 app endpoints in parallel (3s timeout each; tarvaCODE returns OFFLINE until built)
2. Maps responses to a `SystemSnapshot` schema
3. Returns aggregated JSON with per-app health, alerts, metrics
4. Handles timeouts/failures gracefully (app marked `offline`, not `down`, unless previously known operational)

### Health Check Contract

All Tarva apps should expose `GET /api/health` returning:

```json
{
  "status": "ok",
  "uptime": 12345,
  "version": "1.0.0",
  "checks": {
    "database": "ok",
    "dependencies": "ok"
  }
}
```

TarvaCORE (Electron) is an exception — it has no HTTP API. The Launch can check port `11435` connectivity or accept it as `offline` when not running.

---

## AI Integration

| Concern                       | Choice                       | Why                                                                                                                                            |
| ----------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Local AI provider             | Ollama (localhost:11434)     | Already in Tarva ecosystem; free; no API key; supports llama3.2 and similar models; sufficient for camera direction, narration, classification |
| Remote AI provider (optional) | Claude API via Anthropic SDK | Higher quality reasoning for Builder Mode and deep-dive narration; requires API key; graceful degradation if unconfigured                      |
| AI routing                    | Feature-based routing table  | Each AI feature has a primary/fallback provider; deterministic rule engines preferred over LLM for risk assessment and station selection       |

### Feature-by-Feature AI Routing

| Feature                               | Primary               | Fallback              | Rationale                                                                                             |
| ------------------------------------- | --------------------- | --------------------- | ----------------------------------------------------------------------------------------------------- |
| Camera Director (structured commands) | Local pattern matcher | N/A                   | `go core`, `home`, `zoom out` need no LLM                                                             |
| Camera Director (natural language)    | Ollama                | Claude                | Spatial reasoning tractable for small models; camera starts moving speculatively during 3-10s latency |
| Station template selection            | Rule engine           | Ollama (tie-breaking) | Deterministic scoring preferred; LLM only breaks ties between equally-scored templates                |
| Narrated telemetry (batch)            | Ollama                | Claude                | Background generation on 30s cadence; cached; no user-facing latency                                  |
| Narrated telemetry (deep-dive)        | Claude                | Ollama                | User explicitly requests explanation; quality matters                                                 |
| Autonomy ladder (risk)                | Rule engine           | N/A                   | Risk/reversibility must be deterministic and auditable                                                |
| Exception triage                      | Ollama                | Rule engine           | Classification within small-model capability                                                          |
| AI Builder Mode                       | Claude                | N/A                   | Novel station layouts from NL requires strong reasoning                                               |

### Cost Control

- No API key configured = Launch works entirely on Ollama + rule engines
- Claude rate-limited per feature (Camera: 1 call/3s, Narration batch: 10 calls/min)
- Session cost counter in settings
- Claude is a quality upgrade, never a dependency

---

## Auth

| Concern             | Choice                       | Why                                                                                                                    |
| ------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Mechanism           | Single passphrase comparison | Stakeholder directive: simple key-based auth; hardcoded value in codebase (internal localhost tool, no env var needed) |
| Session persistence | `sessionStorage`             | Survives page refreshes within a tab; cleared on tab close; no cookies, no JWT                                         |
| Login UX            | Theatrical reveal animation  | 400ms field materialization with scanline sweep; any-key-to-type activation; receipt stamp on successful auth          |

---

## Full Dependency List

| Package               | Version | Purpose                                                    | License     |
| --------------------- | ------- | ---------------------------------------------------------- | ----------- |
| next                  | 16.x    | Framework                                                  | MIT         |
| react                 | 19.x    | UI library                                                 | MIT         |
| react-dom             | 19.x    | DOM renderer                                               | MIT         |
| typescript            | 5.x     | Language                                                   | Apache-2.0  |
| tailwindcss           | 4.x     | Utility-first CSS                                          | MIT         |
| @tarva/ui             | latest  | Tarva shared component library (Radix + Tailwind v4 + CVA) | Internal    |
| @supabase/supabase-js | latest  | Supabase client SDK                                        | MIT         |
| zustand               | 5.x     | State management                                           | MIT         |
| immer                 | latest  | Immutable state updates (Zustand middleware)               | MIT         |
| motion                | 12.x    | Layout transitions and morphs (Framer Motion)              | MIT         |
| @tanstack/react-query | 5.x     | Data fetching and polling                                  | MIT         |
| nanoid                | latest  | Receipt ID generation                                      | MIT         |
| lucide-react          | latest  | Icons                                                      | ISC         |
| geist                 | latest  | Fonts (Geist Sans + Mono)                                  | SIL OFL 1.1 |
| clsx                  | latest  | Conditional classnames                                     | MIT         |
| tailwind-merge        | latest  | Tailwind class deduplication                               | MIT         |

Note: `@radix-ui/react-*`, `cmdk`, `class-variance-authority` are transitive dependencies of `@tarva/ui` — they do not need to be installed separately unless extending beyond @tarva/ui's component set.

### Dev Dependencies

| Package                     | Version | Purpose                  | License |
| --------------------------- | ------- | ------------------------ | ------- |
| @types/node                 | latest  | Node.js type definitions | MIT     |
| @types/react                | latest  | React type definitions   | MIT     |
| eslint                      | latest  | Linting                  | MIT     |
| eslint-config-next          | latest  | Next.js ESLint config    | MIT     |
| prettier                    | latest  | Code formatting          | MIT     |
| prettier-plugin-tailwindcss | latest  | Tailwind class sorting   | MIT     |

### AI-Related (installed when AI features are implemented)

| Package           | Version | Purpose                      | License |
| ----------------- | ------- | ---------------------------- | ------- |
| ollama            | latest  | Ollama client SDK            | MIT     |
| @anthropic-ai/sdk | latest  | Claude API client (optional) | MIT     |

All packages verified as free and open-source. No proprietary dependencies.
