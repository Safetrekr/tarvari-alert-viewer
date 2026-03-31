# Mobile Strategy Synthesis -- Cross-Document Analysis

**Date:** 2026-03-06
**Status:** All 8 client decisions resolved (2026-03-06) -- ready for implementation
**Reviewer:** every-time protocol v3.2
**Documents reviewed:**
1. UX Strategy (ux-strategy.md) -- Rating: B+
2. UI Design System (ui-design-system.md) -- Rating: A-
3. Interface Architecture (interface-architecture.md) -- Rating: B+
4. Information Architecture (information-architecture.md) -- Rating: A

---

## Executive Summary

The four specialist documents collectively provide a thorough mobile strategy for the TarvaRI Alert Viewer. The shared data layer approach (reusing all TanStack Query hooks, Zustand stores, and TypeScript interfaces) is unanimous and correct. The problem is that the documents disagree on 8 major decisions, most critically the navigation model, where all four documents propose different structures. This synthesis identifies every conflict, recommends a unified resolution for each, and flags 8 decisions that require client input before implementation can begin.

---

## 1. Consensus Decisions (All Documents Agree)

These decisions are unanimous or near-unanimous and can be adopted immediately.

| Decision | Agreement | Source |
|----------|-----------|--------|
| **Separate mobile component tree** (not responsive CSS on desktop components) | 4/4 | All documents agree that the ZUI engine cannot be made responsive; a new component tree is needed |
| **Same codebase, same route** (no `/mobile` route; viewport-based detection) | 4/4 | All documents agree on client-side detection within the existing `(launch)/page.tsx` |
| **Shared data layer** (all TanStack Query hooks, Zustand stores, TypeScript types, API client) | 4/4 | UX Section 1, UI Section 2, Interface Section 6-7, IA Section 1 |
| **Bottom sheets as drill-down mechanism** | 4/4 | All documents use bottom sheets for alert detail, category detail, and secondary panels |
| **Dark Oblivion aesthetic preserved** (`#050911` void background, glassmorphism, monospace, severity colors) | 4/4 | All documents maintain the cinematic dark-field aesthetic |
| **MapLibre GL JS retained** (touch-native, GPU-accelerated markers, dark CARTO tiles) | 4/4 | All documents keep the existing map implementation |
| **Desktop ambient effects mostly dropped** (DotGrid, SectorGrid, RangeRings, EdgeFragments, etc.) | 4/4 | All agree these are ZUI-only and should not appear on mobile |
| **2-column category grid on mobile** | 3/4 | UI, Interface, IA agree. UX proposes carousel (overruled by majority). |
| **`prefers-reduced-motion` fully respected** | 4/4 | All documents specify reduced motion behavior |
| **No hover states** | 4/4 | Tap replaces hover. Long-press for secondary actions. |
| **CategoryCard hover overlay removed, replaced by tap + long-press** | 4/4 | All agree |
| **ViewModeToggle preserved on mobile** (triaged/all-bundles/raw) | 4/4 | All documents include it, though placement varies |
| **Search accessible via header icon** | 4/4 | All documents include a header search button |
| **MapNavControls (d-pad) removed on mobile** | 4/4 | Replaced by native MapLibre touch gestures |

---

## 2. Conflicts Requiring Resolution

### Conflict 1: Navigation Model (CRITICAL -- Blocks all implementation)

| Document | Model | Tabs/Items | Default |
|----------|-------|------------|---------|
| UX Strategy | Scene stack (L0-L3) + supplementary nav rail | Map, Categories, Priorities, Search (4) | L0 Command (posture) |
| UI Design System | Tab bar | Map, Grid, Feed, Briefing (4) | Map |
| Interface Architecture | Tab bar | Map, Alerts, Settings (3) | Map |
| Information Architecture | Ghost tab bar + hamburger | Situation, Map, Intel (3 + hamburger) | Situation |

**Recommendation: Adopt IA's 3-tab model (Situation, Map, Intel) + hamburger for settings.**

