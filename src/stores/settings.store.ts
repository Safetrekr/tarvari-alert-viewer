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
    })),
    {
      name: 'tarva-launch-settings',
      partialize: (state) => ({
        aiCameraDirectorEnabled: state.aiCameraDirectorEnabled,
        minimapVisible: state.minimapVisible,
        effectsEnabled: state.effectsEnabled,
        breadcrumbVisible: state.breadcrumbVisible,
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
} as const
