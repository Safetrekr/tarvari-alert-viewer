# WS-2.2: District Content -- Agent Builder

> **Workstream ID:** WS-2.2
> **Phase:** 2 -- Districts + Stations + Morph
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.5 (telemetry data + districts store), WS-2.1 (morph/district container), WS-2.6 (station panel framework)
> **Blocks:** None
> **Resolves:** None

---

## 1. Objective

Implement the four station panels for the Agent Builder district: Launch, Status, Pipeline, and Library. The Launch station is unique among all districts because it surfaces TWO launchable items per Gap Resolution #4 -- the Agent Builder Web UI at `localhost:3000` and the AgentGen CLI terminal process. The Pipeline station shows active generation runs, their phase progress, and recent completions by proxying the Agent Builder's own `/api/projects` and `/api/projects/[slug]/runs` endpoints. The Library station lists installed agents from `~/.claude/agents/` with Tarva vs. third-party distinction and skill maturity summaries. The Status station renders the universal health dashboard populated from the WS-1.5 telemetry aggregator.

All four stations render inside the `<StationPanel>` framework from WS-2.6 and inherit its glass material, luminous borders, receipt stamp integration, and 3-zone layout. Data flows through two paths: universal telemetry from `GET /api/telemetry` (WS-1.5) for health/status metrics, and a new dedicated Route Handler `GET /api/districts/agent-builder` that proxies Agent Builder's project, run, and agent APIs to produce a consolidated Agent Builder district payload.

**Success looks like:** A user zooms into the Agent Builder district at Z2/Z3 and sees four station panels. The Launch station shows two launch targets with version info and a status dot for each. The Status station shows the health dashboard with uptime, latency sparkline, and sub-check status. The Pipeline station shows a table of recent generation runs with phase progress bars and status badges. The Library station shows a count of installed agents, a Tarva/third-party breakdown, and recent publishes. Every action button triggers a receipt stamp. Data refreshes on the WS-1.5 polling cadence. Offline state is handled gracefully -- all stations show `--` placeholders when the Agent Builder is unreachable.

**Traceability:** AD-8 (Station Content per District -- Agent Builder row), Gap #4 (App Naming -- two launchable items), AD-5 (Telemetry Polling Architecture), AD-6 (Receipt System -- stub in Phase 2), VISUAL-DESIGN-SPEC.md Sections 1.7, 3.2 (Z3 typography), 4.4 (luminous border).

---

## 2. Scope

### In Scope

- **Agent Builder district data types** (`src/types/districts/agent-builder.ts`): TypeScript interfaces for Agent Builder-specific telemetry: projects, runs, pipeline phases, installed agents, skill maturity, and the consolidated district response shape.
- **Route Handler** (`src/app/api/districts/agent-builder/route.ts`): `GET /api/districts/agent-builder` that proxies the Agent Builder app's APIs (`/api/projects`, `/api/projects/[slug]/runs`, `/api/agents/installed`) in parallel with 3-second timeouts, returning a consolidated `AgentBuilderDistrictData` payload. Falls back to null fields when the Agent Builder is unreachable (the upstream `/api/telemetry` health status determines overall status; this route provides enrichment data).
- **TanStack Query hook** (`src/hooks/use-agent-builder-district.ts`): `useAgentBuilderDistrict()` hook with `refetchInterval` aligned to WS-1.5 polling cadence, `select` transform, stale-while-revalidate behavior, and typed return.
- **Launch station component** (`src/components/stations/agent-builder/launch-station.tsx`): Dual-target launch panel with Web UI (localhost:3000) and AgentGen CLI entries, each showing version, status dot, and launch/copy-URL actions. The Web UI opens in a new browser tab. The CLI entry shows process status (running/stopped) with a "View Docs" action.
- **Status station component** (`src/components/stations/agent-builder/status-station.tsx`): Universal health dashboard showing HealthBadge, uptime, version, response time sparkline, sub-check status rows (database, dependencies), and alert count. Fully driven by WS-1.5 `AppTelemetry` data from the districts store.
- **Pipeline station component** (`src/components/stations/agent-builder/pipeline-station.tsx`): Table of recent generation runs with columns: Project, Status, Phase, Progress, Started, Duration. Phase progress rendered as a 7-segment bar. Status badges use `@tarva/ui Badge`. "View Run Details" action opens the Agent Builder app to the relevant project.
- **Library station component** (`src/components/stations/agent-builder/library-station.tsx`): Summary metrics (total agents, Tarva agents, total skills) plus a scrollable list of installed agents showing name, skill count, modification date, and Tarva badge. "Browse Library" action opens Agent Builder.
- **Shared sub-components**: `PipelinePhaseBar` (7-segment progress indicator), `AgentListItem` (agent row in library list), `DualLaunchTarget` (launch target card with status dot).
- **Barrel export** from `src/components/stations/agent-builder/index.ts`.
- **Unit tests** for all station components with mock data.
- **Offline/loading/error states** for all stations per the WS-2.6 framework.

### Out of Scope

- Station panel framework (glass, luminous border, receipt stamps, 3-zone layout) -- provided by WS-2.6.
- Station template definitions in `StaticStationTemplateRegistry` -- defined in WS-1.7.
- Morph choreography (capsule-to-district transition) -- WS-2.1.
- Universal telemetry aggregator, polling, and health state resolution -- WS-1.5.
- Supabase receipt persistence -- Phase 3 (WS-3.1); uses `InMemoryReceiptStore`.
- Real-time run progress streaming (SSE/WebSocket) -- runs show last-known state from polling.
- AgentGen CLI process management (start/stop/restart) -- Launch station only shows status and documentation link.
- District content for other apps (Tarva Chat, Project Room, etc.) -- WS-2.3 through WS-2.5.

---

## 3. Input Dependencies

| Dependency                        | Source           | What It Provides                                                                                                                                                                       | Status                                                      |
| --------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Station panel framework           | WS-2.6           | `<StationPanel>`, `<StationHeader>`, `<StationBody>`, `<StationActions>`, `useStationContext()`, `useReceiptStamp()`, receipt stamp component, glass material CSS, luminous border CSS | Required                                                    |
| StationTemplate definitions       | WS-1.7           | `agent-builder--pipeline` and `agent-builder--library` templates with layout config; `universal--launch` and `universal--status` universal templates                                   | Required                                                    |
| Districts store with AppTelemetry | WS-1.5           | `useDistrictsStore()` providing `AppTelemetry` for `agent-builder` including `status`, `uptime`, `version`, `checks`, `alertCount`, `responseTimeMs`, `responseTimeHistory`            | Required                                                    |
| Telemetry display components      | WS-1.5           | `HealthBadge`, `TelemetrySparkline`, `MetricCounter`, `AlertIndicator`                                                                                                                 | Required                                                    |
| Shared domain types               | WS-1.7           | `AppIdentifier`, `HealthState`, `SpatialLocation`, `EventType`, `Severity`                                                                                                             | Required                                                    |
| Design tokens CSS                 | WS-0.2           | `--color-*`, `--glow-*`, `--duration-*`, `--ease-*`, Tailwind `@theme` utilities                                                                                                       | Required                                                    |
| @tarva/ui components              | npm package      | `Badge`, `Button`, `ScrollArea`, `Tooltip`, `Skeleton`, `StatusBadge`                                                                                                                  | Required                                                    |
| Framer Motion                     | npm package      | `motion/react` for entrance animations, `AnimatePresence`                                                                                                                              | Required                                                    |
| Lucide React                      | npm package      | `ExternalLink`, `Terminal`, `GitBranch`, `Library`, `Activity`, `Play`, `XCircle`, `Eye`, `BookOpen`, `Copy`, `RefreshCw`, `CheckCircle`, `AlertTriangle`                              | Required                                                    |
| Agent Builder app (read-only)     | `localhost:3000` | `GET /api/projects`, `GET /api/projects/[slug]/runs`, `GET /api/projects/[slug]/status`, `GET /api/agents/installed`                                                                   | Runtime dependency -- graceful degradation when unavailable |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  app/
    api/
      districts/
        agent-builder/
          route.ts                      # Consolidated district data Route Handler
  components/
    stations/
      agent-builder/
        launch-station.tsx              # Dual-target launch panel (Web UI + CLI)
        status-station.tsx              # Universal health dashboard
        pipeline-station.tsx            # Generation runs table
        library-station.tsx             # Installed agents list
        pipeline-phase-bar.tsx          # 7-segment pipeline progress indicator
        agent-list-item.tsx             # Single agent row in library list
        dual-launch-target.tsx          # Launch target card sub-component
        index.ts                        # Barrel export
      agent-builder/
        __tests__/
          launch-station.test.tsx
          status-station.test.tsx
          pipeline-station.test.tsx
          library-station.test.tsx
          pipeline-phase-bar.test.tsx
  hooks/
    use-agent-builder-district.ts       # TanStack Query hook for district data
  types/
    agent-builder.ts                    # Agent Builder-specific type definitions
