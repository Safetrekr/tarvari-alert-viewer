/**
 * ParticleField -- HTML5 Canvas 2D overlay with 18 ember-colored particles.
 *
 * Renders drifting ember particles with Brownian motion, per-particle
 * opacity oscillation (shimmer), size-based speed distribution (depth cue),
 * and 0.3x parallax offset relative to camera position.
 *
 * Performance:
 * - Uses requestAnimationFrame loop (Ambient tier, AD-3)
 * - Reads camera state imperatively via `useCameraStore.getState()`
 *   to avoid React re-renders on every frame
 * - Scales canvas to devicePixelRatio for Retina displays
 * - Pauses during pan via `usePanPause()` hook
 * - Reduced motion: renders particles once at deterministic positions
 *
 * @module ParticleField
 * @see WS-1.6 Deliverable 4.2
 * @see VISUAL-DESIGN-SPEC.md Section 5.1
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'

import { useReducedMotion } from '@tarva/ui/motion'

import { usePanPause } from '@/hooks/use-pan-pause'
import { useCameraStore } from '@/stores/camera.store'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total number of ember particles. */
const PARTICLE_COUNT = 18

/** Ember color in RGB components. */
const EMBER_R = 224
const EMBER_G = 82
const EMBER_B = 0

/** Parallax factor relative to camera offset. */
const PARALLAX_FACTOR = 0.3

/** Edge wrap margin in CSS pixels. */
const WRAP_MARGIN = 20

/** Opacity range for shimmer oscillation. */
const OPACITY_MIN = 0.04
const OPACITY_MAX = 0.20

/** Shimmer period range in seconds. */
const SHIMMER_PERIOD_MIN = 8
const SHIMMER_PERIOD_MAX = 12

/** Brownian drift speed range in px/sec. */
const DRIFT_SPEED_MIN = 0.3
const DRIFT_SPEED_MAX = 1.5

// ---------------------------------------------------------------------------
// Particle type
// ---------------------------------------------------------------------------

interface Particle {
  x: number
  y: number
  /** Radius in CSS pixels. */
  size: number
  /** Current velocity in px/sec. */
  vx: number
  vy: number
  /** Maximum drift speed (smaller particles = faster). */
  maxSpeed: number
  /** Shimmer period in seconds. */
  shimmerPeriod: number
  /** Phase offset for shimmer sine wave. */
  shimmerPhase: number
}

// ---------------------------------------------------------------------------
// Size distribution: 11x 1.5px, 4x 2.5px, 3x 4px
// ---------------------------------------------------------------------------

function getSizeForIndex(index: number): number {
  if (index < 11) return 1.5
  if (index < 15) return 2.5
  return 4
}

// ---------------------------------------------------------------------------
// Deterministic seeded random for reduced-motion initial positions
// ---------------------------------------------------------------------------

