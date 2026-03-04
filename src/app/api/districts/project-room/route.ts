/**
 * Project Room District Data Route Handler.
 *
 * GET /api/districts/project-room
 *
 * Fetches run, artifact, governance, and health data from the Project Room
 * app at localhost:3005 and returns a consolidated ProjectRoomSnapshot payload.
 *
 * Timeout: 3 seconds per upstream request.
 * Failure mode: Returns available=false with empty defaults.
 * This route provides enrichment data; health status comes from /api/telemetry.
 *
 * Design:
 * - All four API calls run in parallel via Promise.all (bounded by slowest call)
 * - Individual endpoint failures degrade gracefully (e.g., /api/runs fails but
 *   /api/health succeeds: snapshot has available=true with empty runs array)
 * - Mapping layer isolates the Launch from Project Room schema changes
 * - Every field extracted from raw responses passes through validation
 *
 * @module route
 * @see WS-2.3 Section 4.2
 */

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
} from '@/lib/project-room-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PROJECT_ROOM_BASE = 'http://localhost:3005'
const FETCH_TIMEOUT_MS = 3_000

// ============================================================================
// Fetch Utility
// ============================================================================

/**
 * Fetch JSON from a Project Room API endpoint with timeout.
 * Returns null on any failure (timeout, network error, non-200, invalid JSON).
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

// ============================================================================
// Validation Helpers
// ============================================================================

function validateRunStatus(status: unknown): ProjectRoomRun['status'] {
  const valid = ['pending', 'active', 'completed', 'failed', 'cancelled']
  if (typeof status === 'string' && valid.includes(status)) {
    return status as ProjectRoomRun['status']
  }
  return 'pending'
}

function validateArtifactType(type: unknown): ProjectRoomArtifact['type'] {
  const valid = ['code', 'document', 'data', 'config', 'test', 'other']
  if (typeof type === 'string' && valid.includes(type)) {
    return type as ProjectRoomArtifact['type']
  }
  return 'other'
}

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

// ============================================================================
// Mappers
// ============================================================================

/**
 * Map raw Project Room run data to Launch-typed ProjectRoomRun.
 * Handles both snake_case and camelCase field names from the API.
 */
function mapRun(raw: Record<string, unknown>): ProjectRoomRun {
  return {
    id: String(raw.id ?? ''),
    projectName: String(raw.project_name ?? raw.projectName ?? 'Unknown'),
    agentName: String(raw.agent_name ?? raw.agentName ?? 'Unknown'),
    status: validateRunStatus(raw.status),
    progress: typeof raw.progress === 'number' ? raw.progress : null,
    currentPhase: typeof raw.current_phase === 'string'
      ? raw.current_phase
      : typeof raw.currentPhase === 'string'
        ? raw.currentPhase
        : null,
    tokensUsed: typeof raw.tokens_used === 'number' ? raw.tokens_used : null,
    estimatedCost: typeof raw.estimated_cost === 'number' ? raw.estimated_cost : null,
    startedAt: String(raw.started_at ?? raw.startedAt ?? ''),
    endedAt: raw.ended_at ? String(raw.ended_at) : raw.endedAt ? String(raw.endedAt) : null,
    durationMs: typeof raw.duration_ms === 'number'
      ? raw.duration_ms
      : typeof raw.durationMs === 'number'
        ? raw.durationMs
        : null,
    errorSummary: typeof raw.error_summary === 'string'
      ? raw.error_summary
      : typeof raw.errorSummary === 'string'
        ? raw.errorSummary
        : null,
  }
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

// ============================================================================
// Route Handler
// ============================================================================

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
  // Parallel fetch all data sources from Project Room.
  const [runsRaw, artifactsRaw, governanceRaw, healthRaw] = await Promise.all([
    fetchWithTimeout<Record<string, unknown>[]>(
      `${PROJECT_ROOM_BASE}/api/runs?limit=10&status=active,pending,completed,failed`
    ),
    fetchWithTimeout<Record<string, unknown>[]>(
      `${PROJECT_ROOM_BASE}/api/artifacts?limit=5&sort=created_at:desc`
    ),
    fetchWithTimeout<Record<string, unknown>>(
      `${PROJECT_ROOM_BASE}/api/governance/pending`
    ),
    fetchWithTimeout<Record<string, unknown>>(
      `${PROJECT_ROOM_BASE}/api/health`
    ),
  ])

  // If health check failed, the app is likely down.
  const available = healthRaw !== null

  // Map raw responses to Launch types with safe defaults.
  const runs: ProjectRoomRun[] = Array.isArray(runsRaw) ? runsRaw.map(mapRun) : []

  const artifacts: ProjectRoomArtifact[] = Array.isArray(artifactsRaw)
    ? artifactsRaw.map(mapArtifact)
    : []

  // Governance data comes as a structured response.
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

  // Extract dependency health from the health response.
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

  // Build metrics from health response.
  const metricsRaw = healthRaw?.metrics as Record<string, unknown> | undefined
  const metrics: ProjectRoomMetrics = {
    queueDepth:
      typeof metricsRaw?.queue_depth === 'number' ? metricsRaw.queue_depth : 0,
    activeWorkers:
      typeof metricsRaw?.active_workers === 'number' ? metricsRaw.active_workers : 0,
    errorRatePercent:
      typeof metricsRaw?.error_rate_percent === 'number' ? metricsRaw.error_rate_percent : 0,
    activeExecutions: runs.filter((r) => r.status === 'active').length,
    pendingApprovals: governanceItems.length,
  }

  // Extract recent errors from health response.
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
