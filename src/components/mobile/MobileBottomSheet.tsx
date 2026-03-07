'use client'

import '@/styles/mobile-bottom-sheet.css'

import { useRef, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react'
import type { PanInfo } from 'motion/react'
import type { BottomSheetConfig } from '@/lib/interfaces/mobile'

export interface MobileBottomSheetProps {
  isOpen: boolean
  onDismiss: () => void
  config: BottomSheetConfig
  children: React.ReactNode
  ariaLabel?: string
  onSnapChange?: (snapIndex: number) => void
}

const SPRING = { type: 'spring' as const, stiffness: 400, damping: 35, mass: 0.8 }
const DISMISS_VELOCITY = 500
const PROMOTE_VELOCITY = 500

function snapPercentsToPixels(percents: readonly number[], vh: number): number[] {
  // Convert percentage of viewport height to Y position from top
  // 70% snap = sheet occupies 70% of viewport = top edge at 30% from top
  return percents.map((p) => vh * (1 - p / 100))
}

function findNearestSnap(y: number, snaps: number[]): number {
  let minDist = Infinity
  let nearest = 0
  for (let i = 0; i < snaps.length; i++) {
    const dist = Math.abs(y - snaps[i])
    if (dist < minDist) {
      minDist = dist
      nearest = i
    }
  }
  return nearest
}

export function MobileBottomSheet({
  isOpen,
  onDismiss,
  config,
  children,
  ariaLabel,
  onSnapChange,
}: MobileBottomSheetProps) {
  const [mounted, setMounted] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const backdropOpacity = useMotionValue(0)
  const currentSnapRef = useRef(config.initialSnapIndex)
  const dragEnabledRef = useRef(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Compute snap positions in pixels
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const snapPositions = snapPercentsToPixels(config.snapPoints, vh)
  const closedY = vh // fully off-screen

  // Animate to initial snap when opening
  useEffect(() => {
    if (isOpen && mounted) {
      const targetY = snapPositions[config.initialSnapIndex] ?? snapPositions[0]
      y.set(closedY)
      animate(y, targetY, SPRING)
      backdropOpacity.set(0)
      animate(backdropOpacity, 0.4, { duration: 0.3 })
      currentSnapRef.current = config.initialSnapIndex

      // Push history entry for back button dismiss
      history.pushState({ sheet: config.id }, '')
      const handlePop = () => onDismiss()
      window.addEventListener('popstate', handlePop)
      return () => window.removeEventListener('popstate', handlePop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mounted])

  const snapTo = useCallback(
    (index: number) => {
      const target = snapPositions[index]
      if (target == null) return
      animate(y, target, SPRING)
      currentSnapRef.current = index
      onSnapChange?.(index)
    },
    [snapPositions, y, onSnapChange],
  )

  const handleDismiss = useCallback(() => {
    animate(y, closedY, SPRING)
    animate(backdropOpacity, 0, { duration: 0.2 })
    setTimeout(onDismiss, 300)
  }, [y, closedY, backdropOpacity, onDismiss])

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const currentY = y.get()
      const velocityY = info.velocity.y

      // Downward fling: dismiss
      if (velocityY > DISMISS_VELOCITY && config.dismissible !== false) {
        handleDismiss()
        return
      }

      // Upward fling: go to next higher snap
      if (velocityY < -PROMOTE_VELOCITY) {
        const higherSnaps = snapPositions.filter((s) => s < currentY)
        if (higherSnaps.length > 0) {
          const target = Math.max(...higherSnaps) // nearest higher (smallest Y = highest position)
          const idx = snapPositions.indexOf(target)
          snapTo(idx)
          return
        }
      }

      // Otherwise: nearest snap
      const nearestIdx = findNearestSnap(currentY, snapPositions)

      // If below the lowest snap and dismissible, dismiss
      const lowestSnap = Math.max(...snapPositions)
      if (currentY > lowestSnap + 50 && config.dismissible !== false) {
        handleDismiss()
        return
      }

      snapTo(nearestIdx)
    },
    [y, snapPositions, config.dismissible, handleDismiss, snapTo],
  )

  // Scroll-vs-drag: disable drag when scrolled inside content
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      dragEnabledRef.current = scrollRef.current.scrollTop <= 0
    }
  }, [])

  if (!mounted || !isOpen) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <motion.div
        className="mobile-sheet-backdrop"
        style={{ opacity: backdropOpacity }}
        onClick={config.dismissible !== false ? handleDismiss : undefined}
        aria-hidden="true"
      />

      {/* Sheet */}
      <motion.div
        ref={sheetRef}
        className="mobile-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? config.id}
        style={{
          y,
          height: vh,
        }}
        drag="y"
        dragConstraints={{ top: Math.min(...snapPositions), bottom: closedY }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
      >
        {/* Handle */}
        <div className="mobile-sheet-handle-zone">
          <div className="mobile-sheet-handle" />
        </div>

        {/* Scrollable content */}
        <div
          ref={scrollRef}
          className="mobile-sheet-scroll"
          onScroll={handleScroll}
        >
          {children}
        </div>
      </motion.div>
    </>,
    document.body,
  )
}
