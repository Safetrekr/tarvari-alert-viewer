/**
 * CategoryDetailScene -- data-driven detail view for a single intel category.
 *
 * Renders four sections in a two-column, two-row layout:
 *   A (top-left):     Filtered alert list (scrollable, sorted by ingestedAt desc)
 *   B (top-right):    Severity breakdown horizontal stacked bar + legend
 *   C (bottom-left):  Source health table
 *   D (bottom-right): Interactive MapLibre coverage map (WS-4.1)
 *
 * Data comes from `useCoverageMapData` (alerts/markers) and `useCoverageMetrics`
 * (source health), both filtered to the given `categoryId`.
 *
 * Replaces the 6 hand-crafted legacy ambient scenes (Decision 6).
 *
 * @module CategoryDetailScene
 * @see WS-3.1 Section 4.1
 */

'use client'

import { memo, useMemo } from 'react'
import dynamic from 'next/dynamic'

import { cn } from '@/lib/utils'
import {
  getCategoryMeta,
  SEVERITY_LEVELS,
  SEVERITY_COLORS,
  type SeverityLevel,
} from '@/lib/interfaces/coverage'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { useCoverageMapData } from '@/hooks/use-coverage-map-data'
import type { MapMarker } from '@/lib/coverage-utils'
import type { PanelSide } from '@/lib/morph-types'

// ---------------------------------------------------------------------------
// Dynamic map import (SSR disabled -- WebGL requires a browser)
// ---------------------------------------------------------------------------

function MapLoadingPlaceholder() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 200,
        borderRadius: 8,
        border: '1px dashed rgba(255, 255, 255, 0.06)',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.15)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Loading map...
      </span>
    </div>
  )
}

const CoverageMap = dynamic(
  () => import('@/components/coverage/CoverageMap').then((mod) => mod.CoverageMap),
  { ssr: false, loading: () => <MapLoadingPlaceholder /> },
)

