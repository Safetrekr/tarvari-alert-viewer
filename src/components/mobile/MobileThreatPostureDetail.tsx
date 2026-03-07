'use client'

import { useMemo } from 'react'
import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useThreatPicture } from '@/hooks/use-threat-picture'
import { derivePosture, POSTURE_CONFIG } from '@/lib/threat-utils'
import type { ThreatLevel } from '@/lib/interfaces/coverage'

const SEVERITY_COLORS: Record<string, string> = {
  Extreme: '#ef4444',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#3b82f6',
  Unknown: '#6b7280',
}

export function MobileThreatPostureDetail() {
  const { data: tp } = useThreatPicture()

  const posture: ThreatLevel = useMemo(() => {
    if (!tp) return 'LOW'
    return derivePosture(tp.bySeverity, tp.totalActiveAlerts)
  }, [tp])

  const ps = POSTURE_CONFIG[posture]

  if (!tp) return null

  const TrendIcon =
    tp.overallTrend === 'up'
      ? TrendingUp
      : tp.overallTrend === 'down'
        ? TrendingDown
        : Minus

  const trendColor =
    tp.overallTrend === 'up'
      ? '#ef4444'
      : tp.overallTrend === 'down'
        ? '#22c55e'
        : 'rgba(255,255,255,0.3)'

  const trendLabel =
    tp.overallTrend === 'up'
      ? 'Increasing'
      : tp.overallTrend === 'down'
        ? 'Decreasing'
        : 'Stable'

  return (
    <div
      style={{
        padding: '16px var(--space-content-padding, 12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Posture header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 6,
            background: ps.bg,
            border: `1px solid ${ps.border}`,
          }}
        >
          <Shield size={16} style={{ color: ps.color }} />
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 13,
              fontWeight: 700,
              color: ps.color,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {ps.label}
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--color-text-primary, rgba(255,255,255,0.87))',
            lineHeight: 1,
          }}
        >
          {tp.totalActiveAlerts}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
          }}
        >
          active alerts
        </span>
      </div>

      {/* Overall trend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <TrendIcon size={14} style={{ color: trendColor }} />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 600,
            color: trendColor,
          }}
        >
          {trendLabel}
        </span>
        {tp.trendDetail && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            {tp.trendDetail.delta > 0 ? '+' : ''}
            {tp.trendDetail.delta} ({tp.trendDetail.pctChange > 0 ? '+' : ''}
            {Math.round(tp.trendDetail.pctChange)}%)
          </span>
        )}
      </div>

      {/* Severity breakdown */}
      <section>
        <h4
          style={{
            margin: '0 0 8px',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          By Severity
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tp.bySeverity.map((s) => (
            <div key={s.severity} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: SEVERITY_COLORS[s.severity] ?? '#6b7280',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  width: 70,
                  flexShrink: 0,
                }}
              >
                {s.severity}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${s.percentage}%`,
                    borderRadius: 3,
                    background: SEVERITY_COLORS[s.severity] ?? '#6b7280',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.5)',
                  width: 30,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {s.count}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Priority breakdown */}
      {tp.byPriority.length > 0 && (
        <section>
          <h4
            style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            By Priority
          </h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tp.byPriority.map((p) => (
              <div
                key={p.priority}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background:
                    p.priority === 'P1'
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${
                    p.priority === 'P1'
                      ? 'rgba(239,68,68,0.25)'
                      : 'rgba(255,255,255,0.06)'
                  }`,
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
                    fontSize: 9,
                    fontWeight: 700,
                    color:
                      p.priority === 'P1'
                        ? '#ef4444'
                        : 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {p.priority}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1,
                  }}
                >
                  {p.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top regions */}
      {tp.byRegion.length > 0 && (
        <section>
          <h4
            style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Top Regions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tp.byRegion.slice(0, 5).map((r) => (
              <div
                key={r.region}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  {r.region}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  {r.alertCount}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
