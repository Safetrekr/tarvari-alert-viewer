/**
 * TarvaCoreScene -- ambient decorative backdrop for the TarvaCORE
 * district view overlay.
 *
 * Theme: "Neural / Reasoning Engine"
 * Conveys autonomous reasoning through a neural mesh graph, streaming
 * reasoning traces, model status indicators, and a VRAM utilization arc.
 *
 * All elements are absolutely positioned at ghost opacity.
 * The right ~400px is kept clear for the dock panel.
 *
 * @module tarva-core-scene
 * @see src/styles/district-view.css   -- `district-node-pulse`, `district-arc-fill`
 * @see src/components/district-view/shared-scene-primitives.tsx
 */

'use client'

import { memo, useMemo } from 'react'
import type { PanelSide } from '@/lib/morph-types'

import {
  DataStream,
  GhostText,
} from '@/components/district-view/shared-scene-primitives'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REASONING_TRACE_LINES = [
  'HYPOTHESIS: dependency conflict',
  'EVIDENCE: 3 failing tests',
  'CONFIDENCE: 0.87',
  'CONCLUSION: rollback recommended',
  '---',
  'HYPOTHESIS: memory leak in loop',
  'EVIDENCE: heap growth 12MB/min',
  'CONFIDENCE: 0.93',
  'CONCLUSION: fix iterator cleanup',
  '---',
  'OBSERVATION: latency spike',
  'CORRELATION: deployment event',
  'ACTION: monitor 15min window',
]

/**
 * Stable seed positions for 25 neural mesh nodes.
 * Values are [x, y] pairs in a 600x400 coordinate space.
 * These are hand-tuned to give an organic but reproducible layout.
 */
const NEURAL_NODE_SEEDS: ReadonlyArray<[number, number]> = [
  [45, 35],
  [130, 65],
  [220, 30],
  [310, 55],
  [400, 40],
  [490, 70],
  [560, 35],
  [75, 130],
  [170, 110],
  [260, 145],
  [350, 120],
  [440, 150],
  [530, 125],
  [50, 220],
  [145, 240],
  [240, 210],
  [330, 250],
  [420, 225],
  [510, 240],
  [80, 310],
  [180, 340],
  [280, 320],
  [370, 350],
  [460, 330],
  [555, 360],
]

/** Indices of nodes that pulse brighter (neural propagation). */
const BRIGHT_NODE_INDICES = new Set([3, 10, 17, 22])

/** Maximum distance (px) between two nodes to draw a connection. */
const CONNECTION_DISTANCE = 120

/** VRAM arc configuration. */
const ARC_RADIUS = 42
const ARC_STROKE = 4
const ARC_CIRCUMFERENCE = ARC_RADIUS * 2 * Math.PI
/** 270 degrees = 3/4 of the full circle */
const ARC_VISIBLE_FRACTION = 0.75
const ARC_VISIBLE_LENGTH = ARC_CIRCUMFERENCE * ARC_VISIBLE_FRACTION
const VRAM_FILL_PERCENT = 0.73
const ARC_FILL_LENGTH = ARC_VISIBLE_LENGTH * VRAM_FILL_PERCENT
const ARC_TARGET_OFFSET = ARC_VISIBLE_LENGTH - ARC_FILL_LENGTH

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Neural mesh graph with 25 nodes and proximity-based edges. */
const NeuralMesh = memo(function NeuralMesh() {
  // Compute edges once: connect every node pair within CONNECTION_DISTANCE
  const edges = useMemo(() => {
    const result: Array<{ x1: number; y1: number; x2: number; y2: number }> = []
    for (let i = 0; i < NEURAL_NODE_SEEDS.length; i++) {
      for (let j = i + 1; j < NEURAL_NODE_SEEDS.length; j++) {
        const [ax, ay] = NEURAL_NODE_SEEDS[i]
        const [bx, by] = NEURAL_NODE_SEEDS[j]
        const dx = bx - ax
        const dy = by - ay
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist <= CONNECTION_DISTANCE) {
          result.push({ x1: ax, y1: ay, x2: bx, y2: by })
        }
      }
    }
    return result
  }, [])

  return (
    <svg
      width={600}
      height={400}
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Edges */}
      {edges.map((edge, i) => (
        <line
          key={`mesh-edge-${i}`}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={1}
        />
      ))}

      {/* Nodes */}
      {NEURAL_NODE_SEEDS.map(([cx, cy], i) => {
        const isBright = BRIGHT_NODE_INDICES.has(i)
        return (
          <circle
            key={`mesh-node-${i}`}
            cx={cx}
            cy={cy}
            r={4}
            fill={
              isBright
                ? 'rgba(168, 85, 247, 0.2)'
                : 'rgba(168, 85, 247, 0.08)'
            }
            className={isBright ? 'district-node-pulse' : undefined}
          />
        )
      })}
    </svg>
  )
})

