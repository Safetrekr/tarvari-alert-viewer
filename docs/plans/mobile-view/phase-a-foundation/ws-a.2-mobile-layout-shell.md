# WS-A.2: Mobile Layout Shell

> **Workstream ID:** WS-A.2
> **Phase:** A -- Foundation
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.1 (provides `MobileView` entry point, `useIsMobile` hook, `src/components/mobile/` directory), WS-A.3 (provides glass, spacing, and layout tokens), WS-A.4 (provides safe area tokens)
> **Blocks:** WS-B.1 (threat banner + priority need header/shell), WS-B.2 (category grid renders inside shell), WS-B.3 (ambient + connectivity dot need header), WS-C.1 (bottom sheet portals into shell), WS-C.3 (map view renders as tab content), WS-C.5 (settings sheet triggered from bottom nav hamburger)
> **Resolves:** Gap 6 (morph + tab switch conflict), Gap 7 (landscape detection)

## 1. Objective

Build the three structural components that form the mobile viewport scaffold: `MobileShell` (root layout container with tab state management), `MobileHeader` (48px fixed top bar with glass aesthetic), and `MobileBottomNav` (56px fixed bottom tab bar). These components establish the spatial frame within which all subsequent mobile workstreams render their content. The shell must handle tab switching, URL-based deep linking on initial load, morph cancellation on tab switch (Gap 6), and landscape orientation detection (Gap 7).

This workstream delivers an empty but structurally complete mobile layout -- header with logo and placeholder slots, scrollable content area that renders nothing yet, and a bottom nav with three functional tabs and a hamburger button. Subsequent workstreams fill in the content (WS-B.1 through WS-E.3).

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `MobileShell` layout | Flexbox column container: fixed header (48px), scrollable content area (`flex: 1`, `overflow-y: auto`), fixed bottom nav (56px + safe area). Background `var(--color-void)` (`#050911`). |
| Tab state management | `useState<MobileTab>` where `MobileTab = 'situation' \| 'map' \| 'intel'`. Default: `'situation'`. Tab switches update local state only (AD-3). |
| URL sync on mount | Read `?tab=map\|intel` from URL on initial load to set starting tab. Read `?district={id}` to set initial tab to `'situation'` (category detail bottom sheet opened by WS-D.1). No URL updates on subsequent tab switches. |
| Morph cancellation on tab switch | Tab-switch handler reads `useUIStore.getState().morph.phase`; if not `'idle'`, calls `resetMorph()` before switching (Gap 6). |
| Landscape orientation listener | `window.matchMedia('(orientation: landscape)')` listener that exposes an `isLandscape` boolean for layout variants (Gap 7). CSS `@media (orientation: landscape)` class on the shell root. |
| `MobileHeader` structure | 48px fixed header at z-40. Glass background. Contains: Tarva logo SVG (12px height, 40% opacity), `SessionTimecode` (reused, inline mode), search button placeholder (Lucide `Search` icon), connectivity dot placeholder (static 8px circle). |
| `SessionTimecode` mobile adaptation | Add an optional `inline` prop to the existing `SessionTimecode` component in `src/components/ambient/session-timecode.tsx`. When `inline` is true, renders as a `position: relative` inline-flex element instead of `position: fixed` bottom-right. No changes to desktop rendering. |
| `MobileBottomNav` structure | 56px fixed bottom bar at z-40. Glass background. Three tab buttons (Situation, Map, Intel) using Lucide icons + labels. Hamburger button (Lucide `Menu`). Active/inactive opacity states. |
| `MobileTab` type | Export `MobileTab` type from `src/lib/interfaces/mobile.ts` for reuse by other mobile components. |
| Placeholder slots | Named slot areas (render-prop or children pattern) where WS-B.1 (`MobileThreatIndicator`), WS-A.3 (`MobileScanLine`), and WS-B.3 (connectivity logic) will inject their components. |
| Touch target compliance | All interactive elements in header and bottom nav meet 48px design target (44px WCAG minimum). |
| Reduced motion support | Respect `prefers-reduced-motion` for any transition on tab switching. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileScanLine` component | Created in WS-A.3 (Design Tokens + Ambient). MobileHeader provides a slot for it. |
| `MobileThreatIndicator` component | Created and wired in WS-B.1. MobileHeader provides a slot for it. |
| Connectivity dot logic (`navigator.onLine` + TanStack Query health) | Wired in WS-B.3 (Ambient + Protective Ops). This WS renders a static placeholder dot only. |
| Safe area `env()` values in CSS | WS-A.4 (Viewport Meta + Safe Areas) handles `env(safe-area-inset-*)` integration. This WS reserves space using CSS custom properties that WS-A.4 will define. |
| Tab content components | All tab content (Situation, Map, Intel) is built in Phases B through E. This WS renders an empty `<div>` per tab. |
| Settings bottom sheet | WS-C.5. The hamburger button is rendered but its `onClick` is a no-op placeholder. |
| Bottom sheet portal container | WS-C.1 (Bottom Sheet Core). MobileShell does not need to provide a portal target; the bottom sheet will use React portals to `document.body`. |
| Pull-to-refresh gesture | WS-F.5. The scrollable content area is standard overflow; no touch gesture handling. |
| Mobile design tokens CSS file | WS-A.3 creates `mobile-tokens.css`. This WS consumes those tokens via `var()` references (see DM-1). |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-A.1 | `src/views/MobileView.tsx` entry point that renders `MobileShell` | Pending (WS-A.1 must complete first) |
| WS-A.1 | `src/components/mobile/` directory created | Pending |
| WS-A.1 | `useIsMobile()` hook in `src/hooks/use-is-mobile.ts` | Pending |
| `src/stores/ui.store.ts` | `resetMorph()` action, `morph.phase` selector | Exists (lines 145-149, 169) |
| `src/components/ambient/session-timecode.tsx` | `SessionTimecode` component for reuse in header | Exists (will be modified to add `inline` prop) |
| `public/images/logo/tarva-white-logo.svg` | Tarva white logo SVG for header | Exists |
| `src/styles/spatial-tokens.css` | Design tokens: `--color-void`, `--color-border-subtle`, `--font-mono`, `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary` | Exists |
| Lucide React icons | `Search`, `LayoutGrid`, `Map`, `Radio`, `Menu` | Available via existing `lucide-react` dependency |
| `src/lib/interfaces/coverage.ts` | `KNOWN_CATEGORIES` for `?district=` validation on mount | Exists (line 45) |

## 4. Deliverables

### D-1: `MobileTab` type (`src/lib/interfaces/mobile.ts`)

New file establishing the shared mobile tab type.

```typescript
/**
 * Mobile navigation tab identifiers.
 * Situation is the default tab (no URL parameter required).
 *
 * @module mobile
 * @see AD-3 (Tab State Management)
 */
