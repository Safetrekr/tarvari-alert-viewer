/**
 * Attention Choreography type definitions.
 *
 * Defines the vocabulary for the rule-based attention system that modulates
 * ambient visual effects based on system health state and client performance.
 *
 * Two semantic attention modes (calm/tighten) combined with three performance
 * levels (full/reduced/minimal) produce a 6-cell modulation matrix. Each cell
 * maps to a concrete EffectConfig that drives every modulated visual parameter
 * in the Launch.
 *
 * @module attention-types
 * @see WS-3.7 Section 4.2
 * @see combined-recommendations.md Phase 3 WS-3.7
 * @see VISUAL-DESIGN-SPEC.md Section 5 (Living Details)
 */

import type { AppIdentifier, HealthState } from '@/lib/interfaces/types'

// ============================================================================
// Attention State
// ============================================================================

/**
 * The two semantic attention modes.
 *
 * - 'calm': System is healthy. Full ambient effects. The "living instrument" aesthetic.
 * - 'tighten': Anomaly detected. Suppress ambient noise, amplify anomaly signals.
 *
 * This is a SEMANTIC state, not a performance state.
 * Performance is handled separately by PerformanceLevel.
 */
export type AttentionState = 'calm' | 'tighten'

// ============================================================================
// Performance Level
// ============================================================================

/**
 * Client-side performance classification based on frame-rate monitoring.
 *
 * - 'full': >= 55 fps average. All effects enabled at full fidelity.
 * - 'reduced': 30-54 fps average. Particle count reduced, grid pulse slowed.
 * - 'minimal': < 30 fps or navigator.hardwareConcurrency <= 2. Particles off, animations static.
 */
export type PerformanceLevel = 'full' | 'reduced' | 'minimal'

// ============================================================================
// Effect Configuration
// ============================================================================

/**
 * Concrete effect parameters computed from AttentionState x PerformanceLevel.
 *
 * Every modulated visual parameter in the Launch is represented here.
 * Components consume these values via the attention store or CSS custom properties.
 * All values are deterministic -- given the same inputs, the same config is produced.
 */
export interface EffectConfig {
  // --- Particles (Canvas, WS-1.6 ParticleField) ---
  /** Maximum active particle count. 0 = ParticleField renders nothing. */
  readonly particleCount: number
  /** Minimum particle opacity. */
  readonly particleOpacityMin: number
  /** Maximum particle opacity. */
  readonly particleOpacityMax: number
  /** Drift speed multiplier relative to baseline (1.0 = normal). */
  readonly particleDriftMultiplier: number

  // --- Heartbeat (CSS, WS-1.6 HeartbeatPulse) ---
  /**
   * Heartbeat cycle duration in ms for healthy apps.
   * 0 = static bar (no animation).
   */
  readonly heartbeatDurationMs: number
  /**
   * Heartbeat cycle duration in ms for anomalous apps.
   * Only applied when AttentionState is 'tighten' and the app is DEGRADED/DOWN.
   * 0 = static bar.
   */
  readonly heartbeatAnomalyDurationMs: number

  // --- Glow Breathing (CSS, WS-1.6 GlowBreathing) ---
  /**
   * Breathing glow cycle duration in ms.
   * 0 = hold at minimum glow (no animation).
   */
  readonly breatheDurationMs: number
  /**
   * Glow intensity multiplier for the breathing animation.
   * 1.0 = full spec range. 0.0 = min glow only. Values > 1.0 amplify.
   */
  readonly breatheIntensity: number

  // --- Grid Pulse (CSS, WS-1.6 GridPulse) ---
  /**
   * Grid pulse cycle duration in ms.
   * 0 = grid pulse disabled (component returns null).
   */
  readonly gridPulseDurationMs: number

  // --- Film Grain (CSS, WS-1.6 FilmGrain) ---
  /** Film grain overlay opacity. 0 = invisible. */
  readonly grainOpacity: number

  // --- Beacon Glow (WS-2.7 DistrictBeacon) ---
  /**
   * Glow multiplier for beacons of anomalous districts (DEGRADED/DOWN).
   * 1.0 = normal. > 1.0 = amplified (draws attention).
   */
  readonly beaconAnomalyGlowMultiplier: number
  /**
   * Glow multiplier for beacons of healthy districts during tighten state.
   * < 1.0 = dimmed (reduces visual noise to let anomalies stand out).
   * 1.0 = normal (used in calm state).
   */
  readonly beaconHealthyGlowMultiplier: number

  // --- Morph Timing (WS-2.1 useMorphChoreography) ---
  /** Override for morph focusing phase duration in ms. */
  readonly morphFocusingMs: number
  /** Override for morph morphing phase duration in ms. */
  readonly morphMorphingMs: number
  /** Override for morph unfurling phase duration in ms. */
  readonly morphUnfurlingMs: number
}

// ============================================================================
// Next Best Actions
// ============================================================================

/**
 * A suggested action surfaced during tighten state.
 *
 * Computed from the telemetry snapshot by examining which apps have
 * active alerts, DOWN status, or degraded health. Presented as
 * clickable chips in the HUD.
 */
export interface NextBestAction {
  /** Unique key for React rendering. Format: `nba-{appId}-{action}`. */
  readonly id: string
  /** Human-readable label. e.g., "Agent Builder -- 3 alerts" */
  readonly label: string
  /** Target district for navigation. */
  readonly districtId: AppIdentifier
  /** Action type. 'navigate' = fly to district. */
  readonly action: 'navigate'
  /** Priority rank. 0 = highest urgency. Used for ordering. */
  readonly priority: number
  /** Reason for the suggestion. e.g., "3 active alerts", "Service is DOWN" */
  readonly reason: string
  /** Health state of the target app (for badge coloring). */
  readonly health: HealthState
}

// ============================================================================
// Hysteresis Configuration
// ============================================================================

/**
 * Hysteresis configuration for attention state transitions.
 *
 * Prevents visual mode flicker from transient telemetry spikes.
 * Once in 'tighten', the system requires N consecutive 'calm'-eligible
 * snapshots before transitioning back to 'calm'.
 */
export interface AttentionHysteresisConfig {
  /** Number of consecutive calm-eligible snapshots before exiting tighten. */
  readonly calmThreshold: number
  /** Duration in ms of the visual transition between attention states. */
  readonly transitionDurationMs: number
}

export const DEFAULT_ATTENTION_HYSTERESIS: Readonly<AttentionHysteresisConfig> = {
  calmThreshold: 3,
  transitionDurationMs: 300,
} as const

// ============================================================================
// Attention Snapshot (internal orchestration state)
// ============================================================================

/**
 * Internal state tracked by the attention choreography system.
 * Not exposed to consumers -- they read the resolved EffectConfig.
 */
export interface AttentionSnapshot {
  /** Current attention state (after hysteresis). */
  readonly attentionState: AttentionState
  /** Current performance level. */
  readonly performanceLevel: PerformanceLevel
  /** Consecutive calm-eligible snapshot count (for hysteresis). */
  readonly consecutiveCalmCount: number
  /** Set of currently anomalous app identifiers. */
  readonly anomalousApps: ReadonlySet<AppIdentifier>
}
