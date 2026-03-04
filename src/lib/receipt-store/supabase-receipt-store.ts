/**
 * SupabaseReceiptStore -- Persistent receipt storage backed by Supabase.
 *
 * Implements the ReceiptStore interface from WS-1.7 with:
 * - UUID v7 for time-sortable receipt IDs
 * - Full-text search via PostgreSQL to_tsvector
 * - Linked system snapshots for receipt rehydration
 * - Offline queue with flush-on-reconnect
 * - Local subscriber notification for real-time UI updates
 *
 * Replaces InMemoryReceiptStore from WS-1.7. The swap is transparent
 * to all existing consumers (StationPanel, useReceiptStamp, etc.)
 * because they program against the ReceiptStore interface.
 *
 * References:
 * - AD-6 (Receipt System)
 * - WS-1.7 ReceiptStore interface
 * - Gap #5 (Launch Data Storage)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ReceiptStore,
  LaunchReceipt,
  ReceiptInput,
  ReceiptFilters,
} from '@/lib/interfaces/receipt-store'
import type { Unsubscribe } from '@/lib/interfaces/types'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { LaunchReceiptInsert, LaunchSnapshotInsert } from '../supabase/types'
import { uuidv7 } from './uuid-v7'
import { OfflineQueue } from './offline-queue'

// ============================================================================
// Configuration
// ============================================================================

export interface SupabaseReceiptStoreConfig {
  /** Supabase client instance. */
  readonly client: SupabaseClient
  /**
   * Whether to capture a system snapshot with every receipt.
   * Default: true. Set to false to save storage (snapshots are ~2-5KB each).
   */
  readonly captureSnapshotPerReceipt?: boolean
  /**
   * Function to get the current system snapshot.
   * Provided by the SystemStateProvider.
   * If null, no snapshots are captured with receipts.
   */
  readonly getSystemSnapshot?: () => SystemSnapshot | null
}

// ============================================================================
// SupabaseReceiptStore
// ============================================================================

export class SupabaseReceiptStore implements ReceiptStore {
  private readonly client: SupabaseClient
  private readonly captureSnapshots: boolean
  private readonly getSnapshot: (() => SystemSnapshot | null) | null
  private readonly listeners: Set<(receipt: LaunchReceipt) => void> = new Set()
  private readonly offlineQueue: OfflineQueue

  constructor(config: SupabaseReceiptStoreConfig) {
    this.client = config.client
    this.captureSnapshots = config.captureSnapshotPerReceipt ?? true
    this.getSnapshot = config.getSystemSnapshot ?? null
    this.offlineQueue = new OfflineQueue()

    // Register the flush callback for the offline queue.
    this.offlineQueue.onFlush(async (items) => {
      for (const item of items) {
        if (item.snapshot) {
          await this.client.from('launch_snapshots').insert(item.snapshot)
        }
        await this.client.from('launch_receipts').insert(item.receipt)
      }
    })
  }

  // --------------------------------------------------------------------------
  // ReceiptStore Interface Implementation
  // --------------------------------------------------------------------------

