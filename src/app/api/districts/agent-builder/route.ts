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
} from '@/lib/agent-builder-types'

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
        status: run.status as PipelineRun['status'],
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
