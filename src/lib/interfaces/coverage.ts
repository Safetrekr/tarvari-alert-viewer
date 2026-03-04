/**
 * Coverage category types and constants for the TarvaRI Alert Viewer.
 *
 * Defines the 15 known intel categories, their display metadata,
 * color mappings, icon mappings, and associated severity/source types.
 *
 * @module coverage
 * @see WS-1.2 Section 4.1
 */

// ---------------------------------------------------------------------------
// Category identity
// ---------------------------------------------------------------------------

/**
 * Category identifier string. Known categories are defined in KNOWN_CATEGORIES.
 * Unknown categories from the database fall back to 'other' styling.
 */
export type CategoryId = string

/** Static metadata for a single intel coverage category. */
export interface CategoryMeta {
  /** Category identifier (e.g. 'seismic', 'weather'). */
  id: CategoryId
  /** Human-readable display name (e.g. 'Seismic'). */
  displayName: string
  /** Short uppercase label for tight spaces (e.g. 'SEIS'). */
  shortName: string
  /** Lucide icon name for this category (e.g. 'activity', 'cloud'). */
  icon: string
  /** CSS color token or value for category identification. */
  color: string
  /** Descriptive one-liner for tooltips and card subtitles. */
  description: string
}

// ---------------------------------------------------------------------------
// Known categories (per COVERAGE-DATA-SPEC.md + Decision 4)
// ---------------------------------------------------------------------------

/**
 * The 15 known TarvaRI intel categories, ordered for grid display.
 * Categories not in this list fall back to the 'other' entry.
 */
export const KNOWN_CATEGORIES: readonly CategoryMeta[] = [
  { id: 'seismic',        displayName: 'Seismic',        shortName: 'SEIS', icon: 'activity',       color: 'var(--category-seismic, #ef4444)',        description: 'Earthquake and seismic activity' },
  { id: 'geological',     displayName: 'Geological',     shortName: 'GEO',  icon: 'mountain',       color: 'var(--category-geological, #f97316)',     description: 'Geological hazards and events' },
  { id: 'disaster',       displayName: 'Disaster',       shortName: 'DIS',  icon: 'alert-triangle', color: 'var(--category-disaster, #a855f7)',       description: 'Multi-type disaster events' },
  { id: 'humanitarian',   displayName: 'Humanitarian',   shortName: 'HUM',  icon: 'heart',          color: 'var(--category-humanitarian, #6366f1)',   description: 'Humanitarian crises and aid' },
  { id: 'health',         displayName: 'Health',         shortName: 'HLT',  icon: 'heart-pulse',    color: 'var(--category-health, #22c55e)',         description: 'Public health advisories' },
  { id: 'aviation',       displayName: 'Aviation',       shortName: 'AVN',  icon: 'plane',          color: 'var(--category-aviation, #06b6d4)',       description: 'Aviation safety notices' },
  { id: 'maritime',       displayName: 'Maritime',       shortName: 'MAR',  icon: 'ship',           color: 'var(--category-maritime, #14b8a6)',       description: 'Maritime safety and navigation' },
  { id: 'infrastructure', displayName: 'Infrastructure', shortName: 'INF',  icon: 'building-2',     color: 'var(--category-infrastructure, #eab308)', description: 'Infrastructure disruptions' },
  { id: 'weather',        displayName: 'Weather',        shortName: 'WX',   icon: 'cloud',          color: 'var(--category-weather, #3b82f6)',        description: 'Weather warnings and advisories' },
  { id: 'conflict',       displayName: 'Conflict',       shortName: 'CON',  icon: 'shield-alert',   color: 'var(--category-conflict, #dc2626)',       description: 'Armed conflict and security' },
  { id: 'fire',           displayName: 'Fire',           shortName: 'FIR',  icon: 'flame',          color: 'var(--category-fire, #ea580c)',           description: 'Wildfire and fire incidents' },
  { id: 'flood',          displayName: 'Flood',          shortName: 'FLD',  icon: 'waves',          color: 'var(--category-flood, #4f46e5)',          description: 'Flood warnings and events' },
  { id: 'storm',          displayName: 'Storm',          shortName: 'STM',  icon: 'cloud-lightning', color: 'var(--category-storm, #0ea5e9)',         description: 'Storm systems and warnings' },
  { id: 'multi-hazard',   displayName: 'Multi-Hazard',   shortName: 'MHZ',  icon: 'layers',         color: 'var(--category-multi-hazard, #6b7280)',  description: 'Multi-hazard compound events' },
  { id: 'other',          displayName: 'Other',          shortName: 'OTH',  icon: 'circle-dot',     color: 'var(--category-other, #9ca3af)',          description: 'Uncategorized intelligence' },
] as const

