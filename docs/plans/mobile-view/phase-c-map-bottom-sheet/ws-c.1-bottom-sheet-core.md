# WS-C.1: Bottom Sheet Core

> **Workstream ID:** WS-C.1
> **Phase:** C -- Map Tab + Bottom Sheet
> **Assigned Agent:** `world-class-ux-designer`
> **Size:** L
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.2 (MobileShell provides viewport scaffold and tab state), WS-A.3 (glass tokens `--glass-sheet-bg`, `--glass-sheet-blur`, `--glass-sheet-border`, `--glass-sheet-shadow`, `--glass-sheet-radius`; spring config tokens `--sheet-spring-stiffness`, `--sheet-spring-damping`, `--sheet-spring-mass`; drag handle tokens `--drag-handle-width`, `--drag-handle-height`, `--drag-handle-color`, `--drag-handle-glow`, `--drag-handle-margin`; snap point tokens `--sheet-snap-*`; `--sheet-landscape-max-height`; `--space-bottom-sheet-handle`), WS-A.4 (safe area token `--safe-area-bottom` for sheet bottom padding)
> **Blocks:** WS-C.2 (Bottom Sheet Advanced extends this with fullscreen, popstate, focus trap, aria-modal), WS-C.4 (Map Interactions opens alert detail sheet via this component), WS-D.1 (Category Detail renders inside sheet), WS-D.2 (Alert Detail renders inside sheet), WS-C.5 (Settings renders inside sheet)
> **Resolves:** Gap 1 (Bottom Sheet Under-Scoped -- core drag and snap sub-task), Risk 3 (scroll-vs-drag conflict)

---

> **Review Fixes Applied (Phase C Review):**
>
> - **H-1 (API mismatch):** This SOW's `MobileBottomSheetProps` is the authoritative API. Add `ariaLabel: string` to base props (not deferred to C.2). Consumers (C.4, C.5) must use `config: BottomSheetConfig` pattern via `SHEET_CONFIGS` constants, `onDismiss` (not `onClose`), and `isOpen` controlled prop.
> - **H-2 (snap format):** Integer percentages `[70, 100]` are authoritative. Add runtime dev guard: `if (snapPoints.some(p => p > 0 && p < 1)) console.warn('Snap points should be integers 0-100, not fractions')`.
> - **H-3 (extension points for C.2):** Add `headerActions?: React.ReactNode` slot prop rendered between drag handle and scroll area. Use `forwardRef` + `useImperativeHandle` to expose `{ snapTo, dismiss, getCurrentSnap }`. Export `useBottomSheetDrag` hook return type for C.2 consumption.

---

## 1. Objective

Build the `MobileBottomSheet` component: the foundational UI primitive for all mobile drill-down interactions. The sheet slides up from the bottom of the viewport using spring physics driven by `motion/react` v12 drag handlers, snaps to context-dependent positions, and presents a glass-material surface with an Oblivion-aesthetic drag handle. Scroll-vs-drag conflict resolution prevents the sheet from dragging when the user intends to scroll internal content, and vice versa.

This is the most complex single component in the mobile view. It powers alert detail, category detail, priority feed, settings, time range selection, and triage rationale. Five downstream workstreams (WS-C.2, WS-C.4, WS-D.1, WS-D.2, WS-C.5) depend on this component being correct and stable. A bug here blocks Phases D and E entirely.

This workstream delivers the core drag-and-snap mechanics, visual surface, and scroll conflict resolution. WS-C.2 adds expand-to-fullscreen, `history.pushState`/`popstate` browser back integration, focus trap, `aria-modal`, and landscape max height enforcement.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `MobileBottomSheet` component | `motion.div` with `drag="y"`, spring-animated snap transitions, glass background, box-shadow, border-radius, drag handle. Renders via React portal to `document.body`. |
| `BottomSheetConfig` type system | TypeScript interfaces defining per-context snap point configurations, spring parameters, and dismissal behavior. Exported from `src/lib/interfaces/mobile.ts`. |
| Per-context snap point definitions | Predefined configs for: Alert Detail (70%, 100%), Category Detail (35%, 65%, 100%), Priority Feed (60%, 100%), Filter/Time Range (40%). Exported as named constants. |
| Spring physics | `motion/react` spring transition with `stiffness: 400`, `damping: 35`, `mass: 0.8`. Used for all snap-to animations and drag release. |
| Drag handle | 40px wide, 2px tall luminous line with 8px glow, centered in a 24px touch zone. Always enables sheet drag regardless of scroll state. |
| Velocity-based snap logic | `onDragEnd` handler that reads `velocity.y` and `point.y` from the drag event info to determine which snap point to animate to. Downward velocity above threshold dismisses. Upward velocity above threshold promotes to next snap. |
| Scroll-vs-drag conflict resolution | Algorithm that disables sheet drag when internal scroll position > 0, re-enables when scrolled to top and dragging downward. Uses `overscroll-behavior: contain` on scroll container. |
| `useBottomSheetDrag` hook | Encapsulates drag-to-snap calculation logic, scroll conflict gating, and spring animation state. Consumed exclusively by `MobileBottomSheet`. |
| Backdrop overlay | Semi-transparent overlay behind the sheet (`rgba(0, 0, 0, 0.5)`) that dims content. Tap-to-dismiss when tapping the backdrop. Opacity animated proportionally to sheet position. |
| Open/close animations | Sheet enters from below viewport with spring animation to initial snap point. Sheet exits by animating translateY past viewport bottom, then unmounting. |
| CSS file | `src/styles/mobile-bottom-sheet.css` for glass surface, drag handle, scroll container, and backdrop styles. |
| Unit tests | Tests for snap point calculation, velocity-based snap selection, scroll conflict gating logic. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Expand-to-fullscreen (100% viewport with collapse button) | WS-C.2 (Bottom Sheet Advanced). This WS provides snap points up to 100% but does not implement the dedicated fullscreen mode with its own collapse UI. |
| `history.pushState` / `popstate` browser back integration | WS-C.2. Requires careful coordination with tab navigation and morph state. |
| Focus trap + `aria-modal="true"` + return focus on dismiss | WS-C.2 (accessibility layer). This WS renders with `role="dialog"` as a foundation but does not implement focus trapping. |
| Landscape max height constraint (60%) | WS-C.2. The snap point calculation in this WS uses viewport height directly. WS-C.2 clamps snap points to `--sheet-landscape-max-height` when `isLandscape` is true. |
| Category tint gradient overlay | WS-C.2 (adds `--sheet-category-tint` radial gradient based on active category color). |
| Sheet content components | WS-D.1 (Category Detail), WS-D.2 (Alert Detail), WS-C.5 (Settings) render their content as children of this sheet. |
| Corner bracket decorations on sheet header | WS-C.2 or consuming workstreams. |
| Escape key to close | WS-C.2 (keyboard accessibility). |
| P1 audio notification when sheet opens for P1 alert | WS-F.4 (Protective Ops Hooks). |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-A.2 `MobileShell` | Viewport scaffold. The sheet portals to `document.body` and overlays the shell. MobileShell provides `100dvh` viewport context. | Pending (Phase A) |
| WS-A.3 `mobile-tokens.css` | Glass tokens: `--glass-sheet-bg`, `--glass-sheet-blur`, `--glass-sheet-border`, `--glass-sheet-shadow`, `--glass-sheet-radius`. Spring tokens: `--sheet-spring-stiffness`, `--sheet-spring-damping`, `--sheet-spring-mass`. Handle tokens: `--drag-handle-width`, `--drag-handle-height`, `--drag-handle-color`, `--drag-handle-glow`, `--drag-handle-margin`. Snap tokens: `--sheet-snap-alert-detail`, `--sheet-snap-category-detail`, `--sheet-snap-priority-feed`, `--sheet-snap-filter`. Layout: `--space-bottom-sheet-handle` (24px). | Pending (Phase A) |
| WS-A.4 `spatial-tokens.css` | `--safe-area-bottom` for sheet bottom padding on notched devices. | Pending (Phase A) |
| `src/lib/interfaces/mobile.ts` | `MobileTab` type (exists from WS-A.2). This WS extends the file with bottom sheet interfaces. | Pending (WS-A.2 creates file) |
| `motion/react` v12 | `motion.div`, `useMotionValue`, `useTransform`, `useSpring`, `useDragControls`, `animate`, `AnimatePresence`, `PanInfo` type. | Available (existing dependency) |
| `src/styles/spatial-tokens.css` | `--color-void`, `--color-border-subtle`, `--ease-morph`, `--duration-fast`. | Exists |
| `src/stores/ui.store.ts` | `resetMorph()` for coordinating sheet dismiss with morph state (consumed by callers, not by this component directly). | Exists |

