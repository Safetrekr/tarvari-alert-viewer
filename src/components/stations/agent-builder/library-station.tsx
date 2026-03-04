'use client'

/**
 * LibraryStation -- Installed agents list with summary statistics for the
 * Agent Builder district.
 *
 * Displays: summary metrics (total agents, Tarva agents, total skills)
 * and a scrollable list of installed agents. Each agent shows name,
 * description, Tarva badge (if applicable), skill count, and relative
 * modification date.
 *
 * Handles loading, offline, and empty states gracefully.
 *
 * @module library-station
 * @see WS-2.2 Section 4.10
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { BookOpen, Users, Wrench } from 'lucide-react'
import { ScrollArea, Skeleton } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import { AgentListItem } from './agent-list-item'
import type { InstalledAgentSummary, LibrarySummary } from '@/lib/agent-builder-types'

// ============================================================================
// Types
// ============================================================================

export interface LibraryStationProps {
  /** Installed agents to display. */
  readonly agents: readonly InstalledAgentSummary[]
  /** Aggregate summary statistics. */
  readonly summary: LibrarySummary
  /** Whether data is loading. */
  readonly isLoading: boolean
  /** Whether the Agent Builder is reachable. */
  readonly isReachable: boolean
}

// ============================================================================
// Component
// ============================================================================

export function LibraryStation({ agents, summary, isLoading, isReachable }: LibraryStationProps) {
  const { stampReceipt } = useStationContext()

  const handleBrowseLibrary = useCallback(() => {
    window.open('http://localhost:3000', '_blank', 'noopener,noreferrer')
    stampReceipt('browse-library', `Opened Agent Builder library (${summary.totalAgents} agents)`)
  }, [stampReceipt, summary.totalAgents])

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-4">
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-12 w-20" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  // --- Offline State ---
  if (!isReachable) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BookOpen className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          Agent Builder unreachable
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Library data unavailable
        </span>
      </div>
    )
  }

  // --- Empty State ---
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          No agents installed
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Build your first agent in the Agent Builder
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Metrics */}
      <motion.div
        className="flex items-center gap-6 border-b border-white/[0.04] pb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Agents
          </span>
          <MetricCounter value={summary.totalAgents} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Tarva
          </span>
          <MetricCounter value={summary.tarvaAgents} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Skills
          </span>
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3 text-[var(--color-teal)]" />
            <MetricCounter value={summary.totalSkills} />
          </div>
        </div>
      </motion.div>

      {/* Agent List */}
      <ScrollArea className="max-h-[240px]">
        {agents.map((agent, index) => (
          <motion.div
            key={agent.fileName}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
          >
            <AgentListItem agent={agent} />
          </motion.div>
        ))}
      </ScrollArea>
    </div>
  )
}
