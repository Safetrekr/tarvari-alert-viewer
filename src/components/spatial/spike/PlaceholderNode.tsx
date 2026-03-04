/**
 * PlaceholderNode -- test element for the ZUI spike harness.
 *
 * Positioned at world coordinates (x, y) with capsule dimensions
 * (192x228px, 28px radius). Displays different content representations
 * based on the current semantic zoom level. Supports optional
 * backdrop-filter: blur(12px) for A/B performance testing.
 *
 * Implements pan-pause mitigation: when `pauseBlur` is true,
 * backdrop-filter is disabled even if `enableBlur` is true.
 * The spike page controls this based on camera animation state.
 *
 * @module PlaceholderNode
 * @see WS-0.3 Section 4.1.3
 * @see D4 (capsule dimensions for realistic testing)
 */

'use client'

import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import type { SemanticZoomLevel } from '@/stores/camera.store'

interface PlaceholderNodeProps {
  id: number
  /** World-space X position */
  x: number
  /** World-space Y position */
  y: number
  label: string
  /** Enable backdrop-filter: blur(12px) for performance testing */
  enableBlur?: boolean
  /** Pause blur during active pan/zoom (pan-pause mitigation) */
  pauseBlur?: boolean
}

function Z0Content({ id }: { id: number }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-4 w-4 rounded-full bg-ember-bright opacity-60" />
      <span className="sr-only">Node {id}</span>
    </div>
  )
}

function Z1Content({ id, label }: { id: number; label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember/20">
        <span className="font-mono text-sm text-ember-bright">{id}</span>
      </div>
      <span className="text-xs font-medium text-text-primary">{label}</span>
    </div>
  )
}

function Z2Content({ id, label, x, y }: { id: number; label: string; x: number; y: number }) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ember/20">
          <span className="font-mono text-xs text-ember-bright">{id}</span>
        </div>
        <span className="text-sm font-medium text-text-primary">{label}</span>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded-full bg-raised">
          <div className="h-full w-3/4 rounded-full bg-teal" />
        </div>
        <p className="font-mono text-[10px] text-text-tertiary">
          {Math.round(x)}, {Math.round(y)}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-healthy" />
        <span className="text-[10px] text-text-secondary">Online</span>
      </div>
    </div>
  )
}

function Z3Content({
  id,
  label,
  x,
  y,
  level,
}: {
  id: number
  label: string
  x: number
  y: number
  level: SemanticZoomLevel
}) {
  return (
    <div className="flex h-full flex-col justify-between p-3">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ember/20">
              <span className="font-mono text-[10px] text-ember-bright">{id}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary">{label}</p>
              <p className="font-mono text-[9px] text-text-ghost">{level}</p>
            </div>
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-healthy/20">
            <div className="h-2 w-2 rounded-full bg-healthy" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[9px]">
          <span className="text-text-tertiary">CPU</span>
          <span className="font-mono text-teal-bright">42%</span>
        </div>
        <div className="h-1 w-full rounded-full bg-raised">
          <div className="h-full w-[42%] rounded-full bg-teal" />
        </div>
        <div className="flex justify-between text-[9px]">
          <span className="text-text-tertiary">Memory</span>
          <span className="font-mono text-teal-bright">1.2G</span>
        </div>
        <div className="h-1 w-full rounded-full bg-raised">
          <div className="h-full w-[60%] rounded-full bg-teal" />
        </div>
      </div>

      <div className="border-t border-border-faint pt-1.5">
        <p className="font-mono text-[9px] text-text-ghost">
          pos: ({Math.round(x)}, {Math.round(y)})
        </p>
      </div>
    </div>
  )
}

export function PlaceholderNode({
  id,
  x,
  y,
  label,
  enableBlur = false,
  pauseBlur = false,
}: PlaceholderNodeProps) {
  const { level } = useSemanticZoom()

  // Pan-pause mitigation: disable blur during active motion
  const showBlur = enableBlur && !pauseBlur

  return (
    <div
      className="absolute rounded-[28px] border border-border-subtle bg-deep/80"
      style={{
        left: x,
        top: y,
        width: 192,
        height: 228,
        // Re-enable pointer events (canvas has pointer-events: none)
        pointerEvents: 'auto',
        // Conditional backdrop-filter for A/B testing
        backdropFilter: showBlur ? 'blur(12px)' : undefined,
        WebkitBackdropFilter: showBlur ? 'blur(12px)' : undefined,
      }}
    >
      {level === 'Z0' && <Z0Content id={id} />}
      {level === 'Z1' && <Z1Content id={id} label={label} />}
      {level === 'Z2' && <Z2Content id={id} label={label} x={x} y={y} />}
      {level === 'Z3' && <Z3Content id={id} label={label} x={x} y={y} level={level} />}
    </div>
  )
}
