# WS-3.5: Station Template Selection

> **Workstream ID:** WS-3.5
> **Phase:** 3 -- Receipts + Command Palette + AI
> **Assigned Agent:** `world-class-autonomous-interface-architect`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.7 (StationTemplateRegistry interface, TriggerCondition types), WS-1.5 (SystemStateProvider / SystemSnapshot), WS-2.6 (Station Panel Framework), WS-3.1 (ReceiptStore for audit trail)
> **Blocks:** WS-3.7 (Attention Choreography -- consumes template selection signals), WS-4.2 (Exception Triage -- uses template selection for recovery UI), WS-4.3 (Builder Mode -- extends template registry with user-proposed templates)
> **Resolves:** AD-7 interface #4 Phase 3 upgrade (StationTemplateRegistry: static defaults -> dynamic selection), combined-recommendations.md "Station template selection" work area

---

## 1. Objective

Replace the Phase 1 `StaticStationTemplateRegistry` (which returns hardcoded station lists per AD-8) with a `DynamicStationTemplateRegistry` that evaluates `TriggerCondition[]` against a live `SystemSnapshot`, scores every template, selects the top 3-5 most relevant stations per district, and generates an auditable receipt for every selection decision. Provide a template browser UI for manual override.

The rule engine is the primary selection mechanism. LLM tie-breaking (via `AIRouter` with provider `ollama`) is the fallback -- only invoked when two or more templates score within a configurable threshold of each other. This follows AD-7's routing table: `station-template-selection: primary=rule-engine, fallback=ollama`.

The safety contract is absolute: AI selects from pre-built templates, never generates React at runtime. Templates are configuration objects (`StationTemplate`), not components. The rendering layer (WS-2.6) maps `bodyType` to React components. This separation ensures that even a rogue LLM response cannot inject executable code.

**Success looks like:** A user zooms into the Agent Builder district. The system evaluates trigger conditions against the current `SystemSnapshot` (e.g., `apps.agent-builder.alertCount > 0`, `apps.agent-builder.health == 'DEGRADED'`). Instead of always showing Launch + Status + Pipeline + Library, it promotes a Diagnostics template to the visible set because alerts are active. The selection decision is recorded as a receipt with the score breakdown, alternatives considered, and the winning template set. The user can open the template browser, see the scores, and pin a different template to override the automatic selection.

