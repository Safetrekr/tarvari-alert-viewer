# WS-0.3: ZUI Tech Spike

> **Workstream ID:** WS-0.3
> **Phase:** 0 -- Tech Spike & Setup
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1 (Project Scaffolding)
> **Blocks:** WS-1.1 (ZUI Engine), WS-1.4 (Navigation Instruments), WS-2.1 (Morph Choreography), WS-2.7 (Constellation View)
> **Resolves:** Risk #2 (zoom-to-cursor edge cases), Risk #6 (scope creep gating), Assumption #6 (GPU compositing), Assumption #8 (60fps with particles)

---

## 1. Objective

Validate the CSS transforms spatial engine approach (per Gap Resolution #1) end-to-end before committing the project to it. The spike must prove -- or disprove -- that a single `<div>` with `transform: translate(x, y) scale(z)` and direct `element.style.transform` writes via Zustand `subscribe()` can sustain 60fps pan/zoom with 10+ DOM elements, correct zoom-to-cursor math, momentum physics, semantic zoom level switching with hysteresis, and acceptable text rendering at fractional zoom levels.

The spike is the gate for all subsequent phases. If the CSS approach fails the go/no-go criteria defined in Section 5, the project pivots to the R3F hybrid upgrade path (documented in the tech-decisions.md fallback) before any production code is written. If it passes, the spike code becomes the seed for WS-1.1 (ZUI Engine) and the spike report becomes the architectural evidence base for all spatial decisions.

---

## 2. Scope

### In Scope

1. **Camera store** -- Zustand store with `offsetX`, `offsetY`, `zoom`, `semanticLevel` state; direct `subscribe()` for DOM writes bypassing React reconciliation during animation (per AD-1)
2. **Pan with momentum** -- Click-drag pan tracking velocity from last 5 pointer samples; momentum decay at 0.92 friction per rAF frame; stop threshold
3. **Zoom-to-cursor** -- Scroll-wheel zoom with analytical formula that preserves the world-space point under the cursor; zoom range 0.08 to 3.0
4. **Semantic zoom switching** -- 4-level config-driven thresholds with 10% hysteresis bands (per AD-2); placeholder content at each level to verify flicker-free transitions
5. **Viewport culling** -- Determine which elements are within the visible viewport bounds; toggle visibility or unmount off-screen elements (rAF-debounced)
6. **Return-to-hub** -- Spring animation (`flyTo`) from arbitrary position to (0, 0) at zoom 0.50
7. **Performance measurement** -- Quantitative FPS measurement with 10, 20, 30, and 50 placeholder DOM elements during sustained pan/zoom
8. **`backdrop-filter` stress test** -- Measure FPS with and without `backdrop-filter: blur(12px)` on placeholder elements during pan/zoom; validate the pan-pause mitigation (disable during motion, re-enable after 150ms stillness)
9. **Text readability audit** -- Visual assessment of text rendering at zoom levels 0.08 (Z0 far), 0.30 (Z1 entry), 0.50 (Z1 default), 1.0 (Z2 entry), 1.5 (Z3 entry), 3.0 (Z3 max)
10. **Spike report** -- Written findings document with go/no-go recommendation, quantitative data, and risk updates

### Out of Scope

- Production-quality component APIs, prop contracts, or accessibility (this is spike code)
- Framer Motion choreography or morph transitions (validated separately in WS-2.1)
- ParticleCanvas, ScanlineOverlay, or any ambient effects (validated in WS-1.6)
- Telemetry data, HealthBadge, or any real content components
- Minimap, breadcrumb, or navigation instruments (WS-1.4)
- URL sync (`?cx=&cy=&cz=`) or router integration
- Supabase, authentication, or any backend
- Design token integration (depends on WS-0.2; spike uses inline styles or minimal Tailwind)
- Mobile/touch input (desktop mouse/trackpad only, per project constraints)

---

## 3. Input Dependencies

| Dependency                              | Source                                     | What Is Needed                                                                                     | Blocking?                                                         |
| --------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| WS-0.1 Project Scaffolding              | Phase 0                                    | Next.js 16 project with TypeScript strict mode, Tailwind v4, pnpm, directory structure per AD-9    | Yes -- spike code lives in the scaffolded project                 |
| Gap Resolution #1                       | combined-recommendations.md                | CSS transforms architecture decision and integration approach diagram                              | Available (read-only reference)                                   |
| AD-1: Camera State Management           | combined-recommendations.md                | Zustand `subscribe()` pattern specification, camera store shape, method signatures                 | Available (read-only reference)                                   |
| AD-2: Semantic Zoom with Hysteresis     | combined-recommendations.md                | Zoom level thresholds, enter/exit values, hysteresis band percentages                              | Available (read-only reference)                                   |
| AD-3: Three-Tier Animation Architecture | combined-recommendations.md                | Constraint that physics-tier (rAF) handles camera; never Framer Motion for camera                  | Available (read-only reference)                                   |
| Existing Zustand patterns               | `tarva-claude-agents-frontend/src/stores/` | `create()` + `immer` middleware pattern, `useShallow` for selectors, state/actions type separation | Available (read-only reference)                                   |
| @tarva/ui token reference               | `tarva-ui-library/src/tokens/`             | Dark mode background color (`#050911`) for spike viewport background                               | Available (read-only reference); full token integration is WS-0.2 |

---

## 4. Deliverables

### 4.1 Spike Code

All file paths are relative to the project root established by WS-0.1. The spike creates a minimal, self-contained test harness. Code quality expectations are "validated prototype" -- TypeScript types must be correct, but code may be rough, comments may be sparse, and error handling may be minimal.

#### 4.1.1 Camera Store

**File:** `src/stores/camera.store.ts`

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// --- Types ---

/** Semantic zoom levels per AD-2 */
export type SemanticZoomLevel = 'Z0' | 'Z1' | 'Z2' | 'Z3'

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
   * Animate camera to a world-space target with spring physics.
   * Used for return-to-hub and future district focus.
   * @param targetX - World-space X
   * @param targetY - World-space Y
   * @param targetZoom - Target zoom level
   */
  flyTo: (targetX: number, targetY: number, targetZoom: number) => void

  /** Snap camera to (0, 0) at zoom 0.50 with spring animation. */
  resetToLaunch: () => void

  /** Set the full camera state (used by animation loops). */
  setCamera: (patch: Partial<CameraState>) => void

  /** Set animating flag. */
  setAnimating: (animating: boolean) => void
}

