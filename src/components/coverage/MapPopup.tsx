/**
 * Glass-themed popup for map markers.
 *
 * Renders inside the MapLibre popup container with custom styling
 * that matches the TarvaRI spatial UI aesthetic: dark glass background,
 * backdrop blur, severity dot, and relative timestamp.
 *
 * @module MapPopup
 * @see WS-4.1
 */

'use client'

import { SEVERITY_MAP_COLORS, DEFAULT_MARKER_COLOR, formatRelativeTime } from './map-utils'

// ============================================================================
// Props
// ============================================================================

interface MapPopupProps {
  /** Alert title text (truncated if long). */
  readonly title: string
  /** Severity level string (e.g. 'Extreme', 'Severe'). */
  readonly severity: string
  /** ISO 8601 timestamp of when the alert was ingested. */
  readonly ingestedAt: string
  /** Callback to close the popup. */
  readonly onClose: () => void
  /** Alert ID for the INSPECT action. */
  readonly id?: string
  /** Alert category for the INSPECT action. */
  readonly category?: string
  /** Called when user clicks INSPECT to view full detail. */
  readonly onInspect?: (id: string, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void
}

// ============================================================================
// Component
// ============================================================================

export function MapPopup({ title, severity, ingestedAt, onClose, id, category, onInspect }: MapPopupProps) {
  const severityColor = SEVERITY_MAP_COLORS[severity] ?? DEFAULT_MARKER_COLOR

  return (
    <div
      role="dialog"
      aria-label={`Alert: ${title}`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      style={{
        background: 'rgba(10, 14, 24, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 6,
        padding: '8px 10px',
        minWidth: 160,
        maxWidth: 240,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.60)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}
      >
        {title}
      </div>

      {/* Severity */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginTop: 4,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: severityColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: severityColor,
            lineHeight: 1,
          }}
        >
          {severity}
        </span>
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 9,
          color: 'rgba(255, 255, 255, 0.25)',
          marginTop: 4,
          lineHeight: 1,
        }}
      >
        {formatRelativeTime(ingestedAt)}
      </div>

      {/* INSPECT button */}
      {id && category && onInspect && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onInspect(id, category, { title, severity, ingestedAt })
            onClose()
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            width: '100%',
            marginTop: 8,
            padding: '5px 8px',
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.45)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.10)',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'background 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)'
          }}
        >
          INSPECT
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 400 }}>→</span>
        </button>
      )}
    </div>
  )
}
