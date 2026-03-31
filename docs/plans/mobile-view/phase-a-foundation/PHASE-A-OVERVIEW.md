# Phase A Overview: Foundation

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** combined-recommendations.md (Phase Decomposition, Phase A)
> **Date:** 2026-03-06
> **Status:** Draft

---

## 1. Executive Summary

Phase A establishes the infrastructure that every subsequent mobile workstream depends on: viewport detection, code splitting, the mobile layout shell, a unified design token system, and safe area configuration. It contains four workstreams (WS-A.1 through WS-A.4) totaling approximately 6 new files, 3 modified files, and 2 new directories.

The core architectural bet is **separate component trees** (AD-1): mobile and desktop users receive entirely different React subtrees, switched at the page level via `next/dynamic` code splitting, sharing only the data layer (TanStack Query hooks, Zustand stores, TypeScript interfaces). This is validated by the existing codebase's `next/dynamic` pattern for `CoverageMap` and the static export (`output: 'export'`) deployment model.

**Risk profile:** Low overall. The highest-risk item is desktop regression from the page.tsx extraction (WS-A.1), mitigated by a zero-modification extraction strategy. The most architecturally significant unresolved issue is a **glass background value conflict** between WS-A.2 and WS-A.3 (see Section 3, Conflict 1) and a **safe area token duplication** between WS-A.3 and WS-A.4 (Conflict 2). Both require resolution before implementation begins.

**Key deliverables at phase exit:**
- Mobile users (viewport <= 767px) see a structurally complete shell: header, tab bar, empty tab content areas
- Desktop users see zero changes (byte-for-byte identical rendering)
- A single-source-of-truth token file governs all mobile visual properties
- Safe area insets are available as CSS custom properties globally
- Webpack produces separate chunks for mobile and desktop

---

## 2. Key Findings (grouped by theme)

### 2.1 Code Splitting and Detection

- **Codebase verification (CTA):** `page.tsx` is 743 lines. All imports use `@/*` path aliases, confirming WS-A.1's claim that extraction to `src/views/DesktopView.tsx` requires no import path changes. The `(launch)/layout.tsx` auth guard renders `<>{children}</>` when authenticated and a void div when not -- this is compatible with the orchestrator pattern.
- **Static export compatibility (CTA):** The existing `next/dynamic` with `ssr: false` for `CoverageMapDynamic` (page.tsx line 29-32) proves this pattern works with the project's `output: 'export'` configuration. No risk of build failure from the proposed approach.
- **Three-state detection (SPO):** The `null | true | false` return type from `useIsMobile()` is correct. Defaulting to `false` (desktop) would cause a flash of desktop content on mobile before `useEffect` fires. The `HydrationShell` void background during the `null` phase creates a seamless auth-void to hydration-void to view-content progression.
- **`src/views/` and `src/components/mobile/` directories do not exist** (verified by glob search), confirming WS-A.1 must create them.

### 2.2 Layout Shell Architecture

- **Slot-based composition (CTA):** WS-A.2's use of render props/slots (`scanLine`, `threatIndicator`, `situationContent`, etc.) is architecturally sound. It prevents circular build dependencies between workstreams and allows independent testing. The `MobileView` entry point progressively adds props as workstreams deliver components.
- **Tab state locality (SPO):** AD-3's decision to use local `useState` for tab state (not Zustand) is correct. Tab state is ephemeral UI state, not application state. URL sync on mount only (no URL update on switch) avoids polluting browser history. The `?tab=map|intel` deep link and `?district={id}` handling are well-specified.
- **Morph cancellation (SPO):** The Gap 6 resolution (check `morph.phase !== 'idle'`, call `resetMorph()` before tab switch) is verified. `resetMorph()` exists in `ui.store.ts` at line 145-149 and resets both `selectedDistrictId` and morph state. The 300ms fast-path morph window makes the race condition unlikely but not impossible; the guard is necessary.

### 2.3 Design Token Strategy

- **Single-file approach (CTA):** A single `mobile-tokens.css` file with all tokens inside `@media (max-width: 767px)` is the right call for ~80 properties. The media query breakpoint (`max-width: 767px`) matches the `useIsMobile()` hook's `matchMedia` query exactly.
- **Override mechanism (CTA):** Mobile tokens override desktop tokens by redefining `:root` custom properties inside the media query. Since CSS custom properties resolve at computed-value time, the last-defined value wins. Load order (`spatial-tokens.css` then `mobile-tokens.css` in `globals.css`) ensures mobile overrides take effect.
- **Keyframe placement (CTA):** Placing `@keyframes` definitions outside the media query (global scope) is correct. Keyframes are global by specification; scoping them inside a media query would make them unavailable outside that viewport width. The consuming CSS classes are already mobile-only.
- **Severity token gap (SPO):** `--severity-*` tokens are currently not defined in any CSS file. They are only referenced via `var(--severity-*, fallback)` in TypeScript (`coverage.ts`). WS-A.3 correctly defines them inside the mobile media query, establishing mobile-specific contrast-adjusted values while desktop continues using the TypeScript fallback values.

