'use client'

import { Clock } from 'lucide-react'
import { KNOWN_CATEGORIES } from '@/lib/interfaces/coverage'
import type { TimePreset } from '@/stores/coverage.store'
import { TIME_PRESET_LABELS } from '@/stores/coverage.store'

export interface MobileFilterChipsProps {
  readonly selectedCategories: string[]
  readonly onToggle: (categoryId: string) => void
  readonly onClearAll: () => void
  /** Current time preset. When provided, a time chip is shown. */
  readonly timePreset?: TimePreset | 'custom'
  /** Called when the time chip is tapped. */
  readonly onTimeTap?: () => void
}

export function MobileFilterChips({
  selectedCategories,
  onToggle,
  onClearAll,
  timePreset,
  onTimeTap,
}: MobileFilterChipsProps) {
  const noneSelected = selectedCategories.length === 0
  const timeLabel = timePreset === 'custom'
    ? 'Custom'
    : timePreset
      ? TIME_PRESET_LABELS[timePreset]
      : null
  const isTimeFiltered = timePreset != null && timePreset !== 'all'

  return (
    <div className="mobile-filter-chips" role="toolbar" aria-label="Category filters">
      <div className="mobile-filter-chips-scroll">
        {/* Time chip */}
        {timePreset != null && onTimeTap && (
          <button
            type="button"
            className="mobile-chip"
            data-active={isTimeFiltered}
            onClick={onTimeTap}
            aria-label={`Time filter: ${timeLabel}`}
            style={isTimeFiltered ? {
              '--chip-color-rgb': '100 180 220',
            } as React.CSSProperties : undefined}
          >
            <Clock size={12} aria-hidden="true" />
            {timeLabel}
          </button>
        )}
        <button
          type="button"
          className="mobile-chip mobile-chip-all"
          data-active={noneSelected}
          onClick={onClearAll}
          aria-pressed={noneSelected}
        >
          All
        </button>
        {KNOWN_CATEGORIES.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id)
          return (
            <button
              key={cat.id}
              type="button"
              className="mobile-chip"
              data-active={isSelected}
              onClick={() => onToggle(cat.id)}
              aria-pressed={isSelected}
              aria-label={`Filter ${cat.displayName}`}
            >
              <span className="mobile-chip-icon" aria-hidden="true">
                {cat.shortName.charAt(0)}
              </span>
              {cat.shortName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
