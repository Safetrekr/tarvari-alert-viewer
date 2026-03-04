# Final Validation Report: Coverage Grid Launch Page

> **Project:** TarvaRI Alert Viewer -- Coverage Grid Launch Page
> **Date:** 2026-03-04
> **Reviewer:** `every-time` (Final Validator)
> **Classification:** CRITICAL (irreversible architectural transformation across 8 workstreams)
> **Documents Reviewed:** 20 (4 phase reviews, 4 phase overviews, 8 SOWs, 1 planning log, 1 combined-recommendations, 1 CLAUDE.md, 1 root CLAUDE.md)
> **Codebase Files Spot-Checked by Phase Reviews:** 54 unique files across 4 review passes

---

## 1. Overall Verdict

### READY WITH CONDITIONS

The planning package is exceptionally thorough. Eight SOWs across four phases deliver 158 acceptance criteria, 45 architecture decisions, and 34 open questions -- all grounded in verified codebase references (100+ line-number citations spot-checked across 54 source files). Each phase review passed with issues that are documented, categorized, and actionable. The dependency graph is clear, the effort estimates are calibrated with three-point ranges, and the parallel execution opportunity in Phase 3 is correctly identified and verified.

Two blocking conditions must be resolved before implementation begins. Seven SOW amendments must be applied before their respective workstream implementations. All conditions are resolvable in under 2 hours of total effort and require no re-planning.

---

## 2. Phase-by-Phase Summary

| Phase | Review Verdict | SOWs | ACs | Arch. Decisions | Issues (H/M/L) | Key Finding |
|-------|---------------|------|-----|-----------------|-----------------|-------------|
| **1 -- Foundation** | PASS WITH ISSUES | 3 (WS-1.1, WS-1.2, WS-1.3) | 30 | 12 (AD-01 to AD-12) | 1H / 2M / 5L | Exceptional codebase grounding (30+ line refs verified). H-1: `IntelSourceRow` missing `id` column. No test deliverables for `coverage-utils.ts`. |
| **2 -- Core UI** | PASS WITH ISSUES | 2 (WS-2.1, WS-2.2) | 39 | 13 (AD-13 to AD-25) | 1H / 3M / 3L | H-1: `DistrictContent` component gap between WS-2.2 and WS-3.1. Implicit contract on `data-category-card` attribute. No test deliverables. |
| **3 -- Detail + Chrome** | PASS WITH ISSUES | 2 (WS-3.1, WS-3.2) | 53 | 12 (AD-26 to AD-37) | 0H new (2H carried) / 3M / 5L | No new HIGH issues. Two carried HIGHs (OQ-07 on 3rd carry, `CategoryMeta.description`). True parallel execution verified safe. No test deliverables (3rd consecutive phase). |
| **4 -- Map** | PASS WITH ISSUES | 1 (WS-4.1) | 36 | 8 (AD-38 to AD-45) | 0H new (2H carried) / 5M / 5L | MapMarkerLayer dead code. `getClusterExpansionZoom` API may be outdated for MapLibre v5. No test deliverables (4th consecutive phase). |

---

## 3. Cross-Phase Integrity Check

### 3.1 Critical Path: WS-1.1 -> WS-1.2 -> WS-1.3 -> WS-2.1 -> WS-2.2 -> WS-3.1 -> WS-4.1

