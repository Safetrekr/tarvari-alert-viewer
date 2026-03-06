'use client'

import { useSyncExternalStore } from 'react'

/** Max-width pixel value for the mobile media query. Exported for testing. */
export const MOBILE_BREAKPOINT = 767

/**
 * Detect mobile viewport via matchMedia.
 *
 * Returns `null` on the server and during the first client render
 * (before useEffect fires). Returns `true` when the viewport is
 * <= 767px wide, `false` otherwise. Updates live on window resize
 * and orientation change via the matchMedia 'change' event.
 */
const QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot(): boolean | null {
  return null
}

export function useIsMobile(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot as () => boolean)
}
