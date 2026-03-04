/**
 * ReceiptDetailPanel -- Expanded detail view for a single receipt.
 *
 * Shows all 12+ fields of a LaunchReceipt, including JSONB detail
 * rendered as collapsible raw data. Includes a "Rehydrate" button
 * that navigates the camera to the receipt's target position.
 *
 * @module receipt-detail-panel
 * @see WS-3.2 Section 4
 */

'use client'

import { useCallback, useState } from 'react'
import { Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LaunchReceipt } from '@/lib/interfaces/receipt-store'
import { getSourceLabel, formatReceiptTime } from '@/hooks/use-receipt-timeline'
import './evidence-ledger.css'

// ============================================================================
// Props
// ============================================================================

export interface ReceiptDetailPanelProps {
  /** The receipt to display in detail. */
  readonly receipt: LaunchReceipt
  /** Callback when the user clicks Rehydrate. */
  readonly onRehydrate?: (receipt: LaunchReceipt) => void
}

// ============================================================================
// Component
// ============================================================================

export function ReceiptDetailPanel({ receipt, onRehydrate }: ReceiptDetailPanelProps) {
  const [showDetail, setShowDetail] = useState(false)
  const [showAiMetadata, setShowAiMetadata] = useState(false)

  const handleRehydrate = useCallback(() => {
    onRehydrate?.(receipt)
  }, [receipt, onRehydrate])

  // Check if the receipt has a target for rehydration (stored in detail or location)
  const hasTarget = receipt.location.district !== null

  return (
    <div className="receipt-detail">
      {/* Core fields */}
      <DetailRow label="ID" value={receipt.id} />
      <DetailRow label="Source" value={getSourceLabel(receipt.source)} />
      <DetailRow label="Type" value={receipt.eventType} />
      <DetailRow label="Severity" value={receipt.severity} />
      <DetailRow label="Actor" value={receipt.actor} />
      <DetailRow label="Time" value={formatReceiptTime(receipt.timestamp)} />

      {receipt.durationMs !== null && (
        <DetailRow label="Duration" value={`${receipt.durationMs}ms`} />
      )}

      {receipt.correlationId && (
        <DetailRow label="Correlation" value={receipt.correlationId} />
      )}

      <DetailRow
        label="Location"
        value={`${receipt.location.semanticLevel}${receipt.location.district ? ` / ${receipt.location.district}` : ''}${receipt.location.station ? ` / ${receipt.location.station}` : ''}`}
      />

      {/* Detail JSONB (collapsible) */}
      {receipt.detail && (
        <div className="mt-2">
          <button
            type="button"
            className="receipt-detail-label cursor-pointer hover:opacity-100 transition-opacity"
            onClick={() => setShowDetail((prev) => !prev)}
            aria-expanded={showDetail}
          >
            {showDetail ? 'Hide' : 'Show'} Detail Data
          </button>
          {showDetail && (
            <div className="receipt-detail-json">
              {JSON.stringify(receipt.detail, null, 2)}
            </div>
          )}
        </div>
      )}

      {/* AI Metadata (collapsible) */}
      {receipt.aiMetadata && (
        <div className="mt-2">
          <button
            type="button"
            className="receipt-detail-label cursor-pointer hover:opacity-100 transition-opacity"
            onClick={() => setShowAiMetadata((prev) => !prev)}
            aria-expanded={showAiMetadata}
          >
            {showAiMetadata ? 'Hide' : 'Show'} AI Metadata
          </button>
          {showAiMetadata && (
            <div className="receipt-detail-json">
              <div className="mb-1">
                <span className="opacity-60">Provider:</span> {receipt.aiMetadata.provider}
              </div>
              <div className="mb-1">
                <span className="opacity-60">Model:</span> {receipt.aiMetadata.modelId ?? 'N/A'}
              </div>
              <div className="mb-1">
                <span className="opacity-60">Confidence:</span>{' '}
                {(receipt.aiMetadata.confidence * 100).toFixed(0)}%
              </div>
              <div className="mb-1">
                <span className="opacity-60">Latency:</span> {receipt.aiMetadata.latencyMs}ms
              </div>
              <div className="mb-1">
                <span className="opacity-60">Reasoning:</span> {receipt.aiMetadata.reasoning}
              </div>
              {receipt.aiMetadata.alternativesConsidered.length > 0 && (
                <div>
                  <span className="opacity-60">Alternatives:</span>{' '}
                  {receipt.aiMetadata.alternativesConsidered.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rehydrate button */}
      {hasTarget && onRehydrate && (
        <div className="mt-3">
          <button
            type="button"
            className="rehydrate-button"
            onClick={handleRehydrate}
            aria-label={`Navigate to the location of receipt: ${receipt.summary}`}
          >
            <Navigation className="h-3.5 w-3.5" />
            Rehydrate
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Detail Row
// ============================================================================

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="receipt-detail-row">
      <span className="receipt-detail-label">{label}</span>
      <span className="receipt-detail-value" title={value}>
        {value}
      </span>
    </div>
  )
}
