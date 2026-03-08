'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const SEVERITY_LEVELS = [
  { label: 'Extreme', color: '#ef4444' },
  { label: 'Severe', color: '#f97316' },
  { label: 'Moderate', color: '#eab308' },
  { label: 'Minor', color: '#3b82f6' },
  { label: 'Unknown', color: '#6b7280' },
] as const

/** Auto-collapse delay in milliseconds. */
const AUTO_COLLAPSE_MS = 5000

export function MobileMapLegend() {
  const [expanded, setExpanded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Auto-collapse timer ──────────────────────────────────────────
  const clearAutoCollapse = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startAutoCollapse = useCallback(() => {
    clearAutoCollapse()
    timerRef.current = setTimeout(() => {
      setExpanded(false)
    }, AUTO_COLLAPSE_MS)
  }, [clearAutoCollapse])

  // Start timer whenever we expand; clear on unmount
  useEffect(() => {
    if (expanded) {
      startAutoCollapse()
    } else {
      clearAutoCollapse()
    }
    return clearAutoCollapse
  }, [expanded, startAutoCollapse, clearAutoCollapse])

  // ── Tap-outside to collapse ──────────────────────────────────────
  useEffect(() => {
    if (!expanded) return

    function handleTapOutside(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setExpanded(false)
      }
    }

    document.addEventListener('pointerdown', handleTapOutside)
    return () => document.removeEventListener('pointerdown', handleTapOutside)
  }, [expanded])

  // Reset auto-collapse timer on any interaction within the legend
  const handleInteraction = useCallback(() => {
    if (expanded) {
      startAutoCollapse()
    }
  }, [expanded, startAutoCollapse])

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  // ── Collapsed pill ───────────────────────────────────────────────
  if (!expanded) {
    return (
      <div ref={containerRef}>
        <button
          type="button"
          onClick={toggleExpanded}
          aria-label="Show map severity legend"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 28,
            padding: '0 10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255, 255, 255, 0.40)',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation' as const,
          }}
        >
          {/* Stacked severity dots */}
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            {SEVERITY_LEVELS.slice(0, 4).map((level) => (
              <span
                key={level.label}
                aria-hidden="true"
                style={{
                  display: 'block',
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  backgroundColor: level.color,
                }}
              />
            ))}
          </span>
          LEGEND
        </button>
      </div>
    )
  }

  // ── Expanded card ────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Map severity legend"
      onPointerDown={handleInteraction}
      style={{
        width: 180,
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
        padding: '10px 12px',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {/* Header row with collapse affordance */}
      <button
        type="button"
        onClick={toggleExpanded}
        aria-label="Collapse legend"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: 8,
          padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation' as const,
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255, 255, 255, 0.35)',
            fontFamily: 'inherit',
          }}
        >
          SEVERITY
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.25)',
            fontFamily: 'inherit',
          }}
          aria-hidden="true"
        >
          {'\u2715'}
        </span>
      </button>

      {/* Severity rows */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {SEVERITY_LEVELS.map((level) => (
          <div
            key={level.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: level.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.55)',
                letterSpacing: '0.04em',
              }}
            >
              {level.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
