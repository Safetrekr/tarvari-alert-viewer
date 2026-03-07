'use client'

import '@/styles/mobile-situation-tab.css'

import { MobileThreatBanner } from './MobileThreatBanner'
import { MobileP1Banner } from './MobileP1Banner'
import { MobilePriorityStrip } from './MobilePriorityStrip'
import { MobileCategoryGrid } from './MobileCategoryGrid'

export interface MobileSituationTabProps {
  onAlertTap?: (id: string) => void
  onThreatBannerTap?: () => void
}

/**
 * Composition container for the Situation tab.
 * Renders threat components in vertical order, then the category grid.
 */
export function MobileSituationTab({ onAlertTap, onThreatBannerTap }: MobileSituationTabProps) {
  return (
    <div
      className="mobile-situation-tab"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-section-gap, 16px)', paddingTop: 'var(--space-section-gap, 16px)' }}
    >
      <div className="mobile-situation-posture-column">
        <MobileThreatBanner onTap={onThreatBannerTap} />
        <MobileP1Banner onTap={onAlertTap} />
        <MobilePriorityStrip onTapAlert={onAlertTap} />
      </div>
      <MobileCategoryGrid />
    </div>
  )
}
