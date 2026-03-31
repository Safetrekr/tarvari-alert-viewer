# WS-F.3: Performance + PWA

> **Workstream ID:** WS-F.3
> **Phase:** F -- Landscape + Polish
> **Assigned Agent:** `react-developer`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.1 (code splitting boundary between `DesktopView` / `MobileView` via `next/dynamic` with `ssr: false`; `useIsMobile()` hook; `src/views/` directory), WS-A.4 (viewport meta tag with `viewport-fit=cover`, no `user-scalable=no`), all prior phases (A through E must be complete so the full mobile component tree exists for profiling and bundle analysis)
> **Blocks:** None (final phase workstream; no downstream work depends on this)
> **Resolves:** OVERVIEW Section 8.3 (Performance Targets), OVERVIEW Risk R8 (polling drains battery -- `document.visibilityState` gating), OVERVIEW Task 6.8 (PWA manifest + icons), OVERVIEW Task 6.12 (Performance profiling), `interface-architecture.md` Section 9 (Performance Architecture), `interface-architecture.md` Section 10 (PWA Readiness Assessment)

---

## Review Fixes Applied

**M-4:** Added basePath + static export compatibility note to Section 4.7 service worker. The `InjectManifest` precache manifest URLs must include the `basePath` prefix when deploying to GitHub Pages (`/tarvari-alert-viewer/`). Test the service worker in both local dev (`basePath=''`) and GitHub Pages (`basePath='/tarvari-alert-viewer/'`) modes. The `modifyURLPrefix` option in workbox can remap precache URLs.

---

## 1. Objective

Verify and enforce the performance budget established in `interface-architecture.md` Section 9, ship a PWA-installable manifest with an offline app shell via service worker, and close the battery-drain gap (Risk R8) by gating all TanStack Query polling on `document.visibilityState`. After this workstream, the mobile experience meets all Core Web Vitals targets on a mid-range Android device (Galaxy A54 / Pixel 7a class), the app is installable from the browser on both iOS and Android, the app shell loads from cache when the network is unavailable, and background polling stops when the tab is hidden or the device screen is off.

