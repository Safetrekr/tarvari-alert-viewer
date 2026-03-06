# Summaries & More — What the Protective Agent Recommends Surfacing

> **Source:** TarvaRI Touch-Ups 3 `combined-recommendations.md` (Phases A-E)
> **Lens:** `#world-class-secret-service-protective-agent` (B9-B16, D25-D32, E33-E40)
> **Validation:** `#every-time` structured reasoning
> **Date:** 2026-03-05

---

## Executive Summary

The `#wcsspapv11` agent's skill set centers on **protective intelligence, risk assessment, escalation thresholds, and geopolitical monitoring**. Applied to the TarvaRI alert viewer, the question becomes: *what data, at what prominence, would let a protective operations professional make faster, better-informed decisions about group travel safety?*

The analysis below maps each Touch-Ups 3 deliverable to the protective agent's skill framework, assigns a **prominence tier** (how visually prominent it should be in the viewer), and describes the ideal surfacing approach. The `#every-time` validation follows each section.

---

## Tier 1 — ALWAYS VISIBLE (persistent chrome / primary real estate)

These items map to skills B13 (Escalation Thresholds), B15 (Geopolitical Monitoring), and D29 (Incident Recognition). The protective agent's core philosophy is *"precision over volume — deliver only what is needed, when it is needed, to the stakeholder who can act on it."*

### 1. P1/P2 Priority Feed (Phase B — WS-B.1)

**Why the protective agent demands this:**
Skill B13 defines a four-tier severity system (Info, Caution, Alert, Critical) with pre-approved escalation pathways. The P1/P2 feed maps directly to Alert + Critical tiers. A protective operations professional needs *immediate, unambiguous visibility* of the highest-priority threats without digging through category views.

**Recommended surfacing:**
- **Persistent "Priority Alerts" strip** in the top telemetry bar or as a dedicated HUD element
- Always visible regardless of zoom level or view state (main grid, district, INSPECT)
- Color-coded: P1 = pulsing red accent, P2 = amber accent
- Show: count badge + most recent P1/P2 title + time since ingestion
- Click expands to a priority feed panel (similar to existing FeedPanel, but filtered to P1/P2 only)
- If count is 0, show a muted "ALL CLEAR" state (not hidden — absence of alerts is itself information)

**Prominence:** Maximum. This is the single most important addition from the protective agent's perspective.

### 2. Geographic Intelligence Summaries (Phase D — WS-D.3, D.6)

**Why the protective agent demands this:**
Skill B15 describes a "living risk picture" that synthesizes geopolitical data into tiered briefings (strategic → tactical → street-level). The periodic geographic summaries (hourly delta, daily comprehensive) at World/Region/Country levels are *exactly* the Operational Risk Brief (ORB) that B15 calls for.

**Recommended surfacing:**
- **Geographic summary panel** accessible from the main page — a dedicated "Threat Picture" view
- Hierarchy: World overview (always available) → Region drill-down → Country detail
- Each level shows: threat level assessment, key developments, recommended actions, watch items
- The `structured_breakdown` JSON drives visual elements: threats-by-category chart, severity distribution, risk trend arrow (up/down/stable)
- Hourly deltas appear as a "What's Changed" section with timestamp
- Daily comprehensive appears as the primary brief, replacing the hourly delta at the start of each day

**Prominence:** High. Second only to the priority feed. Should be reachable in one click from the main view (e.g., a "THREAT PICTURE" button in the navigation HUD or top bar). The protective agent would check this *before* drilling into any category.

### 3. Real-Time Push for P1/P2 (Phase B — WS-B.4)

**Why the protective agent demands this:**
B13's core requirement is that *"no emerging risk is left unattended."* The 30-60 second polling intervals of current hooks are unacceptable for P1 alerts. Supabase Realtime push means the viewer receives Critical alerts within seconds.

**Recommended surfacing:**
- **Interrupt-level notification** — when a P1 arrives, it should visually interrupt whatever the user is doing
- Brief toast/banner at the top of the viewport with the alert title, severity, and category
- Optional audio cue (configurable, off by default)
- Auto-updates the P1/P2 feed count badge in real-time
- Does NOT navigate the user away from their current view — just signals that attention is needed

**Prominence:** Maximum (interrupt-level), but ephemeral. The persistent P1/P2 strip (item 1) is where the user goes to act; the real-time push is just the notification trigger.

---

## Tier 2 — PROMINENT (one click away / visible in natural workflow)

These items map to skills B11 (Risk Assessment), B14 (Baseline-Anomaly Observation), and B9 (Intelligence Intake & Validation).

### 4. Threat Picture Endpoint (Phase B — WS-B.2)

**Why the protective agent values this:**
B11 describes a "living risk register" with aggregated scores across domains. The threat picture endpoint — aggregating active intel by category, severity, priority, and region with counts/trends — is the data backbone for the geographic summaries and the main-page overview stats.

**Recommended surfacing:**
- Powers the **CoverageOverviewStats** component and the new Threat Picture panel
- Category cards on the main grid should show trend indicators (up/down arrows) derived from this endpoint
- The "Threat Picture" view (from item 2) uses this as its primary data source
- Region breakdown could enhance the existing map view with color-coded region overlays