export type MobileTab = 'situation' | 'map' | 'intel'

/** Valid tab values for URL parameter parsing. */
export const MOBILE_TABS: readonly MobileTab[] = ['situation', 'map', 'intel'] as const

/** Default tab when no URL parameter is present. */
export const DEFAULT_MOBILE_TAB: MobileTab = 'situation'
```

### D-2: `MobileShell` component (`src/components/mobile/MobileShell.tsx`)

Root layout container. Flexbox column filling the viewport.

**Structure:**

```
<div class="mobile-shell" data-orientation="portrait|landscape">
  <MobileHeader ... />            <!-- fixed, 48px, z-40 -->
  <main class="mobile-content">   <!-- flex: 1, overflow-y: auto -->
    {activeTab === 'situation' && <SituationSlot />}
    {activeTab === 'map' && <MapSlot />}
    {activeTab === 'intel' && <IntelSlot />}
  </main>
  <MobileBottomNav ... />          <!-- fixed, 56px + safe area, z-40 -->
</div>
```

**Props interface:**

```typescript
export interface MobileShellProps {
  /** Render prop for Situation tab content. Null renders empty placeholder. */
  situationContent?: React.ReactNode
  /** Render prop for Map tab content. Null renders empty placeholder. */
  mapContent?: React.ReactNode
  /** Render prop for Intel tab content. Null renders empty placeholder. */
  intelContent?: React.ReactNode
  /** Slot for MobileScanLine rendered inside MobileHeader (WS-A.3). */
  scanLine?: React.ReactNode
  /** Slot for MobileThreatIndicator rendered inside MobileHeader (WS-B.1). */
  threatIndicator?: React.ReactNode
  /** Handler invoked when hamburger button is tapped (WS-C.5 wires this). */
  onMenuPress?: () => void
  /** Handler invoked when search button is tapped (WS-E.2 wires this). */
  onSearchPress?: () => void
}
```

**Key behaviors:**

1. **Tab state (AD-3):** `const [activeTab, setActiveTab] = useState<MobileTab>(DEFAULT_MOBILE_TAB)`. On mount, reads `?tab=` from `window.location.search`. If valid (`'map'` or `'intel'`), sets initial tab. If `?district=` is present and matches a `KNOWN_CATEGORIES` id, keeps tab as `'situation'` (the category detail bottom sheet is opened by WS-D.1 reading the same URL param).

2. **Tab switching with morph guard (Gap 6):** The `handleTabChange` function checks `useUIStore.getState().morph.phase !== 'idle'` and calls `useUIStore.getState().resetMorph()` before calling `setActiveTab(newTab)`. This prevents orphaned morph animations when the user switches tabs during the 300ms fast-path morph.

3. **Landscape detection (Gap 7):** Uses `window.matchMedia('(orientation: landscape)')` with an `addEventListener('change', ...)` listener. Exposes `isLandscape` boolean and sets `data-orientation="landscape"` on the shell root element. CSS can target `[data-orientation="landscape"]` for layout variants in WS-F.1.

4. **Layout CSS:** The shell uses a flexbox column layout:
   ```css
   .mobile-shell {
     display: flex;
     flex-direction: column;
     height: 100dvh;                    /* dynamic viewport height */
     width: 100vw;
     overflow: hidden;
     background: var(--color-void);     /* #050911 */
     color: var(--color-text-primary);
     position: relative;
   }
   .mobile-content {
     flex: 1;
     overflow-y: auto;
     overflow-x: hidden;
     -webkit-overflow-scrolling: touch;
     overscroll-behavior-y: contain;    /* prevent pull-to-refresh bounce until WS-F.5 */
   }
   ```

5. **Tab content rendering:** Uses conditional rendering (`activeTab === 'situation' && ...`). Unmounted tabs do not retain scroll position -- this is acceptable because the data layer (TanStack Query cache) persists across tab switches. Future optimization: wrap in `<div hidden>` if scroll retention becomes a requirement.

### D-3: `MobileHeader` component (`src/components/mobile/MobileHeader.tsx`)

Fixed 48px top bar with glass aesthetic.

**Structure:**

```
<header class="mobile-header">
  <img src="/images/logo/tarva-white-logo.svg" ... />  <!-- 12px height, 40% opacity -->
  {scanLine}                                             <!-- WS-A.3 slot -->
  <div class="mobile-header-right">
    <SessionTimecode inline />                           <!-- reused, inline mode -->
    {threatIndicator}                                    <!-- WS-B.1 slot -->
    <button aria-label="Search">                         <!-- WS-E.2 wires handler -->
      <Search size={18} />
    </button>
    <div class="connectivity-dot" />                     <!-- 8px, static green placeholder -->
  </div>
