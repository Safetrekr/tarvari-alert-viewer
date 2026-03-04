# Phase 1 Review: Spatial Core + Login

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-02-25
> **Documents Reviewed:** 8 (`ws-1.1-zui-engine.md`, `ws-1.2-launch-atrium.md`, `ws-1.3-login-experience.md`, `ws-1.4-navigation-instruments.md`, `ws-1.5-telemetry-aggregator.md`, `ws-1.6-ambient-effects-layer.md`, `ws-1.7-core-interfaces.md`, `PHASE-1-OVERVIEW.md`)
> **Cross-Referenced Against:** 4 (`combined-recommendations.md`, `tech-decisions.md`, `VISUAL-DESIGN-SPEC.md`, `PHASE-0-REVIEW.md`)

---

## Review Verdict: PASS WITH ISSUES

**Rationale:** 1 HIGH severity issue with clear fix, 5 MEDIUM severity issues, 8 LOW severity issues. The Phase Overview identified 5 cross-workstream conflicts with sound resolutions. This review found 2 additional conflicts missed by the overview (H-1 and M-1). All issues have clear, actionable fix paths. Estimated total fix time: ~45 minutes.

---

## Per-SOW Assessment

| SOW                             | Completeness                                                   | Ecosystem Grounding                                              | Issues Found                                                | Rating           |
| ------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| WS-1.1 (ZUI Engine)             | 8/8 sections. 15 deliverables with full TS signatures. 17 ACs. | Excellent. AD-1, AD-2, AD-3 correctly referenced.                | 1 MEDIUM (Space key conflict), 1 LOW                        | PASS WITH ISSUES |
| WS-1.2 (Launch Atrium)          | 8/8 sections. 11 deliverable subsections. 26 ACs.              | Excellent. Capsule specs match VISUAL-DESIGN-SPEC.md.            | 2 LOW (type duplication, hook aliases — caught by Overview) | STRONG PASS      |
| WS-1.3 (Login Experience)       | 8/8 sections. 8 deliverable files. 13 ACs.                     | Good. Receipt stamp typography matches Section 3.4.              | 1 HIGH (import path), 1 LOW (styled-jsx)                    | PASS WITH ISSUES |
| WS-1.4 (Navigation Instruments) | 8/8 sections + 2 appendices. 7 files. 22 ACs.                  | Excellent. HUD typography matches spec. @tarva/ui usage correct. | 0                                                           | STRONG PASS      |
| WS-1.5 (Telemetry Aggregator)   | 8/8 sections + 3 appendices. Full route handler spec. 17 ACs.  | Excellent. Gap #3, Gap #7, AD-5 all correct.                     | 0                                                           | STRONG PASS      |
| WS-1.6 (Ambient Effects Layer)  | 8/8 sections. 6 effect components + hook + CSS. 20 ACs.        | Excellent. All effect values match Sections 5.1-5.6.             | 1 MEDIUM (usePanPause overlap)                              | PASS WITH ISSUES |
| WS-1.7 (Core Interfaces)        | 8/8 sections. 6 interfaces + 6 implementations. 16 ACs.        | Excellent. AD-7 interface contracts accurate.                    | 1 MEDIUM (health color token naming)                        | PASS WITH ISSUES |
| PHASE-1-OVERVIEW                | 10 sections. 5 conflicts, 8 gaps, 20 exit criteria.            | Excellent. Thorough cross-referencing.                           | Missed 2 conflicts (H-1, M-1)                               | STRONG PASS      |

---

## Issues Found

### HIGH Severity

#### H-1: WS-1.3 Uses Wrong Framer Motion Import Path

**Location:** `ws-1.3-login-experience.md` — passphrase-field.tsx and login-scene.tsx

**Problem:** WS-1.3 imports `from 'framer-motion'`. tech-decisions.md specifies `motion/react` v12+. WS-1.2 correctly uses `from 'motion/react'`.

**Fix:** Replace `from 'framer-motion'` with `from 'motion/react'` in both files. **FIXED.**

### MEDIUM Severity

#### M-1: WS-1.1 Specifies Space Key; WS-1.4 Explicitly Rejects It

**Problem:** WS-1.1 binds Space+Home for return-to-hub. WS-1.4 D-5 explicitly rejects Space (conflicts with scroll, button activation, text input).

**Fix:** Remove Space key references from WS-1.1. **FIXED.**

#### M-2: WS-1.1 Has Undeclared Dependency on WS-1.7 Types

**Problem:** Phase Overview resolves type duplication by making WS-1.7 canonical, but WS-1.1 doesn't list WS-1.7 as a dependency.

