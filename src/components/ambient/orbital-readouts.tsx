/**
 * OrbitalReadouts -- monospace telemetry text blocks scattered around
 * the capsule ring at ~380-480px radius.
 *
 * Each readout displays district telemetry positioned at a specific
 * angle using trigonometry, oriented horizontally (not rotated along
 * the arc). Values periodically flicker via a CSS keyframe animation
 * defined in `enrichment.css`, with staggered animation-delay per
 * readout so they don't all blink in unison.
 *
 * Reads live district data from the enrichment store. Shows 6 readouts
 * (one per district) with shortCode, uptime, and response time.
 *
 * At default zoom 0.5, the 18px world-space font renders at ~9px on
 * screen -- subtle enough to feel like ambient instrumentation without
 * competing with the capsule ring or hub glyph.
 *
 * Purely decorative: pointer-events disabled, aria-hidden assumed
 * from the parent wrapper.
 *
 * @module orbital-readouts
 * @see WS-1.6 Ambient Effects Layer
 */

'use client'

import { useMemo } from 'react'
import { useEnrichmentStore } from '@/stores/enrichment.store'
import type { DistrictId } from '@/lib/interfaces/district'
import type { DistrictEnrichment } from '@/lib/enrichment/enrichment-types'

// ---------------------------------------------------------------------------
// Layout constants (world-space pixels)
// ---------------------------------------------------------------------------

/**
 * Angular positions and radii for the 6 readouts around the ring.
 * Distributed roughly evenly, with varied radii for organic feel.
 */
interface ReadoutPosition {
  angle: number
  radius: number
  delay: number
}

const POSITIONS: ReadoutPosition[] = [
  { angle: 15, radius: 420, delay: 0 },
  { angle: 75, radius: 440, delay: 2.4 },
  { angle: 135, radius: 400, delay: 5.1 },
  { angle: 195, radius: 460, delay: 1.7 },
  { angle: 255, radius: 430, delay: 7.3 },
  { angle: 315, radius: 410, delay: 3.8 },
]

/** Convert degrees to radians. */
const toRad = (deg: number): number => (deg * Math.PI) / 180

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format seconds into a compact uptime string.
 * Examples: "3.2H", "47M", "12S"
 */
function formatCompactUptime(seconds: number): string {
  if (seconds >= 3600) {
    const hours = seconds / 3600
    return `${hours.toFixed(1)}H`
  }
  if (seconds >= 60) {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}M`
  }
  return `${seconds}S`
}

// ---------------------------------------------------------------------------
// District ordering (ring order)
// ---------------------------------------------------------------------------

const DISTRICT_ORDER = [
  'agent-builder',
  'tarva-chat',
  'project-room',
  'tarva-core',
  'tarva-erp',
  'tarva-code',
] as const

// ---------------------------------------------------------------------------
// Focus-highlight opacity helpers
// ---------------------------------------------------------------------------

/**
 * Compute label and value opacities based on the current focus state.
 *
 * - No focus (null)   -> default ghost opacities (label 0.15, value 0.20)
 * - Focused & match   -> brightened (label 0.50, value 0.70)
 * - Focused & no match -> dimmed further (label 0.06, value 0.08)
 */
function focusOpacity(
  readoutId: string,
  focusedId: DistrictId | null,
): { label: number; value: number } {
  if (focusedId === null) return { label: 0.15, value: 0.2 }
  if (readoutId === focusedId) return { label: 0.5, value: 0.7 }
  return { label: 0.06, value: 0.08 }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrbitalReadouts() {
  const districts = useEnrichmentStore((s) => s.districts)
  const focusedDistrictId = useEnrichmentStore((s) => s.focusedDistrictId)

  // Build readout data from store
  const readouts = useMemo(() => {
    return DISTRICT_ORDER.map((id, idx) => {
      const d: DistrictEnrichment = districts[id]
      const pos = POSITIONS[idx]
      return {
        id,
        shortCode: d.shortCode,
        uptime: d.uptime,
        responseTimeMs: d.responseTimeMs,
        angle: pos.angle,
        radius: pos.radius,
        delay: pos.delay,
      }
    })
  }, [districts])

  return (
    <>
      {readouts.map((readout) => {
        const x = Math.cos(toRad(readout.angle)) * readout.radius
        const y = Math.sin(toRad(readout.angle)) * readout.radius
        const opacity = focusOpacity(readout.id, focusedDistrictId)

        return (
          <div
            key={readout.id}
            className="absolute whitespace-nowrap"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          >
            {/* Line 1: shortCode */}
            <div
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 18,
                letterSpacing: '0.08em',
                color: `rgba(255, 255, 255, ${opacity.label})`,
                textTransform: 'uppercase',
                transition: 'color 200ms ease',
              }}
            >
              {readout.shortCode}
            </div>
            {/* Line 2: UPT compact uptime */}
            <div
              className="enrichment-flicker"
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 14,
                letterSpacing: '0.06em',
                color: `rgba(255, 255, 255, ${opacity.value})`,
                textTransform: 'uppercase',
                animationDelay: `${readout.delay}s`,
                transition: 'color 200ms ease',
              }}
            >
              UPT {formatCompactUptime(readout.uptime)}
            </div>
            {/* Line 3: RSP response time */}
            <div
              className="enrichment-flicker"
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 14,
                letterSpacing: '0.06em',
                color: `rgba(255, 255, 255, ${opacity.value})`,
                textTransform: 'uppercase',
                animationDelay: `${readout.delay + 1.5}s`,
                transition: 'color 200ms ease',
              }}
            >
              RSP {readout.responseTimeMs}ms
            </div>
          </div>
        )
      })}
    </>
  )
}
