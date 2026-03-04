'use client'

/**
 * ArtifactsStation -- Recent outputs produced by Project Room executions.
 *
 * Displays: artifact list with type icons, name, version, type badge,
 * creator, and relative creation time. Empty state when no artifacts.
 *
 * Action: "Browse Artifacts" opens the Project Room artifacts page.
 *
 * Maps to the Launch spine "Artifact" supertype (Gap 2).
 *
 * @module artifacts-station
 * @see WS-2.3 Section 4.7
 */

import { useCallback } from 'react'
import { motion } from 'motion/react'
import {
  FileCode,
  FileText,
  Database,
  Settings,
  TestTube,
  File,
  ExternalLink,
  XCircle,
} from 'lucide-react'
import { Badge, Button, ScrollArea, Skeleton } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import type { ProjectRoomArtifact, ProjectRoomSnapshot } from '@/lib/project-room-types'

// ============================================================================
// Types
// ============================================================================

export interface ArtifactsStationProps {
  /** Full snapshot from the district data hook. */
  readonly snapshot: ProjectRoomSnapshot | null
  /** Whether data is loading. */
  readonly isLoading: boolean
  /** Whether the Project Room is reachable. */
  readonly isAvailable: boolean
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Map artifact type to a Lucide icon component.
 */
function artifactTypeIcon(type: ProjectRoomArtifact['type']) {
  switch (type) {
    case 'code':
      return FileCode
    case 'document':
      return FileText
    case 'data':
      return Database
    case 'config':
      return Settings
    case 'test':
      return TestTube
    default:
      return File
  }
}

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

export function ArtifactsStation({ snapshot, isLoading, isAvailable }: ArtifactsStationProps) {
  const { stampReceipt } = useStationContext()

  const handleBrowse = useCallback(() => {
    window.open('http://localhost:3005/artifacts', '_blank', 'noopener,noreferrer')
    stampReceipt('browse-artifacts', 'Opened Project Room artifacts browser')
  }, [stampReceipt])

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
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
          Artifact data unavailable
        </span>
      </div>
    )
  }

  const artifacts = snapshot?.artifacts ?? []

  return (
    <div className="flex flex-col gap-4">
      <ScrollArea className="max-h-[320px]">
        <div className="flex flex-col gap-4">
          {/* Artifact list */}
          {artifacts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {artifacts.map((artifact, index) => {
                const Icon = artifactTypeIcon(artifact.type)
                return (
                  <motion.div
                    key={artifact.id}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: 'var(--color-teal)', opacity: 0.6 }}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="truncate font-sans text-[13px] font-medium"
                          style={{ color: 'var(--color-text-primary)', opacity: 0.85 }}
                        >
                          {artifact.name}
                        </span>
                        {artifact.version && (
                          <span
                            className="font-mono text-[10px] font-normal tabular-nums"
                            style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }}
                          >
                            v{artifact.version}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{artifact.type}</Badge>
                        <span
                          className="font-sans text-[10px] font-normal"
                          style={{ color: 'var(--color-text-tertiary)', opacity: 0.5 }}
                        >
                          {artifact.creator} -- {formatRelativeTime(artifact.createdAt)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <File
                className="h-5 w-5"
                style={{ color: 'var(--color-text-ghost)', opacity: 0.4 }}
              />
              <span
                className="font-sans text-[12px] font-normal"
                style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}
              >
                No recent artifacts
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer action */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleBrowse}>
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Browse Artifacts
        </Button>
      </div>
    </div>
  )
}
