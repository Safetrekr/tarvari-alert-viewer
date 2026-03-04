/**
 * EnrichmentLayer -- gates ambient enrichment effects behind the
 * `effectsEnabled` user preference toggle.
 *
 * Wraps children with `aria-hidden="true"` and `pointer-events: none`
 * so enrichment visuals never interfere with interactive elements or
 * screen readers. Propagates a `data-panning` attribute that CSS
 * keyframes in `enrichment.css` use to pause animations during camera
 * motion (avoiding unnecessary GPU work while the viewport is moving).
 *
 * Returns `null` when effects are disabled -- children are never
 * mounted, so canvas/animation resources are fully released.
 *
 * @module enrichment-layer
 * @see WS-1.6 Ambient Effects Layer
 */

'use client'

import type { ReactNode } from 'react'
import { useSettingsStore } from '@/stores/settings.store'

interface EnrichmentLayerProps {
  children: ReactNode
  /** Whether the ZUI viewport is actively panning/animating. */
  isPanning: boolean
}

export function EnrichmentLayer({ children, isPanning }: EnrichmentLayerProps) {
  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)

  if (!effectsEnabled) return null

  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: 'none' }}
      data-panning={isPanning ? 'true' : 'false'}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}
