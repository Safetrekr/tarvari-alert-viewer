'use client'

import '@/styles/mobile-pull-refresh.css'

export interface MobilePullIndicatorProps {
  readonly pullDistance: number
  readonly isRefreshing: boolean
  readonly isPulling: boolean
}

const THRESHOLD = 60

export function MobilePullIndicator({
  pullDistance,
  isRefreshing,
  isPulling,
}: MobilePullIndicatorProps) {
  if (!isPulling && !isRefreshing) return null

  const progress = Math.min(pullDistance / THRESHOLD, 1)
  const opacity = Math.min(progress * 1.5, 1)
  const rotation = isRefreshing ? undefined : progress * 360

  return (
    <div
      className="mobile-pull-indicator"
      style={{
        transform: `translateY(${pullDistance - 40}px)`,
        opacity,
      }}
      aria-live="polite"
      aria-label={isRefreshing ? 'Refreshing' : 'Pull to refresh'}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        className={isRefreshing ? 'mobile-pull-spinner' : undefined}
        style={rotation !== undefined ? { transform: `rotate(${rotation}deg)` } : undefined}
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
          strokeDasharray={`${progress * 63} 63`}
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
        />
      </svg>
    </div>
  )
}
