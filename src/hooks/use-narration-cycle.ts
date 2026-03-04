/**
 * use-narration-cycle -- Manages the background narration generation loop.
 *
 * Lifecycle:
 * 1. On mount, check if Ollama is available and has the required model.
 * 2. If available, start a 30-second interval that runs narration cycles.
 * 3. Each cycle reads the current SystemSnapshot (from the districts store),
 *    computes deltas from the previous snapshot, and generates narrations
 *    for apps with meaningful changes.
 * 4. If Ollama becomes unreachable, pause the cycle and recheck every 60s.
 * 5. On unmount, clear all intervals.
 *
 * This hook should be mounted ONCE at the hub layout level.
 * It does NOT render any UI -- it is a pure side-effect hook.
 *
 * Gated by an `enabled` parameter: if false, the cycle does not start.
 * This allows a settings toggle to control AI resource usage.
 *
 * @module use-narration-cycle
 * @see WS-3.6
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'

import { useNarrationStore } from '@/stores/narration.store'
import { useDistrictsStore } from '@/stores/districts.store'
import {
  checkOllamaHealth,
  isModelAvailable,
  OLLAMA_DEFAULT_MODEL,
} from '@/lib/ai/ollama-client'
import {
  runNarrationCycle,
  NARRATION_CYCLE_INTERVAL_MS,
} from '@/lib/ai/narration-engine'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { AppState, GlobalMetrics } from '@/lib/interfaces/system-state-provider'

/**
 * How often to re-check Ollama availability when it was previously unavailable.
 * Less aggressive than the narration cycle to avoid spamming a dead endpoint.
 */
const OLLAMA_RECHECK_INTERVAL_MS = 60_000

/**
 * Build a SystemSnapshot from the districts store state.
 * The districts store holds AppTelemetry objects, which we need to
 * adapt into the SystemSnapshot format expected by the delta computer.
 */
function buildSnapshotFromDistrictsStore(): SystemSnapshot | null {
  const state = useDistrictsStore.getState()

  if (!state.lastSnapshotAt || Object.keys(state.districts).length === 0) {
    return null
  }

  // Build AppState records from AppTelemetry
  const apps: Record<string, AppState> = {}
  let alertCount = 0
  let activeWork = 0
  let worstHealth: AppState['health'] = 'OPERATIONAL'

  const healthPriority: Record<string, number> = {
    DOWN: 4,
    DEGRADED: 3,
    UNKNOWN: 2,
    OFFLINE: 1,
    OPERATIONAL: 0,
  }

  for (const [id, telemetry] of Object.entries(state.districts)) {
    // Map AppTelemetry status to HealthState
    const healthMap: Record<string, AppState['health']> = {
      OPERATIONAL: 'OPERATIONAL',
      DEGRADED: 'DEGRADED',
      DOWN: 'DOWN',
      OFFLINE: 'OFFLINE',
      UNKNOWN: 'UNKNOWN',
    }
    const health = healthMap[telemetry.status] ?? 'UNKNOWN'

    const appState: AppState = {
      id: id as AppIdentifier,
      displayName: telemetry.name,
      health,
      pulse: '',
      lastEvent: null,
      lastEventAt: null,
      alertCount: telemetry.alertCount,
      freshnessMs: telemetry.lastSuccessfulContact
        ? Date.now() - new Date(telemetry.lastSuccessfulContact).getTime()
        : null,
      dependencies: [],
      contactHistory: {
        firstContact: telemetry.hasBeenContacted
          ? telemetry.lastSuccessfulContact
          : null,
        lastContact: telemetry.lastSuccessfulContact,
      },
      raw: {
        responseTimeMs: telemetry.responseTimeMs,
        uptime: telemetry.uptime,
        version: telemetry.version,
        checks: telemetry.checks,
        responseTimeHistory: telemetry.responseTimeHistory,
      },
    }

    apps[id] = appState
    alertCount += telemetry.alertCount

    // Track worst health
    if (
      (healthPriority[health] ?? 0) > (healthPriority[worstHealth] ?? 0) &&
      health !== 'OFFLINE' &&
      health !== 'UNKNOWN'
    ) {
      worstHealth = health
    }
  }

  const globalMetrics: GlobalMetrics = {
    alertCount,
    activeWork,
    systemPulse: worstHealth,
  }

  return {
    apps: apps as Record<AppIdentifier, AppState>,
    globalMetrics,
    timestamp: state.lastSnapshotAt,
  }
}

/**
 * useNarrationCycle -- Background narration generation loop.
 *
 * @param enabled - Whether the narration cycle should run. Default: true.
 *   Set to false to disable AI narration (e.g., from a settings toggle).
 */
