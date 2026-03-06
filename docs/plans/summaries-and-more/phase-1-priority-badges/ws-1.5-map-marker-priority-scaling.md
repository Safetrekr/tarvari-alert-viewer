# WS-1.5: Map Marker Priority Scaling

> **Workstream ID:** WS-1.5
> **Phase:** 1 -- Priority Badges
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-1.1 (MapMarker has priority field)
> **Blocks:** None
> **Resolves:** None

## 1. Objective

Make operational priority visually distinguishable on map markers through size scaling and a P1-specific glow effect, without altering the severity-driven color channel. After this workstream, a protective intelligence professional scanning the CoverageMap can pre-attentively identify P1 markers (larger, glowing) and P2 markers (slightly larger) among the default-sized P3/P4 population -- using size as the priority signal and color as the severity signal, exactly as AD-1 specifies.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `CIRCLE_RADIUS_EXPRESSION` | New MapLibre `match` expression in `map-utils.ts` that reads `priority` from GeoJSON feature properties and returns the appropriate circle radius: P1 = 9, P2 = 7.5, P3/P4/fallback = 6. |
| GeoJSON `priority` property | Add `priority` to the `MarkerFeatureCollection` feature properties interface and to the `markersToGeoJSON()` conversion function in `map-utils.ts`. |
| `unclusteredPointLayer` radius update | Replace the hardcoded `'circle-radius': 6` in the unclustered point layer definition with the new `CIRCLE_RADIUS_EXPRESSION`. |
| P1 priority glow layer | New MapLibre circle layer rendered behind the unclustered point layer, filtered to `priority === 'P1'`, providing an achromatic (white) blurred glow effect to reinforce P1 prominence. |
| P1 glow animation | rAF-driven subtle pulse animation on the P1 glow layer (breathing opacity), consistent with `PriorityMeta.animation = 'pulse'` from WS-0.2. |
| New-alert effect radius scaling | Update the existing new-alert glow and ping layers so their base radius adapts to the marker's priority-scaled size, preventing visual misalignment where a large P1 dot sits inside a glow ring sized for a default-6 marker. |
| Selected highlight ring scaling | Update the selected-alert highlight ring radius to accommodate the largest marker size (P1 at 9), ensuring the highlight ring remains visibly outside the marker circle for all priority levels. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Marker color changes for priority | Explicitly prohibited by AD-1. Color remains severity-driven via `CIRCLE_COLOR_EXPRESSION`. |
| `MapMarker` type extension | WS-1.1 adds the `operationalPriority` field to `MapMarker` in `coverage-utils.ts` and updates the API normalizers. This workstream consumes that field. |
| `OperationalPriority` type definition | WS-0.2 defines the type. This workstream imports and uses it. |
| Priority filtering on the map | WS-1.4 adds `selectedPriorities` to the coverage store. Map filtering based on priority is a WS-1.4 concern, not a WS-1.5 concern. |
| Cluster radius scaling by priority | Clusters aggregate multiple markers and display a count. Priority-based cluster sizing would require aggregation logic (e.g., "cluster contains at least one P1") that adds significant complexity for marginal benefit. Defer unless user feedback requests it. |
| Map popup priority display | WS-1.3 handles wiring priority into the INSPECT/detail surfaces. The MapPopup component is updated there, not here. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-1.1 | `MapMarker` type extended with `operationalPriority: OperationalPriority` field. API normalizers in `use-coverage-map-data.ts` populate the field from the API response's `operational_priority`. | Pending -- WS-1.1 must complete first |
| WS-0.2 | `OperationalPriority` type (`'P1' \| 'P2' \| 'P3' \| 'P4'`), `PRIORITY_META` constant with `animation: 'pulse' \| null` metadata | Pending -- WS-0.2 must complete first |
| `src/components/coverage/map-utils.ts` | Current file structure: `markersToGeoJSON()`, `MarkerFeatureCollection`, `CIRCLE_COLOR_EXPRESSION`, severity color constants | Available -- reviewed |
| `src/components/coverage/MapMarkerLayer.tsx` | Current layer definitions, `useNewAlertAnimation` hook, source/layer ID constants, layer ordering | Available -- reviewed |
| AD-1 | Priority uses achromatic visual channel (shape, weight, size, animation). Color is reserved for severity. | Confirmed |

