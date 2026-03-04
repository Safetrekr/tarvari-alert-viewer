/**
 * SpatialViewport -- the outer container for the ZUI engine.
 *
 * Fixed to fill the screen with overflow hidden. Captures all pointer
 * and wheel events for pan/zoom via the usePan and useZoom hooks.
 * Background uses the void token (bg-void = #050911).
 *
 * Responsibilities:
 * - Measures viewport dimensions on mount and resize, stores in camera store
 * - Attaches pan and zoom interaction hooks
 * - Optionally syncs camera to URL params via useCameraSync
 * - Handles keyboard shortcuts (Home key for return-to-hub)
 * - Renders fixed overlay elements (particles, minimap, HUD) above the canvas
 *
 * @module SpatialViewport
 * @see WS-0.3 Section 4.1.3
 * @see WS-1.1 Deliverable 4
 */

'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'

import { usePan } from '@/hooks/use-pan'
import { useZoom } from '@/hooks/use-zoom'
import { useCameraSync } from '@/hooks/use-camera-sync'
import { useCameraStore } from '@/stores/camera.store'
import { cn } from '@/lib/utils'

interface SpatialViewportProps {
  children: ReactNode
  /** Fixed overlay elements rendered above the canvas (particles, minimap, HUD). */
  overlays?: ReactNode
  /** Expose the viewport ref for dimension measurement (culling, etc.) */
  viewportRef?: React.RefObject<HTMLDivElement | null>
  /** Sync camera position to URL query params. Default: true. */
  enableUrlSync?: boolean
  /** Enable keyboard shortcuts (Home = return to hub). Default: true. */
  enableKeyboardShortcuts?: boolean
  /** Additional CSS classes for the viewport container. */
  className?: string
}

/**
 * Check whether the given element is an interactive form control
 * (input, textarea, select, contenteditable). Used to skip keyboard
 * shortcuts when the user is typing.
 */
function isInteractiveElement(element: Element | null): boolean {
  if (!element) return false
  const tagName = element.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }
  if (element.getAttribute('contenteditable') === 'true') {
    return true
  }
  return false
}

export function SpatialViewport({
  children,
  overlays,
  viewportRef: externalRef,
  enableUrlSync = true,
  enableKeyboardShortcuts = true,
  className,
}: SpatialViewportProps) {
  const internalRef = useRef<HTMLDivElement>(null)
  const ref = externalRef ?? internalRef

  // Attach pan and zoom handlers to the viewport
  usePan(ref)
  useZoom(ref)

  // URL sync (unconditionally called, internally gated by `enabled` flag)
  useCameraSync(enableUrlSync)

  // Measure viewport dimensions on mount and resize
  const measureViewport = useCallback(() => {
    const viewport = ref.current
    if (!viewport) return

    const rect = viewport.getBoundingClientRect()
    const store = useCameraStore.getState()
    const isFirstMeasure = store.viewportWidth === 0 && store.viewportHeight === 0

    store.setViewportDimensions(rect.width, rect.height)

    // On first measure, center the world origin on screen so content isn't
    // pinned to the top-left corner.
    if (isFirstMeasure) {
      const { zoom } = store
      store.setCamera({
        offsetX: rect.width / 2,
        offsetY: rect.height / 2,
        zoom,
      })
    }
  }, [ref])

  useEffect(() => {
    measureViewport()

    window.addEventListener('resize', measureViewport)
    return () => {
      window.removeEventListener('resize', measureViewport)
    }
  }, [measureViewport])

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return

    function onKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an interactive element
      if (isInteractiveElement(document.activeElement)) return

      if (e.key === 'Home') {
        e.preventDefault()
        useCameraStore.getState().resetToLaunch()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [enableKeyboardShortcuts])

  return (
    <div
      ref={ref}
      className={cn('fixed inset-0 overflow-hidden bg-void', className)}
      style={{
        // Prevent text selection during pan drag
        userSelect: 'none',
        // Touch action: none to prevent browser gestures interfering
        touchAction: 'none',
        // Cursor feedback
        cursor: 'grab',
      }}
    >
      {children}

      {/* Fixed overlays rendered above the canvas */}
      {overlays}
    </div>
  )
}
