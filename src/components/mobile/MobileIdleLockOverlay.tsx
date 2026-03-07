'use client'

import '@/styles/mobile-protective-ops.css'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface MobileIdleLockOverlayProps {
  readonly isLocked: boolean
  readonly onUnlock: (passphrase: string) => boolean
}

export function MobileIdleLockOverlay({
  isLocked,
  onUnlock,
}: MobileIdleLockOverlayProps) {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isLocked) {
      setPassphrase('')
      setError(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isLocked])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!passphrase.trim()) return

      const success = onUnlock(passphrase)
      if (!success) {
        setError(true)
        setPassphrase('')
        inputRef.current?.focus()
      }
    },
    [passphrase, onUnlock],
  )

  if (!isLocked) return null

  return (
    <div
      className="mobile-idle-lock-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Session locked"
    >
      <div className="mobile-idle-lock-content" aria-live="assertive">
        <div className="mobile-idle-lock-icon">&#128274;</div>
        <h2 className="mobile-idle-lock-heading">SESSION LOCKED</h2>
        <p className="mobile-idle-lock-message">
          Enter passphrase to unlock
        </p>

        <form onSubmit={handleSubmit} className="mobile-idle-lock-form">
          <input
            ref={inputRef}
            type="password"
            value={passphrase}
            onChange={(e) => {
              setPassphrase(e.target.value)
              setError(false)
            }}
            placeholder="Passphrase"
            autoComplete="off"
            className="mobile-idle-lock-input"
            aria-label="Passphrase"
            aria-invalid={error}
          />
          {error && (
            <p className="mobile-idle-lock-error" role="alert">
              Invalid passphrase
            </p>
          )}
          <button
            type="submit"
            className="mobile-idle-lock-button"
            disabled={!passphrase.trim()}
          >
            UNLOCK
          </button>
        </form>
      </div>
    </div>
  )
}
