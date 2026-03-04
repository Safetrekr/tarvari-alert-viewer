/**
 * Convenience hook for flying the camera to world-space coordinates.
 *
 * Converts world-space target (x, y) to the camera offsets needed
 * to center that point on screen, then delegates to the store's
 * `flyTo` method for spring animation.
 *
 * @module use-fly-to
 * @see WS-1.1 Deliverable 11
 */

import { useCallback } from 'react'

import { useCameraStore } from '@/stores/camera.store'
import { type SpringConfig } from '@/lib/spatial-math'
import { ZOOM_DEFAULT } from '@/lib/constants'

export interface UseFlyToResult {
  /**
   * Fly the camera to center a world-space point on screen.
   * @param worldX - World-space X coordinate to center on
   * @param worldY - World-space Y coordinate to center on
   * @param targetZoom - Target zoom level
   * @param config - Optional partial spring config override
   */
  flyTo: (
    worldX: number,
    worldY: number,
    targetZoom: number,
    config?: Partial<SpringConfig>,
  ) => void

  /** Fly back to the launch position (world origin, default zoom). */
  flyToLaunch: () => void

  /** Cancel any active flyTo animation. */
  cancel: () => void

  /** Whether a flyTo animation is currently in progress. */
  isFlying: boolean
}

export function useFlyTo(): UseFlyToResult {
  const isFlying = useCameraStore((state) => state.isAnimating)

  const flyTo = useCallback(
    (
      worldX: number,
      worldY: number,
      targetZoom: number,
      config?: Partial<SpringConfig>,
    ) => {
      const { viewportWidth, viewportHeight } = useCameraStore.getState()

      // Convert world-space target to the camera offset that centers
      // that world point on screen:
      //   offsetX = viewportWidth/2 - worldX * targetZoom
      //   offsetY = viewportHeight/2 - worldY * targetZoom
      const targetOffsetX = viewportWidth / 2 - worldX * targetZoom
      const targetOffsetY = viewportHeight / 2 - worldY * targetZoom

      useCameraStore.getState().flyTo(targetOffsetX, targetOffsetY, targetZoom, config)
    },
    [],
  )

  const flyToLaunch = useCallback(() => {
    const { viewportWidth, viewportHeight } = useCameraStore.getState()
    const targetOffsetX = viewportWidth / 2
    const targetOffsetY = viewportHeight / 2
    useCameraStore.getState().flyTo(targetOffsetX, targetOffsetY, ZOOM_DEFAULT)
  }, [])

  const cancel = useCallback(() => {
    useCameraStore.getState().cancelAnimation()
  }, [])

  return { flyTo, flyToLaunch, cancel, isFlying }
}
