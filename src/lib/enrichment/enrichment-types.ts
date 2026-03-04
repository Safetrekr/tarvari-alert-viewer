/**
 * Enrichment data model -- TypeScript interfaces for the ambient
 * telemetry layer that drives range rings, orbital readouts, signal
 * monitors, activity feeds, and connection path animations.
 *
 * These types describe the "enrichment snapshot" produced by the
 * enrichment cycle hook and consumed by all 12 ambient enrichment
 * components via the enrichment store.
 *
 * @module enrichment-types
 * @see WS-1.6 Ambient Effects Layer
 */

import type { DistrictId, HealthState } from '@/lib/interfaces/district'

// ---------------------------------------------------------------------------
// Per-district telemetry
// ---------------------------------------------------------------------------

/** Per-district enrichment telemetry surfaced by capsule overlays and readouts. */
export interface DistrictEnrichment {
  /** District identifier. */
  id: DistrictId
  /** Human-readable display name (e.g. "Agent Builder"). */
  displayName: string
  /** Two-letter compact code for tight displays (AB, CH, PR, CO, ER, CD). */
  shortCode: string
  /** Current operational health state. */
  health: HealthState
  /** Seconds since last restart. */
  uptime: number
  /** Latest response time in milliseconds. */
  responseTimeMs: number
  /** Number of active alerts. */
  alertCount: number
  /** Number of active tasks or agents. */
  activeWork: number
  /** Deployed version string. */
  version: string
  /** Data freshness indicator. */
  freshness: 'LIVE' | 'STALE'
  /** Memory usage as a percentage (0-100). */
  memoryUsagePct: number
  /** CPU usage as a percentage (0-100). */
  cpuUsagePct: number
}

// ---------------------------------------------------------------------------
// Activity feed
// ---------------------------------------------------------------------------

/** Activity event for the ticker and feed panel. */
export interface ActivityEvent {
  /** Unique event identifier. */
  id: string
  /** When the event occurred. */
  timestamp: Date
  /** Dotted verb describing the action (e.g. "DEPLOY.AGENT", "CHAT.MSG"). */
  verb: string
  /** District that originated or received the event. */
  target: DistrictId
  /** Outcome of the action. */
  status: 'OK' | 'WARN' | 'FAIL'
  /** Event category for filtering and color-coding. */
  category: 'data' | 'deploy' | 'system'
}

// ---------------------------------------------------------------------------
// Aggregate performance
// ---------------------------------------------------------------------------

/** Aggregate performance metrics for gauge components. */
export interface PerformanceMetrics {
  /** Overall system health as a percentage (0-100). */
  systemHealthPct: number
  /** Throughput quality as a percentage (0-100, higher = faster responses). */
  throughputPct: number
  /** Agent/task capacity headroom as a percentage (0-100). */
  agentCapacityPct: number
}

// ---------------------------------------------------------------------------
// Connection health
// ---------------------------------------------------------------------------

/** Health state of a data-flow connection between two districts. */
export interface ConnectionState {
  /** Source district, or null for hub-center connections. */
  fromId: DistrictId | null
  /** Destination district, or null for hub-center connections. */
  toId: DistrictId | null
  /** Connection health (derived from endpoint health). */
  health: HealthState
  /** Human-readable label (e.g. "AGENTS", "KNOWLEDGE"). */
  label: string
}

// ---------------------------------------------------------------------------
// Waveform / signal monitor
// ---------------------------------------------------------------------------

/** Waveform parameters for the signal pulse monitor visualization. */
export interface WaveformState {
  /** Base frequency multiplier (1.0 = calm, higher = stressed). */
  frequency: number
  /** Noise amplitude overlay (0 = clean signal, higher = noisy). */
  noise: number
}

// ---------------------------------------------------------------------------
// Complete snapshot
// ---------------------------------------------------------------------------

/** Complete enrichment snapshot -- the full state pushed to the store each cycle. */
export interface EnrichmentSnapshot {
  /** Per-district enrichment telemetry keyed by DistrictId. */
  districts: Record<DistrictId, DistrictEnrichment>
  /** Chronological activity log (newest first, max 50 entries). */
  activityLog: ActivityEvent[]
  /** Aggregate performance gauge values. */
  performance: PerformanceMetrics
  /** Connection health states between districts. */
  connections: ConnectionState[]
  /** Signal pulse monitor waveform parameters. */
  waveform: WaveformState
  /** Seconds elapsed since page load (advanced by 2 each cycle tick). */
  systemEpoch: number
  /** Currently focused (hovered) district, or null. */
  focusedDistrictId: DistrictId | null
}
