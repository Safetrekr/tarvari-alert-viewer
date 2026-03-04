/**
 * SpatialCanvas -- the CSS-transformed container.
 *
 * THIS IS THE CRITICAL PERFORMANCE COMPONENT.
 *
 * Uses `useCameraStore.subscribe()` (NOT `useCameraStore()`) for direct DOM
 * writes, bypassing React reconciliation entirely during pan/zoom animations.
 * The transform is written directly via a ref:
 *
 *   element.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`
 *
 * Children are positioned with `position: absolute` at world coordinates.
 *
 * IMPORTANT: `transform-origin: 0 0` is required for the zoom-to-cursor
 * formula to work correctly (per Q3 in the SOW).
 *
 * @module SpatialCanvas
 * @see WS-0.3 Section 4.1.3
 * @see WS-1.1 Deliverable 5
 * @see AD-1 (subscribe pattern)
 * @see Q3 (transform-origin requirement)
 * @see Q4 (pointer-events passthrough)
 */

'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { useCameraStore } from '@/stores/camera.store'
import { cn } from '@/lib/utils'

interface SpatialCanvasProps {
  children: ReactNode
  /** Additional CSS classes for the canvas container. */
  className?: string
}

export function SpatialCanvas({ children, className }: SpatialCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Direct DOM write subscription -- never triggers React re-renders.
    // This is the core performance pattern for the ZUI engine.
    const unsubscribe = useCameraStore.subscribe((state) => {
      canvas.style.transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`
    })

    // Set initial transform
    const { offsetX, offsetY, zoom } = useCameraStore.getState()
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`

    return unsubscribe
  }, [])

  return (
    <div
      ref={canvasRef}
      className={cn('absolute left-0 top-0', className)}
      style={{
        willChange: 'transform',
        transformOrigin: '0 0',
        // Allow pointer events to pass through the canvas to the viewport,
        // while children re-enable pointer-events (per Q4).
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  )
}
