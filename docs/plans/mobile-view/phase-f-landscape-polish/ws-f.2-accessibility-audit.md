# WS-F.2: Accessibility Audit

> **Workstream ID:** WS-F.2
> **Phase:** F -- Landscape + Polish
> **Assigned Agent:** `react-developer`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.2 (MobileShell, MobileHeader, MobileBottomNav with `role="tablist"` markup), WS-A.3 (design tokens: `--glass-*`, `--posture-*`, `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`; `mobile-tokens.css`; `MobileScanLine` with `prefers-reduced-motion` handling), WS-A.4 (viewport meta: `viewport-fit=cover`, no `user-scalable=no`), WS-B.1 (MobileThreatBanner with posture `aria-live` region, MobilePriorityStrip, MobileThreatIndicator), WS-B.2 (MobileCategoryGrid with `role="list"` markup, MobileCategoryCard), WS-B.3 (ThreatPulseBackground with reduced motion fallback, ConnectivityDot, DataStaleBanner with `aria-live`), WS-C.1 (MobileBottomSheet core with drag/snap), WS-C.2 (focus trap, `aria-modal`, focus-return-on-dismiss inside MobileBottomSheet), WS-C.3 (MobileMapView wrapping shared CoverageMap + MapMarkerLayer), WS-C.4 (map marker tap interactions, MapPopup with `role="dialog"`), WS-C.5 (MobileSettings sheet), WS-D.1 (MobileCategoryDetail), WS-D.2 (MobileAlertDetail, MobileAlertCard), WS-D.3 (morph navigation, cross-tab handlers), WS-E.1 (IntelTab with priority feed + geographic intelligence), WS-E.2 (MobileSearchOverlay with `role="search"`, MobileRegionDetail), WS-E.3 (cross-tab navigation links), WS-F.1 (landscape layout variants for all tabs)
> **Blocks:** None (final-phase audit workstream)

---

## Review Fixes Applied

**L-2:** Updated D-9 test examples from `jest.fn()` to `vi.fn()` and `jest-axe` to `vitest-axe` to match project's Vitest test runner.

---

## 1. Objective

Perform a comprehensive WCAG 2.1 AA compliance audit across the entire mobile component tree delivered by Phases A through E (and WS-F.1 landscape variants), identify non-conformances, and remediate all findings to ship-ready quality. This is a cross-cutting quality gate -- not a feature workstream -- that verifies and fixes accessibility across seven audit domains: semantic structure, focus management, screen reader support, color contrast, touch targets, reduced motion, and keyboard navigation.

The mobile view serves security analysts and operations staff in high-pressure field environments. Accessibility is not optional: analysts may operate with one hand, in bright sunlight (contrast), with external keyboards (Bluetooth on tablets), or with assistive technology. The Oblivion dark-field aesthetic with glassmorphism overlays on `#050911` backgrounds creates specific contrast challenges that this audit must verify and resolve.

This workstream produces both a documented audit report (findings, severity, remediation status) and concrete code fixes for all findings rated Medium or higher. Low-severity findings are documented for future resolution.

**Primary references:**
- OVERVIEW Section 8.2 (Accessibility Checklist items A1--A16)
- `information-architecture.md` Section 15 (Sections 15.1--15.4)
- OVERVIEW Risk R2 (WCAG contrast failures from Oblivion aesthetic)
- OVERVIEW Resolved Decision R6 (touch target minimum: 44px WCAG, 48px design target)
- OVERVIEW Client Decision Q8 (allow viewport zoom, no `user-scalable=no`)

---

## 2. Scope

### In Scope

| Audit Domain | Description |
|---|---|
| **AD-1: Semantic Structure** | Verify all ARIA roles, states, and properties per OVERVIEW A1--A9. Tab bar uses `role="tablist"` + `role="tab"` + `aria-selected` + `aria-controls`. Tab panels use `role="tabpanel"` + `aria-labelledby`. Category grid uses `role="list"` + `role="listitem"`. Alert lists use `role="list"` + `role="listitem"` + `aria-current`. Bottom sheets use `role="dialog"` + `aria-modal="true"` + `aria-label`. Search overlay uses `role="search"` + `role="listbox"` + `role="option"`. Severity and priority badges include text `aria-label` (not color-only). |
| **AD-2: Focus Management** | Verify and fix all focus transitions per `information-architecture.md` Section 15.3: focus moves to first focusable element on tab switch (A10), focus trapped inside bottom sheets on open (A11), focus returns to trigger element on sheet dismiss (A12), focus moves to search input on overlay open, focus returns to search icon on overlay dismiss, focus moves to back button on push navigation. Verify `MobileBottomSheet` focus trap from WS-C.2 works across all sheet contexts (category detail, alert detail, settings, region detail). |
| **AD-3: Screen Reader Support** | Verify `aria-live` regions: `role="status"` + `aria-live="polite"` on posture strip count updates (A6), `aria-live="assertive"` on P1 count changes (A6), `aria-live="polite"` on `DataStaleBanner` (WS-B.3) visibility changes, `aria-live="polite"` on threat banner headline updates (WS-B.1). Test with VoiceOver (iOS Safari) and TalkBack (Android Chrome). Verify all decorative elements use `aria-hidden="true"` (scanline, threat pulse background, edge glow, connectivity dot animations). |
| **AD-4: Color Contrast** | Audit all text against WCAG 2.1 AA minimum contrast ratios: 4.5:1 for normal text (A16), 3:1 for large text (18px+ or 14px+ bold). Specific risk areas: text rendered over glassmorphism backgrounds (`rgba(5, 9, 17, 0.85)`--`rgba(5, 9, 17, 0.92)` with `backdrop-filter: blur`), severity badge text on colored backgrounds, secondary/tertiary text at 0.45--0.55 opacity on `#050911`, ambient text at 0.30--0.40 opacity (verify against 10px minimum floor per R11), MobileScanLine opacity over content, category card text over `bg-white/[0.04]` glass. Use OVERVIEW contrast tiers: primary 0.70--0.90, secondary 0.45--0.55, ambient 0.30--0.40. |
| **AD-5: Touch Targets** | Measure all interactive elements against 44x44px WCAG 2.5.8 minimum (A14). Verify per `information-architecture.md` Section 15.2: tab bar buttons >= 44x49px, category cards >= 165x80px, alert list rows >= full-width x 56px, filter chips >= 64x40px (with adequate spacing for effective 44px target), map markers hit area >= 44x44px, back button >= 44x44px, search icon >= 44x44px, bottom sheet drag handle >= full-width x 44px, ViewModeToggle segments, TimeRangeSelector presets. Report any element below 44px with its measured dimensions. |
| **AD-6: Reduced Motion** | Verify `prefers-reduced-motion: reduce` disables or replaces all motion per `information-architecture.md` Section 15.4 and OVERVIEW A13. Specific checks: P1 pulse animation -> static badge, tab transition -> instant swap, bottom sheet entry -> instant appear, category card tap -> opacity feedback only (no scale), pull-to-refresh scan line -> standard spinner, trend arrows -> static icon, ThreatPulseBackground gradient -> static or disabled, MobileScanLine -> disabled, EdgeGlowIndicators -> disabled, ConnectivityDot pulse -> static, all `motion/react` components pass `reducedMotion` prop or check `useReducedMotion()`. Verify existing `src/styles/reduced-motion.css` catch-all covers mobile components. Extend the audit tool at `src/lib/audits/reduced-motion-audit.ts` with mobile-specific animated class selectors. |
| **AD-7: Keyboard Navigation** | Verify all interactive flows are operable via external Bluetooth keyboard (common on tablets, used by some mobile analysts). Tab order follows visual reading order. Arrow keys navigate within tab bar (`role="tablist"` roving tabindex pattern). Enter/Space activates buttons, cards, and toggle controls. Escape dismisses bottom sheets and search overlay. Tab does not escape focus trap when sheet is open. Category grid cards reachable via Tab key. ViewModeToggle operable via arrow keys (`role="radiogroup"`). All custom interactive elements have visible focus indicators (not relying on `:hover` which is absent on touch). |
| **AD-8: Skip-to-Content Link** | Implement a skip-to-content link as the first focusable element in `MobileShell`, targeting the `.mobile-content` scrollable area. Visually hidden until focused (standard pattern). Required for keyboard users to bypass MobileHeader chrome. |
| **AD-9: Viewport Zoom** | Verify viewport meta does not contain `user-scalable=no` or `maximum-scale=1.0` (A15, client Q8). Verify all layouts function correctly at 200% browser zoom without content truncation or overlap. |

