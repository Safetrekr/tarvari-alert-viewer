# Phase 2 Overview -- P1/P2 Feed & Real-Time Notifications

> **Synthesized by:** CTA + SPO + STW + PMO
> **Date:** 2026-03-05
> **Workstreams:** WS-2.1 through WS-2.6
> **Phase prerequisite:** Phase 0 (WS-0.1 -- WS-0.4) and Phase 1 (WS-1.1 -- WS-1.5) complete

---

## 1. Executive Summary

Phase 2 introduces a dedicated priority alert subsystem on top of the existing TarvaRI Alert Viewer. It adds five capabilities: a TanStack Query data hook for P1/P2 alerts (WS-2.1), a world-space summary strip (WS-2.2), a viewport-fixed detail panel (WS-2.3), the project's first Supabase Realtime WebSocket integration for push updates (WS-2.4), a two-channel notification system covering in-app toasts, browser notifications, and audio cues (WS-2.5), and Zustand store extensions to house the new state (WS-2.6).

The phase moves the viewer from passive polling to an active alerting posture. Operators will see priority alerts surfaced in three locations (strip, panel, toasts), receive browser notifications when backgrounded, and benefit from sub-second update propagation via WebSocket push.

Six SOWs define the work. They are tightly coupled: WS-2.1 is the data foundation consumed by every other workstream; WS-2.6 provides store scaffolding consumed by WS-2.2, WS-2.3, and WS-2.5; WS-2.4 bridges polling and push, feeding raw events to WS-2.5 for notification dispatch.

Seven cross-workstream conflicts were identified during synthesis (Section 3). All are resolvable without architectural changes -- they are specification inconsistencies, not design disagreements. The most significant are a type-name mismatch between WS-2.1 and WS-2.2 (Conflict 3), a settings store scope overlap between WS-2.5 and WS-2.6 (Conflict 4), and a missing hook parameter that WS-2.4 expects from WS-2.1 (Conflict 5).

Estimated total effort: 3 -- 5 developer-days for a single React developer with TanStack Query, Zustand, and Supabase Realtime experience. Critical path runs WS-2.6 -> WS-2.1 -> WS-2.4 -> WS-2.5, with WS-2.2 and WS-2.3 branching in parallel off WS-2.1.

---

## 2. Key Findings

Findings are grouped by theme, not by workstream.

### Data Architecture

- **Dedicated endpoint assumed but unconfirmed.** WS-2.1 depends on a new `/console/priority-feed` backend endpoint that returns only P1/P2 items, sorted by priority then recency, with optional `p1_count`/`p2_count` aggregates. The TarvaRI backend does not yet expose this endpoint. The hook includes fallback logic for missing count fields, but the endpoint's existence is the single largest external dependency.
- **Four query families invalidated on Realtime push.** WS-2.4 invalidates `['priority', 'feed']`, `['intel', 'feed']`, `['coverage', 'metrics']`, and `['coverage', 'map-data']` when a WebSocket event arrives. This is intentionally broad -- a new P1/P2 alert affects priority counts, the general feed, category metrics, and map markers. The breadth is correct but means a single Realtime event triggers four parallel refetches.
- **Query key namespacing is deliberate.** WS-2.1 D-5 namespaces the priority feed under `['priority', 'feed']` rather than `['intel', 'priority-feed']` to prevent accidental co-invalidation via TanStack Query's prefix-matching `invalidateQueries`. This is a sound decision that should be documented as a project-wide query key convention.
- **Three similar item types now coexist.** `IntelFeedItem` (6 fields), `CategoryIntelItem` (11 fields), and `PriorityFeedItem` (11 fields) serve different display contexts. WS-2.1 R-7 acknowledges the duplication and defers a shared `BaseIntelItem` extraction. This is acceptable for Phase 2 but should be tracked as technical debt.

### Visual & Interaction Design

- **Two distinct rendering contexts.** The PriorityFeedStrip (WS-2.2) lives in world-space (moves with the spatial canvas, subject to ZoomGate), while the PriorityFeedPanel (WS-2.3) is viewport-fixed (always visible, layered at z-35). This dual placement ensures priority information is visible in both the zoomed-out overview and the close-in working view.
- **Achromatic priority channel enforced throughout.** AD-1 from Phase 0 is consistently applied: PriorityBadge uses shape/weight (diamond for P1, triangle for P2), never color. The severity dot is the only colored element in toasts and feed items. WS-2.5 D-7 explicitly confirms the toast left-border accent is achromatic (`rgba(255,255,255,0.25)`).
- **Time-ago formatting is inconsistent across workstreams.** WS-2.2 and WS-2.3 define different time-ago format rules with duplicate implementation logic. This is Cross-Workstream Conflict 1 and Conflict 2 (Section 3).
- **Escape key priority chain extended.** WS-2.3 integrates into the existing keyboard dismiss hierarchy: INSPECT > Triage > PriorityFeed > CommandPalette. The panel auto-closes when morph phase leaves `idle`, preventing it from obscuring the district view.

### Real-Time & Notification System