```

### 4.2 Type Definitions -- `src/types/districts/agent-builder.ts`

Central types for the Agent Builder district. These define the data shapes returned by the dedicated Route Handler and consumed by all four station components.

```ts
/**
 * Agent Builder district types.
 *
 * These types define the consolidated payload from GET /api/districts/agent-builder
 * and the domain-specific shapes used by the Pipeline and Library stations.
 *
 * Source data comes from the Agent Builder app at localhost:3000:
 * - GET /api/projects (project listing)
 * - GET /api/projects/[slug]/runs (run listing per project)
 * - GET /api/agents/installed (installed agent catalog)
 *
 * References:
 * - AD-8 (Agent Builder stations: Pipeline, Library)
 * - Gap #4 (Agent Builder = Web UI at localhost:3000 + AgentGen CLI)
 * - TARVA-SYSTEM-OVERVIEW.md (port assignments)
 */

// ============================================================================
// Pipeline: Projects & Runs
// ============================================================================

/**
 * Pipeline phases in the Agent Builder's 7-phase generation model.
 * Matches PHASE_ORDER from Agent Builder's status route.
 */
export const PIPELINE_PHASES = [
  'PLAN',
  'EXECUTE',
  'ASSEMBLE',
  'ENRICH',
  'EVAL_GATE',
  'FINALIZE',
  'PUBLISH',
] as const

export type PipelinePhase = (typeof PIPELINE_PHASES)[number]

/**
 * Run statuses from the Agent Builder's storage contract.
 */
export type AgentBuilderRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'waiting_approval'
  | 'partial'

/**
 * Simplified run record for the Pipeline station table.
 * Derived from Agent Builder's GET /api/projects/[slug]/runs response.
 */
export interface PipelineRun {
  /** Unique run identifier (UUID). */
  readonly id: string
  /** Parent project slug. */
  readonly projectSlug: string
  /** Parent project display name. */
  readonly projectName: string
  /** Current run status. */
  readonly status: AgentBuilderRunStatus
  /** Current pipeline phase (null if not started). */
  readonly currentPhase: PipelinePhase | null
  /** Index of current phase in PIPELINE_PHASES (0-6), or -1 if not started. */
  readonly currentPhaseIndex: number
  /** Number of completed phases (0-7). */
  readonly completedPhaseCount: number
  /** ISO 8601 timestamp when the run started. */
  readonly startedAt: string | null
  /** ISO 8601 timestamp when the run completed/failed. */
  readonly completedAt: string | null
  /** Whether the run is waiting at a gate checkpoint. */
  readonly isPendingApproval: boolean
}

/**
 * Summary of a project from the Agent Builder's project listing.
 */
export interface AgentBuilderProject {
  readonly slug: string
  readonly name: string
  readonly description: string | null
  readonly updatedAt: string
  readonly contextFileCount: number
  readonly lastRunStatus: AgentBuilderRunStatus | null
}

// ============================================================================
// Library: Installed Agents
// ============================================================================

/**
 * Simplified installed agent record for the Library station.
 * Derived from Agent Builder's GET /api/agents/installed response.
 */
export interface InstalledAgentSummary {
  /** Agent display name from frontmatter. */
  readonly name: string
  /** Agent file name (e.g., "react-developer.md"). */
  readonly fileName: string
  /** Brief description from frontmatter. */
  readonly description: string
  /** File size in KB. */
  readonly fileSizeKB: number
  /** ISO 8601 last modification timestamp. */
  readonly modifiedAt: string
  /** Whether this agent was created by Tarva Agent Builder. */
  readonly isTarvaAgent: boolean
  /** Tarva-specific metadata (only present for Tarva agents). */
  readonly tarvaMetadata: {
    readonly skillCount: number
    readonly projectSlug: string
    readonly projectName: string
    readonly exportedAt: string
  } | null
}

/**
 * Library summary statistics for the station header metrics.
 */
export interface LibrarySummary {
  /** Total number of installed agents. */
  readonly totalAgents: number
  /** Number of agents created by Tarva. */
  readonly tarvaAgents: number
  /** Number of third-party/manually created agents. */
  readonly thirdPartyAgents: number
  /** Total skill count across all Tarva agents. */
  readonly totalSkills: number
  /** Most recently modified agent name (for "Last Updated" display). */
  readonly lastUpdatedAgent: string | null
  /** ISO 8601 timestamp of the most recently modified agent. */
  readonly lastUpdatedAt: string | null
}

// ============================================================================
// Launch: Dual Targets
// ============================================================================

/**
 * A launchable target within the Agent Builder district.
 * Per Gap #4: Agent Builder has TWO launchable items.
 */
export interface LaunchTarget {
  /** Unique identifier for this target. */
  readonly id: 'web-ui' | 'agentgen-cli'
  /** Human-readable display name. */
  readonly displayName: string
  /** URL or command to launch. */
  readonly launchUrl: string | null
  /** Whether this target can be opened in a browser tab. */
  readonly isBrowserLaunchable: boolean
  /** Brief description of this target. */
  readonly description: string
  /** Lucide icon name. */
  readonly icon: string
}

/**
 * Static launch target definitions for Agent Builder.
 */
export const AGENT_BUILDER_LAUNCH_TARGETS: readonly LaunchTarget[] = [
  {
    id: 'web-ui',
    displayName: 'Agent Builder',
    launchUrl: 'http://localhost:3000',
    isBrowserLaunchable: true,
    description: 'Web UI for creating and managing AI agents',
    icon: 'ExternalLink',
  },
  {
    id: 'agentgen-cli',
    displayName: 'AgentGen CLI',
    launchUrl: null,
    isBrowserLaunchable: false,
    description: 'Terminal-based agent generation engine',
    icon: 'Terminal',
  },
] as const

// ============================================================================
// Consolidated District Payload
// ============================================================================

/**
 * Full Agent Builder district data returned by GET /api/districts/agent-builder.
 * Combines project/run data (Pipeline station), installed agent data (Library station),
 * and launch target metadata. Health data comes separately from WS-1.5 telemetry.
 */
export interface AgentBuilderDistrictData {
  /** ISO 8601 timestamp when this payload was generated. */
  readonly timestamp: string

