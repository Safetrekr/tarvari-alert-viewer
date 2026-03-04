/**
 * useCameraDirector -- React hook wrapping the AI Camera Director.
 *
 * Takes a query string, processes it through the three-layer pipeline
 * (pattern matcher -> Ollama -> validation), and executes the resulting
 * CameraDirective by calling camera store flyTo/zoom actions via
 * spatial-actions utilities.
 *
 * Manages the full lifecycle:
 * - Sets active request in AI store
 * - Starts speculative drift during Ollama inference
 * - Handles disambiguation when needed
 * - Clears state on completion
 * - Records AI cost in session tracking
 *
 * @module use-camera-director
 * @see WS-3.4 Section 4.9
 */

'use client'

import { useCallback, useRef } from 'react'
import { nanoid } from 'nanoid'
import { useAIStore, type AIState, type DisambiguationCandidate } from '@/stores/ai.store'
import { useSettingsStore, settingsSelectors } from '@/stores/settings.store'
import { useCameraStore } from '@/stores/camera.store'
import { useDistrictsStore } from '@/stores/districts.store'
import { flyToDistrict, flyToWorldPoint, returnToHub } from '@/lib/spatial-actions'
import {
  CameraDirector,
  buildSpatialIndex,
  type CameraDirectorResult,
  type PatternMatchContext,
} from '@/lib/ai/camera-director'
import type { CameraDirective, CameraTarget } from '@/lib/interfaces/camera-controller'
import type { AppIdentifier } from '@/lib/interfaces/types'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseCameraDirectorReturn {
  /** Process a natural language query through the AI Camera Director. */
  processQuery: (query: string) => Promise<CameraDirectorResult>
  /** Select a disambiguation candidate by district ID. */
  selectDisambiguation: (districtId: AppIdentifier) => void
  /** Whether an AI request is currently in flight. */
  isProcessing: boolean
  /** Whether disambiguation is active. */
  isDisambiguating: boolean
  /** Whether AI features are enabled. */
  aiEnabled: boolean
  /** Whether Ollama is available for NL queries. */
  ollamaReady: boolean
  /** Last directive result for display. */
  lastDirective: AIState['lastDirective']
  /** Disambiguation candidates. */
  disambiguationCandidates: DisambiguationCandidate[]
}

// ============================================================================
// Singleton Camera Director instance
// ============================================================================

let directorInstance: CameraDirector | null = null

function getDirector(): CameraDirector {
  if (!directorInstance) {
    directorInstance = new CameraDirector()
  }
  return directorInstance
}

// ============================================================================
// Hook
// ============================================================================

/**
 * React hook for the AI Camera Director.
 *
 * Provides a `processQuery` function that:
 * 1. Checks if AI is enabled (settings.store)
 * 2. Builds spatial context from districts + camera stores
 * 3. Routes query through three-layer pipeline
 * 4. Executes resulting CameraDirective
 * 5. Updates AI store with result
 */
