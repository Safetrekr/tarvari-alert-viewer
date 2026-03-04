# WS-4.3: Builder Mode

> **Workstream ID:** WS-4.3
> **Phase:** 4 -- Advanced AI + Polish (Stretch)
> **Assigned Agent:** `world-class-autonomous-interface-architect`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.7 (AIRouter, SystemStateProvider, ReceiptStore, StationTemplateRegistry interfaces), WS-2.6 (Station Panel Framework), WS-3.4 (LiveAIRouter, ai.store.ts), WS-3.5 (DynamicStationTemplateRegistry, template scoring, StationTemplate definitions), WS-4.1 (Claude API integration -- REQUIRED, Builder Mode is Claude-only)
> **Blocks:** None (terminal phase)
> **Resolves:** AD-7 interface #5 Phase 4 upgrade (AIRouter: Claude provider for `builder-mode` feature), combined-recommendations.md Phase 4 work area #3 (Builder Mode), tech-decisions.md AI routing table (`builder-mode: Claude primary, no fallback`)

---

## 1. Objective

Deliver Builder Mode -- a hidden, Claude-powered feature that allows authorized users to describe new station configurations in natural language and have Claude propose a valid `StationTemplate` from the existing template catalog vocabulary. The user reviews the proposal in a live preview (rendered by the WS-2.6 station panel framework), iterates on the description if needed, and accepts or rejects the result. Accepted templates are promoted into the live `DynamicStationTemplateRegistry` (WS-3.5) for the current session. All builder actions generate immutable receipts with full AI metadata.

Builder Mode is the culmination of the AI integration architecture (AD-7). It is the only feature that requires Claude (no Ollama fallback, no rule engine fallback) because generating novel station layouts from unconstrained natural language requires strong reasoning capabilities that exceed local model capacity. If the Claude API key is not configured or the Claude provider is unavailable, Builder Mode is inaccessible -- the gate does not open.

The safety contract from WS-3.5 is preserved: Claude selects from pre-built template vocabulary (`bodyType`, `StationAction` patterns, layout structures, icon identifiers), not arbitrary React. The `StationTemplate` type constrains what Claude can propose. The response is validated with a Zod schema before it reaches the UI. If Claude returns an invalid configuration, the system displays a structured error and invites the user to rephrase.

**Success looks like:** The user presses `Ctrl+Shift+B`. A glass-material panel slides in from the right. They type: "Show me a station that displays build pipeline status as a table with run name, duration, and result columns, plus a button to open Agent Builder." Claude responds in 3-8 seconds with a proposed `StationTemplate` configuration. A live preview renders the station using the existing panel framework. The user clicks "Accept" -- the station appears in the Agent Builder district's template set. A receipt stamp records the entire interaction: the natural language description, Claude's reasoning, the generated configuration, and the accept action.

**Why this workstream matters:** Builder Mode validates that the template-based station architecture (AD-7, AD-8, WS-3.5) is expressive enough for end-user customization without compromising safety. It demonstrates the Claude integration from WS-4.1 in a high-value, user-facing feature. It transforms Tarva Launch from a fixed mission-control layout into a customizable spatial workspace.

**Traceability:** AD-7 (AI Integration Architecture -- `ai-builder-mode` routing), AD-8 (Station Content per District -- template vocabulary), tech-decisions.md (AI routing: `ai-builder-mode: Claude primary, no fallback`), combined-recommendations.md Phase 4 work area #3, combined-recommendations.md Deferred Item #6 ("Full generative UI" is deferred -- Builder Mode uses template selection, not runtime React generation).

---

## 2. Scope

### In Scope

| #   | Item                        | Description                                                                                                                                                                                                                                                 |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Builder mode store          | Zustand store (`src/stores/builder.store.ts`) for builder session state: mode active/inactive, current description, proposed configuration, iteration history, acceptance state                                                                             |
| 2   | Builder mode gate           | Authorization check and hidden activation mechanism. Requires AI beta enabled (WS-3.4 `ai.store`), Claude provider available (WS-4.1), and authenticated session. Hidden keyboard shortcut `Ctrl+Shift+B` plus a hidden command palette entry               |
| 3   | Station proposal generator  | Module (`src/lib/ai/station-proposal-generator.ts`) that assembles the template catalog context, user description, and iteration history into a Claude prompt, sends via `AIRouter`, validates the response with Zod, and returns a typed `StationTemplate` |
| 4   | Builder mode panel          | UI component (`src/components/ai/BuilderModePanel.tsx`) -- glass-material slide-in panel with description textarea, submit button, proposal display, accept/reject/iterate controls, and iteration history                                                  |
| 5   | Station proposal preview    | Component (`src/components/ai/StationProposalPreview.tsx`) that renders the proposed `StationTemplate` using the WS-2.6 station panel framework in a sandboxed preview container                                                                            |
| 6   | Accept/promote workflow     | Adds accepted station to `DynamicStationTemplateRegistry` via `registerTemplate()`. Assigns the template to a user-selected district. Session-scoped (not persisted to Supabase in Phase 4)                                                                 |
| 7   | Receipt generation          | AI receipts for all builder actions: describe, propose, accept, reject, iterate. Uses `ReceiptStore.record()` with full `AIReceiptMetadata`                                                                                                                 |
| 8   | Proposal schema             | Zod validation schema (`src/lib/ai/builder-proposal-schema.ts`) for Claude's response. Ensures the proposed configuration conforms to `StationTemplate` structure                                                                                           |
| 9   | Builder mode types          | TypeScript interfaces (`src/lib/ai/builder-types.ts`) for `BuilderSession`, `BuilderProposal`, `BuilderIteration`, `ProposalValidationResult`                                                                                                               |
| 10  | Command palette integration | Register a hidden `"builder"` / `"build station"` command in the command palette that activates Builder Mode when the gate conditions are met                                                                                                               |

### Out of Scope

| #   | Item                                                             | Reason                                                                                                                                                      |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Supabase persistence of builder-created templates                | Phase 4 scope is session-only. Persistence is a Phase 5+ concern                                                                                            |
| 2   | Full generative UI (AI-generated React at runtime)               | Per combined-recommendations.md Deferred Item #6. Builder Mode uses template vocabulary, not arbitrary React                                                |
| 3   | Multi-step conversational refinement (chat-style back-and-forth) | Iteration is supported (user rephrases, Claude regenerates), but there is no persistent conversation context beyond the current session's iteration history |
| 4   | Template sharing or export                                       | Single-user localhost tool. Sharing requires persistence infrastructure                                                                                     |
| 5   | Ollama fallback for Builder Mode                                 | Per tech-decisions.md routing table: `ai-builder-mode: Claude primary, no fallback (requires strong reasoning)`                                             |
| 6   | Custom icon or visualization creation                            | Claude selects from the existing Lucide icon set. Custom SVG generation is out of scope                                                                     |
| 7   | Builder Mode for non-station UI elements                         | Builder Mode creates station templates only, not districts, capsules, or ambient effects                                                                    |
| 8   | Cost estimation before Claude call                               | Session cost tracking in `ai.store` records the call after it completes. Pre-call cost estimation for Claude is deferred                                    |

---

## 3. Input Dependencies

| Dependency                                                             | Source                                                                                                                | What It Provides                                                                                                                                        | Blocking?                                       |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `AIRouter` interface + `LiveAIRouter`                                  | WS-1.7 / WS-3.4, `src/lib/interfaces/ai-router.ts` / `src/lib/ai/live-ai-router.ts`                                   | `AIRouter.route()` with `feature: 'builder-mode'`, `isAvailable()` check, provider fallback chain, rate limiting, session cost tracking                 | Yes                                             |
| Claude provider                                                        | WS-4.1, `src/lib/ai/claude-provider.ts`                                                                               | `ClaudeProvider` class registered in `LiveAIRouter` for the `ai-builder-mode` route. `@anthropic-ai/sdk` integration, API key management, cost tracking | Yes                                             |
| `StationTemplateRegistry` interface + `DynamicStationTemplateRegistry` | WS-1.7 / WS-3.5, `src/lib/interfaces/station-template-registry.ts` / `src/lib/template-selection/dynamic-registry.ts` | `StationTemplate` type, `registerTemplate()` method, `getAllTemplates()` for catalog context, `getTemplatesForDistrict()`                               | Yes                                             |
| `ReceiptStore` interface                                               | WS-1.7 / WS-3.1, `src/lib/interfaces/receipt-store.ts`                                                                | `ReceiptStore.record()`, `ReceiptInput`, `AIReceiptMetadata` types for audit trail                                                                      | Yes                                             |
| `SystemStateProvider`                                                  | WS-1.7 / WS-1.5, `src/lib/interfaces/system-state-provider.ts`                                                        | `SystemSnapshot` for template catalog context (which districts exist, their current state)                                                              | Yes                                             |
| Station Panel Framework                                                | WS-2.6, `src/components/stations/StationPanel.tsx`                                                                    | `StationPanel` component for rendering the proposal preview using the same visual treatment as real stations                                            | Yes                                             |
| AI store                                                               | WS-3.4, `src/stores/ai.store.ts`                                                                                      | `betaEnabled` flag, `providerStatuses.claude`, `sessionCost`, `recordAICost()` action                                                                   | Yes                                             |
| Auth store                                                             | WS-1.3, `src/stores/auth.store.ts`                                                                                    | `authenticated` flag for the builder gate authorization check                                                                                           | Yes                                             |
| `StationTemplate` type                                                 | WS-1.7, `src/lib/interfaces/station-template-registry.ts`                                                             | Full type definition including `StationLayout`, `StationAction`, `TriggerCondition`, `bodyType` union, icon identifiers                                 | Yes                                             |
| Shared domain types                                                    | WS-1.7, `src/lib/interfaces/types.ts`                                                                                 | `AppIdentifier`, `ALL_APP_IDS`, `APP_DISPLAY_NAMES`, `ISOTimestamp`                                                                                     | Yes                                             |
| Command palette                                                        | WS-3.3, `src/components/command-palette/`                                                                             | Registration point for the hidden `"builder"` command                                                                                                   | Soft -- can activate via keyboard shortcut only |
| `zod`                                                                  | npm                                                                                                                   | Schema validation for Claude's response                                                                                                                 | Yes                                             |
| `motion/react` v12+                                                    | npm                                                                                                                   | Slide-in animation for the builder panel                                                                                                                | Yes                                             |
| `@tarva/ui`                                                            | npm                                                                                                                   | `Dialog`, `Button`, `Textarea`, `Badge`, `ScrollArea`, `Tooltip`, `Select` components                                                                   | Yes                                             |
| `lucide-react`                                                         | npm                                                                                                                   | `Wand2`, `Check`, `X`, `RefreshCw`, `Eye`, `ChevronRight`, `Sparkles`, `Lock` icons                                                                     | Yes                                             |
| VISUAL-DESIGN-SPEC.md                                                  | Discovery docs                                                                                                        | Glass material recipes, glow tokens, Z3 typography for the builder panel                                                                                | Reference                                       |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  stores/
    builder.store.ts                    # Builder session state (Zustand)
  lib/
    ai/
      builder-types.ts                  # BuilderSession, BuilderProposal, BuilderIteration types
      builder-proposal-schema.ts        # Zod schema for Claude response validation
      station-proposal-generator.ts     # NL description -> Claude -> StationTemplate
      builder-gate.ts                   # Authorization + activation guard
      builder-receipt.ts                # Receipt generation for builder actions
  components/
    ai/
      BuilderModePanel.tsx              # Main builder UI panel
      StationProposalPreview.tsx        # Live preview of proposed station
      BuilderModeActivator.tsx          # Keyboard shortcut listener + gate check
      BuilderIterationHistory.tsx       # Collapsible iteration timeline
  hooks/
    use-builder-mode.ts                 # Orchestration hook wiring store, generator, gate, receipts
```

### 4.2 Builder Types -- `src/lib/ai/builder-types.ts`

```ts
/**
 * Types for the Builder Mode system.
 *
 * Builder Mode allows authorized users to describe station configurations
 * in natural language. Claude proposes a StationTemplate; the user reviews,
 * iterates, and accepts or rejects.
 *
 * References: AD-7 (ai-builder-mode routing), WS-3.5 (StationTemplate),
 * tech-decisions.md (Claude primary, no fallback)
 */

