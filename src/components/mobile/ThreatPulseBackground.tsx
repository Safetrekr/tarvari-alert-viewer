'use client'

import { useMemo } from 'react'
import { useReducedMotion } from '@tarva/ui/motion'
import { useSettingsStore } from '@/stores/settings.store'
import { useThreatPicture } from '@/hooks/use-threat-picture'
import { derivePosture } from '@/lib/threat-utils'
import type { ThreatLevel } from '@/lib/interfaces/coverage'

const POSTURE_CSS: Record<ThreatLevel, { color: string; duration: string }> = {
  LOW: { color: 'transparent', duration: '0s' },
  MODERATE: { color: 'var(--posture-moderate-color, rgba(234, 179, 8, 0.02))', duration: '0s' },
  ELEVATED: { color: 'var(--posture-elevated-color, rgba(234, 179, 8, 0.04))', duration: 'var(--posture-elevated-duration, 4s)' },
  HIGH: { color: 'var(--posture-high-color, rgba(239, 68, 68, 0.03))', duration: 'var(--posture-high-duration, 6s)' },
  CRITICAL: { color: 'var(--posture-critical-color, rgba(220, 38, 38, 0.04))', duration: 'var(--posture-critical-duration, 4s)' },
}

/**
 * Full-viewport ambient CSS radial gradient that breathes at a
 * posture-dependent cadence. Sits behind all content at z-index 0.
 */
export function ThreatPulseBackground() {
  const reducedMotion = useReducedMotion()
  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)
  const { data: tp } = useThreatPicture()

  const posture: ThreatLevel = useMemo(() => {
    if (!tp) return 'LOW'
    return derivePosture(tp.bySeverity, tp.totalActiveAlerts)
  }, [tp])

  const cfg = POSTURE_CSS[posture]
  const shouldAnimate = effectsEnabled && !reducedMotion && posture !== 'LOW' && posture !== 'MODERATE'

  return (
    <div
      className={shouldAnimate ? 'mobile-threat-pulse' : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 30%, ${cfg.color}, transparent 70%)`,
        ...(shouldAnimate
          ? { ['--posture-duration' as string]: cfg.duration }
          : {}),
      }}
      aria-hidden="true"
    />
  )
}
