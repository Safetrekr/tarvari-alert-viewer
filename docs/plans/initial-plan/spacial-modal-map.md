Tarva Hub Spatial Model Map v0.1

A single infinite workspace. Navigation is spatial + zoom-based. Pages don’t exist—only proximity, scale, and morphing.

This map uses a Zoomable User Interface (ZUI) model (infinite plane + pan/zoom + detail revealed by scale). ￼

⸻

Spatial diagram (top-down “floor plan”)

                                 ↑  North / "System Sky"
                                 │  (package-wide truth)
                      ┌─────────────────────────────────────────┐
                      │        CONSTELLATION OVERVIEW           │
                      │  - Global health / alerts / throughput  │
                      │  - “Where is attention needed?”         │
                      └─────────────────────────────────────────┘

      ↖ NW / Governance & Receipts                    NE / Operations Bridge ↗

(audit, evidence, identity, policy) (runtime truth)

┌───────────────────────┐ ┌──────────────────────────┐
│ EVIDENCE LEDGER │ │ TARVA CORE DISTRICT │
│ - Receipts timeline │ │ - Runs / queues │
│ - Audit trails │ │ - Health & latency │
│ - “Proof stamps” │ │ - Alerts & mitigations │
└───────────────────────┘ └──────────────────────────┘

            ┌──────────────────────────────────────────────────┐
            │                 HUB ATRIUM (0,0)                  │
            │  “Home base” — calm mission-control nucleus       │
            │  - App capsules ring (select = morph)             │
            │  - Radar/minimap + compass + search glyph         │
            │  - Ambient telemetry (non-clickable allowed)      │
            └──────────────────────────────────────────────────┘

┌──────────────────────────┐ ┌──────────────────────────┐
│ TARVA CODE DISTRICT │ │ TARVA CHAT DISTRICT │
│ (build/design) │ │ (comms/assist surfaces) │
│ - Repos / pipelines │ │ - Conversations health │
│ - Builds / deployments │ │ - Assist queue / SLA │
│ - Artifacts produced │ │ - Escalations │
└──────────────────────────┘ └──────────────────────────┘
↙ SW / Forge & Tools SE / Comms Deck ↘

                      ┌──────────────────────────┐
                      │  TARVA PROJECT DISTRICT  │
                      │  (projects/clients)      │
                      │  - Active workstreams    │
                      │  - Milestones / status   │
                      │  - “Jump into app”       │
                      └──────────────────────────┘

                                 │
                                 ↓  South / "Work Dock"

How to read this:
• The Hub Atrium is always the center reference point (0,0).
• Each Tarva product is a “district” on the plane.
• Diagonals are cross-cutting system views (e.g., Evidence Ledger = NW).
• Users feel “inside” the space because the camera moves; the workspace doesn’t reload.

⸻

Zoom levels (the Z-axis = “altitude”)

This is semantic zoom: objects change representation as you zoom, not just size. ￼

Z0 — Constellation (very zoomed out)
• App districts appear as luminous beacons + a few global metrics.
• Goal: find where attention is needed fast.

Z1 — Hub Atrium (default landing)
• App capsules show ambient status strips (health, last event, alerts).
• Selecting an app pulls it toward center and triggers a morph.

Z2 — District (app-focused)
• The chosen product “unfurls” into 3–5 stations (Enter App / Ops / Artifacts / Agents / Settings).
• Peripheral telemetry stays visible but quiet.

Z3 — Station (task + receipt)
• The workspace forms a tight functional panel for the action.
• Every meaningful action emits a receipt stamp (trace/time/result).

(This approach is aligned with classic ZUI workspace ideas like Pad++ and the broader overview+detail / focus+context literature.) ￼

⸻

Navigation instruments (to prevent “getting lost”)

Research consistently supports having an overview for zoomable spaces. ￼

Required instruments (always available, subtle): 1. Radar / Minimap (tiny)
• Shows hub + districts + your current viewport rectangle. 2. Compass / Heading glyph
• A calm orientation anchor (no big labels needed). 3. Return-to-Hub ritual
• One universal action (hotkey + a click target) that “snaps” you home. 4. Breadcrumb as coordinates (not a menu)
• Example: Hub → CORE → Ops → Run #142 (displayed like a status readout).

⸻

“Physics” rules (why it feels cinematic instead of webby)

These are the invisible constraints that make it feel like an Oblivion workstation:
• Gravitation: selected objects drift toward center; deselected drift back to their district.
• Inertia: camera movement has smooth momentum (calm, not floaty).
• Quiet parallax: depth is subtle, never jarring. ￼
• Ambient vs actionable: most micro-telemetry is ambient; only a few elements are clickable at a time (mission-control clarity). ￼

⸻

The “shareable” one-sentence legend

“Tarva Hub is a single infinite mission-control surface: you pan to move through the system, you zoom to change meaning, and selecting an app morphs the space into an app-specific control cluster—always with a minimap and a home ritual.” ￼
