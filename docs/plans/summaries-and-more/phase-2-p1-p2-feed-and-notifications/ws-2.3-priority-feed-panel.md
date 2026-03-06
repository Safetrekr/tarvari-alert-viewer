# WS-2.3: PriorityFeedPanel (Expanded View)

> **Workstream ID:** WS-2.3
> **Phase:** 2 -- P1/P2 Feed & Real-Time Notifications
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-2.1, WS-2.2, WS-2.6
> **Blocks:** None
> **Resolves:** None

## 1. Objective

Create a `PriorityFeedPanel` component at `src/components/coverage/PriorityFeedPanel.tsx` that renders a viewport-fixed, scrollable panel showing the full list of P1 and P2 priority alerts. The panel expands when the user clicks the PriorityFeedStrip (WS-2.2) and provides the primary surface for reviewing all current high-priority intelligence. Each feed item is clickable, navigating the user into the corresponding category's district view with the alert pre-selected -- reusing the established `districtPreselectedAlertId` pattern from the INSPECT flow. The panel enforces AD-1's visual channel separation: priority is communicated through the achromatic `PriorityBadge` (shape, weight, animation), while severity is communicated through color.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| New component file | Create `src/components/coverage/PriorityFeedPanel.tsx` with named export `PriorityFeedPanel`. |
| Store-driven visibility | Panel renders when `priorityFeedExpanded === true` in `coverage.store.ts` (provided by WS-2.6). Dismisses by setting `priorityFeedExpanded` to `false`. No visibility props from parent. |
| Data consumption | Reads P1/P2 feed data from `usePriorityFeed()` hook (WS-2.1). No direct API calls. |
| Panel layout | Viewport-fixed glass panel with header, optional summary counts, scrollable item list, and empty/loading states. |
| Feed item row | Each row displays: `PriorityBadge` (achromatic) + severity color indicator + title (truncated) + category short name + time-ago string. |
| Click-to-navigate | Clicking a feed item: (1) closes the panel, (2) sets `districtPreselectedAlertId` to the item's ID, (3) calls `startMorph(category)` to navigate to the district view. |
| Dismissal mechanisms | Three ways to close: (1) click the semi-transparent backdrop, (2) press Escape, (3) the panel auto-closes when the morph state machine leaves `idle` (prevents UI stacking). |
| Enter/exit animation | `motion/react` `AnimatePresence` with slide-down entry from top and slide-up exit. |
| Accessibility | `role="dialog"`, `aria-label`, keyboard-navigable item list, focus management on open/close, Escape to dismiss. |
| Loading state | Skeleton or "LOADING..." indicator while `usePriorityFeed` is fetching. |
| Empty state | "ALL CLEAR" message when the feed contains zero P1/P2 items. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| PriorityFeedStrip (the collapsed strip) | Delivered by WS-2.2. This workstream only handles the expanded panel. |
| `usePriorityFeed` hook implementation | Delivered by WS-2.1. This workstream consumes its output. |
| `priorityFeedExpanded` store state | Delivered by WS-2.6. This workstream reads and writes the state. |
| Real-time push notifications | Delivered by WS-2.4 and WS-2.5. When WS-2.4 invalidates the priority feed query cache, this panel's data updates automatically via TanStack Query reactivity. |
| Sub-filtering within the panel (show only P1, only P2) | Deferred to a later iteration. The panel shows all P1+P2 items sorted by priority then recency. If WS-1.4's `selectedPriorities` store state is available, a future enhancement could add filter tabs. |
| Wiring PriorityFeedPanel into page.tsx | The panel is self-contained (reads visibility from store, reads data from hook). The implementer must add `<PriorityFeedPanel />` to the page component's render tree outside `SpatialViewport`, similar to `DistrictViewOverlay` and `TriageRationalePanel`. This wiring step is trivial but documented in Deliverable 4.7. |
| Tests | No test infrastructure (`pnpm test:unit` is not configured). Verification is via `pnpm typecheck`, `pnpm build`, and visual inspection. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-2.1 `usePriorityFeed()` hook | `src/hooks/use-priority-feed.ts` -- TanStack Query hook returning `PriorityFeedItem[]` (P1+P2 only, sorted by priority then recency). Expected fields per item: `id`, `title`, `severity`, `category`, `operationalPriority` (`'P1' \| 'P2'`), `ingestedAt` (ISO 8601). Poll interval: 15s. | Pending (WS-2.1 not yet implemented) |
| WS-2.1 `PriorityFeedItem` type | Exported interface from `src/hooks/use-priority-feed.ts` describing the shape of each feed item. | Pending (WS-2.1 not yet implemented) |
| WS-2.2 `PriorityFeedStrip` | The strip component that the user clicks to expand this panel. Must call `setPriorityFeedExpanded(true)` on click. The panel does not directly interact with the strip, only with the shared store state. | Pending (WS-2.2 not yet implemented) |
| WS-2.6 store extensions | `priorityFeedExpanded: boolean` and `setPriorityFeedExpanded(open: boolean)` in `coverage.store.ts`. | Pending (WS-2.6 not yet implemented) |
| WS-0.4 `PriorityBadge` component | `src/components/coverage/PriorityBadge.tsx` -- renders achromatic priority indicators (P1 diamond + pulse, P2 triangle, static). Used at `size="sm"` in feed item rows. | Pending (WS-0.4 not yet implemented) |
| WS-0.2 `OperationalPriority` type | `'P1' \| 'P2' \| 'P3' \| 'P4'` union type in `src/lib/interfaces/coverage.ts`. | Pending (WS-0.2 not yet implemented) |
| `startMorph()` | `useUIStore.getState().startMorph(categoryId)` -- initiates the morph state machine. Guards: only fires when `morph.phase === 'idle'`. | Available [CODEBASE: `src/stores/ui.store.ts` line 102-110] |
| `setDistrictPreselectedAlertId()` | `useCoverageStore.getState().setDistrictPreselectedAlertId(id)` -- sets the alert ID to pre-select when entering district view. Consumed by `DistrictViewOverlay` on mount. | Available [CODEBASE: `src/stores/coverage.store.ts` line 196-199] |
| `getCategoryMeta()` | Resolves category ID to `CategoryMeta` (displayName, shortName, icon, color). | Available [CODEBASE: `src/lib/interfaces/coverage.ts` line 103-106] |
| `SEVERITY_COLORS` | Maps severity level to its display color for the severity indicator. | Available [CODEBASE: `src/lib/interfaces/coverage.ts` line 119-125] |

