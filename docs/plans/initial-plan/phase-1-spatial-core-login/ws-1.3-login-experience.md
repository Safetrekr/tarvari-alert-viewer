# WS-1.3: Login Experience

> **Workstream ID:** WS-1.3
> **Phase:** 1 -- Spatial Core + Login
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1 (project scaffolding), WS-0.2 (design tokens)
> **Blocks:** None (login is independent of spatial engine)
> **Resolves:** None

---

## 1. Objective

Build the theatrical login experience for Tarva Launch -- a full-screen, any-key-to-type passphrase gate that transforms a dark void into a living workspace. The login page serves as the user's first encounter with the spatial aesthetic: a single breathing ember glyph floats in emptiness, the user presses any key, a passphrase field materializes with a scanline sweep, and upon successful authentication a receipt stamp appears before a ViewTransition carries the user into the Launch Atrium. This workstream produces the login route (`/login`), all auth UI components, the Zustand auth store with `sessionStorage` persistence, and the auth guard that protects the `(launch)/` route group.

---

## 2. Scope

### In Scope

- **Login page route** -- `src/app/login/page.tsx`, a Server Component shell that renders the client-side `LoginScene` orchestrator. Full-screen, dark void background (`--color-void: #050911`), no chrome, no navigation, no header.
- **Attractor glyph** -- A single animated element centered on the viewport that uses the hub-center breathing animation (5s `ease-in-out` cycle, ember glow oscillating between 20px/0.06 opacity and 48px/0.14 opacity). This is the only visible element on initial page load. It silently invites interaction.
- **Any-key-to-type activation** -- A global `keydown` listener on the login page. When the user presses any alphanumeric key (a-z, A-Z, 0-9), the passphrase field materializes (400ms Framer Motion animation with scanline sweep), the input receives focus, and the pressed key is inserted as the first character. Non-alphanumeric keys (Escape, Tab, arrows, modifiers) are ignored.
- **Passphrase field** -- A single centered `<input type="password">` rendered in Geist Mono, built on the `@tarva/ui` `Input` component with custom styling overrides for the spatial aesthetic (transparent background, ember-tinted focus ring, no visible border at rest). Progressive disclosure: no field is visible until the user begins typing.
- **Passphrase validation** -- Compare input value against a hardcoded passphrase constant defined in `src/components/auth/constants.ts`. No server-side validation, no API call, no environment variable. The passphrase is a compile-time constant (this is an internal localhost tool).
- **Success flow** -- On valid passphrase + Enter: (1) field collapses with a 200ms scale-down animation, (2) receipt stamp materializes showing `AUTH OK / TRACE: {4-char-hex} / {ISO-timestamp}`, (3) after a 600ms pause the React 19 `<ViewTransition>` navigates to the `(launch)/` hub route. The auth store is updated and a `sessionStorage` entry is written before the transition begins.
- **Failure flow** -- On invalid passphrase + Enter: the field performs a horizontal shake animation (3 oscillations over 300ms, 6px amplitude), then clears the input value. No error text, no toast, no color change -- the shake gesture alone communicates failure. The attractor glyph remains breathing.
- **Auth store** -- `src/stores/auth.store.ts`, a Zustand store with `authenticated: boolean` and `sessionKey: string` state, plus `login(passphrase: string): boolean` and `logout(): void` actions. The `login` action validates the passphrase, generates a session key via `crypto.randomUUID()`, writes it to `sessionStorage` under the key `tarva-launch-session`, and sets `authenticated: true`. On store initialization, the store hydrates from `sessionStorage` to survive page refreshes within the same tab.
- **Auth guard** -- A check in `src/app/(launch)/layout.tsx` that reads the auth store and redirects unauthenticated users to `/login`. Implemented as a client-side check (not middleware) since the auth mechanism is purely client-side `sessionStorage`.
- **Receipt stamp component** -- A reusable `ReceiptStamp` component in `src/components/auth/receipt-stamp.tsx` that renders the "AUTH OK / TRACE: XXXX / timestamp" readout per VISUAL-DESIGN-SPEC.md Section 3.4 typography specification.
- **Scanline effect** -- A reusable `Scanline` component in `src/components/auth/scanline.tsx` that renders the 1-primary + 2-ghost-line sweep per VISUAL-DESIGN-SPEC.md Section 5.5, triggered during field materialization and auth success.
- **Reduced motion support** -- When `prefers-reduced-motion: reduce` is active, all animations collapse to instant state changes: the field appears immediately (no materialization), the glyph does not animate (static glow at midpoint), no scanline, no shake, and the ViewTransition is replaced with a direct `router.push()`.

### Out of Scope

- **Real authentication** -- No OAuth, no JWT, no server sessions, no Supabase auth. This is a hardcoded passphrase gate for an internal tool.
- **User registration / account management** -- Single passphrase, no user accounts.
- **Password visibility toggle** -- The field is `type="password"` with no toggle. The passphrase is short and typed from memory.
- **Remember me / persistent sessions** -- `sessionStorage` is tab-scoped by design. Closing the tab clears the session. No `localStorage`, no cookies.
- **Rate limiting / lockout** -- No brute-force protection. This is a localhost tool with a hardcoded passphrase.
- **Launch Atrium (hub) page** -- The destination after login. Built in WS-1.2.
- **Ambient effects layer** -- Particle drift, film grain, grid pulse on the login page. If desired, those are contributed by WS-1.6 as an overlay that can appear on any page, including login.
- **Command palette** -- Not available on the login page. Built in WS-3.x.

---

## 3. Input Dependencies