function seededRandom(seed: number): number {
  // Simple hash-based PRNG (mulberry32)
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// ---------------------------------------------------------------------------
// Create particles
// ---------------------------------------------------------------------------

function createParticles(width: number, height: number): Particle[] {
  const particles: Particle[] = []

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const size = getSizeForIndex(i)
    // Larger particles drift slower (depth cue)
    const speedScale = 1 - (size - 1.5) / (4 - 1.5) // 1.0 for 1.5px, 0.0 for 4px
    const maxSpeed = DRIFT_SPEED_MIN + speedScale * (DRIFT_SPEED_MAX - DRIFT_SPEED_MIN)

    particles.push({
      x: seededRandom(i * 3 + 1) * width,
      y: seededRandom(i * 3 + 2) * height,
      size,
      vx: (seededRandom(i * 5 + 10) - 0.5) * maxSpeed,
      vy: (seededRandom(i * 5 + 11) - 0.5) * maxSpeed,
      maxSpeed,
      shimmerPeriod:
        SHIMMER_PERIOD_MIN +
        seededRandom(i * 7 + 20) * (SHIMMER_PERIOD_MAX - SHIMMER_PERIOD_MIN),
      shimmerPhase: seededRandom(i * 7 + 21) * Math.PI * 2,
    })
  }

  return particles
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const isPanActive = usePanPause()
  const reducedMotion = useReducedMotion()

  // Memoize paused state ref for the rAF loop to read without closure stale
  const isPausedRef = useRef(isPanActive)
  isPausedRef.current = isPanActive

  const reducedMotionRef = useRef(reducedMotion)
  reducedMotionRef.current = reducedMotion

  // -----------------------------------------------------------------------
  // Setup canvas dimensions (respects devicePixelRatio)
  // -----------------------------------------------------------------------
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
    }

    // Re-create particles at new dimensions
    particlesRef.current = createParticles(rect.width, rect.height)
  }, [])

  // -----------------------------------------------------------------------
  // Render a single static frame (for reduced motion)
  // -----------------------------------------------------------------------
  const renderStaticFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    ctx.clearRect(0, 0, width, height)

    const particles = particlesRef.current
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const opacity = (OPACITY_MIN + OPACITY_MAX) / 2 // static midpoint
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${EMBER_R}, ${EMBER_G}, ${EMBER_B}, ${opacity})`
      ctx.fill()
    }
  }, [])

  // -----------------------------------------------------------------------
  // Animation loop
  // -----------------------------------------------------------------------
  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // If reduced motion was turned on, render static and stop
    if (reducedMotionRef.current) {
      return
    }

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    // Calculate delta time
    const dt = lastTimeRef.current === 0
      ? 0.016 // assume 60fps for first frame
      : Math.min((timestamp - lastTimeRef.current) / 1000, 0.1) // cap at 100ms
    lastTimeRef.current = timestamp

    // Read camera state imperatively (no React re-render)
    const cameraState = useCameraStore.getState()
    const parallaxX = cameraState.offsetX * PARALLAX_FACTOR
    const parallaxY = cameraState.offsetY * PARALLAX_FACTOR

    // 1. Clear canvas
    ctx.clearRect(0, 0, width, height)

    const particles = particlesRef.current
    const paused = isPausedRef.current
    const now = timestamp / 1000 // seconds

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]

      // 2. Apply Brownian perturbation (if NOT paused)
      if (!paused && dt > 0) {
        // Add random Brownian perturbation
        p.vx += (Math.random() - 0.5) * 0.5
        p.vy += (Math.random() - 0.5) * 0.5

        // Clamp speed to maxSpeed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > p.maxSpeed) {
          p.vx = (p.vx / speed) * p.maxSpeed
          p.vy = (p.vy / speed) * p.maxSpeed
        }

        // Move particle
        p.x += p.vx * dt
        p.y += p.vy * dt

        // Wrap around at viewport edges with margin
        if (p.x < -WRAP_MARGIN) p.x = width + WRAP_MARGIN
        if (p.x > width + WRAP_MARGIN) p.x = -WRAP_MARGIN
        if (p.y < -WRAP_MARGIN) p.y = height + WRAP_MARGIN
        if (p.y > height + WRAP_MARGIN) p.y = -WRAP_MARGIN
      }

      // 3. Calculate shimmer opacity (sine wave)
      const shimmerT = Math.sin(
        (now * Math.PI * 2) / p.shimmerPeriod + p.shimmerPhase,
      )
      // Map sine [-1, 1] to [OPACITY_MIN, OPACITY_MAX]
      const opacity = OPACITY_MIN + ((shimmerT + 1) / 2) * (OPACITY_MAX - OPACITY_MIN)

      // 4. Render with parallax offset
      const renderX = p.x + parallaxX
      const renderY = p.y + parallaxY

      ctx.beginPath()
      ctx.arc(renderX, renderY, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${EMBER_R}, ${EMBER_G}, ${EMBER_B}, ${opacity})`
      ctx.fill()
    }

    // 5. Request next frame
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------
  useEffect(() => {
    setupCanvas()

    if (reducedMotion) {
      renderStaticFrame()
      return
    }

    lastTimeRef.current = 0
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [setupCanvas, renderStaticFrame, animate, reducedMotion])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setupCanvas()
      if (reducedMotion) {
        renderStaticFrame()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setupCanvas, renderStaticFrame, reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    />
  )
}
