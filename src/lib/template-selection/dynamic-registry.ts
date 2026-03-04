/**
 * DynamicStationTemplateRegistry -- Phase 3 station catalog with scoring.
 *
 * Replaces StaticStationTemplateRegistry from WS-1.7.
 * Inherits all AD-8 static templates and adds conditional templates.
 * The evaluateTriggers() method returns a real weighted score.
 * getTemplatesForDistrict() scores and ranks templates when a
 * SystemSnapshot context is provided.
 *
 * References: AD-7 interface #4, WS-1.7 Section 4.5
 */

import type { AppIdentifier } from '@/lib/interfaces/types'
import type {
  StationTemplate,
  StationTemplateRegistry,
  TriggerCondition,
} from '@/lib/interfaces/station-template-registry'
import { StaticStationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import { evaluateAllConditions } from './trigger-evaluator'
import { scoreAllTemplates } from './template-scorer'
import { CONDITIONAL_TEMPLATES } from './conditional-templates'
import type { SelectionConfig } from './types'
import { DEFAULT_SELECTION_CONFIG } from './types'

// ============================================================================
// DynamicStationTemplateRegistry
// ============================================================================

export class DynamicStationTemplateRegistry implements StationTemplateRegistry {
  private templates: Map<string, StationTemplate> = new Map()
  private config: SelectionConfig

  constructor(config: SelectionConfig = DEFAULT_SELECTION_CONFIG) {
    this.config = config

    // Inherit all static AD-8 templates from Phase 1.
    const staticRegistry = new StaticStationTemplateRegistry()
    for (const template of staticRegistry.getAllTemplates()) {
      this.templates.set(template.id, template)
    }

    // Register Phase 3 conditional templates.
    for (const template of CONDITIONAL_TEMPLATES) {
      this.templates.set(template.id, template)
    }
  }

  /**
   * Get templates for a district, optionally scored against a SystemSnapshot.
   *
   * - Without context: returns all templates for the district sorted by priority
   *   (identical to Phase 1 behavior).
   * - With context: scores all templates against the snapshot, returns them
   *   sorted by finalScore descending. This is the Phase 3 dynamic behavior.
   */
  getTemplatesForDistrict(
    districtId: AppIdentifier,
    context?: SystemSnapshot
  ): readonly StationTemplate[] {
    const applicable: StationTemplate[] = []

    for (const template of this.templates.values()) {
      if (template.districtId === '*' || template.districtId === districtId) {
        applicable.push(template)
      }
    }

    if (!context) {
      // No context -- Phase 1 fallback: sort by category then priority.
      return applicable.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category === 'universal' ? -1 : 1
        }
        return b.priority - a.priority
      })
    }

    // Phase 3: score and rank.
    const scored = scoreAllTemplates(applicable, context, this.config)
    return scored.map((s) => s.template)
  }

  getTemplate(templateId: string): StationTemplate | null {
    return this.templates.get(templateId) ?? null
  }

  getAllTemplates(): readonly StationTemplate[] {
    return Array.from(this.templates.values())
  }

  registerTemplate(template: StationTemplate): void {
    this.templates.set(template.id, template)
  }

  removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId)
  }

  /**
   * Evaluate trigger conditions against a SystemSnapshot and return a score.
   *
   * Score = sum(matched_weights) / sum(all_weights).
   * Returns 0.0 if conditions array is empty.
   * Returns 1.0 if all conditions match with full weight.
   */
  evaluateTriggers(conditions: readonly TriggerCondition[], context: SystemSnapshot): number {
    if (conditions.length === 0) return 0

    const results = evaluateAllConditions(conditions, context)
    const totalWeight = conditions.reduce((sum, c) => sum + c.weight, 0)
    const matchedWeight = results.reduce((sum, r) => sum + r.weightContribution, 0)

    return totalWeight > 0 ? matchedWeight / totalWeight : 0
  }
}
