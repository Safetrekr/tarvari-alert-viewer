/**
 * SystemStatusPanel -- left-side glass panel displaying real-time
 * intel source health, severity breakdown, and category coverage.
 *
 * Positioned at world-space (-1400, -340), 320x900px.
 *
 * Uses real data from useCoverageMetrics() and useIntelFeed().
 * Shows source status (active/staging/quarantine/disabled),
 * severity distribution, and category coverage bars.
 *
 * @module system-status-panel
 * @see Phase C Spatial Enrichment
 */

'use client'

import { useMemo } from 'react'
import { useAttentionStore } from '@/stores/attention.store'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { useIntelFeed } from '@/hooks/use-intel-feed'
import { getCategoryColor, getCategoryMeta } from '@/lib/interfaces/coverage'

// ---------------------------------------------------------------------------
// Position & size constants (world-space pixels)
// ---------------------------------------------------------------------------

const PANEL_X = -1350
const PANEL_Y = -350
const PANEL_W = 320
const PANEL_H = 900

// ---------------------------------------------------------------------------
// Status color mapping
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  active: 'rgba(34, 197, 94, 0.8)',
  staging: 'rgba(234, 179, 8, 0.8)',
  quarantine: 'rgba(239, 68, 68, 0.8)',
  disabled: 'rgba(255, 255, 255, 0.2)',
}

const STATUS_TEXT_COLORS: Record<string, string> = {
  active: 'rgba(34, 197, 94, 0.5)',
  staging: 'rgba(234, 179, 8, 0.5)',
  quarantine: 'rgba(239, 68, 68, 0.5)',
  disabled: 'rgba(255, 255, 255, 0.15)',
}

// ---------------------------------------------------------------------------
// Shared text styles (world-space)
// ---------------------------------------------------------------------------

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

