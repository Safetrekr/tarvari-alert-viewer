# Master Plan -- Tarva Launch

> **Project:** Tarva Launch
> **Version:** 1.0.0
> **Date:** 2026-02-25
> **Status:** All 5 phases planned and reviewed. Ready for execution.
> **Total Workstreams:** 28 SOWs across 5 phases
> **Total Acceptance Criteria:** ~560
> **Planning Pipeline Verdict:** PASS WITH ISSUES (all phases)

---

## 1. Executive Summary

Tarva Launch is a spatial mission-control webapp that unifies the Tarva AI agent platform's 6 applications into a single Zoomable User Interface (ZUI). Users pan and zoom through an infinite canvas where apps appear as "districts" with live telemetry, ambient visual effects, and AI-assisted operations. The aesthetic benchmark is "Oblivion workstation + NASA mission control + Apple materials/motion polish."

The implementation plan spans 28 workstreams across 5 phases, progressing from a tech spike validating the CSS transforms spatial engine (Phase 0), through a working ZUI with live telemetry (Phase 1), district-level views with morph transitions (Phase 2), persistent receipts and AI integration (Phase 3), to dual-provider AI and visual polish (Phase 4). Total estimated timeline is 18-23 weeks for a single developer, with parallelization opportunities reducing the critical path.

All 5 phases have passed planning review with a verdict of PASS WITH ISSUES. 38 issues were identified across all reviews; 13 have been fixed in the planning documents. The remaining 25 are OPEN but non-blocking -- they represent implementation-time decisions, naming consistency items, and minor documentation gaps.

Seven deviations from the original discovery input were documented and approved: hub-to-launch rename, Space key removal, port reassignment (Tarva Chat to 4000), Ollama client consolidation, AI toggle consolidation, and a bodyType union fix.

---

## 2. Phase Gate Summary

| Phase     | Name                            | Complexity | Est. Duration   | SOWs   | ACs      | Verdict          | HIGH Issues       | MEDIUM Issues    | LOW Issues |
| --------- | ------------------------------- | ---------- | --------------- | ------ | -------- | ---------------- | ----------------- | ---------------- | ---------- |
| 0         | Tech Spike & Setup              | S          | 1 week          | 3      | 34       | PASS WITH ISSUES | 0                 | 4 (all FIXED)    | 8          |
| 1         | Spatial Core + Login            | L          | 5-6 weeks       | 7      | 131      | PASS WITH ISSUES | 1 (FIXED)         | 5 (3 FIXED)      | 8          |
| 2         | Districts + Stations + Morph    | XL         | 6-8 weeks       | 7      | ~151     | PASS WITH ISSUES | 3 (1 FIXED)       | 7 (1 FIXED)      | 7          |
| 3         | Receipts + Command Palette + AI | L          | 4-5 weeks       | 7      | ~161     | PASS WITH ISSUES | 2 (all FIXED)     | 5 (1 FIXED)      | 4          |
| 4         | Advanced AI + Polish            | M          | 2-3 weeks       | 4      | 83       | PASS WITH ISSUES | 1 (FIXED)         | 5                | 3          |
| **Total** |                                 |            | **18-23 weeks** | **28** | **~560** |                  | **7 (all FIXED)** | **26 (9 FIXED)** | **30**     |

**Gate policy:** All HIGH severity issues must be fixed before execution. MEDIUM and LOW issues are tracked in the PLANNING-LOG.md Issues Log and resolved during implementation.

---

## 3. Cross-Phase Dependency Chain

### Phase-Level Dependencies

```
Phase 0 (Tech Spike)
  |
  +-- GO verdict required ---------> Phase 1 (Spatial Core)
  |   - Buildable project               |
  |   - Design tokens                   +-- ZUI engine ---------> Phase 2 (Districts)
  |   - Camera store seed               |   - Telemetry              |
  |   - Spatial math utils              |   - Interfaces             +-- Morph ---------> Phase 3 (Receipts + AI)
  |   - Tuned parameters                |   - Ambient effects        |   - Station FW         |
  |                                     |                            |   - District data      +-- Receipt infra --> Phase 4 (Advanced AI)
  |                                     |                            |                        |   - AI router
  |                                     |                            |                        |   - Ollama client
```

### Critical Cross-Phase Artifacts

