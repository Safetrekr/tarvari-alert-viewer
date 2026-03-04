/**
 * Claude graceful degradation logic.
 *
 * Determines the degradation behavior when Claude is unavailable
 * for each feature in the AI routing table.
 *
 * Three degradation modes:
 * 1. FALLBACK_AVAILABLE -- Another provider can handle the feature
 *    (e.g., narrated-telemetry-deep falls back to Ollama).
 * 2. FEATURE_DISABLED -- No fallback exists; feature shows a
 *    "configure API key" message (e.g., builder-mode).
 * 3. NOT_AFFECTED -- Feature does not use Claude at all
 *    (e.g., camera-director-structured uses pattern-matcher).
 *
 * References: tech-decisions.md (Cost Control -- "No API key = Launch
 * works entirely on Ollama + rule engines"), AD-7 (graceful degradation)
 *
 * @module claude-degradation
 * @see WS-4.1
 */

import type { AIFeature, AIProvider } from '@/lib/interfaces/ai-router'
import { AI_ROUTING_TABLE } from '@/lib/interfaces/ai-router'

// ============================================================================
// Degradation Result Types
// ============================================================================

export type DegradationMode =
  | 'fallback-available'
  | 'feature-disabled'
  | 'not-affected'

export interface DegradationResult {
  /** How the feature degrades without Claude. */
  readonly mode: DegradationMode
  /** The fallback provider, if mode is 'fallback-available'. */
  readonly fallbackProvider: AIProvider | null
  /** User-facing message to display. */
  readonly message: string
  /** Whether the feature is still usable (possibly at reduced quality). */
  readonly usable: boolean
}

// ============================================================================
// Feature-Specific Degradation Messages
// ============================================================================

const DEGRADATION_MESSAGES: Readonly<Record<string, string>> = {
  'narrated-telemetry-deep':
    'Deep-dive narration is using Ollama (local). Quality may be reduced. Configure ANTHROPIC_API_KEY in .env.local for Claude-powered analysis.',
  'builder-mode':
    'Builder Mode requires Claude. Configure ANTHROPIC_API_KEY in .env.local to enable AI-powered station layout proposals.',
  'camera-director-nl':
    'Camera Director is using Ollama (local). Claude fallback is unavailable.',
  'narrated-telemetry-batch':
    'Batch narration is using Ollama (local). Claude fallback is unavailable.',
} as const

// ============================================================================
// Degradation Resolver
// ============================================================================

/**
 * Determine what happens to a specific feature when Claude is unavailable.
 *
 * @param feature - The AI feature to check.
 * @param ollamaAvailable - Whether Ollama is currently available.
 * @returns Degradation result describing the behavior.
 */
export function getClaudeDegradation(
  feature: AIFeature,
  ollamaAvailable: boolean,
): DegradationResult {
  const rule = AI_ROUTING_TABLE.find((r) => r.feature === feature)

  if (!rule) {
    return {
      mode: 'not-affected',
      fallbackProvider: null,
      message: '',
      usable: false,
    }
  }

  // If Claude is not involved in this feature at all, it is not affected.
  if (rule.primary !== 'claude' && rule.fallback !== 'claude') {
    return {
      mode: 'not-affected',
      fallbackProvider: null,
      message: '',
      usable: true,
    }
  }

  // Claude is the primary provider for this feature.
  if (rule.primary === 'claude') {
    if (rule.fallback === null) {
      // No fallback. Feature is disabled.
      return {
        mode: 'feature-disabled',
        fallbackProvider: null,
        message:
          DEGRADATION_MESSAGES[feature] ?? `${feature} requires Claude API.`,
        usable: false,
      }
    }

    // Fallback exists. Check if the fallback provider is available.
    const fallbackUsable =
      rule.fallback === 'ollama' ? ollamaAvailable : true
    return {
      mode: 'fallback-available',
      fallbackProvider: rule.fallback,
      message:
        DEGRADATION_MESSAGES[feature] ??
        `${feature} using fallback provider.`,
      usable: fallbackUsable,
    }
  }

  // Claude is the fallback for this feature. Primary is something else.
  // The feature still works via the primary; Claude fallback is just unavailable.
  return {
    mode: 'fallback-available',
    fallbackProvider: rule.primary,
    message: DEGRADATION_MESSAGES[feature] ?? '',
    usable: true,
  }
}

/**
 * Get degradation status for ALL features in the routing table.
 * Used by settings panel to show a comprehensive status overview.
 */
export function getAllDegradationStatuses(
  claudeAvailable: boolean,
  ollamaAvailable: boolean,
): ReadonlyArray<{
  feature: AIFeature
  degradation: DegradationResult
}> {
  if (claudeAvailable) {
    // Claude is available. No degradation for any feature.
    return AI_ROUTING_TABLE.map((rule) => ({
      feature: rule.feature,
      degradation: {
        mode: 'not-affected' as const,
        fallbackProvider: null,
        message: '',
        usable: true,
      },
    }))
  }

  return AI_ROUTING_TABLE.map((rule) => ({
    feature: rule.feature,
    degradation: getClaudeDegradation(rule.feature, ollamaAvailable),
  }))
}
