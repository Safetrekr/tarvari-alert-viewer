// Receipt Store -- Public API
//
// This barrel exports the Supabase-backed receipt system that replaces
// InMemoryReceiptStore from WS-1.7.

// Store implementations
export { SupabaseReceiptStore } from './supabase-receipt-store'
export type { SupabaseReceiptStoreConfig } from './supabase-receipt-store'

export { SystemSnapshotStore } from './snapshot-store'
export type { SystemSnapshotStoreConfig } from './snapshot-store'

// Utilities
export { uuidv7, extractTimestamp } from './uuid-v7'
export { OfflineQueue } from './offline-queue'
export type { QueuedReceipt, FlushCallback } from './offline-queue'

// Receipt generators
export {
  createLoginReceipt,
  createNavigationReceipt,
  createReturnToHubReceipt,
  createConstellationViewReceipt,
  createHealthChangeReceipt,
  createTelemetryErrorReceipt,
} from './receipt-generator'
