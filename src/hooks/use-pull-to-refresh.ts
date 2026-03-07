'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const PULL_THRESHOLD = 60
const MAX_PULL = 100
const RESISTANCE_FACTOR = 0.4

export interface PullToRefreshState {
  pullDistance: number
  isRefreshing: boolean
  isPulling: boolean
}

interface UsePullToRefreshOptions {
  enabled?: boolean
  queryKeys?: string[][]
  scrollRef?: React.RefObject<HTMLElement | null>
}

/**
 * Custom pull-to-refresh gesture for mobile tabs.
 * Invalidates specified TanStack Query keys on pull release.
 */
export function usePullToRefresh({
  enabled = true,
  queryKeys = [],
  scrollRef,
}: UsePullToRefreshOptions): PullToRefreshState {
  const queryClient = useQueryClient()
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  const startYRef = useRef(0)
  const pullingRef = useRef(false)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isRefreshing) return
      const el = scrollRef?.current
      if (el && el.scrollTop > 0) return
      startYRef.current = e.touches[0].clientY
    },
    [enabled, isRefreshing, scrollRef],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isRefreshing || startYRef.current === 0) return
      const el = scrollRef?.current
      if (el && el.scrollTop > 0) {
        startYRef.current = 0
        return
      }

      const delta = e.touches[0].clientY - startYRef.current
      if (delta <= 0) {
        if (pullingRef.current) {
          setPullDistance(0)
          setIsPulling(false)
          pullingRef.current = false
        }
        return
      }

      e.preventDefault()
      pullingRef.current = true
      setIsPulling(true)

      // Rubber-band effect past threshold
      const distance =
        delta <= PULL_THRESHOLD
          ? delta
          : PULL_THRESHOLD + (delta - PULL_THRESHOLD) * RESISTANCE_FACTOR
      setPullDistance(Math.min(distance, MAX_PULL))
    },
    [enabled, isRefreshing, scrollRef],
  )

  const handleTouchEnd = useCallback(() => {
    if (!pullingRef.current) return
    pullingRef.current = false

    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true)
      setPullDistance(PULL_THRESHOLD) // Hold at threshold during refresh

      // Haptic feedback
      try {
        navigator.vibrate?.(10)
      } catch {
        // Not available
      }

      // Invalidate queries
      const promises = queryKeys.map((key) =>
        queryClient.invalidateQueries({ queryKey: key }),
      )
      void Promise.all(promises).finally(() => {
        setIsRefreshing(false)
        setPullDistance(0)
        setIsPulling(false)
      })
    } else {
      setPullDistance(0)
      setIsPulling(false)
    }
  }, [pullDistance, queryKeys, queryClient])

  useEffect(() => {
    const el = scrollRef?.current ?? document
    const target = el as EventTarget

    target.addEventListener('touchstart', handleTouchStart as EventListener, {
      passive: true,
    })
    target.addEventListener('touchmove', handleTouchMove as EventListener, {
      passive: false,
    })
    target.addEventListener('touchend', handleTouchEnd as EventListener, {
      passive: true,
    })

    return () => {
      target.removeEventListener('touchstart', handleTouchStart as EventListener)
      target.removeEventListener('touchmove', handleTouchMove as EventListener)
      target.removeEventListener('touchend', handleTouchEnd as EventListener)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, scrollRef])

  return { pullDistance, isRefreshing, isPulling }
}
