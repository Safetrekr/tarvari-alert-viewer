/**
 * GeoJSON marker layer for the coverage map.
 *
 * Renders a clustered point data source with three layers:
 *   1. Cluster circles (aggregated points)
 *   2. Cluster count labels
 *   3. Unclustered individual point circles (severity-colored)
 *
 * Uses MapLibre GL clustering with configurable radius and zoom.
 *
 * @module MapMarkerLayer
 * @see WS-4.1
 */

'use client'

import { Source, Layer, type LayerProps } from 'react-map-gl/maplibre'

import type { MarkerFeatureCollection } from './map-utils'
import { CIRCLE_COLOR_EXPRESSION } from './map-utils'

// ============================================================================
// Constants
// ============================================================================

export const SOURCE_ID = 'coverage-markers'
export const CLUSTER_LAYER_ID = 'clusters'
export const CLUSTER_COUNT_LAYER_ID = 'cluster-count'
export const UNCLUSTERED_LAYER_ID = 'unclustered-point'

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

const unclusteredPointLayer: LayerProps = {
  id: UNCLUSTERED_LAYER_ID,
  type: 'circle',
  source: SOURCE_ID,
  filter: ['!', ['has', 'point_count']],
  paint: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'circle-color': CIRCLE_COLOR_EXPRESSION as any,
    'circle-radius': 6,
    'circle-stroke-width': 1,
    'circle-stroke-color': 'rgba(0, 0, 0, 0.40)',
    'circle-opacity': 0.85,
  },
}

// ============================================================================
// Props
// ============================================================================

interface MapMarkerLayerProps {
  /** GeoJSON FeatureCollection of point markers. */
  readonly data: MarkerFeatureCollection
}

// ============================================================================
// Component
// ============================================================================

export function MapMarkerLayer({ data }: MapMarkerLayerProps) {
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
      <Layer {...unclusteredPointLayer} />
    </Source>
  )
}
