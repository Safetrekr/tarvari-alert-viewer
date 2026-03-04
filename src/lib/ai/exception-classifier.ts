/**
 * Exception Classifier -- orchestrates failure classification.
 *
 * Pipeline:
 * 1. Try rule engine (instant, handles well-known patterns)
 * 2. If rule engine confidence >= 0.70: accept and return
 * 3. If rule engine confidence < 0.70: route to Ollama via AIRouter
 * 4. If Ollama unavailable or fails: fall back to rule engine result
 * 5. Validate Ollama response with Zod schema
 * 6. Return classification with full metadata
 *
 * Per tech-decisions.md routing table:
 *   exception-triage: Ollama primary, rule-engine fallback
 *
 * In practice, the rule engine runs first as a fast pre-filter.
 * Ollama is only called for ambiguous cases where the rule engine's
 * confidence is below threshold. This minimizes Ollama calls while
 * ensuring novel failures get semantic analysis.
 *
 * References: AD-7, tech-decisions.md, WS-3.4 LiveAIRouter
 */

import { z } from 'zod'
import type {
  ExceptionData,
  ClassificationResult,
  ExceptionCategory,
  SuggestedAction,
  AlternativeClassification,
} from '@/lib/interfaces/exception-triage'
import type { AIRouter } from '@/lib/interfaces/ai-router'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import { classifyWithRules } from './exception-rules'
import { assembleTriagePrompt } from './exception-prompt'

// ============================================================================
// Ollama Response Schema
// ============================================================================

const triageResponseSchema = z.object({
  category: z.enum(['transient', 'permanent', 'policy', 'missing-info']),
  confidence: z.number().min(0).max(1).default(0.5),
  reasoning: z.string().default(''),
  user_summary: z.string().default(''),
  suggested_actions: z
    .array(
      z.object({
        label: z.string(),
        description: z.string().default(''),
        action_type: z
          .enum(['retry', 'escalate', 'configure', 'investigate', 'dismiss'])
          .default('investigate'),
      })
    )
    .default([]),
  alternatives: z
    .array(
      z.object({
        category: z.enum(['transient', 'permanent', 'policy', 'missing-info']),
        confidence: z.number().min(0).max(1).default(0.3),
        reason: z.string().default(''),
      })
    )
    .default([]),
})

// ============================================================================
// Confidence threshold
// ============================================================================

/**
 * Minimum rule-engine confidence to accept without consulting Ollama.
 * Below this threshold, the classifier routes to Ollama for deeper analysis.
 */
const RULE_ENGINE_CONFIDENCE_THRESHOLD = 0.7

// ============================================================================
// Classifier
// ============================================================================

/**
 * Classify an exception using the two-layer strategy:
 * rule engine first, Ollama for ambiguous cases.
 *
 * @param exception - The exception data to classify.
 * @param aiRouter - The AI router for Ollama requests. May be null (rule-engine only).
 * @param snapshot - Current system snapshot for contextual classification.
 * @returns A ClassificationResult with full metadata.
 */
export async function classifyException(
  exception: ExceptionData,
  aiRouter: AIRouter | null,
  snapshot: SystemSnapshot | null
): Promise<ClassificationResult> {
  const startTime = performance.now()

  // ---- Step 1: Rule engine classification ----
  const ruleResult = classifyWithRules(exception)

  // ---- Step 2: Accept if confidence is sufficient ----
  if (ruleResult.confidence >= RULE_ENGINE_CONFIDENCE_THRESHOLD) {
    return {
      ...ruleResult,
      latencyMs: Math.round(performance.now() - startTime),
    }
  }

  // ---- Step 3: Route to Ollama for deeper analysis ----
  if (!aiRouter || !aiRouter.isAvailable('exception-triage')) {
    // Ollama unavailable -- return the rule engine result as-is.
    return {
      ...ruleResult,
      latencyMs: Math.round(performance.now() - startTime),
    }
  }

  try {
    const prompt = assembleTriagePrompt(exception, snapshot)

    const aiResponse = await aiRouter.route({
      feature: 'exception-triage',
      input: {
        systemPrompt: prompt.systemMessage,
        userMessage: prompt.userMessage,
      },
      context: snapshot ?? undefined,
      timeout: 8_000,
    })

    if (!aiResponse.success) {
      // Ollama failed -- fall back to rule engine result.
      return {
        ...ruleResult,
        latencyMs: Math.round(performance.now() - startTime),
      }
    }

    // ---- Step 4: Parse and validate Ollama response ----
    const content = (aiResponse.result?.content as string) ?? ''
    let raw: unknown
    try {
      raw = JSON.parse(content)
    } catch {
      // Parse failure -- fall back to rule engine.
      return {
        ...ruleResult,
        latencyMs: Math.round(performance.now() - startTime),
      }
    }

    const parsed = triageResponseSchema.safeParse(raw)
    if (!parsed.success) {
      // Schema validation failure -- fall back to rule engine.
      return {
        ...ruleResult,
        latencyMs: Math.round(performance.now() - startTime),
      }
    }

    const data = parsed.data
    const latencyMs = Math.round(performance.now() - startTime)

    // ---- Step 5: Build ClassificationResult from Ollama response ----
    const suggestedActions: SuggestedAction[] = data.suggested_actions.map((action, index) => ({
      id: `ai-action-${index}`,
      label: action.label,
      description: action.description,
      actionType: action.action_type,
      command: null,
    }))

    const alternatives: AlternativeClassification[] = data.alternatives.map((alt) => ({
      category: alt.category as ExceptionCategory,
      confidence: alt.confidence,
      reason: alt.reason,
    }))

    return {
      category: data.category as ExceptionCategory,
      confidence: data.confidence,
      reasoning: data.reasoning,
      provider: 'ollama',
      alternatives,
      latencyMs,
      modelId: aiResponse.modelId ?? null,
      suggestedActions:
        suggestedActions.length > 0 ? suggestedActions : ruleResult.suggestedActions,
      userSummary: data.user_summary || ruleResult.userSummary,
    }
  } catch {
    // Any unexpected error -- fall back to rule engine.
    return {
      ...ruleResult,
      latencyMs: Math.round(performance.now() - startTime),
    }
  }
}
