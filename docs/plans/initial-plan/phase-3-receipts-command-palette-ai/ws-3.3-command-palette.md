# WS-3.3: Command Palette

> **Workstream ID:** WS-3.3
> **Phase:** 3 -- Receipts + Command Palette + AI
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.1 (camera store, flyTo, resetToLaunch), WS-1.4 (CommandPaletteStub, useKeyboardShortcuts, NavigationHUD), WS-1.7 (CommandPalette interface, PaletteCommand, SYNONYM_RING, StructuredCommandPalette), WS-2.1 (morph choreography, startMorph), WS-3.1 (ReceiptStore for command action receipts), WS-3.4 (AI Camera Director for "Ask AI..." natural language pathway)
> **Blocks:** WS-3.4 (AI Camera Director consumes the "Ask AI..." input pathway and NLCommandPalette adapter)
> **Resolves:** WS-1.4 CommandPaletteStub (replaces the Phase 1 stub with full implementation), WS-1.7 StructuredCommandPalette Phase 3 upgrade notes

---

## 1. Objective

Upgrade the Phase 1 command palette stub (WS-1.4 `CommandPaletteStub.tsx`) into the full command palette -- the primary keyboard-first navigation and action interface for Tarva Launch. In a ZUI without traditional menus, the command palette is how power users navigate districts, execute view commands, launch external apps, and access AI-assisted natural language queries.

This workstream implements the full `CommandPalette` interface defined in WS-1.7, wires it to the `cmdk`-based UI (via `@tarva/ui` `CommandDialog`), registers all three command categories (navigation, view, action) with the complete IA synonym ring for fuzzy matching, and adds the "Ask AI..." natural language option gated behind an AI beta settings toggle.

**Success looks like:** The operator presses `Cmd+K`, sees a glass-styled palette with real-time fuzzy search across all commands. Typing "builder" or "AB" or "agentgen" instantly surfaces "Go to Agent Builder". Typing "runs" shows "Show active runs" filtered to the relevant stations. Typing "open chat" launches Tarva Chat in a new tab. An "Ask AI..." option appears at the bottom when the AI beta toggle is enabled, routing natural language queries to the AI Camera Director (WS-3.4). Every command execution generates a receipt. The palette closes on execution, updates the URL, and the camera animates to the target.

**Why this workstream matters:** The command palette is the convergence point for three systems: the spatial navigation engine (camera + morph), the IA-designed information architecture (synonym ring, command taxonomy), and the AI integration seam (natural language input). It transforms the Launch from a mouse-driven explorer into a keyboard-first operations interface. Without it, the operator must visually locate and click every target -- viable for exploration, insufficient for daily operations.

**Traceability:** AD-7 interface #6 (CommandPalette), IA Assessment Section 4 (Command Palette Design), combined-recommendations.md Phase 3 WS-3.3 description, tech-decisions.md (cmdk via @tarva/ui), VISUAL-DESIGN-SPEC.md Section 1.7 (Strong Glass Panel), Section 4.1 (Heavy glass for modals).

---

## 2. Scope

### In Scope

1. **Full `CommandPalette` component** (`src/components/spatial/CommandPalette.tsx`) -- Replaces `CommandPaletteStub.tsx`. Uses `@tarva/ui` `CommandDialog` (wrapping `cmdk`) with strong glass styling per VISUAL-DESIGN-SPEC.md. Renders three command groups (Navigation, View, Action) plus the conditional AI group. Supports real-time fuzzy filtering via the synonym ring.

2. **Command registry** (`src/lib/command-registry.ts`) -- Factory function that creates and registers all commands from all three IA categories (navigation, view, action) with the `StructuredCommandPalette` implementation from WS-1.7. Each command includes its full synonym set from the IA synonym ring.

3. **Synonym-aware fuzzy matching** -- Extend the WS-1.7 `StructuredCommandPalette.getSuggestions()` with match highlighting. When the user types a synonym (e.g., "core", "reasoning", "CO"), the matched command surfaces with the synonym match visually indicated in the palette UI.

4. **Navigation commands** (per IA Assessment Section 4) -- `Go to Launch`, `Go to Agent Builder`, `Go to Tarva Chat`, `Go to Project Room`, `Go to TarvaCORE`, `Go to TarvaERP`, `Go to tarvaCODE`, `Go to Constellation`, `Go to Evidence Ledger`. Each triggers `CameraController.navigate()` with the appropriate `CameraDirective`. District navigation commands also trigger `startMorph()` from `ui.store` (WS-2.1) to initiate the capsule-to-district transition.

5. **View commands** (per IA Assessment Section 4) -- `Show status of {app}`, `Show active runs`, `Show alerts`, `Show recent receipts`. These navigate to specific stations or filtered views, targeting Z2/Z3 zoom levels.

6. **Action commands** (per IA Assessment Section 4) -- `Open Agent Builder`, `Open Tarva Chat`, `Open Project Room`, `Refresh health checks`. Open commands launch external app URLs in new browser tabs. Refresh triggers `SystemStateProvider.refresh()` for an immediate telemetry re-poll.

7. **"Ask AI..." natural language option** -- A special command item at the bottom of the palette, visually distinguished, that routes raw text input to the AI Camera Director (WS-3.4). Gated behind `useAIStore(aiSelectors.isAIAvailable)` from WS-3.4's `ai.store.ts`. When disabled, the item renders as disabled with "Enable in Settings" subtitle. When enabled, selecting it or pressing Enter with no structured match forwards the input to `AIRouter.route('camera-director', input)`.

8. **AI beta settings toggle** -- **[AMENDED per Phase 3 Review H-2]** The AI beta toggle lives in `ai.store.ts` (WS-3.4), NOT in a separate `settings.store.ts`. WS-3.3 reads the toggle via `useAIStore(aiSelectors.isAIAvailable)`. This avoids dual-store conflicts where two stores control the same feature with different field names and localStorage keys. WS-3.3 does NOT create `settings.store.ts`.

9. **Receipt generation** -- Every command execution generates a `LaunchReceipt` via `ReceiptStore.record()`. Navigation receipts include `eventType: 'navigation'`, action receipts include `eventType: 'action'`. The receipt captures the command input, the resolved action, and the spatial location at time of execution.

10. **Keyboard shortcut refinements** -- Extend the WS-1.4 `useKeyboardShortcuts` to handle: `Cmd+K` / `Ctrl+K` (toggle palette), `Escape` (close palette), `Enter` (execute selected command or "Ask AI..." if no match and AI enabled), arrow keys (handled natively by `cmdk`).

11. **Empty state** -- When no commands match the input, the palette shows "No matching commands" with a hint: "Try 'go [app name]', 'show [station]', or 'open [app]'". If AI is enabled, the empty state also shows "Press Enter to ask AI" as a call to action.

