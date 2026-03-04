/**
 * AgentBuilderScene -- ambient background for the Agent Builder district.
 *
 * Theme: "Workshop / Foundry" -- a Web IDE for creating AI agents (port 3000).
 *
 * Composed from shared scene primitives: DataStream, StatusDotGrid,
 * GhostCounter, and GhostText. Pure decorative -- no interactivity.
 *
 * @module agent-builder-scene
 * @see src/components/district-view/shared-scene-primitives.tsx
 */

'use client'

import { memo } from 'react'
import type { PanelSide } from '@/lib/morph-types'
import {
  DataStream,
  StatusDotGrid,
  GhostCounter,
  GhostText,
} from '@/components/district-view/shared-scene-primitives'

// ---------------------------------------------------------------------------
// Data stream content
// ---------------------------------------------------------------------------

const CONFIG_LINES = [
  'model: "claude-opus-4-6"',
  'temperature: 0.7',
  'max_tokens: 4096',
  'tools: ["bash", "read"]',
  'system: "You are..."',
  'skills: 3 loaded',
  'context: 12.4K tokens',
  'hooks: 2 active',
]

const AGENT_LINES = [
  'AGENT_001 // ACTIVE',
  'type: code-review',
  'runs: 847',
  'avg_time: 2.3s',
  'success: 99.2%',
  'memory: 128MB',
  'last_run: 12s ago',
  'queue: 0',
]

const BUILD_LINES = [
  'BUILD 847 PASS',
  'TESTS 142/142',
  'COVERAGE 94.7%',
  'LINT: 0 errors',
  'BUNDLE: 2.1MB',
  'DEPLOY: staging',
  'ROLLBACK: ready',
  'HEALTH: nominal',
]

// ---------------------------------------------------------------------------
// Pipeline phase definitions
// ---------------------------------------------------------------------------

interface PipelineSegment {
  label: string
  fill: string
}

const PIPELINE_SEGMENTS: PipelineSegment[] = [
  { label: 'PARSE', fill: 'rgba(14, 165, 233, 0.25)' },
  { label: 'VALIDATE', fill: 'rgba(14, 165, 233, 0.25)' },
  { label: 'GENERATE', fill: 'rgba(var(--ember-rgb), 0.3)' },
  { label: 'TEST', fill: 'rgba(255, 255, 255, 0.04)' },
  { label: 'DEPLOY', fill: 'rgba(255, 255, 255, 0.04)' },
]

// ---------------------------------------------------------------------------
// Skill matrix labels
// ---------------------------------------------------------------------------

const SKILL_LABELS = ['BASH', 'READ', 'WRITE', 'GLOB', 'GREP', 'HTTP']

// ---------------------------------------------------------------------------
// Blueprint grid SVG
// ---------------------------------------------------------------------------

function BlueprintGrid() {
  const width = 400
  const height = 300
  const spacing = 80
  const strokeColor = 'rgba(255, 255, 255, 0.03)'

  // Vertical lines
  const verticals: number[] = []
  for (let x = 0; x <= width; x += spacing) {
    verticals.push(x)
  }

  // Horizontal lines
  const horizontals: number[] = []
  for (let y = 0; y <= height; y += spacing) {
    horizontals.push(y)
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block' }}
      >
        {verticals.map((x) => (
          <line
            key={`v-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke={strokeColor}
            strokeWidth={1}
          />
        ))}
        {horizontals.map((y) => (
          <line
            key={`h-${y}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke={strokeColor}
            strokeWidth={1}
          />
        ))}
      </svg>

      {/* Corner coordinate labels */}
      <GhostText
        text="X:0000 Y:0000"
        size={7}
        opacity={0.06}
        style={{ position: 'absolute', top: 4, left: 4 }}
      />
      <GhostText
        text="X:0420 Y:0000"
        size={7}
        opacity={0.06}
        style={{ position: 'absolute', top: 4, right: 4 }}
      />
      <GhostText
        text="X:0000 Y:0300"
        size={7}
        opacity={0.06}
        style={{ position: 'absolute', bottom: 4, left: 4 }}
      />
      <GhostText
        text="X:0420 Y:0180"
        size={7}
        opacity={0.06}
        style={{ position: 'absolute', bottom: 4, right: 4 }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pipeline phase indicator
// ---------------------------------------------------------------------------

function PipelinePhaseIndicator() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
      {PIPELINE_SEGMENTS.map((seg) => (
        <div
          key={seg.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 8,
              color: 'rgba(255, 255, 255, 0.1)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {seg.label}
          </span>
          <div
            style={{
              width: 80,
              height: 20,
              borderRadius: 2,
              backgroundColor: seg.fill,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AgentBuilderScene = memo(function AgentBuilderScene({ dockSide }: { dockSide: PanelSide }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {/* 1. Blueprint Grid -- top-left quadrant */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', top: 80, ...(dockSide === 'right' ? { left: 40 } : { right: 40 }) }}
      >
        <BlueprintGrid />
      </div>

      {/* 2. Agent Schema Waterfall -- left side, 3 columns */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: 120,
          ...(dockSide === 'right' ? { left: 60 } : { right: 60 }),
          display: 'flex',
          gap: 12,
        }}
      >
        <DataStream
          lines={CONFIG_LINES}
          width={180}
          height={350}
          color="rgba(255, 255, 255, 0.05)"
          scrollDuration={48}
        />
        <DataStream
          lines={AGENT_LINES}
          width={180}
          height={350}
          color="rgba(255, 255, 255, 0.05)"
          scrollDuration={52}
        />
        <DataStream
          lines={BUILD_LINES}
          width={180}
          height={350}
          color="rgba(255, 255, 255, 0.05)"
          scrollDuration={50}
        />
      </div>

      {/* 3. Pipeline Phase Indicator -- bottom-left area */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', bottom: 120, ...(dockSide === 'right' ? { left: 60 } : { right: 60 }) }}
      >
        <PipelinePhaseIndicator />
      </div>

      {/* 4. Skill Matrix -- upper-right area (leaving 400px for dock) */}
      <div
        className="district-ambient-element"
        style={{ position: 'absolute', top: 100, ...(dockSide === 'right' ? { right: 440 } : { left: 440 }) }}
      >
        <StatusDotGrid
          rows={6}
          cols={8}
          labels={SKILL_LABELS}
          activeColor="rgba(14, 165, 233, 0.25)"
        />
      </div>

      {/* 5. Build Counter -- center area */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: '40%',
          ...(dockSide === 'right' ? { left: '35%' } : { right: '35%' }),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <GhostCounter value="12" label="AGENTS DEPLOYED" />
        <GhostText
          text="BUILD 847 // PASS // 2.1MB"
          size={9}
          opacity={0.08}
        />
      </div>
    </div>
  )
})
