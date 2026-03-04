# WS-1.6: Ambient Effects Layer

> **Workstream ID:** WS-1.6
> **Phase:** 1 -- Spatial Core + Login
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1 (project scaffolding), WS-0.2 (design tokens), WS-0.3 (backdrop-filter findings), WS-1.1 (pan-pause events)
> **Blocks:** WS-3.7 (Attention Choreography), WS-4.4 (Visual Polish)
> **Resolves:** None

---

## 1. Objective

Implement the full ambient visual effects layer that gives Tarva Launch its "living instrument" character -- the barely-perceptible motion, glow, and texture that makes the interface feel powered-on and breathing rather than static. This workstream delivers six discrete effect components (ParticleField, HeartbeatPulse, GlowBreathing, GridPulse, ScanlineOverlay, FilmGrain), a shared `usePanPause` hook that pauses all ambient motion during active camera pan, and complete `prefers-reduced-motion` accessibility support.

Every effect in this workstream belongs to the **Ambient tier** of the AD-3 Three-Tier Animation Architecture: CSS `@keyframes` and Canvas `requestAnimationFrame` loops that run on the compositor thread / off-main-thread, incurring zero React reconciliation cost. These effects must never interfere with the Physics tier (camera momentum, WS-1.1) or the Choreography tier (Framer Motion morph transitions, WS-2.1).

**Success looks like:** The Launch Atrium feels alive -- ember particles drift lazily across the void, health bars pulse with a heartbeat rhythm, the central hub breathes with a soft glow, the dot grid ripples outward every 12 seconds, scanlines sweep on state changes, and a near-imperceptible film grain adds analog warmth. All of this runs at 60fps during pan/zoom, pauses gracefully during active interaction, and disappears entirely for users who prefer reduced motion.

---

## 2. Scope

### In Scope

- **ParticleField component** -- HTML5 Canvas 2D overlay rendering 18 ember-colored particles with Brownian drift, per-particle opacity oscillation, size-based speed distribution, and 0.3x parallax offset relative to camera position.
- **HeartbeatPulse component** -- CSS `@keyframes` animation applied to capsule health indicator bars. Pulses opacity 0.35 to 0.55 and scaleY 1.0 to 1.8 on a 7s cycle with configurable stagger delay per capsule instance.
- **GlowBreathing component** -- CSS `@keyframes` animation applied to the central hub glyph. Oscillates `box-shadow` between two 2-layer glow intensities on a 5s `ease-in-out` cycle.
- **GridPulse component** -- CSS-driven full-viewport overlay. Renders a 48px dot grid at base opacity 0.015 with a radial wave that expands from the hub center every 12s, peaking at opacity 0.04.
- **ScanlineOverlay component** -- Imperative-trigger CSS animation. On activation, sweeps 1 primary line + 2 trailing ghost lines top-to-bottom in 350ms. Triggered by state change events only (capsule selection, district transition, receipt stamp, auth latch).
- **FilmGrain component** -- Static SVG `feTurbulence` filter overlay at `mix-blend-mode: overlay`, opacity 0.035. No animation -- purely textural.
- **`usePanPause` hook** -- Subscribes to the camera store's `isPanning` state (emitted by WS-1.1). Returns a `paused` boolean that becomes `true` immediately on pan-start and reverts to `false` after 150ms of stillness following pan-end. All ambient components consume this hook.
- **`prefers-reduced-motion` support** -- When the user's OS requests reduced motion, all animations are disabled: particles render at static initial positions, heartbeat/breathing/grid-pulse keyframes are suppressed, scanlines are suppressed, and film grain remains (it is already static). Uses the `useReducedMotion` hook from `@tarva/ui/motion`.
- **Barrel export** -- `src/components/ambient/index.ts` re-exports all six components for clean imports.
- **CSS keyframe definitions** -- A dedicated `ambient-effects.css` file containing all `@keyframes` rules, imported by the relevant components.

### Out of Scope

- **Capsule component itself** -- HeartbeatPulse provides only the animated health bar indicator. The capsule shell, layout, hover states, and selection states are WS-1.2 (Launch Atrium).
- **Hub center glyph/logo** -- GlowBreathing provides only the breathing animation wrapper. The actual logo/glyph content is WS-1.2.
- **Background dot grid rendering** -- GridPulse handles the pulsing wave overlay. The static dot grid background (the always-visible dots at 0.015 opacity) is part of the spatial canvas background in WS-1.1 or WS-1.2. GridPulse layers the radial wave on top.
- **Morph choreography** -- Scanline sweep during capsule selection is triggered by WS-2.1 (Morph Choreography). This workstream provides the ScanlineOverlay component; WS-2.1 calls it.
- **Attention choreography** -- WS-3.7 will throttle ambient effects based on system health (healthy = calm/full effects, anomaly = reduced). This workstream provides the pause/resume API that WS-3.7 will consume.
- **WebGL/R3F fallback** -- If CSS/Canvas effects prove insufficient, the R3F upgrade path is a separate decision (AD-8). Not addressed here.
- **Sound design** -- No audio accompanies ambient effects.
- **Mobile/touch optimization** -- Desktop mouse/trackpad only per project constraints.

---

## 3. Input Dependencies

| Dependency                 | Source         | What It Provides                                                                                                                                                    | Status                                    |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| WS-0.1 Project Scaffolding | Phase 0        | Next.js 16 project with `src/components/ambient/` directory, TypeScript strict mode, Tailwind v4, `@tarva/ui` installed                                             | Required                                  |
| WS-0.2 Design Tokens Setup | Phase 0        | Spatial CSS custom properties (`--color-ember`, `--duration-ambient-*`, `--ease-default`, `--opacity-ambient-*`, `--glow-ember-*`), Tailwind `@theme` registration  | Required                                  |
| WS-0.3 ZUI Tech Spike      | Phase 0        | Backdrop-filter performance findings, `data-panning` attribute pattern, pan-pause mitigation approach, 60fps validation with particles                              | Required (findings inform implementation) |
| WS-1.1 ZUI Engine          | Phase 1        | Camera store with `isPanning` state, `subscribe()` access for parallax reads, `data-panning` attribute on the canvas container, pan-start/pan-end state transitions | Required (provides the pan-pause signal)  |
| `@tarva/ui` v1.0.0         | npm package    | `useReducedMotion` hook from `@tarva/ui/motion`                                                                                                                     | Available                                 |
| VISUAL-DESIGN-SPEC.md      | Discovery docs | Canonical values for every animation property (Section 5.1-5.8, Section 6.1 tokens)                                                                                 | Available (read-only reference)           |

---

## 4. Deliverables

### 4.1 File: `src/components/ambient/ambient-effects.css`

All CSS `@keyframes` definitions consumed by ambient effect components. Imported once in the ambient barrel or in individual component files.

**Exact file contents:**

