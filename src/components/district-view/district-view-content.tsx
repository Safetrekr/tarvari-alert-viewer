/**
 * DistrictViewContent -- renders the CategoryDetailScene for the
 * selected category, passing `dockSide` so the scene knows which
 * side to clear for the dock panel.
 *
 * Replaces the legacy SCENE_MAP (6 static entries) with a single
 * data-driven component that works for any category ID.
 *
 * @module district-view-content
 * @see WS-3.1 Section 4.2
 */

'use client'

import type { NodeId } from '@/lib/interfaces/district'
import type { PanelSide } from '@/lib/morph-types'
import { CategoryDetailScene } from './scenes'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DistrictViewContentProps {
  readonly districtId: NodeId
  readonly panelSide: PanelSide
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictViewContent({ districtId, panelSide }: DistrictViewContentProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      <CategoryDetailScene categoryId={districtId} dockSide={panelSide} />
    </div>
  )
}
