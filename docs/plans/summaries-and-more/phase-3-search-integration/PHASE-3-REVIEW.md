# Phase 3 Review: Search Integration

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-05
> **Documents Reviewed:** 5 (ws-3.1 through ws-3.4, PHASE-3-OVERVIEW.md)

## Review Verdict: PASS WITH ISSUES

Phase 3 is architecturally sound and well-scoped. The four SOWs decompose cleanly into a data hook (WS-3.1), a UI integration (WS-3.2), a navigation wiring layer (WS-3.3), and a store/choreography extension (WS-3.4). The fast morph design (WS-3.4) is the highest-risk item but its scope is tightly bounded -- a boolean flag, a timing constant, and one conditional branch. The overview identified all four cross-workstream conflicts and provided correct resolutions. However, the same systemic issue from Phase 2 persists: **overview conflict resolutions were not propagated back into the individual SOW texts**, creating a layer of indirection that forces the implementer to cross-reference two documents. Three HIGH-severity issues were found: an unresolved handler placement contradiction between WS-3.2 and WS-3.3, a factually incorrect codebase claim in the overview, and unpropagated hook API mismatch that would cause TypeScript compilation failure if WS-3.2 were implemented literally. One genuinely new issue was missed entirely by the overview: a TypeScript type mismatch when indexing `SEVERITY_COLORS` with the `string`-typed `SearchResult.severity` field.

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-3.1 | Excellent. All types, query function, debounce logic, hook config, and return type thoroughly specified. 19 ACs. | All refs verified: `tarvariGet` signature, `use-intel-feed.ts` pattern, `use-category-intel.ts` conditional `enabled`. | M-4 (objective/body debounce contradiction), L-3 (size inconsistency). | **PASS WITH ISSUES** |
| WS-3.2 | Good. Five visual states, sanitization utility, CSS additions, accessibility labels, callback prop well-specified. | `CommandPalette.tsx` verified at 341 lines. `filter={() => 1}` verified at line 253. `SEVERITY_COLORS` at coverage.ts lines 119-125. | H-3 (hook API mismatch not corrected), M-1 (priority vs operationalPriority), M-2 (SEVERITY_COLORS type mismatch). | **PASS WITH ISSUES** |
| WS-3.3 | Adequate. Navigation sequence and store interactions correct. Reuse of `districtPreselectedAlertId` pattern validated. | `setDistrictPreselectedAlertId` verified (coverage.store.ts lines 196-199). `startMorph` guard verified (ui.store.ts line 104). | H-1 (handler placement contradiction), M-3 (page.tsx wiring gap). | **PASS WITH ISSUES** |
| WS-3.4 | Excellent. Minimal, focused, correctly preserves all existing behavior. Three files modified with bounded blast radius. | `MorphState` verified (morph-types.ts lines 76-88). `MorphActions` verified (lines 93-108). `MORPH_TIMING` values verified. `useMorphChoreography` forward flow verified. | 0 issues. | **PASS** |
| PHASE-3-OVERVIEW | Good. All 4 conflicts identified with correct resolutions. 5 gaps with actionable recommendations. | H-2 (incorrect claim about `useMorphChoreography` in page.tsx). Resolutions not propagated to SOW texts (systemic). | H-2 (factually incorrect codebase claim). | **PASS WITH ISSUES** |

---

## Issues Found

### HIGH Severity

#### H-1. WS-3.3 handler placement contradicts WS-3.2 callback design

WS-3.2 D-2 decouples CommandPalette from the coverage/district store via `onSearchResultSelect?: (result: SearchResult) => void` callback prop. WS-3.3 D-2 states the handler is "defined inside `CommandPalette.tsx`" with direct store imports. These are mutually exclusive.

**Fix:** Adopt WS-3.2 D-2 (callback prop pattern). Correct WS-3.3 D-2 to state the handler is defined in `page.tsx`. Add a formal deliverable to WS-3.3 specifying the page-level wiring.

#### H-2. Overview Gap 1 contains factually incorrect codebase claim

The overview states: "startMorph is available from useMorphChoreography() (already called in page.tsx)." This is wrong. `useMorphChoreography()` is called in `MorphOrchestrator`, not page.tsx. Page.tsx obtains `startMorph` directly from the Zustand store: `useUIStore((s) => s.startMorph)` at line 251.

