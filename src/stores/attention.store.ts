/**
 * Attention store -- Zustand + Immer store for attention choreography state.
 *
 * Holds the computed attention state, performance level, effect configuration,
 * next-best-actions, and hysteresis counter. Syncs CSS custom properties to
 * document.documentElement for CSS-driven ambient effects.
 *
 * The store is written to by `useAttentionChoreography` (the orchestrator hook)
 * and read by effect components via selectors or the `useEffectConfig` hook.
 *
 * @module attention.store
 * @see WS-3.7 Section 4.6
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'

import type {
  AttentionState,
  EffectConfig,
  NextBestAction,
  PerformanceLevel,
} from '@/lib/ai/attention-types'
import { EFFECT_BASELINE } from '@/lib/ai/attention-matrix'

// ============================================================================
// State
// ============================================================================

interface AttentionStoreState {
  /** Current attention state (after hysteresis). */
  attentionState: AttentionState
  /** Current client performance level. */
  performanceLevel: PerformanceLevel
  /** Computed effect configuration. */
  effectConfig: EffectConfig
  /** Suggested actions during tighten state. */
  nextBestActions: NextBestAction[]
  /** Consecutive calm-eligible snapshot count (for hysteresis). */
  consecutiveCalmCount: number
  /** Set of anomalous app identifiers (for beacon glow modulation). */
  anomalousApps: Set<string>
}

// ============================================================================
// Actions
// ============================================================================

interface AttentionStoreActions {
  /** Update attention state. Called by useAttentionChoreography. */
  setAttentionState: (state: AttentionState) => void
  /** Update performance level. Called by usePerformanceMonitor consumer. */
  setPerformanceLevel: (level: PerformanceLevel) => void
  /** Update the full computed effect config. */
  setEffectConfig: (config: EffectConfig) => void
  /** Update next-best-actions. */
  setNextBestActions: (actions: NextBestAction[]) => void
  /** Update the consecutive calm count (hysteresis). */
  setConsecutiveCalmCount: (count: number) => void
  /** Update the set of anomalous apps. */
  setAnomalousApps: (apps: ReadonlySet<string> | Set<string>) => void
}

export type AttentionStore = AttentionStoreState & AttentionStoreActions

// ============================================================================
// Store
// ============================================================================

export const useAttentionStore = create<AttentionStore>()(
  subscribeWithSelector(
    immer((set) => ({
      attentionState: 'calm' as AttentionState,
      performanceLevel: 'full' as PerformanceLevel,
      effectConfig: { ...EFFECT_BASELINE },
      nextBestActions: [],
      consecutiveCalmCount: 0,
      anomalousApps: new Set<string>(),

      setAttentionState: (attentionState) =>
        set((draft) => {
          draft.attentionState = attentionState
        }),

      setPerformanceLevel: (performanceLevel) =>
        set((draft) => {
          draft.performanceLevel = performanceLevel
        }),

      setEffectConfig: (effectConfig) =>
        set((draft) => {
          draft.effectConfig = effectConfig
        }),

      setNextBestActions: (nextBestActions) =>
        set((draft) => {
          draft.nextBestActions = nextBestActions
        }),

      setConsecutiveCalmCount: (consecutiveCalmCount) =>
        set((draft) => {
          draft.consecutiveCalmCount = consecutiveCalmCount
        }),

      setAnomalousApps: (anomalousApps) =>
        set((draft) => {
          // Copy into a new Set so Immer's draft can accept it
          draft.anomalousApps = new Set(anomalousApps)
        }),
    })),
  ),
)

// ============================================================================
// Selectors
// ============================================================================

export const attentionSelectors = {
  attentionState: (s: AttentionStore) => s.attentionState,
  performanceLevel: (s: AttentionStore) => s.performanceLevel,
  effectConfig: (s: AttentionStore) => s.effectConfig,
  nextBestActions: (s: AttentionStore) => s.nextBestActions,
  anomalousApps: (s: AttentionStore) => s.anomalousApps,
  isTightening: (s: AttentionStore) => s.attentionState === 'tighten',

  /** Particle-specific config (for ParticleField consumption). */
  particleConfig: (s: AttentionStore) => ({
    count: s.effectConfig.particleCount,
    opacityMin: s.effectConfig.particleOpacityMin,
    opacityMax: s.effectConfig.particleOpacityMax,
    driftMultiplier: s.effectConfig.particleDriftMultiplier,
  }),

  /** Morph timing override (for useMorphChoreography consumption). */
  morphTiming: (s: AttentionStore) => ({
    focusing: s.effectConfig.morphFocusingMs,
    morphing: s.effectConfig.morphMorphingMs,
    unfurling: s.effectConfig.morphUnfurlingMs,
  }),

  /** Beacon glow config (for DistrictBeacon consumption). */
  beaconGlow: (s: AttentionStore) => ({
    anomalyMultiplier: s.effectConfig.beaconAnomalyGlowMultiplier,
    healthyMultiplier: s.effectConfig.beaconHealthyGlowMultiplier,
    anomalousApps: s.anomalousApps,
  }),
}

// ============================================================================
// CSS Custom Property Sync
// ============================================================================

/**
 * Maps EffectConfig fields to CSS custom property names.
 *
 * CSS-driven effects (HeartbeatPulse, GlowBreathing, GridPulse, FilmGrain)
 * read these custom properties for their animation parameters. The attention
 * system writes them to document.documentElement.style whenever the
 * EffectConfig changes.
 *
 * This bridges the Zustand store to the CSS Ambient tier (AD-3) without
 * requiring React re-renders of individual effect components.
 */
const CSS_PROPERTY_MAP: ReadonlyArray<{
  property: string
  getValue: (config: EffectConfig) => string
}> = [
  {
    property: '--attention-heartbeat-duration',
    getValue: (c) => `${c.heartbeatDurationMs}ms`,
  },
  {
    property: '--attention-heartbeat-anomaly-duration',
    getValue: (c) => `${c.heartbeatAnomalyDurationMs}ms`,
  },
  {
    property: '--attention-breathe-duration',
    getValue: (c) => `${c.breatheDurationMs}ms`,
  },
  {
    property: '--attention-breathe-intensity',
    getValue: (c) => String(c.breatheIntensity),
  },
  {
    property: '--attention-grid-pulse-duration',
    getValue: (c) => `${c.gridPulseDurationMs}ms`,
  },
  {
    property: '--attention-grain-opacity',
    getValue: (c) => String(c.grainOpacity),
  },
]

/**
 * Subscribe to effectConfig changes and sync CSS custom properties.
 *
 * This function should be called once at app initialization (e.g., in
 * the hub layout). It returns an unsubscribe function.
 *
 * Uses Zustand's subscribeWithSelector to only fire when effectConfig
 * actually changes (referential equality check).
 */
export function syncAttentionCSSProperties(): () => void {
  return useAttentionStore.subscribe(
    (state) => state.effectConfig,
    (effectConfig) => {
      if (typeof document === 'undefined') return

      const root = document.documentElement.style
      for (const mapping of CSS_PROPERTY_MAP) {
        root.setProperty(mapping.property, mapping.getValue(effectConfig))
      }
    },
    { fireImmediately: true },
  )
}
