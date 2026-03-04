/**
 * AIRouter -- Feature-based AI provider routing.
 *
 * Phase 1: StubAIRouter (all features return unavailable).
 * Phase 3: LiveAIRouter routes to Ollama, Claude, rule-engine, or pattern-matcher.
 *
 * The routing table from tech-decisions.md defines which provider handles
 * each feature, with a fallback chain. The AIRouter abstracts this so that
 * consumers call route({ feature: 'camera-director-nl', input: {...} })
 * without knowing which provider will handle it.
 *
 * Per AD-7: "The system works without AI. If AI breaks, telemetry and
 * spatial navigation still function."
 *
 * References: AD-7 (AI Integration Architecture),
 * tech-decisions.md (Feature-by-Feature AI Routing, Cost Control)
 */

import type { ISOTimestamp } from './types'
import type { SystemSnapshot } from './system-state-provider'

// ============================================================================
// AI Features
// ============================================================================

/**
 * All AI-powered features in Tarva Launch.
 * Each feature has a primary provider and optional fallback.
 * Per tech-decisions.md routing table.
 */
export type AIFeature =
  | 'camera-director-structured'
  | 'camera-director-nl'
  | 'station-template-selection'
  | 'narrated-telemetry-batch'
  | 'narrated-telemetry-deep'
  | 'exception-triage'
  | 'builder-mode'

// ============================================================================
// AI Providers
// ============================================================================

/**
 * Available AI providers, ordered by intelligence tier.
 * Per AD-7: pattern-matcher -> rule-engine -> Ollama -> Claude.
 */
export type AIProvider = 'pattern-matcher' | 'rule-engine' | 'ollama' | 'claude'

// ============================================================================
// AI Request / Response
// ============================================================================

/** Input to the AIRouter. Consumers provide the feature and input data. */
export interface AIRequest {
  /** Which feature to invoke. Determines provider selection. */
  readonly feature: AIFeature
  /**
   * Feature-specific input payload. The AIRouter passes this to the
   * selected provider. Shape depends on the feature.
   */
  readonly input: Record<string, unknown>
  /** Optional system state context. Providers may use this for richer responses. */
  readonly context?: SystemSnapshot
  /** Optional timeout in ms. Default: 10000 (10s). */
  readonly timeout?: number
}

/** Output from the AIRouter. Includes provider metadata for receipts. */
export interface AIResponse {
  /** Whether the request succeeded. */
  readonly success: boolean
  /** Which provider handled the request. */
  readonly provider: AIProvider
  /**
   * Feature-specific result payload. Shape depends on the feature.
   * For camera-director: CameraDirective
   * For narrated-telemetry: { narration: string }
   * For exception-triage: { classification: string, severity: string, recoveryTemplate: string }
   */
  readonly result: Record<string, unknown>
  /** End-to-end latency in milliseconds. */
  readonly latencyMs: number
  /** True if the primary provider failed and a fallback was used. */
  readonly fallbackUsed: boolean
  /** Error message if success is false. */
  readonly error?: string
  /** Model ID used (e.g., "llama3.2", "claude-sonnet-4-20250514"). Null for non-LLM providers. */
  readonly modelId?: string | null
}

// ============================================================================
// Routing Configuration
// ============================================================================

/**
 * A single routing rule mapping a feature to its provider chain.
 * Per tech-decisions.md Feature-by-Feature AI Routing table.
 */
export interface RoutingRule {
  /** Which feature this rule applies to. */
  readonly feature: AIFeature
  /** First-choice provider. */
  readonly primary: AIProvider
  /** Fallback provider if primary fails. Null = no fallback. */
  readonly fallback: AIProvider | null
  /** Why this routing was chosen (documentation only). */
  readonly rationale: string
}

/** The complete routing table from tech-decisions.md. */
export const AI_ROUTING_TABLE: readonly RoutingRule[] = [
  {
    feature: 'camera-director-structured',
    primary: 'pattern-matcher',
    fallback: null,
    rationale: '"go core", "home", "zoom out" need no LLM.',
  },
  {
    feature: 'camera-director-nl',
    primary: 'ollama',
    fallback: 'claude',
    rationale:
      'Spatial reasoning tractable for small models; camera drifts speculatively during latency.',
  },
  {
    feature: 'station-template-selection',
    primary: 'rule-engine',
    fallback: 'ollama',
    rationale: 'Deterministic scoring preferred; LLM only breaks ties.',
  },
  {
    feature: 'narrated-telemetry-batch',
    primary: 'ollama',
    fallback: 'claude',
    rationale: 'Background generation on 30s cadence; cached; no user-facing latency.',
  },
  {
    feature: 'narrated-telemetry-deep',
    primary: 'claude',
    fallback: 'ollama',
    rationale: 'User explicitly requests explanation; quality matters.',
  },
  {
    feature: 'exception-triage',
    primary: 'ollama',
    fallback: 'rule-engine',
    rationale: 'Classification within small-model capability.',
  },
  {
    feature: 'builder-mode',
    primary: 'claude',
    fallback: null,
    rationale: 'Novel station layouts from NL requires strong reasoning.',
  },
] as const

