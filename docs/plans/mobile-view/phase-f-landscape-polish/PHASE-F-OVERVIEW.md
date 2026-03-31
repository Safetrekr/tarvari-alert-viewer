# Phase F Overview: Landscape + Polish

> **Synthesized by:** CTA (manual)
> **Parent Plan:** combined-recommendations.md (Phase Decomposition, Phase F)
> **Date:** 2026-03-06
> **Status:** Draft

---

## 1. Phase Summary

Phase F delivers the final layer of polish, operational readiness, and cross-cutting quality across the mobile view. It contains no new navigation paradigms or data display screens -- those are complete as of Phase E. Instead, Phase F transforms the portrait-first mobile experience into a robust, production-grade field tool by adding landscape orientation support, WCAG 2.1 AA accessibility compliance, PWA installability, performance budget enforcement, protective operations hooks (session auto-lock, P1 audio alerts, data freshness degradation), and tactile polish (pull-to-refresh, tab re-tap scroll-to-top, connectivity toast, shimmer standardization).

Phase F contains five workstreams totaling approximately 12 new files, 15+ modified files, and 6 CSS files. The workstreams span four agents across two domains: visual/interaction polish (F.1, F.4, F.5) and engineering quality gates (F.2, F.3). Unlike Phases D and E which had strict internal dependency chains, Phase F offers significant parallelism -- four of five workstreams can start independently. Only WS-F.2 (Accessibility Audit) has an F-internal dependency (on WS-F.1's landscape layouts).

**Risk profile:** Low-Medium. No BLOCKING cross-SOW conflicts. Three WARNING-level coordination items require attention (data freshness hook layering, audit coverage for late-phase components, dual `visibilitychange` listeners). All workstreams depend on stable prior-phase deliverables; no new API endpoints are introduced.

**Key constraint:** WS-F.2 is a cross-cutting audit that should ideally run after all other F workstreams complete to achieve comprehensive coverage. Its formal dependency on F.1 is necessary (landscape layouts need auditing), but it should informally wait for F.4 and F.5 to audit their new components (idle lock overlay, pull indicator, connection toast).

**Key deliverables at phase exit:**
- All three tabs render correctly in landscape orientation with side-by-side layouts, reduced chrome, and 3-column category grid
- WCAG 2.1 AA compliance verified across all mobile components with documented audit report and all Medium+ findings remediated
- Lighthouse Performance score >= 85, all Core Web Vitals in "Good" range, bundle sizes within budget
- PWA installable from browser on iOS and Android with offline app shell
- All TanStack Query polling pauses when tab is hidden (battery conservation)
- Session auto-locks after configurable idle timeout with passphrase re-entry
- Audible + haptic P1 alert notification when enabled in settings
- Pull-to-refresh gesture on all three tabs with haptic feedback
- Tab re-tap scrolls content to top (iOS convention)
- Connection restored toast on network recovery
- Consistent shimmer animations across all loading skeletons
- Desktop rendering remains completely unaffected

---

## 2. SOW Summary Table

| SOW | Title | Agent | Size | New Files | Modified Files | Depends On (F-internal) | Blocks (F-internal) |
|-----|-------|-------|------|-----------|----------------|-------------------------|---------------------|
| WS-F.1 | Landscape Layouts | `world-class-ui-designer` | M | 0 (CSS only) | `mobile-tokens.css`, `mobile-shell.css`, situation tab CSS, map tab CSS, intel tab CSS, category detail CSS, bottom sheet CSS | None | WS-F.2 |
| WS-F.2 | Accessibility Audit | `react-developer` | M | `SkipToContent.tsx`, `mobile-a11y-audit.md`, `ReducedMotionOverrides.css` | `MobileShell.tsx`, `MobileBottomNav.tsx`, `MobileHeader.tsx`, `MobileCategoryCard.tsx`, various components (audit-driven patches) | WS-F.1 | None |
| WS-F.3 | Performance + PWA | `react-developer` | M | `use-visibility-aware-polling.ts`, `manifest.json`, `sw.ts`, `bundle-audit-report.md` | `layout.tsx` (meta tags), `next.config.ts` (workbox), all polling hooks (visibility gating) | None | None |
| WS-F.4 | Protective Ops Hooks | `world-class-ux-designer` | M | `use-idle-lock.ts`, `use-p1-audio-alert.ts`, `use-data-freshness-mobile.ts`, `MobileIdleLockOverlay.tsx`, `mobile-protective-ops.css` | `MobileView.tsx` (hook integration, P1 banner wiring) | None | None |
| WS-F.5 | Pull-to-Refresh + Edge Polish | `world-class-ux-designer` | M | `use-pull-to-refresh.ts`, `use-connection-toast.ts`, `MobilePullIndicator.tsx`, `MobileConnectionToast.tsx`, `mobile-pull-refresh.css` | `MobileView.tsx` (pull integration), `MobileBottomNav.tsx` (re-tap detection) | None | None |

**Agent split:** F.1 is assigned to `world-class-ui-designer` (CSS-only landscape adaptations). F.2 and F.3 are assigned to `react-developer` (audit/measurement/engineering quality). F.4 and F.5 are assigned to `world-class-ux-designer` (operational UX hooks and tactile polish).

**Critical path:** F.1 → F.2 is the only sequential dependency within Phase F. F.3, F.4, and F.5 are fully independent of each other and of F.1. Maximum parallelism: F.1 + F.3 + F.4 + F.5 run concurrently; F.2 starts when F.1 completes (and ideally after F.4 + F.5 for audit completeness).

---

## 3. Cross-SOW Conflicts

### Conflict 1: Data freshness hook layering -- WARNING

**WS-F.4** (D-3) creates `useDataFreshnessMobile`, a wrapper hook around WS-B.3's `useDataFreshness` that adds mobile-specific behaviors: a `data-freshness` attribute on `document.documentElement` for CSS-driven visual degradation, staleness transition logging, and an `isRecovering` flag.

**WS-F.5** was originally described as depending on `useDataFreshness` from WS-B.3 for its `useConnectionToast` hook. However, the actual D-8 implementation of `useConnectionToast` uses `navigator.onLine` + window `online`/`offline` events directly -- it does NOT consume the `useDataFreshness` hook.

**Why WARNING (downgraded):** The original concern about a "two-layer consumption pattern" was based on an incorrect premise. F.5's `useConnectionToast` is independent of both B.3's `useDataFreshness` and F.4's `useDataFreshnessMobile`. The only coordination needed is that both F.4 (CSS degradation via `data-freshness` attribute) and F.5 (connection toast via `navigator.onLine`) react to connectivity changes, but through completely separate mechanisms.

**Resolution:** Non-issue. F.5's Depends On header has been corrected to note that `useConnectionToast` uses `navigator.onLine` directly, not the hook. No architectural coordination needed.

---

### Conflict 2: Accessibility audit coverage for F.4 and F.5 components -- WARNING

**WS-F.2** lists its dependencies as all of Phases A-E plus WS-F.1. It does not list WS-F.4 or WS-F.5 as dependencies.

**WS-F.4** creates `MobileIdleLockOverlay` -- a full-viewport z-50 overlay with passphrase input, focus trap, `aria-live` announcement, and keyboard navigation. F.4's own scope includes accessibility requirements (D-1 mentions focus trapping, aria-live, visible labels).

**WS-F.5** creates `MobilePullIndicator` and `MobileConnectionToast` -- UI elements that need reduced motion compliance and appropriate ARIA treatment.

**Why WARNING:** F.2's audit scope says it covers "the entire mobile component tree delivered by Phases A through E (and WS-F.1 landscape variants)." Components created by F.4 and F.5 would not be covered unless F.2 runs after them. However, F.2's formal dependency chain doesn't enforce this ordering.

**Resolution:** Recommend F.2 schedule its audit pass after F.4 and F.5 complete, even though F.1 is the only formal dependency. F.4 and F.5 each include their own accessibility requirements (F.4: focus trap, aria-live; F.5: reduced motion fallbacks). F.2 should add a supplementary audit pass for F.4 and F.5 components as an addendum to the audit report. Update F.2's Depends On informally to note "F.4 and F.5 recommended before audit finalization."

---

### Conflict 3: Dual `document.visibilitychange` listeners -- WARNING

**WS-F.3** (D-4.4) creates `useVisibilityAwarePolling` which listens for `document.visibilitychange` to pause/resume TanStack Query polling when the tab is hidden.

**WS-F.4** (D-1, step 10) adds `visibilitychange` handling to `useIdleLock` to detect idle time elapsed while the tab was hidden and lock the session if the elapsed time exceeds the timeout.

**Why WARNING:** Two separate `addEventListener('visibilitychange', ...)` registrations on the same event. No functional conflict (both handlers serve different purposes and do not interact), but it represents a minor architectural duplication.

**Resolution:** Acceptable. Both hooks serve fundamentally different concerns (polling management vs. session security). Combining them into a shared visibility hook would couple unrelated features. The two event listeners have negligible performance impact. No action required.

---

### Conflict 4: Pull-to-refresh indicator in landscape -- INFO

**WS-F.1** defines landscape layouts for all three tabs but does not mention pull-to-refresh indicator positioning.

**WS-F.5** states "Pull-to-refresh works identically in portrait and landscape" in its Out of Scope table and delegates landscape to WS-F.1.

**Why INFO:** The pull indicator renders at the top of the scroll container via `translateY`. In landscape, the reduced header height (40px vs 48px from F.1) and independent-scroll columns (Situation, Intel tabs) mean the indicator position is contextually different. The indicator should appear above the scrolling column that the user is pulling, not across the full viewport width.

**Resolution:** No blocking issue. The pull indicator's absolute positioning within its scroll container parent handles this automatically -- it renders at the top of whichever column the `scrollRef` points to. If visual polish is needed (indicator width matching column width rather than viewport width), it can be addressed during implementation without SOW changes.

---

## 4. Architecture Decisions Digest

Phase F produces approximately 35 architecture decisions across five workstreams.

### Cross-Cutting Decisions

| ID | Decision | SOWs | Impact |
|----|----------|------|--------|
| F.1-DM-3, F.5-OoS-1 | CSS-only landscape adaptations; no conditional React rendering | F.1, F.5 | No component unmount/remount on orientation change. Preserves scroll position and state. |
| F.3-D4.4, F.4-D1-10 | Both `useVisibilityAwarePolling` and `useIdleLock` independently listen for `visibilitychange` | F.3, F.4 | Decoupled concerns. Polling management and session security remain independent hooks. |
| F.2-AD-8, F.4-D1 | All interactive overlays (idle lock, search, sheets) trap focus and return focus on dismiss | F.2, F.4 | Consistent keyboard navigation pattern across all modal surfaces. |
| F.3-D4.4, F.5-D1 | `invalidateQueries` (explicit user refresh) works independently of `refetchInterval` (visibility-gated polling) | F.3, F.5 | Pull-to-refresh works even when polling is paused in a backgrounded tab scenario. |

### Per-Workstream Key Decisions

**WS-F.1 (Landscape Layouts):**
- DM-1: Header reduces from 48px to 40px in landscape (not removed entirely). Preserves connectivity dot, search, timecode.
- DM-2: Tab labels hidden in landscape (icon-only). Three icons (LayoutGrid, Map, Radio) are sufficiently distinct.
- DM-4: Category detail shows list + map side-by-side in landscape, hiding the List/Map toggle.
- DM-5: Category grid switches to 3 columns in landscape (from 2 in portrait).
- DM-6: Landscape CSS scoped by mobile class selectors + compound media query on `:root` tokens.

**WS-F.2 (Accessibility Audit):**
- AD-8: Skip-to-content link as first focusable element in MobileShell.
- AD-3: Tab bar uses roving tabindex pattern (arrow keys between tabs, Tab exits the tab bar).
- AD-4: Contrast audit specifically targets glassmorphism overlays on `#050911` background.
- AD-6: Reduced motion audit extends existing `reduced-motion-audit.ts` with mobile-specific selectors.

**WS-F.3 (Performance + PWA):**
- Service worker caches app shell only (no API responses, no map tiles). Matches client decision Q1 "online-only."
- `useVisibilityAwarePolling` is a simple boolean hook, not a middleware. Each polling hook opts in by conditionalizing `refetchInterval`.
- PWA display mode: `standalone`. Background/theme color: `#050911`.
- Bundle budgets: shell <60KB, map <180KB, sheet <25KB, total <275KB gzipped.

**WS-F.4 (Protective Ops Hooks):**
- DM-2: P1 audio uses Web Audio API `AudioContext` (not HTML `<audio>` element) for precise timing and mobile browser compatibility.
- Idle lock respects `idleLockTimeoutMinutes === 0` as "never lock."
- Lock overlay renders at z-50 above all content including bottom sheets.
- Unlock uses existing `auth.store.login(passphrase)` -- no new auth mechanism.

**WS-F.5 (Pull-to-Refresh + Edge Polish):**
- Custom touch gesture (no external library). 60px pull threshold with rubber-band feel past threshold.
- Per-tab query key mapping (`TAB_QUERY_KEYS`) determines which caches to invalidate.
- Tab re-tap detection modifies `MobileBottomNav.onTabChange` to detect same-tab tap.
- Connection toast auto-dismisses after 3 seconds. Uses `navigator.onLine` + `useDataFreshness`.
- `overscroll-behavior: contain` suppresses native pull-to-refresh on iOS Safari.

---

## 5. Dependency Chain Verification

### Internal Phase F Chain

```
F.1 (Landscape) ──blocks──> F.2 (Accessibility Audit)

F.3 (Performance + PWA)     [independent]
F.4 (Protective Ops Hooks)  [independent]
F.5 (Pull-to-Refresh)       [independent]
```

**Parallelism:** F.1, F.3, F.4, F.5 can run concurrently. F.2 starts after F.1 completes. Recommended: F.2 starts after F.4 and F.5 also complete for comprehensive audit coverage.

### Upstream Dependencies (bidirectional verification)

| Consumer | Depends On | Verified? | Status |
|----------|-----------|-----------|--------|
| F.1 | WS-A.2 (`data-orientation="landscape"`, `isLandscape`) | A.2 foundational | OK |
| F.1 | WS-A.3 (`--sheet-landscape-max-height`, spacing tokens) | A.3 foundational | OK |
| F.1 | WS-A.4 (safe area tokens) | A.4 foundational | OK |
| F.1 | WS-C.1, C.2 (bottom sheet with landscape constraint) | C.2 includes `constrainForLandscape()` | OK |
| F.1 | WS-B.1, B.2, C.3, D.1, E.1 (CSS class hooks for layout) | Per-component CSS classes from prior phases | OK (class names may need alignment -- see R-1) |
| F.2 | All of A-E + F.1 (complete mobile component tree) | All prior phases | OK |
| F.3 | WS-A.1 (code splitting boundaries) | A.1 foundational | OK |
| F.3 | WS-A.4 (viewport meta) | A.4 foundational | OK |
| F.3 | All prior phases complete (for meaningful profiling) | All prior phases | OK |
| F.4 | WS-B.1 (`MobileP1Banner` `onTapP1` callback) | B.1 delivers banner | OK |
| F.4 | WS-B.3 (`useDataFreshness` hook) | B.3 delivers hook | OK |
| F.4 | WS-E.3 (`navigateToCategory` handler) | E.3 delivers handlers | OK |
| F.4 | WS-C.5 (settings store: `idleLockTimeoutMinutes`, `audioNotificationsEnabled`) | C.5 delivers settings | OK |
| F.5 | WS-E.3 (active tab context from `MobileView`) | E.3 delivers tab management | OK |
| F.5 | WS-A.2 (`MobileShell` scroll containers, `MobileBottomNav`) | A.2 foundational | OK |
| F.5 | WS-B.3 (`useDataFreshness` for connectivity toast) | B.3 delivers hook | OK |

### Downstream Dependencies

None. Phase F is the final phase. No workstreams depend on Phase F deliverables.

---

## 6. Risk Register

### Inherited Risks (from individual SOWs)

| ID | Source | Risk | Likelihood | Impact | Mitigation |
|----|--------|------|------------|--------|------------|
| R-F.1-1 | F.1 | CSS class names in landscape SOW don't match actual class names from prior phases | High | Medium | Pre-implementation class name audit checklist. Align selectors with actual deliverables. |
| R-F.1-4 | F.1 | `@media (orientation: landscape)` fires during Android keyboard appearance | Medium | Low | Brief layout flash during keyboard animation. Acceptable for Phase F. Debounce `isLandscape` in JS if problematic. |
| R-F.1-6 | F.1 | 60% bottom sheet max-height on shortest landscape phones yields only 192px | Medium | Medium | Tight but functional. Fullscreen mode is exempt. User testing will validate. |
| R-F.2-1 | F.2 | Glassmorphism contrast audit reveals failures requiring design changes to the Oblivion aesthetic | Medium | High | Adjust opacity tiers (raise secondary from 0.45-0.55 to 0.55-0.65) rather than abandoning glassmorphism. |
| R-F.3-1 | F.3 | Bundle size exceeds budget due to undetected desktop imports in mobile chunk | Medium | Medium | Bundle analyzer identifies specific modules. Remediation: extract shared imports, add dynamic boundaries. |
| R-F.3-2 | F.3 | Service worker interferes with TanStack Query's caching behavior | Low | High | Service worker caches app shell only (HTML, JS, CSS). API requests pass through to network. No API response caching. |
| R-F.4-1 | F.4 | Web Audio API autoplay policy blocks P1 alert sound on first occurrence | Medium | Medium | Deferred-play pattern: queue the audio and play on next user interaction. Document consent fallback. |
| R-F.4-2 | F.4 | Idle lock timer fires during active use due to throttled activity detection missing edge case | Low | Medium | 1-second throttle is conservative. Pointer + keyboard events cover all input types. Visibility change handling covers tab-switch scenarios. |
| R-F.5-1 | F.5 | Custom pull-to-refresh gesture conflicts with iOS Safari native pull-to-refresh | Medium | Medium | `overscroll-behavior: contain` on scroll containers. `e.preventDefault()` on touchmove during active pull. Verified pattern in production mobile web apps. |
| R-F.5-2 | F.5 | Pull distance calculation incorrect in nested scroll contexts (bottom sheet open inside tab) | Low | Medium | Pull gesture disabled when bottom sheet is open (`enabled` prop set to false). Bottom sheets already have `overscroll-behavior-y: contain` from WS-C.1. |

### Synthesis-Level Risks (cross-SOW)

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-S1 | F.2 audit starts before F.4/F.5 complete, missing accessibility issues in new components | Medium | Medium | Schedule F.2 audit pass after all other F workstreams. F.4/F.5 include their own accessibility requirements. F.2 adds supplementary audit. |
| R-S2 | Multiple `MobileView.tsx` modifications from F.4 and F.5 cause merge conflicts | Medium | Low | Both add hook calls and JSX to `MobileView`. Conflicts are structural (hook ordering, JSX placement) and easy to resolve. Coordinate implementation order or use sequential commits. |
| R-S3 | Landscape layouts (F.1) interact poorly with pull-to-refresh indicator (F.5) in independent-scroll columns | Low | Low | Pull indicator renders within the scroll container ref. In landscape two-column layouts, the indicator appears above the scrolling column, not viewport-wide. Natural behavior. |
| R-S4 | Persistent MobileStateView gap (7th phase flagging) affects F.2 audit and F.5 shimmer polish | Medium | Medium | Must be implemented before Phase F starts. Assign as prerequisite task. See Recommendations. |

---

## 7. Estimated Effort

| SOW | Agent | Size | Estimated Hours | Key Complexity Drivers |
|-----|-------|------|-----------------|----------------------|
| WS-F.1 | `world-class-ui-designer` | M | 8-10h | 7 CSS deliverables across 7 files, compound media queries, per-tab layout rules, safe area handling. No React changes. |
| WS-F.2 | `react-developer` | M | 14-18h | 9 audit domains, manual VoiceOver/TalkBack testing, contrast measurement on glass backgrounds, focus management verification across all sheet contexts, code remediation patches, audit report documentation. |
| WS-F.3 | `react-developer` | M | 12-15h | Bundle analyzer setup + analysis, Lighthouse profiling, `useVisibilityAwarePolling` hook + integration across 10+ polling hooks, PWA manifest + iOS meta tags, service worker with workbox, memory profiling. |
| WS-F.4 | `world-class-ux-designer` | M | 11-14h | 3 hooks (`useIdleLock` ~150 lines, `useP1AudioAlert` ~100 lines, `useDataFreshnessMobile` ~60 lines), `MobileIdleLockOverlay` component (~200 lines), Web Audio API integration, P1 banner wiring, unit tests. |
| WS-F.5 | `world-class-ux-designer` | M | 10-12h | `usePullToRefresh` custom touch gesture (~80 lines), `MobilePullIndicator` with SVG progress arc, `useConnectionToast` hook, per-tab query key mapping, tab re-tap detection, shimmer standardization, unit tests. |
| **Total** | | **5 x M** | **55-69h** | |

**Comparison to prior phases:**

| Phase | Workstreams | Sizes | Estimated Hours | Parallelism |
|-------|-------------|-------|-----------------|-------------|
| A | 4 | S, M, M, S | 13-19h | Partial |
| B | 3 | M, M, S | 19-26h | Partial |
| C | 5 | M, M, M, M, S | 30-40h | Partial |
| D | 3 | L, M, M | 22-33h | Partial (D.1/D.2 parallel) |
| E | 3 | M, M, M | 36-41h | None (strictly sequential) |
| **F** | **5** | **M, M, M, M, M** | **55-69h** | **High (4 of 5 parallel)** |

Phase F has the highest total hours but also the highest parallelism. Elapsed wall-clock time is driven by the F.1 → F.2 chain (~22-28h) running in parallel with F.3 (~12-15h), F.4 (~11-14h), and F.5 (~10-12h). Effective elapsed time: ~22-28h.

---

## 8. Open Questions

### Requiring Resolution Before Implementation

| ID | Question | Source | Owner | Target |
|----|----------|--------|-------|--------|
| OQ-F.1 | Should the category grid use CSS `auto-fill`/`auto-fit` with `minmax()` instead of fixed `repeat(3, 1fr)` in landscape? | F.1 OQ-1 | UI Designer | Phase F implementation |
| OQ-F.2 | The ui-design-system.md specifies 80% bottom sheet landscape max-height while all SOWs use 60%. Should ui-design-system.md be updated? | F.1 OQ-2 | Planning coordinator | Phase F review gate |
| OQ-F.3 | Should the Map tab landscape rails use `<aside>` semantic HTML or `<div>` with ARIA roles? | F.1 OQ-3 | F.2 auditor | Phase F |
| OQ-F.4 | In landscape category detail, should alert detail open as nested sheet or replace the list column in-place? | F.1 OQ-4 | UX Designer | Phase F implementation |

### Deferred to User Testing

| ID | Question | Source | Deferral Rationale |
|----|----------|--------|--------------------|
| OQ-F.5 | Icon-only tab bar in landscape: add tooltip/long-press hint? | F.1 OQ-5 | Assumption that users learn tabs in portrait is reasonable |
| OQ-F.6 | Auto-scroll to top on new intel items during pull-to-refresh? | F.5 | Sort logic in MobileCategoryGrid triggers automatically on data change |
| OQ-F.7 | Web Share API instead of clipboard copy for share action? | E.3 OQ-1 | Enhancement, HTTPS-only |

---

## 9. Recommendations

### R-F.1: Resolve MobileStateView before Phase F starts (PERSISTENT GAP)

**Action:** This component has been flagged as undelivered in every phase review since Phase A (7 consecutive phases). WS-F.2 needs it for audit coverage. WS-F.5 needs it for shimmer polish standardization. Implement the minimal version (~60 lines) as a prerequisite before any Phase F workstream begins.

### R-F.2: Schedule F.2 audit after all other F workstreams

**Action:** Although F.2's formal dependency is only F.1, the audit should cover F.4's `MobileIdleLockOverlay` (focus trap, aria-live) and F.5's `MobilePullIndicator` and `MobileConnectionToast` (reduced motion, ARIA). Schedule F.2 to begin its audit pass after F.1, F.4, and F.5 are complete. F.3 does not produce user-facing components requiring accessibility audit.

### R-F.3: Pre-implementation class name audit for F.1

**Action:** F.1 Risk R-1 correctly identifies that the CSS class names in the landscape SOW are assumed patterns (`.mobile-category-grid`, `.mobile-map-filter-chips`, etc.) that may not match the actual class names delivered by prior phases. Before writing any landscape CSS, create a checklist of actual class names from WS-B.2, WS-C.3, WS-D.1, and WS-E.1 deliverables and align the landscape selectors.

### R-F.4: Coordinate MobileView.tsx modifications

**Action:** F.4 and F.5 both modify `MobileView.tsx` to wire in hooks and render components. F.4 adds `useIdleLock`, `useP1AudioAlert`, `useDataFreshnessMobile`, and `<MobileIdleLockOverlay>`. F.5 adds `usePullToRefresh`, `useConnectionToast`, and `<MobilePullIndicator>` + `<MobileConnectionToast>`. Implement F.4 and F.5 sequentially on `MobileView.tsx` to avoid merge conflicts, or coordinate the integration in a single pass.

### R-F.5: Document data freshness hook layering

**Action:** After Phase F, the data freshness system has three layers: (1) B.3's `useDataFreshness` (raw hook), (2) F.4's `useDataFreshnessMobile` (mobile wrapper with CSS degradation + logging), (3) F.5's `useConnectionToast` (consuming B.3 directly for online/offline transitions). Document this architecture to prevent future confusion about which hook to consume. If future mobile features need freshness state, they should use F.4's wrapper.

### R-F.6: Phase F review gate before final documents

**Action:** After all F workstreams complete, hold a review gate that verifies:
1. All three tabs render correctly in landscape at 812x375 (iPhone 14 landscape)
2. Landscape chrome reductions (40px header, 48px nav, icon-only tabs) are functional
3. WCAG 2.1 AA audit report shows all Medium+ findings remediated
4. Lighthouse Performance >= 85 on mobile preset
5. PWA installs successfully on iOS and Android
6. Idle lock activates after timeout, passphrase unlock works
7. P1 audio alert plays on new P1 arrival (when enabled)
8. Pull-to-refresh invalidates correct queries per active tab
9. Tab re-tap scrolls to top
10. Desktop rendering unchanged at 1920x1080