  /**
   * Record a new receipt with Supabase persistence.
   *
   * 1. Generate UUID v7 for the receipt ID
   * 2. Optionally capture a system snapshot and store it
   * 3. Insert the receipt with a reference to the snapshot
   * 4. Notify local subscribers
   * 5. On failure, enqueue to the offline queue
   */
  async record(input: ReceiptInput): Promise<LaunchReceipt> {
    const receiptId = uuidv7()
    const timestamp = new Date().toISOString()
    let snapshotId: string | null = null

    // Step 1: Capture system snapshot if configured.
    if (this.captureSnapshots && this.getSnapshot) {
      const snapshot = this.getSnapshot()
      if (snapshot) {
        snapshotId = uuidv7()
        const snapshotInsert: LaunchSnapshotInsert = {
          id: snapshotId,
          timestamp: snapshot.timestamp,
          trigger: 'receipt',
          data: snapshot as unknown as Record<string, unknown>,
          receipt_id: receiptId,
        }

        try {
          const { error } = await this.client.from('launch_snapshots').insert(snapshotInsert)

          if (error) {
            console.warn('[SupabaseReceiptStore] Snapshot insert failed:', error.message)
            snapshotId = null // Do not reference a failed snapshot.
          }
        } catch (err) {
          console.warn('[SupabaseReceiptStore] Snapshot insert error:', err)
          snapshotId = null
        }
      }
    }

    // Step 2: Build the receipt.
    const receipt: LaunchReceipt = {
      id: receiptId,
      correlationId: input.correlationId ?? null,
      source: input.source,
      eventType: input.eventType,
      severity: input.severity,
      summary: input.summary.slice(0, 120),
      detail: input.detail ?? null,
      location: input.location,
      timestamp,
      durationMs: input.durationMs ?? null,
      actor: input.actor,
      aiMetadata: input.aiMetadata ?? null,
    }

    // Step 3: Build the database insert row.
    const receiptInsert: LaunchReceiptInsert = {
      id: receiptId,
      correlation_id: input.correlationId ?? null,
      source: input.source,
      event_type: input.eventType,
      severity: input.severity,
      summary: input.summary.slice(0, 120),
      detail: input.detail ?? null,
      location: input.location as unknown as Record<string, unknown>,
      timestamp,
      duration_ms: input.durationMs ?? null,
      actor: input.actor,
      ai_metadata: input.aiMetadata
        ? (input.aiMetadata as unknown as Record<string, unknown>)
        : null,
      target: input.target ? (input.target as unknown as Record<string, unknown>) : null,
      tags: input.tags ? [...input.tags] : null,
      snapshot_id: snapshotId,
    }

    // Step 4: Insert to Supabase.
    try {
      const { error } = await this.client.from('launch_receipts').insert(receiptInsert)

      if (error) {
        console.warn(
          '[SupabaseReceiptStore] Receipt insert failed, queueing offline:',
          error.message
        )
        this.offlineQueue.enqueue(
          receiptInsert,
          snapshotId
            ? {
                id: snapshotId,
                trigger: 'receipt',
                data: (this.getSnapshot?.() ?? {}) as Record<string, unknown>,
                receipt_id: receiptId,
              }
            : null
        )
      }
    } catch (err) {
      console.warn('[SupabaseReceiptStore] Receipt insert error, queueing offline:', err)
      this.offlineQueue.enqueue(receiptInsert, null)
    }

    // Step 5: Notify local subscribers (even if Supabase failed).
    for (const listener of this.listeners) {
      try {
        listener(receipt)
      } catch (listenerErr) {
        console.warn('[SupabaseReceiptStore] Subscriber error:', listenerErr)
      }
    }

    return receipt
  }

  /**
   * Query receipts with filtering and pagination.
   * Results are ordered by timestamp descending (newest first).
   *
   * Maps ReceiptFilters to Supabase PostgREST query parameters.
   */
  async query(filters?: ReceiptFilters): Promise<LaunchReceipt[]> {
    let query = this.client
      .from('launch_receipts')
      .select('*')
      .order('timestamp', { ascending: false })

    if (filters) {
      // Source filter.
      if (filters.sources && filters.sources.length > 0) {
        query = query.in('source', [...filters.sources])
      }

      // Event type filter.
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        query = query.in('event_type', [...filters.eventTypes])
      }

      // Severity filter.
      if (filters.severities && filters.severities.length > 0) {
        query = query.in('severity', [...filters.severities])
      }

      // Time range filter.
      if (filters.timeRange) {
        query = query
          .gte('timestamp', filters.timeRange.start)
          .lte('timestamp', filters.timeRange.end)
      }

      // Actor filter.
      if (filters.actor) {
        query = query.eq('actor', filters.actor)
      }

      // District filter (JSONB path).
      if (filters.district) {
        query = query.eq('location->>district', filters.district)
      }

      // Full-text search on summary.
      if (filters.search) {
        query = query.textSearch('summary', filters.search, {
          type: 'websearch',
          config: 'english',
        })
      }

      // Pagination.
      const limit = filters.limit ?? 100
      const offset = filters.offset ?? 0
      query = query.range(offset, offset + limit - 1)
    } else {
      // Default: return last 100 receipts.
      query = query.range(0, 99)
    }

    const { data, error } = await query

    if (error) {
      console.error('[SupabaseReceiptStore] Query failed:', error.message)
      return []
    }

