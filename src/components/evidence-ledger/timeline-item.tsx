/**
 * TimelineItem -- Single receipt row in the timeline list.
 *
 * Displays: timestamp, type icon, severity dot, summary text,
 * source badge, and actor badge. Clickable to expand and show
 * the full receipt detail.
 *
 * @module timeline-item
 * @see WS-3.2 Section 4
 */

'use client'

import { useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Compass,
  Zap,
  AlertTriangle,
  CheckCircle,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LaunchReceipt } from '@/lib/interfaces/receipt-store'
import { formatReceiptTime, getSourceLabel } from '@/hooks/use-receipt-timeline'
import { ReceiptDetailPanel } from './receipt-detail-panel'
import './evidence-ledger.css'

// ============================================================================
// Constants
// ============================================================================

const EVENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  navigation: Compass,
  action: Zap,
  error: AlertTriangle,
  approval: CheckCircle,
  system: Settings,
}

// ============================================================================
// Props
// ============================================================================

export interface TimelineItemProps {
  /** The receipt to display. */
  readonly receipt: LaunchReceipt
  /** Callback when the user clicks Rehydrate. */
  readonly onRehydrate?: (receipt: LaunchReceipt) => void
}

// ============================================================================
// Component
// ============================================================================

export function TimelineItem({ receipt, onRehydrate }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false)

  const Icon = EVENT_TYPE_ICONS[receipt.eventType] ?? Settings

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setExpanded((prev) => !prev)
      }
    },
    [],
  )

  return (
    <div>
      <div
        className={cn('timeline-item', expanded && 'timeline-item--expanded')}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`Receipt: ${receipt.summary}`}
      >
        {/* Type icon */}
        <div className={cn('timeline-item-icon', `timeline-item-icon--${receipt.eventType}`)}>
          <Icon className="h-3.5 w-3.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="timeline-item-summary truncate">{receipt.summary}</p>

          <div className="timeline-item-meta">
            {/* Severity dot */}
            <span
              className={cn('severity-dot', `severity-dot--${receipt.severity}`)}
              title={receipt.severity}
            />

            {/* Timestamp */}
            <span className="timeline-item-timestamp">
              {formatReceiptTime(receipt.timestamp)}
            </span>

            {/* Source badge */}
            <span className="timeline-item-source">
              {getSourceLabel(receipt.source)}
            </span>

            {/* Actor badge */}
            <span className={cn('actor-badge', `actor-badge--${receipt.actor}`)}>
              {receipt.actor}
            </span>
          </div>
        </div>

        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 self-center opacity-30"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <ReceiptDetailPanel receipt={receipt} onRehydrate={onRehydrate} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
