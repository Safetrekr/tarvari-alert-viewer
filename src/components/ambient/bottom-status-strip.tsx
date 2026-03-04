/**
 * BottomStatusStrip -- fixed-position viewport HUD element pinned to the
 * bottom edge of the screen. Displays a sparse row of system metrics,
 * data stream indicators, and operational readouts.
 *
 * Oblivion-inspired: evokes the persistent status footer seen in
 * UI_13/UI_14 with data throughput, packet counts, and system health.
 *
 * Positioned between the existing SessionTimecode (bottom-right) and
 * the Tarva star + logout button (bottom-left), filling the center.
 *
 * This is a viewport-fixed element (NOT world-space).
 *
 * @module bottom-status-strip
 * @see Phase F: Ambient enrichments (top/bottom details)
 */

'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { useUIStore, uiSelectors } from '@/stores/ui.store'
import type { DistrictId } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LABEL_COLOR = 'rgba(var(--ambient-ink-rgb), 0.22)'
const VALUE_COLOR = 'rgba(var(--ambient-ink-rgb), 0.40)'
const TEAL_COLOR = 'rgba(14, 165, 233, 0.30)'
const EMBER_COLOR = 'rgba(var(--ember-rgb), 0.28)'
const SEPARATOR_COLOR = 'rgba(var(--ambient-ink-rgb), 0.08)'

const FONT_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 8,
  fontWeight: 500,
  letterSpacing: '0.08em',
  lineHeight: 1,
  textTransform: 'uppercase',
}

// ---------------------------------------------------------------------------
// Helper: drifting numeric value
// ---------------------------------------------------------------------------

function useDriftingValue(
  base: number,
  variance: number,
  intervalMs: number,
  decimals = 1,
): string {
  const [value, setValue] = useState(base)

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(base + (Math.random() - 0.5) * 2 * variance)
    }, intervalMs)
    return () => clearInterval(interval)
  }, [base, variance, intervalMs])

  return value.toFixed(decimals)
}

// ---------------------------------------------------------------------------
// Helper: incrementing packet counter
// ---------------------------------------------------------------------------

function usePacketCounter(): string {
  const [count, setCount] = useState(() => 142857)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 5) + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return count.toLocaleString()
}

// ---------------------------------------------------------------------------
// Subcomponent: Tiny horizontal waveform
// ---------------------------------------------------------------------------

function MiniWaveform({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height

    const animate = () => {
      const t = performance.now() / 1000
      ctx.clearRect(0, 0, w, h)
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()

      for (let x = 0; x < w; x++) {
        const y =
          h / 2 +
          Math.sin(x * 0.25 + t * 3) * 2 +
          Math.sin(x * 0.1 + t * 1.5) * 1.5
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }

      ctx.stroke()
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      width={48}
      height={10}
      style={{ width: 48, height: 10, opacity: 0.8 }}
    />
  )
}

// ---------------------------------------------------------------------------
// Subcomponent: Health dot cluster
// ---------------------------------------------------------------------------

const DEFAULT_HEALTH_LABELS = ['AGT', 'SYS', 'NET', 'DB', 'API', 'MEM'] as const

const DISTRICT_HEALTH_LABELS: Record<DistrictId, readonly string[]> = {
  'agent-builder': ['SDK', 'CLI', 'MCP', 'DB', 'TST', 'BLD'],
  'tarva-chat': ['MSG', 'RTR', 'MCP', 'WSS', 'CTX', 'STR'],
  'project-room': ['ORC', 'RUN', 'DAG', 'ART', 'QUE', 'LOG'],
  'tarva-core': ['LLM', 'RSN', 'MEM', 'CTX', 'EMB', 'GPU'],
  'tarva-erp': ['INV', 'MFG', 'BOM', 'QTY', 'WMS', 'RPT'],
  'tarva-code': ['IDX', 'EMB', 'KNW', 'SRC', 'TAG', 'VEC'],
}

function HealthDots({ labels }: { labels: readonly string[] }) {
  const [statuses, setStatuses] = useState<boolean[]>(() =>
    labels.map(() => true),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setStatuses(labels.map(() => Math.random() > 0.05))
    }, 10000)
    return () => clearInterval(interval)
  }, [labels])

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {labels.map((label, i) => (
        <div
          key={label}
          style={{ display: 'flex', alignItems: 'center', gap: 3 }}
        >
          <div
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              backgroundColor: statuses[i] ? TEAL_COLOR : EMBER_COLOR,
              transition: 'background-color 600ms ease',
            }}
          />
          <span style={{ ...FONT_STYLE, color: LABEL_COLOR, fontSize: 7 }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BottomStatusStrip = memo(function BottomStatusStrip() {
  const throughput = useDriftingValue(2.4, 0.3, 4000)
  const latency = useDriftingValue(12, 3, 5000, 0)
  const packets = usePacketCounter()
  const isDistrictView = useUIStore(uiSelectors.isDistrictView)
  const targetId = useUIStore(uiSelectors.morphTargetId)

  const healthLabels = isDistrictView && targetId
    ? (DISTRICT_HEALTH_LABELS[targetId as DistrictId] ?? DEFAULT_HEALTH_LABELS)
    : DEFAULT_HEALTH_LABELS

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        pointerEvents: 'none',
        zIndex: 35,
        borderTop: `1px solid ${SEPARATOR_COLOR}`,
      }}
    >
      {/* Left: Health dot cluster */}
      <HealthDots labels={healthLabels} />

      <div
        style={{ width: 1, height: 10, backgroundColor: SEPARATOR_COLOR }}
      />

      {/* Center-left: Throughput */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MiniWaveform color={TEAL_COLOR} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ ...FONT_STYLE, color: LABEL_COLOR }}>PKT/s</span>
          <span style={{ ...FONT_STYLE, color: VALUE_COLOR, fontSize: 9 }}>
            {throughput}K
          </span>
        </div>
      </div>

      <div
        style={{ width: 1, height: 10, backgroundColor: SEPARATOR_COLOR }}
      />

      {/* Center: Packets processed */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ ...FONT_STYLE, color: LABEL_COLOR }}>PACKETS</span>
        <span style={{ ...FONT_STYLE, color: VALUE_COLOR, fontSize: 9 }}>
          {packets}
        </span>
      </div>

      <div
        style={{ width: 1, height: 10, backgroundColor: SEPARATOR_COLOR }}
      />

      {/* Center-right: Latency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ ...FONT_STYLE, color: LABEL_COLOR }}>LATENCY</span>
          <span style={{ ...FONT_STYLE, color: VALUE_COLOR, fontSize: 9 }}>
            {latency}ms
          </span>
        </div>
        <MiniWaveform color={EMBER_COLOR} />
      </div>

      <div
        style={{ width: 1, height: 10, backgroundColor: SEPARATOR_COLOR }}
      />

      {/* Right: Data stream status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ ...FONT_STYLE, color: LABEL_COLOR, fontSize: 7 }}>
          STREAM ACTIVE
        </span>
        <div
          style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            backgroundColor: TEAL_COLOR,
          }}
          className="enrichment-rec-pulse"
        />
      </div>
    </div>
  )
})
