/**
 * Narration store -- Zustand + Immer store for AI-narrated telemetry.
 *
 * Caches narrations per app and tracks the overall narration cycle status.
 * Narrations are in-memory only (not persisted to Supabase) -- they are
 * ephemeral by design, regenerated every 30 seconds.
 *
 * @module narration.store
 * @see WS-3.6
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import type { AppIdentifier } from '@/lib/interfaces/types'
import type {
  Narration,
  NarrationCacheEntry,
  NarrationCycleStatus,
} from '@/lib/ai/narration-types'

// ============================================================================
// Store State
// ============================================================================

interface NarrationState {
  /** Per-app narration cache. Keyed by AppIdentifier. */
  cache: Record<string, NarrationCacheEntry>

  /** Overall narration cycle status. */
  cycleStatus: NarrationCycleStatus

  // -- Actions --

  /**
   * Update the batch narration for a specific app.
   * Called by the narration cycle after each successful generation.
   */
  setBatchNarration: (appId: AppIdentifier, narration: Narration) => void

  /**
   * Update the deep-dive narration for a specific app.
   * Called after a user-requested deep-dive completes.
   */
  setDeepDiveNarration: (appId: AppIdentifier, narration: Narration) => void

  /**
   * Clear the deep-dive narration for a specific app.
   * Reverts to showing the batch narration.
   */
  clearDeepDiveNarration: (appId: AppIdentifier) => void

  /**
   * Mark an app as currently generating a narration.
   */
  setGenerating: (
    appId: AppIdentifier,
    type: 'batch' | 'deep-dive',
    isGenerating: boolean,
  ) => void

  /**
   * Update the overall cycle status.
   */
  updateCycleStatus: (update: Partial<NarrationCycleStatus>) => void

  /**
   * Clear all narrations. Used on session reset or Ollama disconnect.
   */
  clearAll: () => void
}

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_CYCLE_STATUS: NarrationCycleStatus = {
  isRunning: false,
  ollamaAvailable: false,
  modelId: null,
  lastCycleAt: null,
  lastCycleAppCount: 0,
  totalNarrations: 0,
  averageLatencyMs: 0,
}

function createEmptyCacheEntry(): NarrationCacheEntry {
  return {
    batchNarration: null,
    deepDiveNarration: null,
    isGenerating: false,
    isDeepDiveGenerating: false,
  }
}

// ============================================================================
// Store
// ============================================================================

export const useNarrationStore = create<NarrationState>()(
  immer((set) => ({
    cache: {},
    cycleStatus: { ...INITIAL_CYCLE_STATUS },

    setBatchNarration: (appId, narration) =>
      set((state) => {
        if (!state.cache[appId]) {
          state.cache[appId] = createEmptyCacheEntry()
        }
        state.cache[appId].batchNarration = narration
        state.cache[appId].isGenerating = false

        // Update cycle statistics
        state.cycleStatus.totalNarrations += 1
        const prevTotal = state.cycleStatus.totalNarrations - 1
        const prevAvg = state.cycleStatus.averageLatencyMs
        state.cycleStatus.averageLatencyMs =
          prevTotal > 0
            ? (prevAvg * prevTotal + narration.latencyMs) /
              state.cycleStatus.totalNarrations
            : narration.latencyMs
      }),

    setDeepDiveNarration: (appId, narration) =>
      set((state) => {
        if (!state.cache[appId]) {
          state.cache[appId] = createEmptyCacheEntry()
        }
        state.cache[appId].deepDiveNarration = narration
        state.cache[appId].isDeepDiveGenerating = false

        // Deep-dives also count toward total statistics
        state.cycleStatus.totalNarrations += 1
      }),

    clearDeepDiveNarration: (appId) =>
      set((state) => {
        if (state.cache[appId]) {
          state.cache[appId].deepDiveNarration = null
        }
      }),

    setGenerating: (appId, type, isGenerating) =>
      set((state) => {
        if (!state.cache[appId]) {
          state.cache[appId] = createEmptyCacheEntry()
        }
        if (type === 'batch') {
          state.cache[appId].isGenerating = isGenerating
        } else {
          state.cache[appId].isDeepDiveGenerating = isGenerating
        }
      }),

    updateCycleStatus: (update) =>
      set((state) => {
        Object.assign(state.cycleStatus, update)
      }),

    clearAll: () =>
      set((state) => {
        state.cache = {}
        state.cycleStatus = { ...INITIAL_CYCLE_STATUS }
      }),
  })),
)
