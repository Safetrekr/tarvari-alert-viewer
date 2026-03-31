# WS-C.5: Settings Sheet

> **Workstream ID:** WS-C.5
> **Phase:** C -- Map + Bottom Sheet
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-C.1 (MobileBottomSheet component), WS-A.2 (MobileBottomNav hamburger button + `onMenuPress` prop, MobileShell `onMenuPress` prop), WS-A.3 (glass tokens, spacing tokens, typography tokens)
> **Blocks:** WS-F.4 (Protective Ops Hooks extends `idleLockTimeoutMinutes` with idle timer implementation and wires `audioNotificationsEnabled` to Web Audio P1 alert)
> **Resolves:** OVERVIEW task 6.19, protective-ops-review C5 (session auto-lock configuration), protective-ops-review C6 (P1 sound toggle availability)

---

> **Promotion Note:** This workstream was originally task 6.19 in Phase F (Landscape + Polish). Promoted to Phase C per PO recommendation because the ambient effects toggle and P1 sound toggle are needed during Phase C development for testing map interactions and bottom sheet behavior with effects enabled/disabled.

---

## 1. Objective

Build the `MobileSettings` component: a bottom sheet triggered by the hamburger button in `MobileBottomNav` that provides user-accessible controls for ambient effects, P1 audio notifications, session auto-lock timeout, color scheme display, session information, API health status, and logout. Additionally, extend `settings.store.ts` with the `idleLockTimeoutMinutes` field (AD-6) that WS-F.4 will later consume for the idle lock timer implementation.

This workstream delivers:
1. The `MobileSettings` React component rendered inside a `MobileBottomSheet`.
2. The store extension (`idleLockTimeoutMinutes` + action + selector + persistence).
3. The wiring between the hamburger button's `onMenuPress` and the settings sheet open state.
4. A `useApiHealth` hook that derives API connection status from TanStack Query state.
5. The logout flow (clear session, redirect to `/login`).

The settings sheet is the primary surface through which operators configure the mobile experience. It must be discoverable (hamburger icon in the persistent bottom nav), scannable (grouped sections, clear labels), and safe (logout requires confirmation, destructive action placed at the bottom per convention).

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `MobileSettings` component | New component at `src/components/mobile/MobileSettings.tsx` rendering settings controls inside a `MobileBottomSheet` |
| Settings store extension | Add `idleLockTimeoutMinutes: number` state field, `setIdleLockTimeout(minutes: number)` action, selector, default value (5), and persist configuration to `settings.store.ts` |
| `useApiHealth` hook | New hook at `src/hooks/use-api-health.ts` that monitors TanStack Query `dataUpdatedAt` timestamps and `navigator.onLine` to derive a tri-state health signal (`'healthy' \| 'degraded' \| 'offline'`) |
| Hamburger wiring | Wire `MobileShell.onMenuPress` prop to toggle settings sheet visibility via local state in `MobileView` (or `MobileShell`) |
| Ambient effects toggle | Toggle control bound to `settings.store.effectsEnabled` via `toggleEffects()` |
| P1 sound toggle | Toggle control bound to `settings.store.audioNotificationsEnabled` via `setAudioNotifications()` |
| Auto-lock timeout selector | Segmented selector or dropdown offering 1m / 5m / 15m / Never, bound to `settings.store.idleLockTimeoutMinutes` via `setIdleLockTimeout()` |
| Color scheme display | Read-only row showing "Dark (v1)" -- not interactive in this release |
| Session info section | Inline `SessionTimecode` component (reused with `inline` prop from WS-A.2 D-4) plus session key prefix display |
| API health indicator | Colored dot + text label derived from `useApiHealth` hook |
| Logout button | Destructive action at sheet bottom. Tap triggers a confirmation step (inline, not a separate dialog). On confirm: calls `useAuthStore.logout()` then `router.push('/login')` |
| CSS file | `src/styles/mobile-settings.css` for settings-specific styles |
| Unit tests | Tests for store extension, `useApiHealth` hook, and `MobileSettings` component interaction |
| Accessibility | ARIA labels on all toggles, role attributes on sections, focus management on sheet open/close |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Idle lock timer implementation (`useIdleLock` hook) | WS-F.4 (Protective Ops Hooks) implements the actual idle detection timer that reads `idleLockTimeoutMinutes` and locks the session. This workstream only provides the store field and the UI selector. |
| P1 audio alert playback (`useP1AudioAlert` hook) | WS-F.4 implements the Web Audio API playback that reads `audioNotificationsEnabled`. This workstream only provides the toggle. |
| High-contrast / outdoor mode toggle | Deferred to Phase 7+ (protective-ops-review I3). The color scheme row is read-only "Dark (v1)" for now. |
| Notification consent flow | The existing `notificationConsent` field in settings store handles browser notification permission. This is not exposed in the mobile settings sheet for v1 (browser notifications are deferred per client Q3). |
| `MobileBottomSheet` component itself | WS-C.1 delivers the bottom sheet. This workstream uses it as a container. |
| Desktop settings UI | Desktop has no settings sheet; it uses the command palette for toggle commands. No desktop changes. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-C.1: `MobileBottomSheet` | Bottom sheet component with snap points, drag handle, glass background, `isOpen` / `onClose` props. Must support the `'settings'` context or a generic snap point configuration for half-height (~50%). | Pending (WS-C.1 SOW not yet written) |
| WS-A.2: `MobileBottomNav` | `onMenuPress` prop on `MobileBottomNavProps`. The hamburger button calls this when tapped. WS-A.2 D-5 defines this as a no-op placeholder. This workstream provides the real handler. | Pending (WS-A.2 draft complete) |
| WS-A.2: `MobileShell` | `onMenuPress` prop on `MobileShellProps`. Threaded from `MobileView` through `MobileShell` to `MobileBottomNav`. | Pending (WS-A.2 draft complete) |
| WS-A.2: `SessionTimecode` inline mode | `SessionTimecode` component with `inline` prop that renders as `position: relative` instead of `position: fixed`. WS-A.2 D-4 specifies this modification. | Pending (WS-A.2 draft complete) |
| WS-A.3: `mobile-tokens.css` | Glass tokens: `--glass-sheet-bg`, `--glass-sheet-blur`, `--glass-sheet-border`, `--glass-sheet-radius`. Spacing tokens: `--space-card-padding`, `--space-section-gap`, `--space-content-padding`. Typography tokens: `--text-label`, `--text-body`, `--text-caption`, `--tracking-label-mobile`. Touch target: `--touch-target-comfortable` (48px). | Pending (WS-A.3 draft complete) |
| `src/stores/settings.store.ts` | Existing store with `effectsEnabled`, `audioNotificationsEnabled`, `toggleEffects()`, `setAudioNotifications()`. This workstream extends it with `idleLockTimeoutMinutes` and `setIdleLockTimeout()`. | EXISTS (219 lines, see analysis below) |
| `src/stores/auth.store.ts` | `useAuthStore` with `logout()` action that clears sessionStorage key `tarva-launch-session` and sets `authenticated: false`. | EXISTS (79 lines) |
| `src/components/ambient/session-timecode.tsx` | `SessionTimecode` component for session info section. Requires `inline` prop (WS-A.2 D-4). | EXISTS (159 lines, `inline` prop added by WS-A.2) |
| `src/hooks/use-coverage-metrics.ts` | `useCoverageMetrics()` TanStack Query hook -- `dataUpdatedAt` used for API health derivation. Polls every 60s, staleTime 45s. | EXISTS |
| `src/hooks/use-priority-feed.ts` | `usePriorityFeed()` (if it exists) or equivalent TanStack Query hook -- `dataUpdatedAt` used for API health. Polls every 15s. | EXISTS |
| `next/navigation` | `useRouter()` for `router.push('/login')` on logout. | Available (Next.js 16 App Router) |
| Lucide React icons | `Settings`, `Volume2`, `VolumeX`, `Sparkles`, `Lock`, `Palette`, `Clock`, `LogOut`, `Wifi`, `WifiOff`, `Circle` | Available via existing `lucide-react` dependency |

