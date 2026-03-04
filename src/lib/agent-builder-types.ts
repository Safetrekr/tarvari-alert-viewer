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
