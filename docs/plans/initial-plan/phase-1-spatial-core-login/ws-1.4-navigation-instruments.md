# WS-1.4: Navigation Instruments

> **Workstream ID:** WS-1.4
> **Phase:** 1 -- Spatial Core + Login
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1, WS-0.2, WS-1.1 (ZUI engine -- camera store, semantic zoom)
> **Blocks:** WS-2.1, WS-3.3 (command palette extends this)
> **Resolves:** None

---

## 1. Objective

Deliver the fixed-position HUD layer that keeps the operator oriented within the spatial canvas at all times. This workstream produces four navigation instruments -- an SVG minimap, a semantic breadcrumb, a zoom level indicator, and a return-to-hub action -- plus the keyboard shortcut infrastructure (including a `Cmd+K` command palette stub) that Phase 3 will extend into the full command palette with AI Camera Director.

**Success looks like:** At any camera position and zoom level, the operator can glance at the minimap to see where they are, read the breadcrumb to know what they are looking at, check the zoom badge to understand their semantic depth, and press a single key to return home -- all without leaving the spatial canvas.

---

## 2. Scope

### In Scope

- **Minimap component** (`src/components/spatial/Minimap.tsx`) -- SVG overlay, fixed 200x150px, bottom-right, `z-40`. Renders district dots with status colors (from `districts.store`), a viewport rectangle derived from camera position/zoom (from `camera.store`), and supports click-to-navigate via `flyTo()`.
- **Semantic breadcrumb** (`src/components/ui/SpatialBreadcrumb.tsx`) -- Derives the current path from camera position and semantic level (e.g., `Launch > TarvaCORE > Status > Run #2847`). Displayed as a status readout with compass arrow separators. Fixed position, top-left, `z-40`. Segments are clickable, triggering `flyTo()` to the corresponding spatial position.
- **Zoom indicator badge** (`src/components/spatial/ZoomIndicator.tsx`) -- Displays the current semantic level as a badge (`Z0`, `Z1`, `Z2`, `Z3`) using `@tarva/ui` `Badge` component with `outline` variant and spatial styling. Fixed position, top-right, `z-40`.
- **Return-to-hub** -- Dual trigger: keyboard hotkey (`Home` key) and center glyph click (coordinates with WS-1.2 hub center). Both invoke `flyTo(0, 0, 0.50)` from the camera store, producing a spring animation to the Launch Atrium default position.
- **Keyboard shortcut infrastructure** -- Global keyboard event listener hook (`useKeyboardShortcuts`) that handles `Home` (return-to-hub), `Cmd+K` / `Ctrl+K` (open command palette), and is extensible for future shortcuts.
- **Command palette stub** -- Uses `@tarva/ui` `CommandDialog` (wrapping `cmdk`). Opens via `Cmd+K`. Phase 1 delivers a structural shell with three hardcoded command groups: Navigation (`go home`, `zoom in`, `zoom out`), Districts (list of 6 app names), and an empty "Ask AI..." placeholder (disabled, labeled "Coming in Phase 3"). Executes navigation commands via camera store actions.
- **HUD container** (`src/components/spatial/NavigationHUD.tsx`) -- Fixed-position container that composes all four instruments. Manages shared concerns: `z-40` stacking, `pointer-events-none` on the container with `pointer-events-auto` on interactive children, and opacity fade during active pan/zoom (via `[data-panning="true"]` attribute from WS-1.1).
- **Reduced motion support** -- All navigation instruments respect `prefers-reduced-motion`. Spring animations for `flyTo()` calls degrade to instant jumps. Minimap viewport rectangle updates without transition.

### Out of Scope

- **Full command palette implementation** (WS-3.3) -- Natural language input, AI Camera Director integration, command synonym ring, "Ask AI..." functionality. This workstream delivers only the structural stub and hardcoded navigation commands.
- **District-level breadcrumb segments** -- Phase 1 breadcrumbs resolve to `Launch` (Z0/Z1), `Launch > {DistrictName}` (Z2), and `Launch > {DistrictName} > {StationName}` (Z3). Station-level segments require WS-2.x district content to provide station metadata.
- **Minimap district layout accuracy** -- Phase 1 minimap renders district dots at approximate positions. Exact layout matching with the spatial canvas requires the full district position data from WS-2.x.
- **Touch/pinch gesture navigation** -- Desktop-first per project constraints.
- **Minimap resize or collapse** -- Fixed 200x150px in Phase 1. Resizable minimap is a Phase 4+ enhancement.
- **URL-driven breadcrumb** -- Breadcrumbs derive from camera store state, not from URL segments. URL sync is the responsibility of WS-1.1's camera URL serialization.

---

## 3. Input Dependencies

