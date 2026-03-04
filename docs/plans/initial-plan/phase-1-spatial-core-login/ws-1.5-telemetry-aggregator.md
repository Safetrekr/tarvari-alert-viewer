# WS-1.5: Telemetry Aggregator

> **Workstream ID:** WS-1.5
> **Phase:** 1 -- Spatial Core + Login
> **Assigned Agent:** `world-class-backend-api-engineer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1 (scaffolding), WS-1.7 (SystemStateProvider interface)
> **Blocks:** WS-1.2 (capsule telemetry data), WS-2.2-2.5 (district telemetry), WS-3.1 (receipt system snapshots)
> **Resolves:** Risk #4 (health endpoint availability), Risk #12 (response format changes)

## 1. Objective

Implement the full telemetry pipeline for Tarva Launch: a server-side aggregator that polls all 6 Tarva apps for health data, a client-side polling layer that keeps the UI synchronized, a Zustand store that maintains per-app telemetry state with contact history, and four display components that render health status, sparklines, metric counters, and alert indicators within capsules.

**Success looks like:** The Launch Atrium shows 6 capsules, each displaying live status from its corresponding app. Apps that are running show OPERATIONAL with a pulsing green dot. Apps that have never responded show OFFLINE with a muted treatment. An app that was previously healthy but stops responding transitions to DOWN with a flashing red indicator. tarvaCODE always shows OFFLINE. TarvaCORE is checked via TCP port probe, not HTTP. The telemetry dashboard updates every 10-15 seconds, tightens to 5 seconds when any app is degraded, and relaxes to 30 seconds when the system has been stable for 5 consecutive cycles.

## 2. Scope

### In Scope

- **Route Handler** (`src/app/api/telemetry/route.ts`): `GET /api/telemetry` server-side aggregator that fetches all 6 apps in parallel with 3-second timeouts, performs TCP port check for TarvaCORE, returns hardcoded OFFLINE for tarvaCODE, validates health response shapes, and returns a `SystemSnapshot` JSON payload
- **Telemetry config** (`src/lib/telemetry-config.ts`): Canonical app registry with IDs, display names, ports, health endpoint paths, and check types (HTTP vs TCP vs stub)
- **TypeScript types** (`src/lib/telemetry-types.ts`): `AppStatus`, `HealthCheckResponse`, `AppTelemetry`, `SystemSnapshot`, and `TelemetryConfig` type definitions that implement the WS-1.7 `SystemStateProvider` interface contract
- **TanStack Query hook** (`src/hooks/use-telemetry.ts`): `useTelemetry()` hook with adaptive `refetchInterval` logic, background refetching, `select` callback that syncs to the districts store, and error recovery
- **Districts store evolution** (`src/stores/districts.store.ts`): Replace the WS-0.1 skeleton with full `AppTelemetry` shape including per-app metrics, alert counts, sparkline history, contact history tracking (for OFFLINE vs DOWN determination), and consecutive-stable-cycle counter
- **HealthBadge component** (`src/components/telemetry/health-badge.tsx`): Wraps `@tarva/ui` `StatusBadge` with Launch-specific status-to-category mapping and animation rules
- **Sparkline component** (`src/components/telemetry/telemetry-sparkline.tsx`): Wraps `@tarva/ui` `Sparkline` with teal accent color override and capsule-appropriate sizing (60x20px)
- **MetricCounter component** (`src/components/telemetry/metric-counter.tsx`): Geist Mono numeric display with `tabular-nums`, animated value transitions via CSS
- **AlertIndicator component** (`src/components/telemetry/alert-indicator.tsx`): Red count badge with pulse animation when count > 0, wrapping `@tarva/ui` `Badge`

### Out of Scope

- Capsule layout and positioning within the ZUI spatial canvas (WS-1.2)
- District-level expanded telemetry views with per-station breakdowns (WS-2.2 through WS-2.5)
- Receipt generation for system snapshot storage (WS-3.1)
- WebSocket or SSE real-time transport -- polling is the Phase 1 architecture per AD-5
- AI-driven narrated telemetry interpretation (WS-3.6 / Phase 3)
- Adding health endpoints to existing Tarva apps -- this workstream handles their absence gracefully
- Supabase persistence of telemetry history -- the store is in-memory only in Phase 1
- Ambient effects on capsules tied to health state (WS-1.6)

## 3. Input Dependencies

| Dependency                                                                         | Source                                                | Status                                                          |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Project scaffolding with TanStack Query provider, Zustand, and directory structure | WS-0.1                                                | Required                                                        |
| `SystemStateProvider` interface definition and `SystemSnapshot` type contract      | WS-1.7                                                | Required (can proceed with draft types if WS-1.7 is concurrent) |
| App registry: canonical names, ports, health endpoints                             | Gap 4 resolution (combined-recommendations.md)        | Finalized                                                       |
| 5-state status model (OPERATIONAL, DEGRADED, DOWN, OFFLINE, UNKNOWN)               | Gap 3 resolution (combined-recommendations.md)        | Finalized                                                       |
| TarvaCORE TCP check decision (port 11435, no HTTP)                                 | Gap 7 resolution (combined-recommendations.md)        | Finalized                                                       |
| Adaptive polling intervals (AD-5)                                                  | combined-recommendations.md                           | Finalized                                                       |
| Health check contract JSON shape                                                   | tech-decisions.md                                     | Finalized                                                       |
| `@tarva/ui` StatusBadge component                                                  | `@tarva/ui` package                                   | Available                                                       |
| `@tarva/ui` Sparkline component                                                    | `@tarva/ui` package                                   | Available                                                       |
| `@tarva/ui` Badge component                                                        | `@tarva/ui` package                                   | Available                                                       |
| Visual design tokens: status colors, teal accent, Geist Mono, tabular-nums         | VISUAL-DESIGN-SPEC.md + WS-0.2                        | Required                                                        |
| Reference codebase: Agent Builder (read-only, for health endpoint pattern)         | `/Users/jessetms/Sites/tarva-claude-agents-frontend/` | Available -- no health endpoint exists yet                      |

## 4. Deliverables

### 4.1 Telemetry Types (`src/lib/telemetry-types.ts`)

Central type definitions consumed by the route handler, hook, store, and display components. These types implement the contract that WS-1.7's `SystemStateProvider` interface will formalize.

```ts
/**
 * The 5 canonical app health states per Gap 3 resolution.
 *
 * OPERATIONAL — All checks passing. Green, pulsing dot.
 * DEGRADED    — Reduced capability (health response has failing sub-checks). Amber, steady.
 * DOWN        — Was previously operational, now unresponsive. Red, flashing.
 * OFFLINE     — Never contacted, or intentionally stopped. Dim/muted.
 * UNKNOWN     — No telemetry connection ever established (initial state). Gray, dashed.
 */
export type AppStatus = 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'OFFLINE' | 'UNKNOWN'

/**
 * The expected shape from a healthy Tarva app's GET /api/health endpoint.
 * Per tech-decisions.md health check contract.
 */
export interface HealthCheckResponse {
  status: string
  uptime?: number
  version?: string
  checks?: Record<string, string>
}

/**
 * Per-app telemetry record stored in the districts store.
 * One entry per app in the registry.
 */
