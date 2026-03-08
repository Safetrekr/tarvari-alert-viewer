'use client'

import '@/styles/mobile-situation-tab.css'

import { MobileThreatBanner } from './MobileThreatBanner'
import { MobileP1Banner } from './MobileP1Banner'
import { MobilePriorityStrip } from './MobilePriorityStrip'
import { MobileCategoryGrid } from './MobileCategoryGrid'
import { MobileBundleList } from './MobileBundleList'
import { MobileViewModeToggle } from './MobileViewModeToggle'
import { MobileOverviewStats } from './MobileOverviewStats'
import { useCoverageStore } from '@/stores/coverage.store'

export interface MobileSituationTabProps {
  onAlertTap?: (id: string) => void
  onThreatBannerTap?: () => void
  onBundleTap?: (bundleId: string) => void
  onExpandPriorityFeed?: () => void
}

/**
 * Composition container for the Situation tab.
 * Renders threat components in vertical order, then the category grid or bundle list.
 */
export function MobileSituationTab({ onAlertTap, onThreatBannerTap, onBundleTap, onExpandPriorityFeed }: MobileSituationTabProps) {
  const viewMode = useCoverageStore((s) => s.viewMode)
  const setViewMode = useCoverageStore((s) => s.setViewMode)

  return (
    <div
      className="mobile-situation-tab"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-section-gap, 16px)', paddingTop: 'var(--space-section-gap, 16px)' }}
    >
      <div className="mobile-situation-posture-column">
        <MobileThreatBanner onTap={onThreatBannerTap} />
        <MobileP1Banner onTap={onAlertTap} />
        <MobilePriorityStrip onTapAlert={onAlertTap} onExpandFeed={onExpandPriorityFeed} />
      </div>
      <MobileOverviewStats />
      <MobileViewModeToggle value={viewMode} onChange={setViewMode} />
      {viewMode === 'raw' ? (
        <MobileCategoryGrid />
      ) : (
        <MobileBundleList viewMode={viewMode} onBundleTap={onBundleTap ?? (() => {})} />
      )}
    </div>
  )
}
