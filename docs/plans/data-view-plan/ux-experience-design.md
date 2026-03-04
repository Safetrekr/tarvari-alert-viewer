# UX Experience Design Plan: View Mode Toggle & Confidence Loop

**Project:** TarvaRI Alert Viewer -- Data View Modes
**Date:** 2026-03-04
**Status:** Draft
**Author:** UX Design (Claude Agent)

---

## Table of Contents

1. [User Research Foundation](#1-user-research-foundation)
2. [Experience Goals & Success Criteria](#2-experience-goals--success-criteria)
3. [User Journey Maps](#3-user-journey-maps)
4. [Information Architecture](#4-information-architecture)
5. [Interaction Patterns](#5-interaction-patterns)
6. [Trust & Confidence Indicators](#6-trust--confidence-indicators)
7. [Progressive Disclosure](#7-progressive-disclosure)
8. [Accessibility](#8-accessibility)
9. [Edge Cases](#9-edge-cases)

---

## 1. User Research Foundation

### 1.1 Persona: Security Officer (Primary Decision-Maker)

| Attribute | Detail |
|-----------|--------|
| **Name** | Lt. Marcus Okafor |
| **Role** | School District Security Officer |
| **Experience** | 12 years in threat assessment; 3 years using digital intel platforms |
| **Goal** | Determine whether a planned school trip to a destination region is safe enough to proceed |
| **Decision model** | Binary GO/NO-GO with escalation path. Needs to justify decisions to parents, school board, and insurance |
| **Mental model of "confidence"** | "I need to know that the system has considered the same factors I would, and I need to see the receipts." Confidence means: (a) the data is recent, (b) multiple sources agree, (c) the reasoning is traceable |
| **Frustration** | Wading through raw alerts with no prioritization. "I don't need to see every weather advisory -- I need to know if any of them are dealbreakers." |
| **Risk tolerance** | Low. Would rather cancel a trip based on ambiguous intel than approve one with gaps. Errs on the side of caution. |
| **Time pressure** | 5-15 minutes per destination review. Decisions often needed within 24 hours of trip departure. |
| **Tech comfort** | Moderate. Comfortable with dashboards but not data analysis. Needs clear visual hierarchy, not data tables. |
| **Accessibility needs** | None specific; uses desktop with standard monitor at 100% zoom. |

### 1.2 Persona: Trip Safety Analyst (Research Role)

| Attribute | Detail |
|-----------|--------|
| **Name** | Dr. Priya Nair |
| **Role** | SafeTrekr HQ Analyst |
| **Experience** | 6 years in risk analysis; former OSINT analyst; advanced data literacy |
| **Goal** | Validate the automated triage, investigate edge cases, and build confidence reports for security officers |
| **Decision model** | Evidence-weighted assessment. Assigns subjective confidence to each data point, then synthesizes. Looks for gaps in coverage. |
| **Mental model of "confidence"** | "I trust the system more when I can see what it rejected and why. Show me the rejected bundles -- that tells me the filter is working." |
| **Frustration** | When systems hide the filtering logic. "Black box triage is worse than no triage." Wants to see the LLM rationale and verify it against raw data. |
| **Risk tolerance** | Calibrated. Comfortable with nuance; can distinguish a Moderate weather advisory from a Severe one and adjust recommendations accordingly. |
| **Time pressure** | 30-60 minutes per deep-dive investigation. May revisit multiple times as new data arrives. |
| **Tech comfort** | High. Power user. Wants keyboard shortcuts, raw data access, and the ability to cross-reference. |
| **Accessibility needs** | Uses keyboard-heavy workflow; rarely touches the mouse. Needs full keyboard navigation. |

### 1.3 Persona: HQ Operations Staff (Monitoring Role)

| Attribute | Detail |
|-----------|--------|
| **Name** | Sam Rivera |
| **Role** | SafeTrekr HQ Operations Coordinator |
| **Experience** | 2 years in operations; manages 8-15 active trips simultaneously |
| **Goal** | Monitor the overall threat landscape and quickly identify which active trips require attention |
| **Decision model** | Triage-by-exception. "Show me what's changed since I last looked." Scans for anomalies; delegates deep analysis to analysts. |
| **Mental model of "confidence"** | "If the dashboard says 'all clear,' I need to trust that nothing slipped through. Confidence means the system is healthy and current." |
| **Frustration** | Information overload. "I manage 12 trips. I can't drill into every alert. I need the system to surface what matters." |
| **Risk tolerance** | Medium. Flags anything above Moderate severity for analyst review. |
| **Time pressure** | 2-5 minutes per scan. Checks the dashboard every 30-60 minutes throughout the shift. |
| **Tech comfort** | Moderate. Prefers visual indicators (color, badges) over text-heavy displays. |
| **Accessibility needs** | None specific; dual-monitor setup, often has the dashboard open on a secondary screen. |

### 1.4 Decision-Making Mental Models

All three personas share a common cognitive pattern when evaluating travel safety:

```
1. SCAN       -- "Is there anything I should worry about?"  (< 10 seconds)
2. ASSESS     -- "How bad is it?"                           (< 30 seconds)
3. INVESTIGATE -- "What's the evidence?"                    (1-5 minutes)
4. DECIDE     -- "What do I recommend?"                     (< 30 seconds)
5. JUSTIFY    -- "Can I explain this to someone else?"      (1-2 minutes)
```

The view mode toggle maps directly to these stages:

| Cognitive Stage | View Mode | Information Needed |
|-----------------|-----------|-------------------|
| SCAN | Triaged (default) | Approved bundle count, highest severity, risk score |
| ASSESS | Triaged | Bundle details, severity breakdown, confidence aggregate |
| INVESTIGATE | All Bundles / Raw Alerts | Rejected bundles with rationale, raw alert list, source health |
| DECIDE | Triaged | Summary recommendation with confidence |
| JUSTIFY | All Bundles | Full audit trail: triage decisions, LLM rationale, source IDs |

### 1.5 What "Confidence" Means to Each Persona

| Factor | Security Officer | Analyst | HQ Ops |
|--------|-----------------|---------|--------|
| **Data recency** | "Is this from today?" | "When was each source last polled?" | "Is the system live?" |
| **Source agreement** | "Do multiple sources say the same thing?" | "How many sources contributed to this bundle?" | "Are sources healthy?" |
| **Reasoning transparency** | "Why was this flagged?" | "Show me the full LLM rationale with confidence metadata" | "Was anything auto-rejected?" |
| **Coverage completeness** | "Are there blind spots?" | "Which categories have no active sources?" | "How many categories are covered?" |
| **Historical context** | "Has this region had issues before?" | "What's the trend over the past 7 days?" | "Did this just start or is it ongoing?" |

---

## 2. Experience Goals & Success Criteria

### 2.1 Primary Experience Goal

**Users can make confident, defensible travel safety decisions within 5 minutes of arriving at the dashboard, without needing to consult external tools or colleagues for data interpretation.**

### 2.2 Success Metrics

| Metric | Target | Measurement Method | Current Baseline |
|--------|--------|--------------------|-----------------|
| **Time to first decision signal** | Under 10 seconds | Instrumented: time from page load to first interaction with a bundle or category card | No baseline (feature does not exist) |
| **Time to GO/NO-GO recommendation** | Under 5 minutes (Security Officer) | Usability test: task completion time for "evaluate this destination" scenario | No baseline |
| **Self-reported confidence** | 4+ out of 5 | Post-task questionnaire: "How confident are you in the recommendation you just made?" | No baseline |
| **View mode discovery rate** | 80%+ find the toggle within 30 seconds | Usability test: first-time users, unguided, measured via eye-tracking or click recording | No baseline |
| **Confidence loop completion** | 60%+ of analyst sessions drill from Triaged to Raw Alerts at least once | Analytics event: `view_mode_changed` with `from` and `to` parameters | No baseline |
| **Error rate** | Under 5% false confidence (user reports high confidence on a decision that contradicts available evidence) | Expert review of decision+evidence pairs in controlled study | No baseline |
| **Keyboard task completion** | 100% of view mode operations achievable without mouse | Accessibility audit | No baseline |
| **Screen reader comprehension** | Users can describe current view mode and data scope without visual reference | Screen reader usability test (NVDA + VoiceOver) | No baseline |

### 2.3 Experience Principles

1. **Triaged is the default because most users need recommendations, not raw data.** The system should feel opinionated -- it has done work on the user's behalf.
2. **Depth is always one click away.** The confidence loop must never dead-end. Every summary links to its evidence; every bundle links to its raw alerts.
3. **Rejected data is not hidden, it is demoted.** The "All Bundles" mode exists to build trust by showing what was filtered out and why.
4. **Confidence is communicated through structure, not just numbers.** A confidence score of "88" means nothing without context. The UI must frame it: "88 out of 100, based on 24 corroborating sources."
5. **The spatial interface serves the decision, not the other way around.** View mode changes should feel like changing a lens on the same landscape, not navigating to a different page.

---

## 3. User Journey Maps

### 3.1 First-Time User Landing on the Dashboard

```
STAGE           ACTION                          SYSTEM RESPONSE                     EMOTION
-----------     ----------------------------    ---------------------------------   ---------------
Arrive          Opens the dashboard URL         Page loads: ZUI at Z1 zoom level    Curious
                                                Default: Triaged view mode
                                                15 category cards visible
                                                Global map with approved-bundle
                                                markers only

Scan            Eyes move across the grid       Category cards show:                Oriented
                                                - Category name + icon
                                                - Bundle count (not raw alert count)
                                                - Highest severity badge
                                                - Risk score indicator
                                                View mode indicator shows
                                                "TRIAGED" in the top bar

Orient          Notices the view mode toggle    Toggle is visible in the fixed      Understanding
                in the fixed header bar         NavigationHUD, near the breadcrumb.
                                                Three segments: TRIAGED | BUNDLES
                                                | RAW. "TRIAGED" is active.
                                                Tooltip on hover: "Showing approved
                                                intel bundles only"

Explore         Clicks a category card          Morph animation: card expands to    Engaged
                                                district view. Detail scene shows
                                                BUNDLE-level data:
                                                - Approved bundles list (not raw
                                                  alerts)
                                                - Bundle severity + confidence
                                                - Bundle map markers
                                                - Source health

Understand      Sees the "1 approved bundle"    Bundle card shows:                  Confident
                for Weather category            - "APPROVED" badge
                                                - Risk score: 80
                                                - Confidence: 88%
                                                - 24 member alerts
                                                - "View Evidence" button

Deep dive       Clicks "View Evidence"          Expands to show:                    Trusting
                on the bundle card              - LLM triage rationale
                                                - Member alert list (the 24 raw
                                                  alerts that formed this bundle)
                                                - Source attribution
```

**Drop-off risks:**
- User does not notice the view mode toggle (mitigated by making it prominent in the header).
- User expects raw alerts and is confused by bundle counts (mitigated by clear "Triaged View" labeling and a first-run tooltip).

### 3.2 Analyst Reviewing a New Approved Bundle

```
STAGE           ACTION                          SYSTEM RESPONSE                     EMOTION
-----------     ----------------------------    ---------------------------------   ---------------
Arrive          Lands on dashboard              Triaged mode shows 1 approved       Alert
                (may have a bookmark to         weather bundle with risk score 80
                ?view=triaged)

Identify        Sees Weather card has a         Category card shows:                Focused
                "new bundle" indicator           - Pulse dot on severity badge
                (bundle was created since        - "1 Bundle / Severe / Risk 80"
                last visit)                      - Subtle glow on card border

Drill in        Clicks Weather card             District view opens.                Analytical
                                                Top-left: Bundle list (1 item)
                                                shows approved bundle with full
                                                metadata

Examine         Reads the bundle summary:       Bundle detail panel:                Evaluating
                "24 weather alerts, Severe,     - Status: APPROVED (green badge)
                confidence 88, risk 80"         - Confidence: 88% with breakdown
                                                - Risk: 80 (Monte Carlo)
                                                - Source count: multi-source icon
                                                - Created: relative timestamp

Read rationale  Expands the triage rationale    LLM note panel expands:             Understanding
                section                         - Structured rationale text
                                                - Confidence metadata parsed and
                                                  displayed as: "Model confidence:
                                                  High (88%). Based on 24
                                                  corroborating alerts from 3
                                                  sources."

Verify          Switches to "All Bundles"       Toggle updates. Now shows 2         Validating
                mode to check what was          bundles:
                rejected                        - Weather: APPROVED (green)
                                                - Seismic: REJECTED (red/dimmed)
                                                Analyst can compare and see that
                                                seismic was rejected with reason

Cross-ref       Switches to "Raw Alerts"        Toggle updates. District view now   Satisfied
                mode                            shows all 44 raw alerts in the
                                                traditional list format (current
                                                behavior). Analyst can verify that
                                                the 24 weather alerts match the
                                                bundle membership.

Return          Switches back to Triaged        View snaps back to bundle-level     Confident
                                                display. Analyst is now satisfied
                                                that the triage is accurate.
```

### 3.3 Security Officer Deciding Whether to Approve Travel

```
STAGE           ACTION                          SYSTEM RESPONSE                     EMOTION
-----------     ----------------------------    ---------------------------------   ---------------
Context         Opens dashboard. Has a trip     Dashboard loads in Triaged mode.    Purposeful
                to Region X departing in 48h.   Category cards show the overall
                Needs a GO/NO-GO.               threat landscape.

Filter          Clicks the relevant category    Map filters to show only that       Focused
                card(s) for Region X            category. Cards dim for non-
                (e.g., Weather, Conflict)       selected categories.

Assess          Reads the approved bundles      For each relevant category:         Evaluating
                for filtered categories         - Bundle status + risk score
                                                - Severity level
                                                - Confidence aggregate
                                                Quick summary: "Weather: 1
                                                approved bundle, Severe, Risk 80.
                                                Conflict: No bundles."

Drill           Clicks into Weather category    District view shows the approved    Investigating
                for detail                      bundle with full evidence chain

Evaluate        Reads the risk score and        Risk indicator shows 80/100.        Weighing
                triage rationale                Rationale explains: tropical storm
                                                advisory active, multiple NWS
                                                alerts corroborate.

Decide          Returns to main grid.           Back to category grid view.         Deciding
                Mentally synthesizes:           View mode still on Triaged.
                "Severe weather risk 80,        The approved bundle's risk score
                no conflict alerts."            and severity level are visible on
                                                the category card without
                                                drilling again.

Justify         Takes a screenshot or           Category card + bundle detail       Resolved
                copies the bundle summary       provide all the evidence needed
                for their report                for a written justification.
                                                Future: "Export Summary" button.
```

### 3.4 The Confidence Loop: Triaged to Evidence to Raw Data

This is the core information-seeking pattern that the view mode toggle enables:

```
TRIAGED VIEW (Layer 1: Recommendation)
  |
  |  "Here is what we recommend you pay attention to"
  |  Shows: Approved bundles only, risk scores, confidence
  |  Category cards show: bundle count, highest severity, risk
  |
  |-- Click a bundle card --> Bundle Detail Panel
  |     |
  |     |  "Here is why we recommend this"
  |     |  Shows: LLM rationale, confidence metadata, source count
  |     |  Member alert count: "Based on 24 corroborating alerts"
  |     |
  |     |-- "View Member Alerts" --> Expands inline list of raw alerts
  |           that compose this bundle (scoped, not full mode switch)
  |
  |-- Toggle to ALL BUNDLES (Layer 2: Audit)
        |
        |  "Here is what was filtered and why"
        |  Shows: All bundles (approved + rejected)
        |  Rejected bundles are visually demoted but accessible
        |  Each rejected bundle shows: rejection reason, confidence
        |
        |-- Toggle to RAW ALERTS (Layer 3: Evidence)
              |
              |  "Here is everything the system ingested"
              |  Shows: All 44 intel_normalized rows
              |  Current behavior: alert list, severity, map markers
              |  No bundle grouping; no triage overlay
              |
              |-- User can manually cross-reference alert IDs
                  with bundle membership lists
```

**Key design principle:** The loop is bidirectional and non-destructive. Switching view modes preserves the current category filter, zoom level, and district drill-in state. The user should feel like they are adjusting a lens, not navigating to a new page.

---

## 4. Information Architecture

### 4.1 Data Hierarchy Per View Mode

#### Triaged View (Default)

```
Global (Z1 grid)
  |
  +-- Category Card
  |     - Category name + icon + color
  |     - Approved bundle count (e.g., "1 bundle")
  |     - Highest severity across approved bundles
  |     - Aggregate risk score (highest across bundles)
  |     - "NEW" indicator if bundle created since last visit
  |
  +-- Global Map
  |     - Markers = geographic centroids of approved bundles
  |     - Marker color = bundle final_severity
  |     - Marker size = risk_score (scaled)
  |     - Clusters represent overlapping bundle regions
  |
  +-- KPI Stats (left column)
  |     - "X Approved Bundles" (replaces "Total Sources")
  |     - "Y Active Threats" (bundles with Severe/Extreme)
  |     - "Z Categories Covered"
  |
  +-- Feed Panel
  |     - Shows approved bundle summaries (not raw alerts)
  |     - Bundle title, severity, confidence, timestamp
  |
  +-- System Status Panel
        - Unchanged: source health, severity dist, coverage

District View (drill into category)
  |
  +-- Section A (top-left): Approved Bundles List
  |     - Each row: bundle status badge, severity, risk score,
  |       confidence %, source count, created timestamp
  |     - Click to expand inline: LLM rationale, member alert list
  |
  +-- Section B (top-right): Severity Breakdown (of bundles)
  |
  +-- Section C (bottom-left): Source Health Table (unchanged)
  |
  +-- Section D (bottom-right): Map (bundle-level markers)
```

#### All Bundles View

```
Global (Z1 grid)
  |
  +-- Category Card
  |     - Approved bundle count + rejected bundle count
  |       e.g., "1 approved / 1 rejected"
  |     - Highest severity across ALL bundles
  |     - Risk score from approved bundles only (rejected are dimmed)
  |
  +-- Global Map
  |     - Approved bundle markers (solid, colored by severity)
  |     - Rejected bundle markers (hollow/outline, dimmed, gray)
  |
  +-- KPI Stats
  |     - "X Total Bundles (Y approved, Z rejected)"
  |     - Filter rate: "Z rejected / X total"
  |
  +-- Feed Panel
        - Shows all bundles, rejected ones shown with strikethrough
          or dimmed styling and "[REJECTED]" prefix

District View
  |
  +-- Section A: All Bundles List
  |     - Approved bundles: full color, expandable
  |     - Rejected bundles: dimmed with red "REJECTED" badge
  |       expandable to see rejection reason
  |
  +-- Section B: Severity Breakdown (all bundles, stacked bar with
  |     approved/rejected segments)
  |
  +-- Sections C, D: Unchanged
```

#### Raw Alerts View (Current Behavior)

```
Global (Z1 grid)
  |
  +-- Category Card
  |     - Raw alert count (current behavior)
  |     - Active sources count
  |     - No bundle or triage information
  |
  +-- Global Map
  |     - All intel_normalized markers (current behavior)
  |
  +-- KPI Stats
  |     - Total Sources, Active Sources, Categories (current)
  |
  +-- Feed Panel
        - Raw alert feed (current behavior)

District View
  |
  +-- Current CategoryDetailScene behavior:
        alert list, severity bar, source table, map
```

### 4.2 Information Visible at Each Zoom Level

| Zoom Level | Triaged View | All Bundles View | Raw Alerts View |
|------------|-------------|-----------------|-----------------|
| **Z0 (constellation)** | Category icon dots with severity color tint if any approved bundle is Severe+ | Same, but includes rejected bundle severity | Same as current (icon dots) |
| **Z1 (atrium/grid)** | Category cards with bundle counts + severity badges; map with bundle markers; KPI stats for bundles; feed panel with bundle summaries | Same with rejected bundles visible but dimmed | Current behavior: alert counts, raw markers, raw feed |
| **Z2 (focused)** | Card detail: bundle confidence percentages visible inline; map labels show risk scores | Same with rejected bundle markers visible on map | Current behavior |
| **Z3 (deep zoom)** | Not currently used; reserved for future station-level detail | Same | Same |
| **District view** | Bundle-oriented detail scene (bundles list, severity of bundles, sources, bundle map) | Same with rejected bundles included | Current alert-oriented detail scene |

### 4.3 View Mode URL Synchronization

The active view mode is persisted in the URL for deep-linking and session restoration:

```
?view=triaged    (default, can be omitted)
?view=bundles    (all bundles)
?view=raw        (raw alerts)
```

This follows the existing URL sync pattern established by `coverage.store.ts` for category filters. The view mode parameter composes with existing parameters:

```
?view=triaged&category=weather&category=conflict
?view=bundles&district=seismic
```

---

## 5. Interaction Patterns

### 5.1 View Mode Toggle: Location

The toggle sits in the fixed NavigationHUD header bar, to the left of the existing top-right controls (ColorSchemeSwitcher, ZoomIndicator). Specifically:

```
+------------------------------------------------------------------+
| [Tarva logo]  [Breadcrumb: Launch > Weather]                     |
|                                                                  |
|    [TRIAGED | BUNDLES | RAW]              [Theme] [Zoom: 1.00x]  |
|                                                                  |
+------------------------------------------------------------------+
```

**Position rationale:** The toggle is a global-scope control that affects all visible data. It must be:
- Always visible (fixed position, not in the spatial canvas)
- Near the breadcrumb to reinforce the "where am I" mental model with "what am I looking at"
- Away from the category filter controls (left column) to avoid confusion between "what category" and "what processing level"

The toggle is positioned at `top: 21px` (vertically centered in the header, matching the existing Tarva logo and controls) with `left: 50%` centering or `right: 160px` (to the left of the Theme + Zoom cluster). The exact horizontal position depends on visual balance testing, but it should feel centered in the header.

### 5.2 View Mode Toggle: Visual Design

The toggle uses a segmented control pattern, consistent with the existing glass aesthetic:

```
 +-----------+-----------+-------+
 | TRIAGED   | BUNDLES   |  RAW  |
 +-----------+-----------+-------+
   ^active       dim        dim
```

**States:**

| State | Background | Border | Text Color | Additional |
|-------|-----------|--------|------------|------------|
| Active segment | `rgba(255, 255, 255, 0.08)` | `rgba(255, 255, 255, 0.15)` | `rgba(255, 255, 255, 0.6)` | Subtle inner glow matching the segment's semantic color |
| Inactive segment | `transparent` | `rgba(255, 255, 255, 0.06)` | `rgba(255, 255, 255, 0.25)` | -- |
| Hover (inactive) | `rgba(255, 255, 255, 0.04)` | `rgba(255, 255, 255, 0.10)` | `rgba(255, 255, 255, 0.35)` | -- |
| Focus-visible | Same as hover | `2px solid var(--color-ember-bright)` | Same as hover | Focus ring at `outline-offset: 2px` |

**Container styling:**
- `font-family: var(--font-mono)`
- `font-size: 10px`
- `letter-spacing: 0.1em`
- `text-transform: uppercase`
- `border-radius: 6px`
- `border: 1px solid rgba(255, 255, 255, 0.06)`
- `backdrop-filter: blur(12px)`
- Overall height: 28px (matching ZoomIndicator height)

**Semantic color tints per segment:**
- TRIAGED: faint green tint (`rgba(34, 197, 94, 0.08)`) -- conveys "processed, safe to act on"
- BUNDLES: faint amber tint (`rgba(234, 179, 8, 0.08)`) -- conveys "review needed"
- RAW: no tint (neutral) -- conveys "unprocessed"

### 5.3 View Mode Toggle: Behavior

**On toggle click:**

1. URL parameter updates immediately (`?view=triaged|bundles|raw`) via `replaceState` (no history entry).
2. The Zustand store (`coverage.store.ts` extended, or a new `viewmode.store.ts`) updates.
3. All data-consuming components re-render with the new view mode:
   - Category cards re-query or re-filter their displayed metrics.
   - The global map swaps its marker data source.
   - The feed panel changes its content.
   - The KPI stats update their labels and values.
   - If a district view is open, it re-renders its content scene.
4. A screen-reader announcement fires: `aria-live="polite"` region says "View changed to Triaged" (or "All Bundles" or "Raw Alerts").

**Transition animation:**
- The toggle segment indicator slides horizontally with a 150ms ease-out.
- Data-dependent components apply a 200ms opacity crossfade: current data fades to 0.3, new data fades in from 0.3 to 1.0. This prevents layout shift while acknowledging that the data source has changed.
- The global map does not reset its viewport. Markers animate: old markers fade out (150ms), new markers fade in (150ms, staggered by distance from center).

**Category filter preservation:**
- Switching view modes does NOT clear the category filter.
- If `?category=weather` is active and the user switches from Triaged to Raw, the map continues to show only weather data, but now at the raw-alert level rather than the bundle level.

### 5.4 View Mode Toggle: Keyboard Interaction

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Moves focus to/from the toggle group |
| `ArrowLeft` / `ArrowRight` | Moves active segment left/right within the group |
| `Home` | Activates the first segment (Triaged) |
| `End` | Activates the last segment (Raw) |
| `1`, `2`, `3` (when toggle is focused) | Direct segment activation |

The toggle uses `role="tablist"` with each segment as `role="tab"` and `aria-selected="true|false"`. The corresponding data region (the entire dashboard below the header) is the `role="tabpanel"` with `aria-labelledby` pointing to the active tab.

### 5.5 Filter + View Mode Interaction Matrix

| Category Filter | View Mode | Category Cards Show | Map Shows | District View Shows |
|-----------------|-----------|--------------------|-----------|--------------------|
| None (all) | Triaged | Bundle count per category | All approved bundle markers | Bundle-level detail for selected category |
| None (all) | Bundles | Bundle count (approved + rejected) per category | Approved (solid) + rejected (outline) markers | All bundles for selected category |
| None (all) | Raw | Raw alert count per category (current) | All raw alert markers (current) | Raw alert detail (current) |
| 1+ categories | Triaged | Selected: full opacity; others: dimmed. Bundle counts filtered | Approved bundle markers for selected categories only | Bundle-level detail for drilled-in category |
| 1+ categories | Bundles | Same dimming; approved + rejected counts | Approved + rejected markers for selected categories | All bundles for drilled-in category |
| 1+ categories | Raw | Same dimming; raw alert counts | Raw alert markers for selected categories | Raw alert detail for drilled-in category |

### 5.6 Drill-Down Behavior Per View Mode

When a user clicks a category card to enter the district view (morph animation), the content scene adapts to the active view mode:

**Triaged mode district view:**
- Section A becomes "Approved Bundles" (not "Alerts"). Each bundle is a card with:
  - Status badge (APPROVED, green)
  - Severity badge (colored)
  - Risk score (numeric, right-aligned)
  - Confidence percentage
  - Source count
  - Created timestamp (relative)
  - Expandable: click to reveal LLM rationale + member alert preview
- Section B becomes "Bundle Severity" (breakdown of bundle severities)
- Section C remains Source Health
- Section D map shows bundle-level markers

**All Bundles mode district view:**
- Section A shows all bundles. Approved bundles appear first, followed by rejected bundles separated by a visual divider:
  - Rejected bundles have a red "REJECTED" badge, dimmed text, and a visible rejection reason line
  - Expanding a rejected bundle shows the full LLM rejection rationale
- Section B shows severity breakdown with approved/rejected segments
- Sections C, D: same as Triaged but map includes rejected bundle markers (outline style)

**Raw Alerts mode district view:**
- Identical to the current `CategoryDetailScene` behavior. No changes.

---

## 6. Trust & Confidence Indicators

### 6.1 Design Principle: Trust Through Transparency

Users trust automated triage when they can:
1. See that it considered enough data (source count, member alert count)
2. Understand the reasoning (LLM rationale, parsed and structured)
3. Verify the reasoning against evidence (drill to raw alerts)
4. See what was rejected (All Bundles mode shows the filter working)
5. Confirm the system is healthy (source status, data recency)

### 6.2 Confidence Score Display

The `confidence_aggregate` field (0-100) is displayed as a **confidence meter** rather than a raw number:

```
+-------------------------------------------+
| CONFIDENCE                                |
|                                           |
|  [===============         ] 88%           |
|   HIGH                                    |
|   24 corroborating alerts / 3 sources     |
+-------------------------------------------+
```

**Visual breakdown:**

- **Bar:** Horizontal fill bar, 4px height, rounded ends.
  - Fill color: green (80-100), amber (60-79), red (0-59).
  - Background: `rgba(255, 255, 255, 0.04)`.
- **Percentage:** Monospace, right-aligned, `font-size: 14px`, color matches bar fill.
- **Label:** "HIGH" / "MODERATE" / "LOW" -- plain language below the bar.
  - HIGH: 80-100, green text
  - MODERATE: 60-79, amber text
  - LOW: 0-59, red text
- **Context line:** "N corroborating alerts / M sources" -- grounds the number in evidence.

**ARIA:** The meter uses `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label="Confidence: 88 percent, high. Based on 24 corroborating alerts from 3 sources."`.

### 6.3 Risk Score Display

The `risk_score` field (Monte Carlo derived, 0-100) is displayed as a **risk gauge**:

```
   RISK
   80
   -----
   HIGH
```

- The number is large (`font-size: 24px`), monospace, color-coded:
  - 0-39: blue (`rgba(59, 130, 246, 0.6)`)
  - 40-69: amber (`rgba(234, 179, 8, 0.6)`)
  - 70-100: red/orange (`rgba(249, 115, 22, 0.7)`)
- Below: plain-language label (LOW / MODERATE / HIGH / CRITICAL)
- Below that: a thin horizontal severity bar showing where 80 falls on the 0-100 scale.

### 6.4 LLM Rationale Display

The triage_decisions `note` field contains the full LLM rationale with embedded confidence metadata. This is displayed in a structured panel:

```
+-------------------------------------------+
| TRIAGE RATIONALE                          |
|                                           |
| Decision: APPROVED                        |
| Reviewer: TarvaRI Triage Engine v2        |
|                                           |
| [Rationale text, parsed from the note     |
|  field. Formatted as readable paragraphs. |
|  Key phrases highlighted: severity terms, |
|  source names, geographic references.]    |
|                                           |
| Confidence Metadata:                      |
|   Model confidence: 88%                   |
|   Source agreement: 24/24 (100%)          |
|   Temporal coverage: 48h lookback         |
|                                           |
| Decided: 2h ago                           |
+-------------------------------------------+
```

**Styling:**
- Container: glass panel (`bg-white/[0.03]`, `border: 1px solid rgba(255,255,255,0.06)`, `border-radius: 8px`)
- Decision badge: green "APPROVED" or red "REJECTED" (same style as severity badges)
- Rationale text: `font-size: 11px`, `line-height: 1.6`, `color: rgba(255, 255, 255, 0.35)` -- readable but not dominant
- Confidence metadata: structured key-value pairs, monospace, slightly brighter than rationale text
- Key phrase highlighting: severity terms get their severity color; source names get a subtle underline; geographic references get a faint background tint

### 6.5 Source Reliability Indicators

Source reliability is communicated through the existing source health infrastructure, enhanced with view-mode-aware context:

- **In Triaged mode:** Source health is shown in the district view dock panel. Each source shows status (active/staging/quarantine/disabled) with the existing color-coded dots. Additionally, bundles show a "Source Agreement" metric: "N of M sources corroborate this assessment."

- **In All Bundles mode:** The dock panel adds a "Sources Consulted" section listing which sources contributed to each bundle. This lets analysts verify coverage.

- **In Raw Alerts mode:** Each alert row shows its `source_id`, and the source health table is unchanged.

### 6.6 Data Freshness Indicators

Every data display includes a freshness signal:

| Component | Freshness Signal |
|-----------|-----------------|
| Category card | "Updated Xm ago" faint timestamp below the metrics |
| Bundle card | "Created Xh ago" relative timestamp |
| Global map | "Last refresh: HH:MM" in the map attribution area |
| Feed panel | Timestamp on each feed item (existing) |
| System Status Panel | "LIVE" indicator with green dot (existing) |
| District view | "Data as of HH:MM" in the content header |

**Stale data warning:** If the most recent data point is older than 15 minutes, a subtle amber warning appears:

```
  [!] DATA MAY BE STALE -- LAST UPDATE 18M AGO
```

This uses a pulsing amber dot (existing attention choreography pattern) and is placed below the view mode toggle.

---

## 7. Progressive Disclosure

### 7.1 Layer Model

The dashboard implements a four-layer progressive disclosure model. Each layer reveals more detail and requires more deliberate user action to reach:

```
Layer 0: Ambient Awareness (passive)
  - What: View mode label, source health indicator, category grid at a glance
  - Where: Fixed header bar, Z0/Z1 overview
  - Action needed: None (visible on page load)
  - Persona: HQ Ops (monitoring)

Layer 1: Summary Assessment (one scan)
  - What: Bundle counts per category, severity badges, risk scores,
    map overview with bundle markers
  - Where: Z1 category cards, global map, KPI stats
  - Action needed: Look at the grid (no clicks)
  - Persona: Security Officer (scan)

Layer 2: Bundle Detail (one click)
  - What: Individual bundle metadata, confidence score, LLM rationale
    summary, member alert count, source attribution
  - Where: District view (card click), or bundle expansion within
    a category
  - Action needed: Click a category card OR click a bundle row
  - Persona: Security Officer (assess), Analyst (review)

Layer 3: Evidence & Audit (two clicks or toggle)
  - What: Full LLM rationale, member alert list, rejection reasons
    for filtered bundles, raw source data
  - Where: Bundle expansion panel (click "View Evidence"),
    or switch to All Bundles / Raw Alerts mode
  - Action needed: Expand a bundle detail + click evidence section,
    OR toggle view mode
  - Persona: Analyst (investigate), Security Officer (justify)
```

### 7.2 Expansion Patterns

**Bundle card expansion (within district view, Triaged/All Bundles mode):**

The bundle list in Section A uses a disclosure pattern. Each bundle row is a clickable card that expands inline to reveal detail:

```
Collapsed:
+---+----------------------------------------------+------+-------+
| S | Bundle Title / Summary                       | Risk | Conf  |
| E |                                              |  80  |  88%  |
| V | 24 alerts / 3 sources / Created 2h ago       |      |       |
+---+----------------------------------------------+------+-------+

Expanded (click to toggle):
+---+----------------------------------------------+------+-------+
| S | Bundle Title / Summary                       | Risk | Conf  |
| E |                                              |  80  |  88%  |
| V | 24 alerts / 3 sources / Created 2h ago       |      |       |
+---+----------------------------------------------+------+-------+
|                                                                  |
| TRIAGE RATIONALE                                                 |
| Decision: APPROVED                                               |
| [Structured rationale text...]                                   |
|                                                                  |
| MEMBER ALERTS (24)                     [View All in Raw Mode ->] |
| +-- NWS Tropical Storm Warning - FL Coast          Severe  2h   |
| +-- NWS Storm Surge Watch - Tampa Bay              Severe  2h   |
| +-- NWS High Wind Warning - Central FL             Moderate 3h  |
| +-- (showing 3 of 24)                 [Show More]               |
|                                                                  |
| SOURCES CONSULTED                                                |
| NWS (active) / NOAA (active) / ECMWF (active)                  |
+------------------------------------------------------------------+
```

**Expansion animation:**
- Height animates from 0 to auto using `motion/react` layout animation (300ms, ease-out)
- Content fades in (150ms delay, 200ms duration)
- The expanded region has a left border accent matching the bundle severity color

**"View All in Raw Mode" link:**
- Switches the view mode to Raw and keeps the current category filter
- Smooth scroll to the alert list in the detail scene
- This is the key bridge in the confidence loop

### 7.3 Map Progressive Disclosure

The global map participates in progressive disclosure:

| View Mode | Zoom Level | Map Shows |
|-----------|-----------|-----------|
| Triaged | Low zoom | Clustered approved bundle markers; cluster size = bundle count |
| Triaged | High zoom | Individual approved bundle markers with severity color and risk score label |
| All Bundles | Low zoom | Clustered markers (approved solid, rejected outline) |
| All Bundles | High zoom | Individual markers; rejected markers are gray outline with "R" label |
| Raw | Any | Current behavior (individual alert markers, severity colored) |

**Map popup progression (on marker click):**
- Triaged: Popup shows bundle summary (severity, risk, confidence, alert count). "View Bundle Detail" button morphs to district view.
- All Bundles: Same, but rejected bundles show "REJECTED -- [reason summary]"
- Raw: Current popup (alert title, severity, ingested timestamp)

---

## 8. Accessibility

### 8.1 View Mode Toggle ARIA Pattern

The view mode toggle uses the **tablist** pattern (WAI-ARIA 1.2):

```html
<div role="tablist" aria-label="Intel data view mode">
  <button
    role="tab"
    id="tab-triaged"
    aria-selected="true"
    aria-controls="panel-main"
    tabindex="0"
  >
    Triaged
  </button>
  <button
    role="tab"
    id="tab-bundles"
    aria-selected="false"
    aria-controls="panel-main"
    tabindex="-1"
  >
    All Bundles
  </button>
  <button
    role="tab"
    id="tab-raw"
    aria-selected="false"
    aria-controls="panel-main"
    tabindex="-1"
  >
    Raw Alerts
  </button>
</div>

<!-- The main dashboard content area -->
<div
  role="tabpanel"
  id="panel-main"
  aria-labelledby="tab-triaged"
  aria-live="polite"
>
  <!-- Dashboard content adapts based on active tab -->
</div>
```

**Keyboard behavior (roving tabindex):**
- Only the active tab has `tabindex="0"`; inactive tabs have `tabindex="-1"`.
- `ArrowLeft`/`ArrowRight` moves focus and selection between tabs.
- `Tab` from the tablist moves focus into the panel content.
- `Shift+Tab` from the panel content returns focus to the active tab.

### 8.2 Screen Reader Announcements

**On view mode change:**

An `aria-live="polite"` region announces the mode change and provides context:

```html
<div class="sr-only" aria-live="polite" aria-atomic="true">
  <!-- Dynamically updated when view mode changes -->
  View mode changed to Triaged. Showing 1 approved bundle across 2 categories.
</div>
```

Announcement templates:
- Triaged: "View mode changed to Triaged. Showing {N} approved bundle(s) across {M} categories."
- All Bundles: "View mode changed to All Bundles. Showing {N} total bundles: {A} approved, {R} rejected."
- Raw Alerts: "View mode changed to Raw Alerts. Showing {N} individual alerts across {M} categories."

**On bundle expansion:**

```
Expanded Weather bundle detail. Approved, Severe severity, risk score 80,
confidence 88 percent based on 24 corroborating alerts.
```

**On bundle collapse:**

```
Collapsed Weather bundle detail.
```

### 8.3 Focus Management

**On view mode change:**
- Focus remains on the active tab button. The panel content updates below.
- If the content layout changes significantly (e.g., switching from bundles to raw alerts changes the district view content), focus is NOT moved -- the user initiated the change and expects to stay on the toggle.

**On district view open (morph):**
- After the morph animation completes, focus moves to the first focusable element in the district view content (the first bundle card or alert row).
- The back button is next in tab order after the content.

**On district view close (back button or Escape):**
- Focus returns to the category card that was clicked to open the district view.

**On bundle card expansion:**
- Focus moves to the first element inside the expanded panel (the rationale heading or decision badge).
- On collapse (click or Escape), focus returns to the bundle card header.

### 8.4 ARIA Roles for Dynamic Content

| Component | ARIA Pattern |
|-----------|-------------|
| View mode toggle | `role="tablist"` with `role="tab"` children |
| Category card | `role="group"` (existing), add `aria-label` that includes view-mode-aware metric (e.g., "Weather -- 1 approved bundle, Severe") |
| Bundle card (district view) | `role="button"` with `aria-expanded="true|false"` |
| Bundle expanded content | `role="region"` with `aria-label="Bundle detail for [name]"` |
| Confidence meter | `role="meter"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Risk score | `role="img"` with `aria-label="Risk score: 80 out of 100, High"` |
| LLM rationale | `role="article"` with `aria-label="Triage rationale"` |
| Member alert list | `role="list"` with `aria-label="Member alerts for this bundle"` |
| Data freshness warning | `role="status"` with `aria-live="polite"` |

### 8.5 Contrast Requirements

All new UI elements must meet WCAG 2.2 AA contrast requirements:

| Element | Foreground | Background | Ratio Required | Checked |
|---------|-----------|------------|---------------|---------|
| Toggle active text | `rgba(255, 255, 255, 0.6)` | `rgba(255, 255, 255, 0.08)` on dark bg | 4.5:1 for 10px text | Needs verification -- may need to increase active text opacity to 0.7+ |
| Toggle inactive text | `rgba(255, 255, 255, 0.25)` | transparent on dark bg | 3:1 (large text) | Needs verification |
| Confidence bar labels | Severity colors on dark bg | Dark background | 4.5:1 | Green/amber/red on dark bg typically pass; needs per-token check |
| Risk score number | Severity colors on glass panel | `rgba(255, 255, 255, 0.03)` bg | 4.5:1 for large text (24px) = 3:1 | Likely passes; verify |
| LLM rationale text | `rgba(255, 255, 255, 0.35)` | Glass panel bg | 4.5:1 | Needs verification -- may need to increase to 0.4+ |

**Action item:** Run the existing Contrast Automation check on all new tokens before implementation. The rationale text at 0.35 opacity on the glass background is the most likely failure point and may need to be increased to 0.45 for AA compliance.

### 8.6 Keyboard Navigation Map

Full keyboard flow through the feature:

```
Tab order (page level):
1. Skip-nav link (if present)
2. View mode toggle (tablist)
3. Category filter (left column, ALL button + stats)
4. Category grid (tab through cards)
5. Map (application role, keyboard controls)
6. Feed panel (aria-hidden="true" from keyboard when not interactive)
7. District view (when open): back button -> content sections -> dock panel

Within district view:
1. Back button (auto-focused after morph)
2. Bundle list (Section A) -- tab through bundle cards
3. Bundle card: Enter to expand, Escape to collapse
4. Within expanded bundle: tab through rationale, member alerts, sources
5. "View All in Raw Mode" link
6. Severity breakdown (Section B) -- informational, not interactive
7. Source health table (Section C) -- tab through rows
8. Map (Section D) -- application role
9. Dock panel metadata -- informational
```

---

## 9. Edge Cases

### 9.1 No Bundles Yet (Pipeline Not Running)

**Scenario:** The intel pipeline has ingested raw alerts (`intel_normalized` has 44 rows) but the bundling and triage workers have not run yet. `intel_bundles` has 0 rows.

**Triaged view behavior:**
- Category cards show "No bundles" with a faint info icon
- Global map shows NO markers (bundles are the data source)
- KPI stats show "0 Approved Bundles"
- A contextual notice appears below the view mode toggle:

```
+------------------------------------------------------------------+
| [i] No triaged bundles available. The triage pipeline may not    |
|     have processed recent alerts yet. Switch to Raw Alerts to    |
|     view unprocessed data.                          [Switch ->]  |
+------------------------------------------------------------------+
```

- The notice includes a "Switch to Raw Alerts" action button that toggles the view mode.
- The notice uses `role="status"` and subtle amber styling (not alarming, just informational).

**All Bundles view behavior:**
- Same as Triaged but with "0 bundles" messaging.

**Raw Alerts view behavior:**
- Normal current behavior -- raw alerts are available regardless of pipeline status.

### 9.2 Single Bundle

**Scenario:** Only 1 bundle exists (approved or rejected). Currently true for the "approved" side of the data (1 approved weather bundle).

**Triaged view behavior (1 approved bundle):**
- The Weather category card shows "1 Bundle" with the bundle severity.
- All other category cards show "No bundles" (dimmed but not hidden).
- The global map shows 1 bundle marker (or a cluster if the bundle has a wide geographic scope).
- District drill-in shows the single bundle card prominently. The layout does not look empty because:
  - Section A shows the single bundle card at full width (not a tiny row in a huge scroll area)
  - Section B shows the severity bar (single segment, 100%)
  - Sections C and D are populated from source health and map data

**All Bundles view (1 approved + 1 rejected):**
- Weather card: "1 approved"
- Seismic card: "1 rejected" (dimmed)
- District drill-in for Seismic shows the rejected bundle with its rationale

### 9.3 All Bundles Rejected

**Scenario:** All bundles in the system have been rejected by the triage engine.

**Triaged view behavior:**
- All category cards show "No approved bundles"
- A prominent notice appears:

```
+------------------------------------------------------------------+
| [!] All bundles were rejected by the triage engine. This may     |
|     indicate that current threats do not meet the approval        |
|     threshold. Review rejected bundles for details.              |
|                                        [View All Bundles ->]     |
+------------------------------------------------------------------+
```

- This notice uses a slightly more prominent styling than the "no bundles" case -- amber background tint, stronger border -- because it represents an unusual state that warrants analyst attention.
- KPI stats: "0 Approved Bundles / N Rejected" to make clear that data exists but was filtered.

**All Bundles view behavior:**
- All bundles visible with "REJECTED" badges. No special notice needed -- the user can see the full picture.

### 9.4 Mixed Approval Across Categories

**Scenario:** Some categories have approved bundles, others have rejected bundles, and others have no bundles at all. (This is the current data state: Weather approved, Seismic rejected, 13 categories with no bundles.)

**Triaged view behavior:**
- Weather card: "1 Bundle / Severe / Risk 80" (full color)
- Seismic card: "No bundles" (dimmed metric area, but card still clickable)
- Other 13 cards: "No bundles" (dimmed metric area)
- Category filter still works: selecting Weather shows only the approved bundle on the map; selecting Seismic shows nothing (no approved bundles).

**All Bundles view behavior:**
- Weather card: "1 approved"
- Seismic card: "1 rejected"
- Other 13 cards: "No bundles"
- Selecting Seismic in category filter now shows the rejected bundle marker on the map (outline style).

### 9.5 Stale Data

**Scenario:** The most recent `ingested_at` timestamp in `intel_normalized` is older than 15 minutes. The polling continues but no new data arrives.

**Behavior:**
- A stale data indicator appears below the view mode toggle:
  ```
  [!] LAST DATA: 18M AGO
  ```
- The indicator uses `role="status"` with `aria-live="polite"`.
- Styling: amber pulsing dot (reusing the existing attention choreography pulse animation), monospace text, `color: rgba(234, 179, 8, 0.6)`.
- The indicator appears in ALL view modes.
- If staleness exceeds 1 hour, the indicator upgrades to red:
  ```
  [!] DATA STALE: 1H 23M -- SOURCES MAY BE OFFLINE
  ```

### 9.6 Bundle with Zero Member Alerts (Data Integrity Issue)

**Scenario:** A bundle exists in `intel_bundles` but its `member_intel_ids` array is empty or references UUIDs not found in `intel_normalized`.

**Behavior:**
- The bundle is still displayed, but with a warning flag:
  ```
  [!] No member alerts found. Bundle metadata may be inconsistent.
  ```
- The "View Evidence" expansion shows the warning instead of a member alert list.
- The confidence meter adds a note: "Confidence may be unreliable -- no member alerts to verify."
- This is a system health issue, not a user error. It should be visually distinct from "no bundles" (which is expected when the pipeline has not run).

### 9.7 View Mode URL Deep-Link with Invalid Value

**Scenario:** User navigates to `?view=invalid`.

**Behavior:**
- The store treats any unrecognized value as `triaged` (the default).
- The URL is corrected to `?view=triaged` via `replaceState` on mount.
- No error is shown to the user.

### 9.8 Rapid View Mode Switching

**Scenario:** User clicks through all three view modes quickly (e.g., testing the toggle).

**Behavior:**
- Each toggle click immediately updates the store and URL.
- Data queries are debounced: if the view mode changes within 200ms of the previous change, the intermediate query is cancelled (TanStack Query handles this naturally via key changes).
- The crossfade animation is interrupted and restarts from the current opacity state (using `motion/react`'s interruptible animations).
- No loading spinners appear for intermediate states -- only the final state triggers a loading indicator if the data takes more than 300ms to arrive.

### 9.9 District View Open When View Mode Changes

**Scenario:** User is viewing the Weather district detail scene in Triaged mode. They click the view mode toggle to switch to Raw Alerts.

**Behavior:**
- The district view remains open. The content scene re-renders:
  - Section A transitions from "Approved Bundles" to "Alerts" (the existing alert list)
  - Section B transitions from "Bundle Severity" to "Alert Severity"
  - Section D map transitions from bundle markers to raw alert markers
  - Section C (Source Health) is unchanged
- The morph state machine is NOT affected. `phase` stays at `settled` or `district`.
- A crossfade animation (200ms) smooths the content change within the district view.
- The dock panel on the right updates its metrics to reflect the active view mode (e.g., "1 Bundle" becomes "24 Alerts" for Weather in Raw mode).

### 9.10 Mobile / Narrow Viewport

**Scenario:** User accesses the dashboard on a tablet or narrow browser window (under 768px wide).

**Behavior:**
- The view mode toggle remains in the header but condenses to icon-only mode:
  - TRIAGED: checkmark icon
  - BUNDLES: stack icon
  - RAW: list icon
  - Tooltip on hover/focus shows the full label
- Category cards reflow to fewer columns (the existing CSS grid handles this).
- District view stacks vertically instead of 2x2 grid.
- The dock panel becomes a bottom sheet instead of a side panel.

Note: This is a lower-priority concern. The primary deployment target is desktop (GitHub Pages for HQ analysts). Mobile optimization can follow.

---

## Appendix A: Component Mapping

This table maps each UX feature to existing or new components:

| Feature | Existing Component | Modification | New Component |
|---------|-------------------|-------------|---------------|
| View mode toggle | -- | -- | `ViewModeToggle.tsx` (in `src/components/ui/`) |
| View mode state | `coverage.store.ts` | Extend with `viewMode` field, or create new store | `viewmode.store.ts` (if separate) |
| View mode URL sync | `syncCoverageFromUrl()` | Add `view` param parsing | -- |
| Category card (Triaged) | `CategoryCard.tsx` | Add bundle count display, severity badge, risk indicator | -- |
| Category card (All Bundles) | `CategoryCard.tsx` | Add approved/rejected count split | -- |
| Bundle list (district) | `CategoryDetailScene.tsx` | Replace Section A content based on view mode | `BundleList.tsx`, `BundleCard.tsx` |
| Bundle expansion | -- | -- | `BundleDetail.tsx` (rationale, member alerts, sources) |
| Confidence meter | -- | -- | `ConfidenceMeter.tsx` |
| Risk gauge | -- | -- | `RiskGauge.tsx` |
| LLM rationale panel | -- | -- | `TriageRationale.tsx` |
| Stale data indicator | -- | -- | `DataFreshnessIndicator.tsx` |
| Empty state (no bundles) | -- | -- | `NoBundlesNotice.tsx` |
| All-rejected notice | -- | -- | (shares `NoBundlesNotice.tsx` with different copy) |
| Map marker adaptation | `CoverageMap.tsx`, `MapMarkerLayer.tsx` | Add bundle marker layer, rejected marker style | -- |
| Feed panel adaptation | `feed-panel.tsx` | Conditional: show bundles or alerts based on view mode | -- |
| KPI stats adaptation | `CoverageOverviewStats.tsx` | Conditional labels/values based on view mode | -- |
| Screen reader announcements | -- | -- | `ViewModeAnnouncer.tsx` (sr-only live region) |

## Appendix B: Data Hooks Required

| Hook | Source Table(s) | Purpose |
|------|----------------|---------|
| `useIntelBundles(filters?)` | `intel_bundles` + `triage_decisions` | Fetch bundles with their triage decisions. Filters: category, status (approved/rejected/all). |
| `useBundleDetail(bundleId)` | `intel_bundles`, `triage_decisions`, `intel_normalized` | Fetch a single bundle with its full detail: triage decision, member alerts (via `member_intel_ids` join). |
| `useBundleMapData(filters?)` | `intel_bundles` | Fetch bundles with GeoJSON for map rendering. Similar to `useCoverageMapData` but at the bundle level. |
| `useIntelFeed()` | (existing) | No changes needed; used in Raw mode. |
| `useCoverageMapData()` | (existing) | No changes needed; used in Raw mode. |
| `useCoverageMetrics()` | (existing) | No changes needed; source health is view-mode-independent. |

## Appendix C: Design Token Additions

```yaml
# View mode toggle tokens
viewmode:
  toggle:
    height: 28px
    border-radius: 6px
    font-size: 10px
    letter-spacing: 0.1em
    segment:
      active:
        bg: rgba(255, 255, 255, 0.08)
        border: rgba(255, 255, 255, 0.15)
        text: rgba(255, 255, 255, 0.6)
      inactive:
        bg: transparent
        border: rgba(255, 255, 255, 0.06)
        text: rgba(255, 255, 255, 0.25)
      hover:
        bg: rgba(255, 255, 255, 0.04)
        border: rgba(255, 255, 255, 0.10)
        text: rgba(255, 255, 255, 0.35)
    tint:
      triaged: rgba(34, 197, 94, 0.08)
      bundles: rgba(234, 179, 8, 0.08)
      raw: transparent

# Confidence meter tokens
confidence:
  bar:
    height: 4px
    border-radius: 2px
    bg: rgba(255, 255, 255, 0.04)
  high:
    fill: rgba(34, 197, 94, 0.7)
    text: rgba(34, 197, 94, 0.6)
  moderate:
    fill: rgba(234, 179, 8, 0.7)
    text: rgba(234, 179, 8, 0.6)
  low:
    fill: rgba(239, 68, 68, 0.7)
    text: rgba(239, 68, 68, 0.6)

# Risk gauge tokens
risk:
  low:
    color: rgba(59, 130, 246, 0.6)
  moderate:
    color: rgba(234, 179, 8, 0.6)
  high:
    color: rgba(249, 115, 22, 0.7)
  critical:
    color: rgba(239, 68, 68, 0.7)

# Bundle card tokens
bundle:
  card:
    bg: rgba(255, 255, 255, 0.02)
    border: rgba(255, 255, 255, 0.06)
    hover-bg: rgba(255, 255, 255, 0.04)
    expanded-border-left: 3px  # colored by severity
  badge:
    approved:
      bg: rgba(34, 197, 94, 0.15)
      text: rgba(34, 197, 94, 0.7)
      border: rgba(34, 197, 94, 0.25)
    rejected:
      bg: rgba(239, 68, 68, 0.15)
      text: rgba(239, 68, 68, 0.7)
      border: rgba(239, 68, 68, 0.25)

# Data freshness tokens
freshness:
  ok:
    color: rgba(34, 197, 94, 0.5)
  stale:
    color: rgba(234, 179, 8, 0.6)
  critical:
    color: rgba(239, 68, 68, 0.6)
```

## Appendix D: Analytics Events

| Event Name | Payload | Trigger |
|-----------|---------|---------|
| `view_mode_changed` | `{ from: string, to: string, district_open: boolean, categories_filtered: string[] }` | User clicks a view mode toggle segment |
| `bundle_expanded` | `{ bundle_id: string, category: string, status: string, view_mode: string }` | User expands a bundle card in district view |
| `bundle_collapsed` | `{ bundle_id: string }` | User collapses a bundle card |
| `evidence_drilldown` | `{ bundle_id: string, from_mode: string, to_mode: string }` | User clicks "View All in Raw Mode" from a bundle |
| `confidence_loop_completed` | `{ session_id: string, path: string[], duration_ms: number }` | User has visited all three view modes in a single session |
| `stale_data_warning_shown` | `{ staleness_minutes: number }` | Stale data indicator appears |
| `no_bundles_notice_action` | `{ action: 'switch_to_raw' or 'dismiss' }` | User interacts with the "no bundles" notice |
