/**
 * Browser Notification API dispatch for priority alerts.
 *
 * Sends a Web Notification when the tab is backgrounded. Uses the
 * `tag` property for deduplication and `requireInteraction` for P1
 * persistence. Clicking the notification focuses the app tab and
 * navigates to the alert's district view.
 *
 * @module send-browser-notification
 * @see WS-2.5 Section 4.7
 */

import { getCategoryMeta } from '@/lib/interfaces/coverage'
import { useCoverageStore } from '@/stores/coverage.store'
import { useUIStore } from '@/stores/ui.store'
import type { PriorityAlertPayload } from './notify-priority-alert'

/**
 * Send a browser notification for a priority alert.
 *
 * No-ops if:
 * - The Notification API is unavailable
 * - Permission is not 'granted'
 * - The document is visible (tab is focused)
 */
export function sendBrowserNotification(alert: PriorityAlertPayload): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (!document.hidden) return

  const categoryMeta = getCategoryMeta(alert.category)

  const notification = new Notification(
    `${alert.priority} ${categoryMeta.shortName}: ${alert.title}`,
    {
      body: `${alert.severity} severity \u2014 ${categoryMeta.displayName}`,
      tag: alert.id,
      requireInteraction: alert.priority === 'P1',
      silent: false,
    },
  )

  notification.onclick = () => {
    window.focus()
    useCoverageStore.getState().setDistrictPreselectedAlertId(alert.id)
    useUIStore.getState().startMorph(alert.category)
    notification.close()
  }
}
