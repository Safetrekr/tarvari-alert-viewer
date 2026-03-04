/**
 * TopTelemetryBar -- fixed-position viewport HUD element pinned to the
 * top edge of the screen. Displays a sparse row of mission-control-style
 * data readouts: system frequency, uplink status, mission epoch, and
 * frame sync indicator.
 *
 * Oblivion-inspired: evokes the persistent telemetry header seen in
 * UI_02/UI_17 with faint mono labels and live-updating values.
 *
 * This is a viewport-fixed element (NOT world-space).
 *
 * @module top-telemetry-bar
 * @see Phase F: Ambient enrichments (top/bottom details)
 */

'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { useUIStore, uiSelectors } from '@/stores/ui.store'
import { DISTRICTS } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LABEL_COLOR = 'rgba(var(--ambient-ink-rgb), 0.22)'
const VALUE_COLOR = 'rgba(var(--ambient-ink-rgb), 0.40)'
const ACCENT_COLOR = 'rgba(14, 165, 233, 0.30)'
const SEPARATOR_COLOR = 'rgba(var(--ambient-ink-rgb), 0.08)'
const DOT_ACTIVE = 'rgba(14, 165, 233, 0.40)'
const DOT_DIM = 'rgba(var(--ambient-ink-rgb), 0.12)'

const FONT_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 8,
  fontWeight: 500,
  letterSpacing: '0.08em',
  lineHeight: 1,
  textTransform: 'uppercase',
}

// ---------------------------------------------------------------------------
// Helper: live epoch counter
// ---------------------------------------------------------------------------

function useEpochCounter(): string {
  const [epoch, setEpoch] = useState(() =>
    Math.floor(Date.now() / 1000).toString(16).toUpperCase(),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setEpoch(Math.floor(Date.now() / 1000).toString(16).toUpperCase())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return epoch
}

// ---------------------------------------------------------------------------
// Helper: cycling frequency display
// ---------------------------------------------------------------------------

const FREQUENCIES = [
  '11.434 GHz',
  '2.4117 GHz',
  '54.521 MHz',
  '8.100 MHz',
  '3.005 GHz',
]

function useCyclingFrequency(): string {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % FREQUENCIES.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  return FREQUENCIES[index]
}

// ---------------------------------------------------------------------------
// Helper: random hex trace
// ---------------------------------------------------------------------------

function useRandomTrace(): string {
  const [trace, setTrace] = useState('7F2A.B91C')

  useEffect(() => {
    const interval = setInterval(() => {
      const a = Math.random().toString(16).substring(2, 6).toUpperCase()
      const b = Math.random().toString(16).substring(2, 6).toUpperCase()
      setTrace(`${a}.${b}`)
    }, 12000)
    return () => clearInterval(interval)
  }, [])

  return trace
}

// ---------------------------------------------------------------------------
// Subcomponent: Signal strength dots
// ---------------------------------------------------------------------------

function SignalDots() {
  const [strength, setStrength] = useState(4)

  useEffect(() => {
    const interval = setInterval(() => {
      setStrength(3 + Math.floor(Math.random() * 3)) // 3-5
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: 2 + i * 1.5,
            backgroundColor: i < strength ? DOT_ACTIVE : DOT_DIM,
            borderRadius: 0.5,
            transition: 'background-color 600ms ease',
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subcomponent: Frame sync bar (tiny pulsing bars)
// ---------------------------------------------------------------------------

function FrameSyncBars() {
  const barsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf: number
    const animate = () => {
      if (barsRef.current) {
        const children = barsRef.current.children
        const t = performance.now() / 1000
        for (let i = 0; i < children.length; i++) {
          const el = children[i] as HTMLElement
          const h = 3 + Math.sin(t * 2.5 + i * 0.8) * 3
          el.style.height = `${h}px`
        }
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={barsRef} style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 8 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 1.5,
            height: 4,
            backgroundColor: ACCENT_COLOR,
            borderRadius: 0.5,
          }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TopTelemetryBar = memo(function TopTelemetryBar() {
  const epoch = useEpochCounter()
  const frequency = useCyclingFrequency()
  const trace = useRandomTrace()
  const isDistrictView = useUIStore(uiSelectors.isDistrictView)
  const targetId = useUIStore(uiSelectors.morphTargetId)

  // Resolve center label based on district view state
  const centerLabel = (() => {
    if (!isDistrictView || !targetId) return 'TARVA LAUNCH // MISSION CONTROL'
    const district = DISTRICTS.find((d) => d.id === targetId)
    return `TARVA LAUNCH // ${district?.displayName?.toUpperCase() ?? targetId.toUpperCase()}`
  })()

  return (
    <div
      style={{
        position: 'fixed',
        top: 14,
        left: 0,
        right: 0,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        pointerEvents: 'none',
        zIndex: 35,
        borderBottom: `1px solid ${SEPARATOR_COLOR}`,
      }}
    >
      {/* Left cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <FrameSyncBars />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ ...FONT_STYLE, color: LABEL_COLOR }}>FREQ</span>
          <span style={{ ...FONT_STYLE, color: VALUE_COLOR, fontSize: 9 }}>
            {frequency}
          </span>
        </div>
        <div
          style={{
            width: 1,
            height: 10,
            backgroundColor: SEPARATOR_COLOR,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ ...FONT_STYLE, color: LABEL_COLOR }}>TRACE</span>
          <span style={{ ...FONT_STYLE, color: VALUE_COLOR, fontSize: 9 }}>
            {trace}
          </span>
        </div>
      </div>

      {/* Center: Mission ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div
          style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            backgroundColor: DOT_ACTIVE,
          }}
          className="enrichment-rec-pulse"
        />
        <span style={{ ...FONT_STYLE, color: LABEL_COLOR, fontSize: 7 }}>
          {centerLabel}
        </span>
        <div
          style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            backgroundColor: DOT_ACTIVE,
          }}
          className="enrichment-rec-pulse"
        />
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ ...FONT_STYLE, color: LABEL_COLOR }}>EPOCH</span>
          <span style={{ ...FONT_STYLE, color: VALUE_COLOR, fontSize: 9 }}>
            {epoch}
          </span>
        </div>
        <div
          style={{
            width: 1,
            height: 10,
            backgroundColor: SEPARATOR_COLOR,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ ...FONT_STYLE, color: LABEL_COLOR }}>UPLINK</span>
          <SignalDots />
        </div>
      </div>
    </div>
  )
})
