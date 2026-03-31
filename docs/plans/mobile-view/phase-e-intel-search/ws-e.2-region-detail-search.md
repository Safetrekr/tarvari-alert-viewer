# WS-E.2: Region Detail + Search

> **Workstream ID:** WS-E.2
> **Phase:** E -- Intel Tab + Search
> **Assigned Agent:** `information-architect`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-E.1 (Intel tab provides region card tap trigger and search bar entry point), WS-D.2 (`MobileAlertCard` component with props `item: CategoryIntelItem`, `onTap: (item: CategoryIntelItem) => void`, `isSelected?: boolean`), WS-C.1 (`MobileBottomSheet` component with `isOpen`, `onDismiss`, `config: BottomSheetConfig`, `ariaLabel` props; `SHEET_CONFIGS` constants in `src/lib/interfaces/mobile.ts`), WS-A.3 (design tokens: glass tokens `--glass-card-bg`, `--glass-card-blur`, `--glass-card-border`; severity tokens `--severity-extreme` through `--severity-unknown`; typography tokens `--font-mono`, `--text-xs`, `--text-sm`, `--text-body`, `--text-caption`; spacing tokens `--space-2` through `--space-5`, `--space-card-padding`; touch target tokens `--touch-target-min: 44px`, `--touch-target-comfortable: 48px`; animation timing token `--duration-transition`)
> **Blocks:** WS-E.3 (cross-tab "Show on Map" from region detail flies to region centroid on Map tab; cross-tab alert navigation from search results wires `onTap` and `onShowOnMap` callbacks to tab switching and map fly-to)
> **Resolves:** OVERVIEW Section 4.7 (Region drill-down from Intel tab), OVERVIEW Section 4.8 (Mobile search overlay)

---

> **Review Fixes Applied (Phase E Review):**
>
> - **H-1 (THREAT_LEVEL_COLORS):** Use `THREAT_LEVEL_COLORS` from `src/lib/interfaces/coverage.ts` (shared with E.1) instead of creating a separate definition. Uses `--posture-*` token names and E.1's hex fallbacks.
> - **M-2 (adapter directory):** `search-adapters.ts` moved to `src/lib/adapters/search-adapters.ts` (consistent with E.1's `src/lib/adapters/intel-adapters.ts`).

---

## 1. Objective

Build two linked components that extend the Intel tab (WS-E.1) with drill-down and discovery capabilities: **`MobileRegionDetail`** -- a bottom sheet content panel for geographic region threat assessment -- and **`MobileSearchOverlay`** -- a full-screen overlay for searching the intel corpus with real-time results.

**`MobileRegionDetail`** is the mobile equivalent of the desktop `GeoSummaryPanel` slide-over panel. When an analyst taps a region card on the Intel tab, a bottom sheet opens presenting: the region name and overall threat level, a per-category alert breakdown with counts, directional trend indicators (up/down/stable), notable events within the summary period, and a "Show on Map" action that flies the map camera to the region centroid. Data flows from `useLatestGeoSummary(level, key)` (120s polling, 60s stale) which returns a `GeoSummary` object containing the `structuredBreakdown` with `threatsByCategory`, `severityDistribution`, `keyEvents`, `riskTrend`, and `recommendations`. The component renders inside `MobileBottomSheet` using a new `SHEET_CONFIGS.regionDetail` configuration.

**`MobileSearchOverlay`** is a full-screen overlay (not a bottom sheet) triggered from the Intel tab search bar. It provides a search input with auto-focus, 300ms debounced real-time results from `useIntelSearch(query)` (`/console/search/intel` endpoint), category filter chips for narrowing results, result cards rendered using `MobileAlertCard` from WS-D.2, a "No results" empty state, and a recent searches list persisted in `localStorage`. The overlay is dismissed via an X button or a swipe-right gesture.

Both components introduce no new API endpoints. All data comes from existing TanStack Query hooks. A `toAlertCardItem()` adapter function bridges the `SearchResult` type from `useIntelSearch` to the `CategoryIntelItem` type expected by `MobileAlertCard`.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **`SHEET_CONFIGS.regionDetail` config** | New bottom sheet configuration appended to `SHEET_CONFIGS` in `src/lib/interfaces/mobile.ts`: snap points `[50, 100]`, `initialSnapIndex: 0`, `dismissible: true`. |
| **`MobileRegionDetail` component** | Bottom sheet content panel at `src/components/mobile/MobileRegionDetail.tsx`. Receives `regionKey: GeoRegionKey` via props. Renders: region display name (from `GEO_REGION_META`), threat level badge (color-coded by `ThreatLevel`), per-category breakdown table (from `structuredBreakdown.threatsByCategory`), severity distribution bar (from `structuredBreakdown.severityDistribution`), risk trend indicator with direction icon, notable events list (from `structuredBreakdown.keyEvents`), recommendations section, and "Show on Map" action button. |
| **`MobileSearchOverlay` component** | Full-screen overlay at `src/components/mobile/MobileSearchOverlay.tsx`. Renders above the tab bar at `z-index: 50`. Contains: search input with auto-focus and clear button, category filter chips (horizontal scroll), real-time result list using `MobileAlertCard`, loading state during search, "No results" empty state with suggestions, recent searches section (when query is empty). |
| **`useRecentSearches` hook** | Custom hook at `src/hooks/use-recent-searches.ts`. Manages recent search queries in `localStorage` under key `tarvari:recent-searches`. Stores up to 10 queries. Provides `addSearch(query)`, `removeSearch(query)`, `clearAll()`, and `searches: string[]`. |
| **`toAlertCardItem` adapter** | Utility function at `src/lib/search-adapters.ts`. Maps `SearchResult` from `useIntelSearch` to `CategoryIntelItem` from `use-category-intel` for rendering in `MobileAlertCard`. |
| **Threat level color mapping** | `THREAT_LEVEL_COLORS` constant mapping `ThreatLevel` values to CSS color tokens for badge rendering. Added to `src/lib/interfaces/coverage.ts`. |
| **CSS file** | `src/styles/mobile-region-search.css` for region detail layout, search overlay surface, filter chip styling, and reduced motion overrides. Uses `var()` references to WS-A.3 tokens. |
| **Unit tests** | Vitest component tests for `MobileRegionDetail` (rendering states, data mapping, empty summary handling) and `MobileSearchOverlay` (search triggering, result display, filter interaction, recent searches, dismiss behavior). Vitest unit tests for `useRecentSearches` (add, remove, clear, capacity limit) and `toAlertCardItem` (field mapping, null handling). |
| **Touch target compliance** | All interactive elements (filter chips, action buttons, search input clear, recent search items, X dismiss) meet `var(--touch-target-min)` (44px minimum per WCAG 2.5.8). |
| **Reduced motion support** | Overlay enter/exit animations and trend indicator animations respect `prefers-reduced-motion: reduce`. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileBottomSheet` container (drag, snap, spring physics, glass surface, portal) | WS-C.1 scope. `MobileRegionDetail` renders as content children of the sheet. |
| Cross-tab navigation implementation ("Show on Map" fly-to, tab switching, map camera positioning) | WS-E.3 scope. This WS defines callback signatures and renders action buttons; E.3 implements the handlers. |
| Intel tab layout, region card grid, search bar chrome | WS-E.1 scope. This WS provides the content that opens when those elements are tapped. |
| `MobileAlertCard` component | WS-D.2 scope. This WS imports and renders it for search results and notable events. |
| Region-filtered intel feed API endpoint (`/console/intel?region=...`) | Backend scope (TarvaRI API). Current approach uses `keyEvents` from the geo summary. See OQ-1. |
| Desktop rendering changes | All new components are mobile-only under `src/components/mobile/`. Desktop `GeoSummaryPanel` is unaffected. |
| Landscape layout variant | WS-F.1 scope. |
| Haptic feedback on filter chip toggle | WS-F.4 scope. |
| Voice search input | Out of scope entirely. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/hooks/use-geo-summaries.ts` (lines 268-288) | `useLatestGeoSummary(geoLevel, geoKey)` returning `UseQueryResult<GeoSummary \| null>`. Polls 120s, staleTime 60s. Returns `GeoSummary` with `structuredBreakdown: StructuredBreakdown` containing `threatsByCategory: Record<string, number>`, `severityDistribution: Record<string, number>`, `keyEvents: KeyEvent[]`, `riskTrend: TrendDirection`, `recommendations: string[]`. | Exists |
| `src/hooks/use-geo-summaries.ts` (lines 328-344) | `useAllGeoSummaries(enabled)` returning `UseQueryResult<GeoSummary[]>`. Polls 120s, staleTime 90s. Used for contextual region data on the Intel tab. | Exists |
| `src/hooks/use-intel-search.ts` (lines 176-199) | `useIntelSearch(params: IntelSearchParams)` returning `UseIntelSearchResult` with `queryResult: UseQueryResult<SearchResult[]>` and `debouncedQuery: string`. 300ms debounce, gated on query length >= 3. Supports `category`, `severity`, `dateFrom`, `dateTo`, `limit`, `offset` filter params. | Exists |
| `src/hooks/use-intel-search.ts` (lines 47-59) | `SearchResult` type: `id`, `title`, `snippet` (HTML with `<b>` tags), `severity`, `category`, `operationalPriority: OperationalPriority \| null`, `score: number`. | Exists |
| `src/hooks/use-geo-summaries.ts` (lines 74-84) | `KeyEvent` type: `title: string`, `category: string`, `severity: string`, `timestamp: string`. | Exists |
| `src/hooks/use-geo-summaries.ts` (lines 111-130) | `GeoSummary` type: `id`, `geoLevel: GeoLevel`, `geoKey: string`, `summaryType: SummaryType`, `threatLevel: ThreatLevel`, `summaryText: string`, `structuredBreakdown: StructuredBreakdown`, `generatedAt: string`, `validatedAt: string \| null`. | Exists |
| `src/hooks/use-category-intel.ts` (lines 24-37) | `CategoryIntelItem` type: `id`, `title`, `severity`, `category`, `eventType`, `sourceKey`, `confidence`, `geoScope`, `shortSummary`, `ingestedAt`, `sentAt`, `operationalPriority`. Target type for the adapter function. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 270-333) | `GeoLevel`, `GeoRegionKey`, `GEO_REGION_KEYS`, `GEO_REGION_META` (display names), `getGeoDisplayName()`, `isValidGeoRegionKey()`. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 263-274) | `ThreatLevel` (`'LOW' \| 'MODERATE' \| 'ELEVATED' \| 'HIGH' \| 'CRITICAL'`), `THREAT_LEVELS`, `TrendDirection` (`'up' \| 'down' \| 'stable'`). | Exists |
| `src/lib/interfaces/coverage.ts` (lines 44-61) | `KNOWN_CATEGORIES: readonly CategoryMeta[]` (15 categories with `id`, `displayName`, `shortName`, `icon`, `color`). Used for filter chip rendering. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 87-106) | `getCategoryMeta(id)`, `getCategoryColor(id)`, `getCategoryIcon(id)`, `CategoryMeta` interface. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 113-125) | `SeverityLevel`, `SEVERITY_LEVELS`, `SEVERITY_COLORS`. | Exists |
| `src/lib/time-utils.ts` (lines 21-42) | `relativeTimeAgo(isoString: string): string` for compact timestamps on key event items. | Exists |
| `src/stores/coverage.store.ts` (lines 97-104) | `summaryGeoLevel: GeoLevel`, `summaryGeoKey: string`, `summaryType: SummaryType`. Existing store state for geographic scope. | Exists |
| `src/stores/coverage.store.ts` (lines 268-284) | `openGeoSummary(level?, key?)` action. Validates region keys, sets geo state, opens panel. | Exists |
| WS-C.1 `MobileBottomSheet` | Component with `isOpen: boolean`, `onDismiss: () => void`, `config: BottomSheetConfig`, `ariaLabel: string`, `children: ReactNode`. Portal rendering, drag/snap system, scroll-vs-drag resolution. | Pending (Phase C) |
| WS-C.1 `SHEET_CONFIGS` | Existing configurations in `src/lib/interfaces/mobile.ts`. This WS appends `regionDetail` entry. Integer percentage snap points. | Pending (Phase C) |
| WS-D.2 `MobileAlertCard` | Component with `item: CategoryIntelItem`, `onTap: (item: CategoryIntelItem) => void`, `isSelected?: boolean`. 64px touch-target list item. | Pending (Phase D) |
| WS-E.1 Intel tab | Region card tap handler providing `regionKey: GeoRegionKey`. Search bar tap handler opening the search overlay. | Pending (Phase E) |
| WS-A.3 design tokens | Glass, severity, typography, spacing, touch target, and animation tokens in `src/styles/mobile-tokens.css`. | Pending (Phase A) |
| `lucide-react` | Icons: `TrendingUp`, `TrendingDown`, `Minus`, `X`, `Search`, `MapPin`, `Clock`, `ChevronRight`, `Trash2`. | Available (existing dependency) |
| `motion/react` | `motion.div`, `AnimatePresence` for overlay enter/exit, `motion.button` for press feedback. | Available (existing dependency) |

