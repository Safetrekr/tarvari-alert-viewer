/**
 * Claude proxy route handler.
 *
 * Proxies chat completion requests to the Anthropic Claude API.
 * Keeps the API key server-side (loaded from ANTHROPIC_API_KEY env var).
 *
 * POST /api/ai/claude
 *   Body: { systemPrompt: string, userMessage: string, model?: string,
 *           maxTokens?: number, temperature?: number }
 *   Response: { success: boolean, content: string, latencyMs: number,
 *               modelId: string, usage?: { inputTokens, outputTokens, estimatedCostUsd },
 *               error?: string }
 *
 * GET /api/ai/claude
 *   Response: { configured: boolean, reachable: boolean, model: string,
 *               error?: string, latencyMs: number }
 *
 * References: tech-decisions.md (Claude API via Anthropic SDK),
 * AD-7 (graceful degradation), WS-3.4 section 4.9 (Ollama proxy pattern)
 *
 * @module route
 * @see WS-4.1
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ClaudeProvider, DEFAULT_CLAUDE_CONFIG } from '@/lib/ai/claude-provider'

// ============================================================================
// Singleton Provider (server-side only)
// ============================================================================

/**
 * Lazy-initialized singleton. The API key is read from process.env
 * at first request, not at module load time, to handle hot-reload
 * and runtime .env.local changes gracefully.
 */
let provider: ClaudeProvider | null = null

function getProvider(): ClaudeProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? null
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_CLAUDE_CONFIG.model

  if (!provider) {
    provider = new ClaudeProvider({ apiKey, model })
  } else if (apiKey !== null) {
    // Re-check API key in case .env.local was updated and server restarted.
    // The provider compares internally and re-inits the client only if changed.
    provider.setApiKey(apiKey)
  }

  return provider
}

// ============================================================================
// POST -- Chat Completion
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      systemPrompt: string
      userMessage: string
      model?: string
      maxTokens?: number
      temperature?: number
    }

    const { systemPrompt, userMessage, model, maxTokens, temperature } = body

    // ---- Input validation ----
    if (!systemPrompt || !userMessage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: systemPrompt, userMessage.',
        },
        { status: 400 },
      )
    }

    if (typeof systemPrompt !== 'string' || typeof userMessage !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'systemPrompt and userMessage must be strings.',
        },
        { status: 400 },
      )
    }

    const claude = getProvider()

    // ---- Check if API key is configured ----
    if (!claude.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'ANTHROPIC_API_KEY not configured. Set it in .env.local to enable Claude.',
          configured: false,
        },
        { status: 503 },
      )
    }

    // ---- Override model if specified ----
    if (model && typeof model === 'string') {
      claude.setModel(model)
    }

    // ---- Execute chat completion ----
    const result = await claude.chat(systemPrompt, userMessage, {
      maxTokens,
      temperature,
    })

    // eslint-disable-next-line no-console
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.error('[/api/ai/claude] Claude error:', result.error)
    }

    return NextResponse.json({
      success: result.success,
      content: result.content,
      latencyMs: result.latencyMs,
      modelId: result.modelId,
      usage: result.usage,
      error: result.error,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error('[/api/ai/claude] Request error:', message)

    return NextResponse.json(
      { success: false, error: `Server error: ${message}` },
      { status: 500 },
    )
  }
}

// ============================================================================
// GET -- Health Check / Status
// ============================================================================

export async function GET() {
  try {
    const claude = getProvider()
    const health = await claude.healthCheck()

    return NextResponse.json({
      configured: health.keyConfigured,
      reachable: health.reachable,
      model: claude.getConfig().model,
      error: health.error,
      latencyMs: health.latencyMs,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error('[/api/ai/claude] Health check error:', message)

    return NextResponse.json(
      {
        configured: false,
        reachable: false,
        model: DEFAULT_CLAUDE_CONFIG.model,
        error: `Health check failed: ${message}`,
        latencyMs: 0,
      },
      { status: 500 },
    )
  }
}
