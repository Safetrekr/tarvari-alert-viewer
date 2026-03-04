'use client'

/**
 * DualLaunchTarget -- A launch target card with status dot, version info,
 * and action buttons. Used in the Agent Builder Launch station to render
 * both the Web UI and AgentGen CLI targets.
 *
 * @module dual-launch-target
 * @see WS-2.2 Section 4.5
 */

import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@tarva/ui'
import { HealthBadge } from '@/components/telemetry'
import type { AppStatus } from '@/lib/telemetry-types'

// ============================================================================
// Types
// ============================================================================

export interface DualLaunchTargetAction {
  /** Button label text. */
  readonly label: string
  /** Button variant per @tarva/ui. */
  readonly variant: 'default' | 'secondary' | 'ghost'
  /** Icon element rendered before the label. */
  readonly icon: ReactNode
  /** Click handler. */
  readonly onClick: () => void
  /** Accessible label for the button. */
  readonly ariaLabel: string
  /** Whether the button is disabled. */
  readonly disabled?: boolean
  /** Tooltip text. */
  readonly tooltip: string
}

export interface DualLaunchTargetProps {
  /** Icon element for the target. */
  readonly icon: ReactNode
  /** Background color class for the icon container. */
  readonly iconBgClass: string
  /** Display name for the target. */
  readonly displayName: string
  /** Subtitle text. */
  readonly subtitle: string
  /** Optional version string. */
  readonly version?: string | null
  /** Optional uptime display string. */
  readonly uptimeDisplay?: string | null
  /** Health status for the status badge. */
  readonly status?: AppStatus
  /** Optional tertiary text (e.g., CLI command). */
  readonly tertiaryText?: string
  /** Action buttons. */
  readonly actions: readonly DualLaunchTargetAction[]
  /** Animation stagger delay in seconds. */
  readonly staggerDelay?: number
}

// ============================================================================
// Component
// ============================================================================

export function DualLaunchTarget({
  icon,
  iconBgClass,
  displayName,
  subtitle,
  version,
  uptimeDisplay,
  status,
  tertiaryText,
  actions,
  staggerDelay = 0,
}: DualLaunchTargetProps) {
  return (
    <motion.div
      className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: staggerDelay }}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-lg p-2 ${iconBgClass}`}>
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-sans text-[14px] font-medium text-[var(--color-text-primary)]">
            {displayName}
          </span>
          <span className="font-sans text-[12px] text-[var(--color-text-tertiary)]">
            {subtitle}
          </span>
          {(status || version || uptimeDisplay) && (
            <div className="mt-1 flex items-center gap-3">
              {status && <HealthBadge status={status} size="sm" />}
              {version && (
                <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                  v{version}
                </span>
              )}
              {uptimeDisplay && (
                <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                  up {uptimeDisplay}
                </span>
              )}
            </div>
          )}
          {tertiaryText && (
            <span className="mt-1 font-mono text-[11px] text-[var(--color-text-ghost)]">
              {tertiaryText}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions.map((action) => (
          <Tooltip key={action.ariaLabel}>
            <TooltipTrigger asChild>
              <Button
                variant={action.variant}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                aria-label={action.ariaLabel}
              >
                {action.icon}
                {action.label && <span className="ml-1.5">{action.label}</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{action.tooltip}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </motion.div>
  )
}
