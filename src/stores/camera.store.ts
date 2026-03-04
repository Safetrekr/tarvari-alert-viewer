/**
 * Camera store for the ZUI spatial engine.
 *
 * Manages camera position (offsetX, offsetY), zoom level, semantic zoom level
 * (with hysteresis), animation state, pan state, and viewport dimensions.
 * Uses Zustand with immer middleware for ergonomic state updates.
 *
 * CRITICAL PERFORMANCE PATTERN: Components that need to update the DOM on
 * every camera change (like SpatialCanvas) must use `useCameraStore.subscribe()`
 * for direct DOM writes, bypassing React reconciliation entirely.
 * Only use `useCameraStore()` with selectors for low-frequency reads
 * (e.g., reading `semanticLevel` for content switching).
 *
 * @module camera.store
 * @see WS-0.3 Section 4.1.1
 * @see WS-1.1 Deliverable 1
 * @see AD-1 (Camera State Management)
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

import {
  type SemanticZoomLevel,
  type SpringConfig,
  clampZoom,
  resolveSemanticLevel,
  springStep,
  zoomToPoint,
} from '@/lib/spatial-math'
import { ZOOM_DEFAULT, DEFAULT_SPRING_CONFIG } from '@/lib/constants'

// Re-export the type so consumers can import from the store module
export type { SemanticZoomLevel }

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CameraState {
  /** World-space X offset (pixels). Positive = viewport moved right. */
  offsetX: number
  /** World-space Y offset (pixels). Positive = viewport moved down. */
  offsetY: number
  /** Zoom factor. 1.0 = 100%. Range: [0.08, 3.0]. */
  zoom: number
  /** Current semantic zoom level derived from zoom + hysteresis. */
  semanticLevel: SemanticZoomLevel
  /** Whether the camera is currently animating (momentum or flyTo). */
  isAnimating: boolean
  /** Whether the user is currently dragging to pan. */
  isPanning: boolean
  /** Viewport width in CSS pixels (measured by SpatialViewport). */
  viewportWidth: number
  /** Viewport height in CSS pixels (measured by SpatialViewport). */
  viewportHeight: number
}

export interface CameraActions {
  /**
   * Translate the camera by a delta in screen-space pixels.
   * Internally converts to world-space using current zoom.
   */
  panBy: (dx: number, dy: number) => void

  /**
   * Zoom to a specific level, preserving the world-space point
   * at the given screen-space cursor position.
   * @param nextZoom - Target zoom level, clamped to [0.08, 3.0]
   * @param cursorX  - Cursor X in viewport-space pixels
   * @param cursorY  - Cursor Y in viewport-space pixels
   */
  zoomTo: (nextZoom: number, cursorX: number, cursorY: number) => void

  /**
   * Animate camera to target offsets with spring physics.
   * For world-coordinate targeting, use the `useFlyTo` hook instead.
   * @param targetX - Target offsetX
   * @param targetY - Target offsetY
   * @param targetZoom - Target zoom level
   * @param config - Optional spring configuration override
   */
  flyTo: (
    targetX: number,
    targetY: number,
    targetZoom: number,
    config?: Partial<SpringConfig>,
  ) => void

  /** Animate camera to center the world origin at default zoom. */
  resetToLaunch: () => void

  /** Set the full camera state (used by animation loops). */
  setCamera: (patch: Partial<CameraState>) => void

  /** Set animating flag. */
  setAnimating: (animating: boolean) => void

  /** Set panning flag. */
  setPanning: (panning: boolean) => void

  /** Cancel any active flyTo animation. */
  cancelAnimation: () => void

  /** Set viewport dimensions (called by SpatialViewport on mount/resize). */
  setViewportDimensions: (width: number, height: number) => void
}

export type CameraStore = CameraState & CameraActions

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_STATE: CameraState = {
  offsetX: 0,
  offsetY: 0,
  zoom: ZOOM_DEFAULT,
  semanticLevel: 'Z1',
  isAnimating: false,
  isPanning: false,
  viewportWidth: 0,
  viewportHeight: 0,
}

// ---------------------------------------------------------------------------
// Module-level animation state (outside Zustand to avoid triggering subscriptions)
// ---------------------------------------------------------------------------

