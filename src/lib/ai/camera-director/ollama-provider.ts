/**
 * Ollama Provider -- Layer 3 of the three-layer AI Camera Director.
 *
 * Wraps the shared ollama-client.ts (WS-3.6, native fetch) to provide
 * LLM-based natural language understanding for ambiguous queries.
 *
 * This provider is used when the pattern matcher (Layer 1) fails to
 * match a query with sufficient confidence. It sends the user query
 * along with spatial context to Ollama for interpretation.
 *
 * Calls route through the Next.js Route Handler at /api/ai/chat to
 * avoid CORS issues from client-side fetch to localhost:11434.
 *
 * Falls back to pattern matcher on timeout or error.
 *
 * References:
 * - AD-7 (three-layer intelligence model)
 * - tech-decisions.md (camera-director-nl: Ollama primary)
 *
 * @module ollama-provider
 * @see WS-3.4 Section 4.2
 */

import type { SpatialIndexSnapshot } from './spatial-index'
import { assemblePrompt } from './context-assembler'
import {
  validateCameraDirective,
  type DirectiveValidationResult,
} from './camera-directive-schema'

// ============================================================================
// Configuration
// ============================================================================

/** Default timeout for Ollama Camera Director calls. */
const OLLAMA_CAMERA_TIMEOUT_MS = 10_000

// ============================================================================
// Ollama Camera Result
// ============================================================================

/** Result from the Ollama provider. */
export interface OllamaCameraResult {
  /** Whether the Ollama call succeeded. */
  readonly success: boolean
  /** Validated directive result, if successful. */
  readonly validation: DirectiveValidationResult | null
  /** Which provider handled the request. */
  readonly provider: 'ollama'
  /** Model ID used. */
  readonly modelId: string
  /** End-to-end latency in milliseconds. */
  readonly latencyMs: number
  /** Error message if failed. */
  readonly error?: string
}

// ============================================================================
// Ollama Camera Provider
// ============================================================================

/**
 * Query Ollama for camera directive interpretation.
 *
 * Routes through the /api/ai/chat Next.js Route Handler to avoid
 * CORS issues. The route handler proxies to Ollama at localhost:11434.
 *
 * @param query - The user's natural language query.
 * @param spatialSnapshot - Current spatial context for the prompt.
 * @param model - Ollama model ID. Default: 'llama3.1:8b'.
 * @param timeoutMs - Request timeout. Default: 10000ms.
 * @returns Ollama interpretation result.
 */
export async function queryOllamaForDirective(
  query: string,
  spatialSnapshot: SpatialIndexSnapshot,
  model: string = 'llama3.1:8b',
  timeoutMs: number = OLLAMA_CAMERA_TIMEOUT_MS,
): Promise<OllamaCameraResult> {
  const startTime = performance.now()

  try {
    const prompt = assemblePrompt(query, spatialSnapshot)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: prompt.combinedPrompt,
        systemPrompt: prompt.systemPrompt,
        model,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    const latencyMs = Math.round(performance.now() - startTime)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        success: false,
        validation: null,
        provider: 'ollama',
        modelId: model,
        latencyMs,
        error: `API route error (${response.status}): ${errorText}`,
      }
    }

    const data = await response.json() as { result?: unknown; error?: string }

    if (data.error) {
      return {
        success: false,
        validation: null,
        provider: 'ollama',
        modelId: model,
        latencyMs,
        error: data.error,
      }
    }

    // Validate the Ollama response against the CameraDirective schema
    const validation = validateCameraDirective(data.result)

    return {
      success: validation.success,
      validation,
      provider: 'ollama',
      modelId: model,
      latencyMs,
      error: validation.success ? undefined : validation.error,
    }
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime)

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        validation: null,
        provider: 'ollama',
        modelId: model,
        latencyMs,
        error: `Ollama request timed out after ${timeoutMs}ms`,
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      validation: null,
      provider: 'ollama',
      modelId: model,
      latencyMs,
      error: `Ollama request failed: ${message}`,
    }
  }
}

/**
 * Check if the /api/ai/chat route is reachable.
 * Used to determine if Ollama calls are possible.
 *
 * This does NOT check Ollama directly -- it checks the proxy route.
 * The route handler itself checks Ollama availability.
 */
export async function checkOllamaRouteHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3_000)

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ healthCheck: true }),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return response.ok
  } catch {
    return false
  }
}