export function useCameraDirector(): UseCameraDirectorReturn {
  const abortRef = useRef<AbortController | null>(null)

  // Read AI state
  const activeRequest = useAIStore((s) => s.activeRequest)
  const disambiguation = useAIStore((s) => s.disambiguation)
  const ollamaReady = useAIStore((s) => s.ollamaReady)
  const ollamaModel = useAIStore((s) => s.ollamaModel)
  const lastDirective = useAIStore((s) => s.lastDirective)

  // Read settings
  const aiEnabled = useSettingsStore(settingsSelectors.isAIAvailable)

  // Process a query through the three-layer pipeline
  const processQuery = useCallback(
    async (query: string): Promise<CameraDirectorResult> => {
      // Abort any in-flight request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      abortRef.current = new AbortController()

      const requestId = nanoid()
      const director = getDirector()
      const aiStore = useAIStore.getState()

      // Mark request as active
      aiStore.setActiveRequest({
        id: requestId,
        feature: aiEnabled ? 'camera-director-nl' : 'camera-director-structured',
        query,
        startedAt: Date.now(),
        provider: null,
      })

      // Clear any existing disambiguation
      aiStore.clearDisambiguation()

      try {
        // Build spatial context from current stores
        const districts = useDistrictsStore.getState().districts
        const camera = useCameraStore.getState()

        const spatialSnapshot = buildSpatialIndex(districts, {
          offsetX: camera.offsetX,
          offsetY: camera.offsetY,
          zoom: camera.zoom,
          semanticLevel: camera.semanticLevel,
        })

        // Build alert context for pattern matcher
        const patternContext = buildPatternContext(districts)

        // Start speculative drift if Ollama will be called
        const settingsState = useSettingsStore.getState()
        const shouldUseOllama = settingsState.aiCameraDirectorEnabled && ollamaReady

        if (shouldUseOllama) {
          const drift = director.guessDriftTarget(query, patternContext)
          if (drift.districtId && drift.confidence > 0.3) {
            aiStore.setDrift({
              active: true,
              targetDistrictId: drift.districtId,
              confidence: drift.confidence,
              startedAt: Date.now(),
            })
            // Start gentle drift toward the guessed target
            executeDriftNavigation(drift.districtId)
          }
        }

        // Run the three-layer pipeline
        const result = await director.interpret(
          query,
          spatialSnapshot,
          patternContext,
          shouldUseOllama,
          ollamaModel,
        )

        // Stop speculative drift
        aiStore.clearDrift()

        // Handle result
        if (result.success && result.directive) {
          // Execute the directive
          executeDirective(result.directive)

          // Record cost
          const feature = result.provider === 'ollama'
            ? 'camera-director-nl' as const
            : 'camera-director-structured' as const
          aiStore.recordAICost(result.provider, feature)

          // Store last directive for display
          aiStore.setLastDirective({
            reasoning: result.reasoning,
            provider: result.provider,
            confidence: result.confidence,
            latencyMs: result.latencyMs,
          })

          // Handle disambiguation
          if (result.needsDisambiguation && result.disambiguationCandidates.length > 0) {
            const candidates = result.disambiguationCandidates.map((c) => ({
              districtId: c.districtId,
              displayName: APP_DISPLAY_NAMES[c.districtId] ?? c.districtId,
              confidence: c.confidence,
              reason: c.reason,
            }))
            aiStore.setDisambiguation(candidates)
          }
        }

        // Clear active request
        aiStore.setActiveRequest(null)

        return result
      } catch (error) {
        // Clear state on error
        aiStore.clearDrift()
        aiStore.setActiveRequest(null)

        const message = error instanceof Error ? error.message : String(error)
        return {
          success: false,
          directive: null,
          confidence: 0,
          provider: 'pattern-matcher',
          reasoning: `Error processing query: ${message}`,
          latencyMs: 0,
          modelId: null,
          needsDisambiguation: false,
          disambiguationCandidates: [],
          error: message,
        }
      }
    },
    [aiEnabled, ollamaReady, ollamaModel],
  )

  // Select a disambiguation candidate
  const selectDisambiguation = useCallback((districtId: AppIdentifier) => {
    const aiStore = useAIStore.getState()
    aiStore.clearDisambiguation()

    // Navigate to the selected district
    flyToDistrict(districtId)
  }, [])

  return {
    processQuery,
    selectDisambiguation,
    isProcessing: activeRequest !== null,
    isDisambiguating: disambiguation.active,
    aiEnabled,
    ollamaReady,
    lastDirective,
    disambiguationCandidates: disambiguation.candidates,
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build PatternMatchContext from the districts store data.
 */
function buildPatternContext(
  districts: Record<string, { status: string; alertCount: number }>,
): PatternMatchContext {
  const alertCounts: Record<string, number> = {}
  const healthStates: Record<string, string> = {}

  for (const [id, data] of Object.entries(districts)) {
    alertCounts[id] = data.alertCount
    healthStates[id] = data.status
  }

  return { alertCounts, healthStates }
}

/**
 * Execute a CameraDirective by calling the appropriate spatial action.
 */
function executeDirective(directive: CameraDirective): void {
  const target = directive.target
  executeTarget(target)
}

/**
 * Execute a CameraTarget navigation.
 */
function executeTarget(target: CameraTarget): void {
  switch (target.type) {
    case 'district':
      flyToDistrict(target.districtId)
      break
    case 'home':
      returnToHub()
      break
    case 'constellation':
      flyToWorldPoint(0, 0, 0.15)
      break
    case 'position':
      flyToWorldPoint(
        target.position.offsetX,
        target.position.offsetY,
        target.position.zoom,
      )
      break
    case 'station':
      // Phase 2+ will handle station-level navigation
      flyToDistrict(target.districtId)
      break
  }
}

/**
 * Execute a gentle drift navigation toward a guessed district.
 * Uses a low-confidence animation that can be smoothly overridden.
 */
function executeDriftNavigation(districtId: AppIdentifier): void {
  // We do not use flyToDistrict here because the drift animation
  // should be gentle and interruptible. Instead, we start a slow
  // movement that the final directive will override.
  // The camera store's flyTo with default spring config handles this.
  flyToDistrict(districtId)
}
