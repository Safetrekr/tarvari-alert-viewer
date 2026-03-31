# WS-E.1: Intel Tab

> **Workstream ID:** WS-E.1
> **Phase:** E -- Intel Tab + Search
> **Assigned Agent:** `information-architect`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-D.2 (`MobileAlertCard` component with props `{ item: CategoryIntelItem, onTap: (item: CategoryIntelItem) => void, isSelected?: boolean }`), WS-A.2 (MobileShell `intelContent` slot, `MobileTab` type from `src/lib/interfaces/mobile.ts`, `MobileStateView` shared loading/error/empty state component), WS-A.3 (glass tokens `--glass-card-bg`, `--glass-card-blur`, `--glass-card-border`; spacing tokens `--space-card-padding` (14px), `--space-content-padding` (12px), `--space-section-gap` (16px), `--space-inline-gap` (8px); typography tokens `--text-body` (13px), `--text-label` (11px), `--text-caption` (10px), `--text-ghost` (10px), `--font-mono`, `--line-height-label` (1.3), `--tracking-label-mobile` (0.14em); touch target tokens `--touch-target-min` (44px), `--touch-target-comfortable` (48px); posture tokens `--posture-low-color` through `--posture-critical-color`; animation timing `--duration-fast`, `--duration-hover`), WS-B.1 (`derivePosture` from `src/lib/threat-utils.ts`, `PostureConfig` type, `ThreatLevel` from `src/lib/interfaces/coverage.ts`)
> **Blocks:** WS-E.2 (region card tap trigger, search bar entry point), WS-E.3 (cross-tab links from Intel tab items to Map tab fly-to and Situation tab category detail; reuses `onShowOnMap` and `onViewCategory` callback signatures from WS-D.2 via `MobileAlertCard` `onTap` flow)
> **Resolves:** OVERVIEW Section 4.3 (Intel tab layout), `information-architecture.md` Section 5.1 Navigation Tree -- Intel (Tab 3) node, `information-architecture.md` Section 8.3 (Intel tab wireframe)

---

> **Review Fixes Applied (Phase E Review):**
>
> - **H-1 (THREAT_LEVEL_COLORS):** `THREAT_LEVEL_COLORS`, `THREAT_LEVEL_BG`, and `THREAT_LEVEL_LABELS` consolidated into `src/lib/interfaces/coverage.ts` (not separate `threat-level-colors.ts`). Uses `--posture-*` token names. Delete planned `src/lib/threat-level-colors.ts` deliverable.
> - **M-3 (prop interface gap):** Added optional cross-tab handler props to `MobileIntelTabProps`: `onViewCategory?`, `onShowOnMap?`, `onShareAlert?`, `onViewRegionOnMap?`, `shareConfirmId?`. E.3 threads these from `MobileView`.
> - **M-5 (MobileStateView):** Confirmed dependency on WS-A.2 D-8. If not delivered, implement minimal version as E.1 prerequisite.
> - **M-6 (Blocks header):** Added WS-E.2 to Blocks field.

---

## 1. Objective

Build `MobileIntelTab`, the root content component for the Intel tab in the mobile three-tab layout. The Intel tab serves an analyst's "read and understand" intent -- chronological intelligence feed, geographic threat summaries, and a search entry point -- in contrast to the Situation tab's "glance" intent and the Map tab's "spatial" intent.

The component orchestrates three content sections: a search entry point and view-mode-aware intel feed (raw items via `useIntelFeed` or bundles via `useIntelBundles`), a geographic intelligence section showing the 11 travel-security regions with AI-generated threat summaries from `useAllGeoSummaries`, and integration points for pull-to-refresh (WS-F.5) and cross-tab navigation (WS-E.3).

