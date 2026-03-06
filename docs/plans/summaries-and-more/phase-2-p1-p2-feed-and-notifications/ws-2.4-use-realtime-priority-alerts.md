# WS-2.4: useRealtimePriorityAlerts Hook

> **Workstream ID:** WS-2.4
> **Phase:** 2 — P1/P2 Feed & Real-Time Notifications
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-2.1
> **Blocks:** WS-2.5
> **Resolves:** Validation concern about dual data channel consistency

## 1. Objective

Establish a Supabase Realtime WebSocket subscription on the `intel_normalized` table, filtered to P1 and P2 operational priority inserts, to push low-latency alert arrivals into the application. The hook's sole data-side responsibility is to **invalidate** the TanStack Query cache for WS-2.1's priority feed, triggering a refetch through the established REST path (`tarvariGet('/console/priority-feed')`). It also provides an event callback for WS-2.5's notification system to fire immediate toasts and browser notifications from the Realtime payload without waiting for the REST round-trip.

This is the application's first Supabase Realtime integration. It introduces a second data channel (WebSocket push) alongside the existing REST polling, and the architecture must guarantee that TanStack Query remains the single source of truth for all rendered UI state. The Realtime channel is a **cache invalidation signal**, not a data source.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `useRealtimePriorityAlerts` hook | New hook at `src/hooks/use-realtime-priority-alerts.ts`. Subscribes to Supabase Realtime `postgres_changes` on `intel_normalized` table filtered to `operational_priority IN ('P1', 'P2')`. |
| Supabase channel lifecycle | Create channel on mount, subscribe, monitor connection status, clean up (`removeChannel`) on unmount. |
| TanStack Query cache invalidation | On each INSERT event, call `queryClient.invalidateQueries()` targeting WS-2.1's priority feed query key. This triggers a refetch through the REST API — no direct UI state mutation. |
| Event callback for notifications | Invoke an `onAlert` callback with the Realtime payload so WS-2.5's notification system can fire immediate toasts/browser notifications from the INSERT data. |
| Connection status tracking | Expose `connectionStatus` (`'connecting' | 'connected' | 'disconnected' | 'error'`) so consuming components can adjust behavior (e.g., WS-2.1 polling interval) and display connection health in diagnostics. |
| Graceful fallback to polling | When the Realtime connection fails or cannot be established, the hook reports `'disconnected'` or `'error'` status. WS-2.1 reads this status and reduces its polling interval from 15s to 10s as a compensating control. |
| `RealtimeConnectionStatus` type | Exported union type for connection states, consumed by WS-2.1 and diagnostic UI. |
| `PRIORITY_ALERT_CHANNEL_NAME` constant | Named constant for the Supabase Realtime channel identifier. Prevents typo drift and makes grep-ability straightforward. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `usePriorityFeed` hook (WS-2.1) | Separate workstream. WS-2.4 invalidates its cache but does not implement the feed query itself. |
| Notification UI (toasts, browser notifications) | WS-2.5 consumes the `onAlert` callback. WS-2.4 provides the event trigger, not the notification rendering. |
| Coverage store changes | WS-2.6 adds `notificationConsent` and `priorityFeedExpanded`. WS-2.4 does not modify the Zustand store. |
| Supabase Realtime RLS policy creation | Backend team responsibility (Backend Phase B.4). WS-2.4 assumes the policy exists and handles failure gracefully if it does not. |
| `operational_priority` column addition to `intel_normalized` | Backend Phase A responsibility. WS-2.4 depends on this column existing for the Realtime filter to function. |
| `IntelNormalizedRow` type update | WS-1.1 D-6 explicitly scoped this out. The Supabase Realtime payload is typed locally within this hook using a dedicated `RealtimeAlertPayload` interface. |
| Realtime subscriptions for non-priority events | Only P1 and P2 INSERTs are subscribed. Lower-priority inserts, UPDATEs, and DELETEs are not needed for the notification use case. |
| `NEXT_PUBLIC_DATA_MODE` branching | The data mode env var (AD-10) controls REST fetching in hooks. Realtime is Supabase-native and operates independently of the `console` vs `supabase` data mode. Both modes benefit from push invalidation. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-2.1 deliverables | Exported query key constant (e.g., `PRIORITY_FEED_QUERY_KEY`) from `src/hooks/use-priority-feed.ts`. WS-2.4 invalidates this exact key. | Pending (WS-2.1 not yet implemented) |
| WS-0.2 deliverables | `OperationalPriority` type (`'P1' \| 'P2' \| 'P3' \| 'P4'`) from `src/lib/interfaces/coverage.ts`. Used for typing the priority filter values. | Pending (WS-0.2 not yet implemented) |
| `src/lib/supabase/client.ts` | `getSupabaseBrowserClient()` — singleton Supabase client. Already exists and returns a properly configured `SupabaseClient` instance. Uses anon key with no auth. | Available [CODEBASE] |
| `@supabase/supabase-js` v2.91+ | Package installed at `^2.91.0`. Provides `.channel()`, `.on('postgres_changes', ...)`, `.subscribe()`, `.removeChannel()` APIs for Realtime subscriptions. | Available [package.json] |
| Backend Phase A | `operational_priority` column on `intel_normalized` table in Supabase. Without this column, the Realtime filter `operational_priority=in.(P1,P2)` cannot be applied and the channel will receive no events. | Pending (backend work) |
| Backend Phase B.4 | Supabase Realtime RLS policy on `intel_normalized` that allows the anon role to receive `postgres_changes` events. Without this policy, Supabase Realtime will not deliver INSERT events to the client. | Pending (backend work) |
| Supabase project configuration | Realtime must be enabled for the `intel_normalized` table in the Supabase dashboard (Database > Replication). This is a one-time configuration step. | Unknown (needs verification) |
| `QueryClientProvider` context | The hook calls `useQueryClient()` from `@tanstack/react-query`, which requires the hook to be rendered inside the existing `QueryProvider` component tree (already wrapping the app at `src/components/providers/query-provider.tsx`). | Available [CODEBASE] |

