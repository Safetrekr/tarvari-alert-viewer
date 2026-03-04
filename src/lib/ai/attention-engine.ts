/**
 * Attention engine -- pure rule functions for attention state determination.
 *
 * All functions in this module are pure: no side effects, no store access,
 * no DOM manipulation. They accept data and return computed results.
 * This makes them fully testable without mocking stores or DOM.
 *
 * The engine analyzes telemetry snapshots to determine whether the Launch
 * should be in 'calm' or 'tighten' mode, applies hysteresis to prevent
 * mode flicker, computes next-best-actions for the HUD, and identifies
 * anomalous apps for beacon glow modulation.
 *
 * @module attention-engine
 * @see WS-3.7 Section 4.3
 */

import type { AppIdentifier, HealthState } from '@/lib/interfaces/types'
import type { AppTelemetry, SystemSnapshot } from '@/lib/telemetry-types'
import type { AttentionState, NextBestAction } from '@/lib/ai/attention-types'

// ============================================================================
// Constants
// ============================================================================

/**
 * Health states that trigger tighten mode.
 * OFFLINE and UNKNOWN are excluded -- they represent intentional
 * absence or no-data, not active problems requiring attention.
 */
const ANOMALY_HEALTH_STATES: ReadonlySet<string> = new Set(['DEGRADED', 'DOWN'])

/**
 * Total alert count threshold across all apps that triggers tighten.
 * Individual apps may have alerts without triggering tighten if the
 * total count stays at or below this threshold.
 */
const ALERT_COUNT_TIGHTEN_THRESHOLD = 3

/**
 * Maximum number of next-best-actions returned.
 * More than 3 chips would clutter the HUD.
 */
const MAX_NEXT_BEST_ACTIONS = 3

/**
 * Priority weights for health states. Lower number = higher urgency.
 */
const HEALTH_PRIORITY: Record<HealthState, number> = {
  DOWN: 0,
  DEGRADED: 1,
  UNKNOWN: 2,
  OFFLINE: 3,
  OPERATIONAL: 4,
}

/**
 * Display names for app identifiers. Used in next-best-action labels.
 * Duplicated here to keep the engine free of store/interface imports
 * beyond the type system.
 */
const APP_DISPLAY_NAMES: Record<string, string> = {
  'agent-builder': 'Agent Builder',
  'tarva-chat': 'Tarva Chat',
  'project-room': 'Project Room',
  'tarva-core': 'TarvaCORE',
  'tarva-erp': 'TarvaERP',
  'tarva-code': 'tarvaCODE',
}

// ============================================================================
// Attention State Determination
// ============================================================================

/**
 * Determine the raw attention state from a SystemSnapshot.
 *
 * Rules (evaluated in priority order):
 * 1. If any app has status === 'DOWN', return 'tighten'.
 * 2. If any app has status === 'DEGRADED', return 'tighten'.
 * 3. If total alertCount across all apps > 3, return 'tighten'.
 * 4. Otherwise, return 'calm'.
 *
 * This function does NOT apply hysteresis. The caller (the attention
 * store) manages hysteresis state across polling cycles.
 *
 * @param snapshot - Current system telemetry snapshot.
 * @returns Raw attention state before hysteresis.
 */
export function computeRawAttentionState(snapshot: SystemSnapshot): AttentionState {
  let totalAlertCount = 0

  for (const app of Object.values(snapshot.apps)) {
    // Check for anomalous health states
    if (ANOMALY_HEALTH_STATES.has(app.status)) {
      return 'tighten'
    }
    totalAlertCount += app.alertCount
  }

  // Check aggregate alert count
  if (totalAlertCount > ALERT_COUNT_TIGHTEN_THRESHOLD) {
    return 'tighten'
  }

  return 'calm'
}

// ============================================================================
// Hysteresis
// ============================================================================

/**
 * Apply hysteresis to prevent mode flicker.
 *
 * When transitioning from 'tighten' to 'calm', the raw state must
 * be 'calm' for `calmThreshold` consecutive evaluations.
 * Transitioning from 'calm' to 'tighten' is immediate (no delay --
 * anomalies should be surfaced instantly).
 *
 * @param rawState - The freshly computed raw attention state.
 * @param currentState - The current (hysteresis-applied) attention state.
 * @param consecutiveCalmCount - Number of consecutive calm-eligible snapshots.
 * @param calmThreshold - Required consecutive calm snapshots to exit tighten.
 * @returns Tuple of [new attention state, new consecutive calm count].
 */
export function applyHysteresis(
  rawState: AttentionState,
  currentState: AttentionState,
  consecutiveCalmCount: number,
  calmThreshold: number,
): [AttentionState, number] {
  // Calm -> Tighten: immediate
  if (rawState === 'tighten') {
    return ['tighten', 0]
  }

  // Already calm + raw calm: stay calm
  if (currentState === 'calm') {
    return ['calm', 0]
  }

  // Tighten + raw calm: increment counter, check threshold
  const newCount = consecutiveCalmCount + 1
  if (newCount >= calmThreshold) {
    return ['calm', 0]
  }
  return ['tighten', newCount]
}

