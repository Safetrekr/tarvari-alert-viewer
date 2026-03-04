/**
 * ZoomGate -- conditionally renders children based on the current
 * semantic zoom level.
 *
 * Accepts an array of zoom levels at which children should be visible.
 * When the current semantic level is not in the `show` array, children
 * are unmounted entirely (not hidden via CSS) to release GPU/memory
 * resources.
 *
 * Memoized to avoid re-renders when the zoom level hasn't changed.
 *
 * @example
 * ```tsx
 * <ZoomGate show={['Z1', 'Z2']}>
 *   <RangeRings />
 * </ZoomGate>
 * ```
 *
 * @module zoom-gate
 * @see WS-1.6 Ambient Effects Layer
 */

'use client'

import { type ReactNode, memo } from 'react'
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import type { SemanticZoomLevel } from '@/stores/camera.store'

interface ZoomGateProps {
  /** Semantic zoom levels at which children should be rendered. */
  show: SemanticZoomLevel[]
  children: ReactNode
}

export const ZoomGate = memo(function ZoomGate({ show, children }: ZoomGateProps) {
  const { level } = useSemanticZoom()

  if (!show.includes(level)) return null

  return <>{children}</>
})
