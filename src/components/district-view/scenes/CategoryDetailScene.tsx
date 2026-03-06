/**
 * CategoryDetailScene -- data-driven detail view for a single intel category.
 *
 * Renders four sections in a two-column layout:
 *   Left column:   Filtered alert list (full height, scrollable, sortable)
 *   Right column:  Severity breakdown → Coverage map (~70%) → Source health table (~30%)
 *
 * Clicking an alert in the list selects it, and the dock panel (DistrictViewDock)
 * shows its full detail (summary, event type, confidence, geo scope, timestamps).
 *
 * @module CategoryDetailScene
 * @see WS-3.1 Section 4.1
 */

'use client'

import { memo, useMemo, useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { MapRef } from 'react-map-gl/maplibre'

import { cn } from '@/lib/utils'
import {
  getCategoryMeta,
  SEVERITY_LEVELS,
  SEVERITY_COLORS,
  PRIORITY_LEVELS,
  isPriorityVisible,
  type SeverityLevel,
  type OperationalPriority,
} from '@/lib/interfaces/coverage'
import { useCoverageStore, syncPrioritiesToUrl } from '@/stores/coverage.store'
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { useCoverageMapData, type CoverageMapFilters } from '@/hooks/use-coverage-map-data'
import { useCategoryIntel, type CategoryIntelItem } from '@/hooks/use-category-intel'
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
// Severity ordering
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<string, number> = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
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

function formatTimestamp(iso: string | null): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

// ---------------------------------------------------------------------------
// Section A: Filtered Alert List (uses CategoryIntelItem for richer data)
// ---------------------------------------------------------------------------

type SortField = 'time' | 'severity'

const MAX_DISPLAY_ITEMS = 50

function AlertList({
  items,
  isLoading,
  isError,
  displayName,
  selectedId,
  onSelect,
}: {
  items: CategoryIntelItem[] | undefined
  isLoading: boolean
  isError: boolean
  displayName: string
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const [sortBy, setSortBy] = useState<SortField>('severity')
  const listRef = useRef<HTMLDivElement>(null)
  const selectedPriorities = useCoverageStore((s) => s.selectedPriorities)
  const togglePriority = useCoverageStore((s) => s.togglePriority)
  const clearPriorities = useCoverageStore((s) => s.clearPriorities)
  const hasPriorityFilter = selectedPriorities.length > 0

  // Auto-scroll to pre-selected alert when it changes
  useEffect(() => {
    if (!selectedId || !listRef.current) return
    const el = listRef.current.querySelector(`[data-alert-id="${selectedId}"]`)
    if (el) {
      // Small delay to let the list render first
      requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
    }
  }, [selectedId])

  const sorted = useMemo(() => {
    if (!items) return []
    return [...items]
      .filter((item) => {
        if (hasPriorityFilter) {
          return item.operationalPriority != null && selectedPriorities.includes(item.operationalPriority)
        }
        // Default visibility: hide P4 in list context unless explicitly filtered
        if (item.operationalPriority) {
          return isPriorityVisible(item.operationalPriority, 'list')
        }
        return true // null priority = show by default
      })
      .sort((a, b) => {
        if (sortBy === 'severity') {
          const sa = SEVERITY_ORDER[a.severity] ?? 4
          const sb = SEVERITY_ORDER[b.severity] ?? 4
          if (sa !== sb) return sa - sb
          return new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime()
        }
        return new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime()
      })
      .slice(0, MAX_DISPLAY_ITEMS)
  }, [items, sortBy, hasPriorityFilter, selectedPriorities])

  const totalCount = items?.length ?? 0

  return (
    <div className="flex h-full flex-col" aria-busy={isLoading}>
      {/* Section header with priority filter + sort toggle */}
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => { if (hasPriorityFilter) { clearPriorities(); syncPrioritiesToUrl([]) } }}
          className="font-mono text-[9px] font-medium tracking-[0.1em] uppercase cursor-pointer"
          style={{ color: hasPriorityFilter ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.15)' }}
          title={hasPriorityFilter ? 'Clear priority filter' : undefined}
        >
          ALERTS{hasPriorityFilter ? ` (${sorted.length} of ${totalCount})` : ''}
        </button>

        {/* Priority filter buttons */}
        <div className="flex gap-1">
          {PRIORITY_LEVELS.map((p) => {
            const isActive = selectedPriorities.includes(p)
            return (
              <button
                key={p}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  togglePriority(p)
                  const next = isActive
                    ? selectedPriorities.filter((x) => x !== p)
                    : [...selectedPriorities, p]
                  syncPrioritiesToUrl(next as OperationalPriority[])
                }}
                className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                style={{
                  color: isActive ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'}`,
                }}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />

        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setSortBy('severity')}
            className="rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
            style={{
              color: sortBy === 'severity' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
              backgroundColor: sortBy === 'severity' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: `1px solid ${sortBy === 'severity' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'}`,
            }}
          >
            Severity
          </button>
          <button
            type="button"
            onClick={() => setSortBy('time')}
            className="rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
            style={{
              color: sortBy === 'time' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)',
              backgroundColor: sortBy === 'time' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: `1px solid ${sortBy === 'time' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)'}`,
            }}
          >
            Time
          </button>
        </div>
      </div>

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
          <div ref={listRef} role="list" className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {sorted.map((item) => {
              const severityColor =
                SEVERITY_COLORS[item.severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown
              const isSelected = selectedId === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="listitem"
                  data-alert-id={item.id}
                  onClick={() => onSelect(isSelected ? null : item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left',
                    'transition-colors duration-150 cursor-pointer',
                  )}
                  style={{
                    backgroundColor: isSelected
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(255, 255, 255, 0.02)',
                    borderLeft: isSelected ? `2px solid ${severityColor}` : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'
                  }}
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
                    {item.severity}
                  </span>

                  {/* Priority badge -- P1/P2 show shape; P3/P4 return null */}
                  {item.operationalPriority && (
                    <PriorityBadge priority={item.operationalPriority} size="sm" />
                  )}

                  {/* Title */}
                  <span
                    className="min-w-0 flex-1 truncate font-mono text-[11px]"
                    style={{ color: isSelected ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.25)' }}
                  >
                    {item.title}
                  </span>

                  {/* Relative time */}
                  <span
                    className="shrink-0 font-mono text-[9px]"
                    style={{ color: 'rgba(255, 255, 255, 0.12)' }}
                  >
                    {relativeTime(item.ingestedAt)}
                  </span>
                </button>
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
  /** Currently selected alert ID (shown in dock). */
  readonly selectedAlertId: string | null
  /** Callback when an alert is selected/deselected. */
  readonly onSelectAlert: (id: string | null) => void
  /** Ref forwarded to the CoverageMap for bbox reading. */
  readonly mapRef?: React.RefObject<MapRef | null>
  /** Source filter applied from the district filter panel. */
  readonly sourceFilter?: string | null
  /** Current bounding box from viewport filtering. */
  readonly currentBbox?: [number, number, number, number] | null
}

export const CategoryDetailScene = memo(function CategoryDetailScene({
  categoryId,
  dockSide,
  selectedAlertId,
  onSelectAlert,
  mapRef: externalMapRef,
  sourceFilter,
  currentBbox,
}: CategoryDetailSceneProps) {
  const meta = getCategoryMeta(categoryId)

  const mapFilters: CoverageMapFilters = useMemo(() => {
    const f: CoverageMapFilters = { category: categoryId }
    if (sourceFilter) f.sourceKey = sourceFilter
    if (currentBbox) f.bbox = currentBbox
    return f
  }, [categoryId, sourceFilter, currentBbox])

  const {
    data: markers,
    isLoading: markersLoading,
  } = useCoverageMapData(mapFilters)

  const {
    data: intelItems,
    isLoading: intelLoading,
    isError: intelError,
  } = useCategoryIntel(categoryId)

  const { isLoading: metricsLoading } = useCoverageMetrics()

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
          gridTemplateRows: '1fr',
        }}
      >
        {/* Left column: Alert List (full height) */}
        <div className="min-h-0 overflow-hidden">
          <AlertList
            items={intelItems}
            isLoading={intelLoading}
            isError={intelError}
            displayName={meta.displayName}
            selectedId={selectedAlertId}
            onSelect={onSelectAlert}
          />
        </div>

        {/* Right column: Severity → Map (70%) → Sources (30%) */}
        <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
          {/* Severity Breakdown */}
          <div className="shrink-0">
            <SeverityBreakdown markers={markers} />
          </div>

          {/* Coverage Map (~70% of remaining space) */}
          <div className="min-h-0" style={{ flex: '7 1 0%' }}>
            <div style={{ height: '100%', position: 'relative' }}>
              <CoverageMap
                categoryId={categoryId}
                categoryName={meta.displayName}
                markers={markers ?? []}
                isLoading={markersLoading}
                onMarkerClick={onSelectAlert}
                selectedMarkerId={selectedAlertId}
                externalMapRef={externalMapRef}
              />
            </div>
          </div>

          {/* Source Health Table (~30% of remaining space) */}
          <div className="min-h-0 overflow-hidden" style={{ flex: '3 1 0%' }}>
            <SourceHealthTable
              categoryId={categoryId}
              isLoading={metricsLoading}
              displayName={meta.displayName}
            />
          </div>
        </div>
      </div>
    </div>
  )
})

// Re-export for dock panel use
export { formatTimestamp }
export type { CategoryIntelItem } from '@/hooks/use-category-intel'
