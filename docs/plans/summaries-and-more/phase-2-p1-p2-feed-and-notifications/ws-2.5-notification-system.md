# WS-2.5: Notification System

> **Workstream ID:** WS-2.5
> **Phase:** 2 -- P1/P2 Feed & Real-Time Notifications
> **Assigned Agent:** `react-developer`
> **Advisory:** `world-class-ux-designer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-2.4 (event trigger), WS-2.6 (coverage store + settings store extensions), WS-0.3 (sonner installed + Toaster in root layout), WS-0.4 (PriorityBadge component)
> **Blocks:** None
> **Resolves:** Validation concern about notification preferences location (settings.store.ts, not coverage.store.ts), permanently denied state UI, R8 graceful degradation

## 1. Objective

Build a two-channel notification system that ensures P1 and P2 priority alerts reach the operator regardless of whether the application tab is focused. The in-app channel uses sonner toasts with priority-differentiated persistence behavior (P1 persists until dismissed, P2 auto-dismisses after 8 seconds). The browser channel uses the Web Notification API to surface alerts when the tab is backgrounded. A two-step consent flow (in-app explainer followed by the native browser permission dialog) protects against cold permission requests that have high denial rates. All notification preferences persist in `settings.store.ts` via its existing localStorage-backed Zustand persist middleware.

This workstream delivers the notification _infrastructure_ and the _consent management_ UX. The event trigger that calls into this system is provided by WS-2.4 (`useRealtimePriorityAlerts` hook). The store fields that track consent state were originally scoped to WS-2.6 in `coverage.store.ts`, but per validation findings, this SOW relocates them to `settings.store.ts` where all user preference toggles already live.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Custom sonner toast function | `notifyPriorityAlert(alert)` function that fires an in-app sonner toast with title, severity color indicator, category name, PriorityBadge, and a "View" action button. Handles P1 vs P2 persistence logic. |
| Custom toast component | `PriorityAlertToast` component rendered via `toast.custom()` for full layout control. Composed of PriorityBadge (WS-0.4), severity color indicator, alert title, category label, timestamp, and "View" action. |
| Browser Notification dispatch | `sendBrowserNotification(alert)` function that fires a Web `Notification` when consent is granted, the document is not visible (`document.hidden === true`), and browser notifications are enabled in settings. |
| Two-step consent flow | `NotificationConsentPrompt` component: an in-app modal or card that explains the value proposition ("Get immediate alerts when critical threats are detected") before triggering `Notification.requestPermission()`. |
| Notification preferences in settings store | Add `browserNotificationsEnabled`, `notificationConsent`, and `audioNotificationsEnabled` fields to `settings.store.ts` with corresponding actions. Persisted via the existing `tarva-launch-settings` localStorage key. |
| "Permanently denied" state UI | `NotificationSettingsRow` component that shows a disabled toggle with a tooltip explaining how to re-enable notifications in browser settings when `Notification.permission === 'denied'`. |
| Audio cue support | Optional audio notification using the HTML `Audio` API. A short notification sound plays on P1 arrival when `audioNotificationsEnabled` is true. Off by default. Sound file embedded as a base64 data URI or loaded from `/public/sounds/`. |
| `useNotificationDispatch` hook | Orchestration hook consumed by WS-2.4 that encapsulates the dual-channel dispatch logic: always fire in-app toast, conditionally fire browser notification. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| The Supabase Realtime subscription that produces events | WS-2.4 responsibility. This workstream provides the `useNotificationDispatch` hook that WS-2.4 calls. |
| The `<Toaster />` provider setup | WS-0.3 responsibility. Already scoped: `<Toaster />` in root layout with `position="bottom-right"`, `theme="dark"`, `richColors`, `offset={52}`. |
| PriorityBadge component implementation | WS-0.4 responsibility. This workstream imports and uses `PriorityBadge` within the custom toast. |
| `priorityFeedExpanded` store field | WS-2.6 responsibility (coverage store extension for feed panel toggle). |
| Notification settings panel or page | Phase 3+. Settings are accessed via individual components (consent prompt, settings row). A full settings panel is not in scope. |
| Push notifications via service worker | Out of scope for this phase. Browser `Notification` API provides foreground-context notifications without a service worker. Service worker push for truly closed-tab scenarios is a separate effort. |
| Notification history or log | Future phase. Notifications are fire-and-forget; no notification inbox is built here. |
| Custom notification sounds per category | All categories share a single notification sound (or silence). Per-category audio is a future enhancement. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|---------------|--------|
| WS-0.3 | `sonner` installed, `<Toaster />` in `src/app/layout.tsx` with `position="bottom-right"`, `theme="dark"`, `richColors`, `offset={52}`, `font-sans` className | Pending (Phase 0 -- not yet implemented) |
| WS-0.4 | `PriorityBadge` component at `src/components/coverage/PriorityBadge.tsx` with `priority`, `size`, `showLabel` props | Pending (Phase 0 -- not yet implemented) |
| WS-0.2 | `OperationalPriority` type (`'P1' \| 'P2' \| 'P3' \| 'P4'`) in `src/lib/interfaces/coverage.ts` | Pending (Phase 0 -- not yet implemented) |
| WS-2.4 | `useRealtimePriorityAlerts` hook that calls `useNotificationDispatch().notify(alert)` on new P1/P2 arrivals | Pending (Phase 2 -- sibling workstream) |
| `settings.store.ts` | Existing settings store with `persist` middleware using `tarva-launch-settings` localStorage key, `immer` middleware, 4 existing toggles | Available [CODEBASE: 140 lines, 4 boolean toggles, localStorage persist] |
| `src/lib/interfaces/coverage.ts` | `SeverityLevel`, `SEVERITY_COLORS`, `CategoryMeta`, `getCategoryMeta()`, `getCategoryColor()`, `getCategoryIcon()` | Available [CODEBASE: 192 lines] |
| `src/lib/utils.ts` | `cn()` className merge utility | Available [CODEBASE] |
| AD-1 | Priority uses achromatic visual channel (shape/weight). Severity uses color. | Approved |
| AD-5 | Sonner for toast notifications. | Approved |
| AD-6 | Two-step browser notification consent pattern. | Approved |

## 4. Deliverables

### 4.1 In-App Toast Notifications via Sonner

**File:** `src/lib/notifications/notify-priority-alert.ts`

This module exports the `notifyPriorityAlert` function that WS-2.4's hook calls when a new P1 or P2 alert arrives. It uses `toast.custom()` from sonner to render a fully custom toast component (`PriorityAlertToast`).

**Function signature:**

```typescript
import type { OperationalPriority } from '@/lib/interfaces/coverage'
import type { SeverityLevel } from '@/lib/interfaces/coverage'