</header>
```

**Visual specification:**

| Property | Value | Token Reference |
|----------|-------|----------------|
| Height | 48px | -- |
| Position | `fixed`, `top: 0`, `left: 0`, `right: 0` | -- |
| z-index | 40 | Per OVERVIEW z-index table |
| Background | `rgba(5, 9, 17, 0.92)` | Derived from `--color-void` with 92% alpha |
| Backdrop filter | `blur(16px) saturate(130%)` | `--blur-active` (16px) |
| Bottom border | `1px solid rgba(255, 255, 255, 0.06)` | `var(--color-border-subtle)` |
| Padding | `0 12px` | -- |
| Display | `flex`, `align-items: center`, `justify-content: space-between` | -- |
| Gap (right cluster) | `8px` | -- |

**Logo:** `<img>` element referencing `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/images/logo/tarva-white-logo.svg`. Height 12px. Opacity 0.4. `pointer-events: none`. `alt="Tarva"`.

**Search button:** Lucide `Search` icon at 18px. Wrapped in a `<button>` with `min-width: 48px`, `min-height: 48px`, `display: flex`, `align-items: center`, `justify-content: center`. No background, no border. Icon color `rgba(255, 255, 255, 0.4)`. `aria-label="Search"`. Calls `onSearchPress` prop (no-op until WS-E.2).

**Connectivity dot:** `<div>` element, 8px width/height, `border-radius: 50%`, `background-color: var(--color-healthy)` (green, `#22c55e`). Static in this WS. WS-B.3 replaces with a reactive component keyed to `navigator.onLine` and TanStack Query freshness.

