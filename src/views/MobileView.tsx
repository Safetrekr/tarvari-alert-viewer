'use client'

import { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MobileShell } from '@/components/mobile/MobileShell'
import { MobileSituationTab } from '@/components/mobile/MobileSituationTab'
import { MobileThreatIndicator } from '@/components/mobile/MobileThreatIndicator'
import { MobileFilterChips } from '@/components/mobile/MobileFilterChips'
import { MobileAlertDetailStub } from '@/components/mobile/MobileAlertDetailStub'
import { MobileSettings } from '@/components/mobile/MobileSettings'
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet'
import { MobileCategoryDetail } from '@/components/mobile/MobileCategoryDetail'
import { MobileAlertDetail } from '@/components/mobile/MobileAlertDetail'
import { MobileIntelTab } from '@/components/mobile/MobileIntelTab'
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
import { useCoverageStore } from '@/stores/coverage.store'
import {
  syncCategoriesToUrl,
  timePresetToStartDate,
} from '@/stores/coverage.store'
import { MobileStateView } from '@/components/mobile/MobileStateView'
import { useMobileMorphBridge } from '@/hooks/use-mobile-morph-bridge'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import type { MobileTab } from '@/lib/interfaces/mobile'

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

function MobileMapTabContent() {
  const selectedCategories = useCoverageStore((s) => s.selectedCategories)
  const toggleCategory = useCoverageStore((s) => s.toggleCategory)
  const clearSelection = useCoverageStore((s) => s.clearSelection)
  const mapTimePreset = useCoverageStore((s) => s.mapTimePreset)
  const customTimeStart = useCoverageStore((s) => s.customTimeStart)
  const customTimeEnd = useCoverageStore((s) => s.customTimeEnd)
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
  const displayMarkers = mapQuery.data ?? []

  const categoryLabel = useMemo(() => {
    if (selectedCategories.length === 0) return 'All Categories'
    if (selectedCategories.length === 1) return selectedCategories[0]
    return `${selectedCategories.length} categories`
  }, [selectedCategories])

  const handleFilterToggle = useCallback(
    (categoryId: string) => {
      toggleCategory(categoryId)
      const fresh = useCoverageStore.getState().selectedCategories
      syncCategoriesToUrl(fresh)
    },
    [toggleCategory],
  )

  const handleClearAll = useCallback(() => {
    clearSelection()
    syncCategoriesToUrl([])
  }, [clearSelection])

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
      <MobileFilterChips
        selectedCategories={selectedCategories}
        onToggle={handleFilterToggle}
        onClearAll={handleClearAll}
      />
      <MobileStateView query={mapQuery} emptyMessage="No geo-located alerts" />
      {mapQuery.isSuccess && (
        <MobileMapView
          markers={displayMarkers}
          isLoading={mapQuery.isLoading}
          selectedMarkerId={selectedMapAlertId}
          onMarkerTap={handleMarkerTap}
          onInspect={handleInspect}
          categoryLabel={categoryLabel}
        />
      )}

      <MobileBottomSheet
        isOpen={!!selectedMapAlertId}
        onDismiss={handleDismissAlert}
        config={SHEET_CONFIGS.alertDetail}
        ariaLabel="Alert detail"
      >
        {selectedMapAlertBasic && (
          <MobileAlertDetailStub
            title={selectedMapAlertBasic.title}
            severity={selectedMapAlertBasic.severity}
            category={selectedMapAlertCategory ?? ''}
            ingestedAt={selectedMapAlertBasic.ingestedAt}
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
  const [activeTab, setActiveTab] = useState<MobileTab>('situation')

  const handleSwitchToMap = useCallback(() => {
    setActiveTab('map')
  }, [])

  const morph = useMobileMorphBridge(handleSwitchToMap)

  // Protective ops hooks
  const idleLock = useIdleLock()
  useP1AudioAlert()
  useDataFreshnessMobile()
  const connectionToast = useConnectionToast()

  // Fetch full intel data for selected alert in category detail
  const categoryIntel = useCategoryIntel(morph.activeCategoryId)
  const selectedAlertItem = useMemo(() => {
    if (!morph.selectedAlertId || !categoryIntel.data) return null
    return categoryIntel.data.find((item) => item.id === morph.selectedAlertId) ?? null
  }, [morph.selectedAlertId, categoryIntel.data])

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

  // Intel tab: alert tap opens alert detail sheet
  const handleIntelAlertTap = useCallback(
    (item: CategoryIntelItem) => {
      morph.handleAlertTap(item.id)
    },
    [morph],
  )

  // Intel tab: search result tap opens alert detail sheet then closes search
  const handleSearchResultTap = useCallback(
    (item: CategoryIntelItem) => {
      morph.handleAlertTap(item.id)
      setSearchOpen(false)
    },
    [morph],
  )

  // Tab change with morph reset
  const handleTabChange = useCallback(
    (tab: MobileTab) => {
      morph.handleTabChangeWithMorphReset()
      setActiveTab(tab)
    },
    [morph],
  )

  return (
    <>
      <MobileShell
        situationContent={<MobileSituationTab />}
        mapContent={<MobileMapTabContent />}
        intelContent={
          <MobileIntelTab
            onAlertTap={handleIntelAlertTap}
            onSearchTap={handleSearchOpen}
          />
        }
        threatIndicator={<MobileThreatIndicator />}
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchOpen}
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
          />
        )}
      </MobileBottomSheet>

      {/* Alert detail bottom sheet (nested from category) */}
      <MobileBottomSheet
        isOpen={morph.isAlertSheetOpen}
        onDismiss={morph.dismissAlertSheet}
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