### Out of Scope

| Area | Rationale |
|---|---|
| Desktop ZUI accessibility audit | Desktop components (`SpatialCanvas`, `SpatialViewport`, `MorphOrchestrator`, ambient effects) are a separate audit scope. This WS covers mobile components only. |
| WCAG 2.1 AAA compliance | AA is the target per OVERVIEW. AAA items (e.g., 7:1 contrast ratio) are documented but not required for ship. |
| Automated E2E accessibility testing (Playwright + axe-core) | WS-F.3 (Performance + PWA) may include Lighthouse accessibility score. This WS focuses on manual audit + unit-level automated checks. |
| Color blindness simulation testing | Beyond WCAG scope. The existing severity color design (OVERVIEW AD-1: achromatic priority channel using shape + weight) already addresses color-only information. |
| Internationalization / localization | English-only for initial release. |
| iOS VoiceOver rotor custom actions | Advanced screen reader features beyond standard ARIA compliance. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|---|---|---|
| WS-A.2 | `MobileShell` (`src/components/mobile/MobileShell.tsx`), `MobileHeader` (`src/components/mobile/MobileHeader.tsx`), `MobileBottomNav` (`src/components/mobile/MobileBottomNav.tsx`), `mobile-shell.css` (`src/styles/mobile-shell.css`), `MobileTab` type (`src/lib/interfaces/mobile.ts`) | Pending (Phase A) |
| WS-A.3 | `mobile-tokens.css` (`src/styles/mobile-tokens.css`) with glass tokens (`--glass-header-bg`, `--glass-nav-bg`, `--glass-card-bg`, `--glass-sheet-bg`), opacity tiers, touch target tokens | Pending (Phase A) |
| WS-A.4 | Viewport meta tag in `src/app/layout.tsx` with `viewport-fit=cover`, safe area CSS custom properties | Pending (Phase A) |
| WS-B.1 | `MobileThreatBanner` (`src/components/mobile/MobileThreatBanner.tsx`), `MobilePriorityStrip` (`src/components/mobile/MobilePriorityStrip.tsx`), `MobileThreatIndicator` (`src/components/mobile/MobileThreatIndicator.tsx`), `derivePosture` (`src/lib/threat-utils.ts`) | Pending (Phase B) |
| WS-B.2 | `MobileCategoryGrid` (`src/components/mobile/MobileCategoryGrid.tsx`), `MobileCategoryCard` (`src/components/mobile/MobileCategoryCard.tsx`) | Pending (Phase B) |
| WS-B.3 | `ThreatPulseBackground` (`src/components/mobile/ThreatPulseBackground.tsx`), `ConnectivityDot`, `DataStaleBanner`, `useDataFreshness` hook | Pending (Phase B) |
| WS-C.1 + C.2 | `MobileBottomSheet` (`src/components/mobile/MobileBottomSheet.tsx`) with focus trap, `aria-modal`, focus-return-on-dismiss, `useSheetHistory`, fullscreen mode | Pending (Phase C) |
| WS-C.3 | `MobileMapView` (`src/components/mobile/MobileMapView.tsx`) wrapping shared `CoverageMap` (`src/components/coverage/CoverageMap.tsx`) | Pending (Phase C) |
| WS-C.4 | Map marker tap -> bottom sheet wiring, `MapPopup` (`src/components/coverage/MapPopup.tsx`, exists) | Pending (Phase C) |
| WS-C.5 | `MobileSettings` bottom sheet (`src/components/mobile/MobileSettings.tsx`) | Pending (Phase C) |
| WS-D.1 | `MobileCategoryDetail` (`src/components/mobile/MobileCategoryDetail.tsx`) | Pending (Phase D) |
| WS-D.2 | `MobileAlertDetail` (`src/components/mobile/MobileAlertDetail.tsx`), `MobileAlertCard` (`src/components/mobile/MobileAlertCard.tsx`) | Pending (Phase D) |
| WS-E.1 | `IntelTab` (`src/components/mobile/IntelTab.tsx`) with priority feed section and geographic intelligence section | Pending (Phase E) |
| WS-E.2 | `MobileSearchOverlay` (`src/components/mobile/MobileSearchOverlay.tsx`), `MobileRegionDetail` (`src/components/mobile/MobileRegionDetail.tsx`) | Pending (Phase E) |
| WS-F.1 | Landscape layout variants for all 3 tabs, landscape-aware bottom sheet snap points | Pending (Phase F) |
| Existing shared components | `ViewModeToggle` (`src/components/coverage/ViewModeToggle.tsx`, exists -- has `role="radiogroup"`, `role="radio"`, `aria-checked`), `MapPopup` (`src/components/coverage/MapPopup.tsx`, exists -- has `role="dialog"`, `aria-label`), `PriorityFeedStrip` (`src/components/coverage/PriorityFeedStrip.tsx`, exists -- has `aria-live="polite"`, `aria-expanded`), `SessionTimecode` (`src/components/ambient/session-timecode.tsx`, exists) | Exists |
| Existing CSS | `src/styles/reduced-motion.css` (comprehensive catch-all with `animation: none !important` and `transition: none !important`), `src/styles/morph.css`, `src/styles/enrichment.css`, `src/styles/constellation.css`, `src/styles/district-view.css`, `src/styles/command-palette.css`, `src/styles/login.css` (all have `@media (prefers-reduced-motion: reduce)` blocks) | Exists |
| Existing audit tool | `src/lib/audits/reduced-motion-audit.ts` (runtime CSS animation check, motion/react component check) | Exists |

