# WS-D.1: Category Detail

> **Workstream ID:** WS-D.1
> **Phase:** D -- Category + Alert Detail
> **Assigned Agent:** `information-architect`
> **Size:** L
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-C.1 (MobileBottomSheet component, `SHEET_CONFIGS.categoryDetail`, `BottomSheetConfig` type, sheet spring config, portal rendering, drag/snap system, scroll-vs-drag conflict resolution), WS-C.2 (fullscreen expand mode, `useSheetHistory` hook for popstate back-button dismissal, `useSheetFocusTrap` for keyboard focus management, `aria-modal` support, landscape height constraint), WS-B.2 (MobileCategoryCard tap triggers `startMorph(categoryId, { fast: true })` which opens this detail), WS-A.3 (glass tokens `--glass-card-bg`, `--glass-card-blur`, `--glass-card-border`; severity tokens `--severity-extreme` through `--severity-unknown`; typography tokens `--font-mono`, `--text-xs`, `--text-sm`; spacing tokens `--space-2` through `--space-5`; touch target tokens `--touch-target-min: 44px`, `--touch-target-comfortable: 48px`; animation timing tokens `--duration-transition`, `--ease-morph`)
> **Blocks:** WS-D.3 (Morph + Navigation wires category card tap to this detail view, coordinates morph phase transitions and back-button popstate with sheet open/dismiss lifecycle)
> **Resolves:** Gap 3 (Category detail is bottom sheet with internal back button -- confirmed by OVERVIEW Section 4.4)

---

