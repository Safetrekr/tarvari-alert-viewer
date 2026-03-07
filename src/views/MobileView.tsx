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
import { SHEET_CONFIGS } from '@/lib/interfaces/mobile'
import { useCoverageMapData } from '@/hooks/use-coverage-map-data'
import type { CoverageMapFilters } from '@/hooks/use-coverage-map-data'
import { useCoverageStore } from '@/stores/coverage.store'
import {
  syncCategoriesToUrl,
  timePresetToStartDate,
} from '@/stores/coverage.store'
import { MobileStateView } from '@/components/mobile/MobileStateView'

const MobileMapView = dynamic(
  () =>
    import('@/components/mobile/MobileMapView').then((m) => ({
      default: m.MobileMapView,
    })),
  { ssr: false },
)

function MobileMapTabContent() {
  // Store state
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

  // Build map filters from store state
  const mapFilters = useMemo<CoverageMapFilters>(() => {
    const filters: CoverageMapFilters = {}
    if (selectedCategories.length > 0) {
      filters.categories = selectedCategories
    }
    const startDate =
      mapTimePreset === 'custom' ? customTimeStart ?? undefined : timePresetToStartDate(mapTimePreset)
    if (startDate) filters.startDate = startDate
    if (mapTimePreset === 'custom' && customTimeEnd) {
      filters.endDate = customTimeEnd
    }
    return filters
  }, [selectedCategories, mapTimePreset, customTimeStart, customTimeEnd])

  const mapQuery = useCoverageMapData(mapFilters)
  const displayMarkers = mapQuery.data ?? []

  // Category label for ARIA
  const categoryLabel = useMemo(() => {
    if (selectedCategories.length === 0) return 'All Categories'
    if (selectedCategories.length === 1) return selectedCategories[0]
    return `${selectedCategories.length} categories`
  }, [selectedCategories])

  // Handlers
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

      {/* Alert detail bottom sheet */}
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

export default function MobileView() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleMenuPress = useCallback(() => {
    setSettingsOpen(true)
  }, [])

  const handleSettingsDismiss = useCallback(() => {
    setSettingsOpen(false)
  }, [])

  return (
    <>
      <MobileShell
        situationContent={<MobileSituationTab />}
        mapContent={<MobileMapTabContent />}
        threatIndicator={<MobileThreatIndicator />}
        onMenuPress={handleMenuPress}
      />

      {/* Settings bottom sheet */}
      <MobileBottomSheet
        isOpen={settingsOpen}
        onDismiss={handleSettingsDismiss}
        config={SHEET_CONFIGS.settings}
        ariaLabel="Settings"
      >
        <MobileSettings />
      </MobileBottomSheet>
    </>
  )
}
