/**
 * POST /api/ai/narrate -- Server-side narration generator.
 *
 * Accepts a NarrationRequest, calls Ollama to generate a structured
 * narration, and returns a NarrationResult.
 *
 * This Route Handler runs server-side to avoid CORS between the
 * browser and Ollama at localhost:11434.
 *
 * Rate limiting: Callers (the narration engine) are responsible
 * for respecting the 10 calls/min limit from tech-decisions.md.
 * The Ollama client enforces this at the module level.
 *
 * @module route
 * @see WS-3.6
 */

import { NextResponse } from 'next/server'

import {
  generateJSON,
  OLLAMA_DEFAULT_MODEL,
  checkOllamaHealth,
} from '@/lib/ai/ollama-client'
import {
  BATCH_SYSTEM_PROMPT,
  DEEP_DIVE_SYSTEM_PROMPT,
  buildBatchPrompt,
  buildDeepDivePrompt,
} from '@/lib/ai/narration-prompts'
import type {
  NarrationRequest,
  NarrationResult,
  Narration,
} from '@/lib/ai/narration-types'

// ============================================================================
// Response Shape Validation
// ============================================================================

/**
 * Expected JSON shape from the Ollama model.
 * Matches the three-part narration structure.
 */
interface NarrationResponseShape {
  whatChanged: string
  whyItMatters: string
  whatToDoNext: string
}

/**
 * Type guard for the narration response shape.
 */
function isValidNarrationShape(
  data: unknown,
): data is NarrationResponseShape {
  if (data === null || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return (
    typeof obj.whatChanged === 'string' &&
    typeof obj.whyItMatters === 'string' &&
    typeof obj.whatToDoNext === 'string'
  )
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/ai/narrate
 *
 * Server-side narration generator. Accepts a NarrationRequest,
 * calls Ollama to generate a structured narration, and returns
 * a NarrationResult.
 *
 * Request body: NarrationRequest { appId, delta, deepDive, previousNarration? }
 * Response body: NarrationResult { success, narration, error? }
 *
 * Status codes:
 * - 200: Narration generated successfully
 * - 400: Missing required fields
 * - 502: Ollama returned invalid response shape
 * - 503: Ollama is not available
 * - 500: Unexpected error
 */
export async function POST(request: Request) {
  const startTime = performance.now()

  try {
    const body = (await request.json()) as NarrationRequest

    // Validate request
    if (!body.appId || !body.delta) {
      return NextResponse.json(
        {
          success: false,
          narration: null,
          error: 'Missing required fields: appId, delta',
        } satisfies NarrationResult,
        { status: 400 },
      )
    }

    // Check Ollama availability
    const ollamaAvailable = await checkOllamaHealth()
    if (!ollamaAvailable) {
      return NextResponse.json(
        {
          success: false,
          narration: null,
          error: 'Ollama is not available at localhost:11434',
        } satisfies NarrationResult,
        { status: 503 },
      )
    }

    // Select prompt template based on narration tier
    const systemPrompt = body.deepDive
      ? DEEP_DIVE_SYSTEM_PROMPT
      : BATCH_SYSTEM_PROMPT

    const userPrompt = body.deepDive
      ? buildDeepDivePrompt(body.delta, body.previousNarration)
      : buildBatchPrompt(body.delta)

    // Call Ollama for structured JSON generation
    const { result: rawResult, response: ollamaResponse } =
      await generateJSON<NarrationResponseShape>({
        model: OLLAMA_DEFAULT_MODEL,
        system: systemPrompt,
        prompt: userPrompt,
        options: {
          temperature: body.deepDive ? 0.7 : 0.3,
          num_predict: body.deepDive ? 512 : 256,
          top_p: 0.9,
        },
      })

    const latencyMs = Math.round(performance.now() - startTime)

    // Validate response shape
    if (!isValidNarrationShape(rawResult)) {
      console.warn(
        `[narrate] Invalid narration shape for ${body.appId}:`,
        rawResult,
      )
      return NextResponse.json(
        {
          success: false,
          narration: null,
          error: 'Ollama returned an invalid narration shape',
        } satisfies NarrationResult,
        { status: 502 },
      )
    }

    const narration: Narration = {
      appId: body.appId,
      whatChanged: rawResult.whatChanged,
      whyItMatters: rawResult.whyItMatters,
      whatToDoNext: rawResult.whatToDoNext,
      generatedAt: new Date().toISOString(),
      provider: 'ollama',
      modelId: ollamaResponse.model ?? OLLAMA_DEFAULT_MODEL,
      latencyMs,
      isDeepDive: body.deepDive,
      confidence: null, // Ollama does not report confidence natively
    }

    return NextResponse.json({
      success: true,
      narration,
    } satisfies NarrationResult)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown narration error'

    console.error(`[narrate] Error:`, message)

    return NextResponse.json(
      {
        success: false,
        narration: null,
        error: message,
      } satisfies NarrationResult,
      { status: 500 },
    )
  }
}
