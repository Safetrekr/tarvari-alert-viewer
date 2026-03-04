# Validation Report: Data View Modes Planning Documents

> **Date:** 2026-03-04
> **Validator:** Cross-plan consistency review (automated + database-verified)
> **Scope:** 6 planning documents for TarvaRI Alert Viewer Data View Modes feature
> **Method:** Document-by-document analysis, cross-plan cross-reference, codebase file inspection, live Supabase information_schema queries

---

## Documents Validated

| # | Document | Abbrev | Role |
|---|----------|--------|------|
| 1 | `aia-interface-architecture.md` | AIA | Interface architecture, state machine, choreography |
| 2 | `ux-experience-design.md` | UX | User experience, personas, trust patterns, accessibility |
| 3 | `ui-component-design.md` | UI | Component specifications, design tokens, motion inventory |
| 4 | `data-layer-architecture.md` | DATA | Types, queries, transforms, store design |
| 5 | `00-overview.md` | OVERVIEW | Unified architectural overview, cross-plan resolution |
| 6 | `00-product-requirements.md` | PRD | User stories, acceptance criteria, definition of done |

## Severity Classification

| Severity | Meaning | Action Required |
|----------|---------|-----------------|
| **CRITICAL** | Will cause runtime errors, data corruption, or broken behavior if implemented as written | Must fix before implementation begins |
| **MAJOR** | Will cause confusion, rework, or subtle bugs during implementation | Should fix before implementation; at minimum, document the resolution |
| **MINOR** | Inconsistency that is unlikely to cause bugs but creates ambiguity | Fix opportunistically; implementer should be aware |
| **INFO** | Observation or recommendation; no action strictly required | For awareness |

---

## 1. Document-by-Document Assessment

### 1.1 AIA — Interface Architecture

**Grade: C — Significant rework needed**

**Strengths:**
- Detailed transition choreography timeline (T+0ms through T+550ms) with per-component timing
- Thorough morph queue conflict prevention pattern with `pendingModeRef`
- Complete component file index mapping every file to new/edit status
- Keyboard shortcut design (1/2/3 for modes, Shift+V to cycle, R for rationale)

**Issues:**

| ID | Severity | Finding |
|----|----------|---------|
| V-001 | **CRITICAL** | Uses column name `geo_centroid` which does not exist in the database. The actual column is `representative_coordinates`. |
| V-002 | **CRITICAL** | ViewMode type `'bundles'` conflicts with resolved canonical value `'all-bundles'`. All code examples and URL examples use wrong value. |
| V-003 | **MAJOR** | `IntelBundleRow` type defines only 12 fields. Actual database has 24 columns. Missing `title`, `summary` and 10 others. |
| V-004 | **MAJOR** | `TriageDecisionRow` type defines only 7 fields. Actual database has 20 columns. |
| V-005 | **MAJOR** | `risk_score` typed as `number`. PostgreSQL `numeric` is returned as `string` by Supabase PostgREST. |
| V-006 | **MAJOR** | Proposes new `viewmode.store.ts`. Resolved decision is to extend `coverage.store.ts`. |
| V-007 | **MAJOR** | Hooks read `viewMode` from store internally. Resolved pattern is parameter-based. |
| V-008 | **MAJOR** | Confidence uses 4-tier thresholds. Resolved is 3-tier (0-59/60-79/80-100). |
| V-009 | **MINOR** | `note` typed as non-nullable. Actual DB column is nullable. |
| V-010 | **MINOR** | `categories` typed as non-nullable. Actual DB column is nullable. |
| V-011 | **MINOR** | `geo_centroid` format is GeoJSON Point. Even corrected column uses `{ lat, lon }` not GeoJSON. |

**Recommendation:** Read AIA for choreography and interaction patterns only. All data/state code should come from the data layer plan.

### 1.2 UX — Experience Design

**Grade: A- — Minor fixes needed**

