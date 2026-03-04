# Discovery Log — Tarva Launch

> **Started:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Current Phase:** 7. Validate & Synthesize
> **Discovery Depth:** DEEP

## Phase Status

| Phase                        | Status   | Key Findings                                                             |
| ---------------------------- | -------- | ------------------------------------------------------------------------ |
| 1. Understand Intent         | COMPLETE | 36 stated goals, 10 implicit goals, 4 critical ambiguities; scope = DEEP |
| 2. Explore Codebase          | SKIPPED  | Greenfield project                                                       |
| 3. Assess Current State      | SKIPPED  | Greenfield project                                                       |
| 4. Identify Gaps & Decisions | COMPLETE | 8 critical gaps resolved, 9 architecture decisions, 10 risks registered  |
| 5. Decompose into Work Areas | COMPLETE | 5 phases (0-4), 24 work areas                                            |
| 6. Select Agents             | COMPLETE | 5 primary agents across 24 work areas + 3 standing roles                 |
| 7. Validate & Synthesize     | COMPLETE | 3 deliverables produced; validation PASS (5 conditions fixed)            |

## Key Findings (running log)

### Phase 1

- 36 stated goals extracted from 6 input signals
- 10 implicit goals identified (performance budget, accessibility, keyboard-first, quiet mode, etc.)
- 4 critical ambiguities: spatial engine choice, spine object definitions, app naming inconsistencies, AI feature phasing
- Scope calibrated as DEEP: 10+ features, 4+ domains (spatial engine, visual design, telemetry, AI)

### Phase 4

- **Spatial engine**: CSS Transforms chosen over R3F hybrid (simpler, sufficient for the aesthetic)
- **Spine objects**: Revised from 7 to 5 (Activity, Artifact, Exception, Receipt, Evidence); "Run" collision resolved via "Activity" supertype
- **Status model**: Expanded from 4 to 5 states (added OFFLINE vs DOWN distinction)
- **App naming**: Canonical names from TARVA-SYSTEM-OVERVIEW.md
- **Launch storage**: Supabase (shared instance, consistent with Tarva ecosystem)
- **Capsule fields**: Revised from 6 to 5 universal fields that flex per app
- **AI routing**: Three-layer (pattern matching → rule engines → LLM) with Ollama primary, Claude optional

### Phase 5

- 5 phases decomposed: Phase 0 (1 week spike), Phase 1 (5-6 weeks core), Phase 2 (4-5 weeks districts), Phase 3 (4-5 weeks AI), Phase 4 (2-3 weeks stretch)
- Total estimated timeline: ~16-20 weeks solo developer
- MVP = Phase 0 + Phase 1 (demo-able in ~6-7 weeks)

### Phase 6

- 5 primary agents: react-developer (12 WS), world-class-ui-designer (7 WS), world-class-backend-api-engineer (3 WS), world-class-autonomous-interface-architect (5 WS), chief-technology-architect (1 WS)
- 3 standing roles: software-product-owner, enterprise-software-project-manager-controller-pmo, every-time

## Unresolved Questions

1. Should TarvaERP be a full capsule or dimmed placeholder? (Before Phase 1)
2. Is tarvaCODE (planning-stage) intended for the Launch? (Before Phase 1)
3. Passphrase: per-install env var or hardcoded? (Before Phase 1)
4. Priority order for district content in Phase 2? (Before Phase 2)
5. Should existing apps add `/api/health` endpoints? (Before Phase 1 telemetry)

## Specialist Consultations

| Agent                                              | Question                                                   | Response Summary                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| every-time                                         | Phase 1 intent analysis                                    | 36 goals, 10 implicit, 4 ambiguities, DEEP scope                                                                                                         |
| chief-technology-architect                         | Spatial engine evaluation                                  | Recommended R3F + DOM hybrid (Option A); CSS transforms viable as Option C                                                                               |
| world-class-ux-designer                            | Navigation, interaction, receipt UX                        | 5-layer orientation, selection-triggered zoom, mutations-only receipts, single passphrase field                                                          |
| software-product-owner                             | MVP scope, priorities, effort                              | 8-12 weeks (3 devs), ZUI + login + 2-app telemetry first, AI deferred to Phase 2, flagged scope traps                                                    |
| enterprise-software-project-manager-controller-pmo | Sequencing, timeline, resource loading                     | 16-22 weeks solo, 10-14 weeks 2 devs, 1 week pre-implementation critical, 7 forward-looking interfaces                                                   |
| information-architect                              | Taxonomy, status language, info hierarchy, Evidence Ledger | Revised 5-object spine, 5-state status model, semantic breadcrumbs, chronological Evidence Ledger, naming flag                                           |
| react-developer                                    | CSS transforms ZUI architecture                            | Complete implementation plan: camera store, spatial math, zoom-to-cursor, momentum, semantic zoom, 3-tier animation, telemetry polling, file structure   |
| world-class-autonomous-interface-architect         | Disposable UI, Camera Director, receipts, AI routing       | Stable spine vs disposable pixels governance, CameraDirective schema, station template registry, 12-field receipt schema, feature-based AI routing table |
| world-class-ui-designer                            | Color system, capsule design, typography, effects, tokens  | ~89 design tokens, ember/teal dual-accent system (from @tarva/ui), glass material spec, capsule dimensions, Geist fonts, living details spec             |
