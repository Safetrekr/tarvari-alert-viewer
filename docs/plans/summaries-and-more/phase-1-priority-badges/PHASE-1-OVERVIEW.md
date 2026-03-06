# Phase 1 Overview: Priority Badges

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** combined-recommendations.md
> **Date:** 2026-03-05
> **Workstreams:** WS-1.1, WS-1.2, WS-1.3, WS-1.4, WS-1.5
> **Backend Dependency:** Phase A (specifically A.5 -- console endpoints return `operational_priority`)

## 1. Executive Summary

Phase 1 makes operational priority visible on every alert surface in the TarvaRI Alert Viewer: grid cards, district alert lists, INSPECT detail panels, map markers, and the coverage store filter. It is the foundational visual layer that all subsequent priority-dependent features (P1/P2 feed strip in Phase 2, search results in Phase 3, geo intelligence in Phase 4) build upon.

The phase comprises five workstreams: one medium (WS-1.2, CategoryCard priority counts and badge rendering) and four small (WS-1.1 type plumbing, WS-1.3 district/INSPECT wiring, WS-1.4 filter store, WS-1.5 map marker scaling). Estimated effort is 2--3 days. WS-1.1 is the critical-path linchpin -- it threads the `operationalPriority` field through every API hook normalizer, and all four downstream workstreams depend on it. The phase depends on Phase 0 deliverables (WS-0.2 `OperationalPriority` type, WS-0.4 `PriorityBadge` component) and on Backend Phase A adding `operational_priority` to `/console/*` responses.

A consistent architectural principle governs the entire phase: priority uses the achromatic visual channel (shape, weight, size, animation) while severity retains exclusive ownership of color (AD-1). This channel separation is enforced structurally -- the `PriorityMeta` type from WS-0.2 deliberately excludes color fields, and every SOW references AD-1 consistently. No conflicts in this principle were found across the five workstreams.

Three cross-workstream conflicts were identified during synthesis: a field name discrepancy between WS-1.1 and WS-1.3, a GeoJSON property name disagreement between WS-1.1 and WS-1.5, and a scope gap where WS-1.1 does not extend the `ApiIntelItem` in `use-coverage-metrics.ts` that WS-1.2 requires. All three are resolvable without architectural changes and are detailed in Section 3.

## 2. Key Findings (grouped by theme, not by workstream)

### 2.1 Data Plumbing Architecture

WS-1.1 establishes the data contract that the rest of the phase consumes. The `operationalPriority` field is threaded through four data hooks (`use-intel-feed`, `use-category-intel`, `use-coverage-map-data`, `use-intel-bundles`), two utility modules (`coverage-utils`, `map-utils`), and one interface file (`intel-bundles.ts`). The approach follows the existing codebase pattern exactly: API-layer types use `string | null` (reflecting the unvalidated wire protocol), while client-side types use `OperationalPriority | null` (narrowed via `as` cast in normalizers). This mirrors how `severity` is handled today.

The type threading is additive -- no existing fields are modified, no function signatures change. The `?? null` fallback in every normalizer ensures graceful degradation when the backend has not yet populated the field. Verified against the codebase: the existing `ApiIntelItem` in `use-coverage-metrics.ts` (lines 50--53) uses a loose `[key: string]: unknown` index signature, which means `item.operational_priority` can be accessed without a type error even before WS-1.1 formally extends it. However, this relies on implicit typing rather than explicit contracts -- see Gap 1 in Section 9.

### 2.2 Priority Visualization Strategy

The achromatic priority channel (AD-1) is implemented through three distinct visual mechanisms, each targeting a different surface:

**Geometric shape** (WS-1.2 cards, WS-1.3 lists/dock): PriorityBadge renders P1 as a diamond, P2 as a triangle, P3 as text-only, and P4 as invisible/null. Progressive disclosure governs which levels appear in which context: list views show shapes only (P1/P2), detail views show labels for all levels. This is consistent across WS-1.2 (card badge uses `size="md"`, no label) and WS-1.3 (list badge uses `size="sm"` no label; dock badge uses `size="lg"` with label).

**Size scaling** (WS-1.5 map markers): P1 markers render at radius 9 (1.5x default), P2 at 7.5 (1.25x), P3/P4 at the unchanged default of 6. The radius expression parallels the existing `CIRCLE_COLOR_EXPRESSION` pattern already used for severity coloring. Verified against codebase: `unclusteredPointLayer` currently has `'circle-radius': 6` at line 147 of `MapMarkerLayer.tsx`, confirming the baseline.

**Achromatic glow** (WS-1.5 map markers): P1 markers additionally receive a white (`rgba(255, 255, 255, 0.6)`) blurred glow with a 4-second breathing pulse. The white glow is deliberately distinct from the severity-colored new-alert glow (3-second cycle), both in hue and timing. The different cycle periods prevent synchronization artifacts.

### 2.3 Client-Side Priority Derivation

WS-1.2 derives `p1Count` and `p2Count` per category client-side from the `/console/intel?limit=1000` response, rather than requiring a backend endpoint change. This is architecturally sound: the intel request already happens in `fetchCoverageMetrics` (line 68 of `use-coverage-metrics.ts`), and the derivation adds only a loop extension to the existing alert-counting logic (lines 72--76). The `CoverageByCategory` type is extended with two numeric fields, and the zero-fill propagates to `buildAllGridItems`, `buildCategoryMetrics`, and `emptyMetrics`.

