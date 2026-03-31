# Protective Operations Review -- TarvaRI Alert Viewer Mobile Strategy

**Version:** 1.0
**Date:** 2026-03-06
**Status:** Review Complete
**Reviewer:** Protective Operations Assessment
**Classification:** Internal -- Operations Sensitive

**Documents Reviewed:**
1. UX Strategy (ux-strategy.md)
2. UI Design System (ui-design-system.md)
3. Interface Architecture (interface-architecture.md)
4. Information Architecture (information-architecture.md)
5. Cross-Document Synthesis (every-time-synthesis.md)
6. Source code: coverage.ts (categories, severity, priority), use-priority-feed.ts, use-geo-summaries.ts

---

## Executive Summary

The mobile strategy documents describe a well-engineered consumer-grade intelligence dashboard with strong UX discipline, thoughtful information architecture, and careful attention to aesthetic continuity. From a design and engineering perspective, the work is thorough.

From a protective operations perspective, however, the strategy has a fundamental orientation problem: **it was designed for an analyst sitting at a desk who happens to be holding a phone, not for a security officer operating in a field environment under stress.** The documents repeatedly reference "security analysts checking threat posture" as the primary use case. This accurately describes one user segment but neglects the field operators -- advance team members, protective detail agents, and security officers on the ground -- who represent the highest-stakes mobile users of this system.

The gap is not a design failure; it is a scope gap. The mobile strategy excels at what it set out to do (make the analyst dashboard mobile-accessible). What it did not set out to do -- and what this review identifies -- is address the operational requirements of personnel who depend on this intelligence to make immediate protective decisions in the field.

This review identifies 7 critical gaps, 9 important improvements, and 6 enhancements. None of the critical gaps require rearchitecting the mobile strategy; most can be layered onto the existing 3-tab model as additions.

---

## 1. Field Usability Assessment

### 1.1 One-Handed Operation During Movement

**Assessment: ADEQUATE with reservations.**

The design decisions support one-handed use reasonably well:
- 44px minimum touch targets (48px design target) meet WCAG AAA and are usable with a thumb
- Bottom navigation bar is within natural thumb reach zone
- Bottom sheets for detail views keep interactive elements in the lower half of the screen
- 2-column category grid cards at 165x80px provide generous tap targets

**Reservations:**

The header actions (search icon, menu icon) are positioned in the top-right corner -- the hardest area to reach one-handed on modern phones (iPhone 15 Pro Max: 430px width, ~160mm tall). A field operator walking through a crowd while holding the phone in their left hand (dominant hand free for response) cannot easily reach these controls. The search function is listed as P1 priority, which means a frequently-needed function sits in the least accessible position.

The pull-to-refresh gesture requires the user to be at the top of a scrolled list and execute a controlled downward drag. During movement (walking, riding in a vehicle), this gesture is unreliable. A dedicated refresh button in the lower portion of the screen would be more operationally reliable.

### 1.2 Glance-ability Under Stress

**Assessment: GOOD for posture-level awareness, POOR for actionable detail.**

The information hierarchy correctly prioritizes:
- Threat posture level visible on load (0 taps, <1 second)
- P1 count visible on load with pulse animation
- Most recent P1 alert headline visible on load

This answers "is anything critical happening?" effectively. However, the system does not answer the field operator's actual question, which is: **"Is it safe to proceed with my current movement/activity at THIS location?"**

The threat posture level is a global aggregate. A field operator in Accra does not gain actionable intelligence from knowing that the global posture is ELEVATED if the elevation is driven by seismic activity in the Pacific. The mobile design lacks location-aware threat contextualization -- the ability to show "threats relevant to YOUR position" without requiring the operator to manually navigate to the map tab, zoom to their location, and visually scan markers.

Under stress (elevated heart rate, tunnel vision, time pressure), a security officer needs binary-clear signals: proceed / hold / abort. The current design provides a data dashboard requiring interpretation. In protective operations terminology, the interface provides raw intelligence where it should provide a decision support indicator.

### 1.3 Bright Sunlight Readability

**Assessment: HIGH RISK.**

The documents themselves identify this as Risk R6 (IA document) and propose contrast tier adjustments:
- Primary text: 0.70-0.90 alpha (up from desktop 0.40-0.60)
- Secondary text: 0.45-0.55 alpha (up from desktop 0.20-0.30)
- Ambient text: 0.30-0.40 alpha (fails AA, acknowledged)

These adjustments improve indoor legibility but remain inadequate for direct sunlight operations. The fundamental problem is the dark-on-dark Oblivion aesthetic (`#050911` background). In bright sunlight, OLED screens lose effective contrast as ambient light overwhelms the display. A dark background with light text becomes a washed-out gray field where all text blends together.

Field operators regularly work outdoors: advance teams scouting venues, security officers monitoring perimeters, protective details during motorcade movements. The aesthetic decision to maintain the cinematic dark theme on mobile directly conflicts with field readability.

