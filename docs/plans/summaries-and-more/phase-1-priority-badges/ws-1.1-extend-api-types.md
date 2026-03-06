# WS-1.1: Extend API Types with operational_priority

> **Workstream ID:** WS-1.1
> **Phase:** 1 — Priority Badges
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.2 (OperationalPriority type)
> **Blocks:** WS-1.2, WS-1.3, WS-1.4, WS-1.5, WS-2.1-2.6, WS-3.1-3.4
> **Resolves:** Phase 7 validation M-5 (useCategoryIntel inclusion)

## 1. Objective

Add the `operational_priority` field to every API response type and its corresponding camelCase client-side type across the four data hooks that normalize TarvaRI backend responses. Once complete, every intel item, map marker, and bundle flowing through the application will carry an `OperationalPriority` value (or `null` during the backend migration window), enabling all downstream priority-dependent features: badge rendering (WS-1.2, WS-1.3), priority filtering (WS-1.4), map marker scaling (WS-1.5), the P1/P2 feed (WS-2.x), and search integration (WS-3.x).

This is a pure data-plumbing workstream. No visual changes. No new components. No behavioral changes to existing UI. The field is threaded through the type system and normalizers so that downstream workstreams can consume it immediately.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `ApiIntelItem` in `use-intel-feed.ts` | Add `operational_priority: string \| null` field (snake_case, matching backend JSON). |
| `IntelFeedItem` in `use-intel-feed.ts` | Add `operationalPriority: OperationalPriority \| null` field (camelCase, typed). |
| `fetchIntelFeed` normalizer in `use-intel-feed.ts` | Map `r.operational_priority` to camelCase with `getPriorityMeta`-safe fallback. |
| `ApiIntelItem` in `use-category-intel.ts` | Add `operational_priority: string \| null` field (snake_case). |
| `CategoryIntelItem` in `use-category-intel.ts` | Add `operationalPriority: OperationalPriority \| null` field (camelCase, typed). |
| `fetchCategoryIntel` normalizer in `use-category-intel.ts` | Map `r.operational_priority` to camelCase. |
| `GeoJSONFeature.properties` in `use-coverage-map-data.ts` | Extract `operational_priority` from GeoJSON properties. |
| `MapMarker` in `coverage-utils.ts` | Add `operationalPriority: OperationalPriority \| null` field. |
| `fetchCoverageMapData` normalizer in `use-coverage-map-data.ts` | Map `f.properties.operational_priority` to camelCase on the `MapMarker` object. |
| `toMarkers` in `coverage-utils.ts` | Update the Supabase-path normalizer to include the new field (set to `null` since `IntelNormalizedRow` does not carry priority). |
| `ApiBundleItem` in `use-intel-bundles.ts` | Add `operational_priority: string \| null` field (snake_case). |
| `apiToBundle` normalizer in `use-intel-bundles.ts` | Pass `operational_priority` through to `IntelBundleRow` or attach as a sibling field on `BundleWithDecision`. |
| `MarkerFeatureCollection` properties in `map-utils.ts` | Add `operationalPriority: string \| null` to the GeoJSON feature properties interface so the field flows through to MapLibre expressions (consumed by WS-1.5). |
| `markersToGeoJSON` in `map-utils.ts` | Map `marker.operationalPriority` into the feature properties object. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| PriorityBadge rendering | WS-0.4 creates the component; WS-1.2 and WS-1.3 wire it to data. |
| Priority filter state in Zustand | WS-1.4 adds `selectedPriorities` to `coverage.store.ts`. |
| Map marker radius expressions | WS-1.5 consumes the field from GeoJSON properties. |
| `CoverageByCategory` priority counts (`p1Count`, `p2Count`) | WS-1.2 extends that type separately. |
| `BundleWithDecision` / `BundleWithMembers` interface changes | The bundle normalizer passes priority through existing fields; no new composite type needed. |
| `IntelBundleRow` schema changes in `supabase/types.ts` | The Supabase row type is hand-maintained and will be updated when the backend schema migration lands. WS-1.1 operates at the API hook layer, not the Supabase schema layer. |
| `IntelNormalizedRow` changes | This type mirrors the current DB schema which does not yet have `operational_priority`. The `toMarkers()` utility will set the field to `null`. |
| Backend API endpoint changes | Backend Phase A (A.5) adds the field to console endpoint responses. This workstream consumes it. |
| Priority normalization (case conversion) | If the backend sends lowercase `'p1'` instead of `'P1'`, a normalization function will be needed. Deferred to implementation time per OQ-1 below. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.2 deliverables | `OperationalPriority` type (`'P1' \| 'P2' \| 'P3' \| 'P4'`), `getPriorityMeta()` helper in `src/lib/interfaces/coverage.ts` | Pending (WS-0.2 not yet implemented) |
| Backend Phase A (A.5) | `/console/intel`, `/console/coverage/map-data`, `/console/bundles` endpoints include `operational_priority` in response payloads | Pending (backend work) |
| `src/hooks/use-intel-feed.ts` | Current `ApiIntelItem` (lines 33-45), `IntelFeedItem` (lines 20-27), `fetchIntelFeed` normalizer (lines 56-67) | Available [CODEBASE] |
| `src/hooks/use-category-intel.ts` | Current `ApiIntelItem` (lines 39-51), `CategoryIntelItem` (lines 21-33), `fetchCategoryIntel` normalizer (lines 62-81) | Available [CODEBASE] |
| `src/hooks/use-coverage-map-data.ts` | Current `GeoJSONFeature` (lines 35-42), `fetchCoverageMapData` normalizer (lines 53-89) | Available [CODEBASE] |
| `src/hooks/use-intel-bundles.ts` | Current `ApiBundleItem` (lines 23-34), `apiToBundle` normalizer (lines 45-73) | Available [CODEBASE] |
| `src/lib/coverage-utils.ts` | Current `MapMarker` interface (lines 30-39), `toMarkers` function (lines 121-142) | Available [CODEBASE] |
| `src/components/coverage/map-utils.ts` | Current `MarkerFeatureCollection` properties type (lines 46-65), `markersToGeoJSON` function (lines 73-100) | Available [CODEBASE] |

