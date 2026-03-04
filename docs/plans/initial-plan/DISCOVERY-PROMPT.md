# Project Discovery Prompt — Tarva Launch

> Copy everything between the ``` fences into Claude Code to begin discovery.
>
> This is the FIRST step in a three-prompt workflow:
>
> 1. **Discovery** (this prompt) — Explore, assess, decompose, recommend
> 2. **Planning** — Turn recommendations into Phase/Workstream/SOW structure
> 3. **Execution** — Implement every workstream in the plan
>
> Prerequisites:
>
> - A codebase to analyze (or a greenfield project brief)
> - A project brief, user feedback, or feature request (the "input signal")
> - Access to the full agent fleet

---

```
I need you to conduct a THOROUGH DISCOVERY of a project before we plan or
build anything. Your job is to deeply understand the codebase, the user's
goals, the gaps, the risks, and to produce three deliverables that will feed
into the planning phase. Do NOT write any code. Do NOT create a plan yet.
This is research and analysis only.

Read these instructions fully before taking any action.

────────────────────────────────────────────────────────────────────────────────
1. INPUTS
────────────────────────────────────────────────────────────────────────────────

Project Name:         Tarva Launch
Codebase Path:        /Users/jessetms/Sites/tarva-org/tarva-launch
Output Directory:     /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan
Input Signal(s):      /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/TARVA-SYSTEM-OVERVIEW.md
                      /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/initial-thoughts-1.md
                      /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/storyboard.md
                      /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/spacial-modal-map.md
                      /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/more-for-ui.md
                      /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/vision-initiation-pack.md

The Input Signal is the raw material — it could be one or more files:
  - User/stakeholder feedback document
  - Feature request or PRD
  - Bug reports or support tickets
  - A verbal description of what needs to happen
  - An existing review/audit document

If multiple input signals are provided, read all of them before starting
Phase 1. Note any contradictions between sources.

────────────────────────────────────────────────────────────────────────────────
1b. STAKEHOLDER DIRECTIVES (non-negotiable constraints from the project owner)
────────────────────────────────────────────────────────────────────────────────

These override any conflicting recommendations from input signals or agents.

PROJECT TYPE:
  - This is a GREENFIELD project. There is no existing codebase to explore.
    Skip Phases 2-3 as specified in the template. Gap analysis focuses on
    technology choices, architecture patterns, and data model design.

DEPLOYMENT:
  - Localhost only. No cloud hosting, no CI/CD, no production deployment.
    This is an internal team tool running on a developer machine.

PURPOSE:
  - Internal team tool, not customer-facing. Prioritize visual impact and
    developer delight over enterprise concerns (accessibility compliance,
    i18n, SEO, etc.).
  - This is meant to be EYE CANDY first. The aesthetic experience described
    in the input signals (Oblivion, NASA, Apple) is the primary success
    criterion, not feature completeness.

TECH STACK:
  - Discovery must RECOMMEND the best-fit tech stack as a deliverable
    (see Deliverable 3: tech-decisions.md). Do not treat tech stack as
    pre-decided — evaluate and recommend based on the vision requirements.
  - All recommendations must be FREE and OPEN-SOURCE.
  - Mixing approaches is encouraged if the vision calls for it (e.g., WebGL
    for the spatial layer + a 2D canvas library for specific interactions).
  - The existing Tarva ecosystem uses: Next.js 16, React 19, Tailwind v4,
    shadcn/ui, @tarva/ui, Zustand 5, pnpm. Staying consistent where it
    makes sense is a plus, but the Launch's visual ambitions may require going
    beyond what the other apps use.

AUTH:
  - Keep it dead simple for now. A single hardcoded key/passphrase that
    the user enters. No user accounts, no sessions, no OAuth.
  - The LOGIN UX should be futuristic and theatrical (per the storyboard),
    but the underlying auth mechanism is just "does this string match."
  - Non-biometric. No camera, no fingerprint, no WebAuthn for now.

AI FEATURES:
  - The AI-driven features in more-for-ui.md (disposable pixels, AI camera
    director, narrated telemetry, autonomy ladder, etc.) should be LAYERED
    IN to the plan, not deferred. They are part of the vision, not stretch
    goals.
  - Discovery should identify which AI features require Claude API access
    vs. local Ollama inference, and factor that into the architecture.

DATA LAYER:
  - The Launch needs to show real-time (or near-real-time) telemetry from the
    existing Tarva apps (health, runs, alerts, latency, artifacts).
  - Discovery must address: where telemetry data comes from, what protocol
    connects the Launch to the apps, and whether the Launch needs its own database.
  - The existing apps already have databases (local Supabase instances) and
    API routes. Favor reading from existing sources over creating new ones.

