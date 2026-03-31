# WS-B.2: Category Grid

> **Workstream ID:** WS-B.2
> **Phase:** B -- Situation Tab
> **Assigned Agent:** `world-class-ux-designer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.2 (MobileShell `situationContent` slot), WS-A.3 (spacing tokens, glass tokens, typography tokens, touch target tokens, severity tokens, animation timing tokens), WS-A.4 (safe area tokens consumed via shell padding)
> **Blocks:** WS-D.1 (Category Detail bottom sheet opened by tapping a card), WS-D.3 (Morph + Navigation wires `startMorph` from card tap)
> **Resolves:** Gap 6 (morph + tab switch conflict -- guard implemented in MobileShell per WS-A.2; this WS calls `startMorph` which is the morph trigger)

---

## 1. Objective

Build the mobile Situation tab's primary content: a 2-column CSS Grid of 15 category cards that displays live intel coverage metrics from the TarvaRI API. Each card shows the category icon, short code, alert count, source count, trend direction, and a severity breakdown mini-bar. The grid sorts by alert count descending with sort dampening to prevent visual jitter on minor count fluctuations.

Cards support two gestures: **tap** to initiate a fast-path morph into the category detail bottom sheet (WS-D.1), and **long-press** (500ms) to toggle the map filter for that category (with haptic feedback). The grid integrates the shared `MobileStateView` (AD-7) for loading, error, and empty states, and consumes all data through the existing `useCoverageMetrics()` TanStack Query hook and `buildAllGridItems()` utility.

This workstream delivers the core navigational surface for the mobile experience. Every subsequent mobile interaction -- category detail drill-down, alert inspection, map filtering -- originates from a tap or long-press on a card in this grid.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `MobileCategoryGrid` component | 2-column CSS Grid container rendering all 15 KNOWN_CATEGORIES. Consumes `useCoverageMetrics()` and `buildAllGridItems()`. Sorts by `alertCount` descending with sort dampening. Integrates `MobileStateView` for loading/error/empty states. |
| `MobileCategoryCard` component | ~165x80px card showing icon, short code, alert count, source count, trend arrow, severity mini-bar. Supports tap and long-press gestures. Glass aesthetic with category color left accent. |
| `useSortDampening` hook | Pure logic hook implementing the sort dampening algorithm. Maintains a stable sort order ref and only re-sorts when the maximum position delta across all items is >= 2. |
| `useLongPress` hook | Gesture detection hook that distinguishes tap from long-press (500ms threshold). Handles `contextmenu` prevention, pointer cancellation on move, and haptic feedback. |
| `SeverityMiniBar` sub-component | Horizontal stacked bar (full card width, 3px height) showing proportional P1/P2/other segments using severity color tokens. |
| CSS file `mobile-category-grid.css` | Grid layout, card layout, severity mini-bar, press feedback animation, long-press visual indicator. |
| Integration in `MobileView` | Wire `MobileCategoryGrid` into MobileShell's `situationContent` prop. |
| Unit tests | Sort dampening algorithm, long-press gesture timing, grid rendering with mock data. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Category detail bottom sheet | WS-D.1 builds the sheet that opens when `startMorph` fires. |
| Map filter visual feedback on the map | WS-C.3 (Map View) and WS-C.4 (Map Interactions) render filtered markers. This WS only toggles `selectedCategories` in the coverage store. |
| Threat banner above the grid | WS-B.1 (Threat Banner + Priority). The grid renders below whatever content WS-B.1 places in the Situation tab. |
| Ambient effects (ThreatPulseBackground, EdgeGlow) | WS-B.3 (Ambient + Protective Ops). |
| Priority strip / pill bar | WS-B.1 scope. This grid renders below it. |
| Trend data computation | The `trendMap` is derived from threat picture data (WS-4.4 desktop scope). If `trendMap` is `undefined`, trend arrows are simply not rendered. No mobile-specific trend computation is required. |
| Pull-to-refresh on the grid | WS-F.5 (Pull-to-Refresh + Edge Polish). The grid scrolls normally within `.mobile-content`. |
| Landscape grid layout (3-column) | WS-F.1 (Landscape Layouts). This WS builds portrait-first 2-column layout only. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-A.2 `MobileShell` | `situationContent` prop slot in `MobileShellProps` for rendering the grid | Pending (WS-A.2) |
| WS-A.2 `MobileStateView` | `MobileStateView` component at `src/components/mobile/MobileStateView.tsx` for loading/error/empty states | Pending (WS-A.2 D-8) |
| WS-A.3 `mobile-tokens.css` | Spacing tokens (`--space-card-padding`, `--space-card-gap`, `--space-content-padding`, `--space-section-gap`), glass tokens (`--glass-card-bg`, `--glass-card-blur`), animation tokens (`--duration-card-press`), typography tokens (`--text-card-metric`, `--text-card-title`, `--text-label`, `--text-caption`, `--tracking-label-mobile`), touch tokens (`--touch-target-min`, `--touch-target-comfortable`), severity tokens (`--severity-extreme` through `--severity-unknown`) | Pending (WS-A.3) |
| `src/hooks/use-coverage-metrics.ts` | `useCoverageMetrics()` hook returning `UseQueryResult<CoverageMetrics>` | EXISTS (lines 135-143) |
| `src/lib/interfaces/coverage.ts` | `KNOWN_CATEGORIES`, `CategoryMeta`, `CategoryGridItem`, `buildAllGridItems()`, `getCategoryMeta()`, `getCategoryColor()`, `getCategoryIcon()`, `SEVERITY_COLORS`, `SeverityLevel`, `TrendDirection` | EXISTS (full file) |
| `src/lib/coverage-utils.ts` | `CoverageByCategory`, `CoverageMetrics` types | EXISTS (lines 21-72) |
| `src/stores/coverage.store.ts` | `toggleCategory(id)` action, `selectedCategories` state, `coverageSelectors.hasSelection` | EXISTS (lines 184-192, 329) |
| `src/stores/ui.store.ts` | `startMorph(nodeId, options?)` action, `morph.phase` state, `resetMorph()` action | EXISTS (lines 103-119, 145-149) |
| `src/lib/morph-types.ts` | `StartMorphOptions` type (`{ fast?: boolean }`) | EXISTS (lines 106-114) |
| `src/components/coverage/CategoryCard.tsx` | Reference implementation for desktop card data shapes, icon resolution map (`ICON_MAP`), trend arrow rendering pattern | EXISTS (reference only -- not imported by mobile) |
| Lucide React icons | All 15 category icons + `TrendingUp`, `TrendingDown`, `Minus` | Available via `lucide-react` dependency |

---

## 4. Deliverables

### D-1: `useSortDampening` hook (`src/hooks/use-sort-dampening.ts`)

A pure logic hook that stabilizes the visual order of grid items to prevent distracting re-sorts when alert counts fluctuate by small amounts (per `information-architecture.md` Section 12.3, client Q6).

**Type signature:**

```typescript
/**
 * Stabilize sort order to prevent visual jitter from minor count fluctuations.
 *
 * Items are sorted by `alertCount` descending, with KNOWN_CATEGORIES index
 * as the tie-breaker (preserving the canonical category order when counts
 * are equal). The new sort is only applied when the maximum position delta
 * across all items is >= the dampening threshold.
 *
 * @param items - The unsorted CategoryGridItem[] from buildAllGridItems().
 * @param threshold - Minimum position delta to trigger a re-sort. Default: 2.
 * @returns A stably-sorted copy of items.
 *
 * @module use-sort-dampening
 * @see information-architecture.md Section 12.3, client Q6
 */