---

## 4. Deliverables

### D-1: TypeScript Interfaces (extend `src/lib/interfaces/mobile.ts`)

Append bottom sheet type definitions to the existing `mobile.ts` file created by WS-A.2.

```typescript
// ============================================================
// BOTTOM SHEET TYPES
// ============================================================

/**
 * A snap point expressed as a percentage of viewport height (0-100).
 * 0 = closed (bottom of viewport). 100 = top of viewport.
 */
export type SnapPointPercent = number

/**
 * Named snap point configurations for each sheet context.
 * Values are ascending percentages of viewport height.
 */
export interface BottomSheetConfig {
  /** Unique identifier for this sheet context. Used for logging and debugging. */
  id: string
  /**
   * Snap points as ascending percentages of viewport height.
   * Example: [35, 65, 100] means three snap positions.
   * The sheet can be dismissed by dragging below the lowest snap point.
   */
  snapPoints: readonly SnapPointPercent[]
  /**
   * Index into snapPoints for the initial position when the sheet opens.
   * Typically 0 (lowest snap) for peek-style sheets,
   * or snapPoints.length - 1 for full-open sheets.
   */
  initialSnapIndex: number
  /**
   * Whether the sheet can be dismissed by dragging below the lowest snap point.
   * Default: true. Set false for modal sheets that require explicit close.
   */
  dismissible?: boolean
}

/**
 * Predefined sheet configurations for each context.
 * Snap point percentages match combined-recommendations and ui-design-system Section 11.
 */
export const SHEET_CONFIGS = {
  alertDetail: {
    id: 'alert-detail',
    snapPoints: [70, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
  categoryDetail: {
    id: 'category-detail',
    snapPoints: [35, 65, 100] as const,
    initialSnapIndex: 1,
    dismissible: true,
  },
  priorityFeed: {
    id: 'priority-feed',
    snapPoints: [60, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
  filterTimeRange: {
    id: 'filter-time-range',
    snapPoints: [40] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
  settings: {
    id: 'settings',
    snapPoints: [60, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
} as const satisfies Record<string, BottomSheetConfig>

/**
 * Spring configuration for sheet animations.
 * Read from CSS tokens at runtime; these are compile-time defaults.
 */
export const SHEET_SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}

/**
 * Velocity thresholds for snap-on-release behavior.
 * Units: pixels per second (from motion/react PanInfo.velocity.y).
 */
export const SHEET_VELOCITY_THRESHOLDS = {
  /** Downward velocity (positive y) above this dismisses or snaps down. */
  dismissVelocity: 500,
  /** Upward velocity (negative y) above this magnitude promotes to next snap up. */
  promoteVelocity: 500,
  /** Minimum drag distance (px) to consider a drag intentional. */
  minDragDistance: 10,
}
```

### D-2: `useBottomSheetDrag` hook (`src/hooks/use-bottom-sheet-drag.ts`)

Custom hook encapsulating all drag-to-snap calculation logic, scroll conflict gating, and animation state. This hook is the single source of truth for bottom sheet positioning.

**Signature:**

```typescript
interface UseBottomSheetDragOptions {
  config: BottomSheetConfig
  isOpen: boolean
  onDismiss: () => void
}

interface UseBottomSheetDragReturn {
  /** MotionValue for the sheet's y position (px from top of viewport). */
  sheetY: MotionValue<number>
  /** Current snap index (reactive). */
  currentSnapIndex: number
  /** Ref to attach to the scrollable content container inside the sheet. */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  /** Whether sheet drag is currently allowed (false when scroll content is scrolled). */
  dragEnabled: boolean
  /** DragControls instance for programmatic drag initiation from the handle. */
  dragControls: DragControls
  /** Handler for onDragEnd on the motion.div. */
  handleDragEnd: (event: PointerEvent, info: PanInfo) => void
  /** Handler for pointer down on the drag handle. */
  handleHandlePointerDown: (event: React.PointerEvent) => void
  /** Programmatically snap to a specific index. */
  snapTo: (index: number) => void
  /** Animated backdrop opacity (0-1), derived from sheet position. */
  backdropOpacity: MotionValue<number>
}
```

**Internal logic:**

1. **Viewport measurement.** On mount (and on resize), read `window.innerHeight` into a ref. All snap point percentages are converted to pixel y-positions relative to the viewport top: `yPosition = viewportHeight * (1 - snapPercent / 100)`. A snap point of 70% means the sheet top is at 30% from the viewport top (i.e., `0.3 * viewportHeight` pixels from top).

2. **MotionValue initialization.** Create `sheetY = useMotionValue(viewportHeight)` (starts off-screen at bottom). When `isOpen` transitions to `true`, animate `sheetY` to the initial snap position using the spring config. When `isOpen` transitions to `false`, animate `sheetY` to `viewportHeight` (off-screen).

3. **Snap point pixel array.** Compute `snapPositions: number[]` from `config.snapPoints` and `viewportHeight`. Recalculate on viewport resize. Example for `snapPoints: [35, 65, 100]` with `viewportHeight = 800`:
   - 35% -> sheet top at `800 * (1 - 0.35)` = `520px` from viewport top
   - 65% -> sheet top at `800 * (1 - 0.65)` = `280px` from viewport top
   - 100% -> sheet top at `800 * (1 - 1.00)` = `0px` from viewport top

4. **Drag constraints.** `dragConstraints` limits y between `0` (top of viewport, 100% open) and `viewportHeight` (fully off-screen). `dragElastic` is `{ top: 0.1, bottom: 0.2 }` -- slight rubber-band at top, more at bottom for dismissal feel.

5. **Backdrop opacity.** `backdropOpacity = useTransform(sheetY, [lowestSnapPosition, viewportHeight], [0.5, 0])`. The backdrop is fully transparent when the sheet is closed and reaches 0.5 opacity at the lowest snap point, staying at 0.5 for all higher positions.

6. **Drag end handler (`handleDragEnd`).** This is the core snap selection algorithm:

```typescript
function handleDragEnd(_event: PointerEvent, info: PanInfo) {
  const currentY = sheetY.get()
  const velocityY = info.velocity.y
  const snapPositions = snapPositionsRef.current

  // Fast dismiss: dragging down quickly past threshold
  if (velocityY > SHEET_VELOCITY_THRESHOLDS.dismissVelocity && config.dismissible) {
    onDismiss()
    return
  }

  // Fast promote: dragging up quickly past threshold
  if (velocityY < -SHEET_VELOCITY_THRESHOLDS.promoteVelocity) {
    const nextUp = findNextSnapAbove(currentY, snapPositions)
    if (nextUp !== null) {
      animateToSnap(nextUp)
      return
    }
  }

  // Velocity-biased nearest snap: project position forward by velocity
  // to find the "intended" position, then snap to the nearest point.
  const projectedY = currentY + velocityY * 0.2 // 200ms projection
  const nearestIndex = findNearestSnap(projectedY, snapPositions)

  // If projected below lowest snap and dismissible, dismiss
  if (projectedY > snapPositions[0] + dismissThreshold && config.dismissible) {
    onDismiss()
    return
  }

  animateToSnap(nearestIndex)
}
```