  /** Pipeline station data: recent runs across all projects, sorted by startedAt desc. */
  readonly pipeline: {
    /** All runs across all projects, most recent first. Max 20. */
    readonly recentRuns: readonly PipelineRun[]
    /** Count of currently active runs (status = running or waiting_approval). */
    readonly activeRunCount: number
    /** Count of queued runs. */
    readonly queuedRunCount: number
    /** Total project count. */
    readonly projectCount: number
  }

  /** Library station data: installed agent catalog and summary statistics. */
  readonly library: {
    /** Installed agents, Tarva agents first, then alphabetical. */
    readonly agents: readonly InstalledAgentSummary[]
    /** Aggregate statistics. */
    readonly summary: LibrarySummary
  }

  /**
   * Whether the Agent Builder app responded successfully.
   * If false, pipeline and library data are empty defaults.
   * Health status comes from WS-1.5 telemetry, not this field.
   */
  readonly isReachable: boolean
}

/**
 * Default empty district data used when Agent Builder is unreachable.
 */
export const EMPTY_AGENT_BUILDER_DATA: AgentBuilderDistrictData = {
  timestamp: new Date().toISOString(),
  pipeline: {
    recentRuns: [],
    activeRunCount: 0,
    queuedRunCount: 0,
    projectCount: 0,
  },
  library: {
    agents: [],
    summary: {
      totalAgents: 0,
      tarvaAgents: 0,
      thirdPartyAgents: 0,
      totalSkills: 0,
      lastUpdatedAgent: null,
      lastUpdatedAt: null,
    },
  },
  isReachable: false,
}
```

### 4.3 Route Handler -- `src/app/api/districts/agent-builder/route.ts`

Dedicated Route Handler that proxies the Agent Builder app's APIs and returns a consolidated district payload. Runs server-side with Node.js runtime. All fetches have 3-second timeouts. Failures degrade gracefully to empty data.

```ts
/**
 * Agent Builder District Data Route Handler.
 *
 * GET /api/districts/agent-builder
 *
 * Fetches project, run, and agent data from the Agent Builder app
 * at localhost:3000 and returns a consolidated AgentBuilderDistrictData payload.
 *
 * Timeout: 3 seconds per upstream request.
 * Failure mode: Returns isReachable=false with empty defaults.
 * This route provides enrichment data; health status comes from /api/telemetry.
 */

import { NextResponse } from 'next/server'
import type {
  AgentBuilderDistrictData,
  AgentBuilderProject,
  PipelineRun,
  InstalledAgentSummary,
  LibrarySummary,
  PipelinePhase,
  PIPELINE_PHASES,
} from '@/types/agent-builder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AGENT_BUILDER_BASE = 'http://localhost:3000'
const FETCH_TIMEOUT_MS = 3000

/**
 * Fetch with timeout and graceful failure.
 */
async function fetchWithTimeout<T>(
  url: string,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

/**
 * Map Agent Builder project + runs into PipelineRun records.
 */
function buildPipelineRuns(
  projects: AgentBuilderProject[],
  runsMap: Map<string, RawRun[]>
): PipelineRun[] {
  const allRuns: PipelineRun[] = []

  for (const project of projects) {
    const projectRuns = runsMap.get(project.slug) ?? []

    for (const run of projectRuns) {
      const phaseIndex = run.currentPhase
        ? PIPELINE_PHASES_ARRAY.indexOf(run.currentPhase as PipelinePhase)
        : -1

      allRuns.push({
        id: run.id,
        projectSlug: project.slug,
        projectName: project.name,
        status: run.status,
        currentPhase: (run.currentPhase as PipelinePhase) ?? null,
        currentPhaseIndex: phaseIndex,
        completedPhaseCount: phaseIndex >= 0 ? phaseIndex : 0,
        startedAt: run.startedAt ?? null,
        completedAt: run.completedAt ?? null,
        isPendingApproval: run.pendingGate != null,
      })
    }
  }

  // Sort by startedAt descending (most recent first), limit to 20.
  return allRuns
    .sort((a, b) => {
      if (!a.startedAt && !b.startedAt) return 0
      if (!a.startedAt) return 1
      if (!b.startedAt) return -1
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    })
    .slice(0, 20)
}

/**
 * Build library summary from installed agents.
 */
function buildLibrarySummary(agents: InstalledAgentSummary[]): LibrarySummary {
  const tarvaAgents = agents.filter((a) => a.isTarvaAgent)
  const totalSkills = tarvaAgents.reduce((sum, a) => sum + (a.tarvaMetadata?.skillCount ?? 0), 0)

  // Find most recently modified agent.
  let lastUpdatedAgent: string | null = null
  let lastUpdatedAt: string | null = null
  for (const agent of agents) {
    if (!lastUpdatedAt || agent.modifiedAt > lastUpdatedAt) {
      lastUpdatedAt = agent.modifiedAt
      lastUpdatedAgent = agent.name
    }
  }

  return {
    totalAgents: agents.length,
    tarvaAgents: tarvaAgents.length,
    thirdPartyAgents: agents.length - tarvaAgents.length,
    totalSkills,
    lastUpdatedAgent,
    lastUpdatedAt,
  }
}

// Raw response shapes from Agent Builder APIs.
const PIPELINE_PHASES_ARRAY = [
  'PLAN',
  'EXECUTE',
  'ASSEMBLE',
  'ENRICH',
  'EVAL_GATE',
  'FINALIZE',
  'PUBLISH',
] as const

interface RawRun {
  id: string
  status: string
  startedAt?: string
  completedAt?: string
  currentPhase?: string
  currentStep?: number
  pendingGate?: string
  exitCode?: number
}

interface RawRunsResponse {
  runs: RawRun[]
  total: number
}

interface RawProject {
  slug: string
  name: string
  description?: string
  updatedAt: string
  contextFileCount: number
  lastRunStatus?: string
}

interface RawInstalledAgent {
  name: string
  description: string
  fileName: string
  fileSizeKB: number
  modifiedAt: string
  isTarvaAgent: boolean
  tarvaMetadata?: {
    skillCount: number
    projectSlug: string
    projectName: string
    exportedAt: string
  }
}

export async function GET() {
  // Fetch projects and agents in parallel.
  const [projectsRaw, agentsRaw] = await Promise.all([
    fetchWithTimeout<RawProject[]>(`${AGENT_BUILDER_BASE}/api/projects`),
    fetchWithTimeout<RawInstalledAgent[]>(`${AGENT_BUILDER_BASE}/api/agents/installed`),
  ])

  // If both failed, Agent Builder is unreachable.
  const isReachable = projectsRaw !== null || agentsRaw !== null

  // Fetch runs for each project (limited to first 10 projects to bound latency).
  const projects: AgentBuilderProject[] = (projectsRaw ?? []).slice(0, 10).map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.description ?? null,
    updatedAt: p.updatedAt,
    contextFileCount: p.contextFileCount,
    lastRunStatus: (p.lastRunStatus as AgentBuilderProject['lastRunStatus']) ?? null,
  }))

  const runsMap = new Map<string, RawRun[]>()
  if (projects.length > 0) {
    const runsPromises = projects.map(async (project) => {
      const response = await fetchWithTimeout<RawRunsResponse>(
        `${AGENT_BUILDER_BASE}/api/projects/${project.slug}/runs`
      )
      return { slug: project.slug, runs: response?.runs ?? [] }
    })

    const runsResults = await Promise.all(runsPromises)
    for (const { slug, runs } of runsResults) {
      runsMap.set(slug, runs)
    }
  }

  // Build pipeline runs.
  const recentRuns = buildPipelineRuns(projects, runsMap)
  const activeRunCount = recentRuns.filter(
    (r) => r.status === 'running' || r.status === 'waiting_approval'
  ).length
  const queuedRunCount = recentRuns.filter((r) => r.status === 'queued').length

  // Build library data.
  const agents: InstalledAgentSummary[] = (agentsRaw ?? []).map((a) => ({
    name: a.name,
    fileName: a.fileName,
    description: a.description,
    fileSizeKB: a.fileSizeKB,
    modifiedAt: a.modifiedAt,
    isTarvaAgent: a.isTarvaAgent,
    tarvaMetadata: a.tarvaMetadata
      ? {
          skillCount: a.tarvaMetadata.skillCount,
          projectSlug: a.tarvaMetadata.projectSlug,
          projectName: a.tarvaMetadata.projectName,
          exportedAt: a.tarvaMetadata.exportedAt,
        }
      : null,
  }))

  const payload: AgentBuilderDistrictData = {
    timestamp: new Date().toISOString(),
    pipeline: {
      recentRuns,
      activeRunCount,
      queuedRunCount,
      projectCount: projects.length,
    },
    library: {
      agents,
      summary: buildLibrarySummary(agents),
    },
    isReachable,
  }

  return NextResponse.json(payload)
}
```

### 4.4 TanStack Query Hook -- `src/hooks/use-agent-builder-district.ts`

````ts
'use client'

/**
 * TanStack Query hook for Agent Builder district data.
 *
 * Fetches the consolidated district payload from GET /api/districts/agent-builder
 * on the same cadence as the WS-1.5 telemetry polling (15s default, 5s when degraded).
 *
 * Usage:
 * ```tsx
 * const { data, isLoading, isError } = useAgentBuilderDistrict()
 * ```
 */

import { useQuery } from '@tanstack/react-query'
import type { AgentBuilderDistrictData } from '@/types/agent-builder'
import { EMPTY_AGENT_BUILDER_DATA } from '@/types/agent-builder'

/** Query key for cache management and invalidation. */
export const AGENT_BUILDER_DISTRICT_KEY = ['districts', 'agent-builder'] as const

/**
 * Default polling interval in milliseconds.
 * Aligns with WS-1.5 telemetry polling cadence.
 */
const DEFAULT_REFETCH_INTERVAL = 15_000

async function fetchAgentBuilderDistrict(): Promise<AgentBuilderDistrictData> {
  const response = await fetch('/api/districts/agent-builder')
  if (!response.ok) {
    throw new Error(`Agent Builder district fetch failed: ${response.status}`)
  }
  return response.json()
}

export interface UseAgentBuilderDistrictOptions {
  /** Override the polling interval in ms. Default: 15000. */
  readonly refetchInterval?: number
  /** Whether to enable polling. Default: true. */
  readonly enabled?: boolean
}

export function useAgentBuilderDistrict(options?: UseAgentBuilderDistrictOptions) {
  return useQuery({
    queryKey: AGENT_BUILDER_DISTRICT_KEY,
    queryFn: fetchAgentBuilderDistrict,
    refetchInterval: options?.refetchInterval ?? DEFAULT_REFETCH_INTERVAL,
    enabled: options?.enabled ?? true,
    staleTime: 10_000,
    placeholderData: EMPTY_AGENT_BUILDER_DATA,
    retry: 1,
    retryDelay: 2000,
  })
}
````

### 4.5 Component: Launch Station -- `src/components/stations/agent-builder/launch-station.tsx`

The Launch station is the only universal station with a district-specific override: Agent Builder shows TWO launch targets instead of one. This component renders inside a `<StationPanel>` with `bodyType: 'launch'`.

```tsx
'use client'

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { ExternalLink, Terminal, Copy, FileText } from 'lucide-react'
import { Button } from '@tarva/ui'
import { Tooltip } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { HealthBadge } from '@/components/telemetry/health-badge'
import type { HealthState } from '@/lib/interfaces/types'

