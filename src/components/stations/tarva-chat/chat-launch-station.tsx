'use client'

/**
 * ChatLaunchStation -- Launch panel for the Tarva Chat district.
 *
 * Shows the single Tarva Chat launch target at localhost:4000.
 * Displays version, uptime, and connection status from telemetry.
 * Actions: "Open App" (opens in new tab), "Copy URL" (clipboard).
 *
 * Follows the same visual pattern as the Agent Builder LaunchStation
 * but simplified to a single target (Tarva Chat has no CLI companion).
 *
 * @module chat-launch-station
 * @see WS-2.4 Section 4.5
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { ExternalLink, Copy, MessageSquare } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { HealthBadge } from '@/components/telemetry'
import type { AppStatus } from '@/lib/telemetry-types'

// ============================================================================
// Constants
// ============================================================================

/**
 * Tarva Chat URL.
 * Per CLAUDE.md: localhost:4000 (NOT 3000 or 3005).
 */
const TARVA_CHAT_URL = 'http://localhost:4000'

// ============================================================================
// Types
// ============================================================================

export interface ChatLaunchStationProps {
  /** Health state from WS-1.5 districts store. */
  readonly status: AppStatus
  /** App version from telemetry (null if unreachable). */
  readonly version: string | null
  /** Uptime in seconds from telemetry (null if unreachable). */
  readonly uptime: number | null
}

// ============================================================================
// Helpers
// ============================================================================

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '--'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

// ============================================================================
// Component
// ============================================================================

export function ChatLaunchStation({ status, version, uptime }: ChatLaunchStationProps) {
  const { stampReceipt } = useStationContext()

  const handleOpenApp = useCallback(() => {
    window.open(TARVA_CHAT_URL, '_blank', 'noopener,noreferrer')
    stampReceipt('open-app', 'Opened Tarva Chat')
  }, [stampReceipt])

  const handleCopyUrl = useCallback(() => {
    navigator.clipboard.writeText(TARVA_CHAT_URL)
    stampReceipt('copy-url', 'Copied Tarva Chat URL to clipboard')
  }, [stampReceipt])

  const isOffline = status === 'OFFLINE' || status === 'UNKNOWN'

  return (
    <div className="flex flex-col gap-6">
      {/* Launch Target: Tarva Chat Web UI */}
      <motion.div
        className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[var(--color-ember-dim)] p-2">
            <MessageSquare className="h-4 w-4 text-[var(--color-ember-bright)]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[14px] font-medium text-[var(--color-text-primary)]">
              Tarva Chat
            </span>
            <span className="font-sans text-[12px] text-[var(--color-text-tertiary)]">
              Multi-agent chat at localhost:4000
            </span>
            <div className="mt-1 flex items-center gap-3">
              <HealthBadge status={status} size="sm" />
              {version && (
                <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                  v{version}
                </span>
              )}
              {uptime !== null && (
                <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                  up {formatUptime(uptime)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                onClick={handleOpenApp}
                disabled={isOffline}
                aria-label="Open Tarva Chat in a new tab"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open in new tab</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyUrl}
                aria-label="Copy Tarva Chat URL"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy URL to clipboard</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </div>
  )
}
