/**
 * Triage Store -- manages exception triage state.
 *
 * Tracks:
 * - Active interventions (keyed by exception ID)
 * - Resolution history (last N resolved interventions)
 * - Whether tighten mode should be active (for WS-3.7 attention choreography)
 *
 * References: AD-7, tech-decisions.md (Zustand store pattern),
 * WS-3.7 (attention choreography signals)
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  InterventionState,
  InterventionStatus,
  TriageConfig,
} from '@/lib/interfaces/exception-triage'
import { DEFAULT_TRIAGE_CONFIG } from '@/lib/interfaces/exception-triage'
import type { AppIdentifier } from '@/lib/interfaces/types'

// ============================================================================
// Store Shape
// ============================================================================

export interface TriageState {
  /** Active interventions keyed by exception ID. */
  interventions: Record<string, InterventionState>
  /** Recently resolved interventions (last 20). */
  resolutionHistory: InterventionState[]
  /** Exception IDs that have been seen (to avoid re-classifying). */
  seenExceptionKeys: Set<string>
  /** Triage configuration. */
  config: TriageConfig
  /** Whether the triage system is actively monitoring. */
  monitoring: boolean
}

export interface TriageActions {
  /** Add a new intervention. */
  addIntervention: (intervention: InterventionState) => void
  /** Update an intervention's status. */
  setInterventionStatus: (exceptionId: string, status: InterventionStatus) => void
  /** Update retry state for a transient intervention. */
  updateRetryState: (
    exceptionId: string,
    update: {
      attemptCount?: number
      nextRetryInSeconds?: number
      autoRetryEnabled?: boolean
    }
  ) => void
  /** Resolve an intervention (health restored or user dismissed). */
  resolveIntervention: (exceptionId: string, status: 'resolved' | 'dismissed' | 'escalated') => void
  /** Mark an exception key as seen (prevents duplicate classification). */
  markSeen: (key: string) => void
  /** Check if an exception key has been seen. */
  hasSeen: (key: string) => boolean
  /** Remove all interventions for a district. */
  clearDistrictInterventions: (districtId: AppIdentifier) => void
  /** Toggle monitoring on/off. */
  setMonitoring: (active: boolean) => void
  /** Update configuration. */
  setConfig: (config: Partial<TriageConfig>) => void
  /** Clear all state (reset). */
  reset: () => void
}

export type TriageStore = TriageState & TriageActions

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_STATE: TriageState = {
  interventions: {},
  resolutionHistory: [],
  seenExceptionKeys: new Set(),
  config: DEFAULT_TRIAGE_CONFIG,
  monitoring: true,
}

const MAX_RESOLUTION_HISTORY = 20

// ============================================================================
// Store
// ============================================================================

export const useTriageStore = create<TriageStore>()(
  immer((set, get) => ({
    ...INITIAL_STATE,

    addIntervention: (intervention) =>
      set((state) => {
        state.interventions[intervention.exception.id] =
          intervention as unknown as typeof state.interventions[string]
      }),

    setInterventionStatus: (exceptionId, status) =>
      set((state) => {
        const intervention = state.interventions[exceptionId]
        if (intervention) {
          intervention.status = status
        }
      }),

    updateRetryState: (exceptionId, update) =>
      set((state) => {
        const intervention = state.interventions[exceptionId]
        if (intervention?.retry) {
          if (update.attemptCount !== undefined) {
            intervention.retry.attemptCount = update.attemptCount
          }
          if (update.nextRetryInSeconds !== undefined) {
            intervention.retry.nextRetryInSeconds = update.nextRetryInSeconds
          }
          if (update.autoRetryEnabled !== undefined) {
            intervention.retry.autoRetryEnabled = update.autoRetryEnabled
          }
        }
      }),

    resolveIntervention: (exceptionId, status) =>
      set((state) => {
        const intervention = state.interventions[exceptionId]
        if (intervention) {
          intervention.status = status
          intervention.resolvedAt = new Date().toISOString()

          // Move to resolution history.
          state.resolutionHistory.unshift({ ...intervention })
          if (state.resolutionHistory.length > MAX_RESOLUTION_HISTORY) {
            state.resolutionHistory = state.resolutionHistory.slice(0, MAX_RESOLUTION_HISTORY)
          }

          // Remove from active interventions.
          delete state.interventions[exceptionId]
        }
      }),

    markSeen: (key) =>
      set((state) => {
        state.seenExceptionKeys.add(key)
      }),

    hasSeen: (key) => get().seenExceptionKeys.has(key),

    clearDistrictInterventions: (districtId) =>
      set((state) => {
        for (const [id, intervention] of Object.entries(state.interventions)) {
          if (intervention.exception.districtId === districtId) {
            delete state.interventions[id]
          }
        }
      }),

    setMonitoring: (active) =>
      set((state) => {
        state.monitoring = active
      }),

    setConfig: (config) =>
      set((state) => {
        state.config = { ...state.config, ...config }
      }),

    reset: () =>
      set((state) => {
        state.interventions = {}
        state.resolutionHistory = []
        state.seenExceptionKeys = new Set()
        state.monitoring = true
      }),
  }))
)

// ============================================================================
// Selectors
// ============================================================================

export const triageSelectors = {
  /** Get all active interventions as an array. */
  activeInterventions: (state: TriageState): InterventionState[] =>
    Object.values(state.interventions).filter(
      (i) => i.status === 'active' || i.status === 'retrying'
    ),

  /** Get active interventions for a specific district. */
  districtInterventions: (state: TriageState, districtId: AppIdentifier): InterventionState[] =>
    Object.values(state.interventions).filter(
      (i) =>
        i.exception.districtId === districtId && (i.status === 'active' || i.status === 'retrying')
    ),

  /** Whether any active interventions exist (drives tighten mode). */
  hasActiveInterventions: (state: TriageState): boolean =>
    Object.values(state.interventions).some(
      (i) => i.status === 'active' || i.status === 'retrying'
    ),

  /** Count of active interventions. */
  activeCount: (state: TriageState): number =>
    Object.values(state.interventions).filter(
      (i) => i.status === 'active' || i.status === 'retrying'
    ).length,

  /** Get interventions currently retrying. */
  retryingInterventions: (state: TriageState): InterventionState[] =>
    Object.values(state.interventions).filter((i) => i.status === 'retrying'),
}
