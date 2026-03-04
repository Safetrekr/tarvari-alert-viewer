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

/** Tarva color tokens for map customization. */
const TARVA_LAND = '#11151d'    // rgba(255,255,255,0.05) on --color-void #050911 — matches category card bg
const TARVA_BORDER_BRIGHT = 'rgba(255, 255, 255, 0.18)' // bright country outlines
const TARVA_BORDER_DIM = 'rgba(255, 255, 255, 0.08)'    // roads, minor lines

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
  /** If true, stay at global view — no auto-fit to markers. Markers pulse and fade. */
  readonly overview?: boolean
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
// Map navigation controls (pan + zoom)
// ============================================================================

const NAV_BTN: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 4,
  background: 'rgba(5, 9, 17, 0.85)',
  color: 'rgba(255,255,255,0.5)',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'var(--font-mono, monospace)',
  lineHeight: 1,
  padding: 0,
  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
}

function MapNavControls({ mapRef }: { mapRef: React.RefObject<MapRef | null> }) {
  const pan = useCallback((dx: number, dy: number) => {
    mapRef.current?.panBy([dx, dy], { duration: 300 })
  }, [mapRef])

  const zoom = useCallback((delta: number) => {
    const m = mapRef.current
    if (!m) return
    m.easeTo({ zoom: m.getZoom() + delta, duration: 300 })
  }, [mapRef])

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        pointerEvents: 'auto',
      }}
    >
      {/* Directional pad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 28px)', gap: 2 }}>
        <div />
        <button type="button" style={NAV_BTN} onClick={() => pan(0, -80)} aria-label="Pan up"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,9,17,0.85)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >&#9650;</button>
        <div />

        <button type="button" style={NAV_BTN} onClick={() => pan(-80, 0)} aria-label="Pan left"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,9,17,0.85)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >&#9664;</button>
        <div />
        <button type="button" style={NAV_BTN} onClick={() => pan(80, 0)} aria-label="Pan right"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,9,17,0.85)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >&#9654;</button>

        <div />
        <button type="button" style={NAV_BTN} onClick={() => pan(0, 80)} aria-label="Pan down"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,9,17,0.85)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >&#9660;</button>
        <div />
      </div>

      {/* Zoom controls */}
      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
        <button type="button" style={{ ...NAV_BTN, flex: 1, fontWeight: 700, fontSize: 16 }} onClick={() => zoom(1)} aria-label="Zoom in"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,9,17,0.85)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >+</button>
        <button type="button" style={{ ...NAV_BTN, flex: 1, fontWeight: 700, fontSize: 16 }} onClick={() => zoom(-1)} aria-label="Zoom out"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(5,9,17,0.85)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >−</button>
      </div>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function CoverageMap({
  categoryId,
  categoryName,
  markers,
  isLoading = false,
  overview = false,
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

  // Auto-fit bounds when markers change (disabled in overview mode)
  useEffect(() => {
    if (overview) return
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
  }, [markers, mapLoaded, overview])

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

  // Customize map colors on load: tarva gray land, transparent water
  const handleLoad = useCallback(() => {
    setMapLoaded(true)
    const mapInstance = mapRef.current?.getMap()
    if (!mapInstance) return

    // Make the background a dark translucent teal (ocean base)
    mapInstance.setPaintProperty('background', 'background-color', 'rgba(39, 115, 137, 0.08)')

    // Recolor all layers to match tarva design system
    const style = mapInstance.getStyle()
    if (!style?.layers) return

    const waterIds = ['water', 'ocean', 'sea', 'lake', 'river', 'waterway']
    const labelIds = ['label', 'name', 'text', 'place', 'poi', 'housenumber', 'roadname']
    const boundaryIds = ['boundary_country', 'boundary_state']

    for (const layer of style.layers) {
      const id = layer.id.toLowerCase()
      const isWater = waterIds.some((w) => id.includes(w))
      const isLabel = labelIds.some((l) => id.includes(l))
      const isBoundary = boundaryIds.some((b) => id.includes(b))

      // Water fills → dark translucent teal
      if (isWater && layer.type === 'fill') {
        mapInstance.setPaintProperty(layer.id, 'fill-color', 'rgba(39, 115, 137, 0.08)')
        continue
      }

      // Water lines → hide
      if (isWater && layer.type === 'line') {
        mapInstance.setPaintProperty(layer.id, 'line-color', 'transparent')
        continue
      }

      // Labels/symbols — leave as-is (CARTO style has good zoom ranges:
      // continent 0-2, country 2-7, cities 4+, etc.)
      if (isLabel || layer.type === 'symbol') continue

      // Country/state boundaries → bright, visible outlines
      if (isBoundary && layer.type === 'line') {
        mapInstance.setPaintProperty(layer.id, 'line-color', TARVA_BORDER_BRIGHT)
        mapInstance.setPaintProperty(layer.id, 'line-opacity', 1)
        mapInstance.setPaintProperty(layer.id, 'line-width', 1)
        continue
      }

      // All other fill layers (land, parks, buildings, etc.) → tarva gray
      if (layer.type === 'fill') {
        mapInstance.setPaintProperty(layer.id, 'fill-color', TARVA_LAND)
      }

      // All other line layers (roads, etc.) → dim
      if (layer.type === 'line') {
        mapInstance.setPaintProperty(layer.id, 'line-color', TARVA_BORDER_DIM)
      }
    }
  }, [])

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

  const cornerSize = 14
  const cornerOffset = -6
  const cornerThickness = 1.5
  const cornerColor = 'rgba(255, 255, 255, 0.18)'
  const glowColor = 'rgba(100, 180, 220, 0.12)'

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Decorative right-angle corner brackets (outside the map) */}
      {/* Top-left */}
      <div aria-hidden="true" style={{ position: 'absolute', top: cornerOffset, left: cornerOffset, width: cornerSize, height: cornerSize, zIndex: 15, pointerEvents: 'none', borderTop: `${cornerThickness}px solid ${cornerColor}`, borderLeft: `${cornerThickness}px solid ${cornerColor}` }} />
      {/* Top-right */}
      <div aria-hidden="true" style={{ position: 'absolute', top: cornerOffset, right: cornerOffset, width: cornerSize, height: cornerSize, zIndex: 15, pointerEvents: 'none', borderTop: `${cornerThickness}px solid ${cornerColor}`, borderRight: `${cornerThickness}px solid ${cornerColor}` }} />
      {/* Bottom-left */}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: cornerOffset, left: cornerOffset, width: cornerSize, height: cornerSize, zIndex: 15, pointerEvents: 'none', borderBottom: `${cornerThickness}px solid ${cornerColor}`, borderLeft: `${cornerThickness}px solid ${cornerColor}` }} />
      {/* Bottom-right */}
      <div aria-hidden="true" style={{ position: 'absolute', bottom: cornerOffset, right: cornerOffset, width: cornerSize, height: cornerSize, zIndex: 15, pointerEvents: 'none', borderBottom: `${cornerThickness}px solid ${cornerColor}`, borderRight: `${cornerThickness}px solid ${cornerColor}` }} />

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
          boxShadow: `inset 0 0 20px ${glowColor}, 0 0 15px ${glowColor}, 0 0 1px rgba(255,255,255,0.06)`,
        }}
      >
      <Map
        ref={mapRef}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={MAP_STYLE}
        onLoad={handleLoad}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={[CLUSTER_LAYER_ID, UNCLUSTERED_LAYER_ID]}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Custom nav controls rendered outside Map below */}

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

      {/* Custom map navigation controls -- upper left */}
      <MapNavControls mapRef={mapRef} />

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
    </div>
  )
}
