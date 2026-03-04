/**
 * Camera Director -- Orchestrator for the three-layer AI Camera Director.
 *
 * Routes queries through three layers in order:
 * 1. Pattern Matcher (instant, <1ms) -- handles 60%+ of queries
 * 2. Ollama LLM (3-10s) -- handles ambiguous natural language
 * 3. Validation -- validates response with Zod schema
 *
 * Includes disambiguation logic when confidence spread < 0.2 between
 * top results. Falls back to pattern matcher when Ollama times out
 * or errors.
 *
 * The system MUST work when Ollama is unavailable -- the pattern matcher
 * provides baseline functionality.
 *
 * References:
 * - AD-7 (three-layer intelligence model)
 * - tech-decisions.md (Feature-by-Feature AI Routing)
 *
 * @module camera-director
 * @see WS-3.4 Section 4.8
 */

import type { CameraDirective } from '@/lib/interfaces/camera-controller'
import type { AppIdentifier } from '@/lib/interfaces/types'
import {
  PatternMatcherProvider,
  type PatternMatchResult,
  type PatternMatchContext,
  type DriftGuess,
} from './pattern-matcher-provider'
import {
  queryOllamaForDirective,
  type OllamaCameraResult,
} from './ollama-provider'
import type { SpatialIndexSnapshot } from './spatial-index'

// ============================================================================
// Director Result
// ============================================================================

/** Complete result from the Camera Director orchestrator. */
export interface CameraDirectorResult {
  /** Whether a directive was successfully produced. */
  readonly success: boolean
  /** The camera directive to execute. */
  readonly directive: CameraDirective | null
  /** Confidence score 0.0-1.0. */
  readonly confidence: number
  /** Which provider resolved the query. */
  readonly provider: 'pattern-matcher' | 'ollama'
  /** AI reasoning for the decision. */
  readonly reasoning: string
  /** End-to-end latency in ms. */
  readonly latencyMs: number
  /** Model ID used (null for pattern-matcher). */
  readonly modelId: string | null
  /** Whether disambiguation is needed (multiple close candidates). */
  readonly needsDisambiguation: boolean
  /** Disambiguation candidates, if applicable. */
  readonly disambiguationCandidates: readonly DisambiguationOption[]
  /** Error message if failed. */
  readonly error?: string
}

/** A candidate for disambiguation display. */
export interface DisambiguationOption {
  readonly districtId: AppIdentifier
  readonly displayName: string
  readonly confidence: number
  readonly reason: string
}

// ============================================================================
// Configuration
// ============================================================================

/** Minimum confidence threshold for pattern matcher to bypass Ollama. */
const PATTERN_MATCH_CONFIDENCE_THRESHOLD = 0.7

/** Confidence spread below which disambiguation is triggered. */
const DISAMBIGUATION_SPREAD_THRESHOLD = 0.2

// ============================================================================
// Camera Director
// ============================================================================

export class CameraDirector {
  private readonly patternMatcher: PatternMatcherProvider

  constructor() {
    this.patternMatcher = new PatternMatcherProvider()
  }

