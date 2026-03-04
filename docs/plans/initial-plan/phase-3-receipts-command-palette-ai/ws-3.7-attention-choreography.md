# WS-3.7: Attention Choreography

> **Workstream ID:** WS-3.7
> **Phase:** 3 -- Receipts + Command Palette + AI
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.5 (telemetry aggregator, SystemSnapshot, districts store), WS-1.6 (ambient effects layer), WS-1.7 (core interfaces, HealthState, SystemSnapshot type), WS-2.1 (morph choreography, MorphTimingConfig), WS-2.7 (constellation view, beacon glow)
> **Blocks:** WS-4.4 (Visual Polish -- attention rules inform final tuning)
> **Resolves:** OQ-1.6.4 (particle density adjustment at extreme zoom levels)

---

## 1. Objective

Deliver a deterministic, rule-based attention choreography system that modulates all ambient visual effects across Tarva Launch based on two inputs: **system health state** (derived from the telemetry SystemSnapshot) and **client performance level** (derived from frame-rate monitoring). The system operates in two primary attention modes -- **calm** (healthy: full ambient effects, the "living instrument" aesthetic) and **tighten** (anomaly: suppress ambient noise, amplify anomaly signals, surface next-best-actions) -- with a third implicit mode for performance-constrained clients that progressively reduces visual complexity to maintain 60fps.

This is the system that makes the Launch feel _aware_. When everything is healthy, the interface breathes and drifts in the calm, cinematic rhythm established by WS-1.6. When something breaks, the interface tightens: ambient motion dampens, the anomalous district's beacon and capsule intensify, morph transitions accelerate to convey urgency, and the HUD surfaces suggested actions. The transition between modes is smooth and hysteresis-protected to prevent visual flicker from transient telemetry spikes.

**Success looks like:** A user watching the Launch Atrium during normal operation sees the full WS-1.6 ambient layer: 18 drifting particles, breathing hub glow, pulsing health bars, 12-second grid wave. An alert fires from Agent Builder. Over 300ms, the ambient effects quieten -- particle count drops, grid pulse stops, the hub glow holds steady at its dimmest value. Agent Builder's capsule health bar shifts to a faster pulse cadence. In the constellation view (Z0), the Agent Builder beacon glow intensifies while healthy districts dim. A small action chip appears near the breadcrumb: "Agent Builder -- 2 alerts". The user navigates to Agent Builder with a faster-than-usual morph transition. After acknowledging the alerts and the system stabilizes for 3 consecutive polling cycles, the ambient layer gradually returns to its calm rhythm.

**Why this workstream matters:** Without attention choreography, the Launch is a static visual treatment that looks the same whether the system is healthy or on fire. The ambient effects from WS-1.6 are beautiful but indiscriminate -- they provide "alive" but not "aware." This workstream is the bridge between telemetry data (WS-1.5) and visual communication, turning the ambient layer into a functional information channel.

**Traceability:** combined-recommendations.md Phase 3 WS-3.7 ("Rule-based ambient motion throttling"), AD-3 (Three-Tier Animation Architecture), AD-5 (Telemetry Polling), VISUAL-DESIGN-SPEC.md Section 5 (Living Details), Gap #3 (Status Model).

---

## 2. Scope

### In Scope

1. **Attention state determination** -- Pure rule engine that maps `SystemSnapshot` (from WS-1.5/WS-1.7) to an `AttentionState` of `'calm'` or `'tighten'`, with hysteresis to prevent mode flicker from transient anomalies.

2. **Performance level monitoring** -- A `requestAnimationFrame`-based frame-rate monitor that classifies client performance into `'full'` (>=55fps), `'reduced'` (30-54fps), or `'minimal'` (<30fps), enabling progressive visual degradation on constrained hardware.

3. **Effect modulation table** -- A deterministic matrix that combines `AttentionState` x `PerformanceLevel` into a concrete `EffectConfig` object specifying exact values for every modulated parameter (particle count, opacity ranges, animation durations, glow multipliers, morph timing overrides).

4. **CSS custom property bridge** -- Synchronization of computed `EffectConfig` values to `document.documentElement` as `--attention-*` CSS custom properties, enabling CSS-driven ambient effects (HeartbeatPulse, GlowBreathing, GridPulse, FilmGrain) to consume attention-adjusted values without React re-renders.

5. **ParticleField modulation** -- Integration with the Canvas-based ParticleField (WS-1.6) to dynamically adjust particle count, opacity range, and drift speed based on the current EffectConfig.

6. **Morph timing modulation** -- Override of `MorphTimingConfig` (WS-2.1) during tighten state to accelerate morph transitions, conveying urgency when navigating to an anomalous district.

7. **Beacon glow modulation** -- Adjustment of constellation view beacon glow intensity (WS-2.7) to amplify anomalous districts and dim healthy ones during tighten state.

8. **Next-best-actions computation** -- Derivation of prioritized action suggestions from the SystemSnapshot during tighten state (e.g., "View Agent Builder Status -- 3 alerts"), surfaced in a small HUD overlay.

9. **NextBestActions HUD component** -- A compact, non-intrusive chip list rendered near the breadcrumb area that displays suggested actions during tighten state and provides one-click navigation to the relevant district.

10. **`prefers-reduced-motion` integration** -- When reduced motion is active, the attention choreography system still computes attention state and next-best-actions (information value is preserved) but all effect modulation resolves to static values (no animation changes, no transitions between modes).

11. **Zustand attention store** -- A dedicated store slice holding the current `AttentionState`, `PerformanceLevel`, computed `EffectConfig`, and `NextBestAction[]`.

12. **TypeScript types** for all attention-related state, configuration, effect parameters, and component props.

### Out of Scope

- AI-driven anomaly detection (this is a rule-based system; AI features are WS-3.4/WS-3.6)
- Telemetry data fetching or polling (WS-1.5 -- consumed, not created)
- Ambient effect component internals (WS-1.6 -- consumed, modulated via props and CSS custom properties)
- Morph state machine internals (WS-2.1 -- consumed, timing overridden via config)
- Beacon component internals (WS-2.7 -- consumed, glow modulated via props)
- Command palette integration (WS-3.3 -- next-best-actions could feed into command palette suggestions in a future workstream)
- Sound or haptic feedback (deferred to WS-4.4)
- Receipt generation for attention state changes (WS-3.1 could subscribe to state transitions)

---

## 3. Input Dependencies

| Dependency               | Source        | What It Provides                                                                                                                                                                             | Blocking?          |
| ------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| SystemSnapshot type      | WS-1.7        | `SystemSnapshot` with `apps: Record<AppIdentifier, AppState>`, `globalMetrics: GlobalMetrics` (including `systemPulse: HealthState`, `alertCount`, `activeWork`)                             | Yes                |
| Districts store          | WS-1.5        | `useDistrictsStore()` with current telemetry state, polled every 5-30s depending on adaptive config                                                                                          | Yes                |
| HealthState type         | WS-1.7        | `'OPERATIONAL' \| 'DEGRADED' \| 'DOWN' \| 'OFFLINE' \| 'UNKNOWN'`                                                                                                                            | Yes                |
| AppIdentifier type       | WS-1.7        | `'agent-builder' \| 'tarva-chat' \| 'project-room' \| 'tarva-core' \| 'tarva-erp' \| 'tarva-code'`                                                                                           | Yes                |
| ParticleField component  | WS-1.6        | Canvas-based particle renderer. Currently creates 18 particles on mount. Requires new `effectConfig` prop or store subscription for dynamic modulation.                                      | Yes (modification) |
| HeartbeatPulse component | WS-1.6        | CSS-driven health bar animation. Reads `--duration-ambient-heart` CSS custom property. Attention system overrides this property.                                                             | Soft               |
| GlowBreathing component  | WS-1.6        | CSS-driven glow oscillation. Reads `--duration-ambient-breathe` CSS custom property. Attention system overrides this property.                                                               | Soft               |
| GridPulse component      | WS-1.6        | CSS-driven radial wave. Reads `--duration-ambient-grid` CSS custom property. Attention system can set duration to 0 to disable.                                                              | Soft               |
| FilmGrain component      | WS-1.6        | Static SVG noise overlay. Reads `--opacity-ambient-grain` CSS custom property. Attention system adjusts opacity.                                                                             | Soft               |
| MorphTimingConfig type   | WS-2.1        | `{ focusing: number; morphing: number; unfurling: number }`. useMorphChoreography reads timing config. Attention system provides override.                                                   | Yes (modification) |
| DistrictBeacon component | WS-2.7        | Beacon dot with `box-shadow` glow. Requires new `glowMultiplier` prop for attention modulation.                                                                                              | Yes (modification) |
| usePanPause hook         | WS-1.1/WS-1.6 | `{ paused: boolean }` -- attention choreography does NOT pause during pan (the attention state is semantic, not gesture-driven), but effect components still respect pan-pause independently | Consumed           |
| useReducedMotion hook    | @tarva/ui     | `boolean` indicating prefers-reduced-motion. Attention system uses this to resolve static configs.                                                                                           | Available          |
| Design tokens            | WS-0.2        | All `--duration-ambient-*`, `--opacity-ambient-*`, `--glow-*` tokens from VISUAL-DESIGN-SPEC.md Section 6.1                                                                                  | Soft               |
| `motion/react` v12+      | npm           | AnimatePresence for NextBestActions enter/exit animations                                                                                                                                    | Available          |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  stores/
    attention.store.ts                    # NEW: Zustand store for attention state
  hooks/
    use-attention-choreography.ts         # NEW: Central orchestration hook
    use-performance-monitor.ts            # NEW: Frame-rate monitoring hook
    use-effect-config.ts                  # NEW: Combined config consumer hook
  lib/
    attention-rules.ts                    # NEW: Pure rule functions
    effect-modulation.ts                  # NEW: Effect config computation
  components/
    hud/
      next-best-actions.tsx               # NEW: Action suggestion chip list
      next-best-actions.test.tsx          # NEW: Tests
    ambient/
      ParticleField.tsx                   # MODIFY: Add effectConfig consumption
  styles/
    attention-choreography.css            # NEW: CSS custom property defaults + transitions