This workstream is a measurement-then-act discipline: audit first, fix what the audit reveals, verify the fix. No speculative optimization.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **Bundle size audit** | Run `next build --webpack` with bundle analyzer. Verify the mobile shell + core chunk stays under 60 KB gzipped, map chunk under 180 KB gzipped, bottom sheet + detail under 25 KB gzipped, total mobile JS under 275 KB gzipped (budgets from `interface-architecture.md` Section 9.1). Document findings and fix any violations. |
| **Code splitting verification** | Audit every `next/dynamic` boundary. Verify that desktop-only components (spatial engine, ambient effects, morph orchestrator, camera store) are absent from the mobile chunk. Verify MapLibre loads only when the Map tab activates. Verify search overlay loads only on search tap. |
| **Core Web Vitals targets** | Measure and enforce mobile targets: LCP < 2.5s, INP < 200ms, CLS < 0.1 on a throttled 4G connection (Lighthouse mobile preset). Overall Lighthouse Performance score >= 85 (OVERVIEW Section 8.3). |
| **Visibility-aware polling** | Implement a `useVisibilityAwarePolling` hook that returns a boolean indicating whether polling should be active. Gate all TanStack Query `refetchInterval` options on this value. When `document.visibilityState === 'hidden'`, all polling pauses. When visibility returns, queries refetch immediately. Resolves Risk R8. |
| **PWA manifest** | Create `public/manifest.json` with app name, short name, description, start URL, display mode (`standalone`), background color (`#050911`), theme color (`#050911`), icon references (192px, 512px). Add `<link rel="manifest">` and `<meta name="theme-color">` to `layout.tsx`. |
| **iOS home screen meta tags** | Add `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`, and iOS splash screen `<link rel="apple-touch-startup-image">` entries for common device sizes. |
| **Service worker for offline shell** | Install `workbox-webpack-plugin` as a dev dependency. Configure a service worker that precaches the app shell (HTML, JS, CSS, fonts) using `CacheFirst` strategy. No API response caching. No map tile caching beyond MapLibre's built-in browser cache. The service worker scope is limited to the app shell -- when offline, the UI loads its cached shell and shows an "OFFLINE" indicator (header badge). Data queries fail gracefully via TanStack Query's existing error states. |
| **Image and asset optimization** | Audit map tile caching behavior (MapLibre's internal `Cache-Control` handling). Generate a consolidated SVG sprite sheet for category and navigation icons if Lucide tree-shaking produces redundant inline SVGs. Verify the Tarva logo SVG is served with appropriate cache headers. |
| **Lazy loading of non-critical components** | Defer `MobileSearchOverlay` (loaded on search tap), `MobileSettings` sheet (loaded on hamburger tap), and any other components not needed for the initial Situation tab render. Verify these are in separate chunks via the bundle analyzer output. |
| **Memory pressure management** | Add cleanup for MapLibre GL `Map` instances when the Map tab is unmounted or the component tree tears down. Cap the in-memory alert list to `MAX_DISPLAY_ITEMS` (50, already in place in `CategoryDetailScene.tsx`). Verify that TanStack Query's `gcTime` is set appropriately (default 5 minutes) so stale cache entries are freed. Profile memory on a sustained 30-minute session using Chrome DevTools Memory panel. |
| **rAF budget monitoring for morph animations** | Integrate the existing `useFrameBudgetMonitor` hook (currently dev-only) into the mobile morph fast-path. Surface dropped frames during the `idle -> entering-district -> district` transition. If the frame budget is exceeded on a mid-range device, document which animation phases need simplification (candidates: backdrop-filter blur during transition, concurrent CSS animations exceeding the 4-animation ceiling from `ui-design-system.md` Section 14). |

### Out of Scope

| Area | Rationale |
|------|-----------|
| API response caching in service worker | Client Q1 decision: "No offline data caching. Online-only." App shell caching is the extent of service worker responsibility. |
| Push notifications | Client Q3 decision: "Not now. Revisit when backend supports push." |
| Map tile caching in service worker | MapLibre GL JS handles its own tile caching via the browser's HTTP cache. Adding a service worker layer would duplicate caching and risk stale tiles. |
| Desktop performance optimization | Desktop bundle is unchanged by the mobile workstreams. Any desktop perf work is a separate workstream. |
| Lighthouse SEO or Best Practices scores | Only the Performance score is gated. SEO and Best Practices are informational. |
| IndexedDB persistence layer | OVERVIEW Section 10.3 explicitly defers this. TanStack Query in-memory cache is sufficient. |
| Runtime theming performance | Theming is CSS custom properties only. No JS cost to measure. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-A.1 | `useIsMobile()` hook resolving mobile/desktop split; `next/dynamic` boundaries for `DesktopView` and `MobileView`; `src/views/` directory structure | Required (code splitting is the foundation for bundle analysis) |
| WS-A.4 | Viewport meta tag with `viewport-fit=cover` | Required (affects CLS measurement and iOS safe area rendering) |
| Phases A-E complete | Full mobile component tree must exist so bundle analysis reflects the real-world state | Required (profiling a stub gives meaningless results) |
| `interface-architecture.md` Section 9 | Bundle size budgets: shell <60KB, map <180KB, sheet <25KB, total <275KB gzipped | Specification (reference) |
| `interface-architecture.md` Section 10 | PWA manifest spec, meta tag list, service worker strategy | Specification (reference) |
| OVERVIEW Section 8.3 | Performance targets: Lighthouse >=85, 60fps, TTI <3s on 4G, threat posture visible <1s | Specification (reference) |
| OVERVIEW Risk R8 | "Poll only when tab is active and app is in foreground (`document.visibilityState`)" | Gap to close |
| `ui-design-system.md` Section 14 | Animation constraints: <=4 concurrent CSS animations, <=3 concurrent `backdrop-filter` elements | Specification (reference) |
| Existing icons in `public/` | `android-chrome-192x192.png` (exists), `android-chrome-512x512.png` (exists), `apple-touch-icon.png` (exists) | Available |
| `package.json` | Build uses `--webpack` flag (relevant for `workbox-webpack-plugin` integration) | Verified |
| `next.config.ts` | Static export mode via `STATIC_EXPORT=true`, `basePath` for GitHub Pages via `GITHUB_PAGES` env var | Verified (affects manifest paths and service worker scope) |

---

## 4. Deliverables

### 4.1. Bundle Size Audit Report

**Purpose:** Measure the actual gzipped bundle sizes for each mobile chunk and compare against the budgets from `interface-architecture.md` Section 9.1. This is a measurement task that produces a written report and, if budgets are exceeded, actionable remediation steps.

**Procedure:**

1. Install `@next/bundle-analyzer` as a dev dependency:
   ```bash
   pnpm add -D @next/bundle-analyzer
   ```

2. Create a temporary wrapper in `next.config.ts` (or a separate `next.config.analyze.ts`) that enables the analyzer:
   ```typescript
   import withBundleAnalyzer from '@next/bundle-analyzer'

   const analyzed = withBundleAnalyzer({
     enabled: process.env.ANALYZE === 'true',
   })

   export default analyzed(nextConfig)
   ```

3. Run the analyzed build:
   ```bash
   ANALYZE=true pnpm build
   ```

4. Capture the output and produce a table:

   | Chunk | Budget | Actual | Status |
   |-------|--------|--------|--------|
   | Mobile shell + core | < 60 KB gz | _measured_ | PASS / FAIL |
   | Map chunk (MapLibre) | < 180 KB gz | _measured_ | PASS / FAIL |
   | Bottom sheet + detail | < 25 KB gz | _measured_ | PASS / FAIL |
   | Search overlay | < 10 KB gz | _measured_ | PASS / FAIL |
   | Total mobile JS | < 275 KB gz | _measured_ | PASS / FAIL |

5. If any chunk exceeds its budget, document the specific modules responsible (the analyzer treemap identifies them) and create remediation tasks. Common remediations:
   - Tree-shaking failures: verify `sideEffects: false` in dependency `package.json` entries.
   - Unintended desktop imports in mobile chunks: trace the import chain and extract to a separate module.
   - Large dependencies: evaluate lighter alternatives or dynamic import deferral.

**Output:** Markdown report saved to `docs/plans/mobile-view/phase-f-landscape-polish/bundle-audit-report.md`.

### 4.2. Code Splitting Verification

**Purpose:** Confirm that the `next/dynamic` boundaries established in WS-A.1 are effective -- desktop-only code does not appear in mobile chunks and vice versa.

**Procedure:**

1. Using the bundle analyzer output from D-4.1, verify the following are absent from the `MobileView` chunk:
   - `SpatialViewport`, `SpatialCanvas` (ZUI engine)
   - `MorphOrchestrator`, `CategoryIconGrid`, `CoverageGrid` (semantic zoom)
   - `DotGrid`, `SectorGrid`, `EnrichmentLayer`, `HaloGlow`, `RangeRings` (ambient effects)
   - `NavigationHUD`, `Minimap`, `ZoomIndicator`, `SpatialBreadcrumb` (spatial nav)
   - `CalibrationMarks`, `TopTelemetryBar`, `BottomStatusStrip` (desktop chrome)
   - `camera.store.ts` (camera physics) -- unless tree-shaking keeps it due to the `coverage.store.ts` import chain (see Risk R9 in OVERVIEW)

2. Verify the following are in separate lazy chunks (not the initial mobile shell):
   - `CoverageMap` + `MapMarkerLayer` + `maplibre-gl` (Map tab chunk)
   - `MobileBottomSheet` + `MobileCategoryDetail` + `MobileAlertDetail` (detail chunk)
   - `MobileSearchOverlay` (search chunk)
   - `MobileSettings` (settings chunk, if implemented as separate dynamic import)

3. If `camera.store.ts` appears in the mobile bundle (OVERVIEW Risk R9), implement the remediation: extract the `preFlyCamera` capture logic from `coverage.store.ts` into a separate `camera-capture.ts` module that is only imported by `DesktopView`.

**Output:** PASS/FAIL checklist appended to the bundle audit report.

### 4.3. Core Web Vitals Measurement

**Purpose:** Measure Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS) on a throttled mobile connection and verify they meet targets.

**Targets (from OVERVIEW Section 8.3 + web.dev "Good" thresholds):**

