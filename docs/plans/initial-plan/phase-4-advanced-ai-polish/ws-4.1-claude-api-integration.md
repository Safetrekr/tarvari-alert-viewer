# WS-4.1: Claude API Integration

> **Workstream ID:** WS-4.1
> **Phase:** 4 -- Advanced AI + Polish
> **Assigned Agent:** `world-class-backend-api-engineer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.7 (AIRouter interface, AIProvider type, AI_ROUTING_TABLE, RoutingRule, ProviderStatus, AISessionCost types), WS-3.4 (LiveAIRouter implementation, ai.store.ts session cost tracking and provider statuses), WS-3.6 (ollama-client.ts shared Ollama client)
> **Blocks:** None (terminal phase)
> **Resolves:** AD-7 interface #5 (AIRouter Phase 4 -- Claude provider), tech-decisions.md (Remote AI provider: Claude API via Anthropic SDK), LiveAIRouter Phase 4 Claude placeholder (`'Phase 4 -- not configured'`)

---

## 1. Objective

Add Claude as a secondary AI provider to Tarva Launch, completing the dual-provider AI architecture defined in AD-7. Claude serves as the primary provider for features that require strong reasoning (Builder Mode, deep-dive narrated telemetry) and as a fallback for Ollama-primary features (natural language camera direction, batch narration).

The integration is designed around a single principle: **Claude is a quality upgrade, never a dependency.** When no API key is configured, the Launch works entirely on Ollama and rule engines. When an API key is present, Claude-primary features activate and Claude-fallback paths become available. The API key is stored as a server-side environment variable (`ANTHROPIC_API_KEY`) and never exposed to the client.

This workstream delivers the `ClaudeProvider` class (mirroring the `OllamaProvider` pattern from WS-3.4), a Next.js Route Handler that proxies Claude requests server-side, extensions to the `LiveAIRouter` to handle Claude routing and fallback, per-session cost tracking with USD estimation for Claude API calls, and graceful degradation logic for every feature in the routing table.

**Success looks like:** A developer sets `ANTHROPIC_API_KEY` in `.env.local`, restarts the dev server, and Claude-primary features (Builder Mode, deep-dive narration) begin working immediately. The settings panel shows a green "Claude connected" indicator and a session cost counter. If the API key is removed, those features gracefully degrade -- deep-dive narration falls back to Ollama, and Builder Mode shows "Configure API key to enable." No code changes are required to switch between modes.

**Why this workstream matters:** Claude provides the reasoning capability required for Builder Mode (novel station layout proposals from natural language) and high-quality deep-dive narration that Ollama's smaller models cannot match. Without this workstream, two features in the routing table remain non-functional and two fallback paths are unavailable, leaving the AI architecture incomplete.

**Traceability:** AD-7 (AI Integration Architecture -- three-layer intelligence model), tech-decisions.md (AI Integration -- Remote AI provider, Feature-by-Feature AI Routing, Cost Control), WS-3.4 section 4.8 (LiveAIRouter -- Claude placeholder), WS-1.7 section 4.6 (AIRouter interface, AI_ROUTING_TABLE), combined-recommendations.md Risk #5 (Ollama latency -- Claude fallback mitigates), Phase 4 work area #1.

---

## 2. Scope

### In Scope

| #   | Item                                                          | Description                                                                                                                                                                                                               |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Claude provider** (`src/lib/ai/claude-provider.ts`)         | `@anthropic-ai/sdk` client wrapper with structured JSON output, streaming support, timeout management (30s default), error classification, model selection (`claude-sonnet-4-20250514` default)                           |
| 2   | **API key management**                                        | Environment variable `ANTHROPIC_API_KEY` in `.env.local`, loaded server-side only via Next.js Route Handler, validated on startup, never serialized to client bundles                                                     |
| 3   | **Claude proxy route handler** (`app/api/ai/claude/route.ts`) | Next.js Route Handler that proxies Claude requests server-side, keeping the API key secret. POST for chat completion, GET for health/status check                                                                         |
| 4   | **LiveAIRouter extension**                                    | Replace the Claude placeholder in `executeProvider()` with real Claude routing. Add `setClaudeAvailable()` method. Implement fallback logic per the routing table for all Claude-involved features                        |
| 5   | **Cost tracking**                                             | Per-session USD cost estimation for Claude API calls in `ai.store.ts`. Token counting based on request/response size. Running total displayed in settings panel                                                           |
| 6   | **Rate limiting**                                             | Configurable calls-per-minute limits for Claude-primary features: `narrated-telemetry-deep` (5 calls/min), `builder-mode` (3 calls/min). Extends existing `RATE_LIMITS` map in LiveAIRouter                               |
| 7   | **Graceful degradation**                                      | When no API key: Claude-primary features fall back to Ollama where fallback exists, Claude-only features (Builder Mode) show "Configure API key" message. When API key invalid: same behavior with specific error message |
| 8   | **Health checking**                                           | Periodic Claude API availability check (every 120s when key is configured), status reflected in `ai.store.providerStatuses.claude`. Uses a lightweight `/v1/messages` ping with minimal tokens                            |
| 9   | **AI store extensions**                                       | New actions: `setClaudeStatus()`, `setClaudeApiKeyConfigured()`. New state: `claudeReady`, `claudeError`, `claudeApiKeyConfigured`. Update `recordAICost()` to include USD estimation for Claude calls                    |
| 10  | **`@anthropic-ai/sdk` installation**                          | Add `@anthropic-ai/sdk` to `package.json` dependencies via `pnpm add @anthropic-ai/sdk`                                                                                                                                   |

### Out of Scope

| #   | Item                                                          | Reason                                                                                                                                                                              |
| --- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Builder Mode feature implementation                           | WS-4.3 -- this workstream provides the Claude provider that Builder Mode consumes                                                                                                   |
| 2   | Exception Triage feature implementation                       | WS-4.2 -- uses Ollama primary with rule-engine fallback (no Claude)                                                                                                                 |
| 3   | Deep-dive narration UI                                        | WS-3.6 -- already implemented; this workstream enables Claude as its primary provider                                                                                               |
| 4   | Claude model fine-tuning or custom system prompts per feature | Feature-specific prompts are owned by their respective workstreams (WS-3.4, WS-3.6, WS-4.3)                                                                                         |
| 5   | Claude API key management UI (settings panel input)           | Deferred -- API key is set via `.env.local` only. A settings UI would require client-to-server key transmission which adds security surface                                         |
| 6   | Streaming UI rendering (progressive text display)             | The Claude provider supports streaming internally for timeout management; response is assembled server-side and returned complete. Progressive UI rendering is a future enhancement |
| 7   | Multi-model Claude selection UI                               | Default model is `claude-sonnet-4-20250514`; changing models requires editing `.env.local`. A model picker is a future enhancement                                                  |
| 8   | Token budget management per feature                           | Cost tracking is observational (session counter). Per-feature token budgets with enforcement are a future enhancement                                                               |

---

## 3. Input Dependencies

| Dependency                      | Source           | What It Provides                                                                                                                                                                                             | Blocking?     |
| ------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| WS-1.7 AIRouter interface       | Phase 1          | `AIRouter`, `AIRequest`, `AIResponse`, `AIFeature`, `AIProvider`, `RoutingRule`, `ProviderStatus`, `AISessionCost` types; `AI_ROUTING_TABLE` constant                                                        | Yes           |
| WS-3.4 LiveAIRouter             | Phase 3          | `LiveAIRouter` class with `executeProvider()`, `route()`, `isAvailable()`, `setOllamaAvailable()`, rate limiting, session cost tracking. Contains Claude placeholder returning `'Phase 4 -- not configured'` | Yes           |
| WS-3.4 ai.store.ts              | Phase 3          | `useAIStore` Zustand store with `providerStatuses`, `sessionCost`, `recordAICost()`, `setProviderStatus()`. Claude provider initialized with `available: false, error: 'Phase 4 -- not configured'`          | Yes           |
| WS-3.4 OllamaProvider pattern   | Phase 3          | Structural pattern for `ClaudeProvider`: config interface, health check, chat method, error classification. Ensures consistency across providers                                                             | Yes (pattern) |
| WS-3.6 ollama-client.ts         | Phase 3          | Shared Ollama client. Not directly used by Claude provider but establishes the shared-client pattern for AI providers. Claude uses `@anthropic-ai/sdk` instead of raw fetch                                  | Soft          |
| `@anthropic-ai/sdk` npm package | npm              | Official Anthropic client SDK. Handles authentication, request formatting, streaming, error handling                                                                                                         | Yes           |
| Next.js 16 Route Handlers       | Framework        | Server-side API endpoints where the `ANTHROPIC_API_KEY` is accessed. `process.env` is available only in Route Handlers and Server Components                                                                 | Yes           |
| `zod` npm package               | npm (via WS-3.4) | Schema validation for Claude responses. Already installed by WS-3.4                                                                                                                                          | Yes           |

---

## 4. Deliverables

### 4.1 Claude Provider -- `src/lib/ai/claude-provider.ts`

Typed client wrapper around `@anthropic-ai/sdk`. Mirrors the `OllamaProvider` structure from WS-3.4: config interface, health check, chat method, error classification, and result types. The Claude provider operates exclusively server-side (instantiated in Route Handlers only).

```ts
/**
 * Claude provider -- connects to the Anthropic Claude API.
 *
 * This is the secondary AI provider, activated in Phase 4 when an
 * ANTHROPIC_API_KEY is configured. It handles:
 * - API key validation and health checking
 * - Chat completion with structured JSON output via system prompt
 * - Streaming support for long responses (assembled server-side)
 * - Timeout management (30s default, configurable per-request)
 * - Error classification (auth, rate-limit, timeout, overloaded, unknown)
 * - Token usage tracking for cost estimation
 *
 * Server-side only. Never import this file in client components.
 * The Route Handler at /api/ai/claude proxies requests to this provider.
 *
 * References: tech-decisions.md (AI Integration -- Claude),
 * AD-7 (three-layer intelligence model),
 * WS-3.4 OllamaProvider (structural pattern)
 */

