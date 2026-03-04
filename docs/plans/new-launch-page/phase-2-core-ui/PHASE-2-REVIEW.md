# Phase 2 Review: Core UI

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-04
> **Documents Reviewed:** 5 (`ws-2.1-coverage-grid.md`, `ws-2.2-morph-adaptation.md`, `PHASE-2-OVERVIEW.md`, `combined-recommendations.md`, `phase-1-foundation/PHASE-1-REVIEW.md`)
> **Codebase Files Spot-Checked:** 12

## Review Verdict: PASS WITH ISSUES

Both SOWs demonstrate exceptional preparation — deep codebase grounding with verified line-number references across 12+ files, 39 combined acceptance criteria, 13 design decisions with alternatives, and 15 proactive risk identifications. The two workstreams are well-sequenced (WS-2.1 creates components, WS-2.2 rewires morph logic) with no destructive overlap.

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-2.1 Coverage Grid | Excellent. 9 deliverable groups, 19 ACs, 7 decisions, 6 OQs, 7 risks. | Exceptional. References verified: `morph-orchestrator.tsx` lines 33-40, 86-114, 139-177, 180-195. `page.tsx` line 252. `constellation-view.tsx` line 46. Glass effect classes confirmed. | 1 MEDIUM (implicit data attributes), 2 LOW | A |
| WS-2.2 Morph Adaptation | Exceptional. 8 deliverable groups, 20 ACs, 6 decisions, 5 OQs, 8 risks. | Exceptional. All line references verified across 7 files. | 1 HIGH (DistrictContent gap), 1 MEDIUM (URL param race) | A- |

## Issues Found

### HIGH Severity

**H-1: `DistrictContent` component not addressed in morph adaptation path**
`detail-panel.tsx` line 149 renders `<DistrictContent districtId={districtId} />`. WS-2.2 rewrites the panel but doesn't address what happens when `categoryId` is "seismic" — `DistrictContent` will resolve nothing or throw. Gap between WS-2.2 completion and WS-3.1.

**Required action:** Add placeholder or conditional empty state for `DistrictContent` in WS-2.2 Section 4.3. Add AC-21.

### MEDIUM Severity

**M-1: `CategoryCard` data attributes are implicit contracts**
WS-2.2 depends on `[data-category-card]` and `[data-selected]` attributes but WS-2.1 doesn't explicitly specify them. Add explicit AC to WS-2.1.

**M-2: URL parameter ownership ambiguous**
After WS-2.2, both `syncCoverageFromUrl` and `useInitialDistrictFromUrl` exist. Clarify ownership and replace legacy hook.

**M-3: Grid column width constant misleading**
`CARD_WIDTH = 160` but `1fr` columns compute to 173.5px. Remove or rename constant.

### LOW Severity
- **L-1:** 9 archived files (vs 8 in combined-recommendations) — extra is connector-lines.tsx, correctly documented.
- **L-2:** `capsuleStateVariants` rename should be deliverable not OQ.
- **L-3:** Effort estimates: ~6-8h WS-2.1, ~4-6h WS-2.2, total ~10-14h.

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | OK | Decisions 2, 3, 4, 7 all covered |
| SOW scopes do not overlap | OK | Both modify morph-orchestrator but sequentially |
| SOW scopes have no gaps | ISSUE | H-1: DistrictContent gap. M-1: implicit attributes |
| Dependencies are bidirectionally consistent | OK | All verified |
| Acceptance criteria are measurable | OK | 39 ACs, all specific |
| Open questions have owners and target phases | OK | 11 OQs, all assigned |
| Effort estimates are internally consistent | OK | Per PHASE-2-OVERVIEW: 18-26h total |
| File modifications across SOWs do not conflict | OK | Sequential execution prevents conflict |
| All codebase references verified | OK | 30+ references spot-checked, all accurate |

## Blocking Assessment

**Blocking for next phase?** No

**Required fixes before implementation:**
1. H-1: Add DistrictContent placeholder handling to WS-2.2
2. M-1: Add explicit data attribute AC to WS-2.1

**Recommended fixes (non-blocking):**
1. M-2: Clarify URL param ownership, replace legacy hook
2. M-3: Resolve CARD_WIDTH constant ambiguity
3. L-2: Promote variant rename from OQ to deliverable