## 4. Deliverables

### 4.1 `use-intel-feed.ts` — ApiIntelItem + IntelFeedItem + normalizer

**File:** `src/hooks/use-intel-feed.ts`

**4.1.1 `ApiIntelItem` (line 33-45): Add field**

Current type has 10 fields. Add after `sent_at` (line 44):

```
operational_priority: string | null
```

The field is `string | null` (not `OperationalPriority | null`) because this is the raw API response type. The snake_case API layer uses unvalidated strings; type narrowing happens in the normalizer.

**4.1.2 `IntelFeedItem` (lines 20-27): Add field**

Current type has 6 fields. Add after `ingestedAt` (line 26):

```
operationalPriority: OperationalPriority | null
```

Requires adding an import of `OperationalPriority` from `@/lib/interfaces/coverage`.

**4.1.3 `fetchIntelFeed` normalizer (lines 59-66): Map the field**

Current normalizer maps 6 fields. Add to the return object (after line 65):

```
operationalPriority: (r.operational_priority as OperationalPriority) ?? null,
```

**Design note on type assertion:** The cast `as OperationalPriority` is acceptable here because:
- The backend is the authoritative source of these values.
- `getPriorityMeta()` (from WS-0.2) already handles unknown values with a P4 fallback at the consumption layer.
- Adding runtime Zod validation at this layer is disproportionate for a 4-value union and is not the pattern used by the existing normalizers (severity is also passed through as a raw string without validation).

If the value is `null` (backend has not yet populated the field during migration), the `?? null` preserves nullability.

---

### 4.2 `use-category-intel.ts` — ApiIntelItem + CategoryIntelItem + normalizer

**File:** `src/hooks/use-category-intel.ts`

**Note:** This file defines its own local `ApiIntelItem` interface (lines 39-51), separate from the one in `use-intel-feed.ts`. Both are local to their respective hooks. This is intentional — the two endpoints return slightly different field sets.

**4.2.1 `ApiIntelItem` (lines 39-51): Add field**

Current type has 10 fields. Add after `sent_at` (line 50):

```
operational_priority: string | null
```

**4.2.2 `CategoryIntelItem` (lines 21-33): Add field**

Current type has 11 fields. Add after `sentAt` (line 32):

```
operationalPriority: OperationalPriority | null
```

Requires adding an import of `OperationalPriority` from `@/lib/interfaces/coverage`.

