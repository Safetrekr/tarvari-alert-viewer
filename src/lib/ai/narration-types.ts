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
 *
 * @module narration-types
 * @see WS-3.6
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
// Narration Scope
// ============================================================================

/**
 * Narration scope determines the type of narration to generate.
 * - batch: Background 30s cadence narrations (Ollama primary).
 * - deep-dive: User-requested detailed analysis (Claude primary, Ollama fallback).
 * - alert: Alert-triggered narrations for critical state changes.
 */
export type NarrationScope = 'batch' | 'deep-dive' | 'alert'

// ============================================================================
// Narration Request / Response
// ============================================================================

/**
 * Input to the narration Route Handler (POST /api/ai/narrate).
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
// Narration Configuration
// ============================================================================

/**
 * Configuration for the narration system.
 */
export interface NarrationConfig {
  /** Whether the narration system is enabled. */
  readonly enabled: boolean
  /** Ollama model to use for narration. */
  readonly model: string
  /** Cycle interval in milliseconds. Default: 30000. */
  readonly cycleIntervalMs: number
  /** Maximum batch calls per cycle. Default: 6. */
  readonly maxBatchCallsPerCycle: number
  /** Temperature for batch narrations. Default: 0.3. */
  readonly batchTemperature: number
  /** Temperature for deep-dive narrations. Default: 0.7. */
  readonly deepDiveTemperature: number
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
