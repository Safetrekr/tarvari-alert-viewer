/**
 * World-space alert detail panel for the INSPECT flow.
 *
 * Renders at a fixed world-space position (right of the map). The camera
 * flies to this panel when a user clicks "INSPECT" on a map marker popup.
 *
 * Reuses the same visual layout as the district dock's AlertDetailView:
 * severity badge, title, geo scope, confidence, summary, event type,
 * source, timestamps. Ordered per Protective Agent recommendation
 * (severity → geo scope → confidence → summary → event type + source → timestamps).
 *
 * @module AlertDetailPanel
 * @see WS-4.1 INSPECT flow
 */

'use client'

import { motion, AnimatePresence } from 'motion/react'
import { useCoverageStore } from '@/stores/coverage.store'
import { useCategoryIntel, type CategoryIntelItem } from '@/hooks/use-category-intel'
import { getCategoryColor, SEVERITY_COLORS, type SeverityLevel } from '@/lib/interfaces/coverage'
import { returnFromAlertDetail } from '@/lib/spatial-actions'

// ============================================================================
// Timestamp formatter (same as district-view-dock)
// ============================================================================

function formatTimestamp(iso: string | null): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

// ============================================================================
// Detail row helper (same pattern as district-view-dock)
// ============================================================================

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span
        style={{
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 9,
          fontWeight: 500,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 11,
          lineHeight: 1.5,
          color: 'rgba(255, 255, 255, 0.25)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// Alert content (inner, keyed by alert ID for crossfade)
// ============================================================================

function AlertContent({
  alert,
  categoryColor,
  onClose,
  onViewDistrict,
}: {
  alert: CategoryIntelItem
  categoryColor: string
  onClose: () => void
  onViewDistrict: () => void
}) {
  const severityColor =
    SEVERITY_COLORS[alert.severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown

  return (
    <motion.div
      key={alert.id}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        padding: '28px 28px 24px',
      }}
    >
      {/* Severity badge */}
      <span
        style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          marginBottom: 12,
          padding: '4px 8px',
          borderRadius: 4,
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: severityColor,
          backgroundColor: `color-mix(in srgb, ${severityColor} 20%, transparent)`,
          border: `1px solid color-mix(in srgb, ${severityColor} 30%, transparent)`,
        }}
      >
        {alert.severity}
      </span>

      {/* Title */}
      <span
        style={{
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.4,
          color: 'rgba(255, 255, 255, 0.4)',
        }}
      >
        {alert.title}
      </span>

      {/* Separator */}
      <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '16px 0' }} />

      {/* Geo scope (prioritized per Protective Agent) */}
      {alert.geoScope && alert.geoScope.length > 0 && (
        <>
          <DetailRow label="Geographic Scope">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {alert.geoScope.map((code) => (
                <span
                  key={code}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    fontFamily: 'var(--font-geist-mono, monospace)',
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {code}
                </span>
              ))}
            </div>
          </DetailRow>
          <div style={{ height: 12 }} />
        </>
      )}

      {/* Confidence */}
      {alert.confidence != null && (
        <>
          <DetailRow label="Confidence">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 60,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <div
                  style={{
                    width: `${alert.confidence}%`,
                    height: '100%',
                    borderRadius: 3,
                    backgroundColor: categoryColor,
                    opacity: 0.5,
                  }}
                />
              </div>
              <span>{alert.confidence}%</span>
            </div>
          </DetailRow>
          <div style={{ height: 12 }} />
        </>
      )}

      {/* Summary */}
      {alert.shortSummary && (
        <>
          <DetailRow label="Summary">
            <p style={{ color: 'rgba(255, 255, 255, 0.3)', margin: 0 }}>{alert.shortSummary}</p>
          </DetailRow>
          <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '16px 0' }} />
        </>
      )}

      {/* Event type + Source */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {alert.eventType && (
          <DetailRow label="Event Type">
            <span style={{ textTransform: 'capitalize' }}>{alert.eventType}</span>
          </DetailRow>
        )}
        {alert.sourceKey && (
          <DetailRow label="Source">
            {alert.sourceKey}
          </DetailRow>
        )}
      </div>

      {/* Separator */}
      <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '16px 0' }} />

      {/* Timestamps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <DetailRow label="Ingested">
          {formatTimestamp(alert.ingestedAt)}
        </DetailRow>
        <DetailRow label="Sent">
          {formatTimestamp(alert.sentAt)}
        </DetailRow>
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 24,
        }}
      >
        {/* BACK button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '12px 16px',
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.35)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'background 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.10)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)'
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 400 }}>←</span>
          BACK
        </button>

        {/* VIEW DISTRICT button */}
        <button
          type="button"
          onClick={onViewDistrict}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '12px 16px',
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: 10,
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
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)'
          }}
        >
          VIEW DISTRICT
          <span style={{ fontSize: 11, fontWeight: 400 }}>→</span>
        </button>
      </div>
    </motion.div>
  )
}

