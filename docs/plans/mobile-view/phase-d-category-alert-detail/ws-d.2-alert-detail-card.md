# WS-D.2: Alert Detail + Card

> **Workstream ID:** WS-D.2
> **Phase:** D -- Category + Alert Detail
> **Assigned Agent:** `information-architect`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-C.1 (MobileBottomSheet component, `SHEET_CONFIGS.alertDetail` config with snap points `[70, 100]`, `onDismiss` callback, `isOpen` controlled prop, `ariaLabel` prop, portal rendering, drag/snap system), WS-C.4 (replaces `MobileAlertDetailStub` placeholder delivered in D-3, inherits the marker tap -> store write -> sheet open flow), WS-D.1 (MobileCategoryDetail provides the alert list context in which `MobileAlertCard` is rendered; exposes `onAlertTap` callback), WS-A.3 (glass tokens `--glass-card-bg`, `--glass-card-blur`, `--glass-card-border`; severity tokens `--severity-extreme` through `--severity-unknown`; typography tokens `--font-mono`, `--text-xs`, `--text-sm`; spacing tokens `--space-2` through `--space-5`; touch target tokens `--touch-target-min: 44px`, `--touch-target-comfortable: 48px`; animation timing token `--duration-card-press`)
> **Blocks:** WS-D.3 (wires the `onShowOnMap`, `onViewCategory`, and `onShare` action button callbacks to actual navigation and clipboard logic), WS-E.3 (cross-tab "Show on Map" and "View Category" links reuse the callback signatures defined here)
> **Resolves:** WS-C.4 D-3 (replaces `MobileAlertDetailStub` with full `MobileAlertDetail`), OVERVIEW Section 4.5 (Alert Detail bottom sheet layout), Gap 4 from `combined-recommendations.md` (country centroid fallback for "Show on Map")

---

> **Review Fixes Applied (Phase D Review):**
>
> - **H-3 (onShowOnMap signature):** Expanded `onShowOnMap` callback to pass resolved coordinates, category, and basic info: `(alertId: string, coords: { lat: number; lng: number }, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void`. The `resolveAlertCentroid()` function resolves coordinates from `displayMarkers` or `COUNTRY_CENTROIDS` before calling the prop.
> - **M-3 (missing dependency):** Added `useCoverageMapData()` to input dependencies. `MobileAlertDetail` calls it directly (TanStack Query cache prevents duplicate network requests) to resolve marker coordinates for "Show on Map".

---

## 1. Objective

Build two components that form the complete mobile alert experience: **`MobileAlertCard`** -- a compact 64px-tall list item for displaying individual intel alerts in scrollable lists -- and **`MobileAlertDetail`** -- the full bottom sheet content panel for alert drill-down that replaces the `MobileAlertDetailStub` placeholder from WS-C.4.

`MobileAlertCard` is the mobile equivalent of the desktop `AlertList` button rows in `CategoryDetailScene.tsx` (lines 326-381). It appears in three contexts: the category detail alert list (WS-D.1), the Intel tab priority feed (WS-E.1), and search results (WS-E.2). The card is a touch-optimized, 64px-tall row with severity dot, title (truncated), relative timestamp, operational priority badge, category tag, and a right-chevron disclosure affordance.

`MobileAlertDetail` is the mobile equivalent of the desktop `AlertDetailPanel` (`src/components/coverage/AlertDetailPanel.tsx`, 439 lines). It renders inside `MobileBottomSheet` using `SHEET_CONFIGS.alertDetail` (snap points `[70, 100]`) and presents the complete alert record: severity badge, priority badge (achromatic per AD-1), title, category with icon, event type, confidence bar, geographic scope tags, summary text, source key, timestamps (ingested and sent as relative time), and three action buttons ("Show on Map", "View Category", "Share").

Both components wire to the existing shared `CategoryIntelItem` type from `src/hooks/use-category-intel.ts` and introduce no new API endpoints or Zustand store modifications. A new static `COUNTRY_CENTROIDS` lookup map is delivered to support the "Show on Map" country-level fallback per Gap 4.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **`MobileAlertCard` component** | 64px touch-target list item. Receives a `CategoryIntelItem` via props. Renders: severity dot (8px colored circle), title (single-line truncated), operational priority badge (P1/P2 only in list context per `isPriorityVisible`), category short name tag, relative timestamp, right-chevron affordance. Tap fires `onTap(item)`. |
| **`MobileAlertDetail` component** | Bottom sheet content panel. Reads `selectedMapAlertId` / `selectedMapAlertCategory` / `selectedMapAlertBasic` from `coverage.store`. Fetches full intel via `useCategoryIntel`. Renders: severity badge, priority badge (achromatic per AD-1), title, category with icon, event type, confidence percentage bar, geographic scope country tags, short summary text, source key, timestamps (ingested_at and sent_at as relative), operational priority with label, and three action buttons. |
| **Action button prop signatures** | Three action buttons with typed callback props: `onShowOnMap(alertId: string)`, `onViewCategory(categoryId: string)`, `onShare(alertId: string)`. This WS defines the signatures and renders the buttons. WS-D.3 implements the handlers. |
| **`COUNTRY_CENTROIDS` static map** | `src/lib/country-centroids.ts` exporting a `Record<string, { lat: number; lng: number }>` of ISO 3166-1 alpha-2 country codes to geographic centroids. Used by "Show on Map" fallback when no `MapMarker` match exists. ~200 entries, ~3KB gzipped. |
| **`MobileAlertDetailStub` replacement** | Swap import from `MobileAlertDetailStub` to `MobileAlertDetail` in `MobileView.tsx`. Delete the stub file after replacement. |
| **CSS file** | `src/styles/mobile-alert.css` for card press state, confidence bar transition, geo tag overflow, action button active state, and reduced motion overrides. |
| **Unit tests** | Vitest component tests for both components: rendering states, tap handlers, truncation, metadata rows, loading states, action button firing, disabled states, accessibility labels. |
| **Touch target compliance** | All interactive elements meet `var(--touch-target-min)` (44px minimum per WCAG 2.5.8). |
| **Reduced motion support** | Card press animation respects `prefers-reduced-motion: reduce`. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileBottomSheet` container (drag, snap, spring physics, glass surface, portal) | WS-C.1 scope. This WS renders content inside the sheet. |
| Cross-tab navigation implementation (tab switching, morph triggering, map fly-to, clipboard copy) | WS-D.3 wires the action button callbacks. WS-E.3 extends them across all alert contexts. This WS defines only the callback signatures and renders the buttons. |
| Category detail bottom sheet content | WS-D.1 scope. That component renders `MobileAlertCard` instances in the alert list. |
| Alert list sorting and filtering logic | WS-D.1 scope. `MobileAlertCard` is a pure presentation component; the parent handles sort/filter. |
| Desktop rendering changes | All new components are mobile-only under `src/components/mobile/`. Desktop `AlertDetailPanel` is unaffected. |
| Map marker tap flow (store write, map fly-to) | WS-C.4 scope (already delivered). This WS replaces the stub content the sheet renders. |
| Fullscreen expand mode | WS-C.2 scope. Not included as an action button per this spec. |
| Landscape layout variant | WS-F.1 scope. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/hooks/use-category-intel.ts` (lines 24-37) | `CategoryIntelItem` interface: `id`, `title`, `severity`, `category`, `eventType`, `sourceKey`, `confidence`, `geoScope`, `shortSummary`, `ingestedAt`, `sentAt`, `operationalPriority`. Hook: `useCategoryIntel(categoryId)` returning `UseQueryResult<CategoryIntelItem[]>`, 45s refetch. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 113-125) | `SeverityLevel`, `SEVERITY_LEVELS`, `SEVERITY_COLORS` record mapping severity to CSS color values with `var()` tokens and hex fallbacks. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 137-241) | `OperationalPriority` (`'P1' \| 'P2' \| 'P3' \| 'P4'`), `PRIORITY_LEVELS`, `PRIORITY_META` record (label, shortLabel, shape, weight, animation, defaultVisibility, sortOrder), `getPriorityMeta()`, `isPriorityVisible()`. | Exists |
| `src/lib/interfaces/coverage.ts` (lines 87-106) | `getCategoryMeta(id)` returning `CategoryMeta` (displayName, shortName, icon, color, description), `getCategoryColor(id)`, `getCategoryIcon(id)`, `CategoryMeta` interface. | Exists |
| `src/components/coverage/PriorityBadge.tsx` (lines 98-179) | `PriorityBadge` shared component. Props: `priority: OperationalPriority`, `size: 'sm' \| 'md' \| 'lg'`, `showLabel?: boolean`, `className?: string`. Renders achromatic priority indicator (shape + weight + animation, no color per AD-1). | Exists |
| `src/stores/coverage.store.ts` (lines 84-88) | `selectedMapAlertId: string \| null`, `selectedMapAlertCategory: string \| null`, `selectedMapAlertBasic: { title: string; severity: string; ingestedAt: string } \| null`. | Exists |
| `src/stores/coverage.store.ts` (lines 234-240) | `clearMapAlert()` action: sets `selectedMapAlertId`, `selectedMapAlertCategory`, `selectedMapAlertBasic` to null. | Exists |
| `src/lib/time-utils.ts` (lines 21-42) | `relativeTimeAgo(isoString: string): string` -- compact format ("NOW", "45s", "5m", "3h", "2d", "1w"). | Exists |
| `src/components/coverage/AlertDetailPanel.tsx` (lines 28-40) | Desktop reference for `formatTimestamp(iso)` -- produces "Mar 6, 2026, 2:23 PM EST". Mobile component defines its own local copy (avoids cross-boundary import). | Exists (reference only) |
| `src/components/district-view/scenes/CategoryDetailScene.tsx` (lines 105-123) | Desktop `relativeTime(isoDate)` function -- verbose format ("5m ago"). Reference for mobile card timestamp. | Exists (reference only) |
| `src/components/district-view/district-view-dock.tsx` (lines 70-229) | Desktop `AlertDetailView` -- reference for detail layout: severity badge, priority badge, title, summary, metadata grid, confidence bar, geo scope tags, timestamps. | Exists (reference only) |
| WS-C.1 `MobileBottomSheet` | Component with `isOpen: boolean`, `onDismiss: () => void`, `config: BottomSheetConfig`, `ariaLabel: string`, `children: ReactNode`. `SHEET_CONFIGS.alertDetail` = `{ id: 'alert-detail', snapPoints: [70, 100], initialSnapIndex: 0, dismissible: true }`. Integer percentage snap points (not fractions). | Pending (Phase C) |
| WS-C.4 `MobileAlertDetailStub` | Stub component at `src/components/mobile/MobileAlertDetailStub.tsx`. Shows basic marker data (title, severity, category, timestamp). This WS replaces it. | Pending (Phase C) |
| WS-D.1 `MobileCategoryDetail` | Parent component that renders `MobileAlertCard` instances in a scrollable alert list. Provides `onAlertTap(alertId)` callback. | Pending (Phase D) |
| WS-A.3 design tokens | `--space-card-padding` (14px), `--touch-target-min` (44px), `--touch-target-comfortable` (48px), `--text-body` (13px), `--text-label` (11px), `--text-caption` (10px), `--font-mono`, `--duration-card-press` (100ms), `--safe-area-bottom`, `--severity-extreme` through `--severity-unknown`, `--glass-card-bg`, `--glass-card-blur`, `--glass-card-border`. | Pending (Phase A) |
| `src/hooks/use-coverage-map-data.ts` | `useCoverageMapData()` returning `UseQueryResult<MapMarker[]>`. Used by `resolveAlertCentroid()` to find marker coordinates for "Show on Map". TanStack Query cache prevents duplicate network requests. | Exists |
| `lucide-react` | Icons: `ChevronRight`, `MapPin`, `FolderOpen`, `Share2`. | Available (existing dependency) |
| `motion/react` | `motion.button` for press feedback. `AnimatePresence`, `motion.div` for detail content crossfade. | Available (existing dependency) |