A known limitation: the `limit=1000` cap means priority counts are approximate for high-volume categories. All five SOWs accept this as adequate for a summary surface, with the backend `/console/coverage` endpoint eventually providing exact counts.

### 2.4 Priority Filtering Model

WS-1.4 adds `selectedPriorities: OperationalPriority[]` to the coverage store, mirroring the established `selectedCategories` toggle pattern. Empty array means "show all" (subject to default visibility rules from WS-0.2). When the filter is active, it overrides `isPriorityVisible()` entirely -- if a user explicitly selects P4, they see P4 items. This interaction rule (WS-1.4 D-7) is the most important behavioral decision in the phase.

URL synchronization via `?priority=P1&priority=P2` follows the existing `?category=` pattern. Validation against `PRIORITY_LEVELS.includes()` guards against invalid URL params.

The filter scope is deliberately limited to the district view alert list. Map marker filtering by priority, hub-level priority filtering, and sort-by-priority are all explicitly deferred.

### 2.5 Null-Safety During Migration Window

Every workstream addresses the transition period when the backend has not yet added `operational_priority` to API responses. The strategies are consistent and layered:

| Layer | Strategy | Source |
|-------|----------|--------|
| API normalizers | `?? null` fallback -- missing field resolves to `null`, not crash | WS-1.1 |
| Priority counting | `null` items excluded from P1/P2 counts | WS-1.2 |
| Badge rendering | Null guard (`{item.operationalPriority && <PriorityBadge ... />}`) or PriorityBadge returns `null` for P4 default | WS-1.3 |
| Filter matching | If `operationalPriority` is `undefined`, treat as pass-through (no filter match) | WS-1.4 |
| Map GeoJSON | Missing priority defaults to `'P4'` -- gets default radius, no glow | WS-1.5 |

This layered approach means the frontend work can proceed in parallel with Backend Phase A. The UI remains unchanged until priority data actually flows.

## 3. Cross-Workstream Conflicts

### Conflict 1: Field Name Discrepancy -- `operationalPriority` vs `priority`

**WS-1.1** adds the field as `operationalPriority` on `CategoryIntelItem` (Section 4.2.2: `operationalPriority: OperationalPriority | null`), consistent with the naming used on `IntelFeedItem`, `MapMarker`, and `BundleWithDecision`.

**WS-1.3** refers to the field as `item.priority` throughout (Section 4.1: "Read `item.priority` (type `OperationalPriority`) from `CategoryIntelItem`"). This is incorrect -- the field will be named `operationalPriority`, not `priority`.

**WS-1.5** OQ-1 explicitly flags this: "What field name does WS-1.1 use on `MapMarker` -- `operationalPriority` or `priority`?"

**Resolution:** WS-1.3 must use `item.operationalPriority`, not `item.priority`. The SOW's code snippets should be updated before implementation. This is a documentation error, not an architectural conflict. Impact: trivial -- find-replace in WS-1.3 Section 4.1 and 4.2.

### Conflict 2: GeoJSON Property Name -- `operationalPriority` vs `priority`

**WS-1.1** (Section 4.6) adds `operationalPriority: string | null` to `MarkerFeatureCollection` properties and maps `marker.operationalPriority` into the GeoJSON properties object.

**WS-1.5** (Section 4.1) names the GeoJSON property `priority` (shorter) and explicitly justifies this in D-6: "GeoJSON properties are a flat JSON bag read by MapLibre expressions. Shorter names reduce noise in expression definitions."

**Resolution:** Adopt WS-1.5's `priority` name for GeoJSON properties. The mapping from TypeScript `operationalPriority` to GeoJSON `priority` happens in `markersToGeoJSON()`, which is the appropriate translation boundary. WS-1.1 Section 4.6 should be updated to use `priority` as the GeoJSON property key. WS-1.5 Section 4.2's `CIRCLE_RADIUS_EXPRESSION` uses `['get', 'priority']`, which is cleaner than `['get', 'operationalPriority']`.

This requires WS-1.1 and WS-1.5 implementers to coordinate on the property name. A single line change in WS-1.1's `markersToGeoJSON` deliverable.

### Conflict 3: Missing `use-coverage-metrics.ts` from WS-1.1 Scope

**WS-1.2** (Section 3, Input Dependencies) states: "WS-1.1 deliverables -- `operational_priority` field on `ApiIntelItem` in `src/hooks/use-coverage-metrics.ts`."

**WS-1.1** does not include `use-coverage-metrics.ts` in its scope table. It extends `ApiIntelItem` in `use-intel-feed.ts`, `use-category-intel.ts`, `use-coverage-map-data.ts`, and `use-intel-bundles.ts` -- but not in `use-coverage-metrics.ts`.

**Codebase context:** The `ApiIntelItem` in `use-coverage-metrics.ts` (lines 50--53) is a minimal type: `{ category: string; [key: string]: unknown }`. The index signature means `item.operational_priority` is technically accessible as `unknown`, but WS-1.2's counting logic (`if (item.operational_priority === 'P1')`) would work at runtime due to JavaScript's loose comparison. However, TypeScript would flag this without proper typing.

