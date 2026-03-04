'use client'

/**
 * RunsStation -- Active executions and recent completions for the
 * Project Room district.
 *
 * Displays: queue depth indicator, active runs with progress bars and
 * current phase, recent completions with status badges and duration.
 *
 * Actions: "View" (opens run in Project Room), "Cancel" (opens run in
 * Project Room for cancellation -- the Launch is read-only).
 *
 * Maps to the Launch spine "Activity" supertype (Gap 2):
 * - activity_type: 'agent_execution'
 * - Project Room uses "run" / "execution" terminology
 * - Launch normalizes to Activity at Z0/Z1; uses "execution" at Z2/Z3
 *
 * Handles loading, offline, and empty states gracefully.
 *
 * @module runs-station
 * @see WS-2.3 Section 4.6
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { ExternalLink, XCircle, Clock, Zap } from 'lucide-react'
import {
  Badge,
  Button,
  ScrollArea,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import type { ProjectRoomRun, ProjectRoomSnapshot } from '@/lib/project-room-types'

// ============================================================================
// Types
// ============================================================================

export interface RunsStationProps {
  /** Full snapshot from the district data hook. */
  readonly snapshot: ProjectRoomSnapshot | null
  /** Pre-filtered active + pending runs. */
  readonly activeRuns: readonly ProjectRoomRun[]
  /** Whether data is loading. */
  readonly isLoading: boolean
  /** Whether the Project Room is reachable. */
  readonly isAvailable: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function statusToBadgeVariant(
  status: ProjectRoomRun['status']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default'
    case 'completed':
      return 'secondary'
    case 'failed':
      return 'destructive'
    case 'pending':
    case 'cancelled':
      return 'outline'
  }
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '--'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return `${m}m ${s}s`
}

function formatCost(cost: number | null): string {
  if (cost === null) return '--'
  if (cost < 0.01) return '<$0.01'
  return `$${cost.toFixed(2)}`
}

// ============================================================================
// Sub-Components
// ============================================================================

interface RunRowProps {
  readonly run: ProjectRoomRun
  readonly onView: () => void
  readonly onCancel?: () => void
  readonly showProgress?: boolean
  readonly index: number
}

