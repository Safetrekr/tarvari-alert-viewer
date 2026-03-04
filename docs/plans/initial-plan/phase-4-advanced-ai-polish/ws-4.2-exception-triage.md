# WS-4.2: Exception Triage

> **Workstream ID:** WS-4.2
> **Phase:** 4 -- Advanced AI + Polish
> **Assigned Agent:** `world-class-autonomous-interface-architect`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.5 (Telemetry aggregator, SystemSnapshot, alert data), WS-1.7 (AIRouter interface, SystemStateProvider, ReceiptStore, HealthState), WS-2.6 (Station panel framework), WS-3.4 (LiveAIRouter, ai.store.ts, OllamaProvider via shared ollama-client.ts), WS-3.5 (StationTemplateRegistry, DynamicStationTemplateRegistry), WS-3.7 (Attention choreography -- tighten mode), WS-4.1 (Claude API integration -- fallback for complex triage)
> **Blocks:** None (terminal phase)
> **Resolves:** AD-7 interface #5 `exception-triage` routing entry, combined-recommendations.md Phase 4 Work Area #2 (Exception Triage), tech-decisions.md AI Routing Table `exception-triage: Ollama primary, rule-engine fallback`

---

## 1. Objective

Deliver the Exception Triage system -- an AI-powered failure classification and recovery pipeline that transforms cryptic system errors into actionable intervention stations. When a district reports exceptions (health DEGRADED or DOWN, alert count > 0, error events in telemetry), the triage system classifies each failure into one of four categories, selects a recovery UI template from the `StationTemplateRegistry`, and generates an intervention station -- a dynamically configured station panel that explains the failure in plain language and offers concrete recovery actions.

The system uses the `LiveAIRouter` from WS-3.4 to route classification requests. Per tech-decisions.md, the routing is `exception-triage: Ollama primary, rule-engine fallback`. The rule engine handles common, well-understood failure patterns (connection refused, timeout, 5xx errors) deterministically. Ollama handles ambiguous or novel failures that require semantic understanding of error messages and system context. When WS-4.1's Claude API integration is available, complex multi-app cascading failures can be escalated to Claude for deeper analysis.

The four exception categories and their recovery patterns are:

| Category         | Meaning                                                                                            | Recovery Action                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Transient**    | Temporary failure likely to self-resolve (network blip, timeout, rate limit)                       | Retry panel with countdown timer and manual retry button                              |
| **Permanent**    | Unrecoverable failure requiring human intervention (crash, data corruption, dependency missing)    | Escalation panel with error details, suggested next steps, and link to open the app   |
| **Policy**       | Failure caused by configuration or rule violation (auth expired, feature flag off, resource limit) | Configuration panel showing the policy violation and what setting to change           |
| **Missing-Info** | Cannot classify -- additional context needed (incomplete error, unknown error code)                | Information-request panel asking the user to provide context or check specific things |

Every triage decision generates a receipt with full AI metadata (classification rationale, confidence, alternatives considered, provider, latency) per AD-6. The triage system integrates with WS-3.7's attention choreography -- when active exceptions exist, the system signals "tighten" mode to reduce ambient motion and surface next-best-actions.

**Success looks like:** Project Room reports 3 alerts and health DEGRADED. The telemetry hook detects the condition and triggers classification. The rule engine instantly classifies "ECONNREFUSED on port 3010" as `transient` (connection refused -- app may be restarting). An intervention station materializes in the Project Room district showing: a retry panel with a 30-second countdown, the error message in plain language ("Project Room's server isn't responding -- it may be restarting"), a manual retry button, and a "still broken?" escalation link. A receipt stamps the classification with full metadata. If the retry succeeds, the intervention station auto-dismisses with a success animation.

**Why this workstream matters:** Exception Triage completes the "intelligent mission control" vision. Without it, the Launch shows red dots and alert counts but leaves the user to figure out what went wrong and what to do. With it, every failure becomes an interactive station that guides recovery -- transforming the Launch from a dashboard into an operations assistant.

**Traceability:** AD-7 (AI Integration Architecture -- `exception-triage` routing entry), AD-6 (Receipt System -- AI receipts with classification metadata), tech-decisions.md (Feature-by-Feature AI Routing: `exception-triage: Ollama primary, rule-engine fallback`), combined-recommendations.md Phase 4 Work Area #2, Risk #4 (existing apps lack standardized health endpoints -- triage must handle partial/missing error data gracefully).

---

## 2. Scope

### In Scope

| #   | Item                               | Description                                                                                                                            |
| --- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Exception classifier               | AI/rule-engine classification of failures into transient/permanent/policy/missing-info with confidence scores                          |
| 2   | Rule engine classifier             | Deterministic pattern-matching classifier for common failure modes (connection refused, timeout, 5xx, auth errors)                     |
| 3   | Ollama classifier prompt           | Context assembler that builds a prompt for Ollama to classify ambiguous failures                                                       |
| 4   | Recovery template definitions      | Four `StationTemplate` objects (one per exception category) registered with the `StationTemplateRegistry`                              |
| 5   | Intervention station generator     | Creates dynamic station configurations from classification results, populating template variables with error-specific data             |
| 6   | Triage store                       | Zustand store tracking active exceptions, their classifications, intervention states, and resolution history                           |
| 7   | Exception triage hook              | React hook that monitors telemetry for exception conditions and triggers classification                                                |
| 8   | InterventionStation component      | React component that renders the recovery UI based on classification, with retry timers, escalation actions, and resolution animations |
| 9   | Receipt generation                 | AI receipts for all triage classifications with full metadata                                                                          |
| 10  | Attention choreography integration | Signal WS-3.7 tighten mode when active exceptions exist                                                                                |
| 11  | Triage classification types        | TypeScript interfaces in `src/lib/interfaces/`                                                                                         |

### Out of Scope

| #   | Item                                                          | Reason                                                                                                                     |
| --- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | Automated remediation (auto-restart apps, auto-change config) | Safety concern -- Launch is read-only for external apps per combined-recommendations.md constraints                        |
| 2   | Custom exception rules UI                                     | Phase 5+ -- users cannot define their own classification patterns in this phase                                            |
| 3   | Cross-app cascading failure analysis                          | Requires mature Claude integration and multi-app correlation; deferred to Phase 5+                                         |
| 4   | Supabase persistence of triage history                        | Triage state is session-scoped (Zustand). Persisting across sessions is a future concern; receipts provide the audit trail |
| 5   | Push notifications for exceptions                             | Launch is a spatial dashboard, not an alerting system; polling-based detection is sufficient                               |
| 6   | Exception triage for the Launch itself                        | This system triages failures in the 6 monitored Tarva apps, not internal Launch errors                                     |

---

## 3. Input Dependencies

| Dependency                                       | Source                                                             | What It Provides                                                                                                            | Blocking?                                          |
| ------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `SystemSnapshot` type + `AppState`               | WS-1.7, `src/lib/interfaces/system-state-provider.ts`              | `SystemSnapshot`, `AppState`, `HealthState`, `GlobalMetrics` -- the telemetry data that triggers triage                     | Yes                                                |
| `SystemStateProvider` interface                  | WS-1.7 / WS-1.5, `src/lib/interfaces/system-state-provider.ts`     | `getSnapshot()` method to obtain current system state                                                                       | Yes                                                |
| `AIRouter` interface                             | WS-1.7 / WS-3.4, `src/lib/interfaces/ai-router.ts`                 | `AIRouter.route()`, `AIRequest`, `AIResponse`, `AIFeature` (`'exception-triage'`), `isAvailable()`                          | Yes                                                |
| `LiveAIRouter` implementation                    | WS-3.4, `src/lib/ai/live-ai-router.ts`                             | Production router with Ollama provider, fallback chains, rate limiting                                                      | Yes                                                |
| `OllamaProvider` (via shared `ollama-client.ts`) | WS-3.4 / WS-3.6, `src/lib/ai/ollama-provider.ts`                   | Chat completion for ambiguous failure classification                                                                        | Yes                                                |
| `ReceiptStore` interface                         | WS-1.7 / WS-3.1, `src/lib/interfaces/receipt-store.ts`             | `ReceiptStore.record()`, `ReceiptInput`, `AIReceiptMetadata` types                                                          | Yes                                                |
| `StationTemplateRegistry`                        | WS-3.5, `src/lib/template-selection/dynamic-registry.ts`           | `DynamicStationTemplateRegistry.registerTemplate()` to register recovery templates                                          | Yes                                                |
| `StationTemplate` type                           | WS-1.7 / WS-3.5, `src/lib/interfaces/station-template-registry.ts` | `StationTemplate`, `StationLayout`, `StationAction`, `TriggerCondition`                                                     | Yes                                                |
| Station Panel Framework                          | WS-2.6, `src/components/stations/`                                 | `StationPanel` component, glass material CSS, 3-zone layout (header/body/actions)                                           | Yes                                                |
| AI store                                         | WS-3.4, `src/stores/ai.store.ts`                                   | `useAIStore` for tracking AI request state, provider statuses                                                               | Yes                                                |
| Attention choreography                           | WS-3.7                                                             | `setAttentionMode('tighten')` / `setAttentionMode('calm')` signals                                                          | Soft -- can stub the signal                        |
| Claude API integration                           | WS-4.1                                                             | `claude` provider in `LiveAIRouter` for complex triage escalation                                                           | Soft -- Ollama + rule-engine sufficient without it |
| Shared domain types                              | WS-1.7, `src/lib/interfaces/types.ts`                              | `AppIdentifier`, `HealthState`, `ISOTimestamp`, `Actor`, `EventType`, `Severity`                                            | Yes                                                |
| `zod` npm package                                | npm                                                                | Schema validation for Ollama triage responses                                                                               | Yes                                                |
| `motion/react` v12+                              | npm                                                                | Animation for intervention station entrance/exit and resolution effects                                                     | Yes                                                |
| @tarva/ui components                             | npm                                                                | `Button`, `Badge`, `Card`, `ScrollArea`, `Tooltip`, `Progress`                                                              | Yes                                                |
| Lucide React                                     | npm                                                                | Icon components (`AlertTriangle`, `RefreshCw`, `Settings`, `HelpCircle`, `CheckCircle`, `XCircle`, `Clock`, `ExternalLink`) | Yes                                                |
| VISUAL-DESIGN-SPEC.md                            | Discovery docs                                                     | Glass material recipes, glow tokens, status colors                                                                          | Reference                                          |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  lib/
    interfaces/
      exception-triage.ts               # Core triage types (ExceptionCategory, ClassificationResult, etc.)
    ai/
      exception-classifier.ts           # AI/rule-engine failure classifier
      exception-rules.ts                # Deterministic rule engine patterns
      exception-prompt.ts               # Ollama prompt assembler for ambiguous failures
      intervention-generator.ts         # Creates station configs from classification results
  stores/
    triage.store.ts                     # Zustand store for active exceptions and interventions
  hooks/
    use-exception-triage.ts             # Monitors telemetry, triggers classification
  components/
    ai/
      InterventionStation.tsx           # Recovery UI renderer
      intervention-panels/
        RetryPanel.tsx                  # Transient failure recovery
        EscalationPanel.tsx             # Permanent failure recovery
        ConfigurationPanel.tsx          # Policy failure recovery
        InformationRequestPanel.tsx     # Missing-info recovery