### 2.4 Viewport and Safe Areas

- **`viewport-fit=cover` (CTA):** Required to activate `env(safe-area-inset-*)` on iOS. Without it, all env() values return `0px`. The Next.js App Router `Viewport` export is the correct mechanism -- manual `<meta>` tags risk duplication.
- **No `user-scalable=no` (SPO):** WCAG 1.4.4 compliance. Verified that neither `maximumScale` nor `userScalable` are set. Pinch-zoom remains available.
- **Global safe area tokens (CTA):** WS-A.4's decision to place `--safe-area-*` tokens on `:root` (not media-scoped) is correct because `env()` values self-gate to `0px` on devices without physical insets. Media-scoping them would break landscape phones wider than 767px and tablets with notches.
- **`100vh` audit (STW):** WS-A.4's audit found no blocking `100vh` issues for Phase A. The one functional usage (`PriorityFeedPanel.tsx` line 253) is in a desktop-oriented component excluded from the mobile tree by code splitting. WS-A.2's `MobileShell` correctly uses `100dvh` from the start.

### 2.5 SessionTimecode Modification

- **Inline prop approach is correct (CTA):** The current `SessionTimecode` component (160 lines, `src/components/ambient/session-timecode.tsx`) uses inline `style={{ position: 'fixed', bottom: 16, right: 16 }}`. Wrapping it in a `position: relative` parent would not work because `position: fixed` ignores parent positioning context. The `inline` prop approach changes only the wrapper div styles and is fully backward-compatible since the prop defaults to `undefined`/`false`.
- **Current component has no props interface at all** (verified: `memo(function SessionTimecode())` with no parameters). Adding `{ inline?: boolean }` is a minimal, additive change. The `memo()` wrapper will automatically include the new prop in its shallow comparison, which is correct (the prop never changes within a given render tree).
- **Font size adjustments (STW):** WS-A.2 specifies reduced font sizes for inline mode (REC: 7px, timecode: 9px, dot: 2.5px). These are aesthetic choices to fit the 48px header, not structural changes.

---

## 3. Cross-Workstream Conflicts

### Conflict 1: Glass Background Values (WS-A.2 vs WS-A.3) -- BLOCKING

**WS-A.2** hardcodes glass values in `mobile-shell.css`:
- Header background: `rgba(5, 9, 17, 0.92)` with `backdrop-filter: blur(16px) saturate(130%)`
- Bottom nav: same as header

**WS-A.3** defines glass tokens in `mobile-tokens.css`:
- `--glass-header-bg: rgba(5, 9, 17, 0.85)` with `--glass-header-blur: blur(8px) saturate(120%)`
- `--glass-nav-bg: rgba(5, 9, 17, 0.90)` with `--glass-nav-blur: blur(8px) saturate(120%)`

**Disagreement:** Alpha values differ (0.92 vs 0.85/0.90) and blur values differ (16px vs 8px). WS-A.2 DM-1 acknowledges this and argues the interface-architecture document's values (0.92/16px) provide "better glass legibility." WS-A.3 follows the combined-recommendations and ui-design-system values (0.85/8px for header, 0.90/8px for nav).

**Resolution recommendation (CTA):** WS-A.3 is the designated single source of truth for mobile visual tokens. WS-A.2 must consume tokens via `var()` references, not hardcode values. The specific alpha and blur values should be settled by the design lead (OQ-2 in WS-A.2 flags this), but regardless of which values win, WS-A.2's CSS must reference `var(--glass-header-bg)` and `var(--glass-header-blur)` rather than hardcoded rgba/blur values.

**Proposed action:** Update WS-A.2's `mobile-shell.css` to replace all hardcoded glass values with token references. Settle the authoritative alpha/blur values in one place (WS-A.3's token file). Recommended: use WS-A.3's values (0.85/0.90 alpha, 8px blur) as they reflect GPU savings documented in the design system and allow the bottom sheet to be the highest-opacity glass layer (0.92), creating a clear visual hierarchy (header 0.85 < nav 0.90 < sheet 0.92).

### Conflict 2: Safe Area Token Duplication (WS-A.3 vs WS-A.4) -- NON-BLOCKING

**WS-A.4** defines global tokens in `spatial-tokens.css`:
- `--safe-area-top: env(safe-area-inset-top, 0px)` (on `:root`, no media query)
- `--safe-area-bottom`, `--safe-area-left`, `--safe-area-right` (same pattern)

**WS-A.3** defines mobile-scoped tokens in `mobile-tokens.css`:
- `--space-safe-area-top: env(safe-area-inset-top, 0px)` (inside `@media (max-width: 767px)`)
- `--space-safe-area-bottom`, `--space-safe-area-left`, `--space-safe-area-right` (same pattern)

