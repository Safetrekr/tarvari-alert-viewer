# WS-2.1: Coverage Grid

> **Workstream ID:** WS-2.1
> **Phase:** 2 -- Core UI
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-03
> **Last Updated:** 2026-03-03
> **Depends On:** WS-1.2 (Type Foundation), WS-1.3 (Data Layer)
> **Blocks:** WS-2.2 (Morph Adaptation)
> **Resolves:** Decision 2 (Grid Layout: 1500x400px at World Origin)

## 1. Objective

Replace the 6-capsule circular ring layout with a CSS Grid of coverage category cards backed by live TarvaRI intel data. Create four new components (`CoverageGrid`, `CategoryCard`, `CategoryIconGrid`, `CoverageOverviewStats`), modify the morph orchestrator to render them instead of `CapsuleRing`/`ConstellationView`, and wire the page to pass hook data instead of `MOCK_CAPSULE_DATA`. Semantic zoom switching (Z0 icon grid vs Z1+ full cards) must work. The morph animation logic (ring rotation, detail panel, connector lines) remains unchanged in this workstream -- WS-2.2 adapts it for the grid layout.

The gate criterion is: the grid renders with live Supabase data (or graceful empty state), and the semantic zoom switches between `CategoryIconGrid` (Z0) and `CoverageGrid` (Z1+).

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| New component: `CoverageGrid` | CSS Grid container (8 columns, 16px gaps) positioned at world origin, rendering up to 15 category cards. Sized 1500x400px. |
| New component: `CategoryCard` | Individual category card built on `@tarva/ui` `Card` with glass effect overlay. Shows icon, name, source count, active badge. Supports idle/selected/dimmed states. |
| New component: `CategoryIconGrid` | Z0 zoomed-out representation replacing `ConstellationView`. Minimal colored icons with 3-letter codes in a compact grid layout. |
| New component: `CoverageOverviewStats` | Three KPI cards (Total Sources, Active Sources, Categories Covered) using `@tarva/ui` `KpiCard`, positioned above the grid. |
| New shared type: `CategoryGridItem` | Interface merging `CategoryMeta` with live `CoverageByCategory` metrics for grid rendering. |
| Modify: `morph-orchestrator.tsx` | Replace `CapsuleRing`/`ConstellationView` renders with `CoverageGrid`/`CategoryIconGrid`. Change props interface from `CapsuleData[]` to coverage data. Keep existing morph logic intact for WS-2.2. |
| Modify: `page.tsx` | Replace `MOCK_CAPSULE_DATA` with `useCoverageMetrics()` hook output. Transform hook data into `CategoryGridItem[]` and pass to `MorphOrchestrator`. Add `CoverageOverviewStats` to the canvas. |
| Category CSS custom properties | Define `--category-{id}` color tokens in a CSS file so `CATEGORY_COLORS` from WS-1.2 resolve at runtime. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Morph animation adaptation (scale + fade for grid) | WS-2.2 adapts morph choreography for the grid layout |
| Detail panel repositioning for grid | WS-2.2 changes panel positioning from ring-relative to grid-relative |
| Connector line simplification | WS-2.2 simplifies or removes connector lines for the grid layout |
| Archiving old components (CapsuleRing, ConstellationView, etc.) | WS-2.2 archives them after morph adaptation is complete |
| District view scene replacement | WS-3.1 creates `CategoryDetailScene` |
| Chrome label updates (top telemetry bar, bottom status strip) | WS-3.2 updates chrome labels |
| Map rendering inside district view | WS-4.1 adds MapLibre integration |
| Data fetching hooks or Zustand store creation | WS-1.3 creates these; this workstream consumes them |
| Type widening (DistrictId to NodeId) | WS-1.2 handles all type changes |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/lib/interfaces/coverage.ts` (WS-1.2) | `CategoryId`, `CategoryMeta`, `KNOWN_CATEGORIES` (15 entries), `getCategoryColor()`, `getCategoryIcon()`, `getCategoryMeta()`, `CATEGORY_COLORS` | Created by WS-1.2 |
| `src/hooks/use-coverage-metrics.ts` (WS-1.3) | `useCoverageMetrics()` returning `UseQueryResult<CoverageMetrics>` with `data.byCategory: CoverageByCategory[]`, `data.totalSources`, `data.activeSources`, `data.categoriesCovered` | Created by WS-1.3 |
| `src/stores/coverage.store.ts` (WS-1.3) | `useCoverageStore` with `selectedCategory: string | null`, `setSelectedCategory()`, `clearSelection()` | Created by WS-1.3 |
| `src/lib/coverage-utils.ts` (WS-1.3) | `CoverageByCategory`, `CoverageMetrics` type exports | Created by WS-1.3 |
| `src/lib/interfaces/district.ts` (WS-1.2) | `NodeId` type (widened from `DistrictId`) | Modified by WS-1.2 |
| `src/hooks/use-semantic-zoom.ts` | `useSemanticZoom()` returning `{ isConstellation, isAtrium, level }` for Z0/Z1+ switching | Available |
| `src/components/ambient/zoom-gate.tsx` | `ZoomGate` component for gating children by `SemanticZoomLevel[]` | Available |
| `src/components/districts/morph-orchestrator.tsx` | Current orchestrator rendering `CapsuleRing`/`ConstellationView` via `AnimatePresence mode="wait"` | Available (199 lines) |
| `src/app/(launch)/page.tsx` | Current page passing `MOCK_CAPSULE_DATA` to `MorphOrchestrator` | Available (375 lines) |
| `@tarva/ui` `Card` | `Card`, `CardHeader`, `CardTitle`, `CardContent` from `/Users/jessetms/Sites/tarva-ui-library/src/components/ui/card.tsx` | Available |
| `@tarva/ui` `KpiCard` | `KpiCard` with `label`, `value`, `valueFormat`, `icon`, `loading`, `size`, `glow` props from `/Users/jessetms/Sites/tarva-ui-library/src/components/ui/kpi-card.tsx` | Available |
| `src/lib/morph-types.ts` | `MorphPhase`, `PanelSide` types (unchanged in this WS) | Available |
| `src/stores/camera.store.ts` | `SemanticZoomLevel` type (`'Z0' | 'Z1' | 'Z2' | 'Z3'`) | Available |

## 4. Deliverables

### 4.1 Create Shared Type -- `CategoryGridItem`

**Path:** `src/lib/interfaces/coverage.ts` (append to file created by WS-1.2)

Add a display-ready type that merges static category metadata with live query metrics. This is the primary data shape consumed by all grid components.

```typescript
// ---------------------------------------------------------------------------
// Grid display type (added by WS-2.1)
// ---------------------------------------------------------------------------

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
```

Also add a builder function:

```typescript
import type { CoverageByCategory } from '@/lib/coverage-utils'

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
```

---

### 4.2 Create `CoverageGrid` Component

**Path:** `src/components/coverage/CoverageGrid.tsx`

CSS Grid container that renders `CategoryCard` instances for each active coverage category. Replaces `CapsuleRing` at Z1+ zoom levels.

#### 4.2.1 Props Interface

```typescript
import type { CategoryGridItem } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'
import type { MorphPhase } from '@/lib/morph-types'

