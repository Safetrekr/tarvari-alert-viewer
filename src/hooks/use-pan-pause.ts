/**
 * Debounced pan-active signal hook.
 *
 * Subscribes to `isPanning` and `isAnimating` on the camera store.
 * Returns `isPanActive` which is:
 * - true immediately when any motion begins (pan drag or momentum)
 * - false after a configurable delay (default 150ms) of complete stillness
 *
 * Used by components that need to disable expensive effects (like
 * backdrop-filter) during camera motion and re-enable them after
 * the camera settles.
 *
 * @module use-pan-pause
 * @see WS-1.1 Deliverable 12
 */

import { useEffect, useRef, useState } from 'react'

import { useCameraStore } from '@/stores/camera.store'
import { PAN_PAUSE_DELAY_MS } from '@/lib/constants'

export function usePanPause(delay: number = PAN_PAUSE_DELAY_MS): boolean {
  const [isPanActive, setIsPanActive] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubscribe = useCameraStore.subscribe((state) => {
      const isMoving = state.isPanning || state.isAnimating

      if (isMoving) {
        // Immediately signal motion active
        setIsPanActive(true)

        // Clear any pending re-enable timer
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      } else {
        // Motion stopped -- wait for delay before signaling stillness
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(() => {
          setIsPanActive(false)
          timerRef.current = null
        }, delay)
      }
    })

    return () => {
      unsubscribe()
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [delay])

  return isPanActive
}
