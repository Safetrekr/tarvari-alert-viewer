# WS-3.6: Narrated Telemetry

> **Workstream ID:** WS-3.6
> **Phase:** 3 -- Receipts + Command Palette + AI
> **Assigned Agent:** `world-class-autonomous-interface-architect`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.5 (telemetry aggregator), WS-1.7 (SystemStateProvider, AIRouter), WS-3.4 (shared Ollama integration / AIRouter implementation), WS-2.2-2.5 (district station components), WS-2.6 (station panel framework)
> **Blocks:** WS-4.4 (Visual Polish Pass -- narration panel styling refinement)
> **Resolves:** Risk #5 (Ollama response latency -- narrations are pre-generated, no user-facing wait)

---

## 1. Objective

Implement AI-narrated telemetry for Tarva Launch: a background service that generates natural language interpretations of system metrics on a 30-second cadence using Ollama, a cache layer that stores narrations per app, and an on-focus display component that surfaces the narration when the user navigates to a district or station. Each narration answers three questions: "what changed, why it matters, what to do next."

The narration system is the bridge between raw telemetry data (numbers, status codes, response times) and human understanding. Rather than asking the operator to mentally compare sparkline trends and alert counts across 6 apps, the AI reads the SystemSnapshot, computes deltas against the previous cycle, and produces a calm, concise summary that reduces cognitive load.

**Success looks like:** The user zooms into the Agent Builder district and sees, below the status station heading, a narration panel that reads: "Agent Builder has been stable for 45 minutes. Response times improved 12% since the last cycle. No action needed." When Project Room goes DOWN, the next narration cycle produces: "Project Room stopped responding 30 seconds ago after 2 hours of stable operation. This may indicate a process crash -- check the terminal for errors." The narration is already cached and ready before the user even navigates there. If Ollama is not running, no narration panel appears -- the UI degrades gracefully to the standard telemetry display with no error messages or broken states.

**Traceability:** combined-recommendations.md "AI Features (Phase 3)" bullet 3; more-for-ui.md point 3 ("Narrated telemetry -- AI turns signal into a calm story"); AD-7 (AI Integration Architecture -- three-layer intelligence model, graceful degradation); tech-decisions.md Feature-by-Feature AI Routing table (`narrated-telemetry-batch`: Ollama primary, Claude fallback; `narrated-telemetry-deep`: Claude primary, Ollama fallback); WS-1.7 `AIFeature` type (`narrated-telemetry-batch`, `narrated-telemetry-deep`).

---

## 2. Scope

### In Scope

- **Ollama client service** (`src/lib/ai/ollama-client.ts`): **[Confirmed as canonical per Phase 3 Review H-1]** HTTP client for `localhost:11434` that wraps the Ollama REST API (`/api/generate`, `/api/tags`, health check) using native `fetch()`. This is the single shared Ollama client for all AI workstreams (WS-3.4, WS-3.5, WS-3.6). WS-3.4's `OllamaProvider` class wraps these functions. Includes model availability detection, timeout handling, and structured response parsing.
- **Narration types** (`src/lib/ai/narration-types.ts`): TypeScript types for `Narration`, `NarrationCache`, `NarrationRequest`, `NarrationResult`, `AppDelta`, and `NarrationCycleStatus`.
- **Narration prompt templates** (`src/lib/ai/narration-prompts.ts`): System prompt and per-app prompt builder functions that assemble Ollama input from a `SystemSnapshot` and the previous snapshot's delta. Includes the "what changed, why it matters, what to do next" output structure.
- **Narration Route Handler** (`src/app/api/narrate/route.ts`): Server-side POST endpoint that accepts a `NarrationRequest` (app ID + snapshot context), calls Ollama, parses the response into a structured `NarrationResult`, and returns it. Server-side execution avoids CORS with Ollama's localhost endpoint.
- **Narration service** (`src/lib/ai/narration-service.ts`): Background narration generation orchestrator. Runs on a 30-second cadence. Computes deltas between current and previous snapshots. Identifies which apps have meaningful changes worth narrating. Calls the narration Route Handler for each changed app. Respects the rate limit of 10 calls per minute. Skips apps with no meaningful delta to conserve Ollama capacity.
- **Narration store** (`src/stores/narration.store.ts`): Zustand store with immer middleware. Caches narrations keyed by `AppIdentifier`. Tracks narration freshness, generation timestamps, and cycle status. Provides selectors for per-app narration lookup.
- **Background narration cycle hook** (`src/hooks/use-narration-cycle.ts`): Client-side hook that starts the 30-second narration cycle on mount, reads from the `SystemStateProvider`, and feeds results into the narration store. Checks Ollama availability on startup and periodically. Pauses the cycle when Ollama is unreachable.
- **Narration consumer hook** (`src/hooks/use-narration.ts`): Hook for district/station components to read the cached narration for a specific app. Returns the narration text, freshness, loading state, and a `requestDeepDive()` function for on-demand deep analysis.
- **NarrationPanel display component** (`src/components/telemetry/narration-panel.tsx`): UI component that renders the three-part narration (what changed / why it matters / what to do next) with the Oblivion glass material aesthetic. Displays only when a narration is available. Includes a "last updated" relative timestamp and a "Deep dive" button for detailed analysis. Entrance animation via `motion/react`.
- **NarrationSkeleton component** (`src/components/telemetry/narration-skeleton.tsx`): Loading placeholder shown during the first narration cycle before any narrations are cached. Three pulsing lines matching the narration panel dimensions.
- **Deep-dive narration flow**: On-demand detailed analysis triggered by user action. Routes through `AIRouter` as `narrated-telemetry-deep` (Claude primary, Ollama fallback per routing table). Generates a receipt for the AI action. Replaces the batch narration in the panel temporarily.
- **Graceful degradation**: If Ollama is unavailable, the narration panel is not rendered. No error states, no loading spinners that never resolve, no broken layouts. The district/station components check `isNarrationAvailable` before rendering the panel.
- **Receipt generation**: Every narration generation (batch and deep-dive) produces an AI receipt via `ReceiptStore` with full AI metadata (prompt, reasoning, confidence, provider, latency).
- **Barrel exports** from `src/lib/ai/index.ts` and updated `src/components/telemetry/index.ts`.

### Out of Scope

- **AI Camera Director** -- WS-3.4. That workstream consumes the shared Ollama client from this workstream but implements its own prompt logic, camera directive parsing, and speculative drift behavior.
- **Station template selection** -- WS-3.5. The narration service does not choose which stations to display.
- **Exception triage** -- WS-4.2. Classification of failures into transient/permanent/policy/missing-info is a separate AI feature.
- **Claude API SDK integration** -- WS-4.1. The deep-dive narration routes through `AIRouter`; the actual Claude provider implementation is WS-4.1's responsibility. This workstream implements the Ollama provider only and stubs the Claude path via `AIRouter.route()`.
- **Supabase persistence of narrations** -- Narrations are cached in-memory only. They are ephemeral by design -- regenerated every 30 seconds. Historical narrations are not stored.
- **Natural language command parsing** -- WS-3.3 (Command Palette). The narration system does not accept user text input.
- **Attention choreography** -- WS-3.7. The narration system does not influence ambient motion or effect intensity.

---

## 3. Input Dependencies

| Dependency                      | Source                     | What It Provides                                                                                                                                                  | Status                          |
| ------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `SystemStateProvider` interface | WS-1.7                     | `SystemSnapshot`, `AppState`, `GlobalMetrics` types; `getSnapshot()`, `subscribe()` methods; Phase 1 `PollingSystemStateProvider` implementation                  | Required                        |
| `AIRouter` interface            | WS-1.7                     | `AIFeature` (`narrated-telemetry-batch`, `narrated-telemetry-deep`), `AIRequest`, `AIResponse` types; `route()` and `isAvailable()` methods                       | Required                        |
| `ReceiptStore` interface        | WS-1.7                     | `ReceiptStore.record()` method, `ReceiptInput`, `AIReceiptMetadata` types                                                                                         | Required                        |
| Shared domain types             | WS-1.7                     | `AppIdentifier`, `ALL_APP_IDS`, `APP_DISPLAY_NAMES`, `HealthState`, `ISOTimestamp`, `Unsubscribe`                                                                 | Required                        |
| Telemetry aggregator            | WS-1.5                     | `GET /api/telemetry` Route Handler providing `SystemSnapshot` JSON; `useTelemetry()` hook; `districts.store` with `AppTelemetry` per app                          | Required                        |
| AI routing table                | WS-1.7 / tech-decisions.md | `AI_ROUTING_TABLE` with `narrated-telemetry-batch` (Ollama primary, Claude fallback) and `narrated-telemetry-deep` (Claude primary, Ollama fallback) rules        | Finalized                       |
| Station panel framework         | WS-2.6                     | `StationPanel` component, glass material CSS, receipt stamp hook (`useReceiptStamp`)                                                                              | Required                        |
| District station components     | WS-2.2-2.5                 | Status stations in each district where the `NarrationPanel` will be rendered                                                                                      | Required                        |
| Design tokens                   | WS-0.2                     | Glass material tokens (`--glass-*`), text color tokens (`--color-text-*`), ember/teal accent tokens, duration tokens (`--duration-*`), easing tokens (`--ease-*`) | Required                        |
| Framer Motion                   | npm `motion`               | `motion/react` for entrance/exit animations on `NarrationPanel`                                                                                                   | Required                        |
| Ollama at `localhost:11434`     | System prerequisite        | Running Ollama instance with a compatible model (llama3.2 or equivalent)                                                                                          | Optional (graceful degradation) |
| `@tarva/ui` components          | npm `@tarva/ui`            | `Card`, `Button`, `Badge`, `Tooltip` for NarrationPanel rendering                                                                                                 | Required                        |

---

## 4. Deliverables

### 4.1 Narration Types -- `src/lib/ai/narration-types.ts`

Central type definitions for the narration system.

