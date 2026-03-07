'use client'

import { getCategoryMeta } from '@/lib/interfaces/coverage'

export interface MobileAlertDetailStubProps {
  readonly title: string
  readonly severity: string
  readonly category: string
  readonly ingestedAt: string
}

const SEVERITY_COLORS: Record<string, string> = {
  Extreme: '#ef4444',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#3b82f6',
}

function formatRelativeTime(iso: string): string {
  if (!iso) return '--'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function MobileAlertDetailStub({
  title,
  severity,
  category,
  ingestedAt,
}: MobileAlertDetailStubProps) {
  const meta = getCategoryMeta(category)
  const severityColor = SEVERITY_COLORS[severity] ?? '#6b7280'

  return (
    <div
      style={{
        padding: '16px var(--space-content-padding, 12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Severity + Category badges */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          {severity}
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
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.04em',
          }}
        >
          {formatRelativeTime(ingestedAt)}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 14,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.4,
        }}
      >
        {title}
      </h3>

      {/* Placeholder for full detail (WS-D.2) */}
      <div
        style={{
          padding: '24px 0',
          textAlign: 'center',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.15)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Full detail view coming in WS-D.2
      </div>
    </div>
  )
}