| Dependency                 | Source            | What It Provides                                                                                                                                                                                                                                       |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| WS-0.1 Project Scaffolding | Phase 0           | Next.js 16 project structure, `@tarva/ui` installed, Zustand stores created (`camera.store`, `districts.store`, `ui.store`), `cn()` utility, path aliases                                                                                              |
| WS-0.2 Design Tokens Setup | Phase 0           | Spatial tokens (`--color-ember-*`, `--color-teal-*`, `--color-healthy`, `--color-warning`, `--color-error`, `--color-offline`, `--space-hud-inset`, `--glow-ember-subtle`), Tailwind theme extensions, Geist fonts                                     |
| WS-1.1 ZUI Engine          | Phase 1           | Camera store with `offsetX`, `offsetY`, `zoom`, `semanticLevel` state; `flyTo(x, y, zoom)` action with spring animation; `panBy()`, `zoomTo()` actions; `useSemanticZoom()` hook; `[data-panning]` attribute on `SpatialViewport`; viewport dimensions |
| WS-1.2 Launch Atrium       | Phase 1           | Hub center glyph click handler (WS-1.4 provides the `returnToHub()` callback, WS-1.2 wires it to the center glyph `onClick`); district positions for minimap dot placement                                                                             |
| `@tarva/ui` Badge          | Published package | `Badge` component with `variant: 'outline'`, `BadgeProps` type                                                                                                                                                                                         |
| `@tarva/ui` Command        | Published package | `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandShortcut`, `CommandSeparator`                                                                                                                   |
| `@tarva/ui` Breadcrumb     | Published package | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`                                                                                                                                            |
| `districts.store`          | WS-0.1 skeleton   | `districts: Record<string, AppTelemetry>` with `status` field for minimap dot coloring                                                                                                                                                                 |
| `ui.store`                 | WS-0.1 skeleton   | `commandPaletteOpen`, `toggleCommandPalette()`, `setCommandPaletteOpen()`, `selectedDistrictId`                                                                                                                                                        |

---

## 4. Deliverables

### 4.1 NavigationHUD Container

**File:** `src/components/spatial/NavigationHUD.tsx`

Fixed-position overlay that composes all navigation instruments. Sits above the spatial canvas but below modals.

```tsx
'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface NavigationHUDProps {
  children: ReactNode
  className?: string
}

export function NavigationHUD({ children, className }: NavigationHUDProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-40',
        // Fade during active pan/zoom (panning attr set by SpatialViewport)
        '[[data-panning="true"]_&]:opacity-60',
        '[[data-panning="true"]_&]:transition-opacity',
        '[[data-panning="true"]_&]:duration-150',
        className
      )}
      aria-label="Navigation instruments"
      role="region"
    >
      {children}
    </div>
  )
}
```

**Composition in `(launch)/layout.tsx` or `(launch)/page.tsx`:**

```tsx
<NavigationHUD>
  <SpatialBreadcrumb />
  <ZoomIndicator />
  <Minimap />
</NavigationHUD>
<CommandPaletteStub />
```

### 4.2 SVG Minimap

**File:** `src/components/spatial/Minimap.tsx`

An SVG-based overview of the spatial canvas, rendered as a glass panel in the bottom-right corner.

**Component API:**

```tsx
interface MinimapProps {
  /** Width in pixels. Default: 200 */
  width?: number
  /** Height in pixels. Default: 150 */
  height?: number
  className?: string
}
```

**Internal architecture:**

| Element         | SVG Primitive          | Data Source                                         | Behavior                                                                                                                                                        |
| --------------- | ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Background      | `<rect>`               | Static                                              | Glass-styled rect with `--color-deep` fill at 0.80 opacity, `--color-border-subtle` stroke                                                                      |
| District dots   | `<circle>`             | `useDistrictsStore(s => s.districts)`               | 6px diameter, fill color from status (`--color-healthy`, `--color-warning`, `--color-error`, `--color-offline`), positioned proportionally to world coordinates |
| Hub center      | `<circle>`             | Static (0,0)                                        | 4px diameter, `--color-ember` fill, fixed at minimap center                                                                                                     |
| Viewport rect   | `<rect>`               | `useCameraStore(s => ({ offsetX, offsetY, zoom }))` | Translucent rect showing visible area; `--color-ember-bright` stroke at 0.40 opacity, no fill; position and size derived from camera offset and zoom            |
| District labels | `<text>`               | `useDistrictsStore`                                 | 8px Geist Mono, uppercase, `--color-text-tertiary`, 0.50 opacity, positioned below each dot                                                                     |
| Click overlay   | `<rect>` (transparent) | Click handler                                       | Full-size transparent rect capturing clicks; translates minimap click position to world coordinates, calls `flyTo()`                                            |

**Rendering logic:**

```
minimap scale factor = minimap width / world bounds width

