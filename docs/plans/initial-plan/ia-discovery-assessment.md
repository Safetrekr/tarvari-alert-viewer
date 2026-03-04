# IA Discovery Assessment -- Tarva Launch

**Version:** 1.0
**Date:** 2026-02-25
**Assessor:** Information Architect (specialist consultation)
**Scope:** Information hierarchy, taxonomy, status language, navigation labeling, evidence ledger structure

---

## 1. Information Hierarchy -- Progressive Disclosure by Zoom Level

### Z0: Constellation (Zoomed Out -- Triage View)

**User goal at Z0:** "Where does attention need to go RIGHT NOW?"

Three global metrics, displayed as large numerals with status coloring:

| #   | Metric           | What It Shows                            | Source                                                                                                                        | Format                                                                   |
| --- | ---------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | **Alert Count**  | Total active alerts across all apps      | Aggregated from each app's health/alert endpoints                                                                             | Integer + severity badge (e.g., `3` with red dot if any critical)        |
| 2   | **Active Work**  | Total running activities across all apps | Sum of: generation runs (Builder) + active conversations (Chat) + agent executions (Project Room) + reasoning sessions (CORE) | Integer (e.g., `12 active`)                                              |
| 3   | **System Pulse** | Worst-of-five health state               | Derived from individual app health states                                                                                     | Single status word + color (e.g., `OPERATIONAL` green, `DEGRADED` amber) |

**Why these three and not others:**

- Alert Count answers: "Is anything screaming for attention?"
- Active Work answers: "How busy is the system?"
- System Pulse answers: "Is anything broken?"

These three let the operator decide in under 2 seconds whether to zoom in or walk away.

**What NOT to show at Z0:** Per-app metrics, latency numbers, artifact counts, timestamps. These require reading, not scanning. They belong at Z1+.

**Visual treatment at Z0:** Each district appears as a luminous beacon. The beacon brightness/color reflects that district's health state. No text labels on districts at Z0 other than compact icon + 2-letter code (see Section 4).

---

### Z1: Launch Atrium (Default Landing -- Capsule Status)

**User goal at Z1:** "What is the state of each app? Anything I should check on?"

The current proposal (health, last deploy, active runs, latency p95, alerts, last artifact) has problems:

| Proposed Field  | Problem                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `last deploy`   | Only Agent Builder has a "publish" concept. Chat, CORE, ERP do not deploy.                                           |
| `latency p95`   | Only meaningful for HTTP API apps. CORE is Electron. ERP is mock data.                                               |
| `active runs`   | Chat has "conversations" not "runs." CORE has "sessions." Forcing "runs" onto all apps misrepresents their activity. |
| `last artifact` | Only Builder and Project Room produce artifacts.                                                                     |

**Recommendation: 5 universal capsule fields that flex per app.**

Each capsule displays exactly 5 data points. The field NAMES are universal; the field VALUES are app-specific:

| Field          | Meaning                             | Agent Builder                          | Tarva Chat                         | Project Room                    | TarvaCORE              | TarvaERP       |
| -------------- | ----------------------------------- | -------------------------------------- | ---------------------------------- | ------------------------------- | ---------------------- | -------------- |
| **Health**     | Current operational state           | App server + Supabase + Ollama         | App server + Supabase + providers  | App server + Supabase + Inngest | Process status         | App server     |
| **Pulse**      | Primary activity metric             | `3 runs active`                        | `8 conversations`                  | `5 executions queued`           | `1 session active`     | `-- idle`      |
| **Last Event** | Most recent significant event       | `Published agent "ux-designer" 4m ago` | `Message from @core-agent 12s ago` | `Run #284 completed 2m ago`     | `Session ended 1h ago` | `-- no events` |
| **Alerts**     | Active alert/warning count          | `0 alerts`                             | `1 warning`                        | `2 alerts`                      | `0 alerts`             | `0 alerts`     |
| **Freshness**  | Time since last meaningful activity | `4m ago`                               | `12s ago`                          | `2m ago`                        | `1h ago`               | `3d ago`       |

**Why this works:**

- Every app can report all 5 fields (even if some are "-- idle" or "-- no events")
- The operator scans the same positions on every capsule -- muscle memory develops
- App-specific detail comes from the VALUES, not the field structure
- Freshness is a stale-detection signal: if an app shows "3d ago" and you expected activity, that is a finding

**Field rendering rules:**

- Health: colored dot (green/amber/red/gray/dim) + state word
- Pulse: number + unit, monospace font
- Last Event: truncated to ~60 chars, full text on hover
- Alerts: number, red badge if > 0
- Freshness: relative time, amber if > 1h, red if > 24h (thresholds configurable)

---

### Z2: District (App-Focused -- 3-5 Stations)

**User goal at Z2:** "What can I do with this specific app from the Launch?"

The storyboard proposes uniform stations across all districts: Enter App / Ops / Runs / Alerts / Receipts.

**This should vary by app.** Reasons:

1. "Runs" is meaningless for TarvaChat (it has conversations, not runs)
2. "Receipts" as a per-district station duplicates the Evidence Ledger (NW district)
3. Uniform stations force empty or misleading content onto apps that lack certain concepts

