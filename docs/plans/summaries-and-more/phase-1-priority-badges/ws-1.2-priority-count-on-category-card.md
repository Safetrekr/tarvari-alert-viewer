# WS-1.2: Add P1/P2 Count to CoverageByCategory + CategoryCard

> **Workstream ID:** WS-1.2
> **Phase:** 1 -- Priority Badges
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.2, WS-0.4, WS-1.1
> **Blocks:** None (Phase 2 assumes priority visible on cards)
> **Resolves:** WS-0.4 Q-3 (whether PriorityBadge accepts a `count` prop or CategoryCard uses a separate component)

## 1. Objective

Extend the `CoverageByCategory` type with `p1Count` and `p2Count` fields, compute those counts in the `useCoverageMetrics` data pipeline, and display a `PriorityBadge` in the top-right corner of `CategoryCard` when a category has one or more P1 or P2 alerts. This makes operational priority visible at the grid level -- the first surface where an analyst scans categories -- before they drill into a district. Per AD-1, the badge uses the achromatic visual channel (shape, weight, animation) established by WS-0.2 and WS-0.4. Per AD-9, the CategoryCard is the primary surface for this information since CoverageOverviewStats has been simplified in Phase 0.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `CoverageByCategory` type extension | Add `p1Count: number` and `p2Count: number` fields to the interface in `src/lib/coverage-utils.ts`. |
| `fetchCoverageMetrics` derivation logic | Compute `p1Count` and `p2Count` per category from the `/console/intel` response in `src/hooks/use-coverage-metrics.ts`, using the `operational_priority` field added by WS-1.1. |
| `ApiIntelItem` usage | Read the `operational_priority` field from intel items (added to this type by WS-1.1) to count P1/P2 alerts per category. |
| `buildAllGridItems` zero-fill | Update the fallback metrics in `buildAllGridItems` (in `src/lib/interfaces/coverage.ts`) to include `p1Count: 0` and `p2Count: 0` for categories with no live data. |
| `CategoryCard` badge rendering | Import and render `PriorityBadge` in the top-right corner of the card when `p1Count + p2Count > 0`. Display the highest-priority level present (P1 if `p1Count > 0`, else P2) with the combined count alongside it. |
| `CategoryCard` accessibility update | Update `aria-label` to include priority alert count when present. |
| `emptyMetrics` update | Update the `emptyMetrics()` factory in `src/lib/coverage-utils.ts` to include the new fields at zero. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Creating the `PriorityBadge` component | Already built in WS-0.4. This workstream only imports and positions it. |
| Defining `OperationalPriority` type | Already defined in WS-0.2. This workstream imports and uses it. |
| Adding `operational_priority` to `ApiIntelItem` | Already done in WS-1.1. This workstream reads the field that WS-1.1 added. |
| Priority filtering (store state, filter controls) | Belongs to WS-1.4. This workstream only displays counts; it does not filter by priority. |
| Map marker priority scaling | Belongs to WS-1.5. |
| P3/P4 counts on the card | Per AD-1, P3 is visible only in detail views and P4 is invisible by default. The card-level badge shows only P1+P2 (the `'always'` visibility tier from `PriorityMeta.defaultVisibility`). |
| Backend changes to `/console/coverage` | If the backend adds priority breakdown to the coverage endpoint in the future, the derivation logic here can be replaced with a direct read. But this workstream does not require backend changes. |
| District view or INSPECT priority display | Belongs to WS-1.3. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.2 deliverables | `OperationalPriority` type (`'P1' \| 'P2' \| 'P3' \| 'P4'`), `PRIORITY_META` constant, `getPriorityMeta()` helper, `isPriorityVisible()` helper in `src/lib/interfaces/coverage.ts` | Pending (WS-0.2 not yet implemented) |
| WS-0.4 deliverables | `PriorityBadge` component at `src/components/coverage/PriorityBadge.tsx` with `PriorityBadgeProps` (`priority`, `size`, `showLabel`, `className`) | Pending (WS-0.4 not yet implemented) |
| WS-1.1 deliverables | `operational_priority` field on `ApiIntelItem` in `src/hooks/use-coverage-metrics.ts` (snake_case from API, normalized to camelCase where needed). WS-1.1 also extends `ApiIntelItem` in `use-intel-feed.ts`, `use-category-intel.ts`, etc. -- but WS-1.2 only needs the `use-coverage-metrics.ts` type. | Pending (WS-1.1 not yet implemented) |
| `src/lib/coverage-utils.ts` | Current `CoverageByCategory` interface (line 20-27), `emptyMetrics()` function (line 175-184) | Available [CODEBASE] -- 185 lines |
| `src/hooks/use-coverage-metrics.ts` | Current `fetchCoverageMetrics` function (lines 64-103), `ApiIntelItem` interface (lines 50-53) | Available [CODEBASE] -- 123 lines |
| `src/components/coverage/CategoryCard.tsx` | Current component (234 lines), layout structure, motion variants, hover overlay | Available [CODEBASE] |
| `src/lib/interfaces/coverage.ts` | `buildAllGridItems` function (lines 177-191), `CategoryGridItem` interface (lines 148-155) | Available [CODEBASE] -- 192 lines |
| AD-1 | Priority uses achromatic visual channel -- shape, weight, animation -- never color | Confirmed |
| AD-9 | CoverageOverviewStats simplified in Phase 0; CategoryCard is the primary metric surface | Confirmed |

