/**
 * SystemSnapshotStore -- Stores system state snapshots in Supabase.
 *
 * Supports three trigger types:
 * - 'receipt': Captured at receipt creation time (managed by SupabaseReceiptStore).
 * - 'periodic': Captured on a configurable interval (default 30s).
 * - 'manual': Captured on explicit request.
 *
 * Periodic snapshots serve as baseline data points for receipt rehydration
 * metric comparison. Even if no receipt is created, the system state is
 * captured for trend analysis in the Evidence Ledger.
 *
 * References:
 * - AD-6 (Receipt System -- rehydration metric comparison)
 * - combined-recommendations.md "periodic system snapshot storage"
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import type { LaunchSnapshotInsert, LaunchSnapshotRow } from '../supabase/types'
import { uuidv7 } from './uuid-v7'

// ============================================================================
// Configuration
// ============================================================================

export interface SystemSnapshotStoreConfig {
  /** Supabase client instance. */
  readonly client: SupabaseClient
}

// ============================================================================
// SystemSnapshotStore
// ============================================================================

export class SystemSnapshotStore {
  private readonly client: SupabaseClient

  constructor(config: SystemSnapshotStoreConfig) {
    this.client = config.client
  }

  /**
   * Store a system snapshot.
   *
   * @param snapshot - The SystemSnapshot to store.
   * @param trigger - What caused this snapshot ('receipt', 'periodic', 'manual').
   * @param receiptId - Optional receipt ID if this snapshot is linked to a receipt.
   * @returns The snapshot ID, or null on failure.
   */
  async store(
    snapshot: SystemSnapshot,
    trigger: 'receipt' | 'periodic' | 'manual',
    receiptId?: string
  ): Promise<string | null> {
    const id = uuidv7()

    const insert: LaunchSnapshotInsert = {
      id,
      timestamp: snapshot.timestamp,
      trigger,
      data: snapshot as unknown as Record<string, unknown>,
      receipt_id: receiptId ?? null,
    }

    try {
      const { error } = await this.client.from('launch_snapshots').insert(insert)

      if (error) {
        console.warn('[SystemSnapshotStore] Insert failed:', error.message)
        return null
      }

      return id
    } catch (err) {
      console.warn('[SystemSnapshotStore] Insert error:', err)
      return null
    }
  }

  /**
   * Get a snapshot by ID.
   *
   * @returns The snapshot data as a SystemSnapshot-shaped object, or null.
   */
  async getById(id: string): Promise<SystemSnapshot | null> {
    const { data, error } = await this.client
      .from('launch_snapshots')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return null

    return data.data as unknown as SystemSnapshot
  }

  /**
   * Get the snapshot linked to a specific receipt.
   *
   * @returns The snapshot data, or null if no snapshot is linked.
   */
  async getByReceiptId(receiptId: string): Promise<SystemSnapshot | null> {
    const { data, error } = await this.client
      .from('launch_snapshots')
      .select('*')
      .eq('receipt_id', receiptId)
      .single()

    if (error || !data) return null

    return data.data as unknown as SystemSnapshot
  }

  /**
   * Get the most recent snapshot (any trigger type).
   *
   * Useful for determining the current baseline state.
   */
  async getLatest(): Promise<SystemSnapshot | null> {
    const { data, error } = await this.client
      .from('launch_snapshots')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return data.data as unknown as SystemSnapshot
  }

  /**
   * Get snapshots within a time range.
   *
   * @param start - ISO 8601 start timestamp.
   * @param end - ISO 8601 end timestamp.
   * @param trigger - Optional filter by trigger type.
   * @param limit - Maximum results (default 100).
   * @returns Snapshots ordered by timestamp descending.
   */
  async getByTimeRange(
    start: string,
    end: string,
    trigger?: 'receipt' | 'periodic' | 'manual',
    limit: number = 100
  ): Promise<Array<{ id: string; timestamp: string; trigger: string; data: SystemSnapshot }>> {
    let query = this.client
      .from('launch_snapshots')
      .select('*')
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (trigger) {
      query = query.eq('trigger', trigger)
    }

    const { data, error } = await query

    if (error || !data) return []

    return data.map((row: LaunchSnapshotRow) => ({
      id: row.id,
      timestamp: row.timestamp,
      trigger: row.trigger,
      data: row.data as unknown as SystemSnapshot,
    }))
  }

  /**
   * Count snapshots by trigger type.
   * Useful for monitoring storage usage.
   */
  async countByTrigger(trigger: 'receipt' | 'periodic' | 'manual'): Promise<number> {
    const { count, error } = await this.client
      .from('launch_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('trigger', trigger)

    if (error) return 0

    return count ?? 0
  }

  /**
   * Prune old periodic snapshots using the database function.
   *
   * @param retentionDays - Keep snapshots newer than this many days (default 30).
   * @returns Number of deleted snapshots.
   */
  async prunePeriodicSnapshots(retentionDays: number = 30): Promise<number> {
    const { data, error } = await this.client.rpc('prune_old_periodic_snapshots', {
      retention_days: retentionDays,
    })

    if (error) {
      console.warn('[SystemSnapshotStore] Prune failed:', error.message)
      return 0
    }

    return (data as number) ?? 0
  }
}
