'use client'

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { TRACE_ID_LENGTH } from './constants'

interface ReceiptStampProps {
  /** The session trace ID (first N hex characters of the session UUID). */
  traceId: string
  /** ISO 8601 timestamp string. */
  timestamp: string
  className?: string
}

/**
 * Extracts a short hex trace ID from a full UUID.
 * Example: "7f2a3b4c-..." -> "7F2A"
 */
export function extractTraceId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, TRACE_ID_LENGTH).toUpperCase()
}

export function ReceiptStamp({ traceId, timestamp, className }: ReceiptStampProps) {
  return (
    <motion.div
      className={cn('flex items-center justify-center gap-0', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      aria-label={`Authentication successful. Trace ID: ${traceId}`}
    >
      <span className="receipt-stamp">
        <span className="receipt-label">AUTH OK</span>
        <span className="receipt-separator">/</span>
        <span className="receipt-trace">TRACE: {traceId}</span>
        <span className="receipt-separator">/</span>
        <span className="receipt-timestamp">{timestamp}</span>
      </span>
    </motion.div>
  )
}
