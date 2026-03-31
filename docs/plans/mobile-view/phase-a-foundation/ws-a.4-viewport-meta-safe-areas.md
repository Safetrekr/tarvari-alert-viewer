# WS-A.4: Viewport Meta + Safe Areas

> **Workstream ID:** WS-A.4
> **Phase:** A -- Foundation
> **Assigned Agent:** `react-developer`
> **Size:** S
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** None
> **Blocks:** WS-A.2 (MobileShell, MobileHeader, MobileBottomNav consume safe area tokens)
> **Resolves:** OVERVIEW R16 (viewport meta), Client Q8 (allow viewport zoom), Assumption 11 (safe area inset support validated)

---

## 1. Objective

Configure the Next.js viewport meta tag for edge-to-edge rendering on notched devices and establish CSS custom properties that expose safe area insets as consumable design tokens. This workstream provides the foundation layer that WS-A.2 (Mobile Layout Shell) and all subsequent mobile components build upon. Desktop rendering must remain identical after these changes.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Viewport export | Add `export const viewport: Viewport` to `src/app/layout.tsx` with `width: 'device-width'`, `initialScale: 1`, `viewportFit: 'cover'`. No `userScalable: false`. No `maximumScale`. |
| Safe area CSS tokens | Define `--safe-area-top`, `--safe-area-bottom`, `--safe-area-left`, `--safe-area-right` custom properties on `:root`, aliasing `env(safe-area-inset-*)` with `0px` fallbacks. |
| Tailwind v4 theme bridge | Register safe area tokens into the Tailwind theme namespace via `@theme` in `globals.css` so they are consumable as `p-[var(--safe-area-bottom)]` or similar patterns. |
| `100dvh` audit | Identify all existing `100vh` usages in `src/` and document which need migration to `100dvh` for mobile. Desktop CSS is not modified -- the audit produces a reference list for WS-A.2 and later workstreams. |
| Desktop regression guard | Verify the viewport meta change produces no visual or behavioral change on desktop browsers (Chromium, Firefox, Safari). |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Consuming safe area tokens in components | WS-A.2 applies `--safe-area-top` to MobileHeader and `--safe-area-bottom` to MobileBottomNav. WS-A.4 only defines the tokens. |
| Mobile tokens file (`mobile-tokens.css`) | WS-A.3 (Design Tokens + Ambient) creates `src/styles/mobile-tokens.css`. Safe area tokens defined here are global (they resolve to `0px` on desktop, real values on notched devices). |
| `100vh` to `100dvh` code changes | This WS audits and documents. Actual migration happens in WS-A.2 (MobileShell layout) and per-component workstreams. |
| PWA manifest or `apple-mobile-web-app-capable` | WS-F.3 (Performance + PWA). |
| Service worker or offline support | Explicitly excluded per Client Q1. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/app/layout.tsx` | Existing `Metadata` export to verify no conflicts with new `Viewport` export | Available -- reviewed. No existing viewport export. |
| Next.js 16 App Router API | `Viewport` type from `next` for the separate viewport export | Available -- Next.js 14+ supports `export const viewport`. |
| `src/styles/spatial-tokens.css` | Existing `:root` token structure to follow the same pattern for safe area tokens | Available -- reviewed. Tokens use `--token-name: value` on `:root`. |
| `src/app/globals.css` | Existing `@theme` bridge pattern for registering tokens into Tailwind v4 | Available -- reviewed. Two `@theme inline` blocks plus one `@theme` block. |
| Combined Recommendations | Constraint: no `user-scalable=no` (WCAG 1.4.4). Constraint: `viewport-fit=cover` required. | Documented in combined-recommendations.md line 359, OVERVIEW R16, Client Q8. |

---

## 4. Deliverables

### D1: Viewport Export in `layout.tsx`

Add a `viewport` export to `src/app/layout.tsx` using the Next.js App Router `Viewport` type.

```typescript
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}
```

**What this produces in the rendered HTML:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

**What is deliberately omitted:**
- `maximumScale` -- omitted to allow pinch-zoom (WCAG 1.4.4)
- `userScalable` -- omitted (defaults to `yes`). Never set to `no`.

**Why `viewport-fit=cover`:** Without this value, `env(safe-area-inset-*)` returns `0px` on all devices. The `cover` value tells the browser to extend the layout into the safe areas, and the CSS environment variables then report the actual inset distances so developers can manually add padding where needed.

### D2: Safe Area CSS Custom Properties

Add safe area token definitions to `src/styles/spatial-tokens.css` in the existing `:root` block.

```css
/* ============================================================
   SAFE AREA INSETS (populated by viewport-fit=cover)
   On devices without notch/home indicator, these resolve to 0px.
   ============================================================ */
