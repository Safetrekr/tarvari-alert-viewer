# WS-A.3: Design Tokens + Ambient

> **Workstream ID:** WS-A.3
> **Phase:** A -- Foundation
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.1 (mobile component directory `src/components/mobile/` must exist)
> **Blocks:** WS-A.2 (shell consumes spacing, glass, and layout tokens), WS-B.1 (severity colors, typography), WS-B.3 (ThreatPulseBackground keyframes and posture tokens), WS-C.1 (bottom sheet glass, spring config, drag handle tokens), WS-C.2 (sheet category tint, snap point tokens), WS-F.1 (landscape-specific tokens)
> **Resolves:** None

---

## 1. Objective

Create the single-source-of-truth CSS token file for every mobile-specific visual property used across Phases A through F. This file defines spacing, blur, animation timing, typography scale, touch target sizing, glass material recipes, corner bracket dimensions, severity color overrides, bottom sheet properties, ambient animation keyframes, and posture-level tokens -- all scoped inside a `@media (max-width: 767px)` guard so that the desktop experience remains identical.

Additionally, deliver the `MobileScanLine` component: a CSS-only 1px horizontal gradient sweep on a 12s cycle that replaces the desktop `HorizonScanLine` for the mobile viewport.

The desktop application must exhibit zero visual or behavioral changes after this workstream lands.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **Token file creation** | New file `src/styles/mobile-tokens.css` containing all CSS custom properties for mobile, scoped within `@media (max-width: 767px)` |
| **Spacing tokens** | Card padding, card gap, section gap, header height, bottom nav height, bottom sheet handle area, safe area inset references |
| **Blur tokens** | Reduced `backdrop-filter` blur radii for mobile GPU savings (overriding desktop values from `spatial-tokens.css`) |
| **Animation timing tokens** | Faster durations for mobile touch responsiveness (hover, transition, morph, morph-complex) |
| **Touch target tokens** | WCAG 2.2 minimum (44px) and design target (48px) as custom properties |
| **Corner bracket tokens** | Mobile-reduced size, offset, and thickness values |
| **Typography tokens** | Mobile type scale custom properties (hero metric, card metric, section heading, card title, body text, label, caption, ghost, decorative micro) |
| **Glass material tokens** | Header glass, bottom sheet glass, nav bar glass, and category card glass recipes as composable custom properties |
| **Bottom sheet tokens** | Spring config values, drag handle dimensions, snap point percentages, sheet border radius |
| **Severity color overrides** | Mobile contrast-adjusted values for Minor (`#60a5fa`) and Unknown (`#9ca3af` for text usage) |
| **Posture-level tokens** | ThreatPulseBackground color values and animation durations per posture level (LOW, MODERATE, ELEVATED, HIGH, CRITICAL) |
| **Scan line keyframe** | `@keyframes mobile-scan-sweep` for the 12s horizontal sweep |
| **Threat pulse keyframe** | `@keyframes threat-pulse` for the posture-level ambient gradient animation |
| **MobileScanLine component** | `src/components/mobile/MobileScanLine.tsx` -- CSS-only horizontal sweep |
| **Global CSS import** | Add `mobile-tokens.css` import to `src/app/globals.css` after `spatial-tokens.css` |
| **Tailwind v4 theme registration** | Register new mobile tokens in `@theme` block in `globals.css` so they are available as Tailwind utilities |
| **Reduced motion compliance** | All keyframes include `@media (prefers-reduced-motion: reduce)` overrides |
| **Desktop regression** | Verify `pnpm build` succeeds and desktop rendering is unchanged |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileShell` layout component | WS-A.2 consumes tokens; this workstream only defines them |
| `MobileHeader`, `MobileBottomNav` | WS-A.2 builds these components using the glass and spacing tokens |
| `ThreatPulseBackground` React component | WS-B.3 builds the component; this workstream provides keyframes and posture tokens |
| `MobileBottomSheet` component | WS-C.1 builds the component; this workstream provides glass, spring, and snap tokens |
| `EdgeGlowIndicators` component | WS-B.3 scope |
| Viewport meta tag changes | WS-A.4 scope |
| `useIsMobile()` hook | WS-A.1 scope |
| Category color tokens | Already defined in `src/styles/coverage.css` and shared between desktop and mobile |
| Font family tokens | Already defined in `src/styles/spatial-tokens.css` and shared |
| Landscape-specific token overrides | WS-F.1 scope; this workstream defines portrait-first values only |
| `useScrollGatedGlass` hook | WS-B.3 or WS-C.1 scope; this workstream defines the CSS classes it will toggle |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/styles/spatial-tokens.css` | Existing desktop token definitions to override and extend | EXISTS -- 220 lines, defines all `:root` custom properties |
| `src/styles/coverage.css` | Existing category color tokens | EXISTS -- 25 lines, 15 category tokens on `:root` |
| `src/app/globals.css` | Import chain and Tailwind v4 `@theme` registration pattern | EXISTS -- imports `spatial-tokens.css`, registers tokens in two `@theme inline` blocks and one `@theme` block |
| `src/styles/enrichment.css` | Pattern for ambient keyframe definition, `@media (prefers-reduced-motion)`, and `[data-panning]` pause | EXISTS -- 246 lines, established pattern |
| `src/components/ambient/horizon-scan-line.tsx` | Desktop scan line implementation to study for mobile simplification | EXISTS -- 73 lines, inline styles + `enrichment-horizon-sweep-vp` CSS class |
| `src/components/ambient/ambient-effects.css` | Existing `@keyframes scan` and `@keyframes shimmer` definitions | EXISTS -- 91 lines |
| `src/lib/interfaces/coverage.ts` | `SEVERITY_COLORS` map referencing `var(--severity-*)` tokens, `THREAT_LEVELS` array | EXISTS -- severity tokens referenced but not defined in any CSS file (inline fallbacks only) |
| `docs/plans/mobile-view/ui-design-system.md` | Authoritative token values (Section 3), typography scale (Section 4), glass tiers (Section 6), corner brackets (Section 6), bottom sheet specs (Section 11), OLED considerations (Section 13), animation budget (Section 14) | EXISTS |
| `docs/plans/mobile-view/combined-recommendations.md` | Authoritative MobileScanLine spec, glass specs, drag handle spec, spring config, ThreatPulseBackground spec | EXISTS |
| WS-A.1 completion | `src/components/mobile/` directory must exist before `MobileScanLine.tsx` can be placed there | PENDING |

