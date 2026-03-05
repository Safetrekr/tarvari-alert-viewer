/**
 * ViewModeToggle -- segmented toggle for switching between
 * Triaged / All Bundles / Raw Alerts view modes.
 *
 * Positioned above the map, left-aligned with the map's left edge.
 * Uses motion/react layoutId for smooth active-segment animation.
 *
 * @module ViewModeToggle
 */

'use client'

import { motion } from 'motion/react'
import type { ViewMode } from '@/lib/interfaces/intel-bundles'
import { VIEW_MODE_LABELS } from '@/lib/interfaces/intel-bundles'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEGMENTS: ViewMode[] = ['triaged', 'all-bundles', 'raw']

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  /** Optional count to display next to the active segment (e.g. bundle count). */
  counts?: Partial<Record<ViewMode, number>>
}

export function ViewModeToggle({ value, onChange, counts }: ViewModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Data view mode"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0,
        padding: 3,
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 10,
      }}
    >
      {SEGMENTS.map((mode) => {
        const isActive = value === mode
        return (
          <button
            key={mode}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(mode)}
            style={{
              ...MONO,
              position: 'relative',
              padding: '6px 14px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isActive
                ? 'rgba(255, 255, 255, 0.60)'
                : 'rgba(255, 255, 255, 0.25)',
              background: 'transparent',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'color 200ms ease',
              whiteSpace: 'nowrap',
              zIndex: isActive ? 1 : 0,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.25)'
              }
            }}
          >
            {isActive && (
              <motion.div
                layoutId="viewmode-active"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {VIEW_MODE_LABELS[mode]}
            {counts?.[mode] != null && (
              <span
                style={{
                  ...MONO,
                  fontSize: 9,
                  fontWeight: 500,
                  marginLeft: 4,
                  opacity: isActive ? 0.5 : 0.3,
                }}
              >
                {counts[mode]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
