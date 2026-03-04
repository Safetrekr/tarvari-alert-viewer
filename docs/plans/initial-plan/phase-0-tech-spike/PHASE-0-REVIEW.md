# Phase 0 Review: Tech Spike & Setup

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-02-25
> **Documents Reviewed:** 4 (`ws-0.1-project-scaffolding.md`, `ws-0.2-design-tokens-setup.md`, `ws-0.3-zui-tech-spike.md`, `PHASE-0-OVERVIEW.md`)
> **Cross-Referenced Against:** 3 (`combined-recommendations.md`, `tech-decisions.md`, `VISUAL-DESIGN-SPEC.md`)

---

## Review Verdict: PASS WITH ISSUES

**Rationale:** 0 HIGH severity issues, 4 MEDIUM severity issues, 8 LOW severity issues. All issues have clear, actionable fix paths. None are blocking for Phase 0 execution — they can be resolved in a single editing pass before implementation begins. Estimated total fix time: ~20 minutes.

---

## Per-SOW Assessment

| SOW                          | Completeness                                                                                           | Ecosystem Grounding                                                                                                                          | Issues Found    | Rating           |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------- |
| WS-0.1 (Project Scaffolding) | 8/8 sections, all substantive. 20 deliverable subsections with exact file contents. 12 measurable ACs. | Excellent. Matches Agent Builder patterns for tsconfig, eslint, prettier, globals.css, layout.tsx, ThemeProvider. References AD-9 correctly. | 3 LOW           | STRONG PASS      |
| WS-0.2 (Design Tokens Setup) | 8/8 sections, all substantive. 4 deliverable files with exact contents. 9 ACs.                         | Excellent. All 99 token values match VISUAL-DESIGN-SPEC.md Section 6.1 exactly.                                                              | 3 MEDIUM, 2 LOW | PASS WITH ISSUES |
| WS-0.3 (ZUI Tech Spike)      | 8/8 sections + 3 appendices. 12 deliverable files with TypeScript signatures. 13 measurable ACs.       | Excellent. Camera store matches AD-1, semantic zoom matches AD-2, three-tier animation matches AD-3.                                         | 3 LOW           | STRONG PASS      |
| PHASE-0-OVERVIEW             | 10/10 sections. 5 conflicts identified with resolutions. 10 exit criteria traced to SOW ACs.           | Excellent. Consolidates all decisions, risks, and open questions.                                                                            | 1 MEDIUM        | STRONG PASS      |

---

## Issues Found

### HIGH Severity

None.

### MEDIUM Severity

#### M-1: WS-0.2 `layout.tsx` Omits QueryProvider

**Location:** `ws-0.2-design-tokens-setup.md` Section 4.4

**Problem:** WS-0.2 provides a complete `src/app/layout.tsx` that wraps children in `ThemeProvider` only. WS-0.1's version wraps children in `ThemeProvider` > `QueryProvider`. If the implementer treats WS-0.2 as a full file replacement, `QueryProvider` will be silently dropped.

**Impact:** TanStack Query hooks (e.g., telemetry polling in Phase 1) will fail with "No QueryClient set" errors.

**Fix:** Add `QueryProvider` import and wrapping to WS-0.2's `layout.tsx`. **FIXED.**

#### M-2: WS-0.2 References "Next.js 15" Instead of "Next.js 16"

**Location:** `ws-0.2-design-tokens-setup.md` Section 3, line 50

**Problem:** Says "Next.js 15 project" but the stack is Next.js 16 per tech-decisions.md and WS-0.1's package.json.

**Fix:** Change "Next.js 15" to "Next.js 16". **FIXED.**

#### M-3: No Explicit File Modification Protocol Between SOWs

**Location:** Affects all three SOWs and `PHASE-0-OVERVIEW.md`

**Problem:** Three files are created by WS-0.1 and then modified/replaced by later workstreams (`globals.css`, `layout.tsx`, `camera.store.ts`). No SOW states whether its deliverables REPLACE or MERGE with existing files.

**Fix:** Add a "File Modification Convention" section to PHASE-0-OVERVIEW.md. **FIXED.**

