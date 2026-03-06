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
