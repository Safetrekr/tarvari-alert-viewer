'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCategoryIntel, type CategoryIntelItem } from '@/hooks/use-category-intel'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { getCategoryMeta, getCategoryColor } from '@/lib/interfaces/coverage'
import { MobileAlertCard } from './MobileAlertCard'
import { MobileStateView } from './MobileStateView'

export interface MobileCategoryDetailProps {
  readonly categoryId: string
  readonly onBack: () => void
  readonly onAlertTap: (alertId: string) => void
  readonly currentSnap: number
  readonly selectedAlertId?: string | null
}

type SortKey = 'time' | 'severity' | 'priority'

const SEVERITY_ORDER: Record<string, number> = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
}

const PRIORITY_ORDER: Record<string, number> = {
  P1: 0,
  P2: 1,
  P3: 2,
}

export function MobileCategoryDetail({
  categoryId,
  onBack,
  onAlertTap,
  currentSnap,
  selectedAlertId,
}: MobileCategoryDetailProps) {
  const meta = getCategoryMeta(categoryId)
  const color = getCategoryColor(categoryId)
  const intelQuery = useCategoryIntel(categoryId)
  const metricsQuery = useCoverageMetrics()

  const [sortBy, setSortBy] = useState<SortKey>('time')

  // Category metrics from coverage data
  const categoryMetrics = useMemo(() => {
    if (!metricsQuery.data) return null
    return metricsQuery.data.byCategory.find((c) => c.category === categoryId) ?? null
  }, [metricsQuery.data, categoryId])

  // Sort intel items
  const sortedItems = useMemo(() => {
    const items = intelQuery.data ?? []
    const sorted = [...items]
    switch (sortBy) {
      case 'time':
        sorted.sort((a, b) => new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime())
        break
      case 'severity':
        sorted.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))
        break
      case 'priority':
        sorted.sort((a, b) => {
          const aP = a.operationalPriority ? (PRIORITY_ORDER[a.operationalPriority] ?? 9) : 9
          const bP = b.operationalPriority ? (PRIORITY_ORDER[b.operationalPriority] ?? 9) : 9
          return aP - bP
        })
        break
    }
    return sorted
  }, [intelQuery.data, sortBy])

  const handleAlertTap = useCallback(
    (item: CategoryIntelItem) => {
      onAlertTap(item.id)
    },
    [onAlertTap],
  )

  // Severity distribution for bar
  const severityDist = useMemo(() => {
    const items = intelQuery.data ?? []
    const dist: Record<string, number> = {}
    for (const item of items) {
      dist[item.severity] = (dist[item.severity] ?? 0) + 1
    }
    return dist
  }, [intelQuery.data])

  const totalItems = intelQuery.data?.length ?? 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header -- always visible */}
      <div
        style={{
          padding: '12px var(--space-content-padding, 12px) 8px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
            }}
          >
            &#8592;
          </button>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 14,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.04em',
            }}
          >
            {meta.displayName}
          </h2>
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            {totalItems} alert{totalItems !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Summary bar -- visible at 35%+ */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {categoryMetrics && (
            <>
              <Stat label="Sources" value={categoryMetrics.activeSources} />
              <Stat label="P1" value={categoryMetrics.p1Count} highlight={categoryMetrics.p1Count > 0} />
              <Stat label="P2" value={categoryMetrics.p2Count} />
            </>
          )}
        </div>

        {/* Severity distribution bar */}
        {totalItems > 0 && (
          <div
            style={{
              display: 'flex',
              height: 3,
              borderRadius: 1.5,
              overflow: 'hidden',
              marginTop: 8,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            {['Extreme', 'Severe', 'Moderate', 'Minor'].map((sev) => {
              const count = severityDist[sev] ?? 0
              if (count === 0) return null
              return (
                <div
                  key={sev}
                  style={{
                    flex: count,
                    background:
                      sev === 'Extreme'
                        ? '#ef4444'
                        : sev === 'Severe'
                          ? '#f97316'
                          : sev === 'Moderate'
                            ? '#eab308'
                            : '#3b82f6',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Alert list -- visible at 65%+ */}
      {currentSnap >= 65 && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Sort controls */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px var(--space-content-padding, 12px)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              flexShrink: 0,
            }}
          >
            {(['time', 'severity', 'priority'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortBy(key)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 4,
                  border: 'none',
                  background: sortBy === key ? 'rgba(100,180,220,0.12)' : 'transparent',
                  color: sortBy === key ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 9,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {key}
              </button>
            ))}
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <MobileStateView query={intelQuery} emptyMessage="No alerts in this category" />
            {intelQuery.isSuccess &&
              sortedItems.map((item) => (
                <MobileAlertCard
                  key={item.id}
                  item={item}
                  onTap={handleAlertTap}
                  isSelected={selectedAlertId === item.id}
                />
              ))}
          </div>
        </div>
      )}

      {/* Source health -- visible at 100% */}
      {currentSnap >= 100 && categoryMetrics && (
        <div
          style={{
            padding: '12px var(--space-content-padding, 12px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 9,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.3)',
              marginBottom: 8,
            }}
          >
            Source Health
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <SourcePill
              label={`${categoryMetrics.activeSources}/${categoryMetrics.sourceCount} active`}
              ok={categoryMetrics.activeSources > 0}
            />
            {categoryMetrics.geographicRegions.slice(0, 3).map((region) => (
              <SourcePill key={region} label={region} ok />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 16,
          fontWeight: 700,
          color: highlight ? '#ef4444' : 'rgba(255,255,255,0.7)',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function SourcePill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 4,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 10,
        color: 'rgba(255,255,255,0.4)',
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: ok ? '#22c55e' : '#ef4444',
        }}
      />
      {label}
    </span>
  )
}