| Artifact                                  | Produced By   | Consumed By                            | Notes                                                                                                  |
| ----------------------------------------- | ------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| GO/NO-GO verdict                          | WS-0.3        | Phase 1 planning                       | NO GO triggers R3F pivot                                                                               |
| Camera store API                          | WS-0.3        | WS-1.1                                 | Spike store becomes production seed                                                                    |
| Spatial math utilities                    | WS-0.3        | WS-1.1                                 | Promoted to production code                                                                            |
| Tuned parameters (friction, spring, zoom) | WS-0.3 report | WS-1.1 constants                       | Documented in spike report                                                                             |
| Design token system                       | WS-0.2        | WS-1.2, WS-1.3, WS-1.6, all Phase 2+   | ~89 CSS custom properties                                                                              |
| `camera.store.ts` (production)            | WS-1.1        | WS-1.2, WS-1.4, WS-1.6, WS-2.1         | Central nervous system                                                                                 |
| `useSemanticZoom()` hook                  | WS-1.1        | WS-1.2, WS-1.4, WS-2.7                 | Semantic zoom level consumer                                                                           |
| `usePanPause()` hook                      | WS-1.1        | WS-1.2, WS-1.6, WS-1.4                 | Ambient effect pausing                                                                                 |
| 6 interface contracts                     | WS-1.7        | All Phase 2-4 SOWs                     | CameraController, SystemStateProvider, ReceiptStore, StationTemplateRegistry, AIRouter, CommandPalette |
| `GET /api/telemetry` route                | WS-1.5        | WS-2.2-2.5, WS-2.7                     | Server-side aggregator                                                                                 |
| `InMemoryReceiptStore`                    | WS-1.7        | WS-2.6 (receipt stamps)                | Replaced by WS-3.1 `SupabaseReceiptStore`                                                              |
| Morph choreography                        | WS-2.1        | WS-2.2-2.5 district content            | 4-phase state machine                                                                                  |
| Station panel framework                   | WS-2.6        | WS-2.2-2.5, WS-3.2, WS-4.2, WS-4.3     | 3-zone layout, glass material                                                                          |
| `SupabaseReceiptStore`                    | WS-3.1        | WS-3.2, WS-3.3, WS-3.4                 | Replaces in-memory store                                                                               |
| `LiveAIRouter`                            | WS-3.4        | WS-3.5, WS-3.6, WS-4.1, WS-4.2, WS-4.3 | Feature-based AI routing                                                                               |
| `ollama-client.ts`                        | WS-3.6        | WS-3.4, WS-4.2                         | Shared native fetch client                                                                             |
| `ai.store.ts`                             | WS-3.4        | WS-3.3, WS-4.1                         | AI state + beta toggle                                                                                 |
| `ClaudeProvider`                          | WS-4.1        | WS-4.2 (fallback), WS-4.3 (primary)    | Server-side only                                                                                       |

---

## 4. Implementation Sequence

### Phase 0: Tech Spike & Setup (Week 1)

```
Pre-execution: Resolve OQ-1 (@tarva/ui installation method)

Day 1-2:   WS-0.1 (react-developer)     -- Project Scaffolding
Day 2-3:   WS-0.2 (ui-designer)         -- Design Tokens [parallel with WS-0.3]
Day 2-5:   WS-0.3 (react-developer)     -- ZUI Tech Spike implementation
Day 5-6:   WS-0.3 (react-developer)     -- Performance testing + spike report
Day 6-7:   Buffer / go-no-go review

Critical path: OQ-1 -> WS-0.1 (1-2d) -> WS-0.3 (3-5d) -> Go/No-Go
```

### Phase 1: Spatial Core + Login (Weeks 2-7)

```
Week 2:    WS-1.7 (CTA)                 -- Core Interfaces [start immediately]
           WS-1.3 (ui-designer)         -- Login Experience [independent of ZUI]
Weeks 2-4: WS-1.1 (react-developer)     -- ZUI Engine [critical path]
Week 3:    WS-1.5 (backend-engineer)    -- Telemetry Aggregator [parallel]
Weeks 4-5: WS-1.2 (ui-designer)         -- Launch Atrium [needs WS-1.1]
           WS-1.4 (react-developer)     -- Navigation Instruments [needs WS-1.1]
Weeks 5-6: WS-1.6 (ui-designer)         -- Ambient Effects [needs WS-1.1]
Week 7:    Integration buffer

Critical path: WS-0.3 -> WS-1.1 (2-3w) -> WS-1.2 + WS-1.4 (1-2w) -> Integration
```

### Phase 2: Districts + Stations + Morph (Weeks 8-15)

```
Weeks 8-9:   WS-2.1 (react-developer)     -- Morph Choreography [start immediately]
             WS-2.6 (ui-designer)          -- Station Panel Framework [parallel, GATE]
             WS-2.7 (react-developer)      -- Constellation View [parallel, independent]
Weeks 10-11: WS-2.2 (react-developer)     -- Agent Builder District [needs WS-2.1+WS-2.6]
             WS-2.3 (react-developer)     -- Project Room District [parallel with WS-2.2]
Weeks 12-13: WS-2.4 (react-developer)     -- Tarva Chat District
             WS-2.5 (react-developer)     -- CORE/ERP/CODE Districts
Weeks 14-15: Integration + composition testing

Critical path: WS-2.6 (GATE) -> WS-2.2-2.5 (4-5w serial) -> Integration
Bottleneck: react-developer owns 6 of 7 WS
```

### Phase 3: Receipts + Command Palette + AI (Weeks 16-20)

