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

import { useCallback, useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'motion/react'
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
  ArrowRight,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from 'lucide-react'

import type { CategoryGridItem, OperationalPriority, TrendDirection } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'
import { PriorityBadge } from '@/components/coverage/PriorityBadge'

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
  /** Callback when the filter button is clicked. */
  onFilter?: (id: NodeId) => void
  /** Whether this card is the active map filter. */
  isFiltered?: boolean
  /** Whether this card should be dimmed because other cards have active filters. */
  isDimmedByFilter?: boolean
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
    transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 },
  },
  selected: {
    opacity: 1,
    scale: 1.2,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
  dimmed: {
    opacity: 0.3,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
}

// ---------------------------------------------------------------------------
// Trend arrow (file-private)
// ---------------------------------------------------------------------------

const TREND_CONFIG: Record<TrendDirection, {
  icon: LucideIcon
  color: string
  label: string
}> = {
  up:     { icon: TrendingUp,   color: 'rgba(239, 68, 68, 0.70)',   label: 'trending up' },
  down:   { icon: TrendingDown, color: 'rgba(34, 197, 94, 0.70)',   label: 'trending down' },
  stable: { icon: Minus,        color: 'rgba(156, 163, 175, 0.40)', label: 'stable' },
}

function TrendArrow({ trend }: { trend: TrendDirection }) {
  const config = TREND_CONFIG[trend]
  const Icon = config.icon
  return (
    <Icon
      size={14}
      style={{ color: config.color }}
      aria-hidden="true"
      className="shrink-0"
    />
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CategoryCard({
  item,
  isSelected,
  hasSelection,
  onSelect,
  onFilter,
  isFiltered = false,
  isDimmedByFilter = false,
}: CategoryCardProps) {
  const { id, meta, metrics } = item
  const IconComponent = ICON_MAP[meta.icon] ?? FallbackIcon
  const [isHovered, setIsHovered] = useState(false)
  const priorityCount = metrics.p1Count + metrics.p2Count
  const highestPriority: OperationalPriority | null =
    metrics.p1Count > 0 ? 'P1' : metrics.p2Count > 0 ? 'P2' : null

  // Resolve variant string (morph selection takes priority, then filter dimming)
  const variant = isSelected ? 'selected' : hasSelection ? 'dimmed' : 'idle'

  const handleDistrictClick = useCallback(() => {
    setIsHovered(false)
    onSelect(id)
  }, [id, onSelect])

  const handleFilterClick = useCallback(() => {
    setIsHovered(false)
    onFilter?.(id)
  }, [id, onFilter])

  return (
    <motion.div
      data-category-card
      data-selected={isSelected ? 'true' : 'false'}
      data-filtered={isFiltered ? 'true' : 'false'}
      variants={cardVariants}
      animate={variant}
      role="group"
      tabIndex={0}
      aria-label={`${meta.displayName} category -- ${metrics.alertCount} alerts, ${metrics.sourceCount} sources${priorityCount > 0 ? `, ${priorityCount} priority` : ''}${item.trend ? `, ${TREND_CONFIG[item.trend].label}` : ''}${isFiltered ? ' (filtering map)' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative flex cursor-default flex-col items-start gap-3 rounded-xl border bg-[rgba(var(--ambient-ink-rgb),0.05)] px-4 py-4 backdrop-blur-[12px] backdrop-saturate-[120%] border-[rgba(var(--ambient-ink-rgb),0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember-bright)]"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: meta.color,
        boxShadow: isFiltered ? `inset 0 0 12px ${meta.color}20, 0 0 8px ${meta.color}10` : undefined,
        opacity: isDimmedByFilter ? 0.4 : undefined,
        transition: 'opacity 0.3s ease',
      }}
    >
      {/* Priority badge -- top-right corner */}
      {highestPriority !== null && (
        <span
          className="absolute top-2 right-2 inline-flex items-center gap-1"
          aria-hidden="true"
        >
          <PriorityBadge priority={highestPriority} size="md" />
          {priorityCount > 1 && (
            <span
              className="font-mono text-[9px] tabular-nums leading-none"
              style={{
                color: highestPriority === 'P1'
                  ? 'rgba(255, 255, 255, 0.55)'
                  : 'rgba(255, 255, 255, 0.35)',
              }}
            >
              {priorityCount}
            </span>
          )}
        </span>
      )}

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

      {/* Alert count (primary metric) + trend arrow */}
      <span className="flex items-center gap-1.5">
        <span className="text-text-primary text-2xl font-bold tabular-nums leading-none">
          {metrics.alertCount}
        </span>
        {item.trend && <TrendArrow trend={item.trend} />}
      </span>

      {/* Source count (secondary) */}
      <span className="text-text-tertiary text-[10px] tabular-nums">
        {metrics.sourceCount} {metrics.sourceCount === 1 ? 'source' : 'sources'}
      </span>

      {/* Hover overlay with two action buttons */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 z-10 flex flex-col items-stretch justify-center gap-3 rounded-xl px-3 py-3"
            style={{
              backgroundColor: 'rgba(5, 9, 17, 0.92)',
              backdropFilter: 'blur(12px)',
              border: `1px solid rgba(255, 255, 255, 0.10)`,
            }}
          >
            <button
              type="button"
              onClick={handleDistrictClick}
              className="flex items-center gap-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] transition-all duration-150 hover:border-[rgba(255,255,255,0.18)] hover:bg-[rgba(255,255,255,0.10)] hover:text-white cursor-pointer"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              <ArrowRight size={14} className="shrink-0" />
              <span>View District</span>
            </button>
            {onFilter && (
              <button
                type="button"
                onClick={handleFilterClick}
                aria-label={isFiltered ? `Remove ${meta.displayName} map filter` : `Show ${meta.displayName} on map`}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.08em] transition-all duration-150 cursor-pointer"
                style={{
                  color: isFiltered ? meta.color : 'rgba(255, 255, 255, 0.6)',
                  borderColor: isFiltered ? `${meta.color}40` : 'rgba(255, 255, 255, 0.08)',
                  backgroundColor: isFiltered ? `${meta.color}12` : 'rgba(255, 255, 255, 0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isFiltered ? `${meta.color}60` : 'rgba(255, 255, 255, 0.18)'
                  e.currentTarget.style.backgroundColor = isFiltered ? `${meta.color}20` : 'rgba(255, 255, 255, 0.10)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isFiltered ? `${meta.color}40` : 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.backgroundColor = isFiltered ? `${meta.color}12` : 'rgba(255, 255, 255, 0.04)'
                }}
              >
                <MapPin size={14} className="shrink-0" />
                <span>{isFiltered ? 'Remove Map Filter' : 'Show on Map'}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
