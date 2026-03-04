/**
 * HealthBadge -- Maps AppStatus to a @tarva/ui StatusBadge with semantic
 * category, animation, and label.
 *
 * @module health-badge
 * @see WS-1.5
 */

'use client'

import {
  StatusBadge,
  type StatusCategory,
  type StatusAnimation,
} from '@tarva/ui'

import { cn } from '@/lib/utils'
import type { AppStatus } from '@/lib/telemetry-types'

// ---------------------------------------------------------------------------
// Status -> StatusBadge mapping
// ---------------------------------------------------------------------------

interface StatusMapping {
  category: StatusCategory
  animation: StatusAnimation
  label: string
}

const STATUS_MAP: Record<AppStatus, StatusMapping> = {
  OPERATIONAL: { category: 'success', animation: 'pulse', label: 'Operational' },
  DEGRADED: { category: 'warning', animation: 'none', label: 'Degraded' },
  DOWN: { category: 'danger', animation: 'pulse', label: 'Down' },
  OFFLINE: { category: 'muted', animation: 'none', label: 'Offline' },
  UNKNOWN: { category: 'neutral', animation: 'none', label: 'Unknown' },
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface HealthBadgeProps {
  /** Current application status. */
  status: AppStatus
  /** Size variant passed to StatusBadge. */
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HealthBadge({ status, size, className }: HealthBadgeProps) {
  const mapping = STATUS_MAP[status]

  return (
    <StatusBadge
      status={status}
      variant="dot"
      category={mapping.category}
      animation={mapping.animation}
      label={mapping.label}
      size={size}
      className={cn(className)}
    />
  )
}
