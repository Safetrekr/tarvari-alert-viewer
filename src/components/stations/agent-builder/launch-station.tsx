'use client'

/**
 * LaunchStation -- Dual-target launch panel for the Agent Builder district.
 *
 * Shows TWO launch targets per Gap #4:
 * 1. Agent Builder Web UI (localhost:3000) -- opens in new browser tab
 * 2. AgentGen CLI -- terminal-based generation engine (docs link only)
 *
 * Each target shows version info, status dot, and relevant actions.
 * The Web UI uses ember accent; the CLI uses teal accent (D9).
 *
 * @module launch-station
 * @see WS-2.2 Section 4.5
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { ExternalLink, Terminal, Copy, FileText } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { HealthBadge } from '@/components/telemetry'
import type { AppStatus } from '@/lib/telemetry-types'

// ============================================================================
// Types
// ============================================================================

export interface LaunchStationProps {
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

export function LaunchStation({ status, version, uptime }: LaunchStationProps) {
  const { stampReceipt } = useStationContext()

  const handleOpenWebUI = useCallback(() => {
    window.open('http://localhost:3000', '_blank', 'noopener,noreferrer')
    stampReceipt('open-web-ui', 'Opened Agent Builder Web UI')
  }, [stampReceipt])

  const handleCopyWebUIUrl = useCallback(() => {
    navigator.clipboard.writeText('http://localhost:3000')
    stampReceipt('copy-url-web-ui', 'Copied Agent Builder URL to clipboard')
  }, [stampReceipt])

  const handleViewCLIDocs = useCallback(() => {
    window.open('http://localhost:3000', '_blank', 'noopener,noreferrer')
    stampReceipt('view-cli-docs', 'Opened AgentGen CLI documentation')
  }, [stampReceipt])

  const isOffline = status === 'OFFLINE' || status === 'UNKNOWN'

  return (
    <div className="flex flex-col gap-6">
      {/* Launch Target: Web UI */}
      <motion.div
        className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[var(--color-ember-dim)] p-2">
            <ExternalLink className="h-4 w-4 text-[var(--color-ember-bright)]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[14px] font-medium text-[var(--color-text-primary)]">
              Agent Builder
            </span>
            <span className="font-sans text-[12px] text-[var(--color-text-tertiary)]">
              Web UI at localhost:3000
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
                onClick={handleOpenWebUI}
                disabled={isOffline}
                aria-label="Open Agent Builder web UI in a new tab"
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
                onClick={handleCopyWebUIUrl}
                aria-label="Copy Agent Builder URL"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy URL to clipboard</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

      {/* Launch Target: AgentGen CLI */}
      <motion.div
        className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[var(--color-teal-dim)] p-2">
            <Terminal className="h-4 w-4 text-[var(--color-teal-bright)]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[14px] font-medium text-[var(--color-text-primary)]">
              AgentGen CLI
            </span>
            <span className="font-sans text-[12px] text-[var(--color-text-tertiary)]">
              Terminal-based generation engine
            </span>
            <span className="mt-1 font-mono text-[11px] text-[var(--color-text-ghost)]">
              npx @tarva/agentgen
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleViewCLIDocs}
                aria-label="View AgentGen CLI documentation"
              >
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Docs
              </Button>
            </TooltipTrigger>
            <TooltipContent>View AgentGen CLI docs</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </div>
  )
}
