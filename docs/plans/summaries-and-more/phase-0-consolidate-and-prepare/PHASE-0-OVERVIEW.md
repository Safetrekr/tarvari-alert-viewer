# Phase 0 Overview: Consolidate & Prepare

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** combined-recommendations.md
> **Date:** 2026-03-05
> **Workstreams:** WS-0.1, WS-0.2, WS-0.3, WS-0.4

## 1. Executive Summary

Phase 0 establishes the prerequisites for all subsequent viewer work (Phases 1-6) without requiring any backend API changes. It accomplishes three things: removing visual clutter from the stats panel to make room for future elements (WS-0.1), defining the type system and metadata contract for the achromatic priority channel that will appear on every alert surface (WS-0.2 + WS-0.4), and installing the toast notification infrastructure that the real-time alerting system will build upon (WS-0.3). All four workstreams are Size S and the phase is estimated at approximately one day of effort. The critical path runs through WS-0.2 into WS-0.4, as the PriorityBadge component depends on the priority type definitions. The remaining two workstreams are fully independent and can execute in parallel with each other and with WS-0.2.

## 2. Key Findings (grouped by theme, not by workstream)

### Type Foundation (WS-0.2, WS-0.4)

The priority type system is the single most consequential deliverable of Phase 0. The `OperationalPriority` union type (`'P1' | 'P2' | 'P3' | 'P4'`) and the `PRIORITY_META` record establish a contract consumed by at least 8 downstream workstreams across Phases 1-3 (WS-0.4, WS-1.1, WS-1.2, WS-1.3, WS-1.4, WS-1.5, WS-2.2, WS-3.2). The design follows the existing derivation pattern in `coverage.ts` where `SeverityLevel` is derived from the `SEVERITY_LEVELS` const array, ensuring consistency within the module.

The `PriorityMeta` interface enforces AD-1 (achromatic priority channel) at the type level by deliberately excluding all color-related fields. This structural enforcement is stronger than a code review convention and prevents downstream consumers from accidentally mapping priority to color. The `defaultVisibility` field (`'always' | 'detail' | 'filter-only'`) centralizes the progressive disclosure rules so that rendering decisions for P3 (detail-only) and P4 (filter-only) do not need to be re-implemented by each consumer.

The `getPriorityMeta()` helper falls back to P4 for unknown values, which is the conservative choice: items with missing priority data from pre-migration API responses will be invisible by default rather than surfaced as false high-priority alerts.

### Visual System -- Achromatic Priority (WS-0.2, WS-0.4)

The PriorityBadge component translates the type-level contract into visual output using three pre-attentive channels that do not compete with severity's color channel: geometric shape (diamond for P1, triangle for P2, none for P3/P4), typographic weight (bold, medium, normal), and motion (2.5s pulse for P1 only). The four opacity tiers (0.55, 0.35, 0.20, 0.10) are calibrated against the codebase's existing white-on-dark hierarchy where primary interactive text peaks at ~0.6 and the dimmest timestamps sit at ~0.12.

The component supports three size variants (sm/md/lg) mapped to specific integration surfaces in later phases: list rows, card badges, and detail panels. The `showLabel` prop controls progressive disclosure at the render level, complementing the `defaultVisibility` metadata field.

CSS `@keyframes` was chosen over `motion/react` for the P1 pulse animation because it is a continuous ambient effect with no state interaction, matching the existing pattern used for loading skeletons in `CategoryDetailScene`. React 19's `<style>` deduplication handles the injection of the keyframe definition.

### Infrastructure -- Notification Foundation (WS-0.3)

Sonner is installed as the toast notification library, placed in the root layout (not the launch layout) to ensure availability on all routes including the login page. The `bottom-right` position with a 52px vertical offset clears the BottomStatusStrip and SessionTimecode. Sonner's default z-index (extremely high) is accepted without override because all decorative layers above z-9999 use `pointer-events: none`. The `richColors` prop enables built-in severity-specific toast coloring that WS-2.5 will extend for P1/P2 alert notifications.