**Disagreement:** Two sets of tokens alias the same `env()` values with different names (`--safe-area-*` vs `--space-safe-area-*`) and different scopes (global vs mobile-only). WS-A.4 OQ-2 explicitly raises this question.

**Resolution recommendation (CTA):** WS-A.3 should **drop** the `--space-safe-area-*` tokens entirely. Rationale:
1. `env()` values self-gate to `0px` on non-notched devices, making media-query scoping unnecessary and conceptually incorrect.
2. WS-A.4's global `--safe-area-*` tokens are sufficient for all consumers.
3. Two naming conventions for the same underlying values creates confusion about which to reference.
4. Consumers (WS-A.2, WS-B.1, etc.) should reference `var(--safe-area-bottom)`, not `var(--space-safe-area-bottom)`.

**Note:** WS-A.3 should still define the **layout dimension** tokens (`--space-header-height: 48px`, `--space-bottom-nav-height: 56px`) as these are genuinely mobile-specific values, not safe area aliases.

### Conflict 3: Dependency Direction Between WS-A.2 and WS-A.3 -- BLOCKING

**WS-A.3 header** says: "Blocks: WS-A.2 (shell consumes spacing, glass, and layout tokens)"
**WS-A.2 header** says: "Depends On: WS-A.1" (no mention of WS-A.3)
**WS-A.2 out-of-scope table** says: "Mobile design tokens CSS file → WS-A.3. This WS uses existing spatial-tokens.css values directly."

**Disagreement:** WS-A.3 claims WS-A.2 depends on it (WS-A.3 blocks WS-A.2), but WS-A.2 explicitly declares it does not depend on WS-A.3 and will use `spatial-tokens.css` directly. This is contradictory.

**Resolution recommendation (CTA):** If Conflict 1 is resolved as recommended (WS-A.2 consumes tokens from WS-A.3 via `var()` references), then WS-A.2 **does** depend on WS-A.3. The corrected dependency chain is:

```
WS-A.4 (no deps) ─────────────────┐
WS-A.1 (no deps) → WS-A.3 (A.1) ─┼→ WS-A.2 (A.1 + A.3 + A.4)
                                   │
```

Update WS-A.2's header to: `Depends On: WS-A.1, WS-A.3, WS-A.4`. Update WS-A.2's out-of-scope entry to remove the "uses spatial-tokens.css directly" claim.

### Conflict 4: WS-A.1 Claims to Block WS-A.4, but WS-A.4 Has No Dependencies -- MINOR

**WS-A.1 header** says: "Blocks: WS-A.2, WS-A.3, WS-A.4"
**WS-A.4 header** says: "Depends On: None"

**Disagreement:** WS-A.1 claims to block WS-A.4, but WS-A.4 modifies `layout.tsx`, `spatial-tokens.css`, and `globals.css` -- none of which require WS-A.1's deliverables.

**Resolution recommendation (PMO):** WS-A.4 is correctly independent of WS-A.1. Remove WS-A.4 from WS-A.1's "Blocks" list. This enables WS-A.4 to execute in parallel with WS-A.1, reducing the critical path.

---

## 4. Architecture Decisions (consolidated)

