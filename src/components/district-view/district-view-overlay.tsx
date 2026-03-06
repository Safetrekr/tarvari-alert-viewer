/**
 * DistrictViewOverlay -- full-screen overlay that appears when the
 * morph state machine reaches the `entering-district` phase.
 *
 * Viewport-fixed, fades in/out with AnimatePresence. Contains:
 * - Tinted radial gradient background (per-category color)
 * - DistrictViewContent (CategoryDetailScene)
 * - DistrictViewHeader (back button, name, category color dot)
 * - DistrictViewDock (glass panel with category metadata or alert detail)
 *
 * Manages selectedAlertId state shared between the content (alert list)
 * and the dock (alert detail view).
 *
 * @module district-view-overlay
 * @see WS-3.1 Section 4.3
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { MapRef } from 'react-map-gl/maplibre'
import { useUIStore } from '@/stores/ui.store'
import { useCoverageStore, coverageSelectors } from '@/stores/coverage.store'
import { getCategoryColor } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'
import type { BBox } from '@/hooks/use-coverage-map-data'
import { DistrictViewHeader } from './district-view-header'
import { DistrictViewDock } from './district-view-dock'
import { DistrictViewContent } from './district-view-content'
import { DistrictFilterPanel } from './district-filter-panel'

// ---------------------------------------------------------------------------
// Category tint helper
// ---------------------------------------------------------------------------

function getCategoryTint(categoryId: string): string {
  const color = getCategoryColor(categoryId)
  const hexMatch = color.match(/#([0-9a-fA-F]{6})/)
  if (!hexMatch) return 'rgba(255, 255, 255, 0.03)'
  const hex = hexMatch[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.05)`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictViewOverlay() {
  const phase = useUIStore((s) => s.morph.phase)
  const targetId = useUIStore((s) => s.morph.targetId)
  const reverseMorph = useUIStore((s) => s.reverseMorph)

  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentBbox, setCurrentBbox] = useState<BBox | null>(null)
  const districtMapRef = useRef<MapRef>(null)

  const districtSourceFilter = useCoverageStore(coverageSelectors.districtSourceFilter)
  const hasActiveFilter = useCoverageStore(coverageSelectors.hasDistrictFilter)
  const clearDistrictFilters = useCoverageStore((s) => s.clearDistrictFilters)

  const isVisible =
    phase === 'entering-district' ||
    phase === 'district' ||
    phase === 'leaving-district'

  // Pre-select alert when entering from INSPECT flow
  useEffect(() => {
    if (isVisible) {
      const store = useCoverageStore.getState()
      const preselected = store.districtPreselectedAlertId
      if (preselected) {
        setSelectedAlertId(preselected)
        store.setDistrictPreselectedAlertId(null) // consume once
      }
    }
  }, [isVisible])

  const handleSelectAlert = useCallback((id: string | null) => {
    setSelectedAlertId(id)
  }, [])

  const handleDeselectAlert = useCallback(() => {
    setSelectedAlertId(null)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedAlertId(null)
    setFiltersOpen(false)
    clearDistrictFilters()
    reverseMorph()
  }, [reverseMorph, clearDistrictFilters])

  const handleToggleFilters = useCallback(() => {
    setFiltersOpen((prev) => !prev)
  }, [])

  const handleBboxChange = useCallback((bbox: BBox | null) => {
    setCurrentBbox(bbox)
  }, [])

  const districtId = targetId as NodeId | null

  // Panel always docks to the right for the grid layout (WS-2.2 Decision D-1).
  const panelSide = 'right' as const

  // Gradient origin follows the dock side
  const gradientOrigin = panelSide === 'right' ? '40% 50%' : '60% 50%'

  return (
    <AnimatePresence
      onExitComplete={() => {
        setSelectedAlertId(null)
        setFiltersOpen(false)
        clearDistrictFilters()
      }}
    >
      {isVisible && districtId && (
        <motion.div
          key="district-view-overlay"
          className="district-view-active"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 30,
            overflow: 'hidden',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Tinted radial gradient background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at ${gradientOrigin}, ${getCategoryTint(districtId)} 0%, transparent 70%)`,
              backgroundColor: 'rgba(5, 9, 17, 0.95)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />

          {/* Category detail scene content */}
          <DistrictViewContent
            districtId={districtId}
            panelSide={panelSide}
            selectedAlertId={selectedAlertId}
            onSelectAlert={handleSelectAlert}
            mapRef={districtMapRef}
            sourceFilter={districtSourceFilter}
            currentBbox={currentBbox}
          />

          {/* Header (category name + back button + filters toggle) */}
          <DistrictViewHeader
            districtId={districtId}
            panelSide={panelSide}
            onBack={handleBack}
            filtersOpen={filtersOpen}
            hasActiveFilter={hasActiveFilter}
            onToggleFilters={handleToggleFilters}
          />

          {/* Filter panel */}
          <AnimatePresence>
            {filtersOpen && districtId && (
              <DistrictFilterPanel
                key="district-filter-panel"
                categoryId={districtId}
                mapRef={districtMapRef}
                onBboxChange={handleBboxChange}
              />
            )}
          </AnimatePresence>

          {/* Dock panel */}
          <DistrictViewDock
            districtId={districtId}
            panelSide={panelSide}
            selectedAlertId={selectedAlertId}
            onDeselectAlert={handleDeselectAlert}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