import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// Configuration
// ============================================================================

export interface ClaudeConfig {
  /** Anthropic API key. Loaded from ANTHROPIC_API_KEY env var. */
  readonly apiKey: string | null
  /** Model to use for chat completions. Default: 'claude-sonnet-4-20250514'. */
  readonly model: string
  /** Request timeout in ms. Default: 30000 (30s). */
  readonly timeoutMs: number
  /** Temperature for generation. Default: 0.3 (low for structured output). */
  readonly temperature: number
  /** Maximum tokens in the response. Default: 4096. */
  readonly maxTokens: number
}

export const DEFAULT_CLAUDE_CONFIG: Readonly<ClaudeConfig> = {
  apiKey: null,
  model: 'claude-sonnet-4-20250514',
  timeoutMs: 30_000,
  temperature: 0.3,
  maxTokens: 4096,
} as const

// ============================================================================
// Cost Constants
// ============================================================================

/**
 * Approximate cost per token for Claude models.
 * Updated as of 2025-05. Values in USD.
 *
 * These are estimates for the session cost counter, not billing-grade.
 * Actual costs may vary. The counter is a developer convenience feature.
 */
export const CLAUDE_COST_PER_TOKEN: Readonly<Record<string, { input: number; output: number }>> = {
  'claude-sonnet-4-20250514': {
    input: 0.000003, // $3 per 1M input tokens
    output: 0.000015, // $15 per 1M output tokens
  },
  // Fallback for unknown models -- use Sonnet pricing as a safe estimate.
  default: {
    input: 0.000003,
    output: 0.000015,
  },
} as const

// ============================================================================
// Response Types
// ============================================================================

export interface ClaudeHealthResult {
  /** Whether the API key is configured (non-empty). */
  readonly keyConfigured: boolean
  /** Whether the API responded successfully to a health ping. */
  readonly reachable: boolean
  /** Error message if health check failed. */
  readonly error: string | null
  /** Latency of the health check in ms. */
  readonly latencyMs: number
}

export interface ClaudeChatResult {
  /** Whether the request succeeded. */
  readonly success: boolean
  /** The response content (assembled from stream or non-stream). */
  readonly content: string
  /** Provider identifier. Always 'claude'. */
  readonly provider: 'claude'
  /** Model ID used (e.g., 'claude-sonnet-4-20250514'). */
  readonly modelId: string
  /** End-to-end latency in ms. */
  readonly latencyMs: number
  /** Error message if failed. */
  readonly error: string | null
  /** Token usage for cost tracking. */
  readonly usage: ClaudeTokenUsage | null
}

export interface ClaudeTokenUsage {
  /** Number of input tokens (prompt). */
  readonly inputTokens: number
  /** Number of output tokens (response). */
  readonly outputTokens: number
  /** Estimated cost in USD for this request. */
  readonly estimatedCostUsd: number
}

// ============================================================================
// Error Classification
// ============================================================================

export type ClaudeErrorType =
  | 'no-api-key' // ANTHROPIC_API_KEY not configured
  | 'auth' // API key invalid or expired
  | 'rate-limit' // Anthropic rate limit exceeded
  | 'timeout' // Request exceeded timeout
  | 'overloaded' // Anthropic API overloaded (529)
  | 'context-length' // Prompt exceeded model context window
  | 'network' // Network connectivity issue
  | 'unknown' // Unexpected error

export class ClaudeError extends Error {
  constructor(
    message: string,
    public readonly errorType: ClaudeErrorType,
    public readonly retryable: boolean,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'ClaudeError'
  }
}

// ============================================================================
// Claude Provider
// ============================================================================

export class ClaudeProvider {
  private config: ClaudeConfig
  private client: Anthropic | null = null

  constructor(config: Partial<ClaudeConfig> = {}) {
    this.config = { ...DEFAULT_CLAUDE_CONFIG, ...config }
    this.initClient()
  }

