'use client'

import { type ComponentProps } from 'react'
import { CardFooter, Button } from '@tarva/ui'
import { cn } from '@/lib/utils'
import { useStationContext } from './station-context'
import type { StationAction } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Props
// ============================================================================

export interface StationActionsProps extends ComponentProps<'div'> {
  /**
   * Optional override for the actions to render.
   * Defaults to `template.layout.actions` from context.
   */
  readonly actions?: readonly StationAction[]
  /**
   * Callback invoked when an action command is executed.
   * The station framework calls `stampReceipt` before this callback.
   *
   * @param command - The resolved command string from StationAction.command.
   * @param actionId - The StationAction.id that was triggered.
   */
  readonly onCommand?: (command: string, actionId: string) => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Station actions zone (Zone 3 of 3).
 *
 * Renders 1-3 @tarva/ui Button components from the template's action list.
 * Every button click:
 * 1. Calls `stampReceipt(actionId, label)` to generate a receipt record
 * 2. Fires the receipt stamp animation overlay
 * 3. Resolves template variables in the command string (e.g., `${districtId}`)
 * 4. Calls `onCommand(resolvedCommand, actionId)` for the consumer to handle
 *
 * Button typography follows VISUAL-DESIGN-SPEC.md Z3:
 * - Label: 13px, Geist Sans, 500 weight, 0.01em tracking
 */
export function StationActions({
  actions: actionsProp,
  onCommand,
  className,
  ...props
}: StationActionsProps) {
  const { districtId, template, stampReceipt } = useStationContext()

  const actions = actionsProp ?? template.layout.actions

  if (actions.length === 0) return null

  /**
   * Resolve template variables in a command string.
   * Supported variables:
   * - ${districtId} -> the current district identifier
   * - ${stationId} -> the current station name (lowercase)
   *
   * Per WS-1.7 Design Decision D-9: "StationAction.command uses
   * template syntax that is resolved at runtime by the station component."
   */
  function resolveCommand(command: string): string {
    return command
      .replace(/\$\{districtId\}/g, districtId)
      .replace(/\$\{stationId\}/g, template.name)
  }

  function handleAction(action: StationAction): void {
    // Step 1: Receipt stamp (trace + timestamp + result summary).
    stampReceipt(action.id, action.label)

    // Step 2: Resolve template variables and fire the command.
    const resolved = resolveCommand(action.command)
    onCommand?.(resolved, action.id)
  }

  return (
    <CardFooter
      className={cn(
        'flex items-center gap-2 border-t border-white/[0.04] px-5 pt-3 pb-4',
        className
      )}
      {...props}
    >
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant}
          size="sm"
          onClick={() => handleAction(action)}
          className="font-sans text-[13px] font-medium tracking-[0.01em]"
        >
          {action.label}
        </Button>
      ))}
    </CardFooter>
  )
}