| Transition | Producer Output | Consumer Input | Interface Contract | Status |
|------------|----------------|----------------|-------------------|--------|
| WS-1.1 -> WS-1.2 | `page.archived.tsx` (reference) | Visual reference during type widening | File existence | OK |
| WS-1.2 -> WS-1.3 | `NodeId` type, `coverage.ts` module (13 exports), widened morph types | `CategoryMeta` lookups, type annotations for hooks/utils | `CategoryMeta` interface, `CategoryId` type, `KNOWN_CATEGORIES` array | **CONDITION**: Verify `CategoryMeta.description` field exists |
| WS-1.3 -> WS-2.1 | `useCoverageMetrics` hook, `coverage.store.ts`, `CoverageByCategory`/`CoverageMetrics` types | Grid card rendering, selection state, data binding | Hook return type, store actions | OK |
| WS-2.1 -> WS-2.2 | `CoverageGrid`, `CategoryCard` components | Morph orchestrator wiring, variant animations, CSS selectors | **CONDITION**: `data-category-card` attribute, `capsuleStateVariants` wiring must be explicit ACs | OK after amendment |
| WS-2.2 -> WS-3.1 | Functional morph drill-down, `?category=` URL sync, archived ring-era files | District view content, scene rendering, data filtering | Morph phase machine, URL parameter name, panel position constants | **CONDITION**: `DistrictContent` placeholder must be added to WS-2.2 |
| WS-3.1 -> WS-4.1 | `CategoryDetailScene` with map placeholder, `useCoverageMapData` already invoked | Map placeholder replacement, cached hook data reuse | Placeholder DOM structure (`role="img"`), `MapMarker[]` type shape | OK |

### 3.2 Parallel Path: WS-1.2 -> WS-3.2

| Transition | Producer Output | Consumer Input | Interface Contract | Status |
|------------|----------------|----------------|-------------------|--------|
| WS-1.2 -> WS-3.2 | `coverage.ts` module (`getCategoryMeta()`, `KNOWN_CATEGORIES`, `getCategoryColor()`) | Chrome labels, Minimap dots, panel position references | Read-only consumption of `CategoryMeta.displayName`, `.shortName`, `.color` | OK |

### 3.3 Cross-Path Convergence Points

- **WS-3.1 + WS-3.2**: Both consume `coverage.ts` read-only. Completely disjoint file sets verified by Phase 3 Review. True parallel execution is safe.
- **WS-3.1 + WS-4.1**: Sequential. WS-4.1 replaces the map placeholder created by WS-3.1.
- **WS-3.2 + WS-4.1**: No dependency. WS-4.1 renders inside the viewport-fixed overlay (not world-space), so WS-3.2's panel position adjustments do not affect the map.

### 3.4 End-to-End Data Flow Verification

```
Supabase (intel_sources, intel_normalized)
    |
    v
WS-1.3: useCoverageMetrics(), useCoverageMapData() -- TanStack Query hooks
    |                           |
    v                           v
WS-2.1: CoverageGrid           WS-3.1: CategoryDetailScene
    (card rendering)                (alert list, severity breakdown, source health)
    |                               |
    v                               v
WS-2.2: Morph drill-down       WS-4.1: CoverageMap
    (?category= URL sync)          (MapLibre markers, popups, clustering)
```

---

## 4. Blocking Conditions

### BLOCK-1: OQ-07 -- `intel_sources` Schema Verification (Carried 4 Phases)