export function useNarrationCycle(enabled: boolean = true) {
  const previousSnapshotRef = useRef<SystemSnapshot | null>(null)
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isRunningRef = useRef(false)

  const updateCycleStatus = useNarrationStore((s) => s.updateCycleStatus)
  const setBatchNarration = useNarrationStore((s) => s.setBatchNarration)
  const setGenerating = useNarrationStore((s) => s.setGenerating)
  const clearAll = useNarrationStore((s) => s.clearAll)

  /**
   * Execute one narration cycle.
   */
  const executeCycle = useCallback(async () => {
    // Guard against concurrent cycles (Ollama processes sequentially anyway)
    if (isRunningRef.current) return
    isRunningRef.current = true

    const currentSnapshot = buildSnapshotFromDistrictsStore()
    if (!currentSnapshot) {
      isRunningRef.current = false
      return
    }

    try {
      // Gather existing narration text for continuity
      const existingNarrations = new Map<AppIdentifier, string | null>()
      const cache = useNarrationStore.getState().cache
      for (const [appId, entry] of Object.entries(cache)) {
        existingNarrations.set(
          appId as AppIdentifier,
          entry.batchNarration?.whatChanged ?? null,
        )
      }

      // Run the narration cycle
      const results = await runNarrationCycle(
        currentSnapshot,
        previousSnapshotRef.current,
        existingNarrations,
      )

      // Update the store with results
      let successCount = 0
      for (const [appId, result] of results) {
        if (result.success && result.narration) {
          setBatchNarration(appId, result.narration)
          successCount++
        } else {
          setGenerating(appId, 'batch', false)
        }
      }

      // Update cycle status
      updateCycleStatus({
        lastCycleAt: new Date().toISOString(),
        lastCycleAppCount: successCount,
      })

      // Save current snapshot as the previous for next cycle
      previousSnapshotRef.current = currentSnapshot
    } catch (error) {
      console.error('[narration-cycle] Cycle failed:', error)
    } finally {
      isRunningRef.current = false
    }
  }, [setBatchNarration, setGenerating, updateCycleStatus])

  /**
   * Start the narration cycle interval.
   */
  const startCycle = useCallback(() => {
    // Clear any existing timer
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current)
    }

    updateCycleStatus({ isRunning: true })

    // Run immediately, then every NARRATION_CYCLE_INTERVAL_MS
    executeCycle()
    cycleTimerRef.current = setInterval(
      executeCycle,
      NARRATION_CYCLE_INTERVAL_MS,
    )
  }, [executeCycle, updateCycleStatus])

  /**
   * Stop the narration cycle.
   */
  const stopCycle = useCallback(() => {
    if (cycleTimerRef.current) {
      clearInterval(cycleTimerRef.current)
      cycleTimerRef.current = null
    }
    updateCycleStatus({ isRunning: false })
  }, [updateCycleStatus])

  /**
   * Check Ollama availability and start/stop the cycle accordingly.
   */
  const checkAndStart = useCallback(async () => {
    if (!enabled) {
      stopCycle()
      return
    }

    const available = await checkOllamaHealth()

    if (available) {
      const modelReady = await isModelAvailable(OLLAMA_DEFAULT_MODEL)

      if (modelReady) {
        updateCycleStatus({
          ollamaAvailable: true,
          modelId: OLLAMA_DEFAULT_MODEL,
        })
        startCycle()

        // Clear the recheck timer since Ollama is now available
        if (recheckTimerRef.current) {
          clearInterval(recheckTimerRef.current)
          recheckTimerRef.current = null
        }
        return
      } else {
        console.warn(
          `[narration-cycle] Ollama is running but model "${OLLAMA_DEFAULT_MODEL}" is not available. ` +
            `Pull it with: ollama pull ${OLLAMA_DEFAULT_MODEL}`,
        )
      }
    }

    // Ollama not available or model missing
    updateCycleStatus({
      ollamaAvailable: false,
      modelId: null,
      isRunning: false,
    })
    stopCycle()

    // Set up periodic recheck if not already running
    if (!recheckTimerRef.current) {
      recheckTimerRef.current = setInterval(
        checkAndStart,
        OLLAMA_RECHECK_INTERVAL_MS,
      )
    }
  }, [enabled, startCycle, stopCycle, updateCycleStatus])

  /**
   * Initialize on mount; cleanup on unmount.
   */
  useEffect(() => {
    checkAndStart()

    return () => {
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current)
      }
      if (recheckTimerRef.current) {
        clearInterval(recheckTimerRef.current)
      }
      clearAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
}
