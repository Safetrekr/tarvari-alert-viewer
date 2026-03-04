/**
 * UI store for global interface state.
 *
 * Manages the morph state machine (3-phase, forward/reverse),
 * district selection, and command palette visibility.
 *
 * @module ui.store
 * @see WS-0.1 (skeleton), WS-2.1 Section 4.3 (evolution)
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DistrictId } from '@/lib/interfaces/district'
import type { MorphPhase, MorphDirection, MorphState } from '@/lib/morph-types'

// ============================================================
// STATE
// ============================================================

interface UIState {
  // --- Selection ---
  selectedDistrictId: DistrictId | null

  // --- Morph State Machine ---
  morph: MorphState

  // --- Command Palette ---
  commandPaletteOpen: boolean
}

// ============================================================
// ACTIONS
// ============================================================

interface UIActions {
  /**
   * Select a district. This does NOT start the morph -- it only sets
   * the selection target. The morph orchestrator listens for this
   * change and calls startMorph() if appropriate.
   */
  selectDistrict: (id: DistrictId | null) => void

  /**
   * Begin forward morph: idle -> expanding -> settled.
   * Only valid when morph.phase === 'idle'.
   * Sets selectedDistrictId, morph.phase, morph.direction, morph.targetId.
   */
  startMorph: (districtId: DistrictId) => void

  /**
   * Begin reverse morph back to the atrium.
   * Valid from 'settled', 'entering-district', or 'district'.
   * From settled: goes to expanding (reverse). From district/entering-district: goes to leaving-district.
   */
  reverseMorph: () => void

  /**
   * Advance the morph phase. Called only by useMorphChoreography.
   * Records the phase start timestamp for timing coordination.
   */
  setMorphPhase: (phase: MorphPhase) => void

  /**
   * Reset morph to idle state. Called at the end of reverse flow.
   * Clears selectedDistrictId, targetId, direction.
   */
  resetMorph: () => void

  // --- Command Palette ---
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
}

export type UIStore = UIState & UIActions

// ============================================================
// INITIAL STATE
// ============================================================

const INITIAL_MORPH_STATE: MorphState = {
  phase: 'idle',
  direction: 'forward',
  targetId: null,
  phaseStartedAt: null,
}

// ============================================================
// STORE
// ============================================================

export const useUIStore = create<UIStore>()(
  immer((set) => ({
    selectedDistrictId: null,
    morph: { ...INITIAL_MORPH_STATE },
    commandPaletteOpen: false,

    selectDistrict: (id) =>
      set((state) => {
        state.selectedDistrictId = id
      }),

    startMorph: (districtId) =>
      set((state) => {
        if (state.morph.phase !== 'idle') return // Guard: only start from idle
        state.selectedDistrictId = districtId
        state.morph.phase = 'expanding'
        state.morph.direction = 'forward'
        state.morph.targetId = districtId
        state.morph.phaseStartedAt = performance.now()
      }),

    reverseMorph: () =>
      set((state) => {
        const { phase } = state.morph
        if (phase === 'settled') {
          // From settled: reverse through expanding back to idle
          state.morph.direction = 'reverse'
          state.morph.phase = 'expanding'
          state.morph.phaseStartedAt = performance.now()
        } else if (phase === 'district' || phase === 'entering-district') {
          // From district view: fade out overlay then reset
          state.morph.direction = 'reverse'
          state.morph.phase = 'leaving-district'
          state.morph.phaseStartedAt = performance.now()
        }
        // Other phases: ignore (already animating)
      }),

    setMorphPhase: (phase) =>
      set((state) => {
        state.morph.phase = phase
        state.morph.phaseStartedAt = performance.now()
      }),

    resetMorph: () =>
      set((state) => {
        state.selectedDistrictId = null
        state.morph = { ...INITIAL_MORPH_STATE }
      }),

    toggleCommandPalette: () =>
      set((state) => {
        state.commandPaletteOpen = !state.commandPaletteOpen
      }),

    setCommandPaletteOpen: (open) =>
      set((state) => {
        state.commandPaletteOpen = open
      }),
  }))
)

// ============================================================
// SELECTORS
// ============================================================

export const uiSelectors = {
  /** Current morph phase. */
  morphPhase: (state: UIStore): MorphPhase => state.morph.phase,

  /** Whether the morph is actively animating (not idle, settled, or district). */
  isMorphing: (state: UIStore): boolean => {
    const p = state.morph.phase
    return p !== 'idle' && p !== 'settled' && p !== 'district'
  },

  /** Whether a district is fully expanded and interactive. */
  isDistrictSettled: (state: UIStore): boolean => state.morph.phase === 'settled',

  /** Whether the full-screen district view is active. */
  isDistrictView: (state: UIStore): boolean => {
    const p = state.morph.phase
    return p === 'entering-district' || p === 'district' || p === 'leaving-district'
  },

  /** Whether the morph is running in reverse (deselection). */
  isReversing: (state: UIStore): boolean => state.morph.direction === 'reverse',

  /** The district being morphed to/from, or null. */
  morphTargetId: (state: UIStore): DistrictId | null => state.morph.targetId,
}