**Traceability:** AD-7 (AI Integration Architecture, interface #4), AD-8 (Station Content per District), tech-decisions.md (Feature-by-Feature AI Routing: station-template-selection row), combined-recommendations.md "AI Features (Phase 3)" section, WS-1.7 Section 4.5 (StationTemplateRegistry interface + TriggerCondition type).

---

## 2. Scope

### In Scope

- **`TriggerConditionEvaluator`** -- Pure function module that resolves dot-path field references (e.g., `"apps.agent-builder.alertCount"`) against a `SystemSnapshot`, applies comparison operators (`eq`, `gt`, `lt`, `gte`, `lte`, `contains`, `exists`), and returns a boolean result per condition. Handles missing paths and type mismatches gracefully (returns `false`, never throws).
- **`TemplateScorer`** -- Pure function module that computes a weighted activation score (0.0-1.0) for a single `StationTemplate` by evaluating its `TriggerCondition[]` array. The score formula is: `sum(matched_weights) / sum(all_weights)`. Templates with empty triggers receive a base score derived from their `priority` field.
- **`TemplateSelector`** -- Orchestrator that selects the top N templates per district. Blends trigger score with priority score, handles tie detection, and optionally routes ties to `AIRouter` for LLM-based resolution. Produces a `SelectionResult` containing the ranked template set, score breakdown, and audit metadata.
- **`DynamicStationTemplateRegistry`** -- New class implementing the `StationTemplateRegistry` interface from WS-1.7. Replaces `StaticStationTemplateRegistry` as the Phase 3 implementation. Delegates scoring to `TemplateScorer` and selection to `TemplateSelector`. The `evaluateTriggers()` method returns a real score (not 0).
- **`SelectionReceiptGenerator`** -- Module that creates a `ReceiptInput` for every template selection decision, including the trigger evaluation breakdown, scores, alternatives considered, and whether AI tie-breaking was used. Uses `ReceiptStore.record()` from WS-3.1.
- **Additional `StationTemplate` definitions** -- Conditional templates not present in Phase 1 (e.g., Diagnostics, Alert Summary, Recent Errors). These templates have non-empty `triggers` arrays and are registered in the `DynamicStationTemplateRegistry` alongside the existing AD-8 templates.
- **`TemplateBrowser` component** -- UI panel accessible from the district view (Z2/Z3) that displays all available templates for the current district, their current scores, selection status (selected/available/pinned), and allows the user to pin or unpin templates for manual override. Styled with the Oblivion glass material from WS-2.6.
- **`TemplateBrowserItem` component** -- Individual template card within the browser, showing template name, description, score bar, trigger match details, and pin/unpin action.
- **`useTemplateSelection` hook** -- React hook that wires `DynamicStationTemplateRegistry`, `SystemStateProvider`, and `ReceiptStore` together. Returns the currently selected template set for a district, the template browser state, and methods to pin/unpin overrides.
- **`useTemplateBrowser` hook** -- React hook managing the template browser open/close state, search/filter within the browser, and pin/unpin persistence (session-scoped via Zustand `ui.store`).
- **Integration with `AIRouter`** -- When the `TemplateSelector` detects a tie (two or more templates within the configurable threshold), it constructs an `AIRequest` with `feature: 'station-template-selection'` and routes via `AIRouter`. If the AI provider is unavailable, the selector falls back to `priority` ordering.
- **TypeScript types** -- `ScoredTemplate`, `SelectionResult`, `SelectionConfig`, `TriggerEvaluationResult`, `TemplateBrowserState`, `PinnedOverride`.
- **Barrel export** from `src/lib/template-selection/index.ts`.

### Out of Scope

- **New station React component implementations** -- Adding the React body content for Diagnostics, Alert Summary, etc. stations. This workstream defines the `StationTemplate` configuration objects; the rendering components are district workstream responsibility (WS-2.2-2.5 or a follow-up).
- **Supabase persistence for pin overrides** -- Pin state is session-scoped (Zustand). Persisting across sessions is a Phase 4+ concern.
- **Builder Mode** -- WS-4.3 extends the registry with user-described templates. This workstream provides the registry `registerTemplate()` method that Builder Mode calls.
- **Exception Triage** -- WS-4.2 selects recovery UI templates. This workstream provides the scoring infrastructure that Exception Triage reuses.
- **Full generative UI** -- AI never generates React. Templates are pre-built. Per combined-recommendations.md Deferred Item #6.
- **Template visual diff / preview rendering** -- The template browser shows metadata (name, description, score), not a live preview of the station panel.
- **Ollama/Claude SDK setup** -- WS-3.4 (AI Camera Director) establishes the Ollama connection. This workstream consumes `AIRouter.route()`.

---

## 3. Input Dependencies

| Dependency                          | Source                                                    | What It Provides                                                                                                                             | Status    |
| ----------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `StationTemplateRegistry` interface | WS-1.7, `src/lib/interfaces/station-template-registry.ts` | `StationTemplate`, `StationLayout`, `StationAction`, `TriggerCondition`, `StationTemplateRegistry` interface, `evaluateTriggers()` signature | Required  |
| `SystemSnapshot` type               | WS-1.7, `src/lib/interfaces/system-state-provider.ts`     | `SystemSnapshot`, `AppState`, `GlobalMetrics` -- the data structure that triggers evaluate against                                           | Required  |
| `SystemStateProvider` interface     | WS-1.7 / WS-1.5                                           | `getSnapshot()` method to obtain the current telemetry state                                                                                 | Required  |
| `ReceiptStore` interface            | WS-1.7 / WS-3.1, `src/lib/interfaces/receipt-store.ts`    | `ReceiptStore.record()`, `ReceiptInput`, `AIReceiptMetadata` types                                                                           | Required  |
| `AIRouter` interface                | WS-1.7 / WS-3.4, `src/lib/interfaces/ai-router.ts`        | `AIRouter.route()`, `AIRequest`, `AIResponse`, `AIFeature` (`'station-template-selection'`), `isAvailable()`                                 | Required  |
| `StaticStationTemplateRegistry`     | WS-1.7, `src/lib/interfaces/station-template-registry.ts` | Phase 1 template catalog (AD-8 defaults) -- `DynamicStationTemplateRegistry` inherits these templates                                        | Required  |
| Station Panel Framework             | WS-2.6, `src/components/stations/`                        | `StationPanel` component, glass material CSS, receipt stamp hook -- renders whatever templates are selected                                  | Required  |
| Shared domain types                 | WS-1.7, `src/lib/interfaces/types.ts`                     | `AppIdentifier`, `HealthState`, `Actor`, `EventType`, `Severity`, `SpatialLocation`, `ISOTimestamp`                                          | Required  |
| Zustand `ui.store`                  | WS-1.1 / WS-0.1                                           | Store for UI interaction state -- extended with template browser open/close and pin state                                                    | Required  |
| @tarva/ui components                | npm package                                               | `Dialog`, `ScrollArea`, `Button`, `Badge`, `Tooltip`, `Input` for the template browser                                                       | Required  |
| Framer Motion                       | npm package                                               | `motion/react` for template browser entrance/exit animations                                                                                 | Required  |
| Lucide React                        | npm package                                               | Icon components for template browser (Pin, Unpin, Info, Search, ChevronDown)                                                                 | Required  |
| AI Routing Table                    | WS-1.7 / tech-decisions.md                                | `station-template-selection: primary=rule-engine, fallback=ollama`                                                                           | Reference |
| VISUAL-DESIGN-SPEC.md               | Discovery docs                                            | Glass material recipes, Z3 typography, receipt stamp typography for the template browser panel                                               | Reference |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  lib/
    template-selection/
      types.ts                        # SelectionResult, ScoredTemplate, SelectionConfig, etc.
      trigger-evaluator.ts            # Dot-path resolution + comparison operators
      template-scorer.ts              # Weighted activation scoring
      template-selector.ts            # Top-N selection with tie detection
      dynamic-registry.ts             # DynamicStationTemplateRegistry class
      conditional-templates.ts        # Phase 3 conditional template definitions
      selection-receipt.ts            # Receipt generation for selection decisions
      index.ts                        # Barrel export
      __tests__/
        trigger-evaluator.test.ts
        template-scorer.test.ts
        template-selector.test.ts
        dynamic-registry.test.ts
  components/
    stations/
      template-browser/
        template-browser.tsx          # Browser panel (dialog overlay)
        template-browser-item.tsx     # Single template card
        template-browser-header.tsx   # Search/filter controls
        template-browser.css          # Glass material + score bar styles
        index.ts                      # Barrel export
  hooks/
    use-template-selection.ts         # Selection integration hook
    use-template-browser.ts           # Browser UI state hook
```

### 4.2 Selection Types -- `src/lib/template-selection/types.ts`

```ts
/**
 * Types for the dynamic station template selection system.
 *
 * The selection pipeline:
 * 1. TriggerConditionEvaluator evaluates conditions against SystemSnapshot
 * 2. TemplateScorer computes weighted activation scores
 * 3. TemplateSelector picks top N and detects ties
 * 4. SelectionReceiptGenerator records the decision
 *
 * References: AD-7 (AI Integration Architecture), WS-1.7 Section 4.5,
 * tech-decisions.md (station-template-selection routing)
 */

import type { AppIdentifier, ISOTimestamp } from '@/lib/interfaces/types'
import type { StationTemplate, TriggerCondition } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Trigger Evaluation
// ============================================================================

/**
 * Result of evaluating a single TriggerCondition against a SystemSnapshot.
 * Used for audit trail and template browser score breakdown.
 */
export interface TriggerEvaluationResult {
  /** The condition that was evaluated. */
  readonly condition: TriggerCondition
  /** Whether the condition matched. */
  readonly matched: boolean
  /** The actual value found at the dot-path (null if path not found). */
  readonly actualValue: unknown
  /** Weight contribution: condition.weight if matched, 0 if not. */
  readonly weightContribution: number
  /** Human-readable explanation of the evaluation. */
  readonly explanation: string
}

// ============================================================================
// Scored Template
// ============================================================================

/**
 * A station template with its computed activation score and evaluation details.
 */
export interface ScoredTemplate {
  /** The template that was scored. */
  readonly template: StationTemplate
  /** Trigger activation score (0.0-1.0). Based on weighted trigger matches. */
  readonly triggerScore: number
  /** Normalized priority score (0.0-1.0). Derived from template.priority. */
  readonly priorityScore: number
  /** Final blended score. Used for ranking. */
  readonly finalScore: number
  /** Per-condition evaluation details for the template browser. */
  readonly triggerDetails: readonly TriggerEvaluationResult[]
  /** Whether this template had any triggers to evaluate. */
  readonly hasTriggers: boolean
}

// ============================================================================
// Selection Result
// ============================================================================

/**
 * The complete result of a template selection for a district.
 * Stored as receipt detail and exposed to the template browser.
 */
export interface SelectionResult {
  /** Which district this selection applies to. */
  readonly districtId: AppIdentifier
  /** The selected templates, ordered by final score descending. */
  readonly selected: readonly ScoredTemplate[]
  /** Templates that were evaluated but not selected. */
  readonly alternatives: readonly ScoredTemplate[]
  /** Whether AI tie-breaking was invoked. */
  readonly aiTieBreakerUsed: boolean
  /** If AI was used, the provider that resolved the tie. */
  readonly aiProvider: string | null
  /** If AI was used, the latency in ms. */
  readonly aiLatencyMs: number | null
  /** Timestamp of this selection. */
  readonly timestamp: ISOTimestamp
  /** The SystemSnapshot that was used for evaluation. */
  readonly snapshotTimestamp: ISOTimestamp
  /** Correlation ID linking this selection to its receipt. */
  readonly correlationId: string
}

// ============================================================================
// Selection Configuration
// ============================================================================

/**
 * Configuration for the template selection algorithm.
 */
export interface SelectionConfig {
  /**
   * Maximum number of templates to select per district.
   * Default: 5 (2 universal + up to 3 app-specific).
   */
  readonly maxTemplatesPerDistrict: number
  /**
   * Minimum number of templates to always show per district.
   * These are filled from universal templates if not enough score.
   * Default: 2 (Launch + Status).
   */
  readonly minTemplatesPerDistrict: number
  /**
   * Weight of the trigger score in the final blended score.
   * finalScore = triggerScore * triggerWeight + priorityScore * (1 - triggerWeight)
   * Default: 0.7 (trigger relevance dominates, but priority still matters).
   */
  readonly triggerWeight: number
  /**
   * Score difference threshold for tie detection.
   * If two templates' finalScores are within this delta, they are tied.
   * Default: 0.05.
   */
  readonly tieThreshold: number
  /**
   * Whether to invoke AIRouter for tie-breaking when ties are detected.
   * Default: true. Set to false to always use priority ordering for ties.
   */
  readonly enableAITieBreaker: boolean
  /**
   * Timeout for AI tie-breaking in milliseconds.
   * If AI does not respond in time, fall back to priority ordering.
   * Default: 3000 (3 seconds).
   */
  readonly aiTieBreakerTimeoutMs: number
  /**
   * Maximum priority value used for priority score normalization.
   * priorityScore = template.priority / maxPriority.
   * Default: 100 (matching the universal template priority ceiling).
   */
  readonly maxPriority: number
}

/** Default selection configuration. */
export const DEFAULT_SELECTION_CONFIG: Readonly<SelectionConfig> = {
  maxTemplatesPerDistrict: 5,
  minTemplatesPerDistrict: 2,
  triggerWeight: 0.7,
  tieThreshold: 0.05,
  enableAITieBreaker: true,
  aiTieBreakerTimeoutMs: 3_000,
  maxPriority: 100,
} as const

// ============================================================================
// Pinned Override
// ============================================================================

/**
 * A user-pinned template override.
 * Pinned templates are always included in the selection set,
 * regardless of their trigger score.
 */
export interface PinnedOverride {
  /** The template ID that was pinned. */
  readonly templateId: string
  /** Which district this pin applies to. */
  readonly districtId: AppIdentifier
  /** When the user pinned this template. */
  readonly pinnedAt: ISOTimestamp
  /** The receipt correlation ID for the pin action. */
  readonly receiptCorrelationId: string
}

// ============================================================================
// Template Browser State
// ============================================================================

/**
 * UI state for the template browser panel.
 * Managed by useTemplateBrowser hook.
 */
export interface TemplateBrowserState {
  /** Whether the browser panel is open. */
  readonly isOpen: boolean
  /** Which district the browser is showing templates for. */
  readonly districtId: AppIdentifier | null
  /** Current search/filter text. */
  readonly searchQuery: string
  /** Filter by category. Null = show all. */
  readonly categoryFilter: 'universal' | 'app-specific' | null
  /** The most recent selection result (for displaying scores). */
  readonly lastSelectionResult: SelectionResult | null
  /** Active pinned overrides. */
  readonly pinnedOverrides: readonly PinnedOverride[]
}
```

### 4.3 Trigger Condition Evaluator -- `src/lib/template-selection/trigger-evaluator.ts`

The pure-function engine that resolves dot-path field references against a `SystemSnapshot` and applies comparison operators.

```ts
/**
 * TriggerConditionEvaluator -- Rule engine core.
 *
 * Resolves dot-path field references (e.g., "apps.agent-builder.alertCount")
 * against a SystemSnapshot and applies comparison operators.
 *
 * Design constraints:
 * - Pure functions only (no side effects, no state)
 * - Never throws -- returns false for invalid paths or type mismatches
 * - Every evaluation produces an explanation string for the audit trail
 *
 * References: WS-1.7 TriggerCondition type, AD-7 (rule-engine as primary)
 */

import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { TriggerCondition } from '@/lib/interfaces/station-template-registry'
import type { TriggerEvaluationResult } from './types'

// ============================================================================
// Dot-Path Resolution
// ============================================================================

/**
 * Resolve a dot-path string against an object.
 *
 * Examples:
 * - resolvePath(snapshot, "apps.agent-builder.alertCount") -> 3
 * - resolvePath(snapshot, "globalMetrics.systemPulse") -> "OPERATIONAL"
 * - resolvePath(snapshot, "apps.nonexistent.health") -> undefined
 *
 * Handles bracket notation for keys with hyphens:
 * - "apps.agent-builder.alertCount" -> snapshot.apps['agent-builder'].alertCount
 *
 * @returns The resolved value, or undefined if the path is invalid.
 */
export function resolvePath(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object' || !path) {
    return undefined
  }

  const segments = parseDotPath(path)
  let current: unknown = obj

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

/**
 * Parse a dot-path string into segments.
 * Handles hyphenated keys (e.g., "apps.agent-builder.alertCount"
 * becomes ["apps", "agent-builder", "alertCount"]).
 */
function parseDotPath(path: string): string[] {
  return path.split('.')
}

// ============================================================================
// Comparison Operators
// ============================================================================

/**
 * Apply a comparison operator to an actual value and an expected value.
 *
 * Type coercion rules:
 * - 'eq': strict equality (===) after normalizing strings to lowercase
 * - 'gt', 'lt', 'gte', 'lte': numeric comparison (both coerced to Number)
 * - 'contains': string inclusion check (both coerced to String, case-insensitive)
 * - 'exists': checks that the value is not undefined and not null
 *
 * @returns true if the comparison passes, false otherwise.
 */
export function applyOperator(
  operator: TriggerCondition['operator'],
  actual: unknown,
  expected: unknown
): boolean {
  switch (operator) {
    case 'eq':
      return compareEquality(actual, expected)
    case 'gt':
      return compareNumeric(actual, expected, (a, b) => a > b)
    case 'lt':
      return compareNumeric(actual, expected, (a, b) => a < b)
    case 'gte':
      return compareNumeric(actual, expected, (a, b) => a >= b)
    case 'lte':
      return compareNumeric(actual, expected, (a, b) => a <= b)
    case 'contains':
      return compareContains(actual, expected)
    case 'exists':
      return actual !== undefined && actual !== null
    default:
      return false
  }
}

function compareEquality(actual: unknown, expected: unknown): boolean {
  // Normalize strings to lowercase for case-insensitive comparison.
  if (typeof actual === 'string' && typeof expected === 'string') {
    return actual.toLowerCase() === expected.toLowerCase()
  }
  return actual === expected
}

function compareNumeric(
  actual: unknown,
  expected: unknown,
  comparator: (a: number, b: number) => boolean
): boolean {
  const a = Number(actual)
  const b = Number(expected)
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return false
  }
  return comparator(a, b)
}

function compareContains(actual: unknown, expected: unknown): boolean {
  const aStr = String(actual).toLowerCase()
  const bStr = String(expected).toLowerCase()
  return aStr.includes(bStr)
}

// ============================================================================
// Condition Evaluation
// ============================================================================

/**
 * Evaluate a single TriggerCondition against a SystemSnapshot.
 *
 * @param condition - The trigger condition to evaluate.
 * @param snapshot - The system state to evaluate against.
 * @returns A TriggerEvaluationResult with match status and explanation.
 */
export function evaluateCondition(
  condition: TriggerCondition,
  snapshot: SystemSnapshot
): TriggerEvaluationResult {
  const actualValue = resolvePath(snapshot, condition.field)
  const matched = applyOperator(condition.operator, actualValue, condition.value)
  const weightContribution = matched ? condition.weight : 0

  const explanation = buildExplanation(condition, actualValue, matched)

  return {
    condition,
    matched,
    actualValue,
    weightContribution,
    explanation,
  }
}

/**
 * Evaluate all TriggerConditions for a template against a SystemSnapshot.
 *
 * @param conditions - The trigger conditions to evaluate.
 * @param snapshot - The system state to evaluate against.
 * @returns An array of TriggerEvaluationResults.
 */
export function evaluateAllConditions(
  conditions: readonly TriggerCondition[],
  snapshot: SystemSnapshot
): TriggerEvaluationResult[] {
  return conditions.map((condition) => evaluateCondition(condition, snapshot))
}

// ============================================================================
// Explanation Builder
// ============================================================================

/**
 * Build a human-readable explanation of a trigger evaluation.
 * Used in the template browser and receipt audit trail.
 */
