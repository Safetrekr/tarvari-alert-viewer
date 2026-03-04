// Station Panel Framework -- Public API
// All district workstreams (WS-2.2-2.5) import from this barrel.

// Components
export { StationPanel } from './station-panel'
export { StationHeader } from './station-header'
export { StationBody } from './station-body'
export { StationActions } from './station-actions'
export { ReceiptStamp } from './receipt-stamp'

// Context
export { StationProvider, useStationContext } from './station-context'

// Hooks
export { useReceiptStamp } from './use-receipt-stamp'

// Types (re-exported for convenience)
export type { StationPanelProps } from './station-panel'
export type { StationHeaderProps } from './station-header'
export type { StationBodyProps, BodyTypeSlot } from './station-body'
export type { StationActionsProps } from './station-actions'
export type { ReceiptStampProps } from './receipt-stamp'
export type { StationContextValue } from './station-context'
export type { ReceiptStampState, UseReceiptStampReturn } from './use-receipt-stamp'
