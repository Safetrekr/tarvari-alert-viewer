'use client'

/**
 * useTemplateBrowser -- UI state management for the template browser panel.
 *
 * Manages:
 * - Open/close state of the browser dialog
 * - Search/filter within the browser
 * - Pinned overrides (session-scoped, stored in component state)
 * - Receipt generation for pin/unpin actions
 *
 * Pin state is intentionally NOT persisted to Supabase.
 * It lives in component state and resets on page refresh.
 * This matches the "disposable" philosophy: overrides are temporary.
 */

import { useCallback, useState } from 'react'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import type {
  TemplateBrowserState,
  PinnedOverride,
  SelectionResult,
} from '@/lib/template-selection/types'
import { recordPinReceipt } from '@/lib/template-selection/selection-receipt'

// ============================================================================
// Types
// ============================================================================

export interface UseTemplateBrowserReturn {
  /** Current browser state. */
  readonly state: TemplateBrowserState
  /** Open the browser for a specific district. */
  readonly open: (districtId: AppIdentifier) => void
  /** Close the browser. */
  readonly close: () => void
  /** Update the search query. */
  readonly setSearchQuery: (query: string) => void
  /** Set the category filter. */
  readonly setCategoryFilter: (filter: 'universal' | 'app-specific' | null) => void
  /** Pin a template (adds to overrides). */
  readonly pinTemplate: (
    districtId: AppIdentifier,
    templateId: string,
    templateName: string
  ) => Promise<void>
  /** Unpin a template (removes from overrides). */
  readonly unpinTemplate: (
    districtId: AppIdentifier,
    templateId: string,
    templateName: string
  ) => Promise<void>
  /** Check if a template is pinned. */
  readonly isPinned: (templateId: string) => boolean
  /** Update the last selection result (for score display). */
  readonly setLastSelectionResult: (result: SelectionResult) => void
  /** Get all current pinned overrides. */
  readonly pinnedOverrides: readonly PinnedOverride[]
}

// ============================================================================
// Hook
// ============================================================================

export function useTemplateBrowser(receiptStore: ReceiptStore): UseTemplateBrowserReturn {
  const [state, setState] = useState<TemplateBrowserState>({
    isOpen: false,
    districtId: null,
    searchQuery: '',
    categoryFilter: null,
    lastSelectionResult: null,
    pinnedOverrides: [],
  })

  const open = useCallback((districtId: AppIdentifier) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      districtId,
      searchQuery: '',
      categoryFilter: null,
    }))
  }, [])

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }))
  }, [])

  const setCategoryFilter = useCallback((filter: 'universal' | 'app-specific' | null) => {
    setState((prev) => ({ ...prev, categoryFilter: filter }))
  }, [])

  const pinTemplate = useCallback(
    async (districtId: AppIdentifier, templateId: string, templateName: string) => {
      const receiptCorrelationId = await recordPinReceipt(
        districtId,
        templateId,
        templateName,
        'pin',
        receiptStore
      )

      const pin: PinnedOverride = {
        templateId,
        districtId,
        pinnedAt: new Date().toISOString(),
        receiptCorrelationId,
      }

      setState((prev) => ({
        ...prev,
        pinnedOverrides: [...prev.pinnedOverrides, pin],
      }))
    },
    [receiptStore]
  )

  const unpinTemplate = useCallback(
    async (districtId: AppIdentifier, templateId: string, templateName: string) => {
      await recordPinReceipt(districtId, templateId, templateName, 'unpin', receiptStore)

      setState((prev) => ({
        ...prev,
        pinnedOverrides: prev.pinnedOverrides.filter(
          (p) => !(p.templateId === templateId && p.districtId === districtId)
        ),
      }))
    },
    [receiptStore]
  )

  const isPinned = useCallback(
    (templateId: string) => {
      return state.pinnedOverrides.some((p) => p.templateId === templateId)
    },
    [state.pinnedOverrides]
  )

  const setLastSelectionResult = useCallback((result: SelectionResult) => {
    setState((prev) => ({ ...prev, lastSelectionResult: result }))
  }, [])

  return {
    state,
    open,
    close,
    setSearchQuery,
    setCategoryFilter,
    pinTemplate,
    unpinTemplate,
    isPinned,
    setLastSelectionResult,
    pinnedOverrides: state.pinnedOverrides,
  }
}
