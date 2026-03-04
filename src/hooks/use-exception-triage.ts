/**
 * Exception triage monitoring hook.
 *
 * Monitors the SystemSnapshot for exception conditions:
 * - Health state transitions (OPERATIONAL -> DEGRADED/DOWN)
 * - Alert count increases
 * - New error events
 *
 * When an exception is detected, it triggers classification via the
 * exception classifier and creates an intervention station.
 *
 * Also monitors for resolution conditions:
 * - Health restored (DEGRADED/DOWN -> OPERATIONAL)
 * - Alert count drops to 0
 *
 * Integrates with WS-3.7 attention choreography (tighten/calm signals).
 *
 * References: AD-7, WS-1.5 (telemetry), WS-3.7 (attention choreography)
 */

import { useEffect, useRef, useCallback } from 'react'
import type { SystemSnapshot, AppState } from '@/lib/interfaces/system-state-provider'
import type { AIRouter } from '@/lib/interfaces/ai-router'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { ExceptionData } from '@/lib/interfaces/exception-triage'
import type { AppIdentifier, HealthState } from '@/lib/interfaces/types'
import { classifyException } from '@/lib/ai/exception-classifier'
import { generateIntervention } from '@/lib/ai/intervention-generator'
import { useTriageStore, triageSelectors } from '@/stores/triage.store'

// ============================================================================
// Configuration
// ============================================================================

interface UseExceptionTriageOptions {
  /** Current system snapshot (from TanStack Query or SystemStateProvider). */
  snapshot: SystemSnapshot | null
  /** AI router for Ollama classification requests. */
  aiRouter: AIRouter | null
  /** Receipt store for audit trail. */
  receiptStore: ReceiptStore | null
  /** Station template registry for template verification. */
  templateRegistry: StationTemplateRegistry | null
  /** Whether the triage system is enabled. Default: true. */
  enabled?: boolean
  /** Callback to signal attention choreography mode. */
  onAttentionModeChange?: (mode: 'calm' | 'tighten') => void
}

// ============================================================================
// Exception Detection
// ============================================================================

/** Health states that trigger exception triage. */
const EXCEPTION_HEALTH_STATES: readonly HealthState[] = ['DEGRADED', 'DOWN'] as const

/**
 * Generate a unique key for an exception to prevent duplicate classification.
 * Key is based on district + health state + error code, not just district ID,
 * so a new error on an already-degraded app gets classified separately.
 */
function exceptionKey(
  districtId: AppIdentifier,
  health: HealthState,
  errorCode: string | null
): string {
  return `${districtId}:${health}:${errorCode ?? 'none'}`
}

/**
 * Extract ExceptionData from an AppState.
 */
function buildExceptionData(appState: AppState, previousHealth: HealthState | null): ExceptionData {
  return {
    id: crypto.randomUUID(),
    districtId: appState.id as AppIdentifier,
    displayName: appState.displayName,
    health: appState.health,
    alertCount: appState.alertCount,
    errorMessage: appState.lastEvent ?? null,
    httpStatus: null, // Extracted from error message if available
    errorCode: extractErrorCode(appState.lastEvent),
    pulse: appState.pulse,
    lastEvent: appState.lastEvent,
    downDurationMs: appState.freshnessMs ?? null,
    detectedAt: new Date().toISOString(),
    previousHealth,
  }
}

/**
 * Attempt to extract a known error code from an event string.
 */
function extractErrorCode(event: string | null | undefined): string | null {
  if (!event) return null
  const upper = event.toUpperCase()

  const knownCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'TIMEOUT']
  for (const code of knownCodes) {
    if (upper.includes(code)) return code
  }

  // Try to extract HTTP status code.
  const httpMatch = event.match(/\b([45]\d{2})\b/)
  if (httpMatch) return httpMatch[1]

  return null
}

/**
 * Extract HTTP status from an event string.
 */