**Resolution:** WS-1.1 scope must be extended to include `use-coverage-metrics.ts`. Add `operational_priority: string | null` to the `ApiIntelItem` in that file. This is a 1-line addition that follows the same pattern as the other four hooks. Alternatively, WS-1.2 can own this type extension since it is the sole consumer -- but placing it in WS-1.1 maintains the principle that all API type extensions belong to the plumbing workstream.

## 4. Architecture Decisions (consolidated table from all SOWs)

| ID | Decision | Source SOW | Rationale |
|----|----------|-----------|-----------|
| D-1.1.1 | API-layer types (`ApiIntelItem`, `ApiBundleItem`) use `string \| null` for `operational_priority`; client-side types use `OperationalPriority \| null`. | WS-1.1 D-2 | API types reflect the unvalidated wire protocol. Type narrowing happens in normalizers, consistent with how `severity` is handled. |
| D-1.1.2 | Use `OperationalPriority \| null` (not `\| undefined`) for all client-side priority fields. | WS-1.1 D-1 | `null` is the established nullability pattern across all existing types (`IntelFeedItem`, `CategoryIntelItem`, `MapMarker`). |
| D-1.1.3 | Extend `BundleWithDecision` (composite type), not `IntelBundleRow` (Supabase schema mirror). | WS-1.1 D-3 | `IntelBundleRow` mirrors the DB schema and should only change when the schema changes. Priority comes from the TarvaRI API, not Supabase. |
| D-1.1.4 | Use `as OperationalPriority` cast in normalizers rather than runtime Zod validation. | WS-1.1 D-4 | Matches existing pattern (severity, category are passed through without validation). `getPriorityMeta()` provides safe fallback at consumption. |
| D-1.1.5 | GeoJSON properties use `string \| null` (not `OperationalPriority`) for MapLibre consumption. | WS-1.1 D-5 | MapLibre style expressions consume raw strings. TypeScript unions are meaningless at runtime. |
| D-1.1.6 | Set `operationalPriority: null` in `toMarkers()` (Supabase direct-query path). | WS-1.1 D-6 | `IntelNormalizedRow` does not have the field. Supabase path is legacy; API hooks are the primary data flow. |
| D-1.1.7 | Thread priority into `MarkerFeatureCollection` properties now (not in WS-1.5). | WS-1.1 D-7 | Avoids WS-1.5 needing to re-touch types that WS-1.1 already modifies. |
| D-1.2.1 | Derive `p1Count`/`p2Count` client-side from `/console/intel` response. | WS-1.2 D-1 | Intel request already happens in `fetchCoverageMetrics`. Zero additional network cost. Backend can add exact counts later without changing the type contract. |
| D-1.2.2 | Show highest priority badge on CategoryCard (P1 diamond over P2 triangle), not both. | WS-1.2 D-2 | Card is 160x180px -- a small summary surface. Two badges create visual clutter. District view (WS-1.3) provides full breakdown. |
| D-1.2.3 | Show combined count (`p1Count + p2Count`) next to badge only when count > 1. | WS-1.2 D-3 | Count "1" is redundant with the shape alone. Count > 1 signals volume at a glance. |
| D-1.2.4 | Compose count as sibling `<span>` next to PriorityBadge, not via a `count` prop. | WS-1.2 D-4 | Keeps PriorityBadge focused on single-level display. Resolves WS-0.4 Q-3. |
| D-1.2.5 | Badge container has `aria-hidden="true"`; priority info conveyed via card `aria-label`. | WS-1.2 D-5 | Prevents duplicate screen reader announcements. |
| D-1.2.6 | Position badge at `absolute top-2 right-2` (top-right corner). | WS-1.2 D-6 | Category icon is top-left; top-right is empty space. 8px inset within 16px padding zone. |
| D-1.2.7 | Use `'P1'`/`'P2'` string literal comparison in counting loop (not `getPriorityMeta()`). | WS-1.2 D-7 | Simple string match is sufficient for aggregation. `getPriorityMeta()` governs rendering, not counting. |
| D-1.3.1 | Place PriorityBadge between severity badge and title in AlertList rows. | WS-1.3 D-1 | Reading order: severity (color) then priority (shape) then content (title). Groups both classifiers before content. |
| D-1.3.2 | Place PriorityBadge as standalone element in dock panel (not inside `DetailRow`). | WS-1.3 D-2 | Severity badge is standalone; priority is the same classification tier. Subordinating it in a DetailRow reduces prominence. |
| D-1.3.3 | `showLabel={false}` in list, `showLabel={true}` in dock. | WS-1.3 D-3 | Follows AD-1 progressive disclosure model. List: shapes for fast scanning. Detail: full labels for complete information. |
| D-1.3.4 | Do not add sort-by-priority to AlertList. | WS-1.3 D-4 | Explicitly deferred per combined-recommendations.md until badges are live and users request it. |
| D-1.4.1 | Mirror `selectedCategories` toggle pattern exactly. | WS-1.4 D-1 | Any developer who understands `selectedCategories` immediately understands `selectedPriorities`. |
| D-1.4.2 | Empty array means "show all" (subject to default visibility). | WS-1.4 D-2 | Consistent with `selectedCategories`. Array emptiness IS the active signal. |
| D-1.4.3 | Place filter buttons in AlertList header alongside sort controls. | WS-1.4 D-3 | Filter governs the list below it. Co-location follows proximity principle. |
| D-1.4.4 | Client-side filtering (not API-level). | WS-1.4 D-4 | Priority filtering is a view-layer concern. API already returns all items. Instant toggle response. |
| D-1.4.5 | `togglePriority` validates input against `PRIORITY_LEVELS`. | WS-1.4 D-6 | Prevents invalid URL params from entering the store. Silent no-op for invalid input. |
| D-1.4.6 | Active filter overrides `isPriorityVisible()` entirely. | WS-1.4 D-7 | Explicit user selection is an override. Selecting P4 while `isPriorityVisible` hides it would be confusing. |
| D-1.4.7 | Inactive filter uses `'list'` context in AlertList, `'detail'` in dock. | WS-1.4 D-8 | Preserves semantic distinction. District alert list is conceptually a list, even though it lives within a detail-level view. |
| D-1.5.1 | P1 glow uses achromatic white, not severity color. | WS-1.5 D-1 | AD-1 mandate. Severity owns color. White glow = priority signal. Colored glow = recency signal. |
| D-1.5.2 | Use MapLibre `match` expression for radius (not `interpolate` or `step`). | WS-1.5 D-2 | Discrete priority values map to discrete radii. Matches `CIRCLE_COLOR_EXPRESSION` pattern. |
| D-1.5.3 | P1 glow pulse at 4000ms (slower than 3000ms new-alert glow). | WS-1.5 D-3 | Different periods prevent synchronization flashes. Slower reads as "persistent importance" vs faster "something just happened." |
| D-1.5.4 | Extend `useNewAlertAnimation` hook for P1 glow (single rAF loop). | WS-1.5 D-4 | One rAF loop is more efficient than two. Hook already manages lifecycle. |
| D-1.5.5 | Keep ping ring radii fixed (not data-driven by priority). | WS-1.5 D-5 | Per-priority ping layers would add 6 extra layers for a transient 200ms effect. Disproportionate complexity. |
| D-1.5.6 | GeoJSON property named `priority` (not `operationalPriority`). | WS-1.5 D-6 | Shorter names in MapLibre expressions. Translation boundary at `markersToGeoJSON()`. |
| D-1.5.7 | Default missing priority to `'P4'` in GeoJSON properties. | WS-1.5 D-7 | Consistent with WS-0.2 D-4 (unknown = lowest). Results in default radius (6), no glow. |
| D-1.5.8 | Selected highlight ring radius is data-driven with consistent 8px gap. | WS-1.5 D-8 | Fixed-radius ring would "hug" P1 markers (5px gap) while giving P3 markers 8px gap. Consistent gap = consistent affordance. |

