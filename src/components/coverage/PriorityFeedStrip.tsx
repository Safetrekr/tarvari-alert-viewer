'use client'

/**
 * PriorityFeedStrip -- persistent world-space P1/P2 summary bar.
 *
 * Displays at-a-glance P1/P2 alert posture above the map toolbar.
 * Clicking toggles the PriorityFeedPanel (WS-2.3).
 *
 * Four visual states: Active (P1>0), Elevated (P2>0), ALL CLEAR, Loading.
 *
 * @module PriorityFeedStrip
 * @see WS-2.2
 */

import { useCallback, useMemo } from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { usePriorityFeed } from '@/hooks/use-priority-feed'
import { useCoverageStore } from '@/stores/coverage.store'
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
import { relativeTimeAgo, useRelativeTimeTick } from '@/lib/time-utils'

// ============================================================================
// Severity color map (matches map-utils.ts, FeedPanel, ActivityTicker)
// ============================================================================

const SEVERITY_COLORS: Record<string, string> = {
  Extreme: 'rgba(239, 68, 68, 0.7)',
  Severe: 'rgba(249, 115, 22, 0.6)',
  Moderate: 'rgba(234, 179, 8, 0.5)',
  Minor: 'rgba(59, 130, 246, 0.5)',
  Unknown: 'rgba(255, 255, 255, 0.2)',
}

// ============================================================================
// Animation styles (React 19 <style> deduplication)
// ============================================================================

const STRIP_STYLES = `
@keyframes priority-feed-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
@keyframes priority-strip-shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}
@media (prefers-reduced-motion: reduce) {
  .priority-feed-pulse,
  .priority-strip-shimmer {
    animation: none !important;
  }
}
`

// ============================================================================
// Props
// ============================================================================

export interface PriorityFeedStripProps {
  className?: string
}

// ============================================================================
// Separator
// ============================================================================

function Separator() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: 'rgba(var(--ambient-ink-rgb), 0.08)',
        flexShrink: 0,
      }}
    />
  )
}

// ============================================================================
// Component
// ============================================================================

