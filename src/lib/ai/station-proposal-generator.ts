/**
 * Station Proposal Generator -- translates natural language into StationTemplates.
 *
 * Pipeline:
 * 1. Build template catalog context (available body types, actions, icons, existing templates)
 * 2. Assemble Claude prompt with user description + catalog context + iteration history
 * 3. Call Claude via fetch to /api/ai/claude (POST) -- server-side proxy keeps API key safe
 * 4. Validate response with Zod schema (builder-proposal-schema.ts)
 * 5. Return BuilderProposal or structured error
 *
 * Safety: Claude can ONLY produce configurations within the StationTemplate vocabulary.
 * The Zod schema rejects any response that doesn't conform to allowed bodyTypes,
 * icon names, action variants, and trigger operators. No executable code is accepted.
 *
 * References: AD-7 (ai-builder-mode: Claude primary, no fallback),
 * WS-3.5 (DynamicStationTemplateRegistry), WS-4.1 (Claude provider)
 */

import type {
  StationTemplate,
  StationTemplateRegistry,
} from '@/lib/interfaces/station-template-registry'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { AppIdentifier } from '@/lib/interfaces/types'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type {
  BuilderProposal,
  BuilderIteration,
  TemplateCatalogContext,
  BodyTypeDescription,
  ActionPatternDescription,
  TemplateSummary,
  DistrictSummary,
} from './builder-types'
import { validateProposalResponse, getAllowedVocabulary } from './builder-proposal-schema'

// ============================================================================
// Configuration
// ============================================================================

export interface ProposalGeneratorConfig {
  /** Timeout for the Claude API call in milliseconds. Default: 30000 (30s). */
  readonly timeoutMs: number
  /** Maximum prompt size in estimated tokens. Default: 4000. */
  readonly maxPromptTokens: number
  /** Temperature for Claude generation. Default: 0.4 (creative but constrained). */
  readonly temperature: number
}

export const DEFAULT_GENERATOR_CONFIG: Readonly<ProposalGeneratorConfig> = {
  timeoutMs: 30_000,
  maxPromptTokens: 4_000,
  temperature: 0.4,
} as const

// ============================================================================
// Result Type
// ============================================================================

export interface ProposalGeneratorResult {
  readonly success: boolean
  readonly proposal: BuilderProposal | null
  readonly error: string | null
  /** The full prompt sent to Claude (for receipt audit trail). */
  readonly prompt: string
}

// ============================================================================
// Generator
// ============================================================================

export class StationProposalGenerator {
  private config: ProposalGeneratorConfig