// ============================================================================
// Next-Best-Actions Computation
// ============================================================================

/**
 * Compute next-best-actions from the current system state.
 *
 * Only produces actions when the attention state is 'tighten'.
 * Returns an empty array when calm.
 *
 * Actions are generated for:
 * 1. Apps with status === 'DOWN' (highest priority)
 * 2. Apps with status === 'DEGRADED'
 * 3. Apps with alertCount > 0 (even if status is OPERATIONAL)
 *
 * Maximum 3 actions returned, sorted by priority.
 *
 * @param snapshot - Current system telemetry snapshot.
 * @param attentionState - Current attention state (after hysteresis).
 * @returns Prioritized action suggestions.
 */
export function computeNextBestActions(
  snapshot: SystemSnapshot,
  attentionState: AttentionState,
): NextBestAction[] {
  if (attentionState === 'calm') {
    return []
  }

  const actions: NextBestAction[] = []

  for (const [id, app] of Object.entries(snapshot.apps)) {
    const appId = id as AppIdentifier
    const displayName = APP_DISPLAY_NAMES[appId] ?? appId

    // Skip offline/unknown -- they are not actionable anomalies
    if (app.status === 'OFFLINE' || app.status === 'UNKNOWN') {
      continue
    }

    // Generate action for DOWN apps
    if (app.status === 'DOWN') {
      actions.push({
        id: `nba-${appId}-navigate`,
        label: `${displayName} -- DOWN`,
        districtId: appId,
        action: 'navigate',
        priority: HEALTH_PRIORITY.DOWN,
        reason: 'Service is not responding',
        health: app.status,
      })
      continue
    }

    // Generate action for DEGRADED apps
    if (app.status === 'DEGRADED') {
      actions.push({
        id: `nba-${appId}-navigate`,
        label: `${displayName} -- degraded`,
        districtId: appId,
        action: 'navigate',
        priority: HEALTH_PRIORITY.DEGRADED,
        reason: 'Running with reduced capability',
        health: app.status,
      })
      continue
    }

    // Generate action for apps with alerts (but otherwise healthy)
    if (app.alertCount > 0) {
      actions.push({
        id: `nba-${appId}-navigate`,
        label: `${displayName} -- ${app.alertCount} alert${app.alertCount > 1 ? 's' : ''}`,
        districtId: appId,
        action: 'navigate',
        priority: HEALTH_PRIORITY.OPERATIONAL + 0.5, // Slightly lower than DEGRADED
        reason: `${app.alertCount} active alert${app.alertCount > 1 ? 's' : ''}`,
        health: app.status,
      })
    }
  }

  // Sort by priority (lowest number = highest urgency), take top 3
  return actions.sort((a, b) => a.priority - b.priority).slice(0, MAX_NEXT_BEST_ACTIONS)
}

// ============================================================================
// Anomalous App Identification
// ============================================================================

/**
 * Returns the set of AppIdentifiers that are currently anomalous.
 * Used by beacon glow modulation to determine which beacons to amplify.
 *
 * An app is considered anomalous if:
 * - Its status is DEGRADED or DOWN, OR
 * - Its alertCount > 0
 *
 * @param snapshot - Current system telemetry snapshot.
 * @returns Set of anomalous app identifiers.
 */
export function getAnomalousApps(snapshot: SystemSnapshot): ReadonlySet<AppIdentifier> {
  const anomalous = new Set<AppIdentifier>()
  for (const [id, app] of Object.entries(snapshot.apps)) {
    if (ANOMALY_HEALTH_STATES.has(app.status) || app.alertCount > 0) {
      anomalous.add(id as AppIdentifier)
    }
  }
  return anomalous
}

// ============================================================================
// Utility: Build SystemSnapshot from districts store data
// ============================================================================

/**
 * Assemble a SystemSnapshot from the districts store data.
 *
 * The districts store holds `Record<string, AppTelemetry>` keyed by
 * district id. This helper wraps that data into the SystemSnapshot
 * shape that the attention engine expects.
 *
 * @param districts - District telemetry keyed by district id.
 * @param timestamp - ISO timestamp of the snapshot.
 * @returns A SystemSnapshot suitable for the attention engine.
 */
export function buildSnapshotFromDistricts(
  districts: Record<string, AppTelemetry>,
  timestamp: string,
): SystemSnapshot {
  const apps = districts
  let operational = 0
  let degraded = 0
  let down = 0
  let offline = 0
  let unknown = 0

  for (const app of Object.values(apps)) {
    switch (app.status) {
      case 'OPERATIONAL':
        operational++
        break
      case 'DEGRADED':
        degraded++
        break
      case 'DOWN':
        down++
        break
      case 'OFFLINE':
        offline++
        break
      case 'UNKNOWN':
        unknown++
        break
    }
  }

  return {
    timestamp,
    apps,
    summary: {
      total: Object.keys(apps).length,
      operational,
      degraded,
      down,
      offline,
      unknown,
    },
  }
}
