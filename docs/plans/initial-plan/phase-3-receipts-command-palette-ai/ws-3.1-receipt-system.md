# WS-3.1: Receipt System

> **Workstream ID:** WS-3.1
> **Phase:** 3 -- Receipts + Command Palette + AI
> **Assigned Agent:** `world-class-backend-api-engineer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1 (project scaffolding), WS-1.7 (ReceiptStore interface + InMemoryReceiptStore), WS-2.6 (useReceiptStamp hook + receipt stamp animation)
> **Blocks:** WS-3.2 (Evidence Ledger -- requires persisted receipts + snapshots for timeline and rehydration), WS-3.4 (AI Camera Director -- requires ReceiptStore for AI action audit trail), WS-3.5 (Station Template Selection -- requires ReceiptStore for AI decision receipts), WS-3.6 (Narrated Telemetry -- requires snapshot storage for metric comparison)
> **Resolves:** Gap #5 (Launch Data Storage -- implements the Supabase receipt persistence described in this gap), OQ-4 from WS-1.7 (ReceiptInput extension with `target` and `tags` fields)

---

## 1. Objective

Deliver the persistent receipt system that forms the audit backbone of Tarva Launch. This workstream replaces the `InMemoryReceiptStore` from WS-1.7 with a `SupabaseReceiptStore` backed by the `launch_receipts` table, adds periodic system snapshot storage to `launch_snapshots` for receipt rehydration (viewport restore + metric comparison), extends the `ReceiptInput` contract with `target` and `tags` fields to resolve the gap discovered between WS-1.7 and WS-2.6, and wires receipt generation into all mutation actions across the application.

**Why this matters:** The receipt system is the trust anchor for the Evidence Ledger (WS-3.2) and all AI audit trails (WS-3.4, WS-3.5, WS-3.6). Without persistent receipts, the Launch cannot show what happened, when, why, or by whom. Without linked snapshots, receipt rehydration (clicking a receipt to see "then vs. now") is impossible. Per AD-6: only meaningful actions generate receipts -- not every hover or scroll. Expected volume: 5-15 receipts per session.

**Success looks like:** A user performs 10 actions across three districts in a session, closes the browser, reopens it, and the Evidence Ledger shows all 10 receipts with timestamps, trace IDs, actor attribution, and spatial context. Clicking any receipt restores the viewport to the position at the time of action and displays a metric comparison overlay showing what changed between then and now.

**Traceability:** AD-6 (Receipt System), AD-7 (AI Integration Architecture -- interface #3), Gap #5 (Launch Data Storage), IA Assessment Section 5 (Evidence Ledger Structure), combined-recommendations.md Phase 3 Work Area 1.

---

## 2. Scope

### In Scope

- **Supabase schema: `launch_receipts` table** -- 12-field receipt schema from the AIA assessment extended with `target`, `tags`, and `snapshot_id` columns. UUID v7 primary key, JSONB columns for structured data, GIN indexes for tag and full-text search, `CHECK` constraints for enum fields.
- **Supabase schema: `launch_snapshots` table** -- Stores serialized `SystemSnapshot` objects linked to receipts and periodic polling intervals. Enables receipt rehydration metric comparison ("then vs. now").
- **Supabase Row-Level Security (RLS) policies** -- Policies for both tables permitting all operations for authenticated sessions (localhost tool; no multi-tenant isolation needed).
- **`SupabaseReceiptStore` class** -- Implements the `ReceiptStore` interface from WS-1.7 with Supabase persistence, UUID v7 generation, full-text search via `to_tsvector`, pagination, and a local subscriber notification system.
- **UUID v7 utility** -- Zero-dependency UUID v7 generator producing time-sortable identifiers (48-bit unix ms timestamp + random fill).
- **`SystemSnapshotStore` class** -- Stores and retrieves `SystemSnapshot` objects in `launch_snapshots`. Supports receipt-linked snapshots (stored at receipt creation time) and periodic snapshots (stored on a configurable interval).
- **Supabase client module** -- Browser and server Supabase client singletons using environment variables for project URL and anon key.
- **Supabase database type definitions** -- TypeScript types matching the SQL schema for type-safe Supabase queries.
- **`ReceiptInput` interface extension** -- Add `target` (optional `CameraTarget`) and `tags` (optional `string[]`) fields to resolve the gap between WS-1.7 and WS-2.6.
- **API Route Handlers** -- `GET /api/receipts` (query with filters), `POST /api/receipts` (record), `GET /api/receipts/[id]` (get by ID), `POST /api/snapshots` (record snapshot), `GET /api/snapshots` (query by receipt ID or time range).
- **`useSupabaseReceipts` hook** -- React hook that provides a `SupabaseReceiptStore` instance to components, replacing the `InMemoryReceiptStore` used in Phase 2.
- **`useSnapshotPolling` hook** -- React hook that captures a `SystemSnapshot` every 30 seconds and stores it in `launch_snapshots` for metric comparison support.
- **Offline receipt queue** -- When Supabase is unreachable, queue receipts in memory and flush to the database when connectivity resumes. Prevents receipt loss during transient network issues.
- **Receipt generation for non-station mutations** -- Login receipt, navigation receipts (district focus, return-to-hub), and system receipts (telemetry state changes, error events).
- **Integration wiring** -- Replace `InMemoryReceiptStore` with `SupabaseReceiptStore` in the provider tree so all existing `useReceiptStamp` consumers in WS-2.6 station panels automatically persist to Supabase.

### Out of Scope

- **Evidence Ledger UI** -- WS-3.2. The timeline, faceted filtering UI, receipt rehydration viewport restore, and metric comparison overlay are rendered by WS-3.2. This workstream provides the data layer WS-3.2 queries.
- **Receipt stamp animation component** -- WS-2.6. The visual receipt stamp overlay (`ReceiptStamp` component) and `useReceiptStamp` hook already exist. This workstream only changes the underlying store, not the animation.
- **AI receipt metadata population** -- WS-3.4, WS-3.5, WS-3.6. Those workstreams create receipts with `aiMetadata` populated. This workstream provides the storage; the AI workstreams provide the data.
- **Supabase Realtime subscriptions** -- Deferred per combined-recommendations.md Deferred Item #9. Polling is sufficient for Phase 3.
- **Receipt deletion or archival** -- Not needed for a single-user localhost tool. Receipts are immutable and append-only.
- **Receipt export** -- SOC2/compliance export is not relevant for an internal tool.
- **Multi-tenant receipt isolation** -- Single user per Gap #5.

---

## 3. Input Dependencies

| Dependency               | Source                                                | What It Provides                                                                                                                                        | Blocking? | Status         |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------- |
| `ReceiptStore` interface | WS-1.7 `src/lib/interfaces/receipt-store.ts`          | `ReceiptStore`, `LaunchReceipt`, `ReceiptInput`, `ReceiptFilters`, `AIReceiptMetadata` types; `InMemoryReceiptStore` Phase 1 implementation             | Yes       | Delivered      |
| `SystemSnapshot` type    | WS-1.7 `src/lib/interfaces/system-state-provider.ts`  | `SystemSnapshot`, `AppState`, `GlobalMetrics` types for snapshot storage                                                                                | Yes       | Delivered      |
| `CameraTarget` type      | WS-1.7 `src/lib/interfaces/camera-controller.ts`      | `CameraTarget` discriminated union for receipt `target` field (rehydration navigation)                                                                  | Yes       | Delivered      |
| Shared domain types      | WS-1.7 `src/lib/interfaces/types.ts`                  | `AppIdentifier`, `HealthState`, `EventType`, `Severity`, `Actor`, `ReceiptSource`, `SpatialLocation`, `ISOTimestamp`, `CameraPosition`, `SemanticLevel` | Yes       | Delivered      |
| `useReceiptStamp` hook   | WS-2.6 `src/components/stations/use-receipt-stamp.ts` | Receipt stamp hook that constructs `ReceiptInput` and calls `receiptStore.record()`                                                                     | Yes       | Delivered      |
| `ReceiptStamp` component | WS-2.6 `src/components/stations/receipt-stamp.tsx`    | Visual receipt stamp animation overlay                                                                                                                  | No        | Delivered      |
| `StationPanel` framework | WS-2.6 `src/components/stations/station-panel.tsx`    | Station panel consuming `ReceiptStore` via props                                                                                                        | No        | Delivered      |
| `SystemStateProvider`    | WS-1.7 + WS-1.5                                       | `PollingSystemStateProvider.getSnapshot()` for periodic snapshot capture                                                                                | Yes       | Delivered      |
| Supabase client setup    | WS-0.1                                                | `@supabase/supabase-js` installed; `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                     | Yes       | Delivered      |
| Supabase project         | External                                              | Running Supabase instance (cloud or local via `supabase start`) with ability to run migrations                                                          | Yes       | Requires setup |
| VISUAL-DESIGN-SPEC.md    | Discovery                                             | Receipt stamp typography (Section 3.4) for any receipt-related UI in route handlers                                                                     | No        | Reference      |

