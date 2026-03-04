# ZUI Tech Spike Report

> **Date:** 2026-02-26
> **Duration:** Single session (implementation + code review)
> **Machine:** [To be filled during interactive testing]
> **Browser:** [To be filled during interactive testing]
> **Verdict:** CONDITIONAL GO (pending interactive performance validation)

## Executive Summary

The CSS transforms spatial engine has been implemented as a complete spike harness with all specified components: camera store with Zustand + immer, spatial math library (zoom-to-cursor, hysteresis, momentum, culling, spring physics), 4 custom hooks (pan, zoom, semantic-zoom, viewport-cull), spatial viewport and canvas components, and a test page with configurable controls. The code compiles cleanly under TypeScript strict mode and produces a successful Next.js 16 production build. All mathematical foundations are sound (zoom-to-cursor formula, hysteresis state machine, spring physics integration). The verdict is CONDITIONAL GO pending interactive 60fps validation in the browser, which requires manual testing with the dev server running.

## 1. Performance Results

### 1.1 FPS by Scenario

| Scenario | Elements | Blur  | Avg FPS | Min FPS | P5 FPS | Dropped Frames | Verdict |
| -------- | -------- | ----- | ------- | ------- | ------ | -------------- | ------- |
| A1       | 10       | Off   | [PENDING] | [PENDING] | [PENDING] | [PENDING] | [PENDING] |
| A2       | 10       | On    | [PENDING] | [PENDING] | [PENDING] | [PENDING] | [PENDING] |
| A3       | 10       | Pause | [PENDING] | [PENDING] | [PENDING] | [PENDING] | [PENDING] |
| B1       | 20       | Off   | [PENDING] | [PENDING] | [PENDING] | [PENDING] | [PENDING] |
| B2       | 30       | Off   | [PENDING] | [PENDING] | [PENDING] | [PENDING] | [PENDING] |
| B3       | 50       | Off   | [PENDING] | [PENDING] | [PENDING] | [PENDING] | [PENDING] |

**Status:** FPS measurement infrastructure is in place (built-in FPS monitor with 120-frame rolling window, avg/min/current/dropped-frame tracking). Interactive testing required to populate this table. Run `pnpm dev` and navigate to `/spike`.

### 1.2 Scaling Analysis

[PENDING interactive testing. The element count slider (10/20/30/50) and visible node counter are implemented. The spike page supports viewport culling which will reduce the effective rendered node count at high zoom levels.]

### 1.3 backdrop-filter Impact

[PENDING interactive testing. The pan-pause mitigation is fully implemented:
- `backdrop-filter: blur(12px)` is toggled via the "backdrop-filter" switch in the control panel
- During active pan/zoom (`isAnimating === true`), blur is disabled on all PlaceholderNodes
- After 150ms of stillness (`PAN_PAUSE_DELAY_MS`), blur is re-enabled
- The control panel displays current pause state ("PAUSED (pan active)" vs "ACTIVE (blur enabled)")]

## 2. Zoom-to-Cursor Validation

**Code review assessment: HIGH CONFIDENCE**

The zoom-to-cursor formula is implemented exactly per the SOW derivation (Appendix B):

```
newOffsetX = cursorX - (cursorX - oldOffsetX) * (newZoom / oldZoom)
newOffsetY = cursorY - (cursorY - oldOffsetY) * (newZoom / oldZoom)
```

Key implementation details verified:
- Cursor position is measured relative to the viewport via `getBoundingClientRect()` (per D8 -- viewport-relative coordinates)
- `transform-origin: 0 0` is set explicitly on SpatialCanvas (per Q3)
- Zoom is clamped to [0.08, 3.0] before applying the formula
- The formula is a pure function in `spatial-math.ts`, isolated from side effects

**Potential edge cases:**
- At zoom 0.08, the ratio `newZoom / oldZoom` approaches very small values. Floating-point precision should be sufficient for the clamped range.
- Rapid zoom direction changes compose correctly because each `zoomTo` call reads the current state fresh.

