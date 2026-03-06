# WS-0.4: Create PriorityBadge Component

> **Workstream ID:** WS-0.4
> **Phase:** 0 -- Consolidate & Prepare
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.2 (priority types -- uses `OperationalPriority` type and `PRIORITY_LEVELS` constant)
> **Blocks:** WS-1.2 (CategoryCard badge), WS-1.3 (district list badge), WS-2.2 (feed strip), WS-2.3 (feed panel), WS-3.2 (search results)
> **Resolves:** AD-1 (achromatic priority visual channel)

## 1. Objective

Create a `PriorityBadge` component at `src/components/coverage/PriorityBadge.tsx` that visually encodes operational priority (P1-P4) using shape, weight, and animation -- never color. This component is the single visual representation of priority used across all alert surfaces in Phases 1-4. Per AD-1, priority and severity occupy separate pre-attentive visual channels (Treisman 1985): severity owns color, priority owns shape/weight/motion. The component must work at three sizes (inline in list rows, badge on cards, detail panel display) and gracefully handle the progressive disclosure model where P3 is text-only and P4 is invisible by default.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| New component file | Create `src/components/coverage/PriorityBadge.tsx` with named export `PriorityBadge`. |
| Props interface | `PriorityBadgeProps` with `priority: OperationalPriority`, optional `size`, optional `className`, optional `showLabel`. Exported for consumer type safety. |
| P1 rendering | Inline SVG diamond shape, `font-bold` weight, subtle pulse animation via CSS `@keyframes`. Achromatic (white at elevated opacity). |
| P2 rendering | Inline SVG triangle shape, `font-medium` weight, static (no animation). Achromatic (white at medium opacity). |
| P3 rendering | Text label only ("P3"), `font-normal` weight. No shape. Visible when `showLabel` is true or in `lg` size context; hidden in `sm` size by default. |
| P4 rendering | Returns `null` by default. When an explicit `showLabel` prop is true, renders a muted text label. |
| Three size variants | `sm` (~16px context for list rows), `md` (~20px context for card badges), `lg` (~24px context for detail panels). Controls SVG dimensions and font size. |
| Pulse animation | CSS `@keyframes priority-pulse` defined inline via a `<style>` tag or Tailwind `@keyframes` extension. Animates opacity between two values on a slow 2.5s cycle. |
| Reduced motion support | `@media (prefers-reduced-motion: reduce)` disables the P1 pulse animation. |
| Accessibility | `aria-label` on the root element describing the priority level (e.g., "Priority 1 -- Critical"). `role="img"` on SVG shapes. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Wiring PriorityBadge into CategoryCard | Belongs to WS-1.2 (Phase 1). This workstream only creates the component. |
| Wiring PriorityBadge into AlertList | Belongs to WS-1.3 (Phase 1). |
| Wiring PriorityBadge into feed strip/panel | Belongs to WS-2.2 and WS-2.3 (Phase 2). |
| Priority filtering logic | Belongs to WS-1.4 (Phase 1). PriorityBadge is a pure display component with no store interaction. |
| Map marker priority scaling | Belongs to WS-1.5 (Phase 1). Map markers use MapLibre expressions, not React components. |
| Color-coded priority display | Explicitly prohibited by AD-1. Priority is achromatic. |
| Storybook stories | No Storybook setup exists in this project. Visual verification is manual at this stage. |
| Tests | No test infrastructure (`pnpm test:unit` is not configured in this project). Verification is via `pnpm typecheck` and visual inspection. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-0.2 deliverables | `OperationalPriority` type (`'P1' \| 'P2' \| 'P3' \| 'P4'`) and `PRIORITY_LEVELS` constant with display metadata (label, shape descriptor, weight descriptor) in `src/lib/interfaces/coverage.ts` | Pending (WS-0.2 not yet implemented) |
| `src/lib/interfaces/coverage.ts` | Existing module where `OperationalPriority` will be added by WS-0.2. Currently contains `SeverityLevel`, `SEVERITY_COLORS`, `CategoryMeta`, and related types (192 lines). | Available [CODEBASE] |
| `src/components/coverage/CategoryCard.tsx` | Existing visual patterns: font sizes (`text-[11px]`, `text-[9px]`), opacity levels (`rgba(255,255,255,0.6)` through `rgba(255,255,255,0.02)`), spacing (`gap-3`, `px-4`, `py-4`), motion import (`motion/react`). PriorityBadge will be placed in this component's top-right corner by WS-1.2. | Available (234 lines) [CODEBASE] |
| `src/components/district-view/scenes/CategoryDetailScene.tsx` | AlertList component pattern: severity badge uses `rounded px-1.5 py-0.5 font-mono text-[9px] font-medium tracking-[0.06em] uppercase` with `color-mix` backgrounds (lines 294-303). PriorityBadge will sit alongside severity badges in WS-1.3. | Available (695 lines) [CODEBASE] |
| `src/components/coverage/MapPopup.tsx` | Another alert surface: monospace font at 9px and 11px, severity dot (8px circle), white opacities at 0.60/0.45/0.25. PriorityBadge may appear here in later phases. | Available (167 lines) [CODEBASE] |
| AD-1 | Architecture decision: priority uses shape, weight, and animation -- NOT color. | Approved |

