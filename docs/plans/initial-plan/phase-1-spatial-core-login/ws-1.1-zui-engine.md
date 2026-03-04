# WS-1.1: ZUI Engine

> **Workstream ID:** WS-1.1
> **Phase:** 1 -- Spatial Core + Login
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1 (scaffolding), WS-0.3 (spike results)
> **Blocks:** WS-1.2, WS-1.4, WS-1.6, WS-2.1, WS-2.7
> **Resolves:** None

---

## 1. Objective

Deliver a production-quality spatial engine for Tarva Launch: the CSS-transform-based Zoomable User Interface (ZUI) that all spatial content renders within. This workstream evolves the validated spike code from WS-0.3 into a robust, composable, and performant engine layer with stable component APIs, a high-frequency camera store, viewport culling, semantic zoom with hysteresis, pan-pause coordination for ambient effects, and URL-synchronized camera state.

**Success looks like:** An engineer renders `<SpatialViewport>` with child elements positioned at world coordinates. Users can pan with momentum, zoom to cursor, see semantic zoom level transitions, and the camera state persists in the URL. Ambient effects in downstream workstreams can subscribe to the pan-pause system to disable expensive effects during motion. All interactions sustain 60fps with 10+ DOM elements inside the spatial canvas.

**Why this workstream matters:** Every subsequent spatial workstream depends on the ZUI engine. WS-1.2 (Launch Atrium) positions capsules on the canvas. WS-1.4 (Navigation Instruments) reads camera state for the minimap and zoom indicator. WS-1.6 (Ambient Effects Layer) subscribes to pan-pause events. WS-2.1 (Morph Choreography) coordinates camera `flyTo` with element transitions. WS-2.7 (Constellation View) uses semantic zoom to switch content representations. The engine must be stable, performant, and well-typed before any of these can begin.

---

## 2. Scope

### In Scope

1. **Camera store** (production) -- Evolve the spike's `camera.store.ts` into a production Zustand store with full TypeScript types, all action methods, derived selectors, and the `subscribe()` pattern for 60fps DOM writes. Add `isPanning` and `isAnimating` flags for pan-pause coordination. [SPEC: AD-1]

2. **Spatial math utilities** (production) -- Evolve the spike's `spatial-math.ts` with all functions fully implemented: `zoomToPoint`, `resolveSemanticLevel`, `applyMomentumDecay`, `computeVelocityFromSamples`, `getVisibleBounds`, `isInViewport`, `springStep`, `clampZoom`, `screenToWorld`, `worldToScreen`. [SPEC: AD-1, AD-2]