dot position on minimap:
  mx = (world_x - world_min_x) * scale_factor
  my = (world_y - world_min_y) * scale_factor

viewport rect on minimap:
  rx = (-offsetX / zoom - viewport_width / 2 / zoom - world_min_x) * scale_factor
  ry = (-offsetY / zoom - viewport_height / 2 / zoom - world_min_y) * scale_factor
  rw = (viewport_width / zoom) * scale_factor
  rh = (viewport_height / zoom) * scale_factor
```

**Click-to-navigate:**

```
on click at minimap position (mx, my):
  world_x = (mx / scale_factor) + world_min_x
  world_y = (my / scale_factor) + world_min_y
  flyTo(world_x, world_y, current_zoom)
```

**Styling:**

| Property       | Value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Position       | Fixed, bottom-right, `--space-hud-inset` (16px) from edges                 |
| Dimensions     | 200 x 150px                                                                |
| Background     | Glass effect: `bg-deep/80`, `backdrop-blur-[8px]`, `border border-white/6` |
| Border radius  | 12px                                                                       |
| Box shadow     | `inset 0 1px 0 0 rgba(255, 255, 255, 0.03)` (glass top-edge highlight)     |
| Pointer events | `pointer-events-auto` (interactive)                                        |

**Typography (per VISUAL-DESIGN-SPEC.md HUD Elements):**

| Element        | Font       | Size | Weight | Tracking | Transform | Opacity |
| -------------- | ---------- | ---- | ------ | -------- | --------- | ------- |
| District label | Geist Mono | 8px  | 500    | 0.14em   | uppercase | 0.5     |

### 4.3 Semantic Breadcrumb

**File:** `src/components/ui/SpatialBreadcrumb.tsx`

A status-readout-style breadcrumb that shows the operator's current semantic position, derived from camera state. Uses `@tarva/ui` Breadcrumb primitives with spatial styling overrides.

**Component API:**

```tsx
interface SpatialBreadcrumbProps {
  className?: string
}
```

**Segment derivation logic:**

| Semantic Level     | Breadcrumb Path                           | Source                                                                       |
| ------------------ | ----------------------------------------- | ---------------------------------------------------------------------------- |
| Z0 (Constellation) | `Launch`                                  | Static                                                                       |
| Z1 (Launch Atrium) | `Launch`                                  | Static                                                                       |
| Z2 (District)      | `Launch > {DistrictName}`                 | `ui.store.selectedDistrictId` -> `districts.store.districts[id].name`        |
| Z3 (Station)       | `Launch > {DistrictName} > {StationName}` | Requires station metadata from WS-2.x; Phase 1 renders placeholder `Station` |

**Segment click behavior:**

| Segment          | Action                                                                |
| ---------------- | --------------------------------------------------------------------- |
| `Launch`         | `flyTo(0, 0, 0.50)` -- return to hub at Z1 default                    |
| `{DistrictName}` | `flyTo(district.x, district.y, 0.90)` -- fly to district center at Z2 |
| `{StationName}`  | No action in Phase 1 (current position)                               |

**Separator:** Custom compass arrow glyph (`>` rendered as a small SVG chevron or `ChevronRight` icon from lucide-react), styled per VISUAL-DESIGN-SPEC.md:

| Element              | Font       | Size | Weight | Tracking | Opacity |
| -------------------- | ---------- | ---- | ------ | -------- | ------- |
| Breadcrumb path text | Geist Mono | 11px | 400    | 0.02em   | 0.55    |
| Breadcrumb separator | Geist Mono | 11px | 400    | 0.04em   | 0.30    |

**Styling:**

| Property       | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| Position       | Fixed, top-left, `--space-hud-inset` (16px) from edges, 48px from top (below any title bar) |
| Pointer events | `pointer-events-auto` on each segment link                                                  |
| Background     | None (transparent overlay on canvas)                                                        |
| Text color     | `--color-text-secondary` for segments, `--color-text-tertiary` for separators               |

**Implementation notes:**

- Uses `@tarva/ui` `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` as structural primitives.
- `BreadcrumbLink` `onClick` handlers call camera store's `flyTo()` instead of navigating to a URL (no `href`). Use the `asChild` prop with a `<button>` to avoid anchor semantics for non-URL navigation.
- `BreadcrumbPage` marks the terminal segment (current location).
- Compass heading text (`9px / 600 / uppercase / tracking 0.10em / opacity 0.40` per VISUAL-DESIGN-SPEC.md) is not included in Phase 1 breadcrumb. It can be added as a secondary readout below the breadcrumb in Phase 2.

### 4.4 Zoom Indicator Badge

**File:** `src/components/spatial/ZoomIndicator.tsx`

Displays the current semantic zoom level as a styled badge.

**Component API:**

```tsx
interface ZoomIndicatorProps {
  className?: string
}
```

**Rendering:**

```tsx
const semanticLevel = useCameraStore((s) => s.semanticLevel)

