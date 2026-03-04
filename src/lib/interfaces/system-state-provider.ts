/**
 * SystemStateProvider -- Telemetry data API.
 *
 * Phase 1: Polling via TanStack Query + districts.store (WS-1.5).
 * Phase 3: AI context provider (AIRouter reads system state for decisions).
 *
 * This interface is READ-ONLY. Consumers query the current state and
 * subscribe to changes. The polling mechanism (TanStack Query) is
 * the responsibility of WS-1.5; this interface abstracts over it.
 *
 * References: AD-5 (Telemetry Polling), AD-7 interface #2,
 * Gap #3 (Status Model), IA Assessment Sections 1-3
 */

import type { AppIdentifier, HealthState, ISOTimestamp, Unsubscribe } from './types'

// ============================================================================
// Dependency Status
// ============================================================================

/**
 * Health status of a single dependency (database, API, service).
 * Displayed in the Status station (Z3) per IA Assessment Section 1.
 */
export interface DependencyStatus {
  /** Dependency name (e.g., "Supabase", "Ollama", "Claude API"). */
  readonly name: string
  /** Current health state. */
  readonly status: HealthState
  /** Response latency in ms. Null if unreachable. */
  readonly latencyMs: number | null
  /** Error message if not healthy. */
  readonly error: string | null
}

// ============================================================================
// App State
// ============================================================================

/**
 * Complete telemetry state for a single Tarva application.
 *
 * The 5 universal capsule fields (Health, Pulse, Last Event, Alerts,
 * Freshness) from IA Assessment Section 1 map directly to properties here.
 */
export interface AppState {
  /** Canonical app identifier. */
  readonly id: AppIdentifier
  /** Human-readable display name (e.g., "Agent Builder"). */
  readonly displayName: string

  // --- Universal capsule fields (IA Assessment Z1) ---

  /** Current operational health state (5-state model). */
  readonly health: HealthState
  /**
   * Primary activity metric as a human-readable string.
   * Examples: "3 runs active", "8 conversations", "-- idle"
   */
  readonly pulse: string
  /**
   * Most recent significant event description.
   * Null if no events have been observed.
   */
  readonly lastEvent: string | null
  /** ISO 8601 timestamp of the last event. Null if none. */
  readonly lastEventAt: ISOTimestamp | null
  /** Count of active alerts/warnings. Red badge if > 0. */
  readonly alertCount: number
  /**
   * Milliseconds since last meaningful activity.
   * Null if no activity has ever been observed.
   * Amber threshold: > 3600000 (1h). Red threshold: > 86400000 (24h).
   */
  readonly freshnessMs: number | null

  // --- Extended telemetry ---

  /** Per-dependency health statuses (shown in Status station at Z3). */
  readonly dependencies: readonly DependencyStatus[]
  /**
   * Contact history for OFFLINE vs DOWN determination (Gap #3).
   * If firstContact is null, the Launch has never reached this app.
   */
  readonly contactHistory: {
    readonly firstContact: ISOTimestamp | null
    readonly lastContact: ISOTimestamp | null
  }
  /** App-specific payload. Opaque to the Launch; rendered by station templates. */
  readonly raw: Record<string, unknown>
}

// ============================================================================
// Global Metrics (Z0 Constellation View)
// ============================================================================

/**
 * Aggregate metrics for the Constellation (Z0) view.
 * Per IA Assessment Section 1: 3 global metrics for sub-2-second glanceability.
 */
export interface GlobalMetrics {
  /** Total active alerts across all apps. */
  readonly alertCount: number
  /** Total running activities across all apps. */
  readonly activeWork: number
  /**
   * Worst-of-all health state (system-level pulse).
   * If any app is DOWN, systemPulse is DOWN.
   * If any app is DEGRADED (and none DOWN), systemPulse is DEGRADED.
   * Otherwise OPERATIONAL.
   * OFFLINE and UNKNOWN apps do not degrade the system pulse.
   */
  readonly systemPulse: HealthState
}

// ============================================================================
// System Snapshot
// ============================================================================

/**
 * Complete system state at a point in time.
 *
 * This is the primary data structure that AI features consume in Phase 3.
 * The AI Camera Director, station template selector, and narrated telemetry
 * all receive a SystemSnapshot as context.
 */
export interface SystemSnapshot {
  /** Per-app telemetry state. Keyed by AppIdentifier. */
  readonly apps: Readonly<Record<AppIdentifier, AppState>>
  /** Aggregate metrics for Z0. */
  readonly globalMetrics: GlobalMetrics
  /** When this snapshot was assembled. */
  readonly timestamp: ISOTimestamp
}