## 4. Deliverables

### 4.1 File Location and Export

**File:** `src/components/coverage/PriorityBadge.tsx`

**Exports:**
- `PriorityBadge` -- named function component export (consistent with `CategoryCard`, `MapPopup`, `CoverageMap` export pattern)
- `PriorityBadgeProps` -- named interface export (enables type-safe consumer prop spreading)

**Import pattern for consumers:**
```typescript
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
```

**Directive:** `'use client'` at file top (component uses no hooks currently, but consumers will render it within client component trees and the animation behavior is client-side by nature).

### 4.2 Props Interface

```typescript
import type { OperationalPriority } from '@/lib/interfaces/coverage'

export interface PriorityBadgeProps {
  /** The operational priority level to display. */
  priority: OperationalPriority
  /**
   * Contextual size variant.
   * - 'sm': ~16px context, for inline use in list rows (AlertList, search results)
   * - 'md': ~20px context, for badge overlays on cards (CategoryCard corner)
   * - 'lg': ~24px context, for detail panel display (INSPECT, TriageRationalePanel)
   * @default 'sm'
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Whether to show the priority text label alongside or instead of the shape.
   * - P1/P2: label appears next to the shape icon
   * - P3: label is the only visual (shape is always text-only for P3)
   * - P4: label is the only way P4 renders at all (otherwise returns null)
   * @default false
   */
  showLabel?: boolean
  /** Additional CSS class names for layout composition (e.g., positioning within a parent). */
  className?: string
}
```

**Design rationale:** The `showLabel` prop governs progressive disclosure. In compact list views (WS-1.3, WS-2.2, WS-3.2), consumers pass `showLabel={false}` (default) and only see the shape for P1/P2, nothing for P3/P4. In detail panels (WS-2.3, INSPECT), consumers pass `showLabel={true}` to reveal the text identifier for all visible levels.

### 4.3 Size System

Three size variants control the SVG shape dimensions and font sizing. Values are derived from the existing design system scale observed in the codebase [CODEBASE]:

| Size | SVG Viewport | Shape Scale | Font Size | Line Height | Use Cases |
|------|-------------|-------------|-----------|-------------|-----------|
| `sm` | 12 x 12 | Fitted to 12px box | `text-[9px]` | `leading-none` | AlertList rows (line 295-303), feed strip items, search result rows |
| `md` | 16 x 16 | Fitted to 16px box | `text-[10px]` | `leading-none` | CategoryCard corner badge (WS-1.2), feed panel items |
| `lg` | 20 x 20 | Fitted to 20px box | `text-[11px]` | `leading-none` | INSPECT detail panel, TriageRationalePanel |

**Rationale for sizes:** The `sm` shape at 12px is close to the severity badge font size (9px) used in AlertList (line 295), keeping both indicators at the same visual weight in a row. The `md` shape at 16px matches the icon scale of CategoryCard's Lucide icons at `size={24}` when placed in a corner badge context (smaller than the main icon, but clearly visible). The `lg` shape at 20px is proportional to the 11px body text used in detail panels (MapPopup line 67, AlertList line 307).

