# Phase 3 Overview: Receipts + Command Palette + AI

> **Synthesized by:** CTA + SPO + STW + PMO perspectives
> **Input SOWs:** WS-3.1 through WS-3.7
> **Prior phases:** Phase 1 Overview, Phase 2 Overview
> **Discovery artifacts:** combined-recommendations.md
> **Date:** 2026-02-25

---

## 1. Executive Summary

Phase 3 transforms Tarva Launch from a read-only spatial telemetry viewer into an auditable, AI-assisted operations interface. It delivers three pillars: **persistent receipts** (every meaningful action becomes an immutable audit record in Supabase), **a production command palette** (replacing the Phase 1 stub with full synonym matching and an AI entry point), and **four AI capabilities** (Camera Director, Station Template Selection, Narrated Telemetry, Attention Choreography) that bring intelligence to the spatial interface without ever compromising the system's ability to function without AI.

The phase comprises **7 workstreams** across **3 engineering domains**:

| Domain                | Workstreams                                                                                                                    | Purpose                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Persistence**       | WS-3.1 (Receipt System), WS-3.2 (Evidence Ledger)                                                                              | Replace `InMemoryReceiptStore` with Supabase-backed `SupabaseReceiptStore`; surface receipts in a new NW-quadrant Evidence Ledger district with faceted filtering and receipt rehydration                                            |
| **Command Interface** | WS-3.3 (Command Palette)                                                                                                       | Replace `CommandPaletteStub.tsx` with a full `cmdk`-based palette supporting 24 structured commands + 1 conditional AI command via synonym ring matching                                                                             |
| **AI Intelligence**   | WS-3.4 (AI Camera Director), WS-3.5 (Station Template Selection), WS-3.6 (Narrated Telemetry), WS-3.7 (Attention Choreography) | Three-layer intelligence model (pattern matching -> rule engines -> Ollama LLM) powering natural-language camera navigation, dynamic station layout, background narration generation, and attention-driven ambient effect modulation |

**Estimated complexity:** L (4-5 weeks) per combined-recommendations.md, with 3 agents (react-developer, backend-engineer, ui-designer) and a CTA review checkpoint. The critical path runs through WS-3.1 (receipt infrastructure blocks WS-3.2 and receipt generation in WS-3.3/3.4) and WS-3.4 (AI infrastructure blocks WS-3.5/3.6 integration).

**Key architectural decisions in this phase:**

- Supabase replaces in-memory storage for receipts and system snapshots (AD-6, Gap 5 resolution)
- Ollama at `localhost:11434` with model `llama3.2` is the primary AI provider (AD-7)
- AI features are strictly additive -- the system works identically when AI is disabled or Ollama is unavailable
- All AI decisions generate receipts with `aiMetadata` (provider, confidence, latency, reasoning) for auditability
- The `motion/react` import path is used consistently across all 7 SOWs (no `framer-motion` references)
- `pnpm` is the canonical package manager (no `npm` references in any SOW)

---

## 2. Key Findings

### 2.1 Receipt System Resolves Phase 1 Gap #5 and OQ-4

WS-3.1 directly resolves **Gap 5 (Launch Data Storage)** from combined-recommendations.md by implementing Supabase persistence via two tables:

- **`launch_receipts`** -- 15 columns including `id` (UUID v7), `correlation_id`, `source` (enum: `launch`, `agent-builder`, `tarva-chat`, `project-room`, `tarva-core`, `tarva-erp`, `tarva-code`), `event_type`, `severity`, `summary`, `detail` (JSONB), `location` (JSONB with `semanticLevel`, `district`, `station`), `timestamp`, `duration_ms`, `actor` (enum: `human`, `ai`, `system`), `ai_metadata` (JSONB nullable), `snapshot_id` (FK to `launch_snapshots`), `target` (JSONB nullable), `tags` (text array). RLS policy: `service_role` only.
- **`launch_snapshots`** -- Captures `SystemSnapshot` data as JSONB, with `trigger` enum (`receipt`, `periodic`, `manual`) and optional `receipt_id` FK.

The `SupabaseReceiptStore` class (`src/lib/receipt-store/supabase-receipt-store.ts`) implements the WS-1.7 `ReceiptStore` interface with these methods: `record()`, `query()`, `getById()`, `getByCorrelation()`, `count()`, `subscribe()`. It extends the interface with `flushOfflineQueue()`, `offlineQueueLength`, and `getSnapshotForReceipt()`.

The **offline queue** (`src/lib/receipt-store/offline-queue.ts`) persists failed inserts to `localStorage` under key `tarva-launch-offline-receipts` and retries on flush with exponential backoff.

### 2.2 Evidence Ledger Creates a New District

WS-3.2 introduces the **Evidence Ledger** as a new NW-quadrant district at world coordinates approximately `(-400, -400)`. This is the first district not tied to an external Tarva app -- it is Launch-native. It operates at two semantic zoom levels:

- **Z2 (TimelineStrip):** Compressed density bar showing receipt activity volume and color-coded actor type (blue = human, amber = AI, gray = system)
- **Z3 (TimelinePanel):** Full interactive panel with `FacetedFilter` (4 facet groups: Source, Type, Severity, Time Range), `TimelineItem` components with expandable `ReceiptDetailPanel`, and `MetricComparison` overlay for rehydration

The rehydration system is architecturally significant: clicking a receipt's "Rehydrate" button calls `CameraController.navigate()` to restore the viewport position recorded at receipt creation time, applies a highlight pulse CSS animation to the target element, and shows a "Then vs Now" metric comparison overlay using the linked `SystemSnapshot`.

### 2.3 Command Palette Replaces Phase 1 Stub

WS-3.3 replaces `CommandPaletteStub.tsx` (WS-1.4) with a production `CommandPalette.tsx` component. Key changes:

