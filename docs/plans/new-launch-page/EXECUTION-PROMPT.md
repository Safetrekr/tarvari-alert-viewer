# Project Execution Prompt — Coverage Grid Launch Page

> Copy everything between the ``` fences into Claude Code to begin execution.
>
> This is the THIRD step in a three-prompt workflow:
>
> 1. **Discovery** — Explore, assess, decompose, recommend ✅
> 2. **Planning** — Turn recommendations into Phase/Workstream/SOW structure ✅
> 3. **Execution** (this prompt) — Implement every workstream in the plan
>
> Prerequisites (all met):
>
> - 8 SOWs across 4 phases, reviewed and gated
> - MASTER-PLAN.md, FINAL-SYNTHESIS.md, FINAL-VALIDATION-REPORT.md exist
> - Each SOW specifies Assigned Agent, Deliverables, and Acceptance Criteria
> - Final verdict: READY WITH CONDITIONS (2 blockers, 7 amendments)
>
> ⚠️ **NO JIRA** — This project uses LOCAL MARKDOWN FILES for all tracking.
> Do not reference, query, or attempt to create Jira tickets.

---

```
I need you to EXECUTE a fully-scoped project plan. The plan has already been
written — your job is to implement it, not redesign it. Every phase, every
workstream, every deliverable must be built. Nothing gets skipped.

Read these instructions fully before taking any action.

────────────────────────────────────────────────────────────────────────────────
1. INPUTS
────────────────────────────────────────────────────────────────────────────────

Project Name:         coverage-grid-launch-page
Codebase Path:        /Users/jessetms/Sites/Safetrekr/tarvari-alert-viewer
Plan Directory:       /Users/jessetms/Sites/Safetrekr/tarvari-alert-viewer/docs/plans/new-launch-page
Master Plan:          docs/plans/new-launch-page/MASTER-PLAN.md
Final Synthesis:      docs/plans/new-launch-page/FINAL-SYNTHESIS.md
Final Validation:     docs/plans/new-launch-page/FINAL-VALIDATION-REPORT.md

Build Command:        pnpm build
Typecheck Command:    pnpm typecheck
Lint Command:         pnpm lint
Format Command:       pnpm format
Test Command:         (none yet — no test runner installed; see Note below)

Discovery Outputs:
  Combined Recommendations: docs/plans/new-launch-page/combined-recommendations.md
  Agent Roster:             docs/plans/new-launch-page/agent-roster.md

NOTE ON TESTS: This project has no test runner (no Vitest, no Jest). The
planning pipeline identified "test debt" as a recurring gap across all 4
phases. If the plan's amendments specify adding test files (e.g., Amendment
A-1: coverage-utils.test.ts), install Vitest as a dev dependency first:
  pnpm add -D vitest @testing-library/react @testing-library/jest-dom
Then add a "test" script to package.json:
  "test": "vitest run", "test:watch": "vitest"
Do this as part of the first workstream that requires tests (WS-1.3).

NOTE ON TRACKING: This project uses LOCAL MARKDOWN FILES only — NOT Jira.
All progress tracking goes in EXECUTION-LOG.md. Do not use Jira MCP tools.

Start by reading MASTER-PLAN.md end to end. Then read FINAL-SYNTHESIS.md
and FINAL-VALIDATION-REPORT.md. These are your source of truth for what to
build. Do NOT improvise scope. If discovery outputs exist, read them for
additional context on decisions made during discovery.

────────────────────────────────────────────────────────────────────────────────
2. PRE-IMPLEMENTATION BLOCKERS
────────────────────────────────────────────────────────────────────────────────

The FINAL-VALIDATION-REPORT.md specifies 2 blocking conditions and 7 SOW
amendments that MUST be resolved before implementation begins. Handle these
FIRST, before writing any feature code.

BLOCK-1: OQ-07 — intel_sources Schema Verification
  Run this SQL against the live Supabase instance:
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'intel_sources'
    ORDER BY ordinal_position;
  Update the IntelSourceRow type definition in the WS-1.3 SOW and
  TYPESCRIPT-TYPES.md spec to match the actual schema.
  Use the Supabase MCP tool (mcp__supabase__execute_sql) if available.

