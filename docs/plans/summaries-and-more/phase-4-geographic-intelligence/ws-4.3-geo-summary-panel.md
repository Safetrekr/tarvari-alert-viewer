# WS-4.3: GeoSummaryPanel Component

> **Workstream ID:** WS-4.3
> **Phase:** 4 -- Geographic Intelligence
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-4.1 (useThreatPicture hook), WS-4.2 (useGeoSummaries hook), WS-4.6 (coverage store geo state extensions)
> **Blocks:** None
> **Resolves:** AD-3 (560px slide-over from right, z-42), AD-7 (11 travel-security regions), AD-8 (threat picture lives here), R10 (mutual exclusion with DistrictViewOverlay)

## 1. Objective

Create the geographic intelligence slide-over panel -- the primary surface for consuming periodic threat assessments at three geographic levels (World, Region, Country). This panel is where a protective agent answers the question "What is the current threat posture for the areas my travelers are operating in?" It surfaces AI-generated summaries from the TarvaRI backend, structured breakdowns of threats by category and severity, key events, trend data, and actionable recommendations.

The panel is a 560px slide-over from the right edge of the viewport at `z-42`, positioned between the DistrictViewOverlay (`z-30`) and the TriageRationalePanel (`z-45`). It preserves spatial context by keeping the map and grid partially visible to the left, so the operator maintains orientation while reading the threat picture. The content hierarchy descends from World overview to Region drill-down to Country detail, following the 11 travel-security geographic regions defined in AD-7.

This is the only surface that consumes the `/console/threat-picture` and `/console/summaries` API data (AD-8). The threat picture is geographic intelligence -- it provides context and situational awareness, not individual alert detail. It answers "What should I know about this region right now?" rather than "What happened in this specific event?"

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| New component file | Create `src/components/coverage/GeoSummaryPanel.tsx` with named export `GeoSummaryPanel`. |
| Props interface | `GeoSummaryPanelProps` exported for consumer type safety. |
| Slide-over animation | `motion/react` AnimatePresence with spring-based slide from right, matching TriageRationalePanel animation pattern. |
| Z-index placement | `z-42`, viewport-fixed (`position: fixed, inset-y: 0, right: 0`), 560px width. |
| Mutual exclusion with district view | When the morph state machine is in `entering-district`, `district`, or `leaving-district` phase, the geo summary panel cannot open. Opening the panel while district view is active closes district view first. Opening district view while the panel is open closes the panel first. |
| Header with breadcrumb | Geo level breadcrumb navigation: `World > Europe > France`. Breadcrumb segments are clickable to navigate up the hierarchy. Close button (X) dismisses the panel. |
| Threat level badge | Prominent badge showing the current threat level: `LOW`, `MODERATE`, `ELEVATED`, `HIGH`, `CRITICAL`. Color-coded (green through red gradient). |
| Executive summary | AI-generated summary text block from the backend summary data. Rendered as formatted prose with monospace typography. |
| "What's Changed" section | Hourly delta section showing what changed since the last summary. Collapsible. Shows a timestamped "last updated" indicator. |
| Structured breakdown | Four subsections: (1) Threats-by-category horizontal mini bar chart, (2) Severity distribution stacked bar, (3) Key events list with severity indicators, (4) Recommendations list with actionable text. |
| Region/country drill-down | Navigation tiles for the 11 travel-security regions at World level. Each region tile shows the region name, threat level, and alert count. Clicking a region drills down to region-level detail. Region level shows country tiles for drill-down. |
| Keyboard dismiss | `Escape` key closes the panel. Integrated into the existing page-level keyboard shortcut priority chain. |
| Loading state | Skeleton UI while summary data is being fetched. |
| Error state | Error message with retry action when summary fetch fails. |
| Empty state | "No summary available" message when the backend has no summary for the requested geo level/key. |
| Accessibility | Focus trap while panel is open. `aria-label` on panel root. Screen reader-friendly section headings. Breadcrumb uses `<nav aria-label="Geographic breadcrumb">`. Close button has `aria-label="Close geographic summary"`. |
| Page integration | Add `GeoSummaryPanel` to `src/app/(launch)/page.tsx` after the TriageRationalePanel, rendered as a viewport-fixed overlay. |
| Reduced motion | `prefers-reduced-motion: reduce` disables slide animation, panel appears instantly. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `useThreatPicture` hook | Belongs to WS-4.1. This component consumes its return value. |
| `useGeoSummaries` hook | Belongs to WS-4.2. This component consumes its return value. |
| Coverage store geo state extensions | Belongs to WS-4.6. This component reads and writes the store state. |
| Trend indicators on CategoryCard | Belongs to WS-4.4. Independent visual enhancement using threat picture data. |
| Entry point button (THREAT PICTURE) | Belongs to WS-4.5. This component is opened by the entry point; it does not define where the button lives. |
| Backend `/console/threat-picture` endpoint | Backend Phase D dependency. This component consumes the API response. |
| Backend `/console/summaries` endpoint | Backend Phase D dependency. This component consumes the API response. |
| Map region overlay polygons | Deferred item. Geographic region boundaries on the map are a future enhancement. |
| Mobile/responsive layout | Desktop spatial dashboard only. No mobile breakpoints. |
| Print/export of summaries | Future enhancement. Not in initial scope. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-4.1: `useThreatPicture` hook | `src/hooks/use-threat-picture.ts` exporting `useThreatPicture()` which returns `{ data: ThreatPictureData \| undefined, isLoading: boolean, isError: boolean, refetch: () => void }`. `ThreatPictureData` must include: `countsByCategory: { category: string, count: number }[]`, `severityDistribution: { severity: string, count: number }[]`, `priorityBreakdown: { priority: string, count: number }[]`, `regionBreakdown: { regionKey: string, regionName: string, alertCount: number, threatLevel: ThreatLevel }[]`, `trendDirection: 'up' \| 'down' \| 'stable'`, `generatedAt: string` (ISO 8601). | Pending (WS-4.1 not yet implemented) |
| WS-4.2: `useGeoSummaries` hook | `src/hooks/use-geo-summaries.ts` exporting `useGeoSummaries(geoLevel, geoKey)` which returns `{ data: GeoSummary \| undefined, isLoading: boolean, isError: boolean, refetch: () => void }`. `GeoSummary` must include: `summaryText: string`, `structuredBreakdown: StructuredBreakdown`, `generatedAt: string`, `validatedAt: string \| null`, `geoLevel: 'world' \| 'region' \| 'country'`, `geoKey: string`, `threatLevel: ThreatLevel`. `StructuredBreakdown` must include: `threatsByCategory: { category: string, count: number }[]`, `severityDistribution: { severity: string, count: number }[]`, `keyEvents: { title: string, severity: string, category: string, timestamp: string }[]`, `riskTrend: 'increasing' \| 'decreasing' \| 'stable'`, `recommendations: string[]`. | Pending (WS-4.2 not yet implemented) |
| WS-4.6: Coverage store extensions | `geoSummaryOpen: boolean`, `summaryGeoLevel: 'world' \| 'region' \| 'country'`, `summaryGeoKey: string`, `summaryType: 'hourly' \| 'daily'` state fields. `openGeoSummary(level?, key?)`, `closeGeoSummary()`, `drillDownGeo(level, key)` actions. | Pending (WS-4.6 not yet implemented) |
| AD-7: Geographic regions | 11 travel-security regions. Defined as a constant in this component (or in `interfaces/coverage.ts` if WS-4.6 exports it). | Available (defined in combined-recommendations.md) |
| `motion/react` | Animation library for slide-in/out. Already installed in the project. | Available [CODEBASE] |
| `AnimatePresence` | Presence-based enter/exit animations. Already in use across the codebase. | Available [CODEBASE] |
| `lucide-react` | Icon library. Already installed. Icons needed: `X`, `ChevronRight`, `TrendingUp`, `TrendingDown`, `Minus`, `Shield`, `AlertTriangle`, `MapPin`, `Clock`, `RefreshCw`. | Available [CODEBASE] |
| `getCategoryMeta`, `getCategoryColor`, `SEVERITY_COLORS` | Category and severity display helpers from `src/lib/interfaces/coverage.ts`. | Available [CODEBASE] |
| `useCoverageStore` | Coverage store for reading/writing geo summary state. | Available [CODEBASE] |
| `useUIStore` | UI store for reading morph phase (mutual exclusion logic). | Available [CODEBASE] |
| TriageRationalePanel | Reference for slide-over animation pattern, glass material styling, and visual design language. Not a runtime dependency. | Available [CODEBASE] |

