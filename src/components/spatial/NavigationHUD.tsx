/**
 * NavigationHUD -- fixed-position overlay container for all HUD instruments.
 *
 * Sits above the spatial canvas (z-40) but below modals (z-50).
 * Children (minimap, breadcrumb, zoom indicator) receive pointer-events-auto
 * so they remain interactive while the container itself passes clicks through.
 *
 * Fades to 60% opacity during active camera motion (pan/zoom) and
 * restores to 100% when the camera settles, providing a subtle visual
 * signal that reduces HUD noise during navigation.
 *
 * @module NavigationHUD
 * @see WS-1.4 Deliverable 4.1
 */

'use client'

import { type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface NavigationHUDProps {
  children: ReactNode
  /** Whether the camera is currently in motion (pan or animation). */
  isPanActive?: boolean
  className?: string
}

export function NavigationHUD({
  children,
  isPanActive = false,
  className,
}: NavigationHUDProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-40',
        'transition-opacity duration-150',
        isPanActive && 'opacity-60',
        className,
      )}
      aria-label="Navigation instruments"
      role="region"
    >
      {children}
    </div>
  )
}
