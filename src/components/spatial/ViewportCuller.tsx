/**
 * ViewportCuller -- component wrapper for viewport culling.
 *
 * Takes an array of cullable children with world-space positions and
 * dimensions. Uses the `useViewportCull` hook to conditionally render
 * only the children that are within (or near) the visible viewport.
 *
 * @module ViewportCuller
 * @see WS-1.1 Deliverable 10
 */

'use client'

import { type ReactNode } from 'react'

import { useViewportCull } from '@/hooks/use-viewport-cull'
import { VIEWPORT_CULL_MARGIN } from '@/lib/constants'

/** A child element with its world-space bounds for culling. */
export interface CullableChild {
  /** Unique identifier for React key. */
  id: string | number
  /** World-space X position. */
  x: number
  /** World-space Y position. */
  y: number
  /** Width in world-space pixels. */
  width: number
  /** Height in world-space pixels. */
  height: number
  /** The React element to render when visible. */
  element: ReactNode
}

interface ViewportCullerProps {
  /** Array of cullable children to manage. */
  children: CullableChild[]
  /** Ref to the viewport element for dimension measurement. */
  viewportRef: React.RefObject<HTMLDivElement | null>
  /** Extra margin in world-space pixels beyond viewport edges. */
  margin?: number
}

export function ViewportCuller({
  children,
  viewportRef,
  margin = VIEWPORT_CULL_MARGIN,
}: ViewportCullerProps) {
  const { isVisible } = useViewportCull(viewportRef, margin)

  return (
    <>
      {children.map((child) => {
        if (!isVisible(child.x, child.y, child.width, child.height)) {
          return null
        }
        return <ViewportCullerChild key={child.id}>{child.element}</ViewportCullerChild>
      })}
    </>
  )
}

/**
 * Thin wrapper to isolate each culled child's render boundary.
 * Prevents a single child's re-render from affecting siblings.
 */
function ViewportCullerChild({ children }: { children: ReactNode }) {
  return <>{children}</>
}