  constructor(config: Partial<ProposalGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_GENERATOR_CONFIG, ...config }
  }

  /**
   * Generate a station proposal from a natural language description.
   *
   * Calls the Claude API via fetch to /api/ai/claude (POST), NOT via
   * AIRouter directly. The route handler is a server-side proxy that
   * keeps the ANTHROPIC_API_KEY safe.
   *
   * @param description - The user's natural language description of the desired station.
   * @param districtId - The target district for the proposed station.
   * @param sessionId - The builder session ID.
   * @param registry - The station template registry (for catalog context).
   * @param snapshot - The current system snapshot (for district context).
   * @param previousIterations - Previous iterations for refinement context.
   */
  async generate(
    description: string,
    districtId: AppIdentifier,
    sessionId: string,
    registry: StationTemplateRegistry,
    snapshot: SystemSnapshot,
    previousIterations: readonly BuilderIteration[] = []
  ): Promise<ProposalGeneratorResult> {
    // Step 1: Build catalog context.
    const catalogContext = this.buildCatalogContext(registry, snapshot)

    // Step 2: Assemble prompt.
    const prompt = this.assemblePrompt(description, districtId, catalogContext, previousIterations)

    // Step 3: Call Claude via fetch to /api/ai/claude.
    const startTime = performance.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs)

      const response = await fetch('/api/ai/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: prompt,
          userMessage: description,
          temperature: this.config.temperature,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const latencyMs = Math.round(performance.now() - startTime)

      if (!response.ok) {
        return {
          success: false,
          proposal: null,
          error: `Claude API returned HTTP ${response.status}.`,
          prompt,
        }
      }

      const data = (await response.json()) as {
        success: boolean
        content: string
        latencyMs: number
        modelId: string
        usage?: { inputTokens: number; outputTokens: number; estimatedCostUsd?: number }
        error?: string
      }

      if (!data.success) {
        return {
          success: false,
          proposal: null,
          error: data.error ?? 'Claude returned an unsuccessful response.',
          prompt,
        }
      }

      // Step 4: Validate response.
      // Claude's content may include markdown fences -- strip them.
      const rawContent = stripMarkdownFences(data.content)
      const validation = validateProposalResponse(rawContent, districtId, sessionId)

      if (!validation.valid) {
        return {
          success: false,
          proposal: null,
          error: `Invalid proposal: ${validation.errors.join('; ')}`,
          prompt,
        }
      }

      // Step 5: Build proposal object.
      const parsed = JSON.parse(rawContent)

      const proposal: BuilderProposal = {
        template: validation.template!,
        reasoning: parsed.reasoning ?? 'No reasoning provided.',
        confidence: parsed.confidence ?? 0.7,
        alternatives: parsed.alternatives ?? [],
        modelId: data.modelId ?? 'claude',
        latencyMs,
        prompt,
        generatedAt: new Date().toISOString(),
      }

      return {
        success: true,
        proposal,
        error: null,
        prompt,
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          success: false,
          proposal: null,
          error: `Claude API timed out after ${this.config.timeoutMs}ms.`,
          prompt,
        }
      }
      return {
        success: false,
        proposal: null,
        error: error instanceof Error ? error.message : String(error),
        prompt,
      }
    }
  }

  // --------------------------------------------------------------------------
  // Context Assembly
  // --------------------------------------------------------------------------

  /**
   * Build the template catalog context for the Claude prompt.
   * Summarizes the template vocabulary and existing templates.
   */
  private buildCatalogContext(
    registry: StationTemplateRegistry,
    snapshot: SystemSnapshot
  ): TemplateCatalogContext {
    const vocabulary = getAllowedVocabulary()

    const bodyTypes: BodyTypeDescription[] = [
      {
        type: 'table',
        description: 'Tabular data with sortable columns',
        example: 'Build pipeline runs with name, duration, status columns',
      },
      {
        type: 'list',
        description: 'Scrollable list of items with status indicators',
        example: 'Recent errors, active alerts, pending approvals',
      },
      {
        type: 'metrics',
        description: 'Key-value metric cards with sparklines',
        example: 'Uptime: 99.9%, Response Time: 45ms',
      },
      {
        type: 'launch',
        description: 'Launch-specific dashboard with quick actions and status overview',
        example: 'Quick launch panel, deployment actions, system overview',
      },
      {
        type: 'custom',
        description: 'Custom content area for specialized visualizations',
        example: 'Dependency graph, architecture diagram, custom widget',
      },
    ]

    const actionPatterns: ActionPatternDescription[] = [
      {
        pattern: 'navigate',
        description: 'Navigate to a district or station',
        variants: ['default', 'secondary'],
      },
      {
        pattern: 'open',
        description: 'Open an external app in a new tab',
        variants: ['default', 'outline'],
      },
      {
        pattern: 'action',
        description: 'Trigger a station-specific action',
        variants: ['default', 'secondary', 'destructive'],
      },
      { pattern: 'view', description: 'Switch to a detailed view', variants: ['ghost', 'outline'] },
    ]

    // Summarize existing templates per district.
    const existingTemplates: Record<AppIdentifier, TemplateSummary[]> = {} as Record<
      AppIdentifier,
      TemplateSummary[]
    >
    const allTemplates = registry.getAllTemplates()

    for (const template of allTemplates) {
      const did = template.districtId as AppIdentifier
      if (!existingTemplates[did]) {
        existingTemplates[did] = []
      }
      existingTemplates[did].push({
        id: template.id,
        displayName: template.displayName,
        bodyType: template.layout.bodyType,
        category: template.category,
      })
    }

    // Summarize available districts.
    const availableDistricts: DistrictSummary[] = Object.entries(snapshot.apps).map(
      ([id, appState]) => ({
        id: id as AppIdentifier,
        displayName: appState.displayName,
        health: appState.health,
        existingStationCount: existingTemplates[id as AppIdentifier]?.length ?? 0,
      })
    )

    return {
      bodyTypes,
      actionPatterns,
      availableIcons: [...vocabulary.icons],
      existingTemplates,
      availableDistricts,
    }
  }

  // --------------------------------------------------------------------------
  // Prompt Assembly
  // --------------------------------------------------------------------------

  /**
   * Assemble the full Claude prompt.
   */
  private assemblePrompt(
    description: string,
    districtId: AppIdentifier,
    catalog: TemplateCatalogContext,
    previousIterations: readonly BuilderIteration[]
  ): string {
    const lines: string[] = []

    // Role
    lines.push(
      'You are the Station Builder for Tarva Launch, a spatial mission-control interface.',
      'Your job is to create station template configurations based on natural language descriptions.',
      'You MUST respond with a single JSON object. No text outside the JSON.',
      ''
    )

    // Target district
    const districtName = APP_DISPLAY_NAMES[districtId] ?? districtId
    lines.push(`## Target District: ${districtName} (id: "${districtId}")`, '')

    // Existing templates in this district
    const existing = catalog.existingTemplates[districtId] ?? []
    if (existing.length > 0) {
      lines.push('### Existing Stations in This District')
      for (const t of existing) {
        lines.push(`- ${t.displayName} (${t.bodyType}, ${t.category})`)
      }
      lines.push('')
    }

    // Template vocabulary
    lines.push('## Available Body Types')
    for (const bt of catalog.bodyTypes) {
      lines.push(`- **${bt.type}**: ${bt.description}. Example: "${bt.example}"`)
    }
    lines.push('')

    lines.push('## Available Action Patterns')
    for (const ap of catalog.actionPatterns) {
      lines.push(
        `- **${ap.pattern}**: ${ap.description}. Button variants: ${ap.variants.join(', ')}`
      )
    }
    lines.push('')

    lines.push(
      '## Available Icons (Lucide)',
      `${catalog.availableIcons.slice(0, 40).join(', ')}, ... (${catalog.availableIcons.length} total)`,
      ''
    )

    // Iteration history (if any)
    if (previousIterations.length > 0) {
      lines.push('## Previous Iterations')
      for (const iter of previousIterations) {
        lines.push(`### Iteration ${iter.iterationNumber}`)
        lines.push(`Description: "${iter.description}"`)
        if (iter.proposal) {
          lines.push(
            `Result: ${iter.proposal.template.displayName} (${iter.proposal.template.layout.bodyType})`
          )
          lines.push(`Outcome: ${iter.outcome}`)
        } else if (iter.error) {
          lines.push(`Error: ${iter.error}`)
        }
        lines.push('')
      }
      lines.push(
        'The user is iterating. Improve on the previous attempt based on their new description.'
      )
      lines.push('')
    }

    // Response format
    lines.push(
      '## Required JSON Response Format',
      '',
      '```json',
      '{',
      '  "name": "kebab-case-name",',
      '  "displayName": "Human Readable Name",',
      '  "description": "What this station shows and why it is useful",',
      '  "layout": {',
      '    "header": { "title": "Station Title", "icon": "IconName" },',
      '    "bodyType": "table|list|metrics|launch|custom",',
      '    "actions": [',
      '      {',
      '        "id": "action-id",',
      '        "label": "Button Label",',
      '        "variant": "default|secondary|outline|ghost|destructive",',
      '        "command": "command string",',
      '        "icon": "IconName"',
      '      }',
      '    ]',
      '  },',
      '  "triggers": [',
      '    {',
      '      "field": "apps.<district-id>.<field>",',
      '      "operator": "eq|gt|lt|gte|lte|contains|exists",',
      '      "value": "value to compare",',
      '      "weight": 0.5',
      '    }',
      '  ],',
      '  "priority": 50,',
      '  "reasoning": "Why this configuration matches the user request",',
      '  "confidence": 0.8,',
      '  "alternatives": ["Alternative approach 1", "Alternative approach 2"]',
      '}',
      '```',
      '',
      'Rules:',
      '- bodyType MUST be one of: table, list, metrics, launch, custom',
      '- icon MUST be a valid Lucide icon name from the available list',
      '- action variant MUST be one of: default, secondary, outline, ghost, destructive',
      '- trigger field paths reference the SystemSnapshot: apps.<district-id>.health, apps.<district-id>.alertCount, etc.',
      '- Maximum 4 actions per station',
      '- Maximum 5 trigger conditions',
      '- Keep displayName under 48 characters',
      '- Keep description under 256 characters',
      '- Set confidence based on how well the description maps to template vocabulary',
      '- If the description is ambiguous, set confidence < 0.6 and suggest alternatives',
      ''
    )

    // User description (the actual input)
    lines.push(
      '## User Description',
      '',
      `"${description}"`,
      '',
      'Generate the station template JSON now.'
    )

    return lines.join('\n')
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Strip markdown code fences from Claude's response.
 * Claude sometimes wraps JSON in ```json ... ``` fences despite being told not to.
 */
function stripMarkdownFences(content: string): string {
  const trimmed = content.trim()
  // Match ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }
  return trimmed
}
