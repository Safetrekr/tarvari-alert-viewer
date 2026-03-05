/**
 * BundleGrid -- displays BundleCards in a responsive grid layout.
 *
 * Used when viewMode is 'triaged' or 'all-bundles'. Replaces the
 * category grid content area with bundle cards.
 *
 * @module BundleGrid
 */

'use client'

import type { BundleWithDecision } from '@/lib/interfaces/intel-bundles'
import { BundleCard } from './BundleCard'

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

interface BundleGridProps {
  bundles: BundleWithDecision[]
  selectedBundleId: string | null
  onSelectBundle: (id: string) => void
  isLoading?: boolean
}

export function BundleGrid({
  bundles,
  selectedBundleId,
  onSelectBundle,
  isLoading,
}: BundleGridProps) {
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
        }}
      >
        <span
          style={{
            ...MONO,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.15)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          LOADING BUNDLES...
        </span>
      </div>
    )
  }

  if (bundles.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 200,
        }}
      >
        <span
          style={{
            ...MONO,
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.15)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          NO BUNDLES
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16,
      }}
    >
      {bundles.map((item) => (
        <BundleCard
          key={item.bundle.id}
          item={item}
          onClick={onSelectBundle}
          isSelected={item.bundle.id === selectedBundleId}
        />
      ))}
    </div>
  )
}
