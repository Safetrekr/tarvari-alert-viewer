# Phase 1 Review: Priority Badges

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-05
> **Documents Reviewed:** 7 (ws-1.1 through ws-1.5, PHASE-1-OVERVIEW.md, combined-recommendations.md)

## Review Verdict: PASS WITH ISSUES

All five SOWs are thorough and well-grounded in the codebase (50+ line-number refs verified across 12 source files). AD-1 (achromatic priority) consistently enforced. Three HIGH-severity documentation alignment issues must be patched — all are text corrections, not architectural redesign.

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-1.1 | High — 14 edits across 7 files | Excellent — all line refs verified | H-3: Missing use-coverage-metrics.ts. H-2: GeoJSON property name. | **PASS WITH ISSUES** |
| WS-1.2 | High — type extension, derivation, badge render, a11y | Excellent — all refs verified | L-3: No test infra | **PASS** |
| WS-1.3 | Medium — correct scope but wrong field name throughout | Good — line refs accurate | H-1: Uses `item.priority` not `item.operationalPriority` (9 occurrences). M-1: Primary snippet lacks null guard. | **PASS WITH ISSUES** |
| WS-1.4 | High — mirrors selectedCategories precisely | Excellent | M-3: Shares file with WS-1.3 | **PASS** |
| WS-1.5 | High — radius expressions, glow layer, animation | Excellent — all MapLibre refs verified | H-2: GeoJSON property name disagrees with WS-1.1 | **PASS WITH ISSUES** |
| OVERVIEW | High — all 3 conflicts identified with sound resolutions | N/A | None unique | **PASS** |

## Issues Found

### HIGH Severity

**H-1: WS-1.3 uses wrong field name throughout.** References `item.priority` and `alert.priority` (9 occurrences) but WS-1.1 defines the field as `operationalPriority`. **Fix:** Find-replace across WS-1.3 Sections 2, 3, 4.1, 4.2. ~10 min.

**H-2: GeoJSON property name disagreement.** WS-1.1 adds `operationalPriority` to GeoJSON properties; WS-1.5 reads `['get', 'priority']`. Overview resolves correctly: use `priority` in GeoJSON, translate in `markersToGeoJSON()`. **Fix:** Update WS-1.1 Section 4.6 to use `priority: string` with `marker.operationalPriority ?? 'P4'`. ~5 min.

**H-3: WS-1.1 missing `use-coverage-metrics.ts`.** WS-1.2 depends on `ApiIntelItem` having `operational_priority`, but WS-1.1 doesn't include this file. The index signature `[key: string]: unknown` works but is implicit. **Fix:** Add deliverable 4.8 to WS-1.1. ~5 min.

### MEDIUM Severity

- **M-1:** WS-1.3 primary code snippets lack null guards (secondary snippets have them). Swap order.
- **M-2:** `map-utils.ts` modified by both WS-1.1 and WS-1.5. Add coordination note.
- **M-3:** `CategoryDetailScene.tsx` modified by both WS-1.3 and WS-1.4. Add coordination note.

### LOW Severity

- **L-1:** WS-1.3 file line count off by 1 (695 vs 696).
- **L-2:** GeoJSON nullability mismatch (resolved by H-2 fix).
- **L-3:** No test infrastructure for priority counting logic.
- **L-4:** Minor line ref offset in WS-1.3 (293 vs 294 start).

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | **OK** | AD-1 consistently enforced. All WS descriptions match. |
| SOW scopes do not overlap | **OK** | Shared files modify different sections. |
| SOW scopes have no gaps | **ISSUE** | H-3: `use-coverage-metrics.ts` unclaimed. |
| Dependencies are bidirectionally consistent | **ISSUE** | H-1: WS-1.3 refs wrong field name from WS-1.1. |
| Acceptance criteria are measurable | **OK** | All ACs have concrete verification methods. |
| Open questions have owners and target phases | **OK** | 15 OQs consolidated, 2 blocking. |
| Effort estimates are internally consistent | **OK** | 6-8h aligns with "2-3 days" in combined-recommendations. |
| File modifications across SOWs do not conflict | **ISSUE** | H-2 + M-2 + M-3. All resolvable with sequencing. |
| All codebase references (paths, types) are verified | **ISSUE** | H-1 refs nonexistent field. All other 50+ refs accurate. |

## Blocking Assessment

**Blocking for next phase?** No

**Required fixes before proceeding:**
1. H-1: Fix field name in WS-1.3 (~10 min)
2. H-2: Fix GeoJSON property name in WS-1.1 (~5 min)
3. H-3: Add use-coverage-metrics.ts to WS-1.1 (~5 min)

**Recommended fixes (non-blocking):**
1. M-1: Swap code snippet order in WS-1.3
2. M-2: Add coordination note to WS-1.5
3. M-3: Add coordination note to WS-1.4