All data hooks exist. No new API endpoints or Zustand store fields are introduced. `MobileAlertCard` from WS-D.2 is reused for feed items. A new `MobileRegionCard` sub-component is introduced for geographic summary rendering (exported for reuse by WS-E.2). A new `intelFeedItemToCardItem` adapter function bridges the `IntelFeedItem` shape to the `CategoryIntelItem` shape required by `MobileAlertCard`.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **`MobileIntelTab` component** | Root container rendering inside MobileShell's `intelContent` slot. Vertically scrollable with two distinct sections: intel feed and geographic intelligence. Provides a `ref` on the scroll container for WS-F.5 pull-to-refresh integration. |
| **Search entry point** | Sticky 48px search bar at the top of the tab content. Styled as a glass pill with Lucide `Search` icon and "Search intel..." placeholder text. Tapping opens `MobileSearchOverlay` (WS-E.2) via a callback prop. Not a functional search input -- purely an entry point. |
| **View mode integration** | Reads `viewMode` from `coverage.store`. When `'raw'` or `'triaged'`, displays chronological intel feed items. When `'all-bundles'`, displays bundle cards. A compact `ViewModeToggle` (reused from desktop, already touch-ready) is rendered below the search bar. |
| **Intel feed section** | When viewMode is `'raw'` or `'triaged'`: renders the 50 most recent intel items from `useIntelFeed()` as `MobileAlertCard` instances sorted by `ingestedAt` descending. Each card tap fires `onAlertTap` which opens the alert detail bottom sheet (via the same store write pattern as WS-C.4). Section header: "RECENT INTEL". |
| **Bundle feed section** | When viewMode is `'all-bundles'`: renders bundles from `useIntelBundles('all-bundles')` as `MobileBundleCard` sub-components. Each card shows bundle title, final severity dot, intel count, source count, priority badge, and relative timestamp. Tap opens triage rationale bottom sheet (via `setSelectedBundleId`). Section header: "INTEL BUNDLES". |
| **`intelFeedItemToCardItem` adapter** | Pure function mapping `IntelFeedItem` to `CategoryIntelItem` (null-fills missing fields: `eventType`, `confidence`, `geoScope`, `shortSummary`, `sentAt`). Exported from `src/lib/adapters/intel-adapters.ts` for reuse by WS-E.2. |
| **`priorityFeedItemToCardItem` adapter** | Pure function mapping `PriorityFeedItem` to `CategoryIntelItem`. Exported from the same adapter file. |
| **Geographic intelligence section** | Renders the 11 travel-security region cards plus a global summary card at the top. Data from `useAllGeoSummaries(true)`. Each card shows: region name, threat level badge (color-coded), risk trend indicator, summary text (2-line clamp), and `generatedAt` as relative timestamp. Section header: "GEOGRAPHIC INTELLIGENCE". |
| **`MobileRegionCard` sub-component** | Touch-optimized card for a single geographic summary. 80px minimum height. Glass background. Threat level badge uses color coding from `THREAT_LEVEL_COLORS` map. Exported for reuse by WS-E.2 (search results may include region matches). Tap fires `onTap(geoSummary)` callback. |
| **`THREAT_LEVEL_COLORS` map** | Static map from `ThreatLevel` to CSS color values: `LOW` = `var(--posture-low-color, #22c55e)`, `MODERATE` = `var(--posture-moderate-color, #eab308)`, `ELEVATED` = `var(--posture-elevated-color, #f97316)`, `HIGH` = `var(--posture-high-color, #ef4444)`, `CRITICAL` = `var(--posture-critical-color, #dc2626)`. Exported from the component file for reuse. |
| **Pull-to-refresh wrapper** | The scroll container exposes a `ref` via `React.forwardRef` or a `scrollRef` prop. WS-F.5 will attach a pull-to-refresh gesture handler to this ref. For now, the ref is passed through but not consumed. `overscroll-behavior-y: contain` is set on the scroll container to prevent browser pull-to-refresh interference. |
| **Loading/error/empty states** | Uses `MobileStateView` from WS-A.2 for each data section. Feed section shows a skeleton of 5 shimmer rows during load. Geo section shows 3 shimmer cards during load. Empty states show contextual messages ("No intel items in the current time range" / "No geographic summaries available"). |
| **CSS file** | `src/styles/mobile-intel-tab.css` with section headers, region card styles, search bar styles, bundle card styles, and reduced motion overrides. |
| **Unit tests** | Vitest tests for `intelFeedItemToCardItem`, `priorityFeedItemToCardItem`, `MobileRegionCard` rendering, `MobileIntelTab` section rendering in both view modes. |
| **Touch target compliance** | All interactive elements meet `var(--touch-target-min)` (44px minimum). |
| **Reduced motion support** | Any card press or trend indicator animations respect `prefers-reduced-motion: reduce`. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileSearchOverlay` (functional search) | WS-E.2 scope. This WS renders only the search entry point (tap target that calls `onSearchPress`). |
| `MobileRegionDetail` (full region drill-down) | WS-E.2 scope. This WS renders region cards; tapping one passes data to WS-E.2's detail view via callback. |
| Cross-tab navigation (Show on Map, View Category) | WS-E.3 scope. This WS fires `onAlertTap` callbacks; E.3 wires them to tab switching and map fly-to. |
| Pull-to-refresh gesture handling | WS-F.5 scope. This WS provides the scroll container ref. |
| Landscape layout variant | WS-F.1 scope. This WS delivers portrait-first layout. |
| Desktop rendering changes | All new components are mobile-only under `src/components/mobile/`. |
| Triage rationale bottom sheet content | WS-C.2 scope. Bundle card tap writes `selectedBundleId` to store; the sheet opens via existing bottom sheet infrastructure. |
| Priority feed section (P1/P2 strip) | WS-B.1 scope. The Situation tab owns the persistent P1 banner and priority strip. The Intel tab uses the full `useIntelFeed` (all priorities, all categories) rather than the P1/P2-filtered `usePriorityFeed`. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/hooks/use-intel-feed.ts` (lines 23-31) | `IntelFeedItem` interface: `id`, `title`, `severity`, `category`, `sourceId`, `ingestedAt`, `operationalPriority`. Hook: `useIntelFeed()` returning `UseQueryResult<IntelFeedItem[]>`, 30s refetch. | Exists |
| `src/hooks/use-intel-bundles.ts` (lines 19, 124-139) | `BundleWithDecision` interface (from `src/lib/interfaces/intel-bundles.ts`). Hook: `useIntelBundles(viewMode: ViewMode)` returning `UseQueryResult<BundleWithDecision[]>`, 45s refetch, disabled for `'raw'` mode. | Exists |
| `src/hooks/use-geo-summaries.ts` (lines 111-130, 328-344) | `GeoSummary` interface: `id`, `geoLevel`, `geoKey`, `summaryType`, `threatLevel`, `summaryText`, `structuredBreakdown`, `generatedAt`, `validatedAt`. Hook: `useAllGeoSummaries(enabled: boolean)` returning `UseQueryResult<GeoSummary[]>`, 120s refetch. | Exists |
| `src/hooks/use-geo-summaries.ts` (lines 268-288) | `useLatestGeoSummary(geoLevel, geoKey)` for on-demand summary fetch. | Exists |
| `src/hooks/use-category-intel.ts` (lines 24-37) | `CategoryIntelItem` interface: `id`, `title`, `severity`, `category`, `eventType`, `sourceKey`, `confidence`, `geoScope`, `shortSummary`, `ingestedAt`, `sentAt`, `operationalPriority`. | Exists |
| `src/hooks/use-priority-feed.ts` (lines 59-72) | `PriorityFeedItem` interface: `id`, `title`, `severity`, `category`, `operationalPriority`, `shortSummary`, `eventType`, `geoScope`, `sourceKey`, `ingestedAt`, `sentAt`. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 270-333) | `ThreatLevel`, `THREAT_LEVELS`, `GeoLevel`, `GeoRegionKey`, `GEO_REGION_KEYS`, `GEO_REGION_META`, `TrendDirection`, `getGeoDisplayName()`, `isValidGeoRegionKey()`. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 113-125) | `SeverityLevel`, `SEVERITY_COLORS` for severity dot rendering in bundle cards. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 137-241) | `OperationalPriority`, `PRIORITY_META`, `PriorityMeta`, `getPriorityMeta()`, `isPriorityVisible()`. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 87-106) | `getCategoryMeta()`, `getCategoryColor()`, `getCategoryIcon()`, `CategoryMeta`. | Exists |
| `src/lib/interfaces/intel-bundles.ts` (lines 24-51, 70-117) | `ViewMode`, `VIEW_MODE_LABELS`, `BundleWithDecision`, `getBundleDisplayTitle()`, `getBundleDisplaySeverity()`, `getBundleDisplaySummary()`. | Exists |
| `src/stores/coverage.store.ts` (lines 74, 199-204, 206-208) | `viewMode` state, `setViewMode()` action, `setSelectedBundleId()` action. | Exists |
| `src/stores/coverage.store.ts` (lines 84-88, 225-240) | `selectedMapAlertId`, `selectedMapAlertCategory`, `selectedMapAlertBasic`, `selectMapAlert()`, `clearMapAlert()`. Used by `onAlertTap` flow to open alert detail sheet. | Exists |
| `src/lib/time-utils.ts` (lines 21-42, 50-57) | `relativeTimeAgo(isoString)` for card timestamps, `useRelativeTimeTick(intervalMs)` for periodic re-render. | Exists |
| `src/components/mobile/MobileAlertCard.tsx` | `MobileAlertCard` component. Props: `{ item: CategoryIntelItem, onTap: (item: CategoryIntelItem) => void, isSelected?: boolean }`. | Pending (WS-D.2) |
| `src/components/mobile/MobileStateView.tsx` | Shared loading/error/empty state component. Props: `{ query: UseQueryResult, skeletonComponent?, emptyTitle?, emptyMessage?, retryLabel? }`. | Pending (WS-A.2) |
| `src/components/coverage/ViewModeToggle.tsx` | Shared view mode toggle component. Reads/writes `viewMode` from `coverage.store`. | Exists |
| `src/components/coverage/PriorityBadge.tsx` | Shared achromatic priority indicator. Props: `{ priority: OperationalPriority, size: 'sm' \| 'md' \| 'lg', showLabel?: boolean }`. | Exists |
| `src/lib/threat-utils.ts` | `PostureConfig` type with `color`, `bg`, `border`, `label` fields. `POSTURE_CONFIGS` record mapping `ThreatLevel` to `PostureConfig`. | Pending (WS-B.1) |
| WS-A.3 design tokens | All mobile tokens referenced in the Depends On header. | Pending (Phase A) |
| WS-A.2 | MobileShell `intelContent` slot, `MobileTab` type. | Pending (Phase A) |
| `lucide-react` | `Search`, `Globe`, `TrendingUp`, `TrendingDown`, `Minus`, `ChevronRight`, `Layers`, `Radio`. | Available (existing dependency) |
| `motion/react` | `motion.button` for card press feedback, `AnimatePresence` for section transitions. | Available (existing dependency) |