| Metric | Target | Measurement Condition |
|--------|--------|-----------------------|
| LCP | < 2.5s | Lighthouse mobile preset (throttled 4G, 4x CPU slowdown) |
| INP | < 200ms | Manual interaction testing with Chrome DevTools Performance panel |
| CLS | < 0.1 | Lighthouse mobile preset |
| Lighthouse Performance | >= 85 | Lighthouse mobile preset on the Situation tab (default view) |
| TTI | < 3s on 4G | Lighthouse Time to Interactive |
| Threat posture visible | < 1s from load | Manual measurement (when does `MobileThreatBanner` render with data?) |

**Procedure:**

1. Build the static export: `pnpm build:pages`
2. Serve locally: `npx serve out/` (or equivalent static server)
3. Run Lighthouse in Chrome DevTools with "Mobile" preset on the main page
4. Capture LCP, INP (or TBT as proxy), CLS, TTI, and overall Performance score
5. If any metric fails, profile with DevTools Performance panel to identify the bottleneck:
   - LCP too high: check if the threat banner or category grid is blocking on API data; verify suspense/skeleton rendering
   - CLS too high: check for layout shifts from dynamically loaded content, web font FOIT, or images without dimensions
   - TTI too high: check for long tasks in the main thread (large JS parsing, synchronous layout)

**Output:** Metrics table in the bundle audit report. If any metric fails, create remediation tasks with specific root cause analysis.

### 4.4. `src/hooks/use-visibility-aware-polling.ts` -- Visibility State Gating

**Purpose:** Pause all TanStack Query polling when the browser tab is hidden or the device screen is off, preventing unnecessary network requests and battery drain on mobile. Resolves OVERVIEW Risk R8.

**Codebase finding:** Currently, only 2 of 12+ polling hooks set `refetchIntervalInBackground: false` (`use-project-room-district.ts`, `use-tarva-chat-district.ts`). The remaining hooks -- `useCoverageMetrics` (60s), `useCoverageMapData` (30s), `useIntelFeed` (30s), `useIntelBundles` (45s), `useThreatPicture` (120s), `usePriorityFeed` (15s), `useCategoryIntel` (45s), `useTelemetry` (dynamic), `ThreatPictureCard` (120s), `useAllGeoSummaries` (120s) -- continue polling when the tab is backgrounded. No `document.visibilityState` check exists anywhere in the codebase.

**Type signature:**

```typescript
/**
 * Returns `true` when the document is visible and polling should be active.
 * Returns `false` when the tab is hidden (backgrounded, screen off, or
 * minimized). Listens to the `visibilitychange` event on `document`.
 *
 * Usage: pass the return value to TanStack Query's `refetchInterval` option
 * as a conditional:
 *
 *   const isVisible = useVisibilityAwarePolling()
 *   useQuery({
 *     ...
 *     refetchInterval: isVisible ? 30_000 : false,
 *   })
 *
 * @returns boolean -- true if the page is visible, false if hidden
 */
export function useVisibilityAwarePolling(): boolean
```

**Implementation requirements:**

1. Initialize state with `useState<boolean>(() => typeof document !== 'undefined' ? document.visibilityState === 'visible' : true)`.
2. In a `useEffect`:
   - Define a handler: `const handler = () => setVisible(document.visibilityState === 'visible')`.
   - `document.addEventListener('visibilitychange', handler)`.
   - Return cleanup: `document.removeEventListener('visibilitychange', handler)`.
3. No SSR guard beyond the initializer -- `useEffect` does not run on the server, and the initializer returns `true` when `document` is undefined.
4. When visibility returns (`visible` transitions from `false` to `true`), TanStack Query's built-in `refetchOnWindowFocus` (currently set to `false` globally in `query-provider.tsx`) will NOT trigger a refetch. Instead, the `refetchInterval` reactivates, and the next scheduled poll fires. For immediate refetch on return, the hook can optionally call `queryClient.invalidateQueries()` -- but this is aggressive. The simpler approach: set `refetchInterval` to a function that checks visibility, so the interval fires immediately on the next tick after visibility returns.

**Alternative implementation (function-based refetchInterval):**

Rather than a hook, a simpler pattern is to use `refetchInterval` as a function:

```typescript
refetchInterval: () => {
  return document.visibilityState === 'visible' ? 30_000 : false
}
```

This is evaluated on every interval tick. When the document becomes hidden, the next evaluation returns `false` and polling stops. When it becomes visible again, the next evaluation returns the interval and polling resumes.

**Decision:** Provide both the hook (for components that need the boolean for other purposes, e.g., pausing rAF loops) and document the function pattern for hooks that only need to gate `refetchInterval`.

**Integration -- hooks to modify:**

| Hook | File | Current `refetchInterval` | Change |
|------|------|--------------------------|--------|
| `useCoverageMetrics` | `src/hooks/use-coverage-metrics.ts` | `60_000` | `isVisible ? 60_000 : false` |
| `useCoverageMapData` | `src/hooks/use-coverage-map-data.ts` | `30_000` | `isVisible ? 30_000 : false` |
| `useIntelFeed` | `src/hooks/use-intel-feed.ts` | `30_000` | `isVisible ? 30_000 : false` |
| `useIntelBundles` | `src/hooks/use-intel-bundles.ts` | `45_000` | `isVisible ? 45_000 : false` |
| `useThreatPicture` | `src/hooks/use-threat-picture.ts` | `120_000` | `isVisible ? 120_000 : false` |
| `usePriorityFeed` | `src/hooks/use-priority-feed.ts` | `15_000` | `isVisible ? 15_000 : false` |
| `useCategoryIntel` | `src/hooks/use-category-intel.ts` | `45_000` | `isVisible ? 45_000 : false` |
| `useAllGeoSummaries` | `src/hooks/use-geo-summaries.ts` | `120_000` | `isVisible ? 120_000 : false` |
| `ThreatPictureCard` inline query | `src/components/coverage/ThreatPictureCard.tsx` | `120_000` | `isVisible ? 120_000 : false` |
| `useTelemetry` | `src/hooks/use-telemetry.ts` | dynamic | Gate with visibility check in the interval function |

**Note:** `useTelemetry` already uses `refetchIntervalInBackground: true` intentionally (it tracks session telemetry). This hook should be evaluated case-by-case: if telemetry must report even when backgrounded, leave it. If not, gate it.

