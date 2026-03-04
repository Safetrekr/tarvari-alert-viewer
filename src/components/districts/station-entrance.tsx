/**
 * StationEntrance -- staggered entrance/exit animation wrapper for station cards.
 *
 * Wraps a single station card with motion.div that:
 * - Slides up from 20px below with opacity 0 -> 1 on entrance
 * - Slides down 10px with opacity 1 -> 0 on exit
 * - Uses ease-out for entrance, ease-in for exit
 *
 * The stagger timing is controlled by the parent's
 * stationContainerVariants (staggerChildren: 0.08s).
 *
 * Each station card rendered by WS-2.2-2.5 should be wrapped
 * in a StationEntrance:
 *
 * ```tsx
 * <StationEntrance stationId="status">
 *   <StatusStation districtId={districtId} />
 * </StationEntrance>
 * ```
 *
 * @module station-entrance
 * @see WS-2.1 Section 4.8
 */

'use client'

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Variants } from 'motion/react'

/** @deprecated This file is dead code. Variants inlined to avoid broken imports. */
const stationCardVariants: Variants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 16, mass: 0.8 } },
  exit: { y: 8, opacity: 0, transition: { type: 'tween', duration: 0.25, ease: [0.4, 0, 1, 1] } },
}

export interface StationEntranceProps {
  /** Unique key for AnimatePresence tracking. */
  stationId: string
  /** Station content (from WS-2.2-2.5). */
  children: ReactNode
  /** Additional CSS classes for the wrapper. */
  className?: string
}

/**
 * StationEntrance wraps a single station card with staggered
 * entrance/exit animation.
 */
export function StationEntrance({ stationId, children, className }: StationEntranceProps) {
  return (
    <motion.div
      key={stationId}
      variants={stationCardVariants}
      data-station={stationId}
      className={className}
    >
      {children}
    </motion.div>
  )
}
