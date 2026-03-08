'use client'

import { motion } from 'motion/react'
import type { ViewMode } from '@/lib/interfaces/intel-bundles'
import { VIEW_MODE_LABELS } from '@/lib/interfaces/intel-bundles'

const SEGMENTS: ViewMode[] = ['triaged', 'all-bundles', 'raw']

const SHORT_LABELS: Record<ViewMode, string> = {
  triaged: 'TRIAGED',
  'all-bundles': 'BUNDLES',
  raw: 'RAW',
}

interface MobileViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  counts?: Partial<Record<ViewMode, number>>
}

export function MobileViewModeToggle({ value, onChange, counts }: MobileViewModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Data view mode"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        padding: 3,
        margin: '0 var(--space-content-padding, 12px)',
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
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={VIEW_MODE_LABELS[mode]}
            onClick={() => onChange(mode)}
            style={{
              position: 'relative',
              flex: 1,
              padding: '8px 0',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
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
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="mobile-viewmode-active"
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
            {SHORT_LABELS[mode]}
            {counts?.[mode] != null && (
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
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
