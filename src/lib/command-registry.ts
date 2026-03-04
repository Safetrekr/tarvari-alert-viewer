/**
 * Command registry for the full command palette.
 *
 * Creates all 24 structured commands across three IA categories:
 * - Navigation (9): go to districts, evidence ledger, hub, constellation
 * - View (9): zoom in/out, zoom to levels, toggle minimap/effects/breadcrumb
 * - Action (5): open apps in new tab, refresh telemetry, logout
 *
 * Each command includes its full synonym set from the IA synonym ring
 * (SYNONYM_RING in command-palette.ts) for fuzzy matching.
 *
 * The conditional "Ask AI..." command (1) is handled separately in the
 * component layer, gated by settings.store.aiCameraDirectorEnabled.
 *
 * @module command-registry
 * @see WS-3.3 Section 4.2
 * @see IA Assessment Section 4
 */

import type { AppIdentifier } from '@/lib/interfaces/types'
import type {
  PaletteCommand,
  CommandCategory,
  CommandResult,
} from '@/lib/interfaces/command-palette'
import { SYNONYM_RING } from '@/lib/interfaces/command-palette'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import {
  returnToHub,
  flyToDistrict,
  flyToWorldPoint,
  zoomIn,
  zoomOut,
} from '@/lib/spatial-actions'
import { useCameraStore } from '@/stores/camera.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useAuthStore } from '@/stores/auth.store'
import { ZOOM_DEFAULT } from '@/lib/constants'

// ============================================================================
// App Launch URLs (localhost)
// ============================================================================

/**
 * Localhost URLs for each Tarva app.
 * Per CLAUDE.md: Port 3000 = Agent Builder, 4000 = Chat, 3005 = Project Room.
 * TarvaERP is a desktop app (no web URL). TarvaCORE and tarvaCODE likewise.
 */
const APP_URLS: Readonly<Partial<Record<AppIdentifier, string>>> = {
  'agent-builder': 'http://localhost:3000',
  'tarva-chat': 'http://localhost:4000',
  'project-room': 'http://localhost:3005',
} as const

// ============================================================================
// Helpers
// ============================================================================

/** Find synonyms for a canonical name in the IA synonym ring. */
function findSynonyms(canonical: string): readonly string[] {
  const entry = SYNONYM_RING.find((s) => s.canonical === canonical)
  return entry?.synonyms ?? []
}

/** Create a success result with a message. */
function success(message: string): CommandResult {
  return { success: true, message }
}

// ============================================================================
// Navigation Commands (9)
// ============================================================================

/**
 * Create the 9 navigation commands.
 *
 * go-to-{6 districts}, go-to-evidence-ledger, go-to-hub, go-to-constellation
 */
function createNavigationCommands(): PaletteCommand[] {
  const commands: PaletteCommand[] = []

  // 1. Go to Hub (return to Launch Atrium at Z1)
  commands.push({
    id: 'go-to-hub',
    verb: 'go',
    object: 'hub',
    displayLabel: 'Go to Hub',
    synonyms: ['home', 'center', 'atrium', 'launch', 'hub'],
    category: 'navigation' as CommandCategory,
    handler: async (): Promise<CommandResult> => {
      returnToHub()
      return success('Returned to Hub')
    },
  })

  // 2. Go to Constellation (zoom out to Z0)
  commands.push({
    id: 'go-to-constellation',
    verb: 'go',
    object: 'constellation',
    displayLabel: 'Go to Constellation',
    synonyms: [...findSynonyms('Constellation')],
    category: 'navigation' as CommandCategory,
    handler: async (): Promise<CommandResult> => {
      flyToWorldPoint(0, 0, 0.15)
      return success('Zoomed to Constellation view')
    },
  })

  // 3. Go to Evidence Ledger (NW quadrant)
  commands.push({
    id: 'go-to-evidence-ledger',
    verb: 'go',
    object: 'evidence-ledger',
    displayLabel: 'Go to Evidence Ledger',
    synonyms: [...findSynonyms('Evidence Ledger')],
    category: 'navigation' as CommandCategory,
    handler: async (): Promise<CommandResult> => {
      flyToWorldPoint(-400, -400, 1.0)
      return success('Navigated to Evidence Ledger')
    },
  })

  // 4-9. Go to each of the 6 districts
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

    commands.push({
      id: `go-to-${appId}`,
      verb: 'go',
      object: appId,
      displayLabel: `Go to ${displayName}`,
      synonyms: [...synonyms],
      category: 'navigation' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        flyToDistrict(appId)
        return success(`Navigated to ${displayName}`)
      },
    })
  }

  return commands
}