7. **`findNearestSnap` pure function.** Given a y-position and an array of snap positions (in pixels, where lower = higher on screen), return the index of the nearest snap point by absolute distance.

```typescript
function findNearestSnap(y: number, snapPositions: number[]): number {
  let nearestIndex = 0
  let nearestDistance = Math.abs(y - snapPositions[0])

  for (let i = 1; i < snapPositions.length; i++) {
    const distance = Math.abs(y - snapPositions[i])
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = i
    }
  }

  return nearestIndex
}
```

8. **`findNextSnapAbove` pure function.** Given a y-position and snap positions, return the index of the first snap position that is higher on screen (lower y value) than the current position. Returns `null` if already at the highest snap.

```typescript
function findNextSnapAbove(
  currentY: number,
  snapPositions: number[]
): number | null {
  // snapPositions are sorted descending (highest y = lowest on screen first)
  for (let i = snapPositions.length - 1; i >= 0; i--) {
    if (snapPositions[i] < currentY - SHEET_VELOCITY_THRESHOLDS.minDragDistance) {
      return i
    }
  }
  return null
}
```

9. **`animateToSnap` function.** Uses `animate(sheetY, targetPosition, SHEET_SPRING_CONFIG)` from `motion/react` to spring-animate to the target y position. Updates `currentSnapIndex` state.

10. **`snapTo` public method.** Allows parent components (WS-C.2 fullscreen, WS-D.1 category detail) to programmatically move the sheet to a specific snap index.

11. **Scroll conflict gating.** Described in detail in D-3 below.

### D-3: Scroll-vs-Drag Conflict Resolution

This is the most technically delicate part of the bottom sheet. The goal: when a user touches the sheet content and scrolls a list, the sheet itself must not drag. When the user is at the top of the scroll and drags downward, the sheet should drag down instead of rubber-banding the scroll.

**Algorithm:**

The `MobileBottomSheet` uses a split-control architecture. The drag handle (24px zone at top) always drives sheet drag. The scrollable content area conditionally drives sheet drag or internal scroll based on a real-time gating check.

**Implementation detail within `useBottomSheetDrag`:**

```
1. DRAG HANDLE ZONE (top 24px of sheet):
   - Always enables sheet drag
   - Uses useDragControls: on pointerdown, call dragControls.start(event)
   - The motion.div has dragListener={false} to prevent auto-listening
   - Drag is initiated ONLY from the handle OR via the content area gateway

2. CONTENT AREA GATEWAY:
   - scrollContainerRef tracks the scroll container element
   - A touch coordinator manages the handoff between scroll and drag

3. TOUCH COORDINATOR STATE MACHINE:
   State: 'idle' | 'scrolling' | 'dragging' | 'locked-scroll'

   On touchstart in content area:
     - Record touchStartY = event.touches[0].clientY
     - Record scrollTop = scrollContainerRef.current.scrollTop
     - Set state = 'idle'

   On touchmove in content area:
     - deltaY = event.touches[0].clientY - touchStartY
     - currentScrollTop = scrollContainerRef.current.scrollTop

     IF state === 'idle':
       IF scrollTop === 0 AND deltaY > 0 (pulling down):
         -> Set state = 'dragging'
         -> event.preventDefault() on the scroll container
         -> Start driving sheetY via the touch delta
       ELSE:
         -> Set state = 'scrolling'
         -> Allow normal scroll behavior

     IF state === 'scrolling':
       IF currentScrollTop === 0 AND deltaY > 0 (pulling down after hitting top):
         -> Set state = 'dragging'
         -> event.preventDefault()
         -> Start driving sheetY
       ELSE:
         -> Continue scrolling normally

     IF state === 'dragging':
       -> event.preventDefault()
       -> Update sheetY based on touch delta
       -> Do NOT allow scroll

     IF state === 'locked-scroll':
       -> Continue scrolling, never transition to dragging
       (Used when user starts by scrolling up -- momentum may briefly hit
        scrollTop=0 but the gesture intent is clearly scroll)

   On touchend in content area:
     IF state === 'dragging':
       -> Calculate velocity from touch history
       -> Run the same snap logic as handleDragEnd
     -> Reset state to 'idle'
```

**Edge cases handled:**

| Scenario | Expected Behavior |
|----------|-------------------|
| User is in content, scrollTop > 0, drags up | Normal scroll. Sheet does not move. |
| User is in content, scrollTop > 0, drags down | Normal scroll. Sheet does not move. |
| User is in content, scrollTop = 0, drags down | Sheet drags downward. Content does not scroll. |
| User is in content, scrollTop = 0, drags up | Content scrolls up. Sheet does not move. |
| User scrolls up rapidly, momentum carries past scrollTop=0, then direction reverses | Content scroll completes. If user then initiates a new downward gesture from scrollTop=0, sheet drags. No mid-gesture handoff from momentum scroll to sheet drag (this prevents jank). |
| User is at scrollTop=0, starts with slight horizontal move then vertical | Horizontal component is ignored. Only the vertical component determines scroll vs drag. |
| User taps drag handle and drags down | Sheet always drags from handle. No scroll check needed. |
| Sheet is at lowest snap (peek), content is short (no scrollbar) | All downward drags move the sheet. Upward drags snap to next point. No scroll conflict because content does not overflow. |

**CSS on the scroll container:**

```css
.mobile-bottom-sheet-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  /* Prevent browser pull-to-refresh from interfering */
  touch-action: pan-y;
}
```

`overscroll-behavior-y: contain` is critical. Without it, iOS Safari's rubber-band scroll on the content area would propagate to the viewport, creating a competing drag with the sheet.

### D-4: `MobileBottomSheet` component (`src/components/mobile/MobileBottomSheet.tsx`)

The rendered component. Uses the `useBottomSheetDrag` hook for all positioning logic.

**Props interface:**

```typescript
export interface MobileBottomSheetProps {
  /** Whether the sheet is open. Controls mount/unmount and enter/exit animation. */
  isOpen: boolean
  /** Called when the sheet should be dismissed (drag dismiss, backdrop tap). */
  onDismiss: () => void
  /** Configuration defining snap points and behavior for this sheet instance. */
  config: BottomSheetConfig
  /** Content rendered inside the scrollable area of the sheet. */
  children: React.ReactNode
  /** Optional class name applied to the sheet container for context-specific styling. */
  className?: string
  /**
   * Called when the sheet snaps to a new position.
   * Index refers to config.snapPoints array.
   * Used by WS-C.2 to sync popstate and by WS-D.1 to adjust map height.
   */
  onSnapChange?: (snapIndex: number) => void
}
```

**Component structure:**

