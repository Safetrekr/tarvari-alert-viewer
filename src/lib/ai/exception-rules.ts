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
