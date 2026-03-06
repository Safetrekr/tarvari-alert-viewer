# Phase 2 Review: P1/P2 Feed & Real-Time Notifications

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-05
> **Documents Reviewed:** 7 (ws-2.1 through ws-2.6, PHASE-2-OVERVIEW.md)

## Review Verdict: PASS WITH ISSUES

Phase 2 is a well-architected body of work. The six SOWs cover the full scope of the combined-recommendations Phase 2 table. The dual-channel data architecture (REST polling + WebSocket push with cache-invalidation-only semantics) is sound and clearly documented. AD-1 (achromatic priority) is consistently enforced across all visual surfaces. The overview's identification of 7 cross-workstream conflicts is thorough and all proposed resolutions are correct. However, the overview resolutions were documented but **not propagated back into the individual SOW texts**, creating a layer of indirection that will force the implementer to cross-reference two documents. Three HIGH-severity issues were found: a non-existent type reference in WS-2.2, a missing `startMorph` call in WS-2.5's browser notification click handler (a genuine specification bug that would result in broken navigation), and a missing dependency declaration on WS-2.5. Six MEDIUM issues relate to un-propagated conflict resolutions and a settings store scope overlap that needs explicit sequencing.

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-2.1 | Excellent. All types, query function, hook config, and fallback logic thoroughly specified. 15 ACs cover all code paths including edge cases (empty items, missing count fields). | All refs verified: `tarvariGet` (tarvari-api.ts lines 20-44), `use-intel-feed.ts` pattern, `@tanstack/react-query` `keepPreviousData` v5 API. | 0 issues. | **PASS** |
| WS-2.2 | Good. Comprehensive visual spec with 4 states, pulse animation, a11y, and page integration. | GRID_WIDTH/GRID_HEIGHT imports verified (page.tsx line 87). ZoomGate, SpatialCanvas patterns verified. | H-1 (wrong type name), M-4 (SEVERITY_COLORS redefinition), L-5 (mostRecentItem derivation). | **PASS WITH ISSUES** |
| WS-2.3 | Good. Navigation flow, dismissal chain, z-index stack, and animation spec are all correct and well-reasoned. | `startMorph` guard verified (ui.store.ts line 104). `setDistrictPreselectedAlertId` verified (coverage.store.ts line 196-199). `getCategoryMeta` verified (coverage.ts line 103-106). | M-3 (time-ago not shared per overview resolution), L-2 (draft text artifact). | **PASS WITH ISSUES** |
| WS-2.4 | Excellent. Dual-channel consistency contract (Section 4.8) is the strongest architectural documentation in this phase. Cache-invalidation-only invariant is clearly stated with visual flow diagram. | `getSupabaseBrowserClient()` verified (client.ts line 53). `useQueryClient` availability verified via QueryProvider tree. | M-1 (assumes adaptive polling contradicting overview resolution). | **PASS WITH ISSUES** |
| WS-2.5 | Good. Most complex SOW in the phase. Two-step consent flow, dual-channel dispatch, audio cue, and settings UI are comprehensive. 24 ACs cover all interaction paths. | settings.store.ts structure verified (persist middleware at line 78, partialize at line 109). | H-2 (missing startMorph in browser notification onclick), H-3 (missing WS-2.6 dependency), M-5 (integration wiring gap). | **PASS WITH ISSUES** |
| WS-2.6 | Good. Correct store placement decisions (D-1 through D-5). Code examples use correct Immer patterns. | coverage.store.ts Immer pattern verified (line 125). settings.store.ts persist + partialize verified (lines 78-116). | M-2 (scope not expanded per Conflict 4 resolution). | **PASS WITH ISSUES** |
| PHASE-2-OVERVIEW | Excellent. All 7 conflicts identified with sound resolutions. 6 gaps identified with actionable recommendations. Dependency graph and scheduling are correct. | N/A (synthesis document). | Overview resolutions not propagated to SOW texts (systemic). | **PASS WITH ISSUES** |

---

## Issues Found

### HIGH Severity

#### H-1. WS-2.2 references non-existent type `PriorityFeedData`

WS-2.2 Section 3 (Input Dependencies) states: *"`PriorityFeedData` must include: `p1Count: number`, `p2Count: number`, `items: PriorityFeedItem[]`."* WS-2.1 exports `PriorityFeedSummary`, not `PriorityFeedData`. The overview identifies this as Conflict 3 and prescribes the correct import, but the WS-2.2 SOW text was not corrected. An implementer reading WS-2.2 in isolation would search for a type that does not exist.

