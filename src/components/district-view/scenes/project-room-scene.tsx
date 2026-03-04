/**
 * ProjectRoomScene -- ambient decorative backdrop for the Project Room
 * district view overlay.
 *
 * Theme: "Mission Operations / Workflow"
 * Conveys agent orchestration, pipeline execution, and artifact management
 * through ghost-opacity workflow graphs, run logs, and phase-gate meters.
 *
 * All elements are absolutely positioned and rendered at low opacity so they
 * recede behind the dock panel. The right ~400px is kept clear for the dock.
 *
 * @module project-room-scene
 * @see src/styles/district-view.css   -- `district-ambient-element`, `district-node-pulse`
 * @see src/components/district-view/shared-scene-primitives.tsx
 */

'use client'

import { memo } from 'react'
import type { PanelSide } from '@/lib/morph-types'

import {
  DataStream,
  GhostCounter,
  GhostText,
  ProgressBar,
} from '@/components/district-view/shared-scene-primitives'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RUN_LOG_LINES = [
  'RUN #127 COMPLETE 0:12:47',
  'RUN #128 ACTIVE phase:exec',
  'RUN #129 QUEUED priority:high',
  'ARTIFACT v3.2.1 validated',
  'RUN #126 COMPLETE 0:08:23',
  'GOVERNANCE: 3 approvals',
  'RUN #125 COMPLETE 0:15:02',
  'DEPLOY prod-east OK',
  'RUN #124 ROLLBACK triggered',
  'ARTIFACT v3.2.0 archived',
]

/** Workflow DAG node definitions (label + position within SVG). */
const DAG_NODES = [
  { label: 'PLAN', x: 40, y: 100 },
  { label: 'EXEC', x: 155, y: 100 },
  { label: 'REVIEW', x: 270, y: 100 },
  { label: 'MERGE', x: 385, y: 100 },
  { label: 'DEPLOY', x: 460, y: 100 },
] as const

const NODE_W = 60
const NODE_H = 28
const NODE_RX = 6

/** Dependency web: 8 satellite dots evenly spaced around center. */
const DEP_WEB_SATELLITES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * Math.PI * 2) / 8
  return {
    cx: 100 + Math.cos(angle) * 80,
    cy: 100 + Math.sin(angle) * 80,
    pulse: i === 1 || i === 5, // two dots get pulse animation
  }
})

// ---------------------------------------------------------------------------
// Phase gate bar definitions
// ---------------------------------------------------------------------------

const PHASE_GATES = [
  { label: 'Discovery', value: 100, fillColor: 'rgba(var(--healthy-rgb), 0.3)' },
  { label: 'Planning', value: 100, fillColor: 'rgba(var(--healthy-rgb), 0.3)' },
  { label: 'Execution', value: 67, fillColor: 'rgba(14, 165, 233, 0.3)' },
  { label: 'Review', value: 0, fillColor: 'rgba(14, 165, 233, 0.3)' },
] as const

// ---------------------------------------------------------------------------
// Sub-components (SVG groups)
// ---------------------------------------------------------------------------