## 5. Cross-Workstream Dependencies

```
Phase 0 Deliverables
  WS-0.2 (OperationalPriority type) ──────┐
  WS-0.4 (PriorityBadge component) ────┐  │
                                        │  │
Backend Phase A.5 ──────────────────┐   │  │
                                    │   │  │
                                    v   v  v
                               WS-1.1 (type plumbing)
                                    │
                    ┌───────────────┼───────────────┬───────────────┐
                    v               v               v               v
               WS-1.2           WS-1.3          WS-1.4          WS-1.5
           (card badge)    (district/dock)    (filter store)   (map scaling)
               │                    │
               │                    v
               │            (also needs WS-0.4)
               v
         (also needs WS-0.4)
```

**Detailed dependency table:**

| Upstream | Downstream | What Is Needed | Nature |
|----------|-----------|----------------|--------|
| WS-0.2 | WS-1.1 | `OperationalPriority` type for normalizer type annotations | Hard -- WS-1.1 imports the type in 5 files |
| WS-0.2 | WS-1.4 | `OperationalPriority` type, `PRIORITY_LEVELS` const, `isPriorityVisible()` | Hard -- store state type, filter UI rendering, default visibility logic |
| WS-0.4 | WS-1.2 | `PriorityBadge` component for CategoryCard rendering | Hard -- badge is the visual deliverable |
| WS-0.4 | WS-1.3 | `PriorityBadge` component for AlertList and dock panel | Hard -- badge is the visual deliverable |
| Backend A.5 | WS-1.1 | `operational_priority` field in API responses | Soft -- all normalizers use `?? null` fallback; frontend work can proceed |
| WS-1.1 | WS-1.2 | `operational_priority` on `ApiIntelItem` in `use-coverage-metrics.ts`; `operationalPriority` on `MapMarker`, `IntelFeedItem` | Hard -- counting logic reads the field |
| WS-1.1 | WS-1.3 | `operationalPriority` on `CategoryIntelItem` | Hard -- badge render reads the field |
| WS-1.1 | WS-1.4 | `operationalPriority` on `CategoryIntelItem` | Hard -- filter matches against the field |
| WS-1.1 | WS-1.5 | `operationalPriority` on `MapMarker`, `priority` in GeoJSON properties | Hard -- radius expression reads from GeoJSON |

