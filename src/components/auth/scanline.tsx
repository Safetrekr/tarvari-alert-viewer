'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { SCANLINE_DURATION } from './constants'

interface ScanlineProps {
  /** Set to true to trigger a single sweep. Resets after animation completes. */
  active: boolean
  /** Called when the sweep animation completes. */
  onComplete?: () => void
  className?: string
}

export function Scanline({ active, onComplete, className }: ScanlineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sweeping, setSweeping] = useState(false)

  useEffect(() => {
    if (!active || sweeping) return

    // Check for reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      onComplete?.()
      return
    }

    setSweeping(true)

    const timer = setTimeout(() => {
      setSweeping(false)
      onComplete?.()
    }, SCANLINE_DURATION + 60) // +60ms for ghost line delays

    return () => clearTimeout(timer)
  }, [active, sweeping, onComplete])

  if (!sweeping) return null

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      {/* Primary scanline */}
      <div className="scanline-primary absolute right-0 left-0 h-px bg-ember opacity-[0.12]" />
      {/* Ghost line 1 */}
      <div className="scanline-ghost-1 absolute right-0 left-0 h-px bg-ember opacity-[0.06]" />
      {/* Ghost line 2 */}
      <div className="scanline-ghost-2 absolute right-0 left-0 h-px bg-ember opacity-[0.03]" />
    </div>
  )
}
