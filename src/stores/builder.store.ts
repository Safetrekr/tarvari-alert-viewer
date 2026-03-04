/**
 * Builder Mode session state store.
 *
 * Manages: builder session lifecycle, description text, proposed templates,
 * iteration history, target district selection, builder phase transitions.
 *
 * The store follows the Phase 4 "session-only" scope -- nothing is
 * persisted to Supabase. Builder-created templates live only in the
 * DynamicStationTemplateRegistry for the current page session.
 *
 * References: AD-7 (ai-builder-mode), WS-3.5 (template registration),
 * WS-3.4 (ai.store pattern)
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type {
  BuilderSession,
  BuilderPhase,
  BuilderProposal,
  BuilderIteration,
} from '@/lib/ai/builder-types'

// ============================================================================
// Store Shape
// ============================================================================

export interface BuilderState {
  /** Whether the builder panel is visible. */
  panelOpen: boolean
  /** The active builder session. Null when no session is active. */
  session: BuilderSession | null
  /** IDs of all templates created by the builder in this page session. */
  createdTemplateIds: string[]
}

export interface BuilderActions {
  /** Open the builder panel and start a new session. */
  openBuilder: () => void
  /** Close the builder panel. Preserves session for potential resume. */
  closeBuilder: () => void
  /** Set the user's natural language description. */
  setDescription: (description: string) => void
  /** Set the target district for the proposed station. */
  setTargetDistrict: (districtId: AppIdentifier) => void
  /** Transition to the 'generating' phase (Claude is processing). */
  startGenerating: () => void
  /** Set the proposal result from Claude. Transitions to 'reviewing'. */
  setProposal: (proposal: BuilderProposal) => void
  /** Set an error from the generation attempt. Transitions to 'error'. */
  setError: (error: string) => void
  /** Accept the current proposal. Transitions to 'accepted'. */
  acceptProposal: () => void
  /** Reject the current proposal. Transitions to 'rejected'. */
  rejectProposal: () => void
  /** Start a new iteration (user wants to refine the description). */
  startIteration: () => void
  /** Reset the builder to idle state for a new session. */
  resetBuilder: () => void
  /** Track a template ID created by the builder. */
  trackCreatedTemplate: (templateId: string) => void
}

export type BuilderStore = BuilderState & BuilderActions

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_STATE: BuilderState = {
  panelOpen: false,
  session: null,
  createdTemplateIds: [],
}

// ============================================================================
// Store
// ============================================================================