```
<AnimatePresence>
  {isOpen && createPortal(
    <div className="mobile-bottom-sheet-portal">

      {/* Backdrop overlay */}
      <motion.div
        className="mobile-bottom-sheet-backdrop"
        style={{ opacity: backdropOpacity }}
        onClick={onDismiss}
        initial={{ opacity: 0 }}
        exit={{ opacity: 0 }}
      />

      {/* Sheet surface */}
      <motion.div
        className="mobile-bottom-sheet"
        style={{ y: sheetY }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: viewportHeight }}
        dragElastic={{ top: 0.1, bottom: 0.2 }}
        onDragEnd={handleDragEnd}
        initial={{ y: viewportHeight }}
        exit={{ y: viewportHeight }}
        transition={SHEET_SPRING_CONFIG}
        role="dialog"
      >
        {/* Drag handle zone */}
        <div
          className="mobile-bottom-sheet-handle-zone"
          onPointerDown={handleHandlePointerDown}
          style={{ touchAction: 'none' }}
        >
          <div className="mobile-bottom-sheet-handle" />
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollContainerRef}
          className="mobile-bottom-sheet-scroll"
          onTouchStart={handleContentTouchStart}
          onTouchMove={handleContentTouchMove}
          onTouchEnd={handleContentTouchEnd}
        >
          {children}
        </div>
      </motion.div>

    </div>,
    document.body
  )}
</AnimatePresence>
```

**Key implementation notes:**

1. **Portal rendering.** The sheet renders via `createPortal` to `document.body` to escape any `overflow: hidden` or `transform` containers in the component tree. This ensures the sheet always overlays the entire viewport at z-50.

2. **AnimatePresence exit.** When `isOpen` becomes `false`, `AnimatePresence` keeps the sheet mounted during the spring-animated exit to `y: viewportHeight`. The component unmounts only after the exit animation completes. This prevents abrupt visual pops.

3. **Pointer events on the handle.** The handle zone has `touchAction: 'none'` to prevent the browser from interpreting handle touches as scroll gestures. `onPointerDown` calls `dragControls.start(event)` to initiate drag from the handle.

4. **Sheet height.** The sheet element is `position: fixed` with `top: 0`, `left: 0`, `right: 0`, `height: 100dvh`. The `y` motion value offsets it downward. When `y = 0`, the sheet covers the full viewport. When `y = viewportHeight * 0.3`, the sheet covers the bottom 70%.

5. **No `will-change: transform`.** The `motion.div` already uses GPU-composited transforms. Adding `will-change` would create an unnecessary compositing layer hint on top of what motion/react already manages.

6. **Reduced motion.** When `prefers-reduced-motion: reduce` is active, replace the spring transition with `{ duration: 0.01 }` (near-instant). Drag still works mechanically but snap animations are instant. Detected via `useReducedMotion()` from `@tarva/ui/motion` (same pattern as `MobileScanLine`).

### D-5: CSS file (`src/styles/mobile-bottom-sheet.css`)

Dedicated CSS for the bottom sheet. Imported by `MobileBottomSheet.tsx`.

```css
/* =================================================================
   Mobile Bottom Sheet
   =================================================================
   Glass surface with spring-physics drag. See WS-C.1.
   Tokens from WS-A.3 mobile-tokens.css.
   ================================================================= */

/* Portal container -- full viewport overlay context */
.mobile-bottom-sheet-portal {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

.mobile-bottom-sheet-portal > * {
  pointer-events: auto;
}

/* Backdrop overlay */
.mobile-bottom-sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
  -webkit-tap-highlight-color: transparent;
}

/* Sheet surface */
.mobile-bottom-sheet {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100dvh;
  z-index: 51;
  display: flex;
  flex-direction: column;
  background: var(--glass-sheet-bg, rgba(5, 9, 17, 0.92));
  backdrop-filter: var(--glass-sheet-blur, blur(16px) saturate(130%));
  -webkit-backdrop-filter: var(--glass-sheet-blur, blur(16px) saturate(130%));
  border-top: var(--glass-sheet-border, 1px solid rgba(255, 255, 255, 0.08));
  border-radius: var(--glass-sheet-radius, 16px 16px 0 0);
  box-shadow: var(
    --glass-sheet-shadow,
    0 -4px 24px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.04)
  );
  /* Prevent content from rendering above the rounded corners */
  overflow: hidden;
  /* Prevent text selection during drag */
  -webkit-user-select: none;
  user-select: none;
}

/* Drag handle touch zone */
.mobile-bottom-sheet-handle-zone {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--space-bottom-sheet-handle, 24px);
  cursor: grab;
}

.mobile-bottom-sheet-handle-zone:active {
  cursor: grabbing;
}

/* Drag handle visual element */
.mobile-bottom-sheet-handle {
  width: var(--drag-handle-width, 40px);
  height: var(--drag-handle-height, 2px);
  background: var(--drag-handle-color, rgba(255, 255, 255, 0.20));
  border-radius: 1px;
  box-shadow: var(--drag-handle-glow, 0 0 8px rgba(255, 255, 255, 0.06));
}

/* Scrollable content area */
.mobile-bottom-sheet-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  padding-bottom: var(--safe-area-bottom, 0px);
}

/* Re-enable text selection inside content */
.mobile-bottom-sheet-scroll * {
  -webkit-user-select: text;
  user-select: text;
}

/* Reduced motion: instant transitions */
@media (prefers-reduced-motion: reduce) {
  .mobile-bottom-sheet {
    transition: none !important;
  }
}
```

### D-6: Snap Point Calculation Utilities (`src/lib/bottom-sheet-utils.ts`)

Pure functions for snap point math, extracted for testability.

```typescript
/**
 * Convert snap point percentages to pixel y-positions.
 *
 * @param snapPercents - Ascending array of viewport height percentages (e.g., [35, 65, 100])
 * @param viewportHeight - Current viewport height in pixels
 * @returns Descending array of y-positions in pixels (higher y = lower on screen).
 *          Index correspondence: snapPercents[i] -> result[i].
 *
 * Example: snapPercents [35, 65, 100], viewportHeight 800
 *   -> [520, 280, 0] (35% sheet = top at 520px, 65% = 280px, 100% = 0px)
 */
export function snapPercentsToPixels(
  snapPercents: readonly number[],
  viewportHeight: number
): number[] {
  return snapPercents.map((pct) => viewportHeight * (1 - pct / 100))
}

/**
 * Find the nearest snap position index for a given y-coordinate.
 *
 * @param y - Current y-position in pixels (from viewport top)
 * @param snapPositions - Array of snap y-positions in pixels
 * @returns Index of the nearest snap position
 */
export function findNearestSnap(y: number, snapPositions: number[]): number {
  let nearestIndex = 0
  let nearestDistance = Math.abs(y - snapPositions[0])

  for (let i = 1; i < snapPositions.length; i++) {
    const distance = Math.abs(y - snapPositions[i])
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestIndex = i
    }
  }

  return nearestIndex
}

/**
 * Find the next snap position above (higher on screen = lower y) the current position.
 * Returns null if already at or above the highest snap.
 *
 * @param currentY - Current y-position in pixels
 * @param snapPositions - Array of snap y-positions in pixels
 * @param minDistance - Minimum distance to consider "above" (prevents snapping to current)
 * @returns Index of the next higher snap, or null
 */
export function findNextSnapAbove(
  currentY: number,
  snapPositions: number[],
  minDistance: number = 10
): number | null {
  // Iterate from highest snap (lowest y) to lowest snap (highest y)
  // Find the first snap that is meaningfully above currentY
  for (let i = snapPositions.length - 1; i >= 0; i--) {
    if (snapPositions[i] < currentY - minDistance) {
      return i
    }
  }
  return null
}

/**
 * Find the next snap position below (lower on screen = higher y) the current position.
 * Returns null if already at or below the lowest snap.
 *
 * @param currentY - Current y-position in pixels
 * @param snapPositions - Array of snap y-positions in pixels
 * @param minDistance - Minimum distance to consider "below"
 * @returns Index of the next lower snap, or null
 */
export function findNextSnapBelow(
  currentY: number,
  snapPositions: number[],
  minDistance: number = 10
): number | null {
  for (let i = 0; i < snapPositions.length; i++) {
    if (snapPositions[i] > currentY + minDistance) {
      return i
    }
  }
  return null
}

/**
 * Determine the target snap index after a drag ends, accounting for velocity.
 *
 * The algorithm:
 * 1. If downward velocity exceeds dismiss threshold and sheet is dismissible -> dismiss
 * 2. If upward velocity exceeds promote threshold -> snap to next position above
 * 3. Otherwise, project position forward by velocity * 200ms and snap to nearest
 *
 * @param currentY - Sheet y-position at drag end (px)
 * @param velocityY - Drag velocity in y axis (px/s, positive = downward)
 * @param snapPositions - Array of snap y-positions (px)
 * @param dismissible - Whether the sheet can be dismissed by drag
 * @param viewportHeight - Viewport height for dismiss threshold calculation
 * @returns { snapIndex: number, dismiss: boolean }
 */
export function resolveSnapTarget(
  currentY: number,
  velocityY: number,
  snapPositions: number[],
  dismissible: boolean,
  viewportHeight: number
): { snapIndex: number; dismiss: boolean } {
  const { dismissVelocity, promoteVelocity, minDragDistance } =
    // Import from interfaces/mobile.ts at call site; here as params for testability
    { dismissVelocity: 500, promoteVelocity: 500, minDragDistance: 10 }

  // 1. Fast dismiss: high downward velocity
  if (velocityY > dismissVelocity && dismissible) {
    return { snapIndex: -1, dismiss: true }
  }

  // 2. Fast promote: high upward velocity
  if (velocityY < -promoteVelocity) {
    const nextUp = findNextSnapAbove(currentY, snapPositions, minDragDistance)
    if (nextUp !== null) {
      return { snapIndex: nextUp, dismiss: false }
    }
    // Already at highest snap, stay there
    return { snapIndex: snapPositions.length - 1, dismiss: false }
  }

  // 3. Velocity-biased nearest: project 200ms forward
  const projectedY = currentY + velocityY * 0.2

  // Check if projection carries past lowest snap -> dismiss
  const lowestSnapY = snapPositions[0]
  const dismissThreshold = viewportHeight * 0.15 // 15% past lowest snap
  if (projectedY > lowestSnapY + dismissThreshold && dismissible) {
    return { snapIndex: -1, dismiss: true }
  }

  // Clamp projection to valid range
  const clampedY = Math.max(
    snapPositions[snapPositions.length - 1],
    Math.min(lowestSnapY, projectedY)
  )

  const nearestIndex = findNearestSnap(clampedY, snapPositions)
  return { snapIndex: nearestIndex, dismiss: false }
}
```

