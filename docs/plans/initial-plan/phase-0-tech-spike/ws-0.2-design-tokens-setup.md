# WS-0.2: Design Tokens Setup

> **Workstream ID:** WS-0.2
> **Phase:** 0 -- Tech Spike & Setup
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1
> **Blocks:** WS-1.2, WS-1.3, WS-1.6, WS-2.6, WS-3.7, WS-4.4
> **Resolves:** None

---

## 1. Objective

Establish the complete design token foundation for Tarva Launch by configuring the `@tarva/ui` ThemeProvider with the `tarva-core` dark scheme, defining all ~89 spatial design tokens as CSS custom properties, extending Tailwind CSS v4 via the `@theme` directive, and loading the Geist Sans + Geist Mono font families through `next/font`. This workstream produces the visual vocabulary that every subsequent UI workstream consumes -- no component, layout, or animation work can proceed without it.

---

## 2. Scope

### In Scope

- **ThemeProvider integration** -- Configure `@tarva/ui`'s ThemeProvider in the root layout with `colorScheme="tarva-core"`, `forcedTheme="dark"`, following the established pattern from the Agent Builder frontend [ECOSYSTEM].
- **"use client" provider wrapper** -- Create a re-export wrapper for the ThemeProvider to prevent SSR hydration failures from lost `"use client"` directives during code-splitting, matching the Agent Builder pattern [ECOSYSTEM].
- **Spatial tokens CSS file** -- Define all Launch-specific CSS custom properties (backgrounds, borders, text, ember, teal, status, glow shadows, spacing, capsule dimensions, durations, easing, opacity, blur, typography) in a dedicated CSS file [SPEC].
- **Tailwind v4 `@theme` extension** -- Register spatial color tokens, spacing, durations, easing curves, blur radii, and font families in a Tailwind v4 `@theme` block so they are available as utility classes [SPEC].
- **`@tarva/ui` base token bridge** -- Import `@tarva/ui/styles.css` and wire the `@custom-variant dark` directive, then bridge the existing `@tarva/ui` semantic tokens (`--background`, `--primary`, `--accent`, etc.) into the Tailwind v4 theme namespace using the `@theme inline` pattern [ECOSYSTEM].
- **Geist font loading** -- Configure `next/font/google` for Geist and Geist_Mono with CSS variable output (`--font-geist-sans`, `--font-geist-mono`), applied to `<body>` class [ECOSYSTEM].
- **Base layer styles** -- Apply `border-border`, `outline-ring/50`, `bg-background`, `text-foreground`, and `antialiased` to `body` in the base layer [ECOSYSTEM].
- **Reduced motion support** -- Ensure the `prefers-reduced-motion: reduce` media query from `@tarva/ui/styles.css` propagates; no additional override needed.
- **Token count verification** -- Final deliverable must define exactly the token set from VISUAL-DESIGN-SPEC.md Section 6.1 + Section 6.2, totaling ~89 tokens (6 background + 5 border + 4 text + 6 ember + 6 teal + 12 status + 8 glow + 8 spacing + 6 capsule dims + 11 durations + 6 easing + 10 opacity + 4 blur + 2 fonts + 5 tracking = 99 CSS custom properties, ~89 unique semantic categories per VISUAL-DESIGN-SPEC.md Section 6.3).

### Out of Scope

- **Component implementation** -- No capsule, panel, or HUD components are built in this workstream. Those are WS-1.2 through WS-1.7.
- **Ambient effect CSS/keyframes** -- Particle drift, heartbeat, breathing, grid pulse, scanline, and film grain animations are defined in WS-1.6. This workstream provides only the duration/easing/opacity tokens they will consume.
- **Glass and glow utility classes** -- Reusable `.glass`, `.glass-active`, `.glow-subtle`, `.glow-medium` CSS classes will be created in WS-1.2 (Launch Atrium) or WS-2.6 (Station Panel Framework). The raw token values (e.g., `--glow-ember-subtle`) are defined here.
- **Color scheme switching** -- Launch always runs in forced dark mode with `tarva-core`. No light mode, no theme toggle, no scheme switcher.
- **PostCSS or build tool configuration** -- Project scaffolding (WS-0.1) is responsible for `postcss.config.mjs`, `next.config.ts`, and `tsconfig.json`. This workstream assumes those are already configured per the Tailwind v4 + `@tailwindcss/postcss` pattern.
- **Design token TypeScript exports** -- Programmatic access to tokens via `@tarva/ui/tokens` is already available. No additional TS token file is created here.