**Severity:** HIGH
**Carried Since:** Phase 1 Review (2026-03-03)
**Blocking For:** WS-1.3 (directly), WS-3.1 and WS-4.1 (transitively)
**Resolution:** Run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'intel_sources'` against the live Supabase instance. Update `IntelSourceRow` in WS-1.3 deliverables with the actual column set.
**Effort:** 10 minutes
**Owner:** react-developer (or any agent with Supabase access)

> **Process Note:** Four phases of carry-forward on a 10-minute task is a project management failure. There is no acceptable reason for further deferral.

### BLOCK-2: `CategoryMeta.description` Field Confirmation

**Severity:** HIGH
**Identified By:** Phase 3 Review H-2, Phase 3 Overview Gap 1
**Blocking For:** WS-3.1 (scene, dock, H-1 fix all use `.description`)
**Resolution:** Verify that WS-1.2's `CategoryMeta` interface includes `description: string`. If absent, add it and populate `KNOWN_CATEGORIES` with brief descriptions (~10-20 words per category).
**Effort:** 15-30 minutes

---

## 5. Required SOW Amendments

| # | SOW | Issue | Amendment Required | Effort | Source |
|---|-----|-------|-------------------|--------|--------|
| A-1 | WS-1.3 | No test deliverable for `coverage-utils.ts` | Add `src/lib/__tests__/coverage-utils.test.ts` as Deliverable 4.7 | 5 min | Phase 1 Review M-1 |
| A-2 | WS-1.3 | R-5 contradicts declared dependency | Amend R-5 to clarify parallel execution is emergency fallback only | 5 min | Phase 1 Review M-2 |
| A-3 | WS-2.1 | `CategoryCard` data attributes are implicit | Add AC-20: root element includes `data-category-card`. Add AC-21: variant wiring | 5 min | Phase 2 Review M-1 |
| A-4 | WS-2.2 | `DistrictContent` gap when categoryId is not a legacy district | Add placeholder/conditional empty state in Section 4.3. Add AC-21 | 10 min | Phase 2 Review H-1 |
| A-5 | WS-3.1 | `detail-panel.tsx` line refs assume pre-WS-2.2 state | Add note to Section 4.6 that line references must be re-verified | 5 min | Phase 3 Review M-1 |
| A-6 | WS-4.1 | `MapMarkerLayer` dead code | Remove `handleClick`/`onMarkerClick`; make pure render component | 5 min | Phase 4 Review M-1 |
| A-7 | WS-4.1 | `getClusterExpansionZoom` callback API | Verify against MapLibre v5 docs; update to Promise-based if needed | 15 min | Phase 4 Review M-2 |

---

## 6. Aggregate Metrics

### 6.1 Scale

| Metric | Count |
|--------|-------|
| **Phases** | 4 |
| **SOWs** | 8 |
| **Acceptance Criteria** | 158 |
| **Architecture Decisions** | 45 (AD-01 through AD-45) |
| **Open Questions** | 34 (OQ-01 through OQ-34) |
| **Tracked Issues** | 15 |
| **Risks Identified** | 54 across all SOWs |

### 6.2 Open Questions

| Status | Count |
|--------|-------|
| Blocking (open) | 1 (OQ-07) |
| Resolved by later phases | 3 (OQ-03, OQ-04, OQ-09) |
| Non-blocking with recommendation | 30 |
| **Total** | **34** |

### 6.3 Issues by Severity

| Severity | Count |
|----------|-------|
| HIGH | 4 |
| MEDIUM | 11 |
| LOW | ~18 (from reviews, not all tracked in log) |
| **Tracked in Planning Log** | **15** |

### 6.4 Files

| Category | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Total |
|----------|---------|---------|---------|---------|-------|
| New | ~7 | 6 | 1 | 5 | **~19** |
| Modified | ~8 | 6+ | 10 | 2 | **~26** |
| Archived | 1 | 9 | 6-7 | 0 | **16-17** |

### 6.5 Effort Estimates

| Phase | Estimate | Effective Duration |
|-------|----------|--------------------|
| Phase 1 | 11-15h | 11-15h (serial) |
| Phase 2 | 18-26h | 18-26h (serial) |
| Phase 3 | 14-20h | 10-14h (parallel) |
| Phase 4 | 8-12h | 8-12h |
| **Total** | **51-73h** | **47-67h** |

### 6.6 Schedule Projection

| Scenario | Hours | Working Days (8h) |
|----------|-------|--------------------|
| Best case | 47h | ~6 days |
| Expected | 57h | ~7 days |
| Worst case | 90h | ~11 days |

---

## 7. Recurring Issues

### 7.1 Test Debt (All 4 Phases)

No SOW includes test files as formal deliverables. 158 ACs rely on manual verification. Strongest test candidates: `coverage-utils.test.ts` (Phase 1), `CategoryCard.test.tsx` (Phase 2), `CategoryDetailScene.test.tsx` (Phase 3), `map-utils.test.ts` (Phase 4).

### 7.2 MASTER-PLAN.md Absence (All 4 Phases)

Every phase overview references it. The file has now been created as part of the final documents. Status: resolved.

### 7.3 Implicit Contracts Between Sequential SOWs

WS-2.1 creates components that WS-2.2 depends on with specific implementation details not codified as ACs. WS-1.3 creates types that WS-3.1 consumes with specific field names not verified against the producer. Amendments A-3 and A-4 address specific instances.

---

## 8. Implementation Readiness Checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | All SOWs written and reviewed | YES |
| 2 | All phase overviews synthesized | YES |
| 3 | All blocking issues have resolution paths | YES |
| 4 | Dependency graph verified end-to-end | YES |
| 5 | No unresolvable technical risks | YES |
| 6 | Effort estimates with ranges | YES |
| 7 | Acceptance criteria measurable | YES |
| 8 | Architecture decisions documented | YES |
| 9 | File deliverables specified per SOW | YES |
| 10 | Codebase references verified | YES |
| 11 | Exit criteria defined per phase | YES |
| 12 | BLOCK-1 (OQ-07) resolved | **NO** |
| 13 | BLOCK-2 (CategoryMeta.description) resolved | **NO** |
| 14 | Required SOW amendments applied | **NO** |
| 15 | MASTER-PLAN.md exists | YES (created) |
| 16 | Test strategy formalized | **NO** |
| 17 | Visual regression baseline captured | **NO** |

**Summary:** 12/17 met. Items 12-14 blocking. Items 16-17 recommended.

---

## 9. Recommended Implementation Order

### Pre-Implementation (~1h mandatory, ~2.5h with recommended items)

| Step | Action | Effort |
|------|--------|--------|
| P-1 | Resolve BLOCK-1: `intel_sources` schema introspection | 10 min |
| P-2 | Resolve BLOCK-2: Verify/add `CategoryMeta.description` | 15-30 min |
| P-3-P-8 | Apply Amendments A-1 through A-7 | 50 min |
| P-9 | Capture visual regression baseline (recommended) | 15 min |

### Phase 1: Foundation (Serial)

```
[1] WS-1.1 Archive Current Page .............. 0.5h
[2] WS-1.2 Type Foundation ................... 4-6h
[3] WS-1.3 Data Layer ........................ 6-8h
```

### Phase 2: Core UI (Serial)

```
[4] WS-2.1 Coverage Grid ..................... 8-12h
[5] WS-2.2 Morph Adaptation .................. 10-14h
```

### Phase 3: Detail + Chrome (Parallel)

```
Track A (critical path):
[6] WS-3.1 District View Adaptation .......... 10-14h

