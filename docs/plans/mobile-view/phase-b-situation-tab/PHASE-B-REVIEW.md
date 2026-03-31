# Phase B Review: Situation Tab

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-06
> **Documents Reviewed:** 4 (ws-b.1, ws-b.2, ws-b.3, PHASE-B-OVERVIEW)
> **Codebase Files Verified:** use-threat-picture.ts, use-priority-feed.ts, use-coverage-metrics.ts, coverage.ts, coverage-utils.ts, coverage.store.ts, ui.store.ts, settings.store.ts, ThreatPictureCard.tsx, morph-types.ts

## Review Verdict: PASS WITH ISSUES

The three SOWs are thorough, well-structured, and demonstrate strong codebase knowledge. Every file path, type name, function signature, and hook return shape was verified against the actual codebase and found accurate. However, **three blocking issues** must be resolved before implementation begins:

1. **Staleness hook and banner duplication** between WS-B.1 and WS-B.3
2. **Posture derivation duplication** between WS-B.1 and WS-B.3
3. **PostureLevel vocabulary incompatibility** -- WS-B.1 introduces `GUARDED` but codebase uses `MODERATE` and WS-A.3 tokens use `--posture-moderate-*`

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-B.1: Threat Banner + Priority | Excellent. 10 deliverables, 28 ACs, unit tests specified. | All references verified accurate. | 3 HIGH (PostureLevel vocab, staleness duplication, Resolves header), 1 MEDIUM (threshold divergence) | PASS WITH ISSUES |
| WS-B.2: Category Grid | Excellent. 9 deliverables, 26 ACs, 3 test files specified. | All references verified accurate. | 2 LOW (SeverityMiniBar naming, missing A.1 dependency) | PASS |
| WS-B.3: Ambient + Protective Ops | Excellent. 7 deliverables, 22 ACs, unit tests specified. | All references verified accurate. | 2 HIGH (staleness duplication, Resolves header), 1 MEDIUM (banner placement) | PASS WITH ISSUES |
| PHASE-B-OVERVIEW | Good. Correctly identifies Conflicts 1, 2, 4. | Accurate data hook verification. | 1 MEDIUM (Conflict 3 stale), 2 LOW (Gap 9.7 wrong, Gap 9.4 wrong) | PASS WITH ISSUES |

---

## Issues Found

### HIGH Severity

#### H-1: Staleness Hook and Banner Duplication Between WS-B.1 and WS-B.3 (BLOCKING)

**SOWs affected:** WS-B.1 (D-2 `useDataStaleness`, D-7 `MobileDataStaleBanner`), WS-B.3 (D-1 `useDataFreshness`, D-3 `DataStaleBanner`)

**Problem:** Both SOWs independently design a staleness hook and banner. They differ in hook name, queries monitored (2 vs 3), banner placement (tab-scoped vs shell-level), and component name.

**Fix:** Keep WS-B.3's `useDataFreshness` (monitors 3 queries, tri-state output) and `DataStaleBanner` at shell level (cross-tab visibility for C1). Remove `useDataStaleness` and `MobileDataStaleBanner` from WS-B.1.

#### H-2: Posture Derivation Duplication Between WS-B.1 and WS-B.3 (BLOCKING)

**SOWs affected:** WS-B.1 (D-1 `derivePosture`), WS-B.3 (D-5 `derivePostureLevel`)

**Problem:** Two functions with different names, file locations, input signatures, output types, and threshold values.

**Fix:** Keep WS-B.1's `derivePosture` in `src/lib/threat-utils.ts` (it also refactors desktop `ThreatPictureCard.tsx`). Delete `derivePostureLevel` and `posture-utils.ts` from WS-B.3. WS-B.3's `ThreatPulseBackground` receives posture as a prop.

#### H-3: PostureLevel Vocabulary Incompatibility (BLOCKING)

**SOWs affected:** WS-B.1 (D-1 `PostureLevel` type with `GUARDED`)

**Problem:** Codebase defines `ThreatLevel` with `MODERATE` at `coverage.ts` line 271. WS-A.3 tokens use `--posture-moderate-*`. No `--posture-guarded-*` token exists.