### D-7: Integration in `MobileView.tsx`

After this workstream, `MobileView.tsx` can be used with the bottom sheet. The sheet is not rendered by default -- it appears when downstream workstreams (WS-C.4, WS-D.1, WS-D.2, WS-C.5) wire open triggers.

A minimal integration proof demonstrates the sheet working:

```typescript
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet'
import { SHEET_CONFIGS } from '@/lib/interfaces/mobile'

// Inside MobileView or a test harness:
const [sheetOpen, setSheetOpen] = useState(false)

<MobileBottomSheet
  isOpen={sheetOpen}
  onDismiss={() => setSheetOpen(false)}
  config={SHEET_CONFIGS.categoryDetail}
>
  <div style={{ padding: 16, color: 'white' }}>
    <h2>Sheet Content</h2>
    <p>This content is scrollable when it overflows.</p>
  </div>
</MobileBottomSheet>
```

**CSS import:** `MobileBottomSheet.tsx` imports `@/styles/mobile-bottom-sheet.css` as its first import. This CSS file is only loaded when the bottom sheet component is imported.

### D-8: Unit Tests (`src/lib/__tests__/bottom-sheet-utils.test.ts`)

Tests for the pure utility functions in `bottom-sheet-utils.ts`.

**Test cases for `snapPercentsToPixels`:**

```typescript
describe('snapPercentsToPixels', () => {
  it('converts percentages to pixel positions', () => {
    const result = snapPercentsToPixels([35, 65, 100], 800)
    expect(result).toEqual([520, 280, 0])
  })

  it('handles single snap point', () => {
    const result = snapPercentsToPixels([40], 1000)
    expect(result).toEqual([600])
  })

  it('handles 0% as full viewport offset (sheet closed)', () => {
    const result = snapPercentsToPixels([0], 800)
    expect(result).toEqual([800])
  })

  it('handles 100% as zero offset (sheet fully open)', () => {
    const result = snapPercentsToPixels([100], 800)
    expect(result).toEqual([0])
  })

  it('handles non-standard viewport heights', () => {
    // iPhone SE: 667px
    const result = snapPercentsToPixels([70, 100], 667)
    expect(result[0]).toBeCloseTo(200.1, 0)
    expect(result[1]).toEqual(0)
  })
})
```

**Test cases for `findNearestSnap`:**

```typescript
describe('findNearestSnap', () => {
  const snaps = [520, 280, 0] // 35%, 65%, 100% of 800px

  it('returns lowest snap when y is near bottom', () => {
    expect(findNearestSnap(500, snaps)).toBe(0) // nearest to 520
  })

  it('returns middle snap when y is in the middle', () => {
    expect(findNearestSnap(300, snaps)).toBe(1) // nearest to 280
  })

  it('returns highest snap when y is near top', () => {
    expect(findNearestSnap(50, snaps)).toBe(2) // nearest to 0
  })

  it('breaks ties in favor of first matching index', () => {
    // Equidistant between 520 and 280: midpoint is 400
    expect(findNearestSnap(400, snaps)).toBe(0) // 520 is checked first
  })

  it('handles single snap point', () => {
    expect(findNearestSnap(100, [600])).toBe(0)
  })
})
```

**Test cases for `resolveSnapTarget`:**

```typescript
describe('resolveSnapTarget', () => {
  const snaps = [520, 280, 0] // 35%, 65%, 100% of 800px
  const vh = 800

  it('dismisses on fast downward velocity', () => {
    const result = resolveSnapTarget(400, 600, snaps, true, vh)
    expect(result.dismiss).toBe(true)
  })

  it('does not dismiss when dismissible is false', () => {
    const result = resolveSnapTarget(400, 600, snaps, false, vh)
    expect(result.dismiss).toBe(false)
  })

  it('promotes to next snap on fast upward velocity', () => {
    // At y=520 (35% snap), fast upward -> should promote to 65% (y=280)
    const result = resolveSnapTarget(520, -600, snaps, true, vh)
    expect(result.dismiss).toBe(false)
    expect(result.snapIndex).toBe(1) // 280px = 65%
  })

  it('stays at highest snap on fast upward when already there', () => {
    const result = resolveSnapTarget(10, -600, snaps, true, vh)
    expect(result.dismiss).toBe(false)
    expect(result.snapIndex).toBe(2) // already at 100%
  })

  it('snaps to nearest on moderate velocity', () => {
    // At y=400, slow downward: projected = 400 + 100*0.2 = 420
    // Nearest to 420 is 520 (index 0)
    const result = resolveSnapTarget(400, 100, snaps, true, vh)
    expect(result.dismiss).toBe(false)
    expect(result.snapIndex).toBe(0)
  })

  it('snaps to nearest on moderate upward velocity', () => {
    // At y=400, moderate upward: projected = 400 + (-300)*0.2 = 340
    // Nearest to 340 is 280 (index 1)
    const result = resolveSnapTarget(400, -300, snaps, true, vh)
    expect(result.dismiss).toBe(false)
    expect(result.snapIndex).toBe(1)
  })

  it('dismisses when projected past lowest snap by threshold', () => {
    // At y=600, moderate downward: projected = 600 + 200*0.2 = 640
    // 640 > 520 + 120 (15% of 800) = 640 -> dismiss
    const result = resolveSnapTarget(600, 200, snaps, true, vh)
    expect(result.dismiss).toBe(true)
  })

  it('does not dismiss when projected is within threshold of lowest snap', () => {
    // At y=540, slow downward: projected = 540 + 50*0.2 = 550
    // 550 < 520 + 120 = 640 -> no dismiss, snap to index 0 (520)
    const result = resolveSnapTarget(540, 50, snaps, true, vh)
    expect(result.dismiss).toBe(false)
    expect(result.snapIndex).toBe(0)
  })
})
```

