'use client'

import { AlertTriangle, Grid3X3 } from 'lucide-react'
import { useThreatPicture } from '@/hooks/use-threat-picture'

export function MobileOverviewStats() {
  const { data: tp } = useThreatPicture()

  if (!tp) return null

  const categoryCount = tp.bySeverity.length > 0
    ? new Set(tp.byRegion.map((r) => r.region)).size
    : 0

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        height: 32,
        padding: '0 var(--space-content-padding, 12px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <AlertTriangle size={12} style={{ color: 'rgba(255, 255, 255, 0.25)' }} />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {tp.totalActiveAlerts}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.25)',
          }}
        >
          ALERTS
        </span>
      </div>
      <div
        style={{
          width: 1,
          height: 12,
          background: 'rgba(255, 255, 255, 0.06)',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Grid3X3 size={12} style={{ color: 'rgba(255, 255, 255, 0.25)' }} />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {categoryCount}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 10,
            color: 'rgba(255, 255, 255, 0.25)',
          }}
        >
          REGIONS
        </span>
      </div>
    </div>
  )
}