export const useBuilderStore = create<BuilderStore>()(
  immer((set) => ({
    ...INITIAL_STATE,

    openBuilder: () =>
      set((state) => {
        state.panelOpen = true
        if (
          !state.session ||
          state.session.phase === 'accepted' ||
          state.session.phase === 'rejected'
        ) {
          state.session = {
            id: crypto.randomUUID(),
            startedAt: new Date().toISOString(),
            description: '',
            targetDistrictId: null,
            currentProposal: null,
            iterations: [],
            phase: 'idle',
          }
        }
      }),

    closeBuilder: () =>
      set((state) => {
        state.panelOpen = false
      }),

    setDescription: (description) =>
      set((state) => {
        if (state.session) {
          state.session.description = description
          if (description.trim().length > 0 && state.session.phase === 'idle') {
            state.session.phase = 'describing'
          }
          if (description.trim().length === 0 && state.session.phase === 'describing') {
            state.session.phase = 'idle'
          }
        }
      }),

    setTargetDistrict: (districtId) =>
      set((state) => {
        if (state.session) {
          state.session.targetDistrictId = districtId
        }
      }),

    startGenerating: () =>
      set((state) => {
        if (state.session) {
          state.session.phase = 'generating'
        }
      }),

    setProposal: (proposal) =>
      set((state) => {
        if (state.session) {
          // Cast needed: Immer's WritableDraft strips readonly from arrays,
          // but BuilderProposal uses readonly arrays (template.layout.actions, etc.).
          state.session.currentProposal = proposal as typeof state.session.currentProposal
          state.session.phase = 'reviewing'

          // Record this iteration.
          const iteration: BuilderIteration = {
            iterationNumber: state.session.iterations.length + 1,
            description: state.session.description,
            proposal,
            error: null,
            outcome: 'pending',
            timestamp: new Date().toISOString(),
          }
          ;(state.session.iterations as BuilderIteration[]).push(iteration)
        }
      }),

    setError: (error) =>
      set((state) => {
        if (state.session) {
          state.session.phase = 'error'

          // Record the failed iteration.
          const iteration: BuilderIteration = {
            iterationNumber: state.session.iterations.length + 1,
            description: state.session.description,
            proposal: null,
            error,
            outcome: 'error',
            timestamp: new Date().toISOString(),
          }
          ;(state.session.iterations as BuilderIteration[]).push(iteration)
        }
      }),

    acceptProposal: () =>
      set((state) => {
        if (state.session && state.session.iterations.length > 0) {
          state.session.phase = 'accepted'
          // Mark the last iteration as accepted.
          const lastIdx = state.session.iterations.length - 1
          ;(state.session.iterations as BuilderIteration[])[lastIdx] = {
            ...state.session.iterations[lastIdx],
            outcome: 'accepted',
          }
        }
      }),

    rejectProposal: () =>
      set((state) => {
        if (state.session && state.session.iterations.length > 0) {
          state.session.phase = 'rejected'
          // Mark the last iteration as rejected.
          const lastIdx = state.session.iterations.length - 1
          ;(state.session.iterations as BuilderIteration[])[lastIdx] = {
            ...state.session.iterations[lastIdx],
            outcome: 'rejected',
          }
        }
      }),

    startIteration: () =>
      set((state) => {
        if (state.session && state.session.iterations.length > 0) {
          // Mark the last iteration as iterated.
          const lastIdx = state.session.iterations.length - 1
          ;(state.session.iterations as BuilderIteration[])[lastIdx] = {
            ...state.session.iterations[lastIdx],
            outcome: 'iterated',
          }
          // Return to describing phase with the same description.
          state.session.phase = 'describing'
          state.session.currentProposal = null
        }
      }),

    resetBuilder: () =>
      set((state) => {
        state.session = null
        state.panelOpen = false
      }),

    trackCreatedTemplate: (templateId) =>
      set((state) => {
        state.createdTemplateIds.push(templateId)
      }),
  }))
)

// ============================================================================
// Selectors
// ============================================================================

export const builderSelectors = {
  /** Whether the builder panel is open. */
  isPanelOpen: (state: BuilderState): boolean => state.panelOpen,

  /** Whether a session is active and in a non-terminal phase. */
  isSessionActive: (state: BuilderState): boolean =>
    state.session !== null &&
    state.session.phase !== 'accepted' &&
    state.session.phase !== 'rejected',

  /** Whether Claude is currently generating a proposal. */
  isGenerating: (state: BuilderState): boolean => state.session?.phase === 'generating',

  /** Whether a proposal is ready for review. */
  hasProposal: (state: BuilderState): boolean =>
    state.session?.phase === 'reviewing' && state.session.currentProposal !== null,

  /** The current builder phase. */
  currentPhase: (state: BuilderState): BuilderPhase => state.session?.phase ?? 'idle',

  /** Number of iterations in the current session. */
  iterationCount: (state: BuilderState): number => state.session?.iterations.length ?? 0,

  /** Total templates created by the builder in this page session. */
  createdTemplateCount: (state: BuilderState): number => state.createdTemplateIds.length,

  /** Whether the user can submit (has description + district selected). */
  canSubmit: (state: BuilderState): boolean =>
    state.session !== null &&
    state.session.description.trim().length > 10 &&
    state.session.targetDistrictId !== null &&
    (state.session.phase === 'describing' || state.session.phase === 'error'),
}
