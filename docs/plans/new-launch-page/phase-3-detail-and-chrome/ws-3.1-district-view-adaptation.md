# WS-3.1: District View Adaptation

> **Workstream ID:** WS-3.1
> **Phase:** 3 -- Detail + Chrome
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-04
> **Last Updated:** 2026-03-04
> **Depends On:** WS-1.2, WS-1.3, WS-2.2
> **Blocks:** WS-4.1
> **Resolves:** Decision 6 (Single Generic Scene), Phase 2 Review H-1 (DistrictContent gap)

## 1. Objective

Replace the 6 hand-crafted district ambient scenes and their hard-coded routing/metadata infrastructure with a single data-driven `CategoryDetailScene` component that accepts a category ID and renders live intel data from the TarvaRI Supabase instance. Update all four district-view chrome components (`district-view-content.tsx`, `district-view-overlay.tsx`, `district-view-dock.tsx`, `district-view-header.tsx`) to resolve category metadata from `getCategoryMeta()` (WS-1.2) instead of the legacy `DISTRICTS` array. Fix the `DistrictContent` gap identified in Phase 2 Review H-1 by replacing the `DistrictContent` import in `detail-panel.tsx` with a category-aware content component. Archive the 6 legacy scene files to `src/components/district-view/scenes/_archived/`.

The gate criterion is: click any category card, observe the morph animation through to the district view overlay, and see a data-driven detail view containing a filtered alert list, severity breakdown, source health table, and a placeholder map area -- all populated with live data from the `useCoverageMetrics` and `useCoverageMapData` hooks (or graceful empty states).

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| New file: `CategoryDetailScene.tsx` | Create `src/components/district-view/scenes/CategoryDetailScene.tsx` -- a single generic scene component that accepts a `categoryId: string` prop and renders four data sections: filtered alert list, severity breakdown, source health table, and a map placeholder area. Uses `useCoverageMetrics()` and `useCoverageMapData({ category })` from WS-1.3. |
| Update: `district-view-content.tsx` | Replace the static `SCENE_MAP: Record<DistrictId, Component>` (6-entry lookup) with dynamic routing that renders `CategoryDetailScene` for any `categoryId` string. Remove all 6 scene imports. |
| Update: `district-view-overlay.tsx` | Replace `DISTRICT_TINTS: Record<DistrictId, string>` (6-entry hard-coded tints) with dynamic tint computation using `getCategoryColor()` from `src/lib/interfaces/coverage.ts` (WS-1.2). Update the `as DistrictId` cast to use the WS-1.2 `NodeId` type. |
| Update: `district-view-dock.tsx` | Replace `STATION_CONFIG: Record<DistrictId, StationConfig>` (6-entry lookup) with category metadata from `getCategoryMeta()`. Replace station list, description, URL, and port display with category-relevant information: source count, active sources, geographic regions, and severity distribution. |
| Update: `district-view-header.tsx` | Replace `DISTRICTS.find()` display name lookup with `getCategoryMeta(districtId).displayName`. Replace the health dot with a category color indicator using `getCategoryColor()`. |
| Fix: `detail-panel.tsx` DistrictContent gap (H-1) | Replace the `<DistrictContent districtId={districtId} />` render (line 149) with a category-aware content preview. After WS-2.2, the panel accepts `categoryId` but still renders `DistrictContent` which resolves nothing for category IDs. |
| Update: `scenes/index.ts` | Replace 6 scene exports with a single `CategoryDetailScene` export. |
| Archive: 6 legacy scene files | Move `agent-builder-scene.tsx`, `tarva-chat-scene.tsx`, `project-room-scene.tsx`, `tarva-core-scene.tsx`, `tarva-erp-scene.tsx`, `tarva-code-scene.tsx` to `src/components/district-view/scenes/_archived/`. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| MapLibre GL JS integration | WS-4.1 creates `CoverageMap.tsx` and `MapMarkerLayer.tsx`. This workstream creates a placeholder `<div>` with dimensions and a "Map loading..." label that WS-4.1 replaces with the real map component. |
| Chrome label updates (telemetry bar, status strip) | WS-3.2 updates `top-telemetry-bar.tsx` and `bottom-status-strip.tsx` |
| Morph animation changes | WS-2.2 completed. Morph phase state machine, timing, and animation logic are unchanged. |
| `detail-panel.tsx` positioning or motion props | WS-2.2 completed the grid-relative repositioning. This workstream only changes the content rendered inside the panel. |
| `shared-scene-primitives.tsx` deletion | The primitives (`DataStream`, `StatusDotGrid`, `GhostCounter`, `GhostText`) remain available for ambient effects elsewhere. They are not imported by `CategoryDetailScene` and can be archived in a future cleanup workstream. |
| Realtime subscriptions | Data refreshes via `refetchInterval` on the TanStack Query hooks (WS-1.3). No Supabase Realtime needed. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/lib/interfaces/coverage.ts` (WS-1.2) | `CategoryId`, `CategoryMeta`, `KNOWN_CATEGORIES`, `getCategoryMeta()`, `getCategoryColor()`, `getCategoryIcon()`, `SEVERITY_LEVELS`, `SEVERITY_COLORS`, `SeverityLevel` types and helpers | Created by WS-1.2 |
| `src/lib/interfaces/district.ts` (WS-1.2) | `NodeId = string` type alias (replaces `DistrictId`), deprecated `DistrictId` alias still available for transition | Created by WS-1.2 |
| `src/hooks/use-coverage-metrics.ts` (WS-1.3) | `useCoverageMetrics()` returning `CoverageMetrics` with `byCategory: CoverageByCategory[]` and `sourcesByCoverage: SourceCoverage[]` | Created by WS-1.3 |
| `src/hooks/use-coverage-map-data.ts` (WS-1.3) | `useCoverageMapData({ category })` returning `MapMarker[]` filtered by category | Created by WS-1.3 |
| `src/stores/coverage.store.ts` (WS-1.3) | `useCoverageStore` with `selectedCategory` state (for potential sync) | Created by WS-1.3 |
| `src/components/districts/detail-panel.tsx` (WS-2.2) | `DetailPanel` now accepts `categoryId: NodeId` prop (was `districtId: DistrictId`), `ringIndex` removed, `dockSide` removed (always right). Currently renders stale `DistrictContent` or placeholder. | Modified by WS-2.2 |
| `src/lib/morph-types.ts` (WS-2.2) | `PanelSide` type, `MorphPhase` type, `DETAIL_PANEL_DIMENSIONS` | Available (modified by WS-2.2) |
| `src/components/district-view/district-view-overlay.tsx` | Current file: `DISTRICT_TINTS` 6-entry record (line 36-43), `getPanelSideForDistrict()` helper (lines 49-53), component renders `DistrictViewContent`, `DistrictViewHeader`, `DistrictViewDock` (lines 109-119) | Available (125 lines) |
| `src/components/district-view/district-view-content.tsx` | Current file: `SCENE_MAP` 6-entry record (lines 26-33), `DistrictViewContentProps` with `districtId: DistrictId` and `panelSide: PanelSide` (lines 39-42), renders `<Scene dockSide={panelSide} />` (line 61) | Available (64 lines) |
| `src/components/district-view/district-view-dock.tsx` | Current file: `STATION_CONFIG` 6-entry record (lines 28-59), `DistrictViewDockProps` with `districtId: DistrictId` and `panelSide: PanelSide` (lines 65-68), renders district name, port, description, URL button, status, station list (lines 74-236) | Available (237 lines) |
| `src/components/district-view/district-view-header.tsx` | Current file: `DistrictViewHeaderProps` with `districtId: DistrictId`, `panelSide: PanelSide`, `onBack: () => void` (lines 26-30), `DISTRICTS.find()` lookup for displayName (line 109), health dot with hardcoded green (lines 158-168) | Available (219 lines) |
| `src/components/district-view/scenes/` | 6 scene files (agent-builder-scene.tsx 8185B, tarva-chat-scene.tsx 6516B, project-room-scene.tsx 8944B, tarva-core-scene.tsx 8180B, tarva-erp-scene.tsx 10123B, tarva-code-scene.tsx 8554B) + `index.ts` barrel (7 lines) | Available |
| `src/components/districts/detail-panel.tsx` | Line 149: `<DistrictContent districtId={districtId} />`. After WS-2.2 this becomes `<DistrictContent districtId={categoryId} />` or a placeholder. This is the H-1 gap. | Available (modified by WS-2.2) |
| `src/components/districts/district-content.tsx` | Current file: `DISTRICT_CONFIG` 6-entry record (lines 40-83), renders `StationCard` components with launch button, status, and station list (lines 157-245). Uses `useDistrictsStore` for telemetry. | Available (247 lines) |

## 4. Deliverables

### 4.1 Create `CategoryDetailScene.tsx`

**Path:** `src/components/district-view/scenes/CategoryDetailScene.tsx`

A single generic scene component implementing Decision 6 (Single Generic Scene). It renders inside the district view overlay's content area (the `DistrictViewContent` component), replacing all 6 legacy ambient scenes.

#### 4.1.1 Props Interface

```typescript
import type { PanelSide } from '@/lib/morph-types'

