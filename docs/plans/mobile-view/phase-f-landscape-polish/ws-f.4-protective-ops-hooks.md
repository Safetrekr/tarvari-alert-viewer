# WS-F.4: Protective Ops Hooks

> **Workstream ID:** WS-F.4
> **Phase:** F -- Landscape + Polish
> **Assigned Agent:** `world-class-ux-designer`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-B.1 (MobileP1Banner with `onTapP1` callback, `MobileThreatIndicator`, `derivePosture` utility in `src/lib/threat-utils.ts`), WS-B.3 (`useDataFreshness` hook returning `DataFreshnessState`, `DataStaleBanner` component at MobileShell level, `ConnectivityDot` component), WS-E.3 (cross-tab navigation handlers `navigateToCategory`, `navigateToMap` defined in `MobileView`, URL deep link utilities `syncMobileUrlParams`), WS-C.5 (settings store extension: `idleLockTimeoutMinutes` field, `setIdleLockTimeout` action, `audioNotificationsEnabled` toggle, `MobileSettings` component with auto-lock timeout selector and P1 sound toggle)
> **Blocks:** None (final phase)
> **Resolves:** OVERVIEW tasks 6.16 (session auto-lock), 6.17 (audible P1 notification), protective-ops-review C5 (session auto-lock configuration), protective-ops-review C6 (audible/haptic P1 notification)

---

## Review Fixes Applied

**H-1:** Removed fabricated line 103 reference for `idleLockTimeoutMinutes` in Section 3 Input Dependencies. Field is pending WS-C.5.

**H-2:** Added DM-8 explicitly documenting the audio deduplication strategy between `useP1AudioAlert` and `useNotificationDispatch`.

---

## 1. Objective

Deliver three protective operations hooks and their integration wiring that elevate the mobile view from a passive monitoring dashboard to an operationally aware field tool. Together, these hooks address the two remaining CRITICAL items from the protective-ops-review (C5: session auto-lock, C6: audible P1 notification) and enhance the data freshness system built in WS-B.3 with mobile-specific degradation behaviors.

The three hooks are:

1. **`useIdleLock`** -- Monitors user activity via pointer and keyboard events. After a configurable idle period (read from `settings.store.idleLockTimeoutMinutes`, default 5 minutes), renders a full-screen lock overlay that requires the passphrase to dismiss. Prevents unauthorized access to intelligence data when a device is left unattended.

2. **`useP1AudioAlert`** -- Detects new P1 (FLASH) alert arrivals by comparing the current `mostRecentP1.id` against a previous-value ref. When a new P1 appears and `settings.store.audioNotificationsEnabled` is true, plays an alert tone via the Web Audio API and optionally triggers device vibration via `Navigator.vibrate`. Gated by a user-interaction requirement (Web Audio API autoplay policy) with a custom consent fallback.

3. **`useDataFreshnessMobile`** -- Extends WS-B.3's `useDataFreshness` hook with mobile-specific behaviors: reduces polling frequency on the priority feed when data is stale (battery conservation), applies a visual degradation class to the root element for CSS-driven opacity reduction, and logs staleness transitions to the console for field debugging.

Additionally, this workstream wires the P1 banner's "View Alert" action through WS-E.3's cross-tab handlers so that tapping a P1 banner navigates to the alert detail via the Situation tab's category drill-down, completing the P1 alert response flow end-to-end.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `useIdleLock` hook | New hook at `src/hooks/use-idle-lock.ts`. Monitors `pointermove`, `pointerdown`, `keydown` on `document`. Reads `idleLockTimeoutMinutes` from settings store. Fires a lock callback after timeout. Resets timer on any activity event. Respects `idleLockTimeoutMinutes === 0` (never lock). |
| `MobileIdleLockOverlay` component | New component at `src/components/mobile/MobileIdleLockOverlay.tsx`. Full-viewport z-50 overlay with passphrase input. Renders only when `isLocked` is true. Blocks all interaction with the underlying app. Includes Tarva logo, "SESSION LOCKED" heading, passphrase input, unlock button, and session elapsed time. |
| `useP1AudioAlert` hook | New hook at `src/hooks/use-p1-audio-alert.ts`. Monitors `usePriorityFeed().data.mostRecentP1.id` for changes. Plays alert tone via Web Audio API `AudioContext`. Triggers `navigator.vibrate([200, 100, 200])` pattern. Respects `audioNotificationsEnabled` from settings store. Handles autoplay policy with a deferred-play pattern. |
| `useDataFreshnessMobile` hook | New hook at `src/hooks/use-data-freshness-mobile.ts`. Wraps `useDataFreshness()` from WS-B.3. Adds a `data-freshness` attribute to `document.documentElement` for CSS-driven visual degradation. Logs staleness transitions. Provides an `isRecovering` flag for UI feedback when transitioning from stale/offline back to fresh. |
| P1 banner "View Alert" wiring | Modification to `MobileView.tsx`: thread `navigateToCategory` through the P1 banner's `onTapP1` callback so that tapping a P1 alert navigates to the alert's category detail with the alert pre-selected. |
| CSS for idle lock overlay and data freshness degradation | `src/styles/mobile-protective-ops.css` with lock overlay layout, passphrase input styling, and `[data-freshness="stale"]` / `[data-freshness="offline"]` degradation rules. |
| Integration in `MobileView` | Wire all three hooks into `MobileView.tsx`. Render `MobileIdleLockOverlay` conditionally. |
| Unit tests | Tests for idle timer logic, P1 alert change detection, data freshness attribute application, and lock overlay unlock flow. |
| Reduced motion compliance | Lock overlay entrance animation respects `prefers-reduced-motion`. |
| Accessibility | Lock overlay traps focus, announces "Session locked" via `aria-live`, passphrase input has visible label and associated error messages. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Settings store field `idleLockTimeoutMinutes` | WS-C.5 delivers the store field, action, selector, and persistence. This WS reads it. |
| Settings store field `audioNotificationsEnabled` | WS-C.5 delivers the toggle. This WS reads it. |
| `MobileSettings` component UI for auto-lock selector and P1 sound toggle | WS-C.5 delivers the UI controls. This WS implements the runtime behavior they configure. |
| `DataStaleBanner` component rendering | WS-B.3 delivers the banner. This WS enhances the underlying hook and adds CSS-level degradation. |
| `ConnectivityDot` in MobileHeader | WS-B.3 delivers the dot. This WS does not modify it. |
| Desktop idle lock or audio alert | These hooks are mobile-only. Desktop has no idle lock requirement and audio is handled by `use-notification-dispatch.ts`. |
| Push notifications / background audio | Client decision Q3 defers push. Audio plays only when the app is in the foreground. |
| Server-side session revocation | Acknowledged gap in protective-ops-review Section 3.3. Requires backend changes beyond this workstream. |
| Pull-to-refresh for stale data recovery | WS-F.5 scope. |
| `MobileP1Banner` component internals | WS-B.1 scope. This WS passes a callback prop that WS-B.1's component calls. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/stores/settings.store.ts` | `idleLockTimeoutMinutes: number` state field (default 5), to be added by WS-C.5 D-1. Selector name TBD (verify against WS-C.5 deliverable). | Pending (WS-C.5 D-1 adds this field) |
| `src/stores/settings.store.ts` (line 55-56) | `audioNotificationsEnabled: boolean` state field. Selector: `settingsSelectors.isAudioNotificationsEnabled`. | EXISTS (line 56, default `false`) |
| `src/stores/auth.store.ts` (lines 38-79) | `useAuthStore` with `login(passphrase): boolean` action for unlock verification, `logout()` action for lock-then-logout flow, `authenticated` state. | EXISTS |
| `src/hooks/use-priority-feed.ts` (lines 59-72, 148-156) | `usePriorityFeed()` returning `UseQueryResult<PriorityFeedSummary>` with `data.mostRecentP1: PriorityFeedItem \| null`, `data.p1Count`, `data.items`. `PriorityFeedItem` has `id`, `title`, `severity`, `category`, `operationalPriority`, `ingestedAt` fields. Polls every 15s. | EXISTS |
| `src/hooks/use-data-freshness.ts` | `useDataFreshness()` returning `DataFreshnessResult` with `state: DataFreshnessState`, `isOnline`, `isStale`, `oldestUpdateAt`, `staleSince`. `DataFreshnessState = 'fresh' \| 'stale' \| 'offline'`. `STALENESS_THRESHOLD_MS = 180_000`. | Pending (WS-B.3 D-1) |
| `src/lib/notifications/notification-sound.ts` | `playNotificationSound()` function using HTML Audio API. Volume 0.3, loads `/sounds/alert-tone.mp3`. | EXISTS (33 lines) |
| `src/hooks/use-notification-dispatch.ts` | `useNotificationDispatch()` with `notify(alert)` callback. Already calls `playNotificationSound()` for P1 alerts when `audioNotificationsEnabled` is true. | EXISTS (93 lines) -- see DM-2 for deduplication strategy |
| WS-B.1: `MobileP1Banner` | Component with `onTapP1: (alertId: string, category: string) => void` callback prop. Renders when `p1Count > 0`. Persists until tapped or superseded. | Pending (WS-B.1) |
| WS-B.1: `MobileThreatBanner` | Component that surfaces P1 alert data. The `mostRecentP1` from `usePriorityFeed()` populates the banner text. | Pending (WS-B.1) |
| WS-E.3: `navigateToCategory` handler | Handler defined in `MobileView`: `(categoryId: string) => void`. Resets morph, clears selection, switches to Situation tab, starts fast morph to category. | Pending (WS-E.3 uses WS-D.3 patterns) |
| WS-E.3: `syncMobileUrlParams` utility | URL sync utility for `?tab=`, `?category=`, `?alert=` parameters. | Pending (WS-E.3 D-5) |
| WS-A.2: `MobileShell` | Shell component with z-index layering. Lock overlay must render above all content at z-50. | Pending (WS-A.2) |
| WS-A.3: `mobile-tokens.css` | Glass tokens (`--glass-card-bg`, `--glass-card-blur`), spacing tokens (`--space-content-padding`), typography tokens (`--text-body`, `--text-label`, `--text-caption`), touch target token (`--touch-target-comfortable`). | Pending (WS-A.3) |
| `src/styles/spatial-tokens.css` | `--color-void` (`#050911`), `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-border-subtle`, `--font-mono`, `--duration-fast`, `--ease-default`, `--glow-error`. | EXISTS |
| `lucide-react` | `Lock`, `Unlock`, `ShieldAlert`, `Volume2`, `VolumeX`, `WifiOff`, `Eye`, `EyeOff` | Available via existing dependency |

