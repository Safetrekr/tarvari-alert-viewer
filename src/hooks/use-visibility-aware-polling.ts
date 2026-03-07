'use client'

import { useState, useEffect } from 'react'

/**
 * Returns true when the page is visible, false when hidden.
 * Use to gate TanStack Query polling:
 *
 *   const isVisible = useVisibilityAwarePolling()
 *   useQuery({
 *     refetchInterval: isVisible ? 30_000 : false,
 *   })
 */
export function useVisibilityAwarePolling(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(
    () => typeof document !== 'undefined' ? document.visibilityState === 'visible' : true,
  )

  useEffect(() => {
    const handler = () => setIsVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return isVisible
}
