# WS-2.1: Morph Choreography

> **Workstream ID:** WS-2.1
> **Phase:** 2 -- Districts + Stations + Morph
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.1 (ZUI engine, camera store, flyTo), WS-1.2 (capsule components, ring layout), WS-1.7 (CameraController interface)
> **Blocks:** WS-2.2-2.5 (district content needs morph container), WS-3.7 (attention choreography)
> **Resolves:** None

---

## 1. Objective

Deliver the morph choreography system that transforms a capsule in the Launch Atrium into an expanded district container with visible stations. This is the primary spatial transition in Tarva Launch -- the moment where the user crosses from the Z1 overview into the Z2 focused view of a single application.

The system is a 4-phase state machine (`idle` -> `focusing` -> `morphing` -> `unfurling` -> `settled`) driven by capsule selection, with spring-physics camera animation coordinated with Framer Motion element transitions. The reverse flow (deselection) runs the same phases in reverse, restoring the atrium to its idle state.

**Success looks like:** The user clicks a capsule. The camera springs smoothly to center the district. The selected capsule scales up while siblings drift outward and fade. The capsule shape transitions into a larger district container. Stations appear with a staggered entrance. The URL updates. Clicking the breadcrumb or pressing Escape reverses the entire sequence. The transition sustains 60fps throughout. `prefers-reduced-motion` users see instant state changes with no animation.

**Why this workstream matters:** Every district content workstream (WS-2.2 through WS-2.5) depends on the morph container as its rendering host. The morph is also the highest-impact visual transition in the application -- if it feels choppy or disjointed, the entire "mission control" aesthetic collapses. The state machine defined here becomes the coordination backbone for all future attention choreography (WS-3.7).

**Traceability:** AD-4 (Morph Choreography), AD-3 (Three-Tier Animation Architecture), AD-1 (Camera State Management), VISUAL-DESIGN-SPEC.md Section 2.4 (Selected State), Section 4.3 (Glow Performance), combined-recommendations.md "District View (Z2)" requirements.

---

## 2. Scope

### In Scope

1. **Morph state machine** -- Evolve the WS-0.1 `ui.store` skeleton `MorphPhase` type from `'idle' | 'zooming' | 'morphing' | 'settling'` to the AD-4-aligned `'idle' | 'focusing' | 'morphing' | 'unfurling' | 'settled'`. Add morph-specific state and actions to the UI store: `morphDirection`, `morphTargetId`, `startMorph()`, `reverseMorph()`, `setMorphPhase()`.

2. **Orchestration hook** (`useMorphChoreography`) -- The central coordination hook that drives the state machine. Listens for selection events from `ui.store`, triggers camera `flyTo`, coordinates Framer Motion transitions, manages phase progression with timing, and handles deselection reverse flow.

3. **Capsule morph variants** -- Framer Motion variants for the selected capsule during each phase (scale up, translate toward container position, shape transition). Variants for sibling capsules (drift outward, fade to 0.3 opacity). All using explicit `animate` values, never `layout` animations. [SPEC: AD-3]

4. **District container** (`DistrictShell`) -- The expanded container that the capsule morphs into. Dimensions ~380x460px (per VISUAL-DESIGN-SPEC.md Z2 capsule dimensions). Glass material with active glass styling. Provides slot composition for station content from WS-2.2-2.5.

5. **Station entrance animation** -- Staggered `AnimatePresence` entrance for station cards during the `unfurling` phase. Station cards slide in from below with opacity fade, staggered by 80ms per card.

6. **Reverse flow** (deselection) -- `settled` -> `unfurling` (stations exit) -> `morphing` (container shrinks) -> `focusing` (camera returns, capsules return) -> `idle`. Triggered by Escape key, breadcrumb "Launch" click, clicking outside the district, or programmatic `reverseMorph()` call.

7. **URL sync** -- On reaching `settled`, update the URL to `?district={id}`. On reaching `idle` (after reverse), remove the `district` param. On initial page load with `?district={id}`, skip animation and render directly in `settled` state.

8. **`prefers-reduced-motion` support** -- When reduced motion is active, skip all animated phases: selection immediately sets the camera position, renders the district container, and enters `settled`. Deselection immediately returns to `idle`.

9. **Hub center glyph interaction** -- During `settled` state, clicking the hub center glyph triggers reverse morph (return to atrium).

10. **TypeScript types** for all morph-related state, actions, animation configs, and component props.

### Out of Scope

- Station panel content (WS-2.2-2.5 provide the actual station components rendered inside `DistrictShell`)
- Station panel framework styling (WS-2.6 defines the 3-zone layout, glass material, luminous borders)
- Constellation view (Z0) beacon interactions (WS-2.7)
- Attention choreography rules (WS-3.7 consumes `morphPhase` to adjust ambient effects)
- Receipt generation on district selection (WS-3.1)
- Command palette "go {district}" integration (WS-3.3 calls `startMorph()` via the UI store)
- Capsule hover/selection styling (WS-1.2 -- already implemented; this workstream consumes those variants)
- Camera store internals (WS-1.1 -- consumed, not modified)

---

## 3. Input Dependencies

| Dependency                | Source      | What It Provides                                                                                                                                                                                                                                                             | Blocking?                             |
| ------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| WS-1.1 Camera Store       | Phase 1     | `useCameraStore` with `flyTo(worldX, worldY, targetZoom, config?)`, `cancelAnimation()`, `isAnimating`, `isPanning`, `setCamera()`, `cameraSelectors.isMoving`; `useFlyTo()` hook with `flyTo`, `cancel`, `isFlying`; `SpringConfig` type; `DEFAULT_SPRING_CONFIG` constants | Yes                                   |
| WS-1.1 Spatial Math       | Phase 1     | `worldToScreen()`, `screenToWorld()` coordinate conversion functions for calculating capsule positions during morph                                                                                                                                                          | Yes                                   |
| WS-1.1 SpatialCanvas      | Phase 1     | CSS-transformed container where all spatial content renders; `will-change: transform`, `transform-origin: 0 0`; the `[data-panning]` attribute for pan-pause coordination                                                                                                    | Yes                                   |
| WS-1.2 Capsule Components | Phase 1     | `CapsuleRing` with `capsuleRefs: Record<DistrictId, RefObject<HTMLDivElement>>` for measuring capsule DOM positions; `DistrictCapsule` with Framer Motion variants (`idle`, `hover`, `selected`, `dimmed`); `DISTRICTS` constant with ring positions                         | Yes                                   |
| WS-1.7 CameraController   | Phase 1     | `CameraController.flyTo()` method; `ManualCameraController.DISTRICT_POSITIONS` static map with world-space positions for each district; `CameraTarget` type with `type: 'district'` variant                                                                                  | Yes                                   |
| WS-0.1 UI Store           | Phase 0     | `useUIStore` with `selectedDistrictId`, `morphPhase`, `selectDistrict()`, `setMorphPhase()` skeleton actions                                                                                                                                                                 | Yes                                   |
| WS-0.2 Design Tokens      | Phase 0     | `--duration-morph-focus` (300ms), `--duration-morph-shape` (200ms), `--duration-morph-unfurl` (400ms), `--ease-morph`, `--ease-bounce`, glass and glow tokens                                                                                                                | Soft -- can hardcode values initially |
| `motion/react` v12+       | npm package | `motion`, `AnimatePresence`, `useAnimate`, `useMotionValue`, `useTransform`, `type Variants`, `type Transition`                                                                                                                                                              | Yes                                   |
| `@tarva/ui`               | npm package | `Badge` (for district header), `Button` (for station actions), glass CSS utilities                                                                                                                                                                                           | Soft                                  |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  stores/
    ui.store.ts                          # MODIFY: evolve MorphPhase type, add morph actions
  types/
    morph.ts                             # NEW: morph state machine types
  hooks/
    use-morph-choreography.ts            # NEW: orchestration hook
    use-morph-variants.ts                # NEW: Framer Motion variant factory
    use-district-position.ts             # NEW: compute district world position from capsule ref
  components/
    districts/
      morph-orchestrator.tsx             # NEW: component that wires the hook to the render tree
      district-shell.tsx                 # NEW: expanded district container
      station-entrance.tsx               # NEW: staggered station card entrance wrapper
      district-shell.test.tsx            # NEW: tests
    districts/
      __tests__/
        morph-orchestrator.test.tsx      # NEW: integration tests
        morph-state-machine.test.ts      # NEW: state machine unit tests
  styles/
    morph.css                            # NEW: CSS for morph-specific ambient animations
