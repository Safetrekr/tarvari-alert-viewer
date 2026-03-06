# Discovery Log — TarvaRI Alert Viewer — Summaries & More

> **Started:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Current Phase:** COMPLETE
> **Discovery Depth:** STANDARD

## Phase Status

| Phase | Status | Key Findings |
|-------|--------|--------------|
| 1. Understand Intent | COMPLETE | 8 stated goals, 8 implicit goals, 8 ambiguities (6 resolved by user) |
| 2. Explore Codebase | COMPLETE | 627-line page.tsx, 5 TanStack hooks, 2 Zustand stores, no notification system |
| 3. Assess Current State | COMPLETE | 5 features completely missing, 3 partially built (infrastructure only) |
| 4. Identify Gaps & Decisions | COMPLETE | 10 architecture decisions, 3 specialist consultations (SPO, UX, IA) |
| 5. Decompose into Work Areas | COMPLETE | 7 phases (0-6), 27 work areas, dependency map |
| 6. Select Agents | COMPLETE | 6 agents: 1 primary (react-developer), 1 deployment (devops), 4 advisory |
| 7. Validate & Synthesize | COMPLETE | All 10 AD confirmed, 3 HIGH / 5 MEDIUM concerns addressed, 3 missing items integrated |

## Key Findings (running log)

### Phase 1
- 8 stated goals across 3 tiers (Tier 1: P1/P2 feed, geo summaries, real-time push; Tier 2: threat picture, priority badges, search; Tier 3: filters, public deploy)
- 8 ambiguities identified; user resolved 6: world-space placement, browser notification + sound, region = logical groupings, aggregate counts first, build with mocks OK, search results navigate to district
- Build-time env var for public/console mode switching (NEXT_PUBLIC_DATA_MODE)

### Phase 2
- No priority field exists on ANY type (IntelFeedItem, MapMarker, CoverageByCategory)
- No notification/toast library installed (no sonner, react-hot-toast, etc.)
- CommandPalette uses sync filtering via synonym ring; no async data fetching pattern
- Supabase client.ts exists but unused by data hooks (all go through tarvariGet)
- next.config.ts is minimal (only transpilePackages: ['@tarva/ui'])
- District view is self-contained overlay at z-30 with header, content, dock

### Phase 3
- SG-1 (P1/P2 Feed): COMPLETELY MISSING — no priority type, no feed hook, no strip component
- SG-2 (Geo Summaries): COMPLETELY MISSING — no summary types/hooks/components
- SG-3 (Real-time Push): COMPLETELY MISSING — no channels, no toast, no Browser Notification API
- SG-4 (Threat Picture): COMPLETELY MISSING — no hook, no types, no aggregation
- SG-5 (Priority Badges): COMPLETELY MISSING — no priority on any existing type
- SG-6 (Search): PARTIALLY BUILT — CommandPalette exists, needs async search group
- SG-7 (Enhanced Filters): PARTIALLY BUILT — time range selector exists, no bbox/source
- SG-8 (Public Deploy): PARTIALLY BUILT — Supabase client exists, no export config/workflow

### Phase 4
- 10 architecture decisions made (AD-1 through AD-10)
- AD-1: Priority uses achromatic visual channel (shape/weight), severity keeps color — per Treisman 1985
- AD-2: P1/P2 strip is world-space at y=-842, in own ZoomGate, outside morph-scatter
- AD-3: Geo summaries in 560px slide-over at z-42 (UX + IA consensus)
- AD-4: Fast morph (300ms) for search-initiated navigation
- AD-5: sonner for toasts, AD-6: two-step Browser Notification consent
- AD-7: 11 travel-security geographic regions (not UN M.49)
- AD-8: Threat picture data lives in geo summary panel, not standalone
- AD-9: Phase 0 consolidation of redundant stats before adding new elements
- AD-10: NEXT_PUBLIC_DATA_MODE build-time env var for public/console switching
- SPO promoted SG-5 (Priority Badges) to Tier 1 prerequisite
- IA identified Phase 0 consolidation need + achromatic priority channel
- UX defined strip placement, slide-over dimensions, fast morph timing, two-step consent

### Phase 5
- 7 phases (0-6) containing 27 work areas
- Phase 0: Consolidate (4 WS, ~1 day, no backend dep)
- Phase 1: Priority Badges (5 WS, ~2-3 days, backend Phase A)
- Phase 2: P1/P2 Feed + Notifications (6 WS, ~4-5 days, backend Phase B)
- Phase 3: Search Integration (4 WS, ~3 days, backend Phase C)
- Phase 4: Geographic Intelligence (6 WS, ~4-6 days, backend Phase D)
- Phase 5: Enhanced Filters (2 WS, ~1-2 days, backend Phase B.3)
- Phase 6: Public Deployment (4 WS, ~3-4 days, backend Phase E)
- Total estimated effort: 12-18 days

### Phase 6
- 6 agents assigned: react-developer (primary, 25 WS), devops-platform-engineer (1 WS), plus 4 advisory
- Advisory: information-architect, world-class-ux-designer, world-class-secret-service-protective-agent, every-time
- react-developer carries all implementation; frontend is single-stack (React/TypeScript)

### Phase 7
- #every-time validation: all 10 architecture decisions CONFIRMED SOUND
- 3 HIGH concerns raised and mitigated (Realtime divergence, @tarva/ui CI, fast morph risk)
- 5 MEDIUM concerns addressed (Phase 5 ordering, search→morph dep, z-index, notification denied, useCategoryIntel)
- 3 missing items found and integrated (settings.store toggle, typecheck gating, useCategoryIntel types)

## Unresolved Questions (all resolved)
- ~~What toast/notification library to use?~~ → sonner (AD-5)
- ~~Should P1/P2 feed be world-space or viewport-fixed?~~ → world-space at y=-842 (AD-2)

## Specialist Consultations
| Agent | Question | Response Summary |
|-------|----------|-----------------|
| #every-time | Phase 1 intent analysis | 8 goals, 8 implicit goals, 9 constraints, 8 risks identified |
| #spo | Phase 4 priority/scope review | Promoted SG-5 to Tier 1, defined MVP scope, acceptance criteria, hidden complexity warnings |
| #wcud | Phase 4 UX/interaction design | Strip at y=-842, two-step notification consent, 560px slide-over, fast morph 300ms |
| #ia | Phase 4 information architecture | 11 regions, achromatic priority, Phase 0 consolidation, threat picture in geo panel |
| #every-time | Phase 7 plan validation | All 10 AD confirmed, 3 HIGH / 5 MEDIUM concerns, 3 missing items |

## Deliverables
| File | Status |
|------|--------|
| `combined-recommendations.md` | COMPLETE — 7 phases, 27 WS, 10 AD, risk register, acceptance criteria |
| `agent-roster.md` | COMPLETE — 6 agents, assignment matrix, load distribution |
| `DISCOVERY-LOG.md` | COMPLETE — this file |
