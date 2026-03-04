/**
 * DistrictViewDock -- glass panel with category information and metadata.
 *
 * Shows the selected category's display name, short code, description,
 * source counts, and geographic coverage regions. Replaces the legacy
 * STATION_CONFIG-based dock that showed port numbers and external URLs.
 *
 * Position mirrors based on `panelSide`: docks to the right for
 * right-opening districts, left for left-opening districts.
 *
 * @module district-view-dock
 * @see WS-3.1 Section 4.4
 */

'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { getCategoryMeta, getCategoryColor } from '@/lib/interfaces/coverage'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import type { NodeId } from '@/lib/interfaces/district'
import type { PanelSide } from '@/lib/morph-types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DistrictViewDockProps {
  readonly districtId: NodeId
  readonly panelSide: PanelSide
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictViewDock({ districtId, panelSide }: DistrictViewDockProps) {
  const meta = getCategoryMeta(districtId)
  const categoryColor = getCategoryColor(districtId)
  const { data: metrics } = useCoverageMetrics()
  const categoryData = metrics?.byCategory.find((c) => c.category === districtId)

  const isRight = panelSide === 'right'
  const slideFrom = isRight ? 40 : -40

  return (
    <motion.div
      className={cn(
        'fixed top-[42px] bottom-0 w-[360px]',
        isRight ? 'right-0 border-l' : 'left-0 border-r',
        'border-white/[0.06]',
        'backdrop-blur-[16px] backdrop-saturate-[130%]',
        'overflow-y-auto',
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        zIndex: 31,
        pointerEvents: 'auto',
      }}
      initial={{ x: slideFrom, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: slideFrom, opacity: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1,
      }}
    >
      <div className="flex flex-col gap-0 px-6 pt-8 pb-8">
        {/* Category name */}
        <span
          className="block font-mono text-[18px] font-medium tracking-[0.08em] uppercase"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          {meta.displayName}
        </span>

        {/* Category short code */}
        <span
          className="mt-1 block font-mono text-[11px] tracking-wider"
          style={{ color: categoryColor, opacity: 0.4 }}
        >
          {meta.shortName}
        </span>

        {/* Description */}
        <p
          className="mt-4 font-mono text-[11px] leading-[1.5]"
          style={{ color: 'rgba(255, 255, 255, 0.25)' }}
        >
          {meta.description}
        </p>

        {/* Separator */}
        <div
          className="my-5"
          style={{
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          }}
        />

        {/* Sources section (replaces STATUS) */}
        <div className="flex flex-col gap-2">
          <span
            className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.15)' }}
          >
            SOURCES
          </span>
          {categoryData ? (
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[11px]"
                style={{ color: 'rgba(255, 255, 255, 0.25)' }}
              >
                {categoryData.sourceCount} sources
              </span>
              <span
                className="font-mono text-[11px]"
                style={{ color: 'rgba(255, 255, 255, 0.15)' }}
              >
                ({categoryData.activeSources} active)
              </span>
            </div>
          ) : (
            <span
              className="font-mono text-[11px]"
              style={{ color: 'rgba(255, 255, 255, 0.15)' }}
            >
              No source data
            </span>
          )}
        </div>

        {/* Separator */}
        <div
          className="my-5"
          style={{
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          }}
        />

        {/* Geographic regions (replaces STATIONS) */}
        <div className="flex flex-col gap-3">
          <span
            className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.15)' }}
          >
            COVERAGE REGIONS
          </span>
          <div className="flex flex-wrap gap-2">
            {(categoryData?.geographicRegions ?? []).length > 0 ? (
              categoryData!.geographicRegions.map((region) => (
                <span
                  key={region}
                  className={cn(
                    'rounded-md px-2.5 py-1',
                    'border border-white/[0.06]',
                    'bg-white/[0.02]',
                    'font-mono text-[9px] tracking-[0.08em] uppercase',
                  )}
                  style={{ color: 'rgba(255, 255, 255, 0.2)' }}
                >
                  {region}
                </span>
              ))
            ) : (
              <span
                className="font-mono text-[9px]"
                style={{ color: 'rgba(255, 255, 255, 0.12)' }}
              >
                No region data
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