/**
 * VRAM utilization arc gauge (270 degrees).
 * Background arc + foreground fill arc animated via `district-arc-fill`.
 */
const MemoryArc = memo(function MemoryArc() {
  /**
   * The arc starts at the bottom-left and sweeps 270 degrees clockwise
   * to the bottom-right. We rotate the group -135deg so a standard
   * circle's start (3 o'clock) maps to the desired start point.
   *
   * stroke-dasharray = visible length, remainder gap
   * stroke-dashoffset for the fill arc animates from full visible length
   * down to the target offset.
   */
  return (
    <svg
      width={100}
      height={100}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="rotate(-135, 50, 50)">
        {/* Background arc (270 degrees visible) */}
        <circle
          cx={50}
          cy={50}
          r={ARC_RADIUS}
          stroke="rgba(168, 85, 247, 0.06)"
          strokeWidth={ARC_STROKE}
          fill="none"
          strokeDasharray={`${ARC_VISIBLE_LENGTH} ${ARC_CIRCUMFERENCE}`}
          strokeLinecap="round"
        />

        {/* Filled arc (73% of the 270-degree range) */}
        <circle
          cx={50}
          cy={50}
          r={ARC_RADIUS}
          stroke="rgba(168, 85, 247, 0.2)"
          strokeWidth={ARC_STROKE}
          fill="none"
          strokeDasharray={`${ARC_VISIBLE_LENGTH} ${ARC_CIRCUMFERENCE}`}
          strokeDashoffset={ARC_TARGET_OFFSET}
          strokeLinecap="round"
          className="district-arc-fill"
          style={{
            '--arc-circumference': `${ARC_VISIBLE_LENGTH}`,
            '--arc-target': `${ARC_TARGET_OFFSET}`,
          } as React.CSSProperties}
        />
      </g>
    </svg>
  )
})

// ---------------------------------------------------------------------------
// Main scene component
// ---------------------------------------------------------------------------

export const TarvaCoreScene = memo(function TarvaCoreScene({ dockSide }: { dockSide: PanelSide }) {
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
      {/* 1. Neural Mesh -- full background, centered */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: '50%',
          ...(dockSide === 'right'
            ? { left: '50%', transform: 'translate(-60%, -50%)' }
            : { right: '50%', transform: 'translate(60%, -50%)' }),
        }}
      >
        <NeuralMesh />
      </div>

      {/* 2. Reasoning Trace -- left side */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', top: 80, ...(dockSide === 'right' ? { left: 40 } : { right: 40 }) }}
      >
        <DataStream
          lines={REASONING_TRACE_LINES}
          width={300}
          height={450}
          color="rgba(168, 85, 247, 0.06)"
          scrollDuration={55}
        />
      </div>

      {/* 3. Model Status -- top area, centered */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: 30,
          ...(dockSide === 'right'
            ? { left: '50%', transform: 'translateX(-60%)' }
            : { right: '50%', transform: 'translateX(60%)' }),
        }}
      >
        <GhostText
          text="LLAMA.CPP // MODEL: llama-3.1-70b // CTX: 8192 // TEMP: 0.3"
          size={9}
          opacity={0.15}
          flicker
        />
      </div>

      {/* 4. Memory Arc -- lower-left */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          ...(dockSide === 'right' ? { left: 60 } : { right: 60 }),
          bottom: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <MemoryArc />
        <GhostText text="VRAM: 73%" size={8} opacity={0.12} />
      </div>
    </div>
  )
})
