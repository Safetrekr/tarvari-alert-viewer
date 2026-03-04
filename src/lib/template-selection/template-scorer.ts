/**
 * TemplateScorer -- Weighted activation scoring for station templates.
 *
 * Scoring formula:
 *   triggerScore = sum(matched_weights) / sum(all_weights)  [0.0-1.0]
 *   priorityScore = template.priority / maxPriority          [0.0-1.0]
 *   finalScore = triggerScore * triggerWeight + priorityScore * (1 - triggerWeight)
 *
 * Templates with no triggers (Phase 1 static templates) receive:
 *   triggerScore = 0.0  (no trigger relevance)
 *   finalScore = priorityScore * (1 - triggerWeight)
 *
 * This means static templates are always ranked below triggered templates
 * that have at least one matching condition -- which is the desired behavior.
 * The universal templates (Launch, Status) have high priority (90-100) to
 * ensure they remain visible even without triggers.
 *
 * References: AD-7 (deterministic scoring preferred),
 * WS-1.7 TriggerCondition.weight (0.0-1.0)
 */

import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { ScoredTemplate, SelectionConfig } from './types'
import { DEFAULT_SELECTION_CONFIG } from './types'
import { evaluateAllConditions } from './trigger-evaluator'

// ============================================================================
// Score a Single Template
// ============================================================================

/**
 * Compute the activation score for a single station template.
 *
 * @param template - The template to score.
 * @param snapshot - The current system state.
 * @param config - Scoring configuration (triggerWeight, maxPriority).
 * @returns A ScoredTemplate with trigger details and final score.
 */
export function scoreTemplate(
  template: StationTemplate,
  snapshot: SystemSnapshot,
  config: SelectionConfig = DEFAULT_SELECTION_CONFIG
): ScoredTemplate {
  const hasTriggers = template.triggers.length > 0

  // Evaluate trigger conditions.
  const triggerDetails = hasTriggers ? evaluateAllConditions(template.triggers, snapshot) : []

  // Compute trigger score.
  let triggerScore = 0
  if (hasTriggers) {
    const totalWeight = template.triggers.reduce((sum, t) => sum + t.weight, 0)
    const matchedWeight = triggerDetails.reduce((sum, r) => sum + r.weightContribution, 0)
    triggerScore = totalWeight > 0 ? matchedWeight / totalWeight : 0
  }

  // Compute priority score (normalized 0.0-1.0).
  const priorityScore = Math.min(1.0, Math.max(0.0, template.priority / config.maxPriority))

  // Compute final blended score.
  const finalScore = hasTriggers
    ? triggerScore * config.triggerWeight + priorityScore * (1 - config.triggerWeight)
    : priorityScore * (1 - config.triggerWeight)

  return {
    template,
    triggerScore,
    priorityScore,
    finalScore,
    triggerDetails,
    hasTriggers,
  }
}

// ============================================================================
// Score All Templates for a District
// ============================================================================

/**
 * Score all templates applicable to a district.
 *
 * @param templates - All templates for the district (from registry).
 * @param snapshot - The current system state.
 * @param config - Scoring configuration.
 * @returns All templates scored and sorted by finalScore descending.
 */
export function scoreAllTemplates(
  templates: readonly StationTemplate[],
  snapshot: SystemSnapshot,
  config: SelectionConfig = DEFAULT_SELECTION_CONFIG
): ScoredTemplate[] {
  return templates
    .map((t) => scoreTemplate(t, snapshot, config))
    .sort((a, b) => {
      // Primary sort: finalScore descending.
      if (Math.abs(a.finalScore - b.finalScore) > 0.001) {
        return b.finalScore - a.finalScore
      }
      // Secondary sort: universal templates first.
      if (a.template.category !== b.template.category) {
        return a.template.category === 'universal' ? -1 : 1
      }
      // Tertiary sort: priority descending.
      return b.template.priority - a.template.priority
    })
}
