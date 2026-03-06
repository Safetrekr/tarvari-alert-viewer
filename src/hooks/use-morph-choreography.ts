/**
 * useMorphChoreography -- central orchestration hook for the morph system.
 *
 * Drives the 3-phase state machine:
 *
 * FORWARD:
 *   idle
 *     -> startMorph(categoryId)
 *   expanding (400ms)
 *     - Selected card scales to 1.2x
 *     - Sibling cards fade to opacity 0.3
 *     - Detail panel slides in from the right
 *     -> after expanding duration
 *   settled
 *     - URL updated with ?category={id}
 *     - Panel interactions enabled
 *
 * REVERSE:
 *   settled
 *     -> reverseMorph()
 *   expanding (300ms -- 75% of entrance)
 *     - Panel slides out, cards restore
 *     - Cards restore to full opacity and scale
 *     -> after exit duration
 *   idle
 *     - resetMorph() clears selection and state
 *     - URL category param removed
 *
 * No camera movement -- the grid stays in place.
 *
 * @module use-morph-choreography
 * @see WS-2.2 Section 4.2
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useUIStore, uiSelectors } from '@/stores/ui.store'
import type { NodeId } from '@/lib/interfaces/district'
import type { MorphPhase, MorphDirection, StartMorphOptions } from '@/lib/morph-types'
import { MORPH_TIMING, MORPH_TIMING_REDUCED, MORPH_TIMING_FAST } from '@/lib/morph-types'

interface UseMorphChoreographyOptions {
  /** Whether the user prefers reduced motion. */
  prefersReducedMotion: boolean
}

interface UseMorphChoreographyReturn {
  /** Current morph phase. */
  phase: MorphPhase
  /** Current morph direction (forward or reverse). */
  direction: MorphDirection
  /** The node being expanded/collapsed. */
  targetId: NodeId | null
  /** Whether the morph is actively animating. */
  isMorphing: boolean
  /** Start a forward morph to the specified node. */
  startMorph: (nodeId: NodeId, options?: StartMorphOptions) => void
  /** Start a reverse morph back to the atrium. */
  reverseMorph: () => void
}

/**
 * Central orchestration hook for the morph choreography.
 */
export function useMorphChoreography(
  options: UseMorphChoreographyOptions,
): UseMorphChoreographyReturn {
  const { prefersReducedMotion } = options
  const fast = useUIStore((s) => s.morph.fast)

  // Timing precedence: reduced-motion > fast > normal (WCAG 2.3.3)
  const timing = prefersReducedMotion
    ? MORPH_TIMING_REDUCED
    : fast
      ? MORPH_TIMING_FAST
      : MORPH_TIMING

  // Store actions
  const startMorphAction = useUIStore((s) => s.startMorph)
  const reverseMorphAction = useUIStore((s) => s.reverseMorph)
  const setMorphPhase = useUIStore((s) => s.setMorphPhase)
  const resetMorph = useUIStore((s) => s.resetMorph)

  // Store state (subscribed via selectors)
  const phase = useUIStore(uiSelectors.morphPhase)
  const direction = useUIStore((s) => s.morph.direction)
  const targetId = useUIStore(uiSelectors.morphTargetId)
  const isMorphing = useUIStore(uiSelectors.isMorphing)

  // Timer refs for cleanup
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Helper: clear any active phase timer
  const clearPhaseTimer = useCallback(() => {
    if (phaseTimerRef.current) {
      clearTimeout(phaseTimerRef.current)
      phaseTimerRef.current = null
    }
  }, [])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearPhaseTimer()
    }
  }, [clearPhaseTimer])

  // ----------------------------------------------------------------
  // FORWARD FLOW: expanding -> settled -> entering-district -> district
  // ----------------------------------------------------------------
  useEffect(() => {
    if (direction !== 'forward') return

    if (phase === 'expanding') {
      clearPhaseTimer()
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('settled')
      }, timing.expanding)
    }

    if (phase === 'settled') {
      // Sync URL, then auto-advance to district view after brief hold
      syncUrlCategory(targetId)
      clearPhaseTimer()
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('entering-district')
      }, timing.settledHold)
    }

    if (phase === 'entering-district') {
      // URL sync: in fast morph, settled phase is skipped, so sync here
      if (fast) {
        syncUrlCategory(targetId)
      }
      clearPhaseTimer()
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('district')
      }, timing.enteringDistrict)
    }
  }, [phase, direction, targetId, timing, fast, setMorphPhase, clearPhaseTimer])

  // ----------------------------------------------------------------
  // REVERSE FLOW: leaving-district -> idle, or expanding (reverse) -> idle
  // ----------------------------------------------------------------
  useEffect(() => {
    if (direction !== 'reverse') return

    if (phase === 'leaving-district') {
      clearPhaseTimer()
      // District overlay fades out, then reset to idle
      phaseTimerRef.current = setTimeout(() => {
        resetMorph()
        syncUrlCategory(null)
      }, timing.leavingDistrict)
    }

    if (phase === 'expanding') {
      clearPhaseTimer()
      // Panel slides out, cards restore -- shorter exit
      phaseTimerRef.current = setTimeout(() => {
        resetMorph()
        syncUrlCategory(null)
      }, timing.expanding * 0.75)
    }
  }, [phase, direction, timing, resetMorph, clearPhaseTimer])

  // ----------------------------------------------------------------
  // Keyboard: Escape to reverse morph
  // ----------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && (phase === 'settled' || phase === 'district' || phase === 'entering-district')) {
        e.preventDefault()
        reverseMorphAction()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, reverseMorphAction])

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------
  const startMorph = useCallback(
    (nodeId: NodeId, options?: StartMorphOptions) => {
      if (phase !== 'idle') return
      startMorphAction(nodeId, options)
    },
    [phase, startMorphAction],
  )

  const reverseMorph = useCallback(() => {
    if (phase !== 'settled' && phase !== 'district' && phase !== 'entering-district') return
    reverseMorphAction()
  }, [phase, reverseMorphAction])

  return {
    phase,
    direction,
    targetId,
    isMorphing,
    startMorph,
    reverseMorph,
  }
}

// ============================================================
// URL SYNC HELPER
// ============================================================

/**
 * Update the URL search params with the current category selection.
 * Uses history.replaceState to avoid Next.js router re-renders.
 */
function syncUrlCategory(categoryId: string | null): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (categoryId) {
    url.searchParams.set('category', categoryId)
  } else {
    url.searchParams.delete('category')
  }
  window.history.replaceState({}, '', url.toString())
}
