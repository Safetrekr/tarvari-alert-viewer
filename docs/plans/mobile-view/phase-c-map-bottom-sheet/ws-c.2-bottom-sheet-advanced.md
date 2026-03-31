# WS-C.2: Bottom Sheet Advanced

> **Workstream ID:** WS-C.2
> **Phase:** C -- Map + Bottom Sheet
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-C.1 (provides `MobileBottomSheet` base component with drag/snap system, sheet state type, `useSheetDrag` hook, `mobile-sheet.css`, sheet spring config, and the `SheetContext` or equivalent API), WS-A.3 (provides `--sheet-landscape-max-height`, `--glass-sheet-*` tokens, `--duration-sheet-expand`, `--duration-sheet-dismiss`), WS-A.2 (provides `isLandscape` from MobileShell orientation detection)
> **Blocks:** WS-D.1 (Category Detail uses fullscreen mode, popstate dismissal, focus trap), WS-D.2 (Alert Detail uses fullscreen expand button, popstate dismissal, focus trap), WS-D.3 (Morph + Navigation depends on popstate integration to coordinate morph reverse with back button)

---

## 1. Objective

Extend the `MobileBottomSheet` component delivered by WS-C.1 with three advanced interaction capabilities: expand-to-fullscreen mode with a dedicated button and collapse transition (per client Q7), browser history integration via `history.pushState`/`popstate` so the system back button dismisses sheets instead of navigating away (per `information-architecture.md` Section 9.3), and WCAG-compliant focus management with a focus trap, `aria-modal`, and focus-return-on-dismiss (per OVERVIEW Section 8.2 items A5, A11, A12).

Additionally, enforce a landscape orientation height constraint capping non-fullscreen sheet heights at 60% of the viewport (per client Q2).

These four capabilities are extracted into composable hooks (`useSheetHistory`, `useSheetFocusTrap`) and component-level enhancements so that every sheet context (alert detail, category detail, priority feed, filter, settings) gains them without per-context implementation work.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **Expand-to-fullscreen mode** | Button in sheet header triggers a spring-animated transition from current snap height to 100dvh. Header transforms: drag handle hides, collapse button appears. Collapse button returns to previous snap point. Per client Q7. |
| **`useSheetHistory` hook** | Manages `history.pushState` on sheet open, `popstate` listener for back-button dismissal, nested sheet history stack, and cleanup on unmount. |
| **`useSheetFocusTrap` hook** | Traps keyboard focus inside the open sheet. Cycles Tab/Shift+Tab through focusable elements. Handles Escape key dismissal. Moves focus to first interactive element on open. Returns focus to triggering element on close. No external library. |
| **ARIA modal attributes** | Adds `role="dialog"`, `aria-modal="true"`, `aria-label` (context-dependent) to the sheet container. Adds `aria-hidden="true"` to sibling content when sheet is open (inert background). |
| **Landscape height constraint** | Non-fullscreen sheets capped at `var(--sheet-landscape-max-height)` (60%) in landscape orientation. Fullscreen mode is exempt (always 100dvh). |
| **Backdrop click-to-dismiss** | Tapping the translucent backdrop behind the sheet dismisses it. Backdrop uses `aria-hidden="true"` and is excluded from the focus trap. |
| **Screen reader announcements** | `aria-live="polite"` region announces sheet open/close state changes. |
| **Reduced motion support** | Expand/collapse transitions use `duration: 0` when `prefers-reduced-motion: reduce` is active. |
| **CSS additions** | New classes for fullscreen state, landscape constraint, focus-visible indicators, and expand/collapse button styling in `mobile-sheet.css` (or the CSS file established by WS-C.1). |
| **Unit tests** | Tests for `useSheetHistory`, `useSheetFocusTrap`, expand/collapse behavior, landscape constraint, and ARIA attribute presence. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Base `MobileBottomSheet` component (drag, snap, spring physics, glass background) | WS-C.1 scope. This WS extends it. |
| Per-context sheet content (alert detail, category detail, etc.) | WS-D.1, WS-D.2, WS-E.1 scope. This WS provides the container capabilities. |
| Sheet category tint gradient | WS-C.1 or WS-D.1 scope. |
| Nested sheet rendering (sheet-within-sheet stacking) | WS-D.2 scope (alert detail within category detail). This WS provides the history stack that supports nesting. |
| Haptic feedback on snap/expand | WS-F.4 scope (Protective Ops Hooks). |
| Pull-to-refresh interaction within sheet scroll | WS-F.5 scope. |
| Desktop rendering changes | All additions are mobile-only. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-C.1 `MobileBottomSheet` | Base component with: `isOpen` state, `snapPoints` prop, `onDismiss` callback, `currentSnap` state, drag gesture handling, spring animation, glass background, drag handle, `SheetState` type (`'collapsed' \| 'half' \| 'full'`). Must expose an imperative API or prop-based control for programmatic snap changes. | Pending (WS-C.1) |
| WS-C.1 `mobile-sheet.css` | Base CSS file for sheet styling. This WS appends to it. | Pending (WS-C.1) |
| WS-C.1 spring config | `SHEET_SPRING` constant (`{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }`). Reused for expand/collapse animation. | Pending (WS-C.1) |
| WS-A.3 `--sheet-landscape-max-height` | Token value: `60%`. | Pending (WS-A.3) |
| WS-A.3 `--duration-sheet-expand` | Token value: `300ms`. | Pending (WS-A.3) |
| WS-A.3 `--duration-sheet-dismiss` | Token value: `250ms`. | Pending (WS-A.3) |
| WS-A.3 `--glass-sheet-*` tokens | `--glass-sheet-bg`, `--glass-sheet-blur`, `--glass-sheet-border`, `--glass-sheet-shadow`, `--glass-sheet-radius`. | Pending (WS-A.3) |
| WS-A.2 `isLandscape` | Boolean from MobileShell's `matchMedia('(orientation: landscape)')` listener. Passed as a prop to `MobileBottomSheet` or consumed from a shared context. | Pending (WS-A.2) |
| `src/stores/ui.store.ts` | `resetMorph()` action for coordinated dismissal when back button fires during morph. | Exists (line 145-149) |
| `motion/react` | `animate`, `motion.div`, `useMotionValue`, `useTransform`, `AnimatePresence`. Spring animation API. | Available (existing dependency) |
| `lucide-react` | `Maximize2` (expand icon), `Minimize2` (collapse icon), `X` (close icon). | Available (existing dependency) |
| `@tarva/ui/motion` | `useReducedMotion` hook for `prefers-reduced-motion` detection. | Available (existing dependency) |

