/**
 * DistrictShell -- expanded container that the capsule morphs into.
 *
 * Hosts station content from WS-2.2-2.5 via children prop.
 * Rendered inside AnimatePresence with enter/exit animations.
 *
 * Styling: Active glass material (per VISUAL-DESIGN-SPEC.md 1.7),
 * luminous ember border, 32px border-radius.
 *
 * Layout: Flexbox column with district header + station content area.
 *
 * @module district-shell
 * @see WS-2.1 Section 4.7
 */

'use client'

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { StationEntrance } from './station-entrance'
import type { Variants } from 'motion/react'

/** @deprecated This file is dead code. Variants inlined to avoid broken imports. */
const districtShellVariants: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  enter: { opacity: 1, scale: 1, transition: { type: 'tween', duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.92, transition: { type: 'tween', duration: 0.3, ease: [0.4, 0, 1, 1] } },
}
const stationContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
}
import { DISTRICTS } from '@/lib/interfaces/district'
import { DETAIL_PANEL_DIMENSIONS } from '@/lib/morph-types'
import type { DistrictId } from '@/lib/interfaces/district'
import type { MorphPhase, MorphDirection } from '@/lib/morph-types'

export interface DistrictShellProps {
  /** Which district this shell represents. */
  districtId: DistrictId
  /** Current morph phase. */
  phase: MorphPhase
  /** Current morph direction. */
  direction: MorphDirection
  /** Callback to close/deselect the district. */
  onClose: () => void
  /** Whether station content should be visible. */
  showStations: boolean
  /** Station content from WS-2.2-2.5 via render prop. */
  children?: ReactNode
}

/**
 * DistrictShell is the expanded container that replaces the capsule
 * during the morph transition.
 *
 * Styling: Active glass material (per VISUAL-DESIGN-SPEC.md 1.7),
 * luminous ember border, 32px border-radius.
 *
 * Layout: Flexbox column with district header + station content area.
 * The header shows the district name. The content area receives
 * station components via children prop.
 *
 * This component is rendered inside AnimatePresence and uses
 * districtShellVariants for enter/exit animations.
 */
export function DistrictShell({
  districtId,
  phase,
  direction,
  onClose,
  showStations,
  children,
}: DistrictShellProps) {
  const district = DISTRICTS.find((d) => d.id === districtId)
  const displayName = district?.displayName ?? districtId

  return (
    <motion.div
      variants={districtShellVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      data-district-shell={districtId}
      data-morph-phase={phase}
      className={cn(
        // Dimensions
        'min-h-[520px] w-[440px]',
        'rounded-[72px]',
        'p-6',
        // Active glass material
        'bg-white/[0.06]',
        'backdrop-blur-[16px] backdrop-saturate-[130%]',
        'border border-white/[0.10]',
        // Luminous ember border
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_0_1px_0_rgba(var(--ember-rgb),0.3)]',
        // Layout
        'flex flex-col gap-4',
        // Containment (layout + style, not paint to avoid clipping glow)
        'contain-[layout_style]',
      )}
    >
      {/* District Header */}
      <div className="flex items-center justify-between">
        <h2
          className={cn(
            'font-sans text-[15px] font-semibold',
            'tracking-[0.04em] uppercase',
            'text-[var(--color-text-primary)] opacity-90',
            'leading-[1.2]',
          )}
        >
          {displayName}
        </h2>

        {/* Close button: visible when settled */}
        {phase === 'settled' && (
          <button
            onClick={onClose}
            className={cn(
              'flex h-6 w-6 items-center justify-center',
              'rounded-full',
              'bg-white/[0.04] hover:bg-white/[0.08]',
              'border border-white/[0.06] hover:border-white/[0.12]',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              'transition-all duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-[var(--color-ember-bright)]',
            )}
            aria-label={`Close ${displayName} district`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M1 1L9 9M9 1L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Station Content Area */}
      <motion.div
        variants={stationContainerVariants}
        initial="hidden"
        animate={showStations ? 'visible' : 'hidden'}
        exit="exit"
        className="flex flex-1 flex-col gap-3"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