## 4. Deliverables

### 4.1 `RealtimeAlertPayload` — Local Type for Realtime INSERT Data

**File:** `src/hooks/use-realtime-priority-alerts.ts`

Define a local interface for the subset of `intel_normalized` columns that arrive in a Supabase Realtime `postgres_changes` INSERT payload. This type is intentionally **not** `IntelNormalizedRow` because:

- `IntelNormalizedRow` (in `src/lib/supabase/types.ts`) does not have `operational_priority` and is not in scope for modification (WS-1.1 D-6).
- The Realtime payload may contain additional or fewer columns than the row type, depending on the Supabase Realtime configuration (by default, INSERTs include the full row).
- Decoupling the Realtime payload type from the table row type provides flexibility if the backend schema evolves independently.

```
interface RealtimeAlertPayload {
  id: string
  title: string
  severity: string
  category: string
  operational_priority: string | null
  ingested_at: string
  source_id: string
  geo: Record<string, unknown> | null
}
```

**Design note:** The type uses `string | null` for `operational_priority` (not `OperationalPriority | null`) because this is a raw database payload — same principle as WS-1.1 D-2 for API response types. Type narrowing happens at the point of consumption (the `onAlert` callback or WS-2.5 notification rendering).

---

### 4.2 `RealtimeConnectionStatus` — Exported Type

**File:** `src/hooks/use-realtime-priority-alerts.ts`

```
export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
```

Consumed by:

- WS-2.1 (`usePriorityFeed`) to adjust polling interval based on Realtime health.
- Diagnostic UI (e.g., `BottomStatusStrip` or a future connection health indicator).
- WS-2.5 notification system to suppress "reconnecting" noise during brief disconnects.

---

### 4.3 `PRIORITY_ALERT_CHANNEL_NAME` — Named Constant

**File:** `src/hooks/use-realtime-priority-alerts.ts`

```
const PRIORITY_ALERT_CHANNEL_NAME = 'priority-alerts-p1-p2'
```

Internal constant. Not exported — the channel name is an implementation detail. Named descriptively for Supabase dashboard visibility (channels appear in the Realtime inspector).

---

### 4.4 `UseRealtimePriorityAlertsOptions` — Hook Configuration

**File:** `src/hooks/use-realtime-priority-alerts.ts`