**Station architecture: 2 universal + 2-3 app-specific.**

#### Universal Stations (every district)

| Station    | Purpose                   | Content                                                                                                  |
| ---------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Launch** | Open the actual app       | App name, version, URL/port, one-click launch button, last accessed time                                 |
| **Status** | Operational health detail | Connection indicators per dependency, key performance metrics, last health check, recent errors (last 3) |

#### Agent Builder District (West/SW)

| Station      | Content                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch       | Opens `localhost:3000`                                                                                                                         |
| Status       | Connections: Supabase (54521), Ollama (11434), Embedding Server (8100). Metrics: CLI process state, active subprocess count                    |
| **Pipeline** | Active generation run progress (step N of 18), recent runs table (last 5: run ID, agent name, status, duration). Actions: view run, cancel run |
| **Library**  | Agent count (41), recent publishes (last 5 with timestamps), skill maturity breakdown. Action: browse library                                  |

#### Tarva Chat District (East/SE)

| Station           | Content                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Launch            | Opens `localhost:4000`                                                                                                                      |
| Status            | Connections: Supabase (54331), Claude API, Ollama. Metrics: active SSE streams, MCP server health (17 servers across 3 tiers)               |
| **Conversations** | Active count, recent conversations (last 5: title, agent, messages, last activity), message throughput sparkline. Action: open conversation |
| **Agents**        | Loaded agent count, most-used agents (last 24h), skill activation count. Action: browse agents                                              |

#### Project Room District (South)

| Station        | Content                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Launch         | Opens `localhost:3005`                                                                                                                                 |
| Status         | Connections: Supabase (cloud), Inngest, Claude API. Metrics: queue depth, active workers, error rate                                                   |
| **Runs**       | Active executions with progress, queue depth, recent completions (last 5: project, agent, status, duration, token cost). Actions: view run, cancel run |
| **Artifacts**  | Recent artifacts (last 5: name, type, version, creator), dependency graph health (valid/invalid counts). Action: browse artifacts                      |
| **Governance** | Pending approval count, recent truth entries, phase gate status across active projects. Action: review pending                                         |

#### TarvaCORE District (NE)

| Station      | Content                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Launch       | Opens Electron app (or indicates "launch from Dock")                                                                   |
| Status       | Process detection: running/not running. If running: uptime, memory usage. If not: "Launch from system to start"        |
| **Sessions** | Recent reasoning sessions (if telemetry exists). Fallback: "No session telemetry available -- CORE runs independently" |

#### TarvaERP District (not currently in spatial map -- see note)

**Note:** The spatial model map shows 5 districts: Evidence Ledger (NW), TarvaCORE (NE), TarvaCODE (W/SW), TarvaChat (E/SE), and Tarva Project (S). The storyboard lists 5 capsules: Tarva Project, TarvaCORE, TarvaCODE, TarvaChat, TarvaAgentGen. There is inconsistency here:

- "TarvaCODE" in the spatial map seems to refer to the CODE repository (AI conversation knowledge management, planning stage)
- "TarvaAgentGen" in the storyboard seems to refer to Agent Builder
- TarvaERP is not explicitly placed in the spatial map

**Recommendation:** Resolve the capsule list before finalizing districts. Current assessment assumes the system overview's 5 primary apps: Agent Builder, Tarva Chat, Project Room, TarvaCORE, TarvaERP. "TarvaCODE" is in planning stage and should not have a full district until it has a running app.

---

### Z3: Station (Tight Functional Panel -- Actions)

**User goal at Z3:** "Let me see the detail and take an action."

Each station type renders as a compact panel with a consistent 3-zone layout:

```
+-------------------------------------------+
|  HEADER: Station name + parent context     |
+-------------------------------------------+
|  BODY: Data table / list / visualization   |
|  (scrollable, max 5-10 items visible)      |
|                                            |
+-------------------------------------------+
|  ACTIONS: 1-3 primary action buttons       |
+-------------------------------------------+
```

**Station content templates:**

**Launch station (all apps):**

- Header: `[App Icon] [App Name]`
- Body: App version, port/URL, last accessed, connection status
- Actions: `Open App` (primary), `Copy URL` (secondary)

**Status station (all apps):**

- Header: `[App Name] > Status`
- Body: Dependency connection list (each with green/amber/red dot + name + latency), performance metrics table, last 3 errors (if any) with timestamps
- Actions: `Refresh` (re-check now), `View Full Logs` (opens app)

**Pipeline station (Agent Builder):**

- Header: `Agent Builder > Pipeline`
- Body: If active run: progress bar (step N/18, current phase name, elapsed time, ETA). Below: recent runs table (ID, agent, status, duration, timestamp)
- Actions: `View Run Details`, `Cancel Run` (if active)

**Runs station (Project Room):**

- Header: `Project Room > Runs`
- Body: Active runs (project name, agent, progress, tokens used). Queue (waiting items with priority). Recent completions (last 5 with status badges)
- Actions: `View Run`, `Cancel Run`, `Open Project`