// ============================================================================
// Types
// ============================================================================

export interface LaunchStationProps {
  /** Health state from WS-1.5 districts store. */
  readonly health: HealthState
  /** App version from telemetry (null if unreachable). */
  readonly version: string | null
  /** Uptime in seconds from telemetry (null if unreachable). */
  readonly uptime: number | null
}

// ============================================================================
// Helpers
// ============================================================================

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '--'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
}

// ============================================================================
// Component
// ============================================================================

export function LaunchStation({ health, version, uptime }: LaunchStationProps) {
  const { stampReceipt } = useStationContext()

  const handleOpenWebUI = useCallback(() => {
    window.open('http://localhost:3000', '_blank', 'noopener,noreferrer')
    stampReceipt('open-web-ui', 'Opened Agent Builder Web UI')
  }, [stampReceipt])

  const handleCopyWebUIUrl = useCallback(() => {
    navigator.clipboard.writeText('http://localhost:3000')
    stampReceipt('copy-url-web-ui', 'Copied Agent Builder URL to clipboard')
  }, [stampReceipt])

  const handleViewCLIDocs = useCallback(() => {
    window.open('http://localhost:3000', '_blank', 'noopener,noreferrer')
    stampReceipt('view-cli-docs', 'Opened AgentGen CLI documentation')
  }, [stampReceipt])

  const isOffline = health === 'OFFLINE' || health === 'UNKNOWN'

  return (
    <div className="flex flex-col gap-6">
      {/* Launch Target: Web UI */}
      <motion.div
        className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[var(--color-ember-dim)] p-2">
            <ExternalLink className="h-4 w-4 text-[var(--color-ember-bright)]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[14px] font-medium text-[var(--color-text-primary)]">
              Agent Builder
            </span>
            <span className="font-sans text-[12px] text-[var(--color-text-tertiary)]">
              Web UI at localhost:3000
            </span>
            <div className="mt-1 flex items-center gap-3">
              <HealthBadge health={health} size="sm" />
              {version && (
                <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                  v{version}
                </span>
              )}
              {uptime !== null && (
                <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] tabular-nums">
                  up {formatUptime(uptime)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Tooltip content="Open in new tab">
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenWebUI}
              disabled={isOffline}
              aria-label="Open Agent Builder web UI in a new tab"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Open
            </Button>
          </Tooltip>
          <Tooltip content="Copy URL to clipboard">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyWebUIUrl}
              aria-label="Copy Agent Builder URL"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>
      </motion.div>

      {/* Launch Target: AgentGen CLI */}
      <motion.div
        className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], delay: 0.05 }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-[var(--color-teal-dim)] p-2">
            <Terminal className="h-4 w-4 text-[var(--color-teal-bright)]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[14px] font-medium text-[var(--color-text-primary)]">
              AgentGen CLI
            </span>
            <span className="font-sans text-[12px] text-[var(--color-text-tertiary)]">
              Terminal-based generation engine
            </span>
            <span className="mt-1 font-mono text-[11px] text-[var(--color-text-ghost)]">
              npx @tarva/agentgen
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Tooltip content="View AgentGen CLI docs">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleViewCLIDocs}
              aria-label="View AgentGen CLI documentation"
            >
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Docs
            </Button>
          </Tooltip>
        </div>
      </motion.div>
    </div>
  )
}
```

### 4.6 Component: Status Station -- `src/components/stations/agent-builder/status-station.tsx`

Universal health dashboard. Driven entirely by `AppTelemetry` data from the WS-1.5 districts store. This is the same structure as every district's Status station but rendered with Agent Builder-specific labels.

```tsx
'use client'

