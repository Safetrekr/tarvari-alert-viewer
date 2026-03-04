B) Disposable Stations — Tarva Hub Station System v0.1

AIA “disposable pixels” that appear on-demand, governed by a stable spine: scope → preview → action → receipt.

⸻

0) What a Station is

A Station is a temporary, task-specific control surface that appears inside the infinite workspace when the user focuses on a district (TarvaCORE, TarvaCODE, etc.) or expresses intent (“show failures”).

Stations are:
	•	Ephemeral (spawned per moment, per user/context)
	•	Composable (built from constrained blocks)
	•	Governed (policy + role + audit)
	•	Receipt-first (every meaningful thing leaves evidence)

Non-goal: “AI invents random UI.” Stations are generated within strict templates.

⸻

1) Station invariants (non-negotiables)

Every station—generated or hand-authored—must include:
	1.	Scope chip
	•	“What this station can touch” (systems, environment, permissions)
	2.	Why / Trigger
	•	“Why you’re seeing this now” (signal, intent, role)
	3.	Primary actions (max 1–2)
	•	Everything else is secondary or read-only
	4.	Preview / Diff (if any action changes state)
	•	“What will change” before execution
	5.	Receipt stamp (always)
	•	“What happened” with trace/time/result
	6.	Rollback / Undo
	•	Either a real undo path or explicit “not reversible”

If any invariant is missing, the station fails quality gates.

⸻

2) Station archetypes (the standardized set)

Do not let each app invent its own surfaces. Keep one shared language:

1) Status Station (read-only, calm)
	•	“What’s the current state?”
	•	Key metrics, trends, last change, confidence

2) Investigate Station (triage)
	•	“What’s abnormal and why?”
	•	Top anomalies, suspected causes, jump-to evidence

3) Plan Preview Station (draft + diff)
	•	“Here’s the proposed plan.”
	•	Steps, risk, blast radius, diff preview

4) Execute Station (approved changes)
	•	Minimal “go” buttons, checks, confirm gates
	•	Always paired with receipts + rollback

5) Evidence / Receipts Station (proof pack)
	•	Timeline of receipts, artifacts, run manifests
	•	Filters + “rehydrate context”

6) Configure Station (safe knobs)
	•	Policy-bounded settings, compatibility warnings, guardrails

That’s it. Everything maps to these.

⸻

3) Station composition blocks (the “LEGO set”)

Stations are assembled from a constrained block library so visuals stay consistent.

Core blocks
	•	Header block: title, scope chips, trigger/why
	•	Telemetry strip: 3–7 glanceable metrics + sparklines
	•	Narrative summary: 2–4 lines “what changed / why it matters”
	•	Action row: max 2 primaries, secondary actions tucked away
	•	Preview/Diff panel: before/after, affected objects, risk flags
	•	Receipt strip: recent receipts relevant to this station
	•	Evidence links: artifacts, logs, run bundles, references
	•	Safety gates: confirmations, role checks, policy notes
	•	Escalation box: “Hand to human / notify / create ticket”

Visual rule
	•	Ambient data can be dense. Actions must be sparse.
	•	Primary actions always occupy the same “power position” in the station so muscle memory forms.

⸻

4) Triggers: when stations appear

Stations are spawned by one of three triggers:

A) Context trigger (where you are)

Zooming into a district automatically spawns:
	•	Status (always)
	•	Evidence (quietly available)

B) Signal trigger (what’s happening)

When signal thresholds are crossed:
	•	Investigate spawns and may be highlighted
	•	Plan Preview may be suggested (not auto-opened)

C) Intent trigger (what you asked)

Director command like:
	•	SHOW failures last hour → Investigate station filtered
	•	GO CORE → Status station

⸻

5) Station lifecycle (spawn → focus → complete → decay)

Stations have a “life” like instruments:
	1.	Spawn (quietly appears)
	2.	Highlight (if relevant to current objective)
	3.	Focus (user opens; it expands)
	4.	Operate (read, decide, approve)
	5.	Receipt (action produces a stamp + evidence links)
	6.	Decay (station collapses or fades to idle state)
	7.	Pin (optional) to keep for collaboration/reuse

