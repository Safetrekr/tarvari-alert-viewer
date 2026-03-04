/**
 * SelectionReceiptGenerator -- Audit trail for template selection decisions.
 *
 * Every template selection generates a receipt recording:
 * - Which templates were selected and why (scores, trigger breakdowns)
 * - Which alternatives were considered but not selected
 * - Whether AI tie-breaking was used (and if so, provider + latency)
 * - The SystemSnapshot timestamp the decision was based on
 *
 * Per AD-7: "every AI decision generates a Receipt"
 * Per AD-6: "Mutations-only receipts" -- template selection is a mutation
 * (it changes which stations are visible).
 *
 * References: AD-6 (Receipt System), AD-7 (audit trail), WS-3.1 (ReceiptStore)
 */

import type { ReceiptStore, ReceiptInput, AIReceiptMetadata } from '@/lib/interfaces/receipt-store'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { SelectionResult } from './types'

// ============================================================================
// Receipt Generation
// ============================================================================

/**
 * Record a template selection decision as a receipt.
 *
 * @param result - The selection result from TemplateSelector.
 * @param receiptStore - The receipt store to record to.
 * @returns The recorded receipt's ID.
 */
export async function recordSelectionReceipt(
  result: SelectionResult,
  receiptStore: ReceiptStore
): Promise<string> {
  const selectedNames = result.selected.map((s) => s.template.displayName).join(', ')

  const summary = `Station selection for ${result.districtId}: ${selectedNames}`.slice(0, 120)

  const detail: Record<string, unknown> = {
    districtId: result.districtId,
    selectedTemplates: result.selected.map((s) => ({
      id: s.template.id,
      name: s.template.displayName,
      triggerScore: round(s.triggerScore, 3),
      priorityScore: round(s.priorityScore, 3),
      finalScore: round(s.finalScore, 3),
      hasTriggers: s.hasTriggers,
      matchedTriggers: s.triggerDetails.filter((t) => t.matched).map((t) => t.explanation),
    })),
    alternativeTemplates: result.alternatives.map((s) => ({
      id: s.template.id,
      name: s.template.displayName,
      finalScore: round(s.finalScore, 3),
    })),
    aiTieBreakerUsed: result.aiTieBreakerUsed,
    snapshotTimestamp: result.snapshotTimestamp,
  }

  // Build AI metadata if AI tie-breaking was used.
  const aiMetadata: AIReceiptMetadata | null = result.aiTieBreakerUsed
    ? {
        prompt: `Resolve tie for station selection in ${result.districtId}`,
        reasoning: `AI ranked ${result.selected.length} templates based on system state`,
        confidence: 0.7,
        alternativesConsidered: result.alternatives.map((s) => s.template.displayName),
        provider:
          (result.aiProvider as 'ollama' | 'claude' | 'rule-engine' | 'pattern-matcher') ??
          'rule-engine',
        latencyMs: result.aiLatencyMs ?? 0,
        modelId: null,
      }
    : null

  const input: ReceiptInput = {
    correlationId: result.correlationId,
    source: 'launch',
    eventType: 'system',
    severity: 'info',
    summary,
    detail,
    location: {
      semanticLevel: 'Z2',
      district: result.districtId,
      station: null,
    },
    actor: result.aiTieBreakerUsed ? 'ai' : 'system',
    aiMetadata,
  }

  const receipt = await receiptStore.record(input)
  return receipt.id
}

/**
 * Record a manual pin/unpin action as a receipt.
 *
 * @param districtId - The district the pin applies to.
 * @param templateId - The template being pinned/unpinned.
 * @param templateName - Human-readable template name.
 * @param action - Whether pinning or unpinning.
 * @param receiptStore - The receipt store to record to.
 * @returns The recorded receipt's ID.
 */
export async function recordPinReceipt(
  districtId: AppIdentifier,
  templateId: string,
  templateName: string,
  action: 'pin' | 'unpin',
  receiptStore: ReceiptStore
): Promise<string> {
  const summary =
    action === 'pin'
      ? `Pinned "${templateName}" in ${districtId}`
      : `Unpinned "${templateName}" in ${districtId}`

  const input: ReceiptInput = {
    source: 'launch',
    eventType: 'action',
    severity: 'info',
    summary: summary.slice(0, 120),
    detail: { districtId, templateId, templateName, action },
    location: {
      semanticLevel: 'Z2',
      district: districtId,
      station: null,
    },
    actor: 'human',
  }

  const receipt = await receiptStore.record(input)
  return receipt.id
}

// ============================================================================
// Helpers
// ============================================================================

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