```ts
/**
 * Narration types for Tarva Launch AI-narrated telemetry.
 *
 * The narration system generates natural language interpretations of
 * system metrics on a 30-second cadence. Each narration answers three
 * questions: "what changed, why it matters, what to do next."
 *
 * References:
 * - combined-recommendations.md "AI Features (Phase 3)" bullet 3
 * - more-for-ui.md point 3 ("Narrated telemetry")
 * - tech-decisions.md AI routing table
 * - WS-1.7 AIFeature types
 */

import type { AppIdentifier, ISOTimestamp, HealthState } from '@/lib/interfaces/types'

// ============================================================================
// Narration Content
// ============================================================================

/**
 * A single narration for one app. The three-part structure maps directly
 * to the UX requirement: "what changed, why it matters, what to do next."
 */
export interface Narration {
  /** Which app this narration describes. */
  readonly appId: AppIdentifier
  /** What changed since the last narration cycle. */
  readonly whatChanged: string
  /** Why the change matters to the operator. */
  readonly whyItMatters: string
  /** Recommended next action (or "No action needed"). */
  readonly whatToDoNext: string
  /** When this narration was generated. */
  readonly generatedAt: ISOTimestamp
  /** Which AI provider generated this narration. */
  readonly provider: 'ollama' | 'claude' | 'none'
  /** Model ID used (e.g., "llama3.2"). Null for non-LLM. */
  readonly modelId: string | null
  /** Generation latency in milliseconds. */
  readonly latencyMs: number
  /** Whether this is a deep-dive narration (user-requested). */
  readonly isDeepDive: boolean
  /**
   * Confidence score (0.0 to 1.0) indicating how certain the AI
   * is about the interpretation. Null if provider doesn't report it.
   */
  readonly confidence: number | null
}

// ============================================================================
// Delta Computation
// ============================================================================

/**
 * Computed difference between two snapshots for a single app.
 * Used as input to the narration prompt.
 */
export interface AppDelta {
  /** Which app this delta describes. */
  readonly appId: AppIdentifier
  /** Display name for prompt context. */
  readonly displayName: string
  /** Previous health state (or null if first cycle). */
  readonly previousHealth: HealthState | null
  /** Current health state. */
  readonly currentHealth: HealthState
  /** Whether health state changed. */
  readonly healthChanged: boolean
  /** Previous alert count. */
  readonly previousAlertCount: number
  /** Current alert count. */
  readonly currentAlertCount: number
  /** Change in alert count (positive = more alerts). */
  readonly alertCountDelta: number
  /** Previous response time in ms (or null). */
  readonly previousResponseTimeMs: number | null
  /** Current response time in ms (or null). */
  readonly currentResponseTimeMs: number | null
  /** Response time change percentage (positive = slower). Null if insufficient data. */
  readonly responseTimeDeltaPercent: number | null
  /** Previous uptime in seconds (or null). */
  readonly previousUptime: number | null
  /** Current uptime in seconds (or null). */
  readonly currentUptime: number | null
  /** Whether this app has any meaningful change worth narrating. */
  readonly hasMeaningfulChange: boolean
  /** Human-readable pulse string (e.g., "3 runs active"). */
  readonly pulse: string
  /** Time since last meaningful activity in ms (or null). */
  readonly freshnessMs: number | null
  /** Raw sub-check results for detailed narration. */
  readonly checks: Record<string, string>
}

// ============================================================================
// Narration Request / Response
// ============================================================================

/**
 * Input to the narration Route Handler (POST /api/narrate).
 */
export interface NarrationRequest {
  /** Which app to narrate. */
  readonly appId: AppIdentifier
  /** Computed delta for this app (current vs previous cycle). */
  readonly delta: AppDelta
  /** Whether this is a deep-dive request (user-initiated, more detailed). */
  readonly deepDive: boolean
  /** Optional: previous narration text for continuity. */
  readonly previousNarration?: string
}

/**
 * Output from the narration Route Handler.
 */
export interface NarrationResult {
  /** Whether narration generation succeeded. */
  readonly success: boolean
  /** The generated narration (null if failed). */
  readonly narration: Narration | null
  /** Error message if failed. */
  readonly error?: string
}

// ============================================================================
// Narration Cache
// ============================================================================

/**
 * Per-app narration cache entry in the narration store.
 */
export interface NarrationCacheEntry {
  /** The most recent batch narration (30s cadence). */
  readonly batchNarration: Narration | null
  /** A deep-dive narration if the user has requested one (replaces batch temporarily). */
  readonly deepDiveNarration: Narration | null
  /** Whether a narration is currently being generated for this app. */
  readonly isGenerating: boolean
  /** Whether a deep-dive is currently being generated for this app. */
  readonly isDeepDiveGenerating: boolean
}

// ============================================================================
// Cycle Status
// ============================================================================

/**
 * Overall status of the narration background cycle.
 */
export interface NarrationCycleStatus {
  /** Whether the narration cycle is currently running. */
  readonly isRunning: boolean
  /** Whether Ollama is reachable. */
  readonly ollamaAvailable: boolean
  /** Which model is being used. Null if Ollama is unavailable. */
  readonly modelId: string | null
  /** Timestamp of the last completed cycle. Null if no cycle has run. */
  readonly lastCycleAt: ISOTimestamp | null
  /** Number of apps narrated in the last cycle. */
  readonly lastCycleAppCount: number
  /** Total narrations generated this session. */
  readonly totalNarrations: number
  /** Average generation latency in ms across all narrations this session. */
  readonly averageLatencyMs: number
}

// ============================================================================
// Ollama Types (shared with WS-3.4)
// ============================================================================

/**
 * Ollama /api/generate request body.
 * Subset of the full Ollama API -- only the fields we use.
 */
export interface OllamaGenerateRequest {
  /** Model name (e.g., "llama3.2"). */
  readonly model: string
  /** The prompt to send. */
  readonly prompt: string
  /** System prompt for context. */
  readonly system?: string
  /** Whether to stream the response. Always false for narration. */
  readonly stream: false
  /** Generation options. */
  readonly options?: {
    /** Temperature (0.0 = deterministic, 1.0 = creative). */
    readonly temperature?: number
    /** Maximum tokens to generate. */
    readonly num_predict?: number
    /** Top-p sampling. */
    readonly top_p?: number
  }
  /** Response format. "json" for structured output. */
  readonly format?: 'json'
}

/**
 * Ollama /api/generate response body (non-streaming).
 */
export interface OllamaGenerateResponse {
  /** The model that generated the response. */
  readonly model: string
  /** The generated text. */
  readonly response: string
  /** Whether generation is complete. Always true for non-streaming. */
  readonly done: boolean
  /** Total generation duration in nanoseconds. */
  readonly total_duration?: number
  /** Time to load the model in nanoseconds. */
  readonly load_duration?: number
  /** Number of tokens in the prompt. */
  readonly prompt_eval_count?: number
  /** Number of tokens generated. */
  readonly eval_count?: number
}

/**
 * Ollama /api/tags response body (model listing).
 */
export interface OllamaTagsResponse {
  readonly models: readonly {
    readonly name: string
    readonly size: number
    readonly digest: string
    readonly modified_at: string
  }[]
}
```

### 4.2 Ollama Client -- `src/lib/ai/ollama-client.ts`

Shared HTTP client for Ollama. Used by both WS-3.6 (narrated telemetry) and WS-3.4 (AI Camera Director). Wraps the Ollama REST API with TypeScript types, timeout handling, and health checking.

```ts
/**
 * Ollama HTTP client for Tarva Launch.
 *
 * Shared between WS-3.6 (Narrated Telemetry) and WS-3.4 (AI Camera Director).
 * Communicates with Ollama at localhost:11434 via its REST API.
 *
 * This client does NOT use the `ollama` npm package -- it uses native fetch
 * to keep the dependency surface minimal and to run in both client and
 * server contexts. However, narration calls route through a Route Handler
 * (POST /api/narrate) to avoid CORS issues from client-side fetch to
 * localhost:11434.
 *
 * References:
 * - tech-decisions.md AI Integration table
 * - Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import type {
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaTagsResponse,
} from './narration-types'

// ============================================================================
// Configuration
// ============================================================================

/** Ollama server base URL. Per TARVA-SYSTEM-OVERVIEW.md. */
export const OLLAMA_BASE_URL = 'http://localhost:11434'

/** Default model for narration and camera direction. */
export const OLLAMA_DEFAULT_MODEL = 'llama3.2'

/** Timeout for Ollama API calls in milliseconds. */
export const OLLAMA_TIMEOUT_MS = 30_000

/** Timeout for health checks in milliseconds (shorter than generation). */
export const OLLAMA_HEALTH_TIMEOUT_MS = 3_000

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check if Ollama is reachable and responding.
 * Calls GET / on the Ollama server (returns "Ollama is running").
 *
 * @returns true if Ollama is available, false otherwise.
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OLLAMA_HEALTH_TIMEOUT_MS)

    const response = await fetch(OLLAMA_BASE_URL, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    return response.ok
  } catch {
    return false
  }
}

// ============================================================================
// Model Discovery
// ============================================================================

/**
 * List available models on the Ollama server.
 * Calls GET /api/tags.
 *
 * @returns Array of model names, or empty array if Ollama is unreachable.
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OLLAMA_HEALTH_TIMEOUT_MS)

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return []

    const data = (await response.json()) as OllamaTagsResponse
    return data.models.map((m) => m.name)
  } catch {
    return []
  }
}

/**
 * Check if a specific model is available on the Ollama server.
 *
 * @param model - Model name to check (e.g., "llama3.2").
 * @returns true if the model is pulled and available.
 */
export async function isModelAvailable(model: string = OLLAMA_DEFAULT_MODEL): Promise<boolean> {
  const models = await listOllamaModels()
  // Ollama model names may include tags (e.g., "llama3.2:latest").
  // Match by prefix to handle both "llama3.2" and "llama3.2:latest".
  return models.some((m) => m === model || m.startsWith(`${model}:`))
}

// ============================================================================
// Text Generation
// ============================================================================

/**
 * Generate text using an Ollama model.
 * Calls POST /api/generate in non-streaming mode.
 *
 * This function is intended for server-side use only (Route Handlers).
 * Client-side code should call through a Route Handler to avoid CORS.
 *
 * @param request - The generation request (model, prompt, system, options).
 * @returns The Ollama response including generated text and timing metadata.
 * @throws Error if Ollama is unreachable, model is missing, or generation fails.
 */
export async function generateText(
  request: OllamaGenerateRequest
): Promise<OllamaGenerateResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS)

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Ollama generation failed (${response.status}): ${errorText}`)
    }

    const data = (await response.json()) as OllamaGenerateResponse
    return data
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Ollama generation timed out after ${OLLAMA_TIMEOUT_MS}ms`)
    }
    throw error
  }
}

// ============================================================================
// Structured JSON Generation
// ============================================================================

/**
 * Generate a structured JSON response from Ollama.
 * Uses the `format: "json"` option to request JSON output.
 * Parses the response and validates it against the expected shape.
 *
 * @param request - The generation request (format is forced to "json").
 * @returns Parsed JSON object from the model's response.
 * @throws Error if generation fails or response is not valid JSON.
 */
export async function generateJSON<T>(
  request: Omit<OllamaGenerateRequest, 'format' | 'stream'>
): Promise<{ result: T; response: OllamaGenerateResponse }> {
  const fullRequest: OllamaGenerateRequest = {
    ...request,
    format: 'json',
    stream: false,
  }

  const ollamaResponse = await generateText(fullRequest)

  try {
    const parsed = JSON.parse(ollamaResponse.response) as T
    return { result: parsed, response: ollamaResponse }
  } catch {
    throw new Error(`Ollama returned invalid JSON: ${ollamaResponse.response.slice(0, 200)}`)
  }
}
```

### 4.3 Narration Prompt Templates -- `src/lib/ai/narration-prompts.ts`

Prompt engineering for the narration system. Separate system prompt and per-app user prompts that assemble context from `AppDelta`.

```ts
/**
 * Prompt templates for AI-narrated telemetry.
 *
 * These prompts instruct Ollama (or Claude as fallback) to interpret
 * system metrics and produce a three-part narration:
 * 1. What changed
 * 2. Why it matters
 * 3. What to do next
 *
 * Two prompt tiers:
 * - BATCH: Concise, generated every 30s, optimized for small models (llama3.2).
 * - DEEP_DIVE: Detailed, user-requested, optimized for larger models (Claude).
 *
 * References:
 * - more-for-ui.md point 3
 * - combined-recommendations.md "AI Features" bullet 3
 */

import type { AppDelta } from './narration-types'
import type { HealthState } from '@/lib/interfaces/types'

// ============================================================================
// System Prompts
// ============================================================================

/**
 * System prompt for batch narration (30s cadence, Ollama).
 * Kept short to minimize prompt token count on smaller models.
 */
export const BATCH_SYSTEM_PROMPT = `You are a calm, concise mission control narrator for a software operations dashboard called Tarva Launch. You interpret system telemetry and explain it to a human operator.

Your output MUST be valid JSON with exactly three fields:
- "whatChanged": One sentence describing what changed since the last check. If nothing changed, say so.
- "whyItMatters": One sentence explaining the significance. Be specific about impact.
- "whatToDoNext": One sentence recommending an action, or "No action needed." if the system is healthy.