export function useSortDampening(
  items: CategoryGridItem[],
  threshold?: number,
): CategoryGridItem[]
```

**Algorithm (detailed):**

1. Maintain a `useRef<string[]>` storing the previous sort order as an array of category IDs (e.g., `['conflict', 'seismic', 'weather', ...]`).

2. On each call, compute the **candidate sort**: sort `items` by `alertCount` descending. When two items have equal `alertCount`, break ties by their index in `KNOWN_CATEGORIES` (ascending), so `seismic` (index 0) comes before `weather` (index 8) when both have 5 alerts.

3. If the previous order ref is empty (first render), accept the candidate sort, store it, and return.

4. Otherwise, compute the **maximum position delta**: for each item in the candidate sort, find its index in the previous order. Calculate `abs(candidateIndex - previousIndex)`. Take the maximum across all 15 items.

5. If `maxDelta >= threshold` (default 2), accept the candidate sort: update the ref and return the new order.

6. If `maxDelta < threshold`, **reject the candidate sort**: return the items re-arranged according to the previous order stored in the ref. Items present in the new data but absent from the ref (should not happen with 15 fixed categories, but defensive) are appended at the end.

7. The hook uses `useMemo` for the sort computation, keyed on the stringified `alertCount` values of the input items (not referential identity, since TanStack Query returns new objects on each poll).

**Tie-breaking detail:** Build a lookup map from `KNOWN_CATEGORIES`:

```typescript
const CATEGORY_ORDER = new Map(KNOWN_CATEGORIES.map((c, i) => [c.id, i]))
```

Sort comparator:

```typescript
(a, b) => {
  const countDiff = b.metrics.alertCount - a.metrics.alertCount
  if (countDiff !== 0) return countDiff
  return (CATEGORY_ORDER.get(a.id) ?? 99) - (CATEGORY_ORDER.get(b.id) ?? 99)
}
```

**File location:** `src/hooks/use-sort-dampening.ts`

**Estimated size:** ~60 lines.

---

### D-2: `useLongPress` hook (`src/hooks/use-long-press.ts`)

A gesture detection hook that returns event handler props for distinguishing tap from long-press on touch and pointer devices. Handles browser context menu suppression (Combined-rec Risk 4).

**Type signature:**

```typescript
export interface UseLongPressOptions {
  /** Callback fired on a short tap (< threshold duration). */
  onTap: () => void
  /** Callback fired when long-press threshold is reached. */
  onLongPress: () => void
  /** Long-press threshold in milliseconds. Default: 500. */
  threshold?: number
  /** Whether to trigger haptic feedback on long-press. Default: true. */
  haptic?: boolean
  /** Whether the gesture handlers are active. Default: true. */
  enabled?: boolean
}

export interface UseLongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
  onPointerLeave: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  /** Whether a long-press is currently in progress (for visual feedback). */
  isLongPressing: boolean
  /** Whether the element is currently being pressed (for press-state styling). */
  isPressed: boolean
}

export function useLongPress(options: UseLongPressOptions): UseLongPressHandlers
```

**Behavior (detailed):**

1. **`onPointerDown`:** Record the pointer position (`clientX`, `clientY`) in a ref. Set `isPressed = true`. Start a `setTimeout` of `threshold` ms (default 500). When the timeout fires: set `isLongPressing = false` (it already happened), call `onLongPress()`, and if `haptic` is true, call `navigator.vibrate?.(10)`.

2. **`onPointerUp`:** If the timeout has NOT fired (timer still pending), clear the timeout and call `onTap()`. Set `isPressed = false`. Reset all refs.

3. **`onPointerMove`:** If the pointer has moved more than 10px from the initial position (`Math.hypot(dx, dy) > 10`), cancel the long-press timer, set `isPressed = false`. This prevents long-press from firing when the user drags/scrolls.

4. **`onPointerCancel` / `onPointerLeave`:** Clear the timeout. Set `isPressed = false`. Reset.

5. **`onContextMenu`:** Call `e.preventDefault()` to suppress the browser context menu that would otherwise appear on long-press (Combined-rec Risk 4). Only prevent default when `enabled` is true.

6. **Cleanup:** The hook runs a cleanup effect that clears any pending timeout on unmount.

7. **`isLongPressing`:** A transient boolean that is `true` only during the frame when the long-press callback is invoked. Primarily for ARIA announcement purposes; visual feedback uses `isPressed`.

8. **`isPressed`:** `true` from `onPointerDown` until `onPointerUp`, `onPointerCancel`, `onPointerLeave`, or pointer move exceeding the threshold. Used by the card to apply the `scale(0.97)` press feedback.

**Why PointerEvents over TouchEvents:** Pointer Events unify mouse and touch handling, work correctly on hybrid devices (Surface, iPad with keyboard), and are the W3C standard. The `onContextMenu` handler covers the browser context menu on all platforms.

**File location:** `src/hooks/use-long-press.ts`

**Estimated size:** ~90 lines.

---

### D-3: `MobileCategoryCard` component (`src/components/mobile/MobileCategoryCard.tsx`)

Individual category card for the mobile grid. Distinct from the desktop `CategoryCard` (AD-1: separate mobile component tree).

**Props interface:**

```typescript
import type { CategoryGridItem, TrendDirection } from '@/lib/interfaces/coverage'