- **First Supabase Realtime integration.** WS-2.4 introduces the project's first WebSocket subscription (`postgres_changes` INSERT on `intel_normalized`). This is architecturally significant: the project transitions from pure REST polling to a dual-channel model. The design correctly treats WebSocket as a cache-invalidation signal only -- never `setQueryData`, never direct Zustand writes.
- **Two-step browser notification consent.** WS-2.5 AD-6 implements an in-app explainer toast before the native browser dialog, increasing the grant rate by giving context. The `'default'` permission result (dialog dismissed without a choice) is correctly mapped to `'undecided'`, allowing re-prompting.
- **Notification persistence mirrors priority severity.** P1 toasts persist indefinitely (`duration: Infinity`), P2 auto-dismiss after 8 seconds (`duration: 8000`). Browser notifications follow the same model via `requireInteraction: true` for P1. Audio cues are P1-only to prevent noise fatigue.
- **Payload type bridge is unspecified.** WS-2.4 provides `RealtimeAlertPayload` (snake_case, `operational_priority: string | null`), but WS-2.5 consumes `PriorityAlertPayload` (camelCase, `priority: OperationalPriority`). No SOW specifies the mapping function. This is Cross-Workstream Conflict 7 (Section 3).

### Store Architecture

- **Two stores, correctly partitioned.** `coverage.store.ts` gains `priorityFeedExpanded` (session-transient, no persist). `settings.store.ts` gains notification preferences (persisted via `localStorage`). This follows the established two-store separation: animation/navigation state vs. user preferences.
- **Settings store scope overlap between WS-2.5 and WS-2.6.** WS-2.6 adds `notificationConsent` (1 field + action + selector) to `settings.store.ts` and updates `partialize`. WS-2.5 independently adds 4 fields (`inAppNotificationsEnabled`, `browserNotificationsEnabled`, `notificationConsent`, `audioNotificationsEnabled`) with their own `partialize` update. The `notificationConsent` field is duplicated. This is Cross-Workstream Conflict 4 (Section 3).

---

## 3. Cross-Workstream Conflicts

Seven conflicts identified. All are resolvable at implementation time without architectural changes.

### Conflict 1: Time-ago format inconsistency

**SOWs involved:** WS-2.2, WS-2.3

**WS-2.2 specifies (Section 4.3):**
> Format: "Xs ago", "Xm ago", "Xh ago", "Xd ago"
> Uses `useRelativeTimeTick()` hook with 30-second re-render interval.

**WS-2.3 specifies (Section 4.1 / inline):**
> Format: "NOW" (< 1 min), "Xm", "Xh", "Xd", "Xw" -- no "ago" suffix.
> Uses a local helper function, not a shared hook.

**Nature of conflict:** The strip and the panel display the same data items with different time-ago formatting rules. An alert showing "2m ago" in the strip would show "2m" in the panel. WS-2.3 adds a "NOW" state and a "weeks" tier that WS-2.2 lacks.

**Resolution:** Standardize on a single format and a single shared utility. Recommendation: adopt WS-2.3's compact format ("NOW", "Xm", "Xh", "Xd", "Xw") without the "ago" suffix, as it is more space-efficient for both the narrow strip and the panel list items. Extract the logic into a shared `relativeTimeAgo(iso: string): string` function in `src/lib/time-utils.ts`. Both workstreams import from there.

**Owner:** react-developer, resolved at WS-2.2 implementation time.

---

### Conflict 2: Duplicate time-ago helpers

**SOWs involved:** WS-2.2, WS-2.3

**WS-2.2 specifies:**
> `useRelativeTimeTick()` hook with `relativeTime()` helper, unexported, local to PriorityFeedStrip.

**WS-2.3 specifies:**
> Local time-ago helper inside PriorityFeedPanel, explicitly described as "not exported."

**Nature of conflict:** Two independent, unexported implementations of the same time-formatting logic in two separate component files. This creates a maintenance burden and compounds Conflict 1 (divergent formats).

**Resolution:** Extract into a shared utility module (`src/lib/time-utils.ts`) exporting:
1. `relativeTimeAgo(iso: string): string` -- pure function, no React dependency.
2. `useRelativeTimeTick(intervalMs?: number): number` -- React hook that returns a tick counter, causing consumers to re-render on the specified interval.

Both WS-2.2 and WS-2.3 import from the shared module. The hook drives re-renders; the pure function formats the timestamp.

**Owner:** react-developer, resolved at WS-2.2 implementation time (WS-2.2 is implemented before WS-2.3).

---

### Conflict 3: Type name mismatch (`PriorityFeedData` vs `PriorityFeedSummary`)

**SOWs involved:** WS-2.1, WS-2.2

**WS-2.1 exports (Section 4.1):**
> `PriorityFeedSummary` -- the return type of `usePriorityFeed()`, containing `items`, `p1Count`, `p2Count`, `totalCount`, `mostRecentP1`, `mostRecentP2`.

**WS-2.2 references (Section 3 Input Dependencies):**
> `PriorityFeedData` -- described as the return type from WS-2.1.