import { HealthBadge } from '@/components/telemetry/health-badge'
import { TelemetrySparkline } from '@/components/telemetry/telemetry-sparkline'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import { AlertIndicator } from '@/components/telemetry/alert-indicator'
import { Skeleton } from '@tarva/ui'
import type { AppTelemetry } from '@/lib/telemetry-types'

// ============================================================================
// Types
// ============================================================================

export interface StatusStationProps {
  /** Full telemetry record from WS-1.5 districts store. */
  readonly telemetry: AppTelemetry | null
  /** Whether telemetry data is still loading. */
  readonly isLoading: boolean
}

// ============================================================================
// Helpers
// ============================================================================

function formatUptime(seconds: number | null): string {
  if (seconds === null) return '--'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function formatResponseTime(ms: number | null): string {
  if (ms === null) return '--'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ============================================================================
// Sub-Components
// ============================================================================

function MetricRow({
  label,
  value,
  isLoading,
}: {
  label: string
  value: string
  isLoading: boolean
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-2 last:border-b-0">
      <span className="font-sans text-[11px] leading-none font-normal tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
        {label}
      </span>
      {isLoading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <span
          className="font-mono text-[13px] leading-none font-medium text-[var(--color-text-primary)] tabular-nums"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {value}
        </span>
      )}
    </div>
  )
}

function SubCheckRow({ name, status }: { name: string; status: string }) {
  const isOk = status === 'ok' || status === 'healthy' || status === 'operational'
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="font-sans text-[12px] text-[var(--color-text-secondary)] capitalize">
        {name}
      </span>
      <span
        className={`font-mono text-[11px] tabular-nums ${
          isOk ? 'text-[var(--color-healthy)]' : 'text-[var(--color-warning)]'
        }`}
        style={{ fontFeatureSettings: '"tnum" 1' }}
      >
        {status.toUpperCase()}
      </span>
    </div>
  )
}

// ============================================================================
// Component
// ============================================================================

