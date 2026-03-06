/**
 * Launch page -- the main spatial mission-control entry point.
 *
 * Renders the ZUI engine (SpatialViewport + SpatialCanvas) with the
 * Coverage Grid: live TarvaRI intel category cards in a CSS Grid,
 * over an ambient dot grid with periodic radial pulse.
 *
 * WS-2.1: Uses MorphOrchestrator to coordinate the coverage grid and
 * category icon grid across semantic zoom levels. Selection state is
 * managed by the UI store morph state machine, not local component state.
 * Coverage metrics come from useCoverageMetrics() (TanStack Query).
 *
 * Composes the Navigation HUD overlay (minimap, breadcrumb, zoom indicator)
 * and command palette outside the spatial canvas for fixed-position display.
 *
 * @module (launch)/page
 * @see WS-1.1 Deliverable 14
 * @see WS-1.2 Launch Atrium
 * @see WS-1.4 Navigation Instruments
 * @see WS-2.1 Coverage Grid
 * @see WS-3.3 Command Palette (replaces CommandPaletteStub)
 */

'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'

const CoverageMapDynamic = dynamic(
  () => import('@/components/coverage/CoverageMap').then((mod) => ({ default: mod.CoverageMap })),
  { ssr: false },
)

import { SpatialViewport } from '@/components/spatial/SpatialViewport'
import { SpatialCanvas } from '@/components/spatial/SpatialCanvas'
import { MorphOrchestrator } from '@/components/districts/morph-orchestrator'
import { DotGrid } from '@/components/districts/dot-grid'
import { NavigationHUD } from '@/components/spatial/NavigationHUD'
import { Minimap } from '@/components/spatial/Minimap'
import { ZoomIndicator } from '@/components/spatial/ZoomIndicator'
import { SpatialBreadcrumb } from '@/components/ui/SpatialBreadcrumb'
import { CommandPalette } from '@/components/spatial/CommandPalette'
import { MapLedger } from '@/components/coverage/MapLedger'
import {
  EnrichmentLayer,
  ZoomGate,
  HaloGlow,
  RangeRings,
  CoordinateOverlays,
  SystemStatusPanel,
  FeedPanel,
  SignalPulseMonitor,
  ActivityTicker,
  HorizonScanLine,
  DeepZoomDetails,
  SectorGrid,
  EdgeFragments,
  MicroChronometer,
  SessionTimecode,
  CalibrationMarks,
  TopTelemetryBar,
  BottomStatusStrip,
} from '@/components/ambient'
import { DistrictViewOverlay } from '@/components/district-view'
import { usePanPause } from '@/hooks/use-pan-pause'
import {
  useKeyboardShortcuts,
  type KeyboardShortcutConfig,
} from '@/hooks/use-keyboard-shortcuts'
import { useNarrationCycle } from '@/hooks/use-narration-cycle'
import { useAttentionChoreography } from '@/hooks/use-attention-choreography'
import { useEnrichmentCycle } from '@/hooks/use-enrichment-cycle'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { ColorSchemeSwitcher } from '@/components/ui/ColorSchemeSwitcher'
import { returnToHub, flyToAlertDetail, returnFromAlertDetail } from '@/lib/spatial-actions'
import { KNOWN_CATEGORIES } from '@/lib/interfaces/coverage'
import { buildAllGridItems, type CategoryGridItem } from '@/lib/interfaces/coverage'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { useCoverageMapData } from '@/hooks/use-coverage-map-data'
import { useCoverageStore, syncCoverageFromUrl, syncCategoriesToUrl, syncViewModeToUrl, timePresetToStartDate } from '@/stores/coverage.store'
import type { TimePreset } from '@/stores/coverage.store'
import { CoverageOverviewStats } from '@/components/coverage/CoverageOverviewStats'
import { ViewModeToggle } from '@/components/coverage/ViewModeToggle'
import { TimeRangeSelector } from '@/components/coverage/TimeRangeSelector'
import { GRID_WIDTH, GRID_HEIGHT } from '@/components/coverage/CoverageGrid'
import type { ViewMode } from '@/lib/interfaces/intel-bundles'
import { useIntelBundles } from '@/hooks/use-intel-bundles'
import type { MapMarker } from '@/lib/coverage-utils'
import { TriageRationalePanel } from '@/components/coverage/TriageRationalePanel'
import { GeoSummaryPanel } from '@/components/coverage/GeoSummaryPanel'
import { AlertDetailPanel } from '@/components/coverage/AlertDetailPanel'
import { PriorityFeedStrip } from '@/components/coverage/PriorityFeedStrip'
import { ThreatPictureCard } from '@/components/coverage/ThreatPictureCard'
import { PriorityFeedPanel } from '@/components/coverage/PriorityFeedPanel'
import { useRealtimePriorityAlerts } from '@/hooks/use-realtime-priority-alerts'
import { useNotificationDispatch } from '@/hooks/use-notification-dispatch'
import type { SearchResult } from '@/hooks/use-intel-search'
import { useThreatPicture } from '@/hooks/use-threat-picture'

