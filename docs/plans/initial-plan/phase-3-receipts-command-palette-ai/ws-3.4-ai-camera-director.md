# WS-3.4: AI Camera Director

> **Workstream ID:** WS-3.4
> **Phase:** 3 -- Receipts + Command Palette + AI
> **Assigned Agent:** `world-class-autonomous-interface-architect`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.7 (CameraController, AIRouter, SystemStateProvider interfaces), WS-1.1 (camera store, flyTo, spring physics), WS-1.5 (telemetry aggregator, SystemSnapshot), WS-3.1 (ReceiptStore for AI action receipts), WS-3.3 (Command Palette "Ask AI..." entry point)
> **Blocks:** WS-4.1 (Claude API integration extends LiveAIRouter), WS-4.2 (Exception Triage reuses AIRouter + OllamaProvider)
> **Resolves:** AD-7 interface #1 (CameraController Phase 3), AD-7 interface #5 (AIRouter Phase 3)

---

## 1. Objective

Deliver the AI Camera Director -- the first AI-powered feature in Tarva Launch. The Camera Director translates natural language queries (e.g., "show me what's broken", "take me to the busiest app") into `CameraDirective` objects that drive spatial navigation, highlight relevant districts, dim irrelevant ones, and provide narrated explanations of the navigation decision.

The system uses a three-layer intelligence model per AD-7: local pattern matching handles structured commands instantly (`go core`, `home`, `zoom out`), a deterministic synonym resolver handles fuzzy app references (`show me builder` -> Agent Builder), and Ollama (localhost:11434) handles genuine natural language that requires semantic understanding of system state. During the 3-10 second Ollama inference latency, the camera performs a speculative drift toward the most likely target to maintain the feeling of immediate responsiveness. When the AI returns ambiguous results (multiple plausible targets with similar confidence), a disambiguation strip appears for the user to choose.

Every AI-driven navigation generates a receipt with extended AI metadata fields (prompt, reasoning, confidence, alternatives considered, provider, latency) per AD-6. The entire feature is gated behind an AI beta toggle in settings -- when disabled, the command palette operates in structured-command-only mode (Phase 1 behavior). If Ollama is unreachable, the system degrades gracefully to pattern matching and structured commands with no user-facing errors.

**Success looks like:** The user presses Cmd+K, types "where are the errors?", and within 300ms the camera begins drifting toward the district with the highest alert count. After 2-5 seconds, Ollama returns a full directive -- the camera completes its flight to Project Room, highlights the district with an ember glow, dims healthy districts, and a narration tooltip reads "Project Room has 3 active alerts -- 2 failed runs and 1 dependency warning." A receipt stamp appears with the full AI rationale. If Ollama is not running, the user sees "AI unavailable -- try 'go project-room' instead" inline in the command palette.

**Why this workstream matters:** The AI Camera Director is the keystone feature that transforms Tarva Launch from a spatial dashboard into an intelligent mission-control interface. It validates the entire AI integration architecture (AD-7) and proves that the interface contracts from WS-1.7 work end-to-end. It establishes the Ollama integration pattern that WS-3.5 (Station Template Selection) and WS-3.6 (Narrated Telemetry) reuse.

**Traceability:** AD-7 (AI Integration Architecture), AD-6 (Receipt System -- AI receipts), AD-1 (Camera State Management -- flyTo), tech-decisions.md (Feature-by-Feature AI Routing -- camera-director-structured, camera-director-nl), combined-recommendations.md "AI Features (Phase 3)" section, Risk #5 (Ollama latency mitigation), Risk #11 (Ollama model availability).

---

## 2. Scope

### In Scope

1. **AI store** (`src/stores/ai.store.ts`) -- Zustand store for AI feature state: beta toggle, provider health, active request tracking, speculative drift state, disambiguation state. Persists beta toggle to `localStorage`.

2. **Ollama provider** (`src/lib/ai/ollama-provider.ts`) -- **[AMENDED per Phase 3 Review H-1]** Typed client for the Ollama REST API at `localhost:11434`. Handles model availability checking (`/api/tags`), chat completion (`/api/chat`), health checking, timeout management (10s default). Uses native `fetch()` via the shared `ollama-client.ts` from WS-3.6 (NOT the `ollama` npm package). The `OllamaProvider` class wraps the shared client's `generateJSON()` and `checkOllamaHealth()` functions, adding the `chat()` interface expected by the `LiveAIRouter`.

3. **Pattern matcher provider** (`src/lib/ai/pattern-matcher-provider.ts`) -- Deterministic command parser that handles 60%+ of Camera Director queries without any LLM. Resolves structured commands (`go core`, `show alerts`, `home`), fuzzy app name matching via the SYNONYM_RING from WS-1.7, and simple intent patterns (`show me X`, `take me to X`, `what about X`).

4. **Live AI router** (`src/lib/ai/live-ai-router.ts`) -- Production implementation of the `AIRouter` interface from WS-1.7, replacing the `StubAIRouter`. Routes requests to the appropriate provider per the `AI_ROUTING_TABLE`. Implements provider health checking, fallback chains, session cost tracking, and rate limiting per tech-decisions.md cost controls.

5. **Spatial index** (`src/lib/ai/spatial-index.ts`) -- Lightweight index of all navigable spatial entities (districts, stations, views) with their world-space positions, current health states, alert counts, and semantic descriptions. Built from `SystemSnapshot` + `StationTemplateRegistry`. Provides the AI with structured context about what exists in the spatial canvas and where.

6. **Context assembler** (`src/lib/ai/context-assembler.ts`) -- Builds the prompt payload for Ollama from the `SpatialIndex` + `SystemSnapshot`. Produces a structured system message describing the spatial layout, current telemetry state, and available navigation targets, plus the user's natural language query as the user message. Keeps total prompt under 2000 tokens for fast inference.

7. **Camera directive schema** (`src/lib/ai/camera-directive-schema.ts`) -- Zod schema that validates Ollama's JSON response into a typed `CameraDirective`. Handles malformed responses gracefully (falls back to best-effort parsing). Includes the response format instruction appended to the system prompt.

8. **AI Camera Controller** (`src/lib/ai/camera-director.ts`) -- Production implementation of the `CameraController` interface that wraps `ManualCameraController` and adds NL-to-CameraDirective translation. The `navigate()` method accepts directives from both manual interactions and AI. A new `interpretAndNavigate(query: string)` method handles the full AI pipeline: pattern match -> (if no match) Ollama -> validate response -> build directive -> execute navigation -> generate receipt.

9. **Speculative camera drift** (`src/hooks/use-speculative-drift.ts` + `src/components/ai/SpeculativeDrift.tsx`) -- During the Ollama inference window, the camera begins a slow, gentle drift toward the most likely target based on heuristic analysis of the query (keyword matching against district names and alert states). The drift uses a dampened spring with low stiffness (60) and high damping (40) so it feels exploratory rather than committed. When the real directive arrives, the drift seamlessly transitions into the final flyTo animation. If the drift target was wrong, the camera smoothly redirects.

10. **Disambiguation strip** (`src/components/ai/DisambiguationStrip.tsx`) -- When Ollama returns multiple candidates with confidence spread < 0.2 between top results, a horizontal strip appears below the command palette showing 2-4 candidate destinations with their names, health badges, and confidence scores. The user clicks one to confirm, or the highest-confidence option auto-selects after 5 seconds. Glass material styling consistent with the command palette.

11. **AI beta toggle** (`src/components/ai/AIBetaToggle.tsx`) -- Toggle switch in settings that enables/disables AI features. When off, the "Ask AI..." option does not appear in the command palette, and the `AICameraController` falls through to `ManualCameraController` behavior. Persisted to `localStorage` under `tarva-launch-ai-beta`.