```

### 4.2 Exception Triage Types -- `src/lib/interfaces/exception-triage.ts`

```ts
/**
 * Exception Triage types.
 *
 * Defines the classification taxonomy and data structures for the
 * exception triage system. Failures are classified into four categories,
 * each mapping to a recovery UI template.
 *
 * References: AD-7 (AI Integration Architecture),
 * tech-decisions.md (exception-triage: Ollama primary, rule-engine fallback),
 * combined-recommendations.md Phase 4 Work Area #2
 */

import type { AppIdentifier, HealthState, ISOTimestamp } from './types'
import type { AIProvider } from './ai-router'

// ============================================================================
// Exception Categories
// ============================================================================

/**
 * The four failure classification categories.
 *
 * Each category maps to a recovery UI template and a set of
 * recommended actions.
 */
export type ExceptionCategory =
  | 'transient' // Temporary -- retry likely to succeed
  | 'permanent' // Unrecoverable -- requires human intervention
  | 'policy' // Configuration/rule violation -- change a setting
  | 'missing-info' // Cannot classify -- need more context

// ============================================================================
// Exception Source Data
// ============================================================================

/**
 * Raw exception data extracted from telemetry.
 * This is the input to the classifier.
 */
export interface ExceptionData {
  /** Unique ID for this exception instance. */
  readonly id: string
  /** Which app reported the exception. */
  readonly districtId: AppIdentifier
  /** The app's display name. */
  readonly displayName: string
  /** Current health state of the app. */
  readonly health: HealthState
  /** Number of active alerts. */
  readonly alertCount: number
  /** Raw error message, if available. */
  readonly errorMessage: string | null
  /** HTTP status code, if applicable. */
  readonly httpStatus: number | null
  /** Error code identifier (e.g., 'ECONNREFUSED', 'ETIMEDOUT'). */
  readonly errorCode: string | null
  /** The app's pulse description (e.g., '3 runs active'). */
  readonly pulse: string | null
  /** Last known event from telemetry. */
  readonly lastEvent: string | null
  /** How long since last successful health check (ms). */
  readonly downDurationMs: number | null
  /** Timestamp when the exception was detected. */
  readonly detectedAt: ISOTimestamp
  /** Previous health state (for transition detection). */
  readonly previousHealth: HealthState | null
}

// ============================================================================
// Classification Result
// ============================================================================

/**
 * The output of the exception classifier.
 * Contains the category, confidence, and reasoning for the classification.
 */
export interface ClassificationResult {
  /** The classified category. */
  readonly category: ExceptionCategory
  /** Confidence in the classification (0.0-1.0). */
  readonly confidence: number
  /** Human-readable explanation of why this category was chosen. */
  readonly reasoning: string
  /** Which provider performed the classification. */
  readonly provider: AIProvider
  /** Alternative classifications considered. */
  readonly alternatives: readonly AlternativeClassification[]
  /** End-to-end classification latency in ms. */
  readonly latencyMs: number
  /** Ollama model ID, if LLM was used. */
  readonly modelId: string | null
  /** Suggested recovery actions based on the classification. */
  readonly suggestedActions: readonly SuggestedAction[]
  /** Plain-language summary of the failure for the user. */
  readonly userSummary: string
}

/** An alternative classification that was considered but not chosen. */
export interface AlternativeClassification {
  readonly category: ExceptionCategory
  readonly confidence: number
  readonly reason: string
}

/** A suggested recovery action from the classifier. */
export interface SuggestedAction {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly actionType: 'retry' | 'escalate' | 'configure' | 'investigate' | 'dismiss'
  /** Command to execute if the action is taken (for receipt tracking). */
  readonly command: string | null
}

// ============================================================================
// Intervention State
// ============================================================================

/**
 * The state of an active intervention for a single exception.
 * Managed by the triage store.
 */
export interface InterventionState {
  /** The original exception data. */
  readonly exception: ExceptionData
  /** The classification result. */
  readonly classification: ClassificationResult
  /** Current status of the intervention. */
  readonly status: InterventionStatus
  /** For transient exceptions: retry state. */
  readonly retry: RetryState | null
  /** Timestamp when the intervention was created. */
  readonly createdAt: ISOTimestamp
  /** Timestamp when the intervention was resolved (if resolved). */
  readonly resolvedAt: ISOTimestamp | null
  /** The receipt correlation ID for this intervention. */
  readonly receiptCorrelationId: string
}

export type InterventionStatus =
  | 'active' // Intervention is displayed and awaiting user action or auto-resolution
  | 'retrying' // A retry is in progress (transient only)
  | 'resolved' // The exception has cleared (health restored)
  | 'dismissed' // User dismissed the intervention
  | 'escalated' // User escalated to external action

/** Retry state for transient failures. */
export interface RetryState {
  /** Number of retries attempted. */
  readonly attemptCount: number
  /** Maximum retries before escalating to permanent. */
  readonly maxAttempts: number
  /** Seconds until next automatic retry. */
  readonly nextRetryInSeconds: number
  /** Whether auto-retry is enabled. */
  readonly autoRetryEnabled: boolean
}

// ============================================================================
// Triage Configuration
// ============================================================================

/** Configuration for the exception triage system. */
export interface TriageConfig {
  /** How often to check telemetry for new exceptions (ms). Default: 5000. */
  readonly pollIntervalMs: number
  /** Minimum health state change duration before triggering triage (ms). Default: 10000. */
  readonly debounceMs: number
  /** Maximum active interventions per district. Default: 3. */
  readonly maxInterventionsPerDistrict: number
  /** Auto-retry interval for transient failures (seconds). Default: 30. */
  readonly transientRetryIntervalSeconds: number
  /** Maximum auto-retries before escalating transient to permanent. Default: 5. */
  readonly maxTransientRetries: number
  /** Whether to use AI (Ollama) for classification. Default: true. */
  readonly enableAIClassification: boolean
  /** Timeout for AI classification requests (ms). Default: 8000. */
  readonly aiTimeoutMs: number
}

export const DEFAULT_TRIAGE_CONFIG: Readonly<TriageConfig> = {
  pollIntervalMs: 5_000,
  debounceMs: 10_000,
  maxInterventionsPerDistrict: 3,
  transientRetryIntervalSeconds: 30,
  maxTransientRetries: 5,
  enableAIClassification: true,
  aiTimeoutMs: 8_000,
} as const
```

### 4.3 Exception Rule Engine -- `src/lib/ai/exception-rules.ts`

Deterministic pattern-matching classifier for common, well-understood failure modes. This is the fallback provider per the routing table and handles the majority of classifiable failures without LLM involvement.

```ts
/**
 * Exception Rule Engine -- deterministic failure classifier.
 *
 * Matches error codes, HTTP status codes, error message patterns,
 * and health state transitions against known failure modes.
 * Returns a ClassificationResult with confidence 0.8-1.0 for
 * well-known patterns.
 *
 * This is the fallback provider for the exception-triage routing entry.
 * It is always available (no network dependency) and responds in < 1ms.
 *
 * References: tech-decisions.md (exception-triage: rule-engine fallback),
 * AD-7 (deterministic rule engines preferred for risk assessment)
 */

import type {
  ExceptionData,
  ClassificationResult,
  ExceptionCategory,
  SuggestedAction,
  AlternativeClassification,
} from '@/lib/interfaces/exception-triage'

// ============================================================================
// Rule Definitions
// ============================================================================

interface ExceptionRule {
  readonly id: string
  readonly name: string
  readonly category: ExceptionCategory
  readonly confidence: number
  readonly match: (exception: ExceptionData) => boolean
  readonly userSummary: (exception: ExceptionData) => string
  readonly suggestedActions: (exception: ExceptionData) => SuggestedAction[]
}

const EXCEPTION_RULES: readonly ExceptionRule[] = [
  // ---- Transient Rules ----
  {
    id: 'transient-econnrefused',
    name: 'Connection Refused',
    category: 'transient',
    confidence: 0.85,
    match: (e) =>
      e.errorCode === 'ECONNREFUSED' ||
      (e.errorMessage?.toLowerCase().includes('econnrefused') ?? false),
    userSummary: (e) =>
      `${e.displayName}'s server isn't responding -- it may be restarting or not yet started.`,
    suggestedActions: (e) => [
      {
        id: 'retry',
        label: 'Retry Connection',
        description: `Attempt to reconnect to ${e.displayName}`,
        actionType: 'retry',
        command: `retry health-check ${e.districtId}`,
      },
      {
        id: 'open-app',
        label: `Open ${e.displayName}`,
        description: 'Open the app to check if it is running',
        actionType: 'escalate',
        command: `open ${e.districtId}`,
      },
    ],
  },
  {
    id: 'transient-etimedout',
    name: 'Connection Timeout',
    category: 'transient',
    confidence: 0.8,
    match: (e) =>
      e.errorCode === 'ETIMEDOUT' ||
      e.errorCode === 'TIMEOUT' ||
      (e.errorMessage?.toLowerCase().includes('timeout') ?? false) ||
      (e.errorMessage?.toLowerCase().includes('timed out') ?? false),
    userSummary: (e) =>
      `${e.displayName} is taking too long to respond. This is usually temporary.`,
    suggestedActions: (e) => [
      {
        id: 'retry',
        label: 'Retry',
        description: 'Try the health check again',
        actionType: 'retry',
        command: `retry health-check ${e.districtId}`,
      },
    ],
  },
  {
    id: 'transient-503',
    name: 'Service Unavailable',
    category: 'transient',
    confidence: 0.8,
    match: (e) => e.httpStatus === 503,
    userSummary: (e) =>
      `${e.displayName} returned "Service Unavailable" (503). It may be restarting or under heavy load.`,
    suggestedActions: (e) => [
      {
        id: 'retry',
        label: 'Retry in 30s',
        description: 'Wait for the service to recover, then retry',
        actionType: 'retry',
        command: `retry health-check ${e.districtId}`,
      },
    ],
  },
  {
    id: 'transient-429',
    name: 'Rate Limited',
    category: 'transient',
    confidence: 0.9,
    match: (e) => e.httpStatus === 429,
    userSummary: (e) =>
      `${e.displayName} is rate-limiting requests. This will resolve automatically.`,
    suggestedActions: () => [
      {
        id: 'wait',
        label: 'Wait',
        description: 'Rate limit will reset shortly',
        actionType: 'retry',
        command: null,
      },
    ],
  },
  {
    id: 'transient-recently-down',
    name: 'Recently Went Down',
    category: 'transient',
    confidence: 0.7,
    match: (e) =>
      e.health === 'DOWN' &&
      e.previousHealth === 'OPERATIONAL' &&
      (e.downDurationMs ?? Infinity) < 60_000,
    userSummary: (e) =>
      `${e.displayName} just went down (less than 1 minute ago). It may recover on its own.`,
    suggestedActions: (e) => [
      {
        id: 'retry',
        label: 'Retry',
        description: 'Check if the app has recovered',
        actionType: 'retry',
        command: `retry health-check ${e.districtId}`,
      },
      {
        id: 'investigate',
        label: 'Investigate',
        description: 'Check the app for errors',
        actionType: 'investigate',
        command: `open ${e.districtId}`,
      },
    ],
  },

  // ---- Permanent Rules ----
  {
    id: 'permanent-500',
    name: 'Internal Server Error',
    category: 'permanent',
    confidence: 0.75,
    match: (e) => e.httpStatus === 500,
    userSummary: (e) =>
      `${e.displayName} has an internal server error (500). This requires investigation.`,
    suggestedActions: (e) => [
      {
        id: 'open-app',
        label: `Open ${e.displayName}`,
        description: 'Check the app for error details',
        actionType: 'escalate',
        command: `open ${e.districtId}`,
      },
      {
        id: 'view-evidence',
        label: 'View Evidence',
        description: 'Check the Evidence Ledger for recent events',
        actionType: 'investigate',
        command: 'go evidence-ledger',
      },
    ],
  },
  {
    id: 'permanent-prolonged-down',
    name: 'Prolonged Downtime',
    category: 'permanent',
    confidence: 0.85,
    match: (e) => e.health === 'DOWN' && (e.downDurationMs ?? 0) > 300_000, // Down for > 5 minutes
    userSummary: (e) =>
      `${e.displayName} has been down for over 5 minutes. It is unlikely to recover without intervention.`,
    suggestedActions: (e) => [
      {
        id: 'open-app',
        label: `Open ${e.displayName}`,
        description: 'Check the app directly',
        actionType: 'escalate',
        command: `open ${e.districtId}`,
      },
      {
        id: 'dismiss',
        label: 'Acknowledge',
        description: 'Acknowledge this failure and dismiss the alert',
        actionType: 'dismiss',
        command: null,
      },
    ],
  },

  // ---- Policy Rules ----
  {
    id: 'policy-401',
    name: 'Authentication Required',
    category: 'policy',
    confidence: 0.9,
    match: (e) => e.httpStatus === 401,
    userSummary: (e) =>
      `${e.displayName} is rejecting requests -- authentication is required or has expired.`,
    suggestedActions: (e) => [
      {
        id: 'configure-auth',
        label: 'Check Authentication',
        description: 'Verify credentials and re-authenticate if needed',
        actionType: 'configure',
        command: `open ${e.districtId}`,
      },
    ],
  },
  {
    id: 'policy-403',
    name: 'Access Forbidden',
    category: 'policy',
    confidence: 0.9,
    match: (e) => e.httpStatus === 403,
    userSummary: (e) =>
      `${e.displayName} is denying access (403 Forbidden). Check permissions or API key configuration.`,
    suggestedActions: (e) => [
      {
        id: 'configure-perms',
        label: 'Check Permissions',
        description: 'Review access permissions for the app',
        actionType: 'configure',
        command: `open ${e.districtId}`,
      },
    ],
  },

  // ---- Missing-Info Rules ----
  {
    id: 'missing-info-unknown-error',
    name: 'Unknown Error',
    category: 'missing-info',
    confidence: 0.6,
    match: (e) =>
      e.health === 'UNKNOWN' ||
      (e.health === 'DOWN' && !e.errorCode && !e.httpStatus && !e.errorMessage),
    userSummary: (e) =>
      `${e.displayName} is not responding and no error details are available. More information is needed.`,
    suggestedActions: (e) => [
      {
        id: 'investigate',
        label: 'Investigate',
        description: `Open ${e.displayName} to check what is happening`,
        actionType: 'investigate',
        command: `open ${e.districtId}`,
      },
      {
        id: 'retry',
        label: 'Retry Health Check',
        description: 'Attempt another health check to gather more data',
        actionType: 'retry',
        command: `retry health-check ${e.districtId}`,
      },
    ],
  },
] as const