## 4. Deliverables

### 4.1 Add `priority` to GeoJSON Feature Properties

**File:** `src/components/coverage/map-utils.ts`

The `MarkerFeatureCollection` interface defines the shape of GeoJSON feature properties. Add `priority` as a string property (MapLibre expressions operate on raw JSON values, not TypeScript unions).

Current `properties` shape (lines 54-63):

```
properties: {
  id: string
  title: string
  severity: string
  category: string
  sourceId: string
  ingestedAt: string
  isNew: boolean
}
```

Add after `isNew`:

```
properties: {
  id: string
  title: string
  severity: string
  category: string
  sourceId: string
  ingestedAt: string
  isNew: boolean
  priority: string  // OperationalPriority value ('P1'|'P2'|'P3'|'P4')
}
```

Update `markersToGeoJSON()` to carry the field through from the `MapMarker` input. After WS-1.1, `MapMarker` will have an `operationalPriority` field. The GeoJSON property should be named `priority` (shorter, since it lives in a flat JSON properties bag that MapLibre reads at render time).

```
properties: {
  ...existing fields,
  priority: marker.operationalPriority ?? 'P4',
}
```

**Fallback:** Default to `'P4'` when priority is missing or undefined. This matches the conservative fallback established in WS-0.2 (D-4) -- unknown priority = lowest = default visual treatment.

### 4.2 `CIRCLE_RADIUS_EXPRESSION` — Priority-Based Radius

**File:** `src/components/coverage/map-utils.ts`

A data-driven MapLibre `match` expression that maps the `priority` feature property to a circle radius value. This parallels the existing `CIRCLE_COLOR_EXPRESSION` pattern but reads `priority` instead of `severity` and returns numbers (radii) instead of strings (colors).

```
CIRCLE_RADIUS_EXPRESSION = [
  'match',
  ['get', 'priority'],
  'P1', 9,
  'P2', 7.5,
  'P3', 6,
  'P4', 6,
  6,  // fallback for unknown/missing priority
] as const
```

**Radius values and rationale:**

| Priority | Radius | Relative to Default | Visual Effect |
|----------|--------|---------------------|---------------|
| P1 | 9 | 1.5x | Clearly larger. Combined with the P1 glow, these markers are impossible to miss. Area is 2.25x default (pi*r^2 scaling). |
| P2 | 7.5 | 1.25x | Noticeably larger than default but clearly smaller than P1. Area is ~1.56x default. |
| P3 | 6 | 1.0x (default) | No size change. Standard marker appearance. |
| P4 | 6 | 1.0x (default) | No size change. P4 markers are already de-emphasized by being invisible-by-default (WS-1.4 filter). |
| Fallback | 6 | 1.0x (default) | Unknown or missing priority gets default treatment. |

**Export as a named constant** so it can be referenced by other layers (e.g., the P1 glow layer needs to know the P1 radius for proportional glow sizing).

### 4.3 Priority Radius Constants

**File:** `src/components/coverage/map-utils.ts`

Export individual radius constants alongside the expression for use in the P1 glow layer and new-alert effect scaling:

```
PRIORITY_RADIUS_P1 = 9
PRIORITY_RADIUS_P2 = 7.5
PRIORITY_RADIUS_DEFAULT = 6
```

These are referenced by the glow and animation layers in MapMarkerLayer.tsx, which need concrete numbers (not MapLibre expressions) for rAF animation calculations.

### 4.4 Apply `CIRCLE_RADIUS_EXPRESSION` to Unclustered Point Layer

**File:** `src/components/coverage/MapMarkerLayer.tsx`

Replace the hardcoded `'circle-radius': 6` in the `unclusteredPointLayer` definition (line 147) with the imported `CIRCLE_RADIUS_EXPRESSION`:

Current:
```
paint: {
  'circle-color': CIRCLE_COLOR_EXPRESSION as any,
  'circle-radius': 6,
  ...
}
```

Updated:
```
paint: {
  'circle-color': CIRCLE_COLOR_EXPRESSION as any,
  'circle-radius': CIRCLE_RADIUS_EXPRESSION as any,
  ...
}
```

### 4.5 P1 Priority Glow Layer

**File:** `src/components/coverage/MapMarkerLayer.tsx`

A new MapLibre circle layer that renders a blurred, achromatic (white) glow behind P1 markers. This is the priority-specific glow -- distinct from the existing new-alert glow which is severity-colored and recency-based.

**Layer ID:** `'p1-priority-glow'`

**Filter:** `['all', ['!', ['has', 'point_count']], ['==', ['get', 'priority'], 'P1']]`

This filter selects only unclustered points where `priority === 'P1'`.

**Paint properties:**

| Property | Value | Rationale |
|----------|-------|-----------|
| `circle-color` | `'rgba(255, 255, 255, 0.6)'` | White/achromatic per AD-1. Priority must not use the severity color channel. |
| `circle-radius` | `16` | Approximately 1.8x the P1 marker radius (9). Provides a visible halo without overwhelming nearby markers. |
| `circle-opacity` | `0.12` | Initial opacity. Animated via rAF to produce a subtle breathing pulse. |
| `circle-blur` | `0.7` | Softens the edge to produce a true glow effect rather than a sharp ring. |

**Layer order:** Rendered before the new-alert glow layers and before the unclustered point layer. The P1 priority glow sits behind everything except clusters:

```
cluster → cluster-count → P1-priority-glow → new-alert-glow → ping-1 → ping-2 → unclustered-point → selected-highlight
```

**Design rationale for achromatic glow:** AD-1 mandates that priority uses the achromatic visual channel. The existing new-alert glow uses `CIRCLE_COLOR_EXPRESSION` (severity-colored) because it signals recency, not priority. The P1 priority glow uses white to maintain channel separation. When a P1 marker is also new, both glows are visible simultaneously: the white priority glow sits behind the severity-colored new-alert glow, creating a layered halo that correctly encodes both dimensions.

### 4.6 P1 Glow Animation

**File:** `src/components/coverage/MapMarkerLayer.tsx`

Extend the existing `useNewAlertAnimation` hook (or create a parallel `useP1GlowAnimation` hook) to animate the P1 priority glow layer's opacity with a slow pulse.

**Animation parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Cycle duration | 4000ms | Slower than the new-alert glow (3000ms) to produce a calm, authoritative pulse rather than an anxious flicker. The two cycles being different periods prevents them from syncing and creating a combined "flash" effect. |
| Opacity range | 0.06 -- 0.18 | Subtle. The glow is always faintly visible (never fully transparent), which distinguishes it from the new-alert glow that can dip to near-zero. |
| Easing | Sinusoidal (`Math.sin`) | Matches the existing glow animation approach. |

**Implementation approach -- two options:**

**Option A (recommended): Extend `useNewAlertAnimation`** to also animate the P1 glow layer. The hook already runs a rAF loop when there are new alerts. Add a `hasP1Markers` boolean parameter. When true, the same rAF loop drives the P1 glow animation alongside the new-alert effects. When neither `hasNewAlerts` nor `hasP1Markers` is true, no rAF loop runs.

**Option B: Separate hook.** Create `useP1GlowAnimation(hasP1: boolean)` as an independent hook. Simpler isolation but runs a second rAF loop when both are active, which is wasteful.

Recommend Option A for animation frame efficiency.

### 4.7 New-Alert Effect Radius Scaling

**File:** `src/components/coverage/MapMarkerLayer.tsx`

The existing new-alert glow and ping rings use hardcoded radii that assume a marker radius of 6:

- `newGlowLayer`: `'circle-radius': 14` (static)
- Ping rings: `PING_MIN_RADIUS = 6`, `PING_MAX_RADIUS = 28`

With priority scaling, a P1 marker at radius 9 would have its new-alert glow (radius 14) barely extending beyond the dot, and the ping rings would originate from inside the dot rather than from its edge.

**Solution:** Make the new-alert glow and ping layers use data-driven radius expressions that scale proportionally to the marker's priority radius.

**New-alert glow radius expression:**

The current static `14` is approximately `6 * 2.33`. Apply the same ratio to priority radii:

```
NEW_GLOW_RADIUS_EXPRESSION = [
  'match',
  ['get', 'priority'],
  'P1', 21,    // 9 * 2.33
  'P2', 17.5,  // 7.5 * 2.33
  14,           // default (6 * 2.33)
] as const
```

**Ping ring scaling:** The rAF animation interpolates between `PING_MIN_RADIUS` and `PING_MAX_RADIUS`. These are currently fixed at 6 and 28. Two approaches:

**Approach A (simpler, recommended):** Keep the ping ring radii fixed at their current values. The ping rings are expanding outward animations that quickly grow beyond any marker size. The visual mismatch is only momentary (at the start of each ping cycle) and is unlikely to be noticeable.

**Approach B (precise):** Read each marker's priority at animation time and set per-feature ping radii. This would require switching from the current global `setPaintProperty` approach to per-feature styling, which MapLibre does not support for animated properties. The workaround (multiple layers filtered by priority, each with different ping parameters) adds significant complexity for negligible visual improvement.

**Recommendation:** Use Approach A (fixed ping radii) and only apply data-driven scaling to the static new-alert glow radius. If QA reveals a visual mismatch, revisit.

### 4.8 Selected Highlight Ring Scaling

**File:** `src/components/coverage/MapMarkerLayer.tsx`

The `selectedHighlightLayer` uses a fixed `'circle-radius': 14` and `'circle-stroke-width': 2`. With P1 markers at radius 9, the highlight ring (radius 14) would still be visually outside the marker, but the gap narrows from 8px to 5px.

**Recommendation:** Increase the selected highlight ring radius slightly to maintain a consistent visual gap across all priority levels. Use a data-driven expression:

```
SELECTED_RING_RADIUS_EXPRESSION = [
  'match',
  ['get', 'priority'],
  'P1', 17,   // 9 + 8
  'P2', 15.5, // 7.5 + 8
  14,          // 6 + 8
] as const
```