| ID | Decision | Source SOW | Rationale |
|----|----------|-----------|-----------|
| AD-1 | Separate mobile component tree switched at page level by `useIsMobile()` + `next/dynamic` | WS-A.1 D-3, combined-rec AD-1 | Prevents mobile users from downloading desktop JS (SpatialViewport, MapLibre, MorphOrchestrator). Code splitting verified by existing `CoverageMapDynamic` pattern. |
| AD-2 | `useIsMobile()` returns `null \| true \| false` (three-state) | WS-A.1 D-2 | `null` during hydration enables `HydrationShell` void background. Prevents flash of incorrect view. |
| AD-3 | Tab state as local `useState` in MobileShell, URL sync on mount only | WS-A.2 DM-6, combined-rec AD-3 | Tab switches are ephemeral UI state. Avoids browser history pollution. Deep linking works via initial URL parameter. |
| AD-4 | All mobile components in flat `src/components/mobile/` directory | WS-A.1, combined-rec AD-4 | 20+ components manageable with clear naming. Entry point at `src/views/MobileView.tsx`. |
| AD-5 | Code splitting: page-level split only (DesktopView / MobileView) in Phase A | WS-A.1, combined-rec AD-5 | Map tab lazy-loading and detail chunk splitting deferred to WS-C.3 and WS-D phases. |
| AD-6 | Breakpoint at `max-width: 767px` (mobile) / `min-width: 768px` (desktop) | WS-A.1 D-1 | 768px is standard tablet-portrait breakpoint. Tablets get desktop ZUI (appropriate for pointer-precision spatial dashboard). |
| AD-7 | Zero-modification desktop extraction | WS-A.1 D-4 | Only function name changes (`LaunchPage` to `DesktopView`). Eliminates desktop regression risk entirely. |
| AD-8 | CSS imports move to `DesktopView.tsx` (not `page.tsx` or `layout.tsx`) | WS-A.1 D-5 | 6 desktop-specific CSS files only load when desktop view renders, reducing mobile bundle. |
| AD-9 | `SessionTimecode` gets `inline` prop (not a separate mobile component) | WS-A.2 DM-3 | Avoids duplicating 160 lines of rAF timekeeping logic. Additive change, backward-compatible. |
| AD-10 | Tab content uses conditional rendering (unmount inactive) | WS-A.2 DM-2 | Simpler than keep-alive. TanStack Query cache handles data persistence. Revisitable for Map tab in WS-C.3. |
| AD-11 | Slot-based composition for MobileShell (props/render slots) | WS-A.2 DM-4 | Maintains clean dependency boundaries between workstreams. MobileView wires slots progressively. |
| AD-12 | Single `mobile-tokens.css` file, all tokens inside `@media (max-width: 767px)` | WS-A.3 D-1, D-4 | Media query is the standard CSS responsive mechanism. Single file is auditable at ~150-200 lines. Matches breakpoint. |
| AD-13 | `@keyframes` definitions placed outside media query (global scope) | WS-A.3 D-3 | CSS keyframes are global by specification. Follows existing codebase pattern (`enrichment.css`, `atrium.css`). |
| AD-14 | MobileScanLine uses CSS class (not inline styles) | WS-A.3 D-5 | Consolidates animation definitions in CSS. Follows project's ambient animation strategy. |
| AD-15 | Viewport export via Next.js `Viewport` type (not manual `<meta>`) | WS-A.4 DEC-1 | App Router manages `<head>` content. Manual tags risk duplication. `Viewport` type provides type safety. |
| AD-16 | Safe area tokens on global `:root` (not media-scoped) | WS-A.4 DEC-2 | `env()` self-gates to `0px`. Scoping to mobile would break landscape phones >767px and notched tablets. |
| AD-17 | Safe area tokens in `spatial-tokens.css` (not a new file) | WS-A.4 DEC-3 | Follows existing pattern: all design tokens under `:root` in `spatial-tokens.css`. |
| AD-18 | Audit `100vh` but do not change existing usages | WS-A.4 DEC-4 | Existing `100vh` usages are in desktop-only code. Mobile component tree uses `100dvh` from the start. |
| AD-19 | CSS in dedicated `mobile-shell.css` (not Tailwind utilities or inline) | WS-A.2 DM-7 | Glass panel requires `backdrop-filter` vendor prefixes, `env()` functions, and pseudo-selectors not expressible in Tailwind utilities or inline styles. Follows existing codebase pattern. |
| AD-20 | `MobileTab` type defined in `src/lib/interfaces/mobile.ts` | WS-A.2 DM-8 | Follows codebase convention. Prevents circular imports. Shared by multiple consumers. |

---

## 5. Cross-Workstream Dependencies

### Dependency Diagram (corrected)

```
                ┌─────────────────────────┐
                │  WS-A.4: Viewport Meta  │  No dependencies
                │  + Safe Areas           │  (can start immediately)
                └───────────┬─────────────┘
                            │ blocks A.2
                            │
┌───────────────┐     ┌─────┴─────────────┐     ┌─────────────────────┐
│  WS-A.1:      │────>│  WS-A.3: Design   │────>│  WS-A.2: Mobile     │
│  Detection +  │     │  Tokens + Ambient  │     │  Layout Shell       │
│  Code Split   │     │                    │     │                     │
└───────────────┘     └────────────────────┘     └─────────────────────┘
  blocks A.3                blocks A.2              blocks Phase B
  (directory)               (tokens)                (shell + header)
```

### Dependency Analysis

| Upstream | Downstream | What Flows | Validated? |
|----------|-----------|------------|------------|
| WS-A.1 | WS-A.3 | `src/components/mobile/` directory for `MobileScanLine.tsx` | Yes. Soft dependency -- directory can be created by either workstream. |
| WS-A.1 | WS-A.2 | `MobileView.tsx` entry point, `useIsMobile()` hook, `src/components/mobile/` directory | Yes. Hard dependency -- WS-A.2 populates the stub. |
| WS-A.3 | WS-A.2 | Glass tokens, spacing tokens, layout dimension tokens, blur tokens | **Currently broken** (Conflict 3). WS-A.2 must be updated to declare this dependency. |
| WS-A.4 | WS-A.2 | `--safe-area-bottom` token for bottom nav padding, `viewport-fit=cover` for `env()` activation | Yes. WS-A.2's CSS references `env(safe-area-inset-bottom)` which requires WS-A.4's viewport meta. |
| WS-A.4 | WS-A.3 | Global `--safe-area-*` tokens (eliminates need for WS-A.3 duplicates) | **Pending** (Conflict 2 resolution). |
| Phase A (all) | WS-B.1 | Header slots (`threatIndicator`), severity tokens, typography tokens, shell content area | Yes. All prerequisites covered. |
| Phase A (all) | WS-B.2 | Shell content area, spacing tokens, touch target tokens, glass tokens | Yes. All prerequisites covered. |
| Phase A (all) | WS-B.3 | Header connectivity dot slot, posture tokens, `ThreatPulseBackground` keyframes | Yes. All prerequisites covered. |
| Phase A (all) | WS-C.1 | Bottom sheet tokens (spring config, snap points, glass, drag handle) | Yes. All defined in WS-A.3. |

