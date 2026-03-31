'use client'

import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MobileShell } from '@/components/mobile/MobileShell'
import { MobileSituationTab } from '@/components/mobile/MobileSituationTab'
import { MobileThreatIndicator } from '@/components/mobile/MobileThreatIndicator'
import { MobileViewModeToggle } from '@/components/mobile/MobileViewModeToggle'
import { MobileMapFilterSheet } from '@/components/mobile/MobileMapFilterSheet'
import { MobileSettings } from '@/components/mobile/MobileSettings'
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet'
import { MobileCategoryDetail } from '@/components/mobile/MobileCategoryDetail'
import { MobileAlertDetail } from '@/components/mobile/MobileAlertDetail'
import { MobileBundleDetail } from '@/components/mobile/MobileBundleDetail'
import { MobilePriorityFeedSheet } from '@/components/mobile/MobilePriorityFeedSheet'
import { MobileBriefingDetail } from '@/components/mobile/MobileBriefingDetail'
import { MobileBriefingListSheet } from '@/components/mobile/MobileBriefingListSheet'
import { MobileIntelTab } from '@/components/mobile/MobileIntelTab'
import { MobileThreatPostureDetail } from '@/components/mobile/MobileThreatPostureDetail'
import { MobileRegionDetail } from '@/components/mobile/MobileRegionDetail'
import { MobileSearchOverlay } from '@/components/mobile/MobileSearchOverlay'
import { MobileIdleLockOverlay } from '@/components/mobile/MobileIdleLockOverlay'
import { MobileConnectionToast } from '@/components/mobile/MobileConnectionToast'
import { SHEET_CONFIGS } from '@/lib/interfaces/mobile'
import { useIdleLock } from '@/hooks/use-idle-lock'
import { useP1AudioAlert } from '@/hooks/use-p1-audio-alert'
import { useDataFreshnessMobile } from '@/hooks/use-data-freshness-mobile'
import { useConnectionToast } from '@/hooks/use-connection-toast'
import { useCoverageMapData } from '@/hooks/use-coverage-map-data'
import type { CoverageMapFilters } from '@/hooks/use-coverage-map-data'
import { useCategoryIntel } from '@/hooks/use-category-intel'
import { usePriorityFeed } from '@/hooks/use-priority-feed'
import { useCoverageStore } from '@/stores/coverage.store'
import {
  syncCategoriesToUrl,
  timePresetToStartDate,
} from '@/stores/coverage.store'
import { MobileStateView } from '@/components/mobile/MobileStateView'
import { useMobileMorphBridge } from '@/hooks/use-mobile-morph-bridge'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import type { GeoSummary } from '@/hooks/use-geo-summaries'
import type { DigestResponse } from '@/lib/interfaces/digest'

const MobileMapView = dynamic(
  () =>
    import('@/components/mobile/MobileMapView').then((m) => ({
      default: m.MobileMapView,
    })),
  { ssr: false },
)

// ---------------------------------------------------------------------------
// Map Tab Content
// ---------------------------------------------------------------------------

