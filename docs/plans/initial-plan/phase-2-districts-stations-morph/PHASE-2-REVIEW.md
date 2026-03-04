# Phase 2 Review: Districts + Stations + Morph

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-02-25
> **Documents Reviewed:** 8 (`ws-2.1-morph-choreography.md`, `ws-2.2-district-content-agent-builder.md`, `ws-2.3-district-content-project-room.md`, `ws-2.4-district-content-tarva-chat.md`, `ws-2.5-district-content-tarvacore-erp-tarvacode.md`, `ws-2.6-station-panel-framework.md`, `ws-2.7-constellation-view.md`, `PHASE-2-OVERVIEW.md`)
> **Cross-Referenced Against:** 5 (`combined-recommendations.md`, `tech-decisions.md`, `VISUAL-DESIGN-SPEC.md`, `PHASE-0-REVIEW.md`, `PHASE-1-REVIEW.md`)

---

## Review Verdict: PASS WITH ISSUES

**Rationale:** 3 HIGH severity issues (port collision, type location decision, type location inconsistency), 7 MEDIUM severity issues, 7 LOW severity issues. The PHASE-2-OVERVIEW.md is the strongest overview document in the pipeline — it self-identifies 6 cross-workstream conflicts and 7 gaps before review. All SOWs correctly use `motion/react` (not `framer-motion`), all use `pnpm` (with one exception in WS-2.6's checklist), and no `Next.js 15` references exist. The three HIGH issues are already documented in the overview and require pre-execution resolution. Estimated total fix time: ~30 minutes for blocking fixes.

---

## Per-SOW Assessment

| SOW                              | Completeness                                          | Ecosystem Grounding                                                   | Issues Found                                                                                 | Rating           |
| -------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------- |
| WS-2.1 (Morph Choreography)      | 8/8 sections. 39 ACs. 12 decisions.                   | Good. AD-4/5/6/8, Gap 2, VISUAL-DESIGN-SPEC glass/glow correct.       | 1 HIGH (src/types/), 1 MEDIUM (OQ Owner), 1 LOW (hardcoded positions)                        | PASS WITH ISSUES |
| WS-2.2 (Agent Builder)           | 8/8 sections. 25 ACs. 10 decisions.                   | Good. AD-5/8, Gap 4, WS-1.5/1.7 correct.                              | 1 HIGH (src/types/), 1 MEDIUM (receipt pattern), 1 LOW (format utils)                        | PASS WITH ISSUES |
| WS-2.3 (Project Room)            | 8/8 sections. 24 ACs. 9+ decisions. Has Owner column. | Good. AD-5/8, Gap 2, spine object mapping correct.                    | 1 HIGH (port 3005, type location), 1 MEDIUM (status enum), 1 MEDIUM (timeout)                | PASS WITH ISSUES |
| WS-2.4 (Tarva Chat)              | 8/8 sections. 24 ACs. 8 decisions.                    | Good. AD-5/8, WS-1.5/1.7 correct. Adaptive polling well-designed.     | 1 HIGH (port 3005, type location), 1 MEDIUM (status enum), 1 MEDIUM (OQ Owner)               | PASS WITH ISSUES |
| WS-2.5 (CORE/ERP/CODE)           | 8/8 sections. ~20 ACs. 8 decisions.                   | Good. AD-8, WS-1.5/1.7, VISUAL-DESIGN-SPEC tokens correct.            | 1 HIGH (src/types/), 1 MEDIUM (OQ Owner), 2 LOW (container path, registry)                   | PASS WITH ISSUES |
| WS-2.6 (Station Panel Framework) | 8/8 sections. 15 ACs. 10 decisions.                   | Good. VISUAL-DESIGN-SPEC 4.1/4.4, AD-6, WS-1.7 D-9 correct.           | 2 MEDIUM (glass BG opacity, 3-vs-4-layer prose), 2 LOW (npm, Framer Motion prose)            | PASS WITH ISSUES |
| WS-2.7 (Constellation View)      | 8/8 sections. 24 ACs. 7 decisions.                    | Good. AD-8, WS-1.2, WS-1.5 correct. Beacon rendering well-specified.  | 1 HIGH (src/types/), 1 MEDIUM (@keyframes fragmentation), 1 MEDIUM (OQ Owner)                | PASS WITH ISSUES |
| PHASE-2-OVERVIEW                 | 10/10 sections + 6 appendices. 14 exit criteria.      | Excellent. Cross-references all 7 SOWs, all ADs, all gap resolutions. | Self-identifies 6 conflicts and 7 gaps. Misses M-2 (receipt pattern) and L-5 (format utils). | STRONG PASS      |

---

## Issues Found

### HIGH Severity

#### H-1: Port 3005 Collision — WS-2.3 and WS-2.4

**Location:** WS-2.3 route handler targets `http://localhost:3005`; WS-2.4 route handler also targets `http://localhost:3005`.

**Problem:** Both Project Room and Tarva Chat Route Handlers proxy to the same port. Only one service can bind to port 3005. Data integrity failure during development.

**Fix:** Assign Tarva Chat to a different port (e.g., `localhost:4000` per TARVA-SYSTEM-OVERVIEW.md). Update all WS-2.4 references. Both SOWs use environment variable overrides, so the fix is straightforward.

#### H-2: `src/types/` Proliferation Despite Phase 1 Gap 1

**Location:** WS-2.1 (`src/types/morph.ts`), WS-2.2 (`src/types/districts/agent-builder.ts`), WS-2.5 (`src/types/districts/tarva-core.ts`, `tarva-erp.ts`, `tarva-code.ts`), WS-2.7 (adds to `src/types/district.ts`).

**Problem:** Phase 1 Gap 1 and D-IFACE-7 recommend removing `src/types/`. Four Phase 2 SOWs create new files there. This is a blocking architectural decision (OQ-2.0.2).

**Fix:** Resolve OQ-2.0.2 before execution. Recommended: Option A — accept `src/types/` for domain types, `src/lib/interfaces/` for interface contracts. Standardize all district types to `src/types/districts/{name}.ts`.

#### H-3: Type File Location 4-Way Inconsistency

**Location:** WS-2.2 (`src/types/districts/agent-builder.ts`), WS-2.3 (`src/types/districts/project-room.ts`), WS-2.4 (`src/types/districts/tarva-chat.ts`), WS-2.5 (`src/types/districts/tarva-*.ts`).

**Problem:** Four different directory patterns for the same category of file. Developers cannot predict where a district's types live.

**Fix:** Once H-2 is resolved, update all district type file paths to match the chosen convention.

### MEDIUM Severity

#### M-1: Status Enum Divergence Across Districts

**Problem:** WS-2.3 uses `'ok' | 'degraded' | 'error' | 'unreachable'`, WS-2.4 uses `'connected' | 'degraded' | 'disconnected' | 'unknown'`, WS-2.5 correctly uses canonical `HealthState`. Three vocabularies for the same concept.

**Fix:** Standardize on canonical `HealthState` from WS-1.5. Map district-specific statuses at the Route Handler boundary.

#### M-2: Receipt Integration Pattern Inconsistency

**Problem:** WS-2.2 uses `useStationContext().stampReceipt` directly. WS-2.3 uses an `onReceipt` prop. WS-2.4 exports data builders without receipt logic (framework handles it).

**Fix:** Adopt WS-2.4's approach — let StationPanel framework handle receipts via `StationActions`. Update WS-2.2 and WS-2.3 to match.

#### M-3: Glass Background Opacity Mismatch

**Problem:** WS-2.6 uses `rgba(255,255,255,0.06)` for active glass. VISUAL-DESIGN-SPEC.md Section 4.1 specifies Active Glass BG Opacity as `0.07`.

**Fix:** Update WS-2.6 CSS to `0.07` or document the deviation as a deliberate decision.

#### M-4: 3-Layer vs 4-Layer Glow Prose Inconsistency

**Problem:** WS-2.6 scope and CSS comments say "3-layer" but the actual implementation uses 4 box-shadow layers, and decisions/risks/ACs correctly say "4-layer".

**Fix:** Update prose to "4-layer" to match the implementation. VISUAL-DESIGN-SPEC Section 4.4 describes the luminous border as 4 layers.

#### M-5: Missing Owner Column in 5 of 7 OQ Tables

**Problem:** Only WS-2.3 includes an Owner column. WS-2.1, WS-2.2, WS-2.4, WS-2.5, WS-2.7 repeat the Phase 1 pattern (M-3 in PHASE-1-REVIEW.md).

**Fix:** Add Owner and Resolution Deadline columns. Recurring across all three phases.

#### M-6: CSS @keyframes Outside ambient-effects.css

**Problem:** WS-2.7 creates `src/styles/constellation.css` with `@keyframes beacon-pulse` and `beacon-flash`. Phase 1 D-AMBIENT-2 mandates a single `ambient-effects.css` for all @keyframes.

**Fix:** Move @keyframes to `src/styles/ambient-effects.css`. Keep component class definitions in `constellation.css`.

#### M-7: Fetch Timeout Inconsistency

**Problem:** WS-2.3 uses 5000ms timeout; WS-2.2 and WS-2.4 use 3000ms. No rationale for the difference.

**Fix:** Standardize on a single timeout (recommended: 5000ms for district Route Handlers, which are server-side).

### LOW Severity

| #   | Issue                                                                                           | Fix                                                       |
| --- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| L-1 | WS-2.6 checklist step 15 uses `npm run lint` and `npm run typecheck`                            | Change to `pnpm lint` and `pnpm typecheck`                |
| L-2 | WS-2.5 places district containers in `src/components/stations/` not `src/components/districts/` | Move to `src/components/districts/{district}/`            |
| L-3 | WS-2.1 hardcodes `DISTRICT_WORLD_POSITIONS` and `DISTRICT_POSITIONS` locally                    | Import from canonical source (WS-1.7 or shared constants) |
| L-4 | WS-2.6 standard and active glass share identical border opacity (0.06)                          | Cosmetically minor; luminous border box-shadow dominates  |
| L-5 | At least 3 separate `formatRelativeTime` implementations across WS-2.2, WS-2.3, WS-2.4          | Extract to shared `src/lib/format-utils.ts`               |
| L-6 | WS-2.5 `district-registry.ts` not used by other district SOWs                                   | Clarify if registry should be comprehensive or remove     |
| L-7 | WS-2.6 prose references "Framer Motion" in two places (code imports correct `motion/react`)     | Change prose to "`AnimatePresence` from `motion/react`"   |

---

## Cross-Phase Consistency Check

| Check                                             | Status  | Notes                                                                                |
| ------------------------------------------------- | ------- | ------------------------------------------------------------------------------------ |
| SOW decisions align with Combined Recommendations | OK      | All ADs (AD-1 through AD-9) correctly reflected.                                     |
| SOW decisions align with tech-decisions.md        | OK      | `motion/react` v12+ used consistently. `pnpm` used (L-1 exception).                  |
| SOW visual specs align with VISUAL-DESIGN-SPEC.md | ISSUE   | M-3: Active glass BG opacity 0.06 vs spec 0.07. All other values correct.            |
| SOW scopes do not overlap                         | OK      | No scope overlaps. Receipt pattern varies (M-2) but scopes are distinct.             |
| SOW scopes have no gaps                           | ISSUE   | Gap 4: morph-to-station content mapping layer has no owner.                          |
| Dependencies are bidirectionally consistent       | OK      | All cross-dependencies documented. WS-2.1+WS-2.6 dual gate correctly identified.     |
| Acceptance criteria are measurable                | OK      | ~151 total ACs. All specify verification methods.                                    |
| Open questions have owners and target phases      | ISSUE   | M-5: 5 of 7 SOWs lack Owner column (recurring from Phase 1).                         |
| Effort estimates are internally consistent        | OK      | XL (6-8 weeks) realistic given react-developer bottleneck.                           |
| File paths follow AD-9 project structure          | ISSUE   | H-2: `src/types/` not in AD-9. L-2: district containers in wrong directory.          |
| `motion/react` import path used consistently      | OK      | All 7 SOWs use `motion/react`. Zero `framer-motion` instances. Phase 1 H-1 resolved. |
| Design tokens match VISUAL-DESIGN-SPEC.md values  | ISSUE   | M-3: glass BG opacity. M-4: 3-vs-4-layer prose. All other token values correct.      |
| Port assignments are unique                       | ISSUE   | H-1: Port 3005 collision between WS-2.3 and WS-2.4.                                  |
| Phase 1 lessons applied                           | PARTIAL | `framer-motion` fixed. `npm`/Owner column/type location issues recurring.            |

---

## Blocking Assessment

**Blocking for next phase?** No (after blocking fixes applied)

**Required fixes before proceeding (blocking):**

1. H-1: Resolve port 3005 collision — assign Tarva Chat to different port
2. H-2/H-3: Make `src/types/` decision (OQ-2.0.2) and standardize type file locations

**Recommended fixes (non-blocking):**

- M-1: Standardize status enums on canonical `HealthState`
- M-2: Standardize receipt integration pattern
- M-3: Update glass BG opacity to match VISUAL-DESIGN-SPEC
- M-4: Fix 3-layer vs 4-layer prose
- M-5: Add Owner columns to 5 OQ tables
- M-6: Move constellation @keyframes to ambient-effects.css
- M-7: Standardize fetch timeouts
- L-1 through L-7: Minor cleanup (~15 min)
