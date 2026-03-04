/**
 * Telemetry aggregator configuration.
 *
 * Contains the app registry (all 6 Tarva apps), polling intervals,
 * and display constants consumed by the client-side hook and components.
 *
 * @module telemetry-config
 * @see WS-1.5
 */

import type { TelemetryAppConfig } from './telemetry-types'

// ---------------------------------------------------------------------------
// App registry
// ---------------------------------------------------------------------------

/**
 * Registry of all 6 Tarva apps monitored by the telemetry aggregator.
 *
 * Ports use CLAUDE.md canonical values:
 * - Agent Builder: 3000   (HTTP check)
 * - Tarva Chat: 4000      (HTTP check)
 * - Project Room: 3005    (HTTP check)
 * - TarvaCORE: 11435      (TCP check, Electron app)
 * - TarvaERP: null        (stub, desktop app - always OFFLINE)
 * - tarvaCODE: null        (stub, planning-only repo - always OFFLINE)
 */
export const TELEMETRY_APPS: TelemetryAppConfig[] = [
  {
    id: 'agent-builder',
    name: 'Agent Builder',
    port: 3000,
    healthPath: '/api/health',
    checkType: 'http',
  },
  {
    id: 'tarva-chat',
    name: 'Tarva Chat',
    port: 4000,
    healthPath: '/api/health',
    checkType: 'http',
  },
  {
    id: 'project-room',
    name: 'Project Room',
    port: 3005,
    healthPath: '/api/health',
    checkType: 'http',
  },
  {
    id: 'tarva-core',
    name: 'TarvaCORE',
    port: 11435,
    healthPath: '',
    checkType: 'tcp',
  },
  {
    id: 'tarva-erp',
    name: 'TarvaERP',
    port: null,
    healthPath: '',
    checkType: 'stub',
  },
  {
    id: 'tarva-code',
    name: 'tarvaCODE',
    port: null,
    healthPath: '',
    checkType: 'stub',
  },
]

// ---------------------------------------------------------------------------
// Polling configuration
// ---------------------------------------------------------------------------

/** Health check timeout in milliseconds. */
export const HEALTH_CHECK_TIMEOUT_MS = 3000

/** Adaptive polling intervals (milliseconds). */
export const POLLING_INTERVALS = {
  /** Default polling interval. */
  normal: 15_000,
  /** Tightened interval when any app is DEGRADED or DOWN. */
  alert: 5_000,
  /** Relaxed interval after consecutive stable cycles. */
  relaxed: 30_000,
  /** Number of consecutive stable cycles before relaxing. */
  stableCyclesThreshold: 5,
} as const

// ---------------------------------------------------------------------------
// Display constants
// ---------------------------------------------------------------------------

/** Maximum sparkline data points to retain in client-side history. */
export const SPARKLINE_HISTORY_LENGTH = 30