---

## 4. Deliverables

### 4.1 File Structure

```
supabase/
  migrations/
    001_launch_receipts.sql           # Receipt table, indexes, RLS, full-text search
    002_launch_snapshots.sql          # Snapshot table, indexes, RLS

src/
  lib/
    supabase/
      client.ts                       # Browser + server Supabase client singletons
      types.ts                        # Database row types (launch_receipts, launch_snapshots)
    receipt-store/
      supabase-receipt-store.ts       # SupabaseReceiptStore class
      snapshot-store.ts               # SystemSnapshotStore class
      uuid-v7.ts                      # UUID v7 generator
      receipt-generator.ts            # Receipt generation for non-station mutations
      offline-queue.ts                # Offline receipt queue with flush-on-reconnect
      index.ts                        # Barrel export
  hooks/
    use-supabase-receipts.ts          # React hook providing SupabaseReceiptStore
    use-snapshot-polling.ts           # React hook for periodic snapshot storage
  app/
    api/
      receipts/
        route.ts                      # GET (query) + POST (record)
      receipts/[id]/
        route.ts                      # GET (single receipt)
      snapshots/
        route.ts                      # GET (query) + POST (record)
```

### 4.2 Supabase Migration: Receipt Table -- `supabase/migrations/001_launch_receipts.sql`

```sql
-- =============================================================================
-- Migration 001: launch_receipts
--
-- The 12-field receipt schema from the AIA assessment, extended with target,
-- tags, and snapshot_id for receipt rehydration.
--
-- References:
-- - AD-6 (Receipt System)
-- - WS-1.7 LaunchReceipt interface
-- - Gap #5 (Launch Data Storage)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Receipt source enum: 'launch' or one of the 6 app identifiers.
-- Using CHECK constraint instead of ENUM type for easier extensibility.
-- New apps can be added without a migration.
CREATE TABLE IF NOT EXISTS launch_receipts (
  -- Field 1: UUID v7 primary key (time-sortable).
  -- Generated by the application, not the database, to ensure v7 format.
  id              UUID PRIMARY KEY,

  -- Field 2: Correlation ID linking related events across Launch + apps.
  -- NULL for uncorrelated events.
  correlation_id  UUID,

  -- Field 3: Source of the event.
  -- 'launch' for Launch-generated events; app identifier for observed app events.
  source          TEXT NOT NULL
                  CHECK (source IN (
                    'launch',
                    'agent-builder',
                    'tarva-chat',
                    'project-room',
                    'tarva-core',
                    'tarva-erp',
                    'tarva-code'
                  )),

  -- Field 4: Event type classification for Evidence Ledger faceted filtering.
  event_type      TEXT NOT NULL
                  CHECK (event_type IN (
                    'navigation',
                    'action',
                    'error',
                    'approval',
                    'system'
                  )),

  -- Field 5: Severity level for Evidence Ledger faceted filtering.
  severity        TEXT NOT NULL
                  CHECK (severity IN (
                    'info',
                    'warning',
                    'error',
                    'critical'
                  )),

  -- Field 6: Human-readable summary, max 120 characters.
  summary         TEXT NOT NULL
                  CHECK (char_length(summary) <= 120),

  -- Field 7: Structured detail payload. App-specific. Rendered as collapsible
  -- raw data in the Evidence Ledger.
  detail          JSONB,

  -- Field 8: Spatial context -- where in the Launch the event originated.
  -- Schema: { "semanticLevel": "Z0"|"Z1"|"Z2"|"Z3",
  --           "district": AppIdentifier | null,
  --           "station": string | null }
  location        JSONB NOT NULL,

  -- Field 9: ISO 8601 timestamp with milliseconds.
  -- Application-provided (not DEFAULT now()) to preserve exact client-side timing.
  timestamp       TIMESTAMPTZ NOT NULL,

  -- Field 10: Duration for events that span time (ms). NULL for instantaneous.
  duration_ms     INTEGER
                  CHECK (duration_ms IS NULL OR duration_ms >= 0),

  -- Field 11: Actor attribution.
  actor           TEXT NOT NULL
                  CHECK (actor IN ('human', 'ai', 'system')),

  -- Field 12: AI rationale metadata. NULL for human/system actions.
  -- Schema: { "prompt": string, "reasoning": string, "confidence": number,
  --           "alternativesConsidered": string[], "provider": string,
  --           "latencyMs": number, "modelId": string | null }
  ai_metadata     JSONB,

  -- Extension: Camera target for receipt rehydration navigation.
  -- Stores the CameraTarget discriminated union so clicking a receipt
  -- can navigate the viewport to the action's context.
  -- Schema: { "type": "position"|"district"|"station"|"home"|"constellation",
  --           ...type-specific fields }
  target          JSONB,

  -- Extension: Searchable tags for faceted filtering.
  -- Populated by station actions with [districtId, stationName, actionId].
  tags            TEXT[],

  -- Extension: Links to the system snapshot captured at receipt creation time.
  -- Used by Evidence Ledger for "then vs. now" metric comparison.
  snapshot_id     UUID,

  -- Audit metadata.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Primary query pattern: chronological timeline (newest first).
CREATE INDEX idx_receipts_timestamp
  ON launch_receipts (timestamp DESC);

-- Faceted filtering: source app.
CREATE INDEX idx_receipts_source
  ON launch_receipts (source);

-- Faceted filtering: event type.
CREATE INDEX idx_receipts_event_type
  ON launch_receipts (event_type);

-- Faceted filtering: severity.
CREATE INDEX idx_receipts_severity
  ON launch_receipts (severity);

-- Faceted filtering: actor.
CREATE INDEX idx_receipts_actor
  ON launch_receipts (actor);

-- Correlation chain lookup.
CREATE INDEX idx_receipts_correlation
  ON launch_receipts (correlation_id)
  WHERE correlation_id IS NOT NULL;

-- Snapshot linkage for rehydration.
CREATE INDEX idx_receipts_snapshot
  ON launch_receipts (snapshot_id)
  WHERE snapshot_id IS NOT NULL;

-- GIN index on tags array for @> (contains) queries.
CREATE INDEX idx_receipts_tags
  ON launch_receipts USING GIN (tags);

-- Full-text search on summary.
-- Uses English configuration for stemming and stop words.
CREATE INDEX idx_receipts_summary_fts
  ON launch_receipts USING GIN (to_tsvector('english', summary));

-- District filtering via JSONB path.
CREATE INDEX idx_receipts_district
  ON launch_receipts ((location->>'district'));

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE launch_receipts ENABLE ROW LEVEL SECURITY;

-- Localhost single-user tool: allow all operations for any authenticated user.
-- The anon key provides access. No multi-tenant isolation needed.
CREATE POLICY "Allow all operations on launch_receipts"
  ON launch_receipts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE launch_receipts IS
  'Immutable audit log of meaningful Launch events. 12-field AIA schema + extensions.';
COMMENT ON COLUMN launch_receipts.id IS
  'UUID v7 (time-sortable). Generated by the application.';
COMMENT ON COLUMN launch_receipts.correlation_id IS
  'Links related events across Launch and external apps.';
COMMENT ON COLUMN launch_receipts.source IS
  'Origin: launch for Launch-generated, app identifier for observed app events.';
COMMENT ON COLUMN launch_receipts.event_type IS
  'Classification for Evidence Ledger faceted filtering.';
COMMENT ON COLUMN launch_receipts.severity IS
  'Urgency level for Evidence Ledger faceted filtering.';
COMMENT ON COLUMN launch_receipts.summary IS
  'Human-readable summary, max 120 characters.';
COMMENT ON COLUMN launch_receipts.detail IS
  'Structured JSONB payload, app-specific.';
COMMENT ON COLUMN launch_receipts.location IS
  'Spatial context: { semanticLevel, district, station }.';
COMMENT ON COLUMN launch_receipts.timestamp IS
  'Client-side ISO 8601 timestamp with milliseconds.';
COMMENT ON COLUMN launch_receipts.duration_ms IS
  'Duration in ms for time-spanning events. NULL for instantaneous.';
COMMENT ON COLUMN launch_receipts.actor IS
  'Attribution: human, ai, or system.';
COMMENT ON COLUMN launch_receipts.ai_metadata IS
  'AI rationale fields: prompt, reasoning, confidence, alternatives, provider, latency.';
COMMENT ON COLUMN launch_receipts.target IS
  'CameraTarget for receipt rehydration navigation.';
COMMENT ON COLUMN launch_receipts.tags IS
  'Searchable tags array for faceted filtering.';
COMMENT ON COLUMN launch_receipts.snapshot_id IS
  'FK to launch_snapshots for then-vs-now metric comparison.';
```

