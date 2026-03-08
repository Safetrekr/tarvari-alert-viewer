'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { GeoSummary } from '@/hooks/use-geo-summaries'
import { useLatestGeoSummary, useAllGeoSummaries } from '@/hooks/use-geo-summaries'
import { THREAT_LEVEL_COLORS, THREAT_LEVEL_BG, THREAT_LEVEL_LABELS } from '@/lib/threat-level-colors'
import { getCategoryMeta, getGeoDisplayName } from '@/lib/interfaces/coverage'
import type { GeoLevel } from '@/lib/interfaces/coverage'
import { relativeTimeAgo } from '@/lib/time-utils'
import { MobileGeoBreadcrumb, type BreadcrumbLevel } from './MobileGeoBreadcrumb'

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
  'central-america-caribbean': 'Central America & Caribbean',
  'western-europe': 'Western Europe',
  'eastern-europe': 'Eastern Europe',
  'north-africa': 'North Africa',
  'sub-saharan-africa': 'Sub-Saharan Africa',
  'south-central-asia': 'South & Central Asia',
  'east-southeast-asia': 'East & Southeast Asia',
}

const SEVERITY_COLORS: Record<string, string> = {
  Extreme: '#ef4444',
  Severe: '#f97316',
  Moderate: '#eab308',
  Minor: '#3b82f6',
  Unknown: '#6b7280',
}

/** The next drill-down level for a given geo level. */
function getChildLevel(level: GeoLevel): GeoLevel | null {
  if (level === 'world') return 'region'
  if (level === 'region') return 'country'
  return null
}

/** Label for the children section heading. */
function getChildrenSectionLabel(level: GeoLevel): string {
  if (level === 'world') return 'Regions'
  if (level === 'region') return 'Countries'
  return ''
}

/** Resolve a display name for any geo key at any level. */
function resolveDisplayName(level: GeoLevel, key: string): string {
  // Check local labels first, then fall back to the shared utility
  return REGION_LABELS[key] ?? getGeoDisplayName(level, key)
}

// ============================================================================
// Nav stack entry
// ============================================================================

interface NavEntry {
  level: GeoLevel
  key: string
  label: string
}

// ============================================================================
// Inner detail renderer (shared between initial and drilled-down views)
// ============================================================================

function RegionDetailContent({
  summary,
  childSummaries,
  onDrillDown,
}: {
  summary: GeoSummary
  childSummaries: GeoSummary[]
  onDrillDown: (level: GeoLevel, key: string, label: string) => void
}) {
  const color = THREAT_LEVEL_COLORS[summary.threatLevel] ?? THREAT_LEVEL_COLORS.LOW
  const bg = THREAT_LEVEL_BG[summary.threatLevel] ?? THREAT_LEVEL_BG.LOW
  const label = THREAT_LEVEL_LABELS[summary.threatLevel] ?? 'Low'
  const regionName = resolveDisplayName(summary.geoLevel, summary.geoKey)
  const bd = summary.structuredBreakdown

  const sortedCategories = Object.entries(bd.threatsByCategory).sort((a, b) => b[1] - a[1])
  const sortedSeverity = Object.entries(bd.severityDistribution).sort((a, b) => b[1] - a[1])

  const childLevel = getChildLevel(summary.geoLevel)
  const childrenLabel = getChildrenSectionLabel(summary.geoLevel)

  return (
    <>
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

      {/* Child entities (drill-down) */}
      {childLevel && childSummaries.length > 0 && (
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
            {childrenLabel}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {childSummaries.map((child) => {
              const childColor =
                THREAT_LEVEL_COLORS[child.threatLevel] ?? THREAT_LEVEL_COLORS.LOW
              const childBg =
                THREAT_LEVEL_BG[child.threatLevel] ?? THREAT_LEVEL_BG.LOW
              const childThreatLabel =
                THREAT_LEVEL_LABELS[child.threatLevel] ?? 'Low'
              const childName = resolveDisplayName(child.geoLevel, child.geoKey)

              return (
                <button
                  type="button"
                  key={child.id}
                  onClick={() =>
                    onDrillDown(child.geoLevel, child.geoKey, childName)
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: 56,
                    padding: '0 12px',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.7)',
                      flex: 1,
                    }}
                  >
                    {childName}
                  </span>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: childBg,
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 8,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: childColor,
                      flexShrink: 0,
                    }}
                  >
                    {childThreatLabel}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.15)',
                      flexShrink: 0,
                    }}
                  >
                    &rsaquo;
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}