// ============================================================================
// Rule Engine Classifier
// ============================================================================

/**
 * Classify an exception using the deterministic rule engine.
 *
 * Evaluates all rules in order and returns the first match with the
 * highest confidence. If no rules match, returns a missing-info result.
 *
 * @param exception - The exception data to classify.
 * @returns A ClassificationResult with provider 'rule-engine'.
 */
export function classifyWithRules(exception: ExceptionData): ClassificationResult {
  const startTime = performance.now()

  const matches: { rule: ExceptionRule; confidence: number }[] = []

  for (const rule of EXCEPTION_RULES) {
    if (rule.match(exception)) {
      matches.push({ rule, confidence: rule.confidence })
    }
  }

  // Sort by confidence descending.
  matches.sort((a, b) => b.confidence - a.confidence)

  if (matches.length === 0) {
    // No rules matched -- missing-info fallback.
    const latencyMs = Math.round(performance.now() - startTime)
    return {
      category: 'missing-info',
      confidence: 0.4,
      reasoning: `No rule matched for ${exception.displayName}. Error code: ${exception.errorCode ?? 'none'}, HTTP status: ${exception.httpStatus ?? 'none'}, message: ${exception.errorMessage ?? 'none'}.`,
      provider: 'rule-engine',
      alternatives: [],
      latencyMs,
      modelId: null,
      suggestedActions: [
        {
          id: 'investigate',
          label: 'Investigate',
          description: `Open ${exception.displayName} to gather more information`,
          actionType: 'investigate',
          command: `open ${exception.districtId}`,
        },
      ],
      userSummary: `${exception.displayName} has an issue, but the cause could not be determined automatically. Manual investigation is recommended.`,
    }
  }

  const best = matches[0]
  const alternatives: AlternativeClassification[] = matches.slice(1, 4).map((m) => ({
    category: m.rule.category,
    confidence: m.confidence,
    reason: m.rule.name,
  }))

  const latencyMs = Math.round(performance.now() - startTime)

  return {
    category: best.rule.category,
    confidence: best.confidence,
    reasoning: `Rule "${best.rule.name}" matched: ${best.rule.userSummary(exception)}`,
    provider: 'rule-engine',
    alternatives,
    latencyMs,
    modelId: null,
    suggestedActions: best.rule.suggestedActions(exception),
    userSummary: best.rule.userSummary(exception),
  }
}

/**
 * Check whether the rule engine can classify this exception
 * with sufficient confidence (>= 0.70).
 */
export function canClassifyWithRules(exception: ExceptionData): boolean {
  for (const rule of EXCEPTION_RULES) {
    if (rule.match(exception) && rule.confidence >= 0.7) {
      return true
    }
  }
  return false
}
```

### 4.4 Exception Prompt Assembler -- `src/lib/ai/exception-prompt.ts`

Builds the Ollama prompt for classifying ambiguous failures that the rule engine cannot handle with high confidence.

````ts
/**
 * Exception Prompt Assembler -- builds the Ollama prompt for exception triage.
 *
 * Assembles a system prompt that describes:
 * 1. The role (failure classification AI for a mission-control interface)
 * 2. The four exception categories with examples
 * 3. The current exception data (error message, health state, context)
 * 4. The required JSON response format
 *
 * Target: < 1500 tokens total to keep Ollama inference fast (classification
 * is simpler than camera direction -- less context needed).
 *
 * References: AD-7 (AI context assembly),
 * tech-decisions.md (exception-triage: Ollama primary)
 */

import type { ExceptionData } from '@/lib/interfaces/exception-triage'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'

// ============================================================================
// Prompt Assembly
// ============================================================================

export interface TriagePrompt {
  readonly systemMessage: string
  readonly userMessage: string
  readonly estimatedTokens: number
}

export function assembleTriagePrompt(
  exception: ExceptionData,
  snapshot: SystemSnapshot | null
): TriagePrompt {
  const systemMessage = buildSystemMessage()
  const userMessage = buildUserMessage(exception, snapshot)

  return {
    systemMessage,
    userMessage,
    estimatedTokens: Math.ceil((systemMessage.length + userMessage.length) / 4),
  }
}

// ============================================================================
// System Message (static -- cached across calls)
// ============================================================================

let cachedSystemMessage: string | null = null

function buildSystemMessage(): string {
  if (cachedSystemMessage) return cachedSystemMessage

  const lines: string[] = [
    'You are an exception triage AI for Tarva Launch, a spatial mission-control interface.',
    'Your job is to classify application failures into exactly one of four categories.',
    '',
    '## Categories',
    '',
    '### transient',
    'Temporary failure likely to self-resolve. Examples: connection refused (app restarting),',
    'timeout (network congestion), 503 (service overloaded), rate limiting (429).',
    'Recovery: retry after a short wait.',
    '',
    '### permanent',
    'Unrecoverable failure requiring human intervention. Examples: internal server error (500),',
    'crash, data corruption, dependency missing, prolonged downtime (> 5 minutes).',
    'Recovery: human must investigate and fix the root cause.',
    '',
    '### policy',
    'Failure caused by configuration or rule violation. Examples: authentication expired (401),',
    'access denied (403), feature flag disabled, resource quota exceeded.',
    'Recovery: change a configuration setting.',
    '',
    '### missing-info',
    'Cannot classify with confidence -- error data is incomplete or error pattern is unknown.',
    'Recovery: gather more information before deciding.',
    '',
    '## Response Format',
    'Respond with a single JSON object. Do not include any text outside the JSON.',
    '',
    '```json',
    '{',
    '  "category": "transient" | "permanent" | "policy" | "missing-info",',
    '  "confidence": <0.0 to 1.0>,',
    '  "reasoning": "<1-2 sentence explanation>",',
    '  "user_summary": "<plain-language description for the user>",',
    '  "suggested_actions": [',
    '    {',
    '      "label": "<button label>",',
    '      "description": "<what this action does>",',
    '      "action_type": "retry" | "escalate" | "configure" | "investigate" | "dismiss"',
    '    }',
    '  ],',
    '  "alternatives": [',
    '    { "category": "<category>", "confidence": <0.0-1.0>, "reason": "<why>" }',
    '  ]',
    '}',
    '```',
    '',
    'Rules:',
    '- Prefer "transient" for recent failures (< 1 minute) unless error strongly indicates permanent.',
    '- Prefer "permanent" when downtime exceeds 5 minutes or error code indicates crash/corruption.',
    '- Prefer "policy" when HTTP status is 401 or 403 or error mentions auth/permission/config.',
    '- Use "missing-info" only when you genuinely cannot classify (incomplete data).',
    '- Always provide at least one suggested action.',
    '- Keep user_summary under 2 sentences, in plain language (no technical jargon).',
  ]

  cachedSystemMessage = lines.join('\n')
  return cachedSystemMessage
}

// ============================================================================
// User Message (varies per exception)
// ============================================================================

function buildUserMessage(exception: ExceptionData, snapshot: SystemSnapshot | null): string {
  const lines: string[] = [
    `## Exception in ${exception.displayName} (${exception.districtId})`,
    '',
    `Health: ${exception.health}${exception.previousHealth ? ` (was ${exception.previousHealth})` : ''}`,
    `Alert count: ${exception.alertCount}`,
    `Error code: ${exception.errorCode ?? 'none'}`,
    `HTTP status: ${exception.httpStatus ?? 'none'}`,
    `Error message: ${exception.errorMessage ?? 'none'}`,
    `Down duration: ${exception.downDurationMs != null ? `${Math.round(exception.downDurationMs / 1000)}s` : 'unknown'}`,
    `Last event: ${exception.lastEvent ?? 'none'}`,
    `Activity pulse: ${exception.pulse ?? 'unknown'}`,
  ]

  // Add system context if available.
  if (snapshot) {
    const otherApps = Object.values(snapshot.apps)
      .filter((app) => app.id !== exception.districtId)
      .map((app) => `${app.displayName}: ${app.health} (${app.alertCount} alerts)`)
      .join(', ')

    lines.push(
      '',
      `## System Context`,
      `Other apps: ${otherApps}`,
      `Global alert count: ${snapshot.globalMetrics.alertCount}`,
      `System pulse: ${snapshot.globalMetrics.systemPulse}`
    )
  }

  lines.push('', 'Classify this exception.')

  return lines.join('\n')
}
````

