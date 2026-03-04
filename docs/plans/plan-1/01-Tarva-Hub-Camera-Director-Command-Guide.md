Tarva Hub — Camera Director Command Guide v0.1

AI as the navigation rig for an infinite mission-control workspace (desktop-first).

⸻

0) What this is

The Camera Director is the hub’s AI co-pilot that moves the camera, focuses attention, and summons the right station—without page navigation. It makes the workspace feel spatial, cinematic, and operator-grade.

Promise: “Say what you want. The space re-forms. You stay oriented. Everything leaves a receipt.”

⸻

1) Operating rules (non-negotiables)

Every AI-driven navigation must do all of the following:
	1.	Announce (1 line): what it’s doing
	2.	Why (1 short line): what signal/intent caused it
	3.	Preview: where it will take you + what will open
	4.	Control: user can cancel/override instantly
	5.	Receipt: logs what it did + why (traceable)

Never: teleport without staging, hide the user’s location, or open destructive actions automatically.

⸻

2) Autonomy modes (ladder)

Mode 0 — Suggest (default)
AI highlights destination + offers “Go”.

Mode 1 — Assist
AI moves camera + opens station. No actions executed.

Mode 2 — Operator (role-gated)
AI moves + opens station + drafts plan previews. Approval required for risky actions.

⸻

3) Camera choreography (the “sci-fi feel”)

Movement primitives (only allowed moves)
	•	Pan (lateral travel)
	•	Dolly (zoom in/out)
	•	Orbit (subtle angle shift for depth)
	•	Snap-Home (return-to-hub ritual)
	•	Focus-Pull (de-emphasize non-relevant regions)

Staged travel rule (no teleporting)

Any long move uses a consistent 3-beat rhythm:
	1.	Context (zoom out slightly; show destination beacon)
	2.	Travel (smooth pan with calm inertia)
	3.	Arrival (zoom in; station unfurls; “you are here” ping)

⸻

4) Orientation instruments (always visible, subtle)
	•	Radar/Minimap: hub + districts + viewport rectangle
	•	Heading glyph: compass-like direction anchor
	•	Readout breadcrumb (not a menu):
Hub → CORE → Ops → Latency
	•	Home ritual: one universal “return” action always available

⸻

5) Command surface (how users invoke it)

The Director is accessed via:
	•	A minimal prompt line (instrument-like)
	•	A single glyph that expands on hover/press
	•	Keyboard-first shortcuts (internal tool, power users)

Design principle: the command surface must feel like a cockpit control, not a chat app.

⸻

6) Command set (must-have)

Primary
	•	FOCUS
Best next focus based on signals + role + recency.
Output: moves camera (or suggests) + highlights top station.
	•	HOME
Return to Hub Atrium (0,0).
Output: snap-home ritual + calm reset.
	•	GO <district | app>
Deterministic navigation.
Output: staged travel to the destination; no interpretation.
	•	SHOW <signal | query>
Query-driven staged reveal.
Output: constellation glance → highlight → zoom into best district → open station.

Secondary (high value)
	•	TRACK <thing>
Follow a live entity (run, build, incident).
Output: camera follows updates while preserving calm.
	•	LAST
Return to previous viewport + station state.
Output: reverse travel or soft snap back.
	•	PIN
Save current viewport + open station as a shareable location.
Output: creates “Pinned View” with receipt.
	•	RECEIPTS
Jump to evidence timeline / ledger.
Output: staged move to Evidence district + filter to relevant trace.

⸻

7) Determinism vs interpretation (predictability rules)
	•	GO is always deterministic (no guessing).
	•	FOCUS / SHOW can interpret, but must disclose:
	•	the signal used
	•	the confidence
	•	alternates if applicable (“Next best: TarvaCODE builds”)

⸻

8) How “best next focus” is chosen (priority stack)
	1.	Urgency / safety (incidents, failures, policy blocks)
	2.	Role relevance (ops vs builder vs exec)
	3.	Recency (what user was just doing)
	4.	System goals (queued approvals, stuck runs)
	5.	User intent override (explicit request wins)

⸻

9) Standard Director overlays (visual language)

Overlays appear briefly, then fade:
	•	Destination Beacon (pulse)
	•	Path Trace (thin line, decays)
	•	Target Lock (soft bounding frame on arrival)
	•	“You are here” ping (single pulse)
	•	Focus Pull (dim non-relevant districts)

Rule: overlays never obscure primary telemetry; they are guidance, not UI.

⸻

10) Director response format (scripted, consistent)

Every Director action renders as a compact “operator readout”:

ANNOUNCE:

“Focusing TarvaCORE → Investigate.”

WHY:

“Alert trend rising (+42% / 10m).”

PREVIEW:

“Zooming to CORE district; opening Investigate station (read-only).”

CONTROL:

[Cancel]  [Go Slower]  [Suggest Instead]

RECEIPT:

“Receipt stamped: Focused CORE due to alert trend; trace ####.”

⸻

11) Example scripts (deck-ready)

Script A — FOCUS (default)

User: FOCUS
Director:
	•	Announce: “Focusing TarvaCORE → Investigate.”
	•	Why: “Alert trend rising (+42% / 10m).”
	•	Preview: “Zoom to CORE; open Investigate station.”
	•	Motion: context → travel → arrival; station unfurls.
	•	Receipt: stamped.

Script B — GO (deterministic)

User: GO TarvaAgentGen
Director:
	•	Announce: “Going to TarvaAgentGen.”
	•	Why: “Direct command.”
	•	Preview: “Centering AgentGen district; opening Status station.”
	•	Receipt: stamped.

Script C — SHOW (query reveal)

User: SHOW what’s on fire
Director:
	•	Announce: “Scanning system health.”
	•	Why: “Query: ‘what’s on fire’.”
	•	Preview: “Constellation view → highlight top issues → zoom into highest severity.”
	•	Arrival: opens Investigate station with top 3 anomalies.
	•	Receipt: stamped.

Script D — TRACK (live follow)

User: TRACK run 142
Director:
	•	Announce: “Tracking Run 142.”
	•	Why: “Run selected.”
	•	Preview: “Following run status changes; opening Runs station.”
	•	Behavior: camera stays steady; subtle pings on state change; user can pause tracking.
	•	Receipt: stamped.

Script E — PIN (shareable)

User: PIN this view
Director:
	•	Announce: “Pinned this viewport.”
	•	Why: “Shareable location requested.”
	•	Preview: “Pin includes camera position + open station + filters.”
	•	Receipt: stamped with pin ID.

⸻

12) Definition of done (for the first milestone)

The Camera Director is “real” when:
	•	FOCUS reliably lands users in the right district + station
	•	GO is deterministic and fast
	•	SHOW supports at least 3 common queries (on fire, failures, approvals)
	•	LAST and HOME are instant confidence restores
	•	Every Director move creates a receipt
	•	Users never feel lost (minimap + readout always clarifies location)

