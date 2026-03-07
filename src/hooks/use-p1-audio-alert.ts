'use client'

import { useEffect, useRef } from 'react'
import { usePriorityFeed } from '@/hooks/use-priority-feed'
import { useSettingsStore } from '@/stores/settings.store'
import { settingsSelectors } from '@/stores/settings.store'

/**
 * Plays an alert tone and vibrates when a new P1 alert arrives.
 * Uses Web Audio API for reliable mobile playback.
 * Respects audioNotificationsEnabled from settings store.
 */
export function useP1AudioAlert(): void {
  const audioEnabled = useSettingsStore(settingsSelectors.isAudioNotificationsEnabled)
  const { data } = usePriorityFeed()

  const prevP1IdRef = useRef<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const hasInteractedRef = useRef(false)

  // Track user interaction for autoplay policy
  useEffect(() => {
    const markInteracted = () => {
      hasInteractedRef.current = true
    }
    document.addEventListener('pointerdown', markInteracted, { once: true })
    document.addEventListener('keydown', markInteracted, { once: true })
    return () => {
      document.removeEventListener('pointerdown', markInteracted)
      document.removeEventListener('keydown', markInteracted)
    }
  }, [])

  useEffect(() => {
    if (!audioEnabled || !data?.mostRecentP1) return

    const currentP1Id = data.mostRecentP1.id

    // Skip initial load (don't alert on existing P1s)
    if (prevP1IdRef.current === null) {
      prevP1IdRef.current = currentP1Id
      return
    }

    if (currentP1Id === prevP1IdRef.current) return
    prevP1IdRef.current = currentP1Id

    // Only play if user has interacted (autoplay policy)
    if (!hasInteractedRef.current) return

    // Play alert tone via Web Audio API
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      // Generate a two-tone alert (440Hz then 880Hz)
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.frequency.value = 440
      gain1.gain.setValueAtTime(0.15, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
      osc1.connect(gain1).connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.3)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.frequency.value = 880
      gain2.gain.setValueAtTime(0.15, now + 0.35)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65)
      osc2.connect(gain2).connect(ctx.destination)
      osc2.start(now + 0.35)
      osc2.stop(now + 0.65)
    } catch {
      // Web Audio not available, silently fail
    }

    // Haptic feedback
    try {
      navigator.vibrate?.([200, 100, 200])
    } catch {
      // Vibration API not available
    }
  }, [audioEnabled, data?.mostRecentP1])
}
