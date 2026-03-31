# Phase E Review: Intel Tab + Search

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-06
> **Documents Reviewed:** 4 (ws-e.1, ws-e.2, ws-e.3, PHASE-E-OVERVIEW)
> **Codebase Files Verified:** `coverage.store.ts`, `ui.store.ts`, `coverage.ts` (interfaces), `coverage-utils.ts`, `use-intel-feed.ts`, `use-intel-bundles.ts`, `use-geo-summaries.ts`, `use-intel-search.ts`, `use-category-intel.ts`, `use-priority-feed.ts`, `time-utils.ts`, `morph-types.ts`, `ViewModeToggle.tsx`, `PriorityBadge.tsx`, `intel-bundles.ts`

## Review Verdict: PASS WITH ISSUES

All three SOWs are thorough and well-structured. **Two blocking issues** must be resolved: THREAT_LEVEL_COLORS duplicate definition (OVERVIEW Conflict 1) and REGION_CENTROIDS keys misaligned with GEO_REGION_KEYS (NOT caught by OVERVIEW).

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-E.1 | Excellent | Strong | H-1, M-3, M-5, M-6 | PASS with fixes |
| WS-E.2 | Excellent | Strong | H-1, M-2, L-1, L-2 | PASS with fixes |
| WS-E.3 | Excellent | Mixed (REGION_CENTROIDS wrong) | H-2, M-1, M-4 | PASS with fixes |
| PHASE-E-OVERVIEW | Excellent | Strong | Missed H-2 | PASS |

---

## Issues Found

### HIGH Severity

#### H-1: THREAT_LEVEL_COLORS duplicate definition -- BLOCKING (OVERVIEW Conflict 1)

E.1 creates `THREAT_LEVEL_COLORS` at `src/lib/threat-level-colors.ts` using `--posture-*` tokens. E.2 creates it at `src/lib/interfaces/coverage.ts` using `--threat-*` tokens with different hex fallbacks for HIGH and MODERATE.

**Fix:** Single definition in `src/lib/interfaces/coverage.ts` with `--posture-*` tokens and E.1's hex fallbacks. Delete `src/lib/threat-level-colors.ts` from E.1.

#### H-2: REGION_CENTROIDS keys do not match GEO_REGION_KEYS -- BLOCKING (NOT caught by OVERVIEW)

E.3 defines 14 region keys (e.g., `east-africa`, `west-africa`, `southeast-asia`). The codebase defines 11 keys (e.g., `sub-saharan-africa`, `east-southeast-asia`). Only 4 keys overlap. TypeScript `Record<GeoRegionKey, ...>` will reject at compile time.

**Fix:** Rewrite REGION_CENTROIDS to use exactly the 11 GEO_REGION_KEYS. Update unit tests T-10, T-11.

### MEDIUM Severity

#### M-1: E.3 MobileIntelTab integration missing required props
**Fix:** Add `onSearchPress`, `onRegionTap`, `scrollRef` props.

#### M-2: Adapter file directory inconsistency
**Fix:** Standardize on `src/lib/adapters/` directory.

#### M-3: MobileIntelTab prop interface gap (E.1 vs E.3)
**Fix:** Pre-define cross-tab handler props as optional in E.1's interface.

#### M-4: MOBILE_TABS/DEFAULT_MOBILE_TAB constants may not exist
**Fix:** Add to `src/lib/interfaces/mobile.ts` during E.3 implementation.

#### M-5: MobileStateView still undelivered (6th phase flagging)
**Fix:** Implement minimal version as E.1 prerequisite.

#### M-6: E.1 "Blocks" header missing WS-E.2
**Fix:** Amend E.1 "Blocks" to include WS-E.2.

### LOW Severity

#### L-1: E.2 objective uses wrong adapter function name
#### L-2: E.2 CSS uses glass tokens not listed in Depends On
#### L-3: E.3 test file location inconsistency

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| Phase A token refs | OK | All token names consistent with WS-A.3. |
| Phase B component refs | OK | `derivePosture` and `PostureConfig` from WS-B.1 correctly referenced. |
| Phase C bottom sheet API | OK | Config-based API, integer snap points, `ariaLabel` all consistent. |
| Phase D component refs | OK | `MobileAlertCard` props match D.2 interface (post-fixes). |
| Phase D handler refs | OK | `navigateToMap` signature matches D.3 D-6 (post-fixes). |
| REGION_CENTROIDS vs GEO_REGION_KEYS | FAIL | E.3 uses wrong keys. See H-2. |
| THREAT_LEVEL_COLORS consistency | FAIL | Duplicate definitions. See H-1. |
| Store action signatures | OK | All verified against stores. |
| MobileStateView gap | ISSUE | 6th consecutive phase flagging (M-5). |

---

## Blocking Assessment

**Blocking for Phase F planning?** No.

**Required fixes before implementation:**
1. H-1: Single `THREAT_LEVEL_COLORS` in `coverage.ts` with `--posture-*` tokens
2. H-2: Rewrite `REGION_CENTROIDS` with correct 11 `GEO_REGION_KEYS`

**Recommended fixes:**
3. M-1: Add missing props to E.3 MobileIntelTab integration
4. M-2: Standardize adapter directory
5. M-3: Pre-define cross-tab props in E.1 interface
6. M-4: Ensure MOBILE_TABS constant exists
7. M-5: Deliver MobileStateView
8. M-6: Fix E.1 Blocks header