```
Week 16:     WS-3.1 (backend-engineer)    -- Receipt System [start immediately, GATE]
             WS-3.7 (ui-designer)          -- Attention Choreography [parallel, independent]
Weeks 17-18: WS-3.2 (react-developer)     -- Evidence Ledger [needs WS-3.1]
             WS-3.3 (react-developer)     -- Command Palette [needs WS-3.1]
             WS-3.4 (AIA)                 -- AI Camera Director [parallel]
Weeks 18-19: WS-3.5 (AIA)                 -- Station Template Selection [needs WS-3.4]
             WS-3.6 (AIA)                 -- Narrated Telemetry [needs WS-3.4]
Week 20:     Integration + AI testing

Critical path: WS-3.1 (GATE) -> WS-3.2+3.3 (2w) -> Integration
```

### Phase 4: Advanced AI + Polish (Weeks 21-23)

```
Week 21:     WS-4.1 (backend-engineer)    -- Claude API Integration
             WS-4.4 (ui-designer)          -- Visual Polish Pass [parallel]
Weeks 22-23: WS-4.2 (AIA)                 -- Exception Triage [needs WS-4.1]
             WS-4.3 (AIA)                 -- Builder Mode [STRETCH, needs WS-4.1]
Week 23:     Final integration

Critical path: WS-4.1 -> WS-4.2+4.3 (1-2w)
Note: WS-4.3 is a stretch goal; skip if timeline is tight.
```

---

## 5. Resource Plan

### Agent Assignments

| Agent                                      | WS Count | Workstreams                                   | Primary Domain                                                                            |
| ------------------------------------------ | -------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| react-developer                            | 12       | WS-0.1, 0.3, 1.1, 1.4, 2.1-2.5, 2.7, 3.2, 3.3 | Spatial engine, camera mechanics, district components                                     |
| world-class-ui-designer                    | 7        | WS-0.2, 1.2, 1.3, 1.6, 2.6, 3.7, 4.4          | Design tokens, capsule styling, login UX, ambient effects, visual polish                  |
| world-class-backend-api-engineer           | 3        | WS-1.5, 3.1, 4.1                              | Telemetry aggregator, receipt storage, AI provider integration                            |
| world-class-autonomous-interface-architect | 5        | WS-3.4, 3.5, 3.6, 4.2, 4.3                    | AI Camera Director, station selection, narrated telemetry, exception triage, builder mode |
| chief-technology-architect                 | 1        | WS-1.7                                        | Core interface definitions                                                                |

### Standing Pipeline Roles

| Role                                               | Responsibility                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| software-product-owner                             | Requirements validation, acceptance criteria review, product logic completeness |
| enterprise-software-project-manager-controller-pmo | Sequencing realism, resource loading, cross-phase dependencies, escalation      |
| every-time                                         | Phase reviewer, SOW completeness, cross-phase consistency, final validation     |

### Bottleneck Analysis

| Phase | Bottleneck Agent | Load               | Mitigation                                                          |
| ----- | ---------------- | ------------------ | ------------------------------------------------------------------- |
| 0     | react-developer  | 2 of 3 WS (serial) | WS-0.2 runs in parallel on ui-designer                              |
| 1     | ui-designer      | 3 of 7 WS          | Start WS-1.3 (independent) while WS-1.1 blocks WS-1.2/1.6           |
| 2     | react-developer  | 6 of 7 WS          | WS-2.6 (ui-designer) is a gate; WS-2.7 runs parallel with WS-2.1    |
| 3     | AIA              | 3 of 7 WS          | WS-3.4/3.5/3.6 are AI-domain; react-dev does WS-3.2/3.3 in parallel |
| 4     | AIA              | 2 of 4 WS          | WS-4.1 (backend) and WS-4.4 (ui-designer) run parallel              |

---

## 6. Risk Register

### Project-Level Risks (from combined-recommendations.md)

| #    | Risk                                                              | Likelihood | Impact | Severity | Mitigation                                                                                           |
| ---- | ----------------------------------------------------------------- | ---------- | ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| R-1  | CSS transforms hit visual ceiling                                 | Medium     | Medium | Medium   | UI Designer spec covers gap with multi-layer box-shadow + canvas particles; R3F upgrade path exists  |
| R-2  | Zoom-to-cursor math edge cases cause jarring jumps                | Medium     | High   | High     | Phase 0 tech spike validates math; hysteresis prevents boundary flicker                              |
| R-3  | `backdrop-filter` causes frame drops during pan/zoom              | High       | Medium | High     | Disable during pan (solid fallback); re-enable after 150ms stillness                                 |
| R-4  | Existing Tarva apps lack standardized health endpoints            | High       | High   | High     | Graceful degradation per-app; TCP check for CORE; mock data for ERP; document `/api/health` contract |
| R-5  | Ollama response latency (3-10s) makes AI Camera Director sluggish | High       | Medium | Medium   | Speculative camera drift; local pattern matcher handles 60%+ of commands                             |
| R-6  | Scope creep from "eye candy" ambition                             | High       | High   | Critical | Phase 0 gates everything; MVP = Phase 0+1; polish is continuous                                      |
| R-7  | Solo developer timeline (18-23 weeks) exceeds patience            | Medium     | High   | High     | Phase 0+1 delivers demo-able product in ~7 weeks                                                     |
| R-8  | Text rendering blur at fractional CSS zoom levels                 | Medium     | Low    | Low      | Accept blur at Z0; counter-scale text at Z1 if needed                                                |
| R-9  | Supabase connection/availability during local dev                 | Low        | Medium | Low      | Receipts queue locally; telemetry polling unaffected                                                 |
| R-10 | Film grain / scanline effects read as "retro"                     | Low        | Medium | Low      | Subtle by default; easy to tune or remove                                                            |
| R-11 | Ollama lacks required model                                       | Medium     | Medium | Medium   | Check model on startup; clear error in command palette                                               |
| R-12 | App health endpoint format changes break telemetry                | Low        | Medium | Low      | Validate response shape; log warnings; fall back to UNKNOWN                                          |