BLOCK-2: CategoryMeta.description Field
  Verify that the CategoryMeta interface (to be created in WS-1.2) includes
  a `description: string` field. The combined-recommendations.md mentions
  "display name, color, and icon" but WS-3.1 uses `.description` extensively.
  Resolution: Add `description: string` to CategoryMeta and populate
  KNOWN_CATEGORIES with brief descriptions (~10-20 words per category).

SOW AMENDMENTS (apply to the implementation, not the SOW files):
  A-1: WS-1.3 — Add coverage-utils.test.ts (install Vitest first)
  A-2: WS-1.3 — R-5 parallel execution is emergency fallback only
  A-3: WS-2.1 — Add data-category-card attribute + variant wiring as explicit ACs
  A-4: WS-2.2 — Add DistrictContent placeholder for category IDs
  A-5: WS-3.1 — Re-verify detail-panel.tsx line numbers after WS-2.2
  A-6: WS-4.1 — Remove MapMarkerLayer dead code (handleClick/onMarkerClick)
  A-7: WS-4.1 — Verify getClusterExpansionZoom API for MapLibre v5

Report the results of BLOCK-1 and BLOCK-2 to me before proceeding.

────────────────────────────────────────────────────────────────────────────────
3. PROTOCOL SCALING
────────────────────────────────────────────────────────────────────────────────

This is a MEDIUM PROJECT (8 workstreams, 4 phases). Apply:
  - Pre-flight: inline for WS-1.1 (SPEC), #every-time for CODE workstreams
  - Post-flight: full protocol for all CODE workstreams
  - Phase gates: full protocol with user check-in
  - EXECUTION-LOG: full structure

────────────────────────────────────────────────────────────────────────────────
4. PROGRESS TRACKER
────────────────────────────────────────────────────────────────────────────────

Create a file: docs/plans/new-launch-page/EXECUTION-LOG.md

This is the living progress tracker. It persists across sessions. Structure:

    # Execution Log

    > **Project:** Coverage Grid Launch Page
    > **Started:** <date>
    > **Last Updated:** <date>
    > **Current Phase:** <phase>
    > **Current Workstream:** <ws-id>

    ## Status Summary

    | Phase | Status | WS Complete | WS Total | Blocking Issues |
    |-------|--------|-------------|----------|-----------------|
    | 1 — Foundation | NOT STARTED | 0 | 3 | |
    | 2 — Core UI | NOT STARTED | 0 | 2 | |
    | 3 — Detail + Chrome | NOT STARTED | 0 | 2 | |
    | 4 — Map | NOT STARTED | 0 | 1 | |

    ## Workstream Checklist

    ### Phase 1: Foundation
    - [ ] WS-1.1: Archive Current Page — `general-purpose` — SPEC — NOT STARTED
    - [ ] WS-1.2: Type Foundation — `react-developer` — CODE — NOT STARTED
    - [ ] WS-1.3: Data Layer — `react-developer` — CODE — NOT STARTED

    ### Phase 2: Core UI
    - [ ] WS-2.1: Coverage Grid — `react-developer` — CODE — NOT STARTED
    - [ ] WS-2.2: Morph Adaptation — `react-developer` — CODE — NOT STARTED

    ### Phase 3: Detail + Chrome
    - [ ] WS-3.1: District View Adaptation — `react-developer` — CODE — NOT STARTED
    - [ ] WS-3.2: Chrome & Panels — `react-developer` — CODE — NOT STARTED

    ### Phase 4: Map
    - [ ] WS-4.1: Map Feature — `react-developer` — CODE — NOT STARTED

    ## In Progress
    (empty)

    ## Completed Work Log
    (empty)

    ## Issues Encountered

    | # | Phase | WS | Issue | Resolution | Status |
    |---|-------|----|-------|------------|--------|

    ## Deviations from Plan

    | # | WS | What Changed | Why | Severity | Approved By |
    |---|-----|-------------|-----|----------|-------------|

Update EXECUTION-LOG.md after EVERY workstream completion. Check the box,
log the work, update the status summary. This file is how we track progress
across sessions and how the user knows what is done.

────────────────────────────────────────────────────────────────────────────────
5. WORKSTREAM TYPES
────────────────────────────────────────────────────────────────────────────────

This project has two workstream types:

SPEC — WS-1.1 only. Deliverable is the archived file.
  Protocol: Read SOW → execute (copy file, remove export) → verify → commit.
  Gates: Inline checklist only.

