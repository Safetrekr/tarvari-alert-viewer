# WS-0.1: Simplify CoverageOverviewStats

> **Workstream ID:** WS-0.1
> **Phase:** 0 -- Consolidate & Prepare
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** None
> **Blocks:** WS-4.5 (entry point in stats/HUD)
> **Resolves:** AD-9 (Phase 0 Consolidation)

## 1. Objective

Remove the "Sources" and "Active" stat rows from the `CoverageOverviewStats` component, reducing it from 5 rows to 3 rows (All button, Total Alerts, Categories). The IA specialist identified that "Sources" and "Active Sources" are redundant: each `CategoryCard` already displays per-category source counts (line 177-178 of `CategoryCard.tsx`), and the aggregate totals add noise without actionable insight. This cleanup frees vertical space in the stats column for the THREAT PICTURE entry point planned in WS-4.5, and reduces the props surface area of the component so future additions (priority counts in Phase 1) have a cleaner foundation.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Component JSX | Remove the two `<StatRow>` invocations for "Sources" (`icon={Database}`, line 125) and "Active" (`icon={Activity}`, line 126) from `CoverageOverviewStats.tsx`. |
| Props interface | Remove `totalSources` and `activeSources` from the `CoverageOverviewStatsProps` interface (lines 23-25). |
| Icon imports | Remove unused `Database` and `Activity` imports from `lucide-react` (line 15). |
| Call site (page.tsx) | Remove the `totalSources` and `activeSources` props from the `<CoverageOverviewStats>` invocation (lines 468-469). |
| CoverageMetrics type | Evaluate whether `totalSources` and `activeSources` fields on `CoverageMetrics` (lines 60-61 of `coverage-utils.ts`) should be removed or retained. They are still used by the `useCoverageMetrics` hook internals and the `emptyMetrics()` factory. Decision: retain in the type for now (see Decisions, D-2). |
| useCoverageMetrics hook | No changes needed. The hook will continue to return `totalSources` and `activeSources` on the `CoverageMetrics` object -- the page simply stops destructuring and passing them to this component. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Adding priority counts | Belongs to WS-1.2 (Phase 1). This workstream only removes rows. |
| Adding THREAT PICTURE entry point | Belongs to WS-4.5 (Phase 4). This workstream creates the space for it. |
| Modifying CategoryCard | CategoryCard is unchanged; it already displays source count per category. |
| Removing `totalSources` / `activeSources` from `CoverageMetrics` type | These fields are consumed by `useCoverageMetrics` hook internals and `emptyMetrics()`. Removing them is a broader refactor that should be deferred until no consumer needs them. |
| Changing the visual design of remaining rows | Styling of the All button, Total Alerts, and Categories rows remains as-is. |
| Modifying the hook polling intervals or query keys | Data layer is untouched. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/components/coverage/CoverageOverviewStats.tsx` | Current 5-row component implementation | Available (130 lines) |
| `src/app/(launch)/page.tsx` | Call site passing `totalSources`, `activeSources` props (lines 467-475) | Available |
| `src/lib/coverage-utils.ts` | `CoverageMetrics` type definition (lines 58-66) | Available |
| `src/hooks/use-coverage-metrics.ts` | Hook returning `CoverageMetrics` with `totalSources`, `activeSources` | Available |
| AD-9 (Phase 0 Consolidation) | Architecture decision confirming removal of Sources and Active rows | Approved |

## 4. Deliverables

### 4.1 Modify `src/components/coverage/CoverageOverviewStats.tsx`

**Remove from imports (line 15):**
- `Database` -- only used by the Sources stat row
- `Activity` -- only used by the Active stat row

The remaining icon imports are: `Grid3x3` (Categories row), `Layers` (All button), `AlertTriangle` (Total Alerts row), and `LucideIcon` (type for StatRow).

**Remove from `CoverageOverviewStatsProps` interface (lines 21-36):**
- `totalSources: number` (line 23)
- `activeSources: number` (line 25)

The remaining props are: `categoriesCovered`, `totalAlerts`, `isLoading`, `isAllSelected`, `onClearFilter`.

**Remove from component function parameters (lines 74-82):**
- `totalSources` parameter (line 75, currently destructured)
- `activeSources` parameter (line 76, currently destructured)

**Remove from JSX return (lines 124-127):**
- Line 125: `<StatRow icon={Database} label="Sources" value={totalSources} isLoading={isLoading} />`
- Line 126: `<StatRow icon={Activity} label="Active" value={activeSources} isLoading={isLoading} />`

**Retained rows (3 total):**
1. The `<button>` element (lines 86-122) -- the "ALL" filter toggle
2. Line 124: `<StatRow icon={AlertTriangle} label="Total Alerts" value={totalAlerts} isLoading={isLoading} />`
3. Line 127: `<StatRow icon={Grid3x3} label="Categories" value={categoriesCovered} isLoading={isLoading} />`

**Update JSDoc comment (lines 3-13):**
- Line 4: Change "three KPI stat rows" to reflect the actual count post-change. Currently says "three" but renders 5 rows (1 button + 4 StatRows). After change: 3 rows (1 button + 2 StatRows). Update to: "CoverageOverviewStats -- filter toggle + two KPI stat rows for the coverage grid."

### 4.2 Modify `src/app/(launch)/page.tsx`

**Remove props from `<CoverageOverviewStats>` invocation (lines 467-475):**
- Line 468: `totalSources={coverageMetrics?.totalSources ?? 0}` -- remove entirely
- Line 469: `activeSources={coverageMetrics?.activeSources ?? 0}` -- remove entirely

The remaining props on the invocation will be:
```
<CoverageOverviewStats
  categoriesCovered={coverageMetrics?.categoriesCovered ?? 0}
  totalAlerts={coverageMetrics?.totalAlerts ?? 0}
  isLoading={isMetricsLoading}
  isAllSelected={selectedCategories.length === 0}
  onClearFilter={handleClearFilter}