interface CategoryDetailSceneProps {
  /** Category ID to display detail data for. */
  readonly categoryId: string
  /** Which side the dock panel is on, so the scene clears space. */
  readonly dockSide: PanelSide
}
```

The `dockSide` prop follows the existing scene contract established by the legacy scenes (e.g., `AgentBuilderScene` accepts `{ dockSide: PanelSide }`). It determines which side of the viewport to leave clear for the dock panel.

#### 4.1.2 Data Fetching

The scene uses two TanStack Query hooks from WS-1.3:

```typescript
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { useCoverageMapData } from '@/hooks/use-coverage-map-data'

// Inside component:
const { data: metrics, isLoading: metricsLoading, error: metricsError } = useCoverageMetrics()
const { data: markers = [], isLoading: mapLoading } = useCoverageMapData({ category: categoryId })
```

Category-specific data is derived from the metrics response:

```typescript
const categoryMetrics = metrics?.byCategory.find((c) => c.category === categoryId)
const categorySources = metrics?.sourcesByCoverage.filter((s) => s.category === categoryId) ?? []
```

#### 4.1.3 Layout Structure

The scene renders four data sections arranged in a two-column layout. The layout clears the dock panel side (360px wide) using the `dockSide` prop:

```
+-------------------------------------------------------+
| [Filtered Alert List]        | [Severity Breakdown]   |
| (scrollable, left column)    | (compact chart, right)  |
|                              |                         |
+------------------------------+-------------------------+
| [Source Health Table]        | [Map Placeholder]       |
| (sortable table, left)       | (WS-4.1 replaces this) |
+------------------------------+-------------------------+
```

The content area is positioned `absolute` with `inset: 0`, offset by 360px on the dock side and 80px on the opposite side (for the back button), 80px from top (for the header), and 40px from bottom. This matches the spatial clearances used by the legacy scenes.

```typescript
const contentInset: React.CSSProperties = {
  position: 'absolute',
  top: 80,
  bottom: 40,
  [dockSide]: 380,          // 360px dock + 20px gap
  [dockSide === 'right' ? 'left' : 'right']: 80,
  overflow: 'hidden',
}
```

#### 4.1.4 Section A: Filtered Alert List

Displays intel items from `useCoverageMapData({ category: categoryId })` as a scrollable list. Each item shows:

- Title (from `MapMarker.title`)
- Severity badge (color from `SEVERITY_COLORS[marker.severity]`)
- Ingested timestamp (relative, e.g., "2h ago" from `MapMarker.ingestedAt`)

The list is sorted by `ingestedAt` descending (most recent first). Capped at 50 items with a "Showing N of M" footer when truncated.

Loading state: 5 skeleton rows (pulsing `bg-white/[0.04]` rectangles).
Empty state: "No alerts for {displayName}" message with ghost text styling.
Error state: "Unable to load alerts" with retry prompt.

#### 4.1.5 Section B: Severity Breakdown

A horizontal stacked bar showing the count of alerts per severity level for this category. Uses `SEVERITY_LEVELS` and `SEVERITY_COLORS` from `src/lib/interfaces/coverage.ts` (WS-1.2).

Computed from the `markers` array:

```typescript
const severityCounts = SEVERITY_LEVELS.map((level) => ({
  level,
  count: markers.filter((m) => m.severity === level).length,
  color: SEVERITY_COLORS[level],
}))
```

Each bar segment is proportional to count / total. Below the bar, a legend row shows the severity label and count.

If no markers exist, display "No severity data" in ghost text.

#### 4.1.6 Section C: Source Health Table

A compact table of intel sources for this category, derived from `categorySources` (filtered from `metrics.sourcesByCoverage`). Columns:

| Column | Source Field | Width |
|--------|-------------|-------|
| Name | `SourceCoverage.name` | flex |
| Status | `SourceCoverage.status` | 80px |
| Region | `SourceCoverage.geographicCoverage` | 100px |
| Frequency | `SourceCoverage.updateFrequency` | 80px |

Status values are displayed with color indicators:
- `active`: green dot (`var(--color-healthy, #22c55e)`)
- `staging`: blue dot (`var(--color-info, #3b82f6)`)
- `quarantine`: orange dot (`var(--color-warning, #eab308)`)
- `disabled`: gray dot (`var(--color-offline, #6b7280)`)

The table uses the existing dock glass styling (`bg-white/[0.04] backdrop-blur-[16px]`). Rows use `font-mono text-[11px]` styling consistent with the dock panel's design language.

Loading state: 3 skeleton rows.
Empty state: "No sources for {displayName}" ghost text.

#### 4.1.7 Section D: Map Placeholder

A reserved area where WS-4.1 will mount the MapLibre GL JS component. Per Decision 5, the map lives inside the district view overlay (fixed position, no CSS transforms) to avoid WebGL rendering issues.

For this workstream, render a placeholder:

```typescript
<div
  style={{
    width: '100%',
    height: '100%',
    minHeight: 200,
    borderRadius: 8,
    border: '1px dashed rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  <span
    style={{
      fontFamily: 'var(--font-mono, monospace)',
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.15)',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    }}
  >
    Map -- WS-4.1
  </span>
</div>
```

The placeholder preserves the layout slot so Section C does not stretch to fill the space. WS-4.1 replaces this `<div>` with `<CoverageMap category={categoryId} markers={markers} />`.

#### 4.1.8 Styling Conventions

All text uses the established district-view design language:
- Labels: `font-mono text-[9px] font-medium tracking-[0.1em] uppercase` at `rgba(255, 255, 255, 0.15)`
- Values: `font-mono text-[11px]` at `rgba(255, 255, 255, 0.25)`
- Headings: `font-mono text-[13px] font-medium tracking-[0.08em] uppercase` at `rgba(255, 255, 255, 0.3)`
- Borders: `border-white/[0.06]`
- Backgrounds: `bg-white/[0.02]` for rows, `bg-white/[0.04]` for headers
- Section separators: `height: 1px, backgroundColor: rgba(255, 255, 255, 0.04)` (matches dock panel separators, line 165-168 of `district-view-dock.tsx`)

The component is wrapped in `React.memo` following the convention of all legacy scenes (e.g., `AgentBuilderScene` at line 213 of `agent-builder-scene.tsx`).

#### 4.1.9 Accessibility

Unlike the legacy ambient scenes (which were `aria-hidden="true"` and `pointerEvents: 'none'`), `CategoryDetailScene` contains interactive, data-bearing content. It must NOT be `aria-hidden`:

- The alert list items are focusable with appropriate `role="list"` and `role="listitem"`.
- The source health table uses `<table>` with `<thead>` and `<th scope="col">` headers.
- The severity breakdown has `aria-label` describing the distribution (e.g., "Severity breakdown: 12 Extreme, 5 Severe, 3 Moderate").
- Loading states use `aria-busy="true"` on the section container.
- The map placeholder has `role="img"` with `aria-label="Map placeholder, coming soon"`.

---

### 4.2 Update `district-view-content.tsx` -- Dynamic Category Routing

**Path:** `src/components/district-view/district-view-content.tsx`

#### 4.2.1 Remove Static Scene Imports and SCENE_MAP

Remove lines 12-33 entirely:

```typescript
// REMOVE (lines 12-20):
import {
  AgentBuilderScene,
  TarvaChatScene,
  ProjectRoomScene,
  TarvaCoreScene,
  TarvaErpScene,
  TarvaCodeScene,
} from './scenes'

// REMOVE (lines 26-33):
const SCENE_MAP: Record<DistrictId, React.ComponentType<{ dockSide: PanelSide }>> = {
  'agent-builder': AgentBuilderScene,
  'tarva-chat': TarvaChatScene,
  'project-room': ProjectRoomScene,
  'tarva-core': TarvaCoreScene,
  'tarva-erp': TarvaErpScene,
  'tarva-code': TarvaCodeScene,
}
```

#### 4.2.2 Add CategoryDetailScene Import

```typescript
import { CategoryDetailScene } from './scenes'
```

#### 4.2.3 Update Type Imports

```typescript
// BEFORE:
import type { DistrictId } from '@/lib/interfaces/district'

// AFTER:
import type { NodeId } from '@/lib/interfaces/district'
```

Note: if WS-1.2 has `DistrictId` as a deprecated alias for `NodeId`, both work. Prefer `NodeId` for new code.

#### 4.2.4 Update Props Interface

```typescript
// BEFORE (lines 39-42):
interface DistrictViewContentProps {
  readonly districtId: DistrictId
  readonly panelSide: PanelSide
}

// AFTER:
interface DistrictViewContentProps {
  readonly districtId: NodeId
  readonly panelSide: PanelSide
}
```

Keep the prop name `districtId` for backward compatibility with the overlay component that passes it (line 109 of `district-view-overlay.tsx`). Renaming the overlay's prop is not in scope.

#### 4.2.5 Replace Scene Lookup with Direct Render

```typescript
// BEFORE (lines 48-63):
export function DistrictViewContent({ districtId, panelSide }: DistrictViewContentProps) {
  const Scene = SCENE_MAP[districtId]
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <Scene dockSide={panelSide} />
    </div>
  )
}

// AFTER:
export function DistrictViewContent({ districtId, panelSide }: DistrictViewContentProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      <CategoryDetailScene categoryId={districtId} dockSide={panelSide} />
    </div>
  )
}
```

Key changes:
1. Remove `SCENE_MAP` lookup. Render `CategoryDetailScene` directly for all IDs.
2. Remove `pointerEvents: 'none'` -- the scene now contains interactive content (alert list, table).
3. Remove `aria-hidden="true"` -- the scene now contains meaningful data content.

---

### 4.3 Update `district-view-overlay.tsx` -- Dynamic Category Tints

**Path:** `src/components/district-view/district-view-overlay.tsx`

#### 4.3.1 Remove Static DISTRICT_TINTS Record

Remove lines 36-43:

```typescript
// REMOVE:
const DISTRICT_TINTS: Record<DistrictId, string> = {
  'agent-builder': 'rgba(var(--ember-rgb), 0.06)',
  'tarva-chat': 'rgba(14, 165, 233, 0.06)',
  'project-room': 'rgba(var(--healthy-rgb), 0.04)',
  'tarva-core': 'rgba(168, 85, 247, 0.05)',
  'tarva-erp': 'rgba(245, 158, 11, 0.04)',
  'tarva-code': 'rgba(99, 102, 241, 0.04)',
}
```

#### 4.3.2 Add Category Color Import

```typescript
// ADD:
import { getCategoryColor } from '@/lib/interfaces/coverage'
```

#### 4.3.3 Replace Tint Lookup with Dynamic Computation

Replace the `DISTRICT_TINTS[districtId]` lookup on line 101 with a function that converts the category color (a CSS `var()` with hex fallback) into an rgba tint:

```typescript
/**
 * Compute a subtle radial gradient tint color from a category's display color.
 * Extracts the hex fallback from the CSS var() string and converts to rgba at 0.05 opacity.
 */
function getCategoryTint(categoryId: string): string {
  const color = getCategoryColor(categoryId)
  // getCategoryColor returns e.g. 'var(--category-seismic, #ef4444)'
  // Extract the hex fallback for inline style usage
  const hexMatch = color.match(/#([0-9a-fA-F]{6})/)
  if (!hexMatch) return 'rgba(255, 255, 255, 0.03)' // safe fallback
  const hex = hexMatch[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.05)`
}
```

Update the gradient background (line 101):

```typescript
// BEFORE:
background: `radial-gradient(ellipse at ${gradientOrigin}, ${DISTRICT_TINTS[districtId]} 0%, transparent 70%)`,

