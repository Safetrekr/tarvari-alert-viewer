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
