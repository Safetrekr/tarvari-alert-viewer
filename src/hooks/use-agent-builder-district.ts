'use client'

/**
 * TanStack Query hook for Agent Builder district data.
 *
 * Fetches the consolidated district payload from GET /api/districts/agent-builder
 * on the same cadence as the WS-1.5 telemetry polling (15s default, 5s when degraded).
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, isError } = useAgentBuilderDistrict()
 * ```
 */

import { useQuery } from '@tanstack/react-query'
import type { AgentBuilderDistrictData } from '@/lib/agent-builder-types'
import { EMPTY_AGENT_BUILDER_DATA } from '@/lib/agent-builder-types'

/** Query key for cache management and invalidation. */
export const AGENT_BUILDER_DISTRICT_KEY = ['districts', 'agent-builder'] as const

/**
 * Default polling interval in milliseconds.
 * Aligns with WS-1.5 telemetry polling cadence.
 */
const DEFAULT_REFETCH_INTERVAL = 15_000

async function fetchAgentBuilderDistrict(): Promise<AgentBuilderDistrictData> {
  const response = await fetch('/api/districts/agent-builder')
  if (!response.ok) {
    throw new Error(`Agent Builder district fetch failed: ${response.status}`)
  }
  return response.json()
}

export interface UseAgentBuilderDistrictOptions {
  /** Override the polling interval in ms. Default: 15000. */
  readonly refetchInterval?: number
  /** Whether to enable polling. Default: true. */
  readonly enabled?: boolean
}

export function useAgentBuilderDistrict(options?: UseAgentBuilderDistrictOptions) {
  return useQuery({
    queryKey: AGENT_BUILDER_DISTRICT_KEY,
    queryFn: fetchAgentBuilderDistrict,
    refetchInterval: options?.refetchInterval ?? DEFAULT_REFETCH_INTERVAL,
    enabled: options?.enabled ?? true,
    staleTime: 10_000,
    placeholderData: EMPTY_AGENT_BUILDER_DATA,
    retry: 1,
    retryDelay: 2000,
  })
}
