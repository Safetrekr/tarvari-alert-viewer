/**
 * TelemetrySparkline -- Wraps @tarva/ui Sparkline with teal accent
 * colors for the telemetry dashboard.
 *
 * @module telemetry-sparkline
 * @see WS-1.5
 */

'use client'

import { Sparkline } from '@tarva/ui'

import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TelemetrySparklineProps {
  /** Data points to visualize. Requires at least 2 points to render. */
  data: number[]
  /** Width in pixels. @default 60 */
  width?: number
  /** Height in pixels. @default 20 */
  height?: number
  className?: string
}

// ---------------------------------------------------------------------------
// Teal accent overrides
// ---------------------------------------------------------------------------

/**
 * CSS custom property overrides that map the Sparkline's trend tokens
 * to the teal accent palette defined in the Tarva design spec.
 */
const TEAL_STYLE: React.CSSProperties = {
  '--trend-positive': 'var(--color-accent-teal, #2dd4bf)',
  '--trend-negative': 'var(--color-accent-teal, #2dd4bf)',
  '--trend-neutral': 'var(--color-accent-teal, #2dd4bf)',
} as React.CSSProperties

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TelemetrySparkline({
  data,
  width = 60,
  height = 20,
  className,
}: TelemetrySparklineProps) {
  if (data.length < 2) return null

  return (
    <Sparkline
      data={data}
      width={width}
      height={height}
      strokeWidth={1.5}
      variant="auto"
      animated
      className={cn(className)}
      style={TEAL_STYLE}
    />
  )
}
