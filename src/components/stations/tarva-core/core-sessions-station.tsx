'use client'

/**
 * CoreSessionsStation -- Stub placeholder for future reasoning sessions.
 *
 * TarvaCORE does not yet expose a reasoning session API. This station
 * renders in a dormant visual state with explanatory text indicating
 * what will appear here once the API becomes available.
 *
 * This is a static component with no dynamic props or telemetry
 * dependency. The parent district wraps it in a StationPanel.
 *
 * @module core-sessions-station
 * @see WS-2.5 Section 4.5
 */

import { Brain } from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CoreSessionsStationProps {
  /** No props required -- this is a static stub. */
}

// ============================================================================
// Component
// ============================================================================

export function CoreSessionsStation(_props: CoreSessionsStationProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-8 opacity-40">
      {/* Dormant icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.03] bg-white/[0.02]">
        <Brain className="h-5 w-5 text-[var(--color-text-ghost)]" />
      </div>

      <span className="mb-2 font-sans text-[13px] font-medium text-[var(--color-text-secondary)]">
        Reasoning Sessions
      </span>
      <p className="max-w-[200px] text-center font-sans text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">
        Session tracking will appear here when TarvaCORE exposes its reasoning session API.
      </p>
    </div>
  )
}
