/**
 * DistrictViewHeader -- district name label (top) + vertically-centered
 * animated back button.
 *
 * The back button is on the OPPOSITE side from the dock panel:
 *   - Dock on right → back button on left
 *   - Dock on left  → back button on right
 *
 * This preserves the spatial illusion of "moving toward" the clicked
 * capsule and "returning" in the opposite direction.
 *
 * @module district-view-header
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { DISTRICTS, type DistrictId } from '@/lib/interfaces/district'
import type { PanelSide } from '@/lib/morph-types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DistrictViewHeaderProps {
  readonly districtId: DistrictId
  readonly panelSide: PanelSide
  readonly onBack: () => void
}

// ---------------------------------------------------------------------------
// Animated chevron arrows
// ---------------------------------------------------------------------------

function PulsingChevrons({ direction }: { direction: 'left' | 'right' }) {
  const char = direction === 'left' ? '\u2039' : '\u203A' // ‹ or ›
  const indices = direction === 'left' ? [0, 1, 2] : [2, 1, 0]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        ...(direction === 'left' ? { marginRight: 6 } : { marginLeft: 6 }),
      }}
    >
      {indices.map((i, pos) => (
        <motion.span
          key={pos}
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 300,
            color: 'rgba(255, 255, 255, 0.25)',
            lineHeight: 1,
          }}
          animate={{
            opacity: [0.15, 0.5, 0.15],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: (direction === 'left' ? 2 - i : i) * 0.2,
          }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Breathing border glow
// ---------------------------------------------------------------------------

function useBreathingGlow(ref: React.RefObject<HTMLButtonElement | null>) {
  const raf = useRef<number>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const animate = () => {
      const t = performance.now() / 1000
      const pulse = 0.5 + Math.sin(t * 1.8) * 0.5
      const alpha = 0.04 + pulse * 0.08
      el.style.borderColor = `rgba(255, 255, 255, ${alpha.toFixed(3)})`
      el.style.boxShadow = `0 0 ${8 + pulse * 12}px rgba(255, 255, 255, ${(alpha * 0.4).toFixed(3)})`
      raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf.current)
  }, [ref])
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictViewHeader({
  districtId,
  panelSide,
  onBack,
}: DistrictViewHeaderProps) {
  const district = DISTRICTS.find((d) => d.id === districtId)
  const displayName = district?.displayName ?? districtId
  const btnRef = useRef<HTMLButtonElement>(null)

  useBreathingGlow(btnRef)

  // Back button is on the opposite side from the dock
  const backSide = panelSide === 'right' ? 'left' : 'right'
  const slideFrom = backSide === 'left' ? -20 : 20

  // District name label is on the same side as the back button
  const labelSide = backSide

  const handleBack = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      onBack()
    },
    [onBack],
  )

  return (
    <>
      {/* District name + health dot -- top bar */}
      <div
        style={{
          position: 'fixed',
          top: 56,
          [labelSide]: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 32,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.35)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {displayName}
        </span>
        <div
          className="district-health-dot-pulse"
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'var(--color-healthy, #22c55e)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Back button -- vertically centered, opposite side from dock */}
      <motion.button
        ref={btnRef}
        onClick={handleBack}
        initial={{ opacity: 0, x: slideFrom }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: slideFrom }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        style={{
          position: 'fixed',
          top: '50%',
          [backSide]: 32,
          transform: 'translateY(-50%)',
          zIndex: 32,
          display: 'flex',
          alignItems: 'center',
          padding: '10px 16px 10px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(255, 255, 255, 0.03)',
          cursor: 'pointer',
          pointerEvents: 'auto',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.3)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          lineHeight: 1,
          transition: 'color 200ms ease, background 200ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
        }}
        aria-label={`Back to hub from ${displayName}`}
      >
        {backSide === 'left' && <PulsingChevrons direction="left" />}
        BACK
        {backSide === 'right' && <PulsingChevrons direction="right" />}
      </motion.button>
    </>
  )
}