---

## 3. Input Dependencies

| Dependency                 | Source             | What It Provides                                                                                                                                                                  |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-0.1 Project Scaffolding | Phase 0            | Next.js 16 project with `src/app/` structure, `postcss.config.mjs` with `@tailwindcss/postcss`, `@tarva/ui` installed as a dependency, route group `(launch)/` created per AD-9   |
| VISUAL-DESIGN-SPEC.md      | Discovery docs     | Canonical token values (Section 6.1 CSS block, Section 6.2 Tailwind block) -- the single source of truth for all hex values, rgba values, timing, and easing curves [SPEC]        |
| @tarva/ui v1.0.0           | npm package        | `styles.css` (base tokens), `providers` export (ThemeProvider, useTarvaTheme), `tokens` export (ColorScheme type), color scheme CSS via `data-color-scheme` attribute [ECOSYSTEM] |
| Agent Builder frontend     | Reference codebase | Proven integration pattern for ThemeProvider, `globals.css`, font loading, and `@theme inline` directive [ECOSYSTEM]                                                              |

---

## 4. Deliverables

### 4.1 File: `src/app/globals.css`

The main CSS entry point. Imports `@tarva/ui` base styles, the Launch spatial tokens, Tailwind, and registers the theme extension. Follows the Agent Builder pattern with Launch-specific modifications.

**Exact file contents:**

```css
/* =================================================================
   Tarva Launch -- Global Stylesheet
   =================================================================
   Layer order:
   1. @tarva/ui base tokens (colors, typography, animations)
   2. Launch spatial tokens (custom properties)
   3. Tailwind CSS v4 engine
   4. @theme inline bridge (makes @tarva/ui tokens Tailwind-usable)
   5. @theme spatial (makes Launch tokens Tailwind-usable)
   6. Base layer (body defaults)
   ================================================================= */

@import '@tarva/ui/styles.css';
@import '../styles/spatial-tokens.css';
@source '../../node_modules/@tarva/ui/dist/**/*.js';
@import 'tailwindcss';

@custom-variant dark (&:is(.dark *));

/* -----------------------------------------------------------------
   Bridge @tarva/ui semantic tokens into Tailwind v4 theme namespace.
   This makes `bg-background`, `text-primary`, etc. work in utilities.
   Pattern source: Agent Builder globals.css [ECOSYSTEM]
   ----------------------------------------------------------------- */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
}

/* -----------------------------------------------------------------
   Register Launch spatial tokens into the Tailwind theme namespace.
   This allows usage like `bg-void`, `text-ember-bright`, `text-text-ghost`,
   `duration-morph`, `ease-hover`, etc. in Tailwind utility classes.
   Source: VISUAL-DESIGN-SPEC.md Section 6.2 [SPEC]
   ----------------------------------------------------------------- */
@theme {
  /* Background scale */
  --color-void: #050911;
  --color-abyss: #0a0f18;
  --color-deep: #0f161f;
  --color-surface: #121720;
  --color-raised: #1c222b;
  --color-overlay: #28313e;

  /* Ember accent (from @tarva/ui --primary) */
  --color-ember-dim: #3a1800;
  --color-ember-muted: #7a3000;
  --color-ember: #e05200;
  --color-ember-bright: #ff773c;
  --color-ember-glow: #ffaa70;
  --color-ember-white: #ffd4b8;

  /* Teal accent (from @tarva/ui --accent) */
  --color-teal-dim: #0f2a35;
  --color-teal-muted: #1a4d5e;
  --color-teal: #277389;
  --color-teal-bright: #3a9ab5;
  --color-teal-glow: #5ec4de;
  --color-teal-white: #a8e0ef;

  /* Status: healthy */
  --color-healthy-dim: #0a2e18;
  --color-healthy: #22c55e;
  --color-healthy-glow: #4ade80;

  /* Status: warning */
  --color-warning-dim: #3a2d06;
  --color-warning: #eab308;
  --color-warning-glow: #facc15;

  /* Status: error */
  --color-error-dim: #3a1212;
  --color-error: #ef4444;
  --color-error-glow: #f87171;

  /* Status: offline */
  --color-offline-dim: #1a1d24;
  --color-offline: #6b7280;
  --color-offline-glow: #9ca3af;

  /* Text scale */
  --color-text-primary: #def6ff;
  --color-text-secondary: #92a9b4;
  --color-text-tertiary: #55667a;
  --color-text-ghost: #33445a;

  /* Spatial spacing */
  --spacing-capsule-padding: 20px;
  --spacing-capsule-gap: 48px;
  --spacing-ring-radius: 300px;
  --spacing-district-padding: 64px;
  --spacing-station-margin: 32px;
  --spacing-station-gap: 24px;
  --spacing-hud-inset: 16px;
  --spacing-hud-inset-lg: 24px;

  /* Animation durations */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-hover: 200ms;
  --duration-transition: 300ms;
  --duration-scanline: 350ms;
  --duration-morph: 600ms;
  --duration-morph-complex: 900ms;
  --duration-ambient-breathe: 5000ms;
  --duration-ambient-heart: 7000ms;
  --duration-ambient-grid: 12000ms;
  --duration-ambient-drift: 45000ms;

  /* Easing curves */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-hover: cubic-bezier(0, 0, 0.2, 1);
  --ease-morph: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-glow: cubic-bezier(0.4, 0, 0.6, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  /* Blur radii for backdrop-filter */
  --blur-ambient: 8px;
  --blur-standard: 12px;
  --blur-active: 16px;
  --blur-heavy: 24px;

  /* Font families */
  --font-sans: 'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
}

/* -----------------------------------------------------------------
   Base layer: default styles for body and universal selectors.
   ----------------------------------------------------------------- */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground antialiased;
  }
}
```

