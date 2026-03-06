# WS-2.6: Coverage Store Extensions

> **Workstream ID:** WS-2.6
> **Phase:** 2 — P1/P2 Feed & Real-Time Notifications
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** None
> **Blocks:** WS-2.2, WS-2.3, WS-2.5
> **Resolves:** Validation concern about notificationConsent location

---

## 1. Objective

Extend the application's Zustand stores to provide the state fields and actions that WS-2.2 (PriorityFeedStrip), WS-2.3 (PriorityFeedPanel), and WS-2.5 (Notification system) depend on. This workstream delivers two additions across two stores, correcting the combined-recommendations placement of `notificationConsent` from `coverage.store.ts` to `settings.store.ts`.

The result: downstream workstreams can import their required state from day one without coupling view-panel state to user preference persistence, or vice versa.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `coverage.store.ts` extension | Add `priorityFeedExpanded` boolean and `setPriorityFeedExpanded` action. This is transient view state (panel open/closed) — same category as `selectedBundleId` and `selectedMapAlertId`. |
| `settings.store.ts` extension | Add `notificationConsent` field (`'undecided' \| 'granted' \| 'denied'`) and `setNotificationConsent` action. This is a user preference that must survive page reloads — same category as `aiCameraDirectorEnabled` and `effectsEnabled`. |
| Type exports | Export the `NotificationConsent` type from `settings.store.ts` so WS-2.5 can import it. |
| Selector additions | Add selectors for both new fields to their respective store selector objects. |
| `partialize` update | Update the `settings.store.ts` `persist` middleware's `partialize` function to include `notificationConsent`. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| PriorityFeedStrip / PriorityFeedPanel components | Delivered by WS-2.2 and WS-2.3 respectively. This workstream only provides the state they read. |
| Notification API integration | Delivered by WS-2.5. This workstream only provides the consent state WS-2.5 reads and writes. |
| Browser `Notification.permission` sync | WS-2.5 responsibility. The store field tracks the app-level consent flow state; the browser-level permission is a separate concern managed by the notification system. |
| Audio cue preference | Noted in combined-recommendations as part of WS-2.5. If a toggle is needed later, it belongs in `settings.store.ts` but is not part of this workstream. |
| URL sync for `priorityFeedExpanded` | Panel expansion is ephemeral UI state. It does not warrant URL persistence (unlike `viewMode` and `category` which support deep-linking). |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|---------------|--------|
| `src/stores/coverage.store.ts` | Existing store file to extend with `priorityFeedExpanded` | Available |
| `src/stores/settings.store.ts` | Existing store file to extend with `notificationConsent` | Available |
| Combined recommendations (Phase 2 table) | Field names, types, and action signatures | Available |
| Validation finding on `notificationConsent` placement | Decision to split delivery across two stores | Resolved in this SOW (see Section 6, D-1) |

---

## 4. Deliverables

### 4.1. Coverage Store: `priorityFeedExpanded` (in `src/stores/coverage.store.ts`)

**Rationale for placement:** `priorityFeedExpanded` is transient view state that controls whether the priority feed panel is open. It follows the same pattern as `selectedBundleId` (transient, no localStorage, no URL sync) and belongs in the data-filtering/view-mode store. It is not animation state (which would go in `ui.store.ts`) and it is not a user preference (which would go in `settings.store.ts`).

#### State field

```typescript
/** Whether the priority feed panel is expanded (open). */
priorityFeedExpanded: boolean
```

Default: `false`

#### Action

```typescript
/** Open or close the priority feed panel. */
setPriorityFeedExpanded: (open: boolean) => void
```

Implementation uses the existing Immer pattern:

```typescript
setPriorityFeedExpanded: (open) =>
  set((state) => {
    state.priorityFeedExpanded = open
  }),
```

#### Selector

Add to `coverageSelectors`:

```typescript
/** Whether the priority feed panel is expanded. */
isPriorityFeedExpanded: (state: CoverageStore): boolean => state.priorityFeedExpanded,
```

#### Interface updates

Add `priorityFeedExpanded: boolean` to `CoverageState` and `setPriorityFeedExpanded: (open: boolean) => void` to `CoverageActions`.

### 4.2. Settings Store: `notificationConsent` (in `src/stores/settings.store.ts`)

**Rationale for placement:** `notificationConsent` is a user preference that must persist across page reloads and sessions. `settings.store.ts` already uses the Zustand `persist` middleware with localStorage key `tarva-launch-settings` and manages 4 similar preference toggles. Placing notification consent here keeps all persisted user preferences in one store with one localStorage key, avoids adding `persist` middleware to `coverage.store.ts` (which is explicitly documented as session-transient with URL-based persistence), and follows the existing codebase convention.

#### Type

