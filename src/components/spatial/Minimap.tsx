/**
 * Minimap -- SVG overview of the spatial canvas.
 *
 * Renders a fixed glass panel in the bottom-right corner showing:
 * - District dots colored by health status
 * - Hub center dot (ember color)
 * - Viewport rectangle tracking the visible area
 * - Click-to-navigate (click anywhere on minimap to fly there)
 *
 * All positions are derived from the camera store and districts store,
 * mapped from world coordinates to minimap coordinates via a linear
 * scale transform.
 *
 * @module Minimap
 * @see WS-1.4 Deliverable 4.2
 */

'use client'

import { useCallback, useMemo } from 'react'

import { useCameraStore } from '@/stores/camera.store'
import { useDistrictsStore } from '@/stores/districts.store'
import type { AppTelemetry, AppStatus } from '@/lib/telemetry-types'
import { DISTRICTS, type DistrictMeta } from '@/lib/interfaces/district'
import {
  getDistrictWorldPosition,
  flyToWorldPoint,
} from '@/lib/spatial-actions'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimap default dimensions in pixels. */
const DEFAULT_WIDTH = 200
const DEFAULT_HEIGHT = 150

/** World bounds for Phase 1 (hardcoded). */
const WORLD_MIN_X = -600
const WORLD_MAX_X = 600
const WORLD_MIN_Y = -600
const WORLD_MAX_Y = 600
const WORLD_WIDTH = WORLD_MAX_X - WORLD_MIN_X
const WORLD_HEIGHT = WORLD_MAX_Y - WORLD_MIN_Y

/** District dot radius on the minimap (SVG units). */
const DOT_RADIUS = 3

/** Hub center dot radius on the minimap. */
const HUB_DOT_RADIUS = 2

/** Status color mapping for district dots. */
const STATUS_COLORS: Record<AppStatus, string> = {
  OPERATIONAL: 'var(--color-healthy, #22c55e)',
  DEGRADED: 'var(--color-warning, #eab308)',
  DOWN: 'var(--color-error, #ef4444)',
  OFFLINE: 'var(--color-offline, #6b7280)',
  UNKNOWN: 'var(--color-offline, #6b7280)',
}

/** Default color for districts without telemetry. */
const DEFAULT_DOT_COLOR = 'var(--color-offline, #6b7280)'

/** Ember color for the hub center dot. */
const EMBER_COLOR = 'var(--color-ember, #f97316)'

/** Viewport rect stroke color. */
const VIEWPORT_STROKE_COLOR = 'var(--color-ember-bright, #fb923c)'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MinimapCoords {
  mx: number
  my: number
}

/**
 * Convert world-space coordinates to minimap-space coordinates.
 */
function worldToMinimap(
  worldX: number,
  worldY: number,
  minimapWidth: number,
  minimapHeight: number,
): MinimapCoords {
  const scaleX = minimapWidth / WORLD_WIDTH
  const scaleY = minimapHeight / WORLD_HEIGHT
  return {
    mx: (worldX - WORLD_MIN_X) * scaleX,
    my: (worldY - WORLD_MIN_Y) * scaleY,
  }
}

/**
 * Convert minimap-space coordinates back to world-space.
 */
