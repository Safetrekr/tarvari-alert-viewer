'use client'

import { useState, useCallback } from 'react'
import { Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import {
  type TimePreset,
  TIME_PRESETS,
  TIME_PRESET_LABELS,
} from '@/stores/coverage.store'

interface MobileTimeRangeSheetProps {
  value: TimePreset | 'custom'
  customStart: string | null
  customEnd: string | null
  onPresetChange: (preset: TimePreset) => void
  onCustomChange: (start: string | null, end: string | null) => void
  onDismiss?: () => void
}

export function MobileTimeRangeSheet({
  value,
  customStart,
  customEnd,
  onPresetChange,
  onCustomChange,
  onDismiss,
}: MobileTimeRangeSheetProps) {
  const [showCustom, setShowCustom] = useState(value === 'custom')

  const handlePreset = useCallback(
    (preset: TimePreset) => {
      setShowCustom(false)
      onPresetChange(preset)
      // Auto-dismiss after selecting a preset
      if (onDismiss) {
        setTimeout(onDismiss, 300)
      }
    },
    [onPresetChange, onDismiss],
  )

  const handleToggleCustom = useCallback(() => {
    setShowCustom((prev) => !prev)
  }, [])

  const toLocalInput = (iso: string | null): string => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 16)
  }

  const handleStartChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      onCustomChange(val ? new Date(val).toISOString() : null, customEnd)
    },
    [onCustomChange, customEnd],
  )

  const handleEndChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      onCustomChange(customStart, val ? new Date(val).toISOString() : null)
    },
    [onCustomChange, customStart],
  )

  return (
    <div
      style={{
        padding: '16px var(--space-content-padding, 12px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={14} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.4)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Time Range
        </span>
      </div>

      {/* 5×2 Preset grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 6,
        }}
      >
        {TIME_PRESETS.map((preset) => {
          const isActive = value === preset && !showCustom
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              style={{
                position: 'relative',
                height: 44,
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: isActive
                  ? 'rgba(255, 255, 255, 0.85)'
                  : 'rgba(255, 255, 255, 0.35)',
                background: isActive
                  ? 'rgba(100, 180, 220, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${
                  isActive
                    ? 'rgba(100, 180, 220, 0.30)'
                    : 'rgba(255, 255, 255, 0.06)'
                }`,
                borderRadius: 8,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
              }}
            >
              {TIME_PRESET_LABELS[preset]}
            </button>
          )
        })}
      </div>

      {/* Custom range toggle */}
      <button
        type="button"
        onClick={handleToggleCustom}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 40,
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: showCustom || value === 'custom'
            ? 'rgba(255, 255, 255, 0.85)'
            : 'rgba(255, 255, 255, 0.35)',
          background: showCustom || value === 'custom'
            ? 'rgba(100, 180, 220, 0.12)'
            : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${
            showCustom || value === 'custom'
              ? 'rgba(100, 180, 220, 0.30)'
              : 'rgba(255, 255, 255, 0.06)'
          }`,
          borderRadius: 8,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
        }}
      >
        Custom Range
      </button>

      {/* Custom date inputs */}
      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: 12,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.25)',
                  }}
                >
                  From
                </span>
                <input
                  type="datetime-local"
                  value={toLocalInput(customStart)}
                  onChange={handleStartChange}
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    outline: 'none',
                    colorScheme: 'dark',
                    width: '100%',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.25)',
                  }}
                >
                  To
                </span>
                <input
                  type="datetime-local"
                  value={toLocalInput(customEnd)}
                  onChange={handleEndChange}
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.6)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    outline: 'none',
                    colorScheme: 'dark',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
