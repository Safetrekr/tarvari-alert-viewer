/**
 * District type definitions and constants for the Launch Atrium.
 *
 * Defines the 6 Tarva districts, health states, telemetry shape,
 * and the health-to-color mapping consumed by capsule components.
 *
 * @module district
 * @see WS-1.2 Section 4.1
 */

// ---------------------------------------------------------------------------
// District identity
// ---------------------------------------------------------------------------

/** Unique identifier for each Tarva district. */
export type DistrictId =
  | 'agent-builder'
  | 'tarva-chat'
  | 'project-room'
  | 'tarva-core'
  | 'tarva-erp'
  | 'tarva-code'

/** Operational health state of a district. */
export type HealthState =
  | 'OPERATIONAL'
  | 'DEGRADED'
  | 'DOWN'
  | 'OFFLINE'
  | 'UNKNOWN'

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

/** Universal telemetry fields surfaced by every district capsule. */
export interface CapsuleTelemetry {
  /** Current health state. */
  health: HealthState
  /** Human-readable pulse/heartbeat string (e.g. "120 rpm"). */
  pulse: string
  /** Human-readable last event description (e.g. "2m ago"). */
  lastEvent: string
  /** Active alert count. */
  alerts: number
  /** Data freshness indicator (e.g. "LIVE", "STALE"). */
  freshness: string
}

// ---------------------------------------------------------------------------
// District metadata
// ---------------------------------------------------------------------------

/** Static metadata for a single district. */
export interface DistrictMeta {
  /** Unique district identifier. */
  id: DistrictId
  /** Full display name (e.g. "Agent Builder"). */
  displayName: string
  /** Abbreviated name for tight spaces (e.g. "BUILDER"). */
  shortName: string
  /** Position index in the capsule ring (0-5). */
  ringIndex: 0 | 1 | 2 | 3 | 4 | 5
  /** Dev server port, or null for desktop/CLI apps. */
  port: number | null
}

// ---------------------------------------------------------------------------
// Capsule data (metadata + telemetry + sparkline)
// ---------------------------------------------------------------------------

/** Complete data payload for a single capsule in the ring. */
export interface CapsuleData {
  /** Static district metadata. */
  district: DistrictMeta
  /** Live telemetry snapshot. */
  telemetry: CapsuleTelemetry
  /** Array of numeric data points for the sparkline chart. */
  sparklineData: number[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** All 6 Tarva districts, ordered by ring position. */
export const DISTRICTS: readonly DistrictMeta[] = [
  {
    id: 'agent-builder',
    displayName: 'Agent Builder',
    shortName: 'BUILDER',
    ringIndex: 0,
    port: 3000,
  },
  {
    id: 'tarva-chat',
    displayName: 'Tarva Chat',
    shortName: 'CHAT',
    ringIndex: 1,
    port: 4000,
  },
  {
    id: 'project-room',
    displayName: 'Project Room',
    shortName: 'PROJECTS',
    ringIndex: 2,
    port: 3005,
  },
  {
    id: 'tarva-core',
    displayName: 'TarvaCORE',
    shortName: 'CORE',
    ringIndex: 3,
    port: null,
  },
  {
    id: 'tarva-erp',
    displayName: 'TarvaERP',
    shortName: 'ERP',
    ringIndex: 4,
    port: null,
  },
  {
    id: 'tarva-code',
    displayName: 'tarvaCODE',
    shortName: 'CODE',
    ringIndex: 5,
    port: null,
  },
] as const

/**
 * Maps each HealthState to its CSS color token, glow token,
 * StatusBadge category, dot animation, and accessible label.
 */
export const HEALTH_STATE_MAP: Record<
  HealthState,
  {
    /** CSS custom property name for the status color. */
    color: string
    /** CSS custom property name for the glow box-shadow. */
    glowToken: string
    /** StatusBadge category for @tarva/ui integration. */
    statusCategory: 'success' | 'warning' | 'danger' | 'neutral' | 'muted'
    /** Whether the status dot should pulse. */
    dotAnimation: 'pulse' | 'none'
    /** Human-readable health label. */
    label: string
  }
> = {
  OPERATIONAL: {
    color: '--color-healthy',
    glowToken: '--glow-healthy',
    statusCategory: 'success',
    dotAnimation: 'pulse',
    label: 'Operational',
  },
  DEGRADED: {
    color: '--color-warning',
    glowToken: '--glow-warning',
    statusCategory: 'warning',
    dotAnimation: 'none',
    label: 'Degraded',
  },
  DOWN: {
    color: '--color-error',
    glowToken: '--glow-error',
    statusCategory: 'danger',
    dotAnimation: 'pulse',
    label: 'Down',
  },
  OFFLINE: {
    color: '--color-offline',
    glowToken: '',
    statusCategory: 'neutral',
    dotAnimation: 'none',
    label: 'Offline',
  },
  UNKNOWN: {
    color: '--color-offline',
    glowToken: '',
    statusCategory: 'muted',
    dotAnimation: 'none',
    label: 'Unknown',
  },
}

// ---------------------------------------------------------------------------
// Constellation View (Z0) types
// ---------------------------------------------------------------------------

/** Two-letter compact codes for Z0 beacon labels. */
export type DistrictCode = 'AB' | 'CH' | 'PR' | 'CO' | 'ER' | 'CD'

/** Maps DistrictId to its compact code for Z0 display. */
export const DISTRICT_CODES: Record<DistrictId, DistrictCode> = {
  'agent-builder': 'AB',
  'tarva-chat': 'CH',
  'project-room': 'PR',
  'tarva-core': 'CO',
  'tarva-erp': 'ER',
  'tarva-code': 'CD',
} as const

/** Data shape for a single beacon at Z0. */
export interface BeaconData {
  /** District identifier. */
  id: DistrictId
  /** Compact two-letter code. */
  code: DistrictCode
  /** Current health state (drives color + glow). */
  health: HealthState
  /** Number of active alerts for this district. */
  alerts: number
  /** Ring position index (0-5, same as capsule positions). */
  ringIndex: number
}

/** Three aggregate metrics displayed at Z0. */
export interface ConstellationMetrics {
  /** Total alert count across all districts. */
  alertCount: number
  /** Total active work items (sum of pulse counts). */
  activeWork: number
  /** Worst health state across all districts (worst-of-five). */
  systemPulse: HealthState
}

// ---------------------------------------------------------------------------
// Mock data for initial rendering
// ---------------------------------------------------------------------------

/** Sample sparkline data (12 points). */
function generateSparklineData(): number[] {
  return [42, 55, 48, 62, 58, 71, 65, 78, 72, 85, 80, 88]
}

/** Demo telemetry for all 6 districts. */
export const MOCK_CAPSULE_DATA: CapsuleData[] = DISTRICTS.map((district) => ({
  district,
  telemetry: {
    health: 'OPERATIONAL' as HealthState,
    pulse: district.port ? `${60 + district.ringIndex * 12} rpm` : '--',
    lastEvent: district.port ? `${district.ringIndex + 1}m ago` : '--',
    alerts: district.ringIndex === 1 ? 2 : 0,
    freshness: district.port ? 'LIVE' : 'STALE',
  },
  sparklineData: generateSparklineData(),
}))