**Props interface:**

```typescript
export interface MobileHeaderProps {
  /** Slot for MobileScanLine (WS-A.3). */
  scanLine?: React.ReactNode
  /** Slot for MobileThreatIndicator (WS-B.1). */
  threatIndicator?: React.ReactNode
  /** Called when search button is tapped. */
  onSearchPress?: () => void
}
```

### D-4: `SessionTimecode` inline mode (modify `src/components/ambient/session-timecode.tsx`)

Add an optional `inline` boolean prop to the existing `SessionTimecode` component.

**Change scope:** Minimal. The component currently renders a `<div>` with `style={{ position: 'fixed', bottom: 16, right: 16, ... }}`. When `inline` is true, the wrapper renders with `style={{ position: 'relative', ... }}` instead, removing `bottom`, `right`, and `zIndex` properties. All internal logic (elapsed seconds, rAF frame counter, REC dot) remains identical.

**Prop addition:**

```typescript
interface SessionTimecodeProps {
  /** When true, renders inline (position: relative) instead of fixed viewport overlay.
   *  Used in MobileHeader where the timecode sits inside the header flex layout. */
  inline?: boolean
}
```

**Backward compatibility:** The `inline` prop defaults to `false`/`undefined`. The desktop `LaunchPage` renders `<SessionTimecode />` without the prop, so desktop behavior is unchanged. The mobile `MobileHeader` renders `<SessionTimecode inline />`.

**Font size adjustment for mobile context:** When `inline` is true, reduce font sizes slightly: REC label to 7px, timecode to 9px. The REC dot shrinks to 2.5px. These values ensure the timecode fits within the 48px header without overflow while maintaining the broadcast-aesthetic readability.

### D-5: `MobileBottomNav` component (`src/components/mobile/MobileBottomNav.tsx`)

Fixed 56px bottom tab bar with ghost aesthetic.

**Structure:**

```
<nav class="mobile-bottom-nav" role="tablist" aria-label="Main navigation">
  <button role="tab" aria-selected={active} aria-controls="tab-situation">
    <LayoutGrid size={20} />
    <span>Situation</span>
  </button>
  <button role="tab" aria-selected={active} aria-controls="tab-map">
    <Map size={20} />
    <span>Map</span>
  </button>
  <button role="tab" aria-selected={active} aria-controls="tab-intel">
    <Radio size={20} />
    <span>Intel</span>
  </button>
  <button aria-label="Menu">
    <Menu size={20} />
  </button>
</nav>
```

**Visual specification:**

| Property | Value | Token Reference |
|----------|-------|----------------|
| Height | 56px + `env(safe-area-inset-bottom, 0px)` | WS-A.4 finalizes safe area values |
| Position | `fixed`, `bottom: 0`, `left: 0`, `right: 0` | -- |
| z-index | 40 | Per OVERVIEW z-index table |
| Background | `rgba(5, 9, 17, 0.92)` | Same glass as header |
| Backdrop filter | `blur(16px) saturate(130%)` | Same as header |
| Top border | `1px solid rgba(255, 255, 255, 0.06)` | `var(--color-border-subtle)` |
| Padding bottom | `env(safe-area-inset-bottom, 0px)` | Safe area for iPhone home indicator |
| Display | `flex`, `align-items: center`, `justify-content: space-around` | -- |

**Tab button visual states:**

| State | Icon opacity | Label opacity | Underline |
|-------|-------------|--------------|-----------|
| Active | `0.8` | `0.5` | 2px solid, `var(--color-ember)`, centered below icon, 20px wide |
| Inactive | `0.25` | `0.2` | None |
| Pressed | `0.6` | `0.4` | None (transition to active underline) |

