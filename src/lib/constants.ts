/**
 * Application-wide constants for Tarva Launch.
 *
 * ALL spatial constants live here -- hooks, stores, and math utilities
 * import from this module. No magic numbers in feature code.
 *
 * @module constants
 * @see WS-1.1 Deliverable 3
 */

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

export const APP_NAME = 'Tarva Launch'
export const APP_DESCRIPTION = 'Spatial mission control for the Tarva ecosystem'

// ---------------------------------------------------------------------------
// Zoom range
// ---------------------------------------------------------------------------

/** Minimum zoom level (fully zoomed out). */
export const ZOOM_MIN = 0.08

/** Maximum zoom level (fully zoomed in). */
export const ZOOM_MAX = 3.0

/** Default zoom level on launch (Z1 -- Atrium level). */
export const ZOOM_DEFAULT = 0.5

// ---------------------------------------------------------------------------
// Semantic zoom thresholds (with hysteresis)
//
// Each transition has an "enter" threshold and an "exit" threshold
// offset by ~10% to prevent flicker at boundaries.
//
// | Transition     | Enter At  | Exit At   |
// |----------------|-----------|-----------|
// | Z0 -> Z1       | >= 0.30   |           |
// | Z1 -> Z0       |           | < 0.27    |
// | Z1 -> Z2       | >= 0.80   |           |
// | Z2 -> Z1       |           | < 0.72    |
// | Z2 -> Z3       | >= 1.50   |           |
// | Z3 -> Z2       |           | < 1.35    |
// ---------------------------------------------------------------------------

export const Z0_TO_Z1_ENTER = 0.30
export const Z1_TO_Z0_EXIT = 0.27
export const Z1_TO_Z2_ENTER = 0.80
export const Z2_TO_Z1_EXIT = 0.72
export const Z2_TO_Z3_ENTER = 1.50
export const Z3_TO_Z2_EXIT = 1.35

// ---------------------------------------------------------------------------
// Pan momentum (tuned during spike testing)
// ---------------------------------------------------------------------------

/** Friction decay per frame (0 = instant stop, 1 = no friction). Tuned: 0.96. */
export const MOMENTUM_FRICTION = 0.96

/** Number of recent pointer samples used for velocity computation. */
export const MOMENTUM_SAMPLES = 5

/** Stop momentum when velocity magnitude drops below this (px/frame). Tuned: 0.15. */
export const MOMENTUM_STOP_THRESHOLD = 0.15

// ---------------------------------------------------------------------------
// Zoom momentum (tuned during spike testing)
// ---------------------------------------------------------------------------

/** Impulse per wheel delta unit. Tuned: 0.0008. */
export const ZOOM_SENSITIVITY = 0.0008

/** Zoom velocity friction per frame. Tuned: 0.93. */
export const ZOOM_FRICTION = 0.93

/** Stop zoom coasting below this velocity. Tuned: 0.0003. */
export const ZOOM_STOP_THRESHOLD = 0.0003

// ---------------------------------------------------------------------------
// Spring animation
// ---------------------------------------------------------------------------

/** Default spring config for flyTo animations. */
export const DEFAULT_SPRING_CONFIG = {
  stiffness: 120,
  damping: 20,
  mass: 1.1,
  restThreshold: 0.01,
} as const

// ---------------------------------------------------------------------------
// Viewport culling
// ---------------------------------------------------------------------------

/** Extra margin (world-space pixels) added to visible bounds for culling. */
export const VIEWPORT_CULL_MARGIN = 200

// ---------------------------------------------------------------------------
// Pan-pause
// ---------------------------------------------------------------------------

/** Delay (ms) after motion stops before backdrop effects re-enable. */
export const PAN_PAUSE_DELAY_MS = 150

// ---------------------------------------------------------------------------
// Capsule ring layout
// ---------------------------------------------------------------------------

/** Radius of the first capsule ring from origin (world-space pixels). */
export const CAPSULE_RING_RADIUS = 300

/** Angular spacing between capsules in the first ring (degrees). */
export const CAPSULE_ANGULAR_SPACING = 60
