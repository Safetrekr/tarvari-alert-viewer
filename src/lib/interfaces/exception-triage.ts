/**
 * Exception Triage types.
 *
 * Defines the classification taxonomy and data structures for the
 * exception triage system. Failures are classified into four categories,
 * each mapping to a recovery UI template.
 *
 * References: AD-7 (AI Integration Architecture),
 * tech-decisions.md (exception-triage: Ollama primary, rule-engine fallback),
 * combined-recommendations.md Phase 4 Work Area #2
 */

import type { AppIdentifier, HealthState, ISOTimestamp } from './types'
import type { AIProvider } from './ai-router'

// ============================================================================
// Exception Categories
// ============================================================================

/**
 * The four failure classification categories.
 *
 * Each category maps to a recovery UI template and a set of
 * recommended actions.
 */
export type ExceptionCategory =
  | 'transient' // Temporary -- retry likely to succeed
  | 'permanent' // Unrecoverable -- requires human intervention
  | 'policy' // Configuration/rule violation -- change a setting
  | 'missing-info' // Cannot classify -- need more context

// ============================================================================
// Exception Source Data
// ============================================================================

/**
 * Raw exception data extracted from telemetry.
 * This is the input to the classifier.
 */
export interface ExceptionData {
  /** Unique ID for this exception instance. */
  readonly id: string
  /** Which app reported the exception. */
  readonly districtId: AppIdentifier
  /** The app's display name. */
  readonly displayName: string
  /** Current health state of the app. */
  readonly health: HealthState
  /** Number of active alerts. */
  readonly alertCount: number
  /** Raw error message, if available. */
  readonly errorMessage: string | null
  /** HTTP status code, if applicable. */
  httpStatus: number | null
  /** Error code identifier (e.g., 'ECONNREFUSED', 'ETIMEDOUT'). */
  readonly errorCode: string | null
  /** The app's pulse description (e.g., '3 runs active'). */
  readonly pulse: string | null
  /** Last known event from telemetry. */
  readonly lastEvent: string | null
  /** How long since last successful health check (ms). */
  readonly downDurationMs: number | null
  /** Timestamp when the exception was detected. */
  readonly detectedAt: ISOTimestamp
  /** Previous health state (for transition detection). */
  readonly previousHealth: HealthState | null
}

// ============================================================================
// Classification Result
// ============================================================================

/**
 * The output of the exception classifier.
 * Contains the category, confidence, and reasoning for the classification.
 */
export interface ClassificationResult {
  /** The classified category. */
  readonly category: ExceptionCategory
  /** Confidence in the classification (0.0-1.0). */
  readonly confidence: number
  /** Human-readable explanation of why this category was chosen. */
  readonly reasoning: string
  /** Which provider performed the classification. */
  readonly provider: AIProvider
  /** Alternative classifications considered. */
  readonly alternatives: readonly AlternativeClassification[]
  /** End-to-end classification latency in ms. */
  readonly latencyMs: number
  /** Ollama model ID, if LLM was used. */
  readonly modelId: string | null
  /** Suggested recovery actions based on the classification. */
  readonly suggestedActions: readonly SuggestedAction[]
  /** Plain-language summary of the failure for the user. */
  readonly userSummary: string
}

/** An alternative classification that was considered but not chosen. */
export interface AlternativeClassification {
  readonly category: ExceptionCategory
  readonly confidence: number
  readonly reason: string
}

/** A suggested recovery action from the classifier. */
export interface SuggestedAction {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly actionType: 'retry' | 'escalate' | 'configure' | 'investigate' | 'dismiss'
  /** Command to execute if the action is taken (for receipt tracking). */
  readonly command: string | null
}

// ============================================================================
// Intervention State
// ============================================================================

/**
 * The state of an active intervention for a single exception.
 * Managed by the triage store.
 */
export interface InterventionState {
  /** The original exception data. */
  readonly exception: ExceptionData
  /** The classification result. */
  readonly classification: ClassificationResult
  /** Current status of the intervention. */
  status: InterventionStatus
  /** For transient exceptions: retry state. */
  retry: RetryState | null
  /** Timestamp when the intervention was created. */
  readonly createdAt: ISOTimestamp
  /** Timestamp when the intervention was resolved (if resolved). */
  resolvedAt: ISOTimestamp | null
  /** The receipt correlation ID for this intervention. */
  readonly receiptCorrelationId: string
}

export type InterventionStatus =
  | 'active' // Intervention is displayed and awaiting user action or auto-resolution
  | 'retrying' // A retry is in progress (transient only)
  | 'resolved' // The exception has cleared (health restored)
  | 'dismissed' // User dismissed the intervention
  | 'escalated' // User escalated to external action

/** Retry state for transient failures. */
export interface RetryState {
  /** Number of retries attempted. */
  attemptCount: number
  /** Maximum retries before escalating to permanent. */
  readonly maxAttempts: number
  /** Seconds until next automatic retry. */
  nextRetryInSeconds: number
  /** Whether auto-retry is enabled. */
  autoRetryEnabled: boolean
}

// ============================================================================
// Triage Configuration
// ============================================================================

/** Configuration for the exception triage system. */
export interface TriageConfig {
  /** How often to check telemetry for new exceptions (ms). Default: 5000. */
  readonly pollIntervalMs: number
  /** Minimum health state change duration before triggering triage (ms). Default: 10000. */
  readonly debounceMs: number
  /** Maximum active interventions per district. Default: 3. */
  readonly maxInterventionsPerDistrict: number
  /** Auto-retry interval for transient failures (seconds). Default: 30. */
  readonly transientRetryIntervalSeconds: number
  /** Maximum auto-retries before escalating transient to permanent. Default: 5. */
  readonly maxTransientRetries: number
  /** Whether to use AI (Ollama) for classification. Default: true. */
  readonly enableAIClassification: boolean
  /** Timeout for AI classification requests (ms). Default: 8000. */
  readonly aiTimeoutMs: number
}

export const DEFAULT_TRIAGE_CONFIG: Readonly<TriageConfig> = {
  pollIntervalMs: 5_000,
  debounceMs: 10_000,
  maxInterventionsPerDistrict: 3,
  transientRetryIntervalSeconds: 30,
  maxTransientRetries: 5,
  enableAIClassification: true,
  aiTimeoutMs: 8_000,
} as const