**File conventions:**
- Follow existing hook naming: `use-visibility-aware-polling.ts`
- JSDoc module tag: `@module use-visibility-aware-polling`
- `'use client'` directive at the top
- No external dependencies beyond React

### 4.5. `public/manifest.json` -- PWA Web App Manifest

**Purpose:** Make the application installable via "Add to Home Screen" on both Android and iOS. Per `interface-architecture.md` Section 10.2 Phase 1.

**Content (exact):**

```json
{
  "name": "TarvaRI Alert Viewer",
  "short_name": "TarvaRI",
  "description": "Intelligence alert monitoring console",
  "start_url": "./",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#050911",
  "theme_color": "#050911",
  "icons": [
    {
      "src": "android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**Implementation notes:**

1. `start_url` uses `"./"` (relative) rather than `"/"` to support the `basePath` configuration for GitHub Pages (`/tarvari-alert-viewer/`). When deployed under a subdirectory, `"./"` resolves correctly relative to the manifest's own URL.
2. `orientation: "any"` -- client Q2 decision requires both portrait and landscape.
3. `background_color` and `theme_color` both use `#050911` (the Oblivion void background) for a seamless splash screen during app launch.
4. The 512x512 icon is listed twice: once as a standard icon and once with `purpose: "maskable"` for Android adaptive icons. If the existing 512x512 PNG has insufficient safe zone padding for maskable use, a dedicated maskable icon should be created with content inset to the safe zone (center 80% circle).
5. Icons already exist in `public/`: `android-chrome-192x192.png`, `android-chrome-512x512.png`. No new icon files needed unless the maskable audit fails.

**GitHub Pages `basePath` consideration:**

When building with `GITHUB_PAGES=tarvari-alert-viewer`, the `basePath` is `/tarvari-alert-viewer`. The manifest `<link>` in `layout.tsx` must include the base path:

```typescript
// In metadata or head
<link rel="manifest" href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/manifest.json`} />
```

The manifest's `start_url: "./"` and icon `src` values are relative to the manifest file's location (which is at `/tarvari-alert-viewer/manifest.json`), so they resolve correctly without prefixing.

### 4.6. `src/app/layout.tsx` -- Meta Tag Additions

**Purpose:** Add the `<link>` and `<meta>` tags required for PWA installability and iOS home screen behavior.

**Current state:** `layout.tsx` (66 lines) has `Metadata` export for title, description, and favicon icons. No manifest link, no theme-color meta, no apple-mobile-web-app-capable meta.

**Changes to the `metadata` export:**

```typescript
export const metadata: Metadata = {
  title: 'TarvaRI',
  description: 'TarvaRI Intelligence Console',
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/manifest.json`,
  themeColor: '#050911',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TarvaRI',
  },
  icons: {
    icon: [
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/favicon-32x32.png`, sizes: '32x32', type: 'image/png' },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/favicon-16x16.png`, sizes: '16x16', type: 'image/png' },
    ],
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/apple-touch-icon.png`,
  },
}
```

**iOS splash screen `<link>` tags:**

Next.js `Metadata` does not natively support `apple-touch-startup-image`. These must be added in the `<head>` via a custom `head.tsx` or inline in `layout.tsx` using `<head>`:

```tsx
<head>
  {/* iOS splash screens -- common device sizes */}
  <link
    rel="apple-touch-startup-image"
    media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
    href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/splash/splash-1125x2436.png`}
  />
  <link
    rel="apple-touch-startup-image"
    media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
    href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/splash/splash-1170x2532.png`}
  />
  <link
    rel="apple-touch-startup-image"
    media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
    href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/splash/splash-1290x2796.png`}
  />
</head>
```

**iOS splash screen assets:**

Generate splash screen PNGs matching each target device viewport at the appropriate pixel ratio. Each splash screen should be a solid `#050911` background with the Tarva white logo centered. Place in `public/splash/`. Cover the three devices from the testing matrix (OVERVIEW Section 8.4):

| Device | Viewport | Pixel Ratio | Splash Size | File |
|--------|----------|-------------|-------------|------|
| iPhone 15 / SE3 | 375x812 | 3x | 1125x2436 | `splash-1125x2436.png` |
| iPhone 15 | 390x844 | 3x | 1170x2532 | `splash-1170x2532.png` |
| iPhone 15 Pro Max | 430x932 | 3x | 1290x2796 | `splash-1290x2796.png` |

### 4.7. Service Worker for Offline App Shell

**Purpose:** Cache the app shell (HTML, JS, CSS, font files) so the application loads from cache when the network is unavailable. When offline, the UI renders its shell and shows an "OFFLINE" indicator; data queries fail gracefully via TanStack Query's existing error/stale states.

**Scope note:** Client Q1 originally decided "No service worker." This deliverable expands Q1 scope to include app shell caching (not data caching) per `interface-architecture.md` Section 10.2 Phase 2. API responses are never cached by the service worker. Map tiles rely on MapLibre's built-in browser HTTP cache.

**Implementation approach:**

1. Install `workbox-webpack-plugin` as a dev dependency:
   ```bash
   pnpm add -D workbox-webpack-plugin
   ```

2. Configure the service worker in `next.config.ts` using the webpack configuration hook:
   ```typescript
   import { InjectManifest } from 'workbox-webpack-plugin'

   const nextConfig: NextConfig = {
     // ... existing config
     webpack: (config, { isServer }) => {
       if (!isServer) {
         config.plugins.push(
           new InjectManifest({
             swSrc: './src/service-worker.ts',
             swDest: '../public/sw.js',
             maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
             include: [/\.html$/, /\.js$/, /\.css$/, /\.woff2?$/],
             exclude: [/\.map$/, /manifest\.json$/],
           })
         )
       }
       return config
     },
   }
   ```