// ---------------------------------------------------------------------------
// Status color map
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  staging: '#3b82f6',
  quarantine: '#eab308',
  disabled: '#6b7280',
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function relativeTime(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then

  if (Number.isNaN(diffMs) || diffMs < 0) return 'just now'

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Section A: Filtered Alert List
// ---------------------------------------------------------------------------

const MAX_DISPLAY_ITEMS = 50

function AlertList({
  markers,
  isLoading,
  isError,
  displayName,
}: {
  markers: MapMarker[] | undefined
  isLoading: boolean
  isError: boolean
  displayName: string
}) {
  const sorted = useMemo(() => {
    if (!markers) return []
    return [...markers]
      .sort((a, b) => new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime())
      .slice(0, MAX_DISPLAY_ITEMS)
  }, [markers])

  const totalCount = markers?.length ?? 0

  return (
    <div className="flex h-full flex-col" aria-busy={isLoading}>
      {/* Section header */}
      <span
        className="mb-3 block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
        style={{ color: 'rgba(255, 255, 255, 0.15)' }}
      >
        ALERTS
      </span>

      {/* Loading skeleton */}
      {isLoading && (
        <div role="list" className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              role="listitem"
              className="animate-pulse rounded-md"
              style={{
                height: 36,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <span
          className="font-mono text-[11px]"
          style={{ color: 'rgba(255, 255, 255, 0.2)' }}
        >
          Unable to load alerts
        </span>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sorted.length === 0 && (
        <span
          className="font-mono text-[11px]"
          style={{ color: 'rgba(255, 255, 255, 0.15)' }}
        >
          No alerts for {displayName}
        </span>
      )}

      {/* Alert items */}
      {!isLoading && !isError && sorted.length > 0 && (
        <>
          <div role="list" className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {sorted.map((marker) => {
              const severityColor =
                SEVERITY_COLORS[marker.severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown
              return (
                <div
                  key={marker.id}
                  role="listitem"
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2',
                    'bg-white/[0.02] hover:bg-white/[0.04]',
                    'transition-colors duration-150',
                  )}
                >
                  {/* Severity badge */}
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-[0.06em] uppercase"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${severityColor} 20%, transparent)`,
                      color: severityColor,
                      border: `1px solid color-mix(in srgb, ${severityColor} 30%, transparent)`,
                    }}
                  >
                    {marker.severity}
                  </span>

                  {/* Title */}
                  <span
                    className="min-w-0 flex-1 truncate font-mono text-[11px]"
                    style={{ color: 'rgba(255, 255, 255, 0.25)' }}
                  >
                    {marker.title}
                  </span>

                  {/* Relative time */}
                  <span
                    className="shrink-0 font-mono text-[9px]"
                    style={{ color: 'rgba(255, 255, 255, 0.12)' }}
                  >
                    {relativeTime(marker.ingestedAt)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Truncation footer */}
          {totalCount > MAX_DISPLAY_ITEMS && (
            <span
              className="mt-2 block font-mono text-[9px]"
              style={{ color: 'rgba(255, 255, 255, 0.12)' }}
            >
              Showing {MAX_DISPLAY_ITEMS} of {totalCount}
            </span>
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section B: Severity Breakdown
// ---------------------------------------------------------------------------

function SeverityBreakdown({ markers }: { markers: MapMarker[] | undefined }) {
  const severityCounts = useMemo(() => {
    if (!markers || markers.length === 0) return []
    return SEVERITY_LEVELS.map((level) => ({
      level,
      count: markers.filter((m) => m.severity === level).length,
      color: SEVERITY_COLORS[level],
    }))
  }, [markers])

  const total = severityCounts.reduce((sum, s) => sum + s.count, 0)

  const ariaDescription = severityCounts.length > 0
    ? `Severity breakdown: ${severityCounts.filter((s) => s.count > 0).map((s) => `${s.count} ${s.level}`).join(', ')}`
    : 'No severity data'

  return (
    <div className="flex h-full flex-col">
      {/* Section header */}
      <span
        className="mb-3 block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
        style={{ color: 'rgba(255, 255, 255, 0.15)' }}
      >
        SEVERITY
      </span>

      {severityCounts.length === 0 || total === 0 ? (
        <span
          className="font-mono text-[11px]"
          style={{ color: 'rgba(255, 255, 255, 0.15)' }}
        >
          No severity data
        </span>
      ) : (
        <div aria-label={ariaDescription}>
          {/* Stacked bar */}
          <div
            className="flex h-3 w-full overflow-hidden rounded-sm"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
          >
            {severityCounts.map(
              (s) =>
                s.count > 0 && (
                  <div
                    key={s.level}
                    style={{
                      width: `${(s.count / total) * 100}%`,
                      backgroundColor: s.color,
                      opacity: 0.7,
                    }}
                    title={`${s.level}: ${s.count}`}
                  />
                ),
            )}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {severityCounts.map((s) => (
              <div key={s.level} className="flex items-center gap-1.5">
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: s.color,
                    opacity: 0.7,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="font-mono text-[9px]"
                  style={{ color: 'rgba(255, 255, 255, 0.2)' }}
                >
                  {s.level}
                </span>
                <span
                  className="font-mono text-[11px]"
                  style={{ color: 'rgba(255, 255, 255, 0.25)' }}
                >
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section C: Source Health Table
// ---------------------------------------------------------------------------

function SourceHealthTable({
  categoryId,
  isLoading,
  displayName,
}: {
  categoryId: string
  isLoading: boolean
  displayName: string
}) {
  const { data: metrics } = useCoverageMetrics()

  const categorySources = useMemo(
    () => metrics?.sourcesByCoverage.filter((s) => s.category === categoryId) ?? [],
    [metrics, categoryId],
  )

  return (
    <div className="flex h-full flex-col" aria-busy={isLoading}>
      {/* Section header */}
      <span
        className="mb-3 block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
        style={{ color: 'rgba(255, 255, 255, 0.15)' }}
      >
        SOURCES
      </span>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-md"
              style={{
                height: 28,
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
              }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && categorySources.length === 0 && (
        <span
          className="font-mono text-[11px]"
          style={{ color: 'rgba(255, 255, 255, 0.15)' }}
        >
          No sources for {displayName}
        </span>
      )}

      {/* Table */}
      {!isLoading && categorySources.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <th
                  scope="col"
                  className="pb-2 text-left font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
                  style={{ color: 'rgba(255, 255, 255, 0.15)' }}
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="w-[80px] pb-2 text-left font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
                  style={{ color: 'rgba(255, 255, 255, 0.15)' }}
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="w-[100px] pb-2 text-left font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
                  style={{ color: 'rgba(255, 255, 255, 0.15)' }}
                >
                  Region
                </th>
                <th
                  scope="col"
                  className="w-[80px] pb-2 text-left font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
                  style={{ color: 'rgba(255, 255, 255, 0.15)' }}
                >
                  Frequency
                </th>
              </tr>
            </thead>
            <tbody>
              {categorySources.map((source) => (
                <tr
                  key={source.sourceKey}
                  className="hover:bg-white/[0.02] transition-colors duration-150"
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <td
                    className="py-1.5 pr-2 font-mono text-[11px]"
                    style={{ color: 'rgba(255, 255, 255, 0.25)' }}
                  >
                    {source.name}
                  </td>
                  <td className="w-[80px] py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          backgroundColor: STATUS_COLORS[source.status] ?? STATUS_COLORS.disabled,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: 'rgba(255, 255, 255, 0.2)' }}
                      >
                        {source.status}
                      </span>
                    </div>
                  </td>
                  <td
                    className="w-[100px] py-1.5 font-mono text-[11px]"
                    style={{ color: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    {source.geographicCoverage ?? '--'}
                  </td>
                  <td
                    className="w-[80px] py-1.5 font-mono text-[11px]"
                    style={{ color: 'rgba(255, 255, 255, 0.2)' }}
                  >
                    {source.updateFrequency ?? '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface CategoryDetailSceneProps {
  /** Category ID to display (e.g. 'seismic', 'weather'). */
  readonly categoryId: string
  /** Which side the dock panel is on (determines content area clearance). */
  readonly dockSide: PanelSide
}

export const CategoryDetailScene = memo(function CategoryDetailScene({
  categoryId,
  dockSide,
}: CategoryDetailSceneProps) {
  const meta = getCategoryMeta(categoryId)

  const {
    data: markers,
    isLoading: markersLoading,
    isError: markersError,
  } = useCoverageMapData({ category: categoryId })

  const { isLoading: metricsLoading } = useCoverageMetrics()

  // Content area clears the dock panel side (360px + 20px gap) and the
  // opposite side (80px for the back button), plus top (80px header)
  // and bottom (40px).
  const contentInset: React.CSSProperties = {
    position: 'absolute',
    top: 80,
    bottom: 40,
    [dockSide]: 380,
    [dockSide === 'right' ? 'left' : 'right']: 80,
    overflow: 'hidden',
  }

  return (
    <div style={contentInset}>
      <div
        className={cn(
          'grid h-full gap-4',
          'bg-[rgba(var(--ambient-ink-rgb),0.05)] backdrop-blur-[12px]',
          'rounded-lg border border-white/[0.06]',
          'p-5',
        )}
        style={{
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
        }}
      >
        {/* Section A: Alert List (top-left) */}
        <div className="min-h-0 overflow-hidden">
          <AlertList
            markers={markers}
            isLoading={markersLoading}
            isError={markersError}
            displayName={meta.displayName}
          />
        </div>

        {/* Section B: Severity Breakdown (top-right) */}
        <div className="min-h-0 overflow-hidden">
          <SeverityBreakdown markers={markers} />
        </div>

        {/* Section C: Source Health Table (bottom-left) */}
        <div className="min-h-0 overflow-hidden">
          <SourceHealthTable
            categoryId={categoryId}
            isLoading={metricsLoading}
            displayName={meta.displayName}
          />
        </div>

        {/* Section D: Coverage Map (bottom-right) */}
        <div className="min-h-0 overflow-hidden">
          <div style={{ minHeight: 280, height: '100%', position: 'relative' }}>
            <CoverageMap
              categoryId={categoryId}
              categoryName={meta.displayName}
              markers={markers ?? []}
              isLoading={markersLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
