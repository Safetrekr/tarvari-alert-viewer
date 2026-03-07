'use client'

import { useCallback } from 'react'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import { getCategoryMeta } from '@/lib/interfaces/coverage'
import { relativeTimeAgo } from '@/lib/time-utils'

export interface MobileAlertCardProps {
  readonly item: CategoryIntelItem
  readonly onTap: (item: CategoryIntelItem) => void
  readonly isSelected?: boolean
}

const SEVERITY_DOT_COLORS: Record<string, string> = {
  Extreme: '#ef4444',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#3b82f6',
  Unknown: '#6b7280',
}

const PRIORITY_LABELS: Record<string, { label: string; weight: number }> = {
  P1: { label: 'P1', weight: 800 },
  P2: { label: 'P2', weight: 700 },
  P3: { label: 'P3', weight: 600 },
}

export function MobileAlertCard({ item, onTap, isSelected }: MobileAlertCardProps) {
  const handleTap = useCallback(() => onTap(item), [onTap, item])
  const meta = getCategoryMeta(item.category)
  const dotColor = SEVERITY_DOT_COLORS[item.severity] ?? '#6b7280'
  const priority = item.operationalPriority
    ? PRIORITY_LABELS[item.operationalPriority]
    : null

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-selected={isSelected}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        minHeight: 64,
        padding: '10px var(--space-content-padding, 12px)',
        background: isSelected
          ? 'rgba(100, 180, 220, 0.06)'
          : 'transparent',
        borderLeft: isSelected
          ? '2px solid rgba(100, 180, 220, 0.4)'
          : '2px solid transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 150ms',
      }}
    >
      {/* Severity dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
          boxShadow: `0 0 6px ${dotColor}40`,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 4,
            alignItems: 'center',
          }}
        >
          {priority && (
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 9,
                fontWeight: priority.weight,
                letterSpacing: '0.08em',
                color:
                  item.operationalPriority === 'P1'
                    ? '#ef4444'
                    : 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
              }}
            >
              {priority.label}
            </span>
          )}
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              color: 'rgba(255, 255, 255, 0.3)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {meta.shortName}
          </span>
        </div>
      </div>

      {/* Timestamp */}
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          color: 'rgba(255, 255, 255, 0.25)',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        {relativeTimeAgo(item.ingestedAt)}
      </span>
    </button>
  )
}
