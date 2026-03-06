'use client'

/**
 * PriorityBadge -- achromatic priority indicator component.
 *
 * Renders operational priority (P1-P4) using shape, weight, and animation.
 * Never uses color -- severity owns the color channel exclusively (AD-1).
 *
 * - P1: Bold diamond + pulse animation
 * - P2: Medium triangle, static
 * - P3: Text label only (visible in detail views)
 * - P4: Returns null by default (progressive disclosure)
 *
 * @module PriorityBadge
 * @see AD-1 -- Achromatic priority visual channel
 */

import type { OperationalPriority } from '@/lib/interfaces/coverage'
import { getPriorityMeta } from '@/lib/interfaces/coverage'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Pulse animation styles (injected once via React 19 <style> deduplication)
// ---------------------------------------------------------------------------

const PULSE_STYLES = `
@keyframes priority-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@media (prefers-reduced-motion: reduce) {
  .priority-pulse { animation: none !important; }
}
`

// ---------------------------------------------------------------------------
// Size system
// ---------------------------------------------------------------------------

const SIZE_CONFIG = {
  sm: { svgSize: 12, fontSize: 'text-[9px]', gap: 'gap-1' },
  md: { svgSize: 16, fontSize: 'text-[10px]', gap: 'gap-1.5' },
  lg: { svgSize: 20, fontSize: 'text-[11px]', gap: 'gap-2' },
} as const

// ---------------------------------------------------------------------------
// SVG shapes
// ---------------------------------------------------------------------------

function DiamondShape({ size }: { size: number }) {
  const center = size / 2
  const rectSize = Math.round(size * 0.67)
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x={center - rectSize / 2}
        y={center - rectSize / 2}
        width={rectSize}
        height={rectSize}
        rx={1}
        fill="currentColor"
        transform={`rotate(45, ${center}, ${center})`}
      />
    </svg>
  )
}

function TriangleShape({ size }: { size: number }) {
  const pad = Math.round(size * 0.1)
  const top = `${size / 2},${pad}`
  const bottomRight = `${size - pad},${size - pad}`
  const bottomLeft = `${pad},${size - pad}`
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-hidden="true"
      className="shrink-0"
    >
      <polygon points={`${top} ${bottomRight} ${bottomLeft}`} fill="currentColor" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PriorityBadgeProps {
  /** The operational priority level to display. */
  priority: OperationalPriority
  /**
   * Contextual size variant.
   * - 'sm': ~12px, for inline use in list rows
   * - 'md': ~16px, for badge overlays on cards
   * - 'lg': ~20px, for detail panel display
   * @default 'sm'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Whether to show the priority text label alongside or instead of the shape.
   * @default false
   */
  showLabel?: boolean
  /** Additional CSS class names for layout composition. */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Opacity tiers per priority level (achromatic white channel). */
const PRIORITY_OPACITY: Record<OperationalPriority, number> = {
  P1: 0.55,
  P2: 0.35,
  P3: 0.20,
  P4: 0.10,
}

export function PriorityBadge({
  priority,
  size = 'sm',
  showLabel = false,
  className,
}: PriorityBadgeProps) {
  const meta = getPriorityMeta(priority)

  // P4: invisible by default, render only with explicit showLabel
  if (priority === 'P4' && !showLabel) return null

  // P3: text-only, invisible in compact views unless showLabel
  if (priority === 'P3' && !showLabel) return null

  const sizeConfig = SIZE_CONFIG[size]
  const opacity = PRIORITY_OPACITY[priority]
  const ariaLabel = `Priority ${meta.sortOrder} \u2014 ${meta.label}`

  return (
    <>
      <style>{PULSE_STYLES}</style>
      <span
        className={cn(
          'inline-flex items-center leading-none',
          sizeConfig.gap,
          meta.weight === 'bold' && 'font-bold',
          meta.weight === 'medium' && 'font-medium',
          meta.weight === 'normal' && 'font-normal',
          meta.animation === 'pulse' && 'priority-pulse',
          className,
        )}
        style={{
          color: `rgba(255, 255, 255, ${opacity})`,
          ...(meta.animation === 'pulse'
            ? { animation: 'priority-pulse 2.5s ease-in-out infinite' }
            : {}),
        }}
        aria-label={ariaLabel}
      >
        {meta.shape === 'diamond' && <DiamondShape size={sizeConfig.svgSize} />}
        {meta.shape === 'triangle' && <TriangleShape size={sizeConfig.svgSize} />}
        {showLabel && (
          <span className={cn(sizeConfig.fontSize, 'font-mono uppercase tracking-[0.06em]')}>
            {meta.shortLabel}
          </span>
        )}
      </span>
    </>
  )
}
