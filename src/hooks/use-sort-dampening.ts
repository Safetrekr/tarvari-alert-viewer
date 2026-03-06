'use client'

import { useRef, useMemo } from 'react'
import type { CategoryGridItem } from '@/lib/interfaces/coverage'
import { KNOWN_CATEGORIES } from '@/lib/interfaces/coverage'

const CATEGORY_ORDER = new Map(KNOWN_CATEGORIES.map((c, i) => [c.id, i]))

/**
 * Stabilize sort order to prevent visual jitter from minor count fluctuations.
 *
 * Items are sorted by alertCount descending with KNOWN_CATEGORIES index
 * as tie-breaker. The new sort is only applied when the maximum position
 * delta across all items is >= the dampening threshold.
 */
export function useSortDampening(
  items: CategoryGridItem[],
  threshold = 2,
): CategoryGridItem[] {
  const prevOrderRef = useRef<string[]>([])

  // Memoize on alert counts changing (not referential identity)
  const countsKey = items.map((i) => `${i.id}:${i.metrics.alertCount}`).join(',')

  return useMemo(() => {
    // Candidate sort: alert count descending, canonical order as tiebreaker
    const candidate = [...items].sort((a, b) => {
      const countDiff = b.metrics.alertCount - a.metrics.alertCount
      if (countDiff !== 0) return countDiff
      return (CATEGORY_ORDER.get(a.id) ?? 99) - (CATEGORY_ORDER.get(b.id) ?? 99)
    })

    const candidateOrder = candidate.map((i) => i.id)

    // First render: accept candidate
    if (prevOrderRef.current.length === 0) {
      prevOrderRef.current = candidateOrder
      return candidate
    }

    // Compute max position delta
    const prevMap = new Map(prevOrderRef.current.map((id, idx) => [id, idx]))
    let maxDelta = 0
    for (let i = 0; i < candidateOrder.length; i++) {
      const prevIdx = prevMap.get(candidateOrder[i])
      if (prevIdx != null) {
        maxDelta = Math.max(maxDelta, Math.abs(i - prevIdx))
      }
    }

    if (maxDelta >= threshold) {
      prevOrderRef.current = candidateOrder
      return candidate
    }

    // Keep previous order, using current data
    const itemMap = new Map(items.map((i) => [i.id, i]))
    const stable: CategoryGridItem[] = []
    for (const id of prevOrderRef.current) {
      const item = itemMap.get(id)
      if (item) stable.push(item)
    }
    // Append any new items not in previous order
    for (const item of items) {
      if (!prevOrderRef.current.includes(item.id)) {
        stable.push(item)
      }
    }
    return stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countsKey, threshold])
}
