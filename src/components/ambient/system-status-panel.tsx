/**
 * SystemStatusPanel -- Oblivion-inspired left-side glass panel displaying
 * system overview telemetry in a world-space element inside SpatialCanvas.
 *
 * Positioned at world-space (-720, -340), 320x680px. At zoom 0.5 it
 * renders at ~160x340px on screen -- subtle ambient instrumentation.
 *
 * Reads live data from the enrichment store:
 * - District health states from `districts`
 * - Uptime counter from `systemEpoch`
 * - Resource bars from averaged district metrics
 *
 * Header shows "ALL CLEAR" (teal) when all districts OPERATIONAL,
 * "ANOMALY DETECTED" (ember) when any is DEGRADED or DOWN.
 *
 * All text is monospace, sizes are world-space pixels. Glass treatment
 * uses simple rgba backgrounds (no backdrop-filter per world-space
 * performance rule).
 *
 * Purely decorative: pointer-events disabled, aria-hidden assumed from
 * the parent ZoomGate / overlay wrapper.
 *
 * @module system-status-panel
 * @see Phase C Spatial Enrichment
 */

'use client'

import { useMemo } from 'react'
import { useEnrichmentStore } from '@/stores/enrichment.store'
import { useAttentionStore } from '@/stores/attention.store'
import type { HealthState } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Position & size constants (world-space pixels)
// ---------------------------------------------------------------------------

const PANEL_X = -1200
const PANEL_Y = -340
const PANEL_W = 320
const PANEL_H = 680

// ---------------------------------------------------------------------------
// Health-state-to-color mapping
// ---------------------------------------------------------------------------

const HEALTH_COLORS: Record<HealthState, string> = {
  OPERATIONAL: 'rgba(var(--healthy-rgb), 0.8)',
  DEGRADED: 'rgba(234, 179, 8, 0.8)',
  DOWN: 'rgba(239, 68, 68, 0.8)',
  OFFLINE: 'rgba(255, 255, 255, 0.2)',
  UNKNOWN: 'rgba(255, 255, 255, 0.2)',
}

const HEALTH_TEXT_COLORS: Record<HealthState, string> = {
  OPERATIONAL: 'rgba(var(--healthy-rgb), 0.5)',
  DEGRADED: 'rgba(234, 179, 8, 0.5)',
  DOWN: 'rgba(239, 68, 68, 0.5)',
  OFFLINE: 'rgba(255, 255, 255, 0.15)',
  UNKNOWN: 'rgba(255, 255, 255, 0.15)',
}

// ---------------------------------------------------------------------------
// Resource bar definitions
// ---------------------------------------------------------------------------

interface ResourceBar {
  label: string
  /** CSS gradient for the bar fill. */
  gradient: string
}

