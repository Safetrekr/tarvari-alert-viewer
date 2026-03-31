# WS-A.1: Detection + Code Splitting

> **Workstream ID:** WS-A.1
> **Phase:** A -- Foundation
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** None
> **Blocks:** WS-A.2, WS-A.3, WS-B.1, WS-B.2, WS-B.3 (all subsequent mobile work; WS-A.4 is independent)
> **Resolves:** AD-1 (Separate Mobile Component Tree), AD-4 (Mobile Component Directory), AD-5 (Code Splitting Boundaries -- page-level split only)

## 1. Objective

Establish the viewport detection and code splitting foundation that allows the TarvaRI Alert Viewer to serve entirely separate component trees to mobile and desktop users. After this workstream, `page.tsx` is a thin orchestrator that renders one of two dynamically imported views based on screen width, with a void hydration shell shown during the detection interval. Desktop behavior is byte-for-byte identical to the current implementation. Mobile receives a placeholder stub that subsequent workstreams (WS-A.2 onward) will populate.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **`useIsMobile` hook** | New hook at `src/hooks/use-is-mobile.ts`. Returns `boolean \| null`. Uses `window.matchMedia('(max-width: 767px)')` with live change listener. `null` during SSR / initial hydration. |
| **`HydrationShell` component** | New component at `src/components/mobile/HydrationShell.tsx`. Renders a full-viewport `#050911` void background during the `null` detection phase. No content, no layout shift. |
| **`DesktopView` extraction** | New file at `src/views/DesktopView.tsx`. Contains the complete current contents of `src/app/(launch)/page.tsx` (lines 1--742) with zero logic or JSX modifications. Only the export changes from `export default function LaunchPage()` to `export default function DesktopView()`. |
| **`MobileView` stub** | New file at `src/views/MobileView.tsx`. Minimal `'use client'` component rendering a centered placeholder message. Entry point for all subsequent mobile workstreams. |
| **`page.tsx` rewrite** | Rewrite `src/app/(launch)/page.tsx` as a ~30-line orchestrator: `useIsMobile()` -> conditional dynamic import rendering. |
| **Directory creation** | Create `src/views/` and `src/components/mobile/` directories (neither exists today). |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Mobile layout shell (`MobileShell`) | WS-A.2 |
| Mobile design tokens or ambient effects | WS-A.3 |
| Viewport meta tag or safe area configuration | WS-A.4 |
| Any mobile tab or content components | Phase B+ |
| Bottom sheet framework | WS-C.1 |
| Any modification to existing desktop components | Zero-delta extraction is a hard constraint |
| `layout.tsx` changes | The auth guard in `src/app/(launch)/layout.tsx` works correctly for both views as-is |
| Server-side rendering of view selection | Static export (GitHub Pages) means no SSR; all detection is client-side |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/app/(launch)/page.tsx` | Current 742-line page component to extract | Exists (read and verified) |
| `src/app/(launch)/layout.tsx` | Auth guard -- must remain unchanged | Exists (read and verified) |
| AD-1 (Combined Recommendations) | Architecture decision for separate component trees | Decided |
| AD-4 (Combined Recommendations) | `src/components/mobile/` flat directory convention | Decided |
| AD-5 (Combined Recommendations) | Code splitting boundary definitions | Decided |

## 4. Deliverables

### 4.1. `src/hooks/use-is-mobile.ts` -- Viewport Detection Hook

**Purpose:** Detect whether the current viewport is mobile-width. Returns a three-state value: `null` (unknown / hydrating), `true` (mobile), `false` (desktop).

**Type signature:**

```typescript
/**
 * Detect mobile viewport via matchMedia.
 *
 * Returns `null` on the server and during the first client render
 * (before useEffect fires). Returns `true` when the viewport is
 * <= 767px wide, `false` otherwise. Updates live on window resize
 * and orientation change via the matchMedia 'change' event.
 *
 * @returns boolean | null
 */
