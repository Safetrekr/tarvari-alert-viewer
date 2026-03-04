/**
 * StationTemplateRegistry -- Station catalog API.
 *
 * Phase 1: StaticStationTemplateRegistry with hardcoded stations per AD-8.
 * Phase 3: DynamicStationTemplateRegistry with rule-based scoring + AI tie-breaking.
 *
 * Station templates define WHAT a station displays and WHICH actions it offers.
 * They do NOT contain React components -- the rendering is handled by station
 * component implementations in WS-2.x that consume these templates as configuration.
 *
 * References: AD-7 interface #4, AD-8 (Station Content per District),
 * IA Assessment Sections 1-2 (Station Panel Framework)
 */

import type { AppIdentifier } from './types'
import type { SystemSnapshot } from './system-state-provider'

// ============================================================================
// Station Action
// ============================================================================

/** An action button rendered in a station's footer zone. */
export interface StationAction {
  /** Unique action identifier within the station. */
  readonly id: string
  /** Button label text. */
  readonly label: string
  /** Visual variant per @tarva/ui Button component. */
  readonly variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  /**
   * Command string to execute via CommandPalette when clicked.
   * Example: "open agent-builder", "refresh health-checks"
   */
  readonly command: string
  /** Optional icon name from Lucide. */
  readonly icon?: string
}

// ============================================================================
// Station Layout
// ============================================================================

/**
 * Describes the 3-zone layout of a station panel.
 * Per IA Assessment Z3: Header / Body / Actions.
 */
export interface StationLayout {
  /** Header zone: station title and parent context. */
  readonly header: {
    /** Station title displayed in the header. */
    readonly title: string
    /** Optional Lucide icon name. */
    readonly icon?: string
  }
  /**
   * Body zone content type. Determines which React component renders the body.
   * 'table': data table with columns (runs, artifacts, conversations)
   * 'list': vertical list of items (dependencies, alerts, errors)
   * 'metrics': key-value metric display (status dashboard)
   * 'launch': app launch panel (URL, version, launch button)
   * 'custom': custom component (for app-specific rendering)
   */
  readonly bodyType: 'table' | 'list' | 'metrics' | 'launch' | 'custom'
  /** Action buttons in the footer zone. 1-3 buttons. */
  readonly actions: readonly StationAction[]
}

// ============================================================================
// Trigger Condition (Phase 3: Dynamic Selection)
// ============================================================================

/**
 * A condition evaluated against the SystemSnapshot to determine
 * whether a station template should be activated.
 *
 * Phase 1: Triggers are defined but not evaluated (static selection).
 * Phase 3: Rule engine evaluates triggers; AI breaks ties.
 */
export interface TriggerCondition {
  /**
   * Dot-path into SystemSnapshot.
   * Examples:
   * - "apps.agent-builder.alertCount"
   * - "apps.project-room.health"
   * - "globalMetrics.activeWork"
   */
  readonly field: string
  /** Comparison operator. */
  readonly operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'exists'
  /** Value to compare against. Type must match the field's runtime type. */
  readonly value: unknown
  /** Weight contribution to the template's activation score. 0.0-1.0. */
  readonly weight: number
}

// ============================================================================
// Station Template
// ============================================================================

/**
 * A station template defines a station's identity, layout, and activation rules.
 *
 * Templates are configuration, not components. The rendering layer (WS-2.x)
 * reads templates and maps bodyType to the appropriate React component.
 */
export interface StationTemplate {
  /** Unique template identifier (e.g., "agent-builder--pipeline"). */
  readonly id: string
  /**
   * Which district this template belongs to.
   * '*' for universal templates that appear in every district.
   */
  readonly districtId: AppIdentifier | '*'
  /** Machine-readable station name (e.g., "pipeline", "status", "launch"). */
  readonly name: string
  /** Human-readable display name (e.g., "Pipeline", "Status", "Launch"). */
  readonly displayName: string
  /** Brief description for tooltips and the template browser. */
  readonly description: string
  /** Whether this is a universal station or app-specific. */
  readonly category: 'universal' | 'app-specific'
  /** The 3-zone layout definition. */
  readonly layout: StationLayout
  /**
   * Conditions for dynamic activation (Phase 3).
   * Empty array in Phase 1 (all templates are statically assigned).
   */
  readonly triggers: readonly TriggerCondition[]
  /**
   * Selection priority. Higher = selected first when multiple templates
   * compete for the same slot. Default: 0.
   */
  readonly priority: number
  /**
   * Whether this is a disposable (AI-generated) station.
   * Phase 1: always false. Phase 3: true for AI-selected templates.
   */
  readonly disposable: boolean
}

// ============================================================================
// StationTemplateRegistry Interface
// ============================================================================

export interface StationTemplateRegistry {
  /**
   * Get all station templates for a district, ordered by priority descending.
   *
   * In Phase 1: returns the static set (2 universal + N app-specific).
   * In Phase 3: evaluates triggers against context, returns scored/ranked set.
   *
   * @param districtId - The district to get templates for.
   * @param context - Optional SystemSnapshot for dynamic scoring (Phase 3).
   */
  getTemplatesForDistrict(
    districtId: AppIdentifier,
    context?: SystemSnapshot
  ): readonly StationTemplate[]

