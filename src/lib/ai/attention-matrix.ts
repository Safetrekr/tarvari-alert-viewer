/**
 * Effect modulation matrix for attention choreography.
 *
 * The deterministic 6-cell matrix that maps (AttentionState, PerformanceLevel)
 * to concrete EffectConfig values. This is the heart of the attention
 * choreography system -- it translates semantic state into specific visual
 * parameter values.
 *
 * Design rationale for each cell is documented inline. All baseline values
 * come from VISUAL-DESIGN-SPEC.md and the WS-1.6/WS-2.1 specifications.
 *
 * @module attention-matrix
 * @see WS-3.7 Section 4.4
 * @see VISUAL-DESIGN-SPEC.md Section 5 (Living Details)
 * @see VISUAL-DESIGN-SPEC.md Section 6.1 (Design Tokens)
 */

import type { AttentionState, EffectConfig, PerformanceLevel } from '@/lib/ai/attention-types'

// ============================================================================
// Baseline Values
// ============================================================================

/**
 * Baseline effect values at calm + full performance.
 * These match the WS-1.6 and WS-2.1 default specifications exactly.
 */
const BASELINE: Readonly<EffectConfig> = {
  // Particles: VISUAL-DESIGN-SPEC.md Section 5.1
  particleCount: 18,
  particleOpacityMin: 0.04,
  particleOpacityMax: 0.2,
  particleDriftMultiplier: 1.0,

  // Heartbeat: VISUAL-DESIGN-SPEC.md Section 5.2
  heartbeatDurationMs: 7000,
  heartbeatAnomalyDurationMs: 7000,

  // Breathing: VISUAL-DESIGN-SPEC.md Section 5.3
  breatheDurationMs: 5000,
  breatheIntensity: 1.0,

  // Grid pulse: VISUAL-DESIGN-SPEC.md Section 5.4
  gridPulseDurationMs: 12000,

  // Film grain: VISUAL-DESIGN-SPEC.md Section 5.6
  grainOpacity: 0.035,

  // Beacon glow: WS-2.7
  beaconAnomalyGlowMultiplier: 1.0,
  beaconHealthyGlowMultiplier: 1.0,

  // Morph timing: WS-2.1 (AD-4)
  morphFocusingMs: 300,
  morphMorphingMs: 200,
  morphUnfurlingMs: 400,
} as const

// ============================================================================
// Modulation Matrix
// ============================================================================

/**
 * The 6-cell modulation matrix: AttentionState (2) x PerformanceLevel (3).
 *
 * Design rationale for each cell:
 *
 * CALM + FULL:
 *   Baseline. Full WS-1.6 spec. The "living instrument" at its best.
 *
 * CALM + REDUCED:
 *   Maintain aesthetic feel but reduce GPU load. Fewer particles,
 *   slower grid pulse, slightly dimmer grain. Morph timing unchanged
 *   (visual quality > speed for non-urgent navigation).
 *
 * CALM + MINIMAL:
 *   Static mode. No particles, no grid pulse, minimal grain.
 *   Heartbeat and breathing show static values. The Launch still
 *   looks styled but does not animate. Morph transitions are instant.
 *
 * TIGHTEN + FULL:
 *   Anomaly detected on a capable machine. Suppress ambient noise
 *   aggressively: few particles, no grid pulse, hub glow holds steady.
 *   Amplify anomaly signals: faster heartbeat for DOWN/DEGRADED apps,
 *   brighter beacon glow on anomalous districts, dimmer on healthy ones.
 *   Morph transitions accelerate to convey urgency.
 *
 * TIGHTEN + REDUCED:
 *   Anomaly + constrained hardware. Even fewer particles, simplified
 *   glows. Morph timing further reduced.
 *
 * TIGHTEN + MINIMAL:
 *   Anomaly + severely constrained. Zero particles, instant morphs,
 *   static effects. Only beacon glow differentiation remains as the
 *   sole ambient anomaly signal (and it is static, not animated).
 */
