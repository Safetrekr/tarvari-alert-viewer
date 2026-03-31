'use client'

import { TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react'
import { useLatestDigest } from '@/hooks/use-digests'
import {
  THREAT_LEVEL_COLORS,
  RISK_TREND_CONFIG,
  type DigestResponse,
} from '@/lib/interfaces/digest'
import { relativeTimeAgo } from '@/lib/time-utils'

export interface MobileBriefingCardProps {
  readonly onTap?: (digest: DigestResponse) => void
  readonly onViewAll?: () => void
}

/**
 * Compact briefing card for the Situation tab.
 * Shows the latest published digest with executive summary,
 * threat level, city, period, and risk trend.
 */
export function MobileBriefingCard({ onTap, onViewAll }: MobileBriefingCardProps) {
  const { data: digest, isLoading } = useLatestDigest()

  if (isLoading) {
    return (
      <div
        style={{
          height: 80,
          margin: '0 var(--space-content-padding, 12px)',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
        }}
      />
    )
  }

  if (!digest) return null

  const threatColor = THREAT_LEVEL_COLORS[digest.threat_level]
  const trend = digest.digest_content.risk_trend
  const trendConfig = trend ? RISK_TREND_CONFIG[trend] : null

  const TrendIcon =
    trend === 'increasing'
      ? TrendingUp
      : trend === 'decreasing'
        ? TrendingDown
        : Minus

  return (
    <div style={{ margin: '0 var(--space-content-padding, 12px)' }}>
      <button
        type="button"
        onClick={() => onTap?.(digest)}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 8,
          background: 'rgba(100,180,220,0.04)',
          border: '1px solid rgba(100,180,220,0.12)',
          cursor: 'pointer',
          textAlign: 'left',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Top row: icon + label + city/period + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={14} style={{ color: 'rgba(100,180,220,0.6)', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              color: 'rgba(100,180,220,0.7)',
            }}
          >
            BRIEFING
          </span>

          {/* Threat level pill */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              borderRadius: 4,
              background: `${threatColor}18`,
              border: `1px solid ${threatColor}35`,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: threatColor,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: threatColor,
              }}
            />
            {digest.threat_level}
          </span>

          <span style={{ flex: 1 }} />

          {/* Period + city */}
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.04em',
            }}
          >
            {digest.period} · {digest.city}
          </span>
        </div>

        {/* Executive summary (truncated) */}
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {digest.digest_content.executive_summary}
        </p>

        {/* Bottom row: trend + time ago + view all */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {trendConfig && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendIcon size={11} style={{ color: trendConfig.color }} />
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 9,
                  fontWeight: 600,
                  color: trendConfig.color,
                  letterSpacing: '0.06em',
                }}
              >
                {trendConfig.label}
              </span>
            </div>
          )}

          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.04em',
            }}
          >
            {relativeTimeAgo(digest.created_at)}
          </span>

          <span style={{ flex: 1 }} />

          {onViewAll && (
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onViewAll()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation()
                  onViewAll()
                }
              }}
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 9,
                fontWeight: 600,
                color: 'rgba(100,180,220,0.65)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              ALL BRIEFINGS &rsaquo;
            </span>
          )}
        </div>
      </button>
    </div>
  )
}
