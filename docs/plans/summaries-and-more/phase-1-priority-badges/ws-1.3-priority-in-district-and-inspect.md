# WS-1.3: Wire Priority into District Alert List + INSPECT

> **Workstream ID:** WS-1.3
> **Phase:** 1 -- Priority Badges
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.4, WS-1.1
> **Blocks:** None
> **Resolves:** None

## 1. Objective

Make operational priority visible in the two surfaces where a user drills into individual alerts: the district alert list (left column of `CategoryDetailScene`) and the INSPECT detail panel (the `AlertDetailView` within `DistrictViewDock`). After this workstream, clicking into any category shows PriorityBadge shapes (P1 diamond, P2 triangle) inline with each alert row, and selecting an alert reveals its full priority level with label in the dock panel. This completes the "every existing alert surface" goal for the district/INSPECT flow.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| AlertList PriorityBadge insertion | Add `<PriorityBadge>` to each alert row in the `AlertList` component inside `CategoryDetailScene.tsx`, positioned between the severity badge and the title text. |
| AlertDetailView priority display | Add `<PriorityBadge>` to the `AlertDetailView` component inside `district-view-dock.tsx`, positioned after the severity badge and before the title, as a labeled detail element. |
| Import wiring | Add imports for `PriorityBadge` from `@/components/coverage/PriorityBadge` in both files. |
| Priority field access | Read `item.priority` (type `OperationalPriority`) from `CategoryIntelItem`, which WS-1.1 adds to the interface. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Creating the PriorityBadge component | Already delivered by WS-0.4. This workstream only consumes it. |
| Adding priority field to CategoryIntelItem | Already delivered by WS-1.1. This workstream only reads it. |
| Sort-by-priority in AlertList | Explicitly deferred per combined-recommendations.md ("Priority sort in district alert list -- after priority badges are live and users request sorting"). |
| Priority filter controls | Belongs to WS-1.4 (priority filter in coverage store + district view toolbar). |
| PriorityBadge in CategoryCard | Belongs to WS-1.2. |
| PriorityBadge in feed strip/panel | Belongs to WS-2.2 and WS-2.3 (Phase 2). |
| Map marker priority scaling | Belongs to WS-1.5. |
| TriageRationalePanel priority display | The combined recommendations mention TriageRationalePanel as a potential INSPECT surface. That panel (z-45) is a separate component from the dock panel (z-31). If priority display is needed there, it is a follow-on task, not part of this workstream. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.4 deliverables | `PriorityBadge` component at `src/components/coverage/PriorityBadge.tsx` with `PriorityBadgeProps` interface. Accepts `priority: OperationalPriority`, `size?: 'sm' \| 'md' \| 'lg'`, `showLabel?: boolean`, `className?: string`. | Pending (WS-0.4 not yet implemented) |
| WS-1.1 deliverables | `CategoryIntelItem` interface in `src/hooks/use-category-intel.ts` extended with a `priority: OperationalPriority` field (or `priority: OperationalPriority \| null` if the backend field is optional during migration). The `fetchCategoryIntel` normalizer maps `operational_priority` (snake_case API response) to `priority` (camelCase). | Pending (WS-1.1 not yet implemented) |
| WS-0.2 deliverables | `OperationalPriority` type in `src/lib/interfaces/coverage.ts`. Needed transitively (WS-0.4 and WS-1.1 both depend on it). Not directly imported by this workstream's files unless type annotations are needed. | Pending (WS-0.2 not yet implemented) |
| `CategoryDetailScene.tsx` | Existing `AlertList` component with severity badge pattern at lines 293-303. Alert row is a `<button>` with `flex items-center gap-3` layout containing severity badge, title, and relative time. | Available (695 lines) [CODEBASE] |
| `district-view-dock.tsx` | Existing `AlertDetailView` component with severity badge at lines 113-122, title at lines 125-130, and metadata grid at lines 152-203. Uses `DetailRow` helper for labeled fields. | Available (450 lines) [CODEBASE] |
| `use-category-intel.ts` | Existing `useCategoryIntel` hook and `CategoryIntelItem` interface. Both files already import from this hook. | Available (103 lines) [CODEBASE] |

## 4. Deliverables

### 4.1 AlertList PriorityBadge (CategoryDetailScene.tsx)

**File:** `src/components/district-view/scenes/CategoryDetailScene.tsx`

**Import to add** (at the top of the file, alongside existing coverage imports near line 21-26):

```
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
```

**Insertion point:** Inside the `AlertList` component's `sorted.map()` render block, between the severity badge `<span>` (lines 293-303) and the title `<span>` (lines 305-311).