---

## 4. Deliverables

### D-1: `SHEET_CONFIGS.regionDetail` (extend `src/lib/interfaces/mobile.ts`)

Append a new `regionDetail` configuration to the existing `SHEET_CONFIGS` object defined by WS-C.1.

```typescript
// Append to existing SHEET_CONFIGS in src/lib/interfaces/mobile.ts

export const SHEET_CONFIGS = {
  // ... existing entries from WS-C.1 (alertDetail, categoryDetail, priorityFeed, filterTimeRange, settings)

  regionDetail: {
    id: 'region-detail',
    snapPoints: [50, 100] as const,
    initialSnapIndex: 0,
    dismissible: true,
  },
} as const satisfies Record<string, BottomSheetConfig>
```

**Rationale for snap points `[50, 100]`:** The region detail panel has a two-tier disclosure model. At 50%, the analyst sees the region header (name, threat level, trend), the per-category breakdown table, and the severity distribution bar -- enough for a quick situational glance. At 100%, the full content is visible including the key events list, recommendations, and action buttons. Two snap points (not three) are sufficient because region detail has less interactive depth than category detail (which has sort/filter controls and a List/Map toggle warranting a third 35% peek snap).

---

### D-2: `THREAT_LEVEL_COLORS` constant (extend `src/lib/interfaces/coverage.ts`)

Add a color mapping for the five threat levels, following the same `var()` + hex fallback pattern used by `SEVERITY_COLORS`.

```typescript
// Append to src/lib/interfaces/coverage.ts after THREAT_LEVELS

/** Maps threat level to its display color. */
export const THREAT_LEVEL_COLORS: Record<ThreatLevel, string> = {
  CRITICAL: 'var(--threat-critical, #dc2626)',
  HIGH:     'var(--threat-high, #ea580c)',
  ELEVATED: 'var(--threat-elevated, #eab308)',
  MODERATE: 'var(--threat-moderate, #3b82f6)',
  LOW:      'var(--threat-low, #22c55e)',
}

/** Get the display color for a threat level. Returns MODERATE for unknown values. */
export function getThreatLevelColor(level: string): string {
  return THREAT_LEVEL_COLORS[level as ThreatLevel] ?? THREAT_LEVEL_COLORS.MODERATE
}
```

