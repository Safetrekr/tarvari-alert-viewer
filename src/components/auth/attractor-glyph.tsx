'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { TarvaStarIcon } from '@/components/districts/hub-center-glyph'

interface AttractorGlyphProps {
  /** Whether the glyph is visible. Set to false after field materialization. */
  visible: boolean
  /** Called when the glyph is clicked (triggers field materialization). */
  onClick?: () => void
  className?: string
}

export function AttractorGlyph({ visible, onClick, className }: AttractorGlyphProps) {
  const [showHint, setShowHint] = useState(false)

  // Show the "press any key" hint after 3 seconds of idle
  useEffect(() => {
    if (!visible) {
      setShowHint(false)
      return
    }
    const timer = setTimeout(() => setShowHint(true), 3000)
    return () => clearTimeout(timer)
  }, [visible])

  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center gap-6',
        'transition-opacity duration-[400ms]',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="attractor-glyph cursor-pointer border-0 p-0 outline-none focus-visible:ring-2 focus-visible:ring-ember-bright/40 focus-visible:ring-offset-4 focus-visible:ring-offset-void"
        aria-label="Enter passphrase"
      >
        <TarvaStarIcon size={32} className="text-[var(--color-ember)]" />
      </button>
      <span
        className={cn(
          'font-mono text-[10px] tracking-[0.2em] uppercase text-text-ghost/50',
          'transition-opacity duration-1000',
          showHint ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden="true"
      >
        press any key or tap to begin
      </span>
    </div>
  )
}