import type { AppIdentifier, ISOTimestamp } from '@/lib/interfaces/types'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Builder Session
// ============================================================================

/**
 * The current state of a Builder Mode session.
 * A session starts when Builder Mode is activated and ends when
 * the panel is closed or the user accepts/rejects the final proposal.
 */
export interface BuilderSession {
  /** Unique session ID. */
  readonly id: string
  /** When the session started. */
  readonly startedAt: ISOTimestamp
  /** The user's current natural language description. */
  readonly description: string
  /** The target district for the proposed station. Null until user selects. */
  readonly targetDistrictId: AppIdentifier | null
  /** The current proposal from Claude. Null before first submission. */
  readonly currentProposal: BuilderProposal | null
  /** History of all iterations in this session. */
  readonly iterations: readonly BuilderIteration[]
  /** Current phase of the builder workflow. */
  readonly phase: BuilderPhase
}

/**
 * Phases of the builder workflow state machine.
 *
 * idle -> describing -> generating -> reviewing -> (accept | iterate | reject)
 *   iterate -> describing (loop)
 *   accept -> accepted (terminal)
 *   reject -> idle (reset)
 */
export type BuilderPhase =
  | 'idle' // Builder panel open, no description entered
  | 'describing' // User is typing a description
  | 'generating' // Claude is processing the request
  | 'reviewing' // Proposal received, user is reviewing
  | 'accepted' // User accepted the proposal (terminal for this session)
  | 'rejected' // User rejected the proposal (can start new session)
  | 'error' // Claude returned an error or invalid response

// ============================================================================
// Builder Proposal
// ============================================================================

/**
 * A station configuration proposed by Claude.
 */
export interface BuilderProposal {
  /** The proposed station template configuration. */
  readonly template: StationTemplate
  /** Claude's reasoning for the proposed configuration. */
  readonly reasoning: string
  /** Confidence score (0.0-1.0) in the proposal's fit to the description. */
  readonly confidence: number
  /** Alternative approaches Claude considered. */
  readonly alternatives: readonly string[]
  /** Which Claude model generated this proposal. */
  readonly modelId: string
  /** End-to-end latency of the Claude call in milliseconds. */
  readonly latencyMs: number
  /** The raw prompt sent to Claude (for receipt audit trail). */
  readonly prompt: string
  /** Timestamp of proposal generation. */
  readonly generatedAt: ISOTimestamp
}

// ============================================================================
// Builder Iteration
// ============================================================================

/**
 * A single iteration in the builder workflow.
 * Tracks the description, proposal, and outcome for audit purposes.
 */
export interface BuilderIteration {
  /** Iteration number (1-based). */
  readonly iterationNumber: number
  /** The natural language description for this iteration. */
  readonly description: string
  /** The proposal generated for this iteration. Null if generation failed. */
  readonly proposal: BuilderProposal | null
  /** Error message if generation failed. */
  readonly error: string | null
  /** Outcome of this iteration. */
  readonly outcome: 'accepted' | 'rejected' | 'iterated' | 'error' | 'pending'
  /** Timestamp of this iteration. */
  readonly timestamp: ISOTimestamp
}

// ============================================================================
// Proposal Validation
// ============================================================================

/**
 * Result of validating Claude's response against the StationTemplate schema.
 */
export interface ProposalValidationResult {
  /** Whether the response is valid. */
  readonly valid: boolean
  /** The validated StationTemplate if valid, null otherwise. */
  readonly template: StationTemplate | null
  /** Validation errors, if any. */
  readonly errors: readonly string[]
  /** The raw response from Claude (before validation). */
  readonly rawResponse: string
}

// ============================================================================
// Builder Gate
// ============================================================================

/**
 * Result of the builder gate authorization check.
 */
export interface BuilderGateResult {
  /** Whether Builder Mode can be activated. */
  readonly allowed: boolean
  /** Reason the gate is blocked (if not allowed). */
  readonly reason: string | null
  /** Individual gate conditions and their status. */
  readonly conditions: readonly BuilderGateCondition[]
}

export interface BuilderGateCondition {
  readonly name: string
  readonly met: boolean
  readonly description: string
}

// ============================================================================
// Template Catalog Context
// ============================================================================

/**
 * Summarized template catalog for the Claude prompt.
 * Provides Claude with the vocabulary of what a StationTemplate can contain.
 */
export interface TemplateCatalogContext {
  /** Available body types with descriptions. */
  readonly bodyTypes: readonly BodyTypeDescription[]
  /** Available action patterns with examples. */
  readonly actionPatterns: readonly ActionPatternDescription[]
  /** Available icon identifiers (subset of Lucide). */
  readonly availableIcons: readonly string[]
  /** Existing templates grouped by district (for context). */
  readonly existingTemplates: Record<AppIdentifier, readonly TemplateSummary[]>
  /** Available districts the new template can be assigned to. */
  readonly availableDistricts: readonly DistrictSummary[]
}

export interface BodyTypeDescription {
  readonly type: string
  readonly description: string
  readonly example: string
}

export interface ActionPatternDescription {
  readonly pattern: string
  readonly description: string
  readonly variants: readonly string[]
}

export interface TemplateSummary {
  readonly id: string
  readonly displayName: string
  readonly bodyType: string
  readonly category: 'universal' | 'app-specific'
}

export interface DistrictSummary {
  readonly id: AppIdentifier
  readonly displayName: string
  readonly health: string
  readonly existingStationCount: number
}
```

### 4.3 Builder Proposal Schema -- `src/lib/ai/builder-proposal-schema.ts`

Zod validation schema that constrains Claude's response to valid `StationTemplate` structure. Ensures the safety contract: Claude selects from template vocabulary, never generates arbitrary code.

```ts
/**
 * Zod schema for validating Claude's Builder Mode response.
 *
 * Claude returns a JSON object describing a StationTemplate.
 * This schema validates the response structure, constrains values
 * to the allowed vocabulary (bodyTypes, icon names, action variants),
 * and transforms the raw response into a typed StationTemplate.
 *
 * Safety contract: Claude can only produce configurations that
 * the station panel framework (WS-2.6) knows how to render.
 * No arbitrary React, no executable code, no script injection.
 *
 * References: WS-1.7 StationTemplate type, WS-2.6 bodyType renderers,
 * WS-3.5 template registration pattern
 */

import { z } from 'zod'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { AppIdentifier } from '@/lib/interfaces/types'
import { ALL_APP_IDS } from '@/lib/interfaces/types'
import type { ProposalValidationResult } from './builder-types'

// ============================================================================
// Allowed Vocabulary
// ============================================================================

/**
 * Body types that the station panel framework (WS-2.6) can render.
 * Claude MUST select from this set.
 */
const ALLOWED_BODY_TYPES = ['metrics', 'list', 'table', 'chart', 'log', 'status', 'empty'] as const

/**
 * Action button variants from @tarva/ui Button component.
 */
const ALLOWED_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive'] as const

/**
 * Subset of Lucide icon names available in the project.
 * Claude selects from this set for header icons and action icons.
 */
const ALLOWED_ICONS = [
  'Activity',
  'AlertCircle',
  'AlertOctagon',
  'AlertTriangle',
  'ArrowRight',
  'BarChart',
  'BarChart2',
  'BarChart3',
  'Bell',
  'Book',
  'Bot',
  'Bug',
  'Check',
  'CheckCircle',
  'ChevronRight',
  'Clock',
  'Code',
  'Cpu',
  'Database',
  'ExternalLink',
  'Eye',
  'FileText',
  'Filter',
  'Flame',
  'Gauge',
  'GitBranch',
  'Globe',
  'Hash',
  'Heart',
  'HelpCircle',
  'History',
  'Info',
  'Layers',
  'LayoutDashboard',
  'LineChart',
  'List',
  'Loader',
  'Lock',
  'Mail',
  'Map',
  'MessageCircle',
  'Monitor',
  'Package',
  'Pause',
  'PieChart',
  'Play',
  'Plus',
  'Power',
  'RefreshCw',
  'Rocket',
  'Search',
  'Server',
  'Settings',
  'Shield',
  'ShieldAlert',
  'Sparkles',
  'Star',
  'Table',
  'Terminal',
  'Timer',
  'TrendingDown',
  'TrendingUp',
  'Unlock',
  'Upload',
  'Users',
  'Wand2',
  'Zap',
] as const

// ============================================================================
// Zod Schemas
// ============================================================================

const stationActionSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(48),
  variant: z.enum(ALLOWED_VARIANTS).default('default'),
  command: z.string().min(1).max(256),
  icon: z.enum(ALLOWED_ICONS).optional(),
})

const stationLayoutSchema = z.object({
  header: z.object({
    title: z.string().min(1).max(48),
    icon: z.enum(ALLOWED_ICONS).optional(),
  }),
  bodyType: z.enum(ALLOWED_BODY_TYPES),
  actions: z.array(stationActionSchema).max(4).default([]),
})

const triggerConditionSchema = z.object({
  field: z.string().min(1).max(128),
  operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte', 'contains', 'exists']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  weight: z.number().min(0).max(1).default(0.5),
})

/**
 * The full response schema Claude must conform to.
 * This is the JSON structure Claude returns.
 */
export const builderProposalResponseSchema = z.object({
  /** Human-readable station name. */
  name: z.string().min(1).max(48),
  /** Display name shown in the station header. */
  displayName: z.string().min(1).max(48),
  /** Description of what this station shows. */
  description: z.string().min(1).max(256),
  /** The station layout configuration. */
  layout: stationLayoutSchema,
  /** Optional trigger conditions for dynamic activation. */
  triggers: z.array(triggerConditionSchema).max(5).default([]),
  /** Priority for selection ordering (0-100). */
  priority: z.number().min(0).max(100).default(50),
  /** Reasoning for the proposed configuration. */
  reasoning: z.string().min(1).max(512),
  /** Confidence in the proposal (0.0-1.0). */
  confidence: z.number().min(0).max(1).default(0.7),
  /** Alternative approaches considered. */
  alternatives: z.array(z.string().max(256)).max(3).default([]),
})

export type BuilderProposalResponse = z.infer<typeof builderProposalResponseSchema>

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate and transform Claude's raw JSON response into a ProposalValidationResult.
 *
 * @param rawJson - The raw JSON string from Claude.
 * @param districtId - The target district selected by the user.
 * @param sessionId - The builder session ID for template ID generation.
 */