```

### 4.2 Type Definitions

**File:** `src/types/morph.ts`

```ts
import type { DistrictId } from '@/types/district'

// ============================================================
// MORPH STATE MACHINE
// ============================================================

/**
 * The 5-phase morph state machine per AD-4.
 *
 * Forward flow:  idle -> focusing -> morphing -> unfurling -> settled
 * Reverse flow:  settled -> unfurling -> morphing -> focusing -> idle
 *
 * The morph is always driven by `useMorphChoreography`. No other
 * consumer should call `setMorphPhase()` directly.
 */
export type MorphPhase =
  | 'idle' // No selection. All capsules in ring. Default state.
  | 'focusing' // Camera springing to district. Selected capsule scaling. Siblings fading.
  | 'morphing' // Capsule shape transitioning to district container. Content swapping.
  | 'unfurling' // Stations appearing with staggered entrance.
  | 'settled' // District fully visible. URL synced. Interactions enabled.

/**
 * Direction of the morph animation.
 * 'forward' = capsule -> district (selection)
 * 'reverse' = district -> capsule (deselection)
 */
export type MorphDirection = 'forward' | 'reverse'

/**
 * Timing configuration for each morph phase, in milliseconds.
 * These are the orchestration durations -- how long to wait in each
 * phase before advancing to the next. They coordinate with (but are
 * not identical to) the Framer Motion transition durations.
 */
export interface MorphTimingConfig {
  /** Duration of the focusing phase. Camera flyTo + capsule scale. */
  focusing: number
  /** Duration of the morphing phase. Shape transition + content swap. */
  morphing: number
  /** Duration of the unfurling phase. Staggered station entrance. */
  unfurling: number
}

/** Default timing per AD-4. */
export const MORPH_TIMING: Readonly<MorphTimingConfig> = {
  focusing: 300,
  morphing: 200,
  unfurling: 400,
} as const

/**
 * Reduced-motion timing: instant transitions, no waiting.
 * The state machine still runs through all phases but with 0ms durations.
 */
export const MORPH_TIMING_REDUCED: Readonly<MorphTimingConfig> = {
  focusing: 0,
  morphing: 0,
  unfurling: 0,
} as const

/**
 * Spring configuration specifically tuned for the morph camera flyTo.
 * Slightly tighter than the default flyTo spring to feel more responsive
 * during district selection.
 */
export const MORPH_SPRING_CONFIG = {
  stiffness: 200,
  damping: 28,
  mass: 1,
  restThreshold: 0.01,
} as const

/**
 * Complete morph state tracked in the UI store.
 * Extends the WS-0.1 skeleton with direction and target tracking.
 */
export interface MorphState {
  /** Current phase of the morph state machine. */
  phase: MorphPhase
  /** Direction of the current morph (forward or reverse). */
  direction: MorphDirection
  /** District being morphed to (forward) or from (reverse). Null when idle. */
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
   * Sets phase to 'focusing', direction to 'forward', targetId to the district.
   * The orchestration hook drives subsequent phase transitions.
   */
  startMorph: (districtId: DistrictId) => void
  /**
   * Begin reverse morph back to the atrium.
   * Sets phase to 'unfurling' (reverse starts by collapsing stations),
   * direction to 'reverse'.
   */
  reverseMorph: () => void
  /** Set the morph phase directly. Only called by useMorphChoreography. */
  setMorphPhase: (phase: MorphPhase) => void
  /** Reset morph to idle. Called on completion of reverse flow. */
  resetMorph: () => void
}

// ============================================================
// DISTRICT SHELL TYPES
// ============================================================

/**
 * Position and dimension data for the district shell.
 * Computed from the capsule ref and the target district layout.
 */
export interface DistrictShellGeometry {
  /** World-space X position of the district shell center. */
  worldX: number
  /** World-space Y position of the district shell center. */
  worldY: number
  /** Width of the expanded district container in world-space pixels. */
  width: number
  /** Height of the expanded district container in world-space pixels. */
  height: number
}

/** Dimensions of the district shell at Z2. */
export const DISTRICT_SHELL_DIMENSIONS = {
  width: 380,
  height: 460,
  borderRadius: 32,
  padding: 24,
} as const