```css
/* =================================================================
   Tarva Launch -- Ambient Effects Keyframes
   =================================================================
   Source: VISUAL-DESIGN-SPEC.md Sections 5.1-5.6
   Tier: Ambient (AD-3) -- compositor thread, zero main-thread cost.
   All keyframes reference design tokens from spatial-tokens.css.
   ================================================================= */

/* -----------------------------------------------------------------
   5.2 Heartbeat Pulse
   Applied to capsule health indicator bars.
   Cycle: 7s. Sharp rise (0-12%), slow fall (12-30%), rest (30-100%).
   Per-capsule stagger via --heartbeat-delay CSS variable.
   ----------------------------------------------------------------- */
@keyframes heartbeat {
  0%,
  100% {
    opacity: 0.35;
    transform: scaleY(1);
  }
  12% {
    opacity: 0.55;
    transform: scaleY(1.8);
  }
  30% {
    opacity: 0.4;
    transform: scaleY(1.1);
  }
}

/* -----------------------------------------------------------------
   5.3 Launch Center Glow Breathing
   Applied to the central hub glyph.
   Cycle: 5s. Smooth sine-wave glow oscillation.
   Uses 2-layer box-shadow for natural light falloff.
   ----------------------------------------------------------------- */
@keyframes breathe {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(224, 82, 0, 0.06),
      0 0 8px rgba(224, 82, 0, 0.1);
  }
  50% {
    box-shadow:
      0 0 48px rgba(224, 82, 0, 0.14),
      0 0 16px rgba(224, 82, 0, 0.22);
  }
}

/* -----------------------------------------------------------------
   5.4 Grid Pulse
   Radial wave expanding from hub center.
   Cycle: 12s. background-size animates to simulate expansion.
   The overlay fades in, expands, then fades out.
   ----------------------------------------------------------------- */
@keyframes grid-pulse {
  0% {
    opacity: 0;
    background-size: 0% 0%;
  }
  5% {
    opacity: 1;
    background-size: 10% 10%;
  }
  40% {
    opacity: 0.6;
    background-size: 200% 200%;
  }
  100% {
    opacity: 0;
    background-size: 400% 400%;
  }
}

/* -----------------------------------------------------------------
   5.5 Scanline Sweep
   Triggered on state change events. Top-to-bottom traversal.
   Duration: 350ms. --scan-height set by component at runtime.
   ----------------------------------------------------------------- */
@keyframes scan {
  0% {
    transform: translateY(-2px);
  }
  100% {
    transform: translateY(var(--scan-height, 228px));
  }
}

/* -----------------------------------------------------------------
   Reduced motion: disable all ambient keyframes.
   Film grain is static and remains unaffected.
   ----------------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .ambient-heartbeat,
  .ambient-breathe,
  .ambient-grid-pulse,
  .ambient-scanline {
    animation: none !important;
  }
}
```

---

### 4.2 Hook: `usePanPause` (imported from WS-1.1)

> **NOTE:** This hook is OWNED by WS-1.1 (ZUI Engine) and defined at `src/hooks/use-pan-pause.ts`. WS-1.6 imports and consumes it — it does NOT define it. The implementation below is shown for reference only. The canonical API returns `{ isPanActive: boolean }` (WS-1.1's naming). All ambient effect components in this SOW use `isPanActive` from this hook.

**Original section title:** File: `src/hooks/use-pan-pause.ts`

Hook that bridges the camera store's panning state into a debounced `paused` signal consumed by all ambient effect components. The hook returns `true` immediately when panning begins and reverts to `false` only after 150ms of stillness following pan-end.

**Contract with WS-1.1:** This hook expects the camera store (from `@/stores/camera.store.ts`) to expose an `isPanning` boolean. WS-1.1 sets `isPanning = true` on pointer-down + move (pan-start) and `isPanning = false` on pointer-up (pan-end). This hook adds the 150ms settle debounce on top.

**Exact file contents:**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useCameraStore } from '@/stores/camera.store'

/**
 * Debounced pan-pause signal for ambient effects.
 *
 * Returns `true` immediately when camera panning begins.
 * Returns `false` after 150ms of stillness following pan-end.
 *
 * All ambient effects (particles, heartbeat, breathing, grid pulse)
 * consume this hook to pause during active camera interaction,
 * per AD-3 and VISUAL-DESIGN-SPEC.md Section 5.7.
 *
 * @returns {{ paused: boolean }} Whether ambient effects should be paused.
 */
export function usePanPause(): { paused: boolean } {
  const isPanning = useCameraStore((state) => state.isPanning)
  const [paused, setPaused] = useState(false)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isPanning) {
      // Immediately pause on pan-start
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current)
        settleTimerRef.current = null
      }
      setPaused(true)
    } else {
      // Debounce resume: wait 150ms of stillness before unpausing
      settleTimerRef.current = setTimeout(() => {
        setPaused(false)
        settleTimerRef.current = null
      }, 150)
    }

    return () => {
      if (settleTimerRef.current !== null) {
        clearTimeout(settleTimerRef.current)
      }
    }
  }, [isPanning])

  return { paused }
}
```

**Camera store contract note:** WS-0.1 defines the camera store skeleton without `isPanning`. WS-1.1 will add the following to `camera.store.ts`:

```typescript
interface CameraState {
  // ... existing fields ...
  isPanning: boolean
  setIsPanning: (panning: boolean) => void
}
```

Until WS-1.1 delivers this, the `usePanPause` hook will read `undefined` for `isPanning`, which coerces to `false` (effects remain unpaused). This is the correct default -- effects animate freely until the ZUI engine starts reporting pan state.

---

### 4.3 File: `src/components/ambient/ParticleField.tsx`

The most complex ambient effect. Renders 18 ember-colored particles on an HTML5 Canvas overlay using `requestAnimationFrame`. Implements Brownian drift, per-particle opacity oscillation, size-based speed distribution, and 0.3x parallax relative to camera offset.

**Exact file contents:**

```tsx
'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useCameraStore } from '@/stores/camera.store'
import { useReducedMotion } from '@tarva/ui/motion'
import { usePanPause } from '@/hooks/use-pan-pause'

/* -----------------------------------------------------------------
   Constants from VISUAL-DESIGN-SPEC.md Section 5.1
   ----------------------------------------------------------------- */

/** Total particle count. Spec: 18 (15-20 range). */
const PARTICLE_COUNT = 18

/** Ember color in RGB components. Spec: --color-ember (#e05200). */
const EMBER_R = 224
const EMBER_G = 82
const EMBER_B = 0

/**
 * Size distribution. Spec:
 * - 60% at 1.5px (indices 0-10)
 * - 25% at 2.5px (indices 11-14)
 * - 15% at 4px   (indices 15-17)
 */
const SIZE_DISTRIBUTION: number[] = [
  1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 2.5, 2.5, 2.5, 2.5, 4.0, 4.0, 4.0,
]

/** Opacity range. Spec: 0.04 to 0.20. */
const OPACITY_MIN = 0.04
const OPACITY_MAX = 0.2

/** Drift speed range in px/sec. Spec: 0.3 to 1.5. Larger = slower. */
const DRIFT_SPEED_MIN = 0.3
const DRIFT_SPEED_MAX = 1.5

/** Opacity oscillation period range in seconds. Spec: 8 to 12. */
const SHIMMER_PERIOD_MIN = 8
const SHIMMER_PERIOD_MAX = 12

/**
 * Brownian perturbation strength. Controls how aggressively
 * particles change direction each frame. Tuned for a "meandering"
 * path that reads as gentle drift, not jitter.
 */