────────────────────────────────────────────────────────────────────────────────
2. SCOPE CALIBRATION
────────────────────────────────────────────────────────────────────────────────

Before starting the 7 phases, assess the appropriate discovery depth:

LITE (1-3 features, single domain, clear requirements):
  - Combine Phases 1-3 into a single exploration pass
  - Phase 4: gaps only (skip formal architecture decisions if none needed)
  - Skip Phase 6 (agent selection obvious or single agent)
  - Reduce check-ins to 1 (before deliverables)
  - #every-time validation at Phase 7 only
  - Target: 1 session, lightweight deliverables

STANDARD (4-10 features, 2-3 domains):
  - Full 7-phase protocol as written
  - Target: 1-2 sessions

DEEP (10+ features, multiple domains, high uncertainty):
  - Full 7 phases + additional check-in after Phase 3
  - Mandatory specialist consultations for each domain
  - Additional #every-time gate after Phase 4
  - Consider mcp__research-consensus for architecture decisions
  - Target: 2-3 sessions

Report your calibration choice at the first check-in. The user may override.

────────────────────────────────────────────────────────────────────────────────
3. DISCOVERY PROTOCOL — 7 PHASES
────────────────────────────────────────────────────────────────────────────────

Execute these phases IN ORDER. Each phase builds on the prior one.

╔══════════════════════════════════════════════════════════════════════════════╗
║  PHASE 1: UNDERSTAND INTENT                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

Read the Input Signal completely. Then use #every-time to decompose it:

  Spawn Task (subagent_type: every-time):
    "Analyze this project input signal. Extract:
     1. STATED GOALS — What the stakeholder explicitly asked for
     2. IMPLICIT GOALS — What they clearly need but didn't articulate
     3. CONSTRAINTS — Timelines, budgets, technical limits, non-negotiables
     4. AMBIGUITIES — Things that are unclear or contradictory
     5. ASSUMPTIONS — What the stakeholder seems to be assuming
     6. PRIORITY SIGNALS — Which items feel urgent vs. nice-to-have
     7. RISK SIGNALS — Anything that sounds risky, complex, or underestimated

     Input Signal:
     [full content of the input signal]

     Output a structured analysis. Be specific — quote the signal directly
     when identifying items."

  If the input signal exceeds ~5000 words, process it in logical sections.
  For each section: extract goals, constraints, and ambiguities. Then
  synthesize across sections. Do NOT attempt to pass the entire signal
  into a single subagent call.

If the input signal has significant ambiguities, CHECK IN with the user to
resolve them BEFORE proceeding. You need clear intent to do good discovery.

╔══════════════════════════════════════════════════════════════════════════════╗
║  PHASE 2: EXPLORE THE CODEBASE                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

If the codebase does not yet exist (greenfield project), skip Phases 2-3
and proceed to Phase 4. Your gap analysis will focus on technology choices,
architecture patterns, and data model design rather than mapping to existing
code.

Conduct a systematic codebase exploration. Explore with the input signal's
goals in mind — you need a working mental model of the areas the input
signal touches, not a full codebase audit. If the project has 100+ files,
focus on: config files, route/page structure, key data models, and the
specific modules referenced by the input signal's goals.

2a. PROJECT STRUCTURE
  - Framework, language, and runtime
  - Directory structure and file organization conventions
  - Build system, package manager, and scripts
  - Deployment target and environment setup

2b. DATA LAYER
  - Database type, schema, and migration approach
  - ORM or query patterns
  - Key tables/collections and their relationships
  - Authentication and authorization model (RLS, middleware, etc.)

2c. APPLICATION LAYER
  - Routing structure and API endpoints
  - Business logic organization (services, utils, engines, etc.)
  - State management approach
  - Key shared types and interfaces

2d. PRESENTATION LAYER
  - Component library and design system
  - Layout patterns and navigation structure
  - Form handling and validation patterns
  - Styling approach (CSS modules, Tailwind, etc.)

2e. TESTING AND QUALITY
  - Test framework and coverage approach
  - Existing test patterns and conventions
  - CI/CD pipeline and deployment process
  - Linting and formatting configuration

2f. NON-FUNCTIONAL CHARACTERISTICS
  - Performance patterns (caching, lazy loading, pagination)
  - Security posture (input validation, auth patterns, CORS)
  - Accessibility approach (ARIA, keyboard nav, screen readers)
  - Observability (logging, error tracking, analytics)

Use the Explore agent or direct Glob/Grep/Read as appropriate.

╔══════════════════════════════════════════════════════════════════════════════╗
║  PHASE 3: ASSESS CURRENT STATE                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

Now map the input signal onto the codebase. For each stated/implicit goal:

  - What exists today? (files, functions, schemas, UI)
  - What's partially built? (in-progress, scaffolded, stubbed)
  - What's completely missing?
  - What existing code would need to change?
  - What existing patterns should the new work follow?