```typescript
/** User's notification consent state for the two-step permission flow. */
export type NotificationConsent = 'undecided' | 'granted' | 'denied'
```

Exported from `settings.store.ts` so WS-2.5 can import it directly.

#### State field

```typescript
/** User's notification consent state. Persisted to localStorage. */
notificationConsent: NotificationConsent
```

Default: `'undecided'`

#### Action

```typescript
/** Set the notification consent state (called after user responds to in-app explainer or browser prompt). */
setNotificationConsent: (consent: NotificationConsent) => void
```

Implementation:

```typescript
setNotificationConsent: (consent) =>
  set((state) => {
    state.notificationConsent = consent
  }),
```

#### Selector

Add to `settingsSelectors`:

```typescript
/** Current notification consent state. */
notificationConsent: (state: SettingsStore): NotificationConsent =>
  state.notificationConsent,

/** Whether notifications are actively granted. */
isNotificationsGranted: (state: SettingsStore): boolean =>
  state.notificationConsent === 'granted',
```

#### Persistence update

Update the `partialize` function in the `persist` config to include `notificationConsent`:

```typescript
partialize: (state) => ({
  aiCameraDirectorEnabled: state.aiCameraDirectorEnabled,
  minimapVisible: state.minimapVisible,
  effectsEnabled: state.effectsEnabled,
  breadcrumbVisible: state.breadcrumbVisible,
  notificationConsent: state.notificationConsent,
}),
```

#### Default update

Add to `DEFAULT_SETTINGS`:

```typescript
const DEFAULT_SETTINGS: SettingsState = {
  aiCameraDirectorEnabled: true,
  minimapVisible: true,
  effectsEnabled: true,
  breadcrumbVisible: true,
  notificationConsent: 'undecided',
}
```

### 4.3. No New Store Files