**Critical path:** WS-0.2 (Phase 0) then WS-1.1 then WS-1.2 (longest workstream at Size M). WS-1.3, WS-1.4, and WS-1.5 can execute in parallel with WS-1.2 once WS-1.1 merges.

**Inter-phase gates:** Phase 0 must be complete before any Phase 1 workstream begins. Backend Phase A.5 is a soft gate -- frontend work proceeds with null data, but visual verification requires live priority values.

## 6. Consolidated Open Questions (flag which are blocking)

| ID | Question | Source SOW | Blocking? | Owner |
|----|----------|-----------|-----------|-------|
| OQ-1.1 | What is the exact casing of backend `operational_priority` values -- `'P1'` (uppercase) or `'p1'` (lowercase)? If lowercase, normalization is needed in every hook normalizer. Also flagged as WS-0.2 OQ-2. | WS-1.1 OQ-1 | Yes (WS-1.1) | Backend team |
| OQ-1.2 | Does `/console/coverage/map-data` GeoJSON include `operational_priority` in feature properties? Backend must add it to the property set alongside `id`, `title`, `severity`, `category`, `source_key`, `ingested_at`. | WS-1.1 OQ-2 | Yes (WS-1.1) | Backend team |
| OQ-1.3 | Does `/console/bundles` return `operational_priority` as a top-level aggregate field per bundle, or must it be derived from member items? SOW assumes top-level. | WS-1.1 OQ-3 | No (design alternative exists) | Backend team |
| OQ-1.4 | Should `emptyMetrics()` be updated? It returns `CoverageMetrics` with `byCategory: []` so no `CoverageByCategory` objects need zero-fill. | WS-1.1 OQ-4 | No | react-developer |
| OQ-1.5 | Should the `/console/intel?limit=1000` limit be increased, or should the backend add `p1_count`/`p2_count` to `/console/coverage`? Card-level counts are approximate with the current 1000-item cap. | WS-1.2 OQ-1 | No (monitor in production) | Backend team / react-developer |
| OQ-1.6 | Should the P1 pulse animation on CategoryCard badges be suppressed to avoid visual noise when multiple cards pulse simultaneously in a 9-card grid? | WS-1.2 OQ-2 | No (evaluate during integration) | UX / react-developer |
| OQ-1.7 | When `/console/intel` returns items with `operational_priority: null`, should those be counted toward `alertCount` but excluded from `p1Count`/`p2Count`? Or assigned a default (e.g., P4)? | WS-1.2 OQ-3 | No (clarify at WS-1.1 time) | react-developer / Backend team |
| OQ-1.8 | Is the `operationalPriority` field on `CategoryIntelItem` typed as `OperationalPriority` (always present) or `OperationalPriority \| null`? Determines whether null guards are needed around PriorityBadge renders. | WS-1.3 OQ-1 | Yes (WS-1.3) -- resolved by reading WS-1.1 (answer: `\| null`) | WS-1.1 implementer |
| OQ-1.9 | Should P1 pulse animation in AlertList rows be disabled when many P1 items are visible simultaneously? | WS-1.3 OQ-2 | No (evaluate during integration) | UX advisory |
| OQ-1.10 | Should priority filter also apply to the map and severity chart within district view, or only the alert list? | WS-1.4 OQ-1 | No (scoped to alert list for now) | react-developer |
| OQ-1.11 | Should priority filter persist when navigating between districts? Currently in global store so it persists by default. | WS-1.4 OQ-2 | No (UX review needed) | react-developer |
| OQ-1.12 | Should filter buttons show per-priority item counts (e.g., "P1 (3)")? | WS-1.4 OQ-3 | No | react-developer |
| OQ-1.13 | Should `isPriorityVisible` use `'detail'` context for district AlertList since district view is semantically detail-level? D-1.4.7 uses `'list'` context. | WS-1.4 OQ-4 | No | react-developer |
| OQ-1.14 | Should the P1 glow be visible in `overview` map mode (global view, no auto-fit)? Could serve as a "something important" beacon, or could be dimmed with everything else. | WS-1.5 OQ-2 | No | react-developer + UX |
| OQ-1.15 | Should clusters containing P1 markers receive visual treatment (glow or badge)? Deferred as out of scope but would make P1 presence discoverable before zooming in. | WS-1.5 OQ-3 | No (post-Phase 1) | UX / react-developer |

**Summary:** Two blocking questions (OQ-1.1 and OQ-1.2) require backend team input before WS-1.1 implementation. OQ-1.8 is resolved by WS-1.1's deliverables (the field is `OperationalPriority | null`). All other questions are non-blocking and can be resolved during implementation or deferred to integration testing.

## 7. Phase Exit Criteria

