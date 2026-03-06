# Phase 6 Review: Public Deployment

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-05
> **Documents Reviewed:** 5 (ws-6.1, ws-6.2, ws-6.3, ws-6.4, PHASE-6-OVERVIEW.md)

## Review Verdict: PASS WITH ISSUES

Phase 6 is a well-structured, serial 4-workstream phase with sound architecture. The build-time data mode switching (AD-10) is correctly implemented across SOWs, and the dual-path hook branching pattern is mechanical and low-risk. The overview is exceptionally thorough, identifying all 5 cross-workstream conflicts with correct resolutions and 7 gaps with actionable recommendations. However, **none of the overview's conflict resolutions were propagated back into the individual SOW texts** (consistent with the systemic issue observed in Phases 2-5). Three HIGH issues require specification fixes before implementation: naming mismatches between WS-6.1 and WS-6.2 that would cause TypeScript compilation failure, data mode value inconsistency between WS-6.1 and WS-6.3, and a missing hook in WS-6.1's scope. Three MEDIUM issues relate to env var naming conflicts and build script invocation mismatches between WS-6.3 and WS-6.4.

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-6.1 | Excellent. Clean branching pattern. 13 ACs. 6 decisions well-justified. | 4/5 -- Import names don't match WS-6.2 exports. Hook scope incomplete (missing use-bundle-detail). | H-1 (naming mismatch), H-3 (missing hook). | **PASS WITH ISSUES** |
| WS-6.2 | Excellent. Purely additive (1 new file). 14 ACs. Column mappings well-documented. View schemas explicitly flagged as assumptions. | 5/5 -- All codebase refs verified. Type imports from hooks acknowledged as layer violation (R-7). | 0 issues. | **PASS** |
| WS-6.3 | Good. Comprehensive static export spec. 14 ACs. API route exclusion strategy pragmatic. @tarva/ui vendoring is highest-risk item. | 4/5 -- Uses `'tarvari'` mode value contradicting WS-6.1's `'console'` definition. | H-2 (mode value mismatch), M-3 (pre/post script fragility). | **PASS WITH ISSUES** |
| WS-6.4 | Good. Clean workflow structure. 19 ACs. 4 @tarva/ui resolution strategies documented. | 4/5 -- Base path env var and build script invocation don't match WS-6.3. | M-1 (base path env var conflict), M-2 (build script conflict). | **PASS WITH ISSUES** |
| OVERVIEW | Excellent. All 5 conflicts identified with correct resolutions. 7 gaps with actionable recommendations. Go/No-Go checklist. | N/A. | Resolutions not propagated to SOW texts (systemic). | **PASS** |

---

## Issues Found

### HIGH Severity

#### H-1. WS-6.1 import names do not match WS-6.2 export names (Conflict 1)

WS-6.1 Sections 4.3-4.7 import Supabase functions using short names: `supabaseIntelFeed`, `supabaseCoverageMapData`, `supabaseCoverageMetrics`, `supabaseIntelBundles`, `supabaseCategoryIntel`.

WS-6.2 Section 4.7 exports functions using `fetch*FromSupabase` names: `fetchIntelFeedFromSupabase`, `fetchCoverageMapDataFromSupabase`, `fetchCoverageMetricsFromSupabase`, `fetchBundlesFromSupabase`, `fetchBundleDetailFromSupabase`.

These do not match. Would cause TypeScript compilation failure if WS-6.1 were implemented as written. Additionally, WS-6.1 imports `supabaseIntelBundles` but WS-6.2 exports `fetchBundlesFromSupabase` (not `fetchIntelBundlesFromSupabase`) -- a second naming mismatch within the same conflict.

**Fix:** Update all WS-6.1 import statements (Sections 4.2-4.7) to match WS-6.2's `fetch*FromSupabase` export names. Specifically:
- `supabaseIntelFeed` -> `fetchIntelFeedFromSupabase`
- `supabaseCoverageMapData` -> `fetchCoverageMapDataFromSupabase`
- `supabaseCoverageMetrics` -> `fetchCoverageMetricsFromSupabase`
- `supabaseIntelBundles` -> `fetchBundlesFromSupabase`
- `supabaseCategoryIntel` -> `fetchCategoryIntelFromSupabase` (note: WS-6.2 does not export this -- see H-3)

