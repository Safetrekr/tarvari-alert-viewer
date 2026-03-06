# WS-4.4: Trend Indicators on CategoryCard

> **Workstream ID:** WS-4.4
> **Phase:** 4 -- Geographic Intelligence
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-4.1 (useThreatPicture hook -- provides per-category trend direction data)
> **Blocks:** None
> **Resolves:** Phase 4 acceptance criterion "CategoryCard trend arrows display (up/down/stable)"

## 1. Objective

Add a small trend direction indicator next to the alert count on each `CategoryCard`. The arrow communicates whether activity in a category is increasing, decreasing, or stable compared to the previous period. Trend direction is derived from the `/console/threat-picture` endpoint consumed by the `useThreatPicture` hook (WS-4.1).

The arrows use color for semantic meaning -- red-tinted for increase, green-tinted for decrease, gray for stable -- which is distinct from both the severity color channel (per-alert) and the priority shape channel (AD-1). Trend direction is a third visual dimension: it describes a temporal comparison at the category aggregate level, not a property of any individual alert. This three-channel separation (severity=color, priority=shape, trend=colored arrow on aggregate metric) avoids perceptual conflicts because each channel encodes a different data type at a different scope.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Trend type definition | Add a `TrendDirection` type (`'up' \| 'down' \| 'stable'`) to `src/lib/interfaces/coverage.ts`. |
| CategoryGridItem extension | Add an optional `trend?: TrendDirection` field to the `CategoryGridItem` interface. |
| Trend arrow rendering | Add a `TrendArrow` inline sub-component inside `CategoryCard.tsx` that renders the appropriate Lucide arrow icon with trend-semantic coloring. |
| CategoryCard JSX | Place the trend arrow inline next to the alert count (line 172-174 of current `CategoryCard.tsx`), forming a horizontal row: `[count] [arrow]`. |
| Grid item builder | Modify `buildAllGridItems()` in `src/lib/interfaces/coverage.ts` to accept an optional trend map and merge trend direction into each grid item. |
| Page wiring | Update `page.tsx` to pass trend data from `useThreatPicture()` into the grid item builder, so `CategoryCard` receives trend direction via its existing `item` prop. |
| aria-label update | Extend the existing `aria-label` on `CategoryCard` to include trend direction (e.g., "Seismic category -- 12 alerts, 3 sources, trending up"). |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Implementing `useThreatPicture` hook | Belongs to WS-4.1 (dependency). This workstream consumes its output. |
| Trend data on the map or district view | This workstream is scoped to `CategoryCard` in the main grid only. District view trend display would be a separate concern. |
| Trend magnitude (percentage change) | The combined recommendations specify directional arrows (up/down/stable), not percentage deltas. A tooltip with magnitude could be added in a future iteration. |
| Animated arrow transitions | The arrow is static. Animating the arrow appearance when trend changes arrive is unnecessary complexity for a polled value (120s interval per WS-4.1). |
| CategoryIconGrid (Z0 view) | The Z0 compact icon grid does not show metrics and therefore does not show trend arrows. Trend arrows appear only in Z1+ CoverageGrid. |
| Tests | No test infrastructure (`pnpm test:unit` is not configured). Verification is via `pnpm typecheck` and visual inspection. |
| Storybook stories | No Storybook setup exists in this project. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-4.1 deliverables | `useThreatPicture()` hook returning an object that includes per-category trend direction. Expected shape: a `trendByCategory` map or array with `{ category: string, trend: 'up' \| 'down' \| 'stable' }` entries. | Pending (WS-4.1 not yet implemented) |
| `src/components/coverage/CategoryCard.tsx` | Current component rendering category icon, name, alert count, source count, and hover overlay with two action buttons. The alert count is on line 172-174. | Available (234 lines) [CODEBASE] |
| `src/lib/interfaces/coverage.ts` | `CategoryGridItem` interface (lines 148-155) containing `id`, `meta`, and `metrics`. `buildAllGridItems()` function (lines 177-191) joining `KNOWN_CATEGORIES` with live `CoverageByCategory[]` data. | Available (192 lines) [CODEBASE] |
| `src/lib/coverage-utils.ts` | `CoverageByCategory` type (lines 20-27) with `category`, `sourceCount`, `activeSources`, `geographicRegions`, `alertCount`. | Available (185 lines) [CODEBASE] |
| `src/components/coverage/CoverageGrid.tsx` | Grid container that maps `CategoryGridItem[]` to `<CategoryCard>` instances (lines 97-108). Passes `item` prop. | Available (114 lines) [CODEBASE] |
| `src/app/(launch)/page.tsx` | Call site that builds grid items via `buildAllGridItems(coverageMetrics?.byCategory ?? [])` (lines 283-286) and passes them to `CoverageGrid`. | Available [CODEBASE] |
| Combined recommendations WS-4.1 | Threat picture endpoint returns "counts by category, severity distribution, priority breakdown, region breakdown, trend direction (up/down/stable)." The trend direction per category is the specific field this workstream consumes. | Documented |
| Combined recommendations WS-4.4 | "Small up/down/stable arrow icon next to alert count on CategoryCard. Driven by threat picture data. Arrow: up red-tinted for increase, down green-tinted for decrease, right-arrow gray for stable." | Documented |

