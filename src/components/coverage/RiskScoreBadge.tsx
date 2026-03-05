/**
 * RiskScoreBadge -- displays a horizontal risk bar with numeric score.
 *
 * The bar fills proportionally to the score (0-100 range).
 * Color transitions from blue (low) through amber to red (high risk).
 *
 * @module RiskScoreBadge
 */

'use client'

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

interface RiskScoreBadgeProps {
  value: string | null
}

function getRiskColor(score: number): string {
  if (score >= 80) return 'rgba(239, 68, 68, 0.7)'
  if (score >= 60) return 'rgba(249, 115, 22, 0.6)'
  if (score >= 40) return 'rgba(234, 179, 8, 0.5)'
  return 'rgba(59, 130, 246, 0.5)'
}

export function RiskScoreBadge({ value }: RiskScoreBadgeProps) {
  const numericValue = value != null ? parseFloat(value) : null
  const score = numericValue != null && !isNaN(numericValue) ? numericValue : 0
  const pct = Math.min(100, Math.max(0, score))
  const color = getRiskColor(score)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          ...MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'rgba(255, 255, 255, 0.25)',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        RISK
      </span>
      <div
        style={{
          flex: 1,
          height: 5,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.04)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            background: color,
            transition: 'width 300ms ease',
          }}
        />
      </div>
      <span
        style={{
          ...MONO,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: value != null ? color : 'rgba(255, 255, 255, 0.15)',
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {value != null ? score.toFixed(0) : '—'}
      </span>
    </div>
  )
}