### 4.5 Exception Classifier -- `src/lib/ai/exception-classifier.ts`

The orchestrator that routes classification requests through the rule engine first, then to Ollama for ambiguous cases. Uses the `AIRouter` from WS-3.4 for Ollama routing.

```ts
/**
 * Exception Classifier -- orchestrates failure classification.
 *
 * Pipeline:
 * 1. Try rule engine (instant, handles well-known patterns)
 * 2. If rule engine confidence >= 0.70: accept and return
 * 3. If rule engine confidence < 0.70: route to Ollama via AIRouter
 * 4. If Ollama unavailable or fails: fall back to rule engine result
 * 5. Validate Ollama response with Zod schema
 * 6. Return classification with full metadata
 *
 * Per tech-decisions.md routing table:
 *   exception-triage: Ollama primary, rule-engine fallback
 *
 * In practice, the rule engine runs first as a fast pre-filter.
 * Ollama is only called for ambiguous cases where the rule engine's
 * confidence is below threshold. This minimizes Ollama calls while
 * ensuring novel failures get semantic analysis.
 *
 * References: AD-7, tech-decisions.md, WS-3.4 LiveAIRouter
 */

import { z } from 'zod'
import type {
  ExceptionData,
  ClassificationResult,
  ExceptionCategory,
  SuggestedAction,
  AlternativeClassification,
} from '@/lib/interfaces/exception-triage'
import type { AIRouter } from '@/lib/interfaces/ai-router'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import { classifyWithRules, canClassifyWithRules } from './exception-rules'
import { assembleTriagePrompt } from './exception-prompt'

// ============================================================================
// Ollama Response Schema
// ============================================================================

const triageResponseSchema = z.object({
  category: z.enum(['transient', 'permanent', 'policy', 'missing-info']),
  confidence: z.number().min(0).max(1).default(0.5),
  reasoning: z.string().default(''),
  user_summary: z.string().default(''),
  suggested_actions: z
    .array(
      z.object({
        label: z.string(),
        description: z.string().default(''),
        action_type: z
          .enum(['retry', 'escalate', 'configure', 'investigate', 'dismiss'])
          .default('investigate'),
      })
    )
    .default([]),
  alternatives: z
    .array(
      z.object({
        category: z.enum(['transient', 'permanent', 'policy', 'missing-info']),
        confidence: z.number().min(0).max(1).default(0.3),
        reason: z.string().default(''),
      })
    )
    .default([]),
})

// ============================================================================
// Confidence threshold
// ============================================================================

/**
 * Minimum rule-engine confidence to accept without consulting Ollama.
 * Below this threshold, the classifier routes to Ollama for deeper analysis.
 */
const RULE_ENGINE_CONFIDENCE_THRESHOLD = 0.7

// ============================================================================
// Classifier
// ============================================================================

/**
 * Classify an exception using the two-layer strategy:
 * rule engine first, Ollama for ambiguous cases.
 *
 * @param exception - The exception data to classify.
 * @param aiRouter - The AI router for Ollama requests. May be null (rule-engine only).
 * @param snapshot - Current system snapshot for contextual classification.
 * @returns A ClassificationResult with full metadata.
 */
export async function classifyException(
  exception: ExceptionData,
  aiRouter: AIRouter | null,
  snapshot: SystemSnapshot | null
): Promise<ClassificationResult> {
  const startTime = performance.now()

  // ---- Step 1: Rule engine classification ----
  const ruleResult = classifyWithRules(exception)

  // ---- Step 2: Accept if confidence is sufficient ----
  if (ruleResult.confidence >= RULE_ENGINE_CONFIDENCE_THRESHOLD) {
    return {
      ...ruleResult,
      latencyMs: Math.round(performance.now() - startTime),
    }
  }

  // ---- Step 3: Route to Ollama for deeper analysis ----
  if (!aiRouter || !aiRouter.isAvailable('exception-triage')) {
    // Ollama unavailable -- return the rule engine result as-is.
    return {
      ...ruleResult,
      latencyMs: Math.round(performance.now() - startTime),
    }
  }

  try {
    const prompt = assembleTriagePrompt(exception, snapshot)

    const aiResponse = await aiRouter.route({
      feature: 'exception-triage',
      input: {
        systemPrompt: prompt.systemMessage,
        userMessage: prompt.userMessage,
      },
      context: snapshot ?? undefined,
      timeout: 8_000,
    })

    if (!aiResponse.success) {
      // Ollama failed -- fall back to rule engine result.
      return {
        ...ruleResult,
        latencyMs: Math.round(performance.now() - startTime),
      }
    }

    // ---- Step 4: Parse and validate Ollama response ----
    const content = (aiResponse.result?.content as string) ?? ''
    let raw: unknown
    try {
      raw = JSON.parse(content)
    } catch {
      // Parse failure -- fall back to rule engine.
      return {
        ...ruleResult,
        latencyMs: Math.round(performance.now() - startTime),
      }
    }

    const parsed = triageResponseSchema.safeParse(raw)
    if (!parsed.success) {
      // Schema validation failure -- fall back to rule engine.
      return {
        ...ruleResult,
        latencyMs: Math.round(performance.now() - startTime),
      }
    }

    const data = parsed.data
    const latencyMs = Math.round(performance.now() - startTime)

    // ---- Step 5: Build ClassificationResult from Ollama response ----
    const suggestedActions: SuggestedAction[] = data.suggested_actions.map((action, index) => ({
      id: `ai-action-${index}`,
      label: action.label,
      description: action.description,
      actionType: action.action_type,
      command: null,
    }))

    const alternatives: AlternativeClassification[] = data.alternatives.map((alt) => ({
      category: alt.category as ExceptionCategory,
      confidence: alt.confidence,
      reason: alt.reason,
    }))

    return {
      category: data.category as ExceptionCategory,
      confidence: data.confidence,
      reasoning: data.reasoning,
      provider: 'ollama',
      alternatives,
      latencyMs,
      modelId: aiResponse.modelId ?? null,
      suggestedActions:
        suggestedActions.length > 0 ? suggestedActions : ruleResult.suggestedActions,
      userSummary: data.user_summary || ruleResult.userSummary,
    }
  } catch {
    // Any unexpected error -- fall back to rule engine.
    return {
      ...ruleResult,
      latencyMs: Math.round(performance.now() - startTime),
    }
  }
}
```

### 4.6 Recovery Template Definitions -- `src/lib/ai/recovery-templates.ts`

Four `StationTemplate` objects registered with the `DynamicStationTemplateRegistry`, one per exception category. These templates use triggers that activate when the triage system creates interventions.

```ts
/**
 * Recovery station templates for exception triage.
 *
 * Each exception category maps to a recovery UI template:
 * - transient  -> Retry Panel
 * - permanent  -> Escalation Panel
 * - policy     -> Configuration Panel
 * - missing-info -> Information Request Panel
 *
 * These templates are registered with the DynamicStationTemplateRegistry
 * from WS-3.5. Their triggers are evaluated by the triage system, not
 * by the standard template selection pipeline -- the triage system
 * generates intervention stations directly.
 *
 * The templates define the layout structure; the InterventionStation
 * component provides the dynamic content.
 *
 * Naming convention: intervention--{category}--recovery
 *
 * References: AD-7, AD-8, WS-3.5 (StationTemplateRegistry)
 */

import type { StationTemplate } from '@/lib/interfaces/station-template-registry'

// [AMENDED per Phase 4 Review H-1]: All recovery templates use bodyType: 'status'
// (the closest semantic match from the StationLayout.bodyType union). The
// InterventionStation component renders category-specific panels (RetryPanel,
// EscalationPanel, etc.) regardless of bodyType -- the field is used only for
// type system compliance. 'custom' was rejected because it is not in the
// WS-1.7/WS-2.6 bodyType union and WS-4.3's Zod schema explicitly excludes it.

// ============================================================================
// Retry Panel Template (Transient Failures)
// ============================================================================

export const INTERVENTION_RETRY: StationTemplate = {
  id: 'intervention--transient--recovery',
  districtId: '*',
  name: 'retry-recovery',
  displayName: 'Retry Recovery',
  description:
    'Recovery station for transient failures. Shows a retry countdown, the error summary in plain language, and a manual retry button.',
  category: 'app-specific',
  layout: {
    header: { title: 'Connection Issue', icon: 'RefreshCw' },
    bodyType: 'status',
    actions: [
      {
        id: 'retry-now',
        label: 'Retry Now',
        variant: 'default',
        command: 'retry health-check ${districtId}',
        icon: 'RefreshCw',
      },
      {
        id: 'dismiss',
        label: 'Dismiss',
        variant: 'secondary',
        command: 'dismiss intervention ${interventionId}',
        icon: 'XCircle',
      },
    ],
  },
  triggers: [],
  priority: 95,
  disposable: true,
}

// ============================================================================
// Escalation Panel Template (Permanent Failures)
// ============================================================================

export const INTERVENTION_ESCALATION: StationTemplate = {
  id: 'intervention--permanent--recovery',
  districtId: '*',
  name: 'escalation-recovery',
  displayName: 'Escalation Required',
  description:
    'Recovery station for permanent failures. Shows the error details, suggested investigation steps, and a link to open the affected app.',
  category: 'app-specific',
  layout: {
    header: { title: 'Action Required', icon: 'AlertTriangle' },
    bodyType: 'status',
    actions: [
      {
        id: 'open-app',
        label: 'Open App',
        variant: 'default',
        command: 'open ${districtId}',
        icon: 'ExternalLink',
      },
      {
        id: 'view-evidence',
        label: 'View Evidence',
        variant: 'secondary',
        command: 'go evidence-ledger',
        icon: 'FileText',
      },
      {
        id: 'acknowledge',
        label: 'Acknowledge',
        variant: 'secondary',
        command: 'dismiss intervention ${interventionId}',
        icon: 'CheckCircle',
      },
    ],
  },
  triggers: [],
  priority: 98,
  disposable: true,
}

// ============================================================================
// Configuration Panel Template (Policy Failures)
// ============================================================================

export const INTERVENTION_CONFIGURATION: StationTemplate = {
  id: 'intervention--policy--recovery',
  districtId: '*',
  name: 'configuration-recovery',
  displayName: 'Configuration Needed',
  description:
    'Recovery station for policy/configuration failures. Shows the violated policy, the current value, and what needs to change.',
  category: 'app-specific',
  layout: {
    header: { title: 'Configuration Needed', icon: 'Settings' },
    bodyType: 'status',
    actions: [
      {
        id: 'open-settings',
        label: 'Open App Settings',
        variant: 'default',
        command: 'open ${districtId}',
        icon: 'Settings',
      },
      {
        id: 'retry-after-config',
        label: 'Retry After Change',
        variant: 'secondary',
        command: 'retry health-check ${districtId}',
        icon: 'RefreshCw',
      },
    ],
  },
  triggers: [],
  priority: 96,
  disposable: true,
}

// ============================================================================
// Information Request Panel Template (Missing-Info Failures)
// ============================================================================

export const INTERVENTION_INFORMATION_REQUEST: StationTemplate = {
  id: 'intervention--missing-info--recovery',
  districtId: '*',
  name: 'information-request-recovery',
  displayName: 'More Information Needed',
  description:
    'Recovery station for unclassifiable failures. Asks the user to investigate and provides links to gather more context.',
  category: 'app-specific',
  layout: {
    header: { title: 'More Info Needed', icon: 'HelpCircle' },
    bodyType: 'status',
    actions: [
      {
        id: 'investigate',
        label: 'Investigate',
        variant: 'default',
        command: 'open ${districtId}',
        icon: 'Search',
      },
      {
        id: 'retry-check',
        label: 'Retry Health Check',
        variant: 'secondary',
        command: 'retry health-check ${districtId}',
        icon: 'RefreshCw',
      },
      {
        id: 'dismiss',
        label: 'Dismiss',
        variant: 'secondary',
        command: 'dismiss intervention ${interventionId}',
        icon: 'XCircle',
      },
    ],
  },
  triggers: [],
  priority: 90,
  disposable: true,
}

// ============================================================================
// All Recovery Templates
// ============================================================================

/** All recovery templates to register with the StationTemplateRegistry. */
export const RECOVERY_TEMPLATES: readonly StationTemplate[] = [
  INTERVENTION_RETRY,
  INTERVENTION_ESCALATION,
  INTERVENTION_CONFIGURATION,
  INTERVENTION_INFORMATION_REQUEST,
] as const

/** Map from exception category to template ID. */
export const CATEGORY_TO_TEMPLATE_ID: Record<string, string> = {
  transient: INTERVENTION_RETRY.id,
  permanent: INTERVENTION_ESCALATION.id,
  policy: INTERVENTION_CONFIGURATION.id,
  'missing-info': INTERVENTION_INFORMATION_REQUEST.id,
} as const
```

