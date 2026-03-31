# WS-F.1: Landscape Layouts

> **Workstream ID:** WS-F.1
> **Phase:** F -- Landscape + Polish
> **Assigned Agent:** `world-class-ui-designer`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.2 (MobileShell provides `data-orientation="landscape"` attribute and `isLandscape` boolean via `matchMedia`), WS-A.3 (design tokens including `--sheet-landscape-max-height: 60%`, spacing tokens, glass tokens), WS-A.4 (safe area tokens including `--safe-area-left` and `--safe-area-right` for horizontal notch insets), WS-C.1 (MobileBottomSheet core drag/snap), WS-C.2 (MobileBottomSheet advanced landscape constraint with `constrainForLandscape()` and `isLandscape` prop), WS-B.1 (threat banner), WS-B.2 (category grid, portrait 2-column), WS-C.3 (map view), WS-D.1 (category detail bottom sheet), WS-D.2 (alert detail card/sheet), WS-E.1 (Intel tab)
> **Blocks:** None (final phase)
> **Resolves:** Gap 7 (landscape detection -- layout adaptation layer; detection itself was resolved by WS-A.2)

---

## 1. Objective

Deliver CSS-driven landscape layout adaptations for all mobile components so that the TarvaRI Alert Viewer renders correctly and usably when a phone is held in landscape orientation. The OVERVIEW wireframes (Sections 4.1, 4.2, 4.3) define three distinct landscape layouts -- one per tab -- plus structural adjustments to the shell chrome (header, bottom nav) and bottom sheets.

All three tabs were built portrait-first in Phases B through E. This workstream adds `@media (orientation: landscape)` rules and `[data-orientation="landscape"]` selectors that transform those portrait layouts into the landscape variants specified in the OVERVIEW. The goal is functional, space-efficient layouts that take advantage of the wider viewport -- not a separate component tree. No new React components are created. All changes are CSS and minor prop threading.