export function StatusStation({ telemetry, isLoading }: StatusStationProps) {
  const isOffline = !telemetry || telemetry.status === 'OFFLINE' || telemetry.status === 'UNKNOWN'

  return (
    <div className="flex flex-col gap-4">
      {/* Health Badge + Alert Count */}
      <div className="flex items-center justify-between">
        <HealthBadge health={telemetry?.status ?? 'UNKNOWN'} size="md" />
        {telemetry && telemetry.alertCount > 0 && <AlertIndicator count={telemetry.alertCount} />}
      </div>

      {/* Key Metrics */}
      <div className="flex flex-col">
        <MetricRow
          label="Uptime"
          value={isOffline ? '--' : formatUptime(telemetry?.uptime ?? null)}
          isLoading={isLoading}
        />
        <MetricRow
          label="Version"
          value={isOffline ? '--' : (telemetry?.version ?? '--')}
          isLoading={isLoading}
        />
        <MetricRow
          label="Response Time"
          value={isOffline ? '--' : formatResponseTime(telemetry?.responseTimeMs ?? null)}
          isLoading={isLoading}
        />
      </div>

      {/* Response Time Sparkline */}
      {!isOffline && telemetry?.responseTimeHistory.length > 0 && (
        <div className="pt-2">
          <span className="mb-1 block font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Response Time History
          </span>
          <TelemetrySparkline data={telemetry.responseTimeHistory} width={240} height={32} />
        </div>
      )}

      {/* Sub-Checks */}
      {!isOffline && telemetry && Object.keys(telemetry.checks).length > 0 && (
        <div className="pt-2">
          <span className="mb-2 block font-sans text-[10px] font-normal tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Health Checks
          </span>
          <div className="flex flex-col">
            {Object.entries(telemetry.checks).map(([name, status]) => (
              <SubCheckRow key={name} name={name} status={status} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 4.7 Component: Pipeline Phase Bar -- `src/components/stations/agent-builder/pipeline-phase-bar.tsx`

A 7-segment horizontal progress bar representing the Agent Builder's generation pipeline phases. Each segment is colored based on completion status.

```tsx
'use client'

import { Tooltip } from '@tarva/ui'
import {
  PIPELINE_PHASES,
  type PipelinePhase,
  type AgentBuilderRunStatus,
} from '@/types/agent-builder'

// ============================================================================
// Types
// ============================================================================

export interface PipelinePhaseBarProps {
  /** Index of the current phase (0-6, or -1 if not started). */
  readonly currentPhaseIndex: number
  /** Number of completed phases (0-7). */
  readonly completedPhaseCount: number
  /** Overall run status. */
  readonly status: AgentBuilderRunStatus
}

// ============================================================================
// Helpers
// ============================================================================

type SegmentState = 'completed' | 'active' | 'pending' | 'failed'

function getSegmentState(
  segmentIndex: number,
  currentPhaseIndex: number,
  completedPhaseCount: number,
  status: AgentBuilderRunStatus
): SegmentState {
  if (status === 'failed' && segmentIndex === currentPhaseIndex) return 'failed'
  if (segmentIndex < completedPhaseCount) return 'completed'
  if (segmentIndex === currentPhaseIndex && (status === 'running' || status === 'waiting_approval'))
    return 'active'
  return 'pending'
}

const SEGMENT_COLORS: Record<SegmentState, string> = {
  completed: 'bg-[var(--color-healthy)]',
  active: 'bg-[var(--color-ember-bright)] animate-pulse',
  pending: 'bg-white/[0.06]',
  failed: 'bg-[var(--color-error)]',
}

/** Short phase labels for tooltips. */
const PHASE_SHORT_LABELS: Record<PipelinePhase, string> = {
  PLAN: 'Plan',
  EXECUTE: 'Execute',
  ASSEMBLE: 'Assemble',
  ENRICH: 'Enrich',
  EVAL_GATE: 'Eval Gate',
  FINALIZE: 'Finalize',
  PUBLISH: 'Publish',
}

// ============================================================================
// Component
// ============================================================================

export function PipelinePhaseBar({
  currentPhaseIndex,
  completedPhaseCount,
  status,
}: PipelinePhaseBarProps) {
  return (
    <div
      className="flex w-full items-center gap-0.5"
      role="progressbar"
      aria-valuenow={completedPhaseCount}
      aria-valuemin={0}
      aria-valuemax={7}
      aria-label={`Pipeline progress: ${completedPhaseCount} of 7 phases completed`}
    >
      {PIPELINE_PHASES.map((phase, index) => {
        const segmentState = getSegmentState(index, currentPhaseIndex, completedPhaseCount, status)

        return (
          <Tooltip key={phase} content={`${PHASE_SHORT_LABELS[phase]}: ${segmentState}`}>
            <div
              className={`h-1.5 flex-1 rounded-full ${SEGMENT_COLORS[segmentState]} transition-colors duration-300`}
              data-phase={phase}
              data-state={segmentState}
            />
          </Tooltip>
        )
      })}
    </div>
  )
}
```

### 4.8 Component: Pipeline Station -- `src/components/stations/agent-builder/pipeline-station.tsx`

Table of recent generation runs across all Agent Builder projects. Renders inside a `<StationPanel>` with `bodyType: 'table'`.

```tsx
'use client'

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { Eye, Play, AlertTriangle, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { Badge, ScrollArea, Skeleton, Tooltip } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { PipelinePhaseBar } from './pipeline-phase-bar'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import type { PipelineRun, AgentBuilderRunStatus } from '@/types/agent-builder'

// ============================================================================
// Types
// ============================================================================

export interface PipelineStationProps {
  /** Recent runs to display. Sorted by startedAt descending. */
  readonly runs: readonly PipelineRun[]
  /** Count of currently active runs. */
  readonly activeRunCount: number
  /** Count of queued runs. */
  readonly queuedRunCount: number
  /** Total project count. */
  readonly projectCount: number
  /** Whether data is loading. */
  readonly isLoading: boolean
  /** Whether the Agent Builder is reachable. */
  readonly isReachable: boolean
}

// ============================================================================
// Helpers
// ============================================================================

const STATUS_CONFIG: Record<
  AgentBuilderRunStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Play }
> = {
  queued: { label: 'Queued', variant: 'outline', icon: Clock },
  running: { label: 'Running', variant: 'default', icon: Loader2 },
  completed: { label: 'Completed', variant: 'secondary', icon: CheckCircle },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: XCircle },
  waiting_approval: { label: 'Awaiting Approval', variant: 'default', icon: AlertTriangle },
  partial: { label: 'Partial', variant: 'outline', icon: AlertTriangle },
}

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return '--'
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '--'
  const endTime = end ? new Date(end).getTime() : Date.now()
  const diff = endTime - new Date(start).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ${secs % 60}s`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

// ============================================================================
// Component
// ============================================================================

export function PipelineStation({
  runs,
  activeRunCount,
  queuedRunCount,
  projectCount,
  isLoading,
  isReachable,
}: PipelineStationProps) {
  const { stampReceipt } = useStationContext()

  const handleViewRun = useCallback(
    (run: PipelineRun) => {
      window.open(
        `http://localhost:3000/projects/${run.projectSlug}`,
        '_blank',
        'noopener,noreferrer'
      )
      stampReceipt('view-run', `Opened run ${run.id.slice(0, 8)} for ${run.projectName}`)
    },
    [stampReceipt]
  )

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  // --- Offline State ---
  if (!isReachable) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <XCircle className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          Agent Builder unreachable
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Pipeline data unavailable
        </span>
      </div>
    )
  }

  // --- Empty State ---
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Play className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          No generation runs
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Create a project in Agent Builder to get started
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Metrics */}
      <div className="flex items-center gap-6 border-b border-white/[0.04] pb-3">
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Active
          </span>
          <MetricCounter value={activeRunCount} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Queued
          </span>
          <MetricCounter value={queuedRunCount} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Projects
          </span>
          <MetricCounter value={projectCount} />
        </div>
      </div>

      {/* Runs Table */}
      <ScrollArea className="max-h-[280px]">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_100px_1fr_80px_60px] gap-2 border-b border-white/[0.04] px-2 py-1.5">
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Project
          </span>
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Status
          </span>
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Progress
          </span>
          <span className="font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Started
          </span>
          <span className="text-right font-sans text-[11px] font-semibold tracking-[0.04em] text-[var(--color-text-tertiary)] uppercase">
            Time
          </span>
        </div>

        {/* Table Rows */}
        {runs.map((run, index) => {
          const config = STATUS_CONFIG[run.status]
          const StatusIcon = config.icon

          return (
            <motion.button
              key={run.id}
              className="grid w-full cursor-pointer grid-cols-[1fr_100px_1fr_80px_60px] gap-2 rounded-lg px-2 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.03] focus-visible:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember-bright)]"
              onClick={() => handleViewRun(run)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              aria-label={`Run ${run.id.slice(0, 8)} for ${run.projectName}: ${config.label}`}
            >
              {/* Project Name */}
              <span className="truncate font-sans text-[13px] leading-tight text-[var(--color-text-primary)]">
                {run.projectName}
              </span>

              {/* Status Badge */}
              <div className="flex items-center">
                <Badge variant={config.variant} className="gap-1 text-[10px]">
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>

              {/* Phase Progress Bar */}
              <div className="flex items-center">
                <PipelinePhaseBar
                  currentPhaseIndex={run.currentPhaseIndex}
                  completedPhaseCount={run.completedPhaseCount}
                  status={run.status}
                />
              </div>

              {/* Started Time */}
              <span
                className="font-mono text-[11px] leading-tight text-[var(--color-text-tertiary)] tabular-nums"
                style={{ fontFeatureSettings: '"tnum" 1' }}
              >
                {formatRelativeTime(run.startedAt)}
              </span>

              {/* Duration */}
              <span
                className="text-right font-mono text-[11px] leading-tight text-[var(--color-text-tertiary)] tabular-nums"
                style={{ fontFeatureSettings: '"tnum" 1' }}
              >
                {formatDuration(run.startedAt, run.completedAt)}
              </span>
            </motion.button>
          )
        })}
      </ScrollArea>
    </div>
  )
}
```

### 4.9 Component: Agent List Item -- `src/components/stations/agent-builder/agent-list-item.tsx`

A single agent row used in the Library station's agent list.

```tsx
import { Badge } from '@tarva/ui'
import type { InstalledAgentSummary } from '@/types/agent-builder'

// ============================================================================
// Types
// ============================================================================

export interface AgentListItemProps {
  readonly agent: InstalledAgentSummary
}

// ============================================================================
// Helpers
// ============================================================================

function formatRelativeDate(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

// ============================================================================
// Component
// ============================================================================

export function AgentListItem({ agent }: AgentListItemProps) {
  return (
    <div className="flex items-center justify-between rounded border-b border-white/[0.03] px-2 py-2.5 transition-colors duration-150 last:border-b-0 hover:bg-white/[0.02]">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-sans text-[13px] leading-tight font-medium text-[var(--color-text-primary)]">
            {agent.name}
          </span>
          {agent.isTarvaAgent && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[9px]">
              Tarva
            </Badge>
          )}
        </div>
        <span className="truncate font-sans text-[11px] text-[var(--color-text-tertiary)]">
          {agent.description || agent.fileName}
        </span>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-3">
        {agent.tarvaMetadata && (
          <span
            className="font-mono text-[11px] text-[var(--color-teal)] tabular-nums"
            style={{ fontFeatureSettings: '"tnum" 1' }}
            title={`${agent.tarvaMetadata.skillCount} skills`}
          >
            {agent.tarvaMetadata.skillCount} skills
          </span>
        )}
        <span
          className="font-mono text-[10px] text-[var(--color-text-ghost)] tabular-nums"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {formatRelativeDate(agent.modifiedAt)}
        </span>
      </div>
    </div>
  )
}
```

### 4.10 Component: Library Station -- `src/components/stations/agent-builder/library-station.tsx`

Lists installed agents with summary statistics. Renders inside a `<StationPanel>` with `bodyType: 'list'`.

```tsx
'use client'

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { BookOpen, Users, Wrench } from 'lucide-react'
import { ScrollArea, Skeleton } from '@tarva/ui'
import { useStationContext } from '@/components/stations/station-context'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import { AgentListItem } from './agent-list-item'
import type { InstalledAgentSummary, LibrarySummary } from '@/types/agent-builder'

// ============================================================================
// Types
// ============================================================================

export interface LibraryStationProps {
  /** Installed agents to display. */
  readonly agents: readonly InstalledAgentSummary[]
  /** Aggregate summary statistics. */
  readonly summary: LibrarySummary
  /** Whether data is loading. */
  readonly isLoading: boolean
  /** Whether the Agent Builder is reachable. */
  readonly isReachable: boolean
}

// ============================================================================
// Component
// ============================================================================

export function LibraryStation({ agents, summary, isLoading, isReachable }: LibraryStationProps) {
  const { stampReceipt } = useStationContext()

  const handleBrowseLibrary = useCallback(() => {
    window.open('http://localhost:3000', '_blank', 'noopener,noreferrer')
    stampReceipt('browse-library', `Opened Agent Builder library (${summary.totalAgents} agents)`)
  }, [stampReceipt, summary.totalAgents])

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-4">
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-12 w-20" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  // --- Offline State ---
  if (!isReachable) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BookOpen className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          Agent Builder unreachable
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Library data unavailable
        </span>
      </div>
    )
  }

  // --- Empty State ---
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="mb-3 h-8 w-8 text-[var(--color-text-ghost)]" />
        <span className="font-sans text-[13px] text-[var(--color-text-tertiary)]">
          No agents installed
        </span>
        <span className="mt-1 font-sans text-[12px] text-[var(--color-text-ghost)]">
          Build your first agent in the Agent Builder
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Metrics */}
      <motion.div
        className="flex items-center gap-6 border-b border-white/[0.04] pb-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Agents
          </span>
          <MetricCounter value={summary.totalAgents} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Tarva
          </span>
          <MetricCounter value={summary.tarvaAgents} />
        </div>
        <div className="flex flex-col">
          <span className="font-sans text-[10px] tracking-[0.06em] text-[var(--color-text-tertiary)] uppercase">
            Skills
          </span>
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3 text-[var(--color-teal)]" />
            <MetricCounter value={summary.totalSkills} />
          </div>
        </div>
      </motion.div>

      {/* Agent List */}
      <ScrollArea className="max-h-[240px]">
        {agents.map((agent, index) => (
          <motion.div
            key={agent.fileName}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
          >
            <AgentListItem agent={agent} />
          </motion.div>
        ))}
      </ScrollArea>
    </div>
  )
}
```

### 4.11 Barrel Export -- `src/components/stations/agent-builder/index.ts`

```ts
export { LaunchStation } from './launch-station'
export type { LaunchStationProps } from './launch-station'