---

### D-3: `toAlertCardItem` adapter (`src/lib/search-adapters.ts`)

Adapter function bridging `SearchResult` (from `useIntelSearch`) and `KeyEvent` (from geo summaries) to `CategoryIntelItem` (expected by `MobileAlertCard`). Two adapters are provided for the two source types consumed by this workstream.

```typescript
/**
 * Adapters for converting search results and geo summary events
 * to the CategoryIntelItem shape expected by MobileAlertCard.
 *
 * @module search-adapters
 * @see WS-E.2
 */

import type { SearchResult } from '@/hooks/use-intel-search'
import type { KeyEvent } from '@/hooks/use-geo-summaries'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import type { OperationalPriority } from '@/lib/interfaces/coverage'

/**
 * Convert a SearchResult to CategoryIntelItem for MobileAlertCard rendering.
 *
 * Maps known fields directly. Fields unavailable from search are set to
 * safe defaults:
 * - `eventType`, `sourceKey`, `confidence`, `geoScope`, `sentAt` = null
 * - `shortSummary` = HTML-stripped snippet
 * - `ingestedAt` = '' (relativeTimeAgo returns 'NOW' for invalid dates)
 */
export function searchResultToAlertCardItem(result: SearchResult): CategoryIntelItem {
  return {
    id: result.id,
    title: result.title,
    severity: result.severity,
    category: result.category,
    eventType: null,
    sourceKey: null,
    confidence: null,
    geoScope: null,
    shortSummary: stripHtmlTags(result.snippet),
    ingestedAt: '',
    sentAt: null,
    operationalPriority: result.operationalPriority,
  }
}

/**
 * Convert a KeyEvent from a geo summary to CategoryIntelItem for
 * MobileAlertCard rendering in the region detail notable events list.
 *
 * KeyEvents have minimal data. Missing fields are set to safe defaults.
 * A synthetic ID is generated from title hash to satisfy the id field.
 */
export function keyEventToAlertCardItem(event: KeyEvent, index: number): CategoryIntelItem {
  return {
    id: `key-event-${index}-${hashString(event.title)}`,
    title: event.title,
    severity: event.severity,
    category: event.category,
    eventType: null,
    sourceKey: null,
    confidence: null,
    geoScope: null,
    shortSummary: null,
    ingestedAt: event.timestamp,
    sentAt: null,
    operationalPriority: null,
  }
}

/** Strip HTML tags from a string (for snippet display). */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/** Simple string hash for generating synthetic IDs. */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}
```

**Design decision:** Two separate adapter functions (rather than a union-type adapter) maintain type safety and make the mapping explicit at each call site. The `relativeTimeAgo('')` call in `MobileAlertCard` returns `'NOW'` for search results, which is acceptable for a search context where recency is less relevant than relevance. See AD-4 for rationale.

---

### D-4: `useRecentSearches` hook (`src/hooks/use-recent-searches.ts`)

Custom hook managing recent search queries persisted in `localStorage`.

```typescript
/**
 * Hook for managing recent intel search queries in localStorage.
 *
 * Stores up to MAX_RECENT_SEARCHES queries, most recent first.
 * Deduplicates by normalized (trimmed, lowercased) query string.
 * SSR-safe: returns empty array when localStorage is unavailable.
 *
 * @module use-recent-searches
 * @see WS-E.2
 */

'use client'

import { useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'tarvari:recent-searches'
const MAX_RECENT_SEARCHES = 10

export interface UseRecentSearchesResult {
  /** Recent search queries, most recent first. */
  searches: string[]
  /** Add a query to the recent list. Deduplicates and caps at MAX_RECENT_SEARCHES. */
  addSearch: (query: string) => void
  /** Remove a single query from the recent list. */
  removeSearch: (query: string) => void
  /** Clear all recent searches. */
  clearAll: () => void
}

function loadSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_SEARCHES) : []
  } catch {
    return []
  }
}

function saveSearches(searches: string[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
  } catch {
    // localStorage full or unavailable -- fail silently
  }
}

export function useRecentSearches(): UseRecentSearchesResult {
  const [searches, setSearches] = useState<string[]>([])

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    setSearches(loadSearches())
  }, [])

  const addSearch = useCallback((query: string) => {
    const normalized = query.trim()
    if (normalized.length < 3) return

    setSearches((prev) => {
      const filtered = prev.filter(
        (s) => s.toLowerCase() !== normalized.toLowerCase(),
      )
      const next = [normalized, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      saveSearches(next)
      return next
    })
  }, [])

  const removeSearch = useCallback((query: string) => {
    setSearches((prev) => {
      const next = prev.filter(
        (s) => s.toLowerCase() !== query.toLowerCase(),
      )
      saveSearches(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setSearches([])
    saveSearches([])
  }, [])

  return { searches, addSearch, removeSearch, clearAll }
}
```

---

### D-5: `MobileRegionDetail` component (`src/components/mobile/MobileRegionDetail.tsx`)

Bottom sheet content panel rendering the full region threat assessment. Receives a `GeoRegionKey` and fetches data via `useLatestGeoSummary('region', regionKey)`.

**Props interface:**

```typescript
import type { GeoRegionKey } from '@/lib/interfaces/coverage'

export interface MobileRegionDetailProps {
  /** The region to display. */
  readonly regionKey: GeoRegionKey
  /** Called when "Show on Map" action is tapped. Receives region key for fly-to. */
  readonly onShowOnMap: (regionKey: GeoRegionKey) => void
  /** Called when a key event is tapped. Opens alert detail or navigates to category. */
  readonly onEventTap: (event: { title: string; category: string; severity: string }) => void
}
```

**Visual layout (portrait, inside bottom sheet):**

```
+---------------------------------------------------------------+
|  [Drag Handle]                                                |
|                                                               |
|  MIDDLE EAST                          [ELEVATED ^^^]          |
|  Risk trend: Increasing                                       |
|                                                               |
|  --- Per-Category Breakdown ---                               |
|  Conflict          ████████████   12                          |
|  Seismic           ████           4                           |
|  Weather           ███            3                           |
|  Health            ██             2                           |
|  Infrastructure    █              1                           |
|                                                               |
|  --- Severity Distribution ---                                |
|  [Extreme 2] [Severe 5] [Moderate 8] [Minor 7]              |
|                                                               |
|  --- Notable Events ---              (visible at 100% snap)  |
|  [*] 7.2 Earthquake Near ...     5m  [>]                     |
|  [*] Coalition Strike on ...     2h  [>]                     |
|  [*] Flood Warning Along ...     4h  [>]                     |
|                                                               |
|  --- Recommendations ---                                      |
|  - Monitor seismic activity...                                |
|  - Review evacuation routes...                                |
|                                                               |
|  [   Show on Map   ]                                          |
+---------------------------------------------------------------+
```

**Visual specification:**