**4.2.3 `fetchCategoryIntel` normalizer (lines 68-80): Map the field**

Current normalizer maps 11 fields. Add to the return object (after line 79):

```
operationalPriority: (r.operational_priority as OperationalPriority) ?? null,
```

---

### 4.3 `use-coverage-map-data.ts` — GeoJSON properties extraction + MapMarker

**File:** `src/hooks/use-coverage-map-data.ts`

The map data endpoint returns a GeoJSON FeatureCollection. The `operational_priority` field arrives as a property on each Feature, not as a top-level field.

**4.3.1 `fetchCoverageMapData` normalizer (lines 79-88): Add extraction**

Current normalizer extracts 7 properties from `f.properties`. Add after `ingestedAt` (line 87):

```
operationalPriority: (f.properties.operational_priority as OperationalPriority | null) ?? null,
```

No changes needed to the `GeoJSONFeature` interface (lines 35-42) because `properties` is already typed as `Record<string, unknown>`, which accommodates any key. Adding a narrower type here would be over-engineering given the generic GeoJSON structure.

Requires adding an import of `OperationalPriority` from `@/lib/interfaces/coverage`.

---

### 4.4 `coverage-utils.ts` — MapMarker interface + toMarkers

**File:** `src/lib/coverage-utils.ts`

**4.4.1 `MapMarker` interface (lines 30-39): Add field**

Current interface has 8 fields. Add after `ingestedAt` (line 38):

```
operationalPriority: OperationalPriority | null
```

Requires adding an import of `OperationalPriority` from `@/lib/interfaces/coverage`. Note: `coverage-utils.ts` already imports from `@/lib/supabase/types` (line 13), so this is a second interface import — consistent with the module's role as a data transformation layer.

**4.4.2 `toMarkers` function (lines 132-141): Add field to output**

Current function maps 8 fields from `IntelNormalizedRow` to `MapMarker`. Since `IntelNormalizedRow` does not (and will not in this workstream) have `operational_priority`, add a hardcoded null (after line 140):

```
operationalPriority: null,
```

This is correct because `toMarkers` converts from the Supabase direct-query path, which does not carry priority data. The API-driven path in `use-coverage-map-data.ts` (deliverable 4.3) handles the field properly.

---

### 4.5 `use-intel-bundles.ts` — ApiBundleItem + apiToBundle normalizer

**File:** `src/hooks/use-intel-bundles.ts`

**4.5.1 `ApiBundleItem` (lines 23-34): Add field**

Current type has 10 fields. Add after `routed_alert_count` (line 33):

```
operational_priority: string | null
```

**Design note on bundle priority:** A bundle's `operational_priority` represents the highest priority among its member intel items (determined by the backend bundler). This is a single aggregate value, not per-member.

**4.5.2 `apiToBundle` normalizer (lines 45-73): Pass priority through**

The normalizer currently constructs an `IntelBundleRow` object with hardcoded values for fields not present in `ApiBundleItem`. The `IntelBundleRow` type (in `supabase/types.ts`) does not currently have an `operational_priority` field.

**Approach:** Rather than modifying `IntelBundleRow` (which mirrors the DB schema and is shared), extend `BundleWithDecision` with an optional `operationalPriority` field. This keeps the Supabase type honest and threads priority through the bundle display layer.

In `src/lib/interfaces/intel-bundles.ts`, extend the `BundleWithDecision` interface:

```
operationalPriority: OperationalPriority | null
```

In `apiToBundle` (line 72), add to the return object:

```
operationalPriority: (item.operational_priority as OperationalPriority) ?? null,
```

Requires adding an import of `OperationalPriority` from `@/lib/interfaces/coverage` in both `intel-bundles.ts` and `use-intel-bundles.ts`.

---

### 4.6 `map-utils.ts` — MarkerFeatureCollection + markersToGeoJSON

**File:** `src/components/coverage/map-utils.ts`

**4.6.1 `MarkerFeatureCollection` properties type (lines 54-64): Add field**

Current properties interface has 7 fields (`id`, `title`, `severity`, `category`, `sourceId`, `ingestedAt`, `isNew`). Add after `isNew` (line 63):

```
operationalPriority: string | null
```

Note: Uses `string | null` (not `OperationalPriority`) because GeoJSON properties are serialized for MapLibre GL consumption. MapLibre style expressions operate on raw strings, not TypeScript union types.

