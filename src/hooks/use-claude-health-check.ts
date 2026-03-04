/**
 * Claude health check hook.
 *
 * Periodically pings GET /api/ai/claude to check:
 * 1. Whether ANTHROPIC_API_KEY is configured
 * 2. Whether the Claude API is reachable
 *
 * Updates ai.store with the result. Runs every 120s when AI features
 * are enabled (aiCameraDirectorEnabled in settings.store). Stops
 * polling when the toggle is disabled.
 *
 * References: WS-4.1 (Claude integration),
 * WS-3.4 section 4.10 (Ollama health check pattern)
 *
 * @module use-claude-health-check
 * @see WS-4.1 Section 4.5
 */

'use client'

import { useEffect, useRef } from 'react'
import { useAIStore } from '@/stores/ai.store'
import { useSettingsStore, settingsSelectors } from '@/stores/settings.store'

/** Interval between health checks in ms. */
const CLAUDE_HEALTH_CHECK_INTERVAL_MS = 120_000 // 2 minutes

/** Timeout for the health check fetch call. */
const CLAUDE_HEALTH_CHECK_TIMEOUT_MS = 10_000

/** Response shape from GET /api/ai/claude. */
interface ClaudeHealthResponse {
  configured: boolean
  reachable: boolean
  model: string
  error: string | null
  latencyMs: number
}

/**
 * Periodically check Claude API availability and update AI store.
 *
 * Usage: Call this hook once at the application root level.
 * It manages its own polling lifecycle based on the AI settings toggle.
 */
export function useClaudeHealthCheck(): void {
  const aiEnabled = useSettingsStore(settingsSelectors.isAIAvailable)
  const setClaudeStatus = useAIStore((s) => s.setClaudeStatus)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!aiEnabled) {
      // AI features are off. Mark Claude as unchecked and stop polling.
      setClaudeStatus(false, false, 'AI features disabled')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const check = async () => {
      try {
        const response = await fetch('/api/ai/claude', {
          method: 'GET',
          signal: AbortSignal.timeout(CLAUDE_HEALTH_CHECK_TIMEOUT_MS),
        })
        const data: ClaudeHealthResponse = await response.json()

        setClaudeStatus(data.reachable, data.configured, data.error)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error)
        setClaudeStatus(false, false, `Health check failed: ${message}`)
      }
    }

    // Run immediately on mount / AI feature enable.
    void check()

    // Poll periodically.
    intervalRef.current = setInterval(
      () => void check(),
      CLAUDE_HEALTH_CHECK_INTERVAL_MS,
    )

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [aiEnabled, setClaudeStatus])
}
