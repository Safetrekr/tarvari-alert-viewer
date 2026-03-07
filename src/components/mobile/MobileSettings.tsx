'use client'

import '@/styles/mobile-settings.css'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSettingsStore } from '@/stores/settings.store'
import { useAuthStore } from '@/stores/auth.store'
import { useApiHealth } from '@/hooks/use-api-health'
import { SessionTimecode } from '@/components/ambient/session-timecode'

const LOCK_OPTIONS = [
  { value: 1, label: '1m' },
  { value: 5, label: '5m' },
  { value: 15, label: '15m' },
  { value: 0, label: 'Off' },
] as const

const HEALTH_COLORS: Record<string, string> = {
  healthy: '#22c55e',
  degraded: '#eab308',
  offline: '#ef4444',
}

function Toggle({
  on,
  onToggle,
  ariaLabel,
}: {
  on: boolean
  onToggle: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      className="mobile-toggle"
      data-on={on}
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
    >
      <div className="mobile-toggle-knob" />
    </button>
  )
}

export function MobileSettings() {
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)
  const toggleEffects = useSettingsStore((s) => s.toggleEffects)
  const audioEnabled = useSettingsStore((s) => s.audioNotificationsEnabled)
  const setAudio = useSettingsStore((s) => s.setAudioNotifications)
  const lockTimeout = useSettingsStore((s) => s.idleLockTimeoutMinutes)
  const setLockTimeout = useSettingsStore((s) => s.setIdleLockTimeout)
  const logout = useAuthStore((s) => s.logout)
  const sessionKey = useAuthStore((s) => s.sessionKey)

  const health = useApiHealth()

  const handleLogout = useCallback(() => {
    logout()
    router.push('/login')
  }, [logout, router])

  return (
    <div className="mobile-settings">
      {/* Display section */}
      <section className="mobile-settings-section">
        <h4 className="mobile-settings-section-title">Display</h4>

        <div className="mobile-settings-row">
          <span className="mobile-settings-row-label">Ambient Effects</span>
          <Toggle
            on={effectsEnabled}
            onToggle={toggleEffects}
            ariaLabel="Toggle ambient effects"
          />
        </div>

        <div className="mobile-settings-row">
          <span className="mobile-settings-row-label">Color Scheme</span>
          <span className="mobile-settings-row-value">Dark (v1)</span>
        </div>
      </section>

      {/* Alerts section */}
      <section className="mobile-settings-section">
        <h4 className="mobile-settings-section-title">Alerts</h4>

        <div className="mobile-settings-row">
          <span className="mobile-settings-row-label">P1 Sound Alert</span>
          <Toggle
            on={audioEnabled}
            onToggle={() => setAudio(!audioEnabled)}
            ariaLabel="Toggle P1 sound alert"
          />
        </div>
      </section>

      {/* Security section */}
      <section className="mobile-settings-section">
        <h4 className="mobile-settings-section-title">Security</h4>

        <div className="mobile-settings-row">
          <span className="mobile-settings-row-label">Auto-Lock</span>
          <div className="mobile-segmented" role="radiogroup" aria-label="Auto-lock timeout">
            {LOCK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className="mobile-segmented-option"
                data-active={lockTimeout === opt.value}
                onClick={() => setLockTimeout(opt.value)}
                role="radio"
                aria-checked={lockTimeout === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mobile-settings-divider" />

      {/* Session info section */}
      <section className="mobile-settings-section">
        <h4 className="mobile-settings-section-title">Session</h4>

        <div className="mobile-settings-row">
          <span className="mobile-settings-row-label">Session Key</span>
          <span className="mobile-settings-row-value">
            {sessionKey ? sessionKey.slice(0, 8) + '...' : '--'}
          </span>
        </div>

        <div className="mobile-settings-row">
          <span className="mobile-settings-row-label">Uptime</span>
          <SessionTimecode inline />
        </div>

        <div className="mobile-settings-row">
          <span className="mobile-settings-row-label">API Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              className="mobile-settings-health-dot"
              style={{ background: HEALTH_COLORS[health.status] ?? '#6b7280' }}
            />
            <span className="mobile-settings-row-value">{health.label}</span>
          </div>
        </div>
      </section>

      <div className="mobile-settings-divider" />

      {/* Logout */}
      {!showLogoutConfirm ? (
        <button
          type="button"
          className="mobile-settings-logout"
          onClick={() => setShowLogoutConfirm(true)}
        >
          Logout
        </button>
      ) : (
        <div className="mobile-settings-confirm">
          <button
            type="button"
            className="mobile-settings-confirm-cancel"
            onClick={() => setShowLogoutConfirm(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="mobile-settings-confirm-yes"
            onClick={handleLogout}
          >
            Confirm Logout
          </button>
        </div>
      )}
    </div>
  )
}
