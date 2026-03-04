/**
 * Tarva Chat District Data Route Handler.
 *
 * GET /api/districts/tarva-chat
 *
 * Fetches health, conversations, and agent data from the Tarva Chat app
 * at localhost:4000 and returns a consolidated TarvaChatSnapshot payload.
 *
 * Timeout: 3 seconds per upstream request.
 * Failure mode: Returns available=false with null sections for any
 * unavailable data. Each fetcher catches its own errors and returns null,
 * so one failing endpoint does not block others.
 *
 * This route provides enrichment data; health status comes from /api/telemetry.
 */

import { NextResponse } from 'next/server'
import type {
  TarvaChatSnapshot,
  ChatStatusData,
  ChatConversationsData,
  ChatAgentsData,
  ChatConnection,
  McpHealthSummary,
  ChatConversation,
  ChatAgent,
} from '@/lib/tarva-chat-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Tarva Chat base URL.
 * Per CLAUDE.md: localhost:4000 (NOT 3000 or 3005).
 */
const TARVA_CHAT_BASE = 'http://localhost:4000'

/**
 * Timeout for individual API calls to Tarva Chat.
 * Matches the WS-1.5 health check timeout.
 */
const FETCH_TIMEOUT_MS = 3_000

// ============================================================================
// Generic Fetch with Timeout
// ============================================================================

/**
 * Fetch a JSON endpoint from Tarva Chat with timeout.
 * Returns null on any failure (network, timeout, parse, non-200).
 */
async function fetchChatEndpoint<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(`${TARVA_CHAT_BASE}${path}`, {
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!response.ok) return null

    const data = await response.json()
    return data as T
  } catch {
    return null
  }
}

// ============================================================================
// Raw Response Shapes (from Tarva Chat APIs)
// ============================================================================

interface RawHealthResponse {
  status: string
  uptime?: number
  version?: string
  checks?: Record<string, string>
}

interface RawConversation {
  id: string
  title?: string
  agent_name?: string
  agent_slug?: string
  message_count?: number
  last_message?: string
  updated_at?: string
}

interface RawConversationsResponse {
  conversations?: RawConversation[]
  total?: number
}

interface RawAgent {
  slug: string
  name?: string
  model?: string
  conversation_count?: number
  last_used_at?: string | null
}

interface RawAgentsResponse {
  agents?: RawAgent[]
}

// ============================================================================
// Data Fetchers
// ============================================================================

/**
 * Map a health check sub-check value to a connection status.
 */
function mapCheckToConnectionStatus(
  value: string | undefined
): ChatConnection['status'] {
  if (value === undefined) return 'unknown'
  if (value === 'ok') return 'connected'
  if (value === 'degraded') return 'degraded'
  return 'disconnected'
}

/**
 * Build status data from Tarva Chat's health endpoint.
 *
 * Synthesizes connection list from the health response's `checks` map.
 * If Tarva Chat adds a richer diagnostics endpoint in the future,
 * the handler can switch without changing the station component contract.
 */
async function fetchStatusData(): Promise<ChatStatusData | null> {
  const health = await fetchChatEndpoint<RawHealthResponse>('/api/health')

  if (!health) return null

  const checks = health.checks ?? {}

  // Synthesize connection list from known dependencies.
  const connections: ChatConnection[] = [
    {
      id: 'supabase',
      name: 'Supabase',
      status: mapCheckToConnectionStatus(checks['database'] ?? checks['supabase']),
      latencyMs: null,
      endpoint: 'localhost:54331',
    },
    {
      id: 'claude-api',
      name: 'Claude API',
      status: mapCheckToConnectionStatus(checks['claude'] ?? checks['anthropic']),
      latencyMs: null,
      endpoint: 'api.anthropic.com',
    },
    {
      id: 'ollama',
      name: 'Ollama',
      status: mapCheckToConnectionStatus(checks['ollama']),
      latencyMs: null,
      endpoint: 'localhost:11434',
    },
  ]

  // MCP health: synthesized from checks or a dedicated endpoint.
  const mcpOk = checks['mcp'] === 'ok'
  const mcpHealth: McpHealthSummary = {
    total: 17,
    healthy: mcpOk ? 17 : 0,
    degraded: 0,
    down: mcpOk ? 0 : 17,
    tiers: {
      singleton: { total: 3, healthy: mcpOk ? 3 : 0 },
      pooled: { total: 7, healthy: mcpOk ? 7 : 0 },
      ephemeral: { total: 7, healthy: mcpOk ? 7 : 0 },
    },
  }

  return {
    connections,
    mcpHealth,
    activeSseStreams: 0, // Not available from health endpoint; future: /api/diagnostics
    recentErrors: [], // Not available from health endpoint; future: /api/errors
  }
}

/**
 * Truncate a string to maxLen characters, appending ellipsis if truncated.
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '\u2026'
}

/**
 * Fetch conversations data from Tarva Chat.
 *
 * Attempts GET /api/conversations?limit=5&sort=lastActivity.
 * If the endpoint does not exist, returns null (graceful degradation).
 */
async function fetchConversationsData(): Promise<ChatConversationsData | null> {
  const raw = await fetchChatEndpoint<RawConversationsResponse>(
    '/api/conversations?limit=5&sort=lastActivity'
  )

  if (!raw || !raw.conversations) return null

  const recent: ChatConversation[] = raw.conversations.map((c) => ({
    id: c.id,
    title: truncate(c.title ?? 'Untitled', 60),
    agentName: c.agent_name ?? 'Unknown Agent',
    agentSlug: c.agent_slug ?? 'unknown',
    messageCount: c.message_count ?? 0,
    lastMessagePreview: truncate(c.last_message ?? '', 80),
    lastActivityAt: c.updated_at ?? new Date().toISOString(),
  }))

  return {
    activeCount: raw.total ?? recent.length,
    recent,
    throughputHistory: [], // Not available from conversations endpoint; future metric
  }
}

/**
 * Fetch agents data from Tarva Chat.
 *
 * Attempts GET /api/agents.
 * If the endpoint does not exist, returns null (graceful degradation).
 */
async function fetchAgentsData(): Promise<ChatAgentsData | null> {
  const raw = await fetchChatEndpoint<RawAgentsResponse>('/api/agents')

  if (!raw || !raw.agents) return null

  const sorted = [...raw.agents].sort(
    (a, b) => (b.conversation_count ?? 0) - (a.conversation_count ?? 0)
  )

  const topAgents: ChatAgent[] = sorted.slice(0, 5).map((a) => ({
    slug: a.slug,
    name: a.name ?? a.slug,
    model: a.model ?? 'unknown',
    conversationCount: a.conversation_count ?? 0,
    lastUsedAt: a.last_used_at ?? null,
  }))

  return {
    loadedCount: raw.agents.length,
    topAgents,
    skillActivationCount: 0, // Not available from agents endpoint; future metric
  }
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * GET /api/districts/tarva-chat
 *
 * Aggregates Tarva Chat-specific data for the district's station panels.
 * Fetches health, conversations, and agents endpoints in parallel.
 * Returns a TarvaChatSnapshot with null sections for any unavailable data.
 */
export async function GET() {
  const [status, conversations, agents] = await Promise.all([
    fetchStatusData(),
    fetchConversationsData(),
    fetchAgentsData(),
  ])

  // Available if we got at least the health data.
  const available = status !== null

  const snapshot: TarvaChatSnapshot = {
    timestamp: new Date().toISOString(),
    available,
    status,
    conversations,
    agents,
  }

  return NextResponse.json(snapshot)
}