3. Create `src/service-worker.ts`:
   ```typescript
   /// <reference lib="webworker" />
   import { precacheAndRoute } from 'workbox-precaching'
   import { registerRoute } from 'workbox-routing'
   import { CacheFirst } from 'workbox-strategies'
   import { ExpirationPlugin } from 'workbox-expiration'

   declare const self: ServiceWorkerGlobalScope

   // Precache app shell assets (injected by InjectManifest)
   precacheAndRoute(self.__WB_MANIFEST)

   // Cache Google Fonts (if loaded via next/font/google)
   registerRoute(
     ({ url }) => url.origin === 'https://fonts.googleapis.com' ||
                  url.origin === 'https://fonts.gstatic.com',
     new CacheFirst({
       cacheName: 'google-fonts',
       plugins: [
         new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
       ],
     })
   )

   // Skip waiting and claim clients immediately
   self.addEventListener('install', () => self.skipWaiting())
   self.addEventListener('activate', (event) => {
     event.waitUntil(self.clients.claim())
   })
   ```

4. Register the service worker in the app. Create `src/hooks/use-service-worker-registration.ts`:
   ```typescript
   'use client'

   import { useEffect } from 'react'

   /**
    * Register the service worker on mount. Only registers in production
    * and when the browser supports service workers.
    */
   export function useServiceWorkerRegistration(): void {
     useEffect(() => {
       if (
         process.env.NODE_ENV === 'production' &&
         'serviceWorker' in navigator
       ) {
         const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
         navigator.serviceWorker
           .register(`${basePath}/sw.js`)
           .catch((err) => console.warn('SW registration failed:', err))
       }
     }, [])
   }
   ```

5. Call `useServiceWorkerRegistration()` from the root layout's client boundary (e.g., a `<ServiceWorkerProvider>` component rendered inside `QueryProvider`).

