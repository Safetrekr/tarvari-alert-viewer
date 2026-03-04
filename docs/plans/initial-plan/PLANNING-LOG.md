# Planning Log — Tarva Launch

> **Project:** Tarva Launch
> **Started:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Current Phase:** COMPLETE
> **Current Step:** DONE
> **Final Verdict:** PASS (all blocking conditions resolved)

## Status Summary

| Phase | SOWs Written | SOWs Total | Overview | Review           | Gate |
| ----- | ------------ | ---------- | -------- | ---------------- | ---- |
| 0     | 3/3          | 3          | DONE     | PASS WITH ISSUES | PASS |
| 1     | 7/7          | 7          | DONE     | PASS WITH ISSUES | PASS |
| 2     | 7/7          | 7          | DONE     | PASS WITH ISSUES | PASS |
| 3     | 7/7          | 7          | DONE     | PASS WITH ISSUES | PASS |
| 4     | 4/4          | 4          | DONE     | PASS WITH ISSUES | PASS |

## Issues Log

| #   | Phase | SOW            | Issue                                                                              | Severity | Resolution                                                                                                      | Status                   |
| --- | ----- | -------------- | ---------------------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------- | ------------------------ | ----- |
| 1   | 0     | WS-0.2         | layout.tsx omitted QueryProvider                                                   | MEDIUM   | Added QueryProvider import and wrapping                                                                         | FIXED                    |
| 2   | 0     | WS-0.2         | Referenced "Next.js 15" instead of "Next.js 16"                                    | MEDIUM   | Corrected to "Next.js 16"                                                                                       | FIXED                    |
| 3   | 0     | ALL            | No file modification convention between SOWs                                       | MEDIUM   | Added convention section to PHASE-0-OVERVIEW.md                                                                 | FIXED                    |
| 4   | 0     | WS-0.2         | Used "npm run dev" instead of "pnpm dev"                                           | MEDIUM   | Corrected to "pnpm dev"                                                                                         | FIXED                    |
| 5   | 0     | WS-0.3         | Spike page path missing `src/` prefix                                              | LOW      | Noted for implementation                                                                                        | OPEN                     |
| 6   | 0     | WS-0.1         | Directory tree missing `src/styles/`                                               | LOW      | Noted for implementation                                                                                        | OPEN                     |
| 7   | 0     | WS-0.3         | Blocks list incomplete (missing WS-1.2, WS-1.6)                                    | LOW      | Noted for implementation                                                                                        | OPEN                     |
| 8   | 0     | WS-0.2         | Open Questions table missing Owner column                                          | LOW      | Noted for implementation                                                                                        | OPEN                     |
| 9   | 1     | WS-1.3         | Wrong Framer Motion import path (`framer-motion` → `motion/react`)                 | HIGH     | Corrected both instances                                                                                        | FIXED                    |
| 10  | 1     | WS-1.1         | Space key for return-to-hub conflicts with WS-1.4 D-5                              | MEDIUM   | Removed Space key, Home only                                                                                    | FIXED                    |
| 11  | 1     | WS-1.6         | usePanPause hook defined by both WS-1.1 and WS-1.6                                 | MEDIUM   | WS-1.1 owns; WS-1.6 imports                                                                                     | FIXED                    |
| 12  | 1     | WS-1.1         | Undeclared dependency on WS-1.7 types                                              | MEDIUM   | Noted; add soft dependency                                                                                      | OPEN                     |
| 13  | 1     | 4 SOWs         | OQ tables missing Owner column (recurring)                                         | MEDIUM   | Noted for implementation                                                                                        | OPEN                     |
| 14  | 1     | WS-1.7         | Health color token naming (`--status-*` vs `--color-*`)                            | MEDIUM   | Standardize on spatial tokens                                                                                   | OPEN                     |
| 15  | 2     | WS-2.3, WS-2.4 | Port 3005 collision — both targeted same port                                      | HIGH     | Changed WS-2.4 to port 4000 per TARVA-SYSTEM-OVERVIEW.md                                                        | FIXED                    |
| 16  | 2     | WS-2.6         | Used "npm run" instead of "pnpm" in checklist                                      | LOW      | Corrected to "pnpm"                                                                                             | FIXED                    |
| 17  | 2     | 4 SOWs         | `src/types/` proliferation despite Phase 1 Gap 1                                   | HIGH     | Option A adopted: `src/types/districts/{name}.ts` for domain types                                              | FIXED                    |
| 18  | 2     | WS-2.2-2.5     | Type file location 4-way inconsistency                                             | HIGH     | Standardized to `src/types/districts/{name}.ts`; all Phase 2 SOWs updated                                       | FIXED                    |
| 19  | 2     | WS-2.3, WS-2.4 | Status enum divergence across districts                                            | MEDIUM   | Standardize on canonical HealthState                                                                            | OPEN                     |
| 20  | 2     | WS-2.2, WS-2.3 | Receipt integration pattern inconsistency                                          | MEDIUM   | Adopt WS-2.4 framework-managed pattern                                                                          | OPEN                     |
| 21  | 2     | WS-2.6         | Glass BG opacity 0.06 vs VISUAL-DESIGN-SPEC 0.07                                   | MEDIUM   | Noted for implementation                                                                                        | OPEN                     |
| 22  | 2     | WS-2.6         | 3-layer vs 4-layer glow prose inconsistency                                        | MEDIUM   | Update prose to 4-layer                                                                                         | OPEN                     |
| 23  | 2     | 5 SOWs         | OQ tables missing Owner column (recurring)                                         | MEDIUM   | Noted for implementation                                                                                        | OPEN                     |
| 24  | 2     | WS-2.7         | CSS @keyframes outside ambient-effects.css                                         | MEDIUM   | Move to ambient-effects.css                                                                                     | OPEN                     |
| 25  | 2     | WS-2.2-2.4     | Fetch timeout inconsistency (3s vs 5s)                                             | MEDIUM   | Standardize on single timeout                                                                                   | OPEN                     |
| 26  | 3     | WS-3.4, WS-3.6 | Ollama client duplication — WS-3.4 used `ollama` npm, WS-3.6 used native fetch     | HIGH     | Unified on native fetch (WS-3.6 approach); WS-3.4 wraps shared client                                           | FIXED                    |
| 27  | 3     | WS-3.3, WS-3.4 | AI beta toggle dual-store — `settings.store` vs `ai.store`                         | HIGH     | Consolidated to `ai.store.ts` (WS-3.4); WS-3.3 reads via `useAIStore`                                           | FIXED                    |
| 28  | 3     | WS-3.3         | Tarva Chat port 3005 (should be 4000 per Phase 2 fix)                              | MEDIUM   | Updated to localhost:4000                                                                                       | FIXED                    |
| 29  | 3     | WS-3.2         | LaunchReceipt import path mismatch (`@/lib/interfaces/types` vs `receipt-store`)   | MEDIUM   | Update import or add re-export                                                                                  | OPEN                     |
| 30  | 3     | WS-3.4, WS-3.6 | Inconsistent API route namespace (`/api/ai/chat` vs `/api/narrate`)                | MEDIUM   | Move narration to `/api/ai/narrate`                                                                             | OPEN                     |
| 31  | 3     | WS-3.5, WS-3.6 | "Framer Motion" label in dependency tables (code uses `motion`)                    | MEDIUM   | Recurring from Phase 2 L-7                                                                                      | OPEN                     |
| 32  | 3     | WS-3.7         | ~130 lines of domain types in shared `types.ts`                                    | MEDIUM   | Extract to `attention-types.ts`                                                                                 | OPEN                     |
| 33  | 4     | WS-4.2         | Recovery templates used `bodyType: 'custom'` not in StationLayout union            | HIGH     | Changed to `bodyType: 'status'` (closest semantic match); InterventionStation renders custom content regardless | FIXED                    |
| 34  | 4     | WS-4.1, WS-4.3 | AIFeature name mismatch: code uses `'builder-mode'`, header uses `ai-builder-mode` | MEDIUM   | WS-1.7 defines `'builder-mode'`; WS-4.3 header corrected                                                        | FIXED                    |
| 35  | 4     | WS-4.2         | Recovery templates use wildcard `districtId: '*'` not in AppIdentifier union       | MEDIUM   | WS-1.7 already types `districtId` as `AppIdentifier                                                             | '\*'` — no change needed | FIXED |
| 36  | 4     | WS-4.4         | "Framer Motion" label in dependency table (recurring)                              | MEDIUM   | Change to `motion/react`                                                                                        | OPEN                     |
| 37  | 4     | 4 SOWs         | OQ table format inconsistency (3 different schemas)                                | MEDIUM   | Standardize on WS-4.1/WS-4.2 format                                                                             | OPEN                     |
| 38  | 4     | WS-4.2         | `'exception-triage'` AIFeature string not confirmed in WS-1.7                      | MEDIUM   | Verified: WS-1.7 AIFeature union includes `'exception-triage'`                                                  | FIXED                    |