- **24 structured commands** organized into 3 categories: Navigation (9), View (9), Action (5), plus 1 conditional AI command
- **Synonym ring integration** via `StructuredCommandPalette.getSuggestions()` from WS-1.7 -- typing "AB", "agentgen", or "builder" all resolve to "Go to Agent Builder"
- **"Ask AI..." option** gated behind `settings.store.aiCameraDirectorEnabled` -- always visible but disabled when toggle is off (discoverable but inactive)
- **Max width increased** from 480px (stub) to 520px to accommodate longer labels and the Beta badge
- **Receipt generation** for every command execution via `ReceiptStore.record()` with correct `eventType` mapping
- **`cmdk` custom filter** set to always return 1 (disabling cmdk's built-in search); all filtering delegated to `StructuredCommandPalette`

### 2.4 AI Architecture Follows Three-Layer Intelligence Model (AD-7)

The four AI workstreams implement a graduated intelligence architecture:

**Layer 1 -- Pattern Matching (instant, <1ms):**
WS-3.4 `PatternMatcherProvider` (`src/lib/ai/pattern-matcher-provider.ts`) uses regex intent patterns to resolve structured queries like "go to agent builder" or "show alerts" without any LLM call. Handles an estimated 60%+ of natural-language queries.

**Layer 2 -- Rule Engines (deterministic, <10ms):**
WS-3.5 `TriggerConditionEvaluator` (`src/lib/ai/template-selection/trigger-evaluator.ts`) evaluates dot-path conditions (e.g., `apps.agent-builder.alertCount > 0`) against `SystemSnapshot` data. WS-3.7 `computeRawAttentionState()` applies rule-based anomaly detection.

**Layer 3 -- Ollama LLM (3-10s):**
WS-3.4 `OllamaProvider` and WS-3.6 `ollama-client.ts` call Ollama at `localhost:11434` with model `llama3.2` for natural-language understanding and narration generation. This is the layer with the highest latency and the most graceful degradation.

### 2.5 Attention Choreography Modulates Phase 1/2 Visual Effects

WS-3.7 does not create new visual effects -- it modulates existing Phase 1 and Phase 2 components. The modulation matrix has **6 cells** (2 attention states x 3 performance levels):

|                        | `calm`                                     | `tighten`                                                                                                                             |
| ---------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| **full** (>=55fps)     | Baseline values from VISUAL-DESIGN-SPEC.md | Reduced particles (18->8), disabled breathing, amplified anomalous beacons (1.5x), dimmed healthy beacons (0.5x), faster morph timing |
| **reduced** (30-54fps) | Halved particles (9), reduced timings      | Minimal particles (4), anomaly effects only                                                                                           |
| **minimal** (<30fps)   | Static only, no animation                  | All animation disabled, static indicators only                                                                                        |

Hysteresis prevents mode flicker: `calm -> tighten` is immediate (any anomaly), but `tighten -> calm` requires 3 consecutive calm-eligible snapshots.

### 2.6 Consistent Technology Choices Across All SOWs

- **`motion/react` import path:** All 7 SOWs use `import { motion, AnimatePresence } from 'motion/react'`. Zero instances of `framer-motion` package name. This aligns with the Phase 2 resolution.
- **`pnpm` as package manager:** No SOW references `npm install` or `npm`. WS-3.3 AC-26 explicitly references `pnpm typecheck`.
- **Zustand with `immer` middleware:** WS-3.4 (`ai.store.ts`), WS-3.7 (`attention.store.ts`) use `immer` for immutable state updates. WS-3.3 (`settings.store.ts`) uses `persist` middleware with `localStorage`.
- **TanStack Query:** WS-3.1 (`useReceiptTimeline`), WS-3.2 (receipt data fetching) use TanStack Query with `refetchInterval` for polling.
- **Zod schema validation:** WS-3.4 uses Zod to validate Ollama JSON responses against the `CameraDirective` schema.

---

## 3. Cross-Workstream Conflicts

### Conflict 1: Ollama Client Duplication (HIGH -- BLOCKS AI CONSISTENCY)

**WS-3.4** creates `OllamaProvider` at `src/lib/ai/ollama-provider.ts` using the `ollama` npm package:

```ts
import { Ollama } from 'ollama'
// Uses Ollama SDK methods: chat(), list(), show()
```

**WS-3.6** creates `ollama-client.ts` at `src/lib/ai/ollama-client.ts` using native `fetch`:

```ts
// This client does NOT use the `ollama` npm package -- it uses native fetch
const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, { ... })
```

These are two independent HTTP clients to the same Ollama server at `localhost:11434`. WS-3.6 explicitly comments that it does NOT use the `ollama` npm package. WS-3.4 explicitly imports from it.

**Impact:** Duplicate dependency management, inconsistent error handling, inconsistent health check mechanisms, and two different timeout configurations (WS-3.4: 10s, WS-3.6: 30s). If Ollama changes its API, two code paths must be updated.

**Resolution:** Consolidate into a single shared Ollama client. Two options:

- **Option A (Recommended):** Use the `ollama` npm package as the single client (WS-3.4's approach). WS-3.6's `ollama-client.ts` becomes a thin wrapper that delegates to the shared `OllamaProvider`. This provides SDK-level type safety and handles API evolution.
- **Option B:** Use native `fetch` as the single client (WS-3.6's approach). Strip the `ollama` npm package dependency. This reduces bundle size but loses SDK type safety.

Regardless of choice, the shared client should live at `src/lib/ai/ollama-client.ts` with a unified health check, configurable timeouts, and a single error-handling pattern.

### Conflict 2: AI Beta Toggle Duplication (HIGH -- BLOCKS SETTINGS CONSISTENCY)

**WS-3.3** creates `settings.store.ts` at `src/stores/settings.store.ts` with:

```ts
aiCameraDirectorEnabled: boolean // persisted to localStorage key 'tarva-launch-settings'
```

**WS-3.4** creates `ai.store.ts` at `src/stores/ai.store.ts` with:

```ts
betaEnabled: boolean // persisted to localStorage key 'tarva-launch-ai-beta'
```

Both control the same concept: whether AI features are active. WS-3.3 gates the "Ask AI..." command palette option on `settings.store.aiCameraDirectorEnabled`. WS-3.4 gates the entire AI routing system on `ai.store.betaEnabled`.

**Impact:** A user could enable AI in the command palette (WS-3.3 toggle) but have it disabled in the AI store (WS-3.4 toggle), or vice versa. Two `localStorage` keys managing the same concept creates a split-brain scenario.

**Resolution:** Consolidate into a single source of truth. Two options:

- **Option A (Recommended):** Keep `settings.store.ts` (WS-3.3) as the canonical AI toggle location. `ai.store.ts` should read from `settings.store` for the `betaEnabled` value rather than maintaining its own. The `settings.store` is the user-facing preferences store; `ai.store` is the runtime AI state store (active request, disambiguation, drift).
- **Option B:** Keep `ai.store.ts` (WS-3.4) as the canonical toggle. WS-3.3 imports `betaEnabled` from `ai.store` instead of maintaining `aiCameraDirectorEnabled` in `settings.store`. This couples the command palette to the AI store.

### Conflict 3: Ollama Timeout Inconsistency (MEDIUM)

**WS-3.4** `OllamaProvider`: `OLLAMA_TIMEOUT_MS = 10_000` (10 seconds)
**WS-3.6** `ollama-client.ts`: `OLLAMA_TIMEOUT_MS = 30_000` (30 seconds)

Both are timeouts for Ollama inference calls. WS-3.4 uses a shorter timeout because the Camera Director has speculative drift that covers latency, while WS-3.6 uses a longer timeout because narration generation produces longer text and runs in the background.

**Impact:** If consolidated into a single client (Conflict 1 resolution), the timeout must be configurable per-call rather than per-client.

**Resolution:** The shared Ollama client should accept `timeoutMs` as a per-request parameter with a sensible default (e.g., 15s). Camera Director calls pass `10_000`; narration calls pass `30_000`.

### Conflict 4: Ollama Health Check Duplication (MEDIUM)

**WS-3.4** `OllamaProvider.healthCheck()` calls `ollama.list()` (SDK method) and checks for model availability.
**WS-3.6** `checkOllamaHealth()` calls `fetch(\`${OLLAMA_BASE_URL}/api/tags\`)` (raw HTTP) with a 3-second timeout.

Both check Ollama availability. WS-3.4 additionally validates that the required model (`llama3.2`) is installed.

**Impact:** Two independent health check mechanisms that may report different statuses if one succeeds and the other fails (e.g., network timing).

**Resolution:** Consolidate into a single `checkOllamaHealth()` function in the shared client that checks both server availability AND model availability. Surface the result in `ai.store.ollamaReady` for all consumers.

### Conflict 5: API Route Namespace Fragmentation (LOW)

Phase 3 introduces multiple API routes under different path patterns:

| Route                     | SOW    | Purpose                          |
| ------------------------- | ------ | -------------------------------- |
| `GET/POST /api/receipts`  | WS-3.1 | Receipt CRUD                     |
| `GET /api/receipts/[id]`  | WS-3.1 | Receipt by ID                    |
| `GET/POST /api/snapshots` | WS-3.1 | Snapshot CRUD                    |
| `POST /api/ai/chat`       | WS-3.4 | Ollama proxy for Camera Director |
| `POST /api/narrate`       | WS-3.6 | Ollama proxy for narration       |

WS-3.4 uses `/api/ai/chat` (namespaced under `/api/ai/`). WS-3.6 uses `/api/narrate` (flat under `/api/`). Both are Ollama proxy routes.

**Impact:** Inconsistent API namespace conventions. Low severity since these are internal Next.js Route Handlers, not public APIs.

**Resolution:** Namespace all AI routes under `/api/ai/`: rename WS-3.6's route to `POST /api/ai/narrate`. This groups all Ollama proxy routes under a single prefix, simplifying future rate-limiting or middleware.

### Conflict 6: WS-3.3 TarvaERP Port Collision (LOW -- NEW)

**WS-3.3** `command-registry.ts` assigns both `tarva-chat` and `tarva-erp` to `http://localhost:4000`:

```ts
const APP_URLS = {
  'agent-builder': 'http://localhost:3000',
  'tarva-chat': 'http://localhost:4000',
  'project-room': 'http://localhost:3005', // (inferred)
  'tarva-erp': 'http://localhost:4000', // COLLISION with tarva-chat
}
```

**Impact:** The "Open TarvaERP" command launches Tarva Chat instead of TarvaERP. Low severity since these are local dev server URLs and `window.open` behavior is the same regardless, but functionally incorrect.

**Resolution:** Update `tarva-erp` to `http://localhost:3010` per WS-2.5 (`ws-2.5-district-content-tarvacore-erp-tarvacode.md` line 36). Canonical port assignments: Agent Builder (3000), Project Room (3005), Tarva Chat (4000), TarvaERP (3010).

### Conflict 7: Type Location Pattern Continues to Diverge (MEDIUM -- RECURRING)

Phase 3 workstreams place types in various locations, continuing the unresolved pattern from Phase 1 Gap 1 and Phase 2 Conflict 2:

| SOW    | Type Files                                                     | Location                                                 |
| ------ | -------------------------------------------------------------- | -------------------------------------------------------- |
| WS-3.1 | `Database`, `LaunchReceiptRow`, `LaunchSnapshotRow`            | `src/lib/supabase/types.ts`                              |
| WS-3.1 | Receipt domain types                                           | `src/lib/interfaces/types.ts` (extending existing)       |
| WS-3.4 | AI store types                                                 | `src/stores/ai.store.ts` (co-located)                    |
| WS-3.5 | `TriggerEvaluationResult`, `ScoredTemplate`, `SelectionConfig` | `src/lib/ai/template-selection/types.ts` (feature-local) |
| WS-3.6 | `Narration`, `AppDelta`, `NarrationRequest`                    | `src/lib/ai/narration-types.ts` (feature-local)          |
| WS-3.7 | `AttentionState`, `PerformanceLevel`, `EffectConfig`           | `src/lib/ai/attention-types.ts` (feature-local)          |

This is actually less problematic than Phase 2 because all workstreams avoid `src/types/` and instead use either `src/lib/interfaces/types.ts` (shared domain types) or feature-local type files within their module directory. The Phase 1 D-IFACE-7 decision ("shared types in `src/lib/interfaces/types.ts`, NOT `src/types/`") is effectively respected.

**Resolution:** Codify the emerging pattern:

1. **Shared domain types** (consumed by 3+ workstreams): `src/lib/interfaces/types.ts`
2. **Feature-local types** (consumed by 1-2 workstreams): co-located with the feature module (e.g., `src/lib/ai/narration-types.ts`)
3. **Store types**: co-located with the store file
4. **Database types**: `src/lib/supabase/types.ts` (generated by Supabase CLI)

---

## 4. Gaps Identified

### Gap 1: No Shared AI Infrastructure Module (HIGH IMPACT)

**Impact:** Four AI workstreams (WS-3.4, WS-3.5, WS-3.6, WS-3.7) independently create AI infrastructure pieces without a shared foundation. Each workstream creates its own:

- Ollama client (WS-3.4: SDK, WS-3.6: fetch)
- Health check mechanism (WS-3.4: `ollama.list()`, WS-3.6: `fetch('/api/tags')`)
- Error handling pattern (WS-3.4: Zod validation, WS-3.6: try/catch with `console.warn`)
- Rate limiting (WS-3.6: 10 calls/min, WS-3.4: none)

**Recommendation:** Create a pre-execution task (WS-3.0) to establish `src/lib/ai/shared/`:

- `ollama-client.ts` -- single Ollama HTTP client with configurable timeouts, unified health check, rate limiter
- `ai-config.ts` -- shared constants (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_HEALTH_TIMEOUT_MS`)
- `ai-error.ts` -- shared error types (`OllamaUnavailableError`, `OllamaTimeoutError`, `OllamaModelMissingError`)

This is a 0.5-day task that prevents the conflicts listed in Section 3.

### Gap 2: No Testing Framework Still Unresolved (HIGH IMPACT -- RECURRING)

**Impact:** Phase 1 Gap 2 identified the lack of Vitest setup. Phase 2 inherited the debt. Phase 3 now adds:

- `SupabaseReceiptStore` with 6 methods that should be tested against mock Supabase responses
- `TriggerConditionEvaluator` with pure-function dot-path resolution and comparison operators (ideal unit test candidates)
- `TemplateScorer` with weighted scoring formula (pure function, trivially testable)
- `PatternMatcherProvider` with regex pattern matching (deterministic, testable)
- `computeRawAttentionState` and `applyHysteresis` (pure functions with well-defined state transitions)

Phase 3 adds approximately 15-20 pure functions and classes that are prime candidates for unit testing.

**Recommendation:** If Vitest is still not configured by Phase 3 execution, add it as a pre-execution task. The WS-3.5 `TriggerConditionEvaluator` and `TemplateScorer` are the strongest candidates for first tests because they are pure functions with no external dependencies.

### Gap 3: Receipt Schema Extensions Beyond WS-1.7 Interface (MEDIUM IMPACT)

**Impact:** WS-3.1's `launch_receipts` table includes columns (`target`, `tags`, `snapshot_id`) that are not part of the WS-1.7 `ReceiptStore` interface or `LaunchReceipt` type. The `ReceiptStore.record()` method accepts a `LaunchReceiptInput` type, but the Supabase implementation adds additional fields:

- `target` (JSONB) -- the `CameraDirective` target for navigation receipts
- `tags` (text[]) -- freeform tags for categorization
- `snapshot_id` (UUID FK) -- link to the `SystemSnapshot` captured at receipt time

These extensions are stored in the database but not exposed through the `ReceiptStore` interface contract from WS-1.7.

**Recommendation:** Extend the `LaunchReceiptInput` type in `src/lib/interfaces/types.ts` to include optional `target`, `tags`, and `snapshotId` fields. This keeps the interface in sync with the actual data model and allows consumers to set these fields when creating receipts.

### Gap 4: Evidence Ledger District Position Not Canonicalized (MEDIUM IMPACT)

**Impact:** WS-3.2 places the Evidence Ledger at NW world coordinates, and WS-3.3 hardcodes `{ offsetX: -400, offsetY: -400 }` as the navigation target. But neither workstream defines this as a shared constant. Phase 1 Gap 3 identified the same issue for app district positions.

**Recommendation:** Add the Evidence Ledger position to the shared `DISTRICT_POSITIONS` constant (or equivalent) in `src/lib/constants.ts`. The Evidence Ledger should be treated as a 7th district for navigation purposes, with its position importable by both WS-3.2 (rendering) and WS-3.3 (command palette navigation).

### Gap 5: `SystemSnapshot` Provider Not Wired to AI Consumers (MEDIUM IMPACT)

**Impact:** WS-3.4 (Camera Director), WS-3.5 (Template Selection), WS-3.6 (Narrated Telemetry), and WS-3.7 (Attention Choreography) all consume `SystemSnapshot` data, but none specify exactly how they obtain it. WS-3.4 references a `SpatialIndex` that compiles snapshot data; WS-3.5 receives `SystemSnapshot` as a parameter; WS-3.6 reads from `SystemStateProvider`; WS-3.7 reads from the Zustand districts store.

No SOW describes the wiring that passes the snapshot from the telemetry aggregator (WS-1.5) to these AI consumers in a consistent manner.

**Recommendation:** Define a `useSystemSnapshot()` hook (or confirm that `useTelemetry()` from WS-1.5 already serves this role) that all AI workstreams import. This hook should return the latest `SystemSnapshot` from the districts store, ensuring all AI features operate on the same data.

### Gap 6: Narration Cycle Orchestration Not Wired to App Lifecycle (LOW IMPACT)

**Impact:** WS-3.6 defines a 30-second narration cycle via `setInterval(narrationCycle, 30_000)` but does not specify where this interval is started and stopped. It should start when the hub page mounts and stop on unmount, but no SOW specifies the integration point in `(hub)/page.tsx` or `(hub)/layout.tsx`.

**Recommendation:** The narration cycle should be started in a `useEffect` in `(hub)/layout.tsx`, gated behind `settings.store.aiCameraDirectorEnabled` (same toggle as other AI features). Cleanup returns `clearInterval`. This co-locates all AI lifecycle management in the hub layout.

### Gap 7: Attention Choreography Modifies Phase 1/2 Component Props Without Specifying the Integration Pattern (LOW IMPACT)

**Impact:** WS-3.7 defines an `EffectConfig` with 16+ parameters that should be consumed by `ParticleField`, `HeartbeatPulse`, `GlowBreathing`, `GridPulse`, `FilmGrain`, `DistrictBeacon`, and morph timing config from Phases 1 and 2. But the existing Phase 1/2 components were not designed to accept these parameters as props -- they use hardcoded values from VISUAL-DESIGN-SPEC.md.

**Recommendation:** The integration pattern should be: `useAttentionStore` exposes `effectConfig` as a Zustand selector. Each ambient component reads its relevant subset of `effectConfig` via the selector. This requires minor modifications to Phase 1/2 components to accept dynamic values instead of hardcoded constants.

---

## 5. Dependency Graph

```
Phase 1 Outputs                    Phase 2 Outputs
  |                                  |
  | WS-1.7 ReceiptStore interface    | WS-2.6 StationPanel + useReceiptStamp()
  | WS-1.7 CameraController         | WS-2.1 MorphOrchestrator + ui.store morph actions
  | WS-1.7 AIRouter interface       | WS-2.7 ConstellationView global metrics
  | WS-1.7 StationTemplateRegistry  | WS-2.2-2.5 District content + Route Handlers
  | WS-1.7 CommandPalette interface  | WS-2.6 StationContext + bodyType slots
  | WS-1.5 Telemetry Aggregator     |
  | WS-1.1 SpatialViewport + Camera |
  | WS-1.4 CommandPaletteStub       |
  | WS-1.6 Ambient Effects Layer    |
  v                                  v

WS-3.1 (Receipt System)           WS-3.3 (Command Palette)
  [backend-engineer]                 [react-developer]
  [depends: WS-1.7 ReceiptStore     [depends: WS-1.4 stub, WS-1.7
   interface, Supabase setup]         CommandPalette interface,
  |                                   WS-1.7 StructuredCommandPalette]
  |                                  |
  v                                  |
WS-3.2 (Evidence Ledger)           |
  [react-developer]                  |
  [depends: WS-3.1 receipt store,    |   WS-3.4 (AI Camera Director)
   WS-1.1 CameraController,         |     [react-developer + backend-engineer]
   WS-1.7 types]                     |     [depends: WS-1.7 AIRouter,
  |                                  |      WS-1.7 CameraController,
  |                                  |      WS-3.3 "Ask AI..." integration,
  |                                  |      Ollama running at localhost:11434]
  |                                  |     |
  |                                  |     |
  |                                  v     v
  |                              Integration: Command Palette + AI Camera Director
  |                                  |
  |                                  |
  |     WS-3.5 (Station Template Selection)
  |       [react-developer]
  |       [depends: WS-1.7 StationTemplateRegistry,
  |        WS-2.6 StationPanel framework,
  |        WS-3.4 AIRouter (for tie-breaking)]
  |
  |     WS-3.6 (Narrated Telemetry)
  |       [backend-engineer + react-developer]
  |       [depends: WS-1.5 telemetry data,
  |        WS-1.7 SystemStateProvider,
  |        Ollama at localhost:11434]
  |
  |     WS-3.7 (Attention Choreography)
  |       [react-developer]
  |       [depends: WS-1.5 districts store,
  |        WS-1.6 ambient effects components,
  |        WS-2.1 morph timing config,
  |        WS-2.7 constellation view]
  |
  v
Phase 3 Complete
```

**Key dependency facts:**

- **WS-3.1 and WS-3.3 have NO cross-dependency** and can start in parallel on Day 1. WS-3.1 depends on Phase 1 outputs (WS-1.7 interface contract, Supabase setup). WS-3.3 depends on Phase 1 outputs (WS-1.4 stub, WS-1.7 `StructuredCommandPalette` class).
- **WS-3.2 depends on WS-3.1** (the Evidence Ledger displays receipts stored by the receipt system). It cannot begin until WS-3.1's `SupabaseReceiptStore` is at least partially functional.
- **WS-3.4 has a soft dependency on WS-3.3** for the "Ask AI..." integration point. WS-3.4 can build the AI Camera Director independently; WS-3.3 wires it via the `onAIQuery` prop.
- **WS-3.5 has a soft dependency on WS-3.4** for AI tie-breaking. The template selection system works fully without AI (rule-based scoring handles 95% of cases). AI tie-breaking via `AIRouter` is optional.
- **WS-3.6 is independent of all other Phase 3 workstreams.** It depends only on Phase 1 outputs (telemetry data, `SystemStateProvider`) and Ollama. It can run in parallel with any other workstream.
- **WS-3.7 is independent of all other Phase 3 workstreams.** It depends on Phase 1 (ambient effects) and Phase 2 (morph timing, constellation view) outputs. It modulates existing components and can ship independently.

**External dependencies (outside Phase 3):**

- Phase 1 deliverables: 6 interface contracts with Phase 1 implementations (WS-1.7), ZUI engine (WS-1.1), telemetry aggregator (WS-1.5), ambient effects (WS-1.6), keyboard shortcuts (WS-1.4)
- Phase 2 deliverables: morph choreography (WS-2.1), station panel framework (WS-2.6), constellation view (WS-2.7), district content (WS-2.2-2.5)
- Supabase project with `launch_receipts` and `launch_snapshots` tables provisioned
- Ollama running at `localhost:11434` with model `llama3.2` pulled
- `@tarva/ui` components: Button, Badge, CommandDialog, ScrollArea, Tooltip, Skeleton
- `cmdk` library (MIT license) for command palette
- `ollama` npm package (MIT license) for Ollama SDK (if Option A from Conflict 1 is chosen)
- `zod` library for Ollama response validation
- `lucide-react` for command palette and evidence ledger icons

---

## 6. Risk Assessment

### High-Impact Risks

| #     | Risk                                                                                                                                      | SOW                    | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                  |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-3.1 | **Ollama not available or model not pulled**: All AI features fail silently or visibly. User sees disabled AI toggle with no explanation. | WS-3.4, WS-3.5, WS-3.6 | High       | High   | WS-3.4 health check on store initialization sets `ai.store.ollamaReady`. Command palette shows "Ollama unavailable" when health check fails. WS-3.6 skips narration cycle. WS-3.5 falls back to rule-based scoring (no AI tie-breaking). Document `ollama pull llama3.2` in project README. |
| R-3.2 | **Supabase connection fails during receipt recording**: `SupabaseReceiptStore.record()` fails, receipts are lost.                         | WS-3.1                 | Medium     | High   | Offline queue persists to `localStorage` with retry. `flushOfflineQueue()` called periodically and on reconnection. Maximum queue size prevents unbounded growth. Console warnings logged for visibility.                                                                                   |
| R-3.3 | **Ollama response latency exceeds user tolerance (>10s)**: AI Camera Director feels unresponsive; narration cycle stalls.                 | WS-3.4, WS-3.6         | High       | Medium | WS-3.4 speculative camera drift (dampened spring: stiffness 60, damping 40) provides visual feedback during inference. WS-3.6 narration runs in background (not user-initiated). Per-request timeouts (10s Camera Director, 30s narration) prevent indefinite hangs.                        |
| R-3.4 | **Dual Ollama client conflict (Conflict 1)**: Two implementations diverge in behavior, causing inconsistent AI experiences.               | WS-3.4, WS-3.6         | High       | Medium | Resolve Conflict 1 during pre-execution. Consolidate into single shared client before implementation begins.                                                                                                                                                                                |

### Medium-Impact Risks

| #      | Risk                                                                                                                                                                        | SOW            | Likelihood | Impact | Mitigation                                                                                                                                                                                            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-3.5  | **Supabase schema migration fails or conflicts**: `launch_receipts` table creation fails due to existing schema, missing extensions, or RLS policy errors.                  | WS-3.1         | Medium     | Medium | Run migration in staging first. Use `IF NOT EXISTS` guards. Test RLS policies with both `anon` and `service_role` keys.                                                                               |
| R-3.6  | **Receipt volume exceeds expectations**: More than 5-15 receipts per session due to AI-generated receipts at high cadence.                                                  | WS-3.1, WS-3.2 | Medium     | Medium | WS-3.2 `useReceiptTimeline` uses TanStack Query with pagination (20 items per page). WS-3.1 query includes `limit` parameter. Periodic snapshot cleanup can be added post-Phase 3.                    |
| R-3.7  | **`cmdk` built-in search conflicts with `StructuredCommandPalette` synonym matching**: Double-filtering causes empty results.                                               | WS-3.3         | Medium     | High   | WS-3.3 explicitly specifies custom `filter` prop returning 1 to disable cmdk search. This is a documented cmdk pattern. Verify during implementation.                                                 |
| R-3.8  | **Attention choreography FPS measurement causes its own performance drop**: `usePerformanceMonitor` sampling rAF timestamps adds overhead.                                  | WS-3.7         | Low        | Medium | Sample every 60 frames (1s at 60fps), not every frame. Use `performance.now()` which has negligible overhead. Store 5-frame rolling average, not full history.                                        |
| R-3.9  | **`@tarva/ui` `CommandDialog` does not expose `dialogContentClassName` prop**: Glass styling cannot be applied to the command palette.                                      | WS-3.3         | Medium     | Medium | Three fallback approaches specified in WS-3.3 R-1: (1) CSS `data-slot` selectors, (2) Tailwind arbitrary variant targeting `[role="dialog"]`, (3) local fork of CommandDialog. Option 1 is preferred. |
| R-3.10 | **Pattern matcher resolves wrong district for ambiguous queries**: "show status" without app name matches the first alphabetical district instead of the most relevant one. | WS-3.4         | Medium     | Medium | Disambiguation strip activates when confidence spread < 0.2. User selects from ranked options. Pattern matcher returns `confidence` score enabling disambiguation logic.                              |

### Low-Impact Risks

| #      | Risk                                                                                                                                                                                               | SOW    | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-3.11 | **UUID v7 polyfill not available in all environments**: `uuid-v7.ts` custom implementation may have edge cases.                                                                                    | WS-3.1 | Low        | Low    | UUID v7 is used for receipt IDs only. Collision probability is negligible for single-user localhost tool. Fallback to `crypto.randomUUID()` if implementation issues arise.                                                                                                 |
| R-3.12 | **Narration text quality is low or irrelevant**: Ollama generates generic or unhelpful narrations.                                                                                                 | WS-3.6 | Medium     | Low    | Detailed system prompts (`BATCH_SYSTEM_PROMPT`, `DEEP_DIVE_SYSTEM_PROMPT`) constrain output format. Three-part structure (what changed / why it matters / what to do next) enforces actionability. Narrations are cached -- poor-quality narrations replaced on next cycle. |
| R-3.13 | **Evidence Ledger rehydration navigates to stale position**: The viewport position stored in the receipt may no longer correspond to the expected visual state if districts have been reorganized. | WS-3.2 | Low        | Low    | Rehydration is best-effort. If the target no longer exists, `CameraController.navigate()` flies to the closest valid position. MetricComparison overlay shows "Then vs Now" differences.                                                                                    |

---

## 7. Effort and Sequencing

### Effort Estimates

| Workstream                        | Files                   | AC Count | Realistic Estimate | Agent                              | Assessment                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | ----------------------- | -------- | ------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WS-3.1 Receipt System             | 12 files (create)       | 22       | 1.5-2 weeks        | backend-engineer                   | **Tight but achievable.** Supabase schema migration (2 tables, RLS policies, GIN indexes), `SupabaseReceiptStore` class (6 methods), offline queue, snapshot store, API routes (receipts + snapshots), UUID v7 utility, Supabase client singleton. The Supabase schema is the most complex deliverable; the store implementation follows the WS-1.7 interface contract directly.           |
| WS-3.2 Evidence Ledger            | 11 files (create)       | 24       | 1.5-2 weeks        | react-developer                    | **Tight.** New district with Z2/Z3 representations, `FacetedFilter` with 4 facet groups, `TimelineItem` with expandable detail, `ReceiptDetailPanel` showing all 12 fields, `MetricComparison` overlay, rehydration system (`CameraController.navigate()` + highlight pulse + snapshot comparison), extensive CSS. The rehydration flow is the main engineering challenge.                 |
| WS-3.3 Command Palette            | 6 files (create/delete) | 22       | 1-1.5 weeks        | react-developer                    | **Achievable.** Replaces stub with production component. `settings.store`, `command-registry`, `useCommandPalette` hook, `CommandPalette.tsx`. Well-specified from WS-1.7 interface contract. 24 structured commands are pre-defined. Integration with `cmdk` is straightforward.                                                                                                          |
| WS-3.4 AI Camera Director         | 10 files (create)       | 25       | 1.5-2 weeks        | react-developer + backend-engineer | **Most complex AI workstream.** Three-layer intelligence model, `OllamaProvider` class, `PatternMatcherProvider` with regex patterns, `SpatialIndex` context assembly, `ContextAssembler` prompt engineering, `CameraDirectiveSchema` Zod validation, speculative camera drift, disambiguation strip, AI receipt generation. Ollama integration and prompt engineering are the main risks. |
| WS-3.5 Station Template Selection | 7 files (create)        | 20       | 1-1.5 weeks        | react-developer                    | **Achievable.** `TriggerConditionEvaluator` (pure function), `TemplateScorer` (pure function), `TemplateSelector` (orchestrator), `TemplateBrowser` (override UI). Rule-based scoring is deterministic and testable. AI tie-breaking is optional. Safety contract: AI selects from pre-built templates, never generates React.                                                             |
| WS-3.6 Narrated Telemetry         | 8 files (create)        | 26       | 1-1.5 weeks        | backend-engineer                   | **Achievable.** Ollama client (or shared client), narration prompts, narration cycle orchestrator, narration store, Route Handler, delta computation. Background process with no user-initiated latency. Rate limiter (10 calls/min) is straightforward.                                                                                                                                   |
| WS-3.7 Attention Choreography     | 6 files (create)        | 22       | 0.5-1 week         | react-developer                    | **Achievable.** Rule-based computation (pure functions), modulation matrix (config object), attention store, `useAttentionChoreography` hook, `usePerformanceMonitor` hook, next-best-actions HUD. No Ollama dependency. Modulates existing components rather than creating new visual effects.                                                                                            |

**Total acceptance criteria: 161** across 7 workstreams (per PHASE-3-REVIEW.md audit).
**Total estimated files: ~58** new files + 1 delete (`CommandPaletteStub.tsx`).

### Execution Order

```
Pre-Execution (Day 0):
  - Resolve Conflict 1 (Ollama client consolidation)
  - Resolve Conflict 2 (AI beta toggle consolidation)
  - Create shared AI infrastructure module (Gap 1)
  - Provision Supabase tables (WS-3.1 migrations)
  - Verify Ollama is running with llama3.2 model pulled
  - Configure Vitest if still not done (Gap 2)

Week 1:    WS-3.1 (backend-engineer)     -- Receipt System [starts Day 1]
           WS-3.3 (react-developer)      -- Command Palette [starts Day 1, no WS-3.1 dep]
           WS-3.7 (react-developer)      -- Attention Choreography [starts Day 1, no AI dep]

Week 2:    WS-3.1 (backend-engineer)     -- Receipt System completes
           WS-3.3 (react-developer)      -- Command Palette completes
           WS-3.4 (react-dev + backend)  -- AI Camera Director starts [after shared AI infra]
           WS-3.6 (backend-engineer)     -- Narrated Telemetry starts [after shared AI infra]

Week 3:    WS-3.2 (react-developer)      -- Evidence Ledger [after WS-3.1]
           WS-3.4 (react-dev + backend)  -- AI Camera Director continues
           WS-3.6 (backend-engineer)     -- Narrated Telemetry completes

Week 4:    WS-3.2 (react-developer)      -- Evidence Ledger completes
           WS-3.4 (react-developer)      -- AI Camera Director completes
           WS-3.5 (react-developer)      -- Station Template Selection [after WS-3.4 AIRouter]

Week 5:    WS-3.5 (react-developer)      -- Station Template Selection completes
           Integration: Command Palette + AI Camera Director wiring
           Integration: Attention Choreography + ambient effects wiring
           Cross-workstream composition testing
```

### Resource Loading

| Agent              | WS-3.1   | WS-3.2   | WS-3.3   | WS-3.4            | WS-3.5   | WS-3.6   | WS-3.7   | Total Load                 |
| ------------------ | -------- | -------- | -------- | ----------------- | -------- | -------- | -------- | -------------------------- |
| `react-developer`  | --       | 1.5-2 wk | 1-1.5 wk | 1-1.5 wk (shared) | 1-1.5 wk | --       | 0.5-1 wk | **4.5-6.5 weeks (serial)** |
| `backend-engineer` | 1.5-2 wk | --       | --       | 0.5 wk (shared)   | --       | 1-1.5 wk | --       | **3-4 weeks (serial)**     |

### Critical Path

```
Day 1 -----> WS-3.1 (1.5-2wk) -----> WS-3.2 (1.5-2wk) -----> [Evidence Ledger complete]
Day 1 -----> WS-3.3 (1-1.5wk) -----> WS-3.4 (1.5-2wk) -----> WS-3.5 (1-1.5wk) -----> [AI features complete]
Day 1 -----> WS-3.7 (0.5-1wk) -----> [off critical path]
Day 1 -----> WS-3.6 (1-1.5wk) -----> [off critical path]

Critical path: WS-3.3 (1.5wk) -> WS-3.4 (2wk) -> WS-3.5 (1.5wk) + integration buffer (0.5wk) = 5.5 weeks
Alternative critical path: WS-3.1 (2wk) -> WS-3.2 (2wk) + integration buffer (0.5wk) = 4.5 weeks
```

**The 4-5 week estimate from combined-recommendations.md is achievable** with the following conditions:

1. WS-3.1 and WS-3.3 start Day 1 in parallel (different agents, no cross-dependency)
2. WS-3.7 ships within Week 1 (smallest scope, no AI dependency, no WS-3.1 dependency)
3. WS-3.6 starts after shared AI infrastructure is established (end of Week 1)
4. WS-3.4 starts after WS-3.3 completes (or in parallel if the react-developer time-slices)
5. Conflict 1 (Ollama client) and Conflict 2 (AI beta toggle) are resolved during pre-execution Day 0
6. At least 3 working days are reserved for integration testing and cross-workstream composition

### Bottleneck Risks

| Risk                                                                 | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **react-developer overloaded** (5 of 7 workstreams)                  | High       | High   | WS-3.7 is smallest (0.5-1 wk), ships first. WS-3.3 is well-specified from WS-1.7 contract. WS-3.5 is deterministic rule engine (testable pure functions). Time-box each workstream. Consider splitting WS-3.2 to ui-designer if react-developer falls behind. |
| **Shared AI infrastructure not established before WS-3.4/3.6 start** | Medium     | High   | Resolve Conflict 1 and Gap 1 during pre-execution Day 0. A 0.5-day investment prevents 2+ days of rework.                                                                                                                                                     |
| **Supabase tables not provisioned when WS-3.1 begins**               | Medium     | Medium | Run migration scripts before WS-3.1 execution. Verify with `SELECT * FROM launch_receipts LIMIT 0` and `SELECT * FROM launch_snapshots LIMIT 0`.                                                                                                              |
| **Ollama model not pulled when WS-3.4/3.6 begin**                    | Medium     | Medium | Add `ollama pull llama3.2` to project setup instructions. Health check on startup surfaces the error clearly.                                                                                                                                                 |

---

## 8. Open Questions Consolidated

### Blocking (must resolve before execution)

| ID       | Question                                                                                                                                                      | SOW            | Impact                                                                                                                         | Recommended Owner               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| OQ-3.0.1 | **Ollama client consolidation**: Should Phase 3 use the `ollama` npm package (WS-3.4) or native `fetch` (WS-3.6) as the single Ollama client? See Conflict 1. | WS-3.4, WS-3.6 | Blocks all AI workstream implementation. Determines dependency footprint and error handling patterns.                          | chief-technology-architect      |
| OQ-3.0.2 | **AI beta toggle location**: Should the canonical AI-enabled toggle live in `settings.store.ts` (WS-3.3) or `ai.store.ts` (WS-3.4)? See Conflict 2.           | WS-3.3, WS-3.4 | Blocks settings architecture. Two localStorage keys for one concept is a split-brain risk.                                     | chief-technology-architect      |
| OQ-3.0.3 | **Supabase project setup**: Are the Supabase project URL and anon key available? Has the `launch_receipts` table been provisioned?                            | WS-3.1         | Blocks all receipt functionality. Without Supabase, WS-3.1 cannot function (unlike Phase 2 which used `InMemoryReceiptStore`). | Project Lead / backend-engineer |

### Should Resolve Before Execution

| ID       | Question                                                                                                                                                                                   | SOW            | Impact                                                                                                                 | Recommended Owner                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| OQ-3.1.1 | Should `LaunchReceiptInput` in WS-1.7's `src/lib/interfaces/types.ts` be extended with `target`, `tags`, and `snapshotId` fields to match WS-3.1's Supabase schema? See Gap 3.             | WS-3.1         | Affects type contract between receipt producers and the store. Without extension, extra fields require `as any` casts. | react-developer / chief-technology-architect |
| OQ-3.2.1 | What is the canonical world position of the Evidence Ledger district? WS-3.3 hardcodes `(-400, -400)` as a navigation target. See Gap 4.                                                   | WS-3.2, WS-3.3 | Affects Evidence Ledger rendering position and command palette navigation accuracy.                                    | WS-3.2 owner / react-developer               |
| OQ-3.4.1 | Should the Camera Director's Ollama proxy route be at `/api/ai/chat` (WS-3.4) while the narration route is at `/api/narrate` (WS-3.6), or should both be under `/api/ai/`? See Conflict 5. | WS-3.4, WS-3.6 | Low impact but affects API namespace consistency for future AI routes (Phase 4 Claude integration).                    | backend-engineer                             |

### Can Resolve During Execution

| ID       | Question                                                                                                                                              | SOW            | Impact                                                                                                         | Resolved By        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- | ------------------ |
| OQ-3.3.1 | Should the `CommandDialog` support a custom `dialogContentClassName` prop, or should glass styling be applied via a wrapper?                          | WS-3.3         | Low -- implementation detail. Wrapper approach works if prop is unavailable.                                   | WS-3.3 execution   |
| OQ-3.3.2 | Should "Open {app}" commands only appear for apps whose health status is OPERATIONAL or DEGRADED?                                                     | WS-3.3         | Low -- showing all "Open" commands is simpler.                                                                 | WS-3.3 execution   |
| OQ-3.3.6 | When the AI Camera Director is integrated, should the palette show a loading state during AI processing, or close immediately with speculative drift? | WS-3.3, WS-3.4 | Medium -- affects UX during 3-10s Ollama inference. WS-3.4 designs for immediate close with speculative drift. | WS-3.4 integration |
| OQ-3.4.2 | Should the Camera Director support multi-target navigation (e.g., "compare Agent Builder and Tarva Chat")?                                            | WS-3.4         | Low -- single-target is sufficient for Phase 3. Multi-target is a Phase 4+ enhancement.                        | Deferred           |
| OQ-3.5.1 | Should the `TemplateBrowser` manual override UI be a modal dialog or an inline panel within the district shell?                                       | WS-3.5         | Low -- either approach works. Inline is recommended for spatial consistency.                                   | WS-3.5 execution   |
| OQ-3.6.1 | Should narrations persist to Supabase or remain in-memory only?                                                                                       | WS-3.6         | Low -- WS-3.6 specifies in-memory cache only. Supabase persistence is a future enhancement.                    | WS-3.6 execution   |
| OQ-3.7.1 | Should the next-best-actions HUD chips be clickable (triggering navigation) or informational only?                                                    | WS-3.7         | Medium -- clickable chips add convenience but require wiring to `CameraController.navigate()`.                 | WS-3.7 execution   |

---

## 9. Exit Criteria

| #       | Criterion                                                                                                                                                                                                                                                                                                                                                                                                      | Met?    | Evidence                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------- |
| EC-3.1  | **Receipt system functional**: `SupabaseReceiptStore.record()` persists receipts to `launch_receipts` table with UUID v7 IDs. `query()`, `getById()`, `getByCorrelation()`, `count()` return correct results. Offline queue holds failed inserts and flushes on retry.                                                                                                                                         | Pending | WS-3.1 AC (functional criteria), `curl` verification of `/api/receipts` endpoints |
| EC-3.2  | **System snapshots stored**: `SystemSnapshotStore.store()` persists to `launch_snapshots` table. Periodic snapshots captured every 30s. Receipt-linked snapshots created automatically.                                                                                                                                                                                                                        | Pending | WS-3.1 AC (snapshot criteria), database query verification                        |
| EC-3.3  | **Evidence Ledger renders at Z2 and Z3**: Z2 shows `TimelineStrip` with activity density bar. Z3 shows `TimelinePanel` with `FacetedFilter` (4 facet groups), `TimelineItem` list with expandable detail, and receipt count.                                                                                                                                                                                   | Pending | WS-3.2 AC (rendering criteria), visual inspection                                 |
| EC-3.4  | **Receipt rehydration works**: Clicking "Rehydrate" on a receipt navigates the viewport to the stored position, highlights the target element with a pulse animation, and shows a `MetricComparison` overlay comparing "Then vs Now" system state.                                                                                                                                                             | Pending | WS-3.2 AC (rehydration criteria), end-to-end test                                 |
| EC-3.5  | **Command palette functional**: `Cmd+K` opens palette with strong glass styling. 24 structured commands in 3 categories (Navigation, View, Actions). Synonym matching resolves aliases (e.g., "AB" -> "Go to Agent Builder"). "Ask AI..." option visible with Beta badge when AI is enabled, disabled with "Enable in Settings" text when off. Every command execution generates a receipt.                    | Pending | WS-3.3 AC-1 through AC-28                                                         |
| EC-3.6  | **AI Camera Director responds to natural language**: Pattern matcher handles structured queries instantly (<1ms). Ollama handles open-ended queries (3-10s with speculative drift). Disambiguation strip appears for ambiguous results. AI-generated camera navigation produces receipts with `aiMetadata`.                                                                                                    | Pending | WS-3.4 AC (functional criteria)                                                   |
| EC-3.7  | **Station template selection dynamic**: `DynamicStationTemplateRegistry` evaluates trigger conditions against `SystemSnapshot`, scores templates with weighted formula, selects top-N per district. Manual override via `TemplateBrowser` with pin/unpin. AI tie-breaking optional but functional when available.                                                                                              | Pending | WS-3.5 AC (selection criteria)                                                    |
| EC-3.8  | **Narrated telemetry generates**: Background 30s narration cycle produces three-part narrations (what changed / why it matters / what to do next) for apps with meaningful delta. Narrations cached in-memory. Graceful degradation when Ollama is unavailable.                                                                                                                                                | Pending | WS-3.6 AC (narration criteria)                                                    |
| EC-3.9  | **Attention choreography modulates ambient effects**: Two attention modes (`calm`/`tighten`) correctly computed from system state. Three performance levels (`full`/`reduced`/`minimal`) measured from FPS. `EffectConfig` applied to Phase 1/2 components. Hysteresis prevents mode flicker (3 consecutive calm snapshots before exit tighten). Next-best-actions HUD shows max 3 chips during tighten state. | Pending | WS-3.7 AC (modulation criteria)                                                   |
| EC-3.10 | **AI graceful degradation**: With Ollama stopped, AI Camera Director falls back to pattern matching only. Station template selection falls back to rule-based scoring. Narration cycle silently skips. Attention choreography operates normally (no Ollama dependency). Command palette shows disabled AI item. No errors thrown, no broken UI.                                                                | Pending | All AI SOW acceptance criteria for degradation                                    |
| EC-3.11 | **Performance targets met**: Evidence Ledger Z2->Z3 zoom transition sustains >= 55 avg FPS. Command palette open/close has no visible jank. AI speculative drift animation is smooth. Attention choreography mode transitions are imperceptible (no flicker). Narration cycle does not block main thread.                                                                                                      | Pending | Chrome DevTools Performance trace                                                 |
| EC-3.12 | **`prefers-reduced-motion` compliance**: Receipt stamp animations, Evidence Ledger transitions, command palette animations, speculative camera drift, attention mode transitions all disabled when reduced motion is active. Functional behavior unchanged.                                                                                                                                                    | Pending | WS-3.3 AC-22, WS-3.7 reduced-motion modulation cell                               |
| EC-3.13 | **Zero TypeScript errors**: `pnpm typecheck` passes with zero errors across all Phase 3 files. No `any` types, no `@ts-ignore`.                                                                                                                                                                                                                                                                                | Pending | `pnpm typecheck`                                                                  |
| EC-3.14 | **All blocking open questions resolved** (OQ-3.0.1 through OQ-3.0.3 at minimum)                                                                                                                                                                                                                                                                                                                                | Pending | Pre-execution resolution confirmed                                                |
| EC-3.15 | **All cross-workstream conflicts resolved** (Conflicts 1-2 at minimum, Conflicts 3-5 recommended)                                                                                                                                                                                                                                                                                                              | Pending | Pre-execution or early-execution resolution confirmed                             |

**Phase 3 is COMPLETE when:** EC-3.1 through EC-3.13 are all met, AND EC-3.14 and EC-3.15 confirm structural consistency. The most likely iteration points are EC-3.6 (AI Camera Director prompt engineering may require tuning) and EC-3.10 (graceful degradation edge cases when Ollama starts/stops during a session).

---

## 10. Appendices

### Appendix A: Risk Register (Consolidated from All SOWs)

| ID     | Risk                                               | SOW                    | Likelihood | Impact | Mitigation                                                                       |
| ------ | -------------------------------------------------- | ---------------------- | ---------- | ------ | -------------------------------------------------------------------------------- |
| R-3.1  | Ollama unavailable or model not pulled             | WS-3.4, WS-3.5, WS-3.6 | High       | High   | Health check on init; clear error messaging; all AI features degrade gracefully  |
| R-3.2  | Supabase connection fails during receipt recording | WS-3.1                 | Medium     | High   | Offline queue with localStorage persistence and retry                            |
| R-3.3  | Ollama response latency >10s                       | WS-3.4, WS-3.6         | High       | Medium | Speculative drift (WS-3.4); background processing (WS-3.6); per-request timeouts |
| R-3.4  | Dual Ollama client conflict                        | WS-3.4, WS-3.6         | High       | Medium | Pre-execution consolidation (Conflict 1 resolution)                              |
| R-3.5  | Supabase schema migration failure                  | WS-3.1                 | Medium     | Medium | `IF NOT EXISTS` guards; staging test first                                       |
| R-3.6  | Receipt volume exceeds expectations                | WS-3.1, WS-3.2         | Medium     | Medium | Pagination in Evidence Ledger; `limit` in queries                                |
| R-3.7  | cmdk search conflicts with synonym matching        | WS-3.3                 | Medium     | High   | Custom `filter` prop returning 1; documented cmdk pattern                        |
| R-3.8  | Performance monitor overhead                       | WS-3.7                 | Low        | Medium | Sample every 60 frames; rolling average                                          |
| R-3.9  | CommandDialog styling limitations                  | WS-3.3                 | Medium     | Medium | Three fallback approaches documented                                             |
| R-3.10 | Pattern matcher wrong district                     | WS-3.4                 | Medium     | Medium | Disambiguation strip for low-confidence results                                  |
| R-3.11 | UUID v7 polyfill edge cases                        | WS-3.1                 | Low        | Low    | Fallback to `crypto.randomUUID()`                                                |
| R-3.12 | Narration text quality low                         | WS-3.6                 | Medium     | Low    | Detailed system prompts; three-part structure constraint                         |
| R-3.13 | Rehydration navigates to stale position            | WS-3.2                 | Low        | Low    | Best-effort navigation; MetricComparison shows differences                       |

### Appendix B: Acceptance Criteria Summary

| SOW                               | # Criteria | Key Verification Methods                                                                                                                                                                   |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WS-3.1 Receipt System             | 22         | Database query verification, `curl` API tests, offline queue simulation, `pnpm typecheck`                                                                                                  |
| WS-3.2 Evidence Ledger            | 24         | Visual inspection (Z2/Z3 transitions), faceted filter interaction, rehydration end-to-end, MetricComparison overlay, CSS inspection                                                        |
| WS-3.3 Command Palette            | 22         | Keyboard shortcut tests, synonym matching verification (AB, agentgen, core, reasoning, receipts), AI gate toggling, receipt generation verification, reduced-motion test, `pnpm typecheck` |
| WS-3.4 AI Camera Director         | 25         | Pattern matcher unit tests, Ollama integration test (with running Ollama), speculative drift visual inspection, disambiguation strip interaction, AI receipt verification                  |
| WS-3.5 Station Template Selection | 20         | Trigger evaluator unit tests, scorer formula verification, tie-detection threshold test, AI tie-breaker integration, TemplateBrowser override test                                         |
| WS-3.6 Narrated Telemetry         | 26         | Narration cycle timing verification, delta computation accuracy, Ollama integration test, rate limit verification, graceful degradation test                                               |
| WS-3.7 Attention Choreography     | 22         | Attention state computation, hysteresis transition (3-count calm exit), performance level measurement, modulation matrix application, next-best-actions display                            |
| **Total**                         | **161**    |                                                                                                                                                                                            |

### Appendix C: File Manifest (All Workstreams)

| File                                                      | WS  | Action | Description                                                             |
| --------------------------------------------------------- | --- | ------ | ----------------------------------------------------------------------- |
| `supabase/migrations/001_launch_receipts.sql`             | 3.1 | Create | Receipt table schema with RLS, indexes, trigger function                |
| `supabase/migrations/002_launch_snapshots.sql`            | 3.1 | Create | Snapshot table schema with RLS, indexes                                 |
| `src/lib/supabase/client.ts`                              | 3.1 | Create | Supabase client singletons (browser + server)                           |
| `src/lib/supabase/types.ts`                               | 3.1 | Create | Database types (generated or manual)                                    |
| `src/lib/receipt-store/uuid-v7.ts`                        | 3.1 | Create | UUID v7 generation utility                                              |
| `src/lib/receipt-store/offline-queue.ts`                  | 3.1 | Create | Offline receipt queue with localStorage persistence                     |
| `src/lib/receipt-store/supabase-receipt-store.ts`         | 3.1 | Create | `SupabaseReceiptStore` class implementing `ReceiptStore`                |
| `src/lib/receipt-store/snapshot-store.ts`                 | 3.1 | Create | `SystemSnapshotStore` class for snapshot persistence                    |
| `src/app/api/receipts/route.ts`                           | 3.1 | Create | GET/POST route handler for receipts                                     |
| `src/app/api/receipts/[id]/route.ts`                      | 3.1 | Create | GET route handler for receipt by ID                                     |
| `src/app/api/snapshots/route.ts`                          | 3.1 | Create | GET/POST route handler for snapshots                                    |
| `src/components/evidence-ledger/evidence-ledger.css`      | 3.2 | Create | All Evidence Ledger styles (timeline, facets, detail, rehydration)      |
| `src/components/evidence-ledger/timeline-strip.tsx`       | 3.2 | Create | Z2 compressed density bar                                               |
| `src/components/evidence-ledger/timeline-panel.tsx`       | 3.2 | Create | Z3 full interactive panel with facets + items                           |
| `src/components/evidence-ledger/faceted-filter.tsx`       | 3.2 | Create | 4-group facet filter (Source, Type, Severity, Time)                     |
| `src/components/evidence-ledger/facet-chip.tsx`           | 3.2 | Create | Individual toggle chip for facet values                                 |
| `src/components/evidence-ledger/timeline-item.tsx`        | 3.2 | Create | Expandable receipt item with severity/actor indicators                  |
| `src/components/evidence-ledger/receipt-detail-panel.tsx` | 3.2 | Create | Full 12-field receipt detail view                                       |
| `src/components/evidence-ledger/metric-comparison.tsx`    | 3.2 | Create | "Then vs Now" overlay with 5 delta rows                                 |
| `src/hooks/useReceiptTimeline.ts`                         | 3.2 | Create | TanStack Query hook for paginated receipt timeline                      |
| `src/hooks/useFacetedFilter.ts`                           | 3.2 | Create | Facet state management hook                                             |
| `src/hooks/useRehydration.ts`                             | 3.2 | Create | Camera navigation + highlight + comparison orchestration                |
| `src/stores/settings.store.ts`                            | 3.3 | Create | AI beta toggle with localStorage persistence                            |
| `src/lib/command-registry.ts`                             | 3.3 | Create | Factory for 24 structured commands (navigation/view/action)             |
| `src/hooks/useCommandPalette.ts`                          | 3.3 | Create | Orchestration hook bridging execution engine to UI                      |
| `src/components/spatial/CommandPalette.tsx`               | 3.3 | Create | Full cmdk-based command palette component                               |
| `src/components/spatial/CommandPaletteStub.tsx`           | 3.3 | Delete | Replaced by CommandPalette.tsx                                          |
| `src/stores/ai.store.ts`                                  | 3.4 | Create | AI runtime state (request, drift, disambiguation, provider status)      |
| `src/lib/ai/ollama-provider.ts`                           | 3.4 | Create | Ollama SDK client with health check and chat methods                    |
| `src/lib/ai/pattern-matcher-provider.ts`                  | 3.4 | Create | Regex-based intent pattern matching                                     |
| `src/lib/ai/spatial-index.ts`                             | 3.4 | Create | System state context assembly for LLM prompts                           |
| `src/lib/ai/context-assembler.ts`                         | 3.4 | Create | Prompt construction (system + user messages)                            |
| `src/lib/ai/camera-directive-schema.ts`                   | 3.4 | Create | Zod schema for Ollama response validation                               |
| `src/lib/ai/ai-router-impl.ts`                            | 3.4 | Create | Real `AIRouter` implementation (replaces `StubAIRouter`)                |
| `src/components/spatial/DisambiguationStrip.tsx`          | 3.4 | Create | Ranked options strip for ambiguous AI results                           |
| `src/components/spatial/SpeculativeDrift.tsx`             | 3.4 | Create | Dampened spring camera drift during inference                           |
| `src/app/api/ai/chat/route.ts`                            | 3.4 | Create | Ollama proxy route handler                                              |
| `src/lib/ai/template-selection/trigger-evaluator.ts`      | 3.5 | Create | Dot-path condition evaluation against SystemSnapshot                    |
| `src/lib/ai/template-selection/template-scorer.ts`        | 3.5 | Create | Weighted activation scoring formula                                     |
| `src/lib/ai/template-selection/template-selector.ts`      | 3.5 | Create | Top-N selection with tie detection + AI tie-breaking                    |
| `src/lib/ai/template-selection/types.ts`                  | 3.5 | Create | Selection types (ScoredTemplate, SelectionConfig, etc.)                 |
| `src/lib/ai/template-selection/dynamic-registry.ts`       | 3.5 | Create | `DynamicStationTemplateRegistry` implementation                         |
| `src/components/stations/template-browser.tsx`            | 3.5 | Create | Manual override UI with pin/unpin                                       |
| `src/hooks/useTemplateSelection.ts`                       | 3.5 | Create | Hook wiring template selection to district rendering                    |
| `src/lib/ai/ollama-client.ts`                             | 3.6 | Create | Shared Ollama HTTP client (or integrated into shared module)            |
| `src/lib/ai/narration-prompts.ts`                         | 3.6 | Create | Batch and deep-dive system prompts                                      |
| `src/lib/ai/narration-types.ts`                           | 3.6 | Create | Narration, AppDelta, NarrationRequest, NarrationResult types            |
| `src/lib/ai/narration-cycle.ts`                           | 3.6 | Create | 30-second background narration orchestrator                             |
| `src/stores/narration.store.ts`                           | 3.6 | Create | In-memory narration cache store                                         |
| `src/app/api/narrate/route.ts`                            | 3.6 | Create | Ollama proxy route handler for narration                                |
| `src/hooks/useNarration.ts`                               | 3.6 | Create | Hook for accessing narrations per app                                   |
| `src/lib/ai/attention-rules.ts`                           | 3.7 | Create | `computeRawAttentionState`, `applyHysteresis`, `computeNextBestActions` |
| `src/lib/ai/attention-types.ts`                           | 3.7 | Create | AttentionState, PerformanceLevel, EffectConfig, NextBestAction types    |
| `src/lib/ai/effect-modulation.ts`                         | 3.7 | Create | BASELINE values + MODULATION_MATRIX (6-cell config)                     |
| `src/stores/attention.store.ts`                           | 3.7 | Create | Attention state, performance level, effect config store                 |
| `src/hooks/useAttentionChoreography.ts`                   | 3.7 | Create | Orchestration hook (reads snapshot, computes state, writes store)       |
| `src/hooks/usePerformanceMonitor.ts`                      | 3.7 | Create | FPS measurement via rAF timestamp sampling                              |
| `src/components/spatial/NextBestActionsHUD.tsx`           | 3.7 | Create | Max-3 action chips during tighten state                                 |

**Total new files: ~58** (create) + **1** (delete: `CommandPaletteStub.tsx`) + modifications to `(hub)/page.tsx` or `(hub)/layout.tsx`.

### Appendix D: Architecture Decisions (Phase 3)

| ID          | Decision                                                                             | Rationale                                                                                                                                                                                                                                              | Source                                            |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| D-RECEIPT-1 | UUID v7 for receipt IDs (not UUID v4)                                                | UUID v7 embeds a timestamp prefix, enabling time-ordered sorting without a separate index on `timestamp`. Aligns with receipt chronological ordering requirement.                                                                                      | WS-3.1, WS-1.7 D-2 upgrade path                   |
| D-RECEIPT-2 | Offline queue uses `localStorage` (not IndexedDB)                                    | Receipts are small JSON objects (<1KB each). `localStorage` is synchronous, simpler, and sufficient for the expected queue size (<100 items). IndexedDB would be over-engineered for this use case.                                                    | WS-3.1                                            |
| D-RECEIPT-3 | `service_role` RLS policy (not `anon`)                                               | Receipt writes happen from Route Handlers (server-side), not client-side. `service_role` bypasses RLS for server writes. Client reads could use `anon` with read-only policies, but Phase 3 keeps all Supabase access server-side via Route Handlers.  | WS-3.1                                            |
| D-LEDGER-1  | Evidence Ledger is a new NW-quadrant district                                        | The Evidence Ledger is not part of any existing app district. It is a Launch-native district that shows system-wide audit data. NW quadrant avoids collision with the 6 app capsules in the ring layout.                                               | WS-3.2, combined-recommendations.md "NW district" |
| D-LEDGER-2  | Rehydration restores viewport position, not UI state                                 | Restoring the exact UI state (open modals, expanded panels, scroll positions) would require full state serialization. Viewport position restoration is simpler and achieves the core goal: "show me what was happening when this receipt was created." | WS-3.2                                            |
| D-PALETTE-1 | `settings.store` is separate from `ui.store`                                         | `ui.store` holds transient interaction state (palette open/closed, morph phase). Settings are persistent user preferences (`localStorage`). Mixing them complicates `persist` middleware partitioning.                                                 | WS-3.3 D-6                                        |
| D-PALETTE-2 | Receipt generation is the palette's responsibility, not `StructuredCommandPalette`'s | The `StructuredCommandPalette` class (WS-1.7) is a pure logic layer. Receipt generation requires `ReceiptStore` access, camera state, and UI context. The palette component has all this context.                                                      | WS-3.3 D-7                                        |
| D-PALETTE-3 | Palette max width 520px (up from 480px stub)                                         | Full palette has more content (3 groups + AI group + longer labels + icons + Beta badge). 520px prevents truncation while keeping the spatial canvas visible.                                                                                          | WS-3.3 D-3                                        |
| D-AI-1      | Three-layer intelligence model (pattern -> rules -> LLM)                             | Instant response for 60%+ of queries (pattern matching). Deterministic answers for state-based questions (rules). LLM only for genuinely ambiguous natural language. Minimizes Ollama dependency and latency.                                          | WS-3.4, AD-7                                      |
| D-AI-2      | Speculative camera drift during Ollama inference                                     | Fills the 3-10s inference gap with visual feedback. Dampened spring (stiffness: 60, damping: 40) provides smooth motion toward the likely target. If the actual target differs, the spring redirects seamlessly.                                       | WS-3.4                                            |
| D-AI-3      | Zod schema validation for Ollama responses                                           | LLM output is unpredictable. Zod validates that the response matches the `CameraDirective` schema before acting on it. Invalid responses fall back to pattern matching or show disambiguation.                                                         | WS-3.4                                            |
| D-AI-4      | AI selects from pre-built templates, never generates React                           | Runtime code generation is a security and stability risk. Template selection achieves 80% of the value of generative UI with none of the risk. Per combined-recommendations.md Deferred Item #6.                                                       | WS-3.5, combined-recommendations.md               |
| D-AI-5      | Template scoring: `finalScore = triggerScore * 0.7 + priorityScore * 0.3`            | Trigger conditions (state-driven) matter more than static priority. The 70/30 weighting ensures that templates with satisfied triggers rank above high-priority templates whose triggers are inactive.                                                 | WS-3.5                                            |
| D-AI-6      | Narration uses native `fetch` (or shared client), not conversation-style API         | Narration is a one-shot generation task, not a multi-turn conversation. The `/api/generate` endpoint (not `/api/chat`) is more appropriate and faster for single-prompt completions.                                                                   | WS-3.6                                            |
| D-AI-7      | Narration rate limit: 10 calls/minute                                                | At 6 apps max, one narration cycle uses at most 6 of the 10 calls. The remaining 4 are reserved for deep-dive requests triggered by user interaction.                                                                                                  | WS-3.6                                            |
| D-ATTN-1    | Two attention modes only (calm/tighten), not three                                   | Three modes (calm/alert/critical) would require more complex hysteresis and risk over-modulating the ambient effects. Two modes with performance-level scaling provide sufficient granularity.                                                         | WS-3.7                                            |
| D-ATTN-2    | Hysteresis: immediate escalation, delayed de-escalation                              | False positives (unnecessary tighten) are less disruptive than false negatives (missed anomaly). Immediate escalation ensures attention is drawn to problems. 3-snapshot delay prevents mode flicker during transient recovery.                        | WS-3.7                                            |

### Appendix E: Inputs Required by Next Phase

Phase 4 (Advanced AI + Polish) requires the following outputs from Phase 3:

| Input                                                      | Source | Consumed By                                                                    |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| `SupabaseReceiptStore` with receipt + snapshot persistence | WS-3.1 | Phase 4 exception triage (receipts for AI-classified failures)                 |
| `AIRouter` real implementation with provider routing       | WS-3.4 | Phase 4 Claude API integration (dual-provider routing: Ollama + Claude)        |
| `ai.store.ts` with `sessionCost` tracking                  | WS-3.4 | Phase 4 cost controls (rate limits, session counter)                           |
| Command palette with AI entry point                        | WS-3.3 | Phase 4 Builder Mode (natural language station creation via palette)           |
| `DynamicStationTemplateRegistry`                           | WS-3.5 | Phase 4 exception triage (AI selects recovery UI template from registry)       |
| Attention choreography with `tighten` mode                 | WS-3.7 | Phase 4 polish pass (fine-tuning attention thresholds based on user feedback)  |
| Evidence Ledger with receipt rehydration                   | WS-3.2 | Phase 4 exception triage (receipts surface AI-classified failures in timeline) |

### Appendix F: Phase 1/2 Lessons Applied

| Prior Phase Lesson                                                     | How Phase 3 Applies It                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Triple type duplication (Phase 1 Conflict #1)                          | Phase 3 uses a clearer pattern: shared domain types in `src/lib/interfaces/types.ts`, feature-local types co-located with modules. No SOW creates files in `src/types/`.                                                                                                                                                                                                                                                            |
| `framer-motion` vs. `motion/react` (Phase 1 Conflict)                  | All 7 Phase 3 SOWs consistently use `import { motion, AnimatePresence } from 'motion/react'`. Zero instances of `framer-motion`.                                                                                                                                                                                                                                                                                                    |
| `npm` vs. `pnpm` (Phase 1 lesson)                                      | No Phase 3 SOW references `npm install`. WS-3.3 AC-26 explicitly uses `pnpm typecheck`.                                                                                                                                                                                                                                                                                                                                             |
| `src/types/` directory not in AD-9 (Phase 1 Gap 1, Phase 2 Conflict 2) | Phase 3 avoids `src/types/` entirely. All domain types go to `src/lib/interfaces/types.ts` or feature-local files. This effectively resolves the recurring pattern.                                                                                                                                                                                                                                                                 |
| Port collision (Phase 2 Conflict 1)                                    | Phase 2 Review H-1 moved Tarva Chat from port 3005 to **4000** to resolve the collision with Project Room. Canonical port assignments: Agent Builder (3000), Project Room (3005), Tarva Chat (4000), TarvaERP (3010). **Note:** WS-3.3 `APP_URLS` correctly assigns Tarva Chat to 4000 but incorrectly assigns TarvaERP to 4000 as well (should be 3010 per WS-2.5). This port collision must be corrected during WS-3.3 execution. |
| `InMemoryReceiptStore` loses data on refresh (Phase 2 R-2.7)           | WS-3.1 directly resolves this by replacing `InMemoryReceiptStore` with `SupabaseReceiptStore`. Offline queue provides additional resilience.                                                                                                                                                                                                                                                                                        |
| Fetch timeout inconsistency (Phase 2 Conflict 6)                       | Phase 3 introduces a new timeout inconsistency (Conflict 3: WS-3.4 10s vs. WS-3.6 30s). Resolution: per-request configurable timeouts in the shared Ollama client.                                                                                                                                                                                                                                                                  |
| No testing framework (Phase 1 Gap 2, Phase 2 Gap 1)                    | Phase 3 adds ~15-20 pure functions ideal for unit testing (Gap 2). If Vitest is still not configured, the debt compounds to 3 phases of untested code.                                                                                                                                                                                                                                                                              |

### Appendix G: Supabase Schema Summary

```sql
-- Table: launch_receipts
CREATE TABLE launch_receipts (
  id              TEXT PRIMARY KEY,           -- UUID v7
  correlation_id  TEXT,                       -- Groups related receipts
  source          TEXT NOT NULL,              -- launch | agent-builder | tarva-chat | ...
  event_type      TEXT NOT NULL,              -- navigation | action | error | approval | system
  severity        TEXT NOT NULL DEFAULT 'info', -- info | warning | error | critical
  summary         TEXT NOT NULL,              -- Human-readable description
  detail          JSONB,                      -- Structured detail payload
  location        JSONB NOT NULL,             -- { semanticLevel, district?, station? }
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms     INTEGER,                    -- Action duration (null for instant)
  actor           TEXT NOT NULL DEFAULT 'human', -- human | ai | system
  ai_metadata     JSONB,                      -- { provider, modelId, confidence, latencyMs, reasoning, ... }
  snapshot_id     TEXT REFERENCES launch_snapshots(id), -- FK to snapshot at receipt time
  target          JSONB,                      -- CameraDirective target for navigation receipts
  tags            TEXT[] DEFAULT '{}'          -- Freeform tags
);

-- Indexes
CREATE INDEX idx_receipts_timestamp ON launch_receipts (timestamp DESC);
CREATE INDEX idx_receipts_source ON launch_receipts (source);
CREATE INDEX idx_receipts_event_type ON launch_receipts (event_type);
CREATE INDEX idx_receipts_severity ON launch_receipts (severity);
CREATE INDEX idx_receipts_correlation ON launch_receipts (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX idx_receipts_tags ON launch_receipts USING GIN (tags);
CREATE INDEX idx_receipts_search ON launch_receipts USING GIN (to_tsvector('english', summary));

-- Table: launch_snapshots
CREATE TABLE launch_snapshots (
  id          TEXT PRIMARY KEY,               -- UUID v7
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger     TEXT NOT NULL,                  -- receipt | periodic | manual
  data        JSONB NOT NULL,                 -- SystemSnapshot as JSONB
  receipt_id  TEXT REFERENCES launch_receipts(id) -- Optional FK to triggering receipt
);

CREATE INDEX idx_snapshots_timestamp ON launch_snapshots (timestamp DESC);
CREATE INDEX idx_snapshots_trigger ON launch_snapshots (trigger);
CREATE INDEX idx_snapshots_receipt ON launch_snapshots (receipt_id) WHERE receipt_id IS NOT NULL;
```