#### H-2. Data mode value inconsistency between WS-6.1 and WS-6.3 (Conflict 2)

WS-6.1 D-1/D-2 defines `DataMode = 'console' | 'supabase'` with default `'console'`. WS-6.3 Section 4.4 uses `'tarvari'` as the non-supabase mode value:

```typescript
const DATA_MODE = process.env.NEXT_PUBLIC_DATA_MODE ?? 'tarvari'
```

WS-6.3 Section 3 also references WS-6.1 gating hooks behind `'tarvari'` mode. WS-6.3 Risk R-5 states "the default in WS-6.1 hooks is `'tarvari'`" -- which is factually wrong (WS-6.1 D-2 explicitly defaults to `'console'`).

While the `DATA_MODE === 'supabase'` guard check works regardless of what the non-supabase value is called, the semantic inconsistency creates confusion for implementers. The `DataMode` type union in WS-6.1 (`'console' | 'supabase'`) does not include `'tarvari'` -- code using `'tarvari'` would fail TypeScript narrowing checks.

**Fix:** Update WS-6.3 Section 4.4 to use `'console'` consistently. Replace all `'tarvari'` references with `'console'`. Update R-5 text to say "the default in WS-6.1 hooks is `'console'`."

#### H-3. useBundleDetail hook missing from WS-6.1 scope (Overview Gap 2)

WS-6.2 creates `fetchBundleDetailFromSupabase` (Deliverable 4.5) but WS-6.1 does not include `use-bundle-detail.ts` in its scope. WS-6.1 covers 5 hooks (use-intel-feed, use-coverage-map-data, use-coverage-metrics, use-intel-bundles, use-category-intel). The `use-bundle-detail.ts` hook also calls `tarvariGet` and needs a branching fetcher.

Without this, in supabase mode, `useBundleDetail` would still attempt to call the TarvaRI API, which would fail on the public GitHub Pages deployment.

**Fix:** Add Deliverable 4.8 to WS-6.1 covering `use-bundle-detail.ts`, following the same branching pattern. Import `fetchBundleDetailFromSupabase` from WS-6.2. Update WS-6.1's scope table, acceptance criteria (add AC-14 for the 6th hook), and hook count references throughout.

#### H-4. Missing `fetchCategoryIntelFromSupabase` function in WS-6.2

WS-6.1 Deliverable 4.7 modifies `use-category-intel.ts` to import a Supabase function for category intel. But WS-6.2's export summary (Section 4.7) lists exactly 5 functions -- none is for category intel. The `public_intel_feed` view could serve category intel queries (same view, filtered by category), but WS-6.2 does not define the function.

Additionally, `use-category-intel.ts` returns 11 fields per item including `eventType`, `confidence`, `geoScope`, `shortSummary`, `sentAt` -- the `public_intel_feed` view as described only selects 6 columns. The category intel function would need either additional view columns or null fallbacks for missing fields.

**Fix:** Add Deliverable 4.6 to WS-6.2: `fetchCategoryIntelFromSupabase(category: string): Promise<CategoryIntelItem[]>`. Query `public_intel_feed` with `.eq('category', category)`. Document null fallbacks for fields not available in the public view (`eventType`, `confidence`, `geoScope`, `shortSummary`, `sentAt`).

### MEDIUM Severity