**The documents do not propose a high-contrast mode or an outdoor mode.** This is a significant omission for a tool intended for security personnel.

### 1.4 In-Vehicle Use (Passenger)

**Assessment: PARTIALLY ADDRESSED.**

The map tab provides geographic awareness suitable for a passenger monitoring during vehicle movement. MapLibre touch gestures (pinch-zoom, pan) work during transit. The bottom sheet alert detail preserves map context behind a translucent overlay, allowing the passenger to maintain geographic orientation while reading alert details.

However, the design lacks:
- **Route overlay capability.** A security officer in a moving vehicle wants to see their planned route on the map with alerts plotted along it. The map shows all alerts everywhere; there is no concept of "my route."
- **Speed-appropriate information density.** At highway speed, even a passenger needs larger text and fewer data points. No mention of a "transit mode" that increases font sizes and reduces information density.
- **Voice-over integration for critical alerts.** A P1 alert that arrives while the officer is watching the road (glancing periodically) should be audible, not just visual. The current design has no audio channel. The haptic feedback noted in the UX Strategy is a step in the right direction but insufficient for high-noise environments (engine, traffic, radio chatter).

### 1.5 Low-Connectivity Environments

**Assessment: CRITICAL GAP.**

The client decision Q1 states: "No offline. No caching, no PWA service worker for data. Online-only."

This decision is understandable from a development scope perspective but creates a serious operational vulnerability. Field operations frequently occur in environments with degraded connectivity:

- **Rural venues** (camps, retreat centers, outdoor event sites) with poor cellular coverage
- **Dense urban environments** where building penetration degrades signal
- **International travel** where roaming data is throttled or unavailable
- **Emergency situations** where cellular infrastructure is damaged or overloaded (the exact moment when threat intelligence is most critical)
- **Basement/underground venues** with no signal
- **Aircraft** during transit phases

When connectivity drops, the current design shows... nothing. The TanStack Query hooks will return stale data from the React Query cache until the cache expires, at which point the user sees loading spinners or error states. There is no explicit "last known good" display, no timestamp showing how old the current data is, and no visual indicator distinguishing live data from cached/stale data.

A field operator who pulls out their phone during a connectivity gap and sees the Situation tab has no way to know whether the displayed threat posture is 30 seconds old or 30 minutes old. In protective operations, acting on stale intelligence without knowing it is stale is more dangerous than having no intelligence at all.

### 1.6 Glove Operation

**Not addressed.** The documents do not mention glove-compatible interaction. Security personnel operating in cold climates or wearing protective equipment (medical gloves, tactical gloves) cannot reliably use capacitive touchscreens. While this is partially a hardware problem, interface design can mitigate it by increasing touch target sizes and avoiding precision-dependent gestures. The 44px touch targets help, but filter chips at 64x36px and the small header icons will be unusable with gloves.

---

## 2. Threat Monitoring Effectiveness

### 2.1 Information Hierarchy for Protective Operations

The Information Architecture document defines a four-layer progressive disclosure model:

| Layer | Content | Tap Depth |
|-------|---------|-----------|
| L0 (Glance) | Posture level, P1 count, latest P1 headline, trend | 0 |
| L1 (One tap) | Full priority list, category detail, map, geo summaries | 1 |
| L2 (Two taps) | Alert detail, marker inspection, region assessment | 2 |
| L3 (Expert) | Source health, triage rationale, summary history | 3+ |

**For an analyst, this hierarchy is correct.** Analysts think in terms of aggregate posture, category distributions, and trend analysis. They need the big picture first and drill down into specifics.

**For a protective operator, the hierarchy should be inverted.** An operator thinks in terms of:

1. **Immediate threats to my principal/group** -- Are there active threats at or near our location? (This is not in the hierarchy at all.)
2. **Go/no-go for the next movement** -- What is the threat picture for our planned route and destination?
3. **Category-specific concerns relevant to my operation** -- Not all 15 categories are equally relevant. A school group trip cares about conflict, civil unrest, health, and weather. Aviation and maritime are irrelevant unless they are flying or on a boat.
4. **Background posture** -- The global aggregate threat level is context, not decision data.