---

## 4. Deliverables

### D-1: `useIdleLock` hook (`src/hooks/use-idle-lock.ts`)

A React hook that monitors user activity and triggers a session lock after a configurable idle timeout. The hook manages the timer lifecycle, activity detection, and lock state.

**Exported types:**

```typescript
/**
 * Idle lock state returned by useIdleLock.
 */
export interface IdleLockState {
  /** Whether the session is currently locked. */
  isLocked: boolean
  /** Lock the session immediately (e.g., from a manual "Lock" button). */
  lockNow: () => void
  /** Attempt to unlock with a passphrase. Returns true if successful. */
  unlock: (passphrase: string) => boolean
  /** Seconds remaining until auto-lock. Null when timeout is disabled (0). */
  secondsUntilLock: number | null
  /** Whether the idle lock feature is enabled (timeout > 0). */
  isEnabled: boolean
}
```

**Algorithm:**

```
1. Read `idleLockTimeoutMinutes` from settings store.
   - If 0 ("never"), return { isLocked: false, isEnabled: false, ... } immediately.

2. Convert to milliseconds: timeoutMs = idleLockTimeoutMinutes * 60_000.

3. Maintain state:
   - isLocked: boolean (useState, default false)
   - lastActivityAt: useRef<number>(Date.now())
   - timerRef: useRef<ReturnType<typeof setTimeout> | null>(null)
   - countdownRef: useRef<ReturnType<typeof setInterval> | null>(null)
   - secondsUntilLock: useState<number | null>(null)

4. Activity detection:
   - Listen for 'pointermove', 'pointerdown', 'keydown' on document.
   - On any event: reset lastActivityAt to Date.now(), clear existing timer,
     start a new setTimeout(lock, timeoutMs).
   - Throttle the event handler to 1 call per 1000ms to avoid excessive
     timer resets during continuous pointer movement.

5. Lock action:
   - Set isLocked = true.
   - Clear the idle timer.
   - Clear the countdown interval.

6. Countdown display:
   - Start a setInterval(1000ms) that computes:
     elapsed = Date.now() - lastActivityAt
     remaining = Math.max(0, timeoutMs - elapsed)
     secondsUntilLock = Math.ceil(remaining / 1000)
   - Only run when the remaining time drops below 60 seconds
     (to avoid unnecessary re-renders during active use).

7. Unlock action:
   - Accept a passphrase string.
   - Call useAuthStore.getState().login(passphrase).
   - If login returns true: set isLocked = false, reset lastActivityAt,
     restart the idle timer. Return true.
   - If login returns false: return false (component shows error).

8. lockNow action:
   - Immediately set isLocked = true. Used by a manual "Lock" button
     in Settings or a keyboard shortcut.

9. Cleanup:
   - On unmount: clear timeout, clear interval, remove event listeners.
   - On idleLockTimeoutMinutes change: clear old timer, start new timer
     with updated timeout (useEffect dependency on timeout value).

10. Visibility change handling:
    - Listen for document 'visibilitychange'.
    - When document becomes hidden: record the time.
    - When document becomes visible: compute elapsed time while hidden.
      If elapsed > timeoutMs, lock immediately (the user was away from the tab).
```

**Throttle implementation:**

```typescript
// Inline throttle to avoid external dependency
function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let lastCall = 0
  return ((...args: unknown[]) => {
    const now = Date.now()
    if (now - lastCall >= ms) {
      lastCall = now
      fn(...args)
    }
  }) as T
}
```

**Event listener registration:**

```typescript
useEffect(() => {
  if (!isEnabled) return

  const resetTimer = throttle(() => {
    lastActivityRef.current = Date.now()
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!isLocked) {
      timerRef.current = setTimeout(() => {
        setIsLocked(true)
      }, timeoutMs)
    }
  }, 1000)

  const events = ['pointermove', 'pointerdown', 'keydown'] as const
  events.forEach((evt) => document.addEventListener(evt, resetTimer, { passive: true }))

  // Start the initial timer
  timerRef.current = setTimeout(() => {
    setIsLocked(true)
  }, timeoutMs)

  return () => {
    events.forEach((evt) => document.removeEventListener(evt, resetTimer))
    if (timerRef.current) clearTimeout(timerRef.current)
  }
}, [isEnabled, timeoutMs, isLocked])
```

**Visibility change handler:**

```typescript
useEffect(() => {
  if (!isEnabled) return

  let hiddenAt: number | null = null

  const handleVisibilityChange = () => {
    if (document.hidden) {
      hiddenAt = Date.now()
    } else if (hiddenAt !== null) {
      const elapsed = Date.now() - hiddenAt
      hiddenAt = null
      if (elapsed >= timeoutMs) {
        setIsLocked(true)
      } else {
        // Recalculate remaining time and restart timer
        const sinceLastActivity = Date.now() - lastActivityRef.current
        const remaining = timeoutMs - sinceLastActivity
        if (remaining <= 0) {
          setIsLocked(true)
        } else {
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => setIsLocked(true), remaining)
        }
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [isEnabled, timeoutMs])
```

**File location:** `src/hooks/use-idle-lock.ts`

**Estimated size:** ~120 lines.

---

### D-2: `MobileIdleLockOverlay` component (`src/components/mobile/MobileIdleLockOverlay.tsx`)