**Test cases for `findNextSnapAbove` and `findNextSnapBelow`:**

```typescript
describe('findNextSnapAbove', () => {
  const snaps = [520, 280, 0]

  it('finds next snap above current position', () => {
    expect(findNextSnapAbove(520, snaps)).toBe(1) // 280
  })

  it('returns null when at highest snap', () => {
    expect(findNextSnapAbove(5, snaps)).toBeNull()
  })

  it('skips snaps within minDistance', () => {
    expect(findNextSnapAbove(285, snaps, 10)).toBe(2) // 0, not 280
  })
})

describe('findNextSnapBelow', () => {
  const snaps = [520, 280, 0]

  it('finds next snap below current position', () => {
    expect(findNextSnapBelow(0, snaps)).toBe(0) // 520? No...
    // Actually snaps[0] = 520 which is > 0 + 10 = 10, so yes
    expect(findNextSnapBelow(100, snaps)).toBe(0) // 520
  })

  it('returns null when at lowest snap', () => {
    expect(findNextSnapBelow(530, snaps)).toBeNull()
  })
})
```

### D-9: Component Test (`src/components/mobile/__tests__/MobileBottomSheet.test.tsx`)

Integration-level test for the component rendering and lifecycle.

**Test cases:**

```typescript
describe('MobileBottomSheet', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <MobileBottomSheet
        isOpen={false}
        onDismiss={vi.fn()}
        config={SHEET_CONFIGS.alertDetail}
      >
        <div>Content</div>
      </MobileBottomSheet>
    )
    expect(container.querySelector('.mobile-bottom-sheet')).toBeNull()
  })

  it('renders sheet with backdrop when isOpen is true', () => {
    render(
      <MobileBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        config={SHEET_CONFIGS.alertDetail}
      >
        <div>Content</div>
      </MobileBottomSheet>
    )
    expect(document.querySelector('.mobile-bottom-sheet')).not.toBeNull()
    expect(document.querySelector('.mobile-bottom-sheet-backdrop')).not.toBeNull()
  })

  it('renders drag handle', () => {
    render(
      <MobileBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        config={SHEET_CONFIGS.categoryDetail}
      >
        <div>Content</div>
      </MobileBottomSheet>
    )
    expect(document.querySelector('.mobile-bottom-sheet-handle')).not.toBeNull()
  })

  it('renders children inside scroll container', () => {
    render(
      <MobileBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        config={SHEET_CONFIGS.alertDetail}
      >
        <div data-testid="sheet-child">Hello</div>
      </MobileBottomSheet>
    )
    const scroll = document.querySelector('.mobile-bottom-sheet-scroll')
    expect(scroll?.querySelector('[data-testid="sheet-child"]')).not.toBeNull()
  })

  it('calls onDismiss when backdrop is clicked', async () => {
    const onDismiss = vi.fn()
    render(
      <MobileBottomSheet
        isOpen={true}
        onDismiss={onDismiss}
        config={SHEET_CONFIGS.alertDetail}
      >
        <div>Content</div>
      </MobileBottomSheet>
    )
    const backdrop = document.querySelector('.mobile-bottom-sheet-backdrop')
    await userEvent.click(backdrop!)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('has role="dialog" on the sheet element', () => {
    render(
      <MobileBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        config={SHEET_CONFIGS.alertDetail}
      >
        <div>Content</div>
      </MobileBottomSheet>
    )
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })

  it('has overscroll-behavior-y: contain on scroll container', () => {
    render(
      <MobileBottomSheet
        isOpen={true}
        onDismiss={vi.fn()}
        config={SHEET_CONFIGS.alertDetail}
      >
        <div>Content</div>
      </MobileBottomSheet>
    )
    const scroll = document.querySelector('.mobile-bottom-sheet-scroll')
    const styles = window.getComputedStyle(scroll!)
    expect(styles.overscrollBehaviorY).toBe('contain')
  })
})
```

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `MobileBottomSheet` renders via portal to `document.body` at z-50 when `isOpen` is true. Does not render when `isOpen` is false. | Render component with `isOpen={false}`, verify no DOM node in body. Toggle to `true`, verify `.mobile-bottom-sheet` exists as a direct child of body. |
| AC-2 | Sheet enters from below viewport with spring animation (`stiffness: 400, damping: 35, mass: 0.8`) to the initial snap point defined by `config.initialSnapIndex`. | Open the sheet in Chrome DevTools responsive mode (375x812). Observe the sheet spring-animating upward. Record with DevTools performance panel: verify no jank (frames > 16ms). |
| AC-3 | Sheet exits by spring-animating downward past the viewport bottom, then unmounting. No abrupt visual pop. | Close the sheet (backdrop tap or drag dismiss). Verify smooth downward animation. Verify DOM node removed after animation completes. |
| AC-4 | Drag handle is visible, 40px wide, 2px tall, centered, with subtle 8px glow. Touch target zone is 24px tall. | Visual inspection. Inspect computed styles: handle width 40px, height 2px, handle zone height 24px. |
| AC-5 | Dragging the handle downward moves the sheet. Releasing snaps to the nearest snap point with spring animation. | Touch and drag the handle in the responsive emulator. Verify sheet follows finger. Release at various positions. Verify spring snap. |
| AC-6 | Fast downward drag (velocity > 500px/s) from any position dismisses the sheet (calls `onDismiss`). | Flick the handle downward quickly. Verify sheet animates out and `onDismiss` callback fires. |
| AC-7 | Fast upward drag (velocity > 500px/s) promotes the sheet to the next higher snap point. | From the initial snap, flick upward. Verify sheet snaps to the next defined snap point. |
| AC-8 | All five predefined configs produce correct snap behavior: Alert Detail (70%/100%), Category Detail (35%/65%/100%), Priority Feed (60%/100%), Filter/Time (40%), Settings (60%/100%). | Render the sheet with each `SHEET_CONFIGS.*` config. Verify the sheet opens at the correct initial snap and allows dragging between defined snap points. |
| AC-9 | Backdrop overlay is rendered behind the sheet at `rgba(0, 0, 0, 0.5)` when the sheet is open. Tapping the backdrop calls `onDismiss`. | Visual inspection: verify backdrop dims content. Click backdrop: verify `onDismiss` fires. |
| AC-10 | Glass background (`rgba(5, 9, 17, 0.92)` + `backdrop-blur(16px) saturate(130%)`) is visible on the sheet surface. | Inspect computed styles on `.mobile-bottom-sheet`. Verify `background`, `backdrop-filter`, `-webkit-backdrop-filter` match spec. |
| AC-11 | Border-radius `16px 16px 0 0` is applied to the sheet top corners. | Visual inspection and computed style check. |
| AC-12 | Box-shadow `0 -4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)` is applied. | Inspect computed `box-shadow` on `.mobile-bottom-sheet`. |
| AC-13 | Top border `1px solid rgba(255, 255, 255, 0.08)` is applied. | Inspect computed `border-top`. |
| AC-14 | **Scroll conflict -- scroll priority:** When the sheet content is scrolled (scrollTop > 0) and the user drags downward on the content area, the content scrolls normally. The sheet does not move. | Open sheet with long scrollable content. Scroll down into the content. Drag downward on the content. Verify: scroll continues, sheet stays at current snap. |
| AC-15 | **Scroll conflict -- drag handoff:** When the sheet content is at scrollTop = 0 and the user drags downward on the content area, the sheet drags downward instead of rubber-banding the scroll. | Open sheet. Ensure content is at scrollTop = 0. Drag downward on the content area. Verify: sheet moves down, content does not rubber-band. |
| AC-16 | **Scroll conflict -- upward scroll:** When the sheet content is at scrollTop = 0 and the user drags upward on the content area, the content scrolls upward (if it overflows). The sheet does not move upward to a higher snap from the content area gesture. | Open sheet at a lower snap point with long content. Content at scrollTop = 0. Drag upward on content. Verify: content scrolls up, sheet stays at current snap. |
| AC-17 | **Scroll conflict -- handle override:** Dragging the handle always moves the sheet, regardless of scroll position. | Scroll the content so scrollTop > 0. Drag the handle downward. Verify: sheet moves, not the content scroll. |
| AC-18 | `overscroll-behavior-y: contain` is set on `.mobile-bottom-sheet-scroll`. | Inspect computed styles. |
| AC-19 | `pnpm typecheck` passes with zero errors after all changes. | Run `pnpm typecheck` from project root. |
| AC-20 | `pnpm lint` passes with zero errors. | Run `pnpm lint` from project root. |
| AC-21 | All unit tests in `bottom-sheet-utils.test.ts` pass. | Run `pnpm test:unit` (or `vitest run`). |
| AC-22 | All component tests in `MobileBottomSheet.test.ts` pass. | Run `pnpm test:unit`. |
| AC-23 | Desktop view is completely unaffected. Loading at viewport >= 768px renders the existing desktop ZUI with no visual or behavioral changes. | Manual comparison at 1440x900 before and after. No bottom sheet CSS leaks into desktop. |
| AC-24 | Reduced motion: when `prefers-reduced-motion: reduce` is active, sheet snap animations are near-instant (no spring wobble). Drag mechanics still function. | Enable reduced motion in OS settings. Open/close sheet. Verify: sheet appears/disappears without animation delay. Drag still works. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | Custom `motion/react` implementation, no external bottom sheet library (AD-2). | `motion/react` v12 is already a dependency. External libraries (vaul, react-spring-bottom-sheet, react-modal-sheet) add bundle size (15-30KB), may conflict with existing motion/react animations, and do not support the per-context snap point system or Oblivion glass aesthetic. The custom implementation is estimated at ~400 lines total (component + hook + utils), well within the acceptable complexity budget for the project's most critical UI primitive. | (a) `vaul` by Emil Kowalski: well-regarded, but uses its own animation system that conflicts with motion/react spring config. (b) `react-spring-bottom-sheet`: uses react-spring, not motion/react. (c) `react-modal-sheet`: closest match but lacks per-context snap points and scroll conflict resolution. |
| DM-2 | Portal to `document.body` rather than a React context provider portal target. | Simplicity. Portaling to body ensures the sheet escapes all parent `overflow: hidden`, `transform`, and `z-index` stacking contexts. A named portal target in MobileShell was considered (WS-A.2 "Out of Scope" notes this), but `document.body` is simpler and sufficient since there is never more than one sheet open at a time. | Portal target div in MobileShell. Rejected: adds dependency between WS-A.2 and WS-C.1 and is unnecessary for a single-sheet-at-a-time model. |
| DM-3 | Split-control drag architecture: `dragListener={false}` on the `motion.div`, with `useDragControls` initiated from the handle zone and touch event handlers on the content area. | This is the cleanest way to resolve the scroll-vs-drag conflict. The handle always drags. The content area conditionally drags based on scroll position. The alternative (a single `drag="y"` with scroll detection inside `onDrag`) fights the browser's scroll event system and causes visual jank on iOS Safari. | (a) Single `drag="y"` with `onDrag` scroll check: rejected because preventing default on `touchmove` after scroll has started causes jank. (b) Two separate `motion.div` wrappers (handle + body): rejected because drag state must be unified across both. (c) CSS `touch-action: none` on the entire sheet: rejected because it disables all scrolling inside the sheet. |
| DM-4 | Velocity-biased nearest snap (200ms projection) rather than pure nearest-snap or pure velocity-threshold. | Pure nearest-snap feels sluggish when the user flicks quickly -- the sheet snaps back to the nearest point instead of carrying momentum. Pure velocity-threshold ignores position, causing jumps when the user drags slowly past a snap boundary. The 200ms projection balances both: it accounts for the user's intended direction while respecting proximity to snap points. The 200ms constant matches the perceived "follow-through" of a natural flick gesture. | (a) Pure nearest snap: rejected, sluggish on flicks. (b) Pure velocity thresholds: rejected, ignores positional context. (c) Spring physics simulation (let the spring settle naturally): rejected, unpredictable snap targets when spring overshoots between two snap points. |
| DM-5 | Snap points stored as viewport height percentages, converted to pixels at runtime. | Viewport height changes (address bar collapse on mobile browsers, orientation change). Storing percentages and recalculating on resize ensures snap points remain correct. Storing pixels would require recalculation logic anyway. The percentage model also matches the token definitions in WS-A.3 (`--sheet-snap-alert-detail: 70%, 100%`). | Store snap points as pixels: rejected, requires resize handling with same complexity but loses the natural percentage-based mental model. |
| DM-6 | Backdrop overlay opacity is animated proportionally to sheet position, not a binary on/off. | A binary backdrop (0% when closed, 50% when open) creates a jarring visual transition. Proportional animation (opacity tracks sheet position from closed to lowest snap) creates a smooth, cinematic reveal. The backdrop reaches full opacity (0.5) at the lowest snap point and stays there for higher snaps. | Binary backdrop: rejected, jarring. No backdrop: rejected, the sheet needs visual separation from content behind it. |
| DM-7 | Scroll conflict detection uses `touchstart`/`touchmove`/`touchend` native events on the content area, not `motion/react` drag events. | The motion/react drag system operates on the sheet-level `motion.div` and cannot distinguish between gestures intended for the sheet vs gestures intended for internal scroll. Native touch events on the content container give direct access to `scrollTop` at the moment of gesture initiation, enabling the conflict resolution algorithm described in D-3. | (a) `onDrag` with `scrollTop` check: rejected, `onDrag` fires after the browser has already committed to a scroll or drag action, making it too late to redirect. (b) Intersection Observer on scroll sentinel: rejected, too coarse (binary in/out of view) for the continuous scroll position check needed. |
| DM-8 | The `dismiss threshold` for velocity-biased snap is 15% of viewport height past the lowest snap point. | This prevents accidental dismissal from a moderate drag that overshoots the lowest snap. The user must either flick fast (velocity > 500px/s) or drag deliberately past the 15% threshold for the sheet to dismiss. This threshold was chosen to feel forgiving on small phones (15% of 667px = 100px, about the width of a thumb) while still being reachable on larger devices. | 10% threshold: too easy to dismiss accidentally. 20% threshold: requires too much deliberate drag, feels sticky. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the backdrop overlay prevent scroll on the content behind the sheet (body scroll lock)? On desktop modals, `overflow: hidden` on `<body>` is standard. On mobile, body scroll lock can cause iOS Safari issues. Current implementation: no body scroll lock; the sheet portals to body and the backdrop captures taps but does not lock scroll. If this causes "scroll bleed" behind the sheet, body scroll lock should be added. | WS-C.2 author | Phase C |
| OQ-2 | Should the drag handle have a haptic feedback pulse on touch (via `navigator.vibrate(10)`) to signal draggability? This would reinforce the handle as an interactive affordance on Android (iOS Safari does not support `navigator.vibrate`). | world-class-ux-designer | Phase F (polish) |
| OQ-3 | The touch coordinator in D-3 uses a `'locked-scroll'` state to prevent momentum-scroll-to-drag handoff. In practice, how reliable is the `scrollTop === 0` check during rapid momentum scroll on iOS Safari? If `scrollTop` reports intermediate values during momentum deceleration, the algorithm may misfire. Needs device testing. | WS-C.1 implementer | Phase C (implementation testing) |
| OQ-4 | Should `onSnapChange` fire during drag (as the user passes each snap point) or only on settle (after spring animation completes)? Current spec: only on settle. | WS-D.1 author (consumer) | Phase D |
| OQ-5 | The `AnimatePresence` exit animation relies on the sheet being a direct child of `AnimatePresence`. Portaling to `document.body` may interfere with `AnimatePresence` detection. Does `motion/react` v12 support exit animations on portaled children? If not, the exit animation must be handled manually via `animate()` before removing the portal. | WS-C.1 implementer | Phase C (implementation) |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | iOS Safari rubber-band scroll on the sheet content area propagates to the viewport, causing the sheet AND the page behind it to bounce simultaneously. | Medium | High | `overscroll-behavior-y: contain` on `.mobile-bottom-sheet-scroll` prevents propagation. This is AC-18. Additionally, the backdrop overlay is `position: fixed` which establishes a separate scroll context. Test on a physical iPhone (not just Chrome DevTools emulator, which does not reproduce rubber-band). |
| R-2 | `useDragControls.start(event)` does not work with `PointerEvent` from the handle zone on iOS Safari. Some versions of Safari dispatch `TouchEvent` instead of `PointerEvent` for touch interactions. | Medium | High | Add a fallback: if `PointerEvent` is not supported, fall back to `onTouchStart` on the handle zone and manually set the drag initial position. Test on iOS Safari 16+ (iPhone 14/15). |
| R-3 | `backdrop-filter: blur(16px)` on the sheet causes dropped frames during drag animation on mid-range Android (Snapdragon 6xx/7xx). | Medium | Medium | During active drag (between `onDragStart` and `onDragEnd`), temporarily disable `backdrop-filter` by adding a CSS class `.is-dragging` that sets `backdrop-filter: none`. Re-enable after snap animation settles. The user is focused on the drag motion during this time and will not notice the blur absence. Alternatively, WS-A.3 provides `--glass-sheet-blur` which can be reduced further for mobile. |
| R-4 | `AnimatePresence` does not detect exit of portaled children, causing the sheet to unmount immediately without exit animation (OQ-5). | Medium | Medium | If `AnimatePresence` + portal does not work: (a) Wrap the portal content in a `motion.div` with `initial`, `animate`, `exit` and handle the `isOpen` -> `false` transition by animating to `y: viewportHeight` first, then setting a `shouldRender` state to `false` after animation completes (using `onAnimationComplete`). This is a common pattern documented in the motion/react migration guide. (b) Do not use `AnimatePresence` at all; manage the mount/unmount lifecycle manually. |
| R-5 | The 200ms velocity projection in `resolveSnapTarget` feels wrong for some gesture speeds -- too aggressive or too conservative. | Low | Medium | The 200ms constant is tunable. Expose it as a constant in `SHEET_VELOCITY_THRESHOLDS` so it can be adjusted during implementation testing. If 200ms does not feel right, values in the 150-300ms range should be tried. The unit tests verify the algorithm's correctness at any projection value. |
| R-6 | Scroll conflict algorithm (D-3) has edge cases on older Android WebView where `scrollTop` updates are delayed relative to touch events. | Low | Medium | The `'locked-scroll'` state in the touch coordinator prevents mid-gesture handoff, which is the most dangerous edge case. If `scrollTop` reads stale, the worst outcome is one gesture cycle where the sheet briefly twitches before snapping back. Not a blocking issue. |
| R-7 | WS-A.3 token delivery is delayed, so CSS custom properties (`--glass-sheet-bg`, etc.) are undefined at development time. | Medium | Low | All CSS custom properties in `mobile-bottom-sheet.css` use `var(--token, fallback)` with hardcoded fallback values. Development can proceed without WS-A.3 tokens. When tokens land, the fallbacks become inactive. |
| R-8 | Multiple sheets open simultaneously (e.g., alert detail on top of category detail -- a nested sheet scenario described in interface-architecture 5.8). This WS does not support sheet stacking. | Low | Medium | Sheet stacking is out of scope for WS-C.1. WS-C.2 or WS-D.1 may implement content-level transitions within a single sheet (using `AnimatePresence mode="wait"` to swap content) rather than opening a second sheet. If stacking becomes necessary, it would be a new workstream. |

