# Phase 5 Review: Enhanced Filters

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-05
> **Documents Reviewed:** 3 (ws-5.1, ws-5.2, PHASE-5-OVERVIEW.md)

## Review Verdict: PASS WITH ISSUES

Phase 5 is a well-scoped, cleanly decomposed 2-workstream phase with sound architecture. The SOWs are thorough, the codebase references are accurate with minor exceptions, and the cross-workstream dependency is correctly identified and sequenced. Three issues require attention before implementation: one HIGH (incorrect JSDoc endpoint), one MEDIUM (missing explicit DistrictViewContent modification scope), and one MEDIUM (ref type inconsistency between SOWs).

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-5.1 | Excellent. All deliverables explicit. ~12 lines of change, zero ambiguity. | 4/5 — JSDoc draft has wrong endpoint path. | H-1 (incorrect JSDoc endpoint). | **PASS** |
| WS-5.2 | Good. 7 deliverables, 20 ACs, 8 decisions. | 4/5 — Minor ref type inconsistency. | M-1 (missing DistrictViewContent mod), M-2 (ref type). | **PASS WITH ISSUES** |
| OVERVIEW | Excellent. Conflict identified and resolved. 30 exit criteria. | 4/5 — keepPreviousData forward reference. | L-1 (forward reference). | **PASS** |

---

## Issues Found

### HIGH Severity

#### H-1. WS-5.1 JSDoc draft perpetuates incorrect endpoint path

WS-5.1 Section 4.5 JSDoc update draft says "Fetches geo-located intel items from the TarvaRI backend API (`/console/intel/locations`)" but the actual endpoint at line 66 of `use-coverage-map-data.ts` is `/console/coverage/map-data`.

**Fix:** Change JSDoc to reference `/console/coverage/map-data`. Also fix the existing incorrect JSDoc at line 8 as part of WS-5.1.

### MEDIUM Severity

- **M-1:** WS-5.2 omits explicit DistrictViewContent modification from deliverables. The ref threading path is `DistrictViewOverlay -> DistrictViewContent -> CategoryDetailScene -> CoverageMap` but DistrictViewContent's props interface change is not listed. Add explicit deliverable.
- **M-2:** Ref type inconsistency — CoverageMapProps uses `React.Ref<MapRef>` but downstream consumers expect `React.RefObject<MapRef | null>`. Standardize on `React.RefObject<MapRef | null>`.
- **M-3:** WS-5.2 R-1 impact rated HIGH but WS-5.1 is a hard prerequisite. Re-rate as LOW.

### LOW Severity

- **L-1.** Overview forward-references Phase 4's `keepPreviousData` usage as established pattern, but Phase 4 is not yet built.
- **L-2.** BBox type inconsistency between WS-5.1 and WS-5.2 already documented as Conflict 1 in overview with clear resolution.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | **OK** | Backend B.3 dependency, scope, and sizing all consistent. |
| SOW scopes do not overlap | **OK** | Clean separation: WS-5.1 = hook, WS-5.2 = UI + store. |
| SOW scopes have no gaps | **ISSUE** | DistrictViewContent modification not explicitly scoped (M-1). |
| Dependencies are bidirectionally consistent | **OK** | WS-5.1 blocks WS-5.2, correctly documented both ways. |
| Acceptance criteria are measurable | **OK** | 32 ACs total, all testable. |
| Open questions have owners and target phases | **OK** | 9 OQs, all assigned. |
| Effort estimates are internally consistent | **OK** | 1.5-2.0 days matches combined-recommendations ~1-2 days. |
| File modifications across SOWs do not conflict | **OK** | Only WS-5.1 modifies use-coverage-map-data.ts. |
| All codebase references verified | **ISSUE** | H-1: JSDoc endpoint mismatch. All other 20+ refs verified. |

---

## Blocking Assessment

**Blocking for next phase?** No

**Required fixes before proceeding:**

1. **H-1:** Fix JSDoc endpoint reference in WS-5.1 Section 4.5.

**Recommended fixes (non-blocking):**

1. **M-1:** Add DistrictViewContent props modification to WS-5.2 deliverables.
2. **M-2:** Standardize ref type across WS-5.2 deliverables.
3. **M-3:** Re-rate WS-5.2 R-1 impact from HIGH to LOW.