**Strengths:**
- Well-defined personas with cognitive flow models
- Comprehensive edge case catalog (10 scenarios)
- Detailed accessibility specification with ARIA roles and screen reader templates
- Data freshness thresholds (15-min amber, 1-hour red)
- Analytics event taxonomy for measuring confidence loop

**Issues:**

| ID | Severity | Finding |
|----|----------|---------|
| V-012 | **MAJOR** | URL parameter uses `?view=bundles` instead of `?view=all-bundles` |
| V-013 | **MINOR** | Store location ambiguous (mentions both options without resolving) |
| V-014 | **MINOR** | Confidence thresholds match overview (correct) but differ from UI plan |

### 1.3 UI — Component Design

**Grade: B- — Moderate fixes needed**

**Strengths:**
- Comprehensive design token extraction from existing codebase
- Detailed ASCII wireframes for every component state
- Complete animation inventory with motion/react specifications
- World-space coordinate calculations

**Issues:**

| ID | Severity | Finding |
|----|----------|---------|
| V-015 | **CRITICAL** | ViewMode type `'all_bundles'` / `'raw_alerts'` both wrong. Should be `'all-bundles'` / `'raw'`. |
| V-016 | **MAJOR** | `risk_score` typed as `number`. Should be `string | null`. |
| V-017 | **MAJOR** | Confidence breakpoints 0-49/50-79 differ from resolved 0-59/60-79. |
| V-018 | **MAJOR** | Proposes separate `use-triage-decisions.ts` hook, causing N+1 queries. Data layer uses embedded select. |
| V-019 | **MINOR** | URL sync uses wrong ViewMode values |
| V-020 | **MINOR** | `categories` typed as non-nullable |

### 1.4 DATA — Data Layer Architecture

**Grade: A — Ready for implementation**

**Strengths:**
- Types verified against `information_schema.columns`
- Comprehensive composite types with helper functions
- Query key conventions documented
- Error handling covers race conditions, PostgREST failures, mode-URL mismatch

**Issues:**

| ID | Severity | Finding |
|----|----------|---------|
| V-021 | **MINOR** | `IntelBundleRow` missing `deduplication_keys`. Heading count wrong (says 25, actual 24). |
| V-022 | **MINOR** | `TriageDecisionRow` missing `excluded_trip_ids`. Heading count wrong (says 19, actual 20). |
| V-023 | **MINOR** | `note` null-guard needed in normalize helper |

### 1.5 OVERVIEW — Unified Architectural Overview

**Grade: A — Correct and comprehensive**

**Strengths:**
- Identifies and resolves 8 cross-plan tensions with clear rationale
- Dependency graph with critical path analysis
- Risk register with 6 rated risks
- Complete cross-reference matrix (37 feature elements)

**Issues:**

| ID | Severity | Finding |
|----|----------|---------|
| V-024 | **MINOR** | States "25 fields (bundles), 19 fields (decisions)". Actual: 24 and 20. |
| V-025 | **INFO** | Open question Q1 may be stale (already resolved in Section 2.3). |

### 1.6 PRD — Product Requirements

**Grade: B+ — Targeted fixes needed**

**Strengths:**
- 12 well-structured user stories with detailed acceptance criteria
- Clear P0/P1/P2 prioritization with rationale
- Measurable success metrics
- Data dependency table with current status

**Issues:**

| ID | Severity | Finding |
|----|----------|---------|
| V-026 | **CRITICAL** | Definition of Done uses `?view=bundles`. Should be `?view=all-bundles`. |
| V-027 | **MAJOR** | AC-01.5 uses `?view=bundles`. |
| V-028 | **MAJOR** | AC-11.8 correctly uses `?view=all-bundles`, creating internal contradiction with AC-01.5. |
| V-029 | **MINOR** | "Bundles modes" capitalization ambiguous |

---

## 2. Cross-Plan Consistency Matrix

### 2.1 ViewMode Type Values

