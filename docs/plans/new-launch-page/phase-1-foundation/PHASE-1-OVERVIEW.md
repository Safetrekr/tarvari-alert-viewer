# Phase 1 Overview: Foundation

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** combined-recommendations.md (no MASTER-PLAN.md exists yet)
> **Date:** 2026-03-03
> **Workstreams:** WS-1.1, WS-1.2, WS-1.3

---

## 1. Executive Summary

Phase 1 establishes the structural and data foundations required before any visual changes are made to the TarvaRI Alert Viewer. It delivers three outputs: a preserved archive of the current tarva-launch spatial page composition (WS-1.1), a widened type system that replaces the hard-coded 6-district `DistrictId` union with a generic `NodeId = string` alias and introduces a 15-category coverage metadata module (WS-1.2), and a complete client-side data layer comprising TanStack Query hooks, pure transformation utilities, and a Zustand filter store that reads live intel data from the shared TarvaRI Supabase instance (WS-1.3).

The phase is designed to be invisible to end users. No runtime behavior changes, no visual changes, and no new UI components are introduced. The existing launch page loads identically after Phase 1 is complete. What changes is the type-level contract: the spatial ZUI engine, morph state machine, and UI store now accept arbitrary string node identifiers instead of exactly six. This unlocks Phase 2 (Coverage Grid, Morph Adaptation) and Phase 3 (District View, Chrome) to replace the capsule ring with a data-driven category card grid without fighting the type system.

The phase also validates the Supabase integration path. By the end of Phase 1, the two TanStack Query hooks (`useCoverageMetrics`, `useCoverageMapData`) will have confirmed that the `intel_sources` and `intel_normalized` tables are accessible, that the JSONB schema matches expectations, and that graceful degradation works when data is empty or unreachable. This early validation de-risks the most uncertain assumption in the project: that the TarvaRI backend's data is query-ready for the alert viewer's needs.

## 2. Key Findings (grouped by theme)

### Type System Architecture

- The current `DistrictId` is a 6-member string literal union that constrains 36+ files across the morph pipeline, UI store, spatial actions, district views, and ambient components. Widening to `NodeId = string` is the single most impactful change in Phase 1.
- A deprecated `DistrictId` alias is retained so that 22 files slated for archival or heavy rewrite in Phase 2/3 compile without modification. Only 8 morph-pipeline files receive the full `NodeId` import update. This minimizes diff size and risk.
- A new `LegacyDistrictId` union type and `LEGACY_DISTRICT_IDS` constant preserve the original 6 IDs for any code that still needs to enumerate them during the transition.
- `Record<DistrictId, X>` patterns (7 occurrences across 7 files) are the highest-risk area. When `DistrictId` becomes `string`, these records claim all string keys exist. Files persisting beyond Phase 2 are converted to `Partial<Record<string, X>>` with runtime fallbacks. Files slated for archival are left unchanged under the alias.

### Coverage Metadata System

- 15 known intel categories are defined in `coverage.ts` with full display metadata: id, displayName, shortName, Lucide icon name, CSS custom property color with hex fallback, and description.
- The "Hybrid Category List" approach (Decision 4 from combined-recommendations) means the constant set provides stable styling while actual source counts come from the database. Categories with zero sources can be hidden at the UI layer (Phase 2).
- Colors use CSS custom properties (`var(--category-seismic, #ef4444)`) to enable future theming without changing the constant. This is consistent with the existing `HEALTH_STATE_MAP` pattern.
- Icon references are stored as Lucide string names (not imported components) to preserve tree-shaking. The rendering layer maps names to components at render time.

### Data Layer Design

