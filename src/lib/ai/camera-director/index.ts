/**
 * AI Camera Director -- barrel export.
 *
 * Three-layer intelligence model for natural language camera navigation:
 * 1. Pattern Matcher (instant, <1ms)
 * 2. Spatial Index + Context Assembler (prompt construction)
 * 3. Ollama LLM (3-10s, via /api/ai/chat route handler)
 *
 * @module camera-director
 * @see WS-3.4
 */

// Camera Director orchestrator
export { CameraDirector } from './camera-director'
export type { CameraDirectorResult, DisambiguationOption } from './camera-director'

// Pattern Matcher (Layer 1)
export { PatternMatcherProvider } from './pattern-matcher-provider'
export type {
  PatternMatchResult,
  PatternMatchContext,
  DriftGuess,
} from './pattern-matcher-provider'

// Spatial Index
export { buildSpatialIndex, spatialIndexToText } from './spatial-index'
export type {
  SpatialEntity,
  SpatialIndexSnapshot,
  CameraContext,
  DistrictTelemetryInput,
  CameraStateInput,
} from './spatial-index'

// Context Assembler
export { assemblePrompt, estimateTokenCount } from './context-assembler'
export type { AssembledPrompt } from './context-assembler'

// Camera Directive Schema (Zod validation)
export {
  ollamaCameraResponseSchema,
  validateCameraDirective,
  CAMERA_DIRECTIVE_FORMAT_INSTRUCTION,
} from './camera-directive-schema'
export type {
  OllamaCameraResponse,
  DirectiveValidationResult,
} from './camera-directive-schema'

// Ollama Provider (Layer 3)
export { queryOllamaForDirective, checkOllamaRouteHealth } from './ollama-provider'
export type { OllamaCameraResult } from './ollama-provider'