Important: pinned stations become shareable “locations” in the infinite workspace.

⸻

6) Safety model (what makes it trustworthy)

Stations are governed by:

A) Role-based access
	•	Actions only appear if role is allowed
	•	Otherwise the station is read-only with explicit explanation

B) Risk classification

Every action is labeled:
	•	Safe (reversible, low blast radius)
	•	Caution (limited blast radius, confirm)
	•	High Risk (approval gate + explicit diff + rollback plan)

C) No action without preview

If it changes state, you must show:
	•	affected objects
	•	expected delta
	•	potential side effects
	•	rollback option

D) Receipts are mandatory

Receipts always include:
	•	who, what, when, why
	•	trace id
	•	result (success/fail)
	•	evidence links

⸻

7) How AI “generates” stations (without chaos)

AI is only allowed to generate:
	1.	Which station archetype(s) to show
	2.	Which blocks to include (from the library)
	3.	Content inside blocks (summary text, highlights, ordering)
	4.	Suggested next actions (but execution always gated)

AI is not allowed to:
	•	change layouts arbitrarily
	•	invent new actions outside the approved action catalog
	•	bypass risk/role gating

This is how you keep the UI cinematic and safe.

⸻

8) Per-product station mapping (starter set)

TarvaCORE (runtime operations)
	•	Status: health, p95 latency, queue depth, active runs, alert trend
	•	Investigate: top anomalies, suspected cause, evidence links
	•	Plan Preview: proposed mitigations (reroute, restart worker, pause job)
	•	Execute: approved ops actions with checks + receipts
	•	Evidence: run manifests, proof bundles, action receipts

TarvaCODE (build/design)
	•	Status: build pipelines, deployments, failing checks
	•	Investigate: last break diff, likely culprit, repro steps
	•	Plan Preview: proposed fix plan / PR draft outline (preview)
	•	Execute: create branch/PR, run tests (gated)
	•	Evidence: build logs, artifacts, receipts

TarvaChat (assist/comms)
	•	Status: queue/backlog, SLA risk, escalations count
	•	Investigate: flagged threads, failure reasons, interventions
	•	Plan Preview: suggested response policies or routing
	•	Execute: escalate, assign, acknowledge (gated)
	•	Evidence: transcript + receipts + tool-call trace

TarvaAgentGen (agent generation)
	•	Status: jobs, success rate, time-to-generate, recent failures
	•	Investigate: failed gens (root causes), missing inputs, eval scores
	•	Plan Preview: proposed patch to prompts/skills/templates
	•	Execute: regenerate agent, promote version (gated)
	•	Evidence: generated artifacts + eval receipts

Tarva Project (workstreams/clients)
	•	Status: milestones, blockers, due dates
	•	Investigate: stuck items, owner, risk
	•	Plan Preview: unblock plan + messages + tasks
	•	Execute: notify/create task/attach bundle (gated)
	•	Evidence: decision receipts + attachments

⸻

9) “Wow” station moments (futuristic details that matter)

These are the cinematic beats that make it feel alive:
	•	Station unfurl: capsule becomes a cluster of stations via gravity/morph
	•	Focus lens: hover expands readouts; everything else dims
	•	Receipt stamp pulse: crisp confirmation that slots into timeline
	•	Evidence rehydrate: click a receipt and the station reconstructs the exact context
	•	Ambient particles: flow toward the active station (subtle, not distracting)

⸻

10) Definition of done (B v0.1)

Disposable Stations are “real” when:
	•	All stations comply with invariants (scope/why/actions/preview/receipt/undo)
	•	6 archetypes exist and are reused across all apps
	•	The Director opens the correct station at arrival
	•	At least one state-changing action produces: preview → approval → receipt → evidence links
	•	Stations decay gracefully and can be pinned/shared

⸻

