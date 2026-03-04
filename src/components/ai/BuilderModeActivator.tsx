/**
 * BuilderModeActivator -- keyboard shortcut listener for Builder Mode.
 *
 * Renders nothing visible. Listens for Ctrl+Shift+B (Cmd+Shift+B on macOS)
 * and activates Builder Mode when the gate conditions are met.
 * Mount this component inside the hub layout.
 *
 * References: WS-4.3 builder-gate.ts, WS-3.4 (AI beta toggle pattern)
 */

'use client'

import { useEffect } from 'react'
import { isBuilderShortcut } from '@/lib/ai/builder-gate'
import type { UseBuilderModeReturn } from '@/hooks/use-builder-mode'

interface BuilderModeActivatorProps {
  readonly builder: UseBuilderModeReturn
}

export function BuilderModeActivator({ builder }: BuilderModeActivatorProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isBuilderShortcut(event)) {
        event.preventDefault()

        if (builder.panelOpen) {
          builder.close()
        } else if (builder.gateResult.allowed) {
          builder.open()
        }
        // If gate is not allowed, silently ignore.
        // The shortcut is hidden -- users who don't know about it won't be confused.
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [builder])

  // This component renders nothing.
  return null
}