## 4. Deliverables

### 4.1 File Location and Export

**File:** `src/components/coverage/GeoSummaryPanel.tsx`

**Exports:**
- `GeoSummaryPanel` -- named function component export
- `GeoSummaryPanelProps` -- named interface export

**Import pattern for consumers (page.tsx):**
```typescript
import { GeoSummaryPanel } from '@/components/coverage/GeoSummaryPanel'
```

**Directive:** `'use client'` at file top. The component uses hooks (`useGeoSummaries`, `useThreatPicture`, `useCoverageStore`, `useUIStore`, `useCallback`, `useEffect`, `useMemo`).

### 4.2 Types and Constants

#### 4.2.1 Threat Level Type

Defined at the module level (or imported from `interfaces/coverage.ts` if WS-4.6 exports it):

```typescript
/** Geographic threat level -- distinct from alert severity. Assessed per-region. */
export type ThreatLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL'

/** Display metadata for each threat level. */
export const THREAT_LEVEL_CONFIG: Record<ThreatLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
  LOW:      { label: 'LOW',      color: 'rgba(34, 197, 94, 0.7)',  bgColor: 'rgba(34, 197, 94, 0.08)',  borderColor: 'rgba(34, 197, 94, 0.2)' },
  MODERATE: { label: 'MODERATE', color: 'rgba(234, 179, 8, 0.7)',  bgColor: 'rgba(234, 179, 8, 0.08)',  borderColor: 'rgba(234, 179, 8, 0.2)' },
  ELEVATED: { label: 'ELEVATED', color: 'rgba(249, 115, 22, 0.7)', bgColor: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.2)' },
  HIGH:     { label: 'HIGH',     color: 'rgba(239, 68, 68, 0.7)',  bgColor: 'rgba(239, 68, 68, 0.08)',  borderColor: 'rgba(239, 68, 68, 0.2)' },
  CRITICAL: { label: 'CRITICAL', color: 'rgba(220, 38, 38, 0.9)',  bgColor: 'rgba(220, 38, 38, 0.12)', borderColor: 'rgba(220, 38, 38, 0.3)' },
}
```

**Design rationale:** Threat level is a geographic assessment (the overall posture for a region), not the same as alert severity (which is per-event). Using a distinct type and color palette prevents confusion. The colors are related to but not identical to `SEVERITY_COLORS` -- they represent assessed posture, not individual event urgency.

#### 4.2.2 Geographic Regions Constant

The 11 travel-security regions defined in AD-7:

```typescript
export interface GeoRegion {
  /** Machine-readable key (e.g. 'middle-east', 'western-europe'). */
  key: string
  /** Human-readable display name. */
  name: string
  /** ISO 3166-1 alpha-2 codes of notable countries in this region. */
  notableCountries: string[]
}

export const GEO_REGIONS: readonly GeoRegion[] = [
  { key: 'north-america',              name: 'North America',              notableCountries: ['US', 'CA', 'MX'] },
  { key: 'central-america-caribbean',  name: 'Central America & Caribbean', notableCountries: ['GT', 'HN', 'CR', 'JM', 'HT'] },
  { key: 'south-america',             name: 'South America',              notableCountries: ['BR', 'AR', 'CO', 'PE', 'CL'] },
  { key: 'western-europe',            name: 'Western Europe',             notableCountries: ['GB', 'FR', 'DE', 'ES', 'IT'] },
  { key: 'eastern-europe',            name: 'Eastern Europe',             notableCountries: ['PL', 'UA', 'RO', 'RU', 'CZ'] },
  { key: 'middle-east',               name: 'Middle East',                notableCountries: ['TR', 'IL', 'SA', 'AE', 'IQ'] },
  { key: 'north-africa',              name: 'North Africa',               notableCountries: ['EG', 'MA', 'TN', 'DZ', 'LY'] },
  { key: 'sub-saharan-africa',        name: 'Sub-Saharan Africa',         notableCountries: ['ZA', 'NG', 'KE', 'ET', 'GH'] },
  { key: 'south-central-asia',        name: 'South & Central Asia',       notableCountries: ['IN', 'PK', 'BD', 'AF', 'KZ'] },
  { key: 'east-southeast-asia',       name: 'East & Southeast Asia',      notableCountries: ['CN', 'JP', 'KR', 'TH', 'PH'] },
  { key: 'oceania',                   name: 'Oceania',                    notableCountries: ['AU', 'NZ', 'FJ', 'PG'] },
] as const
```

**Note on Turkey:** Per AD-7, Turkey (`TR`) maps to Middle East, not Eastern Europe. Russia (`RU`) maps to Eastern Europe.

### 4.3 Props Interface

```typescript
export interface GeoSummaryPanelProps {
  /**
   * Callback invoked when the panel requests closure.
   * The page component should call `closeGeoSummary()` on the coverage store.
   */
  onClose: () => void
}
```

**Design rationale:** The panel reads all data and navigation state from hooks (`useGeoSummaries`, `useThreatPicture`) and the coverage store (`summaryGeoLevel`, `summaryGeoKey`, `geoSummaryOpen`). Only the close callback is passed as a prop to keep the page integration simple and to give the page control over the Escape key priority chain. Internal drill-down navigation calls the store directly.

### 4.4 Component Structure (Internal)

The panel is composed of a root slide-over container with a scrollable content area. The content area renders different views based on the current geo level. Sub-components are defined within the same file (not separate files) because they share types, constants, and styling that are specific to this panel.