### Critical Path

```
WS-A.1 (S) → WS-A.3 (M) → WS-A.2 (M) → Phase B
         └─── WS-A.4 (S) runs in parallel with A.1 ───┘
```

Total critical path: A.1 + A.3 + A.2 = S + M + M. WS-A.4 is off the critical path.

---

## 6. Consolidated Open Questions

| ID | Question | Source | Blocking? | Assigned To | Target |
|----|----------|--------|-----------|-------------|--------|
| OQ-1 | Should `useIsMobile()` debounce the `change` event to prevent rapid switching at the 767px boundary? `matchMedia` fires once per threshold crossing, so rapid oscillation is unlikely. | WS-A.1 OQ-1 | No | react-developer | Decide during A.1 implementation |
| OQ-2 | When resizing across the breakpoint, should application state (selected categories, view mode) persist? Zustand stores persist, but component-local state resets on remount. | WS-A.1 OQ-2 | No | react-developer | WS-A.2 implementation |
| OQ-3 | Should the MobileView stub import a minimal CSS file for the void background, or is inline `#050911` sufficient until WS-A.3? | WS-A.1 OQ-3 | No | react-developer | WS-A.3 delivery |
| OQ-4 | **Which glass background values are authoritative? 0.85/8px (WS-A.3 tokens) or 0.92/16px (WS-A.2 hardcoded)?** The interface-architecture and combined-recommendations disagree. | WS-A.2 OQ-2 | **Yes** | design lead | Before A.2 implementation |
| OQ-5 | Hamburger button placement: OVERVIEW wireframe puts it in the header, interface-architecture puts it in the bottom nav only. WS-A.2 follows interface-architecture (bottom nav). Confirm. | WS-A.2 OQ-4 | **Yes** | planning-coordinator | Before A.2 implementation |
| OQ-6 | Should tab switch animate content (horizontal slide)? Current spec says nothing. Start with instant swap. | WS-A.2 OQ-1 | No | ux-designer | Phase F |
| OQ-7 | Should hamburger button have a badge/dot for unacknowledged settings? | WS-A.2 OQ-3 | No | ux-designer | Phase F |
| OQ-8 | Should landscape orientation get its own spacing token overrides beyond `--sheet-landscape-max-height: 60%`? | WS-A.3 OQ-1 | No | WS-F.1 author | Phase F |
| OQ-9 | **Does WS-A.3 still need `--space-safe-area-*` tokens given WS-A.4 provides global `--safe-area-*`?** (Recommendation: No -- drop WS-A.3 safe area tokens.) | WS-A.4 OQ-2 | **Yes** | WS-A.3 author | Before A.3 implementation |
| OQ-10 | Should the `Toaster` component (sonner) respect safe area bottom inset? Currently uses `offset={52}` which may overlap iOS home indicator. | WS-A.4 OQ-1 | No | WS-A.2 or WS-F.1 | Phase A or F |
| OQ-11 | Should `--severity-minor` and `--severity-unknown` mobile overrides also apply on desktop in `coverage.css`? Desktop currently uses TypeScript fallback values. | WS-A.3 OQ-3 | No | design lead | Phase B |
| OQ-12 | Is a separate `mobile.css` utilities file needed alongside `mobile-tokens.css`, or can utility classes (`.glass-tier-2-off`, `.mobile-scan-line`) live in `mobile-tokens.css`? | WS-A.3 OQ-2 | No | WS-A.2 author | Phase A |

---

## 7. Phase Exit Criteria

