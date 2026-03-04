/**
 * Custom hook for viewport culling.
 *
 * Subscribes to camera state and viewport dimensions, computes visible
 * world-space bounds, and returns a function to check whether a given
 * world-space rectangle is visible.
 *
 * Uses requestAnimationFrame debouncing to avoid computing bounds
 * on every store update during rapid panning/zooming.
 *
 * @module use-viewport-cull
 * @see WS-0.3 Section 4.1.4
 * @see WS-1.1 Deliverable 9
 * @see Q6 (unmount vs visibility toggle -- spike tests both)
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { useCameraStore } from '@/stores/camera.store'
import { getVisibleBounds, isInViewport, type WorldBounds } from '@/lib/spatial-math'
import { VIEWPORT_CULL_MARGIN } from '@/lib/constants'

export function useViewportCull(
  viewportRef: React.RefObject<HTMLDivElement | null>,
  margin: number = VIEWPORT_CULL_MARGIN,
): {
  isVisible: (x: number, y: number, width: number, height: number) => boolean
  bounds: WorldBounds | null
} {
  const boundsRef = useRef<WorldBounds | null>(null)
  const [bounds, setBounds] = useState<WorldBounds | null>(null)
  const rafRef = useRef<number | null>(null)

  // Subscribe to camera store for bounds computation
  useEffect(() => {
    function scheduleUpdate() {
      if (rafRef.current !== null) return // Already scheduled

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null

        const viewport = viewportRef.current
        if (!viewport) return

        const { offsetX, offsetY, zoom } = useCameraStore.getState()
        const rect = viewport.getBoundingClientRect()
        const newBounds = getVisibleBounds(
          rect.width,
          rect.height,
          offsetX,
          offsetY,
          zoom,
          margin,
        )

        boundsRef.current = newBounds
        setBounds(newBounds)
      })
    }

    // Subscribe to store changes (low-overhead, no React re-renders)
    const unsubscribe = useCameraStore.subscribe(scheduleUpdate)

    // Initial computation
    scheduleUpdate()

    // Also recompute on window resize
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      unsubscribe()
      window.removeEventListener('resize', scheduleUpdate)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [viewportRef, margin])

  const isVisible = useCallback(
    (x: number, y: number, width: number, height: number): boolean => {
      const currentBounds = boundsRef.current
      if (!currentBounds) return true // If bounds not computed yet, assume visible
      return isInViewport(x, y, width, height, currentBounds)
    },
    [],
  )

  return { isVisible, bounds }
}
