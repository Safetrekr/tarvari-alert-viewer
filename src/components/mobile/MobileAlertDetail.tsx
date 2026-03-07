'use client'

import { useCallback } from 'react'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import { getCategoryMeta } from '@/lib/interfaces/coverage'
import { relativeTimeAgo } from '@/lib/time-utils'

export interface MobileAlertDetailProps {
  readonly item: CategoryIntelItem
  readonly onShowOnMap?: (
    alertId: string,
    coords: { lat: number; lng: number } | null,
    category: string,
    basic: { title: string; severity: string; ingestedAt: string },
  ) => void
  readonly onViewCategory?: (categoryId: string) => void
  readonly canShowOnMap?: boolean
}

const SEVERITY_COLORS: Record<string, string> = {
  Extreme: '#ef4444',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#3b82f6',
  Unknown: '#6b7280',
}

export function MobileAlertDetail({
  item,
  onShowOnMap,
  onViewCategory,
  canShowOnMap = false,
}: MobileAlertDetailProps) {
  const meta = getCategoryMeta(item.category)
  const severityColor = SEVERITY_COLORS[item.severity] ?? '#6b7280'

  const handleShowOnMap = useCallback(() => {
    onShowOnMap?.(item.id, null, item.category, {
      title: item.title,
      severity: item.severity,
      ingestedAt: item.ingestedAt,
    })
  }, [onShowOnMap, item])

  const handleViewCategory = useCallback(() => {
    onViewCategory?.(item.category)
  }, [onViewCategory, item.category])

  return (
    <div
      style={{
        padding: '16px var(--space-content-padding, 12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header: severity + category + time */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            borderRadius: 4,
            background: `${severityColor}20`,
            border: `1px solid ${severityColor}40`,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: severityColor,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: severityColor,
            }}
          />
          {item.severity}
        </span>

        <span
          style={{
            padding: '2px 6px',
            borderRadius: 4,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          {meta.shortName}
        </span>

        {item.operationalPriority && (
          <span
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              background:
                item.operationalPriority === 'P1'
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(255,255,255,0.04)',
              border: `1px solid ${
                item.operationalPriority === 'P1'
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(255,255,255,0.08)'
              }`,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color:
                item.operationalPriority === 'P1'
                  ? '#ef4444'
                  : 'rgba(255,255,255,0.4)',
            }}
          >
            {item.operationalPriority}
          </span>
        )}

        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.04em',
          }}
        >
          {relativeTimeAgo(item.ingestedAt)}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 15,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          lineHeight: 1.4,
        }}
      >
        {item.title}
      </h3>

      {/* Summary */}
      {item.shortSummary && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.6,
          }}
        >
          {item.shortSummary}
        </p>
      )}

      {/* Metadata rows */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '12px 0',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {item.eventType && (
          <MetaRow label="Event Type" value={item.eventType} />
        )}
        {item.sourceKey && (
          <MetaRow label="Source" value={item.sourceKey} />
        )}
        {item.confidence != null && (
          <MetaRow label="Confidence" value={`${Math.round(item.confidence * 100)}%`} />
        )}
        {item.geoScope && item.geoScope.length > 0 && (
          <MetaRow label="Geo Scope" value={item.geoScope.join(', ')} />
        )}
        {item.sentAt && (
          <MetaRow label="Sent" value={relativeTimeAgo(item.sentAt)} />
        )}
      </div>

      {/* Confidence bar */}
      {item.confidence != null && (
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}
          >
            Confidence
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round(item.confidence * 100)}%`,
                borderRadius: 2,
                background:
                  item.confidence >= 0.8
                    ? '#22c55e'
                    : item.confidence >= 0.5
                      ? '#eab308'
                      : '#ef4444',
                transition: 'width 300ms',
              }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        {canShowOnMap && onShowOnMap && (
          <ActionButton label="Show on Map" onClick={handleShowOnMap} />
        )}
        {onViewCategory && (
          <ActionButton label="View Category" onClick={handleViewCategory} />
        )}
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'right',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function ActionButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: 40,
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  )
}