| Criterion | Met? | Evidence Required |
|-----------|------|-------------------|
| Desktop rendering is byte-for-byte identical at >= 768px viewport width | Pending | Visual comparison before/after at 1440x900. All URL parameters (`?district=`, `?category=`, `?view=`) work. `pnpm build` succeeds. (WS-A.1 AC-1, WS-A.2 AC-15, WS-A.3 AC-12, WS-A.4 AC-5) |
| `useIsMobile()` returns `null` -> `true` at <= 767px, `null` -> `false` at >= 768px | Pending | DevTools responsive mode tests. (WS-A.1 AC-2, AC-3, AC-4) |
| Webpack produces separate chunks for DesktopView and MobileView | Pending | Build artifact inspection: distinct chunk files. Network tab verification: mobile does not download desktop chunks and vice versa. (WS-A.1 AC-7, AC-8, AC-9) |
| MobileShell renders full-viewport flexbox layout with header (48px), scrollable content, and bottom nav (56px + safe area) | Pending | Visual inspection at 375x812. Computed styles verification. (WS-A.2 AC-1, AC-2, AC-3) |
| Tab switching works: Situation (default), Map, Intel. Active/inactive states render correctly. | Pending | Tap each tab, verify visual state changes. (WS-A.2 AC-4) |
| Deep link `?tab=map` sets initial tab on page load | Pending | Navigate to URL with tab parameter. (WS-A.2 AC-5) |
| Morph phase guard fires on tab switch during active morph | Pending | Unit test with mocked ui.store. (WS-A.2 AC-7) |
| All mobile tokens are scoped inside `@media (max-width: 767px)` and do not affect desktop | Pending | Computed style inspection at 1920px vs 375px for token values. (WS-A.3 AC-3, AC-4) |
| `MobileScanLine` renders 1px CSS-only sweep, respects reduced motion and `effectsEnabled` | Pending | Visual inspection, OS reduced motion toggle, settings store toggle. (WS-A.3 AC-6, AC-7, AC-8) |
| Viewport meta tag includes `viewport-fit=cover`, does NOT include `user-scalable=no` | Pending | Page source / DevTools inspection. (WS-A.4 AC-1, AC-2) |
| Safe area CSS tokens resolve to real values on notched devices | Pending | iOS Safari device or simulator test. (WS-A.4 AC-8) |
| `pnpm typecheck` and `pnpm build` pass with zero errors | Pending | CLI execution. (All SOWs) |

---

## 8. Inputs Required by Next Phase

Phase B (Situation Tab) requires the following from Phase A:

| Input | Source WS | Consumer WS | Description |
|-------|-----------|-------------|-------------|
| `MobileShell` with `situationContent` slot | WS-A.2 | WS-B.1, WS-B.2 | Content area where threat banner, priority strip, and category grid render |
| `MobileHeader` with `threatIndicator` slot | WS-A.2 | WS-B.1 | Slot for `MobileThreatIndicator` glow badge |
| `MobileHeader` with `scanLine` slot | WS-A.2 | WS-A.3 (already filled) | Slot for `MobileScanLine` (delivered within Phase A) |
| Connectivity dot placeholder in header | WS-A.2 | WS-B.3 | Static green circle replaced with reactive component |
| Spacing tokens (`--space-card-padding`, `--space-card-gap`, `--space-section-gap`, `--space-content-padding`) | WS-A.3 | WS-B.1, WS-B.2 | Layout spacing for banner, strip, and grid |
| Typography tokens (`--text-hero-metric`, `--text-card-metric`, `--text-card-title`, etc.) | WS-A.3 | WS-B.1, WS-B.2 | Text sizing for all Situation tab components |
| Glass tokens (`--glass-card-bg`, `--glass-card-blur`) | WS-A.3 | WS-B.2 | CategoryCard glass material |
| Severity tokens (`--severity-extreme` through `--severity-unknown`) | WS-A.3 | WS-B.1, WS-B.2 | Color-coding for severity badges and mini-bars |
| Posture-level tokens (`--posture-*-color`, `--posture-*-duration`) | WS-A.3 | WS-B.3 | ThreatPulseBackground ambient animation |
| `@keyframes threat-pulse` | WS-A.3 | WS-B.3 | ThreatPulseBackground CSS animation |
| Touch target tokens (`--touch-target-min`, `--touch-target-comfortable`) | WS-A.3 | WS-B.1, WS-B.2 | Touch target sizing for banner and cards |
| Corner bracket tokens | WS-A.3 | WS-B.1 | ThreatPictureCard decorative elements |
| Contrast-adjusted text tokens (`--color-text-secondary-mobile`, `--color-data-stale-bg`) | WS-A.3 | WS-B.3 | Data staleness banner and connectivity indicator |
| `--safe-area-top` token | WS-A.4 | WS-B.1 (if banner needs safe area awareness) | Safe area clearance for top-of-viewport banners |
| `useIsMobile()` hook | WS-A.1 | (already consumed by A.2; available to B workstreams if needed) | Viewport detection |
| `MobileTab` type | WS-A.2 | WS-B.1 (for cross-tab links from threat banner) | Tab type for programmatic tab switching |

**Gap identified (SPO):** The combined-recommendations mention a `MobileStateView` component (AD-7) for shared loading/error/empty states. No Phase A workstream creates this component. It is referenced as "should be built in Phase A or early Phase B" but is not assigned to any workstream. **Recommendation:** Add `MobileStateView` to WS-B.1 or create a small WS-B.0 workstream. Every Phase B component consumes TanStack Query hooks and must handle loading/error/empty states -- a shared component prevents inconsistent patterns.

---

## 9. Gaps and Recommendations

### 9.1 Missing: `MobileStateView` Component (SPO)