### Phase-Level Risks (aggregated from SOW reviews)

| Phase | Key Risk                                       | Mitigation                                                                              |
| ----- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| 0     | `@tarva/ui` not available on registry (OQ-1)   | Resolve before execution; `link:` protocol fallback                                     |
| 0     | Spike yields NO GO                             | R3F hybrid fallback documented; adds 1-2 weeks                                          |
| 1     | Port 3000 conflict (Launch vs Agent Builder)   | Configure Launch on alternate port or resolve with startup ordering                     |
| 2     | react-developer bottleneck (6/7 WS)            | WS-2.6 gate must be delivered promptly by ui-designer                                   |
| 2     | `src/types/` architectural decision (OQ-2.0.2) | Recommend Option A: accept `src/types/` for domain, `src/lib/interfaces/` for contracts |
| 3     | Ollama client duplication                      | FIXED: unified on native fetch (WS-3.6 approach)                                        |
| 3     | AI beta toggle dual-store                      | FIXED: consolidated to `ai.store.ts`                                                    |
| 4     | `bodyType: 'custom'` not in union              | FIXED: changed to `bodyType: 'status'`                                                  |
| 4     | WS-4.3 Builder Mode is a stretch goal          | Skip if timeline is tight; system works fully without it                                |

---

## 7. Technology Stack

### Core Stack

| Layer           | Choice                   | Version | License    |
| --------------- | ------------------------ | ------- | ---------- |
| Framework       | Next.js (App Router)     | 16.x    | MIT        |
| UI Library      | React                    | 19.x    | MIT        |
| Language        | TypeScript (strict mode) | 5.x     | Apache-2.0 |
| Runtime         | Node.js                  | 22+     | MIT        |
| Package Manager | pnpm                     | Latest  | MIT        |
| CSS Framework   | Tailwind CSS (CSS-first) | 4.x     | MIT        |

### Application Dependencies

| Package               | Version | Purpose                                               | License     |
| --------------------- | ------- | ----------------------------------------------------- | ----------- |
| @tarva/ui             | latest  | Shared component library (Radix + Tailwind v4 + CVA)  | Internal    |
| @supabase/supabase-js | latest  | Database client (receipts, snapshots)                 | MIT         |
| zustand               | 5.x     | State management (4 stores)                           | MIT         |
| immer                 | latest  | Immutable state updates (Zustand middleware)          | MIT         |
| motion                | 12.x    | Layout transitions and morphs (`motion/react` import) | MIT         |
| @tanstack/react-query | 5.x     | Data fetching and polling                             | MIT         |
| nanoid                | latest  | Receipt ID generation                                 | MIT         |
| lucide-react          | latest  | Icons                                                 | ISC         |
| geist                 | latest  | Fonts (Geist Sans + Mono)                             | SIL OFL 1.1 |
| clsx                  | latest  | Conditional classnames                                | MIT         |
| tailwind-merge        | latest  | Tailwind class deduplication                          | MIT         |
| cmdk                  | latest  | Command palette (via @tarva/ui)                       | MIT         |
| zod                   | latest  | Schema validation (AI responses, builder mode)        | MIT         |

### AI Dependencies (installed in Phase 3-4)

| Package           | Version | Purpose                                        | License |
| ----------------- | ------- | ---------------------------------------------- | ------- |
| @anthropic-ai/sdk | latest  | Claude API client (optional, server-side only) | MIT     |

Note: Ollama integration uses native `fetch()` -- no npm package required. The `ollama` npm package was evaluated and rejected in favor of a lighter native client.

### Zustand Store Architecture

