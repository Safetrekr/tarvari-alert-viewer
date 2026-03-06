# WS-4.5: Entry Point in Stats/HUD

> **Workstream ID:** WS-4.5
> **Phase:** 4 -- Geographic Intelligence
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.1 (simplified CoverageOverviewStats), WS-4.6 (coverage store `openGeoSummary` action)
> **Blocks:** None
> **Resolves:** AD-3 entry point requirement, AD-9 reclaimed vertical space usage

## 1. Objective

Add a "THREAT PICTURE" entry point button to the `CoverageOverviewStats` panel that opens the `GeoSummaryPanel` (WS-4.3) at the World geo level with a single click. After WS-0.1 removed the redundant "Sources" and "Active" stat rows, the stats column has vertical space for a new element. This workstream fills that space with the primary entry point for geographic intelligence summaries -- the surface that the protective agent framework identifies as the second highest-value addition to the viewer (combined-recommendations.md Tier 1, Item 2). A secondary entry point is also registered in the CommandPalette navigation group, making the threat picture accessible via keyboard shortcut (Cmd+K then search "threat picture").

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| CoverageOverviewStats button | Add a "THREAT PICTURE" button row below the existing stat rows in `CoverageOverviewStats.tsx`. The button calls `openGeoSummary()` from the coverage store (WS-4.6) with no arguments (defaults to World level). |
| Visual design | The button uses the same glass-morphism row styling as the existing "All" filter button but with distinct visual treatment: a `Globe` icon, "THREAT PICTURE" label, and a subtle right-arrow affordance instead of a count value. |
| CommandPalette entry | Add a "Threat Picture" command to the Navigation group in `CommandPalette.tsx`. Action: calls `openGeoSummary()`. Searchable via existing synonym ring with terms "threat picture", "geo summary", "geographic intelligence", "briefing". |
| Props extension | Add an `onOpenThreatPicture` callback prop to `CoverageOverviewStatsProps` for the button click handler. The page component passes a handler that calls `openGeoSummary()`. |
| Accessibility | Button has `aria-label="Open threat picture briefing"`. Keyboard accessible (focusable, activatable via Enter/Space). |

### Out of Scope

| Area | Rationale |
|------|-----------|
| GeoSummaryPanel component | Delivered by WS-4.3. This workstream only provides the entry point that opens it. |
| Coverage store `openGeoSummary` action | Delivered by WS-4.6. This workstream calls the action. |
| useThreatPicture hook | Delivered by WS-4.1. The entry point does not fetch or display threat picture data itself -- it only triggers the panel open. |
| Removing or rearranging existing stat rows | WS-0.1 handles removal. This workstream adds to the post-WS-0.1 layout. |
| NavigationHUD permanent button | The combined-recommendations.md suggests "CoverageOverviewStats or NavigationHUD" as placement options. The stats column is the primary placement because: (a) it is spatially adjacent to the map and grid, (b) it is zoom-gated to Z1+ which matches the GeoSummaryPanel's intended context, (c) NavigationHUD is already crowded with logo, breadcrumb, minimap, and logout. The CommandPalette entry provides keyboard access from any zoom level. |
| Trend indicator integration | WS-4.4 adds trend arrows to CategoryCard. The entry point button has no trend data dependency. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.1 simplified `CoverageOverviewStats` | Component reduced to 3 rows (All button, Total Alerts, Categories). Vertical space available below Categories row. | Pending (WS-0.1 not yet implemented) |
| WS-4.6 `openGeoSummary()` store action | `useCoverageStore.getState().openGeoSummary(level?, key?)` -- sets `geoSummaryOpen: true`, `summaryGeoLevel: 'world'`, `summaryGeoKey: 'world'`. | Pending (WS-4.6 not yet implemented) |
| WS-4.3 `GeoSummaryPanel` component | The panel that opens in response to the entry point click. This workstream does not import or reference the panel directly -- it only triggers the store state that the panel reads. | Pending (WS-4.3 not yet implemented) |
| `src/components/coverage/CoverageOverviewStats.tsx` | Current component file (post-WS-0.1: 3 rows, props: `categoriesCovered`, `totalAlerts`, `isLoading`, `isAllSelected`, `onClearFilter`). | Available (pre-WS-0.1 version with 5 rows) |
| `src/components/spatial/CommandPalette.tsx` | Command palette with Navigation, View, and Action groups. Commands defined as an array of structured items. | Available |
| `src/app/(launch)/page.tsx` | Page component that renders `<CoverageOverviewStats>` with props. | Available |
| `src/stores/coverage.store.ts` | Store where `openGeoSummary` action will be added by WS-4.6. | Available (current version without geo summary state) |

