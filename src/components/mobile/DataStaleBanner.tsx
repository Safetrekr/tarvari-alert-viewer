'use client'

import { WifiOff, Clock } from 'lucide-react'
import { useDataFreshness } from '@/hooks/use-data-freshness'

/**
 * Persistent warning banner below MobileHeader when data is stale or offline.
 * Renders at the MobileShell level (visible across all tabs).
 */
export function DataStaleBanner() {
  const { state, staleSince } = useDataFreshness()

  if (state === 'fresh') return null

  const isOffline = state === 'offline'
  const Icon = isOffline ? WifiOff : Clock
  const label = isOffline ? 'OFFLINE' : `DATA STALE`
  const detail = isOffline ? 'No network connection' : staleSince ? `Last update ${staleSince}` : ''

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 48,
        zIndex: 39,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px var(--space-content-padding, 12px)',
        background: isOffline
          ? 'rgba(239, 68, 68, 0.12)'
          : 'var(--color-data-stale-bg, rgba(234, 179, 8, 0.15))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        minHeight: 32,
      }}
    >
      <Icon
        size={14}
        style={{
          color: isOffline
            ? 'var(--color-error, #ef4444)'
            : 'var(--color-warning, #eab308)',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 'var(--text-ghost, 10px)',
          fontWeight: 600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color: isOffline
            ? 'var(--color-error, #ef4444)'
            : 'var(--color-warning, #eab308)',
        }}
      >
        {label}
      </span>
      {detail && (
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            color: 'rgba(255, 255, 255, 0.25)',
          }}
        >
          {detail}
        </span>
      )}
    </div>
  )
}