## 4. Deliverables

### 4.1 Add `TrendDirection` Type to `src/lib/interfaces/coverage.ts`

Add a union type for trend direction below the existing `SeverityLevel` type:

```typescript
/** Trend direction for category-level activity comparison (current vs previous period). */
export type TrendDirection = 'up' | 'down' | 'stable'
```

This type is consumed by `CategoryGridItem` and the `TrendArrow` sub-component in `CategoryCard`.

### 4.2 Extend `CategoryGridItem` Interface

Add an optional `trend` field to the `CategoryGridItem` interface in `src/lib/interfaces/coverage.ts`:

```typescript
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
```

The field is optional because threat picture data may not be available (WS-4.1 hook may be loading, errored, or the backend endpoint may not exist yet). When `trend` is `undefined`, the trend arrow is not rendered -- the card looks identical to its current state, ensuring backwards compatibility.

### 4.3 Modify `buildAllGridItems()` Signature

Update `buildAllGridItems()` to accept an optional trend map so callers can inject threat picture data:

```typescript
/**
 * Build grid items for ALL 15 known categories, merging live metrics where
 * available and filling zeroed metrics for categories with no sources.
 * Optionally merges trend direction from threat picture data.
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
    },
    trend: trendMap?.get(meta.id),
  }))
}
```

**Rationale for `Map<string, TrendDirection>` parameter type:** The threat picture data arrives as a keyed collection from WS-4.1. A `Map` is the natural lookup structure. The alternative -- adding `trend` to `CoverageByCategory` -- would conflate two different data sources (coverage metrics from `/console/coverage` + `/console/intel`, and trend data from `/console/threat-picture`). Keeping them separate preserves single-responsibility: `useCoverageMetrics` owns counts, `useThreatPicture` owns trends.

Also update `buildGridItems()` with the same optional parameter for consistency, even though it is not currently the primary call site:

```typescript
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
```

### 4.4 Trend Arrow Rendering in `CategoryCard.tsx`

Add a small inline sub-component inside `CategoryCard.tsx` that renders the appropriate Lucide icon with trend-semantic color. This is a file-private helper, not an exported component.

**Icon selection:**

| Trend | Lucide Icon | Color | Rationale |
|-------|-------------|-------|-----------|
| `'up'` | `TrendingUp` | `rgba(239, 68, 68, 0.70)` (red-500 at 70% opacity) | Red signals increasing threat activity. The 70% opacity keeps it subordinate to the alert count number while remaining clearly red. |
| `'down'` | `TrendingDown` | `rgba(34, 197, 94, 0.70)` (green-500 at 70% opacity) | Green signals decreasing threat activity. Same opacity treatment. |
| `'stable'` | `Minus` | `rgba(156, 163, 175, 0.40)` (gray-400 at 40% opacity) | Stable is neutral/muted. A horizontal line (`Minus`) communicates "no change" without adding visual weight. Lower opacity than up/down because stable is the least informative state. |

**Why `TrendingUp`/`TrendingDown` instead of `ArrowUp`/`ArrowDown`:** The trending icons include a subtle line that communicates "over time" -- they are semantically richer than plain directional arrows. They also avoid confusion with sort-direction arrows that might appear in future table/list headers.

**Why `Minus` instead of `ArrowRight` for stable:** The combined recommendations specify "right-arrow gray for stable," but `Minus` (horizontal dash) is a better semantic fit: it visually represents "flat line / no change" and is less likely to be confused with a navigation affordance (the existing `ArrowRight` icon in the hover overlay means "navigate to district view," line 202). Using the same icon for two different meanings on the same card would be confusing. This is a minor deviation from the recommendation that improves clarity.

