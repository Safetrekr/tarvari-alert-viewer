# Project Execution Prompt — Reusable Template

> Copy everything between the ``` fences into Claude Code to begin execution.
> All placeholders have been filled in for this project.
>
> This is the THIRD step in a three-prompt workflow:
>
> 1. **Discovery** — Explore, assess, decompose, recommend
> 2. **Planning** — Turn recommendations into Phase/Workstream/SOW structure
> 3. **Execution** (this prompt) — Implement every workstream in the plan
>
> Prerequisites:
>
> - A completed project plan using the Phase/Workstream/SOW structure
> - MASTER-PLAN.md and FINAL-SYNTHESIS.md exist in the plan directory
> - Each phase has a directory with SOW files (ws-N.M-<slug>.md)
> - Each SOW specifies an Assigned Agent, Deliverables, and Acceptance Criteria

---

```
I need you to EXECUTE a fully-scoped project plan. The plan has already been
written — your job is to implement it, not redesign it. Every phase, every
workstream, every deliverable must be built. Nothing gets skipped.

Read these instructions fully before taking any action.

────────────────────────────────────────────────────────────────────────────────
1. INPUTS
────────────────────────────────────────────────────────────────────────────────

Project Name:         Mobile View -- TarvaRI Alert Viewer
Codebase Path:        /Users/jessetms/Sites/Safetrekr/tarvari-alert-viewer
Plan Directory:       /Users/jessetms/Sites/Safetrekr/tarvari-alert-viewer/docs/plans/mobile-view
Master Plan:          docs/plans/mobile-view/MASTER-PLAN.md
Final Synthesis:      docs/plans/mobile-view/FINAL-SYNTHESIS.md

Build Command:        pnpm build
Test Command:         pnpm typecheck          (no test suite configured)
Lint Command:         pnpm lint
Typecheck Command:    pnpm typecheck

Discovery Outputs (supplementary context):
  Combined Recommendations: docs/plans/mobile-view/combined-recommendations.md
  Agent Roster:             docs/plans/mobile-view/agent-roster.md

Start by reading MASTER-PLAN.md end to end. Then read FINAL-SYNTHESIS.md.
These are your source of truth for what to build. Do NOT improvise scope.
Read the discovery outputs for additional context on decisions made during
discovery.

────────────────────────────────────────────────────────────────────────────────
2. PROTOCOL SCALING
────────────────────────────────────────────────────────────────────────────────

Adjust protocol weight based on project size:

SMALL PROJECT (1-5 workstreams, 1 phase):
  - Skip pre-flight checks (do inline sanity check instead)
  - Post-flight: use inline checklist, not #every-time
  - Phase gate: combined with completion check
  - EXECUTION-LOG: simplified (checklist + brief notes only)

MEDIUM PROJECT (6-15 workstreams, 2-3 phases):
  - Pre-flight: inline for SPEC workstreams, #every-time for CODE/MIGRATION
  - Post-flight: full protocol
  - Phase gates: full protocol
  - EXECUTION-LOG: full structure

LARGE PROJECT (16+ workstreams, 4+ phases):
  - Full protocol as specified
  - Add context management and memory MCP usage
  - Consider parallel phase execution where plan allows

────────────────────────────────────────────────────────────────────────────────
3. PROGRESS TRACKER
────────────────────────────────────────────────────────────────────────────────

Create a file: docs/plans/mobile-view/EXECUTION-LOG.md

