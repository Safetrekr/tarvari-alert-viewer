# Phase F Review: Landscape + Polish

> **Reviewer:** `every-time`
> **Classification:** HIGH
> **Date:** 2026-03-06
> **Documents Reviewed:** 6 (ws-f.1, ws-f.2, ws-f.3, ws-f.4, ws-f.5, PHASE-F-OVERVIEW)
> **Codebase Files Verified:** coverage.store.ts, ui.store.ts, coverage.ts (interfaces), use-coverage-metrics.ts, use-coverage-map-data.ts, use-intel-feed.ts, use-intel-bundles.ts, use-priority-feed.ts, use-geo-summaries.ts, use-threat-picture.ts, use-category-intel.ts, use-telemetry.ts (existence), settings.store.ts, auth.store.ts, notification-sound.ts, use-notification-dispatch.ts, morph-types.ts, reduced-motion.css, reduced-motion-audit.ts, layout.tsx, next.config.ts, package.json, public/ icon files, ThreatPictureCard.tsx (existence), use-realtime-priority-alerts.ts (existence), src/lib/interfaces/mobile.ts (missing -- pending), src/views/ (missing -- pending), src/lib/threat-utils.ts (missing -- pending), src/hooks/use-data-freshness.ts (missing -- pending)

## Review Verdict: PASS WITH ISSUES

Phase F is a well-structured final-phase delivery across five workstreams with high internal parallelism. The SOWs are thorough, demonstrate strong codebase awareness, and correctly identify cross-cutting concerns. All 8 required sections are present across all 5 SOWs. The OVERVIEW correctly identifies the three WARNING-level conflicts and provides sound resolutions.

However, the review found **2 HIGH severity issues**, **5 MEDIUM severity issues**, and **4 LOW severity issues**. The HIGH issues require clarification or correction before implementation but are not fundamentally blocking. No fabricated codebase references were found -- all claimed-existing files and types match reality, and all pending-phase dependencies are correctly marked.

---

## Per-SOW Assessment

| SOW | Completeness | Codebase Grounding | Issues Found | Rating |
|-----|-------------|-------------------|--------------|--------|
| WS-F.1 | 8/8 sections present | Good. Correctly identifies KNOWN_CATEGORIES (15), existing CSS files, safe area tokens. CSS class names correctly flagged as assumed patterns needing alignment. | 1 LOW | PASS |
| WS-F.2 | 8/8 sections present | Good. Correctly references reduced-motion.css, reduced-motion-audit.ts, morph-types.ts phases, settings.store.ts fields. | 1 LOW | PASS |
| WS-F.3 | 8/8 sections present | Strong. All 10+ query keys verified accurate. Polling intervals match codebase. Icon files in public/ verified. next.config.ts webpack flag verified. package.json build commands verified. | 2 MEDIUM | PASS |
| WS-F.4 | 8/8 sections present | Strong. auth.store.ts login() signature verified. settings.store.ts audioNotificationsEnabled verified (line 56, default false). PriorityFeedItem/mostRecentP1 verified. notification-sound.ts playNotificationSound() verified. | 2 HIGH, 1 MEDIUM | PASS WITH ISSUES |
| WS-F.5 | 8/8 sections present | Strong. All TAB_QUERY_KEYS verified against actual query keys with correct prefix-match strategy. PRIORITY_FEED_QUERY_KEY export verified. GEO_SUMMARY_QUERY_KEYS.all verified. | 2 MEDIUM, 2 LOW | PASS WITH ISSUES |

---

## Issues Found

### HIGH Severity

#### H-1: F.4 fabricated line reference for `idleLockTimeoutMinutes` in settings.store.ts

WS-F.4 Section 3 (Input Dependencies, first row) claims: "`src/stores/settings.store.ts` (line 103) -- `idleLockTimeoutMinutes: number` state field (default 5). Selector: `settingsSelectors.idleLockTimeoutMinutes`."

