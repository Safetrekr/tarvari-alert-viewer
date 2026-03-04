/**
 * Ollama HTTP client for Tarva Launch.
 *
 * Shared between WS-3.6 (Narrated Telemetry) and WS-3.4 (AI Camera Director).
 * Communicates with Ollama at localhost:11434 via its REST API.
 *
 * This client does NOT use the `ollama` npm package -- it uses native fetch
 * to keep the dependency surface minimal and to run in both client and
 * server contexts. However, narration calls route through a Route Handler
 * (POST /api/ai/narrate) to avoid CORS issues from client-side fetch to
 * localhost:11434.
 *
 * Includes a module-level rate limiter (10 calls/min) to protect Ollama
 * from excessive request volume across all consumers.
 *
 * References:
 * - tech-decisions.md AI Integration table
 * - Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
 *
 * @module ollama-client
 * @see WS-3.6
 */

import type {
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaTagsResponse,
} from './narration-types'

// ============================================================================
// Configuration
// ============================================================================

/**
 * Ollama server base URL.
 * Reads from NEXT_PUBLIC_OLLAMA_URL env var or defaults to localhost:11434.
 * Per TARVA-SYSTEM-OVERVIEW.md.
 */
export const OLLAMA_BASE_URL =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OLLAMA_URL) ||
  'http://localhost:11434'

/** Default model for narration and camera direction. */
export const OLLAMA_DEFAULT_MODEL = 'llama3.1:8b'

/** Default timeout for Ollama API calls in milliseconds. */
export const OLLAMA_TIMEOUT_MS = 15_000

/** Timeout for health checks in milliseconds (shorter than generation). */
export const OLLAMA_HEALTH_TIMEOUT_MS = 3_000

/** Maximum number of Ollama calls per minute across all consumers. */
const RATE_LIMIT_MAX_CALLS = 10

/** Rate limit window in milliseconds (1 minute). */
const RATE_LIMIT_WINDOW_MS = 60_000

// ============================================================================
// Rate Limiter
// ============================================================================

/**
 * Module-level sliding window rate limiter.
 * Tracks timestamps of recent calls and rejects new calls when the
 * limit is exceeded. Thread-safe within a single JS event loop.
 */
const callTimestamps: number[] = []

/**
 * Check if a new call is allowed under the rate limit.
 * Removes expired timestamps and checks against the max.
 *
 * @returns true if the call is allowed, false if rate-limited.
 */
function isRateLimited(): boolean {
  const now = Date.now()
  // Remove timestamps outside the window
  while (callTimestamps.length > 0 && callTimestamps[0]! < now - RATE_LIMIT_WINDOW_MS) {
    callTimestamps.shift()
  }
  return callTimestamps.length >= RATE_LIMIT_MAX_CALLS
}

/**
 * Record a call timestamp for rate limiting.
 */
function recordCall(): void {
  callTimestamps.push(Date.now())
}

/**
 * Check if Ollama calls are currently rate-limited.
 * Exposed for consumers that want to skip calls proactively.
 *
 * @returns true if the rate limit has been reached.
 */
export function isOllamaRateLimited(): boolean {
  return isRateLimited()
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Check if Ollama is reachable and responding.
 * Calls GET / on the Ollama server (returns "Ollama is running").
 *
 * This call is NOT rate-limited (health checks are lightweight).
 *
 * @returns true if Ollama is available, false otherwise.
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OLLAMA_HEALTH_TIMEOUT_MS)

    const response = await fetch(OLLAMA_BASE_URL, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    return response.ok
  } catch {
    return false
  }
}

/**
 * Convenience function to check if Ollama is available.
 * Alias for checkOllamaHealth() for API clarity.
 *
 * @returns true if Ollama is reachable.
 */
export async function isOllamaAvailable(): Promise<boolean> {
  return checkOllamaHealth()
}

// ============================================================================
// Model Discovery
// ============================================================================

/**
 * List available models on the Ollama server.
 * Calls GET /api/tags.
 *
 * This call is NOT rate-limited (metadata queries are lightweight).
 *
 * @returns Array of model names, or empty array if Ollama is unreachable.
 */
export async function listOllamaModels(): Promise<string[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OLLAMA_HEALTH_TIMEOUT_MS)

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return []

    const data = (await response.json()) as OllamaTagsResponse
    return data.models.map((m) => m.name)
  } catch {
    return []
  }
}

/**
 * Check if a specific model is available on the Ollama server.
 *
 * @param model - Model name to check (e.g., "llama3.2").
 * @returns true if the model is pulled and available.
 */
export async function isModelAvailable(
  model: string = OLLAMA_DEFAULT_MODEL,
): Promise<boolean> {
  const models = await listOllamaModels()
  // Ollama model names may include tags (e.g., "llama3.2:latest").
  // Match by prefix to handle both "llama3.2" and "llama3.2:latest".
  return models.some((m) => m === model || m.startsWith(`${model}:`))
}

// ============================================================================
// Text Generation
// ============================================================================

/**
 * Generate text using an Ollama model.
 * Calls POST /api/generate in non-streaming mode.
 *
 * This function is intended for server-side use only (Route Handlers).
 * Client-side code should call through a Route Handler to avoid CORS.
 *
 * Rate-limited to 10 calls per minute across all consumers.
 *
 * @param request - The generation request (model, prompt, system, options).
 * @param timeoutMs - Optional per-request timeout override. Default: OLLAMA_TIMEOUT_MS.
 * @returns The Ollama response including generated text and timing metadata.
 * @throws Error if Ollama is unreachable, model is missing, generation fails, or rate limit exceeded.
 */
export async function generateText(
  request: OllamaGenerateRequest,
  timeoutMs: number = OLLAMA_TIMEOUT_MS,
): Promise<OllamaGenerateResponse> {
  // Rate limit check
  if (isRateLimited()) {
    throw new Error(
      `Ollama rate limit exceeded (${RATE_LIMIT_MAX_CALLS} calls per ${RATE_LIMIT_WINDOW_MS / 1000}s). Try again later.`,
    )
  }

  // Record the call before making it
  recordCall()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Ollama generation failed (${response.status}): ${errorText}`)
    }

    const data = (await response.json()) as OllamaGenerateResponse
    return data
  } catch (error) {
    clearTimeout(timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Ollama generation timed out after ${timeoutMs}ms`)
    }
    throw error
  }
}

// ============================================================================
// Structured JSON Generation
// ============================================================================

/**
 * Generate a structured JSON response from Ollama.
 * Uses the `format: "json"` option to request JSON output.
 * Parses the response and validates it against the expected shape.
 *
 * Rate-limited (counts toward the 10 calls/min limit).
 *
 * @param request - The generation request (format is forced to "json").
 * @param timeoutMs - Optional per-request timeout override. Default: OLLAMA_TIMEOUT_MS.
 * @returns Parsed JSON object from the model's response.
 * @throws Error if generation fails or response is not valid JSON.
 */
export async function generateJSON<T>(
  request: Omit<OllamaGenerateRequest, 'format' | 'stream'>,
  timeoutMs?: number,
): Promise<{ result: T; response: OllamaGenerateResponse }> {
  const fullRequest: OllamaGenerateRequest = {
    ...request,
    format: 'json',
    stream: false,
  }

  const ollamaResponse = await generateText(fullRequest, timeoutMs)

  try {
    const parsed = JSON.parse(ollamaResponse.response) as T
    return { result: parsed, response: ollamaResponse }
  } catch {
    throw new Error(
      `Ollama returned invalid JSON: ${ollamaResponse.response.slice(0, 200)}`,
    )
  }
}