export interface AppTelemetry {
  /** Canonical app ID (e.g., 'agent-builder', 'tarva-core') */
  id: string
  /** Human-readable display name (e.g., 'Agent Builder', 'TarvaCORE') */
  name: string
  /** Current resolved status */
  status: AppStatus
  /** ISO 8601 timestamp of last successful health check, or null if never contacted */
  lastSuccessfulContact: string | null
  /** ISO 8601 timestamp of last check attempt (successful or not) */
  lastCheckAt: string
  /** Whether this app has ever responded successfully (drives OFFLINE vs DOWN logic) */
  hasBeenContacted: boolean
  /** Uptime in seconds from the health response, or null */
  uptime: number | null
  /** App version string from the health response, or null */
  version: string | null
  /** Sub-check results (e.g., { database: 'ok', dependencies: 'ok' }) */
  checks: Record<string, string>
  /** Number of active alerts (derived from failing sub-checks) */
  alertCount: number
  /** Response time of the health check in milliseconds */
  responseTimeMs: number | null
  /** Rolling history of response times for sparkline rendering (last 30 data points) */
  responseTimeHistory: number[]
}

/**
 * Aggregated snapshot of all app telemetry, returned by GET /api/telemetry.
 * This is the contract between the route handler and the client.
 */
export interface SystemSnapshot {
  /** ISO 8601 timestamp when this snapshot was generated */
  timestamp: string
  /** Per-app telemetry keyed by app ID */
  apps: Record<string, AppTelemetry>
  /** Summary counts for quick status overview */
  summary: {
    total: number
    operational: number
    degraded: number
    down: number
    offline: number
    unknown: number
  }
}

/**
 * Check type for each app in the registry.
 * - 'http'  — Standard GET /api/health request
 * - 'tcp'   — TCP socket connection attempt (TarvaCORE)
 * - 'stub'  — Always returns OFFLINE (tarvaCODE)
 */
export type HealthCheckType = 'http' | 'tcp' | 'stub'

/**
 * Configuration for a single app in the telemetry registry.
 */
export interface TelemetryAppConfig {
  id: string
  name: string
  port: number | null
  healthEndpoint: string | null
  checkType: HealthCheckType
}
```

### 4.2 Telemetry Config (`src/lib/telemetry-config.ts`)

Canonical app registry. Single source of truth for app identifiers, ports, and health check strategies.

```ts
import type { TelemetryAppConfig } from './telemetry-types'

/**
 * The 6 Tarva apps monitored by the Launch telemetry aggregator.
 * Per Gap 4 resolution (combined-recommendations.md).
 */
export const TELEMETRY_APPS: TelemetryAppConfig[] = [
  {
    id: 'agent-builder',
    name: 'Agent Builder',
    port: 3000,
    healthEndpoint: '/api/health',
    checkType: 'http',
  },
  {
    id: 'tarva-chat',
    name: 'Tarva Chat',
    port: 3005,
    healthEndpoint: '/api/health',
    checkType: 'http',
  },
  {
    id: 'project-room',
    name: 'Project Room',
    port: 3010,
    healthEndpoint: '/api/health',
    checkType: 'http',
  },
  {
    id: 'tarva-core',
    name: 'TarvaCORE',
    port: 11435,
    healthEndpoint: null,
    checkType: 'tcp',
  },
  {
    id: 'tarva-erp',
    name: 'TarvaERP',
    port: 4000,
    healthEndpoint: '/api/health',
    checkType: 'http',
  },
  {
    id: 'tarva-code',
    name: 'tarvaCODE',
    port: null,
    healthEndpoint: null,
    checkType: 'stub',
  },
]

/**
 * Timeout for individual health checks in milliseconds.
 * Per AD-5: 3 second timeout per app.
 */
export const HEALTH_CHECK_TIMEOUT_MS = 3_000

/**
 * Maximum number of response time data points retained for sparkline history.
 */
export const SPARKLINE_HISTORY_LENGTH = 30

/**
 * Adaptive polling interval configuration per AD-5.
 */
export const POLLING_INTERVALS = {
  /** Normal polling interval when all apps are stable */
  normal: 15_000,
  /** Tightened interval when any app is DEGRADED or DOWN */
  alert: 5_000,
  /** Relaxed interval after 5 consecutive stable cycles */
  relaxed: 30_000,
  /** Number of consecutive all-OPERATIONAL cycles before relaxing */
  stableCyclesThreshold: 5,
} as const
```

### 4.3 Route Handler (`src/app/api/telemetry/route.ts`)

Server-side aggregator that replaces the WS-0.1 placeholder. Fetches all 6 apps in parallel, handles TCP checks for TarvaCORE, stubs tarvaCODE as OFFLINE, validates response shapes, and returns a `SystemSnapshot`.

**This file runs server-side only**, which is critical for two reasons:

1. Eliminates CORS -- the browser never contacts the Tarva apps directly
2. Enables Node.js `net` module for TCP port checks (not available in browser)

```ts
import { NextResponse } from 'next/server'
import { createConnection, type Socket } from 'net'
import { TELEMETRY_APPS, HEALTH_CHECK_TIMEOUT_MS } from '@/lib/telemetry-config'
import type {
  AppTelemetry,
  AppStatus,
  HealthCheckResponse,
  SystemSnapshot,
  TelemetryAppConfig,
} from '@/lib/telemetry-types'

/**
 * In-memory contact history for OFFLINE vs DOWN determination.
 * Persists across requests within the same server process.
 * Per Gap 3 resolution: first contact = OFFLINE; after a successful
 * health check the app is "known"; future unresponsiveness = DOWN.
 */
const contactHistory = new Map<string, boolean>()

/**
 * Type guard: validates that a parsed JSON response matches the
 * expected health check contract shape. Lenient -- only requires
 * `status` as a string. Logs warnings for missing optional fields.
 *
 * Per Risk #12 mitigation: validate shape, log warnings, fall back
 * to UNKNOWN on unexpected formats.
 */