/>
```

No import changes needed in `page.tsx` -- `CoverageOverviewStats` import remains.

### 4.3 No changes to `src/lib/coverage-utils.ts`

The `CoverageMetrics` interface retains `totalSources` and `activeSources` fields. They are still populated by the `useCoverageMetrics` hook (lines 96-97 of `use-coverage-metrics.ts`) and referenced in `emptyMetrics()` (lines 177-178 of `coverage-utils.ts`). These fields may be used by future workstreams or other consumers. Removing them is a separate cleanup concern.

### 4.4 No changes to `src/hooks/use-coverage-metrics.ts`

The hook continues to fetch and return all coverage metrics. The page component will simply stop reading `totalSources` and `activeSources` from the query result.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `CoverageOverviewStats` renders exactly 3 rows: the "All" toggle button, "Total Alerts" stat, and "Categories" stat. | Visual inspection at Z1+ zoom level; DOM inspection confirms 3 child elements inside the flex column. |
| AC-2 | `CoverageOverviewStatsProps` no longer includes `totalSources` or `activeSources`. | `pnpm typecheck` passes with no errors; TypeScript compilation confirms the interface has 5 props: `categoriesCovered`, `totalAlerts`, `isLoading`, `isAllSelected`, `onClearFilter`. |
| AC-3 | No TypeScript errors in the codebase after removal. | `pnpm typecheck` exits with code 0. |
| AC-4 | `Database` and `Activity` icons are no longer imported in `CoverageOverviewStats.tsx`. | Static analysis / grep confirms no `Database` or `Activity` in the file's import statement. |
| AC-5 | The "All" button still toggles category filter (clears selection when clicked). | Manual test: click a category card to filter, then click "All" button -- map filter clears, `isAllSelected` styling activates. |
| AC-6 | "Total Alerts" row displays the correct count from `useCoverageMetrics`. | Compare value shown in stat row with API response from `/console/intel` `total_count` field. |
| AC-7 | "Categories" row displays the correct count from `useCoverageMetrics`. | Compare value with API response from `/console/coverage` `categories_covered` field. |
| AC-8 | Loading state (`isLoading=true`) shows dash placeholders for remaining stat rows. | Throttle network or observe initial render -- both stat rows show "---" during loading. |
| AC-9 | `CoverageMetrics` type in `coverage-utils.ts` is unchanged (still includes `totalSources`, `activeSources`). | Diff of `coverage-utils.ts` shows no changes. |
| AC-10 | `pnpm build` completes without errors. | Build pipeline exits 0. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Remove both "Sources" and "Active" rows simultaneously in a single workstream. | They are both redundant for the same reason (per-category source counts already visible on CategoryCard, line 177-178). Removing one without the other would leave an inconsistent partial cleanup. | Remove only "Active" and keep "Sources" as a total count. Rejected: the aggregate total is not actionable without per-category breakdown, which CategoryCard already provides. |
| D-2 | Retain `totalSources` and `activeSources` on the `CoverageMetrics` type. | These fields are populated by the `useCoverageMetrics` hook from the `/console/coverage` API response (`total_sources`, `active_sources`). Removing them from the type would require changes to the hook, `emptyMetrics()`, and any future consumers. The cost of leaving them is zero (unused fields on an object are harmless); the cost of removing is nonzero and risks breaking future workstreams that might reference them. | Remove from type and hook simultaneously. Rejected: out of scope for a size-S cleanup workstream. Can be revisited if the fields are never consumed after all phases ship. |
| D-3 | Keep the `StatRow` internal component in `CoverageOverviewStats.tsx`. | It is still used by the two remaining stat rows (Total Alerts, Categories). No reason to extract or remove it. | Extract `StatRow` to a shared module. Rejected: premature -- only used in this file. |
| D-4 | Do not adjust the fixed `width: 200` on the container div. | The 3-row layout fits within the existing 200px width. No visual overflow or spacing issues are introduced by removing 2 rows. The height will naturally shrink via `flex-col gap-3` layout. | Reduce width. Rejected: the remaining rows have the same content width requirements. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | Should the "Total Alerts" stat row be changed to show only triaged alerts (matching the default view mode) rather than raw total? | Product / IA specialist | Phase 1 (WS-1.2 will add priority counts, which may redefine what "Total Alerts" means) |
| Q-2 | Will WS-4.5 replace the "Categories" stat row with the THREAT PICTURE entry point, or add a fourth row below it? | IA specialist | Phase 4 |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | A future workstream or branch references `totalSources` or `activeSources` props on `CoverageOverviewStats`, causing a merge conflict. | Low | Low | The props are removed from the interface, so TypeScript will surface any stale reference at compile time. Any conflicting branch will fail `pnpm typecheck` and the error message will be clear. |
| R-2 | Removing two rows changes the visual weight of the stats column, making it look sparse relative to the grid and map. | Low | Low | The column already uses `flex-col gap-3` with a fixed 200px width. Three rows (button + 2 stats) will be approximately 150px tall instead of 250px, which is proportional. WS-4.5 will add content back to this area. Visual check during implementation will confirm acceptable appearance. |
| R-3 | The `Activity` icon import removal could break if another component in the same file uses it. | None | None | Confirmed by reading the file: `Activity` is only used on line 126 (the "Active" StatRow being removed) and in the import statement on line 15. `Grid3x3`, `Layers`, `AlertTriangle`, and `LucideIcon` are the only remaining needed imports. |