- Two TanStack Query hooks serve distinct purposes: `useCoverageMetrics` (configuration data, 45s stale, 60s poll) and `useCoverageMapData` (live intel, 30s stale, 30s poll). The differentiated intervals reflect the data's change frequency.
- Pure utility functions (`buildCategoryMetrics`, `toMarkers`, `calculateBounds`, `emptyMetrics`) are extracted into `coverage-utils.ts` for independent testability, separating data transformation from async state management.
- An intentional two-layer typing strategy is in effect: Supabase row types use `string` for all categorical fields (tolerating unexpected DB values), while display-layer union types (`SeverityLevel`, `SourceStatus`) from `coverage.ts` are used for type-safe rendering. The narrowing from `string` to union happens at the consumer level in Phase 2/3.
- The Zustand coverage store is deliberately minimal: `selectedCategory: string | null` with URL sync via `?category={id}`. No persistence middleware (URL is the persistence mechanism). Additional filter state (`selectedSeverity`, `dateRange`) is deferred to Phase 4 when the map UI design is concrete.

### Preservation and Safety

- The archive (WS-1.1) is a file-level copy, not a git tag. It is co-located at `src/app/(launch)/page.archived.tsx` with its `export default` removed to prevent Next.js from treating it as a routable page.
- WS-1.1 captures the complete page composition: SpatialViewport, SpatialCanvas, MorphOrchestrator with MOCK_CAPSULE_DATA, all ambient effect layers, NavigationHUD, CommandPalette, DistrictViewOverlay, and Phase3Effects. Dependent components, CSS modules, stores, and hooks are not duplicated.
- Risk R-3 in WS-1.1 correctly identifies that the archived file may develop TypeScript errors as downstream workstreams rename or remove components. The mitigation (`// @ts-nocheck` or `tsconfig.json` exclusion) is appropriate for a reference-only file.

## 3. Cross-Workstream Conflicts

### Conflict 1: Dependency Strictness Between WS-1.2 and WS-1.3

**WS-1.3 header** declares `Depends On: WS-1.2`. The dependency graph in combined-recommendations confirms this: `WA1 (types) -> WA2 (data layer)`.

**WS-1.3 Risk R-5** contradicts this by stating: "The only dependency on WS-1.2 is for `CategoryMeta` lookups in future display logic, which is not needed by the hooks or utils themselves. If WS-1.2 is delayed, WS-1.3 can proceed by defining local interim types."

**Resolution:** The formal dependency is correct and should be maintained as the default execution order. The hooks and utilities in WS-1.3 reference `IntelSourceRow` and `IntelNormalizedRow` from `supabase/types.ts` (created within WS-1.3 itself), not from `coverage.ts`. However, WS-1.3's utility functions are designed to produce data structures (`CoverageByCategory`) that align with `CategoryMeta` from WS-1.2. Starting WS-1.3 before WS-1.2 is a valid schedule-pressure escape hatch, but risks producing types that drift from the authoritative coverage module. **Maintain WS-1.2 -> WS-1.3 as the recommended sequence; allow parallel execution only under explicit schedule pressure with a reconciliation checkpoint.**

### Conflict 2: URL Parameter Coexistence

**WS-1.1** documents that the current page uses `useInitialDistrictFromUrl` which reads `?district={id}` from the URL query string.

**WS-1.3** introduces `syncCoverageFromUrl()` / `syncCoverageToUrl()` using `?category={id}`.

Neither WS-1.2 nor WS-1.3 deprecates, removes, or modifies `useInitialDistrictFromUrl`. Both URL parameter schemes will be active simultaneously after Phase 1 completes.

**Resolution:** No runtime conflict exists because the two mechanisms target different state: the old hook writes to `useUIStore.selectedDistrictId`, while the new functions write to `useCoverageStore.selectedCategory`. The old hook continues to operate for the existing page composition. Phase 2 (WS-2.1) is responsible for replacing the page and wiring `?category` as the primary URL parameter. **Document this coexistence explicitly in the Phase 2 handoff. Add a note to WS-2.1's scope to remove or disable `useInitialDistrictFromUrl`.**

### Conflict 3: Supabase Row Type Schema Gap

**WS-1.3 Section 4.1.1** defines `IntelSourceRow` with 5 fields: `source_key`, `name`, `category`, `status`, `coverage`.

**WS-1.3 Section 4.1.2** defines `IntelNormalizedRow` with `source_id: string` described as "uuid, FK to intel_sources.id".

