/**
 * DistrictBeacon -- luminous dot representing a district at Z0.
 *
 * Renders a 12px colored circle with status-driven glow, and a
 * 9px district code label below. Glow intensity and animation class
 * vary by health state. Panning mode reduces glow for performance.
 *
 * @module district-beacon
 * @see WS-2.7 Section 4.4
 */

'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import type { BeaconData, DistrictId, HealthState } from '@/lib/interfaces/district'
import { HEALTH_STATE_MAP } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Glow recipes per health state
// ---------------------------------------------------------------------------

const BEACON_GLOW: Record<HealthState, string> = {
  OPERATIONAL:
    '0 0 8px var(--color-healthy-glow, rgba(var(--healthy-glow-rgb),0.35)), 0 0 3px var(--color-healthy, rgba(var(--healthy-rgb),0.50))',
  DEGRADED:
    '0 0 8px var(--color-warning-glow, rgba(250,204,21,0.25)), 0 0 3px var(--color-warning, rgba(234,179,8,0.40))',
  DOWN:
    '0 0 12px var(--color-error-glow, rgba(248,113,113,0.40)), 0 0 4px var(--color-error, rgba(239,68,68,0.55))',
  OFFLINE: 'none',
  UNKNOWN: 'none',
}

/** Reduced single-layer glow for panning mode (50% opacity). */
const BEACON_GLOW_PANNING: Record<HealthState, string> = {
  OPERATIONAL: '0 0 6px var(--color-healthy-glow, rgba(var(--healthy-glow-rgb),0.18))',
  DEGRADED: '0 0 6px var(--color-warning-glow, rgba(250,204,21,0.13))',
  DOWN: '0 0 6px var(--color-error-glow, rgba(248,113,113,0.20))',
  OFFLINE: 'none',
  UNKNOWN: 'none',
}

/**
 * CSS custom property values for the beacon-pulse @keyframes.
 * The animation references --beacon-glow-outer and --beacon-glow-inner
 * so the same keyframe definition works for all health states.
 */
const BEACON_GLOW_VARS: Record<
  HealthState,
  { outer: string; inner: string } | null
> = {
  OPERATIONAL: {
    outer: 'rgba(var(--healthy-glow-rgb),0.35)',
    inner: 'rgba(var(--healthy-rgb),0.50)',
  },
  DEGRADED: {
    outer: 'rgba(250,204,21,0.25)',
    inner: 'rgba(234,179,8,0.40)',
  },
  DOWN: {
    outer: 'rgba(248,113,113,0.40)',
    inner: 'rgba(239,68,68,0.55)',
  },
  OFFLINE: null,
  UNKNOWN: null,
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DistrictBeaconProps {
  /** Beacon data (id, code, health, alerts, ringIndex). */
  data: BeaconData
  /** Absolute position computed from ring layout. */
  style: { left: number; top: number }
  /** Whether the parent canvas is panning (disable glow effects). */
  isPanning?: boolean
  /** Callback when the beacon is clicked (triggers zoom + morph). */
  onSelect?: (id: DistrictId) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictBeacon({ data, style, isPanning = false, onSelect }: DistrictBeaconProps) {
  const isOperational = data.health === 'OPERATIONAL'
  const isDown = data.health === 'DOWN'
  const isOffline = data.health === 'OFFLINE' || data.health === 'UNKNOWN'
  const isAnimated = (isOperational || isDown) && !isPanning

  const glowValue = isPanning
    ? BEACON_GLOW_PANNING[data.health]
    : BEACON_GLOW[data.health]

  const glowVars = BEACON_GLOW_VARS[data.health]

  // Inline CSS custom properties for the @keyframes animation
  const dotStyle = useMemo(
    () => ({
      backgroundColor: `var(${HEALTH_STATE_MAP[data.health].color})`,
      boxShadow: glowValue,
      ...(glowVars
        ? {
            '--beacon-glow-outer': glowVars.outer,
            '--beacon-glow-inner': glowVars.inner,
          }
        : {}),
    }),
    [data.health, glowValue, glowVars],
  ) as React.CSSProperties

  return (
    <button
      type="button"
      className="absolute flex cursor-pointer flex-col items-center gap-1 border-0 bg-transparent p-0"
      style={{ left: style.left, top: style.top, width: 40, height: 40 }}
      data-district={data.id}
      data-health={data.health}
      aria-label={`${data.code} district -- ${data.health}${data.alerts > 0 ? `, ${data.alerts} alerts` : ''}`}
      onClick={() => onSelect?.(data.id)}
    >
      {/* Beacon dot */}
      <div
        className={cn(
          'h-3 w-3 rounded-full',
          isAnimated && isOperational && 'beacon-pulse',
          isAnimated && isDown && 'beacon-flash',
          isOffline && 'opacity-40',
        )}
        style={dotStyle}
        data-health={data.health}
      />

      {/* District code label */}
      <span
        className={cn(
          'font-sans text-[9px] font-semibold tracking-[0.12em] uppercase',
          'leading-none text-[var(--color-text-primary)] select-none',
          isOffline ? 'opacity-40' : 'opacity-70',
        )}
      >
        {data.code}
      </span>
    </button>
  )
}