const BROWNIAN_STRENGTH = 0.15

/** Parallax factor. Spec: 0.3x pan rate. */
const PARALLAX_FACTOR = 0.3

/* -----------------------------------------------------------------
   Particle Data Structure
   ----------------------------------------------------------------- */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseOpacity: number
  shimmerPhase: number
  shimmerSpeed: number
  maxDriftSpeed: number
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * Create 18 particles with randomized initial state.
 * Position is randomized across the given viewport dimensions.
 * Larger particles (4px) get lower max speed for depth cue.
 */
function createParticles(width: number, height: number): Particle[] {
  return SIZE_DISTRIBUTION.map((size) => {
    // Larger particles move slower (depth cue per spec)
    const speedFactor = 1 - (size - 1.5) / (4.0 - 1.5)
    const maxSpeed = DRIFT_SPEED_MIN + speedFactor * (DRIFT_SPEED_MAX - DRIFT_SPEED_MIN)

    const angle = Math.random() * Math.PI * 2
    const speed = randomBetween(maxSpeed * 0.3, maxSpeed)

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      baseOpacity: randomBetween(OPACITY_MIN, OPACITY_MAX),
      shimmerPhase: Math.random() * Math.PI * 2,
      shimmerSpeed: (Math.PI * 2) / randomBetween(SHIMMER_PERIOD_MIN, SHIMMER_PERIOD_MAX),
      maxDriftSpeed: maxSpeed,
    }
  })
}

/* -----------------------------------------------------------------
   Component
   ----------------------------------------------------------------- */

/**
 * HTML5 Canvas particle field overlay.
 *
 * Renders 18 ember-colored particles with Brownian drift motion
 * on top of the spatial canvas background. The canvas is fixed to
 * the viewport with pointer-events disabled.
 *
 * - Pauses during active camera pan (resumes after 150ms stillness)
 * - Shows static particles when prefers-reduced-motion is active
 * - Applies 0.3x parallax offset relative to camera position
 *
 * @see VISUAL-DESIGN-SPEC.md Section 5.1
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafIdRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const reducedMotion = useReducedMotion()
  const { paused } = usePanPause()

  // Read camera offset for parallax (non-reactive, read in rAF loop)
  const getCameraOffset = useCallback(() => {
    const state = useCameraStore.getState()
    return { x: state.offsetX, y: state.offsetY }
  }, [])

  // Initialize particles and canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
    }

    resizeCanvas()
    particlesRef.current = createParticles(window.innerWidth, window.innerHeight)

    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // If reduced motion, render static particles once and stop
    if (reducedMotion) {
      renderStaticFrame(ctx, canvas, getCameraOffset)
      return
    }

    lastTimeRef.current = performance.now()

    const animate = (now: number) => {
      const deltaMs = now - lastTimeRef.current
      lastTimeRef.current = now
      const deltaSec = Math.min(deltaMs / 1000, 0.1) // Cap at 100ms to avoid jumps

      const width = window.innerWidth
      const height = window.innerHeight
      const camera = getCameraOffset()
      const parallaxX = camera.x * PARALLAX_FACTOR
      const parallaxY = camera.y * PARALLAX_FACTOR

      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      for (const particle of particlesRef.current) {
        // Update position and velocity only when not paused
        if (!paused) {
          // Brownian perturbation
          particle.vx += (Math.random() - 0.5) * BROWNIAN_STRENGTH
          particle.vy += (Math.random() - 0.5) * BROWNIAN_STRENGTH

          // Clamp speed to max drift speed
          const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy)
          if (speed > particle.maxDriftSpeed) {
            const scale = particle.maxDriftSpeed / speed
            particle.vx *= scale
            particle.vy *= scale
          }

          // Move
          particle.x += particle.vx * deltaSec * 60
          particle.y += particle.vy * deltaSec * 60

          // Wrap around viewport edges with margin
          const margin = 20
          if (particle.x < -margin) particle.x = width + margin
          if (particle.x > width + margin) particle.x = -margin
          if (particle.y < -margin) particle.y = height + margin
          if (particle.y > height + margin) particle.y = -margin

          // Advance shimmer phase
          particle.shimmerPhase += particle.shimmerSpeed * deltaSec
        }

        // Calculate current opacity (shimmer oscillation)
        const shimmerFactor = (Math.sin(particle.shimmerPhase) + 1) / 2
        const opacityRange = OPACITY_MAX - OPACITY_MIN
        const currentOpacity =
          OPACITY_MIN + shimmerFactor * opacityRange * (particle.baseOpacity / OPACITY_MAX)

        // Render with parallax offset
        const renderX = particle.x + parallaxX
        const renderY = particle.y + parallaxY

        ctx.beginPath()
        ctx.arc(renderX, renderY, particle.size / 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${EMBER_R}, ${EMBER_G}, ${EMBER_B}, ${currentOpacity})`
        ctx.fill()
      }

      rafIdRef.current = requestAnimationFrame(animate)
    }

    rafIdRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [reducedMotion, paused, getCameraOffset])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{
        zIndex: 1, // Above background grid, below all UI elements
      }}
    />
  )
}

/**
 * Render a single static frame for reduced-motion mode.
 * Particles appear at their initial positions with base opacity.
 */
function renderStaticFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  getCameraOffset: () => { x: number; y: number }
) {
  const width = window.innerWidth
  const height = window.innerHeight
  const camera = getCameraOffset()
  const parallaxX = camera.x * PARALLAX_FACTOR
  const parallaxY = camera.y * PARALLAX_FACTOR

  ctx.clearRect(0, 0, width, height)

  for (const particle of SIZE_DISTRIBUTION.map((size, i) => ({
    x: (i * 137.5) % width, // Deterministic spread using golden angle
    y: (i * 89.3) % height,
    size,
    opacity: OPACITY_MIN + (i / PARTICLE_COUNT) * (OPACITY_MAX - OPACITY_MIN),
  }))) {
    ctx.beginPath()
    ctx.arc(particle.x + parallaxX, particle.y + parallaxY, particle.size / 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${EMBER_R}, ${EMBER_G}, ${EMBER_B}, ${particle.opacity})`
    ctx.fill()
  }
}
```

---

### 4.4 File: `src/components/ambient/HeartbeatPulse.tsx`

CSS-driven health indicator bar with a heartbeat animation. Used inside each capsule to visualize app liveness. The 7s animation cycle has a sharp rise (12% of cycle) and slow fall (12%-30%), matching an organic heartbeat shape rather than a mechanical sine wave.

**Exact file contents:**

```tsx
'use client'

import { useReducedMotion } from '@tarva/ui/motion'
import { usePanPause } from '@/hooks/use-pan-pause'
import { cn } from '@/lib/utils'
import './ambient-effects.css'

/**
 * Status color variants for the health bar.
 * Maps to spatial design tokens from VISUAL-DESIGN-SPEC.md Section 6.1.
 */
type HealthStatus = 'healthy' | 'degraded' | 'warning' | 'error' | 'offline'

const STATUS_COLORS: Record<HealthStatus, string> = {
  healthy: 'bg-healthy',
  degraded: 'bg-warning',
  warning: 'bg-warning',
  error: 'bg-error',
  offline: 'bg-offline',
}

interface HeartbeatPulseProps {
  /** Capsule health status. Determines bar color. */
  status: HealthStatus
  /**
   * Stagger delay in seconds. Each capsule in the ring offsets by 1.2s
   * to prevent synchronized pulsing. Spec: capsule index * 1.2.
   *
   * @example 0, 1.2, 2.4, 3.6, 4.8, 6.0
   */
  delay?: number
  /** Additional CSS classes for the container. */
  className?: string
}

/**
 * Animated health indicator bar for capsules.
 *
 * Displays a 3px horizontal bar that pulses with a heartbeat rhythm:
 * opacity 0.35 -> 0.55, scaleY 1.0 -> 1.8, on a 7s cycle.
 * Each capsule staggers by 1.2s to avoid synchronization.
 *
 * - Pauses during active camera pan
 * - Disabled when prefers-reduced-motion is active (shows static bar)
 * - Color determined by capsule health status
 *
 * @see VISUAL-DESIGN-SPEC.md Section 5.2
 */
export function HeartbeatPulse({ status, delay = 0, className }: HeartbeatPulseProps) {
  const reducedMotion = useReducedMotion()
  const { paused } = usePanPause()

  return (
    <div
      className={cn(
        'h-[3px] w-full rounded-full',
        STATUS_COLORS[status],
        'ambient-heartbeat',
        className
      )}
      style={{
        opacity: 0.35,
        transformOrigin: 'center center',
        animation:
          reducedMotion || paused
            ? 'none'
            : `heartbeat var(--duration-ambient-heart, 7000ms) ${delay}s infinite`,
        animationTimingFunction: 'var(--ease-default)',
        willChange: reducedMotion ? 'auto' : 'transform, opacity',
      }}
      aria-hidden="true"
    />
  )
}
```

---

### 4.5 File: `src/components/ambient/GlowBreathing.tsx`

CSS-driven glow oscillation wrapper for the central hub element. Cycles the `box-shadow` between two 2-layer glow intensities over 5 seconds, simulating a "powered-on" breathing rhythm.

**Exact file contents:**

```tsx
'use client'

import { type ReactNode } from 'react'
import { useReducedMotion } from '@tarva/ui/motion'
import { usePanPause } from '@/hooks/use-pan-pause'
import { cn } from '@/lib/utils'
import './ambient-effects.css'

interface GlowBreathingProps {
  /** The hub center content to wrap with the breathing glow. */
  children: ReactNode
  /** Additional CSS classes. */
  className?: string
}

/**
 * Breathing glow wrapper for the Launch Atrium hub center.
 *
 * Oscillates box-shadow between:
 * - Min: 0 0 20px rgba(224,82,0,0.06), 0 0 8px rgba(224,82,0,0.10)
 * - Max: 0 0 48px rgba(224,82,0,0.14), 0 0 16px rgba(224,82,0,0.22)
 *
 * on a 5s ease-in-out cycle.
 *
 * - Pauses during active camera pan
 * - Disabled when prefers-reduced-motion is active (shows static min glow)
 *
 * @see VISUAL-DESIGN-SPEC.md Section 5.3
 */
export function GlowBreathing({ children, className }: GlowBreathingProps) {
  const reducedMotion = useReducedMotion()
  const { paused } = usePanPause()

  return (
    <div
      className={cn('ambient-breathe', className)}
      style={{
        animation:
          reducedMotion || paused
            ? 'none'
            : 'breathe var(--duration-ambient-breathe, 5000ms) ease-in-out infinite',
        boxShadow: reducedMotion
          ? '0 0 20px rgba(224, 82, 0, 0.06), 0 0 8px rgba(224, 82, 0, 0.10)'
          : undefined,
        willChange: reducedMotion ? 'auto' : 'box-shadow',
      }}
    >
      {children}
    </div>
  )
}
```

---

### 4.6 File: `src/components/ambient/GridPulse.tsx`

CSS-driven radial wave overlay that pulses across the dot grid background. A `radial-gradient` animates its `background-size` from 0% to 400% over 12 seconds, simulating a sonar-like ripple expanding from the hub center.

**Exact file contents:**

```tsx
'use client'

import { useReducedMotion } from '@tarva/ui/motion'
import { usePanPause } from '@/hooks/use-pan-pause'
import { cn } from '@/lib/utils'
import './ambient-effects.css'

interface GridPulseProps {
  /**
   * Pulse origin in viewport-relative coordinates.
   * Defaults to center (50%, 50%). The hub center position
   * can be passed to anchor the ripple to the actual hub.
   */
  originX?: string
  originY?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * Radial wave overlay for the dot grid background.
 *
 * Renders a full-viewport overlay with a radial-gradient that
 * animates from the hub center outward every 12s. The gradient
 * brightens dots from base opacity 0.015 to peak 0.04 as the
 * wave passes through them.
 *
 * - Pauses during active camera pan
 * - Disabled when prefers-reduced-motion is active
 * - Pointer-events disabled (visual-only overlay)
 *
 * @see VISUAL-DESIGN-SPEC.md Section 5.4
 */
export function GridPulse({ originX = '50%', originY = '50%', className }: GridPulseProps) {
  const reducedMotion = useReducedMotion()
  const { paused } = usePanPause()

  if (reducedMotion) {
    // No pulse wave in reduced motion mode -- the static dot grid
    // (rendered by the spatial canvas background) is sufficient.
    return null
  }

  return (
    <div
      className={cn('pointer-events-none absolute inset-0', 'ambient-grid-pulse', className)}
      style={{
        backgroundImage: `radial-gradient(
          circle at ${originX} ${originY},
          rgba(255, 255, 255, var(--opacity-ambient-grid-peak, 0.04)) 0%,
          rgba(255, 255, 255, var(--opacity-ambient-grid, 0.015)) 30%,
          rgba(255, 255, 255, var(--opacity-ambient-grid, 0.015)) 100%
        )`,
        animation: paused
          ? 'none'
          : 'grid-pulse var(--duration-ambient-grid, 12000ms) ease-out infinite',
        opacity: 0,
        willChange: paused ? 'auto' : 'opacity, background-size',
      }}
      aria-hidden="true"
    />
  )
}
```

---

### 4.7 File: `src/components/ambient/ScanlineOverlay.tsx`

Imperative-trigger scanline sweep component. When activated, renders 1 primary line + 2 trailing ghost lines that traverse the containing element top-to-bottom in 350ms. The component is placed inside any container that needs a scanline on state change (capsules, panels, the auth form).

**Exact file contents:**

```tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@tarva/ui/motion'
import { cn } from '@/lib/utils'
import './ambient-effects.css'

interface ScanlineOverlayProps {
  /**
   * When `true`, triggers a single scanline sweep.
   * Set to `true` on state changes (capsule selection, auth latch, etc.),
   * then back to `false`. Each true->false transition triggers one sweep.
   */
  active: boolean
  /**
   * Height of the containing element in pixels.
   * Used to set the --scan-height CSS variable for the sweep distance.
   * If omitted, defaults to 228px (capsule height per spec).
   */
  containerHeight?: number
  /** Additional CSS classes for the overlay container. */
  className?: string
}

/**
 * Scanline sweep overlay for state change feedback.
 *
 * Renders 3 horizontal lines (1 primary at 0.12 opacity + 2 ghosts
 * at 0.06 and 0.03) that sweep top-to-bottom in 350ms. The primary
 * line has a 4px ember glow. Ghosts trail at 30ms and 60ms delay.
 *
 * Triggered by external state changes -- not self-animating.
 * The containing element must have `position: relative; overflow: hidden;`.
 *
 * - Disabled when prefers-reduced-motion is active
 * - NOT paused during pan (scanlines are triggered, not ambient)
 *
 * @see VISUAL-DESIGN-SPEC.md Section 5.5
 */
export function ScanlineOverlay({
  active,
  containerHeight = 228,
  className,
}: ScanlineOverlayProps) {
  const reducedMotion = useReducedMotion()
  const [sweeping, setSweeping] = useState(false)
  const prevActiveRef = useRef(false)

  // Detect rising edge of `active` prop
  const triggerSweep = useCallback(() => {
    if (reducedMotion) return
    setSweeping(true)
  }, [reducedMotion])

  useEffect(() => {
    if (active && !prevActiveRef.current) {
      triggerSweep()
    }
    prevActiveRef.current = active
  }, [active, triggerSweep])

  // Clear sweeping state after animation completes
  useEffect(() => {
    if (!sweeping) return

    // Primary animation is 350ms; ghost-2 starts at +60ms.
    // Total sweep time: 350 + 60 = 410ms. Add 50ms buffer.
    const timer = setTimeout(() => {
      setSweeping(false)
    }, 460)

    return () => clearTimeout(timer)
  }, [sweeping])

  if (reducedMotion || !sweeping) {
    return null
  }

  const scanVars = {
    '--scan-height': `${containerHeight}px`,
  } as React.CSSProperties

  return (
    <div
      className={cn('pointer-events-none absolute inset-x-0 top-0', className)}
      style={scanVars}
      aria-hidden="true"
    >
      {/* Primary scanline */}
      <div
        className="ambient-scanline absolute inset-x-0 h-px"
        style={{
          background: 'var(--color-ember, #e05200)',
          opacity: 0.12,
          boxShadow: '0 0 4px rgba(224, 82, 0, 0.10)',
          transform: 'translateY(-2px)',
          animation: 'scan var(--duration-scanline, 350ms) ease-out forwards',
        }}
      />

      {/* Ghost line 1: 30ms delay, 0.06 opacity */}
      <div
        className="ambient-scanline absolute inset-x-0 h-px"
        style={{
          background: 'var(--color-ember, #e05200)',
          opacity: 0.06,
          transform: 'translateY(-2px)',
          animation: 'scan var(--duration-scanline, 350ms) ease-out 30ms forwards',
        }}
      />

      {/* Ghost line 2: 60ms delay, 0.03 opacity */}
      <div
        className="ambient-scanline absolute inset-x-0 h-px"
        style={{
          background: 'var(--color-ember, #e05200)',
          opacity: 0.03,
          transform: 'translateY(-2px)',
          animation: 'scan var(--duration-scanline, 350ms) ease-out 60ms forwards',
        }}
      />
    </div>
  )
}
```

---

### 4.8 File: `src/components/ambient/FilmGrain.tsx`

Static SVG noise overlay. Renders an inline SVG `<filter>` with `feTurbulence` and a full-viewport div that references it. No animation -- the grain is a fixed texture that adds analog warmth to the digital interface.

**Exact file contents:**

```tsx
/**
 * Film grain / noise overlay.
 *
 * Applies a static SVG feTurbulence noise pattern across the
 * entire viewport at near-imperceptible opacity (0.035).
 * Uses mix-blend-mode: overlay to add subtle analog texture
 * without obscuring content.
 *
 * This component is NOT animated and is therefore NOT affected
 * by prefers-reduced-motion or pan-pause state.
 *
 * Performance note: The SVG filter approach is GPU-composited
 * and does not affect layout or paint of other elements. If
 * performance issues arise on lower-end hardware, replace with
 * a pre-baked 200x200px noise PNG tiled as background-image
 * (see VISUAL-DESIGN-SPEC.md Section 5.6 alternative).
 *
 * @see VISUAL-DESIGN-SPEC.md Section 5.6
 */
export function FilmGrain() {
  return (
    <>
      {/* Inline SVG filter definition (zero visual footprint) */}
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          overflow: 'hidden',
        }}
      >
        <filter id="tarva-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves={3}
            stitchTiles="stitch"
          />
        </filter>
      </svg>

      {/* Full-viewport noise overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          filter: 'url(#tarva-noise)',
          mixBlendMode: 'overlay',
          opacity: 'var(--opacity-ambient-grain, 0.035)',
        }}
      />
    </>
  )
}
```

---

### 4.9 File: `src/components/ambient/index.ts`

Barrel export for all ambient effect components and the CSS file.

**Exact file contents:**

```ts
/**
 * Ambient Effects Layer
 *
 * AD-3 Ambient tier: CSS @keyframes and Canvas rAF effects
 * that run on the compositor thread with zero main-thread cost.
 *
 * All effects respect:
 * - prefers-reduced-motion (animations disabled, static fallbacks)
 * - Pan-pause (animations pause during active camera interaction)
 *
 * @see VISUAL-DESIGN-SPEC.md Section 5 (Living Details)
 */

export { ParticleField } from './ParticleField'
export { HeartbeatPulse } from './HeartbeatPulse'
export { GlowBreathing } from './GlowBreathing'
export { GridPulse } from './GridPulse'
export { ScanlineOverlay } from './ScanlineOverlay'
export { FilmGrain } from './FilmGrain'
```

---

### 4.10 Integration Example

For reference, the ambient effects layer integrates into the Launch Atrium (WS-1.2) approximately as follows. This is illustrative, not prescriptive -- WS-1.2 owns the final integration layout.

```tsx
// In the Launch Atrium layout (WS-1.2)
import { ParticleField, GlowBreathing, GridPulse, FilmGrain } from '@/components/ambient'

export function LaunchAtrium() {
  return (
    <div className="bg-void relative h-screen w-screen overflow-hidden">
      {/* Layer 0: Film grain (z-9999, above everything via mix-blend) */}
      <FilmGrain />

      {/* Layer 1: Particle field (z-1, above grid, below UI) */}
      <ParticleField />

      {/* Layer 2: Grid pulse wave (inside spatial canvas) */}
      <GridPulse />

      {/* Spatial canvas with capsules, hub, etc. */}
      <SpatialCanvas>
        {/* Hub center with breathing glow */}
        <GlowBreathing>
          <HubCenter />
        </GlowBreathing>

        {/* Capsules with heartbeat health bars */}
        {capsules.map((capsule, i) => (
          <Capsule key={capsule.id}>
            <HeartbeatPulse status={capsule.status} delay={i * 1.2} />
          </Capsule>
        ))}
      </SpatialCanvas>
    </div>
  )
}
```

---

## 5. Acceptance Criteria

All criteria must pass before WS-1.6 is marked complete.

| #     | Criterion                                                                                                                                                                                                       | Verification                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| AC-1  | **18 particles render** on the Canvas overlay with ember color (`#e05200`), distributed across the viewport.                                                                                                    | Visual inspection: count particles on a 1920x1080 screen.                                                                |
| AC-2  | **Particle sizes match distribution**: approximately 11 at 1.5px, 4 at 2.5px, 3 at 4px.                                                                                                                         | Inspect Canvas draw calls or pixel-measure from a screenshot.                                                            |
| AC-3  | **Particle opacity range**: each particle's opacity stays within 0.04-0.20, oscillating over an 8-12s sub-cycle.                                                                                                | Observe particles for 15 seconds; verify pulsing is visible but extremely subtle.                                        |
| AC-4  | **Brownian drift**: particles follow meandering, non-linear paths at 0.3-1.5 px/sec. Larger particles move slower.                                                                                              | Observe a 4px particle and a 1.5px particle side by side for 30 seconds. The small particle should visibly drift faster. |
| AC-5  | **Parallax**: during a camera pan, particles shift at approximately 30% of the pan distance (subtle depth cue).                                                                                                 | Pan the spatial canvas left 300px; particles should have shifted approximately 90px in the same direction.               |
| AC-6  | **Heartbeat pulse**: capsule health bars animate opacity 0.35->0.55 and scaleY 1.0->1.8 on a 7s cycle with 1.2s stagger between capsules.                                                                       | Observe two adjacent capsules; the second should pulse approximately 1.2s after the first.                               |
| AC-7  | **Hub breathing**: the central hub glyph's glow oscillates between min (blur 20px) and max (blur 48px) over 5s with ease-in-out.                                                                                | Observe the hub center for 10 seconds; glow should smoothly expand and contract.                                         |
| AC-8  | **Grid pulse**: a radial wave expands from the center every 12s, briefly brightening the dot grid from opacity 0.015 to 0.04.                                                                                   | Observe for 15 seconds; a subtle ring of light should expand outward from center.                                        |
| AC-9  | **Scanline sweep**: when triggered (e.g., capsule selection), 3 horizontal lines sweep top-to-bottom in 350ms. Primary line is brightest; 2 ghost lines trail at 30ms and 60ms delay.                           | Trigger a capsule selection; observe the sweep. Slow-motion capture recommended.                                         |
| AC-10 | **Film grain**: a static noise texture is visible at 0.035 opacity with overlay blend mode across the entire viewport.                                                                                          | Take a screenshot of a dark area; zoom to 400%; fine grain pattern should be barely visible.                             |
| AC-11 | **Pan-pause: immediate freeze**: when camera pan begins, all animated effects (particles, heartbeat, breathing, grid pulse) freeze immediately (within 1 frame).                                                | Begin panning; particles should stop drifting instantly.                                                                 |
| AC-12 | **Pan-pause: debounced resume**: after panning stops, effects resume after approximately 150ms of stillness (not immediately on pointer-up).                                                                    | Stop panning; effects should remain frozen briefly, then smoothly resume.                                                |
| AC-13 | **Reduced motion: all animations disabled**: with `prefers-reduced-motion: reduce` enabled in OS settings, no ambient animations play. Particles render at static positions. Film grain remains (it is static). | Enable reduced motion in system preferences; reload the page; verify no movement.                                        |
| AC-14 | **Performance: 60fps during pan with all effects active**: Chrome DevTools Performance tab shows sustained 60fps (or monitor refresh rate) during a 5-second continuous pan with all 6 effects active.          | Record a performance trace during sustained pan; verify no frame drops below 55fps.                                      |
| AC-15 | **Performance: zero layout thrash**: no ambient effect triggers layout recalculation. Chrome DevTools should show zero "Layout" entries caused by ambient components during normal operation.                   | Record a performance trace for 10 seconds of idle ambient animation; filter for Layout events.                           |
| AC-16 | **Token fidelity**: all color values, opacities, durations, and easing curves match VISUAL-DESIGN-SPEC.md Section 5 exactly. No hardcoded values that deviate from the spec.                                    | Code review against the spec; grep for any hex color that is not `#e05200` or spec-defined rgba values.                  |
| AC-17 | **TypeScript strict compliance**: `pnpm typecheck` passes with zero errors including all ambient components.                                                                                                    | Run `pnpm typecheck`.                                                                                                    |
| AC-18 | **Accessibility: `aria-hidden`**: all ambient effect DOM elements have `aria-hidden="true"` to prevent screen reader noise.                                                                                     | Code review: verify every ambient component root has `aria-hidden="true"`.                                               |
| AC-19 | **Scanline: no self-triggering**: the ScanlineOverlay does not animate on mount or on re-render. It only sweeps when the `active` prop transitions from `false` to `true`.                                      | Mount the component with `active={false}`; verify no animation. Then toggle to `true`; verify single sweep.              |
| AC-20 | **Film grain: SVG filter ID uniqueness**: the `feTurbulence` filter uses the ID `tarva-noise` to avoid collisions with other SVG filters on the page.                                                           | Inspect the SVG markup; verify `id="tarva-noise"` and `filter: url(#tarva-noise)`.                                       |

---

## 6. Decisions Made

| ID       | Decision                                                            | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Source                                                                                                                                                           |
| -------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1.6.1  | **Canvas for particles, CSS for everything else**                   | The spec offers CSS divs or Canvas for particles. Canvas is chosen because: (a) 18 individual `<div>` elements with `will-change: transform, opacity` add 18 compositing layers, while Canvas uses exactly 1; (b) Canvas draw calls are cheaper than style recalculations for this particle count; (c) the rAF loop already exists for parallax offset reads, so the rendering overhead is marginal; (d) WS-0.3 tech spike validates Canvas + CSS at 60fps. | VISUAL-DESIGN-SPEC.md Section 5.1 ("Individual `<div>` elements with CSS `@keyframes`, or a single `<canvas>` overlay for better perf") + AD-3 + WS-0.3 findings |
| D-1.6.2  | **Single `ambient-effects.css` file for all keyframes**             | All `@keyframes` are co-located in one CSS file rather than embedded in component `style` blocks. This enables: (a) the `@media (prefers-reduced-motion)` block to suppress all animations in one rule; (b) CSS-level deduplication if Tailwind/PostCSS processes the file; (c) easier auditing of all animation timings against the spec.                                                                                                                  | [INFERENCE]                                                                                                                                                      |
| D-1.6.3  | **`usePanPause` as a shared hook, not per-component logic**         | The 150ms debounce and camera store subscription are identical for all ambient effects. Extracting to a hook eliminates duplicated debounce timers and ensures all effects pause/resume in perfect synchrony.                                                                                                                                                                                                                                               | AD-3 ("Ambient animations pause during active pan, resume after 150ms of stillness")                                                                             |
| D-1.6.4  | **Scanlines are NOT paused during pan**                             | Scanlines are triggered by discrete state change events (capsule selection, auth latch), not by ambient cycling. A scanline sweep during a pan is valid (e.g., user selects a capsule while momentum-coasting). Only ambient loops (particles, heartbeat, breathing, grid pulse) pause.                                                                                                                                                                     | VISUAL-DESIGN-SPEC.md Section 5.5 ("Trigger: State change events only")                                                                                          |
| D-1.6.5  | **`useReducedMotion` from `@tarva/ui/motion`, not custom**          | `@tarva/ui` already provides a well-tested `useReducedMotion` hook with SSR safety and `matchMedia` listener. No reason to duplicate it.                                                                                                                                                                                                                                                                                                                    | `@tarva/ui` source: `src/motion/use-reduced-motion.ts`                                                                                                           |
| D-1.6.6  | **FilmGrain is a server component (no `'use client'`)**             | FilmGrain has zero interactivity, no hooks, no event handlers, and no browser-only APIs (the SVG filter is declarative markup). It can render on the server, reducing client JS bundle size. The inline styles use only CSS custom properties that resolve at paint time.                                                                                                                                                                                   | [INFERENCE]                                                                                                                                                      |
| D-1.6.7  | **SVG filter approach for film grain, not PNG texture**             | The SVG `feTurbulence` approach produces resolution-independent grain that scales with viewport DPI. The pre-baked PNG alternative (200x200px tiled) is documented in the spec as a fallback for lower-end machines but is not the default implementation.                                                                                                                                                                                                  | VISUAL-DESIGN-SPEC.md Section 5.6 ("Alternative for better performance: pre-baked noise PNG")                                                                    |
| D-1.6.8  | **Parallax reads camera offset via `getState()`, not subscription** | The particle rAF loop reads `useCameraStore.getState()` synchronously each frame rather than subscribing via `useEffect`. This avoids re-creating the rAF loop on every camera position change (which would happen 60 times/second during pan) and is the established pattern for reading Zustand state inside imperative loops (per AD-1).                                                                                                                 | AD-1 (Zustand `subscribe()` pattern for imperative reads)                                                                                                        |
| D-1.6.9  | **Particle wrap-around, not bounce**                                | When a particle drifts off-screen, it wraps to the opposite edge (with a 20px margin to prevent visible popping) rather than bouncing. Wrap-around creates a seamless infinite field; bounce would create visible direction reversals that break the "Brownian drift" illusion.                                                                                                                                                                             | [INFERENCE] from VISUAL-DESIGN-SPEC.md Section 5.1 ("waypoints spread across the viewport, creating a meandering path")                                          |
| D-1.6.10 | **Canvas uses `devicePixelRatio` scaling**                          | The Canvas is sized at `width * dpr` by `height * dpr` with `ctx.scale(dpr, dpr)` to ensure particles render crisply on Retina/HiDPI displays. Without this, 1.5px and 2.5px particles would appear blurry on 2x screens.                                                                                                                                                                                                                                   | [INFERENCE] -- standard Canvas HiDPI practice                                                                                                                    |

---

## 7. Open Questions

| ID       | Question                                                                                                                                                                                                                                                                         | Impact                                                                                                                                                                            | Proposed Resolution                                                                                                                                                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| OQ-1.6.1 | **Camera store `isPanning` field**: WS-1.1 has not yet finalized the camera store API. Will `isPanning` be a boolean on the store, or should `usePanPause` subscribe to velocity/momentum instead?                                                                               | If the interface differs, `usePanPause` needs adjustment. Low risk -- the hook is simple and the contract is clear.                                                               | Propose `isPanning: boolean` to WS-1.1. If WS-1.1 uses a different signal (e.g., `panState: 'idle'                                                                                                                                             | 'panning' | 'momentum'`), update the hook selector accordingly. The 150ms debounce logic remains the same. |
| OQ-1.6.2 | **Grid pulse origin**: the spec says "radial wave expanding from the hub center." At runtime, the hub center is at a world-space coordinate transformed by the camera. Should GridPulse receive the screen-space position of the hub, or use a fixed viewport center (50%, 50%)? | Visual accuracy of the ripple origin. Low impact -- at Z1 the hub is near viewport center anyway.                                                                                 | Default to `50% 50%`. WS-1.2 (Launch Atrium) can pass the computed screen-space hub position via `originX` / `originY` props if precise anchoring is desired.                                                                                  |
| OQ-1.6.3 | **Film grain SVG filter ID collision**: if the Launch is ever embedded as a micro-frontend or iframe alongside another app that uses `id="noise"`, the filter IDs could collide.                                                                                                 | Low likelihood for an internal tool.                                                                                                                                              | Use the namespaced ID `tarva-noise` (already implemented). If collision risk increases, switch to a `useId()` hook to generate a unique ID per mount.                                                                                          |
| OQ-1.6.4 | **Canvas compositing during zoom**: at zoom levels below 0.30 (Z0 constellation), the Canvas overlay is fixed to the viewport while the spatial canvas content is very small. Do particles need to be culled or density-adjusted at extreme zoom levels?                         | At Z0, particles may appear disproportionately large relative to the tiny capsule beacons.                                                                                        | Accept for now. WS-3.7 (Attention Choreography) may adjust particle count/opacity based on zoom level as part of the "calm vs. tighten" behavior.                                                                                              |
| OQ-1.6.5 | **WS-0.3 `backdrop-filter` findings**: the tech spike may recommend disabling `backdrop-filter` during pan. Does this affect any ambient effect?                                                                                                                                 | None of the 6 ambient effects use `backdrop-filter`. However, the `data-panning` attribute pattern from WS-0.3 may be leveraged by `usePanPause` as an alternative signal source. | No action needed for ambient effects. If WS-0.3 defines `[data-panning="true"]` on the canvas container, `usePanPause` can optionally read that attribute instead of a Zustand field, though the Zustand approach is preferred for reactivity. |

---

## 8. Risk Register

| ID      | Risk                                                                                                                                                                                                                                      | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                    |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1.6.1 | **Canvas particle rendering exceeds frame budget during pan/zoom** -- the rAF loop competes with the camera physics rAF loop (WS-1.1) for the same animation frame slot, causing frame drops below 60fps.                                 | Medium     | High   | The particle loop is extremely lightweight: 18 `ctx.arc()` + `ctx.fill()` calls per frame. WS-0.3 tech spike validated Canvas + CSS at 60fps with 10+ elements. If frame budget is tight, reduce particle count to 12 (still within the 15-20 spec range lower bound) or skip every other frame for particles.                |
| R-1.6.2 | **SVG `feTurbulence` filter degrades performance on lower-end GPUs** -- the filter is applied to a full-viewport element, which means the GPU must process every pixel each frame for compositing.                                        | Low        | Medium | The filter is static (no animation), so the GPU only re-composites on resize or layer invalidation. If performance issues surface, swap to the pre-baked 200x200px noise PNG approach documented in VISUAL-DESIGN-SPEC.md Section 5.6. The component API does not change -- only the internal implementation.                 |
| R-1.6.3 | **`usePanPause` debounce causes visible "stutter"** -- effects freezing for 150ms after pan-end may be perceptible as a brief pause before motion resumes.                                                                                | Low        | Low    | 150ms is below the threshold of conscious perception for most users (research places the "noticeable delay" boundary at ~200ms). If it is perceptible, reduce the settle time to 100ms or add a 100ms ease-in ramp on resume rather than a hard restart.                                                                      |
| R-1.6.4 | **Camera store `isPanning` not available at WS-1.6 implementation time** -- if WS-1.1 is not yet complete, the `usePanPause` hook will read `undefined` and effects will never pause.                                                     | Medium     | Low    | This is a safe degradation. Effects animate continuously (the behavior without pan-pause), which is correct for development and testing. Pan-pause is an optimization, not a correctness requirement. It activates automatically once WS-1.1 adds `isPanning` to the store.                                                   |
| R-1.6.5 | **Multiple ScanlineOverlay instances fire simultaneously** -- if two state changes occur within 350ms (e.g., capsule deselect + new capsule select), two overlapping sweeps render.                                                       | Low        | Low    | Visually, overlapping scanlines are acceptable (they create a brief "double scan" that reads as urgency). If undesirable, the parent component (WS-1.2) can debounce the `active` prop. The ScanlineOverlay itself is stateless regarding trigger history.                                                                    |
| R-1.6.6 | **Canvas DPI scaling produces blurry particles on non-integer devicePixelRatio** -- some displays report `devicePixelRatio` of 1.25 or 1.5, which can cause sub-pixel rendering artifacts.                                                | Low        | Low    | Particles are 1.5-4px circles. At these sizes, sub-pixel rendering is barely distinguishable. The `ctx.scale(dpr, dpr)` approach handles the most common DPRs (1x, 2x, 3x) correctly. No additional mitigation needed.                                                                                                        |
| R-1.6.7 | **Heartbeat animation timing drift across capsules** -- CSS animation timers are not guaranteed to stay synchronized across elements. Over time, the 1.2s stagger pattern may drift, causing unintended synchronization or anti-patterns. | Low        | Low    | CSS animations started simultaneously with different `animation-delay` values maintain their relative offset because the delay is computed from a single timeline. The browser does not drift offsets. If drift is observed (unlikely), switch to a single rAF-driven heartbeat controller that coordinates all capsule bars. |

---

## Appendix A: Execution Checklist

This checklist is for the implementing agent. Execute steps in order.

```
[ ] 1. Verify WS-0.1 and WS-0.2 are complete (project builds, tokens resolve)
[ ] 2. Verify `src/components/ambient/` directory exists (created by WS-0.1)
[ ] 3. Create `src/components/ambient/ambient-effects.css` (Section 4.1)
[ ] 4. Create `src/hooks/use-pan-pause.ts` (Section 4.2)
[ ] 5. Verify camera store has `isPanning` field (or note safe degradation per R-1.6.4)
[ ] 6. Create `src/components/ambient/ParticleField.tsx` (Section 4.3)
[ ] 7. Create `src/components/ambient/HeartbeatPulse.tsx` (Section 4.4)
[ ] 8. Create `src/components/ambient/GlowBreathing.tsx` (Section 4.5)
[ ] 9. Create `src/components/ambient/GridPulse.tsx` (Section 4.6)
[ ] 10. Create `src/components/ambient/ScanlineOverlay.tsx` (Section 4.7)
[ ] 11. Create `src/components/ambient/FilmGrain.tsx` (Section 4.8)
[ ] 12. Create `src/components/ambient/index.ts` (Section 4.9)
[ ] 13. Run `pnpm typecheck` -- zero errors (AC-17)
[ ] 14. Run `pnpm lint` -- zero errors
[ ] 15. Run `pnpm format` to normalize all files
[ ] 16. Visual verification: mount all effects in a test page
[ ] 17. Verify AC-1 through AC-5 (particle field)
[ ] 18. Verify AC-6 (heartbeat pulse)
[ ] 19. Verify AC-7 (glow breathing)
[ ] 20. Verify AC-8 (grid pulse)
[ ] 21. Verify AC-9 (scanline sweep)
[ ] 22. Verify AC-10 (film grain)
[ ] 23. Verify AC-11 and AC-12 (pan-pause behavior)
[ ] 24. Verify AC-13 (reduced motion)
[ ] 25. Performance trace: verify AC-14 and AC-15 (60fps, no layout thrash)
[ ] 26. Code review: verify AC-16 (token fidelity) and AC-18 (aria-hidden)
[ ] 27. Commit with message: "feat: implement ambient effects layer (WS-1.6)"
```

---

## Appendix B: Design Token Reference

Quick reference for all design tokens consumed by this workstream. All values from VISUAL-DESIGN-SPEC.md Section 6.1.

| Token                         | Value                          | Used By                                                   |
| ----------------------------- | ------------------------------ | --------------------------------------------------------- |
| `--color-ember`               | `#e05200`                      | ParticleField (Canvas fill), ScanlineOverlay (line color) |
| `--duration-ambient-breathe`  | `5000ms`                       | GlowBreathing                                             |
| `--duration-ambient-heart`    | `7000ms`                       | HeartbeatPulse                                            |
| `--duration-ambient-grid`     | `12000ms`                      | GridPulse                                                 |
| `--duration-ambient-drift`    | `45000ms`                      | ParticleField (reference only; rAF loop is continuous)    |
| `--duration-scanline`         | `350ms`                        | ScanlineOverlay                                           |
| `--ease-default`              | `cubic-bezier(0.4, 0, 0.2, 1)` | HeartbeatPulse                                            |
| `--opacity-ambient-particle`  | `0.12`                         | ParticleField (reference; actual range is 0.04-0.20)      |
| `--opacity-ambient-grid`      | `0.015`                        | GridPulse (base dot opacity)                              |
| `--opacity-ambient-grid-peak` | `0.04`                         | GridPulse (wave peak opacity)                             |
| `--opacity-ambient-grain`     | `0.035`                        | FilmGrain                                                 |
| `--color-healthy`             | `#22c55e`                      | HeartbeatPulse (healthy status)                           |
| `--color-warning`             | `#eab308`                      | HeartbeatPulse (warning/degraded status)                  |
| `--color-error`               | `#ef4444`                      | HeartbeatPulse (error status)                             |
| `--color-offline`             | `#6b7280`                      | HeartbeatPulse (offline status)                           |
| `--glow-ember-subtle`         | 2-layer box-shadow             | GlowBreathing (min state, reference)                      |

---

## Appendix C: Layer Stack

Visual stacking order of all ambient effects within the Launch viewport.

```
z-index: 9999  FilmGrain          (fixed, mix-blend-mode: overlay)
               -- all UI elements --
z-index: 10    Capsules, HUD, panels
               -- spatial canvas content --
z-index: 2     GridPulse          (absolute, inside spatial canvas)
z-index: 1     ParticleField      (fixed, Canvas overlay)
z-index: 0     Background (bg-void #050911)
```

**Notes:**

- HeartbeatPulse and GlowBreathing are **not** in this stack -- they are inline within their parent components (capsule health bars and hub center, respectively).
- ScanlineOverlay is positioned `absolute` within its triggering container (capsule, panel, auth form) and inherits that container's z-index.
- FilmGrain sits at z-9999 because `mix-blend-mode: overlay` needs to composite with all layers below. Its opacity (0.035) makes it imperceptible to layout but adds grain to everything beneath it.
