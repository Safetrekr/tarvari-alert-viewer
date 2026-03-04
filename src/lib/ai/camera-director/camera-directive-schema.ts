/**
 * Camera Directive Schema -- Zod validation for AI-generated directives.
 *
 * Validates Ollama JSON responses into typed CameraDirective objects.
 * Handles malformed responses gracefully with best-effort parsing.
 *
 * The response format instruction is exported for the context assembler
 * to append to system prompts, constraining Ollama output to valid JSON.
 *
 * References:
 * - AD-7 (AI Integration Architecture)
 * - WS-1.7 CameraDirective / CameraTarget types
 * - tech-decisions.md (camera-director-nl: Ollama primary)
 *
 * @module camera-directive-schema
 * @see WS-3.4 Section 4.7
 */

import { z } from 'zod'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { CameraDirective, CameraTarget } from '@/lib/interfaces/camera-controller'
import { ALL_APP_IDS } from '@/lib/interfaces/types'

// ============================================================================
// Raw Ollama Response Schema
// ============================================================================

/**
 * Schema for the raw JSON that Ollama returns.
 * The LLM is instructed to return this exact shape.
 * We validate loosely and then map to CameraDirective.
 */
export const ollamaCameraResponseSchema = z.object({
  /** Navigation type. */
  type: z.enum(['flyTo', 'zoom', 'home', 'constellation']),
  /** Target district ID for flyTo. Null for home/constellation. */
  target: z.string().nullable().optional(),
  /** Target zoom level for zoom type. */
  zoom: z.number().min(0.08).max(3.0).nullable().optional(),
  /** Confidence score 0.0-1.0. */
  confidence: z.number().min(0).max(1),
  /** AI reasoning for the navigation decision. */
  reasoning: z.string(),
  /** Districts to highlight (visually emphasize). */
  highlights: z.array(z.string()).optional(),
  /** Districts to dim (visually de-emphasize). */
  fades: z.array(z.string()).optional(),
  /** Alternative targets considered. */
  alternatives: z.array(z.object({
    target: z.string(),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
  })).optional(),
})

/** Validated shape from Ollama. */
export type OllamaCameraResponse = z.infer<typeof ollamaCameraResponseSchema>

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate that a string is a known AppIdentifier.
 */
function isValidAppId(id: string): id is AppIdentifier {
  return (ALL_APP_IDS as readonly string[]).includes(id)
}

/**
 * Filter an array of strings to only valid AppIdentifiers.
 */
function filterValidAppIds(ids: readonly string[] | undefined): AppIdentifier[] {
  if (!ids) return []
  return ids.filter(isValidAppId)
}

// ============================================================================
// Parse and Validate
// ============================================================================

/** Result of validating an Ollama response. */
export interface DirectiveValidationResult {
  /** Whether validation succeeded. */
  readonly success: boolean
  /** The validated CameraDirective, if successful. */
  readonly directive: CameraDirective | null
  /** Confidence from the AI response. */
  readonly confidence: number
  /** AI reasoning string. */
  readonly reasoning: string
  /** Alternative targets considered. */
  readonly alternatives: readonly { target: string; confidence: number; reason: string }[]
  /** Validation error message, if failed. */
  readonly error?: string
}

/**
 * Validate raw JSON from Ollama into a CameraDirective.
 *
 * Handles:
 * - Valid JSON that matches the schema exactly
 * - Partially valid JSON (best-effort extraction)
 * - Invalid JSON (returns error result)
 *
 * @param rawJson - The parsed JSON object from Ollama's response.
 * @returns Validation result with directive or error.
 */
export function validateCameraDirective(
  rawJson: unknown,
): DirectiveValidationResult {
  const parsed = ollamaCameraResponseSchema.safeParse(rawJson)

  if (!parsed.success) {
    // Attempt best-effort extraction from raw data
    return attemptBestEffortParse(rawJson)
  }

  const data = parsed.data
  const target = resolveTarget(data)

  if (!target) {
    return {
      success: false,
      directive: null,
      confidence: data.confidence,
      reasoning: data.reasoning,
      alternatives: data.alternatives ?? [],
      error: `Could not resolve target for type "${data.type}" with target "${data.target ?? 'none'}"`,
    }
  }

  const directive: CameraDirective = {
    target,
    highlights: filterValidAppIds(data.highlights),
    fades: filterValidAppIds(data.fades),
    narration: data.reasoning,
    source: 'ai',
  }

  return {
    success: true,
    directive,
    confidence: data.confidence,
    reasoning: data.reasoning,
    alternatives: data.alternatives ?? [],
  }
}