---

## 4. Deliverables

### D-1: `MobileAlertCard` component (`src/components/mobile/MobileAlertCard.tsx`)

Touch-optimized 64px list item for displaying a single intel alert in scrollable lists. Used by WS-D.1 (category detail alert list), WS-E.1 (Intel tab priority feed), and WS-E.2 (search results). This is a pure presentation component -- it receives all data via props.

**Props interface:**

```typescript
import type { CategoryIntelItem } from '@/hooks/use-category-intel'

export interface MobileAlertCardProps {
  /** The intel item to display. */
  readonly item: CategoryIntelItem
  /** Called when the card is tapped. Receives the full item for context. */
  readonly onTap: (item: CategoryIntelItem) => void
  /** Whether this card is the currently selected/active item. Highlights the row. */
  readonly isSelected?: boolean
}
```

**Visual layout (64px row):**

```
+---------------------------------------------------------------+
| [*]  7.2 Earthquake Near Port Moresby...    [>]               |
|      [P1]  SEIS                        5m                     |
+---------------------------------------------------------------+
  ^     ^     ^                          ^    ^
  |     |     |                          |    +-- Chevron (14px)
  |     |     +-- Category tag           +-- Relative timestamp
  |     +-- Title (truncated, single line)
  +-- Severity dot (8px)
```

**Visual specification:**

| Element | Property | Value | Token |
|---------|----------|-------|-------|
| **Row** | Height | 64px (min-height) | -- |
| | Padding | `0 var(--space-card-padding, 14px)` | `--space-card-padding` |
| | Display | `flex`, `align-items: center`, `gap: 12px` | -- |
| | Background (idle) | `rgba(255, 255, 255, 0.02)` | -- |
| | Background (selected) | `rgba(255, 255, 255, 0.06)` | -- |
| | Border-bottom | `1px solid rgba(255, 255, 255, 0.04)` | -- |
| | Border-radius | 8px | -- |
| | Font-family | `var(--font-mono, monospace)` | `--font-mono` |
| | Touch feedback | `transform: scale(0.98)` for 100ms via `motion.button whileTap` | `--duration-card-press` |
| **Severity dot** | Size | 8x8px circle | -- |
| | Background | `SEVERITY_COLORS[item.severity]` (line 119-125 of coverage.ts) | `--severity-*` |
| | Flex-shrink | 0 | -- |
| | Align-self | `flex-start`, margin-top 20px (optical center in 64px row) | -- |
| **Title** | Font-size | `var(--text-body, 13px)` | `--text-body` |
| | Font-weight | 400 | -- |
| | Line-height | 1.4 | -- |
| | Color (idle) | `rgba(255, 255, 255, 0.50)` | -- |
| | Color (selected) | `rgba(255, 255, 255, 0.55)` | -- |
| | Overflow | `hidden`, `text-overflow: ellipsis`, `white-space: nowrap` | -- |
| | Flex | `1`, `min-width: 0` (for truncation) | -- |
| **Priority badge** | Component | `<PriorityBadge priority={...} size="sm" />` | -- |
| | Visibility | Only for P1/P2 via `isPriorityVisible(priority, 'list')`. P3/P4 hidden in list. | -- |
| **Category tag** | Font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Font-weight | 500 | -- |
| | Letter-spacing | `0.06em` | -- |
| | Text-transform | `uppercase` | -- |
| | Color | `color-mix(in srgb, ${getCategoryColor(category)} 50%, transparent)` | -- |
| **Timestamp** | Font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Color | `rgba(255, 255, 255, 0.20)` | -- |
| | Letter-spacing | `0.04em` | -- |
| | Margin-left | `auto` (pushes to right edge) | -- |
| | Format | `relativeTimeAgo(item.ingestedAt)` -- compact: "5m", "3h", "2d" | -- |
| **Chevron** | Icon | `ChevronRight` from `lucide-react` | -- |
| | Size | 14px | -- |
| | Color | `rgba(255, 255, 255, 0.15)` | -- |
| | Flex-shrink | 0 | -- |

**Implementation:**

