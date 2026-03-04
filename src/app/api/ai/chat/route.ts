/**
 * AI Chat Route Handler -- Proxies requests to Ollama.
 *
 * POST /api/ai/chat
 *
 * Keeps the Ollama connection server-side to avoid CORS issues from
 * client-side fetch to localhost:11434. Adds request validation,
 * timeout enforcement, and structured logging.
 *
 * Accepts two modes:
 * 1. Normal: { query, systemPrompt, model } -> Ollama generate -> JSON result
 * 2. Health: { healthCheck: true } -> checks Ollama availability
 *
 * References:
 * - AD-7 (AI Integration Architecture)
 * - tech-decisions.md (Ollama localhost:11434)
 *
 * @module route
 * @see WS-3.4 Section 4.13
 */

import { NextResponse } from 'next/server'
import {
  generateJSON,
  checkOllamaHealth,
  isModelAvailable,
  isOllamaRateLimited,
  OLLAMA_DEFAULT_MODEL,
} from '@/lib/ai/ollama-client'

// ============================================================================
// Request Types
// ============================================================================

interface ChatRequest {
  query: string
  systemPrompt: string
  model?: string
}

interface HealthCheckRequest {
  healthCheck: true
}

type RequestBody = ChatRequest | HealthCheckRequest

// ============================================================================
// Configuration
// ============================================================================

/** Timeout for Ollama generation calls from the route handler. */
const ROUTE_TIMEOUT_MS = 10_000

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody

    // Health check mode
    if ('healthCheck' in body && body.healthCheck) {
      return handleHealthCheck()
    }

    // Normal chat mode
    if (!('query' in body) || !body.query) {
      return NextResponse.json(
        { error: 'Missing required field: query' },
        { status: 400 },
      )
    }

    if (!('systemPrompt' in body) || !body.systemPrompt) {
      return NextResponse.json(
        { error: 'Missing required field: systemPrompt' },
        { status: 400 },
      )
    }

    return handleChat(body as ChatRequest)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error('[/api/ai/chat] Request error:', message)

    return NextResponse.json(
      { error: `Invalid request: ${message}` },
      { status: 400 },
    )
  }
}

// ============================================================================
// Health Check
// ============================================================================

async function handleHealthCheck() {
  const startTime = performance.now()

  try {
    const reachable = await checkOllamaHealth()
    const modelReady = reachable ? await isModelAvailable(OLLAMA_DEFAULT_MODEL) : false
    const latencyMs = Math.round(performance.now() - startTime)

    return NextResponse.json({
      reachable,
      modelAvailable: modelReady,
      model: OLLAMA_DEFAULT_MODEL,
      latencyMs,
      rateLimited: isOllamaRateLimited(),
    })
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime)
    const message = error instanceof Error ? error.message : String(error)

    return NextResponse.json({
      reachable: false,
      modelAvailable: false,
      model: OLLAMA_DEFAULT_MODEL,
      latencyMs,
      error: message,
    })
  }
}

// ============================================================================
// Chat Handler
// ============================================================================

async function handleChat(body: ChatRequest) {
  const startTime = performance.now()
  const model = body.model || OLLAMA_DEFAULT_MODEL

  // Check rate limit before calling Ollama
  if (isOllamaRateLimited()) {
    return NextResponse.json(
      {
        error: 'Ollama rate limit exceeded. Please wait before making another request.',
        rateLimited: true,
      },
      { status: 429 },
    )
  }

  try {
    // Combine system prompt and user query for the generate endpoint
    const combinedPrompt = body.query

    const { result } = await generateJSON<Record<string, unknown>>(
      {
        model,
        prompt: combinedPrompt,
        system: body.systemPrompt,
        options: {
          temperature: 0.3,
          num_predict: 1024,
        },
      },
      ROUTE_TIMEOUT_MS,
    )

    const latencyMs = Math.round(performance.now() - startTime)

    return NextResponse.json({
      result,
      model,
      latencyMs,
    })
  } catch (error) {
    const latencyMs = Math.round(performance.now() - startTime)
    const message = error instanceof Error ? error.message : String(error)

    // Classify the error for the client
    const isTimeout = message.includes('timeout') || message.includes('aborted')
    const isRateLimit = message.includes('rate limit')
    const isNetworkError = message.includes('ECONNREFUSED') || message.includes('fetch failed')

    // eslint-disable-next-line no-console
    console.error('[/api/ai/chat] Ollama error:', {
      message,
      model,
      latencyMs,
      isTimeout,
      isRateLimit,
      isNetworkError,
    })

    const status = isRateLimit ? 429 : isTimeout ? 504 : isNetworkError ? 502 : 500

    return NextResponse.json(
      {
        error: message,
        model,
        latencyMs,
        errorType: isTimeout ? 'timeout' : isRateLimit ? 'rate_limit' : isNetworkError ? 'network' : 'unknown',
      },
      { status },
    )
  }
}
