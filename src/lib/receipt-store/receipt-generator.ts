/**
 * Receipt generator for non-station mutation actions.
 *
 * Station actions generate receipts via useReceiptStamp (WS-2.6).
 * This module generates receipts for mutations that happen OUTSIDE
 * station panels:
 *
 * - Login success
 * - Navigation (district focus, return-to-hub, constellation view)
 * - System events (telemetry state change, error detection)
 *
 * Each function returns a ReceiptInput that can be passed to
 * ReceiptStore.record().
 *
 * References:
 * - AD-6: "only meaningful actions generate receipts"
 * - combined-recommendations.md: "receipt generation for all mutation actions"
 */

import type { ReceiptInput } from '@/lib/interfaces/receipt-store'
import type {
  AppIdentifier,
  HealthState,
  SemanticLevel,
} from '@/lib/interfaces/types'
import type { CameraTarget } from '@/lib/interfaces/camera-controller'

// ============================================================================
// Login Receipt
// ============================================================================

/**
 * Generate a receipt for successful login.
 *
 * Per combined-recommendations.md Login Experience:
 * "Success: receipt stamp animation (trace ID + timestamp)"
 */
export function createLoginReceipt(): ReceiptInput {
  return {
    source: 'launch',
    eventType: 'action',
    severity: 'info',
    summary: 'Login: Authentication successful',
    detail: { action: 'login', method: 'passphrase' },
    actor: 'human',
    location: {
      semanticLevel: 'Z1',
      district: null,
      station: null,
    },
  }
}

// ============================================================================
// Navigation Receipts
// ============================================================================

/**
 * Generate a receipt for navigating to a district.
 *
 * Created when the user clicks a capsule, uses the command palette,
 * or when the AI Camera Director navigates to a district.
 */
export function createNavigationReceipt(params: {
  districtId: AppIdentifier
  districtName: string
  source: 'manual' | 'ai' | 'command-palette'
  fromLevel: SemanticLevel
  toLevel: SemanticLevel
}): ReceiptInput {
  const actorMap = {
    manual: 'human' as const,
    ai: 'ai' as const,
    'command-palette': 'human' as const,
  }

  return {
    source: 'launch',
    eventType: 'navigation',
    severity: 'info',
    summary: `Navigate: ${params.districtName} (${params.fromLevel} -> ${params.toLevel})`,
    detail: {
      action: 'navigate',
      districtId: params.districtId,
      fromLevel: params.fromLevel,
      toLevel: params.toLevel,
      trigger: params.source,
    },
    actor: actorMap[params.source],
    location: {
      semanticLevel: params.toLevel,
      district: params.districtId,
      station: null,
    },
    target: {
      type: 'district',
      districtId: params.districtId,
    } as CameraTarget,
    tags: [params.districtId, 'navigation', params.source],
  }
}

/**
 * Generate a receipt for returning to the Launch Atrium (home).
 */
export function createReturnToHubReceipt(params: {
  fromLevel: SemanticLevel
  fromDistrict: AppIdentifier | null
}): ReceiptInput {
  return {
    source: 'launch',
    eventType: 'navigation',
    severity: 'info',
    summary: 'Navigate: Return to Launch Atrium',
    detail: {
      action: 'return-to-hub',
      fromLevel: params.fromLevel,
      fromDistrict: params.fromDistrict,
    },
    actor: 'human',
    location: {
      semanticLevel: 'Z1',
      district: null,
      station: null,
    },
    target: { type: 'home' } as CameraTarget,
    tags: ['navigation', 'home'],
  }
}

/**
 * Generate a receipt for entering the Constellation view (Z0).
 */
export function createConstellationViewReceipt(params: { fromLevel: SemanticLevel }): ReceiptInput {
  return {
    source: 'launch',
    eventType: 'navigation',
    severity: 'info',
    summary: 'Navigate: Constellation view (Z0 overview)',
    detail: {
      action: 'constellation-view',
      fromLevel: params.fromLevel,
    },
    actor: 'human',
    location: {
      semanticLevel: 'Z0',
      district: null,
      station: null,
    },
    target: { type: 'constellation' } as CameraTarget,
    tags: ['navigation', 'constellation', 'z0'],
  }
}

// ============================================================================
// System Event Receipts
// ============================================================================

/**
 * Generate a receipt for a telemetry state change.
 *
 * Created when an app's health state transitions (e.g., OPERATIONAL -> DOWN).
 * Only state changes generate receipts, not every poll.
 */
export function createHealthChangeReceipt(params: {
  appId: AppIdentifier
  appName: string
  previousState: HealthState
  newState: HealthState
}): ReceiptInput {
  const severityMap: Record<HealthState, ReceiptInput['severity']> = {
    OPERATIONAL: 'info',
    DEGRADED: 'warning',
    DOWN: 'error',
    OFFLINE: 'info',
    UNKNOWN: 'info',
  }

  return {
    source: params.appId,
    eventType: 'system',
    severity: severityMap[params.newState],
    summary: `Health: ${params.appName} ${params.previousState} -> ${params.newState}`,
    detail: {
      action: 'health-change',
      appId: params.appId,
      previousState: params.previousState,
      newState: params.newState,
    },
    actor: 'system',
    location: {
      semanticLevel: 'Z1',
      district: params.appId,
      station: null,
    },
    target: {
      type: 'district',
      districtId: params.appId,
    } as CameraTarget,
    tags: [params.appId, 'health', params.newState.toLowerCase()],
  }
}

/**
 * Generate a receipt for an error detected during telemetry polling.
 */
export function createTelemetryErrorReceipt(params: {
  appId: AppIdentifier
  appName: string
  error: string
}): ReceiptInput {
  return {
    source: params.appId,
    eventType: 'error',
    severity: 'error',
    summary: `Error: ${params.appName} telemetry failed`.slice(0, 120),
    detail: {
      action: 'telemetry-error',
      appId: params.appId,
      error: params.error,
    },
    actor: 'system',
    location: {
      semanticLevel: 'Z1',
      district: params.appId,
      station: null,
    },
    tags: [params.appId, 'error', 'telemetry'],
  }
}
