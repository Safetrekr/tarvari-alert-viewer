'use client'

/**
 * Frame Budget Monitor
 *
 * Continuously measures frame timing via requestAnimationFrame.
 * Classifies performance into the three tiers used by WS-3.7
 * Attention Choreography and this WS-4.4 Polish Pass.
 *
 * Returns a rolling average FPS and flags any frames that exceed
 * the 16.67ms budget (at 60fps).
 *
 * Dev-mode only. Returns static values in production.
 *
 * Source: WS-4.4 D-POLISH-6
 * Reference: VISUAL-DESIGN-SPEC.md Section 4.3, WS-3.7 PerformanceLevel
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export interface FrameBudgetState {
  /** Rolling average FPS over the sample window */
  readonly avgFps: number
  /** Number of frames that exceeded 16.67ms in the sample window */
  readonly droppedFrames: number
  /** Performance tier classification */
  readonly performanceLevel: 'full' | 'reduced' | 'minimal'
  /** Whether monitoring is active */
  readonly isMonitoring: boolean
  /** Total frames sampled */
  readonly totalFrames: number
}

interface UseFrameBudgetMonitorOptions {
  /** Number of frames to average over. Default: 120 (2 seconds at 60fps). */
  readonly sampleWindow?: number
  /** Whether to start monitoring immediately. Default: true in dev. */
  readonly enabled?: boolean
}

const FRAME_BUDGET_MS = 16.67 // 1000ms / 60fps

export function useFrameBudgetMonitor(
  options: UseFrameBudgetMonitorOptions = {}
): FrameBudgetState {
  const { sampleWindow = 120, enabled = process.env.NODE_ENV === 'development' } = options

  const [state, setState] = useState<FrameBudgetState>({
    avgFps: 60,
    droppedFrames: 0,
    performanceLevel: 'full',
    isMonitoring: false,
    totalFrames: 0,
  })

  const frameTimesRef = useRef<number[]>([])
  const lastFrameRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const totalFramesRef = useRef<number>(0)

  const classify = useCallback((fps: number): 'full' | 'reduced' | 'minimal' => {
    if (fps >= 55) return 'full'
    if (fps >= 30) return 'reduced'
    return 'minimal'
  }, [])

  useEffect(() => {
    if (!enabled) return

    let mounted = true

    const tick = (now: number) => {
      if (!mounted) return

      if (lastFrameRef.current > 0) {
        const delta = now - lastFrameRef.current
        frameTimesRef.current.push(delta)
        totalFramesRef.current++

        // Trim to sample window
        if (frameTimesRef.current.length > sampleWindow) {
          frameTimesRef.current.shift()
        }

        // Update state every 30 frames (~0.5s) to avoid excessive re-renders
        if (totalFramesRef.current % 30 === 0) {
          const times = frameTimesRef.current
          const avgDelta = times.reduce((sum, t) => sum + t, 0) / times.length
          const avgFps = Math.round(1000 / avgDelta)
          const dropped = times.filter((t) => t > FRAME_BUDGET_MS).length

          setState({
            avgFps,
            droppedFrames: dropped,
            performanceLevel: classify(avgFps),
            isMonitoring: true,
            totalFrames: totalFramesRef.current,
          })
        }
      }

      lastFrameRef.current = now
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      mounted = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, sampleWindow, classify])

  return state
}