The `intel_sources` row type has no `id` field. If the FK target is `intel_sources.id` (a UUID), then `IntelSourceRow` is missing that column. If the FK target is `intel_sources.source_key` (a text slug), then the `source_id` name in `IntelNormalizedRow` is misleading.

**Resolution:** This is a schema documentation gap, not a blocking conflict for Phase 1 (neither hook performs a join). However, it becomes blocking in Phase 3 (WS-3.1) when `CategoryDetailScene` needs to show source attribution per marker. **Flag as a blocking question for Phase 3. Verify the actual `intel_sources` primary key against the live Supabase schema before WS-3.1 starts. Add `id: string` to `IntelSourceRow` if the UUID column exists.**

## 4. Architecture Decisions (consolidated table from all SOWs)

| ID | Decision | Source SOW | Rationale |
|----|----------|-----------|-----------|
| AD-01 | Archive current page to `page.archived.tsx` with export removed (not git tag, not docs copy) | WS-1.1 (D-14, D-1.1a) | Co-location preserves IDE context; `.archived.tsx` suffix is not a Next.js route convention; removing export prevents duplicate route errors |
| AD-02 | Widen `DistrictId` to `type NodeId = string` (not a union of 15 category IDs, not a branded type) | WS-1.2 (D-1) | Categories are data-driven from Supabase. A union requires code changes for every new category. `string` is correct for dynamic identifiers. |
| AD-03 | Keep `DistrictId` as a deprecated alias for `NodeId` during transition | WS-1.2 (D-2) | Minimizes diff size (22 files untouched). Files slated for archival in Phase 2 compile without import changes. |
| AD-04 | Use `Partial<Record<string, X>>` for sparse legacy lookups (`DISTRICT_CODES`), `Record<string, X>` with inline fallbacks for tint/config maps | WS-1.2 (D-3) | `Partial` forces `undefined` handling at call sites where `undefined` is a real possibility. Inline fallbacks are added where the map is used in controlled contexts. |
| AD-05 | Store Lucide icon references as string names, not imported components | WS-1.2 (D-4) | Preserves tree-shaking; decouples type module from React. Rendering layer maps names to components. |
| AD-06 | Use CSS custom properties with hex fallbacks for category colors | WS-1.2 (D-5) | Enables future theming without constant changes. Consistent with existing `HEALTH_STATE_MAP` pattern. |
| AD-07 | Extract data transformation logic into pure `coverage-utils.ts` module | WS-1.3 (D-1) | Independently testable without React hook wrappers. Multiple consumers can import directly. |
| AD-08 | Use `string` (not union types) for categorical fields in Supabase row types | WS-1.3 (D-2) | Tolerates unexpected DB values. Narrower union types are used at the display layer. Avoids runtime assertion failures. |
| AD-09 | URL sync via standalone functions, not Zustand middleware or `useSearchParams` | WS-1.3 (D-3) | Keeps store pure and testable without browser globals. Page component orchestrates sync. |
| AD-10 | Differentiated refetch intervals: 60s for metrics, 30s for map data | WS-1.3 (D-4) | Reflects data change frequency. Sources are config data; intel items are continuously ingested. |
| AD-11 | Cap `intel_normalized` query at 1000 rows | WS-1.3 (D-5) | Prevents unbounded result sets from overwhelming the browser. MapLibre handles 1000+ markers efficiently. |
| AD-12 | No `persist` middleware on coverage store | WS-1.3 (D-6) | URL is the persistence mechanism. localStorage would create stale state conflicts with bookmarked URLs. |

## 5. Cross-Workstream Dependencies

### Internal Phase 1 Dependencies

```
WS-1.1 (Archive) ---- no deps, no blocks within Phase 1 ----

WS-1.2 (Types)   ---- no deps ----> blocks WS-1.3

WS-1.3 (Data)    ---- depends on WS-1.2 ----> end of Phase 1
```

- **WS-1.1 is fully independent.** It can execute at any point during Phase 1, in parallel with WS-1.2 or WS-1.3. Its only timing constraint is that it should run before any downstream workstream modifies `page.tsx` (which happens in Phase 2).
- **WS-1.2 blocks WS-1.3** because the coverage utility functions are designed to align with `CategoryMeta` types from `coverage.ts`. The dependency is formally strict but pragmatically soft (see Conflict 1 above).
- **WS-1.3 does not block anything within Phase 1.** It is the terminal workstream for this phase.

