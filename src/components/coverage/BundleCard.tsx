/**
 * BundleCard -- displays an intel bundle with its triage decision,
 * severity, confidence, risk score, and category badges.
 *
 * Used in both Triaged and All Bundles view modes. Visual treatment
 * changes based on bundle status (approved/rejected/pending).
 *
 * @module BundleCard
 */

'use client'

import { useMemo } from 'react'
import type { BundleWithDecision } from '@/lib/interfaces/intel-bundles'
import {
  getBundleDisplayTitle,
  getBundleDisplaySummary,
  getBundleDisplaySeverity,
  isAutoTriaged,
} from '@/lib/interfaces/intel-bundles'
import { SEVERITY_COLORS } from '@/lib/interfaces/coverage'
import type { SeverityLevel } from '@/lib/interfaces/coverage'
import { getCategoryColor, getCategoryMeta } from '@/lib/interfaces/coverage'
import { ConfidenceIndicator } from './ConfidenceIndicator'
import { RiskScoreBadge } from './RiskScoreBadge'

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

// ---------------------------------------------------------------------------
// Status styling
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, { label: string; color: string; border: string }> = {
  approved: {
    label: 'APPROVED',
    color: 'rgba(34, 197, 94, 0.7)',
    border: 'solid',
  },
  rejected: {
    label: 'REJECTED',
    color: 'rgba(239, 68, 68, 0.7)',
    border: 'dashed',
  },
  pending: {
    label: 'PENDING',
    color: 'rgba(234, 179, 8, 0.6)',
    border: 'solid',
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BundleCardProps {
  item: BundleWithDecision
  onClick?: (bundleId: string) => void
  isSelected?: boolean
}

export function BundleCard({ item, onClick, isSelected }: BundleCardProps) {
  const { bundle, decision } = item
  const status = STATUS_STYLES[bundle.status] ?? STATUS_STYLES.pending

  const title = useMemo(() => getBundleDisplayTitle(bundle, decision), [bundle, decision])
  const summary = useMemo(() => getBundleDisplaySummary(bundle, decision), [bundle, decision])
  const severity = useMemo(() => getBundleDisplaySeverity(bundle, decision), [bundle, decision])

  const severityColor = SEVERITY_COLORS[severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown
  const isRejected = bundle.status === 'rejected'
  const autoTriaged = decision ? isAutoTriaged(decision) : false

  const timestamp = bundle.created_at
    ? new Date(bundle.created_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(bundle.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(bundle.id)
        }
      }}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: `3px ${status.border} ${status.color}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        opacity: isRejected ? 0.55 : 1,
        filter: isRejected ? 'saturate(0.6)' : undefined,
        transition: 'opacity 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
        boxShadow: isSelected
          ? 'inset 0 0 12px rgba(255, 255, 255, 0.04)'
          : undefined,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(255, 255, 255, 0.12)'
        if (isRejected) {
          el.style.opacity = '0.75'
          el.style.filter = 'saturate(0.8)'
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'rgba(255, 255, 255, 0.08)'
        if (isRejected) {
          el.style.opacity = '0.55'
          el.style.filter = 'saturate(0.6)'
        }
      }}
    >
      {/* Header: severity dot + label + status badge + confidence */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: severityColor,
            boxShadow: `0 0 6px ${severityColor}`,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            ...MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: severityColor,
            textTransform: 'uppercase',
          }}
        >
          {severity}
        </span>

        {/* Status badge */}
        <span
          style={{
            ...MONO,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.1em',
            padding: '1px 5px',
            color: status.color,
            background: `${status.color}15`,
            border: `1px solid ${status.color}30`,
            borderRadius: 3,
          }}
        >
          {status.label}
        </span>

        {autoTriaged && (
          <span
            style={{
              ...MONO,
              fontSize: 8,
              letterSpacing: '0.1em',
              color: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            AUTO
          </span>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <ConfidenceIndicator value={bundle.confidence_aggregate} />
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          ...MONO,
          fontSize: 13,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.55)',
          letterSpacing: '0.02em',
          lineHeight: 1.4,
          marginBottom: 6,
        }}
      >
        {title}
      </div>

      {/* Summary (truncated) */}
      {summary && (
        <div
          style={{
            ...MONO,
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.25)',
            lineHeight: 1.5,
            marginBottom: 10,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {summary}
        </div>
      )}

      {/* Category badges + counts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {(bundle.categories ?? []).map((cat) => {
          const catMeta = getCategoryMeta(cat)
          const catColor = getCategoryColor(cat)
          return (
            <span
              key={cat}
              style={{
                ...MONO,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.06em',
                padding: '1px 5px',
                color: catColor,
                background: `${catColor}15`,
                border: `1px solid ${catColor}25`,
                borderRadius: 3,
                textTransform: 'uppercase',
              }}
            >
              {catMeta.shortName}
            </span>
          )
        })}
        <span style={{ marginLeft: 'auto' }} />
        <span
          style={{
            ...MONO,
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.18)',
            letterSpacing: '0.04em',
          }}
        >
          {bundle.source_count}src / {bundle.intel_count ?? 0}items
        </span>
      </div>

      {/* Risk score bar */}
      <RiskScoreBadge value={bundle.risk_score} />

      {/* Footer: timestamp + view triage link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
        }}
      >
        {timestamp && (
          <span
            style={{
              ...MONO,
              fontSize: 10,
              color: 'rgba(255, 255, 255, 0.12)',
              letterSpacing: '0.04em',
            }}
          >
            {timestamp}
          </span>
        )}
        {decision?.note && (
          <span
            style={{
              ...MONO,
              fontSize: 10,
              color: 'rgba(255, 255, 255, 0.25)',
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            View triage &rsaquo;
          </span>
        )}
      </div>
    </div>
  )
}