export function useIsMobile(): boolean | null
```

**Implementation requirements:**

1. Initialize state with `useState<boolean | null>(null)`.
2. In a `useEffect` (runs after first paint):
   - Create `MediaQueryList` via `window.matchMedia('(max-width: 767px)')`.
   - Set state to `mql.matches` immediately (resolves null to true/false).
   - Register a `change` event listener via `mql.addEventListener('change', handler)`.
   - The `handler` calls `setIsMobile(e.matches)`.
   - Return cleanup function that calls `mql.removeEventListener('change', handler)`.
3. No SSR guard needed beyond the `useState(null)` initialization -- `useEffect` does not run on the server.
4. The `MOBILE_BREAKPOINT` constant (`767` as a number) must be exported for test use:

```typescript
/** Max-width pixel value for the mobile media query. Exported for testing. */
export const MOBILE_BREAKPOINT = 767
```

**File conventions:**
- Follow the existing hook file naming pattern: `use-is-mobile.ts` (matching `use-pan-pause.ts`, `use-semantic-zoom.ts`, etc.).
- JSDoc module tag: `@module use-is-mobile`.
- No external dependencies beyond React.

### 4.2. `src/components/mobile/HydrationShell.tsx` -- Void Background Shell

**Purpose:** Render a visually inert full-viewport background during the `null` phase of `useIsMobile()`. Prevents a flash of unstyled content or layout shift while the hook resolves.

**Type signature:**

```typescript
/**
 * Full-viewport void background rendered during viewport detection.
 * Matches the application's void background color (#050911) so
 * the transition to either DesktopView or MobileView is seamless.
 *
 * No interactive content. No ARIA landmarks. Hidden from assistive
 * technology via aria-hidden.
 */
export function HydrationShell(): React.JSX.Element
```

**Implementation requirements:**

1. Render a single `<div>` with:
   - `className="fixed inset-0"` (full viewport coverage, matching the pattern in `layout.tsx` line 30).
   - `style={{ backgroundColor: '#050911' }}` -- the application's void/background color.
   - `aria-hidden="true"` -- not meaningful content.
2. No children, no text, no loading indicators.
3. No `'use client'` directive needed (this is a pure presentational component imported by a client component).
4. Must NOT import any stores, hooks, or heavy dependencies -- it will be in the main page chunk, not code-split.

**File location:** `src/components/mobile/HydrationShell.tsx` (creates the `src/components/mobile/` directory per AD-4).

### 4.3. `src/views/DesktopView.tsx` -- Extracted Desktop Component

**Purpose:** Contain the complete current `page.tsx` implementation with zero functional modifications. This is a mechanical extraction: the entire component body, all imports, all local helper functions, and all CSS imports move to this file.

**Extraction procedure (step-by-step):**

1. Create new file `src/views/DesktopView.tsx`.
2. Copy the entire contents of `src/app/(launch)/page.tsx` (lines 1--742) into the new file.
3. Change the function name from `LaunchPage` to `DesktopView`:
   - Line 167: `export default function LaunchPage()` becomes `export default function DesktopView()`
4. That is the only change. Specifically, do NOT modify:
   - Any import paths (all `@/` aliases resolve identically from `src/views/`).
   - Any hook calls, callbacks, or memoized values.
   - Any JSX structure, className strings, or style objects.
   - The `'use client'` directive (line 24 -- must remain).
   - The CSS imports (lines 102--107 -- must remain; they are desktop-specific styles).
   - The `Phase3Effects` component (lines 114--120).
   - The `usePrefersReducedMotion` hook (lines 126--129).
   - The `useInitialDistrictFromUrl` hook (lines 139--161).
   - The JSDoc comment block (lines 1--22 -- keep as-is or update module reference).

**What moves to `DesktopView.tsx` (complete list of imports from current `page.tsx`):**

```
react: useCallback, useEffect, useMemo, useRef
next/dynamic: dynamic
@/components/spatial/SpatialViewport: SpatialViewport
@/components/spatial/SpatialCanvas: SpatialCanvas
@/components/districts/morph-orchestrator: MorphOrchestrator
@/components/districts/dot-grid: DotGrid
@/components/spatial/NavigationHUD: NavigationHUD
@/components/spatial/Minimap: Minimap
@/components/spatial/ZoomIndicator: ZoomIndicator
@/components/ui/SpatialBreadcrumb: SpatialBreadcrumb
@/components/spatial/CommandPalette: CommandPalette
@/components/coverage/MapLedger: MapLedger
@/components/ambient: EnrichmentLayer, ZoomGate, HaloGlow, RangeRings,
  CoordinateOverlays, SystemStatusPanel, FeedPanel, SignalPulseMonitor,
  ActivityTicker, HorizonScanLine, DeepZoomDetails, SectorGrid,
  EdgeFragments, MicroChronometer, SessionTimecode, CalibrationMarks,
  TopTelemetryBar, BottomStatusStrip
