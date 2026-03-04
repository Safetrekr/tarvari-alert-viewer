/**
 * GridPulse -- CSS-driven radial wave overlay.
 *
 * Renders a full-container overlay with a radial-gradient background that
 * expands outward from a configurable origin on a 12s cycle. Uses the
 * `grid-pulse` keyframe from `src/styles/atrium.css`.
 *
 * Returns null when the user prefers reduced motion (the wave is purely
 * decorative and adds no informational value). Pauses during active camera
 * pan via `usePanPause`.
 *
 * @module GridPulse
 * @see WS-1.6 Deliverable 4.5
 * @see VISUAL-DESIGN-SPEC.md Section 5.4
 */

'use client'

import { useReducedMotion } from '@tarva/ui/motion'

import { cn } from '@/lib/utils'
import { usePanPause } from '@/hooks/use-pan-pause'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GridPulseProps {
  /** Horizontal origin for the radial gradient. Default: '50%'. */
  originX?: string
  /** Vertical origin for the radial gradient. Default: '50%'. */
  originY?: string
  /** Additional CSS classes. */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GridPulse({
  originX = '50%',
  originY = '50%',
  className,
}: GridPulseProps) {
  const isPanActive = usePanPause()
  const reducedMotion = useReducedMotion()

  // Completely suppress for reduced motion
  if (reducedMotion) return null

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
      style={
        {
          '--pulse-x': originX,
          '--pulse-y': originY,
          backgroundImage: `radial-gradient(
            circle at var(--pulse-x, 50%) var(--pulse-y, 50%),
            rgba(255, 255, 255, 0.04) 0%,
            rgba(255, 255, 255, 0.015) 30%,
            rgba(255, 255, 255, 0.015) 100%
          )`,
          animation: isPanActive
            ? 'none'
            : 'grid-pulse var(--duration-ambient-grid, 12000ms) ease-out infinite',
          opacity: 0,
          animationPlayState: isPanActive ? 'paused' : 'running',
        } as React.CSSProperties
      }
    />
  )
}