This workstream's scope is deliberately narrow: no custom toast templates, no auto-dismiss logic, no Realtime subscription, and no Browser Notification API integration. All of those belong to WS-2.5 in Phase 2.

### Cleanup -- Stats Panel Simplification (WS-0.1)

The "Sources" and "Active" stat rows are removed from `CoverageOverviewStats`, reducing the component from 5 rows to 3 (All button, Total Alerts, Categories). The IA specialist determined these rows are redundant because each `CategoryCard` already displays per-category source counts. The freed vertical space will be used by WS-4.5 (Phase 4) for the "THREAT PICTURE" entry point.

The `CoverageMetrics` type retains `totalSources` and `activeSources` fields (WS-0.1 D-2). Only the component props and the page-level prop passing are removed. This minimizes blast radius: the hook and type layer are untouched, and the TypeScript compiler will catch any stale references at compile time.

## 3. Cross-Workstream Conflicts

**None identified.** The four workstreams touch orthogonal concerns with no contradicting decisions:

- WS-0.1 modifies `CoverageOverviewStats.tsx` and `page.tsx`. WS-0.2 modifies `coverage.ts`. WS-0.3 modifies `layout.tsx`. WS-0.4 creates a new file. No file-level overlap exists.
- WS-0.2 and WS-0.4 share a dependency (WS-0.4 consumes WS-0.2's types), but their decisions are complementary: WS-0.2 defines the achromatic contract at the type level, WS-0.4 implements it at the component level. Both reference AD-1 consistently.
- WS-0.3's Sonner installation and WS-0.4's CSS `@keyframes` animation occupy different technical spaces (notification library vs. component animation) with no interaction.
- WS-0.1's decision to retain `totalSources`/`activeSources` on the `CoverageMetrics` type (D-2) is consistent with WS-0.2's additive-only approach to `coverage.ts`.

## 4. Architecture Decisions (consolidated table from all SOWs)

| ID | Decision | Source SOW | Rationale |
|----|----------|-----------|-----------|
| D-0.1.1 | Remove both "Sources" and "Active" stat rows simultaneously. | WS-0.1 D-1 | Both are redundant for the same reason (per-category counts on CategoryCard). Partial removal would be inconsistent. |
| D-0.1.2 | Retain `totalSources` and `activeSources` on the `CoverageMetrics` type. | WS-0.1 D-2 | Fields still populated by `useCoverageMetrics` hook; removing from type is a broader refactor out of scope for Size S cleanup. Zero cost to keep unused fields on an object. |
| D-0.1.3 | Keep the `StatRow` internal component in `CoverageOverviewStats.tsx`. | WS-0.1 D-3 | Still used by two remaining stat rows. Extraction is premature since it is only used in this file. |
| D-0.1.4 | Do not adjust the fixed 200px container width. | WS-0.1 D-4 | Three-row layout fits within existing dimensions. Height naturally shrinks via `flex-col gap-3`. |
| D-0.2.1 | Use `'P1' \| 'P2' \| 'P3' \| 'P4'` string literals for priority identifiers. | WS-0.2 D-1 | Matches backend `operational_priority` field values directly. No mapping layer. Terse for UI labels and URL params. |
| D-0.2.2 | Name the type `OperationalPriority` (not `Priority`). | WS-0.2 D-2 | Matches backend field name. Disambiguates from generic "priority" concept. |
| D-0.2.3 | Derive type from const array: `(typeof PRIORITY_LEVELS)[number]`. | WS-0.2 D-3 | Mirrors established `SeverityLevel` derivation pattern. Single source of truth. |
| D-0.2.4 | Fall back to P4 for unknown priority values in `getPriorityMeta`. | WS-0.2 D-4 | Conservative: unknown = lowest = invisible. Prevents false high-priority display from missing data. |
| D-0.2.5 | `PriorityMeta.shape` uses string union, not TypeScript enum. | WS-0.2 D-5 | Consistent with rest of `coverage.ts`. Enums add import ceremony without benefit. |
| D-0.2.6 | Include `defaultVisibility` in `PriorityMeta`. | WS-0.2 D-6 | Centralizes AD-1 progressive disclosure rules. Prevents logic scatter across consumers. |
| D-0.2.7 | Include numeric `sortOrder` field. | WS-0.2 D-7 | Enables `Array.sort()` without string-to-ordinal mapping. More readable and robust. |
| D-0.2.8 | Place new priority section between Severity and Source Status blocks in `coverage.ts`. | WS-0.2 D-8 | Maintains logical file flow: Category -> Severity -> Priority -> Source Status -> Grid Display. |
| D-0.3.1 | Place `<Toaster />` in root layout, not launch layout. | WS-0.3 D-1 | Ensures toasts work on all routes including `/login` for future session-expiry notifications. |
| D-0.3.2 | Use `position="bottom-right"` for toast placement. | WS-0.3 D-2 | Avoids TopTelemetryBar overlap. Conventional notification position. Keeps central spatial canvas unobstructed. |
| D-0.3.3 | Accept Sonner's default z-index (no override). | WS-0.3 D-3 | Default z-index is above all app layers. All elements at z-9999+ use `pointer-events: none`. No interaction conflict. |
| D-0.3.4 | Hardcode `theme="dark"`. | WS-0.3 D-4 | App is dark-first. Avoids `"system"` theme flash. Dynamic binding deferred to WS-2.5 if needed. |
| D-0.3.5 | Enable `richColors` for built-in severity coloring. | WS-0.3 D-5 | Immediate visual differentiation for `toast.success()`, `toast.error()`, `toast.warning()`. WS-2.5 can override. |
| D-0.3.6 | Set `offset={52}` to clear bottom chrome. | WS-0.3 D-6 | BottomStatusStrip is ~36px. 52px provides ~16px breathing room above it. |
| D-0.4.1 | Use inline SVG for P1 diamond and P2 triangle shapes. | WS-0.4 D-1 | Precise geometry control at arbitrary sizes. Supports `currentColor`. Lucide lacks matching shapes. CSS border-trick triangles do not support rounding. |
| D-0.4.2 | Use CSS `@keyframes` for P1 pulse, not `motion/react`. | WS-0.4 D-2 | Continuous fire-and-forget animation. Compositor-driven, no JS cost. Matches existing skeleton animation pattern. |
| D-0.4.3 | P4 returns `null` (no DOM node) rather than hidden element. | WS-0.4 D-3 | Zero DOM overhead. P4 items are the majority of intel. `showLabel` provides opt-in for rare explicit display. |
| D-0.4.4 | Use `<span>` as root element, not `<div>`. | WS-0.4 D-4 | Badge is placed inline within flex rows alongside text. Span is the correct inline-level element. |
| D-0.4.5 | Opacity tiers: P1=0.55, P2=0.35, P3=0.20, P4=0.10. | WS-0.4 D-5 | Four distinguishable brightness steps. Calibrated against codebase's existing 0.6 ceiling / 0.12 floor. Each step 0.15-0.20 apart. |
| D-0.4.6 | Inject `@keyframes` via inline `<style>` tag with React 19 deduplication. | WS-0.4 D-6 | No `tailwind.config.ts` in project (Tailwind v4 uses CSS config). Keeps animation co-located with component. React 19 hoists and deduplicates. |

## 5. Cross-Workstream Dependencies

```
WS-0.1 ──(independent)──────────────────────────────────> Phase 0 complete
WS-0.2 ──(blocks WS-0.4)──> WS-0.4 ─────────────────── > Phase 0 complete
WS-0.3 ──(independent)──────────────────────────────────> Phase 0 complete
```

**Critical path:** WS-0.2 then WS-0.4. This is the only sequential dependency within Phase 0. All other workstreams are independently executable.

**Dependency details:**

| Upstream | Downstream | What is needed | Nature |
|----------|-----------|----------------|--------|
| WS-0.2 | WS-0.4 | `OperationalPriority` type, `PRIORITY_META` record, `getPriorityMeta()` helper | Hard dependency -- WS-0.4 imports these for type-safe props interface and `aria-label` derivation |
| WS-0.1 | (none in Phase 0) | -- | Blocks WS-4.5 (Phase 4) -- clears space for THREAT PICTURE entry point |
| WS-0.2 | (none in Phase 0 beyond WS-0.4) | -- | Blocks WS-1.1, WS-1.4 (Phase 1) -- type foundation for API extensions and filter state |
| WS-0.3 | (none in Phase 0) | -- | Blocks WS-2.5 (Phase 2) -- notification infrastructure |
| WS-0.4 | (none in Phase 0) | -- | Blocks WS-1.2, WS-1.3, WS-2.2, WS-2.3, WS-3.2 (Phases 1-3) -- visual component for all alert surfaces |

**Implication:** WS-0.2 should be started first or simultaneously with WS-0.1 and WS-0.3. WS-0.4 cannot begin until WS-0.2 is merged.

## 6. Consolidated Open Questions (flag which are blocking)

| ID | Question | Source SOW | Blocking? | Owner |
|----|----------|-----------|-----------|-------|
| OQ-1 | Should `PriorityMeta` include a `description` field (e.g., "Immediate threat to life or critical infrastructure") for tooltips and accessibility labels? | WS-0.2 OQ-1 | Yes (WS-0.2) | information-architect |
| OQ-2 | Confirm backend `operational_priority` field values are uppercase `'P1'`--`'P4'` (not `'p1'`--`'p4'` or numeric `1`--`4`). Case mismatch would require normalization in WS-1.1. | WS-0.2 OQ-2 | No (Phase 1) | Backend team |
| OQ-3 | Should the `shape` union include future-proofing values (`'circle'`, `'square'`), or extend only when needed? | WS-0.2 OQ-3 | No | react-developer (recommend: do not future-proof) |
| OQ-4 | The `animation` field supports `'pulse' | null`. Should additional values (e.g., `'glow'`) be added now for Phase 2's PriorityFeedStrip? | WS-0.2 OQ-4 | No | react-developer (recommend: defer to WS-2.2) |
| OQ-5 | Should "Total Alerts" stat row show only triaged alerts (matching default view mode) rather than raw total? | WS-0.1 Q-1 | No (Phase 1) | Product / IA specialist |
| OQ-6 | Will WS-4.5 replace the "Categories" stat row with the THREAT PICTURE entry point, or add a fourth row below it? | WS-0.1 Q-2 | No (Phase 4) | IA specialist |
| OQ-7 | Should Sonner respect the dynamic color scheme switcher (tarva-core vs safetrekr)? | WS-0.3 OQ-1 | No (Phase 2) | react-developer |
| OQ-8 | What maximum number of simultaneous toasts should be visible? Sonner defaults to 3. Real-time intel feed bursts may need tuning. | WS-0.3 OQ-2 | No (Phase 2) | react-developer |
| OQ-9 | Should the `<Toaster />` use `closeButton` prop (always show close X) or rely on swipe/auto-dismiss? Affects P1 "persist until dismissed" UX. | WS-0.3 OQ-3 | No (Phase 2) | react-developer |
| OQ-10 | Should P1 diamond pulse also subtly scale (e.g., `scale: [1, 1.05, 1]`) in addition to opacity? | WS-0.4 Q-1 | No (Phase 1) | UX / IA advisory |
| OQ-11 | Should PriorityBadge accept a `count` prop for CategoryCard (WS-1.2), or should a separate `PriorityCountBadge` component be created? | WS-0.4 Q-3 | No (Phase 1) | react-developer |
| OQ-12 | Does the Tailwind v4 CSS configuration support `@theme` keyframe extensions? If so, D-0.4.6 (inline `<style>` tag) could be revisited. | WS-0.4 Q-4 | Soft (WS-0.4) | react-developer (verify during implementation) |

**Summary:** One blocking question (OQ-1) must be resolved before WS-0.2 implementation begins. OQ-12 should be verified early in WS-0.4 implementation but has a viable fallback (inline `<style>` is already the planned approach). All other questions are deferred to later phases.

## 7. Phase Exit Criteria

| Criterion | Met? | Evidence |
|-----------|------|----------|
| `CoverageOverviewStats` renders exactly 3 rows: All button, Total Alerts, Categories. | Pending | WS-0.1 AC-1: Visual inspection at Z1+ zoom + DOM inspection. |
| `CoverageOverviewStatsProps` no longer includes `totalSources` or `activeSources`. | Pending | WS-0.1 AC-2: `pnpm typecheck` passes. |
| `OperationalPriority` type resolves to `'P1' \| 'P2' \| 'P3' \| 'P4'`. | Pending | WS-0.2 AC-1: TypeScript compilation rejects non-members. |
| `PRIORITY_META` contains complete entries for all four levels with zero color fields. | Pending | WS-0.2 AC-3, AC-4: Unit test + grep verification. |
| `getPriorityMeta()` and `isPriorityVisible()` return correct values with safe fallbacks. | Pending | WS-0.2 AC-5, AC-6: Unit tests covering all input combinations. |
| `sonner` appears in `package.json` dependencies. | Pending | WS-0.3 AC-1: Package manifest inspection. |
| `<Toaster />` is rendered in root layout with correct position, theme, and offset. | Pending | WS-0.3 AC-3: Code inspection of `src/app/layout.tsx`. |
| Toast is visible, dismissible, and does not overlap fixed chrome. | Pending | WS-0.3 AC-6, AC-7: Manual smoke test. |
| `PriorityBadge` renders P1 (diamond + pulse), P2 (triangle + static), P3 (text-only or null), P4 (null or muted text) at all three sizes. | Pending | WS-0.4 AC-3 through AC-13: Visual and DOM inspection. |
| Priority visuals are fully achromatic (no color channel used). | Pending | WS-0.4 AC-14: No hue values in priority rendering code. |
| All priority elements have `aria-label` attributes. | Pending | WS-0.4 AC-15: DOM inspection. |
| `pnpm typecheck` passes with zero errors on full project. | Pending | WS-0.1 AC-3, WS-0.2 AC-9, WS-0.3 AC-5, WS-0.4 AC-16: TypeScript compiler exit code 0. |
| `pnpm build` completes without errors. | Pending | WS-0.1 AC-10, WS-0.3 AC-4, WS-0.4 AC-17: Build pipeline exit code 0. |

## 8. Inputs Required by Next Phase

Phase 1 (Priority Badges) and Phase 2 (P1/P2 Feed & Notifications) consume the following Phase 0 deliverables:

| Deliverable | File | Consuming Workstream(s) | What They Need It For |
|-------------|------|------------------------|----------------------|
| `OperationalPriority` type | `src/lib/interfaces/coverage.ts` | WS-1.1, WS-1.4 | API type field annotations; filter state type in coverage store |
| `PRIORITY_LEVELS` constant | `src/lib/interfaces/coverage.ts` | WS-1.4, WS-1.5 | Filter UI rendering; MapLibre expression generation |
| `PRIORITY_META` record | `src/lib/interfaces/coverage.ts` | WS-1.2, WS-1.5, WS-2.2 | CategoryCard badge visibility logic; map marker radius expressions; feed strip display |
| `getPriorityMeta()` helper | `src/lib/interfaces/coverage.ts` | WS-1.1, WS-1.3 | Safe priority metadata lookup in hook normalizers and detail panels |
| `isPriorityVisible()` helper | `src/lib/interfaces/coverage.ts` | WS-1.2, WS-1.3, WS-2.2, WS-2.3 | Conditional badge rendering based on display context |
| `PriorityBadge` component | `src/components/coverage/PriorityBadge.tsx` | WS-1.2, WS-1.3, WS-2.2, WS-2.3, WS-3.2 | Visual priority indicator on cards, lists, feeds, search results |
| `PriorityBadgeProps` interface | `src/components/coverage/PriorityBadge.tsx` | WS-1.2, WS-1.3 | Type-safe prop spreading in consumer components |
| `<Toaster />` in root layout | `src/app/layout.tsx` | WS-2.5 | Toast notification rendering (P1/P2 alert toasts, severity-specific styling) |
| Simplified `CoverageOverviewStats` (3 rows) | `src/components/coverage/CoverageOverviewStats.tsx` | WS-4.5 | Vertical space for THREAT PICTURE entry point |

## 9. Gaps and Recommendations

### Gap 1: Test Infrastructure Mismatch

WS-0.2 specifies unit tests in acceptance criteria (AC-2, AC-3, AC-5, AC-6) but WS-0.4 explicitly notes "No test infrastructure (`pnpm test:unit` is not configured in this project)." This is a contradiction that must be resolved before or during Phase 0.

**Recommendation (CTA):** If `pnpm test:unit` is not operational, WS-0.2's unit-test-dependent acceptance criteria should be verified via alternative means: inline type assertions for AC-1/AC-2, manual REPL-style verification for AC-5/AC-6, and `pnpm typecheck` for type-level guarantees (AC-7, AC-9, AC-10). Alternatively, set up a minimal Vitest configuration as part of WS-0.2 (adds approximately 30 minutes of effort). This would benefit all subsequent phases.

### Gap 2: WS-0.4 Q-2 Depends on WS-0.2 Metadata Shape

WS-0.4 Q-2 asks what label strings WS-0.2's `PRIORITY_META` will provide. This is resolved by the dependency ordering (WS-0.2 before WS-0.4), but the SOWs should be read together to confirm alignment. WS-0.2 Section 4.4 specifies labels (`'Critical'`, `'High'`, `'Standard'`, `'Low'`) and short labels (`'P1'`, `'P2'`, `'P3'`, `'P4'`). WS-0.4 Section 4.4 uses these exact values for `aria-label` construction (e.g., "Priority 1 -- Critical"). The two SOWs are aligned; no gap exists here once the dependency ordering is respected.

### Gap 3: No Explicit Rollback Plan

None of the four SOWs include a rollback procedure. Given the small scope and additive nature of Phases 0, rollback is trivial (revert commits), but this should be stated explicitly for process completeness.

**Recommendation (PMO):** Each workstream merges as an individual commit. If any workstream introduces a regression, its commit can be reverted independently. The four workstreams touch non-overlapping files, so independent revert is safe.

### Gap 4: WS-0.2 OQ-1 Is Marked Blocking But Has No Resolution Path

The question of whether `PriorityMeta` should include a `description` field is marked "before implementation" with the information-architect as owner. No timeline or decision criteria are specified.

**Recommendation (SPO):** Resolve OQ-1 before WS-0.2 implementation by adopting this default: add `description` as an optional field (`description?: string`) populated for all four levels. This is additive, non-breaking, and provides immediate value for `aria-label` and tooltip use cases. If the IA specialist determines descriptions are not needed, the field can simply be left unpopulated. Cost of including it: near zero. Cost of omitting and needing it later: a type change that touches `PRIORITY_META` and all consumers reading the field.

### Gap 5: No Visual Regression Baseline

WS-0.1 removes stat rows and WS-0.4 introduces a new visual component, but neither establishes a visual regression baseline (before/after screenshot comparison). The project has no Storybook or visual test infrastructure.

**Recommendation (STW):** Capture manual screenshots of `CoverageOverviewStats` at Z1+ zoom before WS-0.1 execution (5-row state) and after (3-row state). For WS-0.4, capture PriorityBadge renders for all 12 combinations (4 priority levels x 3 sizes) during implementation verification. Store in `docs/plans/summaries-and-more/phase-0-consolidate-and-prepare/visual-verification/` for the Phase 0 exit review.

### Gap 6: Sonner Version Pinning

WS-0.3 specifies `pnpm add sonner` without a version pin. Given that React 19 and Next.js 16 compatibility is a stated risk (WS-0.3 R-1), the installed version should be recorded.

**Recommendation (CTA):** After installation, verify the installed version and document it in the Phase 0 completion log. If a specific version is known to be compatible, pin it in the `pnpm add` command (e.g., `pnpm add sonner@^2.x`).

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

All four workstreams are sized S (the smallest unit in the plan's scale). The combined-recommendations document estimates Phase 0 at approximately 1 day total. This appears accurate given the scope:

| Workstream | Estimated Effort | Complexity Assessment |
|------------|-----------------|----------------------|
| WS-0.1 | 30-45 minutes | Low. Straightforward deletion of props, imports, and JSX lines. Two files touched. Mechanical. |
| WS-0.2 | 60-90 minutes | Low-Medium. Type definitions are simple, but the `PriorityMeta` interface design requires care to ensure AD-1 compliance and downstream compatibility. JSDoc density adds time. |
| WS-0.3 | 15-20 minutes | Very Low. Package install + 6 lines of JSX in layout + smoke test. |
| WS-0.4 | 90-120 minutes | Medium. SVG geometry at three sizes, CSS animation with reduced-motion support, progressive disclosure logic (P3/P4 null returns), accessibility attributes. Most complex workstream in Phase 0. |
| **Total** | **3.5-4.5 hours** | Aligns with the "~1 day" estimate, allowing for context switching, verification, and documentation. |

### Resource Loading

All four workstreams are assigned to the `react-developer` agent. WS-0.2 has an advisory tag for the `information-architect` to review the type taxonomy. No resource contention exists since there is only one assignee. The IA advisory review for WS-0.2 should be scheduled proactively to avoid blocking the WS-0.2 -> WS-0.4 critical path.

### Parallel Execution Opportunities

```
Time ──────────────────────────────────────────────────────────>

Track A:  [  WS-0.2 (types)  ] ──> [  WS-0.4 (badge)  ]
Track B:  [  WS-0.1 (stats)  ]     [ verify ]
Track C:  [WS-0.3 (sonner)]        [ verify ]
```

With a single developer, the recommended sequential execution order is:

1. **WS-0.2** (priority types) -- Start here because it is on the critical path and blocks WS-0.4.
2. **WS-0.1** (stats cleanup) -- Execute while WS-0.2 is in IA advisory review, if applicable.
3. **WS-0.3** (sonner install) -- Fastest workstream. Can slot into any gap.
4. **WS-0.4** (PriorityBadge) -- Must follow WS-0.2. Most complex workstream, benefits from the other three being done so the developer can focus.

With two developers, Tracks A and B+C can run in parallel, reducing wall-clock time to approximately 2.5-3 hours.

### Bottleneck Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OQ-1 (PriorityMeta description field) blocks WS-0.2 start | Low | Medium -- delays critical path | Adopt the Gap 4 recommendation: add `description` as optional field, resolve later if needed. |
| IA advisory review for WS-0.2 takes longer than expected | Low | Low -- WS-0.1 and WS-0.3 fill the gap | Notify IA specialist before Phase 0 starts. The review scope is narrow (type taxonomy only). |
| Sonner incompatibility with React 19 / Next.js 16 | Low | High -- would require alternative library | Check Sonner release notes and React 19 compatibility before running `pnpm add`. Fallback: `react-hot-toast`. |
| Tailwind v4 CSS config verification (OQ-12) reveals inline `<style>` issues | Very Low | Low -- inline `<style>` is the planned approach regardless | Test during WS-0.4. The decision (D-0.4.6) already accounts for this being the default. |

### Recommended Execution Protocol

1. Resolve OQ-1 (description field) with IA specialist. Default: include as optional.
2. Execute WS-0.2. Run `pnpm typecheck` to verify. Tag commit.
3. Execute WS-0.1 and WS-0.3 (either order, or simultaneously if two developers). Run `pnpm typecheck` and `pnpm build` after each. Tag commits.
4. Execute WS-0.4. Run `pnpm typecheck`, `pnpm build`, and visual verification of all 12 badge variants. Tag commit.
5. Run full Phase 0 exit criteria checklist (Section 7).
6. Capture visual verification screenshots (Gap 5).
7. Update workstream statuses from "Draft" to "Complete".