**Nature of conflict:** `PriorityFeedData` does not exist in WS-2.1. The type is named `PriorityFeedSummary`. This is a naming error in WS-2.2's specification that would cause a compile error if implemented literally.

**Resolution:** WS-2.2 should import `PriorityFeedSummary` from WS-2.1, not `PriorityFeedData`. No new type is needed. This is a documentation correction, not a code change.

**Owner:** react-developer, resolved at WS-2.2 implementation time. Update WS-2.2 SOW if maintaining living documents.

---

### Conflict 4: Settings store scope overlap

**SOWs involved:** WS-2.5, WS-2.6

**WS-2.6 specifies (Section 4.2):**
> Adds `notificationConsent: NotificationConsent` (default `'undecided'`) + `setNotificationConsent` action + `notificationConsent` / `isNotificationsGranted` selectors to `settings.store.ts`. Updates `partialize` to include `notificationConsent`.

**WS-2.5 specifies (Section 4.1 / inline references):**
> Adds 4 fields to `settings.store.ts`: `inAppNotificationsEnabled` (default `true`), `browserNotificationsEnabled` (default `false`), `notificationConsent` (default `'undecided'`), `audioNotificationsEnabled` (default `false`). Each with setter actions. Updates `partialize` to include all 4 fields.

**Nature of conflict:** `notificationConsent` is specified by both SOWs with identical type and default value -- a benign duplication. However, WS-2.5's three additional fields (`inAppNotificationsEnabled`, `browserNotificationsEnabled`, `audioNotificationsEnabled`) and their setter actions are not mentioned in WS-2.6. WS-2.6's `partialize` update includes only `notificationConsent`; WS-2.5's includes all four fields. If WS-2.6 is implemented first (as the dependency graph requires), WS-2.5 must extend the store and re-update `partialize`.

**Resolution:** Expand WS-2.6's scope to include all 4 notification-related fields, their setter actions, and the complete `partialize` update. This consolidates all `settings.store.ts` modifications in a single workstream, eliminating the need for WS-2.5 to re-modify store infrastructure. WS-2.5 then focuses purely on notification dispatch logic, consuming the store fields that WS-2.6 already provides.

**Owner:** react-developer. Apply during WS-2.6 implementation. Update WS-2.6 SOW to include the 3 additional fields.

---

### Conflict 5: Missing `realtimeConnected` parameter on `usePriorityFeed`

**SOWs involved:** WS-2.1, WS-2.4

**WS-2.4 specifies (Section 4.5):**
> WS-2.1 should accept a `realtimeConnected: boolean` parameter to adaptively adjust the poll interval (15s when WebSocket connected, 10s when disconnected for faster fallback).

**WS-2.1 specifies (Section 4.1):**
> `usePriorityFeed(): UseQueryResult<PriorityFeedSummary>` -- no parameters. `refetchInterval` is hardcoded at `15_000`.

**Nature of conflict:** WS-2.4 assumes WS-2.1 supports adaptive polling via a parameter that WS-2.1 does not accept. WS-2.1's hook signature is parameterless.

**Resolution:** Two options:

**(A) Defer adaptive polling (recommended).** Implement WS-2.1 as specified (no parameters, fixed 15s interval). The 15s poll is an adequate fallback when the WebSocket disconnects -- the worst case is a 15-second delay. Adaptive polling adds complexity (parameter threading, interval changes mid-session) for a marginal improvement (5 seconds faster fallback). Revisit if operational testing reveals the 15s gap is unacceptable.

**(B) Add the parameter.** Modify WS-2.1's signature to `usePriorityFeed(options?: { realtimeConnected?: boolean })` and use `refetchInterval: options?.realtimeConnected ? 15_000 : 10_000`. This is a minor additive change that does not break existing consumers (the parameter is optional).

**Owner:** react-developer, decided at WS-2.1 implementation time. Option A is the conservative default.

---

### Conflict 6: WS-2.5 modifies WS-0.3 deliverable (Toaster configuration)

**SOWs involved:** WS-2.5, WS-0.3 (Phase 0)

**WS-0.3 specified:**
> Install Sonner and add `<Toaster />` to the root layout. Deferred configuration decisions to future workstreams (OQ-2: `visibleToasts` count, OQ-3: `closeButton` behavior).

**WS-2.5 specifies (D-6):**
> Set `visibleToasts={4}` and `closeButton={true}` on `<Toaster />`.

**Nature of conflict:** This is a cross-phase modification. WS-2.5 resolves WS-0.3's open questions by modifying a component delivered in Phase 0. This is not a contradiction -- it is an intentional deferred decision being resolved -- but it needs documentation so that the implementer knows to modify the existing `<Toaster />` instance rather than creating a new one.

**Resolution:** No code conflict. The implementer of WS-2.5 modifies the existing `<Toaster />` in the root layout (delivered by WS-0.3) to add `visibleToasts={4}` and `closeButton={true}`. Mark WS-0.3 OQ-2 and OQ-3 as resolved by WS-2.5 D-6.

**Owner:** react-developer, resolved at WS-2.5 implementation time.

---

### Conflict 7: Payload type bridge gap (`RealtimeAlertPayload` to `PriorityAlertPayload`)