> **Review Fixes Applied (Phase D Review):**
>
> - **H-1 (prop name mismatch):** Changed `alert={item}` to `item={item}` in `MobileAlertCard` rendering (Section F alert list).
> - **H-2 (callback signature):** Wrapped `onTap` callback: `onTap={(item) => onAlertTap(item.id)}` since D.2 passes `CategoryIntelItem` not `string`.
> - **H-5 (dependency table):** Updated Section 3 WS-D.2 row to match D.2's actual interface: `item: CategoryIntelItem`, `onTap: (item: CategoryIntelItem) => void`.
> - **M-1 (icon-map location):** `MOBILE_ICON_MAP` extracted to `src/components/mobile/icon-map.ts` (removed ambiguity, matches D.2's import path).

---

## 1. Objective

Build `MobileCategoryDetail`, the bottom sheet content component that displays the full detail view for a single intel category on mobile. When an analyst taps a category card on the Situation tab, a bottom sheet opens with this component as its content, presenting the category header, summary metrics, severity breakdown, a sortable and filterable alert list, a List/Map segmented toggle, and an expandable source health accordion.

This component is the mobile equivalent of the desktop `CategoryDetailScene` (two-column layout with alert list, severity breakdown, coverage map, and source health table). On mobile, the two-column layout is collapsed into a single-column vertical stack, organized across three progressive disclosure tiers mapped to the sheet's three snap points (35% / 65% / 100%).

The component wires three existing TanStack Query hooks (`useCategoryIntel`, `useCoverageMapData`, `useCoverageMetrics`) and integrates the shared `MobileStateView` component for loading, error, and empty states. It uses `MobileAlertCard` components (WS-D.2) for individual alert rows in the list view, and a dynamically-imported `CoverageMap` for the map view.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **`MobileCategoryDetail` component** | Single-column bottom sheet content with header, summary strip, severity bar, List/Map toggle, alert list, and source health accordion. |
| **Progressive disclosure by snap point** | Content visibility gates by current sheet snap: 35% = summary only, 65% = summary + alert list, 100% = full content with source health. |
| **Segmented control (List/Map toggle)** | Two-segment control switching between alert list view and filtered category map view. Local state, not stored in Zustand. |
| **Alert list with sort and filter** | Sort by severity (default) or time. Priority filter pills (P1/P2/P3/P4) with 44px+ touch targets. Uses `MobileAlertCard` from WS-D.2. |
| **Category map view** | Dynamically imported `CoverageMap` filtered to single category. Shows severity-colored markers. Marker tap opens alert detail (WS-D.2). |
| **Source health accordion** | Expandable section showing intel sources for this category: name, status dot, region, update frequency. Collapsed by default. |
| **`MobileStateView` integration** | Loading skeleton, error card with retry, and empty state for all data-dependent sections. |
| **CSS file** | `src/styles/mobile-category-detail.css` for component-specific styles using design tokens from WS-A.3. |
| **Unit tests** | Vitest component tests for rendering states, snap-point content gating, segmented control toggle, sort/filter behavior, and accordion expand/collapse. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileBottomSheet` container (drag, snap, spring physics, glass background, portal) | WS-C.1 scope. This WS provides content rendered inside the sheet. |
| Fullscreen expand/collapse, `useSheetHistory`, `useSheetFocusTrap`, `aria-modal` | WS-C.2 scope. This WS consumes those capabilities via the sheet container. |
| Morph phase transitions (`startMorph`, `reverseMorph`, `resetMorph`) | WS-D.3 scope. This WS provides the content; D.3 wires the morph lifecycle. |
| `MobileAlertCard` component | WS-D.2 scope. This WS imports and renders it in the alert list. |
| `MobileAlertDetail` component and nested alert detail sheet | WS-D.2 scope. This WS calls `onAlertTap(id)` which D.3 wires to the alert detail sheet. |
| Map marker click handling wiring to alert detail | WS-D.3 scope. This WS exposes `onMarkerClick` prop. |
| Landscape layout variant | WS-F.1 scope. This WS delivers portrait layout only. |
| Pull-to-refresh inside sheet | WS-F.5 scope. |
| Haptic feedback on sort/filter toggle | WS-F.4 scope. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-C.1 `MobileBottomSheet` | Sheet container with `isOpen`, `onDismiss`, `config` props. Renders children inside scrollable area. Exposes `currentSnap` via context or callback. | Pending (WS-C.1) |
| WS-C.1 `SHEET_CONFIGS.categoryDetail` | `{ id: 'category-detail', snapPoints: [35, 65, 100], initialSnapIndex: 1, dismissible: true }` | Pending (WS-C.1) |
| WS-C.2 `useSheetHistory` | Hook for popstate back-button integration. Consumed by the sheet container, not directly by this component. | Pending (WS-C.2) |
| WS-C.2 fullscreen mode | Expand button in sheet header. Consumed by the sheet container via `headerActions` slot. | Pending (WS-C.2) |
| WS-A.3 design tokens | Glass, severity, typography, spacing, touch target, and animation tokens in `src/styles/mobile-tokens.css` | Pending (WS-A.3) |
| WS-B.2 `MobileCategoryCard` | Card tap triggers `startMorph(categoryId, { fast: true })`. This WS does not own the trigger -- it provides the content. | Pending (WS-B.2) |
| WS-D.2 `MobileAlertCard` | Alert card component for list rows. Props: `item: CategoryIntelItem`, `onTap: (item: CategoryIntelItem) => void`, `isSelected?: boolean`. | Pending (WS-D.2) |
| WS-A.2 `MobileStateView` | Shared loading/error/empty state component. Props: `query: UseQueryResult`, `skeletonComponent?`, `emptyTitle?`, `emptyMessage?`, `retryLabel?`. | Pending (WS-A.2) |
| `src/hooks/use-category-intel.ts` | `useCategoryIntel(categoryId)` returning `UseQueryResult<CategoryIntelItem[]>`. queryKey: `['intel', 'category', categoryId]`. 45s refetch. | EXISTS (lines 106-115) |
| `src/hooks/use-coverage-map-data.ts` | `useCoverageMapData(filters?)` returning `UseQueryResult<MapMarker[]>`. Accepts `{ categories: [categoryId] }`. 30s refetch. | EXISTS (lines 126-134) |
| `src/hooks/use-coverage-metrics.ts` | `useCoverageMetrics()` returning `UseQueryResult<CoverageMetrics>`. 60s refetch. Already cached by the Situation tab. | EXISTS (lines 135-143) |
| `src/lib/interfaces/coverage.ts` | `getCategoryMeta(id)`, `getCategoryColor(id)`, `getCategoryIcon(id)`, `SEVERITY_LEVELS`, `SEVERITY_COLORS`, `PRIORITY_LEVELS`, `PRIORITY_META`, `isPriorityVisible()`, `OperationalPriority`, `SeverityLevel`, `CategoryMeta` | EXISTS (full file) |
| `src/lib/coverage-utils.ts` | `MapMarker`, `CoverageByCategory`, `CoverageMetrics`, `SourceCoverage` types | EXISTS |
| `src/stores/coverage.store.ts` | `selectedPriorities`, `togglePriority()`, `clearPriorities()`, `syncPrioritiesToUrl()` | EXISTS (lines 246-261, 437-448) |
| `src/components/coverage/CoverageMap.tsx` | Shared map component. Loaded via `next/dynamic` with `ssr: false`. | EXISTS |
| `src/components/coverage/PriorityBadge.tsx` | Badge component for P1/P2 indicators on alert cards. | EXISTS |
| `lucide-react` | Icons: `ArrowLeft` (back), `List`, `Map`, `ChevronDown`, `ChevronUp`, `TrendingUp`, `TrendingDown`, `Minus`, and all 15 category icons. | Available |
| `motion/react` | `AnimatePresence`, `motion.div` for view toggle animation. | Available |

---

## 4. Deliverables

### D-1: `MobileCategoryDetail` component (`src/components/mobile/MobileCategoryDetail.tsx`)

The primary deliverable. A single React component that receives a `categoryId` and renders the full category detail view inside the bottom sheet scroll area.

**Props interface:**

```typescript
/**
 * MobileCategoryDetail -- bottom sheet content for a single intel category.
 *
 * Renders a vertical stack: header, summary strip, severity bar,
 * List/Map segmented toggle, alert list or map, and source health accordion.
 * Content visibility is gated by the current sheet snap point.
 *
 * @module MobileCategoryDetail
 * @see WS-D.1 Section 4.1
 */

export interface MobileCategoryDetailProps {
  /** Category identifier (e.g. 'seismic', 'weather'). */
  categoryId: string
  /** Callback when the back button is tapped. Parent (D.3) wires this to reverseMorph + sheet dismiss. */
  onBack: () => void
  /** Callback when an alert row or map marker is tapped. Parent (D.3) wires this to open alert detail sheet. */
  onAlertTap: (alertId: string) => void
  /**
   * Current sheet snap point as an integer percentage (35, 65, or 100).
   * Used to gate progressive disclosure of content sections.
   * Provided by MobileBottomSheet via context or callback.
   */
  currentSnap: number
  /** Currently selected alert ID (highlighted in list, selected on map). Null = none. */
  selectedAlertId?: string | null
}
```

**Component structure (vertical stack):**

```
+------------------------------------------+
| [<-]  Category Icon  CATEGORY NAME       |  Section A: Header (always visible)
|------------------------------------------|
| 47 alerts  |  3 sources  |  trend up    |  Section B: Summary Strip (always)
| ############ severity bar               |  Section C: Severity Bar (always)
|------------------------------------------|
|  [  List  ]  [  Map  ]                   |  Section D: Segmented Control (>= 65%)
|------------------------------------------|
|  Sort: [Severity] [Time]                 |  Section E: Sort/Filter (>= 65%)
|  Filter: [P1] [P2] [P3] [P4]            |
|------------------------------------------|
|  +--------------------------------------+|
|  | MobileAlertCard                      ||  Section F: Alert List or Map (>= 65%)
|  | MobileAlertCard                      ||
|  | ...                                  ||
|  +--------------------------------------+|
|------------------------------------------|
|  > Source Health (3 sources)             |  Section G: Source Accordion (100% only)
|    USGS Feed    [active]  Global  15m   |
|    EMSC Events  [active]  Europe  30m   |
+------------------------------------------+
```

#### Section A: Header

Always visible at all snap points. Contains:

- **Back button:** `ArrowLeft` icon, 44x44px touch target, calls `onBack`. Positioned left.
- **Category icon:** Resolved from `getCategoryIcon(categoryId)` mapped through the Lucide icon lookup (same pattern as desktop `CategoryCard.tsx` `ICON_MAP`). Rendered at 20x20px in the category color from `getCategoryColor(categoryId)`.
- **Category name:** `getCategoryMeta(categoryId).displayName` in uppercase, `font-mono text-sm font-medium tracking-[0.08em]`, color `rgba(255, 255, 255, 0.70)`.
- **Layout:** `flex items-center gap-3`, height 48px, bottom border `1px solid rgba(255, 255, 255, 0.06)`.
- **Category tint:** Subtle top border gradient using the category color at 15% opacity: `border-top: 2px solid color-mix(in srgb, ${categoryColor} 15%, transparent)`.

```typescript
function CategoryDetailHeader({
  categoryId,
  onBack,
}: {
  categoryId: string
  onBack: () => void
}) {
  const meta = getCategoryMeta(categoryId)
  const color = getCategoryColor(categoryId)
  const IconComponent = MOBILE_ICON_MAP[meta.icon] ?? CircleDot

  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        borderTop: `2px solid color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label={`Back to category grid`}
        className="flex items-center justify-center shrink-0"
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          color: 'rgba(255, 255, 255, 0.45)',
        }}
      >
        <ArrowLeft size={20} />
      </button>

      <IconComponent
        size={20}
        style={{ color, flexShrink: 0 }}
      />

      <span
        className="font-mono text-sm font-medium tracking-[0.08em] uppercase"
        style={{ color: 'rgba(255, 255, 255, 0.70)' }}
      >
        {meta.displayName}
      </span>
    </div>
  )
}
```

#### Section B: Summary Strip

Always visible. Displays three metrics in a horizontal row:

- **Alert count:** Total alerts for this category from `useCategoryIntel` data length (or `useCoverageMetrics` `byCategory` `alertCount`). Displayed as `"47 alerts"` with the number in `text-sm font-bold` at primary opacity (0.70) and the label in `text-xs` at secondary opacity (0.45).
- **Source count:** From `useCoverageMetrics` `byCategory` matching entry `sourceCount`. Displayed as `"3 sources"`.
- **Trend indicator:** From `useCoverageMetrics` `byCategory` matching entry, comparing current alert count to prior period. Uses `TrendingUp` / `TrendingDown` / `Minus` icon. Displayed as `"up"` / `"down"` / `"stable"` with the icon.

Layout: `flex items-center justify-around`, height 40px, bottom border.

```typescript
function SummaryStrip({
  alertCount,
  sourceCount,
  trend,
}: {
  alertCount: number
  sourceCount: number
  trend?: TrendDirection
}) {
  return (
    <div
      className="flex items-center justify-around px-4 py-2"
      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
    >
      <MetricItem value={alertCount} label="alerts" />
      <Divider />
      <MetricItem value={sourceCount} label="sources" />
      <Divider />
      <TrendItem direction={trend} />
    </div>
  )
}
```

#### Section C: Severity Breakdown Bar

Always visible. Horizontal stacked bar showing severity distribution of alerts in this category. Derived from `useCoverageMapData({ categories: [categoryId] })` markers, grouped by severity.

Implementation mirrors the desktop `SeverityBreakdown` component from `CategoryDetailScene.tsx` (lines 405-494) but adapted for mobile:

- Bar height: 8px (vs 12px desktop) for compact display.
- Legend: inline below bar, using `flex-wrap gap-x-3 gap-y-1`.
- Colors: `SEVERITY_COLORS` from `coverage.ts`.
- Accessibility: `aria-label` describing the breakdown counts.
- If no data or all zero, show a single gray bar with `"No severity data"` label.

#### Section D: Segmented Control (List/Map Toggle)

Visible at snap >= 65%. Local `useState<'list' | 'map'>('list')` manages the active view.

```typescript
type DetailView = 'list' | 'map'

function SegmentedControl({
  activeView,
  onChange,
}: {
  activeView: DetailView
  onChange: (view: DetailView) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Category detail view"
      className="flex mx-4 my-3 rounded-md overflow-hidden"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
      }}
    >
      <SegmentButton
        id="list"
        label="List"
        icon={<ListIcon size={14} />}
        isActive={activeView === 'list'}
        onPress={() => onChange('list')}
      />
      <SegmentButton
        id="map"
        label="Map"
        icon={<MapIcon size={14} />}
        isActive={activeView === 'map'}
        onPress={() => onChange('map')}
      />
    </div>
  )
}
```

**Segment button specification:**
- Each segment: `flex-1`, 44px height (touch target), centered icon + label.
- Active state: `backgroundColor: rgba(255, 255, 255, 0.08)`, text `rgba(255, 255, 255, 0.70)`.
- Inactive state: `backgroundColor: transparent`, text `rgba(255, 255, 255, 0.25)`.
- Typography: `font-mono text-xs tracking-[0.06em] uppercase`.
- Transition: `background-color 150ms ease`.
- ARIA: Each segment has `role="tab"`, `aria-selected`, `aria-controls` pointing to the content panel ID.
- The content area below has `role="tabpanel"`, `aria-labelledby` pointing to the active tab ID.
- Switching views uses `AnimatePresence mode="wait"` for a crossfade (opacity 0 -> 1 over 200ms).

#### Section E: Sort and Filter Controls

Visible at snap >= 65%. Positioned between the segmented control and the content area. Only visible when `activeView === 'list'` (the map view has no sort/filter controls).

**Sort toggle:** Two buttons in a row: `[Severity]` (default) and `[Time]`. Active button has `rgba(255, 255, 255, 0.08)` background and `rgba(255, 255, 255, 0.50)` text. Same pattern as desktop `AlertList` (lines 252-277).

```typescript
type SortField = 'severity' | 'time'
```

**Priority filter pills:** Four toggle buttons: `[P1]` `[P2]` `[P3]` `[P4]`. Each is a pill-shaped button. Active pill has `rgba(255, 255, 255, 0.08)` background with `rgba(255, 255, 255, 0.50)` text. Inactive pill has transparent background with `rgba(255, 255, 255, 0.15)` text.

- Touch target: 44px height, minimum 44px width (padding ensures this). The pills use `px-3 py-2.5` with `font-mono text-xs uppercase tracking-wider`.
- Uses `selectedPriorities` from `coverage.store.ts` and `togglePriority()` action (lines 246-256) for state. This is the same store state used by the desktop `AlertList`.
- URL sync: Calls `syncPrioritiesToUrl()` after each toggle for deep-link consistency.
- `aria-pressed` attribute on each pill for screen reader state.

**Filter count indicator:** When any priority filter is active, show `"(12 of 47)"` count above the sort buttons.

#### Section F: Alert List (List View)

Visible at snap >= 65% when `activeView === 'list'`. Scrollable within the sheet's scroll container.

**Data flow:**
1. `useCategoryIntel(categoryId)` provides `CategoryIntelItem[]`.
2. Filter by `selectedPriorities` from coverage store (same logic as desktop `AlertList` lines 182-191).
3. Sort by `sortBy` state: `'severity'` uses `SEVERITY_ORDER` map then recency tiebreak; `'time'` uses `ingestedAt` descending.
4. Truncate to `MAX_DISPLAY_ITEMS = 50`.
5. Render each item as a `MobileAlertCard` (from WS-D.2).

**List rendering:**

```typescript
<div role="list" aria-label={`${meta.displayName} alerts`}>
  {sorted.map((item) => (
    <MobileAlertCard
      key={item.id}
      item={item}
      onTap={(item) => onAlertTap(item.id)}
      isSelected={selectedAlertId === item.id}
    />
  ))}
</div>
```

**Truncation footer:** If `totalCount > MAX_DISPLAY_ITEMS`, show `"Showing 50 of 127"` in `font-mono text-[10px] rgba(255, 255, 255, 0.20)` below the list.

**Empty state:** When `sorted.length === 0` and data is loaded, render via `MobileStateView` pattern:
- If no priority filter active: `"NO ${CATEGORY} ALERTS"` / `"This category has no active alerts."`
- If priority filter active: `"NO MATCHING ALERTS"` / `"No alerts match the selected priority filters."`

**Loading state:** 5 skeleton cards, each 64px tall, `animate-pulse`, `rgba(255, 255, 255, 0.04)` background.

**Error state:** Via `MobileStateView` with `query={intelQuery}`, retry calls `intelQuery.refetch()`.

#### Section F (alt): Category Map View

Visible at snap >= 65% when `activeView === 'map'`. Replaces the alert list content area.

**Implementation:**

```typescript
const CoverageMap = dynamic(
  () => import('@/components/coverage/CoverageMap').then((mod) => mod.CoverageMap),
  { ssr: false, loading: () => <MapLoadingPlaceholder /> },
)
```

The map is loaded inside the sheet's scroll area but with scroll disabled on the map container (the map handles its own touch gestures). The map container has `touch-action: none` to prevent the sheet from intercepting map gestures.

**Map container specification:**
- Height: `min(300px, 50vh)` -- provides a usable map viewport within the sheet.
- Width: `100%` with 16px horizontal padding (matching sheet content padding).
- Corner brackets: `10px`, `1px`, `rgba(255, 255, 255, 0.15)` -- same as WS-C.3 map.
- Loading placeholder: centered `"Loading map..."` text in mono 11px at 0.15 opacity.

**Map data:**
- `useCoverageMapData({ categories: [categoryId] })` provides markers filtered to this category.
- Markers are severity-colored (same palette as desktop).
- Tapping a marker calls `onAlertTap(markerId)` -- WS-D.3 wires this to the alert detail sheet.

**Pointer events:** The map container must have `style={{ pointerEvents: 'auto' }}` per CLAUDE.md convention (`SpatialCanvas` and bottom sheet scroll containers disable pointer events on children).

**Map vs sheet drag conflict:** When the user's finger is inside the map container, sheet drag gestures must be suppressed. The map container sets `data-sheet-scroll-lock="true"` which the `MobileBottomSheet` (WS-C.1) respects to disable sheet drag within that region.

#### Section G: Source Health Accordion

Visible only at snap === 100%. Expandable section showing intel sources for this category.

**Data source:** `useCoverageMetrics()` -> `sourcesByCoverage` filtered to `source.category === categoryId`.

**Collapsed state (default):**
```
> Source Health (3 sources)                    [ChevronDown]
```

- Trigger: Full-width button, 48px height (touch target), `font-mono text-xs tracking-[0.08em] uppercase`.
- Text color: `rgba(255, 255, 255, 0.35)`.
- Source count shown in parentheses.
- `aria-expanded="false"`, `aria-controls="source-health-panel"`.

**Expanded state:**

```
v Source Health (3 sources)                    [ChevronUp]
+-------------------------------------------------+
| USGS Feed        [*] active    Global    15m    |
| EMSC Events      [*] active    Europe    30m    |
| GDACS RSS        [*] staging   Global    1h     |
+-------------------------------------------------+
```

Each source row:
- Height: 40px minimum.
- **Name:** `font-mono text-xs`, color `rgba(255, 255, 255, 0.35)`.
- **Status dot:** 6px circle, color from `STATUS_COLORS` map (`active: #22c55e`, `staging: #3b82f6`, `quarantine: #eab308`, `disabled: #6b7280`).
- **Status label:** `font-mono text-[10px]`, color `rgba(255, 255, 255, 0.25)`.
- **Region:** Geographic coverage string or `'--'` if null. `font-mono text-[10px]`, color `rgba(255, 255, 255, 0.25)`.
- **Frequency:** Update frequency string or `'--'` if null. Same styling.
- Each row separated by `1px solid rgba(255, 255, 255, 0.03)`.

**Expand/collapse animation:** `motion.div` with `animate={{ height: 'auto' }}` and `exit={{ height: 0 }}` using `overflow: hidden`. Duration 200ms ease.

**Empty state:** If no sources for this category: `"No sources for ${displayName}"` in `font-mono text-xs rgba(255, 255, 255, 0.20)`.

#### Progressive Disclosure by Snap Point

The `currentSnap` prop determines which sections are rendered:

| Snap Point | Viewport % | Sections Visible | Rationale |
|------------|-----------|------------------|-----------|
| 35% | ~35% of viewport | A (Header) + B (Summary) + C (Severity) | "Peek" view. Analyst sees whether this category warrants investigation. Summary metrics + severity bar provide the answer. |
| 65% | ~65% of viewport (default) | A + B + C + D (Toggle) + E (Sort/Filter) + F (Alert List or Map) | Working view. Analyst can browse alerts, sort, filter, and toggle to map. This is the initial snap on open (`initialSnapIndex: 1`). |
| 100% | Full viewport | A + B + C + D + E + F + G (Source Health) | Deep investigation. Analyst inspects source health to assess data reliability. Source accordion is only relevant during detailed analysis. |

**Implementation:**

```typescript
const showWorkingContent = currentSnap >= 65
const showFullContent = currentSnap >= 100

return (
  <div className="mobile-category-detail">
    {/* Always visible */}
    <CategoryDetailHeader categoryId={categoryId} onBack={onBack} />
    <SummaryStrip alertCount={...} sourceCount={...} trend={...} />
    <SeverityBreakdownBar markers={markers} />

    {/* Working view (>= 65%) */}
    {showWorkingContent && (
      <>
        <SegmentedControl activeView={activeView} onChange={setActiveView} />
        {activeView === 'list' && (
          <>
            <SortFilterControls sortBy={sortBy} onSortChange={setSortBy} />
            <AlertListContent items={sorted} ... />
          </>
        )}
        {activeView === 'map' && (
          <CategoryMapView categoryId={categoryId} ... />
        )}
      </>
    )}

    {/* Full content (100%) */}
    {showFullContent && (
      <SourceHealthAccordion categoryId={categoryId} />
    )}
  </div>
)
```

**Transition behavior:** When the sheet snaps from 35% to 65%, the working content sections appear with a 200ms fade-in (`opacity 0 -> 1`). When snapping from 65% to 100%, the source health section fades in. Reverse snapping fades sections out. Uses `AnimatePresence` + `motion.div` with `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `exit={{ opacity: 0 }}`, `transition={{ duration: 0.2 }}`.

#### Icon Lookup Map

A mobile-specific icon map that resolves Lucide icon names to components. Mirrors the desktop `ICON_MAP` from `CategoryCard.tsx` but as a standalone export for mobile use.

```typescript
import {
  Activity, Mountain, AlertTriangle, Heart, HeartPulse,
  Plane, Ship, Building2, Cloud, ShieldAlert, Flame,
  Waves, CloudLightning, Layers, CircleDot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const MOBILE_ICON_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  mountain: Mountain,
  'alert-triangle': AlertTriangle,
  heart: Heart,
  'heart-pulse': HeartPulse,
  plane: Plane,
  ship: Ship,
  'building-2': Building2,
  cloud: Cloud,
  'shield-alert': ShieldAlert,
  flame: Flame,
  waves: Waves,
  'cloud-lightning': CloudLightning,
  layers: Layers,
  'circle-dot': CircleDot,
}
```

This map is extracted to `src/components/mobile/icon-map.ts` so WS-D.2 and other mobile components can import it via `@/components/mobile/icon-map`. If the desktop `CategoryCard.tsx` already exports an equivalent map, import it instead of duplicating.

### D-2: CSS file (`src/styles/mobile-category-detail.css`)

Component-specific styles using design tokens from WS-A.3.

```css
/* ==========================================================================
   MobileCategoryDetail -- bottom sheet content for a single intel category
   Imported by MobileCategoryDetail.tsx (mobile-only code-split chunk)
   ========================================================================== */

/* Layout container */
.mobile-category-detail {
  display: flex;
  flex-direction: column;
  min-height: 0;
  color: rgba(255, 255, 255, 0.70);
  font-family: var(--font-mono, ui-monospace, monospace);
}

/* Summary strip */
.mobile-category-detail-summary {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: var(--space-2, 8px) var(--space-4, 16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.mobile-category-detail-summary-divider {
  width: 1px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

/* Severity breakdown bar */
.mobile-category-detail-severity-bar {
  display: flex;
  height: 8px;
  width: 100%;
  overflow: hidden;
  border-radius: 2px;
  background-color: rgba(255, 255, 255, 0.04);
}

.mobile-category-detail-severity-segment {
  opacity: 0.7;
  transition: width 300ms ease;
}

/* Segmented control */
.mobile-category-detail-segmented {
  display: flex;
  margin: var(--space-3, 12px) var(--space-4, 16px);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background-color: rgba(255, 255, 255, 0.03);
}

.mobile-category-detail-segment {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.25);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-category-detail-segment[aria-selected='true'] {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.70);
}

/* Sort + filter controls */
.mobile-category-detail-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2, 8px);
  padding: 0 var(--space-4, 16px) var(--space-2, 8px);
}

.mobile-category-detail-sort-btn,
.mobile-category-detail-priority-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: transparent;
  color: rgba(255, 255, 255, 0.20);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
  -webkit-tap-highlight-color: transparent;
}

.mobile-category-detail-sort-btn[aria-pressed='true'],
.mobile-category-detail-priority-pill[aria-pressed='true'] {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.50);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Alert list */
.mobile-category-detail-list {
  padding: 0 var(--space-4, 16px);
  display: flex;
  flex-direction: column;
  gap: var(--space-1, 4px);
}

.mobile-category-detail-list-footer {
  padding: var(--space-2, 8px) var(--space-4, 16px);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.20);
}

