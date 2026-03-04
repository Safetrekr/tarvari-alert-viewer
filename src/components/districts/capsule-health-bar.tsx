/**
 * CapsuleHealthBar -- 3px animated status bar for district capsules.
 *
 * Color is mapped from the HealthState via CSS custom properties.
 * Animation uses CSS @keyframes (Ambient tier) defined in atrium.css.
 * Stagger delay is driven by `data-index` attribute (1.2s per capsule).
 *
 * @module capsule-health-bar
 * @see WS-1.2 Section 4.5
 */

import { HEALTH_STATE_MAP, type HealthState } from '@/lib/interfaces/district'

export interface CapsuleHealthBarProps {
  /** Current health state. */
  health: HealthState
  /** Index 0-5 for stagger delay (1.2s per capsule). */
  capsuleIndex: number
}

export function CapsuleHealthBar({ health, capsuleIndex }: CapsuleHealthBarProps) {
  const { color } = HEALTH_STATE_MAP[health]

  return (
    <div
      className="capsule-health-bar"
      data-index={capsuleIndex}
      data-health={health}
      style={{
        backgroundColor: `var(${color})`,
      }}
      role="presentation"
      aria-hidden="true"
    />
  )
}