[PENDING: Visual verification that the world-space point under the cursor stays fixed. Test at zoom levels 0.10, 0.50, 1.0, and 2.0.]

## 3. Semantic Zoom Hysteresis

**Code review assessment: HIGH CONFIDENCE**

The hysteresis state machine is implemented as a pure `switch` statement in `resolveSemanticLevel()`:

| Transition | Condition |
|-----------|-----------|
| Z0 -> Z1 | zoom >= 0.30 |
| Z1 -> Z0 | zoom < 0.27 |
| Z1 -> Z2 | zoom >= 0.80 |
| Z2 -> Z1 | zoom < 0.72 |
| Z2 -> Z3 | zoom >= 1.50 |
| Z3 -> Z2 | zoom < 1.35 |

These thresholds match the AD-2 specification exactly. The 10% hysteresis bands are:
- Z0/Z1 boundary: enter 0.30, exit 0.27 (10% = 0.03)
- Z1/Z2 boundary: enter 0.80, exit 0.72 (10% = 0.08)
- Z2/Z3 boundary: enter 1.50, exit 1.35 (10% = 0.15)

The level is recalculated in both `zoomTo` and `setCamera` store actions, ensuring consistency regardless of how the zoom changes.

PlaceholderNode renders different content per level:
- Z0: Minimal beacon dot (ember-bright)
- Z1: ID badge + label (default landing view)
- Z2: Card with progress bar, position, status
- Z3: Detailed metrics (CPU, memory, position)

[PENDING: Visual verification of flicker-free transitions by slowly zooming through boundaries.]

## 4. Momentum Feel

**Code review assessment: MEDIUM CONFIDENCE (subjective tuning required)**

Implementation details:
- Velocity sampling: Last 5 pointer samples (`MOMENTUM_SAMPLES = 5`)
- Velocity computation: Uses first-to-last sample delta divided by time (more stable than inter-sample averaging)
- Friction: 0.92 per rAF frame (`MOMENTUM_FRICTION = 0.92`)
- Stop threshold: 0.5 px/frame (`MOMENTUM_STOP_THRESHOLD = 0.5`)
- Velocity is computed in px/ms then converted to px/frame at 60fps (multiply by 16.67)

The momentum loop uses `requestAnimationFrame` and calls `panBy()` directly, which triggers the Zustand store update and cascades to SpatialCanvas's direct DOM write.

[PENDING: Subjective assessment of momentum feel. If too floaty, reduce friction to 0.88-0.90. If too sticky, increase to 0.94-0.95.]

## 5. Spring Animation (flyTo)

**Code review assessment: HIGH CONFIDENCE**

Implementation details:
- Spring config: `{ stiffness: 170, damping: 26, mass: 1, restThreshold: 0.01 }`
- Integration: Semi-implicit Euler (velocity updated first, then position)
- dt: Computed from frame timestamps, capped at 64ms to prevent instability during GC pauses
- Convergence: Spring settles when both displacement and velocity are below `restThreshold`
- All three axes (offsetX, offsetY, zoom) are animated independently with the same spring config
- `isAnimating` flag is managed correctly (set true at start, false when all axes at rest)
- Previous flyTo animations are cancelled before starting new ones

The `resetToLaunch()` action calls `flyTo(0, 0, 0.50)` which animates to the default camera position.

[PENDING: Verify smooth animation, settling time, and overshoot behavior. Expected settling within 600-1000ms with slight organic overshoot.]

## 6. Text Readability