```
export interface UseRealtimePriorityAlertsOptions {
  /** Called when a new P1 or P2 alert arrives via Realtime. Receives the INSERT payload for immediate notification rendering (WS-2.5). */
  onAlert?: (payload: RealtimeAlertPayload) => void
  /** Whether the subscription is active. Set to false to pause without unmounting. Default: true. */
  enabled?: boolean
}
```

**Design note on `onAlert`:** This callback is the bridge to WS-2.5. It receives the raw Realtime payload so the notification system can fire immediately with the alert title, severity, and category -- without waiting for the TanStack Query refetch to complete. The callback is invoked synchronously in the Realtime event handler, before `invalidateQueries`.

The notification (toast/browser notification) is ephemeral and tolerates eventual consistency. The feed list UI always reads from the TanStack Query cache, which is the authoritative source.

---

### 4.5 `UseRealtimePriorityAlertsReturn` — Hook Return Type

**File:** `src/hooks/use-realtime-priority-alerts.ts`

```
export interface UseRealtimePriorityAlertsReturn {
  /** Current WebSocket connection status. */
  connectionStatus: RealtimeConnectionStatus
  /** Whether the Realtime channel is actively receiving events. Convenience alias for connectionStatus === 'connected'. */
  isConnected: boolean
  /** ISO 8601 timestamp of the most recent Realtime event received, or null if none yet. For diagnostics. */
  lastEventAt: string | null
  /** Count of Realtime events received since the hook mounted. For diagnostics and testing. */
  eventCount: number
}
```

**Design note on `isConnected`:** This boolean is the primary signal WS-2.1 uses to decide its polling interval. When `isConnected` is `true`, WS-2.1 polls at 15s (Realtime provides inter-poll push). When `false`, WS-2.1 tightens to 10s (polling-only fallback). The consuming component passes this value to `usePriorityFeed({ realtimeConnected })`.

---

### 4.6 `useRealtimePriorityAlerts` — Hook Implementation

**File:** `src/hooks/use-realtime-priority-alerts.ts`

The hook orchestrates four concerns: channel lifecycle, event handling, cache invalidation, and connection monitoring.

**4.6.1 Channel Lifecycle (mount/unmount)**

On mount (when `enabled` is true):

1. Obtain the Supabase client via `getSupabaseBrowserClient()`.
2. Obtain the TanStack `queryClient` via `useQueryClient()`.
3. Create a channel:
   ```
   const channel = supabase.channel(PRIORITY_ALERT_CHANNEL_NAME)
   ```
4. Attach the `postgres_changes` listener (see 4.6.2).
5. Call `channel.subscribe(statusCallback)` (see 4.6.4).
6. Store the channel reference in a `useRef` for cleanup access.

On unmount (or when `enabled` transitions to `false`):

1. Call `supabase.removeChannel(channelRef.current)`.
2. Reset `connectionStatus` to `'disconnected'`.
3. Preserve `eventCount` and `lastEventAt` (diagnostic continuity if re-enabled).

The channel creation and teardown is managed inside a `useEffect` with `[enabled]` as the dependency. The `onAlert` callback is accessed via a ref (not a dependency) to avoid re-subscribing when the callback identity changes.

**4.6.2 Postgres Changes Listener**

```
channel.on(
  'postgres_changes',
  {
    event: 'INSERT',
    schema: 'public',
    table: 'intel_normalized',
    filter: 'operational_priority=in.(P1,P2)',
  },
  handleInsert
)
```

**Filter behavior:** The `filter` parameter uses Supabase Realtime's server-side filtering, which is supported in `@supabase/supabase-js` v2.x for `postgres_changes` events. This ensures only P1/P2 inserts are delivered over the WebSocket, reducing bandwidth and client-side processing.

**Fallback if server-side filter is not supported:** If the Supabase instance does not support the `in` filter operator for Realtime (depends on server version), the filter is omitted and client-side filtering is applied in `handleInsert`:

```
if (payload.new.operational_priority !== 'P1' && payload.new.operational_priority !== 'P2') {
  return // Ignore non-priority inserts
}
```

This dual-path (server filter with client fallback) ensures the hook works across Supabase versions. See OQ-1 and R-3 below.