**Prominence:** Medium-high. Not a standalone UI element, but the data that drives several Tier 1 surfaces. The protective agent would say: *"I don't need to see the endpoint — I need to see the picture it paints."*

### 5. Operational Priority on All Intel (Phase A — WS-A.1 through A.5)

**Why the protective agent values this:**
B13's confidence scoring and B11's risk register both require a **consistent, quantitative priority framework**. Without P1-P4 on every record, the priority feed (item 1) can't exist. This is foundational infrastructure.

**Recommended surfacing:**
- **Priority badge** on every alert card in the district view alert list (P1 red, P2 amber, P3 yellow, P4 gray)
- Priority column/indicator in the INSPECT detail panel
- Map markers could optionally scale or glow based on priority (P1 markers larger/brighter than P4)
- Priority as a filter option in the category filter controls
- Sort-by-priority option in district alert lists

**Prominence:** Medium. Visible everywhere alerts are shown, but as a secondary indicator alongside severity. Priority and severity are complementary — severity describes *how bad*, priority describes *how urgently we must act*.

### 6. Full-Text Keyword Search (Phase C — WS-C.1, C.2)

**Why the protective agent values this:**
B9 (Intelligence Intake) describes querying across feeds for matching indicators. When a protective detail receives a tip — e.g., "suspicious activity near [location]" — they need to instantly search the intel corpus for corroborating data.

**Recommended surfacing:**
- **Command palette search** (already exists as a UI pattern) enhanced with real backend search
- Results return ranked intel items with `ts_headline` snippet previews
- Filters: category, severity, date range (matching the endpoint params)
- Click a result to navigate to the alert in its district view (or INSPECT it on the map)
- Could also power a "Related Intel" section in the alert detail panel

**Prominence:** Medium. Available via command palette (Cmd+K) and possibly a search icon in the top bar. Protective agents search *when they have a lead to chase*, not as their primary workflow.

---

## Tier 3 — AVAILABLE (accessible but not prominent)

These items support the protective mission but are infrastructure or operational concerns rather than real-time decision aids.

### 7. Enhanced Filters — bbox, time, source (Phase B — WS-B.3)

**Why it matters:**
B15 describes "geofencing" around mission waypoints. Bounding-box filtering lets a protective detail focus on intel within a specific geographic area relevant to their trip route. Time filtering supports "what happened in the last 6 hours?" queries.

**Recommended surfacing:**
- Filter controls in the district view map (draw-a-box or radius tool)
- Time range selector (last hour / 6 hours / 24 hours / 7 days / custom)
- Source filter as an advanced option
- Not visible by default — accessible via a "Filters" toggle in district view

**Prominence:** Low-medium. Power-user feature. The protective agent uses this *after* the priority feed and threat picture tell them where to focus.

### 8. Public Alert Viewer Pipeline (Phase E)

**Why it matters:**
E36 (Tech Enablement for Repeatability) values making intel accessible to stakeholders who need it. GitHub Pages deployment makes the viewer accessible without running the TarvaRI backend — useful for sharing a read-only threat picture with trip leaders, org admins, or partner security.

**Recommended surfacing:**
- No UI changes needed — this is deployment infrastructure
- The public viewer should show the same interface but in read-only mode
- Sensitive fields (source keys, internal IDs) excluded via RLS views

**Prominence:** N/A for the UI. Critical for the operational mission (making intel available to the right people at the right time — B13 again).

---

## `#every-time` Structured Reasoning Validation

### Verification: Does the protective agent's prioritization hold up?

**Claim 1: P1/P2 Priority Feed is the highest-value addition.**
- *Evidence check:* B13 explicitly defines a four-tier escalation matrix where higher tiers trigger immediate, broader notification. The viewer currently has no concept of priority — all alerts are treated equally. This is the protective agent's most fundamental complaint: without escalation tiers, the viewer produces "volume without precision."
- *Counter-argument:* The geographic summaries (Phase D) provide more strategic value. But D depends on A (priority must exist to filter summaries to meaningful content). A+B.1 are prerequisites.
- *Verdict:* **Confirmed.** Priority feed is both highest-value AND a prerequisite for the geographic summaries.

**Claim 2: Geographic summaries should be Tier 1, not Tier 2.**
- *Evidence check:* B15's core philosophy is "contextual fidelity over snapshot accuracy." The summaries provide exactly this — a synthesized threat picture rather than a firehose of individual alerts. For a trip safety platform, knowing "Southeast Asia risk is ELEVATED due to monsoon season + political unrest" is more actionable than scrolling 200 individual weather alerts.
- *Counter-argument:* Summaries don't exist yet (Phase D is 7-10 days of backend work). Should we design for them now?
- *Verdict:* **Confirmed as Tier 1 in importance**, but implementation is blocked by Phase D backend work. The viewer should reserve prominent space for this and build the panel once the API exists. Design now, implement when the endpoint lands.

