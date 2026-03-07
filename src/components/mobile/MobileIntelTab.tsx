'use client'

import '@/styles/mobile-intel-tab.css'

import { useState, useCallback, useMemo } from 'react'
import { useIntelFeed } from '@/hooks/use-intel-feed'
import { useLatestGeoSummary } from '@/hooks/use-geo-summaries'
import type { GeoSummary } from '@/hooks/use-geo-summaries'
import { adaptFeedItem } from '@/lib/adapters/intel-adapters'
import { MobileAlertCard } from './MobileAlertCard'
import { MobileRegionCard } from './MobileRegionCard'
import { MobileStateView } from './MobileStateView'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'

export interface MobileIntelTabProps {
  readonly onAlertTap?: (item: CategoryIntelItem) => void
  readonly onRegionTap?: (summary: GeoSummary) => void
  readonly onSearchTap?: () => void
}

const GEO_REGIONS = [
  'world',
  'north-america',
  'europe',
  'middle-east',
  'east-asia',
  'africa',
] as const

export function MobileIntelTab({
  onAlertTap,
  onRegionTap,
  onSearchTap,
}: MobileIntelTabProps) {
  const feedQuery = useIntelFeed()
  const globalSummary = useLatestGeoSummary('world', 'world')

  // Adapt feed items to CategoryIntelItem for MobileAlertCard
  const feedItems = useMemo(() => {
    return (feedQuery.data ?? []).map(adaptFeedItem)
  }, [feedQuery.data])

  const handleAlertTap = useCallback(
    (item: CategoryIntelItem) => {
      onAlertTap?.(item)
    },
    [onAlertTap],
  )

  return (
    <div className="mobile-intel-tab">
      {/* Search entry */}
      <button
        type="button"
        className="mobile-intel-search-entry"
        onClick={onSearchTap}
        aria-label="Search intel"
      >
        <span className="mobile-intel-search-icon">&#8981;</span>
        <span className="mobile-intel-search-text">Search intel...</span>
      </button>

      {/* Geographic intelligence section */}
      <section className="mobile-intel-section">
        <h3 className="mobile-intel-section-title">Geographic Intelligence</h3>
        <div className="mobile-intel-region-scroll">
          {/* Global summary card */}
          {globalSummary.data && onRegionTap && (
            <MobileRegionCard summary={globalSummary.data} onTap={onRegionTap} />
          )}
        </div>
      </section>

      {/* Latest feed */}
      <section className="mobile-intel-section">
        <h3 className="mobile-intel-section-title">Latest Intel</h3>
        <MobileStateView query={feedQuery} emptyMessage="No recent intel" />
        {feedQuery.isSuccess && (
          <div className="mobile-intel-feed">
            {feedItems.slice(0, 20).map((item) => (
              <MobileAlertCard
                key={item.id}
                item={item}
                onTap={handleAlertTap}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
