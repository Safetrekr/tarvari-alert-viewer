/**
 * Coverage filter store -- manages the selected category for the
 * Coverage Grid Launch Page.
 *
 * Implements Decision 7 (Separate Zustand Store): keeps data filtering
 * separate from morph animation state (ui.store.ts). The morph system
 * drives visual transitions; the coverage store drives data queries.
 *
 * No `persist` middleware: category selection is session-transient
 * and driven by URL parameters. Deep-linking via `?category=seismic`
 * is the persistence mechanism.
 *
 * @module coverage.store
 * @see WS-1.3 Section 4.5
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// ============================================================================
// State
// ============================================================================

interface CoverageState {
  /** Currently selected category ID, or null for "all categories". */
  selectedCategory: string | null
}

// ============================================================================
// Actions
// ============================================================================

interface CoverageActions {
  /** Select a category for filtering. Updates state only; URL sync is external. */
  setSelectedCategory: (id: string) => void
  /** Clear category selection (show all). */
  clearSelection: () => void
}

export type CoverageStore = CoverageState & CoverageActions

// ============================================================================
// Store
// ============================================================================

export const useCoverageStore = create<CoverageStore>()(
  immer((set) => ({
    selectedCategory: null,

    setSelectedCategory: (id) =>
      set((state) => {
        state.selectedCategory = id
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedCategory = null
      }),
  })),
)

// ============================================================================
// Selectors
// ============================================================================

export const coverageSelectors = {
  /** Whether any category is currently selected. */
  hasSelection: (state: CoverageStore): boolean => state.selectedCategory !== null,

  /** The selected category ID or null. */
  selectedCategory: (state: CoverageStore): string | null => state.selectedCategory,
} as const

// ============================================================================
// URL Synchronization
// ============================================================================

/**
 * Initialize store from URL query parameter.
 * Call once on page mount (e.g., in a useEffect in the page component).
 *
 * Reads `?category={id}` from the current URL and sets the store
 * selection accordingly. No-op on the server (SSR guard).
 */
export function syncCoverageFromUrl(): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  const category = params.get('category')

  if (category) {
    useCoverageStore.getState().setSelectedCategory(category)
  }
}

/**
 * Push current selection to URL query parameter.
 * Call after setSelectedCategory() or clearSelection().
 *
 * Uses `replaceState` to avoid creating browser history entries
 * for filter changes. No-op on the server (SSR guard).
 *
 * @param category - The category ID to set, or null to remove the parameter.
 */
export function syncCoverageToUrl(category: string | null): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)

  if (category) {
    url.searchParams.set('category', category)
  } else {
    url.searchParams.delete('category')
  }

  window.history.replaceState({}, '', url.toString())
}