function isValidHealthResponse(data: unknown): data is HealthCheckResponse {
  if (data === null || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return typeof obj.status === 'string'
}

/**
 * Count failing sub-checks to derive alert count.
 * A sub-check is "failing" if its value is anything other than 'ok'.
 */
function countAlerts(checks: Record<string, string>): number {
  return Object.values(checks).filter((v) => v !== 'ok').length
}

/**
 * Determine app status from the health check result.
 * Implements the contact-history learning algorithm from Gap 3.
 */
function resolveStatus(appId: string, healthy: boolean, checks: Record<string, string>): AppStatus {
  if (healthy) {
    // Mark this app as contacted
    contactHistory.set(appId, true)

    // Check sub-checks for degradation
    const failingChecks = countAlerts(checks)
    if (failingChecks > 0) return 'DEGRADED'
    return 'OPERATIONAL'
  }

  // App did not respond. Was it ever known?
  const wasKnown = contactHistory.get(appId) ?? false
  if (wasKnown) return 'DOWN'
  return 'OFFLINE'
}

/**
 * Perform an HTTP health check against a single app.
 */
async function checkHttp(
  config: TelemetryAppConfig
): Promise<Omit<AppTelemetry, 'responseTimeHistory'>> {
  const url = `http://localhost:${config.port}${config.healthEndpoint}`
  const startTime = performance.now()
  const now = new Date().toISOString()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    const elapsed = Math.round(performance.now() - startTime)

    if (!response.ok) {
      return {
        id: config.id,
        name: config.name,
        status: resolveStatus(config.id, false, {}),
        lastSuccessfulContact: null,
        lastCheckAt: now,
        hasBeenContacted: contactHistory.get(config.id) ?? false,
        uptime: null,
        version: null,
        checks: {},
        alertCount: 0,
        responseTimeMs: elapsed,
      }
    }

    const data: unknown = await response.json()

    if (!isValidHealthResponse(data)) {
      // Response shape unexpected -- per Risk #12, log warning and
      // treat as DEGRADED (app is responding but contract is broken)
      console.warn(`[telemetry] ${config.id}: health response failed shape validation`, data)
      contactHistory.set(config.id, true)
      return {
        id: config.id,
        name: config.name,
        status: 'DEGRADED',
        lastSuccessfulContact: now,
        lastCheckAt: now,
        hasBeenContacted: true,
        uptime: null,
        version: null,
        checks: {},
        alertCount: 1,
        responseTimeMs: elapsed,
      }
    }

    const checks = data.checks ?? {}
    const status = resolveStatus(config.id, true, checks)

    return {
      id: config.id,
      name: config.name,
      status,
      lastSuccessfulContact: now,
      lastCheckAt: now,
      hasBeenContacted: true,
      uptime: data.uptime ?? null,
      version: data.version ?? null,
      checks,
      alertCount: countAlerts(checks),
      responseTimeMs: elapsed,
    }
  } catch {
    const elapsed = Math.round(performance.now() - startTime)
    return {
      id: config.id,
      name: config.name,
      status: resolveStatus(config.id, false, {}),
      lastSuccessfulContact: null,
      lastCheckAt: now,
      hasBeenContacted: contactHistory.get(config.id) ?? false,
      uptime: null,
      version: null,
      checks: {},
      alertCount: 0,
      responseTimeMs: elapsed,
    }
  }
}

/**
 * Perform a TCP port check for TarvaCORE (Gap 7).
 * Attempts to open a socket to localhost:11435 with a timeout.
 * Success = app is running. Failure = apply contact history logic.
 */
async function checkTcp(
  config: TelemetryAppConfig
): Promise<Omit<AppTelemetry, 'responseTimeHistory'>> {
  const now = new Date().toISOString()
  const startTime = performance.now()

  return new Promise((resolve) => {
    const socket: Socket = createConnection({ host: 'localhost', port: config.port! }, () => {
      const elapsed = Math.round(performance.now() - startTime)
      socket.destroy()
      contactHistory.set(config.id, true)
      resolve({
        id: config.id,
        name: config.name,
        status: 'OPERATIONAL',
        lastSuccessfulContact: now,
        lastCheckAt: now,
        hasBeenContacted: true,
        uptime: null,
        version: null,
        checks: {},
        alertCount: 0,
        responseTimeMs: elapsed,
      })
    })

    socket.setTimeout(HEALTH_CHECK_TIMEOUT_MS)

    socket.on('timeout', () => {
      const elapsed = Math.round(performance.now() - startTime)
      socket.destroy()
      resolve({
        id: config.id,
        name: config.name,
        status: resolveStatus(config.id, false, {}),
        lastSuccessfulContact: null,
        lastCheckAt: now,
        hasBeenContacted: contactHistory.get(config.id) ?? false,
        uptime: null,
        version: null,
        checks: {},
        alertCount: 0,
        responseTimeMs: elapsed,
      })
    })

    socket.on('error', () => {
      const elapsed = Math.round(performance.now() - startTime)
      socket.destroy()
      resolve({
        id: config.id,
        name: config.name,
        status: resolveStatus(config.id, false, {}),
        lastSuccessfulContact: null,
        lastCheckAt: now,
        hasBeenContacted: contactHistory.get(config.id) ?? false,
        uptime: null,
        version: null,
        checks: {},
        alertCount: 0,
        responseTimeMs: elapsed,
      })
    })
  })
}

/**
 * Return a static OFFLINE result for tarvaCODE (stub app).
 */
function checkStub(config: TelemetryAppConfig): Omit<AppTelemetry, 'responseTimeHistory'> {
  return {
    id: config.id,
    name: config.name,
    status: 'OFFLINE',
    lastSuccessfulContact: null,
    lastCheckAt: new Date().toISOString(),
    hasBeenContacted: false,
    uptime: null,
    version: null,
    checks: {},
    alertCount: 0,
    responseTimeMs: null,
  }
}

/**
 * Check a single app based on its configured check type.
 */
function checkApp(config: TelemetryAppConfig): Promise<Omit<AppTelemetry, 'responseTimeHistory'>> {
  switch (config.checkType) {
    case 'http':
      return checkHttp(config)
    case 'tcp':
      return checkTcp(config)
    case 'stub':
      return Promise.resolve(checkStub(config))
  }
}

/**
 * GET /api/telemetry
 *
 * Server-side telemetry aggregator. Fetches all 6 Tarva apps in parallel,
 * maps results to a SystemSnapshot, and returns aggregated JSON.
 *
 * - HTTP apps: GET /api/health with 3s timeout
 * - TarvaCORE: TCP port check on 11435
 * - tarvaCODE: hardcoded OFFLINE stub
 *
 * Response is not cached (dynamic route handler) to ensure fresh data
 * on every poll cycle.
 */
