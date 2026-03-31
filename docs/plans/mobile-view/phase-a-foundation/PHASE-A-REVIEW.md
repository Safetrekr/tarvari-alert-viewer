# Phase A Review: Foundation

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-06
> **Documents Reviewed:** 6 (ws-a.1, ws-a.2, ws-a.3, ws-a.4, PHASE-A-OVERVIEW, combined-recommendations)
> **Codebase Files Verified:** page.tsx, layout.tsx (launch), layout.tsx (root), spatial-tokens.css, globals.css, ui.store.ts, session-timecode.tsx, coverage.ts

## Review Verdict: PASS WITH ISSUES

The four SOWs are thorough, well-structured, and demonstrate deep codebase knowledge. Every line number reference, file path, and API claim was verified against the actual codebase and found accurate. The PHASE-A-OVERVIEW provides excellent cross-workstream analysis and correctly identifies the key conflicts. However, **two blocking issues** (glass value conflict with hardcoded CSS, and a dependency direction contradiction) must be resolved before implementation begins, and several medium-severity issues warrant attention.

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-A.1: Detection + Code Splitting | Excellent. All deliverables specified with exact file paths, line numbers, type signatures. 14 acceptance criteria. 6 decisions with rationale. | All line references verified: `page.tsx` is 743 lines, `LaunchPage` at line 167, `'use client'` at line 24, CSS imports at lines 102-107, `CoverageMapDynamic` at lines 29-32. All imports use `@/*` aliases. | 1 LOW (blocks WS-A.4 claim incorrect) | PASS |
| WS-A.2: Mobile Layout Shell | Excellent. 7 deliverables with full prop interfaces, CSS specifications, and visual specs. 16 acceptance criteria. Morph guard and landscape detection well-specified. | `resetMorph()` verified at ui.store.ts line 145-149. `SessionTimecode` verified: 160 lines, zero props, `memo()` wrapper, inline `position: 'fixed'`. `KNOWN_CATEGORIES` at coverage.ts line 45 confirmed. | 2 HIGH (glass hardcoding, dependency mismatch), 1 MEDIUM (mobile-shell.css import not explicit) | PASS WITH ISSUES |
| WS-A.3: Design Tokens + Ambient | Excellent. ~80 tokens with exact values, source references, and rationale. Appendix B maps every token to its consuming workstream. | Blur desktop values verified against spatial-tokens.css lines 159-162. `globals.css` import chain verified. `@theme` block structure verified. | 1 HIGH (glass value conflict with A.2), 1 MEDIUM (blur inconsistency), 1 MEDIUM (safe area token duplication) | PASS WITH ISSUES |
| WS-A.4: Viewport Meta + Safe Areas | Excellent for scope. Clean, minimal deliverables (3 files, ~15 lines). `100vh` audit exactly matches codebase reality. | No existing `Viewport` export confirmed. All 4 `100vh` usages confirmed at exact locations cited. | 1 LOW (WS-A.1 incorrectly claims to block this SOW) | PASS |

---

## Issues Found

### HIGH Severity

#### H-1: Glass Background Values -- WS-A.2 Hardcodes Instead of Using Tokens (BLOCKING)

**SOWs affected:** WS-A.2 (D-6 `mobile-shell.css`), WS-A.3 (Section 4.1h glass tokens)

**Problem:** WS-A.2's `mobile-shell.css` hardcodes `rgba(5, 9, 17, 0.92)` and `backdrop-filter: blur(16px) saturate(130%)` for both header and bottom nav. WS-A.3 defines glass tokens `--glass-header-bg: rgba(5, 9, 17, 0.85)` with `--glass-header-blur: blur(8px) saturate(120%)` and `--glass-nav-bg: rgba(5, 9, 17, 0.90)` with `--glass-nav-blur: blur(8px) saturate(120%)`.

**Fix recommendation:**
1. Settle authoritative values: use WS-A.3's values (header 0.85, nav 0.90, blur 8px). Creates a clear visual hierarchy (header < nav < sheet).
2. Update WS-A.2 D-6 to use `var()` token references instead of hardcoded values.
3. Update WS-A.2 DM-1 to reflect WS-A.3 as authoritative source.

#### H-2: Dependency Direction Contradiction (BLOCKING)

**SOWs affected:** WS-A.2, WS-A.3

**Problem:** WS-A.3 declares `Blocks: WS-A.2`. WS-A.2 declares `Depends On: WS-A.1` only. If WS-A.2 consumes tokens from WS-A.3, it depends on WS-A.3.