export interface PriorityAlertPayload {
  /** Unique alert ID (for deduplication and "View" navigation). */
  id: string
  /** Alert title text. */
  title: string
  /** Operational priority level. */
  priority: OperationalPriority
  /** Severity level (drives color channel). */
  severity: SeverityLevel
  /** Category identifier (e.g., 'seismic', 'conflict'). */
  category: string
  /** ISO 8601 ingestion timestamp. */
  ingestedAt: string
}

/**
 * Fire an in-app sonner toast for a priority alert.
 *
 * P1 alerts persist until the user explicitly dismisses them.
 * P2 alerts auto-dismiss after 8 seconds.
 *
 * The toast renders a PriorityAlertToast component via toast.custom().
 * Deduplicates by alert ID -- if a toast for the same alert is already
 * visible, no duplicate is created.
 */
export function notifyPriorityAlert(alert: PriorityAlertPayload): void
```

**Duration behavior:**

| Priority | `duration` value | Behavior |
|----------|-----------------|----------|
| P1 | `Infinity` | Toast persists on screen until the user clicks the close button or the "View" action. Sonner supports `duration: Infinity` natively for persistent toasts. |
| P2 | `8000` | Toast auto-dismisses after 8 seconds. User can dismiss earlier via close button or swipe. |

**Deduplication:** Each toast is created with `toast.custom(component, { id: alert.id })`. Sonner deduplicates by `id` -- if a toast with the same alert ID is already displayed, the call is a no-op. This prevents duplicate toasts when Realtime delivers the same event multiple times (idempotency).

**Stacking:** WS-0.3 deferred the `visibleToasts` Toaster prop decision to this workstream (OQ-2). Set `visibleToasts={4}` on the `<Toaster />` component (this is a modification to WS-0.3's deliverable that should be applied when WS-2.5 is implemented). In a real-time intel context with burst arrivals, 4 visible toasts balances awareness with screen real estate. Older toasts in the queue remain accessible by hovering over the toast stack (Sonner's default expand-on-hover behavior).

**Close button:** WS-0.3 deferred the `closeButton` Toaster prop decision to this workstream (OQ-3). Set `closeButton={true}` on the `<Toaster />` component. P1 toasts persist until dismissed, so the close button is essential for clearing them. P2 toasts also benefit from an explicit close affordance rather than requiring swipe or waiting.

### 4.2 PriorityAlertToast Component

**File:** `src/components/notifications/PriorityAlertToast.tsx`

A custom toast body rendered inside Sonner's toast container via `toast.custom()`. This component has full layout control while inheriting Sonner's positioning, stacking, animation, and dismiss behavior.

**Visual composition:**

```
+--------------------------------------------------------------+
| [PriorityBadge P1]  [SeverityDot]  CATEGORY LABEL    2m ago  |
|                                                               |
| Alert title text, truncated to two lines with ellipsis        |
|                                                               |
|                                              [ View ]  [ X ] |
+--------------------------------------------------------------+
```

**Layout specification:**

| Element | Implementation | Visual Treatment |
|---------|---------------|-----------------|
| PriorityBadge | `<PriorityBadge priority={alert.priority} size="sm" />` (WS-0.4) | Achromatic diamond (P1) or triangle (P2). Per AD-1, shape/weight only. |
| Severity dot | 8px circle with `backgroundColor` from `SEVERITY_COLORS[alert.severity]` | Color channel for severity. Matches the existing severity dot pattern in `MapPopup.tsx` (8px circle). |
| Category label | `getCategoryMeta(alert.category).shortName` (e.g., "SEIS", "CON") | `font-mono text-[9px] uppercase tracking-[0.06em]` at `rgba(255,255,255,0.45)`. Matches AlertList badge typography. |
| Time ago | Relative time string (e.g., "2m ago", "just now") | `font-mono text-[9px]` at `rgba(255,255,255,0.30)`. Right-aligned. |
| Title | `alert.title` | `text-[11px] font-sans` at `rgba(255,255,255,0.60)`. Max 2 lines with `line-clamp-2`. |
| "View" button | `<button>` that navigates to the alert's district view | `text-[9px] font-mono uppercase tracking-[0.06em]` at `rgba(255,255,255,0.45)`, hover to `rgba(255,255,255,0.70)`. Border: `1px solid rgba(255,255,255,0.10)`, `rounded px-2 py-1`. |

**"View" action behavior:**

When the "View" button is clicked:
1. Dismiss the toast (`toast.dismiss(toastId)`)
2. Call `useCoverageStore.getState().setDistrictPreselectedAlertId(alert.id)` to preselect the alert
3. Trigger morph navigation to the alert's category district using the existing `startMorph(category)` pattern from the morph choreography system

This navigation pattern matches how `PriorityFeedPanel` items navigate (WS-2.3) -- the store field `districtPreselectedAlertId` was designed for exactly this use case.

**Container styling:**

The toast container uses the spatial dashboard's dark aesthetic:
- Background: `rgba(10, 10, 15, 0.92)` (near-black with slight transparency, matching the existing panel backgrounds in `CategoryDetailScene`)
- Border: `1px solid rgba(255, 255, 255, 0.06)` (subtle edge, matching existing panel borders)
- Border-radius: `rounded-lg` (8px, matching card corners)
- Padding: `px-3 py-2.5`
- Width: `360px` (Sonner's default is ~356px; 360px aligns to the spatial grid)

**P1-specific treatment:**

P1 toasts receive a left border accent to reinforce persistence and urgency:
- Left border: `3px solid rgba(255, 255, 255, 0.25)` (achromatic per AD-1 -- no severity color on the border)
- The PriorityBadge's diamond pulse animation provides the motion cue

This border is achromatic, not colored. It uses shape (thick left edge) rather than color to indicate priority, consistent with AD-1. The severity dot inside the toast provides the color signal.

### 4.3 Two-Step Browser Notification Consent Flow

**File:** `src/components/notifications/NotificationConsentPrompt.tsx`

Per AD-6, the browser `Notification.requestPermission()` dialog must never be triggered cold. A two-step flow ensures the user understands the value before seeing the native browser prompt.

**Step 1 -- In-app explainer:**

A styled card or inline prompt that appears when the user enables the "Browser notifications" toggle in settings for the first time (when `notificationConsent` is `'undecided'`).

```
+--------------------------------------------------------------+
|  [Bell icon]  Get Notified of Critical Threats                |
|                                                               |
|  When a P1 critical threat is detected, we'll send a          |
|  browser notification so you see it even when this tab         |
|  is in the background.                                        |
|                                                               |
|  [ Enable Notifications ]     [ Not Now ]                     |
+--------------------------------------------------------------+
```

**Visual specification:**

| Element | Treatment |
|---------|-----------|
| Container | Same panel aesthetic as PriorityAlertToast: dark background, subtle border, `rounded-lg`. Max-width `400px`. Rendered as a sonner toast via `toast.custom()` with `duration: Infinity` (persists until user decides). |
| Bell icon | Lucide `Bell` icon at 20px, `rgba(255,255,255,0.50)`. |
| Heading | `text-[13px] font-sans font-medium` at `rgba(255,255,255,0.70)`. |
| Body text | `text-[11px] font-sans` at `rgba(255,255,255,0.45)`. |
| "Enable Notifications" button | Primary action: `bg-white/10 hover:bg-white/15 text-[11px] font-mono uppercase tracking-[0.06em] rounded px-3 py-1.5`. |
| "Not Now" button | Secondary action: text-only, same typography, `rgba(255,255,255,0.30) hover:rgba(255,255,255,0.50)`. |

**Step 2 -- Native browser permission request:**

When the user clicks "Enable Notifications" in the in-app prompt:

1. Dismiss the explainer toast
2. Call `Notification.requestPermission()`
3. Handle the result:

| `Notification.permission` result | Action | Store update |
|----------------------------------|--------|-------------|
| `'granted'` | Show a brief success toast: "Notifications enabled" (auto-dismiss 3s). Store consent. | `setNotificationConsent('granted')` + `setBrowserNotificationsEnabled(true)` |
| `'denied'` | Show an informational toast: "Notifications blocked. You can enable them in your browser settings." (auto-dismiss 8s). Store consent. Never prompt again. | `setNotificationConsent('denied')` + `setBrowserNotificationsEnabled(false)` |
| `'default'` | User dismissed the browser dialog without choosing. Treat as "not now" -- keep consent as `'undecided'`. The toggle returns to off. User can try again later. | `setBrowserNotificationsEnabled(false)` (keep `notificationConsent` as `'undecided'`) |

**"Not Now" button behavior:**

- Dismisses the explainer toast
- Sets `browserNotificationsEnabled` to `false` in settings
- Keeps `notificationConsent` as `'undecided'` -- the user can toggle browser notifications on again later to re-trigger the explainer
- Does NOT call `Notification.requestPermission()` -- the native dialog is never shown

**Re-entry paths:**

| Current consent state | User action | Result |
|-----------------------|------------|--------|
| `'undecided'` | Toggles "Browser notifications" ON in settings | Shows Step 1 explainer again |
| `'granted'` | Toggles "Browser notifications" OFF/ON in settings | No explainer needed -- permission already granted. Toggle directly enables/disables the dispatch. |
| `'denied'` | Toggles "Browser notifications" ON in settings | Toggle is disabled (see Section 4.5). Tooltip explains how to re-enable in browser settings. |

### 4.4 Notification Preferences in settings.store.ts

**File:** `src/stores/settings.store.ts` (modify existing)

Per the validation finding, notification preferences belong in `settings.store.ts` (which already has 4 toggles with localStorage persist via the `tarva-launch-settings` key), not in `coverage.store.ts` (which is session-transient and URL-driven with no persist middleware).

**New state fields:**

```typescript
/** Whether in-app sonner toast notifications are enabled for P1/P2 alerts. */
inAppNotificationsEnabled: boolean  // default: true