---

## 4. Deliverables

### D-1: `intelFeedItemToCardItem` and `priorityFeedItemToCardItem` adapters (`src/lib/adapters/intel-adapters.ts`)

New file providing pure functions that map between feed item shapes and the `CategoryIntelItem` shape consumed by `MobileAlertCard`. This file is the single location for all intel-to-card-item conversions, preventing adapter duplication across WS-E.1 and WS-E.2.

```typescript
/**
 * Adapter functions for converting between intel data shapes
 * and the CategoryIntelItem shape consumed by MobileAlertCard.
 *
 * @module intel-adapters
 * @see WS-E.1
 */

import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import type { IntelFeedItem } from '@/hooks/use-intel-feed'
import type { PriorityFeedItem } from '@/hooks/use-priority-feed'

/**
 * Convert an IntelFeedItem (from useIntelFeed) to CategoryIntelItem.
 *
 * IntelFeedItem is a lightweight shape (7 fields) returned by the
 * `/console/intel` endpoint. Missing fields are null-filled.
 */
export function intelFeedItemToCardItem(item: IntelFeedItem): CategoryIntelItem {
  return {
    id: item.id,
    title: item.title,
    severity: item.severity,
    category: item.category,
    eventType: null,
    sourceKey: item.sourceId || null,
    confidence: null,
    geoScope: null,
    shortSummary: null,
    ingestedAt: item.ingestedAt,
    sentAt: null,
    operationalPriority: item.operationalPriority,
  }
}

/**
 * Convert a PriorityFeedItem (from usePriorityFeed) to CategoryIntelItem.
 *
 * PriorityFeedItem has most CategoryIntelItem fields already.
 * Only `confidence` is missing.
 */
export function priorityFeedItemToCardItem(item: PriorityFeedItem): CategoryIntelItem {
  return {
    id: item.id,
    title: item.title,
    severity: item.severity,
    category: item.category,
    eventType: item.eventType,
    sourceKey: item.sourceKey,
    confidence: null,
    geoScope: item.geoScope,
    shortSummary: item.shortSummary,
    ingestedAt: item.ingestedAt,
    sentAt: item.sentAt,
    operationalPriority: item.operationalPriority,
  }
}
```

~45 lines. Zero runtime dependencies beyond TypeScript types.

### D-2: `THREAT_LEVEL_COLORS` map (`src/lib/threat-level-colors.ts`)

Small utility file mapping `ThreatLevel` values to CSS color strings using WS-A.3 posture tokens with hex fallbacks.

```typescript
/**
 * Threat level to CSS color mapping for geographic summary UI.
 *
 * Uses posture tokens from WS-A.3 with hardcoded fallbacks.
 * Same values as POSTURE_CONFIGS in threat-utils.ts but
 * isolated for lightweight import by region card components.
 *
 * @module threat-level-colors
 * @see WS-E.1
 */

import type { ThreatLevel } from '@/lib/interfaces/coverage'

/** Maps ThreatLevel to its primary display color (CSS var with fallback). */
export const THREAT_LEVEL_COLORS: Record<ThreatLevel, string> = {
  LOW:      'var(--posture-low-color, #22c55e)',
  MODERATE: 'var(--posture-moderate-color, #eab308)',
  ELEVATED: 'var(--posture-elevated-color, #f97316)',
  HIGH:     'var(--posture-high-color, #ef4444)',
  CRITICAL: 'var(--posture-critical-color, #dc2626)',
}

/** Maps ThreatLevel to a tinted background color at low alpha for card fill. */
export const THREAT_LEVEL_BG: Record<ThreatLevel, string> = {
  LOW:      'rgba(34, 197, 94, 0.08)',
  MODERATE: 'rgba(234, 179, 8, 0.08)',
  ELEVATED: 'rgba(249, 115, 22, 0.08)',
  HIGH:     'rgba(239, 68, 68, 0.10)',
  CRITICAL: 'rgba(220, 38, 38, 0.12)',
}

/** Human-readable labels for each threat level. */
export const THREAT_LEVEL_LABELS: Record<ThreatLevel, string> = {
  LOW:      'Low',
  MODERATE: 'Moderate',
  ELEVATED: 'Elevated',
  HIGH:     'High',
  CRITICAL: 'Critical',
}
```