export async function GET() {
  const results = await Promise.all(TELEMETRY_APPS.map(checkApp))

  const apps: Record<string, AppTelemetry> = {}
  const summary = {
    total: results.length,
    operational: 0,
    degraded: 0,
    down: 0,
    offline: 0,
    unknown: 0,
  }

  for (const result of results) {
    apps[result.id] = {
      ...result,
      // responseTimeHistory is maintained client-side in the store,
      // not populated by the server on each request.
      responseTimeHistory: [],
    }

    switch (result.status) {
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
    timestamp: new Date().toISOString(),
    apps,
    summary,
  }

  return NextResponse.json(snapshot)
}
```

**Design decisions in this handler:**

1. **In-memory `contactHistory`**: Persists within the Node.js server process lifetime. Survives across polling requests but resets on server restart. This is acceptable for localhost-only deployment -- restart means the Launch is re-learning which apps are alive, which is the correct behavior.

2. **`responseTimeHistory` not populated server-side**: The rolling sparkline history is maintained in the client-side Zustand store by appending each response's `responseTimeMs` to the array. The server returns an empty array for this field on each response. This avoids server-side state management for presentation-layer data.

3. **`Promise.all` (not `Promise.allSettled`)**: Individual check functions never throw -- they catch all errors internally and return a resolved result with the appropriate offline/down status. `Promise.all` is safe here and keeps the code clearer.

4. **`performance.now()` for timing**: Available in Node.js 22+ (Next.js 16 requirement). Provides sub-millisecond precision for response time measurement.

### 4.4 TanStack Query Hook (`src/hooks/use-telemetry.ts`)

Client-side polling hook with adaptive interval logic per AD-5.

```ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { useDistrictsStore } from '@/stores/districts.store'
import { POLLING_INTERVALS, SPARKLINE_HISTORY_LENGTH } from '@/lib/telemetry-config'
import type { AppStatus, AppTelemetry, SystemSnapshot } from '@/lib/telemetry-types'

/**
 * Determine whether any app in the snapshot is in an alert state.
 */
function hasAlertState(snapshot: SystemSnapshot): boolean {
  return Object.values(snapshot.apps).some(
    (app) => app.status === 'DEGRADED' || app.status === 'DOWN'
  )
}

/**
 * Determine whether all contactable apps are OPERATIONAL.
 * Apps that are OFFLINE or UNKNOWN do not count against stability.
 */
function allStable(snapshot: SystemSnapshot): boolean {
  return Object.values(snapshot.apps).every(
    (app) => app.status === 'OPERATIONAL' || app.status === 'OFFLINE' || app.status === 'UNKNOWN'
  )
}

/**
 * Fetch the telemetry snapshot from the server-side aggregator.
 */
async function fetchTelemetry(): Promise<SystemSnapshot> {
  const response = await fetch('/api/telemetry')
  if (!response.ok) {
    throw new Error(`Telemetry fetch failed: ${response.status}`)
  }
  return response.json()
}

/**
 * Merge a fresh server snapshot into the existing store state.
 * Preserves client-side data (responseTimeHistory, hasBeenContacted)
 * and appends new response time data points for sparklines.
 */
function mergeSnapshotIntoStore(
  snapshot: SystemSnapshot,
  existingDistricts: Record<string, AppTelemetry>
): Record<string, AppTelemetry> {
  const merged: Record<string, AppTelemetry> = {}

  for (const [id, freshApp] of Object.entries(snapshot.apps)) {
    const existing = existingDistricts[id]

    // Build response time history by appending new data point
    const previousHistory = existing?.responseTimeHistory ?? []
    const newHistory =
      freshApp.responseTimeMs !== null
        ? [...previousHistory, freshApp.responseTimeMs].slice(-SPARKLINE_HISTORY_LENGTH)
        : previousHistory

    // Preserve contact history from both server and client state
    const hasBeenContacted = freshApp.hasBeenContacted || (existing?.hasBeenContacted ?? false)

    // Preserve last successful contact from whichever is more recent
    const lastSuccessfulContact =
      freshApp.lastSuccessfulContact ?? existing?.lastSuccessfulContact ?? null

    merged[id] = {
      ...freshApp,
      hasBeenContacted,
      lastSuccessfulContact,
      responseTimeHistory: newHistory,
    }
  }

  return merged
}

/**
 * Primary telemetry hook for the Launch application.
 *
 * Polls GET /api/telemetry at an adaptive interval per AD-5:
 * - Normal:  15s (default)
 * - Alert:   5s  (when any app is DEGRADED or DOWN)
 * - Relaxed: 30s (after 5 consecutive stable cycles)
 *
 * On each successful fetch, merges the snapshot into the districts
 * store via the `select` callback pattern, preserving client-side
 * sparkline history and contact tracking.
 *
 * @returns The latest SystemSnapshot, plus query state (isLoading, isError, etc.)
 */
export function useTelemetry() {
  const consecutiveStableCycles = useRef(0)
  const currentInterval = useRef(POLLING_INTERVALS.normal)
  const syncToStore = useDistrictsStore((s) => s.syncSnapshot)

  /**
   * Compute the next polling interval based on the latest snapshot.
   */
  const updateInterval = useCallback((snapshot: SystemSnapshot) => {
    if (hasAlertState(snapshot)) {
      consecutiveStableCycles.current = 0
      currentInterval.current = POLLING_INTERVALS.alert
    } else if (allStable(snapshot)) {
      consecutiveStableCycles.current++
      if (consecutiveStableCycles.current >= POLLING_INTERVALS.stableCyclesThreshold) {
        currentInterval.current = POLLING_INTERVALS.relaxed
      } else {
        currentInterval.current = POLLING_INTERVALS.normal
      }
    } else {
      // Some apps are OFFLINE/UNKNOWN but none are alert -- normal interval
      consecutiveStableCycles.current = 0
      currentInterval.current = POLLING_INTERVALS.normal
    }
  }, [])

  const query = useQuery({
    queryKey: ['telemetry'],
    queryFn: fetchTelemetry,
    refetchInterval: () => currentInterval.current,
    refetchIntervalInBackground: true,
    staleTime: 0,
    select: (snapshot: SystemSnapshot) => {
      // Side effect: sync to Zustand store on every successful fetch
      const existingDistricts = useDistrictsStore.getState().districts
      const merged = mergeSnapshotIntoStore(snapshot, existingDistricts)
      syncToStore(merged, snapshot.timestamp)

      // Side effect: update adaptive polling interval
      updateInterval(snapshot)

      return snapshot
    },
  })

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    /**
     * Current adaptive polling interval in milliseconds.
     * Exposed for debugging and display in the telemetry HUD.
     */
    currentIntervalMs: currentInterval.current,
  }
}
```

**Key design choices:**

1. **`select` callback for store sync**: TanStack Query's `select` runs after every successful fetch. This is the single integration point between the query layer and Zustand. The store is updated as a side effect of data selection, not via a separate `useEffect`, which avoids an extra render cycle.

2. **`useDistrictsStore.getState()` (non-reactive)**: Inside `select`, we read the store's current state imperatively to access existing `responseTimeHistory` for merging. This does not cause React re-renders because it bypasses the subscription.

3. **`refetchInterval` as a function**: Returning `currentInterval.current` from a function allows the interval to change dynamically without re-mounting the query. TanStack Query re-evaluates this on each cycle.

4. **`staleTime: 0`**: Telemetry data is always considered stale. Every refetch hits the server. This overrides the 30-second default set in the QueryProvider.

### 4.5 Districts Store Evolution (`src/stores/districts.store.ts`)

Replaces the WS-0.1 skeleton with full telemetry state management.

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AppTelemetry } from '@/lib/telemetry-types'

interface DistrictsState {
  /** Per-app telemetry keyed by app ID */
  districts: Record<string, AppTelemetry>
  /** ISO 8601 timestamp of the most recent snapshot */
  lastSnapshotAt: string | null

  // -- Actions --

  /**
   * Sync a full snapshot from the telemetry hook.
   * Replaces all district entries with merged data.
   */
  syncSnapshot: (districts: Record<string, AppTelemetry>, timestamp: string) => void

  /**
   * Update a single district entry. Used for optimistic updates
   * or manual status overrides in future phases.
   */
  setDistrict: (id: string, telemetry: AppTelemetry) => void

  /** Remove a district entry. */
  removeDistrict: (id: string) => void

  /** Reset all districts to empty state. */
  clearAll: () => void
}

export const useDistrictsStore = create<DistrictsState>()(
  immer((set) => ({
    districts: {},
    lastSnapshotAt: null,

    syncSnapshot: (districts, timestamp) =>
      set((state) => {
        state.districts = districts
        state.lastSnapshotAt = timestamp
      }),

    setDistrict: (id, telemetry) =>
      set((state) => {
        state.districts[id] = telemetry
      }),

    removeDistrict: (id) =>
      set((state) => {
        delete state.districts[id]
      }),

    clearAll: () =>
      set((state) => {
        state.districts = {}
        state.lastSnapshotAt = null
      }),
  }))
)
```

**Note on immer usage:** The `syncSnapshot` action replaces the entire `districts` record on each poll cycle. Immer's structural sharing ensures that only changed entries trigger re-renders in consuming components that subscribe to specific app IDs via a selector (e.g., `useDistrictsStore((s) => s.districts['agent-builder'])`).

