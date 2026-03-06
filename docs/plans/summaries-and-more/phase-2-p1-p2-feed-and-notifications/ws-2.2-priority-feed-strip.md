# WS-2.2: PriorityFeedStrip Component

> **Workstream ID:** WS-2.2
> **Phase:** 2 -- P1/P2 Feed & Real-Time Notifications
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-2.1 (usePriorityFeed hook), WS-2.6 (coverage store `priorityFeedExpanded` state), WS-0.4 (PriorityBadge component)
> **Blocks:** WS-2.3 (PriorityFeedPanel expanded view)
> **Resolves:** AD-2 (P1/P2 strip is world-space)

## 1. Objective

Create a persistent, world-space priority feed strip positioned above the map toolbar in the SpatialCanvas. The strip provides at-a-glance awareness of the current P1/P2 alert posture -- the single most important intelligence surface for a protective agent monitoring live travel safety. When P1 alerts exist, the strip pulses to draw peripheral attention without requiring the operator to drill into any category. When the situation is clear, the strip communicates that absence explicitly ("ALL CLEAR"), because the confirmed absence of high-priority threats is itself operationally significant information.

The strip acts as the entry point to the full PriorityFeedPanel (WS-2.3): clicking it toggles the expanded view. It is gated to Z1+ via its own ZoomGate (hidden at Z0's far-out icon grid), positioned outside the `morph-panels-scatter` wrapper so it remains fully visible and un-blurred during category morph transitions, and has `pointer-events: auto` to be interactive within the SpatialCanvas.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| New component file | Create `src/components/coverage/PriorityFeedStrip.tsx` with named export `PriorityFeedStrip`. |
| Props interface | `PriorityFeedStripProps` exported for consumer type safety. Minimal props -- the component reads most data from hooks and store. |
| P1 count display | Total P1 alert count rendered with PriorityBadge diamond icon (WS-0.4). Entire P1 section pulses via CSS `@keyframes` when count > 0. |
| P2 count display | Total P2 alert count rendered with PriorityBadge triangle icon (WS-0.4). Static (no animation). |
| Most recent alert title | Title of the most recent P1 or P2 alert, truncated to fit the strip width. Displayed alongside a severity color dot (severity owns color per AD-1). |
| Time-ago display | Relative timestamp ("2m ago", "1h ago") for the most recent alert. Updates every 30 seconds via internal interval. |
| ALL CLEAR state | When both P1 and P2 counts are 0, the strip shows a muted "ALL CLEAR" message. No pulse, reduced opacity, subdued weight. |
| Loading state | Skeleton display while `usePriorityFeed` is loading. Dashes for counts, shimmer bar for title area. |
| Click interaction | Entire strip is a clickable button. Toggles `priorityFeedExpanded` in the coverage store (WS-2.6). |
| Expanded indicator | Subtle chevron icon (up/down) indicating whether the PriorityFeedPanel is expanded or collapsed. |
| World-space positioning | Positioned at `y=-842` (48px above the toolbar at `y=-794`), `x` centered on grid. |
| ZoomGate wrapper | Own `<ZoomGate show={['Z1', 'Z2', 'Z3']}>` wrapper -- visible at all zoom levels except Z0. |
| Morph independence | Rendered outside the `morph-panels-scatter` wrapper in page.tsx so it is never blurred or dimmed during morph transitions. |
| Pointer events | `pointer-events: auto` on the interactive container (SpatialCanvas disables pointer-events on children). |
| Reduced motion support | `@media (prefers-reduced-motion: reduce)` disables the P1 pulse animation. The strip remains visually distinguishable via count values, bold weight, and diamond shape. |
| Accessibility | `<button>` semantics for click target. `aria-label` describing current state. `aria-live="polite"` region wrapping the count values so screen readers announce changes. `aria-expanded` reflecting panel state. |
| Page integration | Add the `PriorityFeedStrip` to `src/app/(launch)/page.tsx` inside the SpatialCanvas, positioned with absolute coordinates, outside `morph-panels-scatter`. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| PriorityFeedPanel (expanded view) | Belongs to WS-2.3. This workstream only creates the strip that triggers it. |
| usePriorityFeed hook | Belongs to WS-2.1. This component consumes its return value. |
| Coverage store `priorityFeedExpanded` state | Belongs to WS-2.6. This component reads and toggles it. |
| PriorityBadge component | Belongs to WS-0.4. This component uses it for P1/P2 shape icons. |
| Real-time push notifications | Belongs to WS-2.4 and WS-2.5. The strip reacts to data changes via TanStack Query polling (15s interval via WS-2.1), not via push. |
| Sound/audio cues | Belongs to WS-2.5 (notification system). |
| Map marker priority scaling | Belongs to Phase 1 (WS-1.5). |
| Mobile/responsive layout | The TarvaRI Alert Viewer is a desktop spatial dashboard. No mobile breakpoints. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-2.1: `usePriorityFeed` hook | `src/hooks/use-priority-feed.ts` exporting `usePriorityFeed()` which returns `{ data: PriorityFeedSummary, isLoading: boolean }`. `PriorityFeedSummary` must include: `p1Count: number`, `p2Count: number`, `items: PriorityFeedItem[]` (sorted by priority then recency). `PriorityFeedItem` must include: `id: string`, `title: string`, `severity: string`, `category: string`, `operationalPriority: 'P1' \| 'P2'`, `ingestedAt: string` (ISO 8601). | Pending (WS-2.1 not yet implemented) |
| WS-2.6: Coverage store extensions | `priorityFeedExpanded: boolean` state and `setPriorityFeedExpanded: (open: boolean) => void` action added to `coverage.store.ts`. | Pending (WS-2.6 not yet implemented) |
| WS-0.4: PriorityBadge component | `PriorityBadge` component at `src/components/coverage/PriorityBadge.tsx` with `priority`, `size`, and `className` props. Used for P1 diamond and P2 triangle shape rendering. | Pending (WS-0.4 not yet implemented) |
| `ZoomGate` component | `src/components/ambient/zoom-gate.tsx` -- existing component, accepts `show: SemanticZoomLevel[]`. | Available [CODEBASE] |
| `GRID_WIDTH` constant | `src/components/coverage/CoverageGrid.tsx` exports `GRID_WIDTH = 1600`. Used for horizontal centering calculation. | Available [CODEBASE] |
| `GRID_HEIGHT` constant | `src/components/coverage/CoverageGrid.tsx` exports `GRID_HEIGHT = 400`. Used for vertical positioning calculation. | Available [CODEBASE] |
| `getCategoryMeta` / `getCategoryColor` | `src/lib/interfaces/coverage.ts` -- used to render category short code and severity color for the most recent alert. | Available [CODEBASE] |
| Severity color mapping | Existing `SEVERITY_COLORS` pattern used in `feed-panel.tsx` and `activity-ticker.tsx`. Will be replicated or extracted. | Available [CODEBASE] |
| `relativeTime` helper | Existing function in `CategoryDetailScene.tsx` (line 99-117). Will be extracted or re-implemented in the strip. | Available [CODEBASE] |

## 4. Deliverables

### 4.1 File Location and Export

**File:** `src/components/coverage/PriorityFeedStrip.tsx`

**Exports:**
- `PriorityFeedStrip` -- named function component export
- `PriorityFeedStripProps` -- named interface export

**Import pattern for consumers (page.tsx):**
```typescript
import { PriorityFeedStrip } from '@/components/coverage/PriorityFeedStrip'
```

**Directive:** `'use client'` at file top. The component uses hooks (`usePriorityFeed`, `useCoverageStore`, `useState`, `useEffect`).

### 4.2 Props Interface

```typescript
export interface PriorityFeedStripProps {
  /**
   * Additional CSS class names for layout composition.
   * Positioning is handled internally via world-space constants,
   * but className allows page.tsx to add data attributes if needed.
   */
  className?: string
}
```

**Design rationale:** The strip is a self-contained component that reads its data from `usePriorityFeed()` (WS-2.1) and its expanded state from `useCoverageStore` (WS-2.6). No data is passed as props. This keeps the page.tsx integration minimal (a single `<PriorityFeedStrip />` element) and avoids prop-drilling the feed data through the page component.

### 4.3 World-Space Positioning Constants

Defined as module-level constants at the top of the file:

```typescript
/** Strip world-space Y position: 48px above the map toolbar (toolbar top = -794). */
const STRIP_Y = -842

/**
 * Strip width. Matches the map/toolbar content width for visual alignment.
 * Computed as: GRID_WIDTH + 230 = 1830px.
 * This aligns the strip's left and right edges with the map area below it.
 */
const STRIP_WIDTH = 1830

/** Strip height. Compact single-line strip. */
const STRIP_HEIGHT = 40
```

**Positioning in the page.tsx SpatialCanvas:**

The strip is wrapped in its own `<ZoomGate>` and `<div className="absolute">` block, placed inside `<SpatialCanvas>` but OUTSIDE the `morph-panels-scatter` div. It uses the same x-offset formula as the toolbar and map:

```typescript
// In page.tsx, the strip container:
<ZoomGate show={['Z1', 'Z2', 'Z3']}>
  <div
    className="absolute"
    style={{
      left: -(GRID_WIDTH / 2) - 230 + 125,  // = -905, aligns with map left edge
      top: STRIP_Y,                           // = -842
      width: STRIP_WIDTH,                     // = 1830
      height: STRIP_HEIGHT,                   // = 40
      pointerEvents: 'auto',
    }}
  >
    <PriorityFeedStrip />
  </div>
</ZoomGate>
```

**Rationale for `left` formula:** This reuses the exact same `-(GRID_WIDTH / 2) - 230 + 125` expression used by the toolbar (page.tsx line 396), the map (line 421), and the stats panel (line 461). This ensures the strip's left edge is pixel-aligned with the map and toolbar below it. The width of 1830px (`GRID_WIDTH + 230`) matches the toolbar/map width, creating a unified column of content.

**Rationale for `top = -842`:** The toolbar is positioned at `top = -(GRID_HEIGHT / 2) - 900 - 40 + 400 - 54 = -794`. The strip is 48px above it: `-794 - 48 = -842`. This 48px gap provides clear visual separation between the strip and the toolbar without wasting vertical space. The gap is large enough to read as distinct elements but small enough to feel like a related group.

### 4.4 Visual Design -- Strip Layout

The strip is a single-row horizontal bar with these zones laid out via flexbox:

```
+--[P1 ZONE]--+--[P2 ZONE]--+-------[LATEST ALERT ZONE]-------+--[v]--+
| diamond  3  |  triangle 7 |  * Title of the most rec...  2m |  v/^  |
+--------------+-------------+----------------------------------+-------+
```

**Zone specifications:**

| Zone | Content | Width | Alignment |
|------|---------|-------|-----------|
| P1 Zone | PriorityBadge(P1, sm) + count (bold, mono) | Auto (shrink) | Left |
| Separator | Vertical 1px divider, `rgba(var(--ambient-ink-rgb), 0.08)` | 1px | -- |
| P2 Zone | PriorityBadge(P2, sm) + count (medium, mono) | Auto (shrink) | Left |
| Separator | Vertical 1px divider, `rgba(var(--ambient-ink-rgb), 0.08)` | 1px | -- |
| Latest Alert | Severity dot + truncated title + time-ago | Flex-1 (fill) | Left |
| Chevron | ChevronDown/ChevronUp icon (12px Lucide) | Auto (shrink) | Right |

**Container styles:**

```css
display: flex;
align-items: center;
gap: 12px;
padding: 0 16px;
height: 40px;
border-radius: 12px;
border: 1px solid rgba(var(--ambient-ink-rgb), 0.08);
background: rgba(var(--ambient-ink-rgb), 0.04);
backdrop-filter: blur(12px) saturate(120%);
cursor: pointer;
font-family: var(--font-mono, monospace);
```

The container matches the visual language of the existing CoverageOverviewStats rows (`rounded-xl border`, `bg-[rgba(var(--ambient-ink-rgb),0.05)]`, `backdrop-blur-[12px]`).

### 4.5 Visual States

The strip has four mutually exclusive visual states:

#### State 1: Active (P1 > 0)

The most urgent state. P1 count section pulses. Both counts are visible.

- **P1 Zone:** Diamond shape via `<PriorityBadge priority="P1" size="sm" />`. Count displayed in `font-bold`, `color: rgba(255, 255, 255, 0.55)` (matching PriorityBadge P1 opacity per WS-0.4 D-5). The entire P1 zone (shape + count) pulses via the CSS class `priority-feed-pulse`.
- **P2 Zone:** Triangle shape via `<PriorityBadge priority="P2" size="sm" />`. Count in `font-medium`, `color: rgba(255, 255, 255, 0.35)`. Static (no animation).
- **Latest Alert Zone:** Shows the most recent P1 alert (P1 takes precedence over P2 for "most recent" display). Severity dot (6px circle) in the alert's severity color, followed by truncated title (max ~60 characters), followed by time-ago in `rgba(255, 255, 255, 0.25)`.
- **Container border:** Elevated to `rgba(var(--ambient-ink-rgb), 0.15)` for subtle emphasis.

#### State 2: Elevated (P1 = 0, P2 > 0)

P2 alerts exist but no P1. No pulse animation.

- **P1 Zone:** Diamond shape + "0" count. Both rendered at `rgba(255, 255, 255, 0.15)` (dimmed to indicate zero).
- **P2 Zone:** Triangle shape + count. Standard P2 styling.
- **Latest Alert Zone:** Shows the most recent P2 alert.
- **Container border:** Standard `rgba(var(--ambient-ink-rgb), 0.08)`.

#### State 3: ALL CLEAR (P1 = 0, P2 = 0)

No priority alerts. The strip communicates absence of threats.

- **Full strip content is replaced** with a single centered message:
  - Text: "ALL CLEAR" in `font-mono`, `text-[10px]`, `tracking-[0.15em]`, `uppercase`, `font-medium`.
  - Color: `rgba(255, 255, 255, 0.15)` -- very muted. The absence of alerts should not demand attention.
  - A small check icon (Lucide `Check`, 12px) to the left of the text, same muted color.
- **Container background:** `rgba(var(--ambient-ink-rgb), 0.02)` -- nearly transparent.
- **Container border:** `rgba(var(--ambient-ink-rgb), 0.05)` -- barely visible.
- The strip is still clickable (opens empty PriorityFeedPanel, which WS-2.3 will handle).
- No animation.

#### State 4: Loading

Data is still being fetched. The strip shows a non-committal skeleton state.

- **P1 Zone:** Diamond shape (static) + "--" placeholder.
- **P2 Zone:** Triangle shape (static) + "--" placeholder.
- **Latest Alert Zone:** A `rgba(var(--ambient-ink-rgb), 0.06)` shimmer bar spanning ~200px width and 10px height. CSS shimmer animation (left-to-right gradient sweep, `@keyframes priority-strip-shimmer`).
- **Container styles:** Standard, no pulse.

### 4.6 Pulse Animation Specification

The P1 zone pulses when `p1Count > 0`. This is a CSS-only animation for performance (compositor-driven, no JS cost), consistent with the PriorityBadge P1 pulse decision (WS-0.4 D-2).

**Keyframes:**

```css
@keyframes priority-feed-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
```

Applied to the P1 zone wrapper:

```css
.priority-feed-pulse {
  animation: priority-feed-pulse 2.5s ease-in-out infinite;
}
```

**Shimmer animation for loading state:**

```css
@keyframes priority-strip-shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}

.priority-strip-shimmer {
  background: linear-gradient(
    90deg,
    rgba(var(--ambient-ink-rgb), 0.04) 25%,
    rgba(var(--ambient-ink-rgb), 0.08) 50%,
    rgba(var(--ambient-ink-rgb), 0.04) 75%
  );
  background-size: 200px 100%;
  animation: priority-strip-shimmer 1.5s infinite;
}
```

**Reduced motion:**

```css
@media (prefers-reduced-motion: reduce) {
  .priority-feed-pulse,
  .priority-strip-shimmer {
    animation: none;
  }
}
```

**Style injection:** The `@keyframes` rules are injected via a `<style>` JSX tag inside the component, using React 19's built-in `<style>` deduplication (same pattern as WS-0.4 D-6). The styles are defined as a module-level constant string to avoid re-creation on each render.

### 4.7 Time-Ago Display

The strip shows a relative timestamp for the most recent alert (e.g., "2m ago", "1h ago"). This display must update periodically without waiting for the 15-second API polling cycle, because a stale "just now" label erodes trust.

**Implementation:**

An internal `useEffect` sets a 30-second interval that increments a `tickCounter` state variable. The `relativeTime()` helper (extracted from or mirroring `CategoryDetailScene.tsx` lines 99-117) is called in render with the most recent alert's `ingestedAt` timestamp. The `tickCounter` is included as a dependency to force re-computation every 30 seconds.

```typescript
function useRelativeTimeTick(): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])
  return tick
}
```

**Format:** Same as the existing `relativeTime()` helper:
- < 60s: `"Xs ago"` (e.g., "12s ago")
- < 60m: `"Xm ago"` (e.g., "5m ago")
- < 24h: `"Xh ago"` (e.g., "3h ago")
- >= 24h: `"Xd ago"` (e.g., "2d ago")

### 4.8 Click Interaction

The entire strip is a `<button>` element. Clicking toggles `priorityFeedExpanded` in the coverage store:

```typescript
const priorityFeedExpanded = useCoverageStore((s) => s.priorityFeedExpanded)
const setPriorityFeedExpanded = useCoverageStore((s) => s.setPriorityFeedExpanded)

const handleClick = useCallback(() => {
  setPriorityFeedExpanded(!priorityFeedExpanded)
}, [setPriorityFeedExpanded, priorityFeedExpanded])
```

**Hover state:** On hover, the strip's border color transitions to `rgba(var(--ambient-ink-rgb), 0.18)` and background to `rgba(var(--ambient-ink-rgb), 0.07)`. Transition duration: 200ms ease.

**Keyboard support:** The `<button>` element provides native Enter/Space key activation. Focus ring uses the standard `focus-visible` outline.

### 4.9 Chevron Indicator

A Lucide `ChevronDown` (when collapsed) or `ChevronUp` (when expanded) icon at the right edge of the strip. Size: 12px. Color: `rgba(255, 255, 255, 0.20)`. Transitions between up/down using a 180-degree CSS rotation (`transform: rotate(180deg)`) for smooth direction change, rather than swapping components.

```typescript
import { ChevronDown } from 'lucide-react'

// In render:
<ChevronDown
  size={12}
  style={{
    color: 'rgba(255, 255, 255, 0.20)',
    transition: 'transform 200ms ease',
    transform: priorityFeedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
  }}
  aria-hidden="true"
/>
```

### 4.10 Severity Color Dot

The severity dot next to the most recent alert title uses the same color mapping as the existing FeedPanel and ActivityTicker:

```typescript
const SEVERITY_COLORS: Record<string, string> = {
  'Extreme': 'rgba(239, 68, 68, 0.7)',
  'Severe': 'rgba(249, 115, 22, 0.6)',
  'Moderate': 'rgba(234, 179, 8, 0.5)',
  'Minor': 'rgba(59, 130, 246, 0.5)',
  'Unknown': 'rgba(255, 255, 255, 0.2)',
}
```

The dot is a 6px circle (`width: 6, height: 6, borderRadius: '50%'`) rendered inline before the title text.

**Rationale:** Severity owns the color channel (AD-1). The priority shape (diamond/triangle) is achromatic. The severity dot provides the color signal next to the alert title, maintaining the visual channel separation.

### 4.11 Accessibility Specification

| Element | Requirement |
|---------|-------------|
| Root `<button>` | `aria-label` describing current state (see below). `aria-expanded={priorityFeedExpanded}` to communicate panel state. |
| Counts region | Wrap P1/P2 count displays in a `<span role="status" aria-live="polite">` to announce count changes to screen readers. Content: "3 priority 1 alerts, 7 priority 2 alerts" (or "No priority alerts, all clear"). |
| Severity dot | `aria-hidden="true"` (decorative -- the severity is communicated via the aria-label). |
| Chevron icon | `aria-hidden="true"` (decorative -- the expanded/collapsed state is communicated via `aria-expanded`). |

**aria-label patterns:**

- Active state: `"Priority feed: 3 P1 alerts, 7 P2 alerts. Most recent: [title]. Click to expand."`
- Elevated state: `"Priority feed: 0 P1 alerts, 7 P2 alerts. Most recent: [title]. Click to expand."`
- ALL CLEAR state: `"Priority feed: All clear, no priority alerts. Click to expand."`
- Loading state: `"Priority feed: Loading..."`

When expanded, append "(expanded)" to the label.

### 4.12 Page Integration (page.tsx Changes)

Add the strip to `src/app/(launch)/page.tsx` inside the `<SpatialCanvas>` block, AFTER the map toolbar `<ZoomGate>` block (line 414) and BEFORE the global coverage map `<ZoomGate>` block (line 417). The strip is placed in its own `<ZoomGate>` wrapper, outside `morph-panels-scatter`.

**New import:**
```typescript
import { PriorityFeedStrip } from '@/components/coverage/PriorityFeedStrip'
```

**New JSX block (insert between lines 414-415 of current page.tsx):**
```tsx
{/* Priority feed strip -- persistent P1/P2 summary, above toolbar.
    Own ZoomGate (Z1+), outside morph-panels-scatter for morph independence. */}
<ZoomGate show={['Z1', 'Z2', 'Z3']}>
  <div
    className="absolute"
    style={{
      left: -(GRID_WIDTH / 2) - 230 + 125,
      top: -(GRID_HEIGHT / 2) - 900 - 40 + 400 - 54 - 48,
      width: GRID_WIDTH + 230,
      pointerEvents: 'auto',
    }}
  >
    <PriorityFeedStrip />
  </div>
</ZoomGate>
```

**Rationale for `top` formula:** `-(GRID_HEIGHT / 2) - 900 - 40 + 400 - 54` is the toolbar's top position (-794). Subtracting 48 more gives -842, which equals `STRIP_Y`. The formula is written to make the derivation from the toolbar position explicit.

### 4.13 Component Structure (Internal)

```
PriorityFeedStrip(props)
  ├── <style> tag (pulse + shimmer keyframes, React 19 dedup)
  ├── Hook calls:
  │   ├── usePriorityFeed()       → { data, isLoading }
  │   ├── useCoverageStore(...)   → { priorityFeedExpanded, setPriorityFeedExpanded }
  │   └── useRelativeTimeTick()   → tick counter for time-ago refresh
  ├── Derived state:
  │   ├── p1Count, p2Count        → from data
  │   ├── mostRecentItem          → first item in data.items (already sorted)
  │   ├── visualState             → 'loading' | 'active' | 'elevated' | 'clear'
  │   └── ariaLabel               → computed from visual state + counts + title
  ├── <button> root element (click handler, aria-label, aria-expanded, className)
  │   ├── IF loading:
  │   │   ├── <PriorityBadge priority="P1" size="sm" /> + "--"
  │   │   ├── Separator
  │   │   ├── <PriorityBadge priority="P2" size="sm" /> + "--"
  │   │   ├── Separator
  │   │   ├── Shimmer bar
  │   │   └── Chevron
  │   ├── IF clear:
  │   │   ├── Check icon + "ALL CLEAR" text (centered, full width)
  │   │   └── Chevron
  │   ├── IF active or elevated:
  │   │   ├── <span> P1 zone (conditionally pulsing wrapper)
  │   │   │   ├── <PriorityBadge priority="P1" size="sm" />
  │   │   │   └── Count text
  │   │   ├── Separator
  │   │   ├── <span> P2 zone
  │   │   │   ├── <PriorityBadge priority="P2" size="sm" />
  │   │   │   └── Count text
  │   │   ├── Separator
  │   │   ├── <span role="status" aria-live="polite"> (screen reader text)
  │   │   ├── <span> Latest alert zone
  │   │   │   ├── Severity dot (6px)
  │   │   │   ├── Truncated title
  │   │   │   └── Time-ago text
  │   │   └── Chevron
  └── (end)
```

### 4.14 Text Styles Reference

All text in the strip uses the monospace font stack consistent with the spatial dashboard design system.

| Element | Font Size | Weight | Color | Letter Spacing | Text Transform |
|---------|-----------|--------|-------|----------------|----------------|
| P1 count (active) | `10px` | `700` (bold) | `rgba(255, 255, 255, 0.55)` | `0.06em` | -- |
| P1 count (zero) | `10px` | `700` (bold) | `rgba(255, 255, 255, 0.15)` | `0.06em` | -- |
| P2 count | `10px` | `500` (medium) | `rgba(255, 255, 255, 0.35)` | `0.06em` | -- |
| P2 count (zero) | `10px` | `500` (medium) | `rgba(255, 255, 255, 0.15)` | `0.06em` | -- |
| Alert title | `10px` | `400` (normal) | `rgba(255, 255, 255, 0.45)` | `0.02em` | -- |
| Time-ago | `9px` | `400` (normal) | `rgba(255, 255, 255, 0.25)` | `0.04em` | -- |
| ALL CLEAR | `10px` | `500` (medium) | `rgba(255, 255, 255, 0.15)` | `0.15em` | `uppercase` |
| Placeholder "--" | `10px` | `400` (normal) | `rgba(255, 255, 255, 0.15)` | `0.06em` | -- |

### 4.15 Title Truncation

The most recent alert title is truncated with an ellipsis when it exceeds the available space. The truncation uses CSS rather than JavaScript for responsiveness to the strip's rendered width:

```css
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
```

The title container is a `flex: 1` element that fills the remaining space after the count zones and chevron. This CSS truncation approach is preferred over the JavaScript `truncate()` helper used in FeedPanel because the strip's available width depends on the count digit widths, which vary.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `PriorityFeedStrip` is exported as a named export from `src/components/coverage/PriorityFeedStrip.tsx`. | `import { PriorityFeedStrip } from '@/components/coverage/PriorityFeedStrip'` resolves without error. `pnpm typecheck` passes. |
| AC-2 | Strip is positioned in world-space at `y=-842`, horizontally aligned with the map and toolbar (left edge at x=-905, width 1830px). | Visual inspection: the strip sits 48px above the toolbar, left/right edges align with the map. DOM inspection: absolute positioning with the specified coordinates. |
| AC-3 | Strip is visible at Z1, Z2, and Z3 zoom levels, and hidden at Z0. | Zoom to Z0 (far out, icon grid visible) -- strip is not rendered. Zoom to Z1+ -- strip appears. |
| AC-4 | Strip is NOT inside `morph-panels-scatter` and remains fully visible and un-blurred during morph transitions. | Select a category card to trigger morph. Verify: ambient panels blur and scatter, but the priority feed strip remains sharp and fully opaque. |
| AC-5 | When P1 count > 0: the P1 zone displays the diamond shape icon (PriorityBadge P1), the numeric count in bold, and the entire P1 zone pulses with a 2.5-second animation cycle. | Visual inspection: diamond shape visible, count bold, pulse animation running. DOM inspection: `.priority-feed-pulse` class present, `animation` property includes `priority-feed-pulse 2.5s`. |
| AC-6 | When P1 = 0 and P2 > 0 (elevated state): the P1 zone shows "0" in dimmed styling with no pulse, and the P2 zone shows the triangle shape with the count. | Visual inspection: P1 zone is muted, P2 zone is standard weight, no pulse animation anywhere. |
| AC-7 | When P1 = 0 and P2 = 0 (ALL CLEAR): the strip shows a muted "ALL CLEAR" text with a check icon, at very low opacity. | Visual inspection: "ALL CLEAR" text is visible but very faint. No count zones, no pulse, no alert title. |
| AC-8 | While data is loading: the strip shows "--" placeholders for counts and a shimmer animation for the title area. | Visual inspection during initial page load: dashes visible, shimmer bar animates left-to-right. |
| AC-9 | The most recent alert title is shown with a severity color dot, truncated with ellipsis when too long. | Visual inspection: severity dot color matches the alert's severity level. Long titles end with "..." rather than overflowing. |
| AC-10 | The time-ago display shows relative time and updates every 30 seconds without a full data refetch. | Watch the time-ago text for 60 seconds. Verify it updates (e.g., "1m ago" becomes "2m ago") without network requests visible in DevTools. |
| AC-11 | Clicking the strip toggles `priorityFeedExpanded` in the coverage store. | Click the strip -- `useCoverageStore.getState().priorityFeedExpanded` changes from `false` to `true`. Click again -- it changes back. |
| AC-12 | The chevron icon rotates from down (collapsed) to up (expanded) when the panel state changes. | Visual inspection: chevron points down when collapsed, up when expanded. Transition is smooth (200ms). |
| AC-13 | The strip is keyboard accessible: focusable via Tab, activatable via Enter/Space. | Tab to the strip -- focus ring is visible. Press Enter -- panel toggles. Press Space -- panel toggles. |
| AC-14 | `aria-expanded` attribute on the button reflects the expanded state. | DOM inspection: `aria-expanded="false"` when collapsed, `aria-expanded="true"` when expanded. |
| AC-15 | `aria-label` on the button accurately describes the current state (counts, most recent title, or "all clear"). | DOM inspection: `aria-label` includes count values and the most recent alert title, or "All clear" when empty. |
| AC-16 | `aria-live="polite"` region announces count changes to screen readers. | Screen reader testing: when counts change on data refresh, the updated count values are announced. |
| AC-17 | P1 pulse animation stops when `prefers-reduced-motion: reduce` is active. The strip remains visually distinguishable via bold weight and diamond shape. | Enable reduced motion in OS settings. Verify: no animation on P1 zone. P1 is still distinguishable from P2 via weight and shape. |
| AC-18 | `pnpm typecheck` passes with no errors after adding the component and page integration. | TypeScript compiler exits with code 0. |
| AC-19 | `pnpm build` completes without errors. | Build pipeline exits 0. |
| AC-20 | No color is used for priority differentiation. Priority visual channel is achromatic (shape, weight, animation). Severity dot uses the color channel for severity, not priority. | Code review: no `hsl`/`rgb` values with non-zero saturation are applied based on priority level. Severity dot color is derived from the alert's `severity` field, not its `operationalPriority`. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | The strip reads data directly from `usePriorityFeed()` hook and `useCoverageStore` rather than accepting data as props. | The strip is a self-contained dashboard widget with a single integration point (add to page.tsx). Passing data as props would require the page component to manage yet another data query and wire it through, adding complexity to an already-large page component (627 lines). The hook-based approach keeps the page integration to a single `<PriorityFeedStrip />` element. | (a) Props-based data passing -- rejected: bloats page.tsx, props-drilling through ZoomGate/div wrappers. (b) Context provider -- rejected: overkill for a single consumer, adds indirection. |
| D-2 | Strip width matches the toolbar/map width (1830px = GRID_WIDTH + 230) rather than using a narrower width centered on just the grid (1600px). | The strip serves as the topmost element in a vertical column of content: strip -> toolbar -> map -> grid. Aligning all four to the same width creates a clean, unified content area. A narrower strip would visually orphan itself from the column below. | (a) Grid width only (1600px) -- rejected: misaligned with toolbar, visual gap. (b) Narrower (e.g., 800px) -- rejected: the strip has three content zones that benefit from the full width. (c) Full canvas width -- rejected: no other elements span that wide. |
| D-3 | Use CSS `text-overflow: ellipsis` for title truncation rather than the JavaScript `truncate()` helper. | The strip's available title width depends on the rendered count zones (count digit widths vary). CSS truncation adapts automatically to the actual available space without hard-coded character limits. The existing FeedPanel's `truncate(text, 48)` pattern uses a fixed character limit, which works for its fixed-width panel but would be fragile in the strip's flexible layout. | (a) JS `truncate()` with fixed char limit -- rejected: doesn't adapt to variable count widths. (b) JS calculation based on measured widths -- rejected: unnecessary complexity. |
| D-4 | Use a single `<button>` as the root element rather than a `<div>` with `onClick`. | A `<button>` provides native keyboard activation (Enter/Space), focus management, and screen reader announcement without custom event handlers. The strip is functionally a toggle button, so `<button>` is the correct semantic element. | (a) `<div role="button" tabIndex={0} onKeyDown={...}>` -- rejected: re-implements native button behavior, more code, easier to get wrong. (b) Anchor tag `<a>` -- rejected: the strip doesn't navigate, it toggles state. |
| D-5 | The strip uses its own `@keyframes priority-feed-pulse` rule rather than sharing the `priority-pulse` animation from PriorityBadge (WS-0.4). | The strip's pulse animates the entire P1 zone (icon + count as a group), while PriorityBadge's pulse animates the badge container alone. Sharing the same keyframe name would work technically (both are opacity cycles), but keeping them separate allows independent tuning. For example, the strip might need a different opacity range or timing than the individual badge without creating a coupling constraint. | (a) Share `priority-pulse` keyframes -- viable alternative, saves a few bytes. Could be refactored later if the animations converge. |
| D-6 | The "ALL CLEAR" state replaces all content with a centered message rather than showing "0" counts alongside it. | When there are no priority alerts, the count values carry no operational information. Showing "P1: 0, P2: 0" forces the operator to read and interpret two numbers to reach the conclusion "nothing to worry about." The single "ALL CLEAR" message communicates the same information in one pre-interpreted phrase, reducing cognitive load. This pattern is standard in protective/security monitoring interfaces. | (a) Show zero counts alongside "ALL CLEAR" -- rejected: redundant information, higher cognitive load. (b) Hide the strip entirely when clear -- rejected: the confirmed absence of threats is itself operationally significant. A hidden strip leaves the operator wondering "is it clear, or is it broken?" |
| D-7 | Time-ago display updates every 30 seconds via `setInterval` rather than every second or on each render. | Every-second updates would cause 60 re-renders per minute for a label that changes meaningfully once per minute (e.g., "1m ago" to "2m ago"). Every 30 seconds is sufficient granularity for a monitoring dashboard and adds negligible render cost. The `useRelativeTimeTick()` hook pattern (increment a counter to force re-render) is lightweight and avoids recalculating the entire component tree. | (a) Every-second updates -- rejected: excessive renders for minimal information gain. (b) Update only on data refetch (every 15s) -- rejected: time-ago would feel frozen between polls, eroding real-time perception. (c) `requestAnimationFrame` -- rejected: wildly excessive for a text label. |
| D-8 | The chevron rotation uses a single `ChevronDown` icon with CSS `transform: rotate(180deg)` rather than conditionally rendering `ChevronDown`/`ChevronUp`. | A single icon with CSS rotation avoids a component swap (no AnimatePresence, no key changes, no React reconciliation). The 180-degree rotation produces the visual equivalent of `ChevronUp` and transitions smoothly via CSS `transition: transform 200ms ease`. | (a) Swap ChevronDown/ChevronUp components -- rejected: causes a React element swap, harder to animate the transition. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | Should the strip show a brief "flash" or highlight animation when a new P1 alert arrives (i.e., when the count increases between polls)? This would reinforce the real-time feel beyond the persistent pulse. The existing pulse communicates "P1 alerts exist" but not "a new one just appeared." | UX advisory / react-developer | Phase 2 (WS-2.4 realtime hook integration may address this via query cache invalidation) |
| Q-2 | Should the "most recent alert" zone show the most recent P1 (if any exist) or the absolute most recent regardless of priority level? Current spec prioritizes P1 over P2 for the title display, but an operator might want to see the freshest item regardless. | Protective agent advisory | Phase 2 (can be adjusted after user testing) |
| Q-3 | Does the `usePriorityFeed` hook (WS-2.1) return pre-computed `p1Count` and `p2Count` fields, or does the component need to derive them from `items.filter(i => i.operationalPriority === 'P1').length`? The WS-2.1 spec says the endpoint returns `PriorityFeedItem[]` but does not explicitly mention aggregate counts. | WS-2.1 implementer | Phase 2 (resolved when WS-2.1 SOW is finalized) |
| Q-4 | At default camera zoom (Z1), the strip at world-space `y=-842` renders near the top of the viewport. The TopTelemetryBar is viewport-fixed at `top: 14px`, `z-index: 35`. Will there be visual overlap or collision at default zoom? If so, should the strip be nudged lower (closer to -820) or should TopTelemetryBar increase its top offset? | react-developer | Phase 2 (verify during implementation with actual default camera position) |
| Q-5 | Should clicking the strip when the PriorityFeedPanel is already expanded close it (toggle behavior, as currently specified), or should it always open (with a separate close button on the panel)? Toggle is simpler but might be confusing if the user clicks the strip intending to refresh the panel. | UX advisory | Phase 2 (WS-2.3 panel design will inform this) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Visual competition with TopTelemetryBar at default zoom. The strip is world-space (`y=-842`), the telemetry bar is viewport-fixed (`position: fixed, top: 14px, z-index: 35`). At the default camera position and zoom level, these two elements may appear visually adjacent or overlapping, creating visual noise. | Medium | Medium | **Mitigation 1:** During implementation, test at default zoom and adjust `STRIP_Y` if needed (moving to -830 or -820 increases separation). **Mitigation 2:** The strip's backdrop blur (`backdrop-filter: blur(12px)`) provides a glass-like separation from whatever is behind it. **Mitigation 3:** The telemetry bar uses extremely muted text (8px, opacity 0.22-0.40 per `LABEL_COLOR`/`VALUE_COLOR`), while the strip uses larger text (10px, opacity 0.35-0.55), so they read as different layers even when adjacent. **Fallback:** If visual collision cannot be resolved at world-space level, the strip could be moved to viewport-fixed positioning as a last resort (would require a design decision override of AD-2). |
| R-2 | The `usePriorityFeed` hook (WS-2.1) return shape does not match the assumed `PriorityFeedSummary` interface in this SOW. | Medium | Low | The strip's data contract is minimal: counts + items with title/severity/priority/timestamp. If WS-2.1 returns a different shape, the strip can adapt with a small mapping layer. The component's internal logic does not depend on the hook's exact return type -- it derives `p1Count`, `p2Count`, and `mostRecentItem` from whatever the hook provides. |
| R-3 | PriorityBadge (WS-0.4) `sm` size is visually too large or too small for the 40px-tall strip context. | Low | Low | The strip uses PriorityBadge at `size="sm"` (12px SVG viewport per WS-0.4), which is proportional to the 10px text in the strip. If the badge appears too large, the strip can pass a `className` with explicit width/height constraints, or WS-0.4 could add an `xs` size variant. If too small, the strip can use `size="md"` (16px). |
| R-4 | The 2.5-second pulse animation creates perceived urgency fatigue in operators who monitor the dashboard for extended periods. | Low | Medium | The pulse is deliberately slow (2.5s) and subtle (opacity range 1.0-0.45, not a harsh blink). In practice, P1 alerts are expected to be rare and should resolve (get triaged, acknowledged, or expire) within minutes. If fatigue is observed during user testing, the pulse can be softened further (slower cycle, narrower opacity range) or replaced with a static bold treatment. |
| R-5 | The strip's `backdrop-filter: blur(12px)` causes GPU compositing performance issues on lower-end hardware, especially when layered over the map. | Low | Medium | The codebase already uses `backdrop-filter` extensively (CoverageOverviewStats, FeedPanel, SystemStatusPanel). If the strip's blur specifically causes issues, it can be removed with minimal visual impact (the background opacity alone at 0.04 provides sufficient separation). The blur is aesthetic, not functional. |
| R-6 | The `aria-live="polite"` region fires announcements too frequently during rapid polling (every 15 seconds if counts change each cycle). | Low | Low | The `polite` assertion level means announcements are queued and spoken during natural pauses, not interrupting the user. Additionally, TanStack Query's `keepPreviousData: true` (per WS-2.1) means the data only updates when the response actually changes, not on every poll. In practice, P1/P2 counts change infrequently. If over-announcement is observed, the `aria-live` region can be debounced (only update the screen reader text when counts change, not on every render). |