  /**
   * Check if the Claude API is reachable and the API key is valid.
   * Called periodically (every 120s) when an API key is configured.
   *
   * Sends a minimal /v1/messages request (1 token max) to verify
   * authentication and API availability without significant cost.
   */
  async healthCheck(): Promise<ClaudeHealthResult> {
    const startTime = performance.now()

    if (!this.config.apiKey) {
      return {
        keyConfigured: false,
        reachable: false,
        error: 'ANTHROPIC_API_KEY not configured. Set it in .env.local to enable Claude.',
        latencyMs: 0,
      }
    }

    if (!this.client) {
      this.initClient()
    }

    try {
      // Minimal request to verify auth + connectivity.
      // max_tokens: 1 keeps cost near zero (~$0.000003 per check).
      await this.client!.messages.create({
        model: this.config.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      })

      const latencyMs = Math.round(performance.now() - startTime)
      return {
        keyConfigured: true,
        reachable: true,
        error: null,
        latencyMs,
      }
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime)
      const classified = this.classifyError(error)

      return {
        keyConfigured: true,
        reachable: false,
        error: classified.message,
        latencyMs,
      }
    }
  }

  /**
   * Send a chat completion request to Claude.
   *
   * Uses the system prompt to instruct JSON output format.
   * The response is collected non-streaming for simplicity;
   * streaming support can be added for progressive UI in the future.
   *
   * @param systemPrompt - System message with context and response format.
   * @param userMessage  - The user's natural language query.
   * @param options      - Optional per-request overrides.
   */
  async chat(
    systemPrompt: string,
    userMessage: string,
    options: {
      maxTokens?: number
      temperature?: number
      timeoutMs?: number
    } = {}
  ): Promise<ClaudeChatResult> {
    const startTime = performance.now()

    if (!this.config.apiKey) {
      return {
        success: false,
        content: '',
        provider: 'claude',
        modelId: this.config.model,
        latencyMs: 0,
        error: 'ANTHROPIC_API_KEY not configured. Set it in .env.local to enable Claude.',
        usage: null,
      }
    }

    if (!this.client) {
      this.initClient()
    }

    try {
      const response = await this.client!.messages.create({
        model: this.config.model,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })

      const latencyMs = Math.round(performance.now() - startTime)

      // Extract text content from the response.
      const textBlocks = response.content.filter((block) => block.type === 'text')
      const content = textBlocks
        .map((block) => {
          if (block.type === 'text') return block.text
          return ''
        })
        .join('')

      // Calculate cost estimate.
      const usage = this.calculateUsage(response.usage)

      return {
        success: true,
        content,
        provider: 'claude',
        modelId: this.config.model,
        latencyMs,
        error: null,
        usage,
      }
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime)
      const classified = this.classifyError(error)

      return {
        success: false,
        content: '',
        provider: 'claude',
        modelId: this.config.model,
        latencyMs,
        error: `Claude ${classified.errorType} error: ${classified.message}`,
        usage: null,
      }
    }
  }

  /** Whether an API key is configured (does not verify validity). */
  isConfigured(): boolean {
    return !!this.config.apiKey
  }

  /** Get the current configuration (API key is redacted). */
  getConfig(): Readonly<Omit<ClaudeConfig, 'apiKey'> & { apiKey: string }> {
    return {
      ...this.config,
      apiKey: this.config.apiKey ? '***configured***' : '',
    }
  }

  /** Update the API key at runtime. Re-initializes the client. */
  setApiKey(apiKey: string | null): void {
    this.config = { ...this.config, apiKey }
    this.initClient()
  }

  /** Update the model. */
  setModel(model: string): void {
    this.config = { ...this.config, model }
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private initClient(): void {
    if (this.config.apiKey) {
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
        timeout: this.config.timeoutMs,
      })
    } else {
      this.client = null
    }
  }

  private calculateUsage(
    usage: { input_tokens: number; output_tokens: number } | undefined
  ): ClaudeTokenUsage | null {
    if (!usage) return null

    const pricing = CLAUDE_COST_PER_TOKEN[this.config.model] ?? CLAUDE_COST_PER_TOKEN['default']

    const estimatedCostUsd =
      usage.input_tokens * pricing.input + usage.output_tokens * pricing.output

    return {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      estimatedCostUsd: Math.round(estimatedCostUsd * 1_000_000) / 1_000_000,
    }
  }

  private classifyError(error: unknown): {
    errorType: ClaudeErrorType
    message: string
    retryable: boolean
  } {
    if (error instanceof Anthropic.AuthenticationError) {
      return {
        errorType: 'auth',
        message: 'Invalid API key. Check ANTHROPIC_API_KEY in .env.local.',
        retryable: false,
      }
    }

    if (error instanceof Anthropic.RateLimitError) {
      return {
        errorType: 'rate-limit',
        message: 'Anthropic rate limit exceeded. Wait a moment and try again.',
        retryable: true,
      }
    }

    if (error instanceof Anthropic.APIError) {
      const status = error.status

      if (status === 529) {
        return {
          errorType: 'overloaded',
          message: 'Claude API is overloaded. Try again shortly.',
          retryable: true,
        }
      }

      if (status === 400 && error.message?.includes('context')) {
        return {
          errorType: 'context-length',
          message: 'Prompt exceeded the model context window.',
          retryable: false,
        }
      }

      return {
        errorType: 'unknown',
        message: `Claude API error (${status}): ${error.message}`,
        retryable: status >= 500,
      }
    }

    if (error instanceof Anthropic.APIConnectionError) {
      return {
        errorType: 'network',
        message: 'Cannot reach Claude API. Check internet connectivity.',
        retryable: true,
      }
    }

    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return {
        errorType: 'timeout',
        message: `Claude request timed out after ${this.config.timeoutMs}ms.`,
        retryable: true,
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    return {
      errorType: 'unknown',
      message: `Unexpected Claude error: ${message}`,
      retryable: false,
    }
  }
}
```

### 4.2 Claude Proxy Route Handler -- `app/api/ai/claude/route.ts`

Next.js Route Handler that proxies Claude API requests server-side. The `ANTHROPIC_API_KEY` environment variable is accessed here and never sent to the client. Mirrors the Ollama proxy pattern from WS-3.4 (`app/api/ai/chat/route.ts`).

```ts
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
 */

