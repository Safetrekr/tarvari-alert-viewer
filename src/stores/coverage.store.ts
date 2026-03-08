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
import { PRIORITY_LEVELS, SEVERITY_LEVELS, type OperationalPriority, type SeverityLevel, type GeoLevel, type SummaryType, isValidGeoRegionKey } from '@/lib/interfaces/coverage'
import { useCameraStore } from '@/stores/camera.store'
import { useUIStore } from '@/stores/ui.store'

// ============================================================================
// Time range presets
// ============================================================================

export type TimePreset = '1m' | '10m' | '30m' | '1h' | '2h' | '4h' | '12h' | '24h' | '7d' | 'all'

export const TIME_PRESETS: TimePreset[] = ['1m', '10m', '30m', '1h', '2h', '4h', '12h', '24h', '7d', 'all']

export const TIME_PRESET_LABELS: Record<TimePreset, string> = {
  '1m': '1 min',
  '10m': '10 min',
  '30m': '30 min',
  '1h': '1 hr',
  '2h': '2 hr',
  '4h': '4 hr',
  '12h': '12 hr',
  '24h': '24 hr',
  '7d': '7 d',
  'all': 'All',
}

const TIME_PRESET_MS: Record<TimePreset, number | null> = {
  '1m': 60_000,
  '10m': 600_000,
  '30m': 1_800_000,
  '1h': 3_600_000,
  '2h': 7_200_000,
  '4h': 14_400_000,
  '12h': 43_200_000,
  '24h': 86_400_000,
  '7d': 604_800_000,
  'all': null,
}

