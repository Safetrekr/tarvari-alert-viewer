/**
 * ZoomIndicator -- semantic zoom level badge.
 *
 * Displays the current semantic zoom level (Z0, Z1, Z2, Z3) as a
 * compact badge in the top-right corner of the viewport. Uses
 * @tarva/ui Badge with outline variant and spatial glass styling.
 *
 * @module ZoomIndicator
 * @see WS-1.4 Deliverable 4.4
 */

'use client'

import { Badge } from '@tarva/ui'

import { useCameraStore, type SemanticZoomLevel } from '@/stores/camera.store'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Label map
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<SemanticZoomLevel, string> = {
  Z0: 'Z0 Constellation',
  Z1: 'Z1 Launch',
  Z2: 'Z2 District',
  Z3: 'Z3 Station',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ZoomIndicatorProps {
  className?: string
}

export function ZoomIndicator({ className }: ZoomIndicatorProps) {
  const semanticLevel = useCameraStore((s) => s.semanticLevel)

  return (
    <div
      className={cn(className)}
    >
      <Badge
        variant="outline"
        className={cn(
          'font-mono text-[10px] font-medium',
          'tracking-[0.06em] uppercase',
          'bg-deep/60 border-white/8 text-text-secondary',
          'backdrop-blur-[8px]',
          'transition-all duration-300',
        )}
        aria-label={`Current zoom level: ${LEVEL_LABELS[semanticLevel]}`}
      >
        {semanticLevel}
      </Badge>
    </div>
  )
}
