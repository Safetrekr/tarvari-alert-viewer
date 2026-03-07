'use client'

import { KNOWN_CATEGORIES } from '@/lib/interfaces/coverage'

export interface MobileFilterChipsProps {
  readonly selectedCategories: string[]
  readonly onToggle: (categoryId: string) => void
  readonly onClearAll: () => void
}

export function MobileFilterChips({
  selectedCategories,
  onToggle,
  onClearAll,
}: MobileFilterChipsProps) {
  const noneSelected = selectedCategories.length === 0

  return (
    <div className="mobile-filter-chips" role="toolbar" aria-label="Category filters">
      <div className="mobile-filter-chips-scroll">
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
