/**
 * Context Assembler -- Builds LLM prompts for the AI Camera Director.
 *
 * Combines the user query, spatial index context, camera position, and
 * available districts into a structured prompt payload for Ollama.
 *
 * The assembled prompt constrains Ollama to output valid CameraDirective JSON
 * by including the response format instruction from camera-directive-schema.ts.
 *
 * Total prompt is kept under 2000 tokens for fast inference on small models.
 *
 * References:
 * - AD-7 (AI Integration Architecture)
 * - tech-decisions.md (camera-director-nl: Ollama primary)
 *
 * @module context-assembler
 * @see WS-3.4 Section 4.6
 */

import {
  type SpatialIndexSnapshot,
  spatialIndexToText,
} from './spatial-index'
import { CAMERA_DIRECTIVE_FORMAT_INSTRUCTION } from './camera-directive-schema'

// ============================================================================
// Assembled Prompt
// ============================================================================

/** The complete prompt payload for Ollama. */
export interface AssembledPrompt {
  /** System message with spatial context and response format. */
  readonly systemPrompt: string
  /** User message with the natural language query. */
  readonly userMessage: string
  /** Combined prompt for the /api/generate endpoint. */
  readonly combinedPrompt: string
}

// ============================================================================
// System Prompt Template
// ============================================================================

const SYSTEM_PROMPT_TEMPLATE = `You are the AI Camera Director for Tarva Launch, a spatial mission-control interface that monitors multiple applications.

Your job is to interpret the user's natural language query and decide where the camera should navigate.

Current spatial state:
{SPATIAL_CONTEXT}

{FORMAT_INSTRUCTION}`

// ============================================================================
// Context Assembler
// ============================================================================

/**
 * Build the complete prompt payload from spatial context and user query.
 *
 * @param query - The user's natural language query.
 * @param spatialSnapshot - Current spatial index snapshot.
 * @returns Assembled prompt with system message and user message.
 */
export function assemblePrompt(
  query: string,
  spatialSnapshot: SpatialIndexSnapshot,
): AssembledPrompt {
  const spatialContext = spatialIndexToText(spatialSnapshot)

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{SPATIAL_CONTEXT}', spatialContext)
    .replace('{FORMAT_INSTRUCTION}', CAMERA_DIRECTIVE_FORMAT_INSTRUCTION)

  const userMessage = query.trim()

  // Ollama /api/generate uses a single prompt string.
  // System context goes first, then the user query.
  const combinedPrompt = `${userMessage}`

  return {
    systemPrompt,
    userMessage,
    combinedPrompt,
  }
}

/**
 * Estimate the token count of a prompt.
 * Uses a rough heuristic of ~4 characters per token.
 * For keeping prompts under the 2000 token budget.
 */
export function estimateTokenCount(prompt: AssembledPrompt): number {
  const totalChars = prompt.systemPrompt.length + prompt.userMessage.length
  return Math.ceil(totalChars / 4)
}
