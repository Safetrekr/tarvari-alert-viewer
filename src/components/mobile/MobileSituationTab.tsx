'use client'

import '@/styles/mobile-situation-tab.css'

import { MobileThreatBanner } from './MobileThreatBanner'
import { MobileP1Banner } from './MobileP1Banner'
import { MobilePriorityStrip } from './MobilePriorityStrip'
import { MobileCategoryGrid } from './MobileCategoryGrid'

/**
 * Composition container for the Situation tab.
 * Renders threat components in vertical order, then the category grid.
 */
export function MobileSituationTab() {
  return (
    <div
      className="mobile-situation-tab"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-section-gap, 16px)', paddingTop: 'var(--space-section-gap, 16px)' }}
    >
      <div className="mobile-situation-posture-column">
        <MobileThreatBanner />
        <MobileP1Banner />
        <MobilePriorityStrip />
      </div>
      <MobileCategoryGrid />
    </div>
  )
}
