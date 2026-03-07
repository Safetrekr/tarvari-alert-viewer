/**
 * Settings store -- user preferences persisted to localStorage.
 *
 * Canonical location for:
 * - AI Camera Director beta toggle (read by ai.store.ts in WS-3.4)
 * - View preference toggles (minimap, effects, breadcrumb)
 *
 * Uses Zustand + persist middleware with localStorage key
 * `tarva-launch-settings`.
 *
 * @module settings.store
 * @see WS-3.3 Section 4.2
 * @see OQ-3.0.2 resolution
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// ============================================================================
// Notification consent type
// ============================================================================

/** User's notification consent state for the two-step permission flow. */
export type NotificationConsent = 'undecided' | 'granted' | 'denied'

// ============================================================================
// State
// ============================================================================

interface SettingsState {
  /** Whether the AI Camera Director beta feature is enabled. */
  aiCameraDirectorEnabled: boolean

  /** Whether the minimap overlay is visible. */
  minimapVisible: boolean

  /** Whether ambient visual effects (particles, grid pulse) are enabled. */
  effectsEnabled: boolean

  /** Whether the spatial breadcrumb is visible. */
  breadcrumbVisible: boolean

  /** User's notification consent state. Persisted to localStorage. */
  notificationConsent: NotificationConsent

  /** Whether in-app toast notifications are enabled. */
  inAppNotificationsEnabled: boolean

  /** Whether browser (native) notifications are enabled. */
  browserNotificationsEnabled: boolean

  /** Whether audio cues are enabled for P1 alerts. */
  audioNotificationsEnabled: boolean

  /** Idle lock timeout in minutes. 0 = never auto-lock. */
  idleLockTimeoutMinutes: number
}

// ============================================================================
// Actions
// ============================================================================

interface SettingsActions {
  /** Toggle the AI Camera Director on/off. */
  toggleAICameraDirector: () => void
  /** Set the AI Camera Director enabled state explicitly. */
  setAICameraDirector: (enabled: boolean) => void

  /** Toggle the minimap overlay visibility. */
  toggleMinimap: () => void

  /** Toggle ambient visual effects. */
  toggleEffects: () => void

  /** Toggle the spatial breadcrumb visibility. */
  toggleBreadcrumb: () => void

  /** Set the notification consent state. */
  setNotificationConsent: (consent: NotificationConsent) => void

  /** Set whether in-app toast notifications are enabled. */
  setInAppNotifications: (enabled: boolean) => void

  /** Set whether browser notifications are enabled. */
  setBrowserNotifications: (enabled: boolean) => void

  /** Set whether audio cues are enabled. */
  setAudioNotifications: (enabled: boolean) => void

  /** Set the idle lock timeout in minutes. 0 = never. */
  setIdleLockTimeout: (minutes: number) => void
}

export type SettingsStore = SettingsState & SettingsActions

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_SETTINGS: SettingsState = {
  aiCameraDirectorEnabled: true,
  minimapVisible: true,
  effectsEnabled: true,
  breadcrumbVisible: true,
  notificationConsent: 'undecided',
  inAppNotificationsEnabled: true,
  browserNotificationsEnabled: false,
  audioNotificationsEnabled: false,
  idleLockTimeoutMinutes: 5,
}

// ============================================================================
// Store
// ============================================================================

export const useSettingsStore = create<SettingsStore>()(
  persist(
    immer((set) => ({
      ...DEFAULT_SETTINGS,

      toggleAICameraDirector: () =>
        set((state) => {
          state.aiCameraDirectorEnabled = !state.aiCameraDirectorEnabled
        }),

      setAICameraDirector: (enabled) =>
        set((state) => {
          state.aiCameraDirectorEnabled = enabled
        }),

      toggleMinimap: () =>
        set((state) => {
          state.minimapVisible = !state.minimapVisible
        }),

      toggleEffects: () =>
        set((state) => {
          state.effectsEnabled = !state.effectsEnabled
        }),

      toggleBreadcrumb: () =>
        set((state) => {
          state.breadcrumbVisible = !state.breadcrumbVisible
        }),

      setNotificationConsent: (consent) =>
        set((state) => {
          state.notificationConsent = consent
        }),

      setInAppNotifications: (enabled) =>
        set((state) => {
          state.inAppNotificationsEnabled = enabled
        }),

      setBrowserNotifications: (enabled) =>
        set((state) => {
          state.browserNotificationsEnabled = enabled
        }),

      setAudioNotifications: (enabled) =>
        set((state) => {
          state.audioNotificationsEnabled = enabled
        }),

      setIdleLockTimeout: (minutes) =>
        set((state) => {
          state.idleLockTimeoutMinutes = minutes
        }),
    })),
    {
      name: 'tarva-launch-settings',
      partialize: (state) => ({
        aiCameraDirectorEnabled: state.aiCameraDirectorEnabled,
        minimapVisible: state.minimapVisible,
        effectsEnabled: state.effectsEnabled,
        breadcrumbVisible: state.breadcrumbVisible,
        notificationConsent: state.notificationConsent,
        inAppNotificationsEnabled: state.inAppNotificationsEnabled,
        browserNotificationsEnabled: state.browserNotificationsEnabled,
        audioNotificationsEnabled: state.audioNotificationsEnabled,
        idleLockTimeoutMinutes: state.idleLockTimeoutMinutes,
      }),
    },
  ),
)

// ============================================================================
// Selectors
// ============================================================================

export const settingsSelectors = {
  /** Whether the AI Camera Director is available (beta toggle is on). */
  isAIAvailable: (state: SettingsStore): boolean =>
    state.aiCameraDirectorEnabled,

  /** Whether the minimap is visible. */
  isMinimapVisible: (state: SettingsStore): boolean =>
    state.minimapVisible,

  /** Whether ambient effects are enabled. */
  areEffectsEnabled: (state: SettingsStore): boolean =>
    state.effectsEnabled,

  /** Whether the breadcrumb is visible. */
  isBreadcrumbVisible: (state: SettingsStore): boolean =>
    state.breadcrumbVisible,

  /** Current notification consent state. */
  notificationConsent: (state: SettingsStore): NotificationConsent =>
    state.notificationConsent,

  /** Whether notifications are actively granted. */
  isNotificationsGranted: (state: SettingsStore): boolean =>
    state.notificationConsent === 'granted',

  /** Whether in-app toast notifications are enabled. */
  isInAppNotificationsEnabled: (state: SettingsStore): boolean =>
    state.inAppNotificationsEnabled,

  /** Whether browser notifications are enabled. */
  isBrowserNotificationsEnabled: (state: SettingsStore): boolean =>
    state.browserNotificationsEnabled,

  /** Whether audio cues are enabled. */
  isAudioNotificationsEnabled: (state: SettingsStore): boolean =>
    state.audioNotificationsEnabled,

  /** Current idle lock timeout in minutes. 0 = never. */
  idleLockTimeoutMinutes: (state: SettingsStore): number =>
    state.idleLockTimeoutMinutes,
} as const