### 4.4 Render Logic Per Priority Level

Each priority level has a distinct visual treatment per AD-1. All shapes are achromatic -- they use `currentColor` inheriting from a white-channel opacity set on the container.

#### P1 -- Critical (Bold + Diamond + Pulse)

**Container styles:**
- `font-bold` (font-weight 700)
- `color: rgba(255, 255, 255, 0.55)` -- elevated opacity relative to typical UI text, but not pure white (which is reserved for hover/active states in this design system) [CODEBASE: CategoryCard hover button text goes to `rgba(255,255,255,0.6)` on hover, line 199-201]
- CSS class `priority-pulse` applied to the container, animating opacity

**Shape -- Diamond (rotated square):**
```
SVG viewBox="0 0 12 12" (sm) / "0 0 16 16" (md) / "0 0 20 20" (lg)
<rect> centered, rotated 45 degrees, with rounded corners (rx=1)
  - sm: 8x8 rect centered at 6,6
  - md: 10x10 rect centered at 8,8
  - lg: 13x13 rect centered at 10,10
fill="currentColor"
```

The diamond shape is achieved via a `<rect>` with `transform="rotate(45, cx, cy)"` rather than a `<polygon>`, because `<rect>` supports `rx`/`ry` for subtle corner rounding that matches the design system's rounded aesthetic (cards use `rounded-xl`, badges use `rounded`).

**Label (when `showLabel={true}`):** "P1" in `font-mono uppercase tracking-[0.06em]`, matching the severity badge letter-spacing (CategoryDetailScene line 295).

#### P2 -- High (Medium + Triangle + Static)

**Container styles:**
- `font-medium` (font-weight 500)
- `color: rgba(255, 255, 255, 0.35)` -- medium opacity, noticeably less prominent than P1

**Shape -- Upward-pointing triangle:**
```
SVG viewBox="0 0 12 12" (sm) / "0 0 16 16" (md) / "0 0 20 20" (lg)
<polygon> equilateral triangle pointing up
  - sm: points="6,2 11,10 1,10"
  - md: points="8,2 14,13 2,13"
  - lg: points="10,2 18,17 2,17"
fill="currentColor"
```

No animation. Static display.

**Label (when `showLabel={true}`):** "P2" in same font treatment as P1 label.

#### P3 -- Moderate (Normal + Text Only)

**Container styles:**
- `font-normal` (font-weight 400)
- `color: rgba(255, 255, 255, 0.20)` -- subdued, matching the tertiary text opacity used throughout the codebase [CODEBASE: CategoryDetailScene source status text at `rgba(255,255,255,0.2)`, line 559]

**Shape:** None. P3 has no geometric shape per AD-1 specification.

**Visibility rules:**
- When `showLabel={true}`: renders "P3" text label
- When `showLabel={false}` (default): returns `null` in `sm` size (not visible in list rows per AD-1 "visible in detail views, not list views"). In `md` and `lg` sizes, also returns `null` unless `showLabel` is explicitly true.
- Consumers in detail views (WS-2.3, INSPECT) will pass `showLabel={true}` to reveal P3.

**Label:** "P3" in `font-mono uppercase tracking-[0.06em]`.

#### P4 -- Low (Invisible by Default)

**Rendering:** Returns `null` unconditionally when `showLabel={false}` (default).

When `showLabel={true}`: renders "P4" text label with:
- `font-normal` (font-weight 400)
- `color: rgba(255, 255, 255, 0.10)` -- near-invisible, matching the most muted text in the system [CODEBASE: this is dimmer than the dimmest text observed, which is `rgba(255,255,255,0.12)` for timestamps in AlertList line 316-317]

**Rationale:** P4 is "Invisible by default (progressive disclosure -- only shown when explicitly filtered)" per AD-1. Even when shown, it should be visually subordinate to everything else on screen.

### 4.5 Pulse Animation Specification

