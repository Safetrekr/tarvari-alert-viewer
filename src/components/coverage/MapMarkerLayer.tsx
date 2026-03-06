/**
 * GeoJSON marker layer for the coverage map.
 *
 * Renders a clustered point data source with layers:
 *   1. Cluster circles (aggregated points)
 *   2. Cluster count labels
 *   3. New-alert glow (breathing opacity behind dot)
 *   4. New-alert ping rings (expanding radar-style ripples)
 *   5. Unclustered individual point circles (severity-colored)
 *
 * Alerts ingested within the last 5 minutes are flagged `isNew` and
 * receive a breathing glow + dual radar-ping animation driven by rAF.
 *
 * @module MapMarkerLayer
 * @see WS-4.1
 */

'use client'

import { useEffect } from 'react'
import { Source, Layer, useMap, type LayerProps } from 'react-map-gl/maplibre'

import type { MarkerFeatureCollection } from './map-utils'
import {
  CIRCLE_COLOR_EXPRESSION,
  CIRCLE_RADIUS_EXPRESSION,
  NEW_GLOW_RADIUS_EXPRESSION,
  SELECTED_RING_RADIUS_EXPRESSION,
} from './map-utils'

// ============================================================================
// Constants
// ============================================================================

export const SOURCE_ID = 'coverage-markers'
export const CLUSTER_LAYER_ID = 'clusters'
export const CLUSTER_COUNT_LAYER_ID = 'cluster-count'
export const UNCLUSTERED_LAYER_ID = 'unclustered-point'

const NEW_GLOW_LAYER_ID = 'new-alert-glow'
const NEW_PING_1_LAYER_ID = 'new-alert-ping-1'
const NEW_PING_2_LAYER_ID = 'new-alert-ping-2'
const P1_GLOW_LAYER_ID = 'p1-priority-glow'

// ============================================================================
// Animation constants
// ============================================================================

const PING_CYCLE_MS = 2500
const GLOW_CYCLE_MS = 3000
const P1_GLOW_CYCLE_MS = 4000
const PING_MIN_RADIUS = 6
const PING_MAX_RADIUS = 28
const PING_MAX_OPACITY = 0.6

// ============================================================================
// Filter: unclustered + isNew
// ============================================================================

const IS_NEW_FILTER = ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isNew'], true]]

// ============================================================================
// Layer definitions
// ============================================================================

const clusterLayer: LayerProps = {
  id: CLUSTER_LAYER_ID,
  type: 'circle',
  source: SOURCE_ID,
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': 'rgba(255, 255, 255, 0.08)',
    'circle-radius': ['step', ['get', 'point_count'], 18, 10, 24, 50, 32],
    'circle-stroke-width': 1,
    'circle-stroke-color': 'rgba(255, 255, 255, 0.15)',
  },
}

const clusterCountLayer: LayerProps = {
  id: CLUSTER_COUNT_LAYER_ID,
  type: 'symbol',
  source: SOURCE_ID,
  filter: ['has', 'point_count'],
  layout: {
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['Noto Sans Regular'],
    'text-size': 11,
    'text-anchor': 'center',
    'text-offset': [0, 0.05],
  },
  paint: {
    'text-color': 'rgba(255, 255, 255, 0.50)',
  },
}

// P1 priority glow -- achromatic white halo behind P1 markers
const p1GlowLayer: LayerProps = {
  id: P1_GLOW_LAYER_ID,
  type: 'circle',
  source: SOURCE_ID,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'priority'], 'P1']] as any,
  paint: {
    'circle-color': 'rgba(255, 255, 255, 0.6)',
    'circle-radius': 16,
    'circle-opacity': 0.12,
    'circle-blur': 0.7,
  },
}

