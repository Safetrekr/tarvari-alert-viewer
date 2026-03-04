/**
 * DetailPanel -- expanded category panel that appears alongside the grid.
 *
 * Positioned fixed to the right side of the viewport when non-promoted,
 * and viewport-centered when promoted (district view phase).
 * Contains category header, close button, and category content preview
 * (description, source summary, region tags).
 *
 * @module detail-panel
 * @see WS-2.2 Section 4.3
 * @see WS-3.1 Section 4.6 (H-1 fix)
 */

'use client'

import { motion } from 'motion/react'

import { cn } from '@/lib/utils'
import type { NodeId } from '@/lib/interfaces/district'
import { getCategoryMeta } from '@/lib/interfaces/coverage'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { DETAIL_PANEL_DIMENSIONS } from '@/lib/morph-types'

// ---------------------------------------------------------------------------
// Category panel content (H-1 fix -- replaces legacy DistrictContent)
// ---------------------------------------------------------------------------

function CategoryPanelContent({ categoryId }: { categoryId: string }) {
  const meta = getCategoryMeta(categoryId)
  const { data: metrics } = useCoverageMetrics()
  const categoryData = metrics?.byCategory.find((c) => c.category === categoryId)

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="font-sans text-[24px] leading-relaxed text-[var(--color-text-secondary)]">
        {meta.description}
      </p>

      {/* Source summary */}
      {categoryData && (
        <div className="flex items-center gap-3">
          <span className="font-sans text-[20px] text-[var(--color-text-tertiary)]">
            {categoryData.sourceCount} sources
          </span>
          <span className="font-sans text-[20px] text-[var(--color-text-ghost)]">
            {categoryData.activeSources} active
          </span>
        </div>
      )}

      {/* Region tags */}
      {categoryData && categoryData.geographicRegions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {categoryData.geographicRegions.map((region) => (
            <span
              key={region}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-1.5
                         font-sans text-[20px] text-[var(--color-text-tertiary)]"
            >
              {region}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  /** Category ID being expanded. */
  categoryId: NodeId
  /** Close handler (triggers reverse morph). */
  onClose: () => void
  /** When true, panel is promoted to viewport-centered overlay (district view). */
  promoted?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DetailPanel({
  categoryId,
  onClose,
  promoted = false,
}: DetailPanelProps) {
  const displayName = getCategoryMeta(categoryId).displayName
  const slideDirection = 40 // Always slides in from the right

  // When promoted: fixed, centered in the content area between
  // back button (~70px) and dock (360px), above the overlay (zIndex 33).
  // NOTE: No CSS `transform` here -- motion/react controls `transform`
  // for its animations (scale, x), so a CSS transform would be overridden.
  const promotedStyle: React.CSSProperties = promoted
    ? {
        position: 'fixed',
        top: '22%',
        left: 'calc((100vw - 360px) / 2 - 340px)',
        width: Math.min(DETAIL_PANEL_DIMENSIONS.width, 800),
        height: 'min(80vh, 680px)',
        zIndex: 33,
        pointerEvents: 'auto',
      }
    : {
        position: 'fixed' as const,
        right: 40,
        top: '50%',
        transform: 'translateY(-50%)',
        width: DETAIL_PANEL_DIMENSIONS.width,
        height: DETAIL_PANEL_DIMENSIONS.height,
        zIndex: 20,
        pointerEvents: 'auto',
      }

  return (
    <motion.div
      data-detail-panel
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'rounded-[32px] p-10',
        // Glass material
        'bg-[rgba(var(--ambient-ink-rgb),0.06)] backdrop-blur-[16px] backdrop-saturate-[130%]',
        'border border-[rgba(var(--ambient-ink-rgb),0.08)]',
        // Ember glow
        'shadow-[inset_0_1px_0_0_rgba(var(--ambient-ink-rgb),0.04),0_0_1px_0_rgba(var(--ember-rgb),0.3),0_0_24px_rgba(var(--ember-rgb),0.1)]',
      )}
      style={promotedStyle}
      initial={{
        opacity: 0,
        x: promoted ? 0 : slideDirection,
        scale: promoted ? 0.82 : 0.96,
        y: promoted ? 30 : 0,
      }}
      animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: promoted ? 0 : slideDirection * 0.67,
        scale: promoted ? 0.88 : 0.96,
        y: promoted ? 20 : 0,
        transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
      }}
      transition={
        promoted
          ? { type: 'spring', stiffness: 100, damping: 20, mass: 1.2 }
          : { type: 'spring', stiffness: 140, damping: 22, mass: 1 }
      }
    >
      <div className="flex h-full flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-[32px] font-bold tracking-[0.02em] uppercase text-[var(--color-text-primary)] leading-[1.1]">
            {displayName}
          </h2>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              'bg-white/[0.04] hover:bg-white/[0.08]',
              'border border-white/[0.06] hover:border-white/[0.12]',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              'transition-all duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-[var(--color-ember-bright)]',
            )}
            aria-label={`Close ${displayName} category`}
          >
            <svg width="16" height="16" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Category detail content (H-1 fix) */}
        <div className="flex flex-1 flex-col gap-4 overflow-auto">
          <CategoryPanelContent categoryId={categoryId} />
        </div>
      </div>
    </motion.div>
  )
}