**Traceability notes:**

- The `@theme inline` block is a direct port of the Agent Builder `globals.css` pattern [ECOSYSTEM], ensuring `@tarva/ui` components render correctly with Tailwind v4 utilities.
- The `@theme` block mirrors VISUAL-DESIGN-SPEC.md Section 6.2 exactly [SPEC].
- The `@source` directive scans `@tarva/ui` dist output so Tailwind detects utility usage in library components [ECOSYSTEM].

---

### 4.2 File: `src/styles/spatial-tokens.css`

All Launch-specific CSS custom properties, defined on `:root`. This file is the single source of truth for token values consumed by both CSS and JavaScript at runtime. It is imported by `globals.css` before Tailwind processes.

**Exact file contents:**

```css
/* =================================================================
   Tarva Launch -- Spatial Design Tokens
   =================================================================
   Source of truth: VISUAL-DESIGN-SPEC.md Section 6.1

   These tokens extend @tarva/ui's tarva-core dark scheme with
   Launch-specific values for the spatial ZUI engine: background
   depth stops, accent luminous scales, glow shadow recipes, capsule
   dimensions, ambient animation timings, and glass effect parameters.

   @tarva/ui already defines: --background, --foreground, --primary,
   --accent, --border, --card, --muted, --ring, --status-success,
   --status-warning, --status-danger, --status-neutral, etc.

   The tokens below alias and extend those into the spatial vocabulary.
   ================================================================= */

:root {
  /* ============================================================
     BACKGROUND SCALE (from @tarva/ui tarva-core dark mode)
     ============================================================ */
  --color-void: #050911; /* @tarva/ui --background */
  --color-abyss: #0a0f18;
  --color-deep: #0f161f; /* @tarva/ui --card */
  --color-surface: #121720; /* @tarva/ui --popover */
  --color-raised: #1c222b; /* @tarva/ui --muted */
  --color-overlay: #28313e; /* @tarva/ui --secondary */

  /* ============================================================
     BORDER SCALE (from @tarva/ui --border: #232933)
     ============================================================ */
  --color-border-faint: rgba(255, 255, 255, 0.03);
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-border-default: #232933; /* @tarva/ui --border */
  --color-border-strong: rgba(255, 255, 255, 0.12);
  --color-border-bright: rgba(255, 255, 255, 0.18);

  /* ============================================================
     TEXT SCALE (from @tarva/ui tarva-core dark mode)
     ============================================================ */
  --color-text-primary: #def6ff; /* @tarva/ui --foreground */
  --color-text-secondary: #92a9b4; /* @tarva/ui --muted-foreground */
  --color-text-tertiary: #55667a;
  --color-text-ghost: #33445a;

  /* ============================================================
     ACCENT: EMBER (Primary -- from @tarva/ui --primary: #e05200)
     ============================================================ */
  --color-ember-dim: #3a1800;
  --color-ember-muted: #7a3000;
  --color-ember: #e05200; /* @tarva/ui --primary */
  --color-ember-bright: #ff773c; /* @tarva/ui --ring */
  --color-ember-glow: #ffaa70;
  --color-ember-white: #ffd4b8;

  /* ============================================================
     ACCENT: TEAL (Secondary -- from @tarva/ui --accent: #277389)
     ============================================================ */
  --color-teal-dim: #0f2a35;
  --color-teal-muted: #1a4d5e;
  --color-teal: #277389; /* @tarva/ui --accent */
  --color-teal-bright: #3a9ab5;
  --color-teal-glow: #5ec4de;
  --color-teal-white: #a8e0ef;

  /* ============================================================
     STATUS: HEALTHY (from @tarva/ui --status-success: #22c55e)
     ============================================================ */
  --color-healthy-dim: #0a2e18;
  --color-healthy: #22c55e; /* @tarva/ui --status-success */
  --color-healthy-glow: #4ade80;

  /* ============================================================
     STATUS: WARNING (from @tarva/ui --status-warning: #eab308)
     ============================================================ */
  --color-warning-dim: #3a2d06;
  --color-warning: #eab308; /* @tarva/ui --status-warning */
  --color-warning-glow: #facc15;

  /* ============================================================
     STATUS: ERROR (from @tarva/ui --status-danger: #ef4444)
     ============================================================ */
  --color-error-dim: #3a1212;
  --color-error: #ef4444; /* @tarva/ui --status-danger */
  --color-error-glow: #f87171;

  /* ============================================================
     STATUS: OFFLINE (from @tarva/ui --status-neutral: #6b7280)
     ============================================================ */
  --color-offline-dim: #1a1d24;
  --color-offline: #6b7280; /* @tarva/ui --status-neutral */
  --color-offline-glow: #9ca3af;

  /* ============================================================
     SPACING: SPATIAL ENGINE
     ============================================================ */
  --space-capsule-padding: 20px;
  --space-capsule-gap: 48px;
  --space-ring-radius: 300px;
  --space-district-padding: 64px;
  --space-station-margin: 32px;
  --space-station-gap: 24px;
  --space-hud-inset: 16px;
  --space-hud-inset-lg: 24px;

  /* ============================================================
     DIMENSIONS: CAPSULE
     ============================================================ */
  --capsule-width: 192px;
  --capsule-height: 228px;
  --capsule-radius: 28px;
  --capsule-hover-scale: 1.12;
  --capsule-select-scale: 1.05;
  --capsule-morph-scale: 2;

  /* ============================================================
     ANIMATION: DURATIONS
     ============================================================ */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-hover: 200ms;
  --duration-transition: 300ms;
  --duration-scanline: 350ms;
  --duration-morph: 600ms;
  --duration-morph-complex: 900ms;
  --duration-ambient-breathe: 5000ms;
  --duration-ambient-heart: 7000ms;
  --duration-ambient-grid: 12000ms;
  --duration-ambient-drift: 45000ms;

  /* ============================================================
     ANIMATION: EASING CURVES
     ============================================================ */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-hover: cubic-bezier(0, 0, 0.2, 1);
  --ease-morph: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-glow: cubic-bezier(0.4, 0, 0.6, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  /* ============================================================
     GLOW: EMBER (Primary accent glow)
     ============================================================ */
  --glow-ember-subtle: 0 0 12px rgba(224, 82, 0, 0.08), 0 0 4px rgba(224, 82, 0, 0.12);
  --glow-ember-medium:
    0 0 20px rgba(224, 82, 0, 0.12), 0 0 8px rgba(224, 82, 0, 0.22),
    0 0 2px rgba(255, 170, 112, 0.35);
  --glow-ember-bright:
    0 0 40px rgba(224, 82, 0, 0.18), 0 0 16px rgba(224, 82, 0, 0.3),
    0 0 4px rgba(255, 170, 112, 0.5);

  /* ============================================================
     GLOW: TEAL (Secondary accent glow -- telemetry, data)
     ============================================================ */
  --glow-teal-subtle: 0 0 12px rgba(39, 115, 137, 0.08), 0 0 4px rgba(39, 115, 137, 0.12);
  --glow-teal-medium:
    0 0 20px rgba(39, 115, 137, 0.12), 0 0 8px rgba(39, 115, 137, 0.22),
    0 0 2px rgba(94, 196, 222, 0.35);

  /* ============================================================
     GLOW: STATUS
     ============================================================ */
  --glow-healthy: 0 0 16px rgba(34, 197, 94, 0.12), 0 0 4px rgba(74, 222, 128, 0.25);
  --glow-warning: 0 0 16px rgba(234, 179, 8, 0.12), 0 0 4px rgba(250, 204, 21, 0.25);
  --glow-error: 0 0 16px rgba(239, 68, 68, 0.12), 0 0 4px rgba(248, 113, 113, 0.25);

  /* ============================================================
     OPACITY LEVELS
     ============================================================ */
  --opacity-ambient-particle: 0.12;
  --opacity-ambient-grid: 0.015;
  --opacity-ambient-grid-peak: 0.04;
  --opacity-ambient-grain: 0.035;
  --opacity-dim-offline: 0.4;
  --opacity-glass-rest: 0.03;
  --opacity-glass-hover: 0.06;
  --opacity-glass-active: 0.08;
  --opacity-glass-overlay: 0.8;
  --opacity-text-ambient: 0.5;
  --opacity-text-ghost: 0.2;

  /* ============================================================
     GLASS: BACKDROP BLUR
     ============================================================ */
  --blur-ambient: 8px;
  --blur-standard: 12px;
  --blur-active: 16px;
  --blur-heavy: 24px;

  /* ============================================================
     TYPOGRAPHY
     ============================================================ */
  --font-sans: 'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  --tracking-tight: 0.01em;
  --tracking-normal: 0.02em;
  --tracking-wide: 0.04em;
  --tracking-wider: 0.08em;
  --tracking-widest: 0.12em;
}
```