A full-viewport overlay that blocks all interaction when the session is locked. Requires the passphrase to dismiss.

**Props interface:**

```typescript
interface MobileIdleLockOverlayProps {
  /** Whether the lock overlay is visible. */
  isLocked: boolean
  /** Callback to attempt unlock. Returns true if passphrase is correct. */
  onUnlock: (passphrase: string) => boolean
}
```

**Visual layout:**

```
+------------------------------------------+
|                                          |  z-50, full viewport
|                                          |  Background: var(--color-void)
|                                          |  opacity: 0.98
|                                          |
|              [lock icon]                 |  Lock icon, 48px
|                                          |
|          SESSION LOCKED                  |  Heading, --text-label, uppercase
|                                          |  letter-spacing: 0.14em
|                                          |
|   Enter passphrase to resume session     |  Body text, --text-caption
|                                          |  opacity: 0.45
|                                          |
|   +----------------------------------+   |
|   |  [eye]  ************************ |   |  Passphrase input
|   +----------------------------------+   |  48px height (touch target)
|                                          |  Monospace, centered text
|                                          |
|          [UNLOCK SESSION]                |  Button, 48px height
|                                          |  Full width - content padding
|                                          |
|   Incorrect passphrase.                  |  Error text (conditional)
|                                          |  color: var(--glow-error)
|                                          |  aria-live="polite"
|                                          |
|                                          |
|          Session active 2h 14m           |  Session duration
|                                          |  opacity: 0.30, --text-ghost
+------------------------------------------+
```

**Component structure:**

```typescript
'use client'

import { useState, useRef, useEffect } from 'react'
import { Lock, Eye, EyeOff } from 'lucide-react'
import '@/styles/mobile-protective-ops.css'

export function MobileIdleLockOverlay({ isLocked, onUnlock }: MobileIdleLockOverlayProps) {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState(false)
  const [showPassphrase, setShowPassphrase] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when overlay appears
  useEffect(() => {
    if (isLocked) {
      // Small delay to allow animation to start
      const id = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(id)
    }
    // Reset state when unlocked
    setPassphrase('')
    setError(false)
    setShowPassphrase(false)
  }, [isLocked])

  if (!isLocked) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const success = onUnlock(passphrase)
    if (!success) {
      setError(true)
      setPassphrase('')
      inputRef.current?.focus()
      // Clear error after 3 seconds
      setTimeout(() => setError(false), 3000)
    }
  }

  return (
    <div
      className="mobile-idle-lock-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-label="Session locked. Enter passphrase to unlock."
    >
      <form className="mobile-idle-lock-content" onSubmit={handleSubmit}>
        <Lock size={48} className="mobile-idle-lock-icon" aria-hidden="true" />
        <h2 className="mobile-idle-lock-heading">SESSION LOCKED</h2>
        <p className="mobile-idle-lock-body">Enter passphrase to resume session</p>
        <div className="mobile-idle-lock-input-wrapper">
          <button
            type="button"
            className="mobile-idle-lock-visibility-toggle"
            onClick={() => setShowPassphrase((v) => !v)}
            aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
          >
            {showPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <input
            ref={inputRef}
            type={showPassphrase ? 'text' : 'password'}
            className="mobile-idle-lock-input"
            value={passphrase}
            onChange={(e) => { setPassphrase(e.target.value); setError(false) }}
            placeholder="Passphrase"
            autoComplete="off"
            aria-label="Passphrase"
            aria-invalid={error}
            aria-describedby={error ? 'idle-lock-error' : undefined}
          />
        </div>
        <button
          type="submit"
          className="mobile-idle-lock-submit"
          disabled={passphrase.length === 0}
        >
          UNLOCK SESSION
        </button>
        {error && (
          <p id="idle-lock-error" className="mobile-idle-lock-error" aria-live="polite" role="alert">
            Incorrect passphrase.
          </p>
        )}
      </form>
    </div>
  )
}
```

**Focus trapping:** The overlay uses `role="alertdialog"` with `aria-modal="true"`. The form contains only the input, visibility toggle, and submit button -- a natural tab order. Since the overlay covers the entire viewport at z-50, no additional focus trap library is needed. The underlying content is inert because the overlay intercepts all pointer events and the form captures keyboard focus. If the browser supports the `inert` attribute (Chrome 102+, Safari 15.5+, Firefox 112+), add `inert` to the `MobileShell` root element when locked.

**File location:** `src/components/mobile/MobileIdleLockOverlay.tsx`

**Estimated size:** ~90 lines.

---

### D-3: `useP1AudioAlert` hook (`src/hooks/use-p1-audio-alert.ts`)

A React hook that detects new P1 alert arrivals and plays an audible notification tone with optional haptic feedback.

**Exported types:**

```typescript
/**
 * P1 audio alert state.
 */
export interface P1AudioAlertState {
  /** Whether audio alerts are currently active (enabled + permitted). */
  isActive: boolean
  /** Whether the Web Audio API has been unlocked by user interaction. */
  isAudioUnlocked: boolean
  /** Manually unlock audio (call on first user interaction if autoplay blocked). */
  unlockAudio: () => void
  /** The ID of the last P1 alert that triggered audio. Null if none. */
  lastAlertedP1Id: string | null
}
```

**Algorithm:**

```
1. Read audioNotificationsEnabled from settings store.
   If false, return early with isActive: false.

2. Maintain refs:
   - previousP1IdRef: useRef<string | null>(null)
   - audioContextRef: useRef<AudioContext | null>(null)
   - audioBufferRef: useRef<AudioBuffer | null>(null)
   - isUnlockedRef: useRef<boolean>(false)
   - lastAlertedP1Id: useState<string | null>(null)

3. Audio initialization (lazy, on first user interaction):
   - Create an AudioContext on first call to unlockAudio().
   - Fetch and decode /sounds/alert-tone.mp3 into an AudioBuffer.
   - Set isUnlockedRef.current = true.
   - The unlockAudio() function is exposed so MobileView can call it
     on the first pointerdown event after mount.

4. Monitor mostRecentP1 changes:
   - useEffect with dependency on priorityFeed.data?.mostRecentP1?.id.
   - On each change:
     a. If previousP1IdRef.current is null (first load), store the ID
        without triggering audio. This prevents a false alert on page load.
     b. If the new ID differs from previousP1IdRef.current and is not null:
        - Play the alert tone via Web Audio API.
        - Trigger navigator.vibrate([200, 100, 200]) if available.
        - Update lastAlertedP1Id state.
     c. Update previousP1IdRef.current to the new ID.

5. Play function:
   - If AudioContext is not created or not unlocked, fall back to
     playNotificationSound() from notification-sound.ts (HTML Audio API).
   - If AudioContext exists and is unlocked:
     a. Resume the AudioContext if suspended (autoplay policy).
     b. Create a BufferSource, connect to destination, start().
   - Vibration: navigator.vibrate?.([200, 100, 200])
     Pattern: 200ms vibrate, 100ms pause, 200ms vibrate.
     Silently no-ops on iOS Safari (WebKit does not support Vibration API).

6. Deduplication with use-notification-dispatch.ts:
   - The existing useNotificationDispatch().notify() also calls
     playNotificationSound() for P1 alerts (line 83-85).
   - This hook replaces that audio path for mobile. The integration
     in MobileView should NOT wire useNotificationDispatch for audio
     when useP1AudioAlert is active. See DM-2 for deduplication strategy.
```

**Web Audio API implementation:**

```typescript
async function initAudio(contextRef: React.MutableRefObject<AudioContext | null>,
                         bufferRef: React.MutableRefObject<AudioBuffer | null>) {
  if (contextRef.current) return

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioCtx) return

  const ctx = new AudioCtx()
  contextRef.current = ctx

  try {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
    const response = await fetch(`${basePath}/sounds/alert-tone.mp3`)
    const arrayBuffer = await response.arrayBuffer()
    bufferRef.current = await ctx.decodeAudioData(arrayBuffer)
  } catch {
    // Audio file failed to load. Fall back to HTML Audio API.
    contextRef.current = null
  }
}

function playTone(ctx: AudioContext, buffer: AudioBuffer) {
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Gain node for volume control (0.3 matches notification-sound.ts)
  const gain = ctx.createGain()
  gain.gain.value = 0.3
  source.connect(gain)
  gain.connect(ctx.destination)

  source.start()
}
```