Rationale:
- Only the IA document systematically evaluated alternatives with a scoring matrix. It compared 4 models across 6 criteria and documented why each was accepted or rejected.
- The 3 tabs map to user intents (status check / geographic awareness / analytical briefing), not content types.
- "Situation" as default matches the primary use case: security analysts checking threat posture. The IA's success metric requires "threat posture visible within 1 second of load" -- this is impossible if Map is the default tab.
- Settings as a primary tab (Interface Architecture) wastes prime navigation real estate on infrequently-accessed controls.
- 4 tabs (UI Design System) creates more navigation chrome and fragments related content.
- The scene stack (UX Strategy) is the most creative model but also the most unfamiliar. Its information hierarchy mapping (L0=posture, L1=map+categories, L2=detail, L3=alert) should inform the tab content but not replace tabs as the navigation mechanism.

**However:** Incorporate UX Strategy's edge-glow indicators as a supplementary navigation enhancement (not primary).

### Conflict 2: Category Display

| Document | Model |
|----------|-------|
| UX Strategy | Horizontal carousel, 72x100px pills |
| UI Design System | 2-column grid, ~172px wide cards, min-height 120px |
| Interface Architecture | 2-column grid, ~170x120px cards |
| Information Architecture | 2-column grid, ~165x80px cards |

**Recommendation: 2-column grid (3/4 majority).** Use IA's card sizing (~165x80px) as the baseline. The UI Design System's 120px minimum height is too tall and would show only 4 cards above the fold on iPhone SE. The IA's 80px height shows 6-8 cards. Sort by alert count descending with KNOWN_CATEGORIES tie-breaking.

### Conflict 3: Morph Transition

| Document | Approach |
|----------|----------|
| UX Strategy | Full 6-phase morph with clip-path circle expansion |
| UI Design System | Morph dropped entirely |
| Interface Architecture | 3-phase fast path (`idle -> entering-district -> district`) |
| Information Architecture | Push navigation (no morph specified) |

**Recommendation: Interface Architecture's 3-phase fast path.** This reuses the existing `startMorph(categoryId, { fast: true })` code path, preserves `useMorphChoreography` as the single source of morph state transitions, and ties bottom sheet open/close to the morph phase. Total transition time: ~300ms.

### Conflict 4: Ambient Effects

| Effect | UX | UI | Interface | IA |
|--------|-----|-----|-----------|-----|
| Scan line | Keep (8s) | Keep (25s) | Keep (12s) | Cut |
| Session timecode | Keep | Keep | Keep | Cut |
| ThreatPulseBackground | New (keep) | Not mentioned | Not mentioned | Not mentioned |
| Edge glow indicators | New (keep) | Not mentioned | Not mentioned | Not mentioned |
| Map marker ping | Keep | Keep | Keep | Not specified |

**Recommendation: Keep a curated set.**

| Effect | Decision | Cycle Time |
|--------|----------|------------|
| Scan line | **Keep** | 12s (middle ground) |
| Session timecode | **Keep** | N/A |
| ThreatPulseBackground | **Keep (new)** | 4s at ELEVATED, 6s at HIGH, off at LOW |
| Map marker ping/glow | **Keep** | Existing MapLibre paint properties |
| Edge glow indicators | **Keep as supplementary** | 2s pulse |
| DataScanReveal | **Defer to Phase 6** | Evaluate after core is built |
| All ZUI effects | **Cut** | N/A |

### Conflict 5: Touch Target Minimum

| Document | Minimum |
|----------|---------|
| UX / Interface / IA | 44px |
| UI Design System | 48px |

**Recommendation: 44px as WCAG compliance threshold, 48px as design target.**

### Conflict 6: Hook Name

| Document | Name |
|----------|------|
| UX / Interface | `useIsMobile()` |
| UI Design System | `useMobileDetect()` |

**Recommendation: `useIsMobile()` returning `boolean | null`.** The `null` return type (from Interface Architecture) is critical for hydration safety.

### Conflict 7: Breakpoint Value

| Document | Value |
|----------|-------|
| UX Strategy | `max-width: 768px` (includes 768) |
| UI / Interface | `max-width: 767px` (excludes 768) |