WS-A.2 already provides the `data-orientation="landscape"` attribute on the `.mobile-shell` root and the `isLandscape` boolean. WS-C.2 already implements the bottom sheet 60% max-height constraint. This workstream builds the remaining layout adaptations that those foundations enable.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **Landscape token overrides** | New `@media (orientation: landscape)` block inside `mobile-tokens.css` defining landscape-specific spacing, layout dimension, and grid tokens. |
| **MobileShell landscape grid** | CSS grid template change on `.mobile-shell` and `.mobile-content` to support per-tab side-by-side layouts when `data-orientation="landscape"`. |
| **MobileHeader landscape adaptation** | Reduced header height from 48px to 40px in landscape. Horizontal safe area padding (`env(safe-area-inset-left)`, `env(safe-area-inset-right)`) for notched phones in landscape. |
| **MobileBottomNav landscape adaptation** | Reduced bottom nav height from 56px to 48px in landscape. Tab labels hidden (icon-only) to save vertical space. Horizontal safe area padding for notched phones. |
| **Situation tab landscape layout** | Side-by-side CSS grid: posture strip + priority strip on the left (~40%), category grid on the right (~60%). Category grid switches from 2-column to 3-column. Per OVERVIEW Section 4.1 landscape wireframe. |
| **Map tab landscape layout** | Full-bleed map with filter chips moved to a left-side vertical rail (~30% width) and controls moved to a right-side vertical rail. Per OVERVIEW Section 4.2 landscape wireframe. |
| **Intel tab landscape layout** | Two-column layout: priority alerts on the left (~45%), geographic intelligence on the right (~55%). Each column scrolls independently. Per OVERVIEW Section 4.3 landscape wireframe. |
| **Category detail landscape layout** | Two-column layout inside the bottom sheet: alert list on the left, inline map preview on the right. Per OVERVIEW Section 4.4 and combined-recommendations WS-F.1 description. |
| **Bottom sheet max-height CSS enforcement** | `@media (orientation: landscape)` rule on `.mobile-bottom-sheet` capping `max-height` at `var(--sheet-landscape-max-height, 60%)` for non-fullscreen sheets. This is the CSS complement to WS-C.2's JavaScript `constrainForLandscape()`. |
| **Content area padding adjustments** | Landscape-specific `padding-top` and `padding-bottom` on `.mobile-content` to match the reduced header/nav heights. |
| **Horizontal safe area handling** | `padding-left` and `padding-right` on shell chrome using `env(safe-area-inset-left)` and `env(safe-area-inset-right)` for notched phones (iPhone in landscape with notch on one side). |
| **Reduced motion compliance** | All landscape transition effects respect `prefers-reduced-motion: reduce`. |
| **Desktop regression** | All landscape CSS is scoped within `@media (max-width: 767px) and (orientation: landscape)` or gated by `[data-orientation="landscape"]` selectors. Desktop rendering is unchanged. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Landscape detection hook/logic | WS-A.2 already provides `isLandscape` boolean and `data-orientation` attribute via `matchMedia('(orientation: landscape)')`. |
| Bottom sheet snap point clamping (JavaScript) | WS-C.2 already implements `constrainForLandscape()` and the `isLandscape` prop that clamps snap points to 60% programmatically. This WS provides only the CSS `max-height` safety net. |
| New React components | All adaptations are CSS-only. No new `.tsx` files. Minor prop additions to existing components if needed for conditional rendering. |
| Tablet landscape | The 768px+ breakpoint renders the desktop ZUI. Tablet landscape is out of scope per OVERVIEW Section 2 (R8: `max-width: 767px`). |
| Pull-to-refresh in landscape | WS-F.5 scope. |
| Scroll-gated glassmorphism | WS-F.5 or WS-B.3 scope. Landscape does not change the glass tier system. |
| Landscape-specific ambient effects | The `MobileScanLine` (WS-A.3) and `ThreatPulseBackground` (WS-B.3) work identically in both orientations. No landscape override needed. |
| Accessibility audit of landscape layouts | WS-F.2 scope. This WS delivers layouts; F.2 audits ARIA, focus management, and contrast in both orientations. |
| Performance profiling of landscape rendering | WS-F.3 scope. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-A.2 `MobileShell` | `data-orientation="landscape"` attribute on `.mobile-shell` root element. `isLandscape` boolean exposed to child components. | Pending (Phase A) |
| WS-A.2 `mobile-shell.css` | Existing CSS file with empty `@media (orientation: landscape)` stub (line 432-436). This WS fills it in. | Pending (Phase A) |
| WS-A.3 `mobile-tokens.css` | `--sheet-landscape-max-height: 60%` token. All spacing tokens (`--space-header-height`, `--space-bottom-nav-height`, `--space-content-padding`, `--space-card-gap`). | Pending (Phase A) |
| WS-A.4 `spatial-tokens.css` | `--safe-area-left`, `--safe-area-right`, `--safe-area-top`, `--safe-area-bottom` tokens mapping to `env(safe-area-inset-*)`. | Pending (Phase A) |
| WS-B.1 threat banner components | `MobileThreatBanner`, `MobilePriorityStrip` rendered inside Situation tab. Need CSS class hooks for landscape repositioning. | Pending (Phase B) |
| WS-B.2 `MobileCategoryGrid` | Portrait 2-column grid using CSS Grid. Needs landscape 3-column override via `grid-template-columns`. CSS class: `.mobile-category-grid` (or equivalent). | Pending (Phase B) |
| WS-C.1 + WS-C.2 `MobileBottomSheet` | Bottom sheet with `isLandscape` prop, `constrainForLandscape()`, and CSS class `.mobile-bottom-sheet`. | Pending (Phase C) |
| WS-C.3 `MobileMapView` | Map view using MapLibre GL JS. MapLibre handles viewport resize automatically. Filter chips and controls have CSS class hooks for repositioning. | Pending (Phase C) |
| WS-D.1 `MobileCategoryDetail` | Category detail bottom sheet content with alert list and optional map toggle. Needs CSS class hooks for two-column landscape layout. | Pending (Phase D) |
| WS-E.1 Intel tab | Priority alerts section and geographic intelligence section with separate scroll containers. Needs CSS class hooks for two-column layout. | Pending (Phase E) |
| `src/lib/interfaces/coverage.ts` | `KNOWN_CATEGORIES` (15 categories). Landscape 3-column grid renders 5 rows of 3 cards. | Exists |

---

## 4. Deliverables

### D-1: Landscape token overrides (extend `src/styles/mobile-tokens.css`)

Add a nested `@media (orientation: landscape)` block inside the existing `@media (max-width: 767px)` block. This creates a compound query: tokens only apply to mobile viewports in landscape orientation.