```
GeoSummaryPanel(props)
  |-- Hook calls:
  |   |-- useCoverageStore(...)   -> { geoSummaryOpen, summaryGeoLevel, summaryGeoKey,
  |   |                               summaryType, drillDownGeo, closeGeoSummary }
  |   |-- useGeoSummaries(level, key) -> { data: GeoSummary, isLoading, isError, refetch }
  |   |-- useThreatPicture()      -> { data: ThreatPictureData } (for region breakdown)
  |   |-- useUIStore(...)         -> { morphPhase } (for mutual exclusion)
  |
  |-- Mutual exclusion effect: closes panel if morph enters 'entering-district'
  |
  |-- <AnimatePresence>
      |-- (if geoSummaryOpen)
      |-- <motion.div> root slide-over container
          |-- PanelHeader(level, geoKey, onClose)
          |   |-- Close button (X)
          |   |-- GeoBreadcrumb(level, geoKey, onNavigate)
          |   |     |-- "World" link
          |   |     |-- (if region) " > " + region name link
          |   |     |-- (if country) " > " + country name
          |   |-- SummaryTypeToggle(type, onToggle) -- hourly / daily switch
          |
          |-- Scrollable content area
              |-- (if isLoading) <PanelSkeleton />
              |-- (if isError)   <PanelError onRetry={refetch} />
              |-- (if no data)   <PanelEmpty level={level} geoKey={geoKey} />
              |-- (if data)
                  |-- ThreatLevelBadge(threatLevel)
                  |-- SummaryTimestamp(generatedAt, validatedAt)
                  |-- ExecutiveSummary(summaryText)
                  |-- WhatsChangedSection(delta, lastUpdated)
                  |   |-- Collapsible wrapper
                  |   |-- List of change items with severity indicators
                  |-- StructuredBreakdown(breakdown)
                  |   |-- CategoryBreakdownChart(threatsByCategory)
                  |   |-- SeverityDistributionBar(severityDistribution)
                  |   |-- KeyEventsList(keyEvents)
                  |   |-- RecommendationsList(recommendations)
                  |-- (if level === 'world')
                  |   |-- RegionDrillDown(regionBreakdown, onDrillDown)
                  |   |   |-- Grid of RegionTile components (11 regions)
                  |   |   |-- Each tile: name, threat level badge, alert count, chevron
                  |-- (if level === 'region')
                      |-- CountryDrillDown(countries, onDrillDown)
                      |   |-- List of CountryTile components
                      |   |-- Each tile: flag emoji, name, threat level, alert count
```

### 4.5 Slide-Over Container and Animation

The root container follows the established slide-over pattern from `TriageRationalePanel.tsx` and `BuilderModePanel.tsx`, adapted for the wider 560px width and z-42 placement.

**Container styles:**

```typescript
<motion.div
  key="geo-summary-panel"
  initial={{ x: 560, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: 560, opacity: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
  style={{
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 560,
    background: 'rgba(5, 9, 17, 0.96)',
    borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(24px) saturate(140%)',
    WebkitBackdropFilter: 'blur(24px) saturate(140%)',
    boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
    zIndex: 42,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }}
  role="dialog"
  aria-label="Geographic threat summary"
  aria-modal="false"
>
```

**Animation specification:**
- **Enter:** Slides in from `x: 560` (fully off-screen right) to `x: 0`. Spring physics: `stiffness: 300, damping: 30` (same as TriageRationalePanel for consistent feel).
- **Exit:** Slides out to `x: 560` with the same spring physics.
- **Opacity:** Fades from 0 to 1 on enter, 1 to 0 on exit, preventing a hard edge pop.
- **Reduced motion:** When `prefers-reduced-motion: reduce` is active, replace the spring animation with `{ duration: 0 }` for instant appearance.

**Background treatment:** The background is slightly more opaque than the TriageRationalePanel (0.96 vs 0.95) to improve text readability over the longer-form content. The blur and saturation values are increased from the TriageRationalePanel (24px/140% vs 12px/default) to provide stronger visual separation, matching the BuilderModePanel precedent. The panel contains more text content than the TriageRationalePanel, so readability is prioritized.

**aria-modal:** Set to `false` because the panel is not a modal dialog -- it is a supplementary information panel. The underlying spatial canvas remains interactive (the user can still pan and zoom). Focus is trapped within the panel while open, but the user can dismiss it at any time.

### 4.6 Panel Header

The header is fixed at the top of the panel (does not scroll with content). It contains the close button, breadcrumb navigation, and summary type toggle.

**Layout:**

```
+--[X]--+--[World > Europe > France]---------+--[Hourly|Daily]--+
```

**Close button:**
- Positioned at the top-left of the header (matching the district view "Back" button position convention).
- 28x28px, monospace "x" character, same styling as TriageRationalePanel close button.
- `aria-label="Close geographic summary"`.
- Click calls `props.onClose`.

**Breadcrumb:**
- `<nav aria-label="Geographic breadcrumb">` wrapping an `<ol>` with `<li>` elements.
- Segments are separated by `>` in `rgba(255, 255, 255, 0.12)` color.
- Clickable segments use `<button>` elements with `cursor: pointer` and hover states.
- The current (deepest) segment is not a link -- rendered as plain text.
- Font: `var(--font-mono, monospace)`, size `11px`, tracking `0.06em`, uppercase.

**Breadcrumb states by geo level:**

| Level | Breadcrumb Rendered |
|-------|---------------------|
| `world` | **World** (plain text, not clickable) |
| `region` | [World] > **Middle East** |
| `country` | [World] > [Middle East] > **Turkey** |

**Summary type toggle:**
- Two-option pill toggle: `HOURLY` / `DAILY`.
- Positioned at the right side of the header.
- Active option has elevated background (`rgba(255, 255, 255, 0.08)`) and brighter text.
- Inactive option has no background and muted text.
- Font: monospace, `9px`, `tracking-[0.12em]`, uppercase.
- Click calls `useCoverageStore`'s `setSummaryType()` (from WS-4.6) -- the hook refetches with the new type.

**Header container styles:**

```css
padding: 16px 20px;
border-bottom: 1px solid rgba(255, 255, 255, 0.04);
display: flex;
align-items: center;
gap: 12px;
flex-shrink: 0;
```

### 4.7 Threat Level Badge

Displayed immediately below the header, above the executive summary. This is the most prominent visual element in the panel -- it communicates the assessed threat posture at a glance.

**Visual specification:**

```typescript
function ThreatLevelBadge({ level }: { level: ThreatLevel }) {
  const config = THREAT_LEVEL_CONFIG[level]
  // Renders as:
  // [SHIELD_ICON] THREAT LEVEL: HIGH
  // with appropriate color-coding
}
```

**Layout:**
- Full-width banner spanning the content area.
- Left: Shield icon (Lucide `Shield`, 16px) in the threat level color.
- Center-left: "THREAT LEVEL" label in ghost style (`9px`, `rgba(255, 255, 255, 0.15)`).
- Right: The threat level label (e.g., "HIGH") in bold monospace, colored per `THREAT_LEVEL_CONFIG`.

**Container styles:**

```css
display: flex;
align-items: center;
gap: 10px;
padding: 12px 16px;
border-radius: 8px;
background: /* bgColor from THREAT_LEVEL_CONFIG */;
border: 1px solid /* borderColor from THREAT_LEVEL_CONFIG */;
margin-bottom: 16px;
```

**Accessibility:** The badge is `role="status"` with `aria-label="Current threat level: HIGH"` so screen readers announce the assessed level.

### 4.8 Executive Summary

The AI-generated summary text from the backend. This is the primary prose content -- the "briefing" that a protective agent reads to understand the situation.

**Visual specification:**
- Font: `var(--font-mono, monospace)`, `12px`, line-height `1.7`.
- Color: `rgba(255, 255, 255, 0.4)` (slightly brighter than TriageRationalePanel rationale text at 0.35, because this is primary content, not supplementary).
- Background: `rgba(255, 255, 255, 0.02)`.
- Border: `1px solid rgba(255, 255, 255, 0.04)`.
- Border-radius: `8px`.
- Padding: `16px 18px`.
- White-space: `pre-wrap` (preserves paragraph breaks from the backend).

**Section heading:** Ghost-style label "EXECUTIVE SUMMARY" above the text block.

### 4.9 "What's Changed" Section

