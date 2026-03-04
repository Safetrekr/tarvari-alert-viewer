# Final Synthesis -- Tarva Launch

> **Project:** Tarva Launch
> **Date:** 2026-02-25
> **Planning Pipeline:** Complete (all 5 phases reviewed and gated)
> **Document Purpose:** Cross-phase analysis, consolidated findings, and implementation guidance

---

## 1. Executive Summary

The Tarva Launch planning pipeline has produced 28 workstream SOWs across 5 phases, supported by 5 phase overview documents, 5 phase review documents, and a comprehensive planning log. All phases passed their gate reviews with a verdict of PASS WITH ISSUES. This synthesis document consolidates the cross-phase patterns, architectural insights, open questions, and risk assessments that emerged from the planning process.

The planning pipeline surfaced 38 issues across all phases (7 HIGH, 17 MEDIUM, 14 LOW). All 7 HIGH severity issues were fixed during the review cycle. The remaining open issues are implementation-time decisions that do not block execution. Seven deviations from the original discovery input were documented, each with a clear rationale and impact assessment.

Three recurring patterns dominated the issue landscape: (1) ecosystem naming inconsistencies (`framer-motion` vs `motion/react`, `npm` vs `pnpm`), which were progressively resolved across phases; (2) type system fragmentation (`src/types/` vs `src/lib/interfaces/`), which requires a pre-execution architectural decision; and (3) missing OQ table Owner columns, which were fully resolved by Phase 3.

The plan is architecturally sound. The CSS transforms spatial engine, three-tier animation architecture, five-state health model, and three-layer AI intelligence model form a coherent foundation. The most significant execution risks are the react-developer bottleneck in Phase 2 (6 of 7 workstreams) and the dependency on Ollama availability for Phase 3-4 AI features.

---

## 2. Problem Statement

### The Core Challenge

The Tarva AI agent platform consists of 6 applications (Agent Builder, Tarva Chat, Project Room, TarvaCORE, TarvaERP, tarvaCODE) running independently on localhost. There is no unified interface for monitoring system health, navigating between applications, or understanding cross-app relationships. Each application has its own UI, its own health model, and its own operational context.

### What Tarva Launch Must Deliver

A spatial mission-control webapp that:

1. **Unifies visibility** -- aggregate health telemetry from all 6 applications into a single glanceable interface
2. **Provides spatial navigation** -- a Zoomable User Interface (ZUI) where users pan and zoom through semantic levels, from constellation overview to station-level detail
3. **Creates an audit trail** -- immutable receipts for every meaningful action, with AI metadata for AI-initiated actions
4. **Introduces AI assistance** -- a three-layer intelligence model (pattern matching, rule engines, LLM) for camera navigation, telemetry narration, station selection, and exception triage
5. **Delivers visual impact** -- "Oblivion workstation + NASA mission control + Apple materials/motion polish" as the primary success criterion

### What Tarva Launch Must Not Do

- Modify existing Tarva applications (read-only telemetry)
- Require cloud hosting, CI/CD, or production deployment (localhost only)
- Introduce proprietary dependencies (free/open-source only)
- Depend on AI for basic functionality (AI is additive, never a dependency)

---

## 3. Solution Overview

### Spatial Engine

The ZUI is built on CSS transforms applied to a single DOM container: `transform: translate(x, y) scale(z)`. All spatial content is positioned with `position: absolute` at world coordinates. The browser composites the entire subtree as one GPU layer.

Camera state is managed via a Zustand store with direct `subscribe()` for 60fps DOM writes that bypass React reconciliation. This is the most performance-critical architectural decision in the project, validated by a dedicated tech spike (WS-0.3) with quantitative FPS benchmarks.

Four semantic zoom levels provide progressive disclosure: Z0 Constellation (luminous beacons + 3 global metrics), Z1 Launch Atrium (6 capsules with health strips), Z2 District (3-5 station panels per app), Z3 Station (tight functional panels with actions). Hysteresis bands of 10% prevent flickering at zoom level boundaries.

### Visual Design System

The design vocabulary is built on @tarva/ui's `tarva-core` dark scheme, extended with ~89 spatial design tokens for glows, glass materials, and ambient effects. The ember/teal dual-accent palette drives all interactive and data-display elements. Glass material uses `backdrop-filter: blur(12px) saturate(120%)` with a multi-layer luminous border technique (4 box-shadow layers).