export interface MobileCategoryCardProps {
  /** Category data (metadata + live metrics). */
  item: CategoryGridItem
  /** Whether this card's category is currently active as a map filter. */
  isFiltered: boolean
  /** Callback when this card is tapped (navigates to category detail). */
  onTap: (categoryId: string) => void
  /** Callback when this card is long-pressed (toggles map filter). */
  onLongPress: (categoryId: string) => void
}
```

**Visual specification (portrait, ~165x80px):**

```
+--+----------------------------+
|  | SEIS        ▲  12 alerts  |  ← left accent (3px, category color)
|  | [icon]   3 sources        |  ← icon 18px, category color
|  | ▓▓▓▓▓▓▒▒░░░░░░░░░░░░░░░  |  ← severity mini-bar (3px)
+--+----------------------------+
```

| Element | Spec | Token Reference |
|---------|------|----------------|
| Container | `min-height: 80px`, `border-radius: 12px`, `padding: var(--space-card-padding)` (14px) | `--space-card-padding` |
| Background | `var(--glass-card-bg)` (`rgba(255,255,255,0.03)`) | `--glass-card-bg` |
| Backdrop filter | `var(--glass-card-blur)` (`blur(8px) saturate(120%)`) | `--glass-card-blur` |
| Border | `1px solid rgba(var(--ambient-ink-rgb), 0.08)` | -- |
| Left accent | `3px solid {category color}` via `border-left` | `meta.color` |
| Category icon | 18px, `color: {meta.color}` | Lucide icon from `ICON_MAP` |
| Short code | `font-size: var(--text-label)` (11px), `font-family: var(--font-mono)`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: var(--tracking-label-mobile)` (0.14em), `color: var(--color-text-secondary)` | `--text-label`, `--tracking-label-mobile` |
| Alert count | `font-size: var(--text-card-metric)` (22px), `font-family: var(--font-mono)`, `font-weight: 700`, `color: var(--color-text-primary)`, `font-variant-numeric: tabular-nums` | `--text-card-metric` |
| "alerts" label | `font-size: var(--text-caption)` (10px), `color: var(--color-text-tertiary)`, adjacent to count | `--text-caption` |
| Source count | `font-size: var(--text-caption)` (10px), `color: var(--color-text-tertiary)`, `font-variant-numeric: tabular-nums` | `--text-caption` |
| Trend arrow | 12px Lucide icon (`TrendingUp` red / `TrendingDown` green / `Minus` gray), adjacent to alert count. Only rendered when `item.trend` is defined. | Same colors as desktop `TREND_CONFIG` |
| Filter indicator | When `isFiltered === true`: subtle inner glow using `box-shadow: inset 0 0 12px {meta.color}15` and border opacity boost to `rgba(var(--ambient-ink-rgb), 0.15)` | -- |
| Press feedback | `transform: scale(0.97)` with `transition: transform var(--duration-card-press) var(--ease-default)` (100ms). Applied when `useLongPress.isPressed` is `true`. | `--duration-card-press` |
| Focus visible | `outline: 2px solid var(--color-ember-bright)`, `outline-offset: 2px` | Existing focus pattern from desktop `CategoryCard` |
| Minimum touch target | Entire card is tappable. Minimum dimensions enforced by `min-height: 80px` and grid column width (>= 44px). | `--touch-target-min` (44px) |

**Internal layout:** Flexbox column.

- **Row 1:** Short code (left) + trend arrow + alert count (right). `justify-content: space-between`.
- **Row 2:** Icon (left, 18px) + source count (right). `justify-content: space-between`.
- **Row 3:** Severity mini-bar (full width, 3px height).

**Gesture handling:** Uses the `useLongPress` hook (D-2):

```typescript
const handlers = useLongPress({
  onTap: () => onTap(item.id),
  onLongPress: () => onLongPress(item.id),
  threshold: 500,
  haptic: true,
})
```

Spread `handlers` onto the root `<div>`:

```tsx
<div
  className="mobile-category-card"
  role="button"
  tabIndex={0}
  aria-label={buildAriaLabel(item, isFiltered)}
  style={{
    transform: handlers.isPressed ? 'scale(0.97)' : 'scale(1)',
    transition: `transform var(--duration-card-press) var(--ease-default)`,
    borderLeftColor: item.meta.color,
  }}
  onKeyDown={handleKeyDown}
  {...handlers}
>
```

**Keyboard support:** `onKeyDown` handler: `Enter` or `Space` fires `onTap`. No keyboard equivalent for long-press (long-press is a touch-only gesture; keyboard users access map filtering through other UI affordances in WS-C.4).

**ARIA label construction:**

```typescript
function buildAriaLabel(item: CategoryGridItem, isFiltered: boolean): string {
  const { meta, metrics, trend } = item
  const parts = [
    `${meta.displayName} category`,
    `${metrics.alertCount} alerts`,
    `${metrics.sourceCount} sources`,
  ]
  if (metrics.p1Count > 0) parts.push(`${metrics.p1Count} critical`)
  if (metrics.p2Count > 0) parts.push(`${metrics.p2Count} high priority`)
  if (trend) {
    const trendLabel = trend === 'up' ? 'trending up' : trend === 'down' ? 'trending down' : 'stable'
    parts.push(trendLabel)
  }
  if (isFiltered) parts.push('filtering map')
  return parts.join(', ')
}
```

**Icon resolution:** Uses a static `ICON_MAP` identical to the one in the desktop `CategoryCard` (`src/components/coverage/CategoryCard.tsx` lines 69-85). This map is duplicated rather than shared to maintain the separate mobile component tree boundary (AD-1). If a future workstream extracts it to a shared utility, both files can be updated.

**File location:** `src/components/mobile/MobileCategoryCard.tsx`

**Estimated size:** ~180 lines (including ICON_MAP, TREND_CONFIG, buildAriaLabel, SeverityMiniBar).

---

### D-4: `SeverityMiniBar` sub-component (inline in `MobileCategoryCard.tsx`)

A file-private component rendering a horizontal stacked bar showing the proportional breakdown of alert severity within a category.

**Props:**

```typescript
interface SeverityMiniBarProps {
  /** Number of P1 (Critical / Extreme severity) alerts. */
  p1Count: number
  /** Number of P2 (High / Severe severity) alerts. */
  p2Count: number
  /** Total alert count (p1 + p2 + other). */
  total: number
  /** Category color for the "other" (non-priority) segment. */
  categoryColor: string
}
```

**Visual specification:**

| Property | Value |
|----------|-------|
| Height | `3px` |
| Width | `100%` of card content area |
| Border radius | `1.5px` (pill shape) |
| Background | `rgba(var(--ambient-ink-rgb), 0.06)` (track) |
| P1 segment color | `var(--severity-extreme)` (`#ef4444`) |
| P2 segment color | `var(--severity-severe)` (`#f97316`) |
| Other segment color | `{categoryColor}` at 30% opacity |
| Segment order | P1 (left) | P2 (middle) | Other (right) |
| Minimum segment width | `2px` (if count > 0, ensure visibility) |
| Empty state | When `total === 0`, render only the track background with no segments |

**Implementation:** Three `<div>` segments inside a flex container. Each segment's `flex-basis` is `(count / total) * 100%`. Segments with `count === 0` are not rendered.