function minimapToWorld(
  mx: number,
  my: number,
  minimapWidth: number,
  minimapHeight: number,
): { worldX: number; worldY: number } {
  const scaleX = minimapWidth / WORLD_WIDTH
  const scaleY = minimapHeight / WORLD_HEIGHT
  return {
    worldX: mx / scaleX + WORLD_MIN_X,
    worldY: my / scaleY + WORLD_MIN_Y,
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface DistrictDotProps {
  district: DistrictMeta
  telemetry: AppTelemetry | undefined
  minimapWidth: number
  minimapHeight: number
}

function DistrictDot({
  district,
  telemetry,
  minimapWidth,
  minimapHeight,
}: DistrictDotProps) {
  const worldPos = getDistrictWorldPosition(district.ringIndex)
  const { mx, my } = worldToMinimap(
    worldPos.x,
    worldPos.y,
    minimapWidth,
    minimapHeight,
  )

  const fillColor = telemetry
    ? STATUS_COLORS[telemetry.status]
    : DEFAULT_DOT_COLOR

  return (
    <g>
      {/* District dot */}
      <circle
        cx={mx}
        cy={my}
        r={DOT_RADIUS}
        fill={fillColor}
        aria-label={`${district.displayName}: ${telemetry?.status ?? 'unknown'}`}
      >
        <title>
          {district.displayName} ({telemetry?.status ?? 'unknown'})
        </title>
      </circle>

      {/* District label */}
      <text
        x={mx}
        y={my + DOT_RADIUS + 9}
        textAnchor="middle"
        fill="var(--color-text-tertiary, #9ca3af)"
        style={{
          fontSize: '8px',
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          opacity: 0.5,
        }}
      >
        {district.shortName}
      </text>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MinimapProps {
  /** Width in pixels. Default: 200 */
  width?: number
  /** Height in pixels. Default: 150 */
  height?: number
  className?: string
}

export function Minimap({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className,
}: MinimapProps) {
  const offsetX = useCameraStore((s) => s.offsetX)
  const offsetY = useCameraStore((s) => s.offsetY)
  const zoom = useCameraStore((s) => s.zoom)
  const viewportWidth = useCameraStore((s) => s.viewportWidth)
  const viewportHeight = useCameraStore((s) => s.viewportHeight)
  const districts = useDistrictsStore((s) => s.districts)

  // Hub center on minimap (world origin 0, 0)
  const hubPos = useMemo(
    () => worldToMinimap(0, 0, width, height),
    [width, height],
  )

  // Viewport rectangle in minimap coordinates
  // Camera model: transform = translate(offsetX, offsetY) scale(zoom)
  // World point at screen (0, 0): worldX = -offsetX / zoom, worldY = -offsetY / zoom
  // Visible area in world: viewportWidth / zoom, viewportHeight / zoom
  const viewportRect = useMemo(() => {
    if (viewportWidth === 0 || viewportHeight === 0 || zoom === 0) {
      return null
    }

    const worldViewX = -offsetX / zoom
    const worldViewY = -offsetY / zoom
    const worldViewW = viewportWidth / zoom
    const worldViewH = viewportHeight / zoom

    const topLeft = worldToMinimap(worldViewX, worldViewY, width, height)
    const scaleX = width / WORLD_WIDTH
    const scaleY = height / WORLD_HEIGHT

    return {
      x: topLeft.mx,
      y: topLeft.my,
      width: worldViewW * scaleX,
      height: worldViewH * scaleY,
    }
  }, [offsetX, offsetY, zoom, viewportWidth, viewportHeight, width, height])

  // Click-to-navigate handler
  const handleClick = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      const svg = event.currentTarget.closest('svg')
      if (!svg) return

      const rect = svg.getBoundingClientRect()
      const mx = event.clientX - rect.left
      const my = event.clientY - rect.top

      const { worldX, worldY } = minimapToWorld(mx, my, width, height)

      // Fly to the clicked world position at the current zoom level
      flyToWorldPoint(worldX, worldY, zoom)
    },
    [width, height, zoom],
  )

  return (
    <div
      className={cn(
        'pointer-events-auto fixed right-4 bottom-10',
        'rounded-xl border border-white/6 bg-deep/80',
        'backdrop-blur-[8px]',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]',
        className,
      )}
      style={{ width, height }}
      role="img"
      aria-label="Spatial canvas minimap showing districts and current viewport position"
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block rounded-xl"
      >
        {/* Hub center dot */}
        <circle
          cx={hubPos.mx}
          cy={hubPos.my}
          r={HUB_DOT_RADIUS}
          fill={EMBER_COLOR}
          aria-label="Hub center"
        >
          <title>Hub center</title>
        </circle>

        {/* District dots */}
        {DISTRICTS.map((district) => (
          <DistrictDot
            key={district.id}
            district={district}
            telemetry={districts[district.id]}
            minimapWidth={width}
            minimapHeight={height}
          />
        ))}

        {/* Viewport rectangle */}
        {viewportRect && (
          <rect
            x={viewportRect.x}
            y={viewportRect.y}
            width={viewportRect.width}
            height={viewportRect.height}
            fill="none"
            stroke={VIEWPORT_STROKE_COLOR}
            strokeWidth={1}
            strokeOpacity={0.4}
            rx={1}
            aria-label="Current viewport area"
          />
        )}

        {/* Click overlay (transparent, captures clicks) */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          className="cursor-pointer"
          onClick={handleClick}
          aria-label="Click to navigate to position on canvas"
        />
      </svg>
    </div>
  )
}