---

## 4. Deliverables

### 4.1 `src/styles/mobile-tokens.css`

A single CSS file containing all mobile-specific tokens scoped within `@media (max-width: 767px)`. This file is the exclusive location for mobile token overrides -- no other file may define mobile-only custom properties.

The file structure follows this order:

```
1. File header comment (source references, load order note)
2. @media (max-width: 767px) {
   :root {
     a. Spacing tokens
     b. Layout dimension tokens
     c. Blur override tokens
     d. Animation timing override tokens
     e. Touch target tokens
     f. Corner bracket tokens
     g. Typography scale tokens
     h. Glass material tokens (composable parts)
     i. Bottom sheet tokens
     j. Drag handle tokens
     k. Severity color override tokens
     l. Posture-level color tokens
     m. Scan line tokens
     n. Contrast-adjusted text tokens
   }
   /* Scroll-gated glass utility classes */
   /* Touch target utility class */
}
3. @keyframes mobile-scan-sweep { ... }
4. @keyframes threat-pulse { ... }
5. MobileScanLine CSS class
6. @media (prefers-reduced-motion: reduce) { ... }
```

**Complete token inventory** (every custom property that must be defined):

#### a. Spacing tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--space-card-padding` | `14px` | Tighter than desktop `--space-capsule-padding: 20px` to preserve density |
| `--space-card-gap` | `10px` | Tight gap for 2-column card grid (desktop `--space-capsule-gap: 48px`) |
| `--space-section-gap` | `16px` | Vertical gap between major sections (banner, strip, grid) |
| `--space-content-padding` | `12px` | Horizontal page padding for content areas |
| `--space-inline-gap` | `8px` | Minimum gap between adjacent interactive elements (WCAG tap target separation) |

#### b. Layout dimension tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--space-header-height` | `48px` | Fixed mobile header per combined-recommendations Section "Mobile Layout Shell" |
| `--space-bottom-nav-height` | `56px` | Fixed bottom nav per combined-recommendations |
| `--space-bottom-sheet-handle` | `24px` | Height of the drag handle touch area within bottom sheet |
| ~~`--space-safe-area-*`~~ | ~~`env(safe-area-inset-*, 0px)`~~ | **REMOVED per Phase A Review M-2.** Use WS-A.4's global `--safe-area-*` tokens from `spatial-tokens.css` instead. `env()` values self-gate to `0px` on non-notched devices, making media-query scoping unnecessary. |
| `--space-priority-strip-height` | `44px` | Sticky horizontal priority pill strip |
| `--space-threat-banner-height` | `56px` | Threat posture banner |
| `--space-p1-banner-height` | `64px` | Conditional P1 alert banner |
| `--space-filter-chips-height` | `40px` | Map tab filter chip bar |