export { StatusStation } from './status-station'
export type { StatusStationProps } from './status-station'

export { PipelineStation } from './pipeline-station'
export type { PipelineStationProps } from './pipeline-station'

export { LibraryStation } from './library-station'
export type { LibraryStationProps } from './library-station'

export { PipelinePhaseBar } from './pipeline-phase-bar'
export type { PipelinePhaseBarProps } from './pipeline-phase-bar'

export { AgentListItem } from './agent-list-item'
export type { AgentListItemProps } from './agent-list-item'
```

---

## 5. Acceptance Criteria

### Functional

| #   | Criterion                                                                                                                                                | Verification                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| F1  | Agent Builder district renders 4 stations: Launch, Status, Pipeline, Library, matching AD-8                                                              | Visual inspection at Z2/Z3 zoom level                                                             |
| F2  | Launch station shows TWO launch targets: Agent Builder Web UI (localhost:3000) and AgentGen CLI, per Gap #4                                              | Visual inspection + unit test                                                                     |
| F3  | Launch station "Open" button opens Agent Builder in a new browser tab via `window.open('http://localhost:3000', '_blank')` and triggers a receipt stamp  | Integration test clicking button, asserting `window.open` call and receipt store `.record()` call |
| F4  | Launch station "Copy URL" button copies `http://localhost:3000` to clipboard and triggers a receipt stamp                                                | Unit test with mocked clipboard API                                                               |
| F5  | Launch station shows health dot, version, and uptime from WS-1.5 telemetry data                                                                          | Unit test with mock AppTelemetry prop                                                             |
| F6  | Status station renders HealthBadge, uptime, version, response time, sparkline, and sub-checks from WS-1.5 AppTelemetry                                   | Snapshot test of rendered DOM structure                                                           |
| F7  | Pipeline station shows a table of up to 20 recent runs with columns: Project, Status, Progress, Started, Duration                                        | Unit test with mock PipelineRun array                                                             |
| F8  | Pipeline station's PipelinePhaseBar renders 7 segments colored by phase completion state (completed=green, active=ember+pulse, pending=gray, failed=red) | Unit test for each segment state                                                                  |
| F9  | Pipeline station clicking a run row opens the project in Agent Builder and triggers a receipt stamp                                                      | Integration test                                                                                  |
| F10 | Library station shows summary metrics (total agents, Tarva agents, total skills) and a scrollable list of installed agents                               | Unit test with mock InstalledAgentSummary array                                                   |
| F11 | Library station AgentListItem shows name, description, Tarva badge (if applicable), skill count, and relative modification date                          | Unit test                                                                                         |
| F12 | `GET /api/districts/agent-builder` Route Handler proxies Agent Builder APIs and returns valid `AgentBuilderDistrictData` JSON                            | Integration test with mocked fetch                                                                |
| F13 | Route Handler returns `isReachable: false` with empty defaults when Agent Builder is unreachable (fetch timeout or error)                                | Unit test with rejected fetch                                                                     |
| F14 | `useAgentBuilderDistrict()` hook polls at 15s intervals and returns typed data                                                                           | TanStack Query testing with mock server                                                           |

### UI States

| #   | State                               | Visual Treatment                                                                                                                                     | Verification                                                 |
| --- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| S1  | Loading (initial fetch)             | Skeleton placeholders in all stations                                                                                                                | Unit test with `isLoading: true`                             |
| S2  | Loaded (Agent Builder online)       | Full data display with live metrics and lists                                                                                                        | Visual inspection                                            |
| S3  | Offline (Agent Builder unreachable) | Icon + "Agent Builder unreachable" message in Pipeline and Library; Status station shows OFFLINE health badge; Launch station disables "Open" button | Unit test with OFFLINE health state and `isReachable: false` |
| S4  | Empty (no runs/agents)              | Icon + "No generation runs" / "No agents installed" with guidance text                                                                               | Unit test with empty arrays                                  |
| S5  | Error (Route Handler fails)         | TanStack Query retry logic; falls back to `EMPTY_AGENT_BUILDER_DATA`                                                                                 | TanStack Query error boundary test                           |
| S6  | Partial (some upstream APIs fail)   | Available data displayed; failed sections show offline state                                                                                         | Route Handler test with mixed fetch results                  |

### Performance

| #   | Criterion                                                                                                  | Verification                           |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| P1  | Route Handler completes within 4 seconds (3s fetch timeout + 1s overhead)                                  | Performance test with timing assertion |
| P2  | Route Handler fetches projects and agents in parallel, then runs per-project in parallel (max 10 projects) | Code review                            |
| P3  | All station components use Tailwind `contain-[layout_style_paint]` on their root element                   | CSS inspection                         |
| P4  | Pipeline table uses `ScrollArea` with max-height to prevent unbounded DOM growth                           | DOM inspection                         |
| P5  | PipelinePhaseBar uses CSS transitions (GPU composited) not JS-driven animation for segment color changes   | Code review                            |
| P6  | No `useEffect` re-render loops in station components                                                       | React DevTools Profiler                |

### Typography & Design Fidelity

| #   | Criterion                                                                                                           | Verification                |
| --- | ------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| T1  | All telemetry values use Geist Mono with `tabular-nums` and `font-feature-settings: "tnum" 1`                       | Computed style verification |
| T2  | Station table headers use 11px, font-weight 600, tracking 0.04em, uppercase per VISUAL-DESIGN-SPEC.md Z3 type scale | Computed style verification |
| T3  | Station body text uses 14px Geist Sans, font-weight 400 per VISUAL-DESIGN-SPEC.md Z3 type scale                     | Computed style verification |
| T4  | Data labels use 10-11px, uppercase, tracking 0.04-0.06em, `--color-text-tertiary`                                   | Computed style verification |
| T5  | Ember accent (`--color-ember-*`) used for interactive elements, teal accent (`--color-teal-*`) used for data values | Visual inspection           |

---

## 6. Decisions Made

