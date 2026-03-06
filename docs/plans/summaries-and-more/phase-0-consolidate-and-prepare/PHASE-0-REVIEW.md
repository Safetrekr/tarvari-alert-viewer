# Phase 0 Review: Consolidate & Prepare

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-05
> **Documents Reviewed:** 6 (ws-0.1-simplify-coverage-overview-stats.md, ws-0.2-add-priority-types.md, ws-0.3-install-sonner.md, ws-0.4-create-priority-badge.md, PHASE-0-OVERVIEW.md, combined-recommendations.md)

## Review Verdict: PASS WITH ISSUES

All four SOWs and the Phase Overview are well-written, thorough, and correctly grounded in the codebase. No HIGH severity issues were found. Three MEDIUM issues require attention before implementation -- two are incorrect codebase references in WS-0.4 that could mislead the implementer, and one is an unresolved contradiction about test infrastructure that must be reconciled before WS-0.2 begins. Four LOW issues are informational and do not block execution.

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-0.1 | Excellent. All 4 deliverables specified with exact line refs. Decisions are well-reasoned. | 12/12 line references verified correct. | 0 issues. | **PASS** |
| WS-0.2 | Excellent. Type design is thorough with clear derivation pattern. All 8 decisions justified. | 5/5 structural references verified (SEVERITY_LEVELS pattern, file sections, getCategoryMeta fallback). | 1 LOW (shorthand file name inconsistency). | **PASS** |
| WS-0.3 | Excellent. Minimal scope correctly bounded. Z-index audit is thorough. | 4/4 layout references verified (ThemeProvider structure, defaultTheme, font variable). | 1 LOW (font variable name imprecision). | **PASS** |
| WS-0.4 | Good. Comprehensive visual spec. Well-calibrated opacity tiers. | 2 of 8 codebase references incorrect (cn() file attribution, opacity hover/base misattribution). | 2 MEDIUM, 1 LOW. | **PASS WITH ISSUES** |
| PHASE-0-OVERVIEW | Excellent. Clear synthesis. Gaps and recommendations are actionable. Scheduling advice is sound. | N/A (synthesis document). | 1 MEDIUM (test infrastructure gap needs resolution embedded in SOWs). | **PASS WITH ISSUES** |

---

## Issues Found

### HIGH Severity

None.

### MEDIUM Severity

#### M-1. WS-0.4 Section 4.7: Incorrect `cn()` file reference

WS-0.4 states: *"Use the `cn()` utility from `@/lib/utils` (consistent with CategoryCard line 276, CategoryDetailScene line 636)."*

**Actual finding:** `cn()` is NOT used anywhere in `CategoryCard.tsx` (file is 235 lines total; there is no line 276). The `cn()` usages at line 276 and line 635 (not 636) are both in `CategoryDetailScene.tsx`.

**Fix:** Correct to: *"Use the `cn()` utility from `@/lib/utils` (consistent with CategoryDetailScene lines 276 and 635)."*

---

#### M-2. WS-0.4 Section 4.4 (P1): Misattributes opacity 0.6 as a hover state

WS-0.4 states: *"CategoryCard hover button text goes to `rgba(255,255,255,0.6)` on hover, line 199-201."*

**Actual finding:** Line 200 of `CategoryCard.tsx` shows `style={{ color: 'rgba(255, 255, 255, 0.6)' }}` as the **base (default)** text color of the "View District" button. The **hover** state is `hover:text-white` in the className on line 199, which resolves to `rgba(255,255,255,1.0)`.

**Fix:** Correct to: *"CategoryCard button text defaults to `rgba(255,255,255,0.6)` (line 200), reaching white on hover (line 199 `hover:text-white`). P1 at 0.55 sits just below this base interactive text level, establishing it as an indicator rather than actionable text."*

---

#### M-3. Test infrastructure contradiction unresolved in SOW text

WS-0.2 acceptance criteria AC-2, AC-3, AC-5, and AC-6 require unit tests. WS-0.4 Section 2 ("Out of Scope > Tests") explicitly states: *"No test infrastructure (`pnpm test:unit` is not configured in this project)."*

The Phase Overview identifies this as Gap 1 and proposes alternatives. However, no resolution is embedded in the WS-0.2 SOW itself.

**Fix:** Add a note to WS-0.2 Section 5: *"If `pnpm test:unit` is not operational, verify AC-2 and AC-3 via `pnpm typecheck` + manual code inspection. Verify AC-5 and AC-6 via a temporary `.ts` script exercising the functions, or by setting up a minimal Vitest configuration (adds ~30 minutes)."*

---

### LOW Severity

- **L-1.** WS-0.4 Section 3: File length off by 1 (states 695 lines, actual 696).
- **L-2.** WS-0.3 Section 4.4: Font variable name imprecision (`--font-sans` vs actual `--font-geist-sans`; Tailwind `font-sans` class works correctly).
- **L-3.** WS-0.2: Inconsistent file name shorthand ("coverage.ts" vs full path "src/lib/interfaces/coverage.ts").
- **L-4.** Overview Gap 4 recommendation (OQ-1 default resolution) not embedded in WS-0.2.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | **OK** | AD-1, AD-5, AD-9 all consistently referenced. No contradictions. |
| SOW scopes do not overlap | **OK** | 4 SOWs touch 4 disjoint files + 1 new file. Zero overlap. |
| SOW scopes have no gaps (every requirement traced) | **OK** | All 4 Phase 0 items from Combined Recommendations covered. |
| Dependencies are bidirectionally consistent | **OK** | WS-0.2 blocks WS-0.4; WS-0.4 depends on WS-0.2. All downstream refs consistent. |
| Acceptance criteria are measurable | **ISSUE** | WS-0.2 AC-2/3/5/6 require unit tests but no test runner exists (see M-3). |
| Open questions have owners and target phases | **OK** | 12 OQs across 4 SOWs, all with owners and targets. |
| Effort estimates are internally consistent | **OK** | SOWs sum to 3.25-4.75h. Overview states 3.5-4.5h. Combined Recommendations: ~1 day. Compatible. |
| File modifications across SOWs do not conflict | **OK** | No merge conflict risk. |
| All codebase references (paths, types) are verified | **ISSUE** | 2 incorrect refs in WS-0.4 (M-1, M-2). All others verified. |

---

## Blocking Assessment

**Blocking for next phase?** No

**Required fixes before proceeding:**

1. **M-3:** Amend WS-0.2 acceptance criteria to specify alternative verification when test runner is absent.

**Recommended fixes (non-blocking):**

1. **M-1:** Correct `cn()` file reference in WS-0.4.
2. **M-2:** Correct opacity characterization in WS-0.4.
3. **L-4:** Embed OQ-1 default resolution in WS-0.2.
4. **L-3:** Use full file path consistently in WS-0.2.