import { NextRequest, NextResponse } from 'next/server'
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
    const body = await request.json()
    const { systemPrompt, userMessage, model, maxTokens, temperature } = body as {
      systemPrompt: string
      userMessage: string
      model?: string
      maxTokens?: number
      temperature?: number
    }

    // ---- Input validation ----
    if (!systemPrompt || !userMessage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: systemPrompt, userMessage.',
        },
        { status: 400 }
      )
    }

    if (typeof systemPrompt !== 'string' || typeof userMessage !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'systemPrompt and userMessage must be strings.',
        },
        { status: 400 }
      )
    }

    const claude = getProvider()

    // ---- Check if API key is configured ----
    if (!claude.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'ANTHROPIC_API_KEY not configured. Set it in .env.local to enable Claude.',
          configured: false,
        },
        { status: 503 }
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
    return NextResponse.json({ success: false, error: `Server error: ${message}` }, { status: 500 })
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
    return NextResponse.json(
      {
        configured: false,
        reachable: false,
        model: DEFAULT_CLAUDE_CONFIG.model,
        error: `Health check failed: ${message}`,
        latencyMs: 0,
      },
      { status: 500 }
    )
  }
}
```

### 4.3 LiveAIRouter Extension -- `src/lib/ai/live-ai-router.ts` (amendments)

The following changes extend the existing `LiveAIRouter` class from WS-3.4 to support the Claude provider. Changes are marked with `[WS-4.1]` comments. The existing Ollama, pattern-matcher, and rule-engine cases remain unchanged.

**4.3.1 New imports and rate limits:**

```ts
// [WS-4.1] Add to existing imports at top of live-ai-router.ts:
import type { ClaudeChatResult } from './claude-provider'

// [WS-4.1] Extend RATE_LIMITS with Claude-primary features:
const RATE_LIMITS: Partial<Record<AIFeature, RateLimit>> = {
  'camera-director-nl': { maxCalls: 1, windowMs: 3_000 },
  'narrated-telemetry-batch': { maxCalls: 10, windowMs: 60_000 },
  // [WS-4.1] Claude-primary features:
  'narrated-telemetry-deep': { maxCalls: 5, windowMs: 60_000 },
  'builder-mode': { maxCalls: 3, windowMs: 60_000 },
} as const
```

**4.3.2 Constructor extension:**

```ts
export class LiveAIRouter implements AIRouter {
  private ollamaProvider: OllamaProvider
  private providerStatuses: Map<AIProvider, ProviderStatus> = new Map()
  private sessionCost: AISessionCost
  private callTimestamps: Map<AIFeature, number[]> = new Map()

  // [WS-4.1] Claude proxy URL for client-side routing via Route Handler.
  private claudeProxyUrl: string

  constructor(
    ollamaProvider: OllamaProvider,
    // [WS-4.1] Optional Claude proxy URL. Defaults to /api/ai/claude.
    claudeProxyUrl: string = '/api/ai/claude',
  ) {
    this.ollamaProvider = ollamaProvider
    this.claudeProxyUrl = claudeProxyUrl

    this.sessionCost = {
      totalCalls: 0,
      callsByProvider: {
        'pattern-matcher': 0,
        'rule-engine': 0,
        ollama: 0,
        claude: 0,
      },
      callsByFeature: {
        'camera-director-structured': 0,
        'camera-director-nl': 0,
        'station-template-selection': 0,
        'narrated-telemetry-batch': 0,
        'narrated-telemetry-deep': 0,
        'exception-triage': 0,
        'builder-mode': 0,
      },
      estimatedCostUsd: 0,
    }

    // Initialize provider statuses.
    this.providerStatuses.set('pattern-matcher', {
      provider: 'pattern-matcher',
      available: true,
      lastCheck: new Date().toISOString(),
      error: null,
    })
    this.providerStatuses.set('rule-engine', {
      provider: 'rule-engine',
      available: true,
      lastCheck: new Date().toISOString(),
      error: null,
    })
    this.providerStatuses.set('ollama', {
      provider: 'ollama',
      available: false,
      lastCheck: null,
      error: 'Not checked yet',
    })
    // [WS-4.1] Initialize Claude as unchecked (not "Phase 4 stub").
    this.providerStatuses.set('claude', {
      provider: 'claude',
      available: false,
      lastCheck: null,
      error: 'Not checked yet',
    })
  }

  // ... existing route(), isAvailable(), getProviderStatus(), etc. remain unchanged ...
```

**4.3.3 New `setClaudeAvailable()` method:**

```ts
  // [WS-4.1] Update Claude provider status after a health check.
  setClaudeAvailable(available: boolean, error: string | null): void {
    this.providerStatuses.set('claude', {
      provider: 'claude',
      available,
      lastCheck: new Date().toISOString(),
      error,
    })
  }
```

**4.3.4 Replace Claude case in `executeProvider()`:**

```ts
  private async executeProvider(
    provider: AIProvider,
    request: AIRequest,
  ): Promise<AIResponse> {
    switch (provider) {
      case 'ollama': {
        // ... existing Ollama case unchanged ...
      }

      case 'pattern-matcher':
      case 'rule-engine':
        // ... existing cases unchanged ...

      // [WS-4.1] Replace the Phase 3 stub with real Claude routing.
      case 'claude': {
        // Check if Claude is available before attempting.
        const claudeStatus = this.providerStatuses.get('claude')
        if (!claudeStatus?.available) {
          return {
            success: false,
            provider: 'claude',
            result: {},
            latencyMs: 0,
            fallbackUsed: false,
            error: claudeStatus?.error
              ?? 'Claude API not available. Set ANTHROPIC_API_KEY in .env.local.',
          }
        }

        const input = request.input as {
          systemPrompt: string
          userMessage: string
          maxTokens?: number
          temperature?: number
        }

        try {
          // Route through the Next.js Route Handler to keep the API key
          // server-side. The LiveAIRouter runs client-side; it cannot
          // access process.env.ANTHROPIC_API_KEY directly.
          const response = await fetch(this.claudeProxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemPrompt: input.systemPrompt,
              userMessage: input.userMessage,
              maxTokens: input.maxTokens,
              temperature: input.temperature,
            }),
            signal: AbortSignal.timeout(request.timeout ?? 30_000),
          })

          const data = (await response.json()) as {
            success: boolean
            content: string
            latencyMs: number
            modelId: string
            usage?: {
              inputTokens: number
              outputTokens: number
              estimatedCostUsd: number
            }
            error?: string
          }

          // [WS-4.1] Update session cost with Claude's USD estimate.
          if (data.success && data.usage) {
            this.sessionCost = {
              ...this.sessionCost,
              estimatedCostUsd:
                this.sessionCost.estimatedCostUsd +
                data.usage.estimatedCostUsd,
            }
          }

          return {
            success: data.success,
            provider: 'claude',
            result: { content: data.content },
            latencyMs: data.latencyMs,
            fallbackUsed: false,
            error: data.error,
            modelId: data.modelId,
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error)

          // If the error is a timeout (AbortError), classify it.
          const isTimeout =
            error instanceof DOMException &&
            error.name === 'AbortError'

          return {
            success: false,
            provider: 'claude',
            result: {},
            latencyMs: 0,
            fallbackUsed: false,
            error: isTimeout
              ? `Claude request timed out after ${request.timeout ?? 30_000}ms.`
              : `Claude proxy error: ${message}`,
          }
        }
      }
    }
  }
```

### 4.4 AI Store Extensions -- `src/stores/ai.store.ts` (amendments)

Extensions to the existing AI store from WS-3.4 to support Claude provider state and cost estimation.

**4.4.1 New state fields:**

```ts
// [WS-4.1] Add to AIState interface:
export interface AIState {
  // ... existing fields unchanged ...