let _activeFlyToRaf: number | null = null

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCameraStore = create<CameraStore>()(
  immer((set, get) => ({
    ...INITIAL_STATE,

    panBy: (dx: number, dy: number) => {
      set((state) => {
        state.offsetX += dx
        state.offsetY += dy
      })
    },

    zoomTo: (nextZoom: number, cursorX: number, cursorY: number) => {
      const { offsetX, offsetY, zoom, semanticLevel } = get()
      const clampedZoom = clampZoom(nextZoom)

      const { offsetX: newOffsetX, offsetY: newOffsetY } = zoomToPoint(
        offsetX,
        offsetY,
        zoom,
        clampedZoom,
        cursorX,
        cursorY,
      )

      const newLevel = resolveSemanticLevel(clampedZoom, semanticLevel)

      set((state) => {
        state.offsetX = newOffsetX
        state.offsetY = newOffsetY
        state.zoom = clampedZoom
        state.semanticLevel = newLevel
      })
    },

    flyTo: (
      targetX: number,
      targetY: number,
      targetZoom: number,
      configOverride?: Partial<SpringConfig>,
    ) => {
      // Cancel any existing flyTo animation
      if (_activeFlyToRaf !== null) {
        cancelAnimationFrame(_activeFlyToRaf)
        _activeFlyToRaf = null
      }

      const clampedTargetZoom = clampZoom(targetZoom)
      const config: SpringConfig = { ...DEFAULT_SPRING_CONFIG, ...configOverride }

      // Spring state for each axis
      let velX = 0
      let velY = 0
      let velZ = 0
      let lastTime: number | null = null

      set((state) => {
        state.isAnimating = true
      })

      function animate(timestamp: number) {
        if (lastTime === null) {
          lastTime = timestamp
          _activeFlyToRaf = requestAnimationFrame(animate)
          return
        }

        // dt in seconds, capped to prevent instability on long frames
        const dt = Math.min((timestamp - lastTime) / 1000, 0.064)
        lastTime = timestamp

        const current = get()

        const stepX = springStep(current.offsetX, targetX, velX, config, dt)
        const stepY = springStep(current.offsetY, targetY, velY, config, dt)
        const stepZ = springStep(current.zoom, clampedTargetZoom, velZ, config, dt)

        velX = stepX.velocity
        velY = stepY.velocity
        velZ = stepZ.velocity

        const allAtRest = stepX.atRest && stepY.atRest && stepZ.atRest
        const newZoom = clampZoom(stepZ.value)
        const newLevel = resolveSemanticLevel(newZoom, current.semanticLevel)

        set((state) => {
          state.offsetX = stepX.value
          state.offsetY = stepY.value
          state.zoom = newZoom
          state.semanticLevel = newLevel
          if (allAtRest) {
            state.isAnimating = false
          }
        })

        if (allAtRest) {
          _activeFlyToRaf = null
          return
        }

        _activeFlyToRaf = requestAnimationFrame(animate)
      }

      _activeFlyToRaf = requestAnimationFrame(animate)
    },

    resetToLaunch: () => {
      const { viewportWidth, viewportHeight } = get()
      // Center the world origin (0, 0) on screen at default zoom.
      // offset = viewportDim/2 - worldCoord * zoom
      // Since worldCoord = 0, offset = viewportDim/2
      const targetOffsetX = viewportWidth / 2
      const targetOffsetY = viewportHeight / 2
      get().flyTo(targetOffsetX, targetOffsetY, ZOOM_DEFAULT)
    },

    setCamera: (patch: Partial<CameraState>) => {
      set((state) => {
        if (patch.offsetX !== undefined) state.offsetX = patch.offsetX
        if (patch.offsetY !== undefined) state.offsetY = patch.offsetY
        if (patch.isAnimating !== undefined) state.isAnimating = patch.isAnimating
        if (patch.isPanning !== undefined) state.isPanning = patch.isPanning

        if (patch.zoom !== undefined) {
          state.zoom = patch.zoom
          // Recalculate semantic level when zoom changes
          state.semanticLevel = resolveSemanticLevel(patch.zoom, state.semanticLevel)
        }

        if (patch.semanticLevel !== undefined) {
          state.semanticLevel = patch.semanticLevel
        }
      })
    },

    setAnimating: (animating: boolean) => {
      set((state) => {
        state.isAnimating = animating
      })
    },

    setPanning: (panning: boolean) => {
      set((state) => {
        state.isPanning = panning
      })
    },

    cancelAnimation: () => {
      if (_activeFlyToRaf !== null) {
        cancelAnimationFrame(_activeFlyToRaf)
        _activeFlyToRaf = null
      }
      set((state) => {
        state.isAnimating = false
      })
    },

    setViewportDimensions: (width: number, height: number) => {
      set((state) => {
        state.viewportWidth = width
        state.viewportHeight = height
      })
    },
  })),
)

// ---------------------------------------------------------------------------
// Derived selectors
//
// Use these with `useCameraStore(cameraSelectors.xxx)` for optimized
// re-rendering. Each selector returns a stable value that only changes
// when its specific slice of state changes.
// ---------------------------------------------------------------------------

export const cameraSelectors = {
  /** Current semantic zoom level. */
  semanticLevel: (state: CameraStore) => state.semanticLevel,

  /** Whether the camera is in any kind of motion (panning, animating, or both). */
  isMoving: (state: CameraStore) => state.isAnimating || state.isPanning,

  /** CSS transform string for the canvas element. */
  transformString: (state: CameraStore) =>
    `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`,

  /** Camera position as URL search params (for URL sync). */
  urlParams: (state: CameraStore) => ({
    cx: Math.round(state.offsetX),
    cy: Math.round(state.offsetY),
    cz: Math.round(state.zoom * 1000) / 1000,
  }),

  /** Whether the camera is at the default launch position. */
  isAtLaunch: (state: CameraStore) => {
    const { viewportWidth, viewportHeight } = state
    const expectedX = viewportWidth / 2
    const expectedY = viewportHeight / 2
    return (
      Math.abs(state.offsetX - expectedX) < 1 &&
      Math.abs(state.offsetY - expectedY) < 1 &&
      Math.abs(state.zoom - ZOOM_DEFAULT) < 0.001
    )
  },
} as const
