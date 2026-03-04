/**
 * TarvaChatScene -- ambient background for the Tarva Chat district.
 *
 * Theme: "Communications / Signal" -- multi-agent chat interface (port 4000).
 *
 * Composed from shared scene primitives (DataStream, StatusDotGrid,
 * GhostCounter) plus a canvas-based signal waveform and an SVG latency
 * sparkline. Pure decorative -- no interactivity.
 *
 * @module tarva-chat-scene
 * @see src/components/district-view/shared-scene-primitives.tsx
 */

'use client'

import { memo, useEffect, useRef, useCallback } from 'react'
import type { PanelSide } from '@/lib/morph-types'
import {
  DataStream,
  StatusDotGrid,
  GhostCounter,
} from '@/components/district-view/shared-scene-primitives'

// ---------------------------------------------------------------------------
// Chat message stream content
// ---------------------------------------------------------------------------

const CHAT_LINES = [
  '[CLAUDE] Analyzing dependency tree...',
  '[USER] Deploy agent to staging',
  '[SYSTEM] MCP server connected',
  '[CLAUDE] Found 3 conflicts in base',
  '[USER] Run full test suite',
  '[SYSTEM] Ollama model loaded',
  '[CLAUDE] Generating migration plan...',
  '[USER] Approve merge request',
  '[SYSTEM] WebSocket reconnected',
  '[CLAUDE] Code review complete',
]

// ---------------------------------------------------------------------------
// MCP server grid labels
// ---------------------------------------------------------------------------

const MCP_LABELS = ['CORE', 'AGENTS', 'SEARCH']

// ---------------------------------------------------------------------------
// Latency sparkline points
// ---------------------------------------------------------------------------

const LATENCY_POINTS = [
  [0, 28],
  [10, 22],
  [20, 30],
  [30, 18],
  [40, 24],
  [50, 14],
  [60, 20],
  [70, 12],
  [80, 26],
  [90, 16],
  [100, 22],
  [110, 10],
  [120, 18],
  [130, 24],
  [140, 8],
  [150, 20],
  [160, 14],
  [170, 26],
  [180, 16],
  [190, 22],
  [200, 18],
] as const

const LATENCY_LINE_POINTS = LATENCY_POINTS.map(([x, y]) => `${x},${y}`).join(
  ' ',
)

// Build the area polygon: line points + bottom-right + bottom-left
const LATENCY_AREA_POINTS = [
  ...LATENCY_POINTS.map(([x, y]) => `${x},${y}`),
  '200,40',
  '0,40',
].join(' ')

// ---------------------------------------------------------------------------
// Signal waveform (canvas-based)
// ---------------------------------------------------------------------------

function SignalWaveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const t = timestamp / 1000

    ctx.clearRect(0, 0, w, h)

    // Wave 1: teal
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x++) {
      const y = h / 2 + Math.sin(x * 0.05 + t * 2) * (h * 0.35)
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    // Wave 2: ember
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(var(--ember-rgb), 0.10)'
    ctx.lineWidth = 1
    for (let x = 0; x < w; x++) {
      const y = h / 2 + Math.sin(x * 0.03 + t * 1.5 + 1) * (h * 0.3)
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()

    rafRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={60}
      style={{ display: 'block', width: 400, height: 60 }}
    />
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TarvaChatScene = memo(function TarvaChatScene({ dockSide }: { dockSide: PanelSide }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {/* 1. Message Stream -- left side */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', top: 80, ...(dockSide === 'right' ? { left: 40 } : { right: 40 }) }}
      >
        <DataStream
          lines={CHAT_LINES}
          width={320}
          height={500}
          color="rgba(255, 255, 255, 0.05)"
          scrollDuration={60}
        />
      </div>

      {/* 2. Signal Waveform -- center-left */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', top: '55%', ...(dockSide === 'right' ? { left: 60 } : { right: 60 }) }}
      >
        <SignalWaveform />
      </div>

      {/* 3. Channels Counter -- center */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: '38%',
          ...(dockSide === 'right' ? { left: '35%' } : { right: '35%' }),
        }}
      >
        <GhostCounter value="847" label="ACTIVE CHANNELS" size={96} />
      </div>

      {/* 4. MCP Server Grid -- upper area */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', top: 90, ...(dockSide === 'right' ? { right: 440 } : { left: 440 }) }}
      >
        <StatusDotGrid
          rows={3}
          cols={6}
          labels={MCP_LABELS}
          activeColor="rgba(14, 165, 233, 0.25)"
          activeRatio={0.85}
        />
      </div>

      {/* 5. Latency Sparkline -- lower-left */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', bottom: 100, ...(dockSide === 'right' ? { left: 60 } : { right: 60 }) }}
      >
        <svg
          width={200}
          height={40}
          viewBox="0 0 200 40"
          style={{ display: 'block' }}
        >
          {/* Area fill */}
          <polygon
            points={LATENCY_AREA_POINTS}
            fill="rgba(14, 165, 233, 0.06)"
          />
          {/* Stroke line */}
          <polyline
            points={LATENCY_LINE_POINTS}
            fill="none"
            stroke="rgba(14, 165, 233, 0.12)"
            strokeWidth={1}
          />
        </svg>
      </div>
    </div>
  )
})