### Phase 1 -> Phase 2+ Dependencies

| Phase 1 Output | Consumed By | What It Provides |
|----------------|-------------|------------------|
| `page.archived.tsx` (WS-1.1) | WS-2.1, WS-2.2 (Phase 2) | Reference for original composition patterns, morph wiring, ambient effect placement |
| `NodeId` type + `DistrictId` alias (WS-1.2) | WS-2.1, WS-2.2, WS-3.1, WS-3.2 (Phases 2-3) | All downstream workstreams depend on the widened type system to accept category IDs |
| `coverage.ts` module (WS-1.2) | WS-2.1, WS-3.1, WS-3.2 (Phases 2-3) | `KNOWN_CATEGORIES`, `getCategoryColor()`, `getCategoryMeta()`, severity/source types |
| `useCoverageMetrics` hook (WS-1.3) | WS-2.1 (Phase 2), WS-3.2 (Phase 3) | Live source counts and category breakdown for grid cards and chrome panels |
| `useCoverageMapData` hook (WS-1.3) | WS-3.1 (Phase 3), WS-4.1 (Phase 4) | Map markers for CategoryDetailScene and CoverageMap |
| `coverage.store.ts` (WS-1.3) | WS-2.1 (Phase 2), WS-3.1 (Phase 3), WS-4.1 (Phase 4) | Selected category state drives data filtering and morph targeting |
| `coverage-utils.ts` (WS-1.3) | WS-2.1, WS-3.1, WS-4.1 (Phases 2-4) | Pure transformation functions reusable across multiple UI contexts |

### Critical Path

The critical path through the overall project runs: **WS-1.2 -> WS-1.3 -> WS-2.1 -> WS-2.2**. Phase 1 owns the first two links. Any delay in WS-1.2 cascades to WS-1.3 and then to all of Phase 2.

## 6. Consolidated Open Questions

| ID | Question | Source SOW | Blocking? | Assigned To | Target Phase |
|----|----------|-----------|-----------|-------------|--------------|
| OQ-01 | Should `LEGACY_DISTRICT_IDS` and `LegacyDistrictId` be removed in WS-2.2 (capsule ring archival) or kept until all legacy components are fully removed? | WS-1.2 | No | Planning Agent | Phase 2 |
| OQ-02 | Should `district-view-content.tsx`'s `SCENE_MAP` return `null` or a generic placeholder for unknown IDs before WS-3.1 creates `CategoryDetailScene`? | WS-1.2 | No (recommended: return `null`) | react-developer | Phase 1 (WS-1.2) |
| OQ-03 | Should `DistrictMeta.ringIndex` (typed `0|1|2|3|4|5`) be widened to `number` in WS-1.2 or deferred to WS-2.1? | WS-1.2 | No | react-developer | Phase 2 (WS-2.1) |
| OQ-04 | Should CSS custom properties for the 15 category colors be defined in Phase 1 or deferred to WS-2.1? | WS-1.2 | No (recommended: defer) | react-developer | Phase 2 (WS-2.1) |
| OQ-05 | Should `useCoverageMapData` support an `orderBy` parameter? | WS-1.3 | No | react-developer | Phase 4 (WS-4.1) |
| OQ-06 | Should `intel_normalized` queries include a default date range filter (e.g., last 7 days)? | WS-1.3 | No | Planning Agent | Phase 2 (WS-2.1) |
| OQ-07 | Does `intel_sources` have a UUID `id` column, and how does `intel_normalized.source_id` relate to it vs. `source_key`? | WS-1.3 + Conflict 3 | **Yes (Phase 3)** | react-developer | Phase 3 (WS-3.1) |
| OQ-08 | Should `coverage.store.ts` hold `selectedSeverity` and `dateRange` filter state now, or defer to WS-4.1? | WS-1.3 | No (recommended: defer) | Planning Agent | Phase 4 (WS-4.1) |
| OQ-09 | When should `useInitialDistrictFromUrl` (reads `?district=`) be deprecated in favor of `syncCoverageFromUrl` (reads `?category=`)? | Conflict 2 (cross-WS) | No | Planning Agent | Phase 2 (WS-2.1) |