#### M-4: WS-0.2 Uses "npm run dev" Instead of "pnpm dev"

**Location:** `ws-0.2-design-tokens-setup.md` Section 4.5 and Section 5

**Problem:** Verification checklist and acceptance criteria use `npm run dev` instead of `pnpm dev` (the project's package manager per tech-decisions.md).

**Fix:** Replace `npm run dev` with `pnpm dev`. **FIXED.**

### LOW Severity

| #   | Issue                                                                                         | Location                                    | Fix                                     |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------- |
| L-1 | WS-0.3 spike page path missing `src/` prefix                                                  | WS-0.3 Section 4.1.5                        | Add `src/` prefix                       |
| L-2 | WS-0.1 directory tree missing `src/styles/`                                                   | WS-0.1 Section 4.1                          | Add `styles/` directory                 |
| L-3 | Spacing token naming prefix inconsistency (`--space-*` vs `--spacing-*`) undocumented in code | WS-0.2 Section 4.1 vs 4.2                   | Add comment explaining dual naming      |
| L-4 | `camera.store.ts` API surface mismatch between WS-0.1 and WS-0.3                              | WS-0.1 Section 4.18 vs WS-0.3 Section 4.1.1 | Add replacement note to WS-0.1 skeleton |
| L-5 | WS-0.3 Blocks list incomplete (missing WS-1.2, WS-1.6)                                        | WS-0.3 header                               | Update Blocks list                      |
| L-6 | WS-0.1 ThemeProvider uses redundant `defaultTheme` alongside `forcedTheme`                    | WS-0.1 Section 4.11                         | Remove `defaultTheme`                   |
| L-7 | WS-0.2 Open Questions table missing Owner column                                              | WS-0.2 Section 7                            | Add Owner and Target Phase columns      |
| L-8 | WS-0.3 Appendix A marks `camera.store.ts` as "Create" instead of "Replace"                    | WS-0.3 Appendix A                           | Change to "Replace"                     |

---

## Cross-Phase Consistency Check

| Check                                              | Status | Notes                                                                              |
| -------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| SOW decisions align with Combined Recommendations  | OK     | All ADs (AD-1, AD-2, AD-3, AD-9) correctly reflected. Gap Resolution #1 confirmed. |
| SOW decisions align with tech-decisions.md         | OK     | Core stack matches exactly. Exception: WS-0.2 said "Next.js 15" (fixed via M-2).   |
| SOW visual specs align with VISUAL-DESIGN-SPEC.md  | OK     | 99/99 CSS custom properties match Section 6.1 exactly.                             |
| SOW scopes do not overlap                          | OK     | Clear separation. Shared files addressed by M-3.                                   |
| SOW scopes have no gaps (every requirement traced) | OK     | All Phase 0 requirements covered.                                                  |
| Dependencies are bidirectionally consistent        | OK     | Minor: WS-0.3 Blocks list incomplete (L-5).                                        |
| Acceptance criteria are measurable                 | OK     | All ACs have CLI commands, computed style checks, or quantitative thresholds.      |
| Open questions have owners and target phases       | ISSUE  | WS-0.2 OQs missing Owner column (L-7). Phase Overview compensates.                 |
| Effort estimates are internally consistent         | OK     | PMO assessment realistic. Critical path 5-7 days acknowledged as tight.            |
| File paths follow AD-9 project structure           | ISSUE  | WS-0.3 spike page missing `src/` prefix (L-1). WS-0.1 missing `src/styles/` (L-2). |
| @tarva/ui component usage is consistent            | OK     | All SOWs reference @tarva/ui correctly. No "shadcn" references.                    |
| Design tokens match VISUAL-DESIGN-SPEC.md values   | OK     | 99/99 tokens verified exact match.                                                 |

---

## Blocking Assessment

**Blocking for next phase?** No

**Required fixes before proceeding:** All 4 MEDIUM issues have been fixed in this review cycle.

**Recommended fixes (non-blocking):** L-1 through L-8 are minor cleanup items (~10 min total). Can be addressed during Phase 1 planning or deferred to implementation.