| Store     | File                 | Purpose                 | Key State                                                    |
| --------- | -------------------- | ----------------------- | ------------------------------------------------------------ |
| Camera    | `camera.store.ts`    | Spatial camera position | `offsetX`, `offsetY`, `zoom`, `semanticLevel`, `isAnimating` |
| Districts | `districts.store.ts` | App telemetry data      | `Record<string, AppTelemetry>`                               |
| UI        | `ui.store.ts`        | UI interaction state    | `selectedDistrictId`, `morphPhase`, `commandPaletteOpen`     |
| Auth      | `auth.store.ts`      | Authentication          | `authenticated`, `sessionKey`                                |
| AI        | `ai.store.ts`        | AI state (Phase 3+)     | `betaEnabled`, `sessionCost`, `providers`                    |

### Design Token System (~89 tokens)

| Category                | Count | Source                        |
| ----------------------- | ----- | ----------------------------- |
| Background colors       | 6     | @tarva/ui `tarva-core` scheme |
| Border scale            | 5     | @tarva/ui                     |
| Text colors             | 4     | @tarva/ui                     |
| Ember accent (primary)  | 6     | @tarva/ui `--primary`         |
| Teal accent (secondary) | 6     | @tarva/ui `--accent`          |
| Status colors (4 x 3)   | 12    | @tarva/ui                     |
| Glow shadows            | 8     | Launch spatial tokens         |
| Spatial spacing         | 8     | Launch spatial tokens         |
| Durations               | 11    | Launch spatial tokens         |
| Easing curves           | 6     | Launch spatial tokens         |
| Opacity levels          | 10    | Launch spatial tokens         |
| Blur radii              | 4     | Launch spatial tokens         |
| Typography              | 7     | Launch spatial tokens         |

---

## 8. Architecture Decision Record

### AD-1: Camera State Management

**Decision:** Zustand store with direct `subscribe()` for DOM updates, bypassing React reconciliation during animation.
**Rationale:** Camera updates at 60fps via direct `element.style.transform` writes; standard React re-renders cannot sustain this frequency.
**Implementation:** `camera.store.ts` with immer middleware. `panBy()`, `zoomTo()`, `flyTo()`, `resetToLaunch()`. URL sync on settle only (`?cx=&cy=&cz=`).

### AD-2: Semantic Zoom with Hysteresis

**Decision:** Config-driven zoom level thresholds with 10% hysteresis bands.
**Rationale:** Prevents flickering at zoom level boundaries during continuous scroll.
**Levels:** Z0 Constellation (enter <0.27, exit >=0.30), Z1 Launch Atrium (0.30-0.79), Z2 District (0.80-1.49), Z3 Station (>=1.50).

### AD-3: Three-Tier Animation Architecture

**Decision:** Separate physics (rAF), choreography (motion/react), and ambient (CSS @keyframes) into non-overlapping layers.
**Rationale:** Each tier operates on different threads/frequencies. Never use `motion/react` layout animations inside the CSS-transformed container.
**Constraint:** Ambient animations pause during active pan (resume after 150ms stillness).

### AD-4: Morph Choreography

**Decision:** 4-phase state machine: focusing (300ms) -> morphing (200ms) -> unfurling (400ms) -> settled.
**Rationale:** Cinematic transition from capsule to district with coordinated camera spring and element transitions.
**Reduced motion:** All durations set to 0ms; immediate state change.

### AD-5: Telemetry Polling Architecture

**Decision:** Server-side Route Handler (`GET /api/telemetry`) + client-side TanStack Query polling.
**Rationale:** Route Handler eliminates CORS; adaptive polling (15s normal, 5s degraded, 30s stable).
**Apps polled:** Agent Builder (3000), Project Room (3005), TarvaERP (3010), Tarva Chat (4000), TarvaCORE (11435 TCP), tarvaCODE (stub OFFLINE).

### AD-6: Receipt System

**Decision:** Mutations-only receipts with Supabase persistence and visual stamp ritual.
**Rationale:** Only meaningful actions generate receipts (5-15 per session). Immutable audit trail with AI metadata fields.
**Schema:** `launch_receipts` (15 columns), `launch_snapshots` with offline queue in localStorage.

### AD-7: AI Integration Architecture

**Decision:** Three-layer intelligence: local pattern matching -> deterministic rule engines -> LLM (Ollama primary, Claude optional).
**Rationale:** System works without AI. Deterministic layers handle 60%+ of requests in <10ms. LLM only for ambiguous/novel cases.
**Provider routing:** Feature-based table with primary/fallback per capability.

### AD-8: Station Content per District

**Decision:** 2 universal stations (Launch, Status) + 2-3 app-specific stations per district.
**Rationale:** Not all apps have the same data surface. Universal stations provide consistency; app-specific stations surface unique data.

### AD-9: Project File Structure

**Decision:** Two-route architecture (login + hub) with all spatial navigation client-side.
**Routes:** `/login` (theatrical login), `/(launch)` (ZUI entry point, auth-guarded).
**Directories:** `src/components/{spatial,districts,stations,ambient,auth,telemetry,ui}`, `src/hooks/`, `src/stores/`, `src/lib/`.

### Planning-Phase Decisions