/* Map container */
.mobile-category-detail-map {
  position: relative;
  margin: 0 var(--space-4, 16px);
  height: min(300px, 50vh);
  border-radius: 8px;
  overflow: hidden;
  touch-action: none;
}

.mobile-category-detail-map-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
  border-radius: 8px;
  border: 1px dashed rgba(255, 255, 255, 0.06);
  background-color: rgba(255, 255, 255, 0.02);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.15);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Source health accordion */
.mobile-category-detail-accordion {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  margin-top: var(--space-3, 12px);
}

.mobile-category-detail-accordion-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  padding: var(--space-3, 12px) var(--space-4, 16px);
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.35);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.mobile-category-detail-source-row {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-2, 8px) var(--space-4, 16px);
  min-height: 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.mobile-category-detail-source-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .mobile-category-detail-severity-segment {
    transition: none;
  }
  .mobile-category-detail-segment,
  .mobile-category-detail-sort-btn,
  .mobile-category-detail-priority-pill {
    transition: none;
  }
}
```

**Import:** `MobileCategoryDetail.tsx` imports this CSS file as its first import: `import '@/styles/mobile-category-detail.css'`. This ensures the styles are only loaded within the mobile code-split chunk.

### D-3: Severity helper utilities

Two pure functions extracted for reuse and testability. Placed in `MobileCategoryDetail.tsx` as module-level functions (or extracted to `src/lib/category-detail-utils.ts` if needed by WS-D.2).

```typescript
/**
 * Severity sort order. Lower = higher severity.
 * Same values as desktop CategoryDetailScene (lines 93-99).
 */