---

## 4. Deliverables

### D-1: `useSheetHistory` hook (`src/hooks/use-sheet-history.ts`)

Custom hook that integrates bottom sheet open/close lifecycle with the browser history stack, enabling the system back button (and back swipe gesture) to dismiss sheets instead of navigating away from the page.

**Interface:**

```typescript
/**
 * Browser history integration for bottom sheet lifecycle.
 *
 * Pushes a history entry when a sheet opens. Listens for popstate
 * to dismiss the sheet when the user taps the system back button.
 * Supports nested sheets (each open pushes a separate entry).
 *
 * @module use-sheet-history
 * @see information-architecture.md Section 9.3
 * @see OVERVIEW Section 5.5
 */

interface UseSheetHistoryOptions {
  /** Unique identifier for this sheet instance (e.g., 'alert-detail', 'category-detail'). */
  sheetId: string
  /** Whether the sheet is currently open. */
  isOpen: boolean
  /** Callback invoked when the back button should dismiss this sheet. */
  onDismiss: () => void
}

interface UseSheetHistoryReturn {
  /**
   * Call this when the sheet opens programmatically (not via back button).
   * Pushes a history state entry. Must be called exactly once per open cycle.
   */
  pushSheetState: () => void
  /**
   * Call this when the sheet is dismissed programmatically (not via back button).
   * Navigates back to remove the stale history entry.
   */
  removeSheetState: () => void
}
```

**Behavior specification:**

1. **On sheet open (`pushSheetState()` called by the parent):**
   - Calls `history.pushState({ sheetId, timestamp: Date.now() }, '', location.href)`.
   - The URL does not change. The state object contains the `sheetId` for identification and a `timestamp` for deduplication.
   - Sets an internal `hasPushedState` ref to `true`.

2. **On `popstate` event (user taps back button):**
   - The `popstate` listener inspects `event.state`.
   - If `event.state` is `null` or does not contain a `sheetId` matching any currently-open sheet, it means the user navigated back past all sheet entries. The hook calls `onDismiss()`.
   - If `event.state.sheetId` matches a _different_ sheet (nested case), the hook does nothing -- the other sheet's hook handles its own dismissal.
   - Sets `hasPushedState` to `false` after dismissal.

3. **On programmatic dismiss (`removeSheetState()` called by the parent):**
   - If `hasPushedState` is `true`, calls `history.back()` to remove the stale history entry. This triggers a `popstate` event, but the hook guards against re-entrant dismissal by checking `hasPushedState`.
   - Sets `hasPushedState` to `false`.

4. **Nested sheet handling (category detail -> alert detail):**
   - Each sheet instance has its own `useSheetHistory` with a unique `sheetId`.
   - Opening the category detail sheet pushes `{ sheetId: 'category-detail', ... }`.
   - Opening a nested alert detail pushes `{ sheetId: 'alert-detail', ... }` on top.
   - Back button pops the alert detail first (because it was pushed last). The alert detail's `popstate` handler fires `onDismiss`, closing it.
   - A second back press pops the category detail entry.
   - The browser history stack after both opens looks like: `[...existing, { sheetId: 'category-detail' }, { sheetId: 'alert-detail' }]`.

5. **Cleanup on unmount:**
   - The `useEffect` cleanup removes the `popstate` event listener.
   - If `hasPushedState` is still `true` when the component unmounts (e.g., tab switch kills the sheet without going through the dismiss flow), calls `history.back()` to clean the stale entry. This prevents a "ghost" history entry that would cause the back button to appear to do nothing.

6. **Guard against rapid open/close:**
   - The hook debounces `pushState` calls using the `hasPushedState` flag. A second call to `pushSheetState()` while `hasPushedState` is `true` is a no-op (prevents double-push from React Strict Mode double-effects or rapid re-renders).

7. **SSR safety:**
   - All `history` and `window` access is guarded with `typeof window !== 'undefined'` checks.

**Implementation (~75 lines):**

```typescript
import { useCallback, useEffect, useRef } from 'react'

interface SheetHistoryState {
  sheetId: string
  timestamp: number
}

function isSheetHistoryState(state: unknown): state is SheetHistoryState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'sheetId' in state &&
    typeof (state as SheetHistoryState).sheetId === 'string'
  )
}

export function useSheetHistory({
  sheetId,
  isOpen,
  onDismiss,
}: UseSheetHistoryOptions): UseSheetHistoryReturn {
  const hasPushedState = useRef(false)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  // popstate listener
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = (event: PopStateEvent) => {
      if (!hasPushedState.current) return

      // The user navigated back. The current state no longer has our sheetId.
      // Check if the NEW state (after pop) still contains our sheet.
      const newState = event.state
      if (isSheetHistoryState(newState) && newState.sheetId === sheetId) {
        // This popstate landed ON our entry, not past it. This happens when
        // a nested sheet above us was popped. Do nothing.
        return
      }

      // We've been popped off the stack. Dismiss.
      hasPushedState.current = false
      onDismissRef.current()
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      // Cleanup: remove stale history entry if still pushed on unmount
      if (hasPushedState.current) {
        hasPushedState.current = false
        history.back()
      }
    }
  }, [sheetId])

  const pushSheetState = useCallback(() => {
    if (typeof window === 'undefined') return
    if (hasPushedState.current) return // guard: already pushed
    const state: SheetHistoryState = { sheetId, timestamp: Date.now() }
    history.pushState(state, '', location.href)
    hasPushedState.current = true
  }, [sheetId])

  const removeSheetState = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!hasPushedState.current) return // guard: nothing to remove
    hasPushedState.current = false
    history.back()
  }, [])

  return { pushSheetState, removeSheetState }
}
```

### D-2: `useSheetFocusTrap` hook (`src/hooks/use-sheet-focus-trap.ts`)

Custom hook that traps keyboard focus inside an open bottom sheet, with no external library dependency. Implements WCAG 2.4.3 (Focus Order) and WCAG 2.1.2 (No Keyboard Trap -- Escape key provides exit).

**Interface:**

```typescript
/**
 * Keyboard focus trap for bottom sheet dialogs.
 *
 * Traps Tab/Shift+Tab focus cycling within the sheet.
 * Handles Escape key dismissal. Manages focus-on-open
 * and focus-return-on-close.
 *
 * @module use-sheet-focus-trap
 * @see OVERVIEW Section 8.2 items A5, A11, A12
 */

interface UseSheetFocusTrapOptions {
  /** Ref to the sheet container element. */
  sheetRef: React.RefObject<HTMLDivElement | null>
  /** Whether the sheet is currently open and should trap focus. */
  isOpen: boolean
  /** Callback invoked when the user presses Escape. */
  onEscape: () => void
  /**
   * Optional ref to the element that triggered the sheet open.
   * Focus returns here on close. If not provided, focus returns
   * to `document.activeElement` captured at open time.
   */
  triggerRef?: React.RefObject<HTMLElement | null>
}
```

