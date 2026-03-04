/**
 * CommandPalette -- full production command palette for Tarva Launch.
 *
 * Replaces the Phase 1 CommandPaletteStub. Uses cmdk (via @tarva/ui
 * Command primitives) with strong glass styling per VISUAL-DESIGN-SPEC.md,
 * real-time fuzzy search via the IA synonym ring, and a conditional
 * "Ask AI..." natural language option gated by settings.store.
 *
 * Three structured command groups:
 * - Navigation (9): districts, evidence ledger, hub, constellation
 * - View (9): zoom controls, toggle minimap/effects/breadcrumb
 * - Action (5): open apps, refresh telemetry, logout
 *
 * Plus one conditional AI command:
 * - Ask AI... (gated by settings.aiCameraDirectorEnabled)
 *
 * Uses raw Command + Dialog components instead of CommandDialog
 * so we can pass a custom cmdk `filter` prop that returns 1 for
 * all items, delegating filtering to StructuredCommandPalette's
 * getSuggestions() which uses the IA synonym ring for fuzzy matching.
 *
 * @module CommandPalette
 * @see WS-3.3 Section 4.5
 * @see IA Assessment Section 4 (Command Palette Design)
 * @see VISUAL-DESIGN-SPEC.md Section 1.7 (Strong Glass Panel)
 */

'use client'

import { useCallback, useState } from 'react'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
  Dialog,
  DialogContent,
  DialogTitle,
  Badge,
} from '@tarva/ui'
import {
  Home,
  Compass,
  BookOpen,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  Map,
  Type,
  Sparkles,
  ExternalLink,
  RefreshCw,
  LogOut,
  Zap,
} from 'lucide-react'
import { useCommandPalette } from '@/hooks/use-command-palette'
import { useCameraDirector } from '@/hooks/use-camera-director'
import type { PaletteSuggestion } from '@/lib/interfaces/command-palette'

import '@/styles/command-palette.css'

// ============================================================================
// Icon Mapping
// ============================================================================

/**
 * Map command IDs to specific Lucide icons for visual distinction.
 * Falls back to category icons if no specific match.
 */
const COMMAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // Navigation
  'go-to-hub': Home,
  'go-to-constellation': Compass,
  'go-to-evidence-ledger': BookOpen,
  // View -- zoom
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
  'zoom-to-z0': Maximize,
  'zoom-to-z1': Maximize,
  'zoom-to-z2': Maximize,
  'zoom-to-z3': Maximize,
  // View -- toggles
  'toggle-minimap': Map,
  'toggle-effects': Eye,
  'toggle-breadcrumb': Type,
  // Action
  'refresh-telemetry': RefreshCw,
  'logout': LogOut,
}

/** Category-level fallback icons. */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  navigation: Navigation,
  view: Eye,
  action: Zap,
}

/** Shortcut hints for specific commands. */
const COMMAND_SHORTCUTS: Record<string, string> = {
  'go-to-hub': 'Home',
}

// ============================================================================
// Props
// ============================================================================

interface CommandPaletteProps {
  /**
   * Callback to trigger immediate telemetry refresh.
   * Typically: `() => queryClient.invalidateQueries({ queryKey: ['telemetry'] })`
   */
  onRefresh: () => Promise<void>
}

// ============================================================================
// Component
// ============================================================================