function buildExplanation(
  condition: TriggerCondition,
  actualValue: unknown,
  matched: boolean
): string {
  const fieldLabel = condition.field
  const op = condition.operator
  const expected = JSON.stringify(condition.value)
  const actual = actualValue === undefined ? 'undefined' : JSON.stringify(actualValue)

  if (op === 'exists') {
    return matched ? `${fieldLabel} exists (value: ${actual})` : `${fieldLabel} does not exist`
  }

  const opLabel: Record<TriggerCondition['operator'], string> = {
    eq: '==',
    gt: '>',
    lt: '<',
    gte: '>=',
    lte: '<=',
    contains: 'contains',
    exists: 'exists',
  }

  return matched
    ? `PASS: ${fieldLabel} (${actual}) ${opLabel[op]} ${expected} [weight: ${condition.weight}]`
    : `FAIL: ${fieldLabel} (${actual}) ${opLabel[op]} ${expected} [weight: 0]`
}
```

### 4.4 Template Scorer -- `src/lib/template-selection/template-scorer.ts`

Computes a weighted activation score for each template.

```ts
/**
 * TemplateScorer -- Weighted activation scoring for station templates.
 *
 * Scoring formula:
 *   triggerScore = sum(matched_weights) / sum(all_weights)  [0.0-1.0]
 *   priorityScore = template.priority / maxPriority          [0.0-1.0]
 *   finalScore = triggerScore * triggerWeight + priorityScore * (1 - triggerWeight)
 *
 * Templates with no triggers (Phase 1 static templates) receive:
 *   triggerScore = 0.0  (no trigger relevance)
 *   finalScore = priorityScore * (1 - triggerWeight)
 *
 * This means static templates are always ranked below triggered templates
 * that have at least one matching condition -- which is the desired behavior.
 * The universal templates (Launch, Status) have high priority (90-100) to
 * ensure they remain visible even without triggers.
 *
 * References: AD-7 (deterministic scoring preferred),
 * WS-1.7 TriggerCondition.weight (0.0-1.0)
 */

import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { ScoredTemplate, SelectionConfig } from './types'
import { DEFAULT_SELECTION_CONFIG } from './types'
import { evaluateAllConditions } from './trigger-evaluator'

// ============================================================================
// Score a Single Template
// ============================================================================

/**
 * Compute the activation score for a single station template.
 *
 * @param template - The template to score.
 * @param snapshot - The current system state.
 * @param config - Scoring configuration (triggerWeight, maxPriority).
 * @returns A ScoredTemplate with trigger details and final score.
 */
export function scoreTemplate(
  template: StationTemplate,
  snapshot: SystemSnapshot,
  config: SelectionConfig = DEFAULT_SELECTION_CONFIG
): ScoredTemplate {
  const hasTriggers = template.triggers.length > 0

  // Evaluate trigger conditions.
  const triggerDetails = hasTriggers ? evaluateAllConditions(template.triggers, snapshot) : []

  // Compute trigger score.
  let triggerScore = 0
  if (hasTriggers) {
    const totalWeight = template.triggers.reduce((sum, t) => sum + t.weight, 0)
    const matchedWeight = triggerDetails.reduce((sum, r) => sum + r.weightContribution, 0)
    triggerScore = totalWeight > 0 ? matchedWeight / totalWeight : 0
  }

  // Compute priority score (normalized 0.0-1.0).
  const priorityScore = Math.min(1.0, Math.max(0.0, template.priority / config.maxPriority))

  // Compute final blended score.
  const finalScore = hasTriggers
    ? triggerScore * config.triggerWeight + priorityScore * (1 - config.triggerWeight)
    : priorityScore * (1 - config.triggerWeight)

  return {
    template,
    triggerScore,
    priorityScore,
    finalScore,
    triggerDetails,
    hasTriggers,
  }
}

// ============================================================================
// Score All Templates for a District
// ============================================================================

/**
 * Score all templates applicable to a district.
 *
 * @param templates - All templates for the district (from registry).
 * @param snapshot - The current system state.
 * @param config - Scoring configuration.
 * @returns All templates scored and sorted by finalScore descending.
 */
export function scoreAllTemplates(
  templates: readonly StationTemplate[],
  snapshot: SystemSnapshot,
  config: SelectionConfig = DEFAULT_SELECTION_CONFIG
): ScoredTemplate[] {
  return templates
    .map((t) => scoreTemplate(t, snapshot, config))
    .sort((a, b) => {
      // Primary sort: finalScore descending.
      if (Math.abs(a.finalScore - b.finalScore) > 0.001) {
        return b.finalScore - a.finalScore
      }
      // Secondary sort: universal templates first.
      if (a.template.category !== b.template.category) {
        return a.template.category === 'universal' ? -1 : 1
      }
      // Tertiary sort: priority descending.
      return b.template.priority - a.template.priority
    })
}
```

### 4.5 Template Selector -- `src/lib/template-selection/template-selector.ts`

Orchestrates the selection pipeline: score, rank, detect ties, optionally invoke AI, and produce the final `SelectionResult`.

```ts
/**
 * TemplateSelector -- Top-N selection with tie detection and AI fallback.
 *
 * Pipeline:
 * 1. Score all templates for the district (TemplateScorer)
 * 2. Apply pinned overrides (always included regardless of score)
 * 3. Ensure minimum universal templates are present
 * 4. Detect ties among candidates at the selection boundary
 * 5. If ties detected and AI enabled, route to AIRouter for resolution
 * 6. If AI unavailable or disabled, break ties by priority
 * 7. Select top N templates
 * 8. Produce SelectionResult with full audit metadata
 *
 * References: AD-7 (station-template-selection: primary=rule-engine, fallback=ollama),
 * tech-decisions.md routing table
 */

import type { AppIdentifier } from '@/lib/interfaces/types'
import type {
  StationTemplate,
  StationTemplateRegistry,
} from '@/lib/interfaces/station-template-registry'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { AIRouter } from '@/lib/interfaces/ai-router'
import type { ScoredTemplate, SelectionConfig, SelectionResult, PinnedOverride } from './types'
import { DEFAULT_SELECTION_CONFIG } from './types'
import { scoreAllTemplates } from './template-scorer'

// ============================================================================
// Selection
// ============================================================================

/**
 * Select the top N templates for a district.
 *
 * @param districtId - The district to select templates for.
 * @param registry - The station template registry.
 * @param snapshot - The current system state.
 * @param aiRouter - The AI router (for tie-breaking). May be null.
 * @param pinnedOverrides - User-pinned template overrides.
 * @param config - Selection configuration.
 * @returns A SelectionResult with the selected templates and audit metadata.
 */
export async function selectTemplates(
  districtId: AppIdentifier,
  registry: StationTemplateRegistry,
  snapshot: SystemSnapshot,
  aiRouter: AIRouter | null,
  pinnedOverrides: readonly PinnedOverride[],
  config: SelectionConfig = DEFAULT_SELECTION_CONFIG
): Promise<SelectionResult> {
  const correlationId = crypto.randomUUID()
  const timestamp = new Date().toISOString()

  // Step 1: Get all templates for this district from the registry.
  const allTemplates = registry.getTemplatesForDistrict(districtId, snapshot)

  // Step 2: Score all templates.
  const scoredTemplates = scoreAllTemplates(allTemplates, snapshot, config)

  // Step 3: Identify pinned templates for this district.
  const districtPins = pinnedOverrides.filter((p) => p.districtId === districtId)
  const pinnedIds = new Set(districtPins.map((p) => p.templateId))

  // Step 4: Separate pinned (always included) from candidates.
  const pinned = scoredTemplates.filter((s) => pinnedIds.has(s.template.id))
  const unpinned = scoredTemplates.filter((s) => !pinnedIds.has(s.template.id))

  // Step 5: Ensure minimum universal templates are in the unpinned set.
  const universalFromUnpinned = unpinned.filter((s) => s.template.category === 'universal')
  const appSpecificFromUnpinned = unpinned.filter((s) => s.template.category === 'app-specific')

  // Step 6: Determine how many slots are available after pins and universals.
  const slotsForPinned = pinned.length
  const slotsForUniversal = Math.min(config.minTemplatesPerDistrict, universalFromUnpinned.length)
  const remainingSlots = Math.max(
    0,
    config.maxTemplatesPerDistrict - slotsForPinned - slotsForUniversal
  )

  // Step 7: Check for ties among app-specific candidates at the boundary.
  let selectedAppSpecific: ScoredTemplate[]
  let aiTieBreakerUsed = false
  let aiProvider: string | null = null
  let aiLatencyMs: number | null = null

  if (remainingSlots > 0 && appSpecificFromUnpinned.length > remainingSlots) {
    // There are more candidates than slots -- check for ties at the boundary.
    const boundary = appSpecificFromUnpinned[remainingSlots - 1]
    const nextOut = appSpecificFromUnpinned[remainingSlots]

    if (nextOut && Math.abs(boundary.finalScore - nextOut.finalScore) <= config.tieThreshold) {
      // Tie detected at the selection boundary.
      const tiedGroup = appSpecificFromUnpinned.filter(
        (s) => Math.abs(s.finalScore - boundary.finalScore) <= config.tieThreshold
      )

      if (
        config.enableAITieBreaker &&
        aiRouter &&
        aiRouter.isAvailable('station-template-selection')
      ) {
        // Route to AI for tie resolution.
        const aiResult = await resolveWithAI(
          districtId,
          tiedGroup,
          snapshot,
          aiRouter,
          config.aiTieBreakerTimeoutMs
        )

        if (aiResult.success) {
          aiTieBreakerUsed = true
          aiProvider = aiResult.provider
          aiLatencyMs = aiResult.latencyMs
          selectedAppSpecific = aiResult.resolved.slice(0, remainingSlots)
        } else {
          // AI failed or timed out -- fall back to priority ordering.
          selectedAppSpecific = appSpecificFromUnpinned.slice(0, remainingSlots)
        }
      } else {
        // AI disabled or unavailable -- use priority ordering.
        selectedAppSpecific = appSpecificFromUnpinned.slice(0, remainingSlots)
      }
    } else {
      // No tie at boundary -- straightforward selection.
      selectedAppSpecific = appSpecificFromUnpinned.slice(0, remainingSlots)
    }
  } else {
    // All app-specific templates fit within the available slots.
    selectedAppSpecific = appSpecificFromUnpinned.slice(0, remainingSlots)
  }

  // Step 8: Assemble the final selected set.
  const selected: ScoredTemplate[] = [
    ...pinned,
    ...universalFromUnpinned.slice(0, slotsForUniversal),
    ...selectedAppSpecific,
  ]

  // Step 9: Determine alternatives (scored but not selected).
  const selectedIds = new Set(selected.map((s) => s.template.id))
  const alternatives = scoredTemplates.filter((s) => !selectedIds.has(s.template.id))

  return {
    districtId,
    selected,
    alternatives,
    aiTieBreakerUsed,
    aiProvider,
    aiLatencyMs,
    timestamp,
    snapshotTimestamp: snapshot.timestamp,
    correlationId,
  }
}

// ============================================================================
// AI Tie-Breaking
// ============================================================================

interface AITieBreakResult {
  readonly success: boolean
  readonly resolved: ScoredTemplate[]
  readonly provider: string
  readonly latencyMs: number
}

/**
 * Route a tie-breaking request to the AI provider.
 *
 * The AI receives:
 * - The district context (which app)
 * - The tied templates (names, descriptions, scores)
 * - The current system state summary (health, alerts, active work)
 *
 * The AI returns a ranked ordering of the tied templates.
 * If the AI response is malformed, we fall back to priority ordering.
 */