| Criterion | Met? | Evidence |
|-----------|------|----------|
| `operationalPriority` field exists on `IntelFeedItem`, `CategoryIntelItem`, `MapMarker`, `BundleWithDecision`, and `MarkerFeatureCollection` properties. | Pending | WS-1.1 AC-1 through AC-14: `pnpm typecheck` passes; code review of all 7 modified files. |
| API normalizers map `operational_priority` to `operationalPriority` with `?? null` fallback. Missing field does not crash. | Pending | WS-1.1 AC-18: Manual test against a backend without the field. |
| `CoverageByCategory` includes `p1Count: number` and `p2Count: number`. | Pending | WS-1.2 AC-1: `pnpm typecheck` passes. |
| `CategoryCard` renders PriorityBadge in top-right corner when `p1Count + p2Count > 0`. | Pending | WS-1.2 AC-5, AC-6: Visual inspection -- badge present with priority data, absent without. |
| Priority badge is achromatic on CategoryCard (no color channel). | Pending | WS-1.2 AC-13: No hue values in badge or count text rendering. |
| Alert rows in district AlertList display PriorityBadge between severity badge and title. P3/P4 rows show no badge (no gap). | Pending | WS-1.3 AC-1, AC-2, AC-8: Visual inspection in district view. |
| INSPECT dock panel shows PriorityBadge with label for all priority levels. | Pending | WS-1.3 AC-4, AC-6, AC-7: Click alert, verify badge and label in dock. |
| `selectedPriorities: OperationalPriority[]` exists on coverage store, initialized to `[]`. | Pending | WS-1.4 AC-1: Store inspection in React DevTools. |
| Priority filter buttons appear in AlertList header; toggling filters the list. | Pending | WS-1.4 AC-9, AC-11: Visual and interaction test. |
| URL sync reads `?priority=P1&priority=P2` and writes them on filter change. | Pending | WS-1.4 AC-6, AC-7: Manual test with URL params. |
| P4 items appear when P4 filter is explicitly selected despite `defaultVisibility: 'filter-only'`. | Pending | WS-1.4 AC-13: Toggle P4 on, verify items visible. |
| P1 map markers render at radius 9, P2 at 7.5, P3/P4 at 6. | Pending | WS-1.5 AC-1, AC-2, AC-3: Visual inspection; MapLibre DevTools. |
| P1 markers display achromatic white glow with 4-second breathing pulse. | Pending | WS-1.5 AC-5, AC-6: Visual inspection -- glow is white, not severity-colored. |
| Marker color remains severity-driven for all priority levels. | Pending | WS-1.5 AC-8: Compare P1-Extreme (red, large) vs P3-Extreme (red, default size). |
| Selected highlight ring maintains visible gap around P1 markers. | Pending | WS-1.5 AC-11: Click P1 marker, verify ring outside dot. |
| No rAF loop runs when zero P1 markers and zero new-alert markers exist. | Pending | WS-1.5 AC-13: DevTools Performance panel. |
| `pnpm typecheck` passes with zero errors across the full project. | Pending | All SOWs: TypeScript compiler exit code 0. |
| `pnpm build` completes without errors. | Pending | All SOWs: Build pipeline exit code 0. |
| No existing UI behavior regresses -- grid loads, map renders, feed panel shows items, district view functions. | Pending | WS-1.1 AC-17: Manual smoke test of all surfaces. |

## 8. Inputs Required by Next Phase

Phase 2 (P1/P2 Feed & Real-Time Notifications) and Phase 3 (Search Integration) consume the following Phase 1 deliverables:

| Deliverable | File | Consuming Workstream(s) | What They Need It For |
|-------------|------|------------------------|----------------------|
| `operationalPriority` on `IntelFeedItem` | `src/hooks/use-intel-feed.ts` | WS-2.1 (priority feed hook), WS-2.2 (feed strip), WS-2.3 (feed panel) | Filter P1/P2 items from the general intel feed for the priority-specific surface |
| `operationalPriority` on `MapMarker` | `src/lib/coverage-utils.ts` | WS-2.2 (feed strip map integration) | Display priority on map markers referenced from feed items |
| `p1Count`/`p2Count` on `CoverageByCategory` | `src/lib/coverage-utils.ts` | WS-2.2 (feed strip count display) | Total P1/P2 counts for the strip's summary line |
| `PriorityBadge` integration pattern (card, list, dock) | `CategoryCard.tsx`, `CategoryDetailScene.tsx`, `district-view-dock.tsx` | WS-2.2, WS-2.3, WS-3.2 | Established rendering pattern for priority badges in new surfaces (feed strip, feed panel, search results) |
| `selectedPriorities` store state + URL sync | `coverage.store.ts` | WS-2.3 (feed panel filtering) | Users may want to filter the priority feed panel by specific level |
| `CIRCLE_RADIUS_EXPRESSION` and P1 glow layer | `map-utils.ts`, `MapMarkerLayer.tsx` | WS-2.4 (realtime priority alerts on map) | New P1 arrivals must render with the established priority-scaled appearance |
| Priority filter interaction model (D-1.4.6, D-1.4.7) | `coverage.store.ts` | WS-3.3 (search result navigation) | Search result clicks navigate to district; the filter state must not hide the target alert |

## 9. Gaps and Recommendations

### Gap 1: WS-1.1 Scope Does Not Cover `use-coverage-metrics.ts`

WS-1.1 extends `ApiIntelItem` in four hooks but not in `use-coverage-metrics.ts`. WS-1.2 depends on `operational_priority` being available on the `ApiIntelItem` in that file to count P1/P2 alerts per category.

The current `ApiIntelItem` in `use-coverage-metrics.ts` uses `[key: string]: unknown`, which allows runtime access to `item.operational_priority` -- but TypeScript treats the value as `unknown`, requiring an explicit type assertion or narrowing. WS-1.2's counting logic (`if (item.operational_priority === 'P1')`) would need the `unknown` comparison to work, which TypeScript allows for equality checks.