**SOWs involved:** WS-2.4, WS-2.5

**WS-2.4 provides via `onAlert` callback:**
> `RealtimeAlertPayload` (snake_case): `{ id, title, severity, category, operational_priority: string | null, ingested_at, source_id, geo }`
> Defined locally in `src/hooks/use-realtime-priority-alerts.ts`.

**WS-2.5 consumes:**
> `PriorityAlertPayload` (camelCase): `{ id: string, title: string, priority: OperationalPriority, severity: SeverityLevel, category: string, ingestedAt: string }`
> Defined in `src/lib/notifications/notify-priority-alert.ts`.

**Nature of conflict:** No SOW specifies the transformation function between these two types. Key differences:
1. `operational_priority` (snake_case, `string | null`) vs `priority` (camelCase, `OperationalPriority`) -- different name, different nullability, different type.
2. `ingested_at` vs `ingestedAt` -- case convention.
3. `source_id` and `geo` exist on `RealtimeAlertPayload` but not on `PriorityAlertPayload`.
4. `severity` is `string` on Realtime but `SeverityLevel` on Notification.

The consumer of `onAlert` (the component that wires WS-2.4 to WS-2.5) must map between these types, including a null guard on `operational_priority` and a type assertion/validation on `severity`.

**Resolution:** Add a mapping function `toNotificationPayload(raw: RealtimeAlertPayload): PriorityAlertPayload | null` in the wiring layer (likely in the page component or a dedicated integration hook). The function:
1. Returns `null` if `operational_priority` is null (alert is not P1/P2 -- should not reach notification dispatch).
2. Casts `operational_priority` to `OperationalPriority` after the null check.
3. Maps `severity` to `SeverityLevel` (type narrowing or validation).
4. Renames `ingested_at` to `ingestedAt`.
5. Drops `source_id` and `geo` (not needed by notifications).

This function should be documented in either WS-2.4 or WS-2.5 as part of the integration contract.

**Owner:** react-developer, resolved at WS-2.5 implementation time (WS-2.5 is the consumer).

---

## 4. Architecture Decisions

Consolidated from all six workstreams. Decisions are grouped thematically.

| ID | Decision | Source | Rationale |
|----|----------|--------|-----------|
| **Data Layer** | | | |
| WS-2.1 D-1 | Dedicated `/console/priority-feed` endpoint, not client-side filter on `/console/intel`. | WS-2.1 | Server-side sort, count aggregation, and future optimization (materialized view, index). Client-side filter on a 50-item page would miss P1/P2 items beyond the window. |
| WS-2.1 D-5 | Query key `['priority', 'feed']`, not `['intel', ...]`. | WS-2.1 | Prevents accidental co-invalidation with general intel queries via TanStack Query prefix matching. |
| WS-2.1 D-8 | `staleTime: 10_000`, `refetchInterval: 15_000` (10s/15s). | WS-2.1 | Matches project pattern (20s/30s on `useIntelFeed`). Prevents redundant fetches within the fresh window while ensuring background invalidation triggers work. |
| WS-2.1 D-9 | Trust backend sort order, no client-side re-sort. | WS-2.1 | `mostRecentP1`/`mostRecentP2` rely on the first matching item in the pre-sorted array. Defensive `.find()` scan is used, correct regardless of order. |
| WS-2.4 D-1 | Cache invalidation only -- never `setQueryData`, never direct Zustand writes. | WS-2.4 | Single source of truth is TanStack Query cache populated by REST. WebSocket is a signal to refetch, not a data channel. Avoids cache/server divergence. |
| WS-2.4 D-5 | Server-side Realtime filter `operational_priority=in.(P1,P2)` with client-side fallback. | WS-2.4 | Reduces WebSocket traffic. Client-side filter handles the case where server filter is unsupported. |
| **Visual Design** | | | |
| WS-2.2 D-1 | Strip positioned at world-space y=-842, outside `morph-panels-scatter`. | WS-2.2 | Prevents the strip from being caught in the morph animation that affects the category grid. |
| WS-2.3 D-2 | Panel is viewport-fixed (not world-space), z-index 35 with backdrop at z-34. | WS-2.3 | Always accessible regardless of camera position. z-35 sits between district view (z-30) and HUD (z-40). |
| WS-2.5 D-7 | P1 toast left border is achromatic `rgba(255,255,255,0.25)`, not colored. | WS-2.5 | Enforces AD-1: priority uses shape/weight channel, severity owns color. |
| WS-2.5 D-2 | `toast.custom()` for full layout control, not `toast()` with built-in options. | WS-2.5 | Toast requires multi-element layout (PriorityBadge, severity dot, category, title, timestamp, action) that exceeds Sonner's built-in API. |
| **Notification System** | | | |
| WS-2.5 D-4 | Browser notifications fire only when `document.hidden === true`. | WS-2.5 | Prevents redundant alert when the in-app toast is already visible. Browser notification's purpose is background-tab awareness. |
| WS-2.5 D-5 | Audio cue fires only for P1, not P2. | WS-2.5 | P2 volume in a real-time feed would cause noise fatigue and lead users to disable the feature. |
| WS-2.5 D-6 | `visibleToasts={4}`, `closeButton={true}` on `<Toaster />`. | WS-2.5 | Resolves WS-0.3 OQ-2 and OQ-3. 4 toasts balances screen real estate with burst awareness. Close button is essential for persistent P1 toasts. |
| WS-2.5 D-8 | `'default'` permission result maps to `'undecided'`, not `'denied'`. | WS-2.5 | Allows re-prompting after accidental dialog dismissal. Penalizing dismissal would permanently lock out the feature. |
| **Store Architecture** | | | |
| WS-2.6 D-1 | `priorityFeedExpanded` lives in `coverage.store.ts` (transient, no persist). | WS-2.6 | Panel open/close is session state, not a user preference. Should not survive page reload. |
| WS-2.6 D-2 | `notificationConsent` lives in `settings.store.ts` (persisted). | WS-2.6 | User preferences must survive page reloads. Settings store already has persist middleware. |
| WS-2.5 D-1 | All 4 notification preference fields live in `settings.store.ts`. | WS-2.5 | Correction of original WS-2.6 scope. Settings store is the correct home for persisted user preferences. |