```

### 4.2 Type Definitions

**File:** `src/lib/interfaces/types.ts` (additions to existing types from WS-1.7)

```ts
// ============================================================
// ATTENTION CHOREOGRAPHY TYPES (WS-3.7)
// ============================================================

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

/**
 * Client-side performance classification based on frame-rate monitoring.
 *
 * - 'full': >= 55 fps average. All effects enabled at full fidelity.
 * - 'reduced': 30-54 fps average. Particle count reduced, grid pulse slowed.
 * - 'minimal': < 30 fps or navigator.hardwareConcurrency <= 2. Particles off, animations static.
 */
export type PerformanceLevel = 'full' | 'reduced' | 'minimal'

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
  particleCount: number
  /** Minimum particle opacity. */
  particleOpacityMin: number
  /** Maximum particle opacity. */
  particleOpacityMax: number
  /** Drift speed multiplier relative to baseline (1.0 = normal). */
  particleDriftMultiplier: number

  // --- Heartbeat (CSS, WS-1.6 HeartbeatPulse) ---
  /**
   * Heartbeat cycle duration in ms for healthy apps.
   * 0 = static bar (no animation).
   */
  heartbeatDurationMs: number
  /**
   * Heartbeat cycle duration in ms for anomalous apps.
   * Only applied when AttentionState is 'tighten' and the app is DEGRADED/DOWN.
   * 0 = static bar.
   */
  heartbeatAnomalyDurationMs: number

  // --- Glow Breathing (CSS, WS-1.6 GlowBreathing) ---
  /**
   * Breathing glow cycle duration in ms.
   * 0 = hold at minimum glow (no animation).
   */
  breatheDurationMs: number
  /**
   * Glow intensity multiplier for the breathing animation.
   * 1.0 = full spec range. 0.0 = min glow only. Values > 1.0 amplify.
   */
  breatheIntensity: number

  // --- Grid Pulse (CSS, WS-1.6 GridPulse) ---
  /**
   * Grid pulse cycle duration in ms.
   * 0 = grid pulse disabled (component returns null).
   */
  gridPulseDurationMs: number

  // --- Film Grain (CSS, WS-1.6 FilmGrain) ---
  /** Film grain overlay opacity. 0 = invisible. */
  grainOpacity: number

  // --- Beacon Glow (WS-2.7 DistrictBeacon) ---
  /**
   * Glow multiplier for beacons of anomalous districts (DEGRADED/DOWN).
   * 1.0 = normal. > 1.0 = amplified (draws attention).
   */
  beaconAnomalyGlowMultiplier: number
  /**
   * Glow multiplier for beacons of healthy districts during tighten state.
   * < 1.0 = dimmed (reduces visual noise to let anomalies stand out).
   * 1.0 = normal (used in calm state).
   */
  beaconHealthyGlowMultiplier: number

  // --- Morph Timing (WS-2.1 useMorphChoreography) ---
  /** Override for morph focusing phase duration in ms. */
  morphFocusingMs: number
  /** Override for morph morphing phase duration in ms. */
  morphMorphingMs: number
  /** Override for morph unfurling phase duration in ms. */
  morphUnfurlingMs: number
}

/**
 * A suggested action surfaced during tighten state.
 *
 * Computed from the SystemSnapshot by examining which apps have
 * active alerts, DOWN status, or degraded health. Presented as
 * clickable chips in the HUD.
 */
export interface NextBestAction {
  /** Unique key for React rendering. Format: `nba-{appId}-{action}`. */
  id: string
  /** Human-readable label. e.g., "Agent Builder -- 3 alerts" */
  label: string
  /** Target district for navigation. */
  districtId: AppIdentifier
  /** Action type. 'navigate' = fly to district. 'acknowledge' = future: clear alerts. */
  action: 'navigate'
  /** Priority rank. 0 = highest urgency. Used for ordering. */
  priority: number
  /** Reason for the suggestion. e.g., "3 active alerts", "Service is DOWN" */
  reason: string
  /** Health state of the target app (for badge coloring). */
  health: HealthState
}

/**
 * Hysteresis configuration for attention state transitions.
 *
 * Prevents visual mode flicker from transient telemetry spikes.
 * Once in 'tighten', the system requires N consecutive 'calm'-eligible
 * snapshots before transitioning back to 'calm'.
 */
export interface AttentionHysteresisConfig {
  /** Number of consecutive calm-eligible snapshots before exiting tighten. */
  calmThreshold: number
  /** Duration in ms of the visual transition between attention states. */
  transitionDurationMs: number
}

export const DEFAULT_ATTENTION_HYSTERESIS: Readonly<AttentionHysteresisConfig> = {
  calmThreshold: 3,
  transitionDurationMs: 300,
} as const
```

### 4.3 Pure Rule Functions

**File:** `src/lib/attention-rules.ts`

Pure functions with no side effects. Fully testable without mocking stores or DOM.

```ts
import type {
  AppIdentifier,
  AppState,
  AttentionState,
  HealthState,
  NextBestAction,
  SystemSnapshot,
} from '@/lib/interfaces/types'

// ============================================================
// ATTENTION STATE DETERMINATION
// ============================================================

/**
 * Health states that trigger tighten mode.
 * OFFLINE and UNKNOWN are excluded -- they represent intentional
 * absence or no-data, not active problems requiring attention.
 */
const ANOMALY_STATES: ReadonlySet<HealthState> = new Set(['DEGRADED', 'DOWN'])

/**
 * Determine the raw attention state from a SystemSnapshot.
 *
 * Rules (evaluated in priority order):
 * 1. If any app has health === 'DOWN', return 'tighten'.
 * 2. If any app has health === 'DEGRADED', return 'tighten'.
 * 3. If globalMetrics.alertCount > 0, return 'tighten'.
 * 4. Otherwise, return 'calm'.
 *
 * This function does NOT apply hysteresis. The caller (the attention
 * store) manages hysteresis state across polling cycles.
 *
 * @param snapshot - Current system telemetry snapshot.
 * @returns Raw attention state before hysteresis.
 */
export function computeRawAttentionState(snapshot: SystemSnapshot): AttentionState {
  // Check for anomalous app health
  for (const app of Object.values(snapshot.apps)) {
    if (ANOMALY_STATES.has(app.health)) {
      return 'tighten'
    }
  }

  // Check for active alerts
  if (snapshot.globalMetrics.alertCount > 0) {
    return 'tighten'
  }

  return 'calm'
}

/**
 * Apply hysteresis to prevent mode flicker.
 *
 * When transitioning from 'tighten' to 'calm', the raw state must
 * be 'calm' for `calmThreshold` consecutive evaluations.
 * Transitioning from 'calm' to 'tighten' is immediate (no delay --
 * anomalies should be surfaced instantly).
 *
 * @param rawState - The freshly computed raw attention state.
 * @param currentState - The current (hysteresis-applied) attention state.
 * @param consecutiveCalmCount - Number of consecutive calm-eligible snapshots.
 * @param calmThreshold - Required consecutive calm snapshots to exit tighten.
 * @returns Tuple of [new attention state, new consecutive calm count].
 */
export function applyHysteresis(
  rawState: AttentionState,
  currentState: AttentionState,
  consecutiveCalmCount: number,
  calmThreshold: number
): [AttentionState, number] {
  // Calm -> Tighten: immediate
  if (rawState === 'tighten') {
    return ['tighten', 0]
  }

  // Already calm + raw calm: stay calm
  if (currentState === 'calm') {
    return ['calm', 0]
  }

  // Tighten + raw calm: increment counter, check threshold
  const newCount = consecutiveCalmCount + 1
  if (newCount >= calmThreshold) {
    return ['calm', 0]
  }
  return ['tighten', newCount]
}

// ============================================================
// NEXT-BEST-ACTIONS COMPUTATION
// ============================================================

/**
 * Priority weights for health states. Lower number = higher urgency.
 */
const HEALTH_PRIORITY: Record<HealthState, number> = {
  DOWN: 0,
  DEGRADED: 1,
  UNKNOWN: 2,
  OFFLINE: 3,
  OPERATIONAL: 4,
}

