# WS-0.2: Add Priority Types to Interfaces

> **Workstream ID:** WS-0.2
> **Phase:** 0 -- Consolidate & Prepare
> **Assigned Agent:** `react-developer`
> **Advisory:** `information-architect` (reviews type taxonomy)
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** None
> **Blocks:** WS-0.4 (PriorityBadge), WS-1.1 (API type extensions), WS-1.4 (priority filter)
> **Resolves:** AD-1 (type foundation for achromatic priority channel)

## 1. Objective

Establish the foundational type system for operational priority (P1--P4) in the TarvaRI Alert Viewer. This workstream adds the `OperationalPriority` union type, the `PRIORITY_LEVELS` constant array, and the `PriorityMeta` interface with achromatic display metadata (shape, weight, animation) to `src/lib/interfaces/coverage.ts`. Every downstream workstream that references priority -- badge rendering (WS-0.4), API type extensions (WS-1.1), priority filtering (WS-1.4), and map marker scaling (WS-1.5) -- imports from this single source of truth.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `OperationalPriority` type | Union type `'P1' \| 'P2' \| 'P3' \| 'P4'` derived from a `PRIORITY_LEVELS` const array, following the `SeverityLevel` derivation pattern. |
| `PriorityMeta` interface | Typed metadata contract for each priority level: label, short label, shape, weight, animation, default visibility, sort order. Contains zero color information (AD-1 enforcement). |
| `PRIORITY_LEVELS` constant | `as const` array of the four priority identifiers in descending urgency order, paralleling the `SEVERITY_LEVELS` pattern. |
| `PRIORITY_META` constant | `Record<OperationalPriority, PriorityMeta>` lookup table with display metadata for each level, paralleling the `SEVERITY_COLORS` constant structure. |
| `getPriorityMeta` helper | Function that takes a string and returns the matching `PriorityMeta` with a safe fallback for unknown values, paralleling `getCategoryMeta`. |
| JSDoc documentation | All exports receive module-level and member-level JSDoc matching the documentation density of the existing severity and category sections. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| PriorityBadge component | Separate workstream (WS-0.4) consumes these types to build the visual component. |
| API response type changes | WS-1.1 adds `operational_priority` to `ApiIntelItem`, `IntelFeedItem`, `MapMarker`, `CategoryIntelItem`. This workstream only defines the type the field will reference. |
| `p1Count` / `p2Count` on `CoverageByCategory` | WS-1.2 extends the metrics type. This workstream establishes the priority type those fields will use. |
| Priority filter state in Zustand | WS-1.4 adds `selectedPriorities: OperationalPriority[]` to `coverage.store.ts`. This workstream provides the type. |
| Map marker radius expressions | WS-1.5 uses `PRIORITY_META` sort order to drive MapLibre expressions. This workstream provides the data. |
| CSS custom properties for priority | Not needed. Priority is achromatic -- no `--priority-p1` color tokens. Shape and weight are expressed through component styles, not design tokens. |
| Priority color mappings | Explicitly excluded by AD-1. Priority must never define color values. Severity owns the color channel. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/lib/interfaces/coverage.ts` | Existing file structure, `SEVERITY_LEVELS` / `SeverityLevel` / `SEVERITY_COLORS` patterns to parallel | Available -- reviewed |
| AD-1 (Architecture Decision) | Priority visual channel specification: P1 = bold + diamond + pulse, P2 = medium + triangle + static, P3 = normal + text-only, P4 = invisible by default | Confirmed in combined-recommendations.md |
| Backend field name convention | The backend uses `operational_priority` as the field name with values `'P1'`, `'P2'`, `'P3'`, `'P4'` | Assumed per combined-recommendations.md -- verify when backend Phase A lands |

## 4. Deliverables

All additions go in `src/lib/interfaces/coverage.ts`, inserted as a new section between the existing "Severity levels" block (lines 108-125) and the "Source status" block (lines 127-135). This preserves the file's top-to-bottom organization: Category --> Severity --> **Priority** --> Source Status --> Grid Display.

### 4.1 `PRIORITY_LEVELS` Constant Array

A readonly tuple of the four priority identifiers in descending urgency order, mirroring how `SEVERITY_LEVELS` is ordered from `'Extreme'` down to `'Unknown'`.

```
PRIORITY_LEVELS = ['P1', 'P2', 'P3', 'P4'] as const
```

The identifiers use the short-form strings (`'P1'` not `'critical'`) because:
- They match the backend `operational_priority` field values directly -- no mapping layer needed.
- They are terse enough for use in filter UIs, URL params (`?priority=P1`), and badge labels.
- They avoid collision with severity labels (which use full English words like `'Extreme'`).

### 4.2 `OperationalPriority` Type

Derived from the const array, identical to how `SeverityLevel` is derived:

```
type OperationalPriority = (typeof PRIORITY_LEVELS)[number]
// Resolves to: 'P1' | 'P2' | 'P3' | 'P4'
```

The name `OperationalPriority` (not `Priority`) matches the backend field name `operational_priority` and avoids ambiguity with generic "priority" concepts elsewhere in the SafeTrekr platform.

### 4.3 `PriorityMeta` Interface

The metadata contract for each priority level. This is the priority equivalent of what `SEVERITY_COLORS` provides for severity -- but instead of color values, it carries achromatic display properties per AD-1.

| Field | Type | Purpose | Consumed By |
|-------|------|---------|-------------|
| `id` | `OperationalPriority` | The priority level identifier | All consumers -- used as lookup key |
| `label` | `string` | Human-readable display label (e.g., `'Critical'`, `'High'`, `'Standard'`, `'Low'`) | PriorityBadge tooltip, filter dropdown, accessibility labels |
| `shortLabel` | `string` | Abbreviated label for tight spaces (e.g., `'P1'`, `'P2'`, `'P3'`, `'P4'`) | Badge text, table columns, map popups |
| `shape` | `'diamond' \| 'triangle' \| 'none'` | Geometric shape for pre-attentive visual distinction | PriorityBadge SVG rendering (WS-0.4), map marker styling (WS-1.5) |
| `weight` | `'bold' \| 'medium' \| 'normal'` | Typographic weight for text-based priority indicators | PriorityBadge font-weight, alert list row styling |
| `animation` | `'pulse' \| null` | CSS animation identifier or null for no animation | PriorityBadge animation class, PriorityFeedStrip pulsing (WS-2.2) |
| `defaultVisibility` | `'always' \| 'detail' \| 'filter-only'` | Where this priority level is shown without explicit filtering | PriorityBadge conditional rendering, CategoryCard badge logic (WS-1.2) |
| `sortOrder` | `number` | Numeric weight for sorting (1 = highest priority, 4 = lowest) | Alert list sorting, feed ordering, filter UI ordering |

**Visibility semantics:**
- `'always'` -- P1 and P2 badges render in all contexts (list views, cards, map popups, detail panels).
- `'detail'` -- P3 badges render only in detail views (INSPECT panel, district alert detail) and are omitted from list-level summaries like CategoryCard counts.
- `'filter-only'` -- P4 items are invisible by default. They appear only when the user explicitly selects P4 in a priority filter (progressive disclosure per AD-1).

### 4.4 `PRIORITY_META` Constant Record

A `Record<OperationalPriority, PriorityMeta>` mapping each priority level to its metadata. The four entries:

| Priority | label | shortLabel | shape | weight | animation | defaultVisibility | sortOrder |
|----------|-------|------------|-------|--------|-----------|-------------------|-----------|
| P1 | `'Critical'` | `'P1'` | `'diamond'` | `'bold'` | `'pulse'` | `'always'` | `1` |
| P2 | `'High'` | `'P2'` | `'triangle'` | `'medium'` | `null` | `'always'` | `2` |
| P3 | `'Standard'` | `'P3'` | `'none'` | `'normal'` | `null` | `'detail'` | `3` |
| P4 | `'Low'` | `'P4'` | `'none'` | `'normal'` | `null` | `'filter-only'` | `4` |

### 4.5 `getPriorityMeta` Helper Function

A safe accessor function that returns `PriorityMeta` for a given string input, with fallback to the P4 entry for unknown values. This parallels `getCategoryMeta` which falls back to the `'other'` entry.

```
function getPriorityMeta(priority: string): PriorityMeta
```

**Fallback rationale:** Unknown or null priority values default to P4 (lowest, invisible by default). This ensures that items with missing priority data from pre-migration API responses do not inappropriately appear as high-priority. The fallback is conservative by design.

### 4.6 `isPriorityVisible` Helper Function

A convenience predicate that determines whether a priority level should be rendered in a given display context.

```
function isPriorityVisible(priority: OperationalPriority, context: 'list' | 'detail'): boolean
```

Returns `true` when `defaultVisibility` is `'always'`, or when it is `'detail'` and the context is `'detail'`. Returns `false` for `'filter-only'` in both contexts (those items are shown only via explicit filter selection, which is handled by the filter logic in WS-1.4, not by this predicate).

This helper prevents each consumer from re-implementing visibility logic by hand.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `OperationalPriority` type resolves to exactly `'P1' \| 'P2' \| 'P3' \| 'P4'` | `pnpm typecheck` -- assign each literal; verify non-members like `'P5'` cause a type error |
| AC-2 | `PRIORITY_LEVELS` is a readonly 4-element tuple with values `['P1', 'P2', 'P3', 'P4']` | Runtime assertion in a unit test; TypeScript const assertion verified by typecheck |
| AC-3 | `PRIORITY_META` contains entries for all four levels with complete metadata | Unit test iterates `PRIORITY_LEVELS`, asserts each has a corresponding `PRIORITY_META` entry with all required fields populated |
| AC-4 | `PRIORITY_META` contains zero color-related fields or color values | Code review; grep for `color`, `#`, `rgb`, `hsl`, `var(--` within the priority section |
| AC-5 | `getPriorityMeta('P1')` returns the P1 entry; `getPriorityMeta('unknown')` returns the P4 (fallback) entry | Unit test |
| AC-6 | `isPriorityVisible('P1', 'list')` returns `true`; `isPriorityVisible('P4', 'detail')` returns `false` | Unit test covering all 8 combinations (4 levels x 2 contexts) |
| AC-7 | `PriorityMeta.shape` is typed as `'diamond' \| 'triangle' \| 'none'` -- not `string` | `pnpm typecheck` -- assign invalid shape value and confirm type error |
| AC-8 | All new exports have JSDoc documentation with `@see` references to AD-1 | Code review |
| AC-9 | `pnpm typecheck` passes with zero errors on the full project | CI or local `pnpm typecheck` |
| AC-10 | No existing code breaks -- all current imports from `coverage.ts` continue to work | `pnpm typecheck` + `pnpm build` pass |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Use `'P1' \| 'P2' \| 'P3' \| 'P4'` string literals (not `'critical' \| 'high' \| 'standard' \| 'low'`) | Matches backend `operational_priority` field values directly. Avoids a mapping layer. Terse for UI labels and URL params. | Full English names (`'critical'`) -- rejected because they'd require mapping to/from API values and collide semantically with severity labels. Numeric enum (`1 \| 2 \| 3 \| 4`) -- rejected because string literals are more debuggable and URL-friendly. |
| D-2 | Name the type `OperationalPriority` (not `Priority`) | Matches backend field name `operational_priority`. Disambiguates from any generic "priority" concept. Grep-friendly. | `Priority` -- too generic, could collide. `AlertPriority` -- reasonable but less aligned with the backend naming convention. |
| D-3 | Derive type from const array (`(typeof PRIORITY_LEVELS)[number]`) | Mirrors the established `SeverityLevel` derivation pattern in this file. Single source of truth -- the array and type stay in sync automatically. | Hand-written union type -- fragile, could diverge from the array. |
| D-4 | Fall back to P4 for unknown priority values in `getPriorityMeta` | Conservative default: unknown = lowest priority = invisible by default. Items with missing priority won't appear as false P1 alerts. | Fall back to P3 (standard) -- reasonable but P4's `'filter-only'` visibility is safer for unknown data. Throw error -- rejected because runtime data from APIs can legitimately have null/missing priority during the migration period. |
| D-5 | `PriorityMeta.shape` uses string union (`'diamond' \| 'triangle' \| 'none'`), not an enum | Consistent with how the rest of `coverage.ts` uses string literal types. Enums add import ceremony without benefit for this use case. | TypeScript `enum` -- adds extra JS output and doesn't integrate as cleanly with the `as const` pattern. |
| D-6 | Include `defaultVisibility` in `PriorityMeta` rather than hardcoding visibility logic per consumer | Centralizes the AD-1 progressive disclosure rule (P3 = detail-only, P4 = filter-only). Each consumer reads the metadata rather than re-implementing the logic. | Per-consumer visibility checks -- would scatter AD-1 logic across PriorityBadge, CategoryCard, alert lists, and map markers. |
| D-7 | Include `sortOrder` as a numeric field | Enables downstream sorting without mapping priority strings to ordinals. `Array.sort((a, b) => a.sortOrder - b.sortOrder)` is more readable than string comparison. | Rely on array index position in `PRIORITY_LEVELS` -- works but is implicit and fragile if the array is ever reordered or extended. |
| D-8 | Place the new section between Severity and Source Status blocks | Maintains the file's logical flow: Category identity --> Severity --> Priority --> Source status --> Grid display. Priority is more closely related to severity (both describe alert attributes) than to source status. | Place at end of file -- would separate related concepts. Place in a new file -- would fragment the type module unnecessarily for a small addition. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should `PriorityMeta` include a `description` field (e.g., "Immediate threat to life or critical infrastructure") for use in tooltips and accessibility labels? | information-architect | WS-0.2 (before implementation) |
| OQ-2 | Confirm the exact backend `operational_priority` field values are `'P1'`--`'P4'` (not `'p1'`--`'p4'` or `1`--`4`). Case mismatch would require a normalization step in WS-1.1. | Backend team / WS-1.1 | Phase 1 |
| OQ-3 | Should the `shape` union include a future-proofing `'circle'` or `'square'` value, or should the union be extended only when a concrete need arises? | react-developer | WS-0.2 (recommend: do not future-proof -- extend when needed) |
| OQ-4 | The `animation` field currently only supports `'pulse' \| null`. If Phase 2's PriorityFeedStrip needs a different animation (e.g., `'glow'`), should the union be extended now or deferred? | react-developer | WS-0.2 (recommend: defer -- extend in WS-2.2 if needed) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Backend uses different priority value format (e.g., lowercase `'p1'` or numeric `1`) | Low | Medium -- every consumer would need a normalization step | Verify with backend team before WS-1.1 implementation. If mismatched, add a `normalizePriority()` function alongside `getPriorityMeta()` in this file. The type definition itself remains `'P1'`--`'P4'`; normalization happens at the API boundary in WS-1.1 hook normalizers. |
| R-2 | Downstream consumers assume priority metadata includes color, violating AD-1 | Low | High -- breaks the dual-channel visual model (severity = color, priority = shape/weight) | `PriorityMeta` interface deliberately excludes any color-related field. AC-4 explicitly verifies this. Code review for WS-0.4 and WS-1.2 should flag any priority-to-color mapping attempts. |
| R-3 | `PriorityMeta` interface needs fields not anticipated here, requiring a type change that breaks downstream consumers | Low | Low -- additive interface changes (adding optional fields) are non-breaking in TypeScript | Design the interface to cover known downstream needs (WS-0.4 badge, WS-1.2 card counts, WS-1.4 filter, WS-1.5 map scaling). If a new required field is needed later, it can be added with a default in `PRIORITY_META`. |
| R-4 | The `isPriorityVisible` helper is too rigid for future display contexts beyond `'list'` and `'detail'` | Medium | Low -- the function signature would need updating | Keep the context union narrow for now (`'list' \| 'detail'`). If new contexts emerge (e.g., `'map'`, `'notification'`), extend the union. The function is small enough that changing it is trivial. |
| R-5 | The `'filter-only'` visibility for P4 is too aggressive -- users may not discover that P4 items exist | Low | Medium -- P4 items would be effectively invisible unless users explore the priority filter | This is the intended progressive disclosure behavior per AD-1. The priority filter UI (WS-1.4) should show all four levels with counts, making P4's existence discoverable even though its items are hidden by default. |
