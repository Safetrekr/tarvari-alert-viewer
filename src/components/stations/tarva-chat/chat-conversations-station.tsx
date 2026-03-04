'use client'

/**
 * ChatConversationsStation -- Recent conversations table for the Tarva Chat
 * district. Renders inside a StationPanel with bodyType 'table'.
 *
 * Displays: active conversation count badge, a scrollable table of
 * recent conversations with columns for Title, Agent, Messages, and
 * Last Active, plus a message throughput sparkline.
 *
 * Handles loading, offline, and empty states gracefully.
 *
 * @module chat-conversations-station
 * @see WS-2.4 Section 4.7
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { MessageSquare, XCircle, Plus } from 'lucide-react'
import { Badge, ScrollArea, Skeleton } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { TelemetrySparkline } from '@/components/telemetry/telemetry-sparkline'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import type { ChatConversationsData, ChatConversation } from '@/lib/tarva-chat-types'

// ============================================================================
// Constants
// ============================================================================

const TARVA_CHAT_URL = 'http://localhost:4000'

// ============================================================================
// Types
// ============================================================================

export interface ChatConversationsStationProps {
  /** Conversations data from useTarvaChatDistrict(). */
  readonly conversationsData: ChatConversationsData | null
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

// ============================================================================
// Component
// ============================================================================

export function ChatConversationsStation({
  conversationsData,
  isLoading,
  isReachable,
}: ChatConversationsStationProps) {
  const { stampReceipt } = useStationContext()

  const handleOpenConversation = useCallback(
    (conversation: ChatConversation) => {
      window.open(
        `${TARVA_CHAT_URL}/chat/${conversation.id}`,
        '_blank',
        'noopener,noreferrer'
      )
      stampReceipt(
        'open-conversation',
        `Opened conversation: ${conversation.title.slice(0, 40)}`
      )
    },
    [stampReceipt]
  )

  const handleNewConversation = useCallback(() => {
    window.open(TARVA_CHAT_URL, '_blank', 'noopener,noreferrer')
    stampReceipt('new-conversation', 'Opened Tarva Chat for new conversation')
  }, [stampReceipt])

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
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
          Conversation data unavailable
        </span>
      </div>
    )
  }

  // --- Empty State ---
  if (!conversationsData || conversationsData.recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          No conversations yet
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Start a new conversation in Tarva Chat
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
          <MetricCounter value={conversationsData.activeCount} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Recent
          </span>
          <MetricCounter value={conversationsData.recent.length} />
        </div>
        {/* New Conversation Quick Action */}
        <div className="ml-auto">
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 font-sans text-[11px] text-[var(--color-teal)] transition-colors hover:bg-white/[0.04]"
            aria-label="Start a new conversation"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>
      </div>

      {/* Conversations Table */}
      <ScrollArea className="max-h-[280px]">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_0.6fr_0.4fr_0.5fr] gap-2 border-b border-white/[0.04] px-2 py-1.5">
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Title
          </span>
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Agent
          </span>
          <span className="text-right font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Msgs
          </span>
          <span className="text-right font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Last Active
          </span>
        </div>

        {/* Table Rows */}
        {conversationsData.recent.map((conversation, index) => (
          <motion.button
            key={conversation.id}
            className="grid w-full cursor-pointer grid-cols-[1fr_0.6fr_0.4fr_0.5fr] gap-2 rounded-lg px-2 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember-bright)]"
            onClick={() => handleOpenConversation(conversation)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            aria-label={`Open conversation: ${conversation.title}`}
          >
            {/* Title */}
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-sans text-[13px] leading-tight text-[var(--color-text-primary)]">
                {conversation.title}
              </span>
              {conversation.lastMessagePreview && (
                <span className="truncate font-sans text-[10px] text-[var(--color-text-ghost)]">
                  {conversation.lastMessagePreview}
                </span>
              )}
            </div>

            {/* Agent Name */}
            <span className="truncate font-sans text-[12px] leading-tight text-[var(--color-text-secondary)]">
              {conversation.agentName}
            </span>

            {/* Message Count */}
            <span
              className="text-right font-mono text-[13px] leading-tight font-medium text-[var(--color-text-primary)] tabular-nums"
              style={{ fontFeatureSettings: '"tnum" 1' }}
            >
              {conversation.messageCount}
            </span>

            {/* Last Activity */}
            <span
              className="text-right font-mono text-[11px] leading-tight text-[var(--color-text-tertiary)] tabular-nums"
              style={{ fontFeatureSettings: '"tnum" 1' }}
            >
              {formatRelativeTime(conversation.lastActivityAt)}
            </span>
          </motion.button>
        ))}
      </ScrollArea>

      {/* Message Throughput Sparkline */}
      {conversationsData.throughputHistory.length > 1 && (
        <div className="pt-2">
          <span className="mb-1 block font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Message Throughput
          </span>
          <TelemetrySparkline
            data={[...conversationsData.throughputHistory]}
            width={240}
            height={32}
          />
        </div>
      )}
    </div>
  )
}