**4.6.3 Event Handler (`handleInsert`)**

The handler executes three steps in sequence when a P1/P2 INSERT arrives:

**Step 1: Invoke notification callback.**
```
onAlertRef.current?.(payload.new as RealtimeAlertPayload)
```

Called first because notification delivery is latency-sensitive. The toast/browser notification should appear as fast as possible. The callback receives the raw payload — WS-2.5 extracts `title`, `severity`, `category`, and `operational_priority` for rendering.

**Step 2: Invalidate priority feed cache.**
```
queryClient.invalidateQueries({ queryKey: PRIORITY_FEED_QUERY_KEY })
```

This marks WS-2.1's cached data as stale, triggering an immediate refetch via `tarvariGet('/console/priority-feed')`. The feed list UI updates when the refetch resolves. The `PRIORITY_FEED_QUERY_KEY` constant is imported from WS-2.1's hook file.

**CRITICAL: This is the ONLY data path to the UI.** The Realtime payload is NOT inserted into the TanStack Query cache. The cache is NOT manually updated with `setQueryData`. The payload is NOT stored in Zustand. The TanStack Query cache remains the single source of truth, fed exclusively by the REST API through WS-2.1's `queryFn`.

**Step 3: Update diagnostic state.**
```
setEventCount(prev => prev + 1)
setLastEventAt(new Date().toISOString())
```

**Optional additional invalidation:** Beyond the priority feed, a new P1/P2 alert also affects:

- `['coverage', 'metrics']` — total alert count changes.
- `['intel', 'feed']` — the general feed includes the new alert.
- `['coverage', 'map-data']` — the map should show the new marker.

These are secondary invalidations. The priority feed invalidation is mandatory; the others are opportunistic. The SOW recommends invalidating all four query families on each P1/P2 event, since the extra refetches are low-cost (the data was going to refetch on its next polling cycle anyway, typically within 30-60s):

```
queryClient.invalidateQueries({ queryKey: PRIORITY_FEED_QUERY_KEY })
queryClient.invalidateQueries({ queryKey: ['intel', 'feed'] })
queryClient.invalidateQueries({ queryKey: ['coverage', 'metrics'] })
queryClient.invalidateQueries({ queryKey: ['coverage', 'map-data'] })
```

This ensures all data surfaces reflect the new P1/P2 alert promptly, not just the priority feed. If this causes excessive network traffic in high-volume scenarios, the secondary invalidations can be debounced (see OQ-4).

**4.6.4 Connection Status Monitoring**

The `.subscribe()` method accepts a status callback:

```
channel.subscribe((status) => {
  switch (status) {
    case 'SUBSCRIBED':
      setConnectionStatus('connected')
      break
    case 'TIMED_OUT':
    case 'CHANNEL_ERROR':
      setConnectionStatus('error')
      break
    case 'CLOSED':
      setConnectionStatus('disconnected')
      break
  }
})
```

Initial state is `'connecting'` (set before `.subscribe()` is called).

**Reconnection:** The Supabase Realtime client handles automatic reconnection with exponential backoff internally. When the connection recovers, the status callback fires with `'SUBSCRIBED'` again, transitioning the hook back to `'connected'`. No manual reconnection logic is needed in the hook.

**4.6.5 The `enabled` Guard**

When `enabled` is `false`:

- No channel is created.
- `connectionStatus` is `'disconnected'`.
- `isConnected` is `false`.
- No events are received or processed.

This allows consuming components to conditionally disable the Realtime subscription (e.g., when the user is on a page where priority alerts are not displayed, or during development without a Supabase instance).

---

### 4.7 State Management Summary

| State | Storage | Updated By | Read By |
|-------|---------|------------|---------|
| `connectionStatus` | `useState` (local) | Channel status callback | Consuming component, WS-2.1 (via `isConnected`), diagnostic UI |
| `lastEventAt` | `useState` (local) | `handleInsert` event handler | Diagnostic UI |
| `eventCount` | `useState` (local) | `handleInsert` event handler | Diagnostic UI, tests |
| `onAlert` callback ref | `useRef` (local) | Prop change synced via ref | `handleInsert` event handler |
| Channel instance | `useRef` (local) | `useEffect` setup/teardown | `useEffect` cleanup |
| Priority feed data | TanStack Query cache (global) | WS-2.1 `queryFn` via REST refetch | Priority feed UI components |