```css
@media (max-width: 767px) {
  /* ... existing portrait tokens on :root ... */

  @media (orientation: landscape) {
    :root {
      /* Layout dimension overrides */
      --space-header-height: 40px;
      --space-bottom-nav-height: 48px;
      --space-content-padding: 8px;
      --space-card-gap: 8px;
      --space-section-gap: 12px;

      /* Situation tab landscape grid */
      --landscape-posture-width: 40%;
      --landscape-grid-width: 60%;
      --landscape-grid-columns: 3;

      /* Intel tab landscape columns */
      --landscape-intel-alerts-width: 45%;
      --landscape-intel-geo-width: 55%;

      /* Map tab landscape rails */
      --landscape-map-filter-rail-width: 30%;
      --landscape-map-control-rail-width: 15%;

      /* Category detail landscape split */
      --landscape-detail-list-width: 55%;
      --landscape-detail-map-width: 45%;

      /* Bottom sheet landscape cap */
      /* --sheet-landscape-max-height already defined as 60% in portrait block */

      /* Typography: tighter for reduced vertical space */
      --text-card-title: 11px;
      --text-label: 10px;
      --text-caption: 9px;

      /* Tab bar: icon-only mode */
      --landscape-tab-label-display: none;
      --landscape-tab-gap: 0px;
    }
  }
}
```

**Token count:** 18 new landscape-specific custom properties. Estimated addition: ~40 lines.

### D-2: MobileShell landscape CSS (extend `src/styles/mobile-shell.css`)

Replace the empty `@media (orientation: landscape)` stub (WS-A.2 line 432-436) with the full landscape layout rules.

```css
/* Landscape orientation adjustments */
@media (orientation: landscape) {
  .mobile-shell {
    /* Horizontal safe areas for notched phones */
    padding-left: var(--safe-area-left, 0px);
    padding-right: var(--safe-area-right, 0px);
  }

  .mobile-content {
    /* Adjusted for reduced header and nav heights */
    padding-top: var(--space-header-height, 40px);
    padding-bottom: calc(var(--space-bottom-nav-height, 48px) + var(--safe-area-bottom, 0px));
  }

  /* --- Header: reduced height, horizontal safe areas --- */
  .mobile-header {
    height: var(--space-header-height, 40px);
    padding-left: calc(12px + var(--safe-area-left, 0px));
    padding-right: calc(8px + var(--safe-area-right, 0px));
  }

  .mobile-header-logo {
    height: 10px; /* Reduced from 12px portrait */
  }

  /* --- Bottom nav: reduced height, icon-only, horizontal safe areas --- */
  .mobile-bottom-nav {
    height: calc(var(--space-bottom-nav-height, 48px) + var(--safe-area-bottom, 0px));
    padding-left: var(--safe-area-left, 0px);
    padding-right: var(--safe-area-right, 0px);
  }

  .mobile-tab-label {
    display: var(--landscape-tab-label-display, none);
  }

  .mobile-tab-button {
    gap: var(--landscape-tab-gap, 0px);
    min-height: 40px; /* Reduced from 48px; still above 44px WCAG with icon */
  }

  /* Active tab underline: repositioned for icon-only layout */
  .mobile-tab-underline {
    bottom: 0px;
  }
}
```

**Key behaviors:**

1. **Header height reduction (48px to 40px):** Landscape phone viewports are vertically constrained (typically 320-414px usable height). Reducing the header by 8px reclaims space for content. The header remains above the 36px minimum for a single line of 10px text + icon padding.

2. **Bottom nav height reduction (56px to 48px) + icon-only mode:** Tab labels are hidden via `display: none` on `.mobile-tab-label`. Icons alone provide sufficient affordance for three tabs that the user has already learned in portrait. The 48px height meets the WCAG 2.2 minimum touch target (44px) with 4px clearance. The hamburger button retains the same treatment.