--safe-area-top: env(safe-area-inset-top, 0px);
--safe-area-right: env(safe-area-inset-right, 0px);
--safe-area-bottom: env(safe-area-inset-bottom, 0px);
--safe-area-left: env(safe-area-inset-left, 0px);
```

**Rationale for `:root` (not `@media` scoped):** `env(safe-area-inset-*)` returns `0px` on devices without safe areas. No media query gating is needed -- the values self-gate. Defining them globally makes them available to both desktop and mobile code paths without conditional logic.

### D3: Tailwind v4 Theme Bridge

**Insertion point: `src/app/globals.css` `@theme` block (lines 126-167). Append inside the existing `@theme` block before the closing `}` on line 167.**

Note: WS-A.3 also appends to this same `@theme` block (mobile layout spacing tokens). These additions are non-conflicting -- they define different token namespaces (`--spacing-safe-area-*` vs `--spacing-header-height` etc.). Insert WS-A.4 tokens first (safe area), then WS-A.3 tokens (mobile layout), to keep infrastructure tokens before feature tokens.

Add safe area spacing tokens:

```css
  /* Safe area insets (from env() via spatial-tokens.css) */
  --spacing-safe-area-top: var(--safe-area-top);
  --spacing-safe-area-right: var(--safe-area-right);
  --spacing-safe-area-bottom: var(--safe-area-bottom);
  --spacing-safe-area-left: var(--safe-area-left);