/** Whether browser Notification API dispatches are enabled. */
browserNotificationsEnabled: boolean  // default: false

/** Browser notification consent state, tracked across sessions. */
notificationConsent: 'undecided' | 'granted' | 'denied'  // default: 'undecided'

/** Whether an audio cue plays on P1 alert arrival. */
audioNotificationsEnabled: boolean  // default: false
```

**New actions:**

```typescript
/** Toggle in-app toast notifications on/off. */
toggleInAppNotifications: () => void

/** Set browser notifications enabled state explicitly. */
setBrowserNotificationsEnabled: (enabled: boolean) => void

/** Toggle browser notifications. Triggers consent flow if undecided. */
toggleBrowserNotifications: () => void

/** Update the notification consent state. */
setNotificationConsent: (consent: 'undecided' | 'granted' | 'denied') => void

/** Toggle audio notification cue on/off. */
toggleAudioNotifications: () => void
```

**New selectors:**

```typescript
/** Whether in-app notifications are enabled. */
areInAppNotificationsEnabled: (state: SettingsStore): boolean =>
  state.inAppNotificationsEnabled

/** Whether browser notifications are enabled and granted. */
areBrowserNotificationsActive: (state: SettingsStore): boolean =>
  state.browserNotificationsEnabled && state.notificationConsent === 'granted'

