/**
 * Shared threat level color constants.
 * Uses posture tokens from WS-B.1's POSTURE_CONFIG.
 */

import type { ThreatLevel } from '@/lib/interfaces/coverage'

export const THREAT_LEVEL_COLORS: Record<ThreatLevel, string> = {
  LOW: 'var(--posture-low-color, #22c55e)',
  MODERATE: 'var(--posture-moderate-color, #eab308)',
  ELEVATED: 'var(--posture-elevated-color, #f97316)',
  HIGH: 'var(--posture-high-color, #ef4444)',
  CRITICAL: 'var(--posture-critical-color, #dc2626)',
}

export const THREAT_LEVEL_BG: Record<ThreatLevel, string> = {
  LOW: 'rgba(34, 197, 94, 0.10)',
  MODERATE: 'rgba(234, 179, 8, 0.10)',
  ELEVATED: 'rgba(249, 115, 22, 0.10)',
  HIGH: 'rgba(239, 68, 68, 0.10)',
  CRITICAL: 'rgba(220, 38, 38, 0.12)',
}

export const THREAT_LEVEL_LABELS: Record<ThreatLevel, string> = {
  LOW: 'Low',
  MODERATE: 'Moderate',
  ELEVATED: 'Elevated',
  HIGH: 'High',
  CRITICAL: 'Critical',
}