### 4.3 Supabase Migration: Snapshot Table -- `supabase/migrations/002_launch_snapshots.sql`

```sql
-- =============================================================================
-- Migration 002: launch_snapshots
--
-- Stores serialized SystemSnapshot objects for receipt rehydration
-- (metric comparison: "then vs. now") and periodic system state capture.
--
-- References:
-- - AD-6 (Receipt System -- rehydration metric comparison)
-- - WS-1.7 SystemSnapshot interface
-- - combined-recommendations.md Phase 3 Work Area 1
-- =============================================================================

CREATE TABLE IF NOT EXISTS launch_snapshots (
  -- UUID v7 primary key (time-sortable).
  id              UUID PRIMARY KEY,

  -- ISO 8601 timestamp of snapshot capture.
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- What triggered this snapshot.
  -- 'receipt': captured at receipt creation time (linked to a specific receipt).
  -- 'periodic': captured on the 30-second polling interval.
  -- 'manual': captured by explicit user or system request.
  trigger         TEXT NOT NULL
                  CHECK (trigger IN ('receipt', 'periodic', 'manual')),

  -- The serialized SystemSnapshot.
  -- Schema matches WS-1.7 SystemSnapshot:
  -- {
  --   "apps": Record<AppIdentifier, AppState>,
  --   "globalMetrics": { alertCount, activeWork, systemPulse },
  --   "timestamp": ISOTimestamp
  -- }
  data            JSONB NOT NULL,

  -- Optional link to the receipt that triggered this snapshot.
  -- NULL for periodic and manual snapshots.
  receipt_id      UUID,

  -- Audit metadata.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Primary query: chronological (newest first).
CREATE INDEX idx_snapshots_timestamp
  ON launch_snapshots (timestamp DESC);

-- Lookup by trigger type (for periodic cleanup).
CREATE INDEX idx_snapshots_trigger
  ON launch_snapshots (trigger);

-- Lookup by receipt (for rehydration metric comparison).
CREATE INDEX idx_snapshots_receipt
  ON launch_snapshots (receipt_id)
  WHERE receipt_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE launch_snapshots ENABLE ROW LEVEL SECURITY;

-- Localhost single-user tool: allow all operations.
CREATE POLICY "Allow all operations on launch_snapshots"
  ON launch_snapshots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- Foreign Keys (deferred to avoid circular dependency)
-- ---------------------------------------------------------------------------

-- Snapshot -> Receipt (optional back-reference).
-- Not enforced as a hard FK because receipts and snapshots are created
-- in the same transaction and order may vary. The application ensures
-- referential integrity.

-- Receipt -> Snapshot (forward reference).
-- Added here because launch_snapshots table now exists.
ALTER TABLE launch_receipts
  ADD CONSTRAINT fk_receipts_snapshot
  FOREIGN KEY (snapshot_id) REFERENCES launch_snapshots(id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------

COMMENT ON TABLE launch_snapshots IS
  'System state captures for receipt rehydration metric comparison.';
COMMENT ON COLUMN launch_snapshots.id IS
  'UUID v7 (time-sortable). Generated by the application.';
COMMENT ON COLUMN launch_snapshots.trigger IS
  'What caused this snapshot: receipt, periodic, or manual.';
COMMENT ON COLUMN launch_snapshots.data IS
  'Serialized SystemSnapshot JSONB matching WS-1.7 SystemSnapshot interface.';
COMMENT ON COLUMN launch_snapshots.receipt_id IS
  'Optional back-reference to the receipt that triggered this snapshot.';

-- ---------------------------------------------------------------------------
-- Periodic Snapshot Cleanup (optional)
-- ---------------------------------------------------------------------------

-- Periodic snapshots older than 30 days can be pruned to save storage.
-- Receipt-linked snapshots are kept indefinitely (as long as the receipt exists).
-- This is a helper function, not auto-scheduled. Call manually or via cron.
CREATE OR REPLACE FUNCTION prune_old_periodic_snapshots(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM launch_snapshots
  WHERE trigger = 'periodic'
    AND timestamp < now() - (retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION prune_old_periodic_snapshots IS
  'Removes periodic snapshots older than retention_days. Receipt-linked snapshots are preserved.';
```

### 4.4 Supabase Client -- `src/lib/supabase/client.ts`

```ts
/**
 * Supabase client singletons for browser and server environments.
 *
 * Browser client: Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Server client: Uses the same env vars (no service role key needed for localhost).
 *
 * References:
 * - Gap #5 (Launch Data Storage)
 * - tech-decisions.md (Supabase shared instance)
 * - WS-0.1 (project scaffolding -- env var setup)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// ============================================================================
// Environment Validation
// ============================================================================

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Set it in .env.local to your Supabase project URL.'
    )
  }
  return url
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
        'Set it in .env.local to your Supabase anon key.'
    )
  }
  return key
}

// ============================================================================
// Browser Client (singleton)
// ============================================================================

let browserClient: SupabaseClient<Database> | null = null

/**
 * Get the Supabase client for browser-side usage.
 *
 * Returns a singleton instance. Safe to call multiple times.
 * Uses NEXT_PUBLIC_* env vars which are available in the browser bundle.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient

  browserClient = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      // No Supabase Auth for this localhost tool.
      // The anon key provides direct access per RLS policies.
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return browserClient
}

// ============================================================================
// Server Client (per-request)
// ============================================================================

/**
 * Create a Supabase client for server-side usage (Route Handlers, Server Components).
 *
 * Creates a new instance per call. For Route Handlers, create one per request.
 * Uses the same anon key (no service role key needed for localhost RLS policies).
 */
export function createSupabaseServerClient(): SupabaseClient<Database> {
  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
```

### 4.5 Database Types -- `src/lib/supabase/types.ts`

```ts
/**
 * TypeScript types for the Supabase database schema.
 *
 * These types map 1:1 to the SQL schema in supabase/migrations/.
 * They are used by the Supabase client for type-safe queries.
 *
 * In a production project, these would be auto-generated by
 * `supabase gen types typescript`. For this project, they are
 * hand-maintained to avoid a CLI dependency.
 *
 * References:
 * - 001_launch_receipts.sql
 * - 002_launch_snapshots.sql
 */

// ============================================================================
// Database Schema Type (Supabase convention)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      launch_receipts: {
        Row: LaunchReceiptRow
        Insert: LaunchReceiptInsert
        Update: LaunchReceiptUpdate
      }
      launch_snapshots: {
        Row: LaunchSnapshotRow
        Insert: LaunchSnapshotInsert
        Update: LaunchSnapshotUpdate
      }
    }
    Views: Record<string, never>
    Functions: {
      prune_old_periodic_snapshots: {
        Args: { retention_days?: number }
        Returns: number
      }
    }
    Enums: Record<string, never>
  }
}

// ============================================================================
// launch_receipts
// ============================================================================

/** Row type: what you get back from a SELECT. */
export interface LaunchReceiptRow {
  id: string // UUID v7
  correlation_id: string | null // UUID
  source: string // ReceiptSource
  event_type: string // EventType
  severity: string // Severity
  summary: string // max 120 chars
  detail: Record<string, unknown> | null // JSONB
  location: {
    // JSONB
    semanticLevel: string
    district: string | null
    station: string | null
  }
  timestamp: string // TIMESTAMPTZ (ISO 8601)
  duration_ms: number | null
  actor: string // Actor
  ai_metadata: {
    // JSONB
    prompt: string
    reasoning: string
    confidence: number
    alternativesConsidered: string[]
    provider: string
    latencyMs: number
    modelId: string | null
  } | null
  target: Record<string, unknown> | null // JSONB (CameraTarget)
  tags: string[] | null
  snapshot_id: string | null // UUID
  created_at: string // TIMESTAMPTZ
}

/** Insert type: what you provide for an INSERT. */
export interface LaunchReceiptInsert {
  id: string
  correlation_id?: string | null
  source: string
  event_type: string
  severity: string
  summary: string
  detail?: Record<string, unknown> | null
  location: Record<string, unknown>
  timestamp: string
  duration_ms?: number | null
  actor: string
  ai_metadata?: Record<string, unknown> | null
  target?: Record<string, unknown> | null
  tags?: string[] | null
  snapshot_id?: string | null
  created_at?: string
}

/** Update type: all fields optional. */
export type LaunchReceiptUpdate = Partial<LaunchReceiptInsert>

// ============================================================================
// launch_snapshots
// ============================================================================

/** Row type: what you get back from a SELECT. */
export interface LaunchSnapshotRow {
  id: string // UUID v7
  timestamp: string // TIMESTAMPTZ
  trigger: string // 'receipt' | 'periodic' | 'manual'
  data: Record<string, unknown> // JSONB (SystemSnapshot)
  receipt_id: string | null // UUID
  created_at: string // TIMESTAMPTZ
}

/** Insert type: what you provide for an INSERT. */
export interface LaunchSnapshotInsert {
  id: string
  timestamp?: string
  trigger: string
  data: Record<string, unknown>
  receipt_id?: string | null
  created_at?: string
}

/** Update type: all fields optional. */
export type LaunchSnapshotUpdate = Partial<LaunchSnapshotInsert>
```