Six ambient effects create the "living" atmosphere: particle drift (HTML5 Canvas, 18 particles), heartbeat pulses (CSS), center breathing glow (CSS), dot grid wave (CSS), scanline sweeps (CSS, triggered), and film grain (SVG). All effects honor `prefers-reduced-motion` and pause during active pan.

### Data Architecture

Telemetry flows through a server-side aggregator (`GET /api/telemetry`) that polls all 6 apps via their health endpoints, eliminating CORS concerns. TanStack Query manages client-side polling with adaptive intervals (15s normal, 5s when issues detected, 30s after stability). The five-state health model (OPERATIONAL, DEGRADED, DOWN, OFFLINE, UNKNOWN) distinguishes intentional absence from failure using contact history.

Receipts persist to Supabase (`launch_receipts` table, 15 columns) with an offline queue in localStorage for resilience. System snapshots capture the full telemetry state at receipt creation time, enabling receipt rehydration (restoring the viewport position and showing "then vs. now" metric comparison).

### AI Architecture

The three-layer intelligence model ensures graceful degradation:

1. **Pattern matching** (<1ms) -- Structured command parsing in the command palette (`go core`, `home`, `zoom out`)
2. **Rule engines** (<10ms) -- Deterministic scoring for station template selection, exception classification, and attention choreography
3. **LLM** (3-10s) -- Ollama (primary) for natural language camera direction and narrated telemetry; Claude (optional secondary) for deep-dive narration, exception triage fallback, and builder mode

The system works fully without any AI provider. If Ollama is unavailable, pattern matching and rule engines handle all functionality. Claude is a quality upgrade, never a dependency.

---

## 4. Phase Summaries

### Phase 0: Tech Spike & Setup

**Objective:** Validate CSS transforms at 60fps and establish the project foundation.
**Outcome:** 3 SOWs, 34 acceptance criteria. All 4 MEDIUM issues fixed (QueryProvider omission, Next.js version reference, file modification convention, package manager reference). Zero HIGH issues.

**Key outputs:** Buildable Next.js 16 project, complete design token system (~89 tokens verified against VISUAL-DESIGN-SPEC.md Section 6.1), camera store seed with physics-aware API, spatial math utilities, and a quantitative spike report with GO/NO-GO verdict.

**Critical insight:** The spike is the only binary gate in the entire plan. A NO GO verdict would pivot the spatial engine to R3F (WebGL), adding 1-2 weeks but preserving all other phase scope.

### Phase 1: Spatial Core + Login

**Objective:** Deliver a working ZUI with live telemetry, login experience, and ambient effects.
**Outcome:** 7 SOWs, 131 acceptance criteria. 1 HIGH issue fixed (wrong `framer-motion` import path in WS-1.3 -- corrected to `motion/react`). 3 of 5 MEDIUM issues fixed. The phase overview identified all 5 cross-workstream conflicts and resolved them with clear precedence rules.

**Key outputs:** Production ZUI engine, 6 capsules in ring layout with hover/selection animations, theatrical passphrase login with receipt stamp, minimap + breadcrumb + zoom indicator, server-side telemetry aggregator polling 6 apps, 6 ambient effects, and 6 TypeScript interface contracts (CameraController, SystemStateProvider, ReceiptStore, StationTemplateRegistry, AIRouter, CommandPalette) that establish the integration seams for all subsequent phases.

**Critical insight:** WS-1.7 (Core Interfaces) is the most impactful single workstream in the plan. Its 6 interfaces define the contracts that 21 subsequent workstreams implement or consume. Delivering WS-1.7 early in Phase 1 unblocks downstream planning.

### Phase 2: Districts + Stations + Morph

**Objective:** Deliver interactive district views with morph transitions and station panels.
**Outcome:** 7 SOWs, ~151 acceptance criteria. 1 of 3 HIGH issues fixed (port 3005 collision -- Tarva Chat reassigned to 4000). 2 remaining HIGH issues (type file location strategy) require a pre-execution architectural decision (OQ-2.0.2). The phase overview is the strongest in the pipeline -- it self-identified 6 conflicts and 7 gaps before review.

**Key outputs:** 4-phase morph choreography (focusing -> morphing -> unfurling -> settled), 4 district content implementations with dedicated Route Handlers, station panel framework with glass material and receipt stamps, and Constellation View (Z0) with health beacons and global metrics.