function RunRow({ run, onView, onCancel, showProgress, index }: RunRowProps) {
  return (
    <motion.div
      className="flex flex-col gap-1.5 rounded-md px-2.5 py-2 transition-colors duration-150"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
      }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      {/* Top line: project + status */}
      <div className="flex items-center justify-between">
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="max-w-[160px] truncate font-sans text-[13px] font-medium"
              style={{ color: 'var(--color-text-primary)', opacity: 0.85 }}
            >
              {run.projectName}
            </span>
          </TooltipTrigger>
          <TooltipContent>Agent: {run.agentName}</TooltipContent>
        </Tooltip>
        <Badge variant={statusToBadgeVariant(run.status)}>{run.status}</Badge>
      </div>

      {/* Progress bar for active runs */}
      {showProgress && run.progress !== null && (
        <div className="flex items-center gap-2">
          <div
            className="h-1 flex-1 overflow-hidden rounded-full"
            style={{ background: 'rgba(255, 255, 255, 0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(run.progress, 100)}%`,
                background: 'var(--color-ember)',
              }}
            />
          </div>
          <span
            className="font-mono text-[10px] font-medium tabular-nums"
            style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}
          >
            {run.progress}%
          </span>
        </div>
      )}

      {/* Current phase for active runs */}
      {showProgress && run.currentPhase && (
        <span
          className="font-sans text-[11px] font-normal"
          style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }}
        >
          {run.currentPhase}
        </span>
      )}

      {/* Bottom line: duration + cost + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-[11px] font-normal tabular-nums"
            style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}
          >
            {formatDuration(run.durationMs)}
          </span>
          {run.estimatedCost !== null && (
            <span
              className="font-mono text-[11px] font-normal tabular-nums"
              style={{ color: 'var(--color-teal)', opacity: 0.6 }}
            >
              {formatCost(run.estimatedCost)}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onView}
            className="rounded px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-[0.04em] uppercase transition-colors duration-150 hover:bg-white/[0.04]"
            style={{ color: 'var(--color-ember-bright)', opacity: 0.7 }}
            aria-label={`View run for ${run.projectName}`}
          >
            View
          </button>
          {onCancel && run.status === 'active' && (
            <button
              onClick={onCancel}
              className="rounded px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-[0.04em] uppercase transition-colors duration-150 hover:bg-white/[0.04]"
              style={{ color: 'var(--color-error)', opacity: 0.6 }}
              aria-label={`Cancel run for ${run.projectName}`}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function RunsStation({ snapshot, activeRuns, isLoading, isAvailable }: RunsStationProps) {
  const { stampReceipt } = useStationContext()

  const handleViewRun = useCallback(
    (run: ProjectRoomRun) => {
      window.open(`http://localhost:3005/runs/${run.id}`, '_blank', 'noopener,noreferrer')
      stampReceipt(
        'view-run',
        `Opened run "${run.projectName}" (${run.agentName}) in Project Room`
      )
    },
    [stampReceipt]
  )

  const handleCancelRun = useCallback(
    (run: ProjectRoomRun) => {
      // Opens the run in Project Room for cancellation.
      // The Launch does not call cancellation APIs directly (read-only).
      window.open(`http://localhost:3005/runs/${run.id}`, '_blank', 'noopener,noreferrer')
      stampReceipt(
        'cancel-run',
        `Cancel requested for run "${run.projectName}" -- opening Project Room`
      )
    },
    [stampReceipt]
  )

  const handleViewAllRuns = useCallback(() => {
    window.open('http://localhost:3005/runs', '_blank', 'noopener,noreferrer')
    stampReceipt('view-all-runs', 'Opened Project Room runs list')
  }, [stampReceipt])

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  // --- Offline State ---
  if (!isAvailable) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <XCircle className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          Project Room unreachable
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Run data unavailable
        </span>
      </div>
    )
  }

  const runs = snapshot?.runs ?? []
  const completedRuns = runs.filter(
    (r) => r.status === 'completed' || r.status === 'failed' || r.status === 'cancelled'
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Queue depth indicator */}
      {snapshot?.metrics && snapshot.metrics.queueDepth > 0 && (
        <div
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
          style={{
            background: 'var(--color-teal-dim)',
            border: '1px solid rgba(var(--teal-rgb), 0.15)',
          }}
        >
          <Clock className="h-3.5 w-3.5" style={{ color: 'var(--color-teal-bright)' }} />
          <span
            className="font-mono text-[12px] font-medium tabular-nums"
            style={{ color: 'var(--color-teal-bright)' }}
          >
            {snapshot.metrics.queueDepth} items queued
          </span>
        </div>
      )}

      <ScrollArea className="max-h-[320px]">
        <div className="flex flex-col gap-4">
          {/* Active runs */}
          {activeRuns.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
              >
                Active ({activeRuns.length})
              </span>
              {activeRuns.map((run, index) => (
                <RunRow
                  key={run.id}
                  run={run}
                  onView={() => handleViewRun(run)}
                  onCancel={() => handleCancelRun(run)}
                  showProgress
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Empty state for active runs */}
          {activeRuns.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Zap
                className="h-5 w-5"
                style={{ color: 'var(--color-text-ghost)', opacity: 0.4 }}
              />
              <span
                className="font-sans text-[12px] font-normal"
                style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
              >
                No active executions
              </span>
            </div>
          )}

          {/* Recent completions */}
          {completedRuns.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
              >
                Recent ({completedRuns.length})
              </span>
              {completedRuns.slice(0, 5).map((run, index) => (
                <RunRow
                  key={run.id}
                  run={run}
                  onView={() => handleViewRun(run)}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer action */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleViewAllRuns}>
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          All Runs
        </Button>
      </div>
    </div>
  )
}