| Dependency                 | Source         | What It Provides                                                                                                                                                                                         |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-0.1 Project Scaffolding | Phase 0        | Next.js 16 project with `src/app/` structure, `(launch)/` route group, Zustand installed, Framer Motion installed, `@tarva/ui` installed                                                                 |
| WS-0.2 Design Tokens Setup | Phase 0        | All CSS custom properties (`--color-void`, `--color-ember-*`, `--glow-ember-*`, `--duration-*`, `--ease-*`), Tailwind theme registration, Geist Sans + Geist Mono font loading, ThemeProvider configured |
| VISUAL-DESIGN-SPEC.md      | Discovery docs | Canonical animation values (Section 5.3 breathing, Section 5.5 scanlines, Section 3.4 receipt stamp typography, Section 6.1 token values) [SPEC]                                                         |
| @tarva/ui Input component  | npm package    | `Input` component with `forwardRef`, CVA variants (`default`, `error`), `className` prop for style overrides, `aria-invalid` support [ECOSYSTEM]                                                         |
| Storyboard frames 2-4      | Discovery docs | Narrative flow: attractor glyph, credential reveal with scanline, auth latch with receipt stamp [STORYBOARD]                                                                                             |

---

## 4. Deliverables

### 4.1 File: `src/stores/auth.store.ts`

The Zustand auth store. Manages authentication state and `sessionStorage` synchronization. Follows the store pattern established in the Tarva Agent Builder (simple `create()` with `persist` middleware for storage sync).

**Exact file contents:**

```ts
'use client'

import { create } from 'zustand'

// --------------------------------------------------------------------------
// Constants
// --------------------------------------------------------------------------

const SESSION_STORAGE_KEY = 'tarva-launch-session'

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface AuthState {
  authenticated: boolean
  sessionKey: string
}

interface AuthActions {
  login: (passphrase: string) => boolean
  logout: () => void
  hydrate: () => void
}

type AuthStore = AuthState & AuthActions

// --------------------------------------------------------------------------
// Passphrase (hardcoded -- internal localhost tool, no env var needed)
// --------------------------------------------------------------------------

const PASSPHRASE = 'tarva'

// --------------------------------------------------------------------------
// Store
// --------------------------------------------------------------------------

export const useAuthStore = create<AuthStore>()((set) => ({
  // State
  authenticated: false,
  sessionKey: '',

  // Actions
  login: (passphrase: string): boolean => {
    if (passphrase !== PASSPHRASE) return false

    const sessionKey = crypto.randomUUID()

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionKey)
    } catch {
      // sessionStorage unavailable (SSR, private browsing quota exceeded)
    }

    set({ authenticated: true, sessionKey })
    return true
  },

  logout: () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      // sessionStorage unavailable
    }

    set({ authenticated: false, sessionKey: '' })
  },

  hydrate: () => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (stored) {
        set({ authenticated: true, sessionKey: stored })
      }
    } catch {
      // sessionStorage unavailable (SSR)
    }
  },
}))
```

**Design notes:**

- The store does NOT use Zustand's `persist` middleware because `sessionStorage` is not a key-value mirror of the full store state -- only the session key is persisted, and `authenticated` is derived from its presence. A manual `hydrate()` action is cleaner.
- `hydrate()` is called once in `LoginScene` and once in the `(launch)/` auth guard on mount.
- `PASSPHRASE` is a module-level constant, not exported. It exists only in this file.
- The `login()` action returns a boolean so the UI can branch on success/failure synchronously without subscribing to state changes in the same render cycle.
- `try/catch` around `sessionStorage` calls guards against SSR (where `sessionStorage` is undefined) and private browsing quota errors.

---

### 4.2 File: `src/components/auth/constants.ts`

Shared constants for the auth component tree. Keeps magic strings and timing values in one place.

**Exact file contents:**

```ts
// ---------------------------------------------------------------------------
// Login Experience -- Shared Constants
// ---------------------------------------------------------------------------

/** Duration of the passphrase field materialization animation (ms). */
export const FIELD_MATERIALIZE_DURATION = 400

/** Duration of the scanline sweep across the login container (ms). */
export const SCANLINE_DURATION = 350

/** Duration of the failure shake animation (ms). */
export const SHAKE_DURATION = 300

/** Horizontal amplitude of the failure shake (px). */
export const SHAKE_AMPLITUDE = 6

/** Number of oscillations in the failure shake. */
export const SHAKE_OSCILLATIONS = 3

/** Duration of the success receipt stamp display before ViewTransition (ms). */
export const RECEIPT_DISPLAY_DURATION = 600

/** Duration of the field collapse animation on success (ms). */
export const FIELD_COLLAPSE_DURATION = 200

/** Duration of the attractor glyph breathing cycle (ms). */
export const BREATHE_CYCLE_DURATION = 5000

/** Length of the hex trace ID in the receipt stamp (characters). */
export const TRACE_ID_LENGTH = 4
```

---

### 4.3 File: `src/components/auth/attractor-glyph.tsx`

The breathing ember glyph that floats at viewport center on the login page. Pure CSS animation -- no JavaScript animation runtime required. The glyph is a circular element with the hub-center breathing glow from VISUAL-DESIGN-SPEC.md Section 5.3.

**Exact file contents:**

