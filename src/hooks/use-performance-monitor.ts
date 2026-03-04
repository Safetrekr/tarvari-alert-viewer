/**
 * Performance monitor hook -- classifies client performance via FPS sampling.
 *
 * Measures frame rate using a rolling window of requestAnimationFrame
 * timestamps and classifies the client into one of three performance
 * levels: 'full' (>=55fps), 'reduced' (30-54fps), or 'minimal' (<30fps).
 *
 * Re-evaluates every 2 seconds to prevent rapid oscillation. Low-core
 * devices (navigator.hardwareConcurrency <= 2) are immediately classified
 * as 'minimal' without measurement.
 *
 * @module use-performance-monitor
 * @see WS-3.7 Section 4.5
 */

'use client'

import { useEffect, useRef, useState } from 'react'

import type { PerformanceLevel } from '@/lib/ai/attention-types'

// ============================================================================
// Constants
// ============================================================================

/**
 * Rolling window size for FPS averaging.
 * 60 frames at 60fps = 1 second of history.
 */
const WINDOW_SIZE = 60

/**
 * FPS thresholds for performance classification.
 * Aligned with common display refresh rates and perceptual thresholds.
 */
const FPS_FULL_THRESHOLD = 55
const FPS_REDUCED_THRESHOLD = 30

/**
 * Minimum re-evaluation interval in ms.
 * Prevents rapid performance level oscillation.
 */
const EVALUATION_INTERVAL_MS = 2000

/**
 * If navigator.hardwareConcurrency is at or below this value,
 * force 'minimal' regardless of measured FPS. Low-core devices
 * should not attempt full ambient effects.
 */
const MIN_CORE_COUNT = 2

// ============================================================================
// Hook
// ============================================================================

/**
 * Monitor client frame rate and classify performance level.
 *
 * Uses a rolling window of requestAnimationFrame timestamps to
 * compute average FPS. Re-evaluates the performance level every
 * 2 seconds to prevent rapid oscillation.
 *
 * Special cases:
 * - navigator.hardwareConcurrency <= 2: forces 'minimal'
 * - Server-side rendering: returns 'full' (no measurement possible)
 * - prefers-reduced-motion: caller should bypass this hook entirely
 *
 * @returns Current performance level classification.
 */
export function usePerformanceMonitor(): PerformanceLevel {
  const [level, setLevel] = useState<PerformanceLevel>('full')
  const frameTimes = useRef<number[]>([])
  const lastEvaluation = useRef<number>(0)
  const rafId = useRef<number>(0)

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return

    // Hardware check: low-core devices go straight to minimal
    if (
      typeof navigator !== 'undefined' &&
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency <= MIN_CORE_COUNT
    ) {
      setLevel('minimal')
      return
    }

    let prevTimestamp = performance.now()

    function measure(timestamp: number) {
      const delta = timestamp - prevTimestamp
      prevTimestamp = timestamp

      // Record frame time (skip first frame which can have a large delta)
      if (delta > 0 && delta < 200) {
        frameTimes.current.push(delta)
        if (frameTimes.current.length > WINDOW_SIZE) {
          frameTimes.current.shift()
        }
      }

      // Re-evaluate at the configured interval
      const now = performance.now()
      if (
        now - lastEvaluation.current >= EVALUATION_INTERVAL_MS &&
        frameTimes.current.length >= WINDOW_SIZE / 2
      ) {
        lastEvaluation.current = now

        const avgDelta =
          frameTimes.current.reduce((sum, t) => sum + t, 0) / frameTimes.current.length
        const avgFps = 1000 / avgDelta

        let newLevel: PerformanceLevel = 'full'
        if (avgFps < FPS_REDUCED_THRESHOLD) {
          newLevel = 'minimal'
        } else if (avgFps < FPS_FULL_THRESHOLD) {
          newLevel = 'reduced'
        }

        setLevel((prev) => {
          // Only update if changed (prevents unnecessary re-renders)
          return prev === newLevel ? prev : newLevel
        })
      }

      rafId.current = requestAnimationFrame(measure)
    }

    rafId.current = requestAnimationFrame(measure)

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return level
}