export type CameraStore = CameraState & CameraActions
```

The store implementation uses `create<CameraStore>()(immer((set, get) => ({ ... })))`, consistent with the pattern in `tarva-claude-agents-frontend/src/stores/wizard-store.ts`. The `zoomTo` method implements the zoom-to-cursor formula (see Section 4.1.2). The `flyTo` method starts a `requestAnimationFrame` spring animation loop that writes to the store; the `SpatialCanvas` component subscribes to the store and writes `element.style.transform` directly -- never triggering React re-renders during animation.

The semantic level is recalculated inside `zoomTo` and `setCamera` using the hysteresis logic from the spatial math utilities.

#### 4.1.2 Spatial Math Utilities

**File:** `src/lib/spatial-math.ts`

```typescript
// --- Zoom-to-cursor (per AD-1) ---

/**
 * Calculate new camera offset after zooming, preserving the world-space
 * point under the cursor.
 *
 * The formula:
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
  cursorY: number
): { offsetX: number; offsetY: number }

// --- Semantic zoom with hysteresis (per AD-2) ---

export interface ZoomLevelConfig {
  level: SemanticZoomLevel
  enterMin: number // Enter this level when zoom >= enterMin
  enterMax: number // Enter this level when zoom < enterMax
  exitBelow: number // Exit to lower level when zoom < exitBelow
  exitAbove: number // Exit to higher level when zoom >= exitAbove
}

/**
 * Zoom level thresholds with 10% hysteresis bands.
 *
 * | Level | Enter At      | Exit At                |
 * |-------|---------------|------------------------|
 * | Z0    | zoom < 0.27   | zoom >= 0.30           |
 * | Z1    | 0.30 - 0.79   | zoom < 0.27 or >= 0.80 |
 * | Z2    | 0.80 - 1.49   | zoom < 0.72 or >= 1.50 |
 * | Z3    | zoom >= 1.50  | zoom < 1.35            |
 */
export const ZOOM_LEVELS: ZoomLevelConfig[]

/**
 * Resolve the semantic zoom level given the current zoom and the
 * previous semantic level (for hysteresis).
 * Returns the new level only if the threshold is crossed; otherwise
 * returns the current level (preventing flicker at boundaries).
 */
export function resolveSemanticLevel(
  zoom: number,
  currentLevel: SemanticZoomLevel
): SemanticZoomLevel

// --- Momentum decay ---

export interface Velocity {
  vx: number
  vy: number
}

/**
 * Apply momentum decay to a velocity vector.
 * @param velocity  - Current velocity
 * @param friction  - Decay factor per frame (0.92 per spec)
 * @param threshold - Minimum velocity magnitude to continue (default 0.5 px/frame)
 * @returns Updated velocity, or { vx: 0, vy: 0 } if below threshold
 */
export function applyMomentumDecay(
  velocity: Velocity,
  friction?: number,
  threshold?: number
): Velocity

/**
 * Track velocity from the last N pointer samples.
 * Returns averaged velocity in px/ms, suitable for converting to
 * px/frame at 60fps (multiply by 16.67).
 */
export function computeVelocityFromSamples(
  samples: Array<{ x: number; y: number; t: number }>
): Velocity

// --- Viewport culling ---

export interface WorldBounds {
  left: number
  top: number
  right: number
  bottom: number
}

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
  margin?: number
): WorldBounds

/**
 * Check whether a rectangle at world-space position is within the
 * visible bounds.
 */
export function isInViewport(
  elementX: number,
  elementY: number,
  elementWidth: number,
  elementHeight: number,
  visibleBounds: WorldBounds
): boolean

// --- Spring animation ---

export interface SpringConfig {
  stiffness: number // default 170
  damping: number // default 26
  mass: number // default 1
  restThreshold: number // default 0.01
}

/**
 * Compute one frame of spring physics for a single value.
 * Returns { value, velocity, atRest }.
 */
export function springStep(
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig,
  dt: number
): { value: number; velocity: number; atRest: boolean }

// --- Constants ---