**Conversations station (Tarva Chat):**

- Header: `Tarva Chat > Conversations`
- Body: Active conversations sorted by last activity. Each row: conversation title (truncated), agent avatar + name, message count, last message preview, relative time
- Actions: `Open Conversation`, `New Conversation`

**Governance station (Project Room):**

- Header: `Project Room > Governance`
- Body: Pending approvals list (item, type, requested by, waiting since). Active phase gates (project, phase, criteria met / total). Recent truth entries (decision, source, timestamp)
- Actions: `Review Item`, `Open Project`

**Receipt ritual at Z3:** When a user takes any action at Z3 (clicks "Open App", "Cancel Run", etc.), a receipt stamp animates briefly at the bottom of the panel: `RECEIPT | [timestamp] | [action summary] | TRACE: [short ID]`. This receipt simultaneously appears in the Evidence Ledger timeline.

---

## 2. Taxonomy -- Stable Spine Object Mapping

### Assessment of Proposed Spine Objects

| Proposed Object | Cross-App?                                   | Apps That Have It                                                                                                  | Verdict                             |
| --------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| **Plan**        | No (2 of 5)                                  | Agent Builder (project), Project Room (project + phases)                                                           | Demote to optional. Not universal.  |
| **Run**         | Partial (3 of 5, but means different things) | Agent Builder (generation job), Project Room (agent execution), TarvaCORE (reasoning session)                      | Rename to avoid semantic collision. |
| **Approval**    | No (2 of 5)                                  | Agent Builder (3 human gates), Project Room (phase gates)                                                          | Demote to optional. Not universal.  |
| **Artifact**    | Partial (2-3 of 5)                           | Agent Builder (agent bundles), Project Room (tracked outputs). Chat (exported conversations) is a stretch.         | Keep, but define precisely.         |
| **Evidence**    | Launch-local                                 | No app calls its own data "evidence." This is the Launch's interpretive layer over app data.                       | Redefine as Launch-level concept.   |
| **Receipt**     | Launch-local                                 | No app has receipts. Launch generates these for its own audit trail.                                               | Keep as Launch-only.                |
| **Exception**   | Yes (4 of 5)                                 | Builder (pipeline failures), Chat (streaming/provider errors), Project Room (run failures), CORE (process crashes) | Keep. Genuinely cross-app.          |

### Revised Canonical Spine (5 objects)