/**
 * Resolve the OllamaCameraResponse type + target into a CameraTarget.
 */
function resolveTarget(data: OllamaCameraResponse): CameraTarget | null {
  switch (data.type) {
    case 'flyTo': {
      if (!data.target) return null
      if (!isValidAppId(data.target)) return null
      return { type: 'district', districtId: data.target }
    }
    case 'zoom': {
      // Zoom to a specific level -- navigate to current position at new zoom
      const zoomLevel = data.zoom ?? 0.5
      return {
        type: 'position',
        position: { offsetX: 0, offsetY: 0, zoom: zoomLevel },
      }
    }
    case 'home':
      return { type: 'home' }
    case 'constellation':
      return { type: 'constellation' }
    default:
      return null
  }
}

/**
 * Attempt best-effort parsing when Zod validation fails.
 * Extracts whatever useful data is available from the raw response.
 */
function attemptBestEffortParse(
  rawJson: unknown,
): DirectiveValidationResult {
  if (!rawJson || typeof rawJson !== 'object') {
    return {
      success: false,
      directive: null,
      confidence: 0,
      reasoning: 'Invalid response: not a JSON object.',
      alternatives: [],
      error: 'Ollama response is not a valid JSON object.',
    }
  }

  const obj = rawJson as Record<string, unknown>

  // Try to extract type
  const type = typeof obj.type === 'string' ? obj.type : null
  const target = typeof obj.target === 'string' ? obj.target : null
  const confidence = typeof obj.confidence === 'number' ? Math.max(0, Math.min(1, obj.confidence)) : 0.3
  const reasoning = typeof obj.reasoning === 'string' ? obj.reasoning : 'AI response partially parsed.'

  if (type === 'home') {
    return {
      success: true,
      directive: { target: { type: 'home' }, source: 'ai', narration: reasoning },
      confidence,
      reasoning,
      alternatives: [],
    }
  }

  if (type === 'constellation') {
    return {
      success: true,
      directive: { target: { type: 'constellation' }, source: 'ai', narration: reasoning },
      confidence,
      reasoning,
      alternatives: [],
    }
  }

  if ((type === 'flyTo' || type === 'navigate') && target && isValidAppId(target)) {
    return {
      success: true,
      directive: {
        target: { type: 'district', districtId: target },
        highlights: [target],
        source: 'ai',
        narration: reasoning,
      },
      confidence,
      reasoning,
      alternatives: [],
    }
  }

  return {
    success: false,
    directive: null,
    confidence: 0,
    reasoning,
    alternatives: [],
    error: `Could not extract valid directive from response. Type: "${String(type)}", Target: "${String(target)}"`,
  }
}

// ============================================================================
// Response Format Instruction (for system prompt)
// ============================================================================

/**
 * JSON format instruction appended to the system prompt.
 * Constrains Ollama to output valid CameraDirective JSON.
 */
export const CAMERA_DIRECTIVE_FORMAT_INSTRUCTION = `
You MUST respond with a single JSON object (no markdown, no text outside the JSON). The JSON must match this exact schema:

{
  "type": "flyTo" | "home" | "constellation" | "zoom",
  "target": "<district-id>" | null,
  "zoom": <number 0.08-3.0> | null,
  "confidence": <number 0.0-1.0>,
  "reasoning": "<explanation of why this navigation was chosen>",
  "highlights": ["<district-id>", ...] | [],
  "fades": ["<district-id>", ...] | [],
  "alternatives": [{"target": "<district-id>", "confidence": <number>, "reason": "<why this was considered>"}]
}

Valid district IDs: "agent-builder", "tarva-chat", "project-room", "tarva-core", "tarva-erp", "tarva-code"

Type meanings:
- "flyTo": Navigate to a specific district. Requires "target" to be a valid district ID.
- "home": Return to the Launch Atrium center view.
- "constellation": Zoom out to see all districts at once.
- "zoom": Change zoom level. Requires "zoom" to be a number.

Rules:
- "confidence" must be between 0.0 and 1.0
- "reasoning" must explain WHY you chose this target
- Include "alternatives" if other districts were plausible targets
- "highlights" should list districts to visually emphasize
- "fades" should list districts to visually dim
`.trim()
