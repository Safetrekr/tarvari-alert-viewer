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
  /** Currently selected category IDs for map filtering. Empty = show all. */
  selectedCategories: string[]
}

// ============================================================================
// Actions
// ============================================================================

interface CoverageActions {
  /** Toggle a category in the filter set. Adds if absent, removes if present. */
  toggleCategory: (id: string) => void
  /** Clear all category filters (show all). */
  clearSelection: () => void
}

export type CoverageStore = CoverageState & CoverageActions

// ============================================================================
// Store
// ============================================================================

export const useCoverageStore = create<CoverageStore>()(
  immer((set) => ({
    selectedCategories: [],

    toggleCategory: (id) =>
      set((state) => {
        const idx = state.selectedCategories.indexOf(id)
        if (idx >= 0) {
          state.selectedCategories.splice(idx, 1)
        } else {
          state.selectedCategories.push(id)
        }
      }),

    clearSelection: () =>
      set((state) => {
        state.selectedCategories = []
      }),
  })),
)

// ============================================================================
// Selectors
// ============================================================================

export const coverageSelectors = {
  /** Whether any category filter is active. */
  hasSelection: (state: CoverageStore): boolean => state.selectedCategories.length > 0,

  /** The selected category IDs. */
  selectedCategories: (state: CoverageStore): string[] => state.selectedCategories,
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
  const categories = params.getAll('category')

  for (const cat of categories) {
    useCoverageStore.getState().toggleCategory(cat)
  }
}

/**
 * Push current selection to URL query parameters.
 * Uses `replaceState` to avoid creating browser history entries.
 * No-op on the server (SSR guard).
 *
 * @param categories - Array of category IDs, or empty to remove param.
 */
export function syncCategoriesToUrl(categories: string[]): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.delete('category')

  for (const cat of categories) {
    url.searchParams.append('category', cat)
  }

  window.history.replaceState({}, '', url.toString())
}
