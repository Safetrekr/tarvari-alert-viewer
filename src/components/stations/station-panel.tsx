'use client'

import { type ComponentProps, type ReactNode, useMemo } from 'react'
import { motion } from 'motion/react'
import { Card } from '@tarva/ui'
import { cn } from '@/lib/utils'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import { StationProvider, type StationContextValue } from './station-context'
import { useReceiptStamp } from './use-receipt-stamp'
import { ReceiptStamp } from './receipt-stamp'
import { StationHeader } from './station-header'
import { StationBody } from './station-body'
import { StationActions } from './station-actions'
import './station-panel.css'

// ============================================================================
// Luminous Border Color Map
// ============================================================================

const BORDER_CLASS_MAP: Record<string, string> = {
  ember: 'station-luminous-border',
  healthy: 'station-luminous-border-healthy',
  warning: 'station-luminous-border-warning',
  error: 'station-luminous-border-error',
  offline: 'station-luminous-border-offline',
}

// ============================================================================
// Props
// ============================================================================

export interface StationPanelProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The district this station belongs to. */
  readonly districtId: AppIdentifier
  /** The template driving this station's layout and actions. */
  readonly template: StationTemplate
  /** The receipt store instance for recording action receipts. */
  readonly receiptStore: ReceiptStore
  /**
   * Luminous border color. Defaults to 'ember' (primary accent).
   * Use status colors to indicate station-level health:
   * - 'ember': default, primary accent
   * - 'healthy': station is operational (green glow)
   * - 'warning': station has degraded data (amber glow)
   * - 'error': station is reporting errors (red glow)
   * - 'offline': station's app is offline (dim gray glow)
   */
  readonly glowColor?: 'ember' | 'healthy' | 'warning' | 'error' | 'offline'
  /**
   * Callback invoked when an action command is executed.
   * Receives the resolved command string (template variables replaced)
   * and the action ID.
   */
  readonly onCommand?: (command: string, actionId: string) => void
  /**
   * Entrance animation stagger index.
   * Controls the delay for the staggered unfurl animation.
   * 0 = first station (no delay), 1 = second (100ms delay), etc.
   */
  readonly staggerIndex?: number
  /**
   * Whether to animate the entrance. Set to false to skip entrance
   * animation (e.g., when the station is already visible).
   */
  readonly animateEntrance?: boolean
  /**
   * Station body content. Rendered inside the StationBody zone.
   * District workstreams provide domain-specific content here.
   */
  readonly children: ReactNode
  /**
   * Optional header props override (icon, trailing element, title).
   */
  readonly headerProps?: {
    readonly title?: string
    readonly icon?: ReactNode
    readonly trailing?: ReactNode
  }
  /**
   * Optional override for the body max scroll height.
   */
  readonly bodyMaxHeight?: number | 'none'
  /**
   * Override which actions to render. Defaults to template.layout.actions.
   */
  readonly actions?: StationTemplate['layout']['actions']
}

// ============================================================================
// Component
// ============================================================================

/**
 * StationPanel -- The reusable 3-zone station framework.
 *
 * Layout:
 * ```
 * +-------------------------------------------+
 * | HEADER: District Name / Station Title     | <- Zone 1
 * |-------------------------------------------|
 * | BODY: Domain-specific content             | <- Zone 2
 * |   (table | list | metrics | launch | custom)
 * |-------------------------------------------|
 * | ACTIONS: [Button 1] [Button 2]            | <- Zone 3
 * +-------------------------------------------+
 * | RECEIPT STAMP: ACTION OK / TRACE: 7F2A    | <- Overlay
 * +-------------------------------------------+
 * ```
 *
 * Glass material: Active Glass (VISUAL-DESIGN-SPEC.md Section 1.7)
 * - background: rgba(255, 255, 255, 0.06)
 * - backdrop-filter: blur(16px) saturate(130%)
 * - border: ember luminous (3-layer glow per Section 4.4)
 * - top-edge highlight: inset 0 1px rgba(255,255,255,0.05)
 *
 * Every action triggers the receipt stamp ritual (AD-6):
 * trace ID (4-char hex) + timestamp + result summary.
 *
 * Performance: backdrop-filter disabled during canvas pan
 * via [data-panning="true"] selector (Section 4.3).
 *
 * Entrance animation: Framer Motion fade-in + translateY(12px),
 * staggered by 100ms per station index. Skipped when
 * prefers-reduced-motion is set.
 */
export function StationPanel({
  districtId,
  template,
  receiptStore,
  glowColor = 'ember',
  onCommand,
  staggerIndex = 0,
  animateEntrance = true,
  children,
  headerProps,
  bodyMaxHeight,
  actions,
  className,
  ...props
}: StationPanelProps) {
  // Receipt stamp hook.
  const { stampState, stampReceipt } = useReceiptStamp({
    receiptStore,
    districtId,
    stationName: template.displayName,
  })

  // Station context value (memoized to prevent re-renders).
  const contextValue = useMemo<StationContextValue>(
    () => ({
      districtId,
      template,
      receiptStore,
      stampReceipt,
    }),
    [districtId, template, receiptStore, stampReceipt]
  )

  // Resolve luminous border class.
  const borderClass = BORDER_CLASS_MAP[glowColor] ?? BORDER_CLASS_MAP.ember

  // Detect reduced motion preference.
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Entrance animation variants.
  const entranceDelay = staggerIndex * 0.1 // 100ms stagger per station

  const panelContent = (
    <Card
      className={cn(
        'station-panel',
        borderClass,
        'relative flex flex-col overflow-hidden',
        'min-h-[200px] w-full',
        className
      )}
      {...props}
    >
      {/* Zone 1: Header */}
      <StationHeader {...headerProps} />

      {/* Zone 2: Body */}
      <StationBody maxHeight={bodyMaxHeight}>{children}</StationBody>

      {/* Zone 3: Actions */}
      <StationActions actions={actions} onCommand={onCommand} />

      {/* Receipt stamp overlay (absolute positioned at bottom) */}
      <ReceiptStamp state={stampState} />
    </Card>
  )

  // Wrap in motion.div for entrance animation.
  if (animateEntrance && !reducedMotion) {
    return (
      <StationProvider value={contextValue}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: entranceDelay,
            ease: [0.22, 1, 0.36, 1], // --ease-morph
          }}
        >
          {panelContent}
        </motion.div>
      </StationProvider>
    )
  }

  return <StationProvider value={contextValue}>{panelContent}</StationProvider>
}