```tsx
'use client'

import { cn } from '@tarva/ui'

interface AttractorGlyphProps {
  /** Whether the glyph is visible. Set to false after field materialization. */
  visible: boolean
  className?: string
}

export function AttractorGlyph({ visible, className }: AttractorGlyphProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 flex items-center justify-center',
        'transition-opacity duration-[400ms]',
        visible ? 'opacity-100' : 'opacity-0',
        className
      )}
      aria-hidden="true"
    >
      <div className="attractor-glyph bg-ember/20 relative h-3 w-3 rounded-full" />

      <style jsx>{`
        .attractor-glyph {
          animation: breathe 5s ease-in-out infinite;
        }

        @keyframes breathe {
          0%,
          100% {
            box-shadow:
              0 0 20px rgba(224, 82, 0, 0.06),
              0 0 8px rgba(224, 82, 0, 0.1);
          }
          50% {
            box-shadow:
              0 0 48px rgba(224, 82, 0, 0.14),
              0 0 16px rgba(224, 82, 0, 0.22);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .attractor-glyph {
            animation: none;
            box-shadow:
              0 0 34px rgba(224, 82, 0, 0.1),
              0 0 12px rgba(224, 82, 0, 0.16);
          }
        }
      `}</style>
    </div>
  )
}
```

**Design notes:**

- The glyph is a 12px (`h-3 w-3`) circle with `bg-ember/20` as a faint warm fill.
- The breathing animation oscillates `box-shadow` between the min and max glow values from VISUAL-DESIGN-SPEC.md Section 5.3, exactly matching the `.hub-center` keyframes.
- `pointer-events-none` and `aria-hidden="true"` ensure the glyph is purely decorative and does not interfere with the global keydown listener.
- When `visible` is false (after field materialization), the glyph fades out over 400ms, matching the field materialization duration.
- For `prefers-reduced-motion`, the animation is replaced with a static midpoint glow.

---

### 4.4 File: `src/components/auth/scanline.tsx`

A reusable scanline sweep component. Renders 1 primary line + 2 trailing ghost lines that sweep top-to-bottom across the containing element. Triggered imperatively by toggling the `active` prop. Per VISUAL-DESIGN-SPEC.md Section 5.5.

**Exact file contents:**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@tarva/ui'
import { SCANLINE_DURATION } from './constants'

interface ScanlineProps {
  /** Set to true to trigger a single sweep. Resets after animation completes. */
  active: boolean
  /** Called when the sweep animation completes. */
  onComplete?: () => void
  className?: string
}

export function Scanline({ active, onComplete, className }: ScanlineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sweeping, setSweeping] = useState(false)

  useEffect(() => {
    if (!active || sweeping) return

    // Check for reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      onComplete?.()
      return
    }

    setSweeping(true)

    const timer = setTimeout(() => {
      setSweeping(false)
      onComplete?.()
    }, SCANLINE_DURATION + 60) // +60ms for ghost line delays

    return () => clearTimeout(timer)
  }, [active, sweeping, onComplete])

  if (!sweeping) return null

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      {/* Primary scanline */}
      <div className="scanline-primary bg-ember absolute right-0 left-0 h-px opacity-[0.12]" />
      {/* Ghost line 1 */}
      <div className="scanline-ghost-1 bg-ember absolute right-0 left-0 h-px opacity-[0.06]" />
      {/* Ghost line 2 */}
      <div className="scanline-ghost-2 bg-ember absolute right-0 left-0 h-px opacity-[0.03]" />

      <style jsx>{`
        .scanline-primary {
          box-shadow: 0 0 4px rgba(224, 82, 0, 0.1);
          transform: translateY(-2px);
          animation: scan ${SCANLINE_DURATION}ms ease-out forwards;
        }

        .scanline-ghost-1 {
          transform: translateY(-2px);
          animation: scan ${SCANLINE_DURATION}ms ease-out forwards;
          animation-delay: 30ms;
        }

        .scanline-ghost-2 {
          transform: translateY(-2px);
          animation: scan ${SCANLINE_DURATION}ms ease-out forwards;
          animation-delay: 60ms;
        }

        @keyframes scan {
          0% {
            transform: translateY(-2px);
          }
          100% {
            transform: translateY(100vh);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scanline-primary,
          .scanline-ghost-1,
          .scanline-ghost-2 {
            animation: none;
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
```

**Design notes:**

- The scanline uses `100vh` as the scan height since it sweeps the full login viewport, not a fixed-height capsule.
- Ghost lines trail at 30ms and 60ms delays per VISUAL-DESIGN-SPEC.md Section 5.5.
- The primary line has a `box-shadow` glow halo (`0 0 4px rgba(224, 82, 0, 0.10)`) per spec.
- The component self-cleans: it renders null when not sweeping, so there is no persistent DOM cost.

---

### 4.5 File: `src/components/auth/passphrase-field.tsx`

The passphrase input field with materialization animation (400ms Framer Motion), failure shake, and success collapse. Wraps the `@tarva/ui` `Input` component with spatial styling.

**Exact file contents:**

```tsx
'use client'

import { forwardRef, type KeyboardEvent } from 'react'
import { motion, type Variants } from 'motion/react'
import { Input } from '@tarva/ui'
import { cn } from '@tarva/ui'
import {
  FIELD_MATERIALIZE_DURATION,
  FIELD_COLLAPSE_DURATION,
  SHAKE_DURATION,
  SHAKE_AMPLITUDE,
} from './constants'

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fieldVariants: Variants = {
  hidden: {
    opacity: 0,
    scaleX: 0.85,
    scaleY: 0.92,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    filter: 'blur(0px)',
    transition: {
      duration: FIELD_MATERIALIZE_DURATION / 1000,
      ease: [0.22, 1, 0.36, 1], // --ease-morph
    },
  },
  collapsed: {
    opacity: 0,
    scaleX: 0.5,
    scaleY: 0.7,
    filter: 'blur(6px)',
    transition: {
      duration: FIELD_COLLAPSE_DURATION / 1000,
      ease: [0.4, 0, 1, 1], // ease-in
    },
  },
  shake: {
    x: [
      0,
      -SHAKE_AMPLITUDE,
      SHAKE_AMPLITUDE,
      -SHAKE_AMPLITUDE,
      SHAKE_AMPLITUDE,
      -SHAKE_AMPLITUDE,
      0,
    ],
    transition: {
      duration: SHAKE_DURATION / 1000,
      ease: 'easeInOut',
    },
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FieldPhase = 'hidden' | 'visible' | 'collapsed' | 'shake'

interface PassphraseFieldProps {
  /** Current animation phase of the field. */
  phase: FieldPhase
  /** Current passphrase input value (controlled). */
  value: string
  /** Called on input change. */
  onChange: (value: string) => void
  /** Called when the user presses Enter. */
  onSubmit: () => void
  /** Called when the shake animation completes. */
  onShakeComplete?: () => void
  className?: string
}

export const PassphraseField = forwardRef<HTMLInputElement, PassphraseFieldProps>(
  function PassphraseField({ phase, value, onChange, onSubmit, onShakeComplete, className }, ref) {
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSubmit()
      }
    }

    return (
      <motion.div
        className={cn('w-full max-w-xs', className)}
        variants={fieldVariants}
        initial="hidden"
        animate={phase}
        onAnimationComplete={(definition) => {
          if (definition === 'shake') {
            onShakeComplete?.()
          }
        }}
      >
        <Input
          ref={ref}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck={false}
          aria-label="Passphrase"
          className={cn(
            // Override @tarva/ui Input defaults for spatial aesthetic
            'h-12 w-full rounded-lg border-0 bg-transparent text-center',
            'font-mono text-base tracking-widest',
            'text-text-primary placeholder:text-text-ghost',
            'ring-1 ring-white/[0.06] ring-inset',
            'focus-visible:ring-ember-bright/40 focus-visible:outline-none',
            'duration-hover ease-hover transition-shadow'
          )}
          placeholder=""
        />
      </motion.div>
    )
  }
)
```

**Design notes:**

- The field uses the `@tarva/ui` `Input` component as its base, applying className overrides to achieve the spatial aesthetic: transparent background, no solid border, a faint `ring-white/[0.06]` at rest, and `ring-ember-bright/40` on focus.
- Typography: `font-mono` (Geist Mono), `text-base` (16px equivalent), `tracking-widest` (0.12em) per the receipt/data typography convention.
- The materialization animation uses `--ease-morph` (`cubic-bezier(0.22, 1, 0.36, 1)`) for the organic "growing into existence" feel specified for spatial transitions.
- The shake animation produces 3 full oscillations (6 direction changes + return to center) at `SHAKE_AMPLITUDE` (6px).
- The collapse animation on success is fast (200ms) with an ease-in curve, creating a "snapping shut" feel.
- `onAnimationComplete` fires `onShakeComplete` so the `LoginScene` can clear the input after the shake finishes, not during.

---

### 4.6 File: `src/components/auth/receipt-stamp.tsx`

The authentication receipt stamp that appears after successful login. Typography and color values from VISUAL-DESIGN-SPEC.md Section 3.4.

**Exact file contents:**

```tsx
'use client'

import { motion } from 'motion/react'
import { cn } from '@tarva/ui'
import { TRACE_ID_LENGTH } from './constants'

interface ReceiptStampProps {
  /** The session trace ID (first N hex characters of the session UUID). */
  traceId: string
  /** ISO 8601 timestamp string. */
  timestamp: string
  className?: string
}

/**
 * Extracts a short hex trace ID from a full UUID.
 * Example: "7f2a3b4c-..." -> "7F2A"
 */
export function extractTraceId(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, TRACE_ID_LENGTH).toUpperCase()
}

export function ReceiptStamp({ traceId, timestamp, className }: ReceiptStampProps) {
  return (
    <motion.div
      className={cn('flex items-center justify-center gap-0', className)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      role="status"
      aria-live="polite"
      aria-label={`Authentication successful. Trace ID: ${traceId}`}
    >
      <span className="receipt-stamp">
        <span className="receipt-label">AUTH OK</span>
        <span className="receipt-separator">/</span>
        <span className="receipt-trace">TRACE: {traceId}</span>
        <span className="receipt-separator">/</span>
        <span className="receipt-timestamp">{timestamp}</span>
      </span>

      <style jsx>{`
        .receipt-stamp {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-ember-bright);
          opacity: 0.75;
        }

        .receipt-separator {
          opacity: 0.35;
          margin: 0 0.4em;
        }

        .receipt-trace {
          color: var(--color-ember-glow);
          opacity: 0.9;
        }

        .receipt-timestamp {
          color: var(--color-text-secondary);
          opacity: 0.6;
        }
      `}</style>
    </motion.div>
  )
}
```