| Zoom Level | Semantic Level | Readability | Notes |
| ---------- | -------------- | ----------- | ----- |
| 0.08       | Z0             | [PENDING]   | Z0 shows beacon dot only; text not expected to be readable |
| 0.30       | Z1 entry       | [PENDING]   | Z1 shows label text |
| 0.50       | Z1 default     | [PENDING]   | Primary landing view -- text must be crisp |
| 1.00       | Z2 entry       | [PENDING]   | Full card with detailed text |
| 1.50       | Z3 entry       | [PENDING]   | Detailed metrics view |
| 3.00       | Z3 max         | [PENDING]   | Maximum zoom -- check for pixelation |

[PENDING: Assessment requires running the dev server and visual inspection. CSS transform scaling with `will-change: transform` should promote the layer to GPU, producing smooth text at most zoom levels. Counter-scaling may be needed if text appears blurry at fractional zoom levels (especially 0.50).]

## 7. Viewport Culling

**Code review assessment: HIGH CONFIDENCE**

Implementation details:
- `getVisibleBounds()` computes world-space bounds from viewport dimensions, camera offset, and zoom
- 200px world-space margin (`VIEWPORT_CULL_MARGIN`) prevents pop-in during pan
- `useViewportCull()` subscribes to camera state with rAF debouncing (bounds recomputed at most once per frame)
- The spike page uses conditional rendering (`{isVisible && <Node />}`) per Q6 option A (unmount approach)
- Visible node count is displayed in the bottom-left corner for verification

The culling math:
```
visibleLeft   = -offsetX / zoom - margin
visibleTop    = -offsetY / zoom - margin
visibleRight  = (viewportWidth - offsetX) / zoom + margin
visibleBottom = (viewportHeight - offsetY) / zoom + margin
```

[PENDING: Verify no visible pop-in when panning quickly. If pop-in occurs, increase margin from 200px to 300-400px. Also compare unmount vs `visibility: hidden` approach for FPS impact.]

## 8. Risks Updated

| Risk # | Original Assessment                       | Spike Finding | Updated Status |
| ------ | ----------------------------------------- | ------------- | -------------- |
| 1      | CSS visual ceiling (Medium/Medium)        | Architecture implemented; pure CSS transforms with direct DOM writes via subscribe(). No React reconciliation in the hot path. | PENDING validation -- code review shows correct patterns |
| 2      | Zoom-to-cursor edge cases (Medium/High)   | Formula implemented per Appendix B derivation. Viewport-relative coordinates used (D8). transform-origin: 0 0 set (Q3). | LIKELY MITIGATED -- formula is mathematically exact |
| 3      | backdrop-filter frame drops (High/Medium) | Pan-pause mitigation implemented (disable during motion, 150ms re-enable delay). A/B toggle in spike controls. | PENDING FPS measurement |
| 6      | Scope creep gating (High/High)            | Spike scoped correctly. Out-of-scope items excluded. Time-boxed implementation. | ON TRACK |
| 8      | Text blur at fractional zoom (Medium/Low) | Semantic zoom content adapts to level (minimal content at Z0, full detail at Z3). Counter-scaling not yet tested. | PENDING visual assessment |

## 9. Assumptions Validated

| Assumption # | Statement                             | Validated? | Evidence |
| ------------ | ------------------------------------- | ---------- | -------- |
| 6            | GPU compositing with 50+ elements     | PARTIAL    | `will-change: transform` applied to SpatialCanvas. Element count slider goes to 50. FPS measurement pending. |
| 8            | 60fps with particles + CSS animations | N/A        | Particles and ambient CSS animations are out of scope for this spike (per D5). Will be validated in WS-1.6. |

## 10. Recommendations for WS-1.1

Based on code review and architectural analysis:

1. **Confirmed architecture patterns:**
   - `useCameraStore.subscribe()` for direct DOM writes is the correct pattern. The SpatialCanvas component never re-renders during camera animation.
   - Zustand + immer for the camera store works because immer runs only on the state update call (at most once per rAF frame), not in the render path.
   - Pure math functions in `spatial-math.ts` are easily testable and composable.