Rules:
- Be calm and factual, never alarmist.
- Use plain language, not jargon.
- Reference specific numbers when available (response times, alert counts, uptime).
- If the app is OFFLINE or UNKNOWN, acknowledge it without suggesting it is broken -- it may be intentionally stopped.
- Keep each field to 1-2 sentences maximum. Brevity is critical.`

/**
 * System prompt for deep-dive narration (user-requested, Claude or Ollama).
 * More detailed analysis is expected.
 */
export const DEEP_DIVE_SYSTEM_PROMPT = `You are a thorough mission control analyst for a software operations dashboard called Tarva Launch. A human operator has explicitly requested a detailed analysis of one application's telemetry.

Your output MUST be valid JSON with exactly three fields:
- "whatChanged": A detailed description of all changes since the last check, including trends, patterns, and specific metrics.
- "whyItMatters": Analysis of the significance of these changes, including potential root causes, downstream effects, and risk assessment.
- "whatToDoNext": Specific, actionable recommendations ordered by priority. Include both immediate actions and things to monitor.

Rules:
- Be thorough but organized. Use clear, direct language.
- Reference specific numbers, percentages, and time periods.
- If the app is OFFLINE, explain the difference between intentionally stopped and unexpectedly down.
- Consider the broader system context (other apps' health) if relevant.
- 3-5 sentences per field is appropriate for deep-dive analysis.`

// ============================================================================
// Health State Descriptions
// ============================================================================

const HEALTH_DESCRIPTIONS: Record<HealthState, string> = {
  OPERATIONAL: 'fully operational (all checks passing)',
  DEGRADED: 'degraded (running with reduced capability)',
  DOWN: 'down (previously operational, now unresponsive)',
  OFFLINE: 'offline (not running, expected state)',
  UNKNOWN: 'unknown (no telemetry connection established)',
}

// ============================================================================
// User Prompt Builders
// ============================================================================

/**
 * Build the user prompt for a batch narration from an AppDelta.
 */
export function buildBatchPrompt(delta: AppDelta): string {
  const lines: string[] = [
    `Application: ${delta.displayName}`,
    `Current status: ${HEALTH_DESCRIPTIONS[delta.currentHealth]}`,
  ]

  if (delta.previousHealth !== null) {
    if (delta.healthChanged) {
      lines.push(
        `Status changed from ${HEALTH_DESCRIPTIONS[delta.previousHealth]} to ${HEALTH_DESCRIPTIONS[delta.currentHealth]}`
      )
    } else {
      lines.push(`Status unchanged since last check.`)
    }
  } else {
    lines.push('This is the first telemetry check for this app.')
  }

  if (delta.pulse) {
    lines.push(`Current activity: ${delta.pulse}`)
  }

  if (delta.currentAlertCount > 0) {
    lines.push(`Active alerts: ${delta.currentAlertCount}`)
    if (delta.alertCountDelta !== 0) {
      const direction = delta.alertCountDelta > 0 ? 'increased' : 'decreased'
      lines.push(`Alert count ${direction} by ${Math.abs(delta.alertCountDelta)} since last check.`)
    }
  } else {
    lines.push('No active alerts.')
  }

  if (delta.currentResponseTimeMs !== null) {
    lines.push(`Response time: ${delta.currentResponseTimeMs}ms`)
    if (delta.responseTimeDeltaPercent !== null) {
      const direction = delta.responseTimeDeltaPercent > 0 ? 'slower' : 'faster'
      lines.push(
        `Response time is ${Math.abs(Math.round(delta.responseTimeDeltaPercent))}% ${direction} than last check.`
      )
    }
  }

  if (delta.currentUptime !== null) {
    const uptimeHours = Math.round(delta.currentUptime / 3600)
    const uptimeMinutes = Math.round((delta.currentUptime % 3600) / 60)
    if (uptimeHours > 0) {
      lines.push(`Uptime: ${uptimeHours}h ${uptimeMinutes}m`)
    } else {
      lines.push(`Uptime: ${uptimeMinutes}m`)
    }
  }

  if (delta.freshnessMs !== null) {
    const freshnessMinutes = Math.round(delta.freshnessMs / 60_000)
    if (freshnessMinutes > 60) {
      lines.push(`Last meaningful activity: ${Math.round(freshnessMinutes / 60)}h ago (stale)`)
    } else {
      lines.push(`Last meaningful activity: ${freshnessMinutes}m ago`)
    }
  }

  const failingChecks = Object.entries(delta.checks).filter(([, v]) => v !== 'ok')
  if (failingChecks.length > 0) {
    lines.push(`Failing sub-checks: ${failingChecks.map(([k, v]) => `${k}=${v}`).join(', ')}`)
  }

  lines.push('')
  lines.push(
    'Respond with JSON: { "whatChanged": "...", "whyItMatters": "...", "whatToDoNext": "..." }'
  )

  return lines.join('\n')
}

/**
 * Build the user prompt for a deep-dive narration from an AppDelta.
 * Includes more context and requests richer analysis.
 */
export function buildDeepDivePrompt(delta: AppDelta, previousNarration?: string): string {
  const batchContext = buildBatchPrompt(delta)

  const lines: string[] = [
    'The operator has requested a detailed analysis of this application.',
    '',
    batchContext,
  ]

  if (previousNarration) {
    lines.push('')
    lines.push(`Previous narration summary: "${previousNarration}"`)
    lines.push('Build on this context -- explain what has changed since that assessment.')
  }

  lines.push('')
  lines.push(
    'Provide a thorough analysis. Respond with JSON: { "whatChanged": "...", "whyItMatters": "...", "whatToDoNext": "..." }'
  )

  return lines.join('\n')
}
```

### 4.4 Narration Route Handler -- `src/app/api/narrate/route.ts`

Server-side endpoint that calls Ollama for narration generation. Must run server-side to avoid CORS issues between the browser and Ollama's `localhost:11434`.

```ts
import { NextResponse } from 'next/server'
import { generateJSON, OLLAMA_DEFAULT_MODEL, checkOllamaHealth } from '@/lib/ai/ollama-client'
import {
  BATCH_SYSTEM_PROMPT,
  DEEP_DIVE_SYSTEM_PROMPT,
  buildBatchPrompt,
  buildDeepDivePrompt,
} from '@/lib/ai/narration-prompts'
import type { NarrationRequest, NarrationResult, Narration } from '@/lib/ai/narration-types'

/**
 * Expected JSON shape from the Ollama model.
 * Matches the three-part narration structure.
 */
interface NarrationResponseShape {
  whatChanged: string
  whyItMatters: string
  whatToDoNext: string
}

/**
 * Type guard for the narration response shape.
 */
function isValidNarrationShape(data: unknown): data is NarrationResponseShape {
  if (data === null || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.whatChanged === 'string' &&
    typeof obj.whyItMatters === 'string' &&
    typeof obj.whatToDoNext === 'string'
  )
}

/**
 * POST /api/narrate
 *
 * Server-side narration generator. Accepts a NarrationRequest,
 * calls Ollama to generate a structured narration, and returns
 * a NarrationResult.
 *
 * This Route Handler runs server-side to avoid CORS between the
 * browser and Ollama at localhost:11434.
 *
 * Rate limiting: Callers (the narration service) are responsible
 * for respecting the 10 calls/min limit from tech-decisions.md.
 * This handler does not enforce rate limits itself.
 */
export async function POST(request: Request) {
  const startTime = performance.now()

  try {
    const body = (await request.json()) as NarrationRequest

    // Validate request
    if (!body.appId || !body.delta) {
      return NextResponse.json(
        {
          success: false,
          narration: null,
          error: 'Missing required fields: appId, delta',
        } satisfies NarrationResult,
        { status: 400 }
      )
    }

    // Check Ollama availability
    const ollamaAvailable = await checkOllamaHealth()
    if (!ollamaAvailable) {
      return NextResponse.json(
        {
          success: false,
          narration: null,
          error: 'Ollama is not available at localhost:11434',
        } satisfies NarrationResult,
        { status: 503 }
      )
    }

    // Select prompt template based on narration tier
    const systemPrompt = body.deepDive ? DEEP_DIVE_SYSTEM_PROMPT : BATCH_SYSTEM_PROMPT

    const userPrompt = body.deepDive
      ? buildDeepDivePrompt(body.delta, body.previousNarration)
      : buildBatchPrompt(body.delta)

    // Call Ollama for structured JSON generation
    const { result: rawResult, response: ollamaResponse } =
      await generateJSON<NarrationResponseShape>({
        model: OLLAMA_DEFAULT_MODEL,
        system: systemPrompt,
        prompt: userPrompt,
        options: {
          temperature: body.deepDive ? 0.7 : 0.3,
          num_predict: body.deepDive ? 512 : 256,
          top_p: 0.9,
        },
      })

    const latencyMs = Math.round(performance.now() - startTime)

    // Validate response shape
    if (!isValidNarrationShape(rawResult)) {
      console.warn(`[narrate] Invalid narration shape for ${body.appId}:`, rawResult)
      return NextResponse.json(
        {
          success: false,
          narration: null,
          error: 'Ollama returned an invalid narration shape',
        } satisfies NarrationResult,
        { status: 502 }
      )
    }

    const narration: Narration = {
      appId: body.appId,
      whatChanged: rawResult.whatChanged,
      whyItMatters: rawResult.whyItMatters,
      whatToDoNext: rawResult.whatToDoNext,
      generatedAt: new Date().toISOString(),
      provider: 'ollama',
      modelId: ollamaResponse.model ?? OLLAMA_DEFAULT_MODEL,
      latencyMs,
      isDeepDive: body.deepDive,
      confidence: null, // Ollama does not report confidence natively
    }

    return NextResponse.json({
      success: true,
      narration,
    } satisfies NarrationResult)
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime)
    const message = error instanceof Error ? error.message : 'Unknown narration error'

    console.error(`[narrate] Error:`, message)

    return NextResponse.json(
      {
        success: false,
        narration: null,
        error: message,
      } satisfies NarrationResult,
      { status: 500 }
    )
  }
}
```

### 4.5 Narration Service -- `src/lib/ai/narration-service.ts`

Background orchestrator that runs the 30-second narration cycle. Computes deltas, identifies changed apps, calls the Route Handler, and updates the cache.

```ts
/**
 * Narration service -- background narration generation orchestrator.
 *
 * Runs on a 30-second cadence:
 * 1. Read the current SystemSnapshot from SystemStateProvider.
 * 2. Compute deltas against the previous snapshot.
 * 3. Identify apps with meaningful changes.
 * 4. Call POST /api/narrate for each changed app (respecting rate limit).
 * 5. Store narrations in the narration Zustand store.
 *
 * Rate limit: 10 calls per minute (tech-decisions.md).
 * At 6 apps max, one cycle uses at most 6 of the 10 calls.
 * The remaining 4 are reserved for deep-dive requests.
 *
 * References:
 * - combined-recommendations.md: "Background narration generation (Ollama, 30s cadence)"
 * - tech-decisions.md: "Claude rate-limited per feature (Narration batch: 10 calls/min)"
 */

import type { AppIdentifier } from '@/lib/interfaces/types'
import { ALL_APP_IDS, APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type { AppState, SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { AppDelta, NarrationRequest, NarrationResult } from './narration-types'

// ============================================================================
// Configuration
// ============================================================================

/** Narration cycle interval in milliseconds. */
export const NARRATION_CYCLE_INTERVAL_MS = 30_000

/** Maximum number of batch narration calls per cycle. */
export const MAX_BATCH_CALLS_PER_CYCLE = 6

/**
 * Minimum change thresholds for triggering a narration.
 * If none of these thresholds are met, the app is skipped
 * to conserve Ollama capacity.
 */
export const CHANGE_THRESHOLDS = {
  /** Any health state change always triggers narration. */
  healthChange: true,
  /** Alert count change of +/- this many triggers narration. */
  alertCountDelta: 1,
  /** Response time change percentage triggers narration. */
  responseTimeDeltaPercent: 15,
  /** If no narration exists yet for this app, always generate one. */
  firstNarration: true,
} as const

// ============================================================================
// Delta Computation
// ============================================================================

/**
 * Compute the delta between the current and previous AppState for one app.
 *
 * @param appId - The app identifier.
 * @param current - Current AppState from SystemSnapshot.
 * @param previous - Previous AppState from the last cycle (null if first cycle).
 * @returns Computed AppDelta with all change metrics.
 */
export function computeAppDelta(
  appId: AppIdentifier,
  current: AppState,
  previous: AppState | null
): AppDelta {
  const previousResponseTimeMs = (previous?.raw?.responseTimeMs as number | null) ?? null
  const currentResponseTimeMs = (current.raw?.responseTimeMs as number | null) ?? null

  let responseTimeDeltaPercent: number | null = null
  if (
    previousResponseTimeMs !== null &&
    currentResponseTimeMs !== null &&
    previousResponseTimeMs > 0
  ) {
    responseTimeDeltaPercent =
      ((currentResponseTimeMs - previousResponseTimeMs) / previousResponseTimeMs) * 100
  }

  const healthChanged = previous !== null && previous.health !== current.health
  const alertCountDelta = current.alertCount - (previous?.alertCount ?? 0)

  // Determine if the delta contains meaningful changes worth narrating
  const hasMeaningfulChange =
    previous === null || // First cycle -- always narrate
    healthChanged ||
    Math.abs(alertCountDelta) >= CHANGE_THRESHOLDS.alertCountDelta ||
    (responseTimeDeltaPercent !== null &&
      Math.abs(responseTimeDeltaPercent) >= CHANGE_THRESHOLDS.responseTimeDeltaPercent)

  return {
    appId,
    displayName: APP_DISPLAY_NAMES[appId],
    previousHealth: previous?.health ?? null,
    currentHealth: current.health,
    healthChanged,
    previousAlertCount: previous?.alertCount ?? 0,
    currentAlertCount: current.alertCount,
    alertCountDelta,
    previousResponseTimeMs,
    currentResponseTimeMs,
    responseTimeDeltaPercent,
    previousUptime: (previous?.raw?.uptime as number | null) ?? null,
    currentUptime: (current.raw?.uptime as number | null) ?? null,
    hasMeaningfulChange,
    pulse: current.pulse,
    freshnessMs: current.freshnessMs,
    checks: (current.raw?.checks as Record<string, string>) ?? {},
  }
}

/**
 * Compute deltas for all apps between two snapshots.
 *
 * @param current - Current SystemSnapshot.
 * @param previous - Previous SystemSnapshot (null if first cycle).
 * @returns Array of AppDeltas for all known apps.
 */
export function computeAllDeltas(
  current: SystemSnapshot,
  previous: SystemSnapshot | null
): AppDelta[] {
  return ALL_APP_IDS.map((appId) => {
    const currentApp = current.apps[appId]
    const previousApp = previous?.apps[appId] ?? null

    if (!currentApp) {
      // App not in snapshot -- generate a minimal "no data" delta
      return {
        appId,
        displayName: APP_DISPLAY_NAMES[appId],
        previousHealth: null,
        currentHealth: 'UNKNOWN' as const,
        healthChanged: false,
        previousAlertCount: 0,
        currentAlertCount: 0,
        alertCountDelta: 0,
        previousResponseTimeMs: null,
        currentResponseTimeMs: null,
        responseTimeDeltaPercent: null,
        previousUptime: null,
        currentUptime: null,
        hasMeaningfulChange: false,
        pulse: '',
        freshnessMs: null,
        checks: {},
      }
    }

    return computeAppDelta(appId, currentApp, previousApp)
  })
}

// ============================================================================
// Narration Generation
// ============================================================================

/**
 * Call the narration Route Handler for a single app.
 *
 * @param request - NarrationRequest with app ID, delta, and deep-dive flag.
 * @returns NarrationResult from the server.
 */
export async function generateNarration(request: NarrationRequest): Promise<NarrationResult> {
  try {
    const response = await fetch('/api/narrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({ error: `HTTP ${response.status}` }))) as {
        error?: string
      }
      return {
        success: false,
        narration: null,
        error: errorData.error ?? `Narration request failed: ${response.status}`,
      }
    }

    return (await response.json()) as NarrationResult
  } catch (error) {
    return {
      success: false,
      narration: null,
      error: error instanceof Error ? error.message : 'Network error during narration request',
    }
  }
}

/**
 * Run one complete narration cycle.
 *
 * Computes deltas, filters to apps with meaningful changes,
 * generates narrations sequentially (to respect rate limits),
 * and returns all results.
 *
 * Sequential generation ensures we never exceed the rate limit
 * and that Ollama processes one prompt at a time (it queues
 * concurrent requests anyway).
 *
 * @param current - Current SystemSnapshot.
 * @param previous - Previous SystemSnapshot (null if first cycle).
 * @param existingNarrations - Map of existing narrations for continuity.
 * @returns Map of app ID to NarrationResult.
 */
export async function runNarrationCycle(
  current: SystemSnapshot,
  previous: SystemSnapshot | null,
  existingNarrations: Map<AppIdentifier, string | null>
): Promise<Map<AppIdentifier, NarrationResult>> {
  const deltas = computeAllDeltas(current, previous)
  const results = new Map<AppIdentifier, NarrationResult>()

  // Filter to apps with meaningful changes
  const appsToNarrate = deltas.filter((d) => d.hasMeaningfulChange)

  // Cap at MAX_BATCH_CALLS_PER_CYCLE to leave room for deep-dive requests
  const limitedApps = appsToNarrate.slice(0, MAX_BATCH_CALLS_PER_CYCLE)

  // Generate narrations sequentially (Ollama handles one at a time anyway)
  for (const delta of limitedApps) {
    const request: NarrationRequest = {
      appId: delta.appId,
      delta,
      deepDive: false,
      previousNarration: existingNarrations.get(delta.appId) ?? undefined,
    }

    const result = await generateNarration(request)
    results.set(delta.appId, result)

    // Brief pause between calls to avoid overwhelming Ollama
    if (limitedApps.indexOf(delta) < limitedApps.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  return results
}
```

### 4.6 Narration Store -- `src/stores/narration.store.ts`

Zustand store that caches narrations per app and tracks the cycle status.

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { Narration, NarrationCacheEntry, NarrationCycleStatus } from '@/lib/ai/narration-types'

// ============================================================================
// Store State
// ============================================================================

interface NarrationState {
  /** Per-app narration cache. Keyed by AppIdentifier. */
  cache: Record<string, NarrationCacheEntry>

  /** Overall narration cycle status. */
  cycleStatus: NarrationCycleStatus

  // -- Actions --

  /**
   * Update the batch narration for a specific app.
   * Called by the narration cycle after each successful generation.
   */
  setBatchNarration: (appId: AppIdentifier, narration: Narration) => void

  /**
   * Update the deep-dive narration for a specific app.
   * Called after a user-requested deep-dive completes.
   */
  setDeepDiveNarration: (appId: AppIdentifier, narration: Narration) => void

  /**
   * Clear the deep-dive narration for a specific app.
   * Reverts to showing the batch narration.
   */
  clearDeepDiveNarration: (appId: AppIdentifier) => void

  /**
   * Mark an app as currently generating a narration.
   */
  setGenerating: (appId: AppIdentifier, type: 'batch' | 'deep-dive', isGenerating: boolean) => void

  /**
   * Update the overall cycle status.
   */
  updateCycleStatus: (update: Partial<NarrationCycleStatus>) => void

  /**
   * Clear all narrations. Used on session reset or Ollama disconnect.
   */
  clearAll: () => void
}

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_CYCLE_STATUS: NarrationCycleStatus = {
  isRunning: false,
  ollamaAvailable: false,
  modelId: null,
  lastCycleAt: null,
  lastCycleAppCount: 0,
  totalNarrations: 0,
  averageLatencyMs: 0,
}

function createEmptyCacheEntry(): NarrationCacheEntry {
  return {
    batchNarration: null,
    deepDiveNarration: null,
    isGenerating: false,
    isDeepDiveGenerating: false,
  }
}

// ============================================================================
// Store
// ============================================================================

export const useNarrationStore = create<NarrationState>()(
  immer((set) => ({
    cache: {},
    cycleStatus: { ...INITIAL_CYCLE_STATUS },

    setBatchNarration: (appId, narration) =>
      set((state) => {
        if (!state.cache[appId]) {
          state.cache[appId] = createEmptyCacheEntry()
        }
        state.cache[appId].batchNarration = narration
        state.cache[appId].isGenerating = false

        // Update cycle statistics
        state.cycleStatus.totalNarrations += 1
        const prevTotal = state.cycleStatus.totalNarrations - 1
        const prevAvg = state.cycleStatus.averageLatencyMs
        state.cycleStatus.averageLatencyMs =
          prevTotal > 0
            ? (prevAvg * prevTotal + narration.latencyMs) / state.cycleStatus.totalNarrations
            : narration.latencyMs
      }),

    setDeepDiveNarration: (appId, narration) =>
      set((state) => {
        if (!state.cache[appId]) {
          state.cache[appId] = createEmptyCacheEntry()
        }
        state.cache[appId].deepDiveNarration = narration
        state.cache[appId].isDeepDiveGenerating = false

        // Deep-dives also count toward total statistics
        state.cycleStatus.totalNarrations += 1
      }),

    clearDeepDiveNarration: (appId) =>
      set((state) => {
        if (state.cache[appId]) {
          state.cache[appId].deepDiveNarration = null
        }
      }),

    setGenerating: (appId, type, isGenerating) =>
      set((state) => {
        if (!state.cache[appId]) {
          state.cache[appId] = createEmptyCacheEntry()
        }
        if (type === 'batch') {
          state.cache[appId].isGenerating = isGenerating
        } else {
          state.cache[appId].isDeepDiveGenerating = isGenerating
        }
      }),

    updateCycleStatus: (update) =>
      set((state) => {
        Object.assign(state.cycleStatus, update)
      }),

    clearAll: () =>
      set((state) => {
        state.cache = {}
        state.cycleStatus = { ...INITIAL_CYCLE_STATUS }
      }),
  }))
)
```

### 4.7 Background Narration Cycle Hook -- `src/hooks/use-narration-cycle.ts`

Client-side hook that manages the 30-second narration cycle lifecycle. Starts on mount, pauses when Ollama is unreachable, and feeds results into the narration store.

```ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useNarrationStore } from '@/stores/narration.store'
import { checkOllamaHealth, isModelAvailable, OLLAMA_DEFAULT_MODEL } from '@/lib/ai/ollama-client'
import { runNarrationCycle, NARRATION_CYCLE_INTERVAL_MS } from '@/lib/ai/narration-service'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { AppIdentifier } from '@/lib/interfaces/types'