/**
 * Compute next-best-actions from the current system state.
 *
 * Only produces actions when the attention state is 'tighten'.
 * Returns an empty array when calm.
 *
 * Actions are generated for:
 * 1. Apps with health === 'DOWN' (highest priority)
 * 2. Apps with health === 'DEGRADED'
 * 3. Apps with alertCount > 0 (even if health is OPERATIONAL)
 *
 * Maximum 3 actions returned, sorted by priority.
 *
 * @param snapshot - Current system telemetry snapshot.
 * @param attentionState - Current attention state (after hysteresis).
 * @returns Prioritized action suggestions.
 */
export function computeNextBestActions(
  snapshot: SystemSnapshot,
  attentionState: AttentionState
): NextBestAction[] {
  if (attentionState === 'calm') {
    return []
  }

  const actions: NextBestAction[] = []

  for (const [id, app] of Object.entries(snapshot.apps)) {
    const appId = id as AppIdentifier

    // Skip offline/unknown -- they are not actionable anomalies
    if (app.health === 'OFFLINE' || app.health === 'UNKNOWN') {
      continue
    }

    // Generate action for DOWN apps
    if (app.health === 'DOWN') {
      actions.push({
        id: `nba-${appId}-navigate`,
        label: `${app.displayName} -- DOWN`,
        districtId: appId,
        action: 'navigate',
        priority: HEALTH_PRIORITY.DOWN,
        reason: 'Service is not responding',
        health: app.health,
      })
      continue
    }

    // Generate action for DEGRADED apps
    if (app.health === 'DEGRADED') {
      actions.push({
        id: `nba-${appId}-navigate`,
        label: `${app.displayName} -- degraded`,
        districtId: appId,
        action: 'navigate',
        priority: HEALTH_PRIORITY.DEGRADED,
        reason: 'Running with reduced capability',
        health: app.health,
      })
      continue
    }

    // Generate action for apps with alerts (but otherwise healthy)
    if (app.alertCount > 0) {
      actions.push({
        id: `nba-${appId}-navigate`,
        label: `${app.displayName} -- ${app.alertCount} alert${app.alertCount > 1 ? 's' : ''}`,
        districtId: appId,
        action: 'navigate',
        priority: HEALTH_PRIORITY.OPERATIONAL + 0.5, // Slightly lower than DEGRADED
        reason: `${app.alertCount} active alert${app.alertCount > 1 ? 's' : ''}`,
        health: app.health,
      })
    }
  }

  // Sort by priority (lowest number = highest urgency), take top 3
  return actions.sort((a, b) => a.priority - b.priority).slice(0, 3)
}

// ============================================================
// ANOMALOUS APP IDENTIFICATION
// ============================================================

/**
 * Returns the set of AppIdentifiers that are currently anomalous.
 * Used by beacon glow modulation to determine which beacons to amplify.
 *
 * @param snapshot - Current system telemetry snapshot.
 * @returns Set of anomalous app identifiers.
 */
export function getAnomalousApps(snapshot: SystemSnapshot): ReadonlySet<AppIdentifier> {
  const anomalous = new Set<AppIdentifier>()
  for (const [id, app] of Object.entries(snapshot.apps)) {
    if (ANOMALY_STATES.has(app.health) || app.alertCount > 0) {
      anomalous.add(id as AppIdentifier)
    }
  }
  return anomalous
}
```

### 4.4 Effect Modulation Table

**File:** `src/lib/effect-modulation.ts`

The deterministic matrix that maps `(AttentionState, PerformanceLevel)` to concrete `EffectConfig` values. This is the heart of the attention choreography system.

```ts
import type { AttentionState, EffectConfig, PerformanceLevel } from '@/lib/interfaces/types'

// ============================================================
// BASELINE VALUES (from VISUAL-DESIGN-SPEC.md + WS-1.6 + WS-2.1)
// ============================================================

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

// ============================================================
// MODULATION MATRIX
// ============================================================

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
  performanceLevel: PerformanceLevel
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
```

### 4.5 Performance Monitor Hook

**File:** `src/hooks/use-performance-monitor.ts`

Measures frame rate using `requestAnimationFrame` timing. Returns a stable `PerformanceLevel` classification.

```ts
'use client'

import { useEffect, useRef, useState } from 'react'
import type { PerformanceLevel } from '@/lib/interfaces/types'

/**
 * Rolling window size for FPS averaging.
 * 60 frames at 60fps = 1 second of history.
 */
const WINDOW_SIZE = 60

/**
 * FPS thresholds for performance classification.
 * Aligned with common display refresh rates and perceptual thresholds.
 */
const FPS_FULL_THRESHOLD = 55
const FPS_REDUCED_THRESHOLD = 30

/**
 * Minimum re-evaluation interval in ms.
 * Prevents rapid performance level oscillation.
 */
const EVALUATION_INTERVAL_MS = 2000

/**
 * If navigator.hardwareConcurrency is at or below this value,
 * force 'minimal' regardless of measured FPS. Low-core devices
 * should not attempt full ambient effects.
 */
const MIN_CORE_COUNT = 2

/**
 * Monitor client frame rate and classify performance level.
 *
 * Uses a rolling window of requestAnimationFrame timestamps to
 * compute average FPS. Re-evaluates the performance level every
 * 2 seconds to prevent rapid oscillation.
 *
 * Special cases:
 * - navigator.hardwareConcurrency <= 2: forces 'minimal'
 * - Server-side rendering: returns 'full' (no measurement possible)
 * - prefers-reduced-motion: caller should bypass this hook entirely
 *
 * @returns Current performance level classification.
 */
export function usePerformanceMonitor(): PerformanceLevel {
  const [level, setLevel] = useState<PerformanceLevel>('full')
  const frameTimes = useRef<number[]>([])
  const lastEvaluation = useRef<number>(0)
  const rafId = useRef<number>(0)

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return

    // Hardware check: low-core devices go straight to minimal
    if (
      typeof navigator !== 'undefined' &&
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= MIN_CORE_COUNT
    ) {
      setLevel('minimal')
      return
    }

    let prevTimestamp = performance.now()

    function measure(timestamp: number) {
      const delta = timestamp - prevTimestamp
      prevTimestamp = timestamp

      // Record frame time (skip first frame which can have a large delta)
      if (delta > 0 && delta < 200) {
        frameTimes.current.push(delta)
        if (frameTimes.current.length > WINDOW_SIZE) {
          frameTimes.current.shift()
        }
      }

      // Re-evaluate at the configured interval
      const now = performance.now()
      if (
        now - lastEvaluation.current >= EVALUATION_INTERVAL_MS &&
        frameTimes.current.length >= WINDOW_SIZE / 2
      ) {
        lastEvaluation.current = now

        const avgDelta =
          frameTimes.current.reduce((sum, t) => sum + t, 0) / frameTimes.current.length
        const avgFps = 1000 / avgDelta

        let newLevel: PerformanceLevel = 'full'
        if (avgFps < FPS_REDUCED_THRESHOLD) {
          newLevel = 'minimal'
        } else if (avgFps < FPS_FULL_THRESHOLD) {
          newLevel = 'reduced'
        }

        setLevel((prev) => {
          // Only update if changed (prevents unnecessary re-renders)
          return prev === newLevel ? prev : newLevel
        })
      }

      rafId.current = requestAnimationFrame(measure)
    }

    rafId.current = requestAnimationFrame(measure)

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return level
}
```

### 4.6 Attention Store

**File:** `src/stores/attention.store.ts`

Zustand store that holds the computed attention state and effect config. Syncs CSS custom properties to the document root for CSS-driven effects.

```ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  AttentionState,
  EffectConfig,
  NextBestAction,
  PerformanceLevel,
} from '@/lib/interfaces/types'
import { EFFECT_BASELINE } from '@/lib/effect-modulation'

// ============================================================
// STATE
// ============================================================

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
  anomalousApps: ReadonlySet<string>
}

// ============================================================
// ACTIONS
// ============================================================

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
  setAnomalousApps: (apps: ReadonlySet<string>) => void
}

export type AttentionStore = AttentionStoreState & AttentionStoreActions

// ============================================================
// STORE
// ============================================================

export const useAttentionStore = create<AttentionStore>()(
  subscribeWithSelector((set) => ({
    attentionState: 'calm',
    performanceLevel: 'full',
    effectConfig: { ...EFFECT_BASELINE },
    nextBestActions: [],
    consecutiveCalmCount: 0,
    anomalousApps: new Set(),

    setAttentionState: (attentionState) => set({ attentionState }),
    setPerformanceLevel: (performanceLevel) => set({ performanceLevel }),
    setEffectConfig: (effectConfig) => set({ effectConfig }),
    setNextBestActions: (nextBestActions) => set({ nextBestActions }),
    setConsecutiveCalmCount: (consecutiveCalmCount) => set({ consecutiveCalmCount }),
    setAnomalousApps: (anomalousApps) => set({ anomalousApps }),
  }))
)

// ============================================================
// SELECTORS
// ============================================================

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

