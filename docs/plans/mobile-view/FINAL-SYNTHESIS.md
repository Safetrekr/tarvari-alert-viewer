# Final Synthesis: Mobile View -- TarvaRI Alert Viewer

> **Synthesized by:** CTA (manual)
> **Date:** 2026-03-06
> **Status:** Complete

---

## 1. Architecture Overview

The mobile view is a complete alternative rendering of the TarvaRI Alert Viewer, code-split from the desktop ZUI and optimized for phone-sized viewports (< 768px). It shares the same data layer (TanStack Query hooks, Zustand stores, TarvaRI API) but replaces the spatial canvas with a three-tab layout, bottom-sheet-driven detail views, and touch-first interactions.

### Component Tree

```
(launch)/page.tsx
  └─ useIsMobile() → true
       └─ next/dynamic(() => import('@/views/MobileView'))
            └─ MobileShell (data-orientation, data-freshness)
                 ├─ SkipToContent
                 ├─ MobileHeader (40-48px, connectivity dot, search, timecode)
                 ├─ MobileIdleLockOverlay (z-50, conditional)
                 ├─ MobileContent (tab panels)
                 │    ├─ [situation] MobileThreatBanner + MobilePriorityStrip + MobileCategoryGrid
                 │    ├─ [map] MobileMapView (MapLibre GL JS) + filter chips + controls
                 │    └─ [intel] MobileIntelTab (feed + geographic intelligence)
                 ├─ MobileBottomSheet (z-30, motion/react drag)
                 │    ├─ MobileCategoryDetail (3 snap points)
                 │    ├─ MobileAlertDetail (2 snap points)
                 │    ├─ MobileRegionDetail (2 snap points)
                 │    └─ MobileSettings (2 snap points)
                 ├─ MobileSearchOverlay (z-35, slide from right)
                 ├─ MobilePullIndicator (per-tab, above scroll)
                 ├─ MobileConnectionToast (z-45)
                 └─ MobileBottomNav (48-56px, 3 tabs + hamburger)
```

### State Architecture

```
ui.store.ts (animation + navigation)
  ├─ morphPhase: MorphPhase
  ├─ morphDirection: 'forward' | 'reverse'
  ├─ targetDistrictId: string | null
  └─ selectedDistrictId: string | null

coverage.store.ts (data filtering + view modes)
  ├─ selectedCategories: Set<string>
  ├─ viewMode: 'triaged' | 'all-bundles' | 'raw'
  ├─ selectedMapAlertId: string | null
  ├─ districtPreselectedAlertId: string | null
  └─ selectedBundleId: string | null

settings.store.ts (user preferences)
  ├─ audioNotificationsEnabled: boolean
  ├─ idleLockTimeoutMinutes: number (added by C.5)
  └─ ... other settings

auth.store.ts (session)
  ├─ authenticated: boolean
  └─ login(passphrase): boolean
```

### Data Flow

```
TarvaRI API (port 8000)
  ├─ /console/coverage → useCoverageMetrics (60s poll)
  ├─ /console/coverage/map-data → useCoverageMapData (30s poll)
  ├─ /console/intel → useIntelFeed (30s poll)
  ├─ /console/bundles → useIntelBundles (45s poll)
  ├─ /console/intel/search → useIntelSearch (on-demand)
  ├─ /console/geo-summaries → useAllGeoSummaries (120s poll)
  ├─ /console/priority → usePriorityFeed (15s poll)
  ├─ /console/threat-picture → useThreatPicture (120s poll)
  └─ /console/intel?category= → useCategoryIntel (45s poll)

All polling gated by useVisibilityAwarePolling (F.3)
All invalidatable via usePullToRefresh (F.5)
```

---

## 2. Design Token System

All mobile styling is driven by CSS custom properties scoped in `@media (max-width: 767px)`:

### Glass Tokens (WS-A.3)
```css
--glass-header-bg: rgba(5, 9, 17, 0.92)
--glass-nav-bg: rgba(5, 9, 17, 0.90)
--glass-card-bg: rgba(5, 9, 17, 0.85)
--glass-sheet-bg: rgba(5, 9, 17, 0.95)
--glass-header-blur: blur(20px)
--glass-card-blur: blur(12px)
--glass-sheet-blur: blur(24px)
```