/**
 * How often to re-check Ollama availability when it was previously unavailable.
 * Less aggressive than the narration cycle to avoid spamming a dead endpoint.
 */
const OLLAMA_RECHECK_INTERVAL_MS = 60_000

/**
 * useNarrationCycle -- Manages the background narration generation loop.
 *
 * Lifecycle:
 * 1. On mount, check if Ollama is available and has the required model.
 * 2. If available, start a 30-second interval that runs narration cycles.
 * 3. Each cycle reads the current SystemSnapshot, computes deltas,
 *    and generates narrations for apps with meaningful changes.
 * 4. If Ollama becomes unreachable, pause the cycle and recheck every 60s.
 * 5. On unmount, clear all intervals.
 *
 * This hook should be mounted ONCE at the hub layout level.
 * It does NOT render any UI -- it is a pure side-effect hook.
 *
 * @param getSnapshot - Function to read the current SystemSnapshot.
 *   Typically: () => systemStateProvider.getSnapshot()
 */
export function useNarrationCycle(getSnapshot: () => SystemSnapshot | null) {
  const previousSnapshotRef = useRef<SystemSnapshot | null>(null)
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRunningRef = useRef(false)

  const updateCycleStatus = useNarrationStore((s) => s.updateCycleStatus)
  const setBatchNarration = useNarrationStore((s) => s.setBatchNarration)
  const setGenerating = useNarrationStore((s) => s.setGenerating)
  const clearAll = useNarrationStore((s) => s.clearAll)

  /**
   * Execute one narration cycle.
   */
  const executeCycle = useCallback(async () => {
    // Guard against concurrent cycles (Ollama processes sequentially anyway)
    if (isRunningRef.current) return
    isRunningRef.current = true

    const currentSnapshot = getSnapshot()
    if (!currentSnapshot) {
      isRunningRef.current = false
      return
    }

    try {
      // Gather existing narration text for continuity
      const existingNarrations = new Map<AppIdentifier, string | null>()
      const cache = useNarrationStore.getState().cache
      for (const [appId, entry] of Object.entries(cache)) {
        existingNarrations.set(appId as AppIdentifier, entry.batchNarration?.whatChanged ?? null)
      }

      // Mark all apps as potentially generating
      const results = await runNarrationCycle(
        currentSnapshot,
        previousSnapshotRef.current,
        existingNarrations
      )

      // Update the store with results
      let successCount = 0
      for (const [appId, result] of results) {
        if (result.success && result.narration) {
          setBatchNarration(appId, result.narration)
          successCount++
        } else {
          setGenerating(appId, 'batch', false)
        }
      }

      // Update cycle status
      updateCycleStatus({
        lastCycleAt: new Date().toISOString(),
        lastCycleAppCount: successCount,
      })

      // Save current snapshot as the previous for next cycle
      previousSnapshotRef.current = currentSnapshot
    } catch (error) {
      console.error('[narration-cycle] Cycle failed:', error)
    } finally {
      isRunningRef.current = false
    }
  }, [getSnapshot, setBatchNarration, setGenerating, updateCycleStatus])

  /**
   * Start the narration cycle interval.
   */
  const startCycle = useCallback(() => {
    // Clear any existing timer
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current)
    }

    updateCycleStatus({ isRunning: true })

    // Run immediately, then every NARRATION_CYCLE_INTERVAL_MS
    executeCycle()
    cycleTimerRef.current = setInterval(executeCycle, NARRATION_CYCLE_INTERVAL_MS)
  }, [executeCycle, updateCycleStatus])

  /**
   * Stop the narration cycle.
   */
  const stopCycle = useCallback(() => {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current)
      cycleTimerRef.current = null
    }
    updateCycleStatus({ isRunning: false })
  }, [updateCycleStatus])

  /**
   * Check Ollama availability and start/stop the cycle accordingly.
   */
  const checkAndStart = useCallback(async () => {
    const available = await checkOllamaHealth()

    if (available) {
      const modelReady = await isModelAvailable(OLLAMA_DEFAULT_MODEL)

      if (modelReady) {
        updateCycleStatus({
          ollamaAvailable: true,
          modelId: OLLAMA_DEFAULT_MODEL,
        })
        startCycle()

        // Clear the recheck timer since Ollama is now available
        if (recheckTimerRef.current) {
          clearInterval(recheckTimerRef.current)
          recheckTimerRef.current = null
        }
        return
      } else {
        console.warn(
          `[narration-cycle] Ollama is running but model "${OLLAMA_DEFAULT_MODEL}" is not available. ` +
            `Pull it with: ollama pull ${OLLAMA_DEFAULT_MODEL}`
        )
      }
    }

    // Ollama not available or model missing
    updateCycleStatus({
      ollamaAvailable: false,
      modelId: null,
      isRunning: false,
    })
    stopCycle()

    // Set up periodic recheck if not already running
    if (!recheckTimerRef.current) {
      recheckTimerRef.current = setInterval(checkAndStart, OLLAMA_RECHECK_INTERVAL_MS)
    }
  }, [startCycle, stopCycle, updateCycleStatus])

  /**
   * Initialize on mount; cleanup on unmount.
   */
  useEffect(() => {
    checkAndStart()

    return () => {
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current)
      }
      if (recheckTimerRef.current) {
        clearInterval(recheckTimerRef.current)
      }
      clearAll()
    }
  }, [checkAndStart, clearAll])
}
```

### 4.8 Narration Consumer Hook -- `src/hooks/use-narration.ts`

Hook for district/station components to read and interact with narrations.

````ts
'use client'

import { useCallback } from 'react'
import { useNarrationStore } from '@/stores/narration.store'
import { generateNarration } from '@/lib/ai/narration-service'
import { computeAppDelta } from '@/lib/ai/narration-service'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { AppState } from '@/lib/interfaces/system-state-provider'
import type { Narration, NarrationCacheEntry } from '@/lib/ai/narration-types'

// ============================================================================
// Return Type
// ============================================================================

export interface UseNarrationResult {
  /**
   * The active narration to display.
   * Deep-dive narration takes precedence over batch narration.
   * Null if no narration has been generated yet.
   */
  narration: Narration | null

  /** Whether a batch narration is currently being generated. */
  isGenerating: boolean

  /** Whether a deep-dive narration is currently being generated. */
  isDeepDiveGenerating: boolean

  /** Whether the narration system is available (Ollama running). */
  isAvailable: boolean

  /** Whether ANY narration exists for this app (batch or deep-dive). */
  hasNarration: boolean

  /**
   * Request a detailed deep-dive narration for this app.
   * Requires current and previous AppState for delta computation.
   * Returns the narration result.
   */
  requestDeepDive: (currentAppState: AppState, previousAppState: AppState | null) => Promise<void>

  /**
   * Dismiss the deep-dive narration and revert to batch narration.
   */
  dismissDeepDive: () => void
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useNarration -- Read and interact with the narration cache for one app.
 *
 * Usage in a district Status station:
 * ```tsx
 * const { narration, isAvailable, requestDeepDive } = useNarration('agent-builder')
 *
 * if (!isAvailable || !narration) return null // Graceful degradation
 *
 * return <NarrationPanel narration={narration} onDeepDive={...} />
 * ```
 *
 * @param appId - The app to get narration for.
 */
export function useNarration(appId: AppIdentifier): UseNarrationResult {
  const cacheEntry: NarrationCacheEntry | undefined = useNarrationStore((s) => s.cache[appId])
  const ollamaAvailable = useNarrationStore((s) => s.cycleStatus.ollamaAvailable)
  const setDeepDiveNarration = useNarrationStore((s) => s.setDeepDiveNarration)
  const clearDeepDiveNarration = useNarrationStore((s) => s.clearDeepDiveNarration)
  const setGenerating = useNarrationStore((s) => s.setGenerating)

  // Deep-dive takes precedence over batch
  const narration = cacheEntry?.deepDiveNarration ?? cacheEntry?.batchNarration ?? null

  const requestDeepDive = useCallback(
    async (currentAppState: AppState, previousAppState: AppState | null) => {
      if (!ollamaAvailable) return

      setGenerating(appId, 'deep-dive', true)

      try {
        const delta = computeAppDelta(appId, currentAppState, previousAppState)
        const previousNarrationText = cacheEntry?.batchNarration?.whatChanged ?? undefined

        const result = await generateNarration({
          appId,
          delta,
          deepDive: true,
          previousNarration: previousNarrationText,
        })

        if (result.success && result.narration) {
          setDeepDiveNarration(appId, result.narration)
        }
      } catch (error) {
        console.error(`[use-narration] Deep-dive failed for ${appId}:`, error)
      } finally {
        setGenerating(appId, 'deep-dive', false)
      }
    },
    [
      appId,
      ollamaAvailable,
      cacheEntry?.batchNarration?.whatChanged,
      setDeepDiveNarration,
      setGenerating,
    ]
  )

  const dismissDeepDive = useCallback(() => {
    clearDeepDiveNarration(appId)
  }, [appId, clearDeepDiveNarration])

  return {
    narration,
    isGenerating: cacheEntry?.isGenerating ?? false,
    isDeepDiveGenerating: cacheEntry?.isDeepDiveGenerating ?? false,
    isAvailable: ollamaAvailable,
    hasNarration: narration !== null,
    requestDeepDive,
    dismissDeepDive,
  }
}
````

### 4.9 NarrationPanel Component -- `src/components/telemetry/narration-panel.tsx`

Display component that renders the three-part narration within a station panel.

````tsx
'use client'

import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@tarva/ui'
import { Sparkles, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Narration } from '@/lib/ai/narration-types'

// ============================================================================
// Relative Time Formatter
// ============================================================================

/**
 * Format a timestamp as a relative time string (e.g., "12s ago", "2m ago").
 */
function formatRelativeTime(isoTimestamp: string): string {
  const diff = Date.now() - new Date(isoTimestamp).getTime()
  const seconds = Math.round(diff / 1000)

  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}

// ============================================================================
// Props
// ============================================================================

export interface NarrationPanelProps {
  /** The narration to display. */
  narration: Narration
  /** Whether a deep-dive is currently loading. */
  isDeepDiveLoading?: boolean
  /** Callback when user requests a deep-dive analysis. */
  onRequestDeepDive?: () => void
  /** Callback when user dismisses a deep-dive (reverts to batch narration). */
  onDismissDeepDive?: () => void
  /** Additional CSS classes. */
  className?: string
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * A single narration section (what changed / why it matters / what to do next).
 */
function NarrationSection({ label, content }: { label: string; content: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="font-sans text-[9px] font-semibold tracking-[0.08em] uppercase"
        style={{ color: 'var(--color-text-ghost, #2a3545)' }}
      >
        {label}
      </span>
      <p
        className="font-sans text-[13px] leading-relaxed font-normal"
        style={{ color: 'var(--color-text-secondary, #8ba3be)' }}
      >
        {content}
      </p>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

/**
 * NarrationPanel -- AI-generated telemetry narration display.
 *
 * Renders the three-part narration (what changed, why it matters,
 * what to do next) with the Oblivion glass material aesthetic.
 *
 * Displays within station panels at Z2/Z3 zoom levels.
 * Only rendered when a narration is available -- graceful degradation
 * means this component is never shown when Ollama is offline.
 *
 * The panel includes:
 * - AI sparkle icon and "AI Insight" label
 * - Three narration sections
 * - Relative timestamp ("updated 12s ago")
 * - "Deep dive" button for detailed analysis (optional)
 * - Dismiss button for deep-dive narrations
 *
 * Entrance/exit animation via motion/react.
 *
 * @example
 * ```tsx
 * const { narration, isAvailable, requestDeepDive } = useNarration('agent-builder')
 * if (!isAvailable || !narration) return null
 * return (
 *   <NarrationPanel
 *     narration={narration}
 *     onRequestDeepDive={() => requestDeepDive(currentState, prevState)}
 *   />
 * )
 * ```
 */
export function NarrationPanel({
  narration,
  isDeepDiveLoading = false,
  onRequestDeepDive,
  onDismissDeepDive,
  className,
}: NarrationPanelProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={narration.generatedAt}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className={cn('relative rounded-lg border p-4', 'flex flex-col gap-3', className)}
        style={{
          background: 'var(--color-bg-glass, rgba(255, 255, 255, 0.02))',
          borderColor: narration.isDeepDive
            ? 'var(--color-teal, #277389)'
            : 'var(--color-border-subtle, rgba(255, 255, 255, 0.04))',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Header row: AI icon + label + timestamp + deep-dive controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} style={{ color: 'var(--color-teal-bright, #3a99b8)' }} />
            <span
              className="font-sans text-[10px] font-semibold tracking-[0.06em] uppercase"
              style={{ color: 'var(--color-teal, #277389)' }}
            >
              {narration.isDeepDive ? 'Deep Analysis' : 'AI Insight'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[10px]"
              style={{ color: 'var(--color-text-ghost, #2a3545)' }}
            >
              {formatRelativeTime(narration.generatedAt)}
            </span>

            {narration.isDeepDive && onDismissDeepDive && (
              <button
                onClick={onDismissDeepDive}
                className="rounded p-0.5 transition-opacity hover:opacity-80"
                style={{ color: 'var(--color-text-ghost, #2a3545)' }}
                aria-label="Dismiss deep analysis"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Three-part narration */}
        <NarrationSection label="What changed" content={narration.whatChanged} />
        <NarrationSection label="Why it matters" content={narration.whyItMatters} />
        <NarrationSection label="What to do next" content={narration.whatToDoNext} />

        {/* Deep dive button (only for batch narrations) */}
        {!narration.isDeepDive && onRequestDeepDive && (
          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRequestDeepDive}
              disabled={isDeepDiveLoading}
              className="h-6 gap-1 px-2 text-[11px]"
              style={{
                color: 'var(--color-teal, #277389)',
              }}
            >
              {isDeepDiveLoading ? (
                <span className="animate-pulse">Analyzing...</span>
              ) : (
                <>
                  <ChevronDown size={10} />
                  Deep dive
                </>
              )}
            </Button>
          </div>
        )}

        {/* Provider badge (subtle) */}
        <div
          className="absolute bottom-1.5 left-4 font-mono text-[8px] tracking-[0.1em] uppercase"
          style={{
            color: 'var(--color-text-ghost, #2a3545)',
            opacity: 0.5,
          }}
        >
          {narration.provider}
          {narration.modelId ? ` / ${narration.modelId}` : ''}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
````

### 4.10 NarrationSkeleton Component -- `src/components/telemetry/narration-skeleton.tsx`

Loading placeholder displayed during the first narration cycle.

```tsx
'use client'

