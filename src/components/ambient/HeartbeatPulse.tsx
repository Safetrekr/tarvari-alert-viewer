/**
 * HeartbeatPulse -- CSS-driven health indicator bar with heartbeat animation.
 *
 * Renders a thin horizontal bar whose color reflects application health status
 * and pulses with a heartbeat rhythm on a 7s cycle. Each instance can be
 * staggered via the `delay` prop to create a wave effect across multiple bars.
 *
 * Animation pauses during active camera pan (via `usePanPause`) and when the
 * user prefers reduced motion (via `useReducedMotion`). Uses the `heartbeat`
 * keyframe from `src/styles/atrium.css`.
 *
 * This is a standalone React wrapper. The WS-1.2 capsule health bar uses the
 * `.capsule-health-bar` CSS class directly. This component serves as an
 * independently usable alternative with a typed prop API.
 *
 * @module HeartbeatPulse
 * @see WS-1.6 Deliverable 4.3
 * @see VISUAL-DESIGN-SPEC.md Section 5.2
 */

'use client'

import { useReducedMotion } from '@tarva/ui/motion'

import { cn } from '@/lib/utils'
import { usePanPause } from '@/hooks/use-pan-pause'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HealthStatus = 'healthy' | 'degraded' | 'warning' | 'error' | 'offline'

export interface HeartbeatPulseProps {
  /** Current health status. Determines bar color. */
  status: HealthStatus
  /** Animation stagger delay in seconds. Default: 0. */
  delay?: number
  /** Additional CSS classes. */
  className?: string
}

// ---------------------------------------------------------------------------
// Status to Tailwind background color mapping
// ---------------------------------------------------------------------------

const STATUS_COLOR_MAP: Record<HealthStatus, string> = {
  healthy: 'bg-healthy',
  degraded: 'bg-warning',
  warning: 'bg-warning',
  error: 'bg-error',
  offline: 'bg-offline',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HeartbeatPulse({
  status,
  delay = 0,
  className,
}: HeartbeatPulseProps) {
  const isPanActive = usePanPause()
  const reducedMotion = useReducedMotion()

  const shouldAnimate = !isPanActive && !reducedMotion && status !== 'offline'

  return (
    <div
      aria-hidden="true"
      className={cn(
        'h-[3px] w-full rounded-full',
        STATUS_COLOR_MAP[status],
        className,
      )}
      style={{
        transformOrigin: 'center center',
        animation: shouldAnimate
          ? `heartbeat var(--duration-ambient-heart, 7000ms) ${delay}s infinite`
          : 'none',
        opacity: shouldAnimate ? undefined : 0.45,
        willChange: shouldAnimate ? 'transform, opacity' : 'auto',
      }}
    />
  )
}