**Fix:** Add WS-1.7 as a soft dependency in WS-1.1 header.

#### M-3: Open Questions Tables Missing Owner in 4 of 7 SOWs

**Problem:** WS-1.1, WS-1.2, WS-1.3, WS-1.6 lack Owner and Resolution Deadline columns.

**Fix:** Add columns. Recurring pattern from Phase 0 L-7.

#### M-4: Health Color Token Naming Inconsistency

**Problem:** WS-1.7 uses `--status-success`, WS-1.2 uses `--color-healthy`. Same underlying values, different naming.

**Fix:** Standardize on Launch spatial tokens (`--color-healthy` etc.) in WS-1.7.

#### M-5: usePanPause Hook Defined by Both WS-1.1 and WS-1.6

**Problem:** Same hook, same file path, different return APIs (`isPanActive` vs `paused`).

**Fix:** Remove from WS-1.6, import from WS-1.1. **FIXED.**

### LOW Severity

| #   | Issue                                                                                                  | Fix                                                             |
| --- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| L-1 | VISUAL-DESIGN-SPEC ember-dim/muted values differ between Sections 1.5 and 6.1                          | Section 6.1 is canonical                                        |
| L-2 | WS-1.3 uses styled-jsx for component-scoped @keyframes                                                 | Verify availability in Next.js 16; fallback to CSS file         |
| L-3 | Three separate scanline implementations across WS-1.2/1.3/1.6                                          | Accept duplication for Phase 1; consider shared primitive later |
| L-4 | WS-1.2 creates `src/types/` not in AD-9                                                                | Import from `@/lib/interfaces/types` instead                    |
| L-5 | WS-1.2 HubCenterGlyph missing onClick prop for return-to-hub                                           | Add `onClick?: () => void`                                      |
| L-6 | VISUAL-DESIGN-SPEC telemetry value opacity: 0.8 in 3.2 vs 0.7 in 2.3                                   | Section 2.3 is the more specific spec                           |
| L-7 | WS-1.2 references `ZUIViewport`/`useZoomLevel()` (WS-1.1 names: `SpatialViewport`/`useSemanticZoom()`) | Use WS-1.1 canonical names                                      |
| L-8 | `(launch)/` vs AD-9's `(hub)/`                                                                         | Documented as Deviation #2                                      |

---

## Cross-Phase Consistency Check

| Check                                             | Status | Notes                                                                             |
| ------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| SOW decisions align with Combined Recommendations | OK     | All ADs (AD-1 through AD-9) correctly reflected.                                  |
| SOW decisions align with tech-decisions.md        | ISSUE  | WS-1.3 import path (H-1, FIXED). All other tech choices match.                    |
| SOW visual specs align with VISUAL-DESIGN-SPEC.md | OK     | 20+ token values spot-checked. Minor spec inconsistencies noted (L-1, L-6).       |
| SOW scopes do not overlap                         | ISSUE  | usePanPause (M-5, FIXED). @keyframes and types (Phase Overview Conflicts #1, #2). |
| SOW scopes have no gaps                           | OK     | All Phase 1 work areas covered.                                                   |
| Dependencies are bidirectionally consistent       | ISSUE  | WS-1.1 missing WS-1.7 dependency (M-2).                                           |
| Acceptance criteria are measurable                | OK     | 131 total ACs. All specify verification methods.                                  |
| Open questions have owners and target phases      | ISSUE  | 4 of 7 SOWs lack Owner column (M-3).                                              |
| Effort estimates are internally consistent        | OK     | 5-6 weeks realistic. Critical path acknowledged.                                  |
| File paths follow AD-9 project structure          | ISSUE  | WS-1.2 `src/types/` (L-4).                                                        |
| @tarva/ui component usage is consistent           | OK     | All SOWs reference @tarva/ui correctly.                                           |
| Design tokens match VISUAL-DESIGN-SPEC.md values  | OK     | Token naming convention inconsistency (M-4).                                      |

---

## Blocking Assessment

**Blocking for next phase?** No

**Required fixes before proceeding (applied):**

1. H-1: Fixed `framer-motion` → `motion/react` in WS-1.3
2. M-1: Fixed Space key removal from WS-1.1
3. M-5: Fixed usePanPause ownership (WS-1.1 canonical)

**Recommended fixes (non-blocking):**

- M-2: Add WS-1.7 soft dependency to WS-1.1 header
- M-3: Add Owner columns to OQ tables in 4 SOWs
- M-4: Standardize health color token naming
- L-1 through L-8: Minor cleanup (~10 min)