Combined-recommendations AD-7 specifies a shared loading/error/empty state component. No SOW in Phase A assigns its creation. Phase B workstreams (B.1, B.2, B.3) all consume TanStack Query hooks and need this pattern.

**Recommendation:** Create a brief WS-A.2.1 addendum or assign to WS-B.1 (first Phase B workstream to execute). The component is simple (~80 lines: skeleton shimmer, error card with retry, empty state message) and prevents 3+ Phase B workstreams from independently inventing inconsistent patterns.

### 9.2 Missing: WS-A.2 CSS Token References (CTA)

WS-A.2's `mobile-shell.css` (Section D-6) hardcodes glass material values instead of referencing WS-A.3 tokens. If the glass values are ever adjusted, they must be updated in two places -- violating single-source-of-truth.

**Recommendation:** After Conflict 1 is resolved, update WS-A.2's CSS deliverable to use `var(--glass-header-bg)`, `var(--glass-header-blur)`, `var(--glass-nav-bg)`, `var(--glass-nav-blur)` instead of hardcoded rgba/blur values.

### 9.3 Missing: `mobile-shell.css` Import Statement (STW)

WS-A.2 creates `src/styles/mobile-shell.css` but does not specify where it is imported. WS-A.3 specifies that `mobile-tokens.css` is imported in `globals.css`. However, `mobile-shell.css` is imported by `MobileShell.tsx` directly (confirmed by "Imported by `MobileShell.tsx`" note in WS-A.2 D-6). This is fine for code-split delivery, but should be explicitly stated in the deliverable description.

**Recommendation:** Add a note to WS-A.2 D-6: "This file is imported directly by `MobileShell.tsx` (not added to `globals.css`), ensuring it is only loaded within the mobile code-split chunk."

### 9.4 WS-A.3 Blur Override Inconsistency (CTA)

WS-A.3 defines `--blur-active: 12px` as the mobile override for the desktop's `16px`. However, the glass token `--glass-sheet-blur` uses `blur(16px) saturate(130%)` -- the desktop value, not the overridden mobile value.

**Recommendation:** Clarify whether `--glass-sheet-blur` should use `var(--blur-active)` (which would resolve to `12px` on mobile) or deliberately uses the desktop `16px` for the bottom sheet (higher-tier glass). If the latter, document this as an intentional exception to the blur override hierarchy.

### 9.5 No Automated Tests Specified (PMO)

None of the four SOWs include unit or integration tests as deliverables. `useIsMobile()` is a strong candidate for a unit test (test `matchMedia` mock, test live change event, test null initial state). The morph cancellation guard in MobileShell is another candidate.

**Recommendation:** Add at minimum a `use-is-mobile.test.ts` to WS-A.1 deliverables and a MobileShell tab-switch-with-morph-guard test to WS-A.2. These are low-effort and high-value regression guardrails.

### 9.6 `HydrationShell` Placement (STW)

WS-A.1 places `HydrationShell.tsx` in `src/components/mobile/` (per AD-4). However, `HydrationShell` is imported by `page.tsx` (the orchestrator), which is not mobile-specific -- it renders for ALL users during the detection phase. Placing it in the `mobile/` directory implies it is mobile-only.

**Recommendation:** This is a minor naming/placement concern. The component is genuinely lightweight (a single div) and is only relevant during the mobile detection path. Placement in `src/components/mobile/` is acceptable but should be noted in its JSDoc as "used by the page orchestrator during viewport detection, not exclusively by the mobile view."

---

## 10. Effort and Sequencing Assessment (PMO)

### 10.1 Effort Estimates

| WS | Size | Estimated Effort | Complexity | Rationale |
|----|------|-----------------|------------|-----------|
| WS-A.1 | S | 2-3 hours | Low | Mechanical file extraction (zero-modification), simple hook, thin orchestrator. The bulk of effort is verification (AC-1 desktop regression, AC-7/8/9 chunk analysis). |
| WS-A.4 | S | 1-2 hours | Low | 3 files modified, ~15 lines added. Effort is almost entirely verification (device testing for AC-8). |
| WS-A.3 | M | 4-6 hours | Medium | ~80 token definitions require precise value sourcing from multiple design documents. MobileScanLine component is simple. Risk: value disagreements with WS-A.2 (Conflict 1). |
| WS-A.2 | M | 6-8 hours | Medium | 3 new components + 1 modification + 1 CSS file + 1 type file. Complexity is in the tab state management, morph guard, landscape detection, and SessionTimecode inline mode. |

**Total Phase A:** 13-19 hours of implementation effort (excluding review and verification).

### 10.2 Resource Loading

| Agent/Role | Workstreams | Conflict Risk |
|------------|-------------|---------------|
| `react-developer` | WS-A.1, WS-A.4 | None -- A.1 and A.4 are independent and can run in parallel. |
| `world-class-ui-designer` | WS-A.2, WS-A.3 | **Sequential dependency** -- A.3 must complete before A.2 begins (Conflict 3 resolution). Same agent assigned to both, which eliminates handoff risk but makes them serial. |

