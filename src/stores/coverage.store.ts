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
import type { ViewMode } from '@/lib/interfaces/intel-bundles'
import { DEFAULT_VIEW_MODE } from '@/lib/interfaces/intel-bundles'

// ============================================================================
// State
// ============================================================================

interface CoverageState {
  /** Currently selected category IDs for map filtering. Empty = show all. */
  selectedCategories: string[]
  /** Current data view mode: triaged, all-bundles, or raw. */
  viewMode: ViewMode
  /** Currently selected bundle ID for detail view. Null = no selection. */
  selectedBundleId: string | null
}

// ============================================================================
// Actions
// ============================================================================

interface CoverageActions {
  /** Toggle a category in the filter set. Adds if absent, removes if present. */
  toggleCategory: (id: string) => void
  /** Clear all category filters (show all). */
  clearSelection: () => void
  /** Set the data view mode. */
  setViewMode: (mode: ViewMode) => void
  /** Select a bundle for detail view. Pass null to deselect. */
  setSelectedBundleId: (id: string | null) => void
}

export type CoverageStore = CoverageState & CoverageActions

// ============================================================================
// Store
// ============================================================================

export const useCoverageStore = create<CoverageStore>()(
  immer((set) => ({
    selectedCategories: [],
    viewMode: DEFAULT_VIEW_MODE,
    selectedBundleId: null,

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

    setViewMode: (mode) =>
      set((state) => {
        state.viewMode = mode
        // Clear bundle selection when switching modes
        state.selectedBundleId = null
      }),

    setSelectedBundleId: (id) =>
      set((state) => {
        state.selectedBundleId = id
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

  /** The current view mode. */
  viewMode: (state: CoverageStore): ViewMode => state.viewMode,

  /** The selected bundle ID for detail view. */
  selectedBundleId: (state: CoverageStore): string | null => state.selectedBundleId,
} as const

// ============================================================================
// URL Synchronization
// ============================================================================

/** Valid view mode values for URL parameter validation. */
const VALID_VIEW_MODES: ViewMode[] = ['triaged', 'all-bundles', 'raw']

/**
 * Initialize store from URL query parameters.
 * Call once on page mount (e.g., in a useEffect in the page component).
 *
 * Reads `?category={id}` and `?view={mode}` from the current URL.
 * No-op on the server (SSR guard).
 */
export function syncCoverageFromUrl(): void {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)

  // Sync categories
  const categories = params.getAll('category')
  for (const cat of categories) {
    useCoverageStore.getState().toggleCategory(cat)
  }

  // Sync view mode
  const viewParam = params.get('view')
  if (viewParam && VALID_VIEW_MODES.includes(viewParam as ViewMode)) {
    useCoverageStore.getState().setViewMode(viewParam as ViewMode)
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

/**
 * Push view mode to URL query parameter.
 * Omits `?view=` for the default 'triaged' mode (cleaner URLs).
 */
export function syncViewModeToUrl(mode: ViewMode): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)

  if (mode === DEFAULT_VIEW_MODE) {
    url.searchParams.delete('view')
  } else {
    url.searchParams.set('view', mode)
  }

  window.history.replaceState({}, '', url.toString())
}
