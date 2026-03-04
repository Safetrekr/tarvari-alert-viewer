/**
 * Districts store -- Zustand + Immer store for per-app telemetry state.
 *
 * Receives snapshots from the telemetry aggregator (via use-telemetry hook)
 * and exposes per-district telemetry for capsule components and the minimap.
 *
 * @module districts.store
 * @see WS-1.5
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import type { AppTelemetry } from '@/lib/telemetry-types'

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface DistrictsState {
  /** Per-app telemetry keyed by district id. */
  districts: Record<string, AppTelemetry>
  /** ISO timestamp of the most recent snapshot sync. */
  lastSnapshotAt: string | null

  // Actions
  /** Bulk-sync all districts from a telemetry snapshot. */
  syncSnapshot: (districts: Record<string, AppTelemetry>, timestamp: string) => void
  /** Upsert a single district's telemetry. */
  setDistrict: (id: string, telemetry: AppTelemetry) => void
  /** Remove a single district entry. */
  removeDistrict: (id: string) => void
  /** Clear all district data. */
  clearAll: () => void
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDistrictsStore = create<DistrictsState>()(
  immer((set) => ({
    districts: {},
    lastSnapshotAt: null,

    syncSnapshot: (districts, timestamp) =>
      set((state) => {
        state.districts = districts
        state.lastSnapshotAt = timestamp
      }),

    setDistrict: (id, telemetry) =>
      set((state) => {
        state.districts[id] = telemetry
      }),

    removeDistrict: (id) =>
      set((state) => {
        delete state.districts[id]
      }),

    clearAll: () =>
      set((state) => {
        state.districts = {}
        state.lastSnapshotAt = null
      }),
  })),
)

// Re-export AppTelemetry for backward compatibility with existing consumers.
export type { AppTelemetry } from '@/lib/telemetry-types'