  /** Get a single template by its unique ID. */
  getTemplate(templateId: string): StationTemplate | null

  /** Get all registered templates across all districts. */
  getAllTemplates(): readonly StationTemplate[]

  /**
   * Register a new template. Used in Phase 3 for dynamic templates.
   * Phase 1 pre-populates all templates in the constructor.
   */
  registerTemplate(template: StationTemplate): void

  /**
   * Remove a template by ID. Used for disposable station cleanup.
   * Returns true if the template was found and removed.
   */
  removeTemplate(templateId: string): boolean

  /**
   * Evaluate trigger conditions against a SystemSnapshot and return a score.
   * Score is 0.0-1.0 where 1.0 means all conditions matched with full weight.
   *
   * Phase 1: returns 0 (no triggers evaluated).
   * Phase 3: rule engine computes weighted score.
   */
  evaluateTriggers(conditions: readonly TriggerCondition[], context: SystemSnapshot): number
}

// ============================================================================
// Phase 1 Implementation: StaticStationTemplateRegistry
// ============================================================================

/**
 * Phase 1 StationTemplateRegistry. Contains the complete station catalog
 * from AD-8, hardcoded.
 *
 * Station list per AD-8:
 * - Universal: Launch, Status (every district)
 * - Agent Builder: Pipeline, Library
 * - Tarva Chat: Conversations, Agents
 * - Project Room: Runs, Artifacts, Governance
 * - TarvaCORE: Sessions
 * - TarvaERP: Manufacturing (placeholder)
 * - tarvaCODE: (stub only -- universal stations)
 */
export class StaticStationTemplateRegistry implements StationTemplateRegistry {
  private templates: Map<string, StationTemplate> = new Map()

  constructor() {
    this.registerDefaults()
  }

