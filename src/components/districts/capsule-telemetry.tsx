/**
 * CapsuleTelemetry -- 3 key-value telemetry rows for district capsules.
 *
 * Displays Pulse, Last Event, and Alerts. When offline, all values
 * render as "--" in ghost color.
 *
 * @module capsule-telemetry
 * @see WS-1.2 Section 4.6
 */

import { cn } from '@/lib/utils'
import type { CapsuleTelemetry as CapsuleTelemetryData } from '@/lib/interfaces/district'

export interface CapsuleTelemetryProps {
  /** Live telemetry data. */
  telemetry: CapsuleTelemetryData
  /** Whether district is offline (show placeholder values). */
  isOffline: boolean
}

const LABEL_CLASSES = cn(
  'font-sans text-[10px] font-normal tracking-[0.06em] uppercase',
  'leading-none text-[var(--color-text-tertiary)]',
)

const VALUE_CLASSES = cn(
  'font-mono text-[16px] font-medium',
  'leading-none text-[var(--color-text-primary)]',
)

interface TelemetryRowProps {
  label: string
  value: string | number
  isOffline: boolean
  isAlert?: boolean
  alertCount?: number
}

function TelemetryRow({
  label,
  value,
  isOffline,
  isAlert = false,
  alertCount = 0,
}: TelemetryRowProps) {
  const displayValue = isOffline ? '--' : value

  return (
    <div className="flex flex-col gap-0.5">
      <span data-slot="telemetry-label" className={LABEL_CLASSES}>
        {label}
      </span>
      <span
        data-slot="telemetry-value"
        className={cn(
          VALUE_CLASSES,
          'tabular-nums',
          isOffline && 'text-[var(--color-text-ghost)]',
          isAlert && !isOffline && Number(value) > 0 && 'text-[var(--color-error)]',
        )}
      >
        {displayValue}
        {isAlert && alertCount > 0 && !isOffline && (
          <span
            className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-error)]"
            style={{ verticalAlign: 'middle' }}
            aria-label={`${alertCount} active alerts`}
          />
        )}
      </span>
    </div>
  )
}

export function CapsuleTelemetry({ telemetry, isOffline }: CapsuleTelemetryProps) {
  return (
    <div className="flex flex-col gap-6">
      <TelemetryRow
        label="PULSE"
        value={telemetry.pulse}
        isOffline={isOffline}
      />
      <TelemetryRow
        label="LAST EVENT"
        value={telemetry.lastEvent}
        isOffline={isOffline}
      />
      <TelemetryRow
        label="ALERTS"
        value={telemetry.alerts}
        isOffline={isOffline}
        isAlert
        alertCount={telemetry.alerts}
      />
    </div>
  )
}
