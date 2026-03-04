# Combined Recommendations — Tarva Launch

## Context

Tarva Launch is a greenfield internal webapp that unifies the Tarva AI agent platform's 5+ applications into a single spatial mission-control interface. The project was analyzed through 6 input signal documents (TARVA-SYSTEM-OVERVIEW.md, initial-thoughts-1.md, storyboard.md, spacial-modal-map.md, more-for-ui.md, vision-initiation-pack.md) and 8 specialist consultations (CTA, UX Designer, Product Owner, PMO, Information Architect, React Developer, Autonomous Interface Architect, UI Designer).

The core UX concept is a Zoomable User Interface (ZUI) — a single infinite canvas where users pan to move through the system and zoom to change semantic meaning. Apps appear as "districts" on the spatial plane, each with ambient telemetry. The aesthetic benchmark is "Oblivion workstation + NASA mission control + Apple materials/motion polish." Eye candy is the primary success criterion per stakeholder directive.

Discovery depth was calibrated as DEEP (10+ features, multiple domains, high uncertainty). The key reframe from discovery: this project is simultaneously a spatial engine, a telemetry aggregator, a visual design system, and an AI-assisted operations interface — four distinct engineering challenges that must ship as one coherent experience.

---

## Critical Gap Resolutions

### Gap 1: Spatial Engine Choice

**Decision**: CSS Transforms on a single DOM container (not R3F/WebGL, not tldraw).

The React Developer designed a complete architecture using a single `<div>` with `transform: translate(x, y) scale(z)`, with direct `element.style.transform` writes via Zustand `subscribe()` for 60fps updates. The UI Designer's visual specification demonstrates that the Oblivion aesthetic (glass, luminous borders, multi-layer glow, particle drift) is achievable with CSS `box-shadow`, `backdrop-filter`, and a single HTML5 Canvas overlay — without WebGL.

The CTA recommended an R3F + DOM hybrid for maximum visual richness. This remains the upgrade path if the CSS ceiling is reached, but for MVP: CSS transforms deliver 80% of the visual impact with 30% of the complexity.

- Implication: No WebGL build pipeline, no shader management, no Canvas-vs-DOM event routing
- Implication: @tarva/ui components work natively inside the spatial canvas
- Implication: Standard React devtools for debugging spatial content
- Risk: If visual effects prove insufficient, adding R3F as a background layer requires moderate refactoring (estimated 1-2 weeks)

### Gap 2: Spine Object Model

**Decision**: Revised 5-object spine (per IA assessment), not the originally proposed 7 objects.

The Information Architect mapped each proposed spine object against the actual database schemas of all 5 Tarva apps and found that "Plan" and "Approval" only exist in 1-2 apps. The "Run" concept has semantic collisions (generation job in Agent Builder, agent execution in Project Room, no equivalent in Chat or CORE).

| Launch Object | Type         | Definition                                                          |
| ------------- | ------------ | ------------------------------------------------------------------- |
| **Activity**  | Cross-app    | Any discrete unit of work (supertype that resolves "Run" collision) |
| **Artifact**  | Cross-app    | Any durable output produced by an activity                          |
| **Exception** | Cross-app    | Any error, failure, or anomaly                                      |
| **Receipt**   | Launch-local | Immutable record of a meaningful Launch event                       |
| **Evidence**  | Launch-local | Curated collection of receipts + app-sourced audit data             |

- At Z0-Z1, the Launch says "12 activities." At Z2-Z3, it says "3 generation runs" (Builder) or "5 conversations" (Chat)
- Plan and Approval surface in app-specific stations but are not spine-level concepts
- The command palette treats all app-specific terms as synonyms for the hub supertype

### Gap 3: Status Model

**Decision**: 5-state status model with OFFLINE (per IA assessment), not the originally proposed 4 states.

| State       | Color                | Meaning                                                             |
| ----------- | -------------------- | ------------------------------------------------------------------- |
| OPERATIONAL | Green (pulsing)      | All checks passing                                                  |
| DEGRADED    | Amber (steady)       | Running with reduced capability                                     |
| DOWN        | Red (flashing)       | Should be running but not responding (previously known operational) |
| OFFLINE     | Dim/muted (no pulse) | Not running, expected — never started or gracefully stopped         |
| UNKNOWN     | Gray (dashed)        | No telemetry connection ever established                            |

The critical distinction is OFFLINE vs DOWN. TarvaCORE (Electron) is only running when deliberately launched. "Down" implies failure; "Offline" implies intentional absence. The Launch learns from contact history: first contact = OFFLINE (assumed not started); after a successful health check, the app is "known" — any future unresponsiveness = DOWN.

- Implication: No user configuration needed for OFFLINE/DOWN distinction
- Implication: Visual treatment differs — OFFLINE capsules are muted but intact; DOWN capsules pulse red

### Gap 4: App Naming

**Decision**: Use canonical names from TARVA-SYSTEM-OVERVIEW.md (per IA flag), with Agent Builder clarified as two launchable items.