Use #every-time to validate your assessment:

  Spawn Task (subagent_type: every-time):
    "Validate this current-state assessment against the actual codebase.
     For each item, verify the file paths exist and the descriptions are
     accurate. Flag anything I got wrong or missed.

     Assessment:
     [your current-state assessment]

     Key codebase files to cross-reference:
     [list the critical files you read]"

MANDATORY CHECK-IN after Phase 3 (STANDARD and DEEP only):
  Report to the user what already exists, what is partially built, and
  what is completely missing. Flag if the effort is larger, smaller, or
  fundamentally different than the input signal implies.

╔══════════════════════════════════════════════════════════════════════════════╗
║  PHASE 4: IDENTIFY GAPS, DECISIONS, AND REQUIREMENTS                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

This is the critical thinking phase. Identify:

4a. CRITICAL GAPS
  Things the input signal mentions or implies but that have no path to
  implementation without a decision. Examples:
  - Missing formulas or business rules
  - Ambiguous data model choices
  - Unclear UX flows
  - Missing third-party integrations
  - Performance or scale unknowns

  For each gap: describe it, explain why it matters, and propose 1-2
  resolution options with trade-offs.

4b. ARCHITECTURE DECISIONS
  Significant design choices that affect multiple features. Examples:
  - New table vs. extending existing table
  - Separate service vs. inline logic
  - New route vs. extending existing page
  - Client-side vs. server-side computation

  For each decision: state the question, list options, recommend one,
  explain why.

4c. DETAILED REQUIREMENTS
  For each goal from the input signal, document the specific, implementable
  requirements that emerged from codebase exploration and domain
  consultations:
  - UI behaviors and interactions
  - Data fields, types, and validation rules
  - Workflow and business rules
  - API contracts and endpoints
  - Configuration and settings

  These are the detailed specifications the planner will build SOWs from.
  They must be specific enough to implement without further clarification.

4d. RISK REGISTER
  Things that could go wrong or take longer than expected. For each:
  - Risk description
  - Likelihood (low/medium/high)
  - Impact (low/medium/high)
  - Severity (Critical/High/Medium/Low)
  - Blocking? (Yes/No)
  - Mitigation strategy

4e. DEFERRED ITEMS
  Things mentioned in the input signal that are explicitly OUT of scope
  for this effort. For each:
  - What it is
  - Why it's deferred
  - What triggers re-evaluation

4f. DOMAIN KNOWLEDGE GAPS
  Anything where you need domain expertise to make good recommendations.
  Flag these explicitly — the right agent or the user will need to fill
  these in.

4g. ASSUMPTIONS REGISTER
  All assumptions made during Phases 1-4. Each must be flagged as:
  - VALIDATED (confirmed against codebase or domain expert)
  - UNVALIDATED (needs stakeholder confirmation — appears in Open Questions)

MANDATORY PRODUCT OWNER CONSULTATION (STANDARD and DEEP):
  Spawn Task (subagent_type: software-product-owner):
    "I'm conducting project discovery for Tarva Launch.

     Context: [2-3 sentence project summary]
     Input signal goals: [list all stated goals with priorities]
     Proposed scope: [summary of what discovery found]
     Proposed MVP: [if scope is larger than expected]

     I need your product assessment on:
     1. PRIORITY VALIDATION — Are the priorities correctly ordered? Should
        anything be promoted or demoted?
     2. SCOPE BOUNDARIES — Is the proposed MVP the right cut? What's the
        minimum that delivers user value?
     3. ACCEPTANCE CRITERIA — For each feature area, what are the key
        acceptance criteria that define 'done' from a product perspective?
     4. USER VALUE MAP — Which features deliver the most user value per
        unit of effort? Flag any low-value/high-effort items.
     5. SCOPE RISKS — Any features that sound simple but have hidden
        product complexity (edge cases, user expectations, etc.)?

     Be specific and actionable. Reference the input signal directly."

  Incorporate PO findings into the gap resolutions, requirements, and
  phase decomposition. If the PO disagrees with technical priorities,
  present both perspectives in the combined-recommendations.md and flag
  as an Open Question if unresolved.

QUALITY GATE (STANDARD and DEEP):
  Spawn Task (subagent_type: every-time):
    "Validate these architecture decisions and gap resolutions.
     For each architecture decision:
     1. Are there alternatives not considered?
     2. What are the downstream consequences?
     3. Does this conflict with any existing codebase pattern?
     For each gap resolution:
     1. Is the resolution implementable from the description alone?
     2. Are there edge cases not addressed?
     Decisions: [list]
     Gap Resolutions: [list]
     Codebase context: [key files and patterns]"