const LEVEL_LABELS: Record<SemanticLevel, string> = {
  Z0: 'Z0 Constellation',
  Z1: 'Z1 Launch',
  Z2: 'Z2 District',
  Z3: 'Z3 Station',
}
```

Uses `@tarva/ui` `Badge` with `variant="outline"` and spatial class overrides:

```tsx
<Badge
  variant="outline"
  className={cn(
    'pointer-events-auto font-mono text-[10px] font-medium',
    'tracking-[0.06em] uppercase',
    'bg-deep/60 text-text-secondary border-white/8',
    'backdrop-blur-[8px]',
    'duration-transition transition-all'
  )}
  aria-label={`Current zoom level: ${LEVEL_LABELS[semanticLevel]}`}
>
  {semanticLevel}
</Badge>
```

**Styling:**

| Property       | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| Position       | Fixed, top-right, `--space-hud-inset` (16px) from edges                         |
| Pointer events | `pointer-events-auto`                                                           |
| Background     | `bg-deep/60` with `backdrop-blur-[8px]`                                         |
| Border         | `border-white/8`                                                                |
| Font           | Geist Mono, 10px, 500 weight, 0.06em tracking, uppercase                        |
| Transition     | Level text crossfades on semantic level change, `--duration-transition` (300ms) |

**Badge content per level:**

| Level | Short Label | Screen Reader Label                    |
| ----- | ----------- | -------------------------------------- |
| Z0    | `Z0`        | "Current zoom level: Z0 Constellation" |
| Z1    | `Z1`        | "Current zoom level: Z1 Launch"        |
| Z2    | `Z2`        | "Current zoom level: Z2 District"      |
| Z3    | `Z3`        | "Current zoom level: Z3 Station"       |

### 4.5 Keyboard Shortcut Infrastructure

**File:** `src/hooks/useKeyboardShortcuts.ts`

A global keyboard event listener hook that centralizes all spatial keyboard shortcuts.

**Hook API:**

```tsx
interface KeyboardShortcutConfig {
  key: string
  meta?: boolean // Cmd on macOS, Ctrl on Windows/Linux
  shift?: boolean
  handler: () => void
  /** Prevent default browser behavior */
  preventDefault?: boolean
  /** Description for command palette display */
  label: string
}

function useKeyboardShortcuts(shortcuts: KeyboardShortcutConfig[]): void
```

**Phase 1 shortcut map:**

| Key      | Modifier       | Action                                            | Condition                            |
| -------- | -------------- | ------------------------------------------------- | ------------------------------------ |
| `Home`   | None           | `flyTo(0, 0, 0.50)` -- return to hub              | Always active (unless input focused) |
| `k`      | `Cmd` / `Ctrl` | Toggle command palette (`toggleCommandPalette()`) | Always active                        |
| `Escape` | None           | Close command palette if open                     | `commandPaletteOpen === true`        |

**Implementation constraints:**

- Attach listener on `window` via `useEffect` with cleanup.
- Ignore keyboard events when an `<input>`, `<textarea>`, or `[contenteditable]` element is focused (except `Escape`).
- Detect macOS vs other platforms for modifier key display (show `Cmd` on macOS, `Ctrl` elsewhere).
- Export a `getPlatformModifier()` utility for consistent shortcut label rendering.

### 4.6 Command Palette Stub

**File:** `src/components/spatial/CommandPaletteStub.tsx`

A minimal command palette using `@tarva/ui` `CommandDialog`. Phase 1 delivers the shell with hardcoded navigation commands. Phase 3 (WS-3.3) extends this into the full command palette with AI integration.

**Component API:**

```tsx
interface CommandPaletteStubProps {
  className?: string
}
```

**Controlled by:** `ui.store.commandPaletteOpen` and `ui.store.setCommandPaletteOpen()`.

**Command groups:**

| Group      | Heading        | Items                                                                                                                                                                                                       |
| ---------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation | `Navigation`   | `Go Home` (flyTo hub), `Zoom In` (zoomTo current + step), `Zoom Out` (zoomTo current - step)                                                                                                                |
| Districts  | `Districts`    | One item per district from `districts.store` (e.g., "Agent Builder", "Project Room", "Tarva Chat", "TarvaCORE", "TarvaERP", "tarvaCODE"). Selecting a district calls `flyTo(district.x, district.y, 0.90)`. |
| AI         | `AI (Phase 3)` | Single disabled item: "Ask AI..." with subtitle "Natural language camera control -- coming soon"                                                                                                            |

**Implementation using `@tarva/ui` Command components:**

```tsx
<CommandDialog
  open={commandPaletteOpen}
  onOpenChange={setCommandPaletteOpen}
  title="Tarva Launch Command Palette"
