# UI Component Design Plan -- Data View Mode

> TarvaRI Alert Viewer -- view mode toggle and bundle/triage display components.
>
> Date: 2026-03-04
> Status: Design specification (pre-implementation)

---

## Table of Contents

1. [Design System Reference](#1-design-system-reference)
2. [ViewModeToggle](#2-viewmodetoggle)
3. [BundleCard](#3-bundlecard)
4. [TriageRationalePanel](#4-triagerationalepanel)
5. [ConfidenceIndicator](#5-confidenceindicator)
6. [RiskScoreBadge](#6-riskscoreBadge)
7. [Map Marker Variants](#7-map-marker-variants)
8. [Updated FeedPanel Sections](#8-updated-feedpanel-sections)
9. [Updated SystemStatusPanel Sections](#9-updated-systemstatuspanel-sections)
10. [Animation Inventory](#10-animation-inventory)
11. [Accessibility Notes](#11-accessibility-notes)

---

## 1. Design System Reference

Extracted from the existing codebase. All new components MUST use these tokens
and patterns -- no ad-hoc values.

### 1.1 Glass Surface Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Panel background | `rgba(255, 255, 255, 0.03)` | FeedPanel, SystemStatusPanel, ActivityTicker |
| Card background | `rgba(var(--ambient-ink-rgb), 0.05)` | CategoryCard, CoverageOverviewStats rows |
| Panel border | `1px solid rgba(255, 255, 255, 0.06)` | All panels |
| Card border | `1px solid rgba(var(--ambient-ink-rgb), 0.10)` | All cards |
| Inner section border | `1px solid rgba(255, 255, 255, 0.04)` | Subsections inside panels |
| Backdrop | `blur(12px) saturate(120%)` | Cards with Tailwind classes |
| Panel radius | 16px | All glass panels |
| Card radius | 12px (rounded-xl) | All cards |
| Inner radius | 8px | Inner containers |
| Hover overlay | `rgba(5, 9, 17, 0.92)` + `blur(12px)` | CategoryCard hover |
| Void color | `#050911` (--color-void) | Page background |

### 1.2 Typography Tokens

| Token | Font | Size | Weight | Color | Tracking | Transform |
|-------|------|------|--------|-------|----------|-----------|
| Panel header | mono | 20px | 700 | rgba(255,255,255,0.3) | 0.12em | uppercase |
| Section header (GHOST) | mono | 14px | normal | rgba(255,255,255,0.15) | 0.10em | uppercase |
| Subsection header | mono | 12px | normal | rgba(255,255,255,0.12) | 0.14em | uppercase |
| Card label | mono | 11px | 600 | text-secondary | wider | uppercase |
| Value large | mono | 28px | normal | rgba(255,255,255,0.6) | 0.04em | -- |
| Value medium | mono | 20px | normal | varies | 0.04em | -- |
| Value small | mono | 16px | normal | rgba(255,255,255,0.3) | 0.06em | -- |
| Body text | mono | 12px | normal | rgba(255,255,255,0.1) | 0.04em | -- |
| Muted label | mono | 10px | normal | rgba(255,255,255,0.2) | -- | -- |
| Timestamp | mono | 12-13px | normal | rgba(255,255,255,0.12) | 0.04em | -- |

### 1.3 Color Tokens

**Severity:**
| Level | Hex | rgba (for use in panels) |
|-------|-----|--------------------------|
| Extreme | #ef4444 | rgba(239, 68, 68, 0.7) |
| Severe | #f97316 | rgba(249, 115, 22, 0.6) |
| Moderate | #eab308 | rgba(234, 179, 8, 0.5) |
| Minor | #3b82f6 | rgba(59, 130, 246, 0.5) |
| Unknown | #6b7280 | rgba(255, 255, 255, 0.2) |

**Status:**
| Status | Color |
|--------|-------|
| Active / Approved | rgba(34, 197, 94, 0.8) -- green |
| Staging | rgba(234, 179, 8, 0.8) -- yellow |
| Quarantine / Rejected | rgba(239, 68, 68, 0.8) -- red |
| Disabled | rgba(255, 255, 255, 0.2) |

**Accents:**
| Name | Value |
|------|-------|
| Teal bright | var(--color-teal-bright, #277389) |
| Ember | var(--ember-rgb) -- used as rgba(var(--ember-rgb), alpha) |
| Healthy green | var(--healthy-rgb) |

### 1.4 Animation Tokens

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| Standard | 200ms | cubic-bezier(0.4, 0, 0.2, 1) | Hover, state changes |
| Scale emphasis | 400ms | cubic-bezier(0.25, 1, 0.5, 1) | Card select/deselect |
| Slide entrance | 500ms | cubic-bezier(0.22, 1, 0.36, 1) | Panel entrance |
| Spring | stiffness:120 damping:20 mass:0.8 | spring | Card idle return |
| Quick fade | 180ms | cubic-bezier(0.4, 0, 0.2, 1) | Overlay appear/disappear |
| Breathing glow | rAF sin wave | -- | Border glow effect |

### 1.5 Status Dot Pattern

```
width: 5-6px
height: 5-6px
border-radius: 50%
background: {status-color}
box-shadow: 0 0 6-8px {status-color at 0.4 alpha}
```

### 1.6 Corner Bracket Pattern (from CoverageMap)

```
size: 14px
offset: -6px (outside parent)
thickness: 1.5px
color: rgba(255, 255, 255, 0.18)
```

---

## 2. ViewModeToggle

### 2.1 Purpose

A segmented control that switches the dashboard between three data views:
**Triaged** (default), **All Bundles**, and **Raw Alerts**.

### 2.2 Placement

Positioned above the map, left-aligned with the map's left edge. Sits
between the map top edge and the coverage grid. In world-space coordinates,
this aligns with the CoverageMap container's left:

```
Map area:       left = -(GRID_WIDTH/2) - 230 + 125 = -675
                top  = -(GRID_HEIGHT/2) - 900 - 40 + 400 = -740

Toggle sits:    left = -675 (same as map left edge)
                top  = -740 - 44 = -784  (44px above map, with 8px gap)
```

### 2.3 ASCII Wireframe

```
                          252px
  +----------------------------------------------------------+
  |  [  TRIAGED  ] [  ALL BUNDLES  ] [  RAW ALERTS  ]        |
  +----------------------------------------------------------+
         ^active          ^inactive         ^inactive
        36px h

  Active segment:
  +------------------+
  | rgba(255,255,    |
  |  255, 0.08) fill |
  | white/0.15 border|
  | white/0.50 text  |
  +------------------+

  Inactive segment:
  +------------------+
  | transparent fill |
  | transparent bord |
  | white/0.20 text  |
  +------------------+

  Hover (inactive):
  +------------------+
  | white/0.04 fill  |
  | white/0.08 bord  |
  | white/0.35 text  |
  +------------------+
```

### 2.4 Detailed Spec

**Container:**
```
width:           auto (fits content)
height:          36px
background:      rgba(255, 255, 255, 0.02)
border:          1px solid rgba(255, 255, 255, 0.06)
border-radius:   10px
padding:         3px
display:         flex
gap:             2px
backdrop-filter: blur(12px) saturate(120%)
```

**Segment (button):**
```
height:          30px
padding:         0 16px
border-radius:   8px
font-family:     var(--font-mono, monospace)
font-size:       11px
font-weight:     600
letter-spacing:  0.08em
text-transform:  uppercase
cursor:          pointer
transition:      all 200ms cubic-bezier(0.4, 0, 0.2, 1)
```

**States:**

| State | Background | Border | Text Color |
|-------|-----------|--------|------------|
| Inactive | transparent | 1px solid transparent | rgba(255, 255, 255, 0.20) |
| Hover (inactive) | rgba(255, 255, 255, 0.04) | 1px solid rgba(255, 255, 255, 0.08) | rgba(255, 255, 255, 0.35) |
| Active | rgba(255, 255, 255, 0.08) | 1px solid rgba(255, 255, 255, 0.15) | rgba(255, 255, 255, 0.50) |
| Active + hover | rgba(255, 255, 255, 0.10) | 1px solid rgba(255, 255, 255, 0.18) | rgba(255, 255, 255, 0.60) |

**Active indicator animation:**

The active segment has a sliding background pill. When the user switches
modes, a `motion.div` pill slides from the previous active position to the
new one using `layoutId="view-mode-pill"`:

```tsx
<motion.div
  layoutId="view-mode-pill"
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
  style={{
    position: 'absolute',
    inset: 0,
    borderRadius: 8,
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  }}
/>
```

**Count badges (optional, per-segment):**

Each segment can show a count badge when data is loaded:

```
TRIAGED  12     ALL BUNDLES  44     RAW ALERTS  1.2K

Badge:
  display: inline
  margin-left: 6px
  font-size: 10px
  font-weight: 400
  color: rgba(255, 255, 255, 0.12)
  font-variant-numeric: tabular-nums
```

### 2.5 Dark Glass Integration

- Uses the same `backdrop-blur + border` pattern as CoverageOverviewStats
- Sits in the ZoomGate show={['Z1', 'Z2', 'Z3']} wrapper alongside the map
- Container background `0.02` is dimmer than cards (`0.05`) to avoid
  competing with the map below
- The sliding pill animation uses motion/react `layoutId` for shared layout

### 2.6 View Mode State

```typescript
type ViewMode = 'triaged' | 'all_bundles' | 'raw_alerts'

// Add to coverage.store.ts:
interface CoverageState {
  selectedCategories: string[]
  viewMode: ViewMode  // NEW
}
```

---

## 3. BundleCard

### 3.1 Purpose

Displays a single `intel_bundle` in the grid/list area. Replaces the
CategoryCard grid when viewMode is `triaged` or `all_bundles`.

### 3.2 Data Shape

```typescript
interface BundleCardData {
  id: string
  status: 'approved' | 'rejected'
  final_severity: string           // 'Extreme' | 'Severe' | 'Moderate' | 'Minor'
  categories: string[]             // ['weather', 'storm']
  confidence_aggregate: number     // 88-99
  risk_score: number               // 0-100 (Monte Carlo)
  source_count: number
  member_count: number             // member_intel_ids.length
  created_at: string               // ISO 8601
  triage_note?: string             // preview of triage rationale
  decided_at?: string              // triage timestamp
}
```

### 3.3 ASCII Wireframe

**Default state (approved bundle):**

```
  200px
  +----------------------------------------------+
  | SEV . SEVERE             APPROVED  [  88%  ] |   <- header row
  |                                    confidence |
  |----------------------------------------------|
  | [WX] [STM]               24 sources          |   <- category badges + stats
  |                            3 members          |
  |----------------------------------------------|
  |                                               |
  |   RISK  [========---]  80                     |   <- risk bar
  |                                               |
  |----------------------------------------------|
  | 2h ago                        > View triage   |   <- footer
  +----------------------------------------------+
       ^                              ^
       severity border-left (3px)     action link
```

**Rejected bundle (visual differences):**

```
  +----------------------------------------------+
  | SEV . SEVERE            REJECTED   [  99%  ] |
  |                                    confidence |
  |----------------------------------------------| <- border-left: red dashed
  | [WX] [STM]               20 sources          |
  |                            2 members          | <- all text at 50% opacity
  |----------------------------------------------|
  |   RISK  [========---]  80                     |
  |----------------------------------------------|
  | 3h ago                        > View triage   |
  +----------------------------------------------+
       ^
       red dashed border + cross-hatch overlay
```

### 3.4 Layout Detail

**Card container:**
```
width:           100% (grid-controlled)
min-height:      180px
background:      rgba(var(--ambient-ink-rgb), 0.05)
border:          1px solid rgba(var(--ambient-ink-rgb), 0.10)
border-left:     3px solid {severity-color}        -- approved
                 3px dashed rgba(239, 68, 68, 0.4) -- rejected
border-radius:   12px
padding:         16px
backdrop-filter: blur(12px) saturate(120%)
display:         flex
flex-direction:  column
gap:             12px
cursor:          pointer
transition:      all 200ms cubic-bezier(0.4, 0, 0.2, 1)
```

**Rejected modifier:**
```
opacity:         0.55
filter:          saturate(0.6)
border-left:     3px dashed rgba(239, 68, 68, 0.4)
```

When hovered, rejected cards increase to `opacity: 0.75` and
`saturate(0.8)`.

### 3.5 Header Row

```
+---[severity dot]---[severity label]---[spacer]---[decision badge]---[confidence]---+
```

**Severity dot:**
```
width:           8px
height:          8px
border-radius:   50%
background:      {SEVERITY_MAP_COLORS[final_severity]}
box-shadow:      0 0 6px {severity-color at 0.3 alpha}
```

**Severity label:**
```
font:            mono 12px
color:           {severity-color at 0.7 alpha}
letter-spacing:  0.06em
text-transform:  uppercase
```

**Decision badge (APPROVED / REJECTED):**
```
display:         inline-flex
align-items:     center
gap:             4px
padding:         2px 8px
border-radius:   4px
font:            mono 9px weight-600
letter-spacing:  0.10em
text-transform:  uppercase

APPROVED:
  background:    rgba(34, 197, 94, 0.10)
  border:        1px solid rgba(34, 197, 94, 0.20)
  color:         rgba(34, 197, 94, 0.7)

REJECTED:
  background:    rgba(239, 68, 68, 0.08)
  border:        1px solid rgba(239, 68, 68, 0.15)
  color:         rgba(239, 68, 68, 0.6)
```

**Confidence gauge (inline):**

See Section 5 (ConfidenceIndicator) -- uses the `compact` variant here:
```
[ 88% ]  <- numeric inside a small arc or just as text badge
```

### 3.6 Category Badges Row

```
[WX] [STM]  <- colored mini-pills using category shortName + color
```

**Category badge:**
```
display:         inline-flex
padding:         1px 6px
border-radius:   3px
font:            mono 9px weight-500
letter-spacing:  0.06em
background:      {category-color at 0.10 alpha}
color:           {category-color at 0.7 alpha}
border:          1px solid {category-color at 0.15 alpha}
```

**Source/member counts (right-aligned):**
```
font:            mono 11px
color:           rgba(255, 255, 255, 0.20)
letter-spacing:  0.04em
```

### 3.7 Risk Bar Row

See Section 6 (RiskScoreBadge) -- uses the `bar` variant here.

### 3.8 Footer Row

**Timestamp:**
```
font:            mono 10px
color:           rgba(255, 255, 255, 0.12)
letter-spacing:  0.04em
```

**Action link ("View triage"):**
```
font:            mono 10px weight-500
color:           rgba(255, 255, 255, 0.20)
letter-spacing:  0.06em
text-transform:  uppercase
transition:      color 150ms ease
hover-color:     rgba(255, 255, 255, 0.45)
```

Includes a `>` chevron character at `opacity: 0.3` that shifts right 2px on
hover.

### 3.9 Hover State

On hover the card shows:
1. Border brightens: `rgba(var(--ambient-ink-rgb), 0.10)` to
   `rgba(255, 255, 255, 0.12)`
2. Subtle inner glow: `box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.02)`
3. A triage rationale preview appears as a tooltip-style overlay at the
   bottom of the card:

```
  +----------------------------------------------+
  |                                               |
  |  ...normal card content...                    |
  |                                               |
  |==============================================|
  | "Approved: Multiple corroborating weather     |
  |  sources confirm severe storm system..."      |
  +----------------------------------------------+
       ^
       rationale preview (first 80 chars + ellipsis)
       font: mono 10px, color: rgba(255,255,255,0.25)
       padding: 8px 12px
       border-top: 1px solid rgba(255,255,255,0.04)
       background: rgba(5, 9, 17, 0.4)
```

### 3.10 Click / Expand

Clicking a BundleCard opens the TriageRationalePanel (Section 4) as a
slide-out detail panel on the right side, similar to the existing
DistrictViewOverlay pattern. The clicked card scales to 1.02 and gets a
brighter border during the panel open animation.

### 3.11 Motion Variants

```typescript
const bundleCardVariants: Variants = {
  idle: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 },
  },
  selected: {
    opacity: 1,
    scale: 1.02,
    transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
  },
  dimmed: {
    opacity: 0.3,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
}
```

### 3.12 Grid Layout

When in `triaged` or `all_bundles` mode, the BundleCards replace the
CategoryCard grid. The grid adapts:

```
columns:         4 (wider cards than 9-column category grid)
gap:             16px
width:           GRID_WIDTH (1600px)
min-row-height:  auto
```

---

## 4. TriageRationalePanel

### 4.1 Purpose

Full-detail panel showing the LLM's triage decision for a selected bundle.
Opens as a fixed-position slide-in panel (right side), analogous to the
DistrictViewOverlay but narrower and content-specific.

### 4.2 ASCII Wireframe

```
  360px
  +------------------------------------------------+
  |                                                 |
  |  TRIAGE DECISION                    [X] close   |
  |                                                 |
  |  +------------------------------------------+  |
  |  |  [APPROVED]              CONF: 88%       |  |
  |  |      ^green badge           ^gauge       |  |
  |  +------------------------------------------+  |
  |                                                 |
  |  DECIDED                                        |
  |  2024-12-15 14:32 UTC                           |
  |                                                 |
  |  --------- horizontal rule ---------            |
  |                                                 |
  |  RATIONALE                                      |
  |  +------------------------------------------+  |
  |  |                                          |  |
  |  |  "Multiple corroborating weather         |  |
  |  |   sources confirm a severe storm         |  |
  |  |   system developing over the eastern     |  |
  |  |   Pacific. NOAA, ECMWF, and local        |  |
  |  |   met agencies all report consistent     |  |
  |  |   wind speed projections exceeding       |  |
  |  |   90 knots. Risk assessment elevated     |  |
  |  |   due to coastal population density..."  |  |
  |  |                                          |  |
  |  +------------------------------------------+  |
  |      ^text in a bordered inner section          |
  |      with left border accent in teal            |
  |                                                 |
  |  --------- horizontal rule ---------            |
  |                                                 |
  |  BUNDLE METRICS                                 |
  |  +------------------------------------------+  |
  |  |  Severity   . SEVERE          [orange]   |  |
  |  |  Risk Score   [=======---]    80         |  |
  |  |  Sources      24                         |  |
  |  |  Members      3                          |  |
  |  +------------------------------------------+  |
  |                                                 |
  |  --------- horizontal rule ---------            |
  |                                                 |
  |  EVIDENCE                                       |
  |  +------------------------------------------+  |
  |  |  . WX-2024-001  "Storm warning..."       |  |
  |  |  . WX-2024-002  "High wind advisory..."  |  |
  |  |  . STM-2024-001 "Tropical cyclone..."    |  |
  |  +------------------------------------------+  |
  |      ^member alerts linked list                 |
  |                                                 |
  |  [  circuit diagram decoration  ]               |
  |                                                 |
  +------------------------------------------------+
```

### 4.3 Container Spec

```
position:        fixed
top:             0
right:           0
width:           360px
height:          100vh
background:      rgba(5, 9, 17, 0.95)
backdrop-filter: blur(16px)
border-left:     1px solid rgba(255, 255, 255, 0.06)
z-index:         35
padding:         24px
overflow-y:      auto
scrollbar:       thin, thumb rgba(255,255,255,0.06)
```

**Entrance animation:**
```tsx
<motion.div
  initial={{ x: 360, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 360, opacity: 0 }}
  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
/>
```

### 4.4 Decision Header Section

```
+--[decision badge]--[spacer]--[confidence gauge]--+
```

**Decision badge (large variant):**
```
display:         inline-flex
align-items:     center
gap:             6px
padding:         4px 14px
border-radius:   6px
font:            mono 13px weight-700
letter-spacing:  0.12em
text-transform:  uppercase

APPROVED:
  background:    rgba(34, 197, 94, 0.12)
  border:        1px solid rgba(34, 197, 94, 0.25)
  color:         rgba(34, 197, 94, 0.8)
  dot:           6px green with glow

REJECTED:
  background:    rgba(239, 68, 68, 0.10)
  border:        1px solid rgba(239, 68, 68, 0.20)
  color:         rgba(239, 68, 68, 0.7)
  dot:           6px red with glow
```

The decision badge includes a status dot (6px) before the text,
matching the Status Dot Pattern from Section 1.5.

**Confidence gauge (expanded variant):**

See Section 5 -- uses the `expanded` variant here showing a circular
arc gauge with numeric label.

### 4.5 Rationale Section

This is the most important section. The LLM rationale must feel
authoritative and trustworthy. Design cues for credibility:

**Rationale container:**
```
background:      rgba(255, 255, 255, 0.02)
border:          1px solid rgba(255, 255, 255, 0.04)
border-left:     2px solid rgba(39, 115, 137, 0.4)   -- teal accent
border-radius:   8px
padding:         16px
```

**Rationale text:**
```
font:            mono 12px
line-height:     1.65
color:           rgba(255, 255, 255, 0.35)
letter-spacing:  0.02em
white-space:     pre-wrap
```

**Credibility indicators embedded in the rationale section:**

1. A small "AI ANALYSIS" label above the text:
```
font:            mono 9px weight-500
color:           rgba(39, 115, 137, 0.5)   -- teal
letter-spacing:  0.14em
text-transform:  uppercase
margin-bottom:   8px
```

2. After the rationale text, a confidence qualifier line:
```
font:            mono 10px
color:           rgba(255, 255, 255, 0.12)
margin-top:      12px
Example:         "Confidence: 88% -- based on 24 corroborating sources"
```

### 4.6 Bundle Metrics Section

Reuses the stat-row pattern from SystemStatusPanel:

```
Each metric row:
  display:       flex
  justify:       space-between
  align:         center
  gap:           10px
  padding-left:  8px

  Label:
    font:        mono 12px
    color:       rgba(255, 255, 255, 0.20)
    tracking:    0.06em
    uppercase

  Value:
    font:        mono 14px
    color:       rgba(255, 255, 255, 0.4)
    tracking:    0.04em
    tabular-nums
```

For "Severity" the value uses the severity color. For "Risk Score" it
shows the RiskScoreBadge bar variant (Section 6).

### 4.7 Evidence Section (Member Alerts)

Lists the `member_intel_ids` as clickable references:

```
Each evidence row:
  display:       flex
  align:         center
  gap:           8px
  padding:       6px 0

  Category dot:
    width: 4px, height: 4px, border-radius: 50%
    background: {category-color}

  Alert ID:
    font:        mono 10px
    color:       rgba(255, 255, 255, 0.25)
    tracking:    0.04em

  Title snippet:
    font:        mono 10px
    color:       rgba(255, 255, 255, 0.12)
    overflow:    hidden
    text-overflow: ellipsis
    white-space: nowrap

  Separator between rows:
    border-bottom: 1px solid rgba(255, 255, 255, 0.03)
```

### 4.8 Close Button

```
position:        absolute
top:             20px
right:           20px
width:           28px
height:          28px
border-radius:   6px
border:          1px solid rgba(255, 255, 255, 0.06)
background:      rgba(255, 255, 255, 0.03)
color:           rgba(255, 255, 255, 0.25)
font:            mono 14px
display:         flex
align-items:     center
justify-content: center
cursor:          pointer
transition:      all 150ms ease

hover:
  border:        1px solid rgba(255, 255, 255, 0.12)
  background:    rgba(255, 255, 255, 0.06)
  color:         rgba(255, 255, 255, 0.5)
```

Uses the `X` icon from Lucide at 14px.

### 4.9 Horizontal Rules

```
height:          1px
background:      rgba(255, 255, 255, 0.04)
margin:          16px 0
```

---

## 5. ConfidenceIndicator

### 5.1 Purpose

Reusable gauge/badge showing a confidence percentage (0-100). Two variants:
`compact` (for BundleCard inline) and `expanded` (for TriageRationalePanel).

### 5.2 Thresholds

| Range | Label | Color |
|-------|-------|-------|
| 0-49 | Low | rgba(239, 68, 68, 0.6) -- red |
| 50-79 | Medium | rgba(234, 179, 8, 0.5) -- yellow |
| 80-100 | High | rgba(34, 197, 94, 0.6) -- green |

These colors are distinct from severity colors because they use status
semantics (good/bad) rather than severity semantics (urgency level).

### 5.3 Compact Variant (for BundleCard)

```
  [ 88% ]

  Container:
    display:         inline-flex
    align-items:     center
    gap:             0
    padding:         2px 6px
    border-radius:   4px
    border:          1px solid {threshold-color at 0.15 alpha}
    background:      {threshold-color at 0.06 alpha}

  Value:
    font:            mono 10px weight-600
    color:           {threshold-color at 0.7 alpha}
    letter-spacing:  0.04em
    tabular-nums
```

### 5.4 Expanded Variant (for TriageRationalePanel)

An SVG circular arc gauge with the numeric value centered inside.

```
  ASCII representation:

       .-===-.           88%
      /       \          HIGH
     |         |
      \       /
       '-===-'

  SVG details:
    viewBox:       0 0 64 64
    width/height:  56px (in TriageRationalePanel)

    Background arc:
      stroke:      rgba(255, 255, 255, 0.06)
      stroke-width: 4
      r:           26
      cx/cy:       32
      stroke-dasharray: 163.36 (circumference)
      stroke-dashoffset: 0
      transform:   rotate(-135deg) from center
      arc-span:    270 degrees (3/4 circle, gap at bottom)

    Foreground arc:
      stroke:      {threshold-color at 0.6 alpha}
      stroke-width: 4
      r:           26
      stroke-dasharray: 163.36
      stroke-dashoffset: 163.36 * (1 - value/100 * 0.75)
      stroke-linecap: round
      transform:   rotate(-135deg) from center
      filter:      drop-shadow(0 0 4px {threshold-color at 0.2 alpha})

    Center text (value):
      font:        mono 14px weight-700
      fill:        {threshold-color at 0.7 alpha}
      text-anchor: middle
      dominant-baseline: central
      dy:          -2

    Label text (threshold name):
      font:        mono 8px weight-500
      fill:        rgba(255, 255, 255, 0.20)
      text-anchor: middle
      letter-spacing: 0.08em
      text-transform: uppercase
      dy:          10
```

### 5.5 Micro-Animation (Live Update)

When the confidence value changes, the foreground arc animates using
motion/react's `animate` prop on `stroke-dashoffset`:

```tsx
<motion.circle
  animate={{ strokeDashoffset: targetOffset }}
  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
  ...
/>
```

For the compact variant, the number uses `tabular-nums` and animates
via a `motion.span` with `layout` prop for smooth digit transitions.

### 5.6 Dark Glass Integration

The expanded variant sits on the panel's `rgba(5, 9, 17, 0.95)` background.
The arc's glow (`drop-shadow`) provides subtle luminance without needing
additional glass layers. The compact variant is transparent and blends into
the BundleCard surface.

---

## 6. RiskScoreBadge

### 6.1 Purpose

Displays the Monte Carlo risk score (0-100) with a visual encoding that is
distinct from severity colors.

### 6.2 Color Scale

Uses a cyan-to-magenta gradient that avoids collision with the red/orange/
yellow/blue severity palette:

| Range | Color | Hex |
|-------|-------|-----|
| 0-29 (Low) | Dim cyan | rgba(56, 189, 248, 0.3) -- sky-400 at 0.3 |
| 30-59 (Medium) | Bright cyan | rgba(14, 165, 233, 0.5) -- sky-500 at 0.5 |
| 60-79 (High) | Purple | rgba(168, 85, 247, 0.5) -- purple-500 at 0.5 |
| 80-100 (Critical) | Magenta | rgba(236, 72, 153, 0.6) -- pink-500 at 0.6 |

### 6.3 Bar Variant (for BundleCard)

```
  RISK  [========-------]  80

  Container:
    display:     flex
    align-items: center
    gap:         8px

  Label:
    font:        mono 9px weight-500
    color:       rgba(255, 255, 255, 0.15)
    tracking:    0.10em
    uppercase

  Bar background:
    width:       80px
    height:      4px
    border-radius: 2px
    background:  rgba(255, 255, 255, 0.04)
    overflow:    hidden

  Bar fill:
    width:       {value}%
    height:      100%
    border-radius: 2px
    background:  linear-gradient(to right, {range-color}, {range-color at 0.5x alpha})
    transition:  width 600ms cubic-bezier(0.4, 0, 0.2, 1)

  Numeric value:
    font:        mono 12px weight-600
    color:       {range-color at 0.8 alpha}
    tracking:    0.04em
    tabular-nums
    min-width:   28px
    text-align:  right
```

### 6.4 Badge Variant (for map marker overlays)

```
  [80]

  Container:
    display:      inline-flex
    align-items:  center
    justify:      center
    min-width:    28px
    height:       18px
    padding:      0 4px
    border-radius: 4px
    background:   {range-color at 0.12 alpha}
    border:       1px solid {range-color at 0.20 alpha}

  Value:
    font:         mono 10px weight-700
    color:        {range-color at 0.8 alpha}
    tabular-nums
```

### 6.5 Compact Inline Variant (for stat rows)

```
  80 / 100

  font:          mono 14px
  color:         {range-color at 0.6 alpha}
  tracking:      0.04em
  tabular-nums
  small "/ 100": font-size 10px, color rgba(255,255,255,0.12)
```

### 6.6 Dark Glass Integration

The cyan-to-magenta spectrum was chosen because:
- It does not collide with red/orange/yellow/blue severity colors
- It does not collide with green/red approved/rejected status
- Cyan blends naturally with the teal accent (`--color-teal-bright`)
- The gradient direction (left to right) conveys progression
- Bar background `rgba(255,255,255,0.04)` matches existing bar patterns

---

## 7. Map Marker Variants

### 7.1 Current State (Raw Alerts mode)

Existing markers unchanged:
```
Source: GeoJSON FeatureCollection via MapMarkerLayer
Clusters: circle-color rgba(255,255,255,0.08), stroke rgba(255,255,255,0.15)
Unclustered: severity-colored circles, radius 6, stroke rgba(0,0,0,0.40)
```

### 7.2 Triaged Mode Markers

In triaged view, approved bundles appear as emphasized cluster-style markers
and rejected bundles are dimmed.

**Approved bundle marker:**
```
  MapLibre circle layer with data-driven properties:

  circle-color:    {severity-color at 0.20 alpha}
  circle-radius:   ['interpolate', ['linear'], ['get', 'source_count'],
                     1, 10,
                     10, 18,
                     50, 28]
  circle-stroke-width: 2
  circle-stroke-color: {severity-color at 0.5 alpha}
  circle-opacity:  0.9

  Inner label (symbol layer):
    text-field:    ['get', 'risk_score']
    text-size:     10
    text-color:    rgba(255, 255, 255, 0.6)
    text-font:     ['Noto Sans Bold']
```

**Rejected bundle marker:**
```
  circle-color:    rgba(255, 255, 255, 0.03)
  circle-radius:   ['interpolate', ['linear'], ['get', 'source_count'],
                     1, 8,
                     10, 14,
                     50, 22]
  circle-stroke-width: 1
  circle-stroke-color: rgba(239, 68, 68, 0.15)  -- red hint
  circle-opacity:  0.3
  circle-stroke-dasharray: [3, 3]  -- dashed outline

  Inner label:
    text-color:    rgba(255, 255, 255, 0.15)
```

**ASCII representation:**

```
  Approved:                    Rejected:

      .--==--.                    .--  --.
    /  |  80  |  \              /  : 80  :  \
   |   |      |   |            |   :      :   |
    \  '------'  /              \  '--  --'  /
      '--==--'                    '--  --'

  Solid stroke, bright fill     Dashed stroke, dim fill
  Risk score label               Faded risk label
  Radius scales with sources     Smaller radius
```

### 7.3 All Bundles Mode Markers

Same as triaged mode but both approved and rejected bundles render at
full opacity. Rejected bundles use a red-tinted stroke instead of being
dimmed:

```
  Rejected (in All Bundles view):
    circle-color:    rgba(239, 68, 68, 0.08)
    circle-stroke-color: rgba(239, 68, 68, 0.30)
    circle-opacity:  0.7
```

### 7.4 Bundle Popup (click interaction)

When a bundle marker is clicked, a richer popup appears:

```
  +----------------------------------+
  |  Bundle #B-2024-001              |
  |  . SEVERE           APPROVED     |
  |  WX, STM             88% conf    |
  |  Risk: 80  Sources: 24           |
  |                                  |
  |  [View Full Triage >>]           |
  +----------------------------------+

  Popup styles (extending MapPopup pattern):
    background:      rgba(10, 14, 24, 0.95)
    backdrop-filter:  blur(16px)
    border:          1px solid rgba(255, 255, 255, 0.10)
    border-radius:   8px
    padding:         12px 14px
    min-width:       200px
    max-width:       280px
```

### 7.5 Marker Layer Switching

The map will have three source/layer configurations, only one active at a
time based on `viewMode`:

```
Source: 'raw-markers'     -- active when viewMode === 'raw_alerts'
Source: 'bundle-markers'  -- active when viewMode === 'triaged' || 'all_bundles'
```

Layer visibility is toggled via MapLibre `setLayoutProperty(layerId, 'visibility', 'visible' | 'none')`.

---

## 8. Updated FeedPanel Sections

### 8.1 Current Structure

```
INTEL FEED (header)
SOURCES (active/total)
SEVERITY (breakdown)
RECENT (alert list)
[circuit diagram]
```

### 8.2 View-Mode Adaptations

The FeedPanel header and content sections change based on `viewMode`.

**Raw Alerts mode** (current behavior, no changes):
- Header: "INTEL FEED"
- Shows individual alert items from `intel_normalized`

**Triaged mode:**
```
  TRIAGE FEED (header -- text changes)

  BUNDLES                               <- new section label
  12 approved / 2 rejected             <- summary line

  APPROVAL RATE                        <- new section
  [===============---]  85%            <- bar

  SEVERITY (unchanged section)

  RECENT DECISIONS                     <- replaces "RECENT"
  [14:32] APPROVED  . SEVERE  WX      <- triage events
  [14:28] REJECTED  . SEVERE  SEIS    <- with decision + category
  [14:15] APPROVED  . MODERATE WX
  ...

  [circuit diagram]
```

**All Bundles mode:**
```
  BUNDLE FEED (header)

  BUNDLES
  14 total / 12 approved / 2 rejected

  CONFIDENCE DIST                      <- new section
  [bar] HIGH (>80)    10
  [bar] MED (50-80)    3
  [bar] LOW (<50)      1

  RECENT BUNDLES                       <- sorted by created_at
  [14:32] WX  24src  88%  RISK:80
  [14:28] SEIS 20src 99%  RISK:80
  ...

  [circuit diagram]
```

### 8.3 New Section Specs

**Bundle summary line:**
```
font:        mono 16px
color:       rgba(34, 197, 94, 0.5)  <- approved count in green
             rgba(255, 255, 255, 0.12) <- separator "/"
             rgba(239, 68, 68, 0.4)   <- rejected count in red
tracking:    0.04em
```

**Approval rate bar:**
```
Same pattern as SystemStatusPanel severity bars:
  bar-bg:    rgba(255, 255, 255, 0.04)
  bar-fill:  linear-gradient(to right, rgba(34, 197, 94, 0.5), transparent)
  height:    6px
  radius:    3px

  Label:     mono 13px, rgba(255,255,255,0.25)
  Value:     mono 13px, rgba(34, 197, 94, 0.5)
```

**Triage event row:**
```
  Line 1: [HH:MM] DECISION . SEVERITY CATEGORY
    timestamp: mono 12px rgba(255,255,255,0.12)
    decision:  mono 12px, green for approved, red for rejected
    severity:  severity-color
    category:  category shortName in category color

  Same vertical gap and indent as existing FeedItem pattern.
```

---

## 9. Updated SystemStatusPanel Sections

### 9.1 Current Structure

```
[status dot] ALL CLEAR / SOURCES DEGRADED
active/total ACTIVE SOURCES
MISSION: INTEL MONITORING
[source status breakdown]
SEVERITY DIST (bars)
CATEGORY ACTIVITY (bars)
COVERAGE (footer)
```

### 9.2 View-Mode Adaptations

The SystemStatusPanel adds sections below the existing content based on
`viewMode`. Existing sections remain unchanged -- new content appears as
additional sections.

**Triaged mode -- additional sections:**

```
  ...existing content...

  --------- separator ----------

  TRIAGE STATUS                        <- new section
  +------------------------------------------+
  |  .  PROCESSING   12 bundles              |
  |  .  APPROVED     10                      |
  |  .  REJECTED      2                      |
  +------------------------------------------+

  CONFIDENCE OVERVIEW                  <- new section
  +------------------------------------------+
  |  AVG CONFIDENCE                          |
  |  [===========-]  91%                     |
  |                                          |
  |  HIGH (>80)    10  |||||||||||            |
  |  MED (50-80)    2  ||                    |
  |  LOW (<50)      0                        |
  +------------------------------------------+

  RISK DISTRIBUTION                    <- new section
  +------------------------------------------+
  |  AVG RISK SCORE                          |
  |  [========---]  80                       |
  |                                          |
  |  CRIT (80+)    8  ||||||||               |
  |  HIGH (60-79)  3  |||                    |
  |  MED (30-59)   1  |                      |
  |  LOW (0-29)    0                         |
  +------------------------------------------+
```

**All Bundles mode** -- same additional sections as triaged, but counts
include all bundles (not just approved).

**Raw Alerts mode** -- no additional sections (current behavior).

### 9.3 New Section Specs

**Triage status breakdown:**

Reuses the existing source-status breakdown pattern (dot + label + count):

```
  dot:       5px circle
    PROCESSING: rgba(234, 179, 8, 0.8) yellow
    APPROVED:   rgba(34, 197, 94, 0.8) green
    REJECTED:   rgba(239, 68, 68, 0.8) red

  label:     mono 15px rgba(255,255,255,0.3) 0.06em tracking uppercase
  value:     mono 15px {status-text-color}

  Container: same bordered box as SOURCE STATUS section
    border: 1px solid rgba(255,255,255,0.04)
    radius: 8px
    padding: 12px 14px
```

**Confidence/Risk distribution bars:**

Reuses the severity-bar pattern:

```
  Bar track:   flex-1, height 5px, radius 3px, rgba(255,255,255,0.04)
  Bar fill:    {color}, opacity 0.5, width = percentage
  Label:       mono 12px, {color at 0.5 alpha}, 0.06em tracking, min-width 64px
  Value:       mono 12px, rgba(255,255,255,0.2), min-width 24px, right-aligned

  Confidence colors:
    HIGH:  rgba(34, 197, 94, 0.5)  green
    MED:   rgba(234, 179, 8, 0.4)  yellow
    LOW:   rgba(239, 68, 68, 0.4)  red

  Risk colors:
    CRIT:  rgba(236, 72, 153, 0.5)  magenta (from RiskScoreBadge palette)
    HIGH:  rgba(168, 85, 247, 0.4)  purple
    MED:   rgba(14, 165, 233, 0.4)  cyan
    LOW:   rgba(56, 189, 248, 0.3)  light cyan
```

---

## 10. Animation Inventory

Complete list of new animations required for implementation.

### 10.1 motion/react Animations

| Component | Property | From | To | Duration | Easing | Trigger |
|-----------|----------|------|----|----------|--------|---------|
| ViewModeToggle pill | layoutId position | prev x | new x | spring s:400 d:30 | spring | mode switch |
| BundleCard enter | opacity, y | 0, 8 | 1, 0 | 300ms | [0.4,0,0.2,1] | mount |
| BundleCard select | scale | 1.0 | 1.02 | 300ms | [0.25,1,0.5,1] | click |
| BundleCard dimmed | opacity | 1 | 0.3 | 400ms | [0.25,1,0.5,1] | sibling select |
| TriagePanel enter | x, opacity | 360, 0 | 0, 1 | 500ms | [0.22,1,0.36,1] | open |
| TriagePanel exit | x, opacity | 0, 1 | 360, 0 | 400ms | [0.22,1,0.36,1] | close |
| ConfidenceArc fill | strokeDashoffset | full | target | 800ms | [0.4,0,0.2,1] | data load |
| RiskBar fill | width | 0% | target% | 600ms | [0.4,0,0.2,1] | data load |

### 10.2 CSS @keyframes Animations

No new CSS keyframes are required. All new animations use motion/react
for component-level orchestration. The existing enrichment CSS animations
continue to run independently.

### 10.3 Reduced Motion

All motion/react animations respect `prefersReducedMotion`:

```tsx
// If reduced motion is preferred, skip all transitions:
const transition = prefersReducedMotion
  ? { duration: 0 }
  : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
```

The BundleCard grid uses `staggerChildren: 0.03` for sequential card
entrance (total stagger for 12 cards = 360ms). This is skipped under
reduced motion.

---

## 11. Accessibility Notes

### 11.1 ViewModeToggle

- Uses `role="tablist"` with `role="tab"` for each segment
- `aria-selected="true"` on the active segment
- `aria-controls` links to the content area that changes
- Arrow key navigation between segments (left/right)
- Focus indicator: 2px outline at `var(--color-ember-bright)`, offset 2px

### 11.2 BundleCard

- `role="article"` with `aria-label` describing bundle: severity, status,
  confidence, and category list
- Keyboard accessible: `tabIndex={0}`, Enter/Space to select
- Rejected bundles include `(rejected)` in aria-label
- Screen reader announces decision change via `aria-live="polite"` region

### 11.3 TriageRationalePanel

- `role="dialog"` with `aria-label="Triage decision detail"`
- Focus trap when open (trap focus within panel, return on close)
- Escape key closes the panel
- Rationale text has `aria-label="AI triage rationale"` for context
- Close button has `aria-label="Close triage panel"`

### 11.4 ConfidenceIndicator

- SVG has `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`,
  `aria-valuemax="100"`, `aria-label="Confidence: {value}%"`
- Compact variant: the text itself is sufficient, no additional ARIA needed

### 11.5 RiskScoreBadge

- Bar variant: `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`,
  `aria-valuemax="100"`, `aria-label="Risk score: {value} out of 100"`
- Badge variant: `aria-label="Risk: {value}"`

### 11.6 Map Markers

- Live region announces marker count changes: "Map showing {n} bundles,
  {approved} approved, {rejected} rejected"
- Bundle popup includes `role="dialog"` and is keyboard-dismissible

---

## Appendix A: Component File Structure

```
src/components/coverage/
  ViewModeToggle.tsx          -- NEW: segmented control
  BundleCard.tsx              -- NEW: bundle display card
  BundleGrid.tsx              -- NEW: grid container for BundleCards
  TriageRationalePanel.tsx    -- NEW: slide-out detail panel
  ConfidenceIndicator.tsx     -- NEW: reusable gauge (compact + expanded)
  RiskScoreBadge.tsx          -- NEW: risk score display (bar + badge + inline)
  BundleMapMarkerLayer.tsx    -- NEW: MapLibre layers for bundle view
  BundleMapPopup.tsx          -- NEW: rich popup for bundle markers
  CategoryCard.tsx            -- existing, unchanged
  CoverageGrid.tsx            -- existing, unchanged
  CoverageMap.tsx             -- existing, minor: layer visibility switching
  MapMarkerLayer.tsx          -- existing, unchanged
  MapPopup.tsx                -- existing, unchanged

src/components/ambient/
  feed-panel.tsx              -- existing, modified: view-mode sections
  system-status-panel.tsx     -- existing, modified: triage/risk sections

src/stores/
  coverage.store.ts           -- existing, add viewMode state + actions

src/lib/interfaces/
  coverage.ts                 -- existing, add BundleCardData type
  bundle.ts                   -- NEW: bundle and triage type definitions
```

## Appendix B: State Management Additions

```typescript
// coverage.store.ts additions:

type ViewMode = 'triaged' | 'all_bundles' | 'raw_alerts'

interface CoverageState {
  selectedCategories: string[]
  viewMode: ViewMode                    // NEW -- default: 'triaged'
  selectedBundleId: string | null       // NEW -- for TriageRationalePanel
}

interface CoverageActions {
  toggleCategory: (id: string) => void
  clearSelection: () => void
  setViewMode: (mode: ViewMode) => void           // NEW
  selectBundle: (id: string | null) => void        // NEW
}
```

URL sync: `?view=triaged|all_bundles|raw_alerts` query parameter,
mirroring the existing `?category=` pattern.

## Appendix C: Data Query Hooks

```
src/hooks/
  use-intel-bundles.ts        -- NEW: TanStack Query for intel_bundles
  use-triage-decisions.ts     -- NEW: TanStack Query for triage_decisions
  use-bundle-map-data.ts      -- NEW: transform bundles to map markers
```

**use-intel-bundles.ts:**
```typescript
// Query varies by viewMode:
//   'triaged':     WHERE status = 'approved'
//   'all_bundles': no status filter
//   'raw_alerts':  not called (uses existing useCoverageMapData)

const { data } = await supabase
  .from('intel_bundles')
  .select('*, triage_decisions(*)')
  .order('created_at', { ascending: false })
  .limit(50)
```

## Appendix D: Full-Page Layout Reference

World-space coordinates showing all existing and new components:

```
                        Y axis (top = negative)
                              |
  SystemStatusPanel           |           FeedPanel
  (-1400, -450)               |           (1100, -500)
  320 x 900                   |           320 x 800
                              |
            MapLedger         |
            (-850+125-175,    |
             -740+400)        |
                              |
      +--- ViewModeToggle ----+---- (NEW, above map) ---+
      |                       |                          |
      |   CoverageMap         |                          |
      |   (-675, -740)        |                          |
      |   1830 x 900          |                          |
      |                       |                          |
      +--- CoverageOverviewStats ---+                    |
      |   (-675, 200)              |                    |
      |                            |                    |
      +-------- CoverageGrid / BundleGrid (0,0) -------+
      |   (centered, 1600x400)                         |
      +------------------------------------------------+
                              |
                              |           ActivityTicker
                              |           (1100, 490)
                              |           260 x 240
                              |
                        X axis (0 = center)

  Fixed overlays (not in world-space):
    TriageRationalePanel: fixed right, 360px wide, full height
    NavigationHUD: fixed corners
    DistrictViewOverlay: fixed, full screen
```
