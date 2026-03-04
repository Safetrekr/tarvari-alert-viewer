/**
 * Builder Gate -- authorization and activation guard.
 *
 * Builder Mode requires ALL of the following conditions:
 * 1. User is authenticated (auth.store)
 * 2. AI beta toggle is enabled (settings.store)
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
  /** Whether AI beta toggle is enabled. From settings.store. */
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
