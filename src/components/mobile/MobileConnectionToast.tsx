'use client'

import '@/styles/mobile-pull-refresh.css'

export interface MobileConnectionToastProps {
  readonly isVisible: boolean
  readonly message: string
}

export function MobileConnectionToast({
  isVisible,
  message,
}: MobileConnectionToastProps) {
  if (!isVisible) return null

  return (
    <div
      className="mobile-connection-toast"
      role="status"
      aria-live="polite"
    >
      <span className="mobile-connection-toast-dot" />
      <span className="mobile-connection-toast-text">{message}</span>
    </div>
  )
}