import { cn } from '@/lib/utils'

export interface NarrationSkeletonProps {
  className?: string
}

/**
 * NarrationSkeleton -- Loading placeholder for the narration panel.
 *
 * Shows three pulsing lines that approximate the narration panel's
 * layout. Displayed only during the initial cycle before the first
 * narration is cached. After the first successful narration, the
 * real NarrationPanel replaces this component.
 *
 * This is NOT shown when Ollama is unavailable (graceful degradation
 * means no skeleton, no panel, no indication that narration could exist).
 * It is only shown when Ollama IS available but the first cycle has not
 * yet completed.
 */
export function NarrationSkeleton({ className }: NarrationSkeletonProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 rounded-lg border p-4', 'animate-pulse', className)}
      style={{
        background: 'var(--color-bg-glass, rgba(255, 255, 255, 0.02))',
        borderColor: 'var(--color-border-subtle, rgba(255, 255, 255, 0.04))',
      }}
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded" style={{ background: 'var(--color-teal-dim, #0f2a35)' }} />
        <div
          className="h-2 w-14 rounded"
          style={{ background: 'var(--color-border-subtle, rgba(255, 255, 255, 0.04))' }}
        />
      </div>

      {/* Three section skeletons */}
      {[0.9, 0.7, 0.5].map((widthFraction, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div
            className="h-1.5 w-16 rounded"
            style={{
              background: 'var(--color-border-subtle, rgba(255, 255, 255, 0.04))',
            }}
          />
          <div
            className="h-3 rounded"
            style={{
              width: `${widthFraction * 100}%`,
              background: 'var(--color-border-subtle, rgba(255, 255, 255, 0.04))',
            }}
          />
        </div>
      ))}
    </div>
  )
}
```

### 4.11 Barrel Exports -- `src/lib/ai/index.ts`

```ts
// Ollama client (shared with WS-3.4)
export {
  checkOllamaHealth,
  listOllamaModels,
  isModelAvailable,
  generateText,
  generateJSON,
  OLLAMA_BASE_URL,
  OLLAMA_DEFAULT_MODEL,
  OLLAMA_TIMEOUT_MS,
  OLLAMA_HEALTH_TIMEOUT_MS,
} from './ollama-client'