---

## 5. Cross-Workstream Dependencies

```
WS-2.6 (Store Extensions)
  |
  +---> WS-2.2 (PriorityFeedStrip)  [needs priorityFeedExpanded]
  |       |
  +---> WS-2.3 (PriorityFeedPanel)  [needs priorityFeedExpanded, setPriorityFeedExpanded]
  |
  +---> WS-2.5 (Notification System) [needs notificationConsent + notification settings]
  |
WS-2.1 (usePriorityFeed Hook)       [needs OperationalPriority from WS-0.2]
  |
  +---> WS-2.2 (PriorityFeedStrip)  [needs PriorityFeedSummary, PRIORITY_FEED_QUERY_KEY]
  |
  +---> WS-2.3 (PriorityFeedPanel)  [needs PriorityFeedSummary, PriorityFeedItem]
  |
  +---> WS-2.4 (Realtime Alerts)    [needs PRIORITY_FEED_QUERY_KEY for cache invalidation]
          |
          +---> WS-2.5 (Notification System) [needs onAlert callback providing RealtimeAlertPayload]
```

**Critical path:** WS-2.6 -> WS-2.1 -> WS-2.4 -> WS-2.5

**Parallel track (after WS-2.1):** WS-2.2 and WS-2.3 can be built in parallel, independent of WS-2.4/WS-2.5.

**External dependencies:**

| Dependency | Required By | Status | Risk |
|------------|-------------|--------|------|
| `OperationalPriority` type (WS-0.2) | WS-2.1 | Phase 0 deliverable | LOW -- local type alias as fallback (WS-2.1 R-4) |
| `PriorityBadge` component (WS-0.4) | WS-2.2, WS-2.3, WS-2.5 | Phase 0 deliverable | LOW -- if unavailable, use placeholder |
| Sonner `<Toaster />` installed (WS-0.3) | WS-2.5 | Phase 0 deliverable | LOW -- simple install step |
| `/console/priority-feed` endpoint | WS-2.1 | Not yet implemented | HIGH -- WS-2.1 R-1. Mitigated by MSW mocks |
| Supabase Realtime enabled on `intel_normalized` | WS-2.4 | Unknown | MEDIUM -- WS-2.4 R-1. Requires Supabase project config |
| `getCategoryMeta()` utility | WS-2.2, WS-2.3, WS-2.5 | Assumed available | LOW -- used by existing coverage components |

---

## 6. Consolidated Open Questions

Questions from all six workstreams, deduplicated and grouped. Blocking questions are flagged.

### BLOCKING -- must be resolved before implementation begins

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-B1 | Does the `/console/priority-feed` endpoint exist or is it planned? What is its response schema (`items` array only, or `items` + `p1_count` + `p2_count` + `total_count`)? | WS-2.1 OQ-1, OQ-2 | Backend team |
| OQ-B2 | What is the maximum number of items the endpoint returns? If unbounded, the hook must pass a `limit` parameter. | WS-2.1 OQ-3 | Backend team |
| OQ-B3 | Is Supabase Realtime enabled for the `intel_normalized` table? Does the table support server-side `operational_priority=in.(P1,P2)` filter on the Realtime channel? | WS-2.4 OQ-1, OQ-2 | Backend team / Supabase admin |