// ============================================================================
// Provider Status
// ============================================================================

/** Health status of a single AI provider. */
export interface ProviderStatus {
  /** Which provider. */
  readonly provider: AIProvider
  /** Whether the provider is currently reachable and ready. */
  readonly available: boolean
  /** When the last health check was performed. */
  readonly lastCheck: ISOTimestamp | null
  /** Error details if unavailable. */
  readonly error: string | null
}

// ============================================================================
// Cost Tracking (per tech-decisions.md Cost Control)
// ============================================================================

/** Per-session AI cost tracking. Displayed in settings panel. */
export interface AISessionCost {
  /** Total AI API calls this session. */
  readonly totalCalls: number
  /** Calls by provider. */
  readonly callsByProvider: Readonly<Record<AIProvider, number>>
  /** Calls by feature. */
  readonly callsByFeature: Readonly<Record<AIFeature, number>>
  /** Estimated total cost in USD (Claude API only; Ollama is free). */
  readonly estimatedCostUsd: number
}

// ============================================================================
// AIRouter Interface
// ============================================================================

export interface AIRouter {
  /**
   * Route an AI request to the appropriate provider.
   *
   * The router:
   * 1. Looks up the routing rule for the feature
   * 2. Checks if the primary provider is available
   * 3. If available, sends the request to the primary
   * 4. If primary fails, tries the fallback (if defined)
   * 5. Records the routing decision in the response
   *
   * Phase 1: always returns { success: false, error: 'AI not available' }
   */
  route(request: AIRequest): Promise<AIResponse>

  /**
   * Check if a specific AI feature is available (provider reachable).
   * Phase 1: always returns false.
   */
  isAvailable(feature: AIFeature): boolean

  /** Get the health status of all AI providers. */
  getProviderStatus(): readonly ProviderStatus[]

  /** Get the routing rule for a specific feature. */
  getRoutingRule(feature: AIFeature): RoutingRule | null

  /** Get the complete routing table. */
  getRoutingTable(): readonly RoutingRule[]

  /** Get the current session's AI cost tracking. */
  getSessionCost(): AISessionCost
}

// ============================================================================
// Phase 1 Implementation: StubAIRouter
// ============================================================================

/**
 * Phase 1 AIRouter. All features return unavailable.
 *
 * This stub ensures that:
 * - Consumers can call route() without errors
 * - isAvailable() returns false (AI features are gated on this check)
 * - The routing table is accessible for documentation/UI purposes
 * - Session cost tracking starts at zero
 *
 * Phase 3 replacement: LiveAIRouter connects to Ollama and Claude.
 */
export class StubAIRouter implements AIRouter {
  async route(request: AIRequest): Promise<AIResponse> {
    return {
      success: false,
      provider: 'pattern-matcher',
      result: {},
      latencyMs: 0,
      fallbackUsed: false,
      error: `AI feature "${request.feature}" is not available. AI integration ships in Phase 3.`,
      modelId: null,
    }
  }

  isAvailable(_feature: AIFeature): boolean {
    return false
  }

  getProviderStatus(): readonly ProviderStatus[] {
    return [
      { provider: 'pattern-matcher', available: false, lastCheck: null, error: 'Phase 1 stub' },
      { provider: 'rule-engine', available: false, lastCheck: null, error: 'Phase 1 stub' },
      { provider: 'ollama', available: false, lastCheck: null, error: 'Phase 1 stub' },
      { provider: 'claude', available: false, lastCheck: null, error: 'Phase 1 stub' },
    ]
  }

  getRoutingRule(feature: AIFeature): RoutingRule | null {
    return AI_ROUTING_TABLE.find((r) => r.feature === feature) ?? null
  }

  getRoutingTable(): readonly RoutingRule[] {
    return AI_ROUTING_TABLE
  }

  getSessionCost(): AISessionCost {
    return {
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
  }
}
