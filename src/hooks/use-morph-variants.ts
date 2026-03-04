/**
 * Morph variant definitions -- simplified capsule state variants
 * for the panel-offset morph interaction.
 *
 * Capsules have 3 visual states:
 * - idle: full opacity, normal scale
 * - selected: dimmed (the clicked capsule)
 * - dimmed: slightly dimmed (sibling capsules)
 *
 * Exports:
 * - `capsuleStateVariants` for motion components
 * - `resolveMorphVariant()` pure function for render-loop usage
 *
 * @module use-morph-variants
 * @see WS-2.1 Section 4.5
 */

'use client'

import type { Variants } from 'motion/react'
import type { MorphPhase } from '@/lib/morph-types'

// ============================================================
// CAPSULE STATE VARIANTS
// ============================================================

/**
 * Variants for capsule visual states during morph.
 *
 * - idle: normal appearance
 * - selected: the clicked capsule, dimmed significantly
 * - dimmed: sibling capsules, slightly dimmed
 */
export const capsuleStateVariants: Variants = {
  idle: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 },
  },
  hover: {
    scale: 1.06,
    transition: { type: 'spring', stiffness: 200, damping: 15, mass: 0.6 },
  },
  selected: {
    opacity: 0.25,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
  },
  dimmed: {
    opacity: 0.5,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
  },
}

// ============================================================
// VARIANT RESOLUTION
// ============================================================

/**
 * Pure function to resolve the current Framer Motion animate target
 * for a capsule based on the morph state machine.
 *
 * @param isSelected - Whether this capsule is the morph target.
 * @param phase - Current morph phase.
 * @returns The variant name to pass to motion.div's animate prop.
 */
export function resolveMorphVariant(
  isSelected: boolean,
  phase: MorphPhase,
): string {
  if (phase === 'idle') return 'idle'
  if (isSelected) return 'selected'
  return 'dimmed'
}