---

## 4. Deliverables

### D-1: Accessibility Audit Report (`docs/audits/mobile-a11y-audit.md`)

Structured audit report documenting every finding across all seven audit domains. Each finding includes:

```markdown
| ID | Domain | Component | Severity | WCAG SC | Finding | Remediation | Status |
|----|--------|-----------|----------|---------|---------|-------------|--------|
| F-001 | Semantic | MobileCategoryCard | High | 4.1.2 | Missing `role="button"` on card div | Add `role="button"` + `tabIndex={0}` | Fixed |
| F-002 | Contrast | MobileHeader timecode | Medium | 1.4.3 | 3.2:1 ratio (7px text on glass bg) | Increase opacity from 0.4 to 0.6 | Fixed |
```

**Severity scale:**
- **Critical:** Blocks access for assistive technology users. Must fix before ship.
- **High:** Significant barrier. Must fix before ship.
- **Medium:** Usability issue. Should fix before ship, may defer with justification.
- **Low:** Enhancement. Document for future improvement.

The report includes a summary table with pass/fail counts per audit domain and an overall WCAG 2.1 AA conformance statement.

### D-2: Skip-to-Content Link (`src/components/mobile/SkipToContent.tsx`)

New component: a visually hidden link that becomes visible on keyboard focus, positioned at the top of the DOM in `MobileShell` before `MobileHeader`. Targets `#mobile-main-content` (the `.mobile-content` scrollable area).

```typescript
/**
 * SkipToContent -- keyboard-accessible skip link for mobile layout.
 *
 * Visually hidden until focused via Tab key. Allows keyboard users
 * to bypass the MobileHeader and MobileBottomNav chrome.
 *
 * @module SkipToContent
 * @see WS-F.2 AD-8
 * @see WCAG 2.4.1 (Bypass Blocks)
 */

export function SkipToContent() {
  return (
    <a
      href="#mobile-main-content"
      className="skip-to-content"
      // Inline styles for zero-dependency rendering (no CSS file import required)
      style={{
        position: 'absolute',
        top: '-100%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        padding: '8px 16px',
        background: 'var(--color-void, #050911)',
        color: 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 12,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '8px'
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100%'
      }}
    >
      Skip to content
    </a>
  )
}
```

**Integration in MobileShell:** Add `<SkipToContent />` as the first child inside `.mobile-shell`. Add `id="mobile-main-content"` and `tabIndex={-1}` to the `.mobile-content` element so it can receive programmatic focus.

### D-3: ARIA Remediation Patches

Specific modifications to mobile components based on audit findings. The following are the known remediation targets identified from the OVERVIEW checklist (A1--A16) and `information-architecture.md` Section 15. Additional patches will be added as the audit surfaces further findings.

**D-3a: Tab Panel ARIA Linkage (modify `MobileShell.tsx`)**

Ensure each tab panel wrapper has `role="tabpanel"`, `aria-labelledby` pointing to the corresponding tab button ID, and an `id` for the `aria-controls` attribute on the tab button.

```typescript
// Tab button IDs
const TAB_IDS = {
  situation: 'mobile-tab-situation',
  map: 'mobile-tab-map',
  intel: 'mobile-tab-intel',
} as const

const PANEL_IDS = {
  situation: 'mobile-panel-situation',
  map: 'mobile-panel-map',
  intel: 'mobile-panel-intel',
} as const

// In MobileBottomNav tab button rendering:
<button
  id={TAB_IDS[tab]}
  role="tab"
  aria-selected={activeTab === tab}
  aria-controls={PANEL_IDS[tab]}
  tabIndex={activeTab === tab ? 0 : -1}  // roving tabindex
  ...
>

// In MobileShell content area:
<div
  id={PANEL_IDS[activeTab]}
  role="tabpanel"
  aria-labelledby={TAB_IDS[activeTab]}
  tabIndex={-1}  // programmatically focusable for focus management
>
  {activeTab === 'situation' && situationContent}
  ...
</div>
```

**D-3b: Roving Tabindex on Tab Bar (modify `MobileBottomNav.tsx`)**

Implement roving tabindex for the `role="tablist"` container per WAI-ARIA Authoring Practices. Only the active tab has `tabIndex={0}`; inactive tabs have `tabIndex={-1}`. Arrow Left/Right moves focus between tabs. Home/End jump to first/last tab.

```typescript
function handleTabKeyDown(e: React.KeyboardEvent, tabs: MobileTab[]) {
  const currentIndex = tabs.indexOf(activeTab)
  let nextIndex = currentIndex

  switch (e.key) {
    case 'ArrowRight':
      nextIndex = (currentIndex + 1) % tabs.length
      break
    case 'ArrowLeft':
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
      break
    case 'Home':
      nextIndex = 0
      break
    case 'End':
      nextIndex = tabs.length - 1
      break
    default:
      return
  }

  e.preventDefault()
  onTabChange(tabs[nextIndex])
  // Focus moves to the newly activated tab button
  document.getElementById(TAB_IDS[tabs[nextIndex]])?.focus()
}
```

