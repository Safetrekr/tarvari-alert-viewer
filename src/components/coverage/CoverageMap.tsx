/**
 * Interactive MapLibre GL JS map for the CategoryDetailScene.
 *
 * Renders intel alert markers on a dark-matter basemap with clustering,
 * severity-based coloring, and glass-themed popups. Auto-fits bounds
 * to marker data. Handles empty, loading, and WebGL error states.
 *
 * Loaded via `next/dynamic` with `ssr: false` to avoid server-side
 * rendering of the WebGL context.
 *
 * @module CoverageMap
 * @see WS-4.1
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Map,
  NavigationControl,
  Popup,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre'

import type { MapMarker } from '@/lib/coverage-utils'
import { calculateBounds } from '@/lib/coverage-utils'

import { markersToGeoJSON } from './map-utils'
import { MapPopup } from './MapPopup'
import {
  MapMarkerLayer,
  SOURCE_ID,
  CLUSTER_LAYER_ID,
  UNCLUSTERED_LAYER_ID,
} from './MapMarkerLayer'

// ============================================================================
// Constants
// ============================================================================

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 2,
}

const FIT_BOUNDS_PADDING = 60

// ============================================================================
// Popup state type
// ============================================================================

interface PopupState {
  longitude: number
  latitude: number
  title: string
  severity: string
  ingestedAt: string
}

// ============================================================================
// Props
// ============================================================================

interface CoverageMapProps {
  /** Category identifier for accessibility labeling. */
  readonly categoryId: string
  /** Human-readable category name for accessibility labeling. */
  readonly categoryName: string
  /** Array of map markers to render. */
  readonly markers: MapMarker[]
  /** Whether marker data is currently loading. */
  readonly isLoading?: boolean
}

// ============================================================================
// WebGL detection
// ============================================================================

function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

// ============================================================================
// Component
// ============================================================================

export function CoverageMap({
  categoryId,
  categoryName,
  markers,
  isLoading = false,
}: CoverageMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [webglError, setWebglError] = useState(false)

  // Check WebGL support on mount
  useEffect(() => {
    if (!isWebGLSupported()) {
      setWebglError(true)
    }
  }, [])

  // Convert markers to GeoJSON
  const geojson = useMemo(() => markersToGeoJSON(markers), [markers])

  // Auto-fit bounds when markers change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || markers.length === 0) return

    const bounds = calculateBounds(markers)

    if (bounds.bounds) {
      mapRef.current.fitBounds(bounds.bounds, {
        padding: FIT_BOUNDS_PADDING,
        maxZoom: 12,
        duration: 800,
      })
    } else if (bounds.center) {
      mapRef.current.flyTo({
        center: bounds.center,
        zoom: bounds.zoom ?? 2,
        duration: 800,
      })
    }
  }, [markers, mapLoaded])

  // Handle cluster click -- expand cluster
  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!mapRef.current || !e.features || e.features.length === 0) return

      const feature = e.features[0]
      const clusterId = feature.properties?.cluster_id

      // Cluster click: zoom into cluster
      if (clusterId !== undefined && feature.properties?.point_count !== undefined) {
        const source = mapRef.current.getSource(SOURCE_ID)
        if (source && 'getClusterExpansionZoom' in source) {
          const geoJSONSource = source as maplibregl.GeoJSONSource
          geoJSONSource.getClusterExpansionZoom(clusterId as number).then((zoom) => {
            const geometry = feature.geometry
            if (geometry.type === 'Point' && mapRef.current) {
              mapRef.current.easeTo({
                center: geometry.coordinates as [number, number],
                zoom,
                duration: 500,
              })
            }
          })
        }
        return
      }

      // Unclustered point click: show popup
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates
        setPopup({
          longitude: lng,
          latitude: lat,
          title: feature.properties?.title ?? 'Unknown',
          severity: feature.properties?.severity ?? 'Unknown',
          ingestedAt: feature.properties?.ingestedAt ?? new Date().toISOString(),
        })
      }
    },
    [],
  )

  // Cursor management
  const handleMouseEnter = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = 'pointer'
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = ''
    }
  }, [])

  // Accessibility: marker count for screen readers
  const markerCountLabel = markers.length === 1
    ? '1 alert marker'
    : `${markers.length} alert markers`

  // -- WebGL error state ------------------------------------------------

  if (webglError) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 200,
          borderRadius: 8,
          border: '1px dashed rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: 11,
            color: 'rgba(255, 255, 255, 0.15)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textAlign: 'center',
            padding: '0 16px',
          }}
        >
          WebGL not available — map cannot render
        </span>
      </div>
    )
  }

  // -- Main render ------------------------------------------------------

  return (
    <div
      role="application"
      aria-roledescription="map"
      aria-label={`${categoryName} alert locations — ${markers.length > 0 ? markerCountLabel : 'no markers'}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={MAP_STYLE}
        onLoad={() => setMapLoaded(true)}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={[CLUSTER_LAYER_ID, UNCLUSTERED_LAYER_ID]}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {markers.length > 0 && <MapMarkerLayer data={geojson} />}

        {popup && (
          <Popup
            longitude={popup.longitude}
            latitude={popup.latitude}
            anchor="bottom"
            closeOnClick={false}
            onClose={() => setPopup(null)}
          >
            <MapPopup
              title={popup.title}
              severity={popup.severity}
              ingestedAt={popup.ingestedAt}
              onClose={() => setPopup(null)}
            />
          </Popup>
        )}
      </Map>

      {/* Screen reader live region for marker count changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {markers.length > 0
          ? `Map showing ${markerCountLabel} for ${categoryName}`
          : `No alert markers for ${categoryName}`}
      </div>

      {/* Loading overlay */}
      {(isLoading || !mapLoaded) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(10, 14, 24, 0.6)',
            backdropFilter: 'blur(4px)',
            borderRadius: 8,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.25)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Loading map...
          </span>
        </div>
      )}

      {/* Empty state overlay (only after map loads and data is not loading) */}
      {mapLoaded && !isLoading && markers.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(10, 14, 24, 0.4)',
            borderRadius: 8,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-geist-mono, monospace)',
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.20)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            No geo-located alerts
          </span>
        </div>
      )}
    </div>
  )
}
