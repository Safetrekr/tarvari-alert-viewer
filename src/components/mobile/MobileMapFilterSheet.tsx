'use client'

import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { KNOWN_CATEGORIES, getCategoryColor, type SeverityLevel } from '@/lib/interfaces/coverage'
import { TIME_PRESETS, TIME_PRESET_LABELS, type TimePreset } from '@/stores/coverage.store'

// ---------------------------------------------------------------------------
// Severity config
// ---------------------------------------------------------------------------

const SEVERITY_FILTER_ITEMS: { level: SeverityLevel; label: string; color: string }[] = [
  { level: 'Extreme', label: 'EXTREME', color: '#ef4444' },
  { level: 'Severe', label: 'SEVERE', color: '#f97316' },
  { level: 'Moderate', label: 'MOD', color: '#eab308' },
  { level: 'Minor', label: 'MINOR', color: '#3b82f6' },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MobileMapFilterSheetProps {
  readonly timePreset: TimePreset | 'custom'
  readonly customTimeStart: string | null
  readonly customTimeEnd: string | null
  readonly onTimePresetChange: (preset: TimePreset) => void
  readonly onCustomTimeChange: (start: string | null, end: string | null) => void
  readonly selectedSeverities: SeverityLevel[]
  readonly onToggleSeverity: (severity: SeverityLevel) => void
  readonly selectedCategories: string[]
  readonly onToggleCategory: (categoryId: string) => void
  readonly onResetAll: () => void
  readonly onDismiss: () => void
}

// ---------------------------------------------------------------------------
// Shared cell style
// ---------------------------------------------------------------------------

const baseCellStyle: React.CSSProperties = {
  height: 44,
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.06)',
  background: 'rgba(255,255,255,0.03)',
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  color: 'rgba(255,255,255,0.35)',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
}

function activeCellStyle(accentColor: string): React.CSSProperties {
  // Parse hex to rgb for rgba usage
  const r = parseInt(accentColor.slice(1, 3), 16)
  const g = parseInt(accentColor.slice(3, 5), 16)
  const b = parseInt(accentColor.slice(5, 7), 16)
  return {
    ...baseCellStyle,
    background: `rgba(${r},${g},${b},0.12)`,
    borderColor: `rgba(${r},${g},${b},0.30)`,
    color: 'rgba(255,255,255,0.85)',
  }
}

const tealActive: React.CSSProperties = {
  ...baseCellStyle,
  background: 'rgba(100,180,220,0.12)',
  borderColor: 'rgba(100,180,220,0.30)',
  color: 'rgba(255,255,255,0.85)',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MobileMapFilterSheet({
  timePreset,
  customTimeStart,
  customTimeEnd,
  onTimePresetChange,
  onCustomTimeChange,
  selectedSeverities,
  onToggleSeverity,
  selectedCategories,
  onToggleCategory,
  onResetAll,
  onDismiss,
}: MobileMapFilterSheetProps) {
  const [showCustom, setShowCustom] = useState(timePreset === 'custom')

  const hasAnyFilter =
    timePreset !== 'all' ||
    selectedSeverities.length > 0 ||
    selectedCategories.length > 0

  const handlePresetTap = useCallback(
    (preset: TimePreset) => {
      onTimePresetChange(preset)
      setShowCustom(false)
    },
    [onTimePresetChange],
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        padding: '0 var(--space-content-padding, 12px) 16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 0 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color: 'rgba(255,255,255,0.50)',
          }}
        >
          FILTERS
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          {hasAnyFilter && (
            <button
              type="button"
              onClick={onResetAll}
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 10,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(239,68,68,0.70)',
                background: 'transparent',
                border: 'none',
                padding: '8px 0',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              CLEAR ALL
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(100,180,220,0.80)',
              background: 'transparent',
              border: 'none',
              padding: '8px 0',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            DONE
          </button>
        </div>
      </div>

      {/* Time Range Section */}
      <section style={{ marginTop: 20 }} role="group" aria-label="Time range filters">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.40)',
            }}
          >
            TIME RANGE
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
          }}
          role="radiogroup"
          aria-label="Time presets"
        >
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={timePreset === preset}
              onClick={() => handlePresetTap(preset)}
              style={timePreset === preset ? tealActive : baseCellStyle}
            >
              {TIME_PRESET_LABELS[preset]}
            </button>
          ))}
        </div>

        {/* Custom range toggle */}
        <button
          type="button"
          onClick={() => setShowCustom((v) => !v)}
          style={{
            ...baseCellStyle,
            width: '100%',
            marginTop: 6,
            height: 40,
            fontSize: 10,
            ...(showCustom
              ? { background: 'rgba(100,180,220,0.08)', borderColor: 'rgba(100,180,220,0.20)', color: 'rgba(255,255,255,0.6)' }
              : {}),
          }}
        >
          Custom Range {showCustom ? '▴' : '▾'}
        </button>

        <AnimatePresence>
          {showCustom && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.3)',
                      marginBottom: 4,
                    }}
                  >
                    FROM
                  </label>
                  <input
                    type="datetime-local"
                    value={customTimeStart ?? ''}
                    onChange={(e) => onCustomTimeChange(e.target.value || null, customTimeEnd)}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 11,
                      colorScheme: 'dark',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 9,
                      color: 'rgba(255,255,255,0.3)',
                      marginBottom: 4,
                    }}
                  >
                    TO
                  </label>
                  <input
                    type="datetime-local"
                    value={customTimeEnd ?? ''}
                    onChange={(e) => onCustomTimeChange(customTimeStart, e.target.value || null)}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 8px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.7)',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 11,
                      colorScheme: 'dark',
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '20px 0' }} />

      {/* Severity Section */}
      <section role="group" aria-label="Severity filters">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.40)',
            }}
          >
            SEVERITY
          </span>
          {selectedSeverities.length > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 9,
                fontWeight: 500,
                color: 'rgba(100,180,220,0.70)',
              }}
            >
              {selectedSeverities.length} of {SEVERITY_FILTER_ITEMS.length}
            </span>
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}
        >
          {SEVERITY_FILTER_ITEMS.map((item) => {
            const isActive = selectedSeverities.includes(item.level)
            return (
              <button
                key={item.level}
                type="button"
                role="checkbox"
                aria-checked={isActive}
                aria-label={`Filter by ${item.level} severity`}
                onClick={() => onToggleSeverity(item.level)}
                style={isActive ? activeCellStyle(item.color) : baseCellStyle}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: item.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 9 }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '20px 0' }} />

      {/* Category Section */}
      <section role="group" aria-label="Category filters">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.40)',
            }}
          >
            CATEGORY
          </span>
          {selectedCategories.length > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 9,
                fontWeight: 500,
                color: 'rgba(100,180,220,0.70)',
              }}
            >
              {selectedCategories.length} selected
            </span>
          )}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}
        >
          {KNOWN_CATEGORIES.map((cat) => {
            const isActive = selectedCategories.includes(cat.id)
            // Extract raw hex from the CSS var string: 'var(--category-seismic, #ef4444)' → '#ef4444'
            const rawColor = cat.color.match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#6b7280'
            return (
              <button
                key={cat.id}
                type="button"
                role="checkbox"
                aria-checked={isActive}
                aria-label={`Filter ${cat.displayName} category`}
                onClick={() => onToggleCategory(cat.id)}
                style={isActive ? activeCellStyle(rawColor) : baseCellStyle}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: rawColor,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 10 }}>{cat.shortName}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