### 4.6 UUID v7 Utility -- `src/lib/receipt-store/uuid-v7.ts`

```ts
/**
 * UUID v7 generator -- time-sortable unique identifiers.
 *
 * UUID v7 layout (RFC 9562):
 * - Bits 0-47:  Unix timestamp in milliseconds (48 bits)
 * - Bits 48-51: Version (0111 = 7)
 * - Bits 52-63: Random (12 bits)
 * - Bits 64-65: Variant (10)
 * - Bits 66-127: Random (62 bits)
 *
 * This produces UUIDs that sort chronologically, which is critical
 * for the launch_receipts table's timestamp-ordered queries.
 *
 * Zero external dependencies. Uses crypto.getRandomValues() for randomness.
 *
 * References:
 * - WS-1.7 InMemoryReceiptStore limitation note:
 *   "No UUID v7 (uses crypto.randomUUID() which is v4)"
 * - IA Assessment Section 5: "id: UUID v7 (time-sortable)"
 */

/**
 * Generate a UUID v7 string.
 *
 * Format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
 * where x is a hex digit and y is 8, 9, a, or b (variant bits).
 *
 * @returns A UUID v7 string (lowercase, hyphenated).
 */
export function uuidv7(): string {
  const now = Date.now()

  // 16 bytes = 128 bits
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  // Timestamp: 48 bits (6 bytes) in big-endian.
  // Bits 0-47 of the UUID.
  bytes[0] = (now / 2 ** 40) & 0xff
  bytes[1] = (now / 2 ** 32) & 0xff
  bytes[2] = (now / 2 ** 24) & 0xff
  bytes[3] = (now / 2 ** 16) & 0xff
  bytes[4] = (now / 2 ** 8) & 0xff
  bytes[5] = now & 0xff

  // Version: bits 48-51 = 0111 (7).
  // Clear top 4 bits of byte 6, set to 0111.
  bytes[6] = (bytes[6] & 0x0f) | 0x70

  // Variant: bits 64-65 = 10.
  // Clear top 2 bits of byte 8, set to 10.
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  // Format as UUID string.
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

/**
 * Extract the timestamp from a UUID v7.
 *
 * Useful for debugging and verifying time-sort order.
 *
 * @param uuid - A UUID v7 string.
 * @returns The embedded timestamp as a Date, or null if invalid.
 */
export function extractTimestamp(uuid: string): Date | null {
  const hex = uuid.replace(/-/g, '')
  if (hex.length !== 32) return null

  // First 12 hex chars = 48 bits of timestamp.
  const timestampHex = hex.slice(0, 12)
  const timestampMs = parseInt(timestampHex, 16)

  if (isNaN(timestampMs) || timestampMs <= 0) return null

  return new Date(timestampMs)
}
```

### 4.7 Offline Queue -- `src/lib/receipt-store/offline-queue.ts`

```ts
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
```

### 4.8 SupabaseReceiptStore -- `src/lib/receipt-store/supabase-receipt-store.ts`

```ts
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
import type { Database, LaunchReceiptInsert, LaunchSnapshotInsert } from '../supabase/types'
import { uuidv7 } from './uuid-v7'
import { OfflineQueue } from './offline-queue'

// ============================================================================
// Configuration
// ============================================================================

export interface SupabaseReceiptStoreConfig {
  /** Supabase client instance. */
  readonly client: SupabaseClient<Database>
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
  private readonly client: SupabaseClient<Database>
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
      tags: input.tags ?? null,
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

// ============================================================================
// Export
// ============================================================================

export type { SupabaseReceiptStoreConfig }
```

### 4.9 System Snapshot Store -- `src/lib/receipt-store/snapshot-store.ts`

```ts
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
import type { Database, LaunchSnapshotInsert, LaunchSnapshotRow } from '../supabase/types'
import { uuidv7 } from './uuid-v7'

// ============================================================================
// Configuration
// ============================================================================

export interface SystemSnapshotStoreConfig {
  /** Supabase client instance. */
  readonly client: SupabaseClient<Database>
}

// ============================================================================
// SystemSnapshotStore
// ============================================================================

export class SystemSnapshotStore {
  private readonly client: SupabaseClient<Database>

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
```

### 4.10 Receipt Generator -- `src/lib/receipt-store/receipt-generator.ts`

```ts
/**
 * Receipt generator for non-station mutation actions.
 *
 * Station actions generate receipts via useReceiptStamp (WS-2.6).
 * This module generates receipts for mutations that happen OUTSIDE
 * station panels:
 *
 * - Login success
 * - Navigation (district focus, return-to-hub, constellation view)
 * - System events (telemetry state change, error detection)
 *
 * Each function returns a ReceiptInput that can be passed to
 * ReceiptStore.record().
 *
 * References:
 * - AD-6: "only meaningful actions generate receipts"
 * - combined-recommendations.md: "receipt generation for all mutation actions"
 */

import type { ReceiptInput } from '@/lib/interfaces/receipt-store'
import type {
  AppIdentifier,
  CameraPosition,
  EventType,
  HealthState,
  SemanticLevel,
  SpatialLocation,
} from '@/lib/interfaces/types'
import type { CameraTarget } from '@/lib/interfaces/camera-controller'

// ============================================================================
// Login Receipt
// ============================================================================

/**
 * Generate a receipt for successful login.
 *
 * Per combined-recommendations.md Login Experience:
 * "Success: receipt stamp animation (trace ID + timestamp)"
 */
export function createLoginReceipt(): ReceiptInput {
  return {
    source: 'launch',
    eventType: 'action',
    severity: 'info',
    summary: 'Login: Authentication successful',
    detail: { action: 'login', method: 'passphrase' },
    actor: 'human',
    location: {
      semanticLevel: 'Z1',
      district: null,
      station: null,
    },
  }
}

// ============================================================================
// Navigation Receipts
// ============================================================================

/**
 * Generate a receipt for navigating to a district.
 *
 * Created when the user clicks a capsule, uses the command palette,
 * or when the AI Camera Director navigates to a district.
 */
export function createNavigationReceipt(params: {
  districtId: AppIdentifier
  districtName: string
  source: 'manual' | 'ai' | 'command-palette'
  fromLevel: SemanticLevel
  toLevel: SemanticLevel
}): ReceiptInput {
  const actorMap = {
    manual: 'human' as const,
    ai: 'ai' as const,
    'command-palette': 'human' as const,
  }

  return {
    source: 'launch',
    eventType: 'navigation',
    severity: 'info',
    summary: `Navigate: ${params.districtName} (${params.fromLevel} -> ${params.toLevel})`,
    detail: {
      action: 'navigate',
      districtId: params.districtId,
      fromLevel: params.fromLevel,
      toLevel: params.toLevel,
      trigger: params.source,
    },
    actor: actorMap[params.source],
    location: {
      semanticLevel: params.toLevel,
      district: params.districtId,
      station: null,
    },
    target: {
      type: 'district',
      districtId: params.districtId,
    } as CameraTarget,
    tags: [params.districtId, 'navigation', params.source],
  }
}

/**
 * Generate a receipt for returning to the Launch Atrium (home).
 */
export function createReturnToHubReceipt(params: {
  fromLevel: SemanticLevel
  fromDistrict: AppIdentifier | null
}): ReceiptInput {
  return {
    source: 'launch',
    eventType: 'navigation',
    severity: 'info',
    summary: 'Navigate: Return to Launch Atrium',
    detail: {
      action: 'return-to-hub',
      fromLevel: params.fromLevel,
      fromDistrict: params.fromDistrict,
    },
    actor: 'human',
    location: {
      semanticLevel: 'Z1',
      district: null,
      station: null,
    },
    target: { type: 'home' } as CameraTarget,
    tags: ['navigation', 'home'],
  }
}

/**
 * Generate a receipt for entering the Constellation view (Z0).
 */
export function createConstellationViewReceipt(params: { fromLevel: SemanticLevel }): ReceiptInput {
  return {
    source: 'launch',
    eventType: 'navigation',
    severity: 'info',
    summary: 'Navigate: Constellation view (Z0 overview)',
    detail: {
      action: 'constellation-view',
      fromLevel: params.fromLevel,
    },
    actor: 'human',
    location: {
      semanticLevel: 'Z0',
      district: null,
      station: null,
    },
    target: { type: 'constellation' } as CameraTarget,
    tags: ['navigation', 'constellation', 'z0'],
  }
}

// ============================================================================
// System Event Receipts
// ============================================================================

/**
 * Generate a receipt for a telemetry state change.
 *
 * Created when an app's health state transitions (e.g., OPERATIONAL -> DOWN).
 * Only state changes generate receipts, not every poll.
 */
export function createHealthChangeReceipt(params: {
  appId: AppIdentifier
  appName: string
  previousState: HealthState
  newState: HealthState
}): ReceiptInput {
  const severityMap: Record<HealthState, ReceiptInput['severity']> = {
    OPERATIONAL: 'info',
    DEGRADED: 'warning',
    DOWN: 'error',
    OFFLINE: 'info',
    UNKNOWN: 'info',
  }

  return {
    source: params.appId,
    eventType: 'system',
    severity: severityMap[params.newState],
    summary: `Health: ${params.appName} ${params.previousState} -> ${params.newState}`,
    detail: {
      action: 'health-change',
      appId: params.appId,
      previousState: params.previousState,
      newState: params.newState,
    },
    actor: 'system',
    location: {
      semanticLevel: 'Z1',
      district: params.appId,
      station: null,
    },
    target: {
      type: 'district',
      districtId: params.appId,
    } as CameraTarget,
    tags: [params.appId, 'health', params.newState.toLowerCase()],
  }
}

/**
 * Generate a receipt for an error detected during telemetry polling.
 */
export function createTelemetryErrorReceipt(params: {
  appId: AppIdentifier
  appName: string
  error: string
}): ReceiptInput {
  return {
    source: params.appId,
    eventType: 'error',
    severity: 'error',
    summary: `Error: ${params.appName} telemetry failed`.slice(0, 120),
    detail: {
      action: 'telemetry-error',
      appId: params.appId,
      error: params.error,
    },
    actor: 'system',
    location: {
      semanticLevel: 'Z1',
      district: params.appId,
      station: null,
    },
    tags: [params.appId, 'error', 'telemetry'],
  }
}
```