export interface CoverageGridProps {
  /** Categories with live metrics, pre-filtered to those with >= 1 source. */
  items: CategoryGridItem[]
  /** Currently selected category ID, or null. */
  selectedId: NodeId | null
  /** Callback when a card is clicked. */
  onSelect: (id: NodeId) => void
  /** Current morph phase (controls dim/scale on cards). */
  morphPhase?: MorphPhase
  /** Children rendered inside the grid container (e.g. ConnectorLines overlay). */
  children?: React.ReactNode
}
```

#### 4.2.2 Layout Constants

```typescript
/** Grid container dimensions in world-space pixels (per Decision 2). */
export const GRID_WIDTH = 1500
export const GRID_HEIGHT = 400
export const GRID_COLUMNS = 8
export const GRID_GAP = 16

/** Card dimensions within the grid. */
export const CARD_WIDTH = 160
export const CARD_HEIGHT = 180
```

#### 4.2.3 Implementation Sketch

```typescript
export function CoverageGrid({
  items,
  selectedId,
  onSelect,
  morphPhase,
  children,
}: CoverageGridProps) {
  const hasSelection = selectedId !== null
  const activeMorphPhase = morphPhase ?? 'idle'

  return (
    <motion.div
      key="coverage-grid"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="absolute"
      data-morph-phase={activeMorphPhase}
      style={{
        left: -(GRID_WIDTH / 2),
        top: -(GRID_HEIGHT / 2),
        width: GRID_WIDTH,
        height: GRID_HEIGHT,
        pointerEvents: 'auto',
      }}
    >
      <div
        className="grid h-full w-full"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
          gap: GRID_GAP,
        }}
      >
        {items.map((item) => (
          <CategoryCard
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            hasSelection={hasSelection}
            onSelect={onSelect}
          />
        ))}
      </div>
      {children}
    </motion.div>
  )
}
```

#### 4.2.4 Key Behaviors

- Positioned at world origin: `left: -(GRID_WIDTH / 2)`, `top: -(GRID_HEIGHT / 2)` -- same centering pattern as `CapsuleRing` (line 135-136 of `capsule-ring.tsx`).
- `motion.div` wrapper with `AnimatePresence`-compatible `initial`/`animate`/`exit` props for Z0/Z1+ crossfade (same pattern as `ConstellationView`, line 165-170).
- `data-morph-phase` attribute for CSS-driven morph effects (same pattern as `CapsuleRing`, line 134).
- `children` slot for overlay elements (ConnectorLines, click-outside backdrop) -- same pattern as `CapsuleRing`, line 187.
- `pointerEvents: 'auto'` because `SpatialCanvas` disables pointer events and children re-enable individually.

---

### 4.3 Create `CategoryCard` Component

**Path:** `src/components/coverage/CategoryCard.tsx`

Individual category card rendered within `CoverageGrid`. Built on `@tarva/ui` `Card` with the glass effect from the existing `DistrictCapsule` pattern.

#### 4.3.1 Props Interface

```typescript
import type { CategoryGridItem } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'