The storyboard says "TarvaAgentGen," the spatial map says "TarvaCODE," and the system overview says "Agent Builder." Per stakeholder clarification: **TarvaAgentGen** is the CLI engine, and **tarva-claude-agents-frontend** (Agent Builder) is the web frontend for it. Both should be viewable/launchable from the Launch.

| Canonical Name | Display Name  | Code/ID         | Launch Target                                                |
| -------------- | ------------- | --------------- | ------------------------------------------------------------ |
| Agent Builder  | Agent Builder | `agent-builder` | Web UI at `localhost:3000`                                   |
| TarvaAgentGen  | AgentGen CLI  | `agentgen-cli`  | Terminal command / process status                            |
| Tarva Chat     | Tarva Chat    | `tarva-chat`    | Web UI                                                       |
| Project Room   | Project Room  | `project-room`  | Web UI                                                       |
| TarvaCORE      | TarvaCORE     | `tarva-core`    | Electron app                                                 |
| TarvaERP       | TarvaERP      | `tarva-erp`     | Web UI                                                       |
| tarvaCODE      | tarvaCODE     | `tarva-code`    | Stub — Tarva's own "Claude Code" equivalent (planning-stage) |

The Agent Builder district in the ZUI shows both the web frontend and CLI as launch options within its stations. The capsule ring at Z1 shows 6 capsules (tarvaCODE included as a stub district).

### Gap 5: Launch Data Storage

**Decision**: Supabase (shared instance) for Launch data (receipts, navigation history, system snapshots).

Per stakeholder directive: use Supabase to stay consistent with the broader Tarva ecosystem. The Launch gets its own tables/schema within the existing Supabase project. The existing Tarva app tables are read-only data sources for telemetry — the Launch does not write to them.

- Implication: Launch-specific tables (`launch_receipts`, `launch_snapshots`, `launch_nav_history`) with RLS policies
- Implication: `@supabase/supabase-js` client accessed from both Route Handlers (server-side) and client components
- Implication: Supabase Realtime subscriptions available as a future upgrade path for <1s telemetry updates
- Implication: Requires Supabase project URL + anon key in `.env.local`

### Gap 6: TarvaERP Status

**Decision**: Include TarvaERP as a full capsule with real telemetry (per stakeholder: "most of the frontend is done").

TarvaERP has a working frontend. The capsule will attempt real health checks and display live telemetry where available, falling back to OFFLINE/UNKNOWN status gracefully.

### Gap 7: TarvaCORE Health Endpoint

**Decision**: TCP port check (not full HTTP health endpoint) for TarvaCORE.

TarvaCORE is an Electron app with no HTTP API. The telemetry aggregator will attempt a TCP connection to port 11435. Success = OPERATIONAL, failure after previously known = DOWN, never contacted = OFFLINE. This avoids requiring changes to TarvaCORE.

### Gap 8: Capsule Information Hierarchy

**Decision**: 5 universal fields per capsule (per IA assessment), replacing the originally proposed 6-field layout.

| Field      | What It Shows                                                                     |
| ---------- | --------------------------------------------------------------------------------- |
| Health     | Operational state (colored dot + word)                                            |
| Pulse      | Primary activity metric ("3 runs active" for Builder, "8 conversations" for Chat) |
| Last Event | Most recent significant event with timestamp                                      |
| Alerts     | Active alert count (red badge if > 0)                                             |
| Freshness  | Time since last meaningful activity (stale detection)                             |

The original proposal included "last deploy" and "latency p95" which only apply to 1-2 apps. The revised fields work universally.

---

## Architecture Decisions

### AD-1: Camera State Management

**Decision**: Zustand store with direct `subscribe()` for DOM updates, bypassing React reconciliation during animation.

The camera store holds `offsetX`, `offsetY`, `zoom`, and `semanticLevel`. During pan/zoom/momentum, the `SpatialCanvas` component subscribes to the store directly and writes `element.style.transform` — no React re-renders. Other consumers (minimap, zoom indicator) use standard `useStore()` with selectors for low-frequency reads.

- Implementation: `stores/camera.store.ts` with `immer` middleware
- Key methods: `panBy()`, `zoomTo()` (with zoom-to-cursor math), `flyTo()` (spring animation), `resetToLaunch()`
- URL sync: Camera position serialized to `?cx=0&cy=0&cz=0.50` on settle (after momentum stops), not per-frame

### AD-2: Semantic Zoom with Hysteresis

**Decision**: Config-driven zoom level thresholds with 10% hysteresis bands to prevent flickering at boundaries.