  /**
   * Process a natural language query through the three-layer pipeline.
   *
   * Layer 1: Pattern Matcher (instant)
   * - If confidence >= 0.7, return immediately without LLM
   *
   * Layer 2: Ollama LLM (3-10s)
   * - If pattern matcher fails or has low confidence
   * - Sends spatial context + query to Ollama via /api/ai/chat
   *
   * Layer 3: Validation
   * - Validates Ollama response with Zod schema
   * - Falls back to pattern matcher if validation fails
   *
   * @param query - User's natural language query.
   * @param spatialSnapshot - Current spatial context.
   * @param context - Alert/health context for pattern matcher.
   * @param ollamaEnabled - Whether Ollama calls are allowed (AI beta on + Ollama ready).
   * @param model - Ollama model ID. Default: 'llama3.1:8b'.
   */
  async interpret(
    query: string,
    spatialSnapshot: SpatialIndexSnapshot,
    context: PatternMatchContext | null = null,
    ollamaEnabled: boolean = false,
    model: string = 'llama3.1:8b',
  ): Promise<CameraDirectorResult> {
    const startTime = performance.now()

    // -----------------------------------------------------------------------
    // Layer 1: Pattern Matcher (instant, <1ms)
    // -----------------------------------------------------------------------
    const patternResult = this.patternMatcher.match(query, context)

    if (patternResult.matched && patternResult.confidence >= PATTERN_MATCH_CONFIDENCE_THRESHOLD) {
      const latencyMs = Math.round(performance.now() - startTime)
      return {
        success: true,
        directive: patternResult.directive,
        confidence: patternResult.confidence,
        provider: 'pattern-matcher',
        reasoning: patternResult.reasoning,
        latencyMs,
        modelId: null,
        needsDisambiguation: false,
        disambiguationCandidates: [],
      }
    }

    // -----------------------------------------------------------------------
    // Layer 2: Ollama LLM (3-10s, if enabled)
    // -----------------------------------------------------------------------
    if (ollamaEnabled) {
      const ollamaResult = await this.queryOllama(query, spatialSnapshot, model)

      if (ollamaResult.success && ollamaResult.validation?.success) {
        const latencyMs = Math.round(performance.now() - startTime)
        const validation = ollamaResult.validation

        // Check for disambiguation
        const disambiguationCheck = this.checkDisambiguation(validation.alternatives)

        return {
          success: true,
          directive: validation.directive,
          confidence: validation.confidence,
          provider: 'ollama',
          reasoning: validation.reasoning,
          latencyMs,
          modelId: model,
          needsDisambiguation: disambiguationCheck.needed,
          disambiguationCandidates: disambiguationCheck.candidates,
        }
      }

      // Ollama failed -- fall through to pattern matcher fallback
      // Log the error but do not surface it to the user
      if (ollamaResult.error) {
        // eslint-disable-next-line no-console
        console.warn('[CameraDirector] Ollama failed, falling back to pattern matcher:', ollamaResult.error)
      }
    }

    // -----------------------------------------------------------------------
    // Fallback: Return pattern matcher result (even if low confidence)
    // -----------------------------------------------------------------------
    const latencyMs = Math.round(performance.now() - startTime)

    if (patternResult.matched && patternResult.directive) {
      return {
        success: true,
        directive: patternResult.directive,
        confidence: patternResult.confidence,
        provider: 'pattern-matcher',
        reasoning: patternResult.reasoning + (ollamaEnabled ? ' (Ollama fallback)' : ''),
        latencyMs,
        modelId: null,
        needsDisambiguation: false,
        disambiguationCandidates: [],
      }
    }

    // Complete failure -- no match from any layer
    return {
      success: false,
      directive: null,
      confidence: 0,
      provider: 'pattern-matcher',
      reasoning: `Could not interpret "${query}". ${
        ollamaEnabled
          ? 'Ollama was unable to resolve this query.'
          : 'AI features are disabled. Try structured commands like "go core" or "show alerts".'
      }`,
      latencyMs,
      modelId: null,
      needsDisambiguation: false,
      disambiguationCandidates: [],
      error: `No interpretation available for "${query}"`,
    }
  }

  /**
   * Get a speculative drift target for a query.
   * Used during Ollama inference for immediate camera response.
   *
   * @param query - User query string.
   * @param context - Alert/health context.
   * @returns Drift guess with district and confidence.
   */
  guessDriftTarget(query: string, context: PatternMatchContext | null = null): DriftGuess {
    return this.patternMatcher.guessDriftTarget(query, context)
  }

  /**
   * Match a query using only the pattern matcher (no LLM).
   * Used when AI beta is disabled or for instant results.
   */
  patternMatch(query: string, context: PatternMatchContext | null = null): PatternMatchResult {
    return this.patternMatcher.match(query, context)
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /**
   * Query Ollama with timeout and error handling.
   */
  private async queryOllama(
    query: string,
    spatialSnapshot: SpatialIndexSnapshot,
    model: string,
  ): Promise<OllamaCameraResult> {
    try {
      return await queryOllamaForDirective(query, spatialSnapshot, model)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        validation: null,
        provider: 'ollama',
        modelId: model,
        latencyMs: 0,
        error: `Ollama query failed: ${message}`,
      }
    }
  }

  /**
   * Check if disambiguation is needed based on alternatives.
   * Disambiguation is triggered when confidence spread between top
   * alternatives is less than DISAMBIGUATION_SPREAD_THRESHOLD.
   */
  private checkDisambiguation(
    alternatives: readonly { target: string; confidence: number; reason: string }[],
  ): { needed: boolean; candidates: DisambiguationOption[] } {
    if (!alternatives || alternatives.length === 0) {
      return { needed: false, candidates: [] }
    }

    // Sort alternatives by confidence descending
    const sorted = [...alternatives].sort((a, b) => b.confidence - a.confidence)

    // Check if top alternatives are too close in confidence
    if (sorted.length >= 2) {
      const spread = sorted[0].confidence - sorted[1].confidence
      if (spread < DISAMBIGUATION_SPREAD_THRESHOLD) {
        const candidates: DisambiguationOption[] = sorted.slice(0, 4).map((alt) => ({
          districtId: alt.target as AppIdentifier,
          displayName: alt.target, // Consumer should resolve display name
          confidence: alt.confidence,
          reason: alt.reason,
        }))

        return { needed: true, candidates }
      }
    }

    return { needed: false, candidates: [] }
  }
}