/** Whether audio cue is enabled. */
isAudioEnabled: (state: SettingsStore): boolean =>
  state.audioNotificationsEnabled
```

**Partialize update:** The existing `partialize` function in the persist config must be extended to include the new fields:

```typescript
partialize: (state) => ({
  // ... existing fields ...
  aiCameraDirectorEnabled: state.aiCameraDirectorEnabled,
  minimapVisible: state.minimapVisible,
  effectsEnabled: state.effectsEnabled,
  breadcrumbVisible: state.breadcrumbVisible,
  // ... new notification fields ...
  inAppNotificationsEnabled: state.inAppNotificationsEnabled,
  browserNotificationsEnabled: state.browserNotificationsEnabled,
  notificationConsent: state.notificationConsent,
  audioNotificationsEnabled: state.audioNotificationsEnabled,
}),
```

**Default values:**

| Field | Default | Rationale |
|-------|---------|-----------|
| `inAppNotificationsEnabled` | `true` | In-app toasts are non-invasive and provide the primary notification channel. Enabled by default so P1/P2 alerts are immediately visible without any user action. |
| `browserNotificationsEnabled` | `false` | Browser notifications require explicit consent (AD-6). Starting disabled ensures no cold permission requests. User must opt in via settings toggle. |
| `notificationConsent` | `'undecided'` | Fresh session has not been through the consent flow. |
| `audioNotificationsEnabled` | `false` | Audio cues are off by default per the combined recommendations. Opt-in only. |

**Consent state sync on app load:**

On hydration, the stored `notificationConsent` value may be stale if the user changed browser permissions outside the app (e.g., via browser settings). The `useNotificationDispatch` hook (Section 4.6) syncs the stored consent with the live `Notification.permission` value on mount:

- If stored consent is `'granted'` but `Notification.permission` is `'denied'`: update store to `'denied'` and set `browserNotificationsEnabled` to `false`.
- If stored consent is `'denied'` but `Notification.permission` is `'granted'`: update store to `'granted'` (user re-enabled in browser settings).
- If stored consent is `'undecided'` and `Notification.permission` is `'granted'`: update store to `'granted'` (permission was granted elsewhere or by another app on the same origin).

### 4.5 "Permanently Denied" State UI

**File:** `src/components/notifications/NotificationSettingsRow.tsx`

Per the validation finding, the plan must specify UI for the "permanently denied" state. When `Notification.permission === 'denied'`, the browser has permanently blocked notifications for this origin. The app cannot re-request permission -- only the user can re-enable it in browser settings.

**Component:** A settings row with a toggle and contextual information. Three visual states:

**State A -- Consent undecided or granted (toggle functional):**

```
+--------------------------------------------------------------+
| [Toggle: OFF/ON]  Browser notifications                      |
|                   Get alerts even when this tab               |
|                   is in the background                        |
+--------------------------------------------------------------+
```

Standard toggle behavior. When toggled ON with consent `'undecided'`, triggers the two-step consent flow (Section 4.3).

**State B -- Permission denied (toggle disabled):**

```
+--------------------------------------------------------------+
| [Toggle: OFF - disabled]  Browser notifications               |
|                           Blocked by browser.                 |
|                           [How to enable ->]                  |
+--------------------------------------------------------------+
```

| Element | Treatment |
|---------|-----------|
| Toggle | Visually disabled (reduced opacity `0.30`). `cursor-not-allowed`. `aria-disabled="true"`. |
| Status text | "Blocked by browser." at `rgba(255,255,255,0.35)`. |
| Help link | "How to enable" text link at `rgba(255,255,255,0.30)`, hover `rgba(255,255,255,0.50)`. On click, shows a tooltip or expands an inline help block. |

**Help text content (expanded on click):**

> "Your browser has blocked notifications for this site. To re-enable:
> 1. Click the lock/info icon in the address bar
> 2. Find 'Notifications' in the permissions list
> 3. Change it from 'Block' to 'Allow'
> 4. Refresh the page"

This help text is generic enough to cover Chrome, Firefox, Safari, and Edge (all use the address bar icon pattern, though the exact icon differs). No browser-specific instructions are provided because the User-Agent could identify the browser, but the complexity is not warranted for this phase.

**State C -- Granted and active (toggle ON with confirmation):**

```
+--------------------------------------------------------------+
| [Toggle: ON]  Browser notifications                          |
|               Active -- you'll receive alerts when            |
|               this tab is in the background                   |
+--------------------------------------------------------------+
```

Confirmation text at `rgba(255,255,255,0.35)` reassures the user that notifications are working.

**Accessibility:**

- Toggle uses `role="switch"` with `aria-checked` reflecting the current state.
- Disabled state uses `aria-disabled="true"` (not `disabled` attribute on a div).
- Help text is linked via `aria-describedby` to the toggle.
- Status text ("Blocked by browser" / "Active") is announced as part of the toggle's accessible description.

### 4.6 useNotificationDispatch Hook

**File:** `src/hooks/use-notification-dispatch.ts`

The orchestration hook that WS-2.4 consumes. It encapsulates the dual-channel dispatch logic and consent state sync.

**Interface:**

```typescript
interface NotificationDispatch {
  /**
   * Dispatch a notification for a priority alert.
   * Always fires an in-app sonner toast (if in-app notifications enabled).
   * Conditionally fires a browser notification (if consent granted + tab hidden).
   */
  notify: (alert: PriorityAlertPayload) => void