---

## 4. Deliverables

### D-1: Settings Store Extension (`src/stores/settings.store.ts` modification)

Add the `idleLockTimeoutMinutes` field per AD-6 (combined-recommendations).

**State addition:**

```typescript
interface SettingsState {
  // ... existing fields ...

  /** Idle lock timeout in minutes. 0 = never auto-lock.
   *  Options: 1, 5, 15, 0.
   *  Read by useIdleLock hook (WS-F.4) to trigger session lock after inactivity.
   *  @see protective-ops-review C5 */
  idleLockTimeoutMinutes: number
}
```

**Action addition:**

```typescript
interface SettingsActions {
  // ... existing actions ...

  /** Set the idle lock timeout in minutes. 0 = never. */
  setIdleLockTimeout: (minutes: number) => void
}
```

**Default value:**

```typescript
const DEFAULT_SETTINGS: SettingsState = {
  // ... existing defaults ...
  idleLockTimeoutMinutes: 5,
}
```

**Implementation:**

```typescript
setIdleLockTimeout: (minutes) =>
  set((state) => {
    state.idleLockTimeoutMinutes = minutes
  }),
```

**Persist configuration:** Add `idleLockTimeoutMinutes` to the `partialize` function so it persists to localStorage under the existing `tarva-launch-settings` key.

**Selector addition:**

```typescript
export const settingsSelectors = {
  // ... existing selectors ...

  /** Current idle lock timeout in minutes. 0 = never. */
  idleLockTimeoutMinutes: (state: SettingsStore): number =>
    state.idleLockTimeoutMinutes,
} as const
```

**Backwards compatibility:** The `persist` middleware's `merge` strategy (default shallow merge) handles the new field gracefully. Users with existing localStorage data will get the default value (5) on first load since `idleLockTimeoutMinutes` will be `undefined` in their stored state. Add a version migration if needed, but Zustand's persist middleware uses shallow merge by default, which fills in defaults for missing keys. Verify this in testing.

### D-2: `useApiHealth` Hook (`src/hooks/use-api-health.ts`)

A lightweight hook that derives API connection status from TanStack Query metadata and browser online state.

**Return type:**

```typescript
export type ApiHealthStatus = 'healthy' | 'degraded' | 'offline'

export interface ApiHealthResult {
  /** Tri-state health signal. */
  status: ApiHealthStatus
  /** Human-readable label for display. */
  label: string
  /** Seconds since last successful data update across all monitored queries. */
  secondsSinceLastUpdate: number | null
}
```

**Logic:**

1. Read `navigator.onLine` via a `useState` + `addEventListener('online'/'offline')` pattern.
2. Read `dataUpdatedAt` from the two most critical TanStack Query caches using `useQueryClient().getQueryState(queryKey)`:
   - Coverage metrics query key: `['coverage', 'metrics']`
   - Priority feed query key: inspect from `usePriorityFeed` (or `['priority', 'feed', ...]`)