// ---------------------------------------------------------------------------
// Color and icon lookup maps (derived from KNOWN_CATEGORIES)
// ---------------------------------------------------------------------------

/** Maps category ID to its display color. Falls back to 'other' color for unknown IDs. */
export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  KNOWN_CATEGORIES.map((c) => [c.id, c.color]),
)

/** Maps category ID to its Lucide icon name. Falls back to 'circle-dot' for unknown IDs. */
export const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  KNOWN_CATEGORIES.map((c) => [c.id, c.icon]),
)

/** Default color for unknown categories. */
export const DEFAULT_CATEGORY_COLOR = 'var(--category-other, #9ca3af)'

/** Default icon for unknown categories. */
export const DEFAULT_CATEGORY_ICON = 'circle-dot'

/**
 * Get the display color for a category ID.
 * Returns the default gray for unknown categories.
 */
export function getCategoryColor(categoryId: string): string {
  return CATEGORY_COLORS[categoryId] ?? DEFAULT_CATEGORY_COLOR
}

/**
 * Get the Lucide icon name for a category ID.
 * Returns 'circle-dot' for unknown categories.
 */
export function getCategoryIcon(categoryId: string): string {
  return CATEGORY_ICONS[categoryId] ?? DEFAULT_CATEGORY_ICON
}

/**
 * Get the full CategoryMeta for a category ID.
 * Returns the 'other' entry for unknown categories.
 */
export function getCategoryMeta(categoryId: string): CategoryMeta {
  return KNOWN_CATEGORIES.find((c) => c.id === categoryId)
    ?? KNOWN_CATEGORIES[KNOWN_CATEGORIES.length - 1] // 'other' is last
}

// ---------------------------------------------------------------------------
// Severity levels (per COVERAGE-DATA-SPEC.md)
// ---------------------------------------------------------------------------

/** TarvaRI severity levels in descending order of urgency. */
export const SEVERITY_LEVELS = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'] as const

/** Severity level type. */
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number]

/** Maps severity level to its display color. */
export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  Extreme:  'var(--severity-extreme, #ef4444)',
  Severe:   'var(--severity-severe, #f97316)',
  Moderate: 'var(--severity-moderate, #eab308)',
  Minor:    'var(--severity-minor, #3b82f6)',
  Unknown:  'var(--severity-unknown, #6b7280)',
}

// ---------------------------------------------------------------------------
// Source status (per COVERAGE-DATA-SPEC.md)
// ---------------------------------------------------------------------------

/** Intel source operational statuses. */
export const SOURCE_STATUSES = ['active', 'staging', 'quarantine', 'disabled'] as const

/** Source status type. */
export type SourceStatus = (typeof SOURCE_STATUSES)[number]

// ---------------------------------------------------------------------------
// Grid display type (added by WS-2.1)
// ---------------------------------------------------------------------------

import type { CoverageByCategory } from '@/lib/coverage-utils'

/**
 * Display-ready category data for the coverage grid.
 * Merges static CategoryMeta with live CoverageByCategory metrics.
 * Categories with zero sources are excluded from the grid.
 */
export interface CategoryGridItem {
  /** Category identifier (e.g. 'seismic', 'weather'). */
  id: CategoryId
  /** Static display metadata (name, icon, color, description). */
  meta: CategoryMeta
  /** Live source count metrics. Null only during loading (should not render). */
  metrics: CoverageByCategory
}

/**
 * Build the grid items array by joining KNOWN_CATEGORIES with live metrics.
 * Only includes categories that have at least one source (Decision 4).
 * Unknown categories from the database that are not in KNOWN_CATEGORIES
 * are mapped to the 'other' entry.
 */
export function buildGridItems(byCategory: CoverageByCategory[]): CategoryGridItem[] {
  return byCategory.map((cat) => ({
    id: cat.category,
    meta: getCategoryMeta(cat.category),
    metrics: cat,
  }))
}

/**
 * Build grid items for ALL 15 known categories, merging live metrics where
 * available and filling zeroed metrics for categories with no sources.
 * Ensures the grid always shows all categories so users can click into
 * district view even before data is populated.
 */
export function buildAllGridItems(byCategory: CoverageByCategory[]): CategoryGridItem[] {
  const liveMap = new Map(byCategory.map((c) => [c.category, c]))

  return KNOWN_CATEGORIES.map((meta) => ({
    id: meta.id,
    meta,
    metrics: liveMap.get(meta.id) ?? {
      category: meta.id,
      sourceCount: 0,
      activeSources: 0,
      geographicRegions: [],
    },
  }))
}
