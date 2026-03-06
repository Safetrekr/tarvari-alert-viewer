/**
 * Morph state machine types and constants.
 *
 * Defines the morph state machine, timing configurations,
 * detail panel geometry, and grid panel positioning.
 *
 * @module morph-types
 * @see WS-2.1 Section 4.2
 */

import type { NodeId } from '@/lib/interfaces/district'

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
 * Fast-path timing for search-initiated navigation.
 * Only enteringDistrict is relevant -- expanding and settled are skipped.
 *
 * @see WS-3.4
 */
export const MORPH_TIMING_FAST: Readonly<MorphTimingConfig> = {
  expanding: 0,
  settledHold: 0,
  enteringDistrict: 300,
  leavingDistrict: 400,
} as const

/**
 * Complete morph state tracked in the UI store.
 */
export interface MorphState {
  /** Current phase of the morph state machine. */
  phase: MorphPhase
  /** Direction of the current morph (forward or reverse). */
  direction: MorphDirection
  /** Node being expanded (forward) or collapsed (reverse). Null when idle. */
  targetId: NodeId | null
  /**
   * Timestamp (performance.now()) when the current phase started.
   * Used for phase timing coordination.
   */
  phaseStartedAt: number | null
  /** Whether this morph uses the fast path (skip expanding + settled). */
  fast: boolean
}

/** Options for startMorph behavior. */
export interface StartMorphOptions {
  /**
   * When true, skip expanding + settled phases and transition
   * directly from idle to entering-district with reduced duration.
   * Used for search-initiated navigation where wayfinding animation
   * adds friction rather than value.
   */
  fast?: boolean
}

/**
 * Actions added to the UI store for morph orchestration.
 */
export interface MorphActions {
  /**
   * Begin forward morph to a district.
   * Sets phase to 'expanding' (or 'entering-district' if fast), direction to 'forward', targetId to the district.
   */
  startMorph: (nodeId: NodeId, options?: StartMorphOptions) => void
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

// ============================================================
// PANEL POSITIONING
// ============================================================

/** Panel dock side. With the grid layout, panel always docks right (WS-2.2 D-1). */
export type PanelSide = 'left' | 'right'

// ============================================================
// GRID PANEL POSITIONING
// ============================================================

/** Fixed-right panel offset from viewport edge (px). */
export const GRID_PANEL_RIGHT_OFFSET = 40

/**
 * Fixed-position style for the detail panel in the grid layout.
 * Panel is vertically centered on the right side of the viewport.
 */
export const GRID_PANEL_POSITION = {
  right: GRID_PANEL_RIGHT_OFFSET,
  top: '50%',
  transform: 'translateY(-50%)',
} as const

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