  getTemplatesForDistrict(
    districtId: AppIdentifier,
    _context?: SystemSnapshot
  ): readonly StationTemplate[] {
    const results: StationTemplate[] = []

    for (const template of this.templates.values()) {
      if (template.districtId === '*' || template.districtId === districtId) {
        results.push(template)
      }
    }

    // Sort by priority descending, then by category (universal first).
    return results.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === 'universal' ? -1 : 1
      }
      return b.priority - a.priority
    })
  }

  getTemplate(templateId: string): StationTemplate | null {
    return this.templates.get(templateId) ?? null
  }

  getAllTemplates(): readonly StationTemplate[] {
    return Array.from(this.templates.values())
  }

  registerTemplate(template: StationTemplate): void {
    this.templates.set(template.id, template)
  }

  removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId)
  }

  evaluateTriggers(_conditions: readonly TriggerCondition[], _context: SystemSnapshot): number {
    // Phase 1: no trigger evaluation. Always returns 0.
    return 0
  }

  // --------------------------------------------------------------------------
  // Default Station Templates (AD-8)
  // --------------------------------------------------------------------------

  private registerDefaults(): void {
    // --- Universal Stations ---

    this.registerTemplate({
      id: 'universal--launch',
      districtId: '*',
      name: 'launch',
      displayName: 'Launch',
      description: 'Open the application in a new browser tab.',
      category: 'universal',
      layout: {
        header: { title: 'Launch', icon: 'ExternalLink' },
        bodyType: 'launch',
        actions: [
          {
            id: 'open-app',
            label: 'Open App',
            variant: 'default',
            command: 'open ${districtId}',
            icon: 'ExternalLink',
          },
          {
            id: 'copy-url',
            label: 'Copy URL',
            variant: 'secondary',
            command: 'copy-url ${districtId}',
            icon: 'Copy',
          },
        ],
      },
      triggers: [],
      priority: 100,
      disposable: false,
    })

    this.registerTemplate({
      id: 'universal--status',
      districtId: '*',
      name: 'status',
      displayName: 'Status',
      description: 'Operational health dashboard with dependency status and recent errors.',
      category: 'universal',
      layout: {
        header: { title: 'Status', icon: 'Activity' },
        bodyType: 'metrics',
        actions: [
          {
            id: 'refresh',
            label: 'Refresh',
            variant: 'default',
            command: 'refresh health-checks',
            icon: 'RefreshCw',
          },
          {
            id: 'view-logs',
            label: 'View Full Logs',
            variant: 'secondary',
            command: 'open ${districtId}',
            icon: 'FileText',
          },
        ],
      },
      triggers: [],
      priority: 90,
      disposable: false,
    })

    // --- Agent Builder Stations ---

    this.registerTemplate({
      id: 'agent-builder--pipeline',
      districtId: 'agent-builder',
      name: 'pipeline',
      displayName: 'Pipeline',
      description: 'Active generation run progress and recent runs.',
      category: 'app-specific',
      layout: {
        header: { title: 'Pipeline', icon: 'GitBranch' },
        bodyType: 'table',
        actions: [
          {
            id: 'view-run',
            label: 'View Run Details',
            variant: 'default',
            command: 'show run ${runId}',
            icon: 'Eye',
          },
          {
            id: 'cancel-run',
            label: 'Cancel Run',
            variant: 'destructive',
            command: 'cancel run ${runId}',
            icon: 'XCircle',
          },
        ],
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    this.registerTemplate({
      id: 'agent-builder--library',
      districtId: 'agent-builder',
      name: 'library',
      displayName: 'Library',
      description: 'Agent count, recent publishes, and skill maturity breakdown.',
      category: 'app-specific',
      layout: {
        header: { title: 'Library', icon: 'Library' },
        bodyType: 'list',
        actions: [
          {
            id: 'browse-library',
            label: 'Browse Library',
            variant: 'default',
            command: 'open agent-builder',
            icon: 'BookOpen',
          },
        ],
      },
      triggers: [],
      priority: 40,
      disposable: false,
    })

    // --- Tarva Chat Stations ---

    this.registerTemplate({
      id: 'tarva-chat--conversations',
      districtId: 'tarva-chat',
      name: 'conversations',
      displayName: 'Conversations',
      description: 'Active conversations sorted by last activity.',
      category: 'app-specific',
      layout: {
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
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    this.registerTemplate({
      id: 'tarva-chat--agents',
      districtId: 'tarva-chat',
      name: 'agents',
      displayName: 'Agents',
      description: 'Loaded agent count and most-used agents.',
      category: 'app-specific',
      layout: {
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
      },
      triggers: [],
      priority: 40,
      disposable: false,
    })

    // --- Project Room Stations ---

    this.registerTemplate({
      id: 'project-room--runs',
      districtId: 'project-room',
      name: 'runs',
      displayName: 'Runs',
      description: 'Active executions, queue depth, and recent completions.',
      category: 'app-specific',
      layout: {
        header: { title: 'Runs', icon: 'Play' },
        bodyType: 'table',
        actions: [
          {
            id: 'view-run',
            label: 'View Run',
            variant: 'default',
            command: 'show run ${runId}',
            icon: 'Eye',
          },
          {
            id: 'cancel-run',
            label: 'Cancel Run',
            variant: 'destructive',
            command: 'cancel run ${runId}',
            icon: 'XCircle',
          },
          {
            id: 'open-project',
            label: 'Open Project',
            variant: 'secondary',
            command: 'open project-room',
            icon: 'ExternalLink',
          },
        ],
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    this.registerTemplate({
      id: 'project-room--artifacts',
      districtId: 'project-room',
      name: 'artifacts',
      displayName: 'Artifacts',
      description: 'Recent artifacts and dependency graph health.',
      category: 'app-specific',
      layout: {
        header: { title: 'Artifacts', icon: 'Package' },
        bodyType: 'table',
        actions: [
          {
            id: 'browse-artifacts',
            label: 'Browse Artifacts',
            variant: 'default',
            command: 'open project-room',
            icon: 'FolderOpen',
          },
        ],
      },
      triggers: [],
      priority: 40,
      disposable: false,
    })

    this.registerTemplate({
      id: 'project-room--governance',
      districtId: 'project-room',
      name: 'governance',
      displayName: 'Governance',
      description: 'Pending approvals, phase gate status, and recent truth entries.',
      category: 'app-specific',
      layout: {
        header: { title: 'Governance', icon: 'Shield' },
        bodyType: 'list',
        actions: [
          {
            id: 'review-item',
            label: 'Review Item',
            variant: 'default',
            command: 'open project-room',
            icon: 'CheckCircle',
          },
          {
            id: 'open-project',
            label: 'Open Project',
            variant: 'secondary',
            command: 'open project-room',
            icon: 'ExternalLink',
          },
        ],
      },
      triggers: [],
      priority: 30,
      disposable: false,
    })

    // --- TarvaCORE Stations ---

    this.registerTemplate({
      id: 'tarva-core--sessions',
      districtId: 'tarva-core',
      name: 'sessions',
      displayName: 'Sessions',
      description: 'Recent reasoning sessions. Fallback: "No session telemetry available."',
      category: 'app-specific',
      layout: {
        header: { title: 'Sessions', icon: 'Brain' },
        bodyType: 'list',
        actions: [],
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    // --- TarvaERP Stations ---

    this.registerTemplate({
      id: 'tarva-erp--manufacturing',
      districtId: 'tarva-erp',
      name: 'manufacturing',
      displayName: 'Manufacturing',
      description: 'Manufacturing dashboard placeholder.',
      category: 'app-specific',
      layout: {
        header: { title: 'Manufacturing', icon: 'Factory' },
        bodyType: 'metrics',
        actions: [],
      },
      triggers: [],
      priority: 50,
      disposable: false,
    })

    // Note: tarvaCODE has no app-specific stations (stub district).
    // It receives only the universal Launch and Status stations.
  }
}
