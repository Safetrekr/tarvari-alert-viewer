# Agent Roster — TarvaRI Alert Viewer — Summaries & More

> **Discovery Pass:** 1 (foundation) | **Date:** 2026-03-05
> **Selection Method:** Task-skill matching against tarvacode agent roster
> **Scope:** Viewer-side (frontend) work only — backend agents are defined in `TarvaRI/plans/touch-ups-3/agent-roster.md`

---

## Assigned Agents

### 1. react-developer

**Work Areas:** 0.1-0.4, 1.1-1.5, 2.1-2.6, 3.1-3.4, 4.1-4.6, 5.1-5.2, 6.1-6.3 (25 WS — primary workhorse)

**Why this agent:** This is overwhelmingly React/TypeScript frontend work — components, hooks, state management, and build configuration. The react-developer agent has the broadest relevant skill set: component architecture, design system integration, performance optimization, TanStack Query patterns, and Next.js configuration.

**Matched Skills:**
| Skill ID | Skill Name | Relevant Work Areas |
|----------|-----------|---------------------|
| UI-001 | Component architecture & composition | 0.4, 2.2-2.3, 3.2, 4.3 (new components) |
| UI-003 | Design system integration | 0.4, 1.2-1.3 (PriorityBadge across surfaces) |
| UI-007 | State management patterns | 1.4, 2.6, 4.6 (Zustand store extensions) |
| PERF-001 | React rendering optimization | 2.2, 4.3 (animation-heavy components) |
| DX-002 | Build tooling & configuration | 6.3 (static export, workspace deps) |

**Agent Activation:** `#rd`

---

### 2. devops-platform-engineer

**Work Areas:** 6.4 (1 WS — GitHub Actions deployment)

**Why this agent:** The GitHub Pages deployment workflow requires CI/CD expertise — pnpm caching, environment secrets, artifact uploads, and GitHub Pages deployment actions. Specialized work that doesn't belong with the React developer.

**Matched Skills:**
| Skill ID | Skill Name | Relevant Work Areas |
|----------|-----------|---------------------|
| CI-001 | CI/CD pipeline design | 6.4 |
| CI-003 | Artifact management | 6.4 (static export → Pages) |

**Agent Activation:** `#dpe`

---

### 3. information-architect (advisory)

**Work Areas:** 0.2 (type taxonomy review), 3.2 (search result IA), 4.3 (geo hierarchy review)

**Why this agent:** The IA specialist already contributed critical findings during discovery (Phase 0 consolidation, achromatic priority channel, threat picture placement). During implementation, the IA reviews type definitions, search result display hierarchy, and the geographic drill-down information architecture.

**Role:** Advisory/reviewer, not primary implementer. Reviews PRs and provides guidance.

**Matched Skills:**
| Skill ID | Skill Name | Relevant Work Areas |
|----------|-----------|---------------------|
| IA-TAX | Taxonomy & controlled vocabulary | 0.2 (priority type hierarchy) |
| IA-NAV | Navigation strategy | 4.3 (World → Region → Country drill-down) |
| IA-SEARCH | Search result architecture | 3.2 (result ranking, snippet display) |

**Agent Activation:** `#ia`

---

### 4. world-class-ux-designer (advisory)

**Work Areas:** 2.2-2.3 (feed strip/panel UX), 2.5 (notification consent flow), 4.3 (slide-over panel UX)

**Why this agent:** The UX specialist already defined the P1/P2 strip placement, two-step notification consent pattern, and 560px slide-over dimensions during discovery. During implementation, the UX validates that built components match the specified interaction patterns.

**Role:** Advisory/reviewer. Validates UX patterns during implementation.

**Matched Skills:**
| Skill ID | Skill Name | Relevant Work Areas |
|----------|-----------|---------------------|
| UX-INT | Interaction design | 2.2-2.3 (strip → panel expand), 2.5 (consent flow) |
| UX-LAYOUT | Layout & composition | 4.3 (slide-over panel spacing) |
| UX-MOTION | Motion design | 3.4 (fast morph timing), 4.3 (slide animation) |

**Agent Activation:** `#wcud`

---

### 5. world-class-secret-service-protective-agent (advisory)

**Work Areas:** 2.2 (P1/P2 strip content review), 4.3 (threat picture content review)

**Why this agent:** The protective intelligence specialist authored the original `summaries-and-more.md` that drives this plan. During implementation, the agent validates that the P1/P2 feed strip and geographic intelligence panel surface the right information at the right prominence for protective operations decision-making.

**Role:** Domain validation only. Reviews content hierarchy and information density, not code.

**Matched Skills:**
| Skill ID | Skill Name | Relevant Work Areas |
|----------|-----------|---------------------|
| B13 | Escalation thresholds | 2.2-2.3 (P1/P2 feed matches 4-tier model) |
| B15 | Geopolitical monitoring | 4.3 (threat picture matches ORB format) |
| D29 | Incident recognition | 2.5 (notification prominence matches threat level) |

**Agent Activation:** `#wcsspapv11`

---

### 6. every-time (validation)

**Work Areas:** Phase 1 intent validation (complete), Phase 7 plan validation (complete)

**Why this agent:** Structured reasoning validation at discovery gates. Already performed intent analysis in Phase 1 and plan validation in Phase 7.

**Role:** Discovery validation only. Not active during implementation.

**Agent Activation:** `#et`

---

## Assignment Matrix

