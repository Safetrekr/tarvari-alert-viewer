/**
 * Morph state machine types and constants.
 *
 * Defines the 3-phase morph state machine, timing configurations,
 * detail panel geometry, and panel positioning helpers.
 *
 * @module morph-types
 * @see WS-2.1 Section 4.2
 */

import type { DistrictId } from '@/lib/interfaces/district'

// ============================================================
// MORPH STATE MACHINE
// ============================================================

/**
 * The morph state machine.
 *
 * Forward flow:  idle -> expanding -> settled -> entering-district -> district
 * Reverse flow:  district -> leaving-district -> idle
 *
 * The morph is always driven by `useMorphChoreography`. No other
 * consumer should call `setMorphPhase()` directly.
 */
export type MorphPhase =
  | 'idle' // No selection. All capsules in ring. Default state.
  | 'expanding' // Panel sliding in, capsule dimming, connector drawing.
  | 'settled' // Panel fully visible. Brief hold before district view.
  | 'entering-district' // District overlay fading in, detail panel exiting.
  | 'district' // Full-screen district view. Stable, interactive.
  | 'leaving-district' // District overlay fading out, returning to hub.

/**
 * Direction of the morph animation.
 * 'forward' = open panel (selection)
 * 'reverse' = close panel (deselection)
 */
export type MorphDirection = 'forward' | 'reverse'

/**
 * Timing configuration for the morph, in milliseconds.
 */
export interface MorphTimingConfig {
  /** Duration of the expanding phase. Panel slide + capsule dim + connector draw. */
  expanding: number
  /** Hold time in settled before advancing to entering-district. */
  settledHold: number
  /** Duration of the entering-district crossfade. */
  enteringDistrict: number
  /** Duration of the leaving-district exit. */
  leavingDistrict: number
}

/** Default timing. */
export const MORPH_TIMING: Readonly<MorphTimingConfig> = {
  expanding: 400,
  settledHold: 200,
  enteringDistrict: 600,
  leavingDistrict: 400,
} as const

/**
 * Reduced-motion timing: instant transitions, no waiting.
 */
export const MORPH_TIMING_REDUCED: Readonly<MorphTimingConfig> = {
  expanding: 0,
  settledHold: 0,
  enteringDistrict: 0,
  leavingDistrict: 0,
} as const

/**
 * Complete morph state tracked in the UI store.
 */
export interface MorphState {
  /** Current phase of the morph state machine. */
  phase: MorphPhase
  /** Direction of the current morph (forward or reverse). */
  direction: MorphDirection
  /** District being expanded (forward) or collapsed (reverse). Null when idle. */
  targetId: DistrictId | null
  /**
   * Timestamp (performance.now()) when the current phase started.
   * Used for phase timing coordination.
   */
  phaseStartedAt: number | null
}

/**
 * Actions added to the UI store for morph orchestration.
 */
export interface MorphActions {
  /**
   * Begin forward morph to a district.
   * Sets phase to 'expanding', direction to 'forward', targetId to the district.
   */
  startMorph: (districtId: DistrictId) => void
  /**
   * Begin reverse morph back to the atrium.
   * Sets phase to 'expanding', direction to 'reverse'.
   */
  reverseMorph: () => void
  /** Set the morph phase directly. Only called by useMorphChoreography. */
  setMorphPhase: (phase: MorphPhase) => void
  /** Reset morph to idle. Called on completion of reverse flow. */
  resetMorph: () => void
}

// ============================================================
// DETAIL PANEL GEOMETRY
// ============================================================

/** Dimensions of the detail panel (world-space pixels, rendered at zoom 0.5). */
export const DETAIL_PANEL_DIMENSIONS = {
  width: 900,
  height: 680,
  borderRadius: 32,
  padding: 40,
  gap: 140, // gap between ring center and panel edge
} as const

/** Dimensions of a capsule at Z1. */
export const CAPSULE_DIMENSIONS = {
  width: 192,
  height: 228,
  borderRadius: 28,
  padding: 20,
} as const

// ============================================================
// RING SHIFT (split-screen morph)
// ============================================================