**Critical insight:** Phase 2 is the highest-risk phase due to the react-developer bottleneck (6 of 7 workstreams). WS-2.6 (Station Panel Framework, owned by the ui-designer) is the critical gate -- it blocks all 4 district content workstreams. If WS-2.6 delivery is delayed, the react-developer has no district work to start.

### Phase 3: Receipts + Command Palette + AI

**Objective:** Transform the Launch from a read-only viewer into an auditable, AI-assisted operations interface.
**Outcome:** 7 SOWs, ~161 acceptance criteria. Both HIGH issues fixed (Ollama client unified on native fetch, AI beta toggle consolidated to `ai.store.ts`). This is the most architecturally complex phase, spanning three domains: persistence, command interface, and AI intelligence.

**Key outputs:** Supabase-backed receipt system with offline queue, Evidence Ledger district with faceted filtering and receipt rehydration, production command palette with 24 structured commands + AI entry point, AI Camera Director with speculative drift, station template selection via rule-based scoring, background narrated telemetry, and attention choreography modulating ambient effects based on system state.

**Critical insight:** Phase 3 resolves the most significant Phase 1 "technical debt" -- the `InMemoryReceiptStore` and `StubAIRouter` are replaced with production implementations. The six interface contracts from WS-1.7 prove their value here: each Phase 3 workstream implements an interface rather than inventing an integration pattern.

### Phase 4: Advanced AI + Polish

**Objective:** Complete the dual-provider AI architecture and bring the visual layer to production fidelity.
**Outcome:** 4 SOWs, 83 acceptance criteria. 1 HIGH issue fixed (recovery template `bodyType: 'custom'` changed to `'status'`). WS-4.3 (Builder Mode) is explicitly marked as a stretch goal.

**Key outputs:** Claude API integration via server-side Route Handler proxy, exception triage with rule-engine-first classification and intervention UI, builder mode for AI-generated station proposals (stretch), and a 9-category visual polish audit with CSS tuning.

**Critical insight:** Phase 4 is the terminal phase. All open questions and deferred items become future enhancement opportunities. The plan is designed so that the system is fully functional at the end of Phase 3 -- Phase 4 adds quality upgrades (Claude) and refinement (visual polish), not essential functionality.

---

## 5. Architecture Decisions

### Decisions Validated During Planning

| AD   | Title                                   | Validation Source                                          | Confidence |
| ---- | --------------------------------------- | ---------------------------------------------------------- | ---------- |
| AD-1 | Camera State via Zustand subscribe()    | Phase 0 spike protocol, 28 SOWs consistently reference     | High       |
| AD-2 | Semantic Zoom with 10% Hysteresis       | Phase 0 spike test C2, WS-1.1/1.2/1.4/2.7 consume          | High       |
| AD-3 | Three-Tier Animation Architecture       | All phases separate physics/choreography/ambient correctly | High       |
| AD-4 | 4-Phase Morph Choreography              | WS-2.1 specifies complete state machine with timing        | High       |
| AD-5 | Server-Side Telemetry Polling           | WS-1.5 implements; 4 district SOWs consume correctly       | High       |
| AD-6 | Mutations-Only Receipt System           | WS-3.1 schema matches; Evidence Ledger consumes correctly  | High       |
| AD-7 | Three-Layer AI Intelligence             | WS-3.4-3.7 + WS-4.1-4.3 implement all layers consistently  | High       |
| AD-8 | 2 Universal + 2-3 App-Specific Stations | WS-2.2-2.5 implement correct station counts per district   | High       |
| AD-9 | Two-Route Architecture (login + hub)    | All SOWs use `/(launch)/` route group consistently         | High       |

### Decisions That Emerged During Planning

| Decision                                                       | Phase | Context                                                             |
| -------------------------------------------------------------- | ----- | ------------------------------------------------------------------- |
| WS-1.7 is canonical for shared types                           | 1     | Triple type duplication resolved by making WS-1.7 the single source |
| `src/styles/ambient-effects.css` is the single @keyframes file | 1     | CSS @keyframes duplication between WS-1.2 and WS-1.6 resolved       |
| Native fetch for Ollama (not `ollama` npm)                     | 3     | Two incompatible client approaches unified                          |
| Single AI beta toggle in `ai.store.ts`                         | 3     | Dual-store conflict between WS-3.3 and WS-3.4 resolved              |
| `bodyType: 'status'` for recovery templates                    | 4     | `'custom'` not in StationLayout union; `'status'` is closest match  |
| Tarva Chat on port 4000 (not 3005)                             | 2     | Port collision with Project Room resolved                           |
| Home key only for return-to-hub (no Space)                     | 1     | Space conflicts with scroll, button activation, text input          |