export const ZOOM_MIN = 0.08
export const ZOOM_MAX = 3.0
export const ZOOM_DEFAULT = 0.5
export const MOMENTUM_FRICTION = 0.92
export const MOMENTUM_SAMPLES = 5
export const MOMENTUM_STOP_THRESHOLD = 0.5
export const PAN_PAUSE_DELAY_MS = 150
export const VIEWPORT_CULL_MARGIN = 200
```

#### 4.1.3 Spatial Components (Spike Harness)

**File:** `src/components/spatial/SpatialViewport.tsx`

The outer container. Fixed to fill the screen, captures all pointer and wheel events, sets `overflow: hidden`. Background color uses the void token (`#050911`, per VISUAL-DESIGN-SPEC.md 1.2). This component:

- Renders `SpatialCanvas` as a child
- Attaches `onPointerDown`, `onPointerMove`, `onPointerUp` for pan
- Attaches `onWheel` for zoom
- Passes a `ref` to the container for viewport dimension measurement

```typescript
interface SpatialViewportProps {
  children: React.ReactNode
}
```

**File:** `src/components/spatial/SpatialCanvas.tsx`

The CSS-transformed container. This is the critical performance component. It:

- Renders a single `<div>` with `will-change: transform`
- Subscribes to `useCameraStore.subscribe()` (NOT `useCameraStore()`) to read `offsetX`, `offsetY`, `zoom` without triggering React re-renders
- On each store update, writes `element.style.transform = \`translate(\${offsetX}px, \${offsetY}px) scale(\${zoom})\``directly via a`ref`
- Children are positioned with `position: absolute` at world coordinates

```typescript
interface SpatialCanvasProps {
  children: React.ReactNode
}
```

**File:** `src/components/spatial/spike/PlaceholderNode.tsx`

A test element positioned at world coordinates. Renders a styled `<div>` at a given `(x, y)` position with:

- Fixed size (192 x 228px, matching capsule dimensions from the detailed requirements)
- Rounded corners (28px radius)
- Background with optional `backdrop-filter: blur(12px)` (toggled via prop for A/B testing)
- Text content showing its index, position, and current semantic zoom level
- Semantic zoom awareness: switches between 4 different content representations based on the current `semanticLevel` from the camera store (simplified placeholder content, not production representations)

```typescript
interface PlaceholderNodeProps {
  id: number
  x: number // World-space X
  y: number // World-space Y
  label: string
  enableBlur?: boolean
}
```

#### 4.1.4 Hooks

**File:** `src/hooks/use-pan.ts`

Custom hook that manages pan state and momentum. Attaches to pointer events from the viewport container. Tracks the last 5 pointer samples for velocity computation (per ZUI Engine spec). On pointer release with sufficient velocity, starts a `requestAnimationFrame` momentum loop that calls `camera.panBy()` with decaying velocity (0.92 friction per frame). Stops when velocity magnitude drops below the threshold (0.5 px/frame).

```typescript
export function usePan(viewportRef: React.RefObject<HTMLDivElement | null>): void
```

**File:** `src/hooks/use-zoom.ts`

Custom hook that handles scroll-wheel zoom. Attaches to `wheel` events on the viewport. Computes cursor position relative to the viewport, calculates the new zoom level (current _ `1.0 +/- delta _ 0.001`, clamped to [0.08, 3.0]), and calls `camera.zoomTo()` with the cursor position.

```typescript
export function useZoom(viewportRef: React.RefObject<HTMLDivElement | null>): void
```

**File:** `src/hooks/use-semantic-zoom.ts`

Custom hook that reads `semanticLevel` from the camera store (via standard `useStore()` with selector, since this is low-frequency). Returns the current level for components that need to switch their representation.

```typescript
export function useSemanticZoom(): SemanticZoomLevel
```

**File:** `src/hooks/use-viewport-cull.ts`

Custom hook that subscribes to camera state and viewport dimensions, computes visible world-space bounds (via `getVisibleBounds`), and returns a function that checks whether a given world-space rectangle is visible (via `isInViewport`). Uses `requestAnimationFrame` debouncing to avoid computing bounds on every store update.

```typescript
export function useViewportCull(): {
  isVisible: (x: number, y: number, width: number, height: number) => boolean
}
```

#### 4.1.5 Spike Test Page

**File:** `app/(launch)/spike/page.tsx`

A `'use client'` page that assembles the spike harness. This is the primary test surface. It renders:

- `SpatialViewport` containing `SpatialCanvas` with N `PlaceholderNode` children
- A fixed overlay with spike controls:
  - Element count slider (10 / 20 / 30 / 50)
  - `backdrop-filter` toggle (on/off for all elements)
  - Current FPS counter (computed from `requestAnimationFrame` timestamps)
  - Current camera state readout (`offsetX`, `offsetY`, `zoom`, `semanticLevel`)
  - "Reset to Launch" button (triggers `flyTo(0, 0, 0.50)`)
  - Current viewport bounds readout (for verifying culling)

Placeholder elements are distributed in a ring layout (matching the capsule ring from the detailed requirements: 300px radius, 60-degree spacing for the first 6, then expanding to larger radii for additional elements).

#### 4.1.6 FPS Measurement Utility

**File:** `src/lib/fps-monitor.ts`

A lightweight frame-time measurement utility used by the spike test page. Runs a persistent `requestAnimationFrame` loop that:

- Records the last 120 frame timestamps (2 seconds at 60fps)
- Computes rolling average FPS
- Tracks minimum FPS over the measurement window
- Exposes `{ currentFps, minFps, avgFps, frameTimes }` for the spike overlay
- Can export raw frame-time data as JSON for the spike report

```typescript
export interface FpsSnapshot {
  currentFps: number
  avgFps: number
  minFps: number
  frameTimes: number[] // last 120 frame durations in ms
  droppedFrames: number // frames > 20ms (below 50fps)
}

export function createFpsMonitor(): {
  start: () => void
  stop: () => void
  snapshot: () => FpsSnapshot
  reset: () => void
}
```

### 4.2 Performance Test Methodology

Each test scenario is run on the developer's machine (the target deployment environment -- this is a localhost tool per project constraints). Measurements are taken using both the spike's built-in FPS monitor and the Chrome DevTools Performance panel for cross-validation.

#### Test Protocol

1. **Warm-up**: Load the spike page. Wait 3 seconds for initial render and compositor setup.
2. **Baseline**: Record 5 seconds of idle FPS (no interaction). This establishes the ambient cost of CSS animations (none in the spike, but validates zero-cost idle).
3. **Pan test**: Click-drag continuously for 10 seconds across the viewport. Record FPS throughout.
4. **Zoom test**: Scroll-wheel zoom in and out continuously for 10 seconds. Record FPS throughout.
5. **Pan + zoom combined**: Alternate pan and zoom gestures for 10 seconds. Record FPS.
6. **Momentum test**: Quick flick-and-release, observe momentum decay. Record FPS during decay phase.
7. **Zoom boundary test**: Slowly zoom through each semantic level boundary. Observe for visual flicker. Record whether hysteresis prevents oscillation.

#### Test Matrix

| Scenario | Elements | `backdrop-filter` | What to Measure                                          |
| -------- | -------- | ----------------- | -------------------------------------------------------- |
| A1       | 10       | Off               | Baseline FPS during pan, zoom, combined                  |
| A2       | 10       | On                | FPS delta from A1 (cost of blur)                         |
| A3       | 10       | Pan-pause mode    | FPS during pan (blur off), FPS after settle (blur on)    |
| B1       | 20       | Off               | Scaling behavior                                         |
| B2       | 30       | Off               | Scaling behavior                                         |
| B3       | 50       | Off               | Stress test upper bound                                  |
| C1       | 10       | Off               | Zoom-to-cursor accuracy (does the point stay fixed?)     |
| C2       | 10       | Off               | Semantic level transitions (flicker test)                |
| C3       | 10       | Off               | flyTo spring animation smoothness                        |
| D1       | 10       | Off               | Text readability at zoom 0.08, 0.30, 0.50, 1.0, 1.5, 3.0 |

#### Measurement Artifacts

For each scenario, capture:

1. **FPS summary**: avg, min, p5 (5th percentile), dropped frame count
2. **Chrome DevTools Performance recording** (saved as `.json` profile for reference)
3. **Screenshots** at each semantic zoom level (for text readability audit)
4. **Subjective feel notes**: Does momentum feel natural? Is zoom-to-cursor stable? Any visual jank?

### 4.3 Spike Report Template

**File:** `docs/plans/initial-plan/phase-0-tech-spike/spike-report-zui.md`