~35 lines.

### D-3: `MobileRegionCard` component (`src/components/mobile/MobileRegionCard.tsx`)

Touch-optimized card for rendering a single geographic region summary. Used in the Intel tab's "GEOGRAPHIC INTELLIGENCE" section and exported for potential reuse by WS-E.2.

**Props interface:**

```typescript
import type { GeoSummary } from '@/hooks/use-geo-summaries'

export interface MobileRegionCardProps {
  /** The geographic summary to display. */
  readonly summary: GeoSummary
  /** Called when the card is tapped. Receives the full summary for drill-down. */
  readonly onTap: (summary: GeoSummary) => void
  /** Whether this is the global (world-level) summary. Renders with distinct styling. */
  readonly isGlobal?: boolean
}
```

**Visual layout (80px minimum height):**

```
+---------------------------------------------------------------+
| [globe]  Middle East                  ELEVATED  [trending-up]  |
|          Escalating conflict across northern...                |
|          hourly: 23m ago                                  [>]  |
+---------------------------------------------------------------+
  ^         ^                             ^           ^       ^
  |         |                             |           |       +-- Chevron
  |         |                             |           +-- Trend icon
  |         +-- Region display name       +-- Threat level badge
  +-- Globe or region icon
```

**Visual specification:**

| Element | Property | Value | Token |
|---------|----------|-------|-------|
| **Card** | Min-height | 80px | -- |
| | Padding | `var(--space-card-padding, 14px)` | `--space-card-padding` |
| | Background | `var(--glass-card-bg)` | `--glass-card-bg` |
| | Backdrop-filter | `var(--glass-card-blur)` | `--glass-card-blur` |
| | Border | `1px solid var(--glass-card-border)` | `--glass-card-border` |
| | Border-radius | 10px | -- |
| | Font-family | `var(--font-mono, monospace)` | `--font-mono` |
| | Touch feedback | `transform: scale(0.98)` for 100ms via `motion.button whileTap` | `--duration-card-press` |
| **Region icon** | Icon | `Globe` (Lucide) for global; none for regions | -- |
| | Size | 16px | -- |
| | Color | `THREAT_LEVEL_COLORS[threatLevel]` at 60% opacity | -- |
| | Flex-shrink | 0 | -- |
| **Region name** | Font-size | `var(--text-body, 13px)` | `--text-body` |
| | Font-weight | 500 | -- |
| | Color | `rgba(255, 255, 255, 0.60)` | -- |
| **Threat level badge** | Font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Font-weight | 600 | -- |
| | Letter-spacing | `0.08em` | -- |
| | Text-transform | `uppercase` | -- |
| | Color | `THREAT_LEVEL_COLORS[threatLevel]` | -- |
| | Padding | `2px 6px` | -- |
| | Background | `THREAT_LEVEL_BG[threatLevel]` | -- |
| | Border-radius | 4px | -- |
| **Summary text** | Font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Color | `rgba(255, 255, 255, 0.35)` | -- |
| | Line-clamp | 2 | -- |
| | Line-height | 1.4 | -- |
| **Trend indicator** | Icon | `TrendingUp` / `TrendingDown` / `Minus` (Lucide) | -- |
| | Size | 12px | -- |
| | Color | up = `#22c55e`, down = `#ef4444`, stable = `rgba(255,255,255,0.25)` | -- |
| **Generated timestamp** | Font-size | `var(--text-ghost, 10px)` | `--text-ghost` |
| | Color | `rgba(255, 255, 255, 0.20)` | -- |
| | Format | `relativeTimeAgo(summary.generatedAt)` with label "hourly:" or "daily:" prefix | -- |
| **Chevron** | Icon | `ChevronRight` (Lucide) | -- |
| | Size | 14px | -- |
| | Color | `rgba(255, 255, 255, 0.15)` | -- |

**Global card variant (`isGlobal === true`):**
- Left border: `3px solid THREAT_LEVEL_COLORS[threatLevel]` at 40% opacity
- Background: `THREAT_LEVEL_BG[threatLevel]` (slightly tinted compared to standard glass)
- Region icon: `Globe` at 16px rendered
- Region name: "Global Threat Assessment" (overrides `getGeoDisplayName`)

**Trend derivation:** The risk trend is taken from `summary.structuredBreakdown.riskTrend` (`TrendDirection` = `'up' | 'down' | 'stable'`).

**Implementation:** ~120 lines. Uses `motion.button` from `motion/react` for press feedback. `memo`-wrapped. Accessibility: `role="button"`, `aria-label` includes region name and threat level.

### D-4: `MobileBundleCard` sub-component (inline in `MobileIntelTab.tsx`)

Compact card for rendering a single intel bundle when `viewMode === 'all-bundles'`. Not exported -- used only within `MobileIntelTab`. If reuse is needed later, it can be extracted.

**Visual layout (64px minimum height):**

```
+---------------------------------------------------------------+
| [*]  Armed conflict cluster in...           [P2]      12m     |
|      3 intel  |  2 sources                               [>]  |
+---------------------------------------------------------------+
  ^    ^                                       ^          ^   ^
  |    |                                       |          |   +-- Chevron
  |    +-- Bundle title (from getBundleDisplayTitle)      |
  |                                            +-- Priority badge
  +-- Severity dot (from getBundleDisplaySeverity)
```

**Data mapping:**

| Field | Source |
|-------|--------|
| Title | `getBundleDisplayTitle(b.bundle, b.decision)` |
| Severity | `getBundleDisplaySeverity(b.bundle, b.decision)` |
| Priority | `b.operationalPriority` (via `PriorityBadge size="sm"`, P1/P2 only) |
| Intel count | `b.bundle.intel_count` |
| Source count | `b.bundle.source_count` |
| Timestamp | `relativeTimeAgo(b.bundle.created_at)` |

**Tap action:** Calls `setSelectedBundleId(b.bundle.id)` on the `coverage.store`. The triage rationale bottom sheet (WS-C.2) reads `selectedBundleId` and opens.