### Spacing Tokens (WS-A.3, landscape overrides in F.1)
```css
/* Portrait */                  /* Landscape */
--space-header-height: 48px     → 40px
--space-bottom-nav-height: 56px → 48px
--space-content-padding: 12px   → 8px
--space-card-gap: 10px          → 8px
```

### Posture Tokens (WS-B.1)
```css
--posture-low-color: #22c55e
--posture-moderate-color: #eab308
--posture-elevated-color: #f97316
--posture-high-color: #ef4444
--posture-critical-color: #dc2626
```

### Consolidated Constants
- `THREAT_LEVEL_COLORS` — single definition in `src/lib/interfaces/coverage.ts` using `--posture-*` tokens
- `SEVERITY_COLORS` — existing in `coverage.ts`
- `REGION_CENTROIDS` — 11 keys in `src/lib/region-centroids.ts` matching `GEO_REGION_KEYS`
- `SHEET_CONFIGS` — centralized in `src/lib/interfaces/mobile.ts`
- `TAB_QUERY_KEYS` — per-tab TanStack Query key mapping in `src/hooks/use-pull-to-refresh.ts`

---

## 3. Bottom Sheet System

The bottom sheet is the primary detail container, used by 4+ contexts:

### Configuration
```typescript
export const SHEET_CONFIGS = {
  'category-detail':  { snapPoints: [30, 60, 100], ariaLabel: 'Category detail' },
  'alert-detail':     { snapPoints: [50, 100],     ariaLabel: 'Alert detail' },
  'region-detail':    { snapPoints: [50, 100],     ariaLabel: 'Region detail' },
  'settings':         { snapPoints: [50, 100],     ariaLabel: 'Settings' },
} as const
```

### Behavior
- **Snap points:** Integer percentages (not fractions). Runtime guard normalizes.
- **Drag:** `motion/react` v12 `onDrag` + `onDragEnd` with velocity-aware snap selection.
- **Focus trap:** `aria-modal="true"`, focus trapped on open, returned on dismiss (C.2).
- **History:** `pushState` on open, `popstate` listener for back-button dismiss (C.2).
- **Landscape:** Max height capped at 60% for non-fullscreen sheets (C.2 + F.1).
- **Fullscreen:** Exempt from landscape cap. Accessible via header button (C.2).

---

## 4. Navigation System

### Morph State Machine (Mobile Fast Path)
```
Forward:  idle → entering-district (600ms) → district
Reverse:  district → leaving-district (400ms) → idle
```
Mobile skips `expanding` (400ms) and `settled` (200ms hold) phases via `startMorph(category, { fast: true })`.

### Cross-Tab Navigation (E.3)
- `navigateToCategory(categoryId)` — switches to Situation tab, opens category detail
- `navigateToMap(alertId, coords, category, basic)` — switches to Map tab, flies to location
- `handleViewRegionOnMap(regionKey)` — switches to Map tab, flies to region centroid
- `handleShareAlert(alertId)` — copies deep link URL, shows 1.5s clipboard confirmation

### URL Deep Linking (E.3)
```
?tab=situation&category=seismic&alert=abc123
```
- `history.replaceState` for lateral navigation (not `pushState`)
- `useMobileDeepLinks` restores state on page load with strict-mode guard

---

## 5. Protective Operations

### Session Auto-Lock (F.4)
- `useIdleLock` monitors pointer + keyboard events with 1s throttle
- Configurable timeout via `settings.store.idleLockTimeoutMinutes` (default 5 min)
- Lock on tab-hidden timeout exceeding threshold
- Unlock via `auth.store.login(passphrase)`
- Full-viewport overlay at z-50 with focus trap

### P1 Audio Alert (F.4)
- `useP1AudioAlert` monitors `usePriorityFeed().data.mostRecentP1.id` changes
- Web Audio API `AudioContext` for reliable mobile playback
- `navigator.vibrate([200, 100, 200])` pattern
- Gated by `settings.store.audioNotificationsEnabled`
- Architectural dedup: mobile uses `useP1AudioAlert`, desktop uses `useNotificationDispatch` (separate code-split trees)

