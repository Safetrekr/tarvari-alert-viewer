# Phase 3 Review: Detail + Chrome

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-04
> **Documents Reviewed:** 5 (`ws-3.1-district-view-adaptation.md`, `ws-3.2-chrome-and-panels.md`, `PHASE-3-OVERVIEW.md`, `combined-recommendations.md`, `phase-2-core-ui/PHASE-2-REVIEW.md`)
> **Codebase Files Spot-Checked:** 14 (`district-view-content.tsx`, `district-view-overlay.tsx`, `district-view-dock.tsx`, `district-view-header.tsx`, `detail-panel.tsx`, `district-content.tsx`, `top-telemetry-bar.tsx`, `bottom-status-strip.tsx`, `Minimap.tsx`, `system-status-panel.tsx`, `signal-pulse-monitor.tsx`, `feed-panel.tsx`, `activity-ticker.tsx`, `constants.ts`)

## Review Verdict: PASS WITH ISSUES

Both SOWs demonstrate exceptional codebase grounding with 35+ verified line-number references across 14 source files, 53 combined acceptance criteria, 12 design decisions with alternatives considered, 9 open questions with owners and recommendations, and 14 proactive risk identifications. The overview provides thorough synthesis including a conflict analysis that correctly concludes the two workstreams touch entirely disjoint file sets, enabling true parallel execution.

WS-3.1 is the higher-risk, higher-value workstream that creates the most complex new component in the project (`CategoryDetailScene` with four data sections, three loading states, and accessibility requirements) while also resolving the Phase 2 Review H-1 issue. WS-3.2 is lower-risk with well-specified cosmetic and positioning changes. The overview correctly identifies WS-3.1 as on the critical path and WS-3.2 as off it.

The primary concerns are pre-existing carried-forward blockers (OQ-07 from Phase 1, the `CategoryMeta.description` gap from WS-1.2) rather than issues with the Phase 3 planning itself, plus the recurring absence of test deliverables (third consecutive phase).

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-3.1 District View Adaptation | Exceptional. 7 deliverable groups, 33 ACs, 6 decisions, 5 OQs, 8 risks. Creates 1 new component, rewrites 5 files, archives 6 files. H-1 resolution is thorough and well-reasoned. | Exceptional. 20+ line references verified across 6 files. All accurate within +/-1 line. Two minor off-by-one discrepancies (detail-panel.tsx line 25 vs stated 26; content.tsx line range 12-20 includes PanelSide import). | 1 MEDIUM (detail-panel line refs assume pre-WS-2.2 state), 2 LOW (off-by-one line refs, D-4 rationale error) | A |
| WS-3.2 Chrome & Panels | Excellent. 6 deliverable groups, 20 ACs, 6 decisions, 4 OQs, 6 risks. 8 file modifications with exact before/after code blocks. | Exceptional. 15+ line references verified across 8 files. All accurate. Panel position math independently verified correct. | 0 new issues (all pre-existing) | A |

## Issues Found

### HIGH Severity

None new. Two pre-existing HIGH issues remain unresolved and are correctly carried forward:

**H-1 (Carried): OQ-07 `intel_sources.id` column ambiguity (Phase 1 Review H-1)**
This is now in its third phase of carry-forward. WS-3.1's `CategoryDetailScene` source health table renders `SourceCoverage` data derived from `intel_sources`. The overview correctly escalates this as "blocking for WS-3.1" in Section 6 with a concrete resolution action (run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'intel_sources'`). Three phases of delay on a blocking schema verification is a project management concern.

**H-2 (Carried): `CategoryMeta.description` field not confirmed in WS-1.2 (Overview Gap 1)**
WS-3.1 extensively uses `getCategoryMeta(id).description` in the scene (Section 4.1), dock (Section 4.4), and H-1 fix (Section 4.6). The `CategoryMeta` interface from WS-1.2 was never explicitly verified to include `description: string`. Combined-recommendations mentions "display name, color, and icon" but not "description." The overview correctly identifies this as a blocking pre-condition for WS-3.1.

### MEDIUM Severity