**No Zustand state.** This hook does not write to `coverage.store.ts` or `ui.store.ts`. Connection status is local React state because it is only relevant to the component subtree where this hook is mounted. If multiple components need connection status, the hook should be mounted once in a shared ancestor (e.g., the page layout) and the status passed down via props or context.

---

### 4.8 Dual-Channel Consistency Contract

This section documents the architectural invariant that resolves the Phase 7 validation concern about the dual data channel (REST polling via `tarvariGet` + WebSocket push via Supabase Realtime).

**Invariant:** The TanStack Query cache, populated exclusively by WS-2.1's `queryFn` (which calls `tarvariGet('/console/priority-feed')`), is the single source of truth for all rendered priority feed data.

**Rules:**

1. **Realtime events MUST invalidate the cache, never populate it.** The hook calls `queryClient.invalidateQueries()`, never `queryClient.setQueryData()`.

2. **Realtime payloads MUST NOT flow into Zustand.** No store action is called with Realtime data. The `onAlert` callback is for ephemeral notifications only.

3. **The `onAlert` callback payload is for notifications, not UI state.** WS-2.5 may use it to fire a toast showing the alert title, but the toast is not authoritative. If the user clicks through to the feed, they see data from the cache.

4. **Loss of Realtime does not cause data loss.** WS-2.1's polling continues regardless. Realtime only accelerates cache freshness. When disconnected, polling compensates by tightening from 15s to 10s.

5. **Reconnection does not require cache reconciliation.** When Realtime reconnects, any INSERTs that occurred during the disconnection are already in the cache (from polling). The reconnected channel only delivers future events.

**Visual flow:**