This is the living progress tracker. It persists across sessions. Structure:

    # Execution Log

    > **Project:** Mobile View -- TarvaRI Alert Viewer
    > **Started:** <date>
    > **Last Updated:** <date>
    > **Current Phase:** <phase>
    > **Current Workstream:** <ws-id>

    ## Status Summary

    | Phase | Status | WS Complete | WS Total | Blocking Issues |
    |-------|--------|-------------|----------|-----------------|
    | <id>  | <NOT STARTED / IN PROGRESS / COMPLETE> | 0 | N | |
    ...

    ## Workstream Checklist

    ### Phase <id>: <title>
    - [ ] WS-<id>.1: <title> — <agent> — <type> — <status>
    - [ ] WS-<id>.2: <title> — <agent> — <type> — <status>
    ...

    (repeat for each phase)

    ## In Progress

    **WS-X.N: <title>**
      Steps completed: M of 7
      Files written so far: [list]
      Remaining: [what's left]
      Blocked by: [nothing / issue description]

    ## Completed Work Log

    ### <date> — WS-X.N: <title>
    **Started:** <timestamp>
    **Finished:** <timestamp>
    **Agent:** <slug>
    **Type:** <SPEC / CODE / MIGRATION>
    **Files created:** <list>
    **Files modified:** <list>
    **Tests:** <pass count> / <total> passing
    **Committed:** <commit hash>
    **Notes:** <anything notable>

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
4. WORKSTREAM TYPES
────────────────────────────────────────────────────────────────────────────────

Classify each workstream before executing. The type determines the protocol:

SPEC — Deliverable is the SOW document itself (requirements, designs, specs).
  Protocol: Read SOW → verify completeness and consistency with
  FINAL-SYNTHESIS → check off → no commit needed.
  Gates: No pre-flight. Post-flight = verify SOW content is complete.

CODE — Deliverable is implementation (features, components, services, tests).
  Protocol: Full 7-step sequence (Section 5).
  Gates: Full pre-flight and post-flight via #every-time.

MIGRATION — Deliverable is a database migration.
  Protocol: Full 7-step sequence PLUS:
  - Dry-run the migration before applying
  - Verify rollback path exists
  - Apply and verify BEFORE implementing code that depends on schema change
  - Number sequentially by timestamp (YYYYMMDDHHMMSS_description.sql)
  Gates: Full pre/post-flight plus migration-specific verification.

If the SOW doesn't clearly indicate a type, infer it from the deliverables
and assigned agent. Flag ambiguous cases at the Phase check-in.

────────────────────────────────────────────────────────────────────────────────
5. EXECUTION PROTOCOL — PER WORKSTREAM (CODE AND MIGRATION)
────────────────────────────────────────────────────────────────────────────────

For CODE and MIGRATION workstreams, follow this exact sequence. No shortcuts.

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

  For SMALL CODE workstreams (<100 lines, <3 files), use this inline
  checklist instead of spawning #every-time:
    [ ] Dependencies exist
    [ ] Files referenced in SOW exist
    [ ] No obvious conflicts with prior work

  If NO-GO: fix the identified issues before proceeding. If the issue
  requires a plan deviation, check in with the user (Section 8).

STEP 3: IMPLEMENT
  Use the agent specified in the SOW's "Assigned Agent" field.
  Spawn a Task with subagent_type set to that agent.

  The implementation prompt MUST include:
    - The full SOW content (objective, scope, deliverables, acceptance criteria)
    - The codebase path
    - All files to read before writing (from SOW Section 3 and Section 4)
    - Outputs from prior workstreams this one depends on
    - Explicit instruction: "Read all relevant existing files before writing
      any new code. Match existing patterns, naming conventions, and
      architecture. Do not introduce new patterns without justification."
    - Explicit instruction: "Write tests for all new functionality.
      Ensure existing tests still pass."

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
            Files created: [list]
            Files modified: [list]
            Verify:
            1. Every acceptance criterion is met (check each one explicitly)
            2. No regressions in existing functionality
            3. Code follows existing project patterns
            4. Tests pass
            5. No compilation/lint errors
            Report: PASS / FAIL with specific findings."

  If FAIL: fix the findings. Re-run the post-flight check. Max 3 cycles.
  If still failing after 3 cycles, check in with the user.

  IF #every-time is unavailable, use this inline checklist:
    [ ] Each acceptance criterion checked explicitly
    [ ] Tests pass
    [ ] Build compiles
    [ ] No lint errors
    Log [FALLBACK: inline checklist used] in EXECUTION-LOG.md.

STEP 5: VERIFY BUILD AND TESTS
  Run the project's build and test commands:
    - pnpm typecheck (no errors)
    - pnpm lint (no new warnings)
    - pnpm typecheck (all passing)

  If tests fail, fix them before proceeding. Do NOT move to the next
  workstream with failing tests.

STEP 6: COMMIT
  Create a git commit for this workstream's changes.
  Commit type by workstream:
    - feat(<phase>)       — New feature implementation
    - fix(<phase>)        — Bug fix or defect correction
    - docs(<phase>)       — Spec-only workstreams, documentation
    - chore(<phase>)      — Infrastructure, tooling, refactoring
    - test(<phase>)       — Test-only workstreams
    - migration(<phase>)  — Database schema changes

  Commit message format:

    <type>(<phase>): WS-X.N — <workstream title>

    <2-3 sentence summary of what was built>

    Deliverables:
    - <list key files created/modified>

    Acceptance criteria verified:
    - AC-X.N.1: <criterion> — PASS
    - AC-X.N.2: <criterion> — PASS

    Plan ref: docs/plans/mobile-view/phase-x-<slug>/ws-x.n-<slug>.md

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
6. PHASE GATE PROTOCOL
────────────────────────────────────────────────────────────────────────────────

After ALL workstreams in a phase are complete:

6a. PHASE VALIDATION
  Spawn #every-time Task:
    "Phase X is complete. All workstreams:
     [list each WS, its acceptance criteria, and PASS/FAIL status]

     Validate:
     1. All workstreams in this phase are complete and committed
     2. All acceptance criteria across all workstreams are met
     3. Build compiles, tests pass, no lint errors
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
     2. Are there user-facing gaps — things a user would expect that
        weren't built?
     3. Are the acceptance criteria actually verifiable from a user's
        perspective?
     4. Any product risks carrying into the next phase?

     Report: PRODUCT PASS / PRODUCT CONCERNS with specifics."

6b. CHECK IN WITH USER
  Present a Phase Gate Report:
    - Workstreams completed: [count] / [total]
    - Workstream types: [N spec, M code, K migration]
    - Tests: [count] passing, [count] failing
    - Deviations: [count] (list if any)
    - Open issues: [count] (list if any)
    - What the next phase will tackle
    - Any decisions needed from the user before proceeding

  WAIT for user confirmation before starting the next phase.

6c. UPDATE MASTER TRACKER
  Update EXECUTION-LOG.md phase status to COMPLETE.

PARALLEL PHASES: If MASTER-PLAN identifies phases that can run in parallel:
  - Execute on separate git branches (one per phase)
  - Run phase gates independently
  - Merge branches with integration validation before starting
    dependent phases
  - Check in with user before starting parallel tracks

────────────────────────────────────────────────────────────────────────────────
7. BRANCHING STRATEGY
────────────────────────────────────────────────────────────────────────────────

Create a project branch before starting: Mobile View -- TarvaRI Alert Viewer as kebab-case
(e.g., review-4, agent-skills-update-v2).

Work on this branch for the entire project. Do NOT create sub-branches
per workstream (adds merge overhead).

If parallel phases are needed, create phase branches:
  <project-branch>/phase-c, <project-branch>/phase-d
Merge phase branches back to the project branch after phase gate passes.

────────────────────────────────────────────────────────────────────────────────
8. CHECK-IN PROTOCOL
────────────────────────────────────────────────────────────────────────────────

Check in with the user at these points. Do NOT proceed silently.

MANDATORY CHECK-INS:
  - Before starting each phase (confirm scope, flag any pending decisions)
  - After completing each phase (report results, get approval to proceed)
  - When a pre-flight check returns NO-GO
  - When a post-flight check fails 3 times
  - When a deviation from the plan is needed
  - When a blocking decision is required (e.g., MASTER-PLAN.md Decision Log
    items marked PENDING)
  - When tests fail and the fix is non-obvious

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
9. AGENT USAGE
────────────────────────────────────────────────────────────────────────────────

USE THE ASSIGNED AGENT for each workstream. The SOW header specifies:
  > **Assigned Agent:** `<agent-slug>`

Spawn that agent via Task with subagent_type set to the agent slug.

STANDING PIPELINE ROLES: The agent-roster.md includes a "Standing Pipeline
Roles" section defining three agents that are always present on every project:
  - #every-time — quality gates (pre/post-flight, phase validation)
  - #software-product-owner — phase gate product review, deviation consultation
  - #enterprise-software-project-manager-controller-pmo — escalation only
These agents do NOT own workstreams but have mandatory touchpoints described
in the roster. Consult the roster for when to invoke each one.

ADDITIONAL AGENTS: You are free to call any agent at any time if the work
requires it. Use your judgment — if a workstream touches a domain that
another agent specializes in, bring them in. Examples:
  - A database agent for schema questions during a UI workstream
  - A quality agent for test strategy during implementation
  - An architecture agent for cross-cutting design decisions
  - A product agent for requirements clarification
  - A domain expert agent for business logic validation

AGENT RESOLUTION: If you need an agent not specified in the plan, use
mcp__tarvacode-agent-selector__select_best_agent if available. Otherwise,
match the workstream's primary domain to the most relevant agent in your
fleet.

EVERY-TIME USAGE: #every-time is your quality gate. Use it for:
  - Pre-flight checks (before implementing)
  - Post-flight checks (after implementing)
  - Phase validation (after all WS in a phase)
  - Any time something feels wrong or inconsistent
  - Complex debugging when you're stuck

PRODUCT OWNER USAGE: #software-product-owner at phase gates. Use when:
  - Phase gate validation (Section 6a) — verify acceptance criteria meet
    product intent, not just technical correctness
  - When deviations from plan affect user-facing behavior
  - When acceptance criteria are ambiguous during implementation

PMO ESCALATION: #enterprise-software-project-manager-controller-pmo when:
  - Deviations from plan accumulate (3+ moderate deviations in a phase)
  - Resource conflicts arise (agent needed in parallel by multiple WS)
  - Phase is taking significantly longer than estimated
  - Cross-phase dependencies need renegotiation
  Do NOT use PMO for individual workstream execution — it's a program-level
  coordination role, not a task-level role.

────────────────────────────────────────────────────────────────────────────────
10. MCP TOOLS
────────────────────────────────────────────────────────────────────────────────

You have access to all MCP servers. Use them freely and proactively.

FOR REASONING AND RESEARCH:
  mcp__sequential-thinking__sequentialthinking
    Use when: decomposing complex implementation problems, planning
    multi-file changes, working through edge cases before coding.

  mcp__sequential-research__sequential_research_plan + compile
    Use when: you need to research a library, pattern, or approach
    that isn't clear from the codebase alone.

  mcp__openai-second-opinion__openai_second_opinion
    Use when: validating architecture decisions, checking for blind spots
    in complex implementations, reviewing security-sensitive code.

  mcp__research-consensus__research_consensus
    Use when: making irreversible decisions (schema migrations, API
    contracts, authentication flows).

FOR DATABASE:
  Use Supabase MCP tools (or equivalent) for:
    - Validating migrations before applying
    - Checking existing schema during implementation
    - Testing RLS policies / permissions
    - Verifying serverless functions

FOR BROWSER TESTING:
  Use Playwright MCP tools for:
    - Visual verification of UI changes
    - End-to-end flow testing
    - Screenshot documentation of completed work

FOR MEMORY:
  Use memory MCP tools to:
    - Store decisions made during implementation
    - Track patterns established in earlier phases
    - Recall context when resuming after a break

Use any other MCP tools available to you when they would improve the work.

────────────────────────────────────────────────────────────────────────────────
11. QUALITY STANDARDS
────────────────────────────────────────────────────────────────────────────────

Every piece of code must meet these standards. No exceptions.

CODE QUALITY:
  - Match existing project patterns (naming, file structure, imports)
  - Strict typing — no `any` types unless existing code uses them
  - No new lint warnings
  - No debug logging left in production code
  - Error handling matches existing patterns
  - Accessible UI (ARIA labels, keyboard nav) where applicable

TESTING:
  - Every new function/component has tests
  - Every bug fix has a regression test
  - All existing tests continue to pass
  - Test names describe behavior, not implementation

COMMITS:
  - One logical unit per commit (final state of a workstream)
  - Commit message references the workstream ID
  - No "WIP" or "fix fix" commits in the final history
  - EXCEPTION: Session breaks. Use wip(<phase>) commits to preserve
    progress. When resuming, squash the WIP commit into the final
    workstream commit before updating the tracker.

MIGRATIONS:
  - Number sequentially by timestamp (YYYYMMDDHHMMSS_description.sql)
  - Apply and verify before implementing code that depends on the change
  - Include a rollback/down migration path when possible
  - Dry-run against a test database before applying to development

DOCUMENTATION:
  - Update any existing docs affected by changes
  - Add docstrings to public functions/components if the project uses them
  - Do NOT create new doc files unless the SOW specifies it

SECURITY:
  - Never log, commit, or paste secrets/tokens/API keys
  - Use environment variables for all credentials
  - If a tool requires auth, verify it's configured before use
  - Never store sensitive data in EXECUTION-LOG.md

────────────────────────────────────────────────────────────────────────────────
12. ERROR HANDLING
────────────────────────────────────────────────────────────────────────────────

When something goes wrong (and it will), follow this protocol:

BUILD FAILS:
  1. Read the error message carefully
  2. Fix the root cause (not a workaround)
  3. Re-run the build
  4. If the fix requires changing the approach, log it as a deviation

TESTS FAIL:
  1. Determine if it's a regression (existing test broke) or a gap (new
     test failing)
  2. For regressions: fix the code, not the test (unless the test is wrong)
  3. For gaps: implement the missing functionality
  4. Never delete or skip a failing test

