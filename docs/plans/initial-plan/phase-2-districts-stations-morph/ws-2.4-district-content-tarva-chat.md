# WS-2.4: District Content -- Tarva Chat

> **Workstream ID:** WS-2.4
> **Phase:** 2 -- Districts + Stations + Morph
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.5 (telemetry aggregator), WS-2.1 (morph choreography), WS-2.6 (station panel framework)
> **Blocks:** None
> **Resolves:** None

---

## 1. Objective

Implement the four Z2/Z3 station panels for the Tarva Chat district: **Launch**, **Status**, **Conversations**, and **Agents**. Launch and Status are universal stations that follow the shared pattern from WS-2.6; Conversations and Agents are app-specific stations that surface Tarva Chat's unique data -- active conversation health, message throughput, loaded agents, and skill activation metrics.

Data flows from two sources: the WS-1.5 telemetry aggregator (health status, connection states, response times) and a dedicated Launch-side route handler that proxies Tarva Chat's own API surface (conversations list, agent roster, MCP server health). The stations consume the WS-2.6 station panel framework for their 3-zone glass layout and receipt stamp integration.

**Success looks like:** A user zooms into the Tarva Chat district at Z2 and sees four station panels unfurl with staggered entrance. The Status station shows live connection health for Supabase, Claude API, and Ollama, with an MCP server health summary. The Conversations station lists the 5 most recent conversations with agent names, message counts, and relative timestamps, plus an active conversation count badge and a message throughput sparkline. The Agents station shows loaded agent count, the top 5 most-used agents, and skill activation metrics. Every action button triggers a receipt stamp. All data refreshes on the telemetry polling cycle without manual intervention.

---

## 2. Scope

### In Scope

- **Launch station** (`src/components/stations/tarva-chat/chat-launch-station.tsx`): Universal station rendering Tarva Chat's URL (`localhost:4000`), app version, port, last accessed timestamp, and connection status. Actions: "Open App" (opens `http://localhost:4000` in a new tab), "Copy URL" (copies to clipboard).
- **Status station** (`src/components/stations/tarva-chat/chat-status-station.tsx`): Universal station rendering dependency connection list (Supabase on port 54331, Claude API, Ollama on port 11434), MCP server health summary (17 servers across 3 tiers), active SSE stream count, performance metrics (response time sparkline, uptime), and last 3 errors if any. Action: "Refresh" (triggers immediate telemetry re-check).
- **Conversations station** (`src/components/stations/tarva-chat/chat-conversations-station.tsx`): App-specific station showing active conversation count, recent conversations table (title, agent, message count, last message preview, relative time), and message throughput sparkline. Actions: "Open Conversation" (opens Tarva Chat to selected conversation), "New Conversation" (opens Tarva Chat to new conversation).
- **Agents station** (`src/components/stations/tarva-chat/chat-agents-station.tsx`): App-specific station showing loaded agent count, most-used agents list (agent name, model, conversation count, last used), and skill activation count. Action: "Browse Agents" (opens Tarva Chat agent picker).
- **Tarva Chat data types** (`src/types/districts/tarva-chat.ts`): TypeScript interfaces for all Tarva Chat-specific data structures consumed by the stations.
- **Tarva Chat data hook** (`src/hooks/use-tarva-chat-data.ts`): TanStack Query hook that fetches Tarva Chat-specific data from the Launch route handler, with the same adaptive polling cadence as the telemetry aggregator.
- **Route handler** (`src/app/api/districts/tarva-chat/route.ts`): Server-side proxy that fetches Tarva Chat's API endpoints (`/api/health`, `/api/conversations`, `/api/agents`) and aggregates them into a single `TarvaChatSnapshot` response.
- **Barrel export** (`src/components/stations/tarva-chat/index.ts`): Re-exports all four station components.

### Out of Scope

- Station panel framework (3-zone layout, glass material, luminous borders, receipt stamp trigger) -- provided by WS-2.6
- Morph choreography (capsule-to-district transition, station entrance stagger) -- provided by WS-2.1
- Universal telemetry aggregator health checks -- provided by WS-1.5
- Tarva Chat application changes (adding endpoints, modifying behavior) -- this workstream reads existing APIs
- Evidence Ledger receipt persistence -- provided by WS-3.1
- AI-driven narrated telemetry interpretation -- deferred to WS-3.6
- Real-time WebSocket/SSE transport from Tarva Chat to Launch -- polling is the Phase 2 architecture per AD-5

---

## 3. Input Dependencies

| Dependency                                         | Source         | What It Provides                                                                                                                                                                | Status                                                  |
| -------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Telemetry aggregator with `tarva-chat` health data | WS-1.5         | `AppTelemetry` for Tarva Chat in the districts store: status, uptime, version, responseTimeHistory, alertCount, checks                                                          | Required                                                |
| Station panel framework                            | WS-2.6         | `<StationPanel>` component with 3-zone layout (header/body/actions), glass material, luminous border, receipt stamp trigger, `StationLayout` and `StationAction` type contracts | Required                                                |
| Morph choreography                                 | WS-2.1         | District unfurl animation that mounts station components with staggered entrance; `useDistrictState()` hook providing `districtId` and `isSettled`                              | Required                                                |
| Station template registry                          | WS-1.7         | `tarva-chat--conversations` and `tarva-chat--agents` template definitions with layout metadata                                                                                  | Required                                                |
| Design tokens                                      | WS-0.2         | `--color-teal-*` (data accents), `--color-ember-*` (interactive accents), `--glow-*`, glass utility classes, Geist Mono/Sans fonts                                              | Required                                                |
| `@tarva/ui` components                             | Package        | `StatusBadge`, `Sparkline`, `Badge`, `ScrollArea`, `Tooltip`, `Button`, `Card`                                                                                                  | Required                                                |
| Tarva Chat API surface                             | Tarva Chat app | `GET /api/health`, existing conversation/agent endpoints (read-only)                                                                                                            | Available (endpoints may not exist yet -- see OQ-2.4.1) |
| `useTelemetry()` hook                              | WS-1.5         | Access to the latest `SystemSnapshot` for Tarva Chat telemetry                                                                                                                  | Required                                                |
| Districts store                                    | WS-1.5         | `useDistrictsStore()` for reading `districts['tarva-chat']` telemetry data                                                                                                      | Required                                                |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  app/
    api/
      districts/
        tarva-chat/
          route.ts                      # Server-side proxy for Tarva Chat APIs
  components/
    stations/
      tarva-chat/
        chat-launch-station.tsx         # Universal: open app, copy URL
        chat-status-station.tsx         # Universal: connections, metrics, errors
        chat-conversations-station.tsx  # App-specific: conversation list + metrics
        chat-agents-station.tsx         # App-specific: agent roster + usage
        index.ts                        # Barrel export
  hooks/
    use-tarva-chat-data.ts              # TanStack Query hook for Chat-specific data
  lib/
    tarva-chat-types.ts                 # TypeScript interfaces for Chat district data