export interface CategoryCardProps {
  /** Category data (metadata + live metrics). */
  item: CategoryGridItem
  /** Whether this card is currently selected. */
  isSelected: boolean
  /** Whether any card in the grid is selected (for dimming siblings). */
  hasSelection: boolean
  /** Callback when this card is clicked. */
  onSelect: (id: NodeId) => void
}
```

#### 4.3.2 Visual Design

The card uses the glass material from `DistrictCapsule` (lines 121-131 of `district-capsule.tsx`):

```
bg-[rgba(var(--ambient-ink-rgb),0.05)]
backdrop-blur-[12px]
backdrop-saturate-[120%]
border border-[rgba(var(--ambient-ink-rgb),0.10)]
```

Content layout (top to bottom within 160x180px):

1. **Category icon** (24x24px) -- Lucide icon resolved from `item.meta.icon` string. Tinted with `item.meta.color`.
2. **Category name** -- `item.meta.displayName`, 11px uppercase semibold (same style as `DistrictCapsule` line 141-142).
3. **Source count** -- `item.metrics.sourceCount`, large number (24px bold).
4. **Active indicator** -- `item.metrics.activeSources` active out of total, small text or badge.
5. **Left border accent** -- 3px left border in `item.meta.color` for quick category identification.

#### 4.3.3 State Variants

Follow the same variant pattern as `DistrictCapsule` (lines 30-37 and line 106):

| State | Visual Treatment |
|-------|------------------|
| `idle` | Full opacity, scale 1.0 |
| `hover` | Scale 1.04, slight glow using `item.meta.color` |
| `selected` | Opacity 0.25 (the detail panel takes focus) |
| `dimmed` | Opacity 0.5 (sibling is selected) |

Use `motion/react` `variants` with `animate` driven by a resolved variant string, exactly as `DistrictCapsule` does (lines 76-78, 99-108).

#### 4.3.4 Accessibility

- `role="button"`, `tabIndex={0}` (same as `DistrictCapsule` lines 101-102).
- `aria-label`: `"{displayName} category -- {sourceCount} sources, {activeSources} active"`.
- `onKeyDown` handler for Enter/Space (same as `DistrictCapsule` lines 80-88).
- `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember-bright)]`.

#### 4.3.5 Icon Resolution

The `item.meta.icon` field stores a Lucide icon name as a string (e.g. `'activity'`, `'cloud'`). Resolve to a component at render time using a static lookup map:

```typescript
import {
  Activity, Mountain, AlertTriangle, Heart, HeartPulse,
  Plane, Ship, Building2, Cloud, ShieldAlert,
  Flame, Waves, CloudLightning, Layers, CircleDot,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  'activity': Activity,
  'mountain': Mountain,
  'alert-triangle': AlertTriangle,
  'heart': Heart,
  'heart-pulse': HeartPulse,
  'plane': Plane,
  'ship': Ship,
  'building-2': Building2,
  'cloud': Cloud,
  'shield-alert': ShieldAlert,
  'flame': Flame,
  'waves': Waves,
  'cloud-lightning': CloudLightning,
  'layers': Layers,
  'circle-dot': CircleDot,
}
```

This keeps icon imports explicit (tree-shakeable) rather than dynamic.

---

### 4.4 Create `CategoryIconGrid` Component

**Path:** `src/components/coverage/CategoryIconGrid.tsx`

Z0 zoomed-out representation of coverage categories. Replaces `ConstellationView`. Shows minimal colored icons with 3-letter category codes in a compact grid layout.

#### 4.4.1 Props Interface

```typescript
import type { CategoryGridItem } from '@/lib/interfaces/coverage'
import type { NodeId } from '@/lib/interfaces/district'

export interface CategoryIconGridProps {
  /** Categories with live metrics. */
  items: CategoryGridItem[]
  /** Whether the ZUI viewport is actively panning (disables glow effects). */
  isPanning?: boolean
  /** Callback when an icon is clicked (triggers zoom + morph). */
  onIconSelect?: (id: NodeId) => void
}
```

#### 4.4.2 Layout

Uses a tighter grid than the full `CoverageGrid` to stay readable at Z0 zoom levels (0.08-0.27). The container matches the `CoverageGrid` footprint so the spatial transition between Z0 and Z1 reads as icons expanding into cards in place.

```typescript
/** Icon grid uses the same world-space footprint as CoverageGrid. */
const ICON_GRID_WIDTH = GRID_WIDTH   // 1500px
const ICON_GRID_HEIGHT = GRID_HEIGHT // 400px
```

Each icon item is a 40x40px dot (same size as `DistrictBeacon` in `constellation-view.tsx` line 47: `BEACON_SIZE = 40`) with:

1. **Colored dot** -- 12px circle filled with `item.meta.color`, pulsing glow when `!isPanning`.
2. **Category code** -- `item.meta.shortName` (3-letter code like "WX", "SEIS"), 9px monospace.

Items placed in the same CSS Grid (`repeat(8, 1fr)`) but each cell contains only the icon, centered.

#### 4.4.3 Aggregate Metrics Bar

Below the icon grid, render 3 aggregate numbers (similar to `GlobalMetrics` in `ConstellationView`):

- Total categories active
- Total sources online
- Total alerts (if available)

This gives the Z0 overview the same informational density as the original `ConstellationView`'s `GlobalMetrics` component.

#### 4.4.4 Animation

Same `motion.div` wrapper pattern as `ConstellationView` (lines 165-170):

```typescript
<motion.div
  key="category-icons"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
  ...
