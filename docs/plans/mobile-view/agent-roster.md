# Agent Roster -- Mobile View -- TarvaRI Alert Viewer

## Phase A: Foundation

| WS | Title | Agent |
|----|-------|-------|
| WS-A.1 | Detection + Code Splitting | react-developer |
| WS-A.2 | Mobile Layout Shell | world-class-ui-designer |
| WS-A.3 | Design Tokens + Ambient | world-class-ui-designer |
| WS-A.4 | Viewport Meta + Safe Areas | react-developer |

**Rationale:**
- **WS-A.1:** React/Next.js code splitting with `next/dynamic`, hook creation, and page.tsx extraction is core React architecture work.
- **WS-A.2:** Building the MobileShell layout container, header, and bottom nav with glass effects, safe area insets, and the spatial aesthetic requires visual design system expertise.
- **WS-A.3:** Design tokens (CSS custom properties), typography scales, spacing systems, and the scan line ambient effect require visual design system expertise.
- **WS-A.4:** Viewport meta configuration and safe area inset handling are straightforward but foundational. Promoted from Phase F.

## Phase B: Situation Tab

| WS | Title | Agent |
|----|-------|-------|
| WS-B.1 | Threat Banner + Priority | world-class-ui-designer |
| WS-B.2 | Category Grid | world-class-ux-designer |
| WS-B.3 | Ambient + Protective Ops | world-class-ui-designer |

**Rationale:**
- **WS-B.1:** MobileThreatBanner and MobilePriorityStrip are visually dense, data-driven components where the Oblivion aesthetic is critical. UI design expertise ensures the severity color system, posture badges, and P1 banner feel right.
- **WS-B.2:** MobileCategoryGrid + MobileCategoryCard with tap/long-press gestures, press feedback, sort dampening, and discoverability cues is interaction design work. UX designer ensures the gesture model is intuitive.
- **WS-B.3:** ThreatPulseBackground (CSS animation keyed to posture level), data staleness detection, and connectivity indicator are ambient visual systems. Supporting agent: world-class-ux-designer for discoverability review.

## Phase C: Map + Bottom Sheet

| WS | Title | Agent |
|----|-------|-------|
| WS-C.1 | Bottom Sheet Core | world-class-ux-designer |
| WS-C.2 | Bottom Sheet Advanced | world-class-ui-designer |
| WS-C.3 | Map View | world-class-ux-designer |
| WS-C.4 | Map Interactions | react-developer |
| WS-C.5 | Settings Sheet | react-developer |

**Rationale:**
- **WS-C.1:** Spring physics with motion/react drag handlers, snap point calculations, and scroll conflict resolution require deep understanding of gesture feel. UX designer tunes the spring constants and drag thresholds.
- **WS-C.2:** Fullscreen transitions, glass backdrop, history API integration, and focus trap implementation combine visual design (glass, transitions) with browser API work. UI designer leads.
- **WS-C.3:** MapLibre GL JS wrapper with lazy loading, filter chips, floating controls, and GPS center-on-me involves interaction patterns. UX designer ensures map controls are discoverable and touch-friendly.
- **WS-C.4:** Wiring marker tap events to bottom sheet state and filter chip toggles to Zustand store is straightforward React state management.
- **WS-C.5:** Settings bottom sheet is a standard form layout consuming existing store values. Promoted from Phase F per PO recommendation.

## Phase D: Category Detail + Alert Detail

| WS | Title | Agent |
|----|-------|-------|
| WS-D.1 | Category Detail | information-architect |
| WS-D.2 | Alert Detail + Card | information-architect |
| WS-D.3 | Morph + Navigation | react-developer |

