# WS-2.3: District Content -- Project Room

> **Workstream ID:** WS-2.3
> **Phase:** 2 -- Districts + Stations + Morph
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.5 (telemetry), WS-2.1 (morph), WS-2.6 (station framework)
> **Blocks:** None
> **Resolves:** None

---

## 1. Objective

Deliver the Project Room district for Tarva Launch: five station panels (Launch, Status, Runs, Artifacts, Governance) that surface live data from the Project Room application at `localhost:3005`. The stations consume the WS-2.6 station panel framework for consistent 3-zone layout, glass material styling, and luminous borders, and are populated by telemetry from WS-1.5 plus dedicated Route Handlers that fetch richer data from the Project Room API.

**Success looks like:** A user navigates to the Project Room district at Z2 and sees five station panels unfurl with staggered entrance per the WS-2.1 morph choreography. The Launch station shows the app's connection status, version, and a one-click button to open `localhost:3005` in a new tab. The Status station displays dependency health (Supabase, Inngest, Claude API), queue depth, active worker count, and error rate. The Runs station shows active executions with progress indicators, queue depth, and recent completions. The Artifacts station lists recent outputs with type badges and version info. The Governance station surfaces pending approvals, phase gate progress, and recent truth entries. All five stations update on the telemetry polling cycle and generate receipt stamps for user actions.

**Why this workstream matters:** Project Room is one of the richest Tarva apps (40+ API routes, 8 database schemas, 90+ tables). Its district demonstrates the Launch's ability to surface complex multi-domain data (executions, artifacts, governance) in a glanceable station layout. The Runs and Governance stations exercise the spine object model -- Runs maps to the Activity supertype and Artifacts maps to the Artifact supertype (per Gap 2 resolution). The Governance station is the only place in the Launch where the demoted "Approval" concept surfaces, validating the IA's decision to keep it app-specific rather than spine-level.

---

## 2. Scope

### In Scope

1. **Project Room Route Handler** (`src/app/api/districts/project-room/route.ts`): `GET /api/districts/project-room` server-side fetcher that calls the Project Room API at `localhost:3005` for runs, artifacts, and governance data. Returns a `ProjectRoomSnapshot` JSON payload. Handles the app being offline gracefully (returns empty/stale data with status flags). [SPEC: AD-5, AD-8]

2. **Project Room types** (`src/types/districts/project-room.ts`): TypeScript types for `ProjectRoomSnapshot`, `ProjectRoomRun`, `ProjectRoomArtifact`, `ProjectRoomGovernanceItem`, `ProjectRoomPhaseGate`, and `ProjectRoomTruthEntry`. These types represent the Launch's view of Project Room data -- a simplified projection, not the full Project Room schema. [SPEC: Gap 2 spine objects]

3. **Project Room data hook** (`src/hooks/use-project-room.ts`): `useProjectRoom()` TanStack Query hook that fetches the district-level data. Polls on a slower cadence than telemetry (30s default, since district data changes less frequently than health status). Enabled only when the Project Room district is active (Z2 or Z3 with Project Room selected).

4. **Launch station** (`src/components/stations/project-room/launch-station.tsx`): App launcher panel showing connection status, version, port/URL, last accessed time. Primary action: "Open Project Room" (opens `localhost:3005` in a new tab). Secondary action: "Copy URL".

5. **Status station** (`src/components/stations/project-room/status-station.tsx`): Operational health detail showing dependency connections (Supabase cloud, Inngest, Claude API) with per-dependency status dots and latency, key performance metrics (queue depth, active workers, error rate), and last 3 errors if any.

6. **Runs station** (`src/components/stations/project-room/runs-station.tsx`): Active executions with progress indicators, queue depth and waiting items, recent completions (last 5 with status badges). Actions: "View Run" (opens in Project Room), "Cancel Run", "Open Project".

7. **Artifacts station** (`src/components/stations/project-room/artifacts-station.tsx`): Recent artifacts (last 5: name, type badge, version, creator), dependency graph health summary (valid/invalid counts). Action: "Browse Artifacts" (opens Project Room artifacts page).

8. **Governance station** (`src/components/stations/project-room/governance-station.tsx`): Pending approval count and list, phase gate status across active projects, recent truth entries. Actions: "Review Item" (opens in Project Room), "Open Project".

9. **Station registration** (`src/components/stations/project-room/index.ts`): Register all 5 stations with the WS-2.6 station template registry under the `project-room` district ID.

10. **Receipt integration**: Every user action at Z3 (opening the app, copying URL, viewing a run, cancelling a run, reviewing an approval) triggers the receipt stamp ritual per the WS-2.6 station framework contract. Receipt data includes `district: 'project-room'`, `station` name, and action-specific detail payload.

### Out of Scope

- The station panel framework itself (header/body/actions zones, glass material, luminous borders) -- provided by WS-2.6
- Morph choreography and staggered station entrance animations -- provided by WS-2.1
- Telemetry aggregator and HealthBadge/Sparkline/MetricCounter components -- provided by WS-1.5
- Writing data back to the Project Room (all Launch interactions are read-only; "Cancel Run" opens the Project Room UI, it does not call the cancellation API directly)
- Receipt persistence to Supabase (Phase 3, WS-3.1)
- AI narrated telemetry for Project Room metrics (Phase 3, WS-3.6)
- Deep-linking into specific Project Room pages beyond opening the app URL
- Workflow visualization canvas (React Flow) -- this is Project Room internal UI, not surfaced in the Launch
- Real-time SSE streaming of run progress -- the Launch polls; Project Room handles real-time internally

---

## 3. Input Dependencies

| Dependency                          | Source                               | What Is Needed                                                                                                                                                 | Blocking?                                       |
| ----------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| WS-2.6 Station Panel Framework      | Phase 2                              | `<StationPanel>` component with header/body/actions zones, glass material styling, luminous borders, receipt stamp trigger API                                 | Yes -- stations render inside this framework    |
| WS-2.1 Morph Choreography           | Phase 2                              | District container that stations unfurl into, staggered entrance via `motion/react`                                                                            | Yes -- stations need the container to render in |
| WS-1.5 Telemetry Aggregator         | Phase 1                              | `useTelemetry()` hook, `useDistrictsStore()` for Project Room health status, `HealthBadge`, `MetricCounter`, `TelemetrySparkline`, `AlertIndicator` components | Yes -- Status station consumes these            |
| WS-0.2 Design Tokens                | Phase 0                              | Spatial CSS custom properties (glass, glow, ember/teal accents, typography)                                                                                    | Yes -- station styling uses these tokens        |
| WS-0.1 Scaffolding                  | Phase 0                              | Directory structure, TanStack Query provider, Zustand stores                                                                                                   | Yes -- project foundation                       |
| Gap 2: Spine Object Model           | combined-recommendations.md          | Activity (maps to runs/executions), Artifact (maps to outputs) type definitions                                                                                | Available (read-only reference)                 |
| Gap 3: Status Model                 | combined-recommendations.md          | 5-state health model for dependency status rendering                                                                                                           | Available (read-only reference)                 |
| AD-8: Station Content               | combined-recommendations.md          | Project Room station list: Launch, Status, Runs, Artifacts, Governance                                                                                         | Available (read-only reference)                 |
| AD-9: File Structure                | combined-recommendations.md          | `src/components/stations/project-room/` path                                                                                                                   | Available (read-only reference)                 |
| IA Assessment: Z3 Station Templates | ia-discovery-assessment.md           | Runs station content, Governance station content, station 3-zone layout                                                                                        | Available (read-only reference)                 |
| VISUAL-DESIGN-SPEC: Z3 Typography   | VISUAL-DESIGN-SPEC.md Section 3.2    | Panel heading 16px/600, body 14px/400, table header 11px/600 uppercase, table data 13px Geist Mono                                                             | Available (read-only reference)                 |
| Project Room API surface            | TARVA-SYSTEM-OVERVIEW.md Section 3.3 | 40+ API routes: runs, artifacts, truth governance, dependencies, phase gates                                                                                   | Available (read-only reference)                 |
| @tarva/ui components                | @tarva/ui package                    | Button, Badge, ScrollArea, Tabs, Tooltip, StatusBadge, KpiCard                                                                                                 | Available                                       |

---

## 4. Deliverables

### 4.1 Project Room Types (`src/types/districts/project-room.ts`)

Type definitions for the Launch's projection of Project Room data. These are simplified views of the Project Room's internal schemas -- the Launch does not need (or want) the full 90+ table schema.