**Fix:** Find-replace `PriorityFeedData` with `PriorityFeedSummary` in WS-2.2 Sections 3 and 4.13. Approximately 3 occurrences. Also update WS-2.2 Section 4.13's derived state to use `data.mostRecentP1 ?? data.mostRecentP2` rather than `data.items[0]` (see L-5).

---

#### H-2. WS-2.5 browser notification onclick handler is missing `startMorph` call

WS-2.5 Section 4.7 specifies the browser notification click handler:

```typescript
notification.onclick = () => {
  window.focus()
  useCoverageStore.getState().setDistrictPreselectedAlertId(alert.id)
  // startMorph is called from the coverage store action or via the morph system
  notification.close()
}
```

The comment is incorrect. `setDistrictPreselectedAlertId` is a simple store setter (coverage.store.ts lines 196-199) -- it does NOT trigger `startMorph`. No automatic morph trigger exists anywhere in the codebase. Compare with the in-app toast "View" button handler (WS-2.5 Section 4.2) which correctly calls both `setDistrictPreselectedAlertId(alert.id)` and `startMorph(alert.category)`.

Without the `startMorph` call, clicking a browser notification will bring the tab to the foreground but the district view will never open. The preselected alert ID sits in the store unused until some other interaction triggers a morph.

**Fix:** Add `useUIStore.getState().startMorph(alert.category)` to the onclick handler, between `setDistrictPreselectedAlertId` and `notification.close()`. The `alert` object (typed as `PriorityAlertPayload`) has a `category: string` field available. Also requires the `morph.phase === 'idle'` guard to be respected (already handled inside `startMorph` at ui.store.ts line 104).

```typescript
notification.onclick = () => {
  window.focus()
  useCoverageStore.getState().setDistrictPreselectedAlertId(alert.id)
  useUIStore.getState().startMorph(alert.category)
  notification.close()
}
```

---

#### H-3. WS-2.5 dependency header omits WS-2.6

WS-2.5 header reads: *"Depends On: WS-2.4 (event trigger), WS-0.3 (sonner installed + Toaster in root layout), WS-0.4 (PriorityBadge component)."*

WS-2.5 Section 4.4 adds 4 fields to `settings.store.ts`: `inAppNotificationsEnabled`, `browserNotificationsEnabled`, `notificationConsent`, `audioNotificationsEnabled`. Per the overview's Conflict 4 resolution, WS-2.6 should provision all 4 of these fields before WS-2.5 is implemented. WS-2.6's own header correctly states "Blocks: WS-2.2, WS-2.3, WS-2.5." But the dependency is not declared from WS-2.5's side.

If the implementer follows WS-2.5's dependency list, they might attempt WS-2.5 before WS-2.6, leading to store modification conflicts.

**Fix:** Add `WS-2.6 (coverage store + settings store extensions)` to WS-2.5's "Depends On" line. This also makes the critical path explicit: WS-2.6 must complete before WS-2.5 can begin.

---

### MEDIUM Severity

- **M-1:** WS-2.4 assumes adaptive polling despite overview recommending deferral. WS-2.4 Section 2 and 4.5 document adaptive polling behavior as in-scope; overview Conflict 5 recommends Option A (defer adaptive polling, fixed 15s). Update WS-2.4 to clarify `isConnected` is exposed for diagnostic/future use only.
- **M-2:** WS-2.6 scope not expanded per Conflict 4 resolution. Overview prescribes all 4 notification fields in WS-2.6, but WS-2.6 only adds `notificationConsent`. Add the 3 additional fields + setters + partialize update.
- **M-3:** WS-2.3 time-ago helper not updated per Conflict 1/2 resolution. Should import shared `relativeTimeAgo` from `src/lib/time-utils.ts` (created by WS-2.2) instead of defining a local utility.
- **M-4:** WS-2.2 redefines SEVERITY_COLORS with hardcoded rgba values instead of importing from `src/lib/interfaces/coverage.ts` (lines 119-125). Creates divergence from single source of truth.
- **M-5:** Integration wiring between WS-2.4 and WS-2.5 not specified in any SOW. No deliverable covers the `onAlert` callback → `notify` method connection, the `RealtimeAlertPayload` → `PriorityAlertPayload` mapping, or the orchestration component in `page.tsx`.
- **M-6:** Test infrastructure gap persists from Phase 0. Multiple SOWs reference "unit tests" as verification methods but `pnpm test:unit` is not operational. Amend ACs with fallback verification methods.

### LOW Severity