~80 lines. Same visual tokens as `MobileAlertCard` (64px height, glass background, severity dot, truncated title, chevron affordance).

### D-5: `MobileIntelTab` component (`src/components/mobile/MobileIntelTab.tsx`)

Root container for the Intel tab. Rendered inside MobileShell's `intelContent` slot.

**Props interface:**

```typescript
import type { CategoryIntelItem } from '@/hooks/use-category-intel'
import type { GeoSummary } from '@/hooks/use-geo-summaries'

export interface MobileIntelTabProps {
  /** Called when the search entry point is tapped. Opens MobileSearchOverlay (WS-E.2). */
  readonly onSearchPress: () => void
  /** Called when an alert card is tapped. Opens alert detail bottom sheet. */
  readonly onAlertTap: (item: CategoryIntelItem) => void
  /** Called when a region card is tapped. Opens region detail (WS-E.2). */
  readonly onRegionTap: (summary: GeoSummary) => void
  /** Ref forwarded to the scroll container for WS-F.5 pull-to-refresh. */
  readonly scrollRef?: React.RefObject<HTMLDivElement | null>
}
```

**Structure:**

```
<div class="mobile-intel-tab" ref={scrollRef}>

  <!-- Search entry point (sticky) -->
  <button class="mobile-intel-search-bar" onClick={onSearchPress}>
    <Search size={16} />
    <span>Search intel...</span>
  </button>

  <!-- View mode toggle -->
  <div class="mobile-intel-controls">
    <ViewModeToggle />
  </div>

  <!-- Feed section (conditional on viewMode) -->
  <section aria-label="Intel feed">
    <h2 class="mobile-section-header">
      {viewMode === 'all-bundles' ? 'INTEL BUNDLES' : 'RECENT INTEL'}
    </h2>

    <!-- viewMode = 'raw' or 'triaged' -->
    {feedMode && (
      <MobileStateView query={intelFeedQuery} ...>
        {intelFeedQuery.data.map(item => (
          <MobileAlertCard
            item={intelFeedItemToCardItem(item)}
            onTap={onAlertTap}
          />
        ))}
      </MobileStateView>
    )}

    <!-- viewMode = 'all-bundles' -->
    {bundleMode && (
      <MobileStateView query={bundlesQuery} ...>
        {bundlesQuery.data.map(bundle => (
          <MobileBundleCard bundle={bundle} />
        ))}
      </MobileStateView>
    )}
  </section>

  <!-- Geographic intelligence section -->
  <section aria-label="Geographic intelligence">
    <h2 class="mobile-section-header">GEOGRAPHIC INTELLIGENCE</h2>
    <MobileStateView query={geoQuery} ...>
      {/* Global summary first, then 11 regions */}
      {globalSummary && (
        <MobileRegionCard summary={globalSummary} onTap={onRegionTap} isGlobal />
      )}
      {regionSummaries.map(summary => (
        <MobileRegionCard
          key={summary.id}
          summary={summary}
          onTap={onRegionTap}
        />
      ))}
    </MobileStateView>
  </section>

</div>
```

**Key behaviors:**

1. **View mode awareness:** Reads `viewMode` from `useCoverageStore(s => s.viewMode)`. When `'raw'` or `'triaged'`, renders `useIntelFeed()` results as `MobileAlertCard` instances using `intelFeedItemToCardItem`. When `'all-bundles'`, renders `useIntelBundles('all-bundles')` results as `MobileBundleCard` instances. The `ViewModeToggle` component handles mode switching.

2. **Geographic summary ordering:** `useAllGeoSummaries(true)` returns all summaries. The component partitions them:
   - **Global summary:** filter for `summary.geoLevel === 'world'`, take the most recent by `generatedAt`. Rendered first with `isGlobal` styling.
   - **Region summaries:** filter for `summary.geoLevel === 'region'`, deduplicate by `geoKey` (most recent per region), sort by threat level severity descending (CRITICAL first), then alphabetically by display name for ties. Rendered as a vertical list of `MobileRegionCard` instances.

3. **Alert tap flow:** When `onAlertTap` fires, the parent (`MobileView.tsx` or an intermediate orchestrator) calls `selectMapAlert(id, category, basic)` on `coverage.store`, which triggers the alert detail bottom sheet to open (same pattern as WS-C.4 map marker tap).

4. **Search entry point:** The search bar is not a functional `<input>`. It is a `<button>` styled to look like a search field. Tapping it calls `onSearchPress`, which the parent wires to open `MobileSearchOverlay` (WS-E.2). The bar is sticky at the top of the scroll container (`position: sticky; top: 0; z-index: 5`).

5. **Scroll container ref:** The root `<div>` accepts `scrollRef` as a forwarded ref. This ref targets the scrollable container itself (which has `overflow-y: auto`). WS-F.5 will use this ref to attach pull-to-refresh touch event listeners. Until WS-F.5, the ref is passed through but unconsumed.

6. **Empty feed handling:** When `useIntelFeed()` returns an empty array, display `MobileStateView` empty state with `emptyTitle="No recent intel"` and `emptyMessage="No intelligence items have been ingested in the current time window."`. When `useAllGeoSummaries()` returns empty, display `emptyTitle="No geographic summaries"` and `emptyMessage="AI-generated geographic summaries are not yet available."`.

7. **Relative time refresh:** Uses `useRelativeTimeTick(30_000)` from `src/lib/time-utils.ts` to force periodic re-renders of relative timestamps without waiting for data refetch.

**Implementation:** ~250 lines including the inline `MobileBundleCard`.

### D-6: CSS file (`src/styles/mobile-intel-tab.css`)

Dedicated CSS file for Intel tab components. Imported by `MobileIntelTab.tsx`.

