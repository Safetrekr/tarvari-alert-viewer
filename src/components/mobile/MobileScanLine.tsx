'use client'

import { useReducedMotion } from '@tarva/ui/motion'
import { useSettingsStore } from '@/stores/settings.store'

/**
 * CSS-only 1px horizontal gradient sweep for the mobile viewport.
 * Simplified version of the desktop HorizonScanLine.
 * Respects prefers-reduced-motion and effectsEnabled setting.
 */
export function MobileScanLine() {
  const reducedMotion = useReducedMotion()
  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)

  if (reducedMotion || !effectsEnabled) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 35,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <div
        className="mobile-scan-line"
        style={{
          width: '100%',
          height: 'var(--scan-line-height, 1px)',
          background: 'var(--scan-line-color, rgba(14, 165, 233, 0.08))',
          opacity: 'var(--scan-line-opacity, 0.03)',
        }}
      />
    </div>
  )
}
