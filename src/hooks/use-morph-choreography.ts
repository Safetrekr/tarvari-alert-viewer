/**
 * useMorphChoreography -- central orchestration hook for the morph system.
 *
 * Drives the 3-phase state machine:
 *
 * FORWARD:
 *   idle
 *     -> startMorph(districtId)
 *   expanding (400ms)
 *     - Selected capsule dims to opacity 0.25
 *     - Sibling capsules dim to opacity 0.5
 *     - Detail panel slides in from offset side
 *     - SVG connector line draws in
 *     -> after expanding duration
 *   settled
 *     - URL updated with ?district={id}
 *     - Panel interactions enabled
 *
 * REVERSE:
 *   settled
 *     -> reverseMorph()
 *   expanding (300ms -- 75% of entrance)
 *     - Panel slides out, connector retracts
 *     - Capsules restore to full opacity
 *     -> after exit duration
 *   idle
 *     - resetMorph() clears selection and state
 *     - URL district param removed
 *
 * No camera movement -- the ring stays in place.
 *
 * @module use-morph-choreography
 * @see WS-2.1 Section 4.4
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useUIStore, uiSelectors } from '@/stores/ui.store'
import type { DistrictId } from '@/lib/interfaces/district'
import type { MorphPhase, MorphDirection } from '@/lib/morph-types'
import { MORPH_TIMING, MORPH_TIMING_REDUCED } from '@/lib/morph-types'

interface UseMorphChoreographyOptions {
  /** Whether the user prefers reduced motion. */
  prefersReducedMotion: boolean
}

interface UseMorphChoreographyReturn {
  /** Current morph phase. */
  phase: MorphPhase
  /** Current morph direction (forward or reverse). */
  direction: MorphDirection
  /** The district being expanded/collapsed. */
  targetId: DistrictId | null
  /** Whether the morph is actively animating. */
  isMorphing: boolean
  /** Start a forward morph to the specified district. */
  startMorph: (districtId: DistrictId) => void
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
  const timing = prefersReducedMotion ? MORPH_TIMING_REDUCED : MORPH_TIMING

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
      syncUrlDistrict(targetId)
      clearPhaseTimer()
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('entering-district')
      }, timing.settledHold)
    }

    if (phase === 'entering-district') {
      clearPhaseTimer()
      phaseTimerRef.current = setTimeout(() => {
        setMorphPhase('district')
      }, timing.enteringDistrict)
    }
  }, [phase, direction, targetId, timing, setMorphPhase, clearPhaseTimer])

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
        syncUrlDistrict(null)
      }, timing.leavingDistrict)
    }

    if (phase === 'expanding') {
      clearPhaseTimer()
      // Panel slides out, capsules restore -- shorter exit
      phaseTimerRef.current = setTimeout(() => {
        resetMorph()
        syncUrlDistrict(null)
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
    (districtId: DistrictId) => {
      if (phase !== 'idle') return
      startMorphAction(districtId)
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
 * Update the URL search params with the current district selection.
 * Uses history.replaceState to avoid Next.js router re-renders.
 */
function syncUrlDistrict(districtId: DistrictId | null): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (districtId) {
    url.searchParams.set('district', districtId)
  } else {
    url.searchParams.delete('district')
  }
  window.history.replaceState({}, '', url.toString())
}