### 4.11 Barrel Export -- `src/lib/receipt-store/index.ts`

```ts
// Receipt Store — Public API
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
```

### 4.12 React Hook: useSupabaseReceipts -- `src/hooks/use-supabase-receipts.ts`

````ts
'use client'

/**
 * React hook providing a SupabaseReceiptStore instance.
 *
 * Creates a singleton SupabaseReceiptStore and provides it to components.
 * This hook replaces InMemoryReceiptStore everywhere it was used in Phase 2.
 *
 * Usage:
 * ```tsx
 * const { receiptStore, offlineQueueLength } = useSupabaseReceipts()
 *
 * // Pass to StationPanel (WS-2.6)
 * <StationPanel receiptStore={receiptStore} ... />
 *
 * // Record a receipt directly
 * await receiptStore.record(createLoginReceipt())
 * ```
 *
 * References:
 * - WS-2.6: StationPanel accepts receiptStore prop
 * - WS-1.7: ReceiptStore interface
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { SupabaseReceiptStore } from '@/lib/receipt-store/supabase-receipt-store'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'

// ============================================================================
// Types
// ============================================================================

export interface UseSupabaseReceiptsReturn {
  /** The SupabaseReceiptStore instance. Stable reference across re-renders. */
  readonly receiptStore: SupabaseReceiptStore
  /** Number of receipts queued for offline flush. */
  readonly offlineQueueLength: number
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Provides a SupabaseReceiptStore instance.
 *
 * @param getSystemSnapshot - Optional function to get the current system snapshot.
 *   If provided, every receipt will be linked to a snapshot for rehydration.
 *   Typically: `() => systemStateProvider.getSnapshot()`
 */
export function useSupabaseReceipts(
  getSystemSnapshot?: () => SystemSnapshot | null
): UseSupabaseReceiptsReturn {
  const [offlineQueueLength, setOfflineQueueLength] = useState(0)
  const snapshotRef = useRef(getSystemSnapshot)
  snapshotRef.current = getSystemSnapshot

  const receiptStore = useMemo(() => {
    const client = getSupabaseBrowserClient()
    return new SupabaseReceiptStore({
      client,
      captureSnapshotPerReceipt: true,
      getSystemSnapshot: () => snapshotRef.current?.() ?? null,
    })
  }, [])

  // Periodically check offline queue length and attempt to flush.
  useEffect(() => {
    const interval = setInterval(() => {
      setOfflineQueueLength(receiptStore.offlineQueueLength)

      if (receiptStore.offlineQueueLength > 0) {
        receiptStore.flushOfflineQueue().catch(() => {
          // Flush failed; items remain queued. Will retry next interval.
        })
      }
    }, 10_000) // Check every 10 seconds.

    return () => clearInterval(interval)
  }, [receiptStore])

  return { receiptStore, offlineQueueLength }
}
````

### 4.13 React Hook: useSnapshotPolling -- `src/hooks/use-snapshot-polling.ts`

```ts
'use client'

/**
 * React hook for periodic system snapshot storage.
 *
 * Captures a SystemSnapshot every `intervalMs` milliseconds and stores
 * it in the launch_snapshots table as a 'periodic' snapshot.
 *
 * These periodic snapshots serve as baseline data for the Evidence Ledger
 * (WS-3.2) and receipt rehydration metric comparison. They provide
 * continuous state tracking independent of user actions.
 *
 * References:
 * - combined-recommendations.md WS-3.1: "periodic system snapshot storage"
 * - AD-5: telemetry polling cadence (adaptive, but snapshots are fixed 30s)
 */

import { useEffect, useRef } from 'react'
import type { SystemSnapshot } from '@/lib/interfaces/system-state-provider'
import { SystemSnapshotStore } from '@/lib/receipt-store/snapshot-store'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

// ============================================================================
// Types
// ============================================================================

export interface UseSnapshotPollingOptions {
  /**
   * Function that returns the current system snapshot.
   * Typically: `() => systemStateProvider.getSnapshot()`
   */
  readonly getSnapshot: () => SystemSnapshot | null
  /**
   * Polling interval in milliseconds.
   * Default: 30000 (30 seconds, matching narration cadence per AD-6).
   */
  readonly intervalMs?: number
  /**
   * Whether polling is enabled.
   * Default: true. Set to false to pause snapshot capture.
   */
  readonly enabled?: boolean
}

// ============================================================================
// Hook
// ============================================================================

export function useSnapshotPolling(options: UseSnapshotPollingOptions): void {
  const { getSnapshot, intervalMs = 30_000, enabled = true } = options

  // Use refs to avoid re-creating the interval when callbacks change.
  const getSnapshotRef = useRef(getSnapshot)
  getSnapshotRef.current = getSnapshot

  const storeRef = useRef<SystemSnapshotStore | null>(null)

  // Initialize the snapshot store once.
  useEffect(() => {
    storeRef.current = new SystemSnapshotStore({
      client: getSupabaseBrowserClient(),
    })
  }, [])

  // Periodic snapshot capture.
  useEffect(() => {
    if (!enabled) return

    const capture = async () => {
      const snapshot = getSnapshotRef.current()
      if (!snapshot || !storeRef.current) return

      await storeRef.current.store(snapshot, 'periodic')
    }

    // Capture immediately on mount, then on interval.
    capture()
    const interval = setInterval(capture, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs, enabled])
}
```

### 4.14 API Route: Receipts -- `src/app/api/receipts/route.ts`

