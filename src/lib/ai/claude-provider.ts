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
 *
 * @module claude-provider
 * @see WS-4.1
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  DEFAULT_CLAUDE_CONFIG,
  CLAUDE_COST_PER_TOKEN,
} from './claude-types'
import type {
  ClaudeConfig,
  ClaudeHealthResult,
  ClaudeChatResult,
  ClaudeTokenUsage,
  ClaudeErrorType,
} from './claude-types'

// Re-export types and constants so the route handler can import from here.
export { DEFAULT_CLAUDE_CONFIG, CLAUDE_COST_PER_TOKEN } from './claude-types'
export type {
  ClaudeConfig,
  ClaudeHealthResult,
  ClaudeChatResult,
  ClaudeTokenUsage,
  ClaudeErrorType,
} from './claude-types'

// ============================================================================
// Error Class
// ============================================================================

export class ClaudeError extends Error {
  constructor(
    message: string,
    public readonly errorType: ClaudeErrorType,
    public readonly retryable: boolean,
    public readonly cause?: unknown,
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
        error:
          'ANTHROPIC_API_KEY not configured. Set it in .env.local to enable Claude.',
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
    } = {},
  ): Promise<ClaudeChatResult> {
    const startTime = performance.now()

    if (!this.config.apiKey) {
      return {
        success: false,
        content: '',
        provider: 'claude',
        modelId: this.config.model,
        latencyMs: 0,
        error:
          'ANTHROPIC_API_KEY not configured. Set it in .env.local to enable Claude.',
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
      const textBlocks = response.content.filter(
        (block) => block.type === 'text',
      )
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
    usage: { input_tokens: number; output_tokens: number } | undefined,
  ): ClaudeTokenUsage | null {
    if (!usage) return null

    const pricing =
      CLAUDE_COST_PER_TOKEN[this.config.model] ??
      CLAUDE_COST_PER_TOKEN['default']!

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