```ts
/**
 * Status of an agent execution run in Project Room.
 * Maps to the Launch spine "Activity" supertype (Gap 2).
 * Project Room calls these "runs" or "executions" --
 * the Launch normalizes them as Activity with
 * activity_type: 'agent_execution'.
 */
export interface ProjectRoomRun {
  /** Run ID from Project Room's database */
  id: string
  /** Project name this run belongs to */
  projectName: string
  /** Agent name executing the run */
  agentName: string
  /** Current run status */
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'
  /** Progress percentage (0-100), null if not trackable */
  progress: number | null
  /** Current phase or step description, null if not available */
  currentPhase: string | null
  /** Total tokens consumed so far */
  tokensUsed: number | null
  /** Estimated cost in USD */
  estimatedCost: number | null
  /** ISO 8601 start timestamp */
  startedAt: string
  /** ISO 8601 end timestamp, null if still running */
  endedAt: string | null
  /** Duration in milliseconds, null if still running */
  durationMs: number | null
  /** Error summary if status is 'failed' */
  errorSummary: string | null
}

/**
 * An artifact produced by a Project Room execution.
 * Maps to the Launch spine "Artifact" supertype (Gap 2).
 */
export interface ProjectRoomArtifact {
  /** Artifact ID from Project Room's database */
  id: string
  /** Human-readable name */
  name: string
  /**
   * Artifact type classification.
   * Project Room tracks: code, document, data, config, test, other
   */
  type: 'code' | 'document' | 'data' | 'config' | 'test' | 'other'
  /** Semantic version string (e.g., "1.2.3") */
  version: string | null
  /** Agent or user who created this artifact */
  creator: string
  /** ISO 8601 creation timestamp */
  createdAt: string
  /** Project name this artifact belongs to */
  projectName: string
}

/**
 * A pending approval or review item in the governance system.
 * "Approval" is a demoted spine concept (IA assessment) --
 * it surfaces only in Project Room's Governance station,
 * not as a Launch-level spine object.
 */
export interface ProjectRoomGovernanceItem {
  /** Item ID from Project Room's governance schema */
  id: string
  /** Human-readable description of what needs approval */
  summary: string
  /** Type of governance action */
  type: 'phase_gate' | 'truth_entry' | 'artifact_review' | 'decision'
  /** Who or what requested this review */
  requestedBy: string
  /** ISO 8601 timestamp of when the request was created */
  requestedAt: string
  /** How long this item has been waiting */
  waitingSince: string
  /** Associated project name */
  projectName: string
}

/**
 * Phase gate status for a project milestone.
 */
export interface ProjectRoomPhaseGate {
  /** Gate ID */
  id: string
  /** Project this gate belongs to */
  projectName: string
  /** Phase name (e.g., "API Integration", "Testing") */
  phaseName: string
  /** Number of criteria met */
  criteriaMet: number
  /** Total number of criteria */
  criteriaTotal: number
  /** Whether the gate is passed */
  passed: boolean
}

/**
 * A truth governance entry -- a canonical decision or requirement.
 */
export interface ProjectRoomTruthEntry {
  /** Entry ID */
  id: string
  /** The decision or requirement text */
  content: string
  /** Classification */
  category: 'decision' | 'requirement' | 'constraint' | 'definition'
  /** Source of this truth (agent, human, system) */
  source: string
  /** ISO 8601 timestamp */
  createdAt: string
}

/**
 * Dependency status for a Project Room external service.
 */
export interface ProjectRoomDependency {
  /** Dependency name (e.g., 'Supabase', 'Inngest', 'Claude API') */
  name: string
  /** Connection status */
  status: 'ok' | 'degraded' | 'error' | 'unreachable'
  /** Response latency in milliseconds, null if unreachable */
  latencyMs: number | null
  /** Error message if status is not 'ok' */
  error: string | null
}

/**
 * Performance metrics snapshot for Project Room.
 */
export interface ProjectRoomMetrics {
  /** Number of items waiting in the Inngest job queue */
  queueDepth: number
  /** Number of currently active workers processing jobs */
  activeWorkers: number
  /** Error rate as a percentage (0-100) over the last minute */
  errorRatePercent: number
  /** Total active executions */
  activeExecutions: number
  /** Total pending approvals */
  pendingApprovals: number
}

/**
 * Complete snapshot of Project Room data for the Launch district.
 * Returned by GET /api/districts/project-room.
 */
export interface ProjectRoomSnapshot {
  /** ISO 8601 timestamp when this snapshot was generated */
  timestamp: string
  /** Whether the Project Room API was reachable */
  available: boolean
  /** Active and recent runs (up to 10) */
  runs: ProjectRoomRun[]
  /** Recent artifacts (up to 5) */
  artifacts: ProjectRoomArtifact[]
  /** Pending governance items */
  governanceItems: ProjectRoomGovernanceItem[]
  /** Phase gate status across active projects */
  phaseGates: ProjectRoomPhaseGate[]
  /** Recent truth entries (up to 5) */
  truthEntries: ProjectRoomTruthEntry[]
  /** Dependency connection statuses */
  dependencies: ProjectRoomDependency[]
  /** Aggregate performance metrics */
  metrics: ProjectRoomMetrics
  /** Recent errors (up to 3), for Status station */
  recentErrors: Array<{
    message: string
    timestamp: string
    source: string
  }>
}
```

**Design decisions in these types:**

1. **Simplified projections**: The Project Room has 90+ database tables across 8 schemas. The Launch needs a fraction of this data. These types represent the "glanceable" view -- enough to answer "What is happening? Is anything broken? Does anything need my attention?" without replicating the full schema.

2. **Spine alignment**: `ProjectRoomRun` maps to the spine `Activity` supertype with `activity_type: 'agent_execution'`. `ProjectRoomArtifact` maps to the spine `Artifact` supertype. This alignment enables future cross-app views in the Evidence Ledger where runs from Agent Builder and Project Room appear in the same activity feed.

3. **Governance as app-specific**: Per the IA assessment, "Approval" was demoted from spine-level to app-specific. The `ProjectRoomGovernanceItem` type only exists in this district's types -- it is not in the shared `telemetry-types.ts`.

### 4.2 Project Room Route Handler (`src/app/api/districts/project-room/route.ts`)

Server-side fetcher that calls the Project Room API at `localhost:3005` and returns a `ProjectRoomSnapshot`. Runs server-side to avoid CORS, consistent with WS-1.5's telemetry aggregator pattern.

```ts
import { NextResponse } from 'next/server'
import type {
  ProjectRoomSnapshot,
  ProjectRoomRun,
  ProjectRoomArtifact,
  ProjectRoomGovernanceItem,
  ProjectRoomPhaseGate,
  ProjectRoomTruthEntry,
  ProjectRoomDependency,
  ProjectRoomMetrics,
} from '@/lib/districts/project-room-types'

const PROJECT_ROOM_BASE = 'http://localhost:3005'
const FETCH_TIMEOUT_MS = 5_000

/**
 * Fetch JSON from a Project Room API endpoint with timeout.
 * Returns null on any failure (timeout, network error, non-200, invalid JSON).
 */
async function fetchProjectRoom<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(`${PROJECT_ROOM_BASE}${path}`, {
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

/**
 * Build an empty snapshot for when the Project Room is unreachable.
 */
function emptySnapshot(): ProjectRoomSnapshot {
  return {
    timestamp: new Date().toISOString(),
    available: false,
    runs: [],
    artifacts: [],
    governanceItems: [],
    phaseGates: [],
    truthEntries: [],
    dependencies: [],
    metrics: {
      queueDepth: 0,
      activeWorkers: 0,
      errorRatePercent: 0,
      activeExecutions: 0,
      pendingApprovals: 0,
    },
    recentErrors: [],
  }
}

/**
 * Map raw Project Room API responses to Launch-typed data.
 *
 * The Project Room API returns its own internal types. This function
 * extracts and reshapes only the fields the Launch needs, applying
 * safe defaults for missing or unexpected data.
 *
 * This mapping layer isolates the Launch from Project Room schema changes.
 * If the Project Room API evolves, only this mapper needs updating.
 */
function mapRun(raw: Record<string, unknown>): ProjectRoomRun {
  return {
    id: String(raw.id ?? ''),
    projectName: String(raw.project_name ?? raw.projectName ?? 'Unknown'),
    agentName: String(raw.agent_name ?? raw.agentName ?? 'Unknown'),
    status: validateRunStatus(raw.status),
    progress: typeof raw.progress === 'number' ? raw.progress : null,
    currentPhase: typeof raw.current_phase === 'string' ? raw.current_phase : null,
    tokensUsed: typeof raw.tokens_used === 'number' ? raw.tokens_used : null,
    estimatedCost: typeof raw.estimated_cost === 'number' ? raw.estimated_cost : null,
    startedAt: String(raw.started_at ?? raw.startedAt ?? ''),
    endedAt: raw.ended_at ? String(raw.ended_at) : null,
    durationMs: typeof raw.duration_ms === 'number' ? raw.duration_ms : null,
    errorSummary: typeof raw.error_summary === 'string' ? raw.error_summary : null,
  }
}

function validateRunStatus(status: unknown): ProjectRoomRun['status'] {
  const valid = ['pending', 'active', 'completed', 'failed', 'cancelled']
  if (typeof status === 'string' && valid.includes(status)) {
    return status as ProjectRoomRun['status']
  }
  return 'pending'
}

function mapArtifact(raw: Record<string, unknown>): ProjectRoomArtifact {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? 'Unnamed'),
    type: validateArtifactType(raw.type),
    version: typeof raw.version === 'string' ? raw.version : null,
    creator: String(raw.creator ?? raw.created_by ?? 'Unknown'),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    projectName: String(raw.project_name ?? raw.projectName ?? 'Unknown'),
  }
}

function validateArtifactType(type: unknown): ProjectRoomArtifact['type'] {
  const valid = ['code', 'document', 'data', 'config', 'test', 'other']
  if (typeof type === 'string' && valid.includes(type)) {
    return type as ProjectRoomArtifact['type']
  }
  return 'other'
}

/**
 * GET /api/districts/project-room
 *
 * Fetches Project Room data from localhost:3005 and returns a
 * ProjectRoomSnapshot. All fetch calls run in parallel for speed.
 *
 * If the Project Room is unreachable, returns an empty snapshot
 * with available: false. Individual endpoint failures degrade
 * gracefully -- a failed /api/runs call results in an empty runs
 * array, not a full snapshot failure.
 */
export async function GET() {
  // Parallel fetch all data sources from Project Room
  const [runsRaw, artifactsRaw, governanceRaw, healthRaw] = await Promise.all([
    fetchProjectRoom<Record<string, unknown>[]>(
      '/api/runs?limit=10&status=active,pending,completed,failed'
    ),
    fetchProjectRoom<Record<string, unknown>[]>('/api/artifacts?limit=5&sort=created_at:desc'),
    fetchProjectRoom<Record<string, unknown>>('/api/governance/pending'),
    fetchProjectRoom<Record<string, unknown>>('/api/health'),
  ])

  // If health check failed, the app is likely down
  const available = healthRaw !== null

  // Map raw responses to Launch types with safe defaults
  const runs: ProjectRoomRun[] = Array.isArray(runsRaw) ? runsRaw.map(mapRun) : []

  const artifacts: ProjectRoomArtifact[] = Array.isArray(artifactsRaw)
    ? artifactsRaw.map(mapArtifact)
    : []

  // Governance data comes as a structured response
  const governanceItems: ProjectRoomGovernanceItem[] = Array.isArray(
    (governanceRaw as Record<string, unknown>)?.items
  )
    ? ((governanceRaw as Record<string, unknown>).items as Record<string, unknown>[]).map(
        (item) => ({
          id: String(item.id ?? ''),
          summary: String(item.summary ?? item.description ?? ''),
          type: validateGovernanceType(item.type),
          requestedBy: String(item.requested_by ?? item.requestedBy ?? 'System'),
          requestedAt: String(item.requested_at ?? item.requestedAt ?? ''),
          waitingSince: String(item.waiting_since ?? item.requestedAt ?? ''),
          projectName: String(item.project_name ?? item.projectName ?? 'Unknown'),
        })
      )
    : []

  const phaseGates: ProjectRoomPhaseGate[] = Array.isArray(
    (governanceRaw as Record<string, unknown>)?.phaseGates
  )
    ? ((governanceRaw as Record<string, unknown>).phaseGates as Record<string, unknown>[]).map(
        (gate) => ({
          id: String(gate.id ?? ''),
          projectName: String(gate.project_name ?? gate.projectName ?? 'Unknown'),
          phaseName: String(gate.phase_name ?? gate.phaseName ?? ''),
          criteriaMet: typeof gate.criteria_met === 'number' ? gate.criteria_met : 0,
          criteriaTotal: typeof gate.criteria_total === 'number' ? gate.criteria_total : 0,
          passed: gate.passed === true,
        })
      )
    : []

  const truthEntries: ProjectRoomTruthEntry[] = Array.isArray(
    (governanceRaw as Record<string, unknown>)?.truthEntries
  )
    ? ((governanceRaw as Record<string, unknown>).truthEntries as Record<string, unknown>[])
        .slice(0, 5)
        .map((entry) => ({
          id: String(entry.id ?? ''),
          content: String(entry.content ?? entry.text ?? ''),
          category: validateTruthCategory(entry.category),
          source: String(entry.source ?? 'Unknown'),
          createdAt: String(entry.created_at ?? entry.createdAt ?? ''),
        }))
    : []

  // Extract dependency health from the health response
  const dependencies: ProjectRoomDependency[] = healthRaw?.dependencies
    ? Object.entries(healthRaw.dependencies as Record<string, Record<string, unknown>>).map(
        ([name, dep]) => ({
          name: formatDependencyName(name),
          status: validateDepStatus(dep.status),
          latencyMs: typeof dep.latency_ms === 'number' ? dep.latency_ms : null,
          error: typeof dep.error === 'string' ? dep.error : null,
        })
      )
    : []

  // Build metrics from health response
  const metrics: ProjectRoomMetrics = {
    queueDepth:
      typeof (healthRaw?.metrics as Record<string, unknown>)?.queue_depth === 'number'
        ? (healthRaw.metrics as Record<string, number>).queue_depth
        : 0,
    activeWorkers:
      typeof (healthRaw?.metrics as Record<string, unknown>)?.active_workers === 'number'
        ? (healthRaw.metrics as Record<string, number>).active_workers
        : 0,
    errorRatePercent:
      typeof (healthRaw?.metrics as Record<string, unknown>)?.error_rate_percent === 'number'
        ? (healthRaw.metrics as Record<string, number>).error_rate_percent
        : 0,
    activeExecutions: runs.filter((r) => r.status === 'active').length,
    pendingApprovals: governanceItems.length,
  }

  // Extract recent errors from health response
  const recentErrors: ProjectRoomSnapshot['recentErrors'] = Array.isArray(
    (healthRaw as Record<string, unknown>)?.recent_errors
  )
    ? ((healthRaw as Record<string, unknown>).recent_errors as Record<string, unknown>[])
        .slice(0, 3)
        .map((err) => ({
          message: String(err.message ?? ''),
          timestamp: String(err.timestamp ?? ''),
          source: String(err.source ?? 'Unknown'),
        }))
    : []

  const snapshot: ProjectRoomSnapshot = {
    timestamp: new Date().toISOString(),
    available,
    runs,
    artifacts,
    governanceItems,
    phaseGates,
    truthEntries,
    dependencies,
    metrics,
    recentErrors,
  }

  return NextResponse.json(snapshot)
}

// ---- Validation helpers ----

function validateGovernanceType(type: unknown): ProjectRoomGovernanceItem['type'] {
  const valid = ['phase_gate', 'truth_entry', 'artifact_review', 'decision']
  if (typeof type === 'string' && valid.includes(type)) {
    return type as ProjectRoomGovernanceItem['type']
  }
  return 'decision'
}

function validateTruthCategory(cat: unknown): ProjectRoomTruthEntry['category'] {
  const valid = ['decision', 'requirement', 'constraint', 'definition']
  if (typeof cat === 'string' && valid.includes(cat)) {
    return cat as ProjectRoomTruthEntry['category']
  }
  return 'decision'
}

function validateDepStatus(status: unknown): ProjectRoomDependency['status'] {
  const valid = ['ok', 'degraded', 'error', 'unreachable']
  if (typeof status === 'string' && valid.includes(status)) {
    return status as ProjectRoomDependency['status']
  }
  return 'unreachable'
}

function formatDependencyName(raw: string): string {
  const nameMap: Record<string, string> = {
    supabase: 'Supabase',
    inngest: 'Inngest',
    claude_api: 'Claude API',
    claude: 'Claude API',
    ollama: 'Ollama',
  }
  return nameMap[raw] ?? raw
}
```

