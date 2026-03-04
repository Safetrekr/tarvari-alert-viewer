'use client'

/**
 * CoreStatusStation -- TCP health check display for the TarvaCORE district.
 *
 * TarvaCORE is an Electron desktop app with no HTTP API. Health is determined
 * via TCP port check on port 11435 by the WS-1.5 telemetry aggregator.
 *
 * Derives TarvaCORE-specific CoreConnectionInfo from the generic AppTelemetry
 * and renders connection state, uptime, and contextual guidance for each
 * health state (OPERATIONAL, DEGRADED, DOWN, OFFLINE, UNKNOWN).
 *
 * This component renders station body content. The parent district wraps it
 * in a StationPanel for the 3-zone layout (header/body/actions).
 *
 * @module core-status-station
 * @see WS-2.5 Section 4.4
 */

import { useMemo } from 'react'
import { HealthBadge } from '@/components/telemetry/health-badge'
import { AlertIndicator } from '@/components/telemetry/alert-indicator'
import { Skeleton } from '@tarva/ui'
import type { AppTelemetry } from '@/lib/telemetry-types'
import type { CoreConnectionInfo } from '@/lib/tarva-core-types'

// ============================================================================
// Constants
// ============================================================================

const TARVA_CORE_PORT = 11435

// ============================================================================
// Types
// ============================================================================

export interface CoreStatusStationProps {
  /** Telemetry data from the TCP port check. */
  readonly telemetry: AppTelemetry | null
  /** Whether telemetry data is still loading. */
  readonly isLoading: boolean
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Derive TarvaCORE-specific connection info from generic AppTelemetry.
 * The telemetry aggregator provides TCP check results in the same
 * AppTelemetry shape as HTTP checks, but with no version or checks fields.
 */
function deriveConnectionInfo(telemetry: AppTelemetry): CoreConnectionInfo {
  return {
    status: telemetry.status,
    lastSuccessfulContact: telemetry.lastSuccessfulContact,
    uptimeSeconds: telemetry.uptime,
    port: TARVA_CORE_PORT,
    hasEverConnected: telemetry.hasBeenContacted,
  }
}

/** Status labels for the connection indicator. */
const STATUS_LABELS: Record<string, string> = {
  OPERATIONAL: 'Connected',
  DEGRADED: 'Degraded',
  DOWN: 'Connection Lost',
  OFFLINE: 'Offline',
  UNKNOWN: 'No Contact',
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

export function CoreStatusStation({ telemetry, isLoading }: CoreStatusStationProps) {
  const connection = useMemo<CoreConnectionInfo | null>(
    () => (telemetry ? deriveConnectionInfo(telemetry) : null),
    [telemetry]
  )

  const isConnected =
    connection !== null &&
    (connection.status === 'OPERATIONAL' || connection.status === 'DEGRADED')

  const isOfflineState =
    !connection || connection.status === 'OFFLINE' || connection.status === 'UNKNOWN'

  const statusLabel = connection
    ? (STATUS_LABELS[connection.status] ?? connection.status)
    : 'Unknown'

  const offlineMessage = connection?.hasEverConnected === false
    ? 'Launch TarvaCORE to connect. The telemetry aggregator will detect it on port 11435.'
    : 'TarvaCORE is not currently running. Start the desktop application to see live telemetry.'

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
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Connection indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HealthBadge status={connection?.status ?? 'UNKNOWN'} size="default" />
          <div className="flex flex-col">
            <span className="font-sans text-[13px] font-semibold tracking-[0.03em] text-[var(--color-text-primary)] uppercase opacity-85">
              {statusLabel}
            </span>
            <span className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
              TCP :{TARVA_CORE_PORT}
            </span>
          </div>
        </div>
        {telemetry && telemetry.alertCount > 0 && (
          <AlertIndicator count={telemetry.alertCount} />
        )}
      </div>

      {/* Metrics grid (only when OPERATIONAL or DEGRADED) */}
      {isConnected && connection && (
        <div className="grid grid-cols-2 gap-4">
          <MetricCell label="Uptime" value={formatUptime(connection.uptimeSeconds)} />
          <MetricCell label="Last Check" value={formatRelativeTime(telemetry?.lastCheckAt ?? null)} />
        </div>
      )}

      {/* Offline guidance (when OFFLINE or UNKNOWN) */}
      {isOfflineState && connection?.status !== 'DOWN' && (
        <div className="rounded-lg border border-white/[0.03] bg-white/[0.02] p-4">
          <p className="font-sans text-[13px] leading-relaxed text-[var(--color-text-secondary)] opacity-75">
            {offlineMessage}
          </p>
        </div>
      )}

      {/* Down alert (when DOWN -- previously connected but now unresponsive) */}
      {connection?.status === 'DOWN' && (
        <div className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-4">
          <p className="font-sans text-[13px] leading-relaxed text-[var(--color-error)] opacity-85">
            Connection lost.{' '}
            {connection.lastSuccessfulContact
              ? `Last seen ${formatRelativeTime(connection.lastSuccessfulContact)}.`
              : 'No previous connection recorded.'}
            {' '}TarvaCORE was previously running but is no longer responding on port {TARVA_CORE_PORT}.
          </p>
        </div>
      )}
    </div>
  )
}
