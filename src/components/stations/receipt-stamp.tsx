'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { ReceiptStampState } from './use-receipt-stamp'
import './station-panel.css'

// ============================================================================
// Props
// ============================================================================

export interface ReceiptStampProps {
  /** Current stamp state from useReceiptStamp(). */
  readonly state: ReceiptStampState
}

// ============================================================================
// Component
// ============================================================================

/**
 * Receipt stamp overlay.
 *
 * Renders a brief readout when a station action is executed:
 * `ACTION OK / TRACE: 7F2A / 2026-02-25T15:42:18Z`
 *
 * Typography follows VISUAL-DESIGN-SPEC.md Section 3.4:
 * - Font: Geist Mono, 10px, 500 weight, 0.12em tracking, uppercase
 * - Trace ID in --color-ember-glow (brightest)
 * - Separators at 0.35 opacity
 * - Timestamp in --color-text-secondary at 0.6 opacity
 *
 * Animation: fade-in from opacity 0 + translateY(4px), hold 1400ms, fade-out.
 * Total visibility: 2000ms (matches useReceiptStamp auto-hide timer).
 */
export function ReceiptStamp({ state }: ReceiptStampProps) {
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <AnimatePresence>
      {state.isVisible && state.traceId && (
        <motion.div
          className="receipt-stamp-overlay pointer-events-none absolute right-0 bottom-3 left-0 flex items-center justify-center"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -2 }}
          transition={{
            duration: reducedMotion ? 0 : 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Result label */}
          <span>ACTION OK</span>

          {/* Separator */}
          <span className="separator">/</span>

          {/* Trace ID (brightest) */}
          <span className="trace-id">TRACE: {state.traceId}</span>

          {/* Separator */}
          <span className="separator">/</span>

          {/* Timestamp (most muted) */}
          <span className="timestamp">{formatStampTime(state.timestamp)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Helpers
// ============================================================================

/** Format an ISO timestamp to a compact HH:MM:SS display. */
function formatStampTime(iso: string | null): string {
  if (!iso) return '--:--:--'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return '--:--:--'
  }
}
