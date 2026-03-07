'use client'

import { useMemo } from 'react'
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useThreatPicture } from '@/hooks/use-threat-picture'
import { derivePosture, POSTURE_CONFIG } from '@/lib/threat-utils'
import type { ThreatLevel } from '@/lib/interfaces/coverage'

/**
 * 56px threat posture banner for the Situation tab.
 * Shows posture badge, active alert count, P1/P2 counts, and trend.
 */
export function MobileThreatBanner({ onTap }: { onTap?: () => void }) {
  const { data: tp, isLoading } = useThreatPicture()

  const posture: ThreatLevel = useMemo(() => {
    if (!tp) return 'LOW'
    return derivePosture(tp.bySeverity, tp.totalActiveAlerts)
  }, [tp])

  const ps = POSTURE_CONFIG[posture]
  const p1 = tp?.byPriority.find((p) => p.priority === 'P1')?.count ?? 0
  const p2 = tp?.byPriority.find((p) => p.priority === 'P2')?.count ?? 0

  const trendIcon =
    tp?.overallTrend === 'up' ? (
      <TrendingUp size={12} style={{ color: 'rgba(239, 68, 68, 0.6)' }} />
    ) : tp?.overallTrend === 'down' ? (
      <TrendingDown size={12} style={{ color: 'rgba(34, 197, 94, 0.6)' }} />
    ) : (
      <Minus size={12} style={{ color: 'rgba(255, 255, 255, 0.2)' }} />
    )

  if (isLoading) {
    return (
      <div
        style={{
          height: 56,
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 8,
          margin: '0 var(--space-content-padding, 12px)',
        }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: 'calc(100% - 2 * var(--space-content-padding, 12px))',
        padding: '0 var(--space-content-padding, 12px)',
        margin: '0 var(--space-content-padding, 12px)',
        background: ps.bg,
        border: `1px solid ${ps.border}`,
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Posture badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          borderRadius: 4,
          background: ps.bg,
          border: `1px solid ${ps.border}`,
          flexShrink: 0,
        }}
      >
        <Shield size={14} style={{ color: ps.color }} />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'var(--text-label, 11px)',
            fontWeight: 600,
            color: ps.color,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {ps.label}
        </span>
      </div>

      {/* Alert count */}
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 'var(--text-card-metric, 22px)',
          fontWeight: 700,
          color: 'var(--color-text-primary, rgba(255,255,255,0.87))',
          lineHeight: 1,
        }}
      >
        {tp?.totalActiveAlerts ?? 0}
      </span>

      {/* Trend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {trendIcon}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* P1/P2 counts */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {p1 > 0 && (
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'var(--text-caption, 10px)',
              fontWeight: 600,
              color: 'var(--severity-extreme, #ef4444)',
              letterSpacing: '0.06em',
            }}
          >
            P1: {p1}
          </span>
        )}
        {p2 > 0 && (
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'var(--text-caption, 10px)',
              fontWeight: 500,
              color: 'var(--severity-severe, #f97316)',
              letterSpacing: '0.06em',
            }}
          >
            P2: {p2}
          </span>
        )}
      </div>
    </button>
  )
}
