/**
 * EscalationPanel -- recovery UI for permanent failures.
 *
 * Shows the error details, AI reasoning, and suggested next steps.
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import type { InterventionState } from '@/lib/interfaces/exception-triage'

interface EscalationPanelProps {
  intervention: InterventionState
  onAction?: (actionId: string, command: string | null) => void
}

export function EscalationPanel({ intervention }: EscalationPanelProps) {
  const { classification, exception } = intervention

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          lineHeight: 1.5,
          color: 'rgba(222, 246, 255, 0.7)',
          margin: 0,
        }}
      >
        {classification.userSummary}
      </p>

      {/* Error detail block */}
      {exception.errorMessage && (
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(239, 68, 68, 0.06)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.12)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--status-danger)',
              wordBreak: 'break-word',
            }}
          >
            {exception.errorMessage}
          </span>
        </div>
      )}

      {/* AI reasoning */}
      <div
        style={{
          padding: '8px 10px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'rgba(222, 246, 255, 0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <AlertTriangle size={10} />
          AI Assessment
        </span>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            lineHeight: 1.4,
            color: 'rgba(222, 246, 255, 0.55)',
            margin: '4px 0 0 0',
          }}
        >
          {classification.reasoning}
        </p>
      </div>
    </div>
  )
}
