/**
 * Prompt templates for AI-narrated telemetry.
 *
 * These prompts instruct Ollama (or Claude as fallback) to interpret
 * system metrics and produce a three-part narration:
 * 1. What changed
 * 2. Why it matters
 * 3. What to do next
 *
 * Three prompt tiers:
 * - BATCH: Concise, generated every 30s, optimized for small models (llama3.2).
 * - DEEP_DIVE: Detailed, user-requested, optimized for larger models (Claude).
 * - ALERT: Triggered by critical state changes, focused on urgency and action.
 *
 * References:
 * - more-for-ui.md point 3
 * - combined-recommendations.md "AI Features" bullet 3
 *
 * @module narration-prompts
 * @see WS-3.6
 */

import type { AppDelta } from './narration-types'
import type { HealthState } from '@/lib/interfaces/types'

// ============================================================================
// System Prompts
// ============================================================================

/**
 * System prompt for batch narration (30s cadence, Ollama).
 * Kept short to minimize prompt token count on smaller models.
 */
export const BATCH_SYSTEM_PROMPT = `You are a calm, concise mission control narrator for a software operations dashboard called Tarva Launch. You interpret system telemetry and explain it to a human operator.

Your output MUST be valid JSON with exactly three fields:
- "whatChanged": One sentence describing what changed since the last check. If nothing changed, say so.
- "whyItMatters": One sentence explaining the significance. Be specific about impact.
- "whatToDoNext": One sentence recommending an action, or "No action needed." if the system is healthy.

Rules:
- Be calm and factual, never alarmist.
- Use plain language, not jargon.
- Reference specific numbers when available (response times, alert counts, uptime).
- If the app is OFFLINE or UNKNOWN, acknowledge it without suggesting it is broken -- it may be intentionally stopped.
- Keep each field to 1-2 sentences maximum. Brevity is critical.`

/**
 * System prompt for deep-dive narration (user-requested, Claude or Ollama).
 * More detailed analysis is expected.
 */
export const DEEP_DIVE_SYSTEM_PROMPT = `You are a thorough mission control analyst for a software operations dashboard called Tarva Launch. A human operator has explicitly requested a detailed analysis of one application's telemetry.

Your output MUST be valid JSON with exactly three fields:
- "whatChanged": A detailed description of all changes since the last check, including trends, patterns, and specific metrics.
- "whyItMatters": Analysis of the significance of these changes, including potential root causes, downstream effects, and risk assessment.
- "whatToDoNext": Specific, actionable recommendations ordered by priority. Include both immediate actions and things to monitor.

Rules:
- Be thorough but organized. Use clear, direct language.
- Reference specific numbers, percentages, and time periods.
- If the app is OFFLINE, explain the difference between intentionally stopped and unexpectedly down.
- Consider the broader system context (other apps' health) if relevant.
- 3-5 sentences per field is appropriate for deep-dive analysis.`

/**
 * System prompt for alert-triggered narrations.
 * Focused on urgency, cause identification, and immediate action steps.
 */
export const ALERT_SYSTEM_PROMPT = `You are an alert response narrator for a software operations dashboard called Tarva Launch. A critical state change has been detected that requires the operator's attention.

Your output MUST be valid JSON with exactly three fields:
- "whatChanged": A precise description of the state change that triggered the alert, including timestamps and metrics.
- "whyItMatters": Assessment of impact severity, affected services, and potential cascading failures.
- "whatToDoNext": Prioritized, immediate action steps. Be specific about what to check first and how to diagnose the issue.

Rules:
- Be direct and action-oriented. Time is critical.
- State facts clearly. Do not speculate without evidence.
- Reference specific metrics, error codes, and time windows.
- If this is a new alert, say so. If it escalated from a previous state, explain the progression.
- Keep recommendations concrete: specific commands, services to check, or people to notify.`

// ============================================================================
// Health State Descriptions
// ============================================================================

const HEALTH_DESCRIPTIONS: Record<HealthState, string> = {
  OPERATIONAL: 'fully operational (all checks passing)',
  DEGRADED: 'degraded (running with reduced capability)',
  DOWN: 'down (previously operational, now unresponsive)',
  OFFLINE: 'offline (not running, expected state)',
  UNKNOWN: 'unknown (no telemetry connection established)',
}

// ============================================================================
// User Prompt Builders
// ============================================================================

/**
 * Build the user prompt for a batch narration from an AppDelta.
 */
