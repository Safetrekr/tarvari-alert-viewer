/**
 * useBuilderMode -- orchestration hook for Builder Mode.
 *
 * Wires together:
 * - builder.store (session state)
 * - ai.store (Claude provider status)
 * - settings.store (AI beta toggle)
 * - auth.store (authentication check)
 * - StationProposalGenerator (Claude integration via /api/ai/claude)
 * - DynamicStationTemplateRegistry (template promotion)
 * - ReceiptStore (audit trail)
 * - Builder gate (authorization)
 *
 * This hook is the single entry point for all Builder Mode operations.
 * Components consume this hook, not the individual modules.
 *
 * References: WS-3.4 (ai.store pattern), WS-3.5 (template registration)
 */

import { useCallback, useMemo, useRef } from 'react'
import { useBuilderStore, builderSelectors } from '@/stores/builder.store'
import { useAIStore } from '@/stores/ai.store'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore, settingsSelectors } from '@/stores/settings.store'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { SystemStateProvider } from '@/lib/interfaces/system-state-provider'
import { checkBuilderGate, type BuilderGateInput } from '@/lib/ai/builder-gate'
import { StationProposalGenerator } from '@/lib/ai/station-proposal-generator'
import { builderReceipts } from '@/lib/ai/builder-receipt'
import type { BuilderGateResult } from '@/lib/ai/builder-types'

// ============================================================================
// Hook Input
// ============================================================================

export interface UseBuilderModeInput {
  readonly receiptStore: ReceiptStore
  readonly templateRegistry: StationTemplateRegistry
  readonly systemStateProvider: SystemStateProvider
}

// ============================================================================
// Hook Return
// ============================================================================

export interface UseBuilderModeReturn {
  // State
  readonly panelOpen: boolean
  readonly isGenerating: boolean
  readonly hasProposal: boolean
  readonly canSubmit: boolean
  readonly phase: string
  readonly session: ReturnType<typeof useBuilderStore.getState>['session']
  readonly iterationCount: number
  readonly createdCount: number

  // Gate
  readonly gateResult: BuilderGateResult