**Design notes:**

- Typography exactly matches VISUAL-DESIGN-SPEC.md Section 3.4: Geist Mono, 10px, weight 500, tracking 0.12em, uppercase.
- Color hierarchy: label in `--color-ember-bright`, trace ID in `--color-ember-glow` (brightest), timestamp in `--color-text-secondary` (most muted), separators dimmed to 0.35 opacity.
- Renders as: `AUTH OK / TRACE: 7F2A / 2026-02-25T15:42:18Z`
- The `extractTraceId` utility is exported so the `LoginScene` can derive the trace ID from the session UUID.
- `role="status"` and `aria-live="polite"` announce the successful auth to screen readers without interrupting.
- Entry animation: subtle 8px upward slide + fade-in over 300ms with `--ease-morph`.

---

### 4.7 File: `src/components/auth/login-scene.tsx`

The main orchestrator component for the login experience. Manages the state machine that drives the theatrical flow: idle (attractor breathing) -> activated (field materialized) -> authenticating -> success (receipt stamp + transition) or failure (shake + reset).

**Exact file contents:**

```tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { unstable_ViewTransition as ViewTransition } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { AttractorGlyph } from './attractor-glyph'
import { PassphraseField } from './passphrase-field'
import { ReceiptStamp, extractTraceId } from './receipt-stamp'
import { Scanline } from './scanline'
import { FIELD_MATERIALIZE_DURATION, RECEIPT_DISPLAY_DURATION } from './constants'

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

type LoginPhase =
  | 'idle' // Attractor glyph breathing, waiting for keypress
  | 'materializing' // Field animating in, scanline sweeping
  | 'input' // Field visible, user typing passphrase
  | 'authenticating' // Validating passphrase
  | 'success' // Receipt stamp displayed, awaiting transition
  | 'failure' // Shake playing, then resets to 'input'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginScene() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const sessionKey = useAuthStore((s) => s.sessionKey)
  const hydrate = useAuthStore((s) => s.hydrate)

  const [phase, setPhase] = useState<LoginPhase>('idle')
  const [passphrase, setPassphrase] = useState('')
  const [receiptTimestamp, setReceiptTimestamp] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Hydrate auth state from sessionStorage on mount.
  // If already authenticated, redirect immediately.
  useEffect(() => {
    hydrate()
  }, [hydrate])

  const authenticated = useAuthStore((s) => s.authenticated)
  useEffect(() => {
    if (authenticated) {
      router.replace('/')
    }
  }, [authenticated, router])

  // -------------------------------------------------------------------------
  // Any-key-to-type activation
  // -------------------------------------------------------------------------

  const handleGlobalKeyDown = useCallback(
    (e: globalThis.KeyboardEvent) => {
      if (phase !== 'idle') return

      // Only activate on alphanumeric keys (no modifiers except Shift for uppercase)
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (!/^[a-zA-Z0-9]$/.test(e.key)) return

      e.preventDefault()
      setPassphrase(e.key)
      setPhase('materializing')
    },
    [phase]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleGlobalKeyDown])

  // -------------------------------------------------------------------------
  // Phase: materializing -> input (after field animation completes)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (phase !== 'materializing') return

    const timer = setTimeout(() => {
      setPhase('input')
      // Focus the input after materialization completes
      inputRef.current?.focus()
    }, FIELD_MATERIALIZE_DURATION)

    return () => clearTimeout(timer)
  }, [phase])

  // -------------------------------------------------------------------------
  // Submit handler
  // -------------------------------------------------------------------------

  const handleSubmit = useCallback(() => {
    if (phase !== 'input') return
    if (passphrase.length === 0) return

    setPhase('authenticating')

    const success = login(passphrase)

    if (success) {
      setReceiptTimestamp(new Date().toISOString())
      setPhase('success')
    } else {
      setPhase('failure')
    }
  }, [phase, passphrase, login])

  // -------------------------------------------------------------------------
  // Phase: success -> ViewTransition to hub
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (phase !== 'success') return

    const timer = setTimeout(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (prefersReduced || typeof ViewTransition === 'undefined') {
        router.push('/')
      } else {
        ViewTransition(() => {
          router.push('/')
        })
      }
    }, RECEIPT_DISPLAY_DURATION)

    return () => clearTimeout(timer)
  }, [phase, router])

  // -------------------------------------------------------------------------
  // Phase: failure shake complete -> reset to input
  // -------------------------------------------------------------------------

  const handleShakeComplete = useCallback(() => {
    setPassphrase('')
    setPhase('input')
    inputRef.current?.focus()
  }, [])

  // -------------------------------------------------------------------------
  // Derived animation states
  // -------------------------------------------------------------------------

  const glyphVisible = phase === 'idle'
  const scanlineActive = phase === 'materializing'

  const fieldPhase = (() => {
    switch (phase) {
      case 'idle':
        return 'hidden' as const
      case 'materializing':
        return 'visible' as const
      case 'input':
      case 'authenticating':
        return 'visible' as const
      case 'success':
        return 'collapsed' as const
      case 'failure':
        return 'shake' as const
    }
  })()

  const showReceipt = phase === 'success'

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="bg-void fixed inset-0 flex flex-col items-center justify-center">
      {/* Attractor glyph -- breathing ember dot */}
      <AttractorGlyph visible={glyphVisible} />

      {/* Scanline sweep -- triggered on field materialization */}
      <Scanline active={scanlineActive} />

      {/* Passphrase field */}
      <PassphraseField
        ref={inputRef}
        phase={fieldPhase}
        value={passphrase}
        onChange={setPassphrase}
        onSubmit={handleSubmit}
        onShakeComplete={handleShakeComplete}
      />

      {/* Receipt stamp -- appears on successful auth */}
      {showReceipt && (
        <div className="mt-6">
          <ReceiptStamp traceId={extractTraceId(sessionKey)} timestamp={receiptTimestamp} />
        </div>
      )}
    </div>
  )
}
```

