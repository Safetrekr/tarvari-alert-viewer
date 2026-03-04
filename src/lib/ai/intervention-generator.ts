/**
 * Intervention Station Generator.
 *
 * Takes a ClassificationResult and the original ExceptionData, selects the
 * appropriate recovery template from the StationTemplateRegistry, and produces
 * a fully configured InterventionState ready for rendering.
 *
 * Also handles receipt generation for the triage classification decision.
 *
 * References: AD-6 (Receipt System -- AI receipts), AD-7, WS-3.5
 */

import type {
  ExceptionData,
  ClassificationResult,
  InterventionState,
  RetryState,
} from '@/lib/interfaces/exception-triage'
import { DEFAULT_TRIAGE_CONFIG } from '@/lib/interfaces/exception-triage'
import type { ReceiptStore, AIReceiptMetadata } from '@/lib/interfaces/receipt-store'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import { CATEGORY_TO_TEMPLATE_ID } from './recovery-templates'

// ============================================================================
// Generator
// ============================================================================

/**
 * Generate an intervention state from a classification result.
 *
 * @param exception - The original exception data.
 * @param classification - The classification result from the classifier.
 * @param registry - The template registry (to verify template exists).
 * @param receiptStore - For recording the triage receipt.
 * @returns A fully configured InterventionState.
 */
export async function generateIntervention(
  exception: ExceptionData,
  classification: ClassificationResult,
  registry: StationTemplateRegistry,
  receiptStore: ReceiptStore
): Promise<InterventionState> {
  const correlationId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Verify that the recovery template exists in the registry.
  const templateId = CATEGORY_TO_TEMPLATE_ID[classification.category]
  const template = templateId ? registry.getTemplate(templateId) : null

  if (!template) {
    console.warn(
      `[InterventionGenerator] Recovery template not found for category "${classification.category}". Template ID: "${templateId}". Proceeding without template verification.`
    )
  }

  // Build retry state for transient failures.
  const retry: RetryState | null =
    classification.category === 'transient'
      ? {
          attemptCount: 0,
          maxAttempts: DEFAULT_TRIAGE_CONFIG.maxTransientRetries,
          nextRetryInSeconds: DEFAULT_TRIAGE_CONFIG.transientRetryIntervalSeconds,
          autoRetryEnabled: true,
        }
      : null

  // Generate receipt for the triage decision.
  const aiMetadata: AIReceiptMetadata = {
    prompt: `Classify exception in ${exception.displayName}: ${exception.errorMessage ?? exception.errorCode ?? 'unknown error'}`,
    reasoning: classification.reasoning,
    confidence: classification.confidence,
    alternativesConsidered: classification.alternatives.map(
      (alt) => `${alt.category} (${(alt.confidence * 100).toFixed(0)}%): ${alt.reason}`
    ),
    provider: classification.provider,
    latencyMs: classification.latencyMs,
    modelId: classification.modelId,
  }

  await receiptStore.record({
    source: exception.districtId,
    eventType: 'action',
    severity: classification.category === 'permanent' ? 'error' : 'warning',
    summary: `Exception triage: ${exception.displayName} classified as ${classification.category}`,
    detail: {
      exceptionId: exception.id,
      districtId: exception.districtId,
      category: classification.category,
      confidence: classification.confidence,
      errorCode: exception.errorCode,
      httpStatus: exception.httpStatus,
      errorMessage: exception.errorMessage,
      templateId,
    },
    location: {
      semanticLevel: 'Z2',
      district: exception.districtId,
      station: templateId ?? null,
    },
    actor: 'ai',
    aiMetadata,
  })

  return {
    exception,
    classification,
    status: 'active',
    retry,
    createdAt: now,
    resolvedAt: null,
    receiptCorrelationId: correlationId,
  }
}