| Plan | Triaged | All Bundles | Raw | Status |
|------|---------|-------------|-----|--------|
| AIA | `'triaged'` | `'bundles'` | `'raw'` | WRONG |
| UI | `'triaged'` | `'all_bundles'` | `'raw_alerts'` | WRONG |
| DATA | `'triaged'` | `'all-bundles'` | `'raw'` | CANONICAL |
| OVERVIEW | `'triaged'` | `'all-bundles'` | `'raw'` | RESOLVED |
| PRD | mixed | — | — | INCONSISTENT |

**Verdict:** 4 different ViewMode definitions across 4 plans. **CRITICAL — must align.**

### 2.2 State Management Location

| Plan | Proposed | Status |
|------|----------|--------|
| AIA | New `viewmode.store.ts` | OVERRIDDEN |
| DATA | Extend `coverage.store.ts` | CANONICAL |
| OVERVIEW | Extend `coverage.store.ts` | RESOLVED |

### 2.3 risk_score Type

| Plan | Type | Actual | Status |
|------|------|--------|--------|
| AIA | `number` | `string` | WRONG |
| UI | `number` | `string` | WRONG |
| DATA | `string | null` | `string | null` | CORRECT |

### 2.4 Confidence Thresholds

| Plan | Tiers | Breakpoints | Status |
|------|-------|-------------|--------|
| AIA | 4 | 0-49/50-69/70-84/85-100 | OVERRIDDEN |
| UX | 3 | 0-59/60-79/80-100 | CANONICAL |
| UI | 3 | 0-49/50-79/80-100 | WRONG BREAKPOINTS |
| OVERVIEW | 3 | 0-59/60-79/80-100 | RESOLVED |

---

## 3. Gap Analysis

| ID | Gap | Severity | Details |
|----|-----|----------|---------|
| G-001 | `intel_normalized.bundle_id` FK not leveraged | **MAJOR** | Enables reverse-join instead of `.in('id', memberIds)` |
| G-002 | `isTransitioning` stuck-state recovery | **MAJOR** | If query fails permanently, UI stays blurred indefinitely |
| G-003 | No auto-fallback from empty Triaged to Raw | **MINOR** | First-time user with 0 bundles sees empty screen |
| G-004 | `IntelNormalizedRow` incomplete in types.ts | **MINOR** | Only 6 of ~30 columns typed |
| G-005 | `dedup_hash`/`deduplication_keys` never displayed | **INFO** | Backend-only fields |
| G-006 | `representative_coordinates` null in both bundles | **INFO** | Map markers untestable with current data |

---

## 4. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Implementer copies AIA code with wrong column name | CRITICAL | HIGH | Add deprecation banner to AIA Section 4 |
| Wrong ViewMode string values used | CRITICAL | HIGH | Create single source-of-truth constant |
| DoD tests use wrong URL parameter | CRITICAL | MEDIUM | Update PRD Section 7.2 and AC-01.5 |
| risk_score parsed as number causes NaN | MAJOR | MEDIUM | Use `parseFloat()` in transform functions |
| Confidence thresholds differ | MAJOR | MEDIUM | Implement UX plan breakpoints as shared constant |
| isTransitioning never clears | MAJOR | LOW | Add safety timeout or onError callback |

---

## 5. Overall Verdict

### Summary of Findings

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| MAJOR | 14 |
| MINOR | 10 |
| INFO | 3 |
| GAPS | 6 |

### Recommendation: CONDITIONAL GO

Implementation can proceed with these **mandatory pre-conditions:**

**Must Fix Before Implementation (CRITICAL):**

1. **Canonical Values Reference** — Add to OVERVIEW or separate `IMPLEMENTATION-NOTES.md`:
   - ViewMode: `'triaged' | 'all-bundles' | 'raw'`
   - URL: `?view=all-bundles`, `?view=raw` (triaged = default, no param)
   - Column: `representative_coordinates` (NOT `geo_centroid`)
   - Format: `{ lat: number | null, lon: number | null }` (NOT GeoJSON)
   - Store: `coverage.store.ts` (NOT `viewmode.store.ts`)
   - risk_score: `string | null` (parse with `parseFloat()`)

