/**
 * Spatial math utilities for the ZUI engine.
 *
 * Pure functions for zoom-to-cursor math, semantic zoom level resolution
 * with hysteresis, momentum physics, viewport culling, coordinate
 * transforms, and spring animation.
 *
 * All constants are imported from `@/lib/constants` -- this module
 * contains only types and pure functions.
 *
 * @module spatial-math
 * @see WS-0.3 Section 4.1.2
 * @see WS-1.1 Deliverable 2
 * @see Appendix B (zoom-to-cursor derivation)
 * @see Appendix C (hysteresis state machine)
 */

import {
  ZOOM_MIN,
  ZOOM_MAX,
  MOMENTUM_FRICTION,
  MOMENTUM_STOP_THRESHOLD,
  VIEWPORT_CULL_MARGIN,
  Z0_TO_Z1_ENTER,
  Z1_TO_Z0_EXIT,
  Z1_TO_Z2_ENTER,
  Z2_TO_Z1_EXIT,
  Z2_TO_Z3_ENTER,
  Z3_TO_Z2_EXIT,
} from '@/lib/constants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Semantic zoom levels per AD-2. */
export type SemanticZoomLevel = 'Z0' | 'Z1' | 'Z2' | 'Z3'

/** A 2D point in either screen-space or world-space. */
export interface Point2D {
  x: number
  y: number
}

/** A timed pointer sample for velocity computation. */
export interface PointerSample {
  x: number
  y: number
  t: number
}

export interface ZoomLevelConfig {
  level: SemanticZoomLevel
  /** Enter this level when zoom >= enterMin */
  enterMin: number
  /** Enter this level when zoom < enterMax */
  enterMax: number
  /** Exit to lower level when zoom < exitBelow */
  exitBelow: number
  /** Exit to higher level when zoom >= exitAbove */
  exitAbove: number
}

export interface Velocity {
  vx: number
  vy: number
}

export interface WorldBounds {
  left: number
  top: number
  right: number
  bottom: number
}

export interface SpringConfig {
  /** Spring stiffness (default 170) */
  stiffness: number
  /** Spring damping (default 26) */
  damping: number
  /** Spring mass (default 1) */
  mass: number
  /** Rest threshold for settling detection (default 0.01) */
  restThreshold: number
}

/** Result of a single spring physics step. */
export interface SpringStepResult {
  /** Updated value after this step. */
  value: number
  /** Updated velocity after this step. */
  velocity: number
  /** Whether the spring has settled to rest. */
  atRest: boolean
}

// ---------------------------------------------------------------------------
// Zoom level configuration table
// ---------------------------------------------------------------------------

/**
 * Zoom level thresholds with 10% hysteresis bands.
 *
 * | Level | Enter At       | Exit At                 |
 * |-------|----------------|-------------------------|
 * | Z0    | zoom < 0.27    | zoom >= 0.30            |
 * | Z1    | 0.30 - 0.79    | zoom < 0.27 or >= 0.80  |
 * | Z2    | 0.80 - 1.49    | zoom < 0.72 or >= 1.50  |
 * | Z3    | zoom >= 1.50   | zoom < 1.35             |
 */
export const ZOOM_LEVELS: ZoomLevelConfig[] = [
  { level: 'Z0', enterMin: ZOOM_MIN, enterMax: Z1_TO_Z0_EXIT, exitBelow: ZOOM_MIN, exitAbove: Z0_TO_Z1_ENTER },
  { level: 'Z1', enterMin: Z0_TO_Z1_ENTER, enterMax: Z1_TO_Z2_ENTER, exitBelow: Z1_TO_Z0_EXIT, exitAbove: Z1_TO_Z2_ENTER },
  { level: 'Z2', enterMin: Z1_TO_Z2_ENTER, enterMax: Z2_TO_Z3_ENTER, exitBelow: Z2_TO_Z1_EXIT, exitAbove: Z2_TO_Z3_ENTER },
  { level: 'Z3', enterMin: Z2_TO_Z3_ENTER, enterMax: ZOOM_MAX, exitBelow: Z3_TO_Z2_EXIT, exitAbove: ZOOM_MAX + 1 },
]