```css
/* Mobile Intel Tab -- layout and section styles */

.mobile-intel-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap, 16px);
  padding: var(--space-content-padding, 12px);
  padding-bottom: calc(var(--space-section-gap, 16px) + env(safe-area-inset-bottom, 0px));
  min-height: 100%;
}

/* Sticky search entry point */
.mobile-intel-search-bar {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: var(--space-inline-gap, 8px);
  height: 48px;
  min-height: var(--touch-target-comfortable, 48px);
  padding: 0 var(--space-card-padding, 14px);
  background: var(--glass-card-bg);
  backdrop-filter: var(--glass-card-blur);
  -webkit-backdrop-filter: var(--glass-card-blur);
  border: 1px solid var(--glass-card-border);
  border-radius: 24px;
  color: rgba(255, 255, 255, 0.30);
  font-family: var(--font-mono, monospace);
  font-size: var(--text-body, 13px);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--duration-fast) var(--ease-default, ease);
}

.mobile-intel-search-bar:active {
  background: rgba(255, 255, 255, 0.06);
}

/* View mode controls row */
.mobile-intel-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-content-padding, 12px);
}

/* Section headers */
.mobile-section-header {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-label, 11px);
  font-weight: 500;
  letter-spacing: var(--tracking-label-mobile, 0.14em);
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  line-height: var(--line-height-label, 1.3);
  margin: 0 0 var(--space-inline-gap, 8px) 0;
  padding: 0;
}

/* Feed list layout */
.mobile-intel-feed-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Region card list layout */
.mobile-region-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-inline-gap, 8px);
}

/* Region card base */
.mobile-region-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 80px;
  padding: var(--space-card-padding, 14px);
  background: var(--glass-card-bg);
  backdrop-filter: var(--glass-card-blur);
  -webkit-backdrop-filter: var(--glass-card-blur);
  border: 1px solid var(--glass-card-border);
  border-radius: 10px;
  font-family: var(--font-mono, monospace);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  /* touch feedback applied via motion.button */
}

/* Global region card variant */
.mobile-region-card[data-global='true'] {
  border-left-width: 3px;
}

/* Region card top row */
.mobile-region-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-inline-gap, 8px);
  min-height: var(--touch-target-min, 44px);
}

/* Region card summary text (2-line clamp) */
.mobile-region-card-summary {
  font-size: var(--text-caption, 10px);
  color: rgba(255, 255, 255, 0.35);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Region card footer (timestamp + chevron) */
.mobile-region-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Bundle card (mirrors MobileAlertCard layout) */
.mobile-bundle-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 0 var(--space-card-padding, 14px);
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  font-family: var(--font-mono, monospace);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.mobile-bundle-card-meta {
  font-size: var(--text-caption, 10px);
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 0.04em;
}

/* Reduced motion: disable card press animations */
@media (prefers-reduced-motion: reduce) {
  .mobile-intel-search-bar,
  .mobile-region-card,
  .mobile-bundle-card {
    transition: none;
  }
}
```

### D-7: Integration in `MobileView.tsx`

After this workstream, `MobileView.tsx` (progressively built across phases) wires `MobileIntelTab` into the shell's `intelContent` slot:

```typescript
import { MobileIntelTab } from '@/components/mobile/MobileIntelTab'

// Inside MobileView render:
<MobileShell
  intelContent={
    <MobileIntelTab
      onSearchPress={handleSearchPress}
      onAlertTap={handleAlertTap}
      onRegionTap={handleRegionTap}
      scrollRef={intelScrollRef}
    />
  }
  // ... other slots
/>
```

The `handleAlertTap` callback writes to `coverage.store` via `selectMapAlert()` to open the alert detail bottom sheet. The `handleRegionTap` callback is a no-op stub until WS-E.2 delivers `MobileRegionDetail`. The `handleSearchPress` callback is a no-op stub until WS-E.2 delivers `MobileSearchOverlay`.

### D-8: Unit tests (`src/components/mobile/__tests__/MobileIntelTab.test.tsx`)

Vitest component tests covering:

1. **Adapter tests (`intel-adapters.ts`):**
   - `intelFeedItemToCardItem` maps all fields correctly; missing fields are null.
   - `priorityFeedItemToCardItem` maps all fields correctly; `confidence` is null.
   - Both adapters preserve `operationalPriority` when present and null when absent.

2. **`MobileRegionCard` rendering:**
   - Renders region display name from `GEO_REGION_META`.
   - Renders threat level badge with correct text.
   - Renders summary text with 2-line clamp class.
   - Renders trend indicator icon matching `riskTrend`.
   - Fires `onTap` with the summary object when clicked.
   - Global variant renders `Globe` icon and left border.

3. **`MobileIntelTab` section rendering:**
   - When `viewMode === 'raw'`: renders "RECENT INTEL" header, renders `MobileAlertCard` instances.
   - When `viewMode === 'all-bundles'`: renders "INTEL BUNDLES" header, renders bundle cards.
   - Geographic intelligence section renders global summary first, then region cards.
   - Search bar renders and fires `onSearchPress` on click.
   - Empty feed state shows "No recent intel" message.
   - Empty geo state shows "No geographic summaries" message.

4. **`MobileBundleCard` rendering:**
   - Renders bundle title from `getBundleDisplayTitle`.
   - Renders severity dot from `getBundleDisplaySeverity`.
   - Renders intel count and source count.
   - Fires `setSelectedBundleId` on tap.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `MobileIntelTab` renders inside the MobileShell Intel tab slot. Switching to the Intel tab via `MobileBottomNav` displays the component. | Manual: Chrome DevTools responsive mode at 375x812. Tap Intel tab. Verify content renders. |