### Data Freshness (B.3 + F.4)
- `useDataFreshness` — base hook (fresh | stale | offline)
- `useDataFreshnessMobile` — mobile wrapper adding CSS `data-freshness` attribute, staleness logging, `isRecovering` flag
- `DataStaleBanner` — shell-level banner on staleness
- `ConnectivityDot` — header indicator

---

## 6. Accessibility Requirements (F.2)

### WCAG 2.1 AA Compliance
- **Semantic structure:** `role="tablist"` + `role="tab"` + `role="tabpanel"` on tab system
- **Focus management:** Focus trapped in sheets, returned on dismiss, moves to first focusable on tab switch
- **Screen reader:** `aria-live` regions on posture changes, P1 count, staleness banner
- **Color contrast:** 4.5:1 minimum on glass backgrounds (verified)
- **Touch targets:** 44px minimum (48px design target)
- **Reduced motion:** All animations gated by `prefers-reduced-motion: reduce`
- **Keyboard navigation:** Arrow keys in tab bar (roving tabindex), Escape dismisses sheets
- **Skip-to-content:** `SkipToContent` component as first focusable element
- **Viewport zoom:** No `user-scalable=no`, all layouts functional at 200% zoom

---

## 7. Performance Budget (F.3)

| Metric | Target |
|--------|--------|
| Mobile shell + core JS | < 60 KB gzipped |
| Map chunk (MapLibre) | < 180 KB gzipped |
| Bottom sheet + detail JS | < 25 KB gzipped |
| Total mobile JS | < 275 KB gzipped |
| Lighthouse Performance | >= 85 |
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| TTI | < 3s on throttled 4G |

### PWA
- `manifest.json` with standalone display, `#050911` theme
- Service worker: app shell cache only (no API responses)
- iOS home screen meta tags + splash screens
- Offline: cached shell loads, data queries show error states

---

## 8. Landscape Support (F.1)

All landscape adaptations are CSS-only (`@media (orientation: landscape)`):

| Tab | Portrait | Landscape |
|-----|----------|-----------|
| Situation | Single column: banner → priority → grid (2-col) | Side-by-side: posture (40%) + grid (60%, 3-col) |
| Map | Stacked: filter chips above, controls below | Three-column: filter rail (30%) + map + control rail (15%) |
| Intel | Single column: priority feed → geo summaries | Side-by-side: alerts (45%) + geo intel (55%) |
| Category Detail | List/Map toggle | List (55%) + map (45%) side-by-side, toggle hidden |
| Header | 48px with labels | 40px reduced |
| Bottom Nav | 56px with labels | 48px icon-only |

---

## 9. Implementation Guidance

### Recommended Implementation Order

1. **Phase A** (all 4 workstreams) — foundation, no parallelism issues
2. **Phase B** (B.1 first, then B.2 + B.3 in parallel) — situation tab content
3. **Phase C** (C.1 first, then C.2-C.5 fan out) — sheet + map infrastructure
4. **Phase D** (D.2 first, then D.1, then D.3) — detail views
5. **Phase E** (E.1 → E.2 → E.3 strictly sequential) — intel + cross-tab
6. **Phase F** (F.1 + F.3 + F.4 + F.5 in parallel, then F.2 last) — polish

### Pre-Implementation Checklist
- [ ] MobileStateView component (~60 lines) — prerequisite, assigned to first implementing agent
- [ ] Verify `src/lib/interfaces/mobile.ts` exports `MOBILE_TABS`, `DEFAULT_MOBILE_TAB`, `MobileTab`
- [ ] Verify `settings.store.ts` has `idleLockTimeoutMinutes` field after WS-C.5
- [ ] CSS class name audit before F.1 implementation (class names in SOW are assumed patterns)

### Testing Strategy
- Unit tests specified per SOW (total ~150+ tests across all phases)
- `pnpm typecheck` must pass after each workstream
- `pnpm build` must succeed after each phase
- Desktop rendering at 1920x1080 must be unchanged (verified each phase)
- Lighthouse mobile audit after Phase F