**Tab button dimensions:** Each button is a flex column (`flex-direction: column`, `align-items: center`, `gap: 2px`). Minimum touch target: `min-width: 48px`, `min-height: 48px`. Label font: `var(--font-mono)`, 9px, `letter-spacing: 0.08em`, uppercase, `line-height: 1`.

**Hamburger button:** Same dimensions as tab buttons. Lucide `Menu` icon at 20px. Opacity 0.25 at rest. Calls `onMenuPress` prop (no-op until WS-C.5 wires the settings sheet).

**Active tab underline:** A 2px-tall, 20px-wide bar centered below the icon. Uses `var(--color-ember)` (`#e05200` in default scheme, `#4ba467` in SafeTrekr scheme). Appears with a 150ms opacity transition (`var(--duration-fast)`). The underline color may be overridden to reflect severity level in future workstreams, but for WS-A.2 it uses the primary accent color.

**Props interface:**

```typescript
import type { MobileTab } from '@/lib/interfaces/mobile'

export interface MobileBottomNavProps {
  /** Currently active tab. */
  activeTab: MobileTab
  /** Called when a tab button is pressed. */
  onTabChange: (tab: MobileTab) => void
  /** Called when the hamburger menu button is pressed. */
  onMenuPress?: () => void
}
```

### D-6: CSS file (`src/styles/mobile-shell.css`)

Dedicated CSS file for the three shell components. Imported by `MobileShell.tsx`.

**Contents:**

```css
/* Mobile Shell -- structural layout */
.mobile-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background: var(--color-void);
  color: var(--color-text-primary);
  position: relative;
  /* Prevent text selection on the shell chrome */
  -webkit-user-select: none;
  user-select: none;
}

.mobile-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  /* Offset for fixed header and bottom nav */
  padding-top: 48px;
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
}

/* Re-enable text selection inside content area */
.mobile-content * {
  -webkit-user-select: text;
  user-select: text;
}

/* Header glass panel */
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--glass-header-bg);
  backdrop-filter: var(--glass-header-blur);
  -webkit-backdrop-filter: var(--glass-header-blur);
  border-bottom: 1px solid var(--color-border-subtle);
}

/* Bottom nav glass panel */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(56px + var(--safe-area-bottom, 0px));
  padding-bottom: var(--safe-area-bottom, 0px);
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--glass-nav-bg);
  backdrop-filter: var(--glass-nav-blur);
  -webkit-backdrop-filter: var(--glass-nav-blur);
  border-top: 1px solid var(--color-border-subtle);
}

/* Tab button base */
.mobile-tab-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 48px;
  min-height: 48px;
  padding: 4px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  color: rgba(255, 255, 255, 0.25);
  transition: color var(--duration-fast) var(--ease-default);
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
  -webkit-tap-highlight-color: transparent;
}

.mobile-tab-button[data-active='true'] {
  color: rgba(255, 255, 255, 0.8);
}

.mobile-tab-button[data-active='true'] .mobile-tab-label {
  opacity: 0.5;
}

.mobile-tab-button[data-active='false'] .mobile-tab-label {
  opacity: 0.2;
}

/* Active tab underline */
.mobile-tab-underline {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  border-radius: 1px;
  background: var(--color-ember);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-default);
}

.mobile-tab-button[data-active='true'] .mobile-tab-underline {
  opacity: 1;
}

/* Landscape orientation adjustments (Gap 7 foundation) */
@media (orientation: landscape) {
  .mobile-content {
    /* Landscape may use different padding in WS-F.1 */
  }
}

/* Reduced motion: no tab switch transitions */
@media (prefers-reduced-motion: reduce) {
  .mobile-tab-button,
  .mobile-tab-underline {
    transition: none;
  }
}
```

### D-7: Integration in `MobileView.tsx`

After WS-A.1 creates the `MobileView.tsx` stub in `src/views/MobileView.tsx`, this workstream populates it to render the shell:

```typescript
import { MobileShell } from '@/components/mobile/MobileShell'

export default function MobileView() {
  return <MobileShell />
}
```

This is a minimal integration point. Subsequent workstreams add content props (`situationContent`, `mapContent`, `intelContent`) and wire handlers (`onMenuPress`, `onSearchPress`).

**CSS import:** `MobileShell.tsx` must include `import '@/styles/mobile-shell.css'` as its first import. This CSS file is imported directly by the component (not added to `globals.css`), ensuring it is only loaded within the mobile code-split chunk.

