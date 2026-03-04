/**
 * DotGrid -- CSS background dot pattern with radial pulse overlay.
 *
 * The dot grid uses a radial-gradient at 48px spacing.
 * The pulse overlay animates via CSS @keyframes in atrium.css.
 *
 * @module dot-grid
 * @see WS-1.2 Section 4.9
 */

import type { CSSProperties } from 'react'

export interface DotGridProps {
  /** Center point for radial pulse (defaults to container center). */
  pulseOrigin?: { x: string; y: string }
  /** Whether to show the radial pulse animation. */
  showPulse?: boolean
}

export function DotGrid({
  pulseOrigin = { x: '50%', y: '50%' },
  showPulse = true,
}: DotGridProps) {
  return (
    <>
      {/* Base dot grid */}
      <div
        className="dot-grid absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, rgba(var(--ambient-ink-rgb), 0.006) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
        aria-hidden="true"
      />

      {/* Radial pulse overlay */}
      {showPulse && (
        <div
          className="dot-grid-pulse"
          style={
            {
              '--pulse-x': pulseOrigin.x,
              '--pulse-y': pulseOrigin.y,
            } as CSSProperties
          }
          aria-hidden="true"
        />
      )}
    </>
  )
}