// AFTER:
background: `radial-gradient(ellipse at ${gradientOrigin}, ${getCategoryTint(districtId)} 0%, transparent 70%)`,
```

#### 4.3.4 Update Type Imports

```typescript
// BEFORE (line 26):
import { DISTRICTS, type DistrictId } from '@/lib/interfaces/district'

// AFTER:
import type { NodeId } from '@/lib/interfaces/district'
```

Remove the `DISTRICTS` import -- it is only used by `getPanelSideForDistrict()` (see 4.3.5).

#### 4.3.5 Simplify `getPanelSideForDistrict`

The current helper (lines 49-53) looks up the district's `ringIndex` from the `DISTRICTS` array and calls `computeRingRotation()`. After WS-2.2, ring rotation is removed from `morph-types.ts`. The panel is always on the right.

```typescript
// BEFORE (lines 49-53):
function getPanelSideForDistrict(districtId: DistrictId): PanelSide {
  const district = DISTRICTS.find((d) => d.id === districtId)
  if (!district) return 'right'
  return computeRingRotation(district.ringIndex).panelSide
}

// AFTER:
function getPanelSideForCategory(_categoryId: string): PanelSide {
  // After WS-2.2, the dock always appears on the right.
  // Per grid layout Decision 3, panel docks to the right of the viewport.
  return 'right'
}
```

If `computeRingRotation` has been removed by WS-2.2, this function must be simplified regardless. The rename and simplification makes the intent clear.

#### 4.3.6 Update the DistrictId Cast

Line 69 currently casts `targetId` as `DistrictId | null`:

```typescript
// BEFORE (line 69):
const districtId = targetId as DistrictId | null

