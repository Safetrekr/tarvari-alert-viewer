/**
 * AI feature state store.
 *
 * Manages: provider health, active AI requests, speculative drift state,
 * disambiguation state, and session cost tracking.
 *
 * The AI beta toggle is NOT stored here -- it lives in settings.store.ts
 * (aiCameraDirectorEnabled) per WS-3.3. This store reads from settings.store
 * via selectors when checking AI availability.
 *
 * [WS-4.1] Claude provider state: claudeApiKeyConfigured, claudeReady,
 * claudeError, setClaudeStatus(), and USD cost estimation in recordAICost().
 *
 * References:
 * - AD-7 (AI Integration Architecture)
 * - tech-decisions.md (AI Cost Control)
 *
 * @module ai.store
 * @see WS-3.4 Section 4.1
 * @see WS-4.1 Section 4.4
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
  active: boolean
  /** The heuristic best-guess target district. Null if no guess. */
  targetDistrictId: AppIdentifier | null
  /** Confidence in the heuristic guess. 0.0-1.0. */
  confidence: number
  /** Timestamp when drift started. */
  startedAt: number | null
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
  /** Last successful directive result, for display. */
  lastDirective: {
    reasoning: string
    provider: string
    confidence: number
    latencyMs: number
  } | null
  /** [WS-4.1] Whether the Claude API key is configured in .env.local. */
  claudeApiKeyConfigured: boolean
  /** [WS-4.1] Whether Claude is reachable and authenticated. */
  claudeReady: boolean
  /** [WS-4.1] Last Claude health check error, if any. */
  claudeError: string | null
}

export interface AIActions {
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
  /** Increment session cost counters after a completed AI call.
   *  [WS-4.1] Optional estimatedCostUsd for Claude cost tracking. */
  recordAICost: (provider: AIProvider, feature: AIFeature, estimatedCostUsd?: number) => void
  /** Set Ollama readiness state. */
  setOllamaStatus: (ready: boolean, model: string, error: string | null) => void
  /** Reset session cost (e.g., on page reload). */
  resetSessionCost: () => void
  /** Record the last directive for display. */
  setLastDirective: (directive: AIState['lastDirective']) => void
  /** [WS-4.1] Set Claude API status after health check. */
  setClaudeStatus: (ready: boolean, keyConfigured: boolean, error: string | null) => void
}

export type AIStore = AIState & AIActions

// ============================================================================
// Initial State
// ============================================================================

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
    error: 'Not checked yet',
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
  lastDirective: null,
  // [WS-4.1] Claude state
  claudeApiKeyConfigured: false,
  claudeReady: false,
  claudeError: null,
}

// ============================================================================
// Store
// ============================================================================

export const useAIStore = create<AIStore>()(
  immer((set) => ({
    ...INITIAL_STATE,

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

    recordAICost: (provider, feature, estimatedCostUsd?) =>
      set((state) => {
        state.sessionCost.totalCalls += 1
        ;(state.sessionCost.callsByProvider as Record<AIProvider, number>)[provider] += 1
        ;(state.sessionCost.callsByFeature as Record<AIFeature, number>)[feature] += 1
        // [WS-4.1] Claude cost estimation. Ollama remains free ($0).
        if (provider === 'claude' && estimatedCostUsd !== undefined) {
          ;(state.sessionCost as { estimatedCostUsd: number }).estimatedCostUsd +=
            estimatedCostUsd
        }
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

    setLastDirective: (directive) =>
      set((state) => {
        state.lastDirective = directive
      }),

    // [WS-4.1] Claude status management.
    setClaudeStatus: (ready, keyConfigured, error) =>
      set((state) => {
        state.claudeApiKeyConfigured = keyConfigured
        state.claudeReady = ready
        state.claudeError = error
        state.providerStatuses.claude = {
          provider: 'claude',
          available: ready,
          lastCheck: new Date().toISOString(),
          error,
        }
      }),
  })),
)

// ============================================================================
// Selectors
// ============================================================================

export const aiSelectors = {
  /** Whether Ollama is ready for NL queries. */
  isOllamaReady: (state: AIState): boolean => state.ollamaReady,

  /** Whether an AI request is currently in flight. */
  isProcessing: (state: AIState): boolean => state.activeRequest !== null,

  /** Whether disambiguation is awaiting user choice. */
  isDisambiguating: (state: AIState): boolean => state.disambiguation.active,

  /** Whether speculative drift is active. */
  isDrifting: (state: AIState): boolean => state.drift.active,

  /** The configured Ollama model. */
  ollamaModel: (state: AIState): string => state.ollamaModel,

  /** [WS-4.1] Whether Claude is configured and reachable. */
  isClaudeReady: (state: AIState): boolean => state.claudeReady,

  /** [WS-4.1] Whether Claude API key is present (may not be validated). */
  isClaudeConfigured: (state: AIState): boolean => state.claudeApiKeyConfigured,

  /** [WS-4.1] Formatted session cost string for display. */
  formattedSessionCost: (state: AIState): string => {
    const cost = state.sessionCost.estimatedCostUsd
    if (cost === 0) return '$0.00'
    if (cost < 0.01) return `<$0.01 (${state.sessionCost.totalCalls} calls)`
    return `$${cost.toFixed(4)} (${state.sessionCost.totalCalls} calls)`
  },
} as const