```typescript
/**
 * Mobile alert card -- 64px touch-target list item for intel alerts.
 *
 * Displays severity dot, title, category tag, priority badge,
 * relative timestamp, and disclosure chevron. Tap opens the alert
 * detail bottom sheet.
 *
 * Used by: WS-D.1 (category detail), WS-E.1 (intel tab), WS-E.2 (search).
 *
 * @module MobileAlertCard
 * @see WS-D.2
 */

'use client'

import { memo, useCallback } from 'react'
import { motion } from 'motion/react'
import { ChevronRight } from 'lucide-react'

import {
  getCategoryMeta,
  getCategoryColor,
  SEVERITY_COLORS,
  isPriorityVisible,
  type SeverityLevel,
} from '@/lib/interfaces/coverage'
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
import { relativeTimeAgo } from '@/lib/time-utils'
import type { CategoryIntelItem } from '@/hooks/use-category-intel'

export interface MobileAlertCardProps {
  readonly item: CategoryIntelItem
  readonly onTap: (item: CategoryIntelItem) => void
  readonly isSelected?: boolean
}

export const MobileAlertCard = memo(function MobileAlertCard({
  item,
  onTap,
  isSelected = false,
}: MobileAlertCardProps) {
  const severityColor =
    SEVERITY_COLORS[item.severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown
  const categoryMeta = getCategoryMeta(item.category)
  const categoryColor = getCategoryColor(item.category)
  const showPriority =
    item.operationalPriority != null &&
    isPriorityVisible(item.operationalPriority, 'list')

  const handleTap = useCallback(() => onTap(item), [onTap, item])

  return (
    <motion.button
      type="button"
      role="listitem"
      data-alert-id={item.id}
      data-severity={item.severity}
      aria-label={`${item.severity} alert: ${item.title}, ${categoryMeta.shortName}, ${relativeTimeAgo(item.ingestedAt)}`}
      onClick={handleTap}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        minHeight: 64,
        padding: '0 var(--space-card-padding, 14px)',
        background: isSelected
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'var(--font-mono, monospace)',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',
      }}
    >
      {/* Severity dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: severityColor,
          flexShrink: 0,
          alignSelf: 'flex-start',
          marginTop: 20,
        }}
      />

      {/* Content column */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        {/* Top row: title + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 'var(--text-body, 13px)',
              fontWeight: 400,
              lineHeight: 1.4,
              color: isSelected
                ? 'rgba(255, 255, 255, 0.55)'
                : 'rgba(255, 255, 255, 0.50)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.title}
          </span>
          <ChevronRight
            size={14}
            style={{
              color: 'rgba(255, 255, 255, 0.15)',
              flexShrink: 0,
            }}
          />
        </div>

        {/* Bottom row: priority + category + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showPriority && (
            <PriorityBadge priority={item.operationalPriority!} size="sm" />
          )}
          <span
            style={{
              fontSize: 'var(--text-caption, 10px)',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: `color-mix(in srgb, ${categoryColor} 50%, transparent)`,
              whiteSpace: 'nowrap',
            }}
          >
            {categoryMeta.shortName}
          </span>
          <span
            style={{
              fontSize: 'var(--text-caption, 10px)',
              color: 'rgba(255, 255, 255, 0.20)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              marginLeft: 'auto',
            }}
          >
            {relativeTimeAgo(item.ingestedAt)}
          </span>
        </div>
      </div>
    </motion.button>
  )
})
```

**Memoization:** Wrapped in `React.memo` with default shallow comparison. The `CategoryIntelItem` objects are stable across renders (referential equality from TanStack Query structural sharing). Re-renders only when `item`, `onTap`, or `isSelected` change.

**Press feedback:** Uses `motion.button` with `whileTap={{ scale: 0.98 }}` and `transition={{ duration: 0.1 }}`. Disabled when `prefers-reduced-motion: reduce` via CSS override in `mobile-alert.css`.

---

### D-2: `MobileAlertDetail` component (`src/components/mobile/MobileAlertDetail.tsx`)

Full alert detail content rendered inside `MobileBottomSheet` when an alert is selected. Replaces `MobileAlertDetailStub` from WS-C.4 D-3.

**Data fetching strategy (matches desktop `AlertDetailPanel.tsx` lines 334-355):**

1. **Immediate render:** Use `selectedMapAlertBasic` from `coverage.store` (title, severity, ingestedAt) for instant content while full data loads.
2. **Rich data upgrade:** When `useCategoryIntel(category)` returns, find the matching `CategoryIntelItem` by ID and render all metadata fields.
3. **Fallback:** If the full item is not found (e.g., removed by background refresh), continue showing basic data with metadata rows omitted.

**Props interface:**

```typescript
export interface MobileAlertDetailProps {
  /**
   * Called when "Show on Map" action is tapped.
   * WS-D.3 implements: switches to Map tab and flies to marker coordinates
   * or country centroid fallback.
   */
  readonly onShowOnMap: (alertId: string, coords: { lat: number; lng: number }, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void
  /**
   * Called when "View Category" action is tapped.
   * WS-D.3 implements: opens category detail sheet for this category.
   */
  readonly onViewCategory: (categoryId: string) => void
  /**
   * Called when "Share" action is tapped.
   * WS-D.3 implements: constructs deep link URL and copies to clipboard.
   */
  readonly onShare: (alertId: string) => void
  /**
   * Whether the "Show on Map" button should be enabled.
   * False when the alert has no associated map marker AND no geoScope entries.
   * The parent determines this by checking displayMarkers for the alert ID
   * and falling back to COUNTRY_CENTROIDS for the first geoScope entry.
   */
  readonly canShowOnMap?: boolean
}
```

**Visual layout (vertical single-column):**

```
+------------------------------------------+
| [EXTREME]  [P1 Critical]                 |  Badges row
|------------------------------------------|
| 7.2 Earthquake Near Port Moresby         |  Title
|------------------------------------------|
| [Activity icon]  SEISMIC                 |  Category with icon
|------------------------------------------|
| SUMMARY                                  |  Label
| A magnitude 7.2 earthquake was detected  |  Summary text
| near Port Moresby, Papua New Guinea...   |
|------------------------------------------|
| EVENT TYPE    earthquake                 |  Metadata rows
| SOURCE        usgs-feed                  |
| CONFIDENCE    [====----] 72%             |
| GEO SCOPE     [PG] [AU] [SB]            |
|------------------------------------------|
| INGESTED      5m ago                     |  Timestamps
| SENT          12m ago                    |
|------------------------------------------|
| PRIORITY      P1 -- Critical             |  Priority explanation
|               Immediate threat to life   |
|               or critical infrastructure |
|------------------------------------------|
| [MapPin]  SHOW ON MAP              [>]   |  Action buttons
| [Folder]  VIEW SEIS                [>]   |
| [Share]   SHARE                    [>]   |
+------------------------------------------+
```

**Visual specification:**

