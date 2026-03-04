/**
 * FeedPanel -- live intel feed panel showing recent alerts from
 * the intel_normalized table, severity breakdown, and source stats.
 *
 * Positioned at world-space (1100, -290), 320x580px.
 *
 * Uses real data from useIntelFeed() and useCoverageMetrics().
 * Falls back gracefully to "NO DATA" states when loading or empty.
 *
 * @module feed-panel
 * @see Phase C Spatial Enrichment
 */

'use client'

import { useMemo } from 'react'
import { useIntelFeed, type IntelFeedItem } from '@/hooks/use-intel-feed'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { getCategoryMeta, getCategoryColor } from '@/lib/interfaces/coverage'

// ---------------------------------------------------------------------------
// Position & size constants (world-space pixels)
// ---------------------------------------------------------------------------

const PANEL_X = 1100
const PANEL_Y = -500
const PANEL_W = 320
const PANEL_H = 800

// ---------------------------------------------------------------------------
// Severity color mapping
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  'Extreme': 'rgba(239, 68, 68, 0.7)',
  'Severe': 'rgba(249, 115, 22, 0.6)',
  'Moderate': 'rgba(234, 179, 8, 0.5)',
  'Minor': 'rgba(59, 130, 246, 0.5)',
  'Unknown': 'rgba(255, 255, 255, 0.2)',
}

function severityColor(severity: string): string {
  return SEVERITY_COLORS[severity] ?? SEVERITY_COLORS['Unknown']
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format ISO timestamp as HH:MM. */
function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Truncate text to maxLen with ellipsis. */
function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text
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
// Circuit diagram SVG (decorative)
// ---------------------------------------------------------------------------

function CircuitDiagram() {
  const TRACE = 'rgba(14, 165, 233, 0.08)'
  const COMP = 'rgba(14, 165, 233, 0.06)'

  return (
    <svg
      viewBox="0 0 200 100"
      width={200}
      height={100}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="20" y1="30" x2="90" y2="30" stroke={TRACE} strokeWidth={1} />
      <line x1="110" y1="30" x2="180" y2="30" stroke={TRACE} strokeWidth={1} />
      <line x1="20" y1="70" x2="90" y2="70" stroke={TRACE} strokeWidth={1} />
      <line x1="110" y1="70" x2="180" y2="70" stroke={TRACE} strokeWidth={1} />
      <line x1="60" y1="30" x2="60" y2="70" stroke={TRACE} strokeWidth={1} />
      <line x1="140" y1="30" x2="140" y2="70" stroke={TRACE} strokeWidth={1} />
      <rect x="28" y="22" width="16" height="16" rx={2} stroke={COMP} strokeWidth={1} />
      <rect x="156" y="22" width="16" height="16" rx={2} stroke={COMP} strokeWidth={1} />
      <line x1="95" y1="26" x2="95" y2="34" stroke={TRACE} strokeWidth={1} />
      <line x1="99" y1="26" x2="99" y2="34" stroke={TRACE} strokeWidth={1} />
      <line x1="95" y1="66" x2="95" y2="74" stroke={TRACE} strokeWidth={1} />
      <line x1="99" y1="66" x2="99" y2="74" stroke={TRACE} strokeWidth={1} />
      <circle
        cx="60"
        cy="50"
        r={3}
        fill="rgba(14, 165, 233, 0.5)"
        className="enrichment-circuit-pulse"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FeedPanel() {
  const { data: feedItems = [], isLoading: isFeedLoading } = useIntelFeed()
  const { data: metrics } = useCoverageMetrics()

  // Severity breakdown from the feed
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of feedItems) {
      counts[item.severity] = (counts[item.severity] ?? 0) + 1
    }
    return [
      { key: 'EXTREME', value: counts['Extreme'] ?? 0, color: SEVERITY_COLORS['Extreme'] },
      { key: 'SEVERE', value: counts['Severe'] ?? 0, color: SEVERITY_COLORS['Severe'] },
      { key: 'MODERATE', value: counts['Moderate'] ?? 0, color: SEVERITY_COLORS['Moderate'] },
      { key: 'MINOR', value: counts['Minor'] ?? 0, color: SEVERITY_COLORS['Minor'] },
    ]
  }, [feedItems])

  // 6 most recent feed items
  const recentItems = useMemo(() => feedItems.slice(0, 6), [feedItems])

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
        }}
      >
        {/* -- FEEDS header ------------------------------------------ */}
        <div
          style={{
            ...MONO,
            fontSize: 20,
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.12em',
            marginBottom: 16,
          }}
        >
          INTEL FEED
        </div>

        {/* -- Source stats ------------------------------------------- */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
          <span style={GHOST}>SOURCES</span>
          <span
            style={{
              ...MONO,
              fontSize: 20,
              color: 'rgba(14, 165, 233, 0.6)',
              letterSpacing: '0.04em',
            }}
          >
            {metrics?.activeSources ?? '—'}/{metrics?.totalSources ?? '—'}
          </span>
          <span
            style={{
              ...MONO,
              fontSize: 12,
              color: 'rgba(255, 255, 255, 0.12)',
              letterSpacing: '0.04em',
            }}
          >
            ACTIVE
          </span>
        </div>

        {/* -- Severity breakdown ------------------------------------ */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...GHOST, marginBottom: 10 }}>SEVERITY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {severityCounts.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    ...MONO,
                    fontSize: 16,
                    color: 'rgba(255, 255, 255, 0.2)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {s.key}
                </span>
                <span
                  style={{
                    ...MONO,
                    fontSize: 16,
                    color: s.color,
                    letterSpacing: '0.04em',
                  }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* -- Recent alerts ----------------------------------------- */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...GHOST, marginBottom: 10 }}>RECENT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isFeedLoading ? (
              <span
                style={{
                  ...MONO,
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.1)',
                  letterSpacing: '0.04em',
                }}
              >
                LOADING…
              </span>
            ) : recentItems.length === 0 ? (
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
              recentItems.map((item) => (
                <FeedItem key={item.id} item={item} />
              ))
            )}
          </div>
        </div>

        {/* -- Circuit diagram --------------------------------------- */}
        <div
          style={{
            marginTop: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: 8,
            padding: '10px 12px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <CircuitDiagram />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Feed item row
// ---------------------------------------------------------------------------

function FeedItem({ item }: { item: IntelFeedItem }) {
  const catMeta = getCategoryMeta(item.category)
  const catColor = getCategoryColor(item.category)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            ...MONO,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.12)',
            letterSpacing: '0.04em',
          }}
        >
          [{formatTime(item.ingestedAt)}]
        </span>
        <span
          style={{
            ...MONO,
            fontSize: 12,
            color: severityColor(item.severity),
            letterSpacing: '0.06em',
          }}
        >
          {item.severity.toUpperCase()}
        </span>
      </div>
      <div
        style={{
          ...MONO,
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.1)',
          letterSpacing: '0.04em',
          paddingLeft: 12,
          marginTop: 1,
        }}
      >
        <span style={{ color: catColor }}>{catMeta.shortName}</span>
        {' → '}
        {truncate(item.title, 32)}
      </div>
    </div>
  )
}
