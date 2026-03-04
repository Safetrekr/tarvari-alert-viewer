/**
 * AI library barrel export for Tarva Launch.
 *
 * Central export point for:
 * - Ollama client (shared with WS-3.4)
 * - Narration types
 * - Narration prompts
 * - Delta computation
 * - Narration engine
 * - Camera Director (WS-3.4)
 * - Claude degradation logic (WS-4.1)
 *
 * NOTE: claude-provider.ts is NOT exported here. It is server-side only
 * and imported directly in the Route Handler (app/api/ai/claude/route.ts).
 * Exporting it here would pull @anthropic-ai/sdk into client bundles.
 *
 * @module ai
 * @see WS-3.6, WS-3.4, WS-4.1
 */

// Ollama client (shared with WS-3.4)
export {
  checkOllamaHealth,
  isOllamaAvailable,
  listOllamaModels,
  isModelAvailable,
  generateText,
  generateJSON,
  isOllamaRateLimited,
  OLLAMA_BASE_URL,
  OLLAMA_DEFAULT_MODEL,
  OLLAMA_TIMEOUT_MS,
  OLLAMA_HEALTH_TIMEOUT_MS,
} from './ollama-client'

// Narration types
export type {
  Narration,
  NarrationCacheEntry,
  NarrationCycleStatus,
  NarrationRequest,
  NarrationResult,
  NarrationConfig,
  NarrationScope,
  AppDelta,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaTagsResponse,
} from './narration-types'

// Narration prompts
export {
  BATCH_SYSTEM_PROMPT,
  DEEP_DIVE_SYSTEM_PROMPT,
  ALERT_SYSTEM_PROMPT,
  buildBatchPrompt,
  buildDeepDivePrompt,
  buildAlertPrompt,
} from './narration-prompts'

// Delta computation
export {
  computeAppDelta,
  computeDeltas,
  CHANGE_THRESHOLDS,
} from './delta-computer'

// Narration engine
export {
  generateNarration,
  runNarrationCycle,
  NARRATION_CYCLE_INTERVAL_MS,
  MAX_BATCH_CALLS_PER_CYCLE,
} from './narration-engine'

// Camera Director (WS-3.4)
export {
  CameraDirector,
  PatternMatcherProvider,
  buildSpatialIndex,
  spatialIndexToText,
  assemblePrompt,
  estimateTokenCount,
  ollamaCameraResponseSchema,
  validateCameraDirective,
  CAMERA_DIRECTIVE_FORMAT_INSTRUCTION,
  queryOllamaForDirective,
  checkOllamaRouteHealth,
} from './camera-director'

export type {
  CameraDirectorResult,
  DisambiguationOption,
  PatternMatchResult,
  PatternMatchContext,
  DriftGuess,
  SpatialEntity,
  SpatialIndexSnapshot,
  CameraContext,
  DistrictTelemetryInput,
  CameraStateInput,
  AssembledPrompt,
  OllamaCameraResponse,
  DirectiveValidationResult,
  OllamaCameraResult,
} from './camera-director'

// Claude graceful degradation (WS-4.1)
// NOTE: ClaudeProvider is server-side only -- import directly from
// '@/lib/ai/claude-provider' in Route Handlers only.
export {
  getClaudeDegradation,
  getAllDegradationStatuses,
} from './claude-degradation'

export type {
  DegradationMode,
  DegradationResult,
} from './claude-degradation'

// Claude types and cost constants (WS-4.1)
// Imported from claude-types.ts (no @anthropic-ai/sdk dependency).
// The ClaudeProvider class lives in claude-provider.ts (server-side only).
export type {
  ClaudeConfig,
  ClaudeHealthResult,
  ClaudeChatResult,
  ClaudeTokenUsage,
  ClaudeErrorType,
} from './claude-types'

export {
  DEFAULT_CLAUDE_CONFIG,
  CLAUDE_COST_PER_TOKEN,
} from './claude-types'