**Design decisions in this handler:**

1. **Parallel fetching**: All four API calls (`/api/runs`, `/api/artifacts`, `/api/governance/pending`, `/api/health`) run concurrently via `Promise.all`. The maximum wall-clock time is the slowest single call (capped at 5s timeout), not the sum.

2. **Graceful degradation per endpoint**: If `/api/runs` fails but `/api/health` succeeds, the snapshot still returns with `available: true` and an empty `runs` array. Individual data domains degrade independently.

3. **Mapping layer isolation**: The `mapRun`, `mapArtifact` functions transform Project Room's internal field names (snake_case or camelCase -- the Project Room API may use either) to the Launch's types. This protects the Launch from Project Room API changes.

4. **Type-safe validation**: Every field extracted from the raw API responses passes through a validation function that returns a safe default on unexpected values. No `as` casts on raw data without prior validation.

### 4.3 Project Room Data Hook (`src/hooks/use-project-room.ts`)

TanStack Query hook for district-level data. Polls less frequently than telemetry since district content changes on a different cadence.

````ts
'use client'

import { useQuery } from '@tanstack/react-query'
import type { ProjectRoomSnapshot } from '@/lib/districts/project-room-types'

/** Default polling interval for district data (30s). */
const DISTRICT_POLL_INTERVAL = 30_000

/**
 * Fetch the Project Room district snapshot from the Launch aggregator.
 */
async function fetchProjectRoomData(): Promise<ProjectRoomSnapshot> {
  const response = await fetch('/api/districts/project-room')
  if (!response.ok) {
    throw new Error(`Project Room data fetch failed: ${response.status}`)
  }
  return response.json()
}

/**
 * useProjectRoom -- District-level data hook for the Project Room.
 *
 * Fetches runs, artifacts, governance items, dependencies, and metrics
 * from the Launch's server-side aggregator (which in turn calls the
 * Project Room API at localhost:3005).
 *
 * Polling is enabled only when the district is active (user has navigated
 * to or is viewing the Project Room district). Pass `enabled: false` to
 * suspend polling when the district is not visible.
 *
 * Polling interval is 30s (slower than the 15s telemetry cycle) because
 * district-level data (runs, artifacts, governance) changes less
 * frequently than health status.
 *
 * @param enabled - Whether to actively poll. Default: true.
 * @returns The latest ProjectRoomSnapshot, plus query state.
 *
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useProjectRoom({
 *   enabled: selectedDistrict === 'project-room',
 * })
 * ```
 */
export function useProjectRoom(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true

  const query = useQuery({
    queryKey: ['district', 'project-room'],
    queryFn: fetchProjectRoomData,
    refetchInterval: enabled ? DISTRICT_POLL_INTERVAL : false,
    refetchIntervalInBackground: false,
    enabled,
    staleTime: 15_000,
    retry: 1,
  })

  return {
    snapshot: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    /** Whether the Project Room API is reachable */
    isAvailable: query.data?.available ?? false,
    /** Shortcut: active runs for quick access */
    activeRuns:
      query.data?.runs.filter((r) => r.status === 'active' || r.status === 'pending') ?? [],
    /** Shortcut: pending governance items count */
    pendingApprovalCount: query.data?.governanceItems.length ?? 0,
  }
}
````

**Design decisions:**

1. **`enabled` parameter**: Prevents polling when the user is viewing a different district. The WS-2.1 morph choreography tracks which district is selected -- this flag is wired to that state.

2. **`staleTime: 15_000`**: Data fetched within the last 15 seconds is considered fresh. This prevents redundant fetches when the user rapidly zooms in/out of the district within a short window.

3. **`refetchIntervalInBackground: false`**: Unlike telemetry (which polls in the background for capsule updates), district data only polls when the tab is focused and the district is active.

4. **Derived accessors**: `activeRuns` and `pendingApprovalCount` are computed from the snapshot for convenience, avoiding repeated `.filter()` calls in station components.

### 4.4 Launch Station (`src/components/stations/project-room/launch-station.tsx`)

The app launcher station -- present in every district (universal station per AD-8). Shows connection status, version, and provides a one-click launch button.

````tsx
'use client'

import { useCallback } from 'react'
import { Button } from '@tarva/ui'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useDistrictsStore } from '@/stores/districts.store'
import { HealthBadge } from '@/components/telemetry/health-badge'
import type { StationProps } from '@/components/stations/types'

const PROJECT_ROOM_URL = 'http://localhost:3005'

/**
 * LaunchStation -- Universal app launcher for the Project Room district.
 *
 * Per AD-8 and IA Assessment Section 3 (Z3 Station Templates):
 * - Header: [App Icon] Project Room
 * - Body: App version, port/URL, last accessed, connection status
 * - Actions: "Open App" (primary), "Copy URL" (secondary)
 *
 * Renders inside the WS-2.6 StationPanel framework, which provides
 * the 3-zone layout, glass material, and luminous border.
 *
 * @example
 * ```tsx
 * <StationPanel district="project-room" station="launch">
 *   <LaunchStation onReceipt={handleReceipt} />
 * </StationPanel>
 * ```
 */
