'use client'

import type { BundleWithDecision } from '@/lib/interfaces/intel-bundles'
import {
  getBundleDisplayTitle,
  getBundleDisplaySummary,
  getBundleDisplaySeverity,
} from '@/lib/interfaces/intel-bundles'

const SEVERITY_COLORS: Record<string, string> = {
  Extreme: '#ef4444',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#3b82f6',
  Unknown: '#6b7280',
}

const STATUS_COLORS: Record<string, string> = {
  approved: '#22c55e',
  rejected: '#ef4444',
  pending: '#eab308',
}

interface MobileBundleCardProps {
  item: BundleWithDecision
  onTap: (bundleId: string) => void
}

export function MobileBundleCard({ item, onTap }: MobileBundleCardProps) {
  const { bundle, decision } = item
  const title = getBundleDisplayTitle(bundle, decision)
  const summary = getBundleDisplaySummary(bundle, decision)
  const severity = getBundleDisplaySeverity(bundle, decision)
  const isRejected = bundle.status === 'rejected'
  const statusColor = STATUS_COLORS[bundle.status] ?? '#6b7280'
  const severityColor = SEVERITY_COLORS[severity] ?? '#6b7280'

  return (
    <button
      type="button"
      onClick={() => onTap(bundle.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
        padding: '12px var(--space-content-padding, 12px)',
        paddingLeft: 'calc(var(--space-content-padding, 12px) + 3px)',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        opacity: isRejected ? 0.55 : 1,
        filter: isRejected ? 'saturate(0.4)' : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Header: severity dot + severity label + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: severityColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            fontWeight: 600,
            color: severityColor,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {severity}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 8,
            fontWeight: 600,
            color: statusColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '2px 6px',
            borderRadius: 4,
            background: `${statusColor}15`,
            border: `1px solid ${statusColor}30`,
          }}
        >
          {bundle.status}
        </span>
        {item.operationalPriority && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              fontWeight: 700,
              color: item.operationalPriority === 'P1' ? '#ef4444' : '#f97316',
              letterSpacing: '0.06em',
            }}
          >
            {item.operationalPriority}
          </span>
        )}
      </div>

      {/* Title */}
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 13,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.75)',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {title}
      </span>

      {/* Summary (1 line) */}
      {summary && (
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.35)',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {summary}
        </span>
      )}

      {/* Footer: intel count + source count + risk score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            color: 'rgba(255, 255, 255, 0.25)',
          }}
        >
          {bundle.intel_count} intel
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            color: 'rgba(255, 255, 255, 0.25)',
          }}
        >
          {bundle.source_count} src
        </span>
        {bundle.risk_score != null && (
          <>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 8,
                  color: 'rgba(255, 255, 255, 0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Risk
              </span>
              <div
                style={{
                  width: 40,
                  height: 3,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, parseFloat(bundle.risk_score) * 100)}%`,
                    borderRadius: 2,
                    background: severityColor,
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </button>
  )
}
