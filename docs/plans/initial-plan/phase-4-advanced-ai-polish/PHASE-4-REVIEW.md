# Phase 4 Review: Advanced AI + Polish

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-02-25
> **Documents Reviewed:** 4 (`ws-4.1-claude-api-integration.md`, `ws-4.2-exception-triage.md`, `ws-4.3-builder-mode.md`, `ws-4.4-visual-polish-pass.md`)
> **Cross-Referenced Against:** 4 (`combined-recommendations.md`, `tech-decisions.md`, `VISUAL-DESIGN-SPEC.md`, `phase-3-receipts-command-palette-ai/PHASE-3-REVIEW.md`)

---

## Review Verdict: PASS WITH ISSUES

**Rationale:** 1 HIGH severity issue (recovery template `bodyType: 'custom'` not in StationTemplate bodyType union), 5 MEDIUM severity issues, 3 LOW severity issues. All 4 SOWs have complete 8/8 required sections. All SOWs correctly use `motion/react` (not `framer-motion`) in code imports. All use `pnpm` (not `npm` CLI). No `src/types/` proliferation. All OQ tables include Owner columns (Phase 1/2 recurring issue remains resolved). WS-4.1 correctly integrates with WS-3.4 LiveAIRouter. WS-4.3 correctly requires Claude with no Ollama fallback. WS-4.4 correctly references VISUAL-DESIGN-SPEC.md token values. The HIGH issue is a type system inconsistency where WS-4.2 recovery templates use a `bodyType` value that has not been established in the station panel framework vocabulary. All issues are fixable without architectural changes. Estimated total fix time: ~30 minutes for blocking fix, ~45 minutes for all recommended fixes.

---

## Per-SOW Assessment