2. **Suggested parameter adjustments (pending interactive validation):**
   - `ZOOM_SENSITIVITY = 0.001` -- may need adjustment for trackpad vs. mouse wheel feel
   - `MOMENTUM_FRICTION = 0.92` -- subjective tuning required
   - `DEFAULT_SPRING_CONFIG = { stiffness: 170, damping: 26, mass: 1 }` -- good starting point, may need tuning for the Oblivion aesthetic

3. **Known considerations:**
   - `transform-origin: 0 0` is mandatory for the zoom-to-cursor formula. This must be documented as a hard requirement.
   - `pointer-events: none` on SpatialCanvas with `pointer-events: auto` on children resolves event passthrough (Q4).
   - `will-change: transform` should remain permanent on SpatialCanvas (Q2). The single promoted layer is standard practice for a spatial container. Monitor GPU memory via Chrome DevTools Layers panel.

4. **API changes from spike signatures:**
   - None anticipated. The spike API matches the SOW signatures exactly.
   - WS-1.1 should add: touch/pinch support, URL sync (`?cx=&cy=&cz=`), bounds constraints, and minimap integration points.

5. **subscribe() pattern assessment:**
   - The pattern works as designed: SpatialCanvas subscribes to store changes and writes `element.style.transform` directly.
   - PlaceholderNode uses `useSemanticZoom()` (standard React selector) for low-frequency semantic level reads -- this triggers React re-renders only at level boundaries, not during continuous zoom.
   - The split between high-frequency (subscribe) and low-frequency (selector) access patterns is clean and should carry forward.

## Open Questions Resolved (from SOW Section 7)

| # | Question | Resolution |
|---|----------|------------|
| Q1 | Zoom sensitivity | Implemented with factor 0.001. Needs interactive tuning. |
| Q2 | `will-change` permanent vs toggled | Set permanent. Review in WS-1.1 if GPU memory is a concern. |
| Q3 | `transform-origin: 0 0` requirement | Confirmed mandatory. Set explicitly in SpatialCanvas. |
| Q4 | `pointer-events` passthrough | Resolved: canvas has `pointer-events: none`, children re-enable with `pointer-events: auto`. |
| Q5 | Spring config | Using `{ stiffness: 170, damping: 26, mass: 1 }`. Needs interactive feel assessment. |
| Q6 | Culling: unmount vs visibility | Using unmount approach (`{isVisible && <Node />}`). Need to compare with visibility toggle for FPS with 30+ elements. |

## Appendix: Raw Data

[To be populated after interactive testing. The FPS monitor exports `frameTimes` as a JSON-serializable array from `fpsMonitorRef.current.snapshot().frameTimes`.]

## Appendix: Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/lib/spatial-math.ts` | Created | Zoom-to-cursor, hysteresis, momentum, culling, spring math |
| `src/lib/fps-monitor.ts` | Created | Frame-time measurement utility (120-frame window) |
| `src/stores/camera.store.ts` | Replaced | Full Zustand store with immer, all 6 actions, flyTo spring loop |
| `src/hooks/use-pan.ts` | Created | Click-drag pan with 5-sample velocity + momentum decay |
| `src/hooks/use-zoom.ts` | Created | Scroll-wheel zoom-to-cursor |
| `src/hooks/use-semantic-zoom.ts` | Created | SemanticZoomLevel reader hook |
| `src/hooks/use-viewport-cull.ts` | Created | rAF-debounced viewport culling |
| `src/components/spatial/SpatialViewport.tsx` | Created | Outer viewport container (bg-void, overflow hidden) |
| `src/components/spatial/SpatialCanvas.tsx` | Created | CSS-transformed container with direct DOM writes |
| `src/components/spatial/spike/PlaceholderNode.tsx` | Created | Test element with 4-level semantic content |
| `src/app/(launch)/spike/page.tsx` | Created | Spike test harness with control overlay |
| `docs/plans/initial-plan/phase-0-tech-spike/spike-report-zui.md` | Created | This report |