  /**
   * Trigger the two-step consent flow for browser notifications.
   * Called by the settings toggle when consent is 'undecided'.
   */
  requestBrowserConsent: () => void
}

export function useNotificationDispatch(): NotificationDispatch
```

**Dispatch logic (`notify`):**

```
notify(alert)
  |
  +-- Is inAppNotificationsEnabled?
  |     YES --> notifyPriorityAlert(alert)  [sonner toast]
  |     NO  --> skip
  |
  +-- Is browserNotificationsEnabled AND notificationConsent === 'granted'?
  |     YES --> Is document.hidden?
  |     |         YES --> sendBrowserNotification(alert)
  |     |         NO  --> skip (tab is focused, in-app toast is sufficient)
  |     NO  --> skip
  |
  +-- Is audioNotificationsEnabled AND alert.priority === 'P1'?
        YES --> playNotificationSound()
        NO  --> skip
```

**Consent sync on mount:**

The hook runs a `useEffect` on mount that synchronizes the stored `notificationConsent` with the live `Notification.permission` value (see Section 4.4, "Consent state sync on app load"). This effect runs once and updates the settings store if the browser permission has changed externally.

```typescript
useEffect(() => {
  if (typeof Notification === 'undefined') return  // SSR guard / unsupported browser

  const stored = useSettingsStore.getState().notificationConsent
  const live = Notification.permission

  if (stored === 'granted' && live === 'denied') {
    useSettingsStore.getState().setNotificationConsent('denied')
    useSettingsStore.getState().setBrowserNotificationsEnabled(false)
  } else if (stored === 'denied' && live === 'granted') {
    useSettingsStore.getState().setNotificationConsent('granted')
  } else if (stored === 'undecided' && live === 'granted') {
    useSettingsStore.getState().setNotificationConsent('granted')
  }
}, [])
```

### 4.7 Browser Notification Dispatch

**File:** `src/lib/notifications/send-browser-notification.ts`

Sends a Web `Notification` for a priority alert when conditions are met. This function is called by `useNotificationDispatch` and is not exported for direct consumer use.

**Implementation details:**

```typescript
export function sendBrowserNotification(alert: PriorityAlertPayload): void
```

**Notification construction:**

```typescript
const categoryMeta = getCategoryMeta(alert.category)

const notification = new Notification(
  `${alert.priority} ${categoryMeta.shortName}: ${alert.title}`,
  {
    body: `${alert.severity} severity -- ${categoryMeta.displayName}`,
    tag: alert.id,  // Deduplication: replaces existing notification with same tag
    requireInteraction: alert.priority === 'P1',  // P1 persists in notification tray
    silent: false,  // Respect OS notification sound settings
  }
)
```

| Property | P1 Value | P2 Value | Rationale |
|----------|----------|----------|-----------|
| `tag` | `alert.id` | `alert.id` | Deduplicates by alert ID. If a notification for the same alert already exists, the new one replaces it rather than stacking. |
| `requireInteraction` | `true` | `false` | P1 notifications persist in the notification tray until the user interacts. P2 notifications auto-dismiss per OS behavior (typically ~5-10 seconds). Mirrors the in-app toast persistence model. |
| `icon` | Not set (deferred) | Not set (deferred) | A notification icon (app logo) could be added in a future phase. The default browser/OS icon is used. |

**Click handler:**

```typescript
notification.onclick = () => {
  window.focus()  // Bring the app tab to the foreground
  // Navigate to the alert's district view (same as toast "View" action)
  useCoverageStore.getState().setDistrictPreselectedAlertId(alert.id)
  useUIStore.getState().startMorph(alert.category)
  notification.close()
}
```

Clicking the browser notification brings the app tab to the foreground and navigates to the alert, providing the same behavior as the in-app toast "View" button.

**Feature detection guard:**

The function is a no-op if the `Notification` API is not available (e.g., in a web worker context, or in a browser that does not support it). Guard: `if (typeof Notification === 'undefined') return`.

### 4.8 Audio Cue

**File:** `src/lib/notifications/notification-sound.ts`

A minimal audio notification module. Plays a short alert tone when a P1 alert arrives and audio is enabled.

**Implementation:**

```typescript
let audioInstance: HTMLAudioElement | null = null