| Element | Property | Value | Token |
|---------|----------|-------|-------|
| **Region name** | Font-size | `var(--text-sm, 14px)` | `--text-sm` |
| | Font-weight | 600 | -- |
| | Letter-spacing | `0.08em` | -- |
| | Text-transform | `uppercase` | -- |
| | Color | `rgba(255, 255, 255, 0.70)` | -- |
| | Font-family | `var(--font-mono, monospace)` | `--font-mono` |
| **Threat level badge** | Font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Padding | `4px 10px` | -- |
| | Border-radius | 4px | -- |
| | Background | `color-mix(in srgb, ${getThreatLevelColor(level)} 20%, transparent)` | -- |
| | Color | `getThreatLevelColor(level)` | `--threat-*` |
| | Font-weight | 600 | -- |
| | Letter-spacing | `0.06em` | -- |
| **Trend indicator** | Icon size | 14px | -- |
| | Color (up) | `var(--severity-extreme, #ef4444)` | `--severity-extreme` |
| | Color (down) | `var(--threat-low, #22c55e)` | `--threat-low` |
| | Color (stable) | `rgba(255, 255, 255, 0.30)` | -- |
| **Category row** | Height | 36px | -- |
| | Gap | 12px | -- |
| | Bar height | 6px, border-radius 3px | -- |
| | Bar color | `getCategoryColor(categoryId)` at 60% opacity | `--category-*` |
| | Count label | `var(--text-caption, 10px)`, `rgba(255, 255, 255, 0.40)` | `--text-caption` |
| | Category name | `var(--text-body, 13px)`, `rgba(255, 255, 255, 0.50)` | `--text-body` |
| **Severity bar** | Height | 8px | -- |
| | Segments | Proportional width per severity, colored by `SEVERITY_COLORS` | `--severity-*` |
| | Border-radius | 4px (outer), 0 (inner segments) | -- |
| | Gap between segments | 1px transparent | -- |
| **Section headers** | Font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Letter-spacing | `0.12em` | -- |
| | Text-transform | `uppercase` | -- |
| | Color | `rgba(255, 255, 255, 0.25)` | -- |
| | Margin-top | `var(--space-5, 20px)` | `--space-5` |
| **Notable events** | Component | `MobileAlertCard` via `keyEventToAlertCardItem` adapter | -- |
| **Recommendations** | Font-size | `var(--text-body, 13px)` | `--text-body` |
| | Color | `rgba(255, 255, 255, 0.40)` | -- |
| | Line-height | 1.5 | -- |
| | List-style | `'- '` prefix, no bullets | -- |
| **"Show on Map" button** | Min-height | `var(--touch-target-comfortable, 48px)` | `--touch-target-comfortable` |
| | Width | `100%` | -- |
| | Background | `rgba(255, 255, 255, 0.06)` | -- |
| | Border | `1px solid rgba(255, 255, 255, 0.08)` | -- |
| | Border-radius | 8px | -- |
| | Font-size | `var(--text-body, 13px)` | `--text-body` |
| | Font-family | `var(--font-mono, monospace)` | `--font-mono` |
| | Color | `rgba(255, 255, 255, 0.50)` | -- |
| | Icon | `MapPin` from `lucide-react`, 16px, left of label | -- |
| | Margin-top | `var(--space-5, 20px)` | `--space-5` |
| | Margin-bottom | `var(--safe-area-bottom, 0px)` | `--safe-area-bottom` |

**Progressive disclosure by snap point:**

| Snap | Viewport | Visible Content |
|------|----------|-----------------|
| 50% | Half-screen | Region header (name, threat level, trend), per-category breakdown, severity distribution bar |
| 100% | Full-screen | All 50% content + notable events list, recommendations, "Show on Map" action button |

**Loading and empty states:**

| State | Behavior |
|-------|----------|
| Loading | Skeleton placeholders: 1 header bar (120px wide), 5 category row bars, 1 severity distribution bar. Pulse animation. |
| No summary data | Empty state: "No threat summary available for this region. Summaries are generated periodically by the intel pipeline." |
| Empty category breakdown | Section hidden (no "Per-Category Breakdown" header rendered). |
| Empty key events | Section hidden at 100% snap. Only recommendations and action button visible. |

**Implementation skeleton:**

```typescript
/**
 * Mobile region detail -- bottom sheet content for geographic
 * threat assessment drill-down.
 *
 * Renders inside MobileBottomSheet with SHEET_CONFIGS.regionDetail.
 * Data from useLatestGeoSummary('region', regionKey).
 *
 * @module MobileRegionDetail
 * @see WS-E.2
 */

'use client'

import { memo, useMemo } from 'react'
import { motion } from 'motion/react'
import { TrendingUp, TrendingDown, Minus, MapPin } from 'lucide-react'

import { useLatestGeoSummary } from '@/hooks/use-geo-summaries'
import { MobileAlertCard } from '@/components/mobile/MobileAlertCard'
import { keyEventToAlertCardItem } from '@/lib/search-adapters'
import {
  GEO_REGION_META,
  getCategoryMeta,
  getCategoryColor,
  SEVERITY_COLORS,
  SEVERITY_LEVELS,
  type GeoRegionKey,
  type TrendDirection,
  type SeverityLevel,
} from '@/lib/interfaces/coverage'
import { getThreatLevelColor } from '@/lib/interfaces/coverage'

export interface MobileRegionDetailProps {
  readonly regionKey: GeoRegionKey
  readonly onShowOnMap: (regionKey: GeoRegionKey) => void
  readonly onEventTap: (event: { title: string; category: string; severity: string }) => void
}

export const MobileRegionDetail = memo(function MobileRegionDetail({
  regionKey,
  onShowOnMap,
  onEventTap,
}: MobileRegionDetailProps) {
  const { data: summary, isLoading } = useLatestGeoSummary('region', regionKey)

  const regionMeta = GEO_REGION_META[regionKey]

  // Sort categories by count descending for the breakdown
  const sortedCategories = useMemo(() => {
    if (!summary) return []
    return Object.entries(summary.structuredBreakdown.threatsByCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({ category, count }))
  }, [summary])

  const maxCategoryCount = sortedCategories[0]?.count ?? 1

  // Key events adapted for MobileAlertCard
  const keyEventItems = useMemo(() => {
    if (!summary) return []
    return summary.structuredBreakdown.keyEvents.map(keyEventToAlertCardItem)
  }, [summary])

  if (isLoading) {
    return <RegionDetailSkeleton />
  }

  if (!summary) {
    return <RegionDetailEmpty regionName={regionMeta.displayName} />
  }

  return (
    <div
      style={{
        padding: 'var(--space-card-padding, 14px)',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {/* Region header */}
      {/* Per-category breakdown */}
      {/* Severity distribution bar */}
      {/* Notable events (MobileAlertCard via adapter) */}
      {/* Recommendations */}
      {/* Show on Map action button */}
    </div>
  )
})
```

**Trend indicator component (inline):**

```typescript
function TrendIcon({ direction }: { direction: TrendDirection }) {
  const iconProps = { size: 14, strokeWidth: 2 }
  switch (direction) {
    case 'up':
      return <TrendingUp {...iconProps} style={{ color: 'var(--severity-extreme, #ef4444)' }} />
    case 'down':
      return <TrendingDown {...iconProps} style={{ color: 'var(--threat-low, #22c55e)' }} />
    case 'stable':
      return <Minus {...iconProps} style={{ color: 'rgba(255, 255, 255, 0.30)' }} />
  }
}
```

---

### D-6: `MobileSearchOverlay` component (`src/components/mobile/MobileSearchOverlay.tsx`)

Full-screen search overlay rendering above the tab bar. Not a bottom sheet -- uses `AnimatePresence` for enter/exit transitions.

**Props interface:**

```typescript
export interface MobileSearchOverlayProps {
  /** Whether the overlay is visible. */
  readonly isOpen: boolean
  /** Called when the overlay should close (X button, swipe-right, or Escape key). */
  readonly onDismiss: () => void
  /** Called when a search result is tapped. Opens the alert detail sheet. */
  readonly onResultTap: (item: CategoryIntelItem) => void
}
```

**Visual layout (portrait, full-screen):**

```
+---------------------------------------------------------------+
|  [X]   [__________________________] [Clear]                  |
|                                                               |
|  Category filters (horizontal scroll):                        |
|  [All] [Seismic] [Conflict] [Weather] [Health] ...           |
|                                                               |
|  --- Results ---                                              |
|  [*] 7.2 Earthquake Near Port ...    SEIS   [>]             |
|  [*] Aftershock Reported in ...      SEIS   [>]             |
|  [*] Tsunami Advisory Issued ...     MAR    [>]             |
|  [*] Seismic Activity Surges ...     SEIS   [>]             |
|                                                               |
|  (or when query is empty:)                                    |
|  --- Recent Searches ---                                      |
|  [clock] earthquake        [X]                                |
|  [clock] middle east       [X]                                |
|  [clock] conflict syria    [X]                                |
|                          [Clear All]                          |
+---------------------------------------------------------------+
```