## 7. Phase Exit Criteria

| Criterion | Met? | Evidence |
|-----------|------|----------|
| `src/app/(launch)/page.archived.tsx` exists with full original implementation and no `export default` | Pending | File existence check; diff against original; `pnpm build` produces no duplicate route error |
| Original `page.tsx` is unmodified by Phase 1 work | Pending | `git diff src/app/(launch)/page.tsx` shows no Phase 1 changes |
| `NodeId = string` exported from `district.ts`; `DistrictId` exists as deprecated alias | Pending | Import test: `type _check: NodeId = 'any-string'` compiles |
| `coverage.ts` exports all 13 symbols: `CategoryId`, `CategoryMeta`, `KNOWN_CATEGORIES` (15 entries), `CATEGORY_COLORS`, `CATEGORY_ICONS`, `getCategoryColor()`, `getCategoryIcon()`, `getCategoryMeta()`, `SeverityLevel`, `SEVERITY_LEVELS` (5 entries), `SEVERITY_COLORS`, `SourceStatus`, `SOURCE_STATUSES` (4 entries) | Pending | Import verification; entry counts |
| All `Record<DistrictId, X>` patterns in persisting files have runtime fallbacks for unknown keys | Pending | Code review of `district-view-overlay.tsx`, `district-view-content.tsx`, `district-view-dock.tsx` |
| `pnpm typecheck` passes with zero errors | Pending | CLI output |
| `useCoverageMetrics` returns `CoverageMetrics` from Supabase or graceful `emptyMetrics()` | Pending | Dev server verification; React DevTools or TanStack Query DevTools |
| `useCoverageMapData` returns `MapMarker[]` from Supabase or graceful `[]` | Pending | Dev server verification |
| `useCoverageStore` manages `selectedCategory` state with `setSelectedCategory()` and `clearSelection()` | Pending | Store action verification |
| URL sync functions (`syncCoverageFromUrl`, `syncCoverageToUrl`) read/write `?category=` parameter correctly | Pending | Manual URL parameter test |
| Existing launch page loads identically -- no visual or behavioral regressions | Pending | Visual smoke test in dev server |
| No runtime errors in browser console related to Phase 1 changes | Pending | Console inspection during dev server |

## 8. Inputs Required by Next Phase

Phase 2 (Core UI: WS-2.1 Coverage Grid, WS-2.2 Morph Adaptation) requires the following from Phase 1:

### From WS-1.1 (Archive)
- **`page.archived.tsx`** -- Reference for the original component composition, import list, hook wiring, and ambient effect layering. Phase 2 developers consult this when deciding which pieces of `page.tsx` to preserve vs. replace.

### From WS-1.2 (Type Foundation)
- **`NodeId` type** -- WS-2.1 uses `NodeId` for `CoverageGrid` and `CategoryCard` props. WS-2.2 uses it for the updated morph orchestrator callbacks.
- **`coverage.ts` module** -- WS-2.1 maps `KNOWN_CATEGORIES` to grid cards. `getCategoryColor()`, `getCategoryIcon()`, and `getCategoryMeta()` drive card rendering. `SEVERITY_COLORS` drive severity badge rendering.
- **Updated morph types** -- `MorphState.targetId: NodeId | null` and `startMorph(nodeId: NodeId)` signatures are consumed by WS-2.2's morph adaptation.
- **Stable `pnpm typecheck`** -- Phase 2 workstreams can add new components and type annotations without fighting type errors inherited from Phase 1.