| Level            | Enter At       | Exit At               | Content                                                        |
| ---------------- | -------------- | --------------------- | -------------------------------------------------------------- |
| Z0 Constellation | zoom < 0.27    | zoom ≥ 0.30           | Districts as luminous beacons + 3 global metrics               |
| Z1 Launch Atrium | zoom 0.30-0.79 | zoom < 0.27 or ≥ 0.80 | App capsules with status strips (default landing at zoom 0.50) |
| Z2 District      | zoom 0.80-1.49 | zoom < 0.72 or ≥ 1.50 | Selected app unfurls into 3-5 stations                         |
| Z3 Station       | zoom ≥ 1.50    | zoom < 1.35           | Tight functional panels with actions                           |

Components switch representation based on semantic level via a `useSemanticZoom()` hook.

### AD-3: Three-Tier Animation Architecture

**Decision**: Separate physics (rAF), choreography (Framer Motion), and ambient (CSS) into three non-overlapping layers.

| Tier                         | Handles                                          | Why Separate                             |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------- |
| Physics (rAF)                | Camera momentum, spring flyTo, zoom-to-cursor    | Imperative, 60fps, direct DOM writes     |
| Choreography (Framer Motion) | Morph transitions, enter/exit, staggered reveals | Declarative, coordinated multi-element   |
| Ambient (CSS @keyframes)     | Pulses, glows, breathing, grid, scanlines        | Compositor thread, zero main-thread cost |

- Never use Framer Motion `layout` animations inside the CSS-transformed container
- Ambient animations pause during active pan (resume after 150ms of stillness)

### AD-4: Morph Choreography (Capsule → District)

**Decision**: 4-phase state machine driven by user selection, with spring physics for camera and Framer Motion for element transitions.

```
Click capsule → [focusing: 300ms] → [morphing: 200ms] → [unfurling: 400ms] → [settled]
```

- **Focusing**: Camera springs to district center; selected capsule scales up; others drift outward + fade
- **Morphing**: Capsule shape transitions to district container; AnimatePresence swaps content
- **Unfurling**: Stations appear with staggered entrance
- **Settled**: URL sync, station interactions enabled, ambient animations resume

### AD-5: Telemetry Polling Architecture

**Decision**: Server-side aggregator (Next.js Route Handler) + client-side polling (TanStack Query).

- `GET /api/telemetry` fetches all 6 apps in parallel with 3s timeouts (tarvaCODE returns OFFLINE until it exists), returns aggregated JSON
- Client polls every 10-15s via TanStack Query `refetchInterval`
- Adaptive: tightens to 5s when any app is DEGRADED/DOWN; relaxes to 30s when all stable for 5 cycles
- Each response syncs to Zustand `districts.store` via TanStack Query `select` callback

### AD-6: Receipt System

**Decision**: Mutations-only receipts (per UX Designer recommendation), visual stamps with timeline strip.

The AIA designed a 12-field receipt schema with dedicated AI rationale fields. Only meaningful actions generate receipts (navigation to a district, approving a plan, acknowledging an alert — not every hover or scroll). Expected volume: 5-15 receipts per session.

- Storage: Supabase (`launch_receipts` table)
- Visual: Stamp animation on action (trace ID + timestamp + result), timeline strip in Evidence Ledger (NW district)
- Rehydration: Clicking a receipt restores the viewport position, highlights the target, shows metric comparison (then vs. now)
- AI receipts include additional fields: prompt, reasoning, confidence, alternatives considered, provider, latency

### AD-7: AI Integration Architecture

**Decision**: Three-layer intelligence model — local pattern matching → deterministic rule engines → LLM (Ollama primary, Claude optional).

Per AIA assessment, the system works without AI. If AI breaks, telemetry and spatial navigation still function. Six interfaces defined for Phase 1 that AI features plug into later:

1. `CameraController` — spatial navigation API (Phase 1: manual; Phase 3: AI Camera Director)
2. `SystemStateProvider` — telemetry data API (Phase 1: polling; Phase 3: AI context)
3. `ReceiptStore` — audit log API (Phase 1: human actions; Phase 3: AI actions)
4. `StationTemplateRegistry` — station catalog (Phase 1: static defaults; Phase 3: dynamic selection)
5. `AIRouter` — feature-based provider routing (Phase 1: stub; Phase 3: Ollama/Claude)
6. `CommandPalette` — input API (Phase 1: structured commands; Phase 3: natural language)

### AD-8: Station Content per District

**Decision**: 2 universal stations + 2-3 app-specific stations (per IA assessment), not uniform 5-station template.

| District      | Universal                     | App-Specific                          |
| ------------- | ----------------------------- | ------------------------------------- |
| Agent Builder | Launch (Web UI + CLI), Status | Pipeline, Library                     |
| Tarva Chat    | Launch, Status                | Conversations, Agents                 |
| Project Room  | Launch, Status                | Runs, Artifacts, Governance           |
| TarvaCORE     | Launch, Status                | Sessions                              |
| TarvaERP      | Launch, Status                | Manufacturing dashboard               |
| tarvaCODE     | Launch, Status                | (stub — placeholder until app exists) |

### AD-9: Project File Structure

**Decision**: Two-route architecture (login + hub), with all spatial navigation client-side within the hub route.