| Work Area | Description | Size | Primary Agent | Advisory |
|-----------|-------------|------|---------------|----------|
| **Phase 0: Consolidate & Prepare** | | | | |
| 0.1 | Simplify CoverageOverviewStats | S | react-developer | — |
| 0.2 | Add priority types to interfaces | S | react-developer | information-architect |
| 0.3 | Install sonner | S | react-developer | — |
| 0.4 | Create PriorityBadge component | S | react-developer | — |
| **Phase 1: Priority Badges** | | | | |
| 1.1 | Extend API types with operational_priority | S | react-developer | — |
| 1.2 | P1/P2 count on CategoryCard | M | react-developer | — |
| 1.3 | Priority in district list + INSPECT | S | react-developer | — |
| 1.4 | Priority filter in coverage store | S | react-developer | — |
| 1.5 | Map marker priority scaling | S | react-developer | — |
| **Phase 2: P1/P2 Feed & Notifications** | | | | |
| 2.1 | usePriorityFeed hook | M | react-developer | — |
| 2.2 | PriorityFeedStrip component | M | react-developer | ux-designer, protective-agent |
| 2.3 | PriorityFeedPanel (expanded) | M | react-developer | ux-designer |
| 2.4 | useRealtimePriorityAlerts hook | M | react-developer | — |
| 2.5 | Notification system | M | react-developer | ux-designer |
| 2.6 | Coverage store extensions | S | react-developer | — |
| **Phase 3: Search Integration** | | | | |
| 3.1 | useIntelSearch hook | M | react-developer | — |
| 3.2 | Async search in CommandPalette | M | react-developer | information-architect |
| 3.3 | Search → fast morph navigation | S | react-developer | — |
| 3.4 | Fast morph in ui.store | S | react-developer | ux-designer |
| **Phase 4: Geographic Intelligence** | | | | |
| 4.1 | useThreatPicture hook | M | react-developer | — |
| 4.2 | useGeoSummaries hook | M | react-developer | — |
| 4.3 | GeoSummaryPanel component | L | react-developer | ux-designer, information-architect, protective-agent |
| 4.4 | Trend indicators on CategoryCard | S | react-developer | — |
| 4.5 | Entry point in stats/HUD | S | react-developer | — |
| 4.6 | Coverage store extensions | S | react-developer | — |
| **Phase 5: Enhanced Filters** | | | | |
| 5.1 | Extend map hook with bbox/source | S | react-developer | — |
| 5.2 | Filter UI in district view | M | react-developer | — |
| **Phase 6: Public Deployment** | | | | |
| 6.1 | Data mode branching in hooks | M | react-developer | — |
| 6.2 | Supabase query functions | M | react-developer | — |
| 6.3 | Static export configuration | M | react-developer | — |
| 6.4 | GitHub Actions deployment | S | devops-platform-engineer | — |

---

## Load Distribution

| Agent | Role | Work Areas | Total Size | Phases Active |
|-------|------|-----------|------------|---------------|
| react-developer | Primary | 25 WS | 12S + 12M + 1L | 0, 1, 2, 3, 4, 5, 6 |
| devops-platform-engineer | Primary | 1 WS | 1S | 6 |
| information-architect | Advisory | 3 WS (review) | — | 0, 3, 4 |
| world-class-ux-designer | Advisory | 5 WS (review) | — | 2, 3, 4 |
| world-class-secret-service-protective-agent | Advisory | 2 WS (review) | — | 2, 4 |
| every-time | Validation | Discovery only | — | Discovery |

**Note on load:** The react-developer agent carries the vast majority of implementation work. This is expected — the viewer is a single-stack (React/TypeScript) project. The advisory agents provide domain expertise during review, not implementation hours. The actual execution burden is lighter than the 25 WS count suggests, since many are small (S) type/store extension tasks.

---

## Standing Pipeline Roles

| Role | Agent | When Active |
|------|-------|-------------|
| Implementation | react-developer | All phases |
| UX validation | world-class-ux-designer | PR reviews for Phases 2, 3, 4 |
| IA validation | information-architect | PR reviews for Phases 0, 3, 4 |
| Domain validation | world-class-secret-service-protective-agent | PR reviews for Phases 2, 4 |
| Deployment | devops-platform-engineer | Phase 6 only |

---

## Agents Considered But Not Assigned

| Agent | Why Considered | Why Not Assigned |
|-------|---------------|-----------------|
| chief-technology-architect | Broad system design expertise | This is a focused frontend implementation plan, not a system architecture exercise. The react-developer is better matched for the actual work. |
| world-class-appsec-security-architect | RLS verification in Phase 6, notification permissions | Security concerns are limited to Phase 6 (public deploy) where RLS is verified by the backend. Browser Notification API permissions are standard and handled by react-developer. |
| quality-engineering-lead | Test planning for new features | Testing strategy was not requested in this discovery scope. QEL should be engaged when implementation begins, to define test plans for each phase. |
| world-class-ui-designer | Visual design of new components | The existing design system (@tarva/ui + Tailwind v4) is well-established. PriorityBadge and new panels should follow existing visual patterns, not require new design exploration. The ux-designer advisory role covers interaction design. |
| software-product-owner | Backlog management, acceptance criteria | SPO already contributed during Phase 4 discovery (revised priority ordering, MVP scope). Acceptance criteria are captured in combined-recommendations.md. No ongoing SPO role needed for this viewer work. |

---

## Implementation Notes

1. **Phased delivery:** Each phase produces a deployable increment. Phase 0 can ship as a standalone PR. Phases 1-6 each add visible user value.

2. **Mock data for early phases:** When backend endpoints aren't ready yet, the react-developer should build with mock data fixtures to validate component behavior. Replace with real hooks when backend lands.

3. **Advisory reviews:** The IA, UX, and protective-agent advisors don't block implementation. Their reviews happen on PRs, not as gating checkpoints. If a review reveals issues, those become follow-up tasks.

4. **Backend coordination:** The viewer team should track backend Phase progress (A → B → C → D → E) and align viewer phase starts with endpoint availability. A shared Slack channel or Jira board is recommended.