```

This enables usage in Tailwind classes like `pb-[--spacing-safe-area-bottom]` and in inline styles via `var(--spacing-safe-area-bottom)`.

### D4: `100vh` Usage Audit Document

Produce an inline comment block or a short reference table (in this SOW, section below) documenting every `100vh` usage in `src/` and whether it needs `100dvh` migration for mobile.

**Current `100vh` usages found:**

| File | Line | Context | Mobile Impact | Migration Owner |
|------|------|---------|---------------|-----------------|
| `src/styles/enrichment.css` | 144 | `transform: translateY(100vh)` in `@keyframes` -- moves element off-screen downward | None -- desktop-only ambient animation, excluded from mobile by WS-A.1 code split | N/A |
| `src/styles/login.css` | 48 | `transform: translateY(100vh)` in `@keyframes` -- login page animation | Low -- login page is full-screen already. `100vh` in a transform is a distance calculation, not a height constraint. Acceptable. | N/A |
| `src/components/ambient/horizon-scan-line.tsx` | 10 | JSDoc comment mentioning `100vw x 100vh` | None -- documentation only, not a CSS value | N/A |
| `src/components/coverage/PriorityFeedPanel.tsx` | 253 | `maxHeight: 'calc(100vh - 120px)'` inline style | Medium -- on mobile browsers, `100vh` exceeds the visible viewport when the address bar is visible. Should use `100dvh` in the mobile code path. | WS-D.1 or WS-A.2 (if PriorityFeedPanel is used on mobile) |

**Summary:** No blocking `100vh` issues for Phase A. The one functional usage (PriorityFeedPanel) is in a desktop-oriented component. WS-A.2's MobileShell will use `100dvh` from the start per the design system spec.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Rendered HTML contains `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` | Run `pnpm dev`, inspect page source or DevTools `<head>`. Confirm the meta tag is present with all three directives. |
| AC-2 | Rendered HTML does NOT contain `user-scalable=no` or `maximum-scale` in any viewport meta tag | Grep rendered HTML and `layout.tsx` source for `user-scalable` and `maximum-scale`. Zero matches. |
| AC-3 | `--safe-area-top`, `--safe-area-right`, `--safe-area-bottom`, `--safe-area-left` are defined on `:root` | Open DevTools on any page, inspect `:root` computed styles. All four custom properties are present. On non-notched devices, they resolve to `0px`. |
| AC-4 | Tailwind theme spacing tokens `--spacing-safe-area-top`, `--spacing-safe-area-right`, `--spacing-safe-area-bottom`, `--spacing-safe-area-left` are registered | Verify in DevTools that `var(--spacing-safe-area-bottom)` resolves correctly. Alternatively, apply a test class using the token and confirm it compiles. |
| AC-5 | Desktop visual regression: zero pixel difference | Load the app at 1440px width in Chromium before and after the change. Visually compare the launch grid, category cards, map, and all ambient effects. No changes visible. |
| AC-6 | `pnpm typecheck` passes with zero errors | Run `pnpm typecheck`. Exit code 0. |
| AC-7 | `pnpm build` succeeds | Run `pnpm build`. Exit code 0. Static export produces valid output. |
| AC-8 | On iOS Safari (real device or simulator), `env(safe-area-inset-bottom)` returns a non-zero value when the home indicator is present | Load the page on an iPhone with Face ID (or Simulator with iPhone 15 profile). Inspect `--safe-area-bottom` computed value. It should be approximately `34px` (varies by device). |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DEC-1 | Use Next.js App Router `Viewport` export (not a `<meta>` tag in JSX) | App Router deduplicates and manages viewport meta via the `viewport` export. Placing a `<meta>` tag in `<head>` manually could conflict or duplicate. The `Viewport` type provides type safety. | Manual `<meta>` in `layout.tsx` `<head>` -- rejected because Next.js App Router manages `<head>` content and could produce duplicates. |
| DEC-2 | Define safe area tokens on `:root` (not scoped to a mobile media query) | `env(safe-area-inset-*)` self-gates: it returns `0px` on non-notched devices. Scoping to `@media (max-width: 767px)` would break landscape phones wider than 767px and tablets with notches. Global definition is simpler and correct. | `@media (max-width: 767px)` scope -- rejected because safe areas exist on tablets and landscape phones that exceed 767px. |
| DEC-3 | Place safe area tokens in `spatial-tokens.css` (not a new file) | Follows the existing pattern: all design tokens live in `spatial-tokens.css` under `:root`. Adding a new file for 4 properties adds unnecessary indirection. | New file `safe-area-tokens.css` -- rejected for simplicity. Could also go in `mobile-tokens.css` (WS-A.3) but that would media-scope them incorrectly (see DEC-2). |
| DEC-4 | Audit `100vh` but do not change existing usages | Existing `100vh` usages are in desktop-only code paths or CSS transforms (distance, not layout height). Changing them risks desktop regressions with no mobile benefit since the mobile view is a separate component tree. | Proactively migrate all `100vh` to `100dvh` -- rejected because it risks desktop side effects and the mobile component tree (WS-A.2) will use `100dvh` from the start. |
| DEC-5 | Register safe area tokens in `@theme` (not `@theme inline`) | Safe area spacing tokens are computed from `env()` values that do not change with `[data-color-scheme]` overrides. They belong in the static `@theme` block alongside other spacing tokens, not `@theme inline` which is for color-scheme-reactive values. | `@theme inline` -- would work but is semantically wrong; safe area values do not vary by color scheme. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the `Toaster` component (from `sonner`) respect safe area bottom inset? Currently it uses `offset={52}` which may overlap the home indicator on iOS. | WS-A.2 or WS-F.1 | Phase A or F |
| OQ-2 | The `--space-safe-area-bottom` token defined in the ui-design-system plan (inside `@media (max-width: 767px)`) aliases `env(safe-area-inset-bottom, 0px)`. Does WS-A.3 still need this mobile-scoped alias given that WS-A.4 provides the global `--safe-area-bottom`? | WS-A.3 author | Phase A |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `viewport-fit=cover` causes content to render behind the status bar on iOS, producing visual overlap in existing desktop layout when viewed on iPad Safari | Low | Medium | Safe area tokens default to `0px` on devices without physical insets. iPad Safari with no notch returns `0px`. iPad Pro with Face ID returns real values but the desktop layout does not use safe area tokens, so no overlap occurs. Verify with AC-5 and AC-8. |
| R-2 | Static export (`pnpm build` with `output: 'export'`) does not include the viewport meta tag because it only works with SSR | Low | High | Next.js static export does support `viewport` exports -- it generates the meta tag at build time into the HTML files. Verify with AC-7 and inspect the built HTML. |
| R-3 | Tailwind v4 `@theme` does not support `env()` values resolved through `var()` indirection | Low | Low | The `@theme` block registers `var(--safe-area-bottom)` which Tailwind treats as a static custom property reference. Tailwind does not evaluate `env()` at build time -- it passes through to the browser. If the `@theme` approach fails, the fallback is to use `var(--safe-area-bottom)` directly in component styles without Tailwind utility classes. |
| R-4 | iOS Safari rubber-band scroll interacts poorly with `viewport-fit=cover`, causing content to momentarily appear behind the status bar during overscroll | Medium | Low | This is a known iOS Safari behavior. It affects all `viewport-fit=cover` apps. Mitigation is applied in WS-A.2 via `overscroll-behavior-y: contain` on the MobileShell scroll container. Not a WS-A.4 responsibility but documented here for traceability. Ref: Risk 13 in combined-recommendations.md. |

---

## 9. Implementation Notes

### File Changes Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `src/app/layout.tsx` | Modified | Add `Viewport` type import, add `export const viewport` |
| `src/styles/spatial-tokens.css` | Modified | Add 4 safe area custom properties to `:root` block |
| `src/app/globals.css` | Modified | Add 4 spacing tokens to `@theme` block |

### Estimated Effort

3 files modified, approximately 15 lines of code added. The majority of effort is in verification (AC-5 desktop regression, AC-8 iOS device testing) rather than implementation.

### Verification Sequence

1. Add the viewport export to `layout.tsx`.
2. Run `pnpm typecheck` -- confirms `Viewport` type import is correct.
3. Run `pnpm dev` -- inspect rendered HTML for the meta tag (AC-1, AC-2).
4. Add safe area tokens to `spatial-tokens.css`.
5. Add Tailwind bridge tokens to `globals.css`.
6. Run `pnpm dev` -- inspect `:root` computed styles for token presence (AC-3, AC-4).
7. Compare desktop at 1440px before/after -- no visual change (AC-5).
8. Run `pnpm build` -- confirms static export works (AC-7).
9. Test on iOS Safari device/simulator for real safe area values (AC-8).
