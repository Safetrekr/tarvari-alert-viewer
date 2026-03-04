'use client'

/**
 * TanStack Query hook for Project Room district data.
 *
 * Fetches the consolidated district payload from GET /api/districts/project-room
 * on a 30-second polling cadence (slower than telemetry's 15s, since district
 * data -- runs, artifacts, governance -- changes less frequently than health status).
 *
 * Polling is enabled only when the district is active (user has navigated to
 * or is viewing the Project Room district). Pass `enabled: false` to suspend
 * polling when the district is not visible.
 *
 * Usage:
 * ```tsx
 * const { snapshot, isLoading, isAvailable, activeRuns } = useProjectRoomDistrict({
 *   enabled: selectedDistrict === 'project-room',
 * })
 * ```
 *
 * @module use-project-room-district
 * @see WS-2.3 Section 4.3
 */

import { useQuery } from '@tanstack/react-query'
import type { ProjectRoomSnapshot } from '@/lib/project-room-types'
import { EMPTY_PROJECT_ROOM_SNAPSHOT } from '@/lib/project-room-types'

/** Query key for cache management and invalidation. */
export const PROJECT_ROOM_DISTRICT_KEY = ['districts', 'project-room'] as const

/**
 * Default polling interval in milliseconds.
 * Slower than telemetry (15s) since district data changes less frequently.
 */
const DEFAULT_REFETCH_INTERVAL = 30_000

async function fetchProjectRoomDistrict(): Promise<ProjectRoomSnapshot> {
  const response = await fetch('/api/districts/project-room')
  if (!response.ok) {
    throw new Error(`Project Room district fetch failed: ${response.status}`)
  }
  return response.json()
}

export interface UseProjectRoomDistrictOptions {
  /** Override the polling interval in ms. Default: 30000. */
  readonly refetchInterval?: number
  /** Whether to enable polling. Default: true. */
  readonly enabled?: boolean
}

export function useProjectRoomDistrict(options?: UseProjectRoomDistrictOptions) {
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: PROJECT_ROOM_DISTRICT_KEY,
    queryFn: fetchProjectRoomDistrict,
    refetchInterval: enabled ? (options?.refetchInterval ?? DEFAULT_REFETCH_INTERVAL) : false,
    refetchIntervalInBackground: false,
    enabled,
    staleTime: 15_000,
    placeholderData: EMPTY_PROJECT_ROOM_SNAPSHOT,
    retry: 1,
    retryDelay: 2000,
  })

  return {
    /** The latest snapshot, or null if not yet loaded. */
    snapshot: query.data ?? null,
    /** Whether the initial load is in progress. */
    isLoading: query.isLoading,
    /** Whether the last fetch resulted in an error. */
    isError: query.isError,
    /** Error object if isError is true. */
    error: query.error,
    /** Whether the Project Room API is reachable. */
    isAvailable: query.data?.available ?? false,
    /** Shortcut: active + pending runs for quick access. */
    activeRuns:
      query.data?.runs.filter((r) => r.status === 'active' || r.status === 'pending') ?? [],
    /** Shortcut: pending governance items count. */
    pendingApprovalCount: query.data?.governanceItems.length ?? 0,
  }
}
