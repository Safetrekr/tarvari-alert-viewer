'use client'

import { useCallback } from 'react'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { buildAllGridItems } from '@/lib/interfaces/coverage'
import { useSortDampening } from '@/hooks/use-sort-dampening'
import { useCoverageStore } from '@/stores/coverage.store'
import { useUIStore } from '@/stores/ui.store'
import { MobileCategoryCard } from './MobileCategoryCard'
import { MobileStateView } from './MobileStateView'

/**
 * 2-column CSS Grid of category cards for the Situation tab.
 * Tap = startMorph (fast path). Long-press = toggle map filter.
 */
export function MobileCategoryGrid() {
  const query = useCoverageMetrics()
  const items = buildAllGridItems(query.data?.byCategory ?? [])
  const sorted = useSortDampening(items)

  const handleTap = useCallback((id: string) => {
    const { morph, startMorph } = useUIStore.getState()
    if (morph.phase === 'idle') {
      startMorph(id, { fast: true })
    }
  }, [])

  const handleLongPress = useCallback((id: string) => {
    useCoverageStore.getState().toggleCategory(id)
  }, [])

  const stateView = (
    <MobileStateView
      query={query as Parameters<typeof MobileStateView>[0]['query']}
      emptyTitle="No coverage data"
      emptyMessage="Waiting for intel sources to report."
    />
  )

  if (stateView.type !== null && (query.isLoading || query.isError || !query.data)) {
    return stateView
  }

  return (
    <div
      className="mobile-category-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-card-gap, 10px)',
        padding: '0 var(--space-content-padding, 12px)',
        paddingBottom: 'var(--space-section-gap, 16px)',
      }}
    >
      {sorted.map((item) => (
        <MobileCategoryCard
          key={item.id}
          item={item}
          onTap={handleTap}
          onLongPress={handleLongPress}
        />
      ))}
    </div>
  )
}