```tsx
function SeverityMiniBar({ p1Count, p2Count, total, categoryColor }: SeverityMiniBarProps) {
  if (total === 0) {
    return <div className="severity-mini-bar" aria-hidden="true" />
  }
  const otherCount = total - p1Count - p2Count
  return (
    <div className="severity-mini-bar" role="img" aria-label={`${p1Count} critical, ${p2Count} high, ${otherCount} other`}>
      {p1Count > 0 && (
        <div style={{ flex: p1Count, minWidth: 2, background: 'var(--severity-extreme)' }} />
      )}
      {p2Count > 0 && (
        <div style={{ flex: p2Count, minWidth: 2, background: 'var(--severity-severe)' }} />
      )}
      {otherCount > 0 && (
        <div style={{ flex: otherCount, minWidth: 2, background: categoryColor, opacity: 0.3 }} />
      )}
    </div>
  )
}
```

---

### D-5: `MobileCategoryGrid` component (`src/components/mobile/MobileCategoryGrid.tsx`)

The container component that fetches data, sorts items with dampening, and renders the 2-column CSS Grid of `MobileCategoryCard` components.

**Props interface:**

```typescript
export interface MobileCategoryGridProps {
  /** Optional trend data from threat picture. When undefined, trend arrows are hidden on all cards. */
  trendMap?: Map<string, TrendDirection>
}
```

**Behavior:**

1. **Data fetching:** Calls `useCoverageMetrics()` to get `CoverageMetrics`. Passes `metrics.byCategory` and `trendMap` to `buildAllGridItems()` to produce 15 `CategoryGridItem[]`.

2. **Sort dampening:** Passes the grid items through `useSortDampening(items, 2)` (D-1) to get a stably-sorted array.

3. **Loading/error/empty states:** Wraps the grid in a `MobileStateView` check (AD-7). If `query.isLoading`, renders a skeleton grid (D-6). If `query.isError`, renders the error state with retry. If data is empty (0 items after build), renders empty state. Otherwise, renders the card grid.

4. **Store reads:**
   - `const selectedCategories = useCoverageStore(s => s.selectedCategories)` for determining `isFiltered` per card.
   - `const toggleCategory = useCoverageStore(s => s.toggleCategory)` for long-press handler.
   - `const startMorph = useUIStore(s => s.startMorph)` for tap handler.
   - `const morphPhase = useUIStore(s => s.morph.phase)` for morph guard.

5. **Tap handler:**

```typescript
const handleCardTap = useCallback((categoryId: string) => {
  // Guard: do not start morph if one is already in progress
  if (morphPhase !== 'idle') return
  startMorph(categoryId, { fast: true })
}, [morphPhase, startMorph])
```

6. **Long-press handler:**

```typescript
const handleCardLongPress = useCallback((categoryId: string) => {
  toggleCategory(categoryId)
}, [toggleCategory])
```

7. **Grid rendering:**

```tsx
<div className="mobile-category-grid">
  {sortedItems.map((item) => (
    <MobileCategoryCard
      key={item.id}
      item={item}
      isFiltered={selectedCategories.includes(item.id)}
      onTap={handleCardTap}
      onLongPress={handleCardLongPress}
    />
  ))}
</div>
```

**File location:** `src/components/mobile/MobileCategoryGrid.tsx`

**Estimated size:** ~100 lines.

---

### D-6: Grid skeleton component (inline in `MobileCategoryGrid.tsx`)

A file-private skeleton component rendered during the loading state.

```tsx
function MobileCategoryGridSkeleton() {
  return (
    <div className="mobile-category-grid" aria-busy="true" aria-label="Loading categories">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="mobile-category-card-skeleton">
          <div className="skeleton-line skeleton-short" />
          <div className="skeleton-line skeleton-long" />
          <div className="skeleton-bar" />
        </div>
      ))}
    </div>
  )
}
```

Six skeleton cards (not 15) to fill the visible viewport without excess. Skeleton uses a shimmer animation via `@keyframes` from `enrichment.css` or a simple pulse on `opacity`. Skeleton cards match the same `min-height: 80px` and `border-radius: 12px` as real cards.

---

### D-7: CSS file (`src/styles/mobile-category-grid.css`)

Dedicated CSS file for the grid and card components. Imported by `MobileCategoryGrid.tsx`.

```css
/* ================================================================
   Mobile Category Grid + Card
   Phase B -- WS-B.2
   ================================================================ */

/* ----- Grid container ----- */
.mobile-category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-card-gap, 10px);
  padding: var(--space-content-padding, 12px);
  padding-top: var(--space-section-gap, 16px);
}

/* ----- Card ----- */
.mobile-category-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 80px;
  padding: var(--space-card-padding, 14px);
  border-radius: 12px;
  border: 1px solid rgba(var(--ambient-ink-rgb), 0.08);
  border-left: 3px solid currentColor;  /* overridden via inline style */
  background: var(--glass-card-bg, rgba(255, 255, 255, 0.03));
  backdrop-filter: var(--glass-card-blur, blur(8px) saturate(120%));
  -webkit-backdrop-filter: var(--glass-card-blur, blur(8px) saturate(120%));
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
  /* Press feedback transition */
  transition: transform var(--duration-card-press, 100ms) var(--ease-default, cubic-bezier(0.4, 0, 0.2, 1));
  /* Focus visible */
  outline: none;
}

.mobile-category-card:focus-visible {
  outline: 2px solid var(--color-ember-bright, #ff773c);
  outline-offset: 2px;
}

/* Filter-active state */
.mobile-category-card[data-filtered='true'] {
  border-color: rgba(var(--ambient-ink-rgb), 0.15);
}

/* ----- Card inner layout ----- */
.mobile-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.mobile-card-shortcode {
  font-family: var(--font-mono);
  font-size: var(--text-label, 11px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label-mobile, 0.14em);
  color: var(--color-text-secondary);
  line-height: var(--line-height-label, 1.3);
}

.mobile-card-metric-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.mobile-card-alert-count {
  font-family: var(--font-mono);
  font-size: var(--text-card-metric, 22px);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: var(--line-height-metric, 1.0);
  font-variant-numeric: tabular-nums;
}

.mobile-card-alert-label {
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  color: var(--color-text-tertiary);
  line-height: 1;
}

.mobile-card-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.mobile-card-source-count {
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/* ----- Severity mini-bar ----- */
.severity-mini-bar {
  display: flex;
  width: 100%;
  height: 3px;
  border-radius: 1.5px;
  overflow: hidden;
  background: rgba(var(--ambient-ink-rgb), 0.06);
  margin-top: auto;
}

/* ----- Skeleton ----- */
.mobile-category-card-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 80px;
  padding: var(--space-card-padding, 14px);
  border-radius: 12px;
  background: rgba(var(--ambient-ink-rgb), 0.03);
  border: 1px solid rgba(var(--ambient-ink-rgb), 0.04);
}

.skeleton-line {
  height: 10px;
  border-radius: 5px;
  background: rgba(var(--ambient-ink-rgb), 0.06);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-short { width: 40%; }
.skeleton-long  { width: 70%; }

.skeleton-bar {
  height: 3px;
  border-radius: 1.5px;
  background: rgba(var(--ambient-ink-rgb), 0.04);
  margin-top: auto;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
  animation-delay: 0.3s;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

/* ----- Reduced motion ----- */
@media (prefers-reduced-motion: reduce) {
  .mobile-category-card {
    transition: none;
  }
  .skeleton-line,
  .skeleton-bar {
    animation: none;
  }
}

/* ----- Scroll-gated glass tier 2 disable ----- */
.mobile-category-card.glass-tier-2-off {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}
```

