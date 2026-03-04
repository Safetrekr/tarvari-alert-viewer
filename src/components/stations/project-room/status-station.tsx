'use client'

/**
 * StatusStation -- Operational health dashboard for the Project Room district.
 *
 * Displays: overall health badge, dependency connections with per-dependency
 * status dots and latency, performance metrics (queue depth, active workers,
 * error rate, active runs), response time sparkline, and recent errors.
 *
 * Consumes both the WS-1.5 telemetry data (for overall health, sparkline)
 * and the WS-2.3 district data (for dependency detail, metrics, errors).
 *
 * Per AD-8 and IA Assessment Section 3:
 * - Header: Project Room > Status
 * - Body: Dependency connections, performance metrics, recent errors
 * - Actions: "Refresh" (re-check)
 *
 * @module status-station
 * @see WS-2.3 Section 4.5
 */

import { HealthBadge } from '@/components/telemetry/health-badge'
import { TelemetrySparkline } from '@/components/telemetry/telemetry-sparkline'
import { AlertIndicator } from '@/components/telemetry/alert-indicator'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import { ScrollArea, Skeleton } from '@tarva/ui'
import type { AppTelemetry, AppStatus } from '@/lib/telemetry-types'
import type { ProjectRoomSnapshot, ProjectRoomDependency } from '@/lib/project-room-types'

// ============================================================================
// Types
// ============================================================================

export interface StatusStationProps {
  /** Full telemetry record from WS-1.5 districts store. */
  readonly telemetry: AppTelemetry | null
  /** Project Room district snapshot for dependency/metric detail. */
  readonly snapshot: ProjectRoomSnapshot | null
  /** Whether telemetry data is still loading. */
  readonly isLoading: boolean
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Map Project Room dependency status to Launch AppStatus for HealthBadge.
 */
function depStatusToAppStatus(status: ProjectRoomDependency['status']): AppStatus {
  switch (status) {
    case 'ok':
      return 'OPERATIONAL'
    case 'degraded':
      return 'DEGRADED'
    case 'error':
    case 'unreachable':
      return 'DOWN'
    default:
      return 'UNKNOWN'
  }
}

function formatTimestamp(iso: string): string {
  if (!iso) return '--'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
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

// ============================================================================
// Component
// ============================================================================

export function StatusStation({ telemetry, snapshot, isLoading }: StatusStationProps) {
  const isOffline = !telemetry || telemetry.status === 'OFFLINE' || telemetry.status === 'UNKNOWN'

  return (
    <ScrollArea className="max-h-[320px]">
      <div className="flex flex-col gap-5">
        {/* Overall health */}
        <div className="flex items-center justify-between">
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
            style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
          >
            Overall Health
          </span>
          <div className="flex items-center gap-2">
            <HealthBadge status={telemetry?.status ?? 'UNKNOWN'} size="default" />
            {telemetry && telemetry.alertCount > 0 && (
              <AlertIndicator count={telemetry.alertCount} />
            )}
          </div>
        </div>

        {/* Response time with sparkline */}
        {!isOffline && telemetry && (
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
              style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
            >
              Response Time
            </span>
            <div className="flex items-center gap-2">
              <MetricRow
                label=""
                value={formatResponseTime(telemetry.responseTimeMs)}
                isLoading={isLoading}
              />
              {telemetry.responseTimeHistory.length > 0 && (
                <TelemetrySparkline
                  data={telemetry.responseTimeHistory}
                  width={80}
                  height={24}
                />
              )}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {snapshot?.dependencies && snapshot.dependencies.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
              style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
            >
              Dependencies
            </span>
            {snapshot.dependencies.map((dep) => (
              <div key={dep.name} className="flex items-center justify-between py-1">
                <span
                  className="font-sans text-[13px] font-normal"
                  style={{ color: 'var(--color-text-primary)', opacity: 0.75 }}
                >
                  {dep.name}
                </span>
                <div className="flex items-center gap-2">
                  {dep.latencyMs !== null && (
                    <span
                      className="font-mono text-[11px] font-normal tabular-nums"
                      style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}
                    >
                      {dep.latencyMs}ms
                    </span>
                  )}
                  <HealthBadge status={depStatusToAppStatus(dep.status)} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Performance metrics */}
        {snapshot?.metrics && (
          <div className="grid grid-cols-2 gap-3">
            <MetricCounter value={snapshot.metrics.queueDepth} label="Queue Depth" />
            <MetricCounter value={snapshot.metrics.activeWorkers} label="Active Workers" />
            <MetricCounter
              value={snapshot.metrics.errorRatePercent}
              unit="%"
              precision={1}
              label="Error Rate"
            />
            <MetricCounter value={snapshot.metrics.activeExecutions} label="Active Runs" />
          </div>
        )}

        {/* Recent errors */}
        {snapshot?.recentErrors && snapshot.recentErrors.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
              style={{ color: 'var(--color-error)', opacity: 0.7 }}
            >
              Recent Errors
            </span>
            {snapshot.recentErrors.map((err, idx) => (
              <div
                key={`${err.timestamp}-${idx}`}
                className="rounded-md px-2.5 py-2"
                style={{
                  background: 'var(--color-error-dim)',
                  border: '1px solid rgba(239, 68, 68, 0.12)',
                }}
              >
                <p
                  className="font-sans text-[12px] leading-[1.4] font-normal"
                  style={{ color: 'var(--color-text-primary)', opacity: 0.8 }}
                >
                  {err.message}
                </p>
                <p
                  className="mt-0.5 font-mono text-[10px] tabular-nums"
                  style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }}
                >
                  {err.source} -- {formatTimestamp(err.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