```
app/
  layout.tsx                 — QueryClientProvider, fonts, base styles
  login/page.tsx             — theatrical login (client component)
  (hub)/
    layout.tsx               — auth guard
    page.tsx                 — ZUI entry point (client component)
  api/
    telemetry/route.ts       — server-side aggregator
src/
  components/
    spatial/                 — engine layer (SpatialViewport, SpatialCanvas, Minimap, etc.)
    districts/               — domain layer (DistrictNode, capsules, views)
    stations/                — Z3 content panels
    ambient/                 — effects (ParticleField, HeartbeatPulse, GlowBreathing, etc.)
    auth/                    — login experience components
    telemetry/               — data display primitives (HealthBadge, Sparkline, etc.)
    ui/                      — shared UI (@tarva/ui + custom spatial components)
  hooks/                     — spatial hooks, animation hooks, data hooks
  stores/                    — 4 Zustand stores
  lib/                       — spatial-math, constants, telemetry-config
```

---

## Detailed Requirements

### Login Experience

- Single full-screen page at `/login` with dark void background (`#050911`)
- One animated "attractor" glyph (hub center breathing animation: glow oscillation 5s cycle, blur 20-48px, opacity 0.06-0.14)
- Any-key-to-type activation: pressing any alphanumeric key triggers field materialization (400ms animation with scanline sweep)
- Single passphrase input field, centered, Geist Mono font
- Validation: compare input to hardcoded passphrase value (internal localhost tool, no env var needed)
- Success: receipt stamp animation (trace ID + timestamp), 600ms transition to hub (React ViewTransition)
- Failure: subtle shake, field clears, no error text (just the gesture feedback)
- Session: `sessionStorage.setItem('tarva-launch-session', crypto.randomUUID())`
- Per storyboard frame 2-3

### Launch Atrium (Z1 Default)

- 6 capsules in a ring, 300px radius from center, 60° spacing, first capsule at 12 o'clock
- Capsule dimensions: 192 × 228px, 28px corner radius (per VISUAL-DESIGN-SPEC.md)
- Content: app name (11px, uppercase, 0.08em tracking) + 3px health bar + 3 telemetry key-values (Geist Mono 16px) + decorative sparkline
- Hover: scale 1.12, 200ms ease-out, glow lifts from subtle to medium, text opacity rises to full
- Selection: lock-on pulse (scale 1.05, bounce easing, scanline sweep), then morph to district
- Launch center glyph: breathing animation (glow oscillation 5s, always on)
- Background: dot grid at 48px spacing, base opacity 0.015, radial wave every 12s from center
- Per storyboard frames 4-6, spatial-modal-map.md Z1

### ZUI Engine

- Pan: click-drag with momentum (0.92 friction per frame, velocity tracked from last 5 pointer samples)
- Zoom: scroll wheel with zoom-to-cursor (analytical formula preserving world point under cursor)
- Zoom range: 0.08 (Z0 far) to 3.0 (Z3 close)
- Semantic zoom: 4 levels with hysteresis (see AD-2)
- Viewport culling: unmount elements outside visible bounds (debounced via rAF)
- Return-to-hub: hotkey (Space or Home) + center glyph click → spring animation to (0,0) at zoom 0.50
- Camera URL sync: `?cx=0&cy=0&cz=0.50` updated on settle
- Per spacial-modal-map.md "Physics rules"

### Navigation Instruments

- **Minimap**: SVG overlay, 200×150px, bottom-right, district dots with status colors, viewport rectangle, click-to-navigate
- **Breadcrumb**: Semantic path (`Launch > TarvaCORE > Status > Run #2847`), displayed as a status readout, compass arrow per segment
- **Zoom indicator**: Current semantic level badge (Z0-Z3), top-right
- **Command palette**: `Cmd+K` to open, structured commands (`go core`, `home`, `zoom out`) + natural language (Phase 3)
- Always visible, fixed position, `z-40`
- Per spacial-modal-map.md "Navigation instruments"

### Constellation View (Z0)

- Districts appear as luminous beacons (colored dots with glow)
- 3 global metrics displayed: Alert Count (total), Active Work (aggregate), System Pulse (worst-of-five health)
- Compact district codes on beacons (AB, CH, PR, CO, ER, CD)
- "Find where attention is needed fast" — sub-2-second glanceability
- Per spacial-modal-map.md Z0, IA assessment

### District View (Z2)

- Selected capsule morphs to district container (4-phase choreography, see AD-4)
- 3-5 stations unfurl with staggered entrance (Framer Motion)
- 2 universal stations (Launch = open app in new tab, Status = health dashboard) + 2-3 app-specific
- Peripheral telemetry stays visible but quiet
- Per spacial-modal-map.md Z2, IA assessment

### Station Panels (Z3)

