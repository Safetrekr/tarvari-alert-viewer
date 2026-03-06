/**
 * In-app sonner toast notifications for P1/P2 priority alerts.
 *
 * Uses `toast.custom()` to render a fully custom PriorityAlertToast
 * component. P1 toasts persist until dismissed; P2 auto-dismiss
 * after 8 seconds. Deduplicates by alert ID.
 *
 * @module notify-priority-alert
 * @see WS-2.5 Section 4.1, 4.2
 */

import { createElement } from 'react'
import { toast } from 'sonner'
import type { OperationalPriority, SeverityLevel } from '@/lib/interfaces/coverage'
import { PriorityAlertToast } from '@/components/notifications/PriorityAlertToast'

// ============================================================================
// Types
// ============================================================================

export interface PriorityAlertPayload {
  id: string
  title: string
  priority: OperationalPriority
  severity: SeverityLevel | string
  category: string
  ingestedAt: string
}

// ============================================================================
// Duration config
// ============================================================================

const DURATION: Record<'P1' | 'P2', number> = {
  P1: Infinity,
  P2: 8000,
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fire an in-app sonner toast for a priority alert.
 *
 * P1 alerts persist until the user explicitly dismisses them.
 * P2 alerts auto-dismiss after 8 seconds.
 * Deduplicates by alert ID via sonner's `id` option.
 */
export function notifyPriorityAlert(alert: PriorityAlertPayload): void {
  const priority = alert.priority as 'P1' | 'P2'
  const duration = DURATION[priority] ?? 8000

  toast.custom(
    (toastId) =>
      createElement(PriorityAlertToast, {
        alert,
        toastId: toastId as string | number,
      }),
    {
      id: alert.id,
      duration,
    },
  )
}