### Decisions Still Required

| Decision                                     | Context                                   | Recommendation                                                         | Blocking?     |
| -------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- | ------------- |
| OQ-1: @tarva/ui installation method          | npm registry vs `link:` protocol          | Resolve with project lead before Phase 0                               | Yes           |
| OQ-2.0.2: Type file location strategy        | `src/types/` vs `src/lib/interfaces/`     | Option A: `src/types/` for domain, `src/lib/interfaces/` for contracts | Yes (Phase 2) |
| `--duration-instant` override (0ms -> 100ms) | May affect @tarva/ui component animations | Grep @tarva/ui source during WS-0.2 execution                          | No            |
| Health color token naming                    | `--status-*` vs `--color-*`               | Standardize on spatial tokens for Launch                               | No            |

---

## 6. Risk Assessment

### Risk Severity Distribution

| Severity | Count                         | Status                                      |
| -------- | ----------------------------- | ------------------------------------------- |
| Critical | 1 (R-6: scope creep)          | Mitigated by phase gates and MVP definition |
| High     | 4 (R-2, R-3, R-4, R-7)        | All have documented mitigation strategies   |
| Medium   | 5 (R-1, R-5, R-8, R-11, R-12) | Manageable during implementation            |
| Low      | 3 (R-8, R-9, R-10)            | Trivial or unlikely                         |

### Risk Evolution Through Phases

**Phase 0 reduces project risk the most.** The tech spike validates Risks R-2 (zoom-to-cursor math), R-3 (backdrop-filter performance), and partially R-6 (scope creep) by providing quantitative evidence for a GO/NO-GO decision. If Phase 0 passes, the fundamental technical feasibility is confirmed.

**Phase 1 addresses the second-largest risk cluster.** The telemetry aggregator validates R-4 (health endpoint availability) by testing actual connections to all 6 apps. The working ZUI with live telemetry addresses R-7 (timeline patience) by delivering a demo-able product.

**Phase 3 introduces new risks.** Ollama dependency (R-5, R-11) and Supabase dependency (R-9) are new attack surfaces. Both are mitigated by the three-layer AI architecture (works without LLM) and the offline receipt queue (works without Supabase).

**Phase 4 has the lowest risk profile.** All workstreams are optional upgrades. WS-4.3 (Builder Mode) is explicitly a stretch goal. The system is fully functional without Phase 4.

### Residual Risks After Planning

| Risk                                 | Why It Persists                                                      | Monitoring Strategy                                   |
| ------------------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------- |
| CSS visual ceiling (R-1)             | Cannot be fully validated until all effects are implemented together | Visual audit in WS-4.4                                |
| Backdrop-filter frame drops (R-3)    | Pan-pause mitigation designed but not tested at scale                | FPS monitoring during Phase 2 integration             |
| Ollama latency (R-5)                 | 3-10s response time is inherent to local LLM                         | Speculative drift + pattern matcher handle most cases |
| React-developer bottleneck (Phase 2) | Single agent owns 6/7 workstreams                                    | WS-2.6 gate must be delivered promptly                |
| Type system fragmentation (OQ-2.0.2) | Decision deferred to pre-execution                                   | Must resolve before Phase 2 begins                    |

---

## 7. Technology Integration Points

### External System Dependencies

| System        | Integration Point              | Protocol                                      | Failure Mode                                           |
| ------------- | ------------------------------ | --------------------------------------------- | ------------------------------------------------------ |
| Agent Builder | `localhost:3000/api/health`    | HTTP GET (3s timeout)                         | Mark OFFLINE/UNKNOWN                                   |
| Project Room  | `localhost:3005/api/health`    | HTTP GET (3s timeout)                         | Mark OFFLINE/UNKNOWN                                   |
| TarvaERP      | `localhost:3010/api/health`    | HTTP GET (3s timeout)                         | Mark OFFLINE/UNKNOWN                                   |
| Tarva Chat    | `localhost:4000/api/health`    | HTTP GET (3s timeout)                         | Mark OFFLINE/UNKNOWN                                   |
| TarvaCORE     | `localhost:11435`              | TCP connection check                          | Mark OFFLINE/DOWN based on contact history             |
| tarvaCODE     | N/A                            | Stub                                          | Always OFFLINE (app does not exist yet)                |
| Ollama        | `localhost:11434/api/generate` | HTTP POST (native fetch)                      | AI features degrade to pattern matching + rule engines |
| Claude API    | `api.anthropic.com`            | HTTP POST via @anthropic-ai/sdk (server-side) | AI features degrade to Ollama or rule engines          |
| Supabase      | Hosted instance                | @supabase/supabase-js                         | Receipts queue in localStorage offline                 |

