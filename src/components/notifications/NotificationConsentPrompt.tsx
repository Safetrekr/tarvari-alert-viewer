'use client'

/**
 * NotificationConsentPrompt -- two-step browser notification consent flow.
 *
 * Rendered as a persistent sonner toast via `toast.custom()`. Explains
 * the value proposition before triggering the native browser permission
 * dialog, per AD-6 (never cold-prompt).
 *
 * @module NotificationConsentPrompt
 * @see WS-2.5 Section 4.3
 * @see AD-6 -- Two-step browser notification consent
 */

import { createElement } from 'react'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings.store'

// ============================================================================
// Consent toast ID (for deduplication + dismissal)
// ============================================================================

const CONSENT_TOAST_ID = 'notification-consent-prompt'

// ============================================================================
// Prompt body component
// ============================================================================

function ConsentPromptBody({ toastId }: { toastId: string | number }) {
  const handleEnable = async () => {
    toast.dismiss(toastId)

    if (typeof Notification === 'undefined') return

    const result = await Notification.requestPermission()

    const store = useSettingsStore.getState()

    switch (result) {
      case 'granted':
        store.setNotificationConsent('granted')
        store.setBrowserNotifications(true)
        toast('Notifications enabled', { duration: 3000 })
        break
      case 'denied':
        store.setNotificationConsent('denied')
        store.setBrowserNotifications(false)
        toast('Notifications blocked. You can enable them in your browser settings.', {
          duration: 8000,
        })
        break
      default:
        // 'default' -- user dismissed without choosing
        store.setBrowserNotifications(false)
        break
    }
  }

  const handleNotNow = () => {
    toast.dismiss(toastId)
    useSettingsStore.getState().setBrowserNotifications(false)
  }

  return (
    <div
      style={{
        width: 400,
        padding: '16px',
        background: 'rgba(10, 10, 15, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Bell size={20} style={{ color: 'rgba(255, 255, 255, 0.50)', flexShrink: 0 }} />
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'var(--font-geist-sans, sans-serif)',
            color: 'rgba(255, 255, 255, 0.70)',
          }}
        >
          Get Notified of Critical Threats
        </span>
      </div>

      {/* Body */}
      <p
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-geist-sans, sans-serif)',
          color: 'rgba(255, 255, 255, 0.45)',
          lineHeight: 1.5,
          margin: '0 0 14px',
        }}
      >
        When a P1 critical threat is detected, we&apos;ll send a browser notification
        so you see it even when this tab is in the background.
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={handleEnable}
          style={{
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255, 255, 255, 0.70)',
            background: 'rgba(255, 255, 255, 0.10)',
            border: 'none',
            borderRadius: 4,
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.10)'
          }}
        >
          Enable Notifications
        </button>

        <button
          type="button"
          onClick={handleNotNow}
          style={{
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255, 255, 255, 0.30)',
            background: 'transparent',
            border: 'none',
            padding: '6px 8px',
            cursor: 'pointer',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.50)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.30)'
          }}
        >
          Not Now
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Show the two-step notification consent prompt as a persistent toast.
 * Deduplicates via a fixed toast ID.
 */
export function showConsentPrompt(): void {
  toast.custom(
    (toastId) => createElement(ConsentPromptBody, { toastId: toastId as string | number }),
    {
      id: CONSENT_TOAST_ID,
      duration: Infinity,
    },
  )
}