// ============================================================
// CSS CUSTOM PROPERTY SYNC
// ============================================================

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
    { fireImmediately: true }
  )
}
```

### 4.7 Central Orchestration Hook

**File:** `src/hooks/use-attention-choreography.ts`

The brain of the attention choreography system. Reads the SystemSnapshot from the districts store, computes attention state with hysteresis, resolves effect config, and publishes to the attention store.

```ts
'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from '@tarva/ui/motion'
import { useDistrictsStore } from '@/stores/districts.store'
import { useAttentionStore, syncAttentionCSSProperties } from '@/stores/attention.store'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import {
  computeRawAttentionState,
  applyHysteresis,
  computeNextBestActions,
  getAnomalousApps,
} from '@/lib/attention-rules'
import { resolveEffectConfig, resolveReducedMotionConfig } from '@/lib/effect-modulation'
import { DEFAULT_ATTENTION_HYSTERESIS } from '@/lib/interfaces/types'
import type { AttentionState, SystemSnapshot } from '@/lib/interfaces/types'

/**
 * Central attention choreography orchestration hook.
 *
 * This hook is the single integration point between telemetry data
 * and visual effect modulation. It should be mounted ONCE, in the
 * hub layout component, alongside other global providers.
 *
 * Responsibilities:
 * 1. Read the current SystemSnapshot from the districts store.
 * 2. Compute raw attention state via rule engine.
 * 3. Apply hysteresis to prevent mode flicker.
 * 4. Determine client performance level.
 * 5. Resolve the complete EffectConfig.
 * 6. Compute next-best-actions.
 * 7. Publish all results to the attention store.
 * 8. Sync CSS custom properties for CSS-driven effects.
 *
 * The hook does NOT directly modify any effect component. It
 * publishes computed state; effect components consume it via
 * the attention store or CSS custom properties.
 *
 * @returns void -- all output goes to the attention store.
 */
export function useAttentionChoreography(): void {
  const reducedMotion = useReducedMotion()
  const performanceLevel = usePerformanceMonitor()

  // Attention store actions
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

  // CSS property sync (runs once on mount)
  const cssUnsub = useRef<(() => void) | null>(null)
  useEffect(() => {
    cssUnsub.current = syncAttentionCSSProperties()
    return () => {
      cssUnsub.current?.()
    }
  }, [])

  // Update performance level in store
  useEffect(() => {
    setPerformanceLevel(performanceLevel)
  }, [performanceLevel, setPerformanceLevel])

  // Subscribe to districts store for snapshot changes.
  // This runs on every telemetry poll cycle (every 5-30s per AD-5).
  useEffect(() => {
    const unsubscribe = useDistrictsStore.subscribe((state) => {
      // Assemble a SystemSnapshot from the districts store.
      // WS-1.5 populates the store; we read the assembled snapshot.
      const snapshot = state.snapshot as SystemSnapshot | null
      if (!snapshot) return

      // Step 1: Compute raw attention state
      const rawState = computeRawAttentionState(snapshot)

      // Step 2: Apply hysteresis
      const [newState, newCount] = applyHysteresis(
        rawState,
        hysteresisRef.current.currentState,
        hysteresisRef.current.consecutiveCalmCount,
        DEFAULT_ATTENTION_HYSTERESIS.calmThreshold
      )

      // Update hysteresis ref
      hysteresisRef.current.currentState = newState
      hysteresisRef.current.consecutiveCalmCount = newCount

      // Step 3: Resolve effect config
      const effectConfig = reducedMotion
        ? resolveReducedMotionConfig(newState)
        : resolveEffectConfig(newState, performanceLevel)

      // Step 4: Compute next-best-actions
      const actions = computeNextBestActions(snapshot, newState)

      // Step 5: Identify anomalous apps
      const anomalous = getAnomalousApps(snapshot)

      // Step 6: Publish to attention store (batched by Zustand)
      setAttentionState(newState)
      setConsecutiveCalmCount(newCount)
      setEffectConfig(effectConfig)
      setNextBestActions(actions)
      setAnomalousApps(anomalous)
    })

    return unsubscribe
  }, [
    reducedMotion,
    performanceLevel,
    setAttentionState,
    setPerformanceLevel,
    setEffectConfig,
    setNextBestActions,
    setConsecutiveCalmCount,
    setAnomalousApps,
  ])
}
```

### 4.8 Effect Config Consumer Hook

**File:** `src/hooks/use-effect-config.ts`

Convenience hook for components that need specific slices of the effect config.

```ts
'use client'

import { useAttentionStore, attentionSelectors } from '@/stores/attention.store'
import type { EffectConfig } from '@/lib/interfaces/types'

/**
 * Read the full EffectConfig from the attention store.
 *
 * Use this when a component needs multiple config values.
 * For specific slices, use the dedicated selector hooks below.
 */
export function useEffectConfig(): EffectConfig {
  return useAttentionStore(attentionSelectors.effectConfig)
}

/**
 * Read particle-specific config for the ParticleField component.
 *
 * Returns a stable object reference (via Zustand selector) that only
 * changes when particle parameters actually change. This prevents
 * unnecessary Canvas re-initialization.
 */
export function useParticleConfig() {
  return useAttentionStore(attentionSelectors.particleConfig)
}

/**
 * Read morph timing override for useMorphChoreography.
 *
 * Returns the attention-adjusted morph timing config. The morph
 * hook should use these values instead of the static MORPH_TIMING
 * constant when attention choreography is active.
 */
export function useMorphTimingOverride() {
  return useAttentionStore(attentionSelectors.morphTiming)
}

/**
 * Read beacon glow modulation config for DistrictBeacon.
 *
 * Returns glow multipliers and the set of anomalous apps.
 * The beacon component uses these to amplify or dim its glow.
 */
export function useBeaconGlowConfig() {
  return useAttentionStore(attentionSelectors.beaconGlow)
}

/**
 * Read the current attention state ('calm' or 'tighten').
 */
export function useAttentionState() {
  return useAttentionStore(attentionSelectors.attentionState)
}

/**
 * Check if the system is currently in tighten mode.
 */
export function useIsTightening(): boolean {
  return useAttentionStore(attentionSelectors.isTightening)
}

/**
 * Read next-best-actions for the HUD component.
 */
export function useNextBestActions() {
  return useAttentionStore(attentionSelectors.nextBestActions)
}
```

### 4.9 CSS Custom Properties and Transitions

**File:** `src/styles/attention-choreography.css`

Defines default CSS custom property values, transition smoothing for attention state changes, and override rules that CSS-driven effects consume.

```css
/* =============================================================
   ATTENTION CHOREOGRAPHY CSS

   CSS custom properties written by the attention store sync.
   CSS-driven ambient effects (HeartbeatPulse, GlowBreathing,
   GridPulse, FilmGrain) read these instead of the static
   design tokens when attention choreography is active.

   Property naming: --attention-{effect}-{parameter}

   These properties are written to document.documentElement.style
   by syncAttentionCSSProperties() in attention.store.ts.
   ============================================================= */

:root {
  /* --- Heartbeat (consumed by HeartbeatPulse) --- */
  --attention-heartbeat-duration: 7000ms;
  --attention-heartbeat-anomaly-duration: 7000ms;

  /* --- Breathing (consumed by GlowBreathing) --- */
  --attention-breathe-duration: 5000ms;
  --attention-breathe-intensity: 1;

  /* --- Grid Pulse (consumed by GridPulse) --- */
  --attention-grid-pulse-duration: 12000ms;

  /* --- Film Grain (consumed by FilmGrain) --- */
  --attention-grain-opacity: 0.035;

  /* --- Transition duration for attention state changes --- */
  --attention-transition-duration: 300ms;
}

/* =============================================================
   EFFECT OVERRIDES

   These rules modify WS-1.6 ambient effects to consume
   attention-adjusted properties instead of static tokens.

   The WS-1.6 components use CSS custom properties in their
   inline styles (e.g., `var(--duration-ambient-heart, 7000ms)`).
   The attention system overrides the underlying properties.
   ============================================================= */

/*
 * HeartbeatPulse: override animation duration.
 *
 * WS-1.6 HeartbeatPulse reads --duration-ambient-heart.
 * When attention choreography is active, we override this
 * with the attention-computed value.
 *
 * For anomaly-specific heartbeat (faster pulse on DOWN/DEGRADED
 * apps), the component should check [data-health="DOWN"] or
 * [data-health="DEGRADED"] to select the anomaly duration.
 */
:root {
  --duration-ambient-heart: var(--attention-heartbeat-duration, 7000ms);
  --duration-ambient-breathe: var(--attention-breathe-duration, 5000ms);
  --duration-ambient-grid: var(--attention-grid-pulse-duration, 12000ms);
  --opacity-ambient-grain: var(--attention-grain-opacity, 0.035);
}

/*
 * Anomaly-specific heartbeat: faster pulse for degraded/down apps.
 * The capsule or its container should have [data-health] set.
 */
[data-health='DEGRADED'] .ambient-heartbeat,
[data-health='DOWN'] .ambient-heartbeat {
  animation-duration: var(--attention-heartbeat-anomaly-duration, 7000ms) !important;
}

/*
 * GlowBreathing: when intensity is 0, hold at minimum glow.
 * The attention store sets --attention-breathe-duration to 0ms
 * during tighten, which the component interprets as "no animation."
 */

/*
 * Smooth transition between attention states.
 * Ambient effects transition their visual properties over 300ms
 * when the attention state changes. This prevents a jarring snap
 * from calm to tighten.
 *
 * Note: This applies to opacity and box-shadow properties that
 * are directly controlled. CSS @keyframes animation changes
 * (e.g., changing animation-duration) take effect at the next
 * animation cycle boundary, which provides natural smoothing.
 */
