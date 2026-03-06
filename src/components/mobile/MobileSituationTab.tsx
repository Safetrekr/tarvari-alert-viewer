'use client'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-section-gap, 16px)', paddingTop: 'var(--space-section-gap, 16px)' }}>
      <MobileThreatBanner />
      <MobileP1Banner />
      <MobilePriorityStrip />
      <MobileCategoryGrid />
    </div>
  )
}