| #   | Launch Object | Definition                                                             | Maps To In Each App                                                                                                                                                                        |
| --- | ------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Activity**  | Any discrete unit of work the system performed or is performing        | Builder: generation run. Chat: conversation. Project Room: agent execution. CORE: reasoning session. ERP: (none).                                                                          |
| 2   | **Artifact**  | Any durable output produced by an activity                             | Builder: agent bundle (.md + skills/ + references/). Project Room: tracked artifact (code, document, data) with version. Chat: exported conversation. CORE: reasoning output. ERP: (none). |
| 3   | **Exception** | Any error, failure, or anomaly that requires attention                 | Builder: pipeline stall/failure. Chat: provider error, MCP failure. Project Room: run failure, dependency invalidation. CORE: process crash. ERP: (none).                                  |
| 4   | **Receipt**   | An immutable record of a meaningful event, generated by the Launch     | Launch navigation events, user actions, app state changes observed by the Launch. NOT generated by apps -- generated by the Launch about apps.                                             |
| 5   | **Evidence**  | A curated, queryable collection of receipts and app-sourced audit data | The aggregation layer that combines Launch receipts + app audit logs (Builder's JSONL events, Project Room's provenance records, Chat's tool call logs) into a unified timeline.           |

### Demoted Objects (App-Specific, Not Spine)

| Object       | Where It Lives                                                              | Launch Treatment                                                                    |
| ------------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Plan**     | Agent Builder (project setup), Project Room (project + phase gates)         | Visible in app-specific stations (Pipeline, Governance), not in Launch-level spine. |
| **Approval** | Agent Builder (3 human gates), Project Room (phase gates, truth governance) | Visible in Governance station for Project Room. Not a Launch-level concept.         |

### Solving the "Run" Problem

"Run" means fundamentally different things across apps. Forcing a single word creates confusion.

**Solution: Launch-level supertype + app-level display names.**

```
Launch Supertype:  ACTIVITY
                   |
    +--------------+--------------+------------------+
    |              |              |                   |
 Generation    Execution    Conversation         Session
   Run            Run                           (reasoning)
    |              |              |                   |
 Agent Builder  Project Room  Tarva Chat         TarvaCORE
```

**Display rules:**

- In Constellation (Z0) and Launch Atrium (Z1): use "activities" as the generic term. "12 activities across 3 apps."
- In a specific District (Z2) or Station (Z3): use the app-specific term. "3 generation runs" in Agent Builder district. "5 conversations" in Chat district.
- In the Evidence Ledger: use "activity" with the app-specific subtype shown as a tag. `[Generation Run] Agent "ux-designer" completed in 4m 23s`
- In the Command Palette: support all terms as synonyms. Searching "runs" shows activities from Builder + Project Room. Searching "conversations" shows activities from Chat.

**Shared Activity schema (Launch-level):**

```typescript
interface LaunchActivity {
  id: string // UUID v7
  source_app: AppIdentifier // 'agent-builder' | 'tarva-chat' | 'project-room' | 'tarva-core' | 'tarva-erp'
  source_id: string // The ID of this item in the source app's database

  // Launch-level classification
  activity_type: 'generation_run' | 'agent_execution' | 'conversation' | 'reasoning_session'

  // Universal fields (every app can provide these)
  title: string // Human-readable: "Generate ux-designer agent" / "Chat with @research-agent"
  status: 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'
  started_at: string // ISO 8601
  ended_at: string | null

  // Optional universal fields
  duration_ms: number | null
  error_summary: string | null // If status is 'failed'

  // App-specific payload (opaque to Launch, rendered by app-specific station templates)
  detail: Record<string, unknown>
}
```

This schema lets the Launch aggregate, filter, and sort activities across all apps without understanding each app's internal data model.

---

## 3. Status Language -- Telemetry Vocabulary

### Health States (5-State Model)

| State           | Color     | Visual Treatment                | Meaning                                                                                                     | User Action                                               |
| --------------- | --------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **OPERATIONAL** | Green     | Pulsing dot (slow, calm)        | All health checks passing. All dependencies reachable. Performance within thresholds.                       | None required.                                            |
| **DEGRADED**    | Amber     | Steady dot (no pulse)           | App is responding but with reduced capability. One or more dependencies are slow, unreachable, or erroring. | Investigate: check Status station for details.            |
| **DOWN**        | Red       | Flashing dot (urgent)           | App should be running but is not responding to health checks. Previously known to be operational.           | Immediate: restart the app, check logs.                   |
| **OFFLINE**     | Dim/muted | No dot animation, muted capsule | App is not running, and this is expected. Either never started this session, or gracefully shut down.       | None required. Start the app if you need it.              |
| **UNKNOWN**     | Gray      | Dashed border around dot        | No telemetry connection established. Launch has never successfully contacted this app.                      | Configure: verify the app's health endpoint, check ports. |

### State Transition Rules

```
                    First successful
     UNKNOWN ──────health check────────> OPERATIONAL
       │                                      │
       │ (never contacted)                    │ (dependency fails OR
       │                                      │  error rate > 5% OR
       │                                      │  p95 > 2s)
       │                                      │
       │                                      v
       │                                  DEGRADED
       │                                      │
       │                                      │ (all checks restored)
       │                                      │────────> OPERATIONAL
       │                                      │
       │                                      │ (main health endpoint
       │                                      │  stops responding)
       │                                      v
       │                                    DOWN
       │                                      │
       │                                      │ (health endpoint responds)
       │                                      │────────> OPERATIONAL or DEGRADED
       │                                      │
       │                                      │ (user explicitly stops app
       │                                      │  or graceful shutdown detected)
       │                                      v
       └──────────────────────────────>   OFFLINE
                                              │
                                              │ (health endpoint responds)
                                              └────────> OPERATIONAL
```

**Key transition: OFFLINE vs DOWN.**

The Launch determines state based on contact history:

- **Never contacted** (no prior successful health check): state = OFFLINE. Assumption: app has not been started.
- **Previously contacted** (at least one prior successful health check) and now unresponsive: state = DOWN. Assumption: something went wrong.
- **Graceful shutdown signal** received (if the app sends one): state = OFFLINE regardless of history.

This means the Launch does NOT require user configuration to know which apps "should" be running. It learns from observation.

### DEGRADED Thresholds

An app transitions from OPERATIONAL to DEGRADED when ANY of these conditions are true:

| Condition              | Threshold                                           | Applies To                                  |
| ---------------------- | --------------------------------------------------- | ------------------------------------------- |
| Dependency unreachable | Any dependency health check fails                   | All apps                                    |
| Response time elevated | p95 latency > 2,000ms over 1-minute window          | HTTP API apps (Builder, Chat, Project Room) |
| Error rate elevated    | > 5% of requests returning 5xx over 1-minute window | HTTP API apps                               |
| Queue backlog          | Queue depth > 50 items or oldest item > 5 minutes   | Project Room (Inngest)                      |
| Provider unreachable   | Claude API or Ollama fails to respond               | Chat, Project Room                          |

### Apps Without Native Telemetry

| App           | Problem                                                          | Solution                                                                                                                                                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TarvaCORE** | Electron app, no HTTP API. Launch cannot poll a health endpoint. | Option A (recommended): Detect the Electron process via a lightweight process check (check if a process named "TarvaCORE" or similar is running). Report: OPERATIONAL if process found, OFFLINE if not. No DEGRADED state possible without deeper integration. Option B (future): CORE exposes a minimal health socket on a known port. |
| **TarvaERP**  | Mock data only. No health endpoint exists.                       | Add a minimal `GET /api/health` route to the ERP app that returns `{ status: "ok", modules: 5, pages: 52, data_mode: "mock" }`. Until then: state = UNKNOWN with note "No health endpoint configured."                                                                                                                                  |

### Health Check Protocol

The Launch polls each app on a configurable interval:

| Parameter          | Default                | Notes                                |
| ------------------ | ---------------------- | ------------------------------------ |
| Poll interval      | 15 seconds             | Configurable per app                 |
| Health endpoint    | `GET /api/health`      | Each app must expose this            |
| Timeout            | 5 seconds              | If no response, mark check as failed |
| Failure threshold  | 3 consecutive failures | Before transitioning to DOWN         |
| Recovery threshold | 1 successful check     | To transition back from DOWN         |

**Health endpoint contract** (what each app should return):

```json
{
  "status": "ok" | "degraded" | "error",
  "version": "1.2.3",
  "uptime_ms": 123456,
  "dependencies": {
    "supabase": { "status": "ok", "latency_ms": 12 },
    "ollama": { "status": "ok", "latency_ms": 45 },
    "claude_api": { "status": "error", "error": "Rate limited" }
  },
  "metrics": {
    "active_connections": 3,
    "requests_per_minute": 42,
    "error_rate_percent": 0.5
  }
}
```

The Launch interprets this response to determine its own health classification for the app.

---

## 4. Navigation Labeling in a Spatial Interface

### District Label Visibility by Zoom Level

| Zoom Level           | Label Format                                                                                                             | Visibility                                | Interaction                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------- |
| **Z0 Constellation** | Icon + 2-letter code (`AB`, `CH`, `PR`, `CO`, `ER`)                                                                      | Always visible on beacons                 | Click: zoom to Z1, centered on that district |
| **Z1 Launch Atrium** | Full name on capsule ("Agent Builder", "Tarva Chat", etc.)                                                               | Always visible, never hidden behind hover | Click: select capsule, morph to Z2           |
| **Z2 District**      | Selected district: large name in header. Stations: full names always visible. Other districts: dimmed names in periphery | All visible without interaction           | Click station: zoom to Z3                    |
| **Z3 Station**       | Station name as panel header. District name in breadcrumb                                                                | Visible in panel chrome                   | Breadcrumb click: zoom back to Z2 or Z1      |

**Non-negotiable:** District labels at Z1 must NEVER be hover-only. Z1 is the default landing view. Users must be able to scan all 5 capsule names without moving their cursor. Hover-to-reveal labels create "mystery meat navigation" -- a well-documented findability anti-pattern (Nielsen Norman Group, 2017).

### District Label Names (Canonical)

| Spatial Position | District Label  | Short Code | Why This Name                                                                                                                                                              |
| ---------------- | --------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Center           | Launch Atrium   | HB         | "Launch" is the product name. "Atrium" is the spatial metaphor (entry hall).                                                                                               |
| North            | Constellation   | --         | Cross-cutting overview. Not an app. Named for the zoomed-out metaphor.                                                                                                     |
| NW               | Evidence Ledger | EL         | "Evidence" is the spine concept. "Ledger" communicates "immutable record of events."                                                                                       |
| NE               | TarvaCORE       | CO         | Matches the app name. Users already know this name.                                                                                                                        |
| West/SW          | Agent Builder   | AB         | "Agent Builder" is the canonical name from the system overview. NOT "TarvaAgentGen" (storyboard) or "TarvaCODE" (spatial map). This naming inconsistency must be resolved. |
| East/SE          | Tarva Chat      | CH         | Matches the app name.                                                                                                                                                      |
| South            | Project Room    | PR         | "Project Room" is the canonical name. NOT "Tarva Project" (spatial map).                                                                                                   |

**Naming inconsistency flagged:** The storyboard uses "TarvaAgentGen" and the spatial map uses "TarvaCODE" for what the system overview calls "Agent Builder" (the `tarva-claude-agents-frontend` repo). The Launch should use a SINGLE canonical name per app. Recommendation: use the names from the system overview (Agent Builder, Tarva Chat, Project Room, TarvaCORE, TarvaERP) because those match the actual repository names and existing documentation.

### Breadcrumb Strategy

**Recommendation: Semantic breadcrumb with a spatial compass hint.**

Format:

```
[Home icon] > [App icon] App Name > Station Name > Item Identifier
```

Examples:

```
[Launch icon]  >  [AB icon] Agent Builder  >  Pipeline  >  Run #47
[Launch icon]  >  [PR icon] Project Room   >  Governance  >  Phase Gate: "API Integration"
[Launch icon]  >  [EL icon] Evidence Ledger  >  Filtered: Last 24h + Errors
```

**Why semantic, not spatial:**

- Users think "I'm looking at the Agent Builder pipeline" -- not "I'm at coordinates (-200, -150) on the canvas."
- Spatial coordinates are meaningless without the map memorized. Semantic labels are meaningful immediately.
- The minimap already provides spatial context. The breadcrumb should not duplicate it.

**Spatial affordance:** A tiny compass arrow (N/NE/E/SE/S/SW/W/NW) appears next to each breadcrumb segment, indicating its direction from Launch center. This is ambient, not primary. It helps users build a mental map over time without replacing the readable labels.

**Interaction:**

- Each breadcrumb segment is clickable
- Clicking a segment animates the camera to that zoom level/location
- The breadcrumb updates smoothly as the user pans/zooms (no jumps)

### Command Palette Design

The command palette (triggered by `Cmd+K`) is the primary keyboard navigation tool. In a ZUI without traditional menus, this is critical for power users.

**Entry naming convention:** `[Verb] [Object] [in Context]`

**Navigation commands:**

| Command               | Synonyms                              | Action                                            |
| --------------------- | ------------------------------------- | ------------------------------------------------- |
| Go to Launch          | home, center, atrium                  | Pan + zoom to Z1 Launch Atrium                    |
| Go to Agent Builder   | builder, agentgen, AB                 | Pan + zoom to Z1 focused on Agent Builder capsule |
| Go to Tarva Chat      | chat, CH                              | Pan + zoom to Z1 focused on Chat capsule          |
| Go to Project Room    | projects, PR                          | Pan + zoom to Z1 focused on Project Room capsule  |
| Go to TarvaCORE       | core, reasoning, CO                   | Pan + zoom to Z1 focused on CORE capsule          |
| Go to TarvaERP        | erp, manufacturing, ER                | Pan + zoom to Z1 focused on ERP capsule           |
| Go to Constellation   | overview, sky, dashboard              | Pan + zoom to Z0                                  |
| Go to Evidence Ledger | receipts, audit, evidence, ledger, EL | Pan + zoom to Evidence Ledger district            |

**View commands:**

| Command              | Synonyms                     | Action                                         |
| -------------------- | ---------------------------- | ---------------------------------------------- |
| Show status of [app] | health, ops                  | Zoom to Z3 Status station of specified app     |
| Show active runs     | activities, jobs, executions | Zoom to relevant station showing active work   |
| Show alerts          | warnings, errors, problems   | Zoom to Constellation with alert filter active |
| Show recent receipts | audit trail, recent events   | Zoom to Evidence Ledger, filtered to last 1h   |

**Action commands:**

| Command               | Action                              |
| --------------------- | ----------------------------------- |
| Open Agent Builder    | Launch the app in a new browser tab |
| Open Tarva Chat       | Launch the app in a new browser tab |
| Open Project Room     | Launch the app in a new browser tab |
| Refresh health checks | Re-poll all apps immediately        |

**Synonym ring (for fuzzy matching):**

```yaml
agent_builder:
  canonical: 'Agent Builder'
  synonyms: [builder, agentgen, agent gen, agent builder, AB]

tarva_chat:
  canonical: 'Tarva Chat'
  synonyms: [chat, tarva chat, CH]

project_room:
  canonical: 'Project Room'
  synonyms: [projects, project room, tarva project, PR]

tarva_core:
  canonical: 'TarvaCORE'
  synonyms: [core, tarva core, reasoning, CO]

tarva_erp:
  canonical: 'TarvaERP'
  synonyms: [erp, tarva erp, manufacturing, warehouse, ER]

evidence_ledger:
  canonical: 'Evidence Ledger'
  synonyms: [evidence, ledger, receipts, audit, audit trail, EL]

constellation:
  canonical: 'Constellation'
  synonyms: [overview, dashboard, sky, constellation, global]

health:
  canonical: 'Status'
  synonyms: [health, status, ops, operations, diagnostics]

activity:
  canonical: 'Activity'
  synonyms:
    [
      run,
      runs,
      job,
      jobs,
      execution,
      executions,
      conversation,
      conversations,
      session,
      sessions,
      work,
    ]

alert:
  canonical: 'Alert'
  synonyms: [alert, alerts, warning, warnings, error, errors, problem, problems, issue, issues]
```

---

## 5. Evidence Ledger Structure

### Organizational Principle

**Primary axis: Chronological timeline (reverse-chronological, most recent first).**
**Filtering: Faceted, with 4 facet dimensions.**

Rationale for time-first:

- Audit trails are fundamentally temporal. "What happened?" implies "when?"
- Organizing by app first (Agent Builder receipts / Chat receipts / etc.) mirrors the Launch's spatial layout -- but users already have that via the district views. The Evidence Ledger's value is the CROSS-APP view you cannot get anywhere else.
- Organizing by action type first (all navigations / all errors / etc.) loses temporal context -- you cannot see "first this happened, then this happened."

A filterable timeline gives the operator all three views:

1. Default: everything, newest first ("show me the full story")
2. Filtered by app: "show me just what happened in Project Room"
3. Filtered by type: "show me just the errors"

### Facet Specification

| Facet          | Values                                                               | Type          | Default      | Purpose                          |
| -------------- | -------------------------------------------------------------------- | ------------- | ------------ | -------------------------------- |
| **Source**     | Launch, Agent Builder, Tarva Chat, Project Room, TarvaCORE, TarvaERP | Multi-select  | All selected | Which app(s) generated the event |
| **Type**       | Navigation, Action, Error, Approval, System                          | Multi-select  | All selected | What kind of event               |
| **Severity**   | Info, Warning, Error, Critical                                       | Multi-select  | All selected | How urgent                       |
| **Time Range** | Last 1h, Last 24h, Last 7d, Last 30d, Custom                         | Single-select | Last 24h     | Time window                      |

### Launch Receipts vs App Events

| Attribute        | Launch Receipt                                                                                             | App Event                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Generated by** | The Launch itself (client-side)                                                                            | An app, reported to the Launch via polling or push                                                                      |
| **Examples**     | "User navigated to Agent Builder district", "User opened command palette", "User filtered Evidence Ledger" | "Agent Builder: Run #47 completed", "Chat: Provider error (Claude API rate limited)", "Project Room: Phase gate passed" |
| **Source field** | `source: "hub"`                                                                                            | `source: "agent-builder"` (etc.)                                                                                        |
| **Trigger**      | User interaction with the Launch UI                                                                        | App state change detected by Launch health polling, or app pushes event to Launch                                       |
| **Detail level** | Captures zoom level, district, station, action taken                                                       | Captures app-specific payload (run ID, error message, artifact name, etc.)                                              |

### Correlation Model

When a user action in the Launch causes something to happen in an app, both events share a `correlation_id`:

```
TIMELINE:
  14:32:05  [Launch]           User clicked "Open Latest Run" in Agent Builder > Pipeline
            correlation_id: evt_abc123

  14:32:05  [Agent Builder] GET /api/projects/ux-designer/runs/47 -- 200 OK
            correlation_id: evt_abc123

  14:32:06  [Launch]           Run #47 details rendered in Pipeline station
            correlation_id: evt_abc123
```

This lets the Evidence Ledger show causal chains: "User did X in Launch -> App reported Y -> Launch displayed Z."

For events with no Launch trigger (e.g., an app error that occurs during a background job), the `correlation_id` is null. These are "ambient" events -- things the Launch observed without the user causing them.

### Minimum Viable Receipt Schema

```typescript
interface LaunchReceipt {
  // Identity
  id: string // UUID v7 (time-sortable)
  correlation_id: string | null // Links related events across Launch + apps

  // Source
  source: 'hub' | 'agent-builder' | 'tarva-chat' | 'project-room' | 'tarva-core' | 'tarva-erp'

  // Classification
  event_type:
    | 'navigation' // User moved to a location in the Launch
    | 'action' // User or system performed an operation
    | 'error' // Something failed
    | 'approval' // A gate was passed or rejected
    | 'system' // Health state change, startup, shutdown

  severity:
    | 'info' // Normal operation
    | 'warning' // Attention suggested
    | 'error' // Something failed, intervention likely needed
    | 'critical' // System-level failure, immediate attention

  // Content
  summary: string // Human-readable, max 120 chars
  // e.g., "Opened Agent Builder > Pipeline station"
  // e.g., "Run #47 completed successfully (4m 23s)"

  detail: Record<string, unknown> | null // Structured payload, app-specific
  // e.g., { run_id: 47, agent: "ux-designer",
  //         duration_ms: 263000, status: "completed" }

  // Spatial Context (where in the Launch this happened)
  location: {
    zoom_level: 0 | 1 | 2 | 3
    district: string | null // "agent-builder", "tarva-chat", etc.
    station: string | null // "status", "pipeline", "runs", etc.
  }

  // Time
  timestamp: string // ISO 8601 with milliseconds
  duration_ms: number | null // For events that have a duration
}
```

**Schema notes:**

- 12 fields total. This is the minimum that supports all facets, correlations, and display requirements.
- `id` uses UUID v7 for time-sortability (no need for a separate sort index).
- `summary` is always human-readable and renderable without parsing `detail`.
- `detail` is an opaque JSON blob for app-specific data. The Ledger renders it as a collapsible "raw details" section.
- `location` captures WHERE in the Launch the event originated. This enables questions like "What happened while I was in the Project Room district?"

### Evidence Ledger UI at Z2 and Z3

**Z2 (Evidence Ledger district, viewed from a distance):**

- Shows: timeline strip with event density visualization (sparkline or heatmap)
- Shows: top-level stats (total events today, error count, most active app)
- Shows: 3 most recent events as preview cards

**Z3 (Evidence Ledger station, zoomed in):**

- Full reverse-chronological timeline
- Each event rendered as a compact card:
  ```
  [severity icon] [timestamp] [source badge] Summary text
  > [expandable detail section]
  ```
- Facet filter bar at top (Source, Type, Severity, Time Range)
- Search bar for full-text search across summaries
- Correlation grouping: events with the same `correlation_id` are visually grouped with a connecting line

### Storage Recommendation

The Launch needs its own database for receipts. These must NOT be stored in any app's existing database (separation of concerns -- the audit trail must persist even if an app's database is reset).

