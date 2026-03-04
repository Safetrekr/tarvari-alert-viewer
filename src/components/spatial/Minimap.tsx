/**
 * Minimap -- SVG overview of the spatial canvas.
 *
 * Renders a fixed glass panel in the bottom-right corner showing:
 * - Category dots colored by category identity, positioned in an 8-column grid
 * - Viewport rectangle tracking the visible area
 * - Click-to-navigate (click anywhere on minimap to fly there)
 *
 * All positions are derived from the camera store and coverage category
 * grid layout, mapped from world coordinates to minimap coordinates
 * via a linear scale transform.
 *
 * @module Minimap
 * @see WS-3.2 Deliverable 4.3
 */

'use client'

import { useCallback, useMemo } from 'react'

import { useCameraStore } from '@/stores/camera.store'
import { KNOWN_CATEGORIES, type CategoryMeta } from '@/lib/interfaces/coverage'
import { GRID_WIDTH, GRID_HEIGHT, GRID_COLUMNS } from '@/components/coverage/CoverageGrid'
import { flyToWorldPoint } from '@/lib/spatial-actions'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimap default dimensions in pixels. */
const DEFAULT_WIDTH = 200
const DEFAULT_HEIGHT = 150

/** World bounds sized to encompass coverage grid + outward-pushed ambient panels. */
const WORLD_MIN_X = -1800
const WORLD_MAX_X = 1800
const WORLD_MIN_Y = -800
const WORLD_MAX_Y = 800
const WORLD_WIDTH = WORLD_MAX_X - WORLD_MIN_X
const WORLD_HEIGHT = WORLD_MAX_Y - WORLD_MIN_Y

/** Category dot radius on the minimap (SVG units). */
const DOT_RADIUS = 3

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

interface CategoryDotProps {
  category: CategoryMeta
  index: number
  minimapWidth: number
  minimapHeight: number
}

function CategoryDot({
  category,
  index,
  minimapWidth,
  minimapHeight,
}: CategoryDotProps) {
  // Derive world position from grid index
  const col = index % GRID_COLUMNS // 0-7
  const row = Math.floor(index / GRID_COLUMNS) // 0 or 1
  const cellWidth = GRID_WIDTH / GRID_COLUMNS
  const cellHeight = GRID_HEIGHT / 2 // 2 rows max

  // Grid is centered at world origin
  const worldX = -(GRID_WIDTH / 2) + col * cellWidth + cellWidth / 2
  const worldY = -(GRID_HEIGHT / 2) + row * cellHeight + cellHeight / 2

  const { mx, my } = worldToMinimap(worldX, worldY, minimapWidth, minimapHeight)

  return (
    <g>
      <circle
        cx={mx}
        cy={my}
        r={DOT_RADIUS}
        fill={category.color}
        aria-label={`${category.displayName} category`}
      >
        <title>{category.displayName}</title>
      </circle>
      <text
        x={mx}
        y={my + DOT_RADIUS + 9}
        textAnchor="middle"
        fill="var(--color-text-tertiary, #9ca3af)"
        style={{
          fontSize: '6px',
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          opacity: 0.5,
        }}
      >
        {category.shortName}
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
      aria-label="Spatial canvas minimap showing coverage categories and current viewport position"
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block rounded-xl"
      >
        {/* Category dots at grid positions */}
        {KNOWN_CATEGORIES.map((category, index) => (
          <CategoryDot
            key={category.id}
            category={category}
            index={index}
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