## 4. Deliverables

### 4.1 Modify `src/components/coverage/CoverageOverviewStats.tsx`

**Add to imports:**
- `Globe` from `lucide-react` -- icon for the THREAT PICTURE button
- `ChevronRight` from `lucide-react` -- subtle right-arrow affordance indicating "opens a panel"

**Extend `CoverageOverviewStatsProps` interface:**
```typescript
/** Callback to open the geographic threat picture briefing panel. */
onOpenThreatPicture?: () => void
```

The prop is optional (`?`) so existing consumers that don't yet provide it are unaffected. The button renders regardless but is inert (no-op on click) when the callback is undefined. This allows WS-4.5 to be implemented before WS-4.6 completes, with the button visible but non-functional until the store action is wired.

**Add button to component JSX (after the last StatRow):**

The THREAT PICTURE button is a new row appended below the "Categories" StatRow. It is visually distinct from the stat rows (it is an action, not a metric) but uses the same container dimensions and glass styling for visual cohesion.

Layout of the button row:
```
[Globe icon]  THREAT PICTURE  [ChevronRight]
```

The button is a `<button>` element (not a `<div>` -- it is an interactive action) with the following visual treatment:

- **Container:** Same `rounded-xl border px-4 py-3 backdrop-blur-[12px] backdrop-saturate-[120%]` as StatRow.
- **Background:** `rgba(var(--ambient-ink-rgb), 0.05)` at rest, transitioning to `rgba(var(--ambient-ink-rgb), 0.10)` on hover.
- **Border:** `rgba(var(--ambient-ink-rgb), 0.10)` at rest.
- **Border-left accent:** 3px solid, using `var(--color-amber-dim, rgba(255, 179, 71, 0.3))` -- amber tint to visually associate with the "threat/warning" domain without being as prominent as the severity color system. This differentiates it from the "All" button's teal accent and the StatRows' default border.
- **Globe icon:** 16px, `color: rgba(255, 179, 71, 0.4)` -- muted amber, matching the left border accent.
- **Label text:** "THREAT PICTURE" in the same monospace uppercase style as StatRow labels (`font-mono text-[11px] tracking-wider uppercase whitespace-nowrap`), at `color: rgba(255, 255, 255, 0.3)`. On hover: `rgba(255, 255, 255, 0.5)`.
- **ChevronRight icon:** 12px, `color: rgba(255, 255, 255, 0.12)` -- very subtle, indicating "opens something" without competing with the label. On hover: `rgba(255, 255, 255, 0.25)`.
- **Cursor:** `cursor-pointer`.
- **Transition:** `transition-colors duration-150` on background, text color, and icon colors.

**Hover and interaction states:**

| State | Background | Label color | Globe color | Chevron color | Border-left |
|-------|------------|-------------|-------------|---------------|-------------|
| Rest | `rgba(ink, 0.05)` | `rgba(255,255,255, 0.3)` | `rgba(255,179,71, 0.4)` | `rgba(255,255,255, 0.12)` | `rgba(255,179,71, 0.3)` |
| Hover | `rgba(ink, 0.10)` | `rgba(255,255,255, 0.5)` | `rgba(255,179,71, 0.6)` | `rgba(255,255,255, 0.25)` | `rgba(255,179,71, 0.5)` |
| Focus-visible | `rgba(ink, 0.10)` | `rgba(255,255,255, 0.5)` | `rgba(255,179,71, 0.6)` | `rgba(255,255,255, 0.25)` | `rgba(255,179,71, 0.5)` + `outline: 1px solid rgba(255,255,255,0.15)` |
| Active/pressed | `rgba(ink, 0.14)` | `rgba(255,255,255, 0.6)` | `rgba(255,179,71, 0.7)` | `rgba(255,255,255, 0.3)` | `rgba(255,179,71, 0.6)` |
| Disabled (no callback) | `rgba(ink, 0.03)` | `rgba(255,255,255, 0.12)` | `rgba(255,179,71, 0.15)` | `rgba(255,255,255, 0.06)` | `rgba(255,179,71, 0.1)` |

Hover/focus state changes are implemented with inline style event handlers (`onMouseEnter`, `onMouseLeave`) matching the pattern used by the logout button in `page.tsx` (lines 590-597), since Tailwind v4 hover utilities and the existing glass-style inline styles coexist more cleanly this way.

**Separator between stat rows and the THREAT PICTURE button:**

A visual separator (1px horizontal line) is inserted between the "Categories" StatRow and the THREAT PICTURE button to reinforce that the button is an action, not a metric:

