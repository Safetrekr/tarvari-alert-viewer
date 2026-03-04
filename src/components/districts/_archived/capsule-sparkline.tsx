/**
 * CapsuleSparkline -- decorative mini chart for district capsules.
 *
 * Online: renders @tarva/ui Sparkline in teal with 0.30 opacity.
 * Offline: renders a static flat line placeholder.
 *
 * @module capsule-sparkline
 * @see WS-1.2 Section 4.7
 */

import type { CSSProperties } from 'react'

import { Sparkline } from '@tarva/ui'

export interface CapsuleSparklineProps {
  /** Array of numeric data points for the sparkline. */
  data: number[]
  /** Whether district is offline. */
  isOffline: boolean
}

export function CapsuleSparkline({ data, isOffline }: CapsuleSparklineProps) {
  if (isOffline) {
    return (
      <div
        className="h-6 w-full rounded bg-white/[0.02] opacity-[0.05]"
        aria-hidden="true"
      />
    )
  }

  return (
    <div data-slot="capsule-sparkline">
      <Sparkline
        data={data}
        width={152}
        height={24}
        strokeWidth={1}
        variant="neutral"
        showFill={false}
        animated={false}
        aria-hidden="true"
        style={
          {
            '--trend-neutral': 'var(--color-teal)',
          } as CSSProperties
        }
      />
    </div>
  )
}