.ambient-heartbeat,
.ambient-breathe,
.ambient-grid-pulse {
  transition:
    opacity var(--attention-transition-duration, 300ms) var(--ease-default),
    box-shadow var(--attention-transition-duration, 300ms) var(--ease-default);
}

/* =============================================================
   REDUCED MOTION

   When prefers-reduced-motion is active, the attention system
   resolves to static configs. These CSS rules provide an
   additional safety net.
   ============================================================= */

@media (prefers-reduced-motion: reduce) {
  .ambient-heartbeat,
  .ambient-breathe,
  .ambient-grid-pulse {
    animation: none !important;
    transition: none !important;
  }
}
```

### 4.10 NextBestActions HUD Component

**File:** `src/components/hud/next-best-actions.tsx`

A compact chip list that appears during tighten state, showing suggested navigation actions near the breadcrumb area.

```tsx
'use client'

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNextBestActions, useIsTightening } from '@/hooks/use-effect-config'
import { useUIStore } from '@/stores/ui.store'
import type { NextBestAction, HealthState } from '@/lib/interfaces/types'
import { cn } from '@/lib/utils'

// ============================================================
// HEALTH COLOR MAP
// ============================================================

const HEALTH_DOT_COLOR: Record<HealthState, string> = {
  DOWN: 'bg-[var(--color-error)]',
  DEGRADED: 'bg-[var(--color-warning)]',
  OPERATIONAL: 'bg-[var(--color-healthy)]',
  OFFLINE: 'bg-[var(--color-offline)]',
  UNKNOWN: 'bg-[var(--color-offline)]',
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * Next-best-actions HUD overlay.
 *
 * Renders a horizontal row of compact action chips during tighten
 * state. Each chip shows an app health dot + label + reason.
 * Clicking a chip navigates to the relevant district via
 * the morph system (startMorph from ui.store).
 *
 * Positioned near the breadcrumb area (top-left HUD zone, below
 * the breadcrumb). Uses AnimatePresence for smooth enter/exit.
 *
 * Empty in calm state (renders nothing).
 *
 * @see combined-recommendations.md "surface next-best-actions"
 */
export function NextBestActions() {
  const actions = useNextBestActions()
  const isTightening = useIsTightening()
  const startMorph = useUIStore((s) => s.startMorph)

  const handleActionClick = useCallback(
    (action: NextBestAction) => {
      startMorph(action.districtId)
    },
    [startMorph]
  )

  return (
    <div
      className={cn(
        'fixed z-40',
        'left-[var(--space-hud-inset,16px)]',
        'top-[calc(var(--space-hud-inset,16px)+28px)]', // Below breadcrumb
        'flex items-center gap-2',
        'pointer-events-auto'
      )}
      role="status"
      aria-label="Suggested actions"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {isTightening &&
          actions.map((action) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{
                type: 'tween',
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1],
              }}
              onClick={() => handleActionClick(action)}
              className={cn(
                // Glass chip styling
                'flex items-center gap-1.5 px-2.5 py-1.5',
                'rounded-lg',
                'bg-white/[0.04] backdrop-blur-sm',
                'border border-white/[0.06]',
                'hover:border-white/[0.10] hover:bg-white/[0.07]',
                'transition-colors duration-150',
                'cursor-pointer select-none',
                // Focus
                'focus-visible:ring-1 focus-visible:outline-none',
                'focus-visible:ring-[var(--color-ember-bright)]'
              )}
              title={action.reason}
              aria-label={`${action.label}: ${action.reason}. Click to navigate.`}
            >
              {/* Health dot */}
              <span
                className={cn('h-1.5 w-1.5 shrink-0 rounded-full', HEALTH_DOT_COLOR[action.health])}
                aria-hidden="true"
              />

              {/* Label */}
              <span
                className={cn(
                  'font-sans text-[10px] font-medium',
                  'tracking-[0.04em] uppercase',
                  'text-[var(--color-text-secondary)]',
                  'leading-none whitespace-nowrap'
                )}
              >
                {action.label}
              </span>
            </motion.button>
          ))}
      </AnimatePresence>
    </div>
  )
}
```

### 4.11 ParticleField Modification

**File:** `src/components/ambient/ParticleField.tsx` (MODIFY)

The ParticleField component from WS-1.6 must be modified to consume the attention-adjusted particle config. The modification is minimal: read `particleConfig` from the attention store and use it to control particle count, opacity range, and drift speed.

**Changes required:**

```ts
// ADD: Import attention config
import { useAttentionStore, attentionSelectors } from '@/stores/attention.store'

// MODIFY: In the component body, read particle config
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafIdRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const reducedMotion = useReducedMotion()
  const { paused } = usePanPause()

  // NEW: Read attention-adjusted particle config
  const particleConfig = useAttentionStore(attentionSelectors.particleConfig)

  // MODIFY: Re-create particles when count changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Only keep particles up to the configured count
    const targetCount = particleConfig.count
    if (targetCount === 0) {
      particlesRef.current = []
      return
    }

    // If we need fewer particles, trim. If we need more, create new ones.
    const current = particlesRef.current
    if (current.length > targetCount) {
      particlesRef.current = current.slice(0, targetCount)
    } else if (current.length < targetCount) {
      const newParticles = createParticles(
        window.innerWidth,
        window.innerHeight,
        targetCount - current.length
      )
      particlesRef.current = [...current, ...newParticles]
    }
  }, [particleConfig.count])

  // MODIFY: In the render loop, use attention-adjusted opacity and drift
  // Replace OPACITY_MIN/MAX with particleConfig.opacityMin/opacityMax
  // Multiply drift speed by particleConfig.driftMultiplier

  // ... rest of component unchanged
}

// MODIFY: createParticles to accept a count parameter
function createParticles(
  width: number,
  height: number,
  count: number = PARTICLE_COUNT
): Particle[] {
  // Use SIZE_DISTRIBUTION pattern but only up to `count` particles
  return Array.from({ length: count }, (_, i) => {
    const sizeIndex = i % SIZE_DISTRIBUTION.length
    const size = SIZE_DISTRIBUTION[sizeIndex]
    // ... same creation logic
  })
}
```

### 4.12 Integration Points

The following existing components require minor modifications to consume attention choreography. These modifications are backwards-compatible -- if the attention store is not yet mounted, components fall back to their existing behavior via CSS custom property defaults.

**WS-2.1 useMorphChoreography (MODIFY):**

```ts
// In use-morph-choreography.ts, add:
import { useMorphTimingOverride } from '@/hooks/use-effect-config'

// In the hook body:
const attentionTiming = useMorphTimingOverride()

// Replace the timing resolution:
const timing = prefersReducedMotion
  ? MORPH_TIMING_REDUCED
  : {
      focusing: attentionTiming.focusing,
      morphing: attentionTiming.morphing,
      unfurling: attentionTiming.unfurling,
    }
```

**WS-2.7 DistrictBeacon (MODIFY):**

```tsx
// In district-beacon.tsx, add:
import { useBeaconGlowConfig } from '@/hooks/use-effect-config'

// In the component body:
const { anomalyMultiplier, healthyMultiplier, anomalousApps } = useBeaconGlowConfig()

const isAnomalous = anomalousApps.has(data.id)
const glowMultiplier = isAnomalous ? anomalyMultiplier : healthyMultiplier

// Modify glow computation to apply multiplier:
const glowValue = computeGlow(data.health, glowMultiplier)

function computeGlow(health: HealthState, multiplier: number): string {
  // Existing glow values from WS-2.7, Section 4.4
  // Apply multiplier to the opacity values in the box-shadow
  // multiplier > 1.0 = brighter, < 1.0 = dimmer
  // Clamp opacity values to [0, 1] range
}
```

**Hub Layout Integration:**

```tsx
// In app/(hub)/layout.tsx, mount the orchestration:
import { useAttentionChoreography } from '@/hooks/use-attention-choreography'
import { NextBestActions } from '@/components/hud/next-best-actions'
import '@/styles/attention-choreography.css'