```markdown
# ZUI Tech Spike Report

> **Date:** [completion date]
> **Duration:** [actual time spent]
> **Machine:** [hardware summary -- CPU, GPU, RAM, display resolution]
> **Browser:** [Chrome version]
> **Verdict:** [GO / CONDITIONAL GO / NO GO]

## Executive Summary

[2-3 sentences: did it work? What was the headline FPS number?
What are the key findings?]

## 1. Performance Results

### 1.1 FPS by Scenario

| Scenario | Elements | Blur  | Avg FPS | Min FPS | P5 FPS | Dropped Frames | Verdict |
| -------- | -------- | ----- | ------- | ------- | ------ | -------------- | ------- |
| A1       | 10       | Off   |         |         |        |                |         |
| A2       | 10       | On    |         |         |        |                |         |
| A3       | 10       | Pause |         |         |        |                |         |
| B1       | 20       | Off   |         |         |        |                |         |
| B2       | 30       | Off   |         |         |        |                |         |
| B3       | 50       | Off   |         |         |        |                |         |

### 1.2 Scaling Analysis

[Chart or table showing FPS vs element count. Is degradation linear?
At what element count does FPS drop below 55?]

### 1.3 backdrop-filter Impact

[Quantify the FPS cost of backdrop-filter: blur(12px).
Does the pan-pause mitigation (A3) restore acceptable performance?]

## 2. Zoom-to-Cursor Validation

[Does the world-space point under the cursor stay fixed during zoom?
Test at zoom boundaries (0.08, 0.27, 0.30, 0.80, 1.50, 3.0).
Any edge cases where the formula breaks down?]

## 3. Semantic Zoom Hysteresis

[Slowly zoom through each boundary. Does hysteresis prevent flicker?
Record the exact zoom values where level transitions occur.
Confirm they match AD-2 thresholds.]

## 4. Momentum Feel

[Subjective assessment of pan momentum.
Does 0.92 friction feel natural? Too floaty? Too sticky?
Does the velocity sampling (5 samples) produce consistent results?
Recommended friction value if 0.92 needs adjustment.]

## 5. Spring Animation (flyTo)

[Does resetToLaunch produce a smooth spring animation?
Any overshoot? Settling time?
Spring config used: stiffness=X, damping=Y, mass=Z.]

## 6. Text Readability

| Zoom Level | Semantic Level | Readability | Notes |
| ---------- | -------------- | ----------- | ----- |
| 0.08       | Z0             |             |       |
| 0.30       | Z1 entry       |             |       |
| 0.50       | Z1 default     |             |       |
| 1.00       | Z2 entry       |             |       |
| 1.50       | Z3 entry       |             |       |
| 3.00       | Z3 max         |             |       |

[Assessment: Is text at Z1 (the default landing) clearly readable?
Is text at Z0 expected to be readable (or are beacons the content)?
Is counter-scaling needed at any level?]

## 7. Viewport Culling

[Does culling correctly unmount off-screen elements?
Is there visible pop-in when panning quickly?
What margin value prevents pop-in?]

## 8. Risks Updated

| Risk # | Original Assessment                       | Spike Finding | Updated Status |
| ------ | ----------------------------------------- | ------------- | -------------- |
| 1      | CSS visual ceiling (Medium/Medium)        |               |                |
| 2      | Zoom-to-cursor edge cases (Medium/High)   |               |                |
| 3      | backdrop-filter frame drops (High/Medium) |               |                |
| 6      | Scope creep gating (High/High)            |               |                |
| 8      | Text blur at fractional zoom (Medium/Low) |               |                |

## 9. Assumptions Validated

| Assumption # | Statement                             | Validated? | Evidence |
| ------------ | ------------------------------------- | ---------- | -------- |
| 6            | GPU compositing with 50+ elements     |            |          |
| 8            | 60fps with particles + CSS animations |            |          |

## 10. Recommendations for WS-1.1

[Specific guidance for the production ZUI engine build:

- Confirmed architecture patterns
- Suggested parameter adjustments (friction, spring config, margins)
- Known pitfalls to avoid
- Any API changes needed from the spike signatures
- Whether the subscribe() pattern performed as expected]

## Appendix: Raw Data

[Link to or inline the JSON FPS data exports for each scenario.]
```

### 4.4 Go/No-Go Decision Matrix

The spike culminates in a decision. The criteria below define the thresholds.

| Criterion                                       | GO                                                        | CONDITIONAL GO                                                            | NO GO                                                               |
| ----------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **FPS with 10 elements (pan+zoom, no blur)**    | >= 55 avg, >= 45 min                                      | >= 45 avg, >= 30 min                                                      | < 45 avg or < 30 min                                                |
| **FPS with 10 elements (blur, pan-pause mode)** | >= 55 avg during pan (blur off)                           | >= 45 avg during pan                                                      | < 45 avg during pan                                                 |
| **Zoom-to-cursor accuracy**                     | World point stays fixed at all zoom levels                | Minor drift at extreme zoom (< 0.10) that is not user-perceptible         | Visible jump or drift at Z1/Z2 ranges                               |
| **Semantic zoom hysteresis**                    | Zero flicker at all boundaries                            | Rare flicker (< 1 per 10 boundary crossings)                              | Consistent flicker at any boundary                                  |
| **Text readability at Z1 default (0.50)**       | Text is crisp and clearly readable                        | Minor subpixel blur that does not impair reading                          | Text is blurry or unreadable                                        |
| **Momentum feel**                               | Feels natural and controllable                            | Usable but needs parameter tuning                                         | Feels broken (teleporting, stuck, or erratic)                       |
| **Spring animation (flyTo)**                    | Smooth, settles within 600ms                              | Slight overshoot but settles within 1000ms                                | Does not converge, oscillates, or teleports                         |
| **Zustand subscribe() pattern**                 | Direct DOM writes bypass React reconciliation as expected | Minor reconciliation leakage (< 5 re-renders per second during animation) | subscribe() does not prevent re-renders; FPS drops during animation |
| **Element scaling**                             | >= 55 fps with 30 elements                                | >= 55 fps with 20 elements                                                | < 55 fps with 20 elements                                           |

**Decision rules:**

- All criteria at GO --> **GO**: Proceed to WS-1.1 with CSS transforms
- Any criteria at CONDITIONAL GO, none at NO GO --> **CONDITIONAL GO**: Proceed with documented mitigations; log risks in WS-1.1 SOW
- Any criterion at NO GO --> **NO GO**: Evaluate R3F hybrid (per tech-decisions.md upgrade path) or tldraw; document findings; revise Phase 1 scope and timeline

---

## 5. Acceptance Criteria

The spike is complete when all of the following are true:

1. **Camera store implemented**: `src/stores/camera.store.ts` exists with `offsetX`, `offsetY`, `zoom`, `semanticLevel` state and `panBy`, `zoomTo`, `flyTo`, `resetToLaunch`, `setCamera`, `setAnimating` actions. Store uses `create()` with `immer` middleware (per ecosystem Zustand pattern).

2. **Spatial math implemented**: `src/lib/spatial-math.ts` exports `zoomToPoint`, `resolveSemanticLevel`, `applyMomentumDecay`, `computeVelocityFromSamples`, `getVisibleBounds`, `isInViewport`, `springStep` functions. All functions have TypeScript signatures matching Section 4.1.2.