**4.6.2 `markersToGeoJSON` function (lines 88-95): Map field**

Current function maps 7 properties plus the computed `isNew`. Add to the properties object (after line 95):

```
operationalPriority: marker.operationalPriority ?? null,
```

No new import needed — the field is typed as `string | null` in the GeoJSON context.

---

### 4.7 Summary of all type changes

| File | Type/Function | Field Added | Type | Line After |
|------|---------------|-------------|------|------------|
| `use-intel-feed.ts` | `ApiIntelItem` | `operational_priority` | `string \| null` | 44 |
| `use-intel-feed.ts` | `IntelFeedItem` | `operationalPriority` | `OperationalPriority \| null` | 26 |
| `use-intel-feed.ts` | `fetchIntelFeed` | normalizer mapping | — | 65 |
| `use-category-intel.ts` | `ApiIntelItem` | `operational_priority` | `string \| null` | 50 |
| `use-category-intel.ts` | `CategoryIntelItem` | `operationalPriority` | `OperationalPriority \| null` | 32 |
| `use-category-intel.ts` | `fetchCategoryIntel` | normalizer mapping | — | 79 |
| `use-coverage-map-data.ts` | `fetchCoverageMapData` | normalizer mapping | — | 87 |
| `coverage-utils.ts` | `MapMarker` | `operationalPriority` | `OperationalPriority \| null` | 38 |
| `coverage-utils.ts` | `toMarkers` | hardcoded `null` | — | 140 |
| `use-intel-bundles.ts` | `ApiBundleItem` | `operational_priority` | `string \| null` | 33 |
| `intel-bundles.ts` | `BundleWithDecision` | `operationalPriority` | `OperationalPriority \| null` | 48 |
| `use-intel-bundles.ts` | `apiToBundle` | normalizer mapping | — | 72 |
| `map-utils.ts` | `MarkerFeatureCollection` properties | `operationalPriority` | `string \| null` | 63 |
| `map-utils.ts` | `markersToGeoJSON` | property mapping | — | 95 |

**New imports required (3 files + 1 interface file):**
- `use-intel-feed.ts`: `import type { OperationalPriority } from '@/lib/interfaces/coverage'`
- `use-category-intel.ts`: `import type { OperationalPriority } from '@/lib/interfaces/coverage'`
- `use-coverage-map-data.ts`: `import type { OperationalPriority } from '@/lib/interfaces/coverage'`
- `coverage-utils.ts`: `import type { OperationalPriority } from '@/lib/interfaces/coverage'`
- `intel-bundles.ts`: `import type { OperationalPriority } from '@/lib/interfaces/coverage'`

`map-utils.ts` and `use-intel-bundles.ts` do not need the import (map-utils uses `string | null`; use-intel-bundles casts inline).

