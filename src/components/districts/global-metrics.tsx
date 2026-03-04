/**
 * GlobalMetrics -- aggregate system metrics bar for Z0 constellation view.
 *
 * Displays three key-value pairs: Alert Count, Active Work, and System Pulse.
 * Designed for glanceability at the zoomed-out Z0 scale.
 *
 * @module global-metrics
 * @see WS-2.7 Section 4.5
 */

'use client'

import { cn } from '@/lib/utils'
import type { ConstellationMetrics } from '@/lib/interfaces/district'
import { HEALTH_STATE_MAP } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GlobalMetricsProps {
  /** Aggregated metrics from ConstellationView. */
  metrics: ConstellationMetrics
}

// ---------------------------------------------------------------------------
// MetricItem (internal)
// ---------------------------------------------------------------------------

function MetricItem({
  label,
  value,
  isAlert = false,
}: {
  label: string
  value: number
  isAlert?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          'font-sans text-[8px] font-normal tracking-[0.08em] uppercase',
          'leading-none text-[var(--color-text-tertiary)]',
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-mono text-[14px] leading-none font-medium tabular-nums',
          isAlert
            ? 'text-[var(--color-error)]'
            : 'text-[var(--color-text-primary)]',
        )}
      >
        {value}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GlobalMetrics({ metrics }: GlobalMetricsProps) {
  const pulseMapping = HEALTH_STATE_MAP[metrics.systemPulse]

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-6',
        'absolute left-1/2 -translate-x-1/2',
        'top-[calc(50%+180px)]',
      )}
      role="status"
      aria-label="System overview"
    >
      {/* Alert Count */}
      <MetricItem
        label="ALERTS"
        value={metrics.alertCount}
        isAlert={metrics.alertCount > 0}
      />

      {/* Separator */}
      <div className="h-4 w-px bg-white/[0.06]" aria-hidden="true" />

      {/* Active Work */}
      <MetricItem label="ACTIVE" value={metrics.activeWork} />

      {/* Separator */}
      <div className="h-4 w-px bg-white/[0.06]" aria-hidden="true" />

      {/* System Pulse */}
      <div className="flex items-center gap-1.5">
        <div
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: `var(${pulseMapping.color})`,
          }}
        />
        <span
          className={cn(
            'font-sans text-[9px] font-semibold tracking-[0.08em] uppercase',
            'leading-none text-[var(--color-text-secondary)]',
          )}
        >
          {pulseMapping.label}
        </span>
      </div>
    </div>
  )
}
