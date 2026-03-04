/**
 * TarvaCORE district types.
 *
 * TarvaCORE is an Electron desktop app with no HTTP API.
 * Health is determined via TCP port check on port 11435.
 * These types extend the generic AppTelemetry with TarvaCORE-specific
 * connection metadata derived from the WS-1.5 telemetry aggregator.
 *
 * References:
 * - Gap #7 (TarvaCORE TCP health)
 * - TARVA-SYSTEM-OVERVIEW.md (Electron app, port 11435)
 * - WS-2.5 Section 4.4
 */

import type { AppStatus } from '@/lib/telemetry-types'

// ============================================================================
// Connection Info
// ============================================================================

/** TarvaCORE connection metadata derived from TCP health checks. */
export interface CoreConnectionInfo {
  /** Current health state from TCP port check. */
  readonly status: AppStatus
  /** Timestamp of the last successful TCP connection (ISO 8601). */
  readonly lastSuccessfulContact: string | null
  /** Derived uptime in seconds (null if never connected). */
  readonly uptimeSeconds: number | null
  /** TCP port being checked. */
  readonly port: number
  /** Whether TarvaCORE has ever responded during this Launch session. */
  readonly hasEverConnected: boolean
}

// ============================================================================
// Sessions (Stub)
// ============================================================================

/** Stub shape for future reasoning session data. */
export interface CoreSessionSummary {
  /** Placeholder -- no data until TarvaCORE exposes session API. */
  readonly available: false
  /** Explanatory message for the stub station. */
  readonly message: string
}
