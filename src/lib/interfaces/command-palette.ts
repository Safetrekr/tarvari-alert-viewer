/**
 * CommandPalette -- Input API.
 *
 * Phase 1: StructuredCommandPalette (pattern-matched structured commands).
 * Phase 3: NLCommandPalette adds "Ask AI..." natural language via AIRouter.
 *
 * The command palette is the primary keyboard navigation tool.
 * In a ZUI without traditional menus, this is critical for power users.
 *
 * Command naming: [Verb] [Object] [in Context]
 * Synonym ring: every app and concept has multiple aliases.
 *
 * References: AD-7 interface #6, IA Assessment Section 4 (Command Palette Design)
 */

import type { AppIdentifier } from './types'
import type { CameraDirective } from './camera-controller'
import type { ReceiptInput } from './receipt-store'

// ============================================================================
// Command Categories
// ============================================================================

/** Command categories per IA Assessment Section 4. */
export type CommandCategory = 'navigation' | 'view' | 'action'

// ============================================================================
// Command Arguments
// ============================================================================

/** Parsed command input passed to command handlers. */
export interface CommandArgs {
  /** The original raw input string as typed by the user. */
  readonly raw: string
  /** Parsed components of the command. */
  readonly parsed: {
    readonly verb: string
    readonly object: string
    readonly context?: string
  }
  /** How the command was invoked. */
  readonly source: 'keyboard' | 'ai'
}

// ============================================================================
// Command Result
// ============================================================================

/** Result of executing a command. */
export interface CommandResult {
  /** Whether the command executed successfully. */
  readonly success: boolean
  /** Camera directive to execute, if this is a navigation command. */
  readonly directive?: CameraDirective
  /** Receipt to record for this action. */
  readonly receipt?: ReceiptInput
  /** Human-readable feedback message. */
  readonly message?: string
  /** Error details if success is false. */
  readonly error?: string
}

// ============================================================================
// Command Handler
// ============================================================================

/**
 * Function that executes a command and returns a result.
 * Handlers are registered with the CommandPalette.
 */
export type CommandHandler = (args: CommandArgs) => Promise<CommandResult>

// ============================================================================
// Palette Command
// ============================================================================

/**
 * A registered command in the palette.
 * Per IA Assessment: format is "[Verb] [Object] [in Context]".
 */
export interface PaletteCommand {
  /** Unique command identifier. */
  readonly id: string
  /** Primary verb (e.g., "go", "show", "open", "refresh"). */
  readonly verb: string
  /** Primary object (e.g., "agent-builder", "status", "alerts"). */
  readonly object: string
  /** Optional context qualifier (e.g., "in Project Room"). */
  readonly context?: string
  /** Display label shown in the palette (e.g., "Go to Agent Builder"). */
  readonly displayLabel: string
  /** Alternative strings that match this command. */
  readonly synonyms: readonly string[]
  /** Category for grouping in the palette UI. */
  readonly category: CommandCategory
  /** Function that executes this command. */
  readonly handler: CommandHandler
}

// ============================================================================
// Palette Suggestion (for fuzzy matching)
// ============================================================================

/** A suggestion shown in the palette dropdown during typing. */
export interface PaletteSuggestion {
  /** The matched command. */
  readonly command: PaletteCommand
  /** Fuzzy match score. 0.0 (no match) to 1.0 (exact match). */
  readonly score: number
  /** Display string with match segments highlighted (HTML-safe). */
  readonly highlightedLabel: string
}

// ============================================================================
// Synonym Ring (IA Assessment Section 4)
// ============================================================================

/**
 * A group of synonyms for a single concept.
 * Used for fuzzy command matching.
 */
export interface SynonymEntry {
  /** The canonical name for this concept. */
  readonly canonical: string
  /** All accepted synonyms (including short codes). */
  readonly synonyms: readonly string[]
}