**Fix:** Correct the overview text.

#### H-3. WS-3.2 hook integration code is structurally wrong (Conflict 1 not propagated)

WS-3.2 Section 4.8 shows `useIntelSearch(inputValue)` but WS-3.1 takes `IntelSearchParams` (an object) and returns `UseIntelSearchResult` (wrapping `{ queryResult, debouncedQuery }`). Would fail TypeScript compilation.

**Fix:** Update WS-3.2 Section 4.8 to `const { queryResult, debouncedQuery } = useIntelSearch({ query: inputValue })`.

### MEDIUM Severity

- **M-1:** `result.priority` should be `result.operationalPriority` in WS-3.2 (~4 locations). Overview Conflict 2 resolution not propagated.
- **M-2:** `SEVERITY_COLORS[result.severity]` type mismatch — `string` cannot index `Record<SeverityLevel, string>`. Missed by overview. Add `getSeverityColor(severity: string): string` helper.
- **M-3:** Page.tsx wiring for `onSearchResultSelect` unspecified in any SOW deliverable. Add to WS-3.3.
- **M-4:** WS-3.1 Section 1 mentions `useDeferredValue` but Section 4.8 rejects it. Fix objective text.
- **M-5:** WS-3.1 sized "S" in overview vs "M" in combined-recommendations. Reconcile.

### LOW Severity

- **L-1.** PriorityBadge `sm` width assumption (12px) for snippet indent — verify when WS-0.4 is implemented.
- **L-2.** Test infrastructure gap consistent with Phase 2 (M-6 from Phase 2 review recurs).
- **L-3.** `MORPH_TIMING_FAST.leavingDistrict` redundantly equals `MORPH_TIMING.leavingDistrict` — harmless but document the constraint.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | **OK** | AD-4 (fast morph 300ms) consistently implemented. AD-1 (achromatic priority) enforced. |
| SOW scopes do not overlap | **OK** | File modifications are non-conflicting. Sequential dependency on CommandPalette.tsx. |
| SOW scopes have no gaps | **ISSUE** | No SOW specifies page.tsx wiring for `onSearchResultSelect` (M-3). No SOW addresses `SEVERITY_COLORS` type mismatch (M-2). |
| Dependencies are bidirectionally consistent | **OK** | All dependency pairs verified. |
| Acceptance criteria are measurable | **ISSUE** | WS-3.1 and WS-3.4 reference unit/integration tests but no test runner is configured. |
| Open questions have owners and target phases | **OK** | 2 blocking OQs (backend) and 12 non-blocking OQs all have owners. |
| Effort estimates are internally consistent | **ISSUE** | WS-3.1 sized "S" in overview vs "M" in combined-recommendations (M-5). |
| File modifications across SOWs do not conflict | **OK** | Additive, non-conflicting changes with correct sequencing. |
| All codebase references verified | **ISSUE** | H-2: Overview incorrectly claims `useMorphChoreography()` is called in page.tsx. All other refs verified. |

---

## Blocking Assessment

**Blocking for next phase?** No

Phase 3 is a leaf phase with no downstream phase dependencies. All issues are correctable with text amendments.

**Required fixes before proceeding:**

1. **H-1:** Resolve handler placement contradiction. Adopt callback prop pattern (WS-3.2 D-2). Add page.tsx wiring deliverable to WS-3.3.
2. **H-2:** Correct overview Gap 1 codebase claim about `useMorphChoreography`.
3. **H-3:** Update WS-3.2 hook integration code to match WS-3.1's actual API shape.
4. **M-2:** Address `SEVERITY_COLORS` type mismatch with a helper function or cast pattern.

**Recommended fixes (non-blocking):**

1. **M-1:** Find-replace `result.priority` with `result.operationalPriority` in WS-3.2.
2. **M-3:** Add page.tsx wiring specification to WS-3.3 as a formal deliverable.
3. **M-4:** Correct WS-3.1 Section 1 to remove `useDeferredValue` reference.
4. **M-5:** Reconcile WS-3.1 sizing.
5. **L-2:** Amend ACs referencing unit tests to include fallback verification.