// AFTER:
const districtId = targetId as NodeId | null
```

After WS-1.2, `DistrictId = NodeId = string`, so the cast is effectively a no-op. But updating the type annotation documents the intent.

---

### 4.4 Update `district-view-dock.tsx` -- Category Metadata

**Path:** `src/components/district-view/district-view-dock.tsx`

#### 4.4.1 Remove Static STATION_CONFIG Record

Remove lines 22-59 entirely (the `StationConfig` interface and `STATION_CONFIG` record).

#### 4.4.2 Remove Legacy Imports

```typescript
// REMOVE:
import { DISTRICTS, type DistrictId } from '@/lib/interfaces/district'
```

#### 4.4.3 Add Category Imports

```typescript
import { getCategoryMeta, getCategoryColor, type CategoryMeta } from '@/lib/interfaces/coverage'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import type { NodeId } from '@/lib/interfaces/district'
```

#### 4.4.4 Update Props Interface

```typescript
// BEFORE (lines 65-68):
interface DistrictViewDockProps {
  readonly districtId: DistrictId
  readonly panelSide: PanelSide
}

// AFTER:
interface DistrictViewDockProps {
  readonly districtId: NodeId
  readonly panelSide: PanelSide
}
```

Keep prop name `districtId` for backward compatibility with the overlay (line 119).

#### 4.4.5 Replace Component Body

The dock currently shows: district name, port, description, "Open" button (if URL), status section with green health dot, and station list. Replace with category-relevant content:

1. **Category name** -- from `getCategoryMeta(districtId).displayName`
2. **Category short name** -- from `getCategoryMeta(districtId).shortName` (replaces port display)
3. **Category description** -- from `getCategoryMeta(districtId).description`
4. **No "Open" button** -- categories do not have external URLs. Remove the `handleOpenApp` callback and button.
5. **Source count section** (replaces STATUS section) -- shows `N sources (M active)` from `useCoverageMetrics()`, filtered to this category
6. **Geographic regions** (replaces STATIONS section) -- shows the `geographicRegions` array from `CoverageByCategory` as tag pills

```typescript
export function DistrictViewDock({ districtId, panelSide }: DistrictViewDockProps) {
  const meta = getCategoryMeta(districtId)
  const categoryColor = getCategoryColor(districtId)
  const { data: metrics } = useCoverageMetrics()
  const categoryData = metrics?.byCategory.find((c) => c.category === districtId)

  const isRight = panelSide === 'right'
  const slideFrom = isRight ? 40 : -40

  return (
    <motion.div /* ...existing glass panel styling unchanged... */>
      <div className="flex flex-col gap-0 px-6 pt-8 pb-8">
        {/* Category name */}
        <span
          className="block font-mono text-[18px] font-medium tracking-[0.08em] uppercase"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          {meta.displayName}
        </span>

        {/* Category short code */}
        <span
          className="mt-1 block font-mono text-[11px] tracking-wider"
          style={{ color: categoryColor, opacity: 0.4 }}
        >
          {meta.shortName}
        </span>

        {/* Description */}
        <p
          className="mt-4 font-mono text-[11px] leading-[1.5]"
          style={{ color: 'rgba(255, 255, 255, 0.25)' }}
        >
          {meta.description}
        </p>

        {/* Separator */}
        <div className="my-5" style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' }} />

        {/* Sources section (replaces STATUS) */}
        <div className="flex flex-col gap-2">
          <span className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
                style={{ color: 'rgba(255, 255, 255, 0.15)' }}>
            SOURCES
          </span>
          {categoryData ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px]"
                      style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
                  {categoryData.sourceCount} sources
                </span>
                <span className="font-mono text-[11px]"
                      style={{ color: 'rgba(255, 255, 255, 0.15)' }}>
                  ({categoryData.activeSources} active)
                </span>
              </div>
            </>
          ) : (
            <span className="font-mono text-[11px]"
                  style={{ color: 'rgba(255, 255, 255, 0.15)' }}>
              No source data
            </span>
          )}
        </div>

        {/* Separator */}
        <div className="my-5" style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' }} />

        {/* Geographic regions (replaces STATIONS) */}
        <div className="flex flex-col gap-3">
          <span className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
                style={{ color: 'rgba(255, 255, 255, 0.15)' }}>
            COVERAGE REGIONS
          </span>
          <div className="flex flex-wrap gap-2">
            {(categoryData?.geographicRegions ?? []).length > 0 ? (
              categoryData!.geographicRegions.map((region) => (
                <span key={region}
                      className="rounded-md px-2.5 py-1 border border-white/[0.06] bg-white/[0.02]
                                 font-mono text-[9px] tracking-[0.08em] uppercase"
                      style={{ color: 'rgba(255, 255, 255, 0.2)' }}>
                  {region}
                </span>
              ))
            ) : (
              <span className="font-mono text-[9px]"
                    style={{ color: 'rgba(255, 255, 255, 0.12)' }}>
                No region data
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

The glass panel styling (`className` and `style` on the outer `motion.div`), slide animation props (`initial`, `animate`, `exit`, `transition`), and positioning logic (`fixed top-[42px] bottom-0 w-[360px]`) remain unchanged from the current implementation.

---

### 4.5 Update `district-view-header.tsx` -- Category Names

**Path:** `src/components/district-view/district-view-header.tsx`

#### 4.5.1 Remove Legacy Imports

```typescript
// REMOVE (line 19):
import { DISTRICTS, type DistrictId } from '@/lib/interfaces/district'

// ADD:
import { getCategoryMeta, getCategoryColor } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'
```

#### 4.5.2 Update Props Interface

```typescript
// BEFORE (lines 26-30):
interface DistrictViewHeaderProps {
  readonly districtId: DistrictId
  readonly panelSide: PanelSide
  readonly onBack: () => void
}

// AFTER:
interface DistrictViewHeaderProps {
  readonly districtId: NodeId
  readonly panelSide: PanelSide
  readonly onBack: () => void
}
```

#### 4.5.3 Replace Display Name Resolution

```typescript
// BEFORE (lines 109-110):
const district = DISTRICTS.find((d) => d.id === districtId)
const displayName = district?.displayName ?? districtId

// AFTER:
const meta = getCategoryMeta(districtId)
const displayName = meta.displayName
const categoryColor = getCategoryColor(districtId)
```

`getCategoryMeta()` always returns a valid `CategoryMeta` object (falls back to the 'other' entry for unknown IDs), so no null check is needed.

#### 4.5.4 Replace Health Dot with Category Color Indicator

The health dot (lines 158-168) currently uses a hard-coded green color (`var(--color-healthy, #22c55e)`). Replace with the category's display color:

```typescript
// BEFORE (lines 158-168):
<div
  className="district-health-dot-pulse"
  style={{
    width: 4,
    height: 4,
    borderRadius: '50%',
    backgroundColor: 'var(--color-healthy, #22c55e)',
    flexShrink: 0,
  }}
  aria-hidden="true"
/>

// AFTER:
<div
  style={{
    width: 4,
    height: 4,
    borderRadius: '50%',
    backgroundColor: categoryColor,
    opacity: 0.6,
    flexShrink: 0,
  }}
  aria-hidden="true"
/>
```

Remove the `district-health-dot-pulse` CSS class -- category indicators do not pulse. The `opacity: 0.6` keeps the dot subtle, consistent with the overall district-view design language.

#### 4.5.5 Update Back Button aria-label

```typescript
// BEFORE (line 210):
aria-label={`Back to hub from ${displayName}`}

// No change needed -- displayName is now the category display name, which is accurate.
```

---

### 4.6 Fix `detail-panel.tsx` DistrictContent Gap (Phase 2 Review H-1)

**Path:** `src/components/districts/detail-panel.tsx`

#### 4.6.1 Problem Statement

After WS-2.2, `detail-panel.tsx` accepts a `categoryId` prop but its content area (line 149) still renders `<DistrictContent districtId={districtId} />`. The `DistrictContent` component (from `src/components/districts/district-content.tsx`) uses a `DISTRICT_CONFIG` record keyed by the 6 legacy district IDs. When `categoryId` is a category string like `'seismic'`, the lookup returns `undefined` and the component renders broken or empty content.

This is the H-1 issue from the Phase 2 Review.

#### 4.6.2 Solution

Replace the `DistrictContent` import and render with a lightweight category content preview that uses `getCategoryMeta()` and `useCoverageMetrics()`. This is a simpler version of the dock content -- just the category name, description, and source count -- serving as the panel content during the `expanding` and `settled` morph phases (before the full-screen district view overlay takes over).

```typescript
// REMOVE (line 26):
import { DistrictContent } from './district-content'

// ADD:
import { getCategoryMeta } from '@/lib/interfaces/coverage'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
```

Replace the content render (line 148-149):

```typescript
// BEFORE:
<div className="flex flex-1 flex-col gap-4 overflow-auto">
  <DistrictContent districtId={districtId} />
</div>

// AFTER:
<div className="flex flex-1 flex-col gap-4 overflow-auto">
  <CategoryPanelContent categoryId={categoryId} />
</div>
```

The `CategoryPanelContent` is a small inline component (or extracted to the same file) that renders:

```typescript
function CategoryPanelContent({ categoryId }: { categoryId: string }) {
  const meta = getCategoryMeta(categoryId)
  const { data: metrics } = useCoverageMetrics()
  const categoryData = metrics?.byCategory.find((c) => c.category === categoryId)

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="font-sans text-[24px] leading-relaxed text-[var(--color-text-secondary)]">
        {meta.description}
      </p>

      {/* Source summary */}
      {categoryData && (
        <div className="flex items-center gap-3">
          <span className="font-sans text-[20px] text-[var(--color-text-tertiary)]">
            {categoryData.sourceCount} sources
          </span>
          <span className="font-sans text-[20px] text-[var(--color-text-ghost)]">
            {categoryData.activeSources} active
          </span>
        </div>
      )}

      {/* Region tags */}
      {categoryData && categoryData.geographicRegions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {categoryData.geographicRegions.map((region) => (
            <span
              key={region}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-1.5
                         font-sans text-[20px] text-[var(--color-text-tertiary)]"
            >
              {region}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
```

The styling matches `DistrictContent`'s `StationCard` patterns (font sizes, spacing, color tokens from lines 141, 173-194 of `district-content.tsx`).

#### 4.6.3 Update Display Name

After WS-2.2, the panel header renders `displayName` which was set to `categoryId` (the raw string). Update to use `getCategoryMeta`:

```typescript
// BEFORE (WS-2.2 state):
const displayName = categoryId

// AFTER:
const displayName = getCategoryMeta(categoryId).displayName
```

This addresses WS-2.2 OQ-1 (whether to resolve display name in WS-2.2 or WS-3.1).

---

### 4.7 Update `scenes/index.ts` and Archive Legacy Scenes

**Path:** `src/components/district-view/scenes/index.ts`

#### 4.7.1 Update Barrel Export

```typescript
// BEFORE (7 lines):
export { AgentBuilderScene } from './agent-builder-scene'
export { TarvaChatScene } from './tarva-chat-scene'
export { ProjectRoomScene } from './project-room-scene'
export { TarvaCoreScene } from './tarva-core-scene'
export { TarvaErpScene } from './tarva-erp-scene'
export { TarvaCodeScene } from './tarva-code-scene'

// AFTER:
export { CategoryDetailScene } from './CategoryDetailScene'
```

#### 4.7.2 Archive Legacy Scene Files

Create the archive directory and move files:

```bash
mkdir -p src/components/district-view/scenes/_archived
mv src/components/district-view/scenes/agent-builder-scene.tsx \
   src/components/district-view/scenes/tarva-chat-scene.tsx \
   src/components/district-view/scenes/project-room-scene.tsx \
   src/components/district-view/scenes/tarva-core-scene.tsx \
   src/components/district-view/scenes/tarva-erp-scene.tsx \
   src/components/district-view/scenes/tarva-code-scene.tsx \
   src/components/district-view/scenes/_archived/
```

#### 4.7.3 Verify No Active Imports

Before archiving, verify no other files import the legacy scenes:

```bash
pnpm exec grep -r "AgentBuilderScene\|TarvaChatScene\|ProjectRoomScene\|TarvaCoreScene\|TarvaErpScene\|TarvaCodeScene" src/ --include="*.ts" --include="*.tsx" -l
```

Expected results:
- `src/components/district-view/scenes/index.ts` -- being replaced (4.7.1)
- `src/components/district-view/district-view-content.tsx` -- being replaced (4.2)
- The 6 scene files themselves -- being archived

If any other files import these scenes, they must be updated before archiving.

## 5. Acceptance Criteria

### Gate Criterion

**AC-GATE:** Click any category card on the coverage grid, observe the morph animation through to the district view overlay, and see a data-driven detail view with all four sections rendered (alert list, severity breakdown, source health table, map placeholder). The detail view uses live data from `useCoverageMetrics()` and `useCoverageMapData()`, or displays appropriate empty/loading states. Press Escape to reverse the morph back to the grid.

### CategoryDetailScene (4.1)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-1 | `CategoryDetailScene` renders without errors for all 15 known category IDs | Pass each of the 15 `KNOWN_CATEGORIES` IDs as `categoryId` prop; no runtime errors in console |
| AC-2 | `CategoryDetailScene` renders a fallback for unknown category IDs (e.g., `'nonexistent'`) | Pass `'nonexistent'` as `categoryId`; component renders with "Other" styling and empty data states |
| AC-3 | Alert list section shows filtered intel items for the selected category | Navigate to a category with known data; list shows markers from `useCoverageMapData({ category: id })` |
| AC-4 | Alert list shows loading skeleton during fetch | Observe initial render shows pulsing skeleton rows before data arrives |
| AC-5 | Alert list shows empty state when no alerts exist for category | Navigate to a category with no intel items; see "No alerts for {name}" message |
| AC-6 | Severity breakdown bar renders proportional segments with correct colors | Visual check: bar segments correspond to alert severity counts |
| AC-7 | Source health table shows sources filtered to the selected category | Table rows match `sourcesByCoverage.filter(s => s.category === categoryId)` |
| AC-8 | Source status indicators use correct colors (green/blue/orange/gray) | Visual check per status value |
| AC-9 | Map placeholder renders with correct dimensions and "Map -- WS-4.1" label | Visual check: dashed-border placeholder visible in lower-right quadrant |
| AC-10 | Scene is accessible: table has proper headers, list has roles, loading states have `aria-busy` | Manual keyboard navigation and screen reader spot-check |

### District View Content Routing (4.2)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-11 | `DistrictViewContent` renders `CategoryDetailScene` for any `districtId` string | Set `districtId` to various category IDs; `CategoryDetailScene` renders for each |
| AC-12 | No static `SCENE_MAP` lookup remains | Grep for `SCENE_MAP` in `district-view-content.tsx`; zero results |
| AC-13 | Content area is NOT `aria-hidden` and NOT `pointerEvents: 'none'` | Inspect DOM; confirm interactive elements are reachable |

### District View Overlay Tints (4.3)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-14 | Overlay background tint uses the selected category's color | Navigate to 'seismic' (red), 'weather' (blue), 'health' (green); observe matching radial gradient tint |
| AC-15 | No static `DISTRICT_TINTS` record remains | Grep for `DISTRICT_TINTS` in `district-view-overlay.tsx`; zero results |
| AC-16 | Unknown category IDs produce a valid fallback tint (gray) | Navigate to unknown category; observe neutral gray tint |

### District View Dock (4.4)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-17 | Dock shows category display name (not raw ID string) | Navigate to 'seismic'; dock shows "Seismic" not "seismic" |
| AC-18 | Dock shows category description from `getCategoryMeta()` | Compare dock description text with `KNOWN_CATEGORIES` description |
| AC-19 | Dock shows source count and active source count for the category | Compare with `useCoverageMetrics()` data for the same category |
| AC-20 | Dock shows geographic region tags for the category | Compare with `CoverageByCategory.geographicRegions` for the same category |
| AC-21 | No static `STATION_CONFIG` record remains | Grep for `STATION_CONFIG` in `district-view-dock.tsx`; zero results |
| AC-22 | No "Open" button or port display remains | Visual check: no external link button, no "localhost:" text |

### District View Header (4.5)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-23 | Header shows category display name | Navigate to 'weather'; header shows "Weather" |
| AC-24 | Category color indicator dot uses the category's color | Navigate to 'seismic'; dot is red-tinted. Navigate to 'weather'; dot is blue-tinted. |
| AC-25 | Health dot pulse animation is removed | Inspect DOM; no `district-health-dot-pulse` class on the indicator |

### Detail Panel H-1 Fix (4.6)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-26 | Detail panel renders category description and source summary for category IDs | Click a category card; panel shows description, source count, region tags |
| AC-27 | Detail panel renders display name (not raw ID) in header | Click 'seismic'; header shows "Seismic" |
| AC-28 | No import of `DistrictContent` from `district-content.tsx` remains in `detail-panel.tsx` | Grep for `DistrictContent` in `detail-panel.tsx`; zero results |

### Scene Archival (4.7)

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC-29 | 6 legacy scene files are moved to `scenes/_archived/` | `ls src/components/district-view/scenes/_archived/` shows 6 files |
| AC-30 | `scenes/index.ts` exports only `CategoryDetailScene` | Read file; single export line |
| AC-31 | `pnpm typecheck` passes with zero errors | Run `pnpm typecheck`; exit code 0 |
| AC-32 | `pnpm build` succeeds | Run `pnpm build`; exit code 0 |
| AC-33 | No active-code imports reference the 6 archived scene names | Grep for scene component names in `src/`; only matches are in `_archived/` |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Single `CategoryDetailScene` for all categories (Decision 6) | 15+ categories make per-category scenes impractical. Data-driven approach means new categories from the DB automatically render correctly. | Per-category scenes (rejected: too much boilerplate, doesn't scale). Template-per-type with 3-4 layouts (rejected: artificial categorization of categories, same data shape for all). |
| D-2 | `getCategoryTint()` converts hex fallback, not CSS custom property | Inline `style` attributes cannot use `var()` inside `rgba()` in a computed gradient string. The hex fallback from `getCategoryColor()` (e.g., `#ef4444` from `var(--category-seismic, #ef4444)`) provides a reliable value for runtime computation. | Use CSS custom properties with `color-mix()` (rejected: browser support for `color-mix()` in gradient functions is inconsistent). Precompute all tints as constants (rejected: doesn't handle unknown categories). |
| D-3 | Panel side is always `'right'` after WS-2.2 | WS-2.2 removed ring rotation. Grid layout Decision 3 docks the detail panel to the right. The `getPanelSideForDistrict` function simplifies to always return `'right'`. | Keep left/right dynamic (rejected: no UI need, adds complexity for no benefit). |
| D-4 | Keep `districtId` prop name in overlay/dock/header components | The overlay, dock, and header receive their ID prop from `DistrictViewOverlay` (line 109, 116, 119 of `district-view-overlay.tsx`). Renaming the prop in all three child components requires also renaming the prop pass-through in the overlay. This is a pure rename with no functional benefit -- the type has already been widened to `NodeId = string` by WS-1.2. | Rename all to `categoryId` (rejected: risk of merge conflicts with WS-3.2 which also touches these files; rename can be done in a cleanup pass). |
| D-5 | `CategoryPanelContent` (H-1 fix) is defined inline in `detail-panel.tsx` | The component is small (~30 lines), used only in this one place, and exists primarily as a bridge until the full district view overlay renders the `CategoryDetailScene`. Extracting to a separate file would add a new file with a single consumer. | Extract to `src/components/districts/category-panel-content.tsx` (viable but unnecessary for a bridge component). Render nothing and wait for overlay (rejected: creates a visible gap during the `expanding` + `settled` morph phases where the panel is visible but empty). |
| D-6 | Map placeholder uses a `<div>` with dashed border, not a canvas stub | A canvas or WebGL stub would add complexity and possibly confuse WS-4.1 which needs to mount MapLibre fresh. A styled `<div>` communicates "something goes here" without creating technical debt. | Mount a blank MapLibre instance (rejected: adds the MapLibre dependency to this workstream; WS-4.1 owns the MapLibre install). |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the `CategoryDetailScene` alert list items be clickable (linking to a full alert detail view)? The current design shows a list of alert titles and severity badges. A click handler would need a destination view that doesn't exist yet. | react-developer | Phase 5 (post-map) -- recommendation: no click handler in this workstream. Display-only list. Add interactivity in a future workstream if needed. |
| OQ-2 | The severity breakdown uses a horizontal stacked bar. Should this be a donut/ring chart instead to match the spatial "mission control" aesthetic? | react-developer | Phase 3 (this WS) -- recommendation: horizontal bar. It is simpler to implement, reads well at the small size available, and avoids introducing a charting library dependency. If the team prefers a ring chart, it can be swapped in a follow-up. |
| OQ-3 | Should `shared-scene-primitives.tsx` be archived alongside the 6 scene files, or kept? It is still imported by 0 active files after the scene archival (only the archived scenes use it). However, the primitives (`DataStream`, `GhostText`, `GhostCounter`, `StatusDotGrid`) are generic and could be useful for future ambient effects. | react-developer | Phase 3 (this WS) -- recommendation: keep. The primitives are generic, well-documented, and have no maintenance cost. Archiving can happen in a cleanup workstream if they remain unused after Phase 4. |
| OQ-4 | The `district-content.tsx` file (`src/components/districts/district-content.tsx`) with the legacy `DISTRICT_CONFIG` and `StationCard` -- should it be archived? After the H-1 fix removes its import from `detail-panel.tsx`, it has zero active consumers. | react-developer | Phase 3 (this WS) -- recommendation: archive. Move to `src/components/districts/_archived/district-content.tsx`. It is dead code after the H-1 fix. |
| OQ-5 | The `district-view-dock.tsx` currently has a `handleOpenApp` callback for external URLs. Categories do not have URLs. Should the dock support a future "Open category dashboard" button that navigates to a dedicated category page within the app? | react-developer | Post-Phase 4 -- recommendation: no button in this workstream. The dock shows metadata only. Navigation is via the morph back button. |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `getCategoryMeta()` or `getCategoryColor()` from WS-1.2 not yet implemented when this workstream starts | Medium | High (all 4 deliverables depend on these helpers) | Verify WS-1.2 is complete before starting. If delayed, stub the helpers locally: `getCategoryMeta = (id) => ({ id, displayName: id, shortName: id.slice(0,4).toUpperCase(), icon: 'circle-dot', color: '#9ca3af', description: '' })`. |
| R-2 | `useCoverageMetrics()` or `useCoverageMapData()` from WS-1.3 not yet implemented when this workstream starts | Medium | High (scene + dock + H-1 fix depend on these hooks) | Verify WS-1.3 is complete before starting. If delayed, the scene and dock can render graceful empty states (`data: undefined` path). The UI still works but shows "No data" messages. |
| R-3 | `detail-panel.tsx` has diverged from expected state after WS-2.2 (e.g., `DistrictContent` import already removed, or `categoryId` prop named differently) | Medium | Low (requires minor adjustment to H-1 fix) | Read the actual file at implementation time; adapt the H-1 fix to the actual state. The semantic goal is the same regardless of prop names. |
| R-4 | Hex extraction regex in `getCategoryTint()` fails for category colors that use `rgb()` or `hsl()` instead of hex | Low | Low (fallback returns neutral gray tint) | The fallback `'rgba(255, 255, 255, 0.03)'` produces a valid, subtle tint. All 15 `KNOWN_CATEGORIES` entries use hex fallbacks in the `var()` string per WS-1.2 Section 4.1.2. Unknown categories fall back to `DEFAULT_CATEGORY_COLOR` which also has a hex fallback. |
| R-5 | Archived scene files are still imported by Storybook stories, test files, or other non-source files | Low | Low (build passes but Storybook breaks) | Run the grep verification from 4.7.3 including `*.stories.tsx` and `*.test.tsx` patterns. No Storybook stories exist for the legacy scenes in the current codebase (only inherited from tarva-launch, none written for this project). |
| R-6 | `CategoryDetailScene` data fetching causes waterfall: scene mounts, then fires queries, then renders | Medium | Medium (slow perceived load in district view) | Both hooks (`useCoverageMetrics`, `useCoverageMapData`) are already warm from the grid page where they were first called. TanStack Query returns cached data instantly if the `staleTime` (45s for metrics, 30s for map data per WS-1.3) has not elapsed. The waterfall only occurs on first page load if the user navigates directly to a category URL -- in that case, show skeleton loaders (AC-4). |
| R-7 | WS-3.2 (Chrome & Panels) touches some of the same files (e.g., `district-view-overlay.tsx` chrome references). Running WS-3.1 and WS-3.2 in parallel causes merge conflicts. | Medium | Medium (merge conflicts) | WS-3.1 modifies the overlay's tint logic and type imports. WS-3.2 modifies chrome labels in the telemetry bar and status strip (separate files). The only shared touchpoint is the overlay file. Recommendation: complete WS-3.1 first, then WS-3.2, or coordinate to avoid editing the same lines. |
| R-8 | The `DistrictContent` component (`district-content.tsx`) is imported by other files beyond `detail-panel.tsx` | Low | Medium (breaking import after H-1 fix) | Grep for `district-content` and `DistrictContent` across `src/`. Currently imported only by `detail-panel.tsx` (line 26). If other consumers exist, update them to use the new `CategoryPanelContent` or the full `CategoryDetailScene`. |