**Traceability:** Every value above is transcribed verbatim from VISUAL-DESIGN-SPEC.md Section 6.1 [SPEC]. Comments indicate which tokens alias existing `@tarva/ui` values.

---

### 4.3 File: `src/components/providers/theme-provider.tsx`

A `"use client"` re-export wrapper. Required because `@tarva/ui`'s compiled chunks can lose the `"use client"` directive during code-splitting, causing `createContext` SSR failures [ECOSYSTEM].

**Exact file contents:**

```tsx
'use client'

// Re-export from @tarva/ui with "use client" directive.
// The library's compiled chunks lose this directive during code-splitting,
// causing createContext to fail in SSR. This wrapper ensures proper client boundaries.
export { ThemeProvider, useTarvaTheme, useTheme } from '@tarva/ui/providers'
```

**Traceability:** Direct port of the Agent Builder `src/components/providers/theme-provider.tsx` [ECOSYSTEM].

---

### 4.4 File: `src/app/layout.tsx`

The root layout. Loads Geist fonts, wraps children in ThemeProvider with forced dark mode and `tarva-core` scheme.

**Exact file contents:**

```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Tarva Launch',
  description: 'Spatial mission control for Tarva applications',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          colorScheme="tarva-core"
          forcedTheme="dark"
          storageKey="tarva-launch-theme"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

**Key differences from Agent Builder [ECOSYSTEM]:**

- `forcedTheme="dark"` instead of `defaultTheme="system"` -- Launch always runs in dark mode; there is no light theme [SPEC].
- `enableSystem={false}` -- System theme detection is irrelevant when theme is forced.
- `storageKey="tarva-launch-theme"` -- Distinct from Agent Builder to avoid cross-app conflicts.
- `Geist` / `Geist_Mono` variable names use the `--font-geist-sans` / `--font-geist-mono` convention from next/font [ECOSYSTEM]. The spatial-tokens.css file declares `--font-sans` and `--font-mono` with the Geist family names; at runtime, `next/font` injects the actual optimized font-face definitions and the CSS variable binds them.

**Font loading note:** `next/font/google` handles:

- Downloading and self-hosting the Geist and Geist_Mono WOFF2 files at build time (no external requests at runtime).
- Generating `@font-face` declarations with `font-display: swap`.
- Injecting the font into the page via the CSS variable specified by `variable`.
- The `variable` property outputs a CSS class that sets the custom property (e.g., `--font-geist-sans: 'Geist Sans'`). Applying both classes to `<body>` makes both fonts available throughout the tree [ECOSYSTEM].

---

### 4.5 Verification Checklist

The implementer must verify the following after creating all four files:

| Check                            | How to Verify                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `@tarva/ui` styles load          | `pnpm dev` renders `--background: #050911` in dark mode                                          |
| ThemeProvider active             | `document.documentElement` has `class="dark"` and `data-color-scheme="tarva-core"`               |
| Geist Sans renders               | Inspect any text element; computed `font-family` starts with `'__Geist_...'`                     |
| Geist Mono renders               | Inspect a `font-mono` element; computed font is `'__Geist_Mono_...'`                             |
| Spatial tokens resolve           | `getComputedStyle(document.documentElement).getPropertyValue('--color-ember')` returns `#e05200` |
| Tailwind bg-void works           | Applying `className="bg-void"` to a div renders `background-color: #050911`                      |
| Tailwind text-ember-bright works | Applying `className="text-ember-bright"` renders `color: #ff773c`                                |
| Tailwind duration-morph works    | Applying `className="duration-morph"` sets `transition-duration: 600ms`                          |
| Tailwind ease-hover works        | Applying `className="ease-hover"` sets the correct cubic-bezier                                  |
| Glow token resolves              | `var(--glow-ember-subtle)` in a `box-shadow` renders the two-layer shadow                        |
| No FOUC                          | Page loads with dark background; no white flash                                                  |
| Reduced motion                   | With `prefers-reduced-motion: reduce`, all `@tarva/ui` animation durations collapse to `0.01ms`  |