>
  <CommandInput placeholder="Navigate, zoom, or jump to a district..." />
  <CommandList>
    <CommandEmpty>No matching commands.</CommandEmpty>

    <CommandGroup heading="Navigation">
      <CommandItem onSelect={handleGoHome}>
        Go Home
        <CommandShortcut>Home</CommandShortcut>
      </CommandItem>
      <CommandItem onSelect={handleZoomIn}>Zoom In</CommandItem>
      <CommandItem onSelect={handleZoomOut}>Zoom Out</CommandItem>
    </CommandGroup>

    <CommandSeparator />

    <CommandGroup heading="Districts">
      {districts.map((d) => (
        <CommandItem key={d.id} onSelect={() => handleGoToDistrict(d)}>
          {d.name}
        </CommandItem>
      ))}
    </CommandGroup>

    <CommandSeparator />

    <CommandGroup heading="AI (Phase 3)">
      <CommandItem disabled>
        Ask AI...
        <CommandShortcut>Coming soon</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

**Glass styling override for `DialogContent`:**

The `CommandDialog` wraps `@tarva/ui` `DialogContent`. Apply spatial glass styling via className overrides on the underlying `DialogContent`:

| Property   | Value                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| Background | `--color-overlay` (`#28313e`) at 0.80 opacity with `backdrop-blur-[24px]`    |
| Border     | `border-white/8`                                                             |
| Box shadow | `inset 0 1px 0 0 rgba(255, 255, 255, 0.04)`, `0 8px 32px rgba(0, 0, 0, 0.5)` |
| Max width  | 480px                                                                        |

### 4.7 Return-to-Hub Action

**File:** Implemented within `useKeyboardShortcuts.ts` and exported as a standalone utility.

**Utility:** `src/lib/spatial-actions.ts`

```tsx
import { useCameraStore } from '@/stores/camera.store'

/** Default hub camera position: center of world at Z1 zoom */
export const HUB_POSITION = { x: 0, y: 0, zoom: 0.5 } as const

/** Fly to the hub center at default Z1 zoom level */
export function returnToHub(): void {
  const { flyTo } = useCameraStore.getState()
  flyTo(HUB_POSITION.x, HUB_POSITION.y, HUB_POSITION.zoom)
}
```

**Trigger sources:**

| Source                    | Mechanism                                                   | Notes                                               |
| ------------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| `Home` key                | `useKeyboardShortcuts` calls `returnToHub()`                | Active unless input is focused                      |
| Hub center glyph click    | WS-1.2 attaches `onClick={returnToHub}` to the center glyph | WS-1.4 exports the function, WS-1.2 wires the click |
| Command palette "Go Home" | `CommandItem onSelect={returnToHub}`                        | Within command palette stub                         |

**Animation:**

- Uses `flyTo()` from camera store (WS-1.1), which implements spring physics (`requestAnimationFrame` loop with spring constant/damping).
- With `prefers-reduced-motion: reduce`, `flyTo()` degrades to an instant position set (no spring animation). This is the responsibility of WS-1.1's `flyTo()` implementation, but this workstream validates the behavior.

---

## 5. Acceptance Criteria