export function playNotificationSound(): void {
  if (typeof Audio === 'undefined') return  // SSR guard

  if (!audioInstance) {
    audioInstance = new Audio('/sounds/alert-tone.mp3')
    audioInstance.volume = 0.3  // Moderate volume, not startling
  }

  // Reset to start in case sound is still playing from a previous call
  audioInstance.currentTime = 0
  audioInstance.play().catch(() => {
    // Autoplay blocked by browser. Silently fail.
    // The user will still see the visual notification.
  })
}
```

**Sound file:**

A short (< 1 second), professional alert tone placed at `public/sounds/alert-tone.mp3`. The sound should be:
- Brief: ~500ms duration
- Tone: Single ascending note or two-note chime (not an alarm or siren)
- Volume-normalized to avoid being startling at default system volume

The sound file must be sourced from a royalty-free library or created. This is flagged as an open question (OQ-1) since the SOW does not bundle creative assets.

**Autoplay policy:** Modern browsers block `audio.play()` calls until the user has interacted with the page (click, tap, keypress). By the time a P1 alert arrives, the operator has already interacted with the login form and the spatial canvas, satisfying the autoplay policy. The `.catch()` silently handles the edge case where autoplay is still blocked.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `notifyPriorityAlert()` fires a sonner toast when called with a `PriorityAlertPayload`. | Call function with a P1 payload; verify a toast appears in the bottom-right corner of the viewport. |
| AC-2 | P1 toast persists on screen indefinitely until the user clicks the close button or "View" action. | Fire a P1 toast; wait > 30 seconds; confirm toast is still visible. Click close; confirm toast is dismissed. |
| AC-3 | P2 toast auto-dismisses after 8 seconds. | Fire a P2 toast; start a timer; confirm toast disappears at ~8 seconds without user interaction. |
| AC-4 | Toast displays PriorityBadge (achromatic shape), severity color dot, category short name, alert title (truncated to 2 lines), and relative timestamp. | Visual inspection of a rendered P1 and P2 toast against the layout specification in Section 4.2. |
| AC-5 | No color is used on the PriorityBadge or priority-related elements within the toast. Severity dot is the only colored element. | Visual inspection: priority diamond/triangle is white-only. Code review: no severity color references in priority-related styles. |
| AC-6 | Toast "View" button dismisses the toast and navigates to the alert's district view with the alert preselected. | Click "View" on a toast; confirm toast dismisses; confirm district view opens with the correct alert highlighted. |
| AC-7 | Duplicate toasts for the same alert ID are prevented. | Call `notifyPriorityAlert()` twice with the same alert ID; confirm only one toast is visible. |
| AC-8 | P1 toast has a left border accent (achromatic, 3px) that visually distinguishes it from P2 toasts. | Visual inspection: P1 toast has a visible left border; P2 toast does not. |
| AC-9 | When "Browser notifications" toggle is turned ON with consent `'undecided'`, the two-step consent flow triggers: in-app explainer appears first. | Toggle browser notifications ON in settings; confirm the explainer card/toast appears with "Enable Notifications" and "Not Now" buttons. |
| AC-10 | Clicking "Enable Notifications" in the explainer triggers `Notification.requestPermission()`. | Click "Enable Notifications"; confirm the native browser permission dialog appears. |
| AC-11 | If browser permission is granted, the consent state updates to `'granted'`, the toggle stays ON, and a success toast appears. | Grant permission in the browser dialog; confirm settings store shows `notificationConsent: 'granted'` and a brief success toast appears. |
| AC-12 | If browser permission is denied, the consent state updates to `'denied'`, the toggle is disabled with a "Blocked by browser" label, and a help link is shown. | Deny permission in the browser dialog; confirm toggle becomes disabled with the correct help text. |
| AC-13 | Clicking "Not Now" in the explainer dismisses the prompt, keeps consent as `'undecided'`, and turns the toggle back OFF. The user can re-trigger later. | Click "Not Now"; confirm toggle is OFF; confirm no browser dialog was shown; toggle ON again; confirm explainer reappears. |
| AC-14 | When `Notification.permission === 'denied'`, the browser notifications toggle is rendered disabled with `aria-disabled="true"`, a "Blocked by browser" label, and a "How to enable" help link. | Set `Notification.permission` to `'denied'` (via browser settings or DevTools); confirm the toggle appearance and accessibility attributes. |
| AC-15 | On app load, if stored consent is `'granted'` but `Notification.permission` is `'denied'`, the store syncs to `'denied'`. | Modify browser permission to 'denied' without using the app; reload; confirm settings store updated. |
| AC-16 | Browser notifications fire only when `document.hidden === true` (tab is backgrounded). | Focus the tab; fire a notification; confirm no browser notification appears (only in-app toast). Background the tab; fire a notification; confirm browser notification appears. |
| AC-17 | Browser notification click brings the app tab to the foreground and navigates to the alert. | Background the tab; trigger a browser notification; click the notification; confirm the tab is focused and the district view opens. |
| AC-18 | `inAppNotificationsEnabled` toggle in settings store disables in-app toasts when set to `false`. | Set `inAppNotificationsEnabled` to `false`; fire a notification; confirm no sonner toast appears. |
| AC-19 | Audio cue plays on P1 alert arrival when `audioNotificationsEnabled` is `true`. No audio plays for P2. | Enable audio in settings; fire a P1 notification; confirm sound plays. Fire a P2 notification; confirm no sound. |
| AC-20 | Audio cue does not play when `audioNotificationsEnabled` is `false` (default). | Leave audio at default (off); fire a P1 notification; confirm no sound plays. |
| AC-21 | All new settings fields persist across page reloads via localStorage. | Set notification preferences; reload the page; confirm values are preserved in settings store. |
| AC-22 | `pnpm typecheck` passes with no new errors. | Run `pnpm typecheck`; verify exit code 0. |
| AC-23 | `pnpm build` completes without errors. | Run `pnpm build`; verify exit code 0. |
| AC-24 | Toast is keyboard-accessible: close button and "View" button are focusable and activatable via Enter/Space. | Tab to the toast; confirm close button and "View" button receive focus and respond to Enter key. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Store notification preferences in `settings.store.ts`, not `coverage.store.ts`. | `settings.store.ts` already has 4 user preference toggles persisted to `localStorage` via Zustand `persist` middleware with key `tarva-launch-settings`. `coverage.store.ts` is session-transient with no persist middleware (URL-driven). Notification preferences are user preferences that must survive page reloads. This is a correction of the original WS-2.6 scope which placed `notificationConsent` in coverage.store.ts. | `coverage.store.ts` as originally planned -- rejected per validation finding: wrong persistence model. Separate `notifications.store.ts` -- rejected: adding a 4th store (alongside ui, coverage, settings) for 4 boolean fields is over-engineering. Settings store is the correct home. |
| D-2 | Use `toast.custom()` for fully custom toast layout, not `toast()` with `description`/`action` options. | The toast requires a multi-element layout (PriorityBadge, severity dot, category label, timestamp, title, action button) that exceeds what Sonner's built-in `toast()` API can compose. `toast.custom()` renders an arbitrary React component inside Sonner's positioning and animation container, giving full layout control while inheriting dismiss/stack behavior. | `toast()` with `description` and `action` props -- rejected: limited to single-line description + single action button; cannot accommodate PriorityBadge, severity dot, and category label in the header row. `toast.message()` -- rejected: same layout limitations. |
| D-3 | Render the two-step consent explainer as a persistent sonner toast (`toast.custom()` with `duration: Infinity`), not as a modal dialog. | The consent prompt should appear contextually when the user toggles browser notifications, not as a blocking modal that interrupts their workflow. A persistent toast in the notification area (bottom-right) is non-blocking and visually connected to the notification system it is configuring. It also reuses the existing Sonner infrastructure rather than introducing a modal component. | Full-screen or centered modal dialog -- rejected: too disruptive for a secondary preference setting. The user was in the middle of configuring settings; a modal demands focus. Inline expansion below the toggle -- rejected: the toggle may be in a compact settings area (command palette or settings panel) without room for expanded content. |
| D-4 | Fire browser notifications only when `document.hidden === true` (tab is backgrounded), not when the tab is visible. | When the tab is visible, the in-app sonner toast is sufficient and provides richer interaction (action buttons, priority badge, severity color). Firing both a browser notification and an in-app toast when the tab is focused creates redundant alerts that annoy the user. The browser notification's purpose is to reach the user when they cannot see the in-app toast. | Always fire browser notification (if consented) -- rejected: redundant with in-app toast when tab is visible. Fire browser notification when tab is visible but window is not focused (e.g., another window covers the app) -- considered but `document.hidden` does not detect window occlusion, only tab visibility. This is a browser API limitation. |
| D-5 | Audio cue plays only for P1 alerts, not for P2. | P1 is "Critical" -- deserving of an audible signal to ensure the operator's attention even if they are looking away from the screen. P2 is "High" but not critical; audio for every P2 arrival would create noise fatigue in a real-time feed with frequent P2 alerts. | Audio for both P1 and P2 -- rejected: P2 alert volume in a real-time intel feed would make audio cues annoying and lead users to disable the feature entirely. Configurable per-priority audio -- deferred: adds complexity (two toggles) for a feature that is off by default. Can be revisited if users request it. |
| D-6 | Set `visibleToasts={4}` and `closeButton={true}` on the `<Toaster />` component (modifying WS-0.3's deliverable). | Sonner defaults to 3 visible toasts. In a real-time intel context, burst arrivals of P1/P2 alerts can queue 3+ toasts rapidly. 4 visible toasts balances screen real estate with awareness. `closeButton` is essential for P1 persistent toasts -- without it, the only dismiss mechanism is swipe (not discoverable) or the "View" action button (not always desired). These are WS-0.3 open questions OQ-2 and OQ-3 resolved by this workstream. | `visibleToasts={3}` (Sonner default) -- rejected: too few for burst scenarios. `visibleToasts={5}+` -- rejected: consumes too much vertical space in the bottom-right, potentially overlapping interactive panels. No close button (swipe/auto-dismiss only) -- rejected: P1 persists indefinitely without close button, creating a stuck notification that annoys the user. |
| D-7 | P1 toast left border is achromatic (`rgba(255,255,255,0.25)`) not colored. | Per AD-1, priority uses shape and weight, never color. A colored left border (e.g., red for P1) would violate the separation of visual channels. The achromatic border uses the shape channel (thick left edge) for priority differentiation. The severity dot inside the toast provides the color signal. | Severity-colored left border (e.g., red for Extreme) -- rejected: conflates priority and severity visual channels, violating AD-1. No left border -- rejected: P1 and P2 toasts need a stronger visual distinction beyond the PriorityBadge shape (diamond vs triangle), especially when scanning a stack of multiple toasts. |
| D-8 | Treat `'default'` result from `Notification.requestPermission()` as "not now" (consent stays `'undecided'`), not as denial. | When the user closes the browser permission dialog without choosing "Allow" or "Block", the permission returns to `'default'`. This is semantically different from denial -- the user did not make a choice. Treating it as `'undecided'` allows the user to re-trigger the consent flow later by toggling browser notifications on again. Treating it as `'denied'` would permanently lock out the feature without the user having made an explicit refusal. | Treat `'default'` as `'denied'` -- rejected: penalizes accidental dialog dismissal (common on mobile browsers where dialogs are easy to swipe away). Treat `'default'` as `'granted'` -- rejected: incorrect; permission was not actually granted. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | What audio file should be used for the P1 notification sound? The SOW specifies a ~500ms professional alert tone but does not source a specific file. Need a royalty-free sound asset or a custom-created tone. | Product / Design | Phase 2 (implementation time) |
| OQ-2 | Should the `NotificationSettingsRow` component be integrated into the existing command palette settings section, or should it wait for a dedicated settings panel? The command palette (`CommandPalette.tsx`) currently houses settings toggles for minimap, effects, and breadcrumb. | react-developer | Phase 2 (implementation time) |
| OQ-3 | Should the browser notification include the app icon (logo)? The `Notification` constructor accepts an `icon` property. If so, which image file and at what size? | Product / Design | Phase 2 (implementation time) |
| OQ-4 | How should the `useNotificationDispatch` hook be provided to WS-2.4? Should WS-2.4 call the hook directly, or should the hook be instantiated at a higher level (e.g., in the page component) and passed via context? The direct call pattern is simpler; context is only needed if multiple consumers dispatch notifications. | react-developer | Phase 2 (WS-2.4 SOW coordination) |
| OQ-5 | Should there be a maximum queue depth for pending browser notifications? If 10 P1 alerts arrive in rapid succession while the tab is backgrounded, should all 10 fire individual browser notifications, or should they be batched into a summary notification (e.g., "5 new P1 alerts")? | react-developer / UX advisory | Phase 2 (implementation time) |
| OQ-6 | Should the `inAppNotificationsEnabled` toggle default to `true` without the user explicitly enabling it? The current design enables in-app toasts by default (since they are non-invasive), but some users may find unsolicited toasts disruptive. | UX advisory | Phase 2 (validation during implementation) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Browser permanently denies `Notification.permission` on first attempt, locking out the feature. | LOW | MEDIUM | The two-step consent flow (AD-6) mitigates this by explaining the value before the native dialog. Users who understand what they are consenting to have a significantly higher grant rate. If denied, the settings toggle shows a disabled state with instructions for re-enabling in browser settings (Section 4.5). The app never re-prompts after native denial. Graceful degradation: in-app sonner toasts continue working regardless. |
| R-2 | Sonner `toast.custom()` does not support `duration: Infinity` or the `id`-based deduplication described in Section 4.1. | VERY LOW | HIGH | Sonner's documentation and source code confirm support for both `duration: Infinity` (persistent toasts) and `id`-based deduplication. These are core features of the library. If the API changes in a future version, pin to the version installed by WS-0.3. |
| R-3 | Browser autoplay policy blocks the audio notification sound even after user interaction. | LOW | LOW | The `playNotificationSound()` function catches the `play()` promise rejection silently. The user still receives visual notification (toast + browser notification). Audio is a supplementary cue, not the primary notification channel. The autoplay policy is satisfied by user interaction with the login form and spatial canvas before alerts arrive. |
| R-4 | `document.hidden` is not a reliable proxy for "user is not looking at the app" -- the tab may be visible but occluded by another window. | MEDIUM | LOW | `document.hidden` is the only standardized API for tab visibility. Window occlusion detection is not available in web standards. Accepting this limitation: if the tab is visible but occluded, the user receives an in-app toast (which they will see when they return to the tab) but not a browser notification. This is acceptable -- the in-app toast provides a persistent record of the alert. |
| R-5 | Burst arrival of P1/P2 alerts overwhelms the notification UI with simultaneous toasts and browser notifications. | MEDIUM | MEDIUM | In-app: `visibleToasts={4}` limits simultaneous display; older toasts queue and are accessible via hover expansion. Browser: the `tag` property on `Notification` deduplicates by alert ID, preventing exact duplicates. For distinct alerts arriving in rapid succession, the notification tray may accumulate many entries. OQ-5 tracks whether batching is needed. If burst volume is a problem in practice, add a debounce/throttle to `useNotificationDispatch.notify()` that batches arrivals within a 2-second window. |
| R-6 | The `Notification` API is not available in the deployment environment (e.g., GitHub Pages served over HTTPS supports it, but some restrictive browsers or corporate environments block it). | LOW | LOW | Feature detection guard (`typeof Notification === 'undefined'`) in `sendBrowserNotification()` and `useNotificationDispatch`. If the API is unavailable, browser notification features are hidden from the UI (the settings toggle is not rendered), and in-app toasts remain the sole notification channel. |
| R-7 | Settings store localStorage key `tarva-launch-settings` schema migration issue: existing users have the old 4-field schema; the new 8-field schema adds notification fields. | LOW | LOW | Zustand's `persist` middleware handles missing fields gracefully -- it merges the stored state with the default initial state. Fields not present in localStorage receive their default values. No explicit migration is needed. The `partialize` function ensures only the 8 specified fields are persisted, preventing stale fields from accumulating. |
| R-8 | The morph navigation triggered by toast "View" button or browser notification click fails if the district view system is not ready (e.g., morph is mid-transition). | LOW | MEDIUM | The `setDistrictPreselectedAlertId()` store action is idempotent and does not require the morph system to be in a specific state. The alert ID is stored and consumed when the district view mounts. If a morph is already in progress, the existing morph choreography system handles state transitions gracefully (new morph requests queue behind the current transition). |
