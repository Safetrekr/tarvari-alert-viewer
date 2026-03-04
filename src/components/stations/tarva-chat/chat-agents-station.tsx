'use client'

/**
 * ChatAgentsStation -- Agent roster and usage statistics for the Tarva Chat
 * district. Shows loaded agent count, top agents by conversation count,
 * and skill activation metrics.
 *
 * Handles loading, offline, and empty states gracefully.
 *
 * @module chat-agents-station
 * @see WS-2.4 Section 4.8
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { Bot, Users, Zap, XCircle } from 'lucide-react'
import { ScrollArea, Skeleton } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import type { ChatAgentsData, ChatAgent } from '@/lib/tarva-chat-types'

// ============================================================================
// Constants
// ============================================================================

const TARVA_CHAT_URL = 'http://localhost:4000'

// ============================================================================
// Types
// ============================================================================

export interface ChatAgentsStationProps {
  /** Agents data from useTarvaChatDistrict(). */
  readonly agentsData: ChatAgentsData | null
  /** Whether data is loading. */
  readonly isLoading: boolean
  /** Whether Tarva Chat is reachable. */
  readonly isReachable: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then

  if (diffMs < 60_000) return 'Just now'
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`
  return `${Math.floor(diffMs / 86_400_000)}d ago`
}

/**
 * Shorten a model identifier for display.
 * 'claude-sonnet-4-20250514' -> 'claude-sonnet-4'
 * 'ollama:llama3.2' -> 'ollama:llama3.2'
 */
function shortenModel(model: string): string {
  return model.replace(/-\d{8}$/, '')
}

// ============================================================================
// Sub-Components
// ============================================================================

function ChatAgentListItem({ agent }: { agent: ChatAgent }) {
  return (
    <div className="flex items-center justify-between rounded border-b border-white/[0.03] px-2 py-2.5 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.02]">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-sans text-[13px] leading-tight font-medium text-[var(--color-text-primary)]">
          {agent.name}
        </span>
        <span className="font-mono text-[11px] text-[var(--color-text-ghost)] uppercase">
          {shortenModel(agent.model)}
        </span>
      </div>
      <div className="ml-3 flex shrink-0 flex-col items-end gap-0.5">
        <span
          className="font-mono text-[13px] font-medium text-[var(--color-teal)] tabular-nums"
          style={{ fontFeatureSettings: '"tnum" 1' }}
          title={`${agent.conversationCount} conversations`}
        >
          {agent.conversationCount} convos
        </span>
        <span
          className="font-mono text-[10px] text-[var(--color-text-ghost)] tabular-nums"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {agent.lastUsedAt ? formatRelativeTime(agent.lastUsedAt) : 'Never'}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function ChatAgentsStation({
  agentsData,
  isLoading,
  isReachable,
}: ChatAgentsStationProps) {
  const { stampReceipt } = useStationContext()

  const handleBrowseAgents = useCallback(() => {
    window.open(TARVA_CHAT_URL, '_blank', 'noopener,noreferrer')
    stampReceipt(
      'browse-agents',
      `Opened Tarva Chat agent picker (${agentsData?.loadedCount ?? 0} agents)`
    )
  }, [stampReceipt, agentsData?.loadedCount])

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
        <XCircle className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          Tarva Chat is offline
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Agent data unavailable
        </span>
      </div>
    )
  }

  // --- Empty State ---
  if (!agentsData || agentsData.topAgents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Bot className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          No agents loaded
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Agents load from ~/.claude/agents/ at startup
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
            Loaded
          </span>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-[var(--color-text-tertiary)]" />
            <MetricCounter value={agentsData.loadedCount} />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Skills
          </span>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-[var(--color-teal)]" />
            <MetricCounter value={agentsData.skillActivationCount} />
          </div>
        </div>
      </motion.div>

      {/* Agent List */}
      <ScrollArea className="max-h-[240px]">
        {agentsData.topAgents.map((agent, index) => (
          <motion.div
            key={agent.slug}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
          >
            <ChatAgentListItem agent={agent} />
          </motion.div>
        ))}
      </ScrollArea>
    </div>
  )
}
