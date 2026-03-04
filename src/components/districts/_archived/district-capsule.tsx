/**
 * DistrictCapsule -- glass card for a district in the capsule ring.
 *
 * The capsule is always 192x228px. When selected, it dims to 0.25 opacity
 * while a separate DetailPanel appears alongside. Sibling capsules dim
 * to 0.5 opacity.
 *
 * @module district-capsule
 * @see WS-1.2 Section 4.4
 * @see WS-2.1 Section 4.11
 */

'use client'

import { forwardRef, useCallback, type KeyboardEvent } from 'react'
import { motion, type Variants } from 'motion/react'

import { cn } from '@/lib/utils'
import type { CapsuleData, DistrictId, HealthState } from '@/lib/interfaces/district'
import { capsuleStateVariants } from '@/hooks/use-morph-variants'
import { useEnrichmentStore } from '@/stores/enrichment.store'
import { CapsuleHealthBar } from './capsule-health-bar'
import { CapsuleTelemetry } from './capsule-telemetry'
import { CapsuleSparkline } from './capsule-sparkline'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveVariant(
  isSelected: boolean,
  hasSelection: boolean,
): string {
  if (isSelected) return 'selected'
  if (hasSelection) return 'dimmed'
  return 'idle'
}

function isOfflineState(health: HealthState): boolean {
  return health === 'OFFLINE' || health === 'UNKNOWN'
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DistrictCapsuleProps {
  data: CapsuleData
  isSelected: boolean
  hasSelection: boolean
  onSelect: (id: DistrictId) => void
  style?: { left: number; top: number }
  morphAnimateTarget?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DistrictCapsule = forwardRef<HTMLDivElement, DistrictCapsuleProps>(
  function DistrictCapsule(
    {
      data,
      isSelected,
      hasSelection,
      onSelect,
      style,
      morphAnimateTarget,
    },
    ref,
  ) {
    const isOffline = isOfflineState(data.telemetry.health)
    const isUnknown = data.telemetry.health === 'UNKNOWN'

    // Variant resolution
    const resolvedVariant = morphAnimateTarget
      ? morphAnimateTarget
      : resolveVariant(isSelected, hasSelection)

    const handleKeySelect = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(data.district.id)
        }
      },
      [onSelect, data.district.id],
    )

    const handleMouseEnter = useCallback(() => {
      useEnrichmentStore.getState().setFocusedDistrict(data.district.id)
    }, [data.district.id])

    const handleMouseLeave = useCallback(() => {
      useEnrichmentStore.getState().setFocusedDistrict(null)
    }, [])

    return (
      <motion.div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={`${data.district.displayName} district -- ${data.telemetry.health}`}
        data-district={data.district.id}
        data-selected={isSelected || undefined}
        variants={capsuleStateVariants}
        initial="idle"
        animate={resolvedVariant}
        whileHover={
          isOffline
            ? { scale: 1.04 }
            : hasSelection
              ? undefined
              : 'hover'
        }
        onClick={() => onSelect(data.district.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeySelect}
        className={cn(
          'district-capsule absolute rounded-[28px] p-5',
          // Glass material
          'bg-[rgba(var(--ambient-ink-rgb),0.05)] backdrop-blur-[12px] backdrop-saturate-[120%]',
          'border border-[rgba(var(--ambient-ink-rgb),0.10)]',
          'contain-[layout_style]',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--color-ember-bright)]',
          'cursor-pointer',
          isOffline && 'bg-[rgba(var(--ambient-ink-rgb),0.015)] border-[rgba(var(--ambient-ink-rgb),0.03)]',
          isUnknown && 'border-dashed',
        )}
        style={{
          ...(style ? { left: style.left, top: style.top } : {}),
          width: 192,
          height: 228,
          filter: isOffline ? 'saturate(0.15)' : undefined,
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex flex-col items-center gap-2">
            <span className="font-sans text-[11px] font-semibold tracking-[0.08em] uppercase leading-none text-[var(--color-text-primary)] opacity-90">
              {data.district.displayName}
            </span>
            <CapsuleHealthBar health={data.telemetry.health} capsuleIndex={data.district.ringIndex} />
          </div>
          <div className="mt-3 flex-1">
            <CapsuleTelemetry telemetry={data.telemetry} isOffline={isOffline} />
          </div>
          <div className="mt-auto h-8">
            <CapsuleSparkline data={data.sparklineData} isOffline={isOffline} />
          </div>
        </div>
      </motion.div>
    )
  },
)