export function LaunchStation({ onReceipt }: StationProps) {
  const telemetry = useDistrictsStore((s) => s.districts['project-room'])
  const { copied, copy } = useCopyToClipboard()

  const handleOpenApp = useCallback(() => {
    window.open(PROJECT_ROOM_URL, '_blank', 'noopener,noreferrer')

    onReceipt?.({
      source: 'hub',
      event_type: 'action',
      severity: 'info',
      summary: 'Opened Project Room in new tab',
      detail: { url: PROJECT_ROOM_URL },
      location: {
        zoom_level: 3,
        district: 'project-room',
        station: 'launch',
      },
    })
  }, [onReceipt])

  const handleCopyUrl = useCallback(() => {
    copy(PROJECT_ROOM_URL)

    onReceipt?.({
      source: 'hub',
      event_type: 'action',
      severity: 'info',
      summary: 'Copied Project Room URL to clipboard',
      detail: { url: PROJECT_ROOM_URL },
      location: {
        zoom_level: 3,
        district: 'project-room',
        station: 'launch',
      },
    })
  }, [copy, onReceipt])

  return (
    <>
      {/* Station body */}
      <div className="flex flex-col gap-4">
        {/* Connection status */}
        <div className="flex items-center justify-between">
          <span
            className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
            style={{
              color: 'var(--color-text-tertiary)',
              opacity: 0.6,
            }}
          >
            Connection
          </span>
          {telemetry ? (
            <HealthBadge status={telemetry.status} size="sm" />
          ) : (
            <HealthBadge status="UNKNOWN" size="sm" />
          )}
        </div>

        {/* Version */}
        <div className="flex items-center justify-between">
          <span
            className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
            style={{
              color: 'var(--color-text-tertiary)',
              opacity: 0.6,
            }}
          >
            Version
          </span>
          <span
            className="font-mono text-[13px] font-normal"
            style={{
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-primary)',
              opacity: 0.8,
            }}
          >
            {telemetry?.version ?? '--'}
          </span>
        </div>

        {/* Port / URL */}
        <div className="flex items-center justify-between">
          <span
            className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
            style={{
              color: 'var(--color-text-tertiary)',
              opacity: 0.6,
            }}
          >
            Address
          </span>
          <span
            className="font-mono text-[13px] font-normal"
            style={{
              color: 'var(--color-teal-bright)',
              opacity: 0.85,
            }}
          >
            localhost:3005
          </span>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between">
          <span
            className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
            style={{
              color: 'var(--color-text-tertiary)',
              opacity: 0.6,
            }}
          >
            Uptime
          </span>
          <span
            className="font-mono text-[13px] font-normal"
            style={{
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-primary)',
              opacity: 0.8,
            }}
          >
            {telemetry?.uptime ? formatUptime(telemetry.uptime) : '--'}
          </span>
        </div>
      </div>

      {/* Station actions */}
      <div className="flex gap-2">
        <Button variant="default" size="sm" onClick={handleOpenApp} className="flex-1">
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Open App
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyUrl}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </>
  )
}

/**
 * Format uptime seconds into a human-readable string.
 * Examples: "4m", "2h 15m", "1d 6h"
 */
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600)
    const m = Math.round((seconds % 3600) / 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  const d = Math.floor(seconds / 86400)
  const h = Math.round((seconds % 86400) / 3600)
  return h > 0 ? `${d}d ${h}h` : `${d}d`
}
````

### 4.5 Status Station (`src/components/stations/project-room/status-station.tsx`)

Operational health dashboard for the Project Room. Shows dependency connections, performance metrics, and recent errors.

```tsx
'use client'

import { HealthBadge } from '@/components/telemetry/health-badge'
import { MetricCounter } from '@/components/telemetry/metric-counter'
import { TelemetrySparkline } from '@/components/telemetry/telemetry-sparkline'
import { AlertIndicator } from '@/components/telemetry/alert-indicator'
import { useDistrictsStore } from '@/stores/districts.store'
import { useProjectRoom } from '@/hooks/use-project-room'
import { ScrollArea } from '@tarva/ui'
import type { StationProps } from '@/components/stations/types'
import type { ProjectRoomDependency } from '@/lib/districts/project-room-types'

/**
 * Map Project Room dependency status to Launch AppStatus for HealthBadge.
 */
function depStatusToAppStatus(
  status: ProjectRoomDependency['status']
): 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'UNKNOWN' {
  switch (status) {
    case 'ok':
      return 'OPERATIONAL'
    case 'degraded':
      return 'DEGRADED'
    case 'error':
    case 'unreachable':
      return 'DOWN'
    default:
      return 'UNKNOWN'
  }
}

/**
 * StatusStation -- Operational health dashboard for Project Room.
 *
 * Per AD-8 and IA Assessment Section 3:
 * - Header: Project Room > Status
 * - Body: Dependency connections, performance metrics, recent errors
 * - Actions: "Refresh" (re-check), "View Full Logs" (opens Project Room)
 *
 * Consumes both the WS-1.5 telemetry data (for overall health, sparkline)
 * and the WS-2.3 district data (for dependency detail, metrics, errors).
 */
export function StatusStation({ onReceipt }: StationProps) {
  const telemetry = useDistrictsStore((s) => s.districts['project-room'])
  const { snapshot } = useProjectRoom()

  return (
    <>
      {/* Station body */}
      <ScrollArea className="max-h-[320px]">
        <div className="flex flex-col gap-5">
          {/* Overall health */}
          <div className="flex items-center justify-between">
            <span
              className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
              style={{
                color: 'var(--color-text-tertiary)',
                opacity: 0.6,
              }}
            >
              Overall Health
            </span>
            <div className="flex items-center gap-2">
              {telemetry && <HealthBadge status={telemetry.status} size="sm" />}
              {telemetry && <AlertIndicator count={telemetry.alertCount} />}
            </div>
          </div>

          {/* Response time sparkline */}
          {telemetry?.responseTimeHistory && (
            <div className="flex items-center justify-between">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.6,
                }}
              >
                Response Time
              </span>
              <div className="flex items-center gap-2">
                <MetricCounter value={telemetry.responseTimeMs} unit="ms" className="items-end" />
                <TelemetrySparkline
                  data={telemetry.responseTimeHistory}
                  width={80}
                  height={24}
                  label="Response time history"
                />
              </div>
            </div>
          )}

          {/* Dependencies */}
          {snapshot?.dependencies && snapshot.dependencies.length > 0 && (
            <div className="flex flex-col gap-2">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.6,
                }}
              >
                Dependencies
              </span>
              {snapshot.dependencies.map((dep) => (
                <div key={dep.name} className="flex items-center justify-between py-1">
                  <span
                    className="font-sans text-[13px] font-normal"
                    style={{
                      color: 'var(--color-text-primary)',
                      opacity: 0.75,
                    }}
                  >
                    {dep.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {dep.latencyMs !== null && (
                      <span
                        className="font-mono text-[11px] font-normal"
                        style={{
                          fontVariantNumeric: 'tabular-nums',
                          color: 'var(--color-text-secondary)',
                          opacity: 0.6,
                        }}
                      >
                        {dep.latencyMs}ms
                      </span>
                    )}
                    <HealthBadge status={depStatusToAppStatus(dep.status)} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Performance metrics */}
          {snapshot?.metrics && (
            <div className="grid grid-cols-2 gap-3">
              <MetricCounter value={snapshot.metrics.queueDepth} label="Queue Depth" />
              <MetricCounter value={snapshot.metrics.activeWorkers} label="Active Workers" />
              <MetricCounter
                value={snapshot.metrics.errorRatePercent}
                unit="%"
                precision={1}
                label="Error Rate"
              />
              <MetricCounter value={snapshot.metrics.activeExecutions} label="Active Runs" />
            </div>
          )}

          {/* Recent errors */}
          {snapshot?.recentErrors && snapshot.recentErrors.length > 0 && (
            <div className="flex flex-col gap-2">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{
                  color: 'var(--color-error)',
                  opacity: 0.7,
                }}
              >
                Recent Errors
              </span>
              {snapshot.recentErrors.map((err, idx) => (
                <div
                  key={`${err.timestamp}-${idx}`}
                  className="rounded-md px-2.5 py-2"
                  style={{
                    background: 'var(--color-error-dim)',
                    border: '1px solid rgba(239, 68, 68, 0.12)',
                  }}
                >
                  <p
                    className="font-sans text-[12px] leading-[1.4] font-normal"
                    style={{
                      color: 'var(--color-text-primary)',
                      opacity: 0.8,
                    }}
                  >
                    {err.message}
                  </p>
                  <p
                    className="mt-0.5 font-mono text-[10px]"
                    style={{
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--color-text-tertiary)',
                      opacity: 0.5,
                    }}
                  >
                    {err.source} -- {formatTimestamp(err.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Station actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            onReceipt?.({
              source: 'hub',
              event_type: 'action',
              severity: 'info',
              summary: 'Refreshed Project Room status',
              detail: null,
              location: {
                zoom_level: 3,
                district: 'project-room',
                station: 'status',
              },
            })
          }}
          className="flex-1 rounded-md px-3 py-1.5 font-sans text-[13px] font-medium"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--color-text-primary)',
          }}
        >
          Refresh
        </button>
      </div>
    </>
  )
}

function formatTimestamp(iso: string): string {
  if (!iso) return '--'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}
```

### 4.6 Runs Station (`src/components/stations/project-room/runs-station.tsx`)

Active executions display -- the primary "Activity" viewer for the Project Room district.

