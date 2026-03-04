/**
 * Project Room district types.
 *
 * These types define the consolidated payload from GET /api/districts/project-room
 * and the domain-specific shapes used by the Runs, Artifacts, and Governance stations.
 *
 * Source data comes from the Project Room app at localhost:3005:
 * - GET /api/runs (execution listing)
 * - GET /api/artifacts (artifact catalog)
 * - GET /api/governance/pending (approvals, phase gates, truth entries)
 * - GET /api/health (dependency health, metrics, errors)
 *
 * References:
 * - AD-8 (Project Room stations: Runs, Artifacts, Governance)
 * - Gap #2 (Spine Object Model: Activity + Artifact supertypes)
 * - Gap #3 (5-state health model)
 * - TARVA-SYSTEM-OVERVIEW.md Section 3.3 (Project Room API surface)
 */

// ============================================================================
// Runs / Executions (Spine: Activity supertype)
// ============================================================================

/**
 * Status of an agent execution run in Project Room.
 * Maps to the Launch spine "Activity" supertype (Gap 2).
 * Project Room calls these "runs" or "executions" --
 * the Launch normalizes them as Activity with
 * activity_type: 'agent_execution'.
 */
export interface ProjectRoomRun {
  /** Run ID from Project Room's database. */
  readonly id: string
  /** Project name this run belongs to. */
  readonly projectName: string
  /** Agent name executing the run. */
  readonly agentName: string
  /** Current run status. */
  readonly status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'
  /** Progress percentage (0-100), null if not trackable. */
  readonly progress: number | null
  /** Current phase or step description, null if not available. */
  readonly currentPhase: string | null
  /** Total tokens consumed so far. */
  readonly tokensUsed: number | null
  /** Estimated cost in USD. */
  readonly estimatedCost: number | null
  /** ISO 8601 start timestamp. */
  readonly startedAt: string
  /** ISO 8601 end timestamp, null if still running. */
  readonly endedAt: string | null
  /** Duration in milliseconds, null if still running. */
  readonly durationMs: number | null
  /** Error summary if status is 'failed'. */
  readonly errorSummary: string | null
}

// ============================================================================
// Artifacts (Spine: Artifact supertype)
// ============================================================================

/**
 * An artifact produced by a Project Room execution.
 * Maps to the Launch spine "Artifact" supertype (Gap 2).
 */
export interface ProjectRoomArtifact {
  /** Artifact ID from Project Room's database. */
  readonly id: string
  /** Human-readable name. */
  readonly name: string
  /**
   * Artifact type classification.
   * Project Room tracks: code, document, data, config, test, other.
   */
  readonly type: 'code' | 'document' | 'data' | 'config' | 'test' | 'other'
  /** Semantic version string (e.g., "1.2.3"). */
  readonly version: string | null
  /** Agent or user who created this artifact. */
  readonly creator: string
  /** ISO 8601 creation timestamp. */
  readonly createdAt: string
  /** Project name this artifact belongs to. */
  readonly projectName: string
}

// ============================================================================
// Governance (App-specific, demoted from spine per IA assessment)
// ============================================================================

/**
 * A pending approval or review item in the governance system.
 * "Approval" is a demoted spine concept (IA assessment) --
 * it surfaces only in Project Room's Governance station,
 * not as a Launch-level spine object.
 */
export interface ProjectRoomGovernanceItem {
  /** Item ID from Project Room's governance schema. */
  readonly id: string
  /** Human-readable description of what needs approval. */
  readonly summary: string
  /** Type of governance action. */
  readonly type: 'phase_gate' | 'truth_entry' | 'artifact_review' | 'decision'
  /** Who or what requested this review. */
  readonly requestedBy: string
  /** ISO 8601 timestamp of when the request was created. */
  readonly requestedAt: string
  /** How long this item has been waiting (ISO 8601). */
  readonly waitingSince: string
  /** Associated project name. */
  readonly projectName: string
}

/**
 * Phase gate status for a project milestone.
 */
export interface ProjectRoomPhaseGate {
  /** Gate ID. */
  readonly id: string
  /** Project this gate belongs to. */
  readonly projectName: string
  /** Phase name (e.g., "API Integration", "Testing"). */
  readonly phaseName: string
  /** Number of criteria met. */
  readonly criteriaMet: number
  /** Total number of criteria. */
  readonly criteriaTotal: number
  /** Whether the gate is passed. */
  readonly passed: boolean
}

/**
 * A truth governance entry -- a canonical decision or requirement.
 */
export interface ProjectRoomTruthEntry {
  /** Entry ID. */
  readonly id: string
  /** The decision or requirement text. */
  readonly content: string
  /** Classification. */
  readonly category: 'decision' | 'requirement' | 'constraint' | 'definition'
  /** Source of this truth (agent, human, system). */
  readonly source: string
  /** ISO 8601 timestamp. */
  readonly createdAt: string
}

// ============================================================================
// Dependencies & Metrics
// ============================================================================

/**
 * Dependency status for a Project Room external service.
 */
export interface ProjectRoomDependency {
  /** Dependency name (e.g., 'Supabase', 'Inngest', 'Claude API'). */
  readonly name: string
  /** Connection status. */
  readonly status: 'ok' | 'degraded' | 'error' | 'unreachable'
  /** Response latency in milliseconds, null if unreachable. */
  readonly latencyMs: number | null
  /** Error message if status is not 'ok'. */
  readonly error: string | null
}

/**
 * Performance metrics snapshot for Project Room.
 */
export interface ProjectRoomMetrics {
  /** Number of items waiting in the Inngest job queue. */
  readonly queueDepth: number
  /** Number of currently active workers processing jobs. */
  readonly activeWorkers: number
  /** Error rate as a percentage (0-100) over the last minute. */
  readonly errorRatePercent: number
  /** Total active executions. */
  readonly activeExecutions: number
  /** Total pending approvals. */
  readonly pendingApprovals: number
}

// ============================================================================
// Consolidated District Payload
// ============================================================================

/**
 * Complete snapshot of Project Room data for the Launch district.
 * Returned by GET /api/districts/project-room.
 */
export interface ProjectRoomSnapshot {
  /** ISO 8601 timestamp when this snapshot was generated. */
  readonly timestamp: string
  /** Whether the Project Room API was reachable. */
  readonly available: boolean
  /** Active and recent runs (up to 10). */
  readonly runs: readonly ProjectRoomRun[]
  /** Recent artifacts (up to 5). */
  readonly artifacts: readonly ProjectRoomArtifact[]
  /** Pending governance items. */
  readonly governanceItems: readonly ProjectRoomGovernanceItem[]
  /** Phase gate status across active projects. */
  readonly phaseGates: readonly ProjectRoomPhaseGate[]
  /** Recent truth entries (up to 5). */
  readonly truthEntries: readonly ProjectRoomTruthEntry[]
  /** Dependency connection statuses. */
  readonly dependencies: readonly ProjectRoomDependency[]
  /** Aggregate performance metrics. */
  readonly metrics: ProjectRoomMetrics
  /** Recent errors (up to 3), for Status station. */
  readonly recentErrors: ReadonlyArray<{
    readonly message: string
    readonly timestamp: string
    readonly source: string
  }>
}

/**
 * Default empty snapshot used when Project Room is unreachable.
 */
export const EMPTY_PROJECT_ROOM_SNAPSHOT: ProjectRoomSnapshot = {
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