**Fix recommendation:** Update WS-A.2 header: `Depends On: WS-A.1, WS-A.3, WS-A.4`.

#### H-3: MobileStateView (AD-7) Not Assigned to Any SOW

**Problem:** `MobileStateView` is specified as a shared component that "should be built in Phase A or early Phase B." No Phase A SOW creates it.

**Fix recommendation:** Add to WS-A.2 as an addendum, or create WS-B.0.

#### H-4: No Automated Tests in Any SOW

**Problem:** `useIsMobile()` and the morph cancellation guard are textbook unit-testable but no test deliverables are specified.

**Fix recommendation:** Add test deliverables to WS-A.1 and WS-A.2.

### MEDIUM Severity

#### M-1: WS-A.3 Internal Blur Inconsistency

**Problem:** `--blur-active: 12px` (mobile override) but `--glass-sheet-blur: blur(16px)` uses desktop value.

**Fix:** Document as intentional exception (sheet uses full 16px for maximum glass fidelity).

#### M-2: Safe Area Token Duplication (WS-A.3 vs WS-A.4)

**Problem:** WS-A.4 defines `--safe-area-*` globally. WS-A.3 defines `--space-safe-area-*` in media query. Two naming conventions for same values.

**Fix:** Drop `--space-safe-area-*` from WS-A.3. Use WS-A.4's global tokens exclusively.

#### M-3: `globals.css` Modified by Both WS-A.3 and WS-A.4

**Problem:** Non-conflicting changes but needs insertion point coordination.

**Fix:** Add exact insertion point line numbers to both SOWs.

#### M-4: `mobile-shell.css` Import Location Not Explicit

**Problem:** WS-A.2 D-6 creates the CSS file but doesn't formally specify the import mechanism.

**Fix:** Add `import '@/styles/mobile-shell.css'` to WS-A.2 D-2 (MobileShell component).

### LOW Severity

#### L-1: WS-A.1 Incorrectly Claims to Block WS-A.4

WS-A.4 has no dependency on WS-A.1. Remove WS-A.4 from WS-A.1's "Blocks" list.

#### L-2: HydrationShell in `src/components/mobile/`

Acceptable as-is. Add JSDoc note clarifying it serves all users during detection.

#### L-3: SessionTimecode Line Count

WS-A.2 says "120+ lines", actual is 160 lines. Update for accuracy.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | ISSUE | Glass values diverge (H-1). AD-7 MobileStateView unassigned (H-3). |
| SOW scopes do not overlap | OK | Each SOW has distinct, well-bounded scope. |
| SOW scopes have no gaps (every requirement traced) | ISSUE | MobileStateView (AD-7) not covered. |
| Dependencies are bidirectionally consistent | ISSUE | WS-A.2 <-> WS-A.3 mismatch (H-2). WS-A.1 -> WS-A.4 false claim (L-1). |
| Acceptance criteria are measurable | OK | 55 total ACs, all with concrete verification methods. |
| Open questions have owners and target phases | OK | 12 OQs, each with assigned owner and target. |
| Effort estimates are internally consistent | OK | A.1 (S, 2-3h), A.4 (S, 1-2h), A.3 (M, 4-6h), A.2 (M, 6-8h). Total 13-19h. |
| File modifications across SOWs do not conflict | ISSUE | `globals.css` modified by WS-A.3 and WS-A.4 (M-3). Non-conflicting content. |
| All codebase references (paths, types) are verified | OK | Every file path, line number, function name verified. All accurate. |

---

## Blocking Assessment

**Blocking for next phase?** No -- but blocking for implementation start.

**Required fixes before proceeding to implementation:**
1. H-1: Settle glass values, update WS-A.2 to use token references
2. H-2: Update WS-A.2 dependencies to include WS-A.3 and WS-A.4
3. L-1: Remove WS-A.4 from WS-A.1 blocks list

**Required fixes before Phase B begins:**
4. H-3: Assign MobileStateView to WS-A.2 or create WS-B.0
5. H-4: Add test deliverables to WS-A.1 and WS-A.2

**Recommended fixes (non-blocking):**
6. M-1: Document blur exception in WS-A.3
7. M-2: Drop `--space-safe-area-*` from WS-A.3
8. M-3: Add `globals.css` insertion coordinates to both SOWs
9. M-4: Specify `mobile-shell.css` import in WS-A.2 D-2
10. L-2: Add JSDoc to HydrationShell
11. L-3: Fix line count in WS-A.2 DM-3