const SEVERITY_ORDER: Record<string, number> = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
}

/**
 * Compute severity breakdown from map markers.
 * Returns an array of { level, count, color } for each severity level.
 */
function computeSeverityBreakdown(markers: MapMarker[] | undefined) {
  if (!markers || markers.length === 0) return []
  return SEVERITY_LEVELS.map((level) => ({
    level,
    count: markers.filter((m) => m.severity === level).length,
    color: SEVERITY_COLORS[level],
  }))
}

/**
 * Filter and sort intel items for the alert list.
 * Applies priority visibility rules and selected priority filter from the store.
 */
function filterAndSortAlerts(
  items: CategoryIntelItem[] | undefined,
  sortBy: SortField,
  selectedPriorities: OperationalPriority[],
): CategoryIntelItem[] {
  if (!items) return []
  const hasPriorityFilter = selectedPriorities.length > 0

  return [...items]
    .filter((item) => {
      if (hasPriorityFilter) {
        return (
          item.operationalPriority != null &&
          selectedPriorities.includes(item.operationalPriority)
        )
      }
      // Default visibility: show P1/P2/P3 in detail context, hide P4
      if (item.operationalPriority) {
        return isPriorityVisible(item.operationalPriority, 'detail')
      }
      return true // null priority = show
    })
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const sa = SEVERITY_ORDER[a.severity] ?? 4
        const sb = SEVERITY_ORDER[b.severity] ?? 4
        if (sa !== sb) return sa - sb
        return new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime()
      }
      return new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime()
    })
    .slice(0, MAX_DISPLAY_ITEMS)
}
```

**Key difference from desktop:** The desktop `AlertList` uses `isPriorityVisible(priority, 'list')` which hides P3 and P4 by default. The mobile category detail uses `isPriorityVisible(priority, 'detail')` which shows P3 by default and only hides P4. This matches the `PRIORITY_META` `defaultVisibility` design: P3 is `'detail'` visibility, meaning it appears in the category detail context.

### D-4: Integration point for parent (consumed by WS-D.3)

This deliverable specifies the contract that WS-D.3 (Morph + Navigation) uses to wire `MobileCategoryDetail` into the sheet.

**Usage pattern in the parent orchestrator:**

```typescript
import { MobileCategoryDetail } from '@/components/mobile/MobileCategoryDetail'
import { MobileBottomSheet } from '@/components/mobile/MobileBottomSheet'
import { SHEET_CONFIGS } from '@/lib/interfaces/mobile'

