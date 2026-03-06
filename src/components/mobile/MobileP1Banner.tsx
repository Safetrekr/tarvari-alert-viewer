'use client'

import { useState, useCallback } from 'react'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { usePriorityFeed } from '@/hooks/use-priority-feed'
import { relativeTimeAgo } from '@/lib/time-utils'
import { getCategoryMeta } from '@/lib/interfaces/coverage'

/**
 * Persistent P1 alert banner. Renders only when P1 count > 0.
 * Shows most recent P1 headline. Persists until tapped or superseded (C2).
 */
export function MobileP1Banner({ onTap }: { onTap?: (id: string) => void }) {
  const { data: feed } = usePriorityFeed()
  const [dismissedId, setDismissedId] = useState<string | null>(null)

  const p1 = feed?.mostRecentP1
  const visible = p1 != null && p1.id !== dismissedId

  const handleTap = useCallback(() => {
    if (!p1) return
    setDismissedId(p1.id)
    onTap?.(p1.id)
  }, [p1, onTap])

  if (!visible || !p1) return null

  const catMeta = getCategoryMeta(p1.category)

  return (
    <button
      onClick={handleTap}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px var(--space-content-padding, 12px)',
        margin: '0 var(--space-content-padding, 12px)',
        maxWidth: 'calc(100% - 2 * var(--space-content-padding, 12px))',
        background: 'rgba(220, 38, 38, 0.08)',
        border: '1px solid rgba(220, 38, 38, 0.20)',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: 48,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <AlertTriangle
        size={16}
        style={{ color: 'var(--severity-extreme, #ef4444)', flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'var(--text-ghost, 10px)',
              color: 'var(--severity-extreme, #ef4444)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            P1
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'var(--text-ghost, 10px)',
              color: 'rgba(255, 255, 255, 0.3)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {catMeta.shortName}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'var(--text-ghost, 10px)',
              color: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            {relativeTimeAgo(p1.ingestedAt)}
          </span>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-sans, sans-serif)',
            fontSize: 'var(--text-body, 13px)',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: 0,
          }}
        >
          {p1.title}
        </p>
      </div>

      <ChevronRight
        size={14}
        style={{ color: 'rgba(255, 255, 255, 0.2)', flexShrink: 0 }}
      />
    </button>
  )
}