// ============================================================================
// View Commands (9)
// ============================================================================

/**
 * Create the 9 view commands.
 *
 * zoom-in, zoom-out, zoom-to-z0/z1/z2/z3, toggle-minimap/effects/breadcrumb
 */
function createViewCommands(): PaletteCommand[] {
  return [
    // Zoom In
    {
      id: 'zoom-in',
      verb: 'zoom',
      object: 'in',
      displayLabel: 'Zoom In',
      synonyms: ['zoom in', 'closer', 'magnify', '+'],
      category: 'view' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        zoomIn()
        return success('Zoomed in')
      },
    },
    // Zoom Out
    {
      id: 'zoom-out',
      verb: 'zoom',
      object: 'out',
      displayLabel: 'Zoom Out',
      synonyms: ['zoom out', 'farther', 'shrink', '-'],
      category: 'view' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        zoomOut()
        return success('Zoomed out')
      },
    },
    // Zoom to Z0 (Constellation)
    {
      id: 'zoom-to-z0',
      verb: 'zoom',
      object: 'z0',
      displayLabel: 'Zoom to Z0 (Constellation)',
      synonyms: ['z0', 'constellation zoom', 'far out', 'global view'],
      category: 'view' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        flyToWorldPoint(0, 0, 0.15)
        return success('Zoomed to Z0 Constellation level')
      },
    },
    // Zoom to Z1 (Atrium)
    {
      id: 'zoom-to-z1',
      verb: 'zoom',
      object: 'z1',
      displayLabel: 'Zoom to Z1 (Atrium)',
      synonyms: ['z1', 'atrium zoom', 'default zoom', 'home zoom'],
      category: 'view' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        const { viewportWidth, viewportHeight } = useCameraStore.getState()
        const targetOffsetX = viewportWidth / 2
        const targetOffsetY = viewportHeight / 2
        useCameraStore.getState().flyTo(targetOffsetX, targetOffsetY, ZOOM_DEFAULT)
        return success('Zoomed to Z1 Atrium level')
      },
    },
    // Zoom to Z2 (District)
    {
      id: 'zoom-to-z2',
      verb: 'zoom',
      object: 'z2',
      displayLabel: 'Zoom to Z2 (District)',
      synonyms: ['z2', 'district zoom', 'close'],
      category: 'view' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        const { viewportWidth, viewportHeight } = useCameraStore.getState()
        // Zoom to 1.0 centered on current viewport center
        const cursorX = viewportWidth / 2
        const cursorY = viewportHeight / 2
        useCameraStore.getState().zoomTo(1.0, cursorX, cursorY)
        return success('Zoomed to Z2 District level')
      },
    },
    // Zoom to Z3 (Station)
    {
      id: 'zoom-to-z3',
      verb: 'zoom',
      object: 'z3',
      displayLabel: 'Zoom to Z3 (Station)',
      synonyms: ['z3', 'station zoom', 'detail', 'close up'],
      category: 'view' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        const { viewportWidth, viewportHeight } = useCameraStore.getState()
        const cursorX = viewportWidth / 2
        const cursorY = viewportHeight / 2
        useCameraStore.getState().zoomTo(1.8, cursorX, cursorY)
        return success('Zoomed to Z3 Station level')
      },
    },
    // Toggle Minimap
    {
      id: 'toggle-minimap',
      verb: 'toggle',
      object: 'minimap',
      displayLabel: 'Toggle Minimap',
      synonyms: ['minimap', 'mini map', 'map', 'overview map', 'show minimap', 'hide minimap'],
      category: 'view' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        useSettingsStore.getState().toggleMinimap()
        const visible = useSettingsStore.getState().minimapVisible
        return success(`Minimap ${visible ? 'shown' : 'hidden'}`)
      },
    },
    // Toggle Effects
    {
      id: 'toggle-effects',
      verb: 'toggle',
      object: 'effects',
      displayLabel: 'Toggle Effects',
      synonyms: [
        'effects',
        'particles',
        'ambient',
        'visual effects',
        'show effects',
        'hide effects',
      ],
      category: 'view' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        useSettingsStore.getState().toggleEffects()
        const enabled = useSettingsStore.getState().effectsEnabled
        return success(`Visual effects ${enabled ? 'enabled' : 'disabled'}`)
      },
    },
    // Toggle Breadcrumb
    {
      id: 'toggle-breadcrumb',
      verb: 'toggle',
      object: 'breadcrumb',
      displayLabel: 'Toggle Breadcrumb',
      synonyms: ['breadcrumb', 'path', 'location bar', 'show breadcrumb', 'hide breadcrumb'],
      category: 'view' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        useSettingsStore.getState().toggleBreadcrumb()
        const visible = useSettingsStore.getState().breadcrumbVisible
        return success(`Breadcrumb ${visible ? 'shown' : 'hidden'}`)
      },
    },
  ]
}