**Design notes:**

- The component is a **state machine** with 6 phases: `idle`, `materializing`, `input`, `authenticating`, `success`, `failure`. Each phase maps deterministically to animation states for the glyph, scanline, field, and receipt stamp.
- **Any-key-to-type activation:** The global `keydown` listener only fires in the `idle` phase. It filters for alphanumeric keys (ignoring Ctrl/Meta/Alt modifiers, Tab, Escape, arrows, etc.). The pressed key is captured as the first character in the passphrase input via `setPassphrase(e.key)`.
- **Materialization timing:** After the `materializing` phase begins, a `FIELD_MATERIALIZE_DURATION` (400ms) timeout transitions to `input` and focuses the field. The scanline sweep runs concurrently during this phase.
- **ViewTransition:** Uses React 19's `unstable_ViewTransition` API. If `ViewTransition` is undefined (older browser) or `prefers-reduced-motion` is active, falls back to `router.push()`.
- **Hydration guard:** On mount, `hydrate()` checks `sessionStorage`. If the user is already authenticated (same tab, page refresh), the component redirects to `/` immediately, skipping the login ceremony.
- **Accessibility:** The passphrase field has `aria-label="Passphrase"`. The receipt stamp uses `role="status"` with `aria-live="polite"`. Screen readers receive a clean flow: unlabeled glyph (decorative) -> "Passphrase" input -> "Authentication successful" status announcement.

---

### 4.8 File: `src/app/login/page.tsx`

The Next.js route for `/login`. A thin Server Component that renders the client-side `LoginScene`.

**Exact file contents:**

```tsx
import type { Metadata } from 'next'
import { LoginScene } from '@/components/auth/login-scene'

export const metadata: Metadata = {
  title: 'Tarva Launch',
}

export default function LoginPage() {
  return <LoginScene />
}
```