export function validateProposalResponse(
  rawJson: string,
  districtId: AppIdentifier,
  sessionId: string
): ProposalValidationResult {
  // Step 1: Parse JSON.
  let parsed: unknown
  try {
    parsed = JSON.parse(rawJson)
  } catch (error) {
    return {
      valid: false,
      template: null,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`],
      rawResponse: rawJson,
    }
  }

  // Step 2: Validate against Zod schema.
  const result = builderProposalResponseSchema.safeParse(parsed)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    return {
      valid: false,
      template: null,
      errors,
      rawResponse: rawJson,
    }
  }

  // Step 3: Transform into StationTemplate.
  const data = result.data
  const timestamp = Date.now()
  const templateId = `builder--${sanitizeName(data.name)}--${sessionId.slice(0, 8)}-${timestamp}`

  const template: StationTemplate = {
    id: templateId,
    districtId,
    name: sanitizeName(data.name),
    displayName: data.displayName,
    description: data.description,
    category: 'app-specific',
    layout: {
      header: {
        title: data.layout.header.title,
        icon: data.layout.header.icon,
      },
      bodyType: data.layout.bodyType,
      actions: data.layout.actions.map((action) => ({
        id: action.id,
        label: action.label,
        variant: action.variant,
        command: action.command,
        icon: action.icon,
      })),
    },
    triggers: data.triggers.map((trigger) => ({
      field: trigger.field,
      operator: trigger.operator,
      value: trigger.value,
      weight: trigger.weight,
    })),
    priority: data.priority,
    disposable: true, // Builder-created templates are always disposable
  }

  return {
    valid: true,
    template,
    errors: [],
    rawResponse: rawJson,
  }
}

/**
 * Sanitize a station name into a kebab-case identifier.
 */
function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

/**
 * Get the allowed vocabulary as a structured object for the Claude prompt.
 */
export function getAllowedVocabulary(): {
  bodyTypes: readonly string[]
  variants: readonly string[]
  icons: readonly string[]
  operators: readonly string[]
} {
  return {
    bodyTypes: ALLOWED_BODY_TYPES,
    variants: ALLOWED_VARIANTS,
    icons: ALLOWED_ICONS,
    operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'contains', 'exists'],
  }
}
```

### 4.4 Station Proposal Generator -- `src/lib/ai/station-proposal-generator.ts`

The core module that assembles the Claude prompt from the template catalog context and user description, sends the request via `AIRouter`, validates the response, and returns a typed `BuilderProposal`.

````ts
/**
 * Station Proposal Generator -- translates natural language into StationTemplates.
 *
 * Pipeline:
 * 1. Build template catalog context (available body types, actions, icons, existing templates)
 * 2. Assemble Claude prompt with user description + catalog context + iteration history
 * 3. Route via AIRouter with feature 'builder-mode' (Claude primary, no fallback)
 * 4. Validate response with Zod schema (builder-proposal-schema.ts)
 * 5. Return BuilderProposal or structured error
 *
 * Safety: Claude can ONLY produce configurations within the StationTemplate vocabulary.
 * The Zod schema rejects any response that doesn't conform to allowed bodyTypes,
 * icon names, action variants, and trigger operators. No executable code is accepted.
 *
 * References: AD-7 (ai-builder-mode: Claude primary, no fallback),
 * WS-3.5 (DynamicStationTemplateRegistry), WS-4.1 (Claude provider)
 */

import type { AIRouter } from '@/lib/interfaces/ai-router'
import type {
  StationTemplate,
  StationTemplateRegistry,
} from '@/lib/interfaces/station-template-registry'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { AppIdentifier } from '@/lib/interfaces/types'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type {
  BuilderProposal,
  BuilderIteration,
  TemplateCatalogContext,
  BodyTypeDescription,
  ActionPatternDescription,
  TemplateSummary,
  DistrictSummary,
} from './builder-types'
import { validateProposalResponse, getAllowedVocabulary } from './builder-proposal-schema'

// ============================================================================
// Configuration
// ============================================================================

export interface ProposalGeneratorConfig {
  /** Timeout for the Claude API call in milliseconds. Default: 30000 (30s). */
  readonly timeoutMs: number
  /** Maximum prompt size in estimated tokens. Default: 4000. */
  readonly maxPromptTokens: number
  /** Temperature for Claude generation. Default: 0.4 (creative but constrained). */
  readonly temperature: number
}

export const DEFAULT_GENERATOR_CONFIG: Readonly<ProposalGeneratorConfig> = {
  timeoutMs: 30_000,
  maxPromptTokens: 4_000,
  temperature: 0.4,
} as const

// ============================================================================
// Result Type
// ============================================================================

export interface ProposalGeneratorResult {
  readonly success: boolean
  readonly proposal: BuilderProposal | null
  readonly error: string | null
  /** The full prompt sent to Claude (for receipt audit trail). */
  readonly prompt: string
}

// ============================================================================
// Generator
// ============================================================================

export class StationProposalGenerator {
  private config: ProposalGeneratorConfig

  constructor(config: Partial<ProposalGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_GENERATOR_CONFIG, ...config }
  }

  /**
   * Generate a station proposal from a natural language description.
   *
   * @param description - The user's natural language description of the desired station.
   * @param districtId - The target district for the proposed station.
   * @param sessionId - The builder session ID.
   * @param registry - The station template registry (for catalog context).
   * @param snapshot - The current system snapshot (for district context).
   * @param aiRouter - The AI router (routes to Claude).
   * @param previousIterations - Previous iterations for refinement context.
   */
  async generate(
    description: string,
    districtId: AppIdentifier,
    sessionId: string,
    registry: StationTemplateRegistry,
    snapshot: SystemSnapshot,
    aiRouter: AIRouter,
    previousIterations: readonly BuilderIteration[] = []
  ): Promise<ProposalGeneratorResult> {
    // Step 1: Build catalog context.
    const catalogContext = this.buildCatalogContext(registry, snapshot)

    // Step 2: Assemble prompt.
    const prompt = this.assemblePrompt(description, districtId, catalogContext, previousIterations)

    // Step 3: Route to Claude via AIRouter.
    const startTime = performance.now()

    try {
      const response = await aiRouter.route({
        feature: 'builder-mode',
        input: { description, districtId, prompt },
        context: snapshot,
        timeout: this.config.timeoutMs,
      })

      const latencyMs = Math.round(performance.now() - startTime)

      if (!response.success) {
        return {
          success: false,
          proposal: null,
          error: response.error ?? 'Claude returned an unsuccessful response.',
          prompt,
        }
      }

      // Step 4: Validate response.
      const rawJson =
        typeof response.result === 'string' ? response.result : JSON.stringify(response.result)

      const validation = validateProposalResponse(rawJson, districtId, sessionId)

      if (!validation.valid) {
        return {
          success: false,
          proposal: null,
          error: `Invalid proposal: ${validation.errors.join('; ')}`,
          prompt,
        }
      }

      // Step 5: Build proposal object.
      const parsed = JSON.parse(rawJson)

      const proposal: BuilderProposal = {
        template: validation.template!,
        reasoning: parsed.reasoning ?? 'No reasoning provided.',
        confidence: parsed.confidence ?? 0.7,
        alternatives: parsed.alternatives ?? [],
        modelId: response.modelId ?? 'claude',
        latencyMs,
        prompt,
        generatedAt: new Date().toISOString(),
      }

      return {
        success: true,
        proposal,
        error: null,
        prompt,
      }
    } catch (error) {
      return {
        success: false,
        proposal: null,
        error: error instanceof Error ? error.message : String(error),
        prompt,
      }
    }
  }

  // --------------------------------------------------------------------------
  // Context Assembly
  // --------------------------------------------------------------------------

  /**
   * Build the template catalog context for the Claude prompt.
   * Summarizes the template vocabulary and existing templates.
   */
  private buildCatalogContext(
    registry: StationTemplateRegistry,
    snapshot: SystemSnapshot
  ): TemplateCatalogContext {
    const vocabulary = getAllowedVocabulary()

    const bodyTypes: BodyTypeDescription[] = [
      {
        type: 'metrics',
        description: 'Key-value metric cards with sparklines',
        example: 'Uptime: 99.9%, Response Time: 45ms',
      },
      {
        type: 'list',
        description: 'Scrollable list of items with status indicators',
        example: 'Recent errors, active alerts, pending approvals',
      },
      {
        type: 'table',
        description: 'Tabular data with sortable columns',
        example: 'Build pipeline runs with name, duration, status columns',
      },
      {
        type: 'chart',
        description: 'Data visualization (bar chart, line chart, area chart)',
        example: 'Request latency over time, error rate histogram',
      },
      {
        type: 'log',
        description: 'Chronological event log with timestamps',
        example: 'Deployment log, error log, activity feed',
      },
      {
        type: 'status',
        description: 'Health status dashboard with indicators',
        example: 'Service health, dependency checks, system resources',
      },
      {
        type: 'empty',
        description: 'Placeholder for custom content',
        example: 'Welcome message, instructions, placeholder',
      },
    ]

    const actionPatterns: ActionPatternDescription[] = [
      {
        pattern: 'navigate',
        description: 'Navigate to a district or station',
        variants: ['default', 'secondary'],
      },
      {
        pattern: 'open',
        description: 'Open an external app in a new tab',
        variants: ['default', 'outline'],
      },
      {
        pattern: 'action',
        description: 'Trigger a station-specific action',
        variants: ['default', 'secondary', 'destructive'],
      },
      { pattern: 'view', description: 'Switch to a detailed view', variants: ['ghost', 'outline'] },
    ]

    // Summarize existing templates per district.
    const existingTemplates: Record<AppIdentifier, TemplateSummary[]> = {} as Record<
      AppIdentifier,
      TemplateSummary[]
    >
    const allTemplates = registry.getAllTemplates()

    for (const template of allTemplates) {
      const did = template.districtId as AppIdentifier
      if (!existingTemplates[did]) {
        existingTemplates[did] = []
      }
      existingTemplates[did].push({
        id: template.id,
        displayName: template.displayName,
        bodyType: template.layout.bodyType,
        category: template.category,
      })
    }

    // Summarize available districts.
    const availableDistricts: DistrictSummary[] = Object.entries(snapshot.apps).map(
      ([id, appState]) => ({
        id: id as AppIdentifier,
        displayName: appState.displayName,
        health: appState.health,
        existingStationCount: existingTemplates[id as AppIdentifier]?.length ?? 0,
      })
    )

    return {
      bodyTypes,
      actionPatterns,
      availableIcons: [...vocabulary.icons],
      existingTemplates,
      availableDistricts,
    }
  }

  // --------------------------------------------------------------------------
  // Prompt Assembly
  // --------------------------------------------------------------------------

  /**
   * Assemble the full Claude prompt.
   */
  private assemblePrompt(
    description: string,
    districtId: AppIdentifier,
    catalog: TemplateCatalogContext,
    previousIterations: readonly BuilderIteration[]
  ): string {
    const lines: string[] = []

    // Role
    lines.push(
      'You are the Station Builder for Tarva Launch, a spatial mission-control interface.',
      'Your job is to create station template configurations based on natural language descriptions.',
      'You MUST respond with a single JSON object. No text outside the JSON.',
      ''
    )

    // Target district
    const districtName = APP_DISPLAY_NAMES[districtId] ?? districtId
    lines.push(`## Target District: ${districtName} (id: "${districtId}")`, '')

    // Existing templates in this district
    const existing = catalog.existingTemplates[districtId] ?? []
    if (existing.length > 0) {
      lines.push('### Existing Stations in This District')
      for (const t of existing) {
        lines.push(`- ${t.displayName} (${t.bodyType}, ${t.category})`)
      }
      lines.push('')
    }

    // Template vocabulary
    lines.push('## Available Body Types')
    for (const bt of catalog.bodyTypes) {
      lines.push(`- **${bt.type}**: ${bt.description}. Example: "${bt.example}"`)
    }
    lines.push('')

    lines.push('## Available Action Patterns')
    for (const ap of catalog.actionPatterns) {
      lines.push(
        `- **${ap.pattern}**: ${ap.description}. Button variants: ${ap.variants.join(', ')}`
      )
    }
    lines.push('')

    lines.push(
      '## Available Icons (Lucide)',
      `${catalog.availableIcons.slice(0, 40).join(', ')}, ... (${catalog.availableIcons.length} total)`,
      ''
    )

    // Iteration history (if any)
    if (previousIterations.length > 0) {
      lines.push('## Previous Iterations')
      for (const iter of previousIterations) {
        lines.push(`### Iteration ${iter.iterationNumber}`)
        lines.push(`Description: "${iter.description}"`)
        if (iter.proposal) {
          lines.push(
            `Result: ${iter.proposal.template.displayName} (${iter.proposal.template.layout.bodyType})`
          )
          lines.push(`Outcome: ${iter.outcome}`)
        } else if (iter.error) {
          lines.push(`Error: ${iter.error}`)
        }
        lines.push('')
      }
      lines.push(
        'The user is iterating. Improve on the previous attempt based on their new description.'
      )
      lines.push('')
    }

    // Response format
    lines.push(
      '## Required JSON Response Format',
      '',
      '```json',
      '{',
      '  "name": "kebab-case-name",',
      '  "displayName": "Human Readable Name",',
      '  "description": "What this station shows and why it is useful",',
      '  "layout": {',
      '    "header": { "title": "Station Title", "icon": "IconName" },',
      '    "bodyType": "metrics|list|table|chart|log|status|empty",',
      '    "actions": [',
      '      {',
      '        "id": "action-id",',
      '        "label": "Button Label",',
      '        "variant": "default|secondary|outline|ghost|destructive",',
      '        "command": "command string",',
      '        "icon": "IconName"',
      '      }',
      '    ]',
      '  },',
      '  "triggers": [',
      '    {',
      '      "field": "apps.<district-id>.<field>",',
      '      "operator": "eq|gt|lt|gte|lte|contains|exists",',
      '      "value": "value to compare",',
      '      "weight": 0.5',
      '    }',
      '  ],',
      '  "priority": 50,',
      '  "reasoning": "Why this configuration matches the user request",',
      '  "confidence": 0.8,',
      '  "alternatives": ["Alternative approach 1", "Alternative approach 2"]',
      '}',
      '```',
      '',
      'Rules:',
      '- bodyType MUST be one of: metrics, list, table, chart, log, status, empty',
      '- icon MUST be a valid Lucide icon name from the available list',
      '- action variant MUST be one of: default, secondary, outline, ghost, destructive',
      '- trigger field paths reference the SystemSnapshot: apps.<district-id>.health, apps.<district-id>.alertCount, etc.',
      '- Maximum 4 actions per station',
      '- Maximum 5 trigger conditions',
      '- Keep displayName under 48 characters',
      '- Keep description under 256 characters',
      '- Set confidence based on how well the description maps to template vocabulary',
      '- If the description is ambiguous, set confidence < 0.6 and suggest alternatives',
      ''
    )

    // User description (the actual input)
    lines.push(
      '## User Description',
      '',
      `"${description}"`,
      '',
      'Generate the station template JSON now.'
    )

    return lines.join('\n')
  }
}
````

### 4.5 Builder Gate -- `src/lib/ai/builder-gate.ts`

Authorization and activation guard for Builder Mode.

```ts
/**
 * Builder Gate -- authorization and activation guard.
 *
 * Builder Mode requires ALL of the following conditions:
 * 1. User is authenticated (auth.store)
 * 2. AI beta toggle is enabled (ai.store)
 * 3. Claude provider is available (ai.store providerStatuses.claude)
 * 4. No other builder session is in the 'generating' phase
 *
 * The gate is checked before the builder panel opens and before
 * each generation request. If any condition fails, the gate returns
 * a descriptive reason that the UI displays to the user.
 *
 * Activation methods:
 * - Keyboard shortcut: Ctrl+Shift+B (Cmd+Shift+B on macOS)
 * - Hidden command palette entry: "builder" or "build station"
 *
 * References: tech-decisions.md (ai-builder-mode: Claude primary, no fallback),
 * AD-7 (graceful degradation -- if Claude unavailable, Builder Mode is inaccessible)
 */

import type { BuilderGateResult, BuilderGateCondition, BuilderPhase } from './builder-types'

// ============================================================================
// Gate Check
// ============================================================================

export interface BuilderGateInput {
  /** Whether the user is authenticated. From auth.store. */
  readonly isAuthenticated: boolean
  /** Whether AI beta toggle is enabled. From ai.store. */
  readonly aiBetaEnabled: boolean
  /** Whether the Claude provider is available. From ai.store. */
  readonly claudeAvailable: boolean
  /** Current builder phase (to prevent double-entry). */
  readonly currentPhase: BuilderPhase
}

/**
 * Check all conditions required to activate Builder Mode.
 *
 * @returns A BuilderGateResult with the overall verdict and per-condition details.
 */
export function checkBuilderGate(input: BuilderGateInput): BuilderGateResult {
  const conditions: BuilderGateCondition[] = [
    {
      name: 'Authenticated',
      met: input.isAuthenticated,
      description: input.isAuthenticated
        ? 'User session is active.'
        : 'Login required. Builder Mode is only available to authenticated users.',
    },
    {
      name: 'AI Beta Enabled',
      met: input.aiBetaEnabled,
      description: input.aiBetaEnabled
        ? 'AI features are enabled.'
        : 'Enable the AI beta toggle in settings to use Builder Mode.',
    },
    {
      name: 'Claude Available',
      met: input.claudeAvailable,
      description: input.claudeAvailable
        ? 'Claude API connection is active.'
        : 'Builder Mode requires a Claude API key. Configure it in settings (WS-4.1).',
    },
    {
      name: 'Not Already Generating',
      met: input.currentPhase !== 'generating',
      description:
        input.currentPhase !== 'generating'
          ? 'No active generation in progress.'
          : 'A station proposal is currently being generated. Wait for it to complete.',
    },
  ]

  const allowed = conditions.every((c) => c.met)
  const failedCondition = conditions.find((c) => !c.met)

  return {
    allowed,
    reason: allowed ? null : (failedCondition?.description ?? 'Unknown gate failure.'),
    conditions,
  }
}

// ============================================================================
// Keyboard Shortcut
// ============================================================================

/**
 * The keyboard shortcut that activates Builder Mode.
 * Ctrl+Shift+B on Windows/Linux, Cmd+Shift+B on macOS.
 */
export const BUILDER_SHORTCUT = {
  key: 'b',
  ctrlOrMeta: true,
  shift: true,
  display:
    typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent)
      ? '\u2318\u21e7B'
      : 'Ctrl+Shift+B',
} as const

/**
 * Check if a keyboard event matches the Builder Mode shortcut.
 */
export function isBuilderShortcut(event: KeyboardEvent): boolean {
  return (
    event.key.toLowerCase() === BUILDER_SHORTCUT.key &&
    (event.ctrlKey || event.metaKey) &&
    event.shiftKey &&
    !event.altKey
  )
}
```

### 4.6 Builder Store -- `src/stores/builder.store.ts`

Zustand store for Builder Mode session state.

```ts
/**
 * Builder Mode session state store.
 *
 * Manages: builder session lifecycle, description text, proposed templates,
 * iteration history, target district selection, builder phase transitions.
 *
 * The store follows the Phase 4 "session-only" scope -- nothing is
 * persisted to Supabase. Builder-created templates live only in the
 * DynamicStationTemplateRegistry for the current page session.
 *
 * References: AD-7 (ai-builder-mode), WS-3.5 (template registration),
 * WS-3.4 (ai.store pattern)
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type {
  BuilderSession,
  BuilderPhase,
  BuilderProposal,
  BuilderIteration,
} from '@/lib/ai/builder-types'

// ============================================================================
// Store Shape
// ============================================================================

export interface BuilderState {
  /** Whether the builder panel is visible. */
  panelOpen: boolean
  /** The active builder session. Null when no session is active. */
  session: BuilderSession | null
  /** IDs of all templates created by the builder in this page session. */
  createdTemplateIds: string[]
}

export interface BuilderActions {
  /** Open the builder panel and start a new session. */
  openBuilder: () => void
  /** Close the builder panel. Preserves session for potential resume. */
  closeBuilder: () => void
  /** Set the user's natural language description. */
  setDescription: (description: string) => void
  /** Set the target district for the proposed station. */
  setTargetDistrict: (districtId: AppIdentifier) => void
  /** Transition to the 'generating' phase (Claude is processing). */
  startGenerating: () => void
  /** Set the proposal result from Claude. Transitions to 'reviewing'. */
  setProposal: (proposal: BuilderProposal) => void
  /** Set an error from the generation attempt. Transitions to 'error'. */
  setError: (error: string) => void
  /** Accept the current proposal. Transitions to 'accepted'. */
  acceptProposal: () => void
  /** Reject the current proposal. Transitions to 'rejected'. */
  rejectProposal: () => void
  /** Start a new iteration (user wants to refine the description). */
  startIteration: () => void
  /** Reset the builder to idle state for a new session. */
  resetBuilder: () => void
  /** Track a template ID created by the builder. */
  trackCreatedTemplate: (templateId: string) => void
}

export type BuilderStore = BuilderState & BuilderActions

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_STATE: BuilderState = {
  panelOpen: false,
  session: null,
  createdTemplateIds: [],
}

// ============================================================================
// Store
// ============================================================================

export const useBuilderStore = create<BuilderStore>()(
  immer((set) => ({
    ...INITIAL_STATE,

    openBuilder: () =>
      set((state) => {
        state.panelOpen = true
        if (
          !state.session ||
          state.session.phase === 'accepted' ||
          state.session.phase === 'rejected'
        ) {
          state.session = {
            id: crypto.randomUUID(),
            startedAt: new Date().toISOString(),
            description: '',
            targetDistrictId: null,
            currentProposal: null,
            iterations: [],
            phase: 'idle',
          }
        }
      }),

    closeBuilder: () =>
      set((state) => {
        state.panelOpen = false
      }),

    setDescription: (description) =>
      set((state) => {
        if (state.session) {
          state.session.description = description
          if (description.trim().length > 0 && state.session.phase === 'idle') {
            state.session.phase = 'describing'
          }
          if (description.trim().length === 0 && state.session.phase === 'describing') {
            state.session.phase = 'idle'
          }
        }
      }),

    setTargetDistrict: (districtId) =>
      set((state) => {
        if (state.session) {
          state.session.targetDistrictId = districtId
        }
      }),

    startGenerating: () =>
      set((state) => {
        if (state.session) {
          state.session.phase = 'generating'
        }
      }),

    setProposal: (proposal) =>
      set((state) => {
        if (state.session) {
          state.session.currentProposal = proposal
          state.session.phase = 'reviewing'

          // Record this iteration.
          const iteration: BuilderIteration = {
            iterationNumber: state.session.iterations.length + 1,
            description: state.session.description,
            proposal,
            error: null,
            outcome: 'pending',
            timestamp: new Date().toISOString(),
          }
          ;(state.session.iterations as BuilderIteration[]).push(iteration)
        }
      }),

    setError: (error) =>
      set((state) => {
        if (state.session) {
          state.session.phase = 'error'

          // Record the failed iteration.
          const iteration: BuilderIteration = {
            iterationNumber: state.session.iterations.length + 1,
            description: state.session.description,
            proposal: null,
            error,
            outcome: 'error',
            timestamp: new Date().toISOString(),
          }
          ;(state.session.iterations as BuilderIteration[]).push(iteration)
        }
      }),

    acceptProposal: () =>
      set((state) => {
        if (state.session && state.session.iterations.length > 0) {
          state.session.phase = 'accepted'
          // Mark the last iteration as accepted.
          const lastIdx = state.session.iterations.length - 1
          ;(state.session.iterations as BuilderIteration[])[lastIdx] = {
            ...state.session.iterations[lastIdx],
            outcome: 'accepted',
          }
        }
      }),

    rejectProposal: () =>
      set((state) => {
        if (state.session && state.session.iterations.length > 0) {
          state.session.phase = 'rejected'
          // Mark the last iteration as rejected.
          const lastIdx = state.session.iterations.length - 1
          ;(state.session.iterations as BuilderIteration[])[lastIdx] = {
            ...state.session.iterations[lastIdx],
            outcome: 'rejected',
          }
        }
      }),

    startIteration: () =>
      set((state) => {
        if (state.session && state.session.iterations.length > 0) {
          // Mark the last iteration as iterated.
          const lastIdx = state.session.iterations.length - 1
          ;(state.session.iterations as BuilderIteration[])[lastIdx] = {
            ...state.session.iterations[lastIdx],
            outcome: 'iterated',
          }
          // Return to describing phase with the same description.
          state.session.phase = 'describing'
          state.session.currentProposal = null
        }
      }),

    resetBuilder: () =>
      set((state) => {
        state.session = null
        state.panelOpen = false
      }),

    trackCreatedTemplate: (templateId) =>
      set((state) => {
        state.createdTemplateIds.push(templateId)
      }),
  }))
)

// ============================================================================
// Selectors
// ============================================================================

export const builderSelectors = {
  /** Whether the builder panel is open. */
  isPanelOpen: (state: BuilderState): boolean => state.panelOpen,

  /** Whether a session is active and in a non-terminal phase. */
  isSessionActive: (state: BuilderState): boolean =>
    state.session !== null &&
    state.session.phase !== 'accepted' &&
    state.session.phase !== 'rejected',

  /** Whether Claude is currently generating a proposal. */
  isGenerating: (state: BuilderState): boolean => state.session?.phase === 'generating',

  /** Whether a proposal is ready for review. */
  hasProposal: (state: BuilderState): boolean =>
    state.session?.phase === 'reviewing' && state.session.currentProposal !== null,

  /** The current builder phase. */
  currentPhase: (state: BuilderState): BuilderPhase => state.session?.phase ?? 'idle',

  /** Number of iterations in the current session. */
  iterationCount: (state: BuilderState): number => state.session?.iterations.length ?? 0,

  /** Total templates created by the builder in this page session. */
  createdTemplateCount: (state: BuilderState): number => state.createdTemplateIds.length,

  /** Whether the user can submit (has description + district selected). */
  canSubmit: (state: BuilderState): boolean =>
    state.session !== null &&
    state.session.description.trim().length > 10 &&
    state.session.targetDistrictId !== null &&
    (state.session.phase === 'describing' || state.session.phase === 'error'),
}
```

### 4.7 Builder Receipt Generator -- `src/lib/ai/builder-receipt.ts`

Receipt generation for all Builder Mode actions.

```ts
/**
 * Builder Receipt Generator -- audit trail for Builder Mode actions.
 *
 * Generates receipts for:
 * - Session start (builder activated)
 * - Proposal generation (Claude called)
 * - Proposal accepted (template promoted to registry)
 * - Proposal rejected (user declined)
 * - Iteration start (user refining description)
 *
 * Every receipt includes the full AI metadata per AD-6:
 * prompt, reasoning, confidence, alternatives, provider, latency, modelId.
 *
 * References: AD-6 (Receipt System), WS-3.1 (ReceiptStore),
 * WS-3.4 (AI receipt pattern)
 */

import type { ReceiptStore, ReceiptInput, AIReceiptMetadata } from '@/lib/interfaces/receipt-store'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { BuilderSession, BuilderProposal } from './builder-types'

// ============================================================================
// Receipt Types
// ============================================================================

type BuilderAction =
  | 'builder-session-start'
  | 'builder-proposal-generated'
  | 'builder-proposal-accepted'
  | 'builder-proposal-rejected'
  | 'builder-iteration-start'
  | 'builder-generation-failed'

// ============================================================================
// Receipt Generation
// ============================================================================

/**
 * Record a receipt for a Builder Mode action.
 */
export async function recordBuilderReceipt(
  receiptStore: ReceiptStore,
  action: BuilderAction,
  session: BuilderSession,
  proposal: BuilderProposal | null,
  additionalDetail?: Record<string, unknown>
): Promise<void> {
  const aiMetadata: AIReceiptMetadata | undefined = proposal
    ? {
        prompt: proposal.prompt,
        reasoning: proposal.reasoning,
        confidence: proposal.confidence,
        alternativesConsidered: proposal.alternatives.map((alt) => alt),
        provider: 'claude',
        latencyMs: proposal.latencyMs,
        modelId: proposal.modelId,
      }
    : undefined

  const input: ReceiptInput = {
    eventType: resolveEventType(action),
    actor:
      action === 'builder-proposal-generated' || action === 'builder-generation-failed'
        ? 'ai'
        : 'human',
    severity: action === 'builder-generation-failed' ? 'warning' : 'info',
    summary: buildSummary(action, session, proposal),
    target: session.targetDistrictId
      ? {
          type: 'district',
          id: session.targetDistrictId,
          displayName: session.targetDistrictId,
        }
      : undefined,
    detail: {
      builderAction: action,
      sessionId: session.id,
      description: session.description,
      districtId: session.targetDistrictId,
      iterationNumber: session.iterations.length,
      templateId: proposal?.template.id ?? null,
      templateDisplayName: proposal?.template.displayName ?? null,
      templateBodyType: proposal?.template.layout.bodyType ?? null,
      ...additionalDetail,
    },
    aiMetadata,
  }

  await receiptStore.record(input)
}

// ============================================================================
// Helpers
// ============================================================================

function resolveEventType(action: BuilderAction): 'action' | 'system' | 'error' {
  switch (action) {
    case 'builder-session-start':
    case 'builder-proposal-accepted':
    case 'builder-proposal-rejected':
    case 'builder-iteration-start':
      return 'action'
    case 'builder-proposal-generated':
      return 'system'
    case 'builder-generation-failed':
      return 'error'
  }
}

function buildSummary(
  action: BuilderAction,
  session: BuilderSession,
  proposal: BuilderProposal | null
): string {
  switch (action) {
    case 'builder-session-start':
      return `Builder Mode activated. Target: ${session.targetDistrictId ?? 'not yet selected'}.`
    case 'builder-proposal-generated':
      return `Claude proposed "${proposal?.template.displayName}" (${proposal?.template.layout.bodyType}) with ${(proposal?.confidence ?? 0 * 100).toFixed(0)}% confidence.`
    case 'builder-proposal-accepted':
      return `Accepted station "${proposal?.template.displayName}" for ${session.targetDistrictId}. Template registered.`
    case 'builder-proposal-rejected':
      return `Rejected proposed station "${proposal?.template.displayName}".`
    case 'builder-iteration-start':
      return `Iterating on station description (iteration ${session.iterations.length + 1}).`
    case 'builder-generation-failed':
      return `Builder generation failed for "${session.description.slice(0, 60)}...".`
  }
}

/**
 * Shorthand functions for common builder receipt operations.
 */
export const builderReceipts = {
  sessionStart: (store: ReceiptStore, session: BuilderSession) =>
    recordBuilderReceipt(store, 'builder-session-start', session, null),

  proposalGenerated: (store: ReceiptStore, session: BuilderSession, proposal: BuilderProposal) =>
    recordBuilderReceipt(store, 'builder-proposal-generated', session, proposal),

  proposalAccepted: (store: ReceiptStore, session: BuilderSession, proposal: BuilderProposal) =>
    recordBuilderReceipt(store, 'builder-proposal-accepted', session, proposal),

  proposalRejected: (store: ReceiptStore, session: BuilderSession, proposal: BuilderProposal) =>
    recordBuilderReceipt(store, 'builder-proposal-rejected', session, proposal),

  iterationStart: (store: ReceiptStore, session: BuilderSession) =>
    recordBuilderReceipt(store, 'builder-iteration-start', session, null),

  generationFailed: (store: ReceiptStore, session: BuilderSession, error: string) =>
    recordBuilderReceipt(store, 'builder-generation-failed', session, null, { error }),
} as const
```

### 4.8 Builder Mode Orchestration Hook -- `src/hooks/use-builder-mode.ts`

Wires the store, generator, gate, and receipt system together.

```ts
/**
 * useBuilderMode -- orchestration hook for Builder Mode.
 *
 * Wires together:
 * - builder.store (session state)
 * - ai.store (provider status, beta toggle)
 * - auth.store (authentication check)
 * - StationProposalGenerator (Claude integration)
 * - DynamicStationTemplateRegistry (template promotion)
 * - ReceiptStore (audit trail)
 * - Builder gate (authorization)
 *
 * This hook is the single entry point for all Builder Mode operations.
 * Components consume this hook, not the individual modules.
 *
 * References: WS-3.4 (ai.store pattern), WS-3.5 (template registration)
 */

import { useCallback, useMemo, useRef } from 'react'
import { useBuilderStore, builderSelectors } from '@/stores/builder.store'
import { useAIStore, aiSelectors } from '@/stores/ai.store'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { AIRouter } from '@/lib/interfaces/ai-router'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { SystemStateProvider } from '@/lib/interfaces/system-state-provider'
import { checkBuilderGate, type BuilderGateInput } from '@/lib/ai/builder-gate'
import { StationProposalGenerator } from '@/lib/ai/station-proposal-generator'
import { builderReceipts } from '@/lib/ai/builder-receipt'
import type { BuilderGateResult } from '@/lib/ai/builder-types'

// ============================================================================
// Hook Input
// ============================================================================

export interface UseBuilderModeInput {
  readonly aiRouter: AIRouter
  readonly receiptStore: ReceiptStore
  readonly templateRegistry: StationTemplateRegistry
  readonly systemStateProvider: SystemStateProvider
}

// ============================================================================
// Hook Return
// ============================================================================

export interface UseBuilderModeReturn {
  // State
  readonly panelOpen: boolean
  readonly isGenerating: boolean
  readonly hasProposal: boolean
  readonly canSubmit: boolean
  readonly phase: string
  readonly session: ReturnType<typeof useBuilderStore.getState>['session']
  readonly iterationCount: number
  readonly createdCount: number

  // Gate
  readonly gateResult: BuilderGateResult

  // Actions
  readonly open: () => void
  readonly close: () => void
  readonly setDescription: (description: string) => void
  readonly setTargetDistrict: (districtId: AppIdentifier) => void
  readonly submit: () => Promise<void>
  readonly accept: () => Promise<void>
  readonly reject: () => Promise<void>
  readonly iterate: () => void
  readonly reset: () => void
}

// ============================================================================
// Hook
// ============================================================================

export function useBuilderMode(input: UseBuilderModeInput): UseBuilderModeReturn {
  const { aiRouter, receiptStore, templateRegistry, systemStateProvider } = input

  // Store state
  const panelOpen = useBuilderStore((s) => builderSelectors.isPanelOpen(s))
  const isGenerating = useBuilderStore((s) => builderSelectors.isGenerating(s))
  const hasProposal = useBuilderStore((s) => builderSelectors.hasProposal(s))
  const canSubmit = useBuilderStore((s) => builderSelectors.canSubmit(s))
  const phase = useBuilderStore((s) => builderSelectors.currentPhase(s))
  const session = useBuilderStore((s) => s.session)
  const iterationCount = useBuilderStore((s) => builderSelectors.iterationCount(s))
  const createdCount = useBuilderStore((s) => builderSelectors.createdTemplateCount(s))

  // AI store state
  const isAuthenticated = true // Simplified -- auth.store check
  const aiBetaEnabled = useAIStore((s) => aiSelectors.isAIAvailable(s))
  const claudeAvailable = useAIStore((s) => s.providerStatuses.claude?.available ?? false)

  // Builder store actions
  const storeActions = useBuilderStore()

  // Generator (stable reference)
  const generatorRef = useRef(new StationProposalGenerator())

  // Gate check
  const gateResult = useMemo((): BuilderGateResult => {
    const gateInput: BuilderGateInput = {
      isAuthenticated,
      aiBetaEnabled,
      claudeAvailable,
      currentPhase: phase as any,
    }
    return checkBuilderGate(gateInput)
  }, [isAuthenticated, aiBetaEnabled, claudeAvailable, phase])

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  const open = useCallback(() => {
    if (gateResult.allowed) {
      storeActions.openBuilder()
      const currentSession = useBuilderStore.getState().session
      if (currentSession) {
        builderReceipts.sessionStart(receiptStore, currentSession)
      }
    }
  }, [gateResult.allowed, receiptStore, storeActions])

  const close = useCallback(() => {
    storeActions.closeBuilder()
  }, [storeActions])

  const setDescription = useCallback(
    (description: string) => {
      storeActions.setDescription(description)
    },
    [storeActions]
  )

  const setTargetDistrict = useCallback(
    (districtId: AppIdentifier) => {
      storeActions.setTargetDistrict(districtId)
    },
    [storeActions]
  )

  const submit = useCallback(async () => {
    const currentSession = useBuilderStore.getState().session
    if (!currentSession || !currentSession.targetDistrictId) return
    if (!gateResult.allowed) return

    storeActions.startGenerating()

    const snapshot = systemStateProvider.getSnapshot()

    const result = await generatorRef.current.generate(
      currentSession.description,
      currentSession.targetDistrictId,
      currentSession.id,
      templateRegistry,
      snapshot,
      aiRouter,
      currentSession.iterations
    )

    if (result.success && result.proposal) {
      storeActions.setProposal(result.proposal)

      // Record AI cost.
      useAIStore.getState().recordAICost('claude', 'builder-mode')

      // Record receipt.
      const updatedSession = useBuilderStore.getState().session!
      await builderReceipts.proposalGenerated(receiptStore, updatedSession, result.proposal)
    } else {
      storeActions.setError(result.error ?? 'Unknown generation error.')

      const updatedSession = useBuilderStore.getState().session!
      await builderReceipts.generationFailed(
        receiptStore,
        updatedSession,
        result.error ?? 'Unknown error'
      )
    }
  }, [
    gateResult.allowed,
    storeActions,
    systemStateProvider,
    templateRegistry,
    aiRouter,
    receiptStore,
  ])

  const accept = useCallback(async () => {
    const currentSession = useBuilderStore.getState().session
    if (!currentSession?.currentProposal) return

    const proposal = currentSession.currentProposal

    // Promote template to registry.
    templateRegistry.registerTemplate(proposal.template)

    // Track in store.
    storeActions.acceptProposal()
    storeActions.trackCreatedTemplate(proposal.template.id)

    // Record receipt.
    const updatedSession = useBuilderStore.getState().session!
    await builderReceipts.proposalAccepted(receiptStore, updatedSession, proposal)
  }, [storeActions, templateRegistry, receiptStore])

  const reject = useCallback(async () => {
    const currentSession = useBuilderStore.getState().session
    if (!currentSession?.currentProposal) return

    const proposal = currentSession.currentProposal

    storeActions.rejectProposal()

    const updatedSession = useBuilderStore.getState().session!
    await builderReceipts.proposalRejected(receiptStore, updatedSession, proposal)
  }, [storeActions, receiptStore])

  const iterate = useCallback(() => {
    const currentSession = useBuilderStore.getState().session
    if (currentSession) {
      builderReceipts.iterationStart(receiptStore, currentSession)
    }
    storeActions.startIteration()
  }, [storeActions, receiptStore])

  const reset = useCallback(() => {
    storeActions.resetBuilder()
  }, [storeActions])

  return {
    panelOpen,
    isGenerating,
    hasProposal,
    canSubmit,
    phase,
    session,
    iterationCount,
    createdCount,
    gateResult,
    open,
    close,
    setDescription,
    setTargetDistrict,
    submit,
    accept,
    reject,
    iterate,
    reset,
  }
}
```

### 4.9 Builder Mode Activator -- `src/components/ai/BuilderModeActivator.tsx`

Keyboard shortcut listener that gates and activates Builder Mode.

```tsx
/**
 * BuilderModeActivator -- keyboard shortcut listener for Builder Mode.
 *
 * Renders nothing visible. Listens for Ctrl+Shift+B (Cmd+Shift+B on macOS)
 * and activates Builder Mode when the gate conditions are met.
 * Mount this component inside the hub layout.
 *
 * References: WS-4.3 builder-gate.ts, WS-3.4 (AI beta toggle pattern)
 */

'use client'

import { useEffect } from 'react'
import { isBuilderShortcut } from '@/lib/ai/builder-gate'
import type { UseBuilderModeReturn } from '@/hooks/use-builder-mode'

interface BuilderModeActivatorProps {
  readonly builder: UseBuilderModeReturn
}

export function BuilderModeActivator({ builder }: BuilderModeActivatorProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBuilderShortcut(event)) {
        event.preventDefault()

        if (builder.panelOpen) {
          builder.close()
        } else if (builder.gateResult.allowed) {
          builder.open()
        }
        // If gate is not allowed, silently ignore.
        // The shortcut is hidden -- users who don't know about it won't be confused.
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [builder])

  // This component renders nothing.
  return null
}
```

### 4.10 Builder Mode Panel -- `src/components/ai/BuilderModePanel.tsx`

The main Builder Mode UI. Glass-material slide-in panel with description input, district selector, proposal review, and accept/reject/iterate controls.

```tsx
/**
 * BuilderModePanel -- the main Builder Mode interface.
 *
 * Glass-material slide-in panel from the right side of the viewport.
 * Contains:
 * - District selector (which district to add the station to)
 * - Description textarea (natural language input)
 * - Submit button (sends to Claude)
 * - Proposal preview (live station rendering)
 * - Accept / Reject / Iterate controls
 * - Iteration history (collapsible)
 * - Gate status indicators
 *
 * Styling: Oblivion glass material per VISUAL-DESIGN-SPEC.md Section 1.7.
 * Animations: motion/react for slide-in/out.
 *
 * References: VISUAL-DESIGN-SPEC.md (glass-strong recipe), WS-2.6 (StationPanel),
 * WS-3.5 (template browser styling precedent)
 */

'use client'

import { AnimatePresence, motion } from 'motion/react'
import {
  Wand2,
  X,
  Check,
  RefreshCw,
  Sparkles,
  Loader,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@tarva/ui'
import { ScrollArea } from '@tarva/ui'
import { Badge } from '@tarva/ui'
import { Tooltip } from '@tarva/ui'
import type { AppIdentifier } from '@/lib/interfaces/types'
import { ALL_APP_IDS, APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type { UseBuilderModeReturn } from '@/hooks/use-builder-mode'
import { StationProposalPreview } from './StationProposalPreview'
import { BuilderIterationHistory } from './BuilderIterationHistory'
import { BUILDER_SHORTCUT } from '@/lib/ai/builder-gate'

// ============================================================================
// Props
// ============================================================================

interface BuilderModePanelProps {
  readonly builder: UseBuilderModeReturn
}

// ============================================================================
// Component
// ============================================================================

export function BuilderModePanel({ builder }: BuilderModePanelProps) {
  const { session, phase, gateResult } = builder

  return (
    <AnimatePresence>
      {builder.panelOpen && (
        <motion.div
          className="fixed inset-y-0 right-0 z-50 flex w-[480px] flex-col"
          initial={{ x: 480, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 480, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: 'rgba(15, 22, 31, 0.80)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04), -8px 0 32px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(224, 82, 0, 0.15)',
                  boxShadow: '0 0 12px rgba(224, 82, 0, 0.08)',
                }}
              >
                <Wand2 className="h-4 w-4 text-[#ff773c]" />
              </div>
              <div>
                <h2
                  className="text-sm font-medium tracking-wide"
                  style={{ color: 'var(--color-text-primary, #def6ff)' }}
                >
                  STATION BUILDER
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary, #55667a)' }}>
                  Powered by Claude
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip content={`Close (${BUILDER_SHORTCUT.display})`}>
                <Button variant="ghost" size="icon" onClick={builder.close} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Body */}
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-6 p-6">
              {/* District Selector */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-medium tracking-widest uppercase"
                  style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                >
                  Target District
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_APP_IDS.map((id: AppIdentifier) => (
                    <button
                      key={id}
                      onClick={() => builder.setTargetDistrict(id)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150"
                      style={{
                        background:
                          session?.targetDistrictId === id
                            ? 'rgba(224, 82, 0, 0.2)'
                            : 'rgba(255, 255, 255, 0.03)',
                        border:
                          session?.targetDistrictId === id
                            ? '1px solid rgba(224, 82, 0, 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                        color:
                          session?.targetDistrictId === id
                            ? '#ff773c'
                            : 'var(--color-text-secondary, #92a9b4)',
                      }}
                    >
                      {APP_DISPLAY_NAMES[id] ?? id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-medium tracking-widest uppercase"
                  style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                >
                  Describe Your Station
                </label>
                <textarea
                  value={session?.description ?? ''}
                  onChange={(e) => builder.setDescription(e.target.value)}
                  placeholder="e.g., Show me a station that displays build pipeline status as a table with run name, duration, and result columns..."
                  disabled={phase === 'generating' || phase === 'accepted'}
                  rows={4}
                  className="resize-none rounded-lg px-4 py-3 text-sm transition-all duration-150 placeholder:text-[#33445a] focus:ring-1 focus:ring-[#ff773c]/40 focus:outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: 'var(--color-text-primary, #def6ff)',
                    fontFamily: 'var(--font-geist-sans)',
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
                    {(session?.description ?? '').length} chars
                  </span>
                  {builder.iterationCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Iteration {builder.iterationCount + 1}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              {(phase === 'describing' || phase === 'idle' || phase === 'error') && (
                <Button
                  onClick={builder.submit}
                  disabled={!builder.canSubmit}
                  className="w-full"
                  style={{
                    background: builder.canSubmit
                      ? 'rgba(224, 82, 0, 0.8)'
                      : 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Station
                </Button>
              )}

              {/* Generating State */}
              {phase === 'generating' && (
                <div
                  className="flex flex-col items-center gap-3 rounded-lg px-6 py-8"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <Loader className="h-6 w-6 animate-spin" style={{ color: '#ff773c' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary, #92a9b4)' }}>
                    Claude is designing your station...
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary, #55667a)' }}>
                    This typically takes 3-8 seconds
                  </p>
                </div>
              )}

              {/* Error State */}
              {phase === 'error' && session?.iterations.length && (
                <div
                  className="flex items-start gap-3 rounded-lg px-4 py-3"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]" />
                  <div>
                    <p className="text-sm text-[#f87171]">Generation Failed</p>
                    <p className="mt-1 text-xs text-[#ef4444]/70">
                      {session.iterations[session.iterations.length - 1]?.error ??
                        'Unknown error. Try rephrasing your description.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Proposal Preview */}
              {phase === 'reviewing' && session?.currentProposal && (
                <div className="flex flex-col gap-4">
                  {/* Confidence Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-medium tracking-widest uppercase"
                      style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                    >
                      Proposed Station
                    </span>
                    <Badge
                      variant={session.currentProposal.confidence >= 0.7 ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {Math.round(session.currentProposal.confidence * 100)}% confidence
                    </Badge>
                  </div>

                  {/* Live Preview */}
                  <StationProposalPreview template={session.currentProposal.template} />

                  {/* Claude's Reasoning */}
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <p
                      className="mb-1 text-xs font-medium tracking-widest uppercase"
                      style={{ color: 'var(--color-text-tertiary, #55667a)' }}
                    >
                      Claude's Reasoning
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                    >
                      {session.currentProposal.reasoning}
                    </p>
                  </div>

                  {/* Alternatives */}
                  {session.currentProposal.alternatives.length > 0 && (
                    <div
                      className="rounded-lg px-4 py-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                      }}
                    >
                      <p
                        className="mb-2 text-xs font-medium tracking-widest uppercase"
                        style={{ color: 'var(--color-text-tertiary, #55667a)' }}
                      >
                        Alternatives Considered
                      </p>
                      {session.currentProposal.alternatives.map((alt, i) => (
                        <div key={i} className="flex items-start gap-2 py-1">
                          <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-[#55667a]" />
                          <p className="text-xs text-[#92a9b4]">{alt}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Accept / Reject / Iterate */}
                  <div className="flex gap-3">
                    <Button
                      onClick={builder.accept}
                      className="flex-1"
                      style={{ background: 'rgba(34, 197, 94, 0.6)' }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button onClick={builder.iterate} variant="outline" className="flex-1">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Iterate
                    </Button>
                    <Button onClick={builder.reject} variant="ghost" className="flex-1">
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Accepted State */}
              {phase === 'accepted' && session?.currentProposal && (
                <div
                  className="flex flex-col items-center gap-3 rounded-lg px-6 py-8"
                  style={{
                    background: 'rgba(34, 197, 94, 0.06)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                  }}
                >
                  <Check className="h-8 w-8 text-[#22c55e]" />
                  <p className="text-sm font-medium text-[#4ade80]">Station Created</p>
                  <p className="text-center text-xs text-[#22c55e]/70">
                    "{session.currentProposal.template.displayName}" has been added to{' '}
                    {session.targetDistrictId}. It will appear in the station panel for this
                    session.
                  </p>
                  <Button onClick={builder.reset} variant="outline" className="mt-2">
                    Build Another
                  </Button>
                </div>
              )}

              {/* Iteration History */}
              {session && session.iterations.length > 1 && (
                <BuilderIterationHistory iterations={session.iterations} />
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3">
            <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
              Session: {session?.id.slice(0, 8) ?? '--'}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
              {builder.createdCount} station{builder.createdCount !== 1 ? 's' : ''} created
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

### 4.11 Station Proposal Preview -- `src/components/ai/StationProposalPreview.tsx`

Renders the proposed station template using the existing station panel framework in a sandboxed preview container.

```tsx
/**
 * StationProposalPreview -- renders a proposed StationTemplate.
 *
 * Uses the WS-2.6 StationPanel component to render the proposed template
 * with the same visual treatment as live stations. Wrapped in a scale-down
 * container to fit within the builder panel width.
 *
 * The preview is read-only -- action buttons are disabled (they display
 * but do not execute commands). This prevents side effects during review.
 *
 * References: WS-2.6 (StationPanel), VISUAL-DESIGN-SPEC.md (glass material)
 */

'use client'

import { Eye } from 'lucide-react'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Props
// ============================================================================

interface StationProposalPreviewProps {
  readonly template: StationTemplate
}

// ============================================================================
// Component
// ============================================================================

export function StationProposalPreview({ template }: StationProposalPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Preview Label */}
      <div className="flex items-center gap-2">
        <Eye className="h-3 w-3 text-[#55667a]" />
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: 'var(--color-text-tertiary, #55667a)' }}
        >
          Live Preview
        </span>
      </div>

      {/* Preview Container */}
      <div
        className="overflow-hidden rounded-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px) saturate(120%)',
          WebkitBackdropFilter: 'blur(12px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
        }}
      >
        {/* Station Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3">
          {template.layout.header.icon && (
            <span className="text-xs" style={{ color: 'var(--color-ember-bright, #ff773c)' }}>
              {template.layout.header.icon}
            </span>
          )}
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary, #def6ff)' }}
          >
            {template.layout.header.title}
          </span>
        </div>

        {/* Station Body (preview representation) */}
        <div className="px-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-xs"
                style={{
                  background: 'rgba(39, 115, 137, 0.15)',
                  color: '#3a99b8',
                  border: '1px solid rgba(39, 115, 137, 0.3)',
                }}
              >
                {template.layout.bodyType}
              </span>
              <span
                className="rounded-md px-2 py-0.5 text-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--color-text-tertiary, #55667a)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                {template.category}
              </span>
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
            >
              {template.description}
            </p>

            {/* Body Type Placeholder */}
            <div
              className="mt-2 flex h-24 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.015)',
                border: '1px dashed rgba(255, 255, 255, 0.06)',
              }}
            >
              <span
                className="text-xs italic"
                style={{ color: 'var(--color-text-ghost, #2a3545)' }}
              >
                {template.layout.bodyType} content renders here at runtime
              </span>
            </div>
          </div>
        </div>

        {/* Station Actions */}
        {template.layout.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-white/[0.04] px-4 py-3">
            {template.layout.actions.map((action) => (
              <button
                key={action.id}
                disabled
                className="cursor-not-allowed rounded-md px-3 py-1.5 text-xs font-medium opacity-60"
                style={{
                  background:
                    action.variant === 'default'
                      ? 'rgba(224, 82, 0, 0.3)'
                      : action.variant === 'destructive'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'var(--color-text-secondary, #92a9b4)',
                }}
              >
                {action.icon && <span className="mr-1.5">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Trigger Conditions (if any) */}
        {template.triggers.length > 0 && (
          <div className="border-t border-white/[0.04] px-4 py-3">
            <p
              className="mb-2 text-xs font-medium tracking-widest uppercase"
              style={{ color: 'var(--color-text-ghost, #2a3545)' }}
            >
              Trigger Conditions
            </p>
            {template.triggers.map((trigger, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span className="font-mono text-xs" style={{ color: 'var(--color-teal, #277389)' }}>
                  {trigger.field}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
                  {trigger.operator}
                </span>
                <span
                  className="font-mono text-xs"
                  style={{ color: 'var(--color-text-tertiary, #55667a)' }}
                >
                  {JSON.stringify(trigger.value)}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
                  (w: {trigger.weight})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 4.12 Builder Iteration History -- `src/components/ai/BuilderIterationHistory.tsx`

Collapsible timeline of previous iterations in the current session.

```tsx
/**
 * BuilderIterationHistory -- collapsible timeline of builder iterations.
 *
 * Shows a chronological list of description/proposal pairs from the
 * current session. Each iteration shows the description, outcome
 * (accepted/rejected/iterated/error), and the proposed template name.
 *
 * References: WS-3.2 (Evidence Ledger timeline pattern)
 */

'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, Check, X, RefreshCw, AlertCircle } from 'lucide-react'
import type { BuilderIteration } from '@/lib/ai/builder-types'

// ============================================================================
// Props
// ============================================================================

interface BuilderIterationHistoryProps {
  readonly iterations: readonly BuilderIteration[]
}

// ============================================================================
// Component
// ============================================================================

export function BuilderIterationHistory({ iterations }: BuilderIterationHistoryProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight className="h-3 w-3 text-[#55667a]" />
        </motion.div>
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: 'var(--color-text-tertiary, #55667a)' }}
        >
          Iteration History ({iterations.length})
        </span>
      </button>

      {/* Timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-4 pb-4">
              {iterations.map((iter) => (
                <div
                  key={iter.iterationNumber}
                  className="flex items-start gap-3 rounded-md px-3 py-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                >
                  {/* Outcome Icon */}
                  <div className="mt-0.5">
                    {iter.outcome === 'accepted' && <Check className="h-3 w-3 text-[#22c55e]" />}
                    {iter.outcome === 'rejected' && <X className="h-3 w-3 text-[#ef4444]" />}
                    {iter.outcome === 'iterated' && (
                      <RefreshCw className="h-3 w-3 text-[#ff773c]" />
                    )}
                    {iter.outcome === 'error' && <AlertCircle className="h-3 w-3 text-[#ef4444]" />}
                    {iter.outcome === 'pending' && (
                      <ChevronRight className="h-3 w-3 text-[#55667a]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p
                      className="text-xs"
                      style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                    >
                      #{iter.iterationNumber}: "{iter.description.slice(0, 80)}
                      {iter.description.length > 80 ? '...' : ''}"
                    </p>
                    {iter.proposal && (
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: 'var(--color-text-tertiary, #55667a)' }}
                      >
                        Proposed: {iter.proposal.template.displayName} (
                        {iter.proposal.template.layout.bodyType})
                      </p>
                    )}
                    {iter.error && (
                      <p className="mt-0.5 text-xs text-[#ef4444]/70">{iter.error.slice(0, 100)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

---

## 5. Acceptance Criteria

| ID    | Criterion                                                                                                                                                                                                                           | Verification Method                                                                                                                                          |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Builder Mode activates on `Ctrl+Shift+B` (macOS: `Cmd+Shift+B`) when all gate conditions are met (authenticated, AI beta on, Claude available)                                                                                      | Functional test: enable all conditions, press shortcut, verify panel opens                                                                                   |
| AC-2  | Builder Mode does NOT activate when Claude provider is unavailable -- shortcut is silently ignored                                                                                                                                  | Functional test: set `providerStatuses.claude.available = false`, press shortcut, verify no panel                                                            |
| AC-3  | Builder Mode does NOT activate when AI beta toggle is off                                                                                                                                                                           | Functional test: set `betaEnabled = false`, press shortcut, verify no panel                                                                                  |
| AC-4  | `StationProposalGenerator.generate()` routes to Claude via `AIRouter.route()` with `feature: 'builder-mode'`                                                                                                                        | Unit test: mock AIRouter, call `generate()`, assert `route()` called with correct feature                                                                    |
| AC-5  | Claude's response is validated against the Zod schema -- invalid JSON, missing fields, invalid bodyType, and unknown icons are all caught with descriptive errors                                                                   | Unit test: pass malformed JSON, invalid bodyType, unknown icon name to `validateProposalResponse()`; assert `valid === false` with meaningful error messages |
| AC-6  | Valid Claude response is transformed into a correctly-typed `StationTemplate` with `disposable: true`, `category: 'app-specific'`, and a generated ID matching `builder--{name}--{sessionId}-{timestamp}`                           | Unit test: pass valid JSON; assert template fields match expected values                                                                                     |
| AC-7  | Accepting a proposal calls `DynamicStationTemplateRegistry.registerTemplate()` with the proposed template                                                                                                                           | Integration test: mock registry, accept proposal, verify `registerTemplate()` called with correct template                                                   |
| AC-8  | All 6 builder actions (session-start, proposal-generated, proposal-accepted, proposal-rejected, iteration-start, generation-failed) generate receipts via `ReceiptStore.record()` with correct `eventType`, `actor`, and `severity` | Unit test: mock ReceiptStore, execute each action, assert `record()` called with expected fields                                                             |
| AC-9  | AI receipts include `AIReceiptMetadata` fields: `prompt`, `reasoning`, `confidence`, `alternativesConsidered`, `provider` (`'claude'`), `latencyMs`, `modelId`                                                                      | Unit test: inspect receipt passed to `ReceiptStore.record()` after proposal generation; assert all 7 metadata fields are present                             |
| AC-10 | Builder store phase transitions follow the state machine: `idle -> describing -> generating -> reviewing -> (accepted                                                                                                               | iterate                                                                                                                                                      | reject)`with`iterate`looping back to`describing` | Unit test: execute each transition, assert valid phase changes; attempt invalid transitions, verify they are ignored |
| AC-11 | The builder panel renders with glass-strong material (backdrop-filter blur 24px, background rgba(15,22,31,0.80), 1px border rgba(255,255,255,0.08))                                                                                 | Visual inspection; computed style assertion on panel element                                                                                                 |
| AC-12 | The builder panel slides in from the right with spring animation on open and slides out on close                                                                                                                                    | Visual test: open/close builder, verify animation direction and spring physics                                                                               |
| AC-13 | The description textarea is disabled during the `generating` phase and after `accepted`                                                                                                                                             | Functional test: enter generating state, verify textarea has `disabled` attribute                                                                            |
| AC-14 | The proposal preview renders the template header (title, icon), body type badge, description, action buttons (disabled), and trigger conditions                                                                                     | Render test: pass a template with all fields populated, verify all elements render                                                                           |
| AC-15 | Iteration history shows all previous iterations with outcome icons (check for accepted, X for rejected, refresh for iterated, alert for error)                                                                                      | Render test: pass 3 iterations with different outcomes, verify correct icons                                                                                 |
| AC-16 | The Claude prompt includes template catalog context: body types, action patterns, available icons, and existing templates for the target district                                                                                   | Unit test: inspect the prompt string from `StationProposalGenerator`; assert it contains all vocabulary sections                                             |
| AC-17 | Previous iteration context is included in the Claude prompt when iterating, so Claude can improve on prior attempts                                                                                                                 | Unit test: generate with 2 prior iterations, inspect prompt, verify "Previous Iterations" section with descriptions and outcomes                             |
| AC-18 | Session cost is tracked: `useAIStore.recordAICost('claude', 'builder-mode')` is called after each successful Claude call                                                                                                            | Unit test: mock AI store, call submit, verify `recordAICost` called                                                                                          |
| AC-19 | Created template IDs are tracked in `builder.store.createdTemplateIds` for the page session                                                                                                                                         | Unit test: accept a proposal, verify template ID appears in `createdTemplateIds`                                                                             |
| AC-20 | The Zod schema constrains bodyType to exactly `['metrics', 'list', 'table', 'chart', 'log', 'status', 'empty']` -- no other values pass validation                                                                                  | Unit test: submit `bodyType: 'custom'`, assert validation failure                                                                                            |
| AC-21 | The Zod schema constrains icons to the ALLOWED_ICONS list -- unknown icon names are rejected                                                                                                                                        | Unit test: submit `icon: 'FakeIcon'`, assert validation failure                                                                                              |
| AC-22 | Maximum 4 actions per station, maximum 5 trigger conditions -- exceeding limits fails validation                                                                                                                                    | Unit test: submit 5 actions and 6 triggers, assert validation failures                                                                                       |
| AC-23 | Builder Mode is accessible via hidden command palette entry: typing `"builder"` or `"build station"` activates Builder Mode                                                                                                         | Functional test: open command palette, type `"builder"`, verify Builder Mode activates (if gate allows)                                                      |
| AC-24 | All TypeScript types use `readonly` on properties; no `any` types in public API; `pnpm typecheck` passes with zero errors                                                                                                           | Build verification: `pnpm tsc --noEmit` returns 0 errors                                                                                                     |

---

## 6. Decisions Made

| ID   | Decision                                                                                                     | Rationale                                                                                                                                                                                                                                                                                                    | Source                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| D-1  | Builder Mode is Claude-only with no fallback                                                                 | Novel station layout generation from unconstrained natural language requires strong reasoning capabilities. Ollama models cannot reliably produce valid StationTemplate JSON from arbitrary descriptions. Per tech-decisions.md: `ai-builder-mode: Claude primary, no fallback (requires strong reasoning)`. | tech-decisions.md routing table                                  |
| D-2  | Claude selects from template vocabulary, not arbitrary React                                                 | Safety contract from WS-3.5 and combined-recommendations.md Deferred Item #6. The Zod schema constrains bodyType, icons, action variants, and trigger operators to known values. The station panel framework (WS-2.6) renders the result. No executable code is accepted from the AI.                        | AD-7, combined-recommendations.md Deferred Item #6               |
| D-3  | Hidden activation via `Ctrl+Shift+B` keyboard shortcut                                                       | Builder Mode is for authorized users, not the general audience. A hidden shortcut keeps it discoverable to those who know about it without cluttering the UI. The command palette also has a hidden entry for discoverability.                                                                               | combined-recommendations.md ("hidden mode for authorized users") |
| D-4  | Created templates are session-scoped (not persisted to Supabase)                                             | Phase 4 scope. Session-only creation aligns with the "disposable" philosophy (combined-recommendations.md). Templates are marked `disposable: true`. Supabase persistence is a Phase 5+ concern that requires schema changes in WS-3.1.                                                                      | Phase 4 scope, combined-recommendations.md "disposable stations" |
| D-5  | Builder store is a separate Zustand store (not merged into ai.store)                                         | Builder Mode has distinct lifecycle state (session, iterations, proposals) that would bloat ai.store. Separation follows the ecosystem pattern of purpose-scoped stores (camera, districts, ui, auth, ai).                                                                                                   | tech-decisions.md (Zustand Store Slices)                         |
| D-6  | Claude prompt includes the full template catalog context (body types, actions, icons, existing templates)    | Claude needs to know what vocabulary is available to produce valid configurations. Including existing templates for the target district helps Claude avoid duplication and understand the current station set. The prompt stays under 4000 tokens.                                                           | AD-7 (AI context assembly), WS-3.4 (context assembler pattern)   |
| D-7  | Iteration history is included in the Claude prompt for refinement context                                    | When a user iterates (rephrases after a rejected proposal), Claude should know what was previously proposed and why it was rejected. This enables progressive refinement without requiring the user to re-describe the full context.                                                                         | UX quality (progressive refinement)                              |
| D-8  | Proposal preview is a read-only rendering with disabled action buttons                                       | Prevents side effects during review. Action commands (e.g., "open agent-builder") should not execute in preview. The user must explicitly accept the proposal before the template becomes active.                                                                                                            | Safety (preview is non-destructive)                              |
| D-9  | `motion/react` (not `framer-motion`) for panel animations                                                    | Per project constraint: `motion/react` is the current package name for Framer Motion v12+. Using `framer-motion` import would fail.                                                                                                                                                                          | tech-decisions.md, project constraints                           |
| D-10 | Generator timeout is 30 seconds (vs 10s for Camera Director Ollama calls)                                    | Claude API calls over the network have higher baseline latency than local Ollama. 30 seconds accommodates typical Claude response times (3-8s) with headroom for network variance. The UI shows a clear loading state with expected timing.                                                                  | Performance observation, Claude API characteristics              |
| D-11 | Builder gate checks 4 conditions: authenticated, AI beta enabled, Claude available, not currently generating | Each condition addresses a different failure mode. Authentication prevents anonymous access. AI beta prevents accidental activation. Claude availability prevents futile attempts. The generating check prevents double-submission.                                                                          | Defense in depth                                                 |

---

## 7. Open Questions

| #    | Question                                                                                                                                                                                                                     | Impact                                                                                                                                                     | Owner       | Resolution Deadline             |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------- |
| OQ-1 | Should created templates survive page refresh via `localStorage` serialization, or is true session-only (cleared on refresh) the right Phase 4 behavior?                                                                     | Medium -- localStorage persistence is simple to add and would prevent loss of builder work. But it adds complexity around stale template cleanup.          | Stakeholder | Before implementation begins    |
| OQ-2 | What is the Claude model ID for Builder Mode? `claude-sonnet-4-20250514` (faster, cheaper) or `claude-opus-4-20250514` (stronger reasoning)? WS-4.1 may define the default, but Builder Mode could override.                 | Medium -- affects generation quality and cost. Sonnet is likely sufficient for constrained template generation. Opus is better for ambiguous descriptions. | Architect   | WS-4.1 (Claude API integration) |
| OQ-3 | Should the builder panel be a slide-in panel (current design) or a full-screen modal? The template browser (WS-3.5) uses a Dialog modal, which could be inconsistent.                                                        | Low -- UX preference. Slide-in feels more integrated with the spatial canvas (you can still see the districts). Modal would be more focused.               | UX Designer | Before implementation begins    |
| OQ-4 | Should Builder Mode have a rate limit? The Camera Director limits Ollama to 1 call/3s. Claude calls have real monetary cost. A reasonable limit might be 1 call/10s or 5 calls/minute.                                       | Medium -- prevents accidental cost spikes. But Builder Mode is already gated behind multiple conditions. Over-limiting harms UX.                           | Architect   | WS-4.1 (cost controls)          |
| OQ-5 | Should the user be able to select a district AFTER seeing the proposal (i.e., Claude generates a generic template and then the user assigns it to a district)? Current design requires district selection before generation. | Low -- pre-selection gives Claude district context for better proposals. Post-selection is more flexible but loses context.                                | UX Designer | Before implementation begins    |
| OQ-6 | Should the command palette "builder" command be visible to all users (with a lock icon if gate conditions aren't met) or completely hidden until all conditions are met?                                                     | Low -- visible-but-locked is more discoverable but may confuse users without Claude configured. Hidden is cleaner but harder to discover.                  | UX Designer | Before implementation begins    |

---

## 8. Risk Register

| ID  | Risk                                                                                                                                                        | Likelihood | Impact | Severity | Mitigation                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | Claude returns valid JSON that passes Zod validation but produces a semantically nonsensical station (e.g., "Build Pipeline" station with bodyType "empty") | Medium     | Low    | Low      | The Zod schema constrains structure but not semantic quality. The preview rendering makes nonsensical proposals visually obvious. The user can reject and iterate. Claude's reasoning field explains the choice, helping the user understand and rephrase.            |
| R-2 | Claude API key is not configured, making Builder Mode permanently inaccessible                                                                              | Medium     | Medium | Medium   | The builder gate clearly communicates "Claude API key required." WS-4.1 handles API key configuration. Builder Mode is explicitly a stretch feature (Phase 4) -- the Launch works fully without it.                                                                   |
| R-3 | Claude API latency exceeds 30 seconds, causing timeout                                                                                                      | Low        | Medium | Low      | The 30-second timeout is generous. The generating UI shows clear feedback ("typically 3-8 seconds"). On timeout, the error state invites rephrasing. The user can also close and reopen the builder.                                                                  |
| R-4 | Claude generates trigger conditions with invalid dot-paths that don't resolve against the actual SystemSnapshot structure                                   | Medium     | Low    | Low      | Invalid triggers cause the template to score 0.0 on trigger conditions (per WS-3.5 trigger evaluator -- returns false, never throws). The template still appears in the district based on priority. The preview shows trigger conditions so the user can spot issues. |
| R-5 | Session-only template storage means all builder work is lost on page refresh                                                                                | High       | Medium | Medium   | This is by design for Phase 4 (Decision D-4). The receipt audit trail preserves the interaction history in Supabase. OQ-1 proposes localStorage as a simple persistence upgrade.                                                                                      |
| R-6 | Builder Mode adds Claude API cost that the user may not be aware of                                                                                         | Medium     | Low    | Low      | Session cost is tracked in `ai.store.sessionCost`. WS-4.1 implements cost display. Builder Mode calls `recordAICost()` on every Claude call. The builder panel footer shows session stats.                                                                            |
| R-7 | The Zod ALLOWED_ICONS list becomes stale if new Lucide icons are added to the project                                                                       | Low        | Low    | Low      | The list is a static snapshot. If new icons are needed, the list is updated in a patch. Claude will suggest icons from its training data that may not be in the list -- the validation catches this and the user can rephrase.                                        |
| R-8 | Multiple rapid submissions overwhelm the Claude API or generate excessive receipts                                                                          | Low        | Low    | Low      | The builder gate blocks submission during the `generating` phase (only one in-flight request per session). The submit button is disabled during generation. OQ-4 proposes an additional rate limit.                                                                   |

---

## 9. Implementation Checklist

Ordered by dependency. Each item should be a single, testable commit.

- [ ] 1. Create file structure: `src/lib/ai/builder-types.ts`, `src/lib/ai/builder-proposal-schema.ts`, `src/lib/ai/station-proposal-generator.ts`, `src/lib/ai/builder-gate.ts`, `src/lib/ai/builder-receipt.ts`, `src/stores/builder.store.ts`, `src/hooks/use-builder-mode.ts`, `src/components/ai/BuilderModePanel.tsx`, `src/components/ai/StationProposalPreview.tsx`, `src/components/ai/BuilderModeActivator.tsx`, `src/components/ai/BuilderIterationHistory.tsx`.
- [ ] 2. Write `src/lib/ai/builder-types.ts` with all Builder Mode types. (Deliverable 4.2)
- [ ] 3. Implement `src/lib/ai/builder-proposal-schema.ts` with Zod schemas, `validateProposalResponse()`, and `getAllowedVocabulary()`. (Deliverable 4.3)
- [ ] 4. Write unit tests for proposal schema: valid JSON, invalid JSON, missing fields, invalid bodyType, invalid icon, max actions, max triggers, template ID generation, `sanitizeName()`.
- [ ] 5. Implement `src/lib/ai/station-proposal-generator.ts` with catalog context builder, prompt assembler, and `generate()` method. (Deliverable 4.4)
- [ ] 6. Write unit tests for proposal generator: prompt contains vocabulary sections, prompt includes iteration history, mock AIRouter returns proposal, handles AIRouter failure.
- [ ] 7. Implement `src/lib/ai/builder-gate.ts` with `checkBuilderGate()` and `isBuilderShortcut()`. (Deliverable 4.5)
- [ ] 8. Write unit tests for builder gate: all conditions met = allowed, each condition failed individually = blocked with correct reason, keyboard shortcut detection.
- [ ] 9. Implement `src/stores/builder.store.ts` with all state and actions. (Deliverable 4.6)
- [ ] 10. Write unit tests for builder store: phase transitions, iteration recording, proposal acceptance, reset behavior, selectors.
- [ ] 11. Implement `src/lib/ai/builder-receipt.ts` with `recordBuilderReceipt()` and `builderReceipts` shorthand functions. (Deliverable 4.7)
- [ ] 12. Write unit tests for builder receipts: each action type generates correct receipt fields, AI metadata is populated for proposal-generated receipts.
- [ ] 13. Implement `src/hooks/use-builder-mode.ts` orchestration hook. (Deliverable 4.8)
- [ ] 14. Implement `src/components/ai/BuilderModeActivator.tsx` keyboard shortcut listener. (Deliverable 4.9)
- [ ] 15. Implement `src/components/ai/StationProposalPreview.tsx` with template preview rendering. (Deliverable 4.11)
- [ ] 16. Implement `src/components/ai/BuilderIterationHistory.tsx` with collapsible iteration timeline. (Deliverable 4.12)
- [ ] 17. Implement `src/components/ai/BuilderModePanel.tsx` with full builder UI. (Deliverable 4.10)
- [ ] 18. Wire `BuilderModeActivator` into the hub layout.
- [ ] 19. Register hidden `"builder"` / `"build station"` command in the command palette (WS-3.3 integration).
- [ ] 20. Run `pnpm typecheck` -- verify zero errors across all new files.
- [ ] 21. Run `pnpm lint` -- verify zero errors.
- [ ] 22. Run `pnpm format` to normalize all files.
- [ ] 23. Commit with message: `"feat: implement Builder Mode with Claude-powered station proposal generation (WS-4.3)"`