```ts
/**
 * Receipt API Route Handler.
 *
 * GET /api/receipts — Query receipts with filters.
 * POST /api/receipts — Record a new receipt.
 *
 * Server-side alternative to direct Supabase client usage.
 * Primary consumers: server components, external scripts, debugging.
 *
 * References:
 * - AD-6 (Receipt System)
 * - WS-1.7 ReceiptStore interface
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/client'
import { uuidv7 } from '@/lib/receipt-store/uuid-v7'
import type { ReceiptInput } from '@/lib/interfaces/receipt-store'

// ============================================================================
// GET /api/receipts
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const client = createSupabaseServerClient()
  const { searchParams } = request.nextUrl

  let query = client.from('launch_receipts').select('*').order('timestamp', { ascending: false })

  // Parse filter parameters.
  const sources = searchParams.get('sources')
  if (sources) {
    query = query.in('source', sources.split(','))
  }

  const eventTypes = searchParams.get('eventTypes')
  if (eventTypes) {
    query = query.in('event_type', eventTypes.split(','))
  }

  const severities = searchParams.get('severities')
  if (severities) {
    query = query.in('severity', severities.split(','))
  }

  const actor = searchParams.get('actor')
  if (actor) {
    query = query.eq('actor', actor)
  }

  const district = searchParams.get('district')
  if (district) {
    query = query.eq('location->>district', district)
  }

  const correlationId = searchParams.get('correlationId')
  if (correlationId) {
    query = query.eq('correlation_id', correlationId)
  }

  const startTime = searchParams.get('start')
  const endTime = searchParams.get('end')
  if (startTime) query = query.gte('timestamp', startTime)
  if (endTime) query = query.lte('timestamp', endTime)

  const search = searchParams.get('search')
  if (search) {
    query = query.textSearch('summary', search, {
      type: 'websearch',
      config: 'english',
    })
  }

  const limit = parseInt(searchParams.get('limit') ?? '100', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ receipts: data ?? [], count: data?.length ?? 0 })
}

// ============================================================================
// POST /api/receipts
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const client = createSupabaseServerClient()

  let body: ReceiptInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate required fields.
  if (
    !body.source ||
    !body.eventType ||
    !body.severity ||
    !body.summary ||
    !body.actor ||
    !body.location
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: source, eventType, severity, summary, actor, location' },
      { status: 400 }
    )
  }

  const receiptId = uuidv7()
  const timestamp = new Date().toISOString()

  const { data, error } = await client
    .from('launch_receipts')
    .insert({
      id: receiptId,
      correlation_id: body.correlationId ?? null,
      source: body.source,
      event_type: body.eventType,
      severity: body.severity,
      summary: body.summary.slice(0, 120),
      detail: body.detail ?? null,
      location: body.location as unknown as Record<string, unknown>,
      timestamp,
      duration_ms: body.durationMs ?? null,
      actor: body.actor,
      ai_metadata: body.aiMetadata ? (body.aiMetadata as unknown as Record<string, unknown>) : null,
      target: body.target ? (body.target as unknown as Record<string, unknown>) : null,
      tags: body.tags ?? null,
      snapshot_id: null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ receipt: data }, { status: 201 })
}
```

### 4.15 API Route: Single Receipt -- `src/app/api/receipts/[id]/route.ts`

```ts
/**
 * Single Receipt API Route Handler.
 *
 * GET /api/receipts/:id — Get a single receipt by ID.
 *
 * References:
 * - WS-1.7 ReceiptStore.getById()
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const client = createSupabaseServerClient()

  const { data, error } = await client.from('launch_receipts').select('*').eq('id', id).single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ receipt: data })
}
```

### 4.16 API Route: Snapshots -- `src/app/api/snapshots/route.ts`

```ts
/**
 * Snapshot API Route Handler.
 *
 * GET /api/snapshots — Query snapshots by receipt ID or time range.
 * POST /api/snapshots — Record a system snapshot.
 *
 * References:
 * - AD-6 (Receipt System -- metric comparison)
 * - WS-1.7 SystemSnapshot
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/client'
import { uuidv7 } from '@/lib/receipt-store/uuid-v7'

// ============================================================================
// GET /api/snapshots
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  const client = createSupabaseServerClient()
  const { searchParams } = request.nextUrl

  const receiptId = searchParams.get('receiptId')
  if (receiptId) {
    // Get snapshot linked to a specific receipt.
    const { data, error } = await client
      .from('launch_snapshots')
      .select('*')
      .eq('receipt_id', receiptId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'No snapshot found for this receipt' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ snapshot: data })
  }

  // Otherwise, query by time range.
  let query = client.from('launch_snapshots').select('*').order('timestamp', { ascending: false })

  const trigger = searchParams.get('trigger')
  if (trigger) {
    query = query.eq('trigger', trigger)
  }

  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (start) query = query.gte('timestamp', start)
  if (end) query = query.lte('timestamp', end)

  const limit = parseInt(searchParams.get('limit') ?? '50', 10)
  query = query.limit(limit)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ snapshots: data ?? [] })
}

// ============================================================================
// POST /api/snapshots
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const client = createSupabaseServerClient()

  let body: { data: Record<string, unknown>; trigger: string; receiptId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.data || !body.trigger) {
    return NextResponse.json({ error: 'Missing required fields: data, trigger' }, { status: 400 })
  }

  const snapshotId = uuidv7()

  const { data, error } = await client
    .from('launch_snapshots')
    .insert({
      id: snapshotId,
      trigger: body.trigger,
      data: body.data,
      receipt_id: body.receiptId ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ snapshot: data }, { status: 201 })
}
```

### 4.17 ReceiptInput Interface Extension

The `ReceiptInput` interface defined in WS-1.7 (`src/lib/interfaces/receipt-store.ts`) must be extended with two optional fields to support receipt rehydration and searchable tags. This resolves the gap between WS-1.7 and WS-2.6 (the `useReceiptStamp` hook in WS-2.6 already passes `target` and `tags`).

**Change to `src/lib/interfaces/receipt-store.ts`:**

```ts
// Add these imports at the top of the file:
import type { CameraTarget } from './camera-controller'

// Extend ReceiptInput with two new optional fields:
export interface ReceiptInput {
  readonly correlationId?: string | null
  readonly source: ReceiptSource
  readonly eventType: EventType
  readonly severity: Severity
  readonly summary: string
  readonly detail?: Record<string, unknown> | null
  readonly location: SpatialLocation
  readonly durationMs?: number | null
  readonly actor: Actor
  readonly aiMetadata?: AIReceiptMetadata | null
  // --- New fields (WS-3.1) ---
  /**
   * Camera target for receipt rehydration navigation.
   * When a receipt is clicked in the Evidence Ledger, the viewport
   * navigates to this target to restore spatial context.
   *
   * Added by WS-3.1 to resolve the gap between WS-1.7 and WS-2.6.
   * The useReceiptStamp hook (WS-2.6) already populates this field.
   */
  readonly target?: CameraTarget | null
  /**
   * Searchable tags for faceted filtering.
   * Typically: [districtId, stationName, actionId].
   *
   * Added by WS-3.1 to resolve the gap between WS-1.7 and WS-2.6.
   */
  readonly tags?: readonly string[] | null
}
```

This is a backward-compatible change: both fields are optional, so all existing callers of `record()` continue to work without modification. The `useReceiptStamp` hook in WS-2.6 already passes these fields; the InMemoryReceiptStore silently ignores them (they are not part of `LaunchReceipt`). The SupabaseReceiptStore stores them in dedicated columns.

---

## 5. Acceptance Criteria