async function resolveWithAI(
  districtId: AppIdentifier,
  tiedTemplates: ScoredTemplate[],
  snapshot: SystemSnapshot,
  aiRouter: AIRouter,
  timeoutMs: number
): Promise<AITieBreakResult> {
  const appState = snapshot.apps[districtId]

  const input = {
    districtId,
    tiedTemplates: tiedTemplates.map((s) => ({
      id: s.template.id,
      name: s.template.displayName,
      description: s.template.description,
      category: s.template.category,
      finalScore: s.finalScore,
      triggerScore: s.triggerScore,
    })),
    systemContext: {
      health: appState?.health ?? 'UNKNOWN',
      alertCount: appState?.alertCount ?? 0,
      pulse: appState?.pulse ?? 'unknown',
      globalAlerts: snapshot.globalMetrics.alertCount,
      globalPulse: snapshot.globalMetrics.systemPulse,
    },
  }

  try {
    const response = await aiRouter.route({
      feature: 'station-template-selection',
      input,
      context: snapshot,
      timeout: timeoutMs,
    })

    if (!response.success) {
      return {
        success: false,
        resolved: tiedTemplates,
        provider: response.provider,
        latencyMs: response.latencyMs,
      }
    }

    // Parse AI response: expect { rankedTemplateIds: string[] }
    const rankedIds = response.result.rankedTemplateIds as string[] | undefined
    if (!Array.isArray(rankedIds) || rankedIds.length === 0) {
      // Malformed response -- fall back to input order.
      return {
        success: false,
        resolved: tiedTemplates,
        provider: response.provider,
        latencyMs: response.latencyMs,
      }
    }

    // Reorder tied templates according to AI ranking.
    const idToScored = new Map(tiedTemplates.map((s) => [s.template.id, s]))
    const resolved: ScoredTemplate[] = []

    for (const id of rankedIds) {
      const scored = idToScored.get(id)
      if (scored) {
        resolved.push(scored)
        idToScored.delete(id)
      }
    }

    // Append any templates the AI missed (safety: never drop a template).
    for (const remaining of idToScored.values()) {
      resolved.push(remaining)
    }

    return {
      success: true,
      resolved,
      provider: response.provider,
      latencyMs: response.latencyMs,
    }
  } catch {
    // Timeout or network failure -- fall back gracefully.
    return {
      success: false,
      resolved: tiedTemplates,
      provider: 'rule-engine',
      latencyMs: 0,
    }
  }
}
```

### 4.6 Conditional Templates -- `src/lib/template-selection/conditional-templates.ts`

Phase 3 template definitions with non-empty trigger conditions. These are registered alongside the AD-8 static templates.

```ts
/**
 * Conditional station templates for Phase 3 dynamic selection.
 *
 * These templates have TriggerCondition arrays that activate them
 * when specific system state conditions are met. They supplement
 * the static AD-8 templates from WS-1.7.
 *
 * Naming convention: {districtId}--{name}--conditional
 * Example: "agent-builder--diagnostics--conditional"
 *
 * References: AD-8 (Station Content per District), AD-7 (disposable stations)
 */

import type { StationTemplate } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Agent Builder Conditional Templates
// ============================================================================

export const AGENT_BUILDER_DIAGNOSTICS: StationTemplate = {
  id: 'agent-builder--diagnostics--conditional',
  districtId: 'agent-builder',
  name: 'diagnostics',
  displayName: 'Diagnostics',
  description:
    'Active alerts and recent errors for Agent Builder. Surfaces when alertCount > 0 or health is DEGRADED/DOWN.',
  category: 'app-specific',
  layout: {
    header: { title: 'Diagnostics', icon: 'AlertTriangle' },
    bodyType: 'list',
    actions: [
      {
        id: 'view-alerts',
        label: 'View All Alerts',
        variant: 'default',
        command: 'show alerts in ${districtId}',
        icon: 'Bell',
      },
      {
        id: 'dismiss-all',
        label: 'Dismiss All',
        variant: 'secondary',
        command: 'dismiss alerts in ${districtId}',
        icon: 'CheckCircle',
      },
    ],
  },
  triggers: [
    {
      field: 'apps.agent-builder.alertCount',
      operator: 'gt',
      value: 0,
      weight: 0.8,
    },
    {
      field: 'apps.agent-builder.health',
      operator: 'eq',
      value: 'DEGRADED',
      weight: 0.6,
    },
    {
      field: 'apps.agent-builder.health',
      operator: 'eq',
      value: 'DOWN',
      weight: 1.0,
    },
  ],
  priority: 70,
  disposable: false,
}

// ============================================================================
// Tarva Chat Conditional Templates
// ============================================================================

export const TARVA_CHAT_ACTIVE_CONVERSATIONS: StationTemplate = {
  id: 'tarva-chat--active-conversations--conditional',
  districtId: 'tarva-chat',
  name: 'active-conversations',
  displayName: 'Active Conversations',
  description:
    'Promoted view of active conversations. Surfaces when pulse indicates high conversation activity.',
  category: 'app-specific',
  layout: {
    header: { title: 'Active Conversations', icon: 'MessageCircle' },
    bodyType: 'table',
    actions: [
      {
        id: 'open-active',
        label: 'Open Active',
        variant: 'default',
        command: 'open tarva-chat',
        icon: 'ExternalLink',
      },
    ],
  },
  triggers: [
    {
      field: 'apps.tarva-chat.health',
      operator: 'eq',
      value: 'OPERATIONAL',
      weight: 0.3,
    },
    {
      field: 'apps.tarva-chat.alertCount',
      operator: 'eq',
      value: 0,
      weight: 0.2,
    },
  ],
  priority: 45,
  disposable: false,
}

// ============================================================================
// Project Room Conditional Templates
// ============================================================================

export const PROJECT_ROOM_ALERT_SUMMARY: StationTemplate = {
  id: 'project-room--alert-summary--conditional',
  districtId: 'project-room',
  name: 'alert-summary',
  displayName: 'Alert Summary',
  description:
    'Aggregated alert view for Project Room. Surfaces when alertCount > 2 or health is not OPERATIONAL.',
  category: 'app-specific',
  layout: {
    header: { title: 'Alert Summary', icon: 'ShieldAlert' },
    bodyType: 'list',
    actions: [
      {
        id: 'investigate',
        label: 'Investigate',
        variant: 'default',
        command: 'show alerts in ${districtId}',
        icon: 'Search',
      },
      {
        id: 'open-project',
        label: 'Open Project Room',
        variant: 'secondary',
        command: 'open project-room',
        icon: 'ExternalLink',
      },
    ],
  },
  triggers: [
    {
      field: 'apps.project-room.alertCount',
      operator: 'gt',
      value: 2,
      weight: 0.7,
    },
    {
      field: 'apps.project-room.health',
      operator: 'eq',
      value: 'DEGRADED',
      weight: 0.5,
    },
    {
      field: 'apps.project-room.health',
      operator: 'eq',
      value: 'DOWN',
      weight: 1.0,
    },
  ],
  priority: 65,
  disposable: false,
}

// ============================================================================
// Universal Conditional Templates
// ============================================================================

export const UNIVERSAL_SYSTEM_ALERT: StationTemplate = {
  id: 'universal--system-alert--conditional',
  districtId: '*',
  name: 'system-alert',
  displayName: 'System Alert',
  description:
    'Global system alert station. Surfaces in any district when the global alert count is high or system pulse is degraded.',
  category: 'universal',
  layout: {
    header: { title: 'System Alert', icon: 'AlertOctagon' },
    bodyType: 'metrics',
    actions: [
      {
        id: 'view-evidence',
        label: 'View Evidence Ledger',
        variant: 'default',
        command: 'go evidence-ledger',
        icon: 'FileText',
      },
    ],
  },
  triggers: [
    {
      field: 'globalMetrics.alertCount',
      operator: 'gt',
      value: 5,
      weight: 0.9,
    },
    {
      field: 'globalMetrics.systemPulse',
      operator: 'eq',
      value: 'DEGRADED',
      weight: 0.6,
    },
    {
      field: 'globalMetrics.systemPulse',
      operator: 'eq',
      value: 'DOWN',
      weight: 1.0,
    },
  ],
  priority: 85,
  disposable: false,
}

// ============================================================================
// All Conditional Templates
// ============================================================================

/** All Phase 3 conditional templates to register with the DynamicStationTemplateRegistry. */
export const CONDITIONAL_TEMPLATES: readonly StationTemplate[] = [
  AGENT_BUILDER_DIAGNOSTICS,
  TARVA_CHAT_ACTIVE_CONVERSATIONS,
  PROJECT_ROOM_ALERT_SUMMARY,
  UNIVERSAL_SYSTEM_ALERT,
] as const
```

### 4.7 Dynamic Registry -- `src/lib/template-selection/dynamic-registry.ts`

The Phase 3 `StationTemplateRegistry` implementation that replaces `StaticStationTemplateRegistry`.

```ts
/**
 * DynamicStationTemplateRegistry -- Phase 3 station catalog with scoring.
 *
 * Replaces StaticStationTemplateRegistry from WS-1.7.
 * Inherits all AD-8 static templates and adds conditional templates.
 * The evaluateTriggers() method returns a real weighted score.
 * getTemplatesForDistrict() scores and ranks templates when a
 * SystemSnapshot context is provided.
 *
 * References: AD-7 interface #4, WS-1.7 Section 4.5
 */