// Narration types
export type {
  Narration,
  NarrationCacheEntry,
  NarrationCycleStatus,
  NarrationRequest,
  NarrationResult,
  AppDelta,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaTagsResponse,
} from './narration-types'

// Narration prompts
export {
  BATCH_SYSTEM_PROMPT,
  DEEP_DIVE_SYSTEM_PROMPT,
  buildBatchPrompt,
  buildDeepDivePrompt,
} from './narration-prompts'

// Narration service
export {
  computeAppDelta,
  computeAllDeltas,
  generateNarration,
  runNarrationCycle,
  NARRATION_CYCLE_INTERVAL_MS,
  MAX_BATCH_CALLS_PER_CYCLE,
  CHANGE_THRESHOLDS,
} from './narration-service'
```

### 4.12 Updated Telemetry Component Barrel -- `src/components/telemetry/index.ts`

Add narration exports to the existing telemetry component barrel (extending WS-1.5's barrel).

```ts
// Existing WS-1.5 exports
export { HealthBadge } from './health-badge'
export type { HealthBadgeProps } from './health-badge'

export { TelemetrySparkline } from './telemetry-sparkline'
export type { TelemetrySparklineProps } from './telemetry-sparkline'

export { MetricCounter } from './metric-counter'
export type { MetricCounterProps } from './metric-counter'

export { AlertIndicator } from './alert-indicator'
export type { AlertIndicatorProps } from './alert-indicator'

// WS-3.6 narration exports
export { NarrationPanel } from './narration-panel'
export type { NarrationPanelProps } from './narration-panel'

export { NarrationSkeleton } from './narration-skeleton'
export type { NarrationSkeletonProps } from './narration-skeleton'
```

### 4.13 Integration Example -- District Status Station

This is not a deliverable file but shows how WS-2.2-2.5 district components integrate the narration panel into their status stations.

```tsx
'use client'

// Example: Agent Builder Status Station body content
// This code lives in WS-2.2, NOT this workstream. Shown for integration clarity.

import { useNarration } from '@/hooks/use-narration'
import { NarrationPanel, NarrationSkeleton } from '@/components/telemetry'
import type { AppState } from '@/lib/interfaces/system-state-provider'

interface StatusStationBodyProps {
  appState: AppState
  previousAppState: AppState | null
}