  /** [WS-4.1] Whether the Claude API key is configured in .env.local. */
  claudeApiKeyConfigured: boolean
  /** [WS-4.1] Whether Claude is reachable and authenticated. */
  claudeReady: boolean
  /** [WS-4.1] Last Claude health check error, if any. */
  claudeError: string | null
}
```

**4.4.2 New actions:**

```ts
// [WS-4.1] Add to AIActions interface:
export interface AIActions {
  // ... existing actions unchanged ...

  /** [WS-4.1] Set Claude API status after health check. */
  setClaudeStatus: (ready: boolean, keyConfigured: boolean, error: string | null) => void
}
```

**4.4.3 Initial state additions:**

```ts
// [WS-4.1] Add to INITIAL_STATE:
const INITIAL_STATE: AIState = {
  // ... existing fields unchanged ...
  claudeApiKeyConfigured: false,
  claudeReady: false,
  claudeError: null,
}
```

**4.4.4 Store implementation additions:**

```ts
// [WS-4.1] Add inside the immer((set) => ({...})) block:

setClaudeStatus: (ready, keyConfigured, error) =>
  set((state) => {
    state.claudeApiKeyConfigured = keyConfigured
    state.claudeReady = ready
    state.claudeError = error
    state.providerStatuses.claude = {
      provider: 'claude',
      available: ready,
      lastCheck: new Date().toISOString(),
      error,
    }
  }),
```

**4.4.5 Update `recordAICost` for Claude USD estimation:**

```ts
// [WS-4.1] Replace the existing recordAICost action:
recordAICost: (provider, feature, estimatedCostUsd?: number) =>
  set((state) => {
    state.sessionCost.totalCalls += 1
    state.sessionCost.callsByProvider[provider] += 1
    state.sessionCost.callsByFeature[feature] += 1
    // [WS-4.1] Claude cost estimation. Ollama remains free ($0).
    if (provider === 'claude' && estimatedCostUsd !== undefined) {
      state.sessionCost.estimatedCostUsd += estimatedCostUsd
    }
  }),
```

**4.4.6 New selectors:**

```ts
// [WS-4.1] Add to aiSelectors:
export const aiSelectors = {
  // ... existing selectors unchanged ...

  /** [WS-4.1] Whether Claude is configured and reachable. */
  isClaudeReady: (state: AIState): boolean => state.betaEnabled && state.claudeReady,

  /** [WS-4.1] Whether Claude API key is present (may not be validated). */
  isClaudeConfigured: (state: AIState): boolean => state.claudeApiKeyConfigured,

  /** [WS-4.1] Formatted session cost string for display. */
  formattedSessionCost: (state: AIState): string => {
    const cost = state.sessionCost.estimatedCostUsd
    if (cost === 0) return '$0.00'
    if (cost < 0.01) return `<$0.01 (${state.sessionCost.totalCalls} calls)`
    return `$${cost.toFixed(4)} (${state.sessionCost.totalCalls} calls)`
  },
}
```

### 4.5 Claude Health Check Hook -- `src/hooks/use-claude-health-check.ts`

Client-side hook that periodically checks Claude API availability via the Route Handler and updates the AI store.

```ts
/**
 * Claude health check hook.
 *
 * Periodically pings GET /api/ai/claude to check:
 * 1. Whether ANTHROPIC_API_KEY is configured
 * 2. Whether the Claude API is reachable
 *
 * Updates ai.store with the result. Runs every 120s when AI beta
 * is enabled. Stops polling when beta is disabled.
 *
 * References: WS-4.1 (Claude integration),
 * WS-3.4 section 4.10 (Ollama health check pattern)
 */

import { useEffect, useRef } from 'react'
import { useAIStore } from '@/stores/ai.store'

/** Interval between health checks in ms. */
const CLAUDE_HEALTH_CHECK_INTERVAL_MS = 120_000 // 2 minutes

/** Response shape from GET /api/ai/claude. */
interface ClaudeHealthResponse {
  configured: boolean
  reachable: boolean
  model: string
  error: string | null
  latencyMs: number
}

export function useClaudeHealthCheck(): void {
  const betaEnabled = useAIStore((s) => s.betaEnabled)
  const setClaudeStatus = useAIStore((s) => s.setClaudeStatus)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!betaEnabled) {
      // AI beta is off. Mark Claude as unchecked and stop polling.
      setClaudeStatus(false, false, 'AI beta disabled')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const check = async () => {
      try {
        const response = await fetch('/api/ai/claude', {
          method: 'GET',
          signal: AbortSignal.timeout(10_000),
        })
        const data: ClaudeHealthResponse = await response.json()

        setClaudeStatus(data.reachable, data.configured, data.error)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setClaudeStatus(false, false, `Health check failed: ${message}`)
      }
    }

    // Run immediately on mount / beta enable.
    check()

    // Poll periodically.
    intervalRef.current = setInterval(check, CLAUDE_HEALTH_CHECK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [betaEnabled, setClaudeStatus])
}
```

### 4.6 Graceful Degradation Logic -- `src/lib/ai/claude-degradation.ts`

Utility module that determines what happens when Claude is unavailable for each feature in the routing table. Used by the LiveAIRouter's fallback logic and by UI components that need to show degradation messages.

```ts
/**
 * Claude graceful degradation logic.
 *
 * Determines the degradation behavior when Claude is unavailable
 * for each feature in the AI routing table.
 *
 * Three degradation modes:
 * 1. FALLBACK_AVAILABLE -- Another provider can handle the feature
 *    (e.g., narrated-telemetry-deep falls back to Ollama).
 * 2. FEATURE_DISABLED -- No fallback exists; feature shows a
 *    "configure API key" message (e.g., builder-mode).
 * 3. NOT_AFFECTED -- Feature does not use Claude at all
 *    (e.g., camera-director-structured uses pattern-matcher).
 *
 * References: tech-decisions.md (Cost Control -- "No API key = Launch
 * works entirely on Ollama + rule engines"), AD-7 (graceful degradation)
 */

import type { AIFeature, AIProvider } from '@/lib/interfaces/ai-router'
import { AI_ROUTING_TABLE } from '@/lib/interfaces/ai-router'

// ============================================================================
// Degradation Result Types
// ============================================================================

export type DegradationMode = 'fallback-available' | 'feature-disabled' | 'not-affected'

export interface DegradationResult {
  /** How the feature degrades without Claude. */
  readonly mode: DegradationMode
  /** The fallback provider, if mode is 'fallback-available'. */
  readonly fallbackProvider: AIProvider | null
  /** User-facing message to display. */
  readonly message: string
  /** Whether the feature is still usable (possibly at reduced quality). */
  readonly usable: boolean
}

// ============================================================================
// Feature-Specific Degradation Messages
// ============================================================================

