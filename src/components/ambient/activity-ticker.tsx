/**
 * ActivityTicker -- scrolling log of real intel alerts from
 * intel_normalized, styled as a mission control activity feed.
 *
 * Positioned at world-space (1100, 490), 260x240px.
 *
 * Uses real data from useIntelFeed(). Falls back to a
 * "NO DATA" state when empty. Events scroll upward in a
 * continuous loop via CSS keyframes.
 *
 * @module activity-ticker
 * @see Phase C Spatial Enrichment
 */

'use client'

import { useMemo } from 'react'
import { useIntelFeed } from '@/hooks/use-intel-feed'
import { getCategoryMeta, getCategoryColor } from '@/lib/interfaces/coverage'

// ---------------------------------------------------------------------------
// Position & size constants (world-space pixels)
// ---------------------------------------------------------------------------

const PANEL_X = 1050
const PANEL_Y = 490
const PANEL_W = 260
const PANEL_H = 240

// ---------------------------------------------------------------------------
// Severity color mapping
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  'Extreme': 'rgba(239, 68, 68, 0.6)',
  'Severe': 'rgba(249, 115, 22, 0.5)',
  'Moderate': 'rgba(234, 179, 8, 0.4)',
  'Minor': 'rgba(59, 130, 246, 0.4)',
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

/** Truncate text. */
function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text
}

// ---------------------------------------------------------------------------
// Shared text styles (world-space)
// ---------------------------------------------------------------------------

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityTicker() {
  const { data: feedItems = [] } = useIntelFeed()

  // Build ticker events from real intel data
  const events = useMemo(() => {
    if (feedItems.length === 0) return []
    return feedItems.slice(0, 20).map((item) => {
      const catMeta = getCategoryMeta(item.category)
      return {
        id: item.id,
        time: formatTime(item.ingestedAt),
        verb: `ALERT.${catMeta.shortName}`,
        target: truncate(item.title, 24),
        severity: item.severity,
        categoryColor: getCategoryColor(item.category),
        severityColor: severityColor(item.severity),
      }
    })
  }, [feedItems])

  // Duplicate events for seamless scroll loop
  const doubled = useMemo(() => [...events, ...events], [events])

  // Scale animation duration with event count (3.75s per event)
  const animationDuration = `${Math.max(events.length, 1) * 3.75}s`

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
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            ...MONO,
            fontSize: 16,
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
            flexShrink: 0,
          }}
        >
          ACTIVITY LOG
        </div>

        {/* Separator */}
        <div
          style={{
            height: 1,
            background: 'rgba(255, 255, 255, 0.06)',
            marginBottom: 10,
            flexShrink: 0,
          }}
        />

        {/* Scrolling event container */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {events.length === 0 ? (
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
            <div
              className="enrichment-ticker-scroll"
              style={{ animationDuration }}
            >
              {doubled.map((evt, i) => (
                <div
                  key={`${evt.id}-${i}`}
                  style={{
                    marginBottom: 12,
                  }}
                >
                  {/* Timestamp + category verb */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 13,
                        color: 'rgba(255, 255, 255, 0.12)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      [{evt.time}]
                    </span>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 13,
                        color: evt.categoryColor,
                        letterSpacing: '0.06em',
                      }}
                    >
                      {evt.verb}
                    </span>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 11,
                        color: evt.severityColor,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {evt.severity.toUpperCase()}
                    </span>
                  </div>
                  {/* Alert title */}
                  <div
                    style={{
                      ...MONO,
                      fontSize: 12,
                      color: 'rgba(255, 255, 255, 0.1)',
                      letterSpacing: '0.04em',
                      paddingLeft: 16,
                      marginTop: 2,
                    }}
                  >
                    &rarr; {evt.target}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
