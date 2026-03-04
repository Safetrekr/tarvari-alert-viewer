# Phase 3 Review: Receipts + Command Palette + AI

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-02-25
> **Documents Reviewed:** 7 (`ws-3.1-receipt-system.md`, `ws-3.2-evidence-ledger.md`, `ws-3.3-command-palette.md`, `ws-3.4-ai-camera-director.md`, `ws-3.5-station-template-selection.md`, `ws-3.6-narrated-telemetry.md`, `ws-3.7-attention-choreography.md`)
> **Cross-Referenced Against:** 5 (`combined-recommendations.md`, `tech-decisions.md`, `VISUAL-DESIGN-SPEC.md`, `PHASE-1-REVIEW.md`, `PHASE-2-REVIEW.md`)

---

## Review Verdict: PASS WITH ISSUES

**Rationale:** 2 HIGH severity issues (Ollama client duplication between WS-3.4 and WS-3.6, AI beta toggle dual-store between WS-3.3 and WS-3.4), 5 MEDIUM severity issues, 4 LOW severity issues. All 7 SOWs have complete 8/8 section structure. All SOWs correctly use `motion/react` (not `framer-motion`) in code, all use `pnpm` (not `npm`), no `Next.js 15` references, no `src/types/` proliferation (Phase 2 lesson applied), and all OQ tables include Owner columns (Phase 1/2 recurring issue resolved). The two HIGH issues are architectural conflicts within the AI subsystem that must be resolved before execution. Estimated total fix time: ~45 minutes for blocking fixes.

---

## Per-SOW Assessment

| SOW                                 | Completeness                                          | Ecosystem Grounding                                        | Issues Found                                                                                          | Rating           |
| ----------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------- |
| WS-3.1 (Receipt System)             | 8/8 sections. 22 ACs. 10 decisions. Has Owner column. | Good. AD-6, WS-1.7 ReceiptStore, Supabase schema correct.  | 1 MEDIUM (LaunchReceipt import path)                                                                  | PASS             |
| WS-3.2 (Evidence Ledger)            | 8/8 sections. 24 ACs. 10 decisions. Has Owner column. | Good. AD-6, VISUAL-DESIGN-SPEC glass tokens correct.       | 1 MEDIUM (LaunchReceipt import path)                                                                  | PASS             |
| WS-3.3 (Command Palette)            | 8/8 sections. 22 ACs. 11 decisions. Has Owner column. | Good. AD-7, WS-1.7 CommandPalette interface, cmdk correct. | 1 HIGH (AI beta toggle dual-store), 1 MEDIUM (port 3005)                                              | PASS WITH ISSUES |
| WS-3.4 (AI Camera Director)         | 8/8 sections. 25 ACs. 12 decisions. Has Owner column. | Good. AD-7, WS-1.7 AIRouter/CameraController correct.      | 1 HIGH (Ollama client conflicts with WS-3.6), 1 HIGH (AI beta toggle dual-store)                      | PASS WITH ISSUES |
| WS-3.5 (Station Template Selection) | 8/8 sections. 20 ACs. 9 decisions. Has Owner column.  | Good. AD-7, AD-8, WS-1.7 StationTemplateRegistry correct.  | 1 MEDIUM (Framer Motion label)                                                                        | PASS             |
| WS-3.6 (Narrated Telemetry)         | 8/8 sections. 26 ACs. 8 decisions. Has Owner column.  | Good. AD-7, WS-1.7 AIRouter correct.                       | 1 HIGH (Ollama client conflicts with WS-3.4), 1 MEDIUM (Framer Motion label), 1 LOW (duplicate types) | PASS WITH ISSUES |
| WS-3.7 (Attention Choreography)     | 8/8 sections. 22 ACs. 9 decisions. Has Owner column.  | Good. AD-3, WS-1.5/1.6/1.7 correct.                        | 1 MEDIUM (domain types in shared types.ts)                                                            | PASS             |

---

## Issues Found

### HIGH Severity

#### H-1: Ollama Client Duplication — WS-3.4 and WS-3.6

**Location:** WS-3.4 `src/lib/ai/ollama-provider.ts` uses `import { Ollama } from 'ollama'` (npm package SDK). WS-3.6 `src/lib/ai/ollama-client.ts` uses native `fetch()` and explicitly states it does NOT use the `ollama` npm package.

**Problem:** Both workstreams claim to provide the shared Ollama integration but use incompatible approaches. WS-3.4 uses the `ollama` npm SDK with `Ollama.chat()`. WS-3.6 uses native `fetch()` with custom request/response types. They also use different API endpoints (`/api/chat` vs `/api/generate`). A developer executing both will create conflicting clients in `src/lib/ai/`.

**Fix:** Choose one approach. Recommended: Native fetch (WS-3.6 approach) to minimize dependencies. Add a `chatCompletion()` function for WS-3.4's needs. Single client file, single type set.

#### H-2: AI Beta Toggle Dual-Store — WS-3.3 and WS-3.4

**Location:** WS-3.3 creates `src/stores/settings.store.ts` with `aiCameraDirectorEnabled` (localStorage key: `tarva-launch-settings`). WS-3.4 creates `src/stores/ai.store.ts` with `betaEnabled` (localStorage key: `tarva-launch-ai-beta`).

