# React Developer -- Ambient Enrichment Implementation Plan

**Agent:** react-developer
**Scope:** ~10-12 new decorative components, 1 new CSS file, barrel export, page composition update
**Estimated new DOM nodes:** ~58-65
**Estimated new GPU layers:** 4-5
**Risk level:** Low (all decorative, no interactive state changes)

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [Composition Pattern (page.tsx)](#2-composition-pattern-pagetsx)
3. [Performance Strategy](#3-performance-strategy)
4. [New Files List](#4-new-files-list)
5. [CSS Architecture](#5-css-architecture)
6. [State Management](#6-state-management)
7. [Implementation Order](#7-implementation-order)
8. [Testing & Verification](#8-testing--verification)

---

## 1. Component Architecture

### 1.1 Directory Structure

All enrichment components live under `src/components/ambient/enrichment/`. This sits alongside the existing `src/components/ambient/` directory (which already contains `ParticleField`, `ScanlineOverlay`, `GlowBreathing`, `GridPulse`, `HeartbeatPulse`, `FilmGrain`). The new subdirectory keeps enrichment elements isolated from the Phase-1 ambient primitives while sharing the same barrel export at `src/components/ambient/index.ts`.

```
src/components/ambient/
  index.ts                          # Updated: adds enrichment re-exports
  enrichment/
    index.ts                        # Barrel export for all enrichment components
    AmbientLayer.tsx                # L1 wrapper (effectsEnabled gate, data-panning, aria-hidden)
    DataOverlayLayer.tsx            # L3 wrapper (same gates, higher z-order)
    ZoomGate.tsx                    # Zoom-conditional render utility
    OrbitalReadouts.tsx             # 8-12 mono text blocks around ring
    RangeRings.tsx                  # 2-3 concentric SVG circles + tick marks
    HaloGlow.tsx                    # Radial gradient behind hub center
    ConnectionPaths.tsx             # Animated SVG bezier curves between capsules
    HorizonScanLine.tsx             # Slow horizontal sweep line
    SystemStatusPanel.tsx           # Left-sidebar readout panel
    FeedPanel.tsx                   # Right-sidebar connection panel
    SignalPulseMonitor.tsx          # ECG/waveform SVG animation
    ActivityTicker.tsx              # Scrolling mono text ribbon
    RadialGaugeCluster.tsx          # 3 concentric SVG ring gauges
    CoordinateOverlays.tsx          # Registration marks, crosshairs, axis labels
    DeepZoomDetails.tsx             # Circuit traces, hex grid (Z2/Z3 only)
```

### 1.2 Wrapper Components

#### AmbientLayer

The `AmbientLayer` is the L1 container placed BEHIND the capsule ring inside `SpatialCanvas`. It renders enrichment elements that should appear underneath the interactive capsules.

```tsx
// src/components/ambient/enrichment/AmbientLayer.tsx
'use client'

import type { ReactNode } from 'react'
import { useSettingsStore } from '@/stores/settings.store'

interface AmbientLayerProps {
  isPanActive: boolean
  children: ReactNode
}

export function AmbientLayer({ isPanActive, children }: AmbientLayerProps) {
  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)

  if (!effectsEnabled) return null

  return (
    <div
      aria-hidden="true"
      data-panning={isPanActive ? 'true' : 'false'}
      style={{ pointerEvents: 'none' }}
    >
      {children}
    </div>
  )
}
```

Key behaviors:
- Returns `null` when `effectsEnabled === false` (settings store toggle)
- Propagates `data-panning` attribute for CSS `animation-play-state` rules
- Sets `aria-hidden="true"` so screen readers skip the entire subtree
- Sets `pointer-events: none` to prevent blocking capsule interactions

#### DataOverlayLayer

The `DataOverlayLayer` is the L3 container placed ABOVE the capsule ring. It hosts data panels that render on top of capsules but remain non-interactive (decorative readouts).

```tsx
// src/components/ambient/enrichment/DataOverlayLayer.tsx
'use client'

import type { ReactNode } from 'react'
import { useSettingsStore } from '@/stores/settings.store'

interface DataOverlayLayerProps {
  isPanActive: boolean
  children: ReactNode
}

export function DataOverlayLayer({ isPanActive, children }: DataOverlayLayerProps) {
  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)

  if (!effectsEnabled) return null

  return (
    <div
      aria-hidden="true"
      data-panning={isPanActive ? 'true' : 'false'}
      style={{ pointerEvents: 'none' }}
    >
      {children}
    </div>
  )
}
```

#### ZoomGate

A render-gating utility that conditionally mounts children based on the current semantic zoom level. Avoids rendering deep-zoom details at Z0/Z1 where they are invisible.

```tsx
// src/components/ambient/enrichment/ZoomGate.tsx
'use client'

import type { ReactNode } from 'react'
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import type { SemanticZoomLevel } from '@/stores/camera.store'

interface ZoomGateProps {
  /** Minimum zoom level required to render children. */
  min?: SemanticZoomLevel
  /** Maximum zoom level allowed for rendering children. */
  max?: SemanticZoomLevel
  children: ReactNode
}

const ZOOM_ORDER: Record<SemanticZoomLevel, number> = {
  Z0: 0,
  Z1: 1,
  Z2: 2,
  Z3: 3,
}

export function ZoomGate({ min, max, children }: ZoomGateProps) {
  const { level } = useSemanticZoom()
  const current = ZOOM_ORDER[level]

  if (min && current < ZOOM_ORDER[min]) return null
  if (max && current > ZOOM_ORDER[max]) return null

  return <>{children}</>
}
```

Usage examples:
- `<ZoomGate min="Z1">` -- visible at Z1, Z2, Z3 (hide at Z0 constellation)
- `<ZoomGate min="Z2">` -- visible at Z2 and Z3 only (deep zoom details)
- `<ZoomGate min="Z1" max="Z2">` -- visible at Z1 and Z2, hidden at Z0 and Z3

### 1.3 Enrichment Components

Each component below follows these universal rules:
- `aria-hidden="true"` on the root element
- `pointer-events: none` on the root element
- Reads from stores imperatively (subscribe pattern) for high-frequency data, or via selectors for low-frequency data
- CSS animations include `[data-panning='true']` pause rules
- Reduced motion handled via CSS `@media (prefers-reduced-motion: reduce)` in `ambient-enrichment.css`
- No internal state management -- all data derived from existing stores

---

#### OrbitalReadouts

**Purpose:** 8-12 small monospace text blocks positioned around the capsule ring perimeter at ~400px radius, displaying ghost-opacity data like coordinates, timestamps, and system identifiers. Evokes the Oblivion light table data density.

**Placement:** World-space, inside `AmbientLayer` (L1). Positioned absolutely within the 840x840 ring coordinate system, offset to a ~400px radius (just outside the 300px capsule ring).

**DOM footprint:** 10 `<span>` elements inside 1 container `<div>` = 11 nodes

**Animation tier:** CSS @keyframes -- `flicker` animation with staggered delays, 8-12s cycle per readout.

```tsx
// src/components/ambient/enrichment/OrbitalReadouts.tsx
'use client'

import { useMemo } from 'react'
import { CAPSULE_RING_RADIUS } from '@/lib/constants'
import '@/styles/ambient-enrichment.css'

const READOUT_RADIUS = CAPSULE_RING_RADIUS + 120 // 420px, well outside capsule edge
const RING_CENTER = 420 // Half of 840px ring container
const READOUT_COUNT = 10
const START_ANGLE_DEG = -108 // Offset from capsule positions to avoid overlap

interface ReadoutData {
  label: string
  angleDeg: number
}

function generateReadouts(): ReadoutData[] {
  const labels = [
    'SYS.NOMINAL',
    'θ 047.2',
    'δ -12.8',
    'EPOCH 2026.058',
    'UTC+00:00',
    'λ 224.082',
    'FREQ 1420MHz',
    'SNR 42.7dB',
    'MAG 6.2',
    'AZ 182.4',
  ]
  const spacing = 360 / READOUT_COUNT
  return labels.map((label, i) => ({
    label,
    angleDeg: START_ANGLE_DEG + i * spacing,
  }))
}

export function OrbitalReadouts() {
  const readouts = useMemo(() => generateReadouts(), [])

  return (
    <div
      className="absolute"
      style={{
        left: -(840 / 2),
        top: -(840 / 2),
        width: 840,
        height: 840,
      }}
    >
      {readouts.map((readout, i) => {
        const angleRad = (readout.angleDeg * Math.PI) / 180
        const x = RING_CENTER + READOUT_RADIUS * Math.cos(angleRad)
        const y = RING_CENTER + READOUT_RADIUS * Math.sin(angleRad)

        return (
          <span
            key={readout.label}
            className="enrichment-readout absolute font-mono text-[9px] tracking-[0.08em] uppercase"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              color: 'var(--color-text-ghost)',
              opacity: 0.3,
              animationDelay: `${i * 1.2}s`,
            }}
          >
            {readout.label}
          </span>
        )
      })}
    </div>
  )
}
```

---

#### RangeRings

**Purpose:** 2-3 concentric SVG circles with tick marks and compass labels (N, E, S, W) providing a targeting-reticle aesthetic around the capsule ring.

**Placement:** World-space, inside `AmbientLayer` (L1). Centered at origin, concentric with capsule ring.

**DOM footprint:** 1 `<svg>` with ~3 `<circle>` + ~16 `<line>` (ticks) + 4 `<text>` (compass) = ~24 SVG child nodes, 1 DOM node

**Animation tier:** CSS @keyframes -- `ring-rotate` animation, 90s full rotation. Extremely slow, purely ambient.

```tsx
// src/components/ambient/enrichment/RangeRings.tsx
'use client'

import '@/styles/ambient-enrichment.css'

const SVG_SIZE = 1200 // Large enough to encompass all rings
const CENTER = SVG_SIZE / 2
const RING_RADII = [200, 350, 500] // Inner, middle (near capsules), outer
const TICK_COUNT = 24 // Ticks per ring
const TICK_LENGTH = 8

const COMPASS_LABELS = [
  { label: 'N', angle: -90 },
  { label: 'E', angle: 0 },
  { label: 'S', angle: 90 },
  { label: 'W', angle: 180 },
]

export function RangeRings() {
  return (
    <svg
      className="enrichment-range-rings absolute"
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={{
        left: -(SVG_SIZE / 2),
        top: -(SVG_SIZE / 2),
      }}
    >
      {/* Concentric ring circles */}
      {RING_RADII.map((radius, ringIdx) => (
        <g key={`ring-${ringIdx}`}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={1}
            strokeDasharray={ringIdx === 1 ? 'none' : '4 8'}
          />

          {/* Tick marks */}
          {Array.from({ length: TICK_COUNT }).map((_, tickIdx) => {
            const angle = (tickIdx * 360) / TICK_COUNT - 90
            const rad = (angle * Math.PI) / 180
            const x1 = CENTER + (radius - TICK_LENGTH / 2) * Math.cos(rad)
            const y1 = CENTER + (radius - TICK_LENGTH / 2) * Math.sin(rad)
            const x2 = CENTER + (radius + TICK_LENGTH / 2) * Math.cos(rad)
            const y2 = CENTER + (radius + TICK_LENGTH / 2) * Math.sin(rad)
            const isMajor = tickIdx % 6 === 0

            return (
              <line
                key={`tick-${ringIdx}-${tickIdx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={`rgba(255, 255, 255, ${isMajor ? 0.06 : 0.025})`}
                strokeWidth={isMajor ? 1 : 0.5}
              />
            )
          })}
        </g>
      ))}

      {/* Compass labels on outermost ring */}
      {COMPASS_LABELS.map(({ label, angle }) => {
        const rad = (angle * Math.PI) / 180
        const labelRadius = RING_RADII[2] + 24
        const x = CENTER + labelRadius * Math.cos(rad)
        const y = CENTER + labelRadius * Math.sin(rad)

        return (
          <text
            key={label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255, 255, 255, 0.08)"
            fontSize={11}
            fontFamily="var(--font-mono)"
            letterSpacing="0.12em"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}
```

---

#### HaloGlow

**Purpose:** Soft radial gradient positioned behind the hub center glyph, creating a luminous ember haze that gives the center visual weight.

**Placement:** World-space, inside `AmbientLayer` (L1). Centered at origin (0, 0).

**DOM footprint:** 1 `<div>` = 1 node

**Animation tier:** CSS @keyframes -- `halo-breathe` animation, 8s cycle, scales opacity 0.3-0.5.

```tsx
// src/components/ambient/enrichment/HaloGlow.tsx
'use client'

import '@/styles/ambient-enrichment.css'

const HALO_SIZE = 480 // Diameter of the glow region

export function HaloGlow() {
  return (
    <div
      className="enrichment-halo absolute"
      style={{
        width: HALO_SIZE,
        height: HALO_SIZE,
        left: -(HALO_SIZE / 2),
        top: -(HALO_SIZE / 2),
        borderRadius: '50%',
        background: `radial-gradient(
          circle at center,
          rgba(224, 82, 0, 0.06) 0%,
          rgba(224, 82, 0, 0.03) 30%,
          rgba(224, 82, 0, 0.01) 60%,
          transparent 100%
        )`,
      }}
    />
  )
}
```

---

#### ConnectionPaths

**Purpose:** Animated SVG bezier curves connecting capsule positions to the hub center, suggesting data flow between districts. Paths animate in on mount with `pathLength` draw-on effect.

**Placement:** World-space, inside `AmbientLayer` (L1). SVG overlays the ring coordinate space.

**DOM footprint:** 1 `<svg>` with 6 `<path>` = 7 SVG nodes, 1 DOM node

**Animation tier:** motion/react -- `pathLength` spring animation for entrance, then CSS @keyframes `stream-flow` for ongoing stroke-dashoffset animation to simulate data flow.

```tsx
// src/components/ambient/enrichment/ConnectionPaths.tsx
'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import { CAPSULE_RING_RADIUS, CAPSULE_ANGULAR_SPACING } from '@/lib/constants'
import '@/styles/ambient-enrichment.css'

const RING_CENTER = 420
const SVG_SIZE = 840
const START_ANGLE_DEG = -90

function capsuleCenter(ringIndex: number): { x: number; y: number } {
  const angleDeg = START_ANGLE_DEG + ringIndex * CAPSULE_ANGULAR_SPACING
  const rad = (angleDeg * Math.PI) / 180
  return {
    x: RING_CENTER + CAPSULE_RING_RADIUS * Math.cos(rad),
    y: RING_CENTER + CAPSULE_RING_RADIUS * Math.sin(rad),
  }
}

function buildCurvePath(ringIndex: number): string {
  const capsule = capsuleCenter(ringIndex)
  // Control point at ~40% distance from center, offset perpendicular for curve
  const angleDeg = START_ANGLE_DEG + ringIndex * CAPSULE_ANGULAR_SPACING
  const perpRad = ((angleDeg + 90) * Math.PI) / 180
  const midX = (RING_CENTER + capsule.x) / 2
  const midY = (RING_CENTER + capsule.y) / 2
  const cpOffset = 30
  const cpX = midX + cpOffset * Math.cos(perpRad)
  const cpY = midY + cpOffset * Math.sin(perpRad)

  return `M ${RING_CENTER} ${RING_CENTER} Q ${cpX} ${cpY} ${capsule.x} ${capsule.y}`
}

export function ConnectionPaths() {
  const paths = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      d: buildCurvePath(i),
      index: i,
    })),
    [],
  )

  return (
    <svg
      className="absolute"
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={{
        left: -(SVG_SIZE / 2),
        top: -(SVG_SIZE / 2),
      }}
    >
      {paths.map(({ d, index }) => (
        <motion.path
          key={index}
          d={d}
          fill="none"
          stroke="rgba(39, 115, 137, 0.08)"
          strokeWidth={1}
          strokeLinecap="round"
          className="enrichment-connection-path"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: {
              type: 'spring',
              stiffness: 40,
              damping: 20,
              delay: index * 0.15,
            },
            opacity: {
              duration: 0.4,
              delay: index * 0.15,
            },
          }}
          style={{
            strokeDasharray: '4 12',
          }}
        />
      ))}
    </svg>
  )
}
```

---

#### HorizonScanLine

**Purpose:** A slow horizontal sweep line that moves top-to-bottom across the ring area on a long cycle, evoking a radar sweep.

**Placement:** World-space, inside `AmbientLayer` (L1). Full height of ring container.

**DOM footprint:** 1 `<div>` = 1 node

**Animation tier:** CSS @keyframes -- `horizon-sweep` animation, 20s cycle, translateY from -100% to 100%.

```tsx
// src/components/ambient/enrichment/HorizonScanLine.tsx
'use client'