**Vibration pattern rationale:** The `[200, 100, 200]` pattern (vibrate-pause-vibrate) is a standard "alert" pattern distinguishable from a single short buzz (notification) or a long continuous buzz (phone call). The total duration of 500ms is noticeable without being startling. The double-pulse pattern conveys urgency while remaining within the acceptable range for professional environments.

**File location:** `src/hooks/use-p1-audio-alert.ts`

**Estimated size:** ~100 lines.

---

### D-4: `useDataFreshnessMobile` hook (`src/hooks/use-data-freshness-mobile.ts`)

A thin wrapper around WS-B.3's `useDataFreshness` that adds mobile-specific behaviors: DOM attribute for CSS-driven visual degradation, staleness transition logging, and a recovery transition flag.

**Exported types:**

```typescript
import type { DataFreshnessResult } from '@/hooks/use-data-freshness'

export interface DataFreshnessMobileResult extends DataFreshnessResult {
  /** True during the 3-second window after transitioning from stale/offline to fresh. */
  isRecovering: boolean
}
```

**Implementation:**

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'
import { useDataFreshness, type DataFreshnessState } from '@/hooks/use-data-freshness'

const RECOVERY_DURATION_MS = 3_000

export function useDataFreshnessMobile(): DataFreshnessMobileResult {
  const freshness = useDataFreshness()
  const previousStateRef = useRef<DataFreshnessState>(freshness.state)
  const [isRecovering, setIsRecovering] = useState(false)
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 1. Apply data-freshness attribute to document root for CSS degradation
  useEffect(() => {
    document.documentElement.setAttribute('data-freshness', freshness.state)
    return () => {
      document.documentElement.removeAttribute('data-freshness')
    }
  }, [freshness.state])

  // 2. Log staleness transitions for field debugging
  useEffect(() => {
    const prev = previousStateRef.current
    if (prev !== freshness.state) {
      const timestamp = new Date().toISOString()
      if (freshness.state === 'stale') {
        console.warn(
          `[protective-ops] Data freshness degraded: ${prev} -> stale (oldest update: ${freshness.staleSince}) at ${timestamp}`
        )
      } else if (freshness.state === 'offline') {
        console.warn(
          `[protective-ops] Connection lost: ${prev} -> offline at ${timestamp}`
        )
      } else if (freshness.state === 'fresh' && (prev === 'stale' || prev === 'offline')) {
        console.info(
          `[protective-ops] Data freshness recovered: ${prev} -> fresh at ${timestamp}`
        )
        // 3. Set recovery flag for 3 seconds
        setIsRecovering(true)
        if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current)
        recoveryTimerRef.current = setTimeout(() => setIsRecovering(false), RECOVERY_DURATION_MS)
      }
      previousStateRef.current = freshness.state
    }
  }, [freshness.state, freshness.staleSince])

  // Cleanup recovery timer on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current)
    }
  }, [])

  return {
    ...freshness,
    isRecovering,
  }
}
```

**CSS degradation rules** (in D-6):

When `data-freshness="stale"` is set on `<html>`, category cards and metric displays receive a subtle desaturation and opacity reduction, visually communicating that the displayed data may be outdated. When `data-freshness="offline"`, the degradation is more pronounced.

This approach avoids per-component prop drilling for staleness state. Any component that needs to respond to data freshness can use CSS selectors against the root attribute.

**File location:** `src/hooks/use-data-freshness-mobile.ts`

**Estimated size:** ~60 lines.

---

### D-5: P1 banner "View Alert" cross-tab wiring (`src/components/mobile/MobileView.tsx` -- modified)

Wire the P1 banner's `onTapP1` callback to navigate to the alert's category detail with the alert pre-selected. This completes the P1 alert response flow: alert arrives -> banner appears -> operator taps banner -> category detail opens with the specific alert highlighted.

**Handler implementation:**

```typescript
/**
 * Handle P1 banner tap: navigate to the alert's category, pre-select the alert.
 *
 * Uses navigateToCategory from WS-E.3 for tab switching and morph,
 * then sets the pre-selected alert ID in coverage store so WS-D.1's
 * category detail auto-scrolls to the alert.
 */
const handleP1BannerTap = useCallback((alertId: string, category: string) => {
  // 1. Navigate to the category (handles tab switch, morph start)
  navigateToCategory(category)

  // 2. Pre-select the alert for auto-scroll in category detail
  useCoverageStore.getState().setDistrictPreselectedAlertId(alertId)

  // 3. Update URL for deep link support
  syncMobileUrlParams({ tab: 'situation', category, alert: alertId })
}, [navigateToCategory])
```

**Integration with MobileP1Banner:**

```tsx
<MobileP1Banner
  priorityFeed={priorityFeed.data}
  onTapP1={handleP1BannerTap}
/>
```

The `MobileP1Banner` component (WS-B.1) accepts `onTapP1: (alertId: string, category: string) => void`. When the operator taps the banner, it calls this callback with the `mostRecentP1.id` and `mostRecentP1.category` values.

**Estimated modification size:** ~20 lines added to `MobileView.tsx`.

---

### D-6: CSS file (`src/styles/mobile-protective-ops.css`)

Dedicated CSS file for the idle lock overlay and data freshness degradation rules.

```css
/* ================================================================
   Mobile Protective Ops
   Phase F -- WS-F.4
   ================================================================ */

/* ----- Idle Lock Overlay ----- */

.mobile-idle-lock-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 9, 17, 0.98);
  animation: idle-lock-fade-in 300ms var(--ease-default, cubic-bezier(0.4, 0, 0.2, 1)) both;
}

@keyframes idle-lock-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.mobile-idle-lock-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: var(--space-content-padding, 12px);
  width: 100%;
  max-width: 320px;
}

.mobile-idle-lock-icon {
  color: var(--color-text-tertiary);
  opacity: 0.5;
  margin-bottom: 8px;
}

.mobile-idle-lock-heading {
  font-family: var(--font-mono);
  font-size: var(--text-label, 11px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-text-primary);
  margin: 0;
}

.mobile-idle-lock-body {
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  color: var(--color-text-tertiary);
  opacity: 0.45;
  text-align: center;
  margin: 0;
}

.mobile-idle-lock-input-wrapper {
  position: relative;
  width: 100%;
}

