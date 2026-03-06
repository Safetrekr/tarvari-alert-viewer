'use client'

import { getCategoryMeta, SEVERITY_COLORS } from '@/lib/interfaces/coverage'
import { relativeTimeAgo } from '@/lib/time-utils'
import type { SeverityLevel } from '@/lib/interfaces/coverage'

export interface MobileAlertPillProps {
  id: string
  title: string
  category: string
  severity: string
  operationalPriority: string
  ingestedAt: string
  onTap?: (id: string) => void
}

/**
 * Compact pill for P1/P2 alerts. Used in MobilePriorityStrip.
 */
export function MobileAlertPill({
  id,
  title,
  category,
  severity,
  operationalPriority,
  ingestedAt,
  onTap,
}: MobileAlertPillProps) {
  const catMeta = getCategoryMeta(category)
  const sevColor = SEVERITY_COLORS[severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown

  return (
    <button
      onClick={() => onTap?.(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: 'var(--glass-card-bg, rgba(255, 255, 255, 0.03))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 6,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        minHeight: 36,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Severity dot */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: sevColor,
          flexShrink: 0,
        }}
      />

      {/* Priority + Category */}
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 'var(--text-ghost, 10px)',
          fontWeight: 600,
          color:
            operationalPriority === 'P1'
              ? 'var(--severity-extreme, #ef4444)'
              : 'var(--severity-severe, #f97316)',
          letterSpacing: '0.06em',
        }}
      >
        {operationalPriority}
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

      {/* Title */}
      <span
        style={{
          fontFamily: 'var(--font-sans, sans-serif)',
          fontSize: 'var(--text-caption, 10px)',
          color: 'rgba(255, 255, 255, 0.5)',
          maxWidth: 140,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </span>

      {/* Time */}
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          color: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        {relativeTimeAgo(ingestedAt)}
      </span>
    </button>
  )
}