/** The complete synonym ring from IA Assessment Section 4. */
export const SYNONYM_RING: readonly SynonymEntry[] = [
  {
    canonical: 'Agent Builder',
    synonyms: ['builder', 'agentgen', 'agent gen', 'agent builder', 'AB'],
  },
  { canonical: 'Tarva Chat', synonyms: ['chat', 'tarva chat', 'CH'] },
  { canonical: 'Project Room', synonyms: ['projects', 'project room', 'tarva project', 'PR'] },
  { canonical: 'TarvaCORE', synonyms: ['core', 'tarva core', 'reasoning', 'CO'] },
  { canonical: 'TarvaERP', synonyms: ['erp', 'tarva erp', 'manufacturing', 'warehouse', 'ER'] },
  { canonical: 'tarvaCODE', synonyms: ['code', 'tarva code', 'CD'] },
  {
    canonical: 'Evidence Ledger',
    synonyms: ['evidence', 'ledger', 'receipts', 'audit', 'audit trail', 'EL'],
  },
  {
    canonical: 'Constellation',
    synonyms: ['overview', 'dashboard', 'sky', 'constellation', 'global'],
  },
  { canonical: 'Status', synonyms: ['health', 'status', 'ops', 'operations', 'diagnostics'] },
  {
    canonical: 'Activity',
    synonyms: [
      'run',
      'runs',
      'job',
      'jobs',
      'execution',
      'executions',
      'conversation',
      'conversations',
      'session',
      'sessions',
      'work',
    ],
  },
  {
    canonical: 'Alert',
    synonyms: [
      'alert',
      'alerts',
      'warning',
      'warnings',
      'error',
      'errors',
      'problem',
      'problems',
      'issue',
      'issues',
    ],
  },
] as const

// ============================================================================
// CommandPalette Interface
// ============================================================================

export interface CommandPalette {
  /**
   * Execute a raw input string.
   *
   * Phase 1: parses structured commands ("go core", "home", "open chat").
   * Phase 3: if no structured match, routes to AIRouter for NL interpretation.
   *
   * @param input - Raw user input string.
   * @param source - How the input was provided.
   */
  execute(input: string, source?: 'keyboard' | 'ai'): Promise<CommandResult>

  /**
   * Get ranked suggestions for a partial input string.
   * Used by the cmdk UI for real-time filtering.
   *
   * @param partial - The current input text.
   * @param limit - Maximum suggestions to return. Default: 10.
   */
  getSuggestions(partial: string, limit?: number): PaletteSuggestion[]

  /** Register a new command. Overwrites if ID already exists. */
  registerCommand(command: PaletteCommand): void

  /** Remove a command by ID. Returns true if found and removed. */
  removeCommand(commandId: string): boolean

  /** Get all registered commands. */
  getCommands(): readonly PaletteCommand[]

  /** Get commands filtered by category. */
  getCommandsByCategory(category: CommandCategory): readonly PaletteCommand[]
}

// ============================================================================
// Phase 1 Implementation: StructuredCommandPalette
// ============================================================================

/**
 * Phase 1 CommandPalette. Pattern-matches structured commands only.
 *
 * Supported patterns:
 * - "go [target]" / "go to [target]" -> navigate to district/view
 * - "home" / "center" / "atrium" -> return to Launch Atrium
 * - "show [target]" -> navigate to station/view
 * - "open [app]" -> launch app in new tab
 * - "refresh" -> force telemetry refresh
 *
 * Uses the synonym ring for fuzzy matching of target names.
 *
 * Phase 3 adds: "Ask AI..." prefix routes to AIRouter for NL parsing.
 */
export class StructuredCommandPalette implements CommandPalette {
  private commands: Map<string, PaletteCommand> = new Map()

  async execute(input: string, source: 'keyboard' | 'ai' = 'keyboard'): Promise<CommandResult> {
    const normalized = input.trim().toLowerCase()

    // Try exact command match first.
    const suggestions = this.getSuggestions(normalized, 1)
    if (suggestions.length > 0 && suggestions[0].score > 0.5) {
      const cmd = suggestions[0].command
      return cmd.handler({
        raw: input,
        parsed: { verb: cmd.verb, object: cmd.object, context: cmd.context },
        source,
      })
    }

    return {
      success: false,
      error: `No command matched "${input}". Try "go [app name]", "home", or "open [app name]".`,
    }
  }