## 4. Deliverables

### 4.1 File Location and Export

**File:** `src/components/coverage/PriorityFeedPanel.tsx`

**Exports:**
- `PriorityFeedPanel` -- named function component export (consistent with `AlertDetailPanel`, `TriageRationalePanel`, `FeedPanel` export pattern)

**Import pattern for consumers:**
```typescript
import { PriorityFeedPanel } from '@/components/coverage/PriorityFeedPanel'
```

**Directive:** `'use client'` at file top (component uses hooks: `usePriorityFeed`, `useCoverageStore`, `useUIStore`, `useEffect`, `useCallback`).

### 4.2 Component Architecture

The PriorityFeedPanel is a self-contained component with no required props. It reads its own visibility state and data from stores and hooks. This mirrors the `DistrictViewOverlay` pattern (self-gates on morph phase) rather than the `AlertDetailPanel` pattern (receives callbacks as props).

**Rationale:** The panel's lifecycle is simple -- open/close driven by a single boolean. The morph navigation logic is generic (same for every item), so there is no benefit to lifting callbacks to the parent. Keeping the logic internal reduces wiring complexity in `page.tsx`.

**Store reads:**
- `useCoverageStore(s => s.priorityFeedExpanded)` -- gates rendering
- `useCoverageStore(s => s.setPriorityFeedExpanded)` -- dismissal
- `useCoverageStore(s => s.setDistrictPreselectedAlertId)` -- pre-selection before morph
- `useUIStore(s => s.startMorph)` -- initiates morph to district
- `useUIStore(s => s.morph.phase)` -- auto-close guard

**Hook consumption:**
- `usePriorityFeed()` -- P1/P2 feed data + loading state

**Internal state:**
- None required. The panel is stateless beyond what the stores provide. Selection state (which item is hovered/focused) uses native CSS `:hover`/`:focus-visible` and does not need React state.

### 4.3 Panel Rendering and Positioning

The panel is **viewport-fixed** (not world-space). While the PriorityFeedStrip (WS-2.2) lives in world-space inside the SpatialCanvas, the expanded panel renders outside the viewport at a fixed screen position. This is the same pattern used by `DistrictViewOverlay` (viewport-fixed, z-30), `TriageRationalePanel` (viewport-fixed, z-45), and `NavigationHUD` (viewport-fixed, z-40).

**Position:** Fixed to the top-right area of the viewport. The panel anchors from the top, visually connecting to the strip's general screen location. Specific CSS:

```css
position: fixed;
top: 56px;      /* Below TopTelemetryBar (42px height + margin) */
right: 24px;
z-index: 35;    /* Between DistrictViewOverlay (30) and NavigationHUD (40) */
```

**z-index justification:**
| Layer | z-index | Relationship |
|-------|---------|-------------|
| DistrictViewOverlay | 30 | PriorityFeedPanel should overlay the district view so users can review priority alerts without leaving the district context |
| **PriorityFeedPanel** | **35** | This component |
| NavigationHUD | 40 | Nav controls remain accessible above the feed panel |
| TriageRationalePanel | 45 | Triage rationale always overlays everything except command palette |
| CommandPalette (Dialog) | 50 | Highest z-level |

**Panel dimensions:**
- Width: 400px (wider than FeedPanel's 320px to accommodate PriorityBadge + severity + title + category + time-ago in a single row without excessive truncation)
- Max height: `calc(100vh - 120px)` (56px top offset + 64px bottom margin for BottomStatusStrip clearance)
- Content area: scrollable via `overflow-y: auto` with custom scrollbar styling matching the design system (thin, translucent)

### 4.4 Visual Design

The panel follows the glass-morphism aesthetic established by `AlertDetailPanel` and `TriageRationalePanel`:

**Panel chrome:**
```css
background: rgba(10, 14, 24, 0.94);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 8px;
```

**Backdrop overlay:** A full-viewport semi-transparent layer behind the panel that dismisses on click:
```css
position: fixed;
inset: 0;
z-index: 34;    /* One below the panel */
background: rgba(0, 0, 0, 0.3);
```

**Header section (non-scrolling):**
- Title: "PRIORITY FEED" in the standard ghost header style (`fontFamily: var(--font-mono, monospace)`, `fontSize: 14`, `fontWeight: 700`, `color: rgba(255, 255, 255, 0.3)`, `letterSpacing: 0.12em`, `textTransform: uppercase`)
- Summary line below the title showing P1 and P2 counts: "P1: {count} / P2: {count}" in monospace at lower opacity
- Separator: 1px line at `rgba(255, 255, 255, 0.06)` between header and list
- Close button: small "X" or "CLOSE" in the top-right corner of the header, monospace, subtle hover treatment matching the AlertDetailPanel button pattern

**Scrollable list section:**
- Vertical list of `PriorityFeedItem` rows
- Gap between rows: 2px (tight packing, relying on row padding for separation)
- Alternating subtle background on even rows: `rgba(255, 255, 255, 0.015)` for visual rhythm (optional, per UX review)

**Footer (non-scrolling):**
- Item count: "{n} alerts" in ghost text at bottom
- Omitted if the list is short enough to not scroll

### 4.5 Feed Item Row Design

Each row is a `<button>` element (semantically correct for a clickable action) styled as a list row. The layout is a single horizontal flex line with wrapping for long titles.

**Row layout (left to right):**

```
[PriorityBadge] [SeverityDot] [Title........................] [Category] [TimeAgo]
```

| Element | Implementation | Visual Treatment |
|---------|----------------|-----------------|
| PriorityBadge | `<PriorityBadge priority={item.operationalPriority} size="sm" />` | Achromatic: P1 = diamond + pulse, P2 = triangle. No color. Per AD-1. |
| SeverityDot | 6px circle `<span>` with `backgroundColor` from `SEVERITY_COLORS[item.severity]` | Color channel for severity (red, orange, yellow, blue, gray). |
| Title | Truncated to ~40 characters with ellipsis. `font-mono text-[11px]` at `rgba(255, 255, 255, 0.30)`. | Primary information. |
| Category | `getCategoryMeta(item.category).shortName` (e.g., "SEIS", "WX"). `font-mono text-[9px]` at category color with reduced opacity. | Secondary identifier. |
| TimeAgo | Relative time string (e.g., "2m", "15m", "1h"). `font-mono text-[9px]` at `rgba(255, 255, 255, 0.15)`. | Temporal context. Right-aligned, flex-shrink-0. |

**Row dimensions:**
- Padding: `10px 16px`
- Min height: 40px
- Full width of the panel content area

**Row interaction states:**
- Default: transparent background
- Hover: `background: rgba(255, 255, 255, 0.04)`, title opacity increases to `0.45`
- Focus-visible: `outline: 1px solid rgba(255, 255, 255, 0.15)`, `outline-offset: -1px`
- Active: `background: rgba(255, 255, 255, 0.06)`

**Row grouping:** Items are rendered in the order provided by `usePriorityFeed()` (pre-sorted by WS-2.1: P1 first, then P2, each sub-sorted by recency descending). A visual separator line appears between the last P1 item and the first P2 item to reinforce the priority grouping:

```css
/* Separator between P1 and P2 groups */
height: 1px;
background: rgba(255, 255, 255, 0.04);
margin: 4px 16px;
```

The separator is rendered conditionally by comparing adjacent items' `operationalPriority` values during the map iteration.

### 4.6 Time-Ago Formatting

A local utility function converts ISO 8601 timestamps to relative time strings. This is a new helper since the codebase currently uses absolute `HH:MM` formatting (FeedPanel line 51-54, ActivityTicker line 51-54) but the priority feed context benefits from relative time for urgency perception.

**Format rules:**
| Elapsed Time | Output |
|-------------|--------|
| < 1 minute | "NOW" |
| 1-59 minutes | "{n}m" (e.g., "3m", "45m") |
| 1-23 hours | "{n}h" (e.g., "1h", "12h") |
| 1-6 days | "{n}d" (e.g., "1d", "5d") |
| 7+ days | "{n}w" (e.g., "1w", "3w") |

The function is defined as a module-level helper within `PriorityFeedPanel.tsx` (not exported), since no other component currently needs relative time formatting. If future workstreams need it, it can be extracted to a shared utility.

### 4.7 Navigation Flow (Click-to-District)

When the user clicks a feed item row, the panel executes the same navigation sequence used by the INSPECT flow's "VIEW DISTRICT" button (`page.tsx` lines 254-264):

**Sequence:**
1. Read the clicked item's `id` and `category`
2. Call `useCoverageStore.getState().setDistrictPreselectedAlertId(item.id)` -- store the alert ID for the district overlay to consume
3. Call `useCoverageStore.getState().setPriorityFeedExpanded(false)` -- close the panel
4. Call `useUIStore.getState().startMorph(item.category)` -- initiate the morph state machine

**Guard:** `startMorph` internally guards against being called when `morph.phase !== 'idle'` (ui.store.ts line 104). If the morph is already in progress, the call is silently ignored. The panel should also visually disable item clicks when morph is not idle, by checking `morph.phase` and applying `pointer-events: none` + reduced opacity to the list.

**Pre-selection consumption:** The `DistrictViewOverlay` already handles consuming `districtPreselectedAlertId` on mount (district-view-overlay.tsx lines 62-70). It reads the ID, passes it to `setSelectedAlertId`, and clears the store field. No changes to `DistrictViewOverlay` are needed.

**Edge case -- panel open during active morph:** If the morph state machine is not in `idle` when the panel is open (possible if the user opened the panel, then triggered a morph via another path like keyboard shortcut), the panel auto-closes. This is implemented via a `useEffect` that watches `morph.phase`:

```typescript
const morphPhase = useUIStore((s) => s.morph.phase)
const setPriorityFeedExpanded = useCoverageStore((s) => s.setPriorityFeedExpanded)

useEffect(() => {
  if (morphPhase !== 'idle') {
    setPriorityFeedExpanded(false)
  }
}, [morphPhase, setPriorityFeedExpanded])
```

### 4.8 Dismissal and Keyboard Handling

Three dismissal mechanisms:

**1. Backdrop click:** Clicking the semi-transparent backdrop overlay (z-34, behind the panel at z-35) calls `setPriorityFeedExpanded(false)`.

**2. Escape key:** A `useEffect` registers a `keydown` listener for `Escape` when the panel is visible. This must respect the existing Escape priority chain defined in `page.tsx` (lines 324-336):

```
Priority chain: INSPECT detail > triage panel > priority feed panel > command palette
```

Since the panel is at z-35 (above triage at z-45 is wrong -- triage is at z-45 which is higher), the Escape handler should only fire if neither the INSPECT panel nor the triage panel is open. In practice, the panel integrates into the existing Escape chain by adding its own condition:

```typescript
// In PriorityFeedPanel's own useEffect:
if (event.key === 'Escape' && isExpanded) {
  setPriorityFeedExpanded(false)
  event.stopPropagation()
}
```

However, the central Escape handler in `page.tsx` should be extended to include the priority feed panel in the priority chain. This is documented as a wiring step in the integration notes (Section 4.10).

**3. Auto-close on morph:** Covered in Section 4.7.

**Focus management:**
- On open: focus moves to the first focusable element in the panel (the close button or the first item row)
- On close: focus returns to the element that triggered the open (the PriorityFeedStrip). Since the strip is in world-space and may not be focusable at the viewport level, focus returns to `document.body` as a fallback.
- Tab order: Close button -> item rows (top to bottom) -> Close button (wrap)

### 4.9 Loading, Empty, and Error States

**Loading (usePriorityFeed is fetching):**
```
PRIORITY FEED
---
LOADING...        ← ghost text, pulsing opacity
```
The header renders normally. The list area shows "LOADING..." in the standard ghost text style (`font-mono`, `fontSize: 11`, `color: rgba(255, 255, 255, 0.10)`, `letterSpacing: 0.04em`) with a CSS `animate-pulse` effect matching the loading skeletons used in `CategoryDetailScene`.

**Empty (zero P1/P2 items):**
```
PRIORITY FEED
P1: 0 / P2: 0
---
ALL CLEAR         ← ghost text, no pulse
No priority alerts at this time.
```
The empty state displays a prominent "ALL CLEAR" label and a secondary explanatory line. Both in ghost text style. No items are rendered. This is informational -- the absence of priority alerts is itself meaningful data (as noted in the combined recommendations: "absence of alerts is itself information").

**Error (usePriorityFeed query failed):**
```
PRIORITY FEED
---
FEED UNAVAILABLE  ← ghost text
Retry in {n}s     ← countdown based on TanStack Query retry timing
```
Displays the error state with a retry countdown. TanStack Query handles automatic retry; the panel just shows the current state.

### 4.10 Integration into Page Component

The implementer must add the `PriorityFeedPanel` component to the render tree in `src/app/(launch)/page.tsx`. It should be placed alongside the other viewport-fixed overlays, after the `TriageRationalePanel`:

```tsx
{/* Triage rationale slide-out panel (fixed, z-45) */}
<TriageRationalePanel item={selectedBundle} onClose={handleCloseRationale} />

{/* Priority feed expanded panel (fixed, z-35) */}
<PriorityFeedPanel />
```

Additionally, the Escape key priority chain in `page.tsx` (lines 324-336) should be extended to include the priority feed panel:

```typescript
{
  key: 'Escape',
  handler: () => {
    if (selectedMapAlertId) {
      handleCloseInspect()
    } else if (selectedBundleId) {
      setSelectedBundleId(null)
    } else if (priorityFeedExpanded) {        // NEW
      setPriorityFeedExpanded(false)           // NEW
    } else {
      setCommandPaletteOpen(false)
    }
  },
  label: 'Close Panel',
},
```

This places the priority feed panel below INSPECT and triage in the Escape priority chain, but above the command palette.

### 4.11 Animation Specification

**Enter animation (panel appears):**
```typescript
initial={{ opacity: 0, y: -20, scale: 0.98 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
```

The `y: -20` creates a subtle slide-down from above, connecting the motion to the strip's position at the top of the viewport. The ease curve `[0.22, 1, 0.36, 1]` is the same "expo out" curve used by `DistrictViewOverlay` (district-view-overlay.tsx line 111) and `AlertDetailPanel` (AlertDetailPanel.tsx line 99) for consistency.

**Exit animation (panel dismisses):**
```typescript
exit={{ opacity: 0, y: -12, scale: 0.98 }}
transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
```

Exit is faster than entry (150ms vs 250ms) to feel responsive when dismissing.

**Backdrop animation:**
```typescript
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.2 }}
```

The backdrop fades in/out independently of the panel, with a simpler linear timing.

**Reduced motion:** When `prefers-reduced-motion: reduce` is active, set `transition={{ duration: 0 }}` on all motion elements. The panel appears/disappears instantly without animation.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `PriorityFeedPanel` is exported as a named export from `src/components/coverage/PriorityFeedPanel.tsx`. | `import { PriorityFeedPanel } from '@/components/coverage/PriorityFeedPanel'` resolves without error. `pnpm typecheck` passes. |
| AC-2 | Panel renders (visible in DOM) when `priorityFeedExpanded === true` in coverage store. | Set store state to `true` via devtools or strip click. Panel appears on screen. |
| AC-3 | Panel does not render when `priorityFeedExpanded === false`. | Default state: no panel DOM node present. React DevTools confirms null return from `AnimatePresence`. |
| AC-4 | Each feed item row displays a `PriorityBadge` (achromatic), severity color dot, title, category short name, and time-ago string. | Visual inspection of rendered rows. DOM inspection confirms: SVG shape (PriorityBadge), colored `<span>` (severity dot), text elements for title, category, and time-ago. |
| AC-5 | No color is used for priority differentiation. Priority badges are achromatic (white-channel only). Severity uses color. | Visual inspection: PriorityBadge shapes are white/gray only. Severity dots use red/orange/yellow/blue. Code review: no severity colors applied to PriorityBadge. |
| AC-6 | Clicking a feed item closes the panel and initiates morph navigation to the item's category district. | Click a feed item. Panel closes (exit animation plays). Morph state machine transitions from `idle` to `expanding`. DistrictViewOverlay appears with the correct category. |
| AC-7 | `districtPreselectedAlertId` is set to the clicked item's ID before `startMorph` is called. | Add a console.log or breakpoint in `setDistrictPreselectedAlertId`. Confirm it is called with the correct ID before `startMorph` fires. DistrictViewOverlay opens with the alert pre-selected in the dock panel. |
| AC-8 | Pressing Escape closes the panel when no higher-priority panel is open. | Open the panel. Press Escape. Panel closes. Verify: if INSPECT or triage panel is open simultaneously, Escape closes those first (priority chain respected). |
| AC-9 | Clicking the backdrop overlay closes the panel. | Click the semi-transparent area outside the panel. Panel closes with exit animation. |
| AC-10 | Panel has `role="dialog"` and `aria-label="Priority feed"` on the root element. | DOM inspection confirms the attributes. Screen reader announces "Priority feed dialog" on open. |
| AC-11 | Feed item rows are focusable via Tab key and activatable via Enter/Space. | Tab through the panel: focus moves from close button to each item row sequentially. Press Enter on a focused row: navigation triggers. |
| AC-12 | Loading state shows "LOADING..." text while `usePriorityFeed` is fetching. | Clear the query cache, reopen the panel. "LOADING..." text appears in the list area until data arrives. |
| AC-13 | Empty state shows "ALL CLEAR" when zero P1/P2 items exist. | With no P1/P2 data from the API, open the panel. "ALL CLEAR" message is displayed. P1 and P2 counts both show 0. |
| AC-14 | Panel auto-closes when morph state machine leaves `idle` phase. | Open the panel. Trigger a morph via another interaction (e.g., click a category card, keyboard shortcut). Panel closes automatically. |
| AC-15 | Panel is positioned at `z-index: 35`, overlaying the district view (z-30) but below NavigationHUD (z-40) and TriageRationalePanel (z-45). | Open the panel while district view is active: panel appears above it. NavigationHUD controls remain clickable above the panel. |
| AC-16 | A visual separator line appears between the last P1 item and the first P2 item in the list. | With mixed P1 and P2 items, inspect the list: a thin divider line separates the two groups. |
| AC-17 | Panel enter animation is a subtle slide-down + fade-in (250ms). Exit animation is slide-up + fade-out (150ms). | Visual inspection: panel slides down on open, slides up on close. Timing matches specification. |
| AC-18 | When `prefers-reduced-motion: reduce` is active, animations are instant (duration: 0). | Enable reduced motion in OS settings. Open/close panel: no animation, panel appears/disappears instantly. |
| AC-19 | `pnpm typecheck` passes with no errors after adding the component. | TypeScript compiler exits with code 0. |
| AC-20 | `pnpm build` completes without errors. | Build pipeline exits 0. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Viewport-fixed panel (not world-space). The panel renders with `position: fixed` outside the SpatialCanvas, at z-index 35. | World-space panels scale with zoom, making text unreadable at low zoom levels and requiring the user to be at the correct zoom/pan position to interact. Viewport-fixed panels provide consistent readability, reliable scrolling, and predictable interaction regardless of camera state. This matches the pattern used by `DistrictViewOverlay` (z-30), `TriageRationalePanel` (z-45), and `NavigationHUD` (z-40) -- all interactive overlays are viewport-fixed. | (a) World-space panel adjacent to the strip -- rejected: text scales with zoom, scrolling behavior is unreliable in world-space at different zoom levels, and the panel would need `ZoomGate` gating which prevents access at Z0. (b) Hybrid: world-space container with viewport-fixed inner content -- rejected: unnecessary complexity for a straightforward overlay. |
| D-2 | z-index 35 for the panel, 34 for the backdrop. | The panel must overlay the DistrictViewOverlay (z-30) so users can review priority alerts while a district is open. It must sit below NavigationHUD (z-40) and TriageRationalePanel (z-45) so those remain accessible. z-35 is the natural slot in the existing z-stack. | (a) z-32 (just above district) -- rejected: too close to z-30, leaves no room for future overlays. (b) z-42 (above HUD) -- rejected: would cover navigation controls, preventing the user from zooming or navigating while reviewing alerts. |
| D-3 | No props -- fully store-driven visibility and self-contained navigation. | The panel's lifecycle is a simple open/close toggle driven by `priorityFeedExpanded` in the coverage store. Navigation is the same for every item (set preselected ID, close, morph). There is no parent-specific behavior to parameterize. This matches `DistrictViewOverlay` which self-gates on morph phase without receiving visibility props. Keeping logic internal reduces wiring complexity in `page.tsx` to a single `<PriorityFeedPanel />` line. | (a) Receive `isOpen`, `onClose`, `onNavigate` props (like AlertDetailPanel) -- rejected: would require lifting priority feed state and navigation logic to page.tsx, adding ~20 lines of wiring for no architectural benefit. (b) Render via a portal -- rejected: not needed since the component is already outside SpatialCanvas. |
| D-4 | Semi-transparent backdrop overlay for dismissal and focus. | The backdrop provides: (1) a clear click-to-dismiss target, (2) visual focus by dimming the underlying interface, (3) indication that the panel is a modal-like surface requiring attention or dismissal. This follows the pattern established by dialog-style overlays in the design system. | (a) No backdrop, dismiss via close button only -- rejected: violates the principle that modals should be dismissable by clicking outside. Would trap users who instinctively click away. (b) Full opaque backdrop -- rejected: too aggressive for a feed panel that the user may want to reference alongside the main view. The `rgba(0, 0, 0, 0.3)` opacity is light enough to maintain spatial awareness. |
| D-5 | `motion/react` `AnimatePresence` for enter/exit animation. | Consistent with every other animated overlay in the codebase: `DistrictViewOverlay` (district-view-overlay.tsx line 95-111), `AlertDetailPanel` (AlertDetailPanel.tsx line 94-99), `TriageRationalePanel`. The ease curve `[0.22, 1, 0.36, 1]` and duration ranges (150-250ms) are established patterns. CSS-only animation would lose the `AnimatePresence` exit animation capability (unmount-on-exit). | (a) CSS transitions with conditional classes -- rejected: cannot animate unmounting (exit animation requires the element to remain in DOM during exit, which `AnimatePresence` handles). (b) `@starting-style` CSS -- rejected: browser support is insufficient for production use as of early 2026. |
| D-6 | P1/P2 group separator in the list. A thin divider line between the last P1 row and the first P2 row. | The feed is pre-sorted by priority (P1 first, P2 second). Without a visual separator, the transition from P1 to P2 items is ambiguous -- the user relies solely on reading each PriorityBadge to know the boundary. A 1px divider line provides an effortless visual landmark. This is lighter than section headers, which would add vertical bulk. | (a) Section headers ("P1 -- CRITICAL" / "P2 -- HIGH") -- rejected: adds vertical space and visual weight to what should be a compact scannable list. PriorityBadge already communicates the level per row. (b) Background color bands per group -- rejected: would conflict with the hover state background treatment and add visual noise. (c) No separator -- rejected: the boundary between P1 and P2 items would be invisible unless the user inspects each badge. |
| D-7 | Relative time-ago format (e.g., "3m", "1h") instead of absolute HH:MM. | Priority alerts are time-critical. "3 minutes ago" communicates urgency more effectively than "14:37" because the user does not need to mentally compute elapsed time. The existing FeedPanel uses HH:MM (adequate for a passive ambient feed), but the priority feed is an action-oriented surface where recency perception directly influences decision-making. | (a) Absolute HH:MM (matching FeedPanel) -- rejected: requires mental arithmetic to assess recency. Less effective for an urgency-focused surface. (b) "3 minutes ago" (long form) -- rejected: too wide for the row layout. The abbreviated format ("3m") is compact and scannable. |
| D-8 | Panel auto-closes when morph leaves idle. | If the user triggers a morph while the panel is open (via strip click, keyboard shortcut, or command palette), the panel must not remain floating over the district view entrance animation. Auto-closing prevents UI stacking and ensures the morph animation has full visual attention. | (a) Keep panel open during morph -- rejected: the panel at z-35 would overlay the district entrance animation at z-30, creating visual confusion. The panel's backdrop would dim the morph animation. (b) Minimize to strip on morph -- rejected: the strip is world-space and may not be visible during the morph. The simplest correct behavior is to close. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | Should the panel support sub-filtering by priority level (P1-only vs P2-only tabs or toggles)? WS-1.4 adds `selectedPriorities` to the coverage store which could drive this. | UX / react-developer | Phase 2 (post-WS-2.3 iteration, if users report difficulty scanning mixed P1+P2 lists) |
| Q-2 | If the user clicks an item whose category matches the currently active district (morph.phase === 'district' and morph.targetId === item.category), should the panel skip the morph and directly set districtPreselectedAlertId? This would avoid a redundant close-and-reopen animation. | react-developer | Phase 2 (during WS-2.3 implementation, once morph behavior is testable in context) |
| Q-3 | Should the panel display a maximum number of items (e.g., 50) with a "Show older" link, or show all P1/P2 items from the feed? Large feeds could affect scroll performance. | react-developer | Phase 2 (evaluate based on WS-2.1's API response size -- if the backend caps the feed at 50 items, this is moot) |
| Q-4 | What is the correct Escape priority if the PriorityFeedPanel, TriageRationalePanel, and INSPECT panel are all open simultaneously? The proposed chain (INSPECT > Triage > PriorityFeed > CommandPalette) may need UX validation. | UX / react-developer | Phase 2 (during integration, when all panels can be tested together) |
| Q-5 | Should the panel remain open when navigating to a district whose morph is already active (e.g., clicking a second P1 item in the same category after the first click already started the morph)? The `startMorph` guard (morph.phase !== 'idle') silently ignores the second call, but the panel is already closed from the first click. | react-developer | Phase 2 (edge case, addressed during implementation) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `usePriorityFeed()` (WS-2.1) is not implemented when WS-2.3 begins, blocking development. | Medium | High | Implement with a mock hook that returns static `PriorityFeedItem[]` data. Define the `PriorityFeedItem` interface locally in the panel file behind a `// TODO: import from WS-2.1` comment. Replace with the real hook once WS-2.1 is delivered. The mock can use data from `useIntelFeed()` with synthetic `operationalPriority` values. |
| R-2 | `PriorityBadge` (WS-0.4) is not available when WS-2.3 begins. | Medium | Low | Render a text-only placeholder: `<span>P1</span>` or `<span>P2</span>` in monospace with the achromatic opacity values specified in WS-0.4 (P1: 0.55, P2: 0.35). Replace with `<PriorityBadge>` once WS-0.4 is delivered. The text placeholder is visually adequate and communicates the correct information. |
| R-3 | `priorityFeedExpanded` store state (WS-2.6) is not available when WS-2.3 begins. | Low | Low | Add the state field and action directly to `coverage.store.ts` as part of WS-2.3 implementation (it is a 2-line addition: one state field, one action). Document that WS-2.6 should reconcile this if it adds the field independently. The field is simple enough that duplicate additions are trivially resolved via code review. |
| R-4 | Scroll performance degrades with many P1/P2 items (50+ rows). | Low | Medium | The row component is lightweight (no images, no complex layout). 50 rows of ~40px each is 2000px of scrollable content -- well within browser rendering capabilities without virtualization. If performance issues arise (unlikely below 200 items), add `react-window` or `@tanstack/react-virtual` for windowed rendering. Monitor via Chrome DevTools Performance panel during testing. |
| R-5 | Escape key conflicts with other panels that register their own Escape handlers. | Medium | Medium | Follow the priority chain pattern from `page.tsx` lines 324-336. The panel's own Escape handler uses `event.stopPropagation()` to prevent bubbling. The central Escape handler in `page.tsx` is updated (Section 4.10) to include `priorityFeedExpanded` in the chain. Test all panel combinations during integration. |
| R-6 | Panel opens during an active morph animation, causing visual stacking. | Low | Low | The auto-close guard (Section 4.7) watches `morph.phase` and closes the panel when it leaves `idle`. Additionally, WS-2.2's strip should disable the expand action during morph by checking `morph.phase === 'idle'` before calling `setPriorityFeedExpanded(true)`. Both safeguards are independent. |
| R-7 | The `districtPreselectedAlertId` is consumed by `DistrictViewOverlay` before the morph animation completes, or after it completes but the overlay misses the value. | Low | Medium | The existing pattern is proven: `DistrictViewOverlay` reads `districtPreselectedAlertId` in a `useEffect` triggered by `isVisible` (district-view-overlay.tsx lines 62-70). The morph state machine ensures `isVisible` becomes true during `entering-district` phase, which is after `startMorph` is called. The ID is set before `startMorph` (Section 4.7 sequence), so it is available when the overlay mounts. This is the same flow used by INSPECT's "VIEW DISTRICT" button, which is already validated in production. |
