/**
 * Coverage category types and constants for the TarvaRI Alert Viewer.
 *
 * Defines the known intel categories, their display metadata,
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
 * The known TarvaRI intel categories, ordered for grid display.
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
  { id: 'volcanic',       displayName: 'Volcanic',       shortName: 'VOL',  icon: 'mountain-snow',  color: 'var(--category-volcanic, #b91c1c)',      description: 'Volcanic activity and eruptions' },
  { id: 'travel',         displayName: 'Travel',         shortName: 'TRV',  icon: 'map-pin',        color: 'var(--category-travel, #0d9488)',         description: 'Travel advisories and warnings' },
  { id: 'cybersecurity',  displayName: 'Cybersecurity',  shortName: 'CYB',  icon: 'shield',         color: 'var(--category-cybersecurity, #7c3aed)',  description: 'Cyber threats and incidents' },
  { id: 'political',      displayName: 'Political',      shortName: 'POL',  icon: 'landmark',       color: 'var(--category-political, #be185d)',      description: 'Political instability and events' },
  { id: 'security',       displayName: 'Security',       shortName: 'SEC',  icon: 'shield-check',   color: 'var(--category-security, #991b1b)',       description: 'Security incidents and threats' },
  { id: 'transportation', displayName: 'Transportation', shortName: 'TRN',  icon: 'truck',          color: 'var(--category-transportation, #0369a1)', description: 'Transportation disruptions' },
  { id: 'wildfire',       displayName: 'Wildfire',       shortName: 'WFR',  icon: 'flame-kindling', color: 'var(--category-wildfire, #c2410c)',        description: 'Wildfire incidents and alerts' },
  { id: 'news',           displayName: 'News',           shortName: 'NWS',  icon: 'newspaper',      color: 'var(--category-news, #64748b)',           description: 'News intelligence items' },
  { id: 'events',         displayName: 'Events',         shortName: 'EVT',  icon: 'calendar',       color: 'var(--category-events, #059669)',         description: 'Significant events and incidents' },
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
// Operational priority (per AD-1: achromatic visual channel)
// ---------------------------------------------------------------------------

/**
 * Operational priority levels in descending urgency order.
 * Matches backend `operational_priority` field values directly.
 *
 * @see AD-1 — Priority uses shape/weight/animation, never color.
 */
export const PRIORITY_LEVELS = ['P1', 'P2', 'P3', 'P4'] as const

/**
 * Operational priority level type, derived from PRIORITY_LEVELS.
 * `'P1'` = Critical, `'P2'` = High, `'P3'` = Standard, `'P4'` = Low.
 *
 * @see AD-1 — Priority occupies the achromatic visual channel (shape/weight).
 */
export type OperationalPriority = (typeof PRIORITY_LEVELS)[number]

/**
 * Display metadata for a single operational priority level.
 * Deliberately excludes all color-related fields to enforce AD-1:
 * priority is communicated via shape, weight, and animation — never color.
 * Severity owns the color channel exclusively.
 */
export interface PriorityMeta {
  /** Priority level identifier. */
  id: OperationalPriority
  /** Human-readable label (e.g. 'Critical'). */
  label: string
  /** Abbreviated label for tight spaces (e.g. 'P1'). */
  shortLabel: string
  /** Optional description for tooltips and accessibility. */
  description?: string
  /** Geometric shape for pre-attentive visual distinction. */
  shape: 'diamond' | 'triangle' | 'none'
  /** Typographic weight for text-based priority indicators. */
  weight: 'bold' | 'medium' | 'normal'
  /** CSS animation identifier, or null for no animation. */
  animation: 'pulse' | null
  /**
   * Where this priority level is shown without explicit filtering.
   * - `'always'` — P1/P2 render in all contexts.
   * - `'detail'` — P3 renders only in detail views.
   * - `'filter-only'` — P4 is invisible unless explicitly filtered.
   */
  defaultVisibility: 'always' | 'detail' | 'filter-only'
  /** Numeric weight for sorting (1 = highest priority). */
  sortOrder: number
}

/**
 * Priority metadata lookup table. Maps each priority level to its
 * achromatic display properties (shape, weight, animation, visibility).
 *
 * @see AD-1 — No color fields. Severity owns color exclusively.
 */
export const PRIORITY_META: Record<OperationalPriority, PriorityMeta> = {
  P1: {
    id: 'P1',
    label: 'Critical',
    shortLabel: 'P1',
    description: 'Immediate threat to life or critical infrastructure',
    shape: 'diamond',
    weight: 'bold',
    animation: 'pulse',
    defaultVisibility: 'always',
    sortOrder: 1,
  },
  P2: {
    id: 'P2',
    label: 'High',
    shortLabel: 'P2',
    description: 'Significant threat requiring prompt attention',
    shape: 'triangle',
    weight: 'medium',
    animation: null,
    defaultVisibility: 'always',
    sortOrder: 2,
  },
  P3: {
    id: 'P3',
    label: 'Standard',
    shortLabel: 'P3',
    description: 'Routine intelligence for situational awareness',
    shape: 'none',
    weight: 'normal',
    animation: null,
    defaultVisibility: 'detail',
    sortOrder: 3,
  },
  P4: {
    id: 'P4',
    label: 'Low',
    shortLabel: 'P4',
    description: 'Background intelligence, lowest priority',
    shape: 'none',
    weight: 'normal',
    animation: null,
    defaultVisibility: 'filter-only',
    sortOrder: 4,
  },
} as const

/**
 * Get the PriorityMeta for a given priority string.
 * Returns P4 (lowest, invisible by default) for unknown values,
 * ensuring items with missing priority are never displayed as high-priority.
 *
 * @see AD-1 — Conservative fallback: unknown = P4 = invisible.
 */
