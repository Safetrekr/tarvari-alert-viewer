'use client'

import { usePriorityFeed } from '@/hooks/use-priority-feed'
import { MobileAlertPill } from './MobileAlertPill'

/**
 * 44px horizontal scroll strip with P1/P2 alert pills.
 * Uses scroll-snap for touch-native browsing.
 */
export function MobilePriorityStrip({
  onTapAlert,
  onExpandFeed,
}: {
  onTapAlert?: (id: string) => void
  onExpandFeed?: () => void
}) {
  const { data: feed } = usePriorityFeed()
  const items = feed?.items ?? []

  if (items.length === 0) return null

  return (
    <div
      style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 var(--space-content-padding, 12px)',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {items.map((item) => (
        <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
          <MobileAlertPill
            id={item.id}
            title={item.title}
            category={item.category}
            severity={item.severity}
            operationalPriority={item.operationalPriority}
            ingestedAt={item.ingestedAt}
            onTap={onTapAlert}
          />
        </div>
      ))}
      {onExpandFeed && items.length > 0 && (
        <button
          type="button"
          onClick={onExpandFeed}
          style={{
            flexShrink: 0,
            scrollSnapAlign: 'start',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          See All &rsaquo;
        </button>
      )}
    </div>
  )
}
