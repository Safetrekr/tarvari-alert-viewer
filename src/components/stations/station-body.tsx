'use client'

import { type ComponentProps, type ReactNode } from 'react'
import { CardContent, ScrollArea } from '@tarva/ui'
import { cn } from '@/lib/utils'
import { useStationContext } from './station-context'

// ============================================================================
// Body Type Slots
// ============================================================================

/**
 * Mapping from `StationLayout.bodyType` to the render slot name.
 * District workstreams (WS-2.2-2.5) provide content for these slots.
 *
 * | bodyType   | Expected content                                          |
 * |------------|-----------------------------------------------------------|
 * | 'table'    | Data table: runs, artifacts, conversations, dependencies  |
 * | 'list'     | Vertical list: alerts, errors, dependencies               |
 * | 'metrics'  | Key-value metric grid: status dashboard, health overview  |
 * | 'launch'   | App launch panel: URL, version, launch + copy buttons     |
 * | 'custom'   | Free-form content: anything the district needs            |
 */
export type BodyTypeSlot = 'table' | 'list' | 'metrics' | 'launch' | 'custom'

// ============================================================================
// Props
// ============================================================================

export interface StationBodyProps extends ComponentProps<'div'> {
  /**
   * The station body content.
   *
   * District workstreams render their domain-specific content here.
   * The body type from the template determines scrolling behavior:
   * - 'table' and 'list' get ScrollArea wrapping for overflow
   * - 'metrics' and 'launch' are non-scrollable (fixed height)
   * - 'custom' is passed through without modification
   */
  readonly children: ReactNode
  /**
   * Optional max-height for the scrollable body area.
   * Defaults to 280px. Set to 'none' to disable scroll constraint.
   */
  readonly maxHeight?: number | 'none'
}

// ============================================================================
// Component
// ============================================================================

/**
 * Station body zone (Zone 2 of 3).
 *
 * Typography follows VISUAL-DESIGN-SPEC.md Z3 scale:
 * - Body text: 14px, Geist Sans, 400 weight, --color-text-primary, opacity 0.85, line-height 1.6
 * - Table header: 11px, Geist Sans, 600 weight, 0.04em tracking, uppercase, opacity 0.6
 * - Table data: 13px, Geist Mono, 400 weight, opacity 0.8, line-height 1.4
 * - Table number: 13px, Geist Mono, 500 weight, tabular-nums, opacity 0.85
 *
 * Scrollable body types ('table', 'list') are wrapped in @tarva/ui ScrollArea.
 */
export function StationBody({ children, maxHeight = 280, className, ...props }: StationBodyProps) {
  const { template } = useStationContext()
  const { bodyType } = template.layout

  const isScrollable = bodyType === 'table' || bodyType === 'list'

  const bodyContent = (
    <CardContent
      className={cn('px-5 py-3', 'font-sans text-[14px] leading-[1.6] font-normal', className)}
      style={{
        color: 'var(--color-text-primary)',
        opacity: 0.85,
      }}
      {...props}
    >
      {children}
    </CardContent>
  )

  if (isScrollable && maxHeight !== 'none') {
    return (
      <ScrollArea
        className="flex-1"
        style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : undefined }}
      >
        {bodyContent}
      </ScrollArea>
    )
  }

  return <div className="flex-1">{bodyContent}</div>
}