| ID    | Criterion                                                                                                                                                                                               | Verification Method                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `launch_receipts` table exists in Supabase with all 15 columns (12 AIA fields + `target`, `tags`, `snapshot_id`) and all `CHECK` constraints pass validation                                            | Run migration via `supabase db push`; verify table structure with `\d launch_receipts` in psql; attempt invalid `source` value and confirm rejection                                                           |
| AC-2  | `launch_snapshots` table exists with `id`, `timestamp`, `trigger`, `data`, `receipt_id`, `created_at` columns and FK constraint to `launch_receipts`                                                    | Run migration; verify structure; insert snapshot with valid `receipt_id` and confirm FK passes; insert with invalid `receipt_id` and confirm FK rejects                                                        |
| AC-3  | RLS policies on both tables allow all operations when using the anon key                                                                                                                                | Connect via Supabase client with anon key; perform INSERT, SELECT, UPDATE, DELETE on both tables; all succeed                                                                                                  |
| AC-4  | `uuidv7()` generates valid UUID v7 strings: 36 chars, correct hyphen positions, version nibble = 7, variant bits = 10                                                                                   | Unit test: generate 1000 UUIDs; regex-validate format; verify `uuid[14]` is `'7'`; verify `uuid[19]` is in `['8','9','a','b']`                                                                                 |
| AC-5  | `uuidv7()` produces time-sortable IDs: UUIDs generated 1ms apart sort lexicographically in chronological order                                                                                          | Unit test: generate UUIDs with 1ms delays; sort alphabetically; verify order matches chronological order                                                                                                       |
| AC-6  | `extractTimestamp()` correctly recovers the embedded timestamp from a UUID v7 within 1ms precision                                                                                                      | Unit test: generate UUID, extract timestamp, compare to `Date.now()` at generation time; difference <= 1ms                                                                                                     |
| AC-7  | `SupabaseReceiptStore.record()` inserts a row into `launch_receipts` and returns a complete `LaunchReceipt` with UUID v7 `id` and ISO timestamp                                                         | Integration test: call `record()` with minimal `ReceiptInput`; verify returned receipt has all 12 fields; query Supabase directly and confirm row exists                                                       |
| AC-8  | `SupabaseReceiptStore.record()` captures and links a system snapshot when `captureSnapshotPerReceipt` is true and `getSystemSnapshot` returns data                                                      | Integration test: configure store with a mock snapshot provider; call `record()`; verify `launch_snapshots` has a new row with `trigger='receipt'`; verify receipt's `snapshot_id` matches the snapshot's `id` |
| AC-9  | `SupabaseReceiptStore.query()` correctly applies all filter types: sources, eventTypes, severities, timeRange, actor, district, search, limit, offset                                                   | Integration test: insert 20 varied receipts; query with each filter individually; verify result counts match expectations                                                                                      |
| AC-10 | Full-text search via `query({ search: 'pipeline' })` returns receipts whose summary contains the search term (with stemming)                                                                            | Integration test: insert receipts with summaries containing "Pipeline", "pipeline", "pipelines"; search for "pipeline"; verify all three match                                                                 |
| AC-11 | `SupabaseReceiptStore.getByCorrelation()` returns all receipts sharing a correlation ID, ordered chronologically                                                                                        | Integration test: insert 3 receipts with same `correlation_id`; call `getByCorrelation()`; verify 3 results in ascending timestamp order                                                                       |
| AC-12 | Offline queue: when Supabase is unreachable, `record()` returns a receipt (from local construction) and enqueues the insert; when connectivity resumes, `flushOfflineQueue()` persists the queued items | Unit test: mock Supabase client to reject inserts; call `record()`; verify receipt returned; verify queue length = 1; unmock client; call `flushOfflineQueue()`; verify queue length = 0 and row exists in DB  |
| AC-13 | `useSupabaseReceipts()` hook returns a stable `SupabaseReceiptStore` reference across re-renders                                                                                                        | React testing: render component using the hook; re-render; verify `receiptStore` reference is identical (referential equality)                                                                                 |
| AC-14 | `useSnapshotPolling()` captures a system snapshot every 30 seconds and stores it as a 'periodic' snapshot in `launch_snapshots`                                                                         | Integration test with fake timers: enable hook; advance timer by 30s; verify `launch_snapshots` has 1 periodic snapshot; advance 30s more; verify 2 periodic snapshots                                         |
| AC-15 | `GET /api/receipts` returns receipts filtered by query parameters with correct pagination                                                                                                               | HTTP test: insert 5 receipts; call `GET /api/receipts?source=launch&limit=2`; verify 2 results with `source=launch`                                                                                            |
| AC-16 | `POST /api/receipts` creates a receipt and returns 201 with the created receipt                                                                                                                         | HTTP test: POST with valid `ReceiptInput`; verify 201 status; verify response contains receipt with UUID v7 `id`                                                                                               |
| AC-17 | `POST /api/receipts` returns 400 for missing required fields                                                                                                                                            | HTTP test: POST with empty body; verify 400 status with error message listing missing fields                                                                                                                   |
| AC-18 | `GET /api/receipts/[id]` returns the receipt for a valid ID and 404 for a non-existent ID                                                                                                               | HTTP test: insert receipt; GET by ID; verify 200 with correct data; GET with random UUID; verify 404                                                                                                           |
| AC-19 | `GET /api/snapshots?receiptId=xxx` returns the snapshot linked to a receipt                                                                                                                             | HTTP test: create receipt with snapshot; GET snapshot by receipt ID; verify snapshot data matches                                                                                                              |
| AC-20 | `ReceiptInput` interface accepts optional `target` and `tags` fields without breaking existing callers                                                                                                  | TypeScript compilation: verify WS-2.6 `useReceiptStamp` compiles without changes; verify WS-1.7 `InMemoryReceiptStore` compiles without changes; verify `SupabaseReceiptStore` stores `target` and `tags`      |
| AC-21 | Receipt generators (`createLoginReceipt`, `createNavigationReceipt`, `createHealthChangeReceipt`, etc.) return valid `ReceiptInput` objects that pass `record()` without error                          | Unit test: call each generator; pass result to `SupabaseReceiptStore.record()`; verify no errors                                                                                                               |
| AC-22 | `summary` field is truncated to 120 characters by `SupabaseReceiptStore.record()` before insert                                                                                                         | Unit test: call `record()` with a 200-character summary; verify the stored receipt's summary is exactly 120 characters                                                                                         |
| AC-23 | All TypeScript code compiles with `strict: true` and zero `any` types in public APIs                                                                                                                    | Run `pnpm typecheck`; verify zero errors; grep for `any` in public interfaces                                                                                                                                  |
| AC-24 | `prune_old_periodic_snapshots()` database function deletes periodic snapshots older than the specified retention period while preserving receipt-linked snapshots                                       | Integration test: insert periodic snapshots dated 60 days ago and receipt snapshots dated 60 days ago; call prune with 30 days; verify periodic snapshots deleted; verify receipt snapshots preserved          |

---

## 6. Decisions Made

| ID   | Decision                                                                                                   | Rationale                                                                                                                                                                                                                                                                                                                                                                                                      | Reference                                                                                                              |
| ---- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| D-1  | UUID v7 generated in application code, not by PostgreSQL                                                   | The `launch_receipts.id` must be a UUID v7 (time-sortable) per IA Assessment Section 5. PostgreSQL's `gen_random_uuid()` generates v4. A custom application-side generator avoids requiring a PostgreSQL extension (`pg_uuidv7`) and ensures consistent ID format across server and client.                                                                                                                    | IA Assessment Section 5; WS-1.7 InMemoryReceiptStore limitation note                                                   |
| D-2  | Capture a system snapshot with every receipt (not periodic-only)                                           | Expected receipt volume is 5-15 per session (AD-6). At ~2-5KB per snapshot, that is 10-75KB per session -- negligible. Per-receipt snapshots enable precise "then vs. now" comparison without interpolation between periodic snapshots. The cost/benefit ratio strongly favors per-receipt capture.                                                                                                            | AD-6 (Receipt System -- rehydration metric comparison); combined-recommendations.md "periodic system snapshot storage" |
| D-3  | Extend `ReceiptInput` with `target` and `tags` (backward-compatible optional fields)                       | WS-2.6's `useReceiptStamp` hook already populates `target` (CameraTarget for rehydration navigation) and `tags` (searchable array). These fields were used in WS-2.6 but not defined in WS-1.7's `ReceiptInput`. Adding them as optional fields is backward-compatible: all existing callers work without changes. The `InMemoryReceiptStore` silently ignores them; the `SupabaseReceiptStore` persists them. | WS-2.6 `use-receipt-stamp.ts` lines 462-467; WS-1.7 OQ-4                                                               |
| D-4  | Client-side Supabase as primary data path (not API routes)                                                 | The primary consumer is the Evidence Ledger (WS-3.2), a client component. Direct Supabase client usage avoids an extra HTTP hop through API routes. API routes exist as a server-side convenience for Route Handlers and debugging, not as the primary path. Supabase client handles connection pooling and retry internally.                                                                                  | Gap #5 "Supabase client accessed from both Route Handlers and client components"                                       |
| D-5  | Offline queue is in-memory only (not persisted to localStorage)                                            | Receipt volume is low (5-15/session) and the tool is localhost. If the browser closes during a Supabase outage, losing a few receipts is acceptable. localStorage adds complexity (serialization, size limits, stale detection) for minimal benefit. The queue flushes automatically every 10 seconds.                                                                                                         | combined-recommendations.md Risk #9                                                                                    |
| D-6  | Use `CHECK` constraints instead of PostgreSQL `ENUM` types for `source`, `event_type`, `severity`, `actor` | `CHECK` constraints are easier to modify: adding a new source app requires only an `ALTER TABLE` to update the constraint, not a type migration. ENUMs require `ALTER TYPE ... ADD VALUE` which cannot be rolled back in a transaction. Since this is a localhost tool with frequent iteration, flexibility outweighs the marginal type safety of ENUMs.                                                       | PostgreSQL best practices for evolving schemas                                                                         |
| D-7  | Periodic snapshots on a fixed 30-second interval (not adaptive like telemetry polling)                     | Telemetry polling is adaptive (5s-30s per AD-5), but snapshots need a consistent cadence for reliable metric comparison. A fixed 30s interval provides predictable baseline data points without coupling snapshot frequency to telemetry health. 30s matches the narration generation cadence (AD-6).                                                                                                          | AD-5 (Telemetry Polling); combined-recommendations.md Phase 3 Work Area 6                                              |
| D-8  | Full-text search uses PostgreSQL `to_tsvector('english', summary)` with GIN index                          | Supabase's `.textSearch()` maps to PostgreSQL's full-text search. The English configuration provides stemming and stop-word removal, which is sufficient for 120-character summaries. No external search engine is needed for this volume.                                                                                                                                                                     | Supabase documentation on full-text search                                                                             |
| D-9  | `snapshot_id` FK on `launch_receipts` uses `ON DELETE SET NULL` (not `CASCADE`)                            | If a snapshot is deleted (e.g., by periodic cleanup), the receipt should survive. Setting `snapshot_id` to NULL means the receipt loses its "then" comparison data but remains in the audit trail. Receipts are immutable; cascading deletes would violate the audit log guarantee.                                                                                                                            | AD-6 (receipts are immutable records)                                                                                  |
| D-10 | No Supabase Realtime subscriptions for cross-tab receipt synchronization                                   | Per combined-recommendations.md Deferred Item #9: "Realtime subscriptions for existing app tables require RLS policy changes in those apps." The Launch is a single-tab tool (sessionStorage-based auth). Local subscriber notification within the store instance is sufficient. Realtime is a Phase 5+ upgrade if multi-tab support is needed.                                                                | combined-recommendations.md Deferred Item #9                                                                           |

