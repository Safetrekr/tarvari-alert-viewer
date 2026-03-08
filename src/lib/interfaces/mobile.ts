/**
 * Mobile navigation tab identifiers.
 * Situation is the default tab (no URL parameter required).
 *
 * @module mobile
 */
export type MobileTab = 'situation' | 'map' | 'intel'

/** Valid tab values for URL parameter parsing. */
export const MOBILE_TABS: readonly MobileTab[] = ['situation', 'map', 'intel'] as const

/** Default tab when no URL parameter is present. */
export const DEFAULT_MOBILE_TAB: MobileTab = 'situation'

// ---------------------------------------------------------------------------
// Bottom Sheet types
// ---------------------------------------------------------------------------

/** Snap point as an integer percentage of viewport height (0 = closed, 100 = top). */
export type SnapPointPercent = number

export interface BottomSheetConfig {
  id: string
  snapPoints: readonly SnapPointPercent[]
  initialSnapIndex: number
  dismissible?: boolean
}

/** Predefined sheet configurations for each context. */
export const SHEET_CONFIGS = {
  alertDetail: {
    id: 'alert-detail',
    snapPoints: [70, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
  categoryDetail: {
    id: 'category-detail',
    snapPoints: [35, 65, 100] as const,
    initialSnapIndex: 1,
    dismissible: true,
  },
  priorityFeed: {
    id: 'priority-feed',
    snapPoints: [60, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
  filterTimeRange: {
    id: 'filter-time-range',
    snapPoints: [40] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
  settings: {
    id: 'settings',
    snapPoints: [60, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
  threatPosture: {
    id: 'threat-posture',
    snapPoints: [65, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
  regionDetail: {
    id: 'region-detail',
    snapPoints: [70, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
  bundleDetail: {
    id: 'bundle-detail',
    snapPoints: [65, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
} as const satisfies Record<string, BottomSheetConfig>