```tsx
'use client'

import { useCallback } from 'react'
import { Button, Badge, ScrollArea, Tooltip } from '@tarva/ui'
import { ExternalLink, XCircle, Clock, Zap } from 'lucide-react'
import { useProjectRoom } from '@/hooks/use-project-room'
import type { StationProps } from '@/components/stations/types'
import type { ProjectRoomRun } from '@/lib/districts/project-room-types'

/**
 * Map run status to Badge variant for visual treatment.
 */
function statusToBadgeVariant(
  status: ProjectRoomRun['status']
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default'
    case 'completed':
      return 'secondary'
    case 'failed':
      return 'destructive'
    case 'pending':
    case 'cancelled':
      return 'outline'
  }
}

/**
 * Format duration in milliseconds to a human-readable string.
 */
function formatDuration(ms: number | null): string {
  if (ms === null) return '--'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return `${m}m ${s}s`
}

/**
 * Format cost as a short USD string.
 */
function formatCost(cost: number | null): string {
  if (cost === null) return '--'
  if (cost < 0.01) return '<$0.01'
  return `$${cost.toFixed(2)}`
}

/**
 * RunsStation -- Active executions and recent completions.
 *
 * Per AD-8 and IA Assessment Section 3:
 * - Header: Project Room > Runs
 * - Body: Active runs with progress, queue, recent completions
 * - Actions: "View Run", "Cancel Run", "Open Project"
 *
 * Maps to the Launch spine "Activity" supertype (Gap 2):
 * - activity_type: 'agent_execution'
 * - Project Room uses "run" / "execution" terminology
 * - Launch normalizes to Activity at Z0/Z1; uses "execution" at Z2/Z3
 */
export function RunsStation({ onReceipt }: StationProps) {
  const { snapshot, activeRuns } = useProjectRoom()

  const handleViewRun = useCallback(
    (run: ProjectRoomRun) => {
      window.open(`http://localhost:3005/runs/${run.id}`, '_blank', 'noopener,noreferrer')

      onReceipt?.({
        source: 'hub',
        event_type: 'action',
        severity: 'info',
        summary: `Opened run "${run.projectName}" in Project Room`,
        detail: {
          run_id: run.id,
          project: run.projectName,
          agent: run.agentName,
          status: run.status,
        },
        location: {
          zoom_level: 3,
          district: 'project-room',
          station: 'runs',
        },
      })
    },
    [onReceipt]
  )

  const handleCancelRun = useCallback(
    (run: ProjectRoomRun) => {
      // Opens the run in Project Room for cancellation.
      // The Launch does not call cancellation APIs directly
      // (read-only per project constraints).
      window.open(`http://localhost:3005/runs/${run.id}`, '_blank', 'noopener,noreferrer')

      onReceipt?.({
        source: 'hub',
        event_type: 'action',
        severity: 'warning',
        summary: `Cancel requested for run "${run.projectName}" -- opening Project Room`,
        detail: {
          run_id: run.id,
          project: run.projectName,
          agent: run.agentName,
        },
        location: {
          zoom_level: 3,
          district: 'project-room',
          station: 'runs',
        },
      })
    },
    [onReceipt]
  )

  const runs = snapshot?.runs ?? []
  const completedRuns = runs.filter(
    (r) => r.status === 'completed' || r.status === 'failed' || r.status === 'cancelled'
  )

  return (
    <>
      {/* Station body */}
      <ScrollArea className="max-h-[360px]">
        <div className="flex flex-col gap-4">
          {/* Queue depth indicator */}
          {snapshot?.metrics && snapshot.metrics.queueDepth > 0 && (
            <div
              className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
              style={{
                background: 'var(--color-teal-dim)',
                border: '1px solid rgba(39, 115, 137, 0.15)',
              }}
            >
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--color-teal-bright)' }} />
              <span
                className="font-mono text-[12px] font-medium"
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--color-teal-bright)',
                }}
              >
                {snapshot.metrics.queueDepth} items queued
              </span>
            </div>
          )}

          {/* Active runs */}
          {activeRuns.length > 0 && (
            <div className="flex flex-col gap-2">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.6,
                }}
              >
                Active ({activeRuns.length})
              </span>
              {activeRuns.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                  onView={() => handleViewRun(run)}
                  onCancel={() => handleCancelRun(run)}
                  showProgress
                />
              ))}
            </div>
          )}

          {/* Empty state for active runs */}
          {activeRuns.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Zap
                className="h-5 w-5"
                style={{
                  color: 'var(--color-text-ghost)',
                  opacity: 0.4,
                }}
              />
              <span
                className="font-sans text-[12px] font-normal"
                style={{
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.6,
                }}
              >
                No active executions
              </span>
            </div>
          )}

          {/* Recent completions */}
          {completedRuns.length > 0 && (
            <div className="flex flex-col gap-2">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.6,
                }}
              >
                Recent ({completedRuns.length})
              </span>
              {completedRuns.slice(0, 5).map((run) => (
                <RunRow key={run.id} run={run} onView={() => handleViewRun(run)} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Station actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            window.open('http://localhost:3005/runs', '_blank', 'noopener,noreferrer')
          }}
        >
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          All Runs
        </Button>
      </div>
    </>
  )
}

// ---- Sub-components ----

interface RunRowProps {
  run: ProjectRoomRun
  onView: () => void
  onCancel?: () => void
  showProgress?: boolean
}