@/components/district-view: DistrictViewOverlay
@/hooks/use-pan-pause: usePanPause
@/hooks/use-keyboard-shortcuts: useKeyboardShortcuts, KeyboardShortcutConfig
@/hooks/use-narration-cycle: useNarrationCycle
@/hooks/use-attention-choreography: useAttentionChoreography
@/hooks/use-enrichment-cycle: useEnrichmentCycle
@/stores/ui.store: useUIStore
@/stores/auth.store: useAuthStore
@/stores/settings.store: useSettingsStore
@/components/ui/ColorSchemeSwitcher: ColorSchemeSwitcher
@/lib/spatial-actions: returnToHub, flyToAlertDetail, returnFromAlertDetail
@/lib/interfaces/coverage: KNOWN_CATEGORIES, buildAllGridItems, CategoryGridItem
@/hooks/use-coverage-metrics: useCoverageMetrics
@/hooks/use-coverage-map-data: useCoverageMapData
@/stores/coverage.store: useCoverageStore, syncCoverageFromUrl,
  syncCategoriesToUrl, syncViewModeToUrl, timePresetToStartDate, TimePreset
@/components/coverage/CoverageOverviewStats: CoverageOverviewStats
@/components/coverage/ViewModeToggle: ViewModeToggle
@/components/coverage/TimeRangeSelector: TimeRangeSelector
@/components/coverage/CoverageGrid: GRID_WIDTH, GRID_HEIGHT
@/lib/interfaces/intel-bundles: ViewMode
@/hooks/use-intel-bundles: useIntelBundles
@/lib/coverage-utils: MapMarker
@/components/coverage/TriageRationalePanel: TriageRationalePanel
@/components/coverage/GeoSummaryPanel: GeoSummaryPanel
@/components/coverage/AlertDetailPanel: AlertDetailPanel
@/components/coverage/PriorityFeedStrip: PriorityFeedStrip
@/components/coverage/ThreatPictureCard: ThreatPictureCard
@/components/coverage/PriorityFeedPanel: PriorityFeedPanel
@/hooks/use-realtime-priority-alerts: useRealtimePriorityAlerts
@/hooks/use-notification-dispatch: useNotificationDispatch
@/hooks/use-intel-search: SearchResult
@/hooks/use-threat-picture: useThreatPicture
@/styles/atrium.css
@/styles/morph.css
@/styles/constellation.css
@/styles/enrichment.css
@/styles/district-view.css
@/styles/coverage.css
```

**Dynamic import within DesktopView (preserved from current page.tsx):**

```typescript
const CoverageMapDynamic = dynamic(
  () => import('@/components/coverage/CoverageMap').then((mod) => ({ default: mod.CoverageMap })),
  { ssr: false },
)
```

This `dynamic()` call stays inside `DesktopView.tsx`, not in the orchestrator `page.tsx`.

### 4.4. `src/views/MobileView.tsx` -- Mobile Entry Point Stub

**Purpose:** Minimal placeholder that subsequent workstreams will replace with the full mobile component tree. Must be a valid React component that renders something visible for verification.

**Type signature:**

```typescript
/**
 * Mobile view entry point for the TarvaRI Alert Viewer.
 * Stub: renders a placeholder. Replaced by WS-A.2 (MobileShell).
 *
 * @module MobileView
 */
export default function MobileView(): React.JSX.Element
```

**Implementation requirements:**

1. `'use client'` directive at the top.
2. Render a centered text message on the void background, e.g.:
   ```
   TarvaRI Alert Viewer -- Mobile
   ```
3. Use inline styles matching the application aesthetic:
   - Background: `#050911`
   - Text color: `rgba(255, 255, 255, 0.4)`
   - Font: `monospace` (consistent with the desktop telemetry aesthetic)
   - Full viewport: `min-height: 100dvh`