**Recommendation: `max-width: 767px`** (mobile = < 768px). This gives 768px-wide iPads the desktop ZUI.

### Conflict 8: Bottom Sheet Snap Points

| Document | Approach |
|----------|----------|
| UX Strategy | Per-context (Alert 70%/100%, Priority 60%/100%, Category 35%/65%/100%, Filter 40%) |
| UI Design System | Generic (0%/50%/92%) |
| Interface Architecture | Generic (0%/50%/90%) |

**Recommendation: Per-context snap points (UX Strategy approach).** Different content types have different height needs.

---

## 3. Client Decisions (Resolved 2026-03-06)

| # | Question | **Client Decision** |
|---|----------|---------------------|
| Q1 | **Offline support** | **(a) No offline.** No caching, no PWA service worker for data. Online-only. |
| Q2 | **Landscape orientation** | **(b) Both portrait and landscape.** Landscape layout must be designed and implemented. |
| Q3 | **Push notifications** | **(a) Not now.** Polling only. Revisit later when backend supports push. |
| Q4 | **"Intel" tab name** | **Yes, "Intel" is fine.** Ship as-is. |
| Q5 | **Ambient effects on by default** | **Yes.** Edge glow and threat pulse on by default with toggle in settings. |
| Q6 | **Dynamic category sort with dampening** | **Yes.** Re-sort on refresh or when delta >= 2. |
| Q7 | **Alert detail presentation** | **Bottom sheet that can expand to full-screen via button.** Default is bottom sheet (preserves context); user can tap an expand button to go full-screen for detailed reading. |
| Q8 | **Viewport zoom** | **Yes, allow.** No `user-scalable=no`. WCAG compliant. |

### Impact of Client Decisions on Implementation

- **Q1 (No offline):** Phase 6 PWA scope is reduced. No service worker for data caching. PWA manifest + icons can still be added for "Add to Home Screen" installability, but no offline data.
- **Q2 (Landscape support):** Adds implementation work. Each tab needs a landscape layout variant. Map tab is straightforward (MapLibre handles resize). Situation tab needs a side-by-side layout (posture strip + category grid). Bottom sheets need landscape-aware snap points (max ~60% height in landscape). The Interface Architecture's open question about landscape phone detection is now resolved: support it, don't prevent it.
- **Q7 (Expandable bottom sheet):** The `MobileBottomSheet` component needs a third mode beyond half/full snap: an "expand to full-screen" button in the sheet header that transitions the sheet into a full-viewport overlay (with a "collapse" button to return to sheet mode). This is a hybrid of the bottom sheet and full-screen approaches.

---

## 4. Unified Implementation Approach

### 4.1 Canonical Decisions

| Decision | Value | Source |
|----------|-------|--------|
| Navigation model | 3-tab ghost tab bar (Situation, Map, Intel) + hamburger settings | IA Section 4 |
| Default tab | Situation | IA Section 5 |
| Category display | 2-column grid, ~165x80px cards | IA Section 12.3 |
| Morph transition | 3-phase fast path via `startMorph(id, { fast: true })` | Interface Section 6.3 |
| Bottom sheet framework | Per-context snap points, spring physics via `motion/react` | UX Section 9 + UI Section 11 |
| Glassmorphism perf | 3-tier system (always-on, scroll-rest, simplified) | UI Section 6 |
| Design tokens | Mobile token layer in `mobile-tokens.css` | UI Section 3 |
| Typography scale | Mobile type scale with 10px floor | UI Section 4 |
| Ambient effects | Scan line (12s) + session timecode + ThreatPulseBackground + marker animations + edge glow | Composite |
| Detection hook | `useIsMobile()` returning `boolean \| null` | Interface Section 3 |
| Breakpoint | `max-width: 767px` | Interface Section 3.4 |
| Touch target minimum | 44px (WCAG), 48px (design target) | Composite |
| Code splitting | Dynamic import for both `MobileView` and `DesktopView` with `ssr: false` | Interface Section 4.3 |
| Hydration | `null` initial state with `HydrationShell` placeholder | Interface Section 3.2 |
| PWA | manifest.json + icons only (no service worker / no offline) | Client Q1 decision |
| Landscape | Supported -- each tab needs landscape layout variant | Client Q2 decision |
| Alert detail | Bottom sheet with expand-to-full-screen button | Client Q7 decision |
| Contrast tiers | Primary 0.70-0.90, Secondary 0.45-0.55, Ambient 0.30-0.40 | IA Section 17.3 |
| Viewport meta | `viewport-fit=cover`, NO `user-scalable=no` | Interface (modified) |
| OLED background | Keep `#050911` (prevent OLED smear) | UI Section 13 |

