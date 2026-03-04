# Project Planning Prompt — Tarva Launch

> This is the SECOND step in a three-prompt workflow:
>
> 1. **Discovery** — Explore, assess, decompose, recommend (COMPLETE)
> 2. **Planning** (this prompt) — Turn recommendations into Phase/Workstream/SOW structure
> 3. **Execution** — Implement every workstream in the plan
>
> Discovery deliverables are in `docs/plans/initial-plan/`.

---

```
I need you to run a multi-phase, multi-agent project planning pipeline.
You will take a set of Combined Recommendations and an Agent Roster, then
produce a complete set of Statements of Work (SOWs) organized by phase
and workstream, with synthesis and review at every gate.

Read these instructions fully before taking any action.

────────────────────────────────────────────────────────────────────────────────
1. INPUTS
────────────────────────────────────────────────────────────────────────────────

Project Name:              Tarva Launch
Plans Output Path:         docs/plans/initial-plan/
Combined Recommendations:  docs/plans/initial-plan/combined-recommendations.md
Agent Roster:              docs/plans/initial-plan/agent-roster.md

ADDITIONAL DISCOVERY ARTIFACTS (read alongside combined-recommendations):
  - docs/plans/initial-plan/tech-decisions.md
    (Full tech stack choices: spatial engine, animation, UI layer,
    data/telemetry, AI integration, auth, dependency list)
  - docs/plans/initial-plan/VISUAL-DESIGN-SPEC.md
    (~89 design tokens, ember/teal dual-accent from @tarva/ui, capsule
    dimensions, glass/glow recipes, ambient effects, CSS implementations)
  - docs/plans/initial-plan/DISCOVERY-LOG.md
    (Discovery phase tracker with specialist consultation log)
  - docs/plans/initial-plan/ia-discovery-assessment.md
    (Information Architect assessment: spine objects, status model, taxonomy)

REFERENCE CODEBASES (read-only, for grounding SOWs in ecosystem patterns):
  - /Users/jessetms/Sites/tarva-ui-library
    (@tarva/ui component library — tokens, components, ThemeProvider)
  - /Users/jessetms/Sites/tarva-claude-agents-frontend
    (Agent Builder web UI — Next.js 16 reference architecture)
  - /Users/jessetms/Sites/tarva-org/tarva-launch
    (This repo — planning artifacts and future Launch codebase)

GREENFIELD NOTE: Tarva Launch has no existing codebase. SOWs will specify
files, types, and patterns to CREATE. Reference the ecosystem repos above
for Next.js 16 / @tarva/ui / Zustand / TanStack Query patterns to ensure
consistency. The Launch will be built inside this repo (tarva-launch).

The Combined Recommendations file contains the decisions, architecture
choices, detailed requirements, constraints, risk register, and phase
decomposition for this project. It is the primary source of truth for
WHAT to build.

The Agent Roster file contains a phase-by-phase table mapping workstreams
to assigned agents, plus standing pipeline roles. It uses this format:

    ## Phase X: Phase Title
    | WS   | Title              | Agent                         |
    |------|--------------------|-------------------------------|
    | WS-X.1 | Workstream Title | agent-slug                    |
    | WS-X.2 | Workstream Title | agent-slug                    |

    ## Standing Pipeline Roles
    (software-product-owner, enterprise-software-project-manager-controller-pmo,
     every-time — with touchpoint tables per pipeline phase)

Phases are numbered 0-4. All agents are pre-assigned (no TBDs).

INPUT VALIDATION (before proceeding):
  Verify combined-recommendations.md contains these sections:
    - Context
    - Critical Gap Resolutions (8 gaps resolved)
    - Architecture Decisions (AD-1 through AD-9)
    - Phase Decomposition (Phase 0-4 with work areas)
    - Risk Register (12 risks)
  Verify agent-roster.md has a table for each phase (0-4) with WS IDs
    and agents, totaling 28 workstreams.
  Verify agent-roster.md has a "Standing Pipeline Roles" section with
    touchpoint tables for software-product-owner, PMO, and every-time.
  If any section is missing, report to the user and ask for guidance.

────────────────────────────────────────────────────────────────────────────────
2. OUTPUT STRUCTURE
────────────────────────────────────────────────────────────────────────────────

Create this folder structure under docs/plans/initial-plan/:

    docs/plans/initial-plan/
    ├── MASTER-PLAN.md
    ├── FINAL-SYNTHESIS.md
    ├── FINAL-VALIDATION-REPORT.md
    ├── PLANNING-LOG.md
    ├── phase-0-tech-spike/
    │   ├── PHASE-0-OVERVIEW.md
    │   ├── PHASE-0-REVIEW.md
    │   ├── ws-0.1-project-scaffolding.md
    │   ├── ws-0.2-design-tokens-setup.md
    │   └── ws-0.3-zui-tech-spike.md
    ├── phase-1-spatial-core-login/
    │   ├── PHASE-1-OVERVIEW.md
    │   ├── PHASE-1-REVIEW.md
    │   ├── ws-1.1-zui-engine.md
    │   ├── ws-1.2-hub-atrium.md
    │   ├── ws-1.3-login-experience.md
    │   ├── ws-1.4-navigation-instruments.md
    │   ├── ws-1.5-telemetry-aggregator.md
    │   ├── ws-1.6-ambient-effects-layer.md
    │   └── ws-1.7-core-interfaces.md
    ├── phase-2-districts-stations-morph/
    │   ├── PHASE-2-OVERVIEW.md
    │   ├── PHASE-2-REVIEW.md
    │   ├── ws-2.1-morph-choreography.md
    │   ├── ws-2.2-district-content-agent-builder.md
    │   ├── ws-2.3-district-content-project-room.md
    │   ├── ws-2.4-district-content-tarva-chat.md
    │   ├── ws-2.5-district-content-tarvacore-erp-tarvacode.md
    │   ├── ws-2.6-station-panel-framework.md
    │   └── ws-2.7-constellation-view.md
    ├── phase-3-receipts-command-palette-ai/
    │   ├── PHASE-3-OVERVIEW.md
    │   ├── PHASE-3-REVIEW.md
    │   ├── ws-3.1-receipt-system.md
    │   ├── ws-3.2-evidence-ledger.md
    │   ├── ws-3.3-command-palette.md
    │   ├── ws-3.4-ai-camera-director.md
    │   ├── ws-3.5-station-template-selection.md
    │   ├── ws-3.6-narrated-telemetry.md
    │   └── ws-3.7-attention-choreography.md
    └── phase-4-advanced-ai-polish/
        ├── PHASE-4-OVERVIEW.md
        ├── PHASE-4-REVIEW.md
        ├── ws-4.1-claude-api-integration.md
        ├── ws-4.2-exception-triage.md
        ├── ws-4.3-builder-mode.md
        └── ws-4.4-visual-polish-pass.md

Naming conventions:
- Phase directories: phase-<id>-<kebab-case-phase-title>/
- SOW files: ws-<id>.<seq>-<kebab-case-workstream-title>.md
- Phase overviews: PHASE-<ID>-OVERVIEW.md (uppercase ID)
- Phase reviews: PHASE-<ID>-REVIEW.md (uppercase ID)
- Use lowercase kebab-case for slugs. No spaces, no underscores.

────────────────────────────────────────────────────────────────────────────────
3. SOW TEMPLATE
────────────────────────────────────────────────────────────────────────────────

Every SOW file MUST use this structure. Agents may add sections but may not
remove or reorder these.

    # WS-X.N: <Workstream Title>

    > **Workstream ID:** WS-X.N
    > **Phase:** X — <Phase Title>
    > **Assigned Agent:** `<agent-slug>`
    > **Status:** Draft
    > **Created:** <date>
    > **Last Updated:** <date>
    > **Depends On:** <list of WS IDs this reads from, or "None">
    > **Blocks:** <list of WS IDs that depend on this, or "None">
    > **Resolves:** <list of open questions or issues, or "None">

    ## 1. Objective
    <What this workstream produces and why. 2-4 sentences.
    Tie back to specific decisions from the Combined Recommendations.
    Reference source: e.g., "per Gap Resolution #3" or "per AD-2".>

    ## 2. Scope
    ### In Scope
    | Area | Description |
    |------|-------------|

    ### Out of Scope
    | Area | Rationale |
    |------|-----------|

    ## 3. Input Dependencies
    | Source | What Is Needed | Status |
    |--------|----------------|--------|

    ## 4. Deliverables
    <The substantive content. Structure with subsections (4.1, 4.2, ...)
    appropriate to the domain. Each deliverable must be concrete — not a
    promise to do something, but the thing itself.

    For architecture: decisions, diagrams, interface contracts.
    For product: requirements, acceptance criteria, user stories.
    For documentation: guides, templates, procedures.
    For engineering: specifications, schemas, algorithms, exact file paths,
      type definitions, and function signatures.
    For quality: test strategies, rubrics, validation rules.

    GREENFIELD SPECIFICITY: Since this is a new codebase, deliverables MUST
    specify exact file paths TO CREATE, type definitions, function signatures,
    component APIs, and data schemas. Reference existing ecosystem code
    (Agent Builder, @tarva/ui) for patterns to follow. The SOW should be
    implementable without additional research.

    When referencing @tarva/ui components, include the import path and
    relevant props. When defining new components, specify their location
    in the project structure per AD-9.>

    ## 5. Acceptance Criteria
    | ID | Criterion | Verification Method |
    |----|-----------|---------------------|

    ## 6. Decisions Made
    | ID | Decision | Rationale | Alternatives Considered |
    |----|----------|-----------|------------------------|

    ## 7. Open Questions
    | ID | Question | Assigned To | Target Phase |
    |----|----------|-------------|--------------|

    ## 8. Risk Register
    | ID | Risk | Likelihood | Impact | Mitigation |
    |----|------|------------|--------|------------|

────────────────────────────────────────────────────────────────────────────────
4. PHASE OVERVIEW TEMPLATE
────────────────────────────────────────────────────────────────────────────────

After all SOWs in a phase are written, the synthesis team writes the overview.
The synthesis team is always:
  - #chief-technology-architect — architectural coherence
  - #software-product-owner — requirements coverage and product logic
  - #software-tech-writer — clarity, consistency, documentation quality
  - #enterprise-software-project-manager-controller-pmo — sequencing,
    resource allocation, effort realism, cross-phase dependencies

The CTA task must address each section from four lenses:
  1. Architectural coherence (CTA perspective)
  2. Requirements/product logic completeness (SPO perspective)
  3. Documentation clarity and consistency (STW perspective)
  4. Sequencing, effort realism, and resource conflicts (PMO perspective)

The synthesis team may add sections beyond these ten.

    # Phase X Overview: <Phase Title>

    > **Synthesized by:** CTA + SPO + STW + PMO
    > **Parent Plan:** MASTER-PLAN.md

    ## 1. Executive Summary
    ## 2. Key Findings (grouped by theme, not by workstream)
    ## 3. Cross-Workstream Conflicts
    <For each conflict: identify the contradicting SOWs, describe the
    specific disagreement, and provide a resolution recommendation.>
    ## 4. Architecture Decisions (consolidated table from all SOWs)
    ## 5. Cross-Workstream Dependencies
    ## 6. Consolidated Open Questions (flag which are blocking)
    ## 7. Phase Exit Criteria
    | Criterion | Met? | Evidence |
    ## 8. Inputs Required by Next Phase
    ## 9. Gaps and Recommendations
    <Anything missing from the SOWs that should be addressed before
    or during execution.>
    ## 10. Effort & Sequencing Assessment (PMO)
    <PMO perspective on: effort estimates vs. complexity, resource
    loading across workstreams, parallel execution opportunities,
    bottleneck risks, and recommended execution order within phase.>

────────────────────────────────────────────────────────────────────────────────
5. PHASE REVIEW TEMPLATE
────────────────────────────────────────────────────────────────────────────────

After the overview is written, #every-time reviews the entire phase.

    # Phase X Review: <Phase Title>

    > **Reviewer:** `every-time`
    > **Classification:** HIGH
    > **Documents Reviewed:** <count> (<filenames>)

    ## Review Verdict: <PASS | PASS WITH ISSUES | FAIL>

    ## Per-SOW Assessment
    For each SOW:
    | SOW | Completeness | Ecosystem Grounding | Issues Found | Rating |
    |-----|-------------|---------------------|--------------|--------|

    ## Issues Found
    ### HIGH Severity
    <For each HIGH issue, provide a specific actionable fix recommendation.>
    ### MEDIUM Severity
    <For each MEDIUM issue, provide a fix recommendation or accept-with-caveat.>
    ### LOW Severity

    ## Cross-Phase Consistency Check
    | Check | Status | Notes |
    |-------|--------|-------|
    | SOW decisions align with Combined Recommendations | OK/ISSUE | |
    | SOW decisions align with tech-decisions.md | OK/ISSUE | |
    | SOW visual specs align with VISUAL-DESIGN-SPEC.md | OK/ISSUE | |
    | SOW scopes do not overlap | OK/ISSUE | |
    | SOW scopes have no gaps (every requirement traced) | OK/ISSUE | |
    | Dependencies are bidirectionally consistent | OK/ISSUE | |
    | Acceptance criteria are measurable | OK/ISSUE | |
    | Open questions have owners and target phases | OK/ISSUE | |
    | Effort estimates are internally consistent | OK/ISSUE | |
    | File paths follow AD-9 project structure | OK/ISSUE | |
    | @tarva/ui component usage is consistent | OK/ISSUE | |
    | Design tokens match VISUAL-DESIGN-SPEC.md values | OK/ISSUE | |

    ## Blocking Assessment
    **Blocking for next phase?** Yes / No
    **Required fixes before proceeding:**
    **Recommended fixes (non-blocking):**

────────────────────────────────────────────────────────────────────────────────
6. FINAL DOCUMENTS
────────────────────────────────────────────────────────────────────────────────

After ALL phases pass their gate checks, produce three final documents:

MASTER-PLAN.md (synthesis team — PMO leads sections 3-5, 9):
  Focuses on implementation — what to build, in what order, at what cost.
  1. Executive Summary
  2. Phase Gate Summary (verdict + blocking issues per phase)
  3. Cross-Phase Dependency Chain (PMO: critical path, parallel opportunities)
  4. Implementation Sequence (PMO: recommended order with rationale,
     resource loading, and bottleneck analysis)
  5. Effort Summary (PMO: table with estimates per phase/workstream,
     resource allocation, and conflict flags)
  6. Risk Heat Map (consolidated, cross-phase)
  7. Decision Log (all resolved decisions across all phases)
  8. File Impact Summary (new files per phase — greenfield, so all new)
  9. Pre-Implementation Checklist (PMO: infrastructure setup, Supabase
     tables, @tarva/ui integration, pnpm workspace config, env vars)
  10. Acceptance Criteria Summary (count per phase, test strategy)
  11. SOW Inventory (full table: WS ID, title, agent, phase, status)

FINAL-SYNTHESIS.md (synthesis team):
  Focuses on analysis — cross-phase insights and consolidated findings.
  1. Executive Summary (1 page max)
  2. Problem Statement
  3. Solution Overview
  4. Phase Summaries (3-5 sentences each)
  5. Consolidated Architecture Decisions (master table)
  6. Cross-Phase Dependency Map
  7. Cross-Phase Conflicts and Resolutions
  8. Consolidated Risk Register (deduplicated)
  9. Consolidated Open Questions (any still unresolved)
  10. Deferred Items (out of scope for this effort)
  11. Success Criteria
  12. Implementation Sequencing

FINAL-VALIDATION-REPORT.md (#every-time):
  1. Verdict (PASS | PASS WITH CONDITIONS | FAIL)
  2. Success Criteria Coverage
  3. Review Findings Resolution (all findings, all phases, current status)
  4. Unresolved Tensions
  5. Conditions for Implementation Start
  6. Recommendations

NOTE: MASTER-PLAN.md and FINAL-SYNTHESIS.md are complementary documents,
not duplicates. MASTER-PLAN.md is the primary reference for the Execution
prompt. FINAL-SYNTHESIS.md provides the analytical context.

────────────────────────────────────────────────────────────────────────────────
7. PROGRESS TRACKER
────────────────────────────────────────────────────────────────────────────────

Create a file: docs/plans/initial-plan/PLANNING-LOG.md

This is the living progress tracker. It persists across sessions. Structure:

    # Planning Log — Tarva Launch

    > **Project:** Tarva Launch
    > **Started:** <date>
    > **Last Updated:** <date>
    > **Current Phase:** <phase>
    > **Current Step:** <WRITING SOWs | SYNTHESIZING | REVIEWING | GATE CHECK>

    ## Status Summary

    | Phase | SOWs Written | SOWs Total | Overview | Review | Gate |
    |-------|-------------|------------|----------|--------|------|
    | 0     | 0/3         | 3          | -        | -      | -    |
    | 1     | 0/7         | 7          | -        | -      | -    |
    | 2     | 0/7         | 7          | -        | -      | -    |
    | 3     | 0/7         | 7          | -        | -      | -    |
    | 4     | 0/4         | 4          | -        | -      | -    |

    ## Issues Log

    | # | Phase | SOW | Issue | Severity | Resolution | Status |
    |---|-------|-----|-------|----------|------------|--------|

    ## Deviations from Discovery Input

    | # | What Changed | Why | Impact |
    |---|-------------|-----|--------|

Update PLANNING-LOG.md after each SOW, after each overview, after each
review, and after each gate check. This file is how we track progress
across sessions.

────────────────────────────────────────────────────────────────────────────────
8. AGENT RESOLUTION PROTOCOL
────────────────────────────────────────────────────────────────────────────────

All 28 workstreams have pre-assigned agents. No TBD resolution needed.

Assigned agents (from agent-roster.md):
  - react-developer: 12 workstreams (spatial engine, camera, districts, React)
  - world-class-ui-designer: 7 workstreams (tokens, capsules, login, effects)
  - world-class-backend-api-engineer: 3 workstreams (telemetry, receipts, AI)
  - world-class-autonomous-interface-architect: 5 workstreams (AI director,
    station selection, narrated telemetry, exception triage, builder mode)
  - chief-technology-architect: 1 workstream (core interface definitions)

Standing pipeline roles:
  - software-product-owner: Requirements, acceptance criteria, product logic
  - enterprise-software-project-manager-controller-pmo: Sequencing, effort
  - every-time: Phase reviews, validation gates

When a missing workstream is identified during synthesis or review:
  1. Flag it as an issue in the Phase Review.
  2. Use mcp__tarvacode-agent-selector__select_best_agent to recommend
     an agent (if available), or select manually from the roster.
  3. Add a new SOW file.
  4. Update the phase overview.
  5. Log the addition in PLANNING-LOG.md.

────────────────────────────────────────────────────────────────────────────────
9. RESEARCH PROTOCOL
────────────────────────────────────────────────────────────────────────────────

Agents MUST ground their work in ecosystem codebases first. For greenfield
SOWs, this means:

  1. READ @tarva/ui (tokens, components, ThemeProvider) for UI patterns
  2. READ Agent Builder frontend for Next.js 16 / App Router patterns
  3. REFERENCE combined-recommendations.md for architecture decisions
  4. REFERENCE tech-decisions.md for tech stack specifics
  5. REFERENCE VISUAL-DESIGN-SPEC.md for all visual/token values

When ecosystem context is insufficient, escalate:

LEVEL 1 — Reasoning (use freely):
  mcp__sequential-thinking__sequentialthinking

LEVEL 2 — Targeted Research (when ecosystem lacks answers):
  mcp__sequential-research__sequential_research_plan
  mcp__sequential-research__sequential_research_compile

LEVEL 3 — Multi-Model Validation (high-stakes decisions):
  mcp__openai-second-opinion__openai_second_opinion

LEVEL 4 — Consensus (critical/irreversible decisions):
  mcp__research-consensus__research_consensus

Citation labels (use in SOW deliverables):
  [ECOSYSTEM] — from existing Tarva repo code
  [SPEC]      — from discovery artifacts (combined-recs, tech-decisions,
                visual-design-spec, ia-assessment)
  [INFERENCE] — derived from reasoning
  [RESEARCH]  — from sequential-research
  [CONSENSUS] — from multi-model validation
  [ASSUMPTION]— unvalidated (must appear in Open Questions)

────────────────────────────────────────────────────────────────────────────────
10. EXECUTION PROTOCOL
────────────────────────────────────────────────────────────────────────────────

Execute phases strictly in sequence (0 → 1 → 2 → 3 → 4). Within each
phase, independent SOWs may be written in parallel.

STEP 1: SETUP
  - Read all input files:
      combined-recommendations.md
      agent-roster.md
      tech-decisions.md
      VISUAL-DESIGN-SPEC.md
      DISCOVERY-LOG.md
  - Run input validation (Section 1)
  - Create PLANNING-LOG.md with the full phase/SOW checklist
  - Create all phase directories
  - Check in with user: present the folder structure and confirm

STEP 2: FOR EACH PHASE (sequential: 0, 1, 2, 3, 4)

  2a. WRITE SOWs
      Spawn a Task per workstream with:
        subagent_type: <assigned-agent-slug from agent-roster.md>
        prompt: SOW template + workstream-specific context

      CONTEXT MANAGEMENT: Do NOT pass the entire combined-recommendations.md
      to every Task. Instead, pass:
        1. The specific work area description from the Phase Decomposition
        2. Architecture decisions relevant to THIS workstream
        3. Gap resolutions relevant to THIS workstream
        4. Tech stack details from tech-decisions.md relevant to THIS workstream
        5. Visual spec sections from VISUAL-DESIGN-SPEC.md relevant to
           THIS workstream (only for UI/frontend workstreams)
        6. The full list of workstream TITLES (for dependency context)
        7. Any prior phase outputs this workstream depends on
        8. Reference ecosystem repo paths + instruction to read relevant files
        9. The output file path

      Independent workstreams: spawn in parallel.
      Dependent workstreams: wait for dependencies.

  2b. SYNTHESIZE
      Spawn Task (subagent_type: chief-technology-architect) with:
        Phase Overview template + ALL SOW files for this phase +
        relevant sections of Combined Recommendations +
        tech-decisions.md + VISUAL-DESIGN-SPEC.md (summary) +
        prior phase overviews + instruction to synthesize from CTA,
        SPO, STW, and PMO perspectives.

      The synthesis team MUST produce a Conflicts section. For each
      conflict: identify the contradicting SOWs, describe the specific
      disagreement, and provide a resolution recommendation.

  2c. REVIEW
      Spawn Task (subagent_type: every-time) with:
        Phase Review template + ALL SOW files + overview +
        relevant Combined Recommendations + tech-decisions.md +
        VISUAL-DESIGN-SPEC.md + prior phase reviews

  2d. GATE CHECK
      Read the review verdict:
        PASS              → proceed to next phase
        PASS WITH ISSUES  → proceed if no blocking issues; otherwise fix
        FAIL              → fix blocking issues, re-synthesize, re-review
      Max 2 fix cycles per phase. If still FAIL, check in with the user
      and proceed with caveats noted.

  2e. UPDATE TRACKER
      Update PLANNING-LOG.md: mark phase complete, log issues, log gate.

STEP 3: FINAL SYNTHESIS
  Spawn CTA task to produce MASTER-PLAN.md and FINAL-SYNTHESIS.md.

STEP 4: FINAL VALIDATION
  Spawn #every-time task to produce FINAL-VALIDATION-REPORT.md.

STEP 5: COMPLETION
  Update PLANNING-LOG.md with final status. Check in with user.

────────────────────────────────────────────────────────────────────────────────
11. CHECK-IN PROTOCOL
────────────────────────────────────────────────────────────────────────────────

Check in with the user at these points. Do NOT proceed silently.

MANDATORY CHECK-INS:
  - After reading inputs and creating folder structure (present structure)
  - After each phase gate (present verdict, blocking issues, resolution)
  - Before final synthesis (present all-phase summary)
  - After final validation (present verdict and conditions)

RECOMMENDED CHECK-INS:
  - When a workstream scope seems much larger than expected
  - When SOWs produce contradictory decisions
  - When a phase fails its gate check twice
  - Every 5+ SOWs within a phase (progress pulse)

Check-in format:
  "STATUS: Planning — Phase X [WRITING SOWs | SYNTHESIZING | REVIEWING]
   COMPLETED: [what was just finished]
   NEXT: [what comes next]
   FINDINGS: [key observations, or 'None']
   ISSUES: [concerns, or 'None']
   DECISIONS NEEDED: [anything requiring user input, or 'None']
   Shall I continue?"

────────────────────────────────────────────────────────────────────────────────
12. QUALITY STANDARDS
────────────────────────────────────────────────────────────────────────────────

Every SOW and synthesis document must meet these standards.

SPECIFICITY:
  - SOW deliverables specify exact file paths, type definitions,
    component APIs, and function signatures to create
  - SOW deliverables reference @tarva/ui components by name with
    import paths and relevant props
  - SOW deliverables reference VISUAL-DESIGN-SPEC.md tokens by name
    (e.g., --color-ember, --glow-ember-medium, --duration-morph)
  - Acceptance criteria are measurable and testable
  - Scope tables have concrete items, not vague categories
  - No hand-waving ("improve performance", "clean up the code")

COMPLETENESS:
  - Every goal from combined-recommendations.md maps to at least one SOW
  - Every architecture decision (AD-1 through AD-9) is reflected in
    relevant SOWs
  - Every risk from the risk register appears in relevant SOW risk tables
  - No requirement is silently dropped

TRACEABILITY:
  - SOW objectives reference their source (e.g., "per Gap Resolution #3",
    "per AD-2", "per tech-decisions.md Spatial Engine")
  - Phase Overviews trace decisions back to Combined Recommendations
  - MASTER-PLAN.md traces requirements to SOWs to acceptance criteria

ECOSYSTEM CONSISTENCY:
  - File paths follow AD-9 project structure
  - Component patterns match @tarva/ui and Agent Builder conventions
  - State management follows Zustand store patterns from tech-decisions.md
  - Design tokens use the exact values from VISUAL-DESIGN-SPEC.md
  - All 6 districts (Agent Builder, Tarva Chat, Project Room, TarvaCORE,
    TarvaERP, tarvaCODE) are accounted for

CONSISTENCY:
  - SOW scopes do not overlap (no two SOWs own the same file/feature)
  - Dependencies are bidirectional (if A depends on B, B blocks A)
  - Terminology is consistent across all documents
  - Color references use ember/teal naming (never "frost")
  - Storage references use Supabase (never "SQLite" or "better-sqlite3")

────────────────────────────────────────────────────────────────────────────────
13. ERROR HANDLING
────────────────────────────────────────────────────────────────────────────────

SOW CONTRADICTIONS:
  When two SOWs make contradictory decisions or claim overlapping scope:
  1. Identify the conflict in the Phase Overview (Section 3)
  2. Provide a resolution recommendation
  3. The Phase Review must verify the conflict is addressed
  4. If the resolution changes a SOW's scope, update both SOWs

SYNTHESIS QUALITY ISSUES:
  If the Phase Overview misses conflicts or produces vague findings:
  1. Re-run synthesis with more specific instructions
  2. Flag the quality gap in the Phase Review

GATE CHECK FAILURE:
  After 2 fix cycles, if a phase still fails:
  1. Document all unresolved issues in PLANNING-LOG.md
  2. Check in with the user — present the issues and ask for guidance
  3. Proceed with caveats noted in the Phase Review

IRRECONCILABLE AMBIGUITY:
  If the combined-recommendations.md is ambiguous on a critical point:
  1. Check in with the user before writing SOWs that depend on it
  2. Do NOT guess through high-uncertainty decisions
  3. Log the ambiguity as an Open Question with "Stakeholder" as owner

────────────────────────────────────────────────────────────────────────────────
14. RESUMABILITY
────────────────────────────────────────────────────────────────────────────────

This planning effort may span multiple sessions.

AT SESSION START:
  1. Read docs/plans/initial-plan/PLANNING-LOG.md
  2. Identify the current phase and step
  3. Read the most recent Phase Overview and Review (if they exist)
  4. Search memory MCP for prior decisions:
     mcp__memory__search_nodes with query: "Tarva Launch planning"
  5. Report to user: "Resuming planning at Phase X, step Y. Last completed:
     [description]. M of N phases complete."
  6. Continue from where you left off

AT SESSION END (if the user says they're done for now):
  1. Update PLANNING-LOG.md with current status
  2. Store critical decisions in memory MCP
  3. Report what remains to the user

────────────────────────────────────────────────────────────────────────────────
15. PERMISSIONS AND CONSTRAINTS
────────────────────────────────────────────────────────────────────────────────

Permissions:
  - Read, Write, Edit: files under docs/plans/initial-plan/
  - Read, Grep, Glob: files under reference codebases (Section 1)
  - All MCP tools listed in agent definitions
  - WebSearch, WebFetch: only when ecosystem context is insufficient

Constraints:
  - Do NOT modify any files in reference codebases. Read only.
  - Do NOT create files outside docs/plans/initial-plan/.
  - Do NOT skip phases or workstreams.
  - Do NOT merge multiple workstreams into a single SOW file.
  - Every SOW must reference ecosystem patterns where applicable.
  - Never commit secrets, tokens, or credentials in any document.
  - Use "ember"/"teal" naming, never "frost"/"cyan".
  - Use "Supabase" for Launch storage, never "SQLite".
  - Use "@tarva/ui" for components, never standalone "shadcn".

────────────────────────────────────────────────────────────────────────────────
16. START
────────────────────────────────────────────────────────────────────────────────

1. Read Combined Recommendations (docs/plans/initial-plan/combined-recommendations.md)
2. Read Agent Roster (docs/plans/initial-plan/agent-roster.md)
3. Read Tech Decisions (docs/plans/initial-plan/tech-decisions.md)
4. Read Visual Design Spec (docs/plans/initial-plan/VISUAL-DESIGN-SPEC.md)
5. Run input validation (Section 1)
6. Check if PLANNING-LOG.md exists (resuming?) — if so, read it and
   report current status
7. If starting fresh, create PLANNING-LOG.md with the full phase/SOW
   checklist
8. Create all phase directories
9. Report to me:
   - Total phases (5) and workstreams (24)
   - Folder structure created
   - Any ambiguities or concerns from reading the inputs
   - Any deviations from Discovery decisions you recommend
10. Wait for my GO before writing any SOW files
```
