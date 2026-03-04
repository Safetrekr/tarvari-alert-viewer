/**
 * URL sync hook for camera position.
 *
 * On mount: reads ?cx=&cy=&cz= from the current URL and restores
 * the camera position if all three params are valid numbers.
 *
 * On settle: writes camera position to the URL via `history.replaceState()`
 * after the camera has been still for 150ms. Uses no Next.js router
 * involvement to avoid triggering re-renders or navigation events.
 *
 * @module use-camera-sync
 * @see WS-1.1 Deliverable 13
 */

import { useEffect, useRef } from 'react'

import { useCameraStore, cameraSelectors } from '@/stores/camera.store'
import { clampZoom } from '@/lib/spatial-math'

/** Debounce delay before writing camera position to URL (ms). */
const URL_SYNC_DEBOUNCE_MS = 150

export function useCameraSync(enabled: boolean = true): void {
  const initializedRef = useRef(false)

  // On mount: restore camera from URL params
  useEffect(() => {
    if (!enabled) return
    if (initializedRef.current) return
    initializedRef.current = true

    const params = new URLSearchParams(window.location.search)
    const cx = params.get('cx')
    const cy = params.get('cy')
    const cz = params.get('cz')

    if (cx !== null && cy !== null && cz !== null) {
      const parsedX = parseFloat(cx)
      const parsedY = parseFloat(cy)
      const parsedZ = parseFloat(cz)

      if (!isNaN(parsedX) && !isNaN(parsedY) && !isNaN(parsedZ)) {
        useCameraStore.getState().setCamera({
          offsetX: parsedX,
          offsetY: parsedY,
          zoom: clampZoom(parsedZ),
        })
      }
    }
  }, [enabled])

  // On settle: write camera position to URL
  useEffect(() => {
    if (!enabled) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let lastIsMoving = false

    const unsubscribe = useCameraStore.subscribe((state) => {
      const isMoving = cameraSelectors.isMoving(state)

      if (isMoving) {
        // Camera is moving -- clear any pending URL write
        lastIsMoving = true
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer)
          debounceTimer = null
        }
      } else if (lastIsMoving) {
        // Camera just stopped -- schedule URL write after debounce
        lastIsMoving = false

        if (debounceTimer !== null) {
          clearTimeout(debounceTimer)
        }

        debounceTimer = setTimeout(() => {
          debounceTimer = null
          const { cx, cy, cz } = cameraSelectors.urlParams(useCameraStore.getState())

          const url = new URL(window.location.href)
          url.searchParams.set('cx', String(cx))
          url.searchParams.set('cy', String(cy))
          url.searchParams.set('cz', String(cz))

          history.replaceState(history.state, '', url.toString())
        }, URL_SYNC_DEBOUNCE_MS)
      }
    })

    return () => {
      unsubscribe()
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer)
      }
    }
  }, [enabled])
}