import type { AppIdentifier } from '@/lib/interfaces/types'
import type {
  StationTemplate,
  StationTemplateRegistry,
  TriggerCondition,
} from '@/lib/interfaces/station-template-registry'
import { StaticStationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import { evaluateAllConditions } from './trigger-evaluator'
import { scoreAllTemplates } from './template-scorer'
import { CONDITIONAL_TEMPLATES } from './conditional-templates'
import type { SelectionConfig } from './types'
import { DEFAULT_SELECTION_CONFIG } from './types'

// ============================================================================
// DynamicStationTemplateRegistry
// ============================================================================

export class DynamicStationTemplateRegistry implements StationTemplateRegistry {
  private templates: Map<string, StationTemplate> = new Map()
  private config: SelectionConfig

  constructor(config: SelectionConfig = DEFAULT_SELECTION_CONFIG) {
    this.config = config

    // Inherit all static AD-8 templates from Phase 1.
    const staticRegistry = new StaticStationTemplateRegistry()
    for (const template of staticRegistry.getAllTemplates()) {
      this.templates.set(template.id, template)
    }

    // Register Phase 3 conditional templates.
    for (const template of CONDITIONAL_TEMPLATES) {
      this.templates.set(template.id, template)
    }
  }

  /**
   * Get templates for a district, optionally scored against a SystemSnapshot.
   *
   * - Without context: returns all templates for the district sorted by priority
   *   (identical to Phase 1 behavior).
   * - With context: scores all templates against the snapshot, returns them
   *   sorted by finalScore descending. This is the Phase 3 dynamic behavior.
   */
  getTemplatesForDistrict(
    districtId: AppIdentifier,
    context?: SystemSnapshot
  ): readonly StationTemplate[] {
    const applicable: StationTemplate[] = []

    for (const template of this.templates.values()) {
      if (template.districtId === '*' || template.districtId === districtId) {
        applicable.push(template)
      }
    }

    if (!context) {
      // No context -- Phase 1 fallback: sort by category then priority.
      return applicable.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category === 'universal' ? -1 : 1
        }
        return b.priority - a.priority
      })
    }

    // Phase 3: score and rank.
    const scored = scoreAllTemplates(applicable, context, this.config)
    return scored.map((s) => s.template)
  }

  getTemplate(templateId: string): StationTemplate | null {
    return this.templates.get(templateId) ?? null
  }

  getAllTemplates(): readonly StationTemplate[] {
    return Array.from(this.templates.values())
  }

  registerTemplate(template: StationTemplate): void {
    this.templates.set(template.id, template)
  }

  removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId)
  }

  /**
   * Evaluate trigger conditions against a SystemSnapshot and return a score.
   *
   * Score = sum(matched_weights) / sum(all_weights).
   * Returns 0.0 if conditions array is empty.
   * Returns 1.0 if all conditions match with full weight.
   */
  evaluateTriggers(conditions: readonly TriggerCondition[], context: SystemSnapshot): number {
    if (conditions.length === 0) return 0

    const results = evaluateAllConditions(conditions, context)
    const totalWeight = conditions.reduce((sum, c) => sum + c.weight, 0)
    const matchedWeight = results.reduce((sum, r) => sum + r.weightContribution, 0)

    return totalWeight > 0 ? matchedWeight / totalWeight : 0
  }
}
```

### 4.8 Selection Receipt Generator -- `src/lib/template-selection/selection-receipt.ts`

Creates audit-trail receipts for every template selection decision.

```ts
/**
 * SelectionReceiptGenerator -- Audit trail for template selection decisions.
 *
 * Every template selection generates a receipt recording:
 * - Which templates were selected and why (scores, trigger breakdowns)
 * - Which alternatives were considered but not selected
 * - Whether AI tie-breaking was used (and if so, provider + latency)
 * - The SystemSnapshot timestamp the decision was based on
 *
 * Per AD-7: "every AI decision generates a Receipt"
 * Per AD-6: "Mutations-only receipts" -- template selection is a mutation
 * (it changes which stations are visible).
 *
 * References: AD-6 (Receipt System), AD-7 (audit trail), WS-3.1 (ReceiptStore)
 */

import type { ReceiptStore, ReceiptInput, AIReceiptMetadata } from '@/lib/interfaces/receipt-store'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { SelectionResult } from './types'

// ============================================================================
// Receipt Generation
// ============================================================================

/**
 * Record a template selection decision as a receipt.
 *
 * @param result - The selection result from TemplateSelector.
 * @param receiptStore - The receipt store to record to.
 * @returns The recorded receipt's ID.
 */
export async function recordSelectionReceipt(
  result: SelectionResult,
  receiptStore: ReceiptStore
): Promise<string> {
  const selectedNames = result.selected.map((s) => s.template.displayName).join(', ')

  const summary = `Station selection for ${result.districtId}: ${selectedNames}`.slice(0, 120)

  const detail: Record<string, unknown> = {
    districtId: result.districtId,
    selectedTemplates: result.selected.map((s) => ({
      id: s.template.id,
      name: s.template.displayName,
      triggerScore: round(s.triggerScore, 3),
      priorityScore: round(s.priorityScore, 3),
      finalScore: round(s.finalScore, 3),
      hasTriggers: s.hasTriggers,
      matchedTriggers: s.triggerDetails.filter((t) => t.matched).map((t) => t.explanation),
    })),
    alternativeTemplates: result.alternatives.map((s) => ({
      id: s.template.id,
      name: s.template.displayName,
      finalScore: round(s.finalScore, 3),
    })),
    aiTieBreakerUsed: result.aiTieBreakerUsed,
    snapshotTimestamp: result.snapshotTimestamp,
  }

  // Build AI metadata if AI tie-breaking was used.
  const aiMetadata: AIReceiptMetadata | null = result.aiTieBreakerUsed
    ? {
        prompt: `Resolve tie for station selection in ${result.districtId}`,
        reasoning: `AI ranked ${result.selected.length} templates based on system state`,
        confidence: 0.7,
        alternativesConsidered: result.alternatives.map((s) => s.template.displayName),
        provider:
          (result.aiProvider as 'ollama' | 'claude' | 'rule-engine' | 'pattern-matcher') ??
          'rule-engine',
        latencyMs: result.aiLatencyMs ?? 0,
        modelId: null,
      }
    : null

  const input: ReceiptInput = {
    correlationId: result.correlationId,
    source: 'launch',
    eventType: 'system',
    severity: 'info',
    summary,
    detail,
    location: {
      semanticLevel: 'Z2',
      district: result.districtId,
      station: null,
    },
    actor: result.aiTieBreakerUsed ? 'ai' : 'system',
    aiMetadata,
  }

  const receipt = await receiptStore.record(input)
  return receipt.id
}

/**
 * Record a manual pin/unpin action as a receipt.
 *
 * @param districtId - The district the pin applies to.
 * @param templateId - The template being pinned/unpinned.
 * @param templateName - Human-readable template name.
 * @param action - Whether pinning or unpinning.
 * @param receiptStore - The receipt store to record to.
 * @returns The recorded receipt's ID.
 */
export async function recordPinReceipt(
  districtId: AppIdentifier,
  templateId: string,
  templateName: string,
  action: 'pin' | 'unpin',
  receiptStore: ReceiptStore
): Promise<string> {
  const summary =
    action === 'pin'
      ? `Pinned "${templateName}" in ${districtId}`
      : `Unpinned "${templateName}" in ${districtId}`

  const input: ReceiptInput = {
    source: 'launch',
    eventType: 'action',
    severity: 'info',
    summary: summary.slice(0, 120),
    detail: { districtId, templateId, templateName, action },
    location: {
      semanticLevel: 'Z2',
      district: districtId,
      station: null,
    },
    actor: 'human',
  }

  const receipt = await receiptStore.record(input)
  return receipt.id
}

// ============================================================================
// Helpers
// ============================================================================

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
```

### 4.9 Template Selection Hook -- `src/hooks/use-template-selection.ts`

React hook that orchestrates template selection for a district and manages re-selection when the `SystemSnapshot` changes.

```ts
'use client'

/**
 * useTemplateSelection -- Integration hook for dynamic station template selection.
 *
 * Wires together DynamicStationTemplateRegistry, SystemStateProvider,
 * ReceiptStore, and AIRouter. Returns the currently selected template
 * set for a district, re-evaluating when the system snapshot changes.
 *
 * Re-selection is debounced: the system does not re-score on every
 * telemetry poll. It waits for a meaningful state change (health transition,
 * alert count change) before re-evaluating.
 *
 * References: AD-5 (adaptive polling), AD-7 (template selection)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { SystemStateProvider, SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import type { AIRouter } from '@/lib/interfaces/ai-router'
import type {
  SelectionResult,
  SelectionConfig,
  PinnedOverride,
} from '@/lib/template-selection/types'
import { DEFAULT_SELECTION_CONFIG } from '@/lib/template-selection/types'
import { selectTemplates } from '@/lib/template-selection/template-selector'
import { recordSelectionReceipt } from '@/lib/template-selection/selection-receipt'

// ============================================================================
// Types
// ============================================================================

export interface UseTemplateSelectionOptions {
  /** The district to select templates for. */
  readonly districtId: AppIdentifier
  /** The station template registry instance. */
  readonly registry: StationTemplateRegistry
  /** The system state provider instance. */
  readonly systemState: SystemStateProvider
  /** The receipt store instance. */
  readonly receiptStore: ReceiptStore
  /** The AI router instance (optional -- null disables AI tie-breaking). */
  readonly aiRouter: AIRouter | null
  /** Pinned overrides (from useTemplateBrowser or Zustand store). */
  readonly pinnedOverrides: readonly PinnedOverride[]
  /** Selection configuration overrides. */
  readonly config?: SelectionConfig
  /**
   * Debounce interval in ms for re-selection after snapshot changes.
   * Default: 2000 (2 seconds). Prevents re-selection on every poll cycle.
   */
  readonly debounceMs?: number
}

export interface UseTemplateSelectionReturn {
  /** The current selection result (null until first selection completes). */
  readonly result: SelectionResult | null
  /** Whether a selection is currently in progress. */
  readonly isSelecting: boolean
  /** Force an immediate re-selection (bypasses debounce). */
  readonly forceReselect: () => Promise<void>
}

// ============================================================================
// Hook
// ============================================================================

export function useTemplateSelection({
  districtId,
  registry,
  systemState,
  receiptStore,
  aiRouter,
  pinnedOverrides,
  config = DEFAULT_SELECTION_CONFIG,
  debounceMs = 2_000,
}: UseTemplateSelectionOptions): UseTemplateSelectionReturn {
  const [result, setResult] = useState<SelectionResult | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSnapshotKeyRef = useRef<string | null>(null)

  /**
   * Run the selection pipeline.
   */
  const runSelection = useCallback(async () => {
    const snapshot = systemState.getSnapshot()
    if (!snapshot) return

    setIsSelecting(true)
    try {
      const selectionResult = await selectTemplates(
        districtId,
        registry,
        snapshot,
        aiRouter,
        pinnedOverrides,
        config
      )

      setResult(selectionResult)

      // Record the selection as a receipt.
      await recordSelectionReceipt(selectionResult, receiptStore)
    } finally {
      setIsSelecting(false)
    }
  }, [districtId, registry, systemState, receiptStore, aiRouter, pinnedOverrides, config])

  /**
   * Detect meaningful state changes and debounce re-selection.
   * A "meaningful change" is defined as a change in:
   * - Any app's health state
   * - Any app's alert count
   * - The global system pulse
   */
  useEffect(() => {
    const unsubscribe = systemState.subscribe((snapshot: SystemSnapshot) => {
      const key = buildSnapshotKey(snapshot, districtId)

      if (key === prevSnapshotKeyRef.current) {
        // No meaningful change -- skip re-selection.
        return
      }

      prevSnapshotKeyRef.current = key

      // Debounce the re-selection.
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        void runSelection()
      }, debounceMs)
    })

    // Run initial selection.
    void runSelection()

    return () => {
      unsubscribe()
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [systemState, districtId, debounceMs, runSelection])

  // Re-run selection when pins change.
  useEffect(() => {
    void runSelection()
  }, [pinnedOverrides, runSelection])

  const forceReselect = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    await runSelection()
  }, [runSelection])

  return { result, isSelecting, forceReselect }
}

// ============================================================================
// Snapshot Key Builder
// ============================================================================

/**
 * Build a string key from the parts of a SystemSnapshot that are
 * relevant to template selection. Changes to this key trigger re-selection.
 */
function buildSnapshotKey(snapshot: SystemSnapshot, districtId: AppIdentifier): string {
  const appState = snapshot.apps[districtId]
  const parts: string[] = [
    `health:${appState?.health ?? 'UNKNOWN'}`,
    `alerts:${appState?.alertCount ?? 0}`,
    `pulse:${snapshot.globalMetrics.systemPulse}`,
    `globalAlerts:${snapshot.globalMetrics.alertCount}`,
  ]
  return parts.join('|')
}
```

### 4.10 Template Browser Hook -- `src/hooks/use-template-browser.ts`

```ts
'use client'

/**
 * useTemplateBrowser -- UI state management for the template browser panel.
 *
 * Manages:
 * - Open/close state of the browser dialog
 * - Search/filter within the browser
 * - Pinned overrides (session-scoped, stored in component state)
 * - Receipt generation for pin/unpin actions
 *
 * Pin state is intentionally NOT persisted to Supabase.
 * It lives in component state and resets on page refresh.
 * This matches the "disposable" philosophy: overrides are temporary.
 */