// ---------------------------------------------------------------------------
// Coordinate transforms
// ---------------------------------------------------------------------------

/**
 * Convert a screen-space point to world-space coordinates.
 *
 * worldX = (screenX - offsetX) / zoom
 * worldY = (screenY - offsetY) / zoom
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): Point2D {
  const safeZoom = Math.max(zoom, 0.001)
  return {
    x: (screenX - offsetX) / safeZoom,
    y: (screenY - offsetY) / safeZoom,
  }
}

/**
 * Convert a world-space point to screen-space coordinates.
 *
 * screenX = worldX * zoom + offsetX
 * screenY = worldY * zoom + offsetY
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
): Point2D {
  return {
    x: worldX * zoom + offsetX,
    y: worldY * zoom + offsetY,
  }
}

// ---------------------------------------------------------------------------
// Zoom-to-cursor (per AD-1, Appendix B)
// ---------------------------------------------------------------------------

/**
 * Calculate new camera offset after zooming, preserving the world-space
 * point under the cursor.
 *
 * Formula:
 *   newOffsetX = cursorX - (cursorX - oldOffsetX) * (newZoom / oldZoom)
 *   newOffsetY = cursorY - (cursorY - oldOffsetY) * (newZoom / oldZoom)
 *
 * This ensures the world point at the cursor position stays fixed
 * on screen during zoom.
 */
export function zoomToPoint(
  oldOffsetX: number,
  oldOffsetY: number,
  oldZoom: number,
  newZoom: number,
  cursorX: number,
  cursorY: number,
): { offsetX: number; offsetY: number } {
  const ratio = newZoom / oldZoom
  return {
    offsetX: cursorX - (cursorX - oldOffsetX) * ratio,
    offsetY: cursorY - (cursorY - oldOffsetY) * ratio,
  }
}

// ---------------------------------------------------------------------------
// Semantic zoom with hysteresis (per AD-2, Appendix C)
// ---------------------------------------------------------------------------

/**
 * Resolve the semantic zoom level given the current zoom and the
 * previous semantic level (for hysteresis).
 *
 * Returns the new level only if the threshold is fully crossed;
 * otherwise returns the current level (preventing flicker at boundaries).
 *
 * State transitions:
 * - Z0 -> Z1: zoom crosses 0.30 (upward)
 * - Z1 -> Z0: zoom crosses 0.27 (downward)
 * - Z1 -> Z2: zoom crosses 0.80 (upward)
 * - Z2 -> Z1: zoom crosses 0.72 (downward)
 * - Z2 -> Z3: zoom crosses 1.50 (upward)
 * - Z3 -> Z2: zoom crosses 1.35 (downward)
 */
export function resolveSemanticLevel(
  zoom: number,
  currentLevel: SemanticZoomLevel,
): SemanticZoomLevel {
  switch (currentLevel) {
    case 'Z0':
      if (zoom >= Z0_TO_Z1_ENTER) return 'Z1'
      return 'Z0'
    case 'Z1':
      if (zoom < Z1_TO_Z0_EXIT) return 'Z0'
      if (zoom >= Z1_TO_Z2_ENTER) return 'Z2'
      return 'Z1'
    case 'Z2':
      if (zoom < Z2_TO_Z1_EXIT) return 'Z1'
      if (zoom >= Z2_TO_Z3_ENTER) return 'Z3'
      return 'Z2'
    case 'Z3':
      if (zoom < Z3_TO_Z2_EXIT) return 'Z2'
      return 'Z3'
    default:
      return currentLevel
  }
}

// ---------------------------------------------------------------------------
// Momentum decay
// ---------------------------------------------------------------------------

/**
 * Apply momentum decay to a velocity vector.
 * @param velocity  - Current velocity
 * @param friction  - Decay factor per frame (0.96 tuned)
 * @param threshold - Minimum velocity magnitude to continue (0.15 tuned)
 * @returns Updated velocity, or { vx: 0, vy: 0 } if below threshold
 */
export function applyMomentumDecay(
  velocity: Velocity,
  friction: number = MOMENTUM_FRICTION,
  threshold: number = MOMENTUM_STOP_THRESHOLD,
): Velocity {
  const vx = velocity.vx * friction
  const vy = velocity.vy * friction
  const magnitude = Math.sqrt(vx * vx + vy * vy)

  if (magnitude < threshold) {
    return { vx: 0, vy: 0 }
  }

  return { vx, vy }
}

