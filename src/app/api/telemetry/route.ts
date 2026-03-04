/**
 * GET /api/telemetry -- Server-side health aggregator.
 *
 * Checks all 6 Tarva apps in parallel and returns a SystemSnapshot
 * with per-app telemetry and a summary count.
 *
 * Check strategies:
 * - HTTP: fetch to localhost:{port}{healthPath} with AbortController timeout
 * - TCP:  net.createConnection to localhost:{port}
 * - Stub: always returns OFFLINE (desktop / planning-only apps)
 *
 * @module telemetry-route
 * @see WS-1.5
 */

import { createConnection, type Socket } from 'net'
import { NextResponse } from 'next/server'

import { TELEMETRY_APPS, HEALTH_CHECK_TIMEOUT_MS } from '@/lib/telemetry-config'
import type {
  AppStatus,
  AppTelemetry,
  HealthCheckResponse,
  SystemSnapshot,
  TelemetryAppConfig,
} from '@/lib/telemetry-types'

// ---------------------------------------------------------------------------
// In-memory contact history
// ---------------------------------------------------------------------------

/**
 * Tracks whether each app has ever been successfully contacted.
 * Used to distinguish OFFLINE (never contacted) from DOWN (was previously reachable).
 */
const contactHistory = new Map<string, boolean>()

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

/** Validates that a parsed JSON body matches the expected HealthCheckResponse shape. */
function isValidHealthResponse(body: unknown): body is HealthCheckResponse {
  if (typeof body !== 'object' || body === null) return false
  const obj = body as Record<string, unknown>
  return typeof obj.status === 'string'
}

// ---------------------------------------------------------------------------
// Status resolution
// ---------------------------------------------------------------------------

/**
 * Determines the AppStatus for an unreachable app.
 * - If the app has been contacted before -> DOWN
 * - If the app has never been contacted  -> OFFLINE
 */
function resolveStatus(appId: string, reachable: boolean, healthStatus?: string): AppStatus {
  if (reachable) {
    contactHistory.set(appId, true)

    if (!healthStatus) return 'UNKNOWN'

    const normalized = healthStatus.toLowerCase()
    if (normalized === 'ok' || normalized === 'healthy' || normalized === 'operational') {
      return 'OPERATIONAL'
    }
    if (normalized === 'degraded' || normalized === 'warning') {
      return 'DEGRADED'
    }
    if (normalized === 'error' || normalized === 'critical' || normalized === 'down') {
      return 'DOWN'
    }

    return 'UNKNOWN'
  }

  // Unreachable
  const wasContacted = contactHistory.get(appId) ?? false
  return wasContacted ? 'DOWN' : 'OFFLINE'
}

// ---------------------------------------------------------------------------
// Check functions
// ---------------------------------------------------------------------------

interface CheckResult {
  reachable: boolean
  status: AppStatus
  responseTimeMs: number | null
  uptime: number | null
  version: string | null
  checks: Record<string, unknown>
}

/** HTTP health check: fetch localhost:{port}{healthPath} with timeout. */
async function checkHttp(config: TelemetryAppConfig): Promise<CheckResult> {
  const url = `http://localhost:${config.port}${config.healthPath}`
  const start = performance.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    clearTimeout(timeoutId)
    const elapsed = performance.now() - start

    if (!response.ok) {
      return {
        reachable: true,
        status: resolveStatus(config.id, true, 'degraded'),
        responseTimeMs: elapsed,
        uptime: null,
        version: null,
        checks: {},
      }
    }

    const body: unknown = await response.json()

    if (!isValidHealthResponse(body)) {
      return {
        reachable: true,
        status: resolveStatus(config.id, true),
        responseTimeMs: elapsed,
        uptime: null,
        version: null,
        checks: {},
      }
    }

    return {
      reachable: true,
      status: resolveStatus(config.id, true, body.status),
      responseTimeMs: elapsed,
      uptime: body.uptime ?? null,
      version: body.version ?? null,
      checks: body.checks ?? {},
    }
  } catch {
    const elapsed = performance.now() - start
    return {
      reachable: false,
      status: resolveStatus(config.id, false),
      responseTimeMs: elapsed,
      uptime: null,
      version: null,
      checks: {},
    }
  }
}

/** TCP health check: attempt a connection to localhost:{port}. */
async function checkTcp(config: TelemetryAppConfig): Promise<CheckResult> {
  if (config.port === null) {
    return {
      reachable: false,
      status: 'OFFLINE',
      responseTimeMs: null,
      uptime: null,
      version: null,
      checks: {},
    }
  }

  const port = config.port
  const start = performance.now()

  return new Promise<CheckResult>((resolve) => {
    let settled = false

    const settle = (result: CheckResult) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    const socket: Socket = createConnection({ host: 'localhost', port }, () => {
      const elapsed = performance.now() - start
      settle({
        reachable: true,
        status: resolveStatus(config.id, true, 'ok'),
        responseTimeMs: elapsed,
        uptime: null,
        version: null,
        checks: {},
      })
    })

    socket.setTimeout(HEALTH_CHECK_TIMEOUT_MS)

    socket.on('timeout', () => {
      const elapsed = performance.now() - start
      settle({
        reachable: false,
        status: resolveStatus(config.id, false),
        responseTimeMs: elapsed,
        uptime: null,
        version: null,
        checks: {},
      })
    })

    socket.on('error', () => {
      const elapsed = performance.now() - start
      settle({
        reachable: false,
        status: resolveStatus(config.id, false),
        responseTimeMs: elapsed,
        uptime: null,
        version: null,
        checks: {},
      })
    })
  })
}

/** Stub check: always returns OFFLINE. */
function checkStub(config: TelemetryAppConfig): CheckResult {
  return {
    reachable: false,
    status: 'OFFLINE',
    responseTimeMs: null,
    uptime: null,
    version: null,
    checks: {},
  }
}

/** Dispatch to the correct check function based on config.checkType. */
async function checkApp(config: TelemetryAppConfig): Promise<CheckResult> {
  switch (config.checkType) {
    case 'http':
      return checkHttp(config)
    case 'tcp':
      return checkTcp(config)
    case 'stub':
      return checkStub(config)
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  const now = new Date().toISOString()

  const results = await Promise.all(
    TELEMETRY_APPS.map(async (config) => {
      const result = await checkApp(config)

      const telemetry: AppTelemetry = {
        id: config.id,
        name: config.name,
        status: result.status,
        lastSuccessfulContact: result.reachable ? now : null,
        lastCheckAt: now,
        hasBeenContacted: result.reachable || (contactHistory.get(config.id) ?? false),
        uptime: result.uptime,
        version: result.version,
        checks: result.checks,
        alertCount: result.status === 'DOWN' || result.status === 'DEGRADED' ? 1 : 0,
        responseTimeMs: result.responseTimeMs,
        responseTimeHistory: [],
      }

      return telemetry
    }),
  )

  const apps: Record<string, AppTelemetry> = {}
  const summary = {
    total: results.length,
    operational: 0,
    degraded: 0,
    down: 0,
    offline: 0,
    unknown: 0,
  }

  for (const telemetry of results) {
    apps[telemetry.id] = telemetry

    switch (telemetry.status) {
      case 'OPERATIONAL':
        summary.operational++
        break
      case 'DEGRADED':
        summary.degraded++
        break
      case 'DOWN':
        summary.down++
        break
      case 'OFFLINE':
        summary.offline++
        break
      case 'UNKNOWN':
        summary.unknown++
        break
    }
  }

  const snapshot: SystemSnapshot = {
    timestamp: now,
    apps,
    summary,
  }

  return NextResponse.json(snapshot)
}
