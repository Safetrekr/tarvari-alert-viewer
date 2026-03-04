# Agent Roster — Tarva Launch

## Phase 0: Tech Spike & Setup

| WS     | Title               | Agent                   |
| ------ | ------------------- | ----------------------- |
| WS-0.1 | Project Scaffolding | react-developer         |
| WS-0.2 | Design Tokens Setup | world-class-ui-designer |
| WS-0.3 | ZUI Tech Spike      | react-developer         |

## Phase 1: Spatial Core + Login

| WS     | Title                  | Agent                            |
| ------ | ---------------------- | -------------------------------- |
| WS-1.1 | ZUI Engine             | react-developer                  |
| WS-1.2 | Launch Atrium          | world-class-ui-designer          |
| WS-1.3 | Login Experience       | world-class-ui-designer          |
| WS-1.4 | Navigation Instruments | react-developer                  |
| WS-1.5 | Telemetry Aggregator   | world-class-backend-api-engineer |
| WS-1.6 | Ambient Effects Layer  | world-class-ui-designer          |
| WS-1.7 | Core Interfaces        | chief-technology-architect       |

## Phase 2: Districts + Stations + Morph

| WS     | Title                             | Agent                   |
| ------ | --------------------------------- | ----------------------- |
| WS-2.1 | Morph Choreography                | react-developer         |
| WS-2.2 | District Content: Agent Builder   | react-developer         |
| WS-2.3 | District Content: Project Room    | react-developer         |
| WS-2.4 | District Content: Tarva Chat      | react-developer         |
| WS-2.5 | District Content: TarvaCORE + ERP | react-developer         |
| WS-2.6 | Station Panel Framework           | world-class-ui-designer |
| WS-2.7 | Constellation View (Z0)           | react-developer         |

## Phase 3: Receipts + Command Palette + AI

| WS     | Title                      | Agent                                      |
| ------ | -------------------------- | ------------------------------------------ |
| WS-3.1 | Receipt System             | world-class-backend-api-engineer           |
| WS-3.2 | Evidence Ledger            | react-developer                            |
| WS-3.3 | Command Palette            | react-developer                            |
| WS-3.4 | AI Camera Director         | world-class-autonomous-interface-architect |
| WS-3.5 | Station Template Selection | world-class-autonomous-interface-architect |
| WS-3.6 | Narrated Telemetry         | world-class-autonomous-interface-architect |
| WS-3.7 | Attention Choreography     | world-class-ui-designer                    |

## Phase 4: Advanced AI + Polish (Stretch)

| WS     | Title                  | Agent                                      |
| ------ | ---------------------- | ------------------------------------------ |
| WS-4.1 | Claude API Integration | world-class-backend-api-engineer           |
| WS-4.2 | Exception Triage       | world-class-autonomous-interface-architect |
| WS-4.3 | Builder Mode           | world-class-autonomous-interface-architect |
| WS-4.4 | Visual Polish Pass     | world-class-ui-designer                    |

---

## Standing Pipeline Roles

These agents are present on every project roster. They do not own workstreams but have mandatory touchpoints throughout the pipeline lifecycle.

### software-product-owner

| Phase                       | Touchpoint             | Responsibility                                                                     |
| --------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| Discovery Phase 4           | Mandatory consultation | Validate priorities, scope boundaries, acceptance criteria quality, user value map |
| Planning (each phase)       | Synthesis team member  | Requirements coverage, product logic completeness, acceptance criteria review      |
| Execution (each phase gate) | Phase gate reviewer    | Verify deliverables meet product intent, flag user-facing gaps                     |
| Execution (deviations)      | On-demand              | Consulted when deviations affect user-facing behavior or acceptance criteria       |

### enterprise-software-project-manager-controller-pmo

| Phase                     | Touchpoint               | Responsibility                                                                                                            |
| ------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Discovery Phase 4         | Recommended consultation | Sequencing realism, resource loading, effort estimates, cross-scope dependencies                                          |
| Planning (each phase)     | Synthesis team member    | Effort & sequencing assessment, resource conflicts, parallel opportunities, bottleneck analysis                           |
| Planning (MASTER-PLAN.md) | Leads sections 3-5, 9    | Cross-phase dependency chain, implementation sequence, effort summary, pre-implementation checklist                       |
| Execution                 | Escalation path          | Invoked when: 3+ moderate deviations accumulate, resource conflicts arise, phase delays, cross-phase renegotiation needed |

### every-time

| Phase                       | Touchpoint               | Responsibility                                                                      |
| --------------------------- | ------------------------ | ----------------------------------------------------------------------------------- |
| Discovery Phases 1, 3, 4, 7 | Quality gates            | Intent analysis, state assessment validation, decision validation, final validation |
| Planning (each phase)       | Phase reviewer           | SOW completeness, codebase grounding, cross-phase consistency                       |
| Planning (final)            | Final validation         | FINAL-VALIDATION-REPORT.md                                                          |
| Execution (each WS)         | Pre-flight / post-flight | Verify dependencies met, acceptance criteria passed                                 |
| Execution (each phase gate) | Phase validation         | Cross-workstream integration, exit criteria                                         |

---

## Optional Supporting Agents

| Agent                                 | When to Invoke                                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| information-architect                 | When station content taxonomy or navigation labeling needs revision; when adding new districts or spine objects                               |
| world-class-ux-designer               | When interaction patterns produce user confusion; when morph choreography or receipt ritual UX needs redesign                                 |
| database-architect                    | When Supabase schema for receipts needs optimization or migration strategy                                                                    |
| quality-engineering-lead              | When establishing test strategy for spatial engine (visual regression, interaction testing)                                                   |
| devops-platform-engineer              | When build performance degrades or deployment pipeline is needed                                                                              |
| world-class-appsec-security-architect | When auth mechanism is upgraded beyond simple passphrase                                                                                      |
| software-tech-writer                  | Planning phase synthesis team member (clarity, consistency, documentation quality); when SOW or specification documents need editorial review |

---

## Workstream Summary

| Agent                                      | Work Areas                                                                                     | Primary Domain                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| react-developer                            | WS-0.1, WS-0.3, WS-1.1, WS-1.4, WS-2.1, WS-2.2, WS-2.3, WS-2.4, WS-2.5, WS-2.7, WS-3.2, WS-3.3 | Spatial engine, camera mechanics, district components, React implementation               |
| world-class-ui-designer                    | WS-0.2, WS-1.2, WS-1.3, WS-1.6, WS-2.6, WS-3.7, WS-4.4                                         | Design tokens, capsule styling, login UX, ambient effects, visual polish                  |
| world-class-backend-api-engineer           | WS-1.5, WS-3.1, WS-4.1                                                                         | Telemetry aggregator, receipt storage, AI provider integration                            |
| world-class-autonomous-interface-architect | WS-3.4, WS-3.5, WS-3.6, WS-4.2, WS-4.3                                                         | AI Camera Director, station selection, narrated telemetry, exception triage, builder mode |
| chief-technology-architect                 | WS-1.7                                                                                         | Core interface definitions (CameraController, SystemStateProvider, ReceiptStore, etc.)    |