| AC-2 | Search bar is sticky at the top of the Intel tab scroll container. Scrolling content moves beneath it. Tapping the search bar fires `onSearchPress` callback. | Manual: scroll the Intel tab content. Verify search bar stays fixed. Tap it. Verify callback fires (console.log in dev). |
| AC-3 | `ViewModeToggle` renders below the search bar. Tapping segments switches between triaged/all-bundles/raw modes. Feed section updates to reflect the selected mode. | Manual: tap each view mode segment. Verify the feed section header and content change accordingly. |
| AC-4 | When `viewMode` is `'raw'` or `'triaged'`, the feed section renders up to 50 `MobileAlertCard` instances from `useIntelFeed()`, sorted by `ingestedAt` descending (most recent first). | Manual: verify card count (up to 50). Verify cards show title, severity dot, category tag, timestamp. Verify sort order (most recent at top). |
| AC-5 | When `viewMode` is `'all-bundles'`, the feed section renders `MobileBundleCard` instances from `useIntelBundles('all-bundles')`. Each card shows bundle title, severity dot, intel count, source count, and relative timestamp. | Manual: switch to "All Bundles" mode. Verify bundle cards render with correct data. |
| AC-6 | Tapping a `MobileAlertCard` in the feed fires `onAlertTap` with the adapted `CategoryIntelItem`. This triggers the alert detail bottom sheet to open (via `selectMapAlert` on `coverage.store`). | Manual: tap an alert card. Verify alert detail sheet opens with matching data. |
| AC-7 | Tapping a `MobileBundleCard` calls `setSelectedBundleId` on `coverage.store`, which triggers the triage rationale sheet to open (if WS-C.2 is wired). | Manual: tap a bundle card in all-bundles mode. Verify `selectedBundleId` is set in store (inspect via React DevTools or Zustand devtools). |
| AC-8 | Geographic intelligence section renders a global summary card (if world-level summary exists) followed by up to 11 region summary cards. Global card has distinct left-border styling and `Globe` icon. | Manual: verify global card renders first with left border tint. Verify region cards follow. Count region cards (up to 11). |
| AC-9 | Region cards display: region name (from `GEO_REGION_META`), threat level badge (color-coded per `THREAT_LEVEL_COLORS`), risk trend icon (`TrendingUp`/`TrendingDown`/`Minus`), 2-line-clamped summary text, relative timestamp. | Manual: inspect each region card element. Verify color coding matches threat level. Verify text is clamped at 2 lines. |
| AC-10 | Region cards are sorted by threat level severity descending (CRITICAL first, then HIGH, ELEVATED, MODERATE, LOW), with alphabetical display name as tie-breaker. | Manual: verify ordering. If two regions share the same threat level, verify alphabetical order. |
| AC-11 | Tapping a region card fires `onRegionTap` with the `GeoSummary` object. | Manual: tap a region card. Verify callback fires (console.log in dev). |
| AC-12 | Loading states render shimmer placeholders (5 rows for feed, 3 cards for geo). Error states render `MobileStateView` error card with retry button. Empty states render contextual empty messages. | Manual: disconnect backend, verify error state. Clear data, verify empty state. On initial load, verify shimmer renders briefly. |
| AC-13 | All interactive elements (search bar, alert cards, bundle cards, region cards) have minimum touch target of 44px height. | Chrome DevTools: inspect computed `min-height` on each interactive element. |
| AC-14 | Relative timestamps update on a 30-second tick without requiring data refetch. | Manual: observe a timestamp. Wait 30s. Verify it updates (e.g., "5m" becomes "6m") without a network request. |
| AC-15 | Scroll container has `overscroll-behavior-y: contain` to prevent browser pull-to-refresh interference. | Chrome DevTools: inspect computed styles on the scroll container. |
| AC-16 | `pnpm typecheck` passes with zero errors after all files are added. | Run `pnpm typecheck` from project root. |
| AC-17 | Desktop view is completely unaffected. Loading at viewport >= 768px renders the existing desktop spatial ZUI with no visual or behavioral changes. | Manual comparison at desktop viewport. |
| AC-18 | Card press animations respect `prefers-reduced-motion: reduce`. When reduced motion is enabled, no scale/opacity transitions occur on press. | Chrome DevTools: enable "prefers-reduced-motion: reduce" in rendering settings. Tap cards. Verify no animation. |

---

## 6. Architectural Decisions

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| AD-1 | Intel feed uses `useIntelFeed()` (all categories, all priorities, chronological) rather than `usePriorityFeed()` (P1/P2 only). | The Intel tab serves a different intent than the Situation tab. Situation tab shows P1/P2 priority alerts via `MobilePriorityStrip` (WS-B.1). The Intel tab shows the full chronological feed for analytical review. Using the same `usePriorityFeed` data would duplicate information already visible on the Situation tab. | (a) `usePriorityFeed()` for P1/P2 section + `useIntelFeed()` for remaining. Rejected: introduces two data sources with different polling intervals for a single list, creating inconsistent update behavior. (b) Combined priority + intel feed. Rejected: deduplication complexity, unclear sort priority. |
| AD-2 | Adapter functions (`intelFeedItemToCardItem`) bridge `IntelFeedItem` to `CategoryIntelItem` rather than modifying `MobileAlertCard` to accept a broader type. | `MobileAlertCard` is specified by WS-D.2 with a `CategoryIntelItem` prop contract. Changing the prop type would require coordinating with WS-D.1 (category detail, which also uses the card) and break the established interface contract. Adapters are cheap, explicit, and testable. | (a) Generalize `MobileAlertCard` to accept a union type. Rejected: widens the component contract, requires WS-D.1 changes, introduces runtime type narrowing. (b) Create a separate `MobileIntelCard` component. Rejected: near-identical rendering logic would duplicate ~100 lines. |
| AD-3 | `MobileRegionCard` is a new dedicated component rather than reusing `MobileAlertCard`. | Region summaries have fundamentally different data (threat level, structured breakdown, region name) and different visual treatment (threat level badge, region icon, summary text clamp) than intel alerts (severity dot, category tag, priority badge). Forcing both into one component would require excessive conditional branching. | (a) Render regions as `MobileAlertCard` with adapted data. Rejected: visual treatment differs too much (threat level badge vs severity dot, 2-line summary vs single-line title). |
| AD-4 | `THREAT_LEVEL_COLORS` is in its own file (`src/lib/threat-level-colors.ts`) rather than added to `coverage.ts` or `threat-utils.ts`. | `coverage.ts` is already 412 lines and has a clear scope (categories, severity, priority). `threat-utils.ts` (WS-B.1) contains posture derivation logic and `POSTURE_CONFIGS` which include colors, but mixing display-oriented color maps with derivation functions blurs responsibilities. A small dedicated file maintains clear module boundaries. | (a) Add to `coverage.ts`. Rejected: file is already large; threat level colors are not category-related. (b) Add to `threat-utils.ts`. Acceptable alternative; chosen approach is slightly cleaner for import weight. |
| AD-5 | The search bar is a `<button>` styled as a search input, not a real `<input>`. | The search bar is purely an entry point -- tapping it opens `MobileSearchOverlay` (WS-E.2), which contains the actual search input with keyboard, suggestions, and results. Using a `<button>` avoids focus/keyboard issues on tap, prevents virtual keyboard from appearing before the overlay opens, and simplifies the component. | (a) Use `<input readOnly>` with `onFocus` handler. Rejected: some browsers still show keyboard briefly on focus before the overlay can open. (b) Use `<input>` that transitions to overlay. Rejected: complex state management for focus/blur/overlay lifecycle. |
| AD-6 | Geographic summaries are sorted by threat level severity descending, not by `generatedAt` or alphabetically. | Analysts scanning the Intel tab want to see the most critical regions first. Sorting by threat level makes the most dangerous areas immediately visible without scrolling. Alphabetical ordering would bury critical regions if they start with late-alphabet letters. | (a) Sort alphabetically by region name. Rejected: doesn't surface urgency. (b) Sort by `generatedAt` (most recent first). Rejected: recency of AI generation does not correlate with threat severity. |
| AD-7 | `MobileBundleCard` is defined inline within `MobileIntelTab.tsx` rather than in a separate file. | The component is ~80 lines, used only within `MobileIntelTab`, and unlikely to be reused elsewhere. Extracting it adds a file without proportional benefit. If reuse emerges later (e.g., search results include bundles), extraction is a trivial refactor. | (a) Separate `MobileBundleCard.tsx` file. Acceptable alternative; deferred to keep file count minimal during Phase E. |
| AD-8 | Pull-to-refresh readiness is via a forwarded `scrollRef` prop rather than a context provider or global ref. | The ref pattern is explicit, type-safe, and matches how WS-F.5 is expected to attach gesture handlers (per the OVERVIEW description of pull-to-refresh as a per-scroll-container concern). A context provider adds indirection without benefit when there is a single scroll container per tab. | (a) React Context for scroll container access. Rejected: over-engineered for single-consumer use case. (b) Custom event system. Rejected: unnecessary indirection. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the Intel tab auto-scroll to the top when new items arrive during a polling refetch, or should it preserve scroll position? Current implementation preserves scroll position (TanStack Query `keepPreviousData`). Auto-scroll could be disorienting mid-read. | world-class-ux-designer | Phase F (polish) |
| OQ-2 | Should the search bar collapse/hide on scroll-down and reappear on scroll-up (iOS Safari-style scroll direction hiding)? The current spec keeps it sticky at all times. Scroll-hide would reclaim 48px of viewport but adds implementation complexity. | world-class-ux-designer | Phase F (polish) |
| OQ-3 | The OVERVIEW wireframe (Section 4.3) shows a landscape variant with two independent scroll columns (priority alerts left, geographic intel right). Should this WS lay foundation for that split, or is landscape layout entirely WS-F.1's concern? Decision: defer to WS-F.1. This WS delivers portrait-first single-column layout only. | planning-coordinator | Phase E review gate |
| OQ-4 | When `useAllGeoSummaries` returns multiple summaries for the same region (e.g., both hourly and daily), the current spec deduplicates by taking the most recent per `geoKey`. Should we instead show both with a type label ("hourly" vs "daily")? Decision: show only the most recent for space efficiency; the region detail drill-down (WS-E.2) shows both. | information-architect | Resolved in AD-6 rationale |
| OQ-5 | Should bundle card taps open the triage rationale bottom sheet directly, or should they first navigate to a bundle-specific detail view? The current spec uses `setSelectedBundleId` which the existing triage rationale sheet reads. If no sheet is wired yet (WS-C.2 may not have a bundle detail trigger), the tap is a no-op. | react-developer | Phase E review gate |

