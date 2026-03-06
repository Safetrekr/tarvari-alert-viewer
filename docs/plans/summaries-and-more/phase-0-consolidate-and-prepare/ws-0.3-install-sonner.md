# WS-0.3: Install Sonner

> **Workstream ID:** WS-0.3
> **Phase:** 0 -- Consolidate & Prepare
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** None
> **Blocks:** WS-2.5 (notification system)
> **Resolves:** AD-5 (Sonner for Toast Notifications)

## 1. Objective

Install the `sonner` toast notification library and wire the `<Toaster />` provider component into the application's root layout so that any downstream code can call `toast()` to surface in-app notifications. This establishes the notification infrastructure that WS-2.5 (notification system) will build upon for P1/P2 alert toasts, severity-specific styling, and action buttons.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Package installation | Add `sonner` as a production dependency via `pnpm add sonner` |
| Root layout integration | Add `<Toaster />` component to `src/app/layout.tsx` inside the existing provider tree |
| Default configuration | Set position, theme, and z-index props appropriate for the spatial dark-mode UI |
| Z-index coordination | Assign a z-index that renders above all interactive overlays (command palette at z-50) without conflicting with decorative layers |
| Verification | Manual smoke test: import `toast` in a dev-only context and confirm a toast renders visibly and is dismissible |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Custom toast components or templates | WS-2.5 responsibility -- severity icons, category badges, "View" action buttons |
| P1/P2 auto-dismiss timing logic | WS-2.5 responsibility -- "persist until dismissed" vs "auto-dismiss after 8s" |
| Browser Notification API integration | WS-2.5 responsibility -- two-step consent pattern and `Notification` API |
| Audio cues | WS-2.5 responsibility -- configurable notification sounds |
| Custom CSS theming of toast appearance | Deferred to WS-2.5; this workstream uses Sonner's built-in dark theme defaults |
| Supabase Realtime subscription | WS-2.5 responsibility -- the event source that triggers toasts |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|---------------|--------|
| `package.json` | Confirm no existing toast library installed | Verified -- no sonner, react-hot-toast, or similar present |
| `src/app/layout.tsx` | Root layout file where `<Toaster />` will be placed | Exists -- Server Component with ThemeProvider > QueryProvider > children |
| Z-index budget | Full stacking context map to select a non-conflicting z-index | Mapped from codebase (see Section 6, D-3) |
| `sonner` npm package | Latest stable version compatible with React 19 and Next.js 16 | Available on npm |

## 4. Deliverables

### 4.1 Install Command

```bash
pnpm add sonner
```

This adds `sonner` to the `dependencies` section of `package.json`. No dev dependency needed -- the `<Toaster />` component ships in production.

### 4.2 File to Modify

**`src/app/layout.tsx`** -- the root layout (Server Component).

The `<Toaster />` component from Sonner is a Client Component. React allows Server Components to import and render Client Components as leaf nodes, so no `'use client'` directive is needed on the layout itself.

### 4.3 Placement

Add the `<Toaster />` component as a sibling to `{children}` inside the `<ThemeProvider>`, after the `<QueryProvider>` block. Placing it in the root layout (not the launch layout) ensures toasts are available on all routes, including the login page -- enabling future use cases like "session expired" notifications.

```tsx
// src/app/layout.tsx
import { Toaster } from 'sonner'

// Inside the return, after <QueryProvider>{children}</QueryProvider>:
<ThemeProvider ...>
  <QueryProvider>{children}</QueryProvider>
  <Toaster
    position="bottom-right"
    theme="dark"
    richColors
    offset={52}
    toastOptions={{
      className: 'font-sans',
    }}
  />
</ThemeProvider>
```

### 4.4 Recommended Props

| Prop | Value | Rationale |
|------|-------|-----------|
| `position` | `"bottom-right"` | Avoids the TopTelemetryBar (fixed top, z-35). Bottom-right is the conventional position for transient notifications and keeps the primary spatial canvas unobstructed. |
| `theme` | `"dark"` | Matches the app's dark-first design (ThemeProvider `defaultTheme="dark"`). Sonner's dark theme provides appropriate contrast out of the box. |
| `richColors` | `true` | Enables Sonner's built-in severity-specific color treatments (green for success, red for error, yellow for warning). WS-2.5 will build on these for P1/P2 severity mapping. |
| `offset` | `52` | Vertical offset in pixels to clear the BottomStatusStrip (fixed bottom, ~36px tall including border) and the SessionTimecode (fixed bottom-right at z-50). Provides ~16px breathing room above the strip. |
| `toastOptions.className` | `'font-sans'` | Ensures toasts use the app's Geist Sans font (registered as `--font-sans` in the Tailwind theme) rather than Sonner's default system font. |

### 4.5 Z-Index Considerations

The app's current stacking context (from codebase audit):

| Z-Index | Element | Interactive? |
|---------|---------|-------------|
| z-0 | DotGrid (background) | No |
| z-1 | ParticleField (ambient) | No |
| z-10 | CategoryCard inner layers | Yes |
| z-30 | DistrictViewOverlay | Yes |
| z-35 | TopTelemetryBar, BottomStatusStrip, HorizonScanLine | No (pointer-events: none) |
| z-40 | NavigationHUD | Yes |
| z-42 | Geo summary panel | Yes |
| z-45 | TriageRationalePanel | Yes |
| z-50 | CommandPalette (Dialog), CalibrationMarks, SessionTimecode | Mixed (Dialog is interactive; marks/timecode are pointer-events: none) |
| z-9999 | FilmGrain (decorative noise overlay) | No (pointer-events: none) |