**Design notes:**

- The page is intentionally minimal. No layout chrome, no header, no footer.
- `metadata.title` is "Tarva Launch" (not "Login" -- the page should feel like an entry point, not a gate).
- The `LoginScene` is a `"use client"` component that handles all interactivity.

---

### 4.9 File: `src/app/(launch)/layout.tsx` -- Auth Guard Addition

The `(launch)/` route group layout must check authentication and redirect to `/login` if the user is unauthenticated. This is a **modification** to the existing layout file (created by WS-1.2), not a net-new file. The guard is the only addition from this workstream.

**Auth guard pattern to add:**

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const hydrate = useAuthStore((s) => s.hydrate)
  const authenticated = useAuthStore((s) => s.authenticated)

  // Hydrate auth state from sessionStorage on mount.
  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Redirect to login if not authenticated.
  useEffect(() => {
    // Wait one tick after hydration to avoid flash.
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().authenticated) {
        router.replace('/login')
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [authenticated, router])

  // While checking auth, render nothing to avoid a flash of protected content.
  if (!authenticated) {
    return <div className="bg-void fixed inset-0" aria-hidden="true" />
  }

  return <>{children}</>
}
```

**Design notes:**

- The guard uses `useAuthStore.getState()` inside a `setTimeout(0)` to read the state after hydration has run, avoiding a race condition where `authenticated` is still `false` on the first render before `hydrate()` completes.
- While unauthenticated, a full-screen `bg-void` div is rendered as a blank placeholder. This prevents a flash of protected content while the redirect is in flight. The `bg-void` color matches the login page background, creating a seamless visual.
- The guard is client-side only. There is no middleware-based redirect because the auth mechanism is purely `sessionStorage` (client-side state). Server Components and middleware cannot read `sessionStorage`.

---

### 4.10 File: `src/app/login/login.css` (optional, co-located stylesheet)

If the implementer prefers co-located CSS over styled-jsx for the login-specific keyframes, this file can house the `@keyframes breathe` and `@keyframes scan` definitions. This is an **optional** alternative to the inline `<style jsx>` blocks in the component files. The SOW specifies the styled-jsx approach in the component deliverables above; if the implementer prefers a CSS module or co-located stylesheet, the keyframe definitions should be extracted here.

---

### 4.11 Verification Checklist

The implementer must verify the following after creating all deliverable files:

| Check                         | How to Verify                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Login page renders            | Navigate to `/login`; see void background and breathing glyph                            |
| Glyph breathes                | Observe 5s ember glow oscillation on the center dot                                      |
| Any-key activation            | Press `a` key; field materializes with scanline sweep; `a` appears in field              |
| Non-alphanumeric keys ignored | Press Tab, Escape, Arrow keys on idle page; no field materialization                     |
| Modifier keys ignored         | Press Ctrl+A, Cmd+C on idle page; no field materialization                               |
| Valid passphrase accepted     | Type correct passphrase + Enter; field collapses, receipt stamp appears                  |
| Receipt stamp format          | Receipt reads `AUTH OK / TRACE: XXXX / {ISO timestamp}` in Geist Mono                    |
| ViewTransition fires          | After receipt stamp, page transitions to hub with 600ms morph                            |
| Invalid passphrase rejected   | Type wrong passphrase + Enter; field shakes, clears, no error text                       |
| Session persists on refresh   | After login, refresh page; still authenticated (no re-login required)                    |
| Session clears on tab close   | Close tab, open new tab to `/`; redirected to `/login`                                   |
| Auth guard works              | Navigate directly to `/` while unauthenticated; redirected to `/login`                   |
| Reduced motion respected      | Enable `prefers-reduced-motion`; no animations, field appears instantly                  |
| Accessibility                 | VoiceOver: "Passphrase" announced on field focus; "Authentication successful" on receipt |

---

## 5. Acceptance Criteria

1. **Route `/login` renders a full-screen void page** with background color `#050911` and no visible UI chrome (no header, no navigation, no footer). Only the breathing attractor glyph is visible on initial load.

2. **Attractor glyph uses the exact breathing animation** from VISUAL-DESIGN-SPEC.md Section 5.3: 5s `ease-in-out` cycle, `box-shadow` oscillating between `0 0 20px rgba(224, 82, 0, 0.06), 0 0 8px rgba(224, 82, 0, 0.10)` (min) and `0 0 48px rgba(224, 82, 0, 0.14), 0 0 16px rgba(224, 82, 0, 0.22)` (max).

3. **Any alphanumeric keypress activates the login field** with a 400ms Framer Motion materialization animation (opacity 0->1, scaleX 0.85->1, scaleY 0.92->1, blur 4px->0px, eased with `--ease-morph`) accompanied by a scanline sweep (1 primary line + 2 ghost lines, 350ms, ember color). The pressed key appears as the first character in the input.

4. **Non-activating keys are ignored**: Tab, Escape, Enter, Arrow keys, function keys, and modifier combinations (Ctrl+key, Cmd+key, Alt+key) do not trigger field materialization.

5. **The passphrase field** is a single centered `<input type="password">` rendered in Geist Mono with transparent background, using the `@tarva/ui` `Input` component as its base. It has `aria-label="Passphrase"` for accessibility.

6. **Correct passphrase + Enter triggers the success flow**: field collapses (200ms scale-down), receipt stamp materializes (`AUTH OK / TRACE: {4-char-hex} / {ISO-timestamp}` in VISUAL-DESIGN-SPEC.md Section 3.4 typography), then after 600ms a React 19 ViewTransition navigates to the `(launch)/` hub.

7. **Incorrect passphrase + Enter triggers the failure flow**: field shakes horizontally (3 oscillations, 300ms, 6px amplitude), then clears the input. No error text, no toast, no color change.

