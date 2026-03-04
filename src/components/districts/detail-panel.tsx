/**
 * DetailPanel -- expanded district panel that appears alongside the capsule.
 *
 * Positioned offset to the left or right of the selected capsule
 * based on its ring quadrant. Contains district header, close button,
 * and DistrictContent (station cards).
 *
 * @module detail-panel
 * @see WS-2.1 Section 4.11
 */

'use client'

import { motion } from 'motion/react'

import { cn } from '@/lib/utils'
import type { NodeId } from '@/lib/interfaces/district'
import { getDistrictById } from '@/lib/spatial-actions'
import {
  DETAIL_PANEL_DIMENSIONS,
  getPanelSide,
  computePanelPosition,
} from '@/lib/morph-types'
import { RING_CENTER } from './capsule-ring'
import { DistrictContent } from './district-content'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  districtId: NodeId
  ringIndex: number
  onClose: () => void
  /** When true, the panel is promoted to a fixed viewport-centered overlay
   *  above the district view (used during entering-district / district phases). */
  promoted?: boolean
  /** Which side the dock is on, so we can offset the centering. */
  dockSide?: 'left' | 'right'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DetailPanel({
  districtId,
  ringIndex,
  onClose,
  promoted = false,
  dockSide = 'right',
}: DetailPanelProps) {
  const district = getDistrictById(districtId)
  const displayName = district?.displayName ?? districtId

  const side = getPanelSide(ringIndex)
  const position = computePanelPosition(ringIndex, RING_CENTER)
  const slideDirection = side === 'right' ? 40 : -40

  // When promoted: fixed, centered in the content area between
  // back button (~70px) and dock (360px), above the overlay (zIndex 33).
  // NOTE: No CSS `transform` here — motion/react controls `transform`
  // for its animations (scale, x), so a CSS transform would be overridden.
  const promotedStyle: React.CSSProperties = promoted
    ? {
        position: 'fixed',
        top: '22%',
        left: dockSide === 'right'
          ? 'calc((100vw - 360px) / 2 - 340px)'
          : 'calc(360px + (100vw - 360px) / 2 - 440px)',
        width: Math.min(DETAIL_PANEL_DIMENSIONS.width, 800),
        height: 'min(80vh, 680px)',
        zIndex: 33,
        pointerEvents: 'auto',
      }
    : {
        position: 'absolute' as const,
        left: position.left,
        top: position.top,
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
            aria-label={`Close ${displayName} district`}
          >
            <svg width="16" height="16" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* District content (station cards) */}
        <div className="flex flex-1 flex-col gap-4 overflow-auto">
          <DistrictContent districtId={districtId} />
        </div>
      </div>
    </motion.div>
  )
}