12. **AI receipt generation** -- Every AI Camera Director action generates a `LaunchReceipt` with the full `AIReceiptMetadata` fields: `prompt` (user query), `reasoning` (AI's explanation), `confidence` (0.0-1.0), `alternativesConsidered` (other targets the AI evaluated), `provider` (`'ollama'` | `'pattern-matcher'`), `latencyMs` (end-to-end), `modelId` (e.g., `'llama3.2'`).

13. **Ollama proxy route handler** (`app/api/ai/chat/route.ts`) -- Next.js Route Handler that proxies requests to Ollama. Keeps the Ollama connection server-side (avoids CORS issues if Ollama's CORS config is restrictive). Adds request validation, timeout enforcement, and structured logging.

14. **Ollama health check integration** -- Extend the telemetry aggregator or add a dedicated check that verifies Ollama availability and model presence on Launch startup and periodically (every 60s). Surface Ollama status in the AI store and in the command palette UI.

15. **Command palette AI integration** -- Wire the "Ask AI..." option in WS-3.3's command palette to the `AICameraController.interpretAndNavigate()` method. Show inline loading state during inference, error state if Ollama is unavailable, and the disambiguation strip when needed.

### Out of Scope

- Claude API integration (WS-4.1 -- Phase 4)
- Station template selection AI (WS-3.5 -- separate workstream, reuses LiveAIRouter)
- Narrated telemetry AI (WS-3.6 -- separate workstream, reuses LiveAIRouter)
- Exception triage AI (WS-4.2 -- Phase 4)
- Builder Mode (WS-4.3 -- Phase 4)
- Voice input for Camera Director (deferred per combined-recommendations.md)
- Custom Ollama model fine-tuning or training
- Ollama model download/management UI (user must pre-pull models via `ollama pull`)
- Supabase persistence of AI receipts (WS-3.1 handles the ReceiptStore implementation; this workstream generates the receipt input)
- Evidence Ledger UI for AI receipts (WS-3.2 renders receipts; this workstream creates them)

---

## 3. Input Dependencies

| Dependency                           | Source  | What It Provides                                                                                                                                                                 | Blocking?                                   |
| ------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| WS-1.7 CameraController interface    | Phase 1 | `CameraController`, `CameraDirective`, `CameraTarget`, `FlyToOptions`, `CameraSnapshot` types; `ManualCameraController` class to wrap                                            | Yes                                         |
| WS-1.7 AIRouter interface            | Phase 1 | `AIRouter`, `AIRequest`, `AIResponse`, `AIFeature`, `AIProvider`, `RoutingRule`, `ProviderStatus`, `AISessionCost` types; `AI_ROUTING_TABLE` constant; `StubAIRouter` to replace | Yes                                         |
| WS-1.7 SystemStateProvider interface | Phase 1 | `SystemStateProvider`, `SystemSnapshot`, `AppState`, `GlobalMetrics` types; `PollingSystemStateProvider` to read from                                                            | Yes                                         |
| WS-1.7 ReceiptStore interface        | Phase 1 | `ReceiptStore`, `ReceiptInput`, `LaunchReceipt`, `AIReceiptMetadata` types                                                                                                       | Yes                                         |
| WS-1.7 CommandPalette interface      | Phase 1 | `CommandPalette`, `CommandResult`, `PaletteCommand` types; `StructuredCommandPalette` to extend                                                                                  | Yes                                         |
| WS-1.7 Shared types                  | Phase 1 | `AppIdentifier`, `CameraPosition`, `SemanticLevel`, `SpatialLocation`, `HealthState`, `Actor`, `EventType`, `Severity`                                                           | Yes                                         |
| WS-1.1 Camera store                  | Phase 1 | `useCameraStore` with `flyTo()`, `panBy()`, `zoomTo()`, `setCamera()`, `cancelAnimation()`; spring physics; `cameraSelectors`                                                    | Yes                                         |
| WS-1.1 Spatial math                  | Phase 1 | `screenToWorld()`, `worldToScreen()`, `springStep()`, `SpringConfig`                                                                                                             | Yes                                         |
| WS-1.5 Telemetry aggregator          | Phase 1 | `PollingSystemStateProvider` populated with live `SystemSnapshot` data from all 6 apps                                                                                           | Yes                                         |
| WS-3.1 ReceiptStore implementation   | Phase 3 | `SupabaseReceiptStore` (or `InMemoryReceiptStore` for dev) to write AI receipts to                                                                                               | Yes                                         |
| WS-3.3 Command Palette UI            | Phase 3 | cmdk-based palette with "Ask AI..." option that routes NL input to this workstream                                                                                               | Yes                                         |
| WS-1.7 StationTemplateRegistry       | Phase 1 | `StaticStationTemplateRegistry` for building the SpatialIndex (station names and IDs)                                                                                            | Soft -- can build index from districts only |
| WS-0.2 Design tokens                 | Phase 0 | Glass material tokens, glow tokens, animation durations for disambiguation strip and drift visuals                                                                               | Soft -- can hardcode values                 |
| WS-3.6 shared Ollama client          | Phase 3 | `ollama-client.ts` with `generateJSON()`, `checkOllamaHealth()`, `listOllamaModels()`, `isModelAvailable()` -- native fetch, no npm dependency                                   | Yes                                         |
| `zod` npm package                    | npm     | Schema validation for Ollama responses                                                                                                                                           | Yes                                         |
| `motion/react` v12+                  | npm     | Animation for speculative drift and disambiguation strip                                                                                                                         | Yes                                         |

---

## 4. Deliverables

### 4.1 AI Store -- `src/stores/ai.store.ts`

Zustand store for all AI feature state. Follows the ecosystem pattern of separate State and Actions interfaces with an exported selectors object.

```ts
/**
 * AI feature state store.
 *
 * Manages: beta toggle, provider health, active AI requests,
 * speculative drift state, disambiguation state.
 *
 * References: AD-7 (AI Integration Architecture),
 * tech-decisions.md (AI Cost Control)
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AIFeature, AIProvider, AISessionCost, ProviderStatus } from '@/lib/interfaces'
import type { AppIdentifier } from '@/lib/interfaces/types'

// ============================================================================
// Disambiguation
// ============================================================================

/** A candidate destination for disambiguation. */
export interface DisambiguationCandidate {
  readonly districtId: AppIdentifier
  readonly displayName: string
  readonly confidence: number
  readonly reason: string
}

// ============================================================================
// Speculative Drift
// ============================================================================

/** State of the speculative camera drift during AI inference. */
export interface SpeculativeDriftState {
  /** Whether drift is currently active. */
  readonly active: boolean
  /** The heuristic best-guess target district. Null if no guess. */
  readonly targetDistrictId: AppIdentifier | null
  /** Confidence in the heuristic guess. 0.0-1.0. */
  readonly confidence: number
  /** Timestamp when drift started. */
  readonly startedAt: number | null
}

// ============================================================================
// AI Request Tracking
// ============================================================================

/** An in-flight AI request. */
export interface ActiveAIRequest {
  readonly id: string
  readonly feature: AIFeature
  readonly query: string
  readonly startedAt: number
  readonly provider: AIProvider | null
}

// ============================================================================
// Store Shape
// ============================================================================

export interface AIState {
  /** Whether AI features are enabled. Persisted to localStorage. */
  betaEnabled: boolean
  /** Current provider health statuses. */
  providerStatuses: Record<AIProvider, ProviderStatus>
  /** Currently in-flight AI request. Null if idle. */
  activeRequest: ActiveAIRequest | null
  /** Speculative drift state during AI inference. */
  drift: SpeculativeDriftState
  /** Disambiguation candidates when AI returns ambiguous results. */
  disambiguation: {
    active: boolean
    candidates: DisambiguationCandidate[]
    autoSelectTimeoutMs: number
  }
  /** Session cost tracking. */
  sessionCost: AISessionCost
  /** Ollama model ID currently configured (e.g., 'llama3.2'). */
  ollamaModel: string
  /** Whether Ollama is reachable and has the required model. */
  ollamaReady: boolean
  /** Last Ollama health check error, if any. */
  ollamaError: string | null
}

export interface AIActions {
  /** Toggle AI beta on/off. Persists to localStorage. */
  setBetaEnabled: (enabled: boolean) => void
  /** Update a single provider's status. */
  setProviderStatus: (provider: AIProvider, status: ProviderStatus) => void
  /** Set the active AI request (or null when complete). */
  setActiveRequest: (request: ActiveAIRequest | null) => void
  /** Update speculative drift state. */
  setDrift: (drift: Partial<SpeculativeDriftState>) => void
  /** Clear drift state (reset to idle). */
  clearDrift: () => void
  /** Set disambiguation candidates. */
  setDisambiguation: (candidates: DisambiguationCandidate[]) => void
  /** Clear disambiguation (user selected or auto-selected). */
  clearDisambiguation: () => void
  /** Increment session cost counters after a completed AI call. */
  recordAICost: (provider: AIProvider, feature: AIFeature) => void
  /** Set Ollama readiness state. */
  setOllamaStatus: (ready: boolean, model: string, error: string | null) => void
  /** Reset session cost (e.g., on page reload). */
  resetSessionCost: () => void
}

export type AIStore = AIState & AIActions

// ============================================================================
// Initial State
// ============================================================================

const loadBetaToggle = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('tarva-launch-ai-beta') === 'true'
}

const INITIAL_PROVIDER_STATUS: Record<AIProvider, ProviderStatus> = {
  'pattern-matcher': {
    provider: 'pattern-matcher',
    available: true, // Always available (local code)
    lastCheck: null,
    error: null,
  },
  'rule-engine': {
    provider: 'rule-engine',
    available: true, // Always available (local code)
    lastCheck: null,
    error: null,
  },
  ollama: {
    provider: 'ollama',
    available: false,
    lastCheck: null,
    error: 'Not checked yet',
  },
  claude: {
    provider: 'claude',
    available: false,
    lastCheck: null,
    error: 'Phase 4 -- not configured',
  },
}

const INITIAL_SESSION_COST: AISessionCost = {
  totalCalls: 0,
  callsByProvider: {
    'pattern-matcher': 0,
    'rule-engine': 0,
    ollama: 0,
    claude: 0,
  },
  callsByFeature: {
    'camera-director-structured': 0,
    'camera-director-nl': 0,
    'station-template-selection': 0,
    'narrated-telemetry-batch': 0,
    'narrated-telemetry-deep': 0,
    'exception-triage': 0,
    'builder-mode': 0,
  },
  estimatedCostUsd: 0,
}

const INITIAL_STATE: AIState = {
  betaEnabled: loadBetaToggle(),
  providerStatuses: INITIAL_PROVIDER_STATUS,
  activeRequest: null,
  drift: {
    active: false,
    targetDistrictId: null,
    confidence: 0,
    startedAt: null,
  },
  disambiguation: {
    active: false,
    candidates: [],
    autoSelectTimeoutMs: 5000,
  },
  sessionCost: INITIAL_SESSION_COST,
  ollamaModel: 'llama3.2',
  ollamaReady: false,
  ollamaError: null,
}

// ============================================================================
// Store
// ============================================================================

export const useAIStore = create<AIStore>()(
  immer((set) => ({
    ...INITIAL_STATE,

    setBetaEnabled: (enabled) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tarva-launch-ai-beta', String(enabled))
      }
      set((state) => {
        state.betaEnabled = enabled
      })
    },

    setProviderStatus: (provider, status) =>
      set((state) => {
        state.providerStatuses[provider] = status
      }),

    setActiveRequest: (request) =>
      set((state) => {
        state.activeRequest = request
      }),

    setDrift: (drift) =>
      set((state) => {
        if (drift.active !== undefined) state.drift.active = drift.active
        if (drift.targetDistrictId !== undefined)
          state.drift.targetDistrictId = drift.targetDistrictId
        if (drift.confidence !== undefined) state.drift.confidence = drift.confidence
        if (drift.startedAt !== undefined) state.drift.startedAt = drift.startedAt
      }),

    clearDrift: () =>
      set((state) => {
        state.drift.active = false
        state.drift.targetDistrictId = null
        state.drift.confidence = 0
        state.drift.startedAt = null
      }),

    setDisambiguation: (candidates) =>
      set((state) => {
        state.disambiguation.active = true
        state.disambiguation.candidates = candidates
      }),

    clearDisambiguation: () =>
      set((state) => {
        state.disambiguation.active = false
        state.disambiguation.candidates = []
      }),

    recordAICost: (provider, feature) =>
      set((state) => {
        state.sessionCost.totalCalls += 1
        state.sessionCost.callsByProvider[provider] += 1
        state.sessionCost.callsByFeature[feature] += 1
        // Ollama is free. Claude cost estimation deferred to Phase 4.
      }),

    setOllamaStatus: (ready, model, error) =>
      set((state) => {
        state.ollamaReady = ready
        state.ollamaModel = model
        state.ollamaError = error
        state.providerStatuses.ollama = {
          provider: 'ollama',
          available: ready,
          lastCheck: new Date().toISOString(),
          error,
        }
      }),

    resetSessionCost: () =>
      set((state) => {
        state.sessionCost = { ...INITIAL_SESSION_COST }
      }),
  }))
)

// ============================================================================
// Selectors
// ============================================================================

export const aiSelectors = {
  /** Whether AI features are available (beta enabled + at least pattern-matcher). */
  isAIAvailable: (state: AIState): boolean => state.betaEnabled,

  /** Whether Ollama is ready for NL queries. */
  isOllamaReady: (state: AIState): boolean => state.betaEnabled && state.ollamaReady,

  /** Whether an AI request is currently in flight. */
  isProcessing: (state: AIState): boolean => state.activeRequest !== null,

  /** Whether disambiguation is awaiting user choice. */
  isDisambiguating: (state: AIState): boolean => state.disambiguation.active,

  /** Whether speculative drift is active. */
  isDrifting: (state: AIState): boolean => state.drift.active,
}
```

### 4.2 Ollama Provider -- `src/lib/ai/ollama-provider.ts`

**[AMENDED per Phase 3 Review H-1]** Wraps the shared `ollama-client.ts` (WS-3.6, native `fetch()`) to provide the class-based `OllamaProvider` interface expected by `LiveAIRouter`. Does NOT use the `ollama` npm package -- all HTTP communication goes through the shared client's `generateJSON()`, `checkOllamaHealth()`, and `isModelAvailable()` functions.

```ts
/**
 * Ollama provider -- connects to the local Ollama instance at localhost:11434.
 *
 * This is the primary LLM provider for Phase 3. It handles:
 * - Health checking (is Ollama running?)
 * - Model verification (is the required model pulled?)
 * - Chat completion with JSON mode for structured CameraDirective output
 * - Timeout enforcement (default 10s)
 * - Error classification (network vs model vs timeout)
 *
 * [AMENDED] Uses native fetch via shared ollama-client.ts (WS-3.6),
 * NOT the `ollama` npm package. This minimizes dependencies and ensures
 * a single Ollama client implementation across all AI workstreams.
 *
 * References: tech-decisions.md (AI Integration -- Ollama),
 * AD-7 (three-layer intelligence model)
 */

import {
  generateJSON,
  checkOllamaHealth,
  isModelAvailable,
  OLLAMA_DEFAULT_MODEL,
} from './ollama-client'
import type { AIProvider } from '@/lib/interfaces/ai-router'

// ============================================================================
// Configuration
// ============================================================================

export interface OllamaConfig {
  /** Ollama host URL. Default: 'http://localhost:11434'. */
  readonly host: string
  /** Model to use for chat completions. Default: 'llama3.2'. */
  readonly model: string
  /** Request timeout in ms. Default: 10000. */
  readonly timeoutMs: number
  /** Temperature for generation. Default: 0.3 (low for structured output). */
  readonly temperature: number
}

export const DEFAULT_OLLAMA_CONFIG: Readonly<OllamaConfig> = {
  host: 'http://localhost:11434',
  model: 'llama3.2',
  timeoutMs: 10_000,
  temperature: 0.3,
} as const

// ============================================================================
// Response Types
// ============================================================================

export interface OllamaHealthResult {
  readonly reachable: boolean
  readonly modelAvailable: boolean
  readonly modelName: string
  readonly error: string | null
  readonly latencyMs: number
}

export interface OllamaChatResult {
  readonly success: boolean
  readonly content: string
  readonly provider: AIProvider
  readonly modelId: string
  readonly latencyMs: number
  readonly error: string | null
}

// ============================================================================
// Error Classification
// ============================================================================

export type OllamaErrorType =
  | 'network' // Ollama not running or unreachable
  | 'model' // Requested model not available
  | 'timeout' // Request exceeded timeout
  | 'parse' // Response could not be parsed
  | 'unknown' // Unexpected error

export class OllamaError extends Error {
  constructor(
    message: string,
    public readonly errorType: OllamaErrorType,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'OllamaError'
  }
}

// ============================================================================
// Ollama Provider
// ============================================================================

export class OllamaProvider {
  private config: OllamaConfig

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = { ...DEFAULT_OLLAMA_CONFIG, ...config }
  }

  /**
   * Check if Ollama is reachable and the required model is available.
   * Called on Launch startup and periodically (every 60s).
   */
  async healthCheck(): Promise<OllamaHealthResult> {
    const startTime = performance.now()

    try {
      // [AMENDED] Uses shared ollama-client.ts (WS-3.6) native fetch functions
      const reachable = await checkOllamaHealth()
      if (!reachable) {
        const latencyMs = Math.round(performance.now() - startTime)
        return {
          reachable: false,
          modelAvailable: false,
          modelName: this.config.model,
          error: `Ollama unreachable at ${this.config.host}. Is Ollama running?`,
          latencyMs,
        }
      }

      const modelAvailable = await isModelAvailable(this.config.model)
      const latencyMs = Math.round(performance.now() - startTime)

      return {
        reachable: true,
        modelAvailable,
        modelName: this.config.model,
        error: modelAvailable
          ? null
          : `Model "${this.config.model}" not found. Run: ollama pull ${this.config.model}`,
        latencyMs,
      }
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime)
      return {
        reachable: false,
        modelAvailable: false,
        modelName: this.config.model,
        error: `Ollama unreachable at ${this.config.host}. Is Ollama running?`,
        latencyMs,
      }
    }
  }

  /**
   * Send a chat completion request to Ollama.
   * Uses JSON format mode for structured output.
   *
   * @param systemPrompt - System message with spatial context and response format.
   * @param userMessage - The user's natural language query.
   */
  async chat(systemPrompt: string, userMessage: string): Promise<OllamaChatResult> {
    const startTime = performance.now()

    try {
      // [AMENDED] Uses shared ollama-client.ts generateJSON() (native fetch)
      // The shared client assembles the system+user prompt into a single
      // prompt string for the /api/generate endpoint.
      const combinedPrompt = `${systemPrompt}\n\nUser query: ${userMessage}`

      const { result, response: ollamaResponse } = await generateJSON<Record<string, unknown>>({
        model: this.config.model,
        prompt: combinedPrompt,
        system: systemPrompt,
        options: {
          temperature: this.config.temperature,
          num_predict: 1024,
        },
      })

      const latencyMs = Math.round(performance.now() - startTime)

      return {
        success: true,
        content: JSON.stringify(result),
        provider: 'ollama',
        modelId: this.config.model,
        latencyMs,
        error: null,
      }
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime)

      if (error instanceof OllamaError) {
        return {
          success: false,
          content: '',
          provider: 'ollama',
          modelId: this.config.model,
          latencyMs,
          error: error.message,
        }
      }

      const message = error instanceof Error ? error.message : String(error)
      const errorType = this.classifyError(message)

      return {
        success: false,
        content: '',
        provider: 'ollama',
        modelId: this.config.model,
        latencyMs,
        error: `Ollama ${errorType} error: ${message}`,
      }
    }
  }

  /** Get the current configuration. */
  getConfig(): Readonly<OllamaConfig> {
    return { ...this.config }
  }

  /** Update the model. Used when user changes model preference. */
  setModel(model: string): void {
    this.config = { ...this.config, model }
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private createTimeout(): Promise<{ timeout: true }> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ timeout: true }), this.config.timeoutMs)
    })
  }

  private classifyError(message: string): OllamaErrorType {
    const lower = message.toLowerCase()
    if (lower.includes('econnrefused') || lower.includes('fetch failed')) {
      return 'network'
    }
    if (lower.includes('model') && lower.includes('not found')) {
      return 'model'
    }
    if (lower.includes('timeout') || lower.includes('aborted')) {
      return 'timeout'
    }
    return 'unknown'
  }
}
```

### 4.3 Pattern Matcher Provider -- `src/lib/ai/pattern-matcher-provider.ts`

Deterministic command parser that handles structured commands and fuzzy app name matching without any LLM. This is the first layer of the three-layer intelligence model (AD-7) and handles 60%+ of Camera Director queries instantly.

```ts
/**
 * Pattern Matcher Provider -- deterministic NL command parser.
 *
 * Handles:
 * - Structured commands: "go core", "home", "zoom out", "show alerts"
 * - Fuzzy app references: "show me builder" -> Agent Builder
 * - Simple intent patterns: "where are the errors?", "take me to chat"
 * - Heuristic target guessing for speculative drift
 *
 * This provider returns results in < 5ms. No network calls.
 * It is always available, even when Ollama is down.
 *
 * References: AD-7 (three-layer intelligence),
 * tech-decisions.md (camera-director-structured: pattern-matcher),
 * WS-1.7 SYNONYM_RING
 */

import { SYNONYM_RING, type SynonymEntry } from '@/lib/interfaces/command-palette'
import type { CameraDirective, CameraTarget } from '@/lib/interfaces/camera-controller'
import type { AppIdentifier, HealthState } from '@/lib/interfaces/types'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'

// ============================================================================
// Match Result
// ============================================================================

export interface PatternMatchResult {
  /** Whether a pattern was matched. */
  readonly matched: boolean
  /** The resolved camera directive, if matched. */
  readonly directive: CameraDirective | null
  /** Confidence in the match. 1.0 for exact structured commands. */
  readonly confidence: number
  /** Human-readable explanation of the match. */
  readonly reasoning: string
  /** Alternative interpretations considered. */
  readonly alternatives: readonly string[]
}

/** Heuristic guess for speculative drift (before Ollama responds). */
export interface DriftGuess {
  readonly districtId: AppIdentifier | null
  readonly confidence: number
  readonly reason: string
}

// ============================================================================
// Intent Patterns
// ============================================================================

interface IntentPattern {
  readonly regex: RegExp
  readonly intent: 'navigate' | 'show' | 'home' | 'overview' | 'alerts'
  readonly extractTarget: (match: RegExpMatchArray) => string | null
}

const INTENT_PATTERNS: readonly IntentPattern[] = [
  // Direct navigation
  { regex: /^go\s+(?:to\s+)?(.+)$/i, intent: 'navigate', extractTarget: (m) => m[1] },
  {
    regex: /^(?:take|bring)\s+me\s+(?:to\s+)?(.+)$/i,
    intent: 'navigate',
    extractTarget: (m) => m[1],
  },
  {
    regex: /^(?:navigate|fly|jump)\s+(?:to\s+)?(.+)$/i,
    intent: 'navigate',
    extractTarget: (m) => m[1],
  },
  { regex: /^(?:open|launch)\s+(.+)$/i, intent: 'navigate', extractTarget: (m) => m[1] },

  // Show / inspect
  {
    regex: /^(?:show|display|view)\s+(?:me\s+)?(.+)$/i,
    intent: 'show',
    extractTarget: (m) => m[1],
  },
  {
    regex: /^(?:what(?:'s| is))\s+(?:happening\s+(?:with|at|in)\s+)?(.+)$/i,
    intent: 'show',
    extractTarget: (m) => m[1],
  },
  { regex: /^(?:what\s+about)\s+(.+)$/i, intent: 'show', extractTarget: (m) => m[1] },
  { regex: /^(?:check|inspect)\s+(.+)$/i, intent: 'show', extractTarget: (m) => m[1] },

  // Home / overview
  {
    regex: /^(?:home|center|atrium|hub|launch|reset)$/i,
    intent: 'home',
    extractTarget: () => null,
  },
  { regex: /^(?:go\s+)?(?:back|return)(?:\s+home)?$/i, intent: 'home', extractTarget: () => null },

  // Constellation / overview
  {
    regex: /^(?:overview|constellation|zoom\s+out|sky|global|dashboard)$/i,
    intent: 'overview',
    extractTarget: () => null,
  },
  {
    regex: /^(?:show|see)\s+(?:the\s+)?(?:big\s+picture|everything|all(?:\s+apps)?)$/i,
    intent: 'overview',
    extractTarget: () => null,
  },

  // Alert-focused (resolved to district with most alerts via SystemSnapshot)
  {
    regex:
      /^(?:where\s+are\s+)?(?:the\s+)?(?:errors?|alerts?|problems?|issues?|warnings?|failures?)$/i,
    intent: 'alerts',
    extractTarget: () => null,
  },
  {
    regex: /^(?:what(?:'s| is))\s+(?:broken|failing|down|wrong)$/i,
    intent: 'alerts',
    extractTarget: () => null,
  },
  {
    regex: /^(?:show|find)\s+(?:me\s+)?(?:what(?:'s| is))\s+(?:broken|failing|wrong)$/i,
    intent: 'alerts',
    extractTarget: () => null,
  },
] as const

// ============================================================================
// Pattern Matcher
// ============================================================================

export class PatternMatcherProvider {
  /**
   * Attempt to match a user query against known patterns.
   *
   * @param query - The user's input string.
   * @param snapshot - Current system state (for alert-based routing).
   */
  match(query: string, snapshot: SystemSnapshot | null): PatternMatchResult {
    const trimmed = query.trim()
    if (!trimmed) {
      return {
        matched: false,
        directive: null,
        confidence: 0,
        reasoning: 'Empty query.',
        alternatives: [],
      }
    }

    for (const pattern of INTENT_PATTERNS) {
      const match = trimmed.match(pattern.regex)
      if (!match) continue

      const target = pattern.extractTarget(match)

      switch (pattern.intent) {
        case 'navigate':
        case 'show': {
          if (!target) break
          const resolved = this.resolveAppTarget(target)
          if (resolved) {
            return {
              matched: true,
              directive: {
                target: { type: 'district', districtId: resolved.appId },
                highlights: [resolved.appId],
                narration: `Navigating to ${resolved.displayName}.`,
                source: 'ai',
              },
              confidence: resolved.confidence,
              reasoning: `Matched "${trimmed}" to ${resolved.displayName} via ${resolved.matchType}.`,
              alternatives: [],
            }
          }
          break
        }

        case 'home':
          return {
            matched: true,
            directive: {
              target: { type: 'home' },
              source: 'ai',
              narration: 'Returning to Launch Atrium.',
            },
            confidence: 1.0,
            reasoning: 'Matched home/return command.',
            alternatives: [],
          }

        case 'overview':
          return {
            matched: true,
            directive: {
              target: { type: 'constellation' },
              source: 'ai',
              narration: 'Zooming out to Constellation view.',
            },
            confidence: 1.0,
            reasoning: 'Matched overview/constellation command.',
            alternatives: [],
          }

        case 'alerts': {
          const alertTarget = this.resolveAlertTarget(snapshot)
          if (alertTarget) {
            return {
              matched: true,
              directive: {
                target: { type: 'district', districtId: alertTarget.appId },
                highlights: alertTarget.allAlertDistricts,
                fades: alertTarget.healthyDistricts,
                narration: alertTarget.narration,
                source: 'ai',
              },
              confidence: 0.85,
              reasoning: alertTarget.reasoning,
              alternatives: alertTarget.alternatives,
            }
          }
          // No alerts anywhere -- navigate to constellation for overview.
          return {
            matched: true,
            directive: {
              target: { type: 'constellation' },
              source: 'ai',
              narration: 'No active alerts across any application. Showing the overview.',
            },
            confidence: 0.7,
            reasoning: 'Alert-focused query but no alerts found. Defaulting to constellation.',
            alternatives: [],
          }
        }
      }
    }

    return {
      matched: false,
      directive: null,
      confidence: 0,
      reasoning: `No pattern matched for "${trimmed}". Requires LLM interpretation.`,
      alternatives: [],
    }
  }

  /**
   * Generate a heuristic guess for speculative drift.
   * Faster and less accurate than match() -- used to start drift
   * immediately while Ollama processes the full query.
   */
  guessTarget(query: string, snapshot: SystemSnapshot | null): DriftGuess {
    const lower = query.toLowerCase().trim()

    // Check for direct app name mentions (fastest path).
    for (const entry of SYNONYM_RING) {
      for (const synonym of entry.synonyms) {
        if (lower.includes(synonym.toLowerCase())) {
          const appId = this.canonicalToAppId(entry.canonical)
          if (appId) {
            return {
              districtId: appId,
              confidence: 0.6,
              reason: `Query mentions "${synonym}" (${entry.canonical}).`,
            }
          }
        }
      }
    }

    // Check for alert/error keywords -> district with most alerts.
    const alertKeywords = ['error', 'alert', 'broken', 'fail', 'wrong', 'down', 'problem', 'issue']
    if (alertKeywords.some((kw) => lower.includes(kw)) && snapshot) {
      const sorted = this.sortByAlerts(snapshot)
      if (sorted.length > 0 && sorted[0].alertCount > 0) {
        return {
          districtId: sorted[0].appId,
          confidence: 0.5,
          reason: `Alert keyword detected; ${sorted[0].displayName} has ${sorted[0].alertCount} alerts.`,
        }
      }
    }

    // Check for activity/busy keywords -> district with most activity.
    const activityKeywords = ['busy', 'active', 'running', 'work', 'doing']
    if (activityKeywords.some((kw) => lower.includes(kw)) && snapshot) {
      // Heuristic: app with most non-idle pulse.
      return {
        districtId: null,
        confidence: 0.2,
        reason: 'Activity keyword detected but no confident guess.',
      }
    }

    return {
      districtId: null,
      confidence: 0,
      reason: 'No heuristic match. Awaiting LLM response.',
    }
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private resolveAppTarget(
    target: string
  ): { appId: AppIdentifier; displayName: string; confidence: number; matchType: string } | null {
    const lower = target.toLowerCase().trim()

    for (const entry of SYNONYM_RING) {
      // Exact canonical match.
      if (entry.canonical.toLowerCase() === lower) {
        const appId = this.canonicalToAppId(entry.canonical)
        if (appId) {
          return {
            appId,
            displayName: entry.canonical,
            confidence: 1.0,
            matchType: 'exact canonical',
          }
        }
      }
      // Synonym match.
      for (const synonym of entry.synonyms) {
        if (synonym.toLowerCase() === lower) {
          const appId = this.canonicalToAppId(entry.canonical)
          if (appId) {
            return {
              appId,
              displayName: entry.canonical,
              confidence: 0.95,
              matchType: `synonym "${synonym}"`,
            }
          }
        }
      }
      // Partial match (target contained in synonym or vice versa).
      for (const synonym of entry.synonyms) {
        if (lower.includes(synonym.toLowerCase()) || synonym.toLowerCase().includes(lower)) {
          const appId = this.canonicalToAppId(entry.canonical)
          if (appId) {
            return {
              appId,
              displayName: entry.canonical,
              confidence: 0.75,
              matchType: `partial match "${synonym}"`,
            }
          }
        }
      }
    }

    return null
  }

  private resolveAlertTarget(snapshot: SystemSnapshot | null): {
    appId: AppIdentifier
    allAlertDistricts: AppIdentifier[]
    healthyDistricts: AppIdentifier[]
    narration: string
    reasoning: string
    alternatives: string[]
  } | null {
    if (!snapshot) return null

    const sorted = this.sortByAlerts(snapshot)
    if (sorted.length === 0 || sorted[0].alertCount === 0) return null

    const top = sorted[0]
    const allAlertDistricts = sorted.filter((a) => a.alertCount > 0).map((a) => a.appId)
    const healthyDistricts = sorted.filter((a) => a.alertCount === 0).map((a) => a.appId)

    const alternatives = sorted
      .slice(1)
      .filter((a) => a.alertCount > 0)
      .map((a) => `${a.displayName} (${a.alertCount} alerts)`)

    return {
      appId: top.appId,
      allAlertDistricts,
      healthyDistricts,
      narration: `${top.displayName} has ${top.alertCount} active alert${top.alertCount > 1 ? 's' : ''} -- navigating there.${alternatives.length > 0 ? ` Also: ${alternatives.join(', ')}.` : ''}`,
      reasoning: `Selected ${top.displayName} as primary alert target (${top.alertCount} alerts). ${alternatives.length} other apps have alerts.`,
      alternatives,
    }
  }

  private sortByAlerts(
    snapshot: SystemSnapshot
  ): { appId: AppIdentifier; displayName: string; alertCount: number }[] {
    return Object.values(snapshot.apps)
      .map((app) => ({
        appId: app.id,
        displayName: app.displayName,
        alertCount: app.alertCount,
      }))
      .sort((a, b) => b.alertCount - a.alertCount)
  }

  private canonicalToAppId(canonical: string): AppIdentifier | null {
    const map: Record<string, AppIdentifier> = {
      'Agent Builder': 'agent-builder',
      'Tarva Chat': 'tarva-chat',
      'Project Room': 'project-room',
      TarvaCORE: 'tarva-core',
      TarvaERP: 'tarva-erp',
      tarvaCODE: 'tarva-code',
    }
    return map[canonical] ?? null
  }
}
```

### 4.4 Spatial Index -- `src/lib/ai/spatial-index.ts`

Lightweight index of all navigable spatial entities, built from `SystemSnapshot` and the `StationTemplateRegistry`. Provides structured context for the Ollama prompt.

```ts
/**
 * SpatialIndex -- indexes navigable entities in the spatial canvas.
 *
 * The AI Camera Director needs to know WHAT exists in the Launch and
 * WHERE it is. This index provides that context as a structured data
 * structure that the context assembler serializes into the Ollama prompt.
 *
 * Built from SystemSnapshot (live telemetry) + StationTemplateRegistry
 * (station catalog). Rebuilt on every AI query to ensure freshness.
 *
 * References: AD-7 (AI context assembly), AD-8 (Station Content per District)
 */

import type { AppIdentifier, HealthState } from '@/lib/interfaces/types'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type { SystemSnapshot, AppState } from '@/lib/interfaces/system-state-provider'
import type {
  StationTemplateRegistry,
  StationTemplate,
} from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Indexed Entity Types
// ============================================================================

/** A navigable district in the spatial canvas. */
export interface IndexedDistrict {
  readonly id: AppIdentifier
  readonly displayName: string
  readonly health: HealthState
  readonly pulse: string
  readonly alertCount: number
  readonly lastEvent: string | null
  readonly freshnessMs: number | null
  readonly stations: readonly IndexedStation[]
}

/** A navigable station within a district. */
export interface IndexedStation {
  readonly id: string
  readonly displayName: string
  readonly districtId: AppIdentifier
  readonly description: string
  readonly category: 'universal' | 'app-specific'
}

/** Special navigation targets (non-district). */
export interface IndexedSpecialTarget {
  readonly id: string
  readonly displayName: string
  readonly description: string
}

/** The complete spatial index. */
export interface SpatialIndexData {
  readonly districts: readonly IndexedDistrict[]
  readonly specialTargets: readonly IndexedSpecialTarget[]
  readonly summary: {
    readonly totalAlerts: number
    readonly appsDown: number
    readonly appsDegraded: number
    readonly appsOperational: number
    readonly appsOffline: number
  }
}

// ============================================================================
// SpatialIndex
// ============================================================================

export class SpatialIndex {
  /**
   * Build a fresh spatial index from the current system state.
   *
   * @param snapshot - Current system snapshot from SystemStateProvider.
   * @param registry - Station template registry for station metadata.
   */
  static build(snapshot: SystemSnapshot, registry?: StationTemplateRegistry): SpatialIndexData {
    const districts: IndexedDistrict[] = []

    for (const [id, appState] of Object.entries(snapshot.apps)) {
      const appId = id as AppIdentifier
      const stations: IndexedStation[] = []

      if (registry) {
        const templates = registry.getTemplatesForDistrict(appId)
        for (const template of templates) {
          stations.push({
            id: template.id,
            displayName: template.displayName,
            districtId: appId,
            description: template.description,
            category: template.category,
          })
        }
      }

      districts.push({
        id: appId,
        displayName: appState.displayName,
        health: appState.health,
        pulse: appState.pulse,
        alertCount: appState.alertCount,
        lastEvent: appState.lastEvent,
        freshnessMs: appState.freshnessMs,
        stations,
      })
    }

    // Sort: most-alerted first, then by health severity.
    districts.sort((a, b) => {
      if (b.alertCount !== a.alertCount) return b.alertCount - a.alertCount
      return healthSeverity(b.health) - healthSeverity(a.health)
    })

    const specialTargets: IndexedSpecialTarget[] = [
      {
        id: 'home',
        displayName: 'Launch Atrium',
        description: 'The Z1 overview showing all 6 app capsules in a ring.',
      },
      {
        id: 'constellation',
        displayName: 'Constellation View',
        description:
          'The Z0 zoomed-out view showing districts as luminous beacons with 3 global metrics.',
      },
    ]

    return {
      districts,
      specialTargets,
      summary: {
        totalAlerts: districts.reduce((sum, d) => sum + d.alertCount, 0),
        appsDown: districts.filter((d) => d.health === 'DOWN').length,
        appsDegraded: districts.filter((d) => d.health === 'DEGRADED').length,
        appsOperational: districts.filter((d) => d.health === 'OPERATIONAL').length,
        appsOffline: districts.filter((d) => d.health === 'OFFLINE' || d.health === 'UNKNOWN')
          .length,
      },
    }
  }
}

function healthSeverity(health: HealthState): number {
  switch (health) {
    case 'DOWN':
      return 4
    case 'DEGRADED':
      return 3
    case 'OPERATIONAL':
      return 2
    case 'OFFLINE':
      return 1
    case 'UNKNOWN':
      return 0
  }
}
```

### 4.5 Context Assembler -- `src/lib/ai/context-assembler.ts`

Builds the Ollama prompt from the SpatialIndex. Keeps total context under 2000 tokens for fast inference.

````ts
/**
 * Context Assembler -- builds the Ollama prompt payload.
 *
 * Assembles a system prompt that describes:
 * 1. The role (spatial navigation AI for a mission-control interface)
 * 2. Available navigation targets (districts, stations, special views)
 * 3. Current system state (health, alerts, activity per app)
 * 4. The required JSON response format (CameraDirective schema)
 *
 * Target: < 2000 tokens total prompt to keep Ollama inference fast.
 *
 * References: AD-7 (AI context assembly), tech-decisions.md (Ollama)
 */

import type { SpatialIndexData } from './spatial-index'
import type { AppIdentifier } from '@/lib/interfaces/types'

// ============================================================================
// Prompt Assembly
// ============================================================================

export interface AssembledPrompt {
  readonly systemMessage: string
  readonly userMessage: string
  /** Estimated token count (rough: 1 token per 4 chars). */
  readonly estimatedTokens: number
}

export class ContextAssembler {
  /**
   * Build a complete prompt for the Camera Director.
   *
   * @param query - The user's natural language query.
   * @param index - The spatial index with current system state.
   */
  static assemble(query: string, index: SpatialIndexData): AssembledPrompt {
    const systemMessage = this.buildSystemMessage(index)
    const userMessage = query.trim()

    return {
      systemMessage,
      userMessage,
      estimatedTokens: Math.ceil((systemMessage.length + userMessage.length) / 4),
    }
  }

  private static buildSystemMessage(index: SpatialIndexData): string {
    const lines: string[] = []

    // Role definition
    lines.push(
      'You are the Camera Director for Tarva Launch, a spatial mission-control interface.',
      "Your job is to interpret the user's natural language query and return a JSON navigation directive.",
      ''
    )

    // System state summary
    lines.push(
      '## Current System State',
      `Total alerts: ${index.summary.totalAlerts}`,
      `Apps operational: ${index.summary.appsOperational}, degraded: ${index.summary.appsDegraded}, down: ${index.summary.appsDown}, offline: ${index.summary.appsOffline}`,
      ''
    )

    // Available districts
    lines.push('## Available Districts')
    for (const district of index.districts) {
      const stationNames = district.stations
        .filter((s) => s.category === 'app-specific')
        .map((s) => s.displayName)
        .join(', ')

      lines.push(
        `- **${district.displayName}** (id: "${district.id}")`,
        `  Health: ${district.health} | Alerts: ${district.alertCount} | Activity: ${district.pulse}`,
        `  ${district.lastEvent ? `Last event: ${district.lastEvent}` : 'No recent events'}`,
        `  ${stationNames ? `Stations: ${stationNames}` : ''}`
      )
    }

    lines.push('')

    // Special targets
    lines.push('## Special Targets')
    for (const target of index.specialTargets) {
      lines.push(`- **${target.displayName}** (id: "${target.id}"): ${target.description}`)
    }

    lines.push('')

    // Response format
    lines.push(
      '## Response Format',
      'Respond with a single JSON object. Do not include any text outside the JSON.',
      '',
      '```json',
      '{',
      '  "target_type": "district" | "home" | "constellation",',
      '  "target_id": "<district id or null for home/constellation>",',
      '  "highlights": ["<district ids to visually highlight>"],',
      '  "fades": ["<district ids to visually dim>"],',
      '  "narration": "<1-2 sentence explanation of why you chose this target>",',
      '  "confidence": <0.0 to 1.0>,',
      '  "alternatives": [',
      '    { "target_id": "<id>", "reason": "<why this was also considered>" }',
      '  ]',
      '}',
      '```',
      '',
      'Rules:',
      '- If the user asks about errors/alerts/problems, navigate to the district with the most alerts.',
      '- If the user names a specific app, navigate to that district.',
      '- If the query is ambiguous, set confidence < 0.7 and provide alternatives.',
      '- If the user wants an overview, use target_type "constellation".',
      '- If the user wants to go home/back/center, use target_type "home".',
      '- Keep narration concise and specific to the current system state.'
    )

    return lines.join('\n')
  }
}
````

### 4.6 Camera Directive Schema -- `src/lib/ai/camera-directive-schema.ts`

Zod validation schema for parsing Ollama's JSON response into a typed `CameraDirective`.

```ts
/**
 * Camera Directive Schema -- validates Ollama JSON responses.
 *
 * Ollama returns JSON (via format: 'json' mode). This schema validates
 * and transforms the response into a typed CameraDirective from WS-1.7.
 *
 * Handles:
 * - Malformed JSON (graceful failure)
 * - Missing fields (sensible defaults)
 * - Invalid district IDs (rejects unknown IDs)
 * - Confidence normalization (clamp to 0.0-1.0)
 *
 * References: WS-1.7 CameraDirective, CameraTarget types
 */

import { z } from 'zod'
import type { CameraDirective, CameraTarget } from '@/lib/interfaces/camera-controller'
import { ALL_APP_IDS, type AppIdentifier } from '@/lib/interfaces/types'

// ============================================================================
// Zod Schemas
// ============================================================================

const appIdSchema = z.enum(ALL_APP_IDS as unknown as [string, ...string[]])

const alternativeSchema = z.object({
  target_id: z.string(),
  reason: z.string().default(''),
})

export const cameraDirectiveResponseSchema = z.object({
  target_type: z.enum(['district', 'home', 'constellation']).default('home'),
  target_id: z.string().nullable().default(null),
  highlights: z.array(z.string()).default([]),
  fades: z.array(z.string()).default([]),
  narration: z.string().default(''),
  confidence: z.number().min(0).max(1).default(0.5),
  alternatives: z.array(alternativeSchema).default([]),
})

export type CameraDirectiveResponse = z.infer<typeof cameraDirectiveResponseSchema>

// ============================================================================
// Parsing
// ============================================================================

export interface ParsedDirectiveResult {
  readonly success: boolean
  readonly directive: CameraDirective | null
  readonly confidence: number
  readonly reasoning: string
  readonly alternatives: readonly { targetId: string; reason: string }[]
  readonly error: string | null
}

/**
 * Parse an Ollama JSON response string into a validated CameraDirective.
 *
 * @param jsonString - Raw JSON string from Ollama's response.
 */
export function parseDirectiveResponse(jsonString: string): ParsedDirectiveResult {
  // Step 1: Parse JSON.
  let raw: unknown
  try {
    raw = JSON.parse(jsonString)
  } catch {
    return {
      success: false,
      directive: null,
      confidence: 0,
      reasoning: '',
      alternatives: [],
      error: `Failed to parse Ollama response as JSON: ${jsonString.slice(0, 200)}`,
    }
  }

  // Step 2: Validate with Zod.
  const parsed = cameraDirectiveResponseSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      directive: null,
      confidence: 0,
      reasoning: '',
      alternatives: [],
      error: `Invalid directive schema: ${parsed.error.message}`,
    }
  }

  const data = parsed.data

  // Step 3: Resolve CameraTarget.
  let target: CameraTarget
  switch (data.target_type) {
    case 'district': {
      if (!data.target_id || !ALL_APP_IDS.includes(data.target_id as AppIdentifier)) {
        return {
          success: false,
          directive: null,
          confidence: data.confidence,
          reasoning: data.narration,
          alternatives: data.alternatives.map((a) => ({ targetId: a.target_id, reason: a.reason })),
          error: `Unknown district ID: "${data.target_id}". Valid IDs: ${ALL_APP_IDS.join(', ')}`,
        }
      }
      target = { type: 'district', districtId: data.target_id as AppIdentifier }
      break
    }
    case 'home':
      target = { type: 'home' }
      break
    case 'constellation':
      target = { type: 'constellation' }
      break
  }

  // Step 4: Filter highlights/fades to valid app IDs.
  const validHighlights = data.highlights.filter((id): id is AppIdentifier =>
    ALL_APP_IDS.includes(id as AppIdentifier)
  )
  const validFades = data.fades.filter((id): id is AppIdentifier =>
    ALL_APP_IDS.includes(id as AppIdentifier)
  )

  // Step 5: Build CameraDirective.
  const directive: CameraDirective = {
    target,
    highlights: validHighlights.length > 0 ? validHighlights : undefined,
    fades: validFades.length > 0 ? validFades : undefined,
    narration: data.narration || undefined,
    source: 'ai',
  }

  return {
    success: true,
    directive,
    confidence: data.confidence,
    reasoning: data.narration,
    alternatives: data.alternatives.map((a) => ({
      targetId: a.target_id,
      reason: a.reason,
    })),
    error: null,
  }
}
```

### 4.7 AI Camera Controller -- `src/lib/ai/camera-director.ts`

The core orchestrator. Wraps `ManualCameraController` and adds the full AI pipeline: pattern match, speculative drift, Ollama inference, disambiguation, receipt generation.

```ts
/**
 * AI Camera Controller -- the orchestrator for AI-driven spatial navigation.
 *
 * Pipeline:
 * 1. Receive NL query from command palette
 * 2. Try PatternMatcherProvider (instant, handles 60%+ of queries)
 * 3. If no match: start speculative drift + send to Ollama via AIRouter
 * 4. Validate Ollama response with CameraDirective schema
 * 5. If ambiguous (confidence < 0.7, alternatives close): show disambiguation
 * 6. Execute directive via ManualCameraController.navigate()
 * 7. Generate receipt with AI metadata
 *
 * Implements CameraController interface -- all manual navigation methods
 * delegate to the wrapped ManualCameraController unchanged.
 *
 * References: AD-7, AD-6, tech-decisions.md routing table
 */

import type {
  CameraController,
  CameraDirective,
  CameraSnapshot,
  CameraTarget,
  FlyToOptions,
} from '@/lib/interfaces/camera-controller'
import type { AIRouter, AIResponse } from '@/lib/interfaces/ai-router'
import type { CameraPosition, SemanticLevel, Unsubscribe } from '@/lib/interfaces/types'
import type { ReceiptStore, AIReceiptMetadata } from '@/lib/interfaces/receipt-store'
import type { SystemStateProvider } from '@/lib/interfaces/system-state-provider'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import { PatternMatcherProvider } from './pattern-matcher-provider'
import { SpatialIndex } from './spatial-index'
import { ContextAssembler } from './context-assembler'
import { parseDirectiveResponse } from './camera-directive-schema'
import type { useAIStore } from '@/stores/ai.store'

// ============================================================================
// Types
// ============================================================================

export interface CameraDirectorConfig {
  /** Confidence threshold below which disambiguation is triggered. */
  readonly disambiguationThreshold: number
  /** Spread between top two alternatives that triggers disambiguation. */
  readonly disambiguationSpread: number
  /** Auto-select timeout for disambiguation (ms). */
  readonly disambiguationTimeoutMs: number
}

export const DEFAULT_DIRECTOR_CONFIG: Readonly<CameraDirectorConfig> = {
  disambiguationThreshold: 0.7,
  disambiguationSpread: 0.2,
  disambiguationTimeoutMs: 5000,
} as const

export interface InterpretResult {
  /** Whether the query was successfully interpreted and executed. */
  readonly success: boolean
  /** The directive that was executed (or would have been). */
  readonly directive: CameraDirective | null
  /** Which provider handled the query. */
  readonly provider: 'pattern-matcher' | 'ollama' | null
  /** AI confidence in the interpretation. */
  readonly confidence: number
  /** Human-readable reasoning. */
  readonly reasoning: string
  /** End-to-end latency in ms. */
  readonly latencyMs: number
  /** Error message if failed. */
  readonly error: string | null
}

// ============================================================================
// AI Camera Controller
// ============================================================================

export class AICameraController implements CameraController {
  private manualController: CameraController
  private aiRouter: AIRouter
  private receiptStore: ReceiptStore
  private systemState: SystemStateProvider
  private stationRegistry: StationTemplateRegistry | null
  private patternMatcher: PatternMatcherProvider
  private config: CameraDirectorConfig
  private aiStoreActions: {
    setActiveRequest: (
      req: { id: string; feature: string; query: string; startedAt: number; provider: null } | null
    ) => void
    setDrift: (drift: {
      active: boolean
      targetDistrictId: string | null
      confidence: number
      startedAt: number | null
    }) => void
    clearDrift: () => void
    setDisambiguation: (
      candidates: { districtId: string; displayName: string; confidence: number; reason: string }[]
    ) => void
    clearDisambiguation: () => void
    recordAICost: (provider: string, feature: string) => void
  }

  constructor(
    manualController: CameraController,
    aiRouter: AIRouter,
    receiptStore: ReceiptStore,
    systemState: SystemStateProvider,
    stationRegistry: StationTemplateRegistry | null,
    aiStoreActions: AICameraController['aiStoreActions'],
    config?: Partial<CameraDirectorConfig>
  ) {
    this.manualController = manualController
    this.aiRouter = aiRouter
    this.receiptStore = receiptStore
    this.systemState = systemState
    this.stationRegistry = stationRegistry
    this.aiStoreActions = aiStoreActions
    this.patternMatcher = new PatternMatcherProvider()
    this.config = { ...DEFAULT_DIRECTOR_CONFIG, ...config }
  }

  // ==========================================================================
  // CameraController interface delegation
  // ==========================================================================

  async navigate(directive: CameraDirective): Promise<void> {
    return this.manualController.navigate(directive)
  }

  panBy(dx: number, dy: number): void {
    this.manualController.panBy(dx, dy)
  }

  zoomTo(zoom: number, cursorWorldX?: number, cursorWorldY?: number): void {
    this.manualController.zoomTo(zoom, cursorWorldX, cursorWorldY)
  }

  async flyTo(target: CameraTarget, options?: FlyToOptions): Promise<void> {
    return this.manualController.flyTo(target, options)
  }

  async resetToLaunch(): Promise<void> {
    return this.manualController.resetToLaunch()
  }

  getPosition(): CameraPosition {
    return this.manualController.getPosition()
  }

  getSemanticLevel(): SemanticLevel {
    return this.manualController.getSemanticLevel()
  }

  getSnapshot(): CameraSnapshot {
    return this.manualController.getSnapshot()
  }

  subscribe(listener: (snapshot: CameraSnapshot) => void): Unsubscribe {
    return this.manualController.subscribe(listener)
  }

  // ==========================================================================
  // AI Camera Director -- the new method
  // ==========================================================================

  /**
   * Interpret a natural language query and navigate accordingly.
   *
   * Full pipeline:
   * 1. PatternMatcher (instant)
   * 2. Speculative drift + Ollama (3-10s)
   * 3. Disambiguation if needed
   * 4. Execute directive
   * 5. Generate receipt
   */
  async interpretAndNavigate(query: string): Promise<InterpretResult> {
    const startTime = performance.now()
    const snapshot = this.systemState.getSnapshot()

    // ---- Step 1: Pattern Matcher (instant) ----
    const patternResult = this.patternMatcher.match(query, snapshot)

    if (patternResult.matched && patternResult.directive) {
      const latencyMs = Math.round(performance.now() - startTime)

      // Execute the directive.
      await this.navigate(patternResult.directive)

      // Generate receipt.
      await this.generateReceipt(
        query,
        patternResult.directive,
        'pattern-matcher',
        patternResult.confidence,
        patternResult.reasoning,
        patternResult.alternatives.map((a) => a),
        latencyMs,
        null
      )

      this.aiStoreActions.recordAICost('pattern-matcher', 'camera-director-structured')

      return {
        success: true,
        directive: patternResult.directive,
        provider: 'pattern-matcher',
        confidence: patternResult.confidence,
        reasoning: patternResult.reasoning,
        latencyMs,
        error: null,
      }
    }

    // ---- Step 2: Speculative Drift ----
    const driftGuess = this.patternMatcher.guessTarget(query, snapshot)

    if (driftGuess.districtId && driftGuess.confidence > 0.3) {
      this.aiStoreActions.setDrift({
        active: true,
        targetDistrictId: driftGuess.districtId,
        confidence: driftGuess.confidence,
        startedAt: performance.now(),
      })
    }

    // ---- Step 3: Ollama via AIRouter ----
    this.aiStoreActions.setActiveRequest({
      id: crypto.randomUUID(),
      feature: 'camera-director-nl',
      query,
      startedAt: performance.now(),
      provider: null,
    })

    // Build context for Ollama.
    const spatialIndex = SpatialIndex.build(snapshot!, this.stationRegistry ?? undefined)
    const prompt = ContextAssembler.assemble(query, spatialIndex)

    // Route to Ollama.
    const aiResponse: AIResponse = await this.aiRouter.route({
      feature: 'camera-director-nl',
      input: {
        systemPrompt: prompt.systemMessage,
        userMessage: prompt.userMessage,
      },
      context: snapshot ?? undefined,
      timeout: 10_000,
    })

    // Clear active request.
    this.aiStoreActions.setActiveRequest(null)

    if (!aiResponse.success) {
      this.aiStoreActions.clearDrift()

      const latencyMs = Math.round(performance.now() - startTime)
      return {
        success: false,
        directive: null,
        provider: 'ollama',
        confidence: 0,
        reasoning: '',
        latencyMs,
        error: aiResponse.error ?? 'AI request failed.',
      }
    }

    // ---- Step 4: Parse and validate response ----
    const content = (aiResponse.result?.content as string) ?? ''
    const parsed = parseDirectiveResponse(content)

    if (!parsed.success || !parsed.directive) {
      this.aiStoreActions.clearDrift()

      const latencyMs = Math.round(performance.now() - startTime)
      return {
        success: false,
        directive: null,
        provider: 'ollama',
        confidence: 0,
        reasoning: '',
        latencyMs,
        error: parsed.error ?? 'Failed to parse AI response.',
      }
    }

    // ---- Step 5: Disambiguation check ----
    if (parsed.confidence < this.config.disambiguationThreshold && parsed.alternatives.length > 0) {
      // Check if the spread between top result and best alternative is small.
      const topConfidence = parsed.confidence
      // If alternatives exist and confidence is low, disambiguate.
      this.aiStoreActions.clearDrift()

      const candidates = [
        {
          districtId: this.extractDistrictId(parsed.directive) ?? 'agent-builder',
          displayName: parsed.reasoning,
          confidence: parsed.confidence,
          reason: parsed.reasoning,
        },
        ...parsed.alternatives.slice(0, 3).map((alt) => ({
          districtId: alt.targetId,
          displayName: alt.targetId,
          confidence: topConfidence - 0.1,
          reason: alt.reason,
        })),
      ]

      this.aiStoreActions.setDisambiguation(candidates)

      // Return partial result -- the disambiguation component will
      // call resolveDisambiguation() when the user chooses.
      const latencyMs = Math.round(performance.now() - startTime)
      return {
        success: true,
        directive: parsed.directive,
        provider: 'ollama',
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        latencyMs,
        error: null,
      }
    }

    // ---- Step 6: Execute directive ----
    this.aiStoreActions.clearDrift()
    await this.navigate(parsed.directive)

    // ---- Step 7: Generate receipt ----
    const latencyMs = Math.round(performance.now() - startTime)
    await this.generateReceipt(
      query,
      parsed.directive,
      'ollama',
      parsed.confidence,
      parsed.reasoning,
      parsed.alternatives.map((a) => `${a.targetId}: ${a.reason}`),
      latencyMs,
      aiResponse.modelId ?? null
    )

    this.aiStoreActions.recordAICost('ollama', 'camera-director-nl')

    return {
      success: true,
      directive: parsed.directive,
      provider: 'ollama',
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      latencyMs,
      error: null,
    }
  }

  /**
   * Resolve a disambiguation choice. Called by the DisambiguationStrip
   * when the user selects a candidate.
   */
  async resolveDisambiguation(districtId: string, originalQuery: string): Promise<void> {
    this.aiStoreActions.clearDisambiguation()

    const directive: CameraDirective = {
      target: { type: 'district', districtId: districtId as any },
      highlights: [districtId as any],
      narration: `User selected ${districtId} from disambiguation.`,
      source: 'ai',
    }

    await this.navigate(directive)

    await this.generateReceipt(
      originalQuery,
      directive,
      'ollama',
      1.0,
      'User disambiguated from multiple candidates.',
      [],
      0,
      null
    )
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private extractDistrictId(directive: CameraDirective): string | null {
    if (directive.target.type === 'district') {
      return directive.target.districtId
    }
    return null
  }

  private async generateReceipt(
    prompt: string,
    directive: CameraDirective,
    provider: 'pattern-matcher' | 'ollama',
    confidence: number,
    reasoning: string,
    alternatives: string[],
    latencyMs: number,
    modelId: string | null
  ): Promise<void> {
    const targetName = this.resolveTargetName(directive.target)

    const aiMetadata: AIReceiptMetadata = {
      prompt,
      reasoning,
      confidence,
      alternativesConsidered: alternatives,
      provider,
      latencyMs,
      modelId,
    }

    await this.receiptStore.record({
      source: 'launch',
      eventType: 'navigation',
      severity: 'info',
      summary: `AI Camera Director: navigated to ${targetName}`,
      detail: {
        directive,
        provider,
        confidence,
        modelId,
      },
      location: {
        semanticLevel: this.getSemanticLevel(),
        district: this.extractDistrictId(directive) as any,
        station: null,
      },
      actor: 'ai',
      aiMetadata,
    })
  }

  private resolveTargetName(target: CameraTarget): string {
    switch (target.type) {
      case 'district':
        return target.districtId
      case 'station':
        return `${target.districtId}/${target.stationId}`
      case 'home':
        return 'Launch Atrium'
      case 'constellation':
        return 'Constellation View'
      case 'position':
        return `(${target.position.offsetX}, ${target.position.offsetY})`
    }
  }
}
```

### 4.8 Live AI Router -- `src/lib/ai/live-ai-router.ts`

Production `AIRouter` implementation replacing the Phase 1 `StubAIRouter`. Routes requests to the appropriate provider per the routing table, with fallback chains and cost tracking.

```ts
/**
 * Live AI Router -- production implementation of the AIRouter interface.
 *
 * Replaces StubAIRouter from WS-1.7. Routes AI requests to the appropriate
 * provider based on the AI_ROUTING_TABLE from tech-decisions.md.
 *
 * Provider chain: pattern-matcher -> rule-engine -> Ollama -> Claude
 * Each feature has a primary + optional fallback. If primary fails,
 * fallback is attempted. If both fail, returns { success: false }.
 *
 * Phase 3 supports: pattern-matcher, rule-engine, ollama.
 * Phase 4 adds: claude.
 *
 * References: AD-7, tech-decisions.md (Feature-by-Feature AI Routing,
 * Cost Control), WS-1.7 AIRouter interface
 */

import type {
  AIRouter,
  AIFeature,
  AIProvider,
  AIRequest,
  AIResponse,
  AISessionCost,
  ProviderStatus,
  RoutingRule,
} from '@/lib/interfaces/ai-router'
import { AI_ROUTING_TABLE } from '@/lib/interfaces/ai-router'
import { OllamaProvider } from './ollama-provider'
import type { OllamaChatResult } from './ollama-provider'
// Note: OllamaProvider internally uses shared ollama-client.ts (WS-3.6) via native fetch

// ============================================================================
// Rate Limiter
// ============================================================================

interface RateLimit {
  readonly maxCalls: number
  readonly windowMs: number
}

const RATE_LIMITS: Partial<Record<AIFeature, RateLimit>> = {
  'camera-director-nl': { maxCalls: 1, windowMs: 3_000 },
  'narrated-telemetry-batch': { maxCalls: 10, windowMs: 60_000 },
} as const

// ============================================================================
// Live AI Router
// ============================================================================

export class LiveAIRouter implements AIRouter {
  private ollamaProvider: OllamaProvider
  private providerStatuses: Map<AIProvider, ProviderStatus> = new Map()
  private sessionCost: AISessionCost
  private callTimestamps: Map<AIFeature, number[]> = new Map()

  constructor(ollamaProvider: OllamaProvider) {
    this.ollamaProvider = ollamaProvider
    this.sessionCost = {
      totalCalls: 0,
      callsByProvider: {
        'pattern-matcher': 0,
        'rule-engine': 0,
        ollama: 0,
        claude: 0,
      },
      callsByFeature: {
        'camera-director-structured': 0,
        'camera-director-nl': 0,
        'station-template-selection': 0,
        'narrated-telemetry-batch': 0,
        'narrated-telemetry-deep': 0,
        'exception-triage': 0,
        'builder-mode': 0,
      },
      estimatedCostUsd: 0,
    }

    // Initialize provider statuses.
    this.providerStatuses.set('pattern-matcher', {
      provider: 'pattern-matcher',
      available: true,
      lastCheck: new Date().toISOString(),
      error: null,
    })
    this.providerStatuses.set('rule-engine', {
      provider: 'rule-engine',
      available: true,
      lastCheck: new Date().toISOString(),
      error: null,
    })
    this.providerStatuses.set('ollama', {
      provider: 'ollama',
      available: false,
      lastCheck: null,
      error: 'Not checked yet',
    })
    this.providerStatuses.set('claude', {
      provider: 'claude',
      available: false,
      lastCheck: null,
      error: 'Phase 4 -- not configured',
    })
  }

  async route(request: AIRequest): Promise<AIResponse> {
    const startTime = performance.now()

    // Check rate limit.
    if (this.isRateLimited(request.feature)) {
      return {
        success: false,
        provider: 'pattern-matcher',
        result: {},
        latencyMs: 0,
        fallbackUsed: false,
        error: `Rate limited: ${request.feature}. Please wait.`,
      }
    }

    // Find routing rule.
    const rule = this.getRoutingRule(request.feature)
    if (!rule) {
      return {
        success: false,
        provider: 'pattern-matcher',
        result: {},
        latencyMs: 0,
        fallbackUsed: false,
        error: `No routing rule for feature: ${request.feature}`,
      }
    }

    // Try primary provider.
    const primaryResult = await this.executeProvider(rule.primary, request)

    if (primaryResult.success) {
      this.recordCall(request.feature, rule.primary)
      return {
        ...primaryResult,
        latencyMs: Math.round(performance.now() - startTime),
        fallbackUsed: false,
      }
    }

    // Try fallback if available.
    if (rule.fallback) {
      const fallbackResult = await this.executeProvider(rule.fallback, request)

      this.recordCall(request.feature, rule.fallback)
      return {
        ...fallbackResult,
        latencyMs: Math.round(performance.now() - startTime),
        fallbackUsed: true,
      }
    }

    // No fallback. Return failure.
    return {
      success: false,
      provider: rule.primary,
      result: {},
      latencyMs: Math.round(performance.now() - startTime),
      fallbackUsed: false,
      error: primaryResult.error ?? `Provider ${rule.primary} failed with no fallback.`,
    }
  }

  isAvailable(feature: AIFeature): boolean {
    const rule = this.getRoutingRule(feature)
    if (!rule) return false

    const primaryStatus = this.providerStatuses.get(rule.primary)
    if (primaryStatus?.available) return true

    if (rule.fallback) {
      const fallbackStatus = this.providerStatuses.get(rule.fallback)
      return fallbackStatus?.available ?? false
    }

    return false
  }

  getProviderStatus(): readonly ProviderStatus[] {
    return Array.from(this.providerStatuses.values())
  }

  getRoutingRule(feature: AIFeature): RoutingRule | null {
    return AI_ROUTING_TABLE.find((r) => r.feature === feature) ?? null
  }

  getRoutingTable(): readonly RoutingRule[] {
    return AI_ROUTING_TABLE
  }

  getSessionCost(): AISessionCost {
    return { ...this.sessionCost }
  }

  /** Update Ollama provider status after a health check. */
  setOllamaAvailable(available: boolean, error: string | null): void {
    this.providerStatuses.set('ollama', {
      provider: 'ollama',
      available,
      lastCheck: new Date().toISOString(),
      error,
    })
  }

  // --------------------------------------------------------------------------
  // Private
  // --------------------------------------------------------------------------

  private async executeProvider(provider: AIProvider, request: AIRequest): Promise<AIResponse> {
    switch (provider) {
      case 'ollama': {
        const input = request.input as {
          systemPrompt: string
          userMessage: string
        }
        const result: OllamaChatResult = await this.ollamaProvider.chat(
          input.systemPrompt,
          input.userMessage
        )
        return {
          success: result.success,
          provider: 'ollama',
          result: { content: result.content },
          latencyMs: result.latencyMs,
          fallbackUsed: false,
          error: result.error ?? undefined,
          modelId: result.modelId,
        }
      }

      case 'pattern-matcher':
      case 'rule-engine':
        // These are handled directly by the caller (AICameraController)
        // before reaching the router. Returning not-available here.
        return {
          success: false,
          provider,
          result: {},
          latencyMs: 0,
          fallbackUsed: false,
          error: `Provider "${provider}" should be called directly, not via router.`,
        }

      case 'claude':
        return {
          success: false,
          provider: 'claude',
          result: {},
          latencyMs: 0,
          fallbackUsed: false,
          error: 'Claude API not configured. Available in Phase 4.',
        }
    }
  }

  private isRateLimited(feature: AIFeature): boolean {
    const limit = RATE_LIMITS[feature]
    if (!limit) return false

    const now = Date.now()
    const timestamps = this.callTimestamps.get(feature) ?? []
    const recent = timestamps.filter((t) => now - t < limit.windowMs)
    this.callTimestamps.set(feature, recent)

    return recent.length >= limit.maxCalls
  }

  private recordCall(feature: AIFeature, provider: AIProvider): void {
    const now = Date.now()
    const timestamps = this.callTimestamps.get(feature) ?? []
    timestamps.push(now)
    this.callTimestamps.set(feature, timestamps)

    this.sessionCost = {
      ...this.sessionCost,
      totalCalls: this.sessionCost.totalCalls + 1,
      callsByProvider: {
        ...this.sessionCost.callsByProvider,
        [provider]: this.sessionCost.callsByProvider[provider] + 1,
      },
      callsByFeature: {
        ...this.sessionCost.callsByFeature,
        [feature]: this.sessionCost.callsByFeature[feature] + 1,
      },
    }
  }
}
```

### 4.9 Ollama Proxy Route Handler -- `app/api/ai/chat/route.ts`

Next.js Route Handler that proxies AI requests to Ollama server-side.

```ts
/**
 * Ollama proxy route handler.
 *
 * Proxies chat completion requests to the local Ollama instance.
 * Keeps the Ollama connection server-side to avoid CORS issues.
 *
 * POST /api/ai/chat
 * Body: { model: string, systemPrompt: string, userMessage: string }
 * Response: { success: boolean, content: string, latencyMs: number, error?: string }
 *
 * References: tech-decisions.md (Ollama at localhost:11434)
 */

import { NextRequest, NextResponse } from 'next/server'
import { OllamaProvider, DEFAULT_OLLAMA_CONFIG } from '@/lib/ai/ollama-provider'

const provider = new OllamaProvider()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { systemPrompt, userMessage, model } = body as {
      systemPrompt: string
      userMessage: string
      model?: string
    }

    if (!systemPrompt || !userMessage) {
      return NextResponse.json(
        { success: false, error: 'Missing systemPrompt or userMessage.' },
        { status: 400 }
      )
    }

    if (model) {
      provider.setModel(model)
    }

    const result = await provider.chat(systemPrompt, userMessage)

    return NextResponse.json({
      success: result.success,
      content: result.content,
      latencyMs: result.latencyMs,
      modelId: result.modelId,
      error: result.error,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: `Server error: ${message}` }, { status: 500 })
  }
}

/**
 * GET /api/ai/chat -- Ollama health check.
 * Returns provider readiness and model availability.
 */
export async function GET() {
  const health = await provider.healthCheck()
  return NextResponse.json(health)
}
```

### 4.10 Speculative Drift Hook -- `src/hooks/use-speculative-drift.ts`

React hook that manages the speculative camera drift animation during Ollama inference.

```ts
/**
 * useSpeculativeDrift -- manages speculative camera drift during AI latency.
 *
 * When the AI Camera Director sends a query to Ollama (3-10s latency),
 * this hook starts a gentle camera drift toward the heuristic best-guess
 * target. The drift uses dampened spring physics (low stiffness, high
 * damping) so it feels exploratory rather than committed.
 *
 * When the real directive arrives:
 * - If drift target matches: seamlessly continue into final flyTo
 * - If drift target differs: smoothly redirect to the correct target
 * - If AI fails: gently return to original position
 *
 * References: Risk #5 mitigation (Ollama latency),
 * AD-1 (camera spring physics), AD-3 (physics tier)
 */

import { useEffect, useRef, useCallback } from 'react'
import { useAIStore } from '@/stores/ai.store'
import { useCameraStore } from '@/stores/camera.store'
import type { CameraPosition } from '@/lib/interfaces/types'

/** Drift spring config: gentle, exploratory motion. */
const DRIFT_SPRING = {
  stiffness: 60,
  damping: 40,
  mass: 1.5,
} as const

/** Maximum drift distance as fraction of full journey. */
const MAX_DRIFT_FRACTION = 0.35

export function useSpeculativeDrift() {
  const drift = useAIStore((s) => s.drift)
  const clearDrift = useAIStore((s) => s.clearDrift)
  const flyTo = useCameraStore((s) => s.flyTo)
  const cancelAnimation = useCameraStore((s) => s.cancelAnimation)
  const savedPositionRef = useRef<CameraPosition | null>(null)
  const frameIdRef = useRef<number | null>(null)

  const startDrift = useCallback(() => {
    if (!drift.active || !drift.targetDistrictId) return

    // Save current position for potential rollback.
    const store = useCameraStore.getState()
    savedPositionRef.current = {
      offsetX: store.offsetX,
      offsetY: store.offsetY,
      zoom: store.zoom,
    }

    // Start gentle flyTo toward the target district.
    // The ManualCameraController.DISTRICT_POSITIONS lookup happens
    // inside the camera store's flyTo method.
    flyTo(
      0,
      0, // Will be overridden by district position lookup
      store.zoom,
      {
        stiffness: DRIFT_SPRING.stiffness,
        damping: DRIFT_SPRING.damping,
        mass: DRIFT_SPRING.mass,
        restThreshold: 0.5,
      }
    )
  }, [drift.active, drift.targetDistrictId, flyTo])

  const cancelDrift = useCallback(() => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current)
      frameIdRef.current = null
    }
    cancelAnimation()
    clearDrift()
  }, [cancelAnimation, clearDrift])

  const rollbackDrift = useCallback(() => {
    if (savedPositionRef.current) {
      const pos = savedPositionRef.current
      flyTo(pos.offsetX, pos.offsetY, pos.zoom)
      savedPositionRef.current = null
    }
    clearDrift()
  }, [flyTo, clearDrift])

  // Start drift when drift state activates.
  useEffect(() => {
    if (drift.active && drift.targetDistrictId) {
      startDrift()
    }
  }, [drift.active, drift.targetDistrictId, startDrift])

  return {
    isDrifting: drift.active,
    driftTarget: drift.targetDistrictId,
    driftConfidence: drift.confidence,
    cancelDrift,
    rollbackDrift,
  }
}
```

### 4.11 Disambiguation Strip -- `src/components/ai/DisambiguationStrip.tsx`

Horizontal strip showing candidate destinations when the AI returns ambiguous results.

```tsx
/**
 * DisambiguationStrip -- UI for resolving ambiguous AI Camera Director queries.
 *
 * Appears below the command palette when the AI returns multiple candidates
 * with confidence spread < 0.2. Shows 2-4 candidates with district name,
 * health badge, and confidence score. User clicks to confirm, or the
 * highest-confidence option auto-selects after 5 seconds.
 *
 * Visual: glass material, horizontal layout, ember accent on hover.
 *
 * References: VISUAL-DESIGN-SPEC.md (glass material, ember accent)
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAIStore, type DisambiguationCandidate } from '@/stores/ai.store'
import { APP_DISPLAY_NAMES, type AppIdentifier } from '@/lib/interfaces/types'

interface DisambiguationStripProps {
  /** Called when the user selects a candidate. */
  onSelect: (districtId: string) => void
  /** Called when disambiguation is dismissed without selection. */
  onDismiss: () => void
}

export function DisambiguationStrip({ onSelect, onDismiss }: DisambiguationStripProps) {
  const disambiguation = useAIStore((s) => s.disambiguation)
  const clearDisambiguation = useAIStore((s) => s.clearDisambiguation)
  const autoSelectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-select the top candidate after timeout.
  useEffect(() => {
    if (!disambiguation.active || disambiguation.candidates.length === 0) return

    autoSelectTimerRef.current = setTimeout(() => {
      const top = disambiguation.candidates[0]
      if (top) {
        onSelect(top.districtId)
        clearDisambiguation()
      }
    }, disambiguation.autoSelectTimeoutMs)

    return () => {
      if (autoSelectTimerRef.current) {
        clearTimeout(autoSelectTimerRef.current)
      }
    }
  }, [
    disambiguation.active,
    disambiguation.candidates,
    disambiguation.autoSelectTimeoutMs,
    onSelect,
    clearDisambiguation,
  ])

  const handleSelect = useCallback(
    (districtId: string) => {
      if (autoSelectTimerRef.current) {
        clearTimeout(autoSelectTimerRef.current)
      }
      onSelect(districtId)
      clearDisambiguation()
    },
    [onSelect, clearDisambiguation]
  )

  const handleDismiss = useCallback(() => {
    if (autoSelectTimerRef.current) {
      clearTimeout(autoSelectTimerRef.current)
    }
    onDismiss()
    clearDisambiguation()
  }, [onDismiss, clearDisambiguation])

  return (
    <AnimatePresence>
      {disambiguation.active && disambiguation.candidates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <span
            className="mr-2 shrink-0 text-xs tracking-wider uppercase"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Did you mean:
          </span>

          {disambiguation.candidates.map((candidate, index) => (
            <motion.button
              key={candidate.districtId}
              onClick={() => handleSelect(candidate.districtId)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 transition-colors"
              style={{
                background: index === 0 ? 'rgba(224, 82, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border:
                  index === 0
                    ? '1px solid rgba(224, 82, 0, 0.2)'
                    : '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <span
                className="text-sm font-medium"
                style={{
                  color: index === 0 ? 'var(--color-ember-bright)' : 'var(--color-text-secondary)',
                }}
              >
                {APP_DISPLAY_NAMES[candidate.districtId as AppIdentifier] ?? candidate.districtId}
              </span>
              <span
                className="text-xs tabular-nums"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {Math.round(candidate.confidence * 100)}%
              </span>
            </motion.button>
          ))}

          <button
            onClick={handleDismiss}
            className="ml-auto cursor-pointer text-xs"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### 4.12 AI Beta Toggle -- `src/components/ai/AIBetaToggle.tsx`

Toggle switch for enabling/disabling AI features. Used in settings.

```tsx
/**
 * AIBetaToggle -- settings toggle for AI features.
 *
 * When off: "Ask AI..." does not appear in command palette.
 * When on: AI Camera Director, narrated telemetry, and station
 * selection AI features are available (if providers are ready).
 *
 * Persists to localStorage via the AI store.
 */

'use client'

import { useAIStore } from '@/stores/ai.store'

export function AIBetaToggle() {
  const betaEnabled = useAIStore((s) => s.betaEnabled)
  const setBetaEnabled = useAIStore((s) => s.setBetaEnabled)
  const ollamaReady = useAIStore((s) => s.ollamaReady)
  const ollamaError = useAIStore((s) => s.ollamaError)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            AI Features (Beta)
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Enable AI Camera Director and natural language commands
          </span>
        </div>
        <button
          onClick={() => setBetaEnabled(!betaEnabled)}
          className="relative h-5 w-10 cursor-pointer rounded-full transition-colors"
          style={{
            background: betaEnabled ? 'var(--color-ember)' : 'rgba(255, 255, 255, 0.08)',
          }}
          role="switch"
          aria-checked={betaEnabled}
          aria-label="Toggle AI features"
        >
          <span
            className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
            style={{
              background: 'var(--color-text-primary)',
              transform: betaEnabled ? 'translateX(22px)' : 'translateX(2px)',
            }}
          />
        </button>
      </div>

      {betaEnabled && (
        <div
          className="flex items-center gap-2 rounded px-2 py-1 text-xs"
          style={{
            background: ollamaReady ? 'rgba(34, 197, 94, 0.08)' : 'rgba(234, 179, 8, 0.08)',
            color: ollamaReady ? 'var(--status-success)' : 'var(--status-warning)',
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: ollamaReady ? 'var(--status-success)' : 'var(--status-warning)',
            }}
          />
          {ollamaReady ? 'Ollama connected' : (ollamaError ?? 'Checking Ollama...')}
        </div>
      )}
    </div>
  )
}
```

---

## 5. Acceptance Criteria

| ID    | Criterion                                                                                                                                                                                                    | Verification Method                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Pattern matcher resolves `go core`, `home`, `show alerts`, `open chat` into correct `CameraDirective` targets in < 5ms                                                                                       | Unit test: call `PatternMatcherProvider.match()` with each command, assert `matched === true` and correct `target.districtId`; measure `performance.now()` delta              |
| AC-2  | Pattern matcher resolves all SYNONYM_RING entries (e.g., `go builder`, `show AB`, `take me to manufacturing`) to the correct district                                                                        | Unit test: iterate all synonym entries, construct `go {synonym}` queries, assert correct `AppIdentifier` resolution                                                           |
| AC-3  | Alert-focused queries (`where are the errors?`, `what's broken?`) navigate to the district with the highest `alertCount` in the current `SystemSnapshot`                                                     | Unit test: create a mock `SystemSnapshot` with Agent Builder at 5 alerts and Project Room at 2 alerts; assert `match()` returns `agent-builder` as target                     |
| AC-4  | Ollama provider connects to `localhost:11434`, verifies model availability via `/api/tags`, and returns structured health check result                                                                       | Integration test: with Ollama running locally, call `healthCheck()` and assert `reachable === true`; with Ollama stopped, assert `reachable === false` with descriptive error |
| AC-5  | Ollama chat completion returns valid JSON that parses into a `CameraDirective` via the Zod schema                                                                                                            | Integration test: send a known query ("show me the app with errors") with a mock `SystemSnapshot` to Ollama; validate response parses without Zod errors                      |
| AC-6  | Camera directive schema rejects malformed JSON, missing fields, and invalid district IDs gracefully (returns `{ success: false }` with descriptive error, no thrown exceptions)                              | Unit test: pass malformed JSON strings, missing `target_type`, invalid `target_id` values to `parseDirectiveResponse()`; assert all return `success: false`                   |
| AC-7  | Speculative drift begins within 300ms of an Ollama query being sent, using the heuristic target from `PatternMatcherProvider.guessTarget()`                                                                  | Functional test: trigger an AI query; observe camera position changes within 300ms; verify drift direction matches the heuristic guess                                        |
| AC-8  | Speculative drift uses dampened spring (stiffness 60, damping 40) and never moves more than 35% of the full journey distance                                                                                 | Unit test: validate spring config constants; functional test: measure drift distance after 3s and assert < 35% of total distance to target                                    |
| AC-9  | When Ollama response arrives and matches drift target, camera smoothly completes the journey (no visible snap or direction change)                                                                           | Visual test: compare camera trajectory with and without drift; assert no discontinuity in position/velocity at the transition point                                           |
| AC-10 | When Ollama response arrives and differs from drift target, camera smoothly redirects to the correct target (no jarring motion)                                                                              | Visual test: force drift toward District A, return directive for District B; observe smooth redirection                                                                       |
| AC-11 | Disambiguation strip appears when AI confidence < 0.7 and alternatives exist, showing 2-4 candidates with district names and confidence percentages                                                          | Functional test: mock Ollama response with confidence 0.5 and 3 alternatives; verify strip renders with correct content                                                       |
| AC-12 | Disambiguation auto-selects the top candidate after 5 seconds if the user does not choose                                                                                                                    | Functional test: trigger disambiguation; wait 5s; verify the top candidate was selected and navigation executed                                                               |
| AC-13 | Every AI Camera Director action generates a `LaunchReceipt` with all `AIReceiptMetadata` fields populated: `prompt`, `reasoning`, `confidence`, `alternativesConsidered`, `provider`, `latencyMs`, `modelId` | Unit test: execute `interpretAndNavigate()`; inspect the receipt passed to `ReceiptStore.record()`; assert all 7 AI metadata fields are non-null                              |
| AC-14 | AI beta toggle persists to `localStorage` under key `tarva-launch-ai-beta` and controls visibility of "Ask AI..." in command palette                                                                         | Functional test: toggle on, reload page, verify toggle state; toggle off, verify "Ask AI..." disappears from palette                                                          |
| AC-15 | When Ollama is unreachable, `interpretAndNavigate()` returns `{ success: false }` with descriptive error; no unhandled exceptions; command palette shows "AI unavailable" inline message                     | Integration test: stop Ollama; call `interpretAndNavigate()`; assert graceful failure and error message                                                                       |
| AC-16 | When AI beta toggle is off, `AICameraController` delegates all calls to `ManualCameraController` unchanged; no AI code paths execute                                                                         | Unit test: disable beta; call `navigate()`, `panBy()`, `zoomTo()`; verify delegation to manual controller                                                                     |
| AC-17 | `LiveAIRouter` respects rate limits: camera-director-nl limited to 1 call per 3s                                                                                                                             | Unit test: call `route()` twice within 2s for `camera-director-nl`; assert second call returns `{ success: false }` with rate-limit error                                     |
| AC-18 | `LiveAIRouter` falls back from Ollama to Claude (Phase 4 stub) when Ollama fails, per the routing table                                                                                                      | Unit test: set Ollama unavailable; route `camera-director-nl`; assert fallback attempted to `claude` provider                                                                 |
| AC-19 | Ollama proxy route handler (`POST /api/ai/chat`) validates input, proxies to Ollama, and returns structured response                                                                                         | Integration test: POST valid payload; assert 200 with `success: true`; POST invalid payload; assert 400                                                                       |
| AC-20 | Ollama health check route (`GET /api/ai/chat`) returns model availability status                                                                                                                             | Integration test: GET endpoint; assert response includes `reachable` and `modelAvailable` fields                                                                              |
| AC-21 | `SpatialIndex.build()` includes all 6 districts with current health, alert counts, and station names from the `SystemSnapshot`                                                                               | Unit test: build index from mock snapshot; assert 6 districts with correct field values                                                                                       |
| AC-22 | Context assembler produces a prompt under 2000 estimated tokens                                                                                                                                              | Unit test: build prompt from a full `SpatialIndex`; assert `estimatedTokens < 2000`                                                                                           |
| AC-23 | End-to-end latency for pattern-matched queries is < 50ms (from `interpretAndNavigate()` call to receipt generation)                                                                                          | Performance test: time 100 pattern-matched queries; assert p95 < 50ms                                                                                                         |
| AC-24 | `zod` dependency added to `package.json`; TypeScript strict mode passes with zero errors across all new files                                                                                                | Build verification: `pnpm tsc --noEmit` returns 0 errors                                                                                                                      |

---

## 6. Decisions Made

| ID   | Decision                                                                                    | Rationale                                                                                                                                                                                                                                                                  | Source                                                 |
| ---- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| D-1  | Pattern matcher handles structured commands directly (not via Ollama)                       | Instant response (< 5ms) for 60%+ of queries. No network dependency. Per tech-decisions.md: "camera-director-structured: pattern-matcher, no fallback needed."                                                                                                             | tech-decisions.md routing table                        |
| D-2  | Speculative drift uses dampened spring (stiffness 60, damping 40) limited to 35% of journey | Must feel exploratory, not committed. If the drift target is wrong, the camera must redirect smoothly without jarring motion. 35% cap ensures the redirect distance is always short enough to feel natural.                                                                | AD-1 spring physics, Risk #5                           |
| D-3  | Disambiguation threshold set at confidence < 0.7                                            | Below 0.7, the AI is uncertain enough that the user should confirm. Above 0.7, the AI is confident enough to navigate directly. Threshold is configurable via `CameraDirectorConfig`.                                                                                      | Design judgment                                        |
| D-4  | Disambiguation auto-selects after 5 seconds                                                 | Prevents the strip from blocking the interface indefinitely. 5 seconds is long enough for a user to scan 2-4 options. Timer is configurable.                                                                                                                               | UX heuristic                                           |
| D-5  | Ollama JSON mode (`format: 'json'`) for structured output                                   | Ollama supports native JSON mode which constrains output to valid JSON. This eliminates most parsing failures. Combined with the Zod schema, this provides robust response validation.                                                                                     | Ollama API docs                                        |
| D-6  | `zod` added as a new dependency for schema validation                                       | Lightweight (12KB gzipped), TypeScript-native, MIT licensed. Preferred over manual JSON validation for maintainability and type inference. Aligns with free/open-source constraint.                                                                                        | tech-decisions.md (licensing constraint)               |
| D-7  | Context assembler targets < 2000 tokens                                                     | Smaller prompts = faster Ollama inference. The Camera Director needs spatial context (which districts exist, their health/alerts) but not deep telemetry details. 2000 tokens is sufficient for 6 districts with 3-5 stations each plus the response format specification. | Performance optimization                               |
| D-8  | Ollama proxied via Next.js Route Handler (not direct client-side fetch)                     | Keeps Ollama connection server-side, avoiding CORS configuration requirements on Ollama. Consistent with the existing telemetry aggregator pattern (GET /api/telemetry). Enables server-side request logging.                                                              | AD-9 (Route Handler pattern), tech-decisions.md        |
| D-9  | AI store uses `localStorage` for beta toggle (not `sessionStorage`)                         | The beta toggle is a user preference that should persist across sessions and tabs, unlike the session key (which is per-tab). `sessionStorage` would require re-enabling on every new tab.                                                                                 | AD-7 (graceful degradation -- user explicitly opts in) |
| D-10 | Camera Director rate-limited to 1 Ollama call per 3 seconds                                 | Prevents rapid-fire queries from overwhelming Ollama (single-user local model). Per tech-decisions.md cost controls. Pattern-matched queries have no rate limit (they are free).                                                                                           | tech-decisions.md (Cost Control)                       |
| D-11 | `motion/react` (not `framer-motion`) for disambiguation strip and drift animations          | Per project constraint: `motion/react` is the current package name for Framer Motion v12+. Using `framer-motion` import would fail.                                                                                                                                        | tech-decisions.md, project constraints                 |
| D-12 | Ollama health check runs every 60s (not on every query)                                     | Reduces unnecessary network calls. The health state is cached in the AI store. If a query fails due to Ollama being down, the error is caught and surfaced inline -- the periodic check just keeps the status indicator current.                                           | Performance optimization                               |

---

## 7. Open Questions

| ID   | Question                                                                                                                                         | Owner            | Impact                                                                                                                                                       | Default if Unresolved                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| OQ-1 | Which Ollama model should be the default? `llama3.2` (3B, faster) or `llama3.2:latest` (8B, better reasoning)?                                   | Stakeholder      | Affects inference latency and response quality. 3B: ~2-4s, 8B: ~5-10s.                                                                                       | Default to `llama3.2` (3B) for speed; document how to switch in settings                                                        |
| OQ-2 | Should the speculative drift be visible (camera actually moves) or invisible (pre-computation only, camera stays still until directive arrives)? | Stakeholder + UX | Visible drift is the "eye candy" approach but may feel disconcerting if it drifts the wrong way. Invisible drift is safer but loses the responsiveness feel. | Visible drift at 35% max, per the current design -- aligns with "eye candy first" directive                                     |
| OQ-3 | Should the disambiguation strip show health badges (colored dots) next to district names?                                                        | UX               | Adds visual richness and helps the user choose (they can see which district is healthy vs degraded). Adds rendering complexity.                              | Yes -- include health badges. Aligns with "eye candy first" and adds decision-relevant context.                                 |
| OQ-4 | Should the Camera Director also handle station-level navigation (e.g., "show me the pipeline in Agent Builder")?                                 | Architecture     | Adds complexity to the pattern matcher, context assembler, and directive schema. Station-level navigation requires the morph choreography from WS-2.1.       | Phase 3: district-level only. Phase 4+: extend to station-level after the pattern is proven.                                    |
| OQ-5 | Should failed AI queries (Ollama timeout, parse error) generate receipts?                                                                        | Architecture     | Receipts for failures create an audit trail of AI reliability. But they add noise to the Evidence Ledger.                                                    | Yes -- generate receipts for failures with `severity: 'warning'` and `eventType: 'error'`. Useful for debugging AI integration. |

---

## 8. Risk Register

| #    | Risk                                                                                                       | Likelihood | Impact | Severity | Blocking? | Mitigation                                                                                                                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-1  | Ollama response latency exceeds 10s timeout, causing perceived unresponsiveness                            | High       | Medium | High     | No        | Speculative drift provides immediate visual feedback. Timeout at 10s returns graceful failure. Pattern matcher handles 60%+ of queries instantly. User can press Escape to cancel.                                             |
| R-2  | Ollama returns malformed JSON despite `format: 'json'` mode                                                | Medium     | Medium | Medium   | No        | Zod schema validation catches all malformed responses. `parseDirectiveResponse()` returns `{ success: false }` with descriptive error. Never throws. Fallback to pattern matcher suggestion.                                   |
| R-3  | Ollama returns valid JSON but semantically incorrect directive (navigates to wrong district)               | Medium     | Low    | Low      | No        | Confidence score in the response allows disambiguation for uncertain results. All AI actions generate receipts with the full prompt and reasoning for debugging. Users can Escape and retry.                                   |
| R-4  | Speculative drift goes in the wrong direction, creating a jarring redirect when the real directive arrives | Medium     | Medium | Medium   | No        | Drift limited to 35% of journey distance. Dampened spring physics ensures smooth redirection. The redirect animation uses the same spring physics as normal flyTo, so it feels natural.                                        |
| R-5  | Ollama not installed or required model not pulled on the developer machine                                 | High       | Medium | Medium   | No        | Health check on startup detects this. Clear error message in command palette: "Ollama not found. Install from ollama.ai" or "Model not found. Run: ollama pull llama3.2". AI beta toggle defaults to off.                      |
| R-6  | `zod` dependency conflicts with existing project dependencies                                              | Low        | Low    | Low      | No        | `zod` has zero dependencies. Version conflicts are unlikely. If they occur, pin the version in `package.json`.                                                                                                                 |
| R-7  | Ollama's CORS configuration blocks client-side requests                                                    | Medium     | Low    | Low      | No        | Already mitigated: all Ollama requests go through the Next.js Route Handler (server-side). No client-side Ollama requests.                                                                                                     |
| R-8  | Rate limiter (1 call/3s) frustrates users who type multiple queries quickly                                | Low        | Low    | Low      | No        | Pattern-matched queries are not rate-limited (instant). Only Ollama queries are limited. The rate limit error message says "Please wait" rather than rejecting silently. 3s window is configurable.                            |
| R-9  | Context assembler prompt exceeds 2000 tokens when all 6 districts have rich telemetry data                 | Low        | Low    | Low      | No        | The assembler uses concise formatting (1-2 lines per district). Even with all stations listed, the prompt stays under 1500 tokens. If it grows, truncate station descriptions first.                                           |
| R-10 | AI receipts create excessive noise in the Evidence Ledger                                                  | Low        | Low    | Low      | No        | AI receipts are tagged with `actor: 'ai'` which enables filtering in the Evidence Ledger (WS-3.2). The compressed timeline strip (Z2) uses amber color for AI entries, visually distinguishing them from human actions (blue). |