```
[Supabase DB] ──INSERT──> [Supabase Realtime WS]
                                    │
                                    ▼
                    [useRealtimePriorityAlerts]
                         │              │
                         │              ▼
                         │     onAlert(payload)  ──> [WS-2.5 Notifications]
                         │                              (ephemeral toast)
                         ▼
              invalidateQueries()
                         │
                         ▼
              [TanStack Query Cache]  ◄── SINGLE SOURCE OF TRUTH
                         │
                         ▼
               queryFn refetch
                         │
                         ▼
              tarvariGet('/console/priority-feed')
                         │
                         ▼
              [TarvaRI Backend API]
                         │
                         ▼
              [Supabase DB]  (same DB, different read path)
```

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `useRealtimePriorityAlerts` hook exists at `src/hooks/use-realtime-priority-alerts.ts` and exports the hook function, `RealtimeConnectionStatus` type, and `UseRealtimePriorityAlertsReturn` interface. | Code review; `pnpm typecheck` passes. |
| AC-2 | On mount with `enabled: true`, the hook creates a Supabase Realtime channel subscribed to `postgres_changes` INSERT events on `public.intel_normalized`. | Code review; Supabase dashboard shows active channel in Realtime inspector. |
| AC-3 | The Realtime subscription filters to `operational_priority IN ('P1', 'P2')` — either via server-side filter or client-side guard. | Code review; manual test: insert a P3 row and verify no event fires; insert a P1 row and verify the event fires. |
| AC-4 | On INSERT event, `queryClient.invalidateQueries()` is called with WS-2.1's priority feed query key. | Code review; React Query Devtools shows the priority feed query transitions to `fetching` after a Realtime event. |
| AC-5 | On INSERT event, `queryClient.invalidateQueries()` is **not** preceded or replaced by `queryClient.setQueryData()`. The cache is invalidated, never directly mutated with Realtime data. | Code review — grep for `setQueryData` in the file returns zero results. |
| AC-6 | On INSERT event, the `onAlert` callback (if provided) is invoked with a `RealtimeAlertPayload` object containing `id`, `title`, `severity`, `category`, `operational_priority`, and `ingested_at`. | Unit test: mount hook with mock `onAlert`, simulate INSERT event, assert callback invoked with expected shape. |
| AC-7 | `connectionStatus` transitions through `'connecting' -> 'connected'` on successful subscription. | Unit test with mock Supabase client; manual test verifying status in React DevTools. |
| AC-8 | `connectionStatus` transitions to `'error'` on `TIMED_OUT` or `CHANNEL_ERROR`, and to `'disconnected'` on `CLOSED`. | Unit test with mock Supabase client simulating error states. |
| AC-9 | `isConnected` is `true` when `connectionStatus === 'connected'` and `false` otherwise. | Code review (derived value). |
| AC-10 | On unmount, `supabase.removeChannel()` is called, cleanly unsubscribing from the Realtime channel. | Unit test: mount, then unmount, assert `removeChannel` called. Supabase dashboard shows channel removed. |
| AC-11 | When `enabled` is `false`, no channel is created and `connectionStatus` is `'disconnected'`. | Unit test: mount with `enabled: false`, assert no Supabase channel calls. |
| AC-12 | When `enabled` transitions from `true` to `false`, the existing channel is removed. When it transitions back to `true`, a new channel is created. | Unit test: toggle `enabled`, assert cleanup and re-creation. |
| AC-13 | `eventCount` increments by 1 for each INSERT event received. `lastEventAt` updates to the current ISO 8601 timestamp on each event. | Unit test with mock events. |
| AC-14 | `pnpm typecheck` passes with zero errors across the full project after adding the new hook file. | Run `pnpm typecheck`. |
| AC-15 | `pnpm build` succeeds (the hook is not imported by any page yet — this criterion verifies no side-effect import errors). | Run `pnpm build`. |
| AC-16 | The hook does not import from or write to `coverage.store.ts` or `ui.store.ts`. | Code review — grep for store imports in the file. |
| AC-17 | The hook file includes a JSDoc module comment explaining the dual-channel architecture and linking to this SOW. | Code review. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | Realtime events invalidate the TanStack Query cache (`invalidateQueries`) — never populate it (`setQueryData`). | **Resolves the dual-channel consistency concern.** The TarvaRI REST API and Supabase Realtime read from the same database but through different paths. If the hook inserted Realtime data directly into the cache, the cache would contain a mix of REST-normalized data (camelCase, typed) and raw Realtime data (snake_case, untyped), creating inconsistency. Cache invalidation triggers a refetch through the established REST normalizer path, guaranteeing all cached data has identical shape and provenance. | `setQueryData` with manual normalization — rejected because it duplicates the normalizer logic from WS-2.1 and creates a second code path that must be kept in sync. Zustand store for Realtime data — rejected because it creates a parallel state that competes with the query cache. |
| D-2 | The `onAlert` callback receives the raw Realtime payload (snake_case `RealtimeAlertPayload`), not a normalized type. | The callback is for ephemeral notification rendering (WS-2.5), not for persistent UI state. Notifications need `title`, `severity`, `category` immediately — normalizing to camelCase adds latency and coupling for no benefit. WS-2.5 can read `payload.operational_priority` directly. | Normalize to `IntelFeedItem` or `PriorityFeedItem` — rejected because these types are not defined yet (WS-2.1) and the normalization logic would duplicate WS-2.1's normalizer. Pass `payload.new` untyped — rejected because the `RealtimeAlertPayload` interface provides type safety for the notification consumer. |
| D-3 | Connection status is local `useState`, not Zustand store state. | `connectionStatus` is only relevant to the component subtree where the hook is mounted. Putting it in Zustand would make it globally accessible but introduces unnecessary global state for a transient connection concern. If multiple components need the status, the hook is mounted once in a shared ancestor and the `isConnected` value is passed down via props. | Add to `coverage.store.ts` — rejected because the coverage store manages data filtering, not infrastructure status. It would also couple the store to Supabase Realtime, which is an implementation detail. |
| D-4 | Use `useRef` for the `onAlert` callback to avoid re-subscribing on callback identity changes. | Supabase Realtime channel creation is expensive (WebSocket handshake). If `onAlert` is an inline function (new identity every render), putting it in the `useEffect` dependency array would tear down and recreate the channel on every render. The ref pattern decouples callback identity from channel lifecycle. | Add `onAlert` to `useEffect` deps — rejected for the reason above. Use `useCallback` at call site — works but puts the burden on the consumer and is fragile. |
| D-5 | Invalidate secondary query keys (`['intel', 'feed']`, `['coverage', 'metrics']`, `['coverage', 'map-data']`) alongside the primary priority feed key. | A new P1/P2 alert affects all data surfaces, not just the priority feed. Invalidating secondary keys ensures the general feed, metrics, and map update within seconds of a high-priority alert arriving, rather than waiting for their next polling cycle (30-60s). The cost is 3 additional lightweight GET requests. | Invalidate only the priority feed key — simpler but leaves other surfaces stale for up to 60s after a P1/P2 event. Debounce secondary invalidations — reasonable optimization if event volume is high; deferred to OQ-4. |
| D-6 | Use Supabase Realtime server-side `filter` with a client-side fallback guard. | Server-side filtering reduces WebSocket bandwidth by only delivering P1/P2 INSERTs. The fallback guard (`if (priority !== 'P1' && priority !== 'P2') return`) handles the case where the Supabase server version does not support the `in` filter operator for `postgres_changes`. This dual-path ensures the hook works across Supabase versions without silent failure. | Server-side filter only (no client guard) — rejected because filter support varies by Supabase version and failure is silent (events stop arriving, no error). Client-side filter only (no server filter) — rejected because all `intel_normalized` INSERTs would be delivered over the WebSocket, wasting bandwidth when only ~5-10% are P1/P2. |
| D-7 | The hook does not implement manual reconnection logic. | Supabase Realtime client (`@supabase/supabase-js` v2.x) handles automatic reconnection with exponential backoff internally. Adding a manual reconnection layer would conflict with the built-in behavior and add untestable complexity. The hook monitors status transitions and reports them — it does not attempt to force reconnection. | Manual `setTimeout`-based reconnection — rejected because it conflicts with the client's internal backoff. Manual `removeChannel` + re-create on error — rejected because the client already handles this; manual intervention could cause duplicate channels. |
| D-8 | `RealtimeAlertPayload` is a local interface in the hook file, not added to `src/lib/interfaces/` or `src/lib/supabase/types.ts`. | The payload type is specific to the Realtime event handler and the `onAlert` callback contract. It is not a shared domain type. If WS-2.5 needs to import it, the hook file exports it directly — no need for a separate interface module. | Add to `src/lib/interfaces/coverage.ts` — rejected because the payload is a wire format type, not a domain concept. Add to `src/lib/supabase/types.ts` — rejected because that file mirrors the DB schema and `operational_priority` is not on `IntelNormalizedRow` (WS-1.1 D-6). |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Does the Supabase instance (cloud, self-hosted, or local) support the `in` filter operator for Realtime `postgres_changes` events? This was added in Supabase Realtime v2.25+. If not supported, the server-side filter is silently ignored and all `intel_normalized` INSERTs will be delivered. The client-side fallback guard (D-6) handles this, but it increases WebSocket traffic. | Backend team / DevOps | Phase 2 (before implementation) |
| OQ-2 | Is Realtime replication enabled for the `intel_normalized` table in the Supabase project settings? Supabase requires tables to be added to the Realtime publication (`supabase_realtime`) for `postgres_changes` to work. If not enabled, the channel subscribes successfully but receives no events. | Backend team | Phase 2 (before implementation) |
| OQ-3 | What is the exact query key that WS-2.1 will use for the priority feed? The SOW assumes WS-2.1 will export a `PRIORITY_FEED_QUERY_KEY` constant. If WS-2.1 uses a different pattern (e.g., inline key without a constant), WS-2.4 needs to be updated to match. Recommend WS-2.1's SOW mandate an exported constant. | react-developer (WS-2.1) | Phase 2 (WS-2.1 SOW) |
| OQ-4 | Should the secondary cache invalidations (`['intel', 'feed']`, `['coverage', 'metrics']`, `['coverage', 'map-data']`) be debounced if multiple P1/P2 alerts arrive within a short window (e.g., a batch ingest)? Debouncing with a 2-3 second trailing window would coalesce multiple invalidations into a single refetch per query. The primary priority feed invalidation should NOT be debounced (latency-critical). | react-developer | Phase 2 (implementation time) |
| OQ-5 | Does the Supabase Realtime INSERT payload include ALL columns of `intel_normalized`, or only changed columns? For `postgres_changes` INSERT events, Supabase should deliver the full new row in `payload.new`. Confirm this with the project's Supabase version. If only partial data arrives, the `RealtimeAlertPayload` interface may need adjustment. | Backend team | Phase 2 (before implementation) |
| OQ-6 | Should the hook also listen for UPDATE events where `operational_priority` changes TO `'P1'` or `'P2'` (e.g., a P3 alert being escalated)? The current SOW only handles INSERTs. If escalation is a use case, an UPDATE listener with a filter or client-side check for priority change would be needed. | Product / Backend team | Phase 2 (before implementation) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Supabase Realtime RLS policy does not exist or does not grant SELECT to the anon role, causing the channel to subscribe but receive no events. | High (first Realtime usage in the project) | Medium (Realtime fails silently; no errors, just no events) | The hook exposes `connectionStatus` and `eventCount`. If status is `'connected'` but `eventCount` stays at 0 after known P1/P2 inserts, the consuming component (or developer) can detect the mismatch. WS-2.1 falls back to 10s polling regardless. Add a dev-mode console warning if `eventCount` is 0 after 60s of `'connected'` status. Backend team verifies RLS policy in Phase B.4. |
| R-2 | `operational_priority` column does not exist on `intel_normalized` when frontend work begins, causing the Realtime filter to fail or match nothing. | High | Low | The hook functions correctly without the column — it simply receives no events and reports `'connected'` with `eventCount: 0`. WS-2.1's polling provides full data coverage. When the column is added (Backend Phase A), events start flowing automatically. No code change needed on the frontend side. |
| R-3 | Supabase server version does not support the `in` filter operator for `postgres_changes`, causing all `intel_normalized` INSERTs to be delivered (not just P1/P2). | Medium | Low | The client-side fallback guard (D-6) filters non-P1/P2 events before processing. The only cost is increased WebSocket traffic. For a table with ~100-1000 inserts/day, this is negligible. Monitor with `eventCount` — if it significantly exceeds known P1/P2 insert volume, the filter is likely not being applied server-side. |
| R-4 | High-volume batch ingests trigger dozens of cache invalidations within seconds, causing excessive refetch traffic. | Medium (batch ingests are a known TarvaRI pattern) | Medium (multiple simultaneous refetches to the TarvaRI API) | Implement debouncing for secondary invalidations (OQ-4). The primary priority feed invalidation can be debounced with a short window (500ms trailing) without user-perceptible delay. TanStack Query's internal deduplication also helps — multiple `invalidateQueries` calls within the same tick are coalesced into a single refetch. |
| R-5 | The Supabase Realtime WebSocket connection is blocked by network configuration (corporate proxy, firewall, or CSP policy). | Low (localhost development; higher in production) | Medium (Realtime completely unavailable) | The polling fallback (WS-2.1 at 10s) provides full functionality. The hook reports `'error'` status, which could be surfaced in a diagnostic panel. For production deployment, ensure the CSP `connect-src` directive includes the Supabase Realtime endpoint (`wss://*.supabase.co`). |
| R-6 | The `useQueryClient()` call fails because the hook is rendered outside the `QueryClientProvider` tree. | Low (the provider wraps the entire app) | High (crash) | The `QueryClientProvider` is in `src/components/providers/query-provider.tsx` and wraps all pages via the root layout. There is no scenario in the current architecture where a hook is rendered outside this provider. If the architecture changes, the crash is immediate and obvious during development. |
| R-7 | Memory leak from channel not being cleaned up if the component unmounts during an async operation (e.g., between channel creation and subscription). | Low | Low | The cleanup function in `useEffect` calls `supabase.removeChannel()` unconditionally. Even if the channel is in a `'connecting'` state, `removeChannel` handles cleanup gracefully. The Supabase client internally manages the WebSocket lifecycle. |
| R-8 | Stale closure in `handleInsert` captures an old `queryClient` reference. | Very Low | Medium (invalidations target wrong query client) | `queryClient` from `useQueryClient()` is stable across renders (it is the same object from `QueryClientProvider`). No stale closure risk. The `onAlert` callback is accessed via ref (D-4), which is always current. |