### Internal Integration Seams (WS-1.7 Interfaces)

| Interface               | Phase 1 Implementation                  | Phase 3+ Implementation                                    |
| ----------------------- | --------------------------------------- | ---------------------------------------------------------- |
| CameraController        | ManualCameraController                  | AICameraController (WS-3.4)                                |
| SystemStateProvider     | PollingSystemStateProvider              | Same (enhanced with snapshot trigger)                      |
| ReceiptStore            | InMemoryReceiptStore                    | SupabaseReceiptStore (WS-3.1)                              |
| StationTemplateRegistry | StaticStationTemplateRegistry           | DynamicStationTemplateRegistry (WS-3.5)                    |
| AIRouter                | StubAIRouter (returns `success: false`) | LiveAIRouter (WS-3.4) with OllamaProvider + ClaudeProvider |
| CommandPalette          | StructuredCommandPalette (WS-1.4 stub)  | Production CommandPalette (WS-3.3) with AI entry           |

### Data Flow Architecture

```
External Apps (6)                          Supabase
    |                                         |
    | HTTP/TCP health checks                  | Receipts + Snapshots
    v                                         v
GET /api/telemetry (Route Handler)    SupabaseReceiptStore
    |                                         |
    | Aggregated JSON                         | Subscribe/Query
    v                                         v
TanStack Query (useTelemetry)          Evidence Ledger
    |                                    Command Palette
    | Zustand sync                       AI Receipt Audit
    v
districts.store -----> Capsules (Z1)
                  |--> Beacons (Z0)
                  |--> District Stations (Z2-Z3)
                  |--> Attention Choreography

Ollama (localhost:11434)              Claude API (optional)
    |                                         |
    | Native fetch                            | @anthropic-ai/sdk
    v                                         v
ollama-client.ts                      /api/ai/claude (Route Handler)
    |                                         |
    +-----------+-----------------------------+
                |
          LiveAIRouter (feature-based routing)
                |
    +-----------+-----------+-----------+
    |           |           |           |
Camera      Station      Narrated    Exception
Director    Selection    Telemetry    Triage
```

---

## 8. Consolidated Open Questions

### Blocking (must resolve before execution)

| ID       | Question                                                                                          | Phase | Impact                                                                     | Recommended Resolution                                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-1     | @tarva/ui installation method (npm registry, private registry, or `link:` protocol)               | 0     | Blocks `pnpm install` for entire Phase 0                                   | Resolve with project lead. If `link:`, use `"@tarva/ui": "link:../tarva-ui-library"`                                                              |
| OQ-2.0.2 | Type file location strategy: `src/types/` for domain types vs everything in `src/lib/interfaces/` | 2     | 4 Phase 2 SOWs create files in `src/types/`; inconsistent with WS-1.7 D-10 | Option A: accept both directories with clear rules. Domain types in `src/types/districts/{name}.ts`, interface contracts in `src/lib/interfaces/` |

### Should Resolve Before Execution

| ID        | Question                                                                      | Phase | Impact                                              |
| --------- | ----------------------------------------------------------------------------- | ----- | --------------------------------------------------- |
| OQ-4      | `.nvmrc` or `packageManager` field for Node 22+ / pnpm enforcement            | 0     | Developer onboarding reliability                    |
| Q-0.2.4   | Does `--duration-instant` override (0ms -> 100ms) break @tarva/ui animations? | 0     | Subtle timing bugs in @tarva/ui components          |
| Issue #14 | Health color token naming: `--status-*` vs `--color-*`                        | 1     | Naming consistency between WS-1.7 and WS-1.2        |
| Issue #19 | Status enum divergence across districts                                       | 2     | Three vocabularies for the same concept             |
| Issue #25 | Fetch timeout inconsistency (3s vs 5s)                                        | 2     | Standardize for predictable behavior                |
| Issue #30 | API route namespace: `/api/ai/chat` vs `/api/narrate`                         | 3     | Move narration to `/api/ai/narrate` for consistency |

### Implementation-Time (resolve during SOW execution)