### 4.7 Intervention Station Generator -- `src/lib/ai/intervention-generator.ts`

Creates dynamic station configurations from classification results, populating template variables with exception-specific data.

```ts
/**
 * Intervention Station Generator.
 *
 * Takes a ClassificationResult and the original ExceptionData, selects the
 * appropriate recovery template from the StationTemplateRegistry, and produces
 * a fully configured InterventionState ready for rendering.
 *
 * Also handles receipt generation for the triage classification decision.
 *
 * References: AD-6 (Receipt System -- AI receipts), AD-7, WS-3.5
 */

import type {
  ExceptionData,
  ClassificationResult,
  InterventionState,
  RetryState,
} from '@/lib/interfaces/exception-triage'
import { DEFAULT_TRIAGE_CONFIG } from '@/lib/interfaces/exception-triage'
import type { ReceiptStore, AIReceiptMetadata } from '@/lib/interfaces/receipt-store'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import { CATEGORY_TO_TEMPLATE_ID } from './recovery-templates'

// ============================================================================
// Generator
// ============================================================================

/**
 * Generate an intervention state from a classification result.
 *
 * @param exception - The original exception data.
 * @param classification - The classification result from the classifier.
 * @param registry - The template registry (to verify template exists).
 * @param receiptStore - For recording the triage receipt.
 * @returns A fully configured InterventionState.
 */
export async function generateIntervention(
  exception: ExceptionData,
  classification: ClassificationResult,
  registry: StationTemplateRegistry,
  receiptStore: ReceiptStore
): Promise<InterventionState> {
  const correlationId = crypto.randomUUID()
  const now = new Date().toISOString()

  // Verify that the recovery template exists in the registry.
  const templateId = CATEGORY_TO_TEMPLATE_ID[classification.category]
  const template = templateId ? registry.getTemplate(templateId) : null

  if (!template) {
    console.warn(
      `[InterventionGenerator] Recovery template not found for category "${classification.category}". Template ID: "${templateId}". Proceeding without template verification.`
    )
  }

  // Build retry state for transient failures.
  const retry: RetryState | null =
    classification.category === 'transient'
      ? {
          attemptCount: 0,
          maxAttempts: DEFAULT_TRIAGE_CONFIG.maxTransientRetries,
          nextRetryInSeconds: DEFAULT_TRIAGE_CONFIG.transientRetryIntervalSeconds,
          autoRetryEnabled: true,
        }
      : null

  // Generate receipt for the triage decision.
  const aiMetadata: AIReceiptMetadata = {
    prompt: `Classify exception in ${exception.displayName}: ${exception.errorMessage ?? exception.errorCode ?? 'unknown error'}`,
    reasoning: classification.reasoning,
    confidence: classification.confidence,
    alternativesConsidered: classification.alternatives.map(
      (alt) => `${alt.category} (${(alt.confidence * 100).toFixed(0)}%): ${alt.reason}`
    ),
    provider: classification.provider,
    latencyMs: classification.latencyMs,
    modelId: classification.modelId,
  }

  await receiptStore.record({
    source: exception.districtId,
    eventType: 'action',
    severity: classification.category === 'permanent' ? 'error' : 'warning',
    summary: `Exception triage: ${exception.displayName} classified as ${classification.category}`,
    detail: {
      exceptionId: exception.id,
      districtId: exception.districtId,
      category: classification.category,
      confidence: classification.confidence,
      errorCode: exception.errorCode,
      httpStatus: exception.httpStatus,
      errorMessage: exception.errorMessage,
      templateId,
    },
    location: {
      semanticLevel: 'Z2',
      district: exception.districtId,
      station: templateId ?? null,
    },
    actor: 'ai',
    aiMetadata,
  })

  return {
    exception,
    classification,
    status: 'active',
    retry,
    createdAt: now,
    resolvedAt: null,
    receiptCorrelationId: correlationId,
  }
}
```

### 4.8 Triage Store -- `src/stores/triage.store.ts`

Zustand store tracking active exceptions, their classifications, and intervention states. Follows the ecosystem pattern of separate State and Actions interfaces with exported selectors.

```ts
/**
 * Triage Store -- manages exception triage state.
 *
 * Tracks:
 * - Active interventions (keyed by exception ID)
 * - Resolution history (last N resolved interventions)
 * - Whether tighten mode should be active (for WS-3.7 attention choreography)
 *
 * References: AD-7, tech-decisions.md (Zustand store pattern),
 * WS-3.7 (attention choreography signals)
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  InterventionState,
  InterventionStatus,
  ExceptionData,
  TriageConfig,
} from '@/lib/interfaces/exception-triage'
import { DEFAULT_TRIAGE_CONFIG } from '@/lib/interfaces/exception-triage'
import type { AppIdentifier } from '@/lib/interfaces/types'

// ============================================================================
// Store Shape
// ============================================================================

export interface TriageState {
  /** Active interventions keyed by exception ID. */
  interventions: Record<string, InterventionState>
  /** Recently resolved interventions (last 20). */
  resolutionHistory: InterventionState[]
  /** Exception IDs that have been seen (to avoid re-classifying). */
  seenExceptionKeys: Set<string>
  /** Triage configuration. */
  config: TriageConfig
  /** Whether the triage system is actively monitoring. */
  monitoring: boolean
}

export interface TriageActions {
  /** Add a new intervention. */
  addIntervention: (intervention: InterventionState) => void
  /** Update an intervention's status. */
  setInterventionStatus: (exceptionId: string, status: InterventionStatus) => void
  /** Update retry state for a transient intervention. */
  updateRetryState: (
    exceptionId: string,
    update: {
      attemptCount?: number
      nextRetryInSeconds?: number
      autoRetryEnabled?: boolean
    }
  ) => void
  /** Resolve an intervention (health restored or user dismissed). */
  resolveIntervention: (exceptionId: string, status: 'resolved' | 'dismissed' | 'escalated') => void
  /** Mark an exception key as seen (prevents duplicate classification). */
  markSeen: (key: string) => void
  /** Check if an exception key has been seen. */
  hasSeen: (key: string) => boolean
  /** Remove all interventions for a district. */
  clearDistrictInterventions: (districtId: AppIdentifier) => void
  /** Toggle monitoring on/off. */
  setMonitoring: (active: boolean) => void
  /** Update configuration. */
  setConfig: (config: Partial<TriageConfig>) => void
  /** Clear all state (reset). */
  reset: () => void
}

export type TriageStore = TriageState & TriageActions

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_STATE: TriageState = {
  interventions: {},
  resolutionHistory: [],
  seenExceptionKeys: new Set(),
  config: DEFAULT_TRIAGE_CONFIG,
  monitoring: true,
}

const MAX_RESOLUTION_HISTORY = 20

// ============================================================================
// Store
// ============================================================================

export const useTriageStore = create<TriageStore>()(
  immer((set, get) => ({
    ...INITIAL_STATE,

    addIntervention: (intervention) =>
      set((state) => {
        state.interventions[intervention.exception.id] = intervention
      }),

    setInterventionStatus: (exceptionId, status) =>
      set((state) => {
        const intervention = state.interventions[exceptionId]
        if (intervention) {
          intervention.status = status
        }
      }),

    updateRetryState: (exceptionId, update) =>
      set((state) => {
        const intervention = state.interventions[exceptionId]
        if (intervention?.retry) {
          if (update.attemptCount !== undefined) {
            intervention.retry.attemptCount = update.attemptCount
          }
          if (update.nextRetryInSeconds !== undefined) {
            intervention.retry.nextRetryInSeconds = update.nextRetryInSeconds
          }
          if (update.autoRetryEnabled !== undefined) {
            intervention.retry.autoRetryEnabled = update.autoRetryEnabled
          }
        }
      }),

    resolveIntervention: (exceptionId, status) =>
      set((state) => {
        const intervention = state.interventions[exceptionId]
        if (intervention) {
          intervention.status = status
          intervention.resolvedAt = new Date().toISOString()

          // Move to resolution history.
          state.resolutionHistory.unshift({ ...intervention })
          if (state.resolutionHistory.length > MAX_RESOLUTION_HISTORY) {
            state.resolutionHistory = state.resolutionHistory.slice(0, MAX_RESOLUTION_HISTORY)
          }

          // Remove from active interventions.
          delete state.interventions[exceptionId]
        }
      }),

    markSeen: (key) =>
      set((state) => {
        state.seenExceptionKeys.add(key)
      }),

    hasSeen: (key) => get().seenExceptionKeys.has(key),

    clearDistrictInterventions: (districtId) =>
      set((state) => {
        for (const [id, intervention] of Object.entries(state.interventions)) {
          if (intervention.exception.districtId === districtId) {
            delete state.interventions[id]
          }
        }
      }),

    setMonitoring: (active) =>
      set((state) => {
        state.monitoring = active
      }),

    setConfig: (config) =>
      set((state) => {
        state.config = { ...state.config, ...config }
      }),

    reset: () =>
      set((state) => {
        state.interventions = {}
        state.resolutionHistory = []
        state.seenExceptionKeys = new Set()
        state.monitoring = true
      }),
  }))
)

// ============================================================================
// Selectors
// ============================================================================

export const triageSelectors = {
  /** Get all active interventions as an array. */
  activeInterventions: (state: TriageState): InterventionState[] =>
    Object.values(state.interventions).filter(
      (i) => i.status === 'active' || i.status === 'retrying'
    ),

  /** Get active interventions for a specific district. */
  districtInterventions: (state: TriageState, districtId: AppIdentifier): InterventionState[] =>
    Object.values(state.interventions).filter(
      (i) =>
        i.exception.districtId === districtId && (i.status === 'active' || i.status === 'retrying')
    ),

  /** Whether any active interventions exist (drives tighten mode). */
  hasActiveInterventions: (state: TriageState): boolean =>
    Object.values(state.interventions).some(
      (i) => i.status === 'active' || i.status === 'retrying'
    ),

  /** Count of active interventions. */
  activeCount: (state: TriageState): number =>
    Object.values(state.interventions).filter(
      (i) => i.status === 'active' || i.status === 'retrying'
    ).length,

  /** Get interventions currently retrying. */
  retryingInterventions: (state: TriageState): InterventionState[] =>
    Object.values(state.interventions).filter((i) => i.status === 'retrying'),
}
```