export function StatusStationBody({ appState, previousAppState }: StatusStationBodyProps) {
  const {
    narration,
    isAvailable,
    isDeepDiveGenerating,
    hasNarration,
    requestDeepDive,
    dismissDeepDive,
  } = useNarration('agent-builder')

  return (
    <div className="flex flex-col gap-4">
      {/* Standard telemetry display (always shown) */}
      {/* ... HealthBadge, MetricCounter, Sparkline, etc. ... */}

      {/* AI Narration (only when Ollama is available) */}
      {isAvailable && hasNarration && narration && (
        <NarrationPanel
          narration={narration}
          isDeepDiveLoading={isDeepDiveGenerating}
          onRequestDeepDive={() => requestDeepDive(appState, previousAppState)}
          onDismissDeepDive={dismissDeepDive}
        />
      )}

      {/* Skeleton shown only during first cycle when Ollama IS available */}
      {isAvailable && !hasNarration && <NarrationSkeleton />}

      {/* When Ollama is NOT available: nothing is rendered.
          No skeleton, no error, no placeholder. Graceful degradation. */}
    </div>
  )
}
```

---

## 5. Acceptance Criteria

All criteria must pass before WS-3.6 is marked complete.

| #     | Criterion                                                                               | Verification                                                                                                                                                                                                     |
| ----- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Ollama health check correctly detects availability                                      | Start Ollama: `checkOllamaHealth()` returns `true`. Stop Ollama: returns `false`. No unhandled errors in either case.                                                                                            |
| AC-2  | Model availability check identifies the required model                                  | With `llama3.2` pulled: `isModelAvailable('llama3.2')` returns `true`. Without it: returns `false` and logs a helpful message.                                                                                   |
| AC-3  | `POST /api/narrate` returns a valid `NarrationResult` for a well-formed request         | Send a `NarrationRequest` with valid `appId` and `delta`: response is 200 with `success: true` and a `Narration` object containing all three text fields.                                                        |
| AC-4  | `POST /api/narrate` returns 503 when Ollama is unavailable                              | Stop Ollama, send a narration request: response is 503 with `success: false` and a descriptive error message.                                                                                                    |
| AC-5  | `POST /api/narrate` validates the Ollama response shape                                 | If Ollama returns malformed JSON (missing fields), the handler returns 502 with `success: false`. No unhandled exceptions.                                                                                       |
| AC-6  | Batch narration prompt produces the correct three-part JSON structure                   | Call `buildBatchPrompt()` with a test `AppDelta`, submit to Ollama, and verify the response parses as `{ whatChanged, whyItMatters, whatToDoNext }`.                                                             |
| AC-7  | Deep-dive narration prompt produces richer analysis                                     | Call `buildDeepDivePrompt()` with a test `AppDelta`, submit to Ollama, and verify the response contains more detail than the batch version (longer text, more specific recommendations).                         |
| AC-8  | Delta computation correctly identifies health state changes                             | Create two `AppState` objects where health changes from `OPERATIONAL` to `DOWN`: `computeAppDelta()` returns `healthChanged: true` and `hasMeaningfulChange: true`.                                              |
| AC-9  | Delta computation correctly identifies no-change scenarios                              | Create two identical `AppState` objects: `computeAppDelta()` returns `healthChanged: false` and `hasMeaningfulChange: false`.                                                                                    |
| AC-10 | Background narration cycle runs on a 30-second cadence                                  | Mount `useNarrationCycle` with Ollama running: observe `POST /api/narrate` calls occurring approximately every 30 seconds.                                                                                       |
| AC-11 | Background narration cycle skips apps with no meaningful changes                        | Run two cycles with identical `SystemSnapshot`: the second cycle makes zero Ollama calls (all apps filtered out by delta thresholds).                                                                            |
| AC-12 | Background narration cycle pauses when Ollama is unavailable                            | Start the cycle, stop Ollama: the cycle stops making requests. Narration store `cycleStatus.isRunning` is `false`.                                                                                               |
| AC-13 | Background narration cycle resumes when Ollama becomes available                        | With the cycle paused, start Ollama: within 60 seconds the cycle resumes. `cycleStatus.isRunning` returns to `true`.                                                                                             |
| AC-14 | Narration store caches narrations per app                                               | After a successful cycle: `useNarrationStore.getState().cache['agent-builder'].batchNarration` is a valid `Narration` object.                                                                                    |
| AC-15 | `useNarration()` hook returns the correct narration for a specific app                  | In a component using `useNarration('agent-builder')`: `narration` matches the store entry; `isAvailable` reflects Ollama status; `hasNarration` is `true` when a narration exists.                               |
| AC-16 | Deep-dive narration overrides batch narration in the display                            | Request a deep-dive via `requestDeepDive()`: the hook's `narration` field returns the deep-dive narration. Dismiss it: reverts to the batch narration.                                                           |
| AC-17 | `NarrationPanel` renders all three narration sections                                   | Mount with a valid `Narration`: visible text includes the `whatChanged`, `whyItMatters`, and `whatToDoNext` content.                                                                                             |
| AC-18 | `NarrationPanel` shows entrance/exit animation                                          | Mount and unmount the panel: verify `motion/react` opacity+translateY animation triggers on both enter and exit.                                                                                                 |
| AC-19 | `NarrationPanel` displays relative timestamp                                            | Mount with a narration generated 45 seconds ago: the panel shows "45s ago".                                                                                                                                      |
| AC-20 | `NarrationPanel` "Deep dive" button triggers the callback                               | Click the "Deep dive" button: `onRequestDeepDive` callback fires. Button text changes to "Analyzing..." while loading.                                                                                           |
| AC-21 | `NarrationSkeleton` renders during initial cycle only                                   | Mount `NarrationSkeleton` when `isAvailable` is `true` and `hasNarration` is `false`: three pulsing skeleton lines are visible. After the first narration arrives, the skeleton is replaced by `NarrationPanel`. |
| AC-22 | Graceful degradation: no narration UI when Ollama is offline                            | With Ollama stopped, load the Launch: no `NarrationPanel`, no `NarrationSkeleton`, no error messages. The station renders normally with standard telemetry components only.                                      |
| AC-23 | Graceful degradation: stale narrations remain visible when Ollama goes down mid-session | Start with Ollama running, generate narrations, stop Ollama: existing cached narrations remain displayed. The relative timestamp shows increasing staleness but no error state.                                  |
| AC-24 | Rate limit respected: at most 6 batch calls per cycle, leaving 4 for deep-dive          | Run a cycle with all 6 apps changed: observe exactly 6 `POST /api/narrate` calls. A deep-dive request during the same minute succeeds (not rate-limited).                                                        |
| AC-25 | `pnpm typecheck` passes with zero errors after all WS-3.6 files are added               | Run `pnpm typecheck` and confirm exit code 0.                                                                                                                                                                    |
| AC-26 | Provider badge displays "ollama / llama3.2" for batch narrations                        | Inspect the NarrationPanel footer: provider and model ID are visible in the subtle bottom-left badge.                                                                                                            |

---

## 6. Decisions Made

| #    | Decision                                                                                                                 | Rationale                                                                                                                                                                                                                                                                                                                                                                                                             | Source                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| D-1  | Ollama client uses native `fetch` rather than the `ollama` npm package                                                   | The `ollama` npm package wraps the same HTTP endpoints. Native fetch keeps the dependency surface minimal, works in both client and server contexts, and avoids an additional package install. The Ollama REST API is simple enough (3 endpoints) that a wrapper adds no value.                                                                                                                                       | Engineering judgment, dependency minimization                                      |
| D-2  | Narration calls route through a server-side Route Handler (`POST /api/narrate`), not direct client-to-Ollama fetch       | Ollama runs on `localhost:11434`. Browser fetch to a different port triggers CORS, and Ollama does not set CORS headers by default. The Route Handler proxies the request server-side where CORS does not apply. This matches the telemetry aggregator pattern from WS-1.5.                                                                                                                                           | WS-1.5 pattern (server-side proxy for localhost services)                          |
| D-3  | Narrations are NOT persisted to Supabase                                                                                 | Narrations are ephemeral by design -- regenerated every 30 seconds from the current system state. Persisting them would add write volume to Supabase with no user benefit. Historical narrations have no value because the system state they describe has already changed. If a historical narration record is needed in the future, the receipt system already captures each generation event.                       | Ephemeral data principle, storage cost                                             |
| D-4  | Sequential narration generation within a cycle (not parallel)                                                            | Ollama processes requests sequentially on a single GPU. Parallel requests would queue internally and not improve throughput. Sequential generation also makes rate limiting trivial (wait for each response before the next call) and avoids memory pressure from multiple concurrent model loads.                                                                                                                    | Ollama architecture (single-model-at-a-time inference)                             |
| D-5  | Delta computation determines narration necessity (skip unchanged apps)                                                   | Generating narrations for all 6 apps every 30 seconds wastes Ollama capacity when most apps are stable. The delta filter (`hasMeaningfulChange`) ensures Ollama only narrates apps with health changes, alert count changes, or significant response time shifts. This reduces typical Ollama calls from 6 per cycle to 1-2.                                                                                          | Ollama capacity conservation, latency reduction                                    |
| D-6  | `NarrationPanel` uses `motion/react` for enter/exit animation (not CSS transitions)                                      | The panel needs coordinated enter/exit with content swap (batch vs deep-dive). Framer Motion's `AnimatePresence` with `mode="wait"` handles this cleanly. The narration panel is a choreographed element (appears/disappears on focus), not an ambient one, placing it in Tier 2 of the three-tier animation architecture.                                                                                            | AD-3 (Three-Tier Animation Architecture)                                           |
| D-7  | Graceful degradation renders NOTHING when Ollama is unavailable (no "AI unavailable" message)                            | Showing "AI narration unavailable" draws attention to a missing feature that the user may not have expected. The correct behavior is invisible absence -- the station renders standard telemetry without any hint that narration could exist. This follows more-for-ui.md's design: "AI interpretation (only when you focus)" implies it is an enhancement, not an expected feature.                                  | AD-7 (system works without AI), UX principle (invisible absence > visible failure) |
| D-8  | `NarrationSkeleton` is shown ONLY when Ollama is available AND the first cycle has not completed                         | If Ollama is available, the user should see a brief loading state during the initial 30-second cycle. After the first narrations are cached, skeletons are never shown again (subsequent cycles update narrations in place). If Ollama is unavailable, no skeleton is shown (graceful degradation).                                                                                                                   | UX: loading states only when resolution is expected                                |
| D-9  | Deep-dive narration temporarily overrides batch narration (dismissible)                                                  | The user explicitly requested a deeper analysis. Showing it alongside the batch narration would create visual noise. The deep-dive replaces the batch, with an `X` button to dismiss and revert. The batch narration is still cached and displayed immediately on dismiss.                                                                                                                                            | UX: user-initiated actions take precedence                                         |
| D-10 | Ollama health recheck interval is 60 seconds (not 30 seconds) when Ollama is down                                        | Rechecking a dead endpoint every 30 seconds is wasteful. 60 seconds balances responsiveness (Ollama starts up within 5-10 seconds typically) against unnecessary network requests.                                                                                                                                                                                                                                    | Engineering judgment, polling hygiene                                              |
| D-11 | The `narrated-telemetry-deep` feature routes through `AIRouter.route()` even though Claude is not available until WS-4.1 | The deep-dive path uses `AIRouter` to future-proof the routing. In Phase 3, `AIRouter` routes to Ollama (as fallback). In Phase 4, when WS-4.1 ships Claude integration, deep-dives automatically upgrade to Claude without any narration code changes. For Phase 3, the Route Handler calls Ollama directly (the `AIRouter` integration is wired in the hook layer for when `LiveAIRouter` replaces `StubAIRouter`). | AD-7 (interface abstraction for phased delivery)                                   |
| D-12 | Prompt templates use JSON mode (`format: "json"`) for structured output                                                  | Ollama's `format: "json"` mode constrains the model to output valid JSON. This eliminates fragile regex/string parsing of natural language responses. The three-field structure (`whatChanged`, `whyItMatters`, `whatToDoNext`) is enforced both by the system prompt and the JSON format constraint.                                                                                                                 | Ollama API feature, reliability                                                    |
| D-13 | Batch narration temperature is 0.3 (low), deep-dive is 0.7 (moderate)                                                    | Batch narrations run every 30 seconds and should be deterministic and consistent. Low temperature reduces variation between cycles for the same system state. Deep-dive narrations are user-requested and benefit from richer, more varied analysis.                                                                                                                                                                  | Prompt engineering best practice                                                   |

---

## 7. Open Questions

| #    | Question                                                                                                                                                                                                                                                                       | Impact                                                                                                                                                                                                                                                                                                                                               | Owner                      | Resolution Deadline                |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------- |
| OQ-1 | Should the narration cycle start automatically on app load, or require a user toggle (e.g., "Enable AI insights" in settings)?                                                                                                                                                 | If automatic, Ollama begins processing immediately. If toggle-gated, the user controls when AI resources are used. Automatic is simpler and matches the "calm ambient intelligence" vision, but adds Ollama load even when the user is not looking at station panels.                                                                                | Project Lead               | Before execution begins            |
| OQ-2 | What Ollama model should be the default? `llama3.2` (3B parameters, fast) or `llama3.2:1b` (1B parameters, faster but less capable)?                                                                                                                                           | The 3B model produces better narrations but takes ~3-8 seconds per generation. The 1B model is ~2x faster but may produce lower-quality interpretations. With 30-second cycles and sequential generation, the 3B model can handle 4-6 apps per cycle.                                                                                                | Project Lead               | Before execution begins            |
| OQ-3 | Should narrations be generated for OFFLINE and UNKNOWN apps?                                                                                                                                                                                                                   | Currently, the delta computation includes all apps. Generating narrations for apps that are intentionally offline ("TarvaCORE is offline. This is expected -- it is an Electron app that runs when launched manually.") adds context but uses Ollama capacity. Alternatively, skip these apps and only narrate OPERATIONAL, DEGRADED, and DOWN apps. | Project Lead               | During implementation              |
| OQ-4 | How should the `NarrationPanel` interact with the station panel framework (WS-2.6)? Should it be a dedicated body section, a footer overlay, or a collapsible panel within the station body?                                                                                   | The station panel has a strict 3-zone layout (Header/Body/Actions). The narration panel could be: (a) part of the Body zone (alongside telemetry), (b) a new optional 4th zone between Body and Actions, or (c) a floating overlay that appears on district focus. Option (a) is simplest and matches the integration example in Section 4.13.       | UI Designer (WS-2.6 owner) | Before integration with WS-2.2-2.5 |
| OQ-5 | Should the deep-dive narration generate a receipt? The batch narrations are background and high-volume (one per app per cycle). Receipts for every batch narration would flood the Evidence Ledger. But deep-dives are explicit user actions and should arguably be receipted. | If only deep-dives get receipts: low noise, clear audit trail for user-initiated AI actions. If batch narrations also get receipts: high noise (6 receipts per 30s cycle = 720 per hour). Recommendation: receipt for deep-dives only, not batch.                                                                                                    | Project Lead               | During implementation              |
| OQ-6 | Does WS-3.4 (AI Camera Director) depend on this workstream's Ollama client, or does it bring its own? Since both consume the same `localhost:11434` Ollama server, sharing the client avoids duplication. But WS-3.4 may have different timeout/retry requirements.            | If shared: this SOW defines the canonical `ollama-client.ts` that WS-3.4 imports. If separate: both workstreams implement their own clients with potential divergence. The SOW currently assumes shared.                                                                                                                                             | Chief Technology Architect | Before WS-3.4 planning             |

---

## 8. Risk Register

| #   | Risk                                                                                                             | Likelihood | Impact                                                   | Mitigation                                                                                                                                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | Ollama is not running when the Launch starts                                                                     | High       | None -- graceful degradation                             | The narration cycle checks Ollama health on startup. If unavailable, no narration UI is rendered. The cycle rechecks every 60 seconds and starts automatically when Ollama becomes available. Zero user impact -- the Launch functions identically to its non-AI state.                                                 |
| R-2 | Required model (`llama3.2`) is not pulled on Ollama                                                              | Medium     | Medium -- Ollama is running but narration fails          | `isModelAvailable()` checks the model list on startup. If the model is missing, a console warning is logged with the `ollama pull` command needed. The narration cycle does not start until the model is confirmed available.                                                                                           |
| R-3 | Ollama generation latency exceeds 30-second cycle interval                                                       | Medium     | Low -- cycle overlaps are prevented                      | The cycle uses a guard (`isRunningRef`) that prevents concurrent cycles. If a cycle takes 35 seconds, the next scheduled cycle is skipped. The narration store retains the previous cycle's narrations, so the UI always shows something (slightly stale).                                                              |
| R-4 | Ollama returns invalid JSON despite `format: "json"` mode                                                        | Low        | Low -- single narration skipped                          | The Route Handler validates the response shape with `isValidNarrationShape()`. Invalid responses return a 502 error. The narration service logs the failure and moves to the next app. The cached narration from the previous cycle remains displayed.                                                                  |
| R-5 | Narration text is low quality or nonsensical (model hallucination)                                               | Medium     | Low -- user sees confusing text but system is unaffected | The batch narration temperature is set to 0.3 for consistency. The prompt is structured with specific data points, reducing hallucination surface. Users can request a deep-dive for better analysis. The narration is clearly labeled "AI Insight" to set appropriate trust expectations.                              |
| R-6 | Rate limit (10 calls/min) is insufficient for 6 apps at 30s cadence                                              | Low        | Low -- some apps skip narration                          | At 6 apps per 30s cycle, the system makes 12 calls/min if all apps change every cycle. In practice, the delta filter reduces this to 1-3 calls per cycle. If the limit is hit, the `MAX_BATCH_CALLS_PER_CYCLE` cap ensures 4 calls remain for deep-dive requests. Worst case: some apps show slightly stale narrations. |
| R-7 | Ollama model loading causes high memory usage on the developer machine                                           | Medium     | Medium -- machine becomes sluggish                       | `llama3.2` (3B) requires ~2GB RAM. The model is loaded once and stays resident. If memory is a concern, `llama3.2:1b` (1B) uses ~1GB. The narration system can be disabled entirely by not running Ollama. See OQ-1 about adding a user toggle.                                                                         |
| R-8 | Deep-dive narration takes too long (Claude unavailable in Phase 3, Ollama fallback is slow for complex analysis) | Medium     | Low -- user sees "Analyzing..." state                    | The deep-dive button shows a loading state ("Analyzing...") immediately. The Route Handler has a 30-second timeout. If the deep-dive fails, the batch narration remains visible. In Phase 4 when Claude is available, deep-dives will be faster and higher quality.                                                     |
| R-9 | CORS issues between browser and Ollama despite Route Handler proxy                                               | Low        | High -- narration system broken                          | All Ollama calls go through `POST /api/narrate` (same-origin Route Handler). The browser never contacts `localhost:11434` directly. This eliminates CORS entirely. The only risk is if someone refactors to direct client-side fetch, which the code comments explicitly warn against.                                  |

---

## Appendix A: File Manifest

| File                                              | Action | Description                                                                                                                 |
| ------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/ai/narration-types.ts`                   | CREATE | TypeScript types: Narration, AppDelta, NarrationRequest/Result, NarrationCacheEntry, NarrationCycleStatus, Ollama API types |
| `src/lib/ai/ollama-client.ts`                     | CREATE | Shared Ollama HTTP client: health check, model discovery, text/JSON generation. Used by WS-3.6 and WS-3.4.                  |
| `src/lib/ai/narration-prompts.ts`                 | CREATE | System prompts and user prompt builders for batch and deep-dive narration tiers                                             |
| `src/lib/ai/narration-service.ts`                 | CREATE | Background narration orchestrator: delta computation, cycle execution, rate-limited generation                              |
| `src/lib/ai/index.ts`                             | CREATE | Barrel export for all AI library modules                                                                                    |
| `src/app/api/narrate/route.ts`                    | CREATE | Server-side POST handler: receives NarrationRequest, calls Ollama, returns NarrationResult                                  |
| `src/stores/narration.store.ts`                   | CREATE | Zustand store with immer: per-app narration cache, cycle status tracking                                                    |
| `src/hooks/use-narration-cycle.ts`                | CREATE | Background cycle hook: 30-second interval, Ollama health monitoring, store updates                                          |
| `src/hooks/use-narration.ts`                      | CREATE | Consumer hook: per-app narration access, deep-dive request, graceful degradation                                            |
| `src/components/telemetry/narration-panel.tsx`    | CREATE | Display component: three-part narration, deep-dive button, entrance animation                                               |
| `src/components/telemetry/narration-skeleton.tsx` | CREATE | Loading placeholder: pulsing skeleton during initial cycle                                                                  |
| `src/components/telemetry/index.ts`               | MODIFY | Add NarrationPanel and NarrationSkeleton exports to existing barrel                                                         |