**Visual specification:**

| Element | Property | Value | Token |
|---------|----------|-------|-------|
| **Overlay container** | Position | `fixed`, `inset: 0` | -- |
| | z-index | 50 | -- |
| | Background | `var(--glass-sheet-bg, rgba(10, 10, 14, 0.95))` | `--glass-sheet-bg` |
| | Backdrop-filter | `blur(var(--glass-sheet-blur, 20px))` | `--glass-sheet-blur` |
| | Padding-top | `env(safe-area-inset-top, 0px)` | -- |
| **Search bar** | Height | `var(--touch-target-comfortable, 48px)` | `--touch-target-comfortable` |
| | Margin | `var(--space-3, 12px) var(--space-card-padding, 14px)` | `--space-3`, `--space-card-padding` |
| | Background | `rgba(255, 255, 255, 0.04)` | -- |
| | Border | `1px solid rgba(255, 255, 255, 0.08)` | -- |
| | Border-radius | 8px | -- |
| | Padding | `0 12px` | -- |
| | Font-size | `var(--text-body, 13px)` | `--text-body` |
| | Font-family | `var(--font-mono, monospace)` | `--font-mono` |
| | Color | `rgba(255, 255, 255, 0.60)` | -- |
| | Placeholder color | `rgba(255, 255, 255, 0.25)` | -- |
| **X dismiss button** | Size | `var(--touch-target-min, 44px)` square | `--touch-target-min` |
| | Icon | `X` from `lucide-react`, 20px | -- |
| | Color | `rgba(255, 255, 255, 0.40)` | -- |
| **Clear input button** | Size | `var(--touch-target-min, 44px)` square | `--touch-target-min` |
| | Icon | `X` from `lucide-react`, 14px | -- |
| | Visibility | Only when input has text | -- |
| **Filter chip** | Min-height | `var(--touch-target-min, 44px)` | `--touch-target-min` |
| | Padding | `8px 16px` | -- |
| | Border-radius | 20px | -- |
| | Font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Letter-spacing | `0.06em` | -- |
| | Text-transform | `uppercase` | -- |
| | Font-weight | 500 | -- |
| | Background (idle) | `rgba(255, 255, 255, 0.04)` | -- |
| | Background (active) | `color-mix(in srgb, ${getCategoryColor(id)} 20%, transparent)` | `--category-*` |
| | Color (idle) | `rgba(255, 255, 255, 0.35)` | -- |
| | Color (active) | `getCategoryColor(id)` at 70% opacity | `--category-*` |
| | Border (idle) | `1px solid rgba(255, 255, 255, 0.06)` | -- |
| | Border (active) | `1px solid color-mix(in srgb, ${getCategoryColor(id)} 30%, transparent)` | -- |
| | Gap between chips | 8px | -- |
| | Scroll container | `overflow-x: auto`, `-webkit-overflow-scrolling: touch`, `scrollbar-width: none` | -- |
| **Filter chip row** | Padding | `0 var(--space-card-padding, 14px)` | `--space-card-padding` |
| | Margin-bottom | `var(--space-3, 12px)` | `--space-3` |
| **Result list** | Padding | `0` (cards handle their own padding) | -- |
| | Overflow | `auto`, flex: 1 | -- |
| **Recent search item** | Min-height | `var(--touch-target-min, 44px)` | `--touch-target-min` |
| | Padding | `0 var(--space-card-padding, 14px)` | `--space-card-padding` |
| | Display | flex, align-items center, gap 12px | -- |
| | Icon | `Clock` from `lucide-react`, 14px, `rgba(255, 255, 255, 0.20)` | -- |
| | Text | `var(--text-body, 13px)`, `rgba(255, 255, 255, 0.40)` | `--text-body` |
| | Delete icon | `X`, 14px, `rgba(255, 255, 255, 0.15)`, 44px touch target | -- |
| **"Clear All" link** | Min-height | `var(--touch-target-min, 44px)` | `--touch-target-min` |
| | Font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Color | `rgba(255, 255, 255, 0.25)` | -- |
| | Text-align | center | -- |
| **Loading state** | Spinner | 20px circle, `rgba(255, 255, 255, 0.20)` border, animated rotation | -- |
| | Position | Centered below filter chips | -- |
| **Empty state (no results)** | Title | "No results", `var(--text-sm, 14px)`, `rgba(255, 255, 255, 0.40)` | `--text-sm` |
| | Subtitle | "Try different keywords or remove filters", `var(--text-caption, 10px)`, `rgba(255, 255, 255, 0.20)` | `--text-caption` |
| | Alignment | Centered, `padding-top: 40px` | -- |

**Overlay enter/exit animation:**

```typescript
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}
      style={{ position: 'fixed', inset: 0, zIndex: 50 }}
    >
      {/* overlay content */}
    </motion.div>
  )}
</AnimatePresence>
```

**Swipe-right-to-dismiss:**

The overlay supports swipe-right dismissal using `motion.div` `drag="x"` constrained to `dragConstraints={{ left: 0, right: 0 }}` with an `onDragEnd` handler that calls `onDismiss()` when the horizontal drag velocity exceeds 500px/s or the drag offset exceeds 40% of viewport width.

```typescript
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={{ left: 0, right: 0.3 }}
  onDragEnd={(_, info) => {
    if (info.velocity.x > 500 || info.offset.x > window.innerWidth * 0.4) {
      onDismiss()
    }
  }}
>
```

**Search flow:**

1. Overlay opens with search input auto-focused. Recent searches shown if query is empty.
2. User types. After 300ms debounce (handled by `useIntelSearch`), results appear.
3. Category filter chips refine results (passed as `category` param to `useIntelSearch`).
4. Tapping a result fires `onResultTap` with the adapted `CategoryIntelItem`.
5. On result tap, `addSearch(query)` persists the current query to recent searches.
6. Overlay dismisses via X button, swipe-right, or Escape key.

**Implementation skeleton:**

```typescript
/**
 * Mobile search overlay -- full-screen intel search with real-time results.
 *
 * Renders above the tab bar (z-50). Not a bottom sheet.
 * Data from useIntelSearch(params). Results rendered via MobileAlertCard.
 *
 * @module MobileSearchOverlay
 * @see WS-E.2
 */

'use client'

import { memo, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Search, Clock } from 'lucide-react'

import { useIntelSearch, type IntelSearchParams } from '@/hooks/use-intel-search'
import { useRecentSearches } from '@/hooks/use-recent-searches'
import { MobileAlertCard } from '@/components/mobile/MobileAlertCard'
import { searchResultToAlertCardItem } from '@/lib/search-adapters'
import { KNOWN_CATEGORIES, getCategoryColor } from '@/lib/interfaces/coverage'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'

export interface MobileSearchOverlayProps {
  readonly isOpen: boolean
  readonly onDismiss: () => void
  readonly onResultTap: (item: CategoryIntelItem) => void
}

export const MobileSearchOverlay = memo(function MobileSearchOverlay({
  isOpen,
  onDismiss,
  onResultTap,
}: MobileSearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  const searchParams: IntelSearchParams = {
    query,
    category: selectedCategory,
    limit: 20,
  }

  const { queryResult, debouncedQuery } = useIntelSearch(searchParams)
  const { searches, addSearch, removeSearch, clearAll } = useRecentSearches()

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      // Delay to allow animation to start
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Escape key to dismiss
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onDismiss])

  const handleResultTap = useCallback(
    (item: CategoryIntelItem) => {
      if (debouncedQuery.length >= 3) {
        addSearch(debouncedQuery)
      }
      onResultTap(item)
    },
    [debouncedQuery, addSearch, onResultTap],
  )

  const handleRecentTap = useCallback(
    (recentQuery: string) => {
      setQuery(recentQuery)
    },
    [],
  )

  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      setSelectedCategory((prev) =>
        prev === categoryId ? undefined : categoryId,
      )
    },
    [],
  )

  // Map search results to MobileAlertCard items
  const resultItems = (queryResult.data ?? []).map(searchResultToAlertCardItem)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-label="Search intel"
          aria-modal="true"
          /* enter/exit + drag-to-dismiss as specified above */
        >
          {/* Search bar with X dismiss and clear */}
          {/* Category filter chips (horizontal scroll) */}
          {/* Results or Recent Searches or Empty State */}
        </motion.div>
      )}
    </AnimatePresence>
  )
})
```

