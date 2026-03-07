'use client'

import type { GeoSummary } from '@/hooks/use-geo-summaries'
import { THREAT_LEVEL_COLORS, THREAT_LEVEL_BG, THREAT_LEVEL_LABELS } from '@/lib/threat-level-colors'

export interface MobileRegionCardProps {
  readonly summary: GeoSummary
  readonly onTap: (summary: GeoSummary) => void
}

const REGION_LABELS: Record<string, string> = {
  world: 'Global',
  'north-america': 'North America',
  'south-america': 'South America',
  europe: 'Europe',
  'middle-east': 'Middle East',
  africa: 'Africa',
  'south-asia': 'South Asia',
  'east-asia': 'East Asia',
  'southeast-asia': 'Southeast Asia',
  oceania: 'Oceania',
  'central-asia': 'Central Asia',
  caribbean: 'Caribbean',
}

export function MobileRegionCard({ summary, onTap }: MobileRegionCardProps) {
  const color = THREAT_LEVEL_COLORS[summary.threatLevel] ?? THREAT_LEVEL_COLORS.LOW
  const bg = THREAT_LEVEL_BG[summary.threatLevel] ?? THREAT_LEVEL_BG.LOW
  const label = THREAT_LEVEL_LABELS[summary.threatLevel] ?? 'Low'
  const regionName = REGION_LABELS[summary.geoKey] ?? summary.geoKey

  // Top categories from breakdown
  const topCategories = Object.entries(summary.structuredBreakdown.threatsByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <button
      type="button"
      onClick={() => onTap(summary)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 14px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.03)',
        minWidth: 160,
        maxWidth: 200,
        cursor: 'pointer',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
        scrollSnapAlign: 'start',
      }}
    >
      {/* Region name + threat badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          {regionName}
        </span>
        <span
          style={{
            padding: '2px 6px',
            borderRadius: 3,
            background: bg,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 8,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color,
            flexShrink: 0,
          }}
        >
          {label}
        </span>
      </div>

      {/* Summary preview */}
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {summary.summaryText}
      </p>

      {/* Top categories */}
      {topCategories.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {topCategories.map(([cat, count]) => (
            <span
              key={cat}
              style={{
                padding: '1px 4px',
                borderRadius: 2,
                background: 'rgba(255,255,255,0.04)',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 8,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
              }}
            >
              {cat} {count}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}
