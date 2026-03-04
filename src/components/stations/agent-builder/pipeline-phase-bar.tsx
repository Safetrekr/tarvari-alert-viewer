'use client'

/**
 * PipelinePhaseBar -- 7-segment horizontal progress indicator for the
 * Agent Builder's generation pipeline phases.
 *
 * Each segment is colored based on completion status:
 * - completed: green (--color-healthy)
 * - active: ember with pulse animation (--color-ember-bright)
 * - pending: dim gray (white/6%)
 * - failed: red (--color-error)
 *
 * @module pipeline-phase-bar
 * @see WS-2.2 Section 4.7
 */

import { Tooltip, TooltipContent, TooltipTrigger } from '@tarva/ui'
import {
  PIPELINE_PHASES,
  type PipelinePhase,
  type AgentBuilderRunStatus,
} from '@/lib/agent-builder-types'

// ============================================================================
// Types
// ============================================================================

export interface PipelinePhaseBarProps {
  /** Index of the current phase (0-6, or -1 if not started). */
  readonly currentPhaseIndex: number
  /** Number of completed phases (0-7). */
  readonly completedPhaseCount: number
  /** Overall run status. */
  readonly status: AgentBuilderRunStatus
}

// ============================================================================
// Helpers
// ============================================================================

type SegmentState = 'completed' | 'active' | 'pending' | 'failed'

function getSegmentState(
  segmentIndex: number,
  currentPhaseIndex: number,
  completedPhaseCount: number,
  status: AgentBuilderRunStatus
): SegmentState {
  if (status === 'failed' && segmentIndex === currentPhaseIndex) return 'failed'
  if (segmentIndex < completedPhaseCount) return 'completed'
  if (segmentIndex === currentPhaseIndex && (status === 'running' || status === 'waiting_approval'))
    return 'active'
  return 'pending'
}

const SEGMENT_COLORS: Record<SegmentState, string> = {
  completed: 'bg-[var(--color-healthy)]',
  active: 'bg-[var(--color-ember-bright)] animate-pulse',
  pending: 'bg-white/[0.06]',
  failed: 'bg-[var(--color-error)]',
}

/** Short phase labels for tooltips. */
const PHASE_SHORT_LABELS: Record<PipelinePhase, string> = {
  PLAN: 'Plan',
  EXECUTE: 'Execute',
  ASSEMBLE: 'Assemble',
  ENRICH: 'Enrich',
  EVAL_GATE: 'Eval Gate',
  FINALIZE: 'Finalize',
  PUBLISH: 'Publish',
}

// ============================================================================
// Component
// ============================================================================

export function PipelinePhaseBar({
  currentPhaseIndex,
  completedPhaseCount,
  status,
}: PipelinePhaseBarProps) {
  return (
    <div
      className="flex w-full items-center gap-0.5"
      role="progressbar"
      aria-valuenow={completedPhaseCount}
      aria-valuemin={0}
      aria-valuemax={7}
      aria-label={`Pipeline progress: ${completedPhaseCount} of 7 phases completed`}
    >
      {PIPELINE_PHASES.map((phase, index) => {
        const segmentState = getSegmentState(index, currentPhaseIndex, completedPhaseCount, status)

        return (
          <Tooltip key={phase}>
            <TooltipTrigger asChild>
              <div
                className={`h-1.5 flex-1 rounded-full ${SEGMENT_COLORS[segmentState]} transition-colors duration-300`}
                data-phase={phase}
                data-state={segmentState}
              />
            </TooltipTrigger>
            <TooltipContent>{`${PHASE_SHORT_LABELS[phase]}: ${segmentState}`}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
