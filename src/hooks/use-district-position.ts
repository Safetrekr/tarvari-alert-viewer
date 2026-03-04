/**
 * useDistrictPosition -- computes world-space geometry for a district shell.
 *
 * Uses the capsule ring layout positions (derived from ring index)
 * to determine where the district shell should be placed in world space.
 *
 * @module use-district-position
 * @see WS-2.1 Section 4.9
 */

'use client'

import { useMemo } from 'react'
import type { DistrictId } from '@/lib/interfaces/district'
import { DISTRICTS } from '@/lib/interfaces/district'
import { DETAIL_PANEL_DIMENSIONS } from '@/lib/morph-types'

/** @deprecated This hook is dead code. Type inlined to avoid broken imports. */
interface DistrictShellGeometry {
  worldX: number
  worldY: number
  width: number
  height: number
}
import { getDistrictWorldPosition } from '@/lib/spatial-actions'

/**
 * Compute the world-space geometry for a district shell.
 *
 * The district shell is centered on the district's world-space position
 * (derived from its capsule ring position), offset so the shell center
 * aligns with where the camera flies to.
 *
 * @param districtId - The district to compute geometry for.
 * @returns World-space position and dimensions for the DistrictShell, or null.
 */
export function useDistrictPosition(districtId: DistrictId | null): DistrictShellGeometry | null {
  return useMemo(() => {
    if (!districtId) return null

    const district = DISTRICTS.find((d) => d.id === districtId)
    if (!district) return null

    const pos = getDistrictWorldPosition(district.ringIndex)

    return {
      worldX: pos.x - DETAIL_PANEL_DIMENSIONS.width / 2,
      worldY: pos.y - DETAIL_PANEL_DIMENSIONS.height / 2,
      width: DETAIL_PANEL_DIMENSIONS.width,
      height: DETAIL_PANEL_DIMENSIONS.height,
    }
  }, [districtId])
}
