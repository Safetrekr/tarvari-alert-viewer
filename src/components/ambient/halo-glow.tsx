/**
 * HaloGlow -- radial gradient "breathing" glow behind the hub center.
 *
 * Renders an 800x800px div centered at world-space (0, 0) -- the same
 * origin as the capsule ring center. Uses a CSS radial gradient from
 * ember-tinted `rgba(var(--ember-rgb), 0.04)` at the center to fully
 * transparent at the edge. An 8-second CSS breathing animation cycles
 * the opacity between 0.3 and 0.7.
 *
 * The animation is defined in `src/styles/enrichment.css` as a pure
 * CSS `@keyframes` rule (Tier 3 animation per the project animation
 * strategy). It pauses automatically during panning via the
 * `[data-panning='true']` ancestor selector, and is removed entirely
 * when `prefers-reduced-motion: reduce` is active.
 *
 * Sizing note: At default zoom 0.5, the 800px world-space div renders
 * as 400px on screen -- a soft halo just inside the capsule orbit.
 *
 * @module halo-glow
 * @see WS-1.6 Ambient Effects Layer
 */

'use client'

import { useAttentionStore } from '@/stores/attention.store'

/**
 * World-space dimensions for the halo glow div.
 * Centered at (0,0) by using negative half-size offsets.
 */
const HALO_SIZE = 800

export function HaloGlow() {
  const isTightening = useAttentionStore((s) => s.attentionState === 'tighten')

  const centerOpacity = isTightening ? 0.14 : 0.08

  return (
    <div
      className="enrichment-halo absolute"
      style={{
        left: -(HALO_SIZE / 2),
        top: -(HALO_SIZE / 2),
        width: HALO_SIZE,
        height: HALO_SIZE,
        background: `radial-gradient(circle at center, rgba(var(--ember-rgb), ${centerOpacity}) 0%, transparent 70%)`,
        transition: 'background 500ms ease',
        pointerEvents: 'none',
      }}
    />
  )
}