| Element | Property | Value | Token |
|---------|----------|-------|-------|
| **Container** | Padding | `24px var(--space-card-padding, 14px) calc(var(--safe-area-bottom, 0px) + 24px)` | `--space-card-padding`, `--safe-area-bottom` |
| | Font-family | `var(--font-mono, monospace)` throughout | `--font-mono` |
| **Severity badge** | Padding | `5px 10px` | -- |
| | Border-radius | 4px | -- |
| | Font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Font-weight | 600 | -- |
| | Letter-spacing | `0.08em` | -- |
| | Text-transform | `uppercase` | -- |
| | Color | `SEVERITY_COLORS[severity]` | `--severity-*` |
| | Background | `color-mix(in srgb, ${severityColor} 20%, transparent)` | -- |
| | Border | `1px solid color-mix(in srgb, ${severityColor} 30%, transparent)` | -- |
| **Priority badge** | Component | `<PriorityBadge priority={...} size="md" showLabel />` | -- |
| | Visibility | Rendered when `operationalPriority` is non-null. All levels visible in detail context. | -- |
| **Title** | Font-size | 15px | -- |
| | Font-weight | 500 | -- |
| | Line-height | 1.5 | -- |
| | Color | `rgba(255, 255, 255, 0.55)` | -- |
| | Margin-top | 12px | -- |
| **Category row** | Display | `flex`, `align-items: center`, `gap: 8px` | -- |
| | Icon | Lucide icon from `getCategoryIcon(category)` at 16px, colored `getCategoryColor(category)` | -- |
| | Label | `getCategoryMeta(category).displayName` uppercase, 11px, `rgba(255, 255, 255, 0.35)` | -- |
| **Separator** | Height | 1px | -- |
| | Background | `rgba(255, 255, 255, 0.04)` | -- |
| | Margin | `16px 0` | -- |
| **DetailRow label** | Font-size | 9px | -- |
| | Font-weight | 500 | -- |
| | Letter-spacing | `0.1em` | -- |
| | Text-transform | `uppercase` | -- |
| | Color | `rgba(255, 255, 255, 0.15)` | -- |
| **DetailRow value** | Font-size | `var(--text-label, 11px)` | `--text-label` |
| | Line-height | 1.5 | -- |
| | Color | `rgba(255, 255, 255, 0.30)` | -- |
| | Gap | 4px (column direction) | -- |
| **Confidence bar** | Container width | 80px | -- |
| | Container height | 6px | -- |
| | Container radius | 3px | -- |
| | Container background | `rgba(255, 255, 255, 0.06)` | -- |
| | Fill width | `${confidence}%` | -- |
| | Fill radius | 3px | -- |
| | Fill background | `getCategoryColor(category)` at 50% opacity | -- |
| | Percentage text | `${confidence}%` next to bar, 11px, `rgba(255, 255, 255, 0.30)` | -- |
| **Geo scope tags** | Display | `flex`, `flex-wrap: wrap`, `gap: 6px` | -- |
| | Tag padding | `3px 8px` | -- |
| | Tag radius | 4px | -- |
| | Tag border | `1px solid rgba(255, 255, 255, 0.06)` | -- |
| | Tag background | `rgba(255, 255, 255, 0.02)` | -- |
| | Tag font-size | `var(--text-caption, 10px)` | `--text-caption` |
| | Tag letter-spacing | `0.08em` | -- |
| | Tag text-transform | `uppercase` | -- |
| | Tag color | `rgba(255, 255, 255, 0.25)` | -- |
| **Timestamps** | Format | Relative: `relativeTimeAgo(iso)` for compact display | -- |
| | Shows "--" when `sentAt` is null | -- |
| **Priority explanation** | Rendered | When `operationalPriority` is non-null | -- |
| | Label | `getPriorityMeta(priority).shortLabel` + " -- " + `getPriorityMeta(priority).label` | -- |
| | Description | `getPriorityMeta(priority).description` in ghost text (12% opacity) | -- |
| **Action buttons** | Min-height | `var(--touch-target-comfortable, 48px)` | `--touch-target-comfortable` |
| | Display | `flex`, `align-items: center`, `gap: 10px` | -- |
| | Padding | `12px 14px` | -- |
| | Background (idle) | `rgba(255, 255, 255, 0.04)` | -- |
| | Background (active) | `rgba(255, 255, 255, 0.08)` | -- |
| | Background (disabled) | `rgba(255, 255, 255, 0.02)` | -- |
| | Border | `1px solid rgba(255, 255, 255, 0.06)` | -- |
| | Border (disabled) | `1px solid rgba(255, 255, 255, 0.03)` | -- |
| | Border-radius | 8px | -- |
| | Font-size | `var(--text-label, 11px)` | `--text-label` |
| | Font-weight | 600 | -- |
| | Letter-spacing | `0.06em` | -- |
| | Text-transform | `uppercase` | -- |
| | Color (idle) | `rgba(255, 255, 255, 0.40)` | -- |
| | Color (disabled) | `rgba(255, 255, 255, 0.15)` | -- |
| | Icon size | 14px | -- |
| | Chevron | `ChevronRight`, 12px, `rgba(255, 255, 255, 0.15)`, margin-left auto | -- |
| | Gap between buttons | 8px | -- |

**Action button definitions:**

| Button | Icon | Label | Callback | Disabled When |
|--------|------|-------|----------|---------------|
| Show on Map | `MapPin` | `SHOW ON MAP` | `onShowOnMap(alert.id)` | `canShowOnMap === false` (no marker match AND no geoScope) |
| View Category | `FolderOpen` | `VIEW ${CATEGORY_SHORT_NAME}` | `onViewCategory(alert.category)` | Never disabled |
| Share | `Share2` | `SHARE` | `onShare(alert.id)` | Never disabled |

**"Show on Map" coordinate resolution (Gap 4):**

The `canShowOnMap` prop is determined by the parent (`MobileView.tsx`) using this logic:

1. Check if `displayMarkers.some(m => m.id === selectedMapAlertId)` -- alert has a map marker with lat/lng.
2. If no marker match, check if the full `CategoryIntelItem` has `geoScope?.length > 0` and the first entry exists in `COUNTRY_CENTROIDS`.
3. If neither condition is met, `canShowOnMap = false` and the button renders disabled.

The actual fly-to logic (marker coordinates vs. country centroid) is implemented in WS-D.3's `handleShowOnMap` handler, not in this component.

**Content crossfade:** Uses `AnimatePresence mode="wait"` keyed by `alert.id`. When a different alert is selected without dismissing the sheet:
- Exit: `opacity: 0, scale: 0.97`, 200ms
- Enter: `opacity: 0 -> 1, scale: 0.97 -> 1`, 250ms, easing `[0.22, 1, 0.36, 1]`

**Loading state:** When `useCategoryIntel` has not yet returned the full item:
- Severity badge: rendered (from `selectedMapAlertBasic`)
- Priority badge: hidden (not in basic data)
- Title: rendered (from basic data)
- Category row: rendered (from `selectedMapAlertCategory`)
- Summary: shows "Loading..." in ghost text (italic, 12% opacity)
- Metadata rows: omitted (not rendered, no "--" placeholders)
- Timestamps: ingested shown (from basic data), sent omitted
- Priority explanation: omitted
- Action buttons: rendered; "View Category" uses `selectedMapAlertCategory`

**Implementation:**

```typescript
/**
 * Mobile alert detail -- full bottom sheet content for alert drill-down.
 *
 * Reads selection state from coverage.store, fetches full intel data
 * via useCategoryIntel, and renders severity/priority badges, title,
 * category row, summary, metadata rows, timestamps, priority explanation,
 * and cross-tab action buttons.
 *
 * Replaces MobileAlertDetailStub (WS-C.4 D-3).
 *
 * @module MobileAlertDetail
 * @see WS-D.2
 * @see AlertDetailPanel (desktop equivalent)
 */

'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight, FolderOpen, MapPin, Share2 } from 'lucide-react'

import { useCoverageStore } from '@/stores/coverage.store'
import { useCategoryIntel, type CategoryIntelItem } from '@/hooks/use-category-intel'
import {
  getCategoryMeta,
  getCategoryColor,
  getCategoryIcon,
  SEVERITY_COLORS,
  getPriorityMeta,
  type SeverityLevel,
} from '@/lib/interfaces/coverage'
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
import { relativeTimeAgo } from '@/lib/time-utils'
import { MOBILE_ICON_MAP } from '@/components/mobile/icon-map'

// Local helpers (avoid cross-boundary import from desktop components)

function formatTimestamp(iso: string | null): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 'var(--text-label, 11px)',
          lineHeight: 1.5,
          color: 'rgba(255, 255, 255, 0.30)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ConfidenceBar({
  confidence,
  categoryColor,
}: {
  confidence: number
  categoryColor: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 80,
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        <div
          className="confidence-bar-fill"
          style={{
            width: `${confidence}%`,
            height: '100%',
            borderRadius: 3,
            backgroundColor: categoryColor,
            opacity: 0.5,
          }}
        />
      </div>
      <span>{confidence}%</span>
    </div>
  )
}

function GeoTags({ codes }: { codes: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {codes.map((code) => (
        <span
          key={code}
          style={{
            padding: '3px 8px',
            borderRadius: 4,
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'var(--text-caption, 10px)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.25)',
          }}
        >
          {code}
        </span>
      ))}
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onTap,
  disabled = false,
}: {
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>
  label: string
  onTap: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      disabled={disabled}
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        minHeight: 'var(--touch-target-comfortable, 48px)',
        padding: '12px 14px',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 'var(--text-label, 11px)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: disabled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.40)',
        background: disabled ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid rgba(255, 255, 255, ${disabled ? '0.03' : '0.06'})`,
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',
      }}
    >
      <Icon size={14} style={{ color: 'rgba(255, 255, 255, 0.30)', flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      <ChevronRight
        size={12}
        style={{ color: 'rgba(255, 255, 255, 0.15)', flexShrink: 0, marginLeft: 'auto' }}
      />
    </button>
  )
}