### 10.3 Parallel Execution Opportunities

**Wave 1 (parallel):**
- WS-A.1 (`react-developer`) -- creates directories, extracts DesktopView, builds orchestrator
- WS-A.4 (`react-developer`) -- adds viewport meta, safe area tokens, Tailwind bridge

These share the same agent but have no file conflicts and can be developed as a single atomic commit or two independent ones. Total: 3-5 hours.

**Wave 2:**
- WS-A.3 (`world-class-ui-designer`) -- creates token file, MobileScanLine, globals.css import

Depends on WS-A.1 (for `src/components/mobile/` directory) and should incorporate WS-A.4 OQ-2 resolution (drop duplicate safe area tokens). Total: 4-6 hours.

**Wave 3:**
- WS-A.2 (`world-class-ui-designer`) -- creates MobileShell, MobileHeader, MobileBottomNav, SessionTimecode modification, mobile-shell.css

Depends on WS-A.1 (entry point), WS-A.3 (tokens), WS-A.4 (safe areas). Total: 6-8 hours.

### 10.4 Recommended Execution Order

```
Day 1:  WS-A.1 + WS-A.4 (parallel, same developer)
        Resolve OQ-4 (glass values) and OQ-5 (hamburger placement) with stakeholders
Day 2:  WS-A.3 (depends on A.1 directory, incorporates A.4 safe area resolution)
Day 3:  WS-A.2 (depends on A.1, A.3, A.4)
Day 3+: Phase A review gate, desktop regression verification, device testing
```

### 10.5 Bottleneck Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Conflict 1 (glass values) delays WS-A.2** | Medium | Medium | Resolve before Wave 2. If design lead is unavailable, default to WS-A.3's values (0.85/0.90 alpha, 8px blur) and note as revisitable. |
| **WS-A.1 desktop regression blocks all downstream** | Low | High | Zero-modification extraction strategy. If regression found, diff `DesktopView.tsx` against original `page.tsx`. |
| **iOS device testing for WS-A.4 AC-8 not available** | Medium | Low | Can be deferred to Phase A review gate. The `env()` mechanism is well-understood and does not require device testing to ship. |
| **WS-A.3 token count (~80) introduces typos** | Medium | Low | Lint/typecheck will catch CSS syntax errors. Visual regression requires desktop comparison. |
| **WS-A.2 SessionTimecode modification causes desktop regression** | Low | Medium | Change is additive (new optional prop). Desktop usage passes no prop, so existing codepath executes unchanged. Verify AC-15 explicitly. |

### 10.6 Phase A Summary

Phase A is low-risk foundational work. The most important pre-implementation step is resolving the three blocking open questions (OQ-4: glass values, OQ-5: hamburger placement, OQ-9: safe area token deduplication). Once those are settled, the four workstreams execute cleanly in three sequential waves with a total elapsed time of approximately 3 working days for a single developer, or 2 days with the two-agent assignment.

---

## Appendix: File Change Summary

| File | Change Type | Source WS | Description |
|------|-------------|-----------|-------------|
| `src/hooks/use-is-mobile.ts` | New | WS-A.1 | Viewport detection hook |
| `src/components/mobile/HydrationShell.tsx` | New | WS-A.1 | Void background during detection |
| `src/views/DesktopView.tsx` | New (extraction) | WS-A.1 | Complete current page.tsx contents |
| `src/views/MobileView.tsx` | New | WS-A.1 (stub), WS-A.2 (populated) | Mobile entry point |
| `src/app/(launch)/page.tsx` | Rewritten | WS-A.1 | Thin orchestrator (~30 lines) |
| `src/lib/interfaces/mobile.ts` | New | WS-A.2 | `MobileTab` type definition |
| `src/components/mobile/MobileShell.tsx` | New | WS-A.2 | Root layout container |
| `src/components/mobile/MobileHeader.tsx` | New | WS-A.2 | Fixed 48px top bar |
| `src/components/mobile/MobileBottomNav.tsx` | New | WS-A.2 | Fixed 56px bottom tab bar |
| `src/components/ambient/session-timecode.tsx` | Modified | WS-A.2 | Add `inline` prop |
| `src/styles/mobile-shell.css` | New | WS-A.2 | Shell component styles |
| `src/styles/mobile-tokens.css` | New | WS-A.3 | All mobile design tokens |
| `src/components/mobile/MobileScanLine.tsx` | New | WS-A.3 | CSS-only horizontal sweep |
| `src/app/globals.css` | Modified | WS-A.3, WS-A.4 | Add `mobile-tokens.css` import + `@theme` registrations + safe area bridge |
| `src/app/layout.tsx` | Modified | WS-A.4 | Add `Viewport` export |
| `src/styles/spatial-tokens.css` | Modified | WS-A.4 | Add 4 safe area custom properties to `:root` |