**M-1: `detail-panel.tsx` line references assume pre-WS-2.2 state**
WS-3.1 Section 3 verifies `detail-panel.tsx` line numbers (import at line 25, render at line 149) against the current codebase. However, WS-2.2 modifies this file (the Phase 2 SOW rewrites the panel's positioning, props, and motion logic). After WS-2.2 executes, line 25 and 149 will almost certainly have shifted. The SOW's Risk R-3 acknowledges this ("Read the actual file at implementation time; adapt the H-1 fix to the actual state"), which is appropriate mitigation, but the overview presents these numbers as "verified" without noting they are pre-WS-2.2 values. This could cause confusion during implementation.

**Required action:** Add a note to WS-3.1 Section 4.6 and Overview Section 2.3 stating that line references for `detail-panel.tsx` are against the pre-WS-2.2 state and must be re-verified after WS-2.2 completes.

**M-2: No test deliverables (recurring, third consecutive phase)**
Neither WS-3.1 nor WS-3.2 includes test files as formal deliverables. `CategoryDetailScene` is the most complex new component in the project (four data sections, three loading states, accessibility requirements) and is the strongest candidate for unit tests across all four phases. The overview correctly identifies this as Gap 3.

**M-3: `CoverageByCategory` field shape not verified against WS-1.3**
WS-3.1 accesses `categoryData.sourceCount`, `categoryData.activeSources`, and `categoryData.geographicRegions` from the `CoverageByCategory` type. The overview correctly flags this as Gap 2 but offers no blocking gate. If these field names differ from WS-1.3's implementation, the dock and scene will fail at runtime.

### LOW Severity

- **L-1:** WS-3.1 Section 4.2.1 line range "12-20" includes PanelSide import at line 12 which must NOT be removed. Code example correctly shows only lines 13-20.
- **L-2:** WS-3.1 Section 4.6.2 says "line 26" but actual DistrictContent import is at line 25. Internal inconsistency.
- **L-3:** WS-3.1 Decision D-4 rationale incorrectly claims WS-3.2 touches district-view files. The overview Section 3 correctly establishes they do NOT. Decision itself is still reasonable.
- **L-4:** Phase 2 Review M-2 and M-3 resolution not tracked in Phase 3 documents (non-blocking).
- **L-5:** `district-content.tsx` archival is an OQ rather than a deliverable (overview Gap 5 recommends promotion).

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | OK | Decision 6 (Single Generic Scene) → WS-3.1. Decision 4 (Hybrid categories) → WS-3.1 uses KNOWN_CATEGORIES. Decision 5 (Map in overlay) → WS-3.1 map placeholder. All aligned. |
| SOW scopes do not overlap | OK | Completely disjoint file sets verified. Zero shared files. Both consume `coverage.ts` read-only. |
| SOW scopes have no gaps | MINOR ISSUE | M-2: No test deliverable for CategoryDetailScene. L-5: district-content.tsx archival is OQ not deliverable. |
| Dependencies are bidirectionally consistent | OK | All verified. WS-3.1 → WS-4.1 blocking relationship consistent. |
| Acceptance criteria are measurable | OK | 53 ACs, all with specific verification methods. |
| Open questions have owners and target phases | OK | 11 total OQs in overview Section 6. All assigned. Blocking status correctly marked. |
| Effort estimates are internally consistent | OK | WS-3.1: 10-14h. WS-3.2: 4-6h. Total: 14-20h. Parallel: 10-14h effective. Reasonable. |
| File modifications across SOWs do not conflict | OK | Zero overlapping files independently verified. |
| All codebase references verified | OK (minor) | 35+ references spot-checked across 14 files. 2 off-by-one, 1 factual error in rationale. All functional intent correct. |
| Phase 2 H-1 resolution is adequate | OK | WS-3.1 Section 4.6 provides thorough fix with 3 dedicated ACs (AC-26, AC-27, AC-28). |
| Phase 1 issues properly carried forward | OK | OQ-07 escalated as blocking. Test gap acknowledged. MASTER-PLAN.md absence noted. |
| Overview consistent with SOWs | OK | Architecture decisions, exit criteria, and effort estimates all align. |
| Panel position math is correct | OK | All 4 panel clearance calculations independently verified. |

## Blocking Assessment

**Blocking for next phase?** No

**Required fixes before implementation:**
1. H-1 (Carried): Resolve OQ-07 by running schema introspection against live Supabase. Three phases of carry-forward is unacceptable.
2. H-2 (Carried): Verify `CategoryMeta` includes `description: string`. If absent, add to WS-1.2 deliverables.
3. M-1: Add note to WS-3.1 Section 4.6 that `detail-panel.tsx` line references are pre-WS-2.2 values.

**Recommended fixes (non-blocking):**
1. M-2: Add `CategoryDetailScene.test.tsx` as formal deliverable or post-phase task.
2. M-3: Add compile-time `satisfies` assertion for `CoverageByCategory` field shape.
3. L-1: Correct line range in WS-3.1 Section 4.2.1 from "12-20" to "13-20."
4. L-2: Correct line reference in WS-3.1 Section 4.6.2 from "line 26" to "line 25."
5. L-3: Remove incorrect WS-3.2 merge conflict rationale from WS-3.1 Decision D-4.
6. L-5: Promote OQ-24 (archive `district-content.tsx`) to formal sub-deliverable.
7. Gap 7 (Recurring): Create `MASTER-PLAN.md` before Phase 3 implementation begins.