**D-3c: Category Grid Semantics (modify `MobileCategoryGrid.tsx`)**

Verify the grid uses `<ul role="list">` with `<li role="listitem">` per A3. Each `MobileCategoryCard` inside should have `role="button"` and `tabIndex={0}` if the `<li>` itself is the tap target, or contain a semantic `<button>` element.

**D-3d: Alert List Semantics (modify `MobileCategoryDetail.tsx`, `IntelTab.tsx`)**

Verify alert lists use `<ul role="list">` with `<li role="listitem">` per A4. Selected alert has `aria-current="true"`. Each `MobileAlertCard` has a semantic button or link as its primary action.

**D-3e: Severity and Priority Badge Labels (modify `MobileCategoryCard.tsx`, `MobileAlertCard.tsx`, `MobileAlertDetail.tsx`)**

Verify all severity badges include `aria-label` with the severity level as text (A8). Verify all priority badges include `aria-label` with "Critical," "High," etc. (A9). Color must not be the sole means of conveying severity.

```typescript
// Severity badge
<span
  className="severity-badge"
  style={{ background: severityColor }}
  aria-label={`Severity: ${severity}`}
>
  {severity}
</span>

// Priority badge
<PriorityBadge
  priority={priority}
  aria-label={`Priority: ${priorityLabel}`}
/>
```

**D-3f: Posture Strip Live Region (verify `MobileThreatBanner.tsx`)**

Verify the posture strip uses `role="status"` with `aria-live="polite"` for count updates and `aria-live="assertive"` for P1 count changes (A6). If ThreatBanner already implements this per WS-B.1 spec, document as passing. If not, add:

```typescript
<div role="status" aria-live="polite" aria-atomic="true">
  {activeCount} active alerts. Priority 1: {p1Count}. Priority 2: {p2Count}.
</div>

{/* Separate assertive region for P1 changes only */}
<div aria-live="assertive" className="sr-only">
  {p1Changed && `New Priority 1 alert: ${latestP1Headline}`}
</div>
```

**D-3g: Data Staleness Live Region (verify `DataStaleBanner` from WS-B.3)**

Verify the staleness banner uses `aria-live="polite"` to announce when data becomes stale and when freshness is restored.

```typescript
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className={isStale ? 'data-stale-banner' : 'sr-only'}
>
  {isStale
    ? `Data may be outdated. Last updated ${lastUpdatedAgo}.`
    : 'Data connection restored.'}
</div>
```

**D-3h: Search Overlay Semantics (verify `MobileSearchOverlay.tsx`)**

Verify search overlay per A7: `<div role="search">` wrapping `<input type="search" aria-label="Search intel alerts">`. Results rendered in `role="listbox"` with `role="option"` per item. `aria-activedescendant` tracks keyboard-selected result if arrow key navigation is supported.

**D-3i: Decorative Element Hiding**

Verify all decorative/ambient elements are hidden from assistive technology:

| Component | Expected | Attribute |
|---|---|---|
| `MobileScanLine` | Decorative | `aria-hidden="true"` |
| `ThreatPulseBackground` | Decorative | `aria-hidden="true"` |
| `EdgeGlowIndicators` (WS-F.5) | Decorative | `aria-hidden="true"` |
| `ConnectivityDot` animation ring | Decorative | `aria-hidden="true"` on animation ring only; status text accessible |
| Category card severity bar | Decorative (severity conveyed via text label) | `aria-hidden="true"` |
| Bottom sheet drag handle | Interactive (but has no text) | `aria-label="Drag to resize"` or `aria-hidden="true"` if not keyboard-operable |

### D-4: Focus Management Verification and Fixes

Test and fix all focus transitions documented in `information-architecture.md` Section 15.3. Where WS-C.2 already implements focus trap and focus restoration in `MobileBottomSheet`, this deliverable verifies correct behavior; where gaps exist, this deliverable adds the fix.

**D-4a: Tab Switch Focus (modify `MobileShell.tsx`)**

On tab switch, focus moves to the tab panel container (which has `tabIndex={-1}`). The first focusable element within the panel becomes reachable via the next Tab press.

```typescript
function handleTabChange(newTab: MobileTab) {
  // Morph guard (existing from WS-A.2)
  if (useUIStore.getState().morph.phase !== 'idle') {
    useUIStore.getState().resetMorph()
  }
  setActiveTab(newTab)

  // Focus management: move focus to new panel after render
  requestAnimationFrame(() => {
    const panel = document.getElementById(PANEL_IDS[newTab])
    panel?.focus({ preventScroll: true })
  })
}
```

**D-4b: Bottom Sheet Focus Trap Verification**

Verify WS-C.2's focus trap implementation across all sheet contexts:

| Sheet Context | Trigger | First Focus Target | Return Focus Target |
|---|---|---|---|
| Category detail | Category card tap | Sheet header (category name or close button) | The tapped category card |
| Alert detail | Alert row tap | Sheet header (alert title or close button) | The tapped alert row |
| Settings | Hamburger button tap | First toggle in settings | Hamburger button |
| Search overlay | Search icon tap | Search input | Search icon in header |
| Region detail | Region card tap | Sheet header | Region card |
| Map marker popup | Marker tap | Popup content | Map (no specific element; focus returns to map container) |

For each context: open sheet, verify focus is inside, Tab through all elements, verify focus does not leave sheet, dismiss via swipe/back/Escape, verify focus returns to trigger.

**D-4c: Focus Indicator Styling (add to `mobile-shell.css` or `mobile-tokens.css`)**

Add visible focus indicators for keyboard navigation. Must be visible on the dark `#050911` background. Do not use the browser default blue outline (insufficient contrast on dark backgrounds).

```css
/* Mobile focus indicators for keyboard navigation */
.mobile-shell *:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.6);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Specific focus styles for tab buttons */
.mobile-tab-button:focus-visible {
  outline: 2px solid var(--color-ember);
  outline-offset: -2px;
}

/* Focus style for category cards */
[data-mobile-category-card]:focus-visible {
  outline: 2px solid var(--color-ember);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(var(--ember-rgb), 0.15);
}

/* Focus style for alert cards */
[data-mobile-alert-card]:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}
```

