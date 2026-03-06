'use client'

/**
 * PriorityAlertToast -- custom toast body for P1/P2 priority alerts.
 *
 * Rendered inside Sonner's toast container via `toast.custom()`.
 * Full layout control while inheriting Sonner's positioning,
 * stacking, animation, and dismiss behavior.
 *
 * Visual composition:
 * - Header: PriorityBadge + severity dot + category label + time-ago
 * - Body: Alert title (2-line clamp)
 * - Footer: "View" action button
 *
 * P1 toasts have an achromatic left border accent (AD-1).
 *
 * @module PriorityAlertToast
 * @see WS-2.5 Section 4.2
 * @see AD-1 -- Achromatic priority visual channel
 */

import { toast } from 'sonner'
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
import { getCategoryMeta, SEVERITY_COLORS } from '@/lib/interfaces/coverage'
import type { SeverityLevel } from '@/lib/interfaces/coverage'
import { relativeTimeAgo } from '@/lib/time-utils'
import { useCoverageStore } from '@/stores/coverage.store'
import { useUIStore } from '@/stores/ui.store'
import type { PriorityAlertPayload } from '@/lib/notifications/notify-priority-alert'

// ============================================================================
// Props
// ============================================================================

interface PriorityAlertToastProps {
  alert: PriorityAlertPayload
  toastId: string | number
}

// ============================================================================
// Component
// ============================================================================

export function PriorityAlertToast({ alert, toastId }: PriorityAlertToastProps) {
  const catMeta = getCategoryMeta(alert.category)
  const severityColor =
    SEVERITY_COLORS[alert.severity as SeverityLevel] ?? 'rgba(255, 255, 255, 0.2)'
  const isP1 = alert.priority === 'P1'

  const handleView = () => {
    toast.dismiss(toastId)
    useCoverageStore.getState().setDistrictPreselectedAlertId(alert.id)
    useUIStore.getState().startMorph(alert.category)
  }

  return (
    <div
      style={{
        width: 360,
        padding: '10px 12px',
        background: 'rgba(10, 10, 15, 0.92)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        fontFamily: 'var(--font-mono, monospace)',
        ...(isP1
          ? { borderLeft: '3px solid rgba(255, 255, 255, 0.25)' }
          : {}),
      }}
    >
      {/* Header row: badge + severity dot + category + time */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <PriorityBadge priority={alert.priority} size="sm" />

        {/* Severity dot */}
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: severityColor,
            flexShrink: 0,
          }}
        />

        {/* Category label */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.45)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            flexShrink: 0,
          }}
        >
          {catMeta.shortName}
        </span>

        <span style={{ flex: 1 }} />

        {/* Time-ago */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.30)',
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}
        >
          {relativeTimeAgo(alert.ingestedAt)}
        </span>
      </div>

      {/* Title (2-line clamp) */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 400,
          fontFamily: 'var(--font-geist-sans, sans-serif)',
          color: 'rgba(255, 255, 255, 0.60)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
          marginBottom: 8,
        }}
      >
        {alert.title}
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={handleView}
          style={{
            fontSize: 9,
            fontWeight: 500,
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            color: 'rgba(255, 255, 255, 0.45)',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'color 150ms ease, background 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.70)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          VIEW
        </button>
      </div>
    </div>
  )
}