**Recommendation:** A dedicated Supabase instance (offset ports to avoid conflicts) with a single `launch_receipts` table. Alternatively, SQLite on the filesystem for maximum simplicity (single file, no Docker dependency, trivially backed up).

For a single-user localhost tool, SQLite is likely the better choice: zero configuration, no port management, and the receipt table will stay small (even heavy usage produces maybe 1,000 receipts/day).

---

## 6. Cross-Cutting Concerns and Open Questions

### Constellation Overview District (North)

The Constellation Overview is NOT an app -- it is a cross-cutting dashboard. Its content at Z2 should be:

| Station           | Content                                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **System Health** | All 5 app health states in a single view. Health history timeline (state changes over last 24h).                                 |
| **Alert Feed**    | Merged alert stream from all apps, sorted by severity then time. Actionable: click to navigate to the relevant district/station. |
| **Activity Feed** | Aggregated activity sparklines per app. Total throughput numbers.                                                                |

The Constellation is the Launch equivalent of a "home dashboard" -- it provides the same data as Z0 metrics but with more detail, and it is the natural place to land after zooming in from Z0.

### Telemetry Acquisition Architecture

This assessment identifies WHAT data the Launch displays but flags HOW it gets that data as a critical architecture decision:

| App           | Telemetry Method                                         | Status                |
| ------------- | -------------------------------------------------------- | --------------------- |
| Agent Builder | Poll `GET /api/health` on `:3000`                        | Requires new endpoint |
| Tarva Chat    | Poll `GET /api/health` on `:4000`                        | Requires new endpoint |
| Project Room  | Poll `GET /api/health` on `:3005`                        | Requires new endpoint |
| TarvaCORE     | Process detection (check if Electron process is running) | No HTTP API available |
| TarvaERP      | Poll `GET /api/health` on its port                       | Requires new endpoint |

