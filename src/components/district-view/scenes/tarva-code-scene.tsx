/**
 * TarvaCodeScene -- ambient background for the tarvaCODE district.
 *
 * Theme: "Knowledge Graph / Archive" -- AI conversation knowledge
 * management. Currently in planning stage with no active service.
 *
 * Composed from shared scene primitives (GhostText) plus custom SVG
 * elements for the knowledge tree and embedding cluster visualizations.
 * Pure decorative -- no interactivity.
 *
 * @module tarva-code-scene
 * @see src/components/district-view/shared-scene-primitives.tsx
 */

'use client'

import { memo, useMemo } from 'react'
import type { PanelSide } from '@/lib/morph-types'
import { GhostText } from '@/components/district-view/shared-scene-primitives'

// ---------------------------------------------------------------------------
// Knowledge tree positions
// ---------------------------------------------------------------------------

interface TreeNode {
  x: number
  y: number
}

interface TreeEdge {
  from: number
  to: number
}

/** Root -> 3 children -> 2 leaves each = 10 nodes total */
const TREE_NODES: TreeNode[] = [
  // Root (index 0)
  { x: 200, y: 30 },
  // Children (indices 1-3)
  { x: 100, y: 120 },
  { x: 200, y: 120 },
  { x: 300, y: 120 },
  // Leaves from child 0 (indices 4-5)
  { x: 75, y: 210 },
  { x: 125, y: 210 },
  // Leaves from child 1 (indices 6-7)
  { x: 175, y: 210 },
  { x: 225, y: 210 },
  // Leaves from child 2 (indices 8-9)
  { x: 275, y: 210 },
  { x: 325, y: 210 },
]

const TREE_EDGES: TreeEdge[] = [
  // Root to children
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 0, to: 3 },
  // Child 0 to leaves
  { from: 1, to: 4 },
  { from: 1, to: 5 },
  // Child 1 to leaves
  { from: 2, to: 6 },
  { from: 2, to: 7 },
  // Child 2 to leaves
  { from: 3, to: 8 },
  { from: 3, to: 9 },
]

function KnowledgeTree() {
  return (
    <svg
      width={400}
      height={300}
      viewBox="0 0 400 300"
      style={{ display: 'block' }}
    >
      {/* Edges */}
      {TREE_EDGES.map((edge, i) => {
        const a = TREE_NODES[edge.from]
        const b = TREE_NODES[edge.to]
        return (
          <line
            key={`e-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(99, 102, 241, 0.05)"
            strokeWidth={1}
          />
        )
      })}

      {/* Nodes */}
      {TREE_NODES.map((node, i) => (
        <circle
          key={`n-${i}`}
          cx={node.x}
          cy={node.y}
          r={6}
          fill="rgba(99, 102, 241, 0.1)"
        />
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Conversation fragment definitions
// ---------------------------------------------------------------------------

interface ConversationFragment {
  text: string
  x: number
  y: number
  rotation: number
}

const CONVERSATION_FRAGMENTS: ConversationFragment[] = [
  { text: '"How should we handle auth?"', x: 40, y: 120, rotation: -1.5 },
  { text: '"Decision: use Supabase RLS"', x: 80, y: 280, rotation: 0.8 },
  {
    text: '"Context: 47 related conversations"',
    x: 30,
    y: 420,
    rotation: 1.2,
  },
  { text: '"The agents need shared memory"', x: 120, y: 180, rotation: -2 },
  {
    text: '"Pattern: event-driven architecture"',
    x: 60,
    y: 350,
    rotation: 1.8,
  },
]

// ---------------------------------------------------------------------------
// Embedding cluster dot positions (static seed)
// ---------------------------------------------------------------------------

/** 20 dot positions arranged in 3 loose clusters within a 200x120 box. */
const EMBEDDING_DOTS: Array<{ x: number; y: number; pulse: boolean }> = [
  // Cluster 1 (upper-left, ~6 dots)
  { x: 30, y: 22, pulse: false },
  { x: 42, y: 18, pulse: true },
  { x: 36, y: 34, pulse: false },
  { x: 50, y: 28, pulse: false },
  { x: 24, y: 30, pulse: false },
  { x: 44, y: 40, pulse: false },
  // Cluster 2 (center, ~8 dots)
  { x: 100, y: 50, pulse: false },
  { x: 110, y: 44, pulse: true },
  { x: 94, y: 58, pulse: false },
  { x: 116, y: 56, pulse: false },
  { x: 104, y: 64, pulse: false },
  { x: 88, y: 48, pulse: false },
  { x: 120, y: 40, pulse: false },
  { x: 96, y: 42, pulse: false },
  // Cluster 3 (lower-right, ~6 dots)
  { x: 158, y: 80, pulse: false },
  { x: 170, y: 76, pulse: true },
  { x: 164, y: 92, pulse: false },
  { x: 176, y: 86, pulse: false },
  { x: 152, y: 88, pulse: false },
  { x: 180, y: 96, pulse: false },
]

function EmbeddingCluster() {
  return (
    <svg
      width={200}
      height={120}
      viewBox="0 0 200 120"
      style={{ display: 'block' }}
    >
      {EMBEDDING_DOTS.map((dot, i) => (
        <circle
          key={`d-${i}`}
          cx={dot.x}
          cy={dot.y}
          r={2}
          fill="rgba(99, 102, 241, 0.08)"
          className={dot.pulse ? 'enrichment-circuit-pulse' : undefined}
        />
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TarvaCodeScene = memo(function TarvaCodeScene({ dockSide }: { dockSide: PanelSide }) {
  // Memoize fragment rendering since positions are static (except dock side)
  const fragments = useMemo(
    () =>
      CONVERSATION_FRAGMENTS.map((frag, i) => (
        <div
          key={`frag-${i}`}
          className="district-ambient-element"
          style={{
            position: 'absolute',
            ...(dockSide === 'right' ? { left: frag.x } : { right: frag.x }),
            top: frag.y,
            transform: `rotate(${frag.rotation}deg)`,
          }}
        >
          <GhostText text={frag.text} size={10} opacity={0.04} />
        </div>
      )),
    [dockSide],
  )

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
      {/* 1. Knowledge Tree -- center-left */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: 100,
          ...(dockSide === 'right' ? { left: 40 } : { right: 40 }),
        }}
      >
        <KnowledgeTree />
      </div>

      {/* 2. Conversation Fragments -- scattered left 60% */}
      {fragments}

      {/* 3. Planning Stage Watermark -- dead center */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: '50%',
          ...(dockSide === 'right' ? { left: '35%' } : { right: '35%' }),
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 60,
            color: 'rgba(255, 255, 255, 0.03)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 300,
            lineHeight: 1,
            whiteSpace: 'pre',
          }}
        >
          PLANNING STAGE
        </span>
        <GhostText
          text="KNOWLEDGE MANAGEMENT // CONVERSATION INDEXING"
          size={10}
          opacity={0.05}
          letterSpacing="0.1em"
        />
      </div>

      {/* 4. Index Counter -- lower-left */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          bottom: 100,
          ...(dockSide === 'right' ? { left: 60 } : { right: 60 }),
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <GhostText text="CONVERSATIONS: --" size={11} opacity={0.1} />
        <GhostText text="DECISIONS: --" size={11} opacity={0.1} />
      </div>

      {/* 5. Embedding Cluster -- upper area */}
      <div
        className="district-ambient-element"
        style={{
          position: 'absolute',
          top: 60,
          ...(dockSide === 'right' ? { right: 440 } : { left: 440 }),
        }}
      >
        <EmbeddingCluster />
      </div>
    </div>
  )
})