## 4. Deliverables

### 4.1 Type Extension: `CoverageByCategory`

**File:** `src/lib/coverage-utils.ts`, lines 20-27

Add two numeric fields to the `CoverageByCategory` interface:

```typescript
/** Category rollup for the coverage card grid. */
export interface CoverageByCategory {
  category: string
  sourceCount: number
  activeSources: number
  geographicRegions: string[]
  /** Number of raw intel alerts in this category. */
  alertCount: number
  /** Number of P1 (Critical) operational priority alerts in this category. */
  p1Count: number
  /** Number of P2 (High) operational priority alerts in this category. */
  p2Count: number
}
```

**Placement rationale:** `p1Count` and `p2Count` sit after `alertCount` because they are a breakdown of the total count by priority. JSDoc references "P1 (Critical)" and "P2 (High)" to match the `PRIORITY_META` labels from WS-0.2.

**Type implications:** Because `CoverageByCategory` is used as `CategoryGridItem.metrics`, every consumer of `CategoryGridItem` automatically gets access to the priority counts without interface changes. The `CategoryGridItem` interface itself (`src/lib/interfaces/coverage.ts` line 148-155) does not need modification -- it references `CoverageByCategory` by type, so the new fields flow through.

### 4.2 Priority Count Derivation in `fetchCoverageMetrics`

**File:** `src/hooks/use-coverage-metrics.ts`, lines 64-103

The `/console/coverage` endpoint returns `ApiCategoryMetric` which currently has no priority breakdown (fields: `category`, `source_count`, `active_sources`, `geographic_regions`). Rather than requiring a backend change, priority counts are derived client-side from the `/console/intel` response that is already fetched in parallel.

**Current state (lines 70-76):** The function already iterates `intelData.items` to build `alertCounts` per category. This loop expands to also count P1 and P2 items.

**After WS-1.1:** The `ApiIntelItem` interface in this file will include `operational_priority: string | null` (snake_case from the API). WS-1.2 reads this field.

**Modified derivation logic (replaces lines 70-76):**

The existing `alertCounts` map changes from `Map<string, number>` to a map of per-category priority counters:

```typescript
interface CategoryPriorityCounts {
  total: number
  p1: number
  p2: number
}

const categoryCounts = new Map<string, CategoryPriorityCounts>()
for (const item of intelData.items) {
  const cat = item.category
  if (!categoryCounts.has(cat)) {
    categoryCounts.set(cat, { total: 0, p1: 0, p2: 0 })
  }
  const counts = categoryCounts.get(cat)!
  counts.total++
  if (item.operational_priority === 'P1') counts.p1++
  else if (item.operational_priority === 'P2') counts.p2++
}
```

**Updated `byCategory` mapping (replaces lines 87-93):**

```typescript
const byCategory: CoverageByCategory[] = coverageData.by_category.map((c) => {
  const counts = categoryCounts.get(c.category)
  return {
    category: c.category,
    sourceCount: c.source_count,
    activeSources: c.active_sources,
    geographicRegions: c.geographic_regions,
    alertCount: counts?.total ?? 0,
    p1Count: counts?.p1 ?? 0,
    p2Count: counts?.p2 ?? 0,
  }
})
```

