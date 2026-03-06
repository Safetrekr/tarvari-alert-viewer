/**
 * Shared time formatting utilities for relative timestamps.
 *
 * Extracted per Phase 2 Conflict 1/2 resolution to provide a single
 * source of truth for time-ago formatting across PriorityFeedStrip (WS-2.2),
 * PriorityFeedPanel (WS-2.3), and future consumers.
 *
 * @module time-utils
 * @see WS-2.2, WS-2.3
 */

'use client'

import { useState, useEffect } from 'react'

/**
 * Format an ISO 8601 timestamp as a compact relative time string.
 *
 * Examples: "NOW", "45s", "5m", "3h", "2d", "1w"
 */
export function relativeTimeAgo(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then

  if (Number.isNaN(diffMs) || diffMs < 0) return 'NOW'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return seconds < 5 ? 'NOW' : `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`

  const weeks = Math.floor(days / 7)
  return `${weeks}w`
}

/**
 * React hook that returns a tick counter, incrementing on a fixed interval
 * to force re-renders of time-ago displays without waiting for data refetch.
 *
 * @param intervalMs Re-render interval in milliseconds. Default: 30000 (30s).
 */
export function useRelativeTimeTick(intervalMs = 30_000): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return tick
}