### From WS-1.3 (Data Layer)
- **`useCoverageMetrics` hook** -- WS-2.1 wires this into `CoverageGrid` to render live source counts per category card. WS-3.2 uses it for chrome panel labels.
- **`useCoverageMapData` hook** -- WS-3.1 wires this into `CategoryDetailScene`. WS-4.1 uses it for the full map feature.
- **`coverage-utils.ts`** -- `CoverageByCategory`, `MapMarker`, `CoverageMetrics`, `SourceCoverage` types are consumed by grid cards, detail scenes, and map components.
- **`coverage.store.ts`** -- WS-2.1 wires card click to `setSelectedCategory()`. The store's `selectedCategory` drives `useCoverageMapData` filter parameter. `syncCoverageFromUrl` is called on page mount.
- **Supabase type definitions** -- `IntelSourceRow` and `IntelNormalizedRow` are used by any component that needs to display raw field data.

### Unresolved Items Phase 2 Must Address
- Define CSS custom properties for the 15 category colors (deferred from WS-1.2 OQ-04).
- Decide on `DistrictMeta.ringIndex` widening when replacing ring with grid (deferred from WS-1.2 OQ-03).
- Replace `useInitialDistrictFromUrl` with `syncCoverageFromUrl` wiring (identified in Conflict 2).
- Decide on default date range filter for `intel_normalized` queries (WS-1.3 OQ-06).

## 9. Gaps and Recommendations

### Gap 1: No Test Deliverables for Data Utilities

WS-1.3 acceptance criteria AC-3, AC-4, and AC-5 specify "unit test" as the verification method for `buildCategoryMetrics`, `toMarkers`, and `calculateBounds`. However, no test file is listed in the WS-1.3 deliverables section.

**Recommendation (SPO + CTA):** Add `src/lib/__tests__/coverage-utils.test.ts` as a formal deliverable in WS-1.3. These utility functions are foundational -- every downstream workstream depends on their correctness. Unit tests are especially important because the functions handle edge cases (empty arrays, null GeoJSON, coordinate flipping, deduplication) that are easy to get wrong and hard to catch visually. The test file should cover the scenarios enumerated in AC-3 through AC-5.

### Gap 2: intel_sources Schema Ambiguity

WS-1.3 defines `IntelSourceRow` without an `id` field, but references `intel_normalized.source_id` as "uuid, FK to intel_sources.id." Either the `id` column is missing from the row type, or the FK description is inaccurate.

**Recommendation (CTA):** Before WS-1.3 implementation begins, run a schema introspection query against the live Supabase instance (`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'intel_sources'`) to confirm the actual primary key and column set. Update `IntelSourceRow` accordingly. This is low effort and prevents a schema mismatch from surfacing as a runtime error.

### Gap 3: No Error Boundary Strategy

Neither WS-1.2 nor WS-1.3 specifies how TanStack Query errors should be surfaced to the user. `useCoverageMetrics` throws on Supabase errors (TanStack Query catches and surfaces via `isError`), but no error boundary or fallback UI is defined.

**Recommendation (SPO):** This is acceptable for Phase 1 since no UI consumes the hooks yet. However, Phase 2 (WS-2.1) must define error and loading states for the coverage grid. Add a note to WS-2.1's input dependencies that it must implement error boundaries or inline error states for the coverage hooks.

### Gap 4: TanStack Query DevTools Not Mentioned

The data layer introduces two query keys (`['coverage', 'metrics']` and `['coverage', 'map-data', filters]`) but neither the hooks spec nor WS-1.3 mentions TanStack Query DevTools for debugging.

**Recommendation (STW):** Add a note to WS-1.3's integration verification section (Deliverable 4.6) recommending that developers install `@tanstack/react-query-devtools` during Phase 1 development. It is already compatible with the existing `QueryProvider` and provides real-time visibility into cache state, refetch timing, and error payloads.

### Gap 5: No Smoke Test Script for Phase Exit

The phase exit criteria reference "dev server verification" and "visual smoke test" but provide no scripted or automated way to verify these.

**Recommendation (PMO):** Create a lightweight checklist script or Playwright test that loads the dev server, verifies the page renders without console errors, and confirms that `pnpm typecheck` and `pnpm build` both pass. This is especially valuable because Phase 1's "no visual change" guarantee is hard to verify manually across all zoom levels and ambient effects.