### 4.6 HealthBadge Component (`src/components/telemetry/health-badge.tsx`)

Maps the 5-state `AppStatus` to `@tarva/ui` `StatusBadge` props. Encapsulates the Launch-specific status-to-category/animation mapping so capsule components do not need to know about the StatusBadge API.

````tsx
'use client'

import { StatusBadge } from '@tarva/ui'
import type { StatusCategory, StatusAnimation } from '@tarva/ui'
import type { AppStatus } from '@/lib/telemetry-types'

/**
 * Map Launch AppStatus to @tarva/ui StatusBadge category.
 *
 * @tarva/ui StatusBadge categories: success, warning, danger, info, neutral, muted
 * Launch status model (Gap 3):
 *   OPERATIONAL -> success (green)
 *   DEGRADED    -> warning (amber)
 *   DOWN        -> danger  (red)
 *   OFFLINE     -> muted   (dim/muted)
 *   UNKNOWN     -> neutral (gray)
 */
const STATUS_CATEGORY_MAP: Record<AppStatus, StatusCategory> = {
  OPERATIONAL: 'success',
  DEGRADED: 'warning',
  DOWN: 'danger',
  OFFLINE: 'muted',
  UNKNOWN: 'neutral',
}

/**
 * Map Launch AppStatus to @tarva/ui StatusBadge animation.
 *
 * Per VISUAL-DESIGN-SPEC.md:
 *   OPERATIONAL -> pulse (pulsing green dot)
 *   DEGRADED    -> none  (steady amber)
 *   DOWN        -> pulse (flashing red -- uses pulse, not shake, per spec "flashing")
 *   OFFLINE     -> none  (dim, no animation)
 *   UNKNOWN     -> none  (gray, no animation)
 */
const STATUS_ANIMATION_MAP: Record<AppStatus, StatusAnimation> = {
  OPERATIONAL: 'pulse',
  DEGRADED: 'none',
  DOWN: 'pulse',
  OFFLINE: 'none',
  UNKNOWN: 'none',
}

/**
 * Map Launch AppStatus to human-readable labels.
 */
const STATUS_LABEL_MAP: Record<AppStatus, string> = {
  OPERATIONAL: 'Operational',
  DEGRADED: 'Degraded',
  DOWN: 'Down',
  OFFLINE: 'Offline',
  UNKNOWN: 'Unknown',
}

export interface HealthBadgeProps {
  /** The app's current health status */
  status: AppStatus
  /** Size variant passed through to StatusBadge */
  size?: 'sm' | 'default' | 'lg'
  /** Additional CSS classes */
  className?: string
}

/**
 * HealthBadge -- Launch-specific status indicator.
 *
 * Wraps @tarva/ui StatusBadge with the 5-state Launch status model.
 * Renders a colored dot + status label with appropriate animation.
 *
 * @example
 * ```tsx
 * <HealthBadge status="OPERATIONAL" />
 * <HealthBadge status="DOWN" size="sm" />
 * ```
 */
export function HealthBadge({ status, size = 'sm', className }: HealthBadgeProps) {
  return (
    <StatusBadge
      status={status.toLowerCase()}
      label={STATUS_LABEL_MAP[status]}
      category={STATUS_CATEGORY_MAP[status]}
      animation={STATUS_ANIMATION_MAP[status]}
      variant="dot"
      size={size}
      className={className}
    />
  )
}
````

### 4.7 TelemetrySparkline Component (`src/components/telemetry/telemetry-sparkline.tsx`)

Wraps `@tarva/ui` `Sparkline` with Launch-specific sizing and teal accent color for telemetry data visualization.

````tsx
'use client'

import { Sparkline } from '@tarva/ui'

