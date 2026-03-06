'use client'

/**
 * Hook that reads the current map viewport bounds and subscribes to
 * `moveend` events (debounced) to provide a live bounding box.
 *
 * The bbox is derived from the map ref and kept in local state (not Zustand)
 * to avoid triggering global re-renders on every pan/zoom.
 *
 * @module use-map-bbox
 * @see WS-5.2 Section 4.5
 */

import { useEffect, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import type { BBox } from '@/hooks/use-coverage-map-data'

interface UseMapBboxOptions {
  mapRef: React.RefObject<MapRef | null>
  enabled: boolean
  debounceMs?: number
}

interface UseMapBboxReturn {
  bbox: BBox | null
}

function readBounds(mapRef: React.RefObject<MapRef | null>): BBox | null {
  const map = mapRef.current
  if (!map) return null
  try {
    const bounds = map.getBounds()
    if (!bounds) return null
    return [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]
  } catch {
    return null
  }
}

export function useMapBbox({
  mapRef,
  enabled,
  debounceMs = 300,
}: UseMapBboxOptions): UseMapBboxReturn {
  const [bbox, setBbox] = useState<BBox | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled) {
      setBbox(null)
      return
    }

    // Read initial bounds
    setBbox(readBounds(mapRef))

    const map = mapRef.current
    if (!map) return

    const glMap = map.getMap()

    const handler = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setBbox(readBounds(mapRef))
      }, debounceMs)
    }

    glMap.on('moveend', handler)

    return () => {
      glMap.off('moveend', handler)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [mapRef, enabled, debounceMs])

  return { bbox }
}