/** Compute an ISO start-date from a preset. Returns undefined for 'all'. */
export function timePresetToStartDate(preset: TimePreset): string | undefined {
  const ms = TIME_PRESET_MS[preset]
  if (ms == null) return undefined
  return new Date(Date.now() - ms).toISOString()
}

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
  /** Map time range preset. 'all' = no filter, 'custom' = use customTimeStart/End. */
  mapTimePreset: TimePreset | 'custom'
  /** Custom start date (ISO 8601) when mapTimePreset is 'custom'. */
  customTimeStart: string | null
  /** Custom end date (ISO 8601) when mapTimePreset is 'custom'. */
  customTimeEnd: string | null
  /** Selected map alert ID for the INSPECT detail panel. */
  selectedMapAlertId: string | null
  /** Category of the selected map alert (needed for data fetching). */
  selectedMapAlertCategory: string | null
  /** Basic marker data for immediate rendering before intel fetch completes. */
  selectedMapAlertBasic: { title: string; severity: string; ingestedAt: string } | null
  /** Camera position before flying to the detail panel (for return trip). */
  preFlyCamera: { offsetX: number; offsetY: number; zoom: number } | null
  /** Alert ID to pre-select when entering district view from INSPECT. Consumed once by the overlay. */
  districtPreselectedAlertId: string | null
  /** Currently selected priority levels for filtering. Empty = show all. */
  selectedPriorities: OperationalPriority[]
  /** Whether the priority feed panel is expanded (open). */
  priorityFeedExpanded: boolean
  /** Whether the geographic summary slide-over panel is open. */
  geoSummaryOpen: boolean
  /** Current geographic hierarchy level being viewed. */
  summaryGeoLevel: GeoLevel
  /** Key identifying the current geographic scope. */
  summaryGeoKey: string
  /** Whether to display hourly delta summaries or daily comprehensive brief. */
  summaryType: SummaryType
  /** Currently selected severity levels for map filtering. Empty = show all. */
  selectedSeverities: SeverityLevel[]
  /** Source filter for district view (null = all sources). */
  districtSourceFilter: string | null
  /** Whether bounding-box viewport filtering is enabled in district view. */
  districtBboxEnabled: boolean
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
  /** Set the map time range to a preset. */
  setMapTimePreset: (preset: TimePreset) => void
  /** Set custom date range (switches to 'custom' mode). */
  setCustomTimeRange: (start: string | null, end: string | null) => void
  /** Select a map alert for the INSPECT detail panel. Stores current camera position + basic marker data. */
  selectMapAlert: (id: string, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void
  /** Clear the map alert selection. */
  clearMapAlert: () => void
  /** Set alert ID to pre-select when entering district view. */
  setDistrictPreselectedAlertId: (id: string | null) => void
  /** Toggle a priority in the filter set. Adds if absent, removes if present. */
  togglePriority: (priority: OperationalPriority) => void
  /** Clear all priority filters (show all). */
  clearPriorities: () => void
  /** Open or close the priority feed panel. */
  setPriorityFeedExpanded: (open: boolean) => void
  /** Open the geo summary panel. No args = resume at last position. Explicit args = navigate to level/key. */
  openGeoSummary: (level?: GeoLevel, key?: string) => void
  /** Close the geo summary panel (preserves level/key/type for reopen). */
  closeGeoSummary: () => void
  /** Navigate within the open panel to a new geographic level and key. */
  drillDownGeo: (level: GeoLevel, key: string) => void
  /** Set the summary type (hourly or daily). */
  setSummaryType: (type: SummaryType) => void
  /** Toggle a severity level in the filter set. */
  toggleSeverity: (severity: SeverityLevel) => void
  /** Clear all severity filters (show all). */
  clearSeverities: () => void
  /** Set the source filter for district view. null = no filter. */
  setDistrictSourceFilter: (sourceKey: string | null) => void
  /** Toggle bounding-box viewport filtering in district view. */
  setDistrictBboxEnabled: (enabled: boolean) => void
  /** Clear all district-scoped filters (called on district exit). */
  clearDistrictFilters: () => void
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
    mapTimePreset: '2h',
    customTimeStart: null,
    customTimeEnd: null,
    selectedMapAlertId: null,
    selectedMapAlertCategory: null,
    selectedMapAlertBasic: null,
    preFlyCamera: null,
    districtPreselectedAlertId: null,
    selectedPriorities: [],
    priorityFeedExpanded: false,
    geoSummaryOpen: false,
    summaryGeoLevel: 'world' as GeoLevel,
    summaryGeoKey: 'world',
    summaryType: 'daily' as SummaryType,
    selectedSeverities: [],
    districtSourceFilter: null,
    districtBboxEnabled: false,

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

    setMapTimePreset: (preset) =>
      set((state) => {
        state.mapTimePreset = preset
        state.customTimeStart = null
        state.customTimeEnd = null
      }),

    setCustomTimeRange: (start, end) =>
      set((state) => {
        state.mapTimePreset = 'custom'
        state.customTimeStart = start
        state.customTimeEnd = end
      }),

    selectMapAlert: (id, category, basic) =>
      set((state) => {
        const cam = useCameraStore.getState()
        state.preFlyCamera = { offsetX: cam.offsetX, offsetY: cam.offsetY, zoom: cam.zoom }
        state.selectedMapAlertId = id
        state.selectedMapAlertCategory = category
        state.selectedMapAlertBasic = basic
      }),

    clearMapAlert: () =>
      set((state) => {
        state.selectedMapAlertId = null
        state.selectedMapAlertCategory = null
        state.selectedMapAlertBasic = null
        // preFlyCamera is kept until the return flight is complete
      }),

    setDistrictPreselectedAlertId: (id) =>
      set((state) => {
        state.districtPreselectedAlertId = id
      }),

    togglePriority: (priority) =>
      set((state) => {
        if (!(PRIORITY_LEVELS as readonly string[]).includes(priority)) return
        const idx = state.selectedPriorities.indexOf(priority)
        if (idx >= 0) {
          state.selectedPriorities.splice(idx, 1)
        } else {
          state.selectedPriorities.push(priority)
        }
      }),

    clearPriorities: () =>
      set((state) => {
        state.selectedPriorities = []
      }),

    setPriorityFeedExpanded: (open) =>
      set((state) => {
        state.priorityFeedExpanded = open
      }),

    openGeoSummary: (level?, key?) =>
      set((state) => {
        // R10 mutual exclusion: do not open during morph
        const morphPhase = useUIStore.getState().morph.phase
        if (morphPhase !== 'idle') return

        if (level !== undefined) {
          // Validate region keys
          if (level === 'region' && (!key || !isValidGeoRegionKey(key))) return

          state.summaryGeoLevel = level
          state.summaryGeoKey = level === 'world' ? 'world' : key!
          state.summaryType = 'daily'
        }

        state.geoSummaryOpen = true
      }),

    closeGeoSummary: () =>
      set((state) => {
        state.geoSummaryOpen = false
      }),

    drillDownGeo: (level, key) =>
      set((state) => {
        if (!state.geoSummaryOpen) return
        if (level === 'region' && !isValidGeoRegionKey(key)) return

        state.summaryGeoLevel = level
        state.summaryGeoKey = level === 'world' ? 'world' : key
      }),

    setSummaryType: (type) =>
      set((state) => {
        state.summaryType = type
      }),

    toggleSeverity: (severity) =>
      set((state) => {
        if (!(SEVERITY_LEVELS as readonly string[]).includes(severity)) return
        const idx = state.selectedSeverities.indexOf(severity)
        if (idx >= 0) {
          state.selectedSeverities.splice(idx, 1)
        } else {
          state.selectedSeverities.push(severity)
        }
      }),

    clearSeverities: () =>
      set((state) => {
        state.selectedSeverities = []
      }),

    setDistrictSourceFilter: (sourceKey) =>
      set((state) => {
        state.districtSourceFilter = sourceKey
      }),

    setDistrictBboxEnabled: (enabled) =>
      set((state) => {
        state.districtBboxEnabled = enabled
      }),

    clearDistrictFilters: () =>
      set((state) => {
        state.districtSourceFilter = null
        state.districtBboxEnabled = false
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

  /** Whether any priority filter is active. */
  hasPrioritySelection: (state: CoverageStore): boolean => state.selectedPriorities.length > 0,

  /** The selected priority levels. */
  selectedPriorities: (state: CoverageStore): OperationalPriority[] => state.selectedPriorities,

  /** Whether the priority feed panel is expanded. */
  isPriorityFeedExpanded: (state: CoverageStore): boolean => state.priorityFeedExpanded,

  /** Whether the geographic summary panel is open. */
  isGeoSummaryOpen: (state: CoverageStore): boolean => state.geoSummaryOpen,

  /** The current geographic hierarchy level. */
  summaryGeoLevel: (state: CoverageStore): GeoLevel => state.summaryGeoLevel,

  /** The current geographic scope key. */
  summaryGeoKey: (state: CoverageStore): string => state.summaryGeoKey,

  /** The current summary type (hourly or daily). */
  summaryType: (state: CoverageStore): SummaryType => state.summaryType,

  /** Whether any severity filter is active. */
  hasSeveritySelection: (state: CoverageStore): boolean => state.selectedSeverities.length > 0,

  /** The selected severity levels. */
  selectedSeverities: (state: CoverageStore): SeverityLevel[] => state.selectedSeverities,

  /** Whether any district-scoped filter is active. */
  hasDistrictFilter: (state: CoverageStore): boolean =>
    state.districtSourceFilter !== null || state.districtBboxEnabled,

  /** The district source filter value. */
  districtSourceFilter: (state: CoverageStore): string | null => state.districtSourceFilter,

  /** Whether bbox viewport filtering is enabled. */
  districtBboxEnabled: (state: CoverageStore): boolean => state.districtBboxEnabled,
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

  // Sync priorities
  const priorities = params.getAll('priority')
  for (const p of priorities) {
    if ((PRIORITY_LEVELS as readonly string[]).includes(p)) {
      useCoverageStore.getState().togglePriority(p as OperationalPriority)
    }
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
 * Push priority filters to URL query parameters.
 * Uses `replaceState` to avoid creating browser history entries.
 * Removes all `priority` params when the array is empty.
 */
export function syncPrioritiesToUrl(priorities: OperationalPriority[]): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.delete('priority')

  for (const p of priorities) {
    url.searchParams.append('priority', p)
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