/** Dimensions of a capsule at Z1 (for morph origin). */
export const CAPSULE_DIMENSIONS = {
  width: 192,
  height: 228,
  borderRadius: 28,
  padding: 20,
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
```

### 4.3 UI Store Evolution

**File:** `src/stores/ui.store.ts` (MODIFY)

Evolve the WS-0.1 skeleton to use the new `MorphPhase` type and add morph-specific state and actions.

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DistrictId } from '@/types/district'
import type { MorphPhase, MorphDirection, MorphState } from '@/types/morph'

// ============================================================
// STATE
// ============================================================

interface UIState {
  // --- Selection ---
  selectedDistrictId: DistrictId | null

  // --- Morph State Machine ---
  morph: MorphState

  // --- Command Palette ---
  commandPaletteOpen: boolean
}

// ============================================================
// ACTIONS
// ============================================================

interface UIActions {
  /**
   * Select a district. This does NOT start the morph -- it only sets
   * the selection target. The morph orchestrator listens for this
   * change and calls startMorph() if appropriate.
   */
  selectDistrict: (id: DistrictId | null) => void

  /**
   * Begin forward morph: idle -> focusing -> morphing -> unfurling -> settled.
   * Only valid when morph.phase === 'idle'.
   * Sets selectedDistrictId, morph.phase, morph.direction, morph.targetId.
   */
  startMorph: (districtId: DistrictId) => void

  /**
   * Begin reverse morph: settled -> unfurling -> morphing -> focusing -> idle.
   * Only valid when morph.phase === 'settled'.
   * Clears selectedDistrictId on completion (when resetMorph is called).
   */
  reverseMorph: () => void

  /**
   * Advance the morph phase. Called only by useMorphChoreography.
   * Records the phase start timestamp for timing coordination.
   */
  setMorphPhase: (phase: MorphPhase) => void

  /**
   * Reset morph to idle state. Called at the end of reverse flow.
   * Clears selectedDistrictId, targetId, direction.
   */
  resetMorph: () => void

  // --- Command Palette ---
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
}

export type UIStore = UIState & UIActions

// ============================================================
// INITIAL STATE
// ============================================================

const INITIAL_MORPH_STATE: MorphState = {
  phase: 'idle',
  direction: 'forward',
  targetId: null,
  phaseStartedAt: null,
}

// ============================================================
// STORE
// ============================================================

export const useUIStore = create<UIStore>()(
  immer((set, get) => ({
    selectedDistrictId: null,
    morph: { ...INITIAL_MORPH_STATE },
    commandPaletteOpen: false,

    selectDistrict: (id) =>
      set((state) => {
        state.selectedDistrictId = id
      }),

    startMorph: (districtId) =>
      set((state) => {
        if (state.morph.phase !== 'idle') return // Guard: only start from idle
        state.selectedDistrictId = districtId
        state.morph.phase = 'focusing'
        state.morph.direction = 'forward'
        state.morph.targetId = districtId
        state.morph.phaseStartedAt = performance.now()
      }),

    reverseMorph: () =>
      set((state) => {
        if (state.morph.phase !== 'settled') return // Guard: only reverse from settled
        state.morph.direction = 'reverse'
        state.morph.phase = 'unfurling' // Reverse starts by collapsing stations
        state.morph.phaseStartedAt = performance.now()
      }),

    setMorphPhase: (phase) =>
      set((state) => {
        state.morph.phase = phase
        state.morph.phaseStartedAt = performance.now()
      }),

    resetMorph: () =>
      set((state) => {
        state.selectedDistrictId = null
        state.morph = { ...INITIAL_MORPH_STATE }
      }),

    toggleCommandPalette: () =>
      set((state) => {
        state.commandPaletteOpen = !state.commandPaletteOpen
      }),

    setCommandPaletteOpen: (open) =>
      set((state) => {
        state.commandPaletteOpen = open
      }),
  }))
)

// ============================================================
// SELECTORS
// ============================================================

export const uiSelectors = {
  /** Current morph phase. */
  morphPhase: (state: UIStore): MorphPhase => state.morph.phase,

  /** Whether the morph is actively animating (not idle or settled). */
  isMorphing: (state: UIStore): boolean =>
    state.morph.phase !== 'idle' && state.morph.phase !== 'settled',

  /** Whether a district is fully expanded and interactive. */
  isDistrictSettled: (state: UIStore): boolean => state.morph.phase === 'settled',

  /** Whether the morph is running in reverse (deselection). */
  isReversing: (state: UIStore): boolean => state.morph.direction === 'reverse',

  /** The district being morphed to/from, or null. */
  morphTargetId: (state: UIStore): DistrictId | null => state.morph.targetId,
}
```

### 4.4 Orchestration Hook: `useMorphChoreography`

**File:** `src/hooks/use-morph-choreography.ts`

This is the brain of the morph system. It drives phase transitions with timing, coordinates camera animation, and handles the reverse flow.

```ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useUIStore, uiSelectors } from '@/stores/ui.store'
import { useCameraStore } from '@/stores/camera.store'
import type { DistrictId } from '@/types/district'
import type { MorphPhase, MorphDirection } from '@/types/morph'
import { MORPH_TIMING, MORPH_TIMING_REDUCED, MORPH_SPRING_CONFIG } from '@/types/morph'

/**
 * District world-space center positions.
 * Imported from CameraController.DISTRICT_POSITIONS (WS-1.7).
 * These are the camera flyTo targets for each district.
 */
const DISTRICT_WORLD_POSITIONS: Record<DistrictId, { worldX: number; worldY: number }> = {
  'agent-builder': { worldX: -260, worldY: 150 },
  'tarva-chat': { worldX: 260, worldY: 150 },
  'project-room': { worldX: 300, worldY: -150 },
  'tarva-core': { worldX: 0, worldY: -300 },
  'tarva-erp': { worldX: -300, worldY: -150 },
  'tarva-code': { worldX: 260, worldY: -260 },
}

/** Zoom level for district view (Z2 entry point). */
const DISTRICT_ZOOM = 1.0

/** Zoom level for atrium (Z1 default landing). */
const ATRIUM_ZOOM = 0.5

interface UseMorphChoreographyOptions {
  /** Whether the user prefers reduced motion. */
  prefersReducedMotion: boolean
}

interface UseMorphChoreographyReturn {
  /** Current morph phase. */
  phase: MorphPhase
  /** Current morph direction (forward or reverse). */
  direction: MorphDirection
  /** The district being morphed to/from. */
  targetId: DistrictId | null
  /** Whether the morph is actively animating. */
  isMorphing: boolean
  /** Start a forward morph to the specified district. */
  startMorph: (districtId: DistrictId) => void
  /** Start a reverse morph back to the atrium. */
  reverseMorph: () => void
}

/**
 * Central orchestration hook for the morph choreography.
 *
 * Drives the 4-phase state machine:
 *
 * FORWARD:
 *   idle
 *     -> startMorph(districtId)
 *   focusing (300ms)
 *     - Camera flyTo district center at Z2 zoom
 *     - Selected capsule scales up (1.0 -> 1.3)
 *     - Sibling capsules drift outward + fade to opacity 0.3
 *     -> after focusing duration
 *   morphing (200ms)
 *     - Capsule shape transitions to district shell dimensions
 *     - AnimatePresence swaps capsule content for district content
 *     -> after morphing duration
 *   unfurling (400ms)
 *     - Station cards enter with staggered animation
 *     -> after unfurling duration
 *   settled
 *     - URL updated with ?district={id}
 *     - Station interactions enabled
 *     - Ambient animations resume
 *
 * REVERSE:
 *   settled
 *     -> reverseMorph()
 *   unfurling (reverse: 300ms)
 *     - Station cards exit with reverse stagger
 *     -> after exit duration
 *   morphing (reverse: 200ms)
 *     - District shell shrinks back to capsule dimensions
 *     - AnimatePresence swaps district content for capsule content
 *     -> after morphing duration
 *   focusing (reverse: 300ms)
 *     - Camera flyTo atrium center (0, 0) at Z1 zoom
 *     - Selected capsule scales back to 1.0
 *     - Sibling capsules return to ring positions + full opacity
 *     -> after focusing duration
 *   idle
 *     - resetMorph() clears selection and state
 *     - URL district param removed
 *
 * Timing coordination uses setTimeout chaining, not requestAnimationFrame,
 * because phase durations are intentional design values (not physics-driven).
 * The camera animation itself uses rAF via the camera store's flyTo.
 */
export function useMorphChoreography(
  options: UseMorphChoreographyOptions
): UseMorphChoreographyReturn {
  const { prefersReducedMotion } = options
  const timing = prefersReducedMotion ? MORPH_TIMING_REDUCED : MORPH_TIMING

  // Store actions
  const startMorphAction = useUIStore((s) => s.startMorph)
  const reverseMorphAction = useUIStore((s) => s.reverseMorph)
  const setMorphPhase = useUIStore((s) => s.setMorphPhase)
  const resetMorph = useUIStore((s) => s.resetMorph)

  // Store state (subscribed via selectors)
  const phase = useUIStore(uiSelectors.morphPhase)
  const direction = useUIStore((s) => s.morph.direction)
  const targetId = useUIStore(uiSelectors.morphTargetId)
  const isMorphing = useUIStore(uiSelectors.isMorphing)

  // Camera actions
  const flyTo = useCameraStore((s) => s.flyTo)
  const cancelAnimation = useCameraStore((s) => s.cancelAnimation)

  // Timer refs for cleanup
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (phaseTimerRef.current) {
        clearTimeout(phaseTimerRef.current)
      }
    }
  }, [])

  // ----------------------------------------------------------------
  // FORWARD FLOW: phase progression
  // ----------------------------------------------------------------
  useEffect(() => {
    if (direction !== 'forward') return

    if (phase === 'focusing' && targetId) {
      // Start camera flyTo to district center
      const pos = DISTRICT_WORLD_POSITIONS[targetId]
      if (pos) {
        flyTo(pos.worldX, pos.worldY, DISTRICT_ZOOM, MORPH_SPRING_CONFIG)
      }
      // Advance to morphing after focusing duration
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('morphing')
      }, timing.focusing)
    }

    if (phase === 'morphing') {
      // Shape transition runs via Framer Motion variants (declarative).
      // Advance to unfurling after morphing duration.
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('unfurling')
      }, timing.morphing)
    }

    if (phase === 'unfurling') {
      // Station entrance runs via Framer Motion staggered variants.
      // Advance to settled after unfurling duration.
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('settled')
      }, timing.unfurling)
    }

    if (phase === 'settled') {
      // Sync URL with district parameter
      syncUrlDistrict(targetId)
    }
  }, [phase, direction, targetId, timing, flyTo, setMorphPhase])

  // ----------------------------------------------------------------
  // REVERSE FLOW: phase progression
  // ----------------------------------------------------------------
  useEffect(() => {
    if (direction !== 'reverse') return

    if (phase === 'unfurling') {
      // Stations exit (AnimatePresence handles exit animation).
      // Advance to morphing after a shorter exit duration.
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('morphing')
      }, timing.unfurling * 0.75) // Exit is 75% of entrance duration
    }

    if (phase === 'morphing') {
      // District shell shrinks back to capsule dimensions.
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('focusing')
      }, timing.morphing)
    }

    if (phase === 'focusing') {
      // Camera flies back to atrium center
      flyTo(0, 0, ATRIUM_ZOOM, MORPH_SPRING_CONFIG)
      // Advance to idle after focusing duration
      phaseTimerRef.current = setTimeout(() => {
        resetMorph()
        syncUrlDistrict(null) // Remove district from URL
      }, timing.focusing)
    }
  }, [phase, direction, timing, flyTo, setMorphPhase, resetMorph])

  // ----------------------------------------------------------------
  // Keyboard: Escape to reverse morph
  // ----------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && phase === 'settled') {
        e.preventDefault()
        reverseMorphAction()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, reverseMorphAction])

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------
  const startMorph = useCallback(
    (districtId: DistrictId) => {
      if (phase !== 'idle') return
      cancelAnimation() // Cancel any active camera animation
      startMorphAction(districtId)
    },
    [phase, cancelAnimation, startMorphAction]
  )

  const reverseMorph = useCallback(() => {
    if (phase !== 'settled') return
    cancelAnimation()
    reverseMorphAction()
  }, [phase, cancelAnimation, reverseMorphAction])

  return {
    phase,
    direction,
    targetId,
    isMorphing,
    startMorph,
    reverseMorph,
  }
}

// ============================================================
// URL SYNC HELPER
// ============================================================

/**
 * Update the URL search params with the current district selection.
 * Uses history.replaceState to avoid Next.js router re-renders.
 */
function syncUrlDistrict(districtId: DistrictId | null): void {
  const url = new URL(window.location.href)
  if (districtId) {
    url.searchParams.set('district', districtId)
  } else {
    url.searchParams.delete('district')
  }
  window.history.replaceState({}, '', url.toString())
}
```

**Implementation notes:**

- The orchestration hook uses `setTimeout` chaining, not `requestAnimationFrame`, because phase durations are design-intentional values that do not need frame-level precision. The camera flyTo animation uses rAF internally via the camera store.
- The `flyTo` call in the `focusing` phase runs concurrently with the phase timer. The spring animation typically settles within 300ms (the focusing duration), but if it takes longer, subsequent phases begin anyway -- the camera will continue settling in the background. This prevents the morph from stalling if the spring overshoots.
- Timer refs are cleaned up on unmount and on new phase transitions to prevent orphaned timers during rapid selection/deselection.

### 4.5 Morph Variant Factory Hook: `useMorphVariants`

**File:** `src/hooks/use-morph-variants.ts`

Generates Framer Motion variants for capsules and the district shell based on the current morph phase and direction. These are consumed by the render components.

```ts
'use client'

import { useMemo } from 'react'
import type { Variants, Transition } from 'motion/react'
import type { MorphPhase, MorphDirection } from '@/types/morph'
import { DISTRICT_SHELL_DIMENSIONS, CAPSULE_DIMENSIONS, MORPH_TIMING } from '@/types/morph'

// ============================================================
// TRANSITIONS
// ============================================================

/** Morph-specific spring transition (snappier than default flyTo). */
const morphSpring: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 28,
  mass: 1,
}

/** Tween transition for shape changes (border-radius, dimensions). */
const morphTween: Transition = {
  type: 'tween',
  duration: MORPH_TIMING.morphing / 1000, // 0.2s
  ease: [0.4, 0, 0.2, 1], // --ease-default
}

/** Tween for sibling capsule fade/drift. */
const siblingTween: Transition = {
  type: 'tween',
  duration: MORPH_TIMING.focusing / 1000, // 0.3s
  ease: [0.4, 0, 0.2, 1],
}

// ============================================================
// SELECTED CAPSULE VARIANTS
// ============================================================

/**
 * Variants for the capsule that is being morphed into a district.
 *
 * Phase mapping:
 * - idle: capsule at rest (1.0 scale, 192x228, 28px radius)
 * - focusing: capsule scales up (1.3x), glow brightens
 * - morphing: capsule grows to district shell dimensions (380x460, 32px radius)
 * - unfurling: district shell at full size (stations entering inside)
 * - settled: district shell at full size (static)
 *
 * IMPORTANT: All size changes use `scale` transform, NOT `width`/`height`.
 * Per AD-3 and VISUAL-DESIGN-SPEC.md 4.3: only use transform for movement.
 */
export const selectedCapsuleVariants: Variants = {
  idle: {
    scale: 1,
    opacity: 1,
    transition: morphSpring,
  },
  focusing: {
    scale: 1.3,
    opacity: 1,
    transition: morphSpring,
  },
  morphing: {
    // Scale to match district shell dimensions relative to capsule
    // scaleX = 380 / 192 = 1.979
    // scaleY = 460 / 228 = 2.018
    // Use uniform scale to avoid distortion: average = ~2.0
    scale: 2.0,
    opacity: 1,
    borderRadius: DISTRICT_SHELL_DIMENSIONS.borderRadius,
    transition: morphTween,
  },
  unfurling: {
    scale: 2.0,
    opacity: 1,
    borderRadius: DISTRICT_SHELL_DIMENSIONS.borderRadius,
    transition: { duration: 0 }, // Maintain shape, no transition
  },
  settled: {
    scale: 2.0,
    opacity: 1,
    borderRadius: DISTRICT_SHELL_DIMENSIONS.borderRadius,
    transition: { duration: 0 },
  },
}

// ============================================================
// SIBLING CAPSULE VARIANTS
// ============================================================

/**
 * Variants for capsules that are NOT selected during morph.
 * They drift outward from the ring center and fade.
 *
 * The drift uses a radial translate away from center.
 * The actual direction depends on each capsule's ring position,
 * so the `driftX` and `driftY` custom properties are set per-capsule
 * via inline style at render time.
 */
export const siblingCapsuleVariants: Variants = {
  idle: {
    x: 0,
    y: 0,
    opacity: 1,
    scale: 1,
    transition: siblingTween,
  },
  drifted: {
    // x and y are set via custom property in the component
    // Fallback values for the variant definition:
    x: 0, // Overridden per-capsule
    y: 0, // Overridden per-capsule
    opacity: 0.15,
    scale: 0.85,
    transition: siblingTween,
  },
}

/**
 * Compute drift vector for a sibling capsule based on its ring position.
 * Each sibling drifts radially outward from the ring center by 120px.
 *
 * @param ringIndex - The capsule's index in the ring (0-5).
 * @returns { x, y } drift offset in pixels.
 */
export function computeSiblingDrift(ringIndex: number): { x: number; y: number } {
  const DRIFT_DISTANCE = 120
  // Ring positions: index 0 at 270deg (12 o'clock), 60deg spacing clockwise
  const angleDeg = 270 + ringIndex * 60
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: Math.cos(angleRad) * DRIFT_DISTANCE,
    y: Math.sin(angleRad) * DRIFT_DISTANCE,
  }
}

// ============================================================
// DISTRICT SHELL VARIANTS
// ============================================================

/**
 * Variants for the district shell container.
 * The shell replaces the capsule content during the morphing phase
 * via AnimatePresence.
 */
export const districtShellVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  enter: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'tween',
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: 'tween',
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

// ============================================================
// STATION CARD VARIANTS
// ============================================================

/**
 * Variants for individual station cards during unfurling.
 * Each card slides up from below with opacity fade.
 * Stagger is applied via the parent container's `staggerChildren`.
 */
export const stationCardVariants: Variants = {
  hidden: {
    y: 20,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'tween',
      duration: 0.3,
      ease: [0, 0, 0.2, 1], // ease-out
    },
  },
  exit: {
    y: 10,
    opacity: 0,
    transition: {
      type: 'tween',
      duration: 0.2,
      ease: [0.4, 0, 1, 1], // ease-in
    },
  },
}

/**
 * Container variants that control station card stagger.
 * Applied to the station list wrapper.
 */
export const stationContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1, // Reverse stagger on exit
    },
  },
}

// ============================================================
// HOOK: useMorphVariants
// ============================================================

/**
 * Resolves the current Framer Motion `animate` target for a capsule
 * based on the morph state machine.
 *
 * @param isSelected - Whether this capsule is the morph target.
 * @param phase - Current morph phase.
 * @param direction - Current morph direction.
 * @param ringIndex - Capsule's position in the ring (for sibling drift).
 * @returns The variant name to pass to `motion.div`'s `animate` prop.
 */
export function useMorphVariants(
  isSelected: boolean,
  phase: MorphPhase,
  direction: MorphDirection,
  ringIndex: number
): {
  animateTarget: string
  driftOffset: { x: number; y: number } | null
} {
  return useMemo(() => {
    // Selected capsule follows the phase directly
    if (isSelected) {
      if (phase === 'idle') return { animateTarget: 'idle', driftOffset: null }
      // Forward and reverse both use the phase name as the variant
      // (variants define the correct values for each phase)
      return { animateTarget: phase, driftOffset: null }
    }

    // Sibling capsules: drift outward during any non-idle phase
    if (phase === 'idle') {
      return { animateTarget: 'idle', driftOffset: null }
    }

    const drift = computeSiblingDrift(ringIndex)
    return { animateTarget: 'drifted', driftOffset: drift }
  }, [isSelected, phase, direction, ringIndex])
}
```

### 4.6 Component: MorphOrchestrator

**File:** `src/components/districts/morph-orchestrator.tsx`

The render-tree component that wires `useMorphChoreography` to the capsule ring and district shell. Rendered inside the `SpatialCanvas`.

```tsx
'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useUIStore, uiSelectors } from '@/stores/ui.store'
import { useMorphChoreography } from '@/hooks/use-morph-choreography'
import { DistrictShell } from './district-shell'
import { CapsuleRing } from './capsule-ring'
import type { CapsuleData, DistrictId } from '@/types/district'
import type { MorphPhase } from '@/types/morph'

interface MorphOrchestratorProps {
  /** Capsule data from the telemetry system. */
  capsules: CapsuleData[]
  /** Whether the user prefers reduced motion. */
  prefersReducedMotion: boolean
  /**
   * Render function for district content.
   * Called with the district ID when the morph reaches the 'unfurling' phase.
   * WS-2.2-2.5 provide the actual station components via this render prop.
   */
  renderDistrictContent?: (districtId: DistrictId) => React.ReactNode
}

/**
 * MorphOrchestrator coordinates the capsule ring and district shell
 * during the morph transition.
 *
 * It is rendered as a direct child of SpatialCanvas, positioned at
 * the capsule ring's world-space origin.
 *
 * Responsibilities:
 * 1. Hosts the capsule ring and passes morph state to each capsule.
 * 2. Manages capsule ref forwarding for position measurement.
 * 3. Renders the DistrictShell via AnimatePresence when morphing.
 * 4. Forwards district content from WS-2.2-2.5 into the shell.
 * 5. Handles click-outside-district for deselection.
 */
export function MorphOrchestrator({
  capsules,
  prefersReducedMotion,
  renderDistrictContent,
}: MorphOrchestratorProps) {
  const capsuleRefs = useRef<Record<DistrictId, React.RefObject<HTMLDivElement | null>>>(
    Object.fromEntries(capsules.map((c) => [c.district.id, { current: null }])) as Record<
      DistrictId,
      React.RefObject<HTMLDivElement | null>
    >
  )

  const { phase, direction, targetId, isMorphing, startMorph, reverseMorph } = useMorphChoreography(
    { prefersReducedMotion }
  )

  // Handle capsule selection
  const handleCapsuleSelect = useCallback(
    (id: DistrictId) => {
      if (phase === 'idle') {
        startMorph(id)
      }
    },
    [phase, startMorph]
  )

  // Show district shell when phase is morphing, unfurling, or settled
  const showDistrictShell =
    targetId !== null &&
    (phase === 'morphing' || phase === 'unfurling' || phase === 'settled') &&
    direction === 'forward'

  // Also show during reverse until morphing phase completes
  const showDistrictShellReverse =
    targetId !== null && direction === 'reverse' && phase === 'unfurling'

  const shouldRenderShell = showDistrictShell || showDistrictShellReverse

  // Show station content during unfurling (forward) or settled
  const showStations =
    targetId !== null &&
    ((direction === 'forward' && (phase === 'unfurling' || phase === 'settled')) ||
      (direction === 'reverse' && phase === 'unfurling'))

  return (
    <>
      {/* Capsule Ring: always rendered, receives morph state for variant resolution */}
      <CapsuleRing
        capsules={capsules}
        selectedId={targetId}
        onSelect={handleCapsuleSelect}
        capsuleRefs={capsuleRefs.current}
        isPanning={false} // Controlled by SpatialViewport's data-panning
        morphPhase={phase}
        morphDirection={direction}
      />

      {/* District Shell: enters during morphing phase, exits during reverse */}
      <AnimatePresence mode="wait">
        {shouldRenderShell && targetId && (
          <DistrictShell
            key={`district-${targetId}`}
            districtId={targetId}
            phase={phase}
            direction={direction}
            onClose={reverseMorph}
            showStations={showStations}
          >
            {showStations && renderDistrictContent?.(targetId)}
          </DistrictShell>
        )}
      </AnimatePresence>
    </>
  )
}
```

### 4.7 Component: DistrictShell

**File:** `src/components/districts/district-shell.tsx`

The expanded container that the capsule morphs into. Hosts station content from WS-2.2-2.5.

```tsx
'use client'

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { StationEntrance } from './station-entrance'
import { districtShellVariants, stationContainerVariants } from '@/hooks/use-morph-variants'
import { DISTRICTS } from '@/types/district'
import { DISTRICT_SHELL_DIMENSIONS } from '@/types/morph'
import type { DistrictId } from '@/types/district'
import type { MorphPhase, MorphDirection } from '@/types/morph'

export interface DistrictShellProps {
  /** Which district this shell represents. */
  districtId: DistrictId
  /** Current morph phase. */
  phase: MorphPhase
  /** Current morph direction. */
  direction: MorphDirection
  /** Callback to close/deselect the district. */
  onClose: () => void
  /** Whether station content should be visible. */
  showStations: boolean
  /** Station content from WS-2.2-2.5 via render prop. */
  children?: ReactNode
}

/**
 * DistrictShell is the expanded container that replaces the capsule
 * during the morph transition.
 *
 * Styling: Active glass material (per VISUAL-DESIGN-SPEC.md 1.7),
 * luminous ember border, 32px border-radius.
 *
 * Layout: Flexbox column with district header + station content area.
 * The header shows the district name. The content area receives
 * station components via children prop.
 *
 * This component is rendered inside AnimatePresence and uses
 * districtShellVariants for enter/exit animations.
 */
export function DistrictShell({
  districtId,
  phase,
  direction,
  onClose,
  showStations,
  children,
}: DistrictShellProps) {
  const district = DISTRICTS.find((d) => d.id === districtId)
  const displayName = district?.displayName ?? districtId

  return (
    <motion.div
      variants={districtShellVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      data-district-shell={districtId}
      data-morph-phase={phase}
      className={cn(
        // Dimensions
        'min-h-[460px] w-[380px]',
        `rounded-[${DISTRICT_SHELL_DIMENSIONS.borderRadius}px]`,
        'p-6',
        // Active glass material
        'bg-white/[0.06]',
        'backdrop-blur-[16px] backdrop-saturate-[130%]',
        'border border-white/[0.10]',
        // Luminous ember border
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_0_1px_0_rgba(224,82,0,0.3)]',
        // Layout
        'flex flex-col gap-4',
        // Containment
        'contain-[layout_style]'
      )}
    >
      {/* District Header */}
      <div className="flex items-center justify-between">
        <h2
          className={cn(
            'font-sans text-[15px] font-semibold',
            'tracking-[0.04em] uppercase',
            'text-[var(--color-text-primary)] opacity-90',
            'leading-[1.2]'
          )}
        >
          {displayName}
        </h2>

        {/* Close button: visible when settled */}
        {phase === 'settled' && (
          <button
            onClick={onClose}
            className={cn(
              'flex h-6 w-6 items-center justify-center',
              'rounded-full',
              'bg-white/[0.04] hover:bg-white/[0.08]',
              'border border-white/[0.06] hover:border-white/[0.12]',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              'transition-all duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-[var(--color-ember-bright)]'
            )}
            aria-label={`Close ${displayName} district`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M1 1L9 9M9 1L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Station Content Area */}
      <motion.div
        variants={stationContainerVariants}
        initial="hidden"
        animate={showStations ? 'visible' : 'hidden'}
        exit="exit"
        className="flex flex-1 flex-col gap-3"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
```

### 4.8 Component: StationEntrance

**File:** `src/components/districts/station-entrance.tsx`

Wrapper for individual station cards that provides staggered entrance/exit animation.

````tsx
'use client'

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { stationCardVariants } from '@/hooks/use-morph-variants'

export interface StationEntranceProps {
  /** Unique key for AnimatePresence tracking. */
  stationId: string
  /** Station content (from WS-2.2-2.5). */
  children: ReactNode
  /** Additional CSS classes for the wrapper. */
  className?: string
}

/**
 * StationEntrance wraps a single station card with staggered
 * entrance/exit animation.
 *
 * The stagger timing is controlled by the parent's
 * stationContainerVariants (staggerChildren: 0.08s).
 *
 * This component is a motion.div that:
 * - Slides up from 20px below with opacity 0 -> 1 on entrance
 * - Slides down 10px with opacity 1 -> 0 on exit
 * - Uses ease-out for entrance, ease-in for exit
 *
 * Each station card rendered by WS-2.2-2.5 should be wrapped
 * in a StationEntrance:
 *
 * ```tsx
 * <StationEntrance stationId="status">
 *   <StatusStation districtId={districtId} />
 * </StationEntrance>
 * ```
 */
export function StationEntrance({ stationId, children, className }: StationEntranceProps) {
  return (
    <motion.div
      key={stationId}
      variants={stationCardVariants}
      data-station={stationId}
      className={className}
    >
      {children}
    </motion.div>
  )
}
````

### 4.9 Hook: `useDistrictPosition`

**File:** `src/hooks/use-district-position.ts`

Computes the world-space position and geometry for a district shell based on the selected capsule's DOM position and the camera state.

```ts
'use client'

import { useMemo } from 'react'
import type { RefObject } from 'react'
import type { DistrictId } from '@/types/district'
import type { DistrictShellGeometry } from '@/types/morph'
import { DISTRICT_SHELL_DIMENSIONS } from '@/types/morph'

/**
 * District world-space positions.
 * These are the positions of the district shell centers in world-space.
 * They match the CameraController.DISTRICT_POSITIONS from WS-1.7.
 *
 * Note: In Phase 1, district positions are derived from capsule ring
 * positions. In Phase 2+, they may be dynamically computed based on
 * content requirements.
 */
const DISTRICT_POSITIONS: Record<DistrictId, { x: number; y: number }> = {
  'agent-builder': { x: -260, y: 150 },
  'tarva-chat': { x: 260, y: 150 },
  'project-room': { x: 300, y: -150 },
  'tarva-core': { x: 0, y: -300 },
  'tarva-erp': { x: -300, y: -150 },
  'tarva-code': { x: 260, y: -260 },
}

/**
 * Compute the world-space geometry for a district shell.
 *
 * The district shell is centered on the district's world-space position,
 * offset so that the shell center aligns with where the camera flies to.
 *
 * @param districtId - The district to compute geometry for.
 * @returns World-space position and dimensions for the DistrictShell.
 */
export function useDistrictPosition(districtId: DistrictId | null): DistrictShellGeometry | null {
  return useMemo(() => {
    if (!districtId) return null

    const pos = DISTRICT_POSITIONS[districtId]
    if (!pos) return null

    return {
      worldX: pos.x - DISTRICT_SHELL_DIMENSIONS.width / 2,
      worldY: pos.y - DISTRICT_SHELL_DIMENSIONS.height / 2,
      width: DISTRICT_SHELL_DIMENSIONS.width,
      height: DISTRICT_SHELL_DIMENSIONS.height,
    }
  }, [districtId])
}
```

### 4.10 Stylesheet: `morph.css`

**File:** `src/styles/morph.css`

CSS for ambient-tier morph animations. Keeps CSS `@keyframes` separate from Framer Motion choreography per AD-3.

```css
/* =============================================================
   MORPH CHOREOGRAPHY -- AMBIENT TIER ANIMATIONS
   Choreography-tier animations use Framer Motion in components.
   This file handles CSS-only effects during the morph sequence.
   ============================================================= */

/* --- Glow intensification during focusing phase --- */
[data-morph-phase='focusing'] [data-selected='true'] {
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
    0 0 40px rgba(224, 82, 0, 0.22),
    0 0 16px rgba(255, 119, 60, 0.35),
    0 0 4px rgba(255, 170, 112, 0.55);
  transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* --- Sibling capsule glow reduction during morph --- */
[data-morph-phase='focusing'] [data-selected='false'],
[data-morph-phase='morphing'] [data-selected='false'],
[data-morph-phase='unfurling'] [data-selected='false'],
[data-morph-phase='settled'] [data-selected='false'] {
  box-shadow: none;
  backdrop-filter: none;
  transition:
    box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1),
    backdrop-filter 200ms ease-out;
}

/* --- District shell luminous border pulse on settle --- */
@keyframes shell-settle-pulse {
  0% {
    box-shadow:
      inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
      0 0 1px 0 rgba(224, 82, 0, 0.3),
      0 0 24px rgba(224, 82, 0, 0.15);
  }
  50% {
    box-shadow:
      inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
      0 0 1px 0 rgba(224, 82, 0, 0.3),
      0 0 40px rgba(224, 82, 0, 0.22),
      0 0 8px rgba(255, 119, 60, 0.18);
  }
  100% {
    box-shadow:
      inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
      0 0 1px 0 rgba(224, 82, 0, 0.3),
      0 0 24px rgba(224, 82, 0, 0.15);
  }
}

[data-morph-phase='settled'] [data-district-shell] {
  animation: shell-settle-pulse 4s ease-in-out infinite;
  animation-delay: 1s; /* Wait for settle before pulsing */
}

/* --- Disable morph ambient effects during pan --- */
[data-panning='true'] [data-district-shell] {
  animation: none;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.03),
    0 0 8px rgba(224, 82, 0, 0.1);
  backdrop-filter: none;
}

/* --- Reduced motion: skip all morph animations --- */
@media (prefers-reduced-motion: reduce) {
  [data-district-shell] {
    animation: none !important;
  }

  [data-morph-phase] [data-selected='true'],
  [data-morph-phase] [data-selected='false'] {
    transition: none !important;
  }
}
```

### 4.11 CapsuleRing Props Extension

**Modification to:** `src/components/districts/capsule-ring.tsx` (WS-1.2)

The existing `CapsuleRingProps` interface must be extended with morph state props.

```ts
import type { MorphPhase, MorphDirection } from '@/types/morph'

export interface CapsuleRingProps {
  /** Array of exactly 6 capsule data objects, one per district */
  capsules: CapsuleData[]
  /** Currently selected district (null = none selected) */
  selectedId: DistrictId | null
  /** Callback when a capsule is clicked */
  onSelect: (id: DistrictId) => void
  /** Ref map for morph choreography hand-off (WS-2.1) */
  capsuleRefs?: Record<DistrictId, RefObject<HTMLDivElement | null>>
  /** Whether the ZUI viewport is actively panning */
  isPanning?: boolean

  // --- WS-2.1 additions ---

  /** Current morph phase. Controls capsule variant resolution. */
  morphPhase?: MorphPhase
  /** Current morph direction. Controls variant selection during reverse. */
  morphDirection?: MorphDirection
}
```

Each `DistrictCapsule` within the ring must resolve its `animate` target using `useMorphVariants`:

```tsx
// Inside CapsuleRing, when rendering each capsule:
import { useMorphVariants, computeSiblingDrift } from '@/hooks/use-morph-variants'

// For each capsule in the ring:
const isSelected = capsule.district.id === selectedId
const { animateTarget, driftOffset } = useMorphVariants(
  isSelected,
  morphPhase ?? 'idle',
  morphDirection ?? 'forward',
  capsule.district.ringIndex,
)

// Pass to DistrictCapsule:
<DistrictCapsule
  data={capsule}
  isSelected={isSelected}
  hasSelection={selectedId !== null}
  onSelect={onSelect}
  style={{ left: ..., top: ... }}
  morphAnimateTarget={animateTarget}
  morphDriftOffset={driftOffset}
  data-selected={isSelected ? 'true' : 'false'}
/>
```

### 4.12 Direct Load from URL

**Integration point:** `src/app/(launch)/page.tsx`

On initial page load, if the URL contains `?district={id}`, the morph orchestrator should skip animation and render directly in the `settled` state.

```ts
// Inside the (launch) page component:
import { useSearchParams } from 'next/navigation'
import { useUIStore } from '@/stores/ui.store'
import { DISTRICTS } from '@/types/district'

function useInitialDistrictFromUrl() {
  const searchParams = useSearchParams()
  const startMorph = useUIStore((s) => s.startMorph)
  const setMorphPhase = useUIStore((s) => s.setMorphPhase)
  const phase = useUIStore((s) => s.morph.phase)

  useEffect(() => {
    const districtParam = searchParams.get('district')
    if (districtParam && phase === 'idle' && DISTRICTS.some((d) => d.id === districtParam)) {
      // Skip animation: set directly to settled
      startMorph(districtParam as DistrictId)
      // Immediately advance through all phases
      setMorphPhase('settled')
      // Position camera at district center (no animation)
      const pos = DISTRICT_WORLD_POSITIONS[districtParam as DistrictId]
      if (pos) {
        useCameraStore.getState().setCamera({
          offsetX: pos.worldX,
          offsetY: pos.worldY,
          zoom: DISTRICT_ZOOM,
        })
      }
    }
  }, []) // Run once on mount
}
```

---

## 5. Acceptance Criteria

### Functional

| #   | Criterion                                                                                                                                    | Verification                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| F1  | Clicking a capsule in idle state starts forward morph: phase transitions from `idle` -> `focusing` -> `morphing` -> `unfurling` -> `settled` | Integration test asserting phase sequence via UI store subscription     |
| F2  | During `focusing` phase, camera springs to the selected district center at Z2 zoom (1.0)                                                     | Assert `useCameraStore.getState()` reaches target position within 500ms |
| F3  | During `focusing` phase, selected capsule scales to 1.3x with spring physics                                                                 | Framer Motion `animate` prop assertion                                  |
| F4  | During `focusing` phase, sibling capsules drift outward by 120px along their radial axis and fade to opacity 0.15                            | Framer Motion variant assertion for each sibling                        |
| F5  | During `morphing` phase, selected capsule scales to 2.0x (380x460px equivalent) with border-radius transitioning from 28px to 32px           | Computed style verification                                             |
| F6  | During `unfurling` phase, station cards enter with staggered animation (80ms between cards, 300ms duration each)                             | AnimatePresence integration test                                        |
| F7  | In `settled` state, URL updates to include `?district={districtId}`                                                                          | URL assertion after settle                                              |
| F8  | In `settled` state, station interactions are enabled (buttons, links within stations are clickable)                                          | Click handler test on station content                                   |
| F9  | Pressing Escape in `settled` state triggers reverse morph                                                                                    | Keyboard event integration test                                         |
| F10 | Reverse morph transitions: `settled` -> `unfurling` (stations exit) -> `morphing` (shell shrinks) -> `focusing` (camera returns) -> `idle`   | Integration test asserting reverse phase sequence                       |
| F11 | After reverse morph completes, `selectedDistrictId` is null, morph state is fully reset, URL `?district` param is removed                    | State assertion + URL verification                                      |
| F12 | Clicking the hub center glyph during `settled` state triggers reverse morph                                                                  | Click handler integration test                                          |
| F13 | Loading the page with `?district=agent-builder` renders directly in `settled` state without animation                                        | Snapshot test of initial render                                         |
| F14 | Clicking a capsule during active morph (phase is not `idle`) is ignored                                                                      | Guard clause test: click during `focusing` does not start new morph     |
| F15 | Calling `reverseMorph()` when phase is not `settled` is ignored                                                                              | Guard clause test                                                       |
| F16 | Total morph duration (focusing + morphing + unfurling) does not exceed 900ms for forward flow                                                | Timer assertion                                                         |

### Accessibility

| #   | Criterion                                                                                                                                          | Verification                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| A1  | `prefers-reduced-motion: reduce` causes instant state changes: selecting a capsule immediately renders the settled district view without animation | Media query test with `matchMedia` mock |
| A2  | District shell close button has `aria-label` including district name                                                                               | DOM inspection                          |
| A3  | Escape key deselection works from keyboard focus within the district shell                                                                         | Keyboard navigation test                |
| A4  | Focus moves to the district shell heading when morph reaches `settled`                                                                             | Focus management test                   |
| A5  | Focus returns to the previously selected capsule when reverse morph completes                                                                      | Focus restoration test                  |
| A6  | `data-morph-phase` attribute on relevant containers provides programmatic state for assistive tools                                                | DOM attribute assertion                 |

### Performance

| #   | Criterion                                                                                                          | Verification                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| P1  | All morph animations use `transform` and `opacity` only, never `width`, `height`, `top`, `left`                    | Code review + Chrome DevTools Layers panel                                                      |
| P2  | No layout thrashing during morph: no forced reflows between frame updates                                          | Chrome DevTools Performance panel recording of full morph cycle                                 |
| P3  | Sibling capsule `backdrop-filter` is disabled during morph phases (not just during pan)                            | CSS rule verification: `[data-morph-phase] [data-selected="false"] { backdrop-filter: none }`   |
| P4  | District shell ambient glow pulse pauses during active pan                                                         | CSS rule verification: `[data-panning="true"] [data-district-shell] { animation: none }`        |
| P5  | Timer cleanup on unmount: no orphaned `setTimeout` handlers after component unmount or rapid selection/deselection | Test: mount orchestrator, start morph, unmount mid-morph, verify no state updates after unmount |
| P6  | Morph sustains 60fps throughout the full sequence on a mid-range laptop                                            | Manual profiling with Chrome DevTools Performance panel                                         |
| P7  | No React re-renders on non-selected capsules during camera flyTo animation                                         | React DevTools Profiler during morph                                                            |

### Design Fidelity

| #   | Criterion                                                                                                                                                                           | Verification                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| D1  | Forward morph timing matches AD-4: focusing 300ms, morphing 200ms, unfurling 400ms                                                                                                  | Timer measurement                     |
| D2  | Selected capsule glow during focusing matches VISUAL-DESIGN-SPEC.md glow-bright: `0 0 40px rgba(224,82,0,0.18)`, `0 0 16px rgba(255,119,60,0.30)`, `0 0 4px rgba(255,170,112,0.50)` | Computed box-shadow inspection        |
| D3  | Sibling capsules fade to opacity 0.15 (not 0.3 -- deeper fade during morph vs hover dimming)                                                                                        | Computed opacity assertion            |
| D4  | District shell uses active glass material: `bg white/0.06`, `blur 16px`, `saturate 130%`, `border white/0.10`                                                                       | CSS inspection                        |
| D5  | District shell dimensions: 380x460px, 32px border-radius, 24px padding                                                                                                              | DOM measurement                       |
| D6  | Station cards stagger at 80ms intervals during entrance                                                                                                                             | Animation timeline measurement        |
| D7  | Station cards slide from 20px below with opacity 0 -> 1                                                                                                                             | Framer Motion variant value assertion |
| D8  | District header typography: 15px, Geist Sans, font-weight 600, tracking 0.04em, uppercase                                                                                           | Computed style verification           |
| D9  | Shell settle pulse: 4s cycle, glow oscillates between 24px and 40px outer radius, 1s delay before first pulse                                                                       | Animation timeline verification       |
| D10 | Close button: 24px circle, white/0.04 bg, white/0.06 border, centered X icon                                                                                                        | Visual inspection                     |

---

## 6. Decisions Made

| #   | Decision                                                                                                                                                                                | Rationale                                                                                                                                                                                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **MorphPhase type updated** from WS-0.1 skeleton (`'idle' \| 'zooming' \| 'morphing' \| 'settling'`) to AD-4-aligned (`'idle' \| 'focusing' \| 'morphing' \| 'unfurling' \| 'settled'`) | The AD-4 spec uses 5 phases with specific semantic meaning. The skeleton's `zooming` and `settling` do not capture the full choreography. `focusing` emphasizes the camera + capsule coordination. `unfurling` is the station entrance. `settled` implies a stable rest state, not a transition.                                                                                         |
| D2  | **setTimeout chaining for phase progression**, not rAF or Framer Motion `onAnimationComplete`                                                                                           | Phase durations are design-intentional values (300ms, 200ms, 400ms) that should not drift with frame timing. The camera flyTo runs concurrently on rAF. If we chained on animation completion, the morph would stall if the spring overshoots. Timers give predictable total duration (900ms) regardless of spring behavior.                                                             |
| D3  | **Uniform scale (2.0x) for capsule-to-district expansion**, not separate scaleX/scaleY                                                                                                  | The capsule (192x228) and district shell (380x460) have nearly identical aspect ratios (1:1.19 vs 1:1.21). A uniform 2.0x scale produces 384x456 -- close enough to the 380x460 target. Non-uniform scale distorts border-radius and text. The 4px width difference and 4px height difference are imperceptible.                                                                         |
| D4  | **Sibling drift direction is radial from center**, not uniform direction                                                                                                                | Each capsule sits at a different angle in the ring. Drifting all capsules in the same direction (e.g., all left) would look unbalanced. Radial outward drift maintains the ring symmetry and creates a natural "parting" gesture around the selected capsule.                                                                                                                            |
| D5  | **Sibling opacity fades to 0.15 during morph** (deeper than the 0.3 hover-dim)                                                                                                          | During morph, the sibling capsules should nearly vanish to focus attention on the expanding district. The hover dim (0.3) is for a subtle "one is selected" signal. The morph dim (0.15) removes them from the visual hierarchy.                                                                                                                                                         |
| D6  | **Reverse flow starts at `unfurling` phase** (collapsing stations first), not `settled`                                                                                                 | Logically, the reverse mirrors the forward: the last thing added (stations) is the first thing removed. Starting reverse at `unfurling` means station exit animations play, then the shell contracts, then the camera returns. This creates a natural "folding" sensation.                                                                                                               |
| D7  | **Reverse unfurling duration is 75% of forward** (300ms instead of 400ms)                                                                                                               | Exit animations should feel slightly faster than entrance to maintain momentum. A full 400ms exit makes the reverse feel sluggish. 75% (300ms) keeps it crisp.                                                                                                                                                                                                                           |
| D8  | **District shell is a separate component, not a scaled-up capsule**                                                                                                                     | Although the visual transition suggests the capsule "becomes" the district, the DOM structure is fundamentally different (capsule has telemetry rows; district has station cards). AnimatePresence swap during the `morphing` phase is cleaner than trying to morph the capsule's internal content in-place. The scale animation on the selected capsule provides the visual continuity. |
| D9  | **URL sync uses `history.replaceState`**, not Next.js router                                                                                                                            | Same approach as the camera URL sync in WS-1.1. `router.push` or `router.replace` would trigger React re-renders and potentially interfere with the morph animation. `replaceState` is silent.                                                                                                                                                                                           |
| D10 | **Direct load with `?district=` skips animation**                                                                                                                                       | A user arriving via direct URL (bookmark, shared link) should not wait 900ms for the morph to play. They want to see the district immediately. The state machine still transitions through the phases (for consistency) but with 0ms timers.                                                                                                                                             |
| D11 | **`renderDistrictContent` render prop pattern**, not direct import of district components                                                                                               | The morph orchestrator should not know about Agent Builder, Tarva Chat, etc. WS-2.2-2.5 provide station content via a render prop, keeping the morph system domain-agnostic. This also enables lazy loading of district content.                                                                                                                                                         |
| D12 | **Morph spring config (stiffness: 200, damping: 28)** is tighter than default flyTo spring (170, 26)                                                                                    | The morph camera movement should feel more responsive than a general flyTo (minimap click, Home key). The selection is an intentional, high-commitment action -- the camera should snap to the target with confidence.                                                                                                                                                                   |

---

## 7. Open Questions

| #   | Question                                                                                                                                                             | Impact                                                                         | Proposed Resolution                                                                                                                                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Should the capsule scale animation use the capsule's existing Framer Motion variants (extending `idle/hover/selected/dimmed` from WS-1.2) or a parallel variant set? | Medium -- affects how WS-1.2 capsule component evolves.                        | Use a parallel variant set defined in `useMorphVariants`. The WS-1.2 variants handle hover/selection UI feedback. The morph variants handle the spatial transition. The `MorphOrchestrator` overrides the capsule's `animate` prop when morph is active, taking control from the capsule's internal variant resolution.                                               |
| Q2  | Where exactly should the `DistrictShell` be positioned in world-space? At the capsule's original position? At the camera target center?                              | High -- affects the visual continuity of the morph.                            | Position the district shell at the same world-space coordinates as the camera's flyTo target (district center from `DISTRICT_POSITIONS`). The selected capsule visually "moves" to this position via the camera pan (the capsule doesn't physically translate -- the camera moves so the capsule appears centered). The district shell then renders at that position. |
| Q3  | Should clicking outside the district shell (but inside the SpatialViewport) trigger deselection?                                                                     | Low -- alternative deselection paths exist (Escape, close button, breadcrumb). | Yes, but with a guard: only if the click target is the `SpatialCanvas` background itself, not any child element. Implement via a click handler on `SpatialCanvas` that checks `event.target === event.currentTarget`.                                                                                                                                                 |
| Q4  | How should the morph interact with keyboard navigation? Should Tab cycle through station cards?                                                                      | Medium -- affects accessibility.                                               | Yes. When `settled`, Tab should cycle through interactive elements within the district shell (close button, then station actions). Shift+Tab moves backward. Escape closes the district. Focus trapping is not needed (user can Tab out and focus other viewport elements).                                                                                           |
| Q5  | Should the morph be cancellable mid-animation? (e.g., user presses Escape during `focusing` phase)                                                                   | Low -- edge case, but affects perceived responsiveness.                        | No. Allow the morph to complete its current phase, then honor the cancellation. Mid-phase cancellation creates jarring visual artifacts (half-scaled capsule, partially faded siblings). If the user presses Escape during `focusing`, queue the reverse to start after the current forward completes to `settled`.                                                   |
| Q6  | How do district content lazy-loading and morph timing interact? If station content takes 200ms to load, does the unfurling phase wait?                               | Medium -- affects perceived performance.                                       | No. The unfurling phase runs on a fixed 400ms timer regardless of content load state. Station components should render a skeleton/loading state if their data is not yet available. This keeps the morph timing predictable and prevents slow API responses from blocking the spatial transition.                                                                     |

---

## 8. Risk Register

| #   | Risk                                                                                                                                                                                                  | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Scale-based morph causes text blur** -- scaling a capsule 2x makes 16px text render at 32px equivalent with scaling artifacts                                                                       | High       | Medium | The capsule content is swapped out during the `morphing` phase via AnimatePresence. The scaled capsule only shows for 200ms (the morphing duration), and during that time its content is transitioning to opacity 0. The district shell renders with native (unscaled) text. Net: users see blurry text for at most 200ms during the crossfade. |
| R2  | **Timer-based phase progression desynchronizes from camera animation** -- if the spring flyTo takes longer than 300ms (focusing duration), the morphing phase begins while the camera is still moving | Medium     | Low    | Acceptable. The camera spring settles independently. The morph timing (300+200+400 = 900ms) is the visual choreography. If the camera takes 350ms instead of 300ms, the last 50ms of camera motion overlaps with the morphing phase, which actually looks natural (the shell begins expanding as the camera approaches).                        |
| R3  | **Rapid click/Escape sequences corrupt morph state** -- user clicks capsule, immediately presses Escape, clicks another capsule                                                                       | Medium     | High   | Guard clauses in `startMorph` (only from `idle`) and `reverseMorph` (only from `settled`) prevent invalid transitions. Timer cleanup on phase change prevents orphaned timers. Integration test covering rapid selection/deselection sequence.                                                                                                  |
| R4  | **Framer Motion `animate` conflicts with CSS transitions on the same properties** -- `box-shadow` transitions in `morph.css` may fight Framer Motion's `animate` on the same element                  | Medium     | Medium | Strict separation: Framer Motion handles `scale`, `opacity`, `x`, `y`, `borderRadius`. CSS handles `box-shadow`, `backdrop-filter`. These property sets do not overlap. The `transition` CSS property in `morph.css` only targets `box-shadow` and `backdrop-filter`.                                                                           |
| R5  | **AnimatePresence content swap flickers** -- brief flash of empty content between capsule content exit and district content enter                                                                     | Medium     | Medium | Use `mode="wait"` on `AnimatePresence` so exit completes before enter begins. The 200ms morphing phase provides enough time for the crossfade. Test with slow React DevTools to verify no flash.                                                                                                                                                |
| R6  | **District positions from WS-1.7 change after this workstream is implemented**                                                                                                                        | Low        | Medium | District positions are imported from a shared constant (not duplicated). If WS-1.7 updates positions, the morph and camera automatically pick up the new values. Add a comment in the constants file noting that morph and camera share these values.                                                                                           |
| R7  | **`prefers-reduced-motion` users see jarring instant transitions** -- no animation at all may feel broken rather than accessible                                                                      | Low        | Low    | The reduced-motion path still runs through all phases, but with 0ms timers. The state machine transitions occur in the same order, just instantly. The visual result is a clean cut from atrium to district view. This is the expected behavior per WCAG guidance.                                                                              |
| R8  | **Large district content (many stations) causes layout shift during unfurling**                                                                                                                       | Medium     | Low    | The district shell has `min-h-[460px]` to prevent collapse during station entrance. Station cards use fixed or min-height dimensions. If content exceeds the shell height, the shell grows with a CSS transition, not a Framer Motion animation (to avoid competing with the unfurl stagger).                                                   |
| R9  | **CSS `contain` on the district shell clips overflow during glow animation**                                                                                                                          | Low        | Medium | Use `contain: layout style` (not `contain: paint`) on the district shell. The `paint` containment clips box-shadow glow that bleeds outside the element bounds. `layout style` still provides isolation benefits without clipping visual effects.                                                                                               |
| R10 | **Multiple `useMorphChoreography` instances if the orchestrator unmounts/remounts**                                                                                                                   | Low        | High   | The orchestration hook reads from and writes to the Zustand store, which is a singleton. Even if the component remounts, the store state is preserved. Timer cleanup in the `useEffect` return prevents duplicate timers. The hook guards against starting a morph when one is already in progress.                                             |