export interface TelemetrySparklineProps {
  /** Array of numeric data points (e.g., response times in ms) */
  data: number[]
  /** Width in pixels. Default: 60 (capsule-appropriate per VISUAL-DESIGN-SPEC) */
  width?: number
  /** Height in pixels. Default: 20 (capsule-appropriate per VISUAL-DESIGN-SPEC) */
  height?: number
  /** Whether to show the gradient fill under the line */
  showFill?: boolean
  /** Accessible label for screen readers */
  label?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * TelemetrySparkline -- Mini line chart for capsule telemetry data.
 *
 * Uses teal accent color (--color-teal / --accent) per VISUAL-DESIGN-SPEC.md:
 * "Teal: Data visualization (sparklines, charts, metric values)."
 *
 * Sized for capsule content area: 60x20px default.
 * Renders nothing if fewer than 2 data points are available.
 *
 * @example
 * ```tsx
 * <TelemetrySparkline data={[142, 138, 155, 149, 162, 158]} />
 * <TelemetrySparkline data={responseTimeHistory} showFill />
 * ```
 */
export function TelemetrySparkline({
  data,
  width = 60,
  height = 20,
  showFill = false,
  label,
  className,
}: TelemetrySparklineProps) {
  // Need at least 2 data points to draw a meaningful sparkline
  if (data.length < 2) return null

  return (
    <Sparkline
      data={data}
      width={width}
      height={height}
      strokeWidth={1.5}
      variant="auto"
      showFill={showFill}
      animated={true}
      aria-label={label ?? `Sparkline showing ${data.length} data points`}
      className={className}
      style={
        {
          // Override trend color CSS variables to use teal accent.
          // @tarva/ui Sparkline uses var(--trend-positive), var(--trend-negative),
          // var(--trend-neutral). For telemetry sparklines, we want teal across
          // all variants per the visual spec.
          '--trend-positive': 'var(--color-teal-bright, #3a99b8)',
          '--trend-negative': 'var(--color-teal-bright, #3a99b8)',
          '--trend-neutral': 'var(--color-teal, #277389)',
        } as React.CSSProperties
      }
    />
  )
}
````

**Design note:** The `@tarva/ui` Sparkline component reads `var(--trend-positive)`, `var(--trend-negative)`, and `var(--trend-neutral)` CSS custom properties for stroke color. By overriding these at the component level via inline style, we get teal-colored sparklines without a global CSS override that would affect Sparkline usage elsewhere (e.g., in KpiCards where trend colors are semantically correct).

### 4.8 MetricCounter Component (`src/components/telemetry/metric-counter.tsx`)

Numeric display with Geist Mono, tabular-nums, and CSS-animated value transitions.

````tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface MetricCounterProps {
  /** The numeric value to display */
  value: number | null
  /** Unit suffix (e.g., 'ms', 's', '%') */
  unit?: string
  /** Number of decimal places. Default: 0 */
  precision?: number
  /** Label displayed above the value */
  label?: string
  /** Placeholder text when value is null. Default: '--' */
  placeholder?: string
  /** Whether to animate value transitions. Default: true */
  animated?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Format a number for display with optional precision and unit.
 */
function formatMetricValue(value: number, precision: number, unit: string): string {
  const formatted = precision > 0 ? value.toFixed(precision) : Math.round(value).toLocaleString()
  return unit ? `${formatted}${unit}` : formatted
}

/**
 * MetricCounter -- Numeric telemetry display for capsule content.
 *
 * Uses Geist Mono with tabular-nums for stable character widths
 * per VISUAL-DESIGN-SPEC.md Section 3.3. Values animate via CSS
 * opacity transition on change to create a subtle "update flash."
 *
 * Capsule typography per VISUAL-DESIGN-SPEC.md Section 2.2:
 * - Label: 10px, --color-text-tertiary, uppercase, tracking 0.06em, Geist Sans
 * - Value: 16px, --color-text-primary, Geist Mono, tabular-nums, weight 500
 *
 * @example
 * ```tsx
 * <MetricCounter value={142} unit="ms" label="P95 LATENCY" />
 * <MetricCounter value={3} label="ACTIVE RUNS" />
 * <MetricCounter value={null} label="UPTIME" placeholder="--" />
 * ```
 */
export function MetricCounter({
  value,
  unit = '',
  precision = 0,
  label,
  placeholder = '--',
  animated = true,
  className,
}: MetricCounterProps) {
  const [flash, setFlash] = useState(false)
  const prevValue = useRef(value)

  // Trigger a brief flash animation when the value changes
  useEffect(() => {
    if (!animated) return
    if (prevValue.current !== value && value !== null) {
      setFlash(true)
      const timer = setTimeout(() => setFlash(false), 300)
      prevValue.current = value
      return () => clearTimeout(timer)
    }
    prevValue.current = value
  }, [value, animated])

  const displayValue = value !== null ? formatMetricValue(value, precision, unit) : placeholder

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      {label && (
        <span
          className="font-sans text-[10px] font-normal tracking-[0.06em] uppercase opacity-40"
          style={{ color: 'var(--color-text-tertiary, #55667a)' }}
        >
          {label}
        </span>
      )}
      <span
        className={cn(
          'font-mono text-base leading-none font-medium',
          'transition-opacity duration-300',
          flash && 'opacity-100',
          !flash && value !== null && 'opacity-80',
          value === null && 'opacity-30'
        )}
        style={{
          fontVariantNumeric: 'tabular-nums',
          fontFeatureSettings: '"tnum" 1',
          color:
            value !== null
              ? 'var(--color-text-primary, #def6ff)'
              : 'var(--color-text-ghost, #2a3545)',
        }}
      >
        {displayValue}
      </span>
    </div>
  )
}
````

### 4.9 AlertIndicator Component (`src/components/telemetry/alert-indicator.tsx`)

Red count badge with pulse animation when alerts are active.

````tsx
'use client'

import { Badge } from '@tarva/ui'
import { cn } from '@/lib/utils'

export interface AlertIndicatorProps {
  /** Number of active alerts */
  count: number
  /** Additional CSS classes */
  className?: string
}

/**
 * AlertIndicator -- Red badge showing active alert count.
 *
 * Renders nothing when count is 0 (no visual noise for healthy state).
 * When count > 0, shows a red badge with pulse animation to draw attention.
 *
 * Uses @tarva/ui Badge with destructive variant for the red treatment.
 *
 * @example
 * ```tsx
 * <AlertIndicator count={0} />   // renders nothing
 * <AlertIndicator count={3} />   // red badge "3" with pulse
 * ```
 */
export function AlertIndicator({ count, className }: AlertIndicatorProps) {
  if (count === 0) return null

  return (
    <Badge
      variant="destructive"
      className={cn('animate-pulse text-[10px] font-semibold tabular-nums', className)}
    >
      {count}
    </Badge>
  )
}
````

### 4.10 Barrel Export (`src/components/telemetry/index.ts`)

```ts
export { HealthBadge } from './health-badge'
export type { HealthBadgeProps } from './health-badge'

export { TelemetrySparkline } from './telemetry-sparkline'
export type { TelemetrySparklineProps } from './telemetry-sparkline'

export { MetricCounter } from './metric-counter'
export type { MetricCounterProps } from './metric-counter'

export { AlertIndicator } from './alert-indicator'
export type { AlertIndicatorProps } from './alert-indicator'
```

## 5. Acceptance Criteria

All criteria must pass before WS-1.5 is marked complete.

| #     | Criterion                                                                                                                 | Verification                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `GET /api/telemetry` returns valid `SystemSnapshot` JSON with 6 app entries                                               | `curl http://localhost:3000/api/telemetry \| jq .` returns well-formed JSON with `timestamp`, `apps` (6 entries), and `summary`             |
| AC-2  | Each of the 5 HTTP/TCP apps returns a valid status (OPERATIONAL, DEGRADED, DOWN, or OFFLINE) based on actual reachability | Start Agent Builder on port 3000 (if available) and confirm status is OPERATIONAL; confirm unreachable apps show OFFLINE                    |
| AC-3  | tarvaCODE always returns OFFLINE regardless of environment state                                                          | Verify `apps['tarva-code'].status === 'OFFLINE'` in every response                                                                          |
| AC-4  | TarvaCORE check uses TCP port 11435, not HTTP                                                                             | Verify by running with TarvaCORE active on port 11435 and confirming OPERATIONAL; verify no HTTP request is made to that port               |
| AC-5  | Contact history tracking works: an app that was previously OPERATIONAL but stops responding is shown as DOWN, not OFFLINE | Start an app, confirm OPERATIONAL; stop it; poll again and confirm DOWN                                                                     |
| AC-6  | Health response shape validation works: malformed responses result in DEGRADED (not crash) with console warning           | Send a response that is valid JSON but missing the `status` field; confirm DEGRADED status and warning log                                  |
| AC-7  | `useTelemetry()` hook polls at the normal interval (15s) on initial load                                                  | Mount the hook; confirm network requests occur at ~15s intervals                                                                            |
| AC-8  | Adaptive polling tightens to 5s when any app shows DEGRADED or DOWN                                                       | Simulate a DEGRADED state; confirm polling interval decreases                                                                               |
| AC-9  | Adaptive polling relaxes to 30s after 5 consecutive stable cycles                                                         | Run with all apps stable (or offline); confirm interval increases after 5 cycles                                                            |
| AC-10 | Districts store receives merged snapshots with accumulating `responseTimeHistory`                                         | Inspect store state after 3+ polls; confirm `responseTimeHistory` array grows (up to 30 entries)                                            |
| AC-11 | `HealthBadge` renders correct color and animation for each of the 5 statuses                                              | Render HealthBadge with each AppStatus; confirm visual matches Gap 3 spec (green/pulsing, amber/steady, red/flashing, dim/muted, gray/none) |
| AC-12 | `TelemetrySparkline` renders with teal accent color, not default trend colors                                             | Render sparkline; inspect SVG stroke color matches teal accent values                                                                       |
| AC-13 | `MetricCounter` uses Geist Mono, tabular-nums, and animates on value change                                               | Render counter; change value; confirm font family, numeric rendering, and opacity flash                                                     |
| AC-14 | `AlertIndicator` renders nothing when count is 0; shows pulsing red badge when count > 0                                  | Render with count=0 (nothing visible); render with count=3 (red badge with "3")                                                             |
| AC-15 | `pnpm typecheck` passes with zero errors after all WS-1.5 files are added                                                 | Run `pnpm typecheck` and confirm exit code 0                                                                                                |
| AC-16 | Route handler does not leak errors to the client: all check failures result in valid JSON with appropriate status codes   | Kill all apps; `GET /api/telemetry` still returns 200 with valid JSON (all apps OFFLINE/UNKNOWN)                                            |
| AC-17 | Response times are measured in milliseconds and included in each app's telemetry                                          | Confirm `responseTimeMs` is a positive integer (or null for stub) in the API response                                                       |

## 6. Decisions Made

| #    | Decision                                                                         | Rationale                                                                                                                                                                                                                                                                                                                                                    | Source                                                                                         |
| ---- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| D-1  | Contact history stored in-memory on the server (not persisted to DB)             | Localhost-only deployment means server restarts are infrequent. On restart, re-learning which apps are alive is the correct behavior -- it avoids serving stale "DOWN" states for apps that were shut down intentionally while the server was off.                                                                                                           | Engineering judgment, deployment constraints                                                   |
| D-2  | `responseTimeHistory` maintained client-side, not server-side                    | Sparkline data is a presentation concern. Maintaining a rolling window server-side would require a persistence layer or global mutable state with concurrency concerns. The client accumulates data points naturally via successive poll responses.                                                                                                          | Separation of concerns                                                                         |
| D-3  | Use `StatusBadge` from `@tarva/ui` (not a custom dot component) for HealthBadge  | `@tarva/ui` StatusBadge already implements dot variants, category-based coloring via CSS custom properties (`--status-success`, `--status-warning`, etc.), and animation presets (`pulse`, `shake`). Writing a custom component would duplicate this functionality. The registry supports all 5 Launch statuses or can be extended via `registerStatuses()`. | @tarva/ui StatusBadge source code analysis                                                     |
| D-4  | Override Sparkline trend colors via inline CSS custom properties for teal accent | The `@tarva/ui` Sparkline reads `var(--trend-positive)`, `var(--trend-negative)`, `var(--trend-neutral)` for stroke color. For telemetry sparklines, the visual spec mandates teal accent regardless of trend direction. Inline style override scopes the change to telemetry sparklines only, keeping KpiCard sparklines unaffected.                        | VISUAL-DESIGN-SPEC.md Section 1.5 ("Teal: Data visualization, sparklines")                     |
| D-5  | `select` callback in TanStack Query for store sync (not `useEffect`)             | The `select` callback runs synchronously after each successful fetch, before the component re-renders. This is more efficient than a `useEffect` that would trigger an additional render cycle. It also keeps the sync logic co-located with the query definition.                                                                                           | TanStack Query documentation, performance optimization                                         |
| D-6  | Malformed health responses treated as DEGRADED (not UNKNOWN or OFFLINE)          | If an app responds with unexpected JSON, it is alive but its contract is broken. This is a degraded condition, not an offline one. Logging a warning (per Risk #12 mitigation) alerts developers to fix the health endpoint.                                                                                                                                 | Gap 3 status semantics                                                                         |
| D-7  | `Promise.all` over `Promise.allSettled` for parallel health checks               | Each individual `checkHttp`/`checkTcp` function wraps its own try-catch and never throws. Every call resolves to a valid `AppTelemetry` result regardless of failure. `Promise.all` is safe and produces cleaner code than `Promise.allSettled` + unwrapping.                                                                                                | Implementation simplicity                                                                      |
| D-8  | MetricCounter flash animation via CSS opacity transition (not Framer Motion)     | The value change animation is a subtle 300ms opacity bump -- simple enough for a CSS transition. Using Framer Motion here would add unnecessary import weight to the capsule render path. Framer Motion is reserved for choreographed morph transitions per the three-tier animation architecture.                                                           | tech-decisions.md Three-Tier Animation Architecture                                            |
| D-9  | AlertIndicator renders nothing (returns null) when count is 0                    | Zero alerts is the happy path and should produce no visual noise. Rendering an empty badge or a "0" count would clutter the capsule layout. Conditionally rendering keeps the capsule clean when healthy.                                                                                                                                                    | Visual design principle: "color comes from light emission" (no visual element without purpose) |
| D-10 | TCP check for TarvaCORE uses Node.js `net.createConnection` (not `fetch`)        | TarvaCORE has no HTTP API (Gap 7). A TCP socket connection to port 11435 is the lightest-weight check: if the socket connects, the process is alive. This runs server-side only in the Route Handler where Node.js `net` is available.                                                                                                                       | Gap 7 resolution                                                                               |

## 7. Open Questions

| #    | Question                                                                                                                                        | Impact                                                                                                                                                                                                                                                                                                                      | Owner                                     | Resolution Deadline                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------ |
| OQ-1 | Should the Route Handler run on the same port as the Launch dev server (3000), which conflicts with Agent Builder's port?                       | If both are running simultaneously on port 3000, the telemetry aggregator cannot reach Agent Builder. Options: (a) Tarva Launch runs on a different dev port (e.g., 3100), (b) Agent Builder's port is configurable via env var, (c) Accept that Agent Builder shows as OFFLINE during Launch development.                  | Project Lead                              | Before execution begins                    |
| OQ-2 | Should WS-1.5 register custom Launch statuses in `@tarva/ui`'s StatusBadge registry via `registerStatuses()`?                                   | The registry has `offline` mapped to `danger` (red) category, but Launch's OFFLINE is `muted` (dim). The HealthBadge component overrides via explicit `category` prop, which takes precedence over the registry. If other components also need the Launch status mapping, a centralized registration call would be cleaner. | Backend Engineer                          | During implementation                      |
| OQ-3 | What is the WS-1.7 `SystemStateProvider` interface shape? This SOW defines `SystemSnapshot` and `AppTelemetry` types that should align with it. | If WS-1.7 defines a different contract, WS-1.5 types will need adaptation. The types here are designed to be a superset of what `SystemStateProvider` likely needs.                                                                                                                                                         | Chief Technology Architect (WS-1.7 owner) | Before or concurrent with WS-1.5 execution |
| OQ-4 | Should the telemetry route be protected by authentication?                                                                                      | Currently `GET /api/telemetry` is unauthenticated. Since it reveals which local apps are running and their versions, it could be considered sensitive. However, this is a localhost-only tool with passphrase auth. If auth is needed, it would depend on WS-1.3 (Login Experience) shipping first.                         | Project Lead                              | WS-1.3 completion                          |
| OQ-5 | Should health check results include response headers (e.g., `X-Request-ID`, `Server`) for richer telemetry?                                     | Would provide more diagnostic data in district views (Phase 2) but adds complexity to the Phase 1 aggregator.                                                                                                                                                                                                               | Backend Engineer                          | Phase 2 planning                           |

## 8. Risk Register

| #   | Risk                                                                                                       | Likelihood | Impact                                                          | Mitigation                                                                                                                                                                                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | Existing apps lack `/api/health` endpoints (Risk #4)                                                       | High       | Medium -- all apps show OFFLINE instead of OPERATIONAL          | Graceful degradation is built into the status resolution logic. Apps without health endpoints are treated as OFFLINE (never contacted) or DOWN (if previously contacted via manual testing). This workstream does not require health endpoints to exist -- it handles their absence as a normal case.                      |
| R-2 | Health response format changes or deviates from contract (Risk #12)                                        | Medium     | Low -- DEGRADED status with warning log                         | The `isValidHealthResponse` guard validates shape before processing. Only `status: string` is required; all other fields are optional. Unexpected shapes result in DEGRADED (app is alive but contract is broken), not a crash. Warning is logged server-side for developer visibility.                                    |
| R-3 | Port conflict: Launch dev server and Agent Builder both on port 3000                                       | High       | Medium -- Agent Builder always shows OFFLINE during development | See OQ-1. Recommended mitigation: configure Launch to run on port 3100 via `next dev --port 3100` in `package.json` scripts, or resolve during WS-0.1 execution.                                                                                                                                                           |
| R-4 | TCP check for TarvaCORE may be slow (up to 3s timeout) on every poll cycle when TarvaCORE is not running   | Medium     | Low -- adds up to 3s to aggregator response time                | The TCP check runs in parallel with all other checks via `Promise.all`. The 3s timeout is the maximum wall-clock time for the entire aggregation, not additive. If TarvaCORE is consistently offline, the timeout fires quickly (connection refused is typically instant on localhost).                                    |
| R-5 | Adaptive polling interval state resets on component unmount                                                | Low        | Low -- interval resets to normal (15s), not a degraded state    | The `consecutiveStableCycles` ref resets on unmount. This means navigating away from the Launch Atrium and back resets the polling to normal interval. This is acceptable -- the relaxed interval is an optimization, and re-establishing it after 5 stable cycles is quick.                                               |
| R-6 | Store sync in `select` callback may cause unexpected behavior if TanStack Query changes `select` semantics | Low        | Medium -- store could stop receiving updates                    | `select` as a synchronous transform is a stable TanStack Query v5 API. The side effect (store sync) is unconventional but safe because `useDistrictsStore.getState()` is non-reactive and the store update is synchronous. If TanStack Query deprecates this pattern, the fallback is a `useEffect` watching `query.data`. |
| R-7 | In-memory contact history lost on server restart causes brief OFFLINE-then-DOWN oscillation                | Low        | Low -- visual flicker for one poll cycle                        | On server restart, all apps start as OFFLINE (unknown). After one successful poll, contacted apps flip to OPERATIONAL. This single-cycle transition is correct behavior and matches the "learning from contact history" design.                                                                                            |

---

## Appendix A: File Manifest

| File                                               | Action  | Description                                                                      |
| -------------------------------------------------- | ------- | -------------------------------------------------------------------------------- |
| `src/lib/telemetry-types.ts`                       | CREATE  | TypeScript types for AppStatus, AppTelemetry, SystemSnapshot, TelemetryAppConfig |
| `src/lib/telemetry-config.ts`                      | CREATE  | App registry, timeouts, polling intervals                                        |
| `src/app/api/telemetry/route.ts`                   | REPLACE | Replace WS-0.1 placeholder with full aggregator implementation                   |
| `src/hooks/use-telemetry.ts`                       | CREATE  | TanStack Query hook with adaptive polling and store sync                         |
| `src/stores/districts.store.ts`                    | REPLACE | Replace WS-0.1 skeleton with full telemetry state management                     |
| `src/components/telemetry/health-badge.tsx`        | CREATE  | Status indicator wrapping @tarva/ui StatusBadge                                  |
| `src/components/telemetry/telemetry-sparkline.tsx` | CREATE  | Teal-tinted sparkline wrapping @tarva/ui Sparkline                               |
| `src/components/telemetry/metric-counter.tsx`      | CREATE  | Geist Mono numeric display with animated transitions                             |
| `src/components/telemetry/alert-indicator.tsx`     | CREATE  | Red count badge wrapping @tarva/ui Badge                                         |
| `src/components/telemetry/index.ts`                | CREATE  | Barrel export for telemetry components                                           |

## Appendix B: Execution Checklist

```
[ ] 1. Verify WS-0.1 scaffolding is complete (directory structure, dependencies, stores)
[ ] 2. Create src/lib/telemetry-types.ts (Section 4.1)
[ ] 3. Create src/lib/telemetry-config.ts (Section 4.2)
[ ] 4. Replace src/app/api/telemetry/route.ts (Section 4.3)
[ ] 5. Create src/hooks/use-telemetry.ts (Section 4.4)
[ ] 6. Replace src/stores/districts.store.ts (Section 4.5)
[ ] 7. Create src/components/telemetry/health-badge.tsx (Section 4.6)
[ ] 8. Create src/components/telemetry/telemetry-sparkline.tsx (Section 4.7)
[ ] 9. Create src/components/telemetry/metric-counter.tsx (Section 4.8)
[ ] 10. Create src/components/telemetry/alert-indicator.tsx (Section 4.9)
[ ] 11. Create src/components/telemetry/index.ts (Section 4.10)
[ ] 12. Verify AC-1: GET /api/telemetry returns valid SystemSnapshot
[ ] 13. Verify AC-2: Reachable apps show OPERATIONAL
[ ] 14. Verify AC-3: tarvaCODE always returns OFFLINE
[ ] 15. Verify AC-5: Contact history OFFLINE->DOWN transition
[ ] 16. Verify AC-6: Malformed response -> DEGRADED + warning
[ ] 17. Verify AC-7: Normal polling at 15s
[ ] 18. Verify AC-8: Alert state tightens to 5s
[ ] 19. Verify AC-9: 5 stable cycles relaxes to 30s
[ ] 20. Verify AC-10: responseTimeHistory accumulates in store
[ ] 21. Verify AC-11: HealthBadge renders 5 status variants correctly
[ ] 22. Verify AC-12: TelemetrySparkline uses teal accent
[ ] 23. Verify AC-13: MetricCounter uses Geist Mono + tabular-nums
[ ] 24. Verify AC-14: AlertIndicator hides at 0, shows at > 0
[ ] 25. Verify AC-15: pnpm typecheck passes
[ ] 26. Verify AC-16: All apps offline -> 200 with valid JSON
[ ] 27. Verify AC-17: responseTimeMs present in telemetry response
[ ] 28. Run pnpm lint, pnpm format:check -- both pass
[ ] 29. Commit with message: "feat: implement telemetry aggregator pipeline (WS-1.5)"
```

## Appendix C: @tarva/ui Component API Reference

The following APIs were verified by reading the `@tarva/ui` source code. These are the exact interfaces consumed by WS-1.5 components.

**StatusBadge** (`@tarva/ui`):

- Props: `status: string`, `label?: string`, `category?: StatusCategory`, `variant?: 'dot' | 'badge' | 'outline' | 'subtle'`, `size?: 'sm' | 'default' | 'lg'`, `animation?: 'none' | 'pulse' | 'pop' | 'shake'`, `showDot?: boolean`, `icon?: ReactNode`, `disableAnimation?: boolean`
- Categories: `'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'muted'`
- Registry: `registerStatuses()` can add custom status-to-category mappings
- The `category` prop overrides registry lookup (explicit category wins)

**Sparkline** (`@tarva/ui`):

- Props: `data: number[]`, `width?: number` (default 64), `height?: number` (default 24), `strokeWidth?: number` (default 1.5), `variant?: 'positive' | 'negative' | 'neutral' | 'auto'`, `showFill?: boolean`, `animated?: boolean`, `aria-label?: string`
- Color source: reads `var(--trend-positive)`, `var(--trend-negative)`, `var(--trend-neutral)` CSS custom properties
- Renders SVG polyline with optional gradient fill polygon

**Badge** (`@tarva/ui`):

- Props: `variant?: 'default' | 'secondary' | 'destructive' | 'outline'`, plus standard `HTMLDivElement` props
- `destructive` variant: `bg-destructive text-destructive-foreground` (maps to red via `--status-danger`)