| #     | Criterion                                                                                                                                                  | Verification                                                                    |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| AC-1  | Minimap renders as a 200x150px SVG panel in the bottom-right corner with 16px inset from viewport edges                                                    | Visual inspection at `localhost:3000`                                           |
| AC-2  | Minimap displays district dots colored by status (green/yellow/red/gray for healthy/warning/error/offline)                                                 | Mock district data with mixed statuses; verify dot colors                       |
| AC-3  | Minimap viewport rectangle updates position and size in response to camera pan and zoom                                                                    | Pan and zoom the canvas; confirm the rectangle tracks the visible area          |
| AC-4  | Clicking on the minimap triggers `flyTo()` to the corresponding world position                                                                             | Click a district dot on the minimap; confirm camera animates to that position   |
| AC-5  | Breadcrumb displays `Launch` at Z0 and Z1 semantic levels                                                                                                  | Zoom to Z0 and Z1 ranges; confirm breadcrumb text                               |
| AC-6  | Breadcrumb displays `Launch > {DistrictName}` when a district is selected at Z2                                                                            | Select a district and zoom to Z2; confirm breadcrumb updates                    |
| AC-7  | Clicking a breadcrumb segment triggers `flyTo()` to the corresponding position                                                                             | Click "Launch" segment from Z2 view; confirm camera returns to hub              |
| AC-8  | Zoom indicator badge displays current semantic level (`Z0`, `Z1`, `Z2`, `Z3`) in top-right corner                                                          | Zoom through all levels; confirm badge updates                                  |
| AC-9  | Pressing `Home` key triggers return-to-hub animation (`flyTo(0, 0, 0.50)`)                                                                                 | Press Home from any camera position; confirm spring animation to hub center     |
| AC-10 | `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux) opens the command palette                                                                                       | Press shortcut; confirm CommandDialog opens                                     |
| AC-11 | Command palette lists Navigation, Districts, and AI (Phase 3) groups                                                                                       | Open palette; confirm all three groups render                                   |
| AC-12 | Selecting "Go Home" in command palette triggers return-to-hub                                                                                              | Select item; confirm camera animation                                           |
| AC-13 | Selecting a district name in command palette triggers `flyTo()` to that district                                                                           | Select "Agent Builder"; confirm camera flies to district position               |
| AC-14 | "Ask AI..." item in command palette is disabled and shows "Coming soon"                                                                                    | Open palette; confirm item is non-interactive with disabled styling             |
| AC-15 | `Escape` key closes the command palette when open                                                                                                          | Open palette with `Cmd+K`, press `Escape`; confirm it closes                    |
| AC-16 | All navigation instruments have `z-40` stacking and do not obscure each other                                                                              | Visual inspection with all instruments visible simultaneously                   |
| AC-17 | Keyboard shortcuts are suppressed when an input element is focused                                                                                         | Focus the command palette input; press `Home`; confirm no navigation occurs     |
| AC-18 | With `prefers-reduced-motion: reduce` enabled, return-to-hub uses instant position jump instead of spring animation                                        | Enable reduced motion in OS settings; press `Home`; confirm instant camera move |
| AC-19 | All interactive elements have appropriate ARIA labels                                                                                                      | Screen reader audit of minimap, breadcrumb, zoom badge, command palette         |
| AC-20 | HUD instruments fade to 60% opacity during active pan/zoom and restore to 100% when settled                                                                | Pan the canvas; observe HUD opacity transition                                  |
| AC-21 | `pnpm typecheck` passes with zero errors after all deliverables are added                                                                                  | Run `pnpm typecheck`                                                            |
| AC-22 | Minimap, breadcrumb, and zoom indicator typography matches VISUAL-DESIGN-SPEC.md HUD element specifications (Geist Mono, correct sizes, tracking, opacity) | Visual comparison against spec values                                           |

---

## 6. Decisions Made

| #    | Decision                                                                                                | Rationale                                                                                                                                                                                                                                                                                                                          | Source                                                         |
| ---- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| D-1  | Minimap uses inline SVG (not Canvas or a mapping library)                                               | SVG provides declarative rendering with CSS styling, accessibility (`<title>`, `role`), and click event handling without the complexity of a Canvas 2D context. The minimap content (6 dots + 1 rectangle + labels) is trivially simple for SVG.                                                                                   | Engineering judgment                                           |
| D-2  | Breadcrumb derives path from camera store state, not from URL                                           | The spatial canvas is a client-side ZUI -- there are no route changes when navigating between zoom levels. Camera position (and thus semantic context) is the source of truth for "where am I". URL sync (`?cx=&cy=&cz=`) is handled separately by WS-1.1.                                                                         | AD-1 (Camera State Management), AD-9 (two-route architecture)  |
| D-3  | Command palette stub lives in `src/components/spatial/` not `src/components/ui/`                        | The command palette is tightly coupled to spatial navigation (it calls `flyTo`, reads districts, will integrate AI Camera Director). It is a spatial instrument, not a generic UI component. Phase 3 may extract shared primitives.                                                                                                | AD-9 directory structure                                       |
| D-4  | Use `@tarva/ui` Badge `outline` variant for zoom indicator with spatial class overrides                 | Builds on the design system rather than creating a one-off component. The `outline` variant provides the structural base (border, inline-flex, rounded); spatial classes add glass effect and mono typography.                                                                                                                     | @tarva/ui Badge API (CVA variants)                             |
| D-5  | `Home` key for return-to-hub, not `Space`                                                               | `Space` conflicts with scroll behavior, button activation, and future text input in stations. `Home` is the standard "beginning" key with no common conflicts in web applications. The combined-recommendations.md suggests "Space or Home"; we choose `Home` for safety and add `Space` as a configurable option if needed later. | combined-recommendations.md, keyboard conflict analysis        |
| D-6  | Breadcrumb uses `BreadcrumbLink` with `asChild` and a `<button>` element, not `<a href>`                | Breadcrumb navigation triggers `flyTo()` (a JavaScript action), not a URL change. Using `<button>` instead of `<a>` communicates the correct semantic: this is an action, not a link. Screen readers announce "button" instead of "link", which is more accurate.                                                                  | WCAG 2.2 AA, semantic HTML                                     |
| D-7  | Keyboard shortcuts hook ignores events when input/textarea/contenteditable is focused                   | Standard UX pattern to prevent shortcut interference during text entry. The command palette's own `CommandInput` receives keystrokes normally; global shortcuts resume after the palette closes.                                                                                                                                   | Standard keyboard shortcut UX                                  |
| D-8  | HUD opacity fades to 0.60 during pan/zoom, not hidden entirely                                          | The instruments should remain visible for orientation even during active navigation. Full hide would leave the operator disoriented. 60% opacity reduces visual noise while preserving glanceability.                                                                                                                              | UX judgment, spacial-modal-map.md ("always available, subtle") |
| D-9  | Command palette max width is 480px (not full-width)                                                     | Matches the focused, instrument-panel aesthetic. A narrow palette keeps the spatial canvas visible behind it, reinforcing spatial context. Consistent with standard `Cmd+K` palette proportions (VS Code, Linear, etc.).                                                                                                           | Design precedent                                               |
| D-10 | Minimap world bounds are hardcoded to a reasonable default (e.g., -600 to 600 on both axes) for Phase 1 | The full world extent depends on district positions which are established in WS-1.2 and refined in WS-2.x. A hardcoded bounding box provides a functional minimap immediately; constants can be adjusted as districts are positioned.                                                                                              | Engineering pragmatism                                         |

---

## 7. Open Questions

| #    | Question                                                                                                                                                                                                                                                | Impact                                                                        | Owner                          | Resolution Deadline                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------ | ------------------------------------ |
| OQ-1 | What are the exact world coordinates for each of the 6 district positions? The minimap needs these to render dots accurately. WS-1.2 defines the ring layout (300px radius, 60deg spacing), but are districts at fixed positions or dynamically placed? | Medium -- affects minimap dot placement and breadcrumb district click targets | WS-1.2 owner / React Developer | Before minimap implementation begins |
| OQ-2 | Should the minimap show a label for the overall canvas title (e.g., "LAUNCH" in the corner)? The VISUAL-DESIGN-SPEC.md defines minimap label typography (8px / Geist Mono / uppercase / 0.50 opacity) but does not specify what text to render.         | Low -- cosmetic, can be added after initial implementation                    | UI Designer                    | During implementation                |
| OQ-3 | Should the zoom indicator badge also show the numeric zoom value (e.g., `Z1 0.50x`) in addition to the semantic level? This provides more precise feedback during zoom operations.                                                                      | Low -- can be toggled via a constant or user preference later                 | React Developer                | During implementation                |
| OQ-4 | Does the hub center glyph click handler need to be wired in this workstream, or does WS-1.2 own that integration? This workstream exports `returnToHub()`, but the click binding depends on WS-1.2's glyph component existing.                          | Low -- export the function here, wire in WS-1.2                               | React Developer / WS-1.2 owner | Execution coordination               |
| OQ-5 | Should the command palette be styled with the strong glass effect (`glass-strong`) or the standard glass? The VISUAL-DESIGN-SPEC.md specifies "Heavy glass" for modals/overlays (`blur 24px, bg opacity 0.80`), which matches DialogContent.            | Low -- styling detail, strong glass is the default recommendation per D-9     | UI Designer                    | During implementation                |

---

## 8. Risk Register

| #   | Risk                                                                                                                           | Likelihood | Impact                                             | Mitigation                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | Camera store `flyTo()` not implemented when WS-1.4 begins (WS-1.1 dependency)                                                  | Medium     | High -- all navigation actions depend on `flyTo()` | Stub `flyTo()` with an instant position set (`setPosition(x, y)` + `setZoom(z)`) in the camera store. Replace with spring animation when WS-1.1 delivers. The stub is already partially present in the WS-0.1 camera store skeleton.        |
| R-2 | Minimap viewport rectangle math produces incorrect position/size at extreme zoom levels (Z0 at 0.08x, Z3 at 3.0x)              | Medium     | Medium -- disorienting minimap, but not blocking   | Clamp viewport rectangle to minimap bounds. Add visual indicator when viewport extends beyond the minimap world bounds. Verify math at all four semantic zoom level boundaries.                                                             |
| R-3 | `@tarva/ui` CommandDialog glass styling override conflicts with the library's internal styles                                  | Low        | Low -- visual inconsistency                        | Use Tailwind `className` overrides on the `DialogContent` slot. If needed, wrap `CommandDialog` in a local component that applies spatial classes. The library's `data-slot` attributes provide stable selectors.                           |
| R-4 | Keyboard shortcut `Cmd+K` conflicts with browser address bar focus (Chrome/Firefox default)                                    | Medium     | Medium -- shortcut may not fire                    | Call `event.preventDefault()` in the keyboard handler. This is the standard approach used by VS Code, Linear, Notion, and similar applications. Verify cross-browser.                                                                       |
| R-5 | HUD opacity fade during pan creates visual jitter if the `[data-panning]` attribute toggles rapidly                            | Low        | Low -- cosmetic                                    | Debounce the panning state in WS-1.1 (set to `true` immediately on pan start, set to `false` after 150ms of no input). Use CSS `transition-duration: 150ms` on the HUD container for smooth fade.                                           |
| R-6 | District positions not available when minimap is first rendered (districts.store empty until WS-1.5 telemetry aggregator runs) | High       | Medium -- minimap renders empty                    | Render the minimap with the hub center dot and viewport rectangle even when no districts are loaded. District dots appear progressively as telemetry data arrives. Show a subtle "No data" label if districts remain empty after 5 seconds. |

---

## Appendix A: Execution Checklist

This checklist is for the implementing agent. Execute steps in order.

```
[ ] 1. Verify WS-0.1, WS-0.2 deliverables are in place (project builds, tokens configured)
[ ] 2. Verify camera store has flyTo() or stub it with instant position set
[ ] 3. Create src/lib/spatial-actions.ts (returnToHub utility, HUB_POSITION constant)
[ ] 4. Create src/hooks/useKeyboardShortcuts.ts (global keyboard listener hook)
[ ] 5. Create src/components/spatial/NavigationHUD.tsx (fixed container, z-40)
[ ] 6. Create src/components/spatial/ZoomIndicator.tsx (Badge with semantic level)
[ ] 7. Create src/components/ui/SpatialBreadcrumb.tsx (semantic path from camera state)
[ ] 8. Create src/components/spatial/Minimap.tsx (SVG minimap with district dots + viewport rect)
[ ] 9. Create src/components/spatial/CommandPaletteStub.tsx (cmdk dialog with nav commands)
[ ] 10. Compose all instruments in NavigationHUD within (launch)/page.tsx or (launch)/layout.tsx
[ ] 11. Wire Cmd+K shortcut to toggle command palette via useKeyboardShortcuts
[ ] 12. Wire Home key to returnToHub via useKeyboardShortcuts
[ ] 13. Verify AC-1 through AC-4: Minimap rendering, dots, viewport rect, click-to-navigate
[ ] 14. Verify AC-5 through AC-7: Breadcrumb derivation and click navigation
[ ] 15. Verify AC-8: Zoom indicator updates across all semantic levels
[ ] 16. Verify AC-9 through AC-15: Keyboard shortcuts and command palette
[ ] 17. Verify AC-16: z-40 stacking, no instrument overlap
[ ] 18. Verify AC-17: Shortcut suppression during text input
[ ] 19. Verify AC-18: Reduced motion behavior
[ ] 20. Verify AC-19: ARIA labels and screen reader audit
[ ] 21. Verify AC-20: HUD opacity fade during pan/zoom
[ ] 22. Verify AC-21: pnpm typecheck passes
[ ] 23. Verify AC-22: Typography matches VISUAL-DESIGN-SPEC.md HUD specs
[ ] 24. Commit with message: "feat: add navigation instruments HUD (WS-1.4)"
```

---

## Appendix B: File Manifest

| File                      | Directory                 | Purpose                                                         |
| ------------------------- | ------------------------- | --------------------------------------------------------------- |
| `NavigationHUD.tsx`       | `src/components/spatial/` | Fixed overlay container for all HUD instruments                 |
| `Minimap.tsx`             | `src/components/spatial/` | SVG minimap with district dots and viewport rectangle           |
| `ZoomIndicator.tsx`       | `src/components/spatial/` | Semantic zoom level badge                                       |
| `CommandPaletteStub.tsx`  | `src/components/spatial/` | Command palette shell with navigation commands                  |
| `SpatialBreadcrumb.tsx`   | `src/components/ui/`      | Semantic path breadcrumb derived from camera state              |
| `useKeyboardShortcuts.ts` | `src/hooks/`              | Global keyboard shortcut listener hook                          |
| `spatial-actions.ts`      | `src/lib/`                | Shared spatial action utilities (`returnToHub`, `HUB_POSITION`) |
