'use client'

/**
 * PipelineStation -- Table of recent generation runs across all Agent Builder
 * projects. Renders inside a StationPanel with bodyType 'table'.
 *
 * Displays: summary metrics (active, queued, projects), a scrollable table
 * of recent runs with columns for Project, Status, Progress (7-segment bar),
 * Started (relative time), and Duration.
 *
 * Handles loading, offline, and empty states gracefully.
 *
 * @module pipeline-station
 * @see WS-2.2 Section 4.8
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { Play, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { Badge, ScrollArea, Skeleton } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { PipelinePhaseBar } from './pipeline-phase-bar'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import type { PipelineRun, AgentBuilderRunStatus } from '@/lib/agent-builder-types'

// ============================================================================
// Types
// ============================================================================

export interface PipelineStationProps {
  /** Recent runs to display. Sorted by startedAt descending. */
  readonly runs: readonly PipelineRun[]
  /** Count of currently active runs. */
  readonly activeRunCount: number
  /** Count of queued runs. */
  readonly queuedRunCount: number
  /** Total project count. */
  readonly projectCount: number
  /** Whether data is loading. */
  readonly isLoading: boolean
  /** Whether the Agent Builder is reachable. */
  readonly isReachable: boolean
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_CONFIG: Record<
  AgentBuilderRunStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Play }
> = {
  queued: { label: 'Queued', variant: 'outline', icon: Clock },
  running: { label: 'Running', variant: 'default', icon: Loader2 },
  completed: { label: 'Completed', variant: 'secondary', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: XCircle },
  waiting_approval: { label: 'Awaiting Approval', variant: 'default', icon: AlertTriangle },
  partial: { label: 'Partial', variant: 'outline', icon: AlertTriangle },
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return '--'
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '--'
  const endTime = end ? new Date(end).getTime() : Date.now()
  const diff = endTime - new Date(start).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ${secs % 60}s`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// ============================================================================
// Component
// ============================================================================

export function PipelineStation({
  runs,
  activeRunCount,
  queuedRunCount,
  projectCount,
  isLoading,
  isReachable,
}: PipelineStationProps) {
  const { stampReceipt } = useStationContext()

  const handleViewRun = useCallback(
    (run: PipelineRun) => {
      window.open(
        `http://localhost:3000/projects/${run.projectSlug}`,
        '_blank',
        'noopener,noreferrer'
      )
      stampReceipt('view-run', `Opened run ${run.id.slice(0, 8)} for ${run.projectName}`)
    },
    [stampReceipt]
  )

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  // --- Offline State ---
  if (!isReachable) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <XCircle className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          Agent Builder unreachable
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Pipeline data unavailable
        </span>
      </div>
    )
  }

  // --- Empty State ---
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Play className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          No generation runs
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Create a project in Agent Builder to get started
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Metrics */}
      <div className="flex items-center gap-6 border-b border-white/[0.04] pb-3">
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Active
          </span>
          <MetricCounter value={activeRunCount} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Queued
          </span>
          <MetricCounter value={queuedRunCount} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Projects
          </span>
          <MetricCounter value={projectCount} />
        </div>
      </div>

      {/* Runs Table */}
      <ScrollArea className="max-h-[280px]">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_100px_1fr_80px_60px] gap-2 border-b border-white/[0.04] px-2 py-1.5">
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Project
          </span>
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Status
          </span>
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Progress
          </span>
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Started
          </span>
          <span className="text-right font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Time
          </span>
        </div>

        {/* Table Rows */}
        {runs.map((run, index) => {
          const config = STATUS_CONFIG[run.status]
          const StatusIcon = config.icon

          return (
            <motion.button
              key={run.id}
              className="grid w-full cursor-pointer grid-cols-[1fr_100px_1fr_80px_60px] gap-2 rounded-lg px-2 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember-bright)]"
              onClick={() => handleViewRun(run)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              aria-label={`Run ${run.id.slice(0, 8)} for ${run.projectName}: ${config.label}`}
            >
              {/* Project Name */}
              <span className="truncate font-sans text-[13px] leading-tight text-[var(--color-text-primary)]">
                {run.projectName}
              </span>

              {/* Status Badge */}
              <div className="flex items-center">
                <Badge variant={config.variant} className="gap-1 text-[10px]">
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>

              {/* Phase Progress Bar */}
              <div className="flex items-center">
                <PipelinePhaseBar
                  currentPhaseIndex={run.currentPhaseIndex}
                  completedPhaseCount={run.completedPhaseCount}
                  status={run.status}
                />
              </div>

              {/* Started Time */}
              <span
                className="font-mono text-[11px] leading-tight text-[var(--color-text-tertiary)] tabular-nums"
                style={{ fontFeatureSettings: '"tnum" 1' }}
              >
                {formatRelativeTime(run.startedAt)}
              </span>

              {/* Duration */}
              <span
                className="text-right font-mono text-[11px] leading-tight text-[var(--color-text-tertiary)] tabular-nums"
                style={{ fontFeatureSettings: '"tnum" 1' }}
              >
                {formatDuration(run.startedAt, run.completedAt)}
              </span>
            </motion.button>
          )
        })}
      </ScrollArea>
    </div>
  )
}