8. **Auth store** (`src/stores/auth.store.ts`) exposes `authenticated: boolean`, `sessionKey: string`, `login(passphrase): boolean`, `logout(): void`, and `hydrate(): void`. The `login` action writes a `crypto.randomUUID()` session key to `sessionStorage` under the key `tarva-launch-session`.

9. **Session persistence**: after successful login, refreshing the page (same tab) does not require re-authentication. The auth store hydrates from `sessionStorage` on mount.

10. **Session scope**: closing the browser tab clears the session (`sessionStorage` is tab-scoped). Opening a new tab requires re-authentication.

11. **Auth guard**: navigating directly to any `(launch)/` route while unauthenticated redirects to `/login`. No flash of protected content occurs during the redirect.

12. **Reduced motion**: when `prefers-reduced-motion: reduce` is active, all animations are replaced with instant state changes. The glyph shows a static glow, the field appears immediately, no scanline, no shake, and `router.push()` replaces `ViewTransition`.

13. **No naming violations**: code uses "ember"/"teal" (never "frost"/"cyan"), `@tarva/ui` (never standalone "shadcn"), and `(launch)/` (never `(hub)/`) throughout all files.

---

## 6. Decisions Made

| ID       | Decision                                                                                                                                                       | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                               | Source                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| D-1.3.1  | Hardcode passphrase as a module-level constant in `auth.store.ts`, not in an environment variable or `.env` file                                               | Stakeholder directive: this is an internal localhost tool. The passphrase is a ceremonial gate, not a security boundary. Keeping it in-code simplifies deployment (no `.env` management) and is consistent with the tech decision: "hardcoded value in codebase (internal localhost tool, no env var needed)".                                                                                                                                          | [SPEC] tech-decisions.md Auth section                     |
| D-1.3.2  | Use a manual `hydrate()` action instead of Zustand `persist` middleware for `sessionStorage` sync                                                              | The Zustand `persist` middleware serializes the entire store to storage on every state change and deserializes on init. For the auth store, only the `sessionKey` string is persisted, and `authenticated` is derived from its presence. A manual `hydrate()` is simpler, avoids unnecessary serialization overhead, and gives explicit control over when hydration occurs (critical for avoiding flash of unauthenticated state).                      | [INFERENCE]                                               |
| D-1.3.3  | Use client-side auth guard (not Next.js middleware) for route protection                                                                                       | The auth mechanism is purely `sessionStorage`, which is not accessible in server-side middleware. Middleware would need cookies or headers. A client-side check in the `(launch)/` layout is the correct approach for this auth model. The tradeoff is a brief moment where the layout renders a blank `bg-void` div before redirecting, but this is visually indistinguishable from the login page.                                                    | [INFERENCE] from tech-decisions.md (sessionStorage)       |
| D-1.3.4  | Attractor glyph is centered on the viewport, not positioned in the "upper-right third" as the storyboard suggests                                              | The combined requirements specify "one animated attractor glyph" using the "hub center breathing animation" -- a centered position. The storyboard's "upper-right third" placement was an early narrative concept; the functional requirement for a centered glyph (matching the hub center position) provides better spatial continuity with the post-login hub view. The glyph IS the hub center, seen before the surrounding workspace materializes. | [SPEC] combined-recommendations.md overrides [STORYBOARD] |
| D-1.3.5  | The `LoginScene` is a single client component that orchestrates the full flow via a state machine, not split into separate route segments or server components | The login experience is a single, continuous animation sequence. Splitting it into server/client boundaries would introduce hydration gaps that break the theatrical flow. All state (phase, passphrase, receipt) is ephemeral and client-only.                                                                                                                                                                                                         | [INFERENCE]                                               |
| D-1.3.6  | Use `unstable_ViewTransition` from React 19 with a fallback to `router.push()`                                                                                 | The React 19 ViewTransition API is the intended mechanism for scene-level transitions (per tech-decisions.md). The `unstable_` prefix means the API may change, but it is the correct API for Next.js 16 + React 19. The fallback ensures the login works even if the API is unavailable or renamed.                                                                                                                                                    | [SPEC] tech-decisions.md Animation section                |
| D-1.3.7  | Use styled-jsx for component-scoped keyframe animations instead of a global CSS file                                                                           | The breathing, scanline, and receipt stamp animations are scoped to specific components and should not pollute the global CSS namespace. Styled-jsx provides component-level scoping without the overhead of CSS Modules for keyframes. If the implementer prefers CSS Modules, the keyframes can be extracted to co-located `.module.css` files.                                                                                                       | [INFERENCE]                                               |
| D-1.3.8  | The passphrase field uses `type="password"` with no visibility toggle                                                                                          | The passphrase is short (5 characters), typed from memory, and entered infrequently. A visibility toggle adds UI complexity to a page designed for minimal chrome. The theatrical flow benefits from the input appearing as dots -- it reinforces the "secret code" ritual.                                                                                                                                                                             | [INFERENCE] from storyboard "ritual" framing              |
| D-1.3.9  | Receipt stamp trace ID is the first 4 hex characters of the session UUID, uppercased                                                                           | This provides a human-readable shorthand that matches the `TRACE: 7F2A` format shown in VISUAL-DESIGN-SPEC.md Section 3.4. The full UUID is stored in `sessionStorage` for programmatic use; the 4-char excerpt is purely for display.                                                                                                                                                                                                                  | [SPEC] VISUAL-DESIGN-SPEC.md Section 3.4                  |
| D-1.3.10 | Field materialization uses `scaleX: 0.85 -> 1, scaleY: 0.92 -> 1` with blur, not a clip-path reveal                                                            | Scale+blur creates an organic "growing into existence" effect that aligns with the spatial aesthetic. Clip-path would create a hard edge reveal that feels more "web" and less "spatial instrument." The asymmetric scale (X wider than Y) mimics a horizontal scanline calibration.                                                                                                                                                                    | [INFERENCE]                                               |