3. **Spike harness runs**: `app/(launch)/spike/page.tsx` renders the `SpatialViewport` > `SpatialCanvas` > `PlaceholderNode` hierarchy. User can pan (click-drag), zoom (scroll wheel), and see placeholder elements at world coordinates.

4. **60fps pan/zoom validated**: With 10 placeholder elements and `backdrop-filter` disabled, average FPS during a 10-second sustained pan is >= 55. Measured by the built-in FPS monitor and corroborated by Chrome DevTools Performance recording.

5. **Zoom-to-cursor works**: When zooming via scroll wheel, the world-space point under the cursor does not visibly shift. Validated at zoom levels 0.10, 0.50, 1.0, and 2.0.

6. **Semantic zoom transitions**: Zooming through all 4 semantic levels (Z0 through Z3) produces zero visible flicker. Placeholder elements switch their content representation at the correct thresholds per AD-2.

7. **Momentum implemented**: Releasing a pan gesture with velocity produces smooth deceleration. Camera comes to rest (does not drift indefinitely). Friction parameter is 0.92 or a tuned alternative documented in the report.

8. **flyTo spring animation**: Pressing "Reset to Launch" animates the camera from any position to (0, 0, 0.50) with a spring curve. Animation settles (reaches rest) within 1000ms.

9. **Viewport culling functional**: Elements outside the visible viewport bounds are not rendered (or are hidden). Panning to bring an off-screen element into view causes it to appear without user-perceptible pop-in (using a 200px world-space margin or a tuned value).

10. **`backdrop-filter` measured**: FPS measured with `backdrop-filter: blur(12px)` on all 10 elements. FPS delta from the no-blur baseline is documented. The pan-pause mitigation (disable blur during motion, re-enable after 150ms stillness) is implemented and its effectiveness is documented.

11. **Text readability documented**: Screenshots or written assessment of text rendering at zoom levels 0.08, 0.30, 0.50, 1.0, 1.5, 3.0. Assessment includes whether counter-scaling is needed at any level.

12. **Spike report written**: `docs/plans/initial-plan/phase-0-tech-spike/spike-report-zui.md` is populated with all test results, the go/no-go verdict, updated risk assessments, and recommendations for WS-1.1.

13. **Go/No-Go verdict issued**: The spike report contains a clear GO, CONDITIONAL GO, or NO GO verdict with justification referencing the decision matrix in Section 4.4.

---

## 6. Decisions Made

