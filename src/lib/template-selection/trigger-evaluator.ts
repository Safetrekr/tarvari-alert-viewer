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
