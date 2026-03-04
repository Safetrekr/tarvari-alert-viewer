/**
 * Custom hook for click-drag pan with momentum.
 *
 * Attaches to pointer events from the viewport container. Tracks the last
 * N pointer samples for velocity computation. On pointer release with
 * sufficient velocity, starts a rAF momentum loop that decays at the
 * configured friction per frame. Stops when velocity magnitude drops
 * below the stop threshold.
 *
 * Uses a drag threshold (4px) to distinguish clicks from drags. Pointer
 * capture and panning state are only activated once the threshold is
 * exceeded, allowing click events to propagate to interactive children
 * (capsules, beacons, buttons) when the user clicks without dragging.
 *
 * Sets `isPanning` on the camera store during active drag (true once
 * threshold exceeded, false on pointerup). Also sets `isAnimating`
 * during the momentum coast phase.
 *
 * @module use-pan
 * @see WS-0.3 Section 4.1.4
 * @see WS-1.1 Deliverable 6
 */

import { useCallback, useEffect, useRef } from 'react'

import { useCameraStore } from '@/stores/camera.store'
import {
  applyMomentumDecay,
  computeVelocityFromSamples,
  type PointerSample,
  type Velocity,
} from '@/lib/spatial-math'
import { MOMENTUM_SAMPLES } from '@/lib/constants'

/** Minimum distance (px) the pointer must move before panning activates. */
const DRAG_THRESHOLD = 4

export function usePan(viewportRef: React.RefObject<HTMLDivElement | null>): void {
  // Whether the pointer is down (tracking started, but may not be panning yet)
  const isPointerDownRef = useRef(false)
  // Whether we've exceeded the drag threshold and are actively panning
  const isDraggingRef = useRef(false)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const startPointerRef = useRef<{ x: number; y: number } | null>(null)
  const pointerIdRef = useRef<number | null>(null)
  const samplesRef = useRef<PointerSample[]>([])
  const momentumRafRef = useRef<number | null>(null)

  const cancelMomentum = useCallback(() => {
    if (momentumRafRef.current !== null) {
      cancelAnimationFrame(momentumRafRef.current)
      momentumRafRef.current = null
    }
  }, [])

  const startMomentum = useCallback(
    (velocity: Velocity) => {
      cancelMomentum()

      const magnitude = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy)
      if (magnitude < 0.5) {
        useCameraStore.getState().setAnimating(false)
        return
      }

      let currentVelocity = { ...velocity }

      function tick() {
        currentVelocity = applyMomentumDecay(currentVelocity)

        if (currentVelocity.vx === 0 && currentVelocity.vy === 0) {
          momentumRafRef.current = null
          useCameraStore.getState().setAnimating(false)
          return
        }

        useCameraStore.getState().panBy(currentVelocity.vx, currentVelocity.vy)
        momentumRafRef.current = requestAnimationFrame(tick)
      }

      useCameraStore.getState().setAnimating(true)
      momentumRafRef.current = requestAnimationFrame(tick)
    },
    [cancelMomentum],
  )

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    function onPointerDown(e: PointerEvent) {
      // Only respond to primary button (left click / single touch)
      if (e.button !== 0) return

      cancelMomentum()

      // Record the start position but do NOT capture the pointer yet.
      // This allows click events to propagate to interactive children
      // (capsules, beacons, buttons) if the user doesn't drag.
      isPointerDownRef.current = true
      isDraggingRef.current = false
      startPointerRef.current = { x: e.clientX, y: e.clientY }
      lastPointerRef.current = { x: e.clientX, y: e.clientY }
      pointerIdRef.current = e.pointerId
      samplesRef.current = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }]
    }

    function onPointerMove(e: PointerEvent) {
      if (!isPointerDownRef.current || !lastPointerRef.current || !startPointerRef.current) return

      const dx = e.clientX - lastPointerRef.current.x
      const dy = e.clientY - lastPointerRef.current.y

      // Check if we've exceeded the drag threshold
      if (!isDraggingRef.current) {
        const totalDx = e.clientX - startPointerRef.current.x
        const totalDy = e.clientY - startPointerRef.current.y
        const distance = Math.sqrt(totalDx * totalDx + totalDy * totalDy)

        if (distance < DRAG_THRESHOLD) {
          // Still within click tolerance — don't pan yet
          return
        }

        // Threshold exceeded: commit to panning
        isDraggingRef.current = true
        const store = useCameraStore.getState()
        store.setPanning(true)
        store.setAnimating(true)

        // Now capture the pointer for reliable tracking outside bounds
        if (pointerIdRef.current !== null) {
          ;(e.currentTarget as HTMLElement).setPointerCapture(pointerIdRef.current)
        }
      }

      useCameraStore.getState().panBy(dx, dy)

      lastPointerRef.current = { x: e.clientX, y: e.clientY }

      // Track samples for velocity computation
      samplesRef.current.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
      if (samplesRef.current.length > MOMENTUM_SAMPLES) {
        samplesRef.current = samplesRef.current.slice(-MOMENTUM_SAMPLES)
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (!isPointerDownRef.current) return

      const wasDragging = isDraggingRef.current
      isPointerDownRef.current = false
      isDraggingRef.current = false
      lastPointerRef.current = null
      startPointerRef.current = null

      if (wasDragging) {
        useCameraStore.getState().setPanning(false)

        if (pointerIdRef.current !== null) {
          ;(e.currentTarget as HTMLElement).releasePointerCapture(pointerIdRef.current)
        }

        // Compute velocity from samples and start momentum
        const velocity = computeVelocityFromSamples(samplesRef.current)
        samplesRef.current = []
        startMomentum(velocity)
      } else {
        // Pointer released without exceeding drag threshold — this is a click.
        // Don't touch panning state; let the click event propagate naturally.
        samplesRef.current = []
        useCameraStore.getState().setAnimating(false)
      }

      pointerIdRef.current = null
    }

    viewport.addEventListener('pointerdown', onPointerDown)
    viewport.addEventListener('pointermove', onPointerMove)
    viewport.addEventListener('pointerup', onPointerUp)
    viewport.addEventListener('pointercancel', onPointerUp)

    return () => {
      viewport.removeEventListener('pointerdown', onPointerDown)
      viewport.removeEventListener('pointermove', onPointerMove)
      viewport.removeEventListener('pointerup', onPointerUp)
      viewport.removeEventListener('pointercancel', onPointerUp)
      cancelMomentum()
    }
  }, [viewportRef, cancelMomentum, startMomentum])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelMomentum()
    }
  }, [cancelMomentum])
}