The field `idleLockTimeoutMinutes` does not exist in `settings.store.ts`. The file is 218 lines. Line 103 is `notificationConsent: 'undecided'`. The SOW correctly marks the status as "Pending (WS-C.5 D-1 adds this field)" -- the issue is the fabricated line number and claimed selector name. Since WS-C.5 has not been implemented, the line number is speculative.

**Fix:** Remove the specific line number reference. Change to: "`src/stores/settings.store.ts` -- `idleLockTimeoutMinutes: number` state field (default 5), to be added by WS-C.5 D-1." Verify that WS-C.5 delivers the selector with the exact name `settingsSelectors.idleLockTimeoutMinutes` (or update F.4 to match whatever WS-C.5 actually delivers).

---

#### H-2: F.4 `useP1AudioAlert` duplicates existing `useNotificationDispatch` audio path without clear deduplication wiring

WS-F.4 D-3 creates a new `useP1AudioAlert` hook that plays audio on new P1 arrivals using Web Audio API. The existing `use-notification-dispatch.ts` (line 82-85) already calls `playNotificationSound()` for P1 alerts when `audioNotificationsEnabled` is true. F.4 acknowledges this in D-3 step 6 ("Deduplication with use-notification-dispatch.ts") and references "DM-2 for deduplication strategy."

However, DM-2 in the Decisions section describes the Web Audio API vs. HTML Audio API choice, not the deduplication strategy. There is no explicit DM entry that specifies: "On mobile, disable the audio path in `useNotificationDispatch` and use only `useP1AudioAlert`."

**Fix:** Add a formal DM entry (e.g., DM-4) titled "Deduplication: Mobile P1 audio replaces notification-dispatch audio." Specify exactly how: either (a) MobileView passes `audioNotificationsEnabled: false` override to the notification dispatch context, or (b) `useP1AudioAlert` sets a flag that `useNotificationDispatch.notify()` checks, or (c) MobileView simply does not call `useNotificationDispatch` at all. The mechanism must be concrete.

---

### MEDIUM Severity

#### M-1: F.3 references `src/views/` directory that does not exist

WS-F.3's Depends On header and Section 3 reference "WS-A.1 code splitting boundary between `DesktopView` / `MobileView` via `next/dynamic` with `ssr: false`; `useIsMobile()` hook; `src/views/` directory." This directory does not exist in the codebase. It is a WS-A.1 deliverable.

**Fix:** Add a note: "Path is per WS-A.1 specification; actual location TBD during Phase A implementation."

#### M-2: F.5 `useConnectionToast` dependency header contradicts implementation

WS-F.5's Depends On header lists "WS-B.3 (`useDataFreshness` hook providing `fresh | stale | offline` tri-state for connection status toast derivation)." However, the actual D-8 implementation of `useConnectionToast` does NOT import or consume `useDataFreshness`. It uses `navigator.onLine` + window `online`/`offline` events directly. The JSDoc in D-8 explicitly states: "Does NOT consume useDataFreshness directly."

This also invalidates OVERVIEW Conflict 1's premise about a "two-layer consumption pattern."

**Fix:** Update F.5's Depends On header to downgrade the `useDataFreshness` dependency. Update OVERVIEW Conflict 1 to note that F.5 uses `navigator.onLine` directly, not the hook.

#### M-3: F.3 viewport meta tag location unclear

WS-F.3 D-4.5 and D-4.6 specify adding `<link rel="manifest">`, `<meta name="theme-color">`, and iOS home screen meta tags to `layout.tsx`. In Next.js App Router, metadata is exported via the `metadata` object, not via manual `<meta>` tags in JSX.

**Fix:** Specify that PWA meta tags should be added via Next.js metadata API (`export const metadata: Metadata = { manifest: '/manifest.json', themeColor: '#050911', appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'TarvaRI' } }`).

#### M-4: F.3 service worker + static export compatibility

