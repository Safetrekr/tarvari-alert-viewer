/**
 * Tarva Chat district types.
 *
 * These types define the consolidated payload from GET /api/districts/tarva-chat
 * and the domain-specific shapes used by the Conversations and Agents stations.
 *
 * Source data comes from the Tarva Chat app at localhost:4000:
 * - GET /api/health (health checks, dependency status)
 * - GET /api/conversations?limit=5&sort=lastActivity (recent conversations)
 * - GET /api/agents (loaded agent roster)
 *
 * References:
 * - AD-8 (Tarva Chat stations: Conversations, Agents)
 * - TARVA-SYSTEM-OVERVIEW.md (port assignments: Tarva Chat = 4000)
 */

// ============================================================================
// Status: Connections & Dependencies
// ============================================================================

/**
 * Connection dependency for the Status station.
 * Each represents an external service that Tarva Chat depends on.
 */
export interface ChatConnection {
  /** Service identifier. */
  readonly id: string
  /** Human-readable service name. */
  readonly name: string
  /** Connection status. */
  readonly status: 'connected' | 'degraded' | 'disconnected' | 'unknown'
  /** Response latency in ms, or null if not measurable. */
  readonly latencyMs: number | null
  /** Service port or URL for display. */
  readonly endpoint: string
}

/**
 * MCP server health summary for the Status station.
 * Tarva Chat manages 17 MCP servers across 3 tiers.
 */
export interface McpHealthSummary {
  /** Total MCP server count. */
  readonly total: number
  /** Servers responding to health checks. */
  readonly healthy: number
  /** Servers with degraded performance. */
  readonly degraded: number
  /** Servers not responding. */
  readonly down: number
  /** Breakdown by tier. */
  readonly tiers: {
    readonly singleton: { readonly total: number; readonly healthy: number }
    readonly pooled: { readonly total: number; readonly healthy: number }
    readonly ephemeral: { readonly total: number; readonly healthy: number }
  }
}

/**
 * A recent error entry for the Status station.
 */
export interface ChatError {
  /** Error message (truncated to 120 chars). */
  readonly message: string
  /** ISO 8601 timestamp. */
  readonly timestamp: string
  /** Error severity. */
  readonly severity: 'warning' | 'error' | 'critical'
  /** Source component or route. */
  readonly source: string
}

/**
 * Status station data for Tarva Chat.
 */
export interface ChatStatusData {
  /** External service connections. */
  readonly connections: readonly ChatConnection[]
  /** MCP server health summary. */
  readonly mcpHealth: McpHealthSummary
  /** Number of active SSE streams (active chat sessions). */
  readonly activeSseStreams: number
  /** Last 3 errors, newest first. */
  readonly recentErrors: readonly ChatError[]
}

// ============================================================================
// Conversations
// ============================================================================

/**
 * A conversation summary for the Conversations station.
 */
export interface ChatConversation {
  /** Conversation UUID. */
  readonly id: string
  /** Conversation title (max 60 chars, truncated with ellipsis). */
  readonly title: string
  /** Agent display name used in this conversation. */
  readonly agentName: string
  /** Agent slug for avatar/icon lookup. */
  readonly agentSlug: string
  /** Total message count. */
  readonly messageCount: number
  /** Preview of the last message (max 80 chars, truncated). */
  readonly lastMessagePreview: string
  /** ISO 8601 timestamp of last activity. */
  readonly lastActivityAt: string
}

/**
 * Conversations station data for Tarva Chat.
 */
export interface ChatConversationsData {
  /** Total active conversation count. */
  readonly activeCount: number
  /** Recent conversations sorted by last activity (max 5). */
  readonly recent: readonly ChatConversation[]
  /** Message throughput data points for sparkline (messages per interval, last 12 intervals). */
  readonly throughputHistory: readonly number[]
}

// ============================================================================
// Agents
// ============================================================================

/**
 * An agent summary for the Agents station.
 */
export interface ChatAgent {
  /** Agent slug. */
  readonly slug: string
  /** Agent display name. */
  readonly name: string
  /** Model identifier (e.g., 'claude-sonnet-4-20250514', 'ollama:llama3.2'). */
  readonly model: string
  /** Number of conversations using this agent. */
  readonly conversationCount: number
  /** ISO 8601 timestamp of last use, or null. */
  readonly lastUsedAt: string | null
}

/**
 * Agents station data for Tarva Chat.
 */
export interface ChatAgentsData {
  /** Total loaded agent count. */
  readonly loadedCount: number
  /** Top agents by conversation count (max 5). */
  readonly topAgents: readonly ChatAgent[]
  /** Total skill activations across all conversations. */
  readonly skillActivationCount: number
}

// ============================================================================
// Consolidated District Payload
// ============================================================================

/**
 * Aggregated snapshot of all Tarva Chat-specific data.
 * Returned by GET /api/districts/tarva-chat.
 */
export interface TarvaChatSnapshot {
  /** ISO 8601 timestamp when this snapshot was generated. */
  readonly timestamp: string
  /** Whether the fetch to Tarva Chat succeeded. */
  readonly available: boolean
  /** Status station data, or null if Tarva Chat is unavailable. */
  readonly status: ChatStatusData | null
  /** Conversations station data, or null if unavailable. */
  readonly conversations: ChatConversationsData | null
  /** Agents station data, or null if unavailable. */
  readonly agents: ChatAgentsData | null
}

/**
 * Default empty snapshot used when Tarva Chat is unreachable.
 */
export const EMPTY_TARVA_CHAT_SNAPSHOT: TarvaChatSnapshot = {
  timestamp: new Date().toISOString(),
  available: false,
  status: null,
  conversations: null,
  agents: null,
}