- 3-zone layout: Header (app name + station name) / Body (interactive content) / Actions (buttons)
- Every user action triggers receipt stamp ritual (trace/time/result)
- Glass material: `rgba(255,255,255, 0.03)` + `backdrop-filter: blur(12px)` + 1px inset top highlight
- Luminous border: 1px solid + 3-layer glow matching ember accent
- Per storyboard frames 8-10, VISUAL-DESIGN-SPEC.md

### Evidence Ledger (NW District)

- Chronological timeline (newest first) with faceted filtering
- Four facets: Source (app), Type (navigation/action/error/approval/system), Severity (info/warning/error/critical), Time Range (1h/24h/7d/30d/custom)
- Launch receipts and app events in same timeline, distinguished by `source` field
- Click receipt → viewport restores to position at time of action, metric comparison overlay, target highlight
- Z2: Compressed timeline strip (density = activity, color = actor type: blue=human, amber=AI)
- Z3: Individual receipt stamps, clickable, full detail panel
- Per more-for-ui.md point 6, IA assessment, AIA assessment

### Ambient Effects

- **Particles**: 18 particles, HTML5 Canvas, ember color (#e05200), opacity 0.04-0.20, sizes 1.5-4px, Brownian drift 0.3-1.5 px/sec
- **Heartbeat ticks**: 3px health bar pulses opacity 0.35→0.55, scaleY 1.0→1.8, 7s cycle, staggered 1.2s between capsules
- **Launch center breathing**: Glow oscillation blur 20-48px, opacity 0.06-0.14, 5s cycle
- **Grid pulse**: Dot grid 48px spacing, radial wave from center every 12s, brightens from 0.015 to 0.04 opacity
- **Scanlines**: Triggered on state changes only, 1px primary + 2 ghost lines, 350ms sweep, ember color at 0.12 opacity
- **Film grain**: Static SVG feTurbulence, mix-blend-mode overlay, opacity 0.035
- All effects honor `prefers-reduced-motion` (disable animations, show static particles)
- All effects pause during active pan (resume after 150ms stillness)
- Per initial-thoughts-1.md point 4, VISUAL-DESIGN-SPEC.md

### Telemetry Display

- HealthBadge: colored dot + status word, pulse animation for OPERATIONAL
- Sparkline: SVG, last N data points, 60×20px, teal accent color
- MetricCounter: Geist Mono, `tabular-nums`, animated number transitions
- AlertIndicator: red badge with count, pulse when > 0
- All numeric values use `font-variant-numeric: tabular-nums` to prevent horizontal shift

### AI Features (Phase 3)

- **Camera Director (Beta)**: Toggle in settings; Cmd+K shows "Ask AI..." option; user types natural language; Ollama returns `CameraDirective` (target, highlights, fades, narration); camera flies to target; receipt generated
- **Station template selection**: Rule engine evaluates `TriggerCondition[]` against `SystemSnapshot`, scores templates, selects top 3-5 for the district; user can override via template browser
- **Narrated telemetry**: On focus, AI interprets metrics ("what changed, why it matters, what to do next"); batch-generated in background on 30s cadence
- **Disposable stations**: AI selects from pre-built templates (not runtime-generated React); governed by schema constraint (DisposablePixelManifest), safety default (Suggest rung), audit trail (every AI decision generates a Receipt)
- Per more-for-ui.md, AIA assessment

---

## Phase Decomposition

### Phase 0: Tech Spike & Setup

**Objective**: Validate the CSS transforms ZUI approach end-to-end and establish the project foundation.
**Unblocks**: All subsequent phases depend on the spatial engine proving viable at 60fps.
**Estimated Complexity**: S (1 week)

Work Areas:

1. **Project Scaffolding** — DevOps — S — Initialize Next.js 16 project with TypeScript, Tailwind v4, pnpm, ESLint, Prettier; configure directory structure per AD-9
2. **Design Tokens Setup** — Frontend — S — Configure @tarva/ui ThemeProvider with `tarva-core` dark scheme; implement ~89 spatial design tokens as CSS custom properties + Tailwind `@theme`; configure Geist Sans + Mono fonts
3. **ZUI Tech Spike** — Frontend — M — Prove CSS transforms approach: pan, zoom-to-cursor, momentum, semantic zoom level switching; measure FPS with 10 placeholder elements; document results in a spike report

### Phase 1: Spatial Core + Login

**Objective**: Deliver a working ZUI with the Launch Atrium, 5 capsules with live status, the login experience, and ambient effects.
**Unblocks**: Phase 2 (districts need the spatial engine and telemetry), Phase 3 (receipts and AI need the interfaces)
**Estimated Complexity**: L (5-6 weeks)

Work Areas:

1. **ZUI Engine** — Frontend — L — SpatialViewport, SpatialCanvas (CSS transform), camera store (Zustand), pan/momentum hook, zoom-to-cursor hook, viewport culling, semantic zoom with hysteresis
2. **Launch Atrium** — Frontend — M — 6 capsule components in ring layout (60° spacing), hover/selection animations (Framer Motion), hub center breathing glyph, background dot grid with pulse wave
3. **Login Experience** — Frontend — M — Theatrical login page: attractor glyph, any-key-to-type reveal (400ms), passphrase validation, success receipt stamp, ViewTransition to hub; auth store (Zustand) with sessionStorage
4. **Navigation Instruments** — Frontend — M — SVG minimap (200×150px), semantic breadcrumb, zoom indicator badge, return-to-hub hotkey + glyph click, keyboard shortcuts (Cmd+K stub)
5. **Telemetry Aggregator** — Backend — M — `GET /api/telemetry` Route Handler polling all 6 apps (tarvaCODE stub returns OFFLINE); TanStack Query client-side polling (15s); districts store sync; HealthBadge, Sparkline, MetricCounter components
6. **Ambient Effects Layer** — Frontend — M — ParticleField (HTML5 Canvas, 18 particles), HeartbeatPulse (CSS), GlowBreathing (CSS), GridPulse (CSS), ScanlineOverlay (CSS), FilmGrain (SVG), pan-pause logic, prefers-reduced-motion support
7. **Core Interfaces** — Frontend — S — Define TypeScript interfaces for CameraController, SystemStateProvider, ReceiptStore, StationTemplateRegistry, AIRouter, CommandPalette; implement Phase 1 versions (manual nav, polling, stub AI)

### Phase 2: Districts + Stations + Morph

**Objective**: Deliver district-level views for all 6 apps (tarvaCODE as stub), the morph transition from capsule to district, and station panels at Z3.
**Unblocks**: Phase 3 (Evidence Ledger and AI features need station infrastructure and receipt data)
**Estimated Complexity**: L (4-5 weeks)

Work Areas:

1. **Morph Choreography** — Frontend — L — 4-phase state machine (focusing → morphing → unfurling → settled), camera spring animation to district center, Framer Motion element transitions, deselection reverse flow
2. **District Content: Agent Builder** — Frontend — M — Status station (health dashboard), Pipeline station (runs/queues), Library station (agents/skills list); data from `/api/telemetry` + dedicated Route Handler if needed
3. **District Content: Project Room** — Frontend — M — Status station, Runs station (active executions), Artifacts station (recent outputs), Governance station (approvals/gates)
4. **District Content: Tarva Chat** — Frontend — M — Status station, Conversations station (health + count), Agents station (configured agents)
5. **District Content: TarvaCORE + ERP + tarvaCODE** — Frontend — S — Status stations with TCP health check (CORE), real telemetry (ERP), and stub placeholder (tarvaCODE)
6. **Station Panel Framework** — Frontend — M — 3-zone layout (header/body/actions), glass material styling, luminous borders, receipt stamp trigger on actions
7. **Constellation View (Z0)** — Frontend — S — Beacon rendering, 3 global metrics, compact district codes

### Phase 3: Receipts + Command Palette + AI

**Objective**: Deliver the Evidence Ledger, receipt system, command palette with AI Camera Director, and initial AI features.
**Unblocks**: Phase 4 (advanced AI features build on the receipt and AI routing infrastructure)
**Estimated Complexity**: L (4-5 weeks)

Work Areas:

1. **Receipt System** — Backend/Frontend — L — Supabase schema for receipts (12-field schema per AIA, `launch_receipts` table), ReceiptStore implementation, receipt stamp animation component, receipt generation for all mutation actions, periodic system snapshot storage
2. **Evidence Ledger** — Frontend — L — NW district with chronological timeline, faceted filtering (source/type/severity/time), receipt rehydration (viewport restore + metric comparison), Z2 compressed strip, Z3 detail panel
3. **Command Palette** — Frontend — M — cmdk-based palette via Cmd+K, structured commands (go/zoom/home/receipts), command synonym ring (per IA), "Ask AI..." natural language option (gated behind AI beta toggle)
4. **AI Camera Director** — Backend/Frontend — L — Ollama integration, SpatialIndex + SystemSnapshot context assembly, CameraDirective schema, speculative camera drift during AI latency, disambiguation strip for ambiguous queries, receipt generation for AI actions
5. **Station Template Selection** — Frontend — M — Template registry, TriggerCondition evaluator, rule-based scoring, dynamic station selection per district based on system state, template browser for manual override
6. **Narrated Telemetry** — Backend/Frontend — M — Background narration generation (Ollama, 30s cadence), cached narrations, on-focus display ("what changed, why it matters, what to do next")
7. **Attention Choreography** — Frontend — S — Rule-based ambient motion throttling: healthy=calm (full effects), anomaly=tighten (reduce motion, surface next-best-actions), respects CPU load

### Phase 4: Advanced AI + Polish (Stretch)

**Objective**: Claude API integration, Builder Mode, exception triage, and final visual polish.
**Unblocks**: None (terminal phase)
**Estimated Complexity**: M (2-3 weeks)

Work Areas:

1. **Claude API Integration** — Backend — M — @anthropic-ai/sdk setup, AIRouter dual-provider routing, cost controls (rate limits, session counter), graceful degradation when no API key configured
2. **Exception Triage** — Frontend — M — AI classifies failures (transient/permanent/policy/missing-info), selects recovery UI template, generates intervention station
3. **Builder Mode** — Frontend — M — Hidden mode for authorized users to describe new stations in natural language; Claude proposes station layout from template catalog; accept/promote workflow
4. **Visual Polish Pass** — Frontend — S — Refinement of all ambient effects, timing adjustments, transition polish, performance optimization pass, final design token tuning

---

## Risk Register

| #   | Risk                                                                          | Likelihood | Impact | Severity | Blocking?     | Mitigation                                                                                                                                              |
| --- | ----------------------------------------------------------------------------- | ---------- | ------ | -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CSS transforms hit visual ceiling (effects look flat compared to WebGL)       | Medium     | Medium | Medium   | No            | UI Designer spec covers the gap with multi-layer box-shadow + canvas particles; R3F upgrade path exists                                                 |
| 2   | Zoom-to-cursor math edge cases cause jarring jumps at zoom boundaries         | Medium     | High   | High     | No            | Tech spike (Phase 0) validates math; hysteresis prevents boundary flicker                                                                               |
| 3   | `backdrop-filter` causes frame drops during pan/zoom                          | High       | Medium | High     | No            | Disable during pan (swap to solid background fallback); re-enable after 150ms stillness                                                                 |
| 4   | Existing Tarva apps lack standardized health endpoints                        | High       | High   | High     | Yes (Phase 1) | Graceful degradation per-app; TCP check for CORE; mock data for ERP; document `/api/health` contract for other apps to adopt                            |
| 5   | Ollama response latency (3-10s) makes AI Camera Director feel sluggish        | High       | Medium | Medium   | No            | Speculative camera drift toward likely target; local pattern matcher handles 60%+ of commands instantly                                                 |
| 6   | Scope creep from "eye candy" ambition vs. shipping discipline                 | High       | High   | Critical | No            | Phase 0 tech spike gates everything; MVP = Phase 0+1 (working ZUI with live telemetry); visual polish is continuous, not blocking                       |
| 7   | Solo developer timeline (16-22 weeks per PMO) may exceed stakeholder patience | Medium     | High   | High     | No            | Phase 0+1 delivers a demo-able product in ~6-7 weeks; subsequent phases are incremental                                                                 |
| 8   | Text rendering blur at fractional CSS zoom levels (Z0/Z1)                     | Medium     | Low    | Low      | No            | Accept minor blur at Z0; counter-scale text containers at Z1 if needed                                                                                  |
| 9   | Supabase connection/availability during local development                     | Low        | Medium | Low      | No            | Supabase is a hosted service; if offline, Launch receipts queue locally and sync on reconnect; telemetry polling (HTTP to localhost apps) is unaffected |
| 10  | Film grain / scanline effects read as "retro" not "futuristic"                | Low        | Medium | Low      | No            | Subtle by default (opacity 0.035 for grain, 0.12 for scanlines); easy to tune or remove                                                                 |
| 11  | Ollama lacks required model (e.g., llama3.2 not pulled)                       | Medium     | Medium | Medium   | No            | Check model availability on Launch startup; display clear error in command palette if no compatible model found; document required model in README      |
| 12  | App health endpoint response format changes break telemetry silently          | Low        | Medium | Low      | No            | Aggregator validates response shape per-app; logs warnings for unexpected formats; falls back to UNKNOWN status for unparseable responses               |

---

## Open Questions for Stakeholder — RESOLVED

| #   | Question                                                 | Resolution                                                                                                                    |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Should TarvaERP be a full capsule or dimmed placeholder? | **Full capsule** — frontend is mostly done; real telemetry where available, graceful fallback                                 |
| 2   | Is tarvaCODE intended for the Launch?                    | **Yes** — stub it in as a 6th district; it will be Tarva's own "Claude Code" equivalent; OFFLINE/UNKNOWN until the app exists |
| 3   | Passphrase: per-install env var or hardcoded?            | **Hardcoded** for now; simplest approach for internal localhost tool                                                          |
| 4   | Priority order for district content in Phase 2?          | **Pending confirmation** — recommended: Agent Builder + Project Room first (richest APIs), Tarva Chat third                   |
| 5   | Should existing apps add `/api/health` endpoints?        | **Suggest, don't require** — document the health contract; Launch handles missing endpoints gracefully                        |

---

## Constraints and Non-Negotiables

- **Localhost only**: No cloud hosting, CI/CD, or production deployment
- **Free/open-source only**: Every dependency must be MIT, Apache-2.0, ISC, or SIL OFL
- **Eye candy first**: Visual impact is the primary success criterion; feature completeness is secondary
- **Internal tool**: No SEO, no i18n, no WCAG compliance requirements (though `prefers-reduced-motion` is respected)
- **Existing ecosystem consistency**: Next.js 16, React 19, Tailwind v4, Zustand 5, pnpm where it makes sense
- **No code changes to existing Tarva apps** (read-only telemetry; apps adopt `/api/health` at their own pace)
- **AI features are part of the vision**, not stretch goals; but they can be phased

---

## Deferred Items (Out of Scope)

| #   | Item                                                  | Why Deferred                                                                                                                                                                                                                                            | Revisit Trigger                                                                        |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1   | Voice input for Camera Director                       | Substantial complexity (wake word, STT, noise handling) for marginal value in a localhost dev tool                                                                                                                                                      | Phase 5+ if keyboard NL proves valuable                                                |
| 2   | Multi-user collaboration                              | Launch is a single-user tool; pinned views and shared snapshots require auth + real-time sync                                                                                                                                                           | If team grows beyond solo use                                                          |
| 3   | Custom theme / light mode                             | Dark mode is the entire aesthetic; light mode contradicts the Oblivion vision                                                                                                                                                                           | User request or accessibility need                                                     |
| 4   | Mobile / tablet support                               | Desktop-first per stakeholder directive; ZUI interactions are mouse/trackpad dependent                                                                                                                                                                  | Explicit request                                                                       |
| 5   | Persistent sessions across tabs                       | sessionStorage is tab-scoped by design; multi-tab requires localStorage or cookies                                                                                                                                                                      | User friction report                                                                   |
| 6   | Full generative UI (AI-generated React at runtime)    | Security risk, consistency risk, debugging difficulty; template selection gives 80% of value                                                                                                                                                            | Phase 5+ after template catalog matures                                                |
| 7   | WebSocket / SSE real-time telemetry                   | HTTP polling at 10-15s is sufficient for monitoring; WebSocket adds connection management complexity                                                                                                                                                    | Latency-sensitive alerts requirement                                                   |
| 8   | R3F / WebGL ambient layer                             | CSS achieves the visual target per VISUAL-DESIGN-SPEC.md; WebGL adds build + debug complexity                                                                                                                                                           | CSS visual ceiling reached                                                             |
| 9   | Supabase Realtime subscriptions for live telemetry    | Launch already uses Supabase for receipts; Realtime subscriptions for existing app tables require RLS policy changes in those apps                                                                                                                      | Need for <1s telemetry updates from app databases                                      |
| 10  | Pin/share view snapshots                              | Single-user tool; URL params (`?cx=&cy=&cz=`) provide basic view reproducibility; full named snapshot system requires persistence + sharing infrastructure                                                                                              | Phase 5+ if multi-user collaboration is added                                          |
| 11  | Predictive diff preview ("what will change" on hover) | Requires pre-computed impact analysis for each action before execution; receipt system covers the "after" view ("what changed"); predictive requires AI integration maturity                                                                            | Phase 4+ after receipt system and station framework mature                             |
| 12  | Autonomy ladder explicit UI                           | The AI routing architecture (AD-7) supports graduated autonomy levels internally; the user-facing UI for "AI suggests X / AI drafted X, approve? / AI executed X" is deferred to avoid front-loading AI UX before the AI features themselves are proven | Phase 4+ after AI Camera Director and station selection prove the interaction patterns |

---

## Assumptions Register

| #   | Assumption                                                                          | Status      | Source                                                              |
| --- | ----------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| 1   | All Tarva apps run on localhost with known ports (3000, 3005, 3010, 4000, 11435)    | VALIDATED   | TARVA-SYSTEM-OVERVIEW.md                                            |
| 2   | Agent Builder, Tarva Chat, and Project Room have or can add `/api/health` endpoints | UNVALIDATED | Inferred from their Next.js architecture                            |
| 3   | TarvaCORE listens on port 11435 and can be detected via TCP connection              | UNVALIDATED | TARVA-SYSTEM-OVERVIEW.md lists the port; TCP check approach from IA |
| 4   | Ollama is available at localhost:11434                                              | VALIDATED   | TARVA-SYSTEM-OVERVIEW.md                                            |
| 5   | pnpm is the global package manager                                                  | VALIDATED   | TARVA-SYSTEM-OVERVIEW.md                                            |
| 6   | The developer machine has sufficient GPU for CSS compositing of 50+ elements        | UNVALIDATED | Phase 0 tech spike validates this                                   |
| 7   | Supabase project is accessible with anon key for Launch-specific tables             | UNVALIDATED | Requires Supabase project setup with Launch tables + RLS policies   |
| 8   | 18 Canvas particles + CSS animations maintain 60fps during ZUI pan/zoom             | UNVALIDATED | Phase 0 tech spike validates this                                   |
| 9   | Geist fonts are available via next/font without additional configuration            | VALIDATED   | Next.js 16 + Vercel font system                                     |
| 10  | The stakeholder is the sole user of the Launch                                      | VALIDATED   | Stakeholder directive: internal team tool                           |
