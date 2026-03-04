# Phase 4 Overview: Advanced AI + Polish

> **Synthesized by:** CTA + SPO + STW + PMO perspectives
> **Input SOWs:** WS-4.1 through WS-4.4
> **Prior phases:** Phase 0 Overview, Phase 1 Overview, Phase 2 Overview, Phase 3 Overview
> **Discovery artifacts:** combined-recommendations.md
> **Date:** 2026-02-25

---

## 1. Executive Summary

Phase 4 is the terminal phase of the Tarva Launch initial plan. It completes the AI architecture defined in AD-7 by adding Claude as a secondary provider, delivers two new AI-powered features (Exception Triage and Builder Mode), and performs a systematic visual polish pass across all prior phases. The phase transforms the Launch from a single-provider AI system (Ollama + rule engines) into a dual-provider architecture (Ollama + Claude) while bringing the visual layer to production-grade fidelity.

The phase comprises **4 workstreams** across **3 engineering domains**:

| Domain                | Workstreams                                      | Purpose                                                                                                                                                        |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI Infrastructure** | WS-4.1 (Claude API Integration)                  | Add Claude as secondary AI provider via server-side Route Handler proxy, completing the dual-provider architecture with cost tracking and graceful degradation |
| **AI Features**       | WS-4.2 (Exception Triage), WS-4.3 (Builder Mode) | Rule-engine-first exception classification with intervention recovery UI; Claude-powered station template generation from natural language (stretch)           |
| **Visual Quality**    | WS-4.4 (Visual Polish Pass)                      | 9-category programmatic audit framework with CSS tuning -- no feature development, audit and correction only                                                   |

**Estimated complexity:** M (2-3 weeks) per combined-recommendations.md. Three agents are assigned: `world-class-backend-api-engineer` (WS-4.1), `world-class-autonomous-interface-architect` (WS-4.2, WS-4.3), and `world-class-ui-designer` (WS-4.4). WS-4.3 is explicitly marked **"Stretch"** in the SOW header, meaning it should be attempted only after WS-4.1 and WS-4.2 are complete and timeline permits.

**Key architectural decisions in this phase:**

- Claude operates exclusively server-side via a Next.js Route Handler proxy at `/api/ai/claude`; the `@anthropic-ai/sdk` package never appears in client bundles (WS-4.1 D-1)
- Claude is a quality upgrade, never a dependency -- the system works fully on Ollama + rule engines without an API key (WS-4.1 Objective)
- Exception triage uses a rule-engine-first architecture: deterministic rules handle common patterns in <1ms, Ollama consulted only for ambiguous cases with confidence <0.70 (WS-4.2 D-1, D-2)
- Builder Mode is Claude-only with no fallback -- novel station layout generation requires reasoning that Ollama cannot provide (WS-4.3 D-1)
- Claude selects from a constrained template vocabulary (7 body types, 5 button variants, ~60 Lucide icons) validated by Zod -- no executable code is accepted from the AI (WS-4.3 D-2)
- Visual polish is audit-and-tune only -- no new features are introduced by WS-4.4 (WS-4.4 scope)
- The `motion/react` import path is used consistently across all 4 SOWs (zero instances of `framer-motion`)
- `pnpm` is the canonical package manager (WS-4.1 AC-22, AC-23, AC-25; WS-4.2 AC-20; WS-4.3 AC-24; WS-4.4 AC-13)

**Terminal phase note:** Phase 4 produces no outputs consumed by subsequent phases. All open questions and deferred items represent future enhancement opportunities, not blocking concerns for a "next phase."

---

## 2. Key Findings

### 2.1 Claude API Architecture Completes the Dual-Provider Model (AD-7)

WS-4.1 delivers the second half of the AI architecture defined in AD-7. The `ClaudeProvider` class (`src/lib/ai/claude-provider.ts`) mirrors the `OllamaProvider` pattern established in WS-3.4 -- both implement health checks, chat methods, error classification, and result types against the same `AIProvider` interface from WS-1.7.

The critical architectural constraint is **server-side only execution**. The `@anthropic-ai/sdk` package and `ANTHROPIC_API_KEY` environment variable are accessed exclusively within the Next.js Route Handler at `app/api/ai/claude/route.ts`. Client-side code communicates via `fetch('/api/ai/claude', ...)` through the `LiveAIRouter`. This ensures:

- The API key never appears in client bundles (security)
- Claude calls are metered and rate-limited server-side (cost control)
- The client remains agnostic to which provider is serving a request (architectural purity)

The Route Handler exposes two HTTP methods:

- **POST** `/api/ai/claude` -- Chat completion proxy (accepts `AIRequest`, returns `AIResponse`)
- **GET** `/api/ai/claude` -- Health/status check (returns `{ available, model, error }`)

Cost tracking is per-session: `ai.store.sessionCost` accumulates USD estimates based on Claude's published token pricing ($3/1M input, $15/1M output for `claude-sonnet-4-20250514`). Rate limits are per-feature: `narrated-telemetry-deep` at 5 calls/min, `builder-mode` at 3 calls/min.

### 2.2 Exception Triage Adds Intelligent Failure Recovery

WS-4.2 introduces the first proactive failure-handling system in the Launch. When the telemetry aggregator (WS-1.5) detects a health state transition to DEGRADED or DOWN, the exception triage system classifies the failure and generates an intervention station with recovery guidance.

The classification follows the three-layer intelligence model:

1. **Rule engine** (`src/lib/ai/exception-rules.ts`): 10+ deterministic rules matching error codes (`ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`), HTTP status codes (401, 403, 404, 500, 502-504), and health state patterns. Handles common failures in <1ms with high confidence (>=0.70).

