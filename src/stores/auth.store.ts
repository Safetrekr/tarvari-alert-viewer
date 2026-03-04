'use client'

import { create } from 'zustand'

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const SESSION_STORAGE_KEY = 'tarva-launch-session'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface AuthState {
  authenticated: boolean
  sessionKey: string
}

interface AuthActions {
  login: (passphrase: string) => boolean
  logout: () => void
  hydrate: () => void
}

type AuthStore = AuthState & AuthActions

// --------------------------------------------------------------------------
// Passphrase (hardcoded -- internal localhost tool, no env var needed)
// --------------------------------------------------------------------------

const PASSPHRASE = 'tarva'

// --------------------------------------------------------------------------
// Store
// --------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>()((set) => ({
  // State
  authenticated: false,
  sessionKey: '',

  // Actions
  login: (passphrase: string): boolean => {
    if (passphrase !== PASSPHRASE) return false

    const sessionKey = crypto.randomUUID()

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionKey)
    } catch {
      // sessionStorage unavailable (SSR, private browsing quota exceeded)
    }

    set({ authenticated: true, sessionKey })
    return true
  },

  logout: () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // sessionStorage unavailable
    }

    set({ authenticated: false, sessionKey: '' })
  },

  hydrate: () => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        set({ authenticated: true, sessionKey: stored })
      }
    } catch {
      // sessionStorage unavailable (SSR)
    }
  },
}))