| ID        | Decision                                                                | Phase | SOW            |
| --------- | ----------------------------------------------------------------------- | ----- | -------------- |
| D-THEME-1 | Forced dark mode via `forcedTheme="dark"`                               | 0     | WS-0.1, WS-0.2 |
| D-THEME-2 | Spatial tokens in `src/styles/spatial-tokens.css`                       | 0     | WS-0.2         |
| D-THEME-3 | `@theme` (static) for spatial, `@theme inline` (var refs) for @tarva/ui | 0     | WS-0.2         |
| D-THEME-4 | VISUAL-DESIGN-SPEC.md Section 6.1 is canonical for token values         | 0     | WS-0.2         |
| D-TOOL-1  | `next/font/google` for Geist fonts (not `geist` npm)                    | 0     | WS-0.1         |
| D-TOOL-2  | Re-export ThemeProvider through `"use client"` wrapper                  | 0     | WS-0.1         |
| D-TOOL-4  | Immer middleware for all Zustand stores                                 | 0     | WS-0.1         |
| D-TOOL-5  | Standalone project (no pnpm workspace)                                  | 0     | WS-0.1         |
| D-SPIKE-1 | Spike code lives in production project                                  | 0     | WS-0.3         |

---

## 9. Pre-Implementation Checklist

### Blocking Prerequisites (must resolve before any execution)

- [ ] **OQ-1:** Resolve `@tarva/ui` installation method (npm registry, private registry, or `link:` protocol to local `tarva-ui-library`)
- [ ] **Node.js 22+** confirmed on developer machine
- [ ] **pnpm** installed and available globally
- [ ] **Ollama** available at localhost:11434 (Phase 3+ requirement; not blocking for Phase 0-2)
- [ ] **Supabase** project accessible with anon key for Launch-specific tables (Phase 3+ requirement)

### Architectural Decisions to Finalize

- [ ] **OQ-2.0.2:** Type file location strategy -- recommend Option A: `src/types/` for domain types, `src/lib/interfaces/` for interface contracts. Standardize district types to `src/types/districts/{name}.ts`
- [ ] **OQ-4:** `.nvmrc` and `packageManager` field for Node/pnpm version enforcement

### Environment Setup

- [ ] Agent Builder reference codebase (`tarva-claude-agents-frontend`) available for pattern reference
- [ ] `@tarva/ui` library source (`tarva-ui-library`) available for token verification
- [ ] Known port assignments documented: Agent Builder (3000), Project Room (3005), TarvaERP (3010), Tarva Chat (4000), TarvaCORE (11435), Ollama (11434)
- [ ] VISUAL-DESIGN-SPEC.md accessible for token value cross-reference

### Execution Conventions

- [ ] **File modification protocol:** When a later workstream provides full file contents for a file created by an earlier workstream, the later version supersedes entirely. Preservation items are explicitly listed.
- [ ] **Import path convention:** Always use `motion/react` (never `framer-motion`). Always use `pnpm` (never `npm`).
- [ ] **Type canonical source:** `src/lib/interfaces/types.ts` is the single source of truth for shared domain types (`AppIdentifier`, `HealthState`, `SemanticZoomLevel`). WS-1.7 owns this file.

---

## 10. Acceptance Criteria Summary

### Per-Phase Totals

| Phase | SOW    | AC Count | Key Verification Methods                                         |
| ----- | ------ | -------- | ---------------------------------------------------------------- |
| 0     | WS-0.1 | 12       | CLI commands, browser navigation, directory inspection           |
| 0     | WS-0.2 | 9        | Token parity audit, Tailwind utility generation, computed styles |
| 0     | WS-0.3 | 13       | FPS monitor, Chrome DevTools, visual validation, spike report    |
| 1     | WS-1.1 | 17       | Pan/zoom interaction, FPS, semantic zoom switching               |
| 1     | WS-1.2 | 26       | Visual inspection, animation timing, capsule interactions        |
| 1     | WS-1.3 | 13       | Login flow, auth validation, ViewTransition                      |
| 1     | WS-1.4 | 22       | Minimap, breadcrumb, zoom indicator, keyboard shortcuts          |
| 1     | WS-1.5 | 17       | Route handler responses, polling intervals, error handling       |
| 1     | WS-1.6 | 20       | Particle rendering, CSS animations, reduced-motion               |
| 1     | WS-1.7 | 16       | Interface conformance, type checking, stub behavior              |
| 2     | WS-2.1 | 39       | Morph phases, timing, camera spring, reverse flow                |
| 2     | WS-2.2 | 25       | Agent Builder data, stations, route handler                      |
| 2     | WS-2.3 | 24       | Project Room data, 5 stations, governance                        |
| 2     | WS-2.4 | 24       | Tarva Chat data, adaptive polling                                |
| 2     | WS-2.5 | ~20      | TCP health check, ERP telemetry, tarvaCODE stub                  |
| 2     | WS-2.6 | 15       | Glass material, luminous border, receipt stamps                  |
| 2     | WS-2.7 | 24       | Beacon rendering, global metrics, Z0/Z1 transition               |
| 3     | WS-3.1 | 22       | Supabase schema, CRUD, offline queue                             |
| 3     | WS-3.2 | 24       | Timeline, faceted filtering, receipt rehydration                 |
| 3     | WS-3.3 | 22       | cmdk integration, 24 commands, AI entry point                    |
| 3     | WS-3.4 | 25       | Ollama chat, CameraDirective schema, speculative drift           |
| 3     | WS-3.5 | 20       | Template registry, trigger evaluation, scoring                   |
| 3     | WS-3.6 | 26       | Background narration, caching, on-focus display                  |
| 3     | WS-3.7 | 22       | Attention states, performance levels, effect modulation          |
| 4     | WS-4.1 | 25       | Claude API proxy, rate limits, cost tracking, degradation        |
| 4     | WS-4.2 | 20       | Exception classification, recovery templates, intervention UI    |
| 4     | WS-4.3 | 24       | Zod schema, template vocabulary, accept/promote workflow         |
| 4     | WS-4.4 | 14       | 9-category audit, CSS tuning, token verification                 |

