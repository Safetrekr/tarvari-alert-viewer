'use client'

/**
 * GovernanceStation -- Approvals, phase gates, and truth governance
 * for the Project Room district.
 *
 * Displays: pending approval count and list, phase gate progress across
 * active projects, and recent truth entries.
 *
 * Actions: "Review" (opens item in Project Room), "Open Governance" (opens
 * the governance page in Project Room).
 *
 * The "Approval" concept was demoted from spine-level to app-specific
 * per IA assessment. This station is the only place it surfaces in the Launch.
 *
 * @module governance-station
 * @see WS-2.3 Section 4.8
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { ShieldCheck, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import {
  Badge,
  Button,
  ScrollArea,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import type { ProjectRoomSnapshot } from '@/lib/project-room-types'

// ============================================================================
// Types
// ============================================================================

export interface GovernanceStationProps {
  /** Full snapshot from the district data hook. */
  readonly snapshot: ProjectRoomSnapshot | null
  /** Pre-computed pending approval count. */
  readonly pendingApprovalCount: number
  /** Whether data is loading. */
  readonly isLoading: boolean
  /** Whether the Project Room is reachable. */
  readonly isAvailable: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeTime(iso: string): string {
  if (!iso) return '--'
  try {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const diff = now - then
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
    return `${Math.round(diff / 86_400_000)}d ago`
  } catch {
    return '--'
  }
}

// ============================================================================
// Component
// ============================================================================

export function GovernanceStation({
  snapshot,
  pendingApprovalCount,
  isLoading,
  isAvailable,
}: GovernanceStationProps) {
  const { stampReceipt } = useStationContext()

  const handleReview = useCallback(
    (itemId: string, summary: string) => {
      window.open(
        `http://localhost:3005/governance/${itemId}`,
        '_blank',
        'noopener,noreferrer'
      )
      stampReceipt('review-item', `Opened governance review: "${summary}"`)
    },
    [stampReceipt]
  )

  const handleOpenGovernance = useCallback(() => {
    window.open('http://localhost:3005/governance', '_blank', 'noopener,noreferrer')
    stampReceipt('open-governance', 'Opened Project Room governance page')
  }, [stampReceipt])

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  // --- Offline State ---
  if (!isAvailable) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <XCircle className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          Project Room unreachable
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Governance data unavailable
        </span>
      </div>
    )
  }

  const governanceItems = snapshot?.governanceItems ?? []
  const phaseGates = snapshot?.phaseGates ?? []
  const truthEntries = snapshot?.truthEntries ?? []

  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className="max-h-[360px]">
        <div className="flex flex-col gap-5">
          {/* Pending approvals */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
              >
                Pending Approvals
              </span>
              {pendingApprovalCount > 0 && (
                <Badge variant="destructive">{pendingApprovalCount}</Badge>
              )}
            </div>

            {governanceItems.length > 0 ? (
              governanceItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="flex flex-col gap-1 rounded-md px-2.5 py-2"
                  style={{
                    background: 'rgba(234, 179, 8, 0.04)',
                    border: '1px solid rgba(234, 179, 8, 0.10)',
                  }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="max-w-[180px] font-sans text-[13px] leading-[1.4] font-medium"
                      style={{ color: 'var(--color-text-primary)', opacity: 0.85 }}
                    >
                      {item.summary}
                    </span>
                    <Badge variant="outline">{item.type.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="font-sans text-[10px] font-normal"
                      style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }}
                    >
                      {item.requestedBy} -- {item.projectName}
                    </span>
                    <button
                      onClick={() => handleReview(item.id, item.summary)}
                      className="rounded px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-[0.04em] uppercase transition-colors duration-150 hover:bg-white/[0.04]"
                      style={{ color: 'var(--color-ember-bright)', opacity: 0.7 }}
                      aria-label={`Review governance item: ${item.summary}`}
                    >
                      Review
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex items-center gap-2 py-2">
                <CheckCircle
                  className="h-3.5 w-3.5"
                  style={{ color: 'var(--color-healthy)', opacity: 0.5 }}
                />
                <span
                  className="font-sans text-[12px] font-normal"
                  style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
                >
                  No pending approvals
                </span>
              </div>
            )}
          </div>

          {/* Phase gates */}
          {phaseGates.length > 0 && (
            <div className="flex flex-col gap-2">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
              >
                Phase Gates
              </span>
              {phaseGates.map((gate, index) => (
                <motion.div
                  key={gate.id}
                  className="flex items-center justify-between rounded-md px-2.5 py-1.5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <div className="flex flex-col">
                    <span
                      className="font-sans text-[13px] font-medium"
                      style={{ color: 'var(--color-text-primary)', opacity: 0.85 }}
                    >
                      {gate.phaseName}
                    </span>
                    <span
                      className="font-sans text-[10px] font-normal"
                      style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }}
                    >
                      {gate.projectName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="font-mono text-[12px] font-medium tabular-nums"
                          style={{
                            color: gate.passed
                              ? 'var(--color-healthy)'
                              : 'var(--color-warning)',
                            opacity: 0.8,
                          }}
                        >
                          {gate.criteriaMet}/{gate.criteriaTotal}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {gate.criteriaMet} of {gate.criteriaTotal} criteria met
                      </TooltipContent>
                    </Tooltip>
                    {gate.passed ? (
                      <CheckCircle
                        className="h-3.5 w-3.5"
                        style={{ color: 'var(--color-healthy)' }}
                      />
                    ) : (
                      <AlertTriangle
                        className="h-3.5 w-3.5"
                        style={{ color: 'var(--color-warning)' }}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Recent truth entries */}
          {truthEntries.length > 0 && (
            <div className="flex flex-col gap-2">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
              >
                Recent Truth Entries
              </span>
              {truthEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  className="flex flex-col gap-0.5 px-2.5 py-1.5"
                  style={{ borderLeft: '2px solid var(--color-teal-muted)' }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <span
                    className="font-sans text-[12px] leading-[1.5] font-normal"
                    style={{ color: 'var(--color-text-primary)', opacity: 0.75 }}
                  >
                    {entry.content}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{entry.category}</Badge>
                    <span
                      className="font-sans text-[10px] font-normal"
                      style={{ color: 'var(--color-text-tertiary)', opacity: 0.4 }}
                    >
                      {entry.source} -- {formatRelativeTime(entry.createdAt)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer action */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={handleOpenGovernance}
        >
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          Open Governance
        </Button>
      </div>
    </div>
  )
}