**Icon size:** 14px. This is the same size as the hover overlay button icons (line 202, 210), creating visual consistency. At 14px next to the `text-2xl` (24px) alert count, the arrow is clearly subordinate -- a supporting annotation, not a competing element.

**Implementation pattern:**

```typescript
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import type { TrendDirection } from '@/lib/interfaces/coverage'

// Inside CategoryCard.tsx, file-private:
const TREND_CONFIG: Record<TrendDirection, {
  icon: LucideIcon
  color: string
  label: string
}> = {
  up:     { icon: TrendingUp,   color: 'rgba(239, 68, 68, 0.70)',  label: 'trending up' },
  down:   { icon: TrendingDown, color: 'rgba(34, 197, 94, 0.70)',  label: 'trending down' },
  stable: { icon: Minus,        color: 'rgba(156, 163, 175, 0.40)', label: 'stable' },
}

function TrendArrow({ trend }: { trend: TrendDirection }) {
  const config = TREND_CONFIG[trend]
  const Icon = config.icon
  return (
    <Icon
      size={14}
      style={{ color: config.color }}
      aria-hidden="true"
      className="shrink-0"
    />
  )
}
```

The `aria-hidden="true"` on the icon itself is correct because the trend information is communicated via the card's `aria-label` (see Section 4.6). The icon is a visual redundancy of information already in the accessible name.

### 4.5 CategoryCard JSX Modification

Modify the alert count display area (currently lines 171-174) to include the trend arrow inline:

**Current:**
```tsx
{/* Alert count (primary metric) */}
<span className="text-text-primary text-2xl font-bold tabular-nums leading-none">
  {metrics.alertCount}
</span>
```

**Modified:**
```tsx
{/* Alert count (primary metric) + trend arrow */}
<span className="flex items-center gap-1.5">
  <span className="text-text-primary text-2xl font-bold tabular-nums leading-none">
    {metrics.alertCount}
  </span>
  {item.trend && <TrendArrow trend={item.trend} />}
</span>
```

**Layout rationale:** The wrapping `<span>` with `flex items-center gap-1.5` places the arrow to the right of the count with 6px spacing (`gap-1.5` = 0.375rem = 6px at default 16px base). The `items-center` aligns the arrow vertically with the count's center line. This is a minimal layout change -- the existing `flex-col items-start gap-3` parent will treat this wrapping span the same as the previous bare count span.

**Conditional rendering:** `{item.trend && ...}` means no arrow appears when `trend` is `undefined`. This handles three cases gracefully:
1. WS-4.1 not yet implemented (threat picture data not available)
2. `useThreatPicture` hook loading or errored
3. A category present in coverage metrics but absent from the threat picture response

### 4.6 Update `aria-label` on CategoryCard

Extend the existing `aria-label` (line 147) to include trend direction when available:

**Current:**
```tsx
aria-label={`${meta.displayName} category -- ${metrics.alertCount} alerts, ${metrics.sourceCount} sources${isFiltered ? ' (filtering map)' : ''}`}
```

**Modified:**
```tsx
aria-label={`${meta.displayName} category -- ${metrics.alertCount} alerts, ${metrics.sourceCount} sources${item.trend ? `, ${TREND_CONFIG[item.trend].label}` : ''}${isFiltered ? ' (filtering map)' : ''}`}
```

**Example outputs:**
- With trend: `"Seismic category -- 12 alerts, 3 sources, trending up"`
- Without trend: `"Seismic category -- 12 alerts, 3 sources"` (unchanged from current)
- With trend + filter: `"Seismic category -- 12 alerts, 3 sources, trending down (filtering map)"`

This ensures screen reader users receive the same trend information conveyed by the visual arrow.

### 4.7 Page Wiring in `src/app/(launch)/page.tsx`

Update the grid items builder call to incorporate threat picture trend data.

**Current (lines 283-286):**
```tsx
const gridItems: CategoryGridItem[] = useMemo(
  () => buildAllGridItems(coverageMetrics?.byCategory ?? []),
  [coverageMetrics],
)
```

**Modified:**
```tsx
// Import at top of file:
import { useThreatPicture } from '@/hooks/use-threat-picture'

// In the component body (near existing hook calls):
const { data: threatPicture } = useThreatPicture()

// Build trend map from threat picture data:
const trendMap = useMemo(() => {
  if (!threatPicture?.trendByCategory) return undefined
  return new Map(
    threatPicture.trendByCategory.map((t) => [t.category, t.trend])
  )
}, [threatPicture])

// Updated grid items builder:
const gridItems: CategoryGridItem[] = useMemo(
  () => buildAllGridItems(coverageMetrics?.byCategory ?? [], trendMap),
  [coverageMetrics, trendMap],
)
```