**Claim 3: Real-time push is Tier 1.**
- *Evidence check:* B13 mandates "primary brief must be issued <= 15 minutes after threshold breach." The current 30-60s polling is acceptable for P3/P4 but inadequate for P1. Real-time push closes the gap.
- *Counter-argument:* For a trip safety dashboard (not a tactical operations center), 30-second polling may be "good enough." The viewer isn't commanding a protective detail in real-time.
- *Verdict:* **Confirmed as Tier 1 for P1 alerts specifically.** P2 can tolerate polling. The interrupt-level notification is justified because a P1 in a trip safety context means "imminent danger to travelers" — not something that should wait 30 seconds.

**Claim 4: Search is Tier 2, not Tier 1.**
- *Evidence check:* B9 frames search as a validation tool ("corroborate each indicator with a minimum of two independent inputs"). It's reactive — triggered by a specific lead. The protective agent's primary workflow is *monitoring* (feed-driven), not *searching* (query-driven).
- *Verdict:* **Confirmed.** Search is a powerful tool but not the primary interface.

**Claim 5: Enhanced filters are Tier 3.**
- *Evidence check:* B15 values geofencing and temporal filtering, but these are refinement tools applied after the user has already identified a focus area. They don't drive the initial threat picture.
- *Verdict:* **Confirmed.** Useful, not primary.

### Structural Consistency Check

The tier ordering follows a clear information hierarchy that matches protective intelligence doctrine:

1. **What's urgent RIGHT NOW?** (P1/P2 feed + real-time push)
2. **What's the overall picture?** (Geographic summaries + threat picture)
3. **Let me dig deeper on this specific thing.** (Search, priority indicators, filters)
4. **How do I share this with others?** (Public viewer deployment)

This maps to the OODA loop already implemented in the viewer:
- **Observe:** Main grid + map (existing)
- **Orient:** Priority feed + threat picture (Tiers 1-2 additions)
- **Decide:** INSPECT flow + search + summaries (Tier 1-2 additions)
- **Act:** VIEW DISTRICT + alert detail + filters (existing + Tier 2-3 additions)

### Risk Flags

1. **Phase A is a hard blocker for everything in Tiers 1-2.** Without `operational_priority` on records, the P1/P2 feed is impossible. Phase A should be the very first backend work.
2. **Phase D (summaries) is the highest-effort item (7-10 days).** The viewer can be designed with placeholder panels, but the actual content won't flow until the backend completes D.1-D.6.
3. **B.4 (real-time push) requires Supabase Realtime RLS verification.** If the `reviewer` role can't subscribe to Realtime on `intel_normalized`, this falls back to faster polling (5-10s) which may be acceptable.

---

## Implementation Sequencing (Viewer Side)

Once backend phases deliver their endpoints, the viewer work sequence should be:

| Order | What | Backend Dependency | Viewer Effort |
|-------|------|--------------------|---------------|
| 1 | Priority badges on existing alert cards + list items | Phase A (A.5) | S — add badge component, wire to existing data |
| 2 | P1/P2 Priority Feed strip + panel | Phase B (B.1) | M — new feed panel, persistent HUD element |
| 3 | Real-time P1 notification banner | Phase B (B.4) | S — Supabase Realtime hook + toast component |
| 4 | Search integration in command palette | Phase C (C.2) | M — replace mock search with real endpoint |
| 5 | Threat Picture panel (summary view) | Phase D (D.6) | L — new panel with geo hierarchy, charts, trends |
| 6 | Enhanced map/list filters (bbox, time) | Phase B (B.3) | M — filter UI components + query param wiring |
| 7 | Public viewer deployment | Phase E (E.1-E.4) | M — build config + data layer branching |

---

## What to View the Full Thing

Each recommendation above traces back to specific skills in the `#wcsspapv11` agent profile:

| Skill | Name | How It Drives the Recommendation |
|-------|------|----------------------------------|
| B9 | Intelligence intake & validation | Search, source reputation display, confidence indicators |
| B10 | Threat actor modeling | Structured breakdown in geographic summaries |
| B11 | Risk assessment methodology | Priority framework, risk scoring, trend indicators |
| B13 | Protective intelligence reporting & escalation thresholds | P1/P2 feed, real-time push, interrupt notifications, four-tier model |
| B14 | Baseline-anomaly observation | Trend arrows on category cards, "what's changed" in summaries |
| B15 | Geopolitical monitoring | Geographic summaries, region drill-down, route-relevant filtering |
| B16 | Go/No-Go decision memos | Daily comprehensive summary as a "travel advisory" equivalent |
| D29 | Incident recognition | Real-time P1 notifications, immediate visibility of new threats |
| E33 | Communications plan design | Escalation pathways, notification channels, distribution control |
| E36 | Tech enablement for repeatability | Public viewer pipeline, shareable threat picture |
| E37 | Suspicious activity detection | Search integration, corroboration workflow |

For the full skill definitions with templates, examples, execution guides, and quality checklists, resolve them via the skill-resolver MCP:
```
agent: world-class-secret-service-protective-agent
skill_ids: B9, B11, B13, B15, B16, D29, E33, E36, E37
```