---

### D-7: CSS file (`src/styles/mobile-region-search.css`)

Shared CSS for both `MobileRegionDetail` and `MobileSearchOverlay`. Uses `var()` references to WS-A.3 tokens throughout.

```css
/* ============================================================
 * Mobile Region Detail + Search Overlay
 * WS-E.2
 *
 * Uses design tokens from WS-A.3 mobile-tokens.css.
 * All colors via var() with hardcoded fallbacks.
 * ============================================================ */

/* --- Region Detail --- */

.region-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3, 12px);
  margin-bottom: var(--space-4, 16px);
}

.region-detail-name {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-sm, 14px);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.70);
  margin: 0;
}

.region-detail-threat-badge {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-caption, 10px);
  font-weight: 600;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.region-detail-trend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-caption, 10px);
  color: rgba(255, 255, 255, 0.30);
  margin-top: 4px;
}

.category-breakdown-row {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  height: 36px;
}

.category-breakdown-name {
  font-size: var(--text-body, 13px);
  color: rgba(255, 255, 255, 0.50);
  width: 120px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-breakdown-bar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.category-breakdown-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 300ms ease-out;
}

.category-breakdown-count {
  font-size: var(--text-caption, 10px);
  color: rgba(255, 255, 255, 0.40);
  width: 32px;
  text-align: right;
  flex-shrink: 0;
}

.severity-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  gap: 1px;
  margin-top: var(--space-2, 8px);
}

.severity-bar-segment {
  height: 100%;
  transition: flex 300ms ease-out;
}

.section-header {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-caption, 10px);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.25);
  margin-top: var(--space-5, 20px);
  margin-bottom: var(--space-2, 8px);
}

.region-recommendations {
  list-style: none;
  padding: 0;
  margin: 0;
}

.region-recommendations li {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-body, 13px);
  color: rgba(255, 255, 255, 0.40);
  line-height: 1.5;
  padding: var(--space-2, 8px) 0;
}

.region-recommendations li::before {
  content: '- ';
  color: rgba(255, 255, 255, 0.20);
}

.region-show-on-map {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: var(--touch-target-comfortable, 48px);
  margin-top: var(--space-5, 20px);
  margin-bottom: var(--safe-area-bottom, 0px);
  padding: 0 var(--space-card-padding, 14px);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-body, 13px);
  color: rgba(255, 255, 255, 0.50);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* --- Search Overlay --- */

.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  background: var(--glass-sheet-bg, rgba(10, 10, 14, 0.95));
  backdrop-filter: blur(var(--glass-sheet-blur, 20px));
  -webkit-backdrop-filter: blur(var(--glass-sheet-blur, 20px));
  padding-top: env(safe-area-inset-top, 0px);
}

.search-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--space-3, 12px) var(--space-card-padding, 14px);
}

.search-dismiss-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target-min, 44px);
  height: var(--touch-target-min, 44px);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.40);
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 100%;
  height: var(--touch-target-comfortable, 48px);
  padding: 0 40px 0 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-body, 13px);
  color: rgba(255, 255, 255, 0.60);
  outline: none;
  -webkit-appearance: none;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

.search-input:focus {
  border-color: rgba(255, 255, 255, 0.15);
}

.search-clear-btn {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target-min, 44px);
  height: var(--touch-target-min, 44px);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* --- Category Filter Chips --- */

.filter-chip-row {
  display: flex;
  gap: 8px;
  padding: 0 var(--space-card-padding, 14px);
  margin-bottom: var(--space-3, 12px);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.filter-chip-row::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  display: flex;
  align-items: center;
  min-height: var(--touch-target-min, 44px);
  padding: 8px 16px;
  border-radius: 20px;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-caption, 10px);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.35);
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
}

.filter-chip[data-active='true'] {
  /* Active state colors set via inline style using getCategoryColor */
}

/* --- Recent Searches --- */

.recent-search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: var(--touch-target-min, 44px);
  padding: 0 var(--space-card-padding, 14px);
  background: none;
  border: none;
  width: 100%;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.recent-search-icon {
  color: rgba(255, 255, 255, 0.20);
  flex-shrink: 0;
}

.recent-search-text {
  flex: 1;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-body, 13px);
  color: rgba(255, 255, 255, 0.40);
  text-align: left;
}

.recent-search-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target-min, 44px);
  height: var(--touch-target-min, 44px);
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.15);
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.recent-clear-all {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--touch-target-min, 44px);
  width: 100%;
  background: none;
  border: none;
  font-family: var(--font-mono, monospace);
  font-size: var(--text-caption, 10px);
  color: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* --- Empty / Loading States --- */

.search-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
  gap: 8px;
}

.search-empty-title {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-sm, 14px);
  color: rgba(255, 255, 255, 0.40);
}

.search-empty-subtitle {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-caption, 10px);
  color: rgba(255, 255, 255, 0.20);
}

.search-loading {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.search-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-top-color: rgba(255, 255, 255, 0.20);
  border-radius: 50%;
  animation: spin 800ms linear infinite;
}

/* --- Skeleton --- */

.region-skeleton-bar {
  height: 14px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* --- Reduced Motion --- */

@media (prefers-reduced-motion: reduce) {
  .category-breakdown-fill,
  .severity-bar-segment {
    transition: none;
  }

  .search-spinner {
    animation-duration: 2s;
  }

  .region-skeleton-bar {
    animation: none;
    opacity: 0.6;
  }

  .filter-chip {
    transition: none;
  }
}
```

---

### D-8: Unit tests

**Test files:**

| File | Tests |
|------|-------|
| `src/components/mobile/__tests__/MobileRegionDetail.test.tsx` | Renders region name from `GEO_REGION_META`. Renders threat level badge with correct color. Renders per-category breakdown sorted descending. Renders severity distribution bar with proportional segments. Renders key events as `MobileAlertCard` instances. Shows skeleton during loading. Shows empty state when no summary. Fires `onShowOnMap(regionKey)` on button tap. Fires `onEventTap` when a key event card is tapped. Hides empty sections (no category breakdown, no key events). |
| `src/components/mobile/__tests__/MobileSearchOverlay.test.tsx` | Auto-focuses input on open. Renders category filter chips for all 15 known categories. Fires `onDismiss` on X button click. Fires `onDismiss` on Escape key. Shows recent searches when query is empty. Hides recent searches when query has text. Shows loading spinner during search. Renders results as `MobileAlertCard` instances. Shows empty state for zero results. Filter chip toggles update search params. Tapping a result calls `onResultTap` with adapted item. Tapping a result saves query to recent searches. Tapping a recent search fills the input. |
| `src/hooks/__tests__/use-recent-searches.test.ts` | Loads from localStorage on mount. Adds search to front of list. Deduplicates (case-insensitive). Caps at 10 entries. Removes single entry. Clears all entries. Ignores queries shorter than 3 characters. Handles localStorage unavailability gracefully. |
| `src/lib/__tests__/search-adapters.test.ts` | `searchResultToAlertCardItem`: maps all shared fields. Sets null for unavailable fields. Strips HTML from snippet. `keyEventToAlertCardItem`: maps all fields. Generates synthetic ID. Uses timestamp for `ingestedAt`. |