export function buildBatchPrompt(delta: AppDelta): string {
  const lines: string[] = [
    `Application: ${delta.displayName}`,
    `Current status: ${HEALTH_DESCRIPTIONS[delta.currentHealth]}`,
  ]

  if (delta.previousHealth !== null) {
    if (delta.healthChanged) {
      lines.push(
        `Status changed from ${HEALTH_DESCRIPTIONS[delta.previousHealth]} to ${HEALTH_DESCRIPTIONS[delta.currentHealth]}`,
      )
    } else {
      lines.push(`Status unchanged since last check.`)
    }
  } else {
    lines.push('This is the first telemetry check for this app.')
  }

  if (delta.pulse) {
    lines.push(`Current activity: ${delta.pulse}`)
  }

  if (delta.currentAlertCount > 0) {
    lines.push(`Active alerts: ${delta.currentAlertCount}`)
    if (delta.alertCountDelta !== 0) {
      const direction = delta.alertCountDelta > 0 ? 'increased' : 'decreased'
      lines.push(
        `Alert count ${direction} by ${Math.abs(delta.alertCountDelta)} since last check.`,
      )
    }
  } else {
    lines.push('No active alerts.')
  }

  if (delta.currentResponseTimeMs !== null) {
    lines.push(`Response time: ${delta.currentResponseTimeMs}ms`)
    if (delta.responseTimeDeltaPercent !== null) {
      const direction = delta.responseTimeDeltaPercent > 0 ? 'slower' : 'faster'
      lines.push(
        `Response time is ${Math.abs(Math.round(delta.responseTimeDeltaPercent))}% ${direction} than last check.`,
      )
    }
  }

  if (delta.currentUptime !== null) {
    const uptimeHours = Math.round(delta.currentUptime / 3600)
    const uptimeMinutes = Math.round((delta.currentUptime % 3600) / 60)
    if (uptimeHours > 0) {
      lines.push(`Uptime: ${uptimeHours}h ${uptimeMinutes}m`)
    } else {
      lines.push(`Uptime: ${uptimeMinutes}m`)
    }
  }

  if (delta.freshnessMs !== null) {
    const freshnessMinutes = Math.round(delta.freshnessMs / 60_000)
    if (freshnessMinutes > 60) {
      lines.push(
        `Last meaningful activity: ${Math.round(freshnessMinutes / 60)}h ago (stale)`,
      )
    } else {
      lines.push(`Last meaningful activity: ${freshnessMinutes}m ago`)
    }
  }

  const failingChecks = Object.entries(delta.checks).filter(([, v]) => v !== 'ok')
  if (failingChecks.length > 0) {
    lines.push(
      `Failing sub-checks: ${failingChecks.map(([k, v]) => `${k}=${v}`).join(', ')}`,
    )
  }

  lines.push('')
  lines.push(
    'Respond with JSON: { "whatChanged": "...", "whyItMatters": "...", "whatToDoNext": "..." }',
  )

  return lines.join('\n')
}

/**
 * Build the user prompt for a deep-dive narration from an AppDelta.
 * Includes more context and requests richer analysis.
 */
export function buildDeepDivePrompt(
  delta: AppDelta,
  previousNarration?: string,
): string {
  const batchContext = buildBatchPrompt(delta)

  const lines: string[] = [
    'The operator has requested a detailed analysis of this application.',
    '',
    batchContext,
  ]

  if (previousNarration) {
    lines.push('')
    lines.push(`Previous narration summary: "${previousNarration}"`)
    lines.push(
      'Build on this context -- explain what has changed since that assessment.',
    )
  }

  lines.push('')
  lines.push(
    'Provide a thorough analysis. Respond with JSON: { "whatChanged": "...", "whyItMatters": "...", "whatToDoNext": "..." }',
  )

  return lines.join('\n')
}

/**
 * Build the user prompt for an alert-triggered narration from an AppDelta.
 * Emphasizes the critical nature of the state change.
 */
export function buildAlertPrompt(delta: AppDelta): string {
  const lines: string[] = [
    `ALERT: Critical state change detected for ${delta.displayName}.`,
    '',
    `Previous status: ${delta.previousHealth ? HEALTH_DESCRIPTIONS[delta.previousHealth] : 'unknown'}`,
    `Current status: ${HEALTH_DESCRIPTIONS[delta.currentHealth]}`,
  ]

  if (delta.currentAlertCount > 0) {
    lines.push(`Active alerts: ${delta.currentAlertCount} (delta: +${delta.alertCountDelta})`)
  }

  if (delta.currentResponseTimeMs !== null) {
    lines.push(`Current response time: ${delta.currentResponseTimeMs}ms`)
  }

  if (delta.currentUptime !== null) {
    const uptimeMinutes = Math.round(delta.currentUptime / 60)
    lines.push(`Uptime before failure: ${uptimeMinutes}m`)
  }

  const failingChecks = Object.entries(delta.checks).filter(([, v]) => v !== 'ok')
  if (failingChecks.length > 0) {
    lines.push(
      `Failing checks: ${failingChecks.map(([k, v]) => `${k}=${v}`).join(', ')}`,
    )
  }

  lines.push('')
  lines.push(
    'Respond with JSON: { "whatChanged": "...", "whyItMatters": "...", "whatToDoNext": "..." }',
  )

  return lines.join('\n')
}