export function CommandPalette({ onRefresh }: CommandPaletteProps) {
  const {
    isOpen,
    setOpen,
    getSuggestions,
    executeById,
    aiEnabled,
  } = useCommandPalette(onRefresh)

  const { processQuery } = useCameraDirector()

  // Track the current input for filtering and AI forwarding
  const [inputValue, setInputValue] = useState('')

  // Get current suggestions based on input (StructuredCommandPalette handles filtering)
  const suggestions = getSuggestions(inputValue, 30)

  // Group suggestions by category
  const navigationSuggestions = suggestions.filter(
    (s) => s.command.category === 'navigation',
  )
  const viewSuggestions = suggestions.filter(
    (s) => s.command.category === 'view',
  )
  const actionSuggestions = suggestions.filter(
    (s) => s.command.category === 'action',
  )

  // Handle command selection from the list
  const handleSelect = useCallback(
    async (commandId: string) => {
      await executeById(commandId)
      setInputValue('')
    },
    [executeById],
  )

  // Handle "Ask AI..." selection -- forwards to AI Camera Director
  const handleAskAI = useCallback(async () => {
    const query = inputValue.trim()
    if (!query) return

    setInputValue('')
    setOpen(false)

    try {
      await processQuery(query)
    } catch (err) {
      console.warn('[CommandPalette] AI query failed:', err)
    }
  }, [inputValue, setOpen, processQuery])

  // Reset input when dialog closes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpen(open)
      if (!open) {
        setInputValue('')
      }
    },
    [setOpen],
  )

  // Render icon for a command
  const renderIcon = (suggestion: PaletteSuggestion) => {
    const SpecificIcon = COMMAND_ICONS[suggestion.command.id]
    const CategoryIcon = CATEGORY_ICONS[suggestion.command.category]
    const Icon = SpecificIcon ?? CategoryIcon
    return Icon ? (
      <Icon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    ) : null
  }

  // Render a command group if it has items
  const renderGroup = (
    heading: string,
    items: PaletteSuggestion[],
    showSeparatorBefore: boolean,
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
            >
              {renderIcon(suggestion)}
              <span className="flex-1">{suggestion.command.displayLabel}</span>
              {COMMAND_SHORTCUTS[suggestion.command.id] && (
                <CommandShortcut>
                  {COMMAND_SHORTCUTS[suggestion.command.id]}
                </CommandShortcut>
              )}
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
    <div className="command-palette-glass">
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="overflow-hidden p-0 shadow-lg"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            Tarva Launch Command Palette
          </DialogTitle>
          <Command
            /**
             * Custom filter: return 1 for ALL items, effectively disabling
             * cmdk's built-in search. Filtering is handled by our
             * StructuredCommandPalette.getSuggestions() which uses the
             * IA synonym ring for fuzzy matching.
             *
             * This is a documented cmdk pattern for custom search.
             * @see SOW WS-3.3 Risk R-2
             */
            filter={() => 1}
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          >
            <CommandInput
              placeholder="Navigate, zoom, or search commands..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList className="max-h-[360px]">
              {/* Custom empty state */}
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <p className="text-sm opacity-60">No matching commands</p>
                  <p className="text-xs opacity-40">
                    Try &quot;go [app name]&quot;, &quot;zoom [level]&quot;, or
                    &quot;open [app]&quot;
                  </p>
                  {aiEnabled && inputValue.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={handleAskAI}
                      className="mt-2 flex items-center gap-2 rounded-md bg-orange-500/10 px-3 py-1.5 text-xs font-medium tracking-wide text-orange-400 transition-colors hover:bg-orange-500/20"
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
              {renderGroup(
                'View',
                viewSuggestions,
                navigationSuggestions.length > 0,
              )}

              {/* Action commands */}
              {renderGroup(
                'Actions',
                actionSuggestions,
                navigationSuggestions.length > 0 || viewSuggestions.length > 0,
              )}

              {/* AI group -- always rendered, conditional behavior */}
              <CommandSeparator />
              <CommandGroup heading="AI">
                {aiEnabled ? (
                  <CommandItem
                    value="ask-ai"
                    onSelect={handleAskAI}
                  >
                    <Sparkles className="mr-2 h-4 w-4 shrink-0 text-orange-400" />
                    <span className="flex-1">
                      Ask AI...
                      {inputValue.trim().length > 0 && (
                        <span className="ml-2 text-xs opacity-50">
                          &quot;{inputValue.trim().slice(0, 40)}
                          {inputValue.trim().length > 40 ? '...' : ''}&quot;
                        </span>
                      )}
                    </span>
                    <Badge
                      variant="outline"
                      className="ml-2 border-orange-500/30 text-[9px] font-medium tracking-wider text-orange-400 uppercase"
                    >
                      Beta
                    </Badge>
                  </CommandItem>
                ) : (
                  <CommandItem disabled>
                    <Sparkles className="mr-2 h-4 w-4 shrink-0 opacity-40" />
                    <span className="flex-1">Ask AI...</span>
                    <span className="text-xs opacity-40">
                      Enable in Settings
                    </span>
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  )
}