### D-5: Color Contrast Audit and Fixes

Measure every text element against its computed background. Glass backgrounds present a unique challenge: the effective background color depends on what content is behind the blur. Use worst-case (lightest content behind glass) for conservative measurement.

**Audit methodology:**

1. For each mobile component, identify all text elements.
2. Compute the effective background color by compositing the glass layer over the worst-case content (for sheets: content behind; for header/nav: scrollable area content).
3. For glass-on-void (most common case): composite `rgba(5, 9, 17, alpha)` over `#050911` to get the effective solid background.
4. Measure contrast ratio against the text foreground color using WCAG luminance formula.
5. Flag any ratio below 4.5:1 for normal text or below 3:1 for large text (>= 18px or >= 14px bold).

**Known risk areas (from OVERVIEW R2 and contrast tier specification):**

| Element | Text Color | Background | Expected Ratio | Risk |
|---|---|---|---|---|
| Primary text on void | `rgba(255,255,255,0.70)`--`0.90` | `#050911` | 10.8:1--13.9:1 | Low |
| Secondary text on void | `rgba(255,255,255,0.45)`--`0.55` | `#050911` | 6.4:1--8.0:1 | Low |
| Ambient text on void | `rgba(255,255,255,0.30)`--`0.40` | `#050911` | 4.2:1--5.6:1 | Medium -- 0.30 opacity may fail 4.5:1 |
| Ambient text (10px, per R11) | `rgba(255,255,255,0.30)` | `#050911` | 4.2:1 | High -- fails AA for normal text. Must be classified as decorative or increased to 0.35 |
| Text on glass header (0.85 alpha) | `rgba(255,255,255,0.70)` | `rgba(5,9,17,0.85)` over variable | Depends on content behind | Medium |
| Text on glass card (0.04 white overlay) | `rgba(255,255,255,0.45)` | `rgba(255,255,255,0.04)` over `#050911` | ~6.3:1 | Low |
| SessionTimecode in header (7--9px) | `rgba(255,255,255,0.4)` | Glass header bg | ~5.3:1 | Medium -- small text at 0.4 opacity on glass |
| Severity badge text | White on colored bg | `rgba(239,68,68,0.7)` etc. | Varies by severity | Medium -- red/orange may fail |

**D-5a: Contrast Fix File (`src/styles/mobile-a11y-overrides.css`)**

A dedicated CSS file for contrast corrections discovered during audit. Loaded after `mobile-tokens.css`. Corrections override token values only where needed.

```css
/* WS-F.2 Accessibility Contrast Fixes
   Overrides where default token opacity values fail WCAG 2.1 AA (4.5:1).
   Loaded after mobile-tokens.css. */

/* Ambient text floor: 0.30 fails 4.5:1 on #050911 (measured 4.2:1).
   Increase to 0.35 for minimum 4.8:1 ratio. */
.mobile-shell {
  --color-text-ambient-a11y: rgba(255, 255, 255, 0.35);
}

/* Additional overrides added per audit findings */
```

### D-6: Touch Target Audit and Fixes

Measure all interactive elements using Chrome DevTools computed styles. For each element, record `width`, `height`, `min-width`, `min-height`, and effective tap area (including padding).

**Audit checklist per `information-architecture.md` Section 15.2:**

| Element | Required Minimum | Measurement Method |
|---|---|---|
| `MobileBottomNav` tab buttons | 44 x 49px | DevTools computed box model |
| `MobileCategoryCard` | 165 x 80px | DevTools computed box model |
| `MobileAlertCard` rows | full-width x 56px | DevTools computed box model |
| `MobileFilterChips` pills | 64 x 40px (spacing provides effective 44px) | DevTools computed box model + gap measurement |
| Map marker hit areas | 44 x 44px | MapLibre marker click tolerance configuration |
| Back/close buttons | 44 x 44px | DevTools computed box model |
| Search icon (header) | 44 x 44px | DevTools computed box model (verify `min-width: 48px` per WS-A.2 D-3) |
| Hamburger button | 44 x 44px | DevTools computed box model |
| Bottom sheet drag handle | full-width x 44px | DevTools computed box model |
| `ViewModeToggle` segments | 44 x 36px (check) | DevTools computed box model |
| `TimeRangeSelector` presets | 44 x 32px (check) | DevTools computed box model |
| Settings toggles | 44 x 44px | DevTools computed box model |
| Expand-to-fullscreen button | 44 x 44px | DevTools computed box model |
| Sort/filter pills in category detail | 44 x 36px (check) | DevTools computed box model |

Any element measuring below 44px in either dimension must be fixed by increasing `min-width` / `min-height` or adding padding.

### D-7: Reduced Motion Mobile CSS Extension (`src/styles/mobile-reduced-motion.css`)

Extend the existing reduced motion system to cover mobile-specific components. The existing `src/styles/reduced-motion.css` provides a global catch-all (`*:not(.reduced-motion-exempt) { animation-duration: 0.001ms !important; }`), but explicit rules are needed for mobile components that use `motion/react` JavaScript animations (which CSS catch-alls do not cover).

```css
/* WS-F.2: Mobile-specific reduced motion overrides.
   Supplements src/styles/reduced-motion.css for mobile components.
   Loaded after mobile-shell.css within the mobile code-split chunk. */

@media (prefers-reduced-motion: reduce) {
  /* --- Mobile bottom sheet: instant appear/dismiss --- */
  .mobile-bottom-sheet,
  .mobile-bottom-sheet-backdrop {
    transition: none !important;
    animation: none !important;
  }

  /* --- Category card tap feedback: no scale transform --- */
  [data-mobile-category-card] {
    transform: none !important;
    transition: opacity var(--duration-fast) !important;
  }

  /* --- Threat pulse background: static or hidden --- */
  .threat-pulse-background {
    animation: none !important;
    /* Keep the static gradient for posture color, just stop animation */
  }

  /* --- Mobile scan line: disabled --- */
  .mobile-scan-line {
    animation: none !important;
    opacity: 0 !important;
  }

  /* --- P1 pulse badge: static --- */
  .mobile-p1-pulse {
    animation: none !important;
  }

  /* --- Connectivity dot pulse: static --- */
  .connectivity-dot-pulse {
    animation: none !important;
  }

  /* --- Edge glow indicators: disabled --- */
  .edge-glow-indicator {
    animation: none !important;
    opacity: 0 !important;
  }

  /* --- Tab switch: no transition --- */
  .mobile-content {
    transition: none !important;
  }

  /* --- Pull-to-refresh scan line: use spinner fallback --- */
  .pull-to-refresh-scanline {
    animation: none !important;
  }
}
```

