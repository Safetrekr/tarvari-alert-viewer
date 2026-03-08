'use client'

import { useBundleDetail } from '@/hooks/use-bundle-detail'
import {
  getBundleDisplayTitle,
  getBundleDisplaySummary,
  getBundleDisplaySeverity,
  getConfidenceTier,
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

interface MobileBundleDetailProps {
  bundleId: string
}

export function MobileBundleDetail({ bundleId }: MobileBundleDetailProps) {
  const { data, isLoading } = useBundleDetail(bundleId)

  if (isLoading) {
    return (
      <div
        style={{
          padding: '24px var(--space-content-padding, 12px)',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          Loading bundle…
        </span>
      </div>
    )
  }

  if (!data) return null

  const { bundle, decision } = data
  const title = getBundleDisplayTitle(bundle, decision)
  const summary = getBundleDisplaySummary(bundle, decision)
  const severity = getBundleDisplaySeverity(bundle, decision)
  const severityColor = SEVERITY_COLORS[severity] ?? '#6b7280'
  const statusColor = STATUS_COLORS[bundle.status] ?? '#6b7280'
  const confidence = getConfidenceTier(bundle.confidence_aggregate)

  return (
    <div
      style={{
        padding: '16px var(--space-content-padding, 12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: severityColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 700,
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
            fontSize: 9,
            fontWeight: 600,
            color: statusColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '3px 8px',
            borderRadius: 4,
            background: `${statusColor}15`,
            border: `1px solid ${statusColor}30`,
          }}
        >
          {bundle.status}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 15,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.85)',
          lineHeight: 1.4,
        }}
      >
        {title}
      </h3>

      {/* Summary */}
      {summary && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.45)',
            lineHeight: 1.5,
          }}
        >
          {summary}
        </p>
      )}

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Intel', value: String(bundle.intel_count) },
          { label: 'Sources', value: String(bundle.source_count) },
          { label: 'Confidence', value: confidence.label, color: confidence.color },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              minWidth: 60,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 8,
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {stat.label}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 14,
                fontWeight: 700,
                color: stat.color ?? 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1,
              }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Risk score bar */}
      {bundle.risk_score != null && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 9,
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Risk Score
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {(parseFloat(bundle.risk_score) * 100).toFixed(0)}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, parseFloat(bundle.risk_score) * 100)}%`,
                borderRadius: 3,
                background: severityColor,
              }}
            />
          </div>
        </div>
      )}

      {/* Analyst notes */}
      {bundle.analyst_notes && (
        <section>
          <h4
            style={{
              margin: '0 0 6px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Analyst Notes
          </h4>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.45)',
              lineHeight: 1.5,
              padding: '8px 10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 6,
            }}
          >
            {bundle.analyst_notes}
          </p>
        </section>
      )}
    </div>
  )
}