**Problem:** Two stores control the same feature with different field names and localStorage keys. Command palette reads `settings.store`, AI Camera Director reads `ai.store`. Toggling one doesn't affect the other — the user sees "Ask AI..." but queries are rejected, or vice versa.

**Fix:** Consolidate to `ai.store.ts` (WS-3.4). Remove `aiCameraDirectorEnabled` from `settings.store.ts`. Update command palette to read `useAIStore(aiSelectors.isAIAvailable)`.

### MEDIUM Severity

#### M-1: Port 3005 for Tarva Chat

**Problem:** WS-3.3 command registry assigns Tarva Chat to `localhost:3005`. Phase 2 Review H-1 changed this to `localhost:4000`.

**Fix:** Update WS-3.3 `APP_URLS` to use `localhost:4000` for Tarva Chat.

#### M-2: LaunchReceipt Import Path Mismatch

**Problem:** WS-3.2 imports `LaunchReceipt` from `@/lib/interfaces/types`, but WS-1.7/WS-3.1 define it in `src/lib/interfaces/receipt-store.ts`.

**Fix:** Update WS-3.2 to import from `@/lib/interfaces/receipt-store` or add re-export to `types.ts`.

#### M-3: Inconsistent API Route Organization

**Problem:** WS-3.4 uses `/api/ai/chat` (under `/api/ai/` namespace), WS-3.6 uses `/api/narrate` (top-level).

**Fix:** Move narration route to `/api/ai/narrate/route.ts` for consistent AI route grouping.

#### M-4: "Framer Motion" Label in Dependency Tables

**Problem:** WS-3.5 and WS-3.6 dependency tables label the package as "Framer Motion" but it's `motion` (npm).

**Fix:** Change dependency name to `motion`. Recurring from Phase 2 L-7.

#### M-5: WS-3.7 Adds ~130 Lines of Domain Types to Shared types.ts

**Problem:** Attention-choreography-specific types (`AttentionState`, `PerformanceLevel`, `EffectConfig`, etc.) added to shared `src/lib/interfaces/types.ts`, bloating it.

**Fix:** Create `src/lib/interfaces/attention-types.ts` for feature-specific types.

### LOW Severity

| #   | Issue                                                                           | Fix                                   |
| --- | ------------------------------------------------------------------------------- | ------------------------------------- |
| L-1 | PHASE-3-OVERVIEW.md pending (synthesis in progress)                             | Will be created by CTA synthesis task |
| L-2 | WS-3.6 defines its own Ollama types duplicating WS-3.4's `ollama` package types | Resolves automatically with H-1 fix   |
| L-3 | WS-3.4 D-11 is the only SOW to explicitly document `motion/react` convention    | Informational — good practice         |
| L-4 | Inconsistent npm source column formatting between WS-3.5 and WS-3.6             | Resolves with M-4 fix                 |

---

## Cross-Phase Consistency Check

| Check                                             | Status | Notes                                                                               |
| ------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| SOW decisions align with Combined Recommendations | OK     | AD-6 and AD-7 correctly implemented across all SOWs.                                |
| SOW decisions align with tech-decisions.md        | ISSUE  | H-1: Ollama approach inconsistent. All other tech choices correct.                  |
| SOW visual specs align with VISUAL-DESIGN-SPEC.md | OK     | Glass, glow, animation tokens all correct.                                          |
| SOW scopes do not overlap                         | ISSUE  | H-1: Both WS-3.4 and WS-3.6 claim shared Ollama client. H-2: Dual AI toggle stores. |
| SOW scopes have no gaps                           | OK     | All Phase 3 features covered.                                                       |
| Dependencies are bidirectionally consistent       | OK     | All dependencies correctly cross-referenced.                                        |
| Acceptance criteria are measurable                | OK     | ~161 total ACs. All specify verification methods.                                   |
| Open questions have owners                        | OK     | **RESOLVED** — all 7 SOWs include Owner columns. Phase 1 M-3 / Phase 2 M-5 fixed.   |
| `motion/react` used consistently                  | OK     | Zero `framer-motion` code imports. Phase 1 H-1 fully resolved.                      |
| `pnpm` used consistently                          | OK     | Zero `npm` instances. Phase 0 M-4 / Phase 2 L-1 fully resolved.                     |
| No `src/types/` proliferation                     | OK     | Zero `src/types/` files. Phase 2 H-2/H-3 fully resolved.                            |
| Port assignments unique                           | ISSUE  | M-1: WS-3.3 still uses port 3005 for Tarva Chat (should be 4000 per Phase 2 fix).   |

---

## Blocking Assessment

**Blocking for next phase?** No (after blocking fixes applied)

**Required fixes before proceeding (blocking):**

1. H-1: Resolve Ollama client duplication — choose native fetch or npm SDK, unify in single file
2. H-2: Consolidate AI beta toggle to single store (`ai.store.ts`)

**Recommended fixes (non-blocking):**

- M-1: Update WS-3.3 Tarva Chat port to 4000
- M-2: Standardize LaunchReceipt import path
- M-3: Move `/api/narrate` to `/api/ai/narrate`
- M-4: Fix "Framer Motion" labels in dependency tables
- M-5: Extract WS-3.7 attention types to separate file
- L-1 through L-4: Minor cleanup