For domain-specific gaps, bring in the right specialist agent (Section 5).

╔══════════════════════════════════════════════════════════════════════════════╗
║  PHASE 5: DECOMPOSE INTO WORK AREAS                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

Group the work into logical phases and work areas. This is NOT the detailed
plan — it's the high-level decomposition that the planning prompt will
expand into full SOWs.

DECOMPOSITION PRINCIPLES:
  1. DEPENDENCY-FIRST: Work that unblocks other work goes in earlier phases
  2. VALUE-FIRST: Highest-impact items go before nice-to-haves
  3. RISK-FIRST: Risky or uncertain work goes early (fail fast)
  4. DOMAIN-COHERENT: Group related changes together
  5. TESTABLE INCREMENTS: Each phase should produce something verifiable

If the total scope is significantly larger than the input signal implied,
propose scope boundaries. Identify a "Minimum Viable Scope" (first 1-2
phases) that delivers the highest-value items. Present this alongside the
full decomposition at the check-in.

For each proposed phase:
  - Title and 1-sentence objective
  - What it unblocks for later phases
  - Estimated complexity (S/M/L/XL per work area)
  - Key risks or decisions that must be resolved first

For each work area within a phase:
  - Title and 2-3 sentence scope description
  - Primary domain (DB, backend, frontend, UX, ops, etc.)
  - Key files/modules that will be touched
  - Dependencies on other work areas

Use sequential-thinking (mcp__sequential-thinking__sequentialthinking) to
work through complex decomposition problems.

╔══════════════════════════════════════════════════════════════════════════════╗
║  PHASE 6: SELECT AGENTS                                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

For each work area, recommend the best agent from your fleet. Consider:

  - What is the PRIMARY skill needed? (code, design, architecture, etc.)
  - Does the agent have domain-specific knowledge needed?
  - Has this agent handled similar work before?

AGENT SELECTION RULES:
  1. Each work area gets exactly ONE primary agent
  2. The primary agent is responsible for the deliverables
  3. Supporting agents can be called in during execution
  4. Use mcp__tarvacode-agent-selector__select_best_agent (if available)
     for any work area where the best agent isn't obvious
  5. Prefer specialists over generalists when the work is clearly in
     one domain
  6. Use #every-time for specification and validation work areas
  7. Use #chief-technology-architect for cross-cutting architecture
  8. Use #software-product-owner for requirements and acceptance criteria

For each assignment, note WHY that agent was chosen (1 sentence).

For single-domain, low-complexity projects, specialist consultation may be
unnecessary. Use judgment: consult when you lack confidence in your
recommendation, not as a checkbox.

╔══════════════════════════════════════════════════════════════════════════════╗
║  PHASE 7: VALIDATE AND SYNTHESIZE                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

Before producing deliverables, run a final validation:

  Spawn Task (subagent_type: every-time):
    "Final discovery validation.

     Input signal goals: [list all stated and implicit goals]
     Proposed phases: [list phases with work areas]
     Gaps identified: [list critical gaps]
     Decisions needed: [list architecture decisions]

     Validate:
     1. Every goal from the input signal is covered by at least one
        work area. Nothing was dropped.
     2. The phase ordering respects dependencies (nothing depends on
        work in a later phase).
     3. Every critical gap has a proposed resolution.
     4. Every architecture decision has a recommendation.
     5. The agent assignments are reasonable.
     6. The risk register is complete — no obvious risks were missed.
     7. The scope is realistic — nothing was gold-plated or inflated.
     8. Every deferred item is explicitly documented.

     Report: DISCOVERY PASS / DISCOVERY FAIL with specific findings."

Fix any findings before producing deliverables.

────────────────────────────────────────────────────────────────────────────────
4. DELIVERABLES
────────────────────────────────────────────────────────────────────────────────

Produce exactly THREE files in /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan:

╔══════════════════════════════════════════════════════════════════════════════╗
║  DELIVERABLE 1: combined-recommendations.md                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

File: /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/combined-recommendations.md

