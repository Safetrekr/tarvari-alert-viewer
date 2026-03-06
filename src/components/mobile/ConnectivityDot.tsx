'use client'

import { useDataFreshness } from '@/hooks/use-data-freshness'

const STATE_COLORS = {
  fresh: 'var(--color-healthy, #22c55e)',
  stale: 'var(--color-warning, #eab308)',
  offline: 'var(--color-error, #ef4444)',
} as const

/**
 * Reactive 8px connectivity dot for MobileHeader.
 * Green = fresh, Yellow = stale, Red = offline.
 */
export function ConnectivityDot() {
  const { state } = useDataFreshness()

  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: STATE_COLORS[state],
        flexShrink: 0,
        transition: 'background-color 300ms ease',
      }}
      aria-label={`Data status: ${state}`}
    />
  )
}
