'use client'

import { useState, useCallback } from 'react'
import { useCoverageStore } from '@/stores/coverage.store'

export interface MobileCategoryFiltersProps {
  readonly categoryId: string
}

export function MobileCategoryFilters({ categoryId }: MobileCategoryFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const bboxEnabled = useCoverageStore((s) => s.districtBboxEnabled)
  const setBboxEnabled = useCoverageStore((s) => s.setDistrictBboxEnabled)

  const hasActiveFilter = bboxEnabled

  const toggleOpen = useCallback(() => setIsOpen((v) => !v), [])

  return (
    <div style={{ position: 'relative' }}>
      {/* Filter toggle button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Hide filters' : 'Show filters'}
        aria-expanded={isOpen}
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)',
          background: isOpen ? 'rgba(100,180,220,0.12)' : 'rgba(255,255,255,0.04)',
          color: isOpen ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Filter icon (funnel) */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {/* Active indicator dot */}
        {hasActiveFilter && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: '#64b4dc',
            }}
          />
        )}
      </button>

      {/* Filter drawer */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 36,
            right: 0,
            zIndex: 5,
            background: 'rgba(15, 20, 30, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '10px 12px',
            minWidth: 180,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              Viewport filter
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={bboxEnabled}
              aria-label="Toggle viewport filter"
              onClick={() => setBboxEnabled(!bboxEnabled)}
              style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                border: 'none',
                background: bboxEnabled ? 'rgba(100,180,220,0.4)' : 'rgba(255,255,255,0.1)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                WebkitTapHighlightColor: 'transparent',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: bboxEnabled ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: bboxEnabled ? '#64b4dc' : 'rgba(255,255,255,0.4)',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
