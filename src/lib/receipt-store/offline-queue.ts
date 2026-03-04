/**
 * Offline receipt queue.
 *
 * Buffers receipts when Supabase is unreachable and flushes them
 * when connectivity resumes. Prevents receipt loss during transient
 * network issues.
 *
 * The queue is in-memory only (not persisted to localStorage) because
 * receipts are low-volume (5-15 per session) and the tool is localhost.
 * If the browser closes during an outage, those receipts are lost --
 * acceptable for an internal tool.
 *
 * References:
 * - combined-recommendations.md Risk #9:
 *   "If offline, Launch receipts queue locally and sync on reconnect."
 */

import type { LaunchReceiptInsert, LaunchSnapshotInsert } from '../supabase/types'

// ============================================================================
// Types
// ============================================================================

export interface QueuedReceipt {
  readonly receipt: LaunchReceiptInsert
  readonly snapshot: LaunchSnapshotInsert | null
  readonly queuedAt: number // Date.now()
}

export type FlushCallback = (items: readonly QueuedReceipt[]) => Promise<void>

// ============================================================================
// OfflineQueue
// ============================================================================

export class OfflineQueue {
  private queue: QueuedReceipt[] = []
  private flushing = false
  private flushCallback: FlushCallback | null = null

  /** Number of items currently in the queue. */
  get length(): number {
    return this.queue.length
  }

  /** Whether the queue is currently flushing to Supabase. */
  get isFlushing(): boolean {
    return this.flushing
  }

  /**
   * Register the callback that writes queued items to Supabase.
   * Called by SupabaseReceiptStore during initialization.
   */
  onFlush(callback: FlushCallback): void {
    this.flushCallback = callback
  }

  /**
   * Add a receipt (with optional linked snapshot) to the queue.
   * Called when a Supabase write fails.
   */
  enqueue(receipt: LaunchReceiptInsert, snapshot: LaunchSnapshotInsert | null): void {
    this.queue.push({
      receipt,
      snapshot,
      queuedAt: Date.now(),
    })
  }

  /**
   * Attempt to flush all queued items to Supabase.
   *
   * Items are flushed in order (oldest first). If the flush fails,
   * the items remain in the queue for a future attempt.
   *
   * @returns The number of items successfully flushed.
   */
  async flush(): Promise<number> {
    if (this.flushing || this.queue.length === 0 || !this.flushCallback) {
      return 0
    }

    this.flushing = true
    const itemsToFlush = [...this.queue]

    try {
      await this.flushCallback(itemsToFlush)
      // Success: remove flushed items from the queue.
      this.queue = this.queue.slice(itemsToFlush.length)
      return itemsToFlush.length
    } catch {
      // Failure: items remain in the queue.
      return 0
    } finally {
      this.flushing = false
    }
  }

  /** Clear all queued items. Use with caution -- items will be lost. */
  clear(): void {
    this.queue = []
  }

  /** Get a read-only view of the current queue contents. */
  getQueue(): readonly QueuedReceipt[] {
    return [...this.queue]
  }
}