### NON-BLOCKING -- can be resolved during or after implementation

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-1 | Should the 15-second poll interval be configurable (env var or hook parameter)? | WS-2.1 OQ-4 | Product / react-developer |
| OQ-2 | When WS-2.4 invalidates the cache, should the poll interval temporarily adjust to avoid redundant fetches? (Likely a non-issue per TanStack Query default behavior.) | WS-2.1 OQ-5 | react-developer |
| OQ-3 | Does the priority strip need a "last updated" timestamp display or loading indicator during refetch? | WS-2.2 Q-2 | react-developer / UX advisory |
| OQ-4 | Should the priority strip have a click-through to expand the full PriorityFeedPanel, or is it display-only? | WS-2.2 Q-1 | Product |
| OQ-5 | Should the PriorityFeedPanel show items beyond P1/P2 (e.g., P3 in a separate section)? | WS-2.3 Q-3 | Product |
| OQ-6 | What reconnection strategy should the Realtime subscription use (exponential backoff parameters, max retries)? | WS-2.4 OQ-3 | react-developer |
| OQ-7 | Should the Realtime subscription debounce rapid-fire events (e.g., 500ms window) before triggering cache invalidation? | WS-2.4 OQ-4 | react-developer |
| OQ-8 | Should there be a visual indicator of WebSocket connection status in the UI? | WS-2.4 OQ-5 | Product / UX advisory |
| OQ-9 | What audio file should be used for the P1 notification sound? | WS-2.5 OQ-1 | Product / Design |
| OQ-10 | Should `NotificationSettingsRow` be integrated into the command palette settings section or wait for a dedicated settings panel? | WS-2.5 OQ-2 | react-developer |
| OQ-11 | Should the browser notification include an app icon? If so, which image and at what size? | WS-2.5 OQ-3 | Product / Design |
| OQ-12 | How should `useNotificationDispatch` be provided to the Realtime integration -- direct hook call or context provider? | WS-2.5 OQ-4 | react-developer |
| OQ-13 | Should browser notifications be batched during burst arrivals (e.g., "5 new P1 alerts" summary) or fire individually? | WS-2.5 OQ-5 | react-developer / UX advisory |
| OQ-14 | Should `inAppNotificationsEnabled` default to `true` (current spec) or require explicit opt-in? | WS-2.5 OQ-6 | UX advisory |
| OQ-15 | Should `notificationConsent` be re-validated on every app load, or only once per session? | WS-2.6 OQ-2.6.1 | react-developer |
| OQ-16 | Should `isPriorityFeedExpanded` be represented in the URL (e.g., `?feed=open`) for shareability? | WS-2.6 OQ-2.6.2 | Product |
| OQ-17 | Does the strip need a distinct "no data yet" state vs "ALL CLEAR"? | WS-2.2 Q-4 | Product / UX advisory |

---

## 7. Phase Exit Criteria

All criteria must pass before Phase 2 is considered complete.

| ID | Criterion | Verification |
|----|-----------|-------------|
| PE-1 | `usePriorityFeed()` returns `PriorityFeedSummary` with correct `items`, `p1Count`, `p2Count`, `mostRecentP1`, `mostRecentP2` from the live `/console/priority-feed` endpoint (or MSW mock). | Unit test + manual verification against TarvaRI backend. |
| PE-2 | PriorityFeedStrip renders in world-space, visible at Z1+ zoom, showing correct P1/P2 counts, most-recent alert title, and time-ago timestamp. Updates on 15-second poll cycles. | Visual inspection in the spatial canvas at different zoom levels. |
| PE-3 | PriorityFeedStrip reflects four visual states (Active/Elevated/All Clear/Loading) correctly based on P1/P2 counts. | Manual test with mocked data for each state. |
| PE-4 | PriorityFeedPanel opens from the strip (or trigger point), displays scrollable list of P1/P2 items with PriorityBadge, severity dot, category, title, and time-ago. | Visual inspection + keyboard navigation test. |
| PE-5 | Panel click-to-navigate: clicking an item closes the panel, triggers morph to the item's category district, and preselects the alert. | Manual test: click item, verify district view opens with correct alert highlighted. |
| PE-6 | Supabase Realtime subscription receives INSERT events from `intel_normalized` and triggers cache invalidation of all four query families. | Integration test: insert a P1 record into `intel_normalized`; verify all four queries refetch within 2 seconds. |
| PE-7 | Realtime connection status (`connecting`/`connected`/`disconnected`/`error`) is tracked and available to consumers. | Unit test of the hook's status output across lifecycle states. |
| PE-8 | P1 in-app toast persists indefinitely until dismissed; P2 toast auto-dismisses after ~8 seconds. | Manual timing test for both priority levels. |
| PE-9 | Toast displays PriorityBadge (achromatic shape), severity color dot, category short name, truncated title, and relative timestamp. No color on priority elements. | Visual inspection against WS-2.5 Section 4.2 specification. |
| PE-10 | Two-step browser notification consent flow works: toggle ON -> explainer toast -> "Enable Notifications" -> native dialog -> consent stored and reflected in UI. | Manual test through complete flow including grant, deny, and dismiss scenarios. |
| PE-11 | Browser notification fires when tab is backgrounded and a P1/P2 Realtime event arrives. Does NOT fire when tab is focused. | Manual test: background tab, trigger alert, verify browser notification appears. Focus tab, trigger alert, verify no browser notification (only in-app toast). |
| PE-12 | Audio cue plays for P1 alerts (when enabled), not for P2. | Manual test with `audioNotificationsEnabled: true`. |
| PE-13 | All notification preference fields persist in `localStorage` under `tarva-launch-settings` key and survive page reload. | Manual test: set preferences, reload, verify values. |
| PE-14 | Escape key dismisses PriorityFeedPanel according to the priority chain (INSPECT > Triage > PriorityFeed > CommandPalette). | Manual test with panel open, verify Escape closes panel and does not trigger other dismissals. |
| PE-15 | `pnpm typecheck` passes with zero errors. | CLI verification. |
| PE-16 | `pnpm build` completes without errors. | CLI verification. |

