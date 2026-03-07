'use client'

import { useState, useEffect, useMemo } from 'react'
import { useDataFreshness } from './use-data-freshness'

export type ApiHealthStatus = 'healthy' | 'degraded' | 'offline'

export interface ApiHealthResult {
  status: ApiHealthStatus
  label: string
  secondsSinceLastUpdate: number | null
}

const LABEL_MAP: Record<ApiHealthStatus, string> = {
  healthy: 'Connected',
  degraded: 'Data stale',
  offline: 'Offline',
}

export function useApiHealth(): ApiHealthResult {
  const { state, oldestUpdateAt } = useDataFreshness()

  // Re-evaluate periodically
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => {
    let status: ApiHealthStatus = 'healthy'
    if (state === 'offline') status = 'offline'
    else if (state === 'stale') status = 'degraded'

    const secondsSinceLastUpdate =
      oldestUpdateAt != null ? Math.floor((Date.now() - oldestUpdateAt) / 1000) : null

    return {
      status,
      label: LABEL_MAP[status],
      secondsSinceLastUpdate,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, oldestUpdateAt, tick])
}
