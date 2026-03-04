/**
 * TimelineStrip -- Z2 compressed density bar.
 *
 * Horizontal density bar showing receipt volume over time,
 * color-coded by actor type:
 * - Teal (--color-teal-bright) = human actions
 * - Ember (--color-ember-glow) = AI actions
 * - Gray (--color-text-tertiary) = system actions
 *
 * Segment height is proportional to the activity density
 * within that time bucket. Renders when the district is
 * visible at Z2 zoom level.
 *
 * @module timeline-strip
 * @see WS-3.2 Section 4
 */

'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { LaunchReceipt } from '@/lib/interfaces/receipt-store'
import type { DensitySegment } from '@/lib/evidence-ledger-types'
import './evidence-ledger.css'

// ============================================================================
// Constants
// ============================================================================

/** Number of time buckets in the density bar. */
const BUCKET_COUNT = 24

/** Maximum segment height as percentage of strip height. */
const MAX_HEIGHT_PCT = 100

/** Minimum segment height (so empty buckets still show a sliver). */
const MIN_HEIGHT_PCT = 4

// ============================================================================
// Props
// ============================================================================

export interface TimelineStripProps {
  /** Receipts to visualize in the density bar. */
  readonly receipts: LaunchReceipt[]
  /** Total count of receipts (displayed as subtitle). */
  readonly totalCount: number
  /** Whether the component is currently loading data. */
  readonly isLoading: boolean
}

// ============================================================================
// Component
// ============================================================================

export function TimelineStrip({ receipts, totalCount, isLoading }: TimelineStripProps) {
  const segments = useMemo(() => buildDensitySegments(receipts), [receipts])
  const maxTotal = useMemo(
    () => Math.max(1, ...segments.map((s) => s.total)),
    [segments],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Label */}
      <div className="mb-2">
        <span className="evidence-ledger-z2-label">Evidence Ledger</span>
        <div className="mt-0.5">
          <span className="evidence-ledger-z2-subtitle">
            {isLoading ? 'Loading...' : `${totalCount} receipt${totalCount !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Density bar */}
      <div className="timeline-strip" role="img" aria-label={`Activity timeline: ${totalCount} receipts`}>
        {segments.map((segment, i) => {
          if (segment.total === 0) {
            return (
              <div
                key={i}
                className="timeline-strip-segment timeline-strip-segment--system"
                style={{
                  height: `${MIN_HEIGHT_PCT}%`,
                  opacity: 0.1,
                }}
              />
            )
          }

          // Determine dominant actor type for color
          const heightPct = Math.max(
            MIN_HEIGHT_PCT,
            (segment.total / maxTotal) * MAX_HEIGHT_PCT,
          )
          const dominantClass = getDominantActorClass(segment)
          const opacity = 0.3 + (segment.total / maxTotal) * 0.7

          return (
            <div
              key={i}
              className={cn('timeline-strip-segment', dominantClass)}
              style={{
                height: `${heightPct}%`,
                opacity,
              }}
              title={`${segment.total} receipt${segment.total !== 1 ? 's' : ''} (${segment.humanCount} human, ${segment.aiCount} AI, ${segment.systemCount} system)`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-3">
        <LegendDot className="timeline-strip-segment--human" label="Human" />
        <LegendDot className="timeline-strip-segment--ai" label="AI" />
        <LegendDot className="timeline-strip-segment--system" label="System" />
      </div>
    </motion.div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn('inline-block h-2 w-2 rounded-full', className)} />
      <span className="font-mono text-[9px] tracking-wider uppercase text-[var(--color-text-tertiary,#55667a)] opacity-50">
        {label}
      </span>
    </div>
  )
}

/**
 * Build density segments by bucketing receipts into time windows.
 * Buckets cover the last 24 hours by default, or stretch to cover
 * the full receipt range if older receipts exist.
 */
function buildDensitySegments(receipts: LaunchReceipt[]): DensitySegment[] {
  if (receipts.length === 0) {
    return Array.from({ length: BUCKET_COUNT }, () => ({
      start: '',
      end: '',
      humanCount: 0,
      aiCount: 0,
      systemCount: 0,
      total: 0,
    }))
  }

  const now = Date.now()
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000

  // Find the actual time range of receipts
  const timestamps = receipts.map((r) => new Date(r.timestamp).getTime())
  const minTime = Math.min(...timestamps, twentyFourHoursAgo)
  const maxTime = Math.max(...timestamps, now)

  const bucketSize = (maxTime - minTime) / BUCKET_COUNT

  const segments: DensitySegment[] = Array.from({ length: BUCKET_COUNT }, (_, i) => ({
    start: new Date(minTime + i * bucketSize).toISOString(),
    end: new Date(minTime + (i + 1) * bucketSize).toISOString(),
    humanCount: 0,
    aiCount: 0,
    systemCount: 0,
    total: 0,
  }))

  for (const receipt of receipts) {
    const t = new Date(receipt.timestamp).getTime()
    const bucketIndex = Math.min(
      BUCKET_COUNT - 1,
      Math.max(0, Math.floor((t - minTime) / bucketSize)),
    )

    const seg = segments[bucketIndex]
    const mutableSeg = seg as { humanCount: number; aiCount: number; systemCount: number; total: number }

    switch (receipt.actor) {
      case 'human':
        mutableSeg.humanCount++
        break
      case 'ai':
        mutableSeg.aiCount++
        break
      case 'system':
        mutableSeg.systemCount++
        break
    }
    mutableSeg.total++
  }

  return segments
}

/**
 * Get the CSS class for the dominant actor type in a segment.
 */
function getDominantActorClass(segment: DensitySegment): string {
  if (segment.aiCount >= segment.humanCount && segment.aiCount >= segment.systemCount) {
    return 'timeline-strip-segment--ai'
  }
  if (segment.humanCount >= segment.systemCount) {
    return 'timeline-strip-segment--human'
  }
  return 'timeline-strip-segment--system'
}