---

## 5. Acceptance Criteria

1. **All four deliverable files exist** at the specified paths and contain the exact content defined in Section 4.
2. **Token parity with VISUAL-DESIGN-SPEC.md Section 6.1** -- Every CSS custom property in the Section 6.1 code block is present in `src/styles/spatial-tokens.css` with identical values. No token is missing; no value is altered.
3. **Tailwind utility generation** -- Spatial tokens registered in the `@theme` block produce working Tailwind utilities. At minimum, verify: `bg-void`, `bg-abyss`, `bg-deep`, `bg-surface`, `bg-raised`, `bg-overlay`, `text-ember`, `text-ember-bright`, `text-teal`, `text-teal-glow`, `bg-healthy`, `bg-warning`, `bg-error`, `bg-offline`, `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `text-text-ghost`, `duration-hover`, `duration-morph`, `ease-default`, `ease-hover`, `ease-morph`, `blur-standard`, `blur-heavy`.
4. **@tarva/ui components render correctly** -- Import any `@tarva/ui` component (e.g., `Button`, `Badge`) into a test page; it renders with `tarva-core` dark mode styling. No missing CSS variables, no unstyled flash.
5. **Forced dark mode** -- The `<html>` element always has `class="dark"`. No system-theme toggle exists. The `data-color-scheme` attribute is always `"tarva-core"`.
6. **Font loading works** -- Both `--font-geist-sans` and `--font-geist-mono` CSS variables resolve to valid font faces. Text renders in Geist Sans by default; elements with `font-mono` render in Geist Mono. Fonts are self-hosted (no runtime requests to Google Fonts CDN).
7. **No runtime errors** -- `pnpm dev` starts without errors. Browser console shows no hydration warnings, no missing CSS variable warnings, no font loading failures.
8. **Glow tokens are usable** -- The compound `box-shadow` tokens (`--glow-ember-subtle`, `--glow-ember-medium`, `--glow-ember-bright`, `--glow-teal-subtle`, `--glow-teal-medium`, `--glow-healthy`, `--glow-warning`, `--glow-error`) can be applied via `shadow-[var(--glow-ember-subtle)]` in Tailwind classes or via `box-shadow: var(--glow-ember-subtle)` in CSS.
9. **No naming violations** -- The tokens use "ember"/"teal" naming (never "frost"/"cyan") and "@tarva/ui" (never standalone "shadcn").

---

## 6. Decisions Made

| ID      | Decision                                                                                                             | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                  | Source                                               |
| ------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| D-0.2.1 | Use `forcedTheme="dark"` instead of `defaultTheme="dark"`                                                            | Launch is a single-theme application. `forcedTheme` prevents any possibility of theme flickering or mismatch, and eliminates the need for a theme toggle. It also removes the `localStorage` read on page load, improving first-paint performance.                                                                                                                                                                                         | [INFERENCE] from VISUAL-DESIGN-SPEC.md (always dark) |
| D-0.2.2 | Separate spatial tokens into `src/styles/spatial-tokens.css` rather than inlining in `globals.css`                   | Keeps `globals.css` focused on Tailwind configuration and layering. The spatial tokens file becomes the single editable source of truth for token values, imported by both `globals.css` (via `@import`) and potentially by other build tools in the future. Matches the single-responsibility principle.                                                                                                                                  | [INFERENCE]                                          |
| D-0.2.3 | Use the `@theme` directive (not `@theme inline`) for spatial tokens                                                  | The `@theme inline` pattern (used for the `@tarva/ui` bridge) tells Tailwind to reference `var()` values dynamically. Spatial tokens use static hex values in `@theme` so Tailwind can inline the resolved value directly into utilities, enabling better tree-shaking and static analysis. The `@theme inline` block is reserved for the `@tarva/ui` bridge where CSS variables must resolve at runtime based on the active color scheme. | [ECOSYSTEM] + [INFERENCE]                            |
| D-0.2.4 | Declare `--font-sans` / `--font-mono` in both `spatial-tokens.css` and `@theme`                                      | The CSS custom property in `spatial-tokens.css` provides the runtime value with fallback chain. The `@theme` declaration makes `font-sans` / `font-mono` available as Tailwind utilities. Both are needed because `@tarva/ui` components reference `var(--font-sans)` while Launch Tailwind markup uses `font-sans`. The `next/font` CSS variable injection overrides the fallback chain at runtime.                                       | [ECOSYSTEM] + [SPEC]                                 |
| D-0.2.5 | Token values follow Section 6.1 of VISUAL-DESIGN-SPEC.md when conflicts exist with narrative sections                | Sections 1.x contain design rationale and some values that were refined by the time Section 6.1 was finalized. When hex values differ between narrative sections and Section 6.1 (e.g., ember-dim `#3a1f00` vs `#3a1800`, teal-dim `#0f2830` vs `#0f2a35`), Section 6.1 takes precedence as the canonical implementation block.                                                                                                            | [SPEC]                                               |
| D-0.2.6 | Glow tokens are defined as CSS custom properties with compound `box-shadow` values, not as Tailwind `@theme` entries | Tailwind v4 `@theme` does not natively support multi-value `box-shadow` tokens. The glow values are defined as CSS custom properties in `spatial-tokens.css` and consumed via `shadow-[var(--glow-ember-subtle)]` arbitrary value syntax in Tailwind, or via `box-shadow: var(--glow-ember-subtle)` in CSS. This is the correct approach for compound shadow tokens.                                                                       | [INFERENCE]                                          |
| D-0.2.7 | Capsule dimension tokens are CSS custom properties only, not registered in `@theme`                                  | Capsule dimensions (`--capsule-width`, `--capsule-height`, `--capsule-radius`, `--capsule-hover-scale`, `--capsule-select-scale`, `--capsule-morph-scale`) are spatial engine internals, not general-purpose Tailwind utilities. They will be consumed directly via `var()` in capsule component CSS. Registering them in `@theme` would pollute the utility namespace.                                                                    | [INFERENCE]                                          |
| D-0.2.8 | Opacity tokens are CSS custom properties only, not registered in `@theme`                                            | Tailwind v4 already has built-in opacity modifiers (e.g., `bg-ember/50`). The spatial opacity tokens (`--opacity-glass-rest`, `--opacity-ambient-grain`, etc.) are design constants for specific effects, not general-purpose utilities. They are consumed via `var()` in effect CSS.                                                                                                                                                      | [INFERENCE]                                          |

