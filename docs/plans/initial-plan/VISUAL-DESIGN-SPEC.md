# Tarva Launch -- Visual Design Specification v0.2

**Date:** 2026-02-25
**Context:** Discovery-phase design spec. Implementation-ready values for color, typography, capsule design, effects, and tokens.
**Aesthetic mandate:** Oblivion workstation + NASA mission control + Apple materials/motion.

### Design System Foundation

The Launch builds on **@tarva/ui** — the shared Tarva component library (Radix + Tailwind v4 + CVA). The Launch uses the `tarva-core` color scheme in dark mode as its base palette and extends it with spatial-specific tokens for glows, glass, and ambient effects.

| Layer           | Source                                                                                  | Purpose                                                         |
| --------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Semantic tokens | `@tarva/ui` (`--background`, `--foreground`, `--primary`, `--accent`, `--border`, etc.) | Component styling, text, borders, form elements                 |
| Status tokens   | `@tarva/ui` (`--status-success`, `--status-warning`, `--status-danger`)                 | Health badges, alert indicators                                 |
| Spatial tokens  | Launch-specific (defined in this spec)                                                  | Glow effects, glass materials, ambient motion, luminous borders |

Components imported from `@tarva/ui`: Button, Card, Badge, StatusBadge, Sparkline, KpiCard, Command, Dialog, ScrollArea, Tabs, Tooltip, ThemeProvider, and others as needed. The Launch always runs in dark mode with `tarva-core` color scheme.

---

## 1. COLOR SYSTEM

### 1.1 Background Philosophy

Use **near-black with a subtle blue-violet undertone**, not pure `#000000`. Pure black is flat -- glow effects look garish against it, and it causes OLED "smearing" on some displays. The slight blue-violet creates depth and makes luminous elements feel natural, like light sources in a dark room rather than neon stickers on a black wall.

The Oblivion signature is **neutral-dark surfaces with color coming from glows and accents**, not from the surfaces themselves. Surfaces are nearly colorless; the blue tint is felt more than seen.

### 1.2 Background Scale

These extend @tarva/ui's dark mode `--background: #050911` with additional depth stops for the spatial engine.

| Token             | Hex       | HSL         | @tarva/ui mapping | Use                                 |
| ----------------- | --------- | ----------- | ----------------- | ----------------------------------- |
| `--color-void`    | `#050911` | 220 36% 3%  | `--background`    | Deepest background, infinite canvas |
| `--color-abyss`   | `#0a0f18` | 218 33% 6%  | —                 | Primary canvas background           |
| `--color-deep`    | `#0f161f` | 213 28% 9%  | `--card`          | Panel backgrounds, districts        |
| `--color-surface` | `#121720` | 218 25% 10% | `--popover`       | Cards, capsules at rest             |
| `--color-raised`  | `#1c222b` | 213 18% 14% | `--muted`         | Hover surfaces, elevated cards      |
| `--color-overlay` | `#28313e` | 210 17% 20% | `--secondary`     | Modal backdrops, command palette    |

### 1.3 Border Scale (RGBA for composability over any surface)

| Token                    | Value                       | Use                                         |
| ------------------------ | --------------------------- | ------------------------------------------- |
| `--color-border-faint`   | `rgba(255, 255, 255, 0.03)` | Barely-there grid lines, ambient separators |
| `--color-border-subtle`  | `rgba(255, 255, 255, 0.06)` | Default panel borders                       |
| `--color-border-default` | `rgba(255, 255, 255, 0.08)` | Card borders, capsule borders               |
| `--color-border-strong`  | `rgba(255, 255, 255, 0.12)` | Focused elements, active panels             |
| `--color-border-bright`  | `rgba(255, 255, 255, 0.18)` | Selected elements, hover borders            |

### 1.4 Text Scale

Uses @tarva/ui's `--foreground` (`#def6ff`) as the base, with Launch-specific opacity steps.

| Token                    | Hex       | @tarva/ui mapping    | Use                                        |
| ------------------------ | --------- | -------------------- | ------------------------------------------ |
| `--color-text-primary`   | `#def6ff` | `--foreground`       | Primary text, headings                     |
| `--color-text-secondary` | `#92a9b4` | `--muted-foreground` | Secondary labels, descriptions             |
| `--color-text-tertiary`  | `#55667a` | —                    | Ambient labels, metadata                   |
| `--color-text-ghost`     | `#2a3545` | —                    | Decorative text, barely visible watermarks |

### 1.5 Accent System: Ember (Primary) + Teal (Secondary)

The Launch uses a **dual-accent system** derived from @tarva/ui's `tarva-core` color scheme:

- **Ember** (warm orange): Primary luminous accent — glows, selected states, hub center breathing, interactive elements. This is @tarva/ui's `--primary` extended into a luminous scale.
- **Teal** (cool complement): Secondary accent — telemetry data highlights, info states, cool contrast against the warm primary. This is @tarva/ui's `--accent` extended into a luminous scale.

The dual warm/cool pairing creates more visual depth than a single accent and stays true to the Tarva brand identity (orange/teal). The Oblivion aesthetic works equally well with warm luminous accents — the key is that _surfaces are dark and color comes from light emission_.

**Ember (Primary Luminous):**

| Token                  | Hex       | @tarva/ui   | Use                                           |
| ---------------------- | --------- | ----------- | --------------------------------------------- |
| `--color-ember-dim`    | `#3a1f00` | —           | Large area tints, subtle fills                |
| `--color-ember-muted`  | `#7a3d00` | —           | Borders, inactive interactive elements        |
| `--color-ember`        | `#e05200` | `--primary` | Primary accent, buttons, links, active states |
| `--color-ember-bright` | `#ff773c` | `--ring`    | Focused elements, hover states                |
| `--color-ember-glow`   | `#ffaa70` | —           | Glow cores, text on dark, highlights          |
| `--color-ember-white`  | `#ffd4b3` | —           | Maximum intensity, flash effects              |

**Teal (Secondary Luminous):**

| Token                 | Hex       | @tarva/ui  | Use                               |
| --------------------- | --------- | ---------- | --------------------------------- |
| `--color-teal-dim`    | `#0f2830` | —          | Telemetry area tints              |
| `--color-teal-muted`  | `#1a4a5a` | —          | Data borders, chart accents       |
| `--color-teal`        | `#277389` | `--accent` | Telemetry highlights, info accent |
| `--color-teal-bright` | `#3a99b8` | —          | Focused telemetry elements        |
| `--color-teal-glow`   | `#60c8e8` | —          | Data glow cores                   |
| `--color-teal-white`  | `#a0e4f4` | —          | Maximum cool intensity            |