**Behavior specification:**

1. **On sheet open (`isOpen` transitions from `false` to `true`):**
   - Captures `document.activeElement` as the return-focus target (unless `triggerRef` is provided).
   - After a `requestAnimationFrame` delay (to allow the sheet's enter animation to render DOM), queries all focusable elements inside the sheet container using the selector:
     ```
     a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),
     textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable]
     ```
   - Moves focus to the first focusable element found. If the sheet has a close/collapse button, that element receives initial focus (per convention for modal dialogs).
   - Adds `aria-hidden="true"` to all direct children of `document.body` that are NOT the sheet container (or its portal ancestor). This makes the background inert for assistive technology.

2. **Tab key cycling:**
   - A `keydown` listener on the sheet container intercepts `Tab` and `Shift+Tab`.
   - On `Tab` when focus is on the **last** focusable element: `event.preventDefault()`, move focus to the **first** focusable element.
   - On `Shift+Tab` when focus is on the **first** focusable element: `event.preventDefault()`, move focus to the **last** focusable element.
   - The focusable element list is re-queried on each Tab press to account for dynamically added/removed elements (e.g., expandable sections within the sheet).

3. **Escape key handling:**
   - On `Escape` keydown, calls `onEscape()` callback.
   - The parent component's `onEscape` handler should trigger the standard dismiss flow (which calls `removeSheetState()` from `useSheetHistory` and triggers the close animation).

4. **On sheet close (`isOpen` transitions from `true` to `false`):**
   - Removes `aria-hidden="true"` from all sibling elements that were hidden.
   - Returns focus to the stored trigger element (or the captured `activeElement`).
   - Focus return uses `requestAnimationFrame` to fire after the close animation completes.

5. **Cleanup on unmount:**
   - Removes the `keydown` listener.
   - Restores `aria-hidden` on all siblings.
   - Returns focus if it was not already returned.

6. **Edge cases:**
   - If the sheet contains zero focusable elements: focus the sheet container itself (which has `tabIndex={-1}` set by the component).
   - If the trigger element has been removed from the DOM by the time the sheet closes: do not attempt to focus it (guard with `document.contains()`).
   - If another sheet opens on top (nested case): the outer sheet's trap deactivates (it is covered by `aria-hidden` from the inner sheet's trap). When the inner sheet closes, focus returns to the outer sheet's content.

**Implementation (~95 lines):**

```typescript
import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(', ')

export function useSheetFocusTrap({
  sheetRef,
  isOpen,
  onEscape,
  triggerRef,
}: UseSheetFocusTrapOptions): void {
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const hiddenSiblingsRef = useRef<Element[]>([])
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return

    const sheetEl = sheetRef.current
    if (!sheetEl) return

    // 1. Capture previous focus
    previousFocusRef.current =
      triggerRef?.current ?? (document.activeElement as HTMLElement | null)

    // 2. Hide siblings for assistive technology
    const siblings = Array.from(document.body.children).filter(
      (child) => child !== sheetEl && !sheetEl.contains(child as Node)
          && child !== sheetEl.closest('[data-sheet-portal]')
    )
    siblings.forEach((el) => {
      if (!el.hasAttribute('aria-hidden')) {
        el.setAttribute('aria-hidden', 'true')
        hiddenSiblingsRef.current.push(el)
      }
    })

    // 3. Focus first element after animation frame
    requestAnimationFrame(() => {
      const focusables = sheetEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length > 0) {
        focusables[0].focus()
      } else {
        sheetEl.focus()
      }
    })

    // 4. Keydown handler
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscapeRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const focusables = sheetEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    sheetEl.addEventListener('keydown', handleKeyDown)

    return () => {
      sheetEl.removeEventListener('keydown', handleKeyDown)

      // Restore aria-hidden
      hiddenSiblingsRef.current.forEach((el) => {
        el.removeAttribute('aria-hidden')
      })
      hiddenSiblingsRef.current = []

      // Return focus
      const target = previousFocusRef.current
      requestAnimationFrame(() => {
        if (target && document.contains(target)) {
          target.focus()
        }
      })
    }
  }, [isOpen, sheetRef, triggerRef])
}
```

### D-3: Expand-to-fullscreen mode (modifications to `MobileBottomSheet`)

Extend the `MobileBottomSheet` component from WS-C.1 with a fourth sheet state: `'fullscreen'`. This adds an expand button in the sheet header and a collapse button in fullscreen mode.

**Sheet state extension:**

WS-C.1 defines `SheetState = 'collapsed' | 'half' | 'full'`. This WS extends it:

```typescript
/** Extended sheet state including fullscreen mode (client Q7). */
export type SheetState = 'collapsed' | 'half' | 'full' | 'fullscreen'
```

**New props added to `MobileBottomSheet`:**

```typescript
interface MobileBottomSheetAdvancedProps {
  /**
   * Whether to show the expand-to-fullscreen button in the sheet header.
   * Default: true. Set to false for lightweight sheets (filter, time range)
   * that should not offer fullscreen mode.
   */
  allowFullscreen?: boolean

  /**
   * Accessible label for the sheet dialog (e.g., "Alert detail", "Category detail").
   * Used as the `aria-label` on the `role="dialog"` container.
   */
  ariaLabel: string

  /**
   * Ref to the element that triggered the sheet open.
   * Focus returns here on close. Passed through to `useSheetFocusTrap`.
   */
  triggerRef?: React.RefObject<HTMLElement | null>

  /**
   * Unique identifier for this sheet instance.
   * Used by `useSheetHistory` for history state management.
   * Must be unique across simultaneously-open sheets.
   */
  sheetId: string

  /**
   * Whether the device is in landscape orientation.
   * When true, non-fullscreen snap points are capped at 60% viewport height.
   * Typically passed from MobileShell's isLandscape state.
   */
  isLandscape?: boolean
}
```

These props are added to whatever base props interface WS-C.1 defines. The `ariaLabel` and `sheetId` props are **required** for all sheet instances.

**Expand button behavior:**