---

## 7. Open Questions

| ID      | Question                                                                                                                                                                             | Impact                                                        | Proposed Resolution                                                                                                                                                                                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-1.3.1 | What is the exact passphrase value? The SOW uses `"tarva"` as a placeholder.                                                                                                         | Low -- trivially changeable.                                  | Confirm with stakeholder. The value is a module-level constant in `auth.store.ts` and can be changed in a single line.                                                                                                                                                                                                    |
| Q-1.3.2 | Should the login page include ambient effects (particle drift, film grain) from WS-1.6, or should it remain a pure void with only the glyph?                                         | Medium -- affects visual density of the login experience.     | Propose: the login page starts as pure void (glyph only). If WS-1.6 implements ambient effects as a global overlay, they will naturally appear on the login page as well. This keeps the login page dependency-free from WS-1.6.                                                                                          |
| Q-1.3.3 | Should the login page be the app's index route (`/`), or should `/` be the hub with `/login` as a separate route?                                                                    | Medium -- affects routing structure.                          | Propose: `/login` is a separate route. The index route `/` lives inside the `(launch)/` route group and is the hub/atrium. The auth guard on `(launch)/layout.tsx` redirects unauthenticated users from `/` to `/login`. This keeps the login outside the protected route group, which is cleaner architecturally.        |
| Q-1.3.4 | Does the React 19 `unstable_ViewTransition` API require any specific configuration in `next.config.ts` to enable?                                                                    | Low -- if configuration is needed, it is a one-line addition. | Check Next.js 16 documentation. In Next.js 15, ViewTransition support was experimental. Next.js 16 may have stabilized it. The `unstable_` import from `react` should work out of the box.                                                                                                                                |
| Q-1.3.5 | Should the `(launch)/` layout be a client component (required for the auth guard) or should the auth guard be a separate wrapper component to keep the layout as a Server Component? | Low -- architectural preference.                              | Propose: make the layout a client component for simplicity. The `(launch)/` layout will likely need client-side state for other purposes (ZUI camera, UI store) anyway. If server-side rendering of the layout shell is desired, extract the auth guard into a `<AuthGate>` wrapper component rendered inside the layout. |

---

## 8. Risk Register

| ID      | Risk                                                                                                                                                                                                                          | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1.3.1 | **React 19 ViewTransition API instability** -- The `unstable_ViewTransition` import may change or be removed in a React 19 patch release.                                                                                     | Medium     | Medium | The `LoginScene` already includes a fallback to `router.push()` when `ViewTransition` is undefined. If the API is renamed, a single import path change fixes it. Pin the React 19 minor version in `package.json` to avoid surprise breakage.                                                                                                                                                                                                                                                         |
| R-1.3.2 | **sessionStorage unavailable in SSR** -- The auth store's `hydrate()` and `login()` actions access `sessionStorage`, which does not exist during server-side rendering.                                                       | Low        | High   | All `sessionStorage` access is wrapped in `try/catch` blocks. The store initializes with `authenticated: false` and only hydrates on the client after mount. The `LoginScene` and auth guard are both `"use client"` components, so `sessionStorage` is always available when these actions run.                                                                                                                                                                                                      |
| R-1.3.3 | **Flash of unprotected content** -- The `(launch)/` auth guard is client-side. On initial page load of a protected route, there is a brief moment between SSR and client hydration where the layout has not yet checked auth. | Medium     | Medium | The guard renders a full-screen `bg-void` div while `authenticated` is `false`, matching the login page background exactly. The user sees a continuous dark void -- no flash of protected content, no layout shift. The redirect fires after hydration + setTimeout(0).                                                                                                                                                                                                                               |
| R-1.3.4 | **Styled-jsx compatibility with Next.js 16** -- Styled-jsx has been the default CSS-in-JS solution for Next.js, but its status may change in Next.js 16.                                                                      | Low        | Medium | If styled-jsx is deprecated or removed, replace the inline `<style jsx>` blocks with co-located CSS Modules (`.module.css` files) or move the keyframes to `globals.css`. The animation values are specified in this SOW and are implementation-format-agnostic.                                                                                                                                                                                                                                      |
| R-1.3.5 | **Framer Motion bundle size** -- Framer Motion adds ~30KB (gzipped) to the client bundle. The login page only uses it for the field materialization and shake animations.                                                     | Low        | Low    | Framer Motion is already a project dependency (per tech-decisions.md). The login page's use of `motion.div` and `Variants` is minimal. If bundle size becomes a concern, the materialization animation could be reimplemented with CSS `@keyframes` and the shake with a CSS animation, eliminating the Framer Motion dependency on the login route. The Framer Motion approach is specified here because it provides the imperative `onAnimationComplete` callback needed for the shake->reset flow. |
| R-1.3.6 | **Global keydown listener interference** -- The any-key-to-type listener captures keystrokes globally. If browser extensions or OS-level shortcuts overlap, the listener may swallow intended shortcuts.                      | Low        | Low    | The listener only fires in the `idle` phase and only captures alphanumeric keys without Ctrl/Meta/Alt modifiers. Browser shortcuts (Ctrl+T, Cmd+L, etc.) use modifiers and are not captured. The listener calls `e.preventDefault()` only on the activating keypress, not on subsequent typing (which is handled by the input's own event system).                                                                                                                                                    |
| R-1.3.7 | **Race condition between hydrate() and auth guard redirect** -- If `hydrate()` runs asynchronously or is delayed, the auth guard may redirect before `sessionStorage` is checked.                                             | Medium     | High   | The auth guard in `(launch)/layout.tsx` uses `setTimeout(0)` to defer the redirect check to the next microtask, after `hydrate()` has set state. Additionally, the guard reads `useAuthStore.getState()` (synchronous snapshot) inside the timeout, not the React state variable, ensuring it sees the latest store state.                                                                                                                                                                            |