| #   | Decision                                                                                                           | Rationale                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Dedicated Route Handler** (`/api/districts/agent-builder`) rather than client-side direct fetch to Agent Builder | The Launch runs on a different port than Agent Builder. Client-side `fetch('http://localhost:3000/api/...')` would fail due to CORS. The Route Handler runs server-side where there are no CORS restrictions, and consolidates 3+ upstream requests into one response.                                           |
| D2  | **Limit upstream project fetches to 10** in the Route Handler                                                      | Each project requires an additional `/runs` fetch. Unbounded project counts could create a cascade of requests. 10 projects with runs is sufficient for the Pipeline station's top-20-runs display.                                                                                                              |
| D3  | **Runs capped at 20** in the district payload                                                                      | The Pipeline station is a status dashboard, not a full run history browser. 20 rows is enough for at-a-glance monitoring. Users who want the full history click through to the Agent Builder app.                                                                                                                |
| D4  | **AgentGen CLI entry shows "Docs" button, not "Launch"**                                                           | The CLI is a terminal process -- the Launch cannot start terminal processes via `window.open()`. The CLI entry provides visibility and a documentation link. Process management is out of scope for this workstream.                                                                                             |
| D5  | **PipelinePhaseBar uses 7 equal-width segments** not proportional to phase duration                                | Phase durations vary widely (EXECUTE can take 10x longer than PLAN). Equal segments provide clearer visual progress indication and are consistent across different agent projects.                                                                                                                               |
| D6  | **Library station shows InstalledAgent data, not project data** for the list                                       | The Library station per AD-8 is "agents/skills list." Projects are Pipeline's domain. Installed agents in `~/.claude/agents/` are the canonical "library" and represent the output of the Agent Builder pipeline.                                                                                                |
| D7  | **Status station is identical structure across all districts**                                                     | The Status station is a universal station. Its content is fully driven by `AppTelemetry` from WS-1.5. Agent Builder's Status station gets no special treatment beyond its app-specific health check data (sub-checks may differ).                                                                                |
| D8  | **Entrance animations use `motion/react`** per project constraint, not `framer-motion`                             | The project uses `motion/react` (the modular Framer Motion package) as specified in the project constraints. All imports reference `motion/react`.                                                                                                                                                               |
| D9  | **teal accent for CLI target, ember for Web UI target** in Launch station                                          | The dual-accent system (ember = primary/interactive, teal = data/informational) naturally maps to the two targets: Web UI is the primary interactive launch target (ember), CLI is the informational/secondary target (teal).                                                                                    |
| D10 | **Route Handler returns `isReachable` flag separate from health status**                                           | Health status (OPERATIONAL/DOWN/OFFLINE) comes from WS-1.5 telemetry, which has contact history and OFFLINE-vs-DOWN semantics. The district Route Handler's `isReachable` simply indicates whether enrichment data was available for this poll cycle. They serve different purposes and should not be conflated. |

---

## 7. Open Questions

| #   | Question                                                                                                             | Impact                                                                                                                                           | Proposed Resolution                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Should the Pipeline station show run events (SSE stream) for real-time phase progress, or only poll-based snapshots? | Medium -- affects perceived responsiveness of the Pipeline station during active runs.                                                           | Phase 2: poll-based snapshots only (15s cadence). The Agent Builder's event stream (`/api/create-hybrid/[jobId]/events`) is SSE-based and would add substantial complexity. Add SSE in a future phase if stakeholder requests real-time progress. |
| Q2  | Does the Agent Builder have a `/api/health` endpoint, or will the telemetry aggregator (WS-1.5) create one?          | Low -- the Route Handler provides enrichment data regardless. Health status comes from WS-1.5 which handles missing health endpoints gracefully. | Per WS-1.5: the telemetry aggregator attempts `GET http://localhost:3000/api/health` and falls back to OFFLINE/UNKNOWN. Agent Builder does not currently have this endpoint. WS-1.5 handles the absence.                                          |
| Q3  | How should the Launch station handle the case where Agent Builder and the Launch app run on the same port (3000)?    | Medium -- port collision would prevent both from running simultaneously.                                                                         | The Launch app should be configured on a different port (e.g., 3100). This is an environment config concern for WS-0.1 scaffolding, not this workstream. Assume ports are distinct.                                                               |
| Q4  | Should the Library station list agents from `~/.claude/agents/` (local filesystem) or via Agent Builder's API?       | Low -- both return the same data, but the API path avoids filesystem access from the Launch app.                                                 | Use Agent Builder's `GET /api/agents/installed` API via the district Route Handler. This avoids filesystem coupling and leverages Agent Builder's existing parsing logic. Already implemented in the Route Handler design.                        |
| Q5  | What Lucide icon should the Pipeline station use for its header?                                                     | Low -- cosmetic.                                                                                                                                 | `GitBranch` per the `agent-builder--pipeline` template definition in WS-1.7. Already specified.                                                                                                                                                   |

---

## 8. Risk Register

| #   | Risk                                                                                          | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Agent Builder API response shapes change** between WS-2.2 development and runtime           | Medium     | High   | The Route Handler uses typed raw response interfaces (`RawProject`, `RawRun`, `RawInstalledAgent`) and maps to Launch-specific types. If upstream shapes change, only the mapping in the Route Handler needs updating -- no station component changes. Add a validation step in the Route Handler that logs warnings for unexpected response shapes and falls back to defaults. |
| R2  | **Port collision** between Launch app and Agent Builder (both default to 3000)                | High       | High   | The Launch project scaffolding (WS-0.1) must configure a non-colliding port (e.g., 3100 or 4100). Document the expected port assignment in the project README. The `AGENT_BUILDER_BASE` constant in the Route Handler should be configurable via environment variable.                                                                                                          |
| R3  | **Route Handler latency** when Agent Builder has many projects (10+ with runs)                | Medium     | Medium | Cap project fetches at 10. Fetch all project runs in parallel with 3s timeout per request. The Route Handler should complete within 4 seconds worst-case. Monitor with performance timing.                                                                                                                                                                                      |
| R4  | **PipelinePhaseBar accessibility** -- progress bar may not be interpretable by screen readers | Low        | Medium | The `PipelinePhaseBar` uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and a descriptive `aria-label`. Each segment has a tooltip with phase name and state.                                                                                                                                                                                  |
| R5  | **Data staleness** -- 15-second polling may show outdated run status during active generation | Medium     | Low    | Acceptable for a monitoring dashboard. Users who want real-time run progress use the Agent Builder app directly. The Launch is for glanceable status, not operational control. Document this as a known limitation.                                                                                                                                                             |
| R6  | **Agent Builder's `/api/agents/installed` reads filesystem** and may be slow with many agents | Low        | Low    | The Route Handler has a 3-second timeout. If the endpoint is slow, the library section returns empty and the rest of the payload is unaffected. The Agent Builder's existing implementation (reading `~/.claude/agents/`) is fast in practice (<100ms for typical installations).                                                                                               |
| R7  | **ScrollArea overflow behavior** in Pipeline and Library stations at different viewport sizes | Low        | Medium | The station panel has a fixed height within the district layout (controlled by WS-2.1 morph choreography). `ScrollArea` with `max-h-[280px]` (Pipeline) and `max-h-[240px]` (Library) prevents overflow while allowing internal scrolling. Values may need tuning after integration with the district container.                                                                |
| R8  | **Motion import path** accidentally uses `framer-motion` instead of `motion/react`            | Medium     | Low    | All components in this workstream import from `motion/react`. Add an ESLint rule to flag imports from `framer-motion` as errors. Enforced in code review.                                                                                                                                                                                                                       |