Structure:

    # Combined Recommendations — Tarva Launch

    ## Context
    <2-3 paragraph summary: what was analyzed, who provided the input,
    what the project is, and the key reframe (if any) that emerged from
    discovery. Reference the input signal source(s).>

    ---

    ## Critical Gap Resolutions

    ### Gap 1: <title>
    **Decision**: <clear, actionable resolution>
    - <supporting detail>
    - <supporting detail>
    - <implications for implementation>

    (repeat for each gap)

    ---

    ## Architecture Decisions

    ### AD-1: <title>
    **Decision**: <clear choice with rationale>
    - <implementation guidance>
    - <what to preserve / not change>
    - <key types, schemas, or patterns to follow>

    (repeat for each AD)

    ---

    ## Detailed Requirements

    ### <Feature Area 1>
    - <Specific requirement with UI behavior, data fields, or business rules>
    - <Specific requirement referencing codebase types/files where applicable>
    ...

    ### <Feature Area 2>
    ...

    (Group by feature area or domain. Each requirement must be specific
    enough to implement without further clarification.)

    ---

    ## Phase Decomposition

    ### Phase A: <title>
    **Objective**: <1-2 sentences>
    **Unblocks**: <what later phases depend on this>
    **Estimated Complexity**: <relative size>

    Work Areas:
    1. <title> — <domain> — <complexity> — <1-sentence scope>
    2. <title> — <domain> — <complexity> — <1-sentence scope>
    ...

    (repeat for each phase)

    ---

    ## Risk Register

    | # | Risk | Likelihood | Impact | Severity | Blocking? | Mitigation |
    |---|------|-----------|--------|----------|-----------|------------|
    | 1 | ... | ... | ... | ... | ... | ... |

    ---

    ## Open Questions for Stakeholder

    | # | Question | Context | Needed By |
    |---|----------|---------|-----------|
    | 1 | ... | ... | Before Phase X |

    ---

    ## Constraints and Non-Negotiables

    - <constraint 1>
    - <constraint 2>
    ...

    ---

    ## Deferred Items (Out of Scope)

    | # | Item | Why Deferred | Revisit Trigger |
    |---|------|-------------|-----------------|
    | 1 | ... | ... | ... |

    ---

    ## Assumptions Register

    | # | Assumption | Status | Source |
    |---|-----------|--------|--------|
    | 1 | ... | VALIDATED / UNVALIDATED | Phase N finding |

QUALITY BAR: This document must be specific enough that someone who has
never seen the codebase can understand every decision. No hand-waving.
Every gap resolution must say WHAT to do, not just "figure it out later."
Every requirement must reference source material (e.g., "per Review item #3").

╔══════════════════════════════════════════════════════════════════════════════╗
║  DELIVERABLE 2: agent-roster.md                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

File: /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/agent-roster.md

Structure:

    # Agent Roster — Tarva Launch

    ## Phase A: <title>

    | WS | Title | Agent |
    |----|-------|-------|
    | WS-A.1 | <work area title> | <agent-slug> |
    | WS-A.2 | <work area title> | <agent-slug> |
    ...

    ## Phase B: <title>

    | WS | Title | Agent |
    |----|-------|-------|
    | WS-B.1 | <work area title> | <agent-slug> |
    ...

    (repeat for each phase)

    ## Standing Pipeline Roles

    These agents are present on every project roster. They do not own workstreams
    but have mandatory touchpoints throughout the pipeline lifecycle.

    ### software-product-owner

    | Phase | Touchpoint | Responsibility |
    |-------|-----------|----------------|
    | Discovery Phase 4 | Mandatory consultation | Validate priorities, scope boundaries, acceptance criteria quality, user value map |
    | Planning (each phase) | Synthesis team member | Requirements coverage, product logic completeness, acceptance criteria review |
    | Execution (each phase gate) | Phase gate reviewer | Verify deliverables meet product intent, flag user-facing gaps |
    | Execution (deviations) | On-demand | Consulted when deviations affect user-facing behavior or acceptance criteria |

    ### enterprise-software-project-manager-controller-pmo

    | Phase | Touchpoint | Responsibility |
    |-------|-----------|----------------|
    | Discovery Phase 4 | Recommended consultation | Sequencing realism, resource loading, effort estimates, cross-scope dependencies |
    | Planning (each phase) | Synthesis team member | Effort & sequencing assessment, resource conflicts, parallel opportunities, bottleneck analysis |
    | Planning (MASTER-PLAN.md) | Leads sections 3-5, 9 | Cross-phase dependency chain, implementation sequence, effort summary, pre-implementation checklist |
    | Execution | Escalation path | Invoked when: 3+ moderate deviations accumulate, resource conflicts arise, phase delays, cross-phase renegotiation needed |

    ### every-time

    | Phase | Touchpoint | Responsibility |
    |-------|-----------|----------------|
    | Discovery Phases 1, 3, 4, 7 | Quality gates | Intent analysis, state assessment validation, decision validation, final validation |
    | Planning (each phase) | Phase reviewer | SOW completeness, codebase grounding, cross-phase consistency |
    | Planning (final) | Final validation | FINAL-VALIDATION-REPORT.md |
    | Execution (each WS) | Pre-flight / post-flight | Verify dependencies met, acceptance criteria passed |
    | Execution (each phase gate) | Phase validation | Cross-workstream integration, exit criteria |

    ## Optional Supporting Agents

    | Agent | When to Invoke |
    |-------|---------------|
    (list only agents NOT assigned to workstreams and NOT in standing roles)

    ## Workstream Summary

    | Agent | Work Areas | Primary Domain |
    |-------|-----------|----------------|
    (summary table of workstream agent assignments)

