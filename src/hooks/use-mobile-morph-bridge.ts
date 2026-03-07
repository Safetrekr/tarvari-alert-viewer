'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useUIStore } from '@/stores/ui.store'
import { useCoverageStore } from '@/stores/coverage.store'
import { syncCategoriesToUrl } from '@/stores/coverage.store'
import type { MorphPhase } from '@/lib/morph-types'

export interface MobileMorphBridgeResult {
  /** Category ID for the currently open category detail sheet. Null when no sheet. */
  activeCategoryId: string | null
  /** Whether the category detail sheet should be open. */
  isCategorySheetOpen: boolean
  /** Current snap percentage for progressive disclosure. */
  currentSnap: number
  /** Alert ID selected within the category detail. */
  selectedAlertId: string | null
  /** Whether the alert detail sheet should be open. */
  isAlertSheetOpen: boolean
  /** Dismiss the category detail sheet. */
  dismissCategorySheet: () => void
  /** Handle alert tap from category detail list. */
  handleAlertTap: (alertId: string) => void
  /** Dismiss the alert detail sheet. */
  dismissAlertSheet: () => void
  /** Handle snap change on category sheet. */
  handleSnapChange: (snapIndex: number) => void
  /** Navigate to map tab from alert detail. */
  navigateToMap: (
    alertId: string,
    coords: { lat: number; lng: number } | null,
    category: string,
    basic: { title: string; severity: string; ingestedAt: string },
  ) => void
  /** Navigate to a different category from alert detail. */
  navigateToCategory: (categoryId: string) => void
  /** Handler for tab changes -- resets morph state. */
  handleTabChangeWithMorphReset: () => void
}

export function useMobileMorphBridge(
  onSwitchToMapTab?: () => void,
): MobileMorphBridgeResult {
  const morphPhase = useUIStore((s) => s.morph.phase)
  const morphTargetId = useUIStore((s) => s.morph.targetId)
  const resetMorph = useUIStore((s) => s.resetMorph)
  const startMorph = useUIStore((s) => s.startMorph)

  const setMorphPhase = useUIStore((s) => s.setMorphPhase)
  const selectMapAlert = useCoverageStore((s) => s.selectMapAlert)
  const toggleCategory = useCoverageStore((s) => s.toggleCategory)

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [currentSnap, setCurrentSnap] = useState(65) // SHEET_CONFIGS.categoryDetail.initialSnapIndex -> 65%
  const prevPhaseRef = useRef<MorphPhase>('idle')

  // Determine if the category sheet should be open based on morph phase
  const isCategorySheetOpen =
    morphPhase === 'entering-district' || morphPhase === 'district'

  const activeCategoryId = isCategorySheetOpen ? (morphTargetId as string) : null

  // Mobile doesn't use useMorphChoreography (that's desktop-only).
  // Advance entering-district → district after a short delay so the morph settles.
  useEffect(() => {
    if (morphPhase === 'entering-district') {
      const timer = setTimeout(() => {
        setMorphPhase('district')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [morphPhase, setMorphPhase])

  // Track phase changes -- when morph enters 'idle' from a non-idle phase, clean up
  useEffect(() => {
    if (morphPhase === 'idle' && prevPhaseRef.current !== 'idle') {
      setSelectedAlertId(null)
      setCurrentSnap(65)
    }
    prevPhaseRef.current = morphPhase
  }, [morphPhase])

  const dismissCategorySheet = useCallback(() => {
    resetMorph()
  }, [resetMorph])

  const handleAlertTap = useCallback((alertId: string) => {
    setSelectedAlertId(alertId)
  }, [])

  const dismissAlertSheet = useCallback(() => {
    setSelectedAlertId(null)
  }, [])

  const handleSnapChange = useCallback((snapIndex: number) => {
    // SHEET_CONFIGS.categoryDetail.snapPoints = [35, 65, 100]
    const snaps = [35, 65, 100]
    setCurrentSnap(snaps[snapIndex] ?? 65)
  }, [])

  const navigateToMap = useCallback(
    (
      alertId: string,
      _coords: { lat: number; lng: number } | null,
      category: string,
      basic: { title: string; severity: string; ingestedAt: string },
    ) => {
      // Close sheets
      resetMorph()
      setSelectedAlertId(null)

      // Add category to filter if needed
      const current = useCoverageStore.getState().selectedCategories
      if (current.length > 0 && !current.includes(category)) {
        toggleCategory(category)
        syncCategoriesToUrl([...current, category])
      } else if (current.length === 0) {
        toggleCategory(category)
        syncCategoriesToUrl([category])
      }

      // Select alert on map
      selectMapAlert(alertId, category, basic)

      // Switch to map tab
      onSwitchToMapTab?.()
    },
    [resetMorph, toggleCategory, selectMapAlert, onSwitchToMapTab],
  )

  const navigateToCategory = useCallback(
    (categoryId: string) => {
      // Close current sheets
      resetMorph()
      setSelectedAlertId(null)

      // Open new category via morph
      queueMicrotask(() => {
        startMorph(categoryId, { fast: true })
      })
    },
    [resetMorph, startMorph],
  )

  const handleTabChangeWithMorphReset = useCallback(() => {
    if (morphPhase !== 'idle') {
      resetMorph()
      setSelectedAlertId(null)
    }
  }, [morphPhase, resetMorph])

  return {
    activeCategoryId,
    isCategorySheetOpen,
    currentSnap,
    selectedAlertId,
    isAlertSheetOpen: selectedAlertId !== null,
    dismissCategorySheet,
    handleAlertTap,
    dismissAlertSheet,
    handleSnapChange,
    navigateToMap,
    navigateToCategory,
    handleTabChangeWithMorphReset,
  }
}
