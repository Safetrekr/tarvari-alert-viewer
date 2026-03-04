/**
 * RetryPanel -- recovery UI for transient failures.
 *
 * Shows:
 * - Plain-language error summary
 * - Countdown timer to next auto-retry
 * - Progress bar showing retry attempts
 * - Manual retry button
 *
 * References: VISUAL-DESIGN-SPEC.md (status colors, Geist Mono for numbers)
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { RefreshCw, Clock } from 'lucide-react'
import { Button } from '@tarva/ui'
import type { InterventionState } from '@/lib/interfaces/exception-triage'
import { useTriageStore } from '@/stores/triage.store'

interface RetryPanelProps {
  intervention: InterventionState
  onAction?: (actionId: string, command: string | null) => void
}

export function RetryPanel({ intervention, onAction }: RetryPanelProps) {
  const { classification, retry, exception } = intervention
  const updateRetryState = useTriageStore((s) => s.updateRetryState)
  const setInterventionStatus = useTriageStore((s) => s.setInterventionStatus)

  const [countdown, setCountdown] = useState(retry?.nextRetryInSeconds ?? 30)

  const handleRetry = useCallback(() => {
    if (!retry) return

    setInterventionStatus(exception.id, 'retrying')
    updateRetryState(exception.id, {
      attemptCount: retry.attemptCount + 1,
    })

    onAction?.('retry', `retry health-check ${exception.districtId}`)

    // Reset to active after a brief period (the telemetry hook will
    // detect resolution if health improves).
    setTimeout(() => {
      setInterventionStatus(exception.id, 'active')
    }, 3000)
  }, [retry, exception, updateRetryState, setInterventionStatus, onAction])

  // Countdown timer.
  useEffect(() => {
    if (!retry?.autoRetryEnabled || intervention.status !== 'active') return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger auto-retry.
          handleRetry()
          return retry.nextRetryInSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [retry?.autoRetryEnabled, retry?.nextRetryInSeconds, intervention.status, handleRetry])

  const retryProgress = retry ? Math.min(1, retry.attemptCount / retry.maxAttempts) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Error summary */}
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

      {/* Countdown + retry progress */}
      {retry && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.03)',
          }}
        >
          <Clock size={14} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />

          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  color: 'rgba(222, 246, 255, 0.5)',
                }}
              >
                {intervention.status === 'retrying' ? 'Retrying...' : `Next retry in`}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontVariantNumeric: 'tabular-nums',
                  color: 'var(--status-warning)',
                }}
              >
                {intervention.status === 'retrying' ? '...' : `${countdown}s`}
              </span>
            </div>

            {/* Retry progress bar */}
            <div
              style={{
                height: '2px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '1px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${retryProgress * 100}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  background:
                    retryProgress > 0.8 ? 'var(--status-danger)' : 'var(--status-warning)',
                  borderRadius: '1px',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'rgba(222, 246, 255, 0.35)',
                marginTop: '2px',
                display: 'block',
              }}
            >
              Attempt {retry.attemptCount}/{retry.maxAttempts}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRetry}
            disabled={intervention.status === 'retrying'}
          >
            <RefreshCw
              size={14}
              className={intervention.status === 'retrying' ? 'animate-spin' : ''}
            />
          </Button>
        </div>
      )}
    </div>
  )
}