Displays the hourly delta -- what has changed since the previous summary. This section helps operators who are checking in periodically to quickly scan for new developments without re-reading the full summary.

**Behavior:**
- Collapsible section using a `<details>` / `<summary>` pattern for native accessibility, styled to match the panel's visual language.
- Default state: expanded when the summary type is "hourly", collapsed when "daily" (daily summaries are comprehensive, so the delta is less relevant).
- The section heading shows "WHAT'S CHANGED" with a small clock icon (Lucide `Clock`, 12px) and the time range (e.g., "Last 1 hour").

**Content when data is available:**
- A list of change items, each with:
  - Severity dot (6px circle, severity color) indicating the significance of the change.
  - Brief description text (from the backend delta data).
  - Timestamp of when the change was detected.
- Items sorted by recency (most recent first).

**Content when no changes:**
- A single muted message: "No significant changes in the last hour."
- Monospace, `11px`, `rgba(255, 255, 255, 0.2)`.

**Design rationale:** Using native `<details>` / `<summary>` rather than a custom accordion provides free keyboard support (Enter/Space toggles) and screen reader support (expanded/collapsed state announced). The `<summary>` element is styled to look like the panel's section headers.

### 4.10 Structured Breakdown

Four subsections that provide quantitative detail behind the executive summary. Each subsection has a ghost-style heading and a compact visualization.

#### 4.10.1 Threats by Category -- Horizontal Bar Chart

A compact horizontal bar chart showing alert counts per category.

**Visual specification:**
- Each row: category short name (e.g., "SEIS") in the category's color, followed by a horizontal bar proportional to the count, followed by the count value.
- Bar background: `rgba(255, 255, 255, 0.04)`.
- Bar fill: the category's color at 40% opacity.
- Bar height: 6px, border-radius 3px.
- Max bar width: calculated relative to the maximum count (the largest count fills 100% of available width).
- Categories sorted by count descending.
- Only categories with count > 0 are shown.

**Implementation:** Rendered with plain `<div>` elements (not a charting library). The proportional width is computed as `(count / maxCount) * 100%`. This keeps the bundle size zero for this visualization.

**Layout per row:**
```
[SEIS] ████████████████████     12
[WX  ] ████████████              7
[CON ] ██████                    3
```

Font: monospace, `10px` for short names, `10px` for counts. Short name color: category color at 60% opacity. Count color: `rgba(255, 255, 255, 0.3)`.

#### 4.10.2 Severity Distribution -- Stacked Bar

A single horizontal stacked bar showing the proportional distribution of alert severities.

**Visual specification:**
- Full-width horizontal bar, height 8px, border-radius 4px.
- Segments colored by severity (`SEVERITY_COLORS` from `interfaces/coverage.ts`).
- Segments ordered left to right: Extreme, Severe, Moderate, Minor, Unknown.
- Below the bar: a compact legend showing severity labels with counts.
- If a severity has 0 alerts, its segment is omitted (no zero-width segments).

**Legend layout (below bar):**
```
Extreme: 3  |  Severe: 7  |  Moderate: 12  |  Minor: 5
```

Font: monospace, `9px`, severity color for labels, `rgba(255, 255, 255, 0.25)` for counts.

#### 4.10.3 Key Events List

A chronological list of the most significant events in the assessed period.