**Current structure (lines 292-319):**
```
<button ... className="flex w-full items-center gap-3 ...">
  {/* Severity badge */}
  <span className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] ...">
    {item.severity}
  </span>

  {/* Title */}
  <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
    {item.title}
  </span>

  {/* Relative time */}
  <span className="shrink-0 font-mono text-[9px]">
    {relativeTime(item.ingestedAt)}
  </span>
</button>
```

**New structure after insertion (between lines 303 and 305):**
```
<button ... className="flex w-full items-center gap-3 ...">
  {/* Severity badge */}
  <span ...>{item.severity}</span>

  {/* Priority badge -- P1/P2 show shape; P3/P4 return null */}
  <PriorityBadge priority={item.priority} size="sm" />

  {/* Title */}
  <span ...>{item.title}</span>

  {/* Relative time */}
  <span ...>{relativeTime(item.ingestedAt)}</span>
</button>
```

**Props rationale:**
- `size="sm"` -- 12px context matches the severity badge font size (9px) per WS-0.4 Section 4.3. Both indicators sit at the same visual weight in the row.
- `showLabel` omitted (defaults to `false`) -- in list view context, only P1 and P2 render their shapes (diamond and triangle). P3 and P4 return `null`, producing no DOM node and no layout shift. This follows the progressive disclosure model specified in AD-1.
- `className` omitted -- no positional overrides needed. The parent `flex gap-3` layout handles spacing. The `PriorityBadge` uses `<span>` root with `inline-flex`, which integrates correctly into the flex row.

**Null-safety consideration:** If the `priority` field from WS-1.1 is typed as `OperationalPriority | null` (to handle pre-migration API responses where the field is absent), the badge insertion needs a guard:

```
{item.priority && <PriorityBadge priority={item.priority} size="sm" />}
```

If WS-1.1 normalizes null/missing values to a default (e.g., `'P4'` via `getPriorityMeta` fallback), the guard is unnecessary because `PriorityBadge` with `priority="P4"` and `showLabel={false}` returns `null` anyway. The implementer should check the WS-1.1 deliverable to determine which pattern applies.

**Layout impact:** The `gap-3` (12px) spacing in the parent `<button>` (line 277) already separates children. Adding PriorityBadge between severity and title introduces one additional 12px gap. For P3/P4 items (where PriorityBadge returns `null`), the layout is unchanged -- no gap is added for a non-existent element. For P1/P2 items, the row gains approximately 24px of width (12px badge + 12px gap). The title `<span>` has `min-w-0 flex-1 truncate` (line 307), so it absorbs the width reduction gracefully via text truncation.

### 4.2 AlertDetailView PriorityBadge (district-view-dock.tsx)

**File:** `src/components/district-view/district-view-dock.tsx`

**Import to add** (at the top of the file, alongside existing coverage imports near line 18):

```
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
```

**Insertion point:** Inside the `AlertDetailView` component, between the severity badge (lines 113-122) and the title (lines 125-130). The priority badge appears as a second badge element directly below severity, before the title.

**Current structure (lines 112-130):**
```
{/* Severity badge */}
<span
  className="mb-3 inline-block self-start rounded px-2 py-1 font-mono text-[10px] ..."
  style={{ backgroundColor: ..., color: severityColor, border: ... }}
>
  {alert.severity}
</span>

{/* Title */}
<span className="block font-mono text-[14px] font-medium leading-[1.4]" ...>
  {alert.title}
</span>
```

**New structure after insertion (between lines 122 and 124):**
```
{/* Severity badge */}
<span ...>{alert.severity}</span>

{/* Priority badge -- labeled, all levels visible except P4 without showLabel */}
<PriorityBadge priority={alert.priority} size="lg" showLabel className="mb-3" />

{/* Title */}
<span ...>{alert.title}</span>
```

**Props rationale:**
- `size="lg"` -- 20px context for detail panels per WS-0.4 Section 4.3. Proportional to the 14px title text used in the dock detail view (line 126).
- `showLabel={true}` -- the INSPECT panel is a "detail" context per AD-1's progressive disclosure model. P1 shows diamond + "P1" label, P2 shows triangle + "P2" label, P3 shows "P3" text-only label. P4 shows "P4" muted label. All priority levels are visible in the detail view, giving the user complete classification information.
- `className="mb-3"` -- matches the `mb-3` bottom margin on the severity badge (line 114), maintaining consistent vertical spacing between the badge elements and the title. The PriorityBadge renders as a `<span>` with `inline-flex`, so the `mb-3` combined with the parent's flex column layout (`flex flex-col gap-0`, line 88) produces the correct vertical rhythm.

**Null-safety consideration:** Same as AlertList (Section 4.1). If `priority` is nullable:

```
{alert.priority && (
  <PriorityBadge priority={alert.priority} size="lg" showLabel className="mb-3" />
)}
```

