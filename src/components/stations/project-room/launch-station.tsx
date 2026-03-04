'use client'

/**
 * LaunchStation -- Universal app launcher for the Project Room district.
 *
 * Shows connection status, version, port/URL, and uptime.
 * Primary action: "Open Project Room" (opens localhost:3005 in a new tab).
 * Secondary action: "Copy URL" (copies to clipboard).
 *
 * Per AD-8 and IA Assessment Section 3 (Z3 Station Templates):
 * - Header: [App Icon] Project Room
 * - Body: App version, port/URL, last accessed, connection status
 * - Actions: "Open App" (primary), "Copy URL" (secondary)
 *
 * Renders inside the WS-2.6 StationPanel framework, which provides
 * the 3-zone layout, glass material, and luminous border.
 *
 * @module launch-station
 * @see WS-2.3 Section 4.4
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { ExternalLink, Copy, Check } from 'lucide-react'
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
  /** Whether the URL was recently copied. */
  readonly copied: boolean
  /** Callback to copy the URL to clipboard. */
  readonly onCopy: () => void
}

// ============================================================================
// Constants
// ============================================================================

const PROJECT_ROOM_URL = 'http://localhost:3005'

// ============================================================================
// Helpers
// ============================================================================

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '--'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  return h > 0 ? `${d}d ${h}h` : `${d}d`
}

// ============================================================================
// Component
// ============================================================================

export function LaunchStation({ status, version, uptime, copied, onCopy }: LaunchStationProps) {
  const { stampReceipt } = useStationContext()

  const handleOpenApp = useCallback(() => {
    window.open(PROJECT_ROOM_URL, '_blank', 'noopener,noreferrer')
    stampReceipt('open-app', 'Opened Project Room in new tab')
  }, [stampReceipt])

  const handleCopyUrl = useCallback(() => {
    onCopy()
    stampReceipt('copy-url', 'Copied Project Room URL to clipboard')
  }, [onCopy, stampReceipt])

  const isOffline = status === 'OFFLINE' || status === 'UNKNOWN'

  return (
    <div className="flex flex-col gap-6">
      {/* Launch Target */}
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
              Project Room
            </span>
            <span className="font-sans text-[12px] text-[var(--color-text-tertiary)]">
              Agent orchestration at localhost:3005
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
                aria-label="Open Project Room in a new tab"
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
                aria-label="Copy Project Room URL"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy URL to clipboard</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </div>
  )
}
