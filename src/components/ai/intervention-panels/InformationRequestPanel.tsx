/**
 * InformationRequestPanel -- recovery UI for unclassifiable failures.
 *
 * Asks the user to investigate and provides guidance on what to check.
 */

'use client'

import { Search } from 'lucide-react'
import type { InterventionState } from '@/lib/interfaces/exception-triage'

interface InformationRequestPanelProps {
  intervention: InterventionState
  onAction?: (actionId: string, command: string | null) => void
}

export function InformationRequestPanel({ intervention }: InformationRequestPanelProps) {
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
          padding: '10px',
          background: 'rgba(var(--teal-rgb), 0.06)',
          borderRadius: '8px',
          border: '1px solid rgba(var(--teal-rgb), 0.12)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '6px',
          }}
        >
          <Search size={10} />
          Suggested Investigation Steps
        </span>
        <ul
          style={{
            margin: 0,
            paddingLeft: '16px',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            lineHeight: 1.6,
            color: 'rgba(222, 246, 255, 0.55)',
          }}
        >
          <li>Open {exception.displayName} directly and check for errors</li>
          <li>Verify the app&apos;s process is running</li>
          <li>Check the app&apos;s logs for recent error output</li>
          {exception.errorCode && (
            <li>
              Error code:{' '}
              <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                {exception.errorCode}
              </code>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