**Design decision -- `CategoryPriorityCounts` is function-local:**
The `CategoryPriorityCounts` interface is declared inside the `fetchCoverageMetrics` function (or at module scope in the hook file), not exported. It is a transient aggregation structure, not part of the public type contract. The public contract is `CoverageByCategory.p1Count` and `CoverageByCategory.p2Count`.

**Why derive instead of request from backend:**
1. The `/console/intel?limit=1000` request is already happening (line 68). No additional network call.
2. The backend `/console/coverage` endpoint would need a schema change to include priority breakdown. That change may come later, but this workstream does not require it.
3. If the backend later adds `p1_count` and `p2_count` to `ApiCategoryMetric`, the derivation logic can be replaced with a direct read. The `CoverageByCategory` type and all downstream consumers remain unchanged.

**Limitation:** The derivation uses `limit=1000` for the intel request (line 68). If a category has more than 1000 total intel items, the priority counts will be approximate (based on the 1000 most recent items). This is acceptable for the card-level summary. If precision matters, the backend should add priority breakdown to the coverage endpoint.

### 4.3 Zero-Fill Updates

Two locations need zero-fill updates to ensure `p1Count` and `p2Count` are always present:

#### 4.3.1 `emptyMetrics()` in `src/lib/coverage-utils.ts`

**File:** `src/lib/coverage-utils.ts`, line 175-184

No change needed to `emptyMetrics()` itself -- it returns `byCategory: []` (an empty array). There are no `CoverageByCategory` objects to fill. The zero-fill matters in `buildAllGridItems`.

#### 4.3.2 `buildAllGridItems()` in `src/lib/interfaces/coverage.ts`

**File:** `src/lib/interfaces/coverage.ts`, lines 177-191

The fallback metrics object (lines 183-189) must include the new fields:

```typescript
metrics: liveMap.get(meta.id) ?? {
  category: meta.id,
  sourceCount: 0,
  activeSources: 0,
  geographicRegions: [],
  alertCount: 0,
  p1Count: 0,
  p2Count: 0,
},
```

#### 4.3.3 `buildCategoryMetrics()` in `src/lib/coverage-utils.ts`

**File:** `src/lib/coverage-utils.ts`, lines 82-112

This function is currently unused by the active data pipeline (the `useCoverageMetrics` hook uses its own mapping logic, not `buildCategoryMetrics`). However, it constructs `CoverageByCategory` objects (lines 89-95), so it must include the new fields to remain type-correct:

```typescript
categoryMap.set(cat, {
  category: cat,
  sourceCount: 0,
  activeSources: 0,
  geographicRegions: [],
  alertCount: 0,
  p1Count: 0,
  p2Count: 0,
})
```

Note: `buildCategoryMetrics` operates on `IntelSourceRow[]` (sources, not intel items), so it cannot derive priority counts from its input. The priority fields are set to zero as placeholders. This function would need a separate `IntelNormalizedRow[]` input parameter to compute real priority counts, but that refactor is outside the scope of WS-1.2. The function is retained for potential future use and type correctness.

### 4.4 PriorityBadge Placement on CategoryCard

**File:** `src/components/coverage/CategoryCard.tsx`

#### 4.4.1 Import

Add an import for `PriorityBadge` from WS-0.4:

```typescript
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
```

Add an import for `OperationalPriority` from WS-0.2:

```typescript
import type { OperationalPriority } from '@/lib/interfaces/coverage'
```

#### 4.4.2 Derived Priority Values

Inside the `CategoryCard` component body (after line 121), derive the display values:

```typescript
const { id, meta, metrics } = item
const priorityCount = metrics.p1Count + metrics.p2Count
const highestPriority: OperationalPriority | null =
  metrics.p1Count > 0 ? 'P1' : metrics.p2Count > 0 ? 'P2' : null
```

**Design decision:** The badge shows the *highest* priority present in the category, not both P1 and P2 badges. Rationale: the card is a summary surface. Showing two badges would create visual clutter on a 160x180px card. The single badge communicates "this category has priority alerts -- click to investigate." The district view (WS-1.3) provides the full breakdown.

#### 4.4.3 Badge Rendering Position

The PriorityBadge renders inside the `<motion.div>` container (which has `className="relative"` semantics via positioning), placed as the first child, above the category icon. It uses absolute positioning to sit in the top-right corner.