---

## Appendix A: File Inventory

| File | Action | Description |
|------|--------|-------------|
| `src/lib/interfaces/mobile.ts` | Modify | Append `BottomSheetConfig`, `SHEET_CONFIGS`, `SHEET_SPRING_CONFIG`, `SHEET_VELOCITY_THRESHOLDS` |
| `src/lib/bottom-sheet-utils.ts` | Create | Pure functions: `snapPercentsToPixels`, `findNearestSnap`, `findNextSnapAbove`, `findNextSnapBelow`, `resolveSnapTarget` |
| `src/hooks/use-bottom-sheet-drag.ts` | Create | Hook: drag state, scroll conflict gating, snap animation, backdrop opacity |
| `src/components/mobile/MobileBottomSheet.tsx` | Create | Component: portal, backdrop, sheet surface, handle, scroll container |
| `src/styles/mobile-bottom-sheet.css` | Create | CSS: glass surface, handle, scroll container, backdrop, reduced motion |
| `src/lib/__tests__/bottom-sheet-utils.test.ts` | Create | Unit tests for snap math and velocity logic |
| `src/components/mobile/__tests__/MobileBottomSheet.test.tsx` | Create | Component render and lifecycle tests |

## Appendix B: Motion/React API Usage Reference

This workstream uses the following `motion/react` v12 APIs. Documented here to ensure the implementer uses the correct import paths and signatures.