#### c. Blur override tokens (override `spatial-tokens.css` values)

| Token | Desktop Value | Mobile Value | Rationale |
|-------|-------------|-------------|-----------|
| `--blur-ambient` | `8px` | `6px` | GPU savings; indistinguishable at phone viewing distance |
| `--blur-standard` | `12px` | `8px` | Tier 1 glass (header, nav bar) |
| `--blur-active` | `16px` | `12px` | Tier 1 glass (bottom sheet) |
| `--blur-heavy` | `24px` | `16px` | Heavy blur causes frame drops on mid-range Android |

#### d. Animation timing override tokens (override `spatial-tokens.css` values)

| Token | Desktop Value | Mobile Value | Rationale |
|-------|-------------|-------------|-----------|
| `--duration-hover` | `200ms` | `150ms` | Faster press feedback on touch |
| `--duration-transition` | `300ms` | `250ms` | Snappier content transitions |
| `--duration-morph` | `600ms` | `400ms` | Shorter morph feels more responsive on touch |
| `--duration-morph-complex` | `900ms` | `600ms` | Same rationale |
| `--duration-scan-sweep` | N/A (new) | `12000ms` | MobileScanLine cycle time |
| `--duration-sheet-expand` | N/A (new) | `300ms` | Bottom sheet expand animation |
| `--duration-sheet-dismiss` | N/A (new) | `250ms` | Bottom sheet dismiss (fast exit) |
| `--duration-tab-switch` | N/A (new) | `200ms` | Tab crossfade transition |
| `--duration-card-press` | N/A (new) | `100ms` | Card press feedback (scale 0.97) |

#### e. Touch target tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--touch-target-min` | `44px` | WCAG 2.2 SC 2.5.8 minimum |
| `--touch-target-comfortable` | `48px` | Design target where space permits |

#### f. Corner bracket tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--corner-bracket-size` | `10px` | Reduced from desktop 14px |
| `--corner-bracket-offset` | `-4px` | Reduced from desktop -6px |
| `--corner-bracket-thickness` | `1px` | Reduced from desktop 1.5px |
| `--corner-bracket-color` | `rgba(255, 255, 255, 0.15)` | Same as desktop |

#### g. Typography scale tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--text-hero-metric` | `28px` | Big number in ThreatPictureCard (desktop 24px) |
| `--text-card-metric` | `22px` | Alert count in CategoryCard (desktop 24px) |
| `--text-section-heading` | `16px` | Section headings (desktop 18px) |
| `--text-card-title` | `12px` | Category display name (desktop 11px) |
| `--text-body` | `13px` | Summary, description (desktop 11px) |
| `--text-label` | `11px` | SOURCES, ALERTS, section headers (desktop 9-10px) |
| `--text-caption` | `10px` | Timestamps, secondary data (desktop 9px) |
| `--text-ghost` | `10px` | Decorative labels (desktop 9px) |
| `--text-decorative-micro` | `9px` | Calibration marks (desktop 7-8px) -- decorative only |
| `--text-min-readable` | `10px` | Absolute floor for readable content |
| `--tracking-label-mobile` | `0.14em` | Increased by 0.02em from desktop `--tracking-widest: 0.12em` |
| `--line-height-body` | `1.5` | Body text line height |
| `--line-height-label` | `1.3` | Label line height |
| `--line-height-metric` | `1.0` | Single-line metric line height |

#### h. Glass material tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--glass-header-bg` | `rgba(5, 9, 17, 0.85)` | MobileHeader glass background |
| `--glass-header-blur` | `blur(8px) saturate(120%)` | MobileHeader backdrop-filter |
| `--glass-nav-bg` | `rgba(5, 9, 17, 0.90)` | MobileBottomNav glass background |
| `--glass-nav-blur` | `blur(8px) saturate(120%)` | MobileBottomNav backdrop-filter |
| `--glass-sheet-bg` | `rgba(5, 9, 17, 0.92)` | MobileBottomSheet glass background |
| `--glass-sheet-blur` | `blur(16px) saturate(130%)` | MobileBottomSheet backdrop-filter. **Intentional exception:** uses full 16px blur (not `--blur-active` 12px) for maximum glass fidelity on the most important glass surface. |
| `--glass-sheet-border` | `1px solid rgba(255, 255, 255, 0.08)` | Sheet top border |
| `--glass-sheet-shadow` | `0 -4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)` | Sheet box-shadow |
| `--glass-sheet-radius` | `16px 16px 0 0` | Sheet top border-radius |
| `--glass-card-bg` | `rgba(255, 255, 255, 0.03)` | CategoryCard mobile glass rest state (from `--opacity-glass-rest`) |
| `--glass-card-blur` | `blur(8px) saturate(120%)` | CategoryCard backdrop-filter (Tier 2 -- off during scroll) |
| `--glass-popup-bg` | `rgba(10, 14, 24, 0.95)` | MapPopup mobile -- solid background (Tier 3, no blur) |