import '@/styles/ambient-enrichment.css'

const SWEEP_WIDTH = 900
const SWEEP_HEIGHT = 900

export function HorizonScanLine() {
  return (
    <div
      className="enrichment-horizon-scan absolute overflow-hidden"
      style={{
        width: SWEEP_WIDTH,
        height: SWEEP_HEIGHT,
        left: -(SWEEP_WIDTH / 2),
        top: -(SWEEP_HEIGHT / 2),
      }}
    >
      <div
        className="enrichment-horizon-line absolute left-0 right-0 h-px"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            rgba(39, 115, 137, 0.06) 20%,
            rgba(39, 115, 137, 0.12) 50%,
            rgba(39, 115, 137, 0.06) 80%,
            transparent 100%
          )`,
          boxShadow: '0 0 8px rgba(39, 115, 137, 0.08)',
        }}
      />
    </div>
  )
}
```

---

#### SystemStatusPanel

**Purpose:** A fixed-position left-sidebar readout panel displaying system-level metrics in Oblivion-style vertical stacked fields. Shows aggregate health, uptime, last scan time, and system pulse.

**Placement:** Fixed-position (viewport-space, NOT world-space). Inside `DataOverlayLayer` but rendered fixed to screen left edge. Only visible at Z1+.

**DOM footprint:** 1 container `<div>` + ~8 label/value pairs = ~17 nodes

**Animation tier:** motion/react -- panel entrance (slideX from -20px, opacity 0 to 1). Static content, no ongoing animation.

```tsx
// src/components/ambient/enrichment/SystemStatusPanel.tsx
'use client'

import { motion } from 'motion/react'
import { useDistrictsStore } from '@/stores/districts.store'
import '@/styles/ambient-enrichment.css'

interface StatusField {
  label: string
  value: string
}

function useSystemFields(): StatusField[] {
  const lastSnapshotAt = useDistrictsStore((s) => s.lastSnapshotAt)
  const districts = useDistrictsStore((s) => s.districts)

  const districtCount = Object.keys(districts).length
  const operationalCount = Object.values(districts)
    .filter((d) => d.status === 'OPERATIONAL').length

  const lastScan = lastSnapshotAt
    ? new Date(lastSnapshotAt).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--'

  return [
    { label: 'SYS.STATUS', value: operationalCount === districtCount ? 'NOMINAL' : 'DEGRADED' },
    { label: 'DISTRICTS', value: `${operationalCount}/${districtCount || 6}` },
    { label: 'LAST.SCAN', value: lastScan },
    { label: 'UPTIME', value: '99.7%' },
    { label: 'EPOCH', value: new Date().toISOString().slice(0, 10) },
    { label: 'CYCLE', value: String(Math.floor(Date.now() / 86400000) % 1000).padStart(3, '0') },
  ]
}

export function SystemStatusPanel() {
  const fields = useSystemFields()

  return (
    <motion.div
      className="enrichment-status-panel fixed left-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }}
    >
      {/* Panel header */}
      <div className="font-mono text-[8px] tracking-[0.12em] text-[var(--color-text-ghost)] uppercase">
        SYS.MONITOR
      </div>

      {/* Fields */}
      {fields.map((field) => (
        <div key={field.label} className="flex flex-col gap-0.5">
          <span className="font-mono text-[7px] tracking-[0.12em] text-[var(--color-text-ghost)] uppercase">
            {field.label}
          </span>
          <span className="font-mono text-[10px] tracking-[0.04em] text-[var(--color-text-tertiary)]">
            {field.value}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
```

---

#### FeedPanel

**Purpose:** A fixed-position right-sidebar connection panel showing recent activity feed entries. Displays the last 5-6 events from the system in a vertical stack.

**Placement:** Fixed-position (viewport-space). Right edge. Only visible at Z1+.

**DOM footprint:** 1 container `<div>` + ~6 entries at ~3 nodes each = ~19 nodes

**Animation tier:** motion/react -- panel entrance (slideX from +20px). CSS @keyframes `feed-pulse` for new-entry highlight.

```tsx
// src/components/ambient/enrichment/FeedPanel.tsx
'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import '@/styles/ambient-enrichment.css'

interface FeedEntry {
  id: string
  source: string
  message: string
  time: string
}

function useFeedEntries(): FeedEntry[] {
  return useMemo(() => [
    { id: '1', source: 'BUILDER', message: 'Agent deployed', time: '2m' },
    { id: '2', source: 'CHAT', message: 'Session active', time: '4m' },
    { id: '3', source: 'PROJECTS', message: 'Task completed', time: '7m' },
    { id: '4', source: 'CORE', message: 'Model loaded', time: '12m' },
    { id: '5', source: 'ERP', message: 'Sync complete', time: '15m' },
  ], [])
}

export function FeedPanel() {
  const entries = useFeedEntries()

  return (
    <motion.div
      className="enrichment-feed-panel fixed right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.7 }}
    >
      {/* Panel header */}
      <div className="font-mono text-[8px] tracking-[0.12em] text-[var(--color-text-ghost)] uppercase">
        FEED
      </div>

      {/* Entries */}
      {entries.map((entry, i) => (
        <div key={entry.id} className="flex items-baseline gap-2">
          <span className="font-mono text-[7px] tracking-[0.08em] text-[var(--color-teal)] opacity-40">
            {entry.source}
          </span>
          <span className="font-mono text-[8px] text-[var(--color-text-ghost)]">
            {entry.message}
          </span>
          <span className="ml-auto font-mono text-[7px] text-[var(--color-text-ghost)] opacity-30">
            {entry.time}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
```

---

#### SignalPulseMonitor

**Purpose:** An ECG/waveform SVG animation displaying a looping heartbeat-style line, positioned near the system status panel. Conveys system vitality.

**Placement:** Fixed-position (viewport-space). Bottom-left corner, above the Tarva star.

**DOM footprint:** 1 `<svg>` with 1 `<polyline>` + 1 mask `<rect>` = 3 SVG nodes

**Animation tier:** CSS @keyframes -- `pulse-sweep` animation, 4s cycle, translateX of the clipping mask to reveal the waveform progressively.

```tsx
// src/components/ambient/enrichment/SignalPulseMonitor.tsx
'use client'

import '@/styles/ambient-enrichment.css'

const WAVEFORM_WIDTH = 120
const WAVEFORM_HEIGHT = 32

// ECG-style waveform points (x, y) normalized to the viewBox
const WAVEFORM_POINTS = [
  [0, 16], [10, 16], [15, 16], [20, 14], [22, 4], [24, 28], [26, 10],
  [28, 16], [35, 16], [45, 16], [50, 14], [52, 4], [54, 28], [56, 10],
  [58, 16], [65, 16], [75, 16], [80, 14], [82, 4], [84, 28], [86, 10],
  [88, 16], [95, 16], [105, 16], [110, 14], [112, 4], [114, 28], [116, 10],
  [118, 16], [120, 16],
].map(([x, y]) => `${x},${y}`).join(' ')

export function SignalPulseMonitor() {
  return (
    <div className="enrichment-pulse-monitor fixed bottom-14 left-4 z-10">
      <div className="mb-1 font-mono text-[7px] tracking-[0.12em] text-[var(--color-text-ghost)] uppercase">
        PULSE
      </div>
      <svg
        width={WAVEFORM_WIDTH}
        height={WAVEFORM_HEIGHT}
        viewBox={`0 0 ${WAVEFORM_WIDTH} ${WAVEFORM_HEIGHT}`}
      >
        <polyline
          points={WAVEFORM_POINTS}
          fill="none"
          stroke="var(--color-teal)"
          strokeWidth={1}
          opacity={0.25}
        />
        {/* Sweeping highlight mask */}
        <rect
          className="enrichment-pulse-sweep"
          x={0}
          y={0}
          width={24}
          height={WAVEFORM_HEIGHT}
          fill="url(#pulse-gradient)"
        />
        <defs>
          <linearGradient id="pulse-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(39, 115, 137, 0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
```

---

#### ActivityTicker

**Purpose:** A horizontally scrolling mono text ribbon near the bottom of the viewport displaying a continuous stream of system events and status messages.

**Placement:** Fixed-position (viewport-space). Bottom edge, full width.

**DOM footprint:** 1 container `<div>` + 2 `<span>` (duplicated for seamless loop) = 3 nodes

**Animation tier:** CSS @keyframes -- `ticker-scroll` animation, 30s linear infinite. The content is duplicated so the second copy scrolls in seamlessly as the first exits.

```tsx
// src/components/ambient/enrichment/ActivityTicker.tsx
'use client'

import '@/styles/ambient-enrichment.css'

const TICKER_MESSAGES = [
  'SYS.CHECK PASSED',
  'BUILDER:AGENT.DEPLOY OK',
  'CHAT:SESSION.ACTIVE x3',
  'PROJECTS:TASK.COMPLETE #847',
  'CORE:MODEL.INFERENCE 120ms',
  'ERP:SYNC.DELTA 0.3s',
  'CODE:KNOWLEDGE.INDEX OK',
  'TELEMETRY:ALL.NOMINAL',
  'OLLAMA:MODEL.LOADED deepseek-r1',
  'SUPABASE:HEARTBEAT OK',
]

export function ActivityTicker() {
  const tickerText = TICKER_MESSAGES.join('  ///  ')

  return (
    <div
      className="enrichment-ticker fixed bottom-0 left-0 right-0 z-10 overflow-hidden"
      style={{ height: 20 }}
    >
      <div className="enrichment-ticker-track flex whitespace-nowrap">
        <span className="font-mono text-[8px] tracking-[0.08em] text-[var(--color-text-ghost)] opacity-30">
          {tickerText}  ///  {tickerText}
        </span>
      </div>
    </div>
  )
}
```

---

#### RadialGaugeCluster

**Purpose:** 3 concentric SVG ring gauges positioned around the hub center, displaying system metrics (CPU load, memory, network throughput) as arc progress indicators.

**Placement:** World-space, inside `DataOverlayLayer` (L3). Centered at origin, sized ~200px diameter, layered over the hub center glyph.

**DOM footprint:** 1 `<svg>` with 3 `<circle>` (track) + 3 `<circle>` (fill) + 3 `<text>` (labels) = 10 SVG nodes

**Animation tier:** motion/react -- `strokeDashoffset` spring animation for gauge value changes. CSS @keyframes `gauge-idle-drift` for subtle ongoing oscillation of the fill arcs.

```tsx
// src/components/ambient/enrichment/RadialGaugeCluster.tsx
'use client'

import { motion } from 'motion/react'
import '@/styles/ambient-enrichment.css'

const SVG_SIZE = 200
const CENTER = SVG_SIZE / 2

interface GaugeConfig {
  label: string
  radius: number
  value: number // 0-1
  color: string
  strokeWidth: number
}

const GAUGES: GaugeConfig[] = [
  { label: 'CPU', radius: 65, value: 0.42, color: 'var(--color-ember)', strokeWidth: 2 },
  { label: 'MEM', radius: 78, value: 0.68, color: 'var(--color-teal)', strokeWidth: 1.5 },
  { label: 'NET', radius: 88, value: 0.31, color: 'var(--color-ember-bright)', strokeWidth: 1 },
]

function circumference(radius: number): number {
  return 2 * Math.PI * radius
}

export function RadialGaugeCluster() {
  return (
    <svg
      className="enrichment-gauge-cluster absolute"
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={{
        left: -(SVG_SIZE / 2),
        top: -(SVG_SIZE / 2),
      }}
    >
      {GAUGES.map((gauge) => {
        const circ = circumference(gauge.radius)
        const dashOffset = circ * (1 - gauge.value)

        return (
          <g key={gauge.label}>
            {/* Track (background) */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={gauge.radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.02)"
              strokeWidth={gauge.strokeWidth}
            />
            {/* Fill (value) */}
            <motion.circle
              cx={CENTER}
              cy={CENTER}
              r={gauge.radius}
              fill="none"
              stroke={gauge.color}
              strokeWidth={gauge.strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circ}
              opacity={0.2}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{
                type: 'spring',
                stiffness: 30,
                damping: 15,
                delay: 0.8,
              }}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
              }}
            />
            {/* Label */}
            <text
              x={CENTER}
              y={CENTER - gauge.radius - 6}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.06)"
              fontSize={6}
              fontFamily="var(--font-mono)"
              letterSpacing="0.08em"
            >
              {gauge.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
```

---

#### CoordinateOverlays

**Purpose:** Registration marks (crosshairs at origin), axis labels, and subtle grid reference markers providing a technical blueprint aesthetic.

**Placement:** World-space, inside `AmbientLayer` (L1). Centered at origin.

**DOM footprint:** 1 `<svg>` with ~12 `<line>` + ~8 `<text>` = ~21 SVG nodes

**Animation tier:** Static DOM -- no animation. These are permanent reference marks.

```tsx
// src/components/ambient/enrichment/CoordinateOverlays.tsx
'use client'

const SVG_SIZE = 1600
const CENTER = SVG_SIZE / 2
const CROSSHAIR_SIZE = 40
const AXIS_LENGTH = 700

const AXIS_LABELS = [
  { label: '+X', x: CENTER + AXIS_LENGTH + 20, y: CENTER + 4 },
  { label: '-X', x: CENTER - AXIS_LENGTH - 20, y: CENTER + 4 },
  { label: '+Y', x: CENTER + 4, y: CENTER + AXIS_LENGTH + 16 },
  { label: '-Y', x: CENTER + 4, y: CENTER - AXIS_LENGTH - 8 },
]

const GRID_MARKS = [200, 400, 600]

export function CoordinateOverlays() {
  return (
    <svg
      className="absolute"
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={{
        left: -(SVG_SIZE / 2),
        top: -(SVG_SIZE / 2),
      }}
    >
      {/* Center crosshairs */}
      <line
        x1={CENTER - CROSSHAIR_SIZE}
        y1={CENTER}
        x2={CENTER + CROSSHAIR_SIZE}
        y2={CENTER}
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth={0.5}
      />
      <line
        x1={CENTER}
        y1={CENTER - CROSSHAIR_SIZE}
        x2={CENTER}
        y2={CENTER + CROSSHAIR_SIZE}
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth={0.5}
      />

      {/* Axis lines (faint dashed) */}
      <line
        x1={CENTER - AXIS_LENGTH}
        y1={CENTER}
        x2={CENTER + AXIS_LENGTH}
        y2={CENTER}
        stroke="rgba(255, 255, 255, 0.015)"
        strokeWidth={0.5}
        strokeDasharray="8 16"
      />
      <line
        x1={CENTER}
        y1={CENTER - AXIS_LENGTH}
        x2={CENTER}
        y2={CENTER + AXIS_LENGTH}
        stroke="rgba(255, 255, 255, 0.015)"
        strokeWidth={0.5}
        strokeDasharray="8 16"
      />

      {/* Axis labels */}
      {AXIS_LABELS.map(({ label, x, y }) => (
        <text
          key={label}
          x={x}
          y={y}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.04)"
          fontSize={8}
          fontFamily="var(--font-mono)"
          letterSpacing="0.08em"
        >
          {label}
        </text>
      ))}

      {/* Grid distance markers (along +X axis) */}
      {GRID_MARKS.map((dist) => (
        <g key={dist}>
          {/* Tick mark */}
          <line
            x1={CENTER + dist}
            y1={CENTER - 4}
            x2={CENTER + dist}
            y2={CENTER + 4}
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={0.5}
          />
          {/* Distance label */}
          <text
            x={CENTER + dist}
            y={CENTER + 14}
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.03)"
            fontSize={6}
            fontFamily="var(--font-mono)"
          >
            {dist}
          </text>
        </g>
      ))}
    </svg>
  )
}
```

---

#### DeepZoomDetails

**Purpose:** Circuit trace patterns, micro-inscriptions, and hex grid fragments that only appear at Z2/Z3 zoom levels, rewarding exploration. Wrapped in a `ZoomGate` by the parent composition.

**Placement:** World-space, inside `DataOverlayLayer` (L3) behind a `<ZoomGate min="Z2">`. Positioned near capsule positions.

**DOM footprint:** 1 `<svg>` with ~20 path/line elements = ~21 SVG nodes. Only mounted at Z2+.

**Animation tier:** CSS @keyframes -- `trace-reveal` animation, 2s staggered entrance when zoom crosses Z2 threshold.

```tsx
// src/components/ambient/enrichment/DeepZoomDetails.tsx
'use client'

import '@/styles/ambient-enrichment.css'

const SVG_SIZE = 300
const CENTER = SVG_SIZE / 2

// Circuit trace segments (decorative L-shaped paths)
const TRACES = [
  'M 20 140 L 60 140 L 60 100 L 100 100',
  'M 200 60 L 200 100 L 240 100',
  'M 50 200 L 50 240 L 100 240 L 100 260',
  'M 180 220 L 220 220 L 220 260',
  'M 120 40 L 160 40 L 160 20',
  'M 240 140 L 280 140 L 280 180',
]

// Hex grid cells
const HEX_POSITIONS = [
  { x: 130, y: 130 },
  { x: 155, y: 115 },
  { x: 155, y: 145 },
  { x: 180, y: 130 },
]
const HEX_SIZE = 10

function hexPoints(cx: number, cy: number, size: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`
  }).join(' ')
}