The current design puts the analyst's priority (#4) at the top and provides no mechanism for the operator's priority (#1).

### 2.2 P1/P2 Priority System Visibility

**Assessment: WELL DESIGNED.**

The priority system is one of the strongest elements of the mobile strategy:

- P1 (Critical) items have a dedicated pulsing badge, a persistent banner with the most recent headline, and a 15-second polling interval
- P2 (High) items show count in the posture strip and are listed in the Intel tab
- P3/P4 are appropriately suppressed on mobile
- The achromatic priority channel (shape/weight/animation, not color) per AD-1 prevents confusion with the severity color channel
- The `mostRecentP1` and `mostRecentP2` pre-computed fields in the `usePriorityFeed` hook provide exactly the data a banner component needs

**One concern:** The P1 banner auto-hides after 30 seconds (IA document, Risk R3 mitigation). The IA review correctly flags this: "persist until user taps (acknowledges) or a newer P1 supersedes it." From a protective operations standpoint, a P1 alert that silently disappears is a serious design error. P1 means "immediate threat to life or critical infrastructure." That banner must persist until explicitly acknowledged. An operator who stepped away for 31 seconds and returns to a clear screen will assume all is well when it is not.

### 2.3 "Is It Safe to Proceed?" Assessment

**Assessment: NOT SUPPORTED.**

The single most critical question a protective detail asks before any movement is: "Based on current intelligence, is it safe to proceed from Point A to Point B?"

The mobile design does not provide a mechanism to answer this question. The operator must:

1. Open the Map tab (1 tap)
2. Zoom and pan to the relevant geographic area (multiple gestures)
3. Visually scan for markers near the planned route (cognitive effort)
4. Tap individual markers to read alert details (multiple taps)
5. Mentally synthesize the category, severity, and proximity of each alert
6. Form a judgment

This is a 30-60 second workflow requiring full attention and cognitive processing. In practice, an advance team member needs this answer in under 5 seconds, often while walking or talking.

What is needed is a **location-aware threat summary** -- a single card or indicator that aggregates alerts within a configurable radius of a specified point (or the user's GPS position) and produces a go/no-go recommendation or at minimum a localized threat level.

### 2.4 Category Relevance Filtering

The system displays all 15 categories equally. A protective detail for a school trip does not need to monitor maritime or aviation categories. The category filter exists on the Map tab as horizontal chips, but there is no concept of a **persistent profile** that says "for this operation, I only care about conflict, civil unrest, weather, health, disaster, and fire." Every time the operator opens the app, they see all 15 categories and must mentally filter.

A saved filter profile ("Trip Security Preset" or "Field Operations Preset") would reduce cognitive load significantly.

---

## 3. Operational Security (OPSEC) Considerations

### 3.1 Screen Visibility to Bystanders

**Assessment: MODERATE RISK, partially mitigated.**

The dark Oblivion aesthetic actually helps here. Dark backgrounds with subtle text are harder to read from an oblique angle than bright-background interfaces. The severity colors (red, orange, yellow, blue) are the most visible elements from a distance, but without context they do not reveal sensitive information.

However, the alert titles and summaries displayed in the P1 banner, alert detail sheets, and category lists contain operationally sensitive information. "7.2 Earthquake off coast of Papua New Guinea" is benign. "Armed clashes in northern [country where the principal is traveling]" on a screen visible to a bystander reveals the protective detail's area of concern and potentially their destination.

**No mention of:**
- Privacy screen filter recommendations for field devices
- Reduced-information mode that shows only posture level and counts without text content
- Quick-blank (tap to temporarily black out screen while maintaining data connection)

### 3.2 Data Sensitivity on Mobile Devices

**Assessment: SIGNIFICANT GAPS.**

The mobile design inherits the desktop's passphrase authentication stored in `sessionStorage`. The documents do not address:

- **Auto-lock timeout.** There is no mention of automatic session expiration after a period of inactivity. A phone left on a table at a restaurant (common during advance operations) would display live intelligence indefinitely until the browser tab is closed or the phone itself locks. The application should enforce its own session timeout independent of the device lock.

- **Data-at-rest protection.** TanStack Query caches API responses in memory. If the browser process is backgrounded but not killed (standard mobile behavior), this data persists in process memory. On compromised or jailbroken devices, this memory can be read. The client's decision against offline caching (Q1) helps here by avoiding persistent storage, but in-memory data is still exposed.

- **Session token handling.** The passphrase is verified client-side and a session flag is stored in `sessionStorage`. This is not a cryptographic authentication mechanism. There is no server-issued JWT, no token expiration, and no ability for an administrator to revoke a session remotely.

- **Data classification marking.** Intelligence products typically carry classification markings. The TarvaRI data has no visible classification level. While this may be intentional (all data is unclassified OSINT), the absence of any marking means users cannot verify the handling requirements for what they are viewing.

### 3.3 Device Loss/Theft

**Assessment: NOT ADDRESSED.**

If a phone running the TarvaRI mobile view is lost or stolen:

- The application session persists until the browser tab is closed (no auto-timeout)
- There is no remote session kill capability
- There is no device registration or whitelisting
- The passphrase (if saved in the device's password manager) provides persistent access
- Cached data in the browser process remains accessible until the app is force-quit

For a security tool used by protective operations personnel, the inability to remotely terminate a session on a lost device is a serious OPSEC gap. At minimum, the backend should support session invalidation by an administrator.

### 3.4 Screenshot and Screen Recording Prevention

**Not addressed.** The documents do not mention `getDisplayMedia` restrictions, screenshot event detection, or any mitigation against screen capture of intelligence data. While these are imperfect on mobile platforms, even logging screenshot events provides an audit trail.

---

## 4. Communication and Escalation

### 4.1 Rapid Escalation Capability

**Assessment: NOT SUPPORTED.**

The mobile design is a one-way intelligence consumption tool. A field operator can read threat intelligence but cannot:

- **Report a threat observation** to HQ or the analyst team
- **Escalate a P2 alert to P1** based on field observation (e.g., "I can confirm the conflict report; I am hearing gunfire at this location")
- **Mark a location** on the map as a verified threat or a cleared safe point
- **Acknowledge receipt** of a P1 alert to confirm the field team is aware
- **Send a status update** ("Team Alpha at checkpoint 3, all clear")

In protective operations, the communication loop is bidirectional. Intelligence flows from HQ to the field AND from the field to HQ. The current design only supports the downlink.

### 4.2 Quick-Action Buttons

**Assessment: ABSENT.**

Field security operations require immediate-access functions that should be reachable with a single tap from any screen:

| Action | Purpose | Current Design |
|--------|---------|----------------|
| **Report Threat** | Field observation of threat; send GPS-tagged report to HQ | Not present |
| **Check In** | Confirm team status at a waypoint or on schedule | Not present |
| **Rally Point** | Display designated rally/assembly point on map | Not present |
| **Emergency** | Duress/panic signal with GPS location to HQ | Not present |
| **Call HQ** | Direct dial to operations center | Not present |
| **Acknowledge P1** | Confirm receipt of critical alert | Not present (P1 banner auto-hides) |

None of these functions exist in the mobile design. The design is entirely passive -- a monitoring screen, not an operational tool.

### 4.3 Team Status Awareness

**Assessment: NOT SUPPORTED.**

A protective detail operates as a coordinated team. The lead agent needs to know:
- Where each team member is
- Whether they have acknowledged the latest threat update
- Whether any team member has triggered an alert

The mobile design provides no team awareness features. Each user operates in isolation -- they can see the same intelligence data, but they cannot see each other or coordinate through the tool.

### 4.4 Rally Point Display

**Assessment: NOT SUPPORTED.**

Rally points (pre-designated assembly locations in case of emergency) are fundamental to protective operations. The SafeTrekr backend (`safetrekr-core`) already supports AI-suggested rally points via TarvaRI. The mobile map view could display these points, but the mobile strategy documents make no mention of rally points, safe havens, or designated assembly areas.

---

## 5. Navigation Model Assessment

### 5.1 Three-Tab Model Evaluation

The resolved navigation model is: **Situation | Map | Intel** with Situation as the default tab.

**For analysts: CORRECT.** The three tabs map to analyst mental models:
- Situation = "What is happening?" (aggregate metrics)
- Map = "Where is it happening?" (spatial context)
- Intel = "What should I know?" (analysis and briefings)

**For field operators: PARTIALLY CORRECT.** A field operator's mental model is different:

| Operator Priority | Best Tab | Problem |
|-------------------|----------|---------|
| "Am I safe right now?" | None | Not provided by any tab |
| "What threats are near me?" | Map (with location) | Requires manual navigation to own position |
| "Has anything changed since last check?" | Situation | Posture strip + P1 banner answer this |
| "What does HQ say about my area?" | Intel (geo summaries) | Correct, accessible in 2 taps |
| "What is my team's status?" | None | Not provided |

The Situation tab as default is correct for the analyst use case. For a field operator, the **Map tab centered on the user's GPS position** would be more immediately useful -- it answers "what is near me?" without interaction.

### 5.2 Recommended Modification for Field Use

Rather than changing the default tab (which would harm the analyst experience), a better approach would be a **role-aware default**: if the user's profile indicates a field role (security_officer, chaperone), default to the Map tab with auto-center on GPS. If the user is an analyst or HQ role, default to Situation.

Alternatively, a single-tap "center on me" button on the Map tab (a standard map pattern) would satisfy the field operator's immediate need.

### 5.3 Most Critical First Screen for Protective Detail

If designing specifically for a protective detail member, the ideal first screen would be:

```
+------------------------------------------+
|  THREAT STATUS: YOUR AREA                |
|  [LOW / GUARDED / ELEVATED / HIGH / CRITICAL]  |
|  Based on 3 alerts within 25km           |
|  Last updated: 45 seconds ago            |
|------------------------------------------|
|  ACTIVE P1 ALERTS NEAR YOU: 0            |
|  ACTIVE P2 ALERTS NEAR YOU: 1            |
|  >> Severe weather warning, 12km NW      |
|------------------------------------------|
|  [MAP centered on GPS, ~50km radius]     |
|  Route overlay with alert markers        |
|  Rally point markers (green diamonds)    |
|------------------------------------------|
|  TEAM STATUS: 4/4 checked in             |
|  Last check-in: 2m ago (all members)     |
|------------------------------------------|
|  [Report] [Check In] [Rally] [Emergency] |
+------------------------------------------+
```

This screen answers all four field operator questions in under 3 seconds without any interaction. The current Situation tab answers only one of them (global posture level).

---

## 6. Scenario Analysis

### Scenario A: Advance Team Member Scouting a Venue

**Context:** A security officer from a school organization is visiting a hotel conference center in Nairobi, Kenya two days before the group arrives. They need to check local threat conditions while walking the site.

**Step-by-step with current mobile design:**

1. Officer opens the app. Situation tab loads. (0.5s)
2. Sees global posture: ELEVATED. P1: 2, P2: 8. (+1s)
3. Reads P1 banner: "Magnitude 6.1 earthquake, Papua New Guinea." Not relevant. (+2s)
4. Needs to check threats near Nairobi. Taps Map tab. (+1s)
5. Map loads showing global view. Must pinch-zoom to East Africa. (+3-5s)
6. Must pan to Nairobi. (+2-3s)
7. Sees 3 markers in the region. Taps one. (+1s)
8. Bottom sheet: "Civil unrest -- opposition protests planned in Nairobi CBD." Severe. P2. (+3s reading)
9. Dismisses sheet. Taps next marker. (+2s)
10. Bottom sheet: "Health advisory -- cholera cases reported in Mathare." Moderate. P3. (+3s)
11. Dismisses. Taps third marker. (+2s)
12. "Infrastructure -- planned power outage, Westlands area." Minor. P4. (+2s)
13. Wants to check geo summary for East Africa. Taps Intel tab. (+1s)
14. Scrolls past priority alerts. Finds regional summaries. Taps "Sub-Saharan Africa." (+3s)
15. Reads AI summary. (+10s)

**Total time to situational awareness: ~35-45 seconds of active phone interaction.**

**With recommended enhancements:**

1. Officer opens app. Map tab auto-centers on GPS (Nairobi). (0.5s)
2. Sees localized threat level: MODERATE (based on 3 alerts within 25km). (+1s)
3. Sees 3 markers nearby with severity dots. P2 civil unrest marker is prominent. (+1s)
4. Taps P2 marker. Bottom sheet shows protest details. (+3s)
5. Notices "Geo Summary: Sub-Saharan Africa -- MODERATE" card pinned above the map. Taps it. (+2s)
6. Reads AI assessment. (+10s)

**Total time: ~18 seconds.** Nearly 2x faster with significantly less cognitive load.

**Gap identified:** No way to record observations ("venue has single exit on south side, poor egress options"), no way to mark the venue on the map for the rest of the team, no way to send a "venue assessment" report to HQ.

### Scenario B: Security Officer Receives P1 Alert During Active Group Movement

**Context:** A church group of 30 people is being escorted through a market district in Istanbul. The security officer's phone vibrates. A new P1 alert has arrived.

**Step-by-step with current mobile design:**

1. Officer feels vibration (haptic feedback, per UX Strategy). Pulls phone from pocket. (+2s)
2. App is on Situation tab (last used). Sees P1 count has changed from 0 to 1. Banner has appeared. (+1s)
3. Banner reads: "Armed clash reported near Grand Bazaar, Istanbul." Extreme severity. P1. (+2s reading)
4. **Critical decision point:** The group is three blocks from the Grand Bazaar. The officer needs to determine: How close? How active? What direction?
5. Taps the P1 banner. Alert detail bottom sheet opens. (+1s)
6. Reads: "Reports of gunfire near Beyazit Square. Multiple casualties reported. Security forces responding." (+3s)
7. Checks geo scope: "TR" -- Turkey, but no precise coordinates visible. (+1s)
8. Needs to see this on the map relative to group position. There is no "Show on Map" button in the current alert detail design for the P1 banner sheet. The Category Detail view has "View Category" but not "Show on Map." (+0s -- dead end)
9. Closes sheet. Taps Map tab. (+1s)
10. Map is at last-used zoom level (global?). Must zoom to Istanbul. (+3-5s)
11. Finds the new red marker. It is 400m from their current position. (+2s)
12. **Total time from vibration to actionable spatial awareness: 16-20 seconds.**

**In a protective operation, 16-20 seconds is too long.** During an active threat 400m away, the officer needs to make a cover/concealment and movement decision within 5 seconds. The current design requires sequential tab switching, zoom/pan, and marker identification.

**With recommended enhancements:**

1. Phone vibrates. Push notification (when backend supports it) shows: "P1: Armed clash, 400m from your position. COVER AND ASSESS." (+2s)
2. Officer taps notification. App opens to Map tab, centered on their GPS position, with the P1 marker prominently animated nearby. (+1s)
3. Officer sees direction and distance. Initiates group movement in opposite direction. (+1s)
4. Taps "Emergency" quick action. GPS-tagged alert sent to HQ: "Team Bravo taking evasive action, armed clash 400m east." (+2s)
5. **Total time: ~6 seconds.**

**Gap identified:** The fundamental gap is the absence of proximity-aware alerting and the lack of a "Show on Map" action from the P1 banner alert detail.

### Scenario C: Analyst at Temporary HQ Monitoring Multiple Categories Overnight

**Context:** An HQ security analyst is in a hotel room monitoring threat feeds for three concurrent trips (East Africa, Middle East, Southeast Asia) during an overnight shift.

**Step-by-step with current mobile design:**

1. Analyst opens app on tablet (768px+ gets desktop view per breakpoint decision). APPROPRIATE -- the desktop ZUI is designed for this use case. No mobile design issue.

2. If the analyst uses a phone instead (under 768px):
   - Situation tab provides global posture and all 15 categories. GOOD for broad monitoring.
   - Intel tab provides geographic summaries for all 11 regions. GOOD for regional assessment.
   - Category cards sorted by alert count surface the most active categories. GOOD.
   - P1 alerts poll every 15 seconds. GOOD for overnight monitoring.

3. **Problem:** No way to set up monitoring for specific regions of interest. The analyst cares about 3 of 11 regions but sees all 11 equally weighted in the Intel tab. No "watchlist" or "my regions" feature.

4. **Problem:** No audio alert for new P1 items. During an overnight shift, the analyst may set the phone on the desk and work on other tasks. A visual-only P1 banner on a phone lying face-up is easy to miss. An audible tone for P1 arrivals would be essential for overnight monitoring.

5. **Problem:** No way to annotate or forward a threat assessment. If the analyst sees a concerning trend, they cannot send a summary to the field teams through the tool. They would need to switch to email, messaging, or radio -- losing context and adding delay.

**Assessment for this scenario:** The mobile view is ADEQUATE for casual overnight monitoring but INSUFFICIENT for dedicated overnight watch. The desktop view on a tablet would be the correct tool for this use case.

---

## 7. Missing Capabilities

The following capabilities are absent from the mobile strategy and would be required for full protective operations support. They are listed in order of operational criticality.

### 7.1 Location-Aware Threat Assessment

**What:** A localized threat level computed from alerts within a configurable radius of the user's GPS position (or a manually specified point). Displayed as a persistent indicator: "Your area: [LEVEL] -- X alerts within Y km."

**Why:** The global threat posture is not actionable for field operators. A localized assessment is the single most important piece of information for a protective detail.

**Data source:** `useCoverageMapData` already returns `MapMarker[]` with coordinates. Filtering by distance from a GPS point is a client-side computation. The geo summaries from `useLatestGeoSummary` provide region-level context. Combining both gives a usable local threat picture.

### 7.2 Proximity-Based Alert Filtering

**What:** Option to filter all views (Situation, Map, Intel) to show only alerts within a radius of the user's location or a specified point. A "Near Me" toggle.

**Why:** A security officer in Jakarta does not need to process alerts from North Africa. The cognitive cost of filtering 15 categories globally is excessive during field operations.

### 7.3 P1 Alert Acknowledgment System

**What:** When a P1 alert arrives, the banner should persist until the user explicitly taps "Acknowledge." Acknowledgment should be logged server-side with a timestamp and user identifier. HQ should be able to see which field users have acknowledged which P1 alerts.

**Why:** P1 means "immediate threat to life." Silent auto-dismissal after 30 seconds is operationally dangerous. Acknowledgment tracking lets HQ verify that field teams are aware of critical threats.

### 7.4 Data Staleness Indicator

**What:** A visible timestamp on every data element showing when it was last successfully refreshed. When connectivity is lost, a persistent banner should appear: "DATA OFFLINE -- Last updated: [timestamp]." When data exceeds its polling interval by 2x without refresh, visual indicators should degrade (dim, add a warning icon).

**Why:** The client decision against offline support (Q1) means the app shows nothing when offline. Worse, during intermittent connectivity, cached data may display without any indication of age. A protective detail acting on 45-minute-old intelligence that appears current is making decisions on false confidence.

### 7.5 Duress Signal / Emergency Button

**What:** A persistent, always-accessible button (perhaps in the header or as a floating action button) that, when activated (long-press to prevent accidental activation), sends a GPS-tagged emergency signal to the HQ operations center.

**Why:** This is standard in protective operations tools. If a security officer encounters a direct threat, they need a single-action mechanism to alert HQ with their precise location. The current app provides no outbound communication of any kind.

### 7.6 Check-In System

**What:** A mechanism for field team members to confirm their status at designated intervals or waypoints. HQ should see a dashboard of check-in status. Missed check-ins should trigger escalation.

**Why:** Check-ins are the primary mechanism for HQ to maintain awareness of field team status. Without them, HQ has no way to distinguish "the officer is fine and busy" from "the officer is in distress."

### 7.7 Rally Point Display

**What:** Map markers showing pre-designated rally points (assembly locations for emergency evacuation). These should be visually distinct from alert markers (different shape, dedicated color -- green or blue diamond, for instance).

**Why:** Rally points are referenced in the SafeTrekr platform's core API (safetrekr-core calls TarvaRI for AI-suggested rally points). The data exists in the backend but is not surfaced in the mobile design. During an emergency, every team member needs to instantly see where to direct the group.

### 7.8 Route Overlay

**What:** The ability to display a planned travel route on the map, with alerts plotted along or near the route highlighted.

**Why:** Movement planning is a core protective operations function. Seeing alerts in the context of a planned route (rather than scattered globally) enables route validation and alternative route selection.

### 7.9 Session Auto-Lock

**What:** Configurable auto-lock timeout (e.g., 2 minutes of inactivity) that requires re-authentication to access the dashboard. Separate from the device lock.

**Why:** If a phone is left unattended (set down during a meeting, left in a vehicle), the application should not remain accessible indefinitely. The current passphrase-in-sessionStorage approach provides no timeout.

### 7.10 High-Contrast / Outdoor Mode

**What:** A toggle (or automatic ambient light sensor response) that switches from the Oblivion dark aesthetic to a high-contrast mode with white background, black text, and bold severity colors. This would be functionally ugly and aesthetically alien to the brand, but operationally essential in sunlight.

**Why:** Field personnel work outdoors. The Oblivion aesthetic is designed for a dimly lit operations center, not a sunny parking lot.

### 7.11 Alert Sound / Audible Notification

**What:** An optional audible tone (configurable: on/silent/vibrate-only) when new P1 alerts arrive.

**Why:** Visual-only notifications on a phone that is face-down, in a pocket, or across a room are ineffective. Haptic feedback (mentioned in UX Strategy) helps when the phone is in hand or pocket, but not when it is on a desk. For overnight monitoring, an audible alert is essential.

### 7.12 Outbound Threat Reporting

**What:** A "Report" function allowing field users to submit a GPS-tagged threat observation (free text + category + severity selection) to the TarvaRI system.

**Why:** Field operators are sensors. They observe things that automated intelligence feeds miss. A security officer who sees a suspicious vehicle or hears an explosion is a primary source. Currently, this observation has no path into the TarvaRI intelligence pipeline from the mobile interface.

---

## 8. Prioritized Recommendations

### CRITICAL (Must have for field safety)

| # | Recommendation | Rationale | Estimated Effort |
|---|---------------|-----------|-----------------|
| C1 | **Data staleness indicator and offline warning banner** | Operators must know when data is stale. Acting on old intelligence without awareness is more dangerous than having no intelligence. | Low -- UI-only, uses existing TanStack Query state (`isStale`, `dataUpdatedAt`, `isError`) |
| C2 | **P1 alert persistence until explicit acknowledgment** | P1 = immediate threat to life. Auto-dismissal after 30 seconds is operationally unacceptable. | Low -- change banner dismiss logic, add "Acknowledge" button |
| C3 | **"Show on Map" action in P1 banner and alert detail sheets** | When a P1 alert fires, the operator's immediate need is spatial context: where is this relative to me? The current design forces tab-switching and manual zoom. | Low -- add action button that switches to Map tab and flies to coordinates |
| C4 | **GPS "center on me" button on Map tab** | Field operators need to see threats relative to their position. This is the minimum viable location-awareness feature. | Low -- standard MapLibre geolocate control, already available as a plugin |
| C5 | **Session auto-lock with configurable timeout** | An unlocked intelligence dashboard on an unattended phone is an OPSEC vulnerability. The application must enforce its own session timeout. | Medium -- requires auth state management beyond sessionStorage |
| C6 | **Audible/haptic notification for P1 arrivals** | Visual-only P1 notification on a phone in a pocket or on a desk is insufficient for protective operations. Must have audio/vibration channel. | Medium -- Web Audio API or Notification API; requires foreground app |
| C7 | **Connectivity status indicator in header** | A persistent small indicator (green dot / red dot / yellow dot) showing current connection state to the TarvaRI API. Essential for field trust in the tool. | Low -- check `navigator.onLine` + TanStack Query error state |

### IMPORTANT (Significantly improves protective capability)

| # | Recommendation | Rationale | Estimated Effort |
|---|---------------|-----------|-----------------|
| I1 | **Location-aware threat summary** | A card showing "X alerts within Y km of your position, highest severity: Z." This is the field operator's primary question answered without any interaction. | Medium -- client-side distance calculation from `MapMarker[]` GPS data |
| I2 | **Rally point markers on the map** | SafeTrekr core already computes rally points via TarvaRI. Surface them on the mobile map as distinct markers. | Medium -- requires API endpoint integration and new marker layer |
| I3 | **High-contrast / outdoor mode** | The Oblivion aesthetic is not usable in sunlight. A toggle to a high-contrast theme preserves field usability. | Medium -- alternate CSS token set, toggle in settings |
| I4 | **P1 acknowledgment tracking (server-side)** | HQ needs to know which field personnel have seen each P1 alert. Log acknowledgments with timestamp and user ID. | Medium -- requires backend API endpoint |
| I5 | **Role-aware default tab** | Security officers benefit from Map as default; analysts benefit from Situation. Use the user's role to set the default. | Low -- conditional logic in `useIsMobile` or a separate preference |
| I6 | **Proximity-based alert filter ("Near Me" mode)** | Filter all views to show only alerts within a configurable radius. Reduces cognitive load for field operators from 15 global categories to the 2-3 relevant to their location. | Medium -- client-side filter using GPS + marker coordinates |
| I7 | **Quick-action floating button for emergency/duress** | A persistent, always-accessible mechanism to send a GPS-tagged emergency signal. Standard in protective operations mobile tools. | High -- requires backend endpoint, notification pipeline to HQ |
| I8 | **Alert "Show on Map" cross-tab navigation** | From any alert detail (bottom sheet), one tap to see that alert's location on the map. The IA document mentions this in the navigation tree for Category Detail but not for the P1 banner or Intel tab alert cards. | Low -- extend existing cross-tab navigation pattern |
| I9 | **Saved category filter profiles** | Allow operators to save a set of relevant categories ("Trip Security": conflict, civil unrest, weather, health, disaster, fire) and apply it with one tap instead of toggling 6 individual chips each session. | Medium -- persist to localStorage or backend preference |

### NICE-TO-HAVE (Enhances experience but not blocking)

| # | Recommendation | Rationale | Estimated Effort |
|---|---------------|-----------|-----------------|
| N1 | **Route overlay on map** | Display a planned travel route with alerts along the route highlighted. Enables route validation. | High -- requires route data from SafeTrekr core |
| N2 | **Field observation reporting** | Allow field users to submit GPS-tagged threat observations into TarvaRI. | High -- requires new API endpoint, moderation pipeline |
| N3 | **Team check-in system** | Periodic status confirmation from field to HQ. | High -- requires backend feature development |
| N4 | **Minimal offline cache** | Cache the last-known threat posture, P1/P2 alerts, and map markers for display (with clear "OFFLINE" banner) when connectivity drops. Not full offline support, but a degraded-mode safety net. | Medium -- service worker with limited cache scope |
| N5 | **Reduced-information OPSEC mode** | A mode that shows only posture level and P1/P2 counts without text content, for use when screen visibility to bystanders is a concern. | Low -- conditional rendering of text elements |
| N6 | **Glove-compatible large-target mode** | Increases all touch targets to 56px+ and font sizes by 25% for use with gloved hands or in high-motion environments. | Medium -- alternate token set applied via toggle |

---

## 9. Summary Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Analyst desk-to-mobile continuity | A | Excellent. The shared data layer, 3-tab model, and progressive disclosure serve the analyst use case very well. |
| Field operator usability | C | The design does not account for field operating conditions: sunlight, movement, stress, gloves, intermittent connectivity. |
| Threat monitoring hierarchy | B | P1/P2 system is strong. Missing: location-aware assessment, proximity filtering, go/no-go indicator. |
| OPSEC posture | D | No auto-lock, no session revocation, no data staleness marking, no screenshot audit. Passphrase auth is inadequate for an intelligence tool. |
| Communication and escalation | F | Entirely absent. No outbound communication, no acknowledgment system, no team coordination, no emergency function. This is a read-only tool in a domain that requires bidirectional communication. |
| Navigation model | B+ | The 3-tab model is sound. Map as the field-operator default and a location-aware Situation variant would earn an A. |
| Aesthetic vs. operational tension | C | The Oblivion aesthetic is visually impressive but operationally hostile in field conditions. The outdoor readability problem is identified in the documents but not resolved. |

### Overall Protective Operations Readiness: C+

The mobile strategy is a strong engineering plan for a consumer-grade intelligence dashboard. For protective operations field use, it requires the CRITICAL items (C1-C7) to be addressed before deployment to field personnel. The IMPORTANT items (I1-I9) should be prioritized in the roadmap immediately following initial release.

The most impactful single change would be **C4 + I1**: a GPS center button on the Map tab combined with a location-aware threat summary card. Together, these transform the tool from "a global intelligence dashboard on a phone" to "a field situational awareness tool that knows where I am."

---

*Review version: 1.0 | Completed: 2026-03-06 | Reviewer: Protective Operations Assessment*
*Next action: Route to Product Owner and Engineering Lead for triage and roadmap integration.*
