# Phase C Review: Map + Bottom Sheet

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-06
> **Documents Reviewed:** 6 (ws-c.1 through ws-c.5, PHASE-C-OVERVIEW)
> **Codebase Files Verified:** CoverageMap.tsx, MapMarkerLayer.tsx, MapPopup.tsx, coverage.store.ts, ui.store.ts, settings.store.ts, morph-types.ts, coverage-utils.ts, map-utils.ts, coverage.ts

## Review Verdict: PASS WITH ISSUES

Three blocking issues must be resolved before implementation. All are resolvable without architectural changes.

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-C.1 Bottom Sheet Core | Excellent | Strong | H-1, H-3, M-1 | PASS with fixes |
| WS-C.2 Bottom Sheet Advanced | Excellent | Strong | None beyond C.1 interface gap | PASS |
| WS-C.3 Map View | Good | Strong | M-4, L-2 | PASS |
| WS-C.4 Map Interactions | Good | Mixed (API mismatch) | H-1, H-2, M-3 | PASS with fixes |
| WS-C.5 Settings Sheet | Good | Strong | M-2, L-3 | PASS |
| PHASE-C-OVERVIEW | Excellent | Strong | Underrates Conflict 2 severity | PASS |

---

## Issues Found

### HIGH Severity

#### H-1: MobileBottomSheet API Mismatch Between C.1 and C.4 (BLOCKING)

C.1 defines `MobileBottomSheetProps` with `{ isOpen, onDismiss, config: BottomSheetConfig, children }`. C.4 consumes it as `{ snapPoints: number[], initialSnap, onClose, ariaLabel, children }`. Five discrepancies: config object vs separate props, `onDismiss` vs `onClose`, `isOpen` vs conditional rendering, snap format, and missing `ariaLabel`.

**Fix:** Settle on C.1's config-based pattern. C.4 uses `SHEET_CONFIGS.alertDetail`. Add `ariaLabel: string` to C.1's base props. Settle on `onDismiss`. Update C.4's integration code.

#### H-2: Snap Point Format Mismatch (BLOCKING)

C.1 uses integer percentages `[70, 100]`. C.4 uses decimal fractions `[0.7, 1.0]`. Would render a sub-pixel sliver if passed directly.

**Fix:** C.4 must use integer percentages or `SHEET_CONFIGS.alertDetail`. Add runtime guard to C.1.

#### H-3: C.1 Lacks Extension Points for C.2 (BLOCKING)

C.2 needs to inject fullscreen button, focus trap, and history hooks into C.1's component. C.1 has no slots, ref API, or exported hook types for this.

**Fix:** Add `headerActions?: ReactNode` slot. Export `useBottomSheetDrag` return type. Use `forwardRef` + `useImperativeHandle` for `{ snapTo, dismiss, getCurrentSnap }`.

### MEDIUM Severity

#### M-1: Snap tokens vs percentage API incompatibility
WS-A.3 snap tokens are pixel values; C.1 uses percentages. Document `SHEET_CONFIGS` as authoritative.

#### M-2: useApiHealth / useDataFreshness overlap
C.5 should wrap B.3's hook instead of reimplementing.

#### M-3: Map fly-to offset for bottom sheet
Marker flies to center but ends up behind 70% sheet. Add `padding.bottom` to `flyTo` call.

#### M-4: MobileStateView still unassigned
Was added to WS-A.2 D-8 per Phase A Review H-3. This is resolved.

### LOW Severity

#### L-1: Two sheet state mechanisms (store vs local state) — acceptable per AD-C16.
#### L-2: C.3 height calc uses inline pixels instead of tokens.
#### L-3: C.5 direct fetch instead of tarvariGet wrapper.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| Phase A deliverables referenced correctly | OK | Glass/spring/safe area tokens all traced correctly. |
| Phase B deliverables referenced correctly | OK | useDataFreshness from B.3 correctly referenced. |
| Phase C -> D dependency chain correct | OK | D.1/D.2 depend on C.1+C.2. D.2 replaces C.4 stub. |
| SOW scopes do not overlap | OK | Clear boundaries between C.1-C.5. |
| Dependencies bidirectionally consistent | ISSUE | C.4 dependency table documents wrong API. |
| Acceptance criteria measurable | OK | 110+ ACs across 5 SOWs. |
| All codebase references verified | OK | Every store action, type, prop confirmed. |
| CoverageMap zero-modification verified | OK | C.3 wraps it; no props changes needed. |
| Settings store persist compatible | OK | `idleLockTimeoutMinutes` addition is additive. |

---

## Blocking Assessment

**Blocking for next phase planning?** No — Phase D can proceed.

**Required fixes before implementation:**
1. H-1: Settle on one API style (config-based). Update C.4 integration code.
2. H-2: C.4 uses integer percentages or named configs.
3. H-3: C.1 adds `headerActions` slot, `forwardRef`, exported hook types.

**Recommended fixes (non-blocking):**
4. M-3: Add `padding.bottom` to fly-to call.
5. M-2: C.5 wraps B.3's `useDataFreshness`.
6. L-2: C.3 uses token `var()` references for height calc.
7. L-3: C.5 uses `tarvariGet` wrapper.
