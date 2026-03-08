'use client'

import type { ViewMode } from '@/lib/interfaces/intel-bundles'
import { useIntelBundles } from '@/hooks/use-intel-bundles'
import { MobileBundleCard } from './MobileBundleCard'
import { MobileStateView } from './MobileStateView'

interface MobileBundleListProps {
  viewMode: ViewMode
  onBundleTap: (bundleId: string) => void
}

export function MobileBundleList({ viewMode, onBundleTap }: MobileBundleListProps) {
  const query = useIntelBundles(viewMode)
  const bundles = query.data ?? []

  return (
    <div style={{ padding: '0 var(--space-content-padding, 12px)' }}>
      <MobileStateView query={query} emptyMessage="No bundles available" />
      {query.isSuccess && bundles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bundles.map((item) => (
            <MobileBundleCard
              key={item.bundle.id}
              item={item}
              onTap={onBundleTap}
            />
          ))}
        </div>
      )}
    </div>
  )
}