#### i. Bottom sheet tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--sheet-spring-stiffness` | `400` | Per combined-recommendations and ui-design-system Section 11 |
| `--sheet-spring-damping` | `35` | Same source |
| `--sheet-spring-mass` | `0.8` | Same source |
| `--sheet-snap-alert-detail` | `70%, 100%` | Alert detail sheet snap points |
| `--sheet-snap-category-detail` | `35%, 65%, 100%` | Category detail sheet snap points |
| `--sheet-snap-priority-feed` | `60%, 100%` | Priority feed sheet snap points |
| `--sheet-snap-filter` | `40%` | Filter/time range sheet snap point |
| `--sheet-landscape-max-height` | `60%` | Max height in landscape orientation |

#### j. Drag handle tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--drag-handle-width` | `40px` | Per combined-recommendations |
| `--drag-handle-height` | `2px` | Thin luminous line aesthetic |
| `--drag-handle-color` | `rgba(255, 255, 255, 0.20)` | Per combined-recommendations |
| `--drag-handle-glow` | `0 0 8px rgba(255, 255, 255, 0.06)` | Subtle glow per ui-design-system Section 11 |
| `--drag-handle-margin` | `11px auto` | Centered within the 24px handle area |

#### k. Severity color override tokens

| Token | Value | Override Reason |
|-------|-------|----------------|
| `--severity-extreme` | `#ef4444` | No change -- passes AA (4.6:1 vs `#050911`) |
| `--severity-severe` | `#f97316` | No change -- passes AA (5.3:1) |
| `--severity-moderate` | `#eab308` | No change -- passes AA (6.8:1) |
| `--severity-minor` | `#60a5fa` | Boosted from `#3b82f6` (4.0:1) to 5.2:1 for AA compliance |
| `--severity-unknown` | `#9ca3af` | Boosted from `#6b7280` (3.5:1) to 5.8:1 for text usage |

Note: These tokens are referenced by `SEVERITY_COLORS` in `src/lib/interfaces/coverage.ts` which uses `var(--severity-*, fallback)` syntax. The mobile override values will take precedence within the media query.

#### l. Posture-level color tokens

| Token | Value | Posture Level |
|-------|-------|---------------|
| `--posture-low-color` | `transparent` | LOW -- no visible pulse |
| `--posture-moderate-color` | `rgba(234, 179, 8, 0.02)` | MODERATE -- barely perceptible amber |
| `--posture-elevated-color` | `rgba(234, 179, 8, 0.04)` | ELEVATED -- faint amber |
| `--posture-high-color` | `rgba(239, 68, 68, 0.03)` | HIGH -- faint red |
| `--posture-critical-color` | `rgba(220, 38, 38, 0.04)` | CRITICAL -- visible red |
| `--posture-elevated-duration` | `4s` | ELEVATED pulse cycle |
| `--posture-high-duration` | `6s` | HIGH pulse cycle |
| `--posture-critical-duration` | `4s` | CRITICAL pulse cycle (faster = more urgent) |

#### m. Scan line tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--scan-line-opacity` | `0.03` | Per combined-recommendations -- subliminal effect |
| `--scan-line-color` | `rgba(14, 165, 233, 0.08)` | Teal, matching desktop HorizonScanLine but simplified |
| `--scan-line-height` | `1px` | Single pixel line |

#### n. Contrast-adjusted text tokens

| Token | Value | Rationale |
|-------|-------|-----------|
| `--color-text-secondary-mobile` | `rgba(255, 255, 255, 0.40)` | Raised from desktop `rgba(255, 255, 255, 0.25)` for outdoor readability (ui-design-system Section 13) |
| `--color-data-stale-bg` | `rgba(234, 179, 8, 0.15)` | DATA STALE / OFFLINE banner background |

### 4.2 `@keyframes` definitions

Two new keyframe animations, defined OUTSIDE the media query (keyframes are global and gated by class usage, not viewport width):

**`@keyframes mobile-scan-sweep`**
```
0%   { transform: translateY(-1px); }
100% { transform: translateY(100vh); }
```
Duration: `var(--duration-scan-sweep, 12000ms)`. Timing: `linear`. Iteration: `infinite`.

