'use client'

import '@/styles/mobile-map-view.css'

import { useRef, useEffect } from 'react'
import { CoverageMap } from '@/components/coverage/CoverageMap'
import type { MapMarker } from '@/lib/coverage-utils'
import type { MapRef } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'

export interface MobileMapViewProps {
  readonly markers: MapMarker[]
  readonly isLoading?: boolean
  readonly selectedMarkerId?: string | null
  readonly onMarkerTap?: (markerId: string) => void
  readonly onInspect?: (
    id: string,
    category: string,
    basic: { title: string; severity: string; ingestedAt: string },
  ) => void
  readonly categoryLabel?: string
}

export function MobileMapView({
  markers,
  isLoading,
  selectedMarkerId,
  onMarkerTap,
  onInspect,
  categoryLabel = 'All Categories',
}: MobileMapViewProps) {
  const mapRef = useRef<MapRef>(null)
  const geoControlAdded = useRef(false)

  // Attach GeolocateControl after map loads
  useEffect(() => {
    if (geoControlAdded.current) return

    const checkMap = () => {
      const map = mapRef.current?.getMap()
      if (!map) return
      geoControlAdded.current = true

      const geoControl = new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserLocation: true,
      })
      map.addControl(geoControl, 'bottom-right')
    }

    // Poll briefly for map readiness
    const id = setInterval(checkMap, 200)
    const timeout = setTimeout(() => clearInterval(id), 5000)
    return () => {
      clearInterval(id)
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="mobile-map-container">
      <CoverageMap
        categoryId="all"
        categoryName={categoryLabel}
        markers={markers}
        isLoading={isLoading}
        overview={false}
        onMarkerClick={onMarkerTap}
        onInspect={onInspect}
        selectedMarkerId={selectedMarkerId}
        externalMapRef={mapRef}
      />
    </div>
  )
}
