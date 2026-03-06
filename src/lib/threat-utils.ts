/**
 * Shared threat posture derivation and display metadata.
 *
 * Extracted from ThreatPictureCard for reuse by both
 * desktop (ThreatPictureCard) and mobile (MobileThreatBanner,
 * MobileThreatIndicator, ThreatPulseBackground).
 *
 * @module threat-utils
 * @see WS-B.1
 */

import type { SeverityDistribution } from '@/hooks/use-threat-picture'
import type { ThreatLevel } from '@/lib/interfaces/coverage'

/** Display metadata for a single posture level. */
export interface PostureConfig {
  color: string
  bg: string
  border: string
  label: string
}

/** Posture-to-display-metadata lookup. */
export const POSTURE_CONFIG: Record<ThreatLevel, PostureConfig> = {
  CRITICAL: {
    color: 'rgba(220, 38, 38, 0.9)',
    bg: 'rgba(220, 38, 38, 0.10)',
    border: 'rgba(220, 38, 38, 0.25)',
    label: 'Critical',
  },
  HIGH: {
    color: 'rgba(239, 68, 68, 0.8)',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.20)',
    label: 'High',
  },
  ELEVATED: {
    color: 'rgba(249, 115, 22, 0.8)',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.20)',
    label: 'Elevated',
  },
  MODERATE: {
    color: 'rgba(234, 179, 8, 0.8)',
    bg: 'rgba(234, 179, 8, 0.06)',
    border: 'rgba(234, 179, 8, 0.15)',
    label: 'Guarded',
  },
  LOW: {
    color: 'rgba(34, 197, 94, 0.7)',
    bg: 'rgba(34, 197, 94, 0.06)',
    border: 'rgba(34, 197, 94, 0.15)',
    label: 'Low',
  },
}

/**
 * Derive the threat posture level from severity distribution data.
 *
 * Rules (matching ThreatPictureCard):
 * - extreme >= 10 -> CRITICAL
 * - extreme > 0 || severe >= 50 -> HIGH
 * - severe > 0 -> ELEVATED
 * - totalActiveAlerts > 0 -> MODERATE
 * - otherwise -> LOW
 */
export function derivePosture(
  bySeverity: SeverityDistribution[],
  totalActiveAlerts: number,
): ThreatLevel {
  const extreme = bySeverity.find((s) => s.severity === 'Extreme')?.count ?? 0
  const severe = bySeverity.find((s) => s.severity === 'Severe')?.count ?? 0
  if (extreme >= 10) return 'CRITICAL'
  if (extreme > 0 || severe >= 50) return 'HIGH'
  if (severe > 0) return 'ELEVATED'
  if (totalActiveAlerts > 0) return 'MODERATE'
  return 'LOW'
}
