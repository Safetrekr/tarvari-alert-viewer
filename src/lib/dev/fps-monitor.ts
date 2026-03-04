/**
 * Lightweight frame-time measurement utility for the ZUI spike.
 *
 * Runs a persistent rAF loop that tracks the last 120 frame timestamps
 * (2 seconds at 60fps), computes rolling average/min/current FPS,
 * and counts dropped frames (> 20ms = below 50fps).
 *
 * @module fps-monitor
 * @see WS-0.3 Section 4.1.6
 */

export interface FpsSnapshot {
  /** Instantaneous FPS from the last frame delta. */
  currentFps: number
  /** Average FPS across the measurement window. */
  avgFps: number
  /** Minimum FPS observed in the measurement window. */
  minFps: number
  /** Last 120 frame durations in ms. */
  frameTimes: number[]
  /** Number of frames > 20ms (below 50fps threshold). */
  droppedFrames: number
}

const WINDOW_SIZE = 120

export function createFpsMonitor(): {
  start: () => void
  stop: () => void
  snapshot: () => FpsSnapshot
  reset: () => void
} {
  let rafId: number | null = null
  let lastTimestamp: number | null = null
  let frameTimes: number[] = []

  function tick(timestamp: number) {
    if (lastTimestamp !== null) {
      const delta = timestamp - lastTimestamp

      // Only record reasonable deltas (skip huge gaps from tab-backgrounding)
      if (delta > 0 && delta < 500) {
        frameTimes.push(delta)
        if (frameTimes.length > WINDOW_SIZE) {
          frameTimes = frameTimes.slice(-WINDOW_SIZE)
        }
      }
    }
    lastTimestamp = timestamp
    rafId = requestAnimationFrame(tick)
  }

  function start() {
    if (rafId !== null) return
    lastTimestamp = null
    rafId = requestAnimationFrame(tick)
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    lastTimestamp = null
  }

  function reset() {
    frameTimes = []
    lastTimestamp = null
  }

  function snapshot(): FpsSnapshot {
    if (frameTimes.length === 0) {
      return { currentFps: 0, avgFps: 0, minFps: 0, frameTimes: [], droppedFrames: 0 }
    }

    const current = frameTimes[frameTimes.length - 1]
    const currentFps = current > 0 ? 1000 / current : 0

    const sum = frameTimes.reduce((a, b) => a + b, 0)
    const avgDelta = sum / frameTimes.length
    const avgFps = avgDelta > 0 ? 1000 / avgDelta : 0

    const maxDelta = Math.max(...frameTimes)
    const minFps = maxDelta > 0 ? 1000 / maxDelta : 0

    const droppedFrames = frameTimes.filter((dt) => dt > 20).length

    return {
      currentFps: Math.round(currentFps),
      avgFps: Math.round(avgFps * 10) / 10,
      minFps: Math.round(minFps * 10) / 10,
      frameTimes: [...frameTimes],
      droppedFrames,
    }
  }

  return { start, stop, snapshot, reset }
}