---

## 5. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-1 | `MobileRegionDetail` renders inside `MobileBottomSheet` with `SHEET_CONFIGS.regionDetail` (snap points 50/100, initial snap 50). | Render component inside sheet. Verify sheet opens at ~50% viewport height. Drag to 100%, verify snap. |
| AC-2 | Region name matches `GEO_REGION_META[regionKey].displayName` and is displayed in uppercase with monospace font. | Pass each of the 11 `GeoRegionKey` values. Verify display name renders correctly. |
| AC-3 | Threat level badge renders with correct color from `THREAT_LEVEL_COLORS` and displays the threat level text. | Mock summary data with each `ThreatLevel` value. Verify badge background and text color. |
| AC-4 | Per-category breakdown renders categories sorted by count descending, with proportional bars colored by `getCategoryColor()`. | Mock summary with 5+ categories. Verify sort order and bar width proportions. |
| AC-5 | Trend indicator shows correct icon: `TrendingUp` (red) for `'up'`, `TrendingDown` (green) for `'down'`, `Minus` (gray) for `'stable'`. | Mock each `TrendDirection` value. Verify icon and color. |
| AC-6 | Notable events render as `MobileAlertCard` instances using the `keyEventToAlertCardItem` adapter. | Mock summary with 3+ key events. Verify `MobileAlertCard` renders for each. |
| AC-7 | "Show on Map" button fires `onShowOnMap(regionKey)` when tapped. Button meets 48px touch target. | Tap button. Verify callback fires with correct region key. Measure touch target. |
| AC-8 | Region detail shows skeleton placeholders during loading state. | Set `useLatestGeoSummary` to loading. Verify skeleton renders. |
| AC-9 | Region detail shows empty state message when no summary data exists. | Set `useLatestGeoSummary` to return null. Verify empty state renders. |
| AC-10 | `MobileSearchOverlay` renders as a full-screen overlay at z-index 50 when `isOpen` is true. | Open overlay. Verify it covers the full viewport and sits above tab bar. |
| AC-11 | Search input auto-focuses when the overlay opens. | Open overlay. Verify input has focus within 200ms. |
| AC-12 | Search results appear after 300ms debounce when query length >= 3 characters. | Type "ear" slowly. Verify results appear ~300ms after the third character. |
| AC-13 | Results render as `MobileAlertCard` instances via `searchResultToAlertCardItem` adapter. | Search for a known term. Verify `MobileAlertCard` instances render with correct data. |
| AC-14 | Category filter chips are scrollable horizontally. Tapping a chip filters results by that category. Tapping again deselects. | Scroll chip row. Tap a chip. Verify results filtered. Tap again. Verify unfiltered. |
| AC-15 | "No results" empty state renders when search returns zero results. | Search for a nonsense string. Verify empty state with "No results" message. |
| AC-16 | Recent searches appear when overlay is open and query is empty. Items are tappable (fills input) and individually deletable. | Open overlay without typing. Verify recent list. Tap an item. Verify query fills. Delete an item. Verify removed. |
| AC-17 | Recent searches persist across overlay open/close cycles via `localStorage` under key `tarvari:recent-searches`. | Add searches, close overlay, reopen. Verify searches persist. |
| AC-18 | Recent searches cap at 10 entries, most recent first, deduplicated case-insensitively. | Add 12 searches. Verify only 10 stored. Add duplicate with different case. Verify deduplication. |
| AC-19 | "Clear All" button removes all recent searches from localStorage and UI. | Click "Clear All". Verify list empties and localStorage key is updated. |
| AC-20 | Overlay dismisses via X button (fires `onDismiss`). | Tap X. Verify overlay closes. |
| AC-21 | Overlay dismisses via Escape key. | Press Escape. Verify overlay closes. |
| AC-22 | Overlay dismisses via swipe-right gesture when velocity > 500px/s or offset > 40% viewport width. | Swipe right quickly. Verify overlay closes. |
| AC-23 | All interactive elements (X button, clear input, filter chips, recent search items, delete buttons, "Clear All", "Show on Map") meet `var(--touch-target-min)` (44px). | Inspect computed dimensions. All >= 44x44px. |
| AC-24 | Animations respect `prefers-reduced-motion: reduce`. Skeleton pulse, spinner rotation, filter chip transitions disabled or slowed. | Enable reduced motion. Verify animations are reduced. |
| AC-25 | `toAlertCardItem` adapter correctly maps `SearchResult.snippet` to `CategoryIntelItem.shortSummary` with HTML tags stripped. | Pass SearchResult with `<b>term</b>` snippet. Verify stripped output. |
| AC-26 | Overlay enter animation slides from right (x: 100% to 0) with spring physics. Exit reverses. | Open and close overlay. Verify slide animation direction. |
| AC-27 | Severity distribution bar in region detail renders proportional colored segments matching `SEVERITY_COLORS`. | Mock summary with severity distribution `{ Extreme: 2, Severe: 5, Moderate: 8 }`. Verify bar segment proportions and colors. |

---

## 6. Architectural Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-1 | Region detail uses `MobileBottomSheet` (not full-screen overlay). | Consistent with category detail (WS-D.1) and alert detail (WS-D.2) patterns. The bottom sheet with drag/snap provides progressive disclosure at two snap points (50%/100%), matching the analyst's glance-then-drill workflow. A full-screen overlay would break the spatial consistency. |
| AD-2 | Search uses a full-screen overlay (not a bottom sheet). | Search requires persistent keyboard input, real-time results scrolling, and horizontal filter chips. A bottom sheet's drag-vs-scroll conflict would fight the search input and scrolling result list. Full-screen overlay gives the search input room to breathe and eliminates drag interference. The slide-from-right animation differentiates it visually from bottom-up sheets. |
| AD-3 | Region detail snap points are `[50, 100]` (two stops, not three). | Region detail has simpler content than category detail (which uses `[35, 65, 100]` for three progressive disclosure tiers). Region detail needs only "summary glance" (50%) and "full detail" (100%). A third intermediate snap would add complexity without proportional information gain. |
| AD-4 | Search results rendered via `MobileAlertCard` with an adapter function, not a dedicated search card component. | WS-D.2 designed `MobileAlertCard` to be reused across category detail, intel tab, and search (per its objective statement). An adapter function (`searchResultToAlertCardItem`) bridges the type gap with minimal code. The `relativeTimeAgo('')` call returns `'NOW'` for search results where `ingestedAt` is unavailable -- acceptable for a search context where relevance score, not recency, is the primary signal. |
| AD-5 | Region "recent alerts" sourced from `structuredBreakdown.keyEvents`, not a raw intel feed filtered by region. | No existing API endpoint supports filtering intel by geographic region. The `/console/intel` endpoint accepts `category` and `limit` but not `region`. The `keyEvents` array in geo summaries is curated by the AI pipeline and already region-scoped, providing the most relevant notable events. See OQ-1 for the future API enhancement. |
| AD-6 | Recent searches stored in `localStorage` (not Zustand, not session). | Searches should persist across browser sessions (unlike UI state). `localStorage` is the appropriate persistence layer for user preferences. The 10-entry cap and key `tarvari:recent-searches` are scoped to avoid conflicts. Zustand would lose data on page refresh. SessionStorage would lose data on tab close. |
| AD-7 | Overlay dismissal uses swipe-right (not swipe-down). | Swipe-down conflicts with scrolling the result list. Swipe-right is an established mobile pattern for "go back" (iOS edge-swipe, Android back gesture). The `drag="x"` constraint with velocity threshold matches the mental model of dismissing a stacked panel. |
| AD-8 | Category filter chips use single-select (not multi-select). | The `useIntelSearch` hook accepts a single `category?: string` param. Multi-select would require API changes (accepting a comma-separated list or array). Single-select is sufficient for search refinement and simpler to implement. Multi-select can be added when the API supports it. |
| AD-9 | `THREAT_LEVEL_COLORS` added to `src/lib/interfaces/coverage.ts` alongside existing `SEVERITY_COLORS`. | Threat levels and severity levels are distinct concepts (threat is a geographic assessment, severity is a per-alert classification). They need separate color palettes. Placing both in the same file maintains the single-file convention for coverage-related constants. |