NUMBERING: Use WS-<phase-letter>.<sequence> format (WS-A.1, WS-A.2, etc.)
AGENT SLUGS: Use exact agent slugs (e.g., react-developer, not "React Dev")
STANDING ROLES: Always include the Standing Pipeline Roles section — these 3
agents (software-product-owner, enterprise-software-project-manager-controller-pmo,
every-time) are mandatory on every roster regardless of project type.

╔══════════════════════════════════════════════════════════════════════════════╗
║  DELIVERABLE 3: tech-decisions.md                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

File: /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/tech-decisions.md

This is the tech stack recommendation document. It must be grounded in the
vision requirements from the input signals and the architecture decisions
from discovery. All recommendations must be free and open-source.

Structure:

    # Tech Decisions — Tarva Launch

    ## Design Constraints Summary
    <Brief recap of the vision requirements that drive these choices:
    ZUI spatial engine, semantic zoom, morphing transitions, ambient
    telemetry, cinematic motion, receipt rituals, AI-driven features, etc.>

    ---

    ## Core Stack

    | Layer | Choice | Why |
    |-------|--------|-----|
    | Framework | ... | ... |
    | Package Manager | ... | ... |
    | Language | ... | ... |

    ---

    ## Spatial Engine
    <The single most important decision for this project.>

    **Recommendation**: <choice>
    **Alternatives considered**: <what was evaluated and why it lost>
    **Key trade-offs**: <what you gain and what you give up>
    **Integration approach**: <how it layers with the UI framework>

    ---

    ## Motion & Animation

    | Concern | Choice | Why |
    |---------|--------|-----|
    | Layout transitions / morphs | ... | ... |
    | Micro-animations (glyphs, pulses, ticks) | ... | ... |
    | View transitions (scene changes) | ... | ... |

    ---

    ## UI Layer

    | Concern | Choice | Why |
    |---------|--------|-----|
    | Component library | ... | ... |
    | Styling | ... | ... |
    | Design tokens / theming | ... | ... |
    | Icons | ... | ... |

    ---

    ## Data & Telemetry

    | Concern | Choice | Why |
    |---------|--------|-----|
    | Telemetry protocol (Launch ↔ apps) | ... | ... |
    | Launch database (if any) | ... | ... |
    | State management | ... | ... |
    | Real-time updates | ... | ... |

    ---

    ## AI Integration

    | Concern | Choice | Why |
    |---------|--------|-----|
    | AI provider(s) | ... | ... |
    | Camera director / narrated telemetry | ... | ... |
    | Disposable UI generation | ... | ... |

    ---

    ## Auth

    | Concern | Choice | Why |
    |---------|--------|-----|
    | Mechanism | ... | ... |
    | Storage | ... | ... |

    ---

    ## Full Dependency List

    | Package | Version | Purpose | License |
    |---------|---------|---------|---------|
    | ... | ... | ... | MIT / Apache / etc. |

    (Every dependency that will appear in package.json, with license
    verification that all are free and open-source.)

QUALITY BAR: Each recommendation must include WHY it was chosen over
alternatives, not just WHAT was chosen. Trade-offs must be explicit.
The spatial engine section must be especially thorough — this is the
decision that shapes the entire project.

────────────────────────────────────────────────────────────────────────────────
5. SPECIALIST CONSULTATION PROTOCOL
────────────────────────────────────────────────────────────────────────────────

Throughout discovery, bring in specialist agents when you encounter their
domain. Do NOT try to answer domain questions yourself. The consultation
pattern:

  Spawn Task (subagent_type: <specialist-agent>):
    "I'm conducting project discovery for Tarva Launch.

     Context: [relevant background from the input signal]
     Codebase: /Users/jessetms/Sites/tarva-org/tarva-launch
     Relevant files: [list specific files for the agent to read]

     I need your expert assessment on:
     1. [specific domain question]
     2. [specific domain question]
     ...

     For each question, provide:
     - Your recommendation (be specific and actionable)
     - Key constraints or assumptions
     - Risks if this is done incorrectly
     - Any alternative approaches worth considering

     Read the relevant codebase files before answering."

WHEN TO CONSULT:
  - Business/operational rules → your domain expert agent
  - Data model questions → database-architect
  - Cross-cutting architecture → chief-technology-architect
  - UX/flow questions → world-class-ux-designer
  - Requirements ambiguity → software-product-owner
  - Information structure → information-architect
  - Quality/testing strategy → quality-engineering-lead
  - Market/competitive context → world-class-product-strategy-analyst-market