  getSuggestions(partial: string, limit = 10): PaletteSuggestion[] {
    const lower = partial.toLowerCase().trim()
    if (!lower) {
      // Return all commands sorted by category when input is empty.
      return Array.from(this.commands.values())
        .slice(0, limit)
        .map((cmd) => ({
          command: cmd,
          score: 0,
          highlightedLabel: cmd.displayLabel,
        }))
    }

    const scored: PaletteSuggestion[] = []

    for (const cmd of this.commands.values()) {
      let bestScore = 0

      // Check display label.
      if (cmd.displayLabel.toLowerCase().includes(lower)) {
        bestScore = Math.max(bestScore, lower.length / cmd.displayLabel.length)
      }

      // Check synonyms.
      for (const syn of cmd.synonyms) {
        if (syn.toLowerCase().includes(lower)) {
          bestScore = Math.max(bestScore, lower.length / syn.length)
        }
        if (lower.includes(syn.toLowerCase())) {
          bestScore = Math.max(bestScore, syn.length / lower.length)
        }
      }

      // Check verb + object combination.
      const combined = `${cmd.verb} ${cmd.object}`.toLowerCase()
      if (combined.includes(lower) || lower.includes(combined)) {
        bestScore = Math.max(bestScore, 0.8)
      }

      if (bestScore > 0) {
        scored.push({
          command: cmd,
          score: bestScore,
          highlightedLabel: cmd.displayLabel,
        })
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit)
  }

  registerCommand(command: PaletteCommand): void {
    this.commands.set(command.id, command)
  }

  removeCommand(commandId: string): boolean {
    return this.commands.delete(commandId)
  }

  getCommands(): readonly PaletteCommand[] {
    return Array.from(this.commands.values())
  }

  getCommandsByCategory(category: CommandCategory): readonly PaletteCommand[] {
    return Array.from(this.commands.values()).filter((cmd) => cmd.category === category)
  }
}

// ============================================================================
// Default Navigation Commands (IA Assessment Section 4)
// ============================================================================

/**
 * Factory function that creates the default navigation commands.
 * Call this and register each command with the StructuredCommandPalette.
 *
 * The handlers are stubs that return CameraDirectives. The actual navigation
 * is handled by the CameraController in the consuming component.
 */
export function createDefaultNavigationCommands(): PaletteCommand[] {
  const nav = (
    id: string,
    verb: string,
    object: string,
    label: string,
    synonyms: string[],
    directive: CameraDirective
  ): PaletteCommand => ({
    id,
    verb,
    object,
    displayLabel: label,
    synonyms,
    category: 'navigation',
    handler: async () => ({
      success: true,
      directive,
      message: label,
    }),
  })

  const districtIds: Record<string, AppIdentifier> = {
    'agent-builder': 'agent-builder',
    'tarva-chat': 'tarva-chat',
    'project-room': 'project-room',
    'tarva-core': 'tarva-core',
    'tarva-erp': 'tarva-erp',
    'tarva-code': 'tarva-code',
  }

  const commands: PaletteCommand[] = [
    nav('go-home', 'go', 'launch', 'Go to Launch', ['home', 'center', 'atrium'], {
      target: { type: 'home' },
      source: 'command-palette',
    }),
    nav(
      'go-constellation',
      'go',
      'constellation',
      'Go to Constellation',
      ['overview', 'sky', 'dashboard', 'global'],
      {
        target: { type: 'constellation' },
        source: 'command-palette',
      }
    ),
  ]

  // Generate district navigation commands from synonym ring.
  for (const [id, appId] of Object.entries(districtIds)) {
    const synonymEntry = SYNONYM_RING.find(
      (s) =>
        s.canonical ===
        {
          'agent-builder': 'Agent Builder',
          'tarva-chat': 'Tarva Chat',
          'project-room': 'Project Room',
          'tarva-core': 'TarvaCORE',
          'tarva-erp': 'TarvaERP',
          'tarva-code': 'tarvaCODE',
        }[id]
    )

    commands.push(
      nav(
        `go-${id}`,
        'go',
        id,
        `Go to ${synonymEntry?.canonical ?? id}`,
        synonymEntry?.synonyms.slice() ?? [],
        {
          target: { type: 'district', districtId: appId },
          source: 'command-palette',
        }
      )
    )
  }

  return commands
}