1. The expand button renders in the sheet header, to the right of the title area and to the left of the close button. Uses `Maximize2` icon from Lucide at 16px. Touch target: 44x44px minimum.
2. When tapped:
   - Sheet state transitions from the current snap (`'half'` or `'full'`) to `'fullscreen'`.
   - The sheet height animates to `100dvh` using the `SHEET_SPRING` config from WS-C.1.
   - The drag handle area (24px) collapses to 0px with `overflow: hidden` and `opacity: 0` over 200ms.
   - The expand button transforms into a collapse button (`Minimize2` icon from Lucide).
   - `aria-label` on the button updates from "Expand to full screen" to "Collapse to sheet".
3. Visual treatment: ghost button (no background, no border). Icon at `rgba(255, 255, 255, 0.4)`. Hover/press state: `rgba(255, 255, 255, 0.6)`.

**Collapse button behavior:**

1. When the sheet is in `'fullscreen'` state, the collapse button appears where the expand button was.
2. When tapped:
   - Sheet state transitions from `'fullscreen'` to `'full'` (the highest non-fullscreen snap point).
   - The sheet height animates back to the `'full'` snap percentage using `SHEET_SPRING`.
   - The drag handle area re-appears (24px height, opacity fades in over 200ms).
   - The collapse button transforms back into the expand button.
3. If the sheet only has a single snap point (e.g., filter sheet at 40%), collapse returns to that snap point.

**Expand/collapse animation specification:**

```typescript
/**
 * Spring config for expand/collapse.
 * Same as SHEET_SPRING but with slightly higher stiffness
 * for a more decisive feel on the larger motion.
 */
const EXPAND_SPRING = {
  type: 'spring' as const,
  stiffness: 450,
  damping: 38,
  mass: 0.8,
}
```

