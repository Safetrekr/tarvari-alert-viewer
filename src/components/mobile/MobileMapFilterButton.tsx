'use client'

import { motion, AnimatePresence } from 'motion/react'

export interface MobileMapFilterButtonProps {
  readonly activeFilterCount: number
  readonly onTap: () => void
}

export function MobileMapFilterButton({
  activeFilterCount,
  onTap,
}: MobileMapFilterButtonProps) {
  const hasFilters = activeFilterCount > 0

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={
        hasFilters
          ? `Open filters, ${activeFilterCount} active`
          : 'Open filters'
      }
      aria-haspopup="dialog"
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: 10,
        background: 'rgba(5,9,17,0.85)',
        backdropFilter: 'blur(8px) saturate(120%)',
        WebkitBackdropFilter: 'blur(8px) saturate(120%)',
        border: hasFilters
          ? '1px solid rgba(100,180,220,0.25)'
          : '1px solid rgba(255,255,255,0.08)',
        color: hasFilters
          ? 'rgba(255,255,255,0.7)'
          : 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
        transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
        pointerEvents: 'auto',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>

      <AnimatePresence>
        {hasFilters && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: '#64b4dc',
              color: 'rgba(5,9,17,0.95)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
            }}
          >
            {activeFilterCount}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
