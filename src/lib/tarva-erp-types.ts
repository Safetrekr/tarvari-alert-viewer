/**
 * TarvaERP district types.
 *
 * TarvaERP is a manufacturing ERP frontend with 5 modules and 52 pages.
 * Health comes from HTTP checks against localhost:3010/api/health.
 * The Manufacturing Dashboard station renders per-module health indicators.
 *
 * References:
 * - Gap #6 (TarvaERP as full capsule)
 * - TARVA-SYSTEM-OVERVIEW.md (5 modules, 52 pages, AG Grid tables)
 * - WS-2.5 Section 4.7-4.8
 */

import type { AppStatus } from '@/lib/telemetry-types'

// ============================================================================
// Module Identity
// ============================================================================

/** ERP module identifiers matching TarvaERP's 5-module structure. */
export type ErpModuleId =
  | 'inventory'
  | 'production'
  | 'procurement'
  | 'quality'
  | 'warehouse'

// ============================================================================
// Module Status
// ============================================================================

/** Per-module health status within TarvaERP. */
export interface ErpModuleStatus {
  /** Module identifier. */
  readonly id: ErpModuleId
  /** Human-readable module name. */
  readonly displayName: string
  /** Health derived from /api/health checks sub-field, or UNKNOWN if not reported. */
  readonly status: AppStatus
  /** Number of pages in this module (static metadata). */
  readonly pageCount: number
}

// ============================================================================
// Module Registry
// ============================================================================

/** Static metadata for the 5 ERP modules. */
export const ERP_MODULES: readonly Omit<ErpModuleStatus, 'status'>[] = [
  { id: 'inventory', displayName: 'Inventory', pageCount: 12 },
  { id: 'production', displayName: 'Production', pageCount: 10 },
  { id: 'procurement', displayName: 'Procurement', pageCount: 11 },
  { id: 'quality', displayName: 'Quality', pageCount: 9 },
  { id: 'warehouse', displayName: 'Warehouse', pageCount: 10 },
] as const

// ============================================================================
// Health Detail
// ============================================================================

/** Extended health data specific to TarvaERP. */
export interface ErpHealthDetail {
  /** Overall app status. */
  readonly status: AppStatus
  /** App version string from /api/health response. */
  readonly version: string | null
  /** Uptime in seconds from /api/health response. */
  readonly uptimeSeconds: number | null
  /** Per-module check results from /api/health checks field. */
  readonly modules: readonly ErpModuleStatus[]
}