>
```

---

### 4.5 Create `CoverageOverviewStats` Component

**Path:** `src/components/coverage/CoverageOverviewStats.tsx`

Three KPI metric cards positioned above the coverage grid in world-space. Uses `@tarva/ui` `KpiCard` component.

#### 4.5.1 Props Interface

```typescript
export interface CoverageOverviewStatsProps {
  /** Total intel sources across all categories. */
  totalSources: number
  /** Sources with status === 'active'. */
  activeSources: number
  /** Number of unique categories with >= 1 source. */
  categoriesCovered: number
  /** Whether the data is still loading (shows skeleton state). */
  isLoading?: boolean
}
```

#### 4.5.2 Layout

Three `KpiCard` instances in a horizontal row, centered above the grid:

```typescript
/** Stats bar dimensions and position in world-space. */
const STATS_WIDTH = 560    // 3 cards * ~170px + 2 * 25px gaps
const STATS_HEIGHT = 100
const STATS_Y_OFFSET = -60 // 60px gap above the grid top edge
```

Positioned relative to the grid: the stats bar sits above `CoverageGrid`, so its world-space `top` is `-(GRID_HEIGHT / 2) - STATS_HEIGHT - STATS_Y_OFFSET`.

#### 4.5.3 KPI Card Configuration

| Card | `label` | `value` | `valueFormat` | `icon` | `glow` |
|------|---------|---------|---------------|--------|--------|
| Total Sources | `"Total Sources"` | `totalSources` | `'number'` | Lucide `Database` (16px) | `false` |
| Active Sources | `"Active Sources"` | `activeSources` | `'number'` | Lucide `Activity` (16px) | `true` when `activeSources > 0` |
| Categories | `"Categories"` | `categoriesCovered` | `'number'` | Lucide `Grid3x3` (16px) | `false` |

All cards use `size="sm"` to fit the compact spatial layout. The `loading` prop is passed through for skeleton state during initial fetch.

#### 4.5.4 Glass Overlay

The `KpiCard` from `@tarva/ui` uses `bg-card` (opaque background). For the spatial ZUI context, wrap each card or the container with the glass material classes:

```
bg-[rgba(var(--ambient-ink-rgb),0.05)] backdrop-blur-[12px] backdrop-saturate-[120%]
border border-[rgba(var(--ambient-ink-rgb),0.10)]
```

Override `bg-card` with transparent background so the glass shows through.

#### 4.5.5 Zoom Gating

The stats bar is only visible at Z1+ (same as the full grid). Use `ZoomGate` or `useSemanticZoom` to hide at Z0 where the icon grid takes over:

```typescript
<ZoomGate show={['Z1', 'Z2', 'Z3']}>
  <CoverageOverviewStats ... />
