'use client'

import { useRef, useCallback, useState, useEffect } from 'react'

export interface UseLongPressOptions {
  onTap: () => void
  onLongPress: () => void
  threshold?: number
  haptic?: boolean
  enabled?: boolean
}

export interface UseLongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
  onPointerLeave: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  isPressed: boolean
}

export function useLongPress({
  onTap,
  onLongPress,
  threshold = 500,
  haptic = true,
  enabled = true,
}: UseLongPressOptions): UseLongPressHandlers {
  const [isPressed, setIsPressed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsPressed(false)
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return
      startPosRef.current = { x: e.clientX, y: e.clientY }
      firedRef.current = false
      setIsPressed(true)
      timerRef.current = setTimeout(() => {
        firedRef.current = true
        setIsPressed(false)
        if (haptic) navigator.vibrate?.(10)
        onLongPress()
      }, threshold)
    },
    [enabled, threshold, haptic, onLongPress],
  )

  const onPointerUp = useCallback(
    (_e: React.PointerEvent) => {
      if (!firedRef.current && timerRef.current) {
        onTap()
      }
      clear()
      firedRef.current = false
    },
    [onTap, clear],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPressed) return
      const dx = e.clientX - startPosRef.current.x
      const dy = e.clientY - startPosRef.current.y
      if (Math.hypot(dx, dy) > 10) {
        clear()
        firedRef.current = false
      }
    },
    [isPressed, clear],
  )

  const onPointerCancel = useCallback(() => {
    clear()
    firedRef.current = false
  }, [clear])

  const onPointerLeave = useCallback(() => {
    clear()
    firedRef.current = false
  }, [clear])

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (enabled) e.preventDefault()
    },
    [enabled],
  )

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    onPointerMove,
    onContextMenu,
    isPressed,
  }
}