## Deviations from Discovery Input

| #   | What Changed                                                                 | Why                                                                                                   | Impact                                                                                                 |
| --- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | Filename `ws-1.2-hub-atrium.md` → `ws-1.2-launch-atrium.md`                  | Hub→Launch rename was not applied to PLANNING-PROMPT.md filename                                      | None — corrected before SOW creation                                                                   |
| 2   | Route group `(hub)/` → `(launch)/` in AD-9 file structure                    | Hub→Launch rename consistency                                                                         | SOWs will use `(launch)/` for the route group                                                          |
| 3   | Space key removed from return-to-hub (Home key only)                         | WS-1.4 D-5 rationale: Space conflicts with scroll, button activation, text input                      | Minor UX change; Home key is standard                                                                  |
| 4   | Tarva Chat port changed from 3005 to 4000 in WS-2.4                          | Port collision with Project Room (WS-2.3) which also uses 3005; 4000 matches TARVA-SYSTEM-OVERVIEW.md | WS-2.4 all port references updated                                                                     |
| 5   | Ollama client consolidated to native fetch (WS-3.6 owns `ollama-client.ts`)  | WS-3.4 used `ollama` npm SDK while WS-3.6 used native fetch — incompatible approaches                 | WS-3.4 `OllamaProvider` now wraps shared client; `ollama` npm removed                                  |
| 6   | AI beta toggle consolidated to `ai.store.ts` (WS-3.4)                        | WS-3.3 created duplicate `settings.store.ts` with same toggle under different name                    | WS-3.3 reads toggle from `ai.store`; no `settings.store.ts` created                                    |
| 7   | Recovery templates changed from `bodyType: 'custom'` to `bodyType: 'status'` | `'custom'` not in StationLayout.bodyType union; WS-4.3 Zod schema explicitly rejects it               | InterventionStation renders custom panels regardless of bodyType; `'status'` is closest semantic match |