/**
 * When a detail panel opens, the capsule ring shifts away from the panel
 * and scales down to make room. These constants define the shift amount
 * and scale factor.
 */
export const RING_SHIFT = {
  /** Horizontal offset in px (applied away from panel side). */
  offset: 450,
  /** Scale factor for the ring content when shifted. */
  scale: 0.75,
} as const

// ============================================================
// PANEL POSITIONING
// ============================================================

export type PanelSide = 'left' | 'right'

/**
 * Compute the ring rotation and panel side for a given capsule.
 *
 * The ring rotates so the clicked capsule lands at either 3:00 (0°) or
 * 9:00 (180°), whichever requires the shortest rotation. The panel
 * then appears on the side the capsule faces:
 *   - Capsule at 3:00 → panel on RIGHT
 *   - Capsule at 9:00 → panel on LEFT
 *
 * @param ringIndex - The clicked capsule's ring index (0-5).
 * @returns { rotation, panelSide } where rotation is in degrees.
 */
export function computeRingRotation(ringIndex: number): {
  rotation: number
  panelSide: PanelSide
} {
  // Each capsule's starting angle: START_ANGLE + index * 60
  // START_ANGLE = -90 (12 o'clock)
  const capsuleAngle = -90 + ringIndex * 60

  // Target: 0° (3:00) or 180° (9:00)
  // Rotation needed = target - capsuleAngle (rotate the ring so capsule lands at target)
  const toThreeOclock = normalizeAngle(0 - capsuleAngle) // rotation to put capsule at 3:00
  const toNineOclock = normalizeAngle(180 - capsuleAngle) // rotation to put capsule at 9:00

  // Pick whichever requires less rotation (absolute degrees)
  const absThree = Math.abs(toThreeOclock)
  const absNine = Math.abs(toNineOclock)

  if (absThree <= absNine) {
    return { rotation: toThreeOclock, panelSide: 'right' }
  }
  return { rotation: toNineOclock, panelSide: 'left' }
}

/**
 * Normalize an angle to the range (-180, 180] for shortest-path rotation.
 */
function normalizeAngle(deg: number): number {
  let a = ((deg % 360) + 360) % 360 // normalize to [0, 360)
  if (a > 180) a -= 360 // convert to (-180, 180]
  return a
}

/**
 * Determine which side the panel appears on based on ring position.
 * @deprecated Use computeRingRotation() instead for rotation-aware panel side.
 */
export function getPanelSide(ringIndex: number): PanelSide {
  return computeRingRotation(ringIndex).panelSide
}

/**
 * Compute detail panel position in ring-local coordinates.
 *
 * The panel is positioned relative to the RING CENTER (not the capsule)
 * so it stays fixed when the ring content shifts during the split-screen
 * morph. The panel sits offset from ring center by `gap` pixels.
 *
 * @param ringIndex - Capsule ring position (0-5).
 * @param ringCenter - Center of the ring container (typically RING_SIZE / 2).
 * @returns { left, top } for absolute positioning within the ring container.
 */
export function computePanelPosition(
  ringIndex: number,
  ringCenter: number,
): { left: number; top: number } {
  const { width: panelW, height: panelH, gap } = DETAIL_PANEL_DIMENSIONS
  const side = getPanelSide(ringIndex)

  if (side === 'right') {
    return {
      left: ringCenter + gap,
      top: ringCenter - panelH / 2,
    }
  }
  return {
    left: ringCenter - gap - panelW,
    top: ringCenter - panelH / 2,
  }
}

// ============================================================
// STATION ENTRANCE TYPES
// ============================================================

/**
 * Configuration for staggered station entrance animation.
 */
export interface StationEntranceConfig {
  /** Delay between each station's entrance, in seconds. */
  staggerDelay: number
  /** Duration of each station's entrance animation, in seconds. */
  duration: number
  /** Y offset (in px) that stations slide from during entrance. */
  slideDistance: number
}

export const STATION_ENTRANCE_CONFIG: Readonly<StationEntranceConfig> = {
  staggerDelay: 0.08,
  duration: 0.3,
  slideDistance: 20,
} as const