---

## 8. Inputs Required by Next Phase

These artifacts or decisions must be finalized during Phase 2 to unblock subsequent work.

| Input | Produced By | Consumed By | Description |
|-------|-------------|-------------|-------------|
| `PriorityFeedSummary` type | WS-2.1 | Future phases needing priority data | Stable type contract for P1/P2 feed data. |
| `PRIORITY_FEED_QUERY_KEY` constant | WS-2.1 | Any future hook that invalidates priority data | Query key constant for cross-hook cache coordination. |
| `RealtimeConnectionStatus` type | WS-2.4 | Future status indicators, connection health UI | WebSocket connection state enum. |
| `useNotificationDispatch` hook | WS-2.5 | Future notification channels (e.g., push notifications, email) | Extensible dispatch interface for multi-channel alerting. |
| `NotificationConsent` type | WS-2.6 | Future consent management, settings UI | Consent state enum persisted in settings store. |
| Shared `relativeTimeAgo` utility | Conflict 1/2 resolution | Any future component displaying relative timestamps | Centralized time formatting to prevent further duplication. |
| Validated Supabase Realtime setup | WS-2.4 | Future real-time features (e.g., live trip tracking) | Confirmed pattern for WebSocket subscriptions in this project. |
| `/console/priority-feed` API contract | WS-2.1 (backend dependency) | Future backend optimizations (materialized views, indices) | Finalized request/response schema. |

---

## 9. Gaps and Recommendations

### Gap 1: No integration wiring specification

**Description:** Six SOWs define individual hooks, components, and utilities, but no SOW specifies the integration wiring -- the page-level code that connects `useRealtimePriorityAlerts`'s `onAlert` callback to `useNotificationDispatch`'s `notify` method, including the `RealtimeAlertPayload` to `PriorityAlertPayload` transformation (Conflict 7).

**Recommendation:** Add a section to WS-2.5 (or create a lightweight WS-2.5a integration addendum) that specifies the wiring in `src/app/(launch)/page.tsx` or a dedicated `PriorityAlertOrchestrator` component. The wiring instantiates both hooks, maps the payload, and dispatches notifications.

**Priority:** HIGH -- without this, the implementer must infer the integration pattern.

### Gap 2: No error/empty state specifications for the PriorityFeedPanel

**Description:** WS-2.3 specifies the scrollable list of items but does not describe:
- What renders when the API returns zero P1/P2 items (empty state).
- What renders when the query is in an error state.
- What renders during the initial load before any data is available.

WS-2.2 (strip) defines four states including "Loading" and "ALL CLEAR," but WS-2.3 has no equivalent.

**Recommendation:** Define three additional panel states: (a) Loading skeleton (shimmer placeholder rows), (b) Empty ("No priority alerts"), (c) Error ("Unable to load priority alerts. Retry?" with a retry button calling `refetch()`).

**Priority:** MEDIUM -- the implementer can infer reasonable states, but explicit specification prevents inconsistency.

### Gap 3: No accessibility specification for the PriorityFeedStrip

**Description:** WS-2.3 (panel) includes detailed accessibility guidance (`aria-label`, keyboard navigation, focus management). WS-2.2 (strip) specifies only that the strip is "visible at Z1+ zoom" but does not address:
- `aria-live` region for screen readers (strip content changes on poll).
- `role` attribute for the strip container.
- Whether the strip's summary text is announced to screen readers.

**Recommendation:** Add `role="status"` and `aria-live="polite"` to the strip container so screen readers announce count changes without interrupting the user.

**Priority:** LOW -- the strip is a supplementary summary; the panel and toasts are the primary interaction surfaces.

### Gap 4: No specification for WebSocket reconnection behavior in the UI

**Description:** WS-2.4 tracks `RealtimeConnectionStatus` but no workstream specifies what the user sees when the WebSocket disconnects. The strip, panel, and notification system silently fall back to polling, but the operator has no visibility into the degradation.

**Recommendation:** Surface the connection status in the existing `BottomStatusStrip` or `TopTelemetryBar` as a small indicator (e.g., green dot for connected, amber for reconnecting, red for disconnected). This leverages existing chrome without adding new UI.

**Priority:** MEDIUM -- important for operational awareness but deferrable to a follow-up workstream.

### Gap 5: No test strategy

**Description:** No SOW includes a test plan or specifies which tests to write. Acceptance criteria describe verification methods ("unit test", "integration test", "visual inspection") but do not specify test file locations, test frameworks, or coverage expectations.