export function getPriorityMeta(priority: string): PriorityMeta {
  return PRIORITY_META[priority as OperationalPriority] ?? PRIORITY_META.P4
}

/**
 * Determine whether a priority level should be rendered in a given context.
 * - `'always'` → visible in both list and detail.
 * - `'detail'` → visible only in detail context.
 * - `'filter-only'` → never visible by default (requires explicit filter).
 */
export function isPriorityVisible(
  priority: OperationalPriority,
  context: 'list' | 'detail',
): boolean {
  const meta = PRIORITY_META[priority]
  if (meta.defaultVisibility === 'always') return true
  if (meta.defaultVisibility === 'detail' && context === 'detail') return true
  return false
}

// ---------------------------------------------------------------------------
// Trend direction (Phase 4: Geographic Intelligence)
// ---------------------------------------------------------------------------

/** Directional trend for temporal comparisons (per-category, per-region, overall). */
export type TrendDirection = 'up' | 'down' | 'stable'

// ---------------------------------------------------------------------------
// Threat level (Phase 4: Geographic Intelligence)
// ---------------------------------------------------------------------------

/** Five-level threat assessment scale used in geographic summaries. */
export const THREAT_LEVELS = ['LOW', 'MODERATE', 'ELEVATED', 'HIGH', 'CRITICAL'] as const

/** Threat level type. */
export type ThreatLevel = (typeof THREAT_LEVELS)[number]

// ---------------------------------------------------------------------------
// Geographic hierarchy (Phase 4: Geographic Intelligence, AD-7)
// ---------------------------------------------------------------------------

/** Geographic hierarchy levels for intel summaries. */
export type GeoLevel = 'world' | 'region' | 'country'

/** Summary period types. */
export type SummaryType = 'hourly' | 'daily'

/**
 * The 11 travel-security geographic region keys (AD-7).
 * Kebab-case identifiers used as `summaryGeoKey` when `summaryGeoLevel` is `'region'`.
 */
export const GEO_REGION_KEYS = [
  'north-america',
  'central-america-caribbean',
  'south-america',
  'western-europe',
  'eastern-europe',
  'middle-east',
  'north-africa',
  'sub-saharan-africa',
  'south-central-asia',
  'east-southeast-asia',
  'oceania',
] as const

export type GeoRegionKey = (typeof GEO_REGION_KEYS)[number]

/** Display metadata for each geographic region. */
export const GEO_REGION_META: Record<GeoRegionKey, { displayName: string; shortName: string }> = {
  'north-america':              { displayName: 'North America',              shortName: 'N. AMERICA' },
  'central-america-caribbean':  { displayName: 'Central America & Caribbean', shortName: 'C. AMERICA' },
  'south-america':              { displayName: 'South America',              shortName: 'S. AMERICA' },
  'western-europe':             { displayName: 'Western Europe',             shortName: 'W. EUROPE' },
  'eastern-europe':             { displayName: 'Eastern Europe',             shortName: 'E. EUROPE' },
  'middle-east':                { displayName: 'Middle East',                shortName: 'MID EAST' },
  'north-africa':               { displayName: 'North Africa',              shortName: 'N. AFRICA' },
  'sub-saharan-africa':         { displayName: 'Sub-Saharan Africa',        shortName: 'SS. AFRICA' },
  'south-central-asia':         { displayName: 'South & Central Asia',      shortName: 'S/C ASIA' },
  'east-southeast-asia':        { displayName: 'East & Southeast Asia',     shortName: 'E/SE ASIA' },
  'oceania':                    { displayName: 'Oceania',                    shortName: 'OCEANIA' },
}

/** Check whether a string is a valid GeoRegionKey. */
export function isValidGeoRegionKey(key: string): key is GeoRegionKey {
  return (GEO_REGION_KEYS as readonly string[]).includes(key)
}

/** Get the display name for a geo key at any level. */
export function getGeoDisplayName(level: GeoLevel, key: string): string {
  if (level === 'world') return 'World'
  if (level === 'region' && isValidGeoRegionKey(key)) {
    return GEO_REGION_META[key].displayName
  }
  return key.toUpperCase()
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
  /** Trend direction compared to previous period. Undefined when threat picture data is unavailable. */
  trend?: TrendDirection
}

/**
 * Build the grid items array by joining KNOWN_CATEGORIES with live metrics.
 * Only includes categories that have at least one source (Decision 4).
 * Unknown categories from the database that are not in KNOWN_CATEGORIES
 * are mapped to the 'other' entry.
 */
export function buildGridItems(
  byCategory: CoverageByCategory[],
  trendMap?: Map<string, TrendDirection>,
): CategoryGridItem[] {
  return byCategory.map((cat) => ({
    id: cat.category,
    meta: getCategoryMeta(cat.category),
    metrics: cat,
    trend: trendMap?.get(cat.category),
  }))
}

/**
 * Build grid items for ALL known categories, merging live metrics where
 * available and filling zeroed metrics for categories with no sources.
 * Ensures the grid always shows all categories so users can click into
 * district view even before data is populated.
 */
export function buildAllGridItems(
  byCategory: CoverageByCategory[],
  trendMap?: Map<string, TrendDirection>,
): CategoryGridItem[] {
  const liveMap = new Map(byCategory.map((c) => [c.category, c]))

  return KNOWN_CATEGORIES.map((meta) => ({
    id: meta.id,
    meta,
    metrics: liveMap.get(meta.id) ?? {
      category: meta.id,
      sourceCount: 0,
      activeSources: 0,
      geographicRegions: [],
      alertCount: 0,
      p1Count: 0,
      p2Count: 0,
    },
    trend: trendMap?.get(meta.id),
  }))
}