// Main component

export interface MobileAlertDetailProps {
  readonly onShowOnMap: (alertId: string, coords: { lat: number; lng: number }, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void
  readonly onViewCategory: (categoryId: string) => void
  readonly onShare: (alertId: string) => void
  readonly canShowOnMap?: boolean
}

export function MobileAlertDetail({
  onShowOnMap,
  onViewCategory,
  onShare,
  canShowOnMap = true,
}: MobileAlertDetailProps) {
  const alertId = useCoverageStore((s) => s.selectedMapAlertId)
  const alertCategory = useCoverageStore((s) => s.selectedMapAlertCategory)
  const basicData = useCoverageStore((s) => s.selectedMapAlertBasic)
  const { data: intelItems } = useCategoryIntel(alertCategory)

  const richAlert = useMemo(
    () => intelItems?.find((item) => item.id === alertId) ?? null,
    [intelItems, alertId],
  )

  const alert: CategoryIntelItem | null = richAlert ?? (
    alertId && alertCategory && basicData
      ? {
          id: alertId,
          title: basicData.title,
          severity: basicData.severity,
          category: alertCategory,
          eventType: null,
          sourceKey: null,
          confidence: null,
          geoScope: null,
          shortSummary: null,
          ingestedAt: basicData.ingestedAt,
          sentAt: null,
          operationalPriority: null,
        }
      : null
  )

  const categoryMeta = alertCategory ? getCategoryMeta(alertCategory) : null
  const categoryColor = alertCategory
    ? getCategoryColor(alertCategory)
    : 'rgba(255, 255, 255, 0.2)'

  if (!alertId || !alert) return null

  const severityColor =
    SEVERITY_COLORS[alert.severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown
  const isLoading = !richAlert && !!basicData
  const priorityMeta = alert.operationalPriority
    ? getPriorityMeta(alert.operationalPriority)
    : null
  const CategoryIcon = categoryMeta
    ? (MOBILE_ICON_MAP[categoryMeta.icon] ?? null)
    : null

  return (
    <div
      style={{
        padding: '24px var(--space-card-padding, 14px) calc(var(--safe-area-bottom, 0px) + 24px)',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '5px 10px',
                borderRadius: 4,
                fontSize: 'var(--text-caption, 10px)',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: severityColor,
                backgroundColor: `color-mix(in srgb, ${severityColor} 20%, transparent)`,
                border: `1px solid color-mix(in srgb, ${severityColor} 30%, transparent)`,
              }}
            >
              {alert.severity}
            </span>
            {alert.operationalPriority && (
              <PriorityBadge priority={alert.operationalPriority} size="md" showLabel />
            )}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.5,
              color: 'rgba(255, 255, 255, 0.55)',
              margin: '12px 0 0 0',
              fontFamily: 'inherit',
            }}
          >
            {alert.title}
          </h2>

          {/* Category row with icon */}
          {categoryMeta && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              {CategoryIcon && (
                <CategoryIcon size={16} style={{ color: categoryColor, flexShrink: 0 }} />
              )}
              <span
                style={{
                  fontSize: 'var(--text-label, 11px)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.35)',
                }}
              >
                {categoryMeta.displayName}
              </span>
            </div>
          )}

          {/* Separator */}
          <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '16px 0' }} />

          {/* Summary */}
          {alert.shortSummary ? (
            <>
              <DetailRow label="Summary">
                <p style={{ color: 'rgba(255, 255, 255, 0.35)', margin: 0, lineHeight: 1.6 }}>
                  {alert.shortSummary}
                </p>
              </DetailRow>
              <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '16px 0' }} />
            </>
          ) : isLoading ? (
            <>
              <DetailRow label="Summary">
                <span style={{ color: 'rgba(255, 255, 255, 0.12)', fontStyle: 'italic' }}>
                  Loading...
                </span>
              </DetailRow>
              <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '16px 0' }} />
            </>
          ) : null}

          {/* Metadata rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alert.eventType && (
              <DetailRow label="Event Type">
                <span style={{ textTransform: 'capitalize' }}>{alert.eventType}</span>
              </DetailRow>
            )}
            {alert.sourceKey && (
              <DetailRow label="Source">{alert.sourceKey}</DetailRow>
            )}
            {alert.confidence != null && (
              <DetailRow label="Confidence">
                <ConfidenceBar confidence={alert.confidence} categoryColor={categoryColor} />
              </DetailRow>
            )}
            {alert.geoScope && alert.geoScope.length > 0 && (
              <DetailRow label="Geographic Scope">
                <GeoTags codes={alert.geoScope} />
              </DetailRow>
            )}
          </div>

          {/* Separator */}
          <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '16px 0' }} />

          {/* Timestamps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <DetailRow label="Ingested">
              {relativeTimeAgo(alert.ingestedAt)}
              <span style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.12)', fontSize: 9 }}>
                {formatTimestamp(alert.ingestedAt)}
              </span>
            </DetailRow>
            <DetailRow label="Sent">
              {alert.sentAt ? relativeTimeAgo(alert.sentAt) : '--'}
              {alert.sentAt && (
                <span style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.12)', fontSize: 9 }}>
                  {formatTimestamp(alert.sentAt)}
                </span>
              )}
            </DetailRow>
          </div>

          {/* Priority explanation */}
          {priorityMeta && (
            <>
              <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '16px 0' }} />
              <DetailRow label="Operational Priority">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>
                    {priorityMeta.shortLabel} -- {priorityMeta.label}
                  </span>
                  {priorityMeta.description && (
                    <span style={{ color: 'rgba(255, 255, 255, 0.12)', fontSize: 9 }}>
                      {priorityMeta.description}
                    </span>
                  )}
                </div>
              </DetailRow>
            </>
          )}

          {/* Separator */}
          <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '16px 0' }} />

          {/* Cross-tab action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ActionButton
              icon={MapPin}
              label="Show on Map"
              onTap={() => onShowOnMap(alert.id)}
              disabled={!canShowOnMap}
            />
            <ActionButton
              icon={FolderOpen}
              label={`View ${categoryMeta?.shortName ?? 'Category'}`}
              onTap={() => onViewCategory(alert.category)}
            />
            <ActionButton
              icon={Share2}
              label="Share"
              onTap={() => onShare(alert.id)}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

**Note on `MOBILE_ICON_MAP`:** This import references a shared icon lookup map for Lucide icons used in mobile components (same pattern established in WS-D.1 for the category detail header). If WS-D.1 has not yet delivered this map, it should be created as a simple `Record<string, LucideIcon>` mapping the `icon` field from `CategoryMeta` to the corresponding Lucide component. Example: `{ activity: Activity, mountain: Mountain, cloud: Cloud, ... }`.

---

### D-3: `COUNTRY_CENTROIDS` static map (`src/lib/country-centroids.ts`)

Static TypeScript file exporting a lookup map of ISO 3166-1 alpha-2 country codes to geographic centroid coordinates. Used by the "Show on Map" fallback when an alert has no `MapMarker` match but has `geoScope` entries. Per Gap 4 in `combined-recommendations.md`.

```typescript
/**
 * Static country centroid lookup table for "Show on Map" fallback.
 *
 * When an alert has no direct map marker (no lat/lng from GeoJSON),
 * the "Show on Map" action falls back to flying to the centroid
 * of the first country in the alert's geoScope array.
 *
 * ~200 entries, ~3KB gzipped. No API call needed.
 *
 * @module country-centroids
 * @see WS-D.2 (consumer)
 * @see combined-recommendations.md Gap 4
 */

export interface CountryCentroid {
  /** Latitude of the country's geographic centroid. */
  lat: number
  /** Longitude of the country's geographic centroid. */
  lng: number
}

/**
 * ISO 3166-1 alpha-2 country codes mapped to geographic centroids.
 * Centroids are approximate geometric centers, not capital cities.
 */
export const COUNTRY_CENTROIDS: Readonly<Record<string, CountryCentroid>> = {
  AF: { lat: 33.94, lng: 67.71 },
  AL: { lat: 41.15, lng: 20.17 },
  DZ: { lat: 28.03, lng: 1.66 },
  // ... ~200 entries total
  AU: { lat: -25.27, lng: 133.78 },
  PG: { lat: -6.31, lng: 143.96 },
  SB: { lat: -9.43, lng: 160.02 },
  NZ: { lat: -40.90, lng: 174.89 },
  US: { lat: 37.09, lng: -95.71 },
  GB: { lat: 55.38, lng: -3.44 },
  // Full list of ~200 entries
} as const

/**
 * Look up the geographic centroid for an ISO country code.
 * Returns null for unknown codes.
 */
export function getCountryCentroid(countryCode: string): CountryCentroid | null {
  return COUNTRY_CENTROIDS[countryCode.toUpperCase()] ?? null
}

/**
 * Determine if an alert can be shown on the map, given its geoScope.
 * Returns the first resolvable centroid, or null if no geoScope
 * entries have known centroids.
 */
export function resolveAlertCentroid(
  geoScope: string[] | null,
): CountryCentroid | null {
  if (!geoScope || geoScope.length === 0) return null
  for (const code of geoScope) {
    const centroid = getCountryCentroid(code)
    if (centroid) return centroid
  }
  return null
}
```

**File size:** The complete file with ~200 entries is approximately 8KB source / 3KB gzipped. Tree-shakeable -- only imported by the mobile view.

**Usage in `MobileView.tsx` (WS-D.3 wires this):**

```typescript
import { resolveAlertCentroid } from '@/lib/country-centroids'

// Determine if "Show on Map" should be enabled
const canShowSelectedAlertOnMap = useMemo(() => {
  if (!selectedMapAlertId) return false
  // Check 1: Does the alert have a map marker with coordinates?
  if (displayMarkers.some((m) => m.id === selectedMapAlertId)) return true
  // Check 2: Does the alert have a geoScope with a known centroid?
  const fullItem = intelItems?.find((i) => i.id === selectedMapAlertId)
  if (fullItem && resolveAlertCentroid(fullItem.geoScope)) return true
  return false
}, [selectedMapAlertId, displayMarkers, intelItems])
```

---

### D-4: `MobileAlertDetailStub` replacement in `MobileView.tsx`

Replace the `MobileAlertDetailStub` import and usage with `MobileAlertDetail`. The stub was delivered by WS-C.4 D-3 as a temporary placeholder.

**Before (WS-C.4):**

```typescript
import { MobileAlertDetailStub } from '@/components/mobile/MobileAlertDetailStub'

<MobileBottomSheet
  config={SHEET_CONFIGS.alertDetail}
  isOpen={!!selectedMapAlertId}
  onDismiss={handleCloseMapAlert}
  ariaLabel="Alert detail"
>
  <MobileAlertDetailStub />
</MobileBottomSheet>
```

**After (WS-D.2):**

```typescript
import { MobileAlertDetail } from '@/components/mobile/MobileAlertDetail'

<MobileBottomSheet
  config={SHEET_CONFIGS.alertDetail}
  isOpen={!!selectedMapAlertId}
  onDismiss={handleCloseMapAlert}
  ariaLabel="Alert detail"
>
  <MobileAlertDetail
    onShowOnMap={handleShowOnMap}
    onViewCategory={handleViewCategory}
    onShare={handleShare}
    canShowOnMap={canShowSelectedAlertOnMap}
  />
</MobileBottomSheet>
```

**Placeholder handlers in `MobileView.tsx` (WS-D.3 replaces these with real navigation):**

```typescript
// Placeholder handlers -- WS-D.3 implements the actual navigation/clipboard logic
const handleShowOnMap = useCallback((alertId: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[WS-D.2] Show on Map tapped:', alertId)
  }
}, [])