| #   | Decision                                                               | Rationale                                                                                                                                                                                                                                                                                                                                      | Source                                                 |
| --- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| D1  | Spike code lives in the production project (not a separate repo)       | Spike validates the actual build environment (Next.js 16, Tailwind v4, TypeScript strict). Successful spike code seeds WS-1.1 directly. The `(launch)/spike/` route is removed after the spike concludes.                                                                                                                                      | Gap Resolution #1 (upgrade path assumes same codebase) |
| D2  | Camera store uses `immer` middleware despite performance sensitivity   | The `subscribe()` pattern bypasses React entirely for high-frequency writes. `immer` is only used for the state update functions (`panBy`, `zoomTo`, etc.) which run at most once per rAF frame -- well within `immer`'s budget. This maintains consistency with `tarva-claude-agents-frontend` store patterns.                                | AD-1, ecosystem consistency                            |
| D3  | FPS measurement uses a custom utility, not a third-party library       | The spike needs a lightweight, embeddable FPS counter. Libraries like `stats.js` add dependencies and visual chrome. The `fps-monitor.ts` utility is ~40 lines and produces exportable data for the report.                                                                                                                                    | Spike simplicity                                       |
| D4  | Placeholder elements match capsule dimensions (192x228px, 28px radius) | Testing with production-sized elements gives a more realistic performance picture than arbitrary rectangles. The layout mimics the capsule ring (300px radius, 60-degree spacing) for spatial fidelity.                                                                                                                                        | Detailed Requirements (Launch Atrium)                  |
| D5  | Spike does not test particles or ambient CSS animations                | Particles use a separate HTML5 Canvas overlay (per Gap Resolution #1) and do not interact with the CSS transform pipeline. CSS `@keyframes` run on the compositor thread. Both are orthogonal to the spatial engine's performance. If needed, WS-1.6 can add a particle canvas to the spike page for a quick validation before Phase 1 closes. | AD-3 (three-tier separation)                           |
| D6  | Route group is `(launch)/` not `(hub)/`                                | Per PLANNING-LOG.md Deviation #2: hub-to-launch rename consistency                                                                                                                                                                                                                                                                             | PLANNING-LOG.md                                        |
| D7  | Spike does not integrate @tarva/ui components or full design tokens    | Design token setup is WS-0.2. The spike uses minimal inline styles or Tailwind defaults. This isolates the spatial engine performance from token system complexity. @tarva/ui integration is validated when WS-0.2 and WS-1.1 converge.                                                                                                        | Scope isolation                                        |
| D8  | The zoom-to-cursor formula uses viewport-relative coordinates          | Cursor position is measured relative to the viewport container (via `getBoundingClientRect` on the viewport `ref`), not `clientX`/`clientY` directly. This avoids bugs when the viewport does not start at (0, 0) in the page.                                                                                                                 | Standard practice for embedded canvases                |

---

## 7. Open Questions

| #   | Question                                                                                                                 | Impact                                                                                                                                                                                                         | Resolution Path                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | What scroll wheel delta scaling feels best for zoom speed?                                                               | The formula `newZoom = currentZoom * (1 + delta * factor)` needs a tuned `factor`. Too fast = jarring; too slow = tedious.                                                                                     | Spike will test `factor` values of 0.001, 0.002, and 0.003 and document the preferred value in the report.                                            |
| Q2  | Should `will-change: transform` be on the `SpatialCanvas` permanently or toggled during animation?                       | Permanent `will-change` promotes the element to its own compositor layer (good for transform perf) but consumes GPU memory. On a desktop with dedicated GPU this is likely fine, but the spike should measure. | Compare FPS with permanent vs. toggled `will-change`. Document in report.                                                                             |
| Q3  | Does `transform-origin: 0 0` vs `50% 50%` affect the zoom-to-cursor formula?                                             | The formula in Section 4.1.2 assumes `transform-origin: 0 0`. If the browser default (`50% 50%`) is used, the offset math changes.                                                                             | Spike will set `transform-origin: 0 0` explicitly and note this as a requirement for WS-1.1.                                                          |
| Q4  | Is `pointer-events: none` sufficient to prevent the `SpatialCanvas` div from intercepting events meant for the viewport? | The viewport captures events, but the canvas div (with `will-change: transform`) sits between the viewport and its children. Events may need to bubble up through the canvas.                                  | Test during spike. If events are swallowed, the canvas may need `pointer-events: none` with children re-enabling via `pointer-events: auto`.          |
| Q5  | What is the optimal spring config (stiffness, damping, mass) for `flyTo`?                                                | The "feel" of return-to-hub is subjective. Too stiff = robotic; too soft = floaty. The Oblivion aesthetic suggests controlled precision with slight organic overshoot.                                         | Test spring configs during spike. Start with `{ stiffness: 170, damping: 26, mass: 1 }` (a common default). Document the chosen values in the report. |
| Q6  | Should viewport culling unmount components (`{isVisible && <Node />}`) or toggle CSS `visibility: hidden`?               | Unmounting is more aggressive (frees DOM nodes) but can cause remount cost when panning back. `visibility: hidden` keeps the DOM tree stable but does not reduce node count.                                   | Spike will test both approaches and measure the FPS difference with 30+ elements. Document recommendation in report.                                  |

---

## 8. Risk Register

| #   | Risk                                                                                          | Likelihood | Impact | Severity | Mitigation                                                                                                                                                                                                      | Spike Validation                                                                                                                                                                             |
| --- | --------------------------------------------------------------------------------------------- | ---------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Zoom-to-cursor formula produces visible jumps at extreme zoom levels (< 0.10 or > 2.5)        | Medium     | High   | High     | The analytical formula is mathematically exact, but floating-point precision at extreme scales may cause sub-pixel drift. Clamp zoom to [0.08, 3.0] to stay in safe range.                                      | Test scenario C1 validates accuracy across the full zoom range. Measured by visual inspection and by logging world-space coordinates of a fixed test point.                                  |
| R2  | Semantic zoom hysteresis bands are too narrow or too wide                                     | Medium     | Medium | Medium   | AD-2 specifies 10% bands (e.g., Z1 enters at 0.30 but does not exit until < 0.27). If flicker persists, widen to 15%.                                                                                           | Test scenario C2 counts flicker events during slow zoom-through. If > 0 flicker events, adjust bands and retest.                                                                             |
| R3  | `backdrop-filter: blur(12px)` drops FPS below 45 during pan                                   | High       | Medium | High     | Risk #3 from the project risk register. Pan-pause mitigation: disable `backdrop-filter` during active pan, re-enable after 150ms of stillness. Fallback: replace blur with a solid semi-transparent background. | Test scenarios A2 and A3 directly measure this. A3 validates the mitigation. Go/no-go criterion requires >= 45 avg FPS during pan with mitigation active.                                    |
| R4  | Zustand `subscribe()` does not fully bypass React reconciliation                              | Low        | High   | Medium   | If `subscribe()` triggers any React re-renders during animation, FPS will drop. The pattern is well-documented in Zustand's API, but the interaction with immer middleware is less tested.                      | Monitor React DevTools "Highlight updates" during pan/zoom. If components flash, the pattern is leaking renders. Fallback: use a vanilla store (outside Zustand) for the animation-hot path. |
| R5  | Momentum velocity sampling (5 pointer samples) produces erratic results on high-DPI trackpads | Medium     | Low    | Low      | macOS trackpads generate high-frequency pointer events. 5 samples at 60fps = ~83ms window, which should be sufficient. If velocity is erratic, increase to 8-10 samples or use time-weighted averaging.         | Subjective assessment during pan testing. If momentum direction or speed feels wrong after flick-release, tune the sample count or averaging algorithm.                                      |
| R6  | Spring animation for `flyTo` does not converge (oscillates indefinitely)                      | Low        | Medium | Low      | Spring physics with reasonable damping always converge. But if `dt` (frame time) varies significantly (e.g., during GC pauses), the Euler integration can become unstable.                                      | Test scenario C3 verifies convergence. If settling takes > 2000ms, increase damping. If oscillation occurs, switch to Verlet integration or use a fixed timestep with interpolation.         |
| R7  | Spike scope creeps into production polish                                                     | Medium     | Medium | Medium   | The spike's purpose is validated knowledge, not shipping code. Risk #6 from the project register. Time-box the spike to 3 days. If findings are clear after 2 days, write the report and stop.                  | Spike is time-boxed. Section 2 (Out of Scope) explicitly excludes production concerns.                                                                                                       |
| R8  | `will-change: transform` on the `SpatialCanvas` div causes excessive GPU memory consumption   | Low        | Low    | Low      | A single promoted layer for the spatial container is standard practice. The concern is if child elements also get promoted, creating dozens of layers.                                                          | Check Chrome DevTools Layers panel during testing. If > 10 compositor layers exist, investigate and remove unnecessary `will-change` from children.                                          |

---

## Appendix A: File Manifest

All paths are relative to the project root. Files marked (create) are new; files marked (modify) update existing scaffolding from WS-0.1.

| File                                                             | Action | Description                                      |
| ---------------------------------------------------------------- | ------ | ------------------------------------------------ |
| `src/stores/camera.store.ts`                                     | Create | Zustand camera store with subscribe() pattern    |
| `src/lib/spatial-math.ts`                                        | Create | Zoom-to-cursor, momentum, culling, spring math   |
| `src/lib/fps-monitor.ts`                                         | Create | Frame-time measurement utility                   |
| `src/components/spatial/SpatialViewport.tsx`                     | Create | Outer viewport container                         |
| `src/components/spatial/SpatialCanvas.tsx`                       | Create | CSS-transformed container with direct DOM writes |
| `src/components/spatial/spike/PlaceholderNode.tsx`               | Create | Test placeholder element                         |
| `src/hooks/use-pan.ts`                                           | Create | Pan + momentum hook                              |
| `src/hooks/use-zoom.ts`                                          | Create | Zoom-to-cursor hook                              |
| `src/hooks/use-semantic-zoom.ts`                                 | Create | Semantic level reader hook                       |
| `src/hooks/use-viewport-cull.ts`                                 | Create | Viewport culling hook                            |
| `app/(launch)/spike/page.tsx`                                    | Create | Spike test harness page                          |
| `docs/plans/initial-plan/phase-0-tech-spike/spike-report-zui.md` | Create | Spike findings report (populated after testing)  |

## Appendix B: Zoom-to-Cursor Formula Derivation

The zoom-to-cursor formula ensures that the world-space point under the cursor remains fixed on screen during zoom operations. This is the core spatial math that Risk #2 is concerned about.

**Setup:**

- Viewport is a fixed container at screen position (0, 0) with dimensions `(W, H)`.
- The `SpatialCanvas` div has `transform: translate(offsetX, offsetY) scale(zoom)`.
- A world-space point `(wx, wy)` appears on screen at `(offsetX + wx * zoom, offsetY + wy * zoom)`.
- The cursor is at screen position `(cx, cy)` relative to the viewport.

**Goal:** After changing zoom from `z_old` to `z_new`, find `(offsetX', offsetY')` such that the world point under the cursor stays at `(cx, cy)`.

**Derivation:**

1. The world point under the cursor before zoom: `wx = (cx - offsetX) / z_old`
2. After zoom, we want: `cx = offsetX' + wx * z_new`
3. Substituting: `offsetX' = cx - ((cx - offsetX) / z_old) * z_new`
4. Simplifying: `offsetX' = cx - (cx - offsetX) * (z_new / z_old)`

Same for Y. This is the formula implemented in `zoomToPoint()`.

**Edge cases to test:**

- Cursor at viewport center (should zoom symmetrically)
- Cursor at viewport corner (maximum offset correction)
- Zoom at minimum (0.08) and maximum (3.0) boundaries
- Rapid zoom direction changes (in-out-in)
- Zoom while momentum is active (should compose correctly)

## Appendix C: Semantic Zoom Hysteresis State Machine

The hysteresis logic prevents rapid flickering when the zoom level hovers near a threshold boundary. Per AD-2, each boundary has a 10% dead zone.

```
                 0.08                    0.27  0.30              0.72  0.80         1.35  1.50              3.0
  Z0 ─────────────────────────────────|~~~~|──────────────────|~~~~|──────────────|~~~~|────────────────────
  Z1                                  |~~~~|──────────────────|~~~~|──────────────|~~~~|
  Z2                                                         |~~~~|──────────────|~~~~|
  Z3                                                                             |~~~~|────────────────────

  |~~~~| = hysteresis band (transition depends on direction)
```

**State transitions:**

- Z0 -> Z1: zoom crosses 0.30 (upward)
- Z1 -> Z0: zoom crosses 0.27 (downward)
- Z1 -> Z2: zoom crosses 0.80 (upward)
- Z2 -> Z1: zoom crosses 0.72 (downward)
- Z2 -> Z3: zoom crosses 1.50 (upward)
- Z3 -> Z2: zoom crosses 1.35 (downward)

The `resolveSemanticLevel()` function takes both the current zoom and the previous semantic level. If the zoom is within a hysteresis band, the previous level is preserved. Only when the zoom fully crosses the band does the level change.
