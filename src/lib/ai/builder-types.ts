/**
 * Types for the Builder Mode system.
 *
 * Builder Mode allows authorized users to describe station configurations
 * in natural language. Claude proposes a StationTemplate; the user reviews,
 * iterates, and accepts or rejects.
 *
 * References: AD-7 (ai-builder-mode routing), WS-3.5 (StationTemplate),
 * tech-decisions.md (Claude primary, no fallback)
 */

import type { AppIdentifier, ISOTimestamp } from '@/lib/interfaces/types'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Builder Session
// ============================================================================

/**
 * The current state of a Builder Mode session.
 * A session starts when Builder Mode is activated and ends when
 * the panel is closed or the user accepts/rejects the final proposal.
 */
export interface BuilderSession {
  /** Unique session ID. */
  readonly id: string
  /** When the session started. */
  readonly startedAt: ISOTimestamp
  /** The user's current natural language description. */
  readonly description: string
  /** The target district for the proposed station. Null until user selects. */
  readonly targetDistrictId: AppIdentifier | null
  /** The current proposal from Claude. Null before first submission. */
  readonly currentProposal: BuilderProposal | null
  /** History of all iterations in this session. */
  readonly iterations: readonly BuilderIteration[]
  /** Current phase of the builder workflow. */
  readonly phase: BuilderPhase
}

/**
 * Phases of the builder workflow state machine.
 *
 * idle -> describing -> generating -> reviewing -> (accept | iterate | reject)
 *   iterate -> describing (loop)
 *   accept -> accepted (terminal)
 *   reject -> idle (reset)
 */
export type BuilderPhase =
  | 'idle' // Builder panel open, no description entered
  | 'describing' // User is typing a description
  | 'generating' // Claude is processing the request
  | 'reviewing' // Proposal received, user is reviewing
  | 'accepted' // User accepted the proposal (terminal for this session)
  | 'rejected' // User rejected the proposal (can start new session)
  | 'error' // Claude returned an error or invalid response

// ============================================================================
// Builder Proposal
// ============================================================================

/**
 * A station configuration proposed by Claude.
 */
export interface BuilderProposal {
  /** The proposed station template configuration. */
  readonly template: StationTemplate
  /** Claude's reasoning for the proposed configuration. */
  readonly reasoning: string
  /** Confidence score (0.0-1.0) in the proposal's fit to the description. */
  readonly confidence: number
  /** Alternative approaches Claude considered. */
  readonly alternatives: readonly string[]
  /** Which Claude model generated this proposal. */
  readonly modelId: string
  /** End-to-end latency of the Claude call in milliseconds. */
  readonly latencyMs: number
  /** The raw prompt sent to Claude (for receipt audit trail). */
  readonly prompt: string
  /** Timestamp of proposal generation. */
  readonly generatedAt: ISOTimestamp
}

// ============================================================================
// Builder Iteration
// ============================================================================

/**
 * A single iteration in the builder workflow.
 * Tracks the description, proposal, and outcome for audit purposes.
 */
export interface BuilderIteration {
  /** Iteration number (1-based). */
  readonly iterationNumber: number
  /** The natural language description for this iteration. */
  readonly description: string
  /** The proposal generated for this iteration. Null if generation failed. */
  readonly proposal: BuilderProposal | null
  /** Error message if generation failed. */
  readonly error: string | null
  /** Outcome of this iteration. */
  readonly outcome: 'accepted' | 'rejected' | 'iterated' | 'error' | 'pending'
  /** Timestamp of this iteration. */
  readonly timestamp: ISOTimestamp
}

// ============================================================================
// Proposal Validation
// ============================================================================

/**
 * Result of validating Claude's response against the StationTemplate schema.
 */
export interface ProposalValidationResult {
  /** Whether the response is valid. */
  readonly valid: boolean
  /** The validated StationTemplate if valid, null otherwise. */
  readonly template: StationTemplate | null
  /** Validation errors, if any. */
  readonly errors: readonly string[]
  /** The raw response from Claude (before validation). */
  readonly rawResponse: string
}

// ============================================================================
// Builder Gate
// ============================================================================

/**
 * Result of the builder gate authorization check.
 */
export interface BuilderGateResult {
  /** Whether Builder Mode can be activated. */
  readonly allowed: boolean
  /** Reason the gate is blocked (if not allowed). */
  readonly reason: string | null
  /** Individual gate conditions and their status. */
  readonly conditions: readonly BuilderGateCondition[]
}

export interface BuilderGateCondition {
  readonly name: string
  readonly met: boolean
  readonly description: string
}

// ============================================================================
// Template Catalog Context
// ============================================================================

/**
 * Summarized template catalog for the Claude prompt.
 * Provides Claude with the vocabulary of what a StationTemplate can contain.
 */
export interface TemplateCatalogContext {
  /** Available body types with descriptions. */
  readonly bodyTypes: readonly BodyTypeDescription[]
  /** Available action patterns with examples. */
  readonly actionPatterns: readonly ActionPatternDescription[]
  /** Available icon identifiers (subset of Lucide). */
  readonly availableIcons: readonly string[]
  /** Existing templates grouped by district (for context). */
  readonly existingTemplates: Record<AppIdentifier, readonly TemplateSummary[]>
  /** Available districts the new template can be assigned to. */
  readonly availableDistricts: readonly DistrictSummary[]
}

export interface BodyTypeDescription {
  readonly type: string
  readonly description: string
  readonly example: string
}

export interface ActionPatternDescription {
  readonly pattern: string
  readonly description: string
  readonly variants: readonly string[]
}

export interface TemplateSummary {
  readonly id: string
  readonly displayName: string
  readonly bodyType: string
  readonly category: 'universal' | 'app-specific'
}

export interface DistrictSummary {
  readonly id: AppIdentifier
  readonly displayName: string
  readonly health: string
  readonly existingStationCount: number
}