function MobileMapTabContent({ onFilterTap }: { onFilterTap: () => void }) {
  const selectedCategories = useCoverageStore((s) => s.selectedCategories)
  const viewMode = useCoverageStore((s) => s.viewMode)
  const setViewMode = useCoverageStore((s) => s.setViewMode)
  const mapTimePreset = useCoverageStore((s) => s.mapTimePreset)
  const customTimeStart = useCoverageStore((s) => s.customTimeStart)
  const customTimeEnd = useCoverageStore((s) => s.customTimeEnd)
  const selectedSeverities = useCoverageStore((s) => s.selectedSeverities)
  const selectedMapAlertId = useCoverageStore((s) => s.selectedMapAlertId)
  const selectedMapAlertBasic = useCoverageStore((s) => s.selectedMapAlertBasic)
  const selectedMapAlertCategory = useCoverageStore((s) => s.selectedMapAlertCategory)
  const selectMapAlert = useCoverageStore((s) => s.selectMapAlert)
  const clearMapAlert = useCoverageStore((s) => s.clearMapAlert)

  const mapFilters = useMemo<CoverageMapFilters>(() => {
    const filters: CoverageMapFilters = {}
    if (selectedCategories.length > 0) {
      filters.categories = selectedCategories
    }
    const startDate =
      mapTimePreset === 'custom'
        ? customTimeStart ?? undefined
        : timePresetToStartDate(mapTimePreset)
    if (startDate) filters.startDate = startDate
    if (mapTimePreset === 'custom' && customTimeEnd) {
      filters.endDate = customTimeEnd
    }
    return filters
  }, [selectedCategories, mapTimePreset, customTimeStart, customTimeEnd])

  const mapQuery = useCoverageMapData(mapFilters)

  // Client-side severity filtering
  const displayMarkers = useMemo(() => {
    const markers = mapQuery.data ?? []
    if (selectedSeverities.length === 0) return markers
    return markers.filter((m) => selectedSeverities.includes(m.severity as import('@/lib/interfaces/coverage').SeverityLevel))
  }, [mapQuery.data, selectedSeverities])

  // Active filter count by dimension (0-3)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (mapTimePreset !== 'all') count++
    if (selectedSeverities.length > 0) count++
    if (selectedCategories.length > 0) count++
    return count
  }, [mapTimePreset, selectedSeverities, selectedCategories])

  // Fetch full intel for the selected map alert's category
  const mapAlertIntel = useCategoryIntel(selectedMapAlertCategory)

  // Resolve full alert item from category intel, or construct from basic marker data
  const mapAlertItem = useMemo<CategoryIntelItem | null>(() => {
    if (!selectedMapAlertId || !selectedMapAlertBasic) return null

    // Prefer the full item from category intel
    if (mapAlertIntel.data) {
      const fullItem = mapAlertIntel.data.find((item) => item.id === selectedMapAlertId)
      if (fullItem) return fullItem
    }

    // Construct from basic marker data while full data loads
    return {
      id: selectedMapAlertId,
      title: selectedMapAlertBasic.title,
      severity: selectedMapAlertBasic.severity,
      category: selectedMapAlertCategory ?? '',
      eventType: null,
      sourceKey: null,
      confidence: null,
      geoScope: null,
      shortSummary: null,
      ingestedAt: selectedMapAlertBasic.ingestedAt,
      sentAt: null,
      operationalPriority: null,
    }
  }, [selectedMapAlertId, selectedMapAlertBasic, selectedMapAlertCategory, mapAlertIntel.data])

  const categoryLabel = useMemo(() => {
    if (selectedCategories.length === 0) return 'All Categories'
    if (selectedCategories.length === 1) return selectedCategories[0]
    return `${selectedCategories.length} categories`
  }, [selectedCategories])

  const handleMarkerTap = useCallback(
    (markerId: string) => {
      const marker = displayMarkers.find((m) => m.id === markerId)
      if (!marker) return
      selectMapAlert(markerId, marker.category, {
        title: marker.title,
        severity: marker.severity,
        ingestedAt: marker.ingestedAt,
      })
    },
    [displayMarkers, selectMapAlert],
  )

  const handleInspect = useCallback(
    (
      id: string,
      category: string,
      basic: { title: string; severity: string; ingestedAt: string },
    ) => {
      selectMapAlert(id, category, basic)
    },
    [selectMapAlert],
  )

  const handleDismissAlert = useCallback(() => {
    clearMapAlert()
  }, [clearMapAlert])

  return (
    <div className="mobile-map-tab">
      <MobileViewModeToggle value={viewMode} onChange={setViewMode} />
      <MobileStateView query={mapQuery} emptyMessage="No geo-located alerts" />
      {mapQuery.isSuccess && (
        <MobileMapView
          markers={displayMarkers}
          isLoading={mapQuery.isLoading}
          selectedMarkerId={selectedMapAlertId}
          onMarkerTap={handleMarkerTap}
          onInspect={handleInspect}
          categoryLabel={categoryLabel}
          activeFilterCount={activeFilterCount}
          onFilterTap={onFilterTap}
        />
      )}

      <MobileBottomSheet
        isOpen={!!selectedMapAlertId}
        onDismiss={handleDismissAlert}
        config={SHEET_CONFIGS.alertDetail}
        ariaLabel="Alert detail"
      >
        {mapAlertItem && (
          <MobileAlertDetail
            item={mapAlertItem}
            canShowOnMap={false}
          />
        )}
      </MobileBottomSheet>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main MobileView
// ---------------------------------------------------------------------------

export default function MobileView() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [directAlertItem, setDirectAlertItem] = useState<CategoryIntelItem | null>(null)
  const [threatPostureOpen, setThreatPostureOpen] = useState(false)
  const [regionDetail, setRegionDetail] = useState<GeoSummary | null>(null)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null)
  const [priorityFeedSheetOpen, setPriorityFeedSheetOpen] = useState(false)

  const [briefingDigest, setBriefingDigest] = useState<DigestResponse | null>(null)
  const [briefingListOpen, setBriefingListOpen] = useState(false)
  const [pendingSwitchToMap, setPendingSwitchToMap] = useState(false)
  const morph = useMobileMorphBridge()

  // Protective ops hooks
  const idleLock = useIdleLock()
  useP1AudioAlert()
  useDataFreshnessMobile()
  const connectionToast = useConnectionToast()

  // Priority feed for situation tab alert taps (P1 banner, priority strip)
  const { data: priorityFeed } = usePriorityFeed()

  // Fetch full intel data for selected alert in category detail
  const categoryIntel = useCategoryIntel(morph.activeCategoryId)

  // Resolve alert item: prefer direct item (from intel/search tap), fall back to category lookup
  const selectedAlertItem = useMemo(() => {
    if (directAlertItem) return directAlertItem
    if (!morph.selectedAlertId || !categoryIntel.data) return null
    return categoryIntel.data.find((item) => item.id === morph.selectedAlertId) ?? null
  }, [directAlertItem, morph.selectedAlertId, categoryIntel.data])

  const isAlertSheetOpen = morph.isAlertSheetOpen || directAlertItem !== null

  const handleMenuPress = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  const handleSettingsDismiss = useCallback(() => {
    setSettingsOpen(false)
  }, [])

  const handleSearchOpen = useCallback(() => {
    setSearchOpen(true)
  }, [])

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false)
  }, [])

  // Filter sheet store reads
  const mapTimePreset = useCoverageStore((s) => s.mapTimePreset)
  const customTimeStart = useCoverageStore((s) => s.customTimeStart)
  const customTimeEnd = useCoverageStore((s) => s.customTimeEnd)
  const setMapTimePreset = useCoverageStore((s) => s.setMapTimePreset)
  const setCustomTimeRange = useCoverageStore((s) => s.setCustomTimeRange)
  const selectedSeverities = useCoverageStore((s) => s.selectedSeverities)
  const toggleSeverity = useCoverageStore((s) => s.toggleSeverity)
  const selectedCategories = useCoverageStore((s) => s.selectedCategories)
  const toggleCategory = useCoverageStore((s) => s.toggleCategory)
  const clearSelection = useCoverageStore((s) => s.clearSelection)
  const clearSeverities = useCoverageStore((s) => s.clearSeverities)

  const handleFilterTap = useCallback(() => {
    setFilterSheetOpen(true)
  }, [])

  const handleResetAllFilters = useCallback(() => {
    clearSelection()
    clearSeverities()
    setMapTimePreset('all' as import('@/stores/coverage.store').TimePreset)
    syncCategoriesToUrl([])
  }, [clearSelection, clearSeverities, setMapTimePreset])

  const handleToggleCategory = useCallback(
    (categoryId: string) => {
      toggleCategory(categoryId)
      const fresh = useCoverageStore.getState().selectedCategories
      syncCategoriesToUrl(fresh)
    },
    [toggleCategory],
  )

  const handleBundleTap = useCallback((bundleId: string) => {
    setSelectedBundleId(bundleId)
  }, [])

  const handleExpandPriorityFeed = useCallback(() => {
    setPriorityFeedSheetOpen(true)
  }, [])

  const handlePriorityFeedAlertTap = useCallback(
    (item: CategoryIntelItem) => {
      setDirectAlertItem(item)
      setPriorityFeedSheetOpen(false)
    },
    [],
  )

  const handleBriefingTap = useCallback((digest: DigestResponse) => {
    setBriefingDigest(digest)
  }, [])

  const handleViewAllBriefings = useCallback(() => {
    setBriefingListOpen(true)
  }, [])

  const handleBriefingListDigestTap = useCallback((digest: DigestResponse) => {
    setBriefingListOpen(false)
    setBriefingDigest(digest)
  }, [])

  // Category detail "View on Map" — pre-filter map to this category and switch to map tab
  const handleViewCategoryOnMap = useCallback(
    (categoryId: string) => {
      const current = useCoverageStore.getState().selectedCategories
      if (!current.includes(categoryId)) {
        useCoverageStore.getState().toggleCategory(categoryId)
        syncCategoriesToUrl([...current, categoryId])
      }
      morph.dismissCategorySheet()
      setPendingSwitchToMap(true)
    },
    [morph],
  )

  const handleThreatBannerTap = useCallback(() => {
    setThreatPostureOpen(true)
  }, [])

  const handleRegionTap = useCallback((summary: GeoSummary) => {
    setRegionDetail(summary)
  }, [])

  // Situation tab: P1 banner / priority strip alert tap
  const handleSituationAlertTap = useCallback(
    (alertId: string) => {
      if (!priorityFeed) return
      const feedItem = priorityFeed.items.find((item) => item.id === alertId)
      if (!feedItem) return
      setDirectAlertItem({
        id: feedItem.id,
        title: feedItem.title,
        severity: feedItem.severity,
        category: feedItem.category,
        eventType: feedItem.eventType,
        sourceKey: feedItem.sourceKey,
        confidence: null,
        geoScope: feedItem.geoScope,
        shortSummary: feedItem.shortSummary,
        ingestedAt: feedItem.ingestedAt,
        sentAt: feedItem.sentAt,
        operationalPriority: feedItem.operationalPriority,
      })
    },
    [priorityFeed],
  )

  // Intel tab: alert tap opens alert detail sheet with the full item
  const handleIntelAlertTap = useCallback(
    (item: CategoryIntelItem) => {
      setDirectAlertItem(item)
    },
    [],
  )

  // Intel tab: search result tap opens alert detail sheet then closes search
  const handleSearchResultTap = useCallback(
    (item: CategoryIntelItem) => {
      setDirectAlertItem(item)
      setSearchOpen(false)
    },
    [],
  )

  return (
    <>
      <MobileShell
        situationContent={<MobileSituationTab onAlertTap={handleSituationAlertTap} onThreatBannerTap={handleThreatBannerTap} onBundleTap={handleBundleTap} onExpandPriorityFeed={handleExpandPriorityFeed} onBriefingTap={handleBriefingTap} onViewAllBriefings={handleViewAllBriefings} />}
        mapContent={<MobileMapTabContent onFilterTap={handleFilterTap} />}
        intelContent={
          <MobileIntelTab
            onAlertTap={handleIntelAlertTap}
            onRegionTap={handleRegionTap}
            onSearchTap={handleSearchOpen}
          />
        }
        threatIndicator={<MobileThreatIndicator />}
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchOpen}
        requestedTab={pendingSwitchToMap ? 'map' : null}
        onTabSwitched={() => setPendingSwitchToMap(false)}
      />

      {/* Category detail bottom sheet */}
      <MobileBottomSheet
        isOpen={morph.isCategorySheetOpen}
        onDismiss={morph.dismissCategorySheet}
        config={SHEET_CONFIGS.categoryDetail}
        ariaLabel="Category detail"
        onSnapChange={morph.handleSnapChange}
      >
        {morph.activeCategoryId && (
          <MobileCategoryDetail
            categoryId={morph.activeCategoryId}
            onBack={morph.dismissCategorySheet}
            onAlertTap={morph.handleAlertTap}
            currentSnap={morph.currentSnap}
            selectedAlertId={morph.selectedAlertId}
            onViewOnMap={handleViewCategoryOnMap}
          />
        )}
      </MobileBottomSheet>

      {/* Alert detail bottom sheet (from category detail or intel/search) */}
      <MobileBottomSheet
        isOpen={isAlertSheetOpen}
        onDismiss={() => {
          morph.dismissAlertSheet()
          setDirectAlertItem(null)
        }}
        config={SHEET_CONFIGS.alertDetail}
        ariaLabel="Alert detail"
      >
        {selectedAlertItem && (
          <MobileAlertDetail
            item={selectedAlertItem}
            onShowOnMap={morph.navigateToMap}
            onViewCategory={morph.navigateToCategory}
            canShowOnMap
          />
        )}
      </MobileBottomSheet>

      {/* Threat posture detail bottom sheet */}
      <MobileBottomSheet
        isOpen={threatPostureOpen}
        onDismiss={() => setThreatPostureOpen(false)}
        config={SHEET_CONFIGS.threatPosture}
        ariaLabel="Threat posture detail"
      >
        <MobileThreatPostureDetail />
      </MobileBottomSheet>

      {/* Region detail bottom sheet */}
      <MobileBottomSheet
        isOpen={!!regionDetail}
        onDismiss={() => setRegionDetail(null)}
        config={SHEET_CONFIGS.regionDetail}
        ariaLabel="Region detail"
      >
        {regionDetail && <MobileRegionDetail summary={regionDetail} />}
      </MobileBottomSheet>

      {/* Priority feed bottom sheet */}
      <MobileBottomSheet
        isOpen={priorityFeedSheetOpen}
        onDismiss={() => setPriorityFeedSheetOpen(false)}
        config={SHEET_CONFIGS.priorityFeed}
        ariaLabel="Priority feed"
      >
        <MobilePriorityFeedSheet onAlertTap={handlePriorityFeedAlertTap} />
      </MobileBottomSheet>

      {/* Bundle detail bottom sheet */}
      <MobileBottomSheet
        isOpen={!!selectedBundleId}
        onDismiss={() => setSelectedBundleId(null)}
        config={SHEET_CONFIGS.bundleDetail}
        ariaLabel="Bundle detail"
      >
        {selectedBundleId && <MobileBundleDetail bundleId={selectedBundleId} />}
      </MobileBottomSheet>

      {/* Unified map filter bottom sheet */}
      <MobileBottomSheet
        isOpen={filterSheetOpen}
        onDismiss={() => setFilterSheetOpen(false)}
        config={SHEET_CONFIGS.mapFilter}
        ariaLabel="Map filters"
      >
        <MobileMapFilterSheet
          timePreset={mapTimePreset}
          customTimeStart={customTimeStart}
          customTimeEnd={customTimeEnd}
          onTimePresetChange={setMapTimePreset}
          onCustomTimeChange={setCustomTimeRange}
          selectedSeverities={selectedSeverities}
          onToggleSeverity={toggleSeverity}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          onResetAll={handleResetAllFilters}
          onDismiss={() => setFilterSheetOpen(false)}
        />
      </MobileBottomSheet>

      {/* Briefing detail bottom sheet */}
      <MobileBottomSheet
        isOpen={!!briefingDigest}
        onDismiss={() => setBriefingDigest(null)}
        config={SHEET_CONFIGS.briefingDetail}
        ariaLabel="Briefing detail"
      >
        {briefingDigest && <MobileBriefingDetail digest={briefingDigest} />}
      </MobileBottomSheet>

      {/* Briefing list bottom sheet */}
      <MobileBottomSheet
        isOpen={briefingListOpen}
        onDismiss={() => setBriefingListOpen(false)}
        config={SHEET_CONFIGS.briefingList}
        ariaLabel="All briefings"
      >
        <MobileBriefingListSheet onDigestTap={handleBriefingListDigestTap} />
      </MobileBottomSheet>

      {/* Settings bottom sheet */}
      <MobileBottomSheet
        isOpen={settingsOpen}
        onDismiss={handleSettingsDismiss}
        config={SHEET_CONFIGS.settings}
        ariaLabel="Settings"
      >
        <MobileSettings />
      </MobileBottomSheet>

      {/* Full-screen search overlay */}
      <MobileSearchOverlay
        isOpen={searchOpen}
        onClose={handleSearchClose}
        onResultTap={handleSearchResultTap}
      />

      {/* Idle lock overlay (z-60, above everything) */}
      <MobileIdleLockOverlay
        isLocked={idleLock.isLocked}
        onUnlock={idleLock.unlock}
      />

      {/* Connection restored toast */}
      <MobileConnectionToast
        isVisible={connectionToast.isVisible}
        message={connectionToast.message}
      />
    </>
  )
}
