'use client'

import type { GeoLevel } from '@/lib/interfaces/coverage'

export interface BreadcrumbLevel {
  label: string
  level: GeoLevel
  key: string
}

export interface MobileGeoBreadcrumbProps {
  readonly levels: BreadcrumbLevel[]
  readonly onNavigate: (level: GeoLevel, key: string) => void
}

export function MobileGeoBreadcrumb({ levels, onNavigate }: MobileGeoBreadcrumbProps) {
  if (levels.length === 0) return null

  return (
    <nav
      aria-label="Geographic drill-down breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        height: 32,
        overflow: 'hidden',
      }}
    >
      {levels.map((lvl, i) => {
        const isLast = i === levels.length - 1

        return (
          <span key={`${lvl.level}-${lvl.key}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && (
              <span
                aria-hidden="true"
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.15)',
                  userSelect: 'none',
                }}
              >
                &gt;
              </span>
            )}
            {isLast ? (
              <span
                aria-current="location"
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.6)',
                  whiteSpace: 'nowrap',
                }}
              >
                {lvl.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(lvl.level, lvl.key)}
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.3)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {lvl.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
}