---

## 7. Open Questions

| ID   | Question                                                                                                                                                                                                                                                             | Priority | Owner              | Resolution Trigger                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------ | -------------------------------------------------- |
| OQ-1 | Should the `launch_receipts` table include a `session_id` column to group receipts by browser session? This would enable "session replay" features in the Evidence Ledger.                                                                                           | Low      | Backend Developer  | WS-3.2 (Evidence Ledger) requirements finalization |
| OQ-2 | Should periodic snapshots be stored at a different interval during active issues (DEGRADED/DOWN state)? Tighter snapshots during incidents would provide higher-resolution metric comparison.                                                                        | Low      | Backend Developer  | Post-WS-3.1 performance review                     |
| OQ-3 | The Supabase project setup (creating the project, obtaining URL + anon key, running migrations) is a prerequisite but not covered by any workstream. Should a WS-0.x be created for this?                                                                            | Medium   | PMO                | Phase 3 kickoff planning                           |
| OQ-4 | Should the `useReceiptStamp` hook in WS-2.6 be updated to make `record()` async-aware? Currently it calls `receiptStore.record()` synchronously (fire-and-forget). The SupabaseReceiptStore's `record()` returns a Promise that could be awaited for error handling. | Low      | Frontend Developer | WS-2.6 and WS-3.1 integration testing              |
| OQ-5 | What is the retention policy for receipt data? Should old receipts be archived or deleted after a time period? For a single-user localhost tool, unlimited retention is likely fine, but storage may grow over months of use.                                        | Low      | Stakeholder        | Post-launch usage observation                      |

---

## 8. Risk Register

| ID   | Risk                                                                                                                                                    | Likelihood | Impact | Severity | Mitigation                                                                                                                                                                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1  | Supabase project not available or not configured when WS-3.1 development begins                                                                         | Medium     | High   | High     | Document Supabase setup steps in the workstream README. Provide a `supabase start` (local) fallback. The offline queue ensures the app still functions without Supabase -- receipts queue in memory and flush when connected.                                        |
| R-2  | UUID v7 custom implementation produces non-compliant IDs (wrong version/variant bits, non-sortable)                                                     | Low        | Medium | Low      | Comprehensive unit tests verify format compliance and sort order. The `extractTimestamp()` function provides a round-trip verification. Test with 10,000+ generated IDs.                                                                                             |
| R-3  | Supabase insert latency (network round-trip) delays receipt stamp animation or blocks user interaction                                                  | Medium     | Medium | Medium   | `SupabaseReceiptStore.record()` notifies local subscribers immediately (before awaiting the Supabase insert). The receipt stamp animation fires instantly. The Supabase write is effectively fire-and-forget from the UI's perspective.                              |
| R-4  | Full-text search on short summaries (max 120 chars) returns poor results due to insufficient text for stemming                                          | Low        | Low    | Low      | Supplement with exact `ILIKE` search as fallback. The `tags` array provides an alternative faceted search path that does not depend on text analysis.                                                                                                                |
| R-5  | System snapshot data size grows if `AppState.raw` contains large payloads from Tarva apps                                                               | Low        | Medium | Low      | Monitor snapshot sizes during development. If snapshots exceed 10KB, add a `maxSnapshotSizeBytes` config that strips `raw` fields from the snapshot before storage.                                                                                                  |
| R-6  | Offline queue grows unbounded if Supabase is down for an extended period                                                                                | Low        | Low    | Low      | Cap queue at 100 items (approximately 1 hour of heavy use). Oldest items are dropped when the cap is reached. Log a warning when items are dropped.                                                                                                                  |
| R-7  | `ReceiptInput` extension (`target` + `tags`) breaks TypeScript compilation for existing callers                                                         | Low        | High   | Medium   | Both fields are optional with `?` modifier. The `InMemoryReceiptStore.record()` accepts `ReceiptInput` and spreads only known fields into `LaunchReceipt`. The new fields are silently ignored by Phase 1/2 code. Verify with `pnpm typecheck` across the full repo. |
| R-8  | FK constraint between `launch_receipts.snapshot_id` and `launch_snapshots.id` causes insert ordering issues when both are created in the same operation | Medium     | Medium | Medium   | Insert the snapshot first, then the receipt with `snapshot_id`. The `SupabaseReceiptStore.record()` method enforces this order. The FK uses `ON DELETE SET NULL` to handle any cleanup issues gracefully.                                                            |
| R-9  | Migration files conflict with future Supabase migrations from other workstreams or Tarva apps                                                           | Low        | Medium | Low      | Use Launch-specific table prefixes (`launch_*`) per Gap #5. Coordinate migration file numbering with other workstreams. The Launch schema is isolated from existing Tarva app tables (read-only access to app tables).                                               |
| R-10 | Periodic snapshot polling (30s) adds unnecessary Supabase writes when the user is idle                                                                  | Low        | Low    | Low      | The `useSnapshotPolling` hook accepts an `enabled` prop. Disable polling when the tab is not visible (`document.hidden`). Periodic snapshots are ~2-5KB each; at 30s intervals, that is 120 snapshots/hour = ~600KB/hour -- negligible.                              |

---

## 9. Implementation Checklist

Ordered by dependency. Each item should be a single, testable commit.

- [ ] 1. Create Supabase migration `001_launch_receipts.sql` with full schema, indexes, RLS, and comments. (Deliverable 4.2)
- [ ] 2. Create Supabase migration `002_launch_snapshots.sql` with schema, indexes, RLS, FK constraint, and `prune_old_periodic_snapshots` function. (Deliverable 4.3)
- [ ] 3. Run migrations against Supabase (local or cloud). Verify table structures and constraints.
- [ ] 4. Implement `src/lib/supabase/client.ts` with browser and server client singletons. (Deliverable 4.4)
- [ ] 5. Implement `src/lib/supabase/types.ts` with database row/insert/update types. (Deliverable 4.5)
- [ ] 6. Implement `src/lib/receipt-store/uuid-v7.ts` with `uuidv7()` and `extractTimestamp()`. Write unit tests for format compliance and sort order. (Deliverable 4.6)
- [ ] 7. Implement `src/lib/receipt-store/offline-queue.ts` with `OfflineQueue` class. Write unit tests for enqueue, flush, and error handling. (Deliverable 4.7)
- [ ] 8. Implement `src/lib/receipt-store/supabase-receipt-store.ts` with full `ReceiptStore` interface implementation. (Deliverable 4.8)
- [ ] 9. Implement `src/lib/receipt-store/snapshot-store.ts` with `SystemSnapshotStore` class. (Deliverable 4.9)
- [ ] 10. Implement `src/lib/receipt-store/receipt-generator.ts` with all receipt generator functions. Write unit tests. (Deliverable 4.10)
- [ ] 11. Write `src/lib/receipt-store/index.ts` barrel export. (Deliverable 4.11)
- [ ] 12. Implement `src/hooks/use-supabase-receipts.ts` hook. (Deliverable 4.12)
- [ ] 13. Implement `src/hooks/use-snapshot-polling.ts` hook. (Deliverable 4.13)
- [ ] 14. Implement `src/app/api/receipts/route.ts` (GET + POST). (Deliverable 4.14)
- [ ] 15. Implement `src/app/api/receipts/[id]/route.ts` (GET). (Deliverable 4.15)
- [ ] 16. Implement `src/app/api/snapshots/route.ts` (GET + POST). (Deliverable 4.16)
- [ ] 17. Extend `ReceiptInput` in `src/lib/interfaces/receipt-store.ts` with `target` and `tags` fields. Run `pnpm typecheck` to verify backward compatibility. (Deliverable 4.17)
- [ ] 18. Wire `SupabaseReceiptStore` into the provider tree, replacing `InMemoryReceiptStore` in the component that provides `receiptStore` to station panels.
- [ ] 19. Add login receipt generation in the login flow (call `createLoginReceipt()` on successful auth).
- [ ] 20. Add navigation receipt generation in the camera controller (call `createNavigationReceipt()` on district focus, `createReturnToHubReceipt()` on return-to-hub).
- [ ] 21. Add health change receipt generation in the telemetry aggregator (call `createHealthChangeReceipt()` on state transitions).
- [ ] 22. Enable `useSnapshotPolling` in the hub layout to capture periodic snapshots.
- [ ] 23. Write integration tests for `SupabaseReceiptStore` against a real Supabase instance (local or test project).
- [ ] 24. Write integration tests for API route handlers.
- [ ] 25. Verify AC-1 through AC-24 pass.
- [ ] 26. Run `pnpm lint` and `pnpm typecheck` with zero errors.