### Gap 6: MASTER-PLAN.md Does Not Exist

The combined-recommendations document serves as the de facto master plan, but it is structured as a discovery output, not a project plan. It lacks versioning, status tracking, and formal phase definitions.

**Recommendation (PMO):** Create `docs/plans/new-launch-page/MASTER-PLAN.md` that formalizes the 4-phase structure, links to each phase overview, and provides a single status dashboard. This overview document references it as the parent plan, but the file does not yet exist.

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream | Estimated Effort | Complexity | Agent | Notes |
|------------|-----------------|------------|-------|-------|
| WS-1.1 Archive | 0.5 hours | LOW | general-purpose | Mechanical file copy + verification. Lowest risk item in the entire project. |
| WS-1.2 Type Foundation | 4-6 hours | MEDIUM | react-developer | ~36 files affected but only 8 require manual import updates. The deprecated alias absorbs most of the blast radius. Main effort is in `coverage.ts` creation (detailed spec reduces ambiguity) and `Record<DistrictId, X>` fallback additions. Typecheck gate provides a hard stop/go signal. |
| WS-1.3 Data Layer | 6-8 hours | MEDIUM | react-developer | 5 new files (2 hooks, 1 utility module, 1 store, 1 type extension). Detailed specs in HOOKS-SPEC.md and DERIVED-METRICS.md reduce ambiguity. Main risk is Supabase schema mismatch (see Gap 2). Integration verification adds ~1 hour. |
| **Phase 1 Total** | **11-15 hours** | | | |

### Resource Loading

Both WS-1.2 and WS-1.3 are assigned to the `react-developer` agent. WS-1.1 uses `general-purpose`. There is no resource contention between WS-1.1 and the other workstreams. However, WS-1.2 and WS-1.3 are serialized on the same agent, meaning the effective Phase 1 duration is the sum of both, not the max.

### Parallel Execution Opportunities

| Opportunity | Feasible? | Risk |
|-------------|-----------|------|
| WS-1.1 in parallel with WS-1.2 | Yes | None. WS-1.1 is fully independent. |
| WS-1.1 in parallel with WS-1.3 | Yes | None. |
| WS-1.2 in parallel with WS-1.3 | Conditionally | Formally blocked by dependency. Pragmatically possible if WS-1.3 defines local interim types. Risk of type drift requires a reconciliation checkpoint. Not recommended unless schedule pressure demands it. |

### Recommended Execution Order

```
Day 1 (morning):
  [1] WS-1.1 Archive .................. 0.5h  (any agent)
  [2] WS-1.2 Type Foundation .......... 4-6h  (react-developer)
      Gate: pnpm typecheck passes

Day 1 (afternoon) or Day 2:
  [3] WS-1.3 Data Layer ............... 6-8h  (react-developer)
      Gate: hooks return data, pnpm typecheck passes

Day 2 (final hour):
  [4] Phase 1 Exit Verification ....... 0.5h  (any agent)
      Visual smoke test, full typecheck, build check
```

### Bottlenecks

1. **Single-agent serialization:** WS-1.2 and WS-1.3 cannot be parallelized without risk. The `react-developer` agent is the bottleneck.
2. **Supabase schema validation:** If `intel_sources` or `intel_normalized` tables do not exist or have different columns, WS-1.3 integration verification fails. Mitigation: validate schema before starting WS-1.3 implementation.
3. **Typecheck cascade:** If WS-1.2's type widening surfaces unexpected errors in files not identified in the 36-file audit, resolution time extends. The deprecated alias strategy minimizes this risk but does not eliminate it entirely.

### Schedule Risk Assessment

- **Best case:** 11 hours across 1.5 days.
- **Expected case:** 14 hours across 2 days.
- **Worst case:** 20 hours across 3 days (if Supabase schema mismatch requires coordination with TarvaRI backend, or typecheck cascade surfaces additional files).
- **Overall Phase 1 schedule risk:** LOW-MEDIUM. The work is well-specified, the blast radius is controlled by the alias strategy, and the gate criteria are unambiguous (`pnpm typecheck` is binary).