function HubLayout({ children }: { children: React.ReactNode }) {
  // Mount attention choreography (runs once, subscribes to districts store)
  useAttentionChoreography()

  return (
    <>
      {children}
      <NextBestActions />
    </>
  )
}
```

---

## 5. Acceptance Criteria

### Functional

| #     | Criterion                                                                                                                                                                       | Verification                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| AC-1  | **Calm state active when all apps OPERATIONAL and alertCount === 0**: `useAttentionStore.getState().attentionState` returns `'calm'`.                                           | Unit test with all-healthy SystemSnapshot.                                                                          |
| AC-2  | **Tighten state active when any app is DOWN**: attention state transitions to `'tighten'` within one polling cycle.                                                             | Unit test with one DOWN app.                                                                                        |
| AC-3  | **Tighten state active when any app is DEGRADED**: same behavior as DOWN.                                                                                                       | Unit test with one DEGRADED app.                                                                                    |
| AC-4  | **Tighten state active when alertCount > 0**: even if all apps are OPERATIONAL, alerts trigger tighten.                                                                         | Unit test with healthy apps + alertCount: 3.                                                                        |
| AC-5  | **OFFLINE and UNKNOWN do not trigger tighten**: an all-OFFLINE system remains calm.                                                                                             | Unit test with all apps OFFLINE.                                                                                    |
| AC-6  | **Hysteresis prevents flicker**: after entering tighten, the system requires 3 consecutive calm-eligible snapshots (per DEFAULT_ATTENTION_HYSTERESIS) before returning to calm. | Unit test: set tighten, then provide 2 calm snapshots (still tighten), then 3rd (transitions to calm).              |
| AC-7  | **Tighten entry is immediate**: transitioning from calm to tighten has no delay (0 consecutive snapshots required).                                                             | Unit test: provide one anomalous snapshot, verify immediate tighten.                                                |
| AC-8  | **Particle count reduces in tighten**: ParticleField renders 8 particles (not 18) when attention is tighten + performance is full.                                              | Visual inspection + attention store state check.                                                                    |
| AC-9  | **Grid pulse disabled in tighten**: GridPulse component returns null (gridPulseDurationMs === 0) during tighten state.                                                          | DOM inspection -- no grid pulse overlay element.                                                                    |
| AC-10 | **Hub breathing glow holds at minimum in tighten**: GlowBreathing shows static minimum glow (breatheDurationMs === 0) during tighten.                                           | Visual inspection -- hub glow does not oscillate.                                                                   |
| AC-11 | **Heartbeat accelerates for anomalous apps in tighten**: health bars on DOWN/DEGRADED capsules pulse at 4s cycle (vs 7s normal).                                                | Visual inspection -- anomalous capsule health bar pulses faster. CSS computed style check for `animation-duration`. |
| AC-12 | **Beacon glow amplified for anomalous districts in tighten**: DistrictBeacon for a DOWN app shows 1.5x glow intensity. Healthy district beacons dim to 0.5x.                    | Visual inspection at Z0. CSS box-shadow value comparison.                                                           |
| AC-13 | **Morph transitions accelerate in tighten**: focusing phase completes in 200ms (vs 300ms calm).                                                                                 | Performance timeline measurement during morph.                                                                      |
| AC-14 | **Next-best-actions appear during tighten**: 1-3 action chips render near the breadcrumb when attention state is tighten.                                                       | DOM inspection -- action chip elements present with correct labels.                                                 |
| AC-15 | **Next-best-actions disappear during calm**: chips exit with animation when attention returns to calm.                                                                          | Visual inspection -- chips fade out.                                                                                |
| AC-16 | **Next-best-action click navigates to district**: clicking a chip calls startMorph(districtId) and the morph begins.                                                            | Integration test -- click chip, verify morph phase transitions.                                                     |
| AC-17 | **Next-best-actions sorted by priority**: DOWN apps appear before DEGRADED apps before alert-only apps.                                                                         | Unit test with mixed health states.                                                                                 |
| AC-18 | **Maximum 3 next-best-actions**: even with 6 anomalous apps, only the top 3 are shown.                                                                                          | Unit test with all apps DOWN.                                                                                       |

### Performance

| #     | Criterion                                                                                                                                                                                | Verification                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| AC-19 | **Performance monitor classifies correctly**: at sustained 60fps, level is 'full'. At sustained 40fps (artificial throttle), level is 'reduced'. At sustained 20fps, level is 'minimal'. | Integration test with Chrome DevTools CPU throttling.                |
| AC-20 | **Performance level does not oscillate**: once classified, the level holds for at least 2 seconds before re-evaluation.                                                                  | Observe level stability during variable workload.                    |
| AC-21 | **Particles disabled at 'minimal' performance**: ParticleField renders 0 particles. Canvas is blank.                                                                                     | Visual inspection with CPU throttling.                               |
| AC-22 | **Attention state transition visual is smooth**: switching from calm to tighten does not cause a jarring visual snap. CSS transitions smooth property changes over 300ms.                | Visual inspection during simulated anomaly.                          |
| AC-23 | **usePerformanceMonitor rAF loop has negligible overhead**: the frame-timing measurement adds < 0.1ms per frame.                                                                         | Performance profiling -- measure time spent in the monitor callback. |
| AC-24 | **CSS custom property sync does not cause layout thrash**: writing to documentElement.style only triggers style recalculation, not layout.                                               | Performance trace -- no Layout events from property writes.          |

### Accessibility

| #     | Criterion                                                                                                                                                                                   | Verification                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| AC-25 | **prefers-reduced-motion respected**: with reduced motion active, all effect modulation resolves to static values. No animations change. Beacon glow differentiation (static) is preserved. | Enable reduced motion in OS; verify no visual changes from attention state transitions. |
| AC-26 | **NextBestActions has role="status" and aria-live="polite"**: screen readers announce new actions when they appear.                                                                         | DOM inspection and VoiceOver test.                                                      |
| AC-27 | **Action chips have descriptive aria-labels**: each chip includes label, reason, and navigation hint.                                                                                       | DOM inspection.                                                                         |
| AC-28 | **Action chips are keyboard-navigable**: Tab reaches chips; Enter/Space activates navigation.                                                                                               | Keyboard test.                                                                          |

### TypeScript & Code Quality

| #     | Criterion                                                                                                            | Verification          |
| ----- | -------------------------------------------------------------------------------------------------------------------- | --------------------- |
| AC-29 | **`pnpm typecheck` passes with zero errors** including all new and modified files.                                   | Run `pnpm typecheck`. |
| AC-30 | **`pnpm lint` passes with zero errors.**                                                                             | Run `pnpm lint`.      |
| AC-31 | **All pure functions in attention-rules.ts and effect-modulation.ts have unit tests** with 100% branch coverage.     | Test runner output.   |
| AC-32 | **No direct DOM access in pure rule functions**: attention-rules.ts and effect-modulation.ts import no browser APIs. | Code review.          |

---

## 6. Decisions Made

| ID       | Decision                                                                            | Rationale                                                                                                                                                                                                                                                                                                                                                                                  | Source                                                                                           |
| -------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| D-3.7.1  | **Zustand store for attention state, CSS custom properties for effect propagation** | Combines the reactivity of Zustand (for React components like NextBestActions and ParticleField) with the zero-re-render efficiency of CSS custom properties (for CSS-driven effects like HeartbeatPulse and GlowBreathing). This follows the AD-3 principle: ambient effects run on the compositor thread via CSS, not React.                                                             | AD-3 (Three-Tier Animation Architecture)                                                         |
| D-3.7.2  | **Rule-based, not ML-driven**                                                       | Per the planning prompt: "rule-based ambient motion throttling." The mapping from SystemSnapshot to AttentionState is deterministic and fully testable. No AI model, no training data, no inference latency. The rules are simple: any DOWN/DEGRADED/alerts = tighten, otherwise calm.                                                                                                     | combined-recommendations.md WS-3.7 description                                                   |
| D-3.7.3  | **Hysteresis with 3-snapshot threshold for calm re-entry**                          | At 15s default polling interval (AD-5), 3 snapshots = ~45s stabilization period. This prevents visual mode flicker from a transient error that self-resolves within one polling cycle. Entering tighten is immediate (no hysteresis) because anomalies should be surfaced instantly.                                                                                                       | [INFERENCE] from AD-5 adaptive polling cadence                                                   |
| D-3.7.4  | **requestAnimationFrame for performance monitoring, not PerformanceObserver**       | rAF timing is universally supported, trivially simple, and directly measures what we care about: frame delivery rate. PerformanceObserver's `longtask` entry type provides useful data but requires more complex integration and is not available in all environments. rAF timing gives us average FPS with a 60-frame rolling window -- sufficient for our coarse 3-level classification. | [INFERENCE]                                                                                      |
| D-3.7.5  | **navigator.hardwareConcurrency <= 2 forces 'minimal' performance level**           | Devices with 2 or fewer logical cores cannot sustain 18 Canvas particles + CSS animations + morph transitions without frame drops. Rather than waiting for measured FPS to degrade, we pre-classify these devices as minimal. This covers low-end hardware and some virtual machines.                                                                                                      | [INFERENCE]                                                                                      |
| D-3.7.6  | **Maximum 3 next-best-actions**                                                     | More than 3 chips would overflow the HUD space near the breadcrumb and create information overload during an already stressful anomaly situation. 3 is the sweet spot: it covers the most critical issues without visual clutter. If all 6 apps are anomalous, the worst 3 are shown. The user can navigate to others via the capsule ring or command palette.                             | [INFERENCE] -- cognitive load budget: <= 2 bits per HUD region                                   |
| D-3.7.7  | **Action chips use startMorph() from ui.store for navigation**                      | Reuses the existing morph choreography (WS-2.1) for district navigation rather than implementing a separate navigation mechanism. The morph system already handles camera animation, URL sync, and state machine transitions. The attention-adjusted morph timing (faster in tighten) makes this navigation feel more urgent.                                                              | WS-2.1 (morph choreography provides startMorph API)                                              |
| D-3.7.8  | **CSS custom properties override WS-1.6 token values, not component props**         | WS-1.6 effects already read CSS custom properties (e.g., `var(--duration-ambient-heart, 7000ms)`). By overriding these properties at the root level, the attention system modulates effects without touching component source code and without React re-renders. This is the cleanest integration path.                                                                                    | WS-1.6 Section 4.1 (ambient-effects.css uses CSS custom properties)                              |
| D-3.7.9  | **Separate attention store (not a slice of ui.store or districts.store)**           | The attention state is a derived computation, not primary UI state (ui.store) or primary data state (districts.store). A dedicated store provides: (a) clear ownership boundaries, (b) independent selectors that do not cause re-renders in unrelated consumers, (c) the ability to subscribe to effectConfig changes specifically for CSS sync.                                          | [INFERENCE] -- separation of concerns                                                            |
| D-3.7.10 | **Anomalous app detection includes alertCount > 0 even for OPERATIONAL apps**       | An OPERATIONAL app with active alerts is not "calm" -- the alerts need attention even if the app is technically healthy. This provides an early warning before the health state degrades.                                                                                                                                                                                                  | Gap #3 (Status Model) -- alerts are surfaced in capsules                                         |
| D-3.7.11 | **300ms visual transition between attention states**                                | Fast enough to feel responsive but slow enough to avoid jarring visual snaps. CSS `transition` properties on ambient effect elements smooth property changes. CSS `@keyframes` animation duration changes take effect at the next cycle boundary, which provides additional natural smoothing.                                                                                             | VISUAL-DESIGN-SPEC.md Section 2.3 (200ms hover transitions set the precedent for ambient timing) |
| D-3.7.12 | **Beacon glow differentiation preserved in reduced-motion mode**                    | Beacon glow intensity is a static property (not animated). Changing glow multipliers does not involve motion. Therefore, amplifying anomalous beacons and dimming healthy ones during tighten is accessible -- it provides information through luminance contrast, not animation.                                                                                                          | [INFERENCE] -- accessibility: information through static visual properties is always acceptable  |

---

## 7. Open Questions

| ID       | Question                                                                                                                                                                                                                                                                             | Impact                                                                                                                                            | Proposed Resolution                                                                                                                                                                                                                                                                                          | Owner                            |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| OQ-3.7.1 | **Districts store snapshot shape**: WS-1.5 populates `useDistrictsStore()` but the exact property that holds the assembled `SystemSnapshot` (vs raw per-app data) is not finalized. Does the store expose `.snapshot` directly, or does the consumer assemble it from per-app state? | Medium -- affects how `useAttentionChoreography` reads data.                                                                                      | Propose that the districts store exposes a `.snapshot: SystemSnapshot \| null` property that is assembled by the TanStack Query `select` callback on each poll. If it is not available, the attention hook assembles the snapshot from per-app records.                                                      | `react-developer` (WS-1.5 owner) |
| OQ-3.7.2 | **Film grain opacity at 0**: when performance is 'minimal' and attention is 'tighten', the modulation table sets `grainOpacity: 0`. Should the FilmGrain component check for opacity 0 and return null (unmounting the SVG filter), or leave the element in the DOM at 0 opacity?    | Low -- an invisible element with opacity 0 has negligible GPU cost.                                                                               | Leave the element in DOM at opacity 0. Unmounting would cause a layout thrash when it remounts. The SVG filter at opacity 0 is effectively a no-op for the compositor.                                                                                                                                       | `world-class-ui-designer`        |
| OQ-3.7.3 | **Multiple anomaly sources**: if Agent Builder is DOWN and Tarva Chat has 5 alerts, should the tighten behavior differentiate between "critical anomaly" (DOWN) and "warning anomaly" (alerts only)? Currently both trigger the same tighten state.                                  | Low for MVP -- both are "not calm." A future refinement could add a third mode (`'alert'` between calm and tighten) with intermediate modulation. | Defer. The current two-mode system is sufficient for Phase 3. The modulation table can be extended to three modes in WS-4.4 if user feedback indicates a need. The pure function architecture makes this a straightforward extension.                                                                        | `world-class-ui-designer`        |
| OQ-3.7.4 | **Attention state persistence across page navigation**: if the user navigates away from the hub (to `/login`) and back, should the attention state be preserved or recomputed from scratch?                                                                                          | Low -- the hub remounts on navigation, and the first telemetry poll (within 5-15s) will re-establish the correct state.                           | Recompute from scratch. The attention store is in-memory (Zustand, not persisted). On hub mount, the state starts as 'calm' and the first SystemSnapshot triggers the correct state within one polling cycle. This is acceptable because the transition is a subtle visual change, not a critical data loss. | `world-class-ui-designer`        |
| OQ-3.7.5 | **NextBestActions positioning conflict with breadcrumb**: the action chips are positioned below the breadcrumb. If the breadcrumb is long (e.g., `Launch > Agent Builder > Pipeline > Run #2847`), the chips may overlap with breadcrumb text.                                       | Low -- at Z2/Z3 where breadcrumbs are longest, the user is already in a district and the chips are most useful at Z0/Z1.                          | Position chips with a fixed top offset that accounts for the breadcrumb's maximum height (approximately 28px). If overlap is observed at Z2/Z3, hide chips when semantic zoom is Z2 or Z3 (the user is already navigated to a district, making the "navigate to district" action redundant).                 | `world-class-ui-designer`        |