3. **Horizontal safe areas:** On iPhone models with a notch, landscape orientation places the notch on the left or right side. `env(safe-area-inset-left)` and `env(safe-area-inset-right)` (via WS-A.4's `--safe-area-left` / `--safe-area-right` tokens) prevent content from rendering behind the notch.

### D-3: Situation tab landscape layout (new CSS rules)

Add to the Situation tab CSS file (established by WS-B.1 / WS-B.2, expected path: `src/styles/mobile-situation.css` or equivalent).

```css
@media (orientation: landscape) {
  /* Side-by-side: posture strip left, category grid right */
  .mobile-situation-content {
    display: grid;
    grid-template-columns: var(--landscape-posture-width, 40%) var(--landscape-grid-width, 60%);
    grid-template-rows: 1fr;
    gap: var(--space-content-padding, 8px);
    height: 100%;
    overflow: hidden;
  }

  /* Left column: posture + priority strip, scrollable */
  .mobile-situation-posture-column {
    display: flex;
    flex-direction: column;
    gap: var(--space-section-gap, 12px);
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding: var(--space-content-padding, 8px);
  }

  /* Right column: category grid, scrollable */
  .mobile-situation-grid-column {
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding: var(--space-content-padding, 8px);
  }

  /* Category grid: 3-column in landscape */
  .mobile-category-grid {
    grid-template-columns: repeat(var(--landscape-grid-columns, 3), 1fr);
  }
}
```

**Layout rationale:** The portrait Situation tab stacks posture strip, priority strip, and category grid vertically in a single scrollable column. In landscape, the limited vertical space makes stacking impractical -- the user would see only the posture strip on initial load. The side-by-side layout puts the threat summary (posture + P1/P2 counts + latest P1 alert) on the left and the category grid on the right, so both are visible simultaneously. Each column scrolls independently.

**Category grid upgrade to 3-column:** The landscape viewport provides approximately 700-850px of width. At 60% for the grid column, that yields 420-510px. Three cards at ~140-170px each fill the space efficiently. The portrait 2-column layout would leave excessive horizontal whitespace.

### D-4: Map tab landscape layout (new CSS rules)

Add to the Map tab CSS file (established by WS-C.3, expected path: `src/styles/mobile-map.css` or equivalent).

```css
@media (orientation: landscape) {
  .mobile-map-container {
    /* Full-bleed map with rails */
    display: grid;
    grid-template-columns:
      var(--landscape-map-filter-rail-width, 30%)
      1fr
      var(--landscape-map-control-rail-width, 15%);
    grid-template-rows: 1fr;
    height: 100%;
  }

  /* Filter chips: vertical rail on the left */
  .mobile-map-filter-chips {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: var(--space-content-padding, 8px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    background: var(--glass-header-bg);
    backdrop-filter: var(--glass-header-blur);
    -webkit-backdrop-filter: var(--glass-header-blur);
    border-right: 1px solid var(--color-border-subtle);
    z-index: 10;
  }

  /* Filter chip: full-width in vertical rail */
  .mobile-map-filter-chip {
    width: 100%;
    justify-content: flex-start;
  }

  /* Map: fills center area */
  .mobile-map-canvas {
    grid-column: 2;
    min-height: 0; /* Prevent grid blowout */
  }

  /* Controls: vertical rail on the right */
  .mobile-map-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: var(--space-content-padding, 8px);
    align-items: center;
    justify-content: flex-start;
    z-index: 10;
  }

  /* Hide the portrait horizontal chip bar and controls bar */
  .mobile-map-filter-bar-portrait {
    display: none;
  }

  .mobile-map-controls-bar-portrait {
    display: none;
  }
}
```

**Layout rationale:** The portrait Map tab stacks filter chips (horizontal scroll) above the map and controls below the map. In landscape, vertical space is precious. Moving filters to a left vertical rail and controls to a right vertical rail maximizes the map's visible area. MapLibre GL JS handles viewport resize automatically via its `resize` observer, so no JavaScript changes are needed for the map canvas itself.

**Note on CSS class names:** The exact class names (`.mobile-map-filter-chips`, `.mobile-map-canvas`, etc.) depend on what WS-C.3 delivers. This SOW specifies the target layout structure; the implementing engineer must align class names with the actual WS-C.3 deliverables. If WS-C.3 uses different class names, the selectors in this workstream's CSS must be updated accordingly.

### D-5: Intel tab landscape layout (new CSS rules)

Add to the Intel tab CSS file (established by WS-E.1, expected path: `src/styles/mobile-intel.css` or equivalent).

```css
@media (orientation: landscape) {
  /* Two-column: priority alerts left, geo intelligence right */
  .mobile-intel-content {
    display: grid;
    grid-template-columns:
      var(--landscape-intel-alerts-width, 45%)
      var(--landscape-intel-geo-width, 55%);
    grid-template-rows: 1fr;
    gap: 1px; /* Thin divider between columns */
    height: 100%;
    overflow: hidden;
  }

  /* Left column: priority alerts, independently scrollable */
  .mobile-intel-priority-column {
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding: var(--space-content-padding, 8px);
    border-right: 1px solid var(--color-border-subtle);
  }

  /* Right column: geographic intelligence, independently scrollable */
  .mobile-intel-geo-column {
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding: var(--space-content-padding, 8px);
  }

  /* Section headers: reduced margin in landscape */
  .mobile-intel-section-header {
    margin-bottom: 8px;
  }
}
```

**Layout rationale:** Per OVERVIEW Section 4.3 landscape wireframe, priority alerts and geographic intelligence are presented side-by-side. This mirrors a common analyst workflow: scanning the latest P1/P2 alerts on the left while reviewing regional threat summaries on the right. Independent scroll containers prevent one long list from pushing the other off-screen.

### D-6: Category detail landscape layout (new CSS rules)

Add to the category detail CSS file (established by WS-D.1, expected path: `src/styles/mobile-category-detail.css` or equivalent).

```css
@media (orientation: landscape) {
  /* Two-column inside bottom sheet: alert list + map preview */
  .mobile-category-detail-body {
    display: grid;
    grid-template-columns:
      var(--landscape-detail-list-width, 55%)
      var(--landscape-detail-map-width, 45%);
    grid-template-rows: 1fr;
    gap: 0;
    height: 100%;
    overflow: hidden;
  }

  /* Left column: header + summary + alert list */
  .mobile-category-detail-list {
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    border-right: 1px solid var(--color-border-subtle);
  }

  /* Right column: inline map preview (always visible in landscape) */
  .mobile-category-detail-map {
    display: block; /* Override portrait display:none when List toggle is active */
    min-height: 0;
  }

  /* Hide the List/Map segmented control toggle -- both are visible */
  .mobile-category-detail-view-toggle {
    display: none;
  }

  /* Summary strip: compact in landscape */
  .mobile-category-detail-summary {
    padding: 8px var(--space-content-padding, 8px);
  }
}
```

**Layout rationale:** In portrait, the category detail bottom sheet uses a List/Map segmented toggle to switch between the alert list and an inline map view (WS-D.1 Section F). In landscape, the sheet is capped at 60% viewport height but gains significant horizontal width. Showing both the alert list and map side-by-side eliminates the toggle entirely, giving the analyst simultaneous access to spatial and list views. The segmented control is hidden because both views are always visible.

**Constraint:** The bottom sheet's 60% landscape max-height means the map preview renders in a compact area (~60% of viewport height, 45% of width). MapLibre handles this gracefully -- the map simply shows a smaller geographic extent. The analyst can expand to fullscreen (WS-C.2) if they need a larger map.

### D-7: Bottom sheet landscape CSS safety net (extend `src/styles/mobile-bottom-sheet.css`)

WS-C.2 already adds a `@media (orientation: landscape)` rule for the sheet max-height (see WS-C.2 D-7 CSS). This deliverable verifies that rule exists and adds supplementary landscape adjustments.

```css
@media (orientation: landscape) {
  /* Safety net: CSS enforces max-height even if JS constraint fails */
  .mobile-bottom-sheet:not([data-sheet-state='fullscreen']) {
    max-height: var(--sheet-landscape-max-height, 60%);
  }

  /* Drag handle: reduce touch zone height in landscape */
  .mobile-sheet-drag-handle-zone {
    height: 20px; /* Reduced from 24px portrait */
  }

  /* Sheet content: tighter internal padding */
  .mobile-sheet-content {
    padding: 8px var(--space-content-padding, 8px);
  }
}
```

**Note:** If WS-C.2 has already delivered the `max-height` rule identically, this deliverable confirms alignment rather than duplicating it. The implementing engineer should verify WS-C.2's CSS and avoid redundant declarations.

### D-8: Reduced motion compliance

All orientation-change transitions (e.g., grid reflow from 2-column to 3-column, column width changes) are effectively instant via CSS Grid recalculation. No explicit animation is applied to landscape/portrait transitions. Therefore, no additional `@media (prefers-reduced-motion: reduce)` overrides are required beyond those already present in the codebase.

If future work adds animated orientation transitions (e.g., column width morphing), those must include reduced-motion guards per the project's established pattern in `enrichment.css` (line 228-245).

### D-9: Desktop regression verification

Run `pnpm build` and confirm:
- Build completes with zero errors.
- No TypeScript errors (`pnpm typecheck`).
- No lint errors (`pnpm lint`).
- Desktop rendering at 1920x1080 is visually identical before and after.
- All landscape CSS is scoped to `@media (orientation: landscape)` inside mobile-scoped selectors (either inside `@media (max-width: 767px)` or gated by `.mobile-*` class prefixes that only exist in the mobile component tree).

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | In landscape at 812x375 (iPhone 14 landscape), `MobileHeader` renders at 40px height with horizontal safe area padding visible on notched device simulators. | Chrome DevTools responsive mode: rotate to landscape. Inspect computed `height` on `.mobile-header`. Verify `padding-left` includes safe area value. |
| AC-2 | In landscape, `MobileBottomNav` renders at 48px height (plus safe area). Tab labels are hidden; only icons and the active underline are visible. | Chrome DevTools landscape mode. Inspect `.mobile-tab-label` computed `display: none`. Verify nav height. |
| AC-3 | All tab buttons and the hamburger button maintain a minimum touch target of 44px in landscape (reduced from 48px portrait, but still meets WCAG 2.2 SC 2.5.8). | Inspect computed `min-height` and `min-width` on `.mobile-tab-button` in landscape. |
| AC-4 | Situation tab in landscape renders a two-column layout: posture/priority strip on the left (~40%), category grid on the right (~60%). | Visual inspection at 812x375. Verify CSS Grid `grid-template-columns` matches `40% 60%`. |
| AC-5 | Category grid in landscape renders 3 columns instead of portrait's 2 columns. | Inspect `.mobile-category-grid` computed `grid-template-columns` in landscape: `repeat(3, 1fr)`. |
| AC-6 | Both columns on the Situation tab scroll independently. Scrolling the posture column does not affect the grid column and vice versa. | Touch-scroll each column independently. Verify `overflow-y: auto` on each column container. |
| AC-7 | Map tab in landscape renders with filter chips in a left vertical rail and controls in a right vertical rail. The map fills the center area. | Visual inspection at 812x375. Verify CSS Grid columns match the specified percentages. |
| AC-8 | MapLibre GL JS map resizes correctly when rotating from portrait to landscape and back. No blank tiles or misaligned markers. | Rotate the simulated device. Verify map re-renders without visual artifacts. |
| AC-9 | Intel tab in landscape renders a two-column layout: priority alerts on the left (~45%), geographic intelligence on the right (~55%). | Visual inspection. Verify CSS Grid columns. |
| AC-10 | Each Intel tab column scrolls independently. | Touch-scroll each column independently in landscape. |
| AC-11 | Category detail bottom sheet in landscape shows alert list and map preview side-by-side. The List/Map segmented toggle is hidden. | Open a category detail sheet in landscape. Verify both list and map are visible. Verify toggle is `display: none`. |
| AC-12 | Bottom sheets (non-fullscreen) in landscape do not exceed 60% of viewport height. | Open any bottom sheet in landscape. Inspect computed `max-height`. Measure against viewport. |
| AC-13 | Bottom sheet fullscreen mode in landscape reaches 100dvh (exempt from 60% cap). | Expand a bottom sheet to fullscreen in landscape. Measure height = viewport height. |
| AC-14 | Rotating from portrait to landscape while a bottom sheet is open at > 60% causes the sheet to animate down to 60%. | Open a sheet at 70% snap in portrait. Rotate to landscape. Verify sheet height reduces to 60%. |
| AC-15 | Horizontal safe areas prevent content from rendering behind the notch on iPhone landscape. | Use iPhone simulator with notch. Rotate to landscape. Verify header/nav content does not overlap the notch region. |
| AC-16 | `pnpm typecheck` passes with zero errors after all landscape CSS changes. | Run `pnpm typecheck` from project root. |
| AC-17 | `pnpm build` passes with zero errors. | Run `pnpm build`. |
| AC-18 | Desktop rendering at viewport >= 768px is completely unchanged. No landscape CSS leaks into desktop view. | Load main page at 1920x1080. Compare against pre-change screenshot. Zero visible differences. |
| AC-19 | Landscape token overrides apply only within `@media (max-width: 767px) and (orientation: landscape)`. At 1920x1080, landscape tokens are not active. | Inspect `:root` computed styles at 1920x1080. Verify `--space-header-height` is `48px` (portrait mobile value or desktop default), not `40px`. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | Reduce header height from 48px to 40px in landscape rather than keeping 48px or removing the header entirely. | Landscape phone viewports typically provide 320-414px of usable vertical height. The header, bottom nav, and safe areas consume a significant fraction. Reducing the header by 8px (to 40px) reclaims meaningful space while maintaining room for the logo, timecode, and search button. 40px still accommodates a single row of header elements at the mobile type scale. | (a) Keep 48px: Rejected because 48px header + 48px nav = 96px of chrome, leaving only ~224px for content on a 320px-tall landscape viewport -- barely usable. (b) Hide header entirely: Rejected because the connectivity dot, search button, and session timecode provide critical situational awareness that should remain visible. (c) Merge header into nav (single chrome bar): Rejected as too complex for Phase F scope and visually inconsistent with the portrait experience. |
| DM-2 | Hide tab labels (icon-only) in landscape bottom nav rather than shrinking font size or moving nav to a side rail. | Three tab icons (LayoutGrid, Map, Radio) are sufficiently distinct to be recognizable without labels. The user has learned the tab semantics from portrait usage. Hiding labels reduces the nav height from 56px to 48px. A side rail would consume horizontal space that is better allocated to content in the two-column layouts. | (a) Shrink labels to 7px: Rejected because 7px is below the 10px minimum readable floor (OVERVIEW R11). (b) Move nav to a vertical side rail: Rejected because it would consume ~48-56px of horizontal width, narrowing the already-constrained landscape content area. It would also require significant React changes (new component layout) rather than CSS-only adaptations. (c) Hide nav entirely and use swipe gestures: Rejected as non-discoverable and inconsistent with portrait. |
| DM-3 | Use CSS-only `@media (orientation: landscape)` rules rather than conditional React rendering based on `isLandscape`. | CSS media queries handle orientation changes instantly without React re-renders. The layout changes are purely structural (grid columns, display, overflow) and do not require different component hierarchies. CSS-only keeps the React component tree identical between orientations, simplifying state management and reducing bundle size. | (a) Conditional rendering in React: Rejected because it would cause full component unmount/remount on orientation change, losing scroll positions and triggering data refetches. (b) Separate landscape components: Rejected as violating the "no new React components" constraint and duplicating component logic. |
| DM-4 | Category detail shows list + map side-by-side in landscape, hiding the List/Map toggle. | In portrait, the toggle exists because the sheet is too narrow for side-by-side. In landscape, the 60%-capped sheet spans the full viewport width (~700-850px), which is sufficient for a two-column split. Showing both views simultaneously is strictly better than toggling between them because it eliminates a tap and lets the analyst correlate list items with map positions visually. | (a) Keep the toggle and single-view: Rejected as wasting the available horizontal space in landscape. (b) Show list + map with toggle to control which is "primary" (larger): Considered acceptable but deferred to user testing. The 55/45 split provides adequate space for both without a toggle. |
| DM-5 | Category grid switches to 3-column in landscape rather than keeping 2-column or going to 4-column. | At 60% of an ~812px landscape width, the grid column is ~487px. Three cards at ~160px each fit well with 8px gaps. Two columns would leave ~80px of empty horizontal space per card. Four columns would compress cards to ~115px, which is below the ~140px minimum that accommodates the card content (category name + alert count + source count + trend). | (a) Keep 2-column: Rejected as visually wasteful. (b) 4-column: Rejected because cards become too narrow for the label + metric content. (c) Responsive column count via `auto-fill`: Considered, but a fixed 3-column count provides more predictable alignment with the wireframe. |
| DM-6 | Scope all landscape CSS inside `@media (orientation: landscape)` within mobile-specific class selectors, rather than a compound `@media (max-width: 767px) and (orientation: landscape)` for every rule. | Mobile components are only rendered within the mobile component tree (code-split via WS-A.1). Their CSS classes (`.mobile-header`, `.mobile-category-grid`, etc.) do not exist in the desktop DOM. Therefore, `@media (orientation: landscape)` on mobile-specific selectors is equivalent to a compound media query but more readable. The landscape tokens in `mobile-tokens.css` do use the compound query because they target `:root`, which exists in both trees. | Compound media query on every rule: Rejected for verbosity. The token file uses the compound query as a safety measure since `:root` is shared. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the category grid use CSS `auto-fill` / `auto-fit` with a `minmax()` column definition instead of a fixed `repeat(3, 1fr)` in landscape? This would make the column count responsive to the exact viewport width but may produce inconsistent layouts across devices. | world-class-ui-designer | Phase F implementation |
| OQ-2 | The ui-design-system.md (Section 15.6) mentions "bottom sheet max height reduces to 80% of viewport" in landscape, while the OVERVIEW, combined-recommendations, and WS-A.3/WS-C.2 all specify 60%. The 60% value is used throughout this SOW. Should ui-design-system.md be updated for consistency? | planning-coordinator | Phase F review gate |
| OQ-3 | Should the Map tab landscape layout use the `aside` semantic HTML element for the filter and control rails, or keep them as `div` elements with ARIA roles? The accessibility implications should be reviewed by WS-F.2. | react-developer (WS-F.2) | Phase F |
| OQ-4 | When the category detail bottom sheet is in landscape two-column mode and the user taps an alert card, should the alert detail sheet open as a nested sheet (current behavior) or replace the list column content in-place? In-place replacement would preserve the map context but requires React rendering changes beyond CSS scope. | world-class-ux-designer | Phase F implementation |
| OQ-5 | The tab bar's icon-only mode in landscape removes the labels. Should a tooltip or long-press hint be added for discoverability, or is the assumption that users learn the tabs in portrait sufficient? | world-class-ux-designer | Phase F review gate |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | CSS class names in this SOW do not match the actual class names delivered by WS-B.2, WS-C.3, WS-D.1, and WS-E.1. The landscape CSS selectors would not match any DOM elements. | High | Medium | This SOW specifies semantic class name patterns (`.mobile-category-grid`, `.mobile-map-filter-chips`, `.mobile-intel-content`). During implementation, the engineer must audit the actual class names from earlier workstreams and update selectors accordingly. A pre-implementation checklist of actual class names should be created before writing CSS. |
| R-2 | The 40px landscape header height is too short for the `SessionTimecode` inline component, causing content overflow or clipping. | Medium | Low | The `SessionTimecode` inline mode (WS-A.2 D-4) uses 7px REC label and 9px timecode font sizes, totaling approximately 18px of content height. Within a 40px container with flexbox centering, there is 22px of vertical clearance. The risk is acceptable. If clipping occurs, reduce `SessionTimecode` font sizes by 1px each in landscape via a conditional prop. |
| R-3 | Independent scroll containers in the two-column layouts (Situation, Intel) cause confusion when the user attempts a full-page scroll gesture and only one column scrolls. | Medium | Medium | This is inherent to the two-column scrollable pattern and is a widely-used convention in tablet and landscape interfaces (e.g., email clients, chat applications). If user testing reveals friction, consider converting to a single scroll container with sticky headers for each column. Document the pattern clearly in the component README. |
| R-4 | `@media (orientation: landscape)` fires briefly during keyboard appearance on Android, causing a layout flash as the viewport temporarily becomes wider than tall. | Medium | Low | Android Chrome may report `orientation: landscape` when the software keyboard pushes the viewport height below the width. The layout flash would be momentary (duration of the keyboard animation). Mitigation: test on Android devices and, if problematic, add a debounce to the JavaScript `isLandscape` state in `MobileShell`. CSS media queries cannot be debounced, but the visual flash is brief enough to be acceptable for Phase F. |
| R-5 | MapLibre GL JS does not re-render correctly when the map container changes from full-width (portrait) to a center column (landscape grid). Map tiles may appear blank or offset. | Low | Medium | MapLibre's `ResizeObserver` integration handles container size changes automatically. However, if the map container transitions from `display: none` to `display: block` (which does not trigger ResizeObserver), a manual `map.resize()` call may be needed. WS-C.3 should expose a `resize()` method or use the map's built-in resize observer. If issues arise, add a `useEffect` that calls `map.resize()` when `isLandscape` changes. |
| R-6 | The 60% bottom sheet max-height in landscape leaves only ~60% of 320px = 192px for the sheet on the shortest landscape phones. The category detail two-column layout inside 192px of height may be too cramped. | Medium | Medium | On the shortest landscape viewports (320px height, e.g., iPhone SE landscape), the 60% cap yields 192px. The category detail two-column layout requires a minimum of ~150px to show the summary strip + one alert card + one map marker. This is tight but functional. If user testing reveals it is too cramped, consider increasing the landscape max-height to 70% for category detail specifically, or guiding the user toward fullscreen mode (which is exempt from the cap). |
| R-7 | Desktop landscape regression: the `@media (orientation: landscape)` rules inside mobile-specific CSS files could theoretically match desktop viewports that happen to be in landscape (e.g., a rotated monitor). | Very Low | Low | All landscape CSS targets class names that only exist in the mobile component tree (`.mobile-header`, `.mobile-category-grid`, etc.). The desktop component tree never renders these classes. The token overrides in `mobile-tokens.css` use the compound query `@media (max-width: 767px) and (orientation: landscape)` on `:root`, which excludes desktop widths entirely. No mitigation needed beyond the existing architecture. |