**Recommendation:** Use Sonner's default z-index behavior. Sonner renders toasts at `z-[999999999]` by default, which places them above all layers including FilmGrain (z-9999). Since FilmGrain and all higher-z ambient elements use `pointer-events: none`, there is no interaction conflict. The extremely high default z-index is intentional in Sonner's design -- it guarantees toasts remain visible and clickable above any application content including modals and dialogs.

No custom z-index override is needed. If a future workstream introduces a z-index conflict (unlikely given the pointer-events: none pattern on decorative layers), the `Toaster` accepts a `style` prop or a wrapping `className` to adjust.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|-------------------|
| AC-1 | `sonner` appears in `package.json` dependencies after install | `cat package.json \| grep sonner` returns a version entry |
| AC-2 | `pnpm install` completes without errors or peer dependency warnings related to sonner | Run `pnpm install` and inspect output |
| AC-3 | `<Toaster />` is rendered in the root layout (`src/app/layout.tsx`) | Code inspection: Toaster import from 'sonner' and JSX present in RootLayout return |
| AC-4 | `pnpm build` completes without TypeScript or build errors | Run `pnpm build` and verify exit code 0 |
| AC-5 | `pnpm typecheck` passes with no new errors | Run `pnpm typecheck` and verify exit code 0 |
| AC-6 | A test toast is visible and dismissible at runtime | Temporarily add `toast('Test notification')` to a client component, verify it renders in the bottom-right corner above all UI layers, and remove the test code |
| AC-7 | Toast does not visually overlap TopTelemetryBar, BottomStatusStrip, or SessionTimecode | Visual inspection at runtime -- toast appears above the bottom strip with clear separation |
| AC-8 | Toast is keyboard-accessible (dismissible via Escape or close button focus) | Manual keyboard test |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Place `<Toaster />` in root layout, not launch layout | Ensures toasts work on all routes including `/login`. Future use cases (session expiry, auth errors) need toasts outside the auth guard. | Launch layout only -- rejected because it excludes unauthenticated routes |
| D-2 | Use `position="bottom-right"` | Avoids the dense top HUD area (TopTelemetryBar). Bottom-right is the conventional notification position and keeps the central spatial canvas unobstructed. | `top-right` -- rejected due to TopTelemetryBar overlap at z-35. `bottom-left` -- rejected because the Tarva star logo and logout button occupy that corner. `top-center` -- rejected due to TopTelemetryBar collision. |
| D-3 | Accept Sonner's default z-index (no override) | Sonner's default z-index (extremely high) is above all app layers. All app elements at z-9999 and above use `pointer-events: none`, so no interaction blocking occurs. | Explicit `z-[9000]` -- rejected as unnecessary; would add maintenance burden without solving a real conflict. |
| D-4 | Use `theme="dark"` (hardcoded) rather than dynamic theme detection | The app defaults to dark mode and the spatial UI is designed dark-first. The safetrekr color scheme also has a dark variant. Hardcoding avoids Sonner's `"system"` theme flash. | `theme="system"` -- rejected because the app controls its own theme via ThemeProvider, not system preference. Dynamic binding to ThemeProvider -- deferred to WS-2.5 if light mode support is needed. |
| D-5 | Use `richColors` for built-in severity coloring | Provides immediate visual differentiation for `toast.success()`, `toast.error()`, `toast.warning()` without custom CSS. WS-2.5 can override specific toast appearances. | No richColors -- rejected because plain toasts lack visual severity cues that the intel dashboard needs. |
| D-6 | Set `offset={52}` to clear bottom chrome | The BottomStatusStrip is ~36px tall with a 1px top border. Adding ~16px margin gives visual breathing room. The SessionTimecode sits at bottom: 16px, right: 16px -- the offset ensures toasts stack above it. | No offset -- rejected because toasts would visually overlap the BottomStatusStrip. Larger offset (e.g., 80px) -- unnecessary; 52px provides sufficient clearance. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|-------------|
| OQ-1 | Should Sonner respect the dynamic color scheme switcher (tarva-core vs safetrekr)? If so, toast background and text colors would need CSS custom property integration. | react-developer | Phase 2 (WS-2.5) |
| OQ-2 | What maximum number of simultaneous toasts should be visible? Sonner defaults to 3. For a real-time intel feed with burst arrivals, this may need tuning. | react-developer | Phase 2 (WS-2.5) |
| OQ-3 | Should the `<Toaster />` use `closeButton` prop (always show close X) or rely on swipe/auto-dismiss? This affects P1 "persist until dismissed" UX. | react-developer | Phase 2 (WS-2.5) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R-1 | Sonner version incompatible with React 19 or Next.js 16 | LOW | HIGH | Sonner actively supports React 19 and Next.js App Router. Check release notes before install. If incompatible, pin to the last compatible version. |
| R-2 | Toasts visually clash with the spatial dark theme (too bright, wrong font, border style mismatch) | LOW | LOW | Using `theme="dark"` and `toastOptions.className='font-sans'` provides acceptable defaults. Full visual customization is deferred to WS-2.5, which will apply spatial design tokens. |
| R-3 | Toast offset value (52px) does not perfectly clear the BottomStatusStrip on all viewport sizes | LOW | LOW | The BottomStatusStrip uses fixed pixel dimensions (not responsive). The 52px offset is deterministic. Adjust in WS-2.5 if visual testing reveals a gap. |
| R-4 | `pnpm add sonner` introduces a dependency conflict with existing packages | VERY LOW | MEDIUM | Sonner has minimal dependencies (no React peer conflicts at current versions). Run `pnpm install` and verify clean output. |
| R-5 | FilmGrain overlay (z-9999) visually obscures toast text | LOW | LOW | FilmGrain applies a subtle SVG noise filter at very low opacity (0.012). Toast text should remain legible. Verify during AC-6 smoke test. If problematic, adjust FilmGrain opacity or add a `mix-blend-mode` exclusion -- but this is extremely unlikely to be an issue. |