**What is NOT cached:**
- API responses (`/console/*` endpoints)
- Map tiles (handled by MapLibre's browser cache)
- Dynamic data of any kind

**GitHub Pages `basePath` handling:**

The service worker's scope is determined by its URL. When served from `/tarvari-alert-viewer/sw.js`, its scope is `/tarvari-alert-viewer/` by default, which is correct. The `InjectManifest` plugin's precache manifest URLs must be relative to the base path. Verify with a `build:pages` build and inspect the generated `sw.js` precache manifest entries.

### 4.8. Lazy Loading of Non-Critical Components

**Purpose:** Verify and enforce that components not needed for the initial Situation tab render are in separate chunks.

**Components that must be dynamically imported (deferred):**

| Component | Trigger | Dynamic Import Pattern |
|-----------|---------|----------------------|
| `MobileMapView` (+ MapLibre) | Map tab activation | `dynamic(() => import(...), { ssr: false })` |
| `MobileSearchOverlay` | Search button tap | `dynamic(() => import(...))` |
| `MobileSettings` | Hamburger menu tap | `dynamic(() => import(...))` |
| `MobileBottomSheet` + detail content | Card / marker tap | `dynamic(() => import(...))` |
| `MobileRegionDetail` | Region card tap | `dynamic(() => import(...))` |

**Components that must be in the initial mobile chunk (not deferred):**

| Component | Reason |
|-----------|--------|
| `MobileShell` | Layout container |
| `MobileHeader` | Persistent chrome |
| `MobileBottomNav` | Persistent chrome |
| `MobileThreatBanner` | Threat posture must be visible in < 1s (OVERVIEW Section 8.3) |
| `MobilePriorityStrip` | Part of the default Situation tab |
| `MobileCategoryGrid` + `MobileCategoryCard` | Part of the default Situation tab |
| `ThreatPulseBackground` | Ambient background on all tabs |

**Verification:** After the bundle audit (D-4.1), confirm that each deferred component is in a separate chunk and the initial chunk contains only the required components.

### 4.9. Memory Pressure Management

**Purpose:** Prevent memory leaks and unbounded growth during sustained usage sessions (30+ minutes), particularly from MapLibre GL instances, TanStack Query caches, and rAF animation loops.

**MapLibre cleanup:**

The `CoverageMap` component uses `react-map-gl` which manages the underlying `maplibre-gl.Map` instance. When the Map tab is deactivated or the component unmounts, `react-map-gl` calls `map.remove()` in its cleanup. Verify this by:

1. Monitoring `performance.memory` (Chrome-only) before and after Map tab mount/unmount cycles
2. Checking that no WebGL contexts leak (Chrome DevTools -> `chrome://gpu` -> WebGL context count)
3. Confirming that `react-map-gl`'s `Map` component calls `remove()` on unmount (read the library source or test empirically)

If `react-map-gl` does not clean up properly, add explicit cleanup:

```typescript
const mapRef = useRef<MapRef>(null)

useEffect(() => {
  return () => {
    // Force cleanup if react-map-gl doesn't handle it
    mapRef.current?.getMap()?.remove()
  }
}, [])
```

**Alert list capping:**

The `MAX_DISPLAY_ITEMS = 50` cap in `CategoryDetailScene.tsx` (line 145) already limits rendered items. Verify that the same cap is applied in:
- `MobileCategoryDetail` (mobile equivalent)
- `MobileIntelTab` feed section
- Any other list that renders `CategoryIntelItem[]`

**TanStack Query cache management:**

The global `QueryProvider` (`src/components/providers/query-provider.tsx`) sets `staleTime: 30_000` but does not set `gcTime` (garbage collection time, default 5 minutes). This is acceptable -- queries not accessed for 5 minutes are garbage collected. No change needed unless memory profiling reveals a problem.

**rAF loop cleanup:**

Audit all `requestAnimationFrame` usage (40+ call sites found in the codebase) and verify each has a corresponding `cancelAnimationFrame` in a cleanup function. Key files to audit:

| File | rAF Usage | Cleanup Present |
|------|-----------|-----------------|
| `camera.store.ts` | `flyTo` animation | Yes (`cancelAnimationFrame(_activeFlyToRaf)`) |
| `use-pan.ts` | Momentum physics | Yes (`cancelAnimationFrame(momentumRafRef.current)`) |
| `use-performance-monitor.ts` | FPS measurement | Yes (`cancelAnimationFrame(rafId.current)`) |
| `use-frame-budget-monitor.ts` | Frame timing | Yes (`cancelAnimationFrame(rafRef.current)`) |
| `MapMarkerLayer.tsx` | Pulse animation | Yes (`cancelAnimationFrame(raf)`) |
| `signal-pulse-monitor.tsx` | Waveform drawing | Yes (`cancelAnimationFrame(frameRef.current)`) |
| `session-timecode.tsx` | Frame counter | Yes (`cancelAnimationFrame(rafIdRef.current)`) |
| `bottom-status-strip.tsx` | Label rotation | Yes (`cancelAnimationFrame(rafRef.current)`) |
| `ParticleField.tsx` | Particle system | Yes (`cancelAnimationFrame(rafRef.current)`) |
| `top-telemetry-bar.tsx` | Bar animation | Yes (`cancelAnimationFrame(raf)`) |
| `district-view-header.tsx` | Header animation | Yes (`cancelAnimationFrame(raf.current)`) |
| `use-zoom.ts` | Zoom animation | Yes (`cancelAnimationFrame(rafId)`) |
| `use-viewport-cull.ts` | Bounds calculation | Yes (`cancelAnimationFrame(rafRef.current)`) |

**Finding from codebase audit:** All existing rAF users have corresponding cleanup. No leaks identified. Mobile-specific components (built in Phases A-E) must follow the same pattern.

### 4.10. rAF Budget Monitoring for Morph Animations

**Purpose:** Measure frame budget adherence during the mobile morph fast-path transition (`idle -> entering-district -> district`) and the desktop full morph sequence. If frames are dropped on a mid-range device, document which animation phase is responsible and recommend simplification.

**Existing tooling:**

- `useFrameBudgetMonitor` (dev-only, `src/hooks/use-frame-budget-monitor.ts`): Returns rolling average FPS, dropped frame count, and performance tier (`full`/`reduced`/`minimal`). Updates state every 30 frames. Currently unused in any component.
- `usePerformanceMonitor` (`src/hooks/use-performance-monitor.ts`): Production-ready FPS classification with hysteresis (2-second re-evaluation interval). Used by attention choreography.
- `createFpsMonitor` (`src/lib/dev/fps-monitor.ts`): Imperative FPS measurement utility (start/stop/snapshot).

**Integration plan:**

1. In development mode, attach `useFrameBudgetMonitor` to the morph transition by enabling it only during active morph phases:

   ```typescript
   const morphPhase = useUIStore((s) => s.morph.phase)
   const isMorphing = morphPhase !== 'idle' && morphPhase !== 'district'

   const { avgFps, droppedFrames, performanceLevel } = useFrameBudgetMonitor({
     enabled: process.env.NODE_ENV === 'development' && isMorphing,
   })
   ```

2. Log a console warning when `droppedFrames > 5` during a morph transition, indicating which phase was active:

   ```
   [MORPH PERF] Phase "entering-district": avgFps=42, droppedFrames=8/120 (performance: reduced)
   ```

3. Test on the performance floor device (Galaxy A54 or equivalent throttled Chrome DevTools: 4x CPU slowdown + 3G network). The morph fast-path has three phases:
   - `idle` (no animation)
   - `entering-district` (bottom sheet slide-up, backdrop blur activation, content crossfade)
   - `district` (settled, no animation)

4. If the `entering-district` phase exceeds the frame budget:
   - **Candidate 1:** `backdrop-filter: blur()` activation. This is the most GPU-expensive property. On low-end devices, skip the blur transition and apply the blur statically (no animation).
   - **Candidate 2:** Concurrent CSS animations. The constraint from `ui-design-system.md` Section 14 is <= 4 concurrent animations. Verify this is respected during morph.
   - **Candidate 3:** `will-change: transform` not set on the bottom sheet during drag/transition. Add it.

**Output:** Performance profile results documented in the bundle audit report. If the frame budget is exceeded, create a remediation sub-task with specific CSS property changes.

---

## 5. Technical Design

### 5.1. Visibility-Aware Polling Architecture

The polling gating system has two layers:

**Layer 1 -- Global visibility signal:**

```
document.visibilityState
    |
    v
useVisibilityAwarePolling()  -->  boolean (reactive)
    |
    +--- consumed by each TanStack Query hook
    |    via: refetchInterval: isVisible ? INTERVAL : false
    |
    +--- consumed by rAF loops (optional)
         via: if (!isVisible) cancelAnimationFrame(...)
```

**Layer 2 -- Tab-specific polling (mobile only):**

On mobile, some hooks should only poll when their associated tab is active (OVERVIEW Appendix B):

| Hook | Polls When |
|------|-----------|
| `useCoverageMapData` | Map tab active AND document visible |
| `useAllGeoSummaries` | Intel tab active AND document visible |
| `useCategoryIntel` | Category detail sheet open AND document visible |

Tab-specific gating is managed by the existing `enabled` option in each hook (e.g., the map data hook is only enabled when the Map tab mounts). The visibility hook adds the document-level gate on top.

**Integration sequence:**

```
1. User backgrounds the app (screen off, tab switch, etc.)
2. document.visibilityState changes to "hidden"
3. useVisibilityAwarePolling() returns false
4. All refetchInterval options evaluate to `false`
5. TanStack Query stops scheduling refetch timers
6. rAF loops (ambient effects, FPS monitors) optionally pause

--- user returns ---

7. document.visibilityState changes to "visible"
8. useVisibilityAwarePolling() returns true
9. refetchInterval options evaluate to their normal values
10. TanStack Query schedules the next refetch at the normal interval
11. rAF loops resume
```

### 5.2. Service Worker Lifecycle

```
BUILD TIME:
  next build --webpack
    |
    v
  workbox-webpack-plugin (InjectManifest)
    |
    +-- reads src/service-worker.ts
    +-- injects precache manifest (list of hashed assets)
    +-- outputs public/sw.js

RUNTIME:
  User visits app
    |
    v
  useServiceWorkerRegistration() calls navigator.serviceWorker.register()
    |
    v
  Browser downloads and installs sw.js
    |
    v
  Service worker precaches app shell assets
    |
    v
  Subsequent visits:
    +-- App shell served from cache (CacheFirst)
    +-- API requests go to network (no SW interception)
    +-- If offline: shell loads from cache, API requests fail,
        TanStack Query shows error/stale states,
        MobileHeader shows "OFFLINE" badge
```

### 5.3. Bundle Chunk Strategy

```
Initial load (all users):
  [framework]  React + Next.js runtime          ~45 KB gz
  [shared]     Zustand, TanStack Query core      ~15 KB gz

Mobile path (after useIsMobile resolves):
  [mobile-core]  MobileShell + Situation tab     < 60 KB gz  (budget)
  [deferred]     Map tab + MapLibre              < 180 KB gz (on tab switch)
  [deferred]     Bottom sheet + detail           < 25 KB gz  (on interaction)
  [deferred]     Search overlay                  < 10 KB gz  (on search tap)

Desktop path (after useIsMobile resolves):
  [desktop]      DesktopView + spatial engine    (existing, not budgeted here)
```

---

## 6. Testing Plan

### 6.1. Unit Tests

| Test | File | What It Verifies |
|------|------|------------------|
| `useVisibilityAwarePolling` returns `true` initially | `__tests__/use-visibility-aware-polling.test.ts` | Default state when document is visible |
| `useVisibilityAwarePolling` returns `false` when hidden | Same | Simulates `visibilitychange` event with `document.visibilityState = 'hidden'` |
| `useVisibilityAwarePolling` returns `true` when visible again | Same | Simulates return to `'visible'` state |
| Cleanup removes event listener | Same | Unmount hook, verify `removeEventListener` called |
| `useServiceWorkerRegistration` does not register in dev | `__tests__/use-service-worker-registration.test.ts` | `navigator.serviceWorker.register` not called when `NODE_ENV !== 'production'` |

### 6.2. Integration Tests

| Test | Scope | What It Verifies |
|------|-------|------------------|
| Polling hooks respect visibility | Hook + query interaction | When `useVisibilityAwarePolling` returns `false`, `useQuery` with `refetchInterval: isVisible ? X : false` stops polling. Mock `document.visibilityState`. |
| PWA manifest is valid | Build artifact | Parse `public/manifest.json`, validate against W3C Web App Manifest spec (required fields present, icon URLs resolve). |
| Service worker registers in production | Browser integration | Using Playwright, verify that `navigator.serviceWorker.controller` is set after page load in a production build. |

### 6.3. Manual Testing Protocol

| Test | Device | Procedure | Pass Criteria |
|------|--------|-----------|---------------|
| Lighthouse audit | Chrome DevTools (mobile preset) | Run Lighthouse on Situation tab | Performance >= 85, LCP < 2.5s, CLS < 0.1 |
| Backgrounding stops polling | Any mobile device | Open DevTools Network tab, background the app for 60s, check no new API requests | Zero `/console/*` requests while backgrounded |
| PWA install (Android) | Android Chrome | Navigate to app, tap "Add to Home Screen" | App installs, opens in standalone mode with correct splash screen |
| PWA install (iOS) | iOS Safari | Navigate to app, Share -> "Add to Home Screen" | App icon appears on home screen, opens with status bar styled `black-translucent` |
| Offline shell load | Any device | Install PWA, enable airplane mode, open app | App shell loads from cache, "OFFLINE" indicator visible, data sections show error/stale states |
| Memory stability | Chrome DevTools | Open app, navigate all tabs, open/close 10 bottom sheets, switch to Map tab and back 5 times. Monitor heap in DevTools Memory panel. | Heap does not grow unboundedly; returns to baseline within 30s of idle |
| Morph frame budget | Chrome DevTools (4x CPU throttle) | Trigger 5 consecutive morph transitions on mobile fast-path | Average FPS >= 30 during `entering-district` phase (reduced tier acceptable on throttled device) |

---

## 7. Acceptance Criteria

| # | Criterion | Measurement | Source |
|---|-----------|-------------|--------|
| AC-1 | Mobile shell + core chunk < 60 KB gzipped | Bundle analyzer output | `interface-architecture.md` Section 9.1 |
| AC-2 | Map chunk < 180 KB gzipped | Bundle analyzer output | `interface-architecture.md` Section 9.1 |
| AC-3 | Total mobile JS < 275 KB gzipped | Bundle analyzer output | `interface-architecture.md` Section 9.1 |
| AC-4 | Lighthouse Performance score >= 85 on mobile preset | Chrome DevTools Lighthouse | OVERVIEW Section 8.3 |
| AC-5 | LCP < 2.5s on throttled 4G | Lighthouse mobile preset | Web.dev "Good" threshold |
| AC-6 | CLS < 0.1 | Lighthouse mobile preset | Web.dev "Good" threshold |
| AC-7 | Zero API polling requests when tab is backgrounded for 60s | Network tab observation | OVERVIEW Risk R8 |
| AC-8 | `public/manifest.json` exists and is valid per W3C spec | JSON parse + field validation | `interface-architecture.md` Section 10.2 |
| AC-9 | App installable via "Add to Home Screen" on Android Chrome | Manual test | `interface-architecture.md` Section 10.2 |
| AC-10 | App installable via "Add to Home Screen" on iOS Safari | Manual test | `interface-architecture.md` Section 10.2 |
| AC-11 | `<meta name="apple-mobile-web-app-capable">` present in rendered HTML | View source | `interface-architecture.md` Section 10.2 |
| AC-12 | `<meta name="theme-color" content="#050911">` present in rendered HTML | View source | `interface-architecture.md` Section 10.2 |
| AC-13 | App shell loads from service worker cache when offline | Airplane mode test | `interface-architecture.md` Section 10.2 Phase 2 |
| AC-14 | No desktop-only components in mobile chunk | Bundle analyzer verification | WS-A.1, OVERVIEW Section 3.2 |
| AC-15 | MapLibre not loaded until Map tab is activated | Network tab observation | `interface-architecture.md` Section 9.3 |
| AC-16 | Heap does not grow unboundedly over 30-minute session | Chrome DevTools Memory panel | Memory pressure management |
| AC-17 | All rAF loops have corresponding `cancelAnimationFrame` cleanup | Code audit | Best practice |
| AC-18 | Morph fast-path maintains >= 30 FPS on 4x CPU throttle | DevTools Performance panel | `ui-design-system.md` Section 14 |
| AC-19 | Threat posture visible within 1 second of load | Manual timing | OVERVIEW Section 8.3 |

---

## 8. Risks

| # | Risk | Severity | Likelihood | Mitigation |
|---|------|----------|-----------|------------|
| R1 | Bundle budget exceeded due to shared dependencies pulled into mobile chunk | Medium | Medium | The bundle audit (D-4.1) catches this. Common culprit: `coverage.store.ts` importing `camera.store.ts`. Mitigation: extract camera-dependent logic into a desktop-only module. |
| R2 | Service worker caches stale assets after a deployment | Medium | High | Workbox `InjectManifest` generates content-hashed filenames in the precache manifest. The `skipWaiting()` + `clients.claim()` pattern ensures the new SW takes over immediately. Stale assets are evicted when the new precache manifest is installed. |
| R3 | `basePath` breaks manifest or service worker scope on GitHub Pages | Medium | Medium | Test with `pnpm build:pages` and serve the output. Verify manifest `start_url` resolves correctly, SW scope matches the base path, and precache URLs include the base path prefix. |
| R4 | iOS does not support full PWA features (limited service worker, no push) | Low | High | Known limitation. The manifest and meta tags provide "Add to Home Screen" with a splash screen. The service worker provides app shell caching. Data push is out of scope (client Q3). Accept iOS limitations. |
| R5 | `workbox-webpack-plugin` conflicts with Next.js 16 webpack configuration | Medium | Low | Next.js 16 uses webpack under the `--webpack` flag. Workbox's `InjectManifest` plugin operates as a standard webpack plugin. If conflicts arise, fall back to a manual service worker (no Workbox) that uses the Cache API directly. |
| R6 | `useVisibilityAwarePolling` causes stale data when user returns after a long absence | Low | Medium | TanStack Query's `staleTime` ensures that when the interval resumes, data that has exceeded its stale time is refetched on the next interval tick. For P1 alerts (`usePriorityFeed`, 15s interval), the worst-case delay after returning to the tab is 15 seconds. Acceptable. |
| R7 | Lighthouse score fluctuates between runs | Low | High | Run Lighthouse 3 times and take the median score. Use a consistent environment (same machine, no other tabs, incognito mode). Document the measurement conditions in the audit report. |
| R8 | iOS splash screen images add to the deployment size | Low | Low | Three splash screen PNGs at ~10-20 KB each. Total impact < 60 KB. Negligible relative to the JS bundle. |
| R9 | `InjectManifest` `swDest` path does not align with static export output directory | Medium | Medium | The static export outputs to `out/`. The service worker must end up at `out/sw.js` (or `out/tarvari-alert-viewer/sw.js` for GitHub Pages). Test the full `build:pages` pipeline and verify `sw.js` is in the correct location. Adjust `swDest` path if needed. |

---

## Appendix A: File Manifest

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `src/hooks/use-visibility-aware-polling.ts` | NEW | Visibility state hook for polling gating |
| 2 | `public/manifest.json` | NEW | PWA web app manifest |
| 3 | `src/service-worker.ts` | NEW | Workbox service worker source |
| 4 | `src/hooks/use-service-worker-registration.ts` | NEW | Service worker registration hook |
| 5 | `public/splash/splash-1125x2436.png` | NEW | iOS splash screen (iPhone SE3 / iPhone 15) |
| 6 | `public/splash/splash-1170x2532.png` | NEW | iOS splash screen (iPhone 15) |
| 7 | `public/splash/splash-1290x2796.png` | NEW | iOS splash screen (iPhone 15 Pro Max) |
| 8 | `src/app/layout.tsx` | MODIFIED | Add manifest link, theme-color, apple-mobile-web-app-capable, splash screen links |
| 9 | `next.config.ts` | MODIFIED | Add workbox-webpack-plugin configuration |
| 10 | `src/hooks/use-coverage-metrics.ts` | MODIFIED | Gate `refetchInterval` on visibility |
| 11 | `src/hooks/use-coverage-map-data.ts` | MODIFIED | Gate `refetchInterval` on visibility |
| 12 | `src/hooks/use-intel-feed.ts` | MODIFIED | Gate `refetchInterval` on visibility |
| 13 | `src/hooks/use-intel-bundles.ts` | MODIFIED | Gate `refetchInterval` on visibility |
| 14 | `src/hooks/use-threat-picture.ts` | MODIFIED | Gate `refetchInterval` on visibility |
| 15 | `src/hooks/use-priority-feed.ts` | MODIFIED | Gate `refetchInterval` on visibility |
| 16 | `src/hooks/use-category-intel.ts` | MODIFIED | Gate `refetchInterval` on visibility |
| 17 | `src/hooks/use-geo-summaries.ts` | MODIFIED | Gate `refetchInterval` on visibility |
| 18 | `src/components/coverage/ThreatPictureCard.tsx` | MODIFIED | Gate inline query `refetchInterval` on visibility |
| 19 | `docs/plans/mobile-view/phase-f-landscape-polish/bundle-audit-report.md` | NEW | Bundle audit results, CWV measurements, code splitting verification, frame budget analysis |
| 20 | `package.json` | MODIFIED | Add `@next/bundle-analyzer` and `workbox-webpack-plugin` dev dependencies |

## Appendix B: Polling Interval Summary (Post-Implementation)

| Hook | File | Interval (Visible) | Interval (Hidden) | Notes |
|------|------|--------------------|--------------------|-------|
| `useCoverageMetrics` | `use-coverage-metrics.ts` | 60s | paused | Overview stats |
| `useCoverageMapData` | `use-coverage-map-data.ts` | 30s | paused | Map markers |
| `useIntelFeed` | `use-intel-feed.ts` | 30s | paused | Intel feed |
| `useIntelBundles` | `use-intel-bundles.ts` | 45s | paused | Bundle feed |
| `useThreatPicture` | `use-threat-picture.ts` | 120s | paused | Threat posture |
| `usePriorityFeed` | `use-priority-feed.ts` | 15s | paused | P1/P2 alerts |
| `useCategoryIntel` | `use-category-intel.ts` | 45s | paused | Category detail |
| `useAllGeoSummaries` | `use-geo-summaries.ts` | 120s | paused | Geo summaries |
| `ThreatPictureCard` | `ThreatPictureCard.tsx` | 120s | paused | Card-level query |
| `useTelemetry` | `use-telemetry.ts` | dynamic | **unchanged** | Session telemetry -- evaluate separately |

---

*Document version: 1.0.0 | Created: 2026-03-06 | Status: Draft*
*Assigned agent: `react-developer` | Phase: F -- Landscape + Polish*