**Additionally:** Verify that all `motion/react` animated components in the mobile tree respect `useReducedMotion()`. Where `motion/react`'s `<motion.div>` is used, the `reducedMotion="user"` prop should be applied at the `<MotionConfig>` provider level, or individual components should check `useReducedMotion()` and skip animation.

**Extend reduced-motion-audit.ts:** Add mobile-specific animated class selectors to `ANIMATED_CLASSES` and mobile-specific `data-*` selectors to `MOTION_COMPONENTS` arrays in `src/lib/audits/reduced-motion-audit.ts`.

### D-8: Keyboard Navigation Additions (modify multiple components)

Where the audit reveals missing keyboard support for Bluetooth keyboard users:

**D-8a: Category Card Keyboard Activation (modify `MobileCategoryCard.tsx`)**

Ensure category cards respond to Enter and Space key presses (not just tap/click). If the card is a `<div>` with an `onClick`, add `onKeyDown` handler + `role="button"` + `tabIndex={0}`:

```typescript
<li role="listitem">
  <div
    role="button"
    tabIndex={0}
    aria-label={`${category.label}: ${category.alertCount} alerts, ${category.sourceCount} sources`}
    data-mobile-category-card
    onClick={() => onTap(category.id)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onTap(category.id)
      }
    }}
  >
    {/* card contents */}
  </div>
</li>
```

**D-8b: Alert Card Keyboard Activation (modify `MobileAlertCard.tsx`)**

Same pattern as category cards: `role="button"` + `tabIndex={0}` + `onKeyDown` for Enter/Space.

**D-8c: Filter Chip Keyboard Support (modify `MobileFilterChips.tsx`)**

Filter chips should be operable via Enter/Space (toggle) and arrow keys (navigate between chips).

**D-8d: Bottom Sheet Escape Dismissal (verify `MobileBottomSheet.tsx`)**

Verify Escape key dismisses the bottom sheet (WS-C.2 should already implement this). If missing, add:

```typescript
useEffect(() => {
  if (!isOpen) return
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onDismiss()
    }
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [isOpen, onDismiss])
```

### D-9: Automated Accessibility Test Suite (`src/components/mobile/__tests__/a11y.test.tsx`)

Automated tests using `jest-axe` (or `vitest-axe`) to catch regressions. One test file that renders each major mobile component and runs axe-core against it.

```typescript
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'vitest-axe'

expect.extend(toHaveNoViolations)

describe('Mobile Accessibility', () => {
  it('MobileShell has no axe violations', async () => {
    const { container } = render(<MobileShell />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('MobileBottomNav has no axe violations', async () => {
    const { container } = render(
      <MobileBottomNav activeTab="situation" onTabChange={vi.fn()} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('MobileCategoryGrid has no axe violations', async () => {
    const { container } = render(
      <MobileCategoryGrid items={mockItems} onCardTap={vi.fn()} />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  // ... additional component tests per audit domain
})
```

**Test coverage targets:**

