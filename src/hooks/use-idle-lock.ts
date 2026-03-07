'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { settingsSelectors } from '@/stores/settings.store'

export interface IdleLockState {
  isLocked: boolean
  lockNow: () => void
  unlock: (passphrase: string) => boolean
  secondsUntilLock: number | null
  isEnabled: boolean
}

export function useIdleLock(): IdleLockState {
  const timeoutMinutes = useSettingsStore(settingsSelectors.idleLockTimeoutMinutes)
  const isEnabled = timeoutMinutes > 0
  const timeoutMs = timeoutMinutes * 60_000

  const [isLocked, setIsLocked] = useState(false)
  const [secondsUntilLock, setSecondsUntilLock] = useState<number | null>(null)
  const lastActivityRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setSecondsUntilLock(null)
  }, [])

  const lock = useCallback(() => {
    setIsLocked(true)
    clearTimers()
  }, [clearTimers])

  const startTimer = useCallback(() => {
    clearTimers()
    if (!isEnabled) return

    lastActivityRef.current = Date.now()

    timerRef.current = setTimeout(lock, timeoutMs)

    // Countdown only fires in the last 60 seconds
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = Math.max(0, timeoutMs - elapsed)
      if (remaining <= 60_000) {
        setSecondsUntilLock(Math.ceil(remaining / 1000))
      } else {
        setSecondsUntilLock(null)
      }
    }, 1000)
  }, [isEnabled, timeoutMs, lock, clearTimers])

  const unlock = useCallback((passphrase: string): boolean => {
    const success = useAuthStore.getState().login(passphrase)
    if (success) {
      setIsLocked(false)
      startTimer()
    }
    return success
  }, [startTimer])

  // Activity detection with throttling
  useEffect(() => {
    if (!isEnabled || isLocked) return

    let lastCall = 0
    const handleActivity = () => {
      const now = Date.now()
      if (now - lastCall < 1000) return
      lastCall = now
      lastActivityRef.current = now

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(lock, timeoutMs)
      setSecondsUntilLock(null)
    }

    document.addEventListener('pointermove', handleActivity)
    document.addEventListener('pointerdown', handleActivity)
    document.addEventListener('keydown', handleActivity)

    // Start initial timer
    startTimer()

    return () => {
      document.removeEventListener('pointermove', handleActivity)
      document.removeEventListener('pointerdown', handleActivity)
      document.removeEventListener('keydown', handleActivity)
      clearTimers()
    }
  }, [isEnabled, isLocked, timeoutMs, lock, startTimer, clearTimers])

  // Visibility change: lock if idle while tab was hidden
  useEffect(() => {
    if (!isEnabled || isLocked) return

    let hiddenAt = 0
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
      } else if (hiddenAt > 0) {
        const elapsed = Date.now() - lastActivityRef.current
        if (elapsed >= timeoutMs) {
          lock()
        }
        hiddenAt = 0
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isEnabled, isLocked, timeoutMs, lock])

  if (!isEnabled) {
    return {
      isLocked: false,
      lockNow: lock,
      unlock,
      secondsUntilLock: null,
      isEnabled: false,
    }
  }

  return { isLocked, lockNow: lock, unlock, secondsUntilLock, isEnabled }
}