2. **Update PRD DoD** — Change `?view=bundles` to `?view=all-bundles` in Section 7.2 and AC-01.5

3. **AIA Deprecation Banner** — Add to AIA Section 4: "Type definitions and query code superseded by data-layer-architecture.md"

**Should Fix Before Implementation (MAJOR):**

4. Update UI plan confidence thresholds to 0-59/60-79/80-100
5. Update UI plan ViewMode type to canonical values
6. Add `isTransitioning` timeout recovery
7. Document `intel_normalized.bundle_id` FK as alternative fetch strategy

### Implementation Reading Order

1. **OVERVIEW** — Read first. Arbiter of all conflicts.
2. **PRD** — What to build and how to verify.
3. **DATA** — Canonical types, queries, hooks, transforms.
4. **UI** — Visual specs (substitute canonical ViewMode values and confidence thresholds).
5. **UX** — Personas, edge cases, accessibility.
6. **AIA** — Choreography timing and interaction patterns only. Ignore Sections 3-4.

---

## Appendix: Complete Finding Index

| ID | Severity | Summary | Document |
|----|----------|---------|----------|
| V-001 | CRITICAL | `geo_centroid` does not exist | AIA |
| V-002 | CRITICAL | ViewMode `'bundles'` wrong | AIA |
| V-003 | MAJOR | IntelBundleRow missing 12 fields | AIA |
| V-004 | MAJOR | TriageDecisionRow missing 13 fields | AIA |
| V-005 | MAJOR | risk_score typed as number | AIA |
| V-006 | MAJOR | Wrong store file | AIA |
| V-007 | MAJOR | Hooks read from store | AIA |
| V-008 | MAJOR | Confidence 4-tier wrong | AIA |
| V-009 | MINOR | note non-nullable wrong | AIA |
| V-010 | MINOR | categories non-nullable wrong | AIA |
| V-011 | MINOR | geo format wrong | AIA |
| V-012 | MAJOR | URL `?view=bundles` wrong | UX |
| V-013 | MINOR | Store location ambiguous | UX |
| V-014 | MINOR | Confidence thresholds (correct) | UX |
| V-015 | CRITICAL | ViewMode values all wrong | UI |
| V-016 | MAJOR | risk_score typed as number | UI |
| V-017 | MAJOR | Confidence breakpoints wrong | UI |
| V-018 | MAJOR | Separate triage hook (N+1) | UI |
| V-019 | MINOR | URL sync wrong values | UI |
| V-020 | MINOR | categories non-nullable | UI |
| V-021 | MINOR | Missing deduplication_keys | DATA |
| V-022 | MINOR | Missing excluded_trip_ids | DATA |
| V-023 | MINOR | note null-guard needed | DATA |
| V-024 | MINOR | Column counts wrong | OVERVIEW |
| V-025 | INFO | Open question Q1 stale | OVERVIEW |
| V-026 | CRITICAL | DoD uses wrong URL | PRD |
| V-027 | MAJOR | AC-01.5 wrong URL | PRD |
| V-028 | MAJOR | AC-11.8 contradicts AC-01.5 | PRD |
| V-029 | MINOR | Capitalization ambiguous | PRD |
| G-001 | MAJOR | bundle_id FK not leveraged | Gap |
| G-002 | MAJOR | isTransitioning stuck-state | Gap |
| G-003 | MINOR | No auto-fallback empty Triaged | Gap |
| G-004 | MINOR | IntelNormalizedRow incomplete | Gap |
| G-005 | INFO | dedup fields never displayed | Gap |
| G-006 | INFO | representative_coordinates null | Gap |

---

*End of validation report.*