- **M-1:** Base path env var name conflict (Conflict 3). WS-6.3 uses `GITHUB_PAGES` env var consumed in `next.config.ts`. WS-6.4 uses `NEXT_PUBLIC_BASE_PATH`. Overview recommends `GITHUB_PAGES` (non-`NEXT_PUBLIC_`, build-time only). Update WS-6.4 workflow to set `GITHUB_PAGES=tarvari-alert-viewer` instead of `NEXT_PUBLIC_BASE_PATH`.
- **M-2:** Build script invocation conflict (Conflict 4). WS-6.4 workflow calls `pnpm build` but WS-6.3 creates `build:pages` script that sets `STATIC_EXPORT=true`. Without `STATIC_EXPORT=true`, the build won't produce a static export. Update WS-6.4 to call `pnpm build:pages` and remove redundant `NEXT_PUBLIC_DATA_MODE` from the workflow env block (already set in the script).
- **M-3:** Pre/post build script fragility (Overview Gap 5). WS-6.3's API route exclusion uses `mv` in pre/post build scripts. If build fails between pre and post, `src/app/api/` remains renamed. Add a `trap` handler as recommended by the overview.

### LOW Severity

- **L-1.** WS-6.2 R-7 layer violation (importing types from `src/hooks/` into `src/lib/`) is acknowledged as acceptable for type-only imports. Consistent with existing codebase patterns.
- **L-2.** WS-6.4 install step uses `--frozen-lockfile` but WS-6.3 R-7 acknowledges this may fail with vendored @tarva/ui. The CI install script (`ci-install.sh`) in WS-6.3 handles this with `--frozen-lockfile` after workspace rewrite. Consistent but fragile.
- **L-3.** WS-6.2 D-5 skips `Database` type updates for views. Pragmatic given views don't exist yet, but weakens type safety. Follow-up task when views are confirmed.
- **L-4.** WS-6.1 Q-3 asks "are there additional hooks beyond the 5 identified?" -- `use-bundle-detail.ts` is the answer (H-3). This open question should be closed.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | **OK** | AD-10 (build-time data mode switching) consistently implemented. Phase 6 table in combined-recommendations matches SOW scope. |
| SOW scopes do not overlap | **OK** | Clean separation: WS-6.2 = query functions, WS-6.1 = hook branching, WS-6.3 = build config, WS-6.4 = CI workflow. |
| SOW scopes have no gaps | **ISSUE** | `use-bundle-detail.ts` branching not covered by any SOW (H-3). |
| Dependencies are bidirectionally consistent | **OK** | Serial chain WS-6.2 -> WS-6.1 -> WS-6.3 -> WS-6.4 correctly documented in all directions. |
| Acceptance criteria are measurable | **OK** | 60 ACs total across 4 SOWs. All testable. |
| Open questions have owners and target phases | **OK** | 18 OQs across SOWs, all assigned. 5 critical OQs in overview, all assigned. |
| Effort estimates are internally consistent | **OK** | SOW estimates (3-4 days) match combined-recommendations (~3-4 days). Serial critical path correctly identified. |
| File modifications across SOWs do not conflict | **ISSUE** | H-1, H-2: naming mismatches between SOWs would cause compilation failure if implemented as-written. No actual file conflicts since SOWs modify different files. |
| All codebase references verified | **ISSUE** | H-2: WS-6.3 references `'tarvari'` mode value that does not exist in WS-6.1's type definition. All other path/type references verified against source. |

---

## Blocking Assessment

**Blocking for next phase?** N/A (Phase 6 is the final phase)

**Required fixes before implementation:**

1. **H-1:** Update WS-6.1 import names to match WS-6.2's `fetch*FromSupabase` export convention. 5 import statements across Sections 4.3-4.7.
2. **H-2:** Replace all `'tarvari'` references in WS-6.3 with `'console'` to match WS-6.1's canonical `DataMode` definition.
3. **H-3:** Add `use-bundle-detail.ts` branching to WS-6.1 scope as Deliverable 4.8.

**Recommended fixes (non-blocking):**

1. **M-1:** Align base path env var name between WS-6.3 and WS-6.4 (use `GITHUB_PAGES`).
2. **M-2:** Update WS-6.4 to call `pnpm build:pages` instead of `pnpm build`.
3. **M-3:** Add `trap` handler to WS-6.3 pre/post build scripts for robustness.
4. **L-4:** Close WS-6.1 Q-3 with resolution: `use-bundle-detail.ts` is the missing 6th hook.
