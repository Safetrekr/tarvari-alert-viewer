/**
 * use-enrichment-cycle -- Orchestrates mock telemetry generation for
 * the 12 ambient enrichment components.
 *
 * Runs a 2-second interval (offset from the attention choreography's
 * 2-second evaluation cycle) that:
 *
 * 1. Advances the system epoch counter.
 * 2. Applies small random fluctuations to per-district metrics
 *    (response time, CPU, memory, uptime).
 * 3. Occasionally generates new ActivityEvents with realistic verbs.
 * 4. Recomputes aggregate PerformanceMetrics from district data.
 * 5. Updates WaveformState based on worst district health.
 * 6. Occasionally toggles a random district to DEGRADED for visual
 *    variety, then restores it after ~10 ticks.
 *
 * This hook should be mounted ONCE at the hub layout level (page.tsx).
 * It does NOT render any UI -- it is a pure side-effect hook.
 *
 * Gated by the `effectsEnabled` setting: when false, the cycle pauses
 * and no updates are pushed.
 *
 * @module use-enrichment-cycle
 * @see WS-1.6 Ambient Effects Layer
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'

import type { DistrictId, HealthState } from '@/lib/interfaces/district'
import type {
  ActivityEvent,
  ConnectionState,
  DistrictEnrichment,
  PerformanceMetrics,
  WaveformState,
} from '@/lib/enrichment/enrichment-types'
import { useEnrichmentStore } from '@/stores/enrichment.store'
import { useSettingsStore } from '@/stores/settings.store'

// ============================================================================
// Constants
// ============================================================================

/** Cycle interval in milliseconds. Offset by 100ms from the attention 2s cycle. */
const CYCLE_INTERVAL_MS = 2000

/** All 6 district IDs for iteration. */
const ALL_DISTRICT_IDS: DistrictId[] = [
  'agent-builder',
  'tarva-chat',
  'project-room',
  'tarva-core',
  'tarva-erp',
  'tarva-code',
]

// ---------------------------------------------------------------------------
// Activity event verb pools
// ---------------------------------------------------------------------------

const VERBS_DATA = ['QUERY.KNOW', 'QUERY.VEC', 'CHAT.MSG', 'SYNC.ERP', 'FETCH.DOC'] as const
const VERBS_DEPLOY = ['DEPLOY.AGENT', 'BUILD.AGENT', 'DEPLOY.SKILL'] as const
const VERBS_SYSTEM = ['REASON.CORE', 'SCAN.INDEX', 'HEALTH.CHECK'] as const

/** Map from category to verb pool. */
const VERB_POOLS = {
  data: VERBS_DATA,
  deploy: VERBS_DEPLOY,
  system: VERBS_SYSTEM,
} as const

type EventCategory = keyof typeof VERB_POOLS

/** Event categories with weights for random selection. */
const CATEGORY_WEIGHTS: Array<{ category: EventCategory; weight: number }> = [
  { category: 'data', weight: 0.5 },
  { category: 'deploy', weight: 0.3 },
  { category: 'system', weight: 0.2 },
]

// ---------------------------------------------------------------------------
// Health value map for aggregate calculations
// ---------------------------------------------------------------------------

const HEALTH_VALUE: Record<HealthState, number> = {
  OPERATIONAL: 100,
  DEGRADED: 60,
  DOWN: 10,
  OFFLINE: 0,
  UNKNOWN: 0,
}

// ============================================================================
// Helpers
// ============================================================================

/** Pseudo-random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Pseudo-random float in [min, max]. */
function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/** Clamp a value to [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Pick a random element from an array. */
function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Generate a unique event ID. */
let eventCounter = 0
function nextEventId(): string {
  eventCounter += 1
  return `evt-${Date.now()}-${eventCounter}`
}

/** Select a weighted-random event category. */
function pickCategory(): EventCategory {
  const roll = Math.random()
  let cumulative = 0
  for (const { category, weight } of CATEGORY_WEIGHTS) {
    cumulative += weight
    if (roll <= cumulative) return category
  }
  return 'data'
}

// ============================================================================
// Core cycle logic (pure functions, no hooks)
// ============================================================================

/**
 * Apply small random fluctuations to a district's numeric metrics.
 * Returns a new DistrictEnrichment with drifted values.
 */
