/**
 * TimeRangeSelector -- quick-select time presets + optional date picker
 * for filtering map markers by ingestion time.
 *
 * Renders a row of pill buttons (1m, 10m, 30m, 1h, ..., All) and a
 * collapsible custom date picker. Matches the glass/mono Tarva style.
 *
 * @module TimeRangeSelector
 */

'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  type TimePreset,
  TIME_PRESETS,
  TIME_PRESET_LABELS,
} from '@/stores/coverage.store'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TimeRangeSelectorProps {
  value: TimePreset | 'custom'
  customStart: string | null
  customEnd: string | null
  onPresetChange: (preset: TimePreset) => void
  onCustomChange: (start: string | null, end: string | null) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimeRangeSelector({
  value,
  customStart,
  customEnd,
  onPresetChange,
  onCustomChange,
}: TimeRangeSelectorProps) {
  const [showDatePicker, setShowDatePicker] = useState(value === 'custom')

  const handlePreset = useCallback(
    (preset: TimePreset) => {
      setShowDatePicker(false)
      onPresetChange(preset)
    },
    [onPresetChange],
  )

  const handleToggleDatePicker = useCallback(() => {
    setShowDatePicker((prev) => !prev)
  }, [])

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

  // Convert ISO back to datetime-local format for input value
  const toLocalInput = (iso: string | null): string => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    // datetime-local expects YYYY-MM-DDTHH:mm
    return d.toISOString().slice(0, 16)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      {/* Preset row */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          padding: 3,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 10,
        }}
      >
        {TIME_PRESETS.map((preset) => {
          const isActive = value === preset && !showDatePicker
          return (
            <button
              key={preset}
              type="button"
              onClick={() => handlePreset(preset)}
              style={{
                ...MONO,
                position: 'relative',
                padding: '6px 8px',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isActive
                  ? 'rgba(255, 255, 255, 0.60)'
                  : 'rgba(255, 255, 255, 0.25)',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'color 200ms ease',
                whiteSpace: 'nowrap',
                zIndex: isActive ? 1 : 0,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.25)'
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="timerange-active"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 8,
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {TIME_PRESET_LABELS[preset]}
            </button>
          )
        })}

        {/* Date picker toggle button */}
        <button
          type="button"
          onClick={handleToggleDatePicker}
          style={{
            ...MONO,
            position: 'relative',
            padding: '6px 10px',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: (showDatePicker || value === 'custom')
              ? 'rgba(255, 255, 255, 0.60)'
              : 'rgba(255, 255, 255, 0.25)',
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'color 200ms ease',
            whiteSpace: 'nowrap',
            zIndex: (showDatePicker || value === 'custom') ? 1 : 0,
          }}
          onMouseEnter={(e) => {
            if (value !== 'custom' && !showDatePicker) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)'
          }}
          onMouseLeave={(e) => {
            if (value !== 'custom' && !showDatePicker) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.25)'
          }}
          aria-label="Custom date range"
        >
          {(showDatePicker || value === 'custom') && (
            <motion.div
              layoutId="timerange-active"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 8,
                zIndex: -1,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          Date
        </button>
      </div>

      {/* Expandable date picker row */}
      <AnimatePresence>
        {showDatePicker && (
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
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 10,
              }}
            >
              <span
                style={{
                  ...MONO,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                From
              </span>
              <input
                type="datetime-local"
                value={toLocalInput(customStart)}
                onChange={handleStartChange}
                style={{
                  ...MONO,
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.5)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
              <span
                style={{
                  ...MONO,
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                To
              </span>
              <input
                type="datetime-local"
                value={toLocalInput(customEnd)}
                onChange={handleEndChange}
                style={{
                  ...MONO,
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.5)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  outline: 'none',
                  colorScheme: 'dark',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