**Each web app needs a standardized `/api/health` endpoint** that returns the contract defined in Section 3. This is a prerequisite for the Launch's health monitoring system.

For richer data (recent runs, conversations, artifacts), the Launch will need to call app-specific API routes. The existing API surfaces are sufficient:

- Agent Builder: 28 API routes (projects, runs, library)
- Tarva Chat: 20+ API routes (conversations, agents)
- Project Room: 40+ API routes (runs, artifacts, governance)

### Naming Inconsistency (Must Resolve)

The following naming conflicts exist across documents:

| Term in Storyboard | Term in Spatial Map | Term in System Overview | Resolution Needed         |
| ------------------ | ------------------- | ----------------------- | ------------------------- |
| TarvaAgentGen      | TarvaCODE           | Agent Builder           | Pick one canonical name   |
| Tarva Project      | Tarva Project       | Project Room            | Pick one canonical name   |
| --                 | CORE District       | TarvaCORE               | Consistent ("TarvaCORE")  |
| --                 | CHAT District       | Tarva Chat              | Consistent ("Tarva Chat") |

**Recommendation:** Use the system overview names (Agent Builder, Tarva Chat, Project Room, TarvaCORE, TarvaERP) as canonical. Update the storyboard and spatial map to match. "TarvaCODE" (the tarvaCODE repo) is a separate product in planning stage and should not be conflated with Agent Builder.