---

## Appendix B: Execution Checklist

```
[ ] 1. Verify WS-1.5, WS-1.7, and WS-2.6 are complete (telemetry pipeline, interfaces, station framework)
[ ] 2. Verify Ollama is installed and llama3.2 model is pulled: `ollama list`
[ ] 3. Create src/lib/ai/narration-types.ts (Section 4.1)
[ ] 4. Create src/lib/ai/ollama-client.ts (Section 4.2)
[ ] 5. Create src/lib/ai/narration-prompts.ts (Section 4.3)
[ ] 6. Create src/app/api/narrate/route.ts (Section 4.4)
[ ] 7. Create src/lib/ai/narration-service.ts (Section 4.5)
[ ] 8. Create src/stores/narration.store.ts (Section 4.6)
[ ] 9. Create src/hooks/use-narration-cycle.ts (Section 4.7)
[ ] 10. Create src/hooks/use-narration.ts (Section 4.8)
[ ] 11. Create src/components/telemetry/narration-panel.tsx (Section 4.9)
[ ] 12. Create src/components/telemetry/narration-skeleton.tsx (Section 4.10)
[ ] 13. Create src/lib/ai/index.ts (Section 4.11)
[ ] 14. Modify src/components/telemetry/index.ts (Section 4.12)
[ ] 15. Verify AC-1: Ollama health check detects availability
[ ] 16. Verify AC-2: Model availability check works
[ ] 17. Verify AC-3: POST /api/narrate returns valid NarrationResult
[ ] 18. Verify AC-4: POST /api/narrate returns 503 when Ollama down
[ ] 19. Verify AC-5: Invalid Ollama response handled gracefully
[ ] 20. Verify AC-6: Batch prompt produces three-part JSON
[ ] 21. Verify AC-7: Deep-dive prompt produces richer analysis
[ ] 22. Verify AC-8: Delta computation detects health changes
[ ] 23. Verify AC-9: Delta computation detects no-change scenarios
[ ] 24. Verify AC-10: Background cycle runs on 30-second cadence
[ ] 25. Verify AC-11: Unchanged apps are skipped
[ ] 26. Verify AC-12: Cycle pauses when Ollama unavailable
[ ] 27. Verify AC-13: Cycle resumes when Ollama returns
[ ] 28. Verify AC-14: Narration store caches per-app narrations
[ ] 29. Verify AC-15: useNarration() hook returns correct data
[ ] 30. Verify AC-16: Deep-dive overrides batch narration
[ ] 31. Verify AC-17: NarrationPanel renders three sections
[ ] 32. Verify AC-18: NarrationPanel entrance/exit animation works
[ ] 33. Verify AC-19: Relative timestamp displays correctly
[ ] 34. Verify AC-20: Deep dive button triggers callback
[ ] 35. Verify AC-21: NarrationSkeleton shows during initial cycle only
[ ] 36. Verify AC-22: Graceful degradation when Ollama offline
[ ] 37. Verify AC-23: Stale narrations remain visible after Ollama disconnect
[ ] 38. Verify AC-24: Rate limit respected (max 6 batch + 4 deep-dive per minute)
[ ] 39. Verify AC-25: pnpm typecheck passes
[ ] 40. Verify AC-26: Provider badge displays correctly
[ ] 41. Run pnpm lint, pnpm format:check -- both pass
[ ] 42. Commit with message: "feat: implement AI-narrated telemetry system (WS-3.6)"
```

---

## Appendix C: Ollama API Reference

The following endpoints are used by the Ollama client. Documented here for implementation reference.

**Health Check** -- `GET http://localhost:11434/`

- Returns: `"Ollama is running"` (text/plain)
- Used to detect if Ollama is alive before starting the narration cycle.

**Model List** -- `GET http://localhost:11434/api/tags`

- Returns: `{ "models": [{ "name": "llama3.2:latest", "size": 2019393189, ... }] }`
- Used to verify the required model is pulled.

**Generate** -- `POST http://localhost:11434/api/generate`

- Request: `{ "model": "llama3.2", "prompt": "...", "system": "...", "stream": false, "format": "json", "options": { "temperature": 0.3, "num_predict": 256 } }`
- Response: `{ "model": "llama3.2", "response": "{\"whatChanged\":\"...\",\"whyItMatters\":\"...\",\"whatToDoNext\":\"...\"}", "done": true, "total_duration": 5432000000 }`
- The `response` field contains the model's output as a string. When `format: "json"` is used, this string is guaranteed to be valid JSON.

---

## Appendix D: Narration Examples

Example narrations that the system should produce for common scenarios.

**Healthy, stable app (Agent Builder):**

```json
{
  "whatChanged": "Agent Builder has been stable for 2 hours with consistent 140ms response times.",
  "whyItMatters": "No changes detected -- the system is operating within normal parameters.",
  "whatToDoNext": "No action needed."
}
```

**Health state change (Project Room goes DOWN):**

```json
{
  "whatChanged": "Project Room stopped responding 30 seconds ago after 4 hours of stable operation.",
  "whyItMatters": "This is likely a process crash since the app was previously healthy. Active runs may be interrupted.",
  "whatToDoNext": "Check the Project Room terminal for error output. Restart the process if needed."
}
```

**Alert count increase (Tarva Chat):**

```json
{
  "whatChanged": "Tarva Chat has 2 new alerts since the last check. The database sub-check is reporting failures.",
  "whyItMatters": "Database connectivity issues may cause conversation data to be unavailable or stale.",
  "whatToDoNext": "Verify Supabase connectivity. Check if the Supabase service is running and accessible."
}
```

**Response time degradation (TarvaERP):**

```json
{
  "whatChanged": "TarvaERP response times increased 35% from 180ms to 243ms over the last 2 minutes.",
  "whyItMatters": "Gradual response time increases often indicate resource exhaustion or growing query load.",
  "whatToDoNext": "Monitor for the next 2-3 cycles. If the trend continues, check ERP server resource usage."
}
```

**Offline app (TarvaCORE):**

```json
{
  "whatChanged": "TarvaCORE remains offline. It has not been contacted in this session.",
  "whyItMatters": "This is expected -- TarvaCORE is an Electron app that runs when manually launched.",
  "whatToDoNext": "No action needed unless you intend to use TarvaCORE."
}
```

**Deep-dive example (Agent Builder detailed):**

```json
{
  "whatChanged": "Agent Builder has been operational for 4 hours and 23 minutes. Response times have been gradually improving, trending from 165ms to 138ms over the last 10 polling cycles. The database and dependency sub-checks are both passing. There are 3 active generation runs in the pipeline. No alerts have been raised during this session.",
  "whyItMatters": "The improving response time trend suggests the application has fully warmed up and is operating at peak efficiency. The 3 active runs indicate normal pipeline activity. The zero-alert status over 4+ hours is a strong indicator of system health. There are no concerning patterns in the telemetry data.",
  "whatToDoNext": "No immediate action required. The system is healthy and performing well. Continue monitoring during the next pipeline run cycle. Consider checking the active generation runs periodically to ensure they complete successfully."
}
```