const RESOURCE_DEFS: ResourceBar[] = [
  {
    label: 'CPU',
    gradient: 'linear-gradient(to right, rgba(var(--ember-rgb), 0.6), rgba(var(--ember-rgb), 0))',
  },
  {
    label: 'MEM',
    gradient: 'linear-gradient(to right, rgba(14, 165, 233, 0.5), rgba(14, 165, 233, 0))',
  },
  {
    label: 'NET',
    gradient: 'linear-gradient(to right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0))',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format seconds into HH:MM:SS. */
function formatUptime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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
  const districts = useEnrichmentStore((s) => s.districts)
  const systemEpoch = useEnrichmentStore((s) => s.systemEpoch)
  const performance = useEnrichmentStore((s) => s.performance)
  const focusedDistrictId = useEnrichmentStore((s) => s.focusedDistrictId)
  const isTightening = useAttentionStore((s) => s.attentionState === 'tighten')

  // Derive district list for rendering
  const districtEntries = useMemo(
    () => Object.values(districts),
    [districts],
  )

  // Derive header state: all clear vs anomaly
  const allOperational = useMemo(
    () => districtEntries.every((d) => d.health === 'OPERATIONAL'),
    [districtEntries],
  )

  // Derive resource percentages averaged across districts
  const resourcePercents = useMemo(() => {
    const count = districtEntries.length || 1
    const cpuAvg = Math.round(
      districtEntries.reduce((sum, d) => sum + d.cpuUsagePct, 0) / count,
    )
    const memAvg = Math.round(
      districtEntries.reduce((sum, d) => sum + d.memoryUsagePct, 0) / count,
    )
    // NET derived from aggregate throughput
    const netPct = Math.round(performance.throughputPct)
    return [cpuAvg, memAvg, netPct]
  }, [districtEntries, performance.throughputPct])

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
        {/* -- ONLINE indicator ----------------------------------------- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isTightening
                ? 'rgba(245, 158, 11, 0.9)'
                : allOperational
                  ? 'rgba(var(--healthy-rgb), 0.9)'
                  : 'rgba(var(--ember-rgb), 0.9)',
              boxShadow: isTightening
                ? '0 0 8px rgba(245, 158, 11, 0.4)'
                : allOperational
                  ? '0 0 8px rgba(var(--healthy-rgb), 0.4)'
                  : '0 0 8px rgba(var(--ember-rgb), 0.4)',
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
                : allOperational
                  ? 'rgba(var(--healthy-rgb), 0.5)'
                  : 'rgba(var(--ember-rgb), 0.5)',
              letterSpacing: '0.12em',
              transition: 'color 500ms ease',
            }}
          >
            {allOperational ? 'ALL CLEAR' : 'ANOMALY DETECTED'}
          </span>
        </div>

        {/* -- Uptime counter ------------------------------------------- */}
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
            {formatUptime(systemEpoch)}
          </div>
          <div style={GHOST}>SYSTEM UPTIME</div>
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
            PLATFORM MONITORING
          </div>
        </div>

        {/* -- Districts section ---------------------------------------- */}
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
            DISTRICTS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {districtEntries.map((d) => {
              const isFocused = focusedDistrictId === d.id
              const hasFocus = focusedDistrictId !== null
              const rowOpacity = isFocused ? 1 : hasFocus ? 0.4 : 1

              return (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderLeft: isFocused
                      ? '2px solid rgba(14, 165, 233, 0.4)'
                      : '2px solid transparent',
                    paddingLeft: 8,
                    opacity: rowOpacity,
                    transition: 'border-color 200ms ease, opacity 200ms ease',
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: HEALTH_COLORS[d.health],
                      boxShadow:
                        d.health === 'OPERATIONAL' || d.health === 'DEGRADED'
                          ? `0 0 6px ${HEALTH_COLORS[d.health]}`
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
                    }}
                  >
                    {d.displayName}
                  </span>
                  <span
                    style={{
                      ...MONO,
                      fontSize: 13,
                      color: HEALTH_TEXT_COLORS[d.health],
                      letterSpacing: '0.08em',
                    }}
                  >
                    {d.health}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* -- Resource allocation bars --------------------------------- */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...GHOST, marginBottom: 12 }}>RESOURCE ALLOC</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RESOURCE_DEFS.map((r, idx) => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                      width: `${resourcePercents[idx]}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: r.gradient,
                    }}
                  />
                </div>
                <span
                  style={{
                    ...MONO,
                    fontSize: 13,
                    color: 'rgba(255, 255, 255, 0.25)',
                    letterSpacing: '0.06em',
                    minWidth: 60,
                    textAlign: 'right',
                  }}
                >
                  {r.label} {resourcePercents[idx]}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* -- Comm link footer ----------------------------------------- */}
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
            COMM LINK
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
              SKYTOWER N&deg; 49
            </span>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'rgba(var(--healthy-rgb), 0.8)',
                boxShadow: '0 0 6px rgba(var(--healthy-rgb), 0.4)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                ...MONO,
                fontSize: 13,
                color: 'rgba(var(--healthy-rgb), 0.5)',
                letterSpacing: '0.08em',
              }}
            >
              ON
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