4. No imports of any desktop components, stores, or hooks beyond React itself.
5. No CSS file imports (mobile will use its own styles starting in WS-A.3).

### 4.5. `src/app/(launch)/page.tsx` -- Thin Orchestrator

**Purpose:** The page component becomes a lightweight router that detects the viewport and renders the appropriate view. This is the only file that imports both `DesktopView` and `MobileView` (via dynamic imports).

**Implementation:**

```typescript
'use client'

import dynamic from 'next/dynamic'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { HydrationShell } from '@/components/mobile/HydrationShell'

const DesktopView = dynamic(() => import('@/views/DesktopView'), { ssr: false })
const MobileView = dynamic(() => import('@/views/MobileView'), { ssr: false })

export default function LaunchPage() {
  const isMobile = useIsMobile()

  if (isMobile === null) return <HydrationShell />
  if (isMobile) return <MobileView />
  return <DesktopView />
}
```

**Requirements and constraints:**

1. The function name stays `LaunchPage` (matches the route convention -- the `(launch)` route group).
2. Both views use `next/dynamic` with `{ ssr: false }`:
   - This enforces code splitting: webpack creates separate chunks for each view.
   - `ssr: false` is consistent with the existing pattern in the codebase (CoverageMap is loaded the same way).
   - Since the project uses static export (`output: 'export'`), there is no server rendering, but `ssr: false` still correctly defers loading to client hydration.
3. No `loading` property on the dynamic imports -- `HydrationShell` already handles the null state, and `next/dynamic`'s default Suspense boundary will show nothing (which is fine since the void background is already painted).
4. The `useIsMobile()` hook is called unconditionally (not inside a conditional -- React hooks rule).
5. All previous `page.tsx` imports are gone from this file. The only imports are `dynamic`, `useIsMobile`, and `HydrationShell`.
6. No CSS imports in this file (they moved to `DesktopView.tsx`).
7. The previous JSDoc comment block should be replaced with a concise one referencing the orchestrator pattern and AD-1.

**Interaction with `layout.tsx`:**
- `layout.tsx` renders `<>{children}</>` when authenticated. The orchestrator is the `children`.
- During auth check, `layout.tsx` renders its own void div (`bg-void`). After auth passes, the orchestrator renders `HydrationShell`. After `useIsMobile()` resolves, the orchestrator renders the appropriate view.
- This creates a clean progression: auth void -> hydration void -> view content.

### 4.6. Unit Tests

*Added per Phase A Review H-4.*

**`src/hooks/__tests__/use-is-mobile.test.ts`:**
- Test returns `null` on initial render (before `useEffect` fires).
- Test returns `true` when `matchMedia` matches (viewport <= 767px).
- Test returns `false` when `matchMedia` does not match (viewport >= 768px).
- Test live change event: simulate `matchMedia` `change` event, verify state updates.
- Test cleanup: verify `removeEventListener` called on unmount.