---

## 8. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `IntelFeedItem` shape may diverge from `CategoryIntelItem` if either type is modified in a future workstream, breaking the `intelFeedItemToCardItem` adapter silently. | Low | Medium | TypeScript compiler catches field additions/removals at build time. Unit tests verify mapping completeness for both adapters. Both types are defined in existing, stable hook files. |
| R-2 | `useAllGeoSummaries(true)` may return an empty array if the TarvaRI backend has not generated any summaries yet (new deployment, no AI pipeline running). The geographic intelligence section would show only the empty state. | Medium | Low | Acceptable degradation. The empty state message ("AI-generated geographic summaries are not yet available") communicates the situation clearly. The Intel tab remains useful via the feed section. |
| R-3 | The `ViewModeToggle` shared component may not render correctly at mobile viewport widths. It was designed for desktop layout and may overflow or have touch target issues. | Medium | Medium | Visual testing at 375px width during implementation. If the toggle overflows, wrap it in a horizontally scrollable container or create a mobile-specific variant in WS-F.5 polish. The component uses standard button elements which should be touch-ready. |
| R-4 | Rendering 50 `MobileAlertCard` instances in the feed may cause jank on older mobile devices during scroll, especially with glass backdrop-filter on each card. | Low | Medium | `MobileAlertCard` is `memo`-wrapped (per WS-D.2 spec). Cards use minimal backdrop-filter (only on the overall tab container, not individual cards in the feed list). If scroll jank is observed, implement windowed rendering via `react-window` in Phase F polish. |
| R-5 | The alert detail bottom sheet may not open correctly when triggered from the Intel tab because the `selectMapAlert` pattern was designed for map marker taps (WS-C.4). The flow expects `selectedMapAlertCategory` which is available from feed items but `selectedMapAlertBasic` requires `{ title, severity, ingestedAt }` which must be constructed from the adapted `CategoryIntelItem`. | Low | Medium | The `onAlertTap` handler in `MobileView.tsx` already receives a `CategoryIntelItem` (via the adapter). It can construct the `basic` object from `{ title: item.title, severity: item.severity, ingestedAt: item.ingestedAt }` before calling `selectMapAlert`. This is the same pattern WS-C.4 uses for map marker taps. |
| R-6 | The `MobileBundleCard` tap may be a no-op if the triage rationale bottom sheet (WS-C.2) does not read `selectedBundleId` or has not been wired for the Intel tab context. | Medium | Low | Acceptable. The store write (`setSelectedBundleId`) is correct regardless. If the sheet is not yet wired, the tap has no visible effect -- same as other deferred integration points (search press, region tap). WS-E.3 or Phase F polish will complete the wiring. |
| R-7 | Geographic summary deduplication (most recent per `geoKey`) may discard hourly summaries in favor of daily summaries if the daily was generated more recently, even though the hourly contains more timely data. | Low | Low | The deduplication compares `generatedAt` timestamps, not `summaryType`. In practice, hourly summaries are generated more frequently than daily ones, so the most recent summary for a region is almost always the hourly. Region detail (WS-E.2) shows both types, so no data is permanently lost. |