### D-8: `MobileStateView` component (`src/components/mobile/MobileStateView.tsx`)

*Added per Phase A Review H-3 (AD-7 from combined-recommendations).*

Shared loading/error/empty state component consumed by all Phase B+ components that use TanStack Query hooks.

**Props interface:**

```typescript
import type { UseQueryResult } from '@tanstack/react-query'

export interface MobileStateViewProps {
  /** TanStack Query result object to derive state from. */
  query: UseQueryResult<unknown, Error>
  /** Component to render during loading (skeleton shimmer). */
  skeletonComponent?: React.ReactNode
  /** Title shown when data is empty. */
  emptyTitle?: string
  /** Message shown when data is empty. */
  emptyMessage?: string
  /** Label for retry button on error. Default: "Retry". */
  retryLabel?: string
}
```

**States:**
1. **Loading** (`query.isLoading`): Renders `skeletonComponent` if provided, otherwise a centered pulsing placeholder.
2. **Error** (`query.isError`): Renders error card with `query.error.message` and a retry button that calls `query.refetch()`.
3. **Empty** (`query.isSuccess && !query.data` or empty array): Renders `emptyTitle` + `emptyMessage` centered on void background.
4. **Success** (fallback): Returns `null` — the parent component renders its own content.

~80 lines. Uses `var(--glass-card-bg)` for error card background. Retry button meets 48px touch target.

### D-9: Unit Tests

*Added per Phase A Review H-4.*