// Breathing glow behind new-alert dots (rendered before the dot layer)
const newGlowLayer: LayerProps = {
  id: NEW_GLOW_LAYER_ID,
  type: 'circle',
  source: SOURCE_ID,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: IS_NEW_FILTER as any,
  paint: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'circle-color': CIRCLE_COLOR_EXPRESSION as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'circle-radius': NEW_GLOW_RADIUS_EXPRESSION as any,
    'circle-opacity': 0.2,
    'circle-blur': 0.8,
  },
}

// Radar ping ring 1 (animated via rAF — initial values overridden)
const newPing1Layer: LayerProps = {
  id: NEW_PING_1_LAYER_ID,
  type: 'circle',
  source: SOURCE_ID,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: IS_NEW_FILTER as any,
  paint: {
    'circle-color': 'rgba(0, 0, 0, 0)',
    'circle-radius': PING_MIN_RADIUS,
    'circle-stroke-width': 1.5,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'circle-stroke-color': CIRCLE_COLOR_EXPRESSION as any,
    'circle-stroke-opacity': PING_MAX_OPACITY,
  },
}

// Radar ping ring 2 (offset by half cycle for continuous ripple)
const newPing2Layer: LayerProps = {
  id: NEW_PING_2_LAYER_ID,
  type: 'circle',
  source: SOURCE_ID,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: IS_NEW_FILTER as any,
  paint: {
    'circle-color': 'rgba(0, 0, 0, 0)',
    'circle-radius': PING_MIN_RADIUS,
    'circle-stroke-width': 1.5,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'circle-stroke-color': CIRCLE_COLOR_EXPRESSION as any,
    'circle-stroke-opacity': PING_MAX_OPACITY,
  },
}

const unclusteredPointLayer: LayerProps = {
  id: UNCLUSTERED_LAYER_ID,
  type: 'circle',
  source: SOURCE_ID,
  filter: ['!', ['has', 'point_count']],
  paint: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'circle-color': CIRCLE_COLOR_EXPRESSION as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'circle-radius': CIRCLE_RADIUS_EXPRESSION as any,
    'circle-stroke-width': 1,
    'circle-stroke-color': 'rgba(0, 0, 0, 0.40)',
    'circle-opacity': 0.85,
  },
}

// ============================================================================
// Animation hook
// ============================================================================

