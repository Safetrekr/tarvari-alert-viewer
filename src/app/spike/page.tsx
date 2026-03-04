/**
 * ZUI Tech Spike -- Test Harness Page
 *
 * Assembles the full spike: SpatialViewport > SpatialCanvas > N PlaceholderNodes.
 * Includes a fixed overlay with spike controls for interactive testing:
 * - Element count slider (10 / 20 / 30 / 50)
 * - Backdrop-filter toggle
 * - FPS counter (from fps-monitor.ts)
 * - Camera state readout
 * - Reset to Launch button
 * - Viewport bounds readout
 *
 * Placeholder elements are distributed in a ring layout:
 * - First 6: 300px radius, 60deg spacing
 * - Elements 7-12: 550px radius, 60deg spacing offset by 30deg
 * - Elements 13+: expanding radii at 45deg spacing
 *
 * @module spike/page
 * @see WS-0.3 Section 4.1.5
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SpatialViewport } from '@/components/spatial/SpatialViewport'
import { SpatialCanvas } from '@/components/spatial/SpatialCanvas'
import { PlaceholderNode } from '@/components/spatial/spike/PlaceholderNode'
import { useCameraStore, type SemanticZoomLevel } from '@/stores/camera.store'
import { useViewportCull } from '@/hooks/use-viewport-cull'
import { createFpsMonitor, type FpsSnapshot } from '@/lib/dev/fps-monitor'
import { PAN_PAUSE_DELAY_MS } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Ring layout generator
// ---------------------------------------------------------------------------

interface NodePosition {
  id: number
  x: number
  y: number
  label: string
}

const APP_LABELS = [
  'Agent Builder',
  'Tarva Chat',
  'Project Room',
  'TarvaCORE',
  'TarvaERP',
  'tarvaCODE',
  'Knowledge MCP',
  'Skill Resolver',
  'Agent Selector',
  'Ollama',
  'Supabase',
  'Embedding Srv',
  'Plugin Host',
  'Analytics',
  'Gateway API',
  'Auth Service',
  'File Storage',
  'Queue Worker',
  'Log Collector',
  'Config Vault',
  'CI Runner',
  'CDN Edge',
  'Webhook Relay',
  'Cron Scheduler',
  'Audit Logger',
  'Rate Limiter',
  'Schema Registry',
  'Feature Flags',
  'Notifications',
  'Health Monitor',
  'Event Bus',
  'Search Index',
  'Cache Layer',
  'Backup Agent',
  'DNS Manager',
  'Load Balancer',
  'Session Store',
  'Image Resizer',
  'PDF Generator',
  'Export Worker',
  'Import Worker',
  'Billing Engine',
  'Usage Tracker',
  'Playground Env',
  'Deploy Agent',
  'Test Runner',
  'Doc Generator',
  'API Explorer',
  'Sandbox Mgr',
  'Theme Builder',
]

function generateRingLayout(count: number): NodePosition[] {
  const positions: NodePosition[] = []

  // Center the layout: offset all positions so ring center is at (0,0)
  // minus half the node size so nodes are centered on their positions
  const halfW = 96 // 192 / 2
  const halfH = 114 // 228 / 2

  for (let i = 0; i < count; i++) {
    let radius: number
    let angleOffset: number
    let elementsInRing: number
    let indexInRing: number

    if (i < 6) {
      // First ring: 300px, 6 elements, 60deg spacing
      radius = 300
      elementsInRing = 6
      indexInRing = i
      angleOffset = -90 // Start from top
    } else if (i < 12) {
      // Second ring: 550px, 6 elements, 60deg spacing, offset 30deg
      radius = 550
      elementsInRing = 6
      indexInRing = i - 6
      angleOffset = -60 // 30deg offset from first ring
    } else if (i < 20) {
      // Third ring: 800px, 8 elements, 45deg spacing
      radius = 800
      elementsInRing = 8
      indexInRing = i - 12
      angleOffset = -90
    } else {
      // Fourth ring: 1050px, remaining elements evenly spaced
      radius = 1050
      elementsInRing = Math.max(count - 20, 1)
      indexInRing = i - 20
      angleOffset = -90
    }

    const angleDeg = angleOffset + (indexInRing / elementsInRing) * 360
    const angleRad = (angleDeg * Math.PI) / 180

    positions.push({
      id: i + 1,
      x: Math.round(Math.cos(angleRad) * radius) - halfW,
      y: Math.round(Math.sin(angleRad) * radius) - halfH,
      label: APP_LABELS[i % APP_LABELS.length],
    })
  }

  return positions
}

// ---------------------------------------------------------------------------
// Element count options
// ---------------------------------------------------------------------------

const ELEMENT_COUNTS = [10, 20, 30, 50] as const

// ---------------------------------------------------------------------------
// Spike Page
// ---------------------------------------------------------------------------

export default function SpikePage() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [elementCount, setElementCount] = useState<number>(10)
  const [enableBlur, setEnableBlur] = useState(false)
  const [fps, setFps] = useState<FpsSnapshot>({
    currentFps: 0,
    avgFps: 0,
    minFps: 0,
    frameTimes: [],
    droppedFrames: 0,
  })
  const [cameraReadout, setCameraReadout] = useState<{
    offsetX: number
    offsetY: number
    zoom: number
    semanticLevel: SemanticZoomLevel
    isAnimating: boolean
  }>({
    offsetX: 0,
    offsetY: 0,
    zoom: 0.5,
    semanticLevel: 'Z1',
    isAnimating: false,
  })

  // Pan-pause state: disable blur during motion, re-enable after 150ms still
  const [isPaused, setIsPaused] = useState(false)
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // FPS monitor
  const fpsMonitorRef = useRef(createFpsMonitor())

  // Viewport culling
  const { isVisible, bounds } = useViewportCull(viewportRef)

  // Generate node positions
  const nodes = useMemo(() => generateRingLayout(elementCount), [elementCount])

  // Start FPS monitor on mount
  useEffect(() => {
    const monitor = fpsMonitorRef.current
    monitor.start()

    // Poll FPS at 4Hz (not every frame -- this is for display only)
    const interval = setInterval(() => {
      setFps(monitor.snapshot())
    }, 250)

    return () => {
      monitor.stop()
      clearInterval(interval)
    }
  }, [])

  // Subscribe to camera state for readout (low frequency via rAF debounce)
  useEffect(() => {
    let rafId: number | null = null

    const unsubscribe = useCameraStore.subscribe((state) => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        setCameraReadout({
          offsetX: state.offsetX,
          offsetY: state.offsetY,
          zoom: state.zoom,
          semanticLevel: state.semanticLevel,
          isAnimating: state.isAnimating,
        })
      })
    })

    return () => {
      unsubscribe()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  // Pan-pause mitigation: disable blur during motion
  useEffect(() => {
    const unsubscribe = useCameraStore.subscribe((state) => {
      if (state.isAnimating) {
        setIsPaused(true)
        if (pauseTimerRef.current) {
          clearTimeout(pauseTimerRef.current)
          pauseTimerRef.current = null
        }
      } else {
        // Re-enable blur after delay
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
        pauseTimerRef.current = setTimeout(() => {
          setIsPaused(false)
          pauseTimerRef.current = null
        }, PAN_PAUSE_DELAY_MS)
      }
    })

    return () => {
      unsubscribe()
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current)
    }
  }, [])

  const handleReset = useCallback(() => {
    useCameraStore.getState().resetToLaunch()
  }, [])

  const handleResetFps = useCallback(() => {
    fpsMonitorRef.current.reset()
  }, [])

  return (
    <>
      <SpatialViewport viewportRef={viewportRef}>
        <SpatialCanvas>
          {nodes.map((node) => {
            // Viewport culling: skip rendering off-screen nodes
            if (!isVisible(node.x, node.y, 192, 228)) {
              return null
            }

            return (
              <PlaceholderNode
                key={node.id}
                id={node.id}
                x={node.x}
                y={node.y}
                label={node.label}
                enableBlur={enableBlur}
                pauseBlur={isPaused}
              />
            )
          })}
        </SpatialCanvas>
      </SpatialViewport>

      {/* ----------------------------------------------------------------
          Spike Control Overlay
          Fixed overlay with test controls. Positioned top-right.
          ---------------------------------------------------------------- */}
      <div
        className="pointer-events-none fixed inset-0 z-50"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {/* Controls panel */}
        <div className="pointer-events-auto absolute right-4 top-4 w-72 rounded-2xl border border-border-subtle bg-deep/90 p-4 backdrop-blur-lg">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ember-bright">
            ZUI Spike Controls
          </h2>

          {/* FPS Display */}
          <div className="mb-4 rounded-xl bg-abyss p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[10px] uppercase text-text-tertiary">FPS</span>
              <span
                className={`text-2xl font-bold tabular-nums ${
                  fps.avgFps >= 55
                    ? 'text-healthy'
                    : fps.avgFps >= 45
                      ? 'text-warning'
                      : 'text-error'
                }`}
              >
                {fps.currentFps}
              </span>
            </div>
            <div className="flex gap-3 text-[10px]">
              <span className="text-text-tertiary">
                avg <span className="text-text-secondary tabular-nums">{fps.avgFps}</span>
              </span>
              <span className="text-text-tertiary">
                min <span className="text-text-secondary tabular-nums">{fps.minFps}</span>
              </span>
              <span className="text-text-tertiary">
                drop{' '}
                <span
                  className={`tabular-nums ${fps.droppedFrames > 0 ? 'text-warning' : 'text-text-secondary'}`}
                >
                  {fps.droppedFrames}
                </span>
              </span>
            </div>
          </div>

          {/* Element Count */}
          <div className="mb-3">
            <label className="mb-1.5 block text-[10px] uppercase text-text-tertiary">
              Elements
            </label>
            <div className="flex gap-1.5">
              {ELEMENT_COUNTS.map((count) => (
                <button
                  key={count}
                  onClick={() => setElementCount(count)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    elementCount === count
                      ? 'bg-ember text-white'
                      : 'bg-raised text-text-secondary hover:bg-overlay hover:text-text-primary'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Backdrop Filter Toggle */}
          <div className="mb-3">
            <label className="flex items-center justify-between text-[10px] uppercase text-text-tertiary">
              <span>backdrop-filter</span>
              <button
                onClick={() => setEnableBlur(!enableBlur)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  enableBlur ? 'bg-ember' : 'bg-raised'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    enableBlur ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </label>
            {enableBlur && (
              <p className="mt-1 text-[9px] text-text-ghost">
                {isPaused ? 'PAUSED (pan active)' : 'ACTIVE (blur enabled)'}
              </p>
            )}
          </div>

          {/* Camera State */}
          <div className="mb-3 rounded-xl bg-abyss p-3">
            <p className="mb-1.5 text-[10px] uppercase text-text-tertiary">Camera</p>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-text-tertiary">offset</span>
                <span className="tabular-nums text-text-secondary">
                  {Math.round(cameraReadout.offsetX)}, {Math.round(cameraReadout.offsetY)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">zoom</span>
                <span className="tabular-nums text-text-secondary">
                  {cameraReadout.zoom.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">level</span>
                <span className="font-semibold text-ember-bright">
                  {cameraReadout.semanticLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-tertiary">animating</span>
                <span
                  className={
                    cameraReadout.isAnimating ? 'text-teal-bright' : 'text-text-ghost'
                  }
                >
                  {cameraReadout.isAnimating ? 'YES' : 'no'}
                </span>
              </div>
            </div>
          </div>

          {/* Viewport Bounds */}
          {bounds && (
            <div className="mb-3 rounded-xl bg-abyss p-3">
              <p className="mb-1.5 text-[10px] uppercase text-text-tertiary">Visible Bounds</p>
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">L / T</span>
                  <span className="tabular-nums text-text-secondary">
                    {Math.round(bounds.left)}, {Math.round(bounds.top)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">R / B</span>
                  <span className="tabular-nums text-text-secondary">
                    {Math.round(bounds.right)}, {Math.round(bounds.bottom)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg bg-ember px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              Reset to Launch
            </button>
            <button
              onClick={handleResetFps}
              className="rounded-lg bg-raised px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-overlay hover:text-text-primary"
            >
              Reset FPS
            </button>
          </div>
        </div>

        {/* Bottom-left: visible node count */}
        <div className="pointer-events-none absolute bottom-4 left-4">
          <p className="text-[10px] text-text-ghost">
            {nodes.filter((n) => isVisible(n.x, n.y, 192, 228)).length}/{nodes.length} nodes
            visible
          </p>
        </div>
      </div>
    </>
  )
}
