/**
 * Enrichment store -- Zustand + Immer store for ambient enrichment data.
 *
 * Holds the complete EnrichmentSnapshot consumed by the 12 ambient
 * enrichment components (range rings, orbital readouts, system status
 * panel, activity feed, signal pulse monitor, connection paths, etc.).
 *
 * Written to by `useEnrichmentCycle` on a 2-second interval.
 * Read by ambient components via selectors.
 *
 * @module enrichment.store
 * @see WS-1.6 Ambient Effects Layer
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import type { DistrictId, HealthState } from '@/lib/interfaces/district'
import { DISTRICTS, DISTRICT_CODES } from '@/lib/interfaces/district'
import type {
  ActivityEvent,
  ConnectionState,
  DistrictEnrichment,
  EnrichmentSnapshot,
  PerformanceMetrics,
  WaveformState,
} from '@/lib/enrichment/enrichment-types'
import { useAttentionStore } from '@/stores/attention.store'

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of activity events retained in the log (FIFO). */
const MAX_ACTIVITY_LOG = 50

// ============================================================================
// Seed data helpers
// ============================================================================

/**
 * Generate a pseudo-random integer in [min, max] inclusive.
 * Uses Math.random -- acceptable for mock/seed data only.
 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Build the initial DistrictEnrichment for a single district. */
function seedDistrict(id: DistrictId): DistrictEnrichment {
  const meta = DISTRICTS.find((d) => d.id === id)
  return {
    id,
    displayName: meta?.displayName ?? id,
    shortCode: DISTRICT_CODES[id],
    health: 'OPERATIONAL' as HealthState,
    uptime: randInt(1000, 50000),
    responseTimeMs: randInt(20, 80),
    alertCount: 0,
    activeWork: randInt(1, 12),
    version: '1.2.0',
    freshness: 'LIVE',
    memoryUsagePct: randInt(30, 65),
    cpuUsagePct: randInt(10, 45),
  }
}

/** All 6 district IDs in ring order. */
const ALL_DISTRICT_IDS: DistrictId[] = [
  'agent-builder',
  'tarva-chat',
  'project-room',
  'tarva-core',
  'tarva-erp',
  'tarva-code',
]

/** Build the initial districts record. */
function seedDistricts(): Record<DistrictId, DistrictEnrichment> {
  const result = {} as Record<DistrictId, DistrictEnrichment>
  for (const id of ALL_DISTRICT_IDS) {
    result[id] = seedDistrict(id)
  }
  return result
}

/**
 * Build the initial 6 connections matching connection-paths.tsx.
 *
 * 1. agent-builder -> project-room  (AGENTS)
 * 2. agent-builder -> tarva-chat    (AGENTS)
 * 3. tarva-code    -> agent-builder (KNOWLEDGE)
 * 4. tarva-code    -> tarva-chat    (KNOWLEDGE)
 * 5. tarva-erp     -> project-room  (MFG DATA)
 * 6. tarva-core    -> null/hub      (REASONING)
 */
function seedConnections(): ConnectionState[] {
  return [
    { fromId: 'agent-builder', toId: 'project-room', health: 'OPERATIONAL', label: 'AGENTS' },
    { fromId: 'agent-builder', toId: 'tarva-chat', health: 'OPERATIONAL', label: 'AGENTS' },
    { fromId: 'tarva-code', toId: 'agent-builder', health: 'OPERATIONAL', label: 'KNOWLEDGE' },
    { fromId: 'tarva-code', toId: 'tarva-chat', health: 'OPERATIONAL', label: 'KNOWLEDGE' },
    { fromId: 'tarva-erp', toId: 'project-room', health: 'OPERATIONAL', label: 'MFG DATA' },
    { fromId: 'tarva-core', toId: null, health: 'OPERATIONAL', label: 'REASONING' },
  ]
}

// ============================================================================
// State
// ============================================================================

interface EnrichmentStoreState extends EnrichmentSnapshot {}

// ============================================================================
// Actions
// ============================================================================

interface EnrichmentStoreActions {
  /** Merge a partial enrichment snapshot into state. */
  updateSnapshot: (snapshot: Partial<EnrichmentSnapshot>) => void
  /** Add an activity event to the log (FIFO, max 50). */
  pushActivity: (event: ActivityEvent) => void
  /** Set the currently focused (hovered) district. */
  setFocusedDistrict: (id: DistrictId | null) => void
  /** Advance systemEpoch by 2 seconds. Called by the cycle hook each tick. */
  tick: () => void
}

export type EnrichmentStore = EnrichmentStoreState & EnrichmentStoreActions

// ============================================================================
// Store
// ============================================================================

export const useEnrichmentStore = create<EnrichmentStore>()(
  immer((set) => ({
    // --- Initial state ---
    districts: seedDistricts(),
    activityLog: [],
    performance: {
      systemHealthPct: 100,
      throughputPct: 85,
      agentCapacityPct: 70,
    },
    connections: seedConnections(),
    waveform: {
      frequency: 1.0,
      noise: 0,
    },
    systemEpoch: 0,
    focusedDistrictId: null,

    // --- Actions ---

    updateSnapshot: (snapshot) =>
      set((draft) => {
        if (snapshot.districts) {
          for (const [id, enrichment] of Object.entries(snapshot.districts)) {
            draft.districts[id as DistrictId] = enrichment
          }
        }
        if (snapshot.activityLog !== undefined) {
          draft.activityLog = snapshot.activityLog
        }
        if (snapshot.performance) {
          draft.performance = snapshot.performance
        }
        if (snapshot.connections) {
          draft.connections = snapshot.connections
        }
        if (snapshot.waveform) {
          draft.waveform = snapshot.waveform
        }
        if (snapshot.systemEpoch !== undefined) {
          draft.systemEpoch = snapshot.systemEpoch
        }
        if (snapshot.focusedDistrictId !== undefined) {
          draft.focusedDistrictId = snapshot.focusedDistrictId
        }
      }),

    pushActivity: (event) =>
      set((draft) => {
        draft.activityLog.unshift(event)
        if (draft.activityLog.length > MAX_ACTIVITY_LOG) {
          draft.activityLog.length = MAX_ACTIVITY_LOG
        }
      }),

    setFocusedDistrict: (id) =>
      set((draft) => {
        draft.focusedDistrictId = id
      }),

    tick: () =>
      set((draft) => {
        draft.systemEpoch += 2
      }),
  })),
)

// ============================================================================
// Selectors
// ============================================================================

export const enrichmentSelectors = {
  /** Select a single district's enrichment data. */
  district: (id: DistrictId) => (s: EnrichmentStore) => s.districts[id],

  /** Select the full activity log array. */
  activityLog: (s: EnrichmentStore) => s.activityLog,

  /** Select aggregate performance metrics. */
  performance: (s: EnrichmentStore) => s.performance,

  /** Select all connection states. */
  connections: (s: EnrichmentStore) => s.connections,

  /** Select waveform parameters for the signal pulse monitor. */
  waveform: (s: EnrichmentStore) => s.waveform,

  /** Select the currently focused district ID (or null). */
  focusedDistrictId: (s: EnrichmentStore) => s.focusedDistrictId,

  /** Select the system epoch (seconds since page load). */
  systemEpoch: (s: EnrichmentStore) => s.systemEpoch,

  /**
   * Derived: whether the attention system is in "tighten" mode.
   * Reads from the attention store -- not stored in this store.
   * Useful for enrichment consumers that want to intensify visuals
   * when the system is under stress.
   */
  isTightening: () => useAttentionStore.getState().attentionState === 'tighten',
} as const