The animation is driven by `motion/react`'s `animate` function targeting the sheet's `height` (or `y` transform, depending on WS-C.1's implementation). The target values:

| Transition | From | To | Spring | Drag Handle |
|------------|------|----|--------|-------------|
| Expand | Current snap height (px) | `window.innerHeight` (100dvh) | `EXPAND_SPRING` | Collapse to 0px, opacity 0 |
| Collapse | `window.innerHeight` | `'full'` snap height (px) | `EXPAND_SPRING` | Expand to 24px, opacity 1 |

**Drag handle collapse animation:**

```typescript
// Drag handle area: animated independently
const handleAnimation = {
  height: isFullscreen ? 0 : 24,
  opacity: isFullscreen ? 0 : 1,
  transition: {
    duration: reducedMotion ? 0 : 0.2,
    ease: [0.22, 1, 0.36, 1],
  },
}
```

**Fullscreen drag behavior:**

In `'fullscreen'` state, drag gestures on the drag handle area are disabled (the handle is collapsed). The user must use the collapse button or the back gesture to exit fullscreen. This prevents accidental drag-to-dismiss of a fullscreen sheet that the user explicitly expanded.

**Reduced motion:**

When `prefers-reduced-motion: reduce` is active (detected via `useReducedMotion()`):
- Expand/collapse transitions use `duration: 0` (instant).
- Drag handle show/hide is instant.
- All spring animations are replaced with `{ type: 'tween', duration: 0 }`.

### D-4: ARIA dialog attributes and screen reader support

Add the following attributes to the `MobileBottomSheet` root container element when the sheet is open:

```tsx
<motion.div
  ref={sheetRef}
  role="dialog"
  aria-modal="true"
  aria-label={ariaLabel}
  tabIndex={-1}
  data-sheet-id={sheetId}
  data-sheet-state={currentState}
  // ... existing props from WS-C.1
>
```

**`aria-modal="true"`:** Indicates that the sheet is a modal dialog and background content is inert. Combined with the `useSheetFocusTrap` hook's `aria-hidden` management on siblings, this ensures assistive technology cannot interact with content behind the sheet.

**`tabIndex={-1}`:** Allows the container to receive programmatic focus (fallback when no focusable children exist).

**`data-sheet-state`:** Exposes the current state (`half`, `full`, `fullscreen`, `collapsed`) as a data attribute for CSS targeting and test automation.

**Screen reader announcement region:**

Add a visually-hidden live region inside the sheet:

```tsx
<div
  className="sr-only"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {announceText}
</div>
```

The `announceText` value changes based on state:
- On open: `"{ariaLabel} opened"` (e.g., "Alert detail opened")
- On expand: `"Expanded to full screen"`
- On collapse: `"Collapsed to sheet"`
- On close: `""` (empty; the focus return to the trigger communicates closure)

**Visually-hidden utility class (if not already present from WS-A.3):**

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### D-5: Landscape height constraint

When the device is in landscape orientation (`isLandscape` prop is `true`), all non-fullscreen snap points are capped at 60% of the viewport height.

**Implementation:**

```typescript
/**
 * Constrain snap points for landscape orientation.
 * Fullscreen mode (100dvh) is exempt from this constraint.
 */
function constrainForLandscape(
  snapPoints: number[], // percentages, e.g. [35, 65, 100]
  isLandscape: boolean,
  maxPercent: number = 60
): number[] {
  if (!isLandscape) return snapPoints
  return snapPoints.map((p) => Math.min(p, maxPercent))
}
```

**Behavior:**

| Snap Point | Portrait | Landscape |
|------------|----------|-----------|
| Alert detail 70% | 70% | 60% |
| Alert detail 100% | 100% | 60% |
| Category detail 35% | 35% | 35% |
| Category detail 65% | 65% | 60% |
| Category detail 100% | 100% | 60% |
| Priority feed 60% | 60% | 60% |
| Priority feed 100% | 100% | 60% |
| Filter 40% | 40% | 40% |
| **Fullscreen** | **100dvh** | **100dvh** (exempt) |

The constraint is applied when computing snap point pixel values from percentages. It uses `var(--sheet-landscape-max-height)` from WS-A.3 (value: `60%`), read at computation time.

**Orientation change during open sheet:**

If the user rotates the device while a sheet is open at a snap point > 60%, the sheet animates down to the landscape-constrained height using `SHEET_SPRING`. This is handled reactively: the snap point computation depends on `isLandscape`, and when `isLandscape` changes, the sheet re-snaps.

### D-6: Backdrop click-to-dismiss

The backdrop overlay rendered behind the sheet (from WS-C.1) dismisses the sheet when tapped.

**Implementation:**

The backdrop element:
```tsx
<motion.div
  className="mobile-sheet-backdrop"
  aria-hidden="true"
  onClick={handleDismiss}
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: reducedMotion ? 0 : 0.2 }}
/>
```

**Behavior:**
- `onClick` fires the same `onDismiss` callback used by the close button and back gesture.
- `aria-hidden="true"` excludes the backdrop from assistive technology focus order.
- The backdrop is outside the focus trap boundary (it is a sibling of the sheet, not a child).
- The backdrop does not dismiss when the user is actively dragging the sheet (prevent accidental dismiss during drag). This requires coordination with WS-C.1's drag state: if `isDragging` is `true`, the backdrop click handler is a no-op.

### D-7: Hook integration in `MobileBottomSheet`

Show how D-1 through D-6 wire together inside the `MobileBottomSheet` component. This is a modification of WS-C.1's component, not a new component.

**Integration sketch (pseudocode, not full implementation):**

```typescript
function MobileBottomSheet({
  isOpen,
  onDismiss,
  snapPoints,
  children,
  allowFullscreen = true,
  ariaLabel,
  triggerRef,
  sheetId,
  isLandscape = false,
  // ... base props from WS-C.1
}: MobileBottomSheetProps & MobileBottomSheetAdvancedProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  // --- D-1: History integration ---
  const { pushSheetState, removeSheetState } = useSheetHistory({
    sheetId,
    isOpen,
    onDismiss: handleHistoryDismiss,
  })

  // Push state when sheet opens
  useEffect(() => {
    if (isOpen) pushSheetState()
  }, [isOpen, pushSheetState])

  function handleHistoryDismiss() {
    // Called by popstate (back button). Dismiss without calling history.back()
    // since popstate already navigated back.
    onDismiss()
  }

  function handleProgrammaticDismiss() {
    // Called by close button, backdrop tap, swipe-to-dismiss.
    // Must clean up the history entry.
    removeSheetState()
    onDismiss()
  }

  // --- D-2: Focus trap ---
  useSheetFocusTrap({
    sheetRef,
    isOpen,
    onEscape: handleProgrammaticDismiss,
    triggerRef,
  })

  // --- D-5: Landscape constraint ---
  const constrainedSnaps = constrainForLandscape(snapPoints, isLandscape)

  // --- D-3: Fullscreen state ---
  const [isFullscreen, setIsFullscreen] = useState(false)

  function handleExpand() {
    setIsFullscreen(true)
  }

  function handleCollapse() {
    setIsFullscreen(false)
  }

  // --- D-4: ARIA announcement ---
  const [announceText, setAnnounceText] = useState('')

  useEffect(() => {
    if (isOpen) setAnnounceText(`${ariaLabel} opened`)
    else setAnnounceText('')
  }, [isOpen, ariaLabel])

  useEffect(() => {
    if (isFullscreen) setAnnounceText('Expanded to full screen')
    else if (isOpen) setAnnounceText('Collapsed to sheet')
  }, [isFullscreen, isOpen])

  // ... render with AnimatePresence, motion.div, etc.
}
```

**Dismiss flow summary:**

| Trigger | History Action | Focus Action | Animation |
|---------|---------------|--------------|-----------|
| Close button tap | `removeSheetState()` (calls `history.back()`) | Focus returns to trigger | Spring to 0 |
| Backdrop tap | `removeSheetState()` (calls `history.back()`) | Focus returns to trigger | Spring to 0 |
| Swipe down past threshold | `removeSheetState()` (calls `history.back()`) | Focus returns to trigger | Spring to 0 |
| Escape key | `removeSheetState()` (calls `history.back()`) | Focus returns to trigger | Spring to 0 |
| System back button | `onDismiss()` (no `history.back()`, popstate already fired) | Focus returns to trigger | Spring to 0 |
| Collapse button (fullscreen -> full) | No history change (stays on same entry) | Focus stays in sheet | Spring to full snap |

### D-8: CSS additions (`src/styles/mobile-sheet.css` -- append to WS-C.1's file)

Append the following to the CSS file created by WS-C.1.

```css
/* ============================================================
 * WS-C.2: Bottom Sheet Advanced
 * Fullscreen mode, landscape constraint, focus-visible,
 * expand/collapse button, screen reader utility.
 * ============================================================ */

/* --- Fullscreen state --- */
.mobile-bottom-sheet[data-sheet-state='fullscreen'] {
  border-radius: 0;
  /* Remove top border-radius in fullscreen */
}

.mobile-bottom-sheet[data-sheet-state='fullscreen'] .sheet-handle-area {
  height: 0;
  overflow: hidden;
  opacity: 0;
  transition: height 200ms var(--ease-default),
              opacity 150ms var(--ease-default);
}

/* --- Expand / Collapse button --- */
.sheet-expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: var(--touch-target-min, 44px);
  min-height: var(--touch-target-min, 44px);
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: color var(--duration-fast, 100ms) var(--ease-default);
}

.sheet-expand-button:active {
  color: rgba(255, 255, 255, 0.6);
}

/* Focus-visible ring for keyboard users */
.sheet-expand-button:focus-visible,
.mobile-bottom-sheet button:focus-visible,
.mobile-bottom-sheet a:focus-visible,
.mobile-bottom-sheet [tabindex]:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
  border-radius: 4px;
}

/* --- Backdrop --- */
.mobile-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 49; /* One below sheet (z-50) */
  background: rgba(0, 0, 0, 0.4);
  -webkit-tap-highlight-color: transparent;
}

/* --- Landscape constraint --- */
@media (orientation: landscape) {
  .mobile-bottom-sheet:not([data-sheet-state='fullscreen']) {
    max-height: var(--sheet-landscape-max-height, 60%);
  }
}

/* --- Screen reader only --- */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* --- Reduced motion --- */
@media (prefers-reduced-motion: reduce) {
  .mobile-bottom-sheet,
  .mobile-bottom-sheet .sheet-handle-area,
  .mobile-sheet-backdrop {
    transition: none !important;
  }
}
```

### D-9: Unit tests (`src/components/mobile/__tests__/bottom-sheet-advanced.test.tsx`)

Test file covering the three hooks and the advanced sheet behavior. Uses React Testing Library + Vitest.

**`useSheetHistory` tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-1 | `pushSheetState` calls `history.pushState` with sheetId | Mock `history.pushState`. Call `pushSheetState()`. | `history.pushState` called with `{ sheetId: 'test', timestamp: expect.any(Number) }`, `''`, `location.href`. |
| T-2 | `pushSheetState` is idempotent (no double-push) | Call `pushSheetState()` twice. | `history.pushState` called exactly once. |
| T-3 | `popstate` event triggers `onDismiss` | Push state, then dispatch `popstate` with `event.state = null`. | `onDismiss` called once. |
| T-4 | `popstate` with matching sheetId does NOT trigger dismiss | Push state, then dispatch `popstate` with `event.state = { sheetId: 'test' }`. | `onDismiss` NOT called. |
| T-5 | `removeSheetState` calls `history.back` | Push state, then call `removeSheetState()`. | `history.back` called once. |
| T-6 | `removeSheetState` is idempotent | Call `removeSheetState()` without prior push. | `history.back` NOT called. |
| T-7 | Cleanup on unmount calls `history.back` if state was pushed | Push state, then unmount the hook. | `history.back` called once during cleanup. |

**`useSheetFocusTrap` tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-8 | Focus moves to first focusable element on open | Render sheet with two buttons. Set `isOpen = true`. | First button has focus after `requestAnimationFrame`. |
| T-9 | Tab on last element wraps to first | Focus last button, dispatch Tab keydown. | First button has focus. |
| T-10 | Shift+Tab on first element wraps to last | Focus first button, dispatch Shift+Tab keydown. | Last button has focus. |
| T-11 | Escape key calls `onEscape` | Dispatch Escape keydown on sheet. | `onEscape` called once. |
| T-12 | Focus returns to trigger on close | Render trigger button + sheet. Open sheet, then close. | Trigger button has focus after close. |
| T-13 | Siblings get `aria-hidden` on open | Render sheet + sibling div. Open sheet. | Sibling has `aria-hidden="true"`. |
| T-14 | Siblings restored on close | Open then close sheet. | Sibling does NOT have `aria-hidden`. |

**Sheet advanced behavior tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-15 | Sheet has `role="dialog"` and `aria-modal="true"` when open | Render `MobileBottomSheet` with `isOpen = true`. | `role="dialog"` and `aria-modal="true"` present on container. |
| T-16 | `aria-label` is set from prop | Render with `ariaLabel="Alert detail"`. | `aria-label="Alert detail"` on container. |
| T-17 | Expand button renders when `allowFullscreen` is true | Render with `allowFullscreen = true`. | Button with `aria-label="Expand to full screen"` is in the DOM. |
| T-18 | Expand button absent when `allowFullscreen` is false | Render with `allowFullscreen = false`. | No button with expand label. |
| T-19 | Expand button click sets `data-sheet-state` to `fullscreen` | Click expand button. | `data-sheet-state="fullscreen"` on container. |
| T-20 | Collapse button click sets `data-sheet-state` to `full` | Expand, then click collapse button. | `data-sheet-state="full"` on container. |
| T-21 | Landscape constraint caps snap points | Render with `isLandscape = true`, `snapPoints = [70, 100]`. | Computed snap points are `[60, 60]`. |
| T-22 | Landscape does not cap fullscreen | Expand to fullscreen with `isLandscape = true`. | Sheet height is `100dvh`, not 60%. |
| T-23 | Backdrop click triggers dismiss | Click `.mobile-sheet-backdrop`. | `onDismiss` called. |
| T-24 | Screen reader announcement on open | Open sheet with `ariaLabel="Alert detail"`. | Live region contains "Alert detail opened". |
| T-25 | Screen reader announcement on expand | Open sheet, then expand. | Live region contains "Expanded to full screen". |

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Sheet has `role="dialog"`, `aria-modal="true"`, and `aria-label` set from the `ariaLabel` prop when open. | Inspect DOM attributes in Chrome DevTools. |
| AC-2 | When the sheet opens, `history.pushState` is called. The browser history length increases by 1. The URL does not change. | Chrome DevTools Application > History. Verify `history.length` before and after open. |
| AC-3 | Pressing the system back button (or dispatching `popstate`) while a sheet is open dismisses the sheet instead of navigating away. | On a real device or emulator, tap back while an alert detail sheet is open. Sheet dismisses, page remains. |
| AC-4 | Nested sheets each push their own history entry. Back button dismisses the top sheet first, then the bottom sheet on the next press. | Open category detail (pushState), then open alert detail within it (pushState). Press back: alert detail dismisses. Press back again: category detail dismisses. |
| AC-5 | When a sheet is dismissed programmatically (close button, backdrop tap, swipe), the stale history entry is cleaned up via `history.back()`. The back button after dismiss navigates normally (no "ghost" entry). | Dismiss a sheet via close button. Immediately press back. Verify no dead back-button press. |
| AC-6 | When focus is inside the sheet, pressing Tab on the last focusable element wraps focus to the first focusable element. Pressing Shift+Tab on the first wraps to the last. | Keyboard testing: Tab through all elements in the sheet. Verify cycling. |
| AC-7 | Pressing Escape while the sheet is open dismisses the sheet. | Keyboard testing. |
| AC-8 | When the sheet opens, focus moves to the first focusable element inside the sheet (typically the close or collapse button). | Open sheet with keyboard (or programmatically). Inspect `document.activeElement`. |
| AC-9 | When the sheet closes, focus returns to the element that triggered the sheet open. | Open sheet by tapping a category card. Close sheet. Verify focus is on that category card. |
| AC-10 | When the sheet is open, all sibling elements of the sheet portal have `aria-hidden="true"`. When the sheet closes, `aria-hidden` is removed. | Inspect DOM during open/close. |
| AC-11 | The expand-to-fullscreen button is visible in the sheet header when `allowFullscreen` is true. Tapping it transitions the sheet to 100dvh with the drag handle collapsed. | Visual inspection + DevTools measurement. |
| AC-12 | In fullscreen mode, a collapse button replaces the expand button. Tapping it returns the sheet to the `'full'` snap point with the drag handle re-appearing. | Tap expand, verify fullscreen. Tap collapse, verify return to `'full'` state. |
| AC-13 | The expand button has an `aria-label` of "Expand to full screen". The collapse button has an `aria-label` of "Collapse to sheet". | Inspect button `aria-label` attributes. |
| AC-14 | In landscape orientation, non-fullscreen sheet heights are capped at 60% of the viewport. | Chrome DevTools: rotate to landscape. Inspect computed `max-height` of the sheet. |
| AC-15 | In landscape orientation, fullscreen mode still reaches 100dvh (no 60% cap). | Expand to fullscreen in landscape. Measure sheet height. |
| AC-16 | If the device rotates from portrait to landscape while a sheet is open at a snap > 60%, the sheet animates down to the constrained height. | Rotate device while sheet is at 70%. Verify sheet shrinks to 60%. |
| AC-17 | Tapping the backdrop behind the sheet dismisses the sheet. | Tap the dark overlay area above the sheet. |
| AC-18 | The backdrop has `aria-hidden="true"` and is not reachable via Tab key. | Keyboard Tab through all elements; backdrop should not receive focus. |
| AC-19 | Expand and collapse buttons have minimum 44x44px touch targets. | Inspect computed `min-width` and `min-height`. |
| AC-20 | A visually-hidden live region announces "opened", "Expanded to full screen", and "Collapsed to sheet" at the appropriate state changes. | Screen reader test (VoiceOver or NVDA): open sheet, hear "opened". Expand, hear "Expanded to full screen". |
| AC-21 | When `prefers-reduced-motion: reduce` is active, expand/collapse transitions are instant (no animation). | Enable reduced motion in OS settings. Expand/collapse are instant. |
| AC-22 | `pnpm typecheck` passes with zero errors. | Run `pnpm typecheck` from project root. |
| AC-23 | All unit tests in D-9 pass. | Run `pnpm test:unit --run`. |
| AC-24 | Desktop view is completely unaffected. | Manual comparison of desktop view at 1920x1080 before and after changes. |
| AC-25 | Drag gestures are disabled when the sheet is in fullscreen state (user must use collapse button or back gesture to exit). | In fullscreen, attempt to drag the sheet down. No drag response. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | `history.pushState` uses the current URL (`location.href`) as the third argument, keeping the URL unchanged. | Sheets are transient UI overlays, not navigation destinations. Changing the URL would create shareable deep-links to sheet states, but sheets depend on the underlying view context (which tab, which markers are visible). Deep-linking to a sheet without its context would produce a broken experience. Tab and category deep-links (handled by `coverage.store` URL sync) are sufficient. | (a) Push with a URL change (e.g., `?sheet=alert-detail`). Rejected: adds URL complexity, requires parsing on load, creates stale links. (b) No pushState at all (let back button navigate away). Rejected: violates user expectation on mobile that back closes overlays. |
| DM-2 | Each sheet instance pushes its own history entry independently. No central "sheet stack" manager. | Each sheet instance is self-contained with its own `useSheetHistory` hook. This is simpler and avoids a cross-component coordination layer. The browser's history stack naturally orders entries in the correct LIFO order. Nested sheets (category -> alert) each push sequentially, and popstate processes them in reverse order. | (a) Central `SheetStackManager` Zustand slice. Rejected: adds global state complexity for a pattern that the browser history stack already provides. Nested sheet dismissal order is guaranteed by push order. (b) Single history entry for all sheets (push once, pop once). Rejected: does not support nested sheets. |
| DM-3 | Focus trap is implemented without an external library (`focus-trap` or `focus-trap-react`). | The codebase convention (from `CLAUDE.md` and `interface-architecture.md` R19) is no external gesture or interaction libraries beyond `motion/react`. The focus trap implementation is ~95 lines and covers all WCAG requirements. An external library would add a dependency for code that is straightforward to implement and test. | (a) `focus-trap-react` npm package. Rejected: adds a dependency; the codebase prefers minimal external libraries. (b) `inert` HTML attribute on background. Rejected: `inert` is well-supported in 2026 but does not handle the Escape key dismissal or focus-return-on-close that we need; we would still need most of the hook logic. Considered as a future enhancement to replace the `aria-hidden` sibling management. |
| DM-4 | Fullscreen mode is a fourth `SheetState` value (`'fullscreen'`), not a separate boolean. | A discriminated union state (`'collapsed' | 'half' | 'full' | 'fullscreen'`) makes state transitions unambiguous. The sheet can only be in one state at a time. A separate `isFullscreen` boolean overlaid on `SheetState` would create an illegal combination (`SheetState = 'collapsed'` + `isFullscreen = true`). | (a) Separate boolean `isFullscreen` alongside `SheetState`. Rejected: creates invalid state combinations and requires guards. (b) Treat fullscreen as a snap point (100%). Rejected: fullscreen has distinct behavior (no drag handle, no drag-to-dismiss, different border-radius) that goes beyond a snap point value. |
| DM-5 | In landscape orientation, the 60% cap applies to all snap points EXCEPT fullscreen. Fullscreen always means 100dvh. | The user explicitly taps the expand button to request fullscreen. Capping fullscreen at 60% in landscape would defeat the purpose of the feature. The 60% constraint exists to keep the underlying content (map, category grid) partially visible in landscape, which is irrelevant when the user has requested immersive reading. | (a) Cap fullscreen at 60% in landscape too. Rejected: contradicts the purpose of Q7 (full-screen for detailed reading). (b) Cap fullscreen at 80% in landscape (compromise). Rejected: arbitrary middle ground not specified in any source doc. |
| DM-6 | Drag gestures are disabled in fullscreen state. | Fullscreen is an explicit user choice (button tap, not drag). Allowing drag-to-dismiss on a fullscreen sheet is inconsistent: the user expanded deliberately, so collapsing should also be deliberate (button or back gesture). Additionally, in fullscreen the drag handle is hidden, leaving no visual affordance for drag. | (a) Allow drag-to-dismiss from fullscreen. Rejected: no visual affordance (handle is hidden), inconsistent with the deliberate expand action. (b) Keep drag handle visible in fullscreen at reduced opacity. Rejected: contradicts the fullscreen aesthetic and the spec from `ui-design-system.md` Section 11 which shows the handle as part of the non-fullscreen sheet anatomy. |
| DM-7 | The `onDismiss` callback is split into two paths: `handleHistoryDismiss` (called by popstate, does NOT call `history.back()`) and `handleProgrammaticDismiss` (called by close/backdrop/swipe/escape, calls `removeSheetState()` which calls `history.back()`). | When the back button triggers dismissal, `popstate` has already navigated the history stack. Calling `history.back()` again would navigate away from the page. Conversely, when the user taps close or swipes, the history entry must be explicitly removed. This two-path pattern prevents double-back and ensures the history stack is always clean. | (a) Single dismiss path that always calls `history.back()`. Rejected: causes double-back when triggered by popstate. (b) Track "dismiss source" in a ref and conditionally call `history.back()`. Functionally equivalent to the two-path approach but less explicit. The two-function pattern makes the intent clearer at each call site. |
| DM-8 | CSS landscape constraint uses a `@media (orientation: landscape)` rule with `max-height` on the sheet, rather than computing pixel values in JS. | Pure CSS solution is more performant and avoids layout thrash. The `max-height` property is respected by the animation target -- `motion/react` animates `height` (or `transform`), and `max-height` clamps the result. The `isLandscape` prop is still passed for JS-side snap point computation, but the CSS rule provides a visual safety net. | (a) JS-only computation of constrained height. Rejected: requires `window.innerHeight` reads and risks layout thrash. (b) CSS-only with no JS snap point adjustment. Rejected: the snap point computation in JS would still target heights > 60%, causing the spring animation to overshoot and then be clamped. Both CSS and JS must agree. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | When the user expands to fullscreen and then presses the system back button, should it collapse to `'full'` (preserving the sheet with content visible) or dismiss entirely? Current decision: dismiss entirely (back = close). But some apps (YouTube, Google Maps) collapse first. | world-class-ux-designer | Phase D review gate |
| OQ-2 | Should the `aria-hidden` management on body children use the `inert` HTML attribute instead? `inert` is natively supported in all target browsers (Safari 15.5+, Chrome 102+, Firefox 112+) and provides both focus-trapping and pointer-event blocking without manual `aria-hidden` management. The `inert` attribute could replace both the `aria-hidden` sibling management AND the manual Tab-key cycling, significantly simplifying `useSheetFocusTrap`. Deferred because: (a) `inert` does not handle Escape key or focus-return-on-close, so the hook would still be needed for those behaviors, and (b) testing `inert` in JSDOM/testing-library requires polyfills. | react-developer | Phase F (Accessibility Audit) |
| OQ-3 | Should the live-region announcement include the sheet context content (e.g., "Alert detail for 7.2 Earthquake opened") or keep it generic ("Alert detail opened")? Richer announcements provide more context but may be verbose if sheets open/close rapidly. | information-architect | Phase D |
| OQ-4 | The cleanup in `useSheetHistory` calls `history.back()` on unmount when a state was pushed. If the component unmounts due to a tab switch (morph guard in `MobileShell` calls `resetMorph()` which unmounts the sheet), does the `history.back()` in cleanup race with the tab switch? Should the tab-switch handler in MobileShell explicitly call `removeSheetState()` before switching? | react-developer | Phase D (WS-D.3 Morph + Navigation) |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `history.pushState`/`popstate` integration causes unexpected navigation behavior when combined with Next.js App Router's internal history management. | Medium | High | The app deploys as a static export to GitHub Pages with a single route (`/`). Next.js App Router's client-side history management is minimal for static exports. However, the `(launch)/layout.tsx` auth guard uses `router.push('/login')` which adds a history entry. Test: open sheet, dismiss via back, verify no accidental redirect to `/login`. If conflicts arise, guard the popstate handler by checking `location.pathname` before dismissing. |
| R-2 | Rapid sheet open/close cycles create orphaned history entries that cause "dead" back-button presses. | Medium | Medium | The `hasPushedState` ref guard prevents double-push. The cleanup-on-unmount call to `history.back()` handles orphaned entries. Test T-7 verifies this. Additional safety: add a `setTimeout(0)` delay before cleanup `history.back()` to allow React's commit phase to complete before mutating history. |
| R-3 | `aria-hidden="true"` on body children may hide elements that are used by other overlays (e.g., toast notifications, error banners). | Low | Medium | The `useSheetFocusTrap` hook only hides direct children of `document.body` that are not ancestors of the sheet. Toast notifications rendered via a portal to `document.body` would be hidden. Mitigation: ensure toast notifications use a portal target inside the sheet's portal container (or are rendered above the sheet in z-index). Alternatively, use the `inert` attribute (OQ-2) which is more surgical. |
| R-4 | The focus trap re-queries focusable elements on every Tab press, which could be slow for sheets with many elements (e.g., a long alert list). | Very Low | Very Low | `querySelectorAll` on a bounded DOM subtree (the sheet) is effectively instant even with hundreds of elements. No mitigation needed. |
| R-5 | `motion/react` spring animation targeting `height` while CSS `max-height` is applied (landscape constraint) may cause jank or visual flickering as the animated value overshoots and is clamped. | Medium | Low | The JS snap point computation (D-5 `constrainForLandscape`) ensures the animation target never exceeds the landscape cap. The CSS `max-height` is a visual safety net, not the primary constraint mechanism. The spring will settle at the JS-computed value, which is already capped. If flickering occurs, switch to animating `transform: translateY()` (which `max-height` does not affect) and set `height` statically. |
| R-6 | The `popstate` handler fires for ALL history navigations, not just sheet-related ones. If the user manually enters a URL in the address bar and navigates back, the popstate handler might incorrectly dismiss a sheet. | Low | Low | The handler checks `hasPushedState.current` before acting. If the sheet did not push a state, the handler is a no-op. The `sheetId` check on `event.state` provides additional specificity. |
| R-7 | Screen reader announcement changes too rapidly during expand/collapse, causing announcement overlap or truncation. | Low | Low | Use `aria-live="polite"` (not `assertive`) so announcements queue rather than interrupt. The 300ms expand animation provides sufficient time between state changes. Test with VoiceOver and NVDA to verify. |

---

## Appendix A: Dismiss Flow State Diagram

```
                          SHEET OPEN (any snap)
                               |
            +------------------+------------------+
            |                  |                  |
       Close Button       Backdrop Tap       Swipe Down
       / Escape Key                          past threshold
            |                  |                  |
            v                  v                  v
    handleProgrammaticDismiss()
            |
            +-- removeSheetState()
            |       |
            |       +-- history.back()  <-- removes history entry
            |
            +-- onDismiss()
            |
            +-- focus returns to trigger
            |
            v
       SHEET CLOSED
```

```
                          SHEET OPEN (any snap)
                               |
                       System Back Button
                               |
                        popstate event
                               |
                   handleHistoryDismiss()
                               |
                   (NO history.back() -- already popped)
                               |
                        onDismiss()
                               |
                   focus returns to trigger
                               |
                          SHEET CLOSED
```

## Appendix B: Fullscreen State Transitions

```
                   +-------- COLLAPSED (0%) --------+
                   |                                 |
              [open trigger]                    [dismiss]
                   |                                 ^
                   v                                 |
              HALF (snap %)                          |
                   |                                 |
              [drag up]        [drag down / back]----+
                   |                                 |
                   v                                 |
              FULL (highest snap %)                  |
                   |                                 |
            [expand button]    [drag down / back]----+
                   |
                   v
            FULLSCREEN (100dvh)
                   |
          [collapse button]        [back button]-----> COLLAPSED
                   |
                   v
              FULL (highest snap %)
```

## Appendix C: File Inventory

| File | Action | Lines (est.) |
|------|--------|-------------|
| `src/hooks/use-sheet-history.ts` | New | ~75 |
| `src/hooks/use-sheet-focus-trap.ts` | New | ~95 |
| `src/components/mobile/MobileBottomSheet.tsx` | Modified (WS-C.1 base) | +~120 |
| `src/styles/mobile-sheet.css` | Modified (WS-C.1 base) | +~70 |
| `src/components/mobile/__tests__/bottom-sheet-advanced.test.tsx` | New | ~350 |
| **Total new/modified** | | **~710** |