const handleViewCategory = useCallback((categoryId: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[WS-D.2] View Category tapped:', categoryId)
  }
}, [])

const handleShare = useCallback((alertId: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[WS-D.2] Share tapped:', alertId)
  }
}, [])

// Determine if the selected alert can be shown on the map
const canShowSelectedAlertOnMap = useMemo(() => {
  if (!selectedMapAlertId) return false
  if (displayMarkers.some((m) => m.id === selectedMapAlertId)) return true
  // Centroid fallback check deferred to when full intel data is available
  return false
}, [selectedMapAlertId, displayMarkers])
```

**Cleanup:** After replacement, delete `src/components/mobile/MobileAlertDetailStub.tsx`. Verify zero remaining imports via `grep -r "MobileAlertDetailStub" src/`.

---

### D-5: CSS file (`src/styles/mobile-alert.css`)

Dedicated CSS file for WS-D.2 mobile alert components. Imported by both `MobileAlertCard.tsx` and `MobileAlertDetail.tsx`.

```css
/* WS-D.2: Alert Detail + Card -- mobile-only component styles.
   Imported by MobileAlertCard.tsx and MobileAlertDetail.tsx.
   All styles scoped to mobile viewport or gated by component classes. */

/* ============================================================
   MOBILE SCOPED STYLES
   ============================================================ */

