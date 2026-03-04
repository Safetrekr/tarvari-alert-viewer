/**
 * ConfigurationPanel -- recovery UI for policy/configuration failures.
 *
 * Shows the policy violation and what setting needs to change.
 */

'use client'

import { Settings } from 'lucide-react'
import type { InterventionState } from '@/lib/interfaces/exception-triage'

interface ConfigurationPanelProps {
  intervention: InterventionState
  onAction?: (actionId: string, command: string | null) => void
}

export function ConfigurationPanel({ intervention }: ConfigurationPanelProps) {
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

      <div
        style={{
          padding: '8px 10px',
          background: 'rgba(234, 179, 8, 0.06)',
          borderRadius: '8px',
          border: '1px solid rgba(234, 179, 8, 0.12)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
        }}
      >
        <Settings
          size={14}
          style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: '1px' }}
        />
        <div>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--status-warning)',
              display: 'block',
              marginBottom: '2px',
            }}
          >
            Configuration Issue
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'rgba(222, 246, 255, 0.55)',
              lineHeight: 1.4,
            }}
          >
            {exception.httpStatus === 401
              ? 'Authentication credentials may have expired. Re-authenticate in the app.'
              : exception.httpStatus === 403
                ? 'Access permissions need to be updated. Check the app settings.'
                : classification.reasoning}
          </span>
        </div>
      </div>
    </div>
  )
}
