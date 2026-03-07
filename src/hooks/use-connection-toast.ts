'use client'

import { useState, useEffect, useRef } from 'react'

export interface ConnectionToastState {
  isVisible: boolean
  message: string
}

/**
 * Shows a brief toast when network connectivity is restored.
 * Uses navigator.onLine + online/offline events directly.
 */
export function useConnectionToast(): ConnectionToastState {
  const [isVisible, setIsVisible] = useState(false)
  const [message, setMessage] = useState('')
  const wasOfflineRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleOffline = () => {
      wasOfflineRef.current = true
    }

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        wasOfflineRef.current = false
        setMessage('Connection restored')
        setIsVisible(true)

        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          setIsVisible(false)
        }, 3000)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { isVisible, message }
}
