/**
 * FeedPanel -- Oblivion-inspired right-side glass panel showing data
 * feeds, sensor readouts, and a decorative circuit diagram.
 *
 * Positioned at world-space (400, -290), 320x580px. At zoom 0.5 it
 * renders at ~160x290px on screen.
 *
 * Inspired by the Oblivion light table right sidebar: FEEDS header,
 * DATALINKS count, channel tabs, sensor readout key-value pairs,
 * signal strength bar, online/offline radio indicator, and a small
 * decorative circuit SVG with a pulsing teal dot.
 *
 * All values are static/mock. Glass treatment uses simple rgba
 * backgrounds (no backdrop-filter per world-space performance rule).
 *
 * The circuit SVG dot pulses via a CSS keyframe animation
 * (`enrichment-circuit-pulse`) defined in `enrichment.css`.
 *
 * Purely decorative: pointer-events disabled, aria-hidden assumed
 * from the parent wrapper.
 *
 * @module feed-panel
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
const PANEL_Y = -290
const PANEL_W = 320
const PANEL_H = 580

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map DistrictId to its short name from DISTRICTS metadata. */
const DISTRICT_SHORT_NAMES: Record<DistrictId, string> = Object.fromEntries(
  DISTRICTS.map((d) => [d.id, d.shortName]),
) as Record<DistrictId, string>

/** Format a Date as HH:MM in 24-hour format. */
function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Category color mapping for activity events (matches ActivityTicker). */
const CATEGORY_COLORS: Record<ActivityEvent['category'], string> = {
  data: 'rgba(14, 165, 233, 0.5)',
  deploy: 'rgba(var(--ember-rgb), 0.5)',
  system: 'rgba(255, 255, 255, 0.25)',
}

// ---------------------------------------------------------------------------
// Tab data
// ---------------------------------------------------------------------------

interface TabDef {
  label: string
  active: boolean
}

const TABS: TabDef[] = [
  { label: 'MAP', active: true },
  { label: 'AGNT', active: false },
  { label: 'SYS', active: false },
]

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
// Circuit diagram SVG
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
      {/* Horizontal traces */}
      <line x1="20" y1="30" x2="90" y2="30" stroke={TRACE} strokeWidth={1} />
      <line x1="110" y1="30" x2="180" y2="30" stroke={TRACE} strokeWidth={1} />
      <line x1="20" y1="70" x2="90" y2="70" stroke={TRACE} strokeWidth={1} />
      <line x1="110" y1="70" x2="180" y2="70" stroke={TRACE} strokeWidth={1} />

      {/* Vertical connectors */}
      <line x1="60" y1="30" x2="60" y2="70" stroke={TRACE} strokeWidth={1} />
      <line x1="140" y1="30" x2="140" y2="70" stroke={TRACE} strokeWidth={1} />

      {/* Component boxes (IC symbols) */}
      <rect x="28" y="22" width="16" height="16" rx={2} stroke={COMP} strokeWidth={1} />
      <rect x="156" y="22" width="16" height="16" rx={2} stroke={COMP} strokeWidth={1} />

      {/* Capacitor symbols (gap marks) */}
      <line x1="95" y1="26" x2="95" y2="34" stroke={TRACE} strokeWidth={1} />
      <line x1="99" y1="26" x2="99" y2="34" stroke={TRACE} strokeWidth={1} />
      <line x1="95" y1="66" x2="95" y2="74" stroke={TRACE} strokeWidth={1} />
      <line x1="99" y1="66" x2="99" y2="74" stroke={TRACE} strokeWidth={1} />

      {/* Pulsing node dot */}
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
  const activityLog = useEnrichmentStore((s) => s.activityLog)
  const districts = useEnrichmentStore((s) => s.districts)

  // Derive metrics from district data
  const { datalinksCount, sensors } = useMemo(() => {
    const districtValues = Object.values(districts)

    // DATALINKS: count districts that are not OFFLINE or DOWN
    const online = districtValues.filter(
      (d) => d.health !== 'OFFLINE' && d.health !== 'DOWN',
    )

    // Sensor readouts derived from aggregate district metrics
    const avgResponse =
      districtValues.length > 0
        ? Math.round(districtValues.reduce((sum, d) => sum + d.responseTimeMs, 0) / districtValues.length)
        : 0
    const totalAlerts = districtValues.reduce((sum, d) => sum + d.alertCount, 0)
    const avgCpu =
      districtValues.length > 0
        ? Math.round(districtValues.reduce((sum, d) => sum + d.cpuUsagePct, 0) / districtValues.length)
        : 0
    const avgMem =
      districtValues.length > 0
        ? Math.round(districtValues.reduce((sum, d) => sum + d.memoryUsagePct, 0) / districtValues.length)
        : 0

    return {
      datalinksCount: online.length,
      sensors: [
        { key: 'F.RATE', value: `${avgResponse}ms` },
        { key: 'GAIN', value: `${totalAlerts}` },
        { key: 'ELEV', value: `${avgCpu}%` },
        { key: 'ROT', value: `${avgMem}%` },
      ],
    }
  }, [districts])

  // First 5 activity events for the feed
  const recentEvents = useMemo(() => activityLog.slice(0, 5), [activityLog])

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
          FEEDS
        </div>

        {/* -- DATALINKS count --------------------------------------- */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
          <span style={GHOST}>DATALINKS</span>
          <span
            style={{
              ...MONO,
              fontSize: 20,
              color: 'rgba(14, 165, 233, 0.6)',
              letterSpacing: '0.04em',
            }}
          >
            {datalinksCount}
          </span>
        </div>

        {/* -- Channel tabs ------------------------------------------ */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            marginBottom: 24,
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          {TABS.map((tab, index) => (
            <div
              key={tab.label}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 0',
                ...MONO,
                fontSize: 16,
                letterSpacing: '0.1em',
                color: tab.active ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.2)',
                background: tab.active ? 'rgba(var(--ember-rgb), 0.15)' : 'transparent',
                borderRight:
                  index < TABS.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* -- Sensor readout ---------------------------------------- */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...GHOST, marginBottom: 10 }}>SENSOR READOUT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sensors.map((s) => (
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
                    color: 'rgba(255, 255, 255, 0.35)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* -- Activity feed (replaces signal strength + radio) ------ */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...GHOST, marginBottom: 10 }}>ACTIVITY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentEvents.length === 0 ? (
              <span
                style={{
                  ...MONO,
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.1)',
                  letterSpacing: '0.04em',
                }}
              >
                NO EVENTS
              </span>
            ) : (
              recentEvents.map((evt) => (
                <div key={evt.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 12,
                        color: 'rgba(255, 255, 255, 0.12)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      [{formatTime(evt.timestamp)}]
                    </span>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 12,
                        color: CATEGORY_COLORS[evt.category],
                        letterSpacing: '0.06em',
                      }}
                    >
                      {evt.verb}
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
                    &rarr; {DISTRICT_SHORT_NAMES[evt.target] ?? evt.target}
                  </div>
                </div>
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
