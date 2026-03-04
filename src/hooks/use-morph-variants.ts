/**
 * Morph variant definitions -- card state variants
 * for the grid selection morph interaction.
 *
 * Cards have 3 visual states:
 * - idle: full opacity, scale 1.0
 * - selected: scale 1.2x (the clicked card scales up)
 * - dimmed: opacity 0.3 (sibling cards fade out)
 *
 * Exports:
 * - `cardStateVariants` for motion components
 * - `resolveMorphVariant()` pure function for render-loop usage
 *
 * @module use-morph-variants
 * @see WS-2.2 Section 4.7
 */

'use client'

import type { Variants } from 'motion/react'
import type { MorphPhase } from '@/lib/morph-types'

// ============================================================
// CARD STATE VARIANTS
// ============================================================

/**
 * Variants for card visual states during morph.
 *
 * - idle: normal appearance
 * - selected: the clicked card, scaled up to draw attention
 * - dimmed: sibling cards, faded out
 */
export const cardStateVariants: Variants = {
  idle: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 },
  },
  hover: {
    scale: 1.04,
    transition: { type: 'spring', stiffness: 200, damping: 15, mass: 0.6 },
  },
  selected: {
    opacity: 1,
    scale: 1.2,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
  dimmed: {
    opacity: 0.3,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
}

// ============================================================
// VARIANT RESOLUTION
// ============================================================

/**
 * Pure function to resolve the current motion animate target
 * for a card based on the morph state machine.
 *
 * @param isSelected - Whether this card is the morph target.
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
