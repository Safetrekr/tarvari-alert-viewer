'use client'

/**
 * TanStack Query hook for Tarva Chat district data.
 *
 * Fetches the consolidated district payload from GET /api/districts/tarva-chat
 * on the same adaptive cadence as the WS-1.5 telemetry polling:
 * - 15s when OPERATIONAL
 * - 5s when DEGRADED or DOWN
 *
 * Polling is gated by the `enabled` parameter -- only polls when the
 * Tarva Chat district is actively visible at Z2/Z3.
 *
 * Usage:
 * ```tsx
 * const { snapshot, isLoading, isAvailable } = useTarvaChatDistrict(true)
 * ```
 */

import { useQuery } from '@tanstack/react-query'
import type { TarvaChatSnapshot } from '@/lib/tarva-chat-types'
import { EMPTY_TARVA_CHAT_SNAPSHOT } from '@/lib/tarva-chat-types'
import { useDistrictsStore } from '@/stores/districts.store'
import { POLLING_INTERVALS } from '@/lib/telemetry-config'

/** Query key for cache management and invalidation. */
export const TARVA_CHAT_DISTRICT_KEY = ['districts', 'tarva-chat'] as const

/**
 * Fetch the Tarva Chat district snapshot from the Launch route handler.
 */
async function fetchTarvaChatDistrict(): Promise<TarvaChatSnapshot> {
  const response = await fetch('/api/districts/tarva-chat')
  if (!response.ok) {
    throw new Error(`Tarva Chat district fetch failed: ${response.status}`)
  }
  return response.json()
}

export interface UseTarvaChatDistrictOptions {
  /** Whether to enable polling. Default: true. */
  readonly enabled?: boolean
}

/**
 * Hook for fetching Tarva Chat-specific district data.
 *
 * Polls GET /api/districts/tarva-chat at the same adaptive interval
 * as the telemetry aggregator. Only enabled when the Tarva Chat
 * district is actively visible (Z2/Z3 focused on tarva-chat).
 *
 * @param options.enabled - Whether to poll (true when Tarva Chat district is visible)
 * @returns The latest TarvaChatSnapshot plus query state
 */
export function useTarvaChatDistrict(options?: UseTarvaChatDistrictOptions) {
  const enabled = options?.enabled ?? true

  const chatStatus = useDistrictsStore(
    (s) => s.districts['tarva-chat']?.status ?? 'UNKNOWN'
  )

  const query = useQuery({
    queryKey: TARVA_CHAT_DISTRICT_KEY,
    queryFn: fetchTarvaChatDistrict,
    enabled,
    /**
     * Poll at the normal interval when enabled.
     * If Tarva Chat is DEGRADED or DOWN, tighten to alert interval.
     */
    refetchInterval: enabled
      ? chatStatus === 'DEGRADED' || chatStatus === 'DOWN'
        ? POLLING_INTERVALS.alert
        : POLLING_INTERVALS.normal
      : false,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    /**
     * Provides a synthetic empty snapshot so station components
     * always have a non-null render shape. The `available: false`
     * flag triggers offline state rendering.
     */
    placeholderData: EMPTY_TARVA_CHAT_SNAPSHOT,
    retry: 1,
    retryDelay: 2000,
  })

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    /** Whether Tarva Chat returned any data. */
    isAvailable: query.data?.available ?? false,
  }
}