PLAN DOESN'T MATCH REALITY:
  1. The codebase may have drifted from what the plan assumed
  2. Read the actual code. Trust the code over the plan.
  3. Adapt the implementation to work with the real codebase
  4. Log the deviation in EXECUTION-LOG.md
  5. If the deviation is significant, check in with the user

DEFECT IN PRIOR WORKSTREAM:
  If a pre-flight check reveals a defect in a previously-completed WS:
  1. Log the issue in EXECUTION-LOG.md Issues table with source WS
  2. Assess: can it be fixed inline, or does it need a dedicated fix?
  3. If dedicated fix: create a fix commit referencing the original WS
     (fix(<phase>): WS-X.N — <description of defect>)
  4. Re-run the post-flight check for the original WS scope
  5. Log the deviation in EXECUTION-LOG.md
  6. If the fix changes acceptance criteria, check in with the user

STUCK FOR MORE THAN 15 MINUTES ON ONE ISSUE:
  1. Use #every-time to analyze the problem
  2. Use sequential-thinking to decompose it
  3. Use openai-second-opinion if it's an architecture issue
  4. If still stuck, check in with the user. Do NOT spin.

────────────────────────────────────────────────────────────────────────────────
13. RESUMABILITY
────────────────────────────────────────────────────────────────────────────────

