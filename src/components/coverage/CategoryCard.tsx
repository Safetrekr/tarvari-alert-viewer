'use client'

/**
 * CategoryCard -- individual category card in the CoverageGrid.
 *
 * Built on @tarva/ui Card with glass effect overlay. Shows category icon,
 * name, source count, and active indicator. Supports idle/hover/selected/dimmed
 * states via motion variants.
 *
 * @module CategoryCard
 * @see WS-2.1 Section 4.3
 */

import { useCallback, type KeyboardEvent } from 'react'
import { motion, type Variants } from 'motion/react'
import {
  Activity,
  Mountain,
  AlertTriangle,
  Heart,
  HeartPulse,
  Plane,
  Ship,
  Building2,
  Cloud,
  ShieldAlert,
  Flame,
  Waves,
  CloudLightning,
  Layers,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'

import type { CategoryGridItem } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CategoryCardProps {
  /** Category data (metadata + live metrics). */
  item: CategoryGridItem
  /** Whether this card is currently selected. */
  isSelected: boolean
  /** Whether any card in the grid is selected (for dimming siblings). */
  hasSelection: boolean
  /** Callback when this card is clicked. */
  onSelect: (id: NodeId) => void
}

// ---------------------------------------------------------------------------
// Icon resolution (static map -- tree-shakeable)
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  'activity': Activity,
  'mountain': Mountain,
  'alert-triangle': AlertTriangle,
  'heart': Heart,
  'heart-pulse': HeartPulse,
  'plane': Plane,
  'ship': Ship,
  'building-2': Building2,
  'cloud': Cloud,
  'shield-alert': ShieldAlert,
  'flame': Flame,
  'waves': Waves,
  'cloud-lightning': CloudLightning,
  'layers': Layers,
  'circle-dot': CircleDot,
}

/** Fallback icon for unknown category icon strings. */
const FallbackIcon = CircleDot

// ---------------------------------------------------------------------------
// Motion variants
// ---------------------------------------------------------------------------

const cardVariants: Variants = {
  idle: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
  selected: {
    opacity: 0.25,
    scale: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
  dimmed: {
    opacity: 0.5,
    scale: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryCard({
  item,
  isSelected,
  hasSelection,
  onSelect,
}: CategoryCardProps) {
  const { id, meta, metrics } = item
  const IconComponent = ICON_MAP[meta.icon] ?? FallbackIcon

  // Resolve variant string
  const variant = isSelected ? 'selected' : hasSelection ? 'dimmed' : 'idle'

  const handleClick = useCallback(() => {
    onSelect(id)
  }, [id, onSelect])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(id)
      }
    },
    [id, onSelect],
  )

  return (
    <motion.div
      variants={cardVariants}
      animate={variant}
      whileHover={{ scale: 1.04 }}
      role="button"
      tabIndex={0}
      aria-label={`${meta.displayName} category -- ${metrics.sourceCount} sources, ${metrics.activeSources} active`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="relative flex cursor-pointer flex-col items-start gap-3 rounded-xl border bg-[rgba(var(--ambient-ink-rgb),0.05)] px-4 py-4 backdrop-blur-[12px] backdrop-saturate-[120%] border-[rgba(var(--ambient-ink-rgb),0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember-bright)]"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: meta.color,
      }}
    >
      {/* Category icon */}
      <IconComponent
        size={24}
        className="shrink-0"
        style={{ color: meta.color }}
      />

      {/* Category name */}
      <span className="text-text-secondary text-[11px] font-semibold uppercase tracking-wider">
        {meta.displayName}
      </span>

      {/* Source count */}
      <span className="text-text-primary text-2xl font-bold tabular-nums leading-none">
        {metrics.sourceCount}
      </span>

      {/* Active indicator */}
      <span className="text-text-tertiary text-[10px] tabular-nums">
        {metrics.activeSources} active
      </span>
    </motion.div>
  )
}