const MODULATION_MATRIX: Record<AttentionState, Record<PerformanceLevel, EffectConfig>> = {
  calm: {
    full: {
      ...BASELINE,
    },
    reduced: {
      particleCount: 10,
      particleOpacityMin: 0.04,
      particleOpacityMax: 0.12,
      particleDriftMultiplier: 0.7,
      heartbeatDurationMs: 7000,
      heartbeatAnomalyDurationMs: 7000,
      breatheDurationMs: 5000,
      breatheIntensity: 0.8,
      gridPulseDurationMs: 16000,
      grainOpacity: 0.025,
      beaconAnomalyGlowMultiplier: 1.0,
      beaconHealthyGlowMultiplier: 1.0,
      morphFocusingMs: 300,
      morphMorphingMs: 200,
      morphUnfurlingMs: 400,
    },
    minimal: {
      particleCount: 0,
      particleOpacityMin: 0,
      particleOpacityMax: 0,
      particleDriftMultiplier: 0,
      heartbeatDurationMs: 0, // Static bar
      heartbeatAnomalyDurationMs: 0,
      breatheDurationMs: 0, // Static min glow
      breatheIntensity: 0,
      gridPulseDurationMs: 0, // Disabled
      grainOpacity: 0.015,
      beaconAnomalyGlowMultiplier: 1.0,
      beaconHealthyGlowMultiplier: 1.0,
      morphFocusingMs: 0, // Instant
      morphMorphingMs: 0,
      morphUnfurlingMs: 0,
    },
  },
  tighten: {
    full: {
      particleCount: 8,
      particleOpacityMin: 0.02,
      particleOpacityMax: 0.08,
      particleDriftMultiplier: 0.5,
      heartbeatDurationMs: 7000, // Healthy apps: normal
      heartbeatAnomalyDurationMs: 4000, // Anomalous apps: faster pulse
      breatheDurationMs: 0, // Hub glow holds at minimum
      breatheIntensity: 0,
      gridPulseDurationMs: 0, // Disabled during anomaly
      grainOpacity: 0.025,
      beaconAnomalyGlowMultiplier: 1.5, // Amplify anomalous beacons
      beaconHealthyGlowMultiplier: 0.5, // Dim healthy beacons
      morphFocusingMs: 200, // Faster morph = urgency
      morphMorphingMs: 150,
      morphUnfurlingMs: 300,
    },
    reduced: {
      particleCount: 4,
      particleOpacityMin: 0.02,
      particleOpacityMax: 0.06,
      particleDriftMultiplier: 0.3,
      heartbeatDurationMs: 7000,
      heartbeatAnomalyDurationMs: 4000,
      breatheDurationMs: 0,
      breatheIntensity: 0,
      gridPulseDurationMs: 0,
      grainOpacity: 0.015,
      beaconAnomalyGlowMultiplier: 1.2,
      beaconHealthyGlowMultiplier: 0.3,
      morphFocusingMs: 150,
      morphMorphingMs: 100,
      morphUnfurlingMs: 200,
    },
    minimal: {
      particleCount: 0,
      particleOpacityMin: 0,
      particleOpacityMax: 0,
      particleDriftMultiplier: 0,
      heartbeatDurationMs: 0,
      heartbeatAnomalyDurationMs: 0,
      breatheDurationMs: 0,
      breatheIntensity: 0,
      gridPulseDurationMs: 0,
      grainOpacity: 0,
      beaconAnomalyGlowMultiplier: 1.0, // Static, no amplification
      beaconHealthyGlowMultiplier: 1.0,
      morphFocusingMs: 0,
      morphMorphingMs: 0,
      morphUnfurlingMs: 0,
    },
  },
}

// ============================================================================
// Resolution Functions
// ============================================================================

/**
 * Resolve the EffectConfig for the current attention state and performance level.
 *
 * This is a pure function -- no side effects. Deterministic: same inputs
 * always produce the same output.
 *
 * @param attentionState - Current attention state (after hysteresis).
 * @param performanceLevel - Current client performance classification.
 * @returns Complete EffectConfig with all modulated values.
 */
export function resolveEffectConfig(
  attentionState: AttentionState,
  performanceLevel: PerformanceLevel,
): EffectConfig {
  return MODULATION_MATRIX[attentionState][performanceLevel]
}

/**
 * Resolve the EffectConfig for prefers-reduced-motion mode.
 *
 * When reduced motion is active, all animations are disabled regardless
 * of attention state. The information value of attention state is still
 * available (next-best-actions are still computed), but visual modulation
 * resolves to the minimal-performance static config.
 *
 * Beacon glow multipliers ARE preserved because they are static (not
 * animated) -- they change the glow intensity, not the glow animation.
 * This ensures anomalous districts are still visually distinguishable
 * even with reduced motion.
 *
 * @param attentionState - Current attention state (for beacon multipliers).
 * @returns EffectConfig with all animations disabled, beacon glow preserved.
 */
export function resolveReducedMotionConfig(attentionState: AttentionState): EffectConfig {
  const base = MODULATION_MATRIX[attentionState].minimal
  return {
    ...base,
    // Preserve beacon glow differentiation (static, not animated)
    beaconAnomalyGlowMultiplier: attentionState === 'tighten' ? 1.3 : 1.0,
    beaconHealthyGlowMultiplier: attentionState === 'tighten' ? 0.6 : 1.0,
  }
}

/**
 * Export BASELINE for testing and reference.
 */
export { BASELINE as EFFECT_BASELINE }