**Note on `useThreatPicture` shape assumption:** This wiring assumes WS-4.1 returns a `trendByCategory` array with `{ category: string, trend: TrendDirection }` entries. The exact field name and structure will be determined by WS-4.1. If the shape differs (e.g., trend data nested differently, or trend is a field on each category count object), the `trendMap` derivation will need minor adjustment. The `CategoryCard` rendering is insulated from this -- it only sees the `trend?: TrendDirection` on `CategoryGridItem`.

### 4.8 Icon Import Additions to CategoryCard.tsx

Add three new Lucide imports to the existing import block (line 16-35):

```typescript
import {
  // ... existing imports ...
  TrendingUp,
  TrendingDown,
  Minus,
  // ... existing imports ...
} from 'lucide-react'
```

Also add the type import:

```typescript
import type { CategoryGridItem, TrendDirection } from '@/lib/interfaces/coverage'
```

The `TrendDirection` import replaces the current `CategoryGridItem`-only import (line 37) with a combined import.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `TrendDirection` type is exported from `src/lib/interfaces/coverage.ts` as `'up' \| 'down' \| 'stable'`. | `import type { TrendDirection } from '@/lib/interfaces/coverage'` resolves. `pnpm typecheck` passes. |
| AC-2 | `CategoryGridItem` includes an optional `trend?: TrendDirection` field. | TypeScript compilation confirms the field. Omitting `trend` when constructing a `CategoryGridItem` does not produce a type error. |
| AC-3 | `buildAllGridItems()` accepts an optional `trendMap?: Map<string, TrendDirection>` second parameter. | Calling `buildAllGridItems(byCategory)` (without trend map) still works. Calling `buildAllGridItems(byCategory, trendMap)` merges trend data. `pnpm typecheck` passes. |
| AC-4 | When `item.trend` is `'up'`, a red-tinted `TrendingUp` icon (14px) appears to the right of the alert count. | Visual inspection: a small upward-trending line icon appears next to the number, tinted red. DOM inspection: `<svg>` element with `color: rgba(239, 68, 68, 0.70)`. |
| AC-5 | When `item.trend` is `'down'`, a green-tinted `TrendingDown` icon (14px) appears to the right of the alert count. | Visual inspection: a small downward-trending line icon, tinted green. DOM inspection: `color: rgba(34, 197, 94, 0.70)`. |
| AC-6 | When `item.trend` is `'stable'`, a gray `Minus` icon (14px) appears to the right of the alert count. | Visual inspection: a small horizontal dash, gray and muted. DOM inspection: `color: rgba(156, 163, 175, 0.40)`. |
| AC-7 | When `item.trend` is `undefined` (no threat picture data), no arrow appears. The card renders identically to its current state. | Visual inspection with `useThreatPicture` disabled or returning no data: cards show count only, no arrow. Before/after comparison shows no visual difference. |
| AC-8 | The trend arrow is vertically centered with the alert count number. | Visual inspection: the arrow's vertical midpoint aligns with the count text's midpoint. DOM inspection: parent has `display: flex; align-items: center`. |
| AC-9 | The `aria-label` includes trend direction when available (e.g., "trending up"). | DOM inspection: `aria-label` attribute contains the trend label string. Screen reader verification: trend is announced as part of the card's accessible name. |
| AC-10 | The `aria-label` does not include trend text when `item.trend` is `undefined`. | DOM inspection: `aria-label` matches the current format with no trailing comma or "undefined" text. |
| AC-11 | The trend arrow has `aria-hidden="true"` on the icon SVG element. | DOM inspection: the `<svg>` has `aria-hidden="true"`. The trend information is conveyed only via the card's `aria-label`, not the icon itself. |
| AC-12 | The hover overlay continues to work correctly with the trend arrow present. | Manual test: hover over a card with a trend arrow. The overlay appears, covering the card content including the trend arrow. Both "View District" and "Show on Map" buttons function. |
| AC-13 | Cards with zero alert count and a trend arrow render correctly. | Visual inspection: "0" with a gray stable arrow (or no arrow if no trend data) looks acceptable. No layout overflow or misalignment. |
| AC-14 | `pnpm typecheck` passes with no errors after all changes. | TypeScript compiler exits with code 0. |
| AC-15 | `pnpm build` completes without errors. | Build pipeline exits 0. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Use `TrendingUp`/`TrendingDown`/`Minus` Lucide icons instead of `ArrowUp`/`ArrowDown`/`ArrowRight`. | `TrendingUp`/`TrendingDown` visually communicate "change over time" via their diagonal line, which matches the temporal comparison semantics. `Minus` for stable avoids confusing the "stable" arrow with the "View District" `ArrowRight` already used in the card's hover overlay (line 202). Using the same icon for two different meanings on the same component would create ambiguity. | (a) `ArrowUp`/`ArrowDown`/`ArrowRight` per combined recommendations -- rejected: `ArrowRight` conflicts with the existing navigation affordance on the same card. (b) `ChevronUp`/`ChevronDown`/`Minus` -- viable but chevrons read as "expand/collapse" in UI conventions. (c) Unicode arrows -- rejected: rendering varies across fonts and operating systems. |
| D-2 | Use color for trend semantics (red=increase, green=decrease, gray=stable) as a third visual channel separate from severity-color and priority-shape. | Trend direction is a category-level aggregate temporal comparison, not a property of individual alerts. It appears in a different visual location (next to the count, not on an alert badge), at a different scope (one per category card vs one per alert), and encodes a different data type (direction of change vs current state). This three-channel separation is cognitively unambiguous because each channel answers a different question: severity = "how bad is this alert?", priority = "how urgently must we act on this alert?", trend = "is this category getting better or worse over time?". Per the task specification, this is acceptable because trend direction is a "third visual dimension separate from both severity-color and priority-shape." | (a) Achromatic trend arrows (white-channel opacity only, like priority) -- rejected: would create confusion with priority shapes. Both would be small, achromatic indicators on the card, visually indistinguishable at a glance. Color differentiation is warranted here. (b) Trend encoded as badge shape -- rejected: would collide with the priority shape channel. |
| D-3 | Add `trend` to `CategoryGridItem` (display type) rather than to `CoverageByCategory` (data type). | `CoverageByCategory` represents data from the coverage/intel endpoints. Trend data comes from a different endpoint (`/console/threat-picture`). Merging at the display type level (`CategoryGridItem`) preserves the separation of data sources. The `buildAllGridItems()` function is the natural join point -- it already merges `CategoryMeta` (static) with `CoverageByCategory` (live metrics); adding a trend overlay is the same pattern. | (a) Add `trend` to `CoverageByCategory` -- rejected: would couple the coverage-utils type to threat-picture data, creating a cross-concern dependency. (b) Pass trend data as a separate prop to `CategoryCard` -- viable but adds prop surface area. Enriching `item` keeps the card's interface stable. |
| D-4 | Trend arrow is a file-private sub-component (`TrendArrow`) inside `CategoryCard.tsx`, not an exported shared component. | The trend arrow's visual treatment (icon selection, colors, sizes) is specific to the `CategoryCard` context. No other component currently needs this exact rendering. If trend arrows are needed elsewhere (e.g., district view, GeoSummaryPanel), a shared component can be extracted at that time. Premature extraction adds export surface without consumers. | (a) Export as `TrendArrow` from its own file -- rejected: no other consumer exists. Single-consumer components belong in the consumer's file. (b) Inline the rendering logic without a sub-component -- rejected: the `TREND_CONFIG` lookup + JSX is cleaner as a named function for readability. |
| D-5 | Use 70% opacity for colored trend arrows (up/down) and 40% for stable. | The trend arrow is a supporting annotation, not a primary metric. At 100% opacity, the red/green color would compete with the alert count number for visual attention. At 70%, the color is clearly identifiable (red vs green) but subordinate to the bold count. The stable arrow at 40% opacity is deliberately the most muted -- "no change" is the least interesting state and should add minimal visual noise. These opacity levels were calibrated against the card's existing visual hierarchy: category icon at full color (line 163-164), count at `text-text-primary` (line 172), source count at `text-text-tertiary` (line 177). | (a) Full opacity (100%) -- rejected: too visually dominant for a secondary indicator. (b) Uniform opacity for all three states -- rejected: stable should be less prominent than up/down. (c) Match severity badge opacity patterns -- rejected: severity badges use `color-mix` backgrounds (CategoryDetailScene line 297-303), which is a different treatment. |
| D-6 | Pass trend data via a `Map<string, TrendDirection>` parameter to `buildAllGridItems()` rather than via a separate prop on `CoverageGrid`. | This keeps the data join at the builder level and avoids adding a `trendMap` prop through `CoverageGrid` to `CategoryCard`. The grid's responsibility is layout; it should not be aware of trend data. By enriching `CategoryGridItem` before it reaches the grid, the data flow is: `page.tsx` (join point) -> `buildAllGridItems(metrics, trendMap)` -> `CoverageGrid` (passes `item` as-is) -> `CategoryCard` (reads `item.trend`). No intermediate components need modification. | (a) Pass `trendMap` as a prop through `CoverageGrid` to `CategoryCard` -- rejected: adds a prop to an intermediary that does not use it (prop drilling). (b) Use React Context for trend data -- rejected: overkill for a single data field consumed by one component type. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | What is the exact field name and structure for per-category trend data in the `useThreatPicture` hook response? Section 4.7 assumes `trendByCategory: Array<{ category: string, trend: TrendDirection }>`. If WS-4.1 structures it differently (e.g., trend as a field on each category count object, or a flat record), the `trendMap` derivation in `page.tsx` will need adjustment. | WS-4.1 implementer | Phase 4 (resolved when WS-4.1 SOW is finalized) |
| Q-2 | Should the trend arrow include a tooltip showing the magnitude of change (e.g., "+4 from previous period" or "+33%")? The current spec is directional only. A tooltip would add precision without cluttering the card. | Product / IA specialist | Phase 4 or post-Phase 4 iteration |
| Q-3 | What time window defines "previous period" for the trend comparison? (e.g., current 24h vs previous 24h, current 6h vs previous 6h). This is determined by the backend `/console/threat-picture` endpoint, not by the viewer -- but the viewer should display the comparison window somewhere (perhaps in the tooltip from Q-2). | Backend / WS-4.1 | Phase 4 |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-4.1 `useThreatPicture` response does not include per-category trend data, or structures it differently than assumed. | Medium | Low | The `trendMap` derivation in `page.tsx` (Section 4.7) is the only coupling point. If the shape differs, only the `useMemo` that builds the `trendMap` needs adjustment. The `CategoryCard` rendering and `buildAllGridItems()` function are insulated via the `TrendDirection` type. If trend data is absent entirely, `trend` remains `undefined` on all grid items and no arrows render -- the feature degrades gracefully to the current visual state. |
| R-2 | The red/green trend colors are not distinguishable for users with red-green color vision deficiency (protanopia/deuteranopia). | Medium | Medium | The arrow direction itself (up vs down vs horizontal) provides a shape-based channel that does not depend on color perception. Users with color vision deficiency can still distinguish "upward trending line" from "downward trending line" from "horizontal dash." Additionally, the `aria-label` provides explicit text ("trending up"/"trending down"/"stable"). A future enhancement could add pattern differentiation (e.g., dashed line for down) if field testing reveals issues. |
| R-3 | Adding a flex wrapper around the alert count changes the layout of the card, particularly at small viewport sizes or when the count is large (4+ digits). | Low | Low | The flex wrapper (`span` with `flex items-center gap-1.5`) is inline-level and adds only 14px + 6px gap = 20px of horizontal space. The card width in the grid is `~160px` (CARD_WIDTH constant in CoverageGrid.tsx, line 32). A 4-digit count at `text-2xl` is approximately 60px wide. With the arrow, the total is ~80px, well within the 160px card. The flex wrapper will also naturally wrap if space is insufficient, though this should not occur with current dimensions. |
| R-4 | Multiple categories all showing red "up" trend arrows at once creates visual alarm/anxiety. | Low | Low | This is desirable behavior -- if many categories are trending up simultaneously, that is genuinely alarming and the visual should reflect it. The 70% opacity and small 14px size ensure the arrows are informational, not panic-inducing. If this proves too noisy in practice, the stable arrows could be hidden entirely (only show up/down), reducing visual density. |
| R-5 | The `Minus` icon for stable trend is visually ambiguous -- it could be read as "no data" or a loading placeholder. | Low | Low | The dash appears only when threat picture data is available and the trend is explicitly `'stable'`. When data is unavailable, no icon appears at all (`trend` is `undefined`). This distinction -- "no icon" vs "dash icon" -- communicates the difference between "we don't know the trend" and "the trend is flat." If user testing reveals confusion, the stable state could use `Equal` (two horizontal lines) or `MoveRight` instead. |