```tsx
<div
  className="mx-2"
  style={{
    height: 1,
    background: 'rgba(255, 255, 255, 0.04)',
  }}
/>
```

This matches the separator pattern from PriorityFeedPanel (WS-2.3 Section 4.5) and the general design system's use of `rgba(255, 255, 255, 0.04)` for subtle dividers.

**Post-WS-4.5 component structure (4 elements in the flex column):**
1. "All" filter button (existing)
2. "Total Alerts" StatRow (existing, post-WS-0.1)
3. "Categories" StatRow (existing, post-WS-0.1)
4. Separator line (new)
5. "THREAT PICTURE" action button (new)

### 4.2 Modify `src/app/(launch)/page.tsx`

**Add store read for `openGeoSummary`:**
```typescript
const openGeoSummary = useCoverageStore((s) => s.openGeoSummary)
```

This reads the `openGeoSummary` action from the coverage store (added by WS-4.6). If WS-4.6 is not yet implemented, the implementer should add a temporary no-op action to the store (see Risk R-1).

**Add handler:**
```typescript
const handleOpenThreatPicture = useCallback(() => {
  openGeoSummary()  // Defaults to World level
}, [openGeoSummary])
```

**Pass to `<CoverageOverviewStats>`:**
```tsx
<CoverageOverviewStats
  categoriesCovered={coverageMetrics?.categoriesCovered ?? 0}
  totalAlerts={coverageMetrics?.totalAlerts ?? 0}
  isLoading={isMetricsLoading}
  isAllSelected={selectedCategories.length === 0}
  onClearFilter={handleClearFilter}
  onOpenThreatPicture={handleOpenThreatPicture}
/>
```

### 4.3 Add Command to `src/components/spatial/CommandPalette.tsx`

**Add a "Threat Picture" command to the Navigation group.** The command palette uses a structured array of command items. A new entry is added to the Navigation group:

| Field | Value |
|-------|-------|
| id | `'threat-picture'` |
| label | `'Threat Picture'` |
| icon | `Globe` (from lucide-react, same as the stats button) |
| group | `'Navigation'` |
| shortcut | None (no dedicated keyboard shortcut -- accessible via Cmd+K search) |
| action | Calls `useCoverageStore.getState().openGeoSummary()` |
| synonyms | `['threat picture', 'geo summary', 'geographic intelligence', 'briefing', 'risk assessment', 'situation report', 'sitrep']` |

**Implementation note:** The CommandPalette already imports from `@/stores/coverage.store` for other navigation actions. Adding `openGeoSummary` follows the existing pattern. The synonyms array feeds into the IA synonym ring used by `getSuggestions()` for fuzzy matching.

**Placement within the Navigation group:** After "Return to Hub" and before district navigation commands. The threat picture is a top-level navigation destination, not a district-specific action.

### 4.4 Update JSDoc Comments

**`CoverageOverviewStats.tsx` header comment (lines 3-13, post-WS-0.1):**
Update the module description to reflect the new THREAT PICTURE button:

```
* CoverageOverviewStats -- filter toggle, two KPI stat rows, and
* THREAT PICTURE entry point for the coverage grid.
*
* Stacked vertically to the left of the CoverageGrid in world-space.
* The "All" button clears category filters. "Total Alerts" and
* "Categories" show live KPI metrics. "THREAT PICTURE" opens the
* GeoSummaryPanel (Phase 4) at the World level.
```

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `CoverageOverviewStats` renders a "THREAT PICTURE" button row below the "Categories" stat row, separated by a thin divider line. | Visual inspection at Z1+ zoom. DOM inspection confirms: 3 existing rows + 1 separator + 1 button = 5 child elements in the flex column. |
| AC-2 | The THREAT PICTURE button displays a `Globe` icon (left), "THREAT PICTURE" label (center), and `ChevronRight` icon (right) in a single horizontal line. | Visual inspection. DOM inspection confirms lucide SVG elements and text content. |
| AC-3 | Clicking the THREAT PICTURE button calls the `onOpenThreatPicture` callback. | Add a `console.log` or breakpoint in the handler. Confirm `openGeoSummary()` is invoked. When WS-4.3 and WS-4.6 are implemented, verify that the GeoSummaryPanel opens at World level. |
| AC-4 | The button uses an amber-tinted left border accent (`rgba(255, 179, 71, 0.3)`), visually distinct from the "All" button's teal accent. | Visual inspection. Color picker confirms amber tint on the left border. |
| AC-5 | The button has hover, focus-visible, and active states with increased opacity on all visual elements. | Hover over the button: background, text, and icon colors brighten. Tab to the button: focus outline appears. Click and hold: pressed state visible. |
| AC-6 | The button has `aria-label="Open threat picture briefing"`. | DOM inspection confirms the attribute. Screen reader announces the label. |
| AC-7 | The button is keyboard accessible: focusable via Tab, activatable via Enter and Space. | Tab to the button: receives visible focus. Press Enter: handler fires. Press Space: handler fires. |
| AC-8 | When `onOpenThreatPicture` is not provided (undefined), the button renders in a disabled visual state and clicking it has no effect. | Omit the prop in a test scenario. Button appears dimmed. Click produces no console output or store change. |
| AC-9 | The CommandPalette includes a "Threat Picture" entry in the Navigation group. | Open Cmd+K, type "threat picture". The command appears in the Navigation group with a Globe icon. |
| AC-10 | Selecting the "Threat Picture" command in the CommandPalette calls `openGeoSummary()` and closes the palette. | Select the command. Verify `openGeoSummary()` is called (console.log or store inspection). Palette closes. |
| AC-11 | The CommandPalette "Threat Picture" entry is findable via synonym search terms: "geo summary", "briefing", "sitrep". | Open Cmd+K, type each synonym. The "Threat Picture" command appears in the filtered results. |
| AC-12 | `pnpm typecheck` passes with no errors after all changes. | TypeScript compiler exits with code 0. |
| AC-13 | `pnpm build` completes without errors. | Build pipeline exits 0. |
| AC-14 | The THREAT PICTURE button does not render at Z0 zoom (it is within the existing ZoomGate around CoverageOverviewStats in page.tsx). | Zoom out to Z0. The entire stats column, including the button, is hidden. Zoom to Z1+: the button appears with the stats. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Primary placement in CoverageOverviewStats, not NavigationHUD. | The stats column is spatially adjacent to the map and grid, creating a natural reading flow: review stats, then open the full briefing. It is zoom-gated to Z1+ which matches the intended usage context (the user is engaged with the data, not zoomed out to the overview). NavigationHUD is already visually dense (logo, breadcrumb, minimap, logout button). Adding a button there would require re-evaluating the HUD layout. | (a) NavigationHUD permanent button -- rejected: HUD is crowded, viewport-fixed buttons are visible at all zoom levels (including Z0 where threat picture data has no map/grid context). (b) Floating action button (FAB) -- rejected: no precedent in the design system, foreign to the spatial mission-control aesthetic. (c) TopTelemetryBar -- rejected: the bar is a passive display surface, not an action surface. |
| D-2 | Secondary entry point via CommandPalette, not a dedicated keyboard shortcut. | The CommandPalette is the established keyboard-first navigation mechanism (Cmd+K). Adding a standalone shortcut (e.g., Ctrl+T) increases the keyboard shortcut surface area without proportional benefit -- the user already knows Cmd+K for navigation. The synonym ring makes "threat picture" discoverable via multiple search terms. | (a) Dedicated Ctrl+T shortcut -- rejected: adds another shortcut to learn, and T could conflict with future shortcuts (e.g., "Toggle" actions). (b) No keyboard access -- rejected: keyboard-only users would need to navigate to Z1+ and click the button, which is unnecessarily restrictive. |
| D-3 | Callback prop (`onOpenThreatPicture`) rather than direct store call inside the component. | CoverageOverviewStats is currently a presentational component with callback props (`onClearFilter`). Introducing a direct store call would break this pattern and make the component harder to test in isolation. The callback prop keeps the component agnostic about what "open threat picture" means -- the page component decides the implementation. | (a) Direct store call inside the button onClick -- rejected: breaks the presentational component pattern. CoverageOverviewStats does not import any store today. (b) Render prop pattern -- rejected: over-engineered for a single callback. |
| D-4 | Amber-tinted left border accent for the THREAT PICTURE button. | The existing "All" button uses teal (the primary brand accent) for its left border. Using the same color would visually merge the two buttons. Amber connotes "advisory/intelligence" in the design system's threat vocabulary (severity levels use amber for "Moderate"). The muted amber (`rgba(255, 179, 71, 0.3)`) is subdued enough to not compete with severity indicators on alert cards, while still providing a distinct visual identity. | (a) Teal accent (matching "All" button) -- rejected: makes the two buttons look like they belong to the same functional group. (b) No accent color (neutral gray) -- rejected: the button would blend into the stat rows and lose its identity as an action point. (c) Red/orange accent (matching P1/P2 threat colors) -- rejected: would incorrectly signal that the button is itself a threat indicator. |
| D-5 | Button renders in a disabled visual state when `onOpenThreatPicture` is undefined, rather than being hidden. | Hiding the button when the callback is unavailable (i.e., before WS-4.6 is implemented) would cause a layout shift when the feature becomes available. Rendering it in a disabled state maintains consistent layout from WS-0.1 onward and signals that a feature exists but is not yet connected. Once WS-4.6 and WS-4.3 are delivered, the button becomes active with no visual change needed. | (a) Hide the button entirely when no callback -- rejected: layout inconsistency between phases. (b) Always render active and no-op on click -- rejected: silent no-op is confusing. The disabled visual state communicates "this exists but is inactive." |
| D-6 | ChevronRight icon as a "opens a panel" affordance. | The existing stat rows show a numeric value in the right position. The THREAT PICTURE button has no numeric value to display. The ChevronRight communicates that clicking navigates to a new surface (the GeoSummaryPanel slide-over), differentiating it from the stat rows which are display-only. This is a standard UI convention for "navigate forward" or "open detail." | (a) No right-side element -- rejected: asymmetry with stat rows makes the button look incomplete. (b) Arrow icon (`ArrowRight`) -- rejected: ArrowRight suggests page navigation, not panel open. ChevronRight is more appropriate for progressive disclosure. (c) External link icon -- rejected: the panel is in-app, not an external navigation. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | Should the THREAT PICTURE button show a loading indicator (spinner or pulse) while WS-4.1's `useThreatPicture` hook is fetching data? The button currently has no data dependency -- it only triggers a panel open. But showing a loading state on the button could pre-communicate that data is being fetched, reducing perceived latency when the panel opens. | react-developer / UX | Phase 4 (during WS-4.3 integration, when the panel's loading state is observable) |
| Q-2 | Should the CommandPalette "Threat Picture" command be available when the GeoSummaryPanel is already open? Calling `openGeoSummary()` when the panel is open could either no-op (current location is already shown) or reset the panel to World level (useful if the user has drilled into a region). | react-developer | Phase 4 (during WS-4.6 implementation, when `openGeoSummary` behavior is defined) |
| Q-3 | WS-0.1 Q-2 asked whether WS-4.5 replaces the "Categories" stat row or adds below it. This SOW specifies adding below (preserving all 3 existing rows). Should this be revisited if the 4-row layout (plus separator) makes the stats column too tall relative to the map? | IA specialist | Phase 4 (during visual review after WS-4.5 implementation) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `openGeoSummary` action (WS-4.6) is not implemented when WS-4.5 begins, blocking the click handler in page.tsx. | Medium | Low | Add a temporary no-op action to `coverage.store.ts`: `openGeoSummary: () => set(() => {})`. The button will be clickable but produce no visible effect (no panel opens). Replace with the real WS-4.6 implementation when it lands. Alternatively, implement WS-4.5 with `onOpenThreatPicture` as undefined (button renders disabled), and wire the callback once WS-4.6 is complete. |
| R-2 | The stats column becomes too tall after adding the THREAT PICTURE button, causing visual imbalance with the map area. | Low | Low | The post-WS-0.1 column is ~150px tall (3 rows). Adding a separator (1px + 12px gap) and the button (~46px) brings it to ~210px -- close to the pre-WS-0.1 height of ~250px. The column width is fixed at 200px. Visual review during implementation will confirm acceptable proportions. If too tall, the separator can be removed (saving ~13px) or the button padding reduced. |
| R-3 | The amber left-border accent on the THREAT PICTURE button is visually indistinguishable from the severity "Moderate" color in certain display conditions (color-shifted monitors, color vision deficiency). | Low | Low | The amber accent is at 30% opacity (`rgba(255, 179, 71, 0.3)`) and is a border accent, not a fill. Severity indicators use higher-opacity fills on different elements (map markers, badges). The visual contexts are spatially separated and functionally different. No action needed unless user testing reveals confusion. |
| R-4 | CommandPalette synonym ring does not include the new synonyms, causing the "Threat Picture" command to be unfindable via alternative search terms. | Low | Low | The synonym ring is defined inline in `CommandPalette.tsx` as part of the structured command palette configuration. The synonyms for the new command are specified in Deliverable 4.3. If the synonym ring is externalized in a future refactor, ensure the new terms are migrated. |
| R-5 | The `Globe` icon from lucide-react is not visually distinguishable at 16px on dark backgrounds with muted amber coloring. | Low | Low | `Globe` renders well at 16px in the existing icon scale used by other lucide icons in the stats column (`AlertTriangle`, `Grid3x3`, `Layers`). If the amber coloring is insufficient for recognition, the icon color can be adjusted to a higher opacity or a lighter amber shade without affecting the design system's severity color channel. |