const DEGRADATION_MESSAGES: Readonly<Record<string, string>> = {
  'narrated-telemetry-deep':
    'Deep-dive narration is using Ollama (local). Quality may be reduced. Configure ANTHROPIC_API_KEY in .env.local for Claude-powered analysis.',
  'builder-mode':
    'Builder Mode requires Claude. Configure ANTHROPIC_API_KEY in .env.local to enable AI-powered station layout proposals.',
  'camera-director-nl': 'Camera Director is using Ollama (local). Claude fallback is unavailable.',
  'narrated-telemetry-batch':
    'Batch narration is using Ollama (local). Claude fallback is unavailable.',
} as const

// ============================================================================
// Degradation Resolver
// ============================================================================

/**
 * Determine what happens to a specific feature when Claude is unavailable.
 *
 * @param feature - The AI feature to check.
 * @param ollamaAvailable - Whether Ollama is currently available.
 * @returns Degradation result describing the behavior.
 */
export function getClaudeDegradation(
  feature: AIFeature,
  ollamaAvailable: boolean
): DegradationResult {
  const rule = AI_ROUTING_TABLE.find((r) => r.feature === feature)

  if (!rule) {
    return {
      mode: 'not-affected',
      fallbackProvider: null,
      message: '',
      usable: false,
    }
  }

  // If Claude is not involved in this feature at all, it is not affected.
  if (rule.primary !== 'claude' && rule.fallback !== 'claude') {
    return {
      mode: 'not-affected',
      fallbackProvider: null,
      message: '',
      usable: true,
    }
  }

  // Claude is the primary provider for this feature.
  if (rule.primary === 'claude') {
    if (rule.fallback === null) {
      // No fallback. Feature is disabled.
      return {
        mode: 'feature-disabled',
        fallbackProvider: null,
        message: DEGRADATION_MESSAGES[feature] ?? `${feature} requires Claude API.`,
        usable: false,
      }
    }

    // Fallback exists. Check if the fallback provider is available.
    const fallbackUsable = rule.fallback === 'ollama' ? ollamaAvailable : true
    return {
      mode: 'fallback-available',
      fallbackProvider: rule.fallback,
      message: DEGRADATION_MESSAGES[feature] ?? `${feature} using fallback provider.`,
      usable: fallbackUsable,
    }
  }

  // Claude is the fallback for this feature. Primary is something else.
  // The feature still works via the primary; Claude fallback is just unavailable.
  return {
    mode: 'fallback-available',
    fallbackProvider: rule.primary,
    message: DEGRADATION_MESSAGES[feature] ?? '',
    usable: true,
  }
}

/**
 * Get degradation status for ALL features in the routing table.
 * Used by settings panel to show a comprehensive status overview.
 */
export function getAllDegradationStatuses(
  claudeAvailable: boolean,
  ollamaAvailable: boolean
): ReadonlyArray<{
  feature: AIFeature
  degradation: DegradationResult
}> {
  if (claudeAvailable) {
    // Claude is available. No degradation for any feature.
    return AI_ROUTING_TABLE.map((rule) => ({
      feature: rule.feature,
      degradation: {
        mode: 'not-affected' as const,
        fallbackProvider: null,
        message: '',
        usable: true,
      },
    }))
  }

  return AI_ROUTING_TABLE.map((rule) => ({
    feature: rule.feature,
    degradation: getClaudeDegradation(rule.feature, ollamaAvailable),
  }))
}
```

### 4.7 Environment Configuration -- `.env.local` template

Template for the environment variable that enables Claude. Added to `.env.local.example` (committed) and `.env.local` (gitignored).

```bash
# .env.local.example
#
# Claude API Integration (WS-4.1)
# Set your Anthropic API key to enable Claude-powered features.
# Without this key, all AI features work via Ollama (local) + rule engines.
#
# Get your key at: https://console.anthropic.com/settings/keys
#
# ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional: Override the default Claude model (claude-sonnet-4-20250514)
# ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

**`.gitignore` addition** (ensure `.env.local` is gitignored -- Next.js default):

```gitignore
# Already in Next.js default .gitignore, but verify:
.env.local
```

---

## 5. Acceptance Criteria