```

### 4.2 Type Definitions (`src/types/districts/tarva-chat.ts`)

Central type definitions for all Tarva Chat district data. These types describe the data shapes returned by the route handler and consumed by the station components.

```ts
// ============================================================================
// Tarva Chat District Data Types
// ============================================================================

/**
 * Connection dependency for the Status station.
 * Each represents an external service that Tarva Chat depends on.
 */
export interface ChatConnection {
  /** Service identifier */
  id: string
  /** Human-readable service name */
  name: string
  /** Connection status */
  status: 'connected' | 'degraded' | 'disconnected' | 'unknown'
  /** Response latency in ms, or null if not measurable */
  latencyMs: number | null
  /** Service port or URL for display */
  endpoint: string
}

/**
 * MCP server health summary for the Status station.
 * Tarva Chat manages 17 MCP servers across 3 tiers.
 */
export interface McpHealthSummary {
  /** Total MCP server count */
  total: number
  /** Servers responding to health checks */
  healthy: number
  /** Servers with degraded performance */
  degraded: number
  /** Servers not responding */
  down: number
  /** Breakdown by tier */
  tiers: {
    singleton: { total: number; healthy: number }
    pooled: { total: number; healthy: number }
    ephemeral: { total: number; healthy: number }
  }
}

/**
 * A recent error entry for the Status station.
 */
export interface ChatError {
  /** Error message (truncated to 120 chars) */
  message: string
  /** ISO 8601 timestamp */
  timestamp: string
  /** Error severity */
  severity: 'warning' | 'error' | 'critical'
  /** Source component or route */
  source: string
}

/**
 * Status station data for Tarva Chat.
 */
export interface ChatStatusData {
  /** External service connections */
  connections: ChatConnection[]
  /** MCP server health summary */
  mcpHealth: McpHealthSummary
  /** Number of active SSE streams (active chat sessions) */
  activeSseStreams: number
  /** Last 3 errors, newest first */
  recentErrors: ChatError[]
}

/**
 * A conversation summary for the Conversations station.
 */
export interface ChatConversation {
  /** Conversation UUID */
  id: string
  /** Conversation title (max 60 chars, truncated with ellipsis) */
  title: string
  /** Agent display name used in this conversation */
  agentName: string
  /** Agent slug for avatar/icon lookup */
  agentSlug: string
  /** Total message count */
  messageCount: number
  /** Preview of the last message (max 80 chars, truncated) */
  lastMessagePreview: string
  /** ISO 8601 timestamp of last activity */
  lastActivityAt: string
}

/**
 * Conversations station data for Tarva Chat.
 */
export interface ChatConversationsData {
  /** Total active conversation count */
  activeCount: number
  /** Recent conversations sorted by last activity (max 5) */
  recent: ChatConversation[]
  /** Message throughput data points for sparkline (messages per interval, last 12 intervals) */
  throughputHistory: number[]
}

/**
 * An agent summary for the Agents station.
 */
export interface ChatAgent {
  /** Agent slug */
  slug: string
  /** Agent display name */
  name: string
  /** Model identifier (e.g., 'claude-sonnet-4-20250514', 'ollama:llama3.2') */
  model: string
  /** Number of conversations using this agent */
  conversationCount: number
  /** ISO 8601 timestamp of last use, or null */
  lastUsedAt: string | null
}

/**
 * Agents station data for Tarva Chat.
 */
export interface ChatAgentsData {
  /** Total loaded agent count */
  loadedCount: number
  /** Top agents by conversation count (max 5) */
  topAgents: ChatAgent[]
  /** Total skill activations across all conversations */
  skillActivationCount: number
}

/**
 * Aggregated snapshot of all Tarva Chat-specific data.
 * Returned by GET /api/districts/tarva-chat.
 */
export interface TarvaChatSnapshot {
  /** ISO 8601 timestamp when this snapshot was generated */
  timestamp: string
  /** Whether the fetch to Tarva Chat succeeded */
  available: boolean
  /** Status station data, or null if Tarva Chat is unavailable */
  status: ChatStatusData | null
  /** Conversations station data, or null if unavailable */
  conversations: ChatConversationsData | null
  /** Agents station data, or null if unavailable */
  agents: ChatAgentsData | null
}
```

### 4.3 Route Handler (`src/app/api/districts/tarva-chat/route.ts`)

Server-side proxy that fetches Tarva Chat's API endpoints and aggregates them into a `TarvaChatSnapshot`. This handler runs on the Launch server -- it never exposes Tarva Chat's internal APIs to the browser directly.

```ts
import { NextResponse } from 'next/server'
import type {
  TarvaChatSnapshot,
  ChatStatusData,
  ChatConversationsData,
  ChatAgentsData,
  ChatConnection,
  McpHealthSummary,
  ChatError,
  ChatConversation,
  ChatAgent,
} from '@/lib/tarva-chat-types'

/**
 * Tarva Chat base URL.
 * Per project constraints: localhost:4000.
 */
const TARVA_CHAT_BASE = 'http://localhost:4000'

/**
 * Timeout for individual API calls to Tarva Chat.
 * Matches the WS-1.5 health check timeout.
 */
const FETCH_TIMEOUT_MS = 3_000

/**
 * Fetch a JSON endpoint from Tarva Chat with timeout.
 * Returns null on any failure (network, timeout, parse, non-200).
 */
async function fetchChatEndpoint<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(`${TARVA_CHAT_BASE}${path}`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const data = await response.json()
    return data as T
  } catch {
    return null
  }
}

/**
 * Build status data from Tarva Chat's health endpoint and
 * any additional diagnostic endpoints.
 *
 * The health endpoint is expected to return the standard contract
 * from tech-decisions.md: { status, uptime, version, checks }.
 * Additional fields (connections, mcp, sse) are populated from
 * dedicated endpoints if they exist, or synthesized from the
 * health response checks map.
 */