This maintains a consistent 8px gap between the marker edge and the highlight ring for all priority levels.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | P1 markers render at circle radius 9 on the map | Visual inspection; MapLibre DevTools paint property inspection |
| AC-2 | P2 markers render at circle radius 7.5 on the map | Visual inspection |
| AC-3 | P3 and P4 markers render at circle radius 6 (unchanged from current default) | Visual inspection; confirm no regression for standard markers |
| AC-4 | Markers with missing or unknown priority render at radius 6 (fallback) | Load map data with `priority: undefined` or `priority: 'unknown'`; verify default radius |
| AC-5 | P1 markers display an achromatic (white) glow halo behind the severity-colored dot | Visual inspection; verify glow color is white, not severity-colored |
| AC-6 | P1 glow pulses with a slow breathing animation | Visual inspection; verify opacity oscillation over ~4 second cycle |
| AC-7 | P1 glow is visible regardless of whether the marker is "new" (within 5-minute threshold) | Test with P1 markers older than 5 minutes; verify glow is still present |
| AC-8 | Marker color remains severity-driven for all priority levels | Compare P1-Extreme (red, large) vs P3-Extreme (red, default size); color must be identical, only size differs |
| AC-9 | When a P1 marker is also "new", both the achromatic priority glow and the severity-colored new-alert glow are visible simultaneously | Test with a P1 marker ingested within the last 5 minutes; verify layered halo effect |
| AC-10 | The `priority` property is present in GeoJSON feature properties for all markers | `console.log` or MapLibre inspection of source data |
| AC-11 | Selected-alert highlight ring maintains a visible gap around P1 markers | Click a P1 marker; verify the highlight ring does not overlap the marker circle |
| AC-12 | New-alert glow radius scales proportionally for P1 and P2 markers | Observe a new P1 marker; glow ring should extend well beyond the 9px dot, not clip it |
| AC-13 | No rAF animation loop runs when there are zero P1 markers and zero new-alert markers | DevTools Performance panel; verify no continuous animation frames when data has only P3/P4 non-new markers |
| AC-14 | `pnpm typecheck` passes with zero errors | `pnpm typecheck` |
| AC-15 | `pnpm build` succeeds | `pnpm build` |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | P1 glow uses achromatic white (`rgba(255,255,255,0.6)`) rather than severity color | AD-1 mandates priority uses the achromatic visual channel. Severity owns color. Using a white glow for priority and a severity-colored glow for recency maintains clean channel separation. A user can distinguish "this is important (white glow = P1)" from "this is fresh (colored glow = new)" at a glance. | Severity-colored glow -- visually cohesive but violates AD-1 and creates ambiguity with the existing new-alert glow. Gray glow -- too subtle on the dark basemap. |
| D-2 | Use a MapLibre `match` expression for radius (not `interpolate` or `step`) | `match` maps discrete priority values to discrete radii. There are exactly four priority levels with specific radius targets. `interpolate` is for continuous numeric inputs. `step` could work but `match` on string labels is more readable and matches the `CIRCLE_COLOR_EXPRESSION` pattern. | `step` expression with numeric sortOrder -- would require converting priority to a number in GeoJSON properties, adding a mapping layer. `interpolate` -- priority is categorical, not continuous. |
| D-3 | P1 glow pulse cycle is 4000ms (slower than the 3000ms new-alert glow) | Different cycle periods prevent the two glows from synchronizing, which would create a combined "flash" that's visually jarring and semantically confusing (it would look like a single signal rather than two independent signals). The slower P1 pulse reads as "authoritative, persistent importance" versus the faster new-alert glow's "something just happened." | Same cycle (3000ms) -- creates periodic sync flashes. Faster P1 pulse (2000ms) -- P1 glow would feel more urgent than new-alert glow, confusing the hierarchy (recency should feel more "active"). |
| D-4 | Extend `useNewAlertAnimation` to include P1 glow animation rather than creating a separate hook | One rAF loop is more efficient than two. The existing hook already manages the lifecycle (start/stop based on data presence, cleanup on unmount). Adding a `hasP1Markers` input parameter is a minimal change. | Separate `useP1GlowAnimation` hook -- cleaner separation of concerns but doubles rAF overhead when both are active. Acceptable if the combined hook becomes unwieldy. |
| D-5 | Keep ping ring radii fixed (not data-driven by priority) | MapLibre's `setPaintProperty` sets values globally per layer, not per feature. Making ping rings priority-aware would require creating separate layers per priority level (3 layers x 2 rings = 6 extra layers), which is disproportionate complexity for a transient animation that quickly expands beyond any marker size. | Per-priority ping layers -- architecturally clean but adds 6 layers for a subtle effect visible for ~200ms per ping cycle. |
| D-6 | Name the GeoJSON property `priority` (not `operationalPriority`) | GeoJSON properties are a flat JSON bag read by MapLibre expressions. Shorter names reduce noise in expression definitions. The full `operationalPriority` name lives on the TypeScript `MapMarker` interface (WS-1.1); the mapping happens in `markersToGeoJSON()`. | `operationalPriority` -- consistent with TypeScript naming but verbose in MapLibre expressions like `['get', 'operationalPriority']`. |
| D-7 | Default to `'P4'` when priority is missing in `markersToGeoJSON()` | Consistent with WS-0.2 D-4 (unknown priority = P4 = lowest). Results in default radius (6) -- no visual change for markers without priority data. Safe behavior during the WS-1.1 migration window. | Default to `'P3'` -- reasonable but P4 is safer. Omit property -- would cause the MapLibre `match` expression to use the fallback, which also produces radius 6, but the explicit default is more readable for debugging. |
| D-8 | Selected highlight ring radius is data-driven by priority with a consistent 8px gap | Maintains visual consistency across priority levels. A fixed-radius ring (current 14) would visually "hug" a P1 marker (radius 9) with only 5px gap, while a P3 marker (radius 6) would have 8px gap. Consistent gap = consistent affordance that the ring means "selected." | Fixed radius 14 -- simpler but inconsistent gap. Fixed radius 17 (accommodates P1) -- works but creates an oversized ring around P3/P4 markers. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | What field name does WS-1.1 use on `MapMarker` -- `operationalPriority` or `priority`? The GeoJSON property mapping in 4.1 depends on the exact field name. | WS-1.1 implementer | Before WS-1.5 implementation |
| OQ-2 | Should the P1 glow be visible when the map is in `overview` mode (global view, no auto-fit)? The overview mode currently dims markers. If P1 glow pulses through the dim overlay, it could serve as a "something important is happening" beacon. If it is dimmed along with everything else, it loses its purpose. | react-developer + UX | WS-1.5 implementation |
| OQ-3 | When clusters contain P1 markers, should the cluster circle receive any visual treatment (e.g., a subtle glow or a small P1 badge)? Currently deferred as out of scope, but this would make P1 presence discoverable before zooming in. | UX / react-developer | Post-Phase 1 if user feedback warrants |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | P1 glow and new-alert glow overlap creates visual noise when a P1 marker is also new | Medium | Low -- both glows are low-opacity and blurred, so overlap produces a layered halo rather than a jarring flash | The achromatic P1 glow (white) and severity-colored new-alert glow (red/orange/yellow/blue) are visually distinct due to different hues. Different cycle periods (4000ms vs 3000ms) prevent synchronization. Test with P1-new markers and adjust opacities if needed. |
| R-2 | MapLibre `as any` type casts proliferate with the new expressions | Medium | Low -- existing codebase already uses `as any` for MapLibre expression types (6 instances in current MapMarkerLayer.tsx) | This is a known MapLibre typing limitation. The `as any` casts are isolated to layer definition objects. Consider adding a `// MapLibre expression types are not compatible with LayerProps typing` comment block to explain the pattern. |
| R-3 | WS-1.1 field name or type differs from what this SOW assumes | Low | Medium -- would require updating `markersToGeoJSON()` mapping and possibly the GeoJSON property name | OQ-1 tracks this. The mapping logic is a single line in `markersToGeoJSON()`, so the fix is trivial regardless of the field name. |
| R-4 | P1 glow animation runs continuously even when there are hundreds of P1 markers, causing performance degradation | Low | Medium -- rAF-driven `setPaintProperty` calls apply globally to the layer, not per feature, so the cost is constant regardless of P1 marker count | The P1 glow animation cost is 2 `setPaintProperty` calls per frame (opacity + optionally radius), identical to the existing new-alert glow. MapLibre handles this efficiently. Monitor with DevTools Performance panel during testing. |
| R-5 | Achromatic (white) glow is too subtle on the dark map basemap and does not provide sufficient pre-attentive signal | Medium | Medium -- P1 markers would be larger but not as visually distinct as intended | The glow opacity range (0.06--0.18) and radius (16) can be tuned during implementation. If white is insufficient, increase the glow radius or opacity. As a last resort, a very light blue tint (`rgba(200, 220, 255, 0.6)`) would remain close to achromatic while improving visibility on the dark basemap. |
| R-6 | The data-driven `CIRCLE_RADIUS_EXPRESSION` causes visual popping when markers transition between clustered and unclustered states (e.g., zooming in reveals a large P1 marker that was previously hidden inside a cluster) | Low | Low -- this behavior already exists for severity-colored markers appearing from clusters; size variation is actually less jarring than color variation | No mitigation needed. The zoom transition is animated by MapLibre, so the marker smoothly appears at its priority-scaled size. |