.mobile-idle-lock-visibility-toggle {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  opacity: 0.40;
  padding: 4px;
  cursor: pointer;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-idle-lock-visibility-toggle:focus-visible {
  outline: 2px solid var(--color-ember-bright, #ff773c);
  outline-offset: 2px;
  border-radius: 4px;
}

.mobile-idle-lock-input {
  width: 100%;
  height: 48px;
  padding: 0 16px 0 40px;
  font-family: var(--font-mono);
  font-size: var(--text-body, 13px);
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  outline: none;
  text-align: center;
  letter-spacing: 0.1em;
  -webkit-tap-highlight-color: transparent;
}

.mobile-idle-lock-input:focus {
  border-color: rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
}

.mobile-idle-lock-input[aria-invalid='true'] {
  border-color: var(--glow-error, rgba(239, 68, 68, 0.4));
}

.mobile-idle-lock-submit {
  width: 100%;
  height: 48px;
  font-family: var(--font-mono);
  font-size: var(--text-label, 11px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background var(--duration-fast, 100ms) var(--ease-default);
}

.mobile-idle-lock-submit:active {
  background: rgba(255, 255, 255, 0.10);
}

.mobile-idle-lock-submit:disabled {
  opacity: 0.30;
  cursor: default;
}

.mobile-idle-lock-submit:focus-visible {
  outline: 2px solid var(--color-ember-bright, #ff773c);
  outline-offset: 2px;
}

.mobile-idle-lock-error {
  font-family: var(--font-mono);
  font-size: var(--text-caption, 10px);
  color: var(--glow-error, rgba(239, 68, 68, 0.8));
  margin: 0;
  min-height: 16px;
}

.mobile-idle-lock-session-info {
  font-family: var(--font-mono);
  font-size: var(--text-ghost, 10px);
  color: var(--color-text-tertiary);
  opacity: 0.30;
  margin-top: 24px;
}

/* ----- Data Freshness Degradation (CSS-driven via root attribute) ----- */

/* Stale data: subtle desaturation + opacity reduction on data-bearing elements */
[data-freshness='stale'] .mobile-category-card,
[data-freshness='stale'] .mobile-card-alert-count,
[data-freshness='stale'] .mobile-threat-banner {
  filter: saturate(0.7);
  opacity: 0.85;
  transition: filter 1s ease, opacity 1s ease;
}

/* Offline: more pronounced degradation */
[data-freshness='offline'] .mobile-category-card,
[data-freshness='offline'] .mobile-card-alert-count,
[data-freshness='offline'] .mobile-threat-banner {
  filter: saturate(0.4) brightness(0.9);
  opacity: 0.70;
  transition: filter 1s ease, opacity 1s ease;
}

/* Recovery transition: brief glow when data becomes fresh again */
[data-freshness='fresh'] .mobile-category-card,
[data-freshness='fresh'] .mobile-card-alert-count,
[data-freshness='fresh'] .mobile-threat-banner {
  filter: saturate(1) brightness(1);
  opacity: 1;
  transition: filter 0.5s ease, opacity 0.5s ease;
}

/* ----- Reduced Motion ----- */

@media (prefers-reduced-motion: reduce) {
  .mobile-idle-lock-overlay {
    animation: none;
  }

  [data-freshness='stale'] .mobile-category-card,
  [data-freshness='stale'] .mobile-card-alert-count,
  [data-freshness='stale'] .mobile-threat-banner,
  [data-freshness='offline'] .mobile-category-card,
  [data-freshness='offline'] .mobile-card-alert-count,
  [data-freshness='offline'] .mobile-threat-banner,
  [data-freshness='fresh'] .mobile-category-card,
  [data-freshness='fresh'] .mobile-card-alert-count,
  [data-freshness='fresh'] .mobile-threat-banner {
    transition: none;
  }
}
```

**File location:** `src/styles/mobile-protective-ops.css`

**Import:** Added as the first import in `MobileIdleLockOverlay.tsx`:

```typescript
import '@/styles/mobile-protective-ops.css'
```

The data freshness degradation rules are global (they target root `[data-freshness]` attribute selectors) and apply to any page that includes this CSS file. The import in `MobileIdleLockOverlay` ensures the CSS is loaded when the mobile view is active. Alternatively, the import can be placed in `MobileView.tsx` for clarity.

---

### D-7: Integration in `MobileView.tsx` (modified)

Wire all three hooks and the lock overlay into the main mobile orchestrator.

**Hook instantiation:**

```typescript
// Protective ops hooks (WS-F.4)
const idleLock = useIdleLock()
const p1Audio = useP1AudioAlert()
const freshnessMobile = useDataFreshnessMobile()
```

**Web Audio unlock on first interaction:**

The Web Audio API requires a user interaction (click, tap, keypress) before audio can play. Wire the audio unlock to the first `pointerdown` event on the mobile view.

```typescript
const hasUnlockedAudioRef = useRef(false)

useEffect(() => {
  if (hasUnlockedAudioRef.current) return

  const handleFirstInteraction = () => {
    p1Audio.unlockAudio()
    hasUnlockedAudioRef.current = true
    document.removeEventListener('pointerdown', handleFirstInteraction)
  }

  document.addEventListener('pointerdown', handleFirstInteraction, { once: true })
  return () => document.removeEventListener('pointerdown', handleFirstInteraction)
}, [p1Audio])
```

**Lock overlay rendering:**

```tsx
{/* Idle lock overlay -- renders above all content at z-50 */}
<MobileIdleLockOverlay
  isLocked={idleLock.isLocked}
  onUnlock={idleLock.unlock}
/>
```

The overlay is rendered as the last child of the `MobileView` return, ensuring it appears above all other content via z-index.

**P1 banner wiring (from D-5):**

```tsx
<MobileP1Banner
  priorityFeed={priorityFeed.data}
  onTapP1={handleP1BannerTap}
/>
```

**Estimated modification size:** ~40 lines added to `MobileView.tsx`.

---

### D-8: Unit tests

#### D-8a: `useIdleLock` hook tests (`src/__tests__/hooks/use-idle-lock.test.ts`)

```typescript
/**
 * Tests for useIdleLock hook.
 * @see WS-F.4 D-1
 */

// T-1: Returns isLocked=false and isEnabled=false when timeout is 0 (never lock).
// T-2: Starts idle timer on mount. After timeoutMs elapses without activity, isLocked becomes true.
// T-3: Pointer events (pointermove, pointerdown) reset the idle timer.
// T-4: Keyboard events (keydown) reset the idle timer.
// T-5: lockNow() immediately sets isLocked=true regardless of timer state.
// T-6: unlock() with correct passphrase sets isLocked=false and restarts timer.
// T-7: unlock() with incorrect passphrase returns false and keeps isLocked=true.
// T-8: Changing idleLockTimeoutMinutes in settings store restarts the timer with the new duration.
// T-9: Visibility change: if document was hidden longer than timeout, lock on return.
// T-10: Visibility change: if document was hidden shorter than timeout, recalculate remaining time.
// T-11: Activity events are throttled to 1 per second (verify timer is not reset on every pixel of pointer movement).
// T-12: Cleanup: event listeners and timers are removed on unmount.
```

**Test utilities:** Use `vi.useFakeTimers()` for timer control. Mock `document.addEventListener` to verify event registration. Mock `useSettingsStore` to control `idleLockTimeoutMinutes`. Mock `useAuthStore.login()` for unlock verification.

#### D-8b: `useP1AudioAlert` hook tests (`src/__tests__/hooks/use-p1-audio-alert.test.ts`)

```typescript
/**
 * Tests for useP1AudioAlert hook.
 * @see WS-F.4 D-3
 */

// T-1: Returns isActive=false when audioNotificationsEnabled is false.
// T-2: Does not trigger audio on initial mount (first P1 ID is recorded but not alerted).
// T-3: Triggers audio when mostRecentP1.id changes from a previous non-null value.
// T-4: Does not trigger audio when mostRecentP1 changes from non-null to null (P1 cleared).
// T-5: Calls navigator.vibrate([200, 100, 200]) when audio triggers (if vibrate is available).
// T-6: Falls back to playNotificationSound() when AudioContext is not available.
// T-7: unlockAudio() creates an AudioContext and fetches the audio buffer.
// T-8: lastAlertedP1Id is updated to the new P1 ID after audio plays.
```

**Test utilities:** Mock `AudioContext`, `navigator.vibrate`, `fetch` for audio buffer, and `usePriorityFeed` for P1 data changes.

#### D-8c: `useDataFreshnessMobile` hook tests (`src/__tests__/hooks/use-data-freshness-mobile.test.ts`)

```typescript
/**
 * Tests for useDataFreshnessMobile hook.
 * @see WS-F.4 D-4
 */

// T-1: Sets data-freshness="fresh" on document.documentElement when state is fresh.
// T-2: Sets data-freshness="stale" when state transitions to stale.
// T-3: Sets data-freshness="offline" when state transitions to offline.
// T-4: Removes data-freshness attribute on unmount.
// T-5: isRecovering is true for 3 seconds after transitioning from stale to fresh.
// T-6: isRecovering is true for 3 seconds after transitioning from offline to fresh.
// T-7: isRecovering is false during steady-state fresh.
// T-8: Console warnings are logged on stale and offline transitions.
// T-9: Console info is logged on recovery transition.
```

**Test utilities:** Mock `useDataFreshness` to control state transitions. Inspect `document.documentElement.getAttribute('data-freshness')`. Use `vi.useFakeTimers()` for recovery timer.

#### D-8d: `MobileIdleLockOverlay` component tests (`src/__tests__/components/mobile-idle-lock-overlay.test.tsx`)

```typescript
/**
 * Tests for MobileIdleLockOverlay component.
 * @see WS-F.4 D-2
 */

// T-1: Renders null when isLocked is false.
// T-2: Renders the lock overlay with role="alertdialog" when isLocked is true.
// T-3: Focus moves to passphrase input when overlay appears.
// T-4: Submitting the correct passphrase calls onUnlock and returns true.
// T-5: Submitting an incorrect passphrase shows error message with aria-live="polite".
// T-6: Error message clears after 3 seconds.
// T-7: Passphrase field clears after incorrect submission.
// T-8: Submit button is disabled when passphrase input is empty.
// T-9: Eye/EyeOff toggle switches input type between password and text.
// T-10: aria-invalid is true on the input when error state is active.
```

**Estimated total test size:** ~200 lines across 4 test files.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `useIdleLock` locks the session after the configured timeout (default 5 minutes) when no `pointermove`, `pointerdown`, or `keydown` events are detected. | Set timeout to 1 minute in settings. Wait 60 seconds without interaction. Verify lock overlay appears. |
| AC-2 | `useIdleLock` resets the timer on any pointer or keyboard activity. | Set timeout to 1 minute. At 50 seconds, move the pointer. Verify timer resets (lock does not appear at 60 seconds; appears at 110 seconds). |
| AC-3 | `useIdleLock` respects `idleLockTimeoutMinutes = 0` (never lock). No timer is started, no event listeners are registered. | Set timeout to "Never" in settings. Wait indefinitely. Verify lock overlay never appears. |
| AC-4 | `MobileIdleLockOverlay` renders at z-50, covering the entire viewport, when `isLocked` is true. | Trigger lock. Verify overlay covers all content. Attempt to tap through the overlay to underlying elements. Verify no pass-through. |
| AC-5 | `MobileIdleLockOverlay` traps focus within the form (input + buttons). | Tab through the overlay elements. Verify focus does not escape to underlying content. |
| AC-6 | Entering the correct passphrase in the lock overlay dismisses it and restarts the idle timer. | Lock the session. Enter "tarva". Tap "UNLOCK SESSION". Verify overlay disappears. Verify idle timer restarts. |
| AC-7 | Entering an incorrect passphrase shows an error message with `aria-live="polite"`. | Lock the session. Enter "wrong". Submit. Verify "Incorrect passphrase." text appears with red color. Verify a screen reader would announce the error. |
| AC-8 | The lock overlay appears when the browser tab was hidden longer than the timeout and becomes visible again. | Set timeout to 1 minute. Switch to another tab. Wait 90 seconds. Return to the tab. Verify lock overlay is immediately visible. |
| AC-9 | `useP1AudioAlert` plays the alert tone when a new P1 alert arrives (new `mostRecentP1.id` detected) and `audioNotificationsEnabled` is true. | Enable audio in settings. Trigger a new P1 alert via the API. Verify audible tone plays. |
| AC-10 | `useP1AudioAlert` does NOT play a tone on initial page load (even if P1 alerts already exist). | Load the page with existing P1 alerts. Verify no audio plays on mount. |
| AC-11 | `useP1AudioAlert` triggers `navigator.vibrate([200, 100, 200])` alongside the audio tone on Android devices. | Test on Android Chrome. Trigger a new P1 alert. Verify device vibrates with double-pulse pattern. |
| AC-12 | `useP1AudioAlert` silently degrades on iOS Safari where `navigator.vibrate` is not supported. No runtime errors. | Test on iOS Safari. Trigger a new P1 alert. Verify audio plays, no vibration (expected), no console errors. |
| AC-13 | `useP1AudioAlert` respects `audioNotificationsEnabled = false`. No audio, no vibration. | Disable audio in settings. Trigger a new P1 alert. Verify silence. |
| AC-14 | Web Audio API is unlocked on the first user interaction (pointerdown) after page load. | Load the page. Tap anywhere. Verify `AudioContext` state is 'running' (inspect via DevTools). |
| AC-15 | `useDataFreshnessMobile` sets `data-freshness="stale"` on `<html>` when data becomes stale. | Disconnect the TarvaRI API. Wait 3 minutes. Verify `document.documentElement.getAttribute('data-freshness')` is `'stale'`. |
| AC-16 | `useDataFreshnessMobile` sets `data-freshness="offline"` on `<html>` when `navigator.onLine` becomes false. | Toggle airplane mode. Verify attribute changes to `'offline'`. |
| AC-17 | CSS degradation: category cards and threat banner have reduced saturation and opacity when `data-freshness="stale"`. | Inspect computed styles on a category card when stale. Verify `filter: saturate(0.7)` and `opacity: 0.85`. |
| AC-18 | CSS degradation: more pronounced reduction when `data-freshness="offline"` (`saturate(0.4)`, `opacity: 0.70`). | Inspect computed styles when offline. |
| AC-19 | `isRecovering` flag is true for 3 seconds after data transitions from stale/offline back to fresh. | Disconnect API, wait for stale, reconnect. Verify `isRecovering` is true for 3 seconds. |
| AC-20 | Tapping the P1 banner navigates to the alert's category detail with the specific alert pre-selected. | Tap the P1 banner. Verify: (a) Tab switches to Situation, (b) category detail bottom sheet opens for the alert's category, (c) the specific alert is scrolled into view / highlighted. |
| AC-21 | `prefers-reduced-motion: reduce` disables the lock overlay fade-in animation and the data freshness CSS transitions. | Enable reduced motion in OS settings. Trigger lock. Verify no fade-in. Trigger staleness. Verify no transition animation on degradation. |
| AC-22 | `pnpm typecheck` passes with zero errors after all deliverables are added. | Run `pnpm typecheck`. Exit code 0. |
| AC-23 | All unit tests in D-8a through D-8d pass. | Run `pnpm test:unit`. All test files pass. |
| AC-24 | Desktop view is completely unaffected. No idle lock, no audio alert hook, no data freshness attribute modification. | Load the page at 1920x1080. Verify no `data-freshness` attribute on `<html>`. Verify no idle lock behavior. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | Idle lock uses `auth.store.login(passphrase)` for unlock verification rather than a separate lock passphrase or PIN. | The existing passphrase mechanism is the only authentication primitive in the system (see `auth.store.ts`, line 44). Introducing a separate PIN would require additional store state, a PIN-setting UI flow, and add cognitive load for the operator who must remember two credentials. Reusing the session passphrase provides security parity with the login flow and zero additional configuration burden. The protective-ops-review C5 recommends "re-authentication", which `login()` satisfies. | (a) Separate 4-digit PIN: rejected -- adds configuration UI complexity, a second credential to remember, and a less secure mechanism than the passphrase. (b) Biometric (WebAuthn): rejected -- not all mobile browsers support it consistently, and the passphrase-based auth system has no WebAuthn integration. (c) No unlock required (just tap to dismiss): rejected -- defeats the security purpose of the lock. |
| DM-2 | `useP1AudioAlert` is a separate hook from the existing `useNotificationDispatch` rather than modifying the dispatch hook. | The existing `useNotificationDispatch` (93 lines) handles three channels: in-app toast, browser notification, and audio. It is consumed by the desktop's `useRealtimePriorityAlerts` via the `onAlert` callback. The mobile P1 audio alert has a different trigger mechanism (polling-based P1 ID change detection vs. WebSocket push), different audio implementation (Web Audio API with AudioContext vs. HTML Audio API), and additional behaviors (vibration, autoplay unlock). Merging these into the dispatch hook would create platform-conditional branches and couple the desktop notification system to mobile-specific APIs. The desktop hook continues to use `playNotificationSound()` via the dispatch hook. The mobile hook uses Web Audio API with a fallback to `playNotificationSound()`. No double-play occurs because the mobile view does not wire `useRealtimePriorityAlerts` with audio dispatch -- it uses `useP1AudioAlert` instead. | (a) Modify `useNotificationDispatch` with a `platform` parameter: rejected -- adds conditional logic to a clean hook, and the mobile audio requirements (AudioContext, vibrate, autoplay unlock) are fundamentally different. (b) Extract a shared `useAudioChannel` hook: viable but over-engineered for two consumers with different trigger mechanisms. |
| DM-3 | `useDataFreshnessMobile` uses a DOM attribute (`data-freshness`) on `<html>` for CSS-driven degradation rather than prop-drilling a `freshness` prop to every affected component. | The degradation affects multiple independent components (category cards from WS-B.2, threat banner from WS-B.1, alert cards from WS-D.2). Prop-drilling would require modifying the prop interfaces of 5+ components and threading the value through `MobileView` -> `MobileShell` -> each tab -> each card. A CSS attribute selector on the document root is zero-prop, zero-import, and any component can respond to staleness by adding a CSS rule. This is the same pattern used by `prefers-reduced-motion` and `prefers-color-scheme` -- a global state that CSS naturally cascades through. | (a) React Context for freshness state: rejected -- requires a Provider wrapper and `useContext` in every consuming component. Heavier than a CSS attribute. (b) Zustand store for freshness: rejected -- freshness is already derived from TanStack Query state by `useDataFreshness`. Adding a store would create a synchronization burden. (c) Per-component `isStale` prop: rejected -- extensive prop threading for a visual-only concern. |
| DM-4 | The idle lock timer uses `pointermove` + `pointerdown` + `keydown` (three events) rather than monitoring all possible interaction events. | These three events cover the complete space of user-initiated interactions on mobile and desktop: touch (generates pointer events), mouse (generates pointer events), keyboard (generates keydown), and stylus (generates pointer events). `scroll` and `wheel` events are intentionally excluded because passive scrolling (e.g., a page scrolling due to momentum after a flick) does not indicate active user presence. `focus` and `blur` are excluded because they fire during programmatic focus management (e.g., bottom sheet open/close), not user activity. The W3C Pointer Events specification explicitly unifies mouse, touch, and pen input under the pointer event model. | (a) Add `scroll` event: rejected -- momentum scrolling fires scroll events long after the user lifts their finger, creating false-positive activity signals. (b) Add `touchstart`/`touchmove`: rejected -- redundant with pointer events on all target browsers. (c) `mousemove` + `touchmove` + `keydown`: rejected -- pointer events are the modern unified API. |
| DM-5 | The Web Audio API is preferred over HTML Audio API for P1 alert playback on mobile. | The HTML Audio API (`new Audio()`) has inconsistent autoplay behavior on mobile browsers. iOS Safari in particular restricts audio playback initiated by non-user-gesture code paths. The Web Audio API provides finer control: once the `AudioContext` is created during a user interaction, subsequent `start()` calls are permitted without additional gestures. The existing `notification-sound.ts` uses HTML Audio, which works on desktop but may be silently blocked on mobile. The Web Audio API also enables future enhancements (audio ducking, custom tone generation, gain control) without changing the API surface. `playNotificationSound()` from `notification-sound.ts` is retained as a fallback when `AudioContext` is unavailable. | (a) HTML Audio API only (reuse `notification-sound.ts`): rejected -- unreliable autoplay on iOS Safari for non-user-gesture-initiated playback. (b) Notification API sound: rejected -- `Notification` API does not support custom sounds on most platforms. (c) Third-party audio library (Howler.js, Tone.js): rejected -- adds a dependency for a single sound playback. |
| DM-6 | Activity event throttling is set to 1000ms (1 second) rather than a shorter or longer interval. | At 60fps, `pointermove` fires ~60 events per second during continuous pointer movement. Each event would clear and restart a `setTimeout`, which is unnecessary overhead. Throttling to 1 event per second means the timer could be off by at most 1 second from the configured timeout -- an imperceptible difference for timeouts measured in minutes. Shorter intervals (e.g., 100ms) provide negligible accuracy improvement at 10x the timer churn. Longer intervals (e.g., 5s) would make the timer noticeably imprecise: a 1-minute timeout could fire anywhere between 1:00 and 1:05. | (a) No throttle: rejected -- excessive timer resets. (b) 100ms throttle: rejected -- minimal benefit over 1s. (c) 5s throttle: rejected -- imprecise for short timeouts. |
| DM-7 | The lock overlay does not use the `inert` attribute on `MobileShell` content, relying instead on z-index and `aria-modal`. | The `inert` attribute would fully disable interaction on underlying content, which is the ideal behavior. However, it requires imperative DOM manipulation (adding `inert` to the shell element) that couples the lock overlay to the shell's DOM structure. The z-50 overlay with `position: fixed; inset: 0` already intercepts all pointer events. `aria-modal="true"` signals assistive technologies to restrict navigation to the dialog content. If field testing reveals focus escape issues, `inert` can be added as a progressive enhancement via a ref on the shell element. | (a) Add `inert` to `MobileShell` root: acceptable enhancement, deferred to testing validation. The hook returns `isLocked` which `MobileView` could use to set `inert` on the shell. (b) Focus trap library (`focus-trap-react`): rejected -- adds a dependency for a simple form with 3 focusable elements. |
| DM-8 | **Deduplication: Mobile P1 audio replaces notification-dispatch audio.** On mobile, `MobileView` does NOT wire `useRealtimePriorityAlerts` with audio dispatch. Instead, `useP1AudioAlert` is the sole P1 audio channel. The existing `useNotificationDispatch` (which calls `playNotificationSound()` for P1 alerts) is used only by the desktop component tree via `useRealtimePriorityAlerts`. Since WS-A.1 code-splits desktop and mobile into separate component trees, only one audio path is active per platform. No runtime deduplication flag is needed -- the separation is architectural. If `useNotificationDispatch` is ever wired into `MobileView` for non-audio channels (e.g., in-app toast), its audio channel must be disabled by passing `audioEnabled: false` or by not calling `playNotificationSound()` in that context. | (a) Runtime deduplication flag: rejected -- unnecessary because the mobile/desktop split already prevents double-play. (b) Disable `audioNotificationsEnabled` in settings on mobile: rejected -- the setting controls both platforms; the desktop path should still work. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the idle lock show a countdown warning (e.g., "Locking in 30 seconds") before locking? The current implementation locks silently. A warning would give the operator a chance to interact and reset the timer, but it also draws attention away from the intelligence display. | world-class-ux-designer | Phase F review gate |
| OQ-2 | Should `useP1AudioAlert` use a different tone than the desktop `notification-sound.ts` alert tone? A distinct mobile tone would help operators distinguish between desktop and mobile alerts in environments where both are running simultaneously. The current implementation reuses the same `/sounds/alert-tone.mp3`. | world-class-ux-designer | Post-launch (requires audio asset creation) |
| OQ-3 | Should the lock overlay display the number of P1 alerts that arrived while locked? This would inform the operator that critical events occurred during their absence. However, displaying alert counts on the lock screen could be an OPSEC concern (visible to anyone who picks up the phone). | world-class-ux-designer + protective-ops | Phase F review gate |
| OQ-4 | Should `useDataFreshnessMobile` adjust TanStack Query `refetchInterval` when data is stale (e.g., increase polling frequency to attempt faster recovery)? The current implementation only applies visual degradation. Increasing the refetch rate during staleness could recover faster but might waste battery and bandwidth in genuinely poor connectivity environments. | react-developer | Phase F review gate |
| OQ-5 | The `inert` attribute on `MobileShell` during idle lock (DM-7) would improve accessibility. Should this be implemented immediately or deferred to accessibility audit (WS-F.2)? | react-developer | WS-F.2 scope |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Web Audio API `AudioContext` creation fails silently on browsers that restrict it (e.g., Firefox with `dom.webaudio.enabled` set to false, or enterprise-managed browsers with audio policies). | Low | Medium -- P1 audio alert silently fails, operator receives visual-only notification | Fall back to `playNotificationSound()` (HTML Audio API) when `AudioContext` creation throws. Both paths are attempted; at least one will succeed on any browser that supports `<audio>`. If both fail, the operator still receives the visual P1 banner (WS-B.1). |
| R-2 | iOS Safari restricts `navigator.vibrate()` (WebKit does not implement the Vibration API). The haptic component of P1 alerts silently fails on iPhones. | High (confirmed -- WebKit does not support Vibration API) | Low -- vibration is supplementary to audio and visual notification | Use optional chaining `navigator.vibrate?.([200, 100, 200])`. The primary notification channels (audio + visual banner) are unaffected. Document in release notes that haptic feedback is Android-only. |
| R-3 | The idle lock timer fires during active use if `pointermove` events are not generated (e.g., user is reading a long alert detail without moving their finger). Reading-only sessions produce no pointer or keyboard events. | Medium | Medium -- operator is interrupted by a lock overlay while actively reading intelligence data | Accept. The purpose of the idle lock is to secure unattended devices. An operator who is actively reading can dismiss the lock in under 3 seconds. If user testing reveals this is disruptive, add `scroll` to the activity event list (with awareness that momentum scroll generates false positives per DM-4). OQ-1's countdown warning would also mitigate this by giving the operator a chance to touch the screen. |
| R-4 | WS-B.1's `MobileP1Banner` `onTapP1` callback signature may differ from the `(alertId: string, category: string)` signature assumed in D-5. | Medium | Low -- requires a signature adapter in `MobileView` | WS-B.1's SOW defines the callback as receiving the P1 alert's `id` and `category`. If the signature changes during WS-B.1 implementation, D-5's `handleP1BannerTap` can be adapted with a thin wrapper. |
| R-5 | `data-freshness` attribute on `<html>` persists if `useDataFreshnessMobile` unmounts without cleanup (e.g., rapid navigation away from the mobile view). | Low | Low -- a stale attribute on `<html>` would cause visual degradation on the desktop view if the user resizes the window above 768px | The cleanup is handled in a `useEffect` return. If the mobile view unmounts cleanly, the attribute is removed. Add a defensive check in the desktop view to remove the attribute if present on mount. |
| R-6 | Double-play of P1 audio: if both `useP1AudioAlert` and `useNotificationDispatch` are wired in `MobileView`, a new P1 alert would trigger audio twice. | Medium | Medium -- jarring double-tone for the operator | Prevent by ensuring `MobileView` does not pass audio-dispatch to `useRealtimePriorityAlerts.onAlert`. The mobile view's `onAlert` callback should only trigger in-app toast and browser notification (channels 1 and 2 of `useNotificationDispatch.notify`), NOT channel 3 (audio). `useP1AudioAlert` exclusively owns the mobile audio channel. See DM-2. |
| R-7 | Settings store migration: existing users may not have `idleLockTimeoutMinutes` in their persisted localStorage. | Low | Low -- Zustand's persist middleware uses shallow merge, which fills in defaults for missing keys | WS-C.5 addresses this with a default value of 5. No additional migration logic is needed in this workstream. Verify in integration testing that a user with pre-existing `tarva-launch-settings` localStorage gets the default `idleLockTimeoutMinutes: 5`. |

---

## Appendix A: Data Flow Diagram

```
                                 Settings Store
                                 (localStorage)
                                       │
               ┌───────────────────────┼───────────────────────┐
               │                       │                       │
               ▼                       ▼                       ▼
        idleLockTimeout       audioNotifications       effectsEnabled
        Minutes (0-15)        Enabled (bool)           (for reference)
               │                       │
               ▼                       ▼
        ┌─────────────┐      ┌──────────────────┐
        │ useIdleLock  │      │ useP1AudioAlert  │
        │              │      │                  │
        │ pointermove ─┤      │ usePriorityFeed  │
        │ pointerdown ─┤      │ .mostRecentP1.id │
        │ keydown     ─┤      │                  │
        │ visibility  ─┤      │ Web Audio API    │
        │              │      │ navigator.vibrate│
        └──────┬───────┘      └────────┬─────────┘
               │                       │
               ▼                       ▼
        ┌─────────────────┐    Audio + Vibration
        │ MobileIdleLock  │    (on P1 change)
        │ Overlay (z-50)  │
        │                 │
        │ Passphrase ──→ auth.store.login()
        │                 │
        └─────────────────┘

        ┌─────────────────────────┐
        │ useDataFreshnessMobile  │
        │                         │
        │ useDataFreshness() ──┐  │
        │ (WS-B.3)            │  │
        │                     ▼  │
        │ data-freshness attr ───┼──→ <html data-freshness="fresh|stale|offline">
        │ on document.root    │  │           │
        │                     │  │           ▼
        │ isRecovering flag ──┘  │    CSS degradation rules
        │                         │    (saturate, opacity)
        └─────────────────────────┘

        ┌─────────────────────────┐
        │ P1 Banner Cross-Tab     │
        │                         │
        │ MobileP1Banner          │
        │   onTapP1(id, cat) ─────┼──→ navigateToCategory(cat)
        │                         │    setDistrictPreselectedAlertId(id)
        │                         │    syncMobileUrlParams(...)
        └─────────────────────────┘
```

## Appendix B: Token Consumption Map

| Token | Consumed By | Where |
|-------|------------|-------|
| `--color-void` (#050911) | `.mobile-idle-lock-overlay` | `background` (rgba at 0.98 opacity) |
| `--color-text-primary` | Lock heading, input text, submit button | `color` |
| `--color-text-secondary` | N/A in this WS | -- |
| `--color-text-tertiary` | Lock body text, lock icon, session info | `color` + `opacity` |
| `--font-mono` | All lock overlay text | `font-family` |
| `--text-label` (11px) | Lock heading, submit button | `font-size` |
| `--text-body` (13px) | Passphrase input | `font-size` |
| `--text-caption` (10px) | Lock body text, error message | `font-size` |
| `--text-ghost` (10px) | Session elapsed time | `font-size` |
| `--space-content-padding` (12px) | Lock content wrapper | `padding` |
| `--touch-target-comfortable` (48px) | Input height, submit button height | `height` (implicit via 48px) |
| `--duration-fast` (100ms) | Submit button active state | `transition` |
| `--ease-default` | Lock overlay animation, button transition | `animation-timing-function` |
| `--glow-error` | Error message text | `color` |
| `--color-ember-bright` (#ff773c) | Focus-visible outline on input and buttons | `outline-color` |

## Appendix C: Protective Ops Review Traceability

| Review Item | Status | How Addressed |
|------------|--------|---------------|
| C5: Session auto-lock with configurable timeout | **RESOLVED** | `useIdleLock` hook (D-1) reads `idleLockTimeoutMinutes` from settings store. `MobileIdleLockOverlay` (D-2) provides the lock screen. WS-C.5 provides the settings UI. |
| C6: Audible/haptic notification for P1 arrivals | **RESOLVED** | `useP1AudioAlert` hook (D-3) plays Web Audio API tone + `navigator.vibrate` on P1 ID change. Respects `audioNotificationsEnabled` toggle from WS-C.5. |
| C1: Data staleness indicator | Resolved in WS-B.3 | This WS enhances with CSS degradation (D-4, D-6). |
| C2: P1 persistence until acknowledgment | Resolved in WS-B.1 | This WS wires the P1 banner tap to cross-tab navigation (D-5). |
| C3: "Show on Map" from all alert contexts | Resolved in WS-E.3 | This WS adds the P1 banner -> category detail path (D-5) which is the remaining unresolved context. |
| C7: Connectivity indicator in header | Resolved in WS-B.3 | No modification in this WS. |