**Rationale:**
- **WS-D.1:** MobileCategoryDetail has complex information hierarchy: summary strip, severity breakdown, List/Map toggle, alert list with sort/filter, source health accordion. Information architect ensures the hierarchy is clear and scannable.
- **WS-D.2:** MobileAlertCard and MobileAlertDetail have dense metadata (severity, priority, confidence, geo scope, timestamps, cross-tab actions). Information architect ensures the content structure serves analyst workflows.
- **WS-D.3:** Wiring the morph state machine fast path, popstate navigation, and cross-tab actions ("View Category", "Show on Map") is React state management + browser API integration.

## Phase E: Intel Tab + Search

| WS | Title | Agent |
|----|-------|-------|
| WS-E.1 | Intel Tab | information-architect |
| WS-E.2 | Region Detail + Search | information-architect |
| WS-E.3 | Cross-Tab Links | react-developer |

**Rationale:**
- **WS-E.1:** IntelTab with priority alerts section and geographic intelligence section requires content strategy decisions about information density and hierarchy.
- **WS-E.2:** MobileSearchOverlay (grouped results, relevance ranking) and MobileRegionDetail (AI summary, key events, recommendations) are information-dense views where IA expertise ensures usability.
- **WS-E.3:** Cross-tab navigation (switching tabs programmatically, opening sheets, flying to map markers) requires understanding the full mobile state architecture. React developer ensures all cross-tab links work end-to-end.

## Phase F: Landscape + Polish + Protective Ops

| WS | Title | Agent |
|----|-------|-------|
| WS-F.1 | Landscape Layouts | world-class-ui-designer |
| WS-F.2 | Accessibility Audit | react-developer |
| WS-F.3 | Performance + PWA | react-developer |
| WS-F.4 | Protective Ops Hooks | world-class-ux-designer |
| WS-F.5 | Pull-to-Refresh + Edge Polish | world-class-ux-designer |

**Rationale:**
- **WS-F.1:** Landscape layout variants for all 3 tabs require visual design decisions (column ratios, control positioning, grid switching from 2-col to 3-col). CSS Grid + media query expertise.
- **WS-F.2:** Accessibility audit requires systematic WCAG evaluation: ARIA roles, focus management, contrast ratios, touch targets, reduced motion. React developer implements all fixes.
- **WS-F.3:** Lighthouse performance profiling, bundle analysis, PWA manifest, and viewport optimization are frontend DevOps tasks.
- **WS-F.4:** useIdleLock, useP1AudioAlert, and haptic feedback involve interaction design decisions (when to trigger, intensity, frequency). UX designer ensures these feel appropriate.
- **WS-F.5:** Pull-to-refresh gesture, edge glow indicators, spring tuning, and scroll-gated glass are interaction polish tasks where UX expertise ensures the feel is right.

## Standing Pipeline Roles

These agents are present on every project roster. They do not own workstreams but have mandatory touchpoints throughout the pipeline lifecycle.

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
| chief-technology-architect | If bundle size targets are missed and code splitting strategy needs rethinking, or if mobile-specific store optimizations are needed |
| world-class-secret-service-protective-agent | Review of protective ops implementations (C1-C7) for field operator viability before launch |
| quality-engineering-lead | If WS-F.2 accessibility audit reveals systemic issues requiring a dedicated quality workstream |

## Workstream Summary

| Agent | Work Areas | Primary Domain |
|-------|-----------|----------------|
| react-developer | WS-A.1, WS-A.4, WS-C.4, WS-C.5, WS-D.3, WS-E.3, WS-F.2, WS-F.3 | React/Next.js architecture, state management, browser APIs, performance |
| world-class-ui-designer | WS-A.2, WS-A.3, WS-B.1, WS-B.3, WS-C.2, WS-F.1 | Design tokens, CSS systems, visual design, glass effects, layout |
| world-class-ux-designer | WS-B.2, WS-C.1, WS-C.3, WS-F.4, WS-F.5 | Gesture design, interaction patterns, spring physics, discoverability |
| information-architect | WS-D.1, WS-D.2, WS-E.1, WS-E.2 | Information hierarchy, content structure, search UX |
