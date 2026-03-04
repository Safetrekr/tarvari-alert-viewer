/**
 * AgentListItem -- Single agent row in the Library station's agent list.
 *
 * Displays agent name, description, Tarva badge (if applicable),
 * skill count (for Tarva agents), and relative modification date.
 *
 * @module agent-list-item
 * @see WS-2.2 Section 4.9
 */

import { Badge } from '@tarva/ui'
import type { InstalledAgentSummary } from '@/lib/agent-builder-types'

// ============================================================================
// Types
// ============================================================================

export interface AgentListItemProps {
  readonly agent: InstalledAgentSummary
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeDate(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// ============================================================================
// Component
// ============================================================================

export function AgentListItem({ agent }: AgentListItemProps) {
  return (
    <div className="flex items-center justify-between rounded border-b border-white/[0.03] px-2 py-2.5 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.02]">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-sans text-[13px] leading-tight font-medium text-[var(--color-text-primary)]">
            {agent.name}
          </span>
          {agent.isTarvaAgent && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
              Tarva
            </Badge>
          )}
        </div>
        <span className="truncate font-sans text-[11px] text-[var(--color-text-tertiary)]">
          {agent.description || agent.fileName}
        </span>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-3">
        {agent.tarvaMetadata && (
          <span
            className="font-mono text-[11px] text-[var(--color-teal)] tabular-nums"
            style={{ fontFeatureSettings: '"tnum" 1' }}
            title={`${agent.tarvaMetadata.skillCount} skills`}
          >
            {agent.tarvaMetadata.skillCount} skills
          </span>
        )}
        <span
          className="font-mono text-[10px] text-[var(--color-text-ghost)] tabular-nums"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {formatRelativeDate(agent.modifiedAt)}
        </span>
      </div>
    </div>
  )
}