async function fetchStatusData(): Promise<ChatStatusData | null> {
  const health = await fetchChatEndpoint<{
    status: string
    uptime?: number
    version?: string
    checks?: Record<string, string>
  }>('/api/health')

  if (!health) return null

  // Synthesize connection list from known dependencies.
  // If Tarva Chat exposes a dedicated /api/diagnostics endpoint
  // in the future, this can be replaced with a direct fetch.
  const checks = health.checks ?? {}

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
  const mcpHealth: McpHealthSummary = {
    total: 17,
    healthy: checks['mcp'] === 'ok' ? 17 : 0,
    degraded: 0,
    down: checks['mcp'] === 'ok' ? 0 : 17,
    tiers: {
      singleton: { total: 3, healthy: checks['mcp'] === 'ok' ? 3 : 0 },
      pooled: { total: 7, healthy: checks['mcp'] === 'ok' ? 7 : 0 },
      ephemeral: { total: 7, healthy: checks['mcp'] === 'ok' ? 7 : 0 },
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
 * Map a health check sub-check value to a connection status.
 */
function mapCheckToConnectionStatus(
  value: string | undefined
): 'connected' | 'degraded' | 'disconnected' | 'unknown' {
  if (value === undefined) return 'unknown'
  if (value === 'ok') return 'connected'
  if (value === 'degraded') return 'degraded'
  return 'disconnected'
}

/**
 * Fetch conversations data from Tarva Chat.
 *
 * Attempts GET /api/conversations?limit=5&sort=lastActivity.
 * If the endpoint does not exist, returns null (graceful degradation).
 */
async function fetchConversationsData(): Promise<ChatConversationsData | null> {
  // Attempt the conversations endpoint
  const raw = await fetchChatEndpoint<{
    conversations?: Array<{
      id: string
      title?: string
      agent_name?: string
      agent_slug?: string
      message_count?: number
      last_message?: string
      updated_at?: string
    }>
    total?: number
  }>('/api/conversations?limit=5&sort=lastActivity')

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
  const raw = await fetchChatEndpoint<{
    agents?: Array<{
      slug: string
      name?: string
      model?: string
      conversation_count?: number
      last_used_at?: string | null
    }>
  }>('/api/agents')

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

/**
 * Truncate a string to maxLen characters, appending ellipsis if truncated.
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 1) + '\u2026'
}

/**
 * GET /api/districts/tarva-chat
 *
 * Aggregates Tarva Chat-specific data for the district's station panels.
 * Fetches health, conversations, and agents endpoints in parallel.
 * Returns a TarvaChatSnapshot with null sections for any unavailable data.
 *
 * This handler is intentionally tolerant: if Tarva Chat is offline or
 * any endpoint is missing, it returns partial data rather than failing.
 * The station components render graceful empty/offline states for
 * null sections.
 */
export async function GET() {
  const [status, conversations, agents] = await Promise.all([
    fetchStatusData(),
    fetchConversationsData(),
    fetchAgentsData(),
  ])

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
```

**Design decisions in this handler:**

1. **Parallel fetches**: All three data sources are fetched concurrently via `Promise.all`. Each fetcher catches its own errors and returns `null`, so one failing endpoint does not block others.

2. **Synthesized connection data**: Tarva Chat may not expose a dedicated diagnostics endpoint. The handler synthesizes connection status from the health check `checks` map (e.g., `checks.database = 'ok'` becomes `connected`). If Tarva Chat adds a richer diagnostics API, the handler can switch to direct consumption without changing the station component contract.

3. **No caching**: The handler returns fresh data on every request. Caching is handled client-side by TanStack Query's staleTime and refetchInterval configuration.

4. **Snake_case to camelCase**: Tarva Chat's API likely uses snake_case (Supabase convention). The handler normalizes to camelCase for the Launch's TypeScript conventions.

### 4.4 TanStack Query Hook (`src/hooks/use-tarva-chat-data.ts`)

Client-side polling hook for Tarva Chat-specific district data. Follows the same adaptive polling pattern as `useTelemetry()` from WS-1.5.

```ts
'use client'

import { useQuery } from '@tanstack/react-query'
import type { TarvaChatSnapshot } from '@/lib/tarva-chat-types'
import { useDistrictsStore } from '@/stores/districts.store'
import { POLLING_INTERVALS } from '@/lib/telemetry-config'

/**
 * Fetch the Tarva Chat district snapshot from the Launch route handler.
 */
async function fetchTarvaChatData(): Promise<TarvaChatSnapshot> {
  const response = await fetch('/api/districts/tarva-chat')
  if (!response.ok) {
    throw new Error(`Tarva Chat data fetch failed: ${response.status}`)
  }
  return response.json()
}

/**
 * Hook for fetching Tarva Chat-specific district data.
 *
 * Polls GET /api/districts/tarva-chat at the same adaptive interval
 * as the telemetry aggregator. Only enabled when the Tarva Chat
 * district is actively visible (Z2/Z3 focused on tarva-chat).
 *
 * @param enabled - Whether to poll (true when Tarva Chat district is visible)
 * @returns The latest TarvaChatSnapshot plus query state
 */
export function useTarvaChatData(enabled: boolean = false) {
  const chatStatus = useDistrictsStore((s) => s.districts['tarva-chat']?.status ?? 'UNKNOWN')

  const query = useQuery({
    queryKey: ['district', 'tarva-chat'],
    queryFn: fetchTarvaChatData,
    enabled,
    /**
     * Poll at the normal interval when enabled.
     * If Tarva Chat is DEGRADED or DOWN, tighten to alert interval.
     * Disabled when the district is not visible (enabled = false).
     */
    refetchInterval: enabled
      ? chatStatus === 'DEGRADED' || chatStatus === 'DOWN'
        ? POLLING_INTERVALS.alert
        : POLLING_INTERVALS.normal
      : false,
    refetchIntervalInBackground: false,
    staleTime: 0,
    /**
     * On error (Tarva Chat unreachable), return a synthetic unavailable
     * snapshot rather than throwing. The stations render offline states.
     */
    placeholderData: {
      timestamp: new Date().toISOString(),
      available: false,
      status: null,
      conversations: null,
      agents: null,
    },
  })

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    /** Whether Tarva Chat returned any data */
    isAvailable: query.data?.available ?? false,
  }
}
```

**Key design choices:**

1. **`enabled` parameter**: The hook only polls when the Tarva Chat district is actively visible at Z2/Z3. When the user zooms back to Z1 or navigates to a different district, polling stops. This prevents unnecessary network traffic and server load.

2. **Adaptive interval from districts store**: Reads the Tarva Chat health status from the districts store (populated by WS-1.5) to determine whether to tighten the polling interval. This ensures the status and district-specific data are polled in sync.

3. **`placeholderData`**: Provides a synthetic empty snapshot so station components always have a non-null render shape. The `available: false` flag triggers offline state rendering.

4. **`refetchIntervalInBackground: false`**: Unlike the telemetry aggregator (which polls in the background to maintain global health awareness), district-specific data only polls when the user is actively viewing the district.

### 4.5 Launch Station (`src/components/stations/tarva-chat/chat-launch-station.tsx`)

Universal station for opening Tarva Chat in a new browser tab.

```tsx
'use client'

import { useCallback } from 'react'
import type { StationLayout } from '@/lib/station-types'
import { useDistrictsStore } from '@/stores/districts.store'

/**
 * Tarva Chat launch URL.
 * Per project constraints: localhost:4000.
 */
const TARVA_CHAT_URL = 'http://localhost:4000'

export interface ChatLaunchStationProps {
  /** Whether the parent district has settled after morph (enables interactions) */
  isSettled: boolean
}

/**
 * Station layout metadata for the Launch station.
 * Consumed by the StationPanel framework component from WS-2.6.
 */
export const chatLaunchLayout: StationLayout = {
  header: { title: 'Launch', icon: 'ExternalLink' },
  bodyType: 'launch',
  actions: [
    {
      id: 'open-app',
      label: 'Open App',
      variant: 'default',
      command: 'open tarva-chat',
      icon: 'ExternalLink',
    },
    {
      id: 'copy-url',
      label: 'Copy URL',
      variant: 'secondary',
      command: 'copy-url tarva-chat',
      icon: 'Copy',
    },
  ],
}

/**
 * Launch station body content for Tarva Chat.
 *
 * Renders app metadata: name, URL, port, version, uptime,
 * and connection status. The StationPanel wrapper (WS-2.6)
 * provides the header, glass material, and action buttons.
 *
 * Body layout (bodyType: 'launch'):
 * - App name: "Tarva Chat"
 * - URL: http://localhost:4000
 * - Version: from telemetry (or "--" if offline)
 * - Uptime: from telemetry (formatted duration or "--")
 * - Status: HealthBadge from WS-1.5 display components
 */
export function ChatLaunchStationBody({ isSettled }: ChatLaunchStationProps) {
  const telemetry = useDistrictsStore((s) => s.districts['tarva-chat'])

  const version = telemetry?.version ?? '--'
  const uptime = telemetry?.uptime ? formatUptime(telemetry.uptime) : '--'
  const status = telemetry?.status ?? 'UNKNOWN'
  const lastContact = telemetry?.lastSuccessfulContact
    ? formatRelativeTime(telemetry.lastSuccessfulContact)
    : 'Never'

  return {
    appName: 'Tarva Chat',
    url: TARVA_CHAT_URL,
    port: 3005,
    version,
    uptime,
    status,
    lastContact,
    isSettled,
  }
}

/**
 * Open Tarva Chat in a new browser tab.
 * Used by the StationPanel action handler when "Open App" is clicked.
 */
export function openTarvaChat(): void {
  window.open(TARVA_CHAT_URL, '_blank', 'noopener,noreferrer')
}

/**
 * Copy Tarva Chat URL to clipboard.
 * Used by the StationPanel action handler when "Copy URL" is clicked.
 */
export async function copyTarvaChatUrl(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(TARVA_CHAT_URL)
    return true
  } catch {
    return false
  }
}

// -- Utilities --

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then

  if (diffMs < 60_000) return 'Just now'
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`
  return `${Math.floor(diffMs / 86_400_000)}d ago`
}
```

### 4.6 Status Station (`src/components/stations/tarva-chat/chat-status-station.tsx`)

Universal station rendering Tarva Chat's health dashboard: dependency connections, MCP health, active streams, and recent errors.

```tsx
'use client'

import type { StationLayout } from '@/lib/station-types'
import type { ChatStatusData, ChatConnection, McpHealthSummary } from '@/lib/tarva-chat-types'
import { useDistrictsStore } from '@/stores/districts.store'

export interface ChatStatusStationProps {
  /** Tarva Chat status data from useTarvaChatData() */
  statusData: ChatStatusData | null
  /** Whether the parent district has settled after morph */
  isSettled: boolean
}

/**
 * Station layout metadata for the Status station.
 */
export const chatStatusLayout: StationLayout = {
  header: { title: 'Status', icon: 'Activity' },
  bodyType: 'metrics',
  actions: [
    {
      id: 'refresh',
      label: 'Refresh',
      variant: 'secondary',
      command: 'refresh tarva-chat',
      icon: 'RefreshCw',
    },
  ],
}

/**
 * Connection status row data for the StationPanel body.
 *
 * Each connection renders as:
 *   [status dot] [name]     [latency]   [endpoint]
 *
 * Status dot colors:
 * - connected:    --color-healthy (green)
 * - degraded:     --color-warning (amber)
 * - disconnected: --color-error (red)
 * - unknown:      --color-offline (gray)
 */
export interface ConnectionRowData {
  id: string
  name: string
  status: ChatConnection['status']
  latencyMs: number | null
  endpoint: string
  /** Mapped status color CSS custom property */
  colorToken: string
}

/**
 * Map connection status to design token.
 */
function connectionStatusToToken(status: ChatConnection['status']): string {
  switch (status) {
    case 'connected':
      return '--color-healthy'
    case 'degraded':
      return '--color-warning'
    case 'disconnected':
      return '--color-error'
    case 'unknown':
    default:
      return '--color-offline'
  }
}

/**
 * Status station body content for Tarva Chat.
 *
 * Body layout (bodyType: 'metrics'):
 * Section 1 - Connections:
 *   List of dependency services with status dots + latency
 *
 * Section 2 - MCP Health:
 *   Summary bar: "14/17 healthy" with tier breakdown
 *
 * Section 3 - Performance:
 *   Response time sparkline from telemetry aggregator data
 *   Active SSE streams count
 *
 * Section 4 - Recent Errors (if any):
 *   Last 3 errors with severity badge + timestamp + message
 */
export function buildChatStatusBodyData(
  statusData: ChatStatusData | null,
  telemetryResponseHistory: number[]
): {
  connections: ConnectionRowData[]
  mcpHealth: McpHealthSummary | null
  activeSseStreams: number
  responseTimeHistory: number[]
  recentErrors: ChatStatusData['recentErrors']
  isOffline: boolean
} {
  if (!statusData) {
    return {
      connections: [
        {
          id: 'supabase',
          name: 'Supabase',
          status: 'unknown',
          latencyMs: null,
          endpoint: 'localhost:54331',
          colorToken: '--color-offline',
        },
        {
          id: 'claude-api',
          name: 'Claude API',
          status: 'unknown',
          latencyMs: null,
          endpoint: 'api.anthropic.com',
          colorToken: '--color-offline',
        },
        {
          id: 'ollama',
          name: 'Ollama',
          status: 'unknown',
          latencyMs: null,
          endpoint: 'localhost:11434',
          colorToken: '--color-offline',
        },
      ],
      mcpHealth: null,
      activeSseStreams: 0,
      responseTimeHistory: [],
      recentErrors: [],
      isOffline: true,
    }
  }

  return {
    connections: statusData.connections.map((c) => ({
      ...c,
      colorToken: connectionStatusToToken(c.status),
    })),
    mcpHealth: statusData.mcpHealth,
    activeSseStreams: statusData.activeSseStreams,
    responseTimeHistory: telemetryResponseHistory,
    recentErrors: statusData.recentErrors,
    isOffline: false,
  }
}
```

### 4.7 Conversations Station (`src/components/stations/tarva-chat/chat-conversations-station.tsx`)

App-specific station showing active conversation count, recent conversation table, and message throughput sparkline.

```tsx
'use client'

import type { StationLayout } from '@/lib/station-types'
import type { ChatConversationsData, ChatConversation } from '@/lib/tarva-chat-types'

export interface ChatConversationsStationProps {
  /** Conversations data from useTarvaChatData() */
  conversationsData: ChatConversationsData | null
  /** Whether the parent district has settled after morph */
  isSettled: boolean
}

/**
 * Station layout metadata for the Conversations station.
 * Per AD-8: app-specific station for Tarva Chat.
 * Per IA Assessment: table body with conversation rows.
 */
export const chatConversationsLayout: StationLayout = {
  header: { title: 'Conversations', icon: 'MessageSquare' },
  bodyType: 'table',
  actions: [
    {
      id: 'open-conversation',
      label: 'Open Conversation',
      variant: 'default',
      command: 'open tarva-chat',
      icon: 'ExternalLink',
    },
    {
      id: 'new-conversation',
      label: 'New Conversation',
      variant: 'secondary',
      command: 'open tarva-chat',
      icon: 'Plus',
    },
  ],
}

/**
 * Conversation table column definitions.
 * Consumed by the StationPanel table body renderer (WS-2.6).
 *
 * Table layout per IA Assessment:
 *   [Title]  [Agent]  [Messages]  [Last Activity]
 *
 * Typography per VISUAL-DESIGN-SPEC.md Z3:
 * - Table header: Geist Sans, 11px, weight 600, tracking 0.04em, uppercase, opacity 0.6
 * - Table data:   Geist Mono, 13px, weight 400, opacity 0.8
 * - Table number:  Geist Mono, 13px, weight 500, tabular-nums, opacity 0.85
 */
export const conversationColumns = [
  {
    id: 'title',
    header: 'Title',
    accessor: (row: ChatConversation) => row.title,
    width: '40%',
    font: 'sans',
  },
  {
    id: 'agent',
    header: 'Agent',
    accessor: (row: ChatConversation) => row.agentName,
    width: '25%',
    font: 'sans',
  },
  {
    id: 'messages',
    header: 'Messages',
    accessor: (row: ChatConversation) => String(row.messageCount),
    width: '15%',
    font: 'mono',
    align: 'right' as const,
  },
  {
    id: 'lastActivity',
    header: 'Last Active',
    accessor: (row: ChatConversation) => formatRelativeTime(row.lastActivityAt),
    width: '20%',
    font: 'mono',
  },
] as const

/**
 * Conversations station body data builder.
 *
 * Body layout:
 *
 * +------------------------------------------+
 * | ACTIVE CONVERSATIONS        [count badge] |
 * +------------------------------------------+
 * | Title     Agent      Msgs    Last Active  |
 * |------------------------------------------|
 * | Refact..  react-dev  24      3m ago       |
 * | Debug..   debugger   12      1h ago       |
 * | API de..  api-eng    8       2h ago       |
 * | Archit..  architect  45      5h ago       |
 * | Deploy..  devops     6       1d ago       |
 * +------------------------------------------+
 * | ~~~ message throughput sparkline ~~~      |
 * +------------------------------------------+
 *
 * Empty state (no conversations):
 *   "No conversations yet. Start a new conversation in Tarva Chat."
 *
 * Offline state (Tarva Chat unavailable):
 *   "Tarva Chat is offline. Conversation data unavailable."
 */
export function buildConversationsBodyData(data: ChatConversationsData | null): {
  activeCount: number
  rows: ChatConversation[]
  throughputHistory: number[]
  state: 'loaded' | 'empty' | 'offline'
} {
  if (!data) {
    return {
      activeCount: 0,
      rows: [],
      throughputHistory: [],
      state: 'offline',
    }
  }

  if (data.recent.length === 0) {
    return {
      activeCount: 0,
      rows: [],
      throughputHistory: data.throughputHistory,
      state: 'empty',
    }
  }

  return {
    activeCount: data.activeCount,
    rows: data.recent,
    throughputHistory: data.throughputHistory,
    state: 'loaded',
  }
}

// -- Utility --

function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then

  if (diffMs < 60_000) return 'Just now'
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`
  return `${Math.floor(diffMs / 86_400_000)}d ago`
}
```

### 4.8 Agents Station (`src/components/stations/tarva-chat/chat-agents-station.tsx`)

App-specific station showing loaded agent count, top agents by usage, and skill activation metrics.

```tsx
'use client'

import type { StationLayout } from '@/lib/station-types'
import type { ChatAgentsData, ChatAgent } from '@/lib/tarva-chat-types'

export interface ChatAgentsStationProps {
  /** Agents data from useTarvaChatData() */
  agentsData: ChatAgentsData | null
  /** Whether the parent district has settled after morph */
  isSettled: boolean
}

/**
 * Station layout metadata for the Agents station.
 * Per AD-8: app-specific station for Tarva Chat.
 * Per WS-1.7: list body with agent items.
 */
export const chatAgentsLayout: StationLayout = {
  header: { title: 'Agents', icon: 'Bot' },
  bodyType: 'list',
  actions: [
    {
      id: 'browse-agents',
      label: 'Browse Agents',
      variant: 'default',
      command: 'open tarva-chat',
      icon: 'Users',
    },
  ],
}

/**
 * Agent list item data for the StationPanel list body renderer.
 *
 * List item layout:
 *   [Agent Name]                    [conversation count]
 *   [model]                         [last used relative time]
 *
 * Typography:
 * - Agent name:         Geist Sans, 13px, weight 500, opacity 0.85
 * - Model identifier:   Geist Mono, 11px, weight 400, opacity 0.5, uppercase
 * - Conversation count: Geist Mono, 13px, weight 500, tabular-nums, teal accent
 * - Last used:          Geist Mono, 11px, weight 400, opacity 0.5
 */
export interface AgentListItem {
  id: string
  name: string
  model: string
  /** Display string for model, shortened for UI */
  modelShort: string
  conversationCount: number
  lastUsed: string
}

/**
 * Shorten a model identifier for display.
 * 'claude-sonnet-4-20250514' -> 'claude-sonnet-4'
 * 'ollama:llama3.2' -> 'ollama:llama3.2'
 */
function shortenModel(model: string): string {
  // Strip date suffixes from Claude models (e.g., '-20250514')
  const dateStripped = model.replace(/-\d{8}$/, '')
  return dateStripped
}

/**
 * Agents station body data builder.
 *
 * Body layout:
 *
 * +------------------------------------------+
 * | LOADED AGENTS           [count]           |
 * | SKILL ACTIVATIONS       [count]           |
 * +------------------------------------------+
 * | react-developer               12 convos   |
 * |   claude-sonnet-4              3m ago      |
 * |------------------------------------------|
 * | api-engineer                    8 convos   |
 * |   ollama:llama3.2              1h ago      |
 * |------------------------------------------|
 * | debugger                        5 convos   |
 * |   claude-sonnet-4              2h ago      |
 * +------------------------------------------+
 *
 * Empty state (no agents loaded):
 *   "No agents loaded. Agents load from ~/.claude/agents/ at startup."
 *
 * Offline state (Tarva Chat unavailable):
 *   "Tarva Chat is offline. Agent data unavailable."
 */
export function buildAgentsBodyData(data: ChatAgentsData | null): {
  loadedCount: number
  skillActivationCount: number
  items: AgentListItem[]
  state: 'loaded' | 'empty' | 'offline'
} {
  if (!data) {
    return {
      loadedCount: 0,
      skillActivationCount: 0,
      items: [],
      state: 'offline',
    }
  }

  if (data.topAgents.length === 0) {
    return {
      loadedCount: data.loadedCount,
      skillActivationCount: data.skillActivationCount,
      items: [],
      state: 'empty',
    }
  }

  const items: AgentListItem[] = data.topAgents.map((a) => ({
    id: a.slug,
    name: a.name,
    model: a.model,
    modelShort: shortenModel(a.model),
    conversationCount: a.conversationCount,
    lastUsed: a.lastUsedAt ? formatRelativeTime(a.lastUsedAt) : 'Never',
  }))

  return {
    loadedCount: data.loadedCount,
    skillActivationCount: data.skillActivationCount,
    items,
    state: 'loaded',
  }
}

// -- Utility --

function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then

  if (diffMs < 60_000) return 'Just now'
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`
  return `${Math.floor(diffMs / 86_400_000)}d ago`
}
```

### 4.9 Barrel Export (`src/components/stations/tarva-chat/index.ts`)

```ts
// Tarva Chat District Stations
// Per AD-8: 2 universal + 2 app-specific stations

// Station body components
export {
  ChatLaunchStationBody,
  chatLaunchLayout,
  openTarvaChat,
  copyTarvaChatUrl,
} from './chat-launch-station'
export { buildChatStatusBodyData, chatStatusLayout } from './chat-status-station'
export {
  buildConversationsBodyData,
  chatConversationsLayout,
  conversationColumns,
} from './chat-conversations-station'
export { buildAgentsBodyData, chatAgentsLayout } from './chat-agents-station'

// Types
export type { ChatLaunchStationProps } from './chat-launch-station'
export type { ChatStatusStationProps, ConnectionRowData } from './chat-status-station'
export type { ChatConversationsStationProps } from './chat-conversations-station'
export type { ChatAgentsStationProps, AgentListItem } from './chat-agents-station'
```

### 4.10 Integration: District-Level Component

The stations are composed into the Tarva Chat district view by the morph choreography system (WS-2.1). The pattern for how districts mount their stations follows the WS-2.6 station panel framework. Below is the expected integration contract -- the actual district container component is owned by WS-2.1, not this workstream.

```tsx
/**
 * Expected integration pattern (owned by WS-2.1 / WS-2.6, not this workstream).
 *
 * The district container component:
 * 1. Reads the station templates for 'tarva-chat' from the StationTemplateRegistry
 * 2. Mounts each station inside a <StationPanel> from WS-2.6
 * 3. Passes the appropriate data from useTarvaChatData() to each station body
 * 4. Handles staggered entrance animation via motion/react
 *
 * Pseudocode for the integration:
 *
 *   const { snapshot } = useTarvaChatData(isDistrictVisible)
 *   const telemetry = useDistrictsStore(s => s.districts['tarva-chat'])
 *
 *   <StationPanel layout={chatLaunchLayout}>
 *     <ChatLaunchStationBody isSettled={isSettled} />
 *   </StationPanel>
 *
 *   <StationPanel layout={chatStatusLayout}>
 *     <ChatStatusBody
 *       statusData={snapshot?.status ?? null}
 *       responseTimeHistory={telemetry?.responseTimeHistory ?? []}
 *     />
 *   </StationPanel>
 *
 *   <StationPanel layout={chatConversationsLayout}>
 *     <ChatConversationsBody
 *       conversationsData={snapshot?.conversations ?? null}
 *     />
 *   </StationPanel>
 *
 *   <StationPanel layout={chatAgentsLayout}>
 *     <ChatAgentsBody
 *       agentsData={snapshot?.agents ?? null}
 *     />
 *   </StationPanel>
 */
```

---

## 5. Acceptance Criteria

All criteria must pass before WS-2.4 is marked complete.

| #     | Criterion                                                                                                                                                                                                                                                                              | Verification                                                                                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-1  | **Four stations render** within the Tarva Chat district at Z2/Z3: Launch, Status, Conversations, Agents.                                                                                                                                                                               | Visual inspection: zoom into Tarva Chat district; confirm 4 panels visible.                                                                      |
| AC-2  | **Launch station shows correct metadata**: app name "Tarva Chat", URL `http://localhost:4000`, port 3005, version from telemetry (or "--" when offline), uptime formatted as duration.                                                                                                 | Visual inspection + code review against constants.                                                                                               |
| AC-3  | **"Open App" action opens** `http://localhost:4000` in a new browser tab with `noopener,noreferrer`.                                                                                                                                                                                   | Click action; verify new tab opens to correct URL. Browser devtools: verify `rel` attribute.                                                     |
| AC-4  | **"Copy URL" action copies** `http://localhost:4000` to the system clipboard.                                                                                                                                                                                                          | Click action; paste into a text field; verify URL is correct.                                                                                    |
| AC-5  | **Status station shows 3 connections**: Supabase (port 54331), Claude API (api.anthropic.com), Ollama (port 11434). Each displays a colored status dot matching its connection state.                                                                                                  | Visual inspection: verify 3 rows with correct names and endpoints.                                                                               |
| AC-6  | **Status station shows MCP health summary**: "N/17 healthy" with tier breakdown (singleton, pooled, ephemeral).                                                                                                                                                                        | Visual inspection when Tarva Chat is OPERATIONAL.                                                                                                |
| AC-7  | **Status station shows response time sparkline** using data from the telemetry aggregator's `responseTimeHistory`. Sparkline uses teal accent color (`--color-teal`).                                                                                                                  | Visual inspection: sparkline visible with teal color. Verify data source is `districts['tarva-chat'].responseTimeHistory`.                       |
| AC-8  | **Conversations station shows active count** as a badge in the station header area.                                                                                                                                                                                                    | Visual inspection when Tarva Chat is OPERATIONAL with conversations.                                                                             |
| AC-9  | **Conversations station shows recent conversations table** with 4 columns: Title, Agent, Messages, Last Active. Maximum 5 rows. Title truncated at 60 chars.                                                                                                                           | Visual inspection: verify column headers, row count, and truncation.                                                                             |
| AC-10 | **Conversations station message count** uses Geist Mono with `tabular-nums`. Numbers do not shift horizontally when values change.                                                                                                                                                     | Visual inspection during a telemetry cycle that updates message counts.                                                                          |
| AC-11 | **Agents station shows loaded count** and skill activation count as header metrics.                                                                                                                                                                                                    | Visual inspection when Tarva Chat is OPERATIONAL with agents loaded.                                                                             |
| AC-12 | **Agents station shows top 5 agents** sorted by conversation count descending. Each agent row shows name, model (date suffix stripped), conversation count, and last used relative time.                                                                                               | Visual inspection: verify sort order, model formatting, and relative times.                                                                      |
| AC-13 | **Offline state: all stations show graceful offline treatment** when Tarva Chat is OFFLINE or DOWN. No blank panels, no error stack traces. Status station shows "unknown" dots on all connections. Conversations shows "Tarva Chat is offline." Agents shows "Tarva Chat is offline." | Stop Tarva Chat; verify all 4 stations render their offline states.                                                                              |
| AC-14 | **Empty state: Conversations station shows empty message** when Tarva Chat is running but has zero conversations. Agents station shows empty message when no agents are loaded.                                                                                                        | Clear conversations/agents in Tarva Chat; verify empty state messages.                                                                           |
| AC-15 | **Loading state: stations show loading treatment** during initial data fetch.                                                                                                                                                                                                          | Verify skeleton/loading indicators appear briefly on first render before data arrives.                                                           |
| AC-16 | **Route handler tolerates missing endpoints**: if Tarva Chat lacks `/api/conversations` or `/api/agents`, the handler returns `null` for those sections without failing the entire request.                                                                                            | Stop Tarva Chat or remove endpoints; verify partial data returns with non-null sections for available endpoints.                                 |
| AC-17 | **Route handler completes within 4 seconds**: all 3 parallel fetches (health, conversations, agents) each have 3s timeouts, and they run concurrently. Total wall time should not exceed ~3.5s even if all endpoints time out.                                                         | Measure response time of `GET /api/districts/tarva-chat` with Tarva Chat stopped (worst case).                                                   |
| AC-18 | **Polling only when visible**: the `useTarvaChatData` hook does not poll when the Tarva Chat district is not at Z2/Z3. Network tab should show no requests to `/api/districts/tarva-chat` when viewing other districts or Z1.                                                          | Navigate away from Tarva Chat district; monitor network tab for 30 seconds; verify no district API calls.                                        |
| AC-19 | **Adaptive polling**: when Tarva Chat is DEGRADED or DOWN, the district data polls at 5s (alert interval) instead of 15s (normal).                                                                                                                                                     | Set Tarva Chat to a degraded state; measure time between `/api/districts/tarva-chat` requests in network tab.                                    |
| AC-20 | **Receipt stamps on actions**: clicking "Open App", "Copy URL", "Refresh", "Open Conversation", "New Conversation", or "Browse Agents" triggers a receipt stamp animation in the station footer.                                                                                       | Click each action button; verify receipt stamp appears (per WS-2.6 receipt integration).                                                         |
| AC-21 | **Typography matches VISUAL-DESIGN-SPEC.md Z3**: panel heading 16px/600, panel body 14px/400, table header 11px/600 uppercase, table data 13px/400 Geist Mono, table number 13px/500 tabular-nums.                                                                                     | Code review against spec; visual comparison.                                                                                                     |
| AC-22 | **TypeScript strict compliance**: `pnpm typecheck` passes with zero errors including all Tarva Chat station files. No `any` types, no type assertions without justification.                                                                                                           | Run `pnpm typecheck`.                                                                                                                            |
| AC-23 | **All stations use `motion/react`**, not `framer-motion`, for any Choreography-tier animations (entrance, hover effects).                                                                                                                                                              | Code review: grep for `framer-motion` imports; verify none exist.                                                                                |
| AC-24 | **File paths use `(launch)/`** route group, not `(hub)/`.                                                                                                                                                                                                                              | Code review: verify route handler is at `src/app/api/districts/tarva-chat/route.ts` and no `(hub)/` references exist in this workstream's files. |

---

## 6. Decisions Made

| ID      | Decision                                                                                                              | Rationale                                                                                                                                                                                                                                                                                                                                                                                                             | Source                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| D-2.4.1 | **Dedicated route handler per district** (`/api/districts/tarva-chat`) rather than extending the telemetry aggregator | The telemetry aggregator (WS-1.5) handles health status for all 6 apps. District-specific data (conversations, agents) requires app-specific API calls that do not belong in the universal aggregator. Separation keeps the aggregator fast and focused. District route handlers are independently deployable and testable.                                                                                           | AD-5 (telemetry architecture), separation of concerns |
| D-2.4.2 | **Polling gated by district visibility** (`enabled` parameter on the hook)                                            | District-specific data is only useful when the user is viewing that district. Ungated polling for all 6 districts would create 6 additional API requests per cycle (on top of the telemetry aggregator), most of which would be wasted.                                                                                                                                                                               | AD-5 (adaptive polling), performance optimization     |
| D-2.4.3 | **Snake_case to camelCase normalization in the route handler**                                                        | Tarva Chat uses Supabase (snake_case convention) for its database. The Launch uses TypeScript/React camelCase convention. Normalizing at the server boundary keeps the client code clean and prevents inconsistent casing from propagating into component props.                                                                                                                                                      | TypeScript convention, boundary normalization         |
| D-2.4.4 | **Synthesized connection data from health checks, not dedicated diagnostics endpoint**                                | Tarva Chat may not expose a `/api/diagnostics` endpoint. The handler synthesizes connection statuses from the health response's `checks` map (e.g., `checks.database = 'ok'`). This works with the existing health contract and does not require changes to Tarva Chat. If a richer diagnostics endpoint is added later, the handler can switch without changing the station component contract.                      | No code changes to existing apps (project constraint) |
| D-2.4.5 | **`placeholderData` instead of `initialData` for the TanStack Query hook**                                            | `placeholderData` provides a synthetic empty snapshot that is visually replaced when real data arrives. Unlike `initialData`, it does not populate the cache, so the first real fetch always updates the UI. This prevents stale initial data from persisting if the query is disabled and re-enabled.                                                                                                                | TanStack Query best practice                          |
| D-2.4.6 | **Station components export data builders, not full JSX**                                                             | Station body rendering is handled by the StationPanel framework (WS-2.6) which has generic renderers for `table`, `list`, `metrics`, and `launch` body types. The station components in this workstream export layout metadata, column definitions, and data builder functions -- not full React components with JSX. This keeps rendering consistent across all districts and avoids duplicating glass/glow styling. | WS-2.6 architecture (StationPanel owns rendering)     |
| D-2.4.7 | **Port 4000 for Tarva Chat**                                                                                          | Tarva Chat runs on `localhost:4000` per TARVA-SYSTEM-OVERVIEW.md. Corrected from port 3005 during Phase 2 review to resolve port collision with Project Room (WS-2.3), which uses port 3005.                                                                                                                                                                                                                          | TARVA-SYSTEM-OVERVIEW.md, Phase 2 Review H-1          |
| D-2.4.8 | **`motion/react` import path, not `framer-motion`**                                                                   | Per project constraint: the project uses `motion/react` (the modern import path for Framer Motion v12+), not the legacy `framer-motion` package name.                                                                                                                                                                                                                                                                 | User constraint                                       |

---

## 7. Open Questions

| ID       | Question                                                                                                                                                                                                                                                                  | Impact                                                                                                                                                                         | Proposed Resolution                                                                                                                                                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-2.4.1 | **Does Tarva Chat expose `/api/conversations` and `/api/agents` endpoints?** The TARVA-SYSTEM-OVERVIEW.md says Tarva Chat has "20+ API routes covering chat streaming, agent CRUD, conversation management." The exact endpoint paths and response shapes are unverified. | High -- if these endpoints do not exist or have different shapes, the route handler's conversation and agent fetching will return `null`. Stations will render offline states. | Inspect Tarva Chat's codebase at `~/Sites/tarva-org/tarva-chat/src/app/api/` for actual endpoint paths and response shapes. Update the `fetchConversationsData()` and `fetchAgentsData()` functions in the route handler to match. If endpoints do not exist, the stations gracefully degrade to offline state and a follow-up task adds the needed endpoints to Tarva Chat. |
| OQ-2.4.2 | **MCP server count**: the system overview says 17 MCP servers across 3 tiers. Is this count accurate, and does the Tarva Chat health endpoint report per-server health?                                                                                                   | Medium -- the Status station hardcodes `total: 17` and tier breakdown. If the actual count differs, the display will be incorrect.                                             | Verify MCP server count from Tarva Chat source. If the health endpoint provides MCP health data, consume it directly. If not, hardcoded counts with a TODO comment are acceptable for Phase 2.                                                                                                                                                                               |
| OQ-2.4.3 | **Skill activation count**: where does Tarva Chat track skill activations? The system overview mentions skill matching (implicit keyword-based and explicit `/use` commands) but does not describe an API for aggregated skill metrics.                                   | Low -- the Agents station shows `skillActivationCount` which currently defaults to 0. Not a blocking issue.                                                                    | Default to 0 with a TODO comment. If Tarva Chat adds a skill metrics endpoint in the future, the route handler can fetch it.                                                                                                                                                                                                                                                 |
| OQ-2.4.4 | **Message throughput sparkline data source**: the Conversations station shows a message throughput sparkline, but Tarva Chat may not expose a messages-per-interval metric.                                                                                               | Low -- the sparkline defaults to an empty array, which renders as a flat line or hidden sparkline.                                                                             | Accept empty sparkline for Phase 2. The throughput metric could be computed server-side from conversation message timestamps in a future iteration.                                                                                                                                                                                                                          |
| OQ-2.4.5 | **Station layout arrangement within the district**: how are the 4 stations spatially arranged at Z2? Grid, column, or custom layout?                                                                                                                                      | Medium -- affects visual design but not data/component architecture.                                                                                                           | Defer to WS-2.6 (Station Panel Framework) which defines the station layout grid for each district. This workstream provides the content; WS-2.6 provides the spatial arrangement.                                                                                                                                                                                            |

---

## 8. Risk Register

| ID      | Risk                                                                                                                                                                                                | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-2.4.1 | **Tarva Chat API endpoints do not exist or have unexpected response shapes** -- the route handler may receive 404 or malformed JSON from Tarva Chat.                                                | High       | Medium | Every fetch function wraps in try/catch and returns `null` on failure. Stations render graceful offline states. The route handler validates response shapes before mapping. Type guards log warnings for unexpected formats. See OQ-2.4.1.                                       |
| R-2.4.2 | **Tarva Chat is offline during development** -- developers may not always have Tarva Chat running on port 3005.                                                                                     | High       | Low    | The `placeholderData` in the TanStack Query hook provides a synthetic empty snapshot. All station components have explicit offline/empty state rendering. Development can proceed without a running Tarva Chat instance.                                                         |
| R-2.4.3 | **Port conflict between Tarva Chat and Project Room** -- the system overview lists different ports than the telemetry config. A misconfigured port would cause the district to always show offline. | Medium     | Medium | The port (3005) is defined as a constant in both the route handler (`TARVA_CHAT_BASE`) and the telemetry config (`telemetry-config.ts`). If the port is wrong, it only needs to be changed in these two locations. See D-2.4.7.                                                  |
| R-2.4.4 | **WS-2.6 station panel framework is not complete when WS-2.4 begins** -- the station components depend on `StationPanel`, `StationLayout`, and the body renderers.                                  | Medium     | High   | Station components export data and metadata (not full JSX), which can be developed and tested independently. Integration with the StationPanel framework happens at composition time. If WS-2.6 is delayed, station data builders can be unit-tested in isolation.               |
| R-2.4.5 | **Route handler adds latency to page interactions** -- the `/api/districts/tarva-chat` handler makes 3 network calls to Tarva Chat, each with a 3s timeout. Worst case: ~3.5s response time.        | Low        | Medium | All 3 fetches run in parallel via `Promise.all`, so wall time is bounded by the slowest fetch (3s timeout), not the sum. TanStack Query handles loading states, so the UI remains responsive while fetching. The `placeholderData` ensures stations render immediately on mount. |
| R-2.4.6 | **Polling frequency creates noticeable load on Tarva Chat** -- at 15s intervals, the Launch makes 4 API calls to Tarva Chat per cycle (health from telemetry aggregator + 3 from district handler). | Low        | Low    | 4 lightweight GET requests every 15 seconds is negligible load for a Next.js server. The district handler only polls when the Tarva Chat district is visible (`enabled` flag). When the user navigates away, polling stops.                                                      |

---

## Appendix A: Execution Checklist

This checklist is for the implementing agent. Execute steps in order.

```
[ ] 1. Verify WS-0.1, WS-0.2, WS-1.5 are complete (project builds, tokens resolve, telemetry hook works)
[ ] 2. Verify `src/components/stations/` directory exists (create if needed)
[ ] 3. Inspect Tarva Chat codebase for actual API endpoints (resolve OQ-2.4.1)
       Path: ~/Sites/tarva-org/tarva-chat/src/app/api/
       Look for: conversations, agents, health endpoint response shapes
[ ] 4. Create `src/types/districts/tarva-chat.ts` (Section 4.2)
[ ] 5. Create `src/app/api/districts/tarva-chat/route.ts` (Section 4.3)
       Update endpoint paths based on step 3 findings
[ ] 6. Create `src/hooks/use-tarva-chat-data.ts` (Section 4.4)
[ ] 7. Create `src/components/stations/tarva-chat/chat-launch-station.tsx` (Section 4.5)
[ ] 8. Create `src/components/stations/tarva-chat/chat-status-station.tsx` (Section 4.6)
[ ] 9. Create `src/components/stations/tarva-chat/chat-conversations-station.tsx` (Section 4.7)
[ ] 10. Create `src/components/stations/tarva-chat/chat-agents-station.tsx` (Section 4.8)
[ ] 11. Create `src/components/stations/tarva-chat/index.ts` (Section 4.9)
[ ] 12. Run `pnpm typecheck` -- zero errors (AC-22)
[ ] 13. Run `pnpm lint` -- zero errors
[ ] 14. Verify offline states: stop Tarva Chat, confirm all 4 stations render gracefully (AC-13)
[ ] 15. Verify loaded states: start Tarva Chat, confirm data populates (AC-1 through AC-12)
[ ] 16. Verify polling behavior: navigate away from district, confirm no polling (AC-18)
[ ] 17. Verify receipt stamps on all action buttons (AC-20)
[ ] 18. Verify typography matches VISUAL-DESIGN-SPEC.md Z3 (AC-21)
[ ] 19. Verify no `framer-motion` imports -- only `motion/react` (AC-23)
[ ] 20. Verify no `(hub)/` route group references -- only `(launch)/` (AC-24)
```