const GHOST: React.CSSProperties = {
  ...MONO,
  fontSize: 14,
  color: 'rgba(255, 255, 255, 0.15)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SystemStatusPanel() {
  const isTightening = useAttentionStore((s) => s.attentionState === 'tighten')
  const { data: metrics } = useCoverageMetrics()
  const { data: feedItems = [] } = useIntelFeed()

  // Source status breakdown
  const statusCounts = useMemo(() => {
    if (!metrics?.sourcesByCoverage) return { active: 0, staging: 0, quarantine: 0, disabled: 0 }
    const counts: Record<string, number> = { active: 0, staging: 0, quarantine: 0, disabled: 0 }
    for (const src of metrics.sourcesByCoverage) {
      const status = src.status.toLowerCase()
      if (status in counts) counts[status]++
      else counts['disabled']++
    }
    return counts
  }, [metrics])

  const allActive = statusCounts.quarantine === 0 && statusCounts.disabled === 0

  // Severity breakdown from live feed
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of feedItems) {
      counts[item.severity] = (counts[item.severity] ?? 0) + 1
    }
    return counts
  }, [feedItems])

  // Top categories by alert count
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of feedItems) {
      counts[item.category] = (counts[item.category] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [feedItems])

  const maxCategoryCount = categoryCounts.length > 0 ? categoryCounts[0][1] : 1

  return (
    <div
      className="absolute"
      style={{
        left: PANEL_X,
        top: PANEL_Y,
        width: PANEL_W,
        height: PANEL_H,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 16,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          boxShadow: isTightening
            ? '0 0 12px rgba(245, 158, 11, 0.1)'
            : 'none',
          transition: 'box-shadow 500ms ease',
        }}
      >
        {/* -- Status indicator ----------------------------------------- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isTightening
                ? 'rgba(245, 158, 11, 0.9)'
                : allActive
                  ? 'rgba(34, 197, 94, 0.9)'
                  : 'rgba(239, 68, 68, 0.9)',
              boxShadow: isTightening
                ? '0 0 8px rgba(245, 158, 11, 0.4)'
                : allActive
                  ? '0 0 8px rgba(34, 197, 94, 0.4)'
                  : '0 0 8px rgba(239, 68, 68, 0.4)',
              flexShrink: 0,
              transition: 'background 500ms ease, box-shadow 500ms ease',
            }}
          />
          <span
            style={{
              ...MONO,
              fontSize: 20,
              fontWeight: 700,
              color: isTightening
                ? 'rgba(245, 158, 11, 0.5)'
                : allActive
                  ? 'rgba(34, 197, 94, 0.5)'
                  : 'rgba(239, 68, 68, 0.5)',
              letterSpacing: '0.12em',
              transition: 'color 500ms ease',
            }}
          >
            {allActive ? 'ALL CLEAR' : 'SOURCES DEGRADED'}
          </span>
        </div>

        {/* -- Source count --------------------------------------------- */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              ...MONO,
              fontSize: 28,
              color: 'rgba(255, 255, 255, 0.6)',
              letterSpacing: '0.04em',
              lineHeight: 1.2,
            }}
          >
            {metrics?.activeSources ?? '—'}<span style={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.2)' }}>/{metrics?.totalSources ?? '—'}</span>
          </div>
          <div style={GHOST}>ACTIVE SOURCES</div>
        </div>

        {/* -- Mission label -------------------------------------------- */}
        <div style={{ marginBottom: 24 }}>
          <div style={GHOST}>MISSION</div>
          <div
            style={{
              ...MONO,
              fontSize: 18,
              color: 'rgba(var(--ember-rgb), 0.6)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            INTEL MONITORING
          </div>
        </div>

        {/* -- Source status breakdown ---------------------------------- */}
        <div
          style={{
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              ...MONO,
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.12)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            SOURCE STATUS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['active', 'staging', 'quarantine', 'disabled'] as const).map((status) => (
              <div
                key={status}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingLeft: 8,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: STATUS_COLORS[status],
                    boxShadow: status === 'active'
                      ? `0 0 6px ${STATUS_COLORS[status]}`
                      : 'none',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    ...MONO,
                    fontSize: 15,
                    color: 'rgba(255, 255, 255, 0.3)',
                    letterSpacing: '0.06em',
                    flex: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {status}
                </span>
                <span
                  style={{
                    ...MONO,
                    fontSize: 15,
                    color: STATUS_TEXT_COLORS[status],
                    letterSpacing: '0.08em',
                  }}
                >
                  {statusCounts[status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* -- Severity bars ------------------------------------------- */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...GHOST, marginBottom: 12 }}>SEVERITY DIST</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'Extreme', color: 'rgba(239, 68, 68, 0.6)' },
              { key: 'Severe', color: 'rgba(249, 115, 22, 0.5)' },
              { key: 'Moderate', color: 'rgba(234, 179, 8, 0.4)' },
              { key: 'Minor', color: 'rgba(59, 130, 246, 0.4)' },
            ].map((s) => {
              const count = severityCounts[s.key] ?? 0
              const pct = feedItems.length > 0 ? Math.round((count / feedItems.length) * 100) : 0
              return (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
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
                        background: `linear-gradient(to right, ${s.color}, transparent)`,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      ...MONO,
                      fontSize: 13,
                      color: 'rgba(255, 255, 255, 0.25)',
                      letterSpacing: '0.06em',
                      minWidth: 80,
                      textAlign: 'right',
                    }}
                  >
                    {s.key.slice(0, 4).toUpperCase()} {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* -- Category coverage bars ---------------------------------- */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...GHOST, marginBottom: 12 }}>CATEGORY ACTIVITY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categoryCounts.length === 0 ? (
              <span
                style={{
                  ...MONO,
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.1)',
                  letterSpacing: '0.04em',
                }}
              >
                NO DATA
              </span>
            ) : (
              categoryCounts.map(([catId, count]) => {
                const catMeta = getCategoryMeta(catId)
                const catColor = getCategoryColor(catId)
                const pct = Math.round((count / maxCategoryCount) * 100)
                return (
                  <div key={catId} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 12,
                        color: catColor,
                        letterSpacing: '0.06em',
                        minWidth: 36,
                      }}
                    >
                      {catMeta.shortName}
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
                          background: catColor,
                          opacity: 0.5,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.2)',
                        minWidth: 24,
                        textAlign: 'right',
                      }}
                    >
                      {count}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* -- Coverage footer ----------------------------------------- */}
        <div
          style={{
            marginTop: 'auto',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            paddingTop: 16,
          }}
        >
          <div
            style={{
              ...MONO,
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.1)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            COVERAGE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                ...MONO,
                fontSize: 16,
                color: 'rgba(255, 255, 255, 0.3)',
                letterSpacing: '0.06em',
              }}
            >
              {metrics?.categoriesCovered ?? '—'} CATEGORIES
            </span>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'rgba(34, 197, 94, 0.8)',
                boxShadow: '0 0 6px rgba(34, 197, 94, 0.4)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                ...MONO,
                fontSize: 13,
                color: 'rgba(34, 197, 94, 0.5)',
                letterSpacing: '0.08em',
              }}
            >
              LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