function useMarkerAnimation(hasNewAlerts: boolean, hasP1Markers: boolean) {
  const { current: mapRef } = useMap()

  useEffect(() => {
    const map = mapRef?.getMap()
    if (!map || (!hasNewAlerts && !hasP1Markers)) return

    let raf = 0

    const animate = () => {
      const t = performance.now()

      // P1 priority glow: slow achromatic breathing pulse
      if (hasP1Markers && map.getLayer(P1_GLOW_LAYER_ID)) {
        const p1Phase = (t % P1_GLOW_CYCLE_MS) / P1_GLOW_CYCLE_MS
        const p1Opacity = 0.12 + Math.sin(p1Phase * Math.PI * 2) * 0.06
        map.setPaintProperty(P1_GLOW_LAYER_ID, 'circle-opacity', p1Opacity)
      }

      // New-alert breathing glow: slow sinusoidal opacity oscillation
      if (hasNewAlerts) {
        const glowPhase = (t % GLOW_CYCLE_MS) / GLOW_CYCLE_MS
        const glowOpacity = 0.15 + Math.sin(glowPhase * Math.PI * 2) * 0.15
        if (map.getLayer(NEW_GLOW_LAYER_ID)) {
          map.setPaintProperty(NEW_GLOW_LAYER_ID, 'circle-opacity', Math.max(0, glowOpacity))
        }

        // Ping ring 1: expand from center, fade out
        const pingPhase1 = (t % PING_CYCLE_MS) / PING_CYCLE_MS
        const pingRadius1 = PING_MIN_RADIUS + pingPhase1 * (PING_MAX_RADIUS - PING_MIN_RADIUS)
        const pingOpacity1 = PING_MAX_OPACITY * (1 - pingPhase1)
        if (map.getLayer(NEW_PING_1_LAYER_ID)) {
          map.setPaintProperty(NEW_PING_1_LAYER_ID, 'circle-radius', pingRadius1)
          map.setPaintProperty(NEW_PING_1_LAYER_ID, 'circle-stroke-opacity', pingOpacity1)
          map.setPaintProperty(NEW_PING_1_LAYER_ID, 'circle-stroke-width', 1.5 * (1 - pingPhase1 * 0.6))
        }

        // Ping ring 2: same, offset by half cycle
        const pingPhase2 = ((t + PING_CYCLE_MS / 2) % PING_CYCLE_MS) / PING_CYCLE_MS
        const pingRadius2 = PING_MIN_RADIUS + pingPhase2 * (PING_MAX_RADIUS - PING_MIN_RADIUS)
        const pingOpacity2 = PING_MAX_OPACITY * (1 - pingPhase2)
        if (map.getLayer(NEW_PING_2_LAYER_ID)) {
          map.setPaintProperty(NEW_PING_2_LAYER_ID, 'circle-radius', pingRadius2)
          map.setPaintProperty(NEW_PING_2_LAYER_ID, 'circle-stroke-opacity', pingOpacity2)
          map.setPaintProperty(NEW_PING_2_LAYER_ID, 'circle-stroke-width', 1.5 * (1 - pingPhase2 * 0.6))
        }
      }

      raf = requestAnimationFrame(animate)
    }

    // Short delay to let layers mount
    const timeout = setTimeout(() => {
      raf = requestAnimationFrame(animate)
    }, 100)

    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [mapRef, hasNewAlerts, hasP1Markers])
}

// ============================================================================
// Props
// ============================================================================

const SELECTED_LAYER_ID = 'selected-alert-highlight'

interface MapMarkerLayerProps {
  /** GeoJSON FeatureCollection of point markers. */
  readonly data: MarkerFeatureCollection
  /** ID of the currently selected marker to highlight on the map. */
  readonly selectedMarkerId?: string | null
}

// ============================================================================
// Component
// ============================================================================

export function MapMarkerLayer({ data, selectedMarkerId }: MapMarkerLayerProps) {
  const hasNewAlerts = data.features.some((f) => f.properties.isNew)
  const hasP1Markers = data.features.some((f) => f.properties.priority === 'P1')

  useMarkerAnimation(hasNewAlerts, hasP1Markers)

  // Always-present highlight layer — filter matches nothing when no selection,
  // avoiding dynamic Layer mount/unmount which causes MapLibre _loaded errors.
  const selectedFilter = selectedMarkerId
    ? ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], selectedMarkerId]]
    : ['==', ['get', 'id'], '__none__']

  const selectedHighlightLayer: LayerProps = {
    id: SELECTED_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filter: selectedFilter as any,
    paint: {
      'circle-color': 'rgba(0, 0, 0, 0)',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'circle-radius': SELECTED_RING_RADIUS_EXPRESSION as any,
      'circle-stroke-width': 2,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'circle-stroke-color': CIRCLE_COLOR_EXPRESSION as any,
      'circle-stroke-opacity': 0.8,
    },
  }

  return (
    <Source
      id={SOURCE_ID}
      type="geojson"
      data={data}
      cluster={true}
      clusterMaxZoom={14}
      clusterRadius={50}
    >
      <Layer {...clusterLayer} />
      <Layer {...clusterCountLayer} />
      {/* P1 priority glow -- achromatic, rendered behind all dot effects */}
      <Layer {...p1GlowLayer} />
      {/* New-alert effects (rendered behind the dot) */}
      <Layer {...newGlowLayer} />
      <Layer {...newPing1Layer} />
      <Layer {...newPing2Layer} />
      {/* The actual dot on top */}
      <Layer {...unclusteredPointLayer} />
      {/* Selection highlight ring — always mounted, filter hides when no selection */}
      <Layer {...selectedHighlightLayer} />
    </Source>
  )
}