  // Actions
  readonly open: () => void
  readonly close: () => void
  readonly setDescription: (description: string) => void
  readonly setTargetDistrict: (districtId: AppIdentifier) => void
  readonly submit: () => Promise<void>
  readonly accept: () => Promise<void>
  readonly reject: () => Promise<void>
  readonly iterate: () => void
  readonly reset: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function useBuilderMode(input: UseBuilderModeInput): UseBuilderModeReturn {
  const { receiptStore, templateRegistry, systemStateProvider } = input

  // Store state
  const panelOpen = useBuilderStore((s) => builderSelectors.isPanelOpen(s))
  const isGenerating = useBuilderStore((s) => builderSelectors.isGenerating(s))
  const hasProposal = useBuilderStore((s) => builderSelectors.hasProposal(s))
  const canSubmit = useBuilderStore((s) => builderSelectors.canSubmit(s))
  const phase = useBuilderStore((s) => builderSelectors.currentPhase(s))
  const session = useBuilderStore((s) => s.session)
  const iterationCount = useBuilderStore((s) => builderSelectors.iterationCount(s))
  const createdCount = useBuilderStore((s) => builderSelectors.createdTemplateCount(s))

  // Auth store -- real authentication check
  const isAuthenticated = useAuthStore((s) => s.authenticated)
  // Settings store -- AI beta toggle
  const aiBetaEnabled = useSettingsStore((s) => settingsSelectors.isAIAvailable(s))
  // AI store -- Claude provider availability
  const claudeAvailable = useAIStore((s) => s.providerStatuses.claude?.available ?? false)

  // Builder store actions
  const storeActions = useBuilderStore()

  // Generator (stable reference)
  const generatorRef = useRef(new StationProposalGenerator())

  // Gate check
  const gateResult = useMemo((): BuilderGateResult => {
    const gateInput: BuilderGateInput = {
      isAuthenticated,
      aiBetaEnabled,
      claudeAvailable,
      currentPhase: phase,
    }
    return checkBuilderGate(gateInput)
  }, [isAuthenticated, aiBetaEnabled, claudeAvailable, phase])

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  const open = useCallback(() => {
    if (gateResult.allowed) {
      storeActions.openBuilder()
      const currentSession = useBuilderStore.getState().session
      if (currentSession) {
        builderReceipts.sessionStart(receiptStore, currentSession)
      }
    }
  }, [gateResult.allowed, receiptStore, storeActions])

  const close = useCallback(() => {
    storeActions.closeBuilder()
  }, [storeActions])

  const setDescription = useCallback(
    (description: string) => {
      storeActions.setDescription(description)
    },
    [storeActions]
  )

  const setTargetDistrict = useCallback(
    (districtId: AppIdentifier) => {
      storeActions.setTargetDistrict(districtId)
    },
    [storeActions]
  )

  const submit = useCallback(async () => {
    const currentSession = useBuilderStore.getState().session
    if (!currentSession || !currentSession.targetDistrictId) return
    if (!gateResult.allowed) return

    storeActions.startGenerating()

    const snapshot = systemStateProvider.getSnapshot()

    if (!snapshot) {
      storeActions.setError('System snapshot unavailable. Cannot generate proposal.')
      return
    }

    const result = await generatorRef.current.generate(
      currentSession.description,
      currentSession.targetDistrictId,
      currentSession.id,
      templateRegistry,
      snapshot,
      currentSession.iterations
    )

    if (result.success && result.proposal) {
      storeActions.setProposal(result.proposal)

      // Record AI cost.
      useAIStore.getState().recordAICost('claude', 'builder-mode')

      // Record receipt.
      const updatedSession = useBuilderStore.getState().session!
      await builderReceipts.proposalGenerated(receiptStore, updatedSession, result.proposal)
    } else {
      storeActions.setError(result.error ?? 'Unknown generation error.')

      const updatedSession = useBuilderStore.getState().session!
      await builderReceipts.generationFailed(
        receiptStore,
        updatedSession,
        result.error ?? 'Unknown error'
      )
    }
  }, [
    gateResult.allowed,
    storeActions,
    systemStateProvider,
    templateRegistry,
    receiptStore,
  ])

  const accept = useCallback(async () => {
    const currentSession = useBuilderStore.getState().session
    if (!currentSession?.currentProposal) return

    const proposal = currentSession.currentProposal

    // Promote template to registry.
    templateRegistry.registerTemplate(proposal.template)

    // Track in store.
    storeActions.acceptProposal()
    storeActions.trackCreatedTemplate(proposal.template.id)

    // Record receipt.
    const updatedSession = useBuilderStore.getState().session!
    await builderReceipts.proposalAccepted(receiptStore, updatedSession, proposal)
  }, [storeActions, templateRegistry, receiptStore])

  const reject = useCallback(async () => {
    const currentSession = useBuilderStore.getState().session
    if (!currentSession?.currentProposal) return

    const proposal = currentSession.currentProposal

    storeActions.rejectProposal()

    const updatedSession = useBuilderStore.getState().session!
    await builderReceipts.proposalRejected(receiptStore, updatedSession, proposal)
  }, [storeActions, receiptStore])

  const iterate = useCallback(() => {
    const currentSession = useBuilderStore.getState().session
    if (currentSession) {
      builderReceipts.iterationStart(receiptStore, currentSession)
    }
    storeActions.startIteration()
  }, [storeActions, receiptStore])

  const reset = useCallback(() => {
    storeActions.resetBuilder()
  }, [storeActions])

  return {
    panelOpen,
    isGenerating,
    hasProposal,
    canSubmit,
    phase,
    session,
    iterationCount,
    createdCount,
    gateResult,
    open,
    close,
    setDescription,
    setTargetDistrict,
    submit,
    accept,
    reject,
    iterate,
    reset,
  }
}