import { useCallback, useState } from 'react'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import type {
  TemplateBrowserState,
  PinnedOverride,
  SelectionResult,
} from '@/lib/template-selection/types'
import { recordPinReceipt } from '@/lib/template-selection/selection-receipt'

// ============================================================================
// Types
// ============================================================================

export interface UseTemplateBrowserReturn {
  /** Current browser state. */
  readonly state: TemplateBrowserState
  /** Open the browser for a specific district. */
  readonly open: (districtId: AppIdentifier) => void
  /** Close the browser. */
  readonly close: () => void
  /** Update the search query. */
  readonly setSearchQuery: (query: string) => void
  /** Set the category filter. */
  readonly setCategoryFilter: (filter: 'universal' | 'app-specific' | null) => void
  /** Pin a template (adds to overrides). */
  readonly pinTemplate: (
    districtId: AppIdentifier,
    templateId: string,
    templateName: string
  ) => Promise<void>
  /** Unpin a template (removes from overrides). */
  readonly unpinTemplate: (
    districtId: AppIdentifier,
    templateId: string,
    templateName: string
  ) => Promise<void>
  /** Check if a template is pinned. */
  readonly isPinned: (templateId: string) => boolean
  /** Update the last selection result (for score display). */
  readonly setLastSelectionResult: (result: SelectionResult) => void
  /** Get all current pinned overrides. */
  readonly pinnedOverrides: readonly PinnedOverride[]
}

// ============================================================================
// Hook
// ============================================================================

export function useTemplateBrowser(receiptStore: ReceiptStore): UseTemplateBrowserReturn {
  const [state, setState] = useState<TemplateBrowserState>({
    isOpen: false,
    districtId: null,
    searchQuery: '',
    categoryFilter: null,
    lastSelectionResult: null,
    pinnedOverrides: [],
  })

  const open = useCallback((districtId: AppIdentifier) => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      districtId,
      searchQuery: '',
      categoryFilter: null,
    }))
  }, [])

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const setSearchQuery = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }))
  }, [])

  const setCategoryFilter = useCallback((filter: 'universal' | 'app-specific' | null) => {
    setState((prev) => ({ ...prev, categoryFilter: filter }))
  }, [])

  const pinTemplate = useCallback(
    async (districtId: AppIdentifier, templateId: string, templateName: string) => {
      const receiptCorrelationId = await recordPinReceipt(
        districtId,
        templateId,
        templateName,
        'pin',
        receiptStore
      )

      const pin: PinnedOverride = {
        templateId,
        districtId,
        pinnedAt: new Date().toISOString(),
        receiptCorrelationId,
      }

      setState((prev) => ({
        ...prev,
        pinnedOverrides: [...prev.pinnedOverrides, pin],
      }))
    },
    [receiptStore]
  )

  const unpinTemplate = useCallback(
    async (districtId: AppIdentifier, templateId: string, templateName: string) => {
      await recordPinReceipt(districtId, templateId, templateName, 'unpin', receiptStore)

      setState((prev) => ({
        ...prev,
        pinnedOverrides: prev.pinnedOverrides.filter(
          (p) => !(p.templateId === templateId && p.districtId === districtId)
        ),
      }))
    },
    [receiptStore]
  )

  const isPinned = useCallback(
    (templateId: string) => {
      return state.pinnedOverrides.some((p) => p.templateId === templateId)
    },
    [state.pinnedOverrides]
  )

  const setLastSelectionResult = useCallback((result: SelectionResult) => {
    setState((prev) => ({ ...prev, lastSelectionResult: result }))
  }, [])

  return {
    state,
    open,
    close,
    setSearchQuery,
    setCategoryFilter,
    pinTemplate,
    unpinTemplate,
    isPinned,
    setLastSelectionResult,
    pinnedOverrides: state.pinnedOverrides,
  }
}
```

### 4.11 Template Browser Component -- `src/components/stations/template-browser/template-browser.tsx`

The UI panel for browsing and overriding template selection.

```tsx
'use client'

/**
 * TemplateBrowser -- Manual override panel for station template selection.
 *
 * Renders as a dialog overlay (not a station panel) at Z2/Z3.
 * Shows all templates for the current district with:
 * - Current activation scores and trigger match details
 * - Selection status: "Selected", "Available", "Pinned"
 * - Pin/unpin actions for manual override
 * - Search/filter controls
 *
 * Styled with the Oblivion glass material from WS-2.6.
 *
 * References: VISUAL-DESIGN-SPEC.md Section 1.7 (glass),
 * combined-recommendations.md "template browser for manual override"
 */

import { AnimatePresence, motion } from 'motion/react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@tarva/ui'
import { Input } from '@tarva/ui'
import { Button } from '@tarva/ui'
import { Badge } from '@tarva/ui'
import { ScrollArea } from '@tarva/ui'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { AppIdentifier } from '@/lib/interfaces/types'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type { UseTemplateBrowserReturn } from '@/hooks/use-template-browser'
import { TemplateBrowserItem } from './template-browser-item'
import './template-browser.css'

// ============================================================================
// Props
// ============================================================================

export interface TemplateBrowserProps {
  /** The template browser hook state and methods. */
  readonly browser: UseTemplateBrowserReturn
  /** The template registry (to list all templates). */
  readonly registry: StationTemplateRegistry
}

// ============================================================================
// Component
// ============================================================================

