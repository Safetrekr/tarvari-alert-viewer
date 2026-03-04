/**
 * Command palette orchestration hook.
 *
 * Bridges the StructuredCommandPalette execution engine (WS-1.7)
 * with the React UI component. Manages command registration,
 * execution lifecycle, and AI forwarding.
 *
 * Responsibilities:
 * 1. Creates and populates the StructuredCommandPalette with all commands
 * 2. Provides suggestions for the cmdk UI (synonym-aware fuzzy matching)
 * 3. Executes commands and closes the palette on success
 * 4. Reads AI availability from settings.store
 *
 * @module use-command-palette
 * @see WS-3.3 Section 4.4
 */

'use client'

import { useCallback, useMemo } from 'react'
import { useUIStore } from '@/stores/ui.store'
import { useSettingsStore, settingsSelectors } from '@/stores/settings.store'
import {
  StructuredCommandPalette,
  type PaletteSuggestion,
  type CommandResult,
} from '@/lib/interfaces/command-palette'
import { createFullCommandRegistry } from '@/lib/command-registry'

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseCommandPaletteReturn {
  /** Whether the palette dialog is open. */
  isOpen: boolean
  /** Open or close the palette. */
  setOpen: (open: boolean) => void
  /** Toggle the palette open/closed. */
  toggle: () => void
  /** Get ranked suggestions for the current input. */
  getSuggestions: (input: string, limit?: number) => PaletteSuggestion[]
  /** Execute a command by its display label or raw input. */
  execute: (input: string) => Promise<CommandResult>
  /** Execute a command by its ID. */
  executeById: (commandId: string) => Promise<CommandResult>
  /** Whether the AI Camera Director is enabled. */
  aiEnabled: boolean
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Orchestrates the command palette.
 *
 * @param onRefresh - Callback to trigger immediate telemetry refresh.
 */
export function useCommandPalette(onRefresh: () => Promise<void>): UseCommandPaletteReturn {
  // Store bindings
  const isOpen = useUIStore((s) => s.commandPaletteOpen)
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const toggle = useUIStore((s) => s.toggleCommandPalette)
  const aiEnabled = useSettingsStore(settingsSelectors.isAIAvailable)

  // Build the command palette instance (stable across renders)
  const palette = useMemo(() => {
    const instance = new StructuredCommandPalette()
    const commands = createFullCommandRegistry(onRefresh)
    for (const cmd of commands) {
      instance.registerCommand(cmd)
    }
    return instance
  }, [onRefresh])

  // Get suggestions for the current input
  const getSuggestions = useCallback(
    (input: string, limit = 20): PaletteSuggestion[] => {
      return palette.getSuggestions(input, limit)
    },
    [palette],
  )

  // Execute a command by raw input text
  const execute = useCallback(
    async (input: string): Promise<CommandResult> => {
      const result = await palette.execute(input, 'keyboard')

      // Close the palette on successful execution
      if (result.success) {
        setOpen(false)
      }

      return result
    },
    [palette, setOpen],
  )

  // Execute a command by its ID
  const executeById = useCallback(
    async (commandId: string): Promise<CommandResult> => {
      const commands = palette.getCommands()
      const cmd = commands.find((c) => c.id === commandId)

      if (!cmd) {
        return {
          success: false,
          error: `Unknown command: ${commandId}`,
        }
      }

      const result = await cmd.handler({
        raw: cmd.displayLabel,
        parsed: { verb: cmd.verb, object: cmd.object, context: cmd.context },
        source: 'keyboard',
      })

      // Close the palette on successful execution
      if (result.success) {
        setOpen(false)
      }

      return result
    },
    [palette, setOpen],
  )

  return {
    isOpen,
    setOpen,
    toggle,
    getSuggestions,
    execute,
    executeById,
    aiEnabled,
  }
}