| ID    | Criterion                                                                                                                                                                              | Verification Method                                                                                                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| AC-1  | `ClaudeProvider.healthCheck()` returns `{ keyConfigured: false, reachable: false }` when `ANTHROPIC_API_KEY` is not set                                                                | Unit test: instantiate `ClaudeProvider` with `apiKey: null`; call `healthCheck()`; assert result fields                                                                                                       |
| AC-2  | `ClaudeProvider.healthCheck()` returns `{ keyConfigured: true, reachable: true }` when a valid API key is configured                                                                   | Integration test: set `ANTHROPIC_API_KEY` to a valid key; call `healthCheck()`; assert `reachable === true` with `latencyMs > 0`                                                                              |
| AC-3  | `ClaudeProvider.healthCheck()` returns `{ keyConfigured: true, reachable: false, error: 'Invalid API key...' }` when an invalid API key is configured                                  | Integration test: set `ANTHROPIC_API_KEY` to `sk-invalid`; call `healthCheck()`; assert error classification is `auth`                                                                                        |
| AC-4  | `ClaudeProvider.chat()` returns structured JSON content and a valid `ClaudeTokenUsage` with `estimatedCostUsd > 0` for a successful request                                            | Integration test: send a simple prompt; parse response content as JSON; verify `usage.inputTokens > 0`, `usage.outputTokens > 0`, `usage.estimatedCostUsd > 0`                                                |
| AC-5  | `ClaudeProvider.chat()` returns `{ success: false }` with `error` containing `'no-api-key'` when API key is not configured                                                             | Unit test: instantiate with `apiKey: null`; call `chat()`; assert `success === false` and error message mentions API key                                                                                      |
| AC-6  | `ClaudeProvider` correctly classifies errors: `auth` for 401, `rate-limit` for 429, `overloaded` for 529, `timeout` for AbortError, `network` for connection failures                  | Unit test: mock Anthropic SDK to throw each error type; verify `classifyError()` returns correct `ClaudeErrorType`                                                                                            |
| AC-7  | `POST /api/ai/claude` proxies a chat request to Claude and returns `{ success: true, content, latencyMs, modelId, usage }`                                                             | Integration test: POST valid payload with API key configured; assert 200 response with all expected fields                                                                                                    |
| AC-8  | `POST /api/ai/claude` returns 503 with `{ configured: false }` when `ANTHROPIC_API_KEY` is not set                                                                                     | Integration test: unset API key; POST valid payload; assert 503 with `configured: false`                                                                                                                      |
| AC-9  | `POST /api/ai/claude` returns 400 when `systemPrompt` or `userMessage` is missing                                                                                                      | Integration test: POST with missing fields; assert 400 with descriptive error                                                                                                                                 |
| AC-10 | `GET /api/ai/claude` returns Claude health status with `{ configured, reachable, model, error, latencyMs }`                                                                            | Integration test: GET endpoint; verify response shape matches expected fields                                                                                                                                 |
| AC-11 | `LiveAIRouter.executeProvider('claude', ...)` routes through the `/api/ai/claude` proxy (not directly to Anthropic SDK) to keep the API key server-side                                | Code review: verify the `'claude'` case in `executeProvider()` uses `fetch(this.claudeProxyUrl, ...)`                                                                                                         |
| AC-12 | `LiveAIRouter.route()` for `narrated-telemetry-deep` (Claude primary, Ollama fallback): when Claude is available, uses Claude; when Claude unavailable, falls back to Ollama           | Unit test: (a) set Claude available, route request, assert `provider === 'claude'`; (b) set Claude unavailable + Ollama available, route request, assert `provider === 'ollama'` and `fallbackUsed === true`  |
| AC-13 | `LiveAIRouter.route()` for `builder-mode` (Claude primary, no fallback): when Claude unavailable, returns `{ success: false }` with descriptive error mentioning API key configuration | Unit test: set Claude unavailable; route `builder-mode` request; assert `success === false` and error message                                                                                                 |
| AC-14 | `LiveAIRouter.route()` for `camera-director-nl` (Ollama primary, Claude fallback): when Ollama fails and Claude is available, falls back to Claude                                     | Unit test: set Ollama unavailable + Claude available; route request; assert `provider === 'claude'` and `fallbackUsed === true`                                                                               |
| AC-15 | Rate limits enforced for Claude-primary features: `narrated-telemetry-deep` limited to 5 calls/min, `builder-mode` limited to 3 calls/min                                              | Unit test: call `route()` 6 times in quick succession for `narrated-telemetry-deep`; assert 6th call returns rate-limit error. Call `route()` 4 times for `builder-mode`; assert 4th returns rate-limit error |
| AC-16 | `ai.store.sessionCost.estimatedCostUsd` increments after each successful Claude API call with the server-returned cost estimate                                                        | Unit test: mock a Claude response with `usage.estimatedCostUsd: 0.001`; call `recordAICost('claude', 'builder-mode', 0.001)`; assert `estimatedCostUsd === 0.001`                                             |
| AC-17 | `ai.store.claudeApiKeyConfigured` and `ai.store.claudeReady` update after `setClaudeStatus()` is called                                                                                | Unit test: call `setClaudeStatus(true, true, null)`; assert store state reflects `claudeReady === true`, `claudeApiKeyConfigured === true`                                                                    |
| AC-18 | `useClaudeHealthCheck()` hook polls `GET /api/ai/claude` every 120s when AI beta is enabled and updates the AI store                                                                   | Functional test: enable beta, mock fetch, advance timers by 120s, verify `setClaudeStatus` was called. Disable beta, verify polling stops                                                                     |
| AC-19 | `getClaudeDegradation('builder-mode', true)` returns `{ mode: 'feature-disabled', usable: false }` with a message mentioning API key configuration                                     | Unit test: call function; assert all fields match expected degradation                                                                                                                                        |
| AC-20 | `getClaudeDegradation('narrated-telemetry-deep', true)` returns `{ mode: 'fallback-available', fallbackProvider: 'ollama', usable: true }`                                             | Unit test: call function; assert fallback to Ollama is indicated                                                                                                                                              |
| AC-21 | `getClaudeDegradation('camera-director-structured', true)` returns `{ mode: 'not-affected' }` since the feature does not involve Claude                                                | Unit test: call function; assert mode is 'not-affected'                                                                                                                                                       |
| AC-22 | `ANTHROPIC_API_KEY` never appears in client-side JavaScript bundles                                                                                                                    | Build verification: run `pnpm build`; search output bundles in `.next/static/` for `ANTHROPIC` or `sk-ant`; assert zero matches                                                                               |
| AC-23 | `@anthropic-ai/sdk` is listed in `package.json` dependencies after `pnpm add @anthropic-ai/sdk`                                                                                        | Verify: `cat package.json                                                                                                                                                                                     | grep anthropic` returns a match |
| AC-24 | `pnpm typecheck` passes with zero errors after all new and modified files are in place                                                                                                 | Run `pnpm tsc --noEmit` and verify exit code 0                                                                                                                                                                |
| AC-25 | All new files follow existing project patterns: `motion/react` for animations, types in `src/lib/interfaces/`, pnpm for package management                                             | Code review: verify import paths and package references                                                                                                                                                       |

---

## 6. Decisions Made

| ID   | Decision                                                                                             | Rationale                                                                                                                                                                                                                                                                           | Source                                   |
| ---- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| D-1  | Claude provider runs exclusively server-side via Route Handler proxy                                 | The `ANTHROPIC_API_KEY` must never reach client bundles. The Route Handler pattern is established by WS-3.4's Ollama proxy (`app/api/ai/chat/route.ts`). Client-side code (LiveAIRouter) calls `fetch('/api/ai/claude')` instead of importing the Anthropic SDK directly            | AD-7 (security), WS-3.4 pattern          |
| D-2  | Default model is `claude-sonnet-4-20250514` (not Opus or Haiku)                                      | Sonnet balances reasoning quality with cost and latency. Builder Mode and deep-dive narration need good reasoning but not Opus-level depth. Haiku would be too weak for Builder Mode's novel layout proposals. Model is overridable via `ANTHROPIC_MODEL` env var                   | tech-decisions.md, cost-quality tradeoff |
| D-3  | Health check interval is 120s (vs 60s for Ollama)                                                    | Claude health checks cost money (~$0.000003 per ping). At 120s intervals over a typical 8-hour dev session, this costs ~$0.0007 -- negligible but respectful of API costs. Ollama is free so checks every 60s                                                                       | Cost Control (tech-decisions.md)         |
| D-4  | Rate limits for Claude features: deep-narration 5/min, builder-mode 3/min                            | Builder Mode generates full station layouts (high-token responses), so a lower limit protects against accidental cost spikes. Deep narration is mid-weight. These supplement the existing Ollama limits (camera-director-nl: 1/3s, narration-batch: 10/min)                         | tech-decisions.md (Cost Control)         |
| D-5  | Cost estimation uses static per-token pricing, not real-time API billing                             | Real-time billing would require Anthropic dashboard API access or webhook integration, which adds complexity for a dev tool. Static pricing with model-specific rates gives a useful approximation. Estimates are labeled as approximate in the UI                                  | Simplicity for localhost tool            |
| D-6  | `ClaudeProvider.chat()` uses non-streaming mode (not `stream: true`)                                 | Streaming complicates the Route Handler response (requires SSE or chunked encoding) for marginal benefit in this use case. Responses are assembled server-side and returned complete. Future enhancement can add streaming for progressive UI rendering                             | Simplicity, WS-3.4 pattern               |
| D-7  | `LiveAIRouter` routes Claude requests through `fetch()` to the Route Handler (not direct SDK import) | The LiveAIRouter runs client-side in the browser. It cannot access `process.env.ANTHROPIC_API_KEY`. The Route Handler acts as a secure proxy. This is the same pattern used for Ollama (proxied via `/api/ai/chat`)                                                                 | AD-9 (Route Handler pattern)             |
| D-8  | Singleton `ClaudeProvider` in the Route Handler with lazy initialization                             | Avoids re-creating the Anthropic SDK client on every request. Lazy init handles the case where `.env.local` is updated and the dev server restarts. The provider re-reads `process.env` at each request to detect key changes                                                       | Performance, DX                          |
| D-9  | `ANTHROPIC_API_KEY` is stored in `.env.local` (not `.env`)                                           | `.env.local` is gitignored by default in Next.js projects, preventing accidental commits of the API key. `.env` is sometimes committed for non-secret defaults. This follows Next.js best practices for secrets                                                                     | Next.js convention, security             |
| D-10 | Graceful degradation is handled at three levels: provider, router, and UI                            | The `ClaudeProvider` returns `{ success: false }` when unconfigured. The `LiveAIRouter` falls back to the next provider per the routing table. The UI uses `getClaudeDegradation()` to show feature-specific messages. This three-layer approach ensures no unhandled failure modes | AD-7 (graceful degradation)              |
| D-11 | `recordAICost()` signature extended with optional `estimatedCostUsd` parameter                       | Backward compatible with existing callers (Ollama passes no cost). Claude callers pass the server-returned cost estimate. Avoids duplicating cost calculation logic on the client                                                                                                   | Backward compatibility                   |
| D-12 | Health check uses a minimal `messages.create()` with `max_tokens: 1` (not a dedicated ping endpoint) | Anthropic does not offer a lightweight health/ping endpoint. A minimal message creation request validates both authentication and API availability. Cost is ~$0.000003 per check                                                                                                    | Anthropic API constraints                |

