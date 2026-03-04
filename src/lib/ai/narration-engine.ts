/**
 * Narration engine -- background narration generation orchestrator.
 *
 * Takes deltas + system prompts, calls the narration API route,
 * and returns Narration objects. Handles timeouts (30s for narration),
 * retries (1 retry), and fallback (returns null when Ollama unavailable).
 *
 * Runs on a 30-second cadence:
 * 1. Read the current SystemSnapshot from SystemStateProvider.
 * 2. Compute deltas against the previous snapshot via delta-computer.
 * 3. Identify apps with meaningful changes.
 * 4. Call POST /api/ai/narrate for each changed app (respecting rate limit).
 * 5. Store narrations in the narration Zustand store.
 *
 * Rate limit: 10 calls per minute (tech-decisions.md).
 * At 6 apps max, one cycle uses at most 6 of the 10 calls.
 * The remaining 4 are reserved for deep-dive requests.
 *
 * References:
 * - combined-recommendations.md: "Background narration generation (Ollama, 30s cadence)"
 * - tech-decisions.md: "Claude rate-limited per feature (Narration batch: 10 calls/min)"
 *
 * @module narration-engine
 * @see WS-3.6
 */

import type { AppIdentifier } from '@/lib/interfaces/types'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { NarrationRequest, NarrationResult } from './narration-types'
import { computeDeltas } from './delta-computer'

// ============================================================================
// Configuration
// ============================================================================

/** Narration cycle interval in milliseconds. */
export const NARRATION_CYCLE_INTERVAL_MS = 30_000

/** Maximum number of batch narration calls per cycle. */
export const MAX_BATCH_CALLS_PER_CYCLE = 6

/** Timeout for a single narration generation request (ms). */
const NARRATION_REQUEST_TIMEOUT_MS = 30_000

/** Maximum retries for a single narration request. */
const MAX_RETRIES = 1

/** Pause between sequential narration calls (ms). */
const INTER_CALL_PAUSE_MS = 500

// ============================================================================
// Narration Generation
// ============================================================================

/**
 * Call the narration Route Handler for a single app.
 * Includes retry logic: if the first attempt fails, retries once.
 *
 * @param request - NarrationRequest with app ID, delta, and deep-dive flag.
 * @returns NarrationResult from the server, or null if all attempts fail.
 */
export async function generateNarration(
  request: NarrationRequest,
): Promise<NarrationResult> {
  let lastError: string | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(
        () => controller.abort(),
        NARRATION_REQUEST_TIMEOUT_MS,
      )

      const response = await fetch('/api/ai/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({ error: `HTTP ${response.status}` }))) as {
          error?: string
        }
        lastError =
          errorData.error ?? `Narration request failed: ${response.status}`

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          return {
            success: false,
            narration: null,
            error: lastError,
          }
        }

        // Retry on 5xx errors
        continue
      }

      return (await response.json()) as NarrationResult
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = `Narration request timed out after ${NARRATION_REQUEST_TIMEOUT_MS}ms`
      } else {
        lastError =
          error instanceof Error
            ? error.message
            : 'Network error during narration request'
      }
      // Retry on network errors
      continue
    }
  }

  // All attempts exhausted
  return {
    success: false,
    narration: null,
    error: lastError ?? 'Narration generation failed after retries',
  }
}

// ============================================================================
// Cycle Execution
// ============================================================================

/**
 * Run one complete narration cycle.
 *
 * Computes deltas, filters to apps with meaningful changes,
 * generates narrations sequentially (to respect rate limits),
 * and returns all results.
 *
 * Sequential generation ensures we never exceed the rate limit
 * and that Ollama processes one prompt at a time (it queues
 * concurrent requests anyway).
 *
 * @param current - Current SystemSnapshot.
 * @param previous - Previous SystemSnapshot (null if first cycle).
 * @param existingNarrations - Map of existing narration text for continuity.
 * @returns Map of app ID to NarrationResult.
 */
export async function runNarrationCycle(
  current: SystemSnapshot,
  previous: SystemSnapshot | null,
  existingNarrations: Map<AppIdentifier, string | null>,
): Promise<Map<AppIdentifier, NarrationResult>> {
  const deltas = computeDeltas(current, previous)
  const results = new Map<AppIdentifier, NarrationResult>()

  // Filter to apps with meaningful changes
  const appsToNarrate = deltas.filter((d) => d.hasMeaningfulChange)

  // Cap at MAX_BATCH_CALLS_PER_CYCLE to leave room for deep-dive requests
  const limitedApps = appsToNarrate.slice(0, MAX_BATCH_CALLS_PER_CYCLE)

  // Generate narrations sequentially (Ollama handles one at a time anyway)
  for (let i = 0; i < limitedApps.length; i++) {
    const delta = limitedApps[i]!

    const request: NarrationRequest = {
      appId: delta.appId,
      delta,
      deepDive: false,
      previousNarration:
        existingNarrations.get(delta.appId) ?? undefined,
    }

    const result = await generateNarration(request)
    results.set(delta.appId, result)

    // Brief pause between calls to avoid overwhelming Ollama
    if (i < limitedApps.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, INTER_CALL_PAUSE_MS))
    }
  }

  return results
}