CODE — WS-1.2 through WS-4.1 (7 workstreams). Deliverables are implementation.
  Protocol: Full 7-step sequence (Section 6).
  Gates: Full pre-flight and post-flight via #every-time.

No MIGRATION workstreams — this project reads from existing Supabase tables.

────────────────────────────────────────────────────────────────────────────────
6. EXECUTION PROTOCOL — PER WORKSTREAM (CODE)
────────────────────────────────────────────────────────────────────────────────

For CODE workstreams, follow this exact sequence. No shortcuts.

STEP 1: READ THE SOW
  Read the full SOW file for this workstream.
  Read any SOW files listed in its "Depends On" field.
  Read the Phase Overview for context.
  Read any referenced codebase files.

STEP 2: PRE-FLIGHT CHECK (#every-time)
  Before writing any code, spawn a Task:
    subagent_type: every-time
    prompt: "Pre-flight check for WS-X.N. Here is the SOW: [full content].
            Here is the current state of the codebase files we will touch:
            [read and include relevant files]. Verify:
            1. All input dependencies are met (files exist, schemas match)
            2. The SOW deliverables are implementable as specified
            3. No conflicts with work already completed in prior workstreams
            4. Acceptance criteria are clear and testable
            Report: GO / NO-GO with specific concerns."

  For WS-1.1 (SPEC, <3 files), use this inline checklist instead:
    [ ] Dependencies exist
    [ ] Files referenced in SOW exist
    [ ] No obvious conflicts with prior work

  If NO-GO: fix the identified issues before proceeding. If the issue
  requires a plan deviation, check in with the user (Section 9).

STEP 3: IMPLEMENT
  Use the agent specified in the SOW's "Assigned Agent" field.
  Spawn a Task with subagent_type set to that agent.

  The implementation prompt MUST include:
    - The full SOW content (objective, scope, deliverables, acceptance criteria)
    - The codebase path
    - All files to read before writing (from SOW Section 3 and Section 4)
    - Outputs from prior workstreams this one depends on
    - Any applicable amendments from FINAL-VALIDATION-REPORT.md Section 5
    - Explicit instruction: "Read all relevant existing files before writing
      any new code. Match existing patterns, naming conventions, and
      architecture. Do not introduce new patterns without justification."

  For SOWs longer than 500 lines, distill a "Task Brief" before spawning:
    - Objective (from Section 1)
    - Deliverables list (from Section 2 In Scope)
    - Acceptance criteria (from Section 5)
    - Key files to read (from Sections 3 and 4)
    - Critical constraints and patterns to follow
  Include the Task Brief in the prompt. Reference the full SOW path for
  the agent to read if it needs more detail.

  For large workstreams (>500 lines of new code or >10 files), break into
  sub-steps and commit after each logical unit. Do NOT write 2000 lines
  in a single pass.

STEP 4: POST-FLIGHT CHECK (#every-time)
  After implementation, spawn a Task:
    subagent_type: every-time
    prompt: "Post-flight check for WS-X.N.
            SOW acceptance criteria: [list from SOW Section 5]
            Amendments applied: [list from FINAL-VALIDATION-REPORT Section 5]
            Files created: [list]
            Files modified: [list]
            Verify:
            1. Every acceptance criterion is met (check each one explicitly)
            2. Amendment requirements are satisfied
            3. No regressions in existing functionality
            4. Code follows existing project patterns
            5. No compilation/lint errors (pnpm typecheck && pnpm lint)
            Report: PASS / FAIL with specific findings."

  If FAIL: fix the findings. Re-run the post-flight check. Max 3 cycles.
  If still failing after 3 cycles, check in with the user.

  IF #every-time is unavailable, use this inline checklist:
    [ ] Each acceptance criterion checked explicitly
    [ ] pnpm typecheck passes
    [ ] pnpm build compiles
    [ ] pnpm lint — no new warnings
    Log [FALLBACK: inline checklist used] in EXECUTION-LOG.md.

STEP 5: VERIFY BUILD
  Run the project's build and verification commands:
    - pnpm typecheck (no errors)
    - pnpm lint (no new warnings)
    - pnpm build (compiles successfully)
    - pnpm test (if test runner installed — all passing)

  If anything fails, fix before proceeding. Do NOT move to the next
  workstream with failures.

STEP 6: COMMIT
  Create a git commit for this workstream's changes.
  Commit type by workstream:
    - chore(phase-1): WS-1.1  — Archive current page
    - feat(phase-1):  WS-1.2  — Type foundation
    - feat(phase-1):  WS-1.3  — Data layer
    - feat(phase-2):  WS-2.1  — Coverage grid
    - feat(phase-2):  WS-2.2  — Morph adaptation
    - feat(phase-3):  WS-3.1  — District view adaptation
    - feat(phase-3):  WS-3.2  — Chrome & panels
    - feat(phase-4):  WS-4.1  — Map feature

  Commit message format:

    <type>(<phase>): WS-X.N — <workstream title>

    <2-3 sentence summary of what was built>

    Deliverables:
    - <list key files created/modified>

    Acceptance criteria verified:
    - AC-1: <criterion> — PASS
    - AC-2: <criterion> — PASS
    ...

    Plan ref: docs/plans/new-launch-page/phase-x-<slug>/ws-x.n-<slug>.md

    Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>

STEP 7: UPDATE TRACKER
  Update EXECUTION-LOG.md:
    - Check off the workstream
    - Add entry to Completed Work Log (with timestamps)
    - Update Status Summary counts
    - Clear the "In Progress" section
    - Log any issues encountered
    - Log any deviations from plan

────────────────────────────────────────────────────────────────────────────────
7. PHASE GATE PROTOCOL
────────────────────────────────────────────────────────────────────────────────

After ALL workstreams in a phase are complete:

7a. PHASE VALIDATION
  Spawn #every-time Task:
    "Phase X is complete. All workstreams:
     [list each WS, its acceptance criteria, and PASS/FAIL status]

     Validate:
     1. All workstreams in this phase are complete and committed
     2. All acceptance criteria across all workstreams are met
     3. pnpm typecheck passes, pnpm build compiles, pnpm lint clean
     4. Cross-workstream integration is sound (outputs feed correctly
        into consuming workstreams)
     5. Phase exit criteria from PHASE-X-OVERVIEW.md are met

     Report: PHASE PASS / PHASE FAIL with findings."

  RECOMMENDED: Spawn #software-product-owner Task (in parallel with above):
    "Phase X is complete. Review from a product perspective:
     [list each WS with its acceptance criteria and deliverables]

     Assess:
     1. Do the deliverables meet the product intent, not just the
        technical specification?
     2. Are there user-facing gaps?
     3. Any product risks carrying into the next phase?

     Report: PRODUCT PASS / PRODUCT CONCERNS with specifics."

7b. CHECK IN WITH USER
  Present a Phase Gate Report:
    - Workstreams completed: [count] / [total]
    - Build/typecheck/lint status
    - Deviations: [count] (list if any)
    - Open issues: [count] (list if any)
    - What the next phase will tackle
    - Any decisions needed from the user before proceeding

  WAIT for user confirmation before starting the next phase.

7c. UPDATE MASTER TRACKER
  Update EXECUTION-LOG.md phase status to COMPLETE.

PARALLEL PHASES: Phase 3 has a parallel execution opportunity.
  WS-3.1 (District View Adaptation) and WS-3.2 (Chrome & Panels) touch
  entirely disjoint file sets and can run in parallel. If using parallel
  execution:
  - Create two worktrees or branches for each workstream
  - Run each with its own pre-flight and post-flight
  - Merge both into the project branch before the Phase 3 gate
  - Run the Phase 3 gate on the merged result
  OR simply run them sequentially — the overhead savings of parallel
  execution may not justify the merge complexity for 2 workstreams.

────────────────────────────────────────────────────────────────────────────────
8. BRANCHING STRATEGY
────────────────────────────────────────────────────────────────────────────────

Create a project branch before starting:
  git checkout -b coverage-grid-launch-page

Work on this branch for the entire project. Do NOT create sub-branches
per workstream (adds merge overhead for no benefit at this scale).

────────────────────────────────────────────────────────────────────────────────
9. CHECK-IN PROTOCOL
────────────────────────────────────────────────────────────────────────────────

Check in with the user at these points. Do NOT proceed silently.

MANDATORY CHECK-INS:
  - Before starting each phase (confirm scope, flag any pending decisions)
  - After completing each phase (report results, get approval to proceed)
  - When a pre-flight check returns NO-GO
  - When a post-flight check fails 3 times
  - When a deviation from the plan is needed
  - When tests fail and the fix is non-obvious
  - After resolving BLOCK-1 and BLOCK-2 (report results before proceeding)

RECOMMENDED CHECK-INS (use judgment):
  - After completing a complex workstream (>5 files changed)
  - When you discover something unexpected in the codebase
  - When a workstream takes significantly longer than estimated
  - Every 3-4 workstreams within a phase, as a progress pulse

Check-in format:
  "STATUS: Execution — Phase X, WS-X.N complete (M of N workstreams done)
   COMPLETED: [what was just finished]
   NEXT: [what comes next]
   FINDINGS: [key observations, or 'None']
   ISSUES: [any concerns, or 'None']
   DECISIONS NEEDED: [anything requiring user input, or 'None']
   Shall I proceed with WS-X.M?"

DEVIATION THRESHOLDS:
  MINOR (log only): Renamed a file, adjusted an implementation detail,
    chose a different library that serves the same purpose.
  MODERATE (check in): Changed a component's API, modified acceptance
    criteria, added/removed a deliverable within a workstream.
  MAJOR (requires user approval before proceeding): Skipped or deferred
    a workstream, changed a cross-workstream interface, modified a
    database schema differently than the SOW specifies.

────────────────────────────────────────────────────────────────────────────────
10. AGENT USAGE
────────────────────────────────────────────────────────────────────────────────

USE THE ASSIGNED AGENT for each workstream. The SOW header specifies:
  > **Assigned Agent:** `<agent-slug>`

Spawn that agent via the Agent tool with subagent_type set to the agent slug.

WORKSTREAM AGENT ASSIGNMENTS:
  WS-1.1: general-purpose (archive task)
  WS-1.2: react-developer
  WS-1.3: react-developer
  WS-2.1: react-developer
  WS-2.2: react-developer
  WS-3.1: react-developer
  WS-3.2: react-developer
  WS-4.1: react-developer

STANDING PIPELINE ROLES (do NOT own workstreams, used at specific touchpoints):
  - #every-time — quality gates (pre/post-flight, phase validation)
  - #software-product-owner — phase gate product review
  - #enterprise-software-project-manager-controller-pmo — escalation only

AGENT RESOLUTION: If you need a specialist agent not listed above, use
mcp__tarvacode-agent-selector__select_best_agent and/or
mcp__skill-resolver__find_skills_for_task in parallel to find the best fit.

EVERY-TIME USAGE: #every-time is your quality gate. Use it for:
  - Pre-flight checks (before implementing)
  - Post-flight checks (after implementing)
  - Phase validation (after all WS in a phase)
  - Any time something feels wrong or inconsistent
  - Complex debugging when you're stuck

PRODUCT OWNER USAGE: #software-product-owner at phase gates. Use when:
  - Phase gate validation — verify deliverables meet product intent
  - When deviations affect user-facing behavior
  - When acceptance criteria are ambiguous during implementation

PMO ESCALATION: #enterprise-software-project-manager-controller-pmo when:
  - 3+ moderate deviations accumulate in a phase
  - Phase takes significantly longer than estimated (see effort estimates below)
  - Cross-phase dependencies need renegotiation

────────────────────────────────────────────────────────────────────────────────
11. MCP TOOLS
────────────────────────────────────────────────────────────────────────────────

You have access to all MCP servers. Use them freely and proactively.

FOR REASONING AND RESEARCH:
  mcp__sequential-thinking__sequentialthinking
    Use when: decomposing complex implementation problems, planning
    multi-file changes, working through edge cases before coding.

  mcp__sequential-research__sequential_research_plan + compile
    Use when: researching MapLibre GL JS v5 API changes (Amendment A-7),
    react-map-gl v8 + React 19 compatibility, or other library questions.

  mcp__openai-second-opinion__openai_second_opinion
    Use when: validating architecture decisions, checking for blind spots
    in complex implementations (morph orchestrator rewrite is a good candidate).

  mcp__research-consensus__research_consensus
    Use when: making irreversible decisions.

FOR DATABASE:
  Use Supabase MCP tools for:
    - Resolving BLOCK-1 (intel_sources schema verification)
    - Validating query shapes during WS-1.3 implementation
    - Checking actual data in intel_sources and intel_normalized tables

FOR BROWSER TESTING:
  Use Playwright MCP tools for:
    - Visual verification of the coverage grid layout
    - Testing morph drill-down animations
    - Verifying panel repositioning (WS-3.2)
    - Screenshot documentation of completed phases

FOR MEMORY:
  Use memory MCP tools to:
    - Store decisions made during implementation
    - Track patterns established in Phase 1 that later phases depend on
    - Recall context when resuming after a break

────────────────────────────────────────────────────────────────────────────────
12. QUALITY STANDARDS
────────────────────────────────────────────────────────────────────────────────

Every piece of code must meet these standards. No exceptions.

CODE QUALITY:
  - Match existing project patterns (naming, file structure, imports)
  - Import `motion/react` (never `framer-motion`)
  - Use `pnpm` (never `npm`)
  - Types in `src/lib/interfaces/` (contracts) or feature-local, never `src/types/`
  - Strict typing — no `any` types unless existing code uses them
  - No new lint warnings
  - No debug logging left in production code
  - Error handling matches existing patterns
  - Accessible UI (ARIA labels, keyboard nav) where applicable

PROJECT-SPECIFIC CONVENTIONS:
  - Severity colors: Extreme (red), Severe (orange), Moderate (yellow), Minor (blue), Unknown (gray)
  - Categories: weather, seismic, health, conflict, humanitarian, infrastructure, fire, flood, storm, other
  - All timestamps ISO 8601 UTC
  - GeoJSON for geometry data
  - CSS module pattern: feature-scoped files (atrium.css, morph.css, coverage.css)
  - @tarva/ui components for shared UI (Card, KpiCard, etc.)

TESTING (when test runner is installed):
  - Pure utility functions get unit tests (coverage-utils.ts, map-utils.ts)
  - Tests describe behavior, not implementation
  - All existing tests continue to pass

COMMITS:
  - One logical unit per commit (final state of a workstream)
  - Commit message references the workstream ID
  - No "WIP" or "fix fix" commits in the final history
  - EXCEPTION: Session breaks. Use wip(<phase>) commits to preserve
    progress. When resuming, squash the WIP into the final commit.

────────────────────────────────────────────────────────────────────────────────
13. ERROR HANDLING
────────────────────────────────────────────────────────────────────────────────

When something goes wrong (and it will), follow this protocol:

BUILD FAILS:
  1. Read the error message carefully
  2. Fix the root cause (not a workaround)
  3. Re-run the build
  4. If the fix requires changing the approach, log it as a deviation

PLAN DOESN'T MATCH REALITY:
  1. The SOWs reference line numbers that may have shifted after prior
     workstreams execute (especially detail-panel.tsx after WS-2.2 —
     see Amendment A-5). ALWAYS re-read the actual file before editing.
  2. Trust the code over the plan's line numbers.
  3. Adapt the implementation to work with the real codebase.
  4. Log the deviation in EXECUTION-LOG.md.
  5. If the deviation is significant, check in with the user.

DEFECT IN PRIOR WORKSTREAM:
  If a pre-flight check reveals a defect in a previously-completed WS:
  1. Log the issue in EXECUTION-LOG.md Issues table with source WS
  2. Create a fix commit: fix(<phase>): WS-X.N — <description>
  3. Re-run the post-flight check for the original WS scope
  4. Log the deviation in EXECUTION-LOG.md

STUCK FOR MORE THAN 15 MINUTES ON ONE ISSUE:
  1. Use #every-time to analyze the problem
  2. Use sequential-thinking to decompose it
  3. Use openai-second-opinion if it's an architecture issue
  4. If still stuck, check in with the user. Do NOT spin.

────────────────────────────────────────────────────────────────────────────────
14. RESUMABILITY
────────────────────────────────────────────────────────────────────────────────

This project may span multiple sessions. At the start of any session:

1. Read docs/plans/new-launch-page/EXECUTION-LOG.md
2. Verify git state matches EXECUTION-LOG.md:
   Run git log --oneline to confirm commits match logged workstreams.
3. Read the Completed Work Log for the current phase to understand
   what was built, what patterns were established, and what files
   were created.
4. Search memory MCP for prior decisions:
   mcp__memory__search_nodes with query: "coverage-grid-launch-page"
5. Identify the current phase and next unchecked workstream
6. Read the SOW for that workstream
7. Read any workstreams it depends on and verify they are checked off
8. Report to the user: "Resuming at Phase X, WS-X.N. Last completed:
   WS-X.M on <date>. <N> of <total> workstreams complete."
9. Continue from where you left off

At the end of any session (if the user says they're done for now):
1. Update EXECUTION-LOG.md with current status (including "In Progress")
2. Store critical decisions and patterns in memory MCP
3. Commit any in-progress work:
   "wip(<phase>): WS-X.N in progress — <what's done, what's remaining>"
4. Report what's left to do

────────────────────────────────────────────────────────────────────────────────
15. EFFORT ESTIMATES (for reference)
────────────────────────────────────────────────────────────────────────────────

These are the PMO estimates from the phase overviews. Use them to gauge
whether implementation is on track.

| Phase | Estimate | Effective Duration | Notes |
|-------|----------|--------------------|-------|
| 1 — Foundation | 11-15h | 11-15h (serial) | WS-1.1: 0.5h, WS-1.2: 4-6h, WS-1.3: 6-8h |
| 2 — Core UI | 18-26h | 18-26h (serial) | WS-2.1: 8-12h, WS-2.2: 10-14h |
| 3 — Detail + Chrome | 14-20h | 10-14h (parallel) | WS-3.1: 10-14h, WS-3.2: 4-6h |
| 4 — Map | 8-12h | 8-12h | WS-4.1 only |
| **Total** | **51-73h** | **47-67h** | Best: 47h/6d, Expected: 57h/7d |

Critical path: WS-1.2 → WS-1.3 → WS-2.1 → WS-2.2 → WS-3.1 → WS-4.1
Off critical path: WS-1.1 (trivial), WS-3.2 (parallel with WS-3.1)

────────────────────────────────────────────────────────────────────────────────
16. COMPLETION
────────────────────────────────────────────────────────────────────────────────

After ALL phases are complete:

1. Run pnpm typecheck && pnpm lint && pnpm build one final time
2. Run pnpm test (if installed) one final time
3. Spawn #every-time for a final project-wide validation:
   "All phases are complete. Validate:
    - Every workstream in EXECUTION-LOG.md is checked off
    - pnpm typecheck passes, pnpm build compiles, pnpm lint clean
    - MASTER-PLAN.md acceptance criteria are met
    - Cross-phase integration is sound
    Report: PROJECT PASS / PROJECT FAIL"

4. Update EXECUTION-LOG.md with final status
5. Report to user:
   - Total workstreams completed (by type: 1 spec + 7 code)
   - Total files created / modified / archived
   - Total tests added (if any)
   - Total commits
   - Any deviations from plan
   - Any open items or recommendations for follow-up
   - Final verdict

────────────────────────────────────────────────────────────────────────────────
17. PERMISSIONS
────────────────────────────────────────────────────────────────────────────────

You have full read/write permission on:
  - /Users/jessetms/Sites/Safetrekr/tarvari-alert-viewer (codebase)
  - docs/plans/new-launch-page/ (plan docs — read SOWs, update tracker)

You may:
  - Create, modify, and delete files in the codebase
  - Run build/lint/typecheck/test commands
  - Create git branches and commits
  - Use any MCP tool available to you
  - Spawn any agent available to you
  - Install dependencies specified in SOWs (maplibre-gl, react-map-gl, vitest)

You may NOT:
  - Push to remote without user approval
  - Modify the SOW files (they are the spec — log deviations instead)
  - Skip workstreams or acceptance criteria
  - Merge branches without user approval
  - Delete existing tests (fix them instead)
  - Use Jira or any external tracker

────────────────────────────────────────────────────────────────────────────────
18. START
────────────────────────────────────────────────────────────────────────────────

1. Read MASTER-PLAN.md
2. Read FINAL-SYNTHESIS.md
3. Read FINAL-VALIDATION-REPORT.md
4. Read combined-recommendations.md and agent-roster.md
5. Check if EXECUTION-LOG.md exists (resuming?) — if so, read it and
   report current status
6. If starting fresh, create EXECUTION-LOG.md with the workstream
   checklist (pre-populated above in Section 4)
7. Resolve BLOCK-1 and BLOCK-2 (Section 2) — report results to user
8. Report to me:
   - BLOCK-1 and BLOCK-2 resolution status
   - Build/typecheck/lint commands verified
   - Recommended starting point (WS-1.1)
   - Any concerns from reading the plan
9. Wait for my GO before writing any feature code
```
