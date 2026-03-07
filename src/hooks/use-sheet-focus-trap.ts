'use client'

import { useEffect, useRef, useCallback } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useSheetFocusTrap(isOpen: boolean) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    // Save the element that had focus before the sheet opened
    previousActiveRef.current = document.activeElement as HTMLElement | null

    // Focus first interactive element in the sheet
    const timer = setTimeout(() => {
      const sheet = sheetRef.current
      if (!sheet) return
      const first = sheet.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      first?.focus()
    }, 100) // slight delay for sheet animation

    return () => {
      clearTimeout(timer)
      // Return focus on close
      previousActiveRef.current?.focus()
    }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || e.key !== 'Tab') return

      const sheet = sheetRef.current
      if (!sheet) return

      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [isOpen],
  )

  return { sheetRef, handleKeyDown }
}
