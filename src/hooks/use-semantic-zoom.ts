/**
 * Hook that reads the current semantic zoom level from the camera store.
 *
 * Uses standard `useStore()` with a selector since semantic level changes
 * are low-frequency (only at zoom threshold crossings). Components that
 * need to switch their representation based on zoom level use this hook.
 *
 * Returns both the raw level and boolean convenience flags for each level.
 *
 * @module use-semantic-zoom
 * @see WS-0.3 Section 4.1.4
 * @see WS-1.1 Deliverable 8
 */

import { useMemo } from 'react'

import { type SemanticZoomLevel, useCameraStore } from '@/stores/camera.store'

export interface SemanticZoomResult {
  /** Current semantic zoom level (Z0-Z3). */
  level: SemanticZoomLevel
  /** Current raw zoom value. */
  zoom: number
  /** True when at Z0 -- Constellation (fully zoomed out overview). */
  isConstellation: boolean
  /** True when at Z1 -- Atrium (default hub view). */
  isAtrium: boolean
  /** True when at Z2 -- District (focused area view). */
  isDistrict: boolean
  /** True when at Z3 -- Station (fully zoomed in detail). */
  isStation: boolean
}

export function useSemanticZoom(): SemanticZoomResult {
  const level = useCameraStore((state) => state.semanticLevel)
  const zoom = useCameraStore((state) => state.zoom)

  return useMemo(
    () => ({
      level,
      zoom,
      isConstellation: level === 'Z0',
      isAtrium: level === 'Z1',
      isDistrict: level === 'Z2',
      isStation: level === 'Z3',
    }),
    [level, zoom],
  )
}
