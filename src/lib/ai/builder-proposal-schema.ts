/**
 * Zod schema for validating Claude's Builder Mode response.
 *
 * Claude returns a JSON object describing a StationTemplate.
 * This schema validates the response structure, constrains values
 * to the allowed vocabulary (bodyTypes, icon names, action variants),
 * and transforms the raw response into a typed StationTemplate.
 *
 * Safety contract: Claude can ONLY produce configurations within the
 * StationTemplate vocabulary. No arbitrary React, no executable code,
 * no script injection.
 *
 * References: WS-1.7 StationTemplate type, WS-2.6 bodyType renderers,
 * WS-3.5 template registration pattern
 */

import { z } from 'zod'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { ProposalValidationResult } from './builder-types'

// ============================================================================
// Allowed Vocabulary
// ============================================================================

/**
 * Body types that the station panel framework (WS-2.6) can render.
 * Claude MUST select from this set.
 *
 * These match the StationLayout.bodyType union from
 * src/lib/interfaces/station-template-registry.ts.
 */
const ALLOWED_BODY_TYPES = ['table', 'list', 'metrics', 'launch', 'custom'] as const

/**
 * Action button variants from @tarva/ui Button component.
 */
const ALLOWED_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive'] as const

/**
 * Subset of Lucide icon names available in the project.
 * Claude selects from this set for header icons and action icons.
 */
const ALLOWED_ICONS = [
  'Activity',
  'AlertCircle',
  'AlertOctagon',
  'AlertTriangle',
  'ArrowRight',
  'BarChart',
  'BarChart2',
  'BarChart3',
  'Bell',
  'Book',
  'Bot',
  'Bug',
  'Check',
  'CheckCircle',
  'ChevronRight',
  'Clock',
  'Code',
  'Cpu',
  'Database',
  'ExternalLink',
  'Eye',
  'FileText',
  'Filter',
  'Flame',
  'Gauge',
  'GitBranch',
  'Globe',
  'Hash',
  'Heart',
  'HelpCircle',
  'History',
  'Info',
  'Layers',
  'LayoutDashboard',
  'LineChart',
  'List',
  'Loader',
  'Lock',
  'Mail',
  'Map',
  'MessageCircle',
  'Monitor',
  'Package',
  'Pause',
  'PieChart',
  'Play',
  'Plus',
  'Power',
  'RefreshCw',
  'Rocket',
  'Search',
  'Server',
  'Settings',
  'Shield',
  'ShieldAlert',
  'Sparkles',
  'Star',
  'Table',
  'Terminal',
  'Timer',
  'TrendingDown',
  'TrendingUp',
  'Unlock',
  'Upload',
  'Users',
  'Wand2',
  'Zap',
] as const

// ============================================================================
// Zod Schemas
// ============================================================================

const stationActionSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(48),
  variant: z.enum(ALLOWED_VARIANTS).default('default'),
  command: z.string().min(1).max(256),
  icon: z.enum(ALLOWED_ICONS).optional(),
})

const stationLayoutSchema = z.object({
  header: z.object({
    title: z.string().min(1).max(48),
    icon: z.enum(ALLOWED_ICONS).optional(),
  }),
  bodyType: z.enum(ALLOWED_BODY_TYPES),
  actions: z.array(stationActionSchema).max(4).default([]),
})

const triggerConditionSchema = z.object({
  field: z.string().min(1).max(128),
  operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte', 'contains', 'exists']),
  value: z.union([z.string(), z.number(), z.boolean()]),
  weight: z.number().min(0).max(1).default(0.5),
})

/**
 * The full response schema Claude must conform to.
 * This is the JSON structure Claude returns.
 */
export const builderProposalResponseSchema = z.object({
  /** Human-readable station name. */
  name: z.string().min(1).max(48),
  /** Display name shown in the station header. */
  displayName: z.string().min(1).max(48),
  /** Description of what this station shows. */
  description: z.string().min(1).max(256),
  /** The station layout configuration. */
  layout: stationLayoutSchema,
  /** Optional trigger conditions for dynamic activation. */
  triggers: z.array(triggerConditionSchema).max(5).default([]),
  /** Priority for selection ordering (0-100). */
  priority: z.number().min(0).max(100).default(50),
  /** Reasoning for the proposed configuration. */
  reasoning: z.string().min(1).max(512),
  /** Confidence in the proposal (0.0-1.0). */
  confidence: z.number().min(0).max(1).default(0.7),
  /** Alternative approaches considered. */
  alternatives: z.array(z.string().max(256)).max(3).default([]),
})

export type BuilderProposalResponse = z.infer<typeof builderProposalResponseSchema>

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate and transform Claude's raw JSON response into a ProposalValidationResult.
 *
 * @param rawJson - The raw JSON string from Claude.
 * @param districtId - The target district selected by the user.
 * @param sessionId - The builder session ID for template ID generation.
 */
export function validateProposalResponse(
  rawJson: string,
  districtId: AppIdentifier,
  sessionId: string
): ProposalValidationResult {
  // Step 1: Parse JSON.
  let parsed: unknown
  try {
    parsed = JSON.parse(rawJson)
  } catch (error) {
    return {
      valid: false,
      template: null,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`],
      rawResponse: rawJson,
    }
  }

  // Step 2: Validate against Zod schema.
  const result = builderProposalResponseSchema.safeParse(parsed)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    return {
      valid: false,
      template: null,
      errors,
      rawResponse: rawJson,
    }
  }

  // Step 3: Transform into StationTemplate.
  const data = result.data
  const timestamp = Date.now()
  const templateId = `builder--${sanitizeName(data.name)}--${sessionId.slice(0, 8)}-${timestamp}`

  const template: StationTemplate = {
    id: templateId,
    districtId,
    name: sanitizeName(data.name),
    displayName: data.displayName,
    description: data.description,
    category: 'app-specific',
    layout: {
      header: {
        title: data.layout.header.title,
        icon: data.layout.header.icon,
      },
      bodyType: data.layout.bodyType,
      actions: data.layout.actions.map((action) => ({
        id: action.id,
        label: action.label,
        variant: action.variant,
        command: action.command,
        icon: action.icon,
      })),
    },
    triggers: data.triggers.map((trigger) => ({
      field: trigger.field,
      operator: trigger.operator,
      value: trigger.value,
      weight: trigger.weight,
    })),
    priority: data.priority,
    disposable: true, // Builder-created templates are always disposable
  }

  return {
    valid: true,
    template,
    errors: [],
    rawResponse: rawJson,
  }
}

/**
 * Sanitize a station name into a kebab-case identifier.
 */
function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

/**
 * Get the allowed vocabulary as a structured object for the Claude prompt.
 */
export function getAllowedVocabulary(): {
  bodyTypes: readonly string[]
  variants: readonly string[]
  icons: readonly string[]
  operators: readonly string[]
} {
  return {
    bodyTypes: ALLOWED_BODY_TYPES,
    variants: ALLOWED_VARIANTS,
    icons: ALLOWED_ICONS,
    operators: ['eq', 'gt', 'lt', 'gte', 'lte', 'contains', 'exists'],
  }
}