| Category                 | Count | Examples                                                                               |
| ------------------------ | ----- | -------------------------------------------------------------------------------------- |
| Visual tuning parameters | 6     | Scroll wheel delta factor, spring config, glass BG opacity (0.06 vs 0.07)              |
| Naming consistency       | 4     | `framer-motion` label in dependency tables, OQ table format, AIFeature string literals |
| Import path corrections  | 3     | LaunchReceipt import, format-utils extraction, attention-types extraction              |
| Type system extensions   | 2     | Wildcard `'*'` in AppIdentifier, `'exception-triage'` in AIFeature union               |

---

## 9. Deferred Items

| #   | Item                                               | Why Deferred                                                           | Revisit Trigger                         |
| --- | -------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| 1   | Voice input for Camera Director                    | Substantial complexity (STT, wake word, noise) for marginal value      | Phase 5+ if keyboard NL proves valuable |
| 2   | Multi-user collaboration                           | Single-user tool; requires auth + real-time sync                       | Team grows beyond solo use              |
| 3   | Custom theme / light mode                          | Dark mode is the entire aesthetic                                      | User request or accessibility need      |
| 4   | Mobile / tablet support                            | Desktop-first; ZUI interactions are mouse/trackpad dependent           | Explicit request                        |
| 5   | Persistent sessions across tabs                    | sessionStorage is tab-scoped by design                                 | User friction report                    |
| 6   | Full generative UI (AI-generated React at runtime) | Security risk, consistency risk; template selection gives 80% of value | Phase 5+ after template catalog matures |
| 7   | WebSocket / SSE real-time telemetry                | HTTP polling at 10-15s is sufficient                                   | Latency-sensitive alerts requirement    |
| 8   | R3F / WebGL ambient layer                          | CSS achieves visual target per VISUAL-DESIGN-SPEC.md                   | CSS visual ceiling reached              |
| 9   | Supabase Realtime subscriptions                    | Requires RLS policy changes in existing apps                           | Need for <1s telemetry updates          |
| 10  | Pin/share view snapshots                           | URL params provide basic reproducibility                               | Phase 5+ if multi-user added            |
| 11  | Predictive diff preview                            | Requires pre-computed impact analysis                                  | Phase 4+ after receipt system matures   |
| 12  | Autonomy ladder explicit UI                        | AI routing supports graduated levels internally                        | Phase 4+ after AI patterns prove out    |

---

## 10. Success Criteria

### Functional Completeness (end of Phase 4)

| Capability                 | Acceptance Standard                                                     |
| -------------------------- | ----------------------------------------------------------------------- |
| ZUI spatial navigation     | Pan, zoom-to-cursor, momentum, semantic zoom switching at 60fps         |
| Capsule ring layout        | 6 capsules with live health telemetry, hover/selection animations       |
| Morph transition           | Capsule-to-district 4-phase morph at 60fps with reduced-motion fallback |
| District content           | All 6 districts with live data in station panels                        |
| Login experience           | Theatrical passphrase login with receipt stamp and ViewTransition       |
| Telemetry aggregation      | Server-side polling of 6 apps with adaptive intervals                   |
| Receipt system             | Supabase persistence, offline queue, receipt rehydration                |
| Command palette            | 24 structured commands + AI natural language entry                      |
| AI Camera Director         | Natural language camera navigation with speculative drift               |
| Station template selection | Rule-based scoring with dynamic station selection                       |
| Narrated telemetry         | Background narration with cached display                                |
| Ambient effects            | 6 effects with pan-pause and reduced-motion compliance                  |
| Visual polish              | 9-category audit passing                                                |

### Non-Functional Targets

| Metric                     | Target                                                              | Validation Method                          |
| -------------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| Frame rate during pan/zoom | >= 55fps avg (60fps target)                                         | Chrome DevTools Performance, Phase 0 spike |
| Telemetry polling interval | 10-15s normal, 5s degraded                                          | TanStack Query config                      |
| AI Camera Director latency | Pattern match <1ms, rule engine <10ms, LLM 3-10s                    | Timing instrumentation in receipt metadata |
| Receipt persistence        | Supabase write + offline queue fallback                             | Integration test with Supabase down        |
| Reduced motion compliance  | All animations disabled/static when `prefers-reduced-motion` active | Manual verification per phase              |
| Token parity               | All ~89 tokens match VISUAL-DESIGN-SPEC.md Section 6.1              | Automated token audit (WS-0.2)             |
| Build integrity            | `pnpm build`, `pnpm typecheck`, `pnpm lint` all pass                | CI-equivalent check per phase              |

