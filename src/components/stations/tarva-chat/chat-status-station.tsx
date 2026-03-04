'use client'

/**
 * ChatStatusStation -- Health dashboard for the Tarva Chat district.
 *
 * Displays:
 * - Dependency connection list (Supabase, Claude API, Ollama) with status dots
 * - MCP server health summary (N/17 healthy with tier breakdown)
 * - Active SSE stream count
 * - Response time sparkline from telemetry aggregator data
 * - Recent errors (if any)
 *
 * Driven by ChatStatusData from the district route handler and
 * AppTelemetry from the WS-1.5 districts store.
 *
 * @module chat-status-station
 * @see WS-2.4 Section 4.6
 */

import { motion } from 'motion/react'
import { Wifi, WifiOff, Server, AlertTriangle, Radio } from 'lucide-react'
import { Badge, Skeleton } from '@tarva/ui'
import { HealthBadge } from '@/components/telemetry/health-badge'
import { TelemetrySparkline } from '@/components/telemetry/telemetry-sparkline'
import { AlertIndicator } from '@/components/telemetry/alert-indicator'
import type { AppTelemetry } from '@/lib/telemetry-types'
import type { ChatStatusData, ChatConnection } from '@/lib/tarva-chat-types'

// ============================================================================
// Types
// ============================================================================

export interface ChatStatusStationProps {
  /** Full telemetry record from WS-1.5 districts store. */
  readonly telemetry: AppTelemetry | null
  /** Tarva Chat status data from useTarvaChatDistrict(). */
  readonly statusData: ChatStatusData | null
  /** Whether data is still loading. */
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

/**
 * Map connection status to CSS custom property for dot color.
 */
function connectionStatusColor(status: ChatConnection['status']): string {
  switch (status) {
    case 'connected':
      return 'var(--color-healthy)'
    case 'degraded':
      return 'var(--color-warning)'
    case 'disconnected':
      return 'var(--color-error)'
    case 'unknown':
    default:
      return 'var(--color-offline)'
  }
}

function connectionStatusLabel(status: ChatConnection['status']): string {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'degraded':
      return 'Degraded'
    case 'disconnected':
      return 'Disconnected'
    case 'unknown':
    default:
      return 'Unknown'
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

function MetricRow({
  label,
  value,
  isLoading: loading,
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
      {loading ? (
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

function ConnectionRow({ connection }: { connection: ChatConnection }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: connectionStatusColor(connection.status) }}
          aria-label={connectionStatusLabel(connection.status)}
        />
        <span className="font-sans text-[12px] text-[var(--color-text-secondary)]">
          {connection.name}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {connection.latencyMs !== null && (
          <span
            className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums"
            style={{ fontFeatureSettings: '"tnum" 1' }}
          >
            {connection.latencyMs}ms
          </span>
        )}
        <span className="font-mono text-[10px] text-[var(--color-text-ghost)]">
          {connection.endpoint}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function ChatStatusStation({ telemetry, statusData, isLoading }: ChatStatusStationProps) {
  const isOffline = !telemetry || telemetry.status === 'OFFLINE' || telemetry.status === 'UNKNOWN'

  // Default connections for offline display.
  const connections: ChatConnection[] = statusData?.connections
    ? [...statusData.connections]
    : [
        { id: 'supabase', name: 'Supabase', status: 'unknown', latencyMs: null, endpoint: 'localhost:54331' },
        { id: 'claude-api', name: 'Claude API', status: 'unknown', latencyMs: null, endpoint: 'api.anthropic.com' },
        { id: 'ollama', name: 'Ollama', status: 'unknown', latencyMs: null, endpoint: 'localhost:11434' },
      ]

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

      {/* Connections Section */}
      <motion.div
        className="pt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="mb-2 flex items-center gap-2">
          {isOffline ? (
            <WifiOff className="h-3 w-3 text-[var(--color-text-ghost)]" />
          ) : (
            <Wifi className="h-3 w-3 text-[var(--color-text-tertiary)]" />
          )}
          <span className="font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Dependencies
          </span>
        </div>
        <div className="flex flex-col">
          {connections.map((conn) => (
            <ConnectionRow key={conn.id} connection={conn} />
          ))}
        </div>
      </motion.div>

      {/* MCP Health Section */}
      {statusData?.mcpHealth && (
        <motion.div
          className="pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <Server className="h-3 w-3 text-[var(--color-text-tertiary)]" />
            <span className="font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
              MCP Servers
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="font-sans text-[12px] text-[var(--color-text-secondary)]">
              Health
            </span>
            <span
              className="font-mono text-[13px] font-medium tabular-nums"
              style={{
                fontFeatureSettings: '"tnum" 1',
                color:
                  statusData.mcpHealth.healthy === statusData.mcpHealth.total
                    ? 'var(--color-healthy)'
                    : 'var(--color-warning)',
              }}
            >
              {statusData.mcpHealth.healthy}/{statusData.mcpHealth.total} healthy
            </span>
          </div>
          <div className="flex gap-4 py-1">
            {(['singleton', 'pooled', 'ephemeral'] as const).map((tier) => (
              <div key={tier} className="flex flex-col">
                <span className="font-sans text-[9px] tracking-[0.06em] text-[var(--color-text-ghost)] uppercase">
                  {tier}
                </span>
                <span
                  className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums"
                  style={{ fontFeatureSettings: '"tnum" 1' }}
                >
                  {statusData.mcpHealth.tiers[tier].healthy}/{statusData.mcpHealth.tiers[tier].total}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active SSE Streams */}
      {statusData && statusData.activeSseStreams > 0 && (
        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            <Radio className="h-3 w-3 text-[var(--color-teal)]" />
            <span className="font-sans text-[11px] text-[var(--color-text-tertiary)]">
              Active SSE Streams
            </span>
          </div>
          <span
            className="font-mono text-[13px] font-medium text-[var(--color-teal)] tabular-nums"
            style={{ fontFeatureSettings: '"tnum" 1' }}
          >
            {statusData.activeSseStreams}
          </span>
        </div>
      )}

      {/* Response Time Sparkline */}
      {!isOffline && telemetry && telemetry.responseTimeHistory.length > 0 && (
        <div className="pt-2">
          <span className="mb-1 block font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Response Time History
          </span>
          <TelemetrySparkline data={telemetry.responseTimeHistory} width={240} height={32} />
        </div>
      )}

      {/* Recent Errors */}
      {statusData && statusData.recentErrors.length > 0 && (
        <motion.div
          className="pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-[var(--color-error)]" />
            <span className="font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
              Recent Errors
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {statusData.recentErrors.map((err, i) => (
              <div
                key={`${err.timestamp}-${i}`}
                className="rounded-md border border-white/[0.04] bg-white/[0.01] px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant={err.severity === 'critical' ? 'destructive' : 'outline'}
                    className="text-[9px]"
                  >
                    {err.severity.toUpperCase()}
                  </Badge>
                  <span className="font-mono text-[10px] text-[var(--color-text-ghost)]">
                    {err.source}
                  </span>
                </div>
                <p className="mt-1 truncate font-sans text-[11px] text-[var(--color-text-tertiary)]">
                  {err.message}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
