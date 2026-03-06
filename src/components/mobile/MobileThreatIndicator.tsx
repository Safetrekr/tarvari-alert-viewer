'use client'

import { useMemo } from 'react'
import { useThreatPicture } from '@/hooks/use-threat-picture'
import { derivePosture, POSTURE_CONFIG } from '@/lib/threat-utils'

/**
 * 8px glow badge for the MobileHeader's threatIndicator slot.
 * Reflects current posture level via color.
 */
export function MobileThreatIndicator() {
  const { data: tp } = useThreatPicture()

  const posture = useMemo(() => {
    if (!tp) return 'LOW' as const
    return derivePosture(tp.bySeverity, tp.totalActiveAlerts)
  }, [tp])

  const ps = POSTURE_CONFIG[posture]
  const showGlow = posture !== 'LOW'

  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: ps.color,
        flexShrink: 0,
        boxShadow: showGlow ? `0 0 6px ${ps.color}` : 'none',
        transition: 'background-color 300ms ease, box-shadow 300ms ease',
      }}
      aria-label={`Threat posture: ${ps.label}`}
    />
  )
}