Track B (parallel with Track A):
[7] WS-3.2 Chrome & Panels ................... 4-6h
```

### Phase 4: Map

```
[8] WS-4.1 Map Feature ....................... 8-12h
```

### Critical Path

```
P1-P8 -> WS-1.1 -> WS-1.2 -> WS-1.3 -> WS-2.1 -> WS-2.2 -> WS-3.1 -> WS-4.1
                                                       WS-3.2 (parallel, after WS-1.2)
```

---

## 10. Confidence Assessment

| Dimension | Rating | Rationale |
|-----------|--------|-----------|
| Planning completeness | HIGH (0.92) | 158 ACs, 45 ADs, verified codebase references |
| Dependency accuracy | HIGH (0.90) | All transitions verified with producer/consumer analysis |
| Effort calibration | MEDIUM-HIGH (0.82) | Well-structured estimates, minor Phase 1 discrepancy |
| Risk coverage | HIGH (0.88) | 54 risks with mitigations across 8 SOWs |
| Blocking condition resolution | HIGH (0.95) | Both blocks are < 30 min tasks |
| Test readiness | LOW (0.30) | No automated test infrastructure planned |

**Overall confidence:** HIGH (0.88)

---

## 11. Signatures

| Role | Agent | Verdict |
|------|-------|---------|
| Final Validator | `every-time` | **READY WITH CONDITIONS** |

**Conditions for clearance:**
1. BLOCK-1 (OQ-07) resolved
2. BLOCK-2 (CategoryMeta.description) resolved
3. Amendments A-1 through A-7 applied to respective SOWs

Upon resolution of all three conditions, implementation may proceed in the order specified in Section 9.