### 4.9 Exception Triage Hook -- `src/hooks/use-exception-triage.ts`

React hook that monitors telemetry for exception conditions, triggers classification, manages intervention lifecycle, and signals attention choreography.

```ts
/**
 * Exception triage monitoring hook.
 *
 * Monitors the SystemSnapshot for exception conditions:
 * - Health state transitions (OPERATIONAL -> DEGRADED/DOWN)
 * - Alert count increases
 * - New error events
 *
 * When an exception is detected, it triggers classification via the
 * exception classifier and creates an intervention station.
 *
 * Also monitors for resolution conditions:
 * - Health restored (DEGRADED/DOWN -> OPERATIONAL)
 * - Alert count drops to 0
 *
 * Integrates with WS-3.7 attention choreography (tighten/calm signals).
 *
 * References: AD-7, WS-1.5 (telemetry), WS-3.7 (attention choreography)
 */

import { useEffect, useRef, useCallback } from 'react'
import type { SystemSnapshot, AppState } from '@/lib/interfaces/system-state-provider'
import type { AIRouter } from '@/lib/interfaces/ai-router'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import type { StationTemplateRegistry } from '@/lib/interfaces/station-template-registry'
import type { ExceptionData } from '@/lib/interfaces/exception-triage'
import type { AppIdentifier, HealthState } from '@/lib/interfaces/types'
import { classifyException } from '@/lib/ai/exception-classifier'
import { generateIntervention } from '@/lib/ai/intervention-generator'
import { useTriageStore, triageSelectors } from '@/stores/triage.store'

// ============================================================================
// Configuration
// ============================================================================

interface UseExceptionTriageOptions {
  /** Current system snapshot (from TanStack Query or SystemStateProvider). */
  snapshot: SystemSnapshot | null
  /** AI router for Ollama classification requests. */
  aiRouter: AIRouter | null
  /** Receipt store for audit trail. */
  receiptStore: ReceiptStore | null
  /** Station template registry for template verification. */
  templateRegistry: StationTemplateRegistry | null
  /** Whether the triage system is enabled. Default: true. */
  enabled?: boolean
  /** Callback to signal attention choreography mode. */
  onAttentionModeChange?: (mode: 'calm' | 'tighten') => void
}

// ============================================================================
// Exception Detection
// ============================================================================

/** Health states that trigger exception triage. */
const EXCEPTION_HEALTH_STATES: readonly HealthState[] = ['DEGRADED', 'DOWN'] as const

/**
 * Generate a unique key for an exception to prevent duplicate classification.
 * Key is based on district + health state + error code, not just district ID,
 * so a new error on an already-degraded app gets classified separately.
 */
function exceptionKey(
  districtId: AppIdentifier,
  health: HealthState,
  errorCode: string | null
): string {
  return `${districtId}:${health}:${errorCode ?? 'none'}`
}

/**
 * Extract ExceptionData from an AppState.
 */
function buildExceptionData(appState: AppState, previousHealth: HealthState | null): ExceptionData {
  return {
    id: crypto.randomUUID(),
    districtId: appState.id as AppIdentifier,
    displayName: appState.displayName,
    health: appState.health,
    alertCount: appState.alertCount,
    errorMessage: appState.lastEvent ?? null,
    httpStatus: null, // Extracted from error message if available
    errorCode: extractErrorCode(appState.lastEvent),
    pulse: appState.pulse,
    lastEvent: appState.lastEvent,
    downDurationMs: appState.freshnessMs ?? null,
    detectedAt: new Date().toISOString(),
    previousHealth,
  }
}

/**
 * Attempt to extract a known error code from an event string.
 */
function extractErrorCode(event: string | null | undefined): string | null {
  if (!event) return null
  const upper = event.toUpperCase()

  const knownCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET', 'TIMEOUT']
  for (const code of knownCodes) {
    if (upper.includes(code)) return code
  }

  // Try to extract HTTP status code.
  const httpMatch = event.match(/\b([45]\d{2})\b/)
  if (httpMatch) return httpMatch[1]

  return null
}

/**
 * Extract HTTP status from an event string.
 */
function extractHttpStatus(event: string | null | undefined): number | null {
  if (!event) return null
  const match = event.match(/\b([45]\d{2})\b/)
  return match ? parseInt(match[1], 10) : null
}

// ============================================================================
// Hook
// ============================================================================

export function useExceptionTriage({
  snapshot,
  aiRouter,
  receiptStore,
  templateRegistry,
  enabled = true,
  onAttentionModeChange,
}: UseExceptionTriageOptions) {
  const previousHealthRef = useRef<Record<string, HealthState>>({})
  const classifyingRef = useRef<Set<string>>(new Set())

  const addIntervention = useTriageStore((s) => s.addIntervention)
  const resolveIntervention = useTriageStore((s) => s.resolveIntervention)
  const markSeen = useTriageStore((s) => s.markSeen)
  const hasSeen = useTriageStore((s) => s.hasSeen)
  const monitoring = useTriageStore((s) => s.monitoring)
  const config = useTriageStore((s) => s.config)
  const hasActive = useTriageStore((s) => triageSelectors.hasActiveInterventions(s))

  // Signal attention choreography based on active interventions.
  useEffect(() => {
    onAttentionModeChange?.(hasActive ? 'tighten' : 'calm')
  }, [hasActive, onAttentionModeChange])

  // Process a single exception detection.
  const processException = useCallback(
    async (appState: AppState, previousHealth: HealthState | null) => {
      if (!receiptStore || !templateRegistry) return

      const exData = buildExceptionData(appState, previousHealth)
      exData.httpStatus = extractHttpStatus(appState.lastEvent)

      const key = exceptionKey(appState.id as AppIdentifier, appState.health, exData.errorCode)

      // Prevent duplicate classification.
      if (hasSeen(key) || classifyingRef.current.has(key)) return
      classifyingRef.current.add(key)

      try {
        // Classify the exception.
        const classification = await classifyException(
          exData,
          config.enableAIClassification ? aiRouter : null,
          snapshot
        )

        // Generate the intervention.
        const intervention = await generateIntervention(
          exData,
          classification,
          templateRegistry,
          receiptStore
        )

        // Add to store.
        addIntervention(intervention)
        markSeen(key)
      } finally {
        classifyingRef.current.delete(key)
      }
    },
    [aiRouter, receiptStore, templateRegistry, snapshot, config, addIntervention, markSeen, hasSeen]
  )

  // Monitor telemetry for exception conditions.
  useEffect(() => {
    if (!enabled || !monitoring || !snapshot) return

    for (const [appId, appState] of Object.entries(snapshot.apps)) {
      const currentHealth = appState.health
      const previousHealth = previousHealthRef.current[appId] ?? null

      // Detect exception condition.
      if (EXCEPTION_HEALTH_STATES.includes(currentHealth)) {
        const isNewException =
          previousHealth === null ||
          previousHealth === 'OPERATIONAL' ||
          previousHealth === 'OFFLINE' ||
          previousHealth === 'UNKNOWN'

        if (isNewException) {
          processException(appState, previousHealth)
        }
      }

      // Detect resolution condition.
      if (
        currentHealth === 'OPERATIONAL' &&
        previousHealth &&
        EXCEPTION_HEALTH_STATES.includes(previousHealth)
      ) {
        // Auto-resolve any active interventions for this district.
        const districtInterventions = triageSelectors.districtInterventions(
          useTriageStore.getState(),
          appId as AppIdentifier
        )
        for (const intervention of districtInterventions) {
          resolveIntervention(intervention.exception.id, 'resolved')
        }
      }

      // Update previous health tracking.
      previousHealthRef.current[appId] = currentHealth
    }
  }, [snapshot, enabled, monitoring, processException, resolveIntervention])

  // Return triage state for the consuming component.
  return {
    interventions: useTriageStore((s) => triageSelectors.activeInterventions(s)),
    activeCount: useTriageStore((s) => triageSelectors.activeCount(s)),
    hasActiveInterventions: hasActive,
  }
}
```

### 4.10 InterventionStation Component -- `src/components/ai/InterventionStation.tsx`

The main component that renders the recovery UI based on classification. Delegates to category-specific panel components.

```tsx
/**
 * InterventionStation -- renders exception recovery UI.
 *
 * Receives an InterventionState and renders the appropriate recovery panel
 * based on the classification category. Uses WS-2.6 station panel framework
 * for the 3-zone layout (header/body/actions) with glass material styling.
 *
 * Sub-panels:
 * - RetryPanel (transient) -- countdown timer, retry button
 * - EscalationPanel (permanent) -- error details, next steps
 * - ConfigurationPanel (policy) -- policy violation, setting to change
 * - InformationRequestPanel (missing-info) -- investigation prompts
 *
 * References: AD-7, WS-2.6 (Station Panel Framework),
 * VISUAL-DESIGN-SPEC.md (glass material, status colors)
 */

'use client'

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, RefreshCw, Settings, HelpCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@tarva/ui'
import { Badge } from '@tarva/ui'
import type { InterventionState } from '@/lib/interfaces/exception-triage'
import { useTriageStore } from '@/stores/triage.store'
import { RetryPanel } from './intervention-panels/RetryPanel'
import { EscalationPanel } from './intervention-panels/EscalationPanel'
import { ConfigurationPanel } from './intervention-panels/ConfigurationPanel'
import { InformationRequestPanel } from './intervention-panels/InformationRequestPanel'

// ============================================================================
// Props
// ============================================================================

interface InterventionStationProps {
  intervention: InterventionState
  /** Callback when the user takes an action (for receipt generation). */
  onAction?: (actionId: string, command: string | null) => void
}

// ============================================================================
// Category Metadata
// ============================================================================

const CATEGORY_META = {
  transient: {
    icon: RefreshCw,
    label: 'Transient',
    color: 'var(--status-warning)',
    badgeVariant: 'warning' as const,
  },
  permanent: {
    icon: AlertTriangle,
    label: 'Permanent',
    color: 'var(--status-danger)',
    badgeVariant: 'destructive' as const,
  },
  policy: {
    icon: Settings,
    label: 'Policy',
    color: 'var(--status-warning)',
    badgeVariant: 'warning' as const,
  },
  'missing-info': {
    icon: HelpCircle,
    label: 'Needs Info',
    color: 'var(--accent)',
    badgeVariant: 'secondary' as const,
  },
} as const

// ============================================================================
// Component
// ============================================================================

export function InterventionStation({ intervention, onAction }: InterventionStationProps) {
  const resolveIntervention = useTriageStore((s) => s.resolveIntervention)
  const category = intervention.classification.category
  const meta = CATEGORY_META[category]
  const Icon = meta.icon

  const handleDismiss = useCallback(() => {
    resolveIntervention(intervention.exception.id, 'dismissed')
    onAction?.('dismiss', null)
  }, [intervention.exception.id, resolveIntervention, onAction])

  const handleResolve = useCallback(() => {
    resolveIntervention(intervention.exception.id, 'resolved')
    onAction?.('resolve', null)
  }, [intervention.exception.id, resolveIntervention, onAction])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={intervention.exception.id}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="intervention-station"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px) saturate(120%)',
          WebkitBackdropFilter: 'blur(12px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.03), 0 0 1px 0 ${meta.color}40`,
          borderRadius: '12px',
          padding: '16px',
          width: '100%',
        }}
      >
        {/* ---- Header Zone ---- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <Icon size={16} style={{ color: meta.color, flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--foreground)',
              flex: 1,
            }}
          >
            {intervention.exception.displayName}
          </span>
          <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'rgba(222, 246, 255, 0.4)',
            }}
          >
            {Math.round(intervention.classification.confidence * 100)}%
          </span>
        </div>

        {/* ---- Body Zone (category-specific panel) ---- */}
        <div style={{ marginBottom: '12px' }}>
          {category === 'transient' && (
            <RetryPanel intervention={intervention} onAction={onAction} />
          )}
          {category === 'permanent' && (
            <EscalationPanel intervention={intervention} onAction={onAction} />
          )}
          {category === 'policy' && (
            <ConfigurationPanel intervention={intervention} onAction={onAction} />
          )}
          {category === 'missing-info' && (
            <InformationRequestPanel intervention={intervention} onAction={onAction} />
          )}
        </div>

        {/* ---- Actions Zone ---- */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          {intervention.status === 'resolved' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--status-success)',
              }}
            >
              <CheckCircle size={14} />
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>Resolved</span>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <XCircle size={14} />
                Dismiss
              </Button>
              {intervention.classification.suggestedActions
                .filter((a) => a.actionType !== 'dismiss')
                .slice(0, 2)
                .map((action) => (
                  <Button
                    key={action.id}
                    variant={action.actionType === 'retry' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => onAction?.(action.id, action.command)}
                  >
                    {action.label}
                  </Button>
                ))}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