**`src/components/mobile/__tests__/MobileShell.test.tsx`:**
- Test morph guard: mock `useUIStore` with `morph.phase = 'entering-district'`, call tab switch, assert `resetMorph` called before `setActiveTab`.
- Test default tab is `'situation'`.
- Test `?tab=map` URL parsing sets initial tab to `'map'`.
- Test `?district=seismic` keeps tab as `'situation'`.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | MobileShell renders a full-viewport flexbox column with void background (`#050911`) when accessed at viewport width <= 767px. | Manual: Chrome DevTools responsive mode at 375x812 (iPhone 14). Inspect computed styles. |
| AC-2 | MobileHeader is fixed at top, 48px tall, glass background visible, Tarva logo displayed at 12px height with 40% opacity. | Visual inspection in responsive mode. Verify `backdrop-filter` renders blur behind content. |
| AC-3 | MobileBottomNav is fixed at bottom, 56px tall (plus safe area), glass background, three tab buttons and hamburger rendered. | Visual inspection. Verify `env(safe-area-inset-bottom)` CSS property is present (value may be 0 without WS-A.4). |
| AC-4 | Default tab is Situation. Tapping Map or Intel tab buttons switches the active tab state. Active tab shows white icon (0.8 opacity), inactive tabs at 0.25 opacity. Active underline renders in `--color-ember` color. | Tap each tab. Verify visual state changes. Inspect `data-active` attribute. |
| AC-5 | Deep-link `?tab=map` on page load sets Map as the initial active tab. `?tab=intel` sets Intel. No parameter defaults to Situation. | Navigate to `localhost:3000/?tab=map`. Verify Map tab is active on load. |
| AC-6 | Deep-link `?district=seismic` on page load keeps Situation as the active tab (category detail opening is WS-D.1's responsibility). | Navigate to `localhost:3000/?district=seismic`. Verify Situation tab is active. |
| AC-7 | If the user switches tabs while `morph.phase !== 'idle'`, `resetMorph()` is called before the tab switch occurs (Gap 6). | Unit test: mock `useUIStore` with `morph.phase = 'entering-district'`, call `handleTabChange('map')`, assert `resetMorph` was called before `setActiveTab`. |
| AC-8 | Landscape orientation is detected via `matchMedia`. The shell root element has `data-orientation="landscape"` when in landscape mode. | Chrome DevTools: rotate device to landscape. Inspect `data-orientation` attribute on `.mobile-shell`. |
| AC-9 | `SessionTimecode` renders inline within the header (not fixed to viewport bottom-right) when `inline` prop is passed. Desktop rendering is unchanged when prop is omitted. | Mobile: verify timecode appears in header right cluster. Desktop: verify timecode remains at fixed bottom-right position. |
| AC-10 | All interactive elements (search button, tab buttons, hamburger) have a minimum touch target of 48x48px. | Chrome DevTools: inspect computed `min-width` and `min-height` on each button element. |
| AC-11 | Search button and hamburger button are rendered but are no-ops (no error on tap, no action). | Tap each button. Verify no console errors, no navigation, no side effects. |
| AC-12 | Connectivity dot renders as a static 8px green circle in the header. | Visual inspection. |
| AC-13 | The scrollable content area has `overscroll-behavior-y: contain` to prevent browser pull-to-refresh interference. | Inspect computed styles on `.mobile-content`. |
| AC-14 | `pnpm typecheck` passes with zero errors. | Run `pnpm typecheck` from project root. |
| AC-15 | Desktop view is completely unaffected. Loading at viewport >= 768px renders the existing desktop spatial ZUI with no visual or behavioral changes. | Manual comparison of desktop view before and after changes. `SessionTimecode` still renders fixed bottom-right. |
| AC-16 | Component uses `100dvh` (dynamic viewport height) to account for mobile browser chrome (address bar collapse). | Inspect computed height on `.mobile-shell`. Verify `dvh` unit in CSS. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | Glass background uses token references from WS-A.3: header `var(--glass-header-bg)` (0.85 alpha) with `var(--glass-header-blur)` (8px blur), nav `var(--glass-nav-bg)` (0.90 alpha) with `var(--glass-nav-blur)` (8px blur). | WS-A.3 is the single source of truth for all glass values. Creates clear visual hierarchy: header (0.85) < nav (0.90) < sheet (0.92). Resolved per Phase A Review H-1. | Hardcoded `rgba(5,9,17,0.92)` + `blur(16px)` from interface-architecture. Rejected per review: bypasses token system, loses hierarchy. |
| DM-2 | Tab content uses conditional rendering (unmount inactive tabs) rather than hidden `<div>` keep-alive. | Simpler implementation. Data persistence is handled by TanStack Query cache, so remounting triggers a cache hit (no network request). Scroll position loss is acceptable for Phase A; can be revisited if user testing reveals friction. | `display: none` / `hidden` attribute to preserve DOM. Rejected for Phase A: adds complexity, lazy-loaded tabs (Map) should not mount until accessed. |
| DM-3 | `SessionTimecode` gets an `inline` prop rather than creating a separate `MobileSessionTimecode` component. | Avoids duplicating 160 lines of timekeeping logic (rAF frame counter, setInterval seconds). The inline prop changes only the wrapper `<div>` positioning styles. Single source of truth for the timecode display. | (a) Create `MobileSessionTimecode` with duplicated logic. Rejected: maintenance burden. (b) Wrap existing component in a `position: relative` container. Rejected: the existing component uses inline `style={{ position: 'fixed' }}` which overrides parent positioning. |
| DM-4 | `MobileShell` uses props/slots for injecting child components (`scanLine`, `threatIndicator`, `situationContent`, etc.) rather than direct imports. | Maintains clean dependency boundaries between workstreams. WS-A.2 does not need to import or depend on components from WS-A.3, WS-B.1, etc. The `MobileView` entry point (progressively built across workstreams) wires the props. | Direct child imports inside MobileShell. Rejected: creates circular build dependencies between workstreams and prevents independent testing. |
| DM-5 | Tab icons use Lucide components `LayoutGrid`, `Map`, `Radio` as specified in interface-architecture Section 5.3. | These are concrete Lucide icon names matching the documented spec. The ux-strategy doc used informal names ("grid/map/radio"). `LayoutGrid` reads as "grid layout" which maps well to the Situation tab's category grid view. | `Shield` for Situation tab (mentioned in OVERVIEW wireframe). Rejected: `LayoutGrid` better represents the 2-column category grid that dominates the Situation tab. |
| DM-6 | URL is NOT updated on tab switch (AD-3). Only read on mount. | Avoids polluting browser history with tab changes. Tab state is ephemeral UI state, not navigation state. Deep-linking works via the initial URL parameter. | `history.replaceState` on every tab switch. Rejected per AD-3: the URL should not update on every switch. |
| DM-7 | CSS is in a dedicated `mobile-shell.css` file rather than inline styles or Tailwind utilities. | Consistent with the existing codebase pattern (`atrium.css`, `morph.css`, `enrichment.css`, etc.). BEM-like class names (`.mobile-header`, `.mobile-tab-button`) maintain selector clarity. The glass panel styles require `backdrop-filter` vendor prefixes that are cleaner in CSS than inline. | (a) Tailwind utility classes. Rejected: the glass panel requires composite `backdrop-filter` values and `env()` functions that are verbose in utility syntax. (b) Inline styles. Rejected: pseudo-selectors (`[data-active]`), media queries, and vendor prefixes cannot be expressed inline. |
| DM-8 | The `MobileTab` type is defined in `src/lib/interfaces/mobile.ts` (new file). | Follows the codebase convention of shared types in `src/lib/interfaces/`. The type will be imported by `MobileShell`, `MobileBottomNav`, and later by other mobile components that need to read or set tab state. Keeping it in a shared interfaces file avoids circular imports. | (a) Define inline in `MobileShell.tsx` and re-export. Rejected: consumers would import from a component file, which blurs the type/component boundary. (b) Add to `coverage.ts`. Rejected: mobile tab state is unrelated to coverage data types. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should tab switch animate the content area (e.g., horizontal slide via `AnimatePresence`)? The current spec says nothing about tab transition animation. Decision: start with instant swap; revisit if UX testing indicates disorientation. | world-class-ux-designer | Phase F (polish) |
| OQ-2 | The combined-recommendations and interface-architecture disagree on `MobileHeader` background values (0.85 vs 0.92 alpha, 8px vs 16px blur). DM-1 resolves this for now using the interface-architecture values, but should the UI design system doc be updated for consistency? | planning-coordinator | Phase A review gate |
| OQ-3 | Should the hamburger button have a visual badge/dot when there are unacknowledged settings changes or new features? No spec exists for this. | world-class-ux-designer | Phase F |
| OQ-4 | The OVERVIEW wireframe shows `[search] [menu]` both in the header. The interface-architecture places hamburger in the bottom nav only. This WS follows interface-architecture (hamburger in bottom nav). Confirm this is correct. | planning-coordinator | Phase A review gate |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `100dvh` is not supported on older mobile browsers (pre-2022 Safari, pre-Chrome 108). Falls back to `100vh` which may leave space behind the address bar. | Low | Medium | Add fallback: `height: 100vh; height: 100dvh;`. The second declaration overrides on supporting browsers. Older browsers use `100vh` which is acceptable (minor bottom gap when address bar is visible). |
| R-2 | `backdrop-filter` is not supported on Firefox Android < 103. Glass effect degrades to solid background. | Low | Low | Acceptable degradation. The solid `rgba(5,9,17,0.92)` background is nearly opaque and visually coherent without blur. No fallback needed. |
| R-3 | WS-A.1 delays delivery of `MobileView.tsx` entry point, blocking this workstream. | Medium | High | Begin development with a temporary test harness: create a `/test-mobile` route that renders `MobileShell` directly. Remove the test route when WS-A.1 delivers. This allows parallel development. |
| R-4 | `env(safe-area-inset-bottom)` evaluates to 0 in development (Chrome DevTools simulator does not inject safe area values). The bottom nav may appear to lack safe area padding. | High | Low | Expected behavior. WS-A.4 adds `viewport-fit=cover` to the meta tag, which activates `env()` values on real devices. Chrome DevTools responsive mode can be configured to simulate notch in newer versions. Document this in AC-3 notes. |
| R-5 | Modifying `SessionTimecode` to add `inline` prop could introduce a regression in the desktop viewport overlay. | Low | Medium | The change is additive: new optional prop defaults to `false/undefined`. Desktop usage `<SessionTimecode />` passes no prop, so the existing `position: fixed` codepath executes. Verify AC-15 (desktop unchanged) explicitly. |
| R-6 | Tab content conditional rendering causes the MapLibre GL map to fully unmount/remount when switching between Map and other tabs, incurring a visible re-initialization lag. | Medium | Medium | Acceptable for Phase A (Map tab is empty). When WS-C.3 builds the Map tab content, they may upgrade to a keep-alive pattern (rendering `<div hidden>` with `visibility: hidden` instead of unmounting). This WS documents the decision in DM-2 as revisitable. |