---

## 8. Risk Register

| ID      | Risk                                                                                                                                                                                                                                                                 | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-3.7.1 | **Telemetry polling interval masks anomaly onset** -- if an app goes DOWN between polling cycles (5-30s per AD-5), the attention transition is delayed by up to one polling interval.                                                                                | Medium     | Low    | Acceptable latency. The attention system is a visual comfort layer, not a real-time alerting system. A 5-30s delay in ambient visual change is not user-visible because the user has not yet looked at the capsule. When they do look, the next poll will have already updated the state.                                                                                                              |
| R-3.7.2 | **CSS custom property writes trigger expensive style recalculations** -- writing 6 properties to documentElement.style on every telemetry poll could cause layout thrash if other styles depend on these properties.                                                 | Low        | Medium | CSS custom property writes trigger style recalculation but NOT layout. The properties are consumed only by ambient effect elements, which use `will-change` and `contain: style` to isolate their recalculation cost. Profile during development; if measurable impact, batch writes into a single rAF callback.                                                                                       |
| R-3.7.3 | **Performance monitor misclassifies level during heavy morph transitions** -- the morph transition (WS-2.1) temporarily drops FPS due to camera animation + AnimatePresence. The performance monitor may incorrectly classify this as 'reduced'.                     | Medium     | Low    | The 2-second evaluation interval (EVALUATION_INTERVAL_MS) and 60-frame rolling window smooth out transient FPS dips. A 900ms morph transition affects ~54 frames, less than one full window. The average FPS will dip but unlikely to cross the 55fps threshold unless the baseline was already marginal. If it does, the reduced config gracefully reduces load.                                      |
| R-3.7.4 | **Hysteresis delay feels sluggish** -- 3 snapshots at 15s = 45s before the Launch returns to calm after an anomaly resolves. Users may perceive the interface as "stuck" in tighten mode.                                                                            | Medium     | Low    | 45s is deliberate -- it ensures the anomaly is truly resolved, not just a transient recovery. The tighten mode is not unpleasant (reduced ambient effects are still aesthetically acceptable), and the next-best-actions chips disappear as soon as the apps recover (they are computed fresh each cycle, without hysteresis). If feedback indicates 45s is too long, reduce calmThreshold to 2 (30s). |
| R-3.7.5 | **ParticleField particle count changes cause visible pop-in/pop-out** -- when transitioning from 18 to 8 particles, 10 particles instantly disappear.                                                                                                                | Low        | Medium | Trim particles from the end of the array (highest indices = largest particles). The remaining 8 are the small, least-visible particles. Alternatively, fade out removed particles over 300ms before actually removing them from the array. The current design trims immediately; if visual popping is noticeable, add a fade-out buffer.                                                               |
| R-3.7.6 | **NextBestActions chip click during active morph** -- if the user clicks a chip while a morph is already in progress (e.g., navigating to a different district), `startMorph` is guarded to only work from `idle` state. The click would be silently ignored.        | Low        | Low    | The startMorph guard in WS-2.1 ui.store already prevents this (`if (state.morph.phase !== 'idle') return`). The user would need to wait for the current morph to settle or reverse before clicking another chip. This is the correct behavior -- interrupting a morph mid-flight would cause visual glitches.                                                                                          |
| R-3.7.7 | **Beacon glow multiplier produces washed-out or invisible glows** -- multiplying box-shadow opacity values by 1.5 or 0.5 may push opacities outside the visually effective range (e.g., 0.35 \* 1.5 = 0.525, which may look washed out against the dark background). | Low        | Low    | The beacon glow values from WS-2.7 are already subtle (max opacity ~0.55 for OPERATIONAL outer glow). A 1.5x multiplier pushes this to ~0.825, which is visible but not garish against `--color-void`. A 0.5x multiplier on healthy beacons (e.g., 0.35 \* 0.5 = 0.175) dims them noticeably without making them invisible. Tune multiplier values during visual polish (WS-4.4) if needed.            |

---

## Appendix A: Execution Checklist

This checklist is for the implementing agent. Execute steps in order.

