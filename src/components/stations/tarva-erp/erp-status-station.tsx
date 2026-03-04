'use client'

/**
 * ErpStatusStation -- HTTP health check display for the TarvaERP district.
 *
 * TarvaERP is a manufacturing ERP frontend with 5 modules. Health comes
 * from HTTP checks against localhost:3010/api/health via the WS-1.5
 * telemetry aggregator.
 *
 * Derives TarvaERP-specific ErpHealthDetail from the generic AppTelemetry
 * and renders version, uptime, module count, and telemetry sparkline
 * when operational. Falls back to offline guidance when the app is not
 * running.
 *
 * This component renders station body content. The parent district wraps it
 * in a StationPanel for the 3-zone layout (header/body/actions).
 *
 * @module erp-status-station
 * @see WS-2.5 Section 4.7
 */

import { useMemo } from 'react'
import { HealthBadge } from '@/components/telemetry/health-badge'
import { TelemetrySparkline } from '@/components/telemetry/telemetry-sparkline'
import { AlertIndicator } from '@/components/telemetry/alert-indicator'
import { Skeleton } from '@tarva/ui'
import type { AppTelemetry } from '@/lib/telemetry-types'
import { ERP_MODULES, type ErpHealthDetail, type ErpModuleStatus } from '@/lib/tarva-erp-types'

// ============================================================================
// Types
// ============================================================================

export interface ErpStatusStationProps {
  /** Telemetry data from HTTP health check. */
  readonly telemetry: AppTelemetry | null
  /** Whether telemetry data is still loading. */
  readonly isLoading: boolean
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Derive ERP-specific health detail from generic AppTelemetry.
 * Maps module check results from the /api/health checks field
 * to per-module health status.
 */
function deriveErpHealth(telemetry: AppTelemetry): ErpHealthDetail {
  const moduleStatuses: ErpModuleStatus[] = ERP_MODULES.map((mod) => ({
    ...mod,
    status: telemetry.checks?.[mod.id]
      ? String(telemetry.checks[mod.id]) === 'ok' ||
        String(telemetry.checks[mod.id]) === 'healthy' ||
        String(telemetry.checks[mod.id]) === 'operational'
        ? ('OPERATIONAL' as const)
        : ('DEGRADED' as const)
      : ('UNKNOWN' as const),
  }))

  return {
    status: telemetry.status,
    version: telemetry.version ?? null,
    uptimeSeconds: telemetry.uptime ?? null,
    modules: moduleStatuses,
  }
}

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '--'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatRelativeTime(isoTimestamp: string | null): string {
  if (!isoTimestamp) return '--'
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

// ============================================================================
// Sub-Components
// ============================================================================

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-sans text-[11px] font-normal tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase opacity-50">
        {label}
      </span>
      <span
        className="font-mono text-[14px] font-medium text-[var(--color-text-primary)] tabular-nums opacity-85"
        style={{ fontFeatureSettings: '"tnum" 1' }}
      >
        {value}
      </span>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function ErpStatusStation({ telemetry, isLoading }: ErpStatusStationProps) {
  const health = useMemo<ErpHealthDetail | null>(
    () => (telemetry ? deriveErpHealth(telemetry) : null),
    [telemetry]
  )

  const isOnline =
    health !== null &&
    (health.status === 'OPERATIONAL' || health.status === 'DEGRADED')

  // Loading state
  if (isLoading && !telemetry) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Health indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HealthBadge status={health?.status ?? 'UNKNOWN'} size="default" />
          <div className="flex flex-col">
            <span className="font-sans text-[13px] font-semibold tracking-[0.03em] text-[var(--color-text-primary)] uppercase opacity-85">
              {health?.status === 'OPERATIONAL' ? 'Running' : (health?.status ?? 'Unknown')}
            </span>
            {health?.version && (
              <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                v{health.version}
              </span>
            )}
          </div>
        </div>
        {telemetry && telemetry.alertCount > 0 && (
          <AlertIndicator count={telemetry.alertCount} />
        )}
      </div>

      {/* Metrics (when online) */}
      {isOnline && health ? (
        <div className="grid grid-cols-2 gap-4">
          <MetricCell label="Uptime" value={formatUptime(health.uptimeSeconds)} />
          <MetricCell
            label="Modules"
            value={`${health.modules.filter((m) => m.status === 'OPERATIONAL').length}/5`}
          />
          <MetricCell label="Pages" value="52" />
          <MetricCell
            label="Last Check"
            value={formatRelativeTime(telemetry?.lastCheckAt ?? null)}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-white/[0.03] bg-white/[0.02] p-4">
          <p className="font-sans text-[13px] leading-relaxed text-[var(--color-text-secondary)] opacity-75">
            TarvaERP is not currently running. Start the dev server at localhost:3010 to see live
            telemetry.
          </p>
        </div>
      )}

      {/* Response time sparkline */}
      {telemetry && telemetry.responseTimeHistory.length > 0 && (
        <div className="pt-2">
          <span className="mb-1 block font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Response Time History
          </span>
          <TelemetrySparkline data={telemetry.responseTimeHistory} width={240} height={32} />
        </div>
      )}
    </div>
  )
}