import '@/styles/atrium.css'
import '@/styles/morph.css'
import '@/styles/constellation.css'
import '@/styles/enrichment.css'
import '@/styles/district-view.css'
import '@/styles/coverage.css'

// ---------------------------------------------------------------------------
// Phase 3 side-effect hooks (mounted once, no UI)
// ---------------------------------------------------------------------------


function Phase3Effects() {
  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)
  useNarrationCycle(effectsEnabled)
  useAttentionChoreography()
  useEnrichmentCycle()
  return null
}

// ---------------------------------------------------------------------------
// Reduced motion detection
// ---------------------------------------------------------------------------

function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---------------------------------------------------------------------------
// URL-based initial district loading
// ---------------------------------------------------------------------------

/**
 * On initial page load, if the URL contains `?district={id}`,
 * skip animation and render directly in the `settled` state.
 */
function useInitialDistrictFromUrl(): void {
  const startMorph = useUIStore((s) => s.startMorph)
  const setMorphPhase = useUIStore((s) => s.setMorphPhase)
  const phase = useUIStore((s) => s.morph.phase)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const districtParam = url.searchParams.get('district')

    if (
      districtParam &&
      phase === 'idle' &&
      KNOWN_CATEGORIES.some((c) => c.id === districtParam)
    ) {
      // Skip animation: start morph then immediately jump to settled
      startMorph(districtParam)
      setMorphPhase('settled')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run once on mount
  }, [])
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function DesktopView() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const isPanActive = usePanPause()
  const prefersReducedMotion = usePrefersReducedMotion()

  // URL-based initial district (legacy compatibility)
  useInitialDistrictFromUrl()

  // Real-time P1/P2 notifications (WS-2.4 + WS-2.5)
  const { notify } = useNotificationDispatch()
  useRealtimePriorityAlerts({
    onAlert: (payload) => {
      notify({
        id: payload.id,
        title: payload.title,
        priority: (payload.operational_priority ?? 'P2') as 'P1' | 'P2',
        severity: payload.severity,
        category: payload.category,
        ingestedAt: payload.ingested_at,
      })
    },
  })

  // Coverage data (WS-2.1) + threat picture (WS-4.1)
  const { data: coverageMetrics, isLoading: isMetricsLoading } = useCoverageMetrics()
  const { data: threatPicture } = useThreatPicture()
  const selectedCategories = useCoverageStore((s) => s.selectedCategories)
  const toggleCategory = useCoverageStore((s) => s.toggleCategory)
  const clearSelection = useCoverageStore((s) => s.clearSelection)
  const viewMode = useCoverageStore((s) => s.viewMode)
  const setViewMode = useCoverageStore((s) => s.setViewMode)
  const mapTimePreset = useCoverageStore((s) => s.mapTimePreset)
  const setMapTimePreset = useCoverageStore((s) => s.setMapTimePreset)
  const customTimeStart = useCoverageStore((s) => s.customTimeStart)
  const customTimeEnd = useCoverageStore((s) => s.customTimeEnd)
  const setCustomTimeRange = useCoverageStore((s) => s.setCustomTimeRange)

  const mapFilters = useMemo(() => {
    const f: { categories?: string[]; startDate?: string; endDate?: string } = {}
    if (selectedCategories.length > 0) f.categories = selectedCategories
    if (mapTimePreset === 'custom') {
      if (customTimeStart) f.startDate = customTimeStart
      if (customTimeEnd) f.endDate = customTimeEnd
    } else if (mapTimePreset !== 'all') {
      f.startDate = timePresetToStartDate(mapTimePreset)
    }
    return Object.keys(f).length > 0 ? f : undefined
  }, [selectedCategories, mapTimePreset, customTimeStart, customTimeEnd])

  const { data: mapMarkers = [], isLoading: isMapLoading } = useCoverageMapData(mapFilters)

  // Intel bundles (data view modes)
  const { data: bundles = [], isLoading: isBundlesLoading } = useIntelBundles(viewMode)
  const selectedBundleId = useCoverageStore((s) => s.selectedBundleId)
  const setSelectedBundleId = useCoverageStore((s) => s.setSelectedBundleId)

  // Compute display markers based on view mode
  const displayMarkers: MapMarker[] = useMemo(() => {
    if (viewMode === 'raw') return mapMarkers

    // Bundle modes: convert bundle representative_coordinates to MapMarker[]
    const bundleMarkers: MapMarker[] = []
    for (const b of bundles) {
      const coords = b.bundle.representative_coordinates
      if (!coords || coords.lat == null || coords.lon == null) continue
      bundleMarkers.push({
        id: b.bundle.id,
        lat: coords.lat,
        lng: coords.lon,
        title: b.bundle.title ?? `${b.bundle.final_severity} Bundle`,
        severity: b.bundle.final_severity,
        category: b.bundle.categories?.[0] ?? 'bundle',
        sourceId: '',
        ingestedAt: b.bundle.created_at,
        operationalPriority: b.operationalPriority,
      })
    }
    return bundleMarkers
  }, [viewMode, mapMarkers, bundles])

  const isDisplayLoading = viewMode === 'raw' ? isMapLoading : isBundlesLoading

  const viewModeCounts = useMemo(
    () => ({
      'triaged': bundles.filter((b) => b.bundle.status === 'approved').length,
      'all-bundles': bundles.length,
      'raw': coverageMetrics?.totalAlerts ?? 0,
    }),
    [bundles, coverageMetrics],
  )

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode)
      syncViewModeToUrl(mode)
    },
    [setViewMode],
  )

  const handleSelectBundle = useCallback(
    (id: string) => {
      setSelectedBundleId(selectedBundleId === id ? null : id)
    },
    [setSelectedBundleId, selectedBundleId],
  )

  const handleCloseRationale = useCallback(() => {
    setSelectedBundleId(null)
  }, [setSelectedBundleId])

  const selectedBundle = useMemo(
    () => bundles.find((b) => b.bundle.id === selectedBundleId) ?? null,
    [bundles, selectedBundleId],
  )

  // INSPECT: map alert detail panel
  const selectedMapAlertId = useCoverageStore((s) => s.selectedMapAlertId)
  const selectMapAlert = useCoverageStore((s) => s.selectMapAlert)
  const clearMapAlert = useCoverageStore((s) => s.clearMapAlert)

  const handleInspect = useCallback(
    (id: string, category: string, basic: { title: string; severity: string; ingestedAt: string }) => {
      selectMapAlert(id, category, basic)
      flyToAlertDetail()
    },
    [selectMapAlert],
  )

  const handleCloseInspect = useCallback(() => {
    // Read preFlyCamera fresh from store to avoid stale closure
    const storedCamera = useCoverageStore.getState().preFlyCamera
    clearMapAlert()
    returnFromAlertDetail(storedCamera)
  }, [clearMapAlert])

  // Geo summary panel (WS-4.5 + WS-4.3)
  const openGeoSummary = useCoverageStore((s) => s.openGeoSummary)
  const geoSummaryOpen = useCoverageStore((s) => s.geoSummaryOpen)
  const closeGeoSummary = useCoverageStore((s) => s.closeGeoSummary)
  const handleOpenThreatPicture = useCallback(() => {
    openGeoSummary()
  }, [openGeoSummary])

  const startMorph = useUIStore((s) => s.startMorph)
  const setDistrictPreselectedAlertId = useCoverageStore((s) => s.setDistrictPreselectedAlertId)

  const handleViewDistrict = useCallback(
    (category: string) => {
      // Capture the alert ID before clearing, store in dedicated field that
      // persists through the ~600ms morph animation until the overlay reads it
      const alertId = useCoverageStore.getState().selectedMapAlertId
      if (alertId) setDistrictPreselectedAlertId(alertId)
      clearMapAlert()
      startMorph(category)
    },
    [clearMapAlert, startMorph, setDistrictPreselectedAlertId],
  )

  // Search result -> fast morph navigation (WS-3.3)
  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      setDistrictPreselectedAlertId(result.id)
      startMorph(result.category, { fast: true })
    },
    [setDistrictPreselectedAlertId, startMorph],
  )

  // Filter toggle: add/remove category from filter set
  const handleFilter = useCallback(
    (id: string) => {
      toggleCategory(id)
      // Sync URL after toggle -- read fresh state
      const next = useCoverageStore.getState().selectedCategories
      syncCategoriesToUrl(next)
    },
    [toggleCategory],
  )

  const handleClearFilter = useCallback(() => {
    clearSelection()
    syncCategoriesToUrl([])
  }, [clearSelection])

  // Build trend map from threat picture data (WS-4.4)
  const trendMap = useMemo(() => {
    if (!threatPicture?.byCategory?.length) return undefined
    return new Map(threatPicture.byCategory.map((t) => [t.category, t.trend]))
  }, [threatPicture])

  // Build grid items for all 15 categories, merging live metrics + trend data
  const gridItems: CategoryGridItem[] = useMemo(
    () => buildAllGridItems(coverageMetrics?.byCategory ?? [], trendMap),
    [coverageMetrics, trendMap],
  )

  // URL sync for category selection
  useEffect(() => {
    syncCoverageFromUrl()
  }, [])

  // Auth
  const logout = useAuthStore((s) => s.logout)

  // Settings-gated HUD visibility
  const minimapVisible = useSettingsStore((s) => s.minimapVisible)
  const breadcrumbVisible = useSettingsStore((s) => s.breadcrumbVisible)

  // Hide peripheral world elements during morph
  const morphPhase = useUIStore((s) => s.morph.phase)
  const isMorphActive = morphPhase !== 'idle'

  // Keyboard shortcuts (WS-1.4)
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)

  const shortcuts: KeyboardShortcutConfig[] = useMemo(
    () => [
      {
        key: 'Home',
        handler: returnToHub,
        label: 'Return to Hub',
      },
      {
        key: 'k',
        meta: true,
        preventDefault: true,
        handler: toggleCommandPalette,
        label: 'Toggle Command Palette',
      },
      // Note: Escape for morph reverse is handled by useMorphChoreography.
      // Priority chain: INSPECT detail > triage panel > priority feed > geo panel > command palette.
      {
        key: 'Escape',
        handler: () => {
          if (selectedMapAlertId) {
            handleCloseInspect()
          } else if (selectedBundleId) {
            setSelectedBundleId(null)
          } else if (useCoverageStore.getState().priorityFeedExpanded) {
            useCoverageStore.getState().setPriorityFeedExpanded(false)
          } else if (geoSummaryOpen) {
            closeGeoSummary()
          } else {
            setCommandPaletteOpen(false)
          }
        },
        label: 'Close Panel',
      },
    ],
    [toggleCommandPalette, setCommandPaletteOpen, selectedBundleId, setSelectedBundleId, selectedMapAlertId, handleCloseInspect, geoSummaryOpen, closeGeoSummary],
  )

  useKeyboardShortcuts(shortcuts)

  return (
    <>
      <SpatialViewport
        viewportRef={viewportRef}
        className={isPanActive ? '' : undefined}
        enableKeyboardShortcuts={false}
      >
        <SpatialCanvas>
          {/* Dot grid background layer -- sized large enough to cover the
              viewport at minimum zoom (0.08). At that zoom, a 1440px-wide
              viewport spans ~18000px of world space, so we use 20000x20000. */}
          <div
            className="absolute"
            style={{
              left: -10000,
              top: -10000,
              width: 20000,
              height: 20000,
              pointerEvents: 'none',
            }}
          >
            <DotGrid />
          </div>

          {/* Sector grid: faint 2000px grid with sector labels (SEC A1..D4).
              Self-gated to Z1+. Sits behind everything else in world-space. */}
          <SectorGrid />

          {/* Enrichment layer: ambient glow + range rings behind capsules.
              Gated by effectsEnabled in settings store. Positioned at
              world-space origin (0,0) to align with capsule ring center.
              Blurs subtly during morph to focus attention on selected card. */}
          <EnrichmentLayer isPanning={isPanActive}>
            <div
              className="morph-ambient-fade"
              data-morph-active={isMorphActive ? 'true' : 'false'}
            >
              <HaloGlow />
              <MicroChronometer />
              <RangeRings />
              <ZoomGate show={['Z1', 'Z2']}>
                <CoordinateOverlays />
              </ZoomGate>
              {/* ConnectionPaths removed (old ring layout) */}
            </div>
            {/* Horizon scan line moved to fixed viewport overlay below */}
          </EnrichmentLayer>

          {/* Map toolbar: view mode toggle (left) + time range selector (right) */}
          <ZoomGate show={['Z1', 'Z2', 'Z3']}>
            <div
              className="absolute"
              style={{
                left: -(GRID_WIDTH / 2) - 230 + 125,
                top: -(GRID_HEIGHT / 2) - 900 - 40 + 400 - 54,
                width: GRID_WIDTH + 230,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                pointerEvents: 'auto',
                zIndex: 2,
              }}
            >
              <ViewModeToggle value={viewMode} onChange={handleViewModeChange} counts={viewModeCounts} />
              <TimeRangeSelector
                value={mapTimePreset}
                customStart={customTimeStart}
                customEnd={customTimeEnd}
                onPresetChange={setMapTimePreset}
                onCustomChange={setCustomTimeRange}
              />
            </div>
          </ZoomGate>

          {/* Priority feed strip -- persistent P1/P2 summary, above toolbar.
              Own ZoomGate (Z1+), outside morph-panels-scatter for morph independence. */}
          <ZoomGate show={['Z1', 'Z2', 'Z3']}>
            <div
              className="absolute"
              style={{
                left: -(GRID_WIDTH / 2) - 230 + 125,
                top: -(GRID_HEIGHT / 2) - 900 - 40 + 400 - 54 - 48,
                width: GRID_WIDTH + 230,
                pointerEvents: 'auto',
              }}
            >
              <PriorityFeedStrip />
            </div>
          </ZoomGate>

          {/* Global coverage map -- spans from stats left edge to grid right edge, Z1+ only */}
          <ZoomGate show={['Z1', 'Z2', 'Z3']}>
            <div
              className="absolute"
              style={{
                left: -(GRID_WIDTH / 2) - 230 + 125,
                top: -(GRID_HEIGHT / 2) - 900 - 40 + 400,
                width: GRID_WIDTH + 230,
                height: 900,
                pointerEvents: 'auto',
              }}
            >
              <CoverageMapDynamic
                categoryId="all"
                categoryName="All Categories"
                markers={displayMarkers}
                isLoading={isDisplayLoading}
                overview
                onInspect={handleInspect}
              />
            </div>
          </ZoomGate>

          {/* INSPECT alert detail panel -- right of map, Z1+ only */}
          <ZoomGate show={['Z1', 'Z2', 'Z3']}>
            <div
              className="absolute"
              style={{
                left: 1950,
                top: -480,
                pointerEvents: 'none',
              }}
            >
              <AlertDetailPanel
                onClose={handleCloseInspect}
                onViewDistrict={handleViewDistrict}
              />
            </div>
          </ZoomGate>

          {/* Coverage overview stats -- positioned to the left of the grid, Z1+ only */}
          <ZoomGate show={['Z1', 'Z2', 'Z3']}>
            <div
              className="absolute"
              style={{
                left: -(GRID_WIDTH / 2) - 230 + 125,
                top: -(GRID_HEIGHT / 2) + 400,
                width: 200,
                pointerEvents: 'auto',
              }}
            >
              <CoverageOverviewStats
                categoriesCovered={coverageMetrics?.categoriesCovered ?? 0}
                totalAlerts={coverageMetrics?.totalAlerts ?? 0}
                isLoading={isMetricsLoading}
                isAllSelected={selectedCategories.length === 0}
                onClearFilter={handleClearFilter}
                onOpenThreatPicture={handleOpenThreatPicture}
              />
            </div>
          </ZoomGate>

          {/* Content area: Category grid is always visible. Bundle grid
              renders above it when in triaged/all-bundles mode.
              Re-enable pointer-events here because SpatialCanvas disables them
              (per Q4: children re-enable individually). */}
          <div data-panning={isPanActive ? 'true' : 'false'} style={{ pointerEvents: 'auto', transform: 'translate(125px, 400px)' }}>
            <MorphOrchestrator
              items={gridItems}
              metrics={coverageMetrics}
              prefersReducedMotion={prefersReducedMotion}
              isPanning={isPanActive}
              filteredIds={selectedCategories}
              onFilter={handleFilter}
            />
          </div>

          {/* Phase C data panels: push outward + blur during morph. */}
          <div
            className="morph-panels-scatter"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
            data-panning={isPanActive ? 'true' : 'false'}
            data-morph-active={isMorphActive ? 'true' : 'false'}
          >
            <ZoomGate show={['Z1', 'Z2']}>
              <SystemStatusPanel />
            </ZoomGate>
            <ZoomGate show={['Z1', 'Z2']}>
              <FeedPanel />
            </ZoomGate>
            <ZoomGate show={['Z1', 'Z2']}>
              <SignalPulseMonitor />
            </ZoomGate>
            <ZoomGate show={['Z1', 'Z2']}>
              <ActivityTicker />
            </ZoomGate>
          </div>

          {/* Phase D: Deep-zoom discovery details -- fade during morph. */}
          <div
            className="morph-ambient-fade"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
            data-panning={isPanActive ? 'true' : 'false'}
            data-morph-active={isMorphActive ? 'true' : 'false'}
          >
            <DeepZoomDetails />
            <EdgeFragments />
          </div>

          {/* Threat Picture card: upper-left, above Intel Monitoring, left of map */}
          <ZoomGate show={['Z1', 'Z2', 'Z3']}>
            <div
              className="absolute"
              style={{
                left: -1350,
                top: -(GRID_HEIGHT / 2) - 900 - 40 + 400,
                width: 320,
                pointerEvents: 'auto',
              }}
            >
              <ThreatPictureCard onClick={handleOpenThreatPicture} />
            </div>
          </ZoomGate>

          {/* Map Ledger: positioned to the right of the map, top-aligned */}
          <ZoomGate show={['Z1', 'Z2', 'Z3']}>
            <div
              className="absolute"
              style={{
                left: -(GRID_WIDTH / 2) - 230 + 125 + GRID_WIDTH + 230 + 12,
                top: -(GRID_HEIGHT / 2) - 900 - 40 + 400,
                pointerEvents: 'auto',
              }}
            >
              <MapLedger />
            </div>
          </ZoomGate>
        </SpatialCanvas>
      </SpatialViewport>

      {/* District view overlay (fixed, z-30) -- self-gates on morph phase */}
      <DistrictViewOverlay />

      {/* Triage rationale slide-out panel (fixed, z-45) */}
      <TriageRationalePanel item={selectedBundle} onClose={handleCloseRationale} />

      {/* Geographic intelligence slide-over panel (fixed, z-42) */}
      <GeoSummaryPanel onClose={closeGeoSummary} />

      {/* Priority feed expanded panel (fixed, z-35) */}
      <PriorityFeedPanel />

      {/* Navigation HUD overlay (fixed, z-40) */}
      <NavigationHUD isPanActive={isPanActive}>
        {/* Tarva white logo -- top-left corner */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/images/logo/tarva-white-logo.svg`}
          alt="Tarva"
          className="pointer-events-none fixed left-4 opacity-40"
          style={{ height: 14, top: 21, transform: 'translateY(-50%)' }}
        />
        {breadcrumbVisible && <SpatialBreadcrumb />}
        {minimapVisible && <Minimap />}
        {/* Bottom-left: logout button (vertical pill, matches district back button) */}
        <button
          onClick={logout}
          className="pointer-events-auto"
          style={{
            position: 'fixed',
            bottom: 40,
            left: 12,
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 6px',
            borderRadius: 8,
            border: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(255, 255, 255, 0.03)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.3)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            lineHeight: 1,
            writingMode: 'vertical-lr' as const,
            transition: 'color 200ms ease, background 200ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
          }}
          aria-label="Logout"
        >
          LOGOUT
        </button>
      </NavigationHUD>

      {/* Top-right: theme toggle + zoom indicator, vertically centered in header */}
      <div
        className="pointer-events-auto fixed right-4 z-40 flex items-center gap-2"
        style={{ top: 21, transform: 'translateY(-50%)' }}
      >
        <ColorSchemeSwitcher />
        <ZoomIndicator />
      </div>

      {/* Fixed-position viewport overlays: scan line, timecode, calibration */}
      <HorizonScanLine />
      <SessionTimecode />
      <CalibrationMarks />
      <TopTelemetryBar />
      <BottomStatusStrip />

      {/* Command palette (outside HUD, has its own z-50 via Dialog) */}
      <CommandPalette onRefresh={async () => { /* WS-1.5 telemetry refresh */ }} onSearchResultSelect={handleSearchResultSelect} />

      {/* Phase 3 background effects (narration cycle + attention choreography) */}
      <Phase3Effects />
    </>
  )
}