| SOW                             | Completeness                                                                                          | Ecosystem Grounding                                                                                                                                                                                                          | Issues Found                                                                   | Rating           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------- |
| WS-4.1 (Claude API Integration) | 8/8 sections. 25 ACs. 12 decisions. 5 OQs with Owner. 10 risks.                                       | Excellent. AD-7, tech-decisions.md routing table, WS-3.4 LiveAIRouter pattern all correctly referenced. `@anthropic-ai/sdk` per dependency list. Server-side only constraint properly enforced.                              | 1 MEDIUM (AIFeature name mismatch)                                             | PASS             |
| WS-4.2 (Exception Triage)       | 8/8 sections. 20 ACs. 11 decisions. 5 OQs with Owner. 8 risks.                                        | Good. AD-7 routing entry, combined-recommendations.md Phase 4 Work Area #2, four exception categories match. Rule-engine fallback per tech-decisions.md.                                                                     | 1 HIGH (bodyType 'custom'), 1 MEDIUM (wildcard districtId)                     | PASS WITH ISSUES |
| WS-4.3 (Builder Mode)           | 8/8 sections + Section 9 (Implementation Checklist). 24 ACs. 11 decisions. 6 OQs with Owner. 8 risks. | Excellent. Claude-only per tech-decisions.md routing table. Deferred Item #6 correctly scoped (template vocabulary, not generative UI). Zod safety contract well-designed.                                                   | 1 MEDIUM (AIFeature name mismatch with header), 1 MEDIUM (OQ table format)     | PASS             |
| WS-4.4 (Visual Polish Pass)     | 8/8 sections. 14 ACs. 10 decisions. 5 OQs with Owner. 6 risks.                                        | Excellent. All VISUAL-DESIGN-SPEC.md section references correct. Glass recipe values (0.03/12px/120%, 0.06/16px/130%, 0.80/24px/140%) match spec exactly. Ember (#E05200) and teal (#277389) token values match Section 6.1. | 1 MEDIUM (Framer Motion label in dependency table), 1 MEDIUM (OQ table format) | PASS             |

---

## Issues Found

### HIGH Severity

#### H-1: Recovery Templates Use Undefined `bodyType: 'custom'` -- WS-4.2

**Location:** WS-4.2 `src/lib/ai/recovery-templates.ts` -- all four recovery templates (`INTERVENTION_RETRY`, `INTERVENTION_ESCALATION`, `INTERVENTION_CONFIGURATION`, `INTERVENTION_INFORMATION_REQUEST`) set `bodyType: 'custom'`.

**Problem:** The `bodyType` value `'custom'` does not appear in the established StationTemplate vocabulary. WS-4.3's Zod schema defines the allowed body types as exactly `['metrics', 'list', 'table', 'chart', 'log', 'status', 'empty']` (per AC-20, which explicitly tests rejection of `bodyType: 'custom'`). The WS-2.6 station panel framework (Phase 2) defines body type renderers for specific types. If `'custom'` is not in the `StationLayout.bodyType` union type from WS-1.7, these templates will fail TypeScript strict mode. If `'custom'` is added to the union, WS-4.3's Zod schema must acknowledge it exists (even if builder proposals cannot use it).

The root issue: WS-4.2's `InterventionStation` component renders custom content (RetryPanel, EscalationPanel, etc.) regardless of the bodyType field -- the bodyType is essentially ignored for recovery templates. But the type system does not know that.

**Fix (recommended):** Add `'custom'` to the `StationLayout.bodyType` union in WS-1.7 / WS-2.6 as a valid body type that renders a slot for arbitrary children. Update WS-4.3's Zod schema comment to note that `'custom'` is intentionally excluded from builder proposals (Claude should not propose custom body types since the panel framework has no generic renderer for them). Alternatively, change the recovery templates to use `bodyType: 'status'` (the closest semantic match for recovery panels) and render custom content within the status renderer.

**Impact:** TypeScript compilation will fail on `pnpm typecheck` if `'custom'` is not in the bodyType union. Blocking for implementation.

### MEDIUM Severity

#### M-1: AIFeature Name Mismatch Between SOW Headers and Code -- WS-4.1 / WS-4.3

**Location:** WS-4.3 header Resolves line uses `ai-builder-mode`. WS-4.1 and WS-4.3 code both use `'builder-mode'` as the feature string in `AIRouter.route({ feature: 'builder-mode' })` and in the `RATE_LIMITS` map. Tech-decisions.md display name is "AI Builder Mode".

**Problem:** The AIFeature string literal in code (`'builder-mode'`) does not match the header metadata reference (`ai-builder-mode`). The WS-1.7 `AIFeature` type union defines the valid feature strings. If WS-1.7 defines it as `'ai-builder-mode'`, the code in WS-4.1 (rate limits) and WS-4.3 (route calls) uses the wrong string. If WS-1.7 defines it as `'builder-mode'`, the WS-4.3 header metadata is wrong.

**Fix:** Verify the `AIFeature` union in WS-1.7 `src/lib/interfaces/ai-router.ts`. Update WS-4.3's header Resolves line to match whichever string WS-1.7 defines. Most likely the code is correct (`'builder-mode'`) and the header reference should be updated.

#### M-2: Recovery Templates Use Wildcard `districtId: '*'` -- WS-4.2

**Location:** WS-4.2 `src/lib/ai/recovery-templates.ts` -- all four recovery templates set `districtId: '*'`.

**Problem:** The `StationTemplate.districtId` field is typed as `AppIdentifier` in WS-1.7. If `AppIdentifier` is a string literal union (`'agent-builder' | 'tarva-chat' | 'project-room' | 'tarva-core' | 'tarva-erp' | 'tarva-code'`), then `'*'` is not a valid value and TypeScript will reject it. The wildcard semantics (template applies to any district) are not represented in the type system.

**Fix:** Either (a) add `'*'` to `AppIdentifier` as a wildcard sentinel, or (b) make `districtId` on recovery templates `AppIdentifier | '*'` via a type extension, or (c) create individual recovery templates per district rather than using wildcards.

#### M-3: "Framer Motion" Label in WS-4.4 Dependency Table

**Location:** WS-4.4 Section 3 Input Dependencies, line 65: `Framer Motion variants for capsule/sibling/district transitions`.

**Problem:** The dependency description for WS-2.1 uses the term "Framer Motion" as a product name. While technically the product is still called Framer Motion, the npm package is `motion` and the import is `motion/react`. This is the same labeling inconsistency flagged as M-4 in the Phase 3 Review. The WS-4.4 npm dependency table (line 70) correctly labels it as `motion/react v12+`, so this is limited to the WS-2.1 description prose.

**Fix:** Change "Framer Motion variants" to "`motion/react` variants" in the WS-2.1 dependency description.

#### M-4: OQ Table Format Inconsistency Between SOWs

**Location:** WS-4.1 OQ columns: `ID | Question | Owner | Impact | Default if Unresolved`. WS-4.2 OQ columns: `ID | Question | Owner | Impact | Default if Unresolved`. WS-4.3 OQ columns: `# | Question | Impact | Owner | Resolution Deadline`. WS-4.4 OQ columns: `ID | Question | Impact | Owner | Status`.

**Problem:** Three different OQ table schemas across four SOWs. WS-4.3 uses `#` instead of `ID`, swaps Owner/Impact column order, and replaces "Default if Unresolved" with "Resolution Deadline". WS-4.4 uses "Status" instead of "Default if Unresolved". While all include Owner (the recurring check), the inconsistent schemas make cross-SOW comparison harder.

**Fix:** Standardize on the WS-4.1/WS-4.2 format: `ID | Question | Owner | Impact | Default if Unresolved`.

#### M-5: WS-4.2 Exception-Triage Routing Table Feature Name Not in tech-decisions.md

**Location:** WS-4.2 uses `feature: 'exception-triage'` in `AIRouter.route()` calls. Tech-decisions.md routing table lists "Exception triage" as a feature but does not specify the exact `AIFeature` string literal.

**Problem:** The mapping between tech-decisions.md display names and the `AIFeature` string literals used in WS-1.7's type union is implicit. WS-4.2 assumes `'exception-triage'` is the correct feature string. This needs to be verified against the WS-1.7 `AIFeature` type and the `AI_ROUTING_TABLE` constant.

**Fix:** Verify `'exception-triage'` is in the WS-1.7 `AIFeature` union and `AI_ROUTING_TABLE`. If not, add it. This is likely already present since WS-4.2 references it in the header Resolves line (`AD-7 interface #5 exception-triage routing entry`).

### LOW Severity

| #   | Issue                                                                                                 | Location          | Fix                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| L-1 | WS-4.3 has Section 9 (Implementation Checklist) beyond the required 8 sections                        | WS-4.3            | Informational -- additive content, not an error. Other SOWs could benefit from similar checklists |
| L-2 | WS-4.4 dependency table labels npm packages as "npm package" in the Source column, not "npm"          | WS-4.4 line 70-71 | Stylistic inconsistency with WS-4.2/4.3 which use just "npm". Non-blocking                        |
| L-3 | WS-4.2 references Phase 3 Review H-1 fix ("ollama-client.ts shared Ollama client") in dependency line | WS-4.2 line 9     | Correctly references the resolved native-fetch Ollama client from WS-3.6. Informational           |

---

## Cross-Phase Consistency Check

| Check                                             | Status | Notes                                                                                                                                                                                                                            |
| ------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SOW decisions align with Combined Recommendations | OK     | All Phase 4 work areas (Claude API, Exception Triage, Builder Mode, Visual Polish) covered. Exception categories match. Builder Mode uses template vocabulary per Deferred Item #6.                                              |
| SOW decisions align with tech-decisions.md        | ISSUE  | M-1: AIFeature string `'builder-mode'` vs `'ai-builder-mode'` needs alignment with WS-1.7 type. All other tech choices correct: `@anthropic-ai/sdk`, `pnpm`, Zustand, `motion/react`, `zod`.                                     |
| SOW visual specs align with VISUAL-DESIGN-SPEC.md | OK     | WS-4.4 glass recipes (0.03/12px/120%, 0.06/16px/130%, 0.80/24px/140%) match Section 1.7 exactly. Color tokens match Section 6.1. Typography audit references Sections 3.1-3.4. Glow audit references Sections 1.8, 4.2, 4.4.     |
| SOW scopes do not overlap                         | OK     | Four distinct concerns: provider integration, failure classification, station generation, visual tuning. No overlap detected.                                                                                                    |
| SOW scopes have no gaps                           | OK     | All 4 combined-recommendations.md Phase 4 work areas have corresponding SOWs.                                                                                                                                                    |
| Dependencies are bidirectionally consistent       | OK     | All workstreams are terminal (block nothing). WS-4.2 and WS-4.3 depend on WS-4.1 (soft and hard respectively). WS-4.4 depends on prior-phase workstreams only. No missing reverse references needed since all are terminal.      |
| Acceptance criteria are measurable                | OK     | 83 total ACs across 4 SOWs. All specify verification methods (unit test, integration test, functional test, build verification, visual inspection, or code review).                                                              |
| Open questions have owners                        | OK     | All 4 SOWs include Owner columns in OQ tables (21 total OQs). Phase 1/2 recurring issue remains resolved.                                                                                                                        |
| `motion/react` used consistently                  | OK     | Zero `framer-motion` code imports across all SOWs. WS-4.2 D-9 and WS-4.3 D-9 explicitly document the `motion/react` convention. WS-4.4 correctly uses `motion/react` in all code and dependency references.                      |
| `pnpm` used consistently                          | OK     | All CLI references use `pnpm` (`pnpm add`, `pnpm typecheck`, `pnpm tsc --noEmit`, `pnpm build`, `pnpm run lint`, `pnpm format`). The word "npm" appears only as a registry source label in dependency tables, not as a CLI tool. |
| No `src/types/` proliferation                     | OK     | Zero `src/types/` file references. WS-4.2 types in `src/lib/interfaces/exception-triage.ts`. WS-4.3 types in `src/lib/ai/builder-types.ts`. Phase 2 lesson fully applied.                                                        |
| Port assignments unique                           | OK     | No new port assignments in Phase 4. Not applicable to this phase.                                                                                                                                                                |

---

## Blocking Assessment

**Blocking for next phase?** N/A (terminal phase)

**Required fixes (blocking for implementation):**

1. **H-1**: Resolve `bodyType: 'custom'` inconsistency -- either add `'custom'` to the `StationLayout.bodyType` union in WS-1.7/WS-2.6, or change WS-4.2 recovery templates to use an existing body type (e.g., `'status'`)

**Recommended fixes (non-blocking):**

- M-1: Verify and align AIFeature string (`'builder-mode'` vs `'ai-builder-mode'`) with WS-1.7 type union. Update WS-4.3 header Resolves line to match
- M-2: Add wildcard `'*'` to `AppIdentifier` or `StationTemplate.districtId` type to support recovery template cross-district applicability
- M-3: Change "Framer Motion variants" to "`motion/react` variants" in WS-4.4 dependency table
- M-4: Standardize OQ table column schemas across all 4 SOWs to `ID | Question | Owner | Impact | Default if Unresolved`
- M-5: Verify `'exception-triage'` is defined in WS-1.7 `AIFeature` union
- L-1 through L-3: Minor documentation cleanup