**When to use which accent:**

- Ember: User actions (selection, navigation, approval), hub center, capsule borders, receipt stamps, scanlines
- Teal: Data visualization (sparklines, charts, metric values), telemetry labels, informational highlights
- Combined: The hub center glyph can alternate between ember (breathing) and teal (data pulse) to signal system activity

### 1.6 Status Colors

Each status has a **main** (from @tarva/ui), **dim** (for large fills), and **glow** (for luminous effects).

**Operational / Online:** (based on @tarva/ui `--status-success: #22c55e`)

| Token                  | Hex       | @tarva/ui          |
| ---------------------- | --------- | ------------------ |
| `--color-healthy-dim`  | `#0a2e1a` | —                  |
| `--color-healthy`      | `#22c55e` | `--status-success` |
| `--color-healthy-glow` | `#4ade80` | `--capacity-low`   |

**Warning / Degraded:** (based on @tarva/ui `--status-warning: #eab308`)

| Token                  | Hex       | @tarva/ui           |
| ---------------------- | --------- | ------------------- |
| `--color-warning-dim`  | `#3a2a0d` | —                   |
| `--color-warning`      | `#eab308` | `--status-warning`  |
| `--color-warning-glow` | `#facc15` | `--capacity-medium` |

**Error / Down:** (based on @tarva/ui `--status-danger: #ef4444`)

| Token                | Hex       | @tarva/ui             |
| -------------------- | --------- | --------------------- |
| `--color-error-dim`  | `#3a1218` | —                     |
| `--color-error`      | `#ef4444` | `--status-danger`     |
| `--color-error-glow` | `#f87171` | `--capacity-critical` |

**Offline / Unknown:**

| Token                  | Hex       | @tarva/ui          |
| ---------------------- | --------- | ------------------ |
| `--color-offline-dim`  | `#18181f` | —                  |
| `--color-offline`      | `#6b7280` | `--status-neutral` |
| `--color-offline-glow` | `#9ca3af` | `--status-muted`   |

### 1.7 Glass Effect Recipes

Glass effects use neutral white for the base surface (not tinted with accent colors). The accent color appears only in the glow emission from borders and shadows.

**Standard Glass Panel** (capsules, side panels):

```css
.glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.03);
}
```

**Active Glass Panel** (focused/selected — ember tinted border glow):

```css
.glass-active {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
    0 0 1px 0 rgba(224, 82, 0, 0.3); /* ember tint */
}
```

**Strong Glass Panel** (modals, overlays):

```css
.glass-strong {
  background: rgba(15, 22, 31, 0.8); /* matches --color-deep */
  backdrop-filter: blur(24px) saturate(140%);
  -webkit-backdrop-filter: blur(24px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.04),
    0 8px 32px rgba(0, 0, 0, 0.5);
}
```

### 1.8 Glow Effect Recipes

Three intensity levels using ember (orange) as the primary luminous color. Each uses layered box-shadows for natural light falloff.

**Glow Subtle** (ambient/resting state):

```css
.glow-subtle {
  box-shadow:
    0 0 12px rgba(224, 82, 0, 0.08),
    /* ember outer haze */ 0 0 4px rgba(224, 82, 0, 0.12); /* ember core */
}
```

**Glow Medium** (hover/focus):

```css
.glow-medium {
  box-shadow:
    0 0 20px rgba(224, 82, 0, 0.12),
    /* ember outer haze */ 0 0 8px rgba(255, 119, 60, 0.22),
    /* ember-bright core */ 0 0 2px rgba(255, 170, 112, 0.35); /* ember-glow hot center */
}
```

**Glow Bright** (selected/active):

```css
.glow-bright {
  box-shadow:
    0 0 40px rgba(224, 82, 0, 0.18),
    0 0 16px rgba(255, 119, 60, 0.3),
    0 0 4px rgba(255, 170, 112, 0.5);
}
```

**Luminous Border** (border that appears to emit ember light):

```css
.luminous-border {
  border: 1px solid rgba(224, 82, 0, 0.25);
  box-shadow:
    0 0 8px rgba(224, 82, 0, 0.12),
    inset 0 0 8px rgba(224, 82, 0, 0.04);
}
```

**Teal Glow** (for telemetry/data elements):

```css
.glow-teal-subtle {
  box-shadow:
    0 0 12px rgba(39, 115, 137, 0.1),
    0 0 4px rgba(58, 153, 184, 0.15);
}
.glow-teal-medium {
  box-shadow:
    0 0 20px rgba(39, 115, 137, 0.15),
    0 0 8px rgba(96, 200, 232, 0.25);
}
```

**Status Glow** (use status color RGB values):

```css
.glow-healthy {
  box-shadow:
    0 0 16px rgba(34, 197, 94, 0.15),
    0 0 4px rgba(74, 222, 128, 0.3);
}
.glow-warning {
  box-shadow:
    0 0 16px rgba(234, 179, 8, 0.15),
    0 0 4px rgba(250, 204, 21, 0.3);
}
.glow-error {
  box-shadow:
    0 0 16px rgba(239, 68, 68, 0.15),
    0 0 4px rgba(248, 113, 113, 0.3);
}
```

---

## 2. CAPSULE DESIGN

### 2.1 Shape and Dimensions

**Shape:** Rounded rectangle with generous radius -- a "squircle" feel. This is the most practical shape for mission-control data density while maintaining the Apple materials aesthetic. Not circles (too icon-like, wastes space), not hexagons (too generic sci-fi).

**Dimensions at Z1 (default Launch Atrium view):**