</ZoomGate>
```

This is wired in `page.tsx` (Deliverable 4.7), not inside the component itself, to keep the component zoom-agnostic.

---

### 4.6 Create Category Color CSS Custom Properties

**Path:** `src/styles/coverage.css`

Define the CSS custom properties referenced by `CATEGORY_COLORS` in `coverage.ts` (WS-1.2). These tokens resolve `var(--category-seismic, #ef4444)` at runtime and enable future theming.

```css
/**
 * Category color tokens for the coverage grid.
 * Fallback hex values match KNOWN_CATEGORIES in coverage.ts.
 *
 * @see WS-1.2 Section 4.1.3
 * @see WS-2.1 Section 4.6
 */

:root {
  --category-seismic: #ef4444;
  --category-geological: #f97316;
  --category-disaster: #a855f7;
  --category-humanitarian: #6366f1;
  --category-health: #22c55e;
  --category-aviation: #06b6d4;
  --category-maritime: #14b8a6;
  --category-infrastructure: #eab308;
  --category-weather: #3b82f6;
  --category-conflict: #dc2626;
  --category-fire: #ea580c;
  --category-flood: #4f46e5;
  --category-storm: #0ea5e9;
  --category-multi-hazard: #6b7280;
  --category-other: #9ca3af;
}
```

Import this file in `page.tsx` alongside the existing style imports (`atrium.css`, `morph.css`, etc.).

---

### 4.7 Update `page.tsx` -- Wire Hook Data

**Path:** `src/app/(launch)/page.tsx`

Replace the `MOCK_CAPSULE_DATA` import and wiring with live coverage data from `useCoverageMetrics()`.

#### 4.7.1 New Imports

Add:

```typescript
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { useCoverageStore, syncCoverageFromUrl } from '@/stores/coverage.store'
import { buildGridItems, type CategoryGridItem } from '@/lib/interfaces/coverage'
import { CoverageOverviewStats } from '@/components/coverage/CoverageOverviewStats'
import '@/styles/coverage.css'
```

Remove:

```typescript
// Remove: import { MOCK_CAPSULE_DATA } from '@/lib/interfaces/district'
// (keep other district imports like DISTRICTS, DistrictId that are still used by legacy code)
```

#### 4.7.2 Data Transformation in `LaunchPage`

Inside the `LaunchPage` component, add:

```typescript
// Coverage data
const { data: coverageMetrics, isLoading: isMetricsLoading } = useCoverageMetrics()
const selectedCategory = useCoverageStore((s) => s.selectedCategory)

// Build grid items from live metrics (Decision 4: only categories with >= 1 source)
const gridItems: CategoryGridItem[] = useMemo(
  () => coverageMetrics ? buildGridItems(coverageMetrics.byCategory) : [],
  [coverageMetrics],
)

// URL sync for category selection (replaces useInitialDistrictFromUrl)
useEffect(() => {
  syncCoverageFromUrl()
}, [])
```

#### 4.7.3 Replace MorphOrchestrator Data Prop

Change:

```typescript
// BEFORE (line 251-254):
<MorphOrchestrator
  data={MOCK_CAPSULE_DATA}
  prefersReducedMotion={prefersReducedMotion}
  isPanning={isPanActive}
/>

// AFTER:
<MorphOrchestrator
  items={gridItems}
  metrics={coverageMetrics}
  prefersReducedMotion={prefersReducedMotion}
  isPanning={isPanActive}
/>
```

#### 4.7.4 Add CoverageOverviewStats

Add the stats component to the `SpatialCanvas` children, positioned above the grid and zoom-gated to Z1+:

```typescript
{/* Coverage overview stats -- positioned above the grid, Z1+ only */}
<ZoomGate show={['Z1', 'Z2', 'Z3']}>
  <div
    className="absolute"
    style={{
      left: -(560 / 2),
      top: -(GRID_HEIGHT / 2) - 100 - 60,
      width: 560,
      pointerEvents: 'auto',
    }}
  >
    <CoverageOverviewStats
      totalSources={coverageMetrics?.totalSources ?? 0}
      activeSources={coverageMetrics?.activeSources ?? 0}
      categoriesCovered={coverageMetrics?.categoriesCovered ?? 0}
      isLoading={isMetricsLoading}
    />
  </div>
</ZoomGate>
```

Where `GRID_HEIGHT` (400) is imported from `CoverageGrid`.

#### 4.7.5 Keep Legacy Code Path

The `useInitialDistrictFromUrl` hook at lines 116-141 reads `?district={id}`. This will coexist temporarily -- WS-2.2 replaces it with `?category={id}` reading from the coverage store. For now, leave it in place (it will be a no-op for new category URLs).

---

### 4.8 Update `morph-orchestrator.tsx` -- Swap Components

**Path:** `src/components/districts/morph-orchestrator.tsx`

#### 4.8.1 New Props Interface

Replace the current `MorphOrchestratorProps`:

```typescript
// BEFORE (lines 33-40):
interface MorphOrchestratorProps {
  data: CapsuleData[]
  prefersReducedMotion: boolean
  isPanning?: boolean
}

// AFTER:
interface MorphOrchestratorProps {
  /** Category grid items with live metrics. */
  items: CategoryGridItem[]
  /** Full coverage metrics (used for overview stats, passed through). */
  metrics: CoverageMetrics | undefined
  /** Whether the user prefers reduced motion. */
  prefersReducedMotion: boolean
  /** Whether the ZUI viewport is actively panning. */
  isPanning?: boolean
}
```

New imports:

```typescript
import { CoverageGrid, GRID_WIDTH, GRID_HEIGHT } from '@/components/coverage/CoverageGrid'
import { CategoryIconGrid } from '@/components/coverage/CategoryIconGrid'
import type { CategoryGridItem } from '@/lib/interfaces/coverage'
import type { CoverageMetrics } from '@/lib/coverage-utils'
import type { NodeId } from '@/lib/interfaces/district'
```

Remove (or keep as unused until WS-2.2 archives):

```typescript
// These imports are no longer needed for rendering but WS-2.2 handles removal:
// import { CapsuleRing, computeCapsuleCenter, RING_CENTER } from './capsule-ring'
// import { ConstellationView } from './constellation-view'
```

#### 4.8.2 Replace Z0/Z1+ Render

Replace the `AnimatePresence` block at lines 139-177:

```typescript
// BEFORE:
<AnimatePresence mode="wait">
  {isConstellation ? (
    <ConstellationView key="z0" isPanning={isPanning} onBeaconSelect={handleBeaconSelect} />
  ) : (
    <CapsuleRing key="z1" data={data} ... >
      ...
    </CapsuleRing>
  )}
</AnimatePresence>

// AFTER:
<AnimatePresence mode="wait">
  {isConstellation ? (
    <CategoryIconGrid
      key="z0"
      items={items}
      isPanning={isPanning}
      onIconSelect={handleBeaconSelect}
    />
  ) : (
    <CoverageGrid
      key="z1"
      items={items}
      selectedId={targetId}
      onSelect={handleCapsuleSelect}
      morphPhase={phase}
    >
      {/* Click-outside backdrop + ConnectorLines stay -- WS-2.2 adapts them */}
      {showPanel && !isDistrictView && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'auto' }}
          onClick={reverseMorph}
        />
      )}
      <AnimatePresence>
        {showConnector && selectedCapsuleCenter && selectedRingIndex !== null && (
          <ConnectorLines
            key="connector"
            ringIndex={selectedRingIndex}
            capsuleCenter={selectedCapsuleCenter}
            ringShift={ringShift}
          />
        )}
      </AnimatePresence>
    </CoverageGrid>
  )}
</AnimatePresence>
```

#### 4.8.3 Update Callback Type Signatures

Change `handleCapsuleSelect` and `handleBeaconSelect` parameter types from `DistrictId` to `NodeId`:

```typescript
const handleCapsuleSelect = useCallback(
  (id: NodeId) => {
    if (phase === 'idle') {
      startMorph(id)
    }
  },
  [phase, startMorph],
)

const handleBeaconSelect = useCallback(
  (id: NodeId) => {
    if (phase !== 'idle') return
    // For the grid layout, zoom to Z1 and then morph.
    // The flyTo target will be grid-relative rather than ring-relative.
    // WS-2.2 refines this calculation. For now, zoom to center + startMorph.
    const { viewportWidth, viewportHeight, flyTo } = useCameraStore.getState()
    const targetZoom = 1.0
    const targetOffsetX = viewportWidth / 2
    const targetOffsetY = viewportHeight / 2
    flyTo(targetOffsetX, targetOffsetY, targetZoom)
    setTimeout(() => {
      startMorph(id)
    }, 350)
  },
  [phase, startMorph],
)
```

#### 4.8.4 Ring-Specific Logic

The `selectedRingIndex`, `selectedCapsuleCenter`, `ringRotation`, `panelSide`, and `ringShift` computations at lines 86-114 rely on ring-based geometry (`getDistrictById`, `computeCapsuleCenter`, `computeRingRotation`). These will not work for grid-based categories that have no `ringIndex`.

**Approach for this workstream:** Keep the ring logic intact but short-circuit it when `getDistrictById(targetId)` returns `undefined` (which it will for category IDs like `'seismic'` that are not in the `DISTRICTS` array). This means:
- `selectedRingIndex` resolves to `null`
- `selectedCapsuleCenter` resolves to `null`
- `showPanel` is `false` (because `selectedCapsuleCenter` is null)
- No connector lines or detail panel appear

This is intentional: the detail panel and connector lines are not functional for the new grid layout until WS-2.2 adapts their positioning. The gate criterion only requires the grid to render with live data and the Z0/Z1+ switch to work -- the morph drill-down is gated in WS-2.2.

---

### 4.9 Create `src/components/coverage/index.ts` Barrel Export

**Path:** `src/components/coverage/index.ts`

```typescript
export { CoverageGrid, GRID_WIDTH, GRID_HEIGHT, GRID_COLUMNS, GRID_GAP } from './CoverageGrid'
export { CategoryCard } from './CategoryCard'
export { CategoryIconGrid } from './CategoryIconGrid'
export { CoverageOverviewStats } from './CoverageOverviewStats'
```

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `src/components/coverage/CoverageGrid.tsx` renders a CSS Grid with `grid-template-columns: repeat(8, 1fr)` and `gap: 16px` | Code review; browser DevTools inspection |
| AC-2 | Grid container is 1500x400px, centered at world origin (`left: -750, top: -200`) | Code review; measure in DevTools at zoom 1.0 |
| AC-3 | `CategoryCard` renders category icon, name, source count, and active indicator for each item | Visual inspection in browser at Z1 zoom |
| AC-4 | `CategoryCard` uses glass material (`backdrop-blur-[12px]`, semi-transparent background) consistent with existing `DistrictCapsule` styling | Visual comparison; code review |
| AC-5 | `CategoryCard` supports keyboard interaction (`role="button"`, `tabIndex={0}`, Enter/Space triggers `onSelect`) | Manual keyboard testing; code review |
| AC-6 | `CategoryCard` has `aria-label` describing category name and source count | Screen reader testing or `aria-label` attribute inspection |
| AC-7 | `CategoryIconGrid` renders at Z0 zoom level, showing colored dots with 3-letter category codes | Zoom to Z0 (below 0.27) and verify icon grid appears |
| AC-8 | Z0/Z1+ switching works: zooming in from Z0 crossfades from `CategoryIconGrid` to `CoverageGrid` via `AnimatePresence` | Zoom in/out through the Z0-Z1 threshold (0.27-0.30) and verify smooth crossfade |
| AC-9 | `CoverageOverviewStats` renders 3 KPI cards (Total Sources, Active Sources, Categories) above the grid at Z1+ | Visual inspection; verify not visible at Z0 |
| AC-10 | `CoverageOverviewStats` shows skeleton loading state while `useCoverageMetrics` is fetching | Network-throttle in DevTools or disconnect Supabase to observe loading state |
| AC-11 | Grid renders with live Supabase data when `intel_sources` table has rows | Start dev server with valid Supabase credentials; verify source counts match database |
| AC-12 | Grid renders empty state (no cards) when `intel_sources` table is empty, with no runtime errors | Clear intel_sources or use empty Supabase instance; verify no console errors |
| AC-13 | Only categories with >= 1 source appear in the grid (Decision 4) | Verify against database: categories with zero sources are not shown |
| AC-14 | Category colors resolve from CSS custom properties (`var(--category-seismic, ...)`) | Inspect card border/icon color in DevTools; verify CSS variable resolution |
| AC-15 | `page.tsx` no longer imports or references `MOCK_CAPSULE_DATA` | Grep for `MOCK_CAPSULE_DATA` in page.tsx returns zero matches |
| AC-16 | `pnpm typecheck` passes with zero errors | Run `pnpm typecheck` |
| AC-17 | Morph drill-down (click card, detail panel appears) is non-functional but does not crash | Click a card; verify no console errors. Panel not appearing is expected (WS-2.2 fixes this). |
| AC-18 | `src/styles/coverage.css` defines CSS custom properties for all 15 category colors | Code review; verify all 15 `--category-*` tokens are defined |
| AC-19 | Lucide icons for all 15 categories are correctly mapped and rendered | Visual inspection of all visible category cards |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Grid container sized 1500x400px (per Decision 2) rather than matching the 840x840px ring container | The rectangular grid better fits 8-column layouts. The ring container was square because the capsule layout was circular. A 1500px width fits between the existing ambient panels (`SystemStatusPanel` at x:-1200, `FeedPanel` at x:+880) with ~130px clearance on each side. Two rows of 8 cards at 180px height + 16px gap = 376px, which fits within 400px. | (a) Keep 840x840 container -- too narrow for 8 columns; (b) 1200x500 -- fits but wastes vertical space; (c) Dynamic width based on category count -- adds complexity for minor benefit |
| D-2 | Use `@tarva/ui Card` as the base with glass effect overlay rather than building a custom card from scratch | Reuses the shared component library (`@tarva/ui`) as prescribed in the project architecture. The `Card` component provides `data-slot` attributes, semantic structure (`CardHeader`, `CardContent`), and consistent padding/border-radius. The glass effect is applied via className overrides, same technique used by `DistrictCapsule`. | (a) Custom `div` with all styles inline -- duplicates `@tarva/ui` structure; (b) `KpiCard` for everything -- wrong semantic fit (KPI cards are for metrics, not clickable navigation targets) |
| D-3 | Static icon lookup map (`ICON_MAP`) rather than dynamic `lucide-react` imports | Dynamic icon loading (`import(`lucide-react/${name}`)`) is not possible at build time and would require a bundler plugin. A static map of 15 imports is explicit, tree-shakeable, and type-safe. The `KNOWN_CATEGORIES` list is stable (15 entries), so maintaining the map is trivial. | (a) Dynamic `import()` -- not supported by Vite/webpack for named exports; (b) Store `React.ComponentType` in `KNOWN_CATEGORIES` -- couples the type module to React imports, breaks tree-shaking (per WS-1.2 Decision D-4); (c) SVG sprite sheet -- additional build step for 15 icons is over-engineering |
| D-4 | Keep morph drill-down non-functional in this workstream (panel does not appear for grid categories) | The ring-specific geometry (ring rotation, capsule center computation, panel positioning) does not apply to grid-based categories. Adapting the morph animations is WS-2.2's explicit scope. Making the panel work here would require duplicating WS-2.2's work. The gate criterion only requires the grid to render and Z0/Z1+ switching to work. | (a) Implement basic panel positioning for grid -- scope creep, duplicates WS-2.2; (b) Show a placeholder panel -- misleading, still needs proper positioning in WS-2.2 |
| D-5 | `CategoryIconGrid` uses the same world-space footprint (1500x400px) as `CoverageGrid` | Matching footprints ensure the Z0-to-Z1 crossfade reads as icons expanding to cards in place, preserving spatial continuity. This mirrors how `ConstellationView` used the same 840x840 container as `CapsuleRing`. | (a) Smaller footprint for icons -- spatial discontinuity during zoom transition; (b) Circular beacon layout like original `ConstellationView` -- inconsistent with grid layout |
| D-6 | `CoverageOverviewStats` positioned in world-space above the grid, not in a fixed HUD overlay | The stats cards are content that should zoom with the spatial canvas. Placing them in fixed HUD would break the spatial metaphor. At Z0, the stats are hidden (too small to read) -- `ZoomGate` handles this. At Z1+, they are readable and provide context above the grid. | (a) Fixed viewport overlay -- breaks spatial metaphor; (b) Inside the grid container -- competes for card space; (c) Below the grid -- less prominent than above |
| D-7 | Define category CSS custom properties in a new `coverage.css` file rather than in the root CSS or Tailwind config | Follows the existing pattern of feature-scoped CSS files (`atrium.css`, `morph.css`, `constellation.css`, `enrichment.css`, `district-view.css`). Keeps coverage tokens grouped and importable. The properties are `:root`-scoped so they are globally available. WS-1.2 deferred this (OQ-4) to this workstream where the tokens are first visually consumed. | (a) Add to existing `atrium.css` -- pollutes the file with coverage-specific tokens; (b) Tailwind config extend -- CSS custom properties are already the pattern used throughout the codebase |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should `CategoryCard` show geographic regions (first 3 + "+N more") as specified in PAGE-LAYOUT.md, or defer region display to the district view (WS-3.1)? The card is already 160x180px which is tight for additional text. | react-developer | Phase 2 (this WS) -- recommendation: defer to district view. Card shows count + active badge only. |
| OQ-2 | Should the `CoverageOverviewStats` position be expressed as constants in a shared spatial-layout module, or kept inline in `page.tsx`? Other ambient panels (SystemStatusPanel, FeedPanel) use hardcoded positions in their own components. | react-developer | Phase 2 (this WS) -- recommendation: keep inline, consistent with existing pattern. Extract to shared constants in a future cleanup pass. |
| OQ-3 | The `CategoryIconGrid` aggregate metrics bar mirrors `ConstellationView`'s `GlobalMetrics`. Should it reuse/adapt `GlobalMetrics`, or create a new component? | react-developer | Phase 2 (this WS) -- recommendation: create new component. `GlobalMetrics` reads from `districtsStore` which is legacy. |
| OQ-4 | When the grid has fewer than 8 categories (e.g., only 5 sources exist covering 5 categories), should cards stretch to fill the row or left-align with empty cells? | react-developer | Phase 2 (this WS) -- recommendation: left-align (default CSS Grid behavior with `repeat(8, 1fr)`) so the grid does not look sparse. Cards maintain fixed ~160px width; empty cells simply have no card. |
| OQ-5 | Should `CategoryCard` include the sparkline from `@tarva/ui KpiCard` showing source count over time, or is the static source count sufficient for the launch page? Historical source count data is not currently available from `intel_sources`. | Planning Agent | Phase 3 -- defer until historical data is available. |
| OQ-6 | The `DistrictMeta.ringIndex` field (typed `0 | 1 | 2 | 3 | 4 | 5`) was flagged as needing widening to `number` in WS-1.2 OQ-3. Should this WS add a `gridIndex` to `CategoryGridItem` for position tracking, or rely on array index? | react-developer | Phase 2 (this WS) -- recommendation: rely on array index. `gridIndex` is unnecessary because CSS Grid handles positioning via document order. |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-1.2 or WS-1.3 not complete when WS-2.1 starts, meaning types or hooks are unavailable | Medium | High (blocks all deliverables) | Both dependencies have clear gates (`pnpm typecheck` for WS-1.2, hooks returning data for WS-1.3). If delayed, WS-2.1 can start with mock data (`buildGridItems` called with hardcoded `CoverageByCategory[]`) and swap to live data when hooks arrive. The component interfaces are designed against the documented types, not the implementation. |
| R-2 | `@tarva/ui Card` styling conflicts with the glass material overrides in the spatial ZUI context | Medium | Medium (cards look wrong) | Verified from `/Users/jessetms/Sites/tarva-ui-library/src/components/ui/card.tsx`: the `Card` component uses `bg-card text-card-foreground` Tailwind classes which are overridable via `className` prop. The glass effect classes (`bg-[rgba(...)] backdrop-blur-[12px]`) will override `bg-card`. Test early by rendering a single `CategoryCard` in the existing spatial canvas. |
| R-3 | Grid container (1500px) overflows the visible viewport at certain zoom levels, causing ambient panel overlap | Low | Medium (visual glitch) | The grid fits between `SystemStatusPanel` (x:-1200) and `FeedPanel` (x:+880) with ~130px clearance. At Z1 default zoom (0.5), the visible world is ~2880px wide (1440px / 0.5), so 1500px grid is comfortably within view. `ViewportCuller` handles culling of off-screen elements. Test at Z0 (0.08), Z1 (0.5), and Z2 (0.8-1.5) zoom levels. |
| R-4 | The `useCoverageMetrics` hook returns an empty `byCategory` array, resulting in an empty grid with no visual feedback | Medium | Medium (confusing UX) | Add an empty state to `CoverageGrid`: when `items.length === 0`, render a centered message ("No coverage data available" with a muted icon). This matches the empty state pattern from PAGE-LAYOUT.md ("No sources found for selected category" with inbox icon). |
| R-5 | Lucide icon name strings in `KNOWN_CATEGORIES` do not match the actual `lucide-react` export names (e.g., `'heart-pulse'` vs `HeartPulse`) | Low | Low (missing icon, falls back to CircleDot) | The `ICON_MAP` in `CategoryCard` maps kebab-case strings to PascalCase imports. If a mapping is missing, the fallback `CircleDot` icon renders (same as `DEFAULT_CATEGORY_ICON` from WS-1.2). Verify all 15 mappings against `lucide-react` v0.x exports during implementation. |
| R-6 | `AnimatePresence mode="wait"` causes a flash or layout shift during Z0/Z1+ transition because the grid container (1500x400px) is a different size than the icon grid | Low | Low (momentary visual glitch) | Both containers use the same world-space footprint (`left: -750, top: -200, width: 1500, height: 400`). The `AnimatePresence` `mode="wait"` ensures the exit animation completes before the enter animation starts, so there is no overlap. The 300ms crossfade (per `ConstellationView` timing) is fast enough to be unnoticeable. |
| R-7 | Morph drill-down being non-functional (D-4) confuses testing or stakeholder review | Medium | Low (expected behavior gap) | Document explicitly in the gate criterion and AC-17 that morph drill-down is out of scope. The card click triggers `startMorph(id)` which updates the morph state, but the detail panel does not appear because ring geometry returns `null` for category IDs. No crash occurs. WS-2.2's gate criterion covers the full morph flow. |