2. **Ollama LLM** (`src/lib/ai/exception-classifier.ts`): Consulted only when rule engine confidence is <0.70. Prompt capped at <1500 tokens, timeout at 8 seconds (tighter than Camera Director's 10s). Responses validated against a Zod schema.

3. **Fallback**: If Ollama is unavailable, the rule engine result is used regardless of confidence. The system never fails silently -- `missing-info` category with investigation suggestions is the worst-case output.

Four exception categories map to four recovery UI panels:

- **transient** -> `RetryPanel` (auto-retry with 30s interval, max 5 attempts, countdown timer)
- **permanent** -> `EscalationPanel` (error detail, AI assessment, investigation guidance)
- **policy** -> `ConfigurationPanel` (configuration issue identification, settings guidance)
- **missing-info** -> `InformationRequestPanel` (suggested investigation steps)

The triage system integrates with Phase 3's attention choreography (WS-3.7): active interventions trigger `tighten` mode, which reduces ambient visual effects and amplifies anomalous beacons.

### 2.3 Builder Mode Enables AI-Powered Station Creation (Stretch)

WS-4.3 is the most ambitious feature in Phase 4 and is explicitly marked as a stretch goal. It allows authorized users to describe a station in natural language (e.g., "create a monitoring dashboard for Agent Builder that shows generation success rate and active agents") and receive a fully-formed `StationTemplate` proposal from Claude.

The safety architecture is the key design constraint. Claude does not generate arbitrary React code. Instead, it selects from a constrained vocabulary:

- **7 body types**: `metrics`, `list`, `table`, `chart`, `log`, `status`, `empty`
- **5 button variants**: `default`, `secondary`, `outline`, `ghost`, `destructive`
- **~60 Lucide icons**: Curated subset validated by Zod
- **Dot-path trigger conditions**: Same format as WS-3.5's `TriggerConditionEvaluator`

Every Claude response is validated against a Zod schema (`src/lib/ai/builder-proposal-schema.ts`). Invalid JSON, unknown body types, unlisted icons, or excessive actions/triggers all cause validation failure with descriptive error messages. The user can reject the proposal and iterate with rephrased instructions.

Builder Mode has a 5-condition gate:

1. User is authenticated
2. AI beta toggle is enabled
3. Claude provider is available (health check passes)
4. Not currently generating (prevents double-submission)
5. Keyboard shortcut `Ctrl+Shift+B` (macOS: `Cmd+Shift+B`) or command palette entry `"builder"` / `"build station"`

Created templates are session-scoped only (no Supabase persistence). The receipt system provides the persistent audit trail for all builder interactions.

### 2.4 Visual Polish Pass Is Systematic, Not Subjective

WS-4.4 distinguishes itself from the other workstreams by producing no new features. It introduces a **programmatic audit framework** -- 9 categories of runtime DOM checks that verify the rendered application against the specifications in VISUAL-DESIGN-SPEC.md.

The 9 audit categories:

| Category          | What It Checks                                                               | Key Specs                                    |
| ----------------- | ---------------------------------------------------------------------------- | -------------------------------------------- |
| Glass Material    | 3-tier recipe (standard/active/strong) backdrop-filter, opacity, blur values | 4 glass specs per VISUAL-DESIGN-SPEC.md      |
| Glow System       | Luminous borders, beacon colors, box-shadow layers                           | 8 glow specs with RGB validation             |
| Typography        | Geist Sans/Mono assignments, font-variant-numeric                            | 11 typography specs per Section 3.2          |
| Color Consistency | ~89 design token values, banned legacy names                                 | TOKEN_EXPECTED_VALUES map, BANNED_NAMES list |
| Performance       | will-change, CSS containment, transition properties                          | Layout-property transition detection         |
| Reduced Motion    | Animation/transition disabling at `prefers-reduced-motion: reduce`           | ANIMATED_CLASSES, MOTION_COMPONENTS checks   |
| Ambient Effects   | Keyframe timing, stagger offsets, breathing parameters                       | CSS modifications (no JS changes)            |
| Transitions       | Hover timing, morph stagger, entry/exit durations                            | visual-polish-overrides.css corrections      |
| Frame Budget      | Continuous FPS monitoring across interaction scenarios                       | 60fps target, performance tier detection     |

Audits run only in development mode (`process.env.NODE_ENV === 'development'`) and are completely tree-shaken from production builds. A dev-only overlay component (`VisualPolishOverlay`) renders audit results in the bottom-left corner of the viewport.

CSS corrections are isolated in a separate file (`visual-polish-overrides.css`) rather than modifying component source files, keeping the polish pass fully reversible.

### 2.5 Consistent Technology Choices Across All SOWs

**`motion/react` import path:** All 4 SOWs use `import { motion, AnimatePresence } from 'motion/react'`. Zero instances of `framer-motion` package name. Verified in:

- WS-4.2: `InterventionStation.tsx`, `RetryPanel.tsx` (line 2301 of SOW)
- WS-4.3: `BuilderModePanel.tsx`, `BuilderIterationHistory.tsx` (line 2470 of SOW)
- WS-4.4: Reduced motion audit checks for `motion/react` components (SOW Section 4.11)
- WS-4.2 D-9 and WS-4.3 D-9 both explicitly state: "`motion/react` (not `framer-motion`) per project constraint"

**`pnpm` as package manager:** WS-4.1 AC-22 references `pnpm build`. WS-4.1 AC-23 references `pnpm add @anthropic-ai/sdk`. WS-4.1 AC-25 states "pnpm for package management." WS-4.2 AC-20 references `pnpm tsc --noEmit`. WS-4.3 AC-24 references `pnpm typecheck`. WS-4.4 AC-13 references `pnpm run lint`. No SOW references `npm`.

**Owner columns in Open Questions:** All 4 SOWs include Owner columns in their OQ tables:

- WS-4.1: Owner column populated (Stakeholder, Architecture, Backend, Security)
- WS-4.2: Owner column populated (Stakeholder, Architecture, UX Designer)
- WS-4.3: Owner column populated (Stakeholder, Architect, UX Designer)
- WS-4.4: Owner column populated (`world-class-ui-designer`, Stakeholder, `react-developer`)

**Type file locations:** No SOW creates files in `src/types/`. WS-4.2 places types in `src/lib/interfaces/exception-triage.ts` (shared domain types location, consistent with the Phase 3 codified pattern). WS-4.3 places types in `src/lib/ai/builder-types.ts` (feature-local, consumed only by builder mode). Both patterns are consistent with the Phase 3 resolution (see Conflict 2 below for nuance).

**Zustand with `immer` middleware:** WS-4.2 (`triage.store.ts`) and WS-4.3 (`builder.store.ts`) both use `immer` for immutable state updates. Both stores are session-scoped (no persistence).

**Port assignments:** No new port assignments in Phase 4. WS-4.1 adds the Route Handler `/api/ai/claude` under the established `/api/ai/` namespace (consistent with Phase 3 Conflict 5 resolution that all AI routes belong under `/api/ai/`).

---

## 3. Cross-Workstream Conflicts

### Conflict 1: Recovery Template `bodyType: 'custom'` vs Builder Schema Allowed Types (MEDIUM)

**WS-4.2** defines 4 recovery templates (`src/lib/ai/recovery-templates.ts`) that use `bodyType: 'custom'`:

```ts
// WS-4.2 recovery template excerpt
layout: {
  bodyType: 'custom',  // Custom recovery panel content
  // ...
}
```

**WS-4.3** defines a Zod schema (`src/lib/ai/builder-proposal-schema.ts`) that constrains `bodyType` to exactly 7 values:

```ts
const ALLOWED_BODY_TYPES = ['metrics', 'list', 'table', 'chart', 'log', 'status', 'empty'] as const
```

WS-4.3 AC-20 explicitly states: "submit `bodyType: 'custom'`, assert validation failure."

**Impact:** These are technically separate vocabularies for different purposes: recovery templates are hand-authored by engineers (WS-4.2), while builder proposals are AI-generated and must be constrained (WS-4.3). However, both produce `StationTemplate` objects that flow through the same `DynamicStationTemplateRegistry` (WS-3.5). If the registry validates body types, `custom` would fail. If it does not, the inconsistency is cosmetic.

**Resolution:** This is not a true conflict but a vocabulary scoping issue. The `ALLOWED_BODY_TYPES` list in WS-4.3 is a constraint on **Claude's output**, not on the template system itself. The `StationTemplateRegistry` from WS-3.5 does not validate body types -- it stores and retrieves templates. Recovery templates with `bodyType: 'custom'` bypass the Zod schema entirely because they are never generated by Claude. No code change is needed, but the distinction should be documented:

- **Engineer-authored templates** (WS-3.5 static, WS-4.2 recovery): May use any `bodyType` including `custom`
- **AI-generated templates** (WS-4.3 builder): Constrained to the 7 allowed types by Zod validation

### Conflict 2: WS-4.3 Type File Location Diverges from Domain Pattern (LOW)

**WS-4.2** places types in `src/lib/interfaces/exception-triage.ts`, following the shared domain types pattern established in Phase 3 (types consumed by 3+ modules go in `src/lib/interfaces/`).

**WS-4.3** places types in `src/lib/ai/builder-types.ts`, using the feature-local pattern (types consumed by 1-2 modules co-locate with the feature).

**Impact:** The `BuilderSession`, `BuilderPhase`, and `BuilderIteration` types from WS-4.3 are consumed by `builder.store.ts`, `use-builder-mode.ts`, `BuilderModePanel.tsx`, `BuilderIterationHistory.tsx`, and `station-proposal-generator.ts` -- 5 consumers. This exceeds the "1-2 modules" threshold for feature-local types established in Phase 3's resolution.

**Resolution:** This is a low-severity stylistic inconsistency. The types are all within the `src/lib/ai/` and `src/components/ai/` subtrees, making `src/lib/ai/builder-types.ts` a reasonable location. Moving them to `src/lib/interfaces/builder-mode.ts` would be more consistent with the Phase 3 pattern but is not blocking. Accept as-is with a recommendation to reconsider during execution if the type surface area grows.

### Conflict 3: WS-4.3 Model Selection vs WS-4.1 Default Model (LOW)

**WS-4.1** D-2 establishes `claude-sonnet-4-20250514` as the default model for all Claude features. The `ClaudeProvider` accepts a `model` config parameter but defaults to Sonnet.

**WS-4.3** OQ-2 asks: "What is the Claude model ID for Builder Mode? `claude-sonnet-4-20250514` (faster, cheaper) or `claude-opus-4-20250514` (stronger reasoning)? WS-4.1 may define the default, but Builder Mode could override."

**Impact:** WS-4.1 has already resolved this: Sonnet is the default. WS-4.3's OQ-2 can be closed by accepting the WS-4.1 default. Builder Mode's Zod-constrained vocabulary reduces the reasoning burden, making Sonnet sufficient.

**Resolution:** Close WS-4.3 OQ-2 with: "Use `claude-sonnet-4-20250514` per WS-4.1 D-2. The constrained template vocabulary (7 body types, ~60 icons, Zod validation) reduces the reasoning complexity to a level Sonnet handles well. Opus is available as a config override if quality issues emerge during execution."

### Conflict 4: Resource Contention on `world-class-autonomous-interface-architect` (MEDIUM -- PMO)

**WS-4.2** and **WS-4.3** are both assigned to `world-class-autonomous-interface-architect`. WS-4.3 has a hard dependency on WS-4.1 (Claude provider must exist). WS-4.2 has a soft dependency on WS-4.1 (Claude fallback for triage is explicitly out of scope per WS-4.2 decision OS-3, but the Ollama integration benefits from WS-4.1's shared client patterns).

**Impact:** The autonomous-interface-architect cannot work on WS-4.2 and WS-4.3 simultaneously. Given that WS-4.3 is marked "stretch," the sequencing is clear: WS-4.2 first, WS-4.3 only if timeline permits after WS-4.2 completion.

**Resolution:** Execute WS-4.2 first (no hard Claude dependency). Begin WS-4.3 only after both WS-4.1 (Claude provider) and WS-4.2 (exception triage) are complete. If WS-4.3 is cut for time, the system is fully functional without it -- Builder Mode is a stretch enhancement, not a required capability.

---

## 4. Architecture Decisions

### Consolidated from WS-4.1

| ID      | Decision                                                                       | Rationale                                                                                                                                                                                                                                                                                                                          | Source                  |
| ------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| D-4.1.1 | Claude proxy runs server-side only via Next.js Route Handler                   | API key never in client bundle. Server-side rate limiting and cost tracking. Consistent with ecosystem pattern (Agent Builder uses Route Handlers for API proxying).                                                                                                                                                               | AD-7, tech-decisions.md |
| D-4.1.2 | Default model is `claude-sonnet-4-20250514` (not Opus or Haiku)                | Best balance of reasoning quality, latency (3-8s), and cost ($3/$15 per 1M tokens). Opus is overkill for constrained outputs; Haiku lacks reasoning depth for disambiguation.                                                                                                                                                      | WS-4.1 D-2              |
| D-4.1.3 | Non-streaming response assembly                                                | Claude provider supports streaming internally for timeout management, but assembles the full response server-side before returning. Progressive UI rendering is deferred.                                                                                                                                                          | WS-4.1 D-6              |
| D-4.1.4 | Three degradation modes: fallback-available, feature-disabled, not-affected    | Each feature in the routing table maps to exactly one mode. `fallback-available` (narrated-telemetry-deep, natural-language-camera): Ollama handles the request. `feature-disabled` (builder-mode): shows "Configure API key." `not-affected` (exception-triage, batch narration, camera pattern matching): no Claude involvement. | WS-4.1 D-8              |
| D-4.1.5 | Health check every 120 seconds when API key is configured                      | Lightweight `/v1/messages` ping with minimal tokens. 120s interval balances freshness with API cost. Health status reflected in `ai.store.providerStatuses.claude`.                                                                                                                                                                | WS-4.1 D-9              |
| D-4.1.6 | Per-feature rate limits: `narrated-telemetry-deep` 5/min, `builder-mode` 3/min | Prevents accidental cost spikes. Builder Mode's lower limit reflects higher per-call cost (longer prompts with template catalog context).                                                                                                                                                                                          | WS-4.1 D-11             |

### Consolidated from WS-4.2

| ID      | Decision                                                                  | Rationale                                                                                                                                                                              | Source            |
| ------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| D-4.2.1 | Rule engine runs first as fast pre-filter before Ollama                   | Common failures (ECONNREFUSED, timeout, 5xx, 401/403) are well-understood patterns. Rule engine handles them in <1ms, reserving Ollama for genuinely ambiguous cases.                  | AD-7, WS-4.2 D-1  |
| D-4.2.2 | Confidence threshold 0.70 triggers Ollama escalation                      | Below 0.70, the rule match is uncertain enough to benefit from semantic analysis. Threshold is a constant, not user-configurable. Consistent with WS-3.4 disambiguation threshold.     | WS-4.2 D-2        |
| D-4.2.3 | Four exception categories: transient, permanent, policy, missing-info     | Covers the full decision space for failure recovery. Each maps to a single recovery UI pattern.                                                                                        | WS-4.2 D-3        |
| D-4.2.4 | Recovery templates marked `disposable: true`                              | Intervention stations are ephemeral -- they auto-dismiss when the exception resolves. Signals finite lifecycle to template selection and rendering.                                    | WS-4.2 D-4        |
| D-4.2.5 | Auto-retry: 30-second interval, maximum 5 retries                         | 30s avoids hammering a struggling service. 5 retries over 2.5 minutes is enough to detect recovery; exceeding escalates transient to permanent.                                        | WS-4.2 D-5, D-6   |
| D-4.2.6 | Exception deduplication by composite key (district + health + error code) | Prevents re-classifying the same ongoing exception on every telemetry poll. New error code on an already-degraded app gets classified separately.                                      | WS-4.2 D-7        |
| D-4.2.7 | Triage store is session-scoped (Zustand, no Supabase persistence)         | Interventions are ephemeral -- they exist only while the exception is active. Receipts provide the persistent audit trail.                                                             | WS-4.2 D-8        |
| D-4.2.8 | Ollama triage prompt <1500 tokens, timeout 8 seconds                      | Triage is simpler than camera direction. Tighter timeout (8s vs 10s) reflects the rule engine pre-filter: Ollama is only called for edge cases where speed matters less than accuracy. | WS-4.2 D-10, D-11 |

### Consolidated from WS-4.3

| ID      | Decision                                                         | Rationale                                                                                                                                                                                         | Source                        |
| ------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| D-4.3.1 | Builder Mode is Claude-only with no fallback                     | Novel station layout generation from unconstrained natural language requires strong reasoning. Ollama cannot reliably produce valid StationTemplate JSON from arbitrary descriptions.             | WS-4.3 D-1, tech-decisions.md |
| D-4.3.2 | Claude selects from template vocabulary, not arbitrary React     | Safety contract from WS-3.5 and combined-recommendations.md Deferred Item #6. Zod schema constrains bodyType, icons, action variants, and trigger operators. No executable code accepted from AI. | AD-7, WS-4.3 D-2              |
| D-4.3.3 | Hidden activation via `Ctrl+Shift+B` keyboard shortcut           | Builder Mode targets authorized users, not general audience. Hidden shortcut keeps it discoverable without cluttering UI. Command palette also has hidden entry.                                  | WS-4.3 D-3                    |
| D-4.3.4 | Created templates are session-scoped (not persisted to Supabase) | Phase 4 scope constraint. Templates marked `disposable: true`. Supabase persistence is a future concern requiring WS-3.1 schema changes.                                                          | WS-4.3 D-4                    |
| D-4.3.5 | Separate Zustand store (`builder.store.ts`)                      | Builder Mode has distinct lifecycle state (session, iterations, proposals) that would bloat `ai.store`. Follows ecosystem pattern of purpose-scoped stores.                                       | WS-4.3 D-5                    |
| D-4.3.6 | Claude prompt includes full template catalog context             | Claude needs vocabulary awareness to produce valid configurations. Including existing templates for target district avoids duplication. Prompt stays under 4000 tokens.                           | WS-4.3 D-6                    |
| D-4.3.7 | Iteration history included in Claude prompt for refinement       | When user iterates after rejection, Claude should know what was previously proposed and why. Enables progressive refinement.                                                                      | WS-4.3 D-7                    |
| D-4.3.8 | Generator timeout 30 seconds (vs 10s for Camera Director Ollama) | Claude API calls over the network have higher baseline latency than local Ollama. 30s accommodates typical response times (3-8s) with headroom.                                                   | WS-4.3 D-10                   |

### Consolidated from WS-4.4

| ID      | Decision                                                       | Rationale                                                                                                                                                                                                                 | Source       |
| ------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| D-4.4.1 | Ambient timing adjustments via CSS, not runtime JavaScript     | CSS @keyframes run on compositor thread (GPU) with zero main-thread cost. JS timing would risk frame drops.                                                                                                               | WS-4.4 DM-1  |
| D-4.4.2 | Audits are runtime DOM checks, not static analysis             | Static analysis (AST parsing) cannot verify computed styles. Visual spec defines pixel-level properties verifiable only against rendered DOM.                                                                             | WS-4.4 DM-2  |
| D-4.4.3 | Polish overrides in separate CSS file, not inline source edits | Keeps polish pass reversible. Overrides can be isolated if regression occurs. File loads last in cascade with targeted selectors.                                                                                         | WS-4.4 DM-3  |
| D-4.4.4 | Film grain z-index corrected from 9999 to 40                   | z-9999 blocked command palette (z-50) and modals. z-40 keeps grain above spatial content but below overlays.                                                                                                              | WS-4.4 DM-7  |
| D-4.4.5 | Reduced motion catch-all uses `0.001ms` duration, not `0s`     | `animation-duration: 0s` causes some browsers to skip `animationend` events. `0.001ms` is functionally instant but preserves event firing.                                                                                | WS-4.4 DM-8  |
| D-4.4.6 | Narration panel assigned standard glass, not active glass      | Narration panel is supplementary information, not the focused element at Z3. Active glass (0.06 opacity, 16px blur) would visually compete with the station panel. Standard glass (0.03, 12px) creates correct hierarchy. | WS-4.4 DM-10 |

---

## 5. Cross-Workstream Dependencies

```
Phase 3 Outputs                     External Dependencies
  |                                   |
  | WS-3.4 LiveAIRouter              | @anthropic-ai/sdk (npm)
  |   (Claude placeholder)           | ANTHROPIC_API_KEY (.env.local)
  | WS-3.4 ai.store.ts               | Ollama at localhost:11434
  |   (providerStatuses.claude)       |
  | WS-3.6 ollama-client.ts          |
  |   (shared client pattern)         |
  | WS-3.5 DynamicStationTemplateRegistry
  |   (template vocabulary)           |
  | WS-3.7 Attention Choreography    |
  |   (tighten/calm modes)            |
  | WS-1.5 Telemetry Aggregator      |
  |   (health state transitions)      |
  | WS-1.7 ReceiptStore              |
  |   (audit trail for AI actions)    |
  v                                   v

WS-4.1 (Claude API Integration)     WS-4.4 (Visual Polish Pass)
  [backend-engineer]                   [ui-designer]
  [depends: WS-1.7, WS-3.4,           [depends: WS-0.2, WS-1.6,
   WS-3.6]                             WS-2.1, WS-2.6, WS-3.6, WS-3.7]
  |                                    |
  | ClaudeProvider class               | (PARALLEL -- no Phase 4 deps)
  | /api/ai/claude Route Handler       |
  | LiveAIRouter amendments            |
  | ai.store extensions                |
  |                                    |
  |--- soft ----> WS-4.2 (Exception Triage)
  |                 [autonomous-interface-architect]
  |                 [depends: WS-1.5, WS-1.7, WS-2.6,
  |                  WS-3.4, WS-3.5, WS-3.7, WS-4.1 (soft)]
  |                 |
  |                 | Exception classifier
  |                 | Intervention stations
  |                 | Triage store
  |                 |
  |--- HARD -----> WS-4.3 (Builder Mode) [STRETCH]
                    [autonomous-interface-architect]
                    [depends: WS-4.1 (REQUIRED),
                     WS-3.3, WS-3.5, WS-1.7]
                    |
                    | StationProposalGenerator
                    | Builder gate
                    | Builder panel UI

Phase 4 Complete (Terminal)
```

**Key dependency facts:**

- **WS-4.1 and WS-4.4 have NO cross-dependency** and can start in parallel on Day 1. WS-4.1 depends on Phase 3 outputs (LiveAIRouter, ai.store). WS-4.4 depends on Phase 1/2/3 outputs (ambient effects, morph choreography, station panels, attention choreography).
- **WS-4.2 has a SOFT dependency on WS-4.1.** Exception triage uses Ollama primary with rule-engine fallback. Claude is explicitly out of scope (WS-4.2 Out of Scope). The "soft" dependency means WS-4.2 benefits from WS-4.1's shared AI infrastructure patterns but can function without Claude.
- **WS-4.3 has a HARD dependency on WS-4.1.** Builder Mode is Claude-only (WS-4.3 D-1). Without the `ClaudeProvider` and `/api/ai/claude` Route Handler from WS-4.1, Builder Mode cannot generate proposals. WS-4.3 cannot begin until WS-4.1 is complete.
- **WS-4.2 and WS-4.3 share the same agent** (`world-class-autonomous-interface-architect`), creating a serial constraint: WS-4.2 must complete before WS-4.3 begins (see Conflict 4).
- **WS-4.4 can run in parallel with all other Phase 4 workstreams.** It has no Phase 4 dependencies -- all its inputs come from Phase 0-3 deliverables. It produces no outputs consumed by WS-4.1/4.2/4.3.

**External dependencies (outside Phase 4):**

- Phase 1-3 deliverables: AIRouter interface (WS-1.7), telemetry aggregator (WS-1.5), ambient effects (WS-1.6), design tokens (WS-0.2), morph choreography (WS-2.1), station panel framework (WS-2.6), LiveAIRouter (WS-3.4), DynamicStationTemplateRegistry (WS-3.5), narrated telemetry (WS-3.6), attention choreography (WS-3.7), command palette (WS-3.3)
- `@anthropic-ai/sdk` npm package (MIT license) for Claude API client
- `ANTHROPIC_API_KEY` environment variable in `.env.local`
- Ollama running at `localhost:11434` with model `llama3.2` (for WS-4.2 exception triage)
- `zod` library (already installed via WS-3.4)
- `lucide-react` (already installed)
- `@tarva/ui` components (already installed)

---

## 6. Consolidated Open Questions

### Blocking (must resolve before execution)

| ID       | Question                                                                                                                                                                                                                                                                                                                                       | SOW    | Impact                                                        | Recommended Owner |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------- | ----------------- |
| OQ-4.0.1 | **WS-4.3 inclusion decision**: Is WS-4.3 (Builder Mode) in scope for Phase 4, or is it formally deferred? The SOW header says "Stretch." If deferred, the M (2-3 week) estimate is easily achievable with 3 workstreams. If included, the autonomous-interface-architect is serial on WS-4.2 then WS-4.3, potentially stretching to 3-4 weeks. | WS-4.3 | High -- affects timeline, agent loading, and scope commitment | Stakeholder / PMO |

### Should Resolve Before Execution

| ID       | Question                                                                                                                                                           | SOW         | Impact                                                                                                                                   | Recommended Owner |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| OQ-4.1.1 | Should `ANTHROPIC_API_KEY` be validated on server startup (fail-fast) or lazily on first Claude request (fail-soft)?                                               | WS-4.1 OQ-1 | Medium -- fail-fast surfaces misconfiguration earlier but prevents startup without key. Fail-soft is more graceful for dev environments. | Backend engineer  |
| OQ-4.1.2 | Should Claude cost tracking include a configurable budget alert threshold (e.g., warn at $5/session) or just display the running total?                            | WS-4.1 OQ-2 | Low -- running total is sufficient for Phase 4. Budget alerts are a future enhancement.                                                  | Stakeholder       |
| OQ-4.1.3 | Should the Claude health check use a real `/v1/messages` call (costs tokens) or a lightweight method? The Anthropic SDK may not have a free health check endpoint. | WS-4.1 OQ-3 | Medium -- real call costs ~$0.001 per check (120s interval = ~720 checks/day = $0.72/day). A model listing endpoint may be cheaper.      | Backend engineer  |
| OQ-4.2.1 | Should triage interventions be created for OFFLINE apps, or only DEGRADED/DOWN? OFFLINE is intentional absence (app not started).                                  | WS-4.2 OQ-3 | Medium -- OFFLINE interventions would be noisy for apps not meant to run.                                                                | Architecture      |
| OQ-4.2.2 | When multiple exceptions are active simultaneously, should they be grouped into a single "system triage" station or remain per-district?                           | WS-4.2 OQ-4 | Medium -- grouping reduces noise but loses per-app context. Default: per-district with `maxInterventionsPerDistrict: 3` cap.             | Architecture      |

### Can Resolve During Execution

| ID       | Question                                                                                                                                           | SOW         | Impact                                                                            | Default if Unresolved                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| OQ-4.1.4 | Should the Claude Route Handler support streaming responses to the client, or always assemble the full response server-side?                       | WS-4.1 OQ-4 | Low -- non-streaming is simpler and sufficient for Phase 4.                       | Assemble server-side (WS-4.1 D-6)                                                              |
| OQ-4.1.5 | Should the LiveAIRouter expose a `getProviderHealth()` method for UI consumption, or should the UI read directly from `ai.store.providerStatuses`? | WS-4.1 OQ-5 | Low -- UI already reads from ai.store.                                            | Read from ai.store directly                                                                    |
| OQ-4.2.3 | Should transient intervention stations pulse with status-warning glow or use subtler treatment?                                                    | WS-4.2 OQ-1 | Low -- visual density concern.                                                    | Status-warning glow at 50% opacity, aligned with tighten mode                                  |
| OQ-4.2.4 | Should resolved interventions show a success animation before dismissing?                                                                          | WS-4.2 OQ-2 | Low -- UX polish.                                                                 | Brief animation (200ms green flash) for user-initiated retries; auto-resolved fade out quietly |
| OQ-4.2.5 | Should the retry panel countdown timer tick in the UI or show static "retrying in ~30s"?                                                           | WS-4.2 OQ-5 | Low -- ticking timer is more satisfying.                                          | Ticking timer (1s interval re-render is negligible)                                            |
| OQ-4.3.1 | Should created templates survive page refresh via localStorage, or is true session-only the right behavior?                                        | WS-4.3 OQ-1 | Medium -- localStorage prevents loss of builder work but adds cleanup complexity. | Session-only per D-4.3.4                                                                       |
| OQ-4.3.2 | What is the Claude model ID for Builder Mode?                                                                                                      | WS-4.3 OQ-2 | Medium -- see Conflict 3.                                                         | `claude-sonnet-4-20250514` per WS-4.1 D-2                                                      |
| OQ-4.3.3 | Should the builder panel be a slide-in panel or full-screen modal?                                                                                 | WS-4.3 OQ-3 | Low -- slide-in feels more integrated with spatial canvas.                        | Slide-in panel (current design)                                                                |
| OQ-4.3.4 | Should Builder Mode have a rate limit beyond the gate conditions?                                                                                  | WS-4.3 OQ-4 | Medium -- prevents cost spikes.                                                   | Yes, 3 calls/min per WS-4.1 D-11                                                               |
| OQ-4.3.5 | Should the user select a district before or after seeing the proposal?                                                                             | WS-4.3 OQ-5 | Low -- pre-selection gives Claude district context.                               | Pre-selection (current design)                                                                 |
| OQ-4.3.6 | Should the command palette "builder" command be visible-but-locked or hidden when gate conditions are not met?                                     | WS-4.3 OQ-6 | Low -- visible-but-locked is more discoverable.                                   | Hidden until all conditions met (current design)                                               |
| OQ-4.4.1 | Should the visual polish audit run automatically on dev server start or only on-demand?                                                            | WS-4.4 OQ-1 | Low -- auto-run adds ~200ms.                                                      | On-demand with initial delayed run (2s after mount)                                            |
| OQ-4.4.2 | Should the frame budget monitor be visible by default in dev?                                                                                      | WS-4.4 OQ-2 | Low -- always-visible adds small performance cost.                                | Hidden behind keyboard shortcut or dev overlay toggle                                          |
| OQ-4.4.3 | Are breathing glow peak adjustments (48px->52px, 0.14->0.16) acceptable?                                                                           | WS-4.4 OQ-3 | Low -- subtle visual adjustment.                                                  | Accept adjustments (8% increase restores visual anchor role)                                   |
| OQ-4.4.4 | Should capsule hover timing change (200ms->180ms) be propagated back to VISUAL-DESIGN-SPEC.md?                                                     | WS-4.4 OQ-4 | Low -- spec consistency.                                                          | Yes, update spec to match implementation                                                       |
| OQ-4.4.5 | Should the audit system verify `motion/react` spring physics configs against spec values?                                                          | WS-4.4 OQ-5 | Low -- spring configs are harder to verify from DOM.                              | Timing-based verification is sufficient for Phase 4                                            |

---

## 7. Phase Exit Criteria

| #       | Criterion                                                                                                                                                                                                                                                                                             | Met?    | Evidence                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| EC-4.1  | **Claude provider functional**: `ClaudeProvider.chat()` sends requests via `@anthropic-ai/sdk`, receives responses, and returns typed `AIResponse` objects. Health check reports availability. Error classification handles auth, rate-limit, timeout, and overloaded errors distinctly.              | Pending | WS-4.1 AC-1 through AC-6                               |
| EC-4.2  | **Claude Route Handler operational**: `POST /api/ai/claude` proxies chat requests server-side, returning assembled responses. `GET /api/ai/claude` returns health status. API key never exposed in client response.                                                                                   | Pending | WS-4.1 AC-7 through AC-10                              |
| EC-4.3  | **LiveAIRouter routes to Claude**: Claude-primary features (`builder-mode`, `narrated-telemetry-deep`) route to Claude when available. Claude-fallback features (`natural-language-camera`, `narrated-telemetry-batch`) fall back to Claude when Ollama fails. Rate limits enforced per-feature.      | Pending | WS-4.1 AC-11 through AC-16                             |
| EC-4.4  | **Graceful degradation complete**: Without `ANTHROPIC_API_KEY`, Claude-primary features show "Configure API key" message. Claude-fallback features use Ollama normally. No errors thrown, no broken UI. With invalid key, same behavior with specific error message.                                  | Pending | WS-4.1 AC-17 through AC-19                             |
| EC-4.5  | **Cost tracking functional**: Session cost accumulates USD estimates for Claude calls. Token usage tracked per-request. Cost displayed in settings panel area. `recordAICost('claude', feature)` called after each successful Claude call.                                                            | Pending | WS-4.1 AC-20, AC-21                                    |
| EC-4.6  | **Exception triage classifies failures**: Rule engine classifies `ECONNREFUSED` as `transient` (>=0.80 confidence, <1ms), HTTP 401 as `policy` (>=0.85), HTTP 500 as `permanent` (>=0.70). Unrecognized patterns fall through to Ollama when available, rule engine result when not.                  | Pending | WS-4.2 AC-1 through AC-7                               |
| EC-4.7  | **Intervention stations render**: Each of the 4 exception categories renders the correct recovery panel (RetryPanel, EscalationPanel, ConfigurationPanel, InformationRequestPanel). Stations enter/exit with `motion/react` animations. Glass material matches VISUAL-DESIGN-SPEC.md standard recipe. | Pending | WS-4.2 AC-15 through AC-19                             |
| EC-4.8  | **Auto-retry and auto-resolve work**: RetryPanel shows countdown timer (ticking). Auto-retry fires at 30s intervals, maximum 5 attempts. When health returns to OPERATIONAL, intervention auto-resolves. Tighten mode activates with active interventions, calm when all resolved.                    | Pending | WS-4.2 AC-12 through AC-14, AC-16                      |
| EC-4.9  | **Triage receipts generated**: Every classification generates a receipt with `AIReceiptMetadata` fields (prompt, reasoning, confidence, alternativesConsidered, provider, latencyMs, modelId).                                                                                                        | Pending | WS-4.2 AC-9                                            |
| EC-4.10 | **Visual polish audit passes**: All 9 audit categories (glass material, glow system, typography, color consistency, performance, reduced motion, ambient effects, transitions, frame budget) report zero errors in development mode.                                                                  | Pending | WS-4.4 AC-1 through AC-5, AC-7                         |
| EC-4.11 | **Frame budget sustained**: 60fps maintained during 30-second interaction scenario (idle, hover, select+morph, browse, deselect+return). `useFrameBudgetMonitor` reports `performanceLevel === 'full'` throughout. Morph transition sustains 60fps per Chrome DevTools Performance trace.             | Pending | WS-4.4 AC-6, AC-9                                      |
| EC-4.12 | **Reduced motion compliance**: With `prefers-reduced-motion: reduce` enabled, zero animated elements visible. ParticleField shows static dots. Morph transitions are instant. Film grain static.                                                                                                      | Pending | WS-4.4 AC-7                                            |
| EC-4.13 | **Zero TypeScript errors**: `pnpm typecheck` passes with zero errors across all Phase 4 files. No `any` types in public API. No `framer-motion` imports.                                                                                                                                              | Pending | WS-4.1 AC-25, WS-4.2 AC-20, WS-4.3 AC-24, WS-4.4 AC-13 |
| EC-4.14 | **All blocking open questions resolved** (OQ-4.0.1 at minimum)                                                                                                                                                                                                                                        | Pending | Pre-execution resolution confirmed                     |
| EC-4.15 | **All cross-workstream conflicts documented** (Conflicts 1-4 addressed)                                                                                                                                                                                                                               | Pending | Pre-execution or early-execution resolution confirmed  |

**Stretch exit criteria (only if WS-4.3 is included):**

| #       | Criterion                                                                                                                                                                                                                                              | Met?    | Evidence                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------- |
| EC-4.S1 | **Builder Mode activates**: `Ctrl+Shift+B` opens builder panel when all gate conditions met (authenticated, AI beta on, Claude available). Silently ignored when conditions not met.                                                                   | Pending | WS-4.3 AC-1 through AC-3                       |
| EC-4.S2 | **Claude generates valid proposals**: `StationProposalGenerator.generate()` routes to Claude, response validates against Zod schema (7 body types, ~60 icons, max 4 actions, max 5 triggers). Invalid responses caught with descriptive errors.        | Pending | WS-4.3 AC-4 through AC-6, AC-20 through AC-22  |
| EC-4.S3 | **Proposal lifecycle complete**: User can describe, generate, preview, accept (registers with DynamicStationTemplateRegistry), reject, or iterate (re-describe with previous context). All 6 builder actions generate receipts with AIReceiptMetadata. | Pending | WS-4.3 AC-7 through AC-10, AC-14 through AC-17 |
| EC-4.S4 | **Builder panel renders**: Glass-strong material, spring animation slide-in/out, disabled textarea during generation, disabled action buttons in preview, collapsible iteration history.                                                               | Pending | WS-4.3 AC-11 through AC-15                     |

**Phase 4 is COMPLETE when:** EC-4.1 through EC-4.13 are all met, AND EC-4.14 and EC-4.15 confirm structural consistency. If WS-4.3 is included, EC-4.S1 through EC-4.S4 must also pass. The most likely iteration points are EC-4.6 (exception rule tuning may require additional patterns) and EC-4.11 (frame budget may require targeted optimization of specific components discovered during the audit).

---

## 8. Inputs Required by Next Phase

**None.** Phase 4 is the terminal phase of the Tarva Launch initial plan. There is no Phase 5 defined in combined-recommendations.md or agent-roster.md.

All open questions and deferred items from Phase 4 represent future enhancement opportunities:

- Supabase persistence for builder-created templates (WS-4.3 D-4)
- Claude streaming UI rendering (WS-4.1 D-6)
- Claude model selection UI (WS-4.1 Out of Scope #7)
- Per-feature token budget enforcement (WS-4.1 Out of Scope #8)
- API key management UI (WS-4.1 Out of Scope #5)
- Builder Mode localStorage persistence (WS-4.3 OQ-1)
- Global "system health" summary station for multi-exception scenarios (WS-4.2 OQ-4 default)
- Audit extension to verify `motion/react` spring physics configs (WS-4.4 OQ-5)

---

## 9. Gaps and Recommendations

### Gap 1: No Testing Framework Still Unresolved (HIGH IMPACT -- RECURRING)

**Impact:** Phase 1 Gap 2 identified the lack of Vitest setup. Phase 2 inherited the debt. Phase 3 inherited it again. Phase 4 now adds:

- `ClaudeProvider` with health check, chat, and error classification methods (pure function candidates)
- `classifyWithRules()` in `exception-rules.ts` (10+ deterministic rules, ideal unit test candidates)
- `classifyException()` orchestrator with rule-engine -> Ollama -> fallback logic (state machine, testable)
- `validateProposalResponse()` in `builder-proposal-schema.ts` (Zod validation, trivially testable)
- `checkBuilderGate()` in `builder-gate.ts` (4-condition gate, pure function)
- `StationProposalGenerator` with prompt assembly and response parsing
- All 9 visual audit functions (runtime DOM checks, testable against mock DOM)

Phase 4 adds approximately 15-20 additional pure functions and classes that are prime candidates for unit testing. The cumulative debt across 4 phases is now significant.

**Recommendation:** If Vitest is still not configured by Phase 4 execution, treat it as a pre-execution task. The WS-4.2 `classifyWithRules()` function and WS-4.3 `validateProposalResponse()` are the strongest Phase 4 candidates for first tests -- both are pure functions with well-defined input/output contracts and zero external dependencies.

### Gap 2: Claude Error Classification May Need Runtime Refinement (MEDIUM IMPACT)

**Impact:** WS-4.1 defines 5 error categories for Claude API responses (auth, rate-limit, timeout, overloaded, unknown). But the actual error response formats from the Anthropic API may change between SDK versions. The `classifyClaudeError()` function in `claude-provider.ts` matches against known error patterns, but unknown errors fall through to a generic handler.

**Recommendation:** Log all Claude errors with full response bodies to the browser console during development. After 1 week of real usage, review the logs and add any recurring unknown error patterns to the classifier. Include a version check against `@anthropic-ai/sdk` in the Route Handler startup.

### Gap 3: Exception Rule Engine Coverage Unknown (MEDIUM IMPACT)

**Impact:** WS-4.2 specifies 10+ deterministic rules for exception classification, but the actual error patterns emitted by the 6 Tarva apps are not fully documented. The rule engine handles common HTTP and TCP errors, but app-specific error codes (e.g., Agent Builder generation failures, TarvaCORE Electron-specific errors) may not match any rule.

**Recommendation:** The rule engine is designed to fall through gracefully -- unmatched patterns route to Ollama or return `missing-info`. During the first week of execution with live telemetry, track the percentage of exceptions that fall through to Ollama vs. rule-engine-classified. If >30% fall through, additional app-specific rules should be added. The `exception-rules.ts` file is designed for easy extension (add a new object to the `EXCEPTION_RULES` array).

### Gap 4: Visual Polish Audit Baseline Not Established (LOW IMPACT)

**Impact:** WS-4.4 defines audit checks against VISUAL-DESIGN-SPEC.md values, but the current state of the codebase (after Phases 0-3) may already have deviations from spec that were never flagged. The first audit run may produce a large number of findings, making it unclear which are Phase 4 regressions vs. pre-existing issues.

**Recommendation:** Run the audit framework against the Phase 3 codebase _before_ making any Phase 4 changes. Record the baseline finding count per category. Phase 4 success is measured against reducing this baseline to zero, not against a clean start.

### Gap 5: WS-4.3 Builder Mode Integration Points Not Fully Specified (LOW IMPACT -- stretch only)

**Impact:** WS-4.3 specifies that Builder Mode registers hidden commands in the command palette (WS-3.3 integration) and registers accepted templates with `DynamicStationTemplateRegistry` (WS-3.5 integration). However, neither WS-3.3 nor WS-3.5 anticipated these integration points at design time. The command palette's command registry is a static array; adding a hidden conditional entry requires a modification not specified in WS-3.3.

**Recommendation:** This is low-risk because: (1) WS-4.3 is a stretch goal, (2) the integration is a single line addition to the command registry array, and (3) the `DynamicStationTemplateRegistry.registerTemplate()` method already exists by design. Document the integration as a minor amendment to WS-3.3's `command-registry.ts`.

### Gap 6: No Unified Cost Dashboard (LOW IMPACT)

**Impact:** WS-4.1 tracks per-session Claude costs in `ai.store.sessionCost`. WS-4.3 calls `recordAICost('claude', 'builder-mode')` on every Claude call. But no SOW specifies where the cost information is displayed to the user. WS-4.1 mentions "displayed in settings panel area" but the settings panel was not designed in WS-3.3 to include cost information.

**Recommendation:** Add a small cost display to the AI status section of whatever settings or status UI exists. This is a 1-2 hour task that can be handled during WS-4.1 implementation. The format should be simple: "Claude session cost: $0.12 (42 calls)".

---

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream                    | Files                    | AC Count | Realistic Estimate | Agent                                        | Assessment                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ------------------------ | -------- | ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-4.1 Claude API Integration | 6 files (create/modify)  | 25       | 1-1.5 weeks        | `world-class-backend-api-engineer`           | **Achievable.** `ClaudeProvider` mirrors the `OllamaProvider` pattern from WS-3.4. Route Handler is a standard Next.js API route. LiveAIRouter amendments replace a placeholder. `@anthropic-ai/sdk` provides SDK-level type safety. The main complexity is in graceful degradation logic (3 modes x N features) and cost tracking.                                                                                                               |
| WS-4.2 Exception Triage       | 14 files (create)        | 20       | 1-1.5 weeks        | `world-class-autonomous-interface-architect` | **Achievable.** Rule engine is a set of deterministic pattern matchers (pure functions). Ollama integration follows WS-3.4 patterns. 4 recovery panel components are relatively simple UI (glass material + text + buttons). The triage store and hook are straightforward Zustand patterns. Attention choreography integration (tighten mode) uses the existing WS-3.7 API.                                                                      |
| WS-4.3 Builder Mode (Stretch) | 11 files (create)        | 24       | 1-1.5 weeks        | `world-class-autonomous-interface-architect` | **Tight for a stretch goal.** The Zod schema, proposal generator, and builder gate are well-specified pure functions. The panel UI is more complex (glass-strong slide-in, textarea, preview, iteration history). Claude prompt engineering may require iteration. The 5-state phase machine (idle -> describing -> generating -> reviewing -> accepted/rejected) adds lifecycle complexity. Realistic if WS-4.1 and WS-4.2 complete on schedule. |
| WS-4.4 Visual Polish Pass     | 13 files (create/modify) | 14       | 0.5-1 week         | `world-class-ui-designer`                    | **Achievable and parallelizable.** 9 audit modules are independent (can be written in any order). CSS corrections are targeted overrides. Dev overlay is a simple React component. No external dependencies beyond the existing Phase 0-3 codebase. Shortest workstream in the phase.                                                                                                                                                             |

**Total acceptance criteria:** 83 (core) + 24 (stretch WS-4.3) = 107 maximum.
**Total estimated files:** ~44 new/modified files.

### Execution Order

```
Pre-Execution (Day 0):
  - Resolve OQ-4.0.1: Confirm WS-4.3 inclusion or deferral
  - Resolve Conflict 3: Close WS-4.3 OQ-2 with Sonnet default
  - Verify Ollama running with llama3.2 model (for WS-4.2)
  - Verify Phase 3 deliverables complete (LiveAIRouter, ai.store, DynamicStationTemplateRegistry)
  - Run WS-4.4 audit baseline against Phase 3 codebase (Gap 4 recommendation)

Week 1:    WS-4.1 (backend-engineer)           -- Claude API Integration [Day 1]
           WS-4.4 (ui-designer)                -- Visual Polish Pass [Day 1, parallel]
           WS-4.2 (autonomous-interface-arch)  -- Exception Triage [Day 1, soft dep on WS-4.1]

Week 2:    WS-4.1 (backend-engineer)           -- Claude API Integration completes
           WS-4.4 (ui-designer)                -- Visual Polish Pass completes
           WS-4.2 (autonomous-interface-arch)  -- Exception Triage completes
           Integration testing across all 3 workstreams

Week 3     WS-4.3 (autonomous-interface-arch)  -- Builder Mode [STRETCH, after WS-4.1 + WS-4.2]
(if WS-4.3 Cross-workstream integration testing
included): Final visual polish verification
```

### Resource Loading

| Agent                                        | WS-4.1   | WS-4.2   | WS-4.3   | WS-4.4   | Total Load             |
| -------------------------------------------- | -------- | -------- | -------- | -------- | ---------------------- |
| `world-class-backend-api-engineer`           | 1-1.5 wk | --       | --       | --       | **1-1.5 weeks**        |
| `world-class-autonomous-interface-architect` | --       | 1-1.5 wk | 1-1.5 wk | --       | **2-3 weeks (serial)** |
| `world-class-ui-designer`                    | --       | --       | --       | 0.5-1 wk | **0.5-1 week**         |

### Critical Path

```
Without WS-4.3 (core scope):
  Day 1 -----> WS-4.1 (1-1.5wk) -----> [Claude integration complete]
  Day 1 -----> WS-4.2 (1-1.5wk) -----> [Exception triage complete]
  Day 1 -----> WS-4.4 (0.5-1wk) -----> [Visual polish complete]
  -----> Integration buffer (0.5wk)

  Critical path: max(WS-4.1, WS-4.2) + integration = 2 weeks
  Well within M (2-3 weeks) estimate.

With WS-4.3 (stretch scope):
  Day 1 -----> WS-4.1 (1.5wk) ----+
                                    +-----> WS-4.3 (1.5wk) -----> [Builder Mode complete]
  Day 1 -----> WS-4.2 (1.5wk) ----+
  Day 1 -----> WS-4.4 (1wk)   -----> [off critical path]
  -----> Integration buffer (0.5wk)

  Critical path: max(WS-4.1, WS-4.2) + WS-4.3 + integration = 3.5 weeks
  Exceeds M (2-3 weeks) estimate. WS-4.3 inclusion extends timeline to L.
```

### Bottleneck Risks

| Risk                                                             | Likelihood | Impact | Mitigation                                                                                                                                                                   |
| ---------------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WS-4.3 stretches timeline beyond M estimate**                  | High       | Medium | WS-4.3 is explicitly a stretch goal. If it pushes past Week 2, defer to "post-launch enhancement." The system is fully functional without Builder Mode.                      |
| **`@anthropic-ai/sdk` API changes or compatibility issues**      | Low        | Medium | Pin to a specific version in `package.json`. WS-4.1 wraps the SDK in a `ClaudeProvider` abstraction layer, isolating the rest of the codebase from SDK changes.              |
| **Exception rule engine misses common failure patterns**         | Medium     | Low    | Rule engine returns `missing-info` for unrecognized patterns. Ollama provides semantic analysis as second layer. Gap 3 recommendation: track fallthrough rate in first week. |
| **Visual audit produces excessive findings on Phase 3 codebase** | Medium     | Low    | Gap 4 recommendation: establish baseline before Phase 4 changes. Triage findings by severity (errors first, then warnings).                                                  |
| **Autonomous-interface-architect overloaded**                    | Medium     | High   | Agent owns 2 of 4 workstreams (serial constraint). If WS-4.2 runs long, WS-4.3 is cut. Clear escalation path: WS-4.3 deferral is pre-approved by its "Stretch" designation.  |

### PMO Recommendation

**Execute WS-4.1, WS-4.2, and WS-4.4 in parallel starting Day 1.** All three have different agents and no hard cross-dependencies. This is the highest-confidence path to completing the core Phase 4 scope within 2 weeks.

**Decide WS-4.3 inclusion at end of Week 1.** If WS-4.1 and WS-4.2 are tracking to schedule, greenlight WS-4.3 for Week 2-3. If either is behind, formally defer WS-4.3. This decision point removes the timeline risk without requiring an upfront commitment.

**The M (2-3 weeks) estimate from combined-recommendations.md is achievable** for the core scope (WS-4.1 + WS-4.2 + WS-4.4). Including WS-4.3 pushes toward L (3-4 weeks). The stretch designation provides the PMO with clean deferral authority.

---

## Appendix A: Risk Register (Consolidated from All SOWs)

| ID     | Risk                                                                                                 | SOW            | Likelihood | Impact | Severity | Mitigation                                                                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------- | -------------- | ---------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-4.1  | Claude API key not configured, leaving Claude-primary features permanently disabled                  | WS-4.1, WS-4.3 | Medium     | Medium | Medium   | Graceful degradation: deep-dive narration falls back to Ollama, Builder Mode shows "Configure API key." System fully functional on Ollama + rule engines alone. |
| R-4.2  | Claude API latency exceeds 30-second timeout                                                         | WS-4.1, WS-4.3 | Low        | Medium | Low      | 30s timeout is generous for Sonnet. On timeout, error state with clear feedback. WS-4.3 shows "typically 3-8 seconds" in generating UI.                         |
| R-4.3  | Claude cost exceeds expectations due to large prompts (builder catalog context, template vocabulary) | WS-4.1, WS-4.3 | Medium     | Low    | Low      | Per-feature rate limits (builder-mode: 3/min). Session cost tracking with USD estimation. Builder prompt capped at 4000 tokens.                                 |
| R-4.4  | Ollama misclassifies permanent failure as transient, causing futile retries                          | WS-4.2         | Medium     | Medium | Medium   | Rule engine handles common permanent patterns deterministically. Max 5 retries (2.5 minutes) before escalating to permanent regardless.                         |
| R-4.5  | Noisy telemetry (flapping health state) triggers excessive classifications                           | WS-4.2         | Medium     | Medium | Medium   | Exception deduplication by composite key. Debounce of 10s. Max 3 interventions per district.                                                                    |
| R-4.6  | Intervention stations overlap with existing diagnostic templates (WS-3.5)                            | WS-4.2         | Low        | Low    | Low      | Distinct IDs (`intervention--{category}--recovery`). `disposable: true` flag. Higher priority (90-98) than conditional diagnostics (65-70).                     |
| R-4.7  | Claude returns valid JSON that passes Zod validation but is semantically nonsensical                 | WS-4.3         | Medium     | Low    | Low      | Preview rendering makes nonsensical proposals obvious. User can reject and iterate. Claude reasoning field explains choices.                                    |
| R-4.8  | Session-only template storage means builder work lost on refresh                                     | WS-4.3         | High       | Medium | Medium   | By design (D-4.3.4). Receipt audit trail preserves interaction history. OQ-4.3.1 proposes localStorage as simple upgrade.                                       |
| R-4.9  | Timing adjustments in visual polish feel worse than original spec values                             | WS-4.4         | Medium     | Low    | Low      | All overrides in reversible `visual-polish-overrides.css`. Original WS-1.6 and WS-2.1 timing remains in component source.                                       |
| R-4.10 | Global reduced-motion catch-all breaks animation-dependent logic                                     | WS-4.4         | Low        | Medium | Low      | Catch-all targets `*:not(.reduced-motion-exempt)`. Components depending on `animationend` events can add exempt class.                                          |
| R-4.11 | Polish override CSS specificity conflicts with component styles                                      | WS-4.4         | Medium     | Medium | Medium   | Targeted selectors (not `!important` except reduced motion). If conflicts arise, increase specificity with `[data-theme="tarva-core"]` prefix.                  |
| R-4.12 | `motion/react` animations cause layout thrashing in intervention stations                            | WS-4.2         | Low        | Low    | Low      | Each InterventionStation uses `AnimatePresence` with `mode="wait"` to sequence entrance/exit. Animations are simple opacity/translate.                          |

---

## Appendix B: Acceptance Criteria Summary

| SOW                           | # Criteria | Key Verification Methods                                                                                                                                                                                                                                                   |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-4.1 Claude API Integration | 25         | Unit tests (health check, error classification), API route `curl` tests, LiveAIRouter integration, graceful degradation scenarios (no key, invalid key, timeout), cost tracking verification, `pnpm typecheck`                                                             |
| WS-4.2 Exception Triage       | 20         | Rule engine unit tests (ECONNREFUSED, HTTP status codes, unknown patterns), Ollama fallback test, Zod validation, triage store state management, component render tests (4 panels), `motion/react` import verification, glass material CSS inspection, `pnpm tsc --noEmit` |
| WS-4.3 Builder Mode (Stretch) | 24         | Gate condition tests (4 conditions individually), Zod schema validation (7 body types, ~60 icons, max actions/triggers), AIRouter integration, receipt generation (6 action types), phase state machine transitions, panel render tests, `pnpm typecheck`                  |
| WS-4.4 Visual Polish Pass     | 14         | Programmatic audit runs (9 categories, zero errors), frame budget monitoring (>=55fps), reduced motion compliance, `motion/react` layout prop absence, film grain z-index, glass material values, `pnpm run lint`                                                          |
| **Total (core)**              | **59**     |                                                                                                                                                                                                                                                                            |
| **Total (with stretch)**      | **83**     |                                                                                                                                                                                                                                                                            |

---

## Appendix C: File Manifest (All Workstreams)

| File                                                                | WS  | Action | Description                                                                     |
| ------------------------------------------------------------------- | --- | ------ | ------------------------------------------------------------------------------- |
| `src/lib/ai/claude-provider.ts`                                     | 4.1 | Create | Claude API client wrapper (server-side only)                                    |
| `app/api/ai/claude/route.ts`                                        | 4.1 | Create | Next.js Route Handler proxy for Claude API                                      |
| `src/lib/ai/claude-degradation.ts`                                  | 4.1 | Create | Three degradation modes per feature                                             |
| `src/hooks/use-claude-health-check.ts`                              | 4.1 | Create | 120s polling health check hook                                                  |
| `src/lib/ai/live-ai-router.ts`                                      | 4.1 | Modify | Replace Claude placeholder with real routing                                    |
| `src/stores/ai.store.ts`                                            | 4.1 | Modify | Add Claude status, cost tracking extensions                                     |
| `src/lib/interfaces/exception-triage.ts`                            | 4.2 | Create | Exception triage types (ExceptionData, ClassificationResult, InterventionState) |
| `src/lib/ai/exception-rules.ts`                                     | 4.2 | Create | Deterministic rule engine (10+ rules)                                           |
| `src/lib/ai/exception-prompt.ts`                                    | 4.2 | Create | Ollama prompt assembler (<1500 tokens)                                          |
| `src/lib/ai/exception-classifier.ts`                                | 4.2 | Create | Classification orchestrator (rules -> Ollama -> fallback)                       |
| `src/lib/ai/recovery-templates.ts`                                  | 4.2 | Create | 4 StationTemplate objects for recovery UI                                       |
| `src/lib/ai/intervention-generator.ts`                              | 4.2 | Create | Creates InterventionState from classification + receipt                         |
| `src/stores/triage.store.ts`                                        | 4.2 | Create | Zustand+immer store for triage state                                            |
| `src/hooks/use-exception-triage.ts`                                 | 4.2 | Create | Monitors SystemSnapshot for health transitions                                  |
| `src/components/ai/InterventionStation.tsx`                         | 4.2 | Create | Animated intervention station container                                         |
| `src/components/ai/intervention-panels/RetryPanel.tsx`              | 4.2 | Create | Transient failure recovery UI                                                   |
| `src/components/ai/intervention-panels/EscalationPanel.tsx`         | 4.2 | Create | Permanent failure recovery UI                                                   |
| `src/components/ai/intervention-panels/ConfigurationPanel.tsx`      | 4.2 | Create | Policy/config failure recovery UI                                               |
| `src/components/ai/intervention-panels/InformationRequestPanel.tsx` | 4.2 | Create | Missing-info recovery UI                                                        |
| `src/lib/ai/builder-types.ts`                                       | 4.3 | Create | Builder Mode types (BuilderSession, BuilderPhase, BuilderIteration)             |
| `src/lib/ai/builder-proposal-schema.ts`                             | 4.3 | Create | Zod schema with constrained vocabulary                                          |
| `src/lib/ai/station-proposal-generator.ts`                          | 4.3 | Create | Claude prompt assembly and proposal generation                                  |
| `src/lib/ai/builder-gate.ts`                                        | 4.3 | Create | 4-condition gate check + keyboard shortcut detection                            |
| `src/lib/ai/builder-receipt.ts`                                     | 4.3 | Create | Receipt generation for 6 builder action types                                   |
| `src/stores/builder.store.ts`                                       | 4.3 | Create | Zustand+immer store for builder state                                           |
| `src/hooks/use-builder-mode.ts`                                     | 4.3 | Create | Builder Mode orchestration hook                                                 |
| `src/components/ai/BuilderModeActivator.tsx`                        | 4.3 | Create | Keyboard shortcut listener component                                            |
| `src/components/ai/BuilderModePanel.tsx`                            | 4.3 | Create | Glass-strong slide-in builder panel                                             |
| `src/components/ai/StationProposalPreview.tsx`                      | 4.3 | Create | Read-only template preview rendering                                            |
| `src/components/ai/BuilderIterationHistory.tsx`                     | 4.3 | Create | Collapsible iteration timeline                                                  |
| `src/lib/audits/visual-polish-audit.ts`                             | 4.4 | Create | Central audit runner and registry                                               |
| `src/lib/audits/glass-material-audit.ts`                            | 4.4 | Create | 4 glass spec checks                                                             |
| `src/lib/audits/glow-system-audit.ts`                               | 4.4 | Create | 8 glow spec checks                                                              |
| `src/lib/audits/typography-audit.ts`                                | 4.4 | Create | 11 typography spec checks                                                       |
| `src/lib/audits/color-consistency-audit.ts`                         | 4.4 | Create | ~89 token value checks + banned name scan                                       |
| `src/lib/audits/performance-audit.ts`                               | 4.4 | Create | will-change, containment, transition property audit                             |
| `src/lib/audits/reduced-motion-audit.ts`                            | 4.4 | Create | Animation/motion component checks                                               |
| `src/lib/audits/index.ts`                                           | 4.4 | Create | Barrel export with self-registering imports                                     |
| `src/hooks/use-frame-budget-monitor.ts`                             | 4.4 | Create | Continuous 60fps verification hook                                              |
| `src/components/dev/visual-polish-overlay.tsx`                      | 4.4 | Create | Dev-only audit results overlay                                                  |
| `src/styles/ambient-effects.css`                                    | 4.4 | Modify | Polished keyframes, timing adjustments                                          |
| `src/styles/visual-polish-overrides.css`                            | 4.4 | Create | Transition timing, glow corrections, glass pan-state                            |
| `src/styles/reduced-motion.css`                                     | 4.4 | Create | Comprehensive last-resort safety net                                            |

**Total: ~44 files** (31 create + 4 modify for core scope; +11 create for stretch WS-4.3)
