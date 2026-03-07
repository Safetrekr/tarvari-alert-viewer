'use client'

import { useEffect, useRef } from 'react'
import { useDataFreshness, type DataFreshnessState } from '@/hooks/use-data-freshness'

export interface DataFreshnessMobileResult {
  state: DataFreshnessState
  isRecovering: boolean
}

/**
 * Mobile wrapper around useDataFreshness.
 * - Sets data-freshness attribute on documentElement for CSS degradation
 * - Logs staleness transitions for field debugging
 * - Provides isRecovering flag when transitioning from stale/offline → fresh
 */
export function useDataFreshnessMobile(): DataFreshnessMobileResult {
  const freshness = useDataFreshness()
  const prevStateRef = useRef<DataFreshnessState>(freshness.state)
  const isRecovering = prevStateRef.current !== 'fresh' && freshness.state === 'fresh'

  useEffect(() => {
    document.documentElement.setAttribute('data-freshness', freshness.state)
    return () => {
      document.documentElement.removeAttribute('data-freshness')
    }
  }, [freshness.state])

  useEffect(() => {
    if (prevStateRef.current !== freshness.state) {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[data-freshness] ${prevStateRef.current} → ${freshness.state}`,
          freshness.oldestUpdateAt
            ? `(oldest update: ${new Date(freshness.oldestUpdateAt).toISOString()})`
            : '',
        )
      }
      prevStateRef.current = freshness.state
    }
  }, [freshness.state, freshness.oldestUpdateAt])

  return { state: freshness.state, isRecovering }
}