**Recommendation:** Establish a test strategy document or add a "Test Plan" section to each SOW. Minimum coverage:
- **WS-2.1:** Unit tests for `fetchPriorityFeed` normalization, `PriorityFeedSummary` derivation, fallback count logic. Use MSW for HTTP mocking.
- **WS-2.4:** Unit tests for Realtime subscription lifecycle, reconnection, and cache invalidation. Mock Supabase client.
- **WS-2.5:** Unit tests for `notifyPriorityAlert` deduplication, `sendBrowserNotification` feature detection, consent sync logic.

**Priority:** MEDIUM -- tests can be written alongside implementation, but explicit guidance reduces ambiguity.

### Gap 6: No specification for strip-to-panel transition

**Description:** WS-2.2 says the strip exists; WS-2.3 says the panel exists. No SOW specifies how the user gets from the strip to the panel. WS-2.2 OQ-1 asks whether the strip has a click-through, but the question is unresolved. Without a specified trigger, the panel has no discoverable entry point from the strip.

**Recommendation:** Resolve WS-2.2 OQ-1 before implementation. The most natural pattern: clicking the PriorityFeedStrip calls `setPriorityFeedExpanded(true)` to open the PriorityFeedPanel. This is consistent with the inspector pattern (click a surface to expand detail).

**Priority:** HIGH -- the strip and panel are designed to work together but have no specified connection.

---

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream | Size | Estimate | Complexity Drivers |
|------------|------|----------|--------------------|
| WS-2.6 | XS | 0.25 days | Two store modifications, type exports. Mechanical. |
| WS-2.1 | S | 0.5 days | TanStack Query hook, type definitions, normalization function. Straightforward pattern with existing precedent (`useIntelFeed`). Blocked on backend endpoint availability. |
| WS-2.2 | S | 0.75 days | World-space component, four visual states, ZoomGate integration, `useRelativeTimeTick` hook. Includes shared time-utility extraction (Conflict 1/2 resolution). |
| WS-2.3 | M | 1.0 day | Viewport-fixed panel, scrollable list, click-to-navigate morph integration, escape key chain, semi-transparent backdrop. Most complex UI component in this phase. |
| WS-2.4 | M | 1.0 day | First Supabase Realtime integration. WebSocket subscription, connection lifecycle, reconnection, 4-family cache invalidation, status tracking. Novel pattern requires careful testing. |
| WS-2.5 | M | 1.0 -- 1.5 days | Dual-channel notifications (sonner + Browser Notification API), two-step consent flow, audio cue, consent state sync, settings UI, payload transformation (Conflict 7 resolution). Largest scope in the phase. |

**Total estimate:** 4.5 -- 5 developer-days (single developer).

### Recommended Sequencing

```
Day 1 (morning):   WS-2.6 (store extensions -- 2 hours)
Day 1 (afternoon): WS-2.1 (priority feed hook -- 4 hours)

Day 2:             WS-2.2 (priority feed strip -- 6 hours)
                   + Shared time-utility extraction

Day 3:             WS-2.3 (priority feed panel -- 8 hours)

Day 4:             WS-2.4 (realtime priority alerts -- 8 hours)

Day 5:             WS-2.5 (notification system -- 8-12 hours)
                   + Integration wiring (Gap 1)
                   + Payload transformation (Conflict 7)
```

### Parallelization Opportunities

If two developers are available:

- **Developer A:** WS-2.6 -> WS-2.1 -> WS-2.2 -> WS-2.3 (data + UI track)
- **Developer B:** (waits for WS-2.1) -> WS-2.4 -> WS-2.5 (realtime + notifications track)

This reduces the wall-clock time to ~3 days. The handoff point is `PRIORITY_FEED_QUERY_KEY` from WS-2.1, which Developer B needs for WS-2.4's cache invalidation.

### Risk-Adjusted Timeline

| Risk | Impact on Timeline | Mitigation |
|------|-------------------|------------|
| Backend `/console/priority-feed` not ready | +0.5 days (MSW mock setup + later integration) | Build with MSW mocks; integrate when endpoint lands. |
| Supabase Realtime configuration issues | +0.5 days (debugging, testing filter behavior) | Test in a sandbox project first. |
| WS-2.5 scope creep (consent flow edge cases) | +0.5 days | Strict adherence to the three consent states; defer advanced UX. |
| Time-utility extraction (Conflicts 1/2) | +0.25 days | Extract early in WS-2.2; WS-2.3 benefits immediately. |

**Worst-case total:** 6.5 developer-days.

### Resource Conflicts

None identified. Phase 2 is a single-track workload for a React developer with TanStack Query, Zustand, and Supabase Realtime experience. No backend development is in scope (the backend endpoint is an external dependency). No design assets are required beyond the existing PriorityBadge component from Phase 0 (the audio file in WS-2.5 OQ-1 is the only creative asset needed).

### Definition of Done

Phase 2 is complete when:
1. All 16 Phase Exit Criteria (Section 7) pass.
2. All 7 Cross-Workstream Conflicts (Section 3) are resolved in code.
3. All 3 BLOCKING Open Questions (Section 6) have been answered by the backend team.
4. `pnpm typecheck` and `pnpm build` pass with zero errors.
5. The integration wiring (Gap 1) is implemented and tested.

---

*End of Phase 2 Overview.*