// ============================================================================
// Adaptive Polling Configuration (AD-5)
// ============================================================================

/** Polling interval configuration per AD-5 (adaptive polling). */
export interface PollingConfig {
  /** Normal interval in ms. Default: 15000. */
  readonly normalIntervalMs: number
  /** Tightened interval when issues detected. Default: 5000. */
  readonly alertIntervalMs: number
  /** Relaxed interval when all stable for N cycles. Default: 30000. */
  readonly relaxedIntervalMs: number
  /** Number of stable cycles before relaxing. Default: 5. */
  readonly stableCyclesBeforeRelax: number
}

/** Default polling configuration per AD-5. */
export const DEFAULT_POLLING_CONFIG: Readonly<PollingConfig> = {
  normalIntervalMs: 15_000,
  alertIntervalMs: 5_000,
  relaxedIntervalMs: 30_000,
  stableCyclesBeforeRelax: 5,
} as const

// ============================================================================
// SystemStateProvider Interface
// ============================================================================

export interface SystemStateProvider {
  /**
   * Get the most recent system snapshot.
   * Returns null if no telemetry data has been fetched yet.
   */
  getSnapshot(): SystemSnapshot | null

  /**
   * Get the state of a single app by identifier.
   * Returns null if the app has no telemetry data.
   */
  getAppState(id: AppIdentifier): AppState | null

  /**
   * Get the current global metrics (Z0 aggregate).
   * Returns null if no telemetry data has been fetched yet.
   */
  getGlobalMetrics(): GlobalMetrics | null

  /**
   * Force an immediate telemetry refresh, bypassing the polling interval.
   * Returns the refreshed snapshot.
   */
  refresh(): Promise<SystemSnapshot>

  /**
   * Subscribe to system state changes.
   * The listener is called whenever a new telemetry poll completes.
   */
  subscribe(listener: (snapshot: SystemSnapshot) => void): Unsubscribe

  /** Get the current polling configuration. */
  getPollingConfig(): PollingConfig
}

// ============================================================================
// Phase 1 Implementation: PollingSystemStateProvider
// ============================================================================

/**
 * Phase 1 SystemStateProvider. Wraps a data source (districts.store or
 * direct fetch) and exposes the SystemStateProvider contract.
 *
 * In Phase 1:
 * - getSnapshot() assembles a snapshot from the current districts store state
 * - subscribe() bridges to the districts store subscription
 * - refresh() triggers a manual fetch to the /api/telemetry endpoint
 *
 * Phase 3 replacement: AIContextSystemStateProvider decorates this with
 * AI-computed enrichments (narrations, trend analysis, anomaly scoring).
 */
export class PollingSystemStateProvider implements SystemStateProvider {
  private listeners: Set<(snapshot: SystemSnapshot) => void> = new Set()
  private currentSnapshot: SystemSnapshot | null = null
  private pollingConfig: PollingConfig = { ...DEFAULT_POLLING_CONFIG }

  /**
   * Update the internal snapshot. Called by the TanStack Query onSuccess
   * callback in WS-1.5 when new telemetry data arrives.
   */
  updateSnapshot(snapshot: SystemSnapshot): void {
    this.currentSnapshot = snapshot
    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }

  getSnapshot(): SystemSnapshot | null {
    return this.currentSnapshot
  }

  getAppState(id: AppIdentifier): AppState | null {
    return this.currentSnapshot?.apps[id] ?? null
  }

  getGlobalMetrics(): GlobalMetrics | null {
    return this.currentSnapshot?.globalMetrics ?? null
  }

  async refresh(): Promise<SystemSnapshot> {
    // Phase 1: fetch from the telemetry Route Handler.
    // WS-1.5 will wire this to the actual endpoint.
    const response = await fetch('/api/telemetry')
    const data = (await response.json()) as SystemSnapshot
    this.updateSnapshot(data)
    return data
  }

  subscribe(listener: (snapshot: SystemSnapshot) => void): Unsubscribe {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getPollingConfig(): PollingConfig {
    return { ...this.pollingConfig }
  }

  /** Allow WS-1.5 to adjust polling based on system health (AD-5 adaptive). */
  setPollingConfig(config: Partial<PollingConfig>): void {
    this.pollingConfig = { ...this.pollingConfig, ...config }
  }
}