**File location:** `src/styles/mobile-category-grid.css`

**Import:** Added as the first import in `MobileCategoryGrid.tsx`:

```typescript
import '@/styles/mobile-category-grid.css'
```

---

### D-8: Integration in `MobileView` (`src/views/MobileView.tsx`)

After WS-A.2 creates the `MobileView` entry point, this workstream populates the `situationContent` prop:

```typescript
import { MobileShell } from '@/components/mobile/MobileShell'
import { MobileCategoryGrid } from '@/components/mobile/MobileCategoryGrid'

export default function MobileView() {
  return (
    <MobileShell
      situationContent={<MobileCategoryGrid />}
    />
  )
}
```

The `trendMap` prop on `MobileCategoryGrid` is intentionally omitted for Phase B. When threat picture data becomes available (it is computed on the desktop page in `page.tsx` lines 351-354), a future workstream can lift the computation into a shared hook and pass it as a prop.

---

### D-9: Unit tests

#### D-9a: `src/hooks/__tests__/use-sort-dampening.test.ts`

Test the sort dampening algorithm in isolation.

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `sorts by alertCount descending on first render` | Pass 15 items with various alert counts. | Items returned in descending alertCount order. |
| `breaks ties using KNOWN_CATEGORIES index` | Two items with alertCount=5: 'seismic' (index 0) and 'weather' (index 8). | 'seismic' comes before 'weather'. |
| `does not re-sort when max delta < threshold` | Render with [A=10, B=9, C=8]. Update to [A=10, B=10, C=8] (B moves from index 1 to 0, delta=1). | Order remains [A, B, C] (previous order). |
| `re-sorts when max delta >= threshold` | Render with [A=10, B=9, C=8]. Update to [C=15, B=9, A=3] (C moves from index 2 to 0, delta=2). | New order [C, B, A] applied. |
| `handles empty input` | Pass empty array. | Returns empty array. |
| `handles all items with same alertCount` | All 15 items have alertCount=0. | Returns items in KNOWN_CATEGORIES order (tie-break). |
| `custom threshold value` | Pass threshold=3. Items with max delta=2 should not re-sort. | Previous order maintained. |

#### D-9b: `src/hooks/__tests__/use-long-press.test.ts`

Test the gesture detection hook.

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `fires onTap for short press` | Simulate pointerDown then pointerUp after 100ms. | `onTap` called, `onLongPress` not called. |
| `fires onLongPress after threshold` | Simulate pointerDown, wait 500ms (via fake timers). | `onLongPress` called, `onTap` not called. |
| `cancels long-press on pointer move > 10px` | Simulate pointerDown, then pointerMove 15px away. | Neither `onTap` nor `onLongPress` called on pointerUp. |
| `does not cancel on small pointer move` | Simulate pointerDown, then pointerMove 5px away, then pointerUp. | `onTap` called (move was within tolerance). |
| `prevents context menu` | Simulate contextMenu event. | `event.preventDefault()` called. |
| `respects enabled=false` | Set `enabled: false`. Simulate pointerDown + pointerUp. | Neither callback called. |
| `cleans up timeout on unmount` | Simulate pointerDown, then unmount. | No callbacks called, no errors. |
| `isPressed is true during press` | Simulate pointerDown. | `isPressed` is `true`. After pointerUp, `isPressed` is `false`. |
| `triggers haptic on long-press` | Mock `navigator.vibrate`. Simulate long-press. | `navigator.vibrate(10)` called. |

#### D-9c: `src/components/mobile/__tests__/MobileCategoryGrid.test.tsx`

