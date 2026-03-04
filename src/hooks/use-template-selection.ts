'use client'

/**
 * useTemplateSelection -- Integration hook for dynamic station template selection.
 *
 * Wires together DynamicStationTemplateRegistry, SystemStateProvider,
 * ReceiptStore, and AIRouter. Returns the currently selected template
 * set for a district, re-evaluating when the system snapshot changes.
 *
 * Re-selection is debounced: the system does not re-score on every
 * telemetry poll. It waits for a meaningful state change (health transition,
 * alert count change) before re-evaluating.
 *
 * References: AD-5 (adaptive polling), AD-7 (template selection)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { SystemStateProvider, SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import type { AIRouter } from '@/lib/interfaces/ai-router'
import type {
  SelectionResult,
  SelectionConfig,
  PinnedOverride,
} from '@/lib/template-selection/types'
import { DEFAULT_SELECTION_CONFIG } from '@/lib/template-selection/types'
import { selectTemplates } from '@/lib/template-selection/template-selector'
import { recordSelectionReceipt } from '@/lib/template-selection/selection-receipt'

// ============================================================================
// Types
// ============================================================================

export interface UseTemplateSelectionOptions {
  /** The district to select templates for. */
  readonly districtId: AppIdentifier
  /** The station template registry instance. */
  readonly registry: StationTemplateRegistry
  /** The system state provider instance. */
  readonly systemState: SystemStateProvider
  /** The receipt store instance. */
  readonly receiptStore: ReceiptStore
  /** The AI router instance (optional -- null disables AI tie-breaking). */
  readonly aiRouter: AIRouter | null
  /** Pinned overrides (from useTemplateBrowser or Zustand store). */
  readonly pinnedOverrides: readonly PinnedOverride[]
  /** Selection configuration overrides. */
  readonly config?: SelectionConfig
  /**
   * Debounce interval in ms for re-selection after snapshot changes.
   * Default: 2000 (2 seconds). Prevents re-selection on every poll cycle.
   */
  readonly debounceMs?: number
}

export interface UseTemplateSelectionReturn {
  /** The current selection result (null until first selection completes). */
  readonly result: SelectionResult | null
  /** Whether a selection is currently in progress. */
  readonly isSelecting: boolean
  /** Force an immediate re-selection (bypasses debounce). */
  readonly forceReselect: () => Promise<void>
}

// ============================================================================
// Hook
// ============================================================================

export function useTemplateSelection({
  districtId,
  registry,
  systemState,
  receiptStore,
  aiRouter,
  pinnedOverrides,
  config = DEFAULT_SELECTION_CONFIG,
  debounceMs = 2_000,
}: UseTemplateSelectionOptions): UseTemplateSelectionReturn {
  const [result, setResult] = useState<SelectionResult | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSnapshotKeyRef = useRef<string | null>(null)

  /**
   * Run the selection pipeline.
   */
  const runSelection = useCallback(async () => {
    const snapshot = systemState.getSnapshot()
    if (!snapshot) return

    setIsSelecting(true)
    try {
      const selectionResult = await selectTemplates(
        districtId,
        registry,
        snapshot,
        aiRouter,
        pinnedOverrides,
        config
      )

      setResult(selectionResult)

      // Record the selection as a receipt.
      await recordSelectionReceipt(selectionResult, receiptStore)
    } finally {
      setIsSelecting(false)
    }
  }, [districtId, registry, systemState, receiptStore, aiRouter, pinnedOverrides, config])

  /**
   * Detect meaningful state changes and debounce re-selection.
   * A "meaningful change" is defined as a change in:
   * - Any app's health state
   * - Any app's alert count
   * - The global system pulse
   */
  useEffect(() => {
    const unsubscribe = systemState.subscribe((snapshot: SystemSnapshot) => {
      const key = buildSnapshotKey(snapshot, districtId)

      if (key === prevSnapshotKeyRef.current) {
        // No meaningful change -- skip re-selection.
        return
      }

      prevSnapshotKeyRef.current = key

      // Debounce the re-selection.
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        void runSelection()
      }, debounceMs)
    })

    // Run initial selection.
    void runSelection()

    return () => {
      unsubscribe()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [systemState, districtId, debounceMs, runSelection])

  // Re-run selection when pins change.
  useEffect(() => {
    void runSelection()
  }, [pinnedOverrides, runSelection])

  const forceReselect = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    await runSelection()
  }, [runSelection])

  return { result, isSelecting, forceReselect }
}

// ============================================================================
// Snapshot Key Builder
// ============================================================================

/**
 * Build a string key from the parts of a SystemSnapshot that are
 * relevant to template selection. Changes to this key trigger re-selection.
 */
function buildSnapshotKey(snapshot: SystemSnapshot, districtId: AppIdentifier): string {
  const appState = snapshot.apps[districtId]
  const parts: string[] = [
    `health:${appState?.health ?? 'UNKNOWN'}`,
    `alerts:${appState?.alertCount ?? 0}`,
    `pulse:${snapshot.globalMetrics.systemPulse}`,
    `globalAlerts:${snapshot.globalMetrics.alertCount}`,
  ]
  return parts.join('|')
}