```

### 4.11 RetryPanel -- `src/components/ai/intervention-panels/RetryPanel.tsx`

Panel for transient failures with countdown timer and auto-retry logic.

```tsx
/**
 * RetryPanel -- recovery UI for transient failures.
 *
 * Shows:
 * - Plain-language error summary
 * - Countdown timer to next auto-retry
 * - Progress bar showing retry attempts
 * - Manual retry button
 *
 * References: VISUAL-DESIGN-SPEC.md (status colors, Geist Mono for numbers)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { RefreshCw, Clock } from 'lucide-react'
import { Button } from '@tarva/ui'
import type { InterventionState } from '@/lib/interfaces/exception-triage'
import { useTriageStore } from '@/stores/triage.store'

interface RetryPanelProps {
  intervention: InterventionState
  onAction?: (actionId: string, command: string | null) => void
}

export function RetryPanel({ intervention, onAction }: RetryPanelProps) {
  const { classification, retry, exception } = intervention
  const updateRetryState = useTriageStore((s) => s.updateRetryState)
  const setInterventionStatus = useTriageStore((s) => s.setInterventionStatus)

  const [countdown, setCountdown] = useState(retry?.nextRetryInSeconds ?? 30)

  // Countdown timer.
  useEffect(() => {
    if (!retry?.autoRetryEnabled || intervention.status !== 'active') return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger auto-retry.
          handleRetry()
          return retry.nextRetryInSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [retry?.autoRetryEnabled, retry?.nextRetryInSeconds, intervention.status])

  const handleRetry = useCallback(() => {
    if (!retry) return

    setInterventionStatus(exception.id, 'retrying')
    updateRetryState(exception.id, {
      attemptCount: retry.attemptCount + 1,
    })

    onAction?.('retry', `retry health-check ${exception.districtId}`)

    // Reset to active after a brief period (the telemetry hook will
    // detect resolution if health improves).
    setTimeout(() => {
      setInterventionStatus(exception.id, 'active')
    }, 3000)
  }, [retry, exception, updateRetryState, setInterventionStatus, onAction])

  const retryProgress = retry ? Math.min(1, retry.attemptCount / retry.maxAttempts) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Error summary */}
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          lineHeight: 1.5,
          color: 'rgba(222, 246, 255, 0.7)',
          margin: 0,
        }}
      >
        {classification.userSummary}
      </p>

      {/* Countdown + retry progress */}
      {retry && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
          }}
        >
          <Clock size={14} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  color: 'rgba(222, 246, 255, 0.5)',
                }}
              >
                {intervention.status === 'retrying' ? 'Retrying...' : `Next retry in`}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--status-warning)',
                }}
              >
                {intervention.status === 'retrying' ? '...' : `${countdown}s`}
              </span>
            </div>

            {/* Retry progress bar */}
            <div
              style={{
                height: '2px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '1px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${retryProgress * 100}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  background:
                    retryProgress > 0.8 ? 'var(--status-danger)' : 'var(--status-warning)',
                  borderRadius: '1px',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'rgba(222, 246, 255, 0.35)',
                marginTop: '2px',
                display: 'block',
              }}
            >
              Attempt {retry.attemptCount}/{retry.maxAttempts}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={intervention.status === 'retrying'}
          >
            <RefreshCw
              size={14}
              className={intervention.status === 'retrying' ? 'animate-spin' : ''}
            />
          </Button>
        </div>
      )}
    </div>
  )
}
```

### 4.12 EscalationPanel -- `src/components/ai/intervention-panels/EscalationPanel.tsx`

```tsx
/**
 * EscalationPanel -- recovery UI for permanent failures.
 *
 * Shows the error details, AI reasoning, and suggested next steps.
 */

'use client'

import { AlertTriangle, ExternalLink } from 'lucide-react'
import type { InterventionState } from '@/lib/interfaces/exception-triage'

interface EscalationPanelProps {
  intervention: InterventionState
  onAction?: (actionId: string, command: string | null) => void
}

export function EscalationPanel({ intervention }: EscalationPanelProps) {
  const { classification, exception } = intervention

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          lineHeight: 1.5,
          color: 'rgba(222, 246, 255, 0.7)',
          margin: 0,
        }}
      >
        {classification.userSummary}
      </p>

      {/* Error detail block */}
      {exception.errorMessage && (
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(239, 68, 68, 0.06)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.12)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--status-danger)',
              wordBreak: 'break-word',
            }}
          >
            {exception.errorMessage}
          </span>
        </div>
      )}

      {/* AI reasoning */}
      <div
        style={{
          padding: '8px 10px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'rgba(222, 246, 255, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <AlertTriangle size={10} />
          AI Assessment
        </span>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            lineHeight: 1.4,
            color: 'rgba(222, 246, 255, 0.55)',
            margin: '4px 0 0 0',
          }}
        >
          {classification.reasoning}
        </p>
      </div>
    </div>
  )
}
```

### 4.13 ConfigurationPanel -- `src/components/ai/intervention-panels/ConfigurationPanel.tsx`

```tsx
/**
 * ConfigurationPanel -- recovery UI for policy/configuration failures.
 *
 * Shows the policy violation and what setting needs to change.
 */

'use client'

import { Settings } from 'lucide-react'
import type { InterventionState } from '@/lib/interfaces/exception-triage'

interface ConfigurationPanelProps {
  intervention: InterventionState
  onAction?: (actionId: string, command: string | null) => void
}

export function ConfigurationPanel({ intervention }: ConfigurationPanelProps) {
  const { classification, exception } = intervention

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          lineHeight: 1.5,
          color: 'rgba(222, 246, 255, 0.7)',
          margin: 0,
        }}
      >
        {classification.userSummary}
      </p>

      <div
        style={{
          padding: '8px 10px',
          background: 'rgba(234, 179, 8, 0.06)',
          borderRadius: '8px',
          border: '1px solid rgba(234, 179, 8, 0.12)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <Settings
          size={14}
          style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: '1px' }}
        />
        <div>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--status-warning)',
              display: 'block',
              marginBottom: '2px',
            }}
          >
            Configuration Issue
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'rgba(222, 246, 255, 0.55)',
              lineHeight: 1.4,
            }}
          >
            {exception.httpStatus === 401
              ? 'Authentication credentials may have expired. Re-authenticate in the app.'
              : exception.httpStatus === 403
                ? 'Access permissions need to be updated. Check the app settings.'
                : classification.reasoning}
          </span>
        </div>
      </div>
    </div>
  )
}
```

### 4.14 InformationRequestPanel -- `src/components/ai/intervention-panels/InformationRequestPanel.tsx`

```tsx
/**
 * InformationRequestPanel -- recovery UI for unclassifiable failures.
 *
 * Asks the user to investigate and provides guidance on what to check.
 */

'use client'

import { HelpCircle, Search } from 'lucide-react'
import type { InterventionState } from '@/lib/interfaces/exception-triage'

interface InformationRequestPanelProps {
  intervention: InterventionState
  onAction?: (actionId: string, command: string | null) => void
}