export function TemplateBrowser({ browser, registry }: TemplateBrowserProps) {
  const { state } = browser

  if (!state.districtId) return null

  const districtId = state.districtId
  const allTemplates = registry
    .getTemplatesForDistrict(districtId)
    .filter((t) => {
      // Apply search filter.
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase()
        return t.displayName.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      }
      return true
    })
    .filter((t) => {
      // Apply category filter.
      if (state.categoryFilter) {
        return t.category === state.categoryFilter
      }
      return true
    })

  const selectedIds = new Set(state.lastSelectionResult?.selected.map((s) => s.template.id) ?? [])

  const scoredMap = new Map(
    [
      ...(state.lastSelectionResult?.selected ?? []),
      ...(state.lastSelectionResult?.alternatives ?? []),
    ].map((s) => [s.template.id, s])
  )

  return (
    <Dialog open={state.isOpen} onOpenChange={(open) => !open && browser.close()}>
      <DialogContent className="template-browser-dialog max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal
              className="h-4 w-4 opacity-70"
              style={{ color: 'var(--color-ember-bright)' }}
            />
            <span className="font-sans text-[16px] font-semibold tracking-[0.02em]">
              Station Templates
            </span>
            <Badge variant="outline" className="ml-2 text-[10px]">
              {APP_DISPLAY_NAMES[districtId]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Search and filter controls */}
        <div className="flex items-center gap-2 px-1 pb-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 opacity-40" />
            <Input
              placeholder="Search templates..."
              value={state.searchQuery}
              onChange={(e) => browser.setSearchQuery(e.target.value)}
              className="h-8 border-white/[0.06] bg-transparent pl-8 text-[13px]"
            />
          </div>
          <div className="flex gap-1">
            <Button
              variant={state.categoryFilter === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => browser.setCategoryFilter(null)}
              className="h-8 text-[11px]"
            >
              All
            </Button>
            <Button
              variant={state.categoryFilter === 'universal' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => browser.setCategoryFilter('universal')}
              className="h-8 text-[11px]"
            >
              Universal
            </Button>
            <Button
              variant={state.categoryFilter === 'app-specific' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => browser.setCategoryFilter('app-specific')}
              className="h-8 text-[11px]"
            >
              App-Specific
            </Button>
          </div>
        </div>

        {/* Template list */}
        <ScrollArea className="max-h-[400px]">
          <AnimatePresence mode="popLayout">
            {allTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <TemplateBrowserItem
                  template={template}
                  scored={scoredMap.get(template.id) ?? null}
                  isSelected={selectedIds.has(template.id)}
                  isPinned={browser.isPinned(template.id)}
                  onPin={() => browser.pinTemplate(districtId, template.id, template.displayName)}
                  onUnpin={() =>
                    browser.unpinTemplate(districtId, template.id, template.displayName)
                  }
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {allTemplates.length === 0 && (
            <div className="py-8 text-center text-[13px] opacity-40">
              No templates match your search.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
```

### 4.12 Template Browser Item -- `src/components/stations/template-browser/template-browser-item.tsx`

```tsx
'use client'

/**
 * TemplateBrowserItem -- Single template card in the browser.
 *
 * Displays:
 * - Template name and description
 * - Score bar (visual representation of finalScore)
 * - Trigger match details (expandable)
 * - Selection status badge
 * - Pin/unpin button
 */

import { useState } from 'react'
import { Pin, PinOff, ChevronDown, ChevronUp, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@tarva/ui'
import { Badge } from '@tarva/ui'
import { Tooltip, TooltipContent, TooltipTrigger } from '@tarva/ui'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { ScoredTemplate } from '@/lib/template-selection/types'

// ============================================================================
// Props
// ============================================================================

export interface TemplateBrowserItemProps {
  /** The template to display. */
  readonly template: StationTemplate
  /** Scored data (null if no scoring has been performed). */
  readonly scored: ScoredTemplate | null
  /** Whether this template is currently selected. */
  readonly isSelected: boolean
  /** Whether this template is pinned by the user. */
  readonly isPinned: boolean
  /** Callback to pin this template. */
  readonly onPin: () => void
  /** Callback to unpin this template. */
  readonly onUnpin: () => void
}

// ============================================================================
// Component
// ============================================================================

export function TemplateBrowserItem({
  template,
  scored,
  isSelected,
  isPinned,
  onPin,
  onUnpin,
}: TemplateBrowserItemProps) {
  const [expanded, setExpanded] = useState(false)

  const finalScore = scored?.finalScore ?? 0
  const scorePercent = Math.round(finalScore * 100)

  return (
    <div
      className={[
        'border-b border-white/[0.04] px-3 py-2.5 transition-colors duration-150',
        isSelected ? 'bg-white/[0.04]' : 'bg-transparent',
        'hover:bg-white/[0.03]',
      ].join(' ')}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Selection indicator */}
          {isSelected ? (
            <CheckCircle
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: 'var(--status-success)' }}
            />
          ) : (
            <Circle className="h-3.5 w-3.5 shrink-0 opacity-20" />
          )}

          {/* Template name */}
          <span className="truncate font-sans text-[13px] font-medium tracking-[0.01em]">
            {template.displayName}
          </span>

          {/* Category badge */}
          <Badge variant="outline" className="shrink-0 text-[9px] opacity-60">
            {template.category === 'universal' ? 'UNI' : 'APP'}
          </Badge>

          {/* Pinned badge */}
          {isPinned && (
            <Badge variant="secondary" className="shrink-0 text-[9px]">
              PINNED
            </Badge>
          )}
        </div>

        {/* Score + actions */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Score bar */}
          {scored && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${scorePercent}%`,
                        backgroundColor:
                          scorePercent > 70
                            ? 'var(--status-success)'
                            : scorePercent > 40
                              ? 'var(--color-ember-bright)'
                              : 'var(--status-neutral)',
                      }}
                    />
                  </div>
                  <span className="w-7 text-right font-mono text-[10px] tabular-nums opacity-50">
                    {scorePercent}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-0.5 text-[11px]">
                  <div>Trigger: {Math.round(scored.triggerScore * 100)}%</div>
                  <div>Priority: {Math.round(scored.priorityScore * 100)}%</div>
                  <div>Final: {scorePercent}%</div>
                </div>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Pin/unpin button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={isPinned ? onUnpin : onPin}
              >
                {isPinned ? (
                  <PinOff className="h-3 w-3 opacity-60" />
                ) : (
                  <Pin className="h-3 w-3 opacity-30" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPinned ? 'Unpin (remove override)' : 'Pin (always show this station)'}
            </TooltipContent>
          </Tooltip>

          {/* Expand trigger details */}
          {scored && scored.hasTriggers && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3 opacity-40" />
              ) : (
                <ChevronDown className="h-3 w-3 opacity-40" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mt-0.5 ml-5 line-clamp-2 text-[11px] leading-tight opacity-40">
        {template.description}
      </p>

      {/* Expanded trigger details */}
      {expanded && scored && scored.hasTriggers && (
        <div className="mt-2 ml-5 space-y-0.5">
          {scored.triggerDetails.map((detail, i) => (
            <div
              key={i}
              className={[
                'font-mono text-[10px] leading-snug',
                detail.matched ? 'opacity-70' : 'opacity-30',
              ].join(' ')}
            >
              <span className={detail.matched ? 'text-green-400' : 'text-red-400'}>
                {detail.matched ? 'PASS' : 'FAIL'}
              </span>{' '}
              {detail.explanation}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 4.13 Template Browser CSS -- `src/components/stations/template-browser/template-browser.css`

```css
/* =================================================================
   Template Browser -- Glass Material Override
   Uses Active Glass from VISUAL-DESIGN-SPEC.md Section 1.7
   ================================================================= */

.template-browser-dialog {
  background: rgba(15, 22, 31, 0.95);
  backdrop-filter: blur(20px) saturate(130%);
  -webkit-backdrop-filter: blur(20px) saturate(130%);
  border: 1px solid rgba(224, 82, 0, 0.15);
  box-shadow:
    0 0 20px rgba(224, 82, 0, 0.06),
    0 0 4px rgba(224, 82, 0, 0.12),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.04);
  border-radius: 16px;
}

/* Override @tarva/ui Dialog default background */
.template-browser-dialog[data-state='open'] {
  animation: template-browser-enter 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes template-browser-enter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .template-browser-dialog[data-state='open'] {
    animation: none;
  }
}
```

### 4.14 Barrel Exports

**`src/lib/template-selection/index.ts`**:

```ts
// Template Selection System -- Public API

// Types
export type {
  TriggerEvaluationResult,
  ScoredTemplate,
  SelectionResult,
  SelectionConfig,
  PinnedOverride,
  TemplateBrowserState,
} from './types'

export { DEFAULT_SELECTION_CONFIG } from './types'

// Trigger Evaluator
export {
  resolvePath,
  applyOperator,
  evaluateCondition,
  evaluateAllConditions,
} from './trigger-evaluator'

// Template Scorer
export { scoreTemplate, scoreAllTemplates } from './template-scorer'

// Template Selector
export { selectTemplates } from './template-selector'

// Dynamic Registry
export { DynamicStationTemplateRegistry } from './dynamic-registry'

// Conditional Templates
export { CONDITIONAL_TEMPLATES } from './conditional-templates'

// Receipt Generation
export { recordSelectionReceipt, recordPinReceipt } from './selection-receipt'
```

**`src/components/stations/template-browser/index.ts`**:

```ts
// Template Browser -- Public API

export { TemplateBrowser } from './template-browser'
export { TemplateBrowserItem } from './template-browser-item'

export type { TemplateBrowserProps } from './template-browser'
export type { TemplateBrowserItemProps } from './template-browser-item'
```

---

## 5. Acceptance Criteria

| ID    | Criterion                                                                                                                                                                                                                                                | Verification Method                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| AC-1  | `DynamicStationTemplateRegistry` implements the `StationTemplateRegistry` interface from WS-1.7 with zero TypeScript errors                                                                                                                              | `pnpm typecheck` passes; interface conformance verified                          |
| AC-2  | `DynamicStationTemplateRegistry` inherits all AD-8 static templates from `StaticStationTemplateRegistry` -- calling `getTemplatesForDistrict('agent-builder')` without context returns Launch, Status, Pipeline, Library, plus any conditional templates | Unit test: verify template count and IDs                                         |
| AC-3  | `evaluateTriggers()` returns a score between 0.0 and 1.0 for templates with non-empty trigger arrays; returns 0.0 for templates with empty triggers                                                                                                      | Unit test with mock `SystemSnapshot`                                             |
| AC-4  | `resolvePath(snapshot, "apps.agent-builder.alertCount")` correctly resolves to the numeric value of `snapshot.apps['agent-builder'].alertCount`                                                                                                          | Unit test with nested object                                                     |
| AC-5  | `resolvePath` returns `undefined` for invalid paths without throwing                                                                                                                                                                                     | Unit test: `resolvePath(snapshot, "apps.nonexistent.foo")` returns `undefined`   |
| AC-6  | `applyOperator('gt', 5, 3)` returns `true`; `applyOperator('gt', 1, 3)` returns `false`; all 7 operators produce correct results for valid inputs                                                                                                        | Unit test matrix covering all operators                                          |
| AC-7  | `applyOperator` returns `false` (not throws) for type mismatches (e.g., `applyOperator('gt', "hello", 3)`)                                                                                                                                               | Unit test with type-mismatched inputs                                            |
| AC-8  | `scoreTemplate` returns `triggerScore = 1.0` when all conditions match with full weight; `triggerScore = 0.0` when no conditions match                                                                                                                   | Unit test with all-match and no-match scenarios                                  |
| AC-9  | `scoreAllTemplates` returns templates sorted by `finalScore` descending, with universal templates ranked above app-specific templates when scores are equal                                                                                              | Unit test with mixed template set                                                |
| AC-10 | `selectTemplates` respects `maxTemplatesPerDistrict` -- never returns more than 5 templates (default config)                                                                                                                                             | Unit test with > 5 eligible templates                                            |
| AC-11 | `selectTemplates` respects `minTemplatesPerDistrict` -- always returns at least 2 universal templates even when no triggers match                                                                                                                        | Unit test with all conditions failing                                            |
| AC-12 | `selectTemplates` includes pinned templates regardless of their score                                                                                                                                                                                    | Unit test: pin a zero-score template, verify it appears in the selected set      |
| AC-13 | When two templates have `finalScore` values within `tieThreshold` (0.05) and AI tie-breaking is enabled, `selectTemplates` calls `aiRouter.route()` with `feature: 'station-template-selection'`                                                         | Unit test with mock AIRouter; verify `route()` called with correct feature       |
| AC-14 | When AI tie-breaking fails (returns `success: false`), `selectTemplates` falls back to priority ordering without error                                                                                                                                   | Unit test with mock AIRouter returning failure                                   |
| AC-15 | Every call to `selectTemplates` produces a `SelectionResult` with a unique `correlationId` and `timestamp`                                                                                                                                               | Unit test: verify non-null, ISO 8601 format                                      |
| AC-16 | `recordSelectionReceipt` calls `receiptStore.record()` with `eventType: 'system'`, `actor: 'system'` (or `'ai'` when AI was used), and a `detail` payload containing `selectedTemplates` and `alternativeTemplates` arrays                               | Unit test with mock ReceiptStore                                                 |
| AC-17 | `recordPinReceipt` calls `receiptStore.record()` with `eventType: 'action'`, `actor: 'human'`, and the correct pin/unpin summary                                                                                                                         | Unit test with mock ReceiptStore                                                 |
| AC-18 | `useTemplateSelection` hook re-runs selection when the `SystemSnapshot` changes meaningfully (health state or alert count transition), debounced by 2 seconds                                                                                            | Integration test with mock SystemStateProvider emitting snapshots                |
| AC-19 | `useTemplateSelection` hook does NOT re-run selection when the `SystemSnapshot` changes non-meaningfully (e.g., only `timestamp` or `freshnessMs` changed)                                                                                               | Integration test verifying debounce key stability                                |
| AC-20 | `TemplateBrowser` dialog renders with the Oblivion glass material (`backdrop-filter: blur(20px)`, dark background, ember border glow)                                                                                                                    | Visual inspection; computed style assertion on dialog element                    |
| AC-21 | `TemplateBrowserItem` displays a score bar that visually represents the template's `finalScore` (green > 70%, ember 40-70%, gray < 40%)                                                                                                                  | Visual inspection; style assertion on bar element                                |
| AC-22 | `TemplateBrowserItem` expanding trigger details shows each condition's PASS/FAIL status and explanation                                                                                                                                                  | Render test: expand item, verify trigger detail text                             |
| AC-23 | Pinning a template in the browser immediately includes it in the next selection result                                                                                                                                                                   | Integration test: pin, trigger re-selection, verify pinned template in result    |
| AC-24 | All TypeScript types use `readonly` on properties; no `any` types in public API                                                                                                                                                                          | Code review; TypeScript strict mode                                              |
| AC-25 | All conditional templates (`CONDITIONAL_TEMPLATES`) have non-empty `triggers` arrays with valid field paths that resolve against a well-formed `SystemSnapshot`                                                                                          | Unit test: evaluate each conditional template's triggers against a mock snapshot |

---

## 6. Decisions Made

| ID   | Decision                                                                                                                                           | Rationale                                                                                                                                                                                                                                                                                                                               | Source                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| D-1  | Trigger evaluator uses dot-path string resolution, not a typed accessor API                                                                        | Dot-paths (`"apps.agent-builder.alertCount"`) are the format already defined in WS-1.7's `TriggerCondition.field`. A typed accessor would require a refactor of the existing interface. Dot-paths are flexible enough for any future `SystemSnapshot` shape changes.                                                                    | WS-1.7 TriggerCondition type                                                      |
| D-2  | Scoring formula blends trigger score (70%) with priority score (30%)                                                                               | Trigger relevance should dominate selection -- a template that matches the current system state is more useful than a high-priority default. But priority provides stability: universal templates (priority 90-100) remain visible even without triggers because `0.0 * 0.7 + 1.0 * 0.3 = 0.30` is still a meaningful score.            | AD-7 (deterministic scoring preferred)                                            |
| D-3  | AI tie-breaking is optional and timeout-gated at 3 seconds                                                                                         | The rule engine is the primary provider (AD-7 routing table). AI tie-breaking is a quality enhancement, not a dependency. If Ollama is slow or unavailable, the system falls back instantly to priority ordering. 3 seconds is chosen because the user is already viewing the district (not waiting for navigation).                    | tech-decisions.md routing table; AD-7 graceful degradation                        |
| D-4  | Pin overrides are session-scoped (not persisted to Supabase)                                                                                       | Pins are temporary overrides, not permanent configuration. The "disposable" philosophy applies: the system re-evaluates on every meaningful state change, and stale pins become irrelevant. Persisting pins would require schema changes in WS-3.1 and add complexity without clear value for a single-user localhost tool.             | combined-recommendations.md "disposable stations"; AD-6 (mutations-only receipts) |
| D-5  | Re-selection is debounced by 2 seconds and triggered only on meaningful state changes (health transitions, alert count changes)                    | Telemetry polls every 10-15 seconds. Re-scoring on every poll would generate excessive receipts and CPU work. A "meaningful change" filter (health state or alert count) ensures re-selection happens only when the station set should actually change. The 2-second debounce prevents flicker during rapid state transitions.          | AD-5 (adaptive polling); performance budget                                       |
| D-6  | `DynamicStationTemplateRegistry` inherits from `StaticStationTemplateRegistry` via composition (instantiation in constructor), not class extension | Composition over inheritance. The static registry is a concrete class with hardcoded `registerDefaults()`. Extending it would couple the dynamic registry to the static class's internal structure. Composition (create static, copy templates) is more robust and allows the dynamic registry to modify inherited templates if needed. | Engineering best practice                                                         |
| D-7  | Conditional templates use the same `StationTemplate` type as static templates -- no new type is needed                                             | WS-1.7 already designed `StationTemplate` with `triggers` and `disposable` fields for Phase 3 use. Conditional templates simply populate these fields. No type extension is required, which validates the Phase 1 interface design.                                                                                                     | WS-1.7 Design Decision D-5                                                        |
| D-8  | The template browser is a `Dialog` (modal overlay), not a sidebar or panel                                                                         | The browser is an occasional tool, not a persistent UI surface. A modal focuses attention on the selection task without competing with the spatial canvas. It closes after the user finishes configuring pins. The dialog uses glass material to stay visually consistent with station panels.                                          | UX precedent (command palette is also a modal overlay)                            |
| D-9  | Each `TriggerEvaluationResult` includes a human-readable `explanation` string                                                                      | The explanation is shown in the template browser's expanded trigger details and stored in the receipt `detail` payload. Human-readable audit trails are a non-negotiable per AD-6 and the "every AI decision generates a Receipt" directive.                                                                                            | AD-6 (Receipt System); AD-7 (audit trail)                                         |
| D-10 | The `SelectionResult.alternatives` array includes ALL evaluated templates that were not selected, not just the next-best                           | Full alternative visibility supports the template browser (user can see what was available) and the receipt audit trail (reviewers can see the complete decision landscape). The performance cost is negligible -- there are at most 10-15 templates per district.                                                                      | Audit completeness                                                                |

---

## 7. Open Questions

| #    | Question                                                                                                                                                                                                                                                                             | Impact                                                                                                                                                                                                        | Owner           | Resolution Deadline                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------- |
| OQ-1 | Should the selection receipt fire on EVERY re-selection (including debounced re-evaluations that produce the same result), or only when the selected set actually changes?                                                                                                           | Medium -- firing on every re-selection produces more receipts but a complete audit trail; firing only on changes reduces noise but may miss "the system re-evaluated and confirmed the same templates" events | Architect       | Before implementation begins                            |
| OQ-2 | What is the prompt template for AI tie-breaking? The current implementation sends template names, descriptions, and scores -- should it also include the full trigger evaluation details?                                                                                            | Low -- affects AI response quality but the tie-breaker is a fallback mechanism; incorrect AI ranking is caught by the priority fallback                                                                       | AI Engineer     | WS-3.4 (AI Camera Director establishes Ollama patterns) |
| OQ-3 | Should the template browser be accessible from the command palette (e.g., `"show templates"`, `"browse stations"`)?                                                                                                                                                                  | Low -- adds discoverability but requires WS-3.3 (Command Palette) to register a new command                                                                                                                   | React Developer | WS-3.3 (Command Palette)                                |
| OQ-4 | Should conditional templates include `disposable: true` or `disposable: false`? The current implementation uses `false` because these are pre-built templates, not AI-generated. But the combined-recommendations.md discusses "disposable stations" in the context of AI selection. | Medium -- affects how the system treats conditional templates during cleanup; `disposable: true` might trigger automatic removal logic in a future phase                                                      | Architect       | Before implementation begins                            |
| OQ-5 | How should the template browser be opened? Options: (a) a button in the district header at Z2, (b) a command palette command, (c) a keyboard shortcut, (d) all of the above.                                                                                                         | Low -- UX preference; all options are technically feasible                                                                                                                                                    | UX Designer     | Before implementation begins                            |
| OQ-6 | Should the system generate a receipt when re-selection produces the exact same template set as before (i.e., a "no change" receipt)? This is related to OQ-1 but specifically about the receipt content format.                                                                      | Low -- "no change" receipts are useful for proving the system actively monitors state but may clutter the Evidence Ledger                                                                                     | Architect       | Before implementation begins                            |

---

## 8. Risk Register

| ID  | Risk                                                                                                                                                                                                                           | Likelihood | Impact | Severity | Mitigation                                                                                                                                                                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | `resolvePath` dot-path resolution fails for deeply nested or dynamically-typed fields in `SystemSnapshot`                                                                                                                      | Medium     | Medium | Medium   | Extensive unit tests covering all field paths used in conditional templates. The evaluator returns `false` (never throws) for unresolvable paths, so the worst case is a missed trigger -- not a crash.                                                                                                                                         |
| R-2 | AI tie-breaking via Ollama produces rankings that contradict the rule engine's scoring, confusing the user                                                                                                                     | Low        | Medium | Low      | AI is only consulted for ties (scores within 0.05 of each other). If the AI ranking differs from priority ordering, the user can see both in the template browser. Pin overrides give the user final authority. The receipt records the AI's reasoning.                                                                                         |
| R-3 | Excessive receipt generation from frequent re-selections overwhelms the `ReceiptStore` or Evidence Ledger                                                                                                                      | Medium     | Medium | Medium   | Debounced re-selection (2 seconds) limits frequency. The meaningful-change filter prevents re-selection on every telemetry poll. OQ-1 proposes a further optimization: only generate receipts when the selected set changes. Expected volume: 1-3 selection receipts per district per session.                                                  |
| R-4 | Template scoring produces unexpected results when multiple conditions in a template have overlapping semantics (e.g., `health == 'DEGRADED'` weight 0.6 AND `health == 'DOWN'` weight 1.0 -- both cannot match simultaneously) | Low        | Low    | Low      | OR-style trigger semantics: conditions are evaluated independently, and a template scores well if ANY relevant condition matches. Overlapping conditions with different values are a feature, not a bug -- they create a graduated response (DEGRADED = moderate score, DOWN = high score). Document this pattern in the conditional templates. |
| R-5 | `DynamicStationTemplateRegistry` and `StaticStationTemplateRegistry` fall out of sync when new templates are added to AD-8 in Phase 2 workstreams                                                                              | Medium     | Medium | Medium   | The dynamic registry inherits from the static registry at construction time. Any template added to `StaticStationTemplateRegistry.registerDefaults()` is automatically inherited. If a Phase 2 workstream adds a template directly to the static registry, the dynamic registry picks it up.                                                    |
| R-6 | The template browser Dialog competes with the command palette for visual attention, or both are open simultaneously                                                                                                            | Low        | Low    | Low      | The Dialog has its own `open` state managed by `useTemplateBrowser`. The command palette and template browser do not share a trigger. If both are open, the browser Dialog renders above the palette (z-index ordering). Close-on-escape is standard Dialog behavior.                                                                           |
| R-7 | The 2-second debounce is too slow for rapid health state transitions (e.g., app goes DOWN then OPERATIONAL within 2 seconds)                                                                                                   | Low        | Medium | Low      | The debounce ensures the system settles before re-selecting. If a rapid transition occurs, the final state is captured. The `forceReselect()` method is available for consumers that need immediate re-selection. The 2-second value can be tuned via `SelectionConfig`.                                                                        |
| R-8 | Pin overrides are lost on page refresh, surprising the user                                                                                                                                                                    | Medium     | Low    | Low      | This is by design (Decision D-4). The disposable philosophy treats pins as temporary. If user feedback indicates persistence is needed, a future workstream can add Supabase persistence for `PinnedOverride[]` without changing the `useTemplateBrowser` API.                                                                                  |

---

## 9. Implementation Checklist

Ordered by dependency. Each item should be a single, testable commit.

- [ ] 1. Create file structure: `src/lib/template-selection/` and `src/components/stations/template-browser/` directories with all files listed in Section 4.1.
- [ ] 2. Write `src/lib/template-selection/types.ts` with all selection types, `DEFAULT_SELECTION_CONFIG`, and `PinnedOverride`. (Deliverable 4.2)
- [ ] 3. Implement `src/lib/template-selection/trigger-evaluator.ts` with `resolvePath`, `applyOperator`, `evaluateCondition`, `evaluateAllConditions`, and `buildExplanation`. (Deliverable 4.3)
- [ ] 4. Write unit tests for trigger evaluator: dot-path resolution (valid, invalid, deeply nested, hyphenated keys), all 7 operators (valid + type mismatch + edge cases), explanation string format. (`__tests__/trigger-evaluator.test.ts`)
- [ ] 5. Implement `src/lib/template-selection/template-scorer.ts` with `scoreTemplate` and `scoreAllTemplates`. (Deliverable 4.4)
- [ ] 6. Write unit tests for template scorer: all-match score = 1.0, no-match score = 0.0, partial match, empty triggers, sort order verification. (`__tests__/template-scorer.test.ts`)
- [ ] 7. Implement `src/lib/template-selection/template-selector.ts` with `selectTemplates` and AI tie-breaking logic. (Deliverable 4.5)
- [ ] 8. Write unit tests for template selector: max/min constraints, pin override inclusion, tie detection, AI routing mock, AI failure fallback. (`__tests__/template-selector.test.ts`)
- [ ] 9. Implement `src/lib/template-selection/conditional-templates.ts` with all Phase 3 conditional template definitions. (Deliverable 4.6)
- [ ] 10. Implement `src/lib/template-selection/dynamic-registry.ts` with `DynamicStationTemplateRegistry`. (Deliverable 4.7)
- [ ] 11. Write unit tests for dynamic registry: inherits all static templates, registers conditional templates, `evaluateTriggers` returns real scores, `getTemplatesForDistrict` with and without context. (`__tests__/dynamic-registry.test.ts`)
- [ ] 12. Implement `src/lib/template-selection/selection-receipt.ts` with `recordSelectionReceipt` and `recordPinReceipt`. (Deliverable 4.8)
- [ ] 13. Write barrel export `src/lib/template-selection/index.ts`. (Deliverable 4.14)
- [ ] 14. Implement `src/hooks/use-template-selection.ts` with debounced re-selection and meaningful-change detection. (Deliverable 4.9)
- [ ] 15. Implement `src/hooks/use-template-browser.ts` with pin/unpin state and receipt generation. (Deliverable 4.10)
- [ ] 16. Write `src/components/stations/template-browser/template-browser.css` with glass material and animation styles. (Deliverable 4.13)
- [ ] 17. Implement `src/components/stations/template-browser/template-browser-item.tsx` with score bar, trigger details expansion, and pin/unpin button. (Deliverable 4.12)
- [ ] 18. Implement `src/components/stations/template-browser/template-browser.tsx` with dialog, search/filter, and template list. (Deliverable 4.11)
- [ ] 19. Write barrel export `src/components/stations/template-browser/index.ts`. (Deliverable 4.14)
- [ ] 20. Run `pnpm typecheck` -- verify zero errors across all new files.
- [ ] 21. Run `pnpm lint` -- verify zero errors.
- [ ] 22. Run `pnpm format` to normalize all files.
- [ ] 23. Commit with message: `"feat: implement dynamic station template selection with rule-based scoring and template browser (WS-3.5)"`
