/**
 * SpatialBreadcrumb -- semantic path breadcrumb for the ZUI.
 *
 * Displays the operator's current semantic position derived from
 * camera state. Shows a navigable path that deepens as the user
 * zooms into districts and stations.
 *
 * - Z0/Z1: "Launch"
 * - Z2: "Launch > {DistrictName}"
 * - Z3: "Launch > {DistrictName} > Station"
 *
 * Each segment (except the terminal) is clickable and flies the
 * camera to the corresponding spatial position.
 *
 * Uses @tarva/ui Breadcrumb primitives with spatial styling overrides.
 *
 * @module SpatialBreadcrumb
 * @see WS-1.4 Deliverable 4.3
 */

'use client'

import { useCallback } from 'react'
import { ChevronRight } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@tarva/ui'

import { useCameraStore } from '@/stores/camera.store'
import { useUIStore } from '@/stores/ui.store'
import { DISTRICTS, type DistrictId } from '@/lib/interfaces/district'
import { KNOWN_CATEGORIES } from '@/lib/interfaces/coverage'
import { returnToHub, flyToDistrict } from '@/lib/spatial-actions'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SpatialBreadcrumbProps {
  className?: string
}

export function SpatialBreadcrumb({ className }: SpatialBreadcrumbProps) {
  const semanticLevel = useCameraStore((s) => s.semanticLevel)
  const selectedDistrictId = useUIStore((s) => s.selectedDistrictId)
  const morphPhase = useUIStore((s) => s.morph.phase)

  // Resolve display name from selected ID (legacy districts or coverage categories)
  const selectedDistrict = selectedDistrictId
    ? DISTRICTS.find((d) => d.id === selectedDistrictId)
    : null
  const selectedCategory = selectedDistrictId
    ? KNOWN_CATEGORIES.find((c) => c.id === selectedDistrictId)
    : null
  const selectedName = selectedDistrict?.displayName ?? selectedCategory?.displayName ?? null

  // Morph is active when in any non-idle phase
  const isInDistrict = morphPhase !== 'idle'

  const resetMorph = useUIStore((s) => s.resetMorph)

  const handleLaunchClick = useCallback(() => {
    // Close any active district/morph state and return camera to hub
    if (isInDistrict) {
      resetMorph()
    }
    returnToHub()
  }, [isInDistrict, resetMorph])

  const handleDistrictClick = useCallback(() => {
    if (selectedDistrictId) {
      flyToDistrict(selectedDistrictId as DistrictId)
    }
  }, [selectedDistrictId])

  // Show district segment when zoomed in OR when in district view overlay
  const showDistrict =
    ((semanticLevel === 'Z2' || semanticLevel === 'Z3') || isInDistrict) && selectedName
  const showStation = semanticLevel === 'Z3' && selectedName

  return (
    <Breadcrumb
      className={cn('pointer-events-auto fixed top-12 left-4', className)}
      aria-label="Spatial navigation breadcrumb"
    >
      <BreadcrumbList
        className={cn(
          'gap-1.5',
          'font-mono text-[11px] font-normal',
          'tracking-[0.02em]',
        )}
      >
        {/* Launch segment */}
        <BreadcrumbItem>
          {showDistrict ? (
            <BreadcrumbLink asChild>
              <button
                onClick={handleLaunchClick}
                className={cn(
                  'cursor-pointer font-mono text-[11px] font-normal',
                  'tracking-[0.02em] opacity-55',
                  'transition-opacity hover:opacity-80',
                )}
                type="button"
              >
                Launch
              </button>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage
              className={cn(
                'font-mono text-[11px] font-normal',
                'tracking-[0.02em] opacity-55',
              )}
            >
              Launch
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {/* District segment */}
        {showDistrict && (
          <>
            <BreadcrumbSeparator className="opacity-30">
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {showStation ? (
                <BreadcrumbLink asChild>
                  <button
                    onClick={handleDistrictClick}
                    className={cn(
                      'cursor-pointer font-mono text-[11px] font-normal',
                      'tracking-[0.02em] opacity-55',
                      'transition-opacity hover:opacity-80',
                    )}
                    type="button"
                  >
                    {selectedName}
                  </button>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage
                  className={cn(
                    'font-mono text-[11px] font-normal',
                    'tracking-[0.02em] opacity-55',
                  )}
                >
                  {selectedName}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Station segment (placeholder for Phase 1) */}
        {showStation && (
          <>
            <BreadcrumbSeparator className="opacity-30">
              <ChevronRight className="h-3 w-3" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage
                className={cn(
                  'font-mono text-[11px] font-normal',
                  'tracking-[0.02em] opacity-55',
                )}
              >
                Station
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
