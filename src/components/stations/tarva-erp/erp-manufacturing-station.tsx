'use client'

/**
 * ErpManufacturingStation -- Module health grid for the TarvaERP district.
 *
 * Renders TarvaERP's 5 manufacturing modules (Inventory, Production,
 * Procurement, Quality, Warehouse) as a compact status grid. Each row
 * displays a health dot, module name, and page count.
 *
 * When TarvaERP is offline, the entire grid renders in a dormant state
 * with explanatory text.
 *
 * This component renders station body content. The parent district wraps it
 * in a StationPanel for the 3-zone layout (header/body/actions).
 *
 * @module erp-manufacturing-station
 * @see WS-2.5 Section 4.8
 */

import { useMemo } from 'react'
import { Factory } from 'lucide-react'
import { Skeleton } from '@tarva/ui'
import { cn } from '@/lib/utils'
import type { AppTelemetry } from '@/lib/telemetry-types'
import type { AppStatus } from '@/lib/telemetry-types'
import { ERP_MODULES, type ErpModuleStatus } from '@/lib/tarva-erp-types'

// ============================================================================
// Types
// ============================================================================

export interface ErpManufacturingStationProps {
  /** Telemetry data for TarvaERP. */
  readonly telemetry: AppTelemetry | null
  /** Whether telemetry data is still loading. */
  readonly isLoading: boolean
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Derive per-module health status from AppTelemetry checks field.
 * Each module's status is determined by its corresponding key
 * in the telemetry checks record.
 */
function deriveModuleStatuses(telemetry: AppTelemetry): ErpModuleStatus[] {
  return ERP_MODULES.map((mod) => ({
    ...mod,
    status: telemetry.checks?.[mod.id]
      ? String(telemetry.checks[mod.id]) === 'ok' ||
        String(telemetry.checks[mod.id]) === 'healthy' ||
        String(telemetry.checks[mod.id]) === 'operational'
        ? ('OPERATIONAL' as const)
        : ('DEGRADED' as const)
      : ('UNKNOWN' as const),
  }))
}

// ============================================================================
// Status Color Map
// ============================================================================

const DOT_COLOR_MAP: Record<AppStatus, string> = {
  OPERATIONAL: 'bg-[var(--color-healthy)]',
  DEGRADED: 'bg-[var(--color-warning)]',
  DOWN: 'bg-[var(--color-error)]',
  OFFLINE: 'bg-[var(--color-offline)]',
  UNKNOWN: 'bg-[var(--color-offline)]',
}

// ============================================================================
// Sub-Components
// ============================================================================

function ModuleRow({ module }: { module: ErpModuleStatus }) {
  const dotColor = DOT_COLOR_MAP[module.status]

  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors duration-150 hover:bg-white/[0.02]">
      {/* Health dot */}
      <span
        className={cn('h-2 w-2 shrink-0 rounded-full', dotColor)}
        role="img"
        aria-label={`${module.displayName}: ${module.status.toLowerCase()}`}
      />

      {/* Module name */}
      <span className="flex-1 font-sans text-[13px] font-medium text-[var(--color-text-primary)] opacity-85">
        {module.displayName}
      </span>

      {/* Page count */}
      <span
        className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums"
        style={{ fontFeatureSettings: '"tnum" 1' }}
      >
        {module.pageCount} pg
      </span>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function ErpManufacturingStation({ telemetry, isLoading }: ErpManufacturingStationProps) {
  const modules = useMemo<ErpModuleStatus[]>(
    () => (telemetry ? deriveModuleStatuses(telemetry) : []),
    [telemetry]
  )

  const isOffline =
    !telemetry ||
    telemetry.status === 'OFFLINE' ||
    telemetry.status === 'UNKNOWN'

  // Loading state
  if (isLoading && !telemetry) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  // Offline state -- dormant placeholder
  if (isOffline) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-8 opacity-40">
        <Factory className="mb-4 h-5 w-5 text-[var(--color-text-ghost)]" />
        <p className="max-w-[200px] text-center font-sans text-[12px] leading-relaxed text-[var(--color-text-tertiary)]">
          Module status will appear when TarvaERP is running.
        </p>
      </div>
    )
  }

  // Online state -- module health grid
  return (
    <div className="flex flex-col gap-1">
      {/* Summary header */}
      <div className="mb-2 flex items-center justify-between px-3">
        <span className="font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase opacity-50">
          Module Health
        </span>
        <span
          className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums opacity-60"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {modules.filter((m) => m.status === 'OPERATIONAL').length}/{modules.length} healthy
        </span>
      </div>

      {/* Module rows */}
      {modules.map((mod) => (
        <ModuleRow key={mod.id} module={mod} />
      ))}
    </div>
  )
}
