'use client'

import { useState, useEffect, useMemo } from 'react'
import { useThreatPicture } from '@/hooks/use-threat-picture'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { usePriorityFeed } from '@/hooks/use-priority-feed'

export const STALENESS_THRESHOLD_MS = 180_000 // 3 minutes
const POLL_INTERVAL_MS = 15_000 // 15 seconds

export type DataFreshnessState = 'fresh' | 'stale' | 'offline'

export interface DataFreshnessResult {
  state: DataFreshnessState
  isOnline: boolean
  isStale: boolean
  oldestUpdateAt: number | null
  staleSince: string | null
}

export function useDataFreshness(): DataFreshnessResult {
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const threatPicture = useThreatPicture()
  const coverageMetrics = useCoverageMetrics()
  const priorityFeed = usePriorityFeed()

  // Force re-evaluation every POLL_INTERVAL_MS
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => {
    const timestamps = [
      threatPicture.dataUpdatedAt,
      coverageMetrics.dataUpdatedAt,
      priorityFeed.dataUpdatedAt,
    ].filter((t): t is number => t != null && t > 0)

    const oldestUpdateAt = timestamps.length > 0 ? Math.min(...timestamps) : null

    const isStale =
      oldestUpdateAt != null &&
      Date.now() - oldestUpdateAt > STALENESS_THRESHOLD_MS

    let state: DataFreshnessState = 'fresh'
    if (!isOnline) state = 'offline'
    else if (isStale) state = 'stale'

    let staleSince: string | null = null
    if (state !== 'fresh' && oldestUpdateAt != null) {
      const mins = Math.floor((Date.now() - oldestUpdateAt) / 60_000)
      staleSince = mins < 1 ? '<1m ago' : `${mins}m ago`
    }

    return { state, isOnline, isStale, oldestUpdateAt, staleSince }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOnline,
    tick,
    threatPicture.dataUpdatedAt,
    coverageMetrics.dataUpdatedAt,
    priorityFeed.dataUpdatedAt,
  ])
}