**Correction:** `use-intel-bundles.ts` does need the import for the `as OperationalPriority` cast. Total: 5 files gain the `OperationalPriority` import.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `ApiIntelItem` in `use-intel-feed.ts` includes `operational_priority: string \| null`. | Code review; `pnpm typecheck` passes. |
| AC-2 | `IntelFeedItem` includes `operationalPriority: OperationalPriority \| null`. | Code review; TypeScript rejects assignment of non-`OperationalPriority` string. |
| AC-3 | `fetchIntelFeed` normalizer maps `operational_priority` to `operationalPriority` with null fallback. | Code review; manual test with API returning the field. |
| AC-4 | `ApiIntelItem` in `use-category-intel.ts` includes `operational_priority: string \| null`. | Code review; `pnpm typecheck` passes. |
| AC-5 | `CategoryIntelItem` includes `operationalPriority: OperationalPriority \| null`. | Code review; TypeScript rejects assignment of non-`OperationalPriority` string. |
| AC-6 | `fetchCategoryIntel` normalizer maps `operational_priority` to `operationalPriority` with null fallback. | Code review; manual test with API returning the field. |
| AC-7 | `MapMarker` in `coverage-utils.ts` includes `operationalPriority: OperationalPriority \| null`. | Code review; `pnpm typecheck` passes. |
| AC-8 | `fetchCoverageMapData` normalizer extracts `operational_priority` from GeoJSON properties. | Code review; manual test with API returning the field in GeoJSON properties. |
| AC-9 | `toMarkers` in `coverage-utils.ts` sets `operationalPriority: null` (Supabase path). | Code review. |
| AC-10 | `ApiBundleItem` in `use-intel-bundles.ts` includes `operational_priority: string \| null`. | Code review; `pnpm typecheck` passes. |
| AC-11 | `BundleWithDecision` in `intel-bundles.ts` includes `operationalPriority: OperationalPriority \| null`. | Code review; `pnpm typecheck` passes. |
| AC-12 | `apiToBundle` normalizer maps `operational_priority` to `operationalPriority` on the return object. | Code review. |
| AC-13 | `MarkerFeatureCollection` properties in `map-utils.ts` include `operationalPriority: string \| null`. | Code review; `pnpm typecheck` passes. |
| AC-14 | `markersToGeoJSON` maps `marker.operationalPriority` into feature properties. | Code review. |
| AC-15 | `pnpm typecheck` passes with zero errors across the full project. | Run `pnpm typecheck` locally or in CI. |
| AC-16 | `pnpm build` succeeds (no runtime import errors from the new `OperationalPriority` import). | Run `pnpm build`. |
| AC-17 | No existing UI behavior changes — the new field is data-only, not rendered. | Manual smoke test: grid loads, map renders markers, feed panel shows items, district view functions. |
| AC-18 | When `operational_priority` is absent from the API response (pre-migration), the field resolves to `null` (not `undefined`, not a crash). | Manual test against a backend that does not yet include the field. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Use `OperationalPriority \| null` (not `OperationalPriority \| undefined`) for all client-side typed fields. | `null` is the established nullability pattern in every existing type in this codebase (`IntelFeedItem`, `CategoryIntelItem`, `MapMarker` all use `\| null` for optional fields like `sourceKey`, `eventType`, etc.). Using `undefined` would break the convention and cause confusion. | `OperationalPriority \| undefined` — rejected for inconsistency. `OperationalPriority` (non-nullable) — rejected because the field will be `null` during the backend migration period. |
| D-2 | API-layer types (`ApiIntelItem`, `ApiBundleItem`) use `string \| null`, not `OperationalPriority \| null`. | API response types should reflect what the wire protocol actually sends — unvalidated strings. Type narrowing to `OperationalPriority` happens in the normalizer, consistent with how `severity` is handled (API type is `string`, display type is `string` but could be narrowed). | Use `OperationalPriority \| null` on API types — rejected because API types are not validated and should not promise type safety they cannot enforce. |
| D-3 | Extend `BundleWithDecision` interface (in `intel-bundles.ts`) rather than modifying `IntelBundleRow` (in `supabase/types.ts`). | `IntelBundleRow` mirrors the Supabase DB schema and should only change when the schema changes. The `operational_priority` on bundles comes from the TarvaRI API response, not from a direct Supabase query. Adding it to the composite type (`BundleWithDecision`) is the correct layer. | Modify `IntelBundleRow` — rejected because it would misrepresent the current DB schema. Add a new `ApiBundleWithPriority` type — over-engineering for one field. |
| D-4 | Use `as OperationalPriority` cast in normalizers rather than runtime validation. | This matches the existing pattern in all four normalizers: severity, category, and other string fields are passed through without runtime validation. Adding Zod or manual validation for a 4-value union is disproportionate. The `getPriorityMeta()` helper (WS-0.2) already provides safe fallback behavior at the consumption layer. | Zod validation at normalizer boundary — rejected for consistency and proportionality. `isPriority()` type guard — reasonable but adds ceremony; revisit if data quality issues emerge. |
| D-5 | Include `operationalPriority` in `map-utils.ts` GeoJSON properties as `string \| null` (not `OperationalPriority`). | MapLibre GL style expressions consume GeoJSON properties as raw strings. TypeScript union types have no meaning in the MapLibre runtime. Using `string \| null` avoids a misleading type annotation and an unnecessary import. | `OperationalPriority \| null` — rejected because GeoJSON properties are consumed by MapLibre, not TypeScript. |
| D-6 | Set `operationalPriority: null` in `toMarkers()` (Supabase direct-query path). | `IntelNormalizedRow` does not have `operational_priority` and is not in scope for this workstream. The Supabase path is a legacy code path; the primary data flow uses the TarvaRI API hooks. Setting `null` satisfies the `MapMarker` interface without lying about data availability. | Omit the field — TypeScript would reject the incomplete object. Add to `IntelNormalizedRow` — out of scope (DB schema change). |
| D-7 | Thread `operationalPriority` through `MarkerFeatureCollection` properties to enable WS-1.5 (map marker scaling). | WS-1.5 needs the priority value available as a GeoJSON feature property to build a `circle-radius` MapLibre expression (analogous to the existing `CIRCLE_COLOR_EXPRESSION` for severity). If the field is not in the GeoJSON properties, WS-1.5 would need to refactor the data flow. | Defer to WS-1.5 — rejected because WS-1.5 would then need to modify types that WS-1.1 already touches, creating unnecessary rework. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | What is the exact casing of backend `operational_priority` values — `'P1'` (uppercase) or `'p1'` (lowercase)? If lowercase, a `toUpperCase()` normalization step is needed in each normalizer. WS-0.2 OQ-2 flags this same question. | Backend team | Phase 1 (before implementation) |
| OQ-2 | Does the `/console/coverage/map-data` GeoJSON endpoint include `operational_priority` in feature properties, or only in a separate field? The current endpoint returns a standard GeoJSON FeatureCollection with properties like `id`, `title`, `severity`, `category`, `source_key`, `ingested_at`. The backend needs to add `operational_priority` to this property set. | Backend team | Phase 1 (backend Phase A.5) |
| OQ-3 | Does the `/console/bundles` endpoint return `operational_priority` as a top-level field on each bundle item, or does it need to be derived from the bundle's member intel items? The SOW assumes it is a top-level aggregate field. | Backend team | Phase 1 (backend Phase A.5) |
| OQ-4 | Should the `emptyMetrics()` function in `coverage-utils.ts` be updated? It returns a `CoverageMetrics` object but does not involve `MapMarker` or `IntelFeedItem`, so it should not need changes. Confirm no downstream metric type needs priority. | react-developer | WS-1.1 implementation |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Backend does not yet include `operational_priority` in API responses when frontend work begins. | High | Low | All normalizers use `?? null` fallback. The field resolves to `null` when absent from the response. The UI is unaffected because no rendering logic references the field in this workstream. Frontend and backend work can proceed in parallel. |
| R-2 | Backend sends `operational_priority` values outside the `'P1'`-`'P4'` range (e.g., `'P0'`, `'P5'`, or `null`). | Low | Low | The `as OperationalPriority` cast would produce an invalid value at the TypeScript level, but `getPriorityMeta()` (WS-0.2) falls back to P4 metadata for unknown strings. No crash. If this becomes a pattern, add a `normalizePriority()` guard in a follow-up. |
| R-3 | The `BundleWithDecision` interface extension causes type errors in existing consumers that destructure or spread the object. | Low | Medium | `BundleWithDecision` is consumed in 3 places: `use-intel-bundles.ts` (constructs it), and downstream components that read `bundle` and `decision` fields. Adding `operationalPriority` is additive — existing destructuring patterns (`{ bundle, decision }`) are unaffected. Run `pnpm typecheck` to confirm. |
| R-4 | Two separate `ApiIntelItem` interfaces (one in `use-intel-feed.ts`, one in `use-category-intel.ts`) drift further apart, making future refactoring harder. | Medium | Low | The two interfaces are intentionally local because the endpoints return different field sets. A shared `ApiIntelBase` could be extracted in a future cleanup workstream if the duplication becomes burdensome. Not in scope for WS-1.1. |
| R-5 | The `MapMarker` interface change propagates to components that spread `MapMarker` objects (e.g., as props). Adding a field to the interface could cause unexpected prop spreading in React components. | Low | Low | Grep for `{...marker}` patterns. Current codebase does not spread `MapMarker` objects into JSX — components access individual fields (`marker.severity`, `marker.category`). The additive field is safe. |
| R-6 | WS-0.2 is not implemented when WS-1.1 work begins, blocking the `OperationalPriority` import. | Medium | Medium | WS-0.2 is a small workstream (type definitions only) and should land first. If blocked, WS-1.1 can temporarily use `string \| null` for all client-side fields and add a `// TODO: WS-0.2` comment, then tighten to `OperationalPriority \| null` once WS-0.2 lands. This avoids blocking but is not preferred. |