@media (max-width: 767px) {
  /* Alert card active/pressed state (CSS fallback for non-motion) */
  .mobile-alert-card:active {
    background: rgba(255, 255, 255, 0.06);
  }

  /* Alert detail action buttons active state */
  .alert-detail-action:active {
    background: rgba(255, 255, 255, 0.08) !important;
  }

  /* Geo tag horizontal scroll for many tags */
  .geo-tags-overflow {
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .geo-tags-overflow::-webkit-scrollbar {
    display: none;
  }

  /* Confidence bar fill transition */
  .confidence-bar-fill {
    transition: width 300ms ease;
  }
}

/* ============================================================
   REDUCED MOTION
   ============================================================ */

@media (prefers-reduced-motion: reduce) {
  .mobile-alert-card {
    transition: none !important;
  }

  .confidence-bar-fill {
    transition: none !important;
  }
}
```

---

### D-6: Unit tests

**`src/components/mobile/__tests__/MobileAlertCard.test.tsx`:**

| Test | Description |
|------|-------------|
| `renders severity dot with correct color` | Pass item with `severity: 'Extreme'`. Assert: dot element `backgroundColor` matches `SEVERITY_COLORS.Extreme`. |
| `renders title, truncated for long text` | Pass item with 200-char title. Assert: title text present, element has `overflow: hidden` and `textOverflow: ellipsis`. |
| `renders category short name` | Pass item with `category: 'seismic'`. Assert: text "SEIS" visible. |
| `renders relative timestamp` | Pass item with `ingestedAt` 5 minutes ago. Assert: text "5m" present. |
| `renders PriorityBadge for P1 item` | Pass item with `operationalPriority: 'P1'`. Assert: PriorityBadge rendered in DOM. |
| `does not render PriorityBadge for P3 item` | Pass item with `operationalPriority: 'P3'`. Assert: no PriorityBadge (P3 hidden in list context). |
| `calls onTap with item when tapped` | Click the card. Assert: `onTap` called once with the full `CategoryIntelItem`. |
| `applies selected background when isSelected=true` | Pass `isSelected: true`. Assert: background is `rgba(255, 255, 255, 0.06)`. |
| `renders chevron disclosure indicator` | Assert: `ChevronRight` icon present in DOM. |
| `provides accessible aria-label` | Assert: `aria-label` attribute contains severity, title, and category short name. |

**`src/components/mobile/__tests__/MobileAlertDetail.test.tsx`:**

| Test | Description |
|------|-------------|
| `renders severity badge with correct color` | Mock store with `severity: 'Severe'`. Mock `useCategoryIntel` returning full item. Assert: badge text "Severe", badge colored per `SEVERITY_COLORS.Severe`. |
| `renders priority badge when operationalPriority is present` | Mock item with `operationalPriority: 'P1'`. Assert: PriorityBadge rendered with `size="md"` and `showLabel`. |
| `renders title from full intel item` | Assert: title text matches `CategoryIntelItem.title`. |
| `renders category row with icon and display name` | Mock item with `category: 'seismic'`. Assert: "SEISMIC" text visible. |
| `renders summary text when available` | Mock item with `shortSummary`. Assert: summary paragraph contains the text. |
| `renders event type, source, confidence, and geo scope rows` | Mock item with all metadata fields populated. Assert: all four DetailRow labels present. |
| `renders confidence bar at correct width` | Mock item with `confidence: 72`. Assert: bar fill element `width` is `72%`. |
| `renders geographic scope tags` | Mock item with `geoScope: ['PG', 'AU', 'SB']`. Assert: three tag elements with correct uppercase text. |
| `renders relative timestamps` | Mock item with known `ingestedAt` and `sentAt`. Assert: `relativeTimeAgo` output present for both. |
| `renders priority explanation with label and description` | Mock item with `operationalPriority: 'P1'`. Assert: "P1 -- Critical" text and description text from `PRIORITY_META.P1.description` visible. |
| `shows loading state when full data not yet available` | Mock store with basic data only, `useCategoryIntel` returning undefined. Assert: "Loading..." text visible in summary area. Metadata rows absent. |
| `hides metadata rows when fields are null` | Mock item with `eventType: null`, `sourceKey: null`, `confidence: null`, `geoScope: null`. Assert: no DetailRow labels for those fields. |
| `fires onShowOnMap with alertId` | Click "Show on Map" button. Assert: `onShowOnMap` called with `alert.id`. |
| `fires onViewCategory with correct categoryId` | Click "View Category" button. Assert: `onViewCategory` called with `alert.category`. |
| `fires onShare with alertId` | Click "Share" button. Assert: `onShare` called with `alert.id`. |
| `disables Show on Map when canShowOnMap=false` | Pass `canShowOnMap: false`. Assert: button has `disabled` attribute, does not fire callback on click. |
| `returns null when no alert is selected` | Mock store with `selectedMapAlertId: null`. Assert: component renders nothing. |
| `crossfades content when alert changes` | Set store to alert A, then change to alert B. Assert: `AnimatePresence` exit and enter occur (motion.div key changes). |

**`src/lib/__tests__/country-centroids.test.ts`:**

| Test | Description |
|------|-------------|
| `getCountryCentroid returns centroid for known code` | Assert: `getCountryCentroid('US')` returns `{ lat: 37.09, lng: -95.71 }`. |
| `getCountryCentroid returns null for unknown code` | Assert: `getCountryCentroid('XX')` returns `null`. |
| `getCountryCentroid is case-insensitive` | Assert: `getCountryCentroid('us')` equals `getCountryCentroid('US')`. |
| `resolveAlertCentroid returns first known centroid` | Assert: `resolveAlertCentroid(['XX', 'PG', 'AU'])` returns `COUNTRY_CENTROIDS['PG']`. |
| `resolveAlertCentroid returns null for null geoScope` | Assert: `resolveAlertCentroid(null)` returns `null`. |
| `resolveAlertCentroid returns null for empty geoScope` | Assert: `resolveAlertCentroid([])` returns `null`. |
| `resolveAlertCentroid returns null when no codes match` | Assert: `resolveAlertCentroid(['XX', 'YY'])` returns `null`. |

**Test setup notes:**
- Use `@testing-library/react` with a Zustand test wrapper providing fresh store state per test.
- Reset store between tests: `useCoverageStore.setState({ selectedMapAlertId: null, selectedMapAlertCategory: null, selectedMapAlertBasic: null })`.
- Mock `useCategoryIntel` via `vi.mock('@/hooks/use-category-intel')`.
- Mock `motion/react` to render plain elements (avoid animation timing in tests).

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `MobileAlertCard` renders at 64px min-height with severity dot, title, category tag, relative timestamp, priority badge (P1/P2), and chevron. | Visual inspection at 375x812 viewport. All six elements present. |
| AC-2 | Severity dot is 8px colored circle using `SEVERITY_COLORS[severity]`. Verify all 5 levels: Extreme (red), Severe (orange), Moderate (yellow), Minor (blue), Unknown (gray). | Render cards with each severity. Compare dot colors to `SEVERITY_COLORS` values. |
| AC-3 | Category tag shows `getCategoryMeta(category).shortName` uppercase (e.g., "SEIS", "WX", "CON"). | Visual inspection with 3+ categories. |
| AC-4 | Relative timestamp uses compact format from `relativeTimeAgo()` (e.g., "5m", "3h", "2d"). | Render card with known `ingestedAt`. Verify format. |
| AC-5 | Tapping `MobileAlertCard` calls `onTap` with the full `CategoryIntelItem` object. | Tap card. Verify callback argument. |
| AC-6 | `PriorityBadge` renders for P1/P2. Does NOT render for P3/P4 in list context. | Render cards with P1, P2, P3, P4. Verify presence/absence. |
| AC-7 | `MobileAlertCard` has accessible `aria-label` containing severity, title, and category short name. | Inspect `aria-label` attribute. |
| AC-8 | Card press feedback: `scale(0.98)` on tap, 100ms. Disabled under `prefers-reduced-motion: reduce`. | Tap card on device. Enable reduced motion: verify no animation. |
| AC-9 | `MobileAlertDetail` renders severity badge, title, and category row immediately from basic store data (before full data loads). Summary shows "Loading...". | Clear TanStack Query cache. Tap marker. Verify instant render. |
| AC-10 | `MobileAlertDetail` upgrades to full data when `useCategoryIntel` returns: summary, event type, source, confidence bar, geo scope tags, sent timestamp, and priority explanation all populate. | Wait for data load after AC-9. Verify all fields. |
| AC-11 | Severity badge uses `SEVERITY_COLORS`: tinted background + colored border + colored text. | Visual inspection for Extreme and Minor alerts. |
| AC-12 | Priority badge uses achromatic display per AD-1 (shape + weight, no color). | Verify P1 shows diamond + bold. No color on badge. |
| AC-13 | Category row shows Lucide icon in category color + display name uppercase. | Render for "seismic". Verify Activity icon + "SEISMIC" label. |
| AC-14 | Confidence bar renders at correct percentage width with `{N}%` text. | Mock `confidence: 72`. Verify bar ~72% width. Verify "72%" text. |
| AC-15 | Geographic scope tags render as individual chips. Each uppercase with country code. | Mock `geoScope: ['PG', 'AU', 'SB']`. Verify 3 tag elements. |
| AC-16 | Timestamps show relative format with absolute time in ghost text. "--" for null `sentAt`. | Verify both formats present. Verify "--" for null. |
| AC-17 | Priority explanation row shows `shortLabel -- label` and description text from `PRIORITY_META`. | Mock P1 alert. Verify "P1 -- Critical" and description text. |
| AC-18 | "Show on Map" button renders with `MapPin` icon. Fires `onShowOnMap(alertId)`. Disabled when `canShowOnMap=false`. | Tap with enabled: verify callback. Render disabled: verify `disabled` attribute and dimmed style. |
| AC-19 | "View Category" button renders with `FolderOpen` icon and category short name (e.g., "VIEW SEIS"). Fires `onViewCategory(categoryId)`. | Tap button. Verify callback fires with correct category ID. |
| AC-20 | "Share" button renders with `Share2` icon. Fires `onShare(alertId)`. | Tap button. Verify callback fires with alert ID. |
| AC-21 | All action buttons meet 48px min-height (`--touch-target-comfortable`). | Inspect computed `min-height` on each button. |
| AC-22 | Content crossfades when a different alert is selected without dismissing the sheet. | Tap marker A. Tap marker B. Verify smooth crossfade. |
| AC-23 | `MobileAlertDetailStub` is replaced by `MobileAlertDetail` in `MobileView.tsx`. Zero imports of stub remain. | `grep -r "MobileAlertDetailStub" src/` returns no results. |
| AC-24 | `COUNTRY_CENTROIDS` exports a record with ~200 entries. `getCountryCentroid('US')` returns valid coordinates. `resolveAlertCentroid` works for arrays with mixed known/unknown codes. | Unit tests pass. |
| AC-25 | `pnpm typecheck` passes with zero errors after all deliverables. | Run `pnpm typecheck`. |
| AC-26 | Desktop view is unaffected. `AlertDetailPanel`, `DistrictViewDock`, `CategoryDetailScene` render identically. | Visual comparison at 1920x1080. |
| AC-27 | All unit tests for `MobileAlertCard`, `MobileAlertDetail`, and `country-centroids` pass. | `pnpm test:unit`. |
| AC-28 | Metadata rows with null/empty values are not rendered (no empty rows in DOM, except "Loading..." during loading). | Mock alert with all nullable fields null. Verify those rows absent. |
| AC-29 | Sheet opens at 70% snap point per `SHEET_CONFIGS.alertDetail`. Can drag to 100% or dismiss. | Open alert detail sheet. Verify initial ~70% position. Drag to verify snap points. |

---

## 6. Architectural Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-1 | `MobileAlertCard` is a pure presentation component (props-driven); `MobileAlertDetail` is a data-fetching component (reads from store + `useCategoryIntel`). | Different contexts require different patterns. `MobileAlertCard` appears in three list contexts (D.1, E.1, E.2) where the parent already has data. Props enable clean reuse. `MobileAlertDetail` always renders for the single globally-selected alert from `coverage.store`, making store subscription the natural pattern. Matches the desktop split: `AlertList` (pure) vs. `AlertDetailPanel` (data-fetching). |
| AD-2 | Severity dot on `MobileAlertCard` uses `SEVERITY_COLORS[severity]` not category color. | Codebase convention: `MapPopup` (line 88-94), `AlertList` in `CategoryDetailScene` (lines 350-356), and `AlertDetailPanel` (lines 90-91) all use severity color for indicator dots. Category identity is communicated by the separate category short name tag. Using category color for the dot would break visual consistency. |
| AD-3 | Cross-tab action handlers are placeholder stubs; WS-D.3 implements actual navigation. | This WS delivers UI components and prop interfaces. Navigation logic (tab switching, morph triggering, map fly-to, clipboard copy) requires integration with tab state, morph choreography, and map refs -- best coordinated in WS-D.3. Defining typed signatures here ensures API compatibility. |
| AD-4 | "Show on Map" is disabled (not hidden) when no coordinates available. | Disabling maintains layout stability (three buttons always visible) and communicates the action exists but is unavailable. Hiding would cause layout shift. Disabled state uses dimmed colors consistent with the Oblivion aesthetic. |
| AD-5 | `formatTimestamp` is a local helper in `MobileAlertDetail.tsx`, not imported from desktop components. | Importing from `AlertDetailPanel.tsx` or `CategoryDetailScene.tsx` would create a dependency from a mobile component to a desktop component, risking bundle contamination via tree-shaking failure. The function is 8 lines. If a fourth consumer emerges, extract to `src/lib/time-utils.ts`. |
| AD-6 | `COUNTRY_CENTROIDS` is a static TypeScript map, not fetched from an API. | ~200 entries at ~3KB gzipped is negligible. Static eliminates API latency, offline concerns, and rate limiting. The data changes rarely (national borders). Tree-shakeable -- only included in the mobile bundle when imported. |
| AD-7 | `MobileAlertCard` uses `relativeTimeAgo()` from `time-utils.ts` (compact: "5m") instead of `formatRelativeTime()` from `map-utils.ts` (verbose: "5m ago"). | Compact format saves ~20px horizontal space on the 64px card row. The "ago" suffix is implicit in a list where all items have timestamps. |
| AD-8 | Action buttons are "Show on Map", "View Category", "Share" -- no "Expand Full Screen" button. | The three actions match the primary user intents from an alert context: locate geographically, explore category context, and share with a colleague. Fullscreen expand is a sheet-level affordance (WS-C.2 provides it in the sheet header), not an alert-level action. |
| AD-9 | Timestamps in `MobileAlertDetail` show both relative and absolute time. | Relative time ("5m") provides quick recency assessment. Absolute time ("Mar 6, 2026, 2:23 PM EST") provides precise reference needed by security analysts for incident correlation. Both are shown, with absolute in ghost text to maintain visual hierarchy. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | `formatTimestamp` is duplicated in `AlertDetailPanel.tsx`, `CategoryDetailScene.tsx`, `district-view-dock.tsx`, and now `MobileAlertDetail.tsx`. Should it be extracted to `src/lib/time-utils.ts` during Phase F cleanup? | planning-coordinator | Phase F |
| OQ-2 | Should `MobileAlertCard` support a long-press gesture for secondary actions (copy alert ID, share, quick-filter to category)? Current spec defines tap only. | world-class-ux-designer | Phase F |
| OQ-3 | When the user taps "View Category" from an alert detail opened via the Intel tab (not from a category context), should it open the category detail sheet over the Intel tab or switch to Situation tab first? | information-architect | Phase E (WS-E.3) |
| OQ-4 | The `MOBILE_ICON_MAP` used for the category row icon may be delivered by WS-D.1. If WS-D.1 has not created this map, this WS must create it. Confirm ownership. | planning-coordinator | Phase D |

---

## 8. Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R-1 | `useCategoryIntel(category)` returns up to 200 items; `.find()` by alert ID is O(n). Rapid marker taps could cause multiple lookups per render. | Array capped at 200. `.find()` on 200 objects is sub-millisecond. If profiling reveals jank, convert to `Map<string, CategoryIntelItem>` in a `useMemo`. |
| R-2 | Basic-to-rich data upgrade causes a visible content "pop" as metadata rows appear. | Loading state shows "Loading..." for summary and omits metadata (no "--" placeholders). `AnimatePresence` crossfade smooths the transition. If testing reveals jarring shift, add skeleton shimmer rows during loading. |
| R-3 | `MobileAlertCard` in long lists (50+ items) with `motion.button` may cause excessive DOM overhead. | Parent list (WS-D.1, WS-E.1) should virtualize at >50 items. Card is memoized. If performance issues arise, replace `motion.button` with plain `<button>` + CSS `:active` for press feedback. |
| R-4 | `color-mix(in srgb, ...)` CSS function unsupported on pre-Chrome 111 / pre-Safari 16.2 browsers. | Target browsers are modern. If legacy fallback needed, replace with pre-computed rgba values using hardcoded severity/category color constants. |
| R-5 | WS-C.1 delays `MobileBottomSheet` delivery, blocking integration testing of `MobileAlertDetail` inside the sheet. | Develop `MobileAlertDetail` as a standalone component testable outside the sheet. Create a temporary test harness page that renders the detail directly. Unit tests mock store and hooks -- no sheet dependency. |
| R-6 | The `COUNTRY_CENTROIDS` map may have inaccurate centroid coordinates for some countries, causing "Show on Map" to fly to unexpected locations. | Centroids are approximate geometric centers -- adequate for country-level context. Users will see the country area on the map even if the pin is slightly off-center. Coordinates can be refined post-launch. |
| R-7 | `MobileAlertCard` is consumed by three downstream workstreams (D.1, E.1, E.2). A breaking prop change would require updates in all three. | Prop interface is minimal and stable: `item` (existing type), `onTap` (callback), `isSelected` (boolean). No additional props anticipated. If needed, coordinate across all consumers in a single PR. |
| R-8 | The "Share" deep link URL format is not yet defined. WS-D.3 will implement the handler but needs a URL schema. | Define URL schema in WS-D.3 using existing URL sync patterns: `${origin}?alert=${alertId}&category=${category}`. This WS only fires the callback; URL construction is WS-D.3's responsibility. |

---

## Appendix A: File Inventory

| File | Action | Description |
|------|--------|-------------|
| `src/components/mobile/MobileAlertCard.tsx` | Create | 64px touch-target list item component |
| `src/components/mobile/MobileAlertDetail.tsx` | Create | Full alert detail bottom sheet content |
| `src/lib/country-centroids.ts` | Create | Static ISO country code -> centroid lookup (~200 entries) |
| `src/styles/mobile-alert.css` | Create | Card press, confidence bar, geo tag overflow, reduced motion styles |
| `src/components/mobile/__tests__/MobileAlertCard.test.tsx` | Create | Unit tests for card component |
| `src/components/mobile/__tests__/MobileAlertDetail.test.tsx` | Create | Unit tests for detail component |
| `src/lib/__tests__/country-centroids.test.ts` | Create | Unit tests for centroid lookup functions |
| `src/views/MobileView.tsx` | Modify | Replace `MobileAlertDetailStub` import with `MobileAlertDetail`, add handler stubs and `canShowOnMap` memo |
| `src/components/mobile/MobileAlertDetailStub.tsx` | Delete | Replaced by `MobileAlertDetail` |
