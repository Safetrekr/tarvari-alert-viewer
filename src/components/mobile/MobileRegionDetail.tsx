'use client'

import type { GeoSummary } from '@/hooks/use-geo-summaries'
import { THREAT_LEVEL_COLORS, THREAT_LEVEL_BG, THREAT_LEVEL_LABELS } from '@/lib/threat-level-colors'
import { getCategoryMeta } from '@/lib/interfaces/coverage'
import { relativeTimeAgo } from '@/lib/time-utils'

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

const SEVERITY_COLORS: Record<string, string> = {
  Extreme: '#ef4444',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#3b82f6',
  Unknown: '#6b7280',
}

export function MobileRegionDetail({ summary }: { summary: GeoSummary }) {
  const color = THREAT_LEVEL_COLORS[summary.threatLevel] ?? THREAT_LEVEL_COLORS.LOW
  const bg = THREAT_LEVEL_BG[summary.threatLevel] ?? THREAT_LEVEL_BG.LOW
  const label = THREAT_LEVEL_LABELS[summary.threatLevel] ?? 'Low'
  const regionName = REGION_LABELS[summary.geoKey] ?? summary.geoKey
  const bd = summary.structuredBreakdown

  const sortedCategories = Object.entries(bd.threatsByCategory)
    .sort((a, b) => b[1] - a[1])

  const sortedSeverity = Object.entries(bd.severityDistribution)
    .sort((a, b) => b[1] - a[1])

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 16,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {regionName}
        </span>
        <span
          style={{
            padding: '3px 8px',
            borderRadius: 4,
            background: bg,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color,
          }}
        >
          {label}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            color: 'rgba(255,255,255,0.25)',
          }}
        >
          {relativeTimeAgo(summary.generatedAt)}
        </span>
      </div>

      {/* Summary text */}
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 12,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.6,
        }}
      >
        {summary.summaryText}
      </p>

      {/* Severity distribution */}
      {sortedSeverity.length > 0 && (
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
            Severity Distribution
          </h4>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {sortedSeverity.map(([sev, count]) => (
              <div
                key={sev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: `${SEVERITY_COLORS[sev] ?? '#6b7280'}15`,
                  border: `1px solid ${SEVERITY_COLORS[sev] ?? '#6b7280'}30`,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: SEVERITY_COLORS[sev] ?? '#6b7280',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  {sev}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category breakdown */}
      {sortedCategories.length > 0 && (
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
            Threats by Category
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sortedCategories.map(([cat, count]) => {
              const meta = getCategoryMeta(cat)
              return (
                <div
                  key={cat}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
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
                    {meta.shortName}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Key events */}
      {bd.keyEvents.length > 0 && (
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
            Key Events
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bd.keyEvents.map((evt, i) => (
              <div
                key={i}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: SEVERITY_COLORS[evt.severity] ?? '#6b7280',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.7)',
                      lineHeight: 1.3,
                    }}
                  >
                    {evt.title}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.3)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {evt.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {bd.recommendations.length > 0 && (
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
            Recommendations
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bd.recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.2)',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {i + 1}.
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.5,
                  }}
                >
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