3. **SpatialViewport component** -- Production component that fills the screen, captures pointer and wheel events, and renders the spatial canvas plus fixed overlays (slots for minimap, zoom indicator, command palette, particle canvas, scanline overlay). [SPEC: Gap Resolution #1, integration approach]

4. **SpatialCanvas component** -- Production component that applies CSS `transform: translate(x, y) scale(z)` via direct `element.style.transform` writes from a Zustand `subscribe()` call. Children are positioned at world coordinates. [SPEC: Gap Resolution #1]

5. **ViewportCuller component** -- Wrapper that subscribes to camera state, computes visible world-space bounds, and conditionally renders children based on whether their world-space position falls within the viewport (plus a configurable margin). [SPEC: combined-recommendations.md ZUI Engine requirements]

6. **Pan hook** (`usePan`) -- Click-drag pan with velocity tracking from last N pointer samples (N determined by spike report, default 5) and momentum decay (friction per spike report, default 0.92). [SPEC: combined-recommendations.md ZUI Engine requirements]

7. **Zoom hook** (`useZoom`) -- Scroll-wheel zoom with zoom-to-cursor math. Zoom factor and clamping per spike report findings. [SPEC: AD-1]

8. **Semantic zoom hook** (`useSemanticZoom`) -- Reads the current semantic level from the camera store via standard `useStore()` with selector. Returns the level plus transition callbacks for components that need to animate between representations. [SPEC: AD-2]

9. **Viewport cull hook** (`useViewportCull`) -- Lower-level hook used by the `ViewportCuller` component. Computes visible bounds and returns a visibility check function. rAF-debounced. [SPEC: combined-recommendations.md ZUI Engine requirements]

10. **Fly-to hook** (`useFlyTo`) -- Convenience hook that wraps the camera store's `flyTo` method and exposes animation state (`isFlying`, `progress`). Used by WS-1.4 (return-to-hub), WS-2.1 (morph choreography), and WS-2.7 (constellation navigation). [SPEC: AD-1]

11. **Pan-pause hook** (`usePanPause`) -- Debounced hook that exposes `isPanActive` (true during pan/momentum, false after 150ms of stillness). Consumed by WS-1.6 (ambient effects) to pause `backdrop-filter` and expensive CSS animations during camera motion. [SPEC: AD-3, Risk #3 mitigation]

12. **Camera URL sync** (`useCameraSync`) -- Synchronizes camera position to URL search parameters (`?cx=&cy=&cz=`) on settle (after momentum stops and flyTo completes). On initial mount, reads URL params to restore camera position. Uses `history.replaceState` to avoid Next.js router re-renders. [SPEC: AD-1, combined-recommendations.md]

13. **Spatial constants** -- Extend `src/lib/constants.ts` with all spatial constants: zoom range, semantic level thresholds, momentum parameters, spring config, viewport margins, default camera position. [SPEC: AD-2, combined-recommendations.md]

14. **Return-to-hub hotkey** -- Keyboard event handler for Home key that triggers `flyTo(0, 0, 0.50)`. Integrated into `SpatialViewport`. Space key intentionally excluded per WS-1.4 D-5 (conflicts with scroll, button activation, text input). [SPEC: combined-recommendations.md ZUI Engine requirements]

15. **Performance validation** -- Confirm 60fps target with production components and 10+ child elements, using the spike's performance methodology. [SPEC: WS-0.3 go/no-go criteria]

### Out of Scope

- Capsule components, district nodes, or any domain-specific content (WS-1.2, WS-2.2-2.5)
- ParticleCanvas, ScanlineOverlay, FilmGrain, or any ambient effect implementations (WS-1.6)
- Minimap, breadcrumb, zoom indicator, or command palette implementations (WS-1.4)
- Morph choreography state machine or Framer Motion transitions (WS-2.1)
- Constellation view beacon rendering (WS-2.7)
- Telemetry data fetching or display components (WS-1.5)
- Design token values or spatial color palette (WS-0.2 -- consumed, not created)
- Touch/mobile input handling (desktop only per project constraints)
- Supabase, authentication, or session management (WS-1.3)
- Framer Motion animations inside the spatial canvas (prohibited per AD-3)
- Camera Director AI features (Phase 3)
- Unit tests for spatial math (will be added when Vitest is configured in a testing workstream)

---

## 3. Input Dependencies

| Dependency                              | Source                                     | What Is Needed                                                                                                                                                                                                                             | Blocking?                                                                                  |
| --------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| WS-0.1 Project Scaffolding              | Phase 0                                    | Fully buildable Next.js 16 project with TypeScript strict, Tailwind v4, pnpm, directory structure per AD-9, skeleton `camera.store.ts`                                                                                                     | Yes                                                                                        |
| WS-0.3 ZUI Tech Spike                   | Phase 0                                    | Spike report with validated parameters: zoom speed factor, spring config, friction coefficient, `will-change` strategy, pointer-events strategy, culling strategy (unmount vs visibility), transform-origin confirmation, go/no-go verdict | Yes -- production values come from spike findings                                          |
| WS-0.2 Design Tokens Setup              | Phase 0                                    | Spatial CSS custom properties (`--color-void`, `--color-abyss`, `--duration-*`, `--ease-*`) available in `globals.css`                                                                                                                     | Soft dependency -- can use hardcoded values initially and migrate to tokens when available |
| Gap Resolution #1                       | combined-recommendations.md                | CSS transforms architecture decision and integration approach diagram                                                                                                                                                                      | Available (read-only reference)                                                            |
| AD-1: Camera State Management           | combined-recommendations.md                | Zustand `subscribe()` pattern, camera store shape, method signatures, URL sync format                                                                                                                                                      | Available (read-only reference)                                                            |
| AD-2: Semantic Zoom with Hysteresis     | combined-recommendations.md                | 4-level thresholds with 10% hysteresis bands                                                                                                                                                                                               | Available (read-only reference)                                                            |
| AD-3: Three-Tier Animation Architecture | combined-recommendations.md                | Physics-tier (rAF) handles camera; pan-pause coordination with ambient tier                                                                                                                                                                | Available (read-only reference)                                                            |
| Existing Zustand patterns               | `tarva-claude-agents-frontend/src/stores/` | `create()` + `immer` middleware, separate State/Actions interfaces, exported selectors object pattern, `useShallow` for multi-field selectors                                                                                              | Available (read-only reference) [ECOSYSTEM]                                                |

---

## 4. Deliverables

### 4.1 Camera Store

**File:** `src/stores/camera.store.ts`

Evolves the skeleton from WS-0.1 and the spike implementation from WS-0.3 into the production camera store. Follows the Agent Builder pattern of separate `State` and `Actions` interfaces with an exported selectors object. [ECOSYSTEM]

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { zoomToPoint, resolveSemanticLevel, clampZoom, type SpringConfig } from '@/lib/spatial-math'
import { ZOOM_DEFAULT, ZOOM_MIN, ZOOM_MAX, DEFAULT_SPRING_CONFIG } from '@/lib/constants'

// ============================================================
// TYPES
// ============================================================

/** Semantic zoom levels per AD-2. */
export type SemanticZoomLevel = 'Z0' | 'Z1' | 'Z2' | 'Z3'

/**
 * Camera state represents the spatial viewport's position and zoom
 * within the infinite world-space canvas.
 *
 * Coordinate system:
 * - World origin (0, 0) is the Launch Atrium center.
 * - offsetX/offsetY represent the translation of the SpatialCanvas
 *   relative to the viewport's top-left corner.
 * - Positive offsetX moves the canvas rightward (viewport looks left).
 * - Positive offsetY moves the canvas downward (viewport looks up).
 * - zoom is a scale factor: 1.0 = 100%, 0.5 = zoomed out, 2.0 = zoomed in.
 */
export interface CameraState {
  /** World-space X translation in CSS pixels. */
  offsetX: number
  /** World-space Y translation in CSS pixels. */
  offsetY: number
  /** Zoom scale factor. Range: [ZOOM_MIN, ZOOM_MAX]. */
  zoom: number
  /** Current semantic zoom level, derived from zoom + hysteresis. [SPEC: AD-2] */
  semanticLevel: SemanticZoomLevel
  /** True while the camera is moving due to momentum decay or spring animation. */
  isAnimating: boolean
  /** True while the user is actively dragging to pan. */
  isPanning: boolean
}

export interface CameraActions {
  /**
   * Translate the camera by a delta in screen-space pixels.
   * Internally converts to world-space: worldDelta = screenDelta (no zoom
   * division needed because the transform is translate then scale).
   * [SPEC: AD-1]
   */
  panBy: (dx: number, dy: number) => void

  /**
   * Zoom to a target level, preserving the world-space point under the cursor.
   *
   * Uses the zoom-to-cursor formula from spatial-math.ts:
   *   newOffsetX = cursorX - (cursorX - oldOffsetX) * (newZoom / oldZoom)
   *
   * The cursor position must be relative to the SpatialViewport container
   * (not the page), obtained via getBoundingClientRect. [SPEC: AD-1, WS-0.3 D8]
   *
   * @param nextZoom - Target zoom level, clamped to [ZOOM_MIN, ZOOM_MAX].
   * @param cursorX  - Cursor X in viewport-space CSS pixels.
   * @param cursorY  - Cursor Y in viewport-space CSS pixels.
   */
  zoomTo: (nextZoom: number, cursorX: number, cursorY: number) => void

  /**
   * Animate the camera to a world-space target with spring physics.
   *
   * Starts a requestAnimationFrame loop that:
   * 1. Computes spring force for offsetX, offsetY, and zoom independently.
   * 2. Writes updated state to the store via setCamera().
   * 3. Stops when all three values reach rest (atRest === true).
   *
   * Calling flyTo while a previous flyTo is active cancels the previous
   * animation and starts the new one.
   *
   * The spring config comes from the spike report (default: DEFAULT_SPRING_CONFIG).
   * [SPEC: AD-1]
   *
   * @param targetX    - World-space X (the world point that should appear at viewport center).
   * @param targetY    - World-space Y.
   * @param targetZoom - Target zoom level.
   * @param config     - Optional spring physics configuration override.
   */
  flyTo: (
    targetX: number,
    targetY: number,
    targetZoom: number,
    config?: Partial<SpringConfig>
  ) => void

  /**
   * Snap camera to the Launch Atrium: world origin (0, 0) at zoom 0.50,
   * using spring animation.
   *
   * This method computes the offset values that center world point (0, 0)
   * in the viewport: offsetX = viewportWidth / 2, offsetY = viewportHeight / 2.
   * Viewport dimensions must be provided (obtained from the SpatialViewport ref).
   * [SPEC: combined-recommendations.md "Return-to-hub"]
   */
  resetToLaunch: (viewportWidth: number, viewportHeight: number) => void

  /**
   * Set the full camera state. Used by animation loops (momentum, flyTo).
   * Recalculates semanticLevel via resolveSemanticLevel() on every call.
   * [INFERENCE: semantic level must stay in sync during animation frames]
   */
  setCamera: (patch: Partial<CameraState>) => void

  /** Set the isPanning flag. Used by usePan to signal active drag state. */
  setPanning: (panning: boolean) => void

  /** Set the isAnimating flag. Used by momentum and flyTo loops. */
  setAnimating: (animating: boolean) => void

  /**
   * Cancel any active flyTo or momentum animation.
   * Sets isAnimating to false and clears the rAF loop reference.
   */
  cancelAnimation: () => void
}

export type CameraStore = CameraState & CameraActions
```

**Initial state:**

```typescript
const INITIAL_STATE: CameraState = {
  offsetX: 0,
  offsetY: 0,
  zoom: ZOOM_DEFAULT, // 0.50 per AD-1
  semanticLevel: 'Z1',
  isAnimating: false,
  isPanning: false,
}
```

**Store creation:**

```typescript
// Internal mutable ref for the active animation frame ID.
// Stored outside Zustand to avoid triggering subscriptions.
let _animationFrameId: number | null = null

export const useCameraStore = create<CameraStore>()(
  immer((set, get) => ({
    ...INITIAL_STATE,

    panBy: (dx, dy) =>
      set((state) => {
        state.offsetX += dx
        state.offsetY += dy
      }),

    zoomTo: (nextZoom, cursorX, cursorY) =>
      set((state) => {
        const clamped = clampZoom(nextZoom)
        const { offsetX, offsetY } = zoomToPoint(
          state.offsetX,
          state.offsetY,
          state.zoom,
          clamped,
          cursorX,
          cursorY
        )
        state.offsetX = offsetX
        state.offsetY = offsetY
        state.zoom = clamped
        state.semanticLevel = resolveSemanticLevel(clamped, state.semanticLevel)
      }),

    flyTo: (targetX, targetY, targetZoom, config) => {
      // Implementation: start rAF loop using springStep().
      // Cancel any existing animation first.
      // Convert world-space target to offset values:
      //   targetOffsetX = viewportWidth/2 - targetX * targetZoom
      //   targetOffsetY = viewportHeight/2 - targetY * targetZoom
      // (Viewport dimensions obtained from a module-level ref or passed via closure.)
      //
      // The rAF loop calls springStep() for each of offsetX, offsetY, zoom,
      // writes results via set(), and stops when all three atRest.
      //
      // Full implementation evolves from WS-0.3 spike code.
      get().cancelAnimation()
      set((state) => {
        state.isAnimating = true
      })
      // ... rAF loop (see implementation notes below)
    },

    resetToLaunch: (viewportWidth, viewportHeight) => {
      const targetOffsetX = viewportWidth / 2
      const targetOffsetY = viewportHeight / 2
      get().flyTo(0, 0, ZOOM_DEFAULT)
      // Note: flyTo converts world target (0,0) to offset using viewport dims.
    },

    setCamera: (patch) =>
      set((state) => {
        if (patch.offsetX !== undefined) state.offsetX = patch.offsetX
        if (patch.offsetY !== undefined) state.offsetY = patch.offsetY
        if (patch.zoom !== undefined) {
          state.zoom = patch.zoom
          state.semanticLevel = resolveSemanticLevel(patch.zoom, state.semanticLevel)
        }
        if (patch.isPanning !== undefined) state.isPanning = patch.isPanning
        if (patch.isAnimating !== undefined) state.isAnimating = patch.isAnimating
      }),

    setPanning: (panning) =>
      set((state) => {
        state.isPanning = panning
      }),

    setAnimating: (animating) =>
      set((state) => {
        state.isAnimating = animating
      }),

    cancelAnimation: () => {
      if (_animationFrameId !== null) {
        cancelAnimationFrame(_animationFrameId)
        _animationFrameId = null
      }
      set((state) => {
        state.isAnimating = false
      })
    },
  }))
)
```

**Selectors** (exported separately, per Agent Builder `wizardSelectors` pattern): [ECOSYSTEM]

```typescript
export const cameraSelectors = {
  /** Get the current semantic zoom level. */
  semanticLevel: (state: CameraState): SemanticZoomLevel => state.semanticLevel,

  /** Check if the camera is in motion (panning, momentum, or flyTo). */
  isMoving: (state: CameraState): boolean => state.isPanning || state.isAnimating,

  /** Get the CSS transform string for direct DOM writes. */
  transformString: (state: CameraState): string =>
    `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`,

  /** Get the camera position as URL-safe rounded values. */
  urlParams: (state: CameraState): { cx: string; cy: string; cz: string } => ({
    cx: state.offsetX.toFixed(2),
    cy: state.offsetY.toFixed(2),
    cz: state.zoom.toFixed(2),
  }),

  /** Check if the camera is at the default launch position (within threshold). */
  isAtLaunch: (state: CameraState): boolean => {
    const threshold = 1.0
    return (
      Math.abs(state.offsetX) < threshold &&
      Math.abs(state.offsetY) < threshold &&
      Math.abs(state.zoom - ZOOM_DEFAULT) < 0.01
    )
  },
}
```

**Implementation notes:**

- The `flyTo` method needs access to viewport dimensions to convert world-space targets to offset values. Two approaches are acceptable: (a) store viewport dimensions in the camera store, set by `SpatialViewport` on mount and resize; or (b) accept viewport dimensions as parameters in `flyTo`. Approach (a) is preferred because it keeps the `flyTo` call site clean for downstream consumers (WS-1.4, WS-2.1). [INFERENCE]
- The module-level `_animationFrameId` variable is intentionally outside the Zustand store to avoid triggering subscriptions when it changes. This follows the same principle as the `subscribe()` pattern: keep high-frequency mutable state out of React's render cycle. [INFERENCE]
- The `immer` middleware is retained for the production store because the `subscribe()` pattern (used by `SpatialCanvas` for DOM writes) bypasses React reconciliation entirely. The `immer` overhead only applies to the state update functions themselves, which run at most once per rAF frame -- well within budget. [ECOSYSTEM: WS-0.3 D2]

### 4.2 Spatial Math Utilities

**File:** `src/lib/spatial-math.ts`

Evolves the spike's spatial math into production utilities. All functions are pure (no side effects), fully typed, and independently testable. Function signatures match the spike specification with two additions: `clampZoom`, `screenToWorld`, and `worldToScreen`.

```typescript
// ============================================================
// TYPES
// ============================================================

import type { SemanticZoomLevel } from '@/stores/camera.store'

/** Spring physics configuration. */
export interface SpringConfig {
  /** Spring tension / stiffness. Higher = snappier. */
  stiffness: number
  /** Damping ratio. Higher = less oscillation. */
  damping: number
  /** Mass of the simulated object. Higher = more sluggish. */
  mass: number
  /** Velocity magnitude below which the spring is considered at rest. */
  restThreshold: number
}

/** 2D velocity vector in px/frame. */
export interface Velocity {
  vx: number
  vy: number
}

/** Axis-aligned bounding box in world-space coordinates. */
export interface WorldBounds {
  left: number
  top: number
  right: number
  bottom: number
}

/** A timed pointer sample for velocity computation. */
export interface PointerSample {
  x: number
  y: number
  /** Timestamp in ms (performance.now() or Date.now()). */
  t: number
}

/** Configuration for a single semantic zoom level. [SPEC: AD-2] */
export interface ZoomLevelConfig {
  level: SemanticZoomLevel
  /** Enter this level when zoom >= enterMin (zooming in from below). */
  enterMin: number
  /** Enter this level when zoom < enterMax (zooming out from above). */
  enterMax: number
  /** Exit to lower level when zoom < exitBelow. */
  exitBelow: number
  /** Exit to higher level when zoom >= exitAbove. */
  exitAbove: number
}

/** Result of a single spring physics step. */
export interface SpringStepResult {
  value: number
  velocity: number
  atRest: boolean
}

/** Result of a 2D coordinate transformation. */
export interface Point2D {
  x: number
  y: number
}

// ============================================================
// ZOOM-TO-CURSOR
// ============================================================

/**
 * Calculate new camera offset after zooming, preserving the world-space
 * point under the cursor.
 *
 * Formula (derived in WS-0.3 Appendix B):
 *   newOffsetX = cursorX - (cursorX - oldOffsetX) * (newZoom / oldZoom)
 *   newOffsetY = cursorY - (cursorY - oldOffsetY) * (newZoom / oldZoom)
 *
 * The cursor position must be relative to the SpatialViewport container.
 * [SPEC: AD-1, WS-0.3 Appendix B]
 */
export function zoomToPoint(
  oldOffsetX: number,
  oldOffsetY: number,
  oldZoom: number,
  newZoom: number,
  cursorX: number,
  cursorY: number
): { offsetX: number; offsetY: number }

// ============================================================
// ZOOM CLAMPING
// ============================================================

/**
 * Clamp a zoom value to the valid range [ZOOM_MIN, ZOOM_MAX].
 */
export function clampZoom(zoom: number): number

// ============================================================
// SEMANTIC ZOOM WITH HYSTERESIS
// ============================================================

/**
 * Zoom level thresholds with 10% hysteresis bands. [SPEC: AD-2]
 *
 * | Level | Enter At      | Exit At                     |
 * |-------|---------------|-----------------------------|
 * | Z0    | zoom < 0.27   | zoom >= 0.30                |
 * | Z1    | 0.30 - 0.79   | zoom < 0.27 or zoom >= 0.80 |
 * | Z2    | 0.80 - 1.49   | zoom < 0.72 or zoom >= 1.50 |
 * | Z3    | zoom >= 1.50  | zoom < 1.35                 |
 */
export const ZOOM_LEVELS: readonly ZoomLevelConfig[]

/**
 * Resolve the semantic zoom level given the current zoom value and the
 * previous semantic level (for hysteresis).
 *
 * If the zoom is within a hysteresis band, the previous level is preserved.
 * Only when the zoom fully crosses the band does the level change.
 * [SPEC: AD-2, WS-0.3 Appendix C]
 *
 * @param zoom         - Current zoom value.
 * @param currentLevel - The previous semantic level (for hysteresis state).
 * @returns The resolved semantic level.
 */
export function resolveSemanticLevel(
  zoom: number,
  currentLevel: SemanticZoomLevel
): SemanticZoomLevel

// ============================================================
// MOMENTUM PHYSICS
// ============================================================

/**
 * Apply momentum decay to a velocity vector.
 *
 * Each frame: v *= friction. If magnitude < threshold, snap to zero.
 * [SPEC: combined-recommendations.md, 0.92 friction per frame]
 *
 * @param velocity  - Current velocity in px/frame.
 * @param friction  - Decay multiplier per frame. Default from spike report (fallback 0.92).
 * @param threshold - Minimum velocity magnitude to continue. Default from spike report (fallback 0.5).
 * @returns Updated velocity. Returns { vx: 0, vy: 0 } if below threshold.
 */
export function applyMomentumDecay(
  velocity: Velocity,
  friction?: number,
  threshold?: number
): Velocity

/**
 * Compute average velocity from the last N timed pointer samples.
 *
 * Returns velocity in px/ms. The caller converts to px/frame by multiplying
 * by the frame duration (16.67ms at 60fps).
 *
 * Handles edge cases:
 * - Fewer than 2 samples: returns { vx: 0, vy: 0 }.
 * - Samples with identical timestamps: skips duplicates.
 * - Time span of 0: returns { vx: 0, vy: 0 }.
 * [SPEC: combined-recommendations.md, velocity tracked from last 5 pointer samples]
 *
 * @param samples - Array of timed pointer positions, ordered chronologically.
 * @returns Average velocity in px/ms.
 */
export function computeVelocityFromSamples(samples: PointerSample[]): Velocity

// ============================================================
// VIEWPORT CULLING
// ============================================================

/**
 * Compute the visible world-space bounds given viewport dimensions
 * and camera state.
 *
 * World-space bounds are the inverse of the CSS transform:
 *   visibleLeft   = -offsetX / zoom
 *   visibleTop    = -offsetY / zoom
 *   visibleRight  = (viewportWidth - offsetX) / zoom
 *   visibleBottom = (viewportHeight - offsetY) / zoom
 *
 * The margin extends the visible area in all directions to prevent
 * pop-in when panning quickly.
 * [SPEC: combined-recommendations.md, debounced via rAF]
 *
 * @param viewportWidth  - Viewport container width in CSS pixels.
 * @param viewportHeight - Viewport container height in CSS pixels.
 * @param offsetX        - Camera X offset.
 * @param offsetY        - Camera Y offset.
 * @param zoom           - Current zoom level.
 * @param margin         - Extra margin in world-space pixels. Default from spike report (fallback 200).
 * @returns Axis-aligned bounding box in world-space coordinates.
 */
export function getVisibleBounds(
  viewportWidth: number,
  viewportHeight: number,
  offsetX: number,
  offsetY: number,
  zoom: number,
  margin?: number
): WorldBounds

/**
 * Check whether a rectangle at a world-space position intersects the
 * visible bounds.
 *
 * @param elementX      - Element's world-space X (top-left corner).
 * @param elementY      - Element's world-space Y (top-left corner).
 * @param elementWidth  - Element width in world-space pixels.
 * @param elementHeight - Element height in world-space pixels.
 * @param visibleBounds - The visible world-space bounds from getVisibleBounds.
 * @returns True if the element intersects the visible area.
 */
export function isInViewport(
  elementX: number,
  elementY: number,
  elementWidth: number,
  elementHeight: number,
  visibleBounds: WorldBounds
): boolean

// ============================================================
// COORDINATE TRANSFORMS
// ============================================================

/**
 * Convert a screen-space point (relative to the viewport) to world-space.
 *
 *   worldX = (screenX - offsetX) / zoom
 *   worldY = (screenY - offsetY) / zoom
 *
 * Used by click handlers that need to determine which world-space element
 * was clicked.
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
): Point2D

/**
 * Convert a world-space point to screen-space (relative to the viewport).
 *
 *   screenX = worldX * zoom + offsetX
 *   screenY = worldY * zoom + offsetY
 *
 * Used by the minimap (WS-1.4) to position the viewport rectangle.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
): Point2D

// ============================================================
// SPRING ANIMATION
// ============================================================

/**
 * Compute one frame of spring physics for a single scalar value.
 *
 * Uses a semi-implicit Euler integration:
 *   force = -stiffness * (current - target) - damping * velocity
 *   acceleration = force / mass
 *   newVelocity = velocity + acceleration * dt
 *   newValue = current + newVelocity * dt
 *
 * The spring is at rest when both the displacement and velocity are
 * below the restThreshold.
 *
 * @param current  - Current value.
 * @param target   - Target value.
 * @param velocity - Current velocity.
 * @param config   - Spring configuration.
 * @param dt       - Time step in seconds (typically 1/60 for 60fps).
 * @returns Updated value, velocity, and atRest flag.
 */
export function springStep(
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig,
  dt: number
): SpringStepResult
```

### 4.3 Spatial Constants

**File:** `src/lib/constants.ts` (extend the existing file from WS-0.1)

Add all spatial constants. Values marked "from spike report" should be updated after WS-0.3 completes; the defaults below are the specification values that the spike starts with.

```typescript
// ============================================================
// SPATIAL ENGINE CONSTANTS
// ============================================================

// --- Zoom ---
/** Minimum zoom level (Z0 far out). [SPEC: combined-recommendations.md] */
export const ZOOM_MIN = 0.08
/** Maximum zoom level (Z3 close). [SPEC: combined-recommendations.md] */
export const ZOOM_MAX = 3.0
/** Default zoom level (Z1 Launch Atrium landing). [SPEC: AD-1] */
export const ZOOM_DEFAULT = 0.5

// --- Semantic Zoom Thresholds (AD-2) ---
/** Z0 -> Z1 transition: enter Z1 when zoom >= this value. */
export const Z0_TO_Z1_ENTER = 0.3
/** Z1 -> Z0 transition: exit Z1 when zoom < this value. */
export const Z1_TO_Z0_EXIT = 0.27
/** Z1 -> Z2 transition: enter Z2 when zoom >= this value. */
export const Z1_TO_Z2_ENTER = 0.8
/** Z2 -> Z1 transition: exit Z2 when zoom < this value. */
export const Z2_TO_Z1_EXIT = 0.72
/** Z2 -> Z3 transition: enter Z3 when zoom >= this value. */
export const Z2_TO_Z3_ENTER = 1.5
/** Z3 -> Z2 transition: exit Z3 when zoom < this value. */
export const Z3_TO_Z2_EXIT = 1.35

// --- Momentum ---
/** Friction decay factor per frame. [SPEC: combined-recommendations.md, 0.92] */
export const MOMENTUM_FRICTION = 0.92
/** Number of pointer samples used for velocity averaging. [SPEC: 5 samples] */
export const MOMENTUM_SAMPLES = 5
/** Minimum velocity magnitude (px/frame) before momentum stops. */
export const MOMENTUM_STOP_THRESHOLD = 0.5

// --- Spring Physics ---
/** Default spring configuration for flyTo animations. Values from spike report. */
export const DEFAULT_SPRING_CONFIG = {
  stiffness: 170,
  damping: 26,
  mass: 1,
  restThreshold: 0.01,
} as const

// --- Viewport ---
/** World-space margin for viewport culling (prevents pop-in). [SPEC: 200px] */
export const VIEWPORT_CULL_MARGIN = 200

// --- Pan-Pause ---
/** Delay in ms after last pan activity before ambient effects resume. [SPEC: AD-3, 150ms] */
export const PAN_PAUSE_DELAY_MS = 150

// --- Zoom Speed ---
/**
 * Scroll-wheel delta multiplier for zoom.
 * newZoom = currentZoom * (1 + normalizedDelta * ZOOM_SPEED_FACTOR).
 * Value from spike report (fallback 0.001).
 * [INFERENCE: tuned during WS-0.3 spike]
 */
export const ZOOM_SPEED_FACTOR = 0.001

// --- Default Camera Position ---
/** Default camera offset (world origin at viewport center). */
export const DEFAULT_CAMERA_OFFSET_X = 0
export const DEFAULT_CAMERA_OFFSET_Y = 0

// --- Layout ---
/** Capsule ring radius from center. [SPEC: combined-recommendations.md Launch Atrium] */
export const CAPSULE_RING_RADIUS = 300
/** Angular spacing between capsules in degrees. [SPEC: 60 degrees for 6 capsules] */
export const CAPSULE_ANGULAR_SPACING = 60
```

### 4.4 SpatialViewport Component

**File:** `src/components/spatial/SpatialViewport.tsx`

The outermost container for the spatial engine. Fills the viewport, captures all pointer and wheel events, and provides slot-based composition for fixed overlays. This component owns the viewport dimensions and provides them to the camera store.

```typescript
'use client'

import { useRef, useEffect, useCallback, type ReactNode, type RefObject } from 'react'
import { usePan } from '@/hooks/use-pan'
import { useZoom } from '@/hooks/use-zoom'
import { useCameraSync } from '@/hooks/use-camera-sync'
import { useCameraStore } from '@/stores/camera.store'

export interface SpatialViewportProps {
  /** The SpatialCanvas and its children. Required. */
  children: ReactNode
  /**
   * Fixed overlay elements rendered on top of the spatial canvas.
   * These are NOT affected by the CSS transform. Positioned via
   * CSS fixed/absolute within the viewport.
   *
   * Intended consumers:
   * - ParticleCanvas (WS-1.6) — pointer-events: none
   * - ScanlineOverlay (WS-1.6) — pointer-events: none
   * - Minimap (WS-1.4) — interactive, positioned bottom-right
   * - ZoomIndicator (WS-1.4) — non-interactive, positioned top-right
   * - CommandPalette (WS-1.4) — interactive, z-50
   */
  overlays?: ReactNode
  /**
   * Background color class. Defaults to the void background.
   * [SPEC: VISUAL-DESIGN-SPEC.md 1.2, --color-void]
   */
  className?: string
  /**
   * Whether to enable URL sync for camera position.
   * When true, camera position is serialized to ?cx=&cy=&cz= on settle.
   * Default: true. [SPEC: AD-1]
   */
  enableUrlSync?: boolean
  /**
   * Whether to enable return-to-hub keyboard shortcut (Home key).
   * Default: true. [SPEC: combined-recommendations.md]
   */
  enableKeyboardShortcuts?: boolean
}

/**
 * SpatialViewport is the root container for the ZUI engine.
 *
 * Responsibilities:
 * 1. Fills the screen (width: 100vw, height: 100vh, overflow: hidden).
 * 2. Captures pointer events for pan (via usePan hook).
 * 3. Captures wheel events for zoom (via useZoom hook).
 * 4. Measures its own dimensions and provides them to the camera store.
 * 5. Handles keyboard shortcut (Home for return-to-hub).
 * 6. Renders children (SpatialCanvas) and fixed overlays.
 * 7. Manages URL sync lifecycle (via useCameraSync hook).
 *
 * CSS: position: fixed; inset: 0; overflow: hidden;
 * The viewport background uses --color-void (#050911).
 *
 * [SPEC: Gap Resolution #1, integration approach diagram]
 */
export function SpatialViewport({
  children,
  overlays,
  className,
  enableUrlSync = true,
  enableKeyboardShortcuts = true,
}: SpatialViewportProps): JSX.Element
```

**Implementation details:**

- The viewport `ref` is passed to `usePan` and `useZoom` for pointer/wheel event attachment.
- On mount and window resize, the viewport measures its `clientWidth` and `clientHeight` and stores them in a ref (or a lightweight Zustand slice) for use by `flyTo`, `resetToLaunch`, and `getVisibleBounds`.
- Keyboard handler for Home key: calls `useCameraStore.getState().resetToLaunch(width, height)`. The handler checks `document.activeElement` to avoid firing when the user is typing in an input field (relevant for WS-1.4 command palette). Space key intentionally excluded per WS-1.4 D-5. [INFERENCE]
- The component uses `tabIndex={0}` to ensure it is focusable for keyboard events, or attaches the keyboard listener to `window`. [INFERENCE]

### 4.5 SpatialCanvas Component

**File:** `src/components/spatial/SpatialCanvas.tsx`

The CSS-transformed container. This is the performance-critical component that bypasses React reconciliation for transform updates.

```typescript
'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { useCameraStore, cameraSelectors } from '@/stores/camera.store'

export interface SpatialCanvasProps {
  /** Spatial content positioned at world coordinates. */
  children: ReactNode
  /**
   * Additional CSS classes for the canvas container.
   * Do NOT add backdrop-filter or animation classes here -- they belong
   * on child elements or overlay layers. [SPEC: AD-3]
   */
  className?: string
}

/**
 * SpatialCanvas is the CSS-transformed container for all spatial content.
 *
 * This is the critical performance component in the ZUI engine. It:
 *
 * 1. Renders a single <div> with `will-change: transform` and
 *    `transform-origin: 0 0`. [SPEC: WS-0.3 Q3 resolution]
 *
 * 2. Subscribes to the camera store via `useCameraStore.subscribe()` --
 *    NOT `useCameraStore()` -- to read offsetX, offsetY, zoom without
 *    triggering React re-renders. [SPEC: AD-1]
 *
 * 3. On each store update, writes:
 *    element.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`
 *    directly via the container ref. [SPEC: Gap Resolution #1]
 *
 * 4. Children use `position: absolute` and are positioned at world
 *    coordinates (left/top in world-space pixels).
 *
 * CSS:
 *   position: absolute;
 *   transform-origin: 0 0;
 *   will-change: transform;
 *
 * IMPORTANT: Do NOT use Framer Motion `layout` animations on this element
 * or its direct children. They conflict with the parent CSS transform.
 * Use Framer Motion `animate` prop with explicit values instead. [SPEC: AD-3]
 *
 * [SPEC: Gap Resolution #1, integration approach diagram]
 */
export function SpatialCanvas({ children, className }: SpatialCanvasProps): JSX.Element
```

**Implementation pattern for the subscribe() bypass:**

```typescript
// Inside SpatialCanvas:
const containerRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const el = containerRef.current
  if (!el) return

  // Subscribe to the raw store -- this callback fires on EVERY state change,
  // but it never triggers a React re-render. It writes directly to the DOM.
  const unsubscribe = useCameraStore.subscribe((state) => {
    el.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`
  })

  // Set initial transform
  const initial = useCameraStore.getState()
  el.style.transform = `translate(${initial.offsetX}px, ${initial.offsetY}px) scale(${initial.zoom})`

  return unsubscribe
}, [])
```

### 4.6 ViewportCuller Component

**File:** `src/components/spatial/ViewportCuller.tsx`

Wraps spatial children and conditionally renders them based on viewport visibility.

```typescript
'use client'

import { type ReactNode } from 'react'
import { useViewportCull } from '@/hooks/use-viewport-cull'

export interface CullableChild {
  /** Unique key for React reconciliation. */
  id: string
  /** World-space X position (top-left corner). */
  x: number
  /** World-space Y position (top-left corner). */
  y: number
  /** Width in world-space pixels. */
  width: number
  /** Height in world-space pixels. */
  height: number
  /** The React element to render if visible. */
  element: ReactNode
}

export interface ViewportCullerProps {
  /**
   * Array of children with their world-space positions and dimensions.
   * Children outside the visible viewport (plus margin) are unmounted.
   */
  children: CullableChild[]
  /**
   * Extra margin in world-space pixels around the viewport.
   * Elements within this margin are still rendered to prevent pop-in
   * during fast panning.
   * Default: VIEWPORT_CULL_MARGIN (200). [SPEC: combined-recommendations.md]
   */
  margin?: number
}

/**
 * ViewportCuller subscribes to camera state and unmounts children whose
 * world-space positions fall outside the visible viewport bounds.
 *
 * The visibility check is rAF-debounced: the component subscribes to the
 * camera store via subscribe() and recalculates visible bounds at most
 * once per animation frame, then triggers a React re-render only when
 * the set of visible children changes.
 *
 * Culling strategy: unmount (not visibility: hidden). Per WS-0.3 spike
 * recommendation. Unmounting frees DOM nodes, which is more important
 * for performance than avoiding remount cost when the total node count
 * can reach 20+ at Z1 with all capsules, labels, and decorative elements.
 * [INFERENCE: based on expected spike findings; update if spike recommends otherwise]
 *
 * [SPEC: combined-recommendations.md ZUI Engine requirements]
 */
export function ViewportCuller({ children, margin }: ViewportCullerProps): JSX.Element
```

### 4.7 Hooks

#### 4.7.1 usePan

**File:** `src/hooks/use-pan.ts`

```typescript
'use client'

import type { RefObject } from 'react'

/**
 * Hook that manages click-drag pan with momentum.
 *
 * Behavior:
 * 1. On pointerdown: sets isPanning = true, begins tracking pointer samples.
 * 2. On pointermove (while dragging): calls camera.panBy(dx, dy) each frame.
 *    Records the pointer position + timestamp into a circular buffer of
 *    MOMENTUM_SAMPLES entries. [SPEC: 5 samples]
 * 3. On pointerup: sets isPanning = false. If the release velocity exceeds
 *    MOMENTUM_STOP_THRESHOLD, starts a rAF momentum loop:
 *    - Each frame: velocity *= MOMENTUM_FRICTION, camera.panBy(vx, vy).
 *    - Stops when velocity magnitude < MOMENTUM_STOP_THRESHOLD.
 *    - Sets isAnimating = true during momentum, false when stopped.
 * 4. Uses setPointerCapture for reliable drag tracking across viewport edges.
 *
 * This hook does NOT attach pointer events declaratively (no onPointerDown
 * props). It attaches imperative event listeners to the viewport ref using
 * useEffect, because pointer events need { passive: false } for
 * setPointerCapture to work correctly in all browsers. [INFERENCE]
 *
 * @param viewportRef - Ref to the SpatialViewport container element.
 */
export function usePan(viewportRef: RefObject<HTMLDivElement | null>): void
```

#### 4.7.2 useZoom

**File:** `src/hooks/use-zoom.ts`

```typescript
'use client'

import type { RefObject } from 'react'

/**
 * Hook that handles scroll-wheel zoom with zoom-to-cursor.
 *
 * Behavior:
 * 1. Attaches a wheel event listener to the viewport ref.
 * 2. On wheel event:
 *    a. Prevents default (no page scroll inside viewport).
 *    b. Computes cursor position relative to viewport via getBoundingClientRect.
 *    c. Normalizes delta: `normalizedDelta = -event.deltaY` (negative = zoom in).
 *       Handles deltaMode (pixel, line, page) normalization. [INFERENCE]
 *    d. Computes new zoom: `newZoom = currentZoom * (1 + normalizedDelta * ZOOM_SPEED_FACTOR)`.
 *    e. Clamps to [ZOOM_MIN, ZOOM_MAX].
 *    f. Calls camera.zoomTo(newZoom, cursorX, cursorY).
 *
 * The listener is attached with { passive: false } to allow preventDefault.
 * [SPEC: AD-1, combined-recommendations.md]
 *
 * @param viewportRef - Ref to the SpatialViewport container element.
 */
export function useZoom(viewportRef: RefObject<HTMLDivElement | null>): void
```

#### 4.7.3 useSemanticZoom

**File:** `src/hooks/use-semantic-zoom.ts`

```typescript
'use client'

import type { SemanticZoomLevel } from '@/stores/camera.store'

/**
 * Hook that reads the current semantic zoom level from the camera store.
 *
 * Uses standard `useCameraStore()` with a selector (not subscribe()),
 * because semantic level changes are low-frequency (at most 6 transitions
 * across the full zoom range) and React re-renders at these boundaries
 * are expected -- components need to switch their visual representation.
 *
 * Returns the level and a convenience boolean for each level.
 * [SPEC: AD-2]
 */
export function useSemanticZoom(): {
  /** Current semantic zoom level. */
  level: SemanticZoomLevel
  /** Current zoom value (numeric). */
  zoom: number
  /** True when at Z0 (Constellation view). */
  isConstellation: boolean
  /** True when at Z1 (Launch Atrium, default landing). */
  isAtrium: boolean
  /** True when at Z2 (District view). */
  isDistrict: boolean
  /** True when at Z3 (Station view). */
  isStation: boolean
}
```

#### 4.7.4 useViewportCull

**File:** `src/hooks/use-viewport-cull.ts`

```typescript
'use client'

import type { WorldBounds } from '@/lib/spatial-math'

/**
 * Hook that subscribes to camera state, computes visible world-space bounds,
 * and returns a function to check element visibility.
 *
 * The bounds are recalculated using requestAnimationFrame debouncing:
 * the subscribe() callback sets a dirty flag, and the rAF callback
 * computes bounds only when dirty. This avoids computing bounds on
 * every micro-update during smooth pan/zoom.
 *
 * Viewport dimensions are read from the viewport ref (or a stored value)
 * and updated on window resize.
 *
 * @param margin - Extra world-space margin around viewport. Default: VIEWPORT_CULL_MARGIN.
 * @returns Object with:
 *   - bounds: current visible world-space bounds (updated per rAF).
 *   - isVisible: function to check if a world-space rect is visible.
 *
 * [SPEC: combined-recommendations.md ZUI Engine requirements]
 */
export function useViewportCull(margin?: number): {
  /** Current visible world-space bounds (updated at rAF frequency). */
  bounds: WorldBounds
  /**
   * Check if a world-space rectangle is within the visible viewport.
   * @param x      - Element world-space X (top-left).
   * @param y      - Element world-space Y (top-left).
   * @param width  - Element width in world-space pixels.
   * @param height - Element height in world-space pixels.
   */
  isVisible: (x: number, y: number, width: number, height: number) => boolean
}
```

#### 4.7.5 useFlyTo

**File:** `src/hooks/use-fly-to.ts`

```typescript
'use client'

import type { SpringConfig } from '@/lib/spatial-math'

/**
 * Convenience hook that wraps the camera store's flyTo method and exposes
 * animation state for UI feedback.
 *
 * Consumers:
 * - WS-1.4: return-to-hub button/hotkey
 * - WS-2.1: morph choreography (camera focuses on selected district)
 * - WS-2.7: constellation navigation (click beacon to fly to district)
 *
 * [SPEC: AD-1]
 */
export function useFlyTo(): {
  /**
   * Fly the camera to center a world-space point at the given zoom.
   * @param worldX     - Target world-space X.
   * @param worldY     - Target world-space Y.
   * @param targetZoom - Target zoom level.
   * @param config     - Optional spring config override.
   */
  flyTo: (
    worldX: number,
    worldY: number,
    targetZoom: number,
    config?: Partial<SpringConfig>
  ) => void

  /** Fly to Launch Atrium: world origin (0, 0) at zoom 0.50. */
  flyToLaunch: () => void

  /** Cancel any active flyTo animation. */
  cancel: () => void

  /** True while a flyTo animation is in progress. */
  isFlying: boolean
}
```

#### 4.7.6 usePanPause

**File:** `src/hooks/use-pan-pause.ts`

```typescript
'use client'

/**
 * Hook that provides a debounced pan-active signal for ambient effects.
 *
 * The pan-pause system coordinates the Physics tier (camera motion) with
 * the Ambient tier (CSS effects, backdrop-filter). During active panning
 * or momentum, expensive visual effects should be disabled to maintain
 * 60fps. They resume after PAN_PAUSE_DELAY_MS (150ms) of stillness.
 * [SPEC: AD-3, Risk #3 mitigation]
 *
 * Implementation:
 * 1. Subscribes to camera store's isPanning and isAnimating flags.
 * 2. When either becomes true: immediately sets isPanActive = true.
 * 3. When both become false: starts a setTimeout(PAN_PAUSE_DELAY_MS).
 *    If neither becomes true again before the timeout fires,
 *    sets isPanActive = false.
 * 4. If panning resumes during the timeout, clears the timeout.
 *
 * Consumers:
 * - WS-1.6 (Ambient Effects Layer): disable backdrop-filter, pause CSS animations.
 * - WS-1.2 (Launch Atrium): optionally suppress hover effects during pan.
 *
 * This hook is designed to be called once, high in the component tree
 * (e.g., inside SpatialViewport), with the result passed down via context
 * or consumed via a separate Zustand flag on the camera store. [INFERENCE]
 */
export function usePanPause(): {
  /**
   * True during active camera motion (pan, momentum, or flyTo)
   * and for PAN_PAUSE_DELAY_MS after motion stops.
   */
  isPanActive: boolean
}
```

#### 4.7.7 useCameraSync

**File:** `src/hooks/use-camera-sync.ts`

```typescript
'use client'

/**
 * Hook that synchronizes camera position with URL search parameters.
 *
 * URL format: ?cx=<offsetX>&cy=<offsetY>&cz=<zoom>
 * Values are rounded to 2 decimal places. [SPEC: AD-1]
 *
 * Behavior:
 *
 * 1. On mount: reads cx, cy, cz from the current URL search params.
 *    If present and valid, calls camera.setCamera() to restore position.
 *    If absent or invalid, uses default camera state. [SPEC: AD-1]
 *
 * 2. On settle (isPanning === false AND isAnimating === false):
 *    writes the current camera position to URL via history.replaceState().
 *    Uses a debounce (same as PAN_PAUSE_DELAY_MS, 150ms) to avoid
 *    writing during rapid settle/unsettle cycles. [SPEC: AD-1]
 *
 * URL writes use `window.history.replaceState()` (not `router.replace()`
 * or `router.push()`) to avoid triggering Next.js re-renders or route
 * transitions. The URL is updated for shareability and browser history,
 * but the camera store is the source of truth during runtime. [INFERENCE]
 *
 * This hook should be called once, inside SpatialViewport. It is gated
 * by the `enableUrlSync` prop on SpatialViewport. [INFERENCE]
 */
export function useCameraSync(): void
```

### 4.8 Pan-Pause Event System

The pan-pause system is not a separate event bus or EventTarget. It is implemented as a combination of:

1. **Camera store flags** (`isPanning`, `isAnimating`) -- set by `usePan` and `flyTo`/momentum loops.
2. **`usePanPause` hook** -- debounces the flags into a single `isPanActive` boolean with the 150ms delay.
3. **Consumption pattern** -- downstream components (ambient effects, capsule hover) use `usePanPause()` to check whether to enable expensive effects.

This design avoids a custom event system. The camera store is the single source of truth for motion state, and the debounce logic lives in the hook. [INFERENCE]

**Consumption example (for WS-1.6 reference):**

```typescript
// In an ambient effect component (WS-1.6):
function ParticleCanvas() {
  const { isPanActive } = usePanPause()

  // Pause particle animation during pan for performance
  useEffect(() => {
    if (isPanActive) {
      pauseParticles()
    } else {
      resumeParticles()
    }
  }, [isPanActive])

  // ...
}
```

**Consumption example for backdrop-filter (WS-1.6 / WS-1.2 reference):**

```typescript
// On a capsule or glass panel component:
function CapsuleNode({ isPanActive }: { isPanActive: boolean }) {
  return (
    <div
      className="rounded-[28px] transition-[backdrop-filter] duration-150"
      style={{
        backdropFilter: isPanActive ? 'none' : 'blur(12px)',
      }}
    >
      {/* ... */}
    </div>
  )
}
```

### 4.9 Performance Requirements

| Metric                                                 | Target                                                                | Measurement Method                                                  | Fallback                                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| FPS during sustained pan (10 elements, no blur)        | >= 55 avg, >= 45 min                                                  | Chrome DevTools Performance panel + built-in FPS monitor from spike | If < 55, profile and optimize subscribe() callback; reduce DOM complexity          |
| FPS during sustained zoom (10 elements, no blur)       | >= 55 avg, >= 45 min                                                  | Same                                                                | Same                                                                               |
| FPS during pan with backdrop-filter (pan-pause active) | >= 55 avg during pan (blur disabled)                                  | Same                                                                | Pan-pause is the mitigation; if still slow, investigate compositor layers          |
| Zoom-to-cursor accuracy                                | World point under cursor stays fixed at all zoom levels (< 1px drift) | Visual inspection + coordinate logging                              | Formula is mathematically exact; investigate floating-point issues at extreme zoom |
| Semantic zoom transitions                              | Zero flicker at all 6 boundaries                                      | Visual inspection during slow zoom                                  | Widen hysteresis bands from 10% to 15%                                             |
| Momentum settle time                                   | < 2 seconds from typical flick to full stop                           | Timing measurement                                                  | Adjust friction factor                                                             |
| Spring animation (flyTo) settle time                   | < 1000ms                                                              | Timing measurement                                                  | Adjust damping; increase if overshoot, decrease if sluggish                        |
| React re-renders during animation                      | Zero re-renders on SpatialCanvas during pan/zoom/momentum             | React DevTools "Highlight updates"                                  | Verify subscribe() pattern is correct; fallback to vanilla store for hot path      |
| Viewport culling pop-in                                | No visible pop-in during normal panning speeds                        | Visual inspection                                                   | Increase VIEWPORT_CULL_MARGIN from 200 to 400                                      |
| Memory (compositor layers)                             | < 15 compositor layers total                                          | Chrome DevTools Layers panel                                        | Remove unnecessary will-change from child elements                                 |

---

## 5. Acceptance Criteria

All criteria must pass before WS-1.1 is marked complete.

| #     | Criterion                                                                                                                                                                                                                                                                                                                       | Verification                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| AC-1  | **Camera store implemented**: `src/stores/camera.store.ts` exports `useCameraStore` with the full `CameraState` and `CameraActions` interfaces. Store uses `create()` with `immer` middleware. Exported `cameraSelectors` object provides `semanticLevel`, `isMoving`, `transformString`, `urlParams`, `isAtLaunch` selectors.  | Import and type-check; verify all methods exist via `useCameraStore.getState()`                                                |
| AC-2  | **Spatial math implemented**: `src/lib/spatial-math.ts` exports all functions: `zoomToPoint`, `clampZoom`, `resolveSemanticLevel`, `applyMomentumDecay`, `computeVelocityFromSamples`, `getVisibleBounds`, `isInViewport`, `screenToWorld`, `worldToScreen`, `springStep`. All have TypeScript signatures matching Section 4.2. | `pnpm typecheck` passes; manual verification of signatures                                                                     |
| AC-3  | **SpatialViewport renders**: `<SpatialViewport>` fills the browser viewport (100vw x 100vh, overflow hidden), uses the void background color, and renders its children.                                                                                                                                                         | Navigate to `(launch)/page.tsx` and visually confirm                                                                           |
| AC-4  | **SpatialCanvas transforms**: `<SpatialCanvas>` applies CSS `transform: translate(x, y) scale(z)` via direct `element.style.transform` writes from a Zustand `subscribe()` call. Confirm via React DevTools that `SpatialCanvas` does NOT re-render when camera state changes.                                                  | React DevTools "Highlight updates" during pan/zoom shows zero flashes on SpatialCanvas                                         |
| AC-5  | **Pan with momentum**: Click-drag pans the canvas. Releasing with velocity produces smooth momentum deceleration. Camera comes to rest (no infinite drift).                                                                                                                                                                     | Manual interaction test                                                                                                        |
| AC-6  | **Zoom to cursor**: Scroll-wheel zooms in/out. The world-space point under the cursor stays fixed on screen during zoom. Validated at zoom levels 0.10, 0.50, 1.0, and 2.0.                                                                                                                                                     | Manual interaction test; place a child element under cursor and zoom                                                           |
| AC-7  | **Semantic zoom transitions**: Zooming through all 4 semantic levels (Z0 through Z3) produces zero visible flicker at any of the 6 boundaries. `useSemanticZoom()` returns the correct level at each zoom range.                                                                                                                | Slowly zoom through each boundary; observe for flicker                                                                         |
| AC-8  | **Viewport culling**: `<ViewportCuller>` unmounts children whose world-space positions are outside the visible viewport (plus margin). Panning to bring an off-screen element into view renders it without visible pop-in.                                                                                                      | Place 10+ elements scattered across the canvas; pan to verify off-screen elements are not in the DOM (DevTools Elements panel) |
| AC-9  | **flyTo spring animation**: `useFlyTo().flyTo(0, 0, 0.50)` animates the camera from any position to center on the Launch Atrium with a spring curve. Animation settles within 1000ms. No oscillation or teleporting.                                                                                                            | Trigger from any camera position; time the animation                                                                           |
| AC-10 | **Return-to-hub hotkey**: Pressing Home (when no input is focused) triggers `flyToLaunch()`. Camera animates to (0, 0) at zoom 0.50.                                                                                                                                                                                            | Manual keyboard test; confirm no-op when typing in an input field                                                              |
| AC-11 | **Pan-pause system**: `usePanPause()` returns `isPanActive: true` during pan/momentum/flyTo and `isPanActive: false` after 150ms of stillness. The delay is measurable (not instant).                                                                                                                                           | Log `isPanActive` changes; verify timing with console timestamps                                                               |
| AC-12 | **URL sync on settle**: After camera settles (no pan, no animation), URL updates to `?cx=<X>&cy=<Y>&cz=<Z>` within 200ms. Values are rounded to 2 decimal places.                                                                                                                                                               | Check browser URL bar after panning and waiting                                                                                |
| AC-13 | **URL restore on mount**: Loading the page with `?cx=100&cy=-200&cz=1.20` in the URL positions the camera at those coordinates on initial render.                                                                                                                                                                               | Navigate to the URL directly; confirm camera position matches                                                                  |
| AC-14 | **Performance target**: With 10 child elements (192x228px each, no backdrop-filter), sustained pan/zoom maintains >= 55 avg FPS and >= 45 min FPS as measured by Chrome DevTools Performance panel.                                                                                                                             | 10-second sustained pan test; check DevTools                                                                                   |
| AC-15 | **TypeScript strict compliance**: `pnpm typecheck` passes with zero errors for all engine files. No `any` types, no `@ts-ignore`, no type assertions except where documented.                                                                                                                                                   | Run `pnpm typecheck`                                                                                                           |
| AC-16 | **Constants centralized**: All spatial constants (zoom range, thresholds, friction, spring config, margins, delays) are defined in `src/lib/constants.ts` and imported by the store and hooks. No magic numbers in component/hook code.                                                                                         | Code review                                                                                                                    |
| AC-17 | **Integration surface verified**: The engine exposes the documented APIs that downstream workstreams depend on. Verified by confirming that the following are importable and typed: `useCameraStore`, `cameraSelectors`, `useSemanticZoom`, `useFlyTo`, `usePanPause`, `ViewportCuller`, `screenToWorld`, `worldToScreen`.      | Import check in a test file                                                                                                    |

---

## 6. Decisions Made

| #   | Decision                                                            | Rationale                                                                                                                                                                                                                                                       | Source                                                                      |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| D1  | Camera store uses `immer` middleware (production)                   | Validated in WS-0.3 spike. The `subscribe()` pattern bypasses React entirely for high-frequency DOM writes. `immer` overhead is limited to the state update functions (once per rAF frame). Maintains consistency with the Agent Builder store patterns.        | [ECOSYSTEM: WS-0.3 D2, wizard-store.ts pattern]                             |
| D2  | `transform-origin: 0 0` is required on SpatialCanvas                | The zoom-to-cursor formula assumes the transform origin is at the top-left corner. Confirmed in WS-0.3 spike (Q3 resolution). Using the browser default (`50% 50%`) would require different offset math.                                                        | [SPEC: WS-0.3 Q3]                                                           |
| D3  | Viewport culling uses unmount, not `visibility: hidden`             | Unmounting frees DOM nodes, which matters more than remount cost when the total interactive element count can reach 20+ at Z1. Decision confirmed by WS-0.3 spike (Q6 resolution).                                                                              | [INFERENCE: expected spike finding; override if spike recommends otherwise] |
| D4  | `will-change: transform` is permanent on SpatialCanvas              | Promotes the element to its own compositor layer for consistent GPU acceleration. On a desktop machine with a dedicated GPU, the memory cost is acceptable for a single promoted layer. Confirmed by WS-0.3 spike (Q2 resolution).                              | [INFERENCE: expected spike finding; override if spike recommends otherwise] |
| D5  | URL sync uses `history.replaceState()`, not Next.js router          | The camera position changes multiple times per second during animation. Using `router.replace()` or `router.push()` would trigger Next.js re-renders and potentially RSC refetches. `history.replaceState()` updates the URL without any framework involvement. | [INFERENCE]                                                                 |
| D6  | Pan-pause uses camera store flags + debounce hook (not EventTarget) | A custom event system adds complexity. The camera store already knows when panning and animating. The `usePanPause` hook provides the debounced signal. This is simpler and keeps state in one place.                                                           | [INFERENCE]                                                                 |
| D7  | Route group is `(launch)/` not `(hub)/`                             | Per PLANNING-LOG.md Deviation #2: hub-to-launch rename consistency.                                                                                                                                                                                             | [SPEC: PLANNING-LOG.md]                                                     |
| D8  | Module-level `_animationFrameId` is stored outside Zustand          | The rAF handle is a mutable implementation detail. Storing it in Zustand would trigger subscriptions when it changes, which is undesirable for a high-frequency animation loop.                                                                                 | [INFERENCE]                                                                 |
| D9  | Separate State and Actions interfaces on camera store               | Follows the Agent Builder `WizardState` / `WizardActions` pattern for clarity and type reuse. Enables typed selectors that accept `CameraState` without including action methods.                                                                               | [ECOSYSTEM: wizard-store.ts]                                                |
| D10 | Exported selectors as a standalone object (`cameraSelectors`)       | Follows the Agent Builder `wizardSelectors` pattern. Allows components to use `useCameraStore(cameraSelectors.semanticLevel)` for optimized re-render selection. Also enables testing selectors independently.                                                  | [ECOSYSTEM: wizard-store.ts]                                                |
| D11 | Pointer events use `setPointerCapture` for reliable drag tracking   | Standard practice for drag interactions. Ensures pointermove events continue firing even if the cursor leaves the viewport element (e.g., when dragging fast).                                                                                                  | [INFERENCE]                                                                 |
| D12 | Keyboard shortcuts check `document.activeElement` before firing     | Prevents Space/Home from triggering `resetToLaunch` when the user is typing in the command palette (WS-1.4) or any input field.                                                                                                                                 | [INFERENCE]                                                                 |

---

## 7. Open Questions

| #    | Question                                                                    | Impact                                                                                                                                                          | Resolution Path                                                                                                                                                                                                                                                                                            |
| ---- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-1 | Should keyboard pan (arrow keys) be supported for accessibility?            | Low -- desktop mouse/trackpad is the primary input per project constraints. However, keyboard pan would improve accessibility for users who cannot use a mouse. | Defer to post-Phase 1. The SpatialViewport can add arrow key handlers without changing the camera store or hooks. If added, arrow keys should pan by a fixed world-space distance (e.g., 100px per press).                                                                                                 |
| OQ-2 | Should trackpad pinch-to-zoom be handled differently from scroll wheel?     | Medium -- macOS trackpads report pinch gestures as wheel events with `ctrlKey: true`. The zoom speed and direction may feel different.                          | The `useZoom` hook should detect `event.ctrlKey` to identify pinch gestures and potentially apply a different speed factor. Start with the same factor; tune if pinch feels too fast/slow during integration testing.                                                                                      |
| OQ-3 | Where should viewport dimensions be stored for `flyTo` to access?           | Low -- affects API cleanliness, not functionality.                                                                                                              | Two options: (a) add `viewportWidth` and `viewportHeight` to the camera store, updated by SpatialViewport on mount/resize; (b) have `flyTo` accept them as parameters. Option (a) is cleaner for downstream consumers. Implement (a) during execution; if it causes unwanted subscriptions, switch to (b). |
| OQ-4 | Should the spike's `fps-monitor.ts` be retained in the production codebase? | Low -- useful for ongoing performance validation but not user-facing.                                                                                           | Keep it but move to a `src/lib/dev/` directory. Conditionally import it only in development. Remove from production bundle via tree-shaking.                                                                                                                                                               |
| OQ-5 | How should the engine handle browser tab visibility changes?                | Low -- if the tab is hidden, rAF stops automatically. But momentum/flyTo state may be stale when the tab returns.                                               | On `visibilitychange`, cancel any active animation and snap to the current target position. This prevents confusing behavior when switching back to the tab. Implement during execution.                                                                                                                   |

---

## 8. Risk Register

| #   | Risk                                                                     | Likelihood | Impact | Severity | Mitigation                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------ | ---------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1  | CSS transforms hit visual ceiling -- effects look flat compared to WebGL | Medium     | Medium | Medium   | The VISUAL-DESIGN-SPEC.md covers the gap with multi-layer box-shadow, canvas particles, and CSS glow. R3F upgrade path exists and is documented. The CameraController interface (AD-7) abstracts the camera from its implementation. [SPEC: Risk #1]                                                                                 |
| R2  | `backdrop-filter: blur(12px)` drops FPS below 45 during pan              | High       | Medium | High     | The pan-pause system (Section 4.8) disables backdrop-filter during camera motion and re-enables after 150ms of stillness. This is the primary mitigation. Fallback: replace blur with solid semi-transparent backgrounds. The pan-pause hook is a deliverable of this workstream specifically to address this risk. [SPEC: Risk #3]  |
| R3  | Text blur at fractional zoom levels (Z0, Z1)                             | Medium     | Low    | Low      | Accept minor blur at Z0 (beacons are the primary content, not text). At Z1 (default landing, zoom 0.50), text must be readable -- if subpixel blur is visible, apply counter-scaling to text containers (`transform: scale(1/parentZoom)` on text-only elements). The spike assesses readability at all zoom levels. [SPEC: Risk #8] |
| R4  | Zustand `subscribe()` leaks React re-renders through immer               | Low        | High   | Medium   | The spike validates that `subscribe()` does not trigger React component re-renders. If re-renders leak, fallback: use a vanilla `createStore()` (without React integration) for the animation-hot path, keeping the immer-based store for low-frequency reads. [SPEC: WS-0.3 R4]                                                     |
| R5  | URL sync causes unwanted navigation or re-renders                        | Low        | Medium | Low      | Using `history.replaceState()` instead of Next.js router ensures no React re-renders or RSC refetches. The URL update is debounced and only fires on settle. If issues arise, disable URL sync and investigate. [INFERENCE]                                                                                                          |
| R6  | ViewportCuller causes visible pop-in on fast pan                         | Medium     | Low    | Low      | The default 200px world-space margin should prevent pop-in at normal panning speeds. If pop-in occurs during fast flicks, increase the margin. The margin is configurable per the ViewportCuller props. [SPEC: combined-recommendations.md]                                                                                          |
| R7  | Keyboard shortcut (Space) conflicts with browser scroll behavior         | Low        | Low    | Low      | The SpatialViewport sets `overflow: hidden` on its container, which prevents the browser's default Space-to-scroll behavior. The keyboard handler calls `event.preventDefault()` for Space and Home keys. Verified by checking that the page does not scroll when Space is pressed. [INFERENCE]                                      |
| R8  | Spring animation does not converge (oscillation)                         | Low        | Medium | Low      | The semi-implicit Euler integration with reasonable damping (26) always converges for the expected spring configurations. If GC pauses cause dt spikes, implement a fixed-timestep integrator with interpolation. The spike validates convergence. [SPEC: WS-0.3 R6]                                                                 |
| R9  | Downstream workstreams add content that exceeds performance budget       | Medium     | Medium | Medium   | The engine is validated with 10+ elements. Each downstream WS (capsules, particles, glass panels) adds DOM/compositor cost. Monitor FPS as content is integrated. The pan-pause system (R2 mitigation) and viewport culling (AC-8) are the primary defenses. If FPS drops, profile and optimize the most expensive consumers first.  |
| R10 | Spike report changes parameters from specification defaults              | Medium     | Low    | Low      | All specification defaults (friction 0.92, spring config, zoom speed factor, cull margin) are defined in `src/lib/constants.ts` and can be updated in a single file after the spike report is reviewed. The SOW documents default values; the spike report provides tuned values.                                                    |

---

## Appendix A: File Manifest

All paths are relative to the project root. Files marked (create) are new; files marked (evolve) update code from WS-0.1 scaffolding or WS-0.3 spike.

| File                                         | Action | Description                                                                                             |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| `src/stores/camera.store.ts`                 | Evolve | Production camera store with full types, actions, selectors (replaces WS-0.1 skeleton and WS-0.3 spike) |
| `src/lib/spatial-math.ts`                    | Evolve | Production spatial math utilities (evolves WS-0.3 spike)                                                |
| `src/lib/constants.ts`                       | Evolve | Add spatial constants (extends WS-0.1 skeleton)                                                         |
| `src/components/spatial/SpatialViewport.tsx` | Evolve | Production viewport component (evolves WS-0.3 spike)                                                    |
| `src/components/spatial/SpatialCanvas.tsx`   | Evolve | Production CSS-transform container (evolves WS-0.3 spike)                                               |
| `src/components/spatial/ViewportCuller.tsx`  | Create | Viewport culling wrapper component                                                                      |
| `src/hooks/use-pan.ts`                       | Evolve | Production pan + momentum hook (evolves WS-0.3 spike)                                                   |
| `src/hooks/use-zoom.ts`                      | Evolve | Production zoom-to-cursor hook (evolves WS-0.3 spike)                                                   |
| `src/hooks/use-semantic-zoom.ts`             | Evolve | Production semantic level reader (evolves WS-0.3 spike)                                                 |
| `src/hooks/use-viewport-cull.ts`             | Evolve | Production viewport culling hook (evolves WS-0.3 spike)                                                 |
| `src/hooks/use-fly-to.ts`                    | Create | Convenience hook for flyTo with animation state                                                         |
| `src/hooks/use-pan-pause.ts`                 | Create | Debounced pan-active signal for ambient effects                                                         |
| `src/hooks/use-camera-sync.ts`               | Create | URL sync for camera position                                                                            |
| `src/app/(launch)/page.tsx`                  | Evolve | Update to render SpatialViewport with test content (replaces WS-0.1 placeholder)                        |

**Post-spike cleanup:** The spike test page at `app/(launch)/spike/page.tsx` and `src/components/spatial/spike/PlaceholderNode.tsx` are removed after WS-0.3 concludes. The spike's `src/lib/fps-monitor.ts` is moved to `src/lib/dev/fps-monitor.ts` and retained for development use.

## Appendix B: Downstream Integration Map

This table documents what each blocking workstream consumes from the ZUI engine, to verify that the engine's public API covers all integration points.

| Workstream                      | Consumes                                                                                                                                                                                                       | API Surface                                                                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| WS-1.2 (Launch Atrium)          | Position capsules at world coordinates inside SpatialCanvas; read semantic level for content switching; receive pan-pause signal for hover effect suppression                                                  | `SpatialCanvas` (children), `useSemanticZoom()`, `usePanPause()`, `ViewportCuller`                                                      |
| WS-1.4 (Navigation Instruments) | Read camera state for minimap viewport rectangle; read semantic level for zoom indicator badge; trigger flyTo for return-to-hub and minimap click-to-navigate; read camera position for breadcrumb coordinates | `useCameraStore` (with selectors), `useSemanticZoom()`, `useFlyTo()`, `cameraSelectors.urlParams`, `worldToScreen()`, `screenToWorld()` |
| WS-1.6 (Ambient Effects Layer)  | Receive pan-pause signal to disable backdrop-filter and pause CSS animations during camera motion; position particle canvas as a fixed overlay in SpatialViewport                                              | `usePanPause()`, `SpatialViewport` (overlays prop)                                                                                      |
| WS-2.1 (Morph Choreography)     | Trigger flyTo to focus camera on a selected district; read camera animation state for choreography coordination; cancel active flyTo if user interrupts                                                        | `useFlyTo()` (flyTo, cancel, isFlying), `useCameraStore` (isAnimating)                                                                  |
| WS-2.7 (Constellation View)     | Read semantic level (Z0) to render beacon content; trigger flyTo to navigate from constellation to a district; position beacons at world coordinates                                                           | `useSemanticZoom()` (isConstellation), `useFlyTo()`, `SpatialCanvas` (children)                                                         |

## Appendix C: Zustand Pattern Reference

The camera store follows patterns established in the Agent Builder codebase (`tarva-claude-agents-frontend/src/stores/`). Key patterns applied: [ECOSYSTEM]

| Pattern                               | Agent Builder Example                                 | Camera Store Application                                              |
| ------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| Separate State and Actions interfaces | `WizardState` + `WizardActions`                       | `CameraState` + `CameraActions`                                       |
| `create()` with `immer` middleware    | `useWizardStore = create<...>()(immer((set) => ...))` | `useCameraStore = create<CameraStore>()(immer((set, get) => ...))`    |
| Exported selectors object             | `wizardSelectors.isDetailsValid`                      | `cameraSelectors.isMoving`                                            |
| Initial state as const                | `const initialState: WizardState = { ... }`           | `const INITIAL_STATE: CameraState = { ... }`                          |
| Reset method                          | `reset: () => set(initialState)`                      | `cancelAnimation` + store can be reset via `setCamera(INITIAL_STATE)` |

**Difference from Agent Builder:** The camera store uses `subscribe()` for high-frequency DOM writes, which is unique to the spatial engine. Agent Builder stores only use standard `useStore()` for React-rendered UI. The `subscribe()` call happens inside `SpatialCanvas.useEffect()`, not in the store definition itself.