function extractHttpStatus(event: string | null | undefined): number | null {
  if (!event) return null
  const match = event.match(/\b([45]\d{2})\b/)
  return match ? parseInt(match[1], 10) : null
}

// ============================================================================
// Hook
// ============================================================================

export function useExceptionTriage({
  snapshot,
  aiRouter,
  receiptStore,
  templateRegistry,
  enabled = true,
  onAttentionModeChange,
}: UseExceptionTriageOptions) {
  const previousHealthRef = useRef<Record<string, HealthState>>({})
  const classifyingRef = useRef<Set<string>>(new Set())

  const addIntervention = useTriageStore((s) => s.addIntervention)
  const resolveIntervention = useTriageStore((s) => s.resolveIntervention)
  const markSeen = useTriageStore((s) => s.markSeen)
  const hasSeen = useTriageStore((s) => s.hasSeen)
  const monitoring = useTriageStore((s) => s.monitoring)
  const config = useTriageStore((s) => s.config)
  const hasActive = useTriageStore((s) => triageSelectors.hasActiveInterventions(s))

  // Signal attention choreography based on active interventions.
  useEffect(() => {
    onAttentionModeChange?.(hasActive ? 'tighten' : 'calm')
  }, [hasActive, onAttentionModeChange])

  // Process a single exception detection.
  const processException = useCallback(
    async (appState: AppState, previousHealth: HealthState | null) => {
      if (!receiptStore || !templateRegistry) return

      const exData = buildExceptionData(appState, previousHealth)
      exData.httpStatus = extractHttpStatus(appState.lastEvent)

      const key = exceptionKey(appState.id as AppIdentifier, appState.health, exData.errorCode)

      // Prevent duplicate classification.
      if (hasSeen(key) || classifyingRef.current.has(key)) return
      classifyingRef.current.add(key)

      try {
        // Classify the exception.
        const classification = await classifyException(
          exData,
          config.enableAIClassification ? aiRouter : null,
          snapshot
        )

        // Generate the intervention.
        const intervention = await generateIntervention(
          exData,
          classification,
          templateRegistry,
          receiptStore
        )

        // Add to store.
        addIntervention(intervention)
        markSeen(key)
      } finally {
        classifyingRef.current.delete(key)
      }
    },
    [aiRouter, receiptStore, templateRegistry, snapshot, config, addIntervention, markSeen, hasSeen]
  )

  // Monitor telemetry for exception conditions.
  useEffect(() => {
    if (!enabled || !monitoring || !snapshot) return

    for (const [appId, appState] of Object.entries(snapshot.apps)) {
      const currentHealth = appState.health
      const previousHealth = previousHealthRef.current[appId] ?? null

      // Detect exception condition.
      if (EXCEPTION_HEALTH_STATES.includes(currentHealth)) {
        const isNewException =
          previousHealth === null ||
          previousHealth === 'OPERATIONAL' ||
          previousHealth === 'OFFLINE' ||
          previousHealth === 'UNKNOWN'

        if (isNewException) {
          processException(appState, previousHealth)
        }
      }

      // Detect resolution condition.
      if (
        currentHealth === 'OPERATIONAL' &&
        previousHealth &&
        EXCEPTION_HEALTH_STATES.includes(previousHealth)
      ) {
        // Auto-resolve any active interventions for this district.
        const districtInterventions = triageSelectors.districtInterventions(
          useTriageStore.getState(),
          appId as AppIdentifier
        )
        for (const intervention of districtInterventions) {
          resolveIntervention(intervention.exception.id, 'resolved')
        }
      }

      // Update previous health tracking.
      previousHealthRef.current[appId] = currentHealth
    }
  }, [snapshot, enabled, monitoring, processException, resolveIntervention])

  // Return triage state for the consuming component.
  return {
    interventions: useTriageStore((s) => triageSelectors.activeInterventions(s)),
    activeCount: useTriageStore((s) => triageSelectors.activeCount(s)),
    hasActiveInterventions: hasActive,
  }
}
