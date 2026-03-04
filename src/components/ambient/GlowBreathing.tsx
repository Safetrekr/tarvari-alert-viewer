/**
 * GlowBreathing -- CSS-driven glow oscillation wrapper.
 *
 * Wraps children with a breathing box-shadow animation that oscillates
 * between dim and bright ember glow on a 5s ease-in-out cycle. Uses the
 * `breathe` keyframe from `src/styles/atrium.css`.
 *
 * Animation pauses during active camera pan (via `usePanPause`) and when
 * the user prefers reduced motion (via `useReducedMotion`). When paused or
 * reduced, a static mid-intensity glow is applied as a fallback.
 *
 * @module GlowBreathing
 * @see WS-1.6 Deliverable 4.4
 * @see VISUAL-DESIGN-SPEC.md Section 5.3
 */

'use client'

import type { ReactNode } from 'react'

import { useReducedMotion } from '@tarva/ui/motion'

import { cn } from '@/lib/utils'
import { usePanPause } from '@/hooks/use-pan-pause'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GlowBreathingProps {
  /** Content to wrap with the breathing glow effect. */
  children: ReactNode
  /** Additional CSS classes. */
  className?: string
}

// ---------------------------------------------------------------------------
// Static fallback glow (midpoint between min and max from the breathe keyframe)
// ---------------------------------------------------------------------------

const STATIC_GLOW =
  '0 0 30px rgba(var(--ember-rgb), 0.10), 0 0 12px rgba(var(--ember-rgb), 0.16)'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlowBreathing({ children, className }: GlowBreathingProps) {
  const isPanActive = usePanPause()
  const reducedMotion = useReducedMotion()

  const shouldAnimate = !isPanActive && !reducedMotion

  return (
    <div
      className={cn(className)}
      style={{
        animation: shouldAnimate
          ? 'breathe var(--duration-ambient-breathe, 5000ms) ease-in-out infinite'
          : 'none',
        boxShadow: shouldAnimate ? undefined : STATIC_GLOW,
        willChange: shouldAnimate ? 'box-shadow' : 'auto',
      }}
    >
      {children}
    </div>
  )
}