---

## 7. Open Questions

| ID | Question | Owner | Deadline | Resolution |
|----|----------|-------|----------|------------|
| OQ-1 | Should the TarvaRI API add a `region` parameter to `/console/intel` for filtering intel by geographic region? This would enable a richer "recent alerts" section in `MobileRegionDetail` beyond the curated `keyEvents`. | TarvaRI backend team | Before Phase F | -- |
| OQ-2 | Should search result cards show the relevance `score` value (0.0-1.0) or the `snippet` with highlighted terms? The adapter currently uses `shortSummary` for the stripped snippet but `MobileAlertCard` does not render `shortSummary` in its compact layout. | UX Designer + IA | Before E.2 implementation | -- |
| OQ-3 | Should the "Show on Map" action in region detail fly to a predefined region centroid (hardcoded lat/lng per region) or use the bounding box of the region? Centroid is simpler; bbox provides better framing. | IA + Frontend Lead | Before E.3 implementation | -- |
| OQ-4 | Should `MobileSearchOverlay` support voice input on devices where the Web Speech API is available? This would improve accessibility but adds significant complexity. | UX Designer + Accessibility Lead | Phase F planning | -- |
| OQ-5 | Should tapping a `KeyEvent` in region detail open the alert detail bottom sheet (which requires matching the event to an actual intel item by title search) or navigate to the category district view? Current `onEventTap` passes basic event data but not an alert ID. | IA | Before E.2 implementation | -- |

---

## 8. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-1 | `keyEvents` array in geo summaries may be empty for regions with low intel volume, leaving the "Notable Events" section blank. | Medium | Low | Hide the section header when `keyEvents.length === 0`. Show only the per-category breakdown and recommendations. Document this as expected behavior. |
| R-2 | `SearchResult` type lacks `ingestedAt`, causing `MobileAlertCard` to display "NOW" for all search results via `relativeTimeAgo('')`. This may confuse analysts who expect temporal context. | Medium | Medium | Document this as a known limitation in the adapter. Consider enhancing the search API to return `ingested_at` in the response. If the API is updated before implementation, update the adapter to use the real timestamp. |
| R-3 | Swipe-right-to-dismiss on the search overlay may conflict with text selection in the search input on some browsers. | Low | Medium | Constrain the `drag="x"` handler to fire only when the drag starts outside the input element. Use `dragListener={false}` on the input row and apply drag only to the result list container. |
| R-4 | `localStorage` may be unavailable (private browsing, storage full, disabled). Recent searches would not persist. | Low | Low | `useRecentSearches` hook handles `localStorage` errors with try/catch. Returns empty array gracefully. Recent searches are a convenience feature, not critical functionality. |
| R-5 | The `structuredBreakdown` field may arrive as a JSON string instead of a parsed object (observed in `use-geo-summaries.ts` line 182-188). The normalizer in `useLatestGeoSummary` handles this, but downstream consumers should not assume the breakdown is always present. | Low | Medium | Defensive null checks on `summary?.structuredBreakdown?.threatsByCategory` etc. The normalizer provides safe defaults (`{}`, `[]`, `'stable'`). |
| R-6 | Overlay z-index (50) may conflict with other fixed UI elements (NavigationHUD at z-40, TriageRationalePanel at z-45). | Low | Low | z-50 is above all current fixed elements. If conflicts arise, coordinate with the `MobileShell` z-index stack. |
| R-7 | Search debounce (300ms) combined with TanStack Query network time may create a perceptible delay before results appear. On slow connections, users may type ahead of results significantly. | Medium | Low | Show a loading spinner immediately when `queryResult.isFetching` is true. The debounce prevents excessive requests. Consider adding a "Searching..." text indicator below the input. |

---

## Appendix A: File Manifest

| File | Action | Description |
|------|--------|-------------|
| `src/lib/interfaces/mobile.ts` | Modify | Append `SHEET_CONFIGS.regionDetail` entry |
| `src/lib/interfaces/coverage.ts` | Modify | Append `THREAT_LEVEL_COLORS` constant and `getThreatLevelColor()` function |
| `src/lib/search-adapters.ts` | Create | `searchResultToAlertCardItem()` and `keyEventToAlertCardItem()` adapter functions |
| `src/hooks/use-recent-searches.ts` | Create | `useRecentSearches()` hook for localStorage-persisted recent searches |
| `src/components/mobile/MobileRegionDetail.tsx` | Create | Region detail bottom sheet content component |
| `src/components/mobile/MobileSearchOverlay.tsx` | Create | Full-screen search overlay component |
| `src/styles/mobile-region-search.css` | Create | Shared CSS for region detail and search overlay |
| `src/components/mobile/__tests__/MobileRegionDetail.test.tsx` | Create | Component tests for MobileRegionDetail |
| `src/components/mobile/__tests__/MobileSearchOverlay.test.tsx` | Create | Component tests for MobileSearchOverlay |
| `src/hooks/__tests__/use-recent-searches.test.ts` | Create | Hook tests for useRecentSearches |
| `src/lib/__tests__/search-adapters.test.ts` | Create | Unit tests for adapter functions |

---

## Appendix B: Existing Hook Quick Reference

| Hook | File | Endpoint | Key Fields Used by This WS |
|------|------|----------|---------------------------|
| `useLatestGeoSummary(level, key)` | `src/hooks/use-geo-summaries.ts:268` | `/console/summaries/latest` | `threatLevel`, `structuredBreakdown.threatsByCategory`, `structuredBreakdown.severityDistribution`, `structuredBreakdown.keyEvents`, `structuredBreakdown.riskTrend`, `structuredBreakdown.recommendations`, `generatedAt` |
| `useAllGeoSummaries(enabled)` | `src/hooks/use-geo-summaries.ts:328` | `/console/summaries` | Used by WS-E.1 for the region card grid. This WS consumes the selected region key, not this hook directly. |
| `useIntelSearch(params)` | `src/hooks/use-intel-search.ts:176` | `/console/search/intel` | `queryResult.data: SearchResult[]` (id, title, snippet, severity, category, operationalPriority, score), `debouncedQuery` |

---

## Appendix C: Type Compatibility Matrix

| Source Type | Target Type | Adapter | Missing Fields (set to default) |
|-------------|-------------|---------|--------------------------------|
| `SearchResult` | `CategoryIntelItem` | `searchResultToAlertCardItem()` | `eventType` (null), `sourceKey` (null), `confidence` (null), `geoScope` (null), `ingestedAt` (''), `sentAt` (null) |
| `KeyEvent` | `CategoryIntelItem` | `keyEventToAlertCardItem()` | `id` (synthetic), `eventType` (null), `sourceKey` (null), `confidence` (null), `geoScope` (null), `shortSummary` (null), `sentAt` (null), `operationalPriority` (null) |
