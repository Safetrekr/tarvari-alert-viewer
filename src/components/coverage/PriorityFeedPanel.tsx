'use client'

/**
 * PriorityFeedPanel -- viewport-fixed expanded P1/P2 feed list.
 *
 * Self-contained: reads visibility from `priorityFeedExpanded` in coverage
 * store, data from `usePriorityFeed()`. Clicking an item navigates to
 * the item's category district with the alert pre-selected.
 *
 * @module PriorityFeedPanel
 * @see WS-2.3
 */

import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

import { usePriorityFeed, type PriorityFeedItem } from '@/hooks/use-priority-feed'
import { useCoverageStore } from '@/stores/coverage.store'
import { useUIStore } from '@/stores/ui.store'
import { getCategoryMeta } from '@/lib/interfaces/coverage'
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
import { relativeTimeAgo, useRelativeTimeTick } from '@/lib/time-utils'

// ============================================================================
// Severity colors (same map as PriorityFeedStrip)
// ============================================================================

const SEVERITY_COLORS: Record<string, string> = {
  Extreme: 'rgba(239, 68, 68, 0.7)',
  Severe: 'rgba(249, 115, 22, 0.6)',
  Moderate: 'rgba(234, 179, 8, 0.5)',
  Minor: 'rgba(59, 130, 246, 0.5)',
  Unknown: 'rgba(255, 255, 255, 0.2)',
}

// ============================================================================
// Animation config
// ============================================================================

const EASE_EXPO_OUT = [0.22, 1, 0.36, 1] as const

// ============================================================================
// Feed item row
// ============================================================================

function FeedItemRow({
  item,
  onNavigate,
}: {
  item: PriorityFeedItem
  onNavigate: (item: PriorityFeedItem) => void
}) {
  const catMeta = getCategoryMeta(item.category)

  return (
    <button
      type="button"
      onClick={() => onNavigate(item)}
      className="focus-visible:outline focus-visible:outline-1 focus-visible:outline-[rgba(255,255,255,0.15)] focus-visible:-outline-offset-1"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        minHeight: 40,
        width: '100%',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono, monospace)',
        textAlign: 'left',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <PriorityBadge priority={item.operationalPriority} size="sm" />

      {/* Severity dot */}
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: SEVERITY_COLORS[item.severity] ?? SEVERITY_COLORS.Unknown,
          flexShrink: 0,
        }}
      />

      {/* Title */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 400,
          color: 'rgba(255, 255, 255, 0.30)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
          flex: 1,
          minWidth: 0,
        }}
      >
        {item.title}
      </span>

      {/* Category short name */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 500,
          color: catMeta.color,
          opacity: 0.6,
          letterSpacing: '0.06em',
          flexShrink: 0,
        }}
      >
        {catMeta.shortName}
      </span>

      {/* Time-ago */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 400,
          color: 'rgba(255, 255, 255, 0.15)',
          letterSpacing: '0.04em',
          flexShrink: 0,
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {relativeTimeAgo(item.ingestedAt)}
      </span>
    </button>
  )
}

// ============================================================================
// P1/P2 group separator
// ============================================================================

function GroupSeparator() {
  return (
    <div
      style={{
        height: 1,
        background: 'rgba(255, 255, 255, 0.04)',
        margin: '4px 16px',
      }}
    />
  )
}

// ============================================================================
// Component
// ============================================================================

export function PriorityFeedPanel() {
  const isExpanded = useCoverageStore((s) => s.priorityFeedExpanded)
  const setPriorityFeedExpanded = useCoverageStore((s) => s.setPriorityFeedExpanded)
  const setDistrictPreselectedAlertId = useCoverageStore((s) => s.setDistrictPreselectedAlertId)
  const startMorph = useUIStore((s) => s.startMorph)
  const morphPhase = useUIStore((s) => s.morph.phase)

  const { data, isLoading, isError } = usePriorityFeed()
  useRelativeTimeTick()

  const panelRef = useRef<HTMLDivElement>(null)

  // Auto-close when morph leaves idle
  useEffect(() => {
    if (morphPhase !== 'idle' && isExpanded) {
      setPriorityFeedExpanded(false)
    }
  }, [morphPhase, isExpanded, setPriorityFeedExpanded])

  // Focus panel on open
  useEffect(() => {
    if (isExpanded && panelRef.current) {
      const firstFocusable = panelRef.current.querySelector<HTMLElement>('button')
      firstFocusable?.focus()
    }
  }, [isExpanded])

  const handleClose = useCallback(() => {
    setPriorityFeedExpanded(false)
  }, [setPriorityFeedExpanded])

  const handleNavigate = useCallback(
    (item: PriorityFeedItem) => {
      setDistrictPreselectedAlertId(item.id)
      setPriorityFeedExpanded(false)
      startMorph(item.category)
    },
    [setDistrictPreselectedAlertId, setPriorityFeedExpanded, startMorph],
  )

  const p1Count = data?.p1Count ?? 0
  const p2Count = data?.p2Count ?? 0
  const items = data?.items ?? []

  // Detect reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const transitionDuration = prefersReducedMotion ? 0 : undefined

  return (
    <AnimatePresence>
      {isExpanded && (
        <>
          {/* Backdrop */}
          <motion.div
            key="priority-feed-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration ?? 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 34,
              background: 'rgba(0, 0, 0, 0.3)',
            }}
          />

          {/* Panel */}
          <motion.div
            key="priority-feed-panel"
            ref={panelRef}
            role="dialog"
            aria-label="Priority feed"
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{
              duration: transitionDuration ?? 0.25,
              ease: EASE_EXPO_OUT,
            }}
            style={{
              position: 'fixed',
              top: 56,
              right: 24,
              zIndex: 35,
              width: 400,
              maxHeight: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(10, 14, 24, 0.94)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 16px 12px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.3)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  PRIORITY FEED
                </div>
                {!isLoading && !isError && (
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 400,
                      color: 'rgba(255, 255, 255, 0.15)',
                      letterSpacing: '0.04em',
                      marginTop: 4,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    P1: {p1Count} / P2: {p2Count}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close priority feed"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 6,
                  background: 'transparent',
                  color: 'rgba(255, 255, 255, 0.25)',
                  cursor: 'pointer',
                  transition: 'color 150ms ease, background 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.25)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Separator */}
            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.06)' }} />

            {/* Content area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 0',
              }}
            >
              {isLoading && !data ? (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.10)',
                    letterSpacing: '0.04em',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                >
                  LOADING...
                </div>
              ) : isError ? (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.10)',
                    letterSpacing: '0.04em',
                  }}
                >
                  FEED UNAVAILABLE
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.15)',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase' as const,
                    }}
                  >
                    ALL CLEAR
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'rgba(255, 255, 255, 0.08)',
                      marginTop: 8,
                    }}
                  >
                    No priority alerts at this time.
                  </div>
                </div>
              ) : (
                items.map((item, idx) => {
                  // Render separator between P1 and P2 groups
                  const showSeparator =
                    idx > 0 &&
                    items[idx - 1].operationalPriority === 'P1' &&
                    item.operationalPriority === 'P2'

                  return (
                    <div key={item.id}>
                      {showSeparator && <GroupSeparator />}
                      <FeedItemRow item={item} onNavigate={handleNavigate} />
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer: item count when list is non-empty */}
            {items.length > 0 && (
              <>
                <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.04)' }} />
                <div
                  style={{
                    padding: '8px 16px',
                    fontSize: 9,
                    color: 'rgba(255, 255, 255, 0.10)',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {items.length} {items.length === 1 ? 'alert' : 'alerts'}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
