/**
 * DistrictViewContent -- renders the CategoryDetailScene for the
 * selected category, managing alert selection state shared between
 * the scene (alert list) and the dock panel (alert detail).
 *
 * @module district-view-content
 * @see WS-3.1 Section 4.2
 */

'use client'

import type { MapRef } from 'react-map-gl/maplibre'
import type { NodeId } from '@/lib/interfaces/district'
import type { PanelSide } from '@/lib/morph-types'
import { CategoryDetailScene } from './scenes'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DistrictViewContentProps {
  readonly districtId: NodeId
  readonly panelSide: PanelSide
  readonly selectedAlertId: string | null
  readonly onSelectAlert: (id: string | null) => void
  readonly mapRef?: React.RefObject<MapRef | null>
  readonly sourceFilter?: string | null
  readonly currentBbox?: [number, number, number, number] | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictViewContent({
  districtId,
  panelSide,
  selectedAlertId,
  onSelectAlert,
  mapRef,
  sourceFilter,
  currentBbox,
}: DistrictViewContentProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      <CategoryDetailScene
        categoryId={districtId}
        dockSide={panelSide}
        selectedAlertId={selectedAlertId}
        onSelectAlert={onSelectAlert}
        mapRef={mapRef}
        sourceFilter={sourceFilter}
        currentBbox={currentBbox}
      />
    </div>
  )
}