**Insert after line 157 (the closing `>` of the `<motion.div>` opening tag), before the `{/* Category icon */}` comment on line 159:**

```tsx
{/* Priority badge -- top-right corner (WS-1.2) */}
{highestPriority !== null && (
  <span
    className="absolute top-2 right-2 inline-flex items-center gap-1"
    aria-hidden="true"
  >
    <PriorityBadge priority={highestPriority} size="md" />
    {priorityCount > 1 && (
      <span
        className="font-mono text-[9px] tabular-nums leading-none"
        style={{
          color: highestPriority === 'P1'
            ? 'rgba(255, 255, 255, 0.55)'
            : 'rgba(255, 255, 255, 0.35)',
        }}
      >
        {priorityCount}
      </span>
    )}
  </span>
)}
```

**Layout analysis:**

- **Position:** `absolute top-2 right-2` places the badge 8px from the top and right edges of the card. The card has `px-4 py-4` (16px padding), and the category icon sits at the top-left. The badge occupies the top-right corner where there is currently empty space.
- **Badge size:** `md` (16x16px SVG viewport per WS-0.4 Section 4.3) -- appropriate for the card context. The card's primary icon is 24px; the priority badge at 16px is visually subordinate.
- **Count display:** The combined count (`priorityCount`) appears as a small monospaced number next to the shape, but only when the count exceeds 1. When there is exactly one priority alert, the shape alone is sufficient. The font size (`text-[9px]`) matches the source count text below (line 177), maintaining typographic consistency.
- **Count opacity:** Matches the PriorityBadge's own opacity for the displayed level (P1: `rgba(255,255,255,0.55)`, P2: `rgba(255,255,255,0.35)` per WS-0.4 Section 4.4). This ensures the count and shape read as a unified element.
- **`aria-hidden="true"`:** The badge container is marked `aria-hidden` because priority information is conveyed via the card's `aria-label` (see Section 4.5). Hiding the visual badge from the accessibility tree prevents duplicate announcements.

#### 4.4.4 Hover Overlay Interaction

The existing hover overlay (lines 182-231) uses `className="absolute inset-0 z-10"` to cover the entire card. This will cover the PriorityBadge, which is correct behavior -- when hovering, the action buttons should be the focus, not the badge. No changes to the overlay are needed.

#### 4.4.5 Resolves WS-0.4 Q-3

WS-0.4 Q-3 asked: *"Should PriorityBadge accept a `count` prop for the CategoryCard use case, or should that be a separate `PriorityCountBadge` component?"*

**Resolution:** Neither. The `PriorityBadge` component remains unchanged -- it displays a single priority level's shape/weight/animation. The count is rendered as a sibling `<span>` next to the badge within a containing `<span>` wrapper. This avoids coupling PriorityBadge to count-display logic and keeps the badge composable for other contexts (alert list rows, detail panels) where a count is not needed.

### 4.5 Accessibility Update on CategoryCard

**File:** `src/components/coverage/CategoryCard.tsx`, line 147

Update the `aria-label` to include priority information when present:

**Current (line 147):**
```typescript
aria-label={`${meta.displayName} category -- ${metrics.alertCount} alerts, ${metrics.sourceCount} sources${isFiltered ? ' (filtering map)' : ''}`}
```

**Updated:**
```typescript
aria-label={`${meta.displayName} category -- ${metrics.alertCount} alerts, ${metrics.sourceCount} sources${priorityCount > 0 ? `, ${priorityCount} priority` : ''}${isFiltered ? ' (filtering map)' : ''}`}
```

**Examples of the updated label:**
- Zero priority alerts: `"Seismic category -- 12 alerts, 3 sources"` (unchanged)
- With priority alerts: `"Conflict category -- 8 alerts, 2 sources, 3 priority"` (appended)
- With priority + filter: `"Weather category -- 5 alerts, 4 sources, 1 priority (filtering map)"`

The term "priority" (not "P1/P2 priority") is used because screen reader users do not need to distinguish P1 from P2 at the card level -- the district view (WS-1.3) provides that detail. The count communicates "this category has items requiring attention."

### 4.6 Files Modified Summary