export function DeepZoomDetails() {
  return (
    <svg
      className="absolute"
      width={SVG_SIZE}
      height={SVG_SIZE}
      viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      style={{
        left: -(SVG_SIZE / 2),
        top: -(SVG_SIZE / 2),
      }}
    >
      {/* Circuit traces */}
      {TRACES.map((d, i) => (
        <path
          key={`trace-${i}`}
          d={d}
          fill="none"
          stroke="rgba(224, 82, 0, 0.04)"
          strokeWidth={0.5}
          className="enrichment-trace"
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}

      {/* Hex grid fragment */}
      {HEX_POSITIONS.map((pos, i) => (
        <polygon
          key={`hex-${i}`}
          points={hexPoints(pos.x, pos.y, HEX_SIZE)}
          fill="none"
          stroke="rgba(39, 115, 137, 0.03)"
          strokeWidth={0.5}
          className="enrichment-trace"
          style={{ animationDelay: `${(TRACES.length + i) * 0.3}s` }}
        />
      ))}

      {/* Micro inscription */}
      <text
        x={CENTER}
        y={SVG_SIZE - 20}
        textAnchor="middle"
        fill="rgba(255, 255, 255, 0.02)"
        fontSize={5}
        fontFamily="var(--font-mono)"
        letterSpacing="0.2em"
      >
        TARVA//SPATIAL//ENGINE//v1.0
      </text>
    </svg>
  )
}
```

---

## 2. Composition Pattern (page.tsx)

Here is the exact composition showing how new components integrate into the existing page structure. Changes are marked with `// NEW` comments.

```tsx
// src/app/(launch)/page.tsx -- UPDATED COMPOSITION

import '@/styles/atrium.css'
import '@/styles/morph.css'
import '@/styles/constellation.css'
import '@/styles/ambient-enrichment.css' // NEW

// Existing imports...
import { SpatialViewport } from '@/components/spatial/SpatialViewport'
import { SpatialCanvas } from '@/components/spatial/SpatialCanvas'
import { MorphOrchestrator } from '@/components/districts/morph-orchestrator'
import { DotGrid } from '@/components/districts/dot-grid'
import { NavigationHUD } from '@/components/spatial/NavigationHUD'
import { EvidenceLedgerDistrict, EVIDENCE_LEDGER_POSITION } from '@/components/evidence-ledger/evidence-ledger-district'

// NEW: Enrichment imports
import {
  AmbientLayer,
  DataOverlayLayer,
  ZoomGate,
  OrbitalReadouts,
  RangeRings,
  HaloGlow,
  ConnectionPaths,
  HorizonScanLine,
  SystemStatusPanel,
  FeedPanel,
  SignalPulseMonitor,
  ActivityTicker,
  RadialGaugeCluster,
  CoordinateOverlays,
  DeepZoomDetails,
} from '@/components/ambient/enrichment'

// Inside the return JSX:
return (
  <>
    <SpatialViewport viewportRef={viewportRef} enableKeyboardShortcuts={false}>
      <SpatialCanvas>

        {/* L0: Background layer */}
        <div className="absolute" style={{ left: -10000, top: -10000, width: 20000, height: 20000, pointerEvents: 'none' }}>
          <DotGrid />
        </div>

        {/* L1: Ambient layer (BEHIND capsules) -- NEW */}
        <AmbientLayer isPanActive={isPanActive}>
          <ZoomGate min="Z1">
            <CoordinateOverlays />
            <RangeRings />
            <HaloGlow />
            <ConnectionPaths />
            <HorizonScanLine />
            <OrbitalReadouts />
          </ZoomGate>
        </AmbientLayer>

        {/* L2: Interactive layer (capsules, morph, panels) */}
        <div data-panning={isPanActive ? 'true' : 'false'} style={{ pointerEvents: 'auto' }}>
          <MorphOrchestrator
            data={MOCK_CAPSULE_DATA}
            prefersReducedMotion={prefersReducedMotion}
            isPanning={isPanActive}
          />
        </div>

        {/* L3: Data overlay layer (ABOVE capsules) -- NEW */}
        <DataOverlayLayer isPanActive={isPanActive}>
          <ZoomGate min="Z1">
            <RadialGaugeCluster />
          </ZoomGate>
          <ZoomGate min="Z2">
            <DeepZoomDetails />
          </ZoomGate>
        </DataOverlayLayer>

        {/* L4: Evidence Ledger district */}
        {!isMorphActive && (
          <div className="absolute" style={{ left: EVIDENCE_LEDGER_POSITION.x, top: EVIDENCE_LEDGER_POSITION.y, pointerEvents: 'auto' }}>
            <EvidenceLedgerDistrict receiptStore={receiptStore} />
          </div>
        )}

      </SpatialCanvas>
    </SpatialViewport>

    {/* Fixed-position panels (viewport-space, NOT world-space) -- NEW */}
    {/* These live OUTSIDE SpatialCanvas because they are fixed to viewport */}
    <AmbientLayer isPanActive={isPanActive}>
      <ZoomGate min="Z1">
        <SystemStatusPanel />
        <FeedPanel />
        <SignalPulseMonitor />
        <ActivityTicker />
      </ZoomGate>
    </AmbientLayer>

    {/* Navigation HUD overlay (existing) */}
    <NavigationHUD isPanActive={isPanActive}>
      {/* ... existing HUD content ... */}
    </NavigationHUD>

    {/* Command palette (existing) */}
    <CommandPalette onRefresh={async () => { /* ... */ }} />

    <Phase3Effects />
  </>
)
```

### Layer Z-Index Strategy

| Layer | Content | Z-Approach | Notes |
|-------|---------|-----------|-------|
| L0 | DotGrid | DOM order (first child) | Background, no z-index needed |
| L1 | AmbientLayer | DOM order (second child) | Behind capsules via render order |
| L2 | MorphOrchestrator | DOM order (third child) | Interactive, `pointer-events: auto` |
| L3 | DataOverlayLayer | DOM order (fourth child) | Above capsules via render order |
| L4 | EvidenceLedger | DOM order (fifth child) | Positioned district |
| Fixed panels | Status, Feed, Pulse, Ticker | `z-index: 10` | Below NavigationHUD (z-40) |
| HUD | NavigationHUD | `z-index: 40` | Existing |
| CommandPalette | Dialog | `z-index: 50` | Existing |

No changes needed to existing z-index values. The enrichment elements slot into the existing ordering cleanly.

---

## 3. Performance Strategy

### 3.1 Animation Tier Assignment

| Component | Tier | Technique | GPU Layer? | Why |
|-----------|------|-----------|-----------|-----|
| OrbitalReadouts | CSS @keyframes | `flicker` opacity oscillation | No | Opacity-only, compositor-friendly |
| RangeRings | CSS @keyframes | `ring-rotate` transform rotation | Yes (1) | Single `will-change: transform` on SVG |
| HaloGlow | CSS @keyframes | `halo-breathe` opacity oscillation | No | Opacity-only, no layout |
| ConnectionPaths | motion/react + CSS | Spring `pathLength` entrance, then CSS `stream-flow` | Yes (1) | SVG stroke animation, GPU-composited |
| HorizonScanLine | CSS @keyframes | `horizon-sweep` translateY | Yes (1) | Transform animation, needs GPU |
| SystemStatusPanel | motion/react | Spring entrance only | No | One-time entrance, then static |
| FeedPanel | motion/react | Spring entrance only | No | One-time entrance, then static |
| SignalPulseMonitor | CSS @keyframes | `pulse-sweep` translateX | No | Small element, CSS sufficient |
| ActivityTicker | CSS @keyframes | `ticker-scroll` translateX | Yes (1) | Continuous transform, needs GPU |
| RadialGaugeCluster | motion/react | Spring `strokeDashoffset` | No | One-time entrance, then static |
| CoordinateOverlays | Static | No animation | No | Permanent reference marks |
| DeepZoomDetails | CSS @keyframes | `trace-reveal` opacity stagger | No | One-time entrance on zoom |

**GPU layer count:** 4 new layers (RangeRings SVG, ConnectionPaths SVG, HorizonScanLine div, ActivityTicker track)

### 3.2 DOM Node Budget

| Component | Nodes | Type |
|-----------|-------|------|
| AmbientLayer wrapper | 1 | div |
| DataOverlayLayer wrapper | 1 | div |
| ZoomGate (x4) | 0 | Fragment |
| OrbitalReadouts | 11 | 1 div + 10 spans |
| RangeRings | 1 | 1 svg (children are SVG nodes, not DOM) |
| HaloGlow | 1 | div |
| ConnectionPaths | 1 | 1 svg |
| HorizonScanLine | 2 | 2 divs |
| SystemStatusPanel | 14 | 1 div + 1 header + 6x(2 spans) |
| FeedPanel | 17 | 1 div + 1 header + 5x(3 spans) |
| SignalPulseMonitor | 2 | 1 div + 1 svg |
| ActivityTicker | 2 | 1 div + 1 span |
| RadialGaugeCluster | 1 | 1 svg |
| CoordinateOverlays | 1 | 1 svg |
| DeepZoomDetails | 1 | 1 svg (Z2+ only, unmounted otherwise) |
| **Total** | **~56** | Under 65 budget |

### 3.3 Panning Optimization

All ambient CSS animations pause during camera motion via the `[data-panning='true']` attribute propagated by `AmbientLayer` and `DataOverlayLayer`:

```css
/* In ambient-enrichment.css */
[data-panning='true'] .enrichment-readout,
[data-panning='true'] .enrichment-range-rings,
[data-panning='true'] .enrichment-halo,
[data-panning='true'] .enrichment-connection-path,
[data-panning='true'] .enrichment-horizon-line,
[data-panning='true'] .enrichment-pulse-sweep,
[data-panning='true'] .enrichment-ticker-track,
[data-panning='true'] .enrichment-trace {
  animation-play-state: paused !important;
}
```

The motion/react entrance animations (SystemStatusPanel, FeedPanel, RadialGaugeCluster) are one-time and will have completed before any panning occurs, so no special handling is needed.

### 3.4 Viewport Culling

Most enrichment elements are positioned within the 840-1600px ring area, well within the default viewport at Z1. However, for elements that extend beyond 2000px from origin (none currently do, but as a safety measure), the `AmbientLayer` could integrate `useViewportCull`. For the current enrichment set, culling is unnecessary because:

- All world-space elements are within 800px of origin
- `ZoomGate` handles Z0 unmounting (constellation view has no enrichment)
- `ZoomGate` handles Z2/Z3 conditional mounting for DeepZoomDetails

If future enrichment elements extend beyond 2000px, use the existing `useViewportCull` hook pattern from the codebase.

### 3.5 Reduced Motion

All animations are suppressed via CSS `@media (prefers-reduced-motion: reduce)` in `ambient-enrichment.css`. Components that use motion/react check `useReducedMotion()` from `@tarva/ui/motion` and skip entrance animations. The existing `src/styles/reduced-motion.css` global catch-all (`*:not(.reduced-motion-exempt)`) provides an additional safety net.

---

## 4. New Files List

| # | File Path | Purpose | Est. Lines | Dependencies |
|---|-----------|---------|-----------|-------------|
| 1 | `src/components/ambient/enrichment/index.ts` | Barrel export for all enrichment components | ~30 | -- |
| 2 | `src/components/ambient/enrichment/AmbientLayer.tsx` | L1 wrapper: effectsEnabled gate, data-panning, aria-hidden | ~25 | `settings.store` |
| 3 | `src/components/ambient/enrichment/DataOverlayLayer.tsx` | L3 wrapper: same gates, higher z-order | ~25 | `settings.store` |
| 4 | `src/components/ambient/enrichment/ZoomGate.tsx` | Zoom-conditional render utility | ~30 | `use-semantic-zoom` |
| 5 | `src/components/ambient/enrichment/OrbitalReadouts.tsx` | 10 mono text blocks at 420px radius | ~70 | `constants`, CSS |
| 6 | `src/components/ambient/enrichment/RangeRings.tsx` | 3 concentric SVG circles + ticks + compass | ~90 | CSS |
| 7 | `src/components/ambient/enrichment/HaloGlow.tsx` | Radial gradient behind hub center | ~25 | CSS |
| 8 | `src/components/ambient/enrichment/ConnectionPaths.tsx` | 6 animated SVG bezier curves | ~80 | `motion/react`, `constants`, CSS |
| 9 | `src/components/ambient/enrichment/HorizonScanLine.tsx` | Slow horizontal sweep line | ~30 | CSS |
| 10 | `src/components/ambient/enrichment/SystemStatusPanel.tsx` | Left-sidebar readout panel | ~75 | `motion/react`, `districts.store`, CSS |
| 11 | `src/components/ambient/enrichment/FeedPanel.tsx` | Right-sidebar connection panel | ~55 | `motion/react`, CSS |
| 12 | `src/components/ambient/enrichment/SignalPulseMonitor.tsx` | ECG waveform SVG animation | ~50 | CSS |
| 13 | `src/components/ambient/enrichment/ActivityTicker.tsx` | Scrolling mono text ribbon | ~35 | CSS |
| 14 | `src/components/ambient/enrichment/RadialGaugeCluster.tsx` | 3 ring gauges around hub center | ~80 | `motion/react`, CSS |
| 15 | `src/components/ambient/enrichment/CoordinateOverlays.tsx` | Crosshairs, axis labels, grid marks | ~80 | -- |
| 16 | `src/components/ambient/enrichment/DeepZoomDetails.tsx` | Circuit traces, hex grid (Z2/Z3) | ~75 | CSS |
| 17 | `src/styles/ambient-enrichment.css` | All enrichment keyframes + panning + reduced motion rules | ~180 | `spatial-tokens.css` |
| **Total** | **17 new files** | | **~1035 lines** | |

### Modified Files

| # | File Path | Change Description |
|---|-----------|-------------------|
| 1 | `src/components/ambient/index.ts` | Add `export * from './enrichment'` re-export line |
| 2 | `src/app/(launch)/page.tsx` | Import enrichment components, compose L1/L3 layers, add fixed panels |
| 3 | `src/styles/reduced-motion.css` | Add enrichment class selectors to existing reduced-motion rules |

---

## 5. CSS Architecture

### 5.1 New File: `src/styles/ambient-enrichment.css`

This file contains all CSS @keyframes and rules for the enrichment components. It follows the same organization pattern as `atrium.css` and `ambient-effects.css`.

```css
/* =============================================================
   AMBIENT ENRICHMENT ANIMATIONS
   All keyframes for enrichment-layer decorative elements.
   Tier: Ambient (AD-3) -- compositor thread, zero main-thread cost.

   Load order: After ambient-effects.css, before visual-polish-overrides.css.
   @see ambient-enrichment plan
   ============================================================= */

/* --- Orbital Readout Flicker ---
   8-12s cycle. Per-readout stagger via animationDelay in component.
   Subtle opacity oscillation simulating data update flicker.
   ----------------------------------------------------------- */
@keyframes enrichment-flicker {
  0%, 100% { opacity: 0.3; }
  40% { opacity: 0.25; }
  42% { opacity: 0.15; }
  44% { opacity: 0.35; }
  80% { opacity: 0.28; }
}

.enrichment-readout {
  animation: enrichment-flicker 10s ease-in-out infinite;
}

/* --- Range Rings Rotation ---
   90s full rotation. Extremely slow ambient drift.
   ----------------------------------------------------------- */
@keyframes enrichment-ring-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.enrichment-range-rings {
  animation: enrichment-ring-rotate 90s linear infinite;
  will-change: transform;
}

/* --- Halo Glow Breathe ---
   8s cycle. Scales opacity between dim and slightly brighter.
   ----------------------------------------------------------- */
@keyframes enrichment-halo-breathe {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.6; }
}

.enrichment-halo {
  animation: enrichment-halo-breathe 8s ease-in-out infinite;
}

/* --- Connection Path Stream Flow ---
   After motion/react entrance completes, CSS animates dash offset
   to simulate data flowing along the path.
   ----------------------------------------------------------- */
@keyframes enrichment-stream-flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -16; }
}

.enrichment-connection-path {
  animation: enrichment-stream-flow 3s linear infinite;
}

/* --- Horizon Scan Line Sweep ---
   20s cycle. Slow vertical traversal.
   ----------------------------------------------------------- */
@keyframes enrichment-horizon-sweep {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(900px); }
}

.enrichment-horizon-line {
  animation: enrichment-horizon-sweep 20s linear infinite;
  will-change: transform;
}

/* --- Signal Pulse Monitor Sweep ---
   4s cycle. Horizontal sweep of the highlight mask.
   ----------------------------------------------------------- */
@keyframes enrichment-pulse-sweep {
  0% { transform: translateX(-24px); }
  100% { transform: translateX(120px); }
}

.enrichment-pulse-sweep {
  animation: enrichment-pulse-sweep 4s linear infinite;
}

/* --- Activity Ticker Scroll ---
   30s linear scroll. Duplicated content ensures seamless loop.
   ----------------------------------------------------------- */
@keyframes enrichment-ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

.enrichment-ticker-track {
  animation: enrichment-ticker-scroll 30s linear infinite;
  will-change: transform;
}

/* --- Deep Zoom Trace Reveal ---
   One-time entrance when Z2 threshold is crossed.
   Staggered via animationDelay in component.
   ----------------------------------------------------------- */
@keyframes enrichment-trace-reveal {
  from { opacity: 0; stroke-dashoffset: 100; }
  to { opacity: 1; stroke-dashoffset: 0; }
}

.enrichment-trace {
  opacity: 0;
  stroke-dasharray: 100;
  animation: enrichment-trace-reveal 2s ease-out forwards;
}

/* =============================================================
   PANEL GLASS STYLING
   Glass treatment for fixed-position readout panels.
   Matches WS-1.6 glass recipes from VISUAL-DESIGN-SPEC.md.
   ============================================================= */

.enrichment-status-panel,
.enrichment-feed-panel {
  background: rgba(255, 255, 255, 0.015);
  backdrop-filter: blur(8px) saturate(110%);
  -webkit-backdrop-filter: blur(8px) saturate(110%);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px;
  max-width: 140px;
}

.enrichment-pulse-monitor {
  /* No glass -- just the SVG inline */
}

/* =============================================================
   PANNING OPTIMIZATION
   Pause all ambient animations during camera motion.
   ============================================================= */

[data-panning='true'] .enrichment-readout {
  animation-play-state: paused !important;
}

[data-panning='true'] .enrichment-range-rings {
  animation-play-state: paused !important;
}

[data-panning='true'] .enrichment-halo {
  animation-play-state: paused !important;
}

[data-panning='true'] .enrichment-connection-path {
  animation-play-state: paused !important;
}

[data-panning='true'] .enrichment-horizon-line {
  animation-play-state: paused !important;
}

[data-panning='true'] .enrichment-pulse-sweep {
  animation-play-state: paused !important;
}

[data-panning='true'] .enrichment-ticker-track {
  animation-play-state: paused !important;
}

[data-panning='true'] .enrichment-trace {
  animation-play-state: paused !important;
}

/* Disable glass blur during pan for performance */
[data-panning='true'] .enrichment-status-panel,
[data-panning='true'] .enrichment-feed-panel {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

/* =============================================================
   REDUCED MOTION
   Disable all enrichment animations for accessibility.
   ============================================================= */

@media (prefers-reduced-motion: reduce) {
  .enrichment-readout,
  .enrichment-range-rings,
  .enrichment-halo,
  .enrichment-connection-path,
  .enrichment-horizon-line,
  .enrichment-pulse-sweep,
  .enrichment-ticker-track,
  .enrichment-trace {
    animation: none !important;
  }

  /* Show static states */
  .enrichment-readout {
    opacity: 0.3;
  }

  .enrichment-halo {
    opacity: 0.5;
  }

  .enrichment-trace {
    opacity: 1;
    stroke-dashoffset: 0;
  }

  .enrichment-horizon-line {
    display: none;
  }

  .enrichment-ticker-track {
    animation: none !important;
    /* Show first instance statically */
  }
}
```

### 5.2 Tokens (No New Tokens Needed)

All enrichment elements use existing tokens from `spatial-tokens.css`:
- Colors: `--color-ember`, `--color-teal`, `--color-text-ghost`, `--color-text-tertiary`
- Fonts: `--font-mono`
- Tracking: `--tracking-wider`, `--tracking-widest`
- Opacities: `--opacity-ambient-particle`, `--opacity-text-ghost`
- Durations: Custom per-element (not tokenized because each has unique timing)

If the UI designer specifies new token values, they go in `spatial-tokens.css`. No enrichment-specific tokens are needed.

### 5.3 CSS Load Order

The import in `page.tsx` determines load order:

```tsx
import '@/styles/atrium.css'              // 1. Existing capsule animations
import '@/styles/morph.css'                // 2. Existing morph animations
import '@/styles/constellation.css'        // 3. Existing constellation animations
import '@/styles/ambient-enrichment.css'   // 4. NEW: Enrichment animations
```

The global `reduced-motion.css` and `visual-polish-overrides.css` load last via the layout, overriding everything.

### 5.4 Update to `src/styles/reduced-motion.css`

Add enrichment selectors to the existing Tier 1 section:

```css
/* Add after existing Tier 1 selectors (line ~33): */
.enrichment-readout,
.enrichment-range-rings,
.enrichment-halo,
.enrichment-connection-path,
.enrichment-horizon-line,
.enrichment-pulse-sweep,
.enrichment-ticker-track,
.enrichment-trace {
  animation: none !important;
  transition: none !important;
}
```

---

## 6. State Management

### 6.1 Consumed Stores (Read-Only)

All enrichment components are **read-only consumers** of existing stores. No new stores are needed.

| Store | Consumed By | Selector | Frequency |
|-------|-------------|----------|-----------|
| `settings.store` | `AmbientLayer`, `DataOverlayLayer` | `effectsEnabled` | Rare (user toggle) |
| `camera.store` | `ZoomGate` (via `useSemanticZoom`) | `semanticLevel` | Low (zoom threshold crossings) |
| `districts.store` | `SystemStatusPanel` | `districts`, `lastSnapshotAt` | Moderate (telemetry polling cycle) |

### 6.2 No New State Needed

All enrichment elements are decorative and derive their data from:
- **Static constants:** Orbital readout labels, waveform points, trace paths, compass labels
- **Existing store data:** District telemetry for system status panel
- **CSS animations:** All ongoing motion is CSS-driven, no React state

### 6.3 Event Subscription Patterns

No event subscriptions are needed for the current enrichment set. If future enrichment elements need to respond to camera motion imperatively (e.g., parallax effects), they should follow the `ParticleField` pattern:

```tsx
// Read camera state imperatively in rAF loop (NOT via React selector)
const cameraState = useCameraStore.getState()
```

### 6.4 Pan Pause Integration

The pan-pause signal flows through the DOM attribute chain:

```
usePanPause() hook (in page.tsx)
  -> isPanActive boolean
    -> AmbientLayer data-panning={isPanActive}
      -> CSS [data-panning='true'] rules pause animations
```

No React re-renders in enrichment components during panning. The CSS `animation-play-state` change is handled entirely by the compositor thread.

---

## 7. Implementation Order

### Phase A: Structure (Day 1)

**Goal:** Establish the component shell and composition pattern so all subsequent work slots into a verified architecture.

| Step | Component | Why First |
|------|-----------|-----------|
| A.1 | `ZoomGate` | Utility used by everything else |
| A.2 | `AmbientLayer` | L1 wrapper needed for world-space enrichment |
| A.3 | `DataOverlayLayer` | L3 wrapper needed for overlay enrichment |
| A.4 | `ambient-enrichment.css` | CSS file with keyframes referenced by components |
| A.5 | `enrichment/index.ts` barrel | Clean import path |
| A.6 | Update `ambient/index.ts` | Add re-export |
| A.7 | Update `page.tsx` | Compose L1/L3 with empty layers for verification |

**Verification:** `pnpm typecheck && pnpm build` passes. Page renders without errors. Layers exist in DOM inspector with correct attributes.

### Phase B: Visual Impact (Day 1-2)

**Goal:** Add the highest-impact elements first for immediate visual feedback.

| Step | Component | Visual Impact | Effort |
|------|-----------|--------------|--------|
| B.1 | `HaloGlow` | High -- center gets visual weight | Small |
| B.2 | `RangeRings` | High -- targeting reticle aesthetic | Medium |
| B.3 | `ConnectionPaths` | High -- animated data flow | Medium |
| B.4 | `OrbitalReadouts` | High -- data density around ring | Medium |

**Verification:** Visual check at Z1 default zoom. Elements visible, correctly positioned, not blocking capsule interactions.

### Phase C: Data Panels (Day 2)

**Goal:** Add the fixed-position readout panels for Oblivion-style data density.

| Step | Component | Notes |
|------|-----------|-------|
| C.1 | `SystemStatusPanel` | Reads from districts store |
| C.2 | `FeedPanel` | Static mock data initially |
| C.3 | `SignalPulseMonitor` | SVG waveform with sweep |
| C.4 | `ActivityTicker` | Scrolling text ribbon |
| C.5 | `RadialGaugeCluster` | SVG ring gauges with spring entrance |

**Verification:** Panels render at correct positions. Do not overlap NavigationHUD. Entrance animations complete without jank. Z0 hides panels via ZoomGate.

### Phase D: Discovery Details (Day 2-3)

**Goal:** Add elements that reward deep zoom exploration and provide coordinate reference.

| Step | Component | Notes |
|------|-----------|-------|
| D.1 | `CoordinateOverlays` | Static reference marks |
| D.2 | `HorizonScanLine` | Slow sweep animation |
| D.3 | `DeepZoomDetails` | Z2/Z3 only, circuit traces + hex grid |

**Verification:** Zoom to Z2/Z3 and verify DeepZoomDetails mounts. Zoom back to Z1 and verify unmount. CoordinateOverlays visible at all zoom levels above Z0.

### Phase E: Polish & Integration (Day 3)

| Step | Task | Description |
|------|------|-------------|
| E.1 | Panning test | Pan rapidly, verify all animations pause |
| E.2 | Reduced motion test | Enable OS reduced motion, verify all animations stop |
| E.3 | Z0 test | Zoom to Z0, verify all enrichment unmounts (ZoomGate min="Z1") |
| E.4 | Effects toggle test | Turn off effectsEnabled, verify all enrichment disappears |
| E.5 | Performance audit | Check Chrome DevTools Performance tab during pan at Z1 |
| E.6 | Update `reduced-motion.css` | Add enrichment selectors to global safety net |
| E.7 | Final build | `pnpm typecheck && pnpm build` must pass |

---

## 8. Testing & Verification

### 8.1 Build Verification (Mandatory)

```bash
# Must pass before any PR
pnpm typecheck
pnpm build
```

### 8.2 Visual Verification Matrix

| Check | Z0 | Z1 (default) | Z2 | Z3 |
|-------|----|----|----|----|
| AmbientLayer visible | No | Yes | Yes | Yes |
| OrbitalReadouts | Hidden | Visible, ghost opacity | Visible | Visible |
| RangeRings | Hidden | Visible, slow rotation | Visible | Visible |
| HaloGlow | Hidden | Visible, breathing | Visible | Visible |
| ConnectionPaths | Hidden | Visible, stream flow | Visible | Visible |
| HorizonScanLine | Hidden | Visible, sweeping | Visible | Visible |
| SystemStatusPanel | Hidden | Visible, fixed left | Visible | Visible |
| FeedPanel | Hidden | Visible, fixed right | Visible | Visible |
| SignalPulseMonitor | Hidden | Visible, fixed bottom-left | Visible | Visible |
| ActivityTicker | Hidden | Visible, scrolling | Visible | Visible |
| RadialGaugeCluster | Hidden | Visible, gauges filled | Visible | Visible |
| CoordinateOverlays | Hidden | Visible, crosshairs | Visible | Visible |
| DeepZoomDetails | Hidden | Hidden | Visible | Visible |

### 8.3 Interaction Verification

| Test | Expected Behavior |
|------|-------------------|
| Click capsule | Enrichment elements remain visible, do not block morph |
| Pan viewport | All ambient animations pause, resume after 150ms stillness |
| Pan rapidly | No visual jank, 60fps maintained |
| Toggle effectsEnabled OFF | All enrichment vanishes (AmbientLayer returns null) |
| Toggle effectsEnabled ON | All enrichment reappears with entrance animations |
| OS reduced motion ON | All animations stop, static fallback states shown |
| Keyboard navigation | Enrichment is aria-hidden, screen reader skips all of it |
| Click through enrichment | All enrichment has pointer-events: none, capsules clickable |

### 8.4 Performance Verification

| Metric | Target | How to Measure |
|--------|--------|---------------|
| DOM nodes added | < 65 | Chrome DevTools Elements panel count |
| GPU layers added | < 5 | Chrome DevTools Layers panel |
| Frame rate during pan | >= 55fps | Chrome DevTools Performance tab |
| Paint time per frame | < 4ms | Performance tab paint profiler |
| No layout thrashing | 0 forced reflows | Performance tab, look for purple bars |
| Memory increase | < 2MB | Chrome DevTools Memory tab heap snapshot delta |

### 8.5 Accessibility Verification

| Check | Method | Expected |
|-------|--------|----------|
| `aria-hidden="true"` on all enrichment | DOM inspection | All enrichment containers have attribute |
| `pointer-events: none` | DOM inspection | All enrichment containers have style |
| No focus traps | Tab through page | Focus never enters enrichment elements |
| Reduced motion respected | OS toggle + visual check | All animations stop |
| No meaningful content hidden | Screen reader test | No information loss without enrichment |

---

## Appendix A: Dependency Graph

```
page.tsx
  ├── AmbientLayer (effectsEnabled gate)
  │     ├── ZoomGate (useSemanticZoom)
  │     ├── CoordinateOverlays (pure SVG)
  │     ├── RangeRings (pure SVG + CSS)
  │     ├── HaloGlow (pure div + CSS)
  │     ├── ConnectionPaths (motion/react + constants)
  │     ├── HorizonScanLine (pure div + CSS)
  │     └── OrbitalReadouts (constants + CSS)
  │
  ├── DataOverlayLayer (effectsEnabled gate)
  │     ├── ZoomGate (useSemanticZoom)
  │     ├── RadialGaugeCluster (motion/react + SVG)
  │     └── DeepZoomDetails (pure SVG + CSS)
  │
  ├── SystemStatusPanel (motion/react + districts.store)
  ├── FeedPanel (motion/react)
  ├── SignalPulseMonitor (pure SVG + CSS)
  └── ActivityTicker (pure div + CSS)
```

## Appendix B: Import Conventions

All enrichment components follow these import rules:

```tsx
// Animation library (MANDATORY: motion/react, NEVER framer-motion)
import { motion } from 'motion/react'

// Reduced motion hook (from @tarva/ui, not custom)
import { useReducedMotion } from '@tarva/ui/motion'

// Stores (always Zustand selectors, never full store)
import { useSettingsStore } from '@/stores/settings.store'
import { useDistrictsStore } from '@/stores/districts.store'

// Hooks (from project hooks directory)
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import { usePanPause } from '@/hooks/use-pan-pause'

// Constants (from centralized constants file)
import { CAPSULE_RING_RADIUS, CAPSULE_ANGULAR_SPACING } from '@/lib/constants'

// CSS (feature-scoped file)
import '@/styles/ambient-enrichment.css'

// Utilities
import { cn } from '@/lib/utils'
```

## Appendix C: Coordination with Other Agents

| Agent | Handoff | What They Provide | What We Consume |
|-------|---------|-------------------|-----------------|
| UI Designer | Design tokens, color values, opacity levels | Exact opacity/color values for each element | We implement with those values |
| UX Designer | Element placement, timing, interaction rules | Position coordinates, animation durations | We follow the spec exactly |
| Backend Engineer | Telemetry data shape | `districts.store` data updates | `SystemStatusPanel` reads store |
| Architect | Performance budgets, layer limits | DOM/GPU layer constraints | We stay within budget |

No blocking dependencies. All enrichment elements can be implemented with the existing store data and mock values. When real telemetry data flows through `districts.store`, the `SystemStatusPanel` will automatically update.
