'use client'

/**
 * Visual Polish Dev Overlay
 *
 * Renders a compact audit summary in the bottom-left corner during
 * development. Click to expand full findings. Re-runs audit on
 * demand via a "Re-audit" button.
 *
 * Only renders when process.env.NODE_ENV === 'development'.
 * Completely tree-shaken in production builds.
 *
 * Keyboard shortcut: Alt+V to toggle visibility.
 *
 * Source: WS-4.4 D-POLISH-1
 */

import { useState, useCallback, useEffect } from 'react'
import { runVisualPolishAudit, type VisualPolishReport, type AuditFinding } from '@/lib/audits'
import { useFrameBudgetMonitor } from '@/hooks/use-frame-budget-monitor'

// Guard: only render in development
const IS_DEV = process.env.NODE_ENV === 'development'

export function VisualPolishOverlay() {
  if (!IS_DEV) return null
  return <OverlayInner />
}

function OverlayInner() {
  const [report, setReport] = useState<VisualPolishReport | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(true)
  const frameBudget = useFrameBudgetMonitor()

  const runAudit = useCallback(async () => {
    setLoading(true)
    try {
      const result = await runVisualPolishAudit()
      setReport(result)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run once on mount
  useEffect(() => {
    const timer = setTimeout(runAudit, 2000) // Wait for DOM to settle
    return () => clearTimeout(timer)
  }, [runAudit])

  // Keyboard shortcut: Alt+V to toggle visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'v') {
        e.preventDefault()
        setVisible((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!visible) return null

  const errorCount = report?.findings.filter((f) => f.severity === 'error').length ?? 0
  const warningCount = report?.findings.filter((f) => f.severity === 'warning').length ?? 0

  const statusColor =
    errorCount > 0
      ? 'var(--color-error)'
      : warningCount > 0
        ? 'var(--color-warning)'
        : 'var(--color-healthy)'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 9999,
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        color: 'var(--color-text-secondary)',
        pointerEvents: 'auto',
      }}
    >
      {/* Compact badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'rgba(15, 22, 31, 0.90)',
          border: `1px solid ${statusColor}`,
          borderRadius: 6,
          padding: '4px 8px',
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusColor,
          }}
        />
        POLISH {errorCount}E {warningCount}W | {frameBudget.avgFps}fps
      </button>

      {/* Expanded panel */}
      {expanded && report && (
        <div
          style={{
            background: 'rgba(15, 22, 31, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: 12,
            marginTop: 4,
            maxHeight: 400,
            overflowY: 'auto',
            width: 420,
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Summary */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span>
              Audit: {report.findings.length} findings in {report.duration.toFixed(0)}ms
            </span>
            <button
              onClick={runAudit}
              disabled={loading}
              style={{
                background: 'rgba(var(--ember-rgb), 0.2)',
                border: '1px solid rgba(var(--ember-rgb), 0.3)',
                borderRadius: 4,
                padding: '2px 6px',
                color: 'var(--color-ember-bright)',
                cursor: 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
              }}
            >
              {loading ? '...' : 'Re-audit'}
            </button>
          </div>

          {/* Category summary */}
          {report.summary.map((cat) => (
            <div
              key={cat.category}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '2px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <span>{cat.category}</span>
              <span
                style={{
                  color: cat.passed ? 'var(--color-healthy)' : 'var(--color-error)',
                }}
              >
                {cat.errors}E {cat.warnings}W {cat.infos}I
              </span>
            </div>
          ))}

          {/* Findings list */}
          <div style={{ marginTop: 8 }}>
            {report.findings
              .filter((f) => f.severity !== 'info')
              .slice(0, 20)
              .map((f: AuditFinding) => (
                <div
                  key={f.id}
                  style={{
                    padding: '4px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                  }}
                >
                  <span
                    style={{
                      color:
                        f.severity === 'error' ? 'var(--color-error)' : 'var(--color-warning)',
                      marginRight: 4,
                    }}
                  >
                    [{f.severity.toUpperCase()}]
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{f.target}</span>
                  <div style={{ paddingLeft: 8, opacity: 0.7 }}>{f.message}</div>
                </div>
              ))}
          </div>

          {/* Frame budget */}
          <div
            style={{
              marginTop: 8,
              padding: '4px 0',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            FPS: {frameBudget.avgFps} | Dropped: {frameBudget.droppedFrames} | Tier:{' '}
            {frameBudget.performanceLevel}
          </div>
        </div>
      )}
    </div>
  )
}
