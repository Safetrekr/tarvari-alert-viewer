/**
 * ScanlineOverlay -- selection sweep animation for district capsules.
 *
 * Renders 3 motion.div scanlines (1 primary + 2 trailing ghosts)
 * that sweep top-to-bottom in 350ms on capsule selection.
 * Uses motion/react for Choreography-tier animation.
 *
 * @module scanline-overlay
 * @see WS-1.2 Section 4.10
 */

'use client'

import { motion } from 'motion/react'

import { cn } from '@/lib/utils'

export interface ScanlineOverlayProps {
  /** Height of the parent container for scan distance. */
  scanHeight?: number
}

export function ScanlineOverlay({ scanHeight = 228 }: ScanlineOverlayProps) {
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Primary scanline */}
      <motion.div
        className={cn(
          'absolute right-0 left-0 h-px',
          'bg-[var(--color-ember)] opacity-[0.12]',
          'shadow-[0_0_4px_rgba(var(--ember-rgb),0.10)]',
        )}
        initial={{ y: -2 }}
        animate={{ y: scanHeight }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
      {/* Ghost 1 -- trails by 30ms */}
      <motion.div
        className="absolute right-0 left-0 h-px bg-[var(--color-ember)] opacity-[0.06]"
        initial={{ y: -2 }}
        animate={{ y: scanHeight }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.03 }}
      />
      {/* Ghost 2 -- trails by 60ms */}
      <motion.div
        className="absolute right-0 left-0 h-px bg-[var(--color-ember)] opacity-[0.03]"
        initial={{ y: -2 }}
        animate={{ y: scanHeight }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.06 }}
      />
    </motion.div>
  )
}
