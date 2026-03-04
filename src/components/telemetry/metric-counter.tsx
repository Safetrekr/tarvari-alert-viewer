/**
 * MetricCounter -- Numeric display with tabular-nums styling and
 * optional flash animation on value change.
 *
 * @module metric-counter
 * @see WS-1.5
 */

'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MetricCounterProps {
  /** Numeric value to display. null renders the placeholder. */
  value: number | null
  /** Unit suffix (e.g. "ms", "rpm"). */
  unit?: string
  /** Decimal precision for formatting. @default 0 */
  precision?: number
  /** Label text rendered above the value. */
  label?: string
  /** Placeholder string when value is null. @default "--" */
  placeholder?: string
  /** Whether to flash on value change. @default true */
  animated?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MetricCounter({
  value,
  unit,
  precision = 0,
  label,
  placeholder = '--',
  animated = true,
  className,
}: MetricCounterProps) {
  const [flash, setFlash] = useState(false)
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (!animated) return

    if (prevValueRef.current !== value) {
      setFlash(true)
      const timeout = setTimeout(() => setFlash(false), 300)
      prevValueRef.current = value
      return () => clearTimeout(timeout)
    }
  }, [value, animated])

  const formattedValue =
    value !== null ? `${value.toFixed(precision)}${unit ? ` ${unit}` : ''}` : placeholder

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {label && (
        <span
          className="text-[10px] uppercase tracking-[0.06em] opacity-40"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {label}
        </span>
      )}
      <span
        className={cn(
          'font-[var(--font-geist-mono,_monospace)] text-base font-medium',
          'tabular-nums',
          'transition-opacity duration-300',
          flash && 'opacity-60',
        )}
      >
        {formattedValue}
      </span>
    </div>
  )
}