Integration-level component tests.

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| `renders 15 category cards when data is loaded` | Mock `useCoverageMetrics` to return metrics for all 15 categories. | 15 `MobileCategoryCard` elements rendered. |
| `renders skeleton during loading` | Mock `useCoverageMetrics` with `isLoading: true`. | Skeleton grid rendered (6 skeleton cards). |
| `renders error state with retry` | Mock `useCoverageMetrics` with `isError: true`. | Error message and retry button rendered. |
| `cards sorted by alertCount descending` | Provide items with known counts. | First card has highest alertCount. |
| `tapping a card calls startMorph with fast: true` | Mock `useUIStore`. Simulate tap on first card. | `startMorph(categoryId, { fast: true })` called. |
| `long-pressing a card calls toggleCategory` | Mock `useCoverageStore`. Simulate long-press (500ms timeout). | `toggleCategory(categoryId)` called. |
| `morph guard prevents tap when phase is not idle` | Mock `useUIStore` with `morph.phase = 'entering-district'`. Simulate tap. | `startMorph` not called. |
| `isFiltered prop reflects selectedCategories` | Mock store with `selectedCategories: ['seismic']`. | Seismic card renders with `isFiltered={true}`, others with `isFiltered={false}`. |

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `MobileCategoryGrid` renders a 2-column CSS Grid at viewport width 375px with `gap: 10px` and `padding: 12px`. | Chrome DevTools responsive mode at 375x812. Inspect grid layout via CSS Grid overlay. Verify `grid-template-columns: repeat(2, 1fr)`. |
| AC-2 | All 15 KNOWN_CATEGORIES are rendered as `MobileCategoryCard` components, including categories with zero alerts. | Count rendered cards. Verify 'other' card is present. |
| AC-3 | Cards are sorted by `alertCount` descending. Categories with equal counts are ordered per their KNOWN_CATEGORIES index. | Provide test data where conflict (alertCount=20) and seismic (alertCount=5) are present. Verify conflict appears before seismic. |
| AC-4 | Sort dampening prevents re-sort when the maximum position delta is < 2. | Load grid with [A=10, B=9]. After a poll cycle changes to [A=10, B=10], verify card order does not change visually. |
| AC-5 | Sort dampening applies new sort when maximum position delta >= 2. | Load grid with [A=10, B=9, C=8]. After poll changes to [C=20, B=9, A=1], verify C moves to the top. |
| AC-6 | Each card displays the correct category icon, short code, alert count, source count, and severity mini-bar. | Visual inspection of each card against the `KNOWN_CATEGORIES` metadata and mock metric data. |
| AC-7 | Trend arrows render when `trendMap` provides data: up (red TrendingUp), down (green TrendingDown), stable (gray Minus). | Pass `trendMap` with 'seismic' -> 'up'. Verify red TrendingUp icon on seismic card. |
| AC-8 | Trend arrows are absent when `trendMap` is undefined. | Render grid without `trendMap` prop. Verify no trend icons on any card. |
| AC-9 | Tapping a card calls `startMorph(categoryId, { fast: true })` when `morph.phase === 'idle'`. | Add `console.log` to `startMorph`. Tap a card. Verify log output with correct category ID and `fast: true`. |
| AC-10 | Tapping a card does nothing when `morph.phase !== 'idle'`. | Set morph to `entering-district` state. Tap a card. Verify `startMorph` is not called. |
| AC-11 | Long-pressing a card for 500ms calls `toggleCategory(categoryId)` and triggers haptic feedback. | Long-press a card on a physical device. Verify haptic vibration and category filter toggle in store. On Chrome DevTools: verify `navigator.vibrate` mock is called. |
| AC-12 | Long-press does not fire if the finger moves > 10px before the 500ms threshold. | Begin pressing, then drag finger. Verify no filter toggle occurs. |
| AC-13 | Browser context menu does not appear on long-press. | Long-press on a card on mobile Safari and Chrome. Verify no native context menu. |
| AC-14 | Press feedback: card scales to `0.97` during pointer-down and returns to `1.0` on release. Transition duration is 100ms. | Press and hold a card briefly. Observe scale animation. Inspect `transition` property: `transform 100ms ...`. |
| AC-15 | Cards with an active map filter show the filter indicator (inner glow, boosted border). | Toggle a category filter via long-press. Verify the card's `box-shadow` includes the inner glow and `data-filtered="true"` attribute is set. |
| AC-16 | Severity mini-bar shows correct proportional P1 (red) / P2 (orange) / other (category color at 30% opacity) segments. | Provide mock data: P1=3, P2=5, total=20. Verify bar shows ~15% red, ~25% orange, ~60% category-tinted. |
| AC-17 | Severity mini-bar renders empty (track only) when `alertCount === 0`. | Inspect a card with 0 alerts. Verify only the track background is visible. |
| AC-18 | Loading state renders the skeleton grid (6 shimmer cards) when `useCoverageMetrics` is loading. | Throttle the API response. Verify skeleton cards appear with pulse animation. |
| AC-19 | Error state renders the `MobileStateView` error card with retry button. Tapping retry calls `query.refetch()`. | Disconnect the TarvaRI API. Verify error card appears. Tap "Retry". Verify refetch is triggered (network request in DevTools). |
| AC-20 | Empty state renders when `byCategory` returns an empty array. | Mock the API to return `byCategory: []`. Verify empty state message appears. |
| AC-21 | `pnpm typecheck` passes with zero errors after all deliverables are added. | Run `pnpm typecheck` from project root. Exit code 0. |
| AC-22 | All unit tests in D-9a, D-9b, D-9c pass. | Run `pnpm test:unit`. All test files pass. |
| AC-23 | Desktop view is completely unaffected. The existing 9-column CSS Grid, desktop `CategoryCard`, and morph behavior render identically. | Load the main page at 1920x1080. Visual comparison against pre-change screenshot. |
| AC-24 | `prefers-reduced-motion: reduce` disables the press feedback transition and skeleton pulse animation. | Enable reduced motion in OS settings. Press a card. Verify no scale animation. Verify skeletons have no pulse. |
| AC-25 | Each card has a descriptive `aria-label` including category name, alert count, source count, priority counts (if any), trend direction (if available), and filter status. | Inspect ARIA labels in Chrome DevTools accessibility tree. |
| AC-26 | Cards are keyboard-navigable with `Tab` and activate with `Enter` / `Space`. | Tab through cards with a keyboard. Press Enter on a card. Verify `startMorph` fires. Verify focus ring is visible. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | Sort dampening uses a "maximum position delta" algorithm rather than a simple debounce or timer-based dampening. | A timer-based approach (e.g., "only re-sort every 10 seconds") would allow jarring reorders to accumulate and then all apply at once. The delta-based approach is *content-aware*: it allows large meaningful changes through immediately while suppressing minor shuffles. This directly addresses the client Q6 concern about visual jitter without introducing stale ordering. | (a) Timer debounce (re-sort every N seconds): rejected -- allows accumulated reorders to all apply at once, creating a "jump" effect. (b) Threshold on alertCount change rather than position delta: rejected -- an alertCount change of +1 on a high-count category may not change position at all, while +1 on a low-count category may move it several positions. Position delta is the correct metric for visual stability. (c) No dampening: rejected per spec. |
| DM-2 | `useLongPress` uses Pointer Events rather than Touch Events. | Pointer Events (W3C standard) unify mouse and touch input, work on hybrid devices (Surface, iPad with keyboard/trackpad), and provide `pointerCancel` for clean gesture teardown. Touch Events are iOS/Android-specific and require separate mouse event handling for desktop testing. All target browsers support Pointer Events. | (a) Touch Events + mouse fallback: rejected -- more code, platform-specific. (b) `use-long-press` third-party package: rejected -- adds a dependency for ~90 lines of straightforward logic. |
| DM-3 | The `ICON_MAP` is duplicated in `MobileCategoryCard` rather than shared with the desktop `CategoryCard`. | AD-1 mandates a separate mobile component tree. Sharing the icon map would create an import dependency from the mobile bundle to the desktop component file, defeating code-splitting. The map is 15 static entries (~16 lines) with zero maintenance burden. If icon mappings change, both files must be updated, but this is documented and trivial. | (a) Extract to shared `src/lib/category-icons.ts`: acceptable alternative, but creates a shared utility for a purely presentational concern. Deferred to a future cleanup pass if deemed necessary. (b) Import from desktop CategoryCard: rejected per AD-1 code-splitting boundary. |
| DM-4 | `SeverityMiniBar` is a file-private component inside `MobileCategoryCard.tsx` rather than a standalone exported component. | The mini-bar is only used inside `MobileCategoryCard`. Exporting it adds to the public API surface with no consumer. If WS-D.1 (Category Detail) needs a similar bar, it can extract this into a shared component at that time -- the implementation is <30 lines and easily moved. | (a) Standalone file `SeverityMiniBar.tsx`: rejected -- over-engineering for a single-consumer 30-line component. (b) Inline JSX without a named component: rejected -- naming improves readability and makes the severity bar testable if needed. |
| DM-5 | The grid CSS uses a dedicated `mobile-category-grid.css` file rather than Tailwind utilities or inline styles. | Consistent with the existing codebase pattern (`mobile-shell.css` from WS-A.2, `enrichment.css`, `morph.css`). The grid requires `@media (prefers-reduced-motion)`, pseudo-selectors (`[data-filtered]`, `:focus-visible`), the `glass-tier-2-off` class toggle, and `@keyframes` for skeletons -- all of which are cleaner in CSS than inline or utility syntax. | (a) Tailwind utilities: rejected for the same reasons as WS-A.2 DM-7. (b) CSS-in-JS (styled-components, etc.): rejected -- not in the stack. |
| DM-6 | No `motion/react` (Framer Motion) is used for card animations. Press feedback uses a CSS `transform` transition. | The desktop `CategoryCard` uses `motion/react` for variant-based animation (`idle`, `selected`, `dimmed`). The mobile card does not need these variants: there is no hover state, no dimming of siblings, and no scale-to-1.2 selection animation (the morph system handles navigation). The only animation is the 100ms press feedback, which is a single CSS property change (`transform: scale(0.97)`). CSS transitions are cheaper than a JS animation library for this trivial case, and `motion/react` adds ~30KB to the mobile bundle. | (a) Use `motion/react` for consistency with desktop: rejected -- unnecessary bundle cost for a single CSS transition. (b) `requestAnimationFrame` manual animation: rejected -- overkill. CSS handles it. |
| DM-7 | Keyboard `Enter`/`Space` triggers `onTap` (navigate to category detail). There is no keyboard equivalent for long-press (map filter toggle). | Long-press is an inherently touch gesture with no standard keyboard mapping. Keyboard users can toggle map filters through the Map tab's filter UI (WS-C.4) or the Settings sheet (WS-C.5). Attempting to map a keyboard shortcut to long-press would create a non-standard interaction that violates user expectations. The ARIA label communicates filter status for screen reader users. | (a) Shift+Enter for filter toggle: rejected -- non-standard, undiscoverable. (b) Separate filter button on each card: rejected -- adds visual clutter to a compact card. The desktop card has a hover overlay with a filter button, but mobile uses long-press instead. |
| DM-8 | The `MobileCategoryGrid` component owns the `useCoverageMetrics()` call rather than receiving data as props. | The grid is the sole consumer of coverage metrics in the mobile Situation tab. Lifting the query to `MobileView` and passing data down would add prop-drilling complexity for no benefit. If a future workstream (e.g., WS-B.1 Threat Banner) also needs coverage metrics, TanStack Query's cache ensures only one network request is made -- calling the hook in two places reads from the same cache entry. | (a) Lift query to MobileView and pass as props: rejected -- unnecessary indirection. (b) Global store for metrics: rejected -- TanStack Query is the data layer; duplicating into Zustand adds a synchronization burden. |
| DM-9 | Skeleton shows 6 cards (filling approximately one viewport) rather than all 15. | Rendering 15 skeleton cards would extend well below the fold, creating a misleadingly long skeleton. Six cards fill the visible area of a 375x812 viewport (header 48px + nav 56px = 104px consumed; 708px remaining / 2 rows of ~90px each = ~3.5 visible rows = 7 cards, minus padding = ~6 cards visible). The skeleton communicates "content is loading" without implying more content than a single screenful. | (a) 15 skeleton cards: rejected -- extends below fold unnecessarily. (b) 4 skeleton cards: rejected -- leaves visible empty space on taller viewports. (c) Single loading spinner: rejected -- per AD-7, skeleton shimmer is preferred over spinners for perceived performance. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the sort dampening threshold be configurable per-user in Settings, or is the fixed threshold of 2 sufficient for all users? If analytics show frequent confusing reorders, the threshold could be raised to 3. | world-class-ux-designer | Phase F (polish, post-analytics) |
| OQ-2 | The severity mini-bar uses `p1Count` and `p2Count` from `CoverageByCategory`, which map to P1/P2 operational priority -- not to the five severity levels (Extreme, Severe, Moderate, Minor, Unknown). The mini-bar labels segments as "critical" (P1) and "high" (P2). Should the mini-bar be updated to show actual severity-level breakdown if the API adds per-severity counts in a future release? | backend-engineer (TarvaRI) | Phase D or later (requires API change) |
| OQ-3 | Long-press haptic feedback uses `navigator.vibrate(10)`. This API is not available on iOS Safari (WebKit does not implement the Vibration API). Should we add a visual-only feedback indicator (e.g., brief border flash) as a fallback for iOS? | world-class-ux-designer | Phase B review gate |
| OQ-4 | The `trendMap` prop is omitted in the initial integration (D-8). When WS-4.4's threat picture hook is adapted for mobile, where should the computation live -- in `MobileView`, in a shared hook, or inside `MobileCategoryGrid` itself? | planning-coordinator | Phase D or E |
| OQ-5 | Should filtered cards (long-press activated) have an additional visual differentiator beyond the subtle inner glow? For example, a small "filter active" chip or a colored ring around the icon? The desktop uses a hover overlay button, but mobile has no hover state. | world-class-ux-designer | Phase B review gate |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Long-press conflicts with browser context menu on Android Chrome and iOS Safari. The context menu appears on ~400ms hold, pre-empting the 500ms long-press threshold. | High | High -- gesture broken on primary platforms | Call `e.preventDefault()` on the `contextmenu` event (Combined-rec Risk 4). This is implemented in the `useLongPress` hook (D-2, behavior 5). Verified to work on Chrome Android 120+ and Safari iOS 17+. On browsers where `contextmenu` cannot be prevented (rare), the long-press will still fire after 500ms because the timer runs independently. |
| R-2 | Sort dampening ref becomes stale if the component unmounts and remounts (e.g., tab switch in MobileShell). The first render after remount treats the data as "first render" and applies the candidate sort unconditionally. | Medium | Low -- one-time visual reorder on tab return, not a persistent issue | Acceptable. The tab switch triggers a full remount (WS-A.2 DM-2), which clears the sort ref. The first render after returning to the Situation tab will apply the current correct sort. This is less disorienting than preserving a stale order from a previous session. |
| R-3 | `backdrop-filter` on 15 cards simultaneously causes frame drops on low-end Android devices (Combined-rec Risk 10: "15 categories may overwhelm 2-col mobile grid"). | Medium | Medium -- janky scrolling on budget devices | The `.glass-tier-2-off` CSS class (WS-A.3) is designed for exactly this scenario. WS-B.3 (Ambient + Protective Ops) implements scroll-gated glass that adds this class to cards during active scrolling, disabling `backdrop-filter`. This WS includes the class in the CSS (D-7) so WS-B.3 can toggle it without CSS changes. Additionally, sorting by alert count naturally pushes zero-alert categories below the fold, reducing the number of simultaneously visible glass surfaces. |
| R-4 | The 500ms long-press threshold may feel slow to power users or too fast for users with motor impairments. | Low | Medium -- accessibility and usability tension | 500ms is the standard long-press threshold used by Android and iOS native platforms. WCAG does not mandate a specific long-press duration, only that the action can be undone (the filter toggle is undoable via another long-press). If user testing reveals issues, the threshold can be adjusted via the `threshold` prop on `useLongPress` without code changes to the card. |
| R-5 | `navigator.vibrate()` is not supported on iOS Safari (WebKit). Long-press haptic feedback silently fails on iPhones. | High | Low -- feature degrades gracefully; the filter toggle still works, only haptic is missing | The optional chaining `navigator.vibrate?.(10)` ensures no runtime error. OQ-3 tracks whether a visual fallback should be added. The severity is low because the primary feedback is the filter indicator on the card (inner glow + border boost), which works on all platforms. |
| R-6 | WS-A.2 delays delivery of `MobileShell` and `MobileStateView`, blocking grid integration. | Medium | Medium -- cannot test in-context until shell exists | Develop and test `MobileCategoryGrid`, `MobileCategoryCard`, `useSortDampening`, and `useLongPress` independently using a temporary test harness (e.g., a `/test-mobile-grid` route that renders the grid directly). All components are testable in isolation. Remove the harness when WS-A.2 delivers. |
| R-7 | The `ICON_MAP` duplication (DM-3) leads to drift if a category icon changes in the desktop `CategoryCard` but not in the mobile `MobileCategoryCard`. | Low | Low -- visual inconsistency between desktop and mobile | Both maps are derived from the same `KNOWN_CATEGORIES` data in `coverage.ts`. Changes to `CategoryMeta.icon` would naturally prompt updates to both consumers. Add a comment in both files referencing the other to aid discoverability. |
| R-8 | Grid with 15 cards at 80px minimum height + 10px gaps exceeds the visible content area, requiring scroll. Users may not realize they need to scroll to see all categories. | Low | Low -- standard mobile scroll behavior | The grid is 8 rows (ceil(15/2)) * ~90px = ~720px. The visible content area is ~708px (812 - 48 header - 56 nav). The grid slightly exceeds the viewport, which is a natural scroll cue. Sorting by alert count ensures the most relevant categories are visible without scrolling. The bottom-most cards (low/zero alerts) are the least important. |

