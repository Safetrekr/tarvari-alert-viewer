'use client'

/**
 * TemplateBrowserItem -- Single template card in the browser.
 *
 * Displays:
 * - Template name and description
 * - Score bar (visual representation of finalScore)
 * - Trigger match details (expandable)
 * - Selection status badge
 * - Pin/unpin button
 */

import { useState } from 'react'
import { Pin, PinOff, ChevronDown, ChevronUp, CheckCircle, Circle } from 'lucide-react'
import { Button, Badge, Tooltip, TooltipContent, TooltipTrigger } from '@tarva/ui'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { ScoredTemplate } from '@/lib/template-selection/types'

// ============================================================================
// Props
// ============================================================================

export interface TemplateBrowserItemProps {
  /** The template to display. */
  readonly template: StationTemplate
  /** Scored data (null if no scoring has been performed). */
  readonly scored: ScoredTemplate | null
  /** Whether this template is currently selected. */
  readonly isSelected: boolean
  /** Whether this template is pinned by the user. */
  readonly isPinned: boolean
  /** Callback to pin this template. */
  readonly onPin: () => void
  /** Callback to unpin this template. */
  readonly onUnpin: () => void
}

// ============================================================================
// Component
// ============================================================================

export function TemplateBrowserItem({
  template,
  scored,
  isSelected,
  isPinned,
  onPin,
  onUnpin,
}: TemplateBrowserItemProps) {
  const [expanded, setExpanded] = useState(false)

  const finalScore = scored?.finalScore ?? 0
  const scorePercent = Math.round(finalScore * 100)

  return (
    <div
      className={[
        'border-b border-white/[0.04] px-3 py-2.5 transition-colors duration-150',
        isSelected ? 'bg-white/[0.04]' : 'bg-transparent',
        'hover:bg-white/[0.03]',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Selection indicator */}
          {isSelected ? (
            <CheckCircle
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: 'var(--status-success)' }}
            />
          ) : (
            <Circle className="h-3.5 w-3.5 shrink-0 opacity-20" />
          )}

          {/* Template name */}
          <span className="truncate font-sans text-[13px] font-medium tracking-[0.01em]">
            {template.displayName}
          </span>

          {/* Category badge */}
          <Badge variant="outline" className="shrink-0 text-[9px] opacity-60">
            {template.category === 'universal' ? 'UNI' : 'APP'}
          </Badge>

          {/* Pinned badge */}
          {isPinned && (
            <Badge variant="secondary" className="shrink-0 text-[9px]">
              PINNED
            </Badge>
          )}
        </div>

        {/* Score + actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Score bar */}
          {scored && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${scorePercent}%`,
                        backgroundColor:
                          scorePercent > 70
                            ? 'var(--status-success)'
                            : scorePercent > 40
                              ? 'var(--color-ember-bright)'
                              : 'var(--status-neutral)',
                      }}
                    />
                  </div>
                  <span className="w-7 text-right font-mono text-[10px] tabular-nums opacity-50">
                    {scorePercent}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-0.5 text-[11px]">
                  <div>Trigger: {Math.round(scored.triggerScore * 100)}%</div>
                  <div>Priority: {Math.round(scored.priorityScore * 100)}%</div>
                  <div>Final: {scorePercent}%</div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Pin/unpin button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={isPinned ? onUnpin : onPin}
              >
                {isPinned ? (
                  <PinOff className="h-3 w-3 opacity-60" />
                ) : (
                  <Pin className="h-3 w-3 opacity-30" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPinned ? 'Unpin (remove override)' : 'Pin (always show this station)'}
            </TooltipContent>
          </Tooltip>

          {/* Expand trigger details */}
          {scored && scored.hasTriggers && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3 opacity-40" />
              ) : (
                <ChevronDown className="h-3 w-3 opacity-40" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-0.5 ml-5 line-clamp-2 text-[11px] leading-tight opacity-40">
        {template.description}
      </p>

      {/* Expanded trigger details */}
      {expanded && scored && scored.hasTriggers && (
        <div className="mt-2 ml-5 space-y-0.5">
          {scored.triggerDetails.map((detail, i) => (
            <div
              key={i}
              className={[
                'font-mono text-[10px] leading-snug',
                detail.matched ? 'opacity-70' : 'opacity-30',
              ].join(' ')}
            >
              <span className={detail.matched ? 'text-green-400' : 'text-red-400'}>
                {detail.matched ? 'PASS' : 'FAIL'}
              </span>{' '}
              {detail.explanation}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
