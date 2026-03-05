/**
 * ConfidenceIndicator -- displays a confidence tier badge with
 * color-coded label and optional numeric value.
 *
 * Uses the 3-tier system: LOW (red), MODERATE (amber), HIGH (green).
 *
 * @module ConfidenceIndicator
 */

'use client'

import { getConfidenceTier } from '@/lib/interfaces/intel-bundles'

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

interface ConfidenceIndicatorProps {
  value: string | null
  /** Show the numeric percentage alongside the tier label. */
  showValue?: boolean
}

export function ConfidenceIndicator({ value, showValue = true }: ConfidenceIndicatorProps) {
  const tier = getConfidenceTier(value)
  const numericValue = value != null ? parseFloat(value) : null
  const displayValue = numericValue != null && !isNaN(numericValue)
    ? `${Math.round(numericValue)}%`
    : null

  return (
    <span
      style={{
        ...MONO,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: tier.color,
        background: `${tier.color}15`,
        border: `1px solid ${tier.color}30`,
        borderRadius: 4,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: tier.color,
          flexShrink: 0,
        }}
      />
      {tier.label}
      {showValue && displayValue && (
        <span style={{ opacity: 0.7 }}>{displayValue}</span>
      )}
    </span>
  )
}
