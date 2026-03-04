'use client'

import { type ComponentProps, type ReactNode } from 'react'
import { CardHeader, CardTitle } from '@tarva/ui'
import { cn } from '@/lib/utils'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import { useStationContext } from './station-context'

// ============================================================================
// Props
// ============================================================================

export interface StationHeaderProps extends ComponentProps<'div'> {
  /**
   * Optional override for the station title.
   * Defaults to `template.layout.header.title` from context.
   */
  readonly title?: string
  /**
   * Optional Lucide icon element rendered before the title.
   * Defaults to resolving `template.layout.header.icon` from context.
   */
  readonly icon?: ReactNode
  /**
   * Optional trailing element (e.g., status badge, close button).
   */
  readonly trailing?: ReactNode
}

// ============================================================================
// Component
// ============================================================================

/**
 * Station header zone (Zone 1 of 3).
 *
 * Renders the district display name as a subtle context label above the
 * station title. Typography follows VISUAL-DESIGN-SPEC.md Z3 scale:
 *
 * - District label: 11px, Geist Sans, 400 weight, 0.04em tracking,
 *   uppercase, --color-text-tertiary, opacity 0.5
 * - Station title: 16px, Geist Sans, 600 weight, 0.02em tracking,
 *   --color-text-primary, opacity 1.0
 */
export function StationHeader({ title, icon, trailing, className, ...props }: StationHeaderProps) {
  const { districtId, template } = useStationContext()

  const displayTitle = title ?? template.layout.header.title
  const districtName = APP_DISPLAY_NAMES[districtId]

  return (
    <CardHeader className={cn('border-b border-white/[0.04] px-5 pt-4 pb-3', className)} {...props}>
      {/* District context label */}
      <span
        className="font-sans text-[11px] font-normal tracking-[0.04em] uppercase opacity-50"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {districtName}
      </span>

      {/* Station title row */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          {icon && (
            <span className="shrink-0 opacity-70" style={{ color: 'var(--color-ember-bright)' }}>
              {icon}
            </span>
          )}
          <span
            className="font-sans text-[16px] font-semibold tracking-[0.02em]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {displayTitle}
          </span>
        </CardTitle>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    </CardHeader>
  )
}