CONFLICT RESOLUTION:
  When specialists disagree, present both recommendations with trade-offs
  in the combined-recommendations.md and flag it as an Open Question for
  Stakeholder. Do NOT silently pick one side.

You can (and should) consult MULTIPLE agents. Run consultations in parallel
when they're independent.

────────────────────────────────────────────────────────────────────────────────
6. MCP TOOLS
────────────────────────────────────────────────────────────────────────────────

Use MCP tools proactively throughout discovery:

FOR REASONING:
  mcp__sequential-thinking__sequentialthinking
    Use when: decomposing the input signal, working through phase ordering,
    resolving conflicting requirements, designing architecture.

FOR RESEARCH:
  mcp__sequential-research__sequential_research_plan + compile
    Use when: you need to understand a library, pattern, or integration
    that the project uses or needs.

FOR VALIDATION:
  mcp__openai-second-opinion__openai_second_opinion
    Use when: checking architecture decisions for blind spots.

  mcp__research-consensus__research_consensus
    Use when: making recommendations on irreversible decisions (schema
    design, auth approach, API contracts).

FOR AGENT SELECTION:
  mcp__tarvacode-agent-selector__select_best_agent
    Use when: you're not sure which agent is the best fit for a work area.

TOOL RELATIONSHIPS:
  Use #every-time for structured self-validation at phase boundaries.
  Use mcp__openai-second-opinion for architecture decisions where you want
  an external check. Use mcp__research-consensus for irreversible decisions
  where multi-model agreement is needed. These are complementary —
  #every-time validates completeness, the others validate correctness.

FOR MEMORY:
  Use memory MCP tools to store key findings during discovery. This helps
  if the session is interrupted and needs to be resumed.

────────────────────────────────────────────────────────────────────────────────
7. CHECK-IN PROTOCOL
────────────────────────────────────────────────────────────────────────────────

Check in with the user at these points. Do NOT proceed silently.

MANDATORY:
  - After Phase 1 (Understand Intent) — confirm you understood correctly
  - After Phase 3 (Assess Current State) — report what exists vs. what's
    missing; flag if effort is larger/smaller/different than expected
  - After Phase 4 (Gaps and Decisions) — present critical gaps and get
    stakeholder input on any that require business decisions
  - Before writing deliverables — present the phase decomposition and
    agent roster for approval
  - After delivering all three files — present the final summary

RECOMMENDED:
  - When you discover something unexpected in the codebase
  - When domain consultations reveal conflicting recommendations
  - When the scope appears significantly larger or smaller than expected
  - When you identify risks that could change the project approach

Check-in format:
  "STATUS: Discovery — Phase N of 7 complete
   COMPLETED: [what was just finished]
   NEXT: [what comes next]
   FINDINGS: [2-3 bullet summary]
   ISSUES: [any concerns, or 'None']
   DECISIONS NEEDED: [anything requiring user input, or 'None']
   Shall I continue?"

────────────────────────────────────────────────────────────────────────────────
8. QUALITY STANDARDS
────────────────────────────────────────────────────────────────────────────────

SPECIFICITY:
  - Every gap resolution must be implementable from the description alone
  - Every architecture decision must reference specific files, types, or
    patterns from the codebase
  - Every work area must name the files/modules it will touch
  - No vague recommendations ("improve performance", "clean up the code")

COMPLETENESS:
  - Every goal in the input signal must map to at least one work area
  - Every work area must have an agent assignment
  - Every critical gap must have a resolution
  - The risk register must include at least the obvious risks
  - Every requirement from the input signal must appear in EITHER a gap
    resolution, an architecture decision, the detailed requirements section,
    OR the deferred items list. Nothing gets silently dropped.

TRACEABILITY:
  - Where possible, reference the source of each requirement
    (e.g., "per Review item #3" or "per PRD Section 2.1")
  - This enables the planner to verify context if needed

ACCURACY:
  - For greenfield: all tech recommendations must be verified as actively
    maintained, free/open-source, and compatible with each other
  - References to existing Tarva app APIs, schemas, or ports must match
    the TARVA-SYSTEM-OVERVIEW.md (the source of truth)
  - Don't assume library compatibility — verify it

HONESTY:
  - If something is unclear, say so and flag it as an open question
  - If a domain question is outside your expertise, consult a specialist
  - If the scope is larger than it appears, say so
  - Don't minimize risks to make the project look easier

UNCERTAINTY HANDLING:
  If you encounter irreconcilable ambiguity in the input signal, conflicting
  specialist recommendations, or a codebase too large to reason about
  holistically, CHECK IN with the user before proceeding. Do not guess
  through high-uncertainty decisions.

────────────────────────────────────────────────────────────────────────────────
9. PROGRESS TRACKER
────────────────────────────────────────────────────────────────────────────────

