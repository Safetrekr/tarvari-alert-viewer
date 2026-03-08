'use client'

import { useState, useCallback, useMemo } from 'react'
import { usePriorityFeed, type PriorityFeedItem } from '@/hooks/use-priority-feed'
import { MobileAlertCard } from './MobileAlertCard'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'

interface MobilePriorityFeedSheetProps {
  onAlertTap?: (item: CategoryIntelItem) => void
}

function feedItemToIntelItem(item: PriorityFeedItem): CategoryIntelItem {
  return {
    id: item.id,
    title: item.title,
    severity: item.severity,
    category: item.category,
    eventType: item.eventType,
    sourceKey: item.sourceKey,
    confidence: null,
    geoScope: item.geoScope,
    shortSummary: item.shortSummary,
    ingestedAt: item.ingestedAt,
    sentAt: item.sentAt,
    operationalPriority: item.operationalPriority,
  }
}

export function MobilePriorityFeedSheet({ onAlertTap }: MobilePriorityFeedSheetProps) {
  const { data: feed } = usePriorityFeed()
  const [showP1, setShowP1] = useState(true)
  const [showP2, setShowP2] = useState(true)

  const filteredItems = useMemo(() => {
    if (!feed) return []
    return feed.items.filter((item) => {
      if (item.operationalPriority === 'P1' && !showP1) return false
      if (item.operationalPriority === 'P2' && !showP2) return false
      return true
    })
  }, [feed, showP1, showP2])

  const handleAlertTap = useCallback(
    (item: CategoryIntelItem) => {
      onAlertTap?.(item)
    },
    [onAlertTap],
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 0',
      }}
    >
      {/* Filter toggles */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 var(--space-content-padding, 12px)',
        }}
      >
        <button
          type="button"
          onClick={() => setShowP1((v) => !v)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: showP1 ? '#ef4444' : 'rgba(255,255,255,0.25)',
            background: showP1 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${showP1 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
          }}
        >
          P1 {feed ? `(${feed.p1Count})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setShowP2((v) => !v)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: showP2 ? '#f97316' : 'rgba(255,255,255,0.25)',
            background: showP2 ? 'rgba(249,115,22,0.10)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${showP2 ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.06)'}`,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
          }}
        >
          P2 {feed ? `(${feed.p2Count})` : ''}
        </button>
      </div>

      {/* Alert list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {filteredItems.length === 0 && (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            All clear — no priority alerts
          </div>
        )}
        {filteredItems.map((item) => (
          <MobileAlertCard
            key={item.id}
            item={feedItemToIntelItem(item)}
            onTap={handleAlertTap}
          />
        ))}
      </div>
    </div>
  )
}