**Recommendation (CTA):** Extend WS-1.1 scope to explicitly add `operational_priority: string | null` to the `ApiIntelItem` interface in `use-coverage-metrics.ts`. This is a 1-line change that maintains the principle that all API type extensions are consolidated in WS-1.1. Add this as deliverable 4.8 in the WS-1.1 SOW.

### Gap 2: WS-1.3 Uses Wrong Field Name

As documented in Conflict 1 (Section 3), WS-1.3 consistently refers to `item.priority` rather than `item.operationalPriority`. The code snippets in Sections 4.1 and 4.2 will not compile as written.

**Recommendation (STW):** Update WS-1.3 Sections 4.1, 4.2, and all code snippets to use `item.operationalPriority` before implementation begins. The implementer should cross-reference WS-1.1 Section 4.2.2 to confirm the field name.

### Gap 3: GeoJSON Property Name Must Be Agreed

Conflict 2 (Section 3) documents the `operationalPriority` vs `priority` disagreement between WS-1.1 and WS-1.5 for the GeoJSON property name.

**Recommendation (CTA):** Adopt `priority` (WS-1.5 D-6) as the canonical GeoJSON property name. Update WS-1.1 Section 4.6 (`MarkerFeatureCollection` properties and `markersToGeoJSON`) to use `priority: string | null` instead of `operationalPriority: string | null`. The mapping from `marker.operationalPriority` to GeoJSON `priority` is the correct translation at this boundary.

### Gap 4: No Test Infrastructure for Priority Counting Logic

WS-1.2 introduces non-trivial counting logic (the `CategoryPriorityCounts` loop) and WS-1.4 introduces store actions with validation (`togglePriority` input guard). Both would benefit from unit tests, but Phase 0 Gap 1 identified that `pnpm test:unit` is not configured.

**Recommendation (PMO):** If Vitest was not set up during Phase 0, the priority counting logic and store actions should be verified via `pnpm typecheck` and manual testing. If Vitest was set up (per Phase 0 Gap 1 recommendation), add targeted unit tests for: (a) `CategoryPriorityCounts` derivation with mixed priority values including `null`, (b) `togglePriority` with valid and invalid inputs, (c) `syncCoverageFromUrl` with `?priority=P1&priority=P5`.

### Gap 5: Priority Filter Does Not Apply to Map Markers

WS-1.4 explicitly scopes filtering to the district view alert list (Section 2, Out of Scope: "Map marker filtering by priority ... belongs in a follow-up workstream"). This means a user who filters to "P1 only" in the alert list still sees all priority levels on the map within the district view. This creates a UX inconsistency.

**Recommendation (SPO):** Accept this inconsistency for Phase 1. Map marker filtering requires reading `selectedPriorities` in `MapMarkerLayer` and adding a filter expression to the unclustered point layer -- a small change, but it expands WS-1.4's blast radius to include the map rendering pipeline. If user testing reveals confusion, add a follow-up workstream (WS-1.6) that applies `selectedPriorities` as a MapLibre filter expression on the unclustered point layer.

### Gap 6: Multiple Animation Sources May Create Visual Overload

Three animation sources can be active simultaneously on the map: the existing new-alert glow/ping (3000ms/2500ms), the P1 priority glow (4000ms), and the P1 PriorityBadge pulse (2500ms CSS animation on cards). WS-1.2 OQ-2 and WS-1.3 OQ-2 both flag this concern but defer evaluation to integration testing.

**Recommendation (SPO):** During Phase 1 integration testing, intentionally create a scenario with multiple P1 markers (some new, some not) and multiple CategoryCards with P1 badges. Evaluate whether the combined animation load is distracting. If so, consider: (a) suppressing the PriorityBadge pulse at `size="sm"` (list rows), (b) suppressing the PriorityBadge pulse at `size="md"` (cards), or (c) adding a user preference toggle for priority animations.

### Gap 7: No Visual Regression Baseline for Phase 1

Phase 0 Overview recommended capturing screenshots before and after each workstream (Phase 0 Gap 5). The same practice should continue for Phase 1, which modifies more surfaces (cards, lists, dock, map).

**Recommendation (STW):** Capture screenshots of: (a) CategoryCard with and without priority alerts, (b) AlertList rows showing P1, P2, P3, P4, and null-priority items, (c) INSPECT dock panel for each priority level, (d) map with P1 markers (glow + size) alongside P3 markers, (e) district view with priority filter buttons active. Store in `docs/plans/summaries-and-more/phase-1-priority-badges/visual-verification/`.

### Gap 8: WS-1.4 Filter Persistence Across Districts

WS-1.4 OQ-2 flags that `selectedPriorities` is in the global coverage store and will persist when navigating between districts. WS-1.4 R-5 argues this is "arguably correct behavior" but acknowledges it may confuse users.