---

## 7. Open Questions

| ID   | Question                                                                                                                    | Owner        | Impact                                                                                                                                                   | Default if Unresolved                                                                                                                                     |
| ---- | --------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-1 | Should the settings panel include a UI to input/update the API key at runtime (without editing `.env.local`)?               | Stakeholder  | Would improve DX but requires secure client-to-server key transmission and server-side persistence. Adds attack surface for a localhost tool             | No runtime key UI. Use `.env.local` only. Revisit if stakeholder requests it                                                                              |
| OQ-2 | Should Claude cost estimates be persisted to Supabase for cross-session tracking, or is per-session (in-memory) sufficient? | Architecture | Cross-session tracking provides long-term cost visibility but adds a Supabase write on every Claude call                                                 | Per-session only. Resets on page reload. Revisit if cost visibility becomes a concern                                                                     |
| OQ-3 | Should the health check ping use a cheaper model (e.g., `claude-haiku-4-20250514`) instead of the configured model?         | Backend      | Using Haiku for health checks reduces cost further (~$0.0000002 per check vs $0.000003). But it does not validate that the configured model is available | Use the configured model for health checks to validate full availability. Cost difference is negligible                                                   |
| OQ-4 | Should the Claude proxy route handler enforce authentication (e.g., require the session key from `sessionStorage`)?         | Security     | Without auth, any process on localhost could call `/api/ai/claude` and use the API key. With auth, only the Launch UI can make requests                  | No auth on the proxy. Localhost-only tool per project constraints. The Route Handler is not exposed externally                                            |
| OQ-5 | Should the `ClaudeProvider` support tool use / function calling for Builder Mode's structured output?                       | Architecture | Tool use provides more reliable structured output than system prompt instructions. But it adds complexity to the provider interface                      | System prompt JSON instructions for now. Tool use can be added when Builder Mode (WS-4.3) is implemented if structured output reliability is insufficient |

---

## 8. Risk Register

| #    | Risk                                                                                                                             | Likelihood | Impact   | Severity | Blocking? | Mitigation                                                                                                                                                                                                                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | `ANTHROPIC_API_KEY` accidentally committed to version control                                                                    | Low        | Critical | High     | No        | Key is in `.env.local` which is gitignored by default in Next.js. The `.env.local.example` template contains only a placeholder comment. AC-22 verifies the key never appears in built bundles. Pre-commit hooks can scan for `sk-ant-` patterns                                                                       |
| R-2  | Claude API latency (1-10s) makes deep-dive narration feel sluggish                                                               | Medium     | Medium   | Medium   | No        | The Route Handler returns the full response only when complete. The LiveAIRouter's existing fallback logic automatically falls back to Ollama if Claude times out (30s default). Future enhancement: streaming support for progressive rendering                                                                       |
| R-3  | Claude API rate limits (Anthropic-side) cause intermittent failures                                                              | Low        | Medium   | Low      | No        | The LiveAIRouter applies local rate limits (5/min deep narration, 3/min builder mode) well below Anthropic's typical rate limits. If Anthropic rate limits are hit, the `ClaudeProvider` classifies the error as `rate-limit` and marks it retryable. The router falls back to Ollama where available                  |
| R-4  | Claude API cost accumulates unexpectedly during development/testing                                                              | Medium     | Low      | Low      | No        | Per-session cost counter in the AI store provides real-time visibility. Rate limits cap maximum calls per minute. Default model (Sonnet) is mid-tier pricing. No auto-retry on failure prevents cost doubling. Health checks use `max_tokens: 1` to minimize cost                                                      |
| R-5  | `@anthropic-ai/sdk` package size increases bundle size significantly                                                             | Low        | Low      | Low      | No        | The SDK is only imported server-side (Route Handler). It does not enter client bundles. Next.js tree-shakes server-side imports from the client build. Verify with AC-22 (bundle inspection)                                                                                                                           |
| R-6  | Claude model version (`claude-sonnet-4-20250514`) becomes deprecated or unavailable                                              | Low        | Medium   | Low      | No        | Model is configurable via `ANTHROPIC_MODEL` env var. If the default model is deprecated, updating the env var is a one-line change. `DEFAULT_CLAUDE_CONFIG` can be updated in a patch release. Health check will surface the error immediately                                                                         |
| R-7  | Developers without API keys see confusing error states across multiple features                                                  | Medium     | Medium   | Medium   | No        | Graceful degradation module (`claude-degradation.ts`) provides feature-specific messages. Builder Mode says "Configure API key to enable." Deep narration silently falls back to Ollama. The settings panel shows a clear "Claude: Not configured" status. Zero-API-key mode is the default and fully functional state |
| R-8  | Network connectivity issues (developer offline) cause Claude health check to fail repeatedly, polluting the AI store with errors | Medium     | Low      | Low      | No        | Health check interval is 120s (not aggressive). Errors are stored as a single `claudeError` string (not accumulated). When connectivity returns, the next health check clears the error. The health check uses `AbortSignal.timeout(10_000)` to avoid hanging                                                          |
| R-9  | Race condition between Claude health check and concurrent Claude requests                                                        | Low        | Low      | Low      | No        | The `LiveAIRouter` checks `providerStatuses.get('claude')` before each request. If a health check marks Claude unavailable mid-request, the in-flight request will still complete or fail on its own. The status update does not abort in-flight requests. Next request will see the updated status                    |
| R-10 | The `estimatedCostUsd` in token usage is inaccurate due to static pricing                                                        | Low        | Low      | Low      | No        | Cost is labeled as "estimated" in the UI. Static pricing is updated when model pricing changes. For a localhost dev tool, approximate costs are sufficient. Developers who need precise billing should use the Anthropic dashboard                                                                                     |
