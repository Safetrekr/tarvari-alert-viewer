/**
 * Shared domain types for Tarva Launch.
 *
 * These types form the vocabulary of the Launch's core interfaces.
 * Every type here is referenced by at least two interface contracts.
 *
 * References:
 * - Gap #2 (Spine Object Model)
 * - Gap #3 (Status Model)
 * - Gap #4 (App Naming)
 * - AD-1 (Camera State Management)
 * - AD-2 (Semantic Zoom with Hysteresis)
 * - AD-6 (Receipt System)
 * - IA Assessment Sections 2-5
 */

// ============================================================================
// App Identity
// ============================================================================

/**
 * Canonical application identifiers.
 * Matches the `code/ID` column in Gap #4 (App Naming).
 * tarvaCODE is included as a stub district per stakeholder directive.
 */
export type AppIdentifier =
  | 'agent-builder'
  | 'tarva-chat'
  | 'project-room'
  | 'tarva-core'
  | 'tarva-erp'
  | 'tarva-code'

/** Display names for each app. Used in capsules, breadcrumbs, and receipts. */
export const APP_DISPLAY_NAMES: Readonly<Record<AppIdentifier, string>> = {
  'agent-builder': 'Agent Builder',
  'tarva-chat': 'Tarva Chat',
  'project-room': 'Project Room',
  'tarva-core': 'TarvaCORE',
  'tarva-erp': 'TarvaERP',
  'tarva-code': 'tarvaCODE',
} as const

/** Two-letter codes for Z0 beacon labels. Per IA Assessment Section 4. */
export const APP_SHORT_CODES: Readonly<Record<AppIdentifier, string>> = {
  'agent-builder': 'AB',
  'tarva-chat': 'CH',
  'project-room': 'PR',
  'tarva-core': 'CO',
  'tarva-erp': 'ER',
  'tarva-code': 'CD',
} as const

/** All known app identifiers as a readonly array. */
export const ALL_APP_IDS: readonly AppIdentifier[] = [
  'agent-builder',
  'tarva-chat',
  'project-room',
  'tarva-core',
  'tarva-erp',
  'tarva-code',
] as const

// ============================================================================
// Health & Telemetry
// ============================================================================

/**
 * Five-state health model per Gap #3 (Status Model).
 *
 * - OPERATIONAL: All checks passing. Green, pulsing.
 * - DEGRADED: Running with reduced capability. Amber, steady.
 * - DOWN: Previously operational, now unresponsive. Red, flashing.
 * - OFFLINE: Not running, expected. Dim/muted, no pulse.
 * - UNKNOWN: No telemetry connection ever established. Gray, dashed.
 */
export type HealthState = 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'OFFLINE' | 'UNKNOWN'

/**
 * Status colors per Gap #3 and VISUAL-DESIGN-SPEC.md.
 * Maps to @tarva/ui status token variables.
 */
export const HEALTH_COLORS: Readonly<Record<HealthState, string>> = {
  OPERATIONAL: 'var(--status-success)',
  DEGRADED: 'var(--status-warning)',
  DOWN: 'var(--status-danger)',
  OFFLINE: 'var(--status-neutral)',
  UNKNOWN: 'var(--status-neutral)',
} as const

// ============================================================================
// Spatial Navigation
// ============================================================================

/**
 * Semantic zoom levels per AD-2.
 *
 * - Z0 Constellation: zoom < 0.27. Districts as luminous beacons.
 * - Z1 Launch Atrium: zoom 0.30-0.79. Capsules with status strips.
 * - Z2 District: zoom 0.80-1.49. Selected app with 3-5 stations.
 * - Z3 Station: zoom >= 1.50. Tight functional panels.
 */
export type SemanticLevel = 'Z0' | 'Z1' | 'Z2' | 'Z3'

/** Camera position in world coordinates. */
export interface CameraPosition {
  /** Horizontal offset in world pixels. 0 = center. */
  readonly offsetX: number
  /** Vertical offset in world pixels. 0 = center. */
  readonly offsetY: number
  /** Zoom factor. 0.08 (far Z0) to 3.0 (close Z3). Default landing: 0.50. */
  readonly zoom: number
}

/**
 * Spatial location context. Captures WHERE in the Launch an event originated.
 * Stored in receipts and used for receipt rehydration (viewport restore).
 */
export interface SpatialLocation {
  readonly semanticLevel: SemanticLevel
  readonly district: AppIdentifier | null
  readonly station: string | null
}

// ============================================================================
// Spine Object Model (Gap #2)
// ============================================================================

/**
 * Activity types per Gap #2 (Spine Object Model).
 * "Activity" is the Launch-level supertype that resolves the "Run" collision.
 *
 * At Z0-Z1: "12 activities". At Z2-Z3: "3 generation runs" (Builder).
 */
export type ActivityType =
  | 'generation_run'
  | 'agent_execution'
  | 'conversation'
  | 'reasoning_session'

/** Universal activity statuses across all app types. */
export type ActivityStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'

// ============================================================================
// Receipt Classification (IA Assessment Section 5)
// ============================================================================

/** Receipt event types. Used for Evidence Ledger faceted filtering. */
export type EventType = 'navigation' | 'action' | 'error' | 'approval' | 'system'

/** Severity levels. Used for Evidence Ledger faceted filtering. */
export type Severity = 'info' | 'warning' | 'error' | 'critical'

/**
 * Receipt source. 'launch' for events generated by the Launch itself.
 * App identifiers for events observed from external apps.
 */
export type ReceiptSource = 'launch' | AppIdentifier

/** Actor type for receipt attribution. */
export type Actor = 'human' | 'ai' | 'system'

// ============================================================================
// Utility Types
// ============================================================================

/** Unsubscribe function returned by subscribe() methods. */
export type Unsubscribe = () => void

/** ISO 8601 timestamp string with milliseconds. */
export type ISOTimestamp = string
