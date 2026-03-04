/**
 * Delta computation for narrated telemetry.
 *
 * Pure functions that compare two SystemSnapshots and produce
 * AppDelta objects describing what changed for each app.
 * These deltas are the primary input to the narration prompt builder.
 *
 * The delta computer is intentionally side-effect-free: it takes
 * snapshots in, returns deltas out, and does not read any stores
 * or make any network calls.
 *
 * @module delta-computer
 * @see WS-3.6
 */

import type { AppIdentifier } from '@/lib/interfaces/types'
import { ALL_APP_IDS, APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type { AppState, SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { AppDelta } from './narration-types'

// ============================================================================
// Configuration
// ============================================================================

/**
 * Minimum change thresholds for triggering a narration.
 * If none of these thresholds are met, the app is skipped
 * to conserve Ollama capacity.
 */
export const CHANGE_THRESHOLDS = {
  /** Any health state change always triggers narration. */
  healthChange: true,
  /** Alert count change of +/- this many triggers narration. */
  alertCountDelta: 1,
  /** Response time change percentage triggers narration. */
  responseTimeDeltaPercent: 15,
  /** If no narration exists yet for this app, always generate one. */
  firstNarration: true,
} as const

// ============================================================================
// Single App Delta
// ============================================================================

/**
 * Compute the delta between the current and previous AppState for one app.
 *
 * @param appId - The app identifier.
 * @param current - Current AppState from SystemSnapshot.
 * @param previous - Previous AppState from the last cycle (null if first cycle).
 * @returns Computed AppDelta with all change metrics.
 */
export function computeAppDelta(
  appId: AppIdentifier,
  current: AppState,
  previous: AppState | null,
): AppDelta {
  const previousResponseTimeMs =
    (previous?.raw?.responseTimeMs as number | null) ?? null
  const currentResponseTimeMs =
    (current.raw?.responseTimeMs as number | null) ?? null

  let responseTimeDeltaPercent: number | null = null
  if (
    previousResponseTimeMs !== null &&
    currentResponseTimeMs !== null &&
    previousResponseTimeMs > 0
  ) {
    responseTimeDeltaPercent =
      ((currentResponseTimeMs - previousResponseTimeMs) / previousResponseTimeMs) * 100
  }

  const healthChanged =
    previous !== null && previous.health !== current.health
  const alertCountDelta = current.alertCount - (previous?.alertCount ?? 0)

  // Determine if the delta contains meaningful changes worth narrating
  const hasMeaningfulChange =
    previous === null || // First cycle -- always narrate
    healthChanged ||
    Math.abs(alertCountDelta) >= CHANGE_THRESHOLDS.alertCountDelta ||
    (responseTimeDeltaPercent !== null &&
      Math.abs(responseTimeDeltaPercent) >=
        CHANGE_THRESHOLDS.responseTimeDeltaPercent)

  return {
    appId,
    displayName: APP_DISPLAY_NAMES[appId],
    previousHealth: previous?.health ?? null,
    currentHealth: current.health,
    healthChanged,
    previousAlertCount: previous?.alertCount ?? 0,
    currentAlertCount: current.alertCount,
    alertCountDelta,
    previousResponseTimeMs,
    currentResponseTimeMs,
    responseTimeDeltaPercent,
    previousUptime: (previous?.raw?.uptime as number | null) ?? null,
    currentUptime: (current.raw?.uptime as number | null) ?? null,
    hasMeaningfulChange,
    pulse: current.pulse,
    freshnessMs: current.freshnessMs,
    checks: (current.raw?.checks as Record<string, string>) ?? {},
  }
}

// ============================================================================
// All Apps Delta
// ============================================================================

/**
 * Compute deltas for all apps between two snapshots.
 *
 * @param current - Current SystemSnapshot.
 * @param previous - Previous SystemSnapshot (null if first cycle).
 * @returns Array of AppDeltas for all known apps.
 */
export function computeDeltas(
  current: SystemSnapshot,
  previous: SystemSnapshot | null,
): AppDelta[] {
  return ALL_APP_IDS.map((appId) => {
    const currentApp = current.apps[appId]
    const previousApp = previous?.apps[appId] ?? null

    if (!currentApp) {
      // App not in snapshot -- generate a minimal "no data" delta
      return {
        appId,
        displayName: APP_DISPLAY_NAMES[appId],
        previousHealth: null,
        currentHealth: 'UNKNOWN' as const,
        healthChanged: false,
        previousAlertCount: 0,
        currentAlertCount: 0,
        alertCountDelta: 0,
        previousResponseTimeMs: null,
        currentResponseTimeMs: null,
        responseTimeDeltaPercent: null,
        previousUptime: null,
        currentUptime: null,
        hasMeaningfulChange: false,
        pulse: '',
        freshnessMs: null,
        checks: {},
      }
    }

    return computeAppDelta(appId, currentApp, previousApp)
  })
}