WS-F.3 D-4.7 specifies `workbox-webpack-plugin` but does not address the interaction with `output: 'export'` static builds and the `/tarvari-alert-viewer/` basePath on GitHub Pages.

**Fix:** Add a note addressing basePath + static export + workbox interaction: service worker scope must include basePath, precache manifest URLs must include the basePath prefix, and test in both local dev and GitHub Pages modes.

#### M-5: F.4 and F.5 concurrent MobileView.tsx modifications

Both F.4 and F.5 modify `MobileView.tsx` significantly with hooks and JSX. Already addressed in OVERVIEW R-S2 and R-F.4. No SOW change needed.

---

### LOW Severity

#### L-1: F.1 bottom sheet max-height discrepancy with ui-design-system.md
ui-design-system.md Section 15.6 specifies 80% landscape max-height while all SOWs use 60%. Already flagged as OQ-F.2 in OVERVIEW.

#### L-2: F.2 references `jest.fn()` in test examples but project uses Vitest
**Fix:** Update D-9 examples to use `vi.fn()` and `vitest-axe`.

#### L-3: F.5 connection toast z-index conflicts with idle lock overlay
Both `.mobile-connection-toast` (F.5) and `.mobile-idle-lock-overlay` (F.4) use `z-index: 50`.
**Fix:** Lower the connection toast z-index to 45 (below the lock overlay).

#### L-4: F.5 `MobileTab` import path references pending WS-A.2 file
The path `@/lib/interfaces/mobile` is consistent with conventions. No action needed beyond noting the A.2 dependency.

---

## Cross-Phase Consistency Check

| Check | Status | Notes |
|-------|--------|-------|
| Query keys in F.5 TAB_QUERY_KEYS match codebase | PASS | All 6 query key prefixes verified. |
| F.4 auth.store.ts login() signature | PASS | `login(passphrase: string): boolean` at line 44. |
| F.4 settings.store.ts audioNotificationsEnabled | PASS | Line 56, default `false`. Selector exists at line 216. |
| F.4 PriorityFeedItem type and mostRecentP1 | PASS | Types at lines 59, 83 in use-priority-feed.ts. |
| F.4 notification-sound.ts playNotificationSound | PASS | Exported function at line 20. |
| F.3 polling intervals match codebase | PASS | All 10 hooks verified with correct intervals. |
| F.3 public/ icon files exist | PASS | 192px, 512px, apple-touch-icon all present. |
| F.3 next.config.ts static export config | PASS | STATIC_EXPORT, basePath, --webpack all verified. |
| F.1 KNOWN_CATEGORIES count (15) | PASS | 15 categories in coverage.ts lines 45-61. |
| F.2 reduced-motion.css exists | PASS | 110 lines. |
| F.2 reduced-motion-audit.ts exists | PASS | 163 lines. |
| F.1 blocks F.2 | PASS | Correctly specified. |
| F.3, F.4, F.5 independent of each other | PASS | No cross-dependencies. |
| OVERVIEW conflict analysis accuracy | PARTIAL | Conflict 1 premise incorrect (F.5 uses navigator.onLine, not useDataFreshness). Conflicts 2-4 accurate. |
| Persistent MobileStateView gap | ISSUE | 7th consecutive phase flagging. |

---

## Blocking Assessment

**Blocking for final documents?** No

**Required fixes before implementation:**
1. H-1: Remove fabricated line number for `idleLockTimeoutMinutes` in F.4 Section 3
2. H-2: Add explicit DM entry in F.4 for audio deduplication strategy

**Recommended fixes:**
3. M-2: Correct F.5 Depends On header and OVERVIEW Conflict 1 re: useConnectionToast
4. M-3: Specify Next.js metadata API for PWA meta tags in F.3
5. M-4: Add basePath + static export notes to F.3 service worker section
6. L-2: Update F.2 D-9 test examples from jest.fn() to vi.fn()
7. L-3: Resolve z-index collision between connection toast and idle lock overlay