**Fix:** Use existing `ThreatLevel` type. Replace `GUARDED` with `MODERATE` throughout WS-B.1.

#### H-4: WS-B.1 Resolves Header Incorrectly Claims C1

**Fix:** After H-1 resolution, C1 belongs to WS-B.3. Update WS-B.1: `Resolves: C2 only`.

#### H-5: WS-B.3 Resolves Header Says "None" but Delivers C1 and C7

**Fix:** Update WS-B.3: `Resolves: protective-ops C1, C7`.

### MEDIUM Severity

#### M-1: Posture Derivation Threshold Values Diverge

**Problem:** WS-B.1 thresholds match desktop `ThreatPictureCard.tsx`. WS-B.3 thresholds are more aggressive. Requires product decision.

**Fix:** Use WS-B.1's existing thresholds for Phase B (matches desktop, avoids divergence).

#### M-2: Overview Conflict 3 (MobileStateView) Is Stale

**Problem:** Overview says MobileStateView is unassigned. It was added to WS-A.2 D-8 per Phase A Review H-3.

**Fix:** Update Overview Conflict 3 to RESOLVED. Mark OQ-B11 as RESOLVED.

#### M-3: Banner Placement Conflict (Auto-Resolved by H-1)

**Problem:** WS-B.1's banner is tab-scoped (scrolls away), violating C1 persistence requirement.

**Fix:** Resolved by H-1 (WS-B.3 owns staleness at shell level).

### LOW Severity

#### L-1: Overview Gap 9.7 Wrong -- WS-B.2 Has Unit Tests

WS-B.2 D-9 specifies 3 test files with 24 test cases. Remove Gap 9.7.

#### L-2: Overview Gap 9.4 Wrong -- WS-B.1 Handles `dataUpdatedAt === 0`

WS-B.1's hook explicitly checks `dataUpdatedAt > 0`. Correct Gap 9.4.

#### L-3: SeverityMiniBar Name Confusion

Uses priority data (p1Count/p2Count) not severity data. Consider renaming to `PriorityMiniBar`.

#### L-4: WS-B.2 Missing Explicit WS-A.1 Dependency

Transitive through WS-A.2. Non-blocking.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | OK | AD-1 respected. Risk 4 (context menu) addressed. Risk 10 (15 cards) addressed. |
| SOW scopes do not overlap | ISSUE | Staleness duplication (H-1). Posture duplication (H-2). |
| SOW scopes have no gaps | OK | MobileStateView in A.2 D-8. C1, C2, C7 covered. |
| Dependencies are bidirectionally consistent | ISSUE | Resolves headers incorrect (H-4, H-5). |
| Acceptance criteria are measurable | OK | 76 total ACs, all with concrete verification methods. |
| Open questions have owners and target phases | OK | 16 OQs, all assigned. |
| Effort estimates are internally consistent | OK | B.1: 8-12h, B.2: 8-10h, B.3: 4-6h. Total 20-28h. |
| File modifications across SOWs do not conflict | OK after H-1 | After resolution, only B.3 modifies MobileShell. |
| All codebase references verified | OK | Every reference verified accurate. |

---

## Blocking Assessment

**Blocking for next phase planning?** No -- Phase C planning can proceed.

**Required fixes before implementation:**
1. H-1: Resolve staleness duplication (B.3 owns hook + banner)
2. H-2: Resolve posture duplication (B.1 owns derivePosture)
3. H-3: Replace PostureLevel with ThreatLevel, GUARDED with MODERATE
4. H-4 + H-5: Update Resolves headers
5. M-1: Settle posture thresholds (recommend B.1's existing values)

**Required fixes to Overview:**
6. M-2: Mark Conflict 3 and OQ-B11 as RESOLVED
7. L-1: Remove Gap 9.7
8. L-2: Correct Gap 9.4

**Recommended fixes (non-blocking):**
9. L-3: Rename SeverityMiniBar to PriorityMiniBar
10. L-4: Add WS-A.1 to WS-B.2 dependencies