---

## 7. Open Questions

| ID      | Question                                                                                                                                                        | Impact                                                                                                                                                                                                                                                                                             | Proposed Resolution                                                                                                                                                                                                                                                                             |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-0.2.1 | Should the `@tarva/ui` `@source` directive path use `../../node_modules` or a package alias?                                                                    | If WS-0.1 configures a different `node_modules` resolution (e.g., pnpm workspace hoisting), the path may need adjustment.                                                                                                                                                                          | Verify with WS-0.1 output. The `../../node_modules/@tarva/ui/dist/**/*.js` path assumes standard `node_modules` at project root, which is correct for pnpm with `shamefully-hoist=true` or npm. If pnpm strict mode is used, the path remains valid because `@tarva/ui` is a direct dependency. |
| Q-0.2.2 | Will `next/font/google` correctly resolve Geist and Geist_Mono in the build environment, or should `next/font/local` with vendored WOFF2 files be used instead? | If the build environment has no internet access (CI air-gap), `next/font/google` will fail. `next/font/local` would be more robust but requires vendoring font files.                                                                                                                              | Default to `next/font/google` (matches Agent Builder pattern). If CI issues arise, switch to `next/font/local` with WOFF2 files in `src/fonts/`. The Geist fonts are SIL OFL licensed and can be vendored freely.                                                                               |
| Q-0.2.3 | Should the `@theme` block register `--spacing-hud-inset-lg` as a spacing token, or will Tailwind v4 auto-detect it from the CSS custom property?                | Tailwind v4 auto-detects `--spacing-*` prefixed tokens for spacing utilities. Need to verify this works for the `hud-inset-lg` suffix.                                                                                                                                                             | Include it explicitly in the `@theme` block. If Tailwind auto-detects it, the explicit registration is harmless (idempotent).                                                                                                                                                                   |
| Q-0.2.4 | Do the `@tarva/ui` animation tokens (`--duration-instant`, `--duration-fast`, etc.) conflict with the Launch spatial duration tokens of the same name?          | `@tarva/ui/styles.css` defines `--duration-instant: 0ms`, `--duration-fast: 150ms`, `--duration-normal: 250ms`, `--duration-slow: 350ms`, `--duration-slower: 500ms`. Launch defines `--duration-instant: 100ms`, `--duration-fast: 150ms`. The `--duration-instant` values differ (0ms vs 100ms). | Launch's `spatial-tokens.css` is imported after `@tarva/ui/styles.css`, so Launch values will override. The `100ms` value for `--duration-instant` is the correct value per VISUAL-DESIGN-SPEC.md. Verify that no `@tarva/ui` component depends on `--duration-instant: 0ms` for correctness.   |