function driftDistrict(district: DistrictEnrichment): DistrictEnrichment {
  return {
    ...district,
    responseTimeMs: clamp(
      district.responseTimeMs + randFloat(-15, 15),
      5,
      200,
    ),
    cpuUsagePct: clamp(
      district.cpuUsagePct + randFloat(-5, 5),
      2,
      95,
    ),
    memoryUsagePct: clamp(
      district.memoryUsagePct + randFloat(-3, 3),
      10,
      95,
    ),
    uptime: district.uptime + 2,
  }
}

/** Generate a random ActivityEvent. */
function generateActivityEvent(): ActivityEvent {
  const category = pickCategory()
  const verbs = VERB_POOLS[category]
  const verb = pickRandom(verbs)
  const target = pickRandom(ALL_DISTRICT_IDS)

  // Most events succeed; small chance of WARN or FAIL
  const statusRoll = Math.random()
  let status: ActivityEvent['status'] = 'OK'
  if (statusRoll > 0.92) status = 'FAIL'
  else if (statusRoll > 0.80) status = 'WARN'

  return {
    id: nextEventId(),
    timestamp: new Date(),
    verb,
    target,
    status,
    category,
  }
}

/**
 * Compute aggregate PerformanceMetrics from district enrichment data.
 */
function computePerformance(
  districts: Record<DistrictId, DistrictEnrichment>,
): PerformanceMetrics {
  const entries = Object.values(districts)
  const count = entries.length || 1

  // systemHealthPct: weighted average of health scores
  const totalHealth = entries.reduce(
    (sum, d) => sum + HEALTH_VALUE[d.health],
    0,
  )
  const systemHealthPct = Math.round(totalHealth / count)

  // throughputPct: inverse of avg response time, mapped to 0-100
  // Target: 20ms = 100%, 200ms = 0%
  const avgResponseTime =
    entries.reduce((sum, d) => sum + d.responseTimeMs, 0) / count
  const throughputPct = clamp(
    Math.round(((200 - avgResponseTime) / 180) * 100),
    0,
    100,
  )

  // agentCapacityPct: inverse of avg memory usage (lower memory = more headroom)
  const avgMemory =
    entries.reduce((sum, d) => sum + d.memoryUsagePct, 0) / count
  const agentCapacityPct = clamp(Math.round(100 - avgMemory), 0, 100)

  return { systemHealthPct, throughputPct, agentCapacityPct }
}

/**
 * Compute WaveformState from district health.
 * Frequency and noise increase when districts are unhealthy.
 */
function computeWaveform(
  districts: Record<DistrictId, DistrictEnrichment>,
): WaveformState {
  const entries = Object.values(districts)
  const hasDown = entries.some((d) => d.health === 'DOWN')
  const hasDegraded = entries.some((d) => d.health === 'DEGRADED')

  if (hasDown) {
    return { frequency: 2.0, noise: 0.6 }
  }
  if (hasDegraded) {
    return { frequency: 1.5, noise: 0.3 }
  }
  return { frequency: 1.0, noise: 0 }
}

/**
 * Update connection health based on endpoint district health.
 * A connection's health is the worse of its two endpoint health states.
 */
function updateConnections(
  connections: ConnectionState[],
  districts: Record<DistrictId, DistrictEnrichment>,
): ConnectionState[] {
  return connections.map((conn) => {
    const fromHealth = conn.fromId ? districts[conn.fromId]?.health : 'OPERATIONAL'
    const toHealth = conn.toId ? districts[conn.toId]?.health : 'OPERATIONAL'

    // Derive connection health as the worse of the two endpoints
    const fromVal = HEALTH_VALUE[fromHealth ?? 'OPERATIONAL']
    const toVal = HEALTH_VALUE[toHealth ?? 'OPERATIONAL']
    const worseVal = Math.min(fromVal, toVal)

    let health: HealthState = 'OPERATIONAL'
    if (worseVal <= 10) health = 'DOWN'
    else if (worseVal <= 60) health = 'DEGRADED'

    return { ...conn, health }
  })
}

// ============================================================================
// Degradation tracker
// ============================================================================

interface DegradationEntry {
  districtId: DistrictId
  ticksRemaining: number
}

// ============================================================================
// Hook
// ============================================================================

/**
 * useEnrichmentCycle -- Orchestrates mock telemetry generation for
 * ambient enrichment components.
 *
 * Mount this ONCE in the hub layout component (page.tsx).
 * The cycle pauses when `effectsEnabled` is false in settings.
 *
 * @returns void -- all output goes to the enrichment store.
 */