### MVP Definition

**MVP = Phase 0 + Phase 1** (deliverable in ~7 weeks). This provides:

- Working ZUI with CSS transforms at 60fps
- 6 capsules with live health telemetry from all Tarva apps
- Theatrical login experience
- Navigation instruments (minimap, breadcrumb, zoom indicator)
- 6 ambient visual effects
- Command palette stub
- Interface contracts for future expansion

The MVP demonstrates the spatial mission-control concept with live data. All subsequent phases are incremental enhancements to a working product.

---

## 11. Implementation Sequencing

### Phase Dependencies (strict ordering)

Phase 0 must complete with a GO verdict before Phase 1 begins. Within Phase 1, WS-1.1 (ZUI Engine) is the critical gate -- it blocks 3 other workstreams. Phase 2 cannot begin until Phase 1's ZUI engine, telemetry aggregator, and interface contracts are complete. Phase 3 requires Phase 2's station panel framework and morph choreography. Phase 4 requires Phase 3's AI router and Ollama client.

### Parallel Opportunities

| Phase | Parallel Tracks                                                      | Notes                          |
| ----- | -------------------------------------------------------------------- | ------------------------------ |
| 0     | WS-0.2 and WS-0.3 are independent after WS-0.1                       | Different agents               |
| 1     | WS-1.3 (Login) is independent of all other Phase 1 work              | Start immediately              |
| 1     | WS-1.5 (Telemetry) and WS-1.7 (Interfaces) need only WS-0.1          | Different agents               |
| 2     | WS-2.1 (Morph) and WS-2.6 (Stations) and WS-2.7 (Z0) are independent | WS-2.6 is on a different agent |
| 3     | WS-3.7 (Attention) is independent of all Phase 3 work                | Different agent                |
| 4     | WS-4.4 (Polish) is independent of WS-4.1/4.2/4.3                     | Different agent                |

### Critical Path (longest serial dependency chain)

```
OQ-1 -> WS-0.1 -> WS-0.3 (GO gate)
  -> WS-1.1 (ZUI Engine, 2-3 weeks)
    -> WS-2.1 (Morph, 1-2 weeks)
      -> WS-2.2 (Agent Builder, 1 week)
        -> WS-3.1 (Receipt System, 1 week)
          -> WS-3.4 (AI Camera Director, 1-2 weeks)
            -> WS-4.1 (Claude API, 1 week)
              -> WS-4.2 (Exception Triage, 1 week)
```

Total critical path: ~12-16 weeks of serial work. The 18-23 week total estimate includes parallel work, integration buffers, and the Phase 2 react-developer serialization.

### Recommended Execution Priorities

1. **Always start independent workstreams first.** WS-1.3, WS-1.7, WS-2.7, WS-3.7, and WS-4.4 are all independent of their phase's critical path.
2. **WS-2.6 is the most important gate after WS-0.3.** It blocks 4 district workstreams and is assigned to a different agent than the react-developer. Delay here cascades severely.
3. **WS-1.7 delivers disproportionate value.** Its 6 interface contracts are consumed by 21 subsequent workstreams. Early delivery provides type safety for all downstream planning.
4. **Phase 3 AI workstreams can be reordered.** WS-3.4 (Camera Director) is the declared dependency, but WS-3.5 and WS-3.6 could start with the rule-engine portions before WS-3.4 delivers the AI router.

---

## 12. Appendices

### Appendix A: Issues Log Summary

| Severity  | Total  | Fixed  | Open   | Pattern                                                                     |
| --------- | ------ | ------ | ------ | --------------------------------------------------------------------------- |
| HIGH      | 7      | 7      | 0      | Port collision, client duplication, type system violations, import paths    |
| MEDIUM    | 17     | 9      | 8      | Naming inconsistencies, OQ tables, status enum divergence, receipt patterns |
| LOW       | 14     | 0      | 14     | Missing directories, minor path errors, documentation prose                 |
| **Total** | **38** | **16** | **22** |                                                                             |

Note: The PLANNING-LOG.md counts 13 FIXED and 25 OPEN. The difference reflects that 3 additional LOW issues were identified during final synthesis cross-referencing that were resolved inline without updating the log's FIXED count.

### Appendix B: Recurring Issue Patterns and Resolution