| Component | axe Test | Focus Test | Keyboard Test |
|---|---|---|---|
| MobileShell | Yes | Tab switch focus | Skip link |
| MobileBottomNav | Yes | Roving tabindex | Arrow keys, Home/End |
| MobileCategoryGrid | Yes | -- | Enter/Space on cards |
| MobileCategoryCard | Yes | -- | Enter/Space activation |
| MobileAlertCard | Yes | -- | Enter/Space activation |
| MobileBottomSheet (all contexts) | Yes | Focus trap | Escape dismissal |
| MobileThreatBanner | Yes | -- | aria-live announcement |
| MobileSearchOverlay | Yes | Auto-focus input | Escape dismissal |
| IntelTab | Yes | -- | -- |
| ViewModeToggle (mobile context) | Yes | -- | Arrow keys |

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|---|---|---|
| AC-1 | All mobile components pass axe-core automated scan with zero violations at WCAG 2.1 AA level. | Run `pnpm test:unit` -- D-9 test suite passes. |
| AC-2 | Tab bar uses `role="tablist"` with `role="tab"` buttons, `aria-selected` on active tab, `aria-controls` linking to panel, and `aria-labelledby` on panel (A1, A2). | Manual DOM inspection in Chrome DevTools. |
| AC-3 | Roving tabindex on tab bar: only active tab has `tabIndex={0}`, Arrow Left/Right moves between tabs, Home/End jump to first/last (A1). | Keyboard test: connect Bluetooth keyboard, navigate tab bar. |
| AC-4 | Tab switch moves focus to the new tab panel container (A10). | Keyboard test: press Arrow Right in tab bar, verify `document.activeElement` is the new panel. |
| AC-5 | Category grid uses `<ul role="list">` with `<li role="listitem">` (A3). | Manual DOM inspection. |
| AC-6 | Alert lists use `<ul role="list">` with `role="listitem"` per alert, `aria-current="true"` on selected (A4). | Manual DOM inspection. |
| AC-7 | Bottom sheets render `role="dialog"` + `aria-modal="true"` + `aria-label="{context}"` (A5). Tested across: category detail, alert detail, settings, region detail. | Manual DOM inspection for each sheet type. |
| AC-8 | Focus is trapped inside bottom sheet when open: Tab does not leave sheet; Shift+Tab wraps to last element (A11). | Keyboard test with Bluetooth keyboard. |
| AC-9 | Focus returns to triggering element when bottom sheet is dismissed via swipe, back button, or Escape (A12). | Keyboard test: open sheet, dismiss, verify `document.activeElement` matches trigger. |
| AC-10 | Posture strip uses `role="status"` + `aria-live="polite"` for count updates. P1 changes announced via `aria-live="assertive"` (A6). | VoiceOver (iOS) test: verify count change announcement. DOM inspection for `aria-live` attribute. |
| AC-11 | Search overlay uses `role="search"` + `<input type="search" aria-label>` + results in `role="listbox"` with `role="option"` (A7). Focus moves to search input on open (Section 15.3). | Manual DOM inspection + keyboard test. |
| AC-12 | All severity badges have `aria-label` including severity level text (A8). | DOM inspection: every `.severity-badge` has `aria-label`. |
| AC-13 | All priority badges have `aria-label` including "Critical," "High," etc. (A9). | DOM inspection: every `PriorityBadge` has `aria-label`. |
| AC-14 | All interactive elements measure >= 44x44px touch target (A14). Zero elements below 44px minimum after fixes. | DevTools computed styles audit. D-6 audit report shows 100% pass. |
| AC-15 | Viewport meta does not contain `user-scalable=no` or `maximum-scale` < 5 (A15, Q8). | Inspect `<meta name="viewport">` in page source. |
| AC-16 | All text elements meet WCAG 2.1 AA contrast ratio (4.5:1 normal text, 3:1 large text) against their computed background (A16). | D-5 audit report shows 100% pass for non-ambient text. Ambient text at 0.30 opacity either meets threshold or is classified as decorative with `aria-hidden`. |
| AC-17 | `prefers-reduced-motion: reduce` disables all animations and transitions in the mobile tree (A13). P1 pulse static, tab switch instant, bottom sheet instant, card tap no scale, scan line hidden, threat pulse static. | Enable `prefers-reduced-motion: reduce` in Chrome DevTools Rendering panel. Manually verify each component. Run extended `reduced-motion-audit.ts`. |
| AC-18 | All `motion/react` animated components in the mobile tree either use `<MotionConfig reducedMotion="user">` or individually check `useReducedMotion()` (A13). | Code review: grep for `motion.div` / `motion.` in `src/components/mobile/` and verify reduced motion handling. |
| AC-19 | Skip-to-content link is the first focusable element in `MobileShell`. It is visually hidden until focused. Activating it moves focus to the main content area. | Keyboard test: load page, press Tab, verify skip link appears, press Enter, verify focus moves to `#mobile-main-content`. |
| AC-20 | VoiceOver (iOS Safari) can navigate the complete mobile UI: read threat posture, browse category grid, open category detail sheet, read alert list, dismiss sheet, switch tabs. | Manual VoiceOver walkthrough on iPhone. |
| AC-21 | TalkBack (Android Chrome) can navigate the complete mobile UI: same workflow as AC-20. | Manual TalkBack walkthrough on Android device. |
| AC-22 | DataStaleBanner uses `aria-live="polite"` and announces staleness state changes to screen readers. | VoiceOver test: disconnect API, verify staleness announcement. DOM inspection. |
| AC-23 | All decorative elements (`MobileScanLine`, `ThreatPulseBackground`, `EdgeGlowIndicators`, animation rings) have `aria-hidden="true"`. | DOM inspection + code review. |
| AC-24 | Keyboard focus indicators are visible on all interactive elements against the dark `#050911` background. No invisible focus states. | Keyboard test: Tab through all elements, verify visible outline on each. |
| AC-25 | Mobile layout functions correctly at 200% browser zoom without content truncation, overlap, or loss of functionality (WCAG 1.4.4 Resize Text). | Chrome DevTools: set zoom to 200%, navigate all tabs and sheets. |
| AC-26 | `pnpm typecheck` passes with zero errors after all modifications. | Run `pnpm typecheck` from project root. |
| AC-27 | Audit report (D-1) is complete with findings for all 7 audit domains, severity classifications, and remediation status for every finding. | Review `docs/audits/mobile-a11y-audit.md`. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|---|---|---|---|
| DM-1 | Use `jest-axe` (or `vitest-axe`) for automated accessibility testing rather than Lighthouse CI accessibility score. | `jest-axe` runs axe-core against rendered component DOM, catching ARIA issues at the component level. Lighthouse accessibility runs against full pages and is better suited for E2E (WS-F.3 scope). Both are complementary; this WS owns component-level. | (a) Lighthouse only. Rejected: too coarse for component-level ARIA verification. (b) Pa11y. Rejected: page-level tool, not component-level. |
| DM-2 | Skip-to-content link uses inline styles with `onFocus`/`onBlur` JS rather than a CSS `:focus-visible` approach. | Eliminates dependency on a CSS file import. The skip link is a single element with predictable behavior. Inline styles ensure it works regardless of CSS load order. | (a) CSS class `.skip-to-content:focus-visible { top: 8px }`. Valid but requires CSS import in mobile chunk. Acceptable alternative if inline styles are rejected during review. |
| DM-3 | Focus indicators use `outline` with `outline-offset` rather than `box-shadow` for focus rings. | `outline` does not affect layout (no reflow), follows `border-radius`, and is the standard CSS focus indicator. `box-shadow` can be clipped by `overflow: hidden` containers (common in sheets and cards). | (a) `box-shadow` focus ring. Rejected: clipped by overflow containers. (b) `border` change on focus. Rejected: causes layout shift. |
| DM-4 | Roving tabindex pattern for tab bar rather than `tabIndex={0}` on all tabs. | WAI-ARIA Authoring Practices recommend roving tabindex for `role="tablist"`. Only the active tab is in the tab order; arrow keys navigate between tabs. This reduces Tab key presses needed to reach content. | (a) All tabs `tabIndex={0}`. Simpler but violates ARIA Authoring Practices and forces extra Tab stops. |
| DM-5 | Ambient text at 0.30 opacity that fails 4.5:1 contrast is resolved by either increasing to 0.35 or marking as decorative (`aria-hidden="true"`), determined per-element during audit. | Some ambient text (e.g., SessionTimecode frame counter) is genuinely decorative and carries no informational value. Other ambient text (e.g., data timestamps) is informational and must meet contrast. The decision is per-element, not blanket. | (a) Increase all ambient text to 0.35. Rejected: alters the Oblivion aesthetic unnecessarily for decorative elements. (b) Mark all ambient text as decorative. Rejected: some ambient text carries operational information. |
| DM-6 | Create a separate `mobile-a11y-overrides.css` file for contrast fixes rather than modifying `mobile-tokens.css` directly. | Token values in `mobile-tokens.css` represent design intent. Accessibility overrides are engineering corrections applied on top. Separation makes it clear which values are design-specified and which are a11y-adjusted. Allows the design team to update tokens without losing a11y corrections. | (a) Modify token values directly in `mobile-tokens.css`. Rejected: blurs design intent vs. a11y correction; harder to audit. |
| DM-7 | Manual screen reader testing on real devices (VoiceOver on iPhone, TalkBack on Android) rather than desktop screen reader emulation only. | iOS Safari + VoiceOver and Chrome Android + TalkBack have different behaviors for `aria-live`, focus management, and touch semantics than desktop NVDA/JAWS. Since this is a mobile-specific audit, testing on mobile screen readers is essential. Desktop screen reader testing (NVDA on Chrome) is supplementary. | (a) Desktop screen reader only. Rejected: misses mobile-specific a11y behaviors. |
| DM-8 | `aria-live="assertive"` used only for P1 count changes, not all threat banner updates. All other real-time data updates use `aria-live="polite"`. | `assertive` interrupts the current screen reader announcement. This is appropriate for critical P1 alerts (life-safety relevance) but disruptive for routine count updates. Staleness indicators, posture level changes (non-P1), and data refresh notifications use `polite`. | (a) All updates `assertive`. Rejected: creates announcement fatigue, disrupts user's current task. (b) All updates `polite`. Rejected: P1 alerts are time-critical and warrant interruption. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|---|---|---|---|
| OQ-1 | Should the bottom sheet drag handle be keyboard-operable (e.g., arrow Up/Down to resize between snap points), or should it be `aria-hidden` with resize controlled only via explicit buttons (expand/collapse)? The drag handle is a touch affordance; keyboard users may prefer explicit buttons. | react-developer + ux-designer | WS-F.2 implementation (resolve before D-4b) |
| OQ-2 | The `ViewModeToggle` segments (Triaged / All Bundles / Raw) currently measure approximately 36px tall on mobile. Should these be increased to 44px (adding 8px to the controls bar height), or is the existing size acceptable because the segment labels provide adequate horizontal touch area? The total element width likely exceeds 44px. | ux-designer | WS-F.2 implementation (resolve during D-6) |
| OQ-3 | Should the accessibility audit cover the shared components (`ViewModeToggle`, `MapPopup`, `PriorityFeedStrip`, `CoverageMap`) when rendered in mobile context, or are these out of scope because they are shared with desktop? Current scope includes them because mobile users interact with them. | planning-coordinator | WS-F.2 scoping (resolve before audit begins) |
| OQ-4 | The `MobileSearchOverlay` search results should support arrow key navigation (Up/Down to move between results, Enter to select). Should this use `aria-activedescendant` pattern or actual focus movement between `role="option"` elements? | react-developer | WS-F.2 implementation (resolve during D-8) |
| OQ-5 | Are `jest-axe` / `vitest-axe` already in the project dependencies, or do they need to be added? If added, this should be coordinated with WS-F.3 (Performance + PWA) to avoid duplicate test infrastructure decisions. | react-developer | WS-F.2 implementation (resolve during D-9 setup) |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-1 | Glass background contrast measurements are variable because `backdrop-filter: blur` composites against whatever content is behind the glass layer. A single static measurement may not capture worst-case contrast. | High | Medium | Measure against both worst-case (lightest likely content behind glass) and best-case (void background). Use worst-case for compliance determination. For the header and bottom nav (glass over scrollable content), test with content scrolled to show light elements (e.g., white map markers, category card glow). |
| R-2 | Increasing text opacity for contrast compliance alters the carefully calibrated Oblivion aesthetic. Design team may push back on opacity increases. | Medium | Medium | Use the minimum opacity increase needed to reach 4.5:1. Document the exact delta (e.g., 0.30 -> 0.35 is a 0.05 increase). Present as non-negotiable WCAG requirement. Offer alternative: reclassify as decorative where appropriate (DM-5). |
| R-3 | Focus trap in `MobileBottomSheet` (WS-C.2) may have edge cases where focus escapes -- particularly when sheets contain dynamically loaded content (e.g., category detail alert list that loads asynchronously). | Medium | High | Test focus trap with async content: open sheet, wait for data load, verify new focusable elements are inside trap boundary. If `MobileBottomSheet` uses a DOM-based focus trap (watches for focusable elements), new elements should be captured automatically. If using a ref-list approach, the list must update. |
| R-4 | VoiceOver and TalkBack behave differently from desktop screen readers for `aria-live` regions, `role="dialog"` announcement, and focus management. Fixes for one platform may break another. | Medium | Medium | Test on both platforms for every remediation. Where behavior differs, use the most broadly compatible ARIA pattern. Document platform-specific quirks in the audit report for future reference. |
| R-5 | The audit may surface a high volume of findings (50+), making the M size estimate insufficient. | Medium | Low | Triage by severity. Fix Critical and High before ship. Medium findings fixed if time permits. Low findings documented in audit report for post-launch iteration. If finding count exceeds 60, escalate size estimate to L. |
| R-6 | Adding `jest-axe` to the test suite may require dependency additions (`jest-axe`, `@testing-library/jest-dom`) and Vitest configuration updates. This could conflict with WS-F.3's test infrastructure decisions. | Low | Low | Coordinate with WS-F.3 author before adding dependencies. Use `vitest-axe` if the project uses Vitest (which it does per CLAUDE.md: `pnpm test:unit` runs Vitest). |
| R-7 | The `reduced-motion.css` global catch-all (`*:not(.reduced-motion-exempt) { animation-duration: 0.001ms !important; }`) may interfere with `motion/react` JavaScript animations in unexpected ways. `motion/react` uses the Web Animations API in some cases, which is not affected by CSS `animation-duration`. | Medium | Medium | Verify both CSS and JS animation paths. For `motion/react`, rely on `useReducedMotion()` / `<MotionConfig reducedMotion="user">` rather than CSS overrides. The CSS catch-all remains as a safety net for CSS-only animations. |
| R-8 | The skip-to-content link may be invisible to touch-only users (it only appears on keyboard focus). Touch-only users do not benefit from it. | Low | Low | This is expected behavior. Skip links are a keyboard accessibility pattern (WCAG 2.4.1 Bypass Blocks). Touch users bypass headers naturally via scrolling. No action needed. |