### Phase Exit Criteria

**Phase 0:** Project builds, tokens match VISUAL-DESIGN-SPEC Section 6.1, ZUI spike >= 55fps avg with 10 elements, spike report published with GO verdict.

**Phase 1:** ZUI engine functional (pan, zoom, momentum, semantic levels), 6 capsules with live telemetry, login flow complete with receipt stamp, navigation instruments operational, 6 ambient effects rendering, 6 interface contracts passing type checks.

**Phase 2:** Capsule-to-district morph at 60fps, all 6 districts rendering live data in station panels, Constellation View showing health beacons, station receipt stamps functional, composition test passing (all districts + morph + telemetry simultaneously).

**Phase 3:** Receipts persisting to Supabase, Evidence Ledger with faceted filtering and rehydration, command palette with 24 commands + AI entry, AI Camera Director functional with Ollama, station template selection operational, narrated telemetry generating in background, attention choreography modulating effects.

**Phase 4:** Claude API integration with cost tracking, exception triage classifying failures, builder mode generating station proposals (stretch), visual polish audit complete with all categories passing.

---

## 11. SOW Inventory

| WS     | Title                      | Phase | Agent                                      | Complexity | Dependencies           | Blocks                             |
| ------ | -------------------------- | ----- | ------------------------------------------ | ---------- | ---------------------- | ---------------------------------- |
| WS-0.1 | Project Scaffolding        | 0     | react-developer                            | S          | OQ-1                   | WS-0.2, WS-0.3, all P1+            |
| WS-0.2 | Design Tokens Setup        | 0     | world-class-ui-designer                    | S          | WS-0.1                 | WS-1.2, WS-1.3, WS-1.6             |
| WS-0.3 | ZUI Tech Spike             | 0     | react-developer                            | M          | WS-0.1                 | WS-1.1 (GO gate)                   |
| WS-1.1 | ZUI Engine                 | 1     | react-developer                            | L          | WS-0.3                 | WS-1.2, WS-1.4, WS-1.6, WS-2.1     |
| WS-1.2 | Launch Atrium              | 1     | world-class-ui-designer                    | M          | WS-1.1, WS-0.2         | WS-2.1                             |
| WS-1.3 | Login Experience           | 1     | world-class-ui-designer                    | M          | WS-0.1, WS-0.2         | None (independent)                 |
| WS-1.4 | Navigation Instruments     | 1     | react-developer                            | M          | WS-1.1                 | WS-3.3 (palette stub)              |
| WS-1.5 | Telemetry Aggregator       | 1     | world-class-backend-api-engineer           | M          | WS-0.1, WS-1.7         | WS-2.2-2.5, WS-2.7                 |
| WS-1.6 | Ambient Effects Layer      | 1     | world-class-ui-designer                    | M          | WS-1.1                 | WS-3.7                             |
| WS-1.7 | Core Interfaces            | 1     | chief-technology-architect                 | S          | WS-0.1                 | All P2-4 SOWs                      |
| WS-2.1 | Morph Choreography         | 2     | react-developer                            | L          | WS-1.1, WS-1.2         | WS-2.2-2.5                         |
| WS-2.2 | District: Agent Builder    | 2     | react-developer                            | M          | WS-2.1, WS-2.6, WS-1.5 | WS-3.2                             |
| WS-2.3 | District: Project Room     | 2     | react-developer                            | M          | WS-2.1, WS-2.6, WS-1.5 | WS-3.2                             |
| WS-2.4 | District: Tarva Chat       | 2     | react-developer                            | M          | WS-2.1, WS-2.6, WS-1.5 | WS-3.2                             |
| WS-2.5 | District: CORE/ERP/CODE    | 2     | react-developer                            | S          | WS-2.1, WS-2.6, WS-1.5 | WS-3.2                             |
| WS-2.6 | Station Panel Framework    | 2     | world-class-ui-designer                    | M          | WS-1.7                 | WS-2.2-2.5, WS-3.2, WS-4.2, WS-4.3 |
| WS-2.7 | Constellation View (Z0)    | 2     | react-developer                            | S          | WS-1.1, WS-1.5         | None                               |
| WS-3.1 | Receipt System             | 3     | world-class-backend-api-engineer           | L          | WS-1.7                 | WS-3.2, WS-3.3, WS-3.4             |
| WS-3.2 | Evidence Ledger            | 3     | react-developer                            | L          | WS-3.1, WS-2.6         | None                               |
| WS-3.3 | Command Palette            | 3     | react-developer                            | M          | WS-1.4, WS-3.1         | None                               |
| WS-3.4 | AI Camera Director         | 3     | world-class-autonomous-interface-architect | L          | WS-1.7, WS-3.1         | WS-3.5, WS-3.6, WS-4.1             |
| WS-3.5 | Station Template Selection | 3     | world-class-autonomous-interface-architect | M          | WS-3.4, WS-1.7         | WS-4.2, WS-4.3                     |
| WS-3.6 | Narrated Telemetry         | 3     | world-class-autonomous-interface-architect | M          | WS-3.4                 | WS-4.1                             |
| WS-3.7 | Attention Choreography     | 3     | world-class-ui-designer                    | S          | WS-1.5, WS-1.6         | None                               |
| WS-4.1 | Claude API Integration     | 4     | world-class-backend-api-engineer           | M          | WS-3.4                 | WS-4.2 (soft), WS-4.3 (hard)       |
| WS-4.2 | Exception Triage           | 4     | world-class-autonomous-interface-architect | M          | WS-4.1, WS-2.6, WS-3.5 | None                               |
| WS-4.3 | Builder Mode (Stretch)     | 4     | world-class-autonomous-interface-architect | M          | WS-4.1, WS-2.6, WS-3.5 | None                               |
| WS-4.4 | Visual Polish Pass         | 4     | world-class-ui-designer                    | S          | All prior visual WS    | None                               |