    return (data ?? []).map(rowToReceipt)
  }

  /** Get a single receipt by ID. Returns null if not found. */
  async getById(id: string): Promise<LaunchReceipt | null> {
    const { data, error } = await this.client
      .from('launch_receipts')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return rowToReceipt(data)
  }

  /**
   * Get all receipts sharing a correlation ID.
   * Used to display causal chains in the Evidence Ledger.
   */
  async getByCorrelation(correlationId: string): Promise<LaunchReceipt[]> {
    const { data, error } = await this.client
      .from('launch_receipts')
      .select('*')
      .eq('correlation_id', correlationId)
      .order('timestamp', { ascending: true }) // Chronological for causal chains.

    if (error) {
      console.error('[SupabaseReceiptStore] Correlation query failed:', error.message)
      return []
    }

    return (data ?? []).map(rowToReceipt)
  }

  /** Get the total count of receipts matching the given filters. */
  async count(filters?: ReceiptFilters): Promise<number> {
    let query = this.client.from('launch_receipts').select('id', { count: 'exact', head: true })

    if (filters) {
      if (filters.sources && filters.sources.length > 0) {
        query = query.in('source', [...filters.sources])
      }
      if (filters.eventTypes && filters.eventTypes.length > 0) {
        query = query.in('event_type', [...filters.eventTypes])
      }
      if (filters.severities && filters.severities.length > 0) {
        query = query.in('severity', [...filters.severities])
      }
      if (filters.timeRange) {
        query = query
          .gte('timestamp', filters.timeRange.start)
          .lte('timestamp', filters.timeRange.end)
      }
      if (filters.actor) {
        query = query.eq('actor', filters.actor)
      }
      if (filters.district) {
        query = query.eq('location->>district', filters.district)
      }
      if (filters.search) {
        query = query.textSearch('summary', filters.search, {
          type: 'websearch',
          config: 'english',
        })
      }
    }

    const { count, error } = await query

    if (error) {
      console.error('[SupabaseReceiptStore] Count failed:', error.message)
      return 0
    }

    return count ?? 0
  }

  /**
   * Subscribe to new receipts as they are recorded.
   * The listener is called with each new receipt immediately after storage.
   *
   * Note: This is a local subscription (not Supabase Realtime).
   * It only fires for receipts recorded by THIS store instance.
   * Cross-tab receipt synchronization would require Supabase Realtime
   * (deferred per combined-recommendations.md Deferred Item #9).
   */
  subscribe(listener: (receipt: LaunchReceipt) => void): Unsubscribe {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // --------------------------------------------------------------------------
  // Extended Methods (beyond ReceiptStore interface)
  // --------------------------------------------------------------------------

  /**
   * Attempt to flush the offline queue.
   * Call periodically or when connectivity is detected.
   *
   * @returns The number of items successfully flushed.
   */
  async flushOfflineQueue(): Promise<number> {
    return this.offlineQueue.flush()
  }

  /** Number of items in the offline queue. */
  get offlineQueueLength(): number {
    return this.offlineQueue.length
  }

  /**
   * Get the snapshot linked to a receipt by receipt ID.
   * Used for receipt rehydration metric comparison ("then vs. now").
   *
   * @returns The SystemSnapshot data, or null if no snapshot is linked.
   */
  async getSnapshotForReceipt(receiptId: string): Promise<Record<string, unknown> | null> {
    // First, get the receipt to find its snapshot_id.
    const { data: receipt, error: receiptError } = await this.client
      .from('launch_receipts')
      .select('snapshot_id')
      .eq('id', receiptId)
      .single()

    if (receiptError || !receipt?.snapshot_id) return null

    // Then, get the snapshot data.
    const { data: snapshot, error: snapshotError } = await this.client
      .from('launch_snapshots')
      .select('data')
      .eq('id', receipt.snapshot_id)
      .single()

    if (snapshotError || !snapshot) return null

    return snapshot.data
  }
}

// ============================================================================
// Row-to-Receipt Mapper
// ============================================================================

/**
 * Map a Supabase row to a LaunchReceipt domain object.
 *
 * Handles the snake_case -> camelCase conversion and type narrowing
 * from the database's loose JSONB types to the strict interface types.
 */
function rowToReceipt(row: Record<string, unknown>): LaunchReceipt {
  return {
    id: row.id as string,
    correlationId: (row.correlation_id as string) ?? null,
    source: row.source as LaunchReceipt['source'],
    eventType: row.event_type as LaunchReceipt['eventType'],
    severity: row.severity as LaunchReceipt['severity'],
    summary: row.summary as string,
    detail: (row.detail as Record<string, unknown>) ?? null,
    location: row.location as LaunchReceipt['location'],
    timestamp: row.timestamp as string,
    durationMs: (row.duration_ms as number) ?? null,
    actor: row.actor as LaunchReceipt['actor'],
    aiMetadata: row.ai_metadata ? (row.ai_metadata as LaunchReceipt['aiMetadata']) : null,
  }
}