```
[ ] 1.  Verify WS-1.5, WS-1.6, WS-1.7, WS-2.1, and WS-2.7 are complete (or have stable APIs)
[ ] 2.  Verify districts store exposes SystemSnapshot or equivalent (OQ-3.7.1)
[ ] 3.  Create type additions in src/lib/interfaces/types.ts (Section 4.2)
[ ] 4.  Create src/lib/attention-rules.ts (Section 4.3)
[ ] 5.  Create src/lib/effect-modulation.ts (Section 4.4)
[ ] 6.  Write unit tests for attention-rules.ts (all branches, all health state combinations)
[ ] 7.  Write unit tests for effect-modulation.ts (all 6 matrix cells + reduced motion)
[ ] 8.  Create src/hooks/use-performance-monitor.ts (Section 4.5)
[ ] 9.  Create src/stores/attention.store.ts (Section 4.6)
[ ] 10. Create src/hooks/use-attention-choreography.ts (Section 4.7)
[ ] 11. Create src/hooks/use-effect-config.ts (Section 4.8)
[ ] 12. Create src/styles/attention-choreography.css (Section 4.9)
[ ] 13. Import attention-choreography.css in hub layout
[ ] 14. Create src/components/hud/next-best-actions.tsx (Section 4.10)
[ ] 15. Modify src/components/ambient/ParticleField.tsx (Section 4.11)
[ ] 16. Modify src/hooks/use-morph-choreography.ts (Section 4.12 -- morph timing)
[ ] 17. Modify src/components/districts/district-beacon.tsx (Section 4.12 -- beacon glow)
[ ] 18. Mount useAttentionChoreography() in hub layout
[ ] 19. Mount <NextBestActions /> in hub layout
[ ] 20. Run pnpm typecheck -- zero errors (AC-29)
[ ] 21. Run pnpm lint -- zero errors (AC-30)
[ ] 22. Run pnpm format to normalize all files
[ ] 23. Verify AC-1 through AC-7 (attention state rules and hysteresis)
[ ] 24. Verify AC-8 through AC-13 (effect modulation -- particles, grid, glow, heartbeat, morph)
[ ] 25. Verify AC-14 through AC-18 (next-best-actions)
[ ] 26. Verify AC-19 through AC-24 (performance monitoring and transitions)
[ ] 27. Verify AC-25 through AC-28 (accessibility)
[ ] 28. Commit with message: "feat: implement attention choreography system (WS-3.7)"
```

---

## Appendix B: Effect Modulation Quick Reference

Visual summary of how each effect changes across the 6 matrix cells.

```
                 ┌─────────────────────────────────────────────────┐
                 │              PERFORMANCE LEVEL                  │
                 │    Full          Reduced        Minimal         │
 ┌───────┬───────┼────────────────┬──────────────┬────────────────┤
 │       │       │ 18 particles   │ 10 particles │ 0 particles    │
 │       │ Part. │ 0.04-0.20 op   │ 0.04-0.12    │ --             │
 │       │       │ 1.0x drift     │ 0.7x drift   │ --             │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │ CALM  │ Heart │ 7s cycle       │ 7s cycle     │ static         │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │       │ Glow  │ 5s breathe     │ 5s / 80%     │ static min     │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │       │ Grid  │ 12s pulse      │ 16s pulse    │ off            │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │       │ Grain │ 0.035          │ 0.025        │ 0.015          │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │       │ Morph │ 300/200/400    │ 300/200/400  │ instant        │
 ├───────┼───────┼────────────────┼──────────────┼────────────────┤
 │       │       │ 8 particles    │ 4 particles  │ 0 particles    │
 │       │ Part. │ 0.02-0.08 op   │ 0.02-0.06   │ --             │
 │       │       │ 0.5x drift     │ 0.3x drift   │ --             │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │TIGHTEN│ Heart │ 7s / 4s anom.  │ 7s / 4s      │ static         │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │       │ Glow  │ hold min       │ hold min     │ off            │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │       │ Grid  │ off            │ off          │ off            │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │       │ Grain │ 0.025          │ 0.015        │ 0              │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │       │ Morph │ 200/150/300    │ 150/100/200  │ instant        │
 │       ├───────┼────────────────┼──────────────┼────────────────┤
 │       │Beacon │ 1.5x anom/     │ 1.2x anom/   │ 1.0x (static)  │
 │       │  glow │ 0.5x healthy   │ 0.3x healthy │                │
 └───────┴───────┴────────────────┴──────────────┴────────────────┘
```

---

## Appendix C: Data Flow Diagram

```
┌──────────────┐     poll     ┌──────────────┐
│ GET /api/    │◄────────────│  TanStack     │
│ telemetry    │─────────────►│  Query        │
│ (WS-1.5)    │  JSON        │  (client)     │
└──────────────┘              └──────┬───────┘
                                     │ onSuccess
                                     ▼
                              ┌──────────────┐
                              │  districts   │
                              │  .store      │
                              │  (WS-1.5)    │
                              └──────┬───────┘
                                     │ subscribe
                                     ▼
                    ┌────────────────────────────────────┐
                    │  useAttentionChoreography (WS-3.7) │
                    │                                    │
                    │  1. Read SystemSnapshot             │
                    │  2. computeRawAttentionState()      │
                    │  3. applyHysteresis()               │
                    │  4. resolveEffectConfig()           │
                    │  5. computeNextBestActions()        │
                    │  6. getAnomalousApps()              │
                    └──────────┬─────────────────────────┘
                               │ publish
                               ▼
                    ┌────────────────────────┐
                    │  attention.store       │
                    │                        │
                    │  attentionState        │
                    │  performanceLevel      │
                    │  effectConfig          │──► CSS custom properties
                    │  nextBestActions       │   (document.documentElement)
                    │  anomalousApps         │          │
                    └──────┬────────────────┘          │
                           │                            │
             ┌─────────────┼────────────────┐           │
             ▼             ▼                ▼           ▼
      ┌────────────┐ ┌──────────┐  ┌──────────┐  ┌──────────────┐
      │ Particle   │ │ Next     │  │ Beacon   │  │ CSS effects  │
      │ Field      │ │ Best     │  │ Glow     │  │ (HeartbeatP, │
      │ (Canvas)   │ │ Actions  │  │ (WS-2.7) │  │  GlowBreath, │
      │            │ │ (HUD)    │  │          │  │  GridPulse,  │
      │ count,     │ │          │  │ anomaly/ │  │  FilmGrain)  │
      │ opacity,   │ │ chips    │  │ healthy  │  │              │
      │ drift      │ │ w/ nav   │  │ multiply │  │ read --attn- │
      │            │ │          │  │          │  │ CSS vars     │
      └────────────┘ └──────────┘  └──────────┘  └──────────────┘

      ┌────────────────────────────┐
      │  usePerformanceMonitor     │
      │  (rAF frame timing)       │──► attention.store.performanceLevel
      └────────────────────────────┘

      ┌────────────────────────────┐
      │  useMorphChoreography      │
      │  (WS-2.1)                  │◄── attentionSelectors.morphTiming
      │  reads attention timing    │
      └────────────────────────────┘
```

---

## Appendix D: Design Token Reference

CSS custom properties consumed and produced by the attention choreography system.

### Consumed (from WS-0.2 / VISUAL-DESIGN-SPEC.md)

| Token                        | Baseline Value                 | Used By                                      |
| ---------------------------- | ------------------------------ | -------------------------------------------- |
| `--duration-ambient-heart`   | `7000ms`                       | HeartbeatPulse (overridden by attention)     |
| `--duration-ambient-breathe` | `5000ms`                       | GlowBreathing (overridden by attention)      |
| `--duration-ambient-grid`    | `12000ms`                      | GridPulse (overridden by attention)          |
| `--opacity-ambient-grain`    | `0.035`                        | FilmGrain (overridden by attention)          |
| `--ease-default`             | `cubic-bezier(0.4, 0, 0.2, 1)` | Transition easing                            |
| `--color-error`              | `#ef4444`                      | NextBestActions health dot (DOWN)            |
| `--color-warning`            | `#eab308`                      | NextBestActions health dot (DEGRADED)        |
| `--color-healthy`            | `#22c55e`                      | NextBestActions health dot (OPERATIONAL)     |
| `--color-offline`            | `#6b7280`                      | NextBestActions health dot (OFFLINE/UNKNOWN) |
| `--color-ember-bright`       | `#ff773c`                      | NextBestActions focus ring                   |
| `--color-text-secondary`     | `#92a9b4`                      | NextBestActions chip text                    |
| `--space-hud-inset`          | `16px`                         | NextBestActions positioning                  |

### Produced (by attention.store CSS sync)

| Token                                    | Description                   | Calm+Full Value | Tighten+Full Value |
| ---------------------------------------- | ----------------------------- | --------------- | ------------------ |
| `--attention-heartbeat-duration`         | Healthy app heartbeat cycle   | `7000ms`        | `7000ms`           |
| `--attention-heartbeat-anomaly-duration` | Anomalous app heartbeat cycle | `7000ms`        | `4000ms`           |
| `--attention-breathe-duration`           | Hub glow breathing cycle      | `5000ms`        | `0ms`              |
| `--attention-breathe-intensity`          | Hub glow intensity multiplier | `1.0`           | `0`                |
| `--attention-grid-pulse-duration`        | Grid pulse cycle              | `12000ms`       | `0ms`              |
| `--attention-grain-opacity`              | Film grain opacity            | `0.035`         | `0.025`            |