// ============================================================================
// Main component
// ============================================================================

export function MobileRegionDetail({ summary }: { summary: GeoSummary }) {
  // Navigation stack — initialized with the incoming summary
  const [navStack, setNavStack] = useState<NavEntry[]>(() => [
    {
      level: summary.geoLevel,
      key: summary.geoKey,
      label: resolveDisplayName(summary.geoLevel, summary.geoKey),
    },
  ])

  // Track slide direction for animation
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward')

  // Current nav entry is always the last item in the stack
  const current = navStack[navStack.length - 1]

  // Are we at the root (showing the original summary) or drilled down?
  const isDrilledDown =
    current.level !== summary.geoLevel || current.key !== summary.geoKey

  // Fetch drilled-down summary (only when navigated away from root)
  const drilledQuery = useLatestGeoSummary(
    isDrilledDown ? current.level : null,
    isDrilledDown ? current.key : null,
  )

  // Fetch all summaries to derive children for the current view
  const allSummaries = useAllGeoSummaries(true)

  // The active summary to display — either the drilled-down one or the original prop
  const activeSummary = isDrilledDown ? (drilledQuery.data ?? null) : summary

  // Derive child summaries for the active summary
  const childSummaries = useMemo(() => {
    if (!activeSummary || !allSummaries.data) return []
    const childLevel = getChildLevel(activeSummary.geoLevel)
    if (!childLevel) return []

    return allSummaries.data
      .filter((s) => s.geoLevel === childLevel)
      .sort((a, b) => {
        // Sort by threat level severity descending, then by name
        const threatOrder = ['CRITICAL', 'HIGH', 'ELEVATED', 'MODERATE', 'LOW']
        const aIdx = threatOrder.indexOf(a.threatLevel)
        const bIdx = threatOrder.indexOf(b.threatLevel)
        if (aIdx !== bIdx) return aIdx - bIdx
        const aName = resolveDisplayName(a.geoLevel, a.geoKey)
        const bName = resolveDisplayName(b.geoLevel, b.geoKey)
        return aName.localeCompare(bName)
      })
  }, [activeSummary, allSummaries.data])

  // Build breadcrumb levels from nav stack
  const breadcrumbLevels: BreadcrumbLevel[] = useMemo(
    () => navStack.map((entry) => ({ label: entry.label, level: entry.level, key: entry.key })),
    [navStack],
  )

  // Drill down into a child entity
  const handleDrillDown = useCallback(
    (level: GeoLevel, key: string, label: string) => {
      setSlideDirection('forward')
      setNavStack((prev) => [...prev, { level, key, label }])
    },
    [],
  )

  // Navigate back via breadcrumb
  const handleBreadcrumbNavigate = useCallback(
    (level: GeoLevel, key: string) => {
      setSlideDirection('back')
      setNavStack((prev) => {
        const idx = prev.findIndex((e) => e.level === level && e.key === key)
        if (idx === -1) return prev
        return prev.slice(0, idx + 1)
      })
    },
    [],
  )

  // Animation key for AnimatePresence transitions
  const animationKey = `${current.level}-${current.key}`

  // Loading state while fetching drilled-down data
  const isLoading = isDrilledDown && drilledQuery.isLoading

  return (
    <div
      style={{
        padding: '16px var(--space-content-padding, 12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflow: 'hidden',
      }}
    >
      {/* Breadcrumb navigation */}
      {navStack.length > 1 && (
        <MobileGeoBreadcrumb
          levels={breadcrumbLevels}
          onNavigate={handleBreadcrumbNavigate}
        />
      )}

      {/* Animated content area */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={animationKey}
          initial={{
            opacity: 0,
            x: slideDirection === 'forward' ? 60 : -60,
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{
            opacity: 0,
            x: slideDirection === 'forward' ? -60 : 60,
          }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {isLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Loading...
              </span>
            </div>
          )}

          {!isLoading && activeSummary && (
            <RegionDetailContent
              summary={activeSummary}
              childSummaries={childSummaries}
              onDrillDown={handleDrillDown}
            />
          )}

          {!isLoading && isDrilledDown && !activeSummary && !drilledQuery.isLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 120,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                No summary available for this scope.
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
