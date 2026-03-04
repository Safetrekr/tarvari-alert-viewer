/**
 * SessionTimecode -- fixed-position HUD element displaying elapsed session
 * time as a broadcast-style timecode in the viewport's bottom-right corner.
 *
 * Format: HH:MM:SS:FF where FF is a frame counter (00-59) driven by
 * requestAnimationFrame for a "live feed" aesthetic. Accompanied by a
 * pulsing teal "REC" indicator dot.
 *
 * This is a viewport-fixed element (NOT world-space) -- it stays pinned
 * to the bottom-right corner regardless of camera position or zoom.
 *
 * Timing:
 * - HH:MM:SS tracks elapsed time since mount via setInterval (1000ms)
 * - FF cycles 00-59 via requestAnimationFrame (~16ms per tick)
 * - Reduced motion: FF freezes at 00, SS still increments
 *
 * @module session-timecode
 * @see Phase E: Ambient enrichments
 */

'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Pad a number to two digits. */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SessionTimecode = memo(function SessionTimecode() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const frameRef = useRef(0)
  const frameDisplayRef = useRef<HTMLSpanElement>(null)
  const rafIdRef = useRef<number | null>(null)
  const mountTimeRef = useRef(0)

  // Check reduced motion preference
  const prefersReducedMotion = useRef(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = mql.matches
    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches
    }
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Increment elapsed seconds every 1000ms
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Frame counter via rAF -- writes directly to DOM for performance
  const animateFrame = useCallback(() => {
    if (prefersReducedMotion.current) {
      // Reduced motion: freeze frame counter at 00
      if (frameDisplayRef.current) {
        frameDisplayRef.current.textContent = '00'
      }
      rafIdRef.current = requestAnimationFrame(animateFrame)
      return
    }

    const now = performance.now()
    // Derive frame from elapsed ms, cycling 0-59
    const elapsed = now - mountTimeRef.current
    const frame = Math.floor((elapsed % 1000) / (1000 / 60)) % 60
    frameRef.current = frame

    if (frameDisplayRef.current) {
      frameDisplayRef.current.textContent = pad2(frame)
    }

    rafIdRef.current = requestAnimationFrame(animateFrame)
  }, [])

  useEffect(() => {
    mountTimeRef.current = performance.now()
    rafIdRef.current = requestAnimationFrame(animateFrame)
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [animateFrame])

  // Derive HH:MM:SS from elapsed seconds
  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)
  const seconds = elapsedSeconds % 60

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Pulsing REC dot */}
      <div
        className="enrichment-rec-pulse"
        style={{
          width: 3,
          height: 3,
          borderRadius: '50%',
          backgroundColor: 'rgba(14, 165, 233, 0.3)',
          flexShrink: 0,
        }}
      />

      {/* REC label */}
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 8,
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.15)',
          letterSpacing: '0.06em',
          lineHeight: 1,
        }}
      >
        REC
      </span>

      {/* Timecode display */}
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 10,
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.25)',
          letterSpacing: '0.04em',
          lineHeight: 1,
        }}
      >
        {pad2(hours)}:{pad2(minutes)}:{pad2(seconds)}:
        <span ref={frameDisplayRef}>00</span>
      </span>
    </div>
  )
})