Uses `@testing-library/react` `renderHook`. Mocks `window.matchMedia` to return controlled `MediaQueryList` objects.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Desktop viewport (>= 768px width) renders the complete desktop experience with zero visual or behavioral differences from the pre-extraction state. | Manual comparison: open at 1440x900 and verify all elements (spatial canvas, coverage map, grid, ambient effects, panels, HUD, command palette, keyboard shortcuts). Verify URL parameters `?district=seismic`, `?category=weather`, `?view=raw` all work. |
| AC-2 | `useIsMobile()` returns `null` on the first synchronous render (before `useEffect` fires). | Add a `console.log` temporarily in `page.tsx` to confirm the first render receives `null`. Or verify by observing that `HydrationShell` flashes briefly on page load before the view appears. |
| AC-3 | `useIsMobile()` returns `true` when the viewport is <= 767px wide. | Open browser DevTools, set responsive mode to 375px width (iPhone SE). Verify `MobileView` stub renders. |
| AC-4 | `useIsMobile()` returns `false` when the viewport is >= 768px wide. | Open at 1440px width. Verify `DesktopView` renders. |
| AC-5 | Live viewport resizing across the 767px/768px boundary switches between views without page reload. | Drag the browser window width from 900px down to 600px and back. Verify the view switches at the breakpoint. |
| AC-6 | `HydrationShell` renders `#050911` background with no visible content. | Throttle CPU in DevTools (6x slowdown) to observe the hydration phase. Background should match the application void color with no flash of white or other content. |
| AC-7 | Webpack produces separate chunks for `DesktopView` and `MobileView`. | Run `pnpm build` and inspect `.next/static/chunks/`. Confirm there are distinct chunk files containing desktop-only imports (e.g., `SpatialViewport`, `MapLibre`) that are not present in the mobile chunk. |
| AC-8 | Mobile viewport does NOT download desktop JavaScript chunks. | Open DevTools Network tab at 375px width. Verify no requests for chunks containing desktop-only modules (`SpatialViewport`, `SpatialCanvas`, `MapLibre`, `MorphOrchestrator`). |
| AC-9 | Desktop viewport does NOT download mobile JavaScript chunks. | Open DevTools Network tab at 1440px width. Verify no requests for the `MobileView` chunk. |
| AC-10 | `pnpm typecheck` passes with zero errors. | Run `pnpm typecheck` from project root. |
| AC-11 | `pnpm lint` passes with zero new warnings or errors. | Run `pnpm lint` from project root. |
| AC-12 | `pnpm build` succeeds (including static export mode via `pnpm build:pages`). | Run `pnpm build:pages`. Verify exit code 0 and output in `out/` directory. |
| AC-13 | Auth guard in `layout.tsx` is unchanged and still redirects unauthenticated users to `/login`. | Verify by clearing sessionStorage and navigating to `/`. Should redirect to `/login`. |
| AC-14 | The `MobileView` stub renders a visible placeholder message at mobile viewport widths. | Open at 375px width. Confirm "TarvaRI Alert Viewer -- Mobile" text (or similar) is visible centered on the void background. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Breakpoint at `max-width: 767px` (mobile) / `min-width: 768px` (desktop). | 768px is the standard tablet-portrait breakpoint. Using `max-width: 767px` ensures tablets in portrait mode get the desktop ZUI experience, which is appropriate for a spatial dashboard. The ZUI engine requires pointer precision that touch-only phones lack. | `max-width: 1023px` (would give tablets mobile view -- rejected because the ZUI works well on iPad-size screens). `max-width: 639px` (phone-only -- too narrow, would miss large phones in landscape). |
| D-2 | `useIsMobile()` returns `null` (not `false`) during hydration. | Returning `false` as default would cause desktop to flash briefly on mobile before the effect fires and corrects to `true`. The `null` state enables `HydrationShell` to render a neutral void background, preventing any layout shift or content flash. | Default to `false` (desktop) and accept the flash. Rejected: poor UX on mobile, contradicts "no layout shift" requirement. Default based on user-agent string: rejected because static export has no server to read UA. |
| D-3 | Both views use `next/dynamic` with `ssr: false`. | Enforces code splitting at the webpack level. Desktop users never download mobile components; mobile users never download desktop components (SpatialViewport, MapLibre, MorphOrchestrator, etc.). `ssr: false` is consistent with the existing `CoverageMapDynamic` pattern in the codebase. | Single bundle with CSS `display: none`: rejected -- downloads both trees, massive bundle bloat. React.lazy + Suspense: viable but `next/dynamic` provides the `ssr: false` option needed for static export compatibility and is the established codebase pattern. |
| D-4 | `DesktopView` extraction is zero-modification (function rename only). | Eliminates desktop regression risk entirely. If the extracted file is byte-for-byte identical to the original (minus function name), it cannot introduce behavioral changes. Any future desktop changes happen in `DesktopView.tsx` going forward. | Refactor during extraction (extract hooks, simplify callbacks): rejected -- violates single-responsibility of this workstream and introduces regression risk. Refactoring is a separate concern for a future workstream if needed. |
| D-5 | CSS imports (`@/styles/*.css`) stay inside `DesktopView.tsx`, not in `page.tsx`. | These 6 CSS files (`atrium.css`, `morph.css`, `constellation.css`, `enrichment.css`, `district-view.css`, `coverage.css`) are desktop-specific. Keeping them in `DesktopView.tsx` ensures they are only loaded when the desktop view is rendered, reducing mobile bundle size. | Move to `page.tsx` (would load CSS for both views). Move to `layout.tsx` (same problem). Create a shared CSS layer: premature -- mobile styles are defined in WS-A.3. |
| D-6 | `HydrationShell` uses `fixed inset-0` positioning (matching `layout.tsx` auth guard pattern). | The existing auth guard at `layout.tsx` line 30 uses `className="fixed inset-0 bg-void"`. Using the same positioning strategy ensures visual consistency during the auth-check -> hydration -> view-render progression. | `min-height: 100vh`: could cause a slight gap on mobile browsers with dynamic viewport (address bar). `100dvh`: would require additional complexity. `fixed inset-0` is simpler and proven in this codebase. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should `useIsMobile()` debounce the `change` event to avoid rapid switching when a user drags the browser edge exactly at the 767px/768px boundary? The `matchMedia` `change` event fires once per threshold crossing, so rapid oscillation is unlikely, but it is theoretically possible during a slow drag. | react-developer | WS-A.1 implementation (decide during build; if no issues observed, skip debouncing) |
| OQ-2 | When a user resizes from desktop to mobile (or vice versa), should we preserve any application state (e.g., selected categories, view mode, open panels)? Currently, the dynamic import will mount a fresh component tree. Zustand store state persists across the switch since stores are module-level singletons, but component-local state (e.g., `usePanPause`, `useKeyboardShortcuts`) will reset. | react-developer | WS-A.2 (MobileShell can read Zustand stores for continuity) |
| OQ-3 | The `MobileView` stub in this workstream has no CSS imports. WS-A.3 introduces mobile design tokens. Should the stub import a minimal CSS file to match the exact void background via a CSS variable, or is the inline `#050911` sufficient until WS-A.3 replaces it? | react-developer | WS-A.3 (resolve when mobile tokens are created) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Desktop visual/behavioral regression from `page.tsx` extraction. | Low | High (blocks all desktop usage) | Zero-modification extraction (D-4). The only change is the function name. Verify with AC-1 (manual desktop comparison) and AC-12 (build success). If any regression is detected, the fix is to diff `DesktopView.tsx` against the original `page.tsx` and correct the discrepancy. |
| R-2 | Import path resolution failure in `DesktopView.tsx` after move from `src/app/(launch)/` to `src/views/`. | Low | High (build failure) | All imports use the `@/*` path alias which maps to `./src/*` (confirmed in `tsconfig.json` paths). Since `src/views/DesktopView.tsx` is still under `src/`, all `@/` imports resolve identically. No relative imports exist in `page.tsx` -- every import uses `@/`. Verified by AC-10 (typecheck) and AC-12 (build). |
| R-3 | Flash of incorrect view on page load (e.g., desktop content flashing on mobile before `useIsMobile` resolves). | Very Low | Medium (poor UX, but recovers) | The `null` initial state (D-2) renders `HydrationShell` instead of either view. The `useEffect` resolves within a single frame (~16ms). On fast connections with static export, the entire page loads quickly enough that the shell is invisible or appears for only one frame. |
| R-4 | `next/dynamic` with `ssr: false` fails during static export build (`pnpm build:pages`). | Very Low | High (build failure) | The codebase already uses `next/dynamic` with `ssr: false` for `CoverageMapDynamic` (current `page.tsx` line 29--32), proving the pattern works with the static export configuration. AC-12 verifies this explicitly. |
| R-5 | Webpack does not split `DesktopView` and `MobileView` into separate chunks, causing mobile to download the entire desktop bundle. | Low | Medium (performance penalty on mobile, but functional) | `next/dynamic` with `ssr: false` creates an async boundary that webpack respects for chunk splitting. AC-7, AC-8, and AC-9 verify chunk separation. If chunks are not split, investigate `next.config.ts` `webpack` customization to enforce split points. |
| R-6 | The `matchMedia` `change` event is not supported in older mobile browsers. | Very Low | Low (graceful degradation) | `addEventListener('change', ...)` on `MediaQueryList` is supported in all browsers since 2019 (Safari 14+, Chrome 80+, Firefox 78+). The legacy `addListener` method is not needed given the Node >= 22 / modern browser requirement. If needed, a polyfill fallback to `addListener` / `removeListener` is trivial. |