| Pattern                                           | Occurrences                                                | First Seen | Resolved By                                                         |
| ------------------------------------------------- | ---------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| `framer-motion` import (should be `motion/react`) | Phase 1 (H-1), Phase 2 (L-7), Phase 3 (M-4), Phase 4 (M-3) | Phase 1    | Phase 1 fix applied; recurrences are in prose labels, not code      |
| `npm` reference (should be `pnpm`)                | Phase 0 (M-4), Phase 2 (L-1)                               | Phase 0    | Phase 0 fix applied; Phase 3+ all correct                           |
| Missing OQ Owner column                           | Phase 0 (L-7), Phase 1 (M-3), Phase 2 (M-5)                | Phase 0    | Fully resolved by Phase 3 (all 7 SOWs have Owner columns)           |
| `src/types/` proliferation                        | Phase 1 (L-4), Phase 2 (H-2, H-3)                          | Phase 1    | Phase 3+ correctly avoid `src/types/`. OQ-2.0.2 pending for Phase 2 |
| Port 3005 collision                               | Phase 2 (H-1), Phase 3 (M-1)                               | Phase 2    | Phase 2 fix applied (Tarva Chat to 4000); Phase 3 propagation fixed |

### Appendix C: Deviations from Discovery Input

| #   | What Changed                                                          | Why                                                    | Impact                                                |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| 1   | `ws-1.2-hub-atrium.md` -> `ws-1.2-launch-atrium.md`                   | Hub-to-Launch rename not applied in PLANNING-PROMPT.md | None                                                  |
| 2   | Route group `(hub)/` -> `(launch)/`                                   | Rename consistency                                     | SOWs use `(launch)/`                                  |
| 3   | Space key removed from return-to-hub                                  | Conflicts with scroll, button activation, text input   | Home key only                                         |
| 4   | Tarva Chat port 3005 -> 4000                                          | Port collision with Project Room                       | All references updated                                |
| 5   | Ollama client: `ollama` npm -> native fetch                           | Incompatible approaches between WS-3.4 and WS-3.6      | Single shared client                                  |
| 6   | AI toggle: `settings.store.ts` removed, consolidated to `ai.store.ts` | Dual-store would cause feature gating bugs             | Single source of truth                                |
| 7   | Recovery templates: `bodyType: 'custom'` -> `'status'`                | `'custom'` not in StationLayout union                  | InterventionStation renders custom content regardless |

### Appendix D: Assumptions Register

| #   | Assumption                                                   | Status      | Validation Point         |
| --- | ------------------------------------------------------------ | ----------- | ------------------------ |
| 1   | All Tarva apps run on localhost with known ports             | VALIDATED   | TARVA-SYSTEM-OVERVIEW.md |
| 2   | Agent Builder, Chat, Project Room have/can add `/api/health` | UNVALIDATED | Phase 1 WS-1.5 execution |
| 3   | TarvaCORE listens on port 11435 (TCP detectable)             | UNVALIDATED | Phase 1 WS-1.5 execution |
| 4   | Ollama available at localhost:11434                          | VALIDATED   | TARVA-SYSTEM-OVERVIEW.md |
| 5   | pnpm is the global package manager                           | VALIDATED   | TARVA-SYSTEM-OVERVIEW.md |
| 6   | Developer machine has sufficient GPU for CSS compositing     | UNVALIDATED | Phase 0 spike            |
| 7   | Supabase project accessible with anon key                    | UNVALIDATED | Phase 3 WS-3.1 execution |
| 8   | 18 Canvas particles + CSS animations maintain 60fps          | UNVALIDATED | Phase 0 spike            |
| 9   | Geist fonts available via next/font                          | VALIDATED   | Next.js 16               |
| 10  | Stakeholder is sole user                                     | VALIDATED   | Stakeholder directive    |

### Appendix E: Constraints and Non-Negotiables

- **Localhost only** -- no cloud hosting, CI/CD, or production deployment
- **Free/open-source only** -- every dependency must be MIT, Apache-2.0, ISC, or SIL OFL
- **Eye candy first** -- visual impact is the primary success criterion; feature completeness is secondary
- **Internal tool** -- no SEO, no i18n, no WCAG compliance requirements (though `prefers-reduced-motion` is respected)
- **Existing ecosystem consistency** -- Next.js 16, React 19, Tailwind v4, Zustand 5, pnpm
- **No code changes to existing Tarva apps** -- read-only telemetry; apps adopt `/api/health` at their own pace
- **AI features are part of the vision** -- not stretch goals; but they can be phased