function RunRow({ run, onView, onCancel, showProgress }: RunRowProps) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-md px-2.5 py-2 transition-colors duration-150"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Top line: project + status */}
      <div className="flex items-center justify-between">
        <Tooltip content={`Agent: ${run.agentName}`}>
          <span
            className="max-w-[160px] truncate font-sans text-[13px] font-medium"
            style={{
              color: 'var(--color-text-primary)',
              opacity: 0.85,
            }}
          >
            {run.projectName}
          </span>
        </Tooltip>
        <Badge variant={statusToBadgeVariant(run.status)}>{run.status}</Badge>
      </div>

      {/* Progress bar for active runs */}
      {showProgress && run.progress !== null && (
        <div className="flex items-center gap-2">
          <div
            className="h-1 flex-1 overflow-hidden rounded-full"
            style={{ background: 'rgba(255, 255, 255, 0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(run.progress, 100)}%`,
                background: 'var(--color-ember)',
              }}
            />
          </div>
          <span
            className="font-mono text-[10px] font-medium"
            style={{
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-secondary)',
              opacity: 0.6,
            }}
          >
            {run.progress}%
          </span>
        </div>
      )}

      {/* Current phase for active runs */}
      {showProgress && run.currentPhase && (
        <span
          className="font-sans text-[11px] font-normal"
          style={{
            color: 'var(--color-text-tertiary)',
            opacity: 0.5,
          }}
        >
          {run.currentPhase}
        </span>
      )}

      {/* Bottom line: duration + cost + actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-[11px] font-normal"
            style={{
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-secondary)',
              opacity: 0.6,
            }}
          >
            {formatDuration(run.durationMs)}
          </span>
          {run.estimatedCost !== null && (
            <span
              className="font-mono text-[11px] font-normal"
              style={{
                fontVariantNumeric: 'tabular-nums',
                color: 'var(--color-teal)',
                opacity: 0.6,
              }}
            >
              {formatCost(run.estimatedCost)}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onView}
            className="rounded px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-[0.04em] uppercase transition-colors duration-150"
            style={{
              color: 'var(--color-ember-bright)',
              opacity: 0.7,
            }}
          >
            View
          </button>
          {onCancel && run.status === 'active' && (
            <button
              onClick={onCancel}
              className="rounded px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-[0.04em] uppercase transition-colors duration-150"
              style={{
                color: 'var(--color-error)',
                opacity: 0.6,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 4.7 Artifacts Station (`src/components/stations/project-room/artifacts-station.tsx`)

Recent outputs produced by Project Room executions.

```tsx
'use client'

import { useCallback } from 'react'
import { Badge, ScrollArea, Button } from '@tarva/ui'
import { ExternalLink, FileCode, FileText, Database, Settings, TestTube, File } from 'lucide-react'
import { useProjectRoom } from '@/hooks/use-project-room'
import type { StationProps } from '@/components/stations/types'
import type { ProjectRoomArtifact } from '@/lib/districts/project-room-types'

/**
 * Map artifact type to an icon component.
 */
function artifactTypeIcon(type: ProjectRoomArtifact['type']) {
  switch (type) {
    case 'code':
      return FileCode
    case 'document':
      return FileText
    case 'data':
      return Database
    case 'config':
      return Settings
    case 'test':
      return TestTube
    default:
      return File
  }
}

/**
 * ArtifactsStation -- Recent outputs and dependency graph health.
 *
 * Per AD-8 and IA Assessment Section 3:
 * - Header: Project Room > Artifacts
 * - Body: Recent artifacts with type badges, dependency graph health
 * - Actions: "Browse Artifacts" (opens Project Room artifacts page)
 *
 * Maps to the Launch spine "Artifact" supertype (Gap 2).
 */
export function ArtifactsStation({ onReceipt }: StationProps) {
  const { snapshot } = useProjectRoom()

  const handleBrowse = useCallback(() => {
    window.open('http://localhost:3005/artifacts', '_blank', 'noopener,noreferrer')

    onReceipt?.({
      source: 'hub',
      event_type: 'action',
      severity: 'info',
      summary: 'Opened Project Room artifacts browser',
      detail: null,
      location: {
        zoom_level: 3,
        district: 'project-room',
        station: 'artifacts',
      },
    })
  }, [onReceipt])

  const artifacts = snapshot?.artifacts ?? []

  return (
    <>
      {/* Station body */}
      <ScrollArea className="max-h-[320px]">
        <div className="flex flex-col gap-4">
          {/* Artifact list */}
          {artifacts.length > 0 ? (
            <div className="flex flex-col gap-2">
              {artifacts.map((artifact) => {
                const Icon = artifactTypeIcon(artifact.type)
                return (
                  <div
                    key={artifact.id}
                    className="flex items-center gap-2.5 rounded-md px-2.5 py-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{
                        color: 'var(--color-teal)',
                        opacity: 0.6,
                      }}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="truncate font-sans text-[13px] font-medium"
                          style={{
                            color: 'var(--color-text-primary)',
                            opacity: 0.85,
                          }}
                        >
                          {artifact.name}
                        </span>
                        {artifact.version && (
                          <span
                            className="font-mono text-[10px] font-normal"
                            style={{
                              fontVariantNumeric: 'tabular-nums',
                              color: 'var(--color-text-tertiary)',
                              opacity: 0.5,
                            }}
                          >
                            v{artifact.version}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{artifact.type}</Badge>
                        <span
                          className="font-sans text-[10px] font-normal"
                          style={{
                            color: 'var(--color-text-tertiary)',
                            opacity: 0.5,
                          }}
                        >
                          {artifact.creator} -- {formatRelativeTime(artifact.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <File
                className="h-5 w-5"
                style={{
                  color: 'var(--color-text-ghost)',
                  opacity: 0.4,
                }}
              />
              <span
                className="font-sans text-[12px] font-normal"
                style={{
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.6,
                }}
              >
                No recent artifacts
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Station actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleBrowse}>
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Browse Artifacts
        </Button>
      </div>
    </>
  )
}

function formatRelativeTime(iso: string): string {
  if (!iso) return '--'
  try {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const diff = now - then
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
    return `${Math.round(diff / 86_400_000)}d ago`
  } catch {
    return '--'
  }
}
```

### 4.8 Governance Station (`src/components/stations/project-room/governance-station.tsx`)

Pending approvals, phase gates, and truth governance entries. This is the only Launch station that surfaces the "Approval" concept, which the IA demoted from spine-level to app-specific.

```tsx
'use client'

import { useCallback } from 'react'
import { Badge, ScrollArea, Button, Tooltip } from '@tarva/ui'
import { ExternalLink, ShieldCheck, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { useProjectRoom } from '@/hooks/use-project-room'
import type { StationProps } from '@/components/stations/types'

/**
 * GovernanceStation -- Approvals, phase gates, and truth governance.
 *
 * Per AD-8 and IA Assessment Section 3:
 * - Header: Project Room > Governance
 * - Body: Pending approvals, phase gate status, recent truth entries
 * - Actions: "Review Item" (opens in Project Room), "Open Project"
 *
 * The "Approval" concept was demoted from spine-level to app-specific
 * per IA assessment. This station is the only place it surfaces
 * in the Launch.
 */
export function GovernanceStation({ onReceipt }: StationProps) {
  const { snapshot, pendingApprovalCount } = useProjectRoom()

  const handleReview = useCallback(
    (itemId: string, summary: string) => {
      window.open(`http://localhost:3005/governance/${itemId}`, '_blank', 'noopener,noreferrer')

      onReceipt?.({
        source: 'hub',
        event_type: 'action',
        severity: 'info',
        summary: `Opened governance review: "${summary}"`,
        detail: { item_id: itemId },
        location: {
          zoom_level: 3,
          district: 'project-room',
          station: 'governance',
        },
      })
    },
    [onReceipt]
  )

  const governanceItems = snapshot?.governanceItems ?? []
  const phaseGates = snapshot?.phaseGates ?? []
  const truthEntries = snapshot?.truthEntries ?? []

  return (
    <>
      {/* Station body */}
      <ScrollArea className="max-h-[360px]">
        <div className="flex flex-col gap-5">
          {/* Pending approvals */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.6,
                }}
              >
                Pending Approvals
              </span>
              {pendingApprovalCount > 0 && (
                <Badge variant="destructive">{pendingApprovalCount}</Badge>
              )}
            </div>

            {governanceItems.length > 0 ? (
              governanceItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 rounded-md px-2.5 py-2"
                  style={{
                    background: 'rgba(234, 179, 8, 0.04)',
                    border: '1px solid rgba(234, 179, 8, 0.10)',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="max-w-[180px] font-sans text-[13px] leading-[1.4] font-medium"
                      style={{
                        color: 'var(--color-text-primary)',
                        opacity: 0.85,
                      }}
                    >
                      {item.summary}
                    </span>
                    <Badge variant="outline">{item.type.replace('_', ' ')}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="font-sans text-[10px] font-normal"
                      style={{
                        color: 'var(--color-text-tertiary)',
                        opacity: 0.5,
                      }}
                    >
                      {item.requestedBy} -- {item.projectName}
                    </span>
                    <button
                      onClick={() => handleReview(item.id, item.summary)}
                      className="rounded px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-[0.04em] uppercase"
                      style={{
                        color: 'var(--color-ember-bright)',
                        opacity: 0.7,
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-2 py-2">
                <CheckCircle
                  className="h-3.5 w-3.5"
                  style={{
                    color: 'var(--color-healthy)',
                    opacity: 0.5,
                  }}
                />
                <span
                  className="font-sans text-[12px] font-normal"
                  style={{
                    color: 'var(--color-text-tertiary)',
                    opacity: 0.6,
                  }}
                >
                  No pending approvals
                </span>
              </div>
            )}
          </div>

          {/* Phase gates */}
          {phaseGates.length > 0 && (
            <div className="flex flex-col gap-2">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.6,
                }}
              >
                Phase Gates
              </span>
              {phaseGates.map((gate) => (
                <div
                  key={gate.id}
                  className="flex items-center justify-between rounded-md px-2.5 py-1.5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div className="flex flex-col">
                    <span
                      className="font-sans text-[13px] font-medium"
                      style={{
                        color: 'var(--color-text-primary)',
                        opacity: 0.85,
                      }}
                    >
                      {gate.phaseName}
                    </span>
                    <span
                      className="font-sans text-[10px] font-normal"
                      style={{
                        color: 'var(--color-text-tertiary)',
                        opacity: 0.5,
                      }}
                    >
                      {gate.projectName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip content={`${gate.criteriaMet} of ${gate.criteriaTotal} criteria met`}>
                      <span
                        className="font-mono text-[12px] font-medium"
                        style={{
                          fontVariantNumeric: 'tabular-nums',
                          color: gate.passed ? 'var(--color-healthy)' : 'var(--color-warning)',
                          opacity: 0.8,
                        }}
                      >
                        {gate.criteriaMet}/{gate.criteriaTotal}
                      </span>
                    </Tooltip>
                    {gate.passed ? (
                      <CheckCircle
                        className="h-3.5 w-3.5"
                        style={{
                          color: 'var(--color-healthy)',
                        }}
                      />
                    ) : (
                      <AlertTriangle
                        className="h-3.5 w-3.5"
                        style={{
                          color: 'var(--color-warning)',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent truth entries */}
          {truthEntries.length > 0 && (
            <div className="flex flex-col gap-2">
              <span
                className="font-sans text-[11px] font-semibold tracking-[0.04em] uppercase"
                style={{
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.6,
                }}
              >
                Recent Truth Entries
              </span>
              {truthEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-0.5 px-2.5 py-1.5"
                  style={{
                    borderLeft: '2px solid var(--color-teal-muted)',
                  }}
                >
                  <span
                    className="font-sans text-[12px] leading-[1.5] font-normal"
                    style={{
                      color: 'var(--color-text-primary)',
                      opacity: 0.75,
                    }}
                  >
                    {entry.content}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{entry.category}</Badge>
                    <span
                      className="font-sans text-[10px] font-normal"
                      style={{
                        color: 'var(--color-text-tertiary)',
                        opacity: 0.4,
                      }}
                    >
                      {entry.source} -- {formatRelativeTime(entry.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Station actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            window.open('http://localhost:3005/governance', '_blank', 'noopener,noreferrer')
          }}
        >
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          Open Governance
        </Button>
      </div>
    </>
  )
}

function formatRelativeTime(iso: string): string {
  if (!iso) return '--'
  try {
    const now = Date.now()
    const then = new Date(iso).getTime()
    const diff = now - then
    if (diff < 60_000) return 'just now'
    if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`
    return `${Math.round(diff / 86_400_000)}d ago`
  } catch {
    return '--'
  }
}
```

### 4.9 Station Types (`src/components/stations/types.ts`)

Shared type contract for all station components. This file is created by WS-2.6 (Station Panel Framework) but is specified here for reference since all five stations depend on it.

```ts
/**
 * Receipt data payload passed from station components to the
 * receipt system. Matches the LaunchReceipt schema from IA assessment
 * Section 5 (subset -- full schema is defined in WS-3.1).
 */
export interface ReceiptPayload {
  source: 'hub' | 'agent-builder' | 'tarva-chat' | 'project-room' | 'tarva-core' | 'tarva-erp'
  event_type: 'navigation' | 'action' | 'error' | 'approval' | 'system'
  severity: 'info' | 'warning' | 'error' | 'critical'
  summary: string
  detail: Record<string, unknown> | null
  location: {
    zoom_level: 0 | 1 | 2 | 3
    district: string | null
    station: string | null
  }
}

/**
 * Common props that all station content components receive.
 * The StationPanel wrapper (WS-2.6) injects these.
 */
export interface StationProps {
  /** Callback to emit a receipt stamp for a user action. */
  onReceipt?: (receipt: ReceiptPayload) => void
}
```

### 4.10 Station Registration (`src/components/stations/project-room/index.ts`)

Barrel export and station registry entry for the Project Room district.

```ts
export { LaunchStation } from './launch-station'
export { StatusStation } from './status-station'
export { RunsStation } from './runs-station'
export { ArtifactsStation } from './artifacts-station'
export { GovernanceStation } from './governance-station'

import type { StationDefinition } from '@/components/stations/types'

/**
 * Station definitions for the Project Room district.
 * Registered with the WS-2.6 StationTemplateRegistry.
 *
 * Order determines unfurl sequence per WS-2.1 morph choreography
 * (staggered entrance, first station appears first).
 *
 * Per AD-8: 2 universal (Launch, Status) + 3 app-specific (Runs,
 * Artifacts, Governance).
 */
export const PROJECT_ROOM_STATIONS: StationDefinition[] = [
  {
    id: 'launch',
    districtId: 'project-room',
    label: 'Launch',
    universal: true,
    order: 0,
  },
  {
    id: 'status',
    districtId: 'project-room',
    label: 'Status',
    universal: true,
    order: 1,
  },
  {
    id: 'runs',
    districtId: 'project-room',
    label: 'Runs',
    universal: false,
    order: 2,
  },
  {
    id: 'artifacts',
    districtId: 'project-room',
    label: 'Artifacts',
    universal: false,
    order: 3,
  },
  {
    id: 'governance',
    districtId: 'project-room',
    label: 'Governance',
    universal: false,
    order: 4,
  },
]
```

---

## 5. Acceptance Criteria

All criteria must pass before WS-2.3 is marked complete.

| #     | Criterion                                                                                                                                                            | Verification                                                                                                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `GET /api/districts/project-room` returns valid `ProjectRoomSnapshot` JSON                                                                                           | `curl http://localhost:3100/api/districts/project-room \| jq .` returns well-formed JSON with `timestamp`, `available`, `runs`, `artifacts`, `governanceItems`, `phaseGates`, `truthEntries`, `dependencies`, `metrics` |
| AC-2  | Route handler returns `available: true` when Project Room is running on `localhost:3005`                                                                             | Start Project Room, confirm `available` is `true` in the response                                                                                                                                                       |
| AC-3  | Route handler returns `available: false` with empty arrays when Project Room is offline                                                                              | Stop Project Room, confirm `available: false` and all arrays are empty                                                                                                                                                  |
| AC-4  | Individual endpoint failures degrade gracefully (e.g., `/api/runs` fails but `/api/health` succeeds -- snapshot still has `available: true` with empty `runs` array) | Mock a partial failure scenario; confirm no crash and correct degradation                                                                                                                                               |
| AC-5  | `useProjectRoom()` hook polls at 30s interval when enabled                                                                                                           | Mount the hook with `enabled: true`; confirm network requests occur at ~30s intervals                                                                                                                                   |
| AC-6  | `useProjectRoom()` hook does not poll when `enabled: false`                                                                                                          | Mount with `enabled: false`; confirm no network requests to `/api/districts/project-room`                                                                                                                               |
| AC-7  | Launch station renders connection status, version, address, and uptime from telemetry data                                                                           | Navigate to Project Room district Z3; confirm all four fields display correctly                                                                                                                                         |
| AC-8  | Launch station "Open App" button opens `http://localhost:3005` in a new tab and triggers receipt stamp                                                               | Click "Open App"; confirm new tab opens and receipt callback fires with correct payload                                                                                                                                 |
| AC-9  | Launch station "Copy URL" button copies URL to clipboard and triggers receipt stamp                                                                                  | Click copy button; paste in text editor to confirm; verify receipt callback fires                                                                                                                                       |
| AC-10 | Status station displays dependency connections with per-dependency status dots and latency values                                                                    | Navigate to Status station; confirm Supabase, Inngest, Claude API rows with HealthBadge and latency                                                                                                                     |
| AC-11 | Status station displays performance metrics: queue depth, active workers, error rate, active runs                                                                    | Confirm 4 MetricCounter components render with correct labels and values                                                                                                                                                |
| AC-12 | Status station displays response time sparkline using teal accent color                                                                                              | Confirm TelemetrySparkline renders with teal stroke color (not default trend colors)                                                                                                                                    |
| AC-13 | Status station renders recent errors when present, with error-dim background and formatted timestamp                                                                 | Simulate errors in Project Room health response; confirm error cards render                                                                                                                                             |
| AC-14 | Runs station displays active executions with progress bars, current phase, and status badges                                                                         | With active runs in Project Room; confirm progress bar, percentage, phase text, and status badge                                                                                                                        |
| AC-15 | Runs station displays empty state when no active executions                                                                                                          | With no active runs; confirm "No active executions" message with Zap icon                                                                                                                                               |
| AC-16 | Runs station displays recent completions (up to 5) with status badges and duration                                                                                   | Confirm completed runs table shows project name, status badge, duration, and cost                                                                                                                                       |
| AC-17 | Runs station "View" action opens the run in Project Room and triggers receipt                                                                                        | Click "View"; confirm new tab opens to `localhost:3005/runs/{id}` and receipt fires                                                                                                                                     |
| AC-18 | Runs station "Cancel" action is visible only for active runs and opens Project Room                                                                                  | Confirm "Cancel" button appears only on `active` status runs                                                                                                                                                            |
| AC-19 | Runs station queue depth indicator appears when queue is non-empty                                                                                                   | With items in queue; confirm teal-dim indicator showing count                                                                                                                                                           |
| AC-20 | Artifacts station displays recent artifacts with type icons, version, creator, and relative time                                                                     | With artifacts in Project Room; confirm icon, name, version, type badge, creator, and time                                                                                                                              |
| AC-21 | Artifacts station renders empty state when no artifacts are available                                                                                                | With no artifacts; confirm "No recent artifacts" message                                                                                                                                                                |
| AC-22 | Artifacts station "Browse Artifacts" opens `localhost:3005/artifacts` in new tab                                                                                     | Click button; confirm new tab opens; verify receipt fires                                                                                                                                                               |
| AC-23 | Governance station displays pending approvals with warning-tinted background and Review action                                                                       | With pending governance items; confirm amber-tinted cards with summary, type, and "Review" button                                                                                                                       |
| AC-24 | Governance station displays "No pending approvals" with CheckCircle when queue is empty                                                                              | With no pending items; confirm success-colored empty state                                                                                                                                                              |
| AC-25 | Governance station displays phase gates with criteria progress (met/total) and pass/fail icon                                                                        | With active phase gates; confirm progress fraction and CheckCircle/AlertTriangle icon                                                                                                                                   |
| AC-26 | Governance station displays recent truth entries with left border accent and category badge                                                                          | With truth entries; confirm teal-muted left border, content text, category badge, source                                                                                                                                |
| AC-27 | All five stations render inside the WS-2.6 StationPanel framework (3-zone layout with glass material and luminous border)                                            | Navigate to each station at Z3; confirm glass background, luminous border, header/body/actions zones                                                                                                                    |
| AC-28 | Station registration exports 5 StationDefinitions in correct unfurl order                                                                                            | Import `PROJECT_ROOM_STATIONS`; confirm 5 entries with `order` values 0-4                                                                                                                                               |
| AC-29 | All receipt payloads include correct `district: 'project-room'`, `station` name, and `zoom_level: 3`                                                                 | Trigger each action; inspect receipt payloads for correct location fields                                                                                                                                               |
| AC-30 | `pnpm typecheck` passes with zero errors after all WS-2.3 files are added                                                                                            | Run `pnpm typecheck` and confirm exit code 0                                                                                                                                                                            |
| AC-31 | All Z3 typography matches VISUAL-DESIGN-SPEC.md Section 3.2 (panel heading 16px/600, body 14px/400, table header 11px/600 uppercase, table data 13px Geist Mono)     | Visual inspection of station typography at Z3 zoom level                                                                                                                                                                |
| AC-32 | Stations honor `prefers-reduced-motion` -- no animations fire when reduced motion is preferred                                                                       | Enable reduced motion in OS settings; confirm no CSS animations in station panels                                                                                                                                       |

---

## 6. Decisions Made

| #    | Decision                                                                                                                              | Rationale                                                                                                                                                                                                                                                                                                             | Source                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| D-1  | Dedicated Route Handler for Project Room district data (`/api/districts/project-room`) rather than extending the telemetry aggregator | The telemetry aggregator (WS-1.5) is optimized for lightweight, high-frequency health checks. District data requires deeper API calls (runs, artifacts, governance) that are heavier and less frequent. Separating the routes keeps concerns clean: telemetry = health polling, district = rich data fetching.        | Separation of concerns, AD-5                      |
| D-2  | District data polling at 30s (2x slower than telemetry's 15s normal interval)                                                         | Runs, artifacts, and governance items change on a human time scale (minutes to hours), not a machine time scale (seconds). Polling at 30s avoids unnecessary load on the Project Room API while keeping data fresh enough for a monitoring dashboard.                                                                 | Engineering judgment, Project Room usage patterns |
| D-3  | All user actions open the Project Room in a new tab rather than calling mutation APIs directly                                        | The Launch is a read-only monitoring interface per project constraints ("No code changes to existing Tarva apps"). Direct mutation (e.g., calling a cancel-run API) would require the Launch to understand the Project Room's authentication, CSRF, and state management. Navigating to the app is safer and simpler. | Project constraints, combined-recommendations.md  |
| D-4  | Mapping layer between Project Room API responses and Launch types (not passing raw API data to components)                            | Project Room's API may evolve (field renames, schema changes). The mapping layer in the Route Handler isolates the Launch's frontend components from these changes. Only the mapper needs updating, not every station component.                                                                                      | Risk #12 mitigation, maintainability              |
| D-5  | Governance station uses amber/warning tinting for pending items (not red/error)                                                       | Pending approvals are not errors -- they are expected workflow states that need attention. Red would create false urgency. Amber communicates "attention needed" without "something is broken."                                                                                                                       | IA Assessment status language, Gap 3              |
| D-6  | Truth entries rendered with teal-muted left border accent (not ember)                                                                 | Truth entries are informational/data content, not interactive/action content. The visual spec assigns teal to "data visualization, telemetry labels, informational highlights" and ember to "user actions, selection, navigation."                                                                                    | VISUAL-DESIGN-SPEC.md Section 1.5                 |
| D-7  | Empty states use muted icons and tertiary text rather than hiding the section entirely                                                | Hiding empty sections would cause the station layout to shift unexpectedly between poll cycles (e.g., a run completes and the active section disappears). Stable empty states maintain spatial consistency.                                                                                                           | UI state coverage principle                       |
| D-8  | `useProjectRoom` hook returns derived accessors (`activeRuns`, `pendingApprovalCount`)                                                | These are the most frequently accessed derivations. Computing them in the hook (once per poll cycle) avoids repeated `.filter()` calls across multiple station components that consume the same data.                                                                                                                 | Performance optimization, DRY                     |
| D-9  | Import `motion/react` (not `framer-motion`) in any motion-related code                                                                | Per project constraints: the package was renamed. `framer-motion` is the legacy import path. All Launch code uses `motion/react`.                                                                                                                                                                                     | Project constraints                               |
| D-10 | Route group is `(launch)/` in all file paths, not `(hub)/`                                                                            | Per PLANNING-LOG.md item #2: Hub was renamed to Launch. The route group name was updated for consistency.                                                                                                                                                                                                             | PLANNING-LOG.md                                   |

---

## 7. Open Questions

| #    | Question                                                                                                                                                                            | Impact                                                                                                                                                                                                                                                                 | Owner                                                       | Resolution Deadline                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------ |
| OQ-1 | What are the exact API route paths for Project Room's runs, artifacts, and governance endpoints?                                                                                    | The Route Handler currently assumes `/api/runs`, `/api/artifacts`, `/api/governance/pending`. The actual paths may differ (e.g., `/api/v1/runs`, `/api/projects/{id}/runs`). The mapping layer isolates the impact, but the correct paths are needed before execution. | Project Lead (verify against `tarva-projects-app` codebase) | Before execution begins                    |
| OQ-2 | Does the Project Room `/api/health` endpoint return the health check contract shape defined in WS-1.5 (with `dependencies` and `metrics` sub-objects)?                              | If the Project Room's health response has a different structure, the Status station's dependency and metrics rendering will need adaptation. The Route Handler's mapping layer handles this, but the exact field names need confirmation.                              | Backend Engineer (WS-1.5 owner)                             | During execution                           |
| OQ-3 | Should the "Cancel Run" action call a Project Room API directly (mutation) or always navigate to the Project Room UI?                                                               | Currently spec'd as navigation-only (D-3). If direct cancellation is desired, WS-2.3 would need to add a POST/DELETE handler and handle authentication. This is a scope increase.                                                                                      | Project Lead                                                | Phase 2 planning                           |
| OQ-4 | What is the WS-2.6 StationPanel component API? This SOW assumes `<StationPanel district="..." station="...">` wrapping station content, with `onReceipt` injected by the framework. | If the framework API differs, station component props and structure may need adaptation. The `StationProps` type (Section 4.9) codifies the expected contract.                                                                                                         | React Developer (WS-2.6 owner)                              | Before or concurrent with WS-2.3 execution |
| OQ-5 | Should the Governance station surface the full Project Room dependency DAG visualization or just summary counts (valid/invalid)?                                                    | The dependency DAG is rendered via React Flow in the Project Room. Replicating it in a station panel would add significant complexity. Current spec uses summary counts only.                                                                                          | Project Lead                                                | Phase 2 planning                           |

---

## 8. Risk Register

| #   | Risk                                                                                               | Likelihood | Impact                                                              | Mitigation                                                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| R-1 | Project Room API routes do not exist or have different paths than assumed                          | Medium     | Medium -- stations show empty data until paths are corrected        | The Route Handler's `fetchProjectRoom` function handles `null` responses gracefully. If a route returns 404 or fails, that data domain shows as empty. The mapping layer can be updated with correct paths without changing station components.                                   |
| R-2 | Project Room API response shapes do not match expected field names                                 | Medium     | Low -- mapping functions handle unknown fields with safe defaults   | Every mapping function (`mapRun`, `mapArtifact`) validates each field individually and provides default values for missing or unexpected types. Console warnings are not emitted for missing optional fields to avoid noise.                                                      |
| R-3 | Project Room is frequently offline during Launch development (different dev server)                | High       | Low -- all stations degrade to empty states with `available: false` | The district is designed to be useful even when the Project Room is offline. The Launch station still shows connection status (OFFLINE via WS-1.5 telemetry), and empty states for data stations are informative, not broken.                                                     |
| R-4 | 30s polling interval is too slow for monitoring active runs with progress                          | Low        | Medium -- progress bars update infrequently, appearing stale        | The 30s interval is configurable in the hook. If real-time progress is critical, the interval can be tightened to 10s when active runs are detected (similar to WS-1.5's adaptive polling). This optimization is not in the initial implementation but is straightforward to add. |
| R-5 | Five stations exceed the visual space available at Z2/Z3                                           | Low        | Medium -- stations may overlap or require scrolling                 | The WS-2.6 station framework defines station layout geometry. If 5 stations are too many for the available space, the framework handles overflow (likely via horizontal scroll or wrapping). The station count (5) matches the IA's recommendation and AD-8 specification.        |
| R-6 | Cost data (`estimatedCost`, `tokensUsed`) may not be available from all Project Room API endpoints | Medium     | Low -- cost fields render as `--` when null                         | All cost-related fields are typed as `number                                                                                                                                                                                                                                      | null`and the`formatCost`function handles`null`gracefully. Missing cost data produces a clean`--` display, not broken UI. |
| R-7 | `@tarva/ui` component API changes between WS-2.6 and WS-2.3 execution                              | Low        | Medium -- component props may need updating                         | The SOW documents the exact `@tarva/ui` APIs used (Button, Badge, ScrollArea, Tooltip, StatusBadge). These are stable components. If APIs change, the barrel export in `@tarva/ui` will flag breaking changes at build time via TypeScript.                                       |

---

## Appendix A: File Manifest

| File                                                          | Action                            | Description                                                                                                                                                                                      |
| ------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/types/districts/project-room.ts`                         | CREATE                            | TypeScript types for ProjectRoomSnapshot, ProjectRoomRun, ProjectRoomArtifact, ProjectRoomGovernanceItem, ProjectRoomPhaseGate, ProjectRoomTruthEntry, ProjectRoomDependency, ProjectRoomMetrics |
| `src/app/api/districts/project-room/route.ts`                 | CREATE                            | Server-side aggregator fetching runs, artifacts, governance, and health from Project Room at localhost:3005                                                                                      |
| `src/hooks/use-project-room.ts`                               | CREATE                            | TanStack Query hook with 30s polling for district-level data                                                                                                                                     |
| `src/components/stations/project-room/launch-station.tsx`     | CREATE                            | Universal launch station: connection status, version, open app, copy URL                                                                                                                         |
| `src/components/stations/project-room/status-station.tsx`     | CREATE                            | Status dashboard: dependencies, metrics, sparkline, recent errors                                                                                                                                |
| `src/components/stations/project-room/runs-station.tsx`       | CREATE                            | Active executions, queue depth, recent completions with progress bars                                                                                                                            |
| `src/components/stations/project-room/artifacts-station.tsx`  | CREATE                            | Recent artifacts with type icons, version badges, relative timestamps                                                                                                                            |
| `src/components/stations/project-room/governance-station.tsx` | CREATE                            | Pending approvals, phase gates, truth entries                                                                                                                                                    |
| `src/components/stations/project-room/index.ts`               | CREATE                            | Barrel export and station registry (PROJECT_ROOM_STATIONS)                                                                                                                                       |
| `src/components/stations/types.ts`                            | CREATE (if not created by WS-2.6) | Shared StationProps, ReceiptPayload, StationDefinition types                                                                                                                                     |

## Appendix B: Execution Checklist

```
[ ] 1. Verify WS-2.6 station framework is available (StationPanel component, StationDefinition type)
[ ] 2. Verify WS-2.1 morph choreography renders district containers with staggered entrance
[ ] 3. Verify WS-1.5 telemetry components are available (HealthBadge, MetricCounter, TelemetrySparkline, AlertIndicator)
[ ] 4. Create src/types/districts/project-room.ts (Section 4.1)
[ ] 5. Create src/app/api/districts/project-room/route.ts (Section 4.2)
[ ] 6. Create src/hooks/use-project-room.ts (Section 4.3)
[ ] 7. Create src/components/stations/project-room/launch-station.tsx (Section 4.4)
[ ] 8. Create src/components/stations/project-room/status-station.tsx (Section 4.5)
[ ] 9. Create src/components/stations/project-room/runs-station.tsx (Section 4.6)
[ ] 10. Create src/components/stations/project-room/artifacts-station.tsx (Section 4.7)
[ ] 11. Create src/components/stations/project-room/governance-station.tsx (Section 4.8)
[ ] 12. Create src/components/stations/types.ts if not already created by WS-2.6 (Section 4.9)
[ ] 13. Create src/components/stations/project-room/index.ts (Section 4.10)
[ ] 14. Verify AC-1: GET /api/districts/project-room returns valid ProjectRoomSnapshot
[ ] 15. Verify AC-2: available: true when Project Room is running
[ ] 16. Verify AC-3: available: false with empty arrays when offline
[ ] 17. Verify AC-4: Partial endpoint failure degrades gracefully
[ ] 18. Verify AC-5: 30s polling interval when enabled
[ ] 19. Verify AC-6: No polling when disabled
[ ] 20. Verify AC-7: Launch station renders all four info fields
[ ] 21. Verify AC-8: Open App opens new tab + receipt
[ ] 22. Verify AC-9: Copy URL copies to clipboard + receipt
[ ] 23. Verify AC-10: Status station dependencies with dots and latency
[ ] 24. Verify AC-11: Status station 4 metric counters
[ ] 25. Verify AC-12: Sparkline with teal accent
[ ] 26. Verify AC-13: Recent errors render
[ ] 27. Verify AC-14: Runs station active executions with progress
[ ] 28. Verify AC-15: Runs station empty state
[ ] 29. Verify AC-16: Runs station completed runs
[ ] 30. Verify AC-17: View action opens run + receipt
[ ] 31. Verify AC-18: Cancel action on active runs only
[ ] 32. Verify AC-19: Queue depth indicator
[ ] 33. Verify AC-20: Artifacts with type icons and metadata
[ ] 34. Verify AC-21: Artifacts empty state
[ ] 35. Verify AC-22: Browse Artifacts opens Project Room
[ ] 36. Verify AC-23: Governance pending approvals with amber tint
[ ] 37. Verify AC-24: Governance empty state
[ ] 38. Verify AC-25: Phase gates with progress
[ ] 39. Verify AC-26: Truth entries with teal accent
[ ] 40. Verify AC-27: All stations render in StationPanel framework
[ ] 41. Verify AC-28: 5 station definitions in correct order
[ ] 42. Verify AC-29: All receipts have correct location fields
[ ] 43. Verify AC-30: pnpm typecheck passes
[ ] 44. Verify AC-31: Z3 typography matches VISUAL-DESIGN-SPEC
[ ] 45. Verify AC-32: prefers-reduced-motion honored
[ ] 46. Run pnpm lint, pnpm format:check -- both pass
[ ] 47. Commit with message: "feat: implement Project Room district stations (WS-2.3)"
```

## Appendix C: Project Room API Reference (Expected)

The following API endpoints are assumed based on TARVA-SYSTEM-OVERVIEW.md Section 3.3. Exact paths and response shapes should be verified against the `tarva-projects-app` codebase before execution.

| Endpoint                                                    | Method | Expected Response                                                                                                                                                                                                                                  | Used By                                        |
| ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `/api/health`                                               | GET    | `{ status, version, uptime, dependencies: { supabase, inngest, claude_api }, metrics: { queue_depth, active_workers, error_rate_percent }, recent_errors: [...] }`                                                                                 | Status station (dependencies, metrics, errors) |
| `/api/runs?limit=10&status=active,pending,completed,failed` | GET    | `[{ id, project_name, agent_name, status, progress, current_phase, tokens_used, estimated_cost, started_at, ended_at, duration_ms, error_summary }]`                                                                                               | Runs station                                   |
| `/api/artifacts?limit=5&sort=created_at:desc`               | GET    | `[{ id, name, type, version, creator, created_at, project_name }]`                                                                                                                                                                                 | Artifacts station                              |
| `/api/governance/pending`                                   | GET    | `{ items: [{ id, summary, type, requested_by, requested_at, waiting_since, project_name }], phaseGates: [{ id, project_name, phase_name, criteria_met, criteria_total, passed }], truthEntries: [{ id, content, category, source, created_at }] }` | Governance station                             |

## Appendix D: @tarva/ui Component API Reference

The following APIs from `@tarva/ui` are consumed by WS-2.3 station components.

**Button** (`@tarva/ui`):

- Props: `variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'`, `size?: 'default' | 'sm' | 'lg' | 'icon'`, plus standard `ButtonHTMLAttributes`
- Used in: Launch station (Open App, Copy URL), all station action bars

**Badge** (`@tarva/ui`):

- Props: `variant?: 'default' | 'secondary' | 'destructive' | 'outline'`, plus standard `HTMLDivElement` props
- Used in: Runs station (status badges), Artifacts station (type badges), Governance station (approval count, truth category)

**ScrollArea** (`@tarva/ui`):

- Props: standard scroll container with custom scrollbar styling
- Used in: Status, Runs, Artifacts, Governance stations (scrollable body zones)

**Tooltip** (`@tarva/ui`):

- Props: `content: string`, children (trigger element)
- Used in: Runs station (agent name on hover), Governance station (criteria tooltip)

**StatusBadge** (`@tarva/ui`):

- Consumed via `HealthBadge` wrapper from WS-1.5, not directly
- Used in: Launch station (connection status), Status station (overall health, dependency status)
