# Phase 4 Review: Geographic Intelligence

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-05
> **Documents Reviewed:** 7 (ws-4.1 through ws-4.6, PHASE-4-OVERVIEW.md)

## Review Verdict: PASS WITH ISSUES

The Phase 4 specification set is thorough, well-structured, and architecturally sound. The PHASE-4-OVERVIEW.md provides exceptional cross-workstream synthesis, proactively identifying 6 conflicts and providing clear resolutions. Codebase references are precise -- line numbers check out across all SOWs with only trivial discrepancies. One HIGH issue requires a specification fix before implementation. Three MEDIUM issues need clarification. Several LOW issues are informational or self-resolving.

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-4.1 | Excellent. Clean data hook spec. Types, normalizer, query config all well-defined. | All refs verified: `tarvariGet` signature, `emptyThreatPicture()` follows `emptyMetrics()` pattern. | 0 issues. | **PASS** |
| WS-4.2 | Excellent. Two-hook design well-justified. Defensive JSON.parse appropriate. | Pattern verified against existing hooks. | 0 issues. | **PASS** |
| WS-4.3 | Good. Comprehensive panel spec. 35 ACs. | Codebase refs verified. | M-1 (mutual exclusion scope claim), M-2 (single vs two hooks), M-3 (Escape handler). | **PASS WITH ISSUES** |
| WS-4.4 | Good. Line refs verified (171-174, 148-155, 177-191, 283-286). | Correct. | L-1 (field name mismatch). | **PASS** |
| WS-4.5 | Good. Correctly declares WS-0.1 dependency. Amber accent justified. | Current stats layout verified. | 0 issues. | **PASS** |
| WS-4.6 | Good. Store extension well-designed. Mutual exclusion Strategy B correct. | Immer patterns verified. | H-1 (openGeoSummary default params), M-4 (action count). | **PASS WITH ISSUES** |
| OVERVIEW | Excellent. 6 conflicts, 7 gaps, clear resolutions. | N/A. | 0 unique issues. | **PASS** |

---

## Issues Found

### HIGH Severity

#### H-1. `openGeoSummary` implementation contradicts "resume on reopen" behavior (WS-4.6)

D-2 states: "openGeoSummary defaults to ('world', 'world') but preserves prior state on reopen." D-4 states: "closeGeoSummary preserves level/key/type." But the implementation always overwrites state with argument defaults — calling `openGeoSummary()` without args supplies `level='world'` and `key='world'`, overwriting preserved state. AC-10 (reopen-resume test) would FAIL.

**Fix:** Use `undefined` as default rather than `'world'`. When no args provided, only set `geoSummaryOpen = true` without touching level/key. Distinguish "no args" (resume) from "explicit args" (navigate).

### MEDIUM Severity

- **M-1:** WS-4.3 scope says "Opening panel while district view is active closes district view first." But WS-4.6 Direction 2 says `openGeoSummary` is a no-op during non-idle morph. Correct WS-4.3 to match.
- **M-2:** WS-4.3 assumes single `useGeoSummaries` hook but WS-4.2 delivers two (`useLatestGeoSummary` + `useGeoSummaryHistory`). Update component structure.
- **M-3:** Escape key priority chain update split across SOWs without clear code ownership. Add explicit page.tsx handler code to WS-4.3.
- **M-4:** WS-4.6 R-3 action count is inaccurate (9 actions, not 8). Minor.

### LOW Severity

- **L-1.** WS-4.4 page wiring uses `trendByCategory` but WS-4.1 type is `byCategory`. Already flagged in overview OQ-5.
- **L-2.** WS-4.6 does not list `useUIStore` as a new import for coverage.store.ts.
- **L-3.** WS-4.5 references WS-2.3 separator pattern (forward ref to potentially unimplemented phase).
- **L-4.** WS-4.6 `isValidGeoRegionKey` cast pattern is standard TypeScript. Informational.
- **L-5.** WS-4.3 `aria-modal="false"` with `role="dialog"` is atypical. Consider `role="complementary"`.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | **OK** | AD-3, AD-7, AD-8, R10 all consistently implemented. |
| SOW scopes do not overlap | **OK** | Clean file ownership across SOWs. |
| SOW scopes have no gaps | **ISSUE** | Escape handler update not explicitly assigned (M-3). |
| Dependencies are bidirectionally consistent | **OK** | All dependency pairs verified. |
| Acceptance criteria are measurable | **OK** | 35 ACs for WS-4.3 alone. All testable. |
| Open questions have owners and target phases | **OK** | 2 blocking OQs (backend), 17 non-blocking, all assigned. |
| Effort estimates are internally consistent | **ISSUE** | Combined-recommendations sizes WS-4.1/4.2 as M; SOWs self-assess as S. Overview aligns with S. |
| File modifications across SOWs do not conflict | **OK** | Additive changes with correct sequencing. |
| All codebase references verified | **OK** | All line numbers verified against source. |

---

## Blocking Assessment

**Blocking for next phase?** No

**Required fixes before proceeding:**

1. **H-1:** Fix `openGeoSummary` default parameter behavior to preserve state on no-arg reopen.

**Recommended fixes (non-blocking):**

1. **M-1:** Correct WS-4.3 mutual exclusion scope claim.
2. **M-2:** Update WS-4.3 to reference both hooks from WS-4.2.
3. **M-3:** Add explicit Escape handler update code to WS-4.3.