3. Compute `secondsSinceLastUpdate` as the maximum age across both queries.
4. Derive status:
   - `'offline'`: `navigator.onLine === false`
   - `'degraded'`: online but `secondsSinceLastUpdate > 180` (3 minutes, matching WS-B.3's staleness threshold)
   - `'healthy'`: online and data is fresh

**Label mapping:**

| Status | Label |
|--------|-------|
| `'healthy'` | `'Connected'` |
| `'degraded'` | `'Data stale'` |
| `'offline'` | `'Offline'` |

**Poll interval:** The hook re-evaluates every 10 seconds via `setInterval` to catch staleness transitions without depending on query refetch cycles.

**~45 lines.** No external dependencies beyond TanStack Query's `useQueryClient`.

### D-3: `MobileSettings` Component (`src/components/mobile/MobileSettings.tsx`)

The settings sheet content rendered inside a `MobileBottomSheet`.

**Props interface:**

```typescript
export interface MobileSettingsProps {
  /** Whether the settings sheet is open. */
  isOpen: boolean
  /** Called when the sheet should close (drag down, tap backdrop, X button, or post-logout). */
  onClose: () => void
}
```

**Component structure:**

```typescript
export function MobileSettings({ isOpen, onClose }: MobileSettingsProps) {
  // Store bindings
  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)
  const toggleEffects = useSettingsStore((s) => s.toggleEffects)
  const audioEnabled = useSettingsStore((s) => s.audioNotificationsEnabled)
  const setAudioNotifications = useSettingsStore((s) => s.setAudioNotifications)
  const idleLockTimeout = useSettingsStore((s) => s.idleLockTimeoutMinutes)
  const setIdleLockTimeout = useSettingsStore((s) => s.setIdleLockTimeout)
  const logout = useAuthStore((s) => s.logout)
  const router = useRouter()
  const apiHealth = useApiHealth()

  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = useCallback(() => {
    logout()
    onClose()
    router.push('/login')
  }, [logout, onClose, router])

  return (
    <MobileBottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['50%']}>
      {/* Sheet content */}
    </MobileBottomSheet>
  )
}
```

**Visual layout:**

```
+------------------------------------------+
|          (tab content visible behind)     |
|                                          |
|--------- === drag handle === ------------|  Drag handle (from MobileBottomSheet)
|  SETTINGS                          [x]  |  Sheet header: 48px
|------------------------------------------|
|                                          |
|  DISPLAY                                 |  Section header (label style)
|  Ambient Effects          [====ON====]   |  Toggle row
|  P1 Sound Alerts          [====OFF===]   |  Toggle row
|                                          |
|  SECURITY                                |  Section header
|  Auto-Lock Timeout    [1m][5m][15m][Off] |  Segmented control
|                                          |
|  APPEARANCE                              |  Section header
|  Color Scheme             Dark (v1)      |  Info row (read-only)
|                                          |
|------------------------------------------|
|  SESSION                                 |  Section header
|  REC 00:14:32:22                         |  SessionTimecode inline
|  API Status       [*] Connected          |  Health indicator row
|------------------------------------------|
|                                          |
|  [        LOGOUT        ]                |  Destructive button, full-width
|  (or: "Confirm logout?" [Yes] [Cancel])  |  Inline confirmation
|                                          |
+------------------------------------------+
```

**Section breakdown:**

#### Header Row

- Left: "SETTINGS" in `--text-label` size (11px), `--font-mono`, uppercase, `--tracking-label-mobile` (0.14em), `rgba(255, 255, 255, 0.45)`.
- Right: Close button (Lucide `X` icon, 18px). 48x48px touch target. Calls `onClose`.

#### Display Section

**Section header:** "DISPLAY" in `--text-caption` size (10px), `--font-mono`, uppercase, `--tracking-label-mobile`, `rgba(255, 255, 255, 0.30)`. Margin-top: `var(--space-section-gap)` (16px).

**Toggle row -- Ambient Effects:**

| Property | Value |
|----------|-------|
| Layout | Flex row, `justify-content: space-between`, `align-items: center` |
| Height | 48px (touch target) |
| Left side | Lucide `Sparkles` icon (16px, `rgba(255,255,255,0.40)`) + "Ambient Effects" label (`--text-body`, 13px, `rgba(255,255,255,0.70)`) |
| Right side | Toggle switch (44x24px, custom styled) |
| Binding | `checked={effectsEnabled}`, `onChange={() => toggleEffects()}` |
| ARIA | `<button role="switch" aria-checked={effectsEnabled} aria-label="Ambient effects">` |

**Toggle row -- P1 Sound Alerts:**

| Property | Value |
|----------|-------|
| Layout | Same as above |
| Left side | Lucide `Volume2` (when on) or `VolumeX` (when off), 16px + "P1 Sound Alerts" label |
| Right side | Toggle switch |
| Binding | `checked={audioEnabled}`, `onChange={() => setAudioNotifications(!audioEnabled)}` |
| ARIA | `<button role="switch" aria-checked={audioEnabled} aria-label="P1 sound alerts">` |

**Toggle switch visual spec:**

```css
/* Toggle switch dimensions and colors */
.settings-toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.10);  /* off state */
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background var(--duration-hover, 150ms) var(--ease-default);
  position: relative;
  cursor: pointer;
}
.settings-toggle[aria-checked='true'] {
  background: rgba(34, 197, 94, 0.30);  /* on state: green tint */
  border-color: rgba(34, 197, 94, 0.20);
}
.settings-toggle-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.70);
  position: absolute;
  top: 2px;
  left: 2px;  /* off position */
  transition: transform var(--duration-hover, 150ms) var(--ease-default);
}
.settings-toggle[aria-checked='true'] .settings-toggle-thumb {
  transform: translateX(20px);  /* on position */
}
```

#### Security Section

**Section header:** "SECURITY" -- same style as Display section header.

**Auto-Lock Timeout -- Segmented Control:**

| Property | Value |
|----------|-------|
| Layout | Flex row, label on left, segmented control on right |
| Left side | Lucide `Lock` icon (16px) + "Auto-Lock" label |
| Right side | 4-segment inline control: `1m`, `5m`, `15m`, `Off` |
| Segment dimensions | Each segment: min-width 40px, height 32px |
| Active segment | `background: rgba(255, 255, 255, 0.10)`, `color: rgba(255, 255, 255, 0.80)` |
| Inactive segment | `background: transparent`, `color: rgba(255, 255, 255, 0.35)` |
| Border | Outer container: `1px solid rgba(255, 255, 255, 0.08)`, `border-radius: 6px` |
| Binding | Active value derived from `idleLockTimeout`: `1` -> "1m", `5` -> "5m", `15` -> "15m", `0` -> "Off" |
| On change | Calls `setIdleLockTimeout(minutes)` with the corresponding numeric value |
| ARIA | `<div role="radiogroup" aria-label="Auto-lock timeout">` with individual `<button role="radio" aria-checked={...}>` per segment |

**Value mapping:**

```typescript
const IDLE_LOCK_OPTIONS = [
  { value: 1, label: '1m' },
  { value: 5, label: '5m' },
  { value: 15, label: '15m' },
  { value: 0, label: 'Off' },
] as const
```

#### Appearance Section

**Section header:** "APPEARANCE" -- same style.

**Color Scheme -- Info Row (read-only):**

| Property | Value |
|----------|-------|
| Layout | Flex row, `justify-content: space-between`, `align-items: center` |
| Height | 48px |
| Left side | Lucide `Palette` icon (16px) + "Color Scheme" label |
| Right side | "Dark (v1)" text in `--text-caption` (10px), `rgba(255, 255, 255, 0.35)` |
| Interactivity | None. No tap handler. `opacity: 0.6` on the entire row to visually indicate non-interactive status. |

#### Session Section

**Separator:** A `1px solid rgba(255, 255, 255, 0.06)` horizontal rule with `margin: var(--space-section-gap) 0`.

**Section header:** "SESSION" -- same style.

**Session Timecode Row:**

| Property | Value |
|----------|-------|
| Layout | Flex row, full width |
| Content | `<SessionTimecode inline />` -- renders the REC dot + HH:MM:SS:FF timecode as an inline element |
| Font scaling | The inline `SessionTimecode` uses its own internal 9px font size (set by WS-A.2 D-4 inline mode). No additional scaling needed. |

**API Health Row:**

| Property | Value |
|----------|-------|
| Layout | Flex row, `justify-content: space-between`, `align-items: center` |
| Height | 48px |
| Left side | "API Status" label (`--text-body`, 13px) |
| Right side | Health indicator: colored dot (8px circle) + status label text |

**Health indicator color mapping:**

| `useApiHealth().status` | Dot Color | Label Text | Label Color |
|-------------------------|-----------|------------|-------------|
| `'healthy'` | `var(--color-healthy)` (`#22c55e`) | `'Connected'` | `rgba(255, 255, 255, 0.50)` |
| `'degraded'` | `var(--color-warning)` (`#eab308`) | `'Data stale'` | `rgba(234, 179, 8, 0.70)` |
| `'offline'` | `var(--color-error)` (`#ef4444`) | `'Offline'` | `rgba(239, 68, 68, 0.70)` |

When `status === 'degraded'`, also display seconds since last update: `"Data stale (3m 45s)"`.

#### Logout Section

**Logout button:**

| Property | Value |
|----------|-------|
| Layout | Full-width button at the bottom of the sheet content, margin-top `var(--space-section-gap)` |
| Height | 48px |
| Background | `rgba(239, 68, 68, 0.08)` (faint red tint) |
| Border | `1px solid rgba(239, 68, 68, 0.15)` |
| Border radius | `8px` |
| Text | "LOGOUT" in `--text-label` (11px), `--font-mono`, uppercase, `rgba(239, 68, 68, 0.70)` |
| Icon | Lucide `LogOut` (16px) to the left of the text, same color |
| Touch target | 48px height (meets design target) |
| ARIA | `aria-label="Logout"` |

**Confirmation behavior:**

When the logout button is tapped, it does NOT immediately log out. Instead, the button content morphs inline to a confirmation state:

```
Before:   [      LOGOUT      ]
After:    [  End session?  [YES]  [CANCEL]  ]
```

| Confirmation Property | Value |
|----------------------|-------|
| Text | "End session?" in `--text-body` (13px), `rgba(255, 255, 255, 0.55)` |
| YES button | 64px wide, 32px tall, `background: rgba(239, 68, 68, 0.20)`, text "YES" in `rgba(239, 68, 68, 0.80)`. `aria-label="Confirm logout"`. |
| CANCEL button | 64px wide, 32px tall, `background: transparent`, `border: 1px solid rgba(255, 255, 255, 0.08)`, text "CANCEL" in `rgba(255, 255, 255, 0.40)`. `aria-label="Cancel logout"`. |
| Transition | 150ms opacity crossfade (`var(--duration-hover)`) |
| Auto-revert | If the user does not tap YES within 5 seconds, revert to the default button state. |

**Logout execution flow:**

1. User taps YES.
2. Call `useAuthStore.getState().logout()` -- this clears `tarva-launch-session` from sessionStorage and sets `authenticated: false`.
3. Call `onClose()` to dismiss the settings sheet.
4. Call `router.push('/login')` to navigate to the login page.
5. The `(launch)/layout.tsx` auth guard will also redirect on `authenticated === false`, providing a safety net.

### D-4: CSS File (`src/styles/mobile-settings.css`)

Dedicated CSS for settings sheet components. Imported by `MobileSettings.tsx`.

**Contents:**

```css
/* Mobile Settings Sheet
   =====================
   Styles for the MobileSettings bottom sheet content.
   Consumed by: src/components/mobile/MobileSettings.tsx
   Tokens from: mobile-tokens.css (glass, spacing, typography)
   ------------------------------------------------------------ */

/* Section header */
.settings-section-header {
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: var(--tracking-label-mobile, 0.14em);
  color: rgba(255, 255, 255, 0.30);
  line-height: 1;
  margin-top: var(--space-section-gap, 16px);
  margin-bottom: 8px;
  padding: 0 var(--space-content-padding, 12px);
}

/* Settings row (toggle, info, selector) */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--touch-target-comfortable, 48px);
  padding: 0 var(--space-content-padding, 12px);
  gap: 12px;
}

.settings-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.settings-row-icon {
  color: rgba(255, 255, 255, 0.40);
  flex-shrink: 0;
}

.settings-row-label {
  font-family: var(--font-mono);
  font-size: var(--text-body, 13px);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.70);
  line-height: 1.3;
}

.settings-row-value {
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1;
}

.settings-row--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Toggle switch */
.settings-toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.10);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: background var(--duration-hover, 150ms) ease;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
}

.settings-toggle[aria-checked='true'] {
  background: rgba(34, 197, 94, 0.30);
  border-color: rgba(34, 197, 94, 0.20);
}

.settings-toggle-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.70);
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform var(--duration-hover, 150ms) ease;
}

.settings-toggle[aria-checked='true'] .settings-toggle-thumb {
  transform: translateX(20px);
}

/* Segmented control */
.settings-segmented {
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.settings-segment {
  min-width: 40px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.35);
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background var(--duration-hover, 150ms) ease,
    color var(--duration-hover, 150ms) ease;
  -webkit-tap-highlight-color: transparent;
}

.settings-segment + .settings-segment {
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.settings-segment[aria-checked='true'] {
  background: rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.80);
}

/* Health indicator */
.settings-health-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.settings-health-label {
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  font-weight: 400;
  line-height: 1;
}

/* Session info */
.settings-session-row {
  display: flex;
  align-items: center;
  padding: 8px var(--space-content-padding, 12px);
}

/* Separator */
.settings-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: var(--space-section-gap, 16px) 0;
}

/* Logout button */
.settings-logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: var(--touch-target-comfortable, 48px);
  margin: var(--space-section-gap, 16px) var(--space-content-padding, 12px) 0;
  /* Adjust width for margin */
  width: calc(100% - 2 * var(--space-content-padding, 12px));
  padding: 0 16px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 8px;
  color: rgba(239, 68, 68, 0.70);
  font-family: var(--font-mono);
  font-size: var(--text-label, 11px);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition:
    background var(--duration-hover, 150ms) ease,
    border-color var(--duration-hover, 150ms) ease;
  -webkit-tap-highlight-color: transparent;
}

.settings-logout-btn:active {
  background: rgba(239, 68, 68, 0.15);
}

/* Logout confirmation inline */
.settings-logout-confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: calc(100% - 2 * var(--space-content-padding, 12px));
  margin: var(--space-section-gap, 16px) var(--space-content-padding, 12px) 0;
  min-height: var(--touch-target-comfortable, 48px);
}

.settings-logout-confirm-text {
  font-family: var(--font-mono);
  font-size: var(--text-body, 13px);
  color: rgba(255, 255, 255, 0.55);
}

.settings-logout-confirm-yes {
  min-width: 64px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.20);
  color: rgba(239, 68, 68, 0.80);
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.settings-logout-confirm-cancel {
  min-width: 64px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.40);
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .settings-toggle,
  .settings-toggle-thumb,
  .settings-segment,
  .settings-logout-btn {
    transition: none;
  }
}
```

### D-5: Integration Wiring

#### In `MobileView.tsx` (or `MobileShell.tsx`)

Add settings sheet open state and wire the hamburger handler:

```typescript
const [settingsOpen, setSettingsOpen] = useState(false)

const handleMenuPress = useCallback(() => {
  setSettingsOpen(true)
}, [])

const handleSettingsClose = useCallback(() => {
  setSettingsOpen(false)
}, [])

// In render:
<MobileShell onMenuPress={handleMenuPress} ... />
<MobileSettings isOpen={settingsOpen} onClose={handleSettingsClose} />
```

The `MobileSettings` component uses a React portal (via `MobileBottomSheet`) so it renders above all other content regardless of where it appears in the component tree.

#### Focus Management

When the settings sheet opens:
1. Focus moves to the first interactive element in the sheet (the close button or the first toggle).
2. Focus is trapped within the sheet (standard bottom sheet behavior from WS-C.1).
3. When the sheet closes, focus returns to the hamburger button in `MobileBottomNav`.

This requires that `MobileBottomSheet` (WS-C.1) implements focus trap and focus restoration. If WS-C.1 does not provide this, this workstream adds a `useEffect` to manage focus manually using `ref.focus()` on open and a stored `previousFocusRef` on close.

### D-6: Unit Tests

#### `src/stores/__tests__/settings.store.test.ts` (extend existing or new)

```
Test: idleLockTimeoutMinutes defaults to 5
Test: setIdleLockTimeout(15) updates idleLockTimeoutMinutes to 15
Test: setIdleLockTimeout(0) sets idleLockTimeoutMinutes to 0 (never)
Test: idleLockTimeoutMinutes is included in persisted state
```

#### `src/hooks/__tests__/use-api-health.test.ts`

```
Test: returns 'offline' when navigator.onLine is false
Test: returns 'healthy' when online and all query data is fresh (<180s)
Test: returns 'degraded' when online and any query data is stale (>180s)
Test: label matches status ('Connected', 'Data stale', 'Offline')
Test: secondsSinceLastUpdate computes correctly from dataUpdatedAt
```

Mock `useQueryClient` to return controlled `dataUpdatedAt` timestamps. Mock `navigator.onLine` via `Object.defineProperty(navigator, 'onLine', { value: false })`.

#### `src/components/mobile/__tests__/MobileSettings.test.tsx`

```
Test: renders all settings controls when isOpen is true
Test: ambient effects toggle reflects effectsEnabled state
Test: toggling ambient effects calls toggleEffects()
Test: P1 sound toggle reflects audioNotificationsEnabled state
Test: toggling P1 sound calls setAudioNotifications(!current)
Test: auto-lock selector renders all 4 options (1m, 5m, 15m, Off)
Test: auto-lock selector highlights the active option
Test: tapping a different auto-lock option calls setIdleLockTimeout()
Test: color scheme row displays "Dark (v1)" and is non-interactive
Test: session timecode renders inline
Test: API health indicator renders with correct status
Test: logout button tap shows confirmation (does not immediately logout)
Test: confirming logout calls useAuthStore.logout()
Test: confirming logout navigates to /login
Test: cancelling logout reverts to default button state
Test: close button calls onClose
Test: sheet is not rendered when isOpen is false
```

Use `@testing-library/react` with `userEvent` for interaction testing. Mock `useAuthStore`, `useSettingsStore`, and `useRouter` from `next/navigation`. Mock `useApiHealth` to return controlled health states.

**Test file location:** `src/components/mobile/__tests__/MobileSettings.test.tsx`

**Estimated total test count:** 20-22 tests across 3 files.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Tapping the hamburger button in `MobileBottomNav` opens the settings bottom sheet at ~50% viewport height. | Manual: DevTools responsive mode at 375x812. Tap hamburger. Verify sheet appears with glass background and drag handle. |
| AC-2 | Settings sheet displays five sections: Display (2 toggles), Security (1 selector), Appearance (1 info row), Session (timecode + health), Logout (1 button). | Visual inspection of rendered content. Count all controls. |
| AC-3 | Ambient Effects toggle reflects `settings.store.effectsEnabled`. Toggling updates the store and persists to localStorage. | Toggle the control. Verify `localStorage.getItem('tarva-launch-settings')` contains updated `effectsEnabled` value. Reload page; verify toggle state persists. |
| AC-4 | P1 Sound Alerts toggle reflects `settings.store.audioNotificationsEnabled`. Toggling updates the store and persists to localStorage. | Same verification as AC-3 for `audioNotificationsEnabled`. |
| AC-5 | Auto-Lock Timeout selector displays four options: 1m, 5m, 15m, Off. Default is 5m highlighted. Selecting a different option updates `settings.store.idleLockTimeoutMinutes` and persists. | Tap each segment. Verify `localStorage.getItem('tarva-launch-settings')` shows corresponding numeric value (1, 5, 15, 0). |
| AC-6 | `idleLockTimeoutMinutes` field exists in `settings.store.ts` with default value `5`, action `setIdleLockTimeout`, selector, and is included in the `partialize` function for persistence. | Code inspection of `settings.store.ts`. Verify the field is in the interface, defaults, actions, partialize, and selectors. |
| AC-7 | Color Scheme row displays "Dark (v1)" and is visually dimmed / non-interactive. Tapping produces no effect. | Tap the row. Verify no state changes, no console errors. |
| AC-8 | Session section shows `SessionTimecode` inline (not fixed to viewport corner) with the REC dot and running timecode. | Visual inspection: timecode appears within the sheet content, not overlapping the bottom-right viewport corner. |
| AC-9 | API Health indicator shows a green dot and "Connected" when TanStack Query data is fresh and device is online. | With the TarvaRI API running, open settings. Verify green dot and "Connected" label. |
| AC-10 | API Health indicator shows a yellow dot and "Data stale" when data is older than 3 minutes. | Stop the TarvaRI API, wait >3 minutes (or mock `dataUpdatedAt`). Open settings. Verify yellow dot and "Data stale (Xm Xs)" label. |
| AC-11 | API Health indicator shows a red dot and "Offline" when `navigator.onLine` is false. | Chrome DevTools: Network tab -> Offline checkbox. Open settings. Verify red dot and "Offline" label. |
| AC-12 | Logout button tap shows inline confirmation ("End session?" + YES + CANCEL). Does not immediately log out. | Tap Logout. Verify button morphs to confirmation state. Verify no navigation or session clearing has occurred. |
| AC-13 | Confirming logout clears `tarva-launch-session` from sessionStorage, navigates to `/login`. | Tap Logout -> YES. Verify `sessionStorage.getItem('tarva-launch-session')` is null. Verify URL is `/login`. |
| AC-14 | Cancelling logout reverts the button to default state. | Tap Logout -> CANCEL. Verify button shows "LOGOUT" again. |
| AC-15 | Logout confirmation auto-reverts after 5 seconds of inactivity. | Tap Logout. Wait 5 seconds without tapping YES or CANCEL. Verify button reverts to "LOGOUT". |
| AC-16 | All interactive elements in the settings sheet have a minimum touch target of 48x48px. | DevTools: inspect computed `min-height` and `min-width` on toggles, segments, buttons, close button. |
| AC-17 | Toggle switches have `role="switch"` and `aria-checked` attributes. Segmented control has `role="radiogroup"` with individual `role="radio"` segments. | DevTools: inspect ARIA attributes on all controls. |
| AC-18 | Dragging the sheet down or tapping the backdrop closes the settings sheet (standard `MobileBottomSheet` behavior). | Drag the handle down past threshold. Verify sheet dismisses. Tap outside the sheet. Verify sheet dismisses. |
| AC-19 | `pnpm typecheck` passes with zero errors after all changes. | Run `pnpm typecheck` from project root. |
| AC-20 | Desktop view is completely unaffected. The settings store extension does not break desktop rendering or existing settings persistence. | Load desktop view at 1920x1080. Verify all existing settings (minimap, effects, breadcrumb toggles in command palette) function correctly. Verify localStorage data from before the change is compatible (new field defaults to 5). |
| AC-21 | All unit tests pass. | Run `pnpm test:unit` (or Vitest directly). All 20+ tests green. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | Settings sheet is rendered via `MobileBottomSheet` (WS-C.1) rather than a custom sheet or full-screen overlay. | Consistency with the rest of the mobile UI which uses bottom sheets for all drill-down and secondary content. Reuses glass, spring, and drag handle patterns. The OVERVIEW Section 4.7 specifies "Bottom sheet (half-height snap)" for settings. | (a) Full-screen overlay: rejected because settings content fits in half-screen and does not warrant full viewport takeover. (b) Side drawer: rejected because it conflicts with the Oblivion aesthetic and is not used elsewhere in the mobile design. |
| DM-2 | Settings sheet state (`isOpen`) is managed via local `useState` in `MobileView` (or `MobileShell`), not in a Zustand store. | Settings visibility is ephemeral UI state. It has no persistence requirement, no URL sync, and no cross-component readers outside the immediate parent-child chain. Adding it to a Zustand store would violate the state colocation principle (AD-3 in WS-A.2: tab state is local). | (a) Add `settingsSheetOpen` to `ui.store.ts`: rejected per AD-3 (local state first). The only consumer is the component that renders the sheet. (b) Add to `coverage.store.ts`: rejected (unrelated to data filtering). |
| DM-3 | Logout requires inline confirmation (button morphs to YES/CANCEL) rather than a separate dialog or no confirmation. | Logout is destructive (clears session, requires re-entering passphrase). Inline confirmation avoids a separate modal (which would be a third overlay: bottom sheet + backdrop + dialog). The 5-second auto-revert prevents the confirmation state from persisting if the user accidentally taps logout and then navigates away mentally. | (a) No confirmation: rejected for safety (accidental logout during field operations is disruptive per protective-ops-review context). (b) Separate confirmation dialog: rejected to avoid modal stacking. (c) Swipe-to-confirm: rejected as non-standard and undiscoverable. |
| DM-4 | `idleLockTimeoutMinutes` uses `0` for "never" rather than `null` or `Infinity`. | `0` is a clean sentinel value that the `useIdleLock` hook (WS-F.4) can check with a simple `if (timeout === 0) return` early exit. It persists cleanly to JSON (no `null` serialization edge cases). The options array `[1, 5, 15, 0]` is self-documenting. | (a) `null` for never: rejected because it requires null-handling in every consumer. (b) `Infinity`: rejected because `JSON.stringify(Infinity)` produces `null` which would corrupt the persisted value. (c) `-1` for never: rejected as less intuitive than `0`. |
| DM-5 | `useApiHealth` hook reads from `useQueryClient().getQueryState()` rather than calling the data hooks directly. | The settings component should not trigger data fetching. Calling `useCoverageMetrics()` inside settings would create a new query subscription and potentially trigger a refetch. `getQueryState()` reads the cache passively without side effects. | (a) Call the data hooks with `enabled: false`: adds unnecessary overhead and hook management. (b) Read from Zustand store: no store currently tracks data freshness (that is TanStack Query's domain). (c) Dedicated `/health` API endpoint: over-engineered for v1 since we can derive health from existing query state. |
| DM-6 | CSS is in a dedicated `mobile-settings.css` file rather than inline styles or co-located in the component. | Follows the codebase pattern for mobile CSS: `mobile-shell.css` (WS-A.2), `mobile-tokens.css` (WS-A.3), `mobile-ambient.css` (WS-B.3). The toggle switch, segmented control, and confirmation states use pseudo-selectors and attribute selectors (`[aria-checked='true']`) that cannot be expressed as inline styles. | (a) Tailwind utilities: the toggle switch, segmented control, and ARIA attribute selectors are complex enough to warrant dedicated CSS. (b) Inline styles: cannot express `[aria-checked='true']`, pseudo-selectors, media queries. |
| DM-7 | The component imports `mobile-settings.css` directly (not via `globals.css`) to keep it within the mobile code-split chunk. | Follows the pattern established by WS-A.2 DM-7: "CSS file is imported directly by the component (not added to `globals.css`), ensuring it is only loaded within the mobile code-split chunk." Desktop users never download settings CSS. | (a) Add to `globals.css`: would load on desktop. (b) CSS modules: not used elsewhere in the project; would break the convention. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the settings sheet include a "Version" or "Build" info line (e.g., "TarvaRI Console v1.0.0")? The OVERVIEW Section 4.7 wireframe does not show this, but it is common in mobile settings screens and useful for support/debugging. | Product Owner | Phase C review gate |
| OQ-2 | The `idleLockTimeoutMinutes` default is 5 per AD-6 and protective-ops-review C5. Should the default be different for field operators vs analysts? Currently there is no role information available (passphrase auth has no roles per OVERVIEW decision I5). | Product Owner | Phase F (when/if role-aware defaults are implemented) |
| OQ-3 | Should toggling P1 Sound Alerts prompt for browser notification permission? Currently the toggle only sets the store value; actual audio playback is WS-F.4 scope. However, if `audioNotificationsEnabled` is turned on but the app later needs `Notification.requestPermission()` (for future browser notifications per client Q3), should we request it proactively? | Engineering Lead | Phase F |
| OQ-4 | The WS-C.1 `MobileBottomSheet` snap point configuration is not yet defined. This SOW assumes a `snapPoints` prop accepting an array of percentages (e.g., `['50%']`). If WS-C.1 uses a different API (e.g., named contexts like `'settings'`), the integration code in D-3 needs adjustment. | WS-C.1 author | Phase C (resolved when WS-C.1 SOW is written) |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `MobileBottomSheet` (WS-C.1) API does not match the assumed `isOpen` / `onClose` / `snapPoints` interface, requiring rework of `MobileSettings`. | Medium | Low | The OVERVIEW Section 5.2 and WS-A.3 bottom sheet tokens strongly imply a controlled component pattern. If the API differs, the integration wiring (D-5) is the only part that changes; the settings content (D-3) is independent of the sheet container API. Estimated rework: <30 minutes. |
| R-2 | Zustand `persist` middleware shallow merge does not correctly handle the new `idleLockTimeoutMinutes` field for users with existing localStorage data. The field could remain `undefined` instead of defaulting to `5`. | Low | Medium | Zustand's persist `merge` strategy performs `{ ...storedState, ...initialState }` by default, which means initial state values are overwritten by stored values. For a NEW field not present in stored state, the stored state has no key, so the initial default (5) is used. However, if the merge order is reversed, the new field would be `undefined`. Verify in unit tests (D-6). If needed, add a `migrate` function to the persist config (version 1 -> 2) that sets the default. |
| R-3 | `useQueryClient().getQueryState(queryKey)` returns `undefined` if the query has never been executed (e.g., settings opened before any data hook mounts). | Medium | Low | The `useApiHealth` hook handles `undefined` query state gracefully by treating it as `'degraded'` (no data available = cannot confirm health). This is the conservative choice: better to show "Data stale" than "Connected" when we have no evidence either way. |
| R-4 | The logout flow navigates to `/login` but the settings sheet's close animation may race with the route change, causing a flash of content. | Low | Low | Call `onClose()` first, then `router.push('/login')` on the next tick (`setTimeout(..., 0)` or after the sheet's `onAnimationComplete` callback if `MobileBottomSheet` provides one). In the worst case, the route change unmounts the entire mobile component tree, which naturally cleans up the sheet. |
| R-5 | The 5-second auto-revert on logout confirmation may fire after the component has unmounted (if the user closes the sheet during the confirmation state), causing a `setState` on unmounted component warning. | Low | Low | Use `useRef` to track mounted state or return a cleanup function from the `useEffect`/`setTimeout` that clears the timeout. Standard React cleanup pattern. |
| R-6 | The `navigator.onLine` API is unreliable on some mobile browsers (returns `true` even when effectively offline behind a captive portal or with no data connection). | Medium | Low | Known limitation. The `useApiHealth` hook uses `navigator.onLine` as the primary offline signal but also checks `dataUpdatedAt` staleness as a secondary signal. If `navigator.onLine` is `true` but data has not refreshed in >3 minutes, the status degrades to `'degraded'`, which is a reasonable approximation. WS-B.3's `useDataFreshness` hook (if available) may provide a more robust signal; consider consuming it instead of reimplementing. |

---

## Appendix A: Store Diff Summary

Changes to `src/stores/settings.store.ts`:

```diff
 interface SettingsState {
   // ... existing fields ...
+
+  /** Idle lock timeout in minutes. 0 = never auto-lock.
+   *  Options: 1, 5, 15, 0.
+   *  Read by useIdleLock hook (WS-F.4) to trigger session lock after inactivity.
+   *  @see protective-ops-review C5 */
+  idleLockTimeoutMinutes: number
 }

 interface SettingsActions {
   // ... existing actions ...
+
+  /** Set the idle lock timeout in minutes. 0 = never. */
+  setIdleLockTimeout: (minutes: number) => void
 }

 const DEFAULT_SETTINGS: SettingsState = {
   // ... existing defaults ...
+  idleLockTimeoutMinutes: 5,
 }

 // In the store implementation:
+      setIdleLockTimeout: (minutes) =>
+        set((state) => {
+          state.idleLockTimeoutMinutes = minutes
+        }),

 // In partialize:
       partialize: (state) => ({
         // ... existing fields ...
+        idleLockTimeoutMinutes: state.idleLockTimeoutMinutes,
       }),

 // In selectors:
 export const settingsSelectors = {
   // ... existing selectors ...
+
+  /** Current idle lock timeout in minutes. 0 = never. */
+  idleLockTimeoutMinutes: (state: SettingsStore): number =>
+    state.idleLockTimeoutMinutes,
 } as const
```

## Appendix B: File Inventory

| File | Action | Estimated Lines |
|------|--------|-----------------|
| `src/components/mobile/MobileSettings.tsx` | NEW | ~220 |
| `src/hooks/use-api-health.ts` | NEW | ~45 |
| `src/styles/mobile-settings.css` | NEW | ~180 |
| `src/stores/settings.store.ts` | MODIFY | +25 lines (state, action, default, partialize, selector) |
| `src/views/MobileView.tsx` (or `MobileShell.tsx`) | MODIFY | +15 lines (settings state, handlers, render) |
| `src/stores/__tests__/settings.store.test.ts` | NEW or EXTEND | ~30 |
| `src/hooks/__tests__/use-api-health.test.ts` | NEW | ~50 |
| `src/components/mobile/__tests__/MobileSettings.test.tsx` | NEW | ~150 |

**Total new code:** ~500 lines (component + hook + CSS)
**Total test code:** ~230 lines
**Total modifications:** ~40 lines across 2 existing files
