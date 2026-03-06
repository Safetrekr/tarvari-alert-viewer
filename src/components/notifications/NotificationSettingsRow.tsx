'use client'

/**
 * NotificationSettingsRow -- browser notification toggle with
 * three visual states: undecided/granted (functional), denied (disabled).
 *
 * Renders a toggle switch with contextual status text and a
 * "How to enable" help expansion for the permanently denied state.
 *
 * @module NotificationSettingsRow
 * @see WS-2.5 Section 4.5
 */

import { useState } from 'react'
import { useSettingsStore } from '@/stores/settings.store'
import { showConsentPrompt } from '@/components/notifications/NotificationConsentPrompt'

// ============================================================================
// Component
// ============================================================================

export function NotificationSettingsRow() {
  const browserEnabled = useSettingsStore((s) => s.browserNotificationsEnabled)
  const consent = useSettingsStore((s) => s.notificationConsent)
  const setBrowserNotifications = useSettingsStore((s) => s.setBrowserNotifications)

  const [helpExpanded, setHelpExpanded] = useState(false)

  // Detect live browser permission state
  const isBrowserDenied =
    typeof Notification !== 'undefined' && Notification.permission === 'denied'
  const isDisabled = isBrowserDenied || consent === 'denied'

  const handleToggle = () => {
    if (isDisabled) return

    if (!browserEnabled) {
      // Turning ON
      if (consent === 'undecided') {
        // Trigger two-step consent flow
        showConsentPrompt()
      } else {
        // Already granted -- just toggle
        setBrowserNotifications(true)
      }
    } else {
      // Turning OFF
      setBrowserNotifications(false)
    }
  }

  const statusText = isDisabled
    ? 'Blocked by browser.'
    : browserEnabled && consent === 'granted'
      ? 'Active \u2014 you\u2019ll receive alerts when this tab is in the background'
      : 'Get alerts even when this tab is in the background'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={browserEnabled && !isDisabled}
          aria-disabled={isDisabled}
          aria-describedby="browser-notif-status"
          onClick={handleToggle}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            padding: 2,
            border: 'none',
            background: browserEnabled && !isDisabled
              ? 'rgba(255, 255, 255, 0.25)'
              : 'rgba(255, 255, 255, 0.08)',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.3 : 1,
            transition: 'background 150ms ease',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.70)',
              transition: 'transform 150ms ease',
              transform: browserEnabled && !isDisabled ? 'translateX(14px)' : 'translateX(0)',
            }}
          />
        </button>

        {/* Label */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.55)',
          }}
        >
          Browser notifications
        </span>
      </div>

      {/* Status text */}
      <div
        id="browser-notif-status"
        style={{
          fontSize: 9,
          color: 'rgba(255, 255, 255, 0.35)',
          letterSpacing: '0.04em',
          paddingLeft: 42,
        }}
      >
        {statusText}
        {isDisabled && (
          <button
            type="button"
            onClick={() => setHelpExpanded(!helpExpanded)}
            style={{
              fontSize: 9,
              color: 'rgba(255, 255, 255, 0.30)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'inherit',
              marginLeft: 6,
              padding: 0,
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.50)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.30)'
            }}
          >
            {helpExpanded ? 'Hide' : 'How to enable \u2192'}
          </button>
        )}
      </div>

      {/* Help text (expanded) */}
      {isDisabled && helpExpanded && (
        <div
          style={{
            fontSize: 9,
            color: 'rgba(255, 255, 255, 0.25)',
            lineHeight: 1.6,
            paddingLeft: 42,
            marginTop: 4,
          }}
        >
          Your browser has blocked notifications for this site. To re-enable:
          <br />1. Click the lock/info icon in the address bar
          <br />2. Find &ldquo;Notifications&rdquo; in the permissions list
          <br />3. Change it from &ldquo;Block&rdquo; to &ldquo;Allow&rdquo;
          <br />4. Refresh the page
        </div>
      )}
    </div>
  )
}