**Recommendation (SPO):** For Phase 1, accept persistence as the default. The filter state is visible in the UI (active button styling), so it is not invisible state. If user testing reveals confusion, add `clearPriorities()` to the morph reverse flow (when leaving a district). This is a single function call in `useMorphChoreography` and does not require architectural changes.

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream | Size | Estimated Effort | Complexity Assessment |
|------------|------|-----------------|----------------------|
| WS-1.1 | S | 60--90 minutes | Low. Mechanical type additions and normalizer mappings across 7 files. No logic changes. The most tedious workstream (14 individual edits) but each edit is trivial. |
| WS-1.2 | M | 2--3 hours | Medium. Extends the data derivation loop, modifies the `CoverageByCategory` type (which propagates to 3 zero-fill sites), and adds badge rendering to `CategoryCard` with layout, accessibility, and hover interaction considerations. Most complex workstream in Phase 1. |
| WS-1.3 | S | 30--45 minutes | Low. Two files, approximately 6 lines of JSX additions total. Consumes patterns established by WS-0.4 and WS-1.1. |
| WS-1.4 | S | 90--120 minutes | Medium-Low. Store state and actions follow the established pattern (minimal design decisions), but the filter UI in AlertList and the `isPriorityVisible` interaction rule require care. URL sync is mechanical. |
| WS-1.5 | S | 90--120 minutes | Medium. MapLibre expression authoring, GeoJSON property threading, rAF animation extension, and 3 data-driven layer paint properties. Requires familiarity with MapLibre GL API. |
| **Total** | **1M + 4S** | **6--8 hours** | Aligns with combined-recommendations estimate of "2--3 days" when accounting for context switching, verification, and conflict resolution time. |

### Resource Loading

All five workstreams are assigned to `react-developer`. No resource contention since there is one assignee. The backend team is needed for OQ-1.1 and OQ-1.2 resolution before WS-1.1 begins -- this should be proactively requested.

### Recommended Execution Sequence

```
Prerequisite: Phase 0 complete + OQ-1.1/OQ-1.2 resolved

Day 1 (morning):
  1. WS-1.1 — type plumbing (critical path)
     - Include scope extension for use-coverage-metrics.ts (Gap 1)
     - Use `priority` as GeoJSON property name (Gap 3)
     - pnpm typecheck + pnpm build + smoke test

Day 1 (afternoon):
  2. WS-1.3 — district/dock badge wiring (smallest, fast win)
     - Use operationalPriority field name (Gap 2 resolved)
     - pnpm typecheck + visual verification
  3. WS-1.4 — priority filter in store
     - Store state + actions + URL sync
     - Filter UI in AlertList header
     - pnpm typecheck + manual filter test

Day 2 (morning):
  4. WS-1.2 — CategoryCard priority counts and badge (largest workstream)
     - Type extension + derivation logic + zero-fills
     - Badge rendering + accessibility
     - pnpm typecheck + pnpm build + visual verification

Day 2 (afternoon):
  5. WS-1.5 — map marker scaling and glow
     - CIRCLE_RADIUS_EXPRESSION + P1 glow layer
     - Animation extension + highlight ring scaling
     - pnpm typecheck + pnpm build + map visual verification

Day 2 (end):
  6. Integration verification
     - All surfaces show priority correctly
     - Animation evaluation (Gap 6)
     - Screenshot capture (Gap 7)
     - Phase 1 exit criteria checklist
```

**Rationale for ordering:**
- WS-1.1 first: critical path, blocks everything.
- WS-1.3 before WS-1.2: smaller scope, provides fast visual feedback that priority data is flowing. Validates the WS-1.1 type plumbing in a consumer context.
- WS-1.4 before WS-1.2: the filter store is infrastructure that WS-1.2's testing may benefit from (filter to P1-only to verify card badge rendering).
- WS-1.2 and WS-1.5 last: the two most complex workstreams. WS-1.2 is the only Size M. WS-1.5 touches the map animation pipeline, which benefits from having all other pieces stable.

### Parallel Execution (if two developers available)

```
Developer A:  [WS-1.1] → [WS-1.2] → [integration]
Developer B:            → [WS-1.3 + WS-1.4] → [WS-1.5] → [integration]
```

Both tracks depend on WS-1.1 completing. With two developers, wall-clock time reduces to approximately 4--5 hours after WS-1.1 merges.

### Bottleneck Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OQ-1.1 (backend field casing) not resolved before implementation | Medium | High -- affects all 5 workstreams | Contact backend team proactively. If unresolved, implement with `'P1'` assumption and add a `toUpperCase()` normalization guard in WS-1.1 normalizers as a precaution. |
| WS-0.2 or WS-0.4 from Phase 0 incomplete | Low | High -- blocks all of Phase 1 | Phase 0 was estimated at 1 day. Verify completion before starting Phase 1. |
| Backend Phase A.5 not ready for visual verification | Medium | Low -- frontend works with null data | All SOWs have null-safety strategies. Verification can use browser DevTools to inject mock `operational_priority` values into API responses. |
| WS-1.5 MapLibre animation complexity exceeds estimate | Medium | Medium -- delays the last workstream | WS-1.5's animation extension (Option A: extend `useNewAlertAnimation`) is well-scoped. If complex, fall back to Option B (separate hook) which is simpler but less efficient. |
| Multiple P1 pulse animations create visual noise | Medium | Medium -- UX quality issue | Defer to integration testing. Severity: aesthetic, not functional. Solutions are simple (suppress animation at specific sizes). |