---

## 8. Risk Register

| ID      | Risk                                                                                                                                                                       | Likelihood | Impact   | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-0.2.1 | **@tarva/ui token override conflict** -- Launch spatial tokens may inadvertently override `@tarva/ui` tokens if CSS variable names collide.                                | Medium     | High     | The spatial token naming convention uses `--color-ember-*`, `--color-teal-*`, `--color-void`, etc., which do not collide with `@tarva/ui`'s `--primary`, `--accent`, `--background` namespace. The only overlap is `--duration-instant` and `--duration-fast` (see Q-0.2.4). Document override behavior and verify with `@tarva/ui` component rendering tests.                                                                                                                                      |
| R-0.2.2 | **Tailwind v4 `@theme` + `@theme inline` ordering** -- If the two `@theme` blocks interact unexpectedly, token resolution may break.                                       | Low        | High     | The Agent Builder frontend uses this exact two-block pattern successfully. The `@theme inline` block handles dynamic `var()` references; the `@theme` block handles static values. Tailwind v4 documents this as the intended pattern. Test by verifying both `bg-background` (inline) and `bg-void` (static) resolve correctly.                                                                                                                                                                    |
| R-0.2.3 | **Glow shadow tokens in Tailwind arbitrary values** -- The `shadow-[var(--glow-ember-subtle)]` syntax may not work if Tailwind v4 sanitizes the multi-value shadow string. | Medium     | Medium   | Verify during implementation by applying the class and inspecting computed styles. If Tailwind rejects the syntax, fall back to inline `style={{ boxShadow: 'var(--glow-ember-subtle)' }}` or create utility classes in the base layer (e.g., `.shadow-glow-ember-subtle { box-shadow: var(--glow-ember-subtle); }`).                                                                                                                                                                               |
| R-0.2.4 | **Font variable naming mismatch** -- `next/font` injects `--font-geist-sans` while `@tarva/ui` and spatial tokens reference `--font-sans`.                                 | Low        | Medium   | The `@theme` block and `spatial-tokens.css` both declare `--font-sans: 'Geist Sans', ...` with the full fallback chain. At runtime, `next/font` sets `--font-geist-sans` to the actual optimized font face. The Tailwind `font-sans` utility resolves via `var(--font-sans)`. The font-family list in `--font-sans` includes `'Geist Sans'` as the first entry, which matches the `@font-face` family name injected by `next/font`. This is the same pattern the Agent Builder uses without issues. |
| R-0.2.5 | **WS-0.1 dependency not ready** -- If Project Scaffolding is delayed, this workstream is fully blocked.                                                                    | Low        | Critical | WS-0.1 is the simplest workstream in Phase 0 (scaffolding a Next.js project). If blocked, the four deliverable files can be prepared and committed immediately once scaffolding lands. No work in this SOW depends on any WS-0.1 output beyond the existence of `src/app/`, `postcss.config.mjs`, and `@tarva/ui` in `package.json`.                                                                                                                                                                |
| R-0.2.6 | **VISUAL-DESIGN-SPEC.md values change** -- If the design spec is revised after this workstream completes, tokens will need updating.                                       | Medium     | Low      | Spatial tokens are centralized in a single file (`src/styles/spatial-tokens.css`). A spec change requires updating values in one place, then verifying the `@theme` block matches. The separation of concerns makes this a low-effort change.                                                                                                                                                                                                                                                       |