| Property         | Value                   | Notes                                                 |
| ---------------- | ----------------------- | ----------------------------------------------------- |
| Width            | 192px                   | Narrower than wide creates instrument-panel feel      |
| Height           | 228px                   | Portrait proportion, roughly 1:1.19 ratio             |
| Border radius    | 28px                    | Large enough to feel organic, not boxy                |
| Ring radius      | 300px                   | Center of hub to center of capsule                    |
| Ring arrangement | 6 capsules, 60deg apart | Even distribution, top capsule at 270deg (12 o'clock) |

**Dimensions at other zoom levels:**

| Zoom Level             | Capsule Appearance                                            |
| ---------------------- | ------------------------------------------------------------- |
| Z0 Constellation       | 40x40px luminous dot + 9px label below. No detail.            |
| Z1 Launch (default)    | Full 192x228px with all content                               |
| Z2 District (selected) | Selected capsule expands to ~380x460px, unfurls into stations |
| Z3 Station             | Capsule is no longer visible; workspace is station-level      |

### 2.2 Internal Content Layout

Within the 192x228px capsule (20px padding on all sides, leaving 152x188px content area):

```
+----------------------------------+
|          APP NAME (11px)         |  <- 20px from top, centered
|     [====== HEALTH BAR ======]   |  <- 3px tall bar, 8px below name
|                                  |
|  ACTIVE RUNS          LABEL      |  <- telemetry block starts
|  3                     VALUE     |     44px below health bar
|                                  |
|  P95 LATENCY                     |  <- 28px spacing between rows
|  142ms                           |
|                                  |
|  ALERTS                          |
|  0                               |
|                                  |
|  ~~~ ambient sparkline ~~~       |  <- bottom 32px, decorative
+----------------------------------+
```

**Content zones:**

| Zone      | Height | Content                                     |
| --------- | ------ | ------------------------------------------- |
| Header    | 36px   | App name (uppercase, tracking) + health bar |
| Telemetry | 120px  | 3 key-value pairs, stacked                  |
| Ambient   | 32px   | Tiny sparkline or particle micro-animation  |

**Telemetry values within capsule:**

- Label: 10px, `--color-text-tertiary`, uppercase, tracking 0.06em, Geist Sans
- Value: 16px, `--color-text-primary`, Geist Mono, tabular-nums, font-weight 500
- Spacing between pairs: 24px

### 2.3 Hover State ("Focus Lens")

| Property                | Resting                 | Hover                   | Duration  | Easing                     |
| ----------------------- | ----------------------- | ----------------------- | --------- | -------------------------- |
| Scale                   | 1.0                     | 1.12                    | 200ms     | cubic-bezier(0, 0, 0.2, 1) |
| Background              | rgba(255,255,255, 0.03) | rgba(255,255,255, 0.06) | 200ms     | ease-out                   |
| Border                  | rgba(255,255,255, 0.06) | rgba(255,255,255, 0.12) | 200ms     | ease-out                   |
| Box-shadow              | glow-subtle             | glow-medium             | 200ms     | ease-out                   |
| Telemetry label opacity | 0.4                     | 0.7                     | 200ms     | ease-out                   |
| Telemetry value opacity | 0.7                     | 1.0                     | 200ms     | ease-out                   |
| Z-index                 | auto                    | 10                      | immediate | --                         |

The 12% scale increase grows the capsule from 192x228 to ~215x255. This is enough to feel responsive without disrupting the ring layout.

### 2.4 Selected State (Before Morph)

The selection has a 2-phase visual treatment:

**Phase 1: Lock-on pulse (0-200ms)**

- Border snaps to `--color-ember-bright` at 0.35 opacity
- A brief scale pulse: 1.0 -> 1.05 -> 1.0 over 200ms using `--ease-bounce`
- Glow jumps to `glow-bright`
- A single scanline sweeps across the capsule (top to bottom, 200ms)

**Phase 2: Morph begins (200ms-800ms)**

- Selected capsule translates toward viewport center
- Other capsules drift outward with opacity fading to 0.3
- Selected capsule begins expanding (scale 1.0 -> 2.0 over 600ms, eased with `--ease-morph`)
- Glow expands with the capsule, spread radius doubles
- Internal content crossfades to "district" layout

### 2.5 Offline State

The goal: a capsule that looks "powered down" but still beautiful -- like a dormant instrument.

| Property                | Online                  | Offline                                                 |
| ----------------------- | ----------------------- | ------------------------------------------------------- |
| Overall opacity         | 1.0                     | 0.40                                                    |
| Saturation (CSS filter) | none                    | saturate(0.15)                                          |
| Health bar color        | status color            | `--color-offline`                                       |
| Telemetry values        | live data               | `--` or `OFFLINE` in `--color-text-ghost`               |
| Background              | rgba(255,255,255, 0.03) | rgba(255,255,255, 0.015)                                |
| Border                  | rgba(255,255,255, 0.06) | rgba(255,255,255, 0.03)                                 |
| Glow                    | glow-subtle             | none                                                    |
| Ambient sparkline       | animated                | replaced with static noise texture at 0.05 opacity      |
| Hover                   | normal focus-lens       | reduced: scale 1.06, no glow, border brightens slightly |

---

## 3. TYPOGRAPHY

### 3.1 Font Selection

**Primary (labels, headings, UI):** Geist Sans

- Rationale: Geometric grotesk that reads as technical-but-clean. Ships with Next.js ecosystem. Has the right "systems" feel without being cold. Slightly warmer than Inter, more technical than SF Pro.

**Data (telemetry, code, receipts):** Geist Mono

- Rationale: Perfect pairing with Geist Sans. Monospace with tabular figures by default. Clear at small sizes.

**Fallback chain:** `'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` and `'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace`

### 3.2 Type Scale by Zoom Level

**Z0 -- Constellation (very zoomed out):**

| Element      | Font       | Size | Weight | Tracking | Transform | Opacity |
| ------------ | ---------- | ---- | ------ | -------- | --------- | ------- |
| Beacon label | Geist Sans | 9px  | 600    | 0.12em   | uppercase | 0.7     |

**Z1 -- Launch Atrium (default landing):**

| Element                 | Font       | Size | Weight | Tracking | Transform | Opacity | Line Height |
| ----------------------- | ---------- | ---- | ------ | -------- | --------- | ------- | ----------- |
| Capsule app name        | Geist Sans | 11px | 600    | 0.08em   | uppercase | 0.9     | 1.0         |
| Capsule telemetry label | Geist Sans | 10px | 400    | 0.06em   | uppercase | 0.4     | 1.0         |
| Capsule telemetry value | Geist Mono | 16px | 500    | 0        | none      | 0.8     | 1.0         |
| Launch center label     | Geist Sans | 12px | 500    | 0.04em   | uppercase | 0.6     | 1.0         |

**Z2 -- District (app-focused):**

| Element          | Font       | Size | Weight | Tracking | Transform | Opacity | Line Height |
| ---------------- | ---------- | ---- | ------ | -------- | --------- | ------- | ----------- |
| District heading | Geist Sans | 15px | 600    | 0.04em   | uppercase | 0.9     | 1.2         |
| Station header   | Geist Sans | 13px | 600    | 0.03em   | uppercase | 0.85    | 1.2         |
| Station body     | Geist Sans | 13px | 400    | 0        | none      | 0.75    | 1.5         |
| Data value       | Geist Mono | 14px | 500    | 0        | none      | 0.85    | 1.3         |
| Data label       | Geist Sans | 11px | 400    | 0.04em   | uppercase | 0.5     | 1.0         |

**Z3 -- Station (task level):**

| Element       | Font       | Size | Weight | Tracking | Transform | Opacity | Line Height |
| ------------- | ---------- | ---- | ------ | -------- | --------- | ------- | ----------- |
| Panel heading | Geist Sans | 16px | 600    | 0.02em   | none      | 1.0     | 1.3         |
| Panel body    | Geist Sans | 14px | 400    | 0        | none      | 0.85    | 1.6         |
| Table header  | Geist Sans | 11px | 600    | 0.04em   | uppercase | 0.6     | 1.0         |
| Table data    | Geist Mono | 13px | 400    | 0        | none      | 0.8     | 1.4         |
| Table number  | Geist Mono | 13px | 500    | 0        | none      | 0.85    | 1.4         |
| Button label  | Geist Sans | 13px | 500    | 0.01em   | none      | 1.0     | 1.0         |
| Input text    | Geist Sans | 14px | 400    | 0        | none      | 1.0     | 1.4         |

**HUD Elements (always visible, viewport-relative):**

| Element              | Font       | Size | Weight | Tracking | Transform | Opacity |
| -------------------- | ---------- | ---- | ------ | -------- | --------- | ------- |
| Minimap label        | Geist Mono | 8px  | 500    | 0.14em   | uppercase | 0.5     |
| Breadcrumb path      | Geist Mono | 11px | 400    | 0.02em   | none      | 0.55    |
| Breadcrumb separator | Geist Mono | 11px | 400    | 0.04em   | none      | 0.3     |
| Compass heading      | Geist Sans | 9px  | 600    | 0.10em   | uppercase | 0.4     |
| Coordinate display   | Geist Mono | 10px | 400    | 0.06em   | none      | 0.35    |

### 3.3 Telemetry Value Rendering

All numeric telemetry values must use:

```css
font-variant-numeric: tabular-nums;
font-feature-settings: 'tnum' 1;
```

This ensures digits have uniform width so values do not shift horizontally when numbers change (e.g., `142ms` to `1,423ms`). Geist Mono provides tabular figures by default, but explicitly set the feature for safety.

### 3.4 Receipt Stamp Typography

The "AUTH OK / TRACE: 7F2A" readout style:

```css
.receipt-stamp {
  font-family: 'Geist Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-ember-bright);
  opacity: 0.75;
}

.receipt-stamp .separator {
  opacity: 0.35;
  margin: 0 0.4em;
}

.receipt-stamp .trace-id {
  color: var(--color-ember-glow);
  opacity: 0.9;
}

.receipt-stamp .timestamp {
  color: var(--color-text-secondary);
  opacity: 0.6;
}
```

**Example rendering:**
`AUTH OK` `/` `TRACE: 7F2A` `/` `2026-02-25T15:42:18Z`

Where `/` separators are dimmer, the TRACE ID is brightest, and the timestamp is most muted.

---

## 4. GLASS AND GLOW EFFECTS -- DEEP DIVE

### 4.1 Glass Panel Implementation

The Oblivion aesthetic uses glass that is **more surface than transparency**. Unlike Apple's high-blur vibrancy that shows content through the glass, Oblivion glass is a dark, barely-transparent panel that hints at depth without revealing what's behind it.

**Blur values by panel type:**

| Panel Type     | Blur | BG Opacity    | Saturate | Use                                     |
| -------------- | ---- | ------------- | -------- | --------------------------------------- |
| Ambient glass  | 8px  | 0.02          | 110%     | Background panels, decorative           |
| Standard glass | 12px | 0.04          | 120%     | Capsules, side panels                   |
| Active glass   | 16px | 0.07          | 130%     | Selected panels, focused cards          |
| Heavy glass    | 24px | 0.80 (tinted) | 140%     | Modals, overlays (tinted bg, not white) |

**The top-edge highlight:** Every glass panel gets a 1px inset shadow at the top edge to simulate a light reflection:

```css
box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.03);
```

This is extremely subtle but creates the "physical surface" illusion.

### 4.2 Glow Implementation Details

**Why box-shadow, not filter: drop-shadow:**

- `box-shadow` is composited by the GPU during paint, does not affect layout, and supports `inset`
- `filter: drop-shadow()` forces the element into its own compositing layer and is applied per-pixel, which is more expensive
- `box-shadow` supports multiple layers in a single declaration, which is how we build natural light falloff

**The 3-layer glow technique:**
Every glow uses 3 box-shadow layers to simulate real light:

1. **Outer haze** -- large radius, very low opacity (the "atmosphere")
2. **Core bloom** -- medium radius, medium opacity (the visible glow)
3. **Hot center** -- small radius, high opacity (the bright edge)

```css
/* Example: ember accent glow at medium intensity */
box-shadow:
  0 0 24px rgba(224, 82, 0, 0.1),
  /* outer haze */ 0 0 8px rgba(224, 82, 0, 0.22),
  /* core bloom */ 0 0 2px rgba(255, 170, 112, 0.4); /* hot center */
```

### 4.3 Glow Performance During Pan/Zoom

**Critical performance rules:**

1. **Promote the canvas container to its own layer:**

   ```css
   .canvas-viewport {
     will-change: transform;
     contain: layout style;
   }
   ```

2. **Avoid backdrop-filter on moving elements.** Backdrop-filter is expensive because it reads pixels behind the element. Elements on the infinite canvas that move during pan should not use backdrop-filter. Instead, use a solid (but very dark, nearly opaque) background as a fallback during pan/zoom, and only enable backdrop-filter when the canvas is at rest.

3. **Simplify glows during active pan/zoom.** Detect pan/zoom state (e.g., `[data-panning="true"]` on the canvas container) and reduce glow to a single-layer shadow:

   ```css
   [data-panning='true'] .capsule {
     box-shadow: 0 0 8px rgba(224, 82, 0, 0.1);
     backdrop-filter: none;
   }
   ```

4. **Use CSS containment on capsules:**

   ```css
   .capsule {
     contain: layout style paint;
   }
   ```

5. **Particle system during pan/zoom:** Pause CSS animations on particles during active pan. Resume after 150ms of no pan input (debounced).

6. **Use `transform` for all movement.** Never animate `top`, `left`, `margin`, or `width/height`. All capsule repositioning, scaling, and morphing must use `transform: translate() scale()`.

### 4.4 Luminous Border Detail

The "emitting light" border illusion requires three visual layers:

```css
.luminous-border {
  /* 1. The visible border itself */
  border: 1px solid rgba(224, 82, 0, 0.25);

  /* 2. Outer glow that bleeds past the border */
  /* 3. Inner glow that bleeds inward from the border */
  box-shadow:
    0 0 10px rgba(224, 82, 0, 0.1),
    /* outer bleed */ 0 0 3px rgba(224, 82, 0, 0.18),
    /* tight outer */ inset 0 0 10px rgba(224, 82, 0, 0.04),
    /* inner bleed */ inset 0 0 2px rgba(224, 82, 0, 0.08); /* tight inner */
}
```

The key insight: **the border color must match the glow color** exactly (same hue/saturation, only opacity differs). If they mismatch, the illusion of emission breaks.

---

## 5. LIVING DETAILS -- VISUAL SPEC

### 5.1 Particle Drift

| Property            | Value                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Count               | 18 particles (15-20 range)                                                                                                                      |
| Implementation      | Individual `<div>` elements with CSS `@keyframes`, or a single `<canvas>` overlay for better perf                                               |
| Size distribution   | 60% at 1.5px, 25% at 2.5px, 15% at 4px (circles, `border-radius: 50%`)                                                                          |
| Color               | `--color-ember` (all particles same hue — warm orange)                                                                                          |
| Opacity range       | 0.04 to 0.20, each particle has a unique random base opacity                                                                                    |
| Motion style        | **Brownian drift** -- not straight lines. Each particle's `@keyframes` has 6-8 waypoints spread across the viewport, creating a meandering path |
| Speed               | 0.3 to 1.5 px/second apparent velocity. Larger particles move slower (depth cue).                                                               |
| Animation duration  | 30s to 60s per full cycle (each particle unique)                                                                                                |
| Animation timing    | `linear` (constant velocity between waypoints, direction changes are the "drift")                                                               |
| Z-index             | Above background grid, below all UI elements                                                                                                    |
| Parallax during pan | Particles at 0.3x pan rate (creates subtle depth)                                                                                               |
| Opacity animation   | Each particle independently oscillates opacity within its range over a 8-12s sub-cycle                                                          |

**Example CSS for one particle:**

```css
.particle-3 {
  position: absolute;
  width: 2.5px;
  height: 2.5px;
  border-radius: 50%;
  background: var(--color-ember);
  opacity: 0.12;
  animation:
    drift-3 42s linear infinite,
    shimmer-3 9s ease-in-out infinite;
  will-change: transform, opacity;
  pointer-events: none;
}

@keyframes drift-3 {
  0% {
    transform: translate(120px, 340px);
  }
  14% {
    transform: translate(280px, 190px);
  }
  28% {
    transform: translate(450px, 410px);
  }
  42% {
    transform: translate(310px, 580px);
  }
  57% {
    transform: translate(140px, 500px);
  }
  71% {
    transform: translate(350px, 250px);
  }
  85% {
    transform: translate(500px, 380px);
  }
  100% {
    transform: translate(120px, 340px);
  }
}

@keyframes shimmer-3 {
  0%,
  100% {
    opacity: 0.08;
  }
  50% {
    opacity: 0.18;
  }
}
```

### 5.2 Heartbeat Ticks

| Property            | Value                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Location            | Inside each capsule: the 3px health indicator bar. Also on the hub center glyph.                                   |
| Cycle duration      | 6s to 8s (each capsule staggered by 1.2s to prevent sync)                                                          |
| Pulse manifestation | **Opacity**: 0.35 -> 0.55 -> 0.35. **Scale Y**: 1.0 -> 1.8 -> 1.0 (bar goes from 3px to ~5.4px height, then back). |
| Pulse shape         | A single "bump" per cycle, not a continuous sine wave. Sharp rise (30% of cycle), slow fall (70% of cycle).        |
| Easing              | `cubic-bezier(0.4, 0, 0.2, 1)` for the rise, `cubic-bezier(0.0, 0, 0.6, 1)` for the fall                           |
| Color               | Matches the capsule's status color (healthy/warning/error)                                                         |

**Example CSS:**

```css
.health-bar {
  width: 100%;
  height: 3px;
  border-radius: 1.5px;
  background: var(--status-color);
  opacity: 0.35;
  transform-origin: center center;
  animation: heartbeat 7s var(--heartbeat-delay, 0s) infinite;
}

@keyframes heartbeat {
  0%,
  100% {
    opacity: 0.35;
    transform: scaleY(1);
  }
  12% {
    opacity: 0.55;
    transform: scaleY(1.8);
  }
  30% {
    opacity: 0.4;
    transform: scaleY(1.1);
  }
}
```

Stagger with per-capsule CSS variable:

```css
.capsule:nth-child(1) .health-bar {
  --heartbeat-delay: 0s;
}
.capsule:nth-child(2) .health-bar {
  --heartbeat-delay: 1.2s;
}
.capsule:nth-child(3) .health-bar {
  --heartbeat-delay: 2.4s;
}
.capsule:nth-child(4) .health-bar {
  --heartbeat-delay: 3.6s;
}
.capsule:nth-child(5) .health-bar {
  --heartbeat-delay: 4.8s;
}
.capsule:nth-child(6) .health-bar {
  --heartbeat-delay: 6s;
}
```

### 5.3 Launch Center Glow Breathing

| Property | Value                                                              |
| -------- | ------------------------------------------------------------------ |
| Element  | The central hub glyph/logo area                                    |
| Cycle    | 5s                                                                 |
| Glow min | `0 0 20px rgba(224, 82, 0, 0.06), 0 0 8px rgba(224, 82, 0, 0.10)`  |
| Glow max | `0 0 48px rgba(224, 82, 0, 0.14), 0 0 16px rgba(224, 82, 0, 0.22)` |
| Easing   | `ease-in-out` (natural breathing)                                  |

```css
.hub-center {
  animation: breathe 5s ease-in-out infinite;
}

@keyframes breathe {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(224, 82, 0, 0.06),
      0 0 8px rgba(224, 82, 0, 0.1);
  }
  50% {
    box-shadow:
      0 0 48px rgba(224, 82, 0, 0.14),
      0 0 16px rgba(224, 82, 0, 0.22);
  }
}
```

### 5.4 Grid Pulse

| Property       | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Grid type      | Dot grid (not lines -- dots are subtler and more "technical") |
| Grid spacing   | 48px between dots                                             |
| Dot size       | 1px                                                           |
| Base color     | `rgba(255, 255, 255, 0.015)` (nearly invisible)               |
| Pulse peak     | `rgba(255, 255, 255, 0.04)` (still very subtle)               |
| Pulse cycle    | 12s                                                           |
| Pulse style    | A radial wave expanding from the hub center outward           |
| Wave speed     | Covers full viewport radius in ~3s                            |
| Implementation | CSS radial-gradient animation on a positioned overlay         |

```css
.grid-pulse-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(
    circle at var(--pulse-x, 50%) var(--pulse-y, 50%),
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.015) 30%,
    rgba(255, 255, 255, 0.015) 100%
  );
  animation: grid-pulse 12s ease-out infinite;
  opacity: 0;
}

@keyframes grid-pulse {
  0% {
    opacity: 0;
    background-size: 0% 0%;
  }
  5% {
    opacity: 1;
    background-size: 10% 10%;
  }
  40% {
    opacity: 0.6;
    background-size: 200% 200%;
  }
  100% {
    opacity: 0;
    background-size: 400% 400%;
  }
}
```

### 5.5 Scanlines

| Property    | Value                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------- |
| Trigger     | State change events only: capsule selection, district transition, receipt stamp, auth latch |
| Direction   | Horizontal, top to bottom                                                                   |
| Line count  | 1 primary + 2 trailing ghost lines                                                          |
| Speed       | 350ms to traverse the triggering element's height                                           |
| Color       | `--color-ember` at opacity 0.12 (primary), 0.06 and 0.03 (ghosts)                           |
| Line height | 1px (primary), 1px (ghosts, spaced 3px and 6px behind)                                      |
| Blur        | Primary has `box-shadow: 0 0 4px rgba(224, 82, 0, 0.10)`                                    |
| Scope       | Clips to the triggering element (overflow: hidden on container)                             |

```css
.scanline-trigger {
  position: relative;
  overflow: hidden;
}

.scanline {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-ember);
  opacity: 0.12;
  box-shadow: 0 0 4px rgba(224, 82, 0, 0.1);
  transform: translateY(-10px);
  pointer-events: none;
}

.scanline.active {
  animation: scan 350ms ease-out forwards;
}

.scanline-ghost-1 {
  opacity: 0.06;
  animation-delay: 30ms;
}

.scanline-ghost-2 {
  opacity: 0.03;
  animation-delay: 60ms;
}

@keyframes scan {
  0% {
    transform: translateY(-2px);
  }
  100% {
    transform: translateY(var(--scan-height, 228px));
  }
}
```

### 5.6 Film Grain / Noise

| Property       | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| Intensity      | Extremely subtle -- below conscious perception for most users                           |
| Implementation | **SVG filter** applied to a full-screen overlay div (most performant, no canvas needed) |
| Grain style    | Static (no animation). Animated grain is distracting and expensive.                     |
| Blend mode     | `mix-blend-mode: overlay`                                                               |
| Opacity        | 0.035                                                                                   |
| Layer          | Absolute bottom of the stack, below even the grid                                       |
| Grain scale    | Fine (1-2px apparent size)                                                              |

```html
<svg style="position:absolute;width:0;height:0">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
  </filter>
</svg>
```

```css
.noise-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999; /* above everything */
  filter: url(#noise);
  mix-blend-mode: overlay;
  opacity: 0.035;
}
```

**Alternative for better performance** (pre-baked noise texture):
A 200x200px noise PNG tiled as `background-image: url(noise.png)`, with `background-size: 200px 200px`, `mix-blend-mode: overlay`, `opacity: 0.04`. This is cheaper than the SVG filter on lower-end machines.

---

## 6. DESIGN TOKENS

### 6.1 CSS Custom Properties (Full Set)

```css
:root {
  /* ============================================================
     BACKGROUND SCALE (from @tarva/ui tarva-core dark mode)
     ============================================================ */
  --color-void: #050911; /* @tarva/ui --background */
  --color-abyss: #0a0f18;
  --color-deep: #0f161f; /* @tarva/ui --card */
  --color-surface: #121720;
  --color-raised: #1c222b; /* @tarva/ui --muted */
  --color-overlay: #28313e;

  /* ============================================================
     BORDER SCALE (from @tarva/ui --border: #232933)
     ============================================================ */
  --color-border-faint: rgba(255, 255, 255, 0.03);
  --color-border-subtle: rgba(255, 255, 255, 0.06);
  --color-border-default: #232933; /* @tarva/ui --border */
  --color-border-strong: rgba(255, 255, 255, 0.12);
  --color-border-bright: rgba(255, 255, 255, 0.18);

  /* ============================================================
     TEXT SCALE (from @tarva/ui tarva-core dark mode)
     ============================================================ */
  --color-text-primary: #def6ff; /* @tarva/ui --foreground */
  --color-text-secondary: #92a9b4; /* @tarva/ui --muted-foreground */
  --color-text-tertiary: #55667a;
  --color-text-ghost: #33445a;

  /* ============================================================
     ACCENT: EMBER (Primary — from @tarva/ui --primary: #e05200)
     ============================================================ */
  --color-ember-dim: #3a1800;
  --color-ember-muted: #7a3000;
  --color-ember: #e05200; /* @tarva/ui --primary */
  --color-ember-bright: #ff773c; /* @tarva/ui --ring */
  --color-ember-glow: #ffaa70;
  --color-ember-white: #ffd4b8;

  /* ============================================================
     ACCENT: TEAL (Secondary — from @tarva/ui --accent: #277389)
     ============================================================ */
  --color-teal-dim: #0f2a35;
  --color-teal-muted: #1a4d5e;
  --color-teal: #277389; /* @tarva/ui --accent */
  --color-teal-bright: #3a9ab5;
  --color-teal-glow: #5ec4de;
  --color-teal-white: #a8e0ef;

  /* ============================================================
     STATUS: HEALTHY (from @tarva/ui --status-success: #22c55e)
     ============================================================ */
  --color-healthy-dim: #0a2e18;
  --color-healthy: #22c55e; /* @tarva/ui --status-success */
  --color-healthy-glow: #4ade80;

  /* ============================================================
     STATUS: WARNING (from @tarva/ui --status-warning: #eab308)
     ============================================================ */
  --color-warning-dim: #3a2d06;
  --color-warning: #eab308; /* @tarva/ui --status-warning */
  --color-warning-glow: #facc15;

  /* ============================================================
     STATUS: ERROR (from @tarva/ui --status-danger: #ef4444)
     ============================================================ */
  --color-error-dim: #3a1212;
  --color-error: #ef4444; /* @tarva/ui --status-danger */
  --color-error-glow: #f87171;

  /* ============================================================
     STATUS: OFFLINE (from @tarva/ui --status-neutral: #6b7280)
     ============================================================ */
  --color-offline-dim: #1a1d24;
  --color-offline: #6b7280; /* @tarva/ui --status-neutral */
  --color-offline-glow: #9ca3af;

  /* ============================================================
     SPACING: SPATIAL ENGINE
     ============================================================ */
  --space-capsule-padding: 20px;
  --space-capsule-gap: 48px;
  --space-ring-radius: 300px;
  --space-district-padding: 64px;
  --space-station-margin: 32px;
  --space-station-gap: 24px;
  --space-hud-inset: 16px;
  --space-hud-inset-lg: 24px;

  /* ============================================================
     DIMENSIONS: CAPSULE
     ============================================================ */
  --capsule-width: 192px;
  --capsule-height: 228px;
  --capsule-radius: 28px;
  --capsule-hover-scale: 1.12;
  --capsule-select-scale: 1.05;
  --capsule-morph-scale: 2;

  /* ============================================================
     ANIMATION: DURATIONS
     ============================================================ */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-hover: 200ms;
  --duration-transition: 300ms;
  --duration-scanline: 350ms;
  --duration-morph: 600ms;
  --duration-morph-complex: 900ms;
  --duration-ambient-breathe: 5000ms;
  --duration-ambient-heart: 7000ms;
  --duration-ambient-grid: 12000ms;
  --duration-ambient-drift: 45000ms;

  /* ============================================================
     ANIMATION: EASING CURVES
     ============================================================ */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-hover: cubic-bezier(0, 0, 0.2, 1);
  --ease-morph: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-glow: cubic-bezier(0.4, 0, 0.6, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  /* ============================================================
     GLOW: EMBER (Primary accent glow)
     ============================================================ */
  --glow-ember-subtle: 0 0 12px rgba(224, 82, 0, 0.08), 0 0 4px rgba(224, 82, 0, 0.12);
  --glow-ember-medium:
    0 0 20px rgba(224, 82, 0, 0.12), 0 0 8px rgba(224, 82, 0, 0.22),
    0 0 2px rgba(255, 170, 112, 0.35);
  --glow-ember-bright:
    0 0 40px rgba(224, 82, 0, 0.18), 0 0 16px rgba(224, 82, 0, 0.3),
    0 0 4px rgba(255, 170, 112, 0.5);

  /* ============================================================
     GLOW: TEAL (Secondary accent glow — telemetry, data)
     ============================================================ */
  --glow-teal-subtle: 0 0 12px rgba(39, 115, 137, 0.08), 0 0 4px rgba(39, 115, 137, 0.12);
  --glow-teal-medium:
    0 0 20px rgba(39, 115, 137, 0.12), 0 0 8px rgba(39, 115, 137, 0.22),
    0 0 2px rgba(94, 196, 222, 0.35);

  /* ============================================================
     GLOW: STATUS
     ============================================================ */
  --glow-healthy: 0 0 16px rgba(34, 197, 94, 0.12), 0 0 4px rgba(74, 222, 128, 0.25);
  --glow-warning: 0 0 16px rgba(234, 179, 8, 0.12), 0 0 4px rgba(250, 204, 21, 0.25);
  --glow-error: 0 0 16px rgba(239, 68, 68, 0.12), 0 0 4px rgba(248, 113, 113, 0.25);

  /* ============================================================
     OPACITY LEVELS
     ============================================================ */
  --opacity-ambient-particle: 0.12;
  --opacity-ambient-grid: 0.015;
  --opacity-ambient-grid-peak: 0.04;
  --opacity-ambient-grain: 0.035;
  --opacity-dim-offline: 0.4;
  --opacity-glass-rest: 0.03;
  --opacity-glass-hover: 0.06;
  --opacity-glass-active: 0.08;
  --opacity-glass-overlay: 0.8;
  --opacity-text-ambient: 0.5;
  --opacity-text-ghost: 0.2;

  /* ============================================================
     GLASS: BACKDROP BLUR
     ============================================================ */
  --blur-ambient: 8px;
  --blur-standard: 12px;
  --blur-active: 16px;
  --blur-heavy: 24px;

  /* ============================================================
     TYPOGRAPHY
     ============================================================ */
  --font-sans: 'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  --tracking-tight: 0.01em;
  --tracking-normal: 0.02em;
  --tracking-wide: 0.04em;
  --tracking-wider: 0.08em;
  --tracking-widest: 0.12em;
}
```

### 6.2 Tailwind CSS v4 Theme Extension

```css
/* In your main CSS file (Tailwind v4 uses CSS-based config).
   Note: @tarva/ui semantic tokens (--background, --primary, etc.) are
   provided by ThemeProvider. These spatial tokens extend the system. */
@theme {
  /* Background scale (aligned with @tarva/ui tarva-core dark) */
  --color-void: #050911;
  --color-abyss: #0a0f18;
  --color-deep: #0f161f;
  --color-surface: #121720;
  --color-raised: #1c222b;
  --color-overlay: #28313e;

  /* Ember accent (from @tarva/ui --primary) */
  --color-ember-dim: #3a1800;
  --color-ember-muted: #7a3000;
  --color-ember: #e05200;
  --color-ember-bright: #ff773c;
  --color-ember-glow: #ffaa70;
  --color-ember-white: #ffd4b8;

  /* Teal accent (from @tarva/ui --accent) */
  --color-teal-dim: #0f2a35;
  --color-teal-muted: #1a4d5e;
  --color-teal: #277389;
  --color-teal-bright: #3a9ab5;
  --color-teal-glow: #5ec4de;
  --color-teal-white: #a8e0ef;

  /* Status (from @tarva/ui) */
  --color-healthy-dim: #0a2e18;
  --color-healthy: #22c55e;
  --color-healthy-glow: #4ade80;

  --color-warning-dim: #3a2d06;
  --color-warning: #eab308;
  --color-warning-glow: #facc15;

  --color-error-dim: #3a1212;
  --color-error: #ef4444;
  --color-error-glow: #f87171;

  --color-offline-dim: #1a1d24;
  --color-offline: #6b7280;
  --color-offline-glow: #9ca3af;

  /* Text (from @tarva/ui tarva-core dark) */
  --color-text-primary: #def6ff;
  --color-text-secondary: #92a9b4;
  --color-text-tertiary: #55667a;
  --color-text-ghost: #33445a;

  /* Spacing */
  --spacing-capsule-padding: 20px;
  --spacing-capsule-gap: 48px;
  --spacing-ring-radius: 300px;
  --spacing-district-padding: 64px;
  --spacing-station-margin: 32px;
  --spacing-station-gap: 24px;
  --spacing-hud-inset: 16px;

  /* Animation durations (as Tailwind utilities) */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-hover: 200ms;
  --duration-transition: 300ms;
  --duration-scanline: 350ms;
  --duration-morph: 600ms;
  --duration-morph-complex: 900ms;
  --duration-ambient-breathe: 5000ms;
  --duration-ambient-heart: 7000ms;
  --duration-ambient-grid: 12000ms;
  --duration-ambient-drift: 45000ms;

  /* Easing curves */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-hover: cubic-bezier(0, 0, 0.2, 1);
  --ease-morph: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-glow: cubic-bezier(0.4, 0, 0.6, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

  /* Blur radii for backdrop-filter */
  --blur-ambient: 8px;
  --blur-standard: 12px;
  --blur-active: 16px;
  --blur-heavy: 24px;

  /* Font families */
  --font-sans: 'Geist Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;
}
```

**Usage examples in Tailwind markup:**

```html
<!-- Capsule -->
<div
  class="bg-surface duration-hover ease-hover h-[228px] w-[192px] rounded-[28px] border border-white/6 shadow-[var(--glow-ember-subtle)] backdrop-blur-[12px] transition-all hover:scale-[1.12] hover:border-white/12 hover:bg-white/6 hover:shadow-[var(--glow-ember-medium)]"
>
  <!-- content -->
</div>

<!-- Receipt stamp -->
<span class="text-ember-bright/75 font-mono text-[10px] font-medium tracking-[0.12em] uppercase">
  AUTH OK <span class="text-ember-bright/35 mx-[0.4em]">/</span>
  <span class="text-ember-glow/90">TRACE: 7F2A</span>
</span>

<!-- Glass panel -->
<div
  class="border border-white/6 bg-white/4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)] backdrop-blur-[12px] backdrop-saturate-[120%]"
></div>
```

### 6.3 Token Summary Table

| Category                | Token Count                     | Key Values                                                      |
| ----------------------- | ------------------------------- | --------------------------------------------------------------- |
| Background colors       | 6                               | `#050911` (void) to `#28313e` (overlay) — from @tarva/ui        |
| Border scale            | 5                               | 3% to 18% white + `#232933` default from @tarva/ui              |
| Text colors             | 4                               | `#def6ff` (primary) to `#33445a` (ghost) — from @tarva/ui       |
| Ember accent (primary)  | 6                               | `#3a1800` (dim) to `#ffd4b8` (white) — from @tarva/ui --primary |
| Teal accent (secondary) | 6                               | `#0f2a35` (dim) to `#a8e0ef` (white) — from @tarva/ui --accent  |
| Status colors           | 12 (4 status x 3 levels)        | Healthy, Warning, Error, Offline — from @tarva/ui               |
| Glow shadows            | 8 (3 ember + 2 teal + 3 status) | Subtle, Medium, Bright per context                              |
| Spacing                 | 8                               | 16px to 300px                                                   |
| Durations               | 11                              | 100ms to 45,000ms                                               |
| Easing curves           | 6                               | Default, Hover, Morph, Glow, Bounce, OutExpo                    |
| Opacity levels          | 10                              | 0.015 to 0.80                                                   |
| Blur radii              | 4                               | 8px to 24px                                                     |
| Fonts                   | 2                               | Geist Sans, Geist Mono                                          |
| Tracking                | 5                               | 0.01em to 0.12em                                                |
| **Total**               | **~89 tokens**                  |                                                                 |

---

## 7. QUICK REFERENCE CARD

### Capsule at a Glance

```
Shape:       Rounded rect, 192 x 228 px, radius 28px
Ring:        6 capsules, 300px from center, 60deg apart
Hover:       scale(1.12), 200ms, glow medium
Selected:    pulse scale(1.05), scanline sweep, then morph to center 600ms
Offline:     opacity 0.40, saturate(0.15), no glow
```

### Color at a Glance

```
Canvas:      #050911 (near-black, blue undertone — @tarva/ui --background)
Surface:     #121720 (panels, capsules)
Ember:       #e05200 (primary luminous accent — @tarva/ui --primary)
Teal:        #277389 (secondary data accent — @tarva/ui --accent)
Text:        #def6ff (primary), #92a9b4 (secondary)
Glass:       rgba(255,255,255, 0.03-0.06), blur 12px
Glow:        3-layer box-shadow, ember RGB at 8%-50% opacity
```

### Type at a Glance

```
Sans:        Geist Sans (labels, headings, UI)
Mono:        Geist Mono (data, receipts, code)
Capsule name: 11px / 600 / uppercase / tracking 0.08em
Telem value:  16px / 500 / mono / tabular-nums
Receipt:      10px / 500 / mono / tracking 0.12em / uppercase
HUD:          8-11px / 400-500 / mono / low opacity
```

### Animation at a Glance

```
Hover:       200ms  ease(0, 0, 0.2, 1)
Morph:       600ms  ease(0.22, 1, 0.36, 1)
Scanline:    350ms  ease-out
Breathe:     5000ms ease-in-out
Heartbeat:   7000ms (staggered 1.2s per capsule)
Grid pulse:  12000ms ease-out
Particles:   45000ms linear (drift), 9000ms ease (shimmer)
```