// ============================================================================
// Main panel component
// ============================================================================

export function AlertDetailPanel({
  onClose,
  onViewDistrict,
}: {
  onClose: () => void
  onViewDistrict: (category: string) => void
}) {
  const selectedId = useCoverageStore((s) => s.selectedMapAlertId)
  const selectedCategory = useCoverageStore((s) => s.selectedMapAlertCategory)
  const basicData = useCoverageStore((s) => s.selectedMapAlertBasic)
  const { data: items } = useCategoryIntel(selectedCategory)

  // Try to find full intel data; fall back to basic marker data from the store
  const richAlert = items?.find((item) => item.id === selectedId) ?? null
  const alert: CategoryIntelItem | null = richAlert ?? (selectedId && selectedCategory && basicData ? {
    id: selectedId,
    title: basicData.title,
    severity: basicData.severity,
    category: selectedCategory,
    eventType: null,
    sourceKey: null,
    confidence: null,
    geoScope: null,
    shortSummary: null,
    ingestedAt: basicData.ingestedAt,
    sentAt: null,
    operationalPriority: null,
  } : null)
  const categoryColor = selectedCategory ? getCategoryColor(selectedCategory) : 'rgba(255, 255, 255, 0.2)'

  if (!selectedId) return null

  // Corner bracket decorations
  const cornerSize = 14
  const cornerOffset = -6
  const cornerThickness = 1.5
  const cornerColor = 'rgba(255, 255, 255, 0.18)'

  return (
    <div
      style={{
        width: 620,
        position: 'relative',
        pointerEvents: 'auto',
      }}
    >
      {/* Corner brackets */}
      <div aria-hidden="true" style={{ position: 'absolute', top: cornerOffset, left: cornerOffset, width: cornerSize, height: cornerSize, zIndex: 5, pointerEvents: 'none', borderTop: `${cornerThickness}px solid ${cornerColor}`, borderLeft: `${cornerThickness}px solid ${cornerColor}` }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: cornerOffset, right: cornerOffset, width: cornerSize, height: cornerSize, zIndex: 5, pointerEvents: 'none', borderTop: `${cornerThickness}px solid ${cornerColor}`, borderRight: `${cornerThickness}px solid ${cornerColor}` }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: cornerOffset, left: cornerOffset, width: cornerSize, height: cornerSize, zIndex: 5, pointerEvents: 'none', borderBottom: `${cornerThickness}px solid ${cornerColor}`, borderLeft: `${cornerThickness}px solid ${cornerColor}` }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: cornerOffset, right: cornerOffset, width: cornerSize, height: cornerSize, zIndex: 5, pointerEvents: 'none', borderBottom: `${cornerThickness}px solid ${cornerColor}`, borderRight: `${cornerThickness}px solid ${cornerColor}` }} />

      {/* Top accent bar in category color */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: categoryColor,
          opacity: 0.5,
          borderRadius: '6px 6px 0 0',
          zIndex: 5,
        }}
      />

      {/* Glass panel body */}
      <div
        style={{
          background: 'rgba(10, 14, 24, 0.94)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">
          {alert ? (
            <AlertContent
              key={alert.id}
              alert={alert}
              categoryColor={categoryColor}
              onClose={onClose}
              onViewDistrict={() => onViewDistrict(alert.category)}
            />
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                fontFamily: 'var(--font-geist-mono, monospace)',
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.2)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Loading intel...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
