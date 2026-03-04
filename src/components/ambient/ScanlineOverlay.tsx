/**
 * ScanlineOverlay -- imperative-trigger scanline sweep with rising-edge detection.
 *
 * Renders 3 horizontal scanlines (1 primary + 2 trailing ghosts) that sweep
 * top-to-bottom in 350ms. The sweep triggers only on the rising edge of the
 * `active` prop (false -> true transition). After the sweep completes
 * (350ms + 60ms ghost delay + 50ms buffer = 460ms), the lines auto-clear.
 *
 * Uses the `scan` keyframe from `ambient-effects.css`. NOT paused during pan
 * because scanlines are event-triggered, not ambient loops.
 *
 * Returns null when the user prefers reduced motion.
 *
 * NOTE: This is distinct from the WS-1.2 ScanlineOverlay in
 * `src/components/districts/scanline-overlay.tsx`, which uses motion/react
 * for choreography-tier animation. This version uses CSS keyframes (ambient
 * tier) with imperative trigger control.
 *
 * @module ScanlineOverlay
 * @see WS-1.6 Deliverable 4.5
 * @see VISUAL-DESIGN-SPEC.md Section 5.5
 */

'use client'

import { useEffect, useRef, useState } from 'react'

import { useReducedMotion } from '@tarva/ui/motion'

import { cn } from '@/lib/utils'

import './ambient-effects.css'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total clear delay: 350ms animation + 60ms ghost delay + 50ms buffer. */
const SWEEP_CLEAR_MS = 460

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScanlineOverlayProps {
  /** When transitions from false to true, triggers a scanline sweep. */
  active: boolean
  /** Height of the container for scan distance. Default: 228. */
  containerHeight?: number
  /** Additional CSS classes. */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScanlineOverlay({
  active,
  containerHeight = 228,
  className,
}: ScanlineOverlayProps) {
  const [sweeping, setSweeping] = useState(false)
  const prevActiveRef = useRef(false)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reducedMotion = useReducedMotion()

  // Rising-edge detection: trigger sweep on false -> true transition
  useEffect(() => {
    const wasActive = prevActiveRef.current
    prevActiveRef.current = active

    if (!wasActive && active && !reducedMotion) {
      // Clear any pending timer from a previous sweep
      if (clearTimerRef.current !== null) {
        clearTimeout(clearTimerRef.current)
      }

      setSweeping(true)

      // Auto-clear after animation completes
      clearTimerRef.current = setTimeout(() => {
        setSweeping(false)
        clearTimerRef.current = null
      }, SWEEP_CLEAR_MS)
    }

    return () => {
      if (clearTimerRef.current !== null) {
        clearTimeout(clearTimerRef.current)
        clearTimerRef.current = null
      }
    }
  }, [active, reducedMotion])

  // Suppress entirely for reduced motion or when not sweeping
  if (reducedMotion || !sweeping) return null

  const lineColor = 'var(--color-ember, #e05200)'

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ '--scan-height': `${containerHeight}px` } as React.CSSProperties}
    >
      {/* Primary scanline */}
      <div
        className="ambient-scanline absolute right-0 left-0 h-px"
        style={{
          backgroundColor: lineColor,
          opacity: 0.12,
          boxShadow: `0 0 4px ${lineColor}`,
          animation: 'scan 350ms ease-out forwards',
        }}
      />
      {/* Ghost 1 -- trails by 30ms */}
      <div
        className="ambient-scanline absolute right-0 left-0 h-px"
        style={{
          backgroundColor: lineColor,
          opacity: 0.06,
          animation: 'scan 350ms ease-out 30ms forwards',
        }}
      />
      {/* Ghost 2 -- trails by 60ms */}
      <div
        className="ambient-scanline absolute right-0 left-0 h-px"
        style={{
          backgroundColor: lineColor,
          opacity: 0.03,
          animation: 'scan 350ms ease-out 60ms forwards',
        }}
      />
    </div>
  )
}
