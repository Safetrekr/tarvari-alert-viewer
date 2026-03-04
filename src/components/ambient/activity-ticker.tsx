/**
 * ActivityTicker -- scrolling event log styled as a mission control
 * activity feed, positioned below-right of the capsule ring.
 *
 * Positioned at world-space (260, 490), 260x240px. At zoom 0.5 it
 * renders at ~130x120px on screen.
 *
 * Reads live activity events from the enrichment store. Falls back to
 * static mock events when the store is empty. Events scroll upward in
 * a continuous loop using a CSS `@keyframes` animation
 * (`enrichment-ticker-scroll`) defined in `enrichment.css`.
 *
 * Events are color-coded:
 * - Teal text for data operations (QUERY, CHAT, SYNC)
 * - Ember text for deployments (DEPLOY, BUILD)
 * - White/ghost for system ops (REASON)
 *
 * Glass treatment uses simple rgba backgrounds (no backdrop-filter
 * per world-space performance rule).
 *
 * Purely decorative: pointer-events disabled, aria-hidden assumed
 * from the parent wrapper.
 *
 * @module activity-ticker
 * @see Phase C Spatial Enrichment
 */

'use client'

import { useMemo } from 'react'
import { useEnrichmentStore } from '@/stores/enrichment.store'
import { DISTRICTS } from '@/lib/interfaces/district'
import type { DistrictId } from '@/lib/interfaces/district'
import type { ActivityEvent } from '@/lib/enrichment/enrichment-types'

// ---------------------------------------------------------------------------
// Position & size constants (world-space pixels)
// ---------------------------------------------------------------------------

const PANEL_X = 880
const PANEL_Y = 490
const PANEL_W = 260
const PANEL_H = 240

// ---------------------------------------------------------------------------
// Category color mapping
// ---------------------------------------------------------------------------

type EventCategory = 'data' | 'deploy' | 'system'

const CATEGORY_COLORS: Record<EventCategory, string> = {
  data: 'rgba(14, 165, 233, 0.5)',
  deploy: 'rgba(var(--ember-rgb), 0.5)',
  system: 'rgba(255, 255, 255, 0.25)',
}

// ---------------------------------------------------------------------------
// Static fallback event data
// ---------------------------------------------------------------------------

interface TickerEvent {
  time: string
  verb: string
  target: string
  status: string
  category: EventCategory
}

const STATIC_EVENTS: TickerEvent[] = [
  { time: '14:22', verb: 'DEPLOY.AGENT', target: 'project-room', status: 'OK', category: 'deploy' },
  { time: '14:19', verb: 'QUERY.KNOW', target: 'agent-builder', status: 'OK', category: 'data' },
  { time: '14:15', verb: 'CHAT.MSG', target: 'tarva-chat', status: 'OK', category: 'data' },
  { time: '14:12', verb: 'BUILD.AGENT', target: 'agent-builder', status: 'OK', category: 'deploy' },
  { time: '14:08', verb: 'SYNC.ERP', target: 'tarva-erp', status: 'OK', category: 'data' },
  { time: '14:03', verb: 'REASON.CORE', target: 'tarva-core', status: 'OK', category: 'system' },
  { time: '13:57', verb: 'DEPLOY.SKILL', target: 'project-room', status: 'OK', category: 'deploy' },
  { time: '13:52', verb: 'QUERY.VEC', target: 'agent-builder', status: 'OK', category: 'data' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a DistrictId to its human-readable display name. */
function districtDisplayName(id: DistrictId): string {
  const meta = DISTRICTS.find((d) => d.id === id)
  return meta?.displayName ?? id
}

/** Format a Date to HH:MM. */
function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** Convert a store ActivityEvent to the ticker display shape. */
function toTickerEvent(event: ActivityEvent): TickerEvent {
  return {
    time: formatTime(event.timestamp),
    verb: event.verb,
    target: districtDisplayName(event.target),
    status: event.status,
    category: event.category,
  }
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
  const activityLog = useEnrichmentStore((s) => s.activityLog)

  // Use live events if available, otherwise fall back to static
  const events: TickerEvent[] = useMemo(() => {
    if (activityLog.length > 0) {
      return activityLog.map(toTickerEvent)
    }
    return STATIC_EVENTS
  }, [activityLog])

  // Duplicate the events to create seamless loop
  const doubled = useMemo(() => [...events, ...events], [events])

  // Scale animation duration with event count (3.75s per event)
  const animationDuration = `${events.length * 3.75}s`

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
          <div
            className="enrichment-ticker-scroll"
            style={{ animationDuration }}
          >
            {doubled.map((evt, i) => (
              <div
                key={`${evt.time}-${evt.verb}-${i}`}
                style={{
                  marginBottom: 12,
                }}
              >
                {/* Timestamp + verb */}
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
                      color: CATEGORY_COLORS[evt.category],
                      letterSpacing: '0.06em',
                    }}
                  >
                    {evt.verb}
                  </span>
                </div>
                {/* Target + status */}
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
                  &rarr; {evt.target} {evt.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