export function PriorityFeedStrip({ className }: PriorityFeedStripProps) {
  const { data, isLoading } = usePriorityFeed()
  const priorityFeedExpanded = useCoverageStore((s) => s.priorityFeedExpanded)
  const setPriorityFeedExpanded = useCoverageStore((s) => s.setPriorityFeedExpanded)

  // Force time-ago re-render every 30s
  useRelativeTimeTick()

  const handleClick = useCallback(() => {
    setPriorityFeedExpanded(!priorityFeedExpanded)
  }, [setPriorityFeedExpanded, priorityFeedExpanded])

  const p1Count = data?.p1Count ?? 0
  const p2Count = data?.p2Count ?? 0
  const mostRecentItem = data?.mostRecentP1 ?? data?.mostRecentP2 ?? null

  type VisualState = 'loading' | 'active' | 'elevated' | 'clear'
  const visualState: VisualState = isLoading && !data
    ? 'loading'
    : p1Count > 0
      ? 'active'
      : p2Count > 0
        ? 'elevated'
        : 'clear'

  const ariaLabel = useMemo(() => {
    const expandedSuffix = priorityFeedExpanded ? ' (expanded)' : ''
    if (visualState === 'loading') return `Priority feed: Loading...${expandedSuffix}`
    if (visualState === 'clear') return `Priority feed: All clear, no priority alerts. Click to expand.${expandedSuffix}`
    const titlePart = mostRecentItem ? ` Most recent: ${mostRecentItem.title}.` : ''
    return `Priority feed: ${p1Count} P1 alerts, ${p2Count} P2 alerts.${titlePart} Click to ${priorityFeedExpanded ? 'collapse' : 'expand'}.${expandedSuffix}`
  }, [visualState, p1Count, p2Count, mostRecentItem, priorityFeedExpanded])

  return (
    <>
      <style>{STRIP_STYLES}</style>
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-expanded={priorityFeedExpanded}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 40,
          width: '100%',
          borderRadius: 12,
          border: `1px solid ${
            visualState === 'active'
              ? 'rgba(239, 68, 68, 0.25)'
              : visualState === 'elevated'
                ? 'rgba(249, 115, 22, 0.2)'
                : 'rgba(var(--ambient-ink-rgb), 0.05)'
          }`,
          background: `${
            visualState === 'active'
              ? 'rgba(239, 68, 68, 0.06)'
              : visualState === 'elevated'
                ? 'rgba(249, 115, 22, 0.04)'
                : 'rgba(var(--ambient-ink-rgb), 0.02)'
          }`,
          backdropFilter: 'blur(12px) saturate(120%)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono, monospace)',
          transition: 'border-color 200ms ease, background 200ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = visualState === 'active'
            ? 'rgba(239, 68, 68, 0.35)'
            : visualState === 'elevated'
              ? 'rgba(249, 115, 22, 0.3)'
              : 'rgba(var(--ambient-ink-rgb), 0.12)'
          e.currentTarget.style.background = visualState === 'active'
            ? 'rgba(239, 68, 68, 0.10)'
            : visualState === 'elevated'
              ? 'rgba(249, 115, 22, 0.07)'
              : 'rgba(var(--ambient-ink-rgb), 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = visualState === 'active'
            ? 'rgba(239, 68, 68, 0.25)'
            : visualState === 'elevated'
              ? 'rgba(249, 115, 22, 0.2)'
              : 'rgba(var(--ambient-ink-rgb), 0.05)'
          e.currentTarget.style.background = visualState === 'active'
            ? 'rgba(239, 68, 68, 0.06)'
            : visualState === 'elevated'
              ? 'rgba(249, 115, 22, 0.04)'
              : 'rgba(var(--ambient-ink-rgb), 0.02)'
        }}
      >
        {/* Screen reader live region for count changes */}
        <span className="sr-only" role="status" aria-live="polite">
          {visualState === 'clear'
            ? 'No priority alerts, all clear'
            : visualState === 'loading'
              ? 'Loading priority alerts'
              : `${p1Count} priority 1 alerts, ${p2Count} priority 2 alerts`}
        </span>

        {visualState === 'clear' ? (
          /* ALL CLEAR state */
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              color: 'rgba(255, 255, 255, 0.15)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
            }}
          >
            <Check size={12} aria-hidden="true" />
            ALL CLEAR
          </span>
        ) : (
          <>
            {/* P1 Zone */}
            <span
              className={visualState === 'active' ? 'priority-feed-pulse' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
                ...(visualState === 'active'
                  ? { animation: 'priority-feed-pulse 2.5s ease-in-out infinite' }
                  : {}),
              }}
            >
              <PriorityBadge priority="P1" size="sm" />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: `rgba(255, 255, 255, ${p1Count > 0 ? 0.55 : 0.15})`,
                  letterSpacing: '0.06em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {visualState === 'loading' ? '--' : p1Count}
              </span>
            </span>

            <Separator />

            {/* P2 Zone */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              <PriorityBadge priority="P2" size="sm" />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: `rgba(255, 255, 255, ${p2Count > 0 ? 0.35 : 0.15})`,
                  letterSpacing: '0.06em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {visualState === 'loading' ? '--' : p2Count}
              </span>
            </span>

            <Separator />

            {/* Latest alert zone */}
            {visualState === 'loading' ? (
              <span
                className="priority-strip-shimmer"
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 4,
                  background:
                    'linear-gradient(90deg, rgba(var(--ambient-ink-rgb), 0.04) 25%, rgba(var(--ambient-ink-rgb), 0.08) 50%, rgba(var(--ambient-ink-rgb), 0.04) 75%)',
                  backgroundSize: '200px 100%',
                  animation: 'priority-strip-shimmer 1.5s infinite',
                }}
              />
            ) : mostRecentItem ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {/* Severity color dot */}
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: SEVERITY_COLORS[mostRecentItem.severity] ?? SEVERITY_COLORS.Unknown,
                    flexShrink: 0,
                  }}
                />
                {/* Truncated title */}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.45)',
                    letterSpacing: '0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {mostRecentItem.title}
                </span>
                {/* Time-ago */}
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 400,
                    color: 'rgba(255, 255, 255, 0.25)',
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                  }}
                >
                  {relativeTimeAgo(mostRecentItem.ingestedAt)}
                </span>
              </span>
            ) : (
              <span style={{ flex: 1 }} />
            )}
          </>
        )}

        {/* Chevron indicator */}
        <ChevronDown
          size={12}
          aria-hidden="true"
          style={{
            color: 'rgba(255, 255, 255, 0.20)',
            transition: 'transform 200ms ease',
            transform: priorityFeedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>
    </>
  )
}
