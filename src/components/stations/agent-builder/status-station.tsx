'use client'

/**
 * StatusStation -- Universal health dashboard for the Agent Builder district.
 *
 * Driven entirely by AppTelemetry data from the WS-1.5 districts store.
 * This is the same structure as every district's Status station but rendered
 * with Agent Builder-specific labels.
 *
 * Displays: HealthBadge, uptime, version, response time, sparkline,
 * sub-check status rows, and alert count.
 *
 * @module status-station
 * @see WS-2.2 Section 4.6
 */

import { HealthBadge } from '@/components/telemetry/health-badge'
import { TelemetrySparkline } from '@/components/telemetry/telemetry-sparkline'
import { AlertIndicator } from '@/components/telemetry/alert-indicator'
import { Skeleton } from '@tarva/ui'
import type { AppTelemetry } from '@/lib/telemetry-types'

// ============================================================================
// Types
// ============================================================================

export interface StatusStationProps {
  /** Full telemetry record from WS-1.5 districts store. */
  readonly telemetry: AppTelemetry | null
  /** Whether telemetry data is still loading. */
  readonly isLoading: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '--'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatResponseTime(ms: number | null): string {
  if (ms === null) return '--'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ============================================================================
// Sub-Components
// ============================================================================

function MetricRow({
  label,
  value,
  isLoading,
}: {
  label: string
  value: string
  isLoading: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 last:border-b-0">
      <span className="font-sans text-[11px] leading-none font-normal tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
        {label}
      </span>
      {isLoading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <span
          className="font-mono text-[13px] leading-none font-medium text-[var(--color-text-primary)] tabular-nums"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {value}
        </span>
      )}
    </div>
  )
}

function SubCheckRow({ name, status }: { name: string; status: string }) {
  const isOk = status === 'ok' || status === 'healthy' || status === 'operational'
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="font-sans text-[12px] text-[var(--color-text-secondary)] capitalize">
        {name}
      </span>
      <span
        className={`font-mono text-[11px] tabular-nums ${
          isOk ? 'text-[var(--color-healthy)]' : 'text-[var(--color-warning)]'
        }`}
        style={{ fontFeatureSettings: '"tnum" 1' }}
      >
        {status.toUpperCase()}
      </span>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function StatusStation({ telemetry, isLoading }: StatusStationProps) {
  const isOffline = !telemetry || telemetry.status === 'OFFLINE' || telemetry.status === 'UNKNOWN'

  return (
    <div className="flex flex-col gap-4">
      {/* Health Badge + Alert Count */}
      <div className="flex items-center justify-between">
        <HealthBadge status={telemetry?.status ?? 'UNKNOWN'} size="default" />
        {telemetry && telemetry.alertCount > 0 && <AlertIndicator count={telemetry.alertCount} />}
      </div>

      {/* Key Metrics */}
      <div className="flex flex-col">
        <MetricRow
          label="Uptime"
          value={isOffline ? '--' : formatUptime(telemetry?.uptime ?? null)}
          isLoading={isLoading}
        />
        <MetricRow
          label="Version"
          value={isOffline ? '--' : (telemetry?.version ?? '--')}
          isLoading={isLoading}
        />
        <MetricRow
          label="Response Time"
          value={isOffline ? '--' : formatResponseTime(telemetry?.responseTimeMs ?? null)}
          isLoading={isLoading}
        />
      </div>

      {/* Response Time Sparkline */}
      {!isOffline && telemetry && telemetry.responseTimeHistory.length > 0 && (
        <div className="pt-2">
          <span className="mb-1 block font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Response Time History
          </span>
          <TelemetrySparkline data={telemetry.responseTimeHistory} width={240} height={32} />
        </div>
      )}

      {/* Sub-Checks */}
      {!isOffline && telemetry && Object.keys(telemetry.checks).length > 0 && (
        <div className="pt-2">
          <span className="mb-2 block font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Health Checks
          </span>
          <div className="flex flex-col">
            {Object.entries(telemetry.checks).map(([name, status]) => (
              <SubCheckRow key={name} name={name} status={String(status)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