12. **Glass styling** -- The palette dialog applies the strong glass panel treatment per VISUAL-DESIGN-SPEC.md: `background: rgba(15, 22, 31, 0.80)`, `backdrop-filter: blur(24px) saturate(140%)`, `border: 1px solid rgba(255, 255, 255, 0.08)`, `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.04), 0 8px 32px rgba(0, 0, 0, 0.5)`. Max width 520px (slightly wider than the Phase 1 stub's 480px to accommodate the AI input mode).

13. **Reduced motion support** -- Command selection triggers `flyTo()` via `CameraController`. With `prefers-reduced-motion: reduce`, the palette closes instantly (no exit animation) and `flyTo()` degrades to instant position set per WS-1.1's existing behavior.

14. **Command shortcut hints** -- Display keyboard shortcut hints in command items where applicable: `Home` for "Go to Launch", `Cmd+K` label on the palette trigger itself. Uses `CommandShortcut` from `@tarva/ui`.

### Out of Scope

- **AI Camera Director implementation** (WS-3.4) -- This workstream provides the "Ask AI..." input pathway and forwards text to the AIRouter. The actual NL-to-CameraDirective translation, Ollama integration, speculative camera drift, and disambiguation strip are the responsibility of WS-3.4.
- **Settings panel UI** -- The AI beta toggle is owned by `ai.store.ts` (WS-3.4). The settings panel (a toggleable UI for enabling/disabling AI features) is a separate concern, likely part of a future WS-3.x or WS-4.x workstream.
- **Receipt stamp animation** (WS-3.1) -- This workstream calls `ReceiptStore.record()` to log receipts. The visual stamp animation that appears on screen is the responsibility of WS-3.1's receipt stamp component.
- **Evidence Ledger navigation** (WS-3.2) -- The "Go to Evidence Ledger" command navigates to the Evidence Ledger district. The ledger itself (timeline, facets, rehydration) is WS-3.2.
- **Advanced NL features** -- Multi-turn conversation, ambiguity resolution UI, speculative camera drift during AI latency. These belong to WS-3.4.
- **Custom command registration UI** -- Users cannot add custom commands in Phase 3. The registry is code-defined.
- **Touch/mobile palette** -- Desktop-first per project constraints. `Cmd+K` trigger only.

---

## 3. Input Dependencies

| Dependency                    | Source            | What It Provides                                                                                                                                                                                                                                                          | Status                                                                  |
| ----------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| WS-1.1 ZUI Engine             | Phase 1           | Camera store with `flyTo()`, `resetToLaunch()`, `zoomTo()`; `CameraController` instance; `CameraPosition`, `CameraDirective` types                                                                                                                                        | Required                                                                |
| WS-1.4 Navigation Instruments | Phase 1           | `CommandPaletteStub.tsx` (replaced by this workstream); `useKeyboardShortcuts` hook; `NavigationHUD` container; `ui.store.commandPaletteOpen`, `ui.store.toggleCommandPalette()`, `ui.store.setCommandPaletteOpen()`                                                      | Required                                                                |
| WS-1.7 Core Interfaces        | Phase 1           | `CommandPalette` interface; `PaletteCommand`, `CommandArgs`, `CommandResult`, `PaletteSuggestion`, `CommandCategory`, `SynonymEntry` types; `SYNONYM_RING` constant; `StructuredCommandPalette` class; `createDefaultNavigationCommands()` factory; `CommandHandler` type | Required                                                                |
| WS-2.1 Morph Choreography     | Phase 2           | `ui.store.startMorph(districtId)` action for triggering capsule-to-district transition when navigating to a district via command palette                                                                                                                                  | Required                                                                |
| WS-3.1 Receipt System         | Phase 3           | `ReceiptStore` implementation (Supabase-backed); `ReceiptInput` type; `ReceiptStore.record()` method for logging command execution receipts                                                                                                                               | Required                                                                |
| WS-3.4 AI Camera Director     | Phase 3           | `AIRouter` instance with `route('camera-director', input)` method; `CameraDirective` output. The command palette forwards "Ask AI..." input to this system.                                                                                                               | Soft dependency -- palette works without it (AI item shows as disabled) |
| `@tarva/ui` Command           | Published package | `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator` components                                                                                                                           | Required                                                                |
| `@tarva/ui` Dialog            | Published package | `DialogContent` (underlying component of `CommandDialog`) for glass styling overrides                                                                                                                                                                                     | Required                                                                |
| `@tarva/ui` Badge             | Published package | `Badge` component for AI beta indicator label                                                                                                                                                                                                                             | Required                                                                |
| `districts.store`             | WS-0.1 skeleton   | District data for building district navigation commands dynamically                                                                                                                                                                                                       | Required                                                                |
| `ui.store`                    | WS-0.1 skeleton   | `commandPaletteOpen`, `toggleCommandPalette()`, `setCommandPaletteOpen()`, `selectedDistrictId`, `startMorph()`                                                                                                                                                           | Required                                                                |
| `camera.store`                | WS-0.1 skeleton   | Camera position for receipt spatial location capture                                                                                                                                                                                                                      | Required                                                                |
| IA Assessment Section 4       | Discovery         | Navigation commands table, view commands table, action commands table, synonym ring                                                                                                                                                                                       | Reference                                                               |
| VISUAL-DESIGN-SPEC.md         | Discovery         | Strong glass panel styling (Section 1.7 / 4.1), HUD element typography (Section 3.2), easing curves (Section 7)                                                                                                                                                           | Reference                                                               |

---

## 4. Deliverables

### 4.1 AI Beta Toggle (from WS-3.4 `ai.store.ts`)

**[AMENDED per Phase 3 Review H-2]** The AI beta toggle is NOT created by this workstream. It is defined in `src/stores/ai.store.ts` by WS-3.4, which owns all AI feature state (beta toggle, provider health, active requests, speculative drift state, disambiguation state).

This workstream **reads** the toggle via:

```ts
import { useAIStore, aiSelectors } from '@/stores/ai.store'

// In the command palette hook:
const aiEnabled = useAIStore(aiSelectors.isAIAvailable)
```

**Design rationale:** A single store (`ai.store.ts`) owns the AI beta toggle, persisted to `localStorage` under `tarva-launch-ai-beta`. This prevents the dual-store conflict identified in the Phase 3 Review: two stores with different field names (`aiCameraDirectorEnabled` vs `betaEnabled`) and different localStorage keys (`tarva-launch-settings` vs `tarva-launch-ai-beta`) controlling the same feature. The command palette is a consumer of AI state, not the owner.

### 4.2 Command Registry

**File:** `src/lib/command-registry.ts`

Factory that creates all commands across the three IA categories and registers them with a `StructuredCommandPalette` instance.

```ts
/**
 * Command registry for the full command palette.
 *
 * Creates all commands from IA Assessment Section 4:
 * - Navigation commands: go to districts, evidence ledger, constellation
 * - View commands: show status, show runs, show alerts, show receipts
 * - Action commands: open apps in new tab, refresh health
 *
 * Each command includes its full synonym set from the IA synonym ring.
 *
 * References: IA Assessment Section 4, WS-1.7 PaletteCommand interface
 */

import type { AppIdentifier } from '@/lib/interfaces/types'
import type { CameraDirective } from '@/lib/interfaces/camera-controller'
import type { CameraTarget } from '@/lib/interfaces/camera-controller'
import type {
  PaletteCommand,
  CommandCategory,
  CommandResult,
} from '@/lib/interfaces/command-palette'
import { SYNONYM_RING } from '@/lib/interfaces/command-palette'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'

// ============================================================================
// App Launch URLs (localhost)
// ============================================================================

/**
 * Localhost URLs for each Tarva app.
 * Per TARVA-SYSTEM-OVERVIEW.md validated assumptions.
 */
const APP_URLS: Readonly<Partial<Record<AppIdentifier, string>>> = {
  'agent-builder': 'http://localhost:3000',
  'tarva-chat': 'http://localhost:4000',
  'project-room': 'http://localhost:3010',
  'tarva-erp': 'http://localhost:4000',
} as const

// ============================================================================
// Helper: Find synonyms for a canonical name
// ============================================================================

function findSynonyms(canonical: string): readonly string[] {
  const entry = SYNONYM_RING.find((s) => s.canonical === canonical)
  return entry?.synonyms ?? []
}

// ============================================================================
// Navigation Commands
// ============================================================================

/**
 * Create navigation commands per IA Assessment Section 4.
 *
 * These commands produce CameraDirectives. The consuming component
 * passes each directive to CameraController.navigate().
 */
export function createNavigationCommands(): PaletteCommand[] {
  const nav = (
    id: string,
    verb: string,
    object: string,
    label: string,
    synonyms: readonly string[],
    target: CameraTarget
  ): PaletteCommand => ({
    id,
    verb,
    object,
    displayLabel: label,
    synonyms: [...synonyms],
    category: 'navigation' as CommandCategory,
    handler: async () => ({
      success: true,
      directive: {
        target,
        source: 'command-palette' as const,
      } satisfies CameraDirective,
      message: label,
    }),
  })

  const commands: PaletteCommand[] = [
    // Core navigation
    nav(
      'go-home',
      'go',
      'launch',
      'Go to Launch',
      ['home', 'center', 'atrium', ...findSynonyms('Constellation')],
      { type: 'home' }
    ),
    nav(
      'go-constellation',
      'go',
      'constellation',
      'Go to Constellation',
      findSynonyms('Constellation'),
      { type: 'constellation' }
    ),
    nav(
      'go-evidence-ledger',
      'go',
      'evidence-ledger',
      'Go to Evidence Ledger',
      findSynonyms('Evidence Ledger'),
      // Evidence Ledger is the NW district -- navigate to its position
      { type: 'position', position: { offsetX: -400, offsetY: -400, zoom: 1.0 } }
    ),
  ]

  // District navigation commands (one per app)
  const districtIds: AppIdentifier[] = [
    'agent-builder',
    'tarva-chat',
    'project-room',
    'tarva-core',
    'tarva-erp',
    'tarva-code',
  ]

  for (const appId of districtIds) {
    const displayName = APP_DISPLAY_NAMES[appId]
    const synonyms = findSynonyms(displayName)

    commands.push(
      nav(`go-${appId}`, 'go', appId, `Go to ${displayName}`, synonyms, {
        type: 'district',
        districtId: appId,
      })
    )
  }

  return commands
}

// ============================================================================
// View Commands
// ============================================================================

/**
 * Create view commands per IA Assessment Section 4.
 *
 * View commands navigate to specific stations or filtered views.
 * They target Z2/Z3 zoom levels.
 */
export function createViewCommands(): PaletteCommand[] {
  const view = (
    id: string,
    verb: string,
    object: string,
    label: string,
    synonyms: readonly string[],
    target: CameraTarget,
    context?: string
  ): PaletteCommand => ({
    id,
    verb,
    object,
    context,
    displayLabel: label,
    synonyms: [...synonyms],
    category: 'view' as CommandCategory,
    handler: async () => ({
      success: true,
      directive: {
        target,
        source: 'command-palette' as const,
      } satisfies CameraDirective,
      message: label,
    }),
  })

  const commands: PaletteCommand[] = [
    view('show-alerts', 'show', 'alerts', 'Show Alerts', findSynonyms('Alert'), {
      type: 'constellation',
    }),
    view(
      'show-active-runs',
      'show',
      'runs',
      'Show Active Runs',
      findSynonyms('Activity'),
      // Navigate to constellation with active work highlighted
      { type: 'constellation' }
    ),
    view(
      'show-recent-receipts',
      'show',
      'receipts',
      'Show Recent Receipts',
      ['audit trail', 'recent events', 'recent receipts'],
      // Navigate to Evidence Ledger
      { type: 'position', position: { offsetX: -400, offsetY: -400, zoom: 1.0 } }
    ),
  ]

  // Generate "Show status of {app}" commands for each district
  const districtIds: AppIdentifier[] = [
    'agent-builder',
    'tarva-chat',
    'project-room',
    'tarva-core',
    'tarva-erp',
    'tarva-code',
  ]

  for (const appId of districtIds) {
    const displayName = APP_DISPLAY_NAMES[appId]
    const statusSynonyms = findSynonyms('Status')

    commands.push(
      view(
        `show-status-${appId}`,
        'show',
        'status',
        `Show Status of ${displayName}`,
        [...statusSynonyms.map((s) => `${s} ${displayName.toLowerCase()}`)],
        { type: 'station', districtId: appId, stationId: 'status' },
        `in ${displayName}`
      )
    )
  }

  return commands
}

// ============================================================================
// Action Commands
// ============================================================================

/**
 * Create action commands per IA Assessment Section 4.
 *
 * Action commands perform side effects (open URLs, trigger refreshes).
 * They do not produce CameraDirectives.
 */
export function createActionCommands(
  /** Callback to trigger an immediate telemetry refresh. */
  onRefresh: () => Promise<void>
): PaletteCommand[] {
  const commands: PaletteCommand[] = []

  // "Open {app}" commands -- launch app in new browser tab
  for (const [appId, url] of Object.entries(APP_URLS)) {
    const displayName = APP_DISPLAY_NAMES[appId as AppIdentifier]

    commands.push({
      id: `open-${appId}`,
      verb: 'open',
      object: appId,
      displayLabel: `Open ${displayName}`,
      synonyms: [`launch ${displayName.toLowerCase()}`, `open ${displayName.toLowerCase()}`],
      category: 'action' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        window.open(url, '_blank', 'noopener,noreferrer')
        return {
          success: true,
          message: `Opened ${displayName} in new tab`,
        }
      },
    })
  }

  // "Refresh health checks" command
  commands.push({
    id: 'refresh-health',
    verb: 'refresh',
    object: 'health',
    displayLabel: 'Refresh Health Checks',
    synonyms: ['refresh', 'reload', 'poll', 'check health', 're-poll', 'refresh health checks'],
    category: 'action' as CommandCategory,
    handler: async (): Promise<CommandResult> => {
      await onRefresh()
      return {
        success: true,
        message: 'Health checks refreshed',
      }
    },
  })

  return commands
}

// ============================================================================
// Full Registry Initializer
// ============================================================================

/**
 * Create and populate a StructuredCommandPalette with all default commands.
 *
 * Call this once during app initialization. The returned palette instance
 * is the execution engine for the CommandPalette UI component.
 *
 * @param onRefresh - Callback to trigger immediate telemetry refresh.
 *                    Typically `() => queryClient.invalidateQueries(['telemetry'])`.
 */
export function createFullCommandRegistry(onRefresh: () => Promise<void>): PaletteCommand[] {
  return [
    ...createNavigationCommands(),
    ...createViewCommands(),
    ...createActionCommands(onRefresh),
  ]
}
```

### 4.3 Command Palette Hook

**File:** `src/hooks/useCommandPalette.ts`

The orchestration hook that bridges the `StructuredCommandPalette` execution engine with the React UI component. Manages command registration, execution lifecycle, receipt generation, and AI forwarding.

```ts
'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useUIStore } from '@/stores/ui.store'
import { useAIStore, aiSelectors } from '@/stores/ai.store'
import { useCameraStore } from '@/stores/camera.store'
import {
  StructuredCommandPalette,
  type PaletteSuggestion,
  type CommandResult,
} from '@/lib/interfaces/command-palette'
import { createFullCommandRegistry } from '@/lib/command-registry'
import type { CameraDirective } from '@/lib/interfaces/camera-controller'
import type { ReceiptInput } from '@/lib/interfaces/receipt-store'

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
  /** Execute a command from text input. */
  execute: (input: string) => Promise<CommandResult>
  /** Whether the AI Camera Director is enabled. */
  aiEnabled: boolean
  /** Forward input to the AI Camera Director. */
  executeAI: (input: string) => Promise<CommandResult>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Orchestrates the command palette UI.
 *
 * Responsibilities:
 * 1. Creates and populates the StructuredCommandPalette with all commands
 * 2. Provides suggestions for the cmdk UI
 * 3. Executes commands and handles results (camera directives, receipts)
 * 4. Forwards AI queries to the AIRouter when enabled
 *
 * @param deps.onRefresh - Callback for the "Refresh health checks" command.
 * @param deps.onNavigate - Callback to execute a CameraDirective after command match.
 * @param deps.onReceipt - Callback to record a receipt for command execution.
 * @param deps.onAIQuery - Callback to forward input to the AI Camera Director (WS-3.4).
 */
export function useCommandPalette(deps: {
  onRefresh: () => Promise<void>
  onNavigate: (directive: CameraDirective) => Promise<void>
  onReceipt: (input: ReceiptInput) => void
  onAIQuery?: (input: string) => Promise<CommandResult>
}): UseCommandPaletteReturn {
  const { onRefresh, onNavigate, onReceipt, onAIQuery } = deps

  // Store bindings
  const isOpen = useUIStore((s) => s.commandPaletteOpen)
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const toggle = useUIStore((s) => s.toggleCommandPalette)
  const aiEnabled = useAIStore(aiSelectors.isAIAvailable)

  // Camera position for receipt spatial context
  const getCameraPosition = useRef(useCameraStore.getState)
  useEffect(() => {
    getCameraPosition.current = useCameraStore.getState
  })

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
    (input: string, limit = 10): PaletteSuggestion[] => {
      return palette.getSuggestions(input, limit)
    },
    [palette]
  )

  // Execute a command
  const execute = useCallback(
    async (input: string): Promise<CommandResult> => {
      const result = await palette.execute(input, 'keyboard')

      // If the command produced a CameraDirective, execute it
      if (result.success && result.directive) {
        await onNavigate(result.directive)
      }

      // Record a receipt for the command execution
      const cameraState = getCameraPosition.current()
      if (result.success) {
        onReceipt({
          source: 'launch',
          eventType: result.directive ? 'navigation' : 'action',
          severity: 'info',
          summary: result.message ?? `Executed command: ${input}`,
          detail: {
            command: input,
            result: result.message,
            source: 'command-palette',
          },
          actor: 'human',
          location: {
            semanticLevel: cameraState.semanticLevel,
            district: null,
            station: null,
          },
        })
      }

      // Close the palette on successful execution
      if (result.success) {
        setOpen(false)
      }

      return result
    },
    [palette, onNavigate, onReceipt, setOpen]
  )

  // Forward to AI Camera Director
  const executeAI = useCallback(
    async (input: string): Promise<CommandResult> => {
      if (!aiEnabled || !onAIQuery) {
        return {
          success: false,
          error: 'AI Camera Director is not enabled. Enable it in Settings.',
        }
      }

      const result = await onAIQuery(input)

      // Record an AI receipt
      const cameraState = getCameraPosition.current()
      onReceipt({
        source: 'launch',
        eventType: 'navigation',
        severity: 'info',
        summary: `AI query: ${input.slice(0, 80)}`,
        detail: {
          command: input,
          result: result.message,
          source: 'ai-camera-director',
        },
        actor: 'ai',
        location: {
          semanticLevel: cameraState.semanticLevel,
          district: null,
          station: null,
        },
      })

      // Close the palette on successful AI execution
      if (result.success) {
        setOpen(false)
      }

      return result
    },
    [aiEnabled, onAIQuery, onReceipt, setOpen]
  )

  return {
    isOpen,
    setOpen,
    toggle,
    getSuggestions,
    execute,
    aiEnabled,
    executeAI,
  }
}
```

### 4.4 Command Palette Component

**File:** `src/components/spatial/CommandPalette.tsx`

The full command palette UI. Replaces `CommandPaletteStub.tsx`.

```tsx
'use client'

import { useCallback, useRef, useState } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from '@tarva/ui'
import { Badge } from '@tarva/ui'
import { cn } from '@/lib/utils'
import { useCommandPalette } from '@/hooks/useCommandPalette'
import type { PaletteSuggestion } from '@/lib/interfaces/command-palette'
import type { CameraDirective } from '@/lib/interfaces/camera-controller'
import type { ReceiptInput } from '@/lib/interfaces/receipt-store'

// ============================================================================
// Icons (Lucide)
// ============================================================================

import {
  Navigation,
  Eye,
  Zap,
  Sparkles,
  Home,
  Compass,
  BookOpen,
  Activity,
  AlertTriangle,
  Receipt,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'

// ============================================================================
// Category Icons
// ============================================================================

const CATEGORY_ICONS = {
  navigation: Navigation,
  view: Eye,
  action: Zap,
} as const

/**
 * Map command IDs to specific icons for visual distinction.
 * Falls back to category icon if no specific icon is mapped.
 */
const COMMAND_ICONS: Record<string, typeof Navigation> = {
  'go-home': Home,
  'go-constellation': Compass,
  'go-evidence-ledger': BookOpen,
  'show-alerts': AlertTriangle,
  'show-active-runs': Activity,
  'show-recent-receipts': Receipt,
  'refresh-health': RefreshCw,
}

// ============================================================================
// Props
// ============================================================================

interface CommandPaletteProps {
  /** Callback to execute a CameraDirective (from CameraController.navigate). */
  onNavigate: (directive: CameraDirective) => Promise<void>
  /** Callback to record a receipt. */
  onReceipt: (input: ReceiptInput) => void
  /** Callback to trigger immediate telemetry refresh. */
  onRefresh: () => Promise<void>
  /** Callback to forward AI queries (from WS-3.4 AI Camera Director). */
  onAIQuery?: (
    input: string
  ) => Promise<{ success: boolean; directive?: CameraDirective; message?: string; error?: string }>
  className?: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * Full command palette for Tarva Launch.
 *
 * Replaces the Phase 1 CommandPaletteStub. Uses cmdk (via @tarva/ui
 * CommandDialog) with strong glass styling, real-time fuzzy search
 * via the IA synonym ring, and "Ask AI..." natural language option.
 *
 * Three command groups:
 * - Navigation: go to districts, views, evidence ledger
 * - View: show status, runs, alerts, receipts
 * - Action: open apps, refresh health
 * - AI (conditional): Ask AI... for natural language queries
 *
 * References: IA Assessment Section 4, VISUAL-DESIGN-SPEC.md Section 1.7
 */
export function CommandPalette({
  onNavigate,
  onReceipt,
  onRefresh,
  onAIQuery,
  className,
}: CommandPaletteProps) {
  const { isOpen, setOpen, getSuggestions, execute, aiEnabled, executeAI } = useCommandPalette({
    onRefresh,
    onNavigate,
    onReceipt,
    onAIQuery,
  })

  // Track the current input for AI forwarding
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Get current suggestions based on input
  const suggestions = getSuggestions(inputValue, 20)

  // Group suggestions by category
  const navigationSuggestions = suggestions.filter((s) => s.command.category === 'navigation')
  const viewSuggestions = suggestions.filter((s) => s.command.category === 'view')
  const actionSuggestions = suggestions.filter((s) => s.command.category === 'action')

  // Determine if the input has no structured matches (for AI fallback)
  const hasNoMatch = inputValue.trim().length > 0 && suggestions.length === 0

  // Handle command selection from the list
  const handleSelect = useCallback(
    async (commandId: string) => {
      const match = suggestions.find((s) => s.command.id === commandId)
      if (match) {
        await execute(match.command.displayLabel)
      }
      setInputValue('')
    },
    [suggestions, execute]
  )

  // Handle "Ask AI..." selection
  const handleAskAI = useCallback(async () => {
    if (inputValue.trim()) {
      await executeAI(inputValue.trim())
      setInputValue('')
    }
  }, [inputValue, executeAI])

  // Handle Enter key when no match (forward to AI if enabled)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && hasNoMatch && aiEnabled) {
        e.preventDefault()
        handleAskAI()
      }
    },
    [hasNoMatch, aiEnabled, handleAskAI]
  )

  // Reset input when dialog opens/closes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open)
      if (!open) {
        setInputValue('')
      }
    },
    [setOpen]
  )

  // Render icon for a command
  const renderIcon = (suggestion: PaletteSuggestion) => {
    const SpecificIcon = COMMAND_ICONS[suggestion.command.id]
    const CategoryIcon = CATEGORY_ICONS[suggestion.command.category]
    const Icon = SpecificIcon ?? CategoryIcon
    return <Icon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
  }

  // Render a command group if it has items
  const renderGroup = (
    heading: string,
    items: PaletteSuggestion[],
    showSeparatorBefore: boolean
  ) => {
    if (items.length === 0) return null

    return (
      <>
        {showSeparatorBefore && <CommandSeparator />}
        <CommandGroup heading={heading}>
          {items.map((suggestion) => (
            <CommandItem
              key={suggestion.command.id}
              value={suggestion.command.id}
              onSelect={() => handleSelect(suggestion.command.id)}
              className="flex items-center"
            >
              {renderIcon(suggestion)}
              <span className="flex-1">{suggestion.command.displayLabel}</span>
              {suggestion.command.id === 'go-home' && <CommandShortcut>Home</CommandShortcut>}
              {suggestion.command.id.startsWith('open-') && (
                <ExternalLink className="ml-2 h-3 w-3 opacity-30" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </>
    )
  }

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title="Tarva Launch Command Palette"
      // Glass styling overrides on the underlying DialogContent
      dialogContentClassName={cn(
        // Strong glass panel per VISUAL-DESIGN-SPEC.md Section 1.7
        'bg-[rgba(15,22,31,0.80)]',
        'backdrop-blur-[24px] backdrop-saturate-[140%]',
        'border border-[rgba(255,255,255,0.08)]',
        'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.5)]',
        'max-w-[520px]',
        className
      )}
    >
      <CommandInput
        ref={inputRef}
        placeholder="Navigate, view, open, or ask AI..."
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handleKeyDown}
        className="font-mono text-sm tracking-wide"
      />
      <CommandList className="max-h-[360px]">
        {/* Empty state */}
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-[--color-text-secondary] opacity-60">No matching commands</p>
            <p className="text-xs text-[--color-text-tertiary] opacity-40">
              Try &quot;go [app name]&quot;, &quot;show [station]&quot;, or &quot;open [app]&quot;
            </p>
            {aiEnabled && inputValue.trim().length > 0 && (
              <button
                onClick={handleAskAI}
                className={cn(
                  'mt-2 flex items-center gap-2 rounded-md px-3 py-1.5',
                  'bg-[--color-ember]/10 text-[--color-ember-bright]',
                  'text-xs font-medium tracking-wide',
                  'transition-colors hover:bg-[--color-ember]/20'
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Press Enter to ask AI
              </button>
            )}
          </div>
        </CommandEmpty>

        {/* Navigation commands */}
        {renderGroup('Navigation', navigationSuggestions, false)}

        {/* View commands */}
        {renderGroup('View', viewSuggestions, navigationSuggestions.length > 0)}

        {/* Action commands */}
        {renderGroup(
          'Actions',
          actionSuggestions,
          navigationSuggestions.length > 0 || viewSuggestions.length > 0
        )}

        {/* AI group -- always rendered, conditional behavior */}
        <CommandSeparator />
        <CommandGroup heading="AI">
          {aiEnabled ? (
            <CommandItem value="ask-ai" onSelect={handleAskAI} className="flex items-center">
              <Sparkles className="mr-2 h-4 w-4 shrink-0 text-[--color-ember-bright]" />
              <span className="flex-1">
                Ask AI...
                {inputValue.trim().length > 0 && (
                  <span className="ml-2 text-xs text-[--color-text-tertiary] opacity-50">
                    &quot;{inputValue.trim().slice(0, 40)}
                    {inputValue.trim().length > 40 ? '...' : ''}&quot;
                  </span>
                )}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'ml-2 text-[9px] font-medium tracking-wider uppercase',
                  'border-[--color-ember]/30 text-[--color-ember-bright]'
                )}
              >
                Beta
              </Badge>
            </CommandItem>
          ) : (
            <CommandItem disabled className="flex items-center opacity-40">
              <Sparkles className="mr-2 h-4 w-4 shrink-0" />
              <span className="flex-1">Ask AI...</span>
              <span className="text-xs text-[--color-text-tertiary]">Enable in Settings</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

**Component architecture notes:**

| Concern                      | Handled By                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| Dialog open/close state      | `ui.store.commandPaletteOpen` (persisted across renders, controlled by `Cmd+K` shortcut) |
| Command matching and scoring | `StructuredCommandPalette.getSuggestions()` (WS-1.7 interface, synonym ring)             |
| Command execution            | `useCommandPalette.execute()` hook (delegates to `StructuredCommandPalette.execute()`)   |
| Camera navigation            | `onNavigate` prop -> `CameraController.navigate(directive)` (WS-1.1)                     |
| Morph triggering             | Handled inside `CameraController.navigate()` when target is a district (WS-2.1)          |
| Receipt generation           | `onReceipt` prop -> `ReceiptStore.record()` (WS-3.1)                                     |
| AI forwarding                | `onAIQuery` prop -> `AIRouter.route('camera-director', input)` (WS-3.4)                  |
| AI gating                    | `useAIStore(aiSelectors.isAIAvailable)` from WS-3.4 `ai.store.ts`                        |
| Fuzzy search rendering       | `cmdk` built-in filtering + custom scoring from `StructuredCommandPalette`               |
| Glass styling                | Tailwind classes matching VISUAL-DESIGN-SPEC.md `glass-strong` recipe                    |

### 4.5 Keyboard Shortcut Extensions

**File:** Updates to `src/hooks/useKeyboardShortcuts.ts` (created in WS-1.4)

The Phase 1 shortcut hook already handles `Cmd+K` and `Home`. Phase 3 extends with:

| Key      | Modifier       | Action                        | Condition                                          |
| -------- | -------------- | ----------------------------- | -------------------------------------------------- |
| `k`      | `Cmd` / `Ctrl` | Toggle command palette        | Already implemented (WS-1.4)                       |
| `Home`   | None           | Return to hub                 | Already implemented (WS-1.4)                       |
| `Escape` | None           | Close command palette if open | Already implemented (WS-1.4); verify no regression |

No new shortcuts are added in this workstream. The existing WS-1.4 shortcut infrastructure is sufficient. The `cmdk` library handles `ArrowUp`, `ArrowDown`, and `Enter` internally within the dialog.

**Verification required:** Ensure that `Escape` closes the `CommandDialog` (handled by Radix Dialog's `onEscapeKeyDown`), and that after closing, keyboard shortcuts resume (no focus trap leaks).

### 4.6 Integration Point: Hub Layout Wiring

**File:** Updates to `(hub)/page.tsx` or `(hub)/layout.tsx`

Replace `<CommandPaletteStub />` with `<CommandPalette />`:

```tsx
// Before (Phase 1, WS-1.4):
import { CommandPaletteStub } from '@/components/spatial/CommandPaletteStub'

// After (Phase 3, WS-3.3):
import { CommandPalette } from '@/components/spatial/CommandPalette'

// In the render tree:
<NavigationHUD>
  <SpatialBreadcrumb />
  <ZoomIndicator />
  <Minimap />
</NavigationHUD>

<CommandPalette
  onNavigate={async (directive) => {
    await cameraController.navigate(directive)
  }}
  onReceipt={(input) => {
    receiptStore.record(input)
  }}
  onRefresh={async () => {
    await queryClient.invalidateQueries({ queryKey: ['telemetry'] })
  }}
  onAIQuery={aiRouter ? async (input) => {
    return aiRouter.route('camera-director', { input })
  } : undefined}
/>
```

The `CommandPaletteStub.tsx` file can be deleted or preserved as a reference. The stub's hardcoded navigation commands are superseded by the full command registry.

### 4.7 File Cleanup

| Action              | File                                            | Rationale                                                 |
| ------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| Delete or deprecate | `src/components/spatial/CommandPaletteStub.tsx` | Replaced by `CommandPalette.tsx`                          |
| Preserve            | `src/hooks/useKeyboardShortcuts.ts`             | No changes needed; shortcut infrastructure remains        |
| Preserve            | `src/lib/spatial-actions.ts`                    | `returnToHub()` utility still used by `Home` key shortcut |

---

## 5. Acceptance Criteria

| #     | Criterion                                                                                                                                                       | Verification                                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux) opens the command palette with strong glass styling                                                                  | Press shortcut; verify palette opens with `backdrop-blur: 24px`, dark tinted background, 1px border, and top-edge inset highlight per VISUAL-DESIGN-SPEC.md |
| AC-2  | The palette displays three command groups when input is empty: Navigation, View, Actions                                                                        | Open palette with no input; confirm three groups render with correct headings                                                                               |
| AC-3  | Typing "builder" surfaces "Go to Agent Builder" as the top suggestion                                                                                           | Type "builder" in the palette input; confirm the navigation command appears first                                                                           |
| AC-4  | Typing "AB" (short code) surfaces "Go to Agent Builder"                                                                                                         | Type "AB"; confirm synonym matching resolves to the Agent Builder navigation command                                                                        |
| AC-5  | Typing "agentgen" surfaces "Go to Agent Builder"                                                                                                                | Type "agentgen"; confirm the IA synonym resolves correctly                                                                                                  |
| AC-6  | Typing "core" surfaces "Go to TarvaCORE"; typing "reasoning" also surfaces it                                                                                   | Verify both synonyms from the IA synonym ring match the same command                                                                                        |
| AC-7  | Typing "receipts" surfaces both "Go to Evidence Ledger" and "Show Recent Receipts"                                                                              | Verify that the Evidence Ledger synonym "receipts" matches across categories                                                                                |
| AC-8  | Selecting "Go to Agent Builder" triggers `CameraController.navigate()` with `{ type: 'district', districtId: 'agent-builder' }` and triggers morph choreography | Select the command; confirm camera animates to Agent Builder district and morph begins                                                                      |
| AC-9  | Selecting "Go to Launch" triggers return-to-hub (`flyTo(0, 0, 0.50)`) and shows `Home` keyboard shortcut hint                                                   | Select command; confirm camera returns to hub; confirm `CommandShortcut` shows "Home"                                                                       |
| AC-10 | Selecting "Open Agent Builder" opens `http://localhost:3000` in a new browser tab                                                                               | Select command; confirm new tab opens with correct URL                                                                                                      |
| AC-11 | Selecting "Refresh Health Checks" triggers immediate telemetry re-poll                                                                                          | Select command; confirm `queryClient.invalidateQueries` is called (verify via network request)                                                              |
| AC-12 | The "Ask AI..." item appears in the AI group with "Enable in Settings" text when `aiSelectors.isAIAvailable` is `false`                                         | Open palette; confirm AI item is disabled with helper text                                                                                                  |
| AC-13 | When `aiSelectors.isAIAvailable` is `true`, the "Ask AI..." item is interactive and shows a "Beta" badge                                                        | Enable the toggle in `ai.store`; open palette; confirm AI item is clickable with badge                                                                      |
| AC-14 | Selecting "Ask AI..." with input text forwards the text to `onAIQuery` callback                                                                                 | Enable AI; type "show me what's broken"; select "Ask AI..."; confirm callback invoked with the input string                                                 |
| AC-15 | When input has no structured match and AI is enabled, pressing Enter forwards to AI Camera Director                                                             | Type "what needs attention" (no structured match); press Enter; confirm AI query executes                                                                   |
| AC-16 | Every successful command execution generates a `LaunchReceipt` via `ReceiptStore.record()`                                                                      | Execute a navigation command; verify receipt recorded with correct `eventType`, `summary`, and `location`                                                   |
| AC-17 | Navigation command receipts have `eventType: 'navigation'`; action command receipts have `eventType: 'action'`                                                  | Execute both types; verify receipt event types                                                                                                              |
| AC-18 | The palette closes automatically after successful command execution                                                                                             | Execute any command; confirm dialog closes and input resets                                                                                                 |
| AC-19 | When no commands match and AI is disabled, the empty state shows "No matching commands" with hint text                                                          | Type gibberish; confirm empty state message and hint                                                                                                        |
| AC-20 | When no commands match and AI is enabled, the empty state includes "Press Enter to ask AI" call-to-action                                                       | Enable AI; type non-matching text; confirm AI CTA appears                                                                                                   |
| AC-21 | The AI beta toggle in `ai.store.ts` (WS-3.4) persists to `localStorage` and survives page reload; command palette reads the persisted state correctly           | Enable AI; reload page; confirm the setting persists and palette reflects it                                                                                |
| AC-22 | With `prefers-reduced-motion: reduce`, the palette opens and closes without animation; command execution produces instant camera jumps (no spring)              | Enable reduced motion; open/close palette; execute navigation; confirm no animations                                                                        |
| AC-23 | `Escape` closes the palette; keyboard shortcuts resume after close (no focus trap leaks)                                                                        | Open palette; press Escape; press `Home`; confirm palette closes and return-to-hub triggers                                                                 |
| AC-24 | "Show status of {app}" commands (one per district) navigate to the correct station at Z3                                                                        | Type "status agent builder"; select; confirm camera navigates to Agent Builder status station                                                               |
| AC-25 | The command palette renders at max-width 520px, centered horizontally, with strong glass styling matching VISUAL-DESIGN-SPEC.md Section 1.7                     | Visual inspection of palette dimensions and glass effect                                                                                                    |
| AC-26 | `pnpm typecheck` passes with zero errors after all deliverables are added                                                                                       | Run `pnpm typecheck`                                                                                                                                        |
| AC-27 | `CommandPaletteStub.tsx` is removed or deprecated and no longer imported by the hub layout                                                                      | Verify no imports of the stub component remain in the codebase                                                                                              |
| AC-28 | Input field uses Geist Mono font with tracking per HUD typography spec                                                                                          | Visual inspection: font-family matches `font-mono`, text is slightly tracked                                                                                |

---

## 6. Decisions Made

| #    | Decision                                                                                                 | Rationale                                                                                                                                                                                                                                                                                                                    | Source                                                                                               |
| ---- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| D-1  | The command palette replaces `CommandPaletteStub.tsx` entirely rather than extending it                  | The stub was intentionally minimal (three hardcoded groups, no synonym matching, disabled AI item). The full implementation requires a different component architecture with hooks, the command registry, and dynamic filtering. Extending the stub would add complexity without benefit.                                    | WS-1.4 Section 4.6 explicitly states "Phase 3 (WS-3.3) extends this into the full command palette"   |
| D-2  | Use `StructuredCommandPalette` from WS-1.7 as the execution engine, not a new implementation             | The WS-1.7 interface and its Phase 1 implementation (`StructuredCommandPalette`) already define the command matching algorithm, synonym ring integration, and `CommandResult` contract. Building a new engine would duplicate this work and violate the interface contract.                                                  | WS-1.7 Section 4.7, AD-7 interface #6                                                                |
| D-3  | Palette max width is 520px (not the Phase 1 stub's 480px)                                                | The full palette has more content (three groups + AI group + longer command labels + icons). 520px provides enough room for "Show Status of Agent Builder" labels and the "Beta" badge on the AI item without truncation, while remaining narrow enough to keep the spatial canvas visible.                                  | Engineering judgment, visual density analysis                                                        |
| D-4  | AI "Ask AI..." is always visible in the palette (not hidden when disabled)                               | Showing the disabled AI item with "Enable in Settings" text is a discovery mechanism -- it tells the operator that AI capability exists but is off. Hiding it entirely means users might never discover the feature. The disabled visual treatment (0.40 opacity) makes it non-distracting.                                  | UX pattern: discoverable features should be visible but clearly inactive                             |
| D-5  | Enter-to-AI fallback only activates when there are zero structured matches AND AI is enabled             | This prevents accidental AI queries when the user meant to select a structured command. If any structured match exists (even low-scoring), arrow keys and Enter select from the list normally. AI fallback is a deliberate choice when the structured system has no answer.                                                  | UX judgment: minimize surprise actions                                                               |
| D-6  | **[AMENDED]** The AI beta toggle is read from `ai.store.ts` (WS-3.4), not a separate `settings.store.ts` | Phase 3 Review H-2 identified that creating a separate `settings.store` with `aiCameraDirectorEnabled` would conflict with WS-3.4's `ai.store.ts` which owns `betaEnabled`. A single store owns each piece of state. The command palette is a consumer, not an owner.                                                        | Phase 3 Review H-2 resolution                                                                        |
| D-7  | Receipt generation is the responsibility of the palette (not the `StructuredCommandPalette` class)       | The `StructuredCommandPalette` class (WS-1.7) is a pure logic layer -- it matches and executes commands. Receipt generation requires access to the `ReceiptStore`, camera state for spatial location, and UI context (who initiated the command). The palette component has all this context; the execution engine does not. | Separation of concerns: execution logic vs. side effects                                             |
| D-8  | Command icons are mapped by command ID, with fallback to category icon                                   | Specific icons (Home, Compass, BookOpen, etc.) provide instant visual recognition for frequently-used commands. Category-level fallback icons (Navigation, Eye, Zap) handle the remaining commands without requiring a unique icon for every item. This scales without maintenance burden.                                   | UI pattern: specific where it matters, generic elsewhere                                             |
| D-9  | Evidence Ledger uses a hardcoded position (`offsetX: -400, offsetY: -400`) as a temporary target         | The Evidence Ledger is described as the "NW district" in combined-recommendations.md. Its exact position depends on the district layout finalized in WS-3.2. A hardcoded approximate position is used now; it will be updated when WS-3.2 establishes the Evidence Ledger's canonical world coordinates.                     | Engineering pragmatism -- same approach used for district positions in WS-1.7 ManualCameraController |
| D-10 | The `onAIQuery` prop is optional (the palette works fully without it)                                    | This decouples WS-3.3 from WS-3.4. The palette can ship and be tested before the AI Camera Director is ready. When `onAIQuery` is undefined, the AI item shows as disabled regardless of the `aiCameraDirectorEnabled` setting, providing a safe degradation.                                                                | AD-7: "the system works without AI"                                                                  |

---

## 7. Open Questions

| #    | Question                                                                                                                                                                                                                                                 | Impact                                                                                                                                                                                                 | Owner                                 | Resolution Deadline                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- | --------------------------------------------------- |
| OQ-1 | What is the canonical world position of the Evidence Ledger district? The command "Go to Evidence Ledger" needs a `CameraTarget`. The NW district position is mentioned in combined-recommendations.md but no coordinates are specified.                 | Medium -- affects Evidence Ledger navigation accuracy. Palette ships with hardcoded approximate position (`-400, -400`) that must be updated.                                                          | WS-3.2 owner / React Developer        | Before WS-3.2 evidence ledger implementation begins |
| OQ-2 | Should the "Show active runs" command navigate to the Constellation view with an active-work filter, or to a specific district? The IA assessment says "zoom to relevant station showing active work" but multiple districts have active runs.           | Medium -- affects command behavior. Current implementation navigates to Constellation (Z0) which shows aggregate active work.                                                                          | Information Architect / Product Owner | During WS-3.3 implementation                        |
| OQ-3 | Should the `CommandDialog` support a custom `dialogContentClassName` prop, or should the glass styling be applied via a wrapper component? The approach depends on how `@tarva/ui`'s `CommandDialog` exposes the underlying `DialogContent` for styling. | Low -- implementation detail. If `@tarva/ui` does not support `dialogContentClassName`, a wrapper component provides the same visual result.                                                           | React Developer                       | During implementation                               |
| OQ-4 | Should the "Open {app}" commands only appear for apps whose health status is OPERATIONAL or DEGRADED? Opening a DOWN or OFFLINE app in a new tab will show an error page.                                                                                | Low -- showing all "Open" commands is simpler and lets the operator decide. A future enhancement could show health status inline in the command item.                                                  | React Developer / UX Designer         | During implementation                               |
| OQ-5 | Should command execution close the palette immediately, or should there be a brief feedback state (receipt stamp flash, success checkmark) before closing?                                                                                               | Low -- immediate close is simpler and faster. A future enhancement could show a brief receipt animation overlay. Phase 1 stub closes immediately.                                                      | UX Designer                           | During implementation or after user testing         |
| OQ-6 | When the AI Camera Director (WS-3.4) is integrated, should the "Ask AI..." option also show a loading state while the AI processes the query (3-10s Ollama latency)? If so, what does the palette show during that time?                                 | Medium -- affects the UX of AI interaction. The palette could close immediately (AI processing happens in background with speculative camera drift per WS-3.4), or stay open with a loading indicator. | WS-3.4 owner / UX Designer            | Before WS-3.4 integration                           |

---

## 8. Risk Register

| #   | Risk                                                                                                                                                            | Likelihood | Impact                                                                                          | Mitigation                                                                                                                                                                                                                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | `@tarva/ui` `CommandDialog` does not expose a `dialogContentClassName` prop for glass styling overrides                                                         | Medium     | Medium -- glass styling is critical to the Oblivion aesthetic                                   | Three fallback approaches: (1) Wrap `CommandDialog` in a custom component that applies styles via `data-slot` CSS selectors; (2) Use Tailwind's arbitrary variant to target the internal `[role="dialog"]` element; (3) Fork the `CommandDialog` component locally with the styling built in. Option 1 is preferred.                                                          |
| R-2 | `cmdk` library's built-in search conflicts with the custom `StructuredCommandPalette` synonym matching                                                          | Medium     | High -- if both cmdk and the palette engine filter independently, results will be inconsistent  | Disable cmdk's built-in search filtering by providing a custom `filter` prop that always returns 1 (show all items). Let the `StructuredCommandPalette.getSuggestions()` handle all filtering and ranking. This is a documented cmdk pattern for custom search.                                                                                                               |
| R-3 | `StructuredCommandPalette.getSuggestions()` from WS-1.7 does not provide sufficient match quality for natural-feeling fuzzy search (e.g., typos, partial words) | Medium     | Medium -- poor search quality makes the palette frustrating                                     | Phase 3 can enhance the matching algorithm in `StructuredCommandPalette` without changing the interface. Options: (1) Add Levenshtein distance for typo tolerance; (2) Add word-boundary matching for partial words; (3) Integrate a lightweight fuzzy library like `fuse.js` (MIT, 2KB gzipped). Start with the WS-1.7 implementation; enhance if user testing reveals gaps. |
| R-4 | WS-3.4 AI Camera Director is not ready when WS-3.3 ships, leaving the "Ask AI..." option permanently disabled                                                   | High       | Low -- the palette works fully without AI. This is by design (AD-7: "system works without AI"). | The `onAIQuery` prop is optional. When undefined, the AI item shows as disabled with "Enable in Settings" text. When WS-3.4 ships, the hub layout wires the `onAIQuery` callback -- no changes to WS-3.3 code needed.                                                                                                                                                         |
| R-5 | WS-3.1 ReceiptStore is not ready when WS-3.3 ships, causing receipt generation to fail                                                                          | Medium     | Low -- receipts are a side effect, not critical path for command execution                      | The `onReceipt` callback is designed as a fire-and-forget side effect. If the `ReceiptStore` is not yet available, the hub layout can provide a no-op callback `() => {}` or an in-memory fallback (the `InMemoryReceiptStore` from WS-1.7 Phase 1 implementation). Command execution is unaffected.                                                                          |
| R-6 | "Show status of {app}" commands require station-level navigation targets that depend on WS-2.6 station panel framework having consistent station IDs            | Medium     | Medium -- commands navigate to wrong position or break                                          | Commands use `{ type: 'station', districtId, stationId: 'status' }` as the target. The `CameraController` resolves this to a position. If station positions are not yet defined, the controller falls back to district center (same behavior as WS-1.7's `ManualCameraController` for unknown stations).                                                                      |
| R-7 | **[AMENDED]** No longer applicable -- `settings.store.ts` is not created by this workstream. AI toggle is read from `ai.store.ts` (WS-3.4).                     | N/A        | N/A                                                                                             | Resolved by Phase 3 Review H-2.                                                                                                                                                                                                                                                                                                                                               |
| R-8 | Large number of commands (30+) causes the palette to feel cluttered with too many results                                                                       | Medium     | Medium -- defeats the purpose of a quick-access tool                                            | The `getSuggestions` call limits results to 20 items. When input is empty, all three groups show full command lists. When input is non-empty, only matching commands appear, which naturally filters the list. Category headings and separators provide visual grouping. If clutter is still an issue, reduce the empty-state display to show only the top 3 per category.    |

---

## Appendix A: Execution Checklist

This checklist is for the implementing agent. Execute steps in order.

```
[ ] 1. Verify WS-1.4 deliverables are in place (CommandPaletteStub.tsx, useKeyboardShortcuts.ts, ui.store with commandPaletteOpen)
[ ] 2. Verify WS-1.7 deliverables are in place (StructuredCommandPalette class, PaletteCommand type, SYNONYM_RING, createDefaultNavigationCommands)
[ ] 3. Verify WS-2.1 deliverables are in place (ui.store.startMorph action, morph state machine)
[ ] 4. Verify WS-3.4 ai.store.ts exists with betaEnabled toggle and aiSelectors.isAIAvailable selector (Section 4.1 -- owned by WS-3.4)
[ ] 5. Create src/lib/command-registry.ts (Section 4.2: all three command categories with synonym ring)
[ ] 6. Create src/hooks/useCommandPalette.ts (Section 4.3: orchestration hook)
[ ] 7. Create src/components/spatial/CommandPalette.tsx (Section 4.4: full cmdk-based UI)
[ ] 8. Update (hub)/page.tsx or (hub)/layout.tsx: replace CommandPaletteStub with CommandPalette, wire props
[ ] 9. Delete or deprecate src/components/spatial/CommandPaletteStub.tsx
[ ] 10. Verify cmdk custom filter prop disables built-in search (use StructuredCommandPalette for filtering)
[ ] 11. Verify AC-1: Cmd+K opens palette with glass styling
[ ] 12. Verify AC-2: Three command groups display when input is empty
[ ] 13. Verify AC-3 through AC-7: Synonym matching (builder, AB, agentgen, core, reasoning, receipts)
[ ] 14. Verify AC-8: District navigation triggers CameraController.navigate + morph
[ ] 15. Verify AC-9: "Go to Launch" shows Home shortcut hint, returns to hub
[ ] 16. Verify AC-10: "Open Agent Builder" opens new tab
[ ] 17. Verify AC-11: "Refresh Health Checks" triggers re-poll
[ ] 18. Verify AC-12: AI item disabled when aiSelectors.isAIAvailable is false
[ ] 19. Verify AC-13: AI item active with Beta badge when enabled
[ ] 20. Verify AC-14 and AC-15: AI forwarding on select and Enter-with-no-match
[ ] 21. Verify AC-16 and AC-17: Receipt generation with correct event types
[ ] 22. Verify AC-18: Palette closes after execution
[ ] 23. Verify AC-19 and AC-20: Empty state (without AI, with AI)
[ ] 24. Verify AC-21: Settings persist across page reload
[ ] 25. Verify AC-22: Reduced motion behavior
[ ] 26. Verify AC-23: Escape closes palette, no focus trap leaks
[ ] 27. Verify AC-24: "Show status of {app}" navigates to station
[ ] 28. Verify AC-25: Palette dimensions and glass styling match spec
[ ] 29. Verify AC-26: pnpm typecheck passes
[ ] 30. Verify AC-27: CommandPaletteStub.tsx removed from imports
[ ] 31. Verify AC-28: Input field uses Geist Mono
[ ] 32. Commit with message: "feat: full command palette with synonym ring and AI beta gate (WS-3.3)"
```

---

## Appendix B: File Manifest

| File                       | Directory                 | Action                 | Purpose                                                    |
| -------------------------- | ------------------------- | ---------------------- | ---------------------------------------------------------- |
| `ai.store.ts`              | `src/stores/`             | Read (owned by WS-3.4) | AI beta toggle -- import `useAIStore` and `aiSelectors`    |
| `command-registry.ts`      | `src/lib/`                | Create                 | Factory for all navigation, view, and action commands      |
| `useCommandPalette.ts`     | `src/hooks/`              | Create                 | Orchestration hook bridging execution engine to UI         |
| `CommandPalette.tsx`       | `src/components/spatial/` | Create                 | Full cmdk-based command palette component                  |
| `CommandPaletteStub.tsx`   | `src/components/spatial/` | Delete                 | Replaced by CommandPalette.tsx                             |
| `page.tsx` or `layout.tsx` | `app/(hub)/`              | Update                 | Replace CommandPaletteStub with CommandPalette, wire props |

---

## Appendix C: Command Inventory

Complete list of commands registered by `createFullCommandRegistry()`.

### Navigation Commands (9 commands)

| ID                   | Display Label         | Synonyms                                                              | Target                                                                        |
| -------------------- | --------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `go-home`            | Go to Launch          | home, center, atrium, overview, dashboard, sky, constellation, global | `{ type: 'home' }`                                                            |
| `go-constellation`   | Go to Constellation   | overview, dashboard, sky, constellation, global                       | `{ type: 'constellation' }`                                                   |
| `go-evidence-ledger` | Go to Evidence Ledger | evidence, ledger, receipts, audit, audit trail, EL                    | `{ type: 'position', position: { offsetX: -400, offsetY: -400, zoom: 1.0 } }` |
| `go-agent-builder`   | Go to Agent Builder   | builder, agentgen, agent gen, agent builder, AB                       | `{ type: 'district', districtId: 'agent-builder' }`                           |
| `go-tarva-chat`      | Go to Tarva Chat      | chat, tarva chat, CH                                                  | `{ type: 'district', districtId: 'tarva-chat' }`                              |
| `go-project-room`    | Go to Project Room    | projects, project room, tarva project, PR                             | `{ type: 'district', districtId: 'project-room' }`                            |
| `go-tarva-core`      | Go to TarvaCORE       | core, tarva core, reasoning, CO                                       | `{ type: 'district', districtId: 'tarva-core' }`                              |
| `go-tarva-erp`       | Go to TarvaERP        | erp, tarva erp, manufacturing, warehouse, ER                          | `{ type: 'district', districtId: 'tarva-erp' }`                               |
| `go-tarva-code`      | Go to tarvaCODE       | code, tarva code, CD                                                  | `{ type: 'district', districtId: 'tarva-code' }`                              |

### View Commands (9 commands)

| ID                          | Display Label                | Synonyms                                                                                          | Target                                                                  |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `show-alerts`               | Show Alerts                  | alert, alerts, warning, warnings, error, errors, problem, problems, issue, issues                 | `{ type: 'constellation' }`                                             |
| `show-active-runs`          | Show Active Runs             | run, runs, job, jobs, execution, executions, conversation, conversations, session, sessions, work | `{ type: 'constellation' }`                                             |
| `show-recent-receipts`      | Show Recent Receipts         | audit trail, recent events, recent receipts                                                       | Evidence Ledger position                                                |
| `show-status-agent-builder` | Show Status of Agent Builder | health agent builder, status agent builder, ops agent builder, ...                                | `{ type: 'station', districtId: 'agent-builder', stationId: 'status' }` |
| `show-status-tarva-chat`    | Show Status of Tarva Chat    | health tarva chat, status tarva chat, ...                                                         | `{ type: 'station', districtId: 'tarva-chat', stationId: 'status' }`    |
| `show-status-project-room`  | Show Status of Project Room  | health project room, status project room, ...                                                     | `{ type: 'station', districtId: 'project-room', stationId: 'status' }`  |
| `show-status-tarva-core`    | Show Status of TarvaCORE     | health tarvacore, status tarvacore, ...                                                           | `{ type: 'station', districtId: 'tarva-core', stationId: 'status' }`    |
| `show-status-tarva-erp`     | Show Status of TarvaERP      | health tarvaerp, status tarvaerp, ...                                                             | `{ type: 'station', districtId: 'tarva-erp', stationId: 'status' }`     |
| `show-status-tarva-code`    | Show Status of tarvaCODE     | health tarvacode, status tarvacode, ...                                                           | `{ type: 'station', districtId: 'tarva-code', stationId: 'status' }`    |

### Action Commands (5 commands)

| ID                   | Display Label         | Synonyms                                     | Behavior                                         |
| -------------------- | --------------------- | -------------------------------------------- | ------------------------------------------------ |
| `open-agent-builder` | Open Agent Builder    | launch agent builder, open agent builder     | `window.open('http://localhost:3000', '_blank')` |
| `open-tarva-chat`    | Open Tarva Chat       | launch tarva chat, open tarva chat           | `window.open('http://localhost:4000', '_blank')` |
| `open-project-room`  | Open Project Room     | launch project room, open project room       | `window.open('http://localhost:3010', '_blank')` |
| `open-tarva-erp`     | Open TarvaERP         | launch tarvaerp, open tarvaerp               | `window.open('http://localhost:4000', '_blank')` |
| `refresh-health`     | Refresh Health Checks | refresh, reload, poll, check health, re-poll | `queryClient.invalidateQueries(['telemetry'])`   |

### AI Command (1 conditional)

| ID       | Display Label | Condition                                                     | Behavior                                                    |
| -------- | ------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| `ask-ai` | Ask AI...     | `aiSelectors.isAIAvailable === true` (from WS-3.4 `ai.store`) | Forward input to `AIRouter.route('camera-director', input)` |

**Total: 24 structured commands + 1 conditional AI command.**

---

## Appendix D: Synonym Ring Reference

The complete synonym ring from IA Assessment Section 4, as defined in `src/lib/interfaces/command-palette.ts` (WS-1.7). Reproduced here for quick reference during implementation.

| Canonical Name  | Synonyms                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Agent Builder   | builder, agentgen, agent gen, agent builder, AB                                                   |
| Tarva Chat      | chat, tarva chat, CH                                                                              |
| Project Room    | projects, project room, tarva project, PR                                                         |
| TarvaCORE       | core, tarva core, reasoning, CO                                                                   |
| TarvaERP        | erp, tarva erp, manufacturing, warehouse, ER                                                      |
| tarvaCODE       | code, tarva code, CD                                                                              |
| Evidence Ledger | evidence, ledger, receipts, audit, audit trail, EL                                                |
| Constellation   | overview, dashboard, sky, constellation, global                                                   |
| Status          | health, status, ops, operations, diagnostics                                                      |
| Activity        | run, runs, job, jobs, execution, executions, conversation, conversations, session, sessions, work |
| Alert           | alert, alerts, warning, warnings, error, errors, problem, problems, issue, issues                 |
