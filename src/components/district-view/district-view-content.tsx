/**
 * DistrictViewContent -- routes to the correct ambient scene based
 * on districtId, passing `dockSide` so scenes know which side to
 * clear for the dock panel.
 *
 * @module district-view-content
 */

'use client'

import type { DistrictId } from '@/lib/interfaces/district'
import type { PanelSide } from '@/lib/morph-types'
import {
  AgentBuilderScene,
  TarvaChatScene,
  ProjectRoomScene,
  TarvaCoreScene,
  TarvaErpScene,
  TarvaCodeScene,
} from './scenes'

// ---------------------------------------------------------------------------
// Scene lookup
// ---------------------------------------------------------------------------

const SCENE_MAP: Record<DistrictId, React.ComponentType<{ dockSide: PanelSide }>> = {
  'agent-builder': AgentBuilderScene,
  'tarva-chat': TarvaChatScene,
  'project-room': ProjectRoomScene,
  'tarva-core': TarvaCoreScene,
  'tarva-erp': TarvaErpScene,
  'tarva-code': TarvaCodeScene,
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DistrictViewContentProps {
  readonly districtId: DistrictId
  readonly panelSide: PanelSide
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictViewContent({ districtId, panelSide }: DistrictViewContentProps) {
  const Scene = SCENE_MAP[districtId]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <Scene dockSide={panelSide} />
    </div>
  )
}
