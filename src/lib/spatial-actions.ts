/**
 * Shared spatial navigation utilities.
 *
 * Provides reusable actions for navigating the ZUI camera to known
 * world-space positions. Used by keyboard shortcuts, command palette,
 * minimap click-to-navigate, and hub center glyph click handler.
 *
 * @module spatial-actions
 * @see WS-1.4 Deliverable 4.7
 */

import { useCameraStore } from '@/stores/camera.store'
import {
  CAPSULE_RING_RADIUS,
  CAPSULE_ANGULAR_SPACING,
  ZOOM_DEFAULT,
} from '@/lib/constants'
import { DISTRICTS, type DistrictId, type DistrictMeta } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default hub camera position: world origin at Z1 zoom level. */
export const HUB_POSITION = { x: 0, y: 0, zoom: ZOOM_DEFAULT } as const

/** Target zoom level when flying to a district (Z2 range). */
export const DISTRICT_ZOOM = 1.5 as const

/** Zoom step size for keyboard/command palette zoom in/out. */
export const ZOOM_STEP = 0.15 as const

// ---------------------------------------------------------------------------
// World-coordinate helpers
// ---------------------------------------------------------------------------

/**
 * Calculate the world-space position of a district from its ring index.
 *
 * Districts are arranged in a ring of radius CAPSULE_RING_RADIUS (300px),
 * spaced CAPSULE_ANGULAR_SPACING (60deg) apart, starting at -90deg (12 o'clock).
 */
export function getDistrictWorldPosition(ringIndex: number): {
  x: number
  y: number
} {
  const angleDeg = -90 + ringIndex * CAPSULE_ANGULAR_SPACING
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: CAPSULE_RING_RADIUS * Math.cos(angleRad),
    y: CAPSULE_RING_RADIUS * Math.sin(angleRad),
  }
}

/**
 * Get district metadata by ID.
 */
export function getDistrictById(id: DistrictId): DistrictMeta | undefined {
  return DISTRICTS.find((d) => d.id === id)
}

// ---------------------------------------------------------------------------
// Navigation actions (callable outside of React components)
// ---------------------------------------------------------------------------

/**
 * Fly the camera to center a world-space point on screen.
 *
 * Converts world coordinates to camera offsets (the camera store's flyTo
 * takes offset values, not world coordinates) then delegates to the
 * store's spring-animated flyTo.
 */
export function flyToWorldPoint(
  worldX: number,
  worldY: number,
  targetZoom: number,
): void {
  const { viewportWidth, viewportHeight, flyTo } = useCameraStore.getState()
  const targetOffsetX = viewportWidth / 2 - worldX * targetZoom
  const targetOffsetY = viewportHeight / 2 - worldY * targetZoom
  flyTo(targetOffsetX, targetOffsetY, targetZoom)
}

/**
 * Fly to the hub center at default Z1 zoom level.
 *
 * Uses the camera store's `resetToLaunch()` which correctly converts
 * the world origin (0, 0) to camera offsets.
 */
export function returnToHub(): void {
  useCameraStore.getState().resetToLaunch()
}

/**
 * Fly to a specific district by its ID.
 */
export function flyToDistrict(districtId: DistrictId): void {
  const district = getDistrictById(districtId)
  if (!district) return

  const pos = getDistrictWorldPosition(district.ringIndex)
  flyToWorldPoint(pos.x, pos.y, DISTRICT_ZOOM)
}

/**
 * Step the zoom level up (zoom in) by ZOOM_STEP, centered on viewport middle.
 */
export function zoomIn(): void {
  const { zoom, viewportWidth, viewportHeight, zoomTo } =
    useCameraStore.getState()
  zoomTo(zoom + ZOOM_STEP, viewportWidth / 2, viewportHeight / 2)
}

/**
 * Step the zoom level down (zoom out) by ZOOM_STEP, centered on viewport middle.
 */
export function zoomOut(): void {
  const { zoom, viewportWidth, viewportHeight, zoomTo } =
    useCameraStore.getState()
  zoomTo(zoom - ZOOM_STEP, viewportWidth / 2, viewportHeight / 2)
}