The P1 pulse animation communicates urgency through gentle motion. It must be subtle enough not to be distracting in peripheral vision but noticeable enough to draw attention when scanning.

**Implementation -- CSS `@keyframes` (not `motion/react`):**

A `<style>` JSX element injected once by the component (or a Tailwind `@keyframes` extension if the project uses `tailwind.config.ts` customization):

```css
@keyframes priority-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

Applied to the P1 container as:
```css
animation: priority-pulse 2.5s ease-in-out infinite;
```

**Rationale for CSS over `motion/react`:** The pulse is a continuous, fire-and-forget animation with no interaction triggers or orchestration needs. CSS `@keyframes` is more performant (compositor-driven, no JS runtime cost) and simpler than wiring `motion.div` with `animate={{ opacity: [1, 0.5, 1] }}` and `transition={{ repeat: Infinity, duration: 2.5 }}`. The codebase already uses CSS `@keyframes` for ambient effects (e.g., `animate-pulse` Tailwind class on loading skeletons, line 231 of CategoryDetailScene). [CODEBASE]

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .priority-pulse {
    animation: none;
  }
}
```

When reduced motion is active, P1 is still distinguishable from P2 via its bold weight, diamond shape, and higher opacity. The animation is supplementary, not the sole differentiator.

**Timing rationale:** 2.5 seconds is slow enough to avoid inducing anxiety (fast blinking suggests "error" or "alarm"), but fast enough to register as intentional motion within ~5 seconds of glancing at the element. This matches the "subtle pulse" descriptor in AD-1.

### 4.6 Inline Style Tag for Animation

The `@keyframes` rule needs to exist in the document exactly once, regardless of how many PriorityBadge instances are rendered. Two approaches:

**Option A -- Module-level `<style>` via React portal or inline JSX:**
Insert a `<style>` tag inside the component's first render. React will deduplicate identical `<style>` tags in the same document. Wrap in a module-level flag to ensure single injection.

**Option B -- Tailwind config extension:**
Add the keyframe to `tailwind.config.ts` under `theme.extend.keyframes` and reference via `animate-priority-pulse` utility class.

**Decision: Option A (inline `<style>` tag).** The project does not appear to have a `tailwind.config.ts` (Tailwind v4 uses CSS-based configuration). An inline `<style>` tag keeps the animation definition co-located with the component that uses it, and React 19's built-in style deduplication handles multiple instances. [INFERENCE]

Implementation pattern:
```typescript
// At module scope, outside the component function
const PULSE_STYLES = `
@keyframes priority-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@media (prefers-reduced-motion: reduce) {
  .priority-pulse { animation: none; }
}
`
```

Rendered once via `<style>{PULSE_STYLES}</style>` inside the component's return. React 19 hoists `<style>` elements into `<head>` and deduplicates by content.

### 4.7 Component Structure

The component follows a straightforward conditional rendering pattern with no hooks (pure presentational):

```
PriorityBadge(props)
  ├── Early return: null if P4 and !showLabel
  ├── Early return: null if P3 and !showLabel
  ├── <style> tag (pulse keyframes, rendered once by React 19 dedup)
  ├── <span> container (className composition, size-dependent styles, aria-label)
  │   ├── SVG shape (P1 diamond or P2 triangle) -- omitted for P3/P4
  │   └── Text label ("P1"/"P2"/"P3"/"P4") -- only when showLabel is true
  └── (end)
```

**Container element:** `<span>` (not `<div>`) because the badge will be placed inline within flex rows alongside text content (alert titles, severity badges). A span is the correct inline-level element.

**className composition:** Use the `cn()` utility from `@/lib/utils` (consistent with CategoryCard line 276, CategoryDetailScene line 636) to merge the base classes with the `className` prop.

**aria-label:** Derived from `PRIORITY_LEVELS` metadata (WS-0.2 dependency). Example: `aria-label="Priority 1 -- Critical"`. This provides the accessible name that screen readers announce, since the visual representation (shapes, weight) is not accessible to non-visual users.

### 4.8 Composition Patterns for Consumers

