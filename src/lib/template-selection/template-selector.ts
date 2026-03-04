/**
 * TemplateSelector -- Top-N selection with tie detection and AI fallback.
 *
 * Pipeline:
 * 1. Score all templates for the district (TemplateScorer)
 * 2. Apply pinned overrides (always included regardless of score)
 * 3. Ensure minimum universal templates are present
 * 4. Detect ties among candidates at the selection boundary
 * 5. If ties detected and AI enabled, route to AIRouter for resolution
 * 6. If AI unavailable or disabled, break ties by priority
 * 7. Select top N templates
 * 8. Produce SelectionResult with full audit metadata
 *
 * References: AD-7 (station-template-selection: primary=rule-engine, fallback=ollama),
 * tech-decisions.md routing table
 */

import type { AppIdentifier } from '@/lib/interfaces/types'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { AIRouter } from '@/lib/interfaces/ai-router'
import type { ScoredTemplate, SelectionConfig, SelectionResult, PinnedOverride } from './types'
import { DEFAULT_SELECTION_CONFIG } from './types'
import { scoreAllTemplates } from './template-scorer'

// ============================================================================
// Selection
// ============================================================================

/**
 * Select the top N templates for a district.
 *
 * @param districtId - The district to select templates for.
 * @param registry - The station template registry.
 * @param snapshot - The current system state.
 * @param aiRouter - The AI router (for tie-breaking). May be null.
 * @param pinnedOverrides - User-pinned template overrides.
 * @param config - Selection configuration.
 * @returns A SelectionResult with the selected templates and audit metadata.
 */
export async function selectTemplates(
  districtId: AppIdentifier,
  registry: StationTemplateRegistry,
  snapshot: SystemSnapshot,
  aiRouter: AIRouter | null,
  pinnedOverrides: readonly PinnedOverride[],
  config: SelectionConfig = DEFAULT_SELECTION_CONFIG
): Promise<SelectionResult> {
  const correlationId = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  // Step 1: Get all templates for this district from the registry.
  const allTemplates = registry.getTemplatesForDistrict(districtId, snapshot)

  // Step 2: Score all templates.
  const scoredTemplates = scoreAllTemplates(allTemplates, snapshot, config)

  // Step 3: Identify pinned templates for this district.
  const districtPins = pinnedOverrides.filter((p) => p.districtId === districtId)
  const pinnedIds = new Set(districtPins.map((p) => p.templateId))

  // Step 4: Separate pinned (always included) from candidates.
  const pinned = scoredTemplates.filter((s) => pinnedIds.has(s.template.id))
  const unpinned = scoredTemplates.filter((s) => !pinnedIds.has(s.template.id))

  // Step 5: Ensure minimum universal templates are in the unpinned set.
  const universalFromUnpinned = unpinned.filter((s) => s.template.category === 'universal')
  const appSpecificFromUnpinned = unpinned.filter((s) => s.template.category === 'app-specific')

  // Step 6: Determine how many slots are available after pins and universals.
  const slotsForPinned = pinned.length
  const slotsForUniversal = Math.min(config.minTemplatesPerDistrict, universalFromUnpinned.length)
  const remainingSlots = Math.max(
    0,
    config.maxTemplatesPerDistrict - slotsForPinned - slotsForUniversal
  )

  // Step 7: Check for ties among app-specific candidates at the boundary.
  let selectedAppSpecific: ScoredTemplate[]
  let aiTieBreakerUsed = false
  let aiProvider: string | null = null
  let aiLatencyMs: number | null = null

  if (remainingSlots > 0 && appSpecificFromUnpinned.length > remainingSlots) {
    // There are more candidates than slots -- check for ties at the boundary.
    const boundary = appSpecificFromUnpinned[remainingSlots - 1]
    const nextOut = appSpecificFromUnpinned[remainingSlots]

    if (nextOut && Math.abs(boundary.finalScore - nextOut.finalScore) <= config.tieThreshold) {
      // Tie detected at the selection boundary.
      const tiedGroup = appSpecificFromUnpinned.filter(
        (s) => Math.abs(s.finalScore - boundary.finalScore) <= config.tieThreshold
      )

      if (
        config.enableAITieBreaker &&
        aiRouter &&
        aiRouter.isAvailable('station-template-selection')
      ) {
        // Route to AI for tie resolution.
        const aiResult = await resolveWithAI(
          districtId,
          tiedGroup,
          snapshot,
          aiRouter,
          config.aiTieBreakerTimeoutMs
        )

        if (aiResult.success) {
          aiTieBreakerUsed = true
          aiProvider = aiResult.provider
          aiLatencyMs = aiResult.latencyMs
          selectedAppSpecific = aiResult.resolved.slice(0, remainingSlots)
        } else {
          // AI failed or timed out -- fall back to priority ordering.
          selectedAppSpecific = appSpecificFromUnpinned.slice(0, remainingSlots)
        }
      } else {
        // AI disabled or unavailable -- use priority ordering.
        selectedAppSpecific = appSpecificFromUnpinned.slice(0, remainingSlots)
      }
    } else {
      // No tie at boundary -- straightforward selection.
      selectedAppSpecific = appSpecificFromUnpinned.slice(0, remainingSlots)
    }
  } else {
    // All app-specific templates fit within the available slots.
    selectedAppSpecific = appSpecificFromUnpinned.slice(0, remainingSlots)
  }

  // Step 8: Assemble the final selected set.
  const selected: ScoredTemplate[] = [
    ...pinned,
    ...universalFromUnpinned.slice(0, slotsForUniversal),
    ...selectedAppSpecific,
  ]

  // Step 9: Determine alternatives (scored but not selected).
  const selectedIds = new Set(selected.map((s) => s.template.id))
  const alternatives = scoredTemplates.filter((s) => !selectedIds.has(s.template.id))

  return {
    districtId,
    selected,
    alternatives,
    aiTieBreakerUsed,
    aiProvider,
    aiLatencyMs,
    timestamp,
    snapshotTimestamp: snapshot.timestamp,
    correlationId,
  }
}

