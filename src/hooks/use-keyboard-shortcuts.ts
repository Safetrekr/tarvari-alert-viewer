/**
 * Global keyboard shortcut listener hook.
 *
 * Attaches a `keydown` listener on `window` that matches incoming events
 * against a declarative list of shortcut configurations. Ignores events
 * when an interactive element (input, textarea, contenteditable) is focused,
 * except for Escape which always fires.
 *
 * @module use-keyboard-shortcuts
 * @see WS-1.4 Deliverable 4.5
 */

'use client'

import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KeyboardShortcutConfig {
  /** The `event.key` value to match (case-insensitive comparison). */
  key: string
  /** Whether the meta/ctrl modifier is required (Cmd on macOS, Ctrl elsewhere). */
  meta?: boolean
  /** Whether the Shift modifier is required. */
  shift?: boolean
  /** Handler to invoke when the shortcut fires. */
  handler: () => void
  /** Prevent the browser's default behavior for this key combo. */
  preventDefault?: boolean
  /** Human-readable label for display in command palette or help overlay. */
  label: string
}

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

/**
 * Detect whether the current platform is macOS.
 *
 * Uses `navigator.userAgentData.platform` (modern) with fallback to
 * `navigator.platform` (legacy). Returns `false` on the server.
 */
function isMacOS(): boolean {
  if (typeof navigator === 'undefined') return false

  // Modern API (Chromium 93+)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uaData = (navigator as any).userAgentData
  if (uaData?.platform) {
    return uaData.platform === 'macOS'
  }

  // Legacy fallback
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? '')
}

/**
 * Returns the platform-appropriate modifier key label.
 *
 * - macOS: returns the Unicode Command symbol
 * - Other: returns "Ctrl"
 */
export function getPlatformModifier(): string {
  return isMacOS() ? '\u2318' : 'Ctrl'
}

// ---------------------------------------------------------------------------
// Interactive element check
// ---------------------------------------------------------------------------

/**
 * Returns true if the given element is an interactive form control
 * where keyboard shortcuts should be suppressed.
 */
function isInteractiveElement(element: Element | null): boolean {
  if (!element) return false
  const tag = element.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (element.getAttribute('contenteditable') === 'true') return true
  return false
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Register global keyboard shortcuts.
 *
 * @param shortcuts - Array of shortcut configurations to listen for.
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: 'Home', handler: returnToHub, label: 'Return to Hub' },
 *   { key: 'k', meta: true, handler: togglePalette, preventDefault: true, label: 'Command Palette' },
 *   { key: 'Escape', handler: closePalette, label: 'Close' },
 * ])
 * ```
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcutConfig[],
): void {
  useEffect(() => {
    const mac = isMacOS()

    function onKeyDown(event: KeyboardEvent) {
      // Escape always fires (even in inputs) -- check it first
      const isEscape = event.key === 'Escape'

      // For non-Escape keys, suppress when interactive element is focused
      if (!isEscape && isInteractiveElement(document.activeElement)) {
        return
      }

      for (const shortcut of shortcuts) {
        // Match key (case-insensitive)
        if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) continue

        // Match modifier
        if (shortcut.meta) {
          const modifierPressed = mac ? event.metaKey : event.ctrlKey
          if (!modifierPressed) continue
        }

        // Match shift
        if (shortcut.shift && !event.shiftKey) continue

        // Shortcut matched
        if (shortcut.preventDefault) {
          event.preventDefault()
        }

        shortcut.handler()
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [shortcuts])
}
