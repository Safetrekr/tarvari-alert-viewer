/**
 * TriageRationalePanel -- slide-out panel showing the full triage
 * decision rationale for a selected bundle.
 *
 * Displays: decision verdict, reviewer type (auto vs analyst),
 * LLM rationale note, suggested/selected trips, confidence, and timeline.
 *
 * @module TriageRationalePanel
 */

'use client'

import { motion, AnimatePresence } from 'motion/react'
import type { BundleWithDecision } from '@/lib/interfaces/intel-bundles'
import {
  getBundleDisplayTitle,
  getBundleDisplaySeverity,
  isAutoTriaged,
} from '@/lib/interfaces/intel-bundles'
import { SEVERITY_COLORS } from '@/lib/interfaces/coverage'
import type { SeverityLevel } from '@/lib/interfaces/coverage'
import { ConfidenceIndicator } from './ConfidenceIndicator'

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

const GHOST: React.CSSProperties = {
  ...MONO,
  fontSize: 10,
  color: 'rgba(255, 255, 255, 0.15)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: 6,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TriageRationalePanelProps {
  item: BundleWithDecision | null
  onClose: () => void
}

export function TriageRationalePanel({ item, onClose }: TriageRationalePanelProps) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key={item.bundle.id}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 380,
            background: 'rgba(5, 9, 17, 0.95)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(12px)',
            zIndex: 45,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <PanelContent item={item} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PanelContent({ item, onClose }: { item: BundleWithDecision; onClose: () => void }) {
  const { bundle, decision } = item
  const title = getBundleDisplayTitle(bundle, decision)
  const severity = getBundleDisplaySeverity(bundle, decision)
  const severityColor = SEVERITY_COLORS[severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown
  const autoTriaged = decision ? isAutoTriaged(decision) : false

  const decisionTime = decision?.decided_at
    ? new Date(decision.decided_at).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <>
      {/* Header */}
      <div
        style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: severityColor,
                boxShadow: `0 0 6px ${severityColor}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                ...MONO,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: severityColor,
                textTransform: 'uppercase',
              }}
            >
              {severity}
            </span>
          </div>
          <div
            style={{
              ...MONO,
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.55)',
              lineHeight: 1.4,
            }}
          >
            {title}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          style={{
            ...MONO,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 6,
            color: 'rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          &times;
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Decision verdict */}
        {decision && (
          <div>
            <div style={GHOST}>DECISION</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  ...MONO,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: decision.decision === 'approve'
                    ? 'rgba(34, 197, 94, 0.7)'
                    : 'rgba(239, 68, 68, 0.7)',
                  textTransform: 'uppercase',
                }}
              >
                {decision.decision === 'approve' ? 'APPROVED' : 'REJECTED'}
              </span>
              {autoTriaged && (
                <span
                  style={{
                    ...MONO,
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    padding: '1px 5px',
                    color: 'rgba(255, 255, 255, 0.25)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 3,
                  }}
                >
                  AUTO-TRIAGE
                </span>
              )}
            </div>
            {decisionTime && (
              <span
                style={{
                  ...MONO,
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.12)',
                  marginTop: 4,
                  display: 'block',
                }}
              >
                {decisionTime}
              </span>
            )}
          </div>
        )}

        {/* Confidence */}
        <div>
          <div style={GHOST}>CONFIDENCE</div>
          <ConfidenceIndicator value={bundle.confidence_aggregate} showValue />
        </div>

        {/* LLM Rationale */}
        {decision?.note && (
          <div>
            <div style={GHOST}>TRIAGE RATIONALE</div>
            <div
              style={{
                ...MONO,
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.35)',
                lineHeight: 1.7,
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {decision.note}
            </div>
          </div>
        )}

        {/* Bundle metadata */}
        <div>
          <div style={GHOST}>BUNDLE INFO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MetaRow label="SOURCES" value={String(bundle.source_count)} />
            <MetaRow label="INTEL ITEMS" value={String(bundle.intel_count ?? 0)} />
            <MetaRow label="CATEGORIES" value={(bundle.categories ?? []).join(', ') || '—'} />
            {bundle.routed_alert_count != null && bundle.routed_alert_count > 0 && (
              <MetaRow label="ROUTED ALERTS" value={String(bundle.routed_alert_count)} />
            )}
          </div>
        </div>

        {/* Analyst notes */}
        {bundle.analyst_notes && (
          <div>
            <div style={GHOST}>ANALYST NOTES</div>
            <div
              style={{
                ...MONO,
                fontSize: 11,
                color: 'rgba(255, 255, 255, 0.3)',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              {bundle.analyst_notes}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          ...MONO,
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.15)',
          letterSpacing: '0.08em',
          minWidth: 90,
        }}
      >
        {label}
      </span>
      <span
        style={{
          ...MONO,
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.35)',
        }}
      >
        {value}
      </span>
    </div>
  )
}