### Open Questions for Stakeholder

| #   | Question                                                               | Context                                                                                                                           | Impact                                                 |
| --- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | Which 5 apps are in the Launch capsule ring?                           | Storyboard lists: Tarva Project, TarvaCORE, TarvaCODE, TarvaChat, TarvaAgentGen. System overview has 6 apps. Some names conflict. | Determines district layout and station design.         |
| 2   | Should TarvaERP be a full district or a placeholder capsule?           | ERP has mock data only and no telemetry. A full district with active stations may feel empty.                                     | Determines ERP's Z2 content.                           |
| 3   | Is "TarvaCODE" (the repo at planning stage) included in the Launch?    | If so, it needs a district. If not, it is excluded until it has a running app.                                                    | Determines whether the Launch has 5 or 6 capsules.     |
| 4   | Where does the Launch store its own data (receipts, cached telemetry)? | SQLite (simplest, no dependencies) vs. Supabase instance (consistent with ecosystem).                                             | Determines data layer architecture.                    |
| 5   | Should TarvaCORE expose a health socket for richer telemetry?          | Currently Electron-only with no HTTP API. Launch can only detect "process running" without it.                                    | Determines CORE's maximum possible status granularity. |

---

## 7. Validation Plan

This assessment should be validated before implementation:

| Method                       | What It Validates                                                                                       | How to Execute                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Card sort (open)**         | Whether the 5 spine objects (Activity, Artifact, Exception, Receipt, Evidence) match user mental models | 5-8 internal team members sort 30 sample events into groups. Compare resulting groups to the proposed taxonomy.                                             |
| **Tree test**                | Whether users can find information at each zoom level                                                   | Define 10 findability tasks (e.g., "Where would you find the status of Tarva Chat?"). Test against the proposed Z0-Z3 hierarchy. Target: >70% success rate. |
| **Label comprehension test** | Whether status state names (OPERATIONAL, DEGRADED, DOWN, OFFLINE, UNKNOWN) communicate their meaning    | Present each label without context. Ask participants what they think it means. Target: >90% correct interpretation.                                         |
| **First-click test**         | Whether district labels and station names guide users to the right place                                | Show mockup of Z1 Launch Atrium. Ask "Where would you click to check if Agent Builder is having problems?" Target: >80% correct first click.                |

---

_End of IA Discovery Assessment_