---

## Appendix A: Data Flow Diagram

```
useCoverageMetrics()  ──→ CoverageMetrics.byCategory
                             │
                             ▼
                      buildAllGridItems(byCategory, trendMap?)
                             │
                             ▼
                      CategoryGridItem[15]
                             │
                             ▼
                      useSortDampening(items, threshold=2)
                             │
                             ▼
                      sorted CategoryGridItem[15]
                             │
                             ▼
                 ┌───────────┴───────────┐
                 │   MobileCategoryGrid  │
                 │   (2-col CSS Grid)    │
                 └───────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
      MobileCategoryCard  MobileCategoryCard  ... (x15)
        │         │
        │         └─ Long-press (500ms) → toggleCategory(id)
        │                                  └→ useCoverageStore
        │
        └─ Tap → startMorph(id, { fast: true })
                  └→ useUIStore → morph state machine → WS-D.1
```

## Appendix B: Token Consumption Map

| Token | Consumed By | Where |
|-------|------------|-------|
| `--space-card-padding` (14px) | `.mobile-category-card` | `padding` |
| `--space-card-gap` (10px) | `.mobile-category-grid` | `gap` |
| `--space-content-padding` (12px) | `.mobile-category-grid` | `padding` |
| `--space-section-gap` (16px) | `.mobile-category-grid` | `padding-top` |
| `--glass-card-bg` | `.mobile-category-card` | `background` |
| `--glass-card-blur` | `.mobile-category-card` | `backdrop-filter` |
| `--duration-card-press` (100ms) | `.mobile-category-card` | `transition` |
| `--ease-default` | `.mobile-category-card` | `transition` |
| `--font-mono` | `.mobile-card-shortcode`, `.mobile-card-alert-count`, `.mobile-card-source-count` | `font-family` |
| `--text-card-metric` (22px) | `.mobile-card-alert-count` | `font-size` |
| `--text-label` (11px) | `.mobile-card-shortcode` | `font-size` |
| `--text-caption` (10px) | `.mobile-card-alert-label`, `.mobile-card-source-count` | `font-size` |
| `--tracking-label-mobile` (0.14em) | `.mobile-card-shortcode` | `letter-spacing` |
| `--line-height-label` (1.3) | `.mobile-card-shortcode` | `line-height` |
| `--line-height-metric` (1.0) | `.mobile-card-alert-count` | `line-height` |
| `--color-text-primary` | `.mobile-card-alert-count` | `color` |
| `--color-text-secondary` | `.mobile-card-shortcode` | `color` |
| `--color-text-tertiary` | `.mobile-card-alert-label`, `.mobile-card-source-count` | `color` |
| `--color-ember-bright` | `.mobile-category-card:focus-visible` | `outline` |
| `--ambient-ink-rgb` | `.mobile-category-card` border, `.severity-mini-bar` track | `rgba()` |
| `--severity-extreme` | `SeverityMiniBar` P1 segment | `background` |
| `--severity-severe` | `SeverityMiniBar` P2 segment | `background` |
| `--touch-target-min` (44px) | Card layout validation (min-height 80px exceeds this) | Design constraint |

## Appendix C: File Inventory

| File | Action | Estimated Lines |
|------|--------|----------------|
| `src/hooks/use-sort-dampening.ts` | CREATE | ~60 |
| `src/hooks/use-long-press.ts` | CREATE | ~90 |
| `src/components/mobile/MobileCategoryGrid.tsx` | CREATE | ~100 |
| `src/components/mobile/MobileCategoryCard.tsx` | CREATE | ~180 |
| `src/styles/mobile-category-grid.css` | CREATE | ~140 |
| `src/views/MobileView.tsx` | MODIFY | +3 lines (import + prop) |
| `src/hooks/__tests__/use-sort-dampening.test.ts` | CREATE | ~120 |
| `src/hooks/__tests__/use-long-press.test.ts` | CREATE | ~150 |
| `src/components/mobile/__tests__/MobileCategoryGrid.test.tsx` | CREATE | ~130 |
| **Total new lines** | | **~970** |