// Inside MobileShell or a MobileCategoryDetailSheet wrapper:

const [sheetOpen, setSheetOpen] = useState(false)
const [categoryId, setCategoryId] = useState<string | null>(null)
const [currentSnap, setCurrentSnap] = useState(65)
const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)

// Opened by WS-D.3 when morph.phase === 'entering-district':
<MobileBottomSheet
  isOpen={sheetOpen}
  onDismiss={handleDismiss}
  config={SHEET_CONFIGS.categoryDetail}
  ariaLabel={`${getCategoryMeta(categoryId ?? '').displayName} category detail`}
  onSnapChange={setCurrentSnap}
>
  {categoryId && (
    <MobileCategoryDetail
      categoryId={categoryId}
      onBack={handleBack}
      onAlertTap={handleAlertTap}
      currentSnap={currentSnap}
      selectedAlertId={selectedAlertId}
    />
  )}
</MobileBottomSheet>
```

**Callback contracts:**
- `handleBack()`: WS-D.3 calls `reverseMorph()` and `setSheetOpen(false)`.
- `handleAlertTap(alertId)`: WS-D.3 opens the alert detail sheet (WS-D.2) as a nested sheet or content swap.
- `handleDismiss()`: Called by `MobileBottomSheet` when user drags to dismiss. WS-D.3 calls `reverseMorph()`.
- `onSnapChange(snap)`: `MobileBottomSheet` reports current snap integer to the parent, which passes it as `currentSnap` prop to this component.

**Note on `onSnapChange`:** If WS-C.1 does not expose an `onSnapChange` callback, this SOW requests that WS-C.1 adds one (or uses a React context). The `currentSnap` integer is essential for progressive disclosure gating. If `onSnapChange` is unavailable at implementation time, fall back to rendering all content at all snap points (remove progressive disclosure gating) and file a follow-up issue.

### D-5: Unit tests (`src/components/mobile/__tests__/MobileCategoryDetail.test.tsx`)

Vitest + React Testing Library tests.

**Test setup:**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MobileCategoryDetail } from '../MobileCategoryDetail'

// Mock TanStack Query hooks
vi.mock('@/hooks/use-category-intel', () => ({
  useCategoryIntel: vi.fn(),
}))
vi.mock('@/hooks/use-coverage-map-data', () => ({
  useCoverageMapData: vi.fn(),
}))
vi.mock('@/hooks/use-coverage-metrics', () => ({
  useCoverageMetrics: vi.fn(),
}))

// Mock dynamic map import
vi.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => {
    const MockMap = () => <div data-testid="coverage-map">Map</div>
    MockMap.displayName = 'MockCoverageMap'
    return MockMap
  },
}))

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

const defaultProps = {
  categoryId: 'seismic',
  onBack: vi.fn(),
  onAlertTap: vi.fn(),
  currentSnap: 65,
  selectedAlertId: null,
}
```

**Test cases:**

