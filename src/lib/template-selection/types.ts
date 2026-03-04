/**
 * Types for the dynamic station template selection system.
 *
 * The selection pipeline:
 * 1. TriggerConditionEvaluator evaluates conditions against SystemSnapshot
 * 2. TemplateScorer computes weighted activation scores
 * 3. TemplateSelector picks top N and detects ties
 * 4. SelectionReceiptGenerator records the decision
 *
 * References: AD-7 (AI Integration Architecture), WS-1.7 Section 4.5,
 * tech-decisions.md (station-template-selection routing)
 */

import type { AppIdentifier, ISOTimestamp } from '@/lib/interfaces/types'
import type { StationTemplate, TriggerCondition } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Trigger Evaluation
// ============================================================================

/**
 * Result of evaluating a single TriggerCondition against a SystemSnapshot.
 * Used for audit trail and template browser score breakdown.
 */
export interface TriggerEvaluationResult {
  /** The condition that was evaluated. */
  readonly condition: TriggerCondition
  /** Whether the condition matched. */
  readonly matched: boolean
  /** The actual value found at the dot-path (null if path not found). */
  readonly actualValue: unknown
  /** Weight contribution: condition.weight if matched, 0 if not. */
  readonly weightContribution: number
  /** Human-readable explanation of the evaluation. */
  readonly explanation: string
}

// ============================================================================
// Scored Template
// ============================================================================

/**
 * A station template with its computed activation score and evaluation details.
 */
export interface ScoredTemplate {
  /** The template that was scored. */
  readonly template: StationTemplate
  /** Trigger activation score (0.0-1.0). Based on weighted trigger matches. */
  readonly triggerScore: number
  /** Normalized priority score (0.0-1.0). Derived from template.priority. */
  readonly priorityScore: number
  /** Final blended score. Used for ranking. */
  readonly finalScore: number
  /** Per-condition evaluation details for the template browser. */
  readonly triggerDetails: readonly TriggerEvaluationResult[]
  /** Whether this template had any triggers to evaluate. */
  readonly hasTriggers: boolean
}

// ============================================================================
// Selection Result
// ============================================================================

/**
 * The complete result of a template selection for a district.
 * Stored as receipt detail and exposed to the template browser.
 */
export interface SelectionResult {
  /** Which district this selection applies to. */
  readonly districtId: AppIdentifier
  /** The selected templates, ordered by final score descending. */
  readonly selected: readonly ScoredTemplate[]
  /** Templates that were evaluated but not selected. */
  readonly alternatives: readonly ScoredTemplate[]
  /** Whether AI tie-breaking was invoked. */
  readonly aiTieBreakerUsed: boolean
  /** If AI was used, the provider that resolved the tie. */
  readonly aiProvider: string | null
  /** If AI was used, the latency in ms. */
  readonly aiLatencyMs: number | null
  /** Timestamp of this selection. */
  readonly timestamp: ISOTimestamp
  /** The SystemSnapshot that was used for evaluation. */
  readonly snapshotTimestamp: ISOTimestamp
  /** Correlation ID linking this selection to its receipt. */
  readonly correlationId: string
}

// ============================================================================
// Selection Configuration
// ============================================================================

/**
 * Configuration for the template selection algorithm.
 */
export interface SelectionConfig {
  /**
   * Maximum number of templates to select per district.
   * Default: 5 (2 universal + up to 3 app-specific).
   */
  readonly maxTemplatesPerDistrict: number
  /**
   * Minimum number of templates to always show per district.
   * These are filled from universal templates if not enough score.
   * Default: 2 (Launch + Status).
   */
  readonly minTemplatesPerDistrict: number
  /**
   * Weight of the trigger score in the final blended score.
   * finalScore = triggerScore * triggerWeight + priorityScore * (1 - triggerWeight)
   * Default: 0.7 (trigger relevance dominates, but priority still matters).
   */
  readonly triggerWeight: number
  /**
   * Score difference threshold for tie detection.
   * If two templates' finalScores are within this delta, they are tied.
   * Default: 0.05.
   */
  readonly tieThreshold: number
  /**
   * Whether to invoke AIRouter for tie-breaking when ties are detected.
   * Default: true. Set to false to always use priority ordering for ties.
   */
  readonly enableAITieBreaker: boolean
  /**
   * Timeout for AI tie-breaking in milliseconds.
   * If AI does not respond in time, fall back to priority ordering.
   * Default: 3000 (3 seconds).
   */
  readonly aiTieBreakerTimeoutMs: number
  /**
   * Maximum priority value used for priority score normalization.
   * priorityScore = template.priority / maxPriority.
   * Default: 100 (matching the universal template priority ceiling).
   */
  readonly maxPriority: number
}

/** Default selection configuration. */
export const DEFAULT_SELECTION_CONFIG: Readonly<SelectionConfig> = {
  maxTemplatesPerDistrict: 5,
  minTemplatesPerDistrict: 2,
  triggerWeight: 0.7,
  tieThreshold: 0.05,
  enableAITieBreaker: true,
  aiTieBreakerTimeoutMs: 3_000,
  maxPriority: 100,
} as const

// ============================================================================
// Pinned Override
// ============================================================================

/**
 * A user-pinned template override.
 * Pinned templates are always included in the selection set,
 * regardless of their trigger score.
 */
export interface PinnedOverride {
  /** The template ID that was pinned. */
  readonly templateId: string
  /** Which district this pin applies to. */
  readonly districtId: AppIdentifier
  /** When the user pinned this template. */
  readonly pinnedAt: ISOTimestamp
  /** The receipt correlation ID for the pin action. */
  readonly receiptCorrelationId: string
}

// ============================================================================
// Template Browser State
// ============================================================================

/**
 * UI state for the template browser panel.
 * Managed by useTemplateBrowser hook.
 */
export interface TemplateBrowserState {
  /** Whether the browser panel is open. */
  readonly isOpen: boolean
  /** Which district the browser is showing templates for. */
  readonly districtId: AppIdentifier | null
  /** Current search/filter text. */
  readonly searchQuery: string
  /** Filter by category. Null = show all. */
  readonly categoryFilter: 'universal' | 'app-specific' | null
  /** The most recent selection result (for displaying scores). */
  readonly lastSelectionResult: SelectionResult | null
  /** Active pinned overrides. */
  readonly pinnedOverrides: readonly PinnedOverride[]
}
