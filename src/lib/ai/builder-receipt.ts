/**
 * Builder Receipt Generator -- audit trail for Builder Mode actions.
 *
 * Generates receipts for:
 * - Session start (builder activated)
 * - Proposal generation (Claude called)
 * - Proposal accepted (template promoted to registry)
 * - Proposal rejected (user declined)
 * - Iteration start (user refining description)
 *
 * Every receipt includes the full AI metadata per AD-6:
 * prompt, reasoning, confidence, alternatives, provider, latency, modelId.
 *
 * References: AD-6 (Receipt System), WS-3.1 (ReceiptStore),
 * WS-3.4 (AI receipt pattern)
 */

import type { ReceiptStore, ReceiptInput, AIReceiptMetadata } from '@/lib/interfaces/receipt-store'
import type { BuilderSession, BuilderProposal } from './builder-types'

// ============================================================================
// Receipt Types
// ============================================================================

type BuilderAction =
  | 'builder-session-start'
  | 'builder-proposal-generated'
  | 'builder-proposal-accepted'
  | 'builder-proposal-rejected'
  | 'builder-iteration-start'
  | 'builder-generation-failed'

// ============================================================================
// Receipt Generation
// ============================================================================

/**
 * Record a receipt for a Builder Mode action.
 */
export async function recordBuilderReceipt(
  receiptStore: ReceiptStore,
  action: BuilderAction,
  session: BuilderSession,
  proposal: BuilderProposal | null,
  additionalDetail?: Record<string, unknown>
): Promise<void> {
  const aiMetadata: AIReceiptMetadata | undefined = proposal
    ? {
        prompt: proposal.prompt,
        reasoning: proposal.reasoning,
        confidence: proposal.confidence,
        alternativesConsidered: proposal.alternatives.map((alt) => alt),
        provider: 'claude',
        latencyMs: proposal.latencyMs,
        modelId: proposal.modelId,
      }
    : undefined

  const input: ReceiptInput = {
    source: 'launch',
    eventType: resolveEventType(action),
    actor:
      action === 'builder-proposal-generated' || action === 'builder-generation-failed'
        ? 'ai'
        : 'human',
    severity: action === 'builder-generation-failed' ? 'warning' : 'info',
    summary: buildSummary(action, session, proposal),
    location: {
      semanticLevel: 'Z1',
      district: session.targetDistrictId,
      station: null,
    },
    target: session.targetDistrictId
      ? {
          type: 'district' as const,
          districtId: session.targetDistrictId,
        }
      : undefined,
    detail: {
      builderAction: action,
      sessionId: session.id,
      description: session.description,
      districtId: session.targetDistrictId,
      iterationNumber: session.iterations.length,
      templateId: proposal?.template.id ?? null,
      templateDisplayName: proposal?.template.displayName ?? null,
      templateBodyType: proposal?.template.layout.bodyType ?? null,
      ...additionalDetail,
    },
    aiMetadata,
  }

  await receiptStore.record(input)
}

// ============================================================================
// Helpers
// ============================================================================

function resolveEventType(action: BuilderAction): 'action' | 'system' | 'error' {
  switch (action) {
    case 'builder-session-start':
    case 'builder-proposal-accepted':
    case 'builder-proposal-rejected':
    case 'builder-iteration-start':
      return 'action'
    case 'builder-proposal-generated':
      return 'system'
    case 'builder-generation-failed':
      return 'error'
  }
}

function buildSummary(
  action: BuilderAction,
  session: BuilderSession,
  proposal: BuilderProposal | null
): string {
  switch (action) {
    case 'builder-session-start':
      return `Builder Mode activated. Target: ${session.targetDistrictId ?? 'not yet selected'}.`
    case 'builder-proposal-generated':
      return `Claude proposed "${proposal?.template.displayName}" (${proposal?.template.layout.bodyType}) with ${((proposal?.confidence ?? 0) * 100).toFixed(0)}% confidence.`
    case 'builder-proposal-accepted':
      return `Accepted station "${proposal?.template.displayName}" for ${session.targetDistrictId}. Template registered.`
    case 'builder-proposal-rejected':
      return `Rejected proposed station "${proposal?.template.displayName}".`
    case 'builder-iteration-start':
      return `Iterating on station description (iteration ${session.iterations.length + 1}).`
    case 'builder-generation-failed':
      return `Builder generation failed for "${session.description.slice(0, 60)}...".`
  }
}

/**
 * Shorthand functions for common builder receipt operations.
 */
export const builderReceipts = {
  sessionStart: (store: ReceiptStore, session: BuilderSession) =>
    recordBuilderReceipt(store, 'builder-session-start', session, null),

  proposalGenerated: (store: ReceiptStore, session: BuilderSession, proposal: BuilderProposal) =>
    recordBuilderReceipt(store, 'builder-proposal-generated', session, proposal),

  proposalAccepted: (store: ReceiptStore, session: BuilderSession, proposal: BuilderProposal) =>
    recordBuilderReceipt(store, 'builder-proposal-accepted', session, proposal),

  proposalRejected: (store: ReceiptStore, session: BuilderSession, proposal: BuilderProposal) =>
    recordBuilderReceipt(store, 'builder-proposal-rejected', session, proposal),

  iterationStart: (store: ReceiptStore, session: BuilderSession) =>
    recordBuilderReceipt(store, 'builder-iteration-start', session, null),

  generationFailed: (store: ReceiptStore, session: BuilderSession, error: string) =>
    recordBuilderReceipt(store, 'builder-generation-failed', session, null, { error }),
} as const