**Alternative placement considered -- DetailRow:** The dock panel uses `DetailRow` components for metadata fields like "Event Type", "Source", "Confidence" (lines 152-203). A `<DetailRow label="Priority">` containing the PriorityBadge was considered. This was rejected because:
1. The severity badge is NOT in a DetailRow -- it appears as a standalone element above the title (lines 113-122). Priority is the same classification tier as severity and should follow the same visual pattern.
2. Placing priority in a DetailRow would visually subordinate it below the title and separator, reducing its prominence. Priority is a top-level alert attribute, not secondary metadata.
3. WS-0.4's Pattern C shows `<PriorityBadge priority={item.priority} size="lg" showLabel />` as a standalone element, not wrapped in a label structure.

### 4.3 Files Modified

| File | Change Type | Lines Affected |
|------|------------|----------------|
| `src/components/district-view/scenes/CategoryDetailScene.tsx` | Add import (top of file) + insert PriorityBadge in AlertList render (after line 303) | ~3 lines added |
| `src/components/district-view/district-view-dock.tsx` | Add import (top of file) + insert PriorityBadge in AlertDetailView render (after line 122) | ~3 lines added |

**No changes to:**
- `district-view-content.tsx` -- pure pass-through component, no alert rendering logic.
- `district-view-overlay.tsx` -- manages state wiring only, no alert rendering.
- `use-category-intel.ts` -- type extension belongs to WS-1.1.
- `coverage.store.ts` -- no store changes needed for display-only badge insertion.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Alert rows in the district `AlertList` display a PriorityBadge between the severity badge and the title. | Navigate to any category district view. Verify that P1 alert rows show a diamond shape and P2 rows show a triangle shape between severity and title. |
| AC-2 | P3 and P4 alert rows in the `AlertList` do not render any priority indicator. | Verify that rows for P3/P4 alerts show only severity badge, title, and time -- no empty gap or placeholder where the priority badge would be. |
| AC-3 | The PriorityBadge in alert rows uses `size="sm"` (12px context). | DOM inspection: the PriorityBadge SVG viewport is 12x12. The badge is visually proportional to the 9px severity badge text. |
| AC-4 | Clicking an alert row and viewing the INSPECT dock panel shows a PriorityBadge with label. | Click any alert row. In the dock panel, verify a PriorityBadge appears between the severity badge and title, showing both the shape icon and the text label (e.g., diamond + "P1"). |
| AC-5 | The INSPECT panel PriorityBadge uses `size="lg"` and `showLabel={true}`. | DOM inspection: the PriorityBadge SVG viewport is 20x20 and text label is rendered alongside the shape. |
| AC-6 | P3 alerts display "P3" text in the INSPECT panel (no shape, text-only). | Select a P3 alert. The dock panel shows "P3" label without a geometric shape, at subdued opacity. |
| AC-7 | P4 alerts display "P4" text in the INSPECT panel (muted). | Select a P4 alert. The dock panel shows "P4" label at the lowest opacity tier (`rgba(255,255,255,0.10)`). |
| AC-8 | Alert list layout does not break when PriorityBadge returns null (P3/P4 rows). | Visual inspection: P3/P4 rows have identical spacing and alignment to the pre-WS-1.3 layout. No extra gaps or misalignment. |
| AC-9 | PriorityBadge is achromatic in both surfaces -- no color used for priority. | Visual inspection: no red, amber, yellow, or blue hues on any PriorityBadge. Only white-channel opacity variation. Severity retains its color treatment. |
| AC-10 | `pnpm typecheck` passes with no errors after changes. | Run `pnpm typecheck` -- exits 0. |
| AC-11 | `pnpm build` completes without errors. | Run `pnpm build` -- exits 0. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Place PriorityBadge between severity badge and title in AlertList rows, not after the title or before the severity badge. | Reading order follows classification hierarchy: severity (color) then priority (shape) then content (title). Users scanning the list encounter severity first (the strongest pre-attentive channel -- color), then priority (shape/weight), then the alert text. This matches the natural left-to-right scan pattern and keeps both classification indicators grouped before the content. | (a) Before severity badge -- rejected: priority is the secondary classifier, not the primary. Severity is the established first signal in this codebase. (b) After title, before time -- rejected: separates the two classification badges, forcing the eye to jump over the title to compare severity and priority. (c) Replace severity badge -- rejected: severity and priority are independent dimensions per AD-1; both must be visible. |
| D-2 | Place PriorityBadge as a standalone element in the dock panel (between severity badge and title), not inside a `DetailRow`. | Severity badge is rendered as a standalone element (lines 113-122), not in a DetailRow. Priority is the same classification tier and should follow the same visual treatment. Placing it in a DetailRow would visually subordinate it below the separator and metadata grid, reducing prominence. | (a) `<DetailRow label="Priority">` in metadata grid (lines 152-203) -- rejected: reduces visual prominence, inconsistent with severity badge placement. (b) Inline next to severity badge in a flex row -- considered viable but increases the horizontal width of the badge block and changes the existing single-badge-per-line rhythm. The stacked vertical layout (severity above, priority below, then title) preserves the clean vertical scan pattern. |
| D-3 | Use `showLabel={false}` (default) in AlertList and `showLabel={true}` in the dock panel. | Follows AD-1's progressive disclosure model. List views show only shapes (P1/P2) for fast visual scanning without text noise. Detail views reveal full labels for all levels. WS-0.4 Section 4.4 specifies this exact pairing. | No alternatives -- this is the canonical usage pattern defined by WS-0.4. |
| D-4 | Do not add sort-by-priority to the AlertList sort controls. | Combined recommendations explicitly defer "Priority sort in district alert list" until after priority badges are live and users request it. Adding sort logic increases the scope of this workstream and complicates the existing severity/time sort toggle without proven user demand. | (a) Add "Priority" as a third sort option now -- rejected: deferred per combined-recommendations.md. |
| D-5 | Add `className="mb-3"` to the dock panel PriorityBadge for vertical spacing. | The severity badge above uses `mb-3` (line 114) for spacing before the next element. Repeating this margin on the PriorityBadge maintains consistent vertical rhythm: severity badge (mb-3) -> priority badge (mb-3) -> title. Without it, the priority badge and title would have no spacing. | (a) Wrap both badges in a flex column container with `gap-3` -- viable but more invasive, requires restructuring the existing severity badge markup. (b) Use a different margin value -- rejected: `mb-3` is the established spacing in this layout section. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Is the `priority` field on `CategoryIntelItem` typed as `OperationalPriority` (always present) or `OperationalPriority \| null` (nullable during migration)? This determines whether a null guard is needed around the PriorityBadge render. | WS-1.1 implementer | Phase 1 (resolved when WS-1.1 is written) |
| OQ-2 | Should the P1 pulse animation in list rows be disabled when many P1 items are visible simultaneously (e.g., more than 5 pulsing badges in the viewport)? WS-0.4 R-3 mentions a potential `maxPulsingBadges` limiter. | UX advisory | Phase 1 (evaluate during integration testing) |
| OQ-3 | When an alert is selected and the dock panel shows the INSPECT view, should the PriorityBadge in the corresponding AlertList row gain a highlight or emphasis (e.g., `showLabel={true}`) to reinforce the connection between list selection and detail display? | UX advisory | Phase 2 (after priority badges are live and interaction patterns can be observed) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-1.1 types the priority field differently than expected (e.g., `operationalPriority` instead of `priority`, or uses a different type). | Low | Low | The badge insertion is a 3-line change. Adjusting the field name is trivial. The SOW documents the assumed field name (`item.priority`); if WS-1.1 uses a different name, update the accessor. |
| R-2 | Adding PriorityBadge to AlertList rows causes layout shift for P1/P2 rows (where the badge renders) vs P3/P4 rows (where it returns null), making the list visually jagged. | Low | Medium | The `flex gap-3` layout only adds a gap between rendered flex children. When PriorityBadge returns `null`, no flex child is produced and no gap is added. The severity badge and title sit directly adjacent as before. This is confirmed by React's rendering behavior: `null` return produces no DOM node and does not participate in flex layout. Visual verification during implementation should confirm uniform row height and alignment. |
| R-3 | The dock panel PriorityBadge with `size="lg"` (20px SVG) is visually too large relative to the severity badge (`text-[10px]`, roughly 14px height with padding). | Low | Low | The `lg` PriorityBadge is designed for detail panel context (WS-0.4 Section 4.3). If it appears disproportionate, the `size="md"` (16px) variant can be used instead as a drop-in swap. No structural changes needed. |
| R-4 | Pre-migration API responses return alerts without a priority field (field is undefined or null), causing runtime errors when PriorityBadge receives `undefined` as the `priority` prop. | Medium | Medium | Add the null guard pattern documented in Section 4.1. If WS-1.1 does not guarantee a non-null priority value on every `CategoryIntelItem`, the implementer must wrap the PriorityBadge in a conditional render (`{item.priority && <PriorityBadge ... />}`). This is called out in OQ-1 and should be resolved before implementation begins. |
| R-5 | The P1 diamond pulse animation in the AlertList creates visual noise when the list contains several P1 items and the user is trying to read titles. | Low | Low | P1 items are expected to be rare (critical threats). The 2.5-second animation cycle and 0.5 minimum opacity are deliberately subtle (per WS-0.4 Section 4.5). If user testing reveals distraction, WS-0.4's animation can be tuned independently without changing this workstream's integration code. |