This project may span multiple sessions. At the start of any session:

1. Read docs/plans/mobile-view/EXECUTION-LOG.md
2. Verify git state matches EXECUTION-LOG.md:
   Run git log --oneline to confirm commits match logged workstreams.
   If discrepancies exist, reconcile before proceeding and log the
   finding in the Issues table.
3. Read the Completed Work Log for the current phase to understand
   what was built, what patterns were established, and what files
   were created. This is essential context for the next workstream.
4. Search memory MCP for prior decisions:
   mcp__memory__search_nodes with query: "Mobile View -- TarvaRI Alert Viewer"
   Review any stored entities for decisions, patterns, and constraints.
5. Identify the current phase and next unchecked workstream
6. Read the SOW for that workstream
7. Read any workstreams it depends on and verify they are checked off
8. Report to the user: "Resuming at Phase X, WS-X.N. Last completed:
   WS-X.M on <date>. <N> of <total> workstreams complete."
9. Continue from where you left off

At the end of any session (if the user says they're done for now):
1. Update EXECUTION-LOG.md with current status (including "In Progress")
2. Store critical decisions and patterns in memory MCP
3. Commit any in-progress work with message:
   "wip(<phase>): WS-X.N in progress — <what's done, what's remaining>"
4. Report what's left to do

CONTEXT MANAGEMENT (for large projects):
  At the start of each phase, note in EXECUTION-LOG.md:
    - Key decisions made in prior phases
    - Shared patterns established (naming conventions, component patterns)
    - Files created that downstream workstreams depend on
    - Open risks carried forward

  Use memory MCP (mcp__memory__create_entities) to store critical decisions
  and patterns that must survive across sessions.

────────────────────────────────────────────────────────────────────────────────
14. COMPLETION
────────────────────────────────────────────────────────────────────────────────

After ALL phases are complete:

1. Run the full test suite one final time
2. Run the build one final time
3. Spawn #every-time for a final project-wide validation:
   "All phases are complete. Validate:
    - Every workstream in EXECUTION-LOG.md is checked off
    - Build compiles cleanly
    - All tests pass
    - No lint warnings
    - MASTER-PLAN.md acceptance criteria are met
    - Cross-phase integration is sound
    Report: PROJECT PASS / PROJECT FAIL"

4. Update EXECUTION-LOG.md with final status
5. Report to user:
   - Total workstreams completed (by type: spec/code/migration)
   - Total files created / modified
   - Total tests added
   - Total commits
   - Any deviations from plan
   - Any open items or recommendations for follow-up
   - Final verdict

────────────────────────────────────────────────────────────────────────────────
15. PERMISSIONS
────────────────────────────────────────────────────────────────────────────────

You have full read/write permission on:
  - /Users/jessetms/Sites/Safetrekr/tarvari-alert-viewer (the project codebase — this is where code goes)
  - docs/plans/mobile-view (the plan docs — for reading SOWs and updating tracker)

You may:
  - Create, modify, and delete files in the codebase
  - Run build commands, test commands, and linters
  - Create git branches and commits
  - Use any MCP tool available to you
  - Spawn any agent available to you
  - Install dependencies if a SOW specifies them

You may NOT:
  - Push to remote without user approval
  - Modify the SOW files (they are the spec — log deviations instead)
  - Skip workstreams or acceptance criteria
  - Merge branches without user approval
  - Delete existing tests (fix them instead)

────────────────────────────────────────────────────────────────────────────────
16. START
────────────────────────────────────────────────────────────────────────────────

1. Read MASTER-PLAN.md
2. Read FINAL-SYNTHESIS.md
3. Read discovery outputs if available (combined-recommendations.md,
   agent-roster.md)
4. Check if EXECUTION-LOG.md exists (resuming?) — if so, read it and
   report current status
5. If starting fresh, create EXECUTION-LOG.md with the full workstream
   checklist populated from all phase SOW files (classifying each as
   SPEC, CODE, or MIGRATION)
6. Report to me:
   - Total phases and workstreams (by type)
   - Any PENDING decisions that block implementation
   - Build/test/lint commands identified
   - Recommended starting point
   - Any concerns from reading the plan
7. Wait for my GO before writing any code
```
