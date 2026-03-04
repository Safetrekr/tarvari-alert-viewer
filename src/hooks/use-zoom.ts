/**
 * Custom hook for scroll-wheel zoom-to-cursor with momentum.
 *
 * Wheel events add impulse to a zoom velocity. A rAF loop applies the
 * velocity each frame with friction decay, giving a smooth coast-to-stop
 * feel identical to the pan momentum system.
 *
 * Zoom formula per frame: newZoom = currentZoom * (1 + zoomVelocity)
 * The cursor position from the last wheel event is preserved so the
 * world-space point under the cursor stays fixed during the coast.
 *
 * @module use-zoom
 * @see WS-0.3 Section 4.1.4
 * @see WS-1.1 Deliverable 7
 * @see Q1 (zoom sensitivity tuning)
 */

import { useEffect } from 'react'

import { useCameraStore } from '@/stores/camera.store'
import { clampZoom } from '@/lib/spatial-math'
import {
  ZOOM_SENSITIVITY,
  ZOOM_FRICTION,
  ZOOM_STOP_THRESHOLD,
} from '@/lib/constants'

export function useZoom(viewportRef: React.RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    let zoomVelocity = 0
    let lastCursorX = 0
    let lastCursorY = 0
    let rafId: number | null = null

    function animate() {
      zoomVelocity *= ZOOM_FRICTION

      if (Math.abs(zoomVelocity) < ZOOM_STOP_THRESHOLD) {
        zoomVelocity = 0
        rafId = null
        return
      }

      const currentZoom = useCameraStore.getState().zoom
      const nextZoom = clampZoom(currentZoom * (1 + zoomVelocity))

      // Only apply if zoom meaningfully changed (use epsilon to avoid
      // floating-point equality issues at extreme zoom levels)
      if (Math.abs(nextZoom - currentZoom) > 1e-6) {
        useCameraStore.getState().zoomTo(nextZoom, lastCursorX, lastCursorY)
      } else {
        // Hit the clamp -- stop coasting
        zoomVelocity = 0
        rafId = null
        return
      }

      rafId = requestAnimationFrame(animate)
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      lastCursorX = e.clientX - rect.left
      lastCursorY = e.clientY - rect.top

      // Add impulse -- positive deltaY = scroll down = zoom out.
      // Scale by current zoom so that impulse is proportional at all
      // zoom levels (prevents "stuck at min zoom" feeling).
      const delta = -e.deltaY
      const currentZoom = useCameraStore.getState().zoom
      const scaleFactor = Math.max(0.3 / currentZoom, 1)
      zoomVelocity += delta * ZOOM_SENSITIVITY * scaleFactor

      // Start animation loop if not already running
      if (rafId === null) {
        rafId = requestAnimationFrame(animate)
      }
    }

    viewport.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      viewport.removeEventListener('wheel', onWheel)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }
  }, [viewportRef])
}