Create a file: /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/DISCOVERY-LOG.md at the start of
discovery. Update it at each phase boundary.

Structure:

    # Discovery Log — Tarva Launch

    > **Started:** <date>
    > **Last Updated:** <date>
    > **Current Phase:** <phase number and name>
    > **Discovery Depth:** <LITE / STANDARD / DEEP>

    ## Phase Status

    | Phase | Status | Key Findings |
    |-------|--------|--------------|
    | 1. Understand Intent | NOT STARTED | |
    | 2. Explore Codebase | NOT STARTED | |
    | 3. Assess Current State | NOT STARTED | |
    | 4. Identify Gaps & Decisions | NOT STARTED | |
    | 5. Decompose into Work Areas | NOT STARTED | |
    | 6. Select Agents | NOT STARTED | |
    | 7. Validate & Synthesize | NOT STARTED | |

    ## Key Findings (running log)

    ### Phase 1
    - [finding]

    ## Unresolved Questions
    - [question needing stakeholder input]

    ## Specialist Consultations
    | Agent | Question | Response Summary |
    |-------|----------|-----------------|

────────────────────────────────────────────────────────────────────────────────
10. RESUMABILITY
────────────────────────────────────────────────────────────────────────────────

This discovery may span multiple sessions.

AT SESSION START:
  1. Read /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/DISCOVERY-LOG.md
  2. Search memory MCP for prior findings:
     mcp__memory__search_nodes with query: "Tarva Launch discovery"
  3. Report: "Resuming discovery at Phase N. Last completed: Phase M.
     Key findings so far: [summary]. Unresolved questions: [list]."
  4. Continue from the current phase

AT SESSION END (if the user says they're done for now):
  1. Update DISCOVERY-LOG.md with current phase status and findings
  2. Store critical findings in memory MCP
  3. Report what remains to the user

────────────────────────────────────────────────────────────────────────────────
11. COMPLETION PROTOCOL
────────────────────────────────────────────────────────────────────────────────

After producing all three deliverables:

1. Run the Phase 7 validation (already specified)
2. Self-verify all three files against the QUALITY STANDARDS (Section 8)
3. Update DISCOVERY-LOG.md — mark all phases complete
4. Present the final summary to the user:
   - Total phases and work areas proposed
   - Total critical gaps resolved
   - Total architecture decisions made
   - Total risks identified
   - Open questions requiring stakeholder input
   - Deferred items count
   - Tech stack summary (spatial engine + key choices from tech-decisions.md)
   - Confidence level (high/medium/low) with rationale
5. Wait for user acknowledgment before declaring Discovery complete

────────────────────────────────────────────────────────────────────────────────
12. PERMISSIONS
────────────────────────────────────────────────────────────────────────────────

You have READ permission on:
  - /Users/jessetms/Sites/tarva-org/tarva-launch (explore freely, read any file)
  - Any referenced documentation, configs, or schemas

You have WRITE permission on:
  - /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan (for the three deliverables + DISCOVERY-LOG.md)

You may:
  - Read any file in the codebase
  - Run read-only commands (type-checking, listing, etc.)
  - Spawn any agent for consultation
  - Use any MCP tool

You may NOT:
  - Modify any codebase files
  - Create or run database migrations
  - Install or remove dependencies
  - Create git commits or branches
  - Write any code (this is discovery, not implementation)

────────────────────────────────────────────────────────────────────────────────
13. START
────────────────────────────────────────────────────────────────────────────────

1. Read ALL Input Signals:
   - /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/TARVA-SYSTEM-OVERVIEW.md
   - /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/initial-thoughts-1.md
   - /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/storyboard.md
   - /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/spacial-modal-map.md
   - /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/more-for-ui.md
   - /Users/jessetms/Sites/tarva-org/tarva-launch/docs/plans/initial-plan/vision-initiation-pack.md
2. Read the Stakeholder Directives (Section 1b) carefully — these are
   non-negotiable constraints that override conflicting recommendations
3. Assess scope calibration (Section 2): LITE, STANDARD, or DEEP
4. Note: This is a GREENFIELD project — skip Phases 2-3 per the template
5. Check if DISCOVERY-LOG.md exists (resuming?) — if so, read it and
   report current status
6. If starting fresh, create DISCOVERY-LOG.md
7. Report to me:
   - What you understood from the input signals
   - How many items/goals you identified
   - Scope calibration recommendation (LITE/STANDARD/DEEP) and why
   - Any immediate ambiguities that need resolution
8. Wait for my confirmation before proceeding
9. Then execute Phases 4-7 with check-ins as specified
10. Produce the three deliverables (combined-recommendations.md,
    agent-roster.md, tech-decisions.md)
11. Present the completion summary (Section 11)
```
