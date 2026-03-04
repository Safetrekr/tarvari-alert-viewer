/**
 * AlertIndicator -- Red count badge for active alerts.
 *
 * Returns null when count is 0 (no badge rendered).
 *
 * @module alert-indicator
 * @see WS-1.5
 */

'use client'

import { Badge } from '@tarva/ui'

import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AlertIndicatorProps {
  /** Number of active alerts. Hidden when 0. */
  count: number
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AlertIndicator({ count, className }: AlertIndicatorProps) {
  if (count === 0) return null

  return (
    <Badge variant="destructive" className={cn('animate-pulse', className)}>
      {count}
    </Badge>
  )
}
