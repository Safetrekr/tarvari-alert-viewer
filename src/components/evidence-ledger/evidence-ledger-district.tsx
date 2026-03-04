/**
 * EvidenceLedgerDistrict -- District wrapper for the Evidence Ledger.
 *
 * Positioned in the NW quadrant of the spatial canvas. Switches between
 * TimelineStrip (Z2) and TimelinePanel (Z3) based on the current
 * semantic zoom level.
 *
 * This is a Launch-native district -- it is not one of the 6 app districts.
 * It doesn't participate in the capsule ring. Instead, it renders directly
 * on the spatial canvas at its fixed world-space position.
 *
 * @module evidence-ledger-district
 * @see WS-3.2 Section 4
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import type { LaunchReceipt, ReceiptStore } from '@/lib/interfaces/receipt-store'
import { flyToWorldPoint } from '@/lib/spatial-actions'
import { TimelineStrip } from './timeline-strip'
import { TimelinePanel } from './timeline-panel'
import './evidence-ledger.css'

// ============================================================================
// Constants
// ============================================================================

/** Evidence Ledger world position in the NW quadrant. */
export const EVIDENCE_LEDGER_POSITION = { x: -900, y: -800 } as const

// ============================================================================
// Props
// ============================================================================

export interface EvidenceLedgerDistrictProps {
  /** The receipt store instance for data access. */
  readonly receiptStore: ReceiptStore
}

// ============================================================================
// Component
// ============================================================================

export function EvidenceLedgerDistrict({ receiptStore }: EvidenceLedgerDistrictProps) {
  const { isDistrict, isStation } = useSemanticZoom()
  const showStrip = isDistrict
  const showPanel = isStation

  // Receipt data for the strip view (lightweight query)
  const [stripReceipts, setStripReceipts] = useState<LaunchReceipt[]>([])
  const [stripCount, setStripCount] = useState(0)
  const [stripLoading, setStripLoading] = useState(true)

  // Load receipt data for the strip view
  useEffect(() => {
    let cancelled = false

    async function loadStripData() {
      try {
        setStripLoading(true)
        const [data, count] = await Promise.all([
          receiptStore.query({ limit: 100 }),
          receiptStore.count(),
        ])
        if (!cancelled) {
          setStripReceipts(data)
          setStripCount(count)
        }
      } catch {
        // Graceful degradation: show empty strip
        if (!cancelled) {
          setStripReceipts([])
          setStripCount(0)
        }
      } finally {
        if (!cancelled) {
          setStripLoading(false)
        }
      }
    }

    if (showStrip) {
      loadStripData()
    }

    return () => {
      cancelled = true
    }
  }, [receiptStore, showStrip])

  // Subscribe to new receipts to keep the strip updated
  useEffect(() => {
    if (!showStrip) return

    const unsubscribe = receiptStore.subscribe((newReceipt) => {
      setStripReceipts((prev) => [newReceipt, ...prev.slice(0, 99)])
      setStripCount((prev) => prev + 1)
    })

    return unsubscribe
  }, [receiptStore, showStrip])

  // Handle rehydration: navigate camera to the receipt's location.
  // Uses the existing flyToDistrict utility for known app districts.
  // Falls back to flyToWorldPoint for arbitrary positions.
  const handleRehydrate = useCallback((receipt: LaunchReceipt) => {
    const district = receipt.location.district
    if (!district) return

    // District center positions (mirrors ManualCameraController and spatial-actions).
    const DISTRICT_POSITIONS: Readonly<Record<string, { x: number; y: number }>> = {
      'agent-builder': { x: -260, y: 150 },
      'tarva-chat': { x: 260, y: 150 },
      'project-room': { x: 0, y: 300 },
      'tarva-core': { x: 260, y: -150 },
      'tarva-erp': { x: -260, y: -150 },
      'tarva-code': { x: 0, y: -300 },
    }

    const pos = DISTRICT_POSITIONS[district]
    if (pos) {
      flyToWorldPoint(pos.x, pos.y, 1.0)
    }
  }, [])

  // Only render when at Z2 or Z3 zoom level
  if (!showStrip && !showPanel) return null

  return (
    <div
      className="evidence-ledger-district"
      data-district="evidence-ledger"
      aria-label="Evidence Ledger district"
    >
      <AnimatePresence mode="wait">
        {showStrip && (
          <TimelineStrip
            key="strip"
            receipts={stripReceipts}
            totalCount={stripCount}
            isLoading={stripLoading}
          />
        )}
        {showPanel && (
          <TimelinePanel
            key="panel"
            receiptStore={receiptStore}
            onRehydrate={handleRehydrate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