/**
 * Compute velocity from the last N pointer samples.
 * Returns averaged velocity in px/ms, suitable for converting to
 * px/frame at 60fps (multiply by 16.67).
 *
 * Uses the difference between the last and first sample to get a
 * stable velocity vector, avoiding noise from individual inter-sample deltas.
 */
export function computeVelocityFromSamples(
  samples: PointerSample[],
): Velocity {
  if (samples.length < 2) {
    return { vx: 0, vy: 0 }
  }

  const first = samples[0]
  const last = samples[samples.length - 1]
  const dt = last.t - first.t

  if (dt <= 0) {
    return { vx: 0, vy: 0 }
  }

  // Velocity in px/ms
  const vxPerMs = (last.x - first.x) / dt
  const vyPerMs = (last.y - first.y) / dt

  // Convert to px/frame at 60fps (16.67ms per frame)
  return {
    vx: vxPerMs * 16.67,
    vy: vyPerMs * 16.67,
  }
}

// ---------------------------------------------------------------------------
// Viewport culling
// ---------------------------------------------------------------------------

/**
 * Compute the visible world-space bounds given viewport dimensions
 * and camera state.
 *
 * visibleLeft   = -offsetX / zoom
 * visibleTop    = -offsetY / zoom
 * visibleRight  = (viewportWidth - offsetX) / zoom
 * visibleBottom = (viewportHeight - offsetY) / zoom
 *
 * @param viewportWidth  - Viewport width in CSS pixels
 * @param viewportHeight - Viewport height in CSS pixels
 * @param offsetX        - Camera X offset
 * @param offsetY        - Camera Y offset
 * @param zoom           - Current zoom level
 * @param margin         - Extra margin in world-space pixels (default 200)
 */
export function getVisibleBounds(
  viewportWidth: number,
  viewportHeight: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
  margin: number = VIEWPORT_CULL_MARGIN,
): WorldBounds {
  const safeZoom = Math.max(zoom, 0.001) // Prevent division by zero
  return {
    left: -offsetX / safeZoom - margin,
    top: -offsetY / safeZoom - margin,
    right: (viewportWidth - offsetX) / safeZoom + margin,
    bottom: (viewportHeight - offsetY) / safeZoom + margin,
  }
}

/**
 * Check whether a rectangle at world-space position is within the
 * visible bounds.
 */
export function isInViewport(
  elementX: number,
  elementY: number,
  elementWidth: number,
  elementHeight: number,
  visibleBounds: WorldBounds,
): boolean {
  return (
    elementX + elementWidth > visibleBounds.left &&
    elementX < visibleBounds.right &&
    elementY + elementHeight > visibleBounds.top &&
    elementY < visibleBounds.bottom
  )
}

// ---------------------------------------------------------------------------
// Spring animation
// ---------------------------------------------------------------------------

/**
 * Compute one frame of spring physics for a single value.
 * Uses semi-implicit Euler integration for stability.
 */
export function springStep(
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig,
  dt: number,
): SpringStepResult {
  const { stiffness, damping, mass, restThreshold } = config

  // Spring force: F = -k * (current - target) - d * velocity
  const displacement = current - target
  const springForce = -stiffness * displacement
  const dampingForce = -damping * velocity
  const acceleration = (springForce + dampingForce) / mass

  // Semi-implicit Euler: update velocity first, then position
  const newVelocity = velocity + acceleration * dt
  const newValue = current + newVelocity * dt

  // Check if at rest (both displacement and velocity are below threshold)
  const atRest =
    Math.abs(newValue - target) < restThreshold &&
    Math.abs(newVelocity) < restThreshold

  return {
    value: atRest ? target : newValue,
    velocity: atRest ? 0 : newVelocity,
    atRest,
  }
}

// ---------------------------------------------------------------------------
// Utility: clamp zoom
// ---------------------------------------------------------------------------

/** Clamp a zoom value to the allowed range [ZOOM_MIN, ZOOM_MAX]. */
export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom))
}