**Visual specification:**
- Each event item:
  - Severity badge (small inline pill, same style as district view's severity badges).
  - Event title text, monospace `11px`, `rgba(255, 255, 255, 0.35)`.
  - Category short code in parentheses, category color, `9px`.
  - Relative timestamp, `9px`, `rgba(255, 255, 255, 0.2)`.
- Maximum 10 events shown (the backend controls the list length).
- Events sorted by timestamp descending (most recent first).
- Separator: `1px solid rgba(255, 255, 255, 0.03)` between items.

**Event item layout:**
```
[SEVERE] M6.2 earthquake near Izmir (SEIS)                    2h ago
```

#### 4.10.4 Recommendations List

Actionable recommendations from the AI-generated summary.

**Visual specification:**
- Numbered list (1. 2. 3. ...) with recommendation text.
- Number: monospace, `10px`, `rgba(255, 255, 255, 0.2)`.
- Text: monospace, `11px`, line-height `1.6`, `rgba(255, 255, 255, 0.35)`.
- Container: `rgba(255, 255, 255, 0.02)` background, `1px solid rgba(255, 255, 255, 0.04)` border, `8px` border-radius, `14px 16px` padding.
- Section heading: "RECOMMENDATIONS" in ghost style.
- If no recommendations: show "No specific recommendations at this time." in muted text.

### 4.11 Region Drill-Down (World Level)

When the panel is at the World geo level, the bottom section shows navigation tiles for the 11 travel-security regions. This allows the operator to drill into any region for more detail.

**Visual specification:**
- Section heading: "REGIONS" in ghost style.
- Grid layout: 2 columns, gap `8px`.
- Each region tile is a clickable `<button>` element.

**Region tile layout:**
```
+----------------------------------------+
| Middle East                     [HIGH] |
| 23 alerts                          >   |
+----------------------------------------+
```

**Region tile styles:**
- Background: `rgba(255, 255, 255, 0.02)`.
- Border: `1px solid rgba(255, 255, 255, 0.06)`.
- Border-radius: `8px`.
- Padding: `12px 14px`.
- Hover: background transitions to `rgba(255, 255, 255, 0.05)`, border to `rgba(255, 255, 255, 0.10)`.
- Region name: monospace, `11px`, `rgba(255, 255, 255, 0.4)`, font-weight `500`.
- Alert count: monospace, `9px`, `rgba(255, 255, 255, 0.2)`.
- Threat level: inline badge using `THREAT_LEVEL_CONFIG` colors, `9px`, uppercase, font-weight `600`.
- Chevron: Lucide `ChevronRight`, `12px`, `rgba(255, 255, 255, 0.15)`.
- Cursor: `pointer`.

**Click behavior:** Calls `drillDownGeo('region', regionKey)` on the coverage store (WS-4.6), which updates `summaryGeoLevel` and `summaryGeoKey`. The `useGeoSummaries` hook (WS-4.2) refetches with the new parameters. The breadcrumb updates to show `World > [Region Name]`.

**Keyboard:** Each tile is a `<button>` with `aria-label="View threat summary for Middle East, threat level high, 23 alerts"`.

### 4.12 Country Drill-Down (Region Level)

When the panel is at the Region geo level, the bottom section shows country tiles for the countries in that region. The country list is derived from the `useGeoSummaries` response (the backend returns countries with their threat assessments) or falls back to the `notableCountries` array from `GEO_REGIONS`.

**Visual specification:**
- Similar to region tiles but in a single-column list layout.
- Each country tile shows: country name, threat level badge, alert count, chevron.
- Tiles are sorted by threat level descending (CRITICAL first), then by alert count descending.

**Country tile layout:**
```
+------------------------------------------------------+
| Turkey                          [HIGH]     12 alerts >|
+------------------------------------------------------+
```

**Click behavior:** Calls `drillDownGeo('country', countryCode)`. Breadcrumb updates to `World > [Region] > [Country]`. The `useGeoSummaries` hook refetches.

At the country level, there are no further drill-down tiles -- the panel shows only the summary content (threat level, executive summary, what's changed, structured breakdown).

### 4.13 Mutual Exclusion Logic (R10)

The GeoSummaryPanel at z-42 and the DistrictViewOverlay at z-30 are both large viewport surfaces. While z-42 renders above z-30, having both open simultaneously creates visual clutter and cognitive overload. They must be mutually exclusive.

**Implementation:**

```typescript
// Inside GeoSummaryPanel component:
const morphPhase = useUIStore((s) => s.morph.phase)
const closeGeoSummary = useCoverageStore((s) => s.closeGeoSummary)

// Auto-close when district view activates
useEffect(() => {
  if (morphPhase === 'entering-district' || morphPhase === 'district') {
    closeGeoSummary()
  }
}, [morphPhase, closeGeoSummary])
```

**Reverse direction (opening geo panel while in district):** This case is handled by the entry point (WS-4.5). The "THREAT PICTURE" button should be disabled or hidden when the morph state machine is not `idle`. The geo summary panel itself does not need to handle this case -- it simply will not be opened.

**Rationale:** The geo panel auto-closes when district view opens because the district view is a full-screen overlay (z-30) with its own dock panel (z-31). Showing a 560px geo panel over a full-screen district view would obscure most of the district content. The user can reopen the geo panel after returning from district view.

### 4.14 Loading State

Displayed while `useGeoSummaries` returns `isLoading: true`.

**Visual specification:**
- Threat level badge area: skeleton rectangle (160x32px) with shimmer animation.
- Executive summary area: three skeleton text lines at varying widths (100%, 90%, 70%) with shimmer.
- What's Changed section: two skeleton rows with shimmer.
- Structured breakdown: skeleton bar chart (4 rows), skeleton stacked bar, skeleton list (3 items).
- All skeletons use `rgba(var(--ambient-ink-rgb), 0.06)` background with the same shimmer animation pattern as the PriorityFeedStrip (WS-2.2).

**Shimmer CSS:** Reuse the `priority-strip-shimmer` keyframes if already injected, or define panel-specific `geo-panel-shimmer` keyframes with the same visual pattern:

```css
@keyframes geo-panel-shimmer {
  0% { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
```

### 4.15 Error State

Displayed when `useGeoSummaries` returns `isError: true`.

**Visual specification:**
- Centered in the content area.
- AlertTriangle icon (Lucide, 24px) in `rgba(239, 68, 68, 0.5)`.
- "Failed to load summary" heading in monospace, `13px`, `rgba(255, 255, 255, 0.4)`.
- "The threat summary for [level/key] could not be retrieved." description in monospace, `11px`, `rgba(255, 255, 255, 0.25)`.
- "Retry" button (monospace, `10px`, uppercase, `tracking-[0.1em]`, border `1px solid rgba(255, 255, 255, 0.08)`, background `rgba(255, 255, 255, 0.04)`, cursor pointer). Click calls `refetch()`.
- Padding: `60px 20px` (generous vertical padding to center in the scroll area).

### 4.16 Empty State

Displayed when `useGeoSummaries` returns data but `summaryText` is empty or null.

**Visual specification:**
- Centered in the content area.
- MapPin icon (Lucide, 24px) in `rgba(255, 255, 255, 0.15)`.
- "No summary available" heading in monospace, `13px`, `rgba(255, 255, 255, 0.3)`.
- "A threat summary for [geo level name] has not been generated yet. Summaries are generated periodically by the intelligence system." description in monospace, `11px`, `rgba(255, 255, 255, 0.2)`.

### 4.17 Escape Key Handling

The `Escape` key closes the panel. This must integrate with the existing keyboard shortcut priority chain defined in `page.tsx` (lines 324-337).

**Current Escape priority chain (page.tsx):**
1. INSPECT detail panel (`selectedMapAlertId`) -- highest priority
2. Triage panel (`selectedBundleId`)
3. Command palette

**Updated Escape priority chain with GeoSummaryPanel:**
1. INSPECT detail panel (`selectedMapAlertId`)
2. Triage panel (`selectedBundleId`)
3. **Geo summary panel (`geoSummaryOpen`)** -- new, between triage and command palette
4. Command palette

**Implementation approach:** The page.tsx Escape handler is updated to check `geoSummaryOpen` before falling through to the command palette:

```typescript
{
  key: 'Escape',
  handler: () => {
    if (selectedMapAlertId) {
      handleCloseInspect()
    } else if (selectedBundleId) {
      setSelectedBundleId(null)
    } else if (geoSummaryOpen) {
      closeGeoSummary()
    } else {
      setCommandPaletteOpen(false)
    }
  },
  label: 'Close Panel',
},
```

The `geoSummaryOpen` state and `closeGeoSummary` action come from the coverage store (WS-4.6). The page component reads them via `useCoverageStore`.

### 4.18 Focus Management

When the panel opens, focus should move to the close button (the first interactive element). When the panel closes, focus returns to the element that triggered the opening (the "THREAT PICTURE" button from WS-4.5).

**Implementation:**
- Store a ref to the trigger element before opening (`document.activeElement`).
- On panel mount, call `closeButtonRef.current?.focus()` in a `useEffect`.
- On panel unmount (AnimatePresence `onExitComplete`), restore focus to the stored trigger ref.

**Tab order within the panel:**
1. Close button
2. Summary type toggle (hourly/daily)
3. Breadcrumb navigation links (if any)
4. What's Changed section toggle (if collapsible)
5. Region/country drill-down tiles (if at world/region level)
6. Retry button (if in error state)

Focus cycling is constrained to the panel while it is open. After the last focusable element, Tab wraps back to the close button. Shift+Tab from the close button wraps to the last focusable element. This is implemented using a focus trap utility (either a lightweight custom implementation or an existing library if one is already in the dependency tree).

### 4.19 Scrollable Content Area

The content below the header is scrollable. The header (breadcrumb, close button, type toggle) remains fixed at the top.

**Implementation:**
```typescript
<div
  style={{
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '20px',
  }}
>
  {/* All content sections */}
</div>
```

**Scrollbar styling:** The scrollbar uses the same ultra-subtle styling as the district view dock:
- Webkit scrollbar: `4px` width, `rgba(255, 255, 255, 0.06)` thumb, transparent track.
- Firefox: `scrollbar-width: thin`, `scrollbar-color: rgba(255, 255, 255, 0.06) transparent`.

### 4.20 Section Separator Pattern

Between major content sections (threat level badge, executive summary, what's changed, structured breakdown, drill-down), use a thin horizontal rule:

```typescript
function SectionDivider() {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        margin: '20px 0',
      }}
      aria-hidden="true"
    />
  )
}
```

This matches the separator pattern used in `DistrictViewDock` and `TriageRationalePanel`.

### 4.21 Ghost Label Pattern

Section headings use the same ghost label pattern established across the codebase:

```typescript
const GHOST: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 10,
  color: 'rgba(255, 255, 255, 0.15)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  marginBottom: 8,
  fontWeight: 500,
}
```

Used for: "EXECUTIVE SUMMARY", "WHAT'S CHANGED", "THREATS BY CATEGORY", "SEVERITY DISTRIBUTION", "KEY EVENTS", "RECOMMENDATIONS", "REGIONS", "COUNTRIES".

### 4.22 Summary Timestamp Display

Below the threat level badge, a timestamp line shows when the summary was generated and whether it has been validated.

**Visual specification:**
```
Generated: Mar 5, 2026, 14:30 UTC  |  Validated: Mar 5, 2026, 14:32 UTC
```

Or if not yet validated:
```
Generated: Mar 5, 2026, 14:30 UTC  |  Awaiting validation
```

- Font: monospace, `9px`, `rgba(255, 255, 255, 0.15)`.
- The "Awaiting validation" text uses a slightly different color: `rgba(234, 179, 8, 0.3)` (amber tint) to indicate the summary has not been human-reviewed.
- A refresh icon (Lucide `RefreshCw`, `10px`) before "Generated" to hint at the periodic nature.

### 4.23 Page Integration

Add `GeoSummaryPanel` to `src/app/(launch)/page.tsx` as a viewport-fixed overlay, positioned after the TriageRationalePanel and before the NavigationHUD.

**New import:**
```typescript
import { GeoSummaryPanel } from '@/components/coverage/GeoSummaryPanel'
```

**New store reads in the page component:**
```typescript
const geoSummaryOpen = useCoverageStore((s) => s.geoSummaryOpen)
const closeGeoSummary = useCoverageStore((s) => s.closeGeoSummary)
```

**New JSX block (insert after TriageRationalePanel, before NavigationHUD):**
```tsx
{/* Geographic intelligence slide-over panel (fixed, z-42) */}
<GeoSummaryPanel onClose={closeGeoSummary} />
```

**Note:** The panel manages its own visibility via `geoSummaryOpen` from the coverage store. The `AnimatePresence` wrapper inside the component handles enter/exit animations. The page does not need to conditionally render the component -- it is always mounted and the AnimatePresence gates visibility.

**Updated Escape handler:** Extend the existing `shortcuts` array's Escape handler to include `geoSummaryOpen` check (see Section 4.17).

### 4.24 Text Styles Reference

All text in the panel uses the monospace font stack.

| Element | Font Size | Weight | Color | Letter Spacing | Other |
|---------|-----------|--------|-------|----------------|-------|
| Section heading (ghost) | `10px` | `500` | `rgba(255, 255, 255, 0.15)` | `0.12em` | `uppercase` |
| Breadcrumb segment (active) | `11px` | `400` | `rgba(255, 255, 255, 0.4)` | `0.06em` | `uppercase` |
| Breadcrumb segment (link) | `11px` | `400` | `rgba(255, 255, 255, 0.25)` | `0.06em` | `uppercase`, hover to 0.4 |
| Breadcrumb separator | `11px` | `400` | `rgba(255, 255, 255, 0.12)` | -- | -- |
| Threat level label | `12px` | `700` | per `THREAT_LEVEL_CONFIG` | `0.1em` | `uppercase` |
| Executive summary | `12px` | `400` | `rgba(255, 255, 255, 0.4)` | `0.01em` | `line-height: 1.7` |
| What's Changed item | `11px` | `400` | `rgba(255, 255, 255, 0.35)` | `0.02em` | -- |
| Category short name | `10px` | `500` | category color at 0.6 | `0.06em` | `uppercase` |
| Count value | `10px` | `400` | `rgba(255, 255, 255, 0.3)` | `0.04em` | `tabular-nums` |
| Key event title | `11px` | `400` | `rgba(255, 255, 255, 0.35)` | `0.02em` | -- |
| Key event timestamp | `9px` | `400` | `rgba(255, 255, 255, 0.2)` | `0.04em` | -- |
| Recommendation text | `11px` | `400` | `rgba(255, 255, 255, 0.35)` | `0.01em` | `line-height: 1.6` |
| Region tile name | `11px` | `500` | `rgba(255, 255, 255, 0.4)` | `0.04em` | -- |
| Region tile count | `9px` | `400` | `rgba(255, 255, 255, 0.2)` | `0.04em` | -- |
| Summary type toggle (active) | `9px` | `600` | `rgba(255, 255, 255, 0.5)` | `0.12em` | `uppercase` |
| Summary type toggle (inactive) | `9px` | `400` | `rgba(255, 255, 255, 0.2)` | `0.12em` | `uppercase` |
| Timestamp line | `9px` | `400` | `rgba(255, 255, 255, 0.15)` | `0.04em` | -- |
| Empty/error heading | `13px` | `500` | `rgba(255, 255, 255, 0.3-0.4)` | `0.04em` | -- |
| Empty/error description | `11px` | `400` | `rgba(255, 255, 255, 0.2-0.25)` | `0.02em` | `line-height: 1.6` |

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `GeoSummaryPanel` is exported as a named export from `src/components/coverage/GeoSummaryPanel.tsx`. | `import { GeoSummaryPanel } from '@/components/coverage/GeoSummaryPanel'` resolves without error. `pnpm typecheck` passes. |
| AC-2 | The panel renders as a 560px-wide slide-over from the right edge, at `z-index: 42`. | DOM inspection: width is 560px, `position: fixed`, `right: 0`, `top: 0`, `bottom: 0`, `z-index: 42`. |
| AC-3 | The panel slides in from the right with spring animation on open, and slides out on close. | Visual inspection: smooth slide-in/out animation. No instant pop. Spring physics feel consistent with TriageRationalePanel. |
| AC-4 | `prefers-reduced-motion: reduce` disables the slide animation. The panel appears and disappears instantly. | Enable reduced motion in OS settings. Panel opens/closes without animation. |
| AC-5 | The geo breadcrumb displays correctly for all three levels: "World" (world), "World > Middle East" (region), "World > Middle East > Turkey" (country). | Navigate to each level and verify breadcrumb text. |
| AC-6 | Clicking a breadcrumb ancestor segment navigates up the hierarchy. | At country level, click "World" in breadcrumb -- panel shows world-level summary. Click region name -- panel shows region-level summary. |
| AC-7 | The threat level badge displays the correct level (LOW/MODERATE/ELEVATED/HIGH/CRITICAL) with appropriate color coding. | Visual inspection: badge color matches `THREAT_LEVEL_CONFIG`. Screen reader announces "Current threat level: [LEVEL]". |
| AC-8 | The executive summary text renders with proper formatting (line breaks preserved, monospace font, readable contrast). | Visual inspection: text is readable, paragraph breaks are preserved, styling matches spec. |
| AC-9 | The "What's Changed" section is collapsible. Default state: expanded for hourly, collapsed for daily. | Toggle the section. Verify expand/collapse works. Switch between hourly/daily and verify default state changes. |
| AC-10 | When no changes exist in the delta period, the section shows "No significant changes in the last hour." | Test with backend returning empty delta. Verify message renders. |
| AC-11 | The threats-by-category chart renders horizontal bars proportional to alert counts, colored by category. | Visual inspection: bars scale correctly relative to the max count. Colors match category colors. |
| AC-12 | The severity distribution bar shows a stacked horizontal bar with segments for each severity level. | Visual inspection: segments are proportional, colors match severity colors, legend shows counts. |
| AC-13 | The key events list shows up to 10 events with severity badge, title, category code, and timestamp. | Count list items (max 10). Verify each item has severity badge, title, category, and relative time. |
| AC-14 | The recommendations list renders numbered items with readable text. Empty state shows "No specific recommendations at this time." | Visual inspection of recommendations rendering. Test empty state. |
| AC-15 | At world level, 11 region drill-down tiles are displayed in a 2-column grid. | Count tiles (11). Verify 2-column layout. Each tile shows region name, threat level, alert count, chevron. |
| AC-16 | Clicking a region tile navigates to region-level summary. | Click a region tile. Breadcrumb updates. Content shows region-specific summary. |
| AC-17 | At region level, country drill-down tiles are displayed. Clicking a country tile navigates to country-level summary. | Click a country tile. Breadcrumb updates to show three levels. Content shows country-specific summary. |
| AC-18 | The summary type toggle switches between "hourly" and "daily" views, triggering a data refetch. | Toggle between hourly and daily. Verify content changes. Network tab shows new API request. |
| AC-19 | Pressing `Escape` closes the panel. Escape priority: INSPECT > triage > **geo panel** > command palette. | Open geo panel, press Escape -- panel closes. Open geo panel + triage panel, press Escape -- triage closes first, second Escape closes geo panel. |
| AC-20 | The panel and district view overlay are mutually exclusive. Opening district view auto-closes the geo panel. | Open geo panel. Click a category card to start morph. Verify: geo panel closes. |
| AC-21 | Loading state shows skeleton UI with shimmer animation while data is fetching. | Observe panel opening before data arrives. Verify skeleton elements are visible with shimmer. |
| AC-22 | Error state shows error message with a functional "Retry" button. | Simulate API error (network disconnect). Verify error UI renders. Click Retry -- refetch triggers. |
| AC-23 | Empty state shows "No summary available" with explanatory text. | Test with backend returning empty summary. Verify empty state UI. |
| AC-24 | Focus moves to the close button when the panel opens. | Open panel. Verify: close button is focused (visible focus ring). |
| AC-25 | Tab order cycles through interactive elements within the panel. Tab does not escape the panel while open. | Open panel. Tab through all interactive elements. Verify: focus wraps from last element back to close button. |
| AC-26 | The scrollable content area scrolls independently. The header (breadcrumb, close, toggle) remains fixed. | Scroll panel content. Verify: header stays fixed at top. Content scrolls beneath it. |
| AC-27 | The panel root element has `role="dialog"` and `aria-label="Geographic threat summary"`. | DOM inspection: role and aria-label present. |
| AC-28 | The breadcrumb uses `<nav aria-label="Geographic breadcrumb">` with proper `<ol>` / `<li>` structure. | DOM inspection: semantic breadcrumb markup present. |
| AC-29 | Region and country tiles have descriptive `aria-label` attributes (e.g., "View threat summary for Middle East, threat level high, 23 alerts"). | DOM inspection: aria-labels present on all tiles. |
| AC-30 | `pnpm typecheck` passes with no errors after adding the component and page integration. | TypeScript compiler exits with code 0. |
| AC-31 | `pnpm build` completes without errors. | Build pipeline exits 0. |
| AC-32 | The panel's z-42 renders above the NavigationHUD at z-40 but below the TriageRationalePanel at z-45. | Open geo panel. Verify: it renders above HUD elements, below the triage panel if both were visible. |
| AC-33 | The timestamp display shows "Generated" and "Validated" times (or "Awaiting validation" when not validated). | Visual inspection: timestamps render correctly for both validated and unvalidated summaries. |
| AC-34 | Categories in the threats-by-category chart are sorted by count descending. Only categories with count > 0 appear. | Verify: highest-count category is at the top. Zero-count categories are absent. |
| AC-35 | Key events are sorted by timestamp descending (most recent first). | Verify: first event in the list has the most recent timestamp. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Panel width is 560px, wider than TriageRationalePanel (380px) and narrower than BuilderModePanel (480px). | The geo summary panel contains structured breakdowns (bar charts, event lists, recommendations) and drill-down navigation that need more horizontal space than a simple rationale display. 560px provides room for the category chart bars to be readable and the 2-column region grid to lay out comfortably, while still leaving ~60% of a 1440px viewport visible for spatial context. | (a) 480px (match BuilderModePanel) -- too narrow for the 2-column region grid + chart bars. (b) 640px -- leaves less than half the viewport visible on 1440px screens, undermining AD-3's goal of preserving spatial context. (c) Full-screen overlay -- rejected by AD-3 consensus. |
| D-2 | Sub-components are defined within the same file rather than split into separate files. | The sub-components (ThreatLevelBadge, GeoBreadcrumb, CategoryBreakdownChart, etc.) share types, constants, and styling patterns that are specific to this panel. Splitting them into separate files would create a `GeoSummary/` directory with 8-10 small files that each import the same shared constants. A single file keeps colocation tight and makes the component self-contained. The file will be large (~600-800 lines) but each sub-component is short and well-separated with comment headers. | (a) Directory with separate files per sub-component -- viable if the file grows beyond ~1000 lines. Can refactor later. (b) Shared constants file + separate component files -- adds file navigation overhead for tightly coupled components. |
| D-3 | Use `<details>` / `<summary>` for the "What's Changed" collapsible section rather than a custom accordion with motion/react. | Native `<details>` provides free keyboard support (Enter/Space), screen reader state announcement (expanded/collapsed), and zero JavaScript cost. The animation of expand/collapse is secondary to the content -- protective agents care about what changed, not how smoothly the section animates open. CSS `transition` on `<details>` content can provide subtle height animation where supported. | (a) Custom accordion with motion/react `AnimatePresence` -- heavier, requires managing open/closed state, adds animation code. Would be appropriate if the section had complex multi-step reveal. (b) Always-visible (no collapse) -- wastes vertical space in the daily view where the section is less relevant. |
| D-4 | Bar charts use plain `<div>` elements with percentage widths rather than a charting library (recharts, visx, nivo). | The visualizations are minimal: a single horizontal bar chart and a stacked bar. Both are straightforward `width: X%` calculations on `<div>` elements. Adding a charting library would add 50-200KB to the bundle for two simple visualizations. The div-based approach also gives full control over the styling to match the panel's monospace/glass aesthetic without fighting library defaults. | (a) recharts -- adds ~120KB gzipped, overkill for two bar charts. (b) visx -- lighter but still adds unnecessary dependency management. (c) SVG-based custom charts -- viable alternative, provides more precise control over rendering, but adds complexity for simple horizontal bars where div width percentages work perfectly. |
| D-5 | Focus is trapped within the panel while open, even though `aria-modal` is `false`. | The panel is a 560px surface that covers the right side of the viewport. While the spatial canvas remains theoretically interactive, tabbing out of the panel into the canvas (which has custom pan/zoom behavior) would create a confusing experience. Focus trapping keeps keyboard navigation predictable. Setting `aria-modal="false"` communicates to assistive technology that the underlying content is not inert, which is truthful -- it is visible and could be interacted with via mouse. | (a) `aria-modal="true"` with full inertness -- too restrictive, prevents map interaction while reading the summary. (b) No focus trap -- allows Tab to escape into the spatial canvas, creating unpredictable focus behavior. |
| D-6 | The panel auto-closes when district view opens (morph enters `entering-district`) rather than rendering on top of district view. | Even though z-42 > z-30, showing a 560px slide-over on top of a full-screen district view would obscure most of the district content (the dock panel is on the right side, exactly where the geo panel would render). The district view and geo summary serve different information needs and the operator should focus on one at a time. | (a) Render on top of district view -- creates visual clutter, obscures the district dock panel which occupies the same right edge. (b) Disable the geo panel button during district view -- handles the "don't open" case but not the "already open when district starts" case. (c) Both: auto-close + disable button -- current approach covers both directions. |
| D-7 | Geo summary panel Escape priority is placed between triage panel and command palette, not at the top of the chain. | The INSPECT and triage panels show individual alert/bundle detail that the user explicitly navigated to -- closing them first preserves the larger context (geo summary). The geo summary is a reference panel, not a navigation destination. Escape should close the most focused/specific panel first, then work outward to broader panels. | (a) Highest priority (close geo panel before anything) -- would frustrate users who opened triage detail while the geo panel was also open, forcing them to reopen the triage panel. (b) Lowest priority (below command palette) -- geo panel is more substantial than the command palette and should take priority. |
| D-8 | The 11 geographic regions are defined as a constant array within the component file rather than being fetched from the backend. | The region taxonomy is a product decision (AD-7), not data. It changes rarely (new regions would require product approval and backend changes). Hardcoding it ensures the panel always renders region tiles even when the backend is slow or unavailable. The backend maps countries to regions using the same taxonomy. | (a) Fetch from backend `/console/regions` endpoint -- adds a dependency, delays rendering, and the data is effectively static. (b) Define in `interfaces/coverage.ts` -- viable and may be moved there if WS-4.6 needs the regions for store validation, but for now the panel is the only consumer. |
| D-9 | The summary type toggle (hourly/daily) is placed in the header rather than in the content area. | The toggle changes the entire content of the panel, not a single section. Placing it in the fixed header ensures it is always visible and accessible regardless of scroll position. It is functionally a "view mode" switch, similar to the ViewModeToggle on the main page. | (a) In the content area, above the executive summary -- scrolls out of view when reading long summaries, making it hard to switch. (b) As a dropdown -- adds a click to a two-option choice, unnecessarily complex. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| Q-1 | What is the exact shape of the `/console/summaries` response for the "What's Changed" section? The combined-recommendations.md mentions "hourly delta" but does not specify whether this is a separate field in the response or derived by comparing two summaries. If the backend provides a `delta` field, what is its structure? If not, should the component derive changes by diffing the hourly and previous hourly summaries? | WS-4.2 implementer / Backend Phase D | Phase 4 |
| Q-2 | How should the panel handle the case where a region has no countries with sufficient data for country-level summaries? Should it show the `notableCountries` from `GEO_REGIONS` with "No summary available" badges, or should it only show countries that have actual summary data? | UX advisory / Information architect | Phase 4 |
| Q-3 | Should the panel maintain navigation state (which region/country was being viewed) across open/close cycles? Currently specified: the store preserves `summaryGeoLevel` and `summaryGeoKey`, so reopening shows the last-viewed level. Is this the desired behavior, or should reopening always start at World level? | UX advisory | Phase 4 |
| Q-4 | The combined-recommendations.md Open Question #2 asks about the "What's Changed" empty state: show "No changes in the last hour" or hide the section entirely? This SOW specifies showing the message. Confirm this is the preferred approach. | UX advisory | Phase 4 |
| Q-5 | Should the threats-by-category chart in the structured breakdown use the panel's geo-level counts (only alerts in the selected region) or the global threat picture counts? At world level they would be the same, but at region/country level the chart should presumably show only the local counts. Confirm that `useGeoSummaries` provides geo-filtered category counts in `structuredBreakdown.threatsByCategory`. | WS-4.2 implementer | Phase 4 |
| Q-6 | The focus trap implementation: should we add a lightweight dependency (e.g., `focus-trap-react`, ~4KB) or implement a custom focus trap? The codebase does not currently use a focus trap library. The command palette (Dialog component) likely has its own focus management via Radix. | react-developer | Phase 4 (decided during implementation) |
| Q-7 | At country level, should the panel show a small inline map of the country or just text-based summary? An inline map would use the existing MapLibre integration but would need careful SSR handling and add rendering complexity. | UX advisory / Protective agent advisory | Deferred (future enhancement) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Backend Phase D (`/console/summaries` endpoint) returns a `structured_breakdown` shape that differs from the assumed TypeScript types in this SOW. | Medium | Medium | The component's sub-components (CategoryBreakdownChart, SeverityDistributionBar, etc.) each accept a narrow props interface. If the backend shape differs, only the data-mapping layer in the main component needs to change -- the sub-components render whatever they receive. Add a Zod schema validation layer (pattern from WS-D31) to catch shape mismatches at runtime with clear error messages. |
| R-2 | The 560px panel width causes content overflow or awkward wrapping on 1280px-wide viewports (the narrowest common desktop resolution). | Low | Medium | At 1280px viewport, the panel consumes ~44% of the viewport, leaving 720px for the spatial canvas. This is tight but functional -- the map and grid are still partially visible. Test at 1280px during implementation. If problematic, reduce to 520px (matches half of a 1040px content area at 1280px minus scroll bar). The region grid can switch from 2-column to 1-column at narrow panel widths. |
| R-3 | The mutual exclusion with DistrictViewOverlay causes jarring UX when the user opens district view while reading a geo summary. The panel closes instantly, losing their reading position. | Medium | Low | The `closeGeoSummary()` action in WS-4.6 preserves `summaryGeoLevel` and `summaryGeoKey` in the store. When the user returns from district view and reopens the geo panel, it resumes at the same geo level and key, minimizing context loss. The exit animation (slide-out) provides visual continuity rather than an abrupt disappearance. |
| R-4 | The summary data from `/console/summaries` is stale (generated hours ago) and the operator doesn't notice, leading to a false sense of security. | Medium | High | The timestamp display (Section 4.22) prominently shows when the summary was generated and whether it was validated. If the summary is older than 2 hours, add a visual indicator: amber-tinted border on the executive summary container with text "Summary generated X hours ago. More recent data may be available in the alert feed." This age-based warning is not specified in the backend but can be derived client-side from `generatedAt`. |
| R-5 | The focus trap implementation conflicts with the spatial canvas's custom keyboard handling (pan with arrow keys, zoom with +/-, etc.) when the panel is open. | Low | Low | The focus trap only intercepts Tab/Shift+Tab for focus cycling. Arrow keys, +/-, Home, and other spatial navigation keys pass through to the canvas's global keyboard handlers (which are mounted on the document, not the panel). The focus trap does not call `event.stopPropagation()` on non-Tab keys. |
| R-6 | The `useGeoSummaries` hook (WS-4.2) refetches every time the user navigates up/down the breadcrumb hierarchy, causing visible loading states during quick navigation. | Medium | Low | TanStack Query caches responses by query key (`['geo-summary', level, key, type]`). Previously visited levels are served from cache instantly. Only the first visit to a level/key combination triggers a network request. The `staleTime` configuration in WS-4.2 controls how long cached summaries are considered fresh (recommended: 120s for geographic summaries, matching the threat picture poll interval from WS-4.1). |
| R-7 | The panel competes visually with the NavigationHUD at z-40. Both are viewport-fixed and the HUD spans the full viewport. Elements at z-40 (Minimap, breadcrumb, zoom indicator, logout button) render behind the panel at z-42 but may be partially obscured. | Low | Low | The HUD elements are positioned at the left (minimap, breadcrumb, logout) and top-right (zoom indicator, color scheme switcher). The geo panel occupies the right 560px. Only the zoom indicator and color scheme switcher (top-right, z-40) would be behind the panel. These are small, ancillary controls. The zoom indicator width is ~60px and sits at `right: 16px` -- it will be fully covered by the 560px panel. This is acceptable: while reading a threat summary, the user is not zooming. If this becomes a UX issue, the zoom indicator could be hidden while the panel is open. |
| R-8 | The component file size exceeds 1000 lines due to the number of sub-components and visual specifications. | Medium | Low | Decision D-2 acknowledges this possibility. If the file exceeds ~1000 lines during implementation, extract the sub-components into a `GeoSummaryPanel/` directory: `index.tsx` (main), `ThreatLevelBadge.tsx`, `StructuredBreakdown.tsx`, `DrillDownNavigation.tsx`. The extraction is a refactoring task that does not change behavior or the external API. |