export function InformationRequestPanel({ intervention }: InformationRequestPanelProps) {
  const { classification, exception } = intervention

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          lineHeight: 1.5,
          color: 'rgba(222, 246, 255, 0.7)',
          margin: 0,
        }}
      >
        {classification.userSummary}
      </p>

      <div
        style={{
          padding: '10px',
          background: 'rgba(39, 115, 137, 0.06)',
          borderRadius: '8px',
          border: '1px solid rgba(39, 115, 137, 0.12)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '6px',
          }}
        >
          <Search size={10} />
          Suggested Investigation Steps
        </span>
        <ul
          style={{
            margin: 0,
            paddingLeft: '16px',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            lineHeight: 1.6,
            color: 'rgba(222, 246, 255, 0.55)',
          }}
        >
          <li>Open {exception.displayName} directly and check for errors</li>
          <li>Verify the app's process is running</li>
          <li>Check the app's logs for recent error output</li>
          {exception.errorCode && (
            <li>
              Error code:{' '}
              <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                {exception.errorCode}
              </code>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
```

---

## 5. Acceptance Criteria

| ID    | Criterion                                                                                                                | Verification Method                                                                                                                                                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Rule engine classifies `ECONNREFUSED` as `transient` with confidence >= 0.80 in < 1ms                                    | Unit test: create `ExceptionData` with `errorCode: 'ECONNREFUSED'`; call `classifyWithRules()`; assert `category === 'transient'` and `confidence >= 0.80`; measure `performance.now()` delta < 1                         |
| AC-2  | Rule engine classifies HTTP 401 as `policy` with confidence >= 0.85                                                      | Unit test: create `ExceptionData` with `httpStatus: 401`; call `classifyWithRules()`; assert `category === 'policy'`                                                                                                      |
| AC-3  | Rule engine classifies HTTP 500 as `permanent` with confidence >= 0.70                                                   | Unit test: create `ExceptionData` with `httpStatus: 500`; call `classifyWithRules()`; assert `category === 'permanent'`                                                                                                   |
| AC-4  | Rule engine returns `missing-info` with confidence < 0.50 when no rules match                                            | Unit test: create `ExceptionData` with no error code, no HTTP status, and health `UNKNOWN`; assert `category === 'missing-info'` and `confidence < 0.50`                                                                  |
| AC-5  | When rule engine confidence < 0.70, classifier routes to Ollama via `AIRouter.route()` with feature `'exception-triage'` | Unit test: mock `AIRouter` and `ExceptionData` with low-confidence rule match; call `classifyException()`; assert `aiRouter.route()` was called with `feature: 'exception-triage'`                                        |
| AC-6  | When Ollama is unavailable, classifier falls back to rule engine result without throwing                                 | Unit test: set `aiRouter.isAvailable('exception-triage')` to false; call `classifyException()`; assert result has `provider: 'rule-engine'` and no exceptions thrown                                                      |
| AC-7  | Ollama triage response validates against Zod schema; malformed responses fall back to rule engine                        | Unit test: pass malformed JSON, missing `category`, invalid `confidence` values to the Zod schema parser; assert all fall back gracefully                                                                                 |
| AC-8  | Intervention station generator creates an `InterventionState` with correct `RetryState` for transient classification     | Unit test: call `generateIntervention()` with `category: 'transient'`; assert `retry !== null`, `retry.attemptCount === 0`, `retry.maxAttempts === 5`                                                                     |
| AC-9  | Intervention station generator creates a receipt with all `AIReceiptMetadata` fields populated                           | Unit test: call `generateIntervention()`; inspect the receipt passed to `ReceiptStore.record()`; assert `prompt`, `reasoning`, `confidence`, `alternativesConsidered`, `provider`, `latencyMs`, `modelId` are all present |
| AC-10 | Triage store adds, resolves, and dismisses interventions correctly                                                       | Unit test: call `addIntervention()`, verify it appears in state; call `resolveIntervention()` with `'resolved'`; verify it moves to `resolutionHistory` and is removed from `interventions`                               |
| AC-11 | Triage store prevents duplicate classification via `seenExceptionKeys`                                                   | Unit test: call `markSeen()` with a key; call `hasSeen()` with the same key; assert `true`                                                                                                                                |
| AC-12 | `useExceptionTriage` hook detects health transitions (OPERATIONAL -> DOWN) and triggers classification                   | Functional test: provide a snapshot with health OPERATIONAL, then update to DOWN; verify `classifyException()` is called                                                                                                  |
| AC-13 | `useExceptionTriage` hook auto-resolves interventions when health returns to OPERATIONAL                                 | Functional test: create an intervention for a DOWN district; update snapshot to OPERATIONAL; verify intervention status becomes `'resolved'`                                                                              |
| AC-14 | `useExceptionTriage` hook signals `onAttentionModeChange('tighten')` when active interventions exist                     | Functional test: create an intervention; verify callback receives `'tighten'`; resolve it; verify callback receives `'calm'`                                                                                              |
| AC-15 | `InterventionStation` component renders the correct sub-panel for each category                                          | Component test: render with each of the 4 categories; assert correct panel component is present (RetryPanel, EscalationPanel, ConfigurationPanel, InformationRequestPanel)                                                |
| AC-16 | `RetryPanel` shows countdown timer that decrements every second                                                          | Component test: render with `autoRetryEnabled: true`; advance timers by 5s; verify countdown decremented by 5                                                                                                             |
| AC-17 | `InterventionStation` entry/exit animations use `motion/react` (not `framer-motion`)                                     | Build verification: grep imports for `framer-motion`; assert zero matches. Verify `motion/react` import present.                                                                                                          |
| AC-18 | All 4 recovery templates are registered with the `StationTemplateRegistry` and have `disposable: true`                   | Unit test: instantiate `DynamicStationTemplateRegistry`; register recovery templates; call `getTemplate()` for each recovery template ID; assert all exist and `disposable === true`                                      |
| AC-19 | Glass material styling matches VISUAL-DESIGN-SPEC.md standard glass panel recipe                                         | Visual test: verify `background: rgba(255, 255, 255, 0.03)`, `backdrop-filter: blur(12px) saturate(120%)`, `border: 1px solid rgba(255, 255, 255, 0.06)` on the InterventionStation wrapper                               |
| AC-20 | TypeScript strict mode passes with zero errors across all new files                                                      | Build verification: `pnpm tsc --noEmit` returns 0 errors                                                                                                                                                                  |

---

## 6. Decisions Made

| ID   | Decision                                                                | Rationale                                                                                                                                                                                                                                         | Source                                                                             |
| ---- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| D-1  | Rule engine runs first as a fast pre-filter before Ollama               | Common failures (ECONNREFUSED, timeout, 5xx, 401/403) are well-understood patterns that do not need LLM analysis. The rule engine handles them in < 1ms, reserving Ollama for genuinely ambiguous cases. This minimizes Ollama calls and latency. | AD-7 (deterministic rule engines preferred for risk assessment), tech-decisions.md |
| D-2  | Rule engine confidence threshold of 0.70 triggers Ollama escalation     | Below 0.70, the rule match is uncertain enough to benefit from semantic analysis. Above 0.70, the pattern is well-understood. Threshold is a constant, not user-configurable, to keep the system predictable.                                     | Design judgment, consistent with WS-3.4 disambiguation threshold                   |
| D-3  | Four exception categories (transient/permanent/policy/missing-info)     | Covers the full decision space for failure recovery: retry, escalate, reconfigure, or gather more info. Each maps cleanly to a single recovery UI pattern. Adding more categories would increase complexity without proportional value.           | combined-recommendations.md Phase 4 Work Area #2                                   |
| D-4  | Recovery templates marked `disposable: true`                            | Intervention stations are ephemeral -- they should auto-dismiss when the exception resolves. The `disposable: true` flag signals to the template selection system and rendering layer that these stations have a finite lifecycle.                | AD-7 (disposable stations concept)                                                 |
| D-5  | Auto-retry interval of 30 seconds for transient failures                | Short enough to detect quick recoveries (app restart completes in 10-30s typically), long enough to avoid hammering a struggling service. Configurable via `TriageConfig`.                                                                        | Performance heuristic                                                              |
| D-6  | Maximum 5 auto-retries before escalating transient to permanent         | If 5 retries over 2.5 minutes do not resolve the issue, it is likely not transient. Escalating avoids infinite retry loops. Count is configurable.                                                                                                | Design judgment                                                                    |
| D-7  | Exception deduplication by district + health + error code composite key | Prevents re-classifying the same ongoing exception on every telemetry poll. A new error code on an already-degraded app gets classified separately (different failure mode).                                                                      | Correctness requirement                                                            |
| D-8  | Triage store is session-scoped (Zustand, no persistence)                | Interventions are inherently ephemeral -- they exist only while the exception is active. Receipts provide the persistent audit trail. Supabase persistence of triage state is deferred.                                                           | tech-decisions.md (Zustand for session state), scope constraint                    |
| D-9  | `motion/react` (not `framer-motion`) for intervention animations        | Per project constraint: `motion/react` is the correct import for Framer Motion v12+.                                                                                                                                                              | tech-decisions.md, project constraints                                             |
| D-10 | Ollama prompt targets < 1500 tokens for fast classification             | Exception triage is simpler than camera direction -- less context needed. The prompt includes the exception data, system context summary, and classification taxonomy. 1500 tokens keeps inference under 5s.                                      | Performance optimization, consistent with WS-3.4 D-7                               |
| D-11 | Ollama classification timeout of 8 seconds (not 10)                     | Triage should feel snappier than camera direction. The rule engine provides an instant pre-filter, so Ollama is only called for edge cases. If Ollama cannot classify in 8s, the rule engine result is sufficient.                                | Performance optimization                                                           |

---

## 7. Open Questions

| ID   | Question                                                                                                                                                   | Owner        | Impact                                                                                                                                               | Default if Unresolved                                                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-1 | Should transient intervention stations pulse with the status-warning glow, or use a subtler treatment?                                                     | Stakeholder  | Visual density -- too many glowing elements may overwhelm the interface. Subtler treatment is safer but less "eye candy."                            | Use the status-warning glow at reduced intensity (50% opacity). Aligns with tighten mode reducing ambient effects.                              |
| OQ-2 | Should resolved interventions show a brief success animation (green flash, checkmark) before dismissing, or just fade out?                                 | Stakeholder  | Success feedback reinforces the "something happened" feel. But adds visual noise for frequent recoveries (e.g., transient issues that self-resolve). | Show a brief success animation (200ms green border flash + checkmark) for user-initiated retries. Auto-resolved interventions fade out quietly. |
| OQ-3 | Should the triage system create interventions for OFFLINE apps, or only for DEGRADED/DOWN?                                                                 | Architecture | OFFLINE is intentional absence (app not started). Creating interventions for OFFLINE would be noisy for apps that are not meant to be running.       | Only DEGRADED and DOWN trigger interventions. OFFLINE is expected state per the status model (Gap 3).                                           |
| OQ-4 | When multiple exceptions are active simultaneously across districts, should they be grouped into a single "system triage" station, or remain per-district? | Architecture | Grouping reduces visual noise but loses per-app context. Per-district keeps context but may create many intervention stations.                       | Per-district, with `maxInterventionsPerDistrict: 3` cap. A global "system health" summary is a Phase 5+ feature.                                |
| OQ-5 | Should the retry panel's countdown timer tick in the UI, or just show "retrying in ~30s" statically?                                                       | UX           | Ticking timer is more informative and satisfying but adds continuous re-renders. Static is simpler.                                                  | Ticking timer -- aligns with "eye candy first" directive. The 1s interval re-render is negligible cost.                                         |

---

## 8. Risk Register

| #   | Risk                                                                                                               | Likelihood | Impact | Severity | Blocking? | Mitigation                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---------- | ------ | -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | Ollama misclassifies a permanent failure as transient, causing the user to wait on retries that will never succeed | Medium     | Medium | Medium   | No        | Rule engine handles the most common permanent patterns (500, prolonged downtime) deterministically. Ollama is only consulted for ambiguous cases. Max retry limit (5) escalates to permanent after 2.5 minutes regardless.        |
| R-2 | Telemetry polling frequency (10-15s) causes delayed exception detection                                            | Medium     | Low    | Low      | No        | When any app is DEGRADED/DOWN, WS-1.5 tightens polling to 5s. The triage hook runs on every snapshot update. Worst-case detection delay is 15s for an initial transition.                                                         |
| R-3 | Noisy telemetry (flapping health state) triggers excessive classifications                                         | Medium     | Medium | Medium   | No        | Exception deduplication by composite key prevents re-classification of the same ongoing exception. Debounce of 10s (`config.debounceMs`) prevents flap-triggered spam. Max 3 interventions per district caps visual noise.        |
| R-4 | Intervention stations overlap with existing diagnostic templates from WS-3.5                                       | Low        | Low    | Low      | No        | Recovery templates use distinct IDs (`intervention--{category}--recovery`). They are marked `disposable: true` and have higher priority (90-98) than conditional diagnostic templates (65-70), ensuring they surface when active. |
| R-5 | Rule engine does not recognize error patterns from apps that have non-standard error reporting                     | High       | Low    | Medium   | No        | Unrecognized patterns fall through to Ollama for semantic analysis. If Ollama is also unavailable, the rule engine returns `missing-info` with investigation suggestions. The system never silently ignores an exception.         |
| R-6 | Auto-retry creates network load on an already-struggling app                                                       | Low        | Low    | Low      | No        | Retry interval is 30s (not aggressive). The retry is a single health check GET request, not a heavy operation. Max 5 retries over 2.5 minutes is negligible load.                                                                 |
| R-7 | `motion/react` animations cause layout thrashing when multiple intervention stations enter/exit simultaneously     | Low        | Low    | Low      | No        | Each InterventionStation uses `AnimatePresence` with `mode="wait"` to sequence entrance/exit. Individual station animations are simple opacity/translate (no layout triggers).                                                    |
| R-8 | Ollama context prompt grows too large when system has many apps in error state                                     | Low        | Low    | Low      | No        | Prompt is capped at < 1500 tokens. System context section includes only a 1-line summary per app. Even with all 6 apps in error state, the prompt stays well under limit.                                                         |