While wiring the badge into specific surfaces belongs to later workstreams, the component API is designed for these known integration patterns:

**Pattern A -- Alongside severity badge in a flex row (WS-1.3, WS-2.2, WS-3.2):**
```tsx
<div className="flex items-center gap-2">
  <PriorityBadge priority={item.priority} size="sm" />
  <span className="severity-badge">...</span>
  <span className="title">...</span>
</div>
```

**Pattern B -- Positioned corner badge on a card (WS-1.2):**
```tsx
<div className="relative">
  {/* CategoryCard content */}
  <PriorityBadge
    priority={highestPriority}
    size="md"
    className="absolute top-2 right-2"
  />
</div>
```

**Pattern C -- Labeled display in detail panel (WS-2.3, INSPECT):**
```tsx
<PriorityBadge priority={item.priority} size="lg" showLabel />
```

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `PriorityBadge` is exported as a named export from `src/components/coverage/PriorityBadge.tsx`. | `import { PriorityBadge } from '@/components/coverage/PriorityBadge'` resolves without error. `pnpm typecheck` passes. |
| AC-2 | `PriorityBadgeProps` interface is exported and includes `priority: OperationalPriority`, `size?: 'sm' \| 'md' \| 'lg'`, `showLabel?: boolean`, `className?: string`. | TypeScript compilation confirms the interface shape. |
| AC-3 | P1 renders a diamond shape (rotated square SVG) at all three sizes. | Visual inspection: the shape is a diamond (rotated 45 degrees), not a circle or square. DOM inspection: `<svg>` contains a `<rect>` with a `rotate(45)` transform. |
| AC-4 | P1 has `font-bold` weight and elevated white opacity (`rgba(255,255,255,0.55)`). | DOM inspection of computed styles confirms `font-weight: 700` and the specified color value on the container. |
| AC-5 | P1 pulses with a 2.5-second animation cycle. | Visual inspection: the badge gently fades in and out. DOM inspection: `animation` property includes `priority-pulse 2.5s`. |
| AC-6 | P1 pulse animation stops when `prefers-reduced-motion: reduce` is active. | Enable reduced motion in OS settings (or via Chrome DevTools Rendering tab). Confirm the P1 badge is static. P1 is still distinguishable from P2 via bold weight + diamond shape + higher opacity. |
| AC-7 | P2 renders a triangle shape (upward-pointing SVG polygon) at all three sizes. | Visual inspection: upward-pointing triangle. DOM inspection: `<svg>` contains a `<polygon>` element. |
| AC-8 | P2 has `font-medium` weight and medium white opacity (`rgba(255,255,255,0.35)`). | DOM inspection of computed styles confirms `font-weight: 500` and the specified color value. |
| AC-9 | P2 has no animation. | DOM inspection: no `animation` property on the P2 container. |
| AC-10 | P3 returns `null` when `showLabel` is false (default) or omitted. | Render `<PriorityBadge priority="P3" />` -- no DOM node is produced. React DevTools confirms null return. |
| AC-11 | P3 renders "P3" text label when `showLabel={true}`. | Render `<PriorityBadge priority="P3" showLabel />` -- DOM shows a `<span>` with text content "P3". |
| AC-12 | P4 returns `null` when `showLabel` is false (default) or omitted. | Render `<PriorityBadge priority="P4" />` -- no DOM node is produced. |
| AC-13 | P4 renders a muted "P4" label when `showLabel={true}`, at the lowest opacity (`rgba(255,255,255,0.10)`). | Render `<PriorityBadge priority="P4" showLabel />` -- DOM shows text with the specified color value. |
| AC-14 | No color channel is used for priority differentiation. All priority visuals are achromatic (white-channel only). | Visual inspection: no red, amber, yellow, or blue hues on any priority level. Code review: no references to severity colors, category colors, or any `hsl`/`rgb` value with non-zero saturation. |
| AC-15 | `aria-label` is present on the root element for all rendered states. | DOM inspection: each rendered PriorityBadge has an `aria-label` attribute (e.g., "Priority 1 -- Critical"). |
| AC-16 | `pnpm typecheck` passes with no errors after adding the component. | TypeScript compiler exits with code 0. |
| AC-17 | `pnpm build` completes without errors. | Build pipeline exits 0. |
| AC-18 | The `className` prop is forwarded to the root element and merged with base classes. | Render `<PriorityBadge priority="P1" className="absolute top-2 right-2" />` -- DOM shows both the base classes and the positional classes on the root element. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Use inline SVG (`<svg>` in JSX) for P1 diamond and P2 triangle shapes, not Lucide icons or CSS pseudo-elements. | SVG gives precise control over shape geometry at arbitrary sizes, supports `currentColor` for achromatic theming, and is accessible via `role="img"`. Lucide does not have a "diamond" or filled-triangle icon that matches the spec. CSS pseudo-elements (borders forming triangles) do not support `rx`/`ry` rounding and are harder to size consistently across the three variants. | (a) Lucide icons -- rejected: no matching shapes. (b) CSS border-trick triangles -- rejected: no rounding, brittle sizing. (c) Unicode characters (diamond: `\u25C6`, triangle: `\u25B2`) -- rejected: rendering varies across fonts and OS; not guaranteed to match monospace font metrics. |
| D-2 | Use CSS `@keyframes` for P1 pulse animation, not `motion/react`. | The pulse is a continuous ambient animation with no interaction triggers, state transitions, or orchestration. CSS `@keyframes` runs on the compositor thread (no JS cost), aligns with existing loading skeleton animation patterns (`animate-pulse` class in CategoryDetailScene line 231), and keeps the component hook-free. `motion/react` would add runtime overhead for a fire-and-forget effect. | (a) `motion/react` `animate` prop with `repeat: Infinity` -- rejected: unnecessary JS runtime cost for a simple opacity cycle. (b) Tailwind `animate-pulse` utility -- rejected: Tailwind's built-in pulse uses `opacity: [1, 0.5, 1]` at 2s which is close but not configurable to 2.5s without extending the config, and its animation curve differs from the spec. |
| D-3 | P4 returns `null` (no DOM node) rather than rendering a hidden/invisible element. | Zero DOM overhead for the most common case. P4 items are the majority of intel (low-priority background noise), so rendering invisible DOM nodes for every P4 badge across hundreds of list items would be wasteful. The `showLabel` prop provides an opt-in path for the rare case where P4 visibility is needed (explicit filter context per AD-1). | (a) Render with `visibility: hidden` -- rejected: occupies layout space, produces unnecessary DOM nodes. (b) Render with `display: none` -- rejected: still creates a DOM node per instance. (c) Render with `opacity: 0` -- rejected: same DOM overhead, plus confusing for screen readers. |
| D-4 | Use `<span>` as the root element, not `<div>`. | PriorityBadge will be placed inline within flex rows (alongside severity badges and text titles in AlertList, line 294-303 of CategoryDetailScene). A `<span>` is the correct inline-level element that does not disrupt text flow. The `display: inline-flex` pattern (via Tailwind `inline-flex`) allows the span to contain the SVG and optional label in a row layout. | (a) `<div>` -- rejected: block-level element is semantically incorrect for inline badge usage. Would require `display: inline-flex` override anyway. |
| D-5 | Opacity values for the achromatic channel: P1=0.55, P2=0.35, P3=0.20, P4=0.10. | These values create four clearly distinguishable brightness steps within the white-on-dark design system. They are calibrated against existing codebase opacity tiers [CODEBASE]: the primary text ceiling is ~0.6 (CategoryCard hover button text, line 199), the secondary text floor is ~0.12 (AlertList timestamps, line 316). P1 at 0.55 sits just below interactive text, establishing it as an indicator rather than actionable text. Each step is 0.15-0.20 apart, ensuring perceptual distinguishability even on lower-contrast displays. | (a) Higher opacity for P1 (0.7+) -- rejected: would compete with interactive hover states and primary text, violating the visual hierarchy. (b) Smaller step sizes (0.05 apart) -- rejected: would not be perceptually distinct, especially at small sizes. |
| D-6 | Inject `@keyframes` via an inline `<style>` tag with React 19 deduplication, not via a global CSS file or Tailwind config. | The project uses Tailwind v4 with CSS-based configuration (no `tailwind.config.ts` observed). Adding a global CSS file for a single keyframe rule would be disproportionate. React 19 hoists `<style>` tags into `<head>` and deduplicates by content, so multiple PriorityBadge instances produce only one rule. This keeps the animation co-located with the component. [INFERENCE] | (a) Global `globals.css` addition -- rejected: disperses component concerns. (b) Tailwind v4 `@theme` extension in CSS -- viable alternative but couples the animation to the build pipeline rather than the component. Could be revisited if the inline `<style>` approach causes issues. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | Should the P1 diamond pulse also subtly scale (e.g., `scale: [1, 1.05, 1]`) in addition to opacity, or is opacity-only sufficient for the "subtle pulse" requirement? | UX / IA advisory | Phase 1 (when badge is first integrated into real surfaces and can be evaluated in context) |
| Q-2 | What exact label and description strings should `PRIORITY_LEVELS` metadata provide for each level? The `aria-label` values assumed here ("Priority 1 -- Critical", etc.) depend on WS-0.2's `PRIORITY_LEVELS` constant shape. | WS-0.2 implementer | Phase 0 (resolved when WS-0.2 is written) |
| Q-3 | Should PriorityBadge accept a `count` prop for the CategoryCard use case (WS-1.2), where the badge shows a combined P1+P2 count rather than a single priority level? Or should that be a separate `PriorityCountBadge` component? | react-developer | Phase 1 (WS-1.2 will determine the pattern) |
| Q-4 | Does the Tailwind v4 CSS configuration in this project support `@theme` keyframe extensions? If so, D-6 could be revisited to use that mechanism instead of inline `<style>`. | react-developer | Phase 0 (verify during implementation) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-0.2 `PRIORITY_LEVELS` constant shape does not match the metadata fields assumed in this SOW (label, shape descriptor, weight). | Low | Low | PriorityBadge can hard-code its own lookup table mapping `OperationalPriority` to shape/weight/label if the WS-0.2 metadata shape differs. The only hard dependency is the `OperationalPriority` type union itself, which is stable per the combined recommendations (`'P1' \| 'P2' \| 'P3' \| 'P4'`). |
| R-2 | SVG diamond shape at `sm` size (12px viewport) is too small to be recognizable as a diamond. | Medium | Low | The diamond is rendered as a rotated square with rounded corners. At 12px, the 8x8 rotated rect produces a shape roughly 11px corner-to-corner, which is comparable to the 8px severity dot in MapPopup (line 89-94). If testing reveals legibility issues, the `sm` SVG viewport can be increased to 14px with minimal layout impact. |
| R-3 | P1 pulse animation causes visual noise or distraction in list views with many P1 items. | Low | Medium | The 2.5s cycle and 0.5 minimum opacity are deliberately slow and subtle. In practice, P1 items are expected to be rare (critical threats). If multiple P1 badges pulse simultaneously, the visual effect should reinforce urgency rather than create noise. However, WS-1.3 integration can add a `maxPulsingBadges` limiter if needed -- the PriorityBadge component itself does not need to change. |
| R-4 | React 19 `<style>` deduplication does not work as expected, causing duplicate `@keyframes` rules. | Low | None | Duplicate `@keyframes` rules with identical content are harmless -- the browser uses the last definition, which is identical. No visual or functional impact. The only cost is a few extra bytes in the DOM, which is negligible. |
| R-5 | The achromatic priority encoding is not distinguishable enough from severity badges when both appear in the same row. | Medium | Medium | The differentiation is intentional and multi-dimensional: severity badges use color fills with colored borders and text (CategoryDetailScene lines 297-303); priority badges use white-only shapes with no color. The visual language is deliberately different. However, user testing during Phase 1 integration (WS-1.3) should validate that the two badge types are perceived as distinct channels. If not, the priority badge could add a subtle border or background treatment to increase differentiation. |