```typescript
describe('MobileCategoryDetail', () => {
  // --- Header tests ---
  it('renders category name and icon in header', () => {
    // Mock hooks to return data
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    expect(screen.getByText('Seismic')).toBeInTheDocument()
  })

  it('calls onBack when back button is tapped', async () => {
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    await userEvent.click(screen.getByLabelText('Back to category grid'))
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1)
  })

  // --- Progressive disclosure tests ---
  it('shows only summary at 35% snap', () => {
    renderWithProviders(
      <MobileCategoryDetail {...defaultProps} currentSnap={35} />,
    )
    expect(screen.getByText(/alerts/)).toBeInTheDocument() // Summary strip
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument() // No segmented control
  })

  it('shows segmented control and alert list at 65% snap', () => {
    renderWithProviders(
      <MobileCategoryDetail {...defaultProps} currentSnap={65} />,
    )
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  it('shows source health accordion at 100% snap', () => {
    renderWithProviders(
      <MobileCategoryDetail {...defaultProps} currentSnap={100} />,
    )
    expect(screen.getByText(/Source Health/)).toBeInTheDocument()
  })

  // --- Segmented control tests ---
  it('defaults to list view', () => {
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    const listTab = screen.getByRole('tab', { name: /list/i })
    expect(listTab).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to map view when Map tab is tapped', async () => {
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    await userEvent.click(screen.getByRole('tab', { name: /map/i }))
    expect(screen.getByTestId('coverage-map')).toBeInTheDocument()
  })

  // --- Sort/filter tests ---
  it('sorts by severity by default', () => {
    // With mocked data: Extreme before Minor
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    const severityBtn = screen.getByRole('button', { name: /severity/i })
    expect(severityBtn).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches to time sort when tapped', async () => {
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /time/i }))
    expect(screen.getByRole('button', { name: /time/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('filters by priority when pill is tapped', async () => {
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    await userEvent.click(screen.getByRole('button', { name: /P1/i }))
    expect(screen.getByRole('button', { name: /P1/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  // --- Alert tap test ---
  it('calls onAlertTap when an alert card is tapped', async () => {
    // Mock useCategoryIntel to return 1 item
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    // Find and tap the alert card
    // Exact selector depends on MobileAlertCard (WS-D.2)
  })

  // --- Source health accordion tests ---
  it('source health accordion is collapsed by default at 100% snap', () => {
    renderWithProviders(
      <MobileCategoryDetail {...defaultProps} currentSnap={100} />,
    )
    const trigger = screen.getByRole('button', { name: /source health/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('expands source health accordion on tap', async () => {
    renderWithProviders(
      <MobileCategoryDetail {...defaultProps} currentSnap={100} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /source health/i }))
    expect(
      screen.getByRole('button', { name: /source health/i }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  // --- Loading state test ---
  it('renders loading skeleton when data is loading', () => {
    // Mock useCategoryIntel to return isLoading: true
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    // Verify skeleton cards are rendered
  })

  // --- Empty state test ---
  it('renders empty state when no alerts exist', () => {
    // Mock useCategoryIntel to return empty array
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    expect(screen.getByText(/no.*alerts/i)).toBeInTheDocument()
  })

  // --- Error state test ---
  it('renders error state with retry button on query failure', () => {
    // Mock useCategoryIntel to return isError: true
    renderWithProviders(<MobileCategoryDetail {...defaultProps} />)
    expect(screen.getByText(/retry/i)).toBeInTheDocument()
  })
})
```

### D-6: Pure function unit tests (`src/lib/__tests__/category-detail-utils.test.ts`)

If `filterAndSortAlerts` and `computeSeverityBreakdown` are extracted to a separate utils file, test them in isolation.

```typescript
import { describe, it, expect } from 'vitest'
import { filterAndSortAlerts, computeSeverityBreakdown } from '../category-detail-utils'

describe('filterAndSortAlerts', () => {
  const mockItems = [
    { id: '1', severity: 'Minor', operationalPriority: 'P3', ingestedAt: '2026-03-06T10:00:00Z' },
    { id: '2', severity: 'Extreme', operationalPriority: 'P1', ingestedAt: '2026-03-06T09:00:00Z' },
    { id: '3', severity: 'Moderate', operationalPriority: 'P4', ingestedAt: '2026-03-06T11:00:00Z' },
    { id: '4', severity: 'Severe', operationalPriority: 'P2', ingestedAt: '2026-03-06T08:00:00Z' },
  ] as CategoryIntelItem[]

  it('sorts by severity descending by default', () => {
    const result = filterAndSortAlerts(mockItems, 'severity', [])
    expect(result.map((i) => i.id)).toEqual(['2', '4', '1']) // P4 hidden by default
  })

  it('sorts by time descending', () => {
    const result = filterAndSortAlerts(mockItems, 'time', [])
    expect(result[0].id).toBe('1') // 11:00 is hidden (P4 filtered), so '1' (10:00) is first
  })

  it('hides P4 items by default (detail context)', () => {
    const result = filterAndSortAlerts(mockItems, 'severity', [])
    expect(result.find((i) => i.id === '3')).toBeUndefined()
  })

  it('shows P4 items when P4 filter is explicitly selected', () => {
    const result = filterAndSortAlerts(mockItems, 'severity', ['P4'])
    expect(result.find((i) => i.id === '3')).toBeDefined()
  })

  it('filters to only selected priorities', () => {
    const result = filterAndSortAlerts(mockItems, 'severity', ['P1'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('2')
  })

  it('returns empty array for undefined input', () => {
    expect(filterAndSortAlerts(undefined, 'severity', [])).toEqual([])
  })

  it('truncates to MAX_DISPLAY_ITEMS', () => {
    const manyItems = Array.from({ length: 100 }, (_, i) => ({
      ...mockItems[0],
      id: String(i),
      operationalPriority: 'P1',
    })) as CategoryIntelItem[]
    const result = filterAndSortAlerts(manyItems, 'severity', [])
    expect(result).toHaveLength(50)
  })
})

describe('computeSeverityBreakdown', () => {
  it('returns empty array for undefined markers', () => {
    expect(computeSeverityBreakdown(undefined)).toEqual([])
  })

  it('counts markers by severity level', () => {
    const markers = [
      { severity: 'Extreme' },
      { severity: 'Extreme' },
      { severity: 'Minor' },
    ] as MapMarker[]
    const result = computeSeverityBreakdown(markers)
    expect(result.find((s) => s.level === 'Extreme')?.count).toBe(2)
    expect(result.find((s) => s.level === 'Minor')?.count).toBe(1)
    expect(result.find((s) => s.level === 'Moderate')?.count).toBe(0)
  })

  it('returns all 5 severity levels', () => {
    const markers = [{ severity: 'Extreme' }] as MapMarker[]
    expect(computeSeverityBreakdown(markers)).toHaveLength(5)
  })
})
```

---

## 5. Acceptance Criteria

| # | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `MobileCategoryDetail` renders inside `MobileBottomSheet` with `SHEET_CONFIGS.categoryDetail` (snap points 35/65/100, initial snap 65). | Render component inside sheet. Verify sheet opens at 65% snap. Drag to 35% and 100%, verify snap behavior. |
| AC-2 | Header displays category icon (correct Lucide icon), category name (uppercase), and back button (44x44px touch target). Category tint border visible at top. | Visual inspection. Tap back button, verify `onBack` fires. Inspect touch target dimensions >= 44px. |
| AC-3 | Summary strip shows alert count, source count, and trend direction with correct values from `useCategoryIntel` and `useCoverageMetrics`. | Mock API to return known data. Verify "47 alerts", "3 sources", and trend icon render correctly. |
| AC-4 | Severity breakdown bar shows stacked horizontal bar with correct colors (`SEVERITY_COLORS`) and proportional widths. Legend shows all severity levels with counts. | Mock data with known severity distribution. Verify bar segments have correct `width %`. Verify legend text matches counts. |
| AC-5 | **Progressive disclosure at 35% snap:** Only header, summary strip, and severity bar are visible. Segmented control, alert list, sort/filter, and source accordion are NOT rendered. | Set `currentSnap={35}`. Assert segmented control (`role="tablist"`) is absent. Assert alert list (`role="list"`) is absent. Assert source accordion trigger is absent. |
| AC-6 | **Progressive disclosure at 65% snap:** Header, summary, severity, segmented control, sort/filter, and alert list (or map) are visible. Source accordion is NOT rendered. | Set `currentSnap={65}`. Assert segmented control present. Assert alert list present. Assert source accordion trigger absent. |
| AC-7 | **Progressive disclosure at 100% snap:** All content visible including source health accordion. | Set `currentSnap={100}`. Assert all sections present including source accordion trigger. |
| AC-8 | Segmented control defaults to List view. Has `role="tablist"` with two `role="tab"` children. Active tab has `aria-selected="true"`. | Render component. Verify `tablist` exists, List tab has `aria-selected="true"`, Map tab has `aria-selected="false"`. |
| AC-9 | Tapping Map segment switches content to CoverageMap (dynamically loaded). Tapping List segment returns to alert list. Content crossfades with 200ms animation. | Tap Map tab. Verify map component renders (`data-testid="coverage-map"` or map container). Tap List tab. Verify alert list returns. |
| AC-10 | Map view shows markers filtered to the current category only. Tapping a marker calls `onAlertTap(markerId)`. | Filter `useCoverageMapData` mock to return 3 markers for category. Verify 3 markers render. Tap one. Verify `onAlertTap` fires with correct ID. |
| AC-11 | Map container has `touch-action: none` and `pointerEvents: 'auto'` to prevent sheet drag interference. | Inspect computed styles on map container. Verify `touch-action: none` and `pointer-events: auto`. |
| AC-12 | Sort defaults to severity. Tapping "Time" switches sort order. Active sort button has `aria-pressed="true"`. | Verify default sort button state. Tap "Time". Verify alert order changes (most recent first). Verify `aria-pressed` toggles. |
| AC-13 | Priority filter pills (P1/P2/P3/P4) toggle on tap. Each pill has `aria-pressed`. Active pills have distinct visual state. | Tap P1 pill. Verify `aria-pressed="true"`. Verify alert list filters to P1 only. Tap P1 again. Verify deactivated. |
| AC-14 | Priority filter pills have minimum 44px height touch target. | Inspect computed height of each pill. Verify >= 44px. |
| AC-15 | Alert list renders `MobileAlertCard` for each filtered/sorted item. Tapping a card calls `onAlertTap(alertId)`. | Mock 5 alerts. Verify 5 cards render. Tap first. Verify `onAlertTap` with correct ID. |
| AC-16 | When `totalCount > 50`, truncation footer shows `"Showing 50 of {total}"`. | Mock 75 alerts. Verify footer text. Verify only 50 cards render. |
| AC-17 | Source health accordion trigger is a 48px tall button with `aria-expanded`. Collapsed by default. | At 100% snap, verify trigger button exists with `aria-expanded="false"`. Verify height >= 48px. |
| AC-18 | Tapping accordion trigger expands to show source rows with name, status dot, region, frequency. | Tap trigger. Verify `aria-expanded="true"`. Verify source rows appear with correct data from `useCoverageMetrics`. |
| AC-19 | **Loading state:** When `useCategoryIntel` is loading, show 5 skeleton cards (64px, `animate-pulse`). | Mock `isLoading: true`. Verify 5 skeleton elements with animation class. |
| AC-20 | **Error state:** When `useCategoryIntel` errors, show error card with retry button. Tapping retry calls `refetch()`. | Mock `isError: true`. Verify error message renders. Tap retry. Verify `refetch` called. |
| AC-21 | **Empty state:** When category has zero alerts, show empty state: `"NO [CATEGORY] ALERTS"` + `"This category has no active alerts."` | Mock empty data. Verify empty title and message render with correct category name. |
| AC-22 | **Priority filter empty state:** When priority filter is active but yields zero results, show `"NO MATCHING ALERTS"` + `"No alerts match the selected priority filters."` | Mock data with no P1 alerts. Activate P1 filter. Verify filter-specific empty message. |
| AC-23 | CSS file `mobile-category-detail.css` is imported by the component and loaded only in the mobile code-split chunk. | Verify import statement. Build and check that desktop bundle does not include this CSS. |
| AC-24 | All text meets 10px minimum floor (R11). All interactive elements meet 44px minimum touch target (R6). | Inspect all font-size declarations >= 10px. Inspect all button/pill dimensions >= 44px. |
| AC-25 | `prefers-reduced-motion: reduce` disables all CSS transitions and `motion/react` animations within this component. | Enable reduced motion in OS. Verify no animations on view toggle, accordion expand, or section fade-in. |
| AC-26 | Unit tests pass: all test cases in D-5 and D-6 produce green results with `pnpm test:unit`. | Run `pnpm test:unit --filter MobileCategoryDetail`. All assertions pass. |

---

## 6. Test Plan

### 6.1 Unit Tests (Vitest)

| Test File | Test Count | What Is Tested |
|-----------|-----------|----------------|
| `src/components/mobile/__tests__/MobileCategoryDetail.test.tsx` | ~15 | Component rendering, progressive disclosure gating, segmented control toggle, sort/filter state, accordion expand/collapse, loading/error/empty states, callback firing |
| `src/lib/__tests__/category-detail-utils.test.ts` | ~8 | `filterAndSortAlerts` sort/filter logic, `computeSeverityBreakdown` counting, edge cases (undefined, empty, truncation) |

### 6.2 Manual Verification

| # | Test | Device/Tool | Expected |
|---|------|-------------|----------|
| M-1 | Open category detail from Situation tab | Chrome DevTools responsive (375x812, iPhone 14) | Sheet opens at 65% snap with header + list visible. |
| M-2 | Drag sheet to 35% snap | Touch emulation | Only header, summary, severity bar visible. Alert list and toggle hidden. |
| M-3 | Drag sheet to 100% snap | Touch emulation | Source health accordion trigger appears below alert list. |
| M-4 | Switch to Map view | Touch emulation | Alert list replaced by map with category-filtered markers. |
| M-5 | Sort by time | Touch emulation | Alerts reorder by recency. Most recent at top. |
| M-6 | Filter P1 only | Touch emulation | Only P1 alerts shown. Other priorities hidden. P1 pill highlighted. |
| M-7 | Expand source health | Touch emulation | Accordion animates open. Source rows display correct data. |
| M-8 | Back button tap | Touch emulation | Sheet begins to close. `onBack` fires (D.3 handles morph reverse). |
| M-9 | Alert card tap | Touch emulation | `onAlertTap` fires with correct ID (D.3 handles alert detail sheet). |
| M-10 | Empty category | Mock API returning 0 alerts | Empty state message displays: "NO SEISMIC ALERTS". |
| M-11 | API error | Kill TarvaRI API | Error state with retry button. Tap retry, verify refetch. |
| M-12 | Reduced motion | Enable in OS settings | No animations on toggle, accordion, or section transitions. |

---

## 7. Risks & Open Questions

### Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|------------|--------|------------|
| R-1 | `MobileBottomSheet` does not expose `onSnapChange` callback or `currentSnap` value, preventing progressive disclosure gating. | Medium | High | D-4 documents the requirement. If unavailable, fall back to rendering all content at all snap points. File follow-up issue for C.1 to add `onSnapChange`. Progressive disclosure is a UX enhancement, not a functional requirement. |
| R-2 | `MobileAlertCard` (WS-D.2) props interface changes between D.1 and D.2 authoring, requiring rework. | Low | Medium | D.1 specifies the expected props interface. D.2 author must honor this contract or negotiate changes before implementation. |
| R-3 | Map inside bottom sheet causes scroll-vs-drag conflicts when user pans the map. | Medium | High | Map container uses `touch-action: none` and `data-sheet-scroll-lock="true"`. WS-C.1 respects this attribute to suppress sheet drag. If the attribute is not implemented in C.1, fall back to disabling sheet drag entirely when map view is active. |
| R-4 | Dynamic import of `CoverageMap` adds visible load delay when switching to map view. | Medium | Low | Map loading placeholder provides immediate visual feedback. Map component is cached after first load (TanStack Query `placeholderData: keepPreviousData` keeps markers while refetching). |
| R-5 | Large alert lists (200+ items) cause scroll performance issues within the bottom sheet. | Low | Medium | Truncation to 50 items mitigates. If 50 items still cause jank, introduce virtualization (react-window) as a follow-up. |
| R-6 | Icon map duplication with desktop `CategoryCard.tsx`. | Low | Low | If desktop already exports `ICON_MAP`, import it. If not, the mobile `MOBILE_ICON_MAP` is authoritative and the desktop map can be refactored to import from a shared location in a follow-up. |

### Open Questions

| # | Question | Owner | Target Resolution |
|---|----------|-------|-------------------|
| OQ-1 | Should the map view in the category detail sheet support the same `ViewModeToggle` (triaged/all-bundles/raw) that the main Map tab has, or always show triaged data? | Product Owner | Before D.1 implementation. **Default assumption:** Always triaged. The category detail map is a focused view; view mode toggle belongs on the main Map tab (WS-C.3). |
| OQ-2 | When a marker is tapped on the category map, should the alert detail open as a nested sheet (stacked on top of category detail) or as a content swap within the same sheet? | WS-D.3 author | Before D.3 implementation. **Default assumption:** Nested sheet. D.1 calls `onAlertTap(id)` and D.3 decides the presentation. |
| OQ-3 | ~~Should the icon map (`MOBILE_ICON_MAP`) be extracted to a shared file or kept inline?~~ **Resolved:** Extracted to `src/components/mobile/icon-map.ts` per Phase D Review M-1. | D.1 implementer | Resolved. |
| OQ-4 | Does the category detail need a "Show on Map" quick action that switches to the main Map tab filtered to this category? | Product Owner | Phase E (cross-tab links, WS-E.3). **Default assumption:** Not in scope for D.1. |

---

## 8. Appendix

### Appendix A: File Inventory

| File | Action | Description |
|------|--------|-------------|
| `src/components/mobile/MobileCategoryDetail.tsx` | Create | Main component: header, summary, severity, segmented control, alert list, map view, source accordion |
| `src/styles/mobile-category-detail.css` | Create | Component-specific CSS using WS-A.3 design tokens |
| `src/components/mobile/__tests__/MobileCategoryDetail.test.tsx` | Create | Vitest component tests (~15 cases) |
| `src/lib/__tests__/category-detail-utils.test.ts` | Create | Pure function unit tests (~8 cases) |

**Optional (decided during implementation):**

| File | Action | Description |
|------|--------|-------------|
| `src/components/mobile/icon-map.ts` | Create | Shared icon lookup map (used by D.1 and D.2) |
| `src/lib/category-detail-utils.ts` | Create | Extracted pure functions if needed by D.2+ |

### Appendix B: Data Shape Quick Reference

**`CategoryIntelItem`** (from `use-category-intel.ts`):

```typescript
{
  id: string
  title: string
  severity: string            // 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'
  category: string            // e.g. 'seismic'
  eventType: string | null
  sourceKey: string | null
  confidence: number | null   // 0-100
  geoScope: string[] | null   // e.g. ['PG', 'AU', 'SB']
  shortSummary: string | null
  ingestedAt: string          // ISO 8601
  sentAt: string | null       // ISO 8601
  operationalPriority: OperationalPriority | null  // 'P1' | 'P2' | 'P3' | 'P4'
}
```

**`MapMarker`** (from `coverage-utils.ts`):

```typescript
{
  id: string
  lat: number
  lng: number
  title: string
  severity: string
  category: string
  sourceId: string
  ingestedAt: string
  operationalPriority: OperationalPriority | null
}
```

**`CoverageByCategory`** (from `coverage-utils.ts`):

```typescript
{
  category: string
  sourceCount: number
  activeSources: number
  geographicRegions: string[]
  alertCount: number
  p1Count: number
  p2Count: number
}
```

**`SourceCoverage`** (from `coverage-utils.ts`):

```typescript
{
  sourceKey: string
  name: string
  category: string
  status: string              // 'active' | 'staging' | 'quarantine' | 'disabled'
  geographicCoverage: string | null
  updateFrequency: string | null
}
```

### Appendix C: Desktop-to-Mobile Mapping

| Desktop Element | Desktop Location | Mobile Equivalent | Mobile Section |
|----------------|-----------------|-------------------|----------------|
| Alert List (full left column) | `CategoryDetailScene` lines 147-399 | Alert list in Section F (list view) | `MobileCategoryDetail` |
| Severity Breakdown (top right) | `CategoryDetailScene` lines 405-494 | Section C (severity bar, always visible) | `MobileCategoryDetail` |
| CoverageMap (~70% right column) | `CategoryDetailScene` lines 742-756 | Section F (map view, toggled via segmented control) | `MobileCategoryDetail` |
| Source Health Table (~30% right column) | `CategoryDetailScene` lines 500-646 | Section G (accordion, 100% snap only) | `MobileCategoryDetail` |
| Priority filter pills (inline in alert list header) | `CategoryDetailScene` lines 221-247 | Section E (sort/filter controls) | `MobileCategoryDetail` |
| Sort toggle (inline in alert list header) | `CategoryDetailScene` lines 252-277 | Section E (sort/filter controls) | `MobileCategoryDetail` |
| Dock panel (alert detail sidebar) | `DistrictViewDock` | Nested alert detail sheet (WS-D.2) | Separate component |
| Two-column grid layout | `CategoryDetailScene` line 719 | Single-column vertical stack with progressive disclosure | `MobileCategoryDetail` |

### Appendix D: SHEET_CONFIGS Reference

From WS-C.1 (`src/lib/interfaces/mobile.ts`):

```typescript
export const SHEET_CONFIGS = {
  categoryDetail: {
    id: 'category-detail',
    snapPoints: [35, 65, 100] as const,
    initialSnapIndex: 1,   // Opens at 65%
    dismissible: true,
  },
  // ... other configs
}
```

### Appendix E: Estimated Effort

| Component | Estimate | Notes |
|-----------|----------|-------|
| `MobileCategoryDetail.tsx` | 6-8 hours | Header, summary, severity bar, segmented control, alert list, map integration, source accordion, progressive disclosure gating, state management |
| `mobile-category-detail.css` | 1-2 hours | Token-driven styles, reduced motion, responsive tweaks |
| Unit tests (component + utils) | 3-4 hours | ~23 test cases across 2 files, mock setup for 3 hooks |
| **Total** | **10-14 hours** | |