This workstream does not create any new store files. Both additions extend existing stores at their existing file paths.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `useCoverageStore` exposes `priorityFeedExpanded` field with default value `false` | Unit test: create store, assert initial `priorityFeedExpanded === false` |
| AC-2 | `setPriorityFeedExpanded(true)` sets `priorityFeedExpanded` to `true`; `setPriorityFeedExpanded(false)` resets it | Unit test: call action, assert state change |
| AC-3 | `coverageSelectors.isPriorityFeedExpanded` returns the current value | Unit test: set state, read via selector |
| AC-4 | `useSettingsStore` exposes `notificationConsent` field with default value `'undecided'` | Unit test: create store, assert initial `notificationConsent === 'undecided'` |
| AC-5 | `setNotificationConsent('granted')` persists to localStorage under `tarva-launch-settings` key | Unit test: call action, read `localStorage.getItem('tarva-launch-settings')`, parse JSON, assert `notificationConsent === 'granted'` |
| AC-6 | `setNotificationConsent('denied')` persists and survives store rehydration | Unit test: set state, create new store instance, assert rehydrated value |
| AC-7 | `settingsSelectors.notificationConsent` returns current value; `settingsSelectors.isNotificationsGranted` returns `true` only when `'granted'` | Unit test: set each state, assert selector outputs |
| AC-8 | `NotificationConsent` type is exported from `settings.store.ts` and importable | TypeScript compilation: import the type in a test file, `pnpm typecheck` passes |
| AC-9 | Existing coverage store functionality is unaffected (all existing fields, actions, selectors, URL sync functions work identically) | Existing tests pass; manual smoke test of category selection and view mode switching |
| AC-10 | Existing settings store functionality is unaffected (all existing toggles persist correctly) | Existing tests pass; manual verification that toggling minimap/effects/breadcrumb still persists |
| AC-11 | `pnpm typecheck` passes with zero errors | CI verification |
| AC-12 | `pnpm lint` passes with zero new warnings | CI verification |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | **Split delivery across two stores:** `priorityFeedExpanded` in `coverage.store.ts`, `notificationConsent` in `settings.store.ts` | The combined-recommendations placed both in `coverage.store.ts`, but the validator correctly identified that `notificationConsent` is a user preference requiring localStorage persistence. `coverage.store.ts` explicitly documents itself as "session-transient" with "no `persist` middleware" (lines 9-11). `settings.store.ts` already has `persist` middleware with 4 similar preference toggles. Forcing persistence into coverage.store would violate the established store boundary and require adding persist middleware to a store designed without it. | (1) Both in `coverage.store.ts` as originally specified — rejected because it would require adding `persist` middleware to coverage store, breaking its documented design contract. (2) Both in `settings.store.ts` — rejected because `priorityFeedExpanded` is transient view state (like `selectedBundleId`), not a user preference, and does not need persistence. (3) New `notification.store.ts` — rejected because a single boolean preference does not justify a new store file when `settings.store.ts` is the canonical location for persisted preferences. |
| D-2 | **`priorityFeedExpanded` in `coverage.store.ts`, not `ui.store.ts`** | `ui.store.ts` manages animation/morph state machine and navigation (morph phase, direction, district selection, command palette). The priority feed panel is a data-view panel — its open/closed state is analogous to `selectedBundleId` (a data view toggle) rather than `commandPaletteOpen` (a navigation overlay). The two-store architecture documentation says `coverage.store.ts` handles "data filtering & view modes." | (1) `ui.store.ts` — rejected because priority feed expansion is not animation/morph state. The CLAUDE.md states ui.store is for "animation & navigation state" and coverage.store is for "data filtering & view modes." A feed panel is a data view mode. |
| D-3 | **`setPriorityFeedExpanded(open: boolean)` instead of `togglePriorityFeedExpanded()`** | The explicit setter avoids the toggle-based race condition where rapid clicks could leave the panel in an unexpected state. WS-2.2 (PriorityFeedStrip) knows whether it wants to open or close the panel — it should pass the intent explicitly. This matches the existing `setCommandPaletteOpen(open)` pattern in `ui.store.ts`. | (1) Toggle-only — rejected because callers always know their intent (strip click = open, close button = close). (2) Both setter and toggle — considered acceptable but unnecessary; a toggle convenience can be added later if needed. |
| D-4 | **No URL sync for `priorityFeedExpanded`** | Panel expansion is ephemeral interaction state. Deep-linking to an open feed panel has no user value (unlike category filters and view modes which represent meaningful data views). Adding URL params for every panel toggle creates URL noise. | (1) Add `?feed=open` URL param — rejected because it adds complexity without user value. |
| D-5 | **`NotificationConsent` as a union type, not a boolean** | The three-state union (`'undecided' | 'granted' | 'denied'`) models the actual consent flow: users who have never been asked (`undecided`) need a different UI treatment than users who explicitly declined (`denied`). A boolean would conflate "never asked" with "denied," preventing the two-step consent UX described in WS-2.5. | (1) `boolean` (granted/not-granted) — rejected because it loses the distinction between "never asked" and "explicitly denied." (2) `boolean | null` — rejected because nullable booleans are less self-documenting than a string union, and the union provides better exhaustiveness checking in switch statements. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-2.6.1 | Should `priorityFeedExpanded` auto-close when the user enters district view (morph forward)? If so, should coverage.store listen to ui.store morph phase changes, or should the morph orchestrator explicitly call `setPriorityFeedExpanded(false)`? | react-developer | WS-2.2 implementation (the consumer decides the behavior; the store just provides the primitive) |
| OQ-2.6.2 | Will WS-2.5 need additional notification preferences beyond consent state (e.g., `notificationSoundEnabled`, `notificationP2Enabled`)? If so, those should also land in `settings.store.ts` — but they are WS-2.5's scope, not this workstream's. | react-developer | WS-2.5 implementation |
| OQ-2.6.3 | The combined-recommendations mention "audio cue configurable (off by default)" for notifications. If this becomes a persisted toggle, it should be added to `settings.store.ts` in a future workstream or folded into WS-2.5. Flagging for awareness. | react-developer | WS-2.5 implementation |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Adding `notificationConsent` to `settings.store.ts` `partialize` could cause localStorage schema drift for existing users who have saved settings | Low | Low | Zustand `persist` middleware handles missing keys gracefully — new fields fall back to their default values. The `DEFAULT_SETTINGS` object provides `'undecided'` as the fallback. No migration needed. |
| R-2 | Downstream workstreams (WS-2.2, WS-2.3, WS-2.5) may need additional store fields not anticipated here | Medium | Low | This workstream delivers the minimum fields specified in the combined-recommendations. Additional fields can be added incrementally by the consuming workstream without re-opening this SOW. The store extension pattern is well-established. |
| R-3 | Splitting `notificationConsent` away from `coverage.store.ts` (contra the combined-recommendations) could confuse implementers of WS-2.5 who reference the original plan | Low | Low | This SOW documents the decision (D-1) with full rationale. The SOW title "Coverage Store Extensions" is retained for traceability, but Section 4.2 clearly specifies the `settings.store.ts` location. The blocking relationship (WS-2.6 blocks WS-2.5) is unchanged. |
| R-4 | `'use client'` directive inconsistency — `coverage.store.ts` does not have `'use client'` while `settings.store.ts` does | Low | None | Both stores are only imported in client components. The `'use client'` directive in `settings.store.ts` is present because it uses `persist` middleware (which accesses `localStorage`). `coverage.store.ts` does not need it because it has no browser-API side effects at the module level. Adding `priorityFeedExpanded` does not change this — no new browser APIs are introduced. |