| File | Change | Lines Affected |
|------|--------|---------------|
| `src/lib/coverage-utils.ts` | Add `p1Count`, `p2Count` to `CoverageByCategory` interface; update `buildCategoryMetrics` zero-fill | Lines 20-27 (type), lines 89-95 (init) |
| `src/hooks/use-coverage-metrics.ts` | Replace alert counting loop with priority-aware counting; update `byCategory` mapping to include `p1Count`, `p2Count` | Lines 50-53 (type -- depends on WS-1.1), lines 70-76 (count loop), lines 87-93 (mapping) |
| `src/lib/interfaces/coverage.ts` | Add `p1Count: 0`, `p2Count: 0` to zero-fill in `buildAllGridItems` | Lines 183-189 (fallback metrics) |
| `src/components/coverage/CategoryCard.tsx` | Import PriorityBadge; derive `priorityCount` and `highestPriority`; render badge in top-right corner; update `aria-label` | New imports, lines ~121 (derivation), line ~158 (badge JSX), line 147 (aria-label) |

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `CoverageByCategory` interface includes `p1Count: number` and `p2Count: number` fields with JSDoc. | `pnpm typecheck` passes. Manual review of `src/lib/coverage-utils.ts`. |
| AC-2 | `fetchCoverageMetrics` computes `p1Count` and `p2Count` per category by counting intel items where `operational_priority === 'P1'` or `'P2'`. | Insert test data with known priority distribution; verify the returned `CoverageMetrics.byCategory` entries have correct counts. |
| AC-3 | Categories with zero P1 and zero P2 intel items have `p1Count: 0` and `p2Count: 0`. | Verify with a category that has alerts but none at P1 or P2. |
| AC-4 | `buildAllGridItems` produces `CategoryGridItem` entries with `p1Count: 0` and `p2Count: 0` for categories that have no live metrics data. | Call `buildAllGridItems([])` and verify all 15 items have zeroed priority counts. |
| AC-5 | `CategoryCard` renders a `PriorityBadge` in the top-right corner when `metrics.p1Count + metrics.p2Count > 0`. | Visual inspection: card for a category with P1 or P2 alerts shows a diamond (P1) or triangle (P2) shape at position `top-2 right-2`. |
| AC-6 | `CategoryCard` does NOT render a `PriorityBadge` when `metrics.p1Count + metrics.p2Count === 0`. | Visual inspection: card for a zero-priority category shows no badge. DOM inspection: no `PriorityBadge` element rendered. |
| AC-7 | The badge displays the highest priority level present: P1 diamond if `p1Count > 0`, else P2 triangle. | Provide a category with both P1 and P2 alerts -- verify diamond (P1) is shown. Provide a category with only P2 alerts -- verify triangle is shown. |
| AC-8 | When `priorityCount > 1`, a numeric count appears next to the badge shape. When `priorityCount === 1`, only the shape appears (no count number). | Visual inspection with both cases. |
| AC-9 | The count text uses `font-mono text-[9px] tabular-nums` and matches the PriorityBadge's opacity for the displayed level. | DOM inspection of computed styles. |
| AC-10 | The priority badge is covered by the hover overlay when the card is hovered. | Hover the card; verify the action buttons overlay fully covers the badge. The badge should not be visible through the overlay. |
| AC-11 | The `aria-label` on CategoryCard includes priority count when `priorityCount > 0` and omits it when `priorityCount === 0`. | DOM inspection of the `aria-label` attribute on cards with and without priority alerts. |
| AC-12 | The priority badge container has `aria-hidden="true"` to prevent duplicate screen reader announcements. | DOM inspection: the badge wrapper `<span>` has `aria-hidden="true"`. |
| AC-13 | No color is used for priority differentiation on the CategoryCard. The badge and count are achromatic (white-channel only). | Visual inspection: no red, amber, yellow, or blue hues on the badge or count text. Code review: no references to severity colors or category colors in the priority badge rendering. |
| AC-14 | `pnpm typecheck` passes with zero errors after all changes. | Run `pnpm typecheck` on the full project. |
| AC-15 | `pnpm build` completes without errors after all changes. | Run `pnpm build`. |
| AC-16 | Intel items with `operational_priority` of `null`, `undefined`, `'P3'`, or `'P4'` are NOT counted in `p1Count` or `p2Count`. | Provide intel data with mixed priority values; verify only `'P1'` and `'P2'` exact string matches increment the respective counters. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Derive `p1Count`/`p2Count` client-side from `/console/intel` response rather than requiring a backend change to `/console/coverage`. | The intel request is already happening in `fetchCoverageMetrics` (line 68). Derivation adds ~10 lines of loop logic with zero additional network cost. If the backend later adds priority breakdown to the coverage endpoint, the derivation can be swapped for a direct read without changing the downstream type contract. | (a) Require backend to add `p1_count`, `p2_count` to `ApiCategoryMetric` -- rejected: would create a hard backend dependency and block this workstream. (b) Create a separate API call for priority counts -- rejected: unnecessary network overhead when the data is already available. |
| D-2 | Show the highest priority level's badge (P1 diamond over P2 triangle), not both badges simultaneously. | The card is 160x180px -- a small summary surface. Two badges would create visual clutter and dilute the signal. The diamond (P1) is the most urgent; if P1 alerts exist, that fact dominates. The district view (WS-1.3) provides the full P1/P2 breakdown. | (a) Show both P1 and P2 badges stacked -- rejected: too much visual weight for a summary card. (b) Always show P2 triangle regardless of P1 presence -- rejected: hides the more urgent P1 signal. (c) Show a generic "priority" indicator with no P1/P2 distinction -- rejected: loses the pre-attentive differentiation that AD-1 establishes. |
| D-3 | Show the combined count (`p1Count + p2Count`) next to the badge, but only when count > 1. | A single priority alert is conveyed by the shape alone. A count of "1" next to a shape adds no information. But "3" or "7" tells the analyst the volume of priority items at a glance, which affects urgency assessment. | (a) Always show count, even when 1 -- rejected: "1" next to a badge is redundant information. (b) Never show count, only shape -- rejected: the analyst needs to distinguish "1 P1" from "15 P1" at the card level. (c) Show P1 and P2 counts separately (e.g., "2 P1, 5 P2") -- rejected: too much text for the card's top-right corner. The district view handles this. |
| D-4 | Resolve WS-0.4 Q-3 by composing the count as a sibling `<span>` next to `PriorityBadge`, not by adding a `count` prop to PriorityBadge. | PriorityBadge is used in multiple contexts (alert list rows, detail panels, feed strips) where a count is not needed. Adding a `count` prop would complicate the component API for a single consumer's need. Composition (badge + count in a wrapper span) is more flexible and keeps PriorityBadge focused on displaying a single priority level. | (a) Add `count?: number` prop to PriorityBadge -- rejected: couples the component to a use case specific to CategoryCard. (b) Create a separate `PriorityCountBadge` component -- rejected: over-engineering for a wrapper that is 8 lines of JSX. The composition pattern is simpler and more maintainable. |
| D-5 | Use `aria-hidden="true"` on the badge container and convey priority through the card's `aria-label`. | The priority badge is a visual indicator. Screen readers should announce priority as part of the card's description, not as a separate element. Announcing both the `aria-label` on the card and the `aria-label` on the PriorityBadge (from WS-0.4) would be redundant. | (a) Let PriorityBadge's own `aria-label` announce -- rejected: would create duplicate announcements ("Seismic category, 3 priority" from card + "Priority 1 Critical" from badge). (b) Remove `aria-label` from PriorityBadge entirely -- rejected: PriorityBadge needs its own label for contexts where it is not inside a labeled container (e.g., standalone in an alert list row per WS-1.3). |
| D-6 | Position the badge at `absolute top-2 right-2` (8px inset from card edges). | The card's category icon sits at the top-left. The top-right corner is currently empty space. An 8px inset keeps the badge within the card's 16px padding zone, visually contained. The `md` badge size (16x16px) is proportionate to the card without competing with the 24px category icon. | (a) Position below the category icon -- rejected: conflicts with the category name text. (b) Position bottom-right -- rejected: conflicts with the source count text. (c) Overlay on top of the category icon -- rejected: obscures category identity. |
| D-7 | Use `'P1'` and `'P2'` string literal comparison (not `getPriorityMeta().defaultVisibility`) for the counting logic. | The counting loop runs once per intel item (potentially 1000 iterations). Calling `getPriorityMeta()` per item adds function call overhead for no benefit -- the P1/P2 identity is a simple string match. The `defaultVisibility` concept from WS-0.2 governs rendering decisions in UI components, not data aggregation. | (a) Use `isPriorityVisible(priority, 'list')` from WS-0.2 -- rejected: this predicate governs whether a badge renders, not whether an item should be counted. All P1/P2 items should be counted even if a hypothetical future rule changed their visibility. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | The `/console/intel?limit=1000` request may not return all intel items if a category has more than 1000 alerts. Should the limit be increased, or should the backend add `p1_count`/`p2_count` to the `/console/coverage` response? | Backend team / react-developer | Phase 1 (evaluate after WS-1.2 implementation -- monitor whether 1000 is sufficient for production data volumes) |
| OQ-2 | Should the priority badge animate (P1 pulse) on the CategoryCard, or should the pulse be suppressed at the card level to avoid visual noise across a 9-card grid? The badge receives `size="md"` which inherits the P1 pulse from WS-0.4. | UX / react-developer | Phase 1 (evaluate visually when both WS-0.4 and WS-1.2 are implemented -- if multiple cards pulse simultaneously, consider adding a `disableAnimation` prop to PriorityBadge) |
| OQ-3 | When the `/console/intel` response includes items with `operational_priority: null` (pre-migration data), should those items be counted toward `alertCount` but excluded from `p1Count`/`p2Count`? Or should null-priority items be assigned a default (e.g., P4)? | react-developer / Backend team | Phase 1 (WS-1.1 may normalize null to `'P4'` at the hook level -- verify) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-1.1 is not yet implemented, so `ApiIntelItem` does not yet include `operational_priority`. WS-1.2 cannot be implemented until WS-1.1 is complete. | N/A (known dependency) | Blocking | Strict dependency ordering: WS-1.1 must merge before WS-1.2 begins. If WS-1.1 is delayed, WS-1.2 can be prototyped with a hardcoded mock `operational_priority` field on the `ApiIntelItem` type for visual layout work, then wired to real data when WS-1.1 lands. |
| R-2 | The `/console/intel?limit=1000` response may not include all items for high-volume categories, causing `p1Count` and `p2Count` to be underestimates. | Medium | Low | The card-level count is a summary indicator, not an exact figure. Underestimates still serve the primary purpose: signaling that priority alerts exist. For precision, the backend can add priority breakdown to `/console/coverage` (see OQ-1). The district view (WS-1.3) fetches category-specific intel with its own limit (200 items per category), providing a more accurate count at the detail level. |
| R-3 | Multiple CategoryCards with P1 alerts pulsing simultaneously creates visual noise on the grid. | Medium | Medium | The 2.5-second, opacity-only pulse from WS-0.4 is deliberately subtle. In practice, P1 alerts are rare (critical threats), so multiple pulsing cards are unlikely. If visual noise occurs during testing, options include: (a) suppress animation at `md` size, (b) add a `disableAnimation` prop to PriorityBadge, or (c) pulse only the card with the highest P1 count. See OQ-2. |
| R-4 | The PriorityBadge at `md` size (16x16px) collides with the category icon (24px) at the card's top-left when the card is narrow or the icon is right-aligned in certain layouts. | Low | Low | The current card layout is `flex-col items-start` (left-aligned content) with `px-4` padding. The icon is at top-left, the badge is at top-right. At the current `CARD_WIDTH` of 160px, there is ~112px of horizontal space between the icon and badge (`160 - 16*2 padding - 24 icon - 16 badge = 88px`). Collision is not possible at this width. If the card width ever shrinks below ~80px, the badge and icon would overlap, but this is far below the current minimum. |
| R-5 | The `buildCategoryMetrics` function in `coverage-utils.ts` cannot compute real priority counts from its `IntelSourceRow[]` input, leaving `p1Count` and `p2Count` at zero for any consumer of that function. | Low | Low | `buildCategoryMetrics` is currently unused in the active data pipeline (the `useCoverageMetrics` hook has its own mapping logic). The zero-fill preserves type correctness. If `buildCategoryMetrics` is used in the future, it would need to accept an additional `IntelNormalizedRow[]` parameter, but that refactor is out of scope. |
| R-6 | During the backend migration period, some intel items may have `operational_priority: null`. The counting logic skips null values, so `p1Count + p2Count` may be lower than expected. | Medium | Low | This is the correct behavior. Items without a priority assignment should not be counted as P1 or P2. The `alertCount` field provides the total count regardless of priority, so the analyst can still see the full picture. WS-1.1 may normalize null values to `'P4'` at the hook layer, which would make the distinction explicit. See OQ-3. |
