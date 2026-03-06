'use client'

/**
 * Notification dispatch orchestration hook.
 *
 * Encapsulates dual-channel dispatch logic: in-app sonner toast +
 * browser Notification API. Also manages consent state sync on mount
 * and exposes a `requestBrowserConsent` trigger for the settings UI.
 *
 * Consumed by WS-2.4 (`useRealtimePriorityAlerts` onAlert callback).
 *
 * @module use-notification-dispatch
 * @see WS-2.5 Section 4.6
 */

import { useEffect, useCallback, useRef } from 'react'
import { useSettingsStore } from '@/stores/settings.store'
import { notifyPriorityAlert, type PriorityAlertPayload } from '@/lib/notifications/notify-priority-alert'
import { sendBrowserNotification } from '@/lib/notifications/send-browser-notification'
import { playNotificationSound } from '@/lib/notifications/notification-sound'
import { showConsentPrompt } from '@/components/notifications/NotificationConsentPrompt'

// ============================================================================
// Types
// ============================================================================

export interface NotificationDispatch {
  /**
   * Dispatch a notification for a priority alert.
   * Always fires an in-app sonner toast (if in-app notifications enabled).
   * Conditionally fires a browser notification (if consent granted + tab hidden).
   */
  notify: (alert: PriorityAlertPayload) => void

  /**
   * Trigger the two-step consent flow for browser notifications.
   * Called by the settings toggle when consent is 'undecided'.
   */
  requestBrowserConsent: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function useNotificationDispatch(): NotificationDispatch {
  const hasRunSyncRef = useRef(false)

  // Sync stored consent with live browser permission on mount
  useEffect(() => {
    if (hasRunSyncRef.current) return
    hasRunSyncRef.current = true

    if (typeof Notification === 'undefined') return

    const stored = useSettingsStore.getState().notificationConsent
    const live = Notification.permission

    if (stored === 'granted' && live === 'denied') {
      useSettingsStore.getState().setNotificationConsent('denied')
      useSettingsStore.getState().setBrowserNotifications(false)
    } else if (stored === 'denied' && live === 'granted') {
      useSettingsStore.getState().setNotificationConsent('granted')
    } else if (stored === 'undecided' && live === 'granted') {
      useSettingsStore.getState().setNotificationConsent('granted')
    }
  }, [])

  const notify = useCallback((alert: PriorityAlertPayload) => {
    const state = useSettingsStore.getState()

    // Channel 1: In-app sonner toast
    if (state.inAppNotificationsEnabled) {
      notifyPriorityAlert(alert)
    }

    // Channel 2: Browser notification (only when tab is hidden)
    if (state.browserNotificationsEnabled && state.notificationConsent === 'granted') {
      sendBrowserNotification(alert)
    }

    // Channel 3: Audio cue (P1 only)
    if (state.audioNotificationsEnabled && alert.priority === 'P1') {
      playNotificationSound()
    }
  }, [])

  const requestBrowserConsent = useCallback(() => {
    showConsentPrompt()
  }, [])

  return { notify, requestBrowserConsent }
}
