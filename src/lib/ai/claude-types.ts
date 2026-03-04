/**
 * Claude provider types and cost constants.
 *
 * This file contains types and constants that are safe to import from
 * both client and server code. It does NOT import @anthropic-ai/sdk.
 *
 * The ClaudeProvider class (which imports the SDK) lives in
 * claude-provider.ts and should only be imported server-side.
 *
 * @module claude-types
 * @see WS-4.1
 */

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
export const CLAUDE_COST_PER_TOKEN: Readonly<
  Record<string, { input: number; output: number }>
> = {
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