**`@keyframes threat-pulse`**
```
0%, 100% { opacity: 0; }
50%      { opacity: 1; }
```
Duration: set per posture level via `--posture-*-duration`. Timing: `ease-in-out`. Iteration: `infinite`. The `ThreatPulseBackground` component (WS-B.3) will set the posture color and duration as inline style variables.

### 4.3 Utility CSS classes

Defined within the `@media (max-width: 767px)` block:

| Class | Purpose |
|-------|---------|
| `.mobile-scan-line` | Applies `mobile-scan-sweep` animation with `will-change: transform` |
| `.mobile-threat-pulse` | Applies `threat-pulse` animation |
| `.glass-tier-2-off` | `backdrop-filter: none !important; -webkit-backdrop-filter: none !important;` -- toggled by scroll-gating |

### 4.4 `src/components/mobile/MobileScanLine.tsx`

A React component that renders a simplified version of the desktop `HorizonScanLine`:

- Fixed-position viewport overlay (`position: fixed; inset: 0; z-index: 35`)
- Single `<div>` with the `mobile-scan-line` CSS class
- 1px height, full width
- Background: `var(--scan-line-color)`
- Opacity: `var(--scan-line-opacity)`
- No box-shadow glow (simplified from desktop)
- No leading/trailing gradient divs (simplified from desktop's 3-div structure)
- `pointer-events: none` on container
- `aria-hidden="true"` on container
- Returns `null` when `prefers-reduced-motion: reduce` is active (via `useReducedMotion` from `@tarva/ui/motion`, matching existing pattern from `ScanlineOverlay.tsx`)
- Respects `effectsEnabled` from `settings.store` (import the store selector; render `null` when false)

### 4.5 `src/app/globals.css` modification

**Insertion point 1 -- import line (line 15, after `spatial-tokens.css` import at line 14):**

Add one import line after the existing `spatial-tokens.css` import:

```css
@import '../styles/spatial-tokens.css';
@import '../styles/mobile-tokens.css';   /* NEW -- mobile token overrides */
```

**Insertion point 2 -- `@theme` block (lines 126-167, append inside the existing `@theme` block before the closing `}` on line 167):**

Add mobile tokens to the `@theme` block where static values need Tailwind utility registration. Only tokens that components will reference via Tailwind classes (e.g., `gap-card-gap`, `h-header-height`) need registration. Tokens consumed only via `var()` in component styles do not need `@theme` registration.

Tokens to register (append before the closing `}` of the `@theme` block at line 167):

```css
  /* Mobile layout dimensions (static, used in utility classes) */
  --spacing-header-height: var(--space-header-height, 48px);
  --spacing-bottom-nav-height: var(--space-bottom-nav-height, 56px);
  --spacing-card-padding: var(--space-card-padding, 14px);
  --spacing-card-gap: var(--space-card-gap, 10px);
  --spacing-section-gap: var(--space-section-gap, 16px);
  --spacing-content-padding: var(--space-content-padding, 12px);
  --spacing-inline-gap: var(--space-inline-gap, 8px);
```

Note: These registrations use `var()` with fallbacks so they resolve correctly on both desktop (where the custom properties do not exist, so the fallback is used) and mobile (where the media query sets them). This is safe because the mobile media query in `mobile-tokens.css` overrides the `:root` values, and Tailwind reads from the computed `var()`.

### 4.6 `@media (prefers-reduced-motion: reduce)` block

Add to `mobile-tokens.css` after the keyframe definitions:

```css
@media (prefers-reduced-motion: reduce) {
  .mobile-scan-line,
  .mobile-threat-pulse {
    animation: none !important;
  }
}
```

This follows the established pattern from `enrichment.css` (line 228-245), `ambient-effects.css` (line 77-90), `atrium.css` (line 290-306), and `reduced-motion.css`.

### 4.7 Desktop regression verification

Run `pnpm build` and confirm:
- Build completes with zero errors
- No TypeScript errors (`pnpm typecheck`)
- No lint errors (`pnpm lint`)
- Desktop rendering is unchanged (visual comparison of the main page at 1920x1080)

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `src/styles/mobile-tokens.css` exists and contains all tokens listed in Section 4.1 (a through n) | File inspection: every token from Section 4.1 tables is present with the specified value |
| AC-2 | All mobile tokens are scoped inside `@media (max-width: 767px)` | Grep: no `:root` declarations outside the media query in `mobile-tokens.css` (except `@keyframes` which are global) |
| AC-3 | Desktop custom property values are unchanged at viewport widths >= 768px | Open Chrome DevTools at 1920x1080, inspect `:root` computed styles, verify `--blur-standard` is `12px`, `--duration-morph` is `600ms`, `--space-capsule-padding` is `20px` |
| AC-4 | Mobile custom property values are applied at viewport widths <= 767px | Open Chrome DevTools at 375x812 (iPhone 14), inspect `:root` computed styles, verify `--blur-standard` is `8px`, `--duration-morph` is `400ms`, `--space-card-padding` is `14px` |
| AC-5 | `@keyframes mobile-scan-sweep` and `@keyframes threat-pulse` are defined and functional | Create a test `<div>` with the `mobile-scan-line` class at 375px viewport; confirm animation runs in browser |
| AC-6 | `MobileScanLine.tsx` exists in `src/components/mobile/` and renders a 1px fixed sweep | Import `MobileScanLine` in a test page; confirm visual output matches spec (1px line, 12s cycle, opacity 0.03, full viewport width) |
| AC-7 | `MobileScanLine` returns null when `prefers-reduced-motion: reduce` | Enable reduced motion in OS settings; confirm component renders nothing |
| AC-8 | `MobileScanLine` returns null when `effectsEnabled` is false in settings store | Set `effectsEnabled: false` in `settings.store`; confirm component renders nothing |
| AC-9 | `src/app/globals.css` imports `mobile-tokens.css` after `spatial-tokens.css` | File inspection: import order is `spatial-tokens.css` then `mobile-tokens.css` |
| AC-10 | `pnpm build` completes with zero errors | Run `pnpm build` from project root; exit code 0 |
| AC-11 | `pnpm typecheck` completes with zero errors | Run `pnpm typecheck`; exit code 0 |
| AC-12 | Desktop rendering is visually identical before and after this change | Load the main page at 1920x1080 in Chrome; compare against a pre-change screenshot; zero visible differences |
| AC-13 | Severity override tokens for Minor and Unknown are only applied on mobile viewports | At 1920x1080: `--severity-minor` computes to `#3b82f6`. At 375px: `--severity-minor` computes to `#60a5fa` |
| AC-14 | All `@keyframes` in this file include a `@media (prefers-reduced-motion: reduce)` override | File inspection: reduced-motion media query exists and targets all new animation classes |
| AC-15 | Mobile tokens file header comment includes load order note and source references | File inspection: header comment references `ui-design-system.md Section 3`, `combined-recommendations.md`, and states load order (after `spatial-tokens.css`, before component styles) |
| AC-16 | Severity tokens are defined on `:root` so they are picked up by `var(--severity-*, fallback)` in `coverage.ts` | Inspect computed `--severity-minor` on `:root` at 375px; confirm `#60a5fa` |
| AC-17 | Glass material tokens use the exact rgba values specified in combined-recommendations | `--glass-header-bg` equals `rgba(5, 9, 17, 0.85)`, `--glass-sheet-bg` equals `rgba(5, 9, 17, 0.92)`, `--glass-nav-bg` equals `rgba(5, 9, 17, 0.90)` |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Scope all mobile tokens inside a single `@media (max-width: 767px)` guard rather than using a CSS class toggle like `.is-mobile` | Media query is the standard CSS mechanism for responsive overrides. It requires no JavaScript to activate, avoids FOUC, and matches the `useIsMobile()` hook's `767px` breakpoint exactly. Component-level code splitting (WS-A.1) already prevents mobile components from loading on desktop, so there is no risk of token leakage through component usage. | Class-based toggle (`.is-mobile :root { ... }`): rejected because it requires JS to add the class, which creates a flash of desktop tokens during hydration. Container queries: rejected because `:root` cannot be a container. |
| D-2 | Define severity tokens (`--severity-*`) in `mobile-tokens.css` even though they are not currently defined in any CSS file (only referenced with inline fallbacks in `coverage.ts`) | The `SEVERITY_COLORS` map in `coverage.ts` uses `var(--severity-*, fallback)` syntax. Defining these tokens in CSS means the mobile override values will take precedence within the media query, while the hardcoded fallbacks continue to work on desktop. This also establishes the tokens for any future desktop CSS that wants to reference severity colors. | Define severity tokens in `coverage.css` for both desktop and mobile: rejected because it changes desktop behavior (currently using fallback values) and is not within this workstream's scope. Define only the mobile overrides: chosen approach. |
| D-3 | Place `@keyframes` definitions OUTSIDE the media query | CSS `@keyframes` are global definitions. Defining them inside a media query would make them only available at that viewport width, but their associated CSS classes are already scoped by the media query (via their usage in mobile-only components). Keeping keyframes global is the standard pattern used by `enrichment.css`, `atrium.css`, and `ambient-effects.css` in this codebase. | Define keyframes inside the media query: rejected because if any code references the keyframe name outside the media query, it would be undefined. |
| D-4 | Single file for all mobile tokens rather than splitting by concern (spacing.css, glass.css, etc.) | The `ui-design-system.md` Section 3 and `combined-recommendations.md` Phase Decomposition both specify a single `src/styles/mobile-tokens.css` file. A single file is easier to audit, reduces import complexity, and makes the media query scope clear. At ~150-200 lines, it is well within the manageable range for a single token file. | Multiple files (mobile-spacing.css, mobile-glass.css, etc.): rejected to match the discovery spec and avoid import chain complexity. |
| D-5 | `MobileScanLine` uses a CSS class from `mobile-tokens.css` rather than inline styles | The desktop `HorizonScanLine` uses inline styles, but this creates a pattern where animation definitions are split between CSS (keyframes in `enrichment.css`) and JS (durations/opacities inline). Mobile consolidates both into CSS for the scan line, following the principle that ambient-tier animations should be pure CSS (per `VISUAL-DESIGN-SPEC.md` animation tiers and the existing `enrichment.css` pattern). | Inline styles matching desktop pattern: rejected for consistency with the project's stated ambient animation strategy. |
| D-6 | Register a subset of mobile tokens in Tailwind `@theme` (layout dimensions and spacing only) | Only tokens that will be referenced via Tailwind utility classes need `@theme` registration. Glass material tokens, animation timing tokens, and posture tokens are consumed exclusively via `var()` in component styles or CSS files, so they do not need Tailwind registration. This keeps the Tailwind namespace clean. | Register all tokens in `@theme`: rejected to avoid namespace pollution and because most tokens are consumed via direct `var()` references. |
| D-7 | Use `var()` with fallbacks in `@theme` registrations to provide safe defaults when mobile tokens are not active (viewport >= 768px) | This ensures Tailwind utilities like `h-header-height` resolve to a sensible value on desktop (the fallback) rather than being undefined. Components that use these utilities on desktop will get the fallback; components that are mobile-only (loaded via code splitting) will get the media-query-overridden value. | No fallbacks: rejected because it would break any Tailwind utility usage at desktop widths. Duplicate token definitions for desktop: rejected as unnecessary since the fallback mechanism handles it. |
| D-8 | Define posture-level tokens as static CSS values rather than computed from threat data | CSS custom properties cannot be dynamically computed from API data in a stylesheet. The `ThreatPulseBackground` component (WS-B.3) will select the appropriate token based on posture level in JavaScript and apply it as an inline style variable. This workstream defines the palette of possible values. | No posture tokens (leave to component): rejected because centralizing color values in the token file maintains the single-source-of-truth principle and makes future theming changes easier. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should landscape orientation get its own set of spacing token overrides (e.g., wider content padding, adjusted header height), or is the `--sheet-landscape-max-height: 60%` token sufficient for Phase A? | WS-F.1 author | Phase F |
| OQ-2 | The `ui-design-system.md` mentions a `mobile.css` file for "Mobile layout utilities" alongside `mobile-tokens.css`. Is a separate utilities file needed, or should utility classes (`.glass-tier-2-off`, `.mobile-scan-line`, `.mobile-threat-pulse`) live in `mobile-tokens.css`? Current decision: include them in `mobile-tokens.css` for simplicity. | WS-A.2 author | Phase A |
| OQ-3 | Should the `--severity-minor` and `--severity-unknown` mobile overrides also apply to the desktop in `coverage.css` for consistency? The desktop currently uses hardcoded fallback values in TypeScript. | Design lead | Phase B |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Mobile tokens leak into desktop styles via incorrect media query syntax or specificity conflict | Low | High -- desktop regression | AC-3 and AC-12 verify desktop isolation. The `@media (max-width: 767px)` guard on `:root` is the most reliable CSS scoping mechanism. Code review must confirm no tokens are defined outside this guard. |
| R-2 | Tailwind v4 `@theme` registration with `var()` references causes build errors because the custom properties are not defined at build time | Medium | Medium -- build failure | Tailwind v4 resolves `@theme` values at build time for static tokens and at runtime for `@theme inline` tokens. Mobile layout tokens use `var()` with explicit fallback values (e.g., `var(--space-header-height, 48px)`), which ensures the build always has a concrete value. If issues arise, move these registrations to `@theme inline`. |
| R-3 | `backdrop-filter` shorthand values stored in CSS custom properties may not interpolate correctly in all browsers | Low | Low -- visual degradation, not breakage | Glass tokens store the full `backdrop-filter` value (e.g., `blur(8px) saturate(120%)`). Components will apply these via `style={{ backdropFilter: 'var(--glass-header-blur)' }}` or equivalent CSS. If interpolation fails, the component falls back to a hardcoded value. Safari and Chrome both support `backdrop-filter` shorthand in custom properties. |
| R-4 | WS-A.1 delays creation of `src/components/mobile/` directory, blocking `MobileScanLine.tsx` placement | Medium | Low -- easily unblocked | `MobileScanLine.tsx` can be developed in a temporary location and moved when the directory exists. Alternatively, this workstream can create the directory itself (it is just `mkdir -p`). The dependency is soft. |
| R-5 | The 767px breakpoint in the media query does not exactly match the `useIsMobile()` hook's `matchMedia` query | Low | Medium -- token/component mismatch | Both use `max-width: 767px`. This is confirmed in `combined-recommendations.md` ("useIsMobile() hook: window.matchMedia('(max-width: 767px)')"). The values are identical. |
| R-6 | Total token count (~80 custom properties) causes measurable CSS parse overhead on mobile | Very Low | Very Low | CSS custom property parsing is near-instant even at hundreds of properties. The entire file will be <5KB uncompressed. Modern mobile browsers parse this in <1ms. No mitigation needed. |

---

## Appendix A: File Dependency Graph

```
src/app/globals.css
  |-- @import '@tarva/ui/styles.css'         (base tokens)
  |-- @import '../styles/spatial-tokens.css'  (desktop spatial tokens, :root)
  |-- @import '../styles/mobile-tokens.css'   (NEW -- mobile overrides, @media scoped)
  |-- @import 'tailwindcss'                   (engine)
  |-- @theme inline { ... }                   (existing bridges)
  |-- @theme { ... }                          (existing + new mobile registrations)

src/styles/mobile-tokens.css
  |-- @media (max-width: 767px) { :root { ... } }
  |-- @keyframes mobile-scan-sweep
  |-- @keyframes threat-pulse
  |-- .mobile-scan-line { ... }
  |-- .mobile-threat-pulse { ... }
  |-- @media (prefers-reduced-motion: reduce) { ... }

src/components/mobile/MobileScanLine.tsx
  |-- imports useReducedMotion from @tarva/ui/motion
  |-- imports settings.store (effectsEnabled)
  |-- uses .mobile-scan-line CSS class from mobile-tokens.css (loaded via globals.css)
```

## Appendix B: Token-to-Consumer Mapping

This table maps each token group to the workstreams that consume it, ensuring nothing is missed.

| Token Group | Consuming Workstreams |
|-------------|----------------------|
| Spacing (card, section, content, inline) | WS-A.2 (Shell), WS-B.1 (Banner), WS-B.2 (Grid), WS-D.1 (Category Detail), WS-D.2 (Alert Detail) |
| Layout dimensions (header, nav, strip, banner) | WS-A.2 (Shell), WS-A.4 (Safe Areas), WS-B.1 (Banner), WS-C.3 (Map View) |
| Blur overrides | WS-A.2 (Shell glass), WS-B.2 (Card glass), WS-C.1 (Sheet glass), WS-C.3 (Map overlays) |
| Animation timing overrides | WS-A.2 (Tab switch), WS-B.2 (Card press), WS-C.1 (Sheet expand/dismiss), WS-D.3 (Morph) |
| Touch target | WS-B.1 (Banner tap), WS-B.2 (Card tap), WS-C.3 (Map controls), WS-C.4 (Marker tap), WS-C.5 (Settings) |
| Corner bracket | WS-A.2 (Shell), WS-B.1 (Threat card), WS-C.1 (Sheet header), WS-C.3 (Map container) |
| Typography scale | WS-B.1 (Banner text), WS-B.2 (Card text), WS-D.1 (Category heading), WS-D.2 (Alert text), WS-E.1 (Intel text) |
| Glass material | WS-A.2 (Header, Nav), WS-B.2 (Card), WS-C.1 (Sheet), WS-C.3 (Map popup) |
| Bottom sheet | WS-C.1 (Core), WS-C.2 (Advanced) |
| Drag handle | WS-C.1 (Sheet handle) |
| Severity overrides | WS-B.1 (Banner badges), WS-B.2 (Card severity bar), WS-D.2 (Alert severity) |
| Posture-level | WS-B.3 (ThreatPulseBackground) |
| Scan line | WS-A.3 (MobileScanLine -- this workstream) |
| Contrast-adjusted text | WS-B.1 (Stale banner), WS-B.3 (Connectivity indicator) |
