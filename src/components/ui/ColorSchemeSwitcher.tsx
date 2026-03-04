/**
 * ColorSchemeSwitcher -- top-right pill toggles for color scheme and theme mode.
 *
 * Two compact controls:
 * 1. Color scheme toggle: tarva-core (orange) ↔ safetrekr (green)
 * 2. Theme mode toggle: dark ↔ light
 *
 * Matches Safetrekr marketing site layout: rounded-full pills with
 * colored indicator dots and monospace labels.
 *
 * @module color-scheme-switcher
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTarvaTheme, useTheme } from '@/components/providers/theme-provider'
import type { ColorScheme } from '@tarva/ui'

const STORAGE_KEY = 'tarva-launch-color-scheme'

const SCHEMES: { id: ColorScheme; label: string; dot: string }[] = [
  { id: 'tarva-core', label: 'TARVA', dot: '#e05200' },
  { id: 'safetrekr', label: 'TREK', dot: '#4ba467' },
]

const MODES = [
  { id: 'dark', label: 'DARK' },
  { id: 'light', label: 'LIGHT' },
] as const

const pillClass =
  'flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em] uppercase transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ring)] border-white/8 bg-deep/60 text-text-secondary backdrop-blur-[8px] hover:border-white/12 hover:bg-deep/80'

export function ColorSchemeSwitcher() {
  const { colorScheme, setColorScheme } = useTarvaTheme()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Hydrate color scheme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorScheme | null
    if (stored && SCHEMES.some((s) => s.id === stored) && stored !== colorScheme) {
      setColorScheme(stored)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  const cycleScheme = useCallback(() => {
    const currentIdx = SCHEMES.findIndex((s) => s.id === colorScheme)
    const next = SCHEMES[(currentIdx + 1) % SCHEMES.length]
    setColorScheme(next.id)
    localStorage.setItem(STORAGE_KEY, next.id)
  }, [colorScheme, setColorScheme])

  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

  const toggleMode = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  const currentScheme = SCHEMES.find((s) => s.id === colorScheme) ?? SCHEMES[0]
  const currentMode = mounted
    ? (MODES.find((m) => m.id === resolvedTheme) ?? MODES[0])
    : MODES[0]

  // Dot color adapts to current scheme
  const modeDot = currentScheme.dot

  return (
    <>
      {/* Color scheme toggle */}
      <button
        onClick={cycleScheme}
        className={pillClass}
        aria-label={`Color scheme: ${currentScheme.label}. Click to switch.`}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: currentScheme.dot,
            boxShadow: `0 0 6px ${currentScheme.dot}60`,
            transition: 'background-color 300ms ease, box-shadow 300ms ease',
          }}
        />
        {currentScheme.label}
      </button>

      {/* Theme mode toggle */}
      <button
        onClick={toggleMode}
        className={pillClass}
        aria-label={`Theme: ${currentMode.label}. Click to switch.`}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            backgroundColor: modeDot,
            boxShadow: `0 0 6px ${modeDot}60`,
            transition: 'background-color 300ms ease, box-shadow 300ms ease',
          }}
        />
        {currentMode.label}
      </button>
    </>
  )
}
