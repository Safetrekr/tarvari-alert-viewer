/**
 * Central attention choreography orchestration hook.
 *
 * This hook is the single integration point between telemetry data
 * and visual effect modulation. It should be mounted ONCE, in the
 * hub layout component, alongside other global providers.
 *
 * Responsibilities:
 * 1. Subscribe to the districts store for telemetry changes.
 * 2. Compute raw attention state via the rule engine.
 * 3. Apply hysteresis to prevent mode flicker.
 * 4. Determine client performance level.
 * 5. Resolve the complete EffectConfig from the modulation matrix.
 * 6. Compute next-best-actions for the HUD.
 * 7. Identify anomalous apps for beacon glow modulation.
 * 8. Publish all results to the attention store.
 * 9. Sync CSS custom properties for CSS-driven effects.
 *
 * The hook does NOT directly modify any effect component. It publishes
 * computed state; effect components consume it via the attention store
 * or CSS custom properties.
 *
 * Runs on a 2-second interval (not every frame) to avoid unnecessary
 * computation on every telemetry poll.
 *
 * @module use-attention-choreography
 * @see WS-3.7 Section 4.7
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'

import { useReducedMotion } from '@tarva/ui/motion'

import { useDistrictsStore } from '@/stores/districts.store'
import {
  useAttentionStore,
  syncAttentionCSSProperties,
} from '@/stores/attention.store'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import {
  computeRawAttentionState,
  applyHysteresis,
  computeNextBestActions,
  getAnomalousApps,
  buildSnapshotFromDistricts,
} from '@/lib/ai/attention-engine'
import { resolveEffectConfig, resolveReducedMotionConfig } from '@/lib/ai/attention-matrix'
import { DEFAULT_ATTENTION_HYSTERESIS } from '@/lib/ai/attention-types'
import type { AttentionState } from '@/lib/ai/attention-types'

// ============================================================================
// Constants
// ============================================================================

/**
 * Interval between attention evaluations in ms.
 * Runs every 2 seconds rather than on every frame to keep CPU usage low.
 * Telemetry polls every 5-30s (AD-5), so 2s provides timely response
 * without redundant computation.
 */
const EVALUATION_INTERVAL_MS = 2000

// ============================================================================
// Hook
// ============================================================================

/**
 * Central attention choreography orchestration hook.
 *
 * Mount this ONCE in the hub layout component. It reads telemetry from
 * the districts store, computes attention state, and publishes the
 * resolved EffectConfig to the attention store and CSS custom properties.
 *
 * @returns void -- all output goes to the attention store.
 */
export function useAttentionChoreography(): void {
  const reducedMotion = useReducedMotion()
  const performanceLevel = usePerformanceMonitor()

  // Attention store actions (stable references from Zustand)
  const setAttentionState = useAttentionStore((s) => s.setAttentionState)
  const setPerformanceLevel = useAttentionStore((s) => s.setPerformanceLevel)
  const setEffectConfig = useAttentionStore((s) => s.setEffectConfig)
  const setNextBestActions = useAttentionStore((s) => s.setNextBestActions)
  const setConsecutiveCalmCount = useAttentionStore((s) => s.setConsecutiveCalmCount)
  const setAnomalousApps = useAttentionStore((s) => s.setAnomalousApps)

  // Hysteresis state (ref to avoid re-render cycles)
  const hysteresisRef = useRef<{
    currentState: AttentionState
    consecutiveCalmCount: number
  }>({
    currentState: 'calm',
    consecutiveCalmCount: 0,
  })

  // Track reduced motion and performance level in refs for the interval callback
  const reducedMotionRef = useRef(reducedMotion)
  reducedMotionRef.current = reducedMotion

  const performanceLevelRef = useRef(performanceLevel)
  performanceLevelRef.current = performanceLevel

  // CSS property sync (runs once on mount)
  useEffect(() => {
    const unsub = syncAttentionCSSProperties()
    return unsub
  }, [])

  // Update performance level in store when it changes
  useEffect(() => {
    setPerformanceLevel(performanceLevel)
  }, [performanceLevel, setPerformanceLevel])

  /**
   * Core evaluation function. Reads current districts store state,
   * runs the attention engine, and publishes results.
   */
  const evaluate = useCallback(() => {
    const districtsState = useDistrictsStore.getState()
    const districts = districtsState.districts
    const timestamp = districtsState.lastSnapshotAt

    // No telemetry data yet -- nothing to evaluate
    if (!timestamp || Object.keys(districts).length === 0) {
      return
    }

    // Assemble a SystemSnapshot from the districts store
    const snapshot = buildSnapshotFromDistricts(districts, timestamp)

    // Step 1: Compute raw attention state
    const rawState = computeRawAttentionState(snapshot)

    // Step 2: Apply hysteresis
    const [newState, newCount] = applyHysteresis(
      rawState,
      hysteresisRef.current.currentState,
      hysteresisRef.current.consecutiveCalmCount,
      DEFAULT_ATTENTION_HYSTERESIS.calmThreshold,
    )

    // Update hysteresis ref
    hysteresisRef.current.currentState = newState
    hysteresisRef.current.consecutiveCalmCount = newCount

    // Step 3: Resolve effect config
    const currentPerformance = performanceLevelRef.current
    const isReducedMotion = reducedMotionRef.current
    const effectConfig = isReducedMotion
      ? resolveReducedMotionConfig(newState)
      : resolveEffectConfig(newState, currentPerformance)

    // Step 4: Compute next-best-actions
    const actions = computeNextBestActions(snapshot, newState)

    // Step 5: Identify anomalous apps
    const anomalous = getAnomalousApps(snapshot)

    // Step 6: Publish to attention store
    setAttentionState(newState)
    setConsecutiveCalmCount(newCount)
    setEffectConfig(effectConfig)
    setNextBestActions(actions)
    setAnomalousApps(anomalous)
  }, [
    setAttentionState,
    setConsecutiveCalmCount,
    setEffectConfig,
    setNextBestActions,
    setAnomalousApps,
  ])

  // Run evaluation on a 2-second interval
  useEffect(() => {
    // Run immediately on mount
    evaluate()

    const intervalId = setInterval(evaluate, EVALUATION_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [evaluate])

  // Also re-evaluate when reduced motion or performance level changes
  useEffect(() => {
    evaluate()
  }, [reducedMotion, performanceLevel, evaluate])
}
