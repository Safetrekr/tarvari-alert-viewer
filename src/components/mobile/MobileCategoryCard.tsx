'use client'

import { useCallback } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useLongPress } from '@/hooks/use-long-press'
import type { CategoryGridItem, TrendDirection } from '@/lib/interfaces/coverage'
import { getCategoryColor } from '@/lib/interfaces/coverage'

export interface MobileCategoryCardProps {
  item: CategoryGridItem
  onTap: (id: string) => void
  onLongPress: (id: string) => void
}

function TrendArrow({ direction }: { direction?: TrendDirection }) {
  if (direction === 'up')
    return <TrendingUp size={10} style={{ color: 'rgba(239, 68, 68, 0.5)' }} />
  if (direction === 'down')
    return (
      <TrendingDown size={10} style={{ color: 'rgba(34, 197, 94, 0.5)' }} />
    )
  return <Minus size={10} style={{ color: 'rgba(255, 255, 255, 0.15)' }} />
}

export function MobileCategoryCard({
  item,
  onTap,
  onLongPress: onLongPressProp,
}: MobileCategoryCardProps) {
  const { id, meta, metrics } = item

  const handleTap = useCallback(() => onTap(id), [id, onTap])
  const handleLongPress = useCallback(
    () => onLongPressProp(id),
    [id, onLongPressProp],
  )

  const { isPressed, ...handlers } = useLongPress({
    onTap: handleTap,
    onLongPress: handleLongPress,
  })

  const catColor = getCategoryColor(id)
  const p1 = metrics.p1Count
  const p2 = metrics.p2Count
  const other = Math.max(0, metrics.alertCount - p1 - p2)
  const total = metrics.alertCount
  const hasAlerts = total > 0

  return (
    <div
      {...handlers}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 'var(--space-card-padding, 14px)',
        background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.03))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        borderLeft: `2px solid ${catColor}`,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform var(--duration-card-press, 100ms) ease',
        opacity: hasAlerts ? 1 : 0.5,
      }}
    >
      {/* Header: short name + trend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'var(--text-card-title, 12px)',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: 'var(--tracking-label-mobile, 0.14em)',
            textTransform: 'uppercase',
          }}
        >
          {meta.shortName}
        </span>
        <TrendArrow direction={item.trend} />
      </div>

      {/* Metric row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'var(--text-card-metric, 22px)',
            fontWeight: 700,
            color: 'var(--color-text-primary, rgba(255,255,255,0.87))',
            lineHeight: 1,
          }}
        >
          {metrics.alertCount}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'var(--text-caption, 10px)',
            color: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          {metrics.sourceCount}s
        </span>
      </div>

      {/* Priority mini-bar (P1 / P2 / Other) */}
      {hasAlerts && (
        <div
          style={{
            display: 'flex',
            height: 3,
            borderRadius: 1.5,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.04)',
          }}
        >
          {p1 > 0 && (
            <div
              style={{
                flex: p1 / total,
                background: 'var(--severity-extreme, #ef4444)',
              }}
            />
          )}
          {p2 > 0 && (
            <div
              style={{
                flex: p2 / total,
                background: 'var(--severity-severe, #f97316)',
              }}
            />
          )}
          {other > 0 && (
            <div
              style={{
                flex: other / total,
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