### 4.2 Document Role Assignment

| Document | Authoritative For | Defer To Others For |
|----------|-------------------|---------------------|
| **Information Architecture** | Navigation model, tab structure, content priority, progressive disclosure | Technical implementation, design tokens, animation specs |
| **UI Design System** | Design tokens, typography, glassmorphism, animation budgets, CSS patterns | Navigation model (adopt IA's), morph behavior |
| **Interface Architecture** | Code architecture, file structure, state management, code splitting, PWA | Navigation model (adopt IA's), visual design |
| **UX Strategy** | Gesture vocabulary, unconventional effects, user flows, haptic feedback | Navigation model (adopt IA's 3-tab), category layout (adopt grid) |

---

## 5. Priority-Ordered Action Plan

### Phase 1: Foundation (Week 1)
**Lead spec: Interface Architecture**

1. Create `src/hooks/use-is-mobile.ts` (return `boolean | null`)
2. Extract current `page.tsx` into `src/views/DesktopView.tsx`
3. Create `src/views/MobileView.tsx` with dynamic import
4. Update `src/app/(launch)/page.tsx` as thin orchestrator
5. Create `src/components/mobile/MobileShell.tsx` (fixed header + scroll area + bottom nav)
6. Create `src/components/mobile/MobileHeader.tsx` (48px, glass, logo + timecode + threat indicator + search)
7. Create `src/components/mobile/MobileBottomNav.tsx` (3 tabs: Situation, Map, Intel + hamburger)
8. Create `src/styles/mobile-tokens.css`
9. Create `src/components/mobile/MobileScanLine.tsx` (12s cycle, CSS-only)
10. Verify desktop experience is completely unchanged

**Gate: Desktop renders identically. Mobile renders shell with header, empty content, bottom nav. Tab switching works. Static export builds.**

### Phase 2: Situation Tab (Week 2)
**Lead spec: IA for content structure, UI Design System for visual specs**

1. Create `MobileThreatBanner` (posture level + P1/P2 counts + trend + latest P1 headline)
2. Create `MobileCategoryGrid` (2-column, 165x80px cards, sorted by alert count)
3. Create `MobileCategoryCard` (tap=detail, long-press=filter)
4. Wire `useCoverageMetrics()` + `useThreatPicture()` + `usePriorityFeed()`
5. Create `MobilePriorityStrip` (horizontal P1/P2 scroll)
6. Create `ThreatPulseBackground` (CSS radial gradient keyed to posture level)
7. Implement sticky posture strip with scroll-collapse behavior

**Gate: Situation tab shows threat posture, P1/P2 counts, latest P1 alert, and all 15 category cards.**

### Phase 3: Map Tab + Bottom Sheet (Week 2-3)
**Lead spec: Interface Architecture for technical, UI Design System for visual**

1. Create `MobileMapView` (full-bleed CoverageMap, lazy-loaded)
2. Wire `useCoverageMapData()` with category filters
3. Create `MobileBottomSheet` (spring physics, per-context snap points)
4. Wire marker tap -> alert detail bottom sheet
5. Add horizontal category filter chips at top of map
6. Add ViewModeToggle as floating glass control
7. Add TimeRangeSelector as inline control
8. Implement edge-glow indicators as supplementary nav cue

**Gate: Map renders with markers. Marker tap opens alert detail sheet. Filters work.**

### Phase 4: Category Detail + Alert Detail (Week 3-4)
**Lead spec: Interface Architecture for morph, IA for content structure**

1. Wire `startMorph(id, { fast: true })` on category card tap
2. Create `MobileCategoryDetail` (bottom sheet: header + severity bar + map + alert list)
3. Create `MobileAlertCard` (64px height, touch-optimized)
4. Create `MobileAlertDetail` (nested sheet or content swap)
5. Wire `useCategoryIntel()` for alert list
6. Wire `reverseMorph()` on sheet dismiss

**Gate: Category card tap opens detail. Alert list loads. Back gesture returns to Situation.**

### Phase 5: Intel Tab + Search (Week 4)
**Lead spec: IA for content structure, UX Strategy for search UX**

1. Create Intel tab with priority feed section
2. Create geographic intelligence section (summaries)
3. Wire `usePriorityFeed()`, `useAllGeoSummaries()`, `useLatestGeoSummary()`
4. Create `MobileSearchOverlay` (full-screen, auto-focus)
5. Wire `useIntelSearch()`
6. Implement cross-tab navigation links

**Gate: Intel tab shows priority alerts and geo summaries. Search finds alerts.**

### Phase 6: Landscape + Polish (Week 5)
**Lead spec: UI Design System for polish, Interface Architecture for landscape**

1. Landscape layout variants for all three tabs (Situation: side-by-side posture+grid, Map: full-bleed, Intel: two-column)
2. Landscape-aware bottom sheet snap points (max ~60% height in landscape)
3. Bottom sheet expand-to-full-screen button + collapse button
4. Implement scroll-gated glassmorphism
5. PWA manifest + icons (no service worker -- online only per client Q1)
6. Corner bracket decoration on key containers
7. Spring constant tuning on bottom sheets
8. Accessibility audit (screen reader, focus, contrast)
9. Touch target audit (44px minimum)
10. `prefers-reduced-motion` verification
11. Performance profiling (Lighthouse >= 85)
12. Safe area inset handling
13. Haptic feedback integration

**Gate: Landscape renders correctly on all tabs. Bottom sheet expands to full-screen and collapses back. Lighthouse >= 85. All touch targets >= 44px. 60fps on mid-range devices.**

---

## 6. Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Navigation model disagreement delays implementation | High | This synthesis resolves it. Adopt IA's 3-tab model. |
| WCAG contrast failures from Oblivion aesthetic | High | Adopt IA's contrast tiers. Mobile text alpha 0.45+ minimum. |
| MapLibre bundle size (180KB) | Medium | Lazy-load on Map tab (Situation is default). |
| Bottom sheet vs internal scroll conflicts | Medium | `overscroll-behavior: contain` on sheet scroll areas. |
| Long-press conflicts with browser context menu | Medium | `e.preventDefault()` on `contextmenu` for category cards. |
| Camera store import in coverage.store.ts | Low | Verify tree-shaking. Extract conditionally if needed. |
| Category card position jitter from dynamic sort | Low | Dampen re-sort (only on refresh or delta >= 2). |

---

## 7. Document Quality Summary

| Document | Rating | Primary Value | Primary Gap |
|----------|--------|---------------|-------------|
| UX Strategy | B+ | Creative vision, unconventional effects, user flows | Navigation model unjustified, carousel vs grid |
| UI Design System | A- | Design tokens, glass perf tiers, OLED, CSS patterns | Wrong tab model, no threat pulse |
| Interface Architecture | B+ | Technical precision, code splitting, PWA, morph simplification | Weak navigation model (Map/Alerts/Settings) |
| Information Architecture | A | Content audit, nav evaluation, progressive disclosure, validation plan | Over-cuts ambient effects |

**Overall assessment:** The four documents are individually strong but collectively inconsistent on the navigation model. Once that conflict is resolved (adopt IA's 3-tab model), the remaining conflicts are minor and resolvable. The combined strategy -- IA's navigation + UI's tokens + Interface's code architecture + UX's creative effects -- produces a cohesive mobile experience.

---

*Synthesis version: 1.0 | Created: 2026-03-06 | Reviewer: every-time protocol v3.2*
*Status: All client decisions resolved. Ready for implementation.*