export function useEnrichmentCycle(): void {
  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)

  // Store actions (stable references from Zustand)
  const tick = useEnrichmentStore((s) => s.tick)
  const updateSnapshot = useEnrichmentStore((s) => s.updateSnapshot)
  const pushActivity = useEnrichmentStore((s) => s.pushActivity)

  // Track active degradation simulations across ticks
  const degradationsRef = useRef<DegradationEntry[]>([])

  /**
   * Execute one enrichment cycle tick.
   * Reads current state from the store, applies mutations,
   * and pushes the updated snapshot back.
   */
  const executeTick = useCallback(() => {
    const state = useEnrichmentStore.getState()

    // -----------------------------------------------------------------------
    // 1. Advance epoch
    // -----------------------------------------------------------------------
    tick()

    // -----------------------------------------------------------------------
    // 2. Drift district metrics
    // -----------------------------------------------------------------------
    const updatedDistricts = { ...state.districts }

    for (const id of ALL_DISTRICT_IDS) {
      const district = updatedDistricts[id]
      if (district) {
        updatedDistricts[id] = driftDistrict(district)
      }
    }

    // -----------------------------------------------------------------------
    // 3. Manage degradation simulation
    // -----------------------------------------------------------------------

    // Tick down active degradations and restore districts
    degradationsRef.current = degradationsRef.current
      .map((entry) => ({ ...entry, ticksRemaining: entry.ticksRemaining - 1 }))
      .filter((entry) => {
        if (entry.ticksRemaining <= 0) {
          // Restore to OPERATIONAL
          const d = updatedDistricts[entry.districtId]
          if (d) {
            updatedDistricts[entry.districtId] = {
              ...d,
              health: 'OPERATIONAL',
              alertCount: 0,
            }
          }
          return false
        }
        return true
      })

    // 3% chance to degrade a random healthy district
    if (Math.random() < 0.03) {
      const healthyIds = ALL_DISTRICT_IDS.filter((id) => {
        const d = updatedDistricts[id]
        const alreadyDegraded = degradationsRef.current.some(
          (entry) => entry.districtId === id,
        )
        return d?.health === 'OPERATIONAL' && !alreadyDegraded
      })

      if (healthyIds.length > 0) {
        const targetId = pickRandom(healthyIds)
        const d = updatedDistricts[targetId]
        if (d) {
          updatedDistricts[targetId] = {
            ...d,
            health: 'DEGRADED',
            alertCount: randInt(1, 3),
            responseTimeMs: clamp(d.responseTimeMs + randInt(30, 60), 5, 200),
          }
          degradationsRef.current.push({
            districtId: targetId,
            ticksRemaining: 10,
          })
        }
      }
    }

    // -----------------------------------------------------------------------
    // 4. Generate activity event (10% chance per tick)
    // -----------------------------------------------------------------------
    if (Math.random() < 0.10) {
      const event = generateActivityEvent()
      pushActivity(event)
    }

    // -----------------------------------------------------------------------
    // 5. Compute aggregate metrics
    // -----------------------------------------------------------------------
    const performance = computePerformance(updatedDistricts)
    const waveform = computeWaveform(updatedDistricts)
    const connections = updateConnections(state.connections, updatedDistricts)

    // -----------------------------------------------------------------------
    // 6. Push snapshot update
    // -----------------------------------------------------------------------
    updateSnapshot({
      districts: updatedDistricts,
      performance,
      waveform,
      connections,
    })
  }, [tick, updateSnapshot, pushActivity])

  // -------------------------------------------------------------------------
  // Interval lifecycle
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!effectsEnabled) return

    // Offset by 100ms so the enrichment cycle and attention cycle
    // do not fire on the exact same frame
    const offsetTimerId = setTimeout(() => {
      // Run one tick immediately
      executeTick()

      // Then start the interval
      const intervalId = setInterval(executeTick, CYCLE_INTERVAL_MS)

      // Store cleanup in a closure so the timeout cleanup can reach it
      cleanupRef.current = () => {
        clearInterval(intervalId)
      }
    }, 100)

    // Mutable ref for interval cleanup from inside the timeout
    const cleanupRef = { current: () => {} }

    return () => {
      clearTimeout(offsetTimerId)
      cleanupRef.current()
    }
  }, [effectsEnabled, executeTick])
}