/** Directed acyclic graph showing the PLAN->DEPLOY pipeline. */
const WorkflowDag = memo(function WorkflowDag() {
  return (
    <svg
      width={500}
      height={200}
      viewBox="0 0 500 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Connecting lines with arrowheads */}
      <defs>
        <marker
          id="dag-arrow"
          markerWidth="6"
          markerHeight="4"
          refX="6"
          refY="2"
          orient="auto"
        >
          <path
            d="M0,0 L6,2 L0,4"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        </marker>
      </defs>

      {/* Edges between consecutive nodes */}
      {DAG_NODES.slice(0, -1).map((from, i) => {
        const to = DAG_NODES[i + 1]
        return (
          <line
            key={`edge-${i}`}
            x1={from.x + NODE_W / 2}
            y1={from.y}
            x2={to.x - NODE_W / 2}
            y2={to.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
            markerEnd="url(#dag-arrow)"
          />
        )
      })}

      {/* Nodes */}
      {DAG_NODES.map((node, i) => {
        // EXEC node (index 1) pulses ember to indicate active phase
        const isActive = i === 1
        return (
          <g
            key={node.label}
            className={isActive ? 'district-node-pulse' : undefined}
          >
            <rect
              x={node.x - NODE_W / 2}
              y={node.y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={NODE_RX}
              fill={
                isActive
                  ? 'rgba(var(--ember-rgb), 0.06)'
                  : 'rgba(255, 255, 255, 0.02)'
              }
              stroke={
                isActive
                  ? 'rgba(var(--ember-rgb), 0.15)'
                  : 'rgba(255, 255, 255, 0.06)'
              }
              strokeWidth={1}
            />
            <text
              x={node.x}
              y={node.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fill={
                isActive
                  ? 'rgba(var(--ember-rgb), 0.3)'
                  : 'rgba(255, 255, 255, 0.08)'
              }
              fontSize={8}
              fontFamily="var(--font-mono, monospace)"
              letterSpacing="0.06em"
            >
              {node.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
})

/** Radial dependency web with a central hub and 8 satellite nodes. */
const DependencyWeb = memo(function DependencyWeb() {
  return (
    <svg
      width={200}
      height={200}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lines from center to each satellite */}
      {DEP_WEB_SATELLITES.map((sat, i) => (
        <line
          key={`dep-line-${i}`}
          x1={100}
          y1={100}
          x2={sat.cx}
          y2={sat.cy}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
      ))}

      {/* Central hub dot */}
      <circle cx={100} cy={100} r={3} fill="rgba(255,255,255,0.06)" />

      {/* Satellite dots */}
      {DEP_WEB_SATELLITES.map((sat, i) => (
        <circle
          key={`dep-dot-${i}`}
          cx={sat.cx}
          cy={sat.cy}
          r={3}
          fill="rgba(255,255,255,0.06)"
          className={sat.pulse ? 'enrichment-circuit-pulse' : undefined}
        />
      ))}
    </svg>
  )
})

// ---------------------------------------------------------------------------
// Main scene component
// ---------------------------------------------------------------------------

export const ProjectRoomScene = memo(function ProjectRoomScene({ dockSide }: { dockSide: PanelSide }) {
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
      {/* 1. Workflow DAG -- center-left */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', top: '28%', ...(dockSide === 'right' ? { left: '8%' } : { right: '8%' }) }}
      >
        <WorkflowDag />
      </div>

      {/* 2. Run Log -- left side */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', top: 60, ...(dockSide === 'right' ? { left: 40 } : { right: 40 }) }}
      >
        <DataStream
          lines={RUN_LOG_LINES}
          width={280}
          height={400}
          color="rgba(255,255,255,0.05)"
          scrollDuration={50}
        />
      </div>

      {/* 3. Phase Gate Bars -- lower-left */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          ...(dockSide === 'right' ? { left: 40 } : { right: 40 }),
          bottom: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {PHASE_GATES.map((gate) => (
          <ProgressBar
            key={gate.label}
            label={gate.label}
            value={gate.value}
            width={200}
            height={4}
            fillColor={gate.fillColor}
          />
        ))}
      </div>

      {/* 4. Artifact Counter -- center */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          ...(dockSide === 'right' ? { left: '38%' } : { right: '38%' }),
          top: '55%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <GhostCounter value="2,847" label="ARTIFACTS" size={72} />
        <GhostText text="TRUTH ENTRIES: 412" size={10} opacity={0.08} />
      </div>

      {/* 5. Dependency Web -- upper-right (400px clear for dock) */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          ...(dockSide === 'right' ? { right: 440 } : { left: 440 }),
          top: 40,
        }}
      >
        <DependencyWeb />
      </div>
    </div>
  )
})