---

## Appendix A: File Modification Convention

When a later workstream provides full file contents for a file created by an earlier workstream, the later version **supersedes the earlier version entirely**. Any elements from the earlier version that must be preserved are explicitly listed in the later SOW's deliverable section.

Known supersession chain:

| File                         | Created By | Superseded By | Notes                          |
| ---------------------------- | ---------- | ------------- | ------------------------------ |
| `src/app/globals.css`        | WS-0.1     | WS-0.2        | WS-0.2 version is complete     |
| `src/app/layout.tsx`         | WS-0.1     | WS-0.2        | WS-0.2 preserves QueryProvider |
| `src/stores/camera.store.ts` | WS-0.1     | WS-0.3        | Spike-validated API            |
| `src/stores/camera.store.ts` | WS-0.3     | WS-1.1        | Production version             |
| `CommandPaletteStub.tsx`     | WS-1.4     | WS-3.3        | Full command palette           |
| `InMemoryReceiptStore`       | WS-1.7     | WS-3.1        | SupabaseReceiptStore           |
| `StubAIRouter`               | WS-1.7     | WS-3.4        | LiveAIRouter                   |

## Appendix B: Port Assignments

| Service                    | Port                     | Notes                                    |
| -------------------------- | ------------------------ | ---------------------------------------- |
| Tarva Launch (Next.js dev) | 3001 (or next available) | Avoid conflict with Agent Builder        |
| Agent Builder              | 3000                     | Existing                                 |
| Project Room               | 3005                     | Existing                                 |
| TarvaERP                   | 3010                     | Existing                                 |
| Tarva Chat                 | 4000                     | Changed from 3005 per Phase 2 Review H-1 |
| TarvaCORE                  | 11435                    | Electron, TCP check only                 |
| Ollama                     | 11434                    | AI provider                              |

## Appendix C: Health State Model

| State       | Color     | Pulse    | Meaning                                  |
| ----------- | --------- | -------- | ---------------------------------------- |
| OPERATIONAL | Green     | Pulsing  | All checks passing                       |
| DEGRADED    | Amber     | Steady   | Running with reduced capability          |
| DOWN        | Red       | Flashing | Should be running but not responding     |
| OFFLINE     | Dim/muted | None     | Not running, expected                    |
| UNKNOWN     | Gray      | Dashed   | No telemetry connection ever established |

## Appendix D: Spine Object Model

| Object    | Type         | Definition                                              |
| --------- | ------------ | ------------------------------------------------------- |
| Activity  | Cross-app    | Any discrete unit of work (resolves "Run" collision)    |
| Artifact  | Cross-app    | Any durable output produced by an activity              |
| Exception | Cross-app    | Any error, failure, or anomaly                          |
| Receipt   | Launch-local | Immutable record of a meaningful Launch event           |
| Evidence  | Launch-local | Curated collection of receipts + app-sourced audit data |
