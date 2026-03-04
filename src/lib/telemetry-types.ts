/**
 * Telemetry pipeline type definitions.
 *
 * Shared between the server-side aggregator route handler,
 * the client-side TanStack Query hook, the Zustand districts store,
 * and all telemetry display components.
 *
 * @module telemetry-types
 * @see WS-1.5
 */

// ---------------------------------------------------------------------------
// Health model
// ---------------------------------------------------------------------------

/** 5-state health model for monitored applications. */
export type AppStatus =
  | 'OPERATIONAL'
  | 'DEGRADED'
  | 'DOWN'
  | 'OFFLINE'
  | 'UNKNOWN'

// ---------------------------------------------------------------------------
// Health check response
// ---------------------------------------------------------------------------

/** Shape expected from each app's /api/health endpoint. */
export interface HealthCheckResponse {
  status: string
  uptime?: number
  version?: string
  checks?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Per-app telemetry
// ---------------------------------------------------------------------------

/** Per-app telemetry record maintained by the aggregator. */
export interface AppTelemetry {
  id: string
  name: string
  status: AppStatus
  lastSuccessfulContact: string | null
  lastCheckAt: string
  hasBeenContacted: boolean
  uptime: number | null
  version: string | null
  checks: Record<string, unknown>
  alertCount: number
  responseTimeMs: number | null
  /** Rolling history maintained client-side (not populated server-side). */
  responseTimeHistory: number[]
}

// ---------------------------------------------------------------------------
// System snapshot
// ---------------------------------------------------------------------------

/** Aggregated snapshot returned by GET /api/telemetry. */
export interface SystemSnapshot {
  timestamp: string
  apps: Record<string, AppTelemetry>
  summary: {
    total: number
    operational: number
    degraded: number
    down: number
    offline: number
    unknown: number
  }
}

// ---------------------------------------------------------------------------
// App configuration
// ---------------------------------------------------------------------------

/** Configuration for a single monitored app. */
export interface TelemetryAppConfig {
  id: string
  name: string
  port: number | null
  healthPath: string
  checkType: 'http' | 'tcp' | 'stub'
}