| API | Import | Usage |
|-----|--------|-------|
| `motion.div` | `import { motion } from 'motion/react'` | Sheet surface and backdrop elements |
| `useMotionValue` | `import { useMotionValue } from 'motion/react'` | `sheetY` position tracking |
| `useTransform` | `import { useTransform } from 'motion/react'` | Backdrop opacity derived from `sheetY` |
| `useDragControls` | `import { useDragControls } from 'motion/react'` | Programmatic drag initiation from handle |
| `animate` | `import { animate } from 'motion/react'` | Imperative spring animation to snap positions |
| `AnimatePresence` | `import { AnimatePresence } from 'motion/react'` | Mount/unmount animation lifecycle |
| `PanInfo` | `import type { PanInfo } from 'motion/react'` | Type for `onDragEnd` info parameter |

**Critical:** Import from `motion/react`, never `framer-motion`. Per CLAUDE.md convention.

## Appendix C: Snap Point Visualization

Visual reference for how snap percentages map to screen positions on a 812px viewport (iPhone 14):

```
Viewport Top (0px)
  |
  |  [100% snap = 0px from top] -------- Sheet covers full screen
  |
  |  [70% snap = 244px from top] ------- Alert Detail initial
  |  [65% snap = 284px from top] ------- Category Detail mid
  |  [60% snap = 325px from top] ------- Priority Feed / Settings initial
  |
  |  [40% snap = 487px from top] ------- Filter/Time Range
  |  [35% snap = 528px from top] ------- Category Detail peek
  |
  |
Viewport Bottom (812px)
  |  [0% = closed/dismissed]
```

Each snap position is where the TOP edge of the sheet sits. Content visible below that edge extends to the bottom of the viewport.