// ============================================================================
// AI Tie-Breaking
// ============================================================================

interface AITieBreakResult {
  readonly success: boolean
  readonly resolved: ScoredTemplate[]
  readonly provider: string
  readonly latencyMs: number
}

/**
 * Route a tie-breaking request to the AI provider.
 *
 * The AI receives:
 * - The district context (which app)
 * - The tied templates (names, descriptions, scores)
 * - The current system state summary (health, alerts, active work)
 *
 * The AI returns a ranked ordering of the tied templates.
 * If the AI response is malformed, we fall back to priority ordering.
 */
async function resolveWithAI(
  districtId: AppIdentifier,
  tiedTemplates: ScoredTemplate[],
  snapshot: SystemSnapshot,
  aiRouter: AIRouter,
  timeoutMs: number
): Promise<AITieBreakResult> {
  const appState = snapshot.apps[districtId]

  const input = {
    districtId,
    tiedTemplates: tiedTemplates.map((s) => ({
      id: s.template.id,
      name: s.template.displayName,
      description: s.template.description,
      category: s.template.category,
      finalScore: s.finalScore,
      triggerScore: s.triggerScore,
    })),
    systemContext: {
      health: appState?.health ?? 'UNKNOWN',
      alertCount: appState?.alertCount ?? 0,
      pulse: appState?.pulse ?? 'unknown',
      globalAlerts: snapshot.globalMetrics.alertCount,
      globalPulse: snapshot.globalMetrics.systemPulse,
    },
  }

  try {
    const response = await aiRouter.route({
      feature: 'station-template-selection',
      input,
      context: snapshot,
      timeout: timeoutMs,
    })

    if (!response.success) {
      return {
        success: false,
        resolved: tiedTemplates,
        provider: response.provider,
        latencyMs: response.latencyMs,
      }
    }

    // Parse AI response: expect { rankedTemplateIds: string[] }
    const rankedIds = response.result.rankedTemplateIds as string[] | undefined
    if (!Array.isArray(rankedIds) || rankedIds.length === 0) {
      // Malformed response -- fall back to input order.
      return {
        success: false,
        resolved: tiedTemplates,
        provider: response.provider,
        latencyMs: response.latencyMs,
      }
    }

    // Reorder tied templates according to AI ranking.
    const idToScored = new Map(tiedTemplates.map((s) => [s.template.id, s]))
    const resolved: ScoredTemplate[] = []

    for (const id of rankedIds) {
      const scored = idToScored.get(id)
      if (scored) {
        resolved.push(scored)
        idToScored.delete(id)
      }
    }

    // Append any templates the AI missed (safety: never drop a template).
    for (const remaining of idToScored.values()) {
      resolved.push(remaining)
    }

    return {
      success: true,
      resolved,
      provider: response.provider,
      latencyMs: response.latencyMs,
    }
  } catch {
    // Timeout or network failure -- fall back gracefully.
    return {
      success: false,
      resolved: tiedTemplates,
      provider: 'rule-engine',
      latencyMs: 0,
    }
  }
}
