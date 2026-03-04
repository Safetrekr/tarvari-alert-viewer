'use client'

/**
 * CodeStatusStation -- Permanent UNKNOWN placeholder for the tarvaCODE district.
 *
 * tarvaCODE is a planning-stage application with no runtime. This station
 * renders permanently in UNKNOWN state with a "Coming Soon" badge,
 * description text, and a list of planned capabilities.
 *
 * This is a static component with no dynamic props or telemetry dependency.
 * The parent district wraps it in a StationPanel.
 *
 * @module code-status-station
 * @see WS-2.5 Section 4.10
 */

import { TARVA_CODE_STUB } from '@/lib/tarva-code-types'

// ============================================================================
// Types
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CodeStatusStationProps {
  /** No dynamic props -- this is a static placeholder. */
}

// ============================================================================
// Component
// ============================================================================

export function CodeStatusStation(_props: CodeStatusStationProps) {
  return (
    <div className="flex flex-col py-4">
      {/* UNKNOWN badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full border border-dashed border-[var(--color-offline)] bg-transparent" />
        <span className="font-sans text-[11px] font-medium tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
          Coming Soon
        </span>
      </div>

      {/* Description */}
      <p className="mb-4 font-sans text-[13px] leading-relaxed text-[var(--color-text-secondary)] opacity-60">
        {TARVA_CODE_STUB.description}
      </p>

      {/* Planned capabilities */}
      <div className="flex flex-col gap-2">
        <span className="font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase opacity-40">
          Planned
        </span>
        <ul className="flex flex-col gap-1.5">
          {TARVA_CODE_STUB.plannedCapabilities.map((cap) => (
            <li
              key={cap}
              className="flex items-start gap-2 text-[12px] text-[var(--color-text-tertiary)] opacity-50"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-text-ghost)]" />
              <span className="font-sans leading-relaxed">{cap}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