// ============================================================================
// Action Commands (5)
// ============================================================================

/**
 * Create the 5 action commands.
 *
 * open-agent-builder, open-tarva-chat, open-project-room,
 * refresh-telemetry, logout
 */
function createActionCommands(
  onRefresh: () => Promise<void>,
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
      synonyms: [
        `launch ${displayName.toLowerCase()}`,
        `open ${displayName.toLowerCase()}`,
        displayName.toLowerCase(),
      ],
      category: 'action' as CommandCategory,
      handler: async (): Promise<CommandResult> => {
        window.open(url, '_blank', 'noopener,noreferrer')
        return success(`Opened ${displayName} in new tab`)
      },
    })
  }

  // Refresh Telemetry
  commands.push({
    id: 'refresh-telemetry',
    verb: 'refresh',
    object: 'telemetry',
    displayLabel: 'Refresh Telemetry',
    synonyms: [
      'refresh',
      'reload',
      'poll',
      'check health',
      're-poll',
      'refresh health',
      'refresh telemetry',
    ],
    category: 'action' as CommandCategory,
    handler: async (): Promise<CommandResult> => {
      await onRefresh()
      return success('Telemetry refreshed')
    },
  })

  // Logout
  commands.push({
    id: 'logout',
    verb: 'logout',
    object: 'session',
    displayLabel: 'Logout',
    synonyms: ['logout', 'log out', 'sign out', 'signout', 'exit'],
    category: 'action' as CommandCategory,
    handler: async (): Promise<CommandResult> => {
      useAuthStore.getState().logout()
      return success('Logged out')
    },
  })

  return commands
}

// ============================================================================
// Full Registry
// ============================================================================

/**
 * Create the complete command set (24 commands).
 *
 * Call this once during palette initialization. The returned commands
 * are registered with the StructuredCommandPalette instance.
 *
 * @param onRefresh - Callback to trigger immediate telemetry refresh.
 */
export function createFullCommandRegistry(
  onRefresh: () => Promise<void>,
): PaletteCommand[] {
  return [
    ...createNavigationCommands(),
    ...createViewCommands(),
    ...createActionCommands(onRefresh),
  ]
}

// Re-export individual factories for testing
export { createNavigationCommands, createViewCommands, createActionCommands }
