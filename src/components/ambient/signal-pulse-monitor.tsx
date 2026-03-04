/**
 * SignalPulseMonitor -- scrolling Canvas 2D waveform visualization
 * positioned below the capsule ring in world space.
 *
 * Positioned at world-space (-240, 520), 480x120px. At zoom 0.5 it
 * renders at ~240x60px on screen.
 *
 * Draws 3 overlapping sine waves with different frequencies, amplitudes,
 * and colors (teal, ember, white ghost) that continuously scroll
 * horizontally via `requestAnimationFrame`. The animation pauses when
 * a `[data-panning='true']` ancestor is detected (polled at frame
 * time via DOM traversal -- lightweight since it's just an attribute
 * check on the parent chain).
 *
 * Uses an HTML `<canvas>` element for smooth sub-pixel rendering.
 * The rAF loop is properly cancelled on unmount to prevent leaks.
 *
 * Purely decorative: pointer-events disabled, aria-hidden assumed
 * from the parent wrapper.
 *
 * @module signal-pulse-monitor
 * @see Phase C Spatial Enrichment
 */

'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useEnrichmentStore } from '@/stores/enrichment.store'
import type { WaveformState } from '@/lib/enrichment/enrichment-types'

// ---------------------------------------------------------------------------
// Position & size constants (world-space pixels)
// ---------------------------------------------------------------------------

const PANEL_X = -1200
const PANEL_Y = 520
const PANEL_W = 480
const PANEL_H = 120

const CANVAS_W = 432
const CANVAS_H = 60
const CANVAS_PAD_X = 24
const CANVAS_PAD_TOP = 44

// ---------------------------------------------------------------------------
// Wave definitions
// ---------------------------------------------------------------------------

interface WaveDef {
  color: string
  frequency: number
  amplitude: number
  /** Phase scroll speed (radians per frame at 60fps). */
  speed: number
}

const WAVES: WaveDef[] = [
  { color: 'rgba(14, 165, 233, 0.3)', frequency: 0.02, amplitude: 15, speed: 0.03 },
  { color: 'rgba(var(--ember-rgb), 0.2)', frequency: 0.035, amplitude: 10, speed: 0.02 },
  { color: 'rgba(255, 255, 255, 0.1)', frequency: 0.05, amplitude: 8, speed: 0.015 },
]

// ---------------------------------------------------------------------------
// Shared text styles (world-space)
// ---------------------------------------------------------------------------

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

// ---------------------------------------------------------------------------
// Panning detection helper
// ---------------------------------------------------------------------------

/**
 * Walk up from `el` looking for `data-panning="true"`.
 * Returns true if any ancestor has it set.
 */
function isAncestorPanning(el: HTMLElement | null): boolean {
  let node = el?.parentElement ?? null
  while (node) {
    if (node.dataset.panning === 'true') return true
    node = node.parentElement
  }
  return false
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SignalPulseMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number>(0)
  const phaseRef = useRef<number>(0)
  const runningRef = useRef(true)

  // Store waveform in a ref so the rAF loop reads it without subscribing
  const waveformRef = useRef<WaveformState>({ frequency: 1.0, noise: 0 })
  const waveform = useEnrichmentStore((s) => s.waveform)

  // Sync store waveform to ref on each render
  waveformRef.current = waveform

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Check panning state via ancestor data attribute.
    // When panning, stop the rAF loop entirely — a MutationObserver
    // on the panning attribute will restart it when panning ends.
    if (isAncestorPanning(wrapperRef.current)) {
      runningRef.current = false
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Read waveform params from ref (updated each React render)
    const wf = waveformRef.current

    // Advance phase
    phaseRef.current += 1

    // Clear
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    const centerY = CANVAS_H / 2

    // Draw each wave
    for (const wave of WAVES) {
      ctx.beginPath()
      ctx.strokeStyle = wave.color
      ctx.lineWidth = 1.5

      // Multiply base frequency by waveform.frequency to stress/calm the signal
      const effectiveFrequency = wave.frequency * wf.frequency

      for (let x = 0; x < CANVAS_W; x++) {
        let y =
          centerY +
          Math.sin(x * effectiveFrequency + phaseRef.current * wave.speed) * wave.amplitude

        // Add noise when waveform.noise > 0
        if (wf.noise > 0) {
          y += (Math.random() - 0.5) * wf.noise * wave.amplitude
        }

        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.stroke()
    }

    // Draw a faint center line
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1
    ctx.moveTo(0, centerY)
    ctx.lineTo(CANVAS_W, centerY)
    ctx.stroke()

    frameRef.current = requestAnimationFrame(draw)
  }, [])

  /** Start the rAF loop if it's not already running. */
  const startLoop = useCallback(() => {
    if (!runningRef.current) {
      runningRef.current = true
      frameRef.current = requestAnimationFrame(draw)
    }
  }, [draw])

  useEffect(() => {
    runningRef.current = true
    frameRef.current = requestAnimationFrame(draw)

    // Watch for panning attribute changes on ancestors to restart the loop
    const wrapper = wrapperRef.current
    if (wrapper) {
      const panningAncestor = wrapper.closest('[data-panning]')
      if (panningAncestor) {
        const observer = new MutationObserver(() => {
          if ((panningAncestor as HTMLElement).dataset.panning !== 'true') {
            startLoop()
          }
        })
        observer.observe(panningAncestor, { attributes: true, attributeFilter: ['data-panning'] })
        return () => {
          cancelAnimationFrame(frameRef.current)
          observer.disconnect()
        }
      }
    }

    return () => {
      cancelAnimationFrame(frameRef.current)
    }
  }, [draw, startLoop])

  return (
    <div
      ref={wrapperRef}
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
          padding: CANVAS_PAD_X,
          paddingTop: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: CANVAS_PAD_TOP,
            paddingTop: 12,
          }}
        >
          <span
            style={{
              ...MONO,
              fontSize: 16,
              color: 'rgba(255, 255, 255, 0.3)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            SIGNAL DATA
          </span>
          <span
            style={{
              ...MONO,
              fontSize: 12,
              color: 'rgba(var(--ember-rgb), 0.6)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: 'rgba(var(--ember-rgb), 0.08)',
              border: '1px solid rgba(var(--ember-rgb), 0.15)',
              borderRadius: 4,
              padding: '3px 8px',
            }}
          >
            DECODE
          </span>
        </div>

        {/* Canvas waveform */}
        <div
          style={{
            flex: 1,
            border: '1px solid rgba(255, 255, 255, 0.03)',
            borderRadius: 6,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} />
        </div>
      </div>
    </div>
  )
}