- **L-1.** Overview executive summary says "3-5 developer-days"; Section 10 says "4.5-5 developer-days." Minor inconsistency.
- **L-2.** WS-2.3 Section 4.8 contains a draft editing artifact (inline self-correction about z-index ordering).
- **L-3.** Overview Gap 6 (strip-to-panel transition unspecified) is a false alarm. WS-2.2 Section 4.8 explicitly specifies the click handler toggling `priorityFeedExpanded`, and Section 4.9 adds the chevron indicator.
- **L-4.** Combined-recommendations z-index budget does not include z-34 (backdrop) and z-35 (PriorityFeedPanel) introduced by WS-2.3. Should be updated for project-wide z-index documentation.
- **L-5.** WS-2.2 Section 4.13 derives `mostRecentItem` as "first item in data.items" but should use `data.mostRecentP1 ?? data.mostRecentP2` from `PriorityFeedSummary`.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| SOW decisions align with Combined Recommendations | **ISSUE** | Combined-recommendations Phase 2 table says WS-2.6 adds `notificationConsent` to `coverage.store.ts`. All 6 SOWs correctly place it in `settings.store.ts` per validation finding. The combined-recommendations text is outdated on this point. Not blocking (SOWs are authoritative). |
| SOW scopes do not overlap | **ISSUE** | `settings.store.ts` modified by both WS-2.5 (Section 4.4) and WS-2.6 (Section 4.2). Overview Conflict 4 proposes consolidation into WS-2.6 but the SOW text was not updated (M-2). |
| SOW scopes have no gaps (every requirement traced) | **ISSUE** | Gap 1: No SOW specifies integration wiring between WS-2.4 and WS-2.5 (M-5). Gap: Conflict 7 payload mapping function unassigned to a specific deliverable. |
| Dependencies are bidirectionally consistent | **ISSUE** | WS-2.5 does not list WS-2.6 in its "Depends On" header despite WS-2.6 listing WS-2.5 in its "Blocks" list (H-3). |
| Acceptance criteria are measurable | **ISSUE** | Multiple SOWs reference "unit tests" as verification methods but no test runner is configured (M-6). Criteria are measurable in principle but not executable in the current project setup. |
| Open questions have owners and target phases | **OK** | 3 blocking OQs assigned to backend team with Phase 2 target. 17 non-blocking OQs all have owners. |
| Effort estimates are internally consistent | **OK** | Individual SOW estimates (4.5-5 days) are consistent with the overview and combined-recommendations (~4-5 days). Minor discrepancy in overview summary vs. detail (L-1). |
| File modifications across SOWs do not conflict | **ISSUE** | `settings.store.ts` is modified by WS-2.5 and WS-2.6. Conflict 4 resolution (consolidate into WS-2.6) is documented but not applied. `page.tsx` is modified by WS-2.2 (strip) and WS-2.3 (panel + Escape chain) -- additive, non-conflicting. |
| All codebase references (paths, types) are verified | **ISSUE** | H-1: `PriorityFeedData` does not exist (should be `PriorityFeedSummary`). M-4: WS-2.2 redefines `SEVERITY_COLORS` with different values instead of importing from `coverage.ts`. All other path/type references verified against source. |

---

## Blocking Assessment

**Blocking for next phase?** No

The issues are all correctable with text amendments to the SOW documents. No architectural redesign is needed. The overview correctly identified all cross-workstream conflicts; the gap is that resolutions were not propagated back into the individual SOWs.

**Required fixes before proceeding:**

1. **H-2:** Add `useUIStore.getState().startMorph(alert.category)` to WS-2.5 Section 4.7 browser notification onclick handler. This is a specification bug that would produce broken functionality if implemented as written.
2. **H-3:** Add `WS-2.6` to WS-2.5's "Depends On" header to ensure correct implementation ordering.
3. **M-5:** Add integration wiring specification (payload mapping function + orchestration component) to WS-2.5 or as a WS-2.5a addendum. Without this, the implementer has no specification for the most architecturally sensitive piece of the phase.

**Recommended fixes (non-blocking):**

1. **H-1:** Find-replace `PriorityFeedData` with `PriorityFeedSummary` in WS-2.2.
2. **M-1:** Update WS-2.4 to remove adaptive polling claims (align with Conflict 5 Option A).
3. **M-2:** Expand WS-2.6 to include all 4 notification settings fields per Conflict 4 resolution.
4. **M-3:** Update WS-2.3 to import shared time-ago utility per Conflict 1/2 resolution.
5. **M-4:** Change WS-2.2 to import `SEVERITY_COLORS` from `coverage.ts` instead of redefining.
6. **M-6:** Amend ACs that reference unit tests to specify fallback verification methods.
7. **L-2:** Clean up draft text artifact in WS-2.3 Section 4.8.
8. **L-5:** Update WS-2.2 Section 4.13 to use `data.mostRecentP1 ?? data.mostRecentP2`.
