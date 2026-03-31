# Phase B Overview: Situation Tab

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** combined-recommendations.md (Phase Decomposition, Phase B)
> **Date:** 2026-03-06
> **Status:** Draft

---

## 1. Executive Summary

Phase B builds the Situation tab -- the mobile operator's primary landing experience. It contains three workstreams (WS-B.1 through WS-B.3) that collectively deliver the threat posture banner, P1 persistent alert banner, priority alert strip, 15-category grid with tap/long-press gestures, ambient threat pulse background, data staleness detection, and connectivity indicator. All components consume existing TanStack Query hooks (`useThreatPicture`, `usePriorityFeed`, `useCoverageMetrics`) and introduce no new API endpoints.

**Risk profile:** Medium. The highest-risk issue is a significant **functional duplication** between WS-B.1 and WS-B.3: both independently design a data staleness hook, a data stale banner component, and a posture derivation utility -- with incompatible names, file locations, input signatures, and posture level vocabularies. This duplication must be resolved before implementation begins. A second structural gap persists from Phase A: the `MobileStateView` component (AD-7) remains unassigned despite being consumed by both WS-B.1 and WS-B.2.

**Key deliverables at phase exit:**
- Analysts see posture level, P1/P2 counts, trend indicator, and the most recent P1 alert headline within the first viewport fold
- A 2-column grid of all 15 category cards with alert counts, source counts, severity mini-bars, and sort dampening
- Tap on a card calls `startMorph(id, { fast: true })` (consumed by WS-D.1); long-press toggles the map filter with haptic feedback
- An ambient radial gradient breathes at a posture-dependent cadence, providing environmental threat awareness
- A persistent banner warns when data is stale (>3 min) or the device is offline
- A connectivity dot in the MobileHeader reflects real-time network + data freshness state
- Desktop rendering remains byte-for-byte identical

---

## 2. Key Findings (grouped by theme)

### 2.1 Data Hook Verification

All three workstreams reference existing TanStack Query hooks. Each was verified against the codebase:

- **`useThreatPicture()`** (WS-B.1, WS-B.3): EXISTS at `src/hooks/use-threat-picture.ts`. Returns `UseQueryResult<ThreatPicture>` with `totalActiveAlerts: number`, `bySeverity: SeverityDistribution[]`, `byPriority: PriorityBreakdown[]`, `byCategory: ThreatCategoryCount[]`, `overallTrend: TrendDirection`, `trendDetail: ThreatTrend | null`. Polls every 120s, staleTime 90s. **Verified compatible** with both SOWs' claimed data shapes.

- **`usePriorityFeed()`** (WS-B.1): EXISTS at `src/hooks/use-priority-feed.ts`. Returns `UseQueryResult<PriorityFeedSummary>` with `items: PriorityFeedItem[]`, `p1Count: number`, `p2Count: number`, `totalCount: number`, `mostRecentP1: PriorityFeedItem | null`, `mostRecentP2: PriorityFeedItem | null`. Polls every 15s, staleTime 10s. **Verified compatible** -- `mostRecentP1` directly feeds the P1 banner, `items` feeds the priority strip.

- **`useCoverageMetrics()`** (WS-B.2, WS-B.3): EXISTS at `src/hooks/use-coverage-metrics.ts`. Returns `UseQueryResult<CoverageMetrics>` with `byCategory: CoverageByCategory[]`, `totalSources`, `activeSources`, `categoriesCovered`, `totalAlerts`. Polls every 60s, staleTime 45s. **Verified compatible** with `buildAllGridItems()`.

- **`buildAllGridItems()`** (WS-B.2): EXISTS at `src/lib/interfaces/coverage.ts` line 391. Takes `(byCategory: CoverageByCategory[], trendMap?: Map<string, TrendDirection>)` and returns `CategoryGridItem[]` for all 15 `KNOWN_CATEGORIES`, filling zeroed metrics for missing categories. **Verified compatible** with WS-B.2's grid rendering plan.

- **`dataUpdatedAt`** (WS-B.1, WS-B.3): Both SOWs correctly reference TanStack Query v5's `dataUpdatedAt` property on `UseQueryResult`. WS-B.3 R-2 correctly identifies the edge case where `dataUpdatedAt` is `0` before the first successful fetch (which would cause a false stale banner). WS-B.1 does not address this edge case -- see Gap 9.4.

### 2.2 Threat Posture and Priority Display

- **P1/P2 count extraction (CTA):** WS-B.1's `MobileThreatBanner` needs P1 and P2 counts. The SOW claims these come from `useThreatPicture().byPriority`. Verified: `byPriority` is `PriorityBreakdown[]` where each entry has `{ priority: OperationalPriority, count: number, percentage: number }`. The SOW must filter this array for `priority === 'P1'` and `priority === 'P2'` entries. This works but is a transformation, not a direct field access. The SOW's code examples correctly show this transformation.

- **P1 banner persistence (SPO):** WS-B.1's `MobileP1Banner` correctly implements protective-ops C2: no auto-dismiss, persists until tapped or superseded by a newer P1. Local `dismissedId` state tracks acknowledgment. When `mostRecentP1.id` changes, the banner re-appears. This is a correct implementation of the requirement.

- **Posture level vocabulary conflict (STW):** WS-B.1 uses a 5-level `PostureLevel` type: `LOW | GUARDED | ELEVATED | HIGH | CRITICAL`. WS-B.3 uses the existing `ThreatLevel` type from `coverage.ts`: `LOW | MODERATE | ELEVATED | HIGH | CRITICAL`. The difference is `GUARDED` vs `MODERATE`. The codebase already defines `ThreatLevel` with `MODERATE` at `src/lib/interfaces/coverage.ts` line 271. WS-B.1 introduces a NEW incompatible enum. See Conflict 1.

### 2.3 Category Grid Design

- **Sort dampening (CTA):** WS-B.2 introduces `useSortDampening` hook with a `delta >= 2` threshold. This prevents visual jitter from minor count fluctuations (e.g., a category going from 5 to 6 alerts does not trigger a re-sort, but 5 to 7 does). The hook is well-specified with `lastSortedOrder` ref tracking and `arraysEqual` comparison. This is a sound approach to the problem identified in the combined-recommendations.

- **Long-press gesture (CTA):** WS-B.2 introduces `useLongPress` hook with 500ms threshold, combining `pointerdown`/`pointerup`/`pointercancel`/`contextmenu` events. Uses `navigator.vibrate([10])` for haptic feedback (Android only -- correctly noted as unavailable on iOS Safari). Prevents context menu with `e.preventDefault()` on the `contextmenu` event. This matches Risk 4 from the combined-recommendations.

- **Grid item data shape (SPO):** WS-B.2 claims each `MobileCategoryCard` shows `alertCount`, `sourceCount`, `trend`, and a `severity breakdown mini-bar`. The existing `CategoryGridItem` type has `metrics: CoverageByCategory` which includes `alertCount`, `sourceCount`, `p1Count`, `p2Count` but NOT a per-severity breakdown (Extreme/Severe/Moderate/Minor counts). WS-B.2's severity mini-bar will need severity data that is currently only available from `useThreatPicture().bySeverity` at the global level, not per-category. **This is a data gap** -- see Gap 9.5.

- **MobileStateView dependency (SPO):** WS-B.2 lists `MobileStateView` as a dependency from WS-A.2 (D-8). However, Phase A's WS-A.2 does not create this component. Phase A Overview Section 9.1 already flagged this gap and recommended adding it to WS-B.1 or creating WS-B.0. No Phase B SOW assigns its creation. See Conflict 3.

### 2.4 Ambient and Protective Systems

- **ThreatPulseBackground (CTA):** WS-B.3's CSS-only radial gradient implementation is architecturally sound. Uses `@keyframes threat-pulse` (defined globally by WS-A.3), with posture-level-dependent animation duration driven by CSS custom properties (`--posture-*-duration`). Respects `effectsEnabled` from `settings.store.ts` (verified: `effectsEnabled` exists at line 41) and `prefers-reduced-motion`. The `position: fixed; inset: 0; z-index: 0` placement ensures it sits behind all content.

- **ConnectivityDot (CTA):** WS-B.3's 8px colored dot replaces the static green placeholder from WS-A.2. Three states: green (fresh), yellow (stale), red (offline). Uses CSS transitions for smooth state changes. This correctly implements protective-ops C7.

- **Data staleness banner (SPO):** WS-B.3's `DataStaleBanner` uses `role="status"` and `aria-live="polite"` for screen reader announcement. Shows elapsed time since last update ("DATA STALE -- 4m ago"). Position: `sticky; top: 48px` (below header). WS-B.3 R-5 acknowledges potential iOS Safari sticky positioning issues and proposes fallback to `position: fixed`. This is a reasonable degradation path.

### 2.5 Store and State Management

- **`coverage.store.ts`** (WS-B.2): Verified. `selectedCategories: string[]`, `toggleCategory(id)`, `clearSelection()` all exist. The long-press -> map filter toggle correctly maps to `toggleCategory`.

- **`ui.store.ts`** (WS-B.2): Verified. `startMorph(nodeId, options?)` exists at line 103. The `options?.fast` path skips to `entering-district` phase (line 111-113). `resetMorph()` exists at line 145-148. Both are correctly referenced by WS-B.2's tap gesture handler.

- **`settings.store.ts`** (WS-B.3): Verified. `effectsEnabled: boolean` at line 41, `audioNotificationsEnabled: boolean` at line 56. Both persist via localStorage middleware. WS-B.3's `ThreatPulseBackground` correctly reads `effectsEnabled`.

### 2.6 MobileShell Modification

Both WS-B.1 and WS-B.3 specify modifications to `MobileShell.tsx`:

- **WS-B.1** creates `MobileSituationTab` as a container that renders inside the `situationContent` slot. It wires `useThreatPicture`, `usePriorityFeed`, `useDataStaleness`, and renders components in vertical order: DataStaleBanner -> ThreatBanner -> P1Banner -> PriorityStrip -> children.

- **WS-B.3** modifies `MobileShell.tsx` directly to add `ThreatPulseBackground` (behind content, z-0), wire `useDataFreshness` and `derivePostureLevel`, and render `DataStaleBanner` between header and scrollable content.

These modifications are **architecturally conflicting** -- both place a data stale banner, but at different points in the component tree. WS-B.1 places it inside the situation tab scroll area; WS-B.3 places it at the shell level (visible across all tabs). See Conflict 2.

---

## 3. Cross-Workstream Conflicts

### Conflict 1: Data Staleness Hook and Banner Duplication (WS-B.1 vs WS-B.3) -- BLOCKING

**WS-B.1** creates:
- `useDataStaleness` hook at `src/hooks/use-data-staleness.ts` -- monitors `dataUpdatedAt` from `useThreatPicture` and `usePriorityFeed`, plus `navigator.onLine`
- `MobileDataStaleBanner` component at `src/components/mobile/MobileDataStaleBanner.tsx` -- rendered inside `MobileSituationTab` (tab-scoped)
- Claims to resolve protective-ops C1

**WS-B.3** creates:
- `useDataFreshness` hook at `src/hooks/use-data-freshness.ts` -- monitors `dataUpdatedAt` from `useThreatPicture`, `useCoverageMetrics`, AND `usePriorityFeed`, plus `navigator.onLine`
- `DataStaleBanner` component at `src/components/mobile/DataStaleBanner.tsx` -- rendered at the MobileShell level (cross-tab)
- Claims to resolve C1 and C7

**Conflicts:**
1. **Two hooks solving the same problem** with different names (`useDataStaleness` vs `useDataFreshness`) and different monitored query sets (2 vs 3 queries).
2. **Two banner components** with different names, different placement (tab-scoped vs shell-scoped), and slightly different APIs.
3. **WS-B.1 OQ-3** explicitly asks whether it should also monitor `useCoverageMetrics` -- which WS-B.3 already does. This proves the authors were unaware of each other's designs.

**Resolution recommendation (CTA):**
1. **Keep WS-B.3's `useDataFreshness` as the single staleness hook.** It monitors 3 queries (more comprehensive), handles the `dataUpdatedAt === 0` edge case (R-2), and includes unit tests. Rename to `useDataFreshness` (WS-B.3's name is preferred -- "freshness" is a positive framing with tri-state semantics: fresh/stale/offline).
2. **Keep WS-B.3's `DataStaleBanner` as the single banner.** Place it at the MobileShell level so it is visible across all tabs (not just Situation). An operator switching to the Map tab should still see staleness warnings. This is the correct architectural placement for a protective-ops concern.
3. **Remove from WS-B.1:** Delete `useDataStaleness`, `MobileDataStaleBanner`, and the "Resolves: C1" claim. WS-B.1 still resolves C2 (P1 persistence).
4. **WS-B.1's `MobileSituationTab` should NOT render a stale banner.** The shell-level banner from WS-B.3 covers this.

### Conflict 2: Posture Derivation Duplication (WS-B.1 vs WS-B.3) -- BLOCKING

**WS-B.1** creates:
- `derivePosture()` in `src/lib/threat-utils.ts` -- takes `(bySeverity: SeverityDistribution[], totalActiveAlerts: number)` and returns `PostureLevel` (a NEW type: `LOW | GUARDED | ELEVATED | HIGH | CRITICAL`)
- Also refactors `ThreatPictureCard.tsx` to use this shared function

**WS-B.3** creates:
- `derivePostureLevel()` in `src/lib/posture-utils.ts` -- takes `(data: ThreatPicture | undefined)` and returns `ThreatLevel` (the EXISTING type from `coverage.ts`: `LOW | MODERATE | ELEVATED | HIGH | CRITICAL`)

**Conflicts:**
1. **Different function names** (`derivePosture` vs `derivePostureLevel`)
2. **Different file locations** (`threat-utils.ts` vs `posture-utils.ts`)
3. **Different input signatures** (destructured fields vs whole ThreatPicture object)
4. **Incompatible output types** (`PostureLevel` with `GUARDED` vs `ThreatLevel` with `MODERATE`)
5. **Different threshold logic** (B.1 uses severity counts + total alerts; B.3 uses a slightly different threshold table)

**Resolution recommendation (CTA):**
1. **Keep ONE posture derivation function.** Use B.1's `derivePosture` name (verb form is more conventional for a pure function) but in B.1's file location (`src/lib/threat-utils.ts`).
2. **Use the EXISTING `ThreatLevel` type** from `src/lib/interfaces/coverage.ts` (with `MODERATE`, not `GUARDED`). Do not introduce a new `PostureLevel` type. This avoids a vocabulary split across the codebase.
3. **Use B.1's input signature** (`bySeverity, totalActiveAlerts`) because it is more explicit and avoids optional chaining on an entire ThreatPicture object. WS-B.3's `ThreatPulseBackground` can destructure the ThreatPicture before calling.
4. **Merge threshold logic** -- settle on one set of thresholds and document them in the function's JSDoc. The thresholds from B.3 (`3 Extreme = CRITICAL, 1 Extreme = HIGH, 5 Severe = ELEVATED`) and B.1 (`10 Extreme = CRITICAL, 1 Extreme = HIGH, 50 Severe = HIGH`) differ significantly. This needs a product decision. Defer to WS-B.3 OQ-3 ("should thresholds be configurable?").
5. **WS-B.1 keeps the `ThreatPictureCard.tsx` refactor** (extracting posture logic to the shared utility). WS-B.3 consumes the same function.
6. **Delete `src/lib/posture-utils.ts`** from WS-B.3's deliverables.

### Conflict 3: MobileStateView Remains Unassigned -- BLOCKING

Phase A Overview Section 9.1 identified that no Phase A workstream creates the `MobileStateView` component (AD-7). The recommendation was to add it to WS-B.1 or create WS-B.0.

**Current state in Phase B:**
- WS-B.1 lists `MobileStateView` as a dependency from WS-A.2 (`MobileStateView component`)
- WS-B.2 lists `MobileStateView` as a dependency from WS-A.2 (`MobileStateView` component at `src/components/mobile/MobileStateView.tsx`)
- WS-B.3 does not reference `MobileStateView`
- **No SOW in either Phase A or Phase B creates this component.**

Both WS-B.1 and WS-B.2 actively USE it: WS-B.1 wraps threat sections in `<MobileStateView query={threatQuery}>`, WS-B.2 uses it for grid loading/error/empty states (AC-19).

**Resolution recommendation (CTA + PMO):**
Create `MobileStateView` as the FIRST deliverable of WS-B.1 (before any other B.1 work begins), since WS-B.1 is the first workstream to need it (threat banner wrapping). It is approximately 80 lines: accepts `query: UseQueryResult`, `skeletonComponent`, `emptyTitle`, `emptyMessage`, `retryLabel`. Renders skeleton shimmer during loading, error card with retry on failure, context-specific empty message when data is empty. WS-B.2 then consumes it without creating a duplicate.

Alternative: Create a small WS-B.0 addendum (~2 hours) that delivers MobileStateView before B.1/B.2 begin. This removes the dependency from both SOWs.

### Conflict 4: Shell-Level vs Tab-Level Banner Placement (WS-B.1 vs WS-B.3) -- NON-BLOCKING (resolved by Conflict 1)

If Conflict 1 is resolved as recommended (WS-B.3 owns the banner, placed at shell level), this conflict disappears. The stale banner renders between header and scrollable content at the MobileShell level, visible across all tabs.

If NOT resolved: WS-B.1 places its `MobileDataStaleBanner` inside `MobileSituationTab` (only visible on Situation tab), while WS-B.3 places its `DataStaleBanner` at the shell level. The operator would see TWO stale banners on the Situation tab and ONE on other tabs.

---

## 4. Architecture Decisions (consolidated)

| ID | Decision | Source SOW | Rationale | Status |
|----|----------|-----------|-----------|--------|
| AD-B1 | `derivePosture` pure function extracted to `src/lib/threat-utils.ts`; `ThreatPictureCard.tsx` refactored to consume it | WS-B.1 D-1 | Shared posture derivation used by both mobile `MobileThreatBanner` and desktop `ThreatPictureCard`. Eliminates duplicated logic. | **Needs merge** with B.3's `derivePostureLevel` (Conflict 2) |
| AD-B2 | `PostureLevel` type with 5 levels (LOW/GUARDED/ELEVATED/HIGH/CRITICAL) | WS-B.1 D-1 | Richer than boolean threat/no-threat. Maps to visual indicators (colors, pulse rates). | **Conflict** -- use existing `ThreatLevel` from `coverage.ts` instead |
| AD-B3 | P1 banner persistence: no auto-dismiss, local `dismissedId` state, re-appears on new P1 | WS-B.1 D-5 | Protective-ops C2 requirement. Ensures operators cannot miss critical alerts. | Accepted |
| AD-B4 | Priority strip: horizontal scroll with `scroll-snap-type: x mandatory`, P1/P2 alert pills | WS-B.1 D-6 | Touch-native horizontal browsing of priority alerts without page navigation. | Accepted |
| AD-B5 | `MobileSituationTab` as the composition container for all Situation tab content | WS-B.1 D-9 | Clean separation: MobileShell owns layout, MobileSituationTab owns Situation tab data flow and component ordering. | Accepted (modified: remove stale banner from this container) |
| AD-B6 | 2-column CSS Grid with `gap: var(--space-card-gap)`, `padding: var(--space-content-padding)` | WS-B.2 D-1 | Fits 15 categories on a 375px viewport. Cards are approximately 165x80px, large enough for metrics and touch targets. | Accepted |
| AD-B7 | Sort dampening with `delta >= 2` threshold via `useSortDampening` hook | WS-B.2 D-3 | Prevents visual jitter from minor count fluctuations. Preserves positional memory for the operator. | Accepted |
| AD-B8 | Long-press (500ms) for map filter toggle via `useLongPress` hook | WS-B.2 D-4 | Separates primary action (tap = drill-down) from secondary action (long-press = filter). 500ms matches platform conventions. | Accepted |
| AD-B9 | Press feedback: `scale(0.97)` for 100ms on touch start | WS-B.2 D-2 | Immediate tactile response without waiting for gesture resolution. Minimal scale change avoids layout shift. | Accepted |
| AD-B10 | `MobileCategoryCard` as a leaf component (no internal data fetching) | WS-B.2 D-2 | All data flows from grid parent via props. Card is a pure presentation component. Grid handles hook calls and error states. | Accepted |
| AD-B11 | `ThreatPulseBackground` as CSS-only radial gradient with posture-driven animation duration | WS-B.3 D-2 | Zero JavaScript per frame. CSS `animation-duration` driven by `--posture-*-duration` tokens. Negligible performance cost. | Accepted |
| AD-B12 | `useDataFreshness` hook monitoring 3 TanStack Query results + `navigator.onLine` | WS-B.3 D-1 | Comprehensive freshness signal. Tri-state output (fresh/stale/offline) consumed by both banner and connectivity dot. | Accepted (consolidates B.1's `useDataStaleness`) |
| AD-B13 | `DataStaleBanner` at MobileShell level (cross-tab visibility) | WS-B.3 D-3 | Staleness is a global protective concern, not tab-specific. Operator must see the warning regardless of active tab. | Accepted (replaces B.1's tab-scoped banner) |
| AD-B14 | `ConnectivityDot` replaces static placeholder with reactive 8px colored dot | WS-B.3 D-4 | Persistent at-a-glance indicator. Green/yellow/red maps to fresh/stale/offline. Always visible in header. | Accepted |
| AD-B15 | `ThreatPulseBackground` respects `effectsEnabled` AND `prefers-reduced-motion` | WS-B.3 D-2 | Dual respect: user preference (settings store) and OS accessibility setting. Both must be true for animation to play. | Accepted |

---

## 5. Cross-Workstream Dependencies

### Dependency Diagram

```
Phase A (all WSs)
       |
       v
  ┌────────────┐     ┌───────────────┐     ┌────────────────┐
  │  WS-B.1:   │     │  WS-B.2:      │     │  WS-B.3:       │
  │  Threat     │     │  Category     │     │  Ambient +     │
  │  Banner +   │     │  Grid         │     │  Protective    │
  │  Priority   │     │               │     │  Ops           │
  └──────┬─────┘     └───────┬───────┘     └──────┬─────────┘
         │                   │                     │
         │  MobileStateView  │                     │
         │ (must be created  │                     │
         │  first -- either  │                     │
         │  B.1 or B.0)      │                     │
         ├───────────────────┤                     │
         │                   │                     │
         v                   v                     v
     WS-D.2             WS-D.1, D.3            WS-F.4
    (AlertCard)         (CategoryDetail,       (Protective
                         Morph+Nav)             Ops Hooks)
```

### Inter-Phase-B Dependencies

After conflict resolution, WS-B.1, WS-B.2, and WS-B.3 have **no direct dependencies on each other**. They can execute in parallel.

However, there is an implicit ordering requirement:
- The **shared `derivePosture` function** (Conflict 2 resolution) should be created by WS-B.1 FIRST, since WS-B.3 then consumes it.
- The **`MobileStateView` component** should be created before WS-B.2 begins grid integration.

### Dependency Analysis

| Upstream | Downstream | What Flows | Validated? |
|----------|-----------|------------|------------|
| Phase A (all) | WS-B.1 | MobileShell `situationContent` slot, MobileHeader `threatIndicator` slot, spacing/typography/severity/posture tokens, safe area tokens, `MobileTab` type | Yes -- all prerequisites verified in Phase A SOWs |
| Phase A (all) | WS-B.2 | MobileShell `situationContent` slot, spacing/glass/typography/touch target/severity/animation tokens, safe area padding | Yes -- all prerequisites verified |
| Phase A (all) | WS-B.3 | MobileHeader connectivity dot placeholder, posture tokens (`--posture-*-color`, `--posture-*-duration`), `@keyframes threat-pulse`, `--color-data-stale-bg` | Yes -- all prerequisites verified in WS-A.3 token file spec |
| WS-B.1 | WS-D.2 | `MobileAlertCard` pattern (established for P1 strip pills, reused in alert detail) | Yes -- WS-B.1 defines the card pattern |
| WS-B.1 | WS-E.1 | `MobilePriorityStrip` may be reused in Intel tab priority section | Partial -- interface compatibility not yet verified |
| WS-B.2 | WS-D.1 | Card tap triggers `startMorph(id, { fast: true })` which opens category detail bottom sheet | Yes -- `startMorph` verified in `ui.store.ts` line 103 |
| WS-B.2 | WS-D.3 | Morph trigger originates from card tap gesture | Yes -- morph state machine verified |
| WS-B.3 | WS-F.4 | `useDataFreshness` hook extended or wrapped by protective ops hooks | Yes -- extension point design noted in WS-B.3 OQ-5 |
| WS-B.1 (resolved) | WS-B.3 | Shared `derivePosture` function in `threat-utils.ts` | **Pending** -- requires Conflict 2 resolution |

---

## 6. Consolidated Open Questions

| ID | Question | Source | Blocking? | Assigned To | Target |
|----|----------|--------|-----------|-------------|--------|
| OQ-B1 | **Which posture derivation thresholds are authoritative?** WS-B.1: `10 Extreme = CRITICAL, 1 Extreme = HIGH, 50 Severe = HIGH`. WS-B.3: `3 Extreme = CRITICAL, 1 Extreme = HIGH, 5 Severe = ELEVATED`. These produce different posture levels for the same data. | WS-B.1 D-1, WS-B.3 D-5 | **Yes** | planning-coordinator + product | Before B.1 implementation |
| OQ-B2 | Should the `DataStaleBanner` include a manual "Retry" button that calls `queryClient.refetchQueries()`? Current spec relies on automatic refetch intervals only. | WS-B.3 OQ-2 | No | world-class-ux-designer | Phase B review gate |
| OQ-B3 | Should posture derivation thresholds be configurable via settings store or environment variable, or hardcoded? | WS-B.3 OQ-3 | No | planning-coordinator | Phase F |
| OQ-B4 | Should the `DataStaleBanner` be `position: sticky` (scrolls into view then sticks) or `position: fixed` (always visible)? WS-B.3 uses sticky. iOS Safari has known sticky bugs in scrollable containers. | WS-B.3 R-5, DM-3 | No | world-class-ui-designer | Phase B implementation |
| OQ-B5 | How should `useDataFreshness` be extended in WS-F.4? Should it accept additional query results as parameters (extensible), or will WS-F.4 create a wrapper hook? | WS-B.3 OQ-5 | No | WS-F.4 author | Phase F |
| OQ-B6 | `ThreatPulseBackground` background gradient uses 0.4 opacity at CRITICAL. Should this be lower (0.25-0.30) to avoid interference with text readability? | WS-B.3 OQ-1 | No | design lead | Phase B review gate |
| OQ-B7 | `MobileCategoryCard`'s severity mini-bar requires per-category severity breakdown data. `CoverageByCategory` only has `alertCount`, `p1Count`, `p2Count` -- not `extremeCount`, `severeCount`, etc. Where does per-category severity data come from? | WS-B.2 D-2 (implicit) | **Yes** | WS-B.2 author | Before B.2 implementation |
| OQ-B8 | WS-B.2 specifies 15 categories always visible. If the API returns fewer than 15 categories in `byCategory`, `buildAllGridItems` fills zeroed metrics. Should zero-alert categories be visually distinguished (dimmed, "No data" label)? | WS-B.2 DM-4 | No | world-class-ux-designer | Phase B implementation |
| OQ-B9 | The `MobileP1Banner` uses `navigator.vibrate([200, 100, 200])` on appearance. iOS Safari does not support `navigator.vibrate`. Should this be guarded with a feature check, or is silent failure acceptable? | WS-B.1 D-5 | No | react-developer | Phase B implementation |
| OQ-B10 | `MobileThreatIndicator` in the MobileHeader uses a `box-shadow` glow effect. On low-end devices, `box-shadow` with `blur-radius` can be expensive during animation. Should this use a static glow (no animation) with only the color changing? | WS-B.1 D-4 | No | world-class-ui-designer | Phase B implementation |
| OQ-B11 | **Who creates `MobileStateView`?** Phase A deferred it. WS-B.1 and WS-B.2 both depend on it. Neither creates it. | Phase A Overview 9.1 | **Yes** | planning-coordinator | Before B.1/B.2 begin |

---

## 7. Phase Exit Criteria

| Criterion | Source | Evidence Required |
|-----------|--------|-------------------|
| `MobileThreatBanner` renders posture badge (color-coded), active alert count, P1/P2 counts, and trend indicator within the Situation tab | WS-B.1 AC-1 through AC-5 | Visual inspection at 375x812. Data from `useThreatPicture` displayed correctly. Posture badge color matches derived level. |
| `MobileP1Banner` appears when P1 > 0, shows headline + severity + time, persists until tapped or superseded | WS-B.1 AC-6 through AC-9 | Trigger a P1 alert via backend. Verify banner appears, does not auto-dismiss after 60s, disappears on tap, re-appears when a new P1 arrives. |
| `MobileThreatIndicator` glow badge renders in MobileHeader `threatIndicator` slot | WS-B.1 AC-10 through AC-13 | Visual inspection. Glow color matches posture level. Badge visible on all tabs. |
| `MobilePriorityStrip` renders horizontally-scrollable P1/P2 pills with scroll-snap | WS-B.1 AC-14, AC-15 | Swipe through pills. Verify snap behavior. Tap a pill (noop in Phase B, wired in Phase D). |
| Data staleness banner appears when data > 3 min stale or device offline | WS-B.1 AC-16/17/18 or WS-B.3 AC-6/7/8 (after conflict resolution) | Disconnect backend > 3 min: verify "DATA STALE" banner. Toggle airplane mode: verify "OFFLINE" banner. |
| `MobileCategoryGrid` renders 2-column grid of all 15 `KNOWN_CATEGORIES` with correct metrics | WS-B.2 AC-1 through AC-4 | Visual inspection at 375x812. All 15 categories visible (scroll if needed). Alert counts match API data. |
| Card tap calls `startMorph(categoryId, { fast: true })` | WS-B.2 AC-8, AC-9 | Tap a card. Verify `ui.store.morph.phase` transitions to `entering-district`. (Full morph UX deferred to WS-D.3.) |
| Card long-press (500ms) toggles `coverage.store.selectedCategories` with haptic feedback | WS-B.2 AC-10, AC-11, AC-12 | Long-press a card on Android. Verify haptic buzz and `selectedCategories` state change. |
| Sort dampening: grid re-sorts only when alert count delta >= 2 | WS-B.2 AC-5 | Observe grid order after minor count changes (simulate via API mock). Verify stability. |
| `ThreatPulseBackground` renders ambient gradient at posture-driven cadence | WS-B.3 AC-1 through AC-5 | Visual inspection. Gradient visible. Animation respects `effectsEnabled` toggle and `prefers-reduced-motion`. |
| `ConnectivityDot` in MobileHeader shows green/yellow/red state | WS-B.3 AC-10 through AC-14 | Green when data fresh. Yellow when stale > 3 min. Red when offline. |
| Desktop rendering is byte-for-byte identical at >= 768px viewport | All SOWs | Visual comparison at 1440x900. `ThreatPictureCard.tsx` refactor (shared `derivePosture`) produces identical rendering. |
| `pnpm typecheck` and `pnpm build` pass with zero errors | All SOWs | CLI execution |

---

## 8. Inputs Required by Next Phase

Phase C (Map Tab + Bottom Sheet) and Phase D (Category Detail + Alert Detail) require the following from Phase B:

| Input | Source WS | Consumer WS | Description |
|-------|-----------|-------------|-------------|
| `MobileSituationTab` composition pattern | WS-B.1 | WS-D.1, WS-D.3 | Demonstrates how tab content wires hooks and composes components within the `situationContent` slot |
| `MobilePriorityStrip` component | WS-B.1 | WS-E.1 | Potential reuse in Intel tab's priority alerts section |
| `MobileAlertCard` pattern (priority strip pills) | WS-B.1 | WS-D.2 | Pill card pattern for P1/P2 items, extended to full `MobileAlertCard` in Phase D |
| `MobileCategoryCard` with `startMorph` tap handler | WS-B.2 | WS-D.1, WS-D.3 | Morph trigger: card tap starts the fast-path morph that opens category detail bottom sheet |
| `useSortDampening` hook | WS-B.2 | (potentially Phase D lists) | Reusable sort stabilization pattern |
| `useLongPress` hook | WS-B.2 | (potentially Phase D interactions) | Reusable gesture hook |
| `derivePosture` / `threat-utils.ts` | WS-B.1 (after conflict resolution) | WS-B.3, any future posture consumer | Shared posture derivation for ambient, indicators, and potential future features |
| `useDataFreshness` hook | WS-B.3 (after conflict resolution) | WS-F.4 | Extended by protective ops hooks for idle lock, audio alerts |
| `ThreatPulseBackground` + `ConnectivityDot` | WS-B.3 | (no downstream consumer -- self-contained ambient layer) | -- |
| `DataStaleBanner` | WS-B.3 | (no downstream consumer -- always-on shell component) | -- |
| `MobileStateView` | WS-B.1 (or B.0) | WS-B.2, WS-D.1, WS-D.2, WS-E.1, WS-E.2 | Shared loading/error/empty state pattern used by every subsequent data-consuming component |

---

## 9. Gaps and Recommendations

### 9.1 Missing: MobileStateView Component (SPO) -- BLOCKING

**Status:** Carried forward from Phase A Overview Section 9.1. Still unassigned. Both WS-B.1 and WS-B.2 depend on it; neither creates it.

**Impact:** Without `MobileStateView`, both WS-B.1 and WS-B.2 must independently handle loading/error/empty states, creating inconsistent patterns. Every subsequent data-consuming workstream (D.1, D.2, E.1, E.2) also needs this component.

**Recommendation:** Assign creation to WS-B.1 as its first deliverable (D-0), or create a standalone WS-B.0 addendum (~2 hours, ~80 lines). The component accepts `query: UseQueryResult`, renders skeleton shimmer during loading, error card with retry button on failure, and context-specific empty message when data array is empty.

### 9.2 Data Staleness Duplication Must Be Resolved Before Implementation (CTA) -- BLOCKING

**Status:** See Conflict 1 and Conflict 2 above.

**Impact:** If both SOWs are implemented as written, the codebase will have two staleness hooks, two banner components, and two posture derivation functions with incompatible vocabularies. This is a maintenance burden and a source of user-facing inconsistency (two banners on the Situation tab).

**Recommendation:** Resolve per Conflict 1 and Conflict 2 recommendations. WS-B.3 owns staleness detection (hook + banner). WS-B.1 owns posture derivation (shared utility). Update both SOW headers to reflect the resolution before implementation.

### 9.3 WS-B.1 Resolves Claim Incorrect for C1 (STW)

WS-B.1 header says `Resolves: Data staleness / offline indicator requirement (protective-ops-review C1)`. WS-B.3 also delivers data staleness (C1) and connectivity indicator (C7), but its header says `Resolves: None`.

**Recommendation:** After Conflict 1 resolution:
- WS-B.1 `Resolves:` should be: `C2 (persistent P1 banner requirement)`
- WS-B.3 `Resolves:` should be: `C1 (data staleness / offline indicator), C7 (connectivity indicator dot)`

### 9.4 WS-B.1 Missing `dataUpdatedAt === 0` Edge Case (CTA)

WS-B.3 R-2 correctly identifies that TanStack Query v5 sets `dataUpdatedAt` to `0` (not `undefined`) before the first successful fetch. `Date.now() - 0` always exceeds the 3-minute threshold, causing a false stale banner flash on initial page load. WS-B.3 handles this by filtering out `0` values.

WS-B.1's `useDataStaleness` does NOT address this edge case. If Conflict 1 is resolved as recommended (WS-B.3 owns staleness), this gap is automatically resolved. If not, WS-B.1 must add the same `0` filter.

### 9.5 Per-Category Severity Data Not Available for Mini-Bar (SPO) -- BLOCKING (OQ-B7)

WS-B.2's `MobileCategoryCard` specifies a "severity breakdown mini-bar" showing the distribution of Extreme/Severe/Moderate/Minor alerts within each category. However, the existing data layer does not provide per-category severity breakdowns:

- `CoverageByCategory` has `alertCount`, `p1Count`, `p2Count` (priority breakdown, not severity breakdown)
- `useThreatPicture().bySeverity` provides severity distribution at the GLOBAL level, not per-category
- `useCategoryIntel(categoryId)` returns individual items with severity fields, but this hook is per-category and would require 15 parallel queries to populate the grid

**Options:**
1. **Use priority as a proxy for severity:** Render a P1/P2/Other mini-bar instead of a severity mini-bar. This uses existing `p1Count` and `p2Count` from `CoverageByCategory`.
2. **Add a per-category severity aggregation to the API:** Request a `/console/coverage` response extension that includes `by_severity` within each category metric.
3. **Client-side computation from `useCoverageMetrics`:** The hook already fetches `/console/intel?limit=1000` which includes individual items with severity. Aggregate client-side. However, this is wasteful if only needed for the mini-bar.
4. **Remove the severity mini-bar:** Simplify the card to show only alert count, source count, and trend.

**Recommendation:** Option 1 (priority proxy) is the lowest-risk approach for Phase B. The priority mini-bar (P1 red / P2 amber / other gray) aligns with the existing `PRIORITY_META` visual system and requires no new data. Severity mini-bar can be added when per-category severity data becomes available.

### 9.6 WS-B.2 `--space-section-gap` Token Reference Not Verified (STW)

WS-B.2 references `--space-section-gap` for spacing between the grid and the priority strip above it. This token is listed in WS-A.3's token file spec. However, its value is not defined in the combined-recommendations or any design system document. WS-A.3 will need to assign a specific pixel value.

**Recommendation:** Non-blocking. WS-A.3 author should define `--space-section-gap` (recommended: `16px` based on the `--space-card-gap: 8px` pattern and typical section spacing).

### 9.7 No Automated Tests in WS-B.2 (PMO)

WS-B.1 specifies unit tests for `derivePosture`, `useDataStaleness`, `MobileP1Banner`, and `MobilePriorityStrip`. WS-B.3 specifies unit tests for `useDataFreshness` and `derivePostureLevel`. WS-B.2 specifies NO unit tests, despite introducing two custom hooks (`useSortDampening`, `useLongPress`) that are strong test candidates.

**Recommendation:** Add to WS-B.2 deliverables:
- `use-sort-dampening.test.ts` -- verify delta threshold, verify order stability below threshold, verify re-sort above threshold
- `use-long-press.test.ts` -- verify 500ms timing, verify cancel on pointer leave, verify `contextmenu` prevention

### 9.8 WS-B.1 and WS-B.3 Both Modify MobileShell.tsx (PMO)

WS-B.1 creates `MobileSituationTab` which renders in the `situationContent` slot (additive, no shell modification). WS-B.3 directly modifies `MobileShell.tsx` to add `ThreatPulseBackground`, `DataStaleBanner`, and `useDataFreshness` wiring (+15 lines).

If both execute in parallel and merge independently, the shell modifications will conflict at the file level. After Conflict 1 resolution, only WS-B.3 modifies the shell.

**Recommendation:** WS-B.1 should NOT modify `MobileShell.tsx`. Its `MobileSituationTab` is a new component rendered into the existing `situationContent` slot. WS-B.3 makes the shell-level modifications (pulse background, stale banner, freshness hook wiring). This eliminates merge conflicts.

---

## 10. Effort and Sequencing Assessment (PMO)

### 10.1 Effort Estimates

| WS | SOW Size | Estimated Effort | Complexity | Rationale |
|----|----------|-----------------|------------|-----------|
| WS-B.1 | M | 8-12 hours | Medium-High | 5 new components + 1 new hook + 1 shared utility + 1 desktop refactor + unit tests. Complexity is in the threat banner data wiring and P1 acknowledgment logic. **Reduced by ~3 hours** if staleness hook/banner are removed per Conflict 1 resolution. |
| WS-B.2 | M | 8-10 hours | Medium | 2 new components + 2 new hooks + 1 CSS file. Complexity is in sort dampening, long-press gesture, and grid layout. Well-scoped with clear data contracts. |
| WS-B.3 | S | 4-6 hours | Low-Medium | 3 new components + 1 new hook + 1 utility + shell modification + unit tests. ThreatPulseBackground is CSS-only. DataStaleBanner is simple conditional rendering. Main complexity is the useDataFreshness hook. |
| B.0 (if created) | XS | 1-2 hours | Low | `MobileStateView`: ~80 lines, accepts `UseQueryResult`, renders skeleton/error/empty. Straightforward pattern. |

**Total Phase B:** 21-30 hours of implementation effort (excluding review and verification). With Conflict 1 resolution removing duplication from B.1: **19-26 hours**.

### 10.2 Resource Loading

| Agent/Role | Workstreams | Conflict Risk |
|------------|-------------|---------------|
| `world-class-ui-designer` | WS-B.1, WS-B.3 | **Sequential** -- same agent, must execute serially. Recommendation: B.1 first (creates shared `derivePosture` + `MobileStateView`), then B.3 (consumes `derivePosture`, adds shell modifications). |
| `world-class-ux-designer` | WS-B.2 | **Independent** -- different agent, can run in parallel with B.1/B.3. |

### 10.3 Parallel Execution Opportunities

**Wave 1 (parallel):**
- WS-B.0 or WS-B.1 D-0 (`world-class-ui-designer`): Create `MobileStateView` (~2 hours)
- WS-B.2 pre-work (`world-class-ux-designer`): `useSortDampening`, `useLongPress` hooks + unit tests (~3 hours)

These have no file conflicts and different agents.

**Wave 2 (parallel):**
- WS-B.1 remainder (`world-class-ui-designer`): `derivePosture` + `MobileThreatBanner` + `MobileP1Banner` + `MobileThreatIndicator` + `MobilePriorityStrip` + `MobileSituationTab` + `ThreatPictureCard.tsx` refactor (~6-8 hours)
- WS-B.2 remainder (`world-class-ux-designer`): `MobileCategoryGrid` + `MobileCategoryCard` + CSS + integration with MobileStateView (~5-7 hours)

**Wave 3 (sequential after B.1):**
- WS-B.3 (`world-class-ui-designer`): `ThreatPulseBackground` + `DataStaleBanner` + `useDataFreshness` + `ConnectivityDot` + MobileShell modifications (~4-6 hours)

### 10.4 Recommended Execution Order

```
Pre-flight: Resolve OQ-B1 (posture thresholds), OQ-B7 (severity mini-bar data),
            OQ-B11 (MobileStateView ownership), Conflicts 1+2 (duplication)

Day 1:  WS-B.0/B.1-D0 (MobileStateView) + WS-B.2 hooks (parallel)
Day 2:  WS-B.1 main (threat components) + WS-B.2 main (grid components) (parallel)
Day 3:  WS-B.1 completion + ThreatPictureCard refactor + B.2 completion
Day 4:  WS-B.3 (ambient + protective ops, after B.1's derivePosture is available)
Day 4+: Phase B review gate, desktop regression verification, gesture testing on device
```

### 10.5 Critical Path

```
MobileStateView (XS) -> WS-B.1 (M, reduced) -> WS-B.3 (S)
                         WS-B.2 (M, parallel with B.1)
```

Total critical path: B.0 + B.1 + B.3 = XS + M + S. WS-B.2 runs in parallel and completes within the B.1 window.

Estimated critical path duration: 2-3 working days for the two-agent assignment.

### 10.6 Bottleneck Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **OQ-B1 (posture thresholds) blocks B.1** | Medium | Medium | If product decision is delayed, use WS-B.3's thresholds as defaults with a TODO comment. Thresholds can be adjusted without structural changes. |
| **OQ-B7 (severity mini-bar data) blocks B.2** | High | Medium | Use Option 1 (priority proxy mini-bar) as interim. The card layout accommodates either priority or severity mini-bar without structural changes. |
| **MobileStateView delay blocks B.1 and B.2** | Medium | High | Both SOWs can develop components in isolation (test harness route), but cannot integrate with error/loading states until MobileStateView exists. Prioritize its creation as Wave 1. |
| **WS-B.1 ThreatPictureCard refactor causes desktop regression** | Very Low | High | Mechanical extraction. Unit tests for `derivePosture` cover all 6 derivation rules. AC-25 requires visual verification. |
| **B.1 and B.3 merge conflict on MobileShell.tsx** | Medium | Low | After Conflict 1 resolution, only B.3 modifies MobileShell. B.1's MobileSituationTab renders in the slot without touching the shell. |
| **iOS Safari sticky positioning bug for DataStaleBanner** | Low | Low | WS-B.3 R-5 proposes `position: fixed` fallback. ConnectivityDot provides redundant staleness indication in the header. |
| **Long-press conflicts with iOS context menu** | Medium | Medium | `e.preventDefault()` on `contextmenu`. Tested per WS-B.2 AC-13. If prevention fails on some iOS versions, degrade to tap-only with a filter button alternative. |

### 10.7 Phase B Summary

Phase B is a focused UI-building phase with well-defined data contracts. The primary risk is the **B.1/B.3 functional duplication** (Conflict 1 + Conflict 2), which must be resolved before implementation starts. Once resolved, the three workstreams execute cleanly with two agents over 3-4 working days. The `MobileStateView` gap is the only structural blocker -- adding it as a pre-flight deliverable eliminates cascading delays through Phases D and E.

---

## Appendix A: File Change Summary

| File | Change Type | Source WS | Description |
|------|-------------|-----------|-------------|
| `src/components/mobile/MobileStateView.tsx` | New | WS-B.0 or WS-B.1 D-0 | Shared loading/error/empty state wrapper (~80 lines) |
| `src/lib/threat-utils.ts` | New | WS-B.1 D-1 | `derivePosture`, `PostureLevel` (use `ThreatLevel`), `POSTURE_CONFIG` |
| `src/hooks/use-data-freshness.ts` | New | WS-B.3 D-1 (consolidated from B.1 + B.3) | Monitors 3 TanStack Query `dataUpdatedAt` + `navigator.onLine` |
| `src/components/mobile/MobileSituationTab.tsx` | New | WS-B.1 D-9 | Composition container: ThreatBanner + P1Banner + PriorityStrip + children |
| `src/components/mobile/MobileThreatBanner.tsx` | New | WS-B.1 D-3 | Posture badge + counts + trend (56px) |
| `src/components/mobile/MobileP1Banner.tsx` | New | WS-B.1 D-5 | Persistent P1 alert headline (64px, conditional) |
| `src/components/mobile/MobileThreatIndicator.tsx` | New | WS-B.1 D-4 | Header glow badge (posture color) |
| `src/components/mobile/MobilePriorityStrip.tsx` | New | WS-B.1 D-6 | Horizontal scroll P1/P2 pills (44px sticky) |
| `src/components/mobile/MobileCategoryGrid.tsx` | New | WS-B.2 D-1 | 2-column CSS Grid + sort dampening + MobileStateView integration |
| `src/components/mobile/MobileCategoryCard.tsx` | New | WS-B.2 D-2 | Tap/long-press card (~165x80px) |
| `src/hooks/use-sort-dampening.ts` | New | WS-B.2 D-3 | Sort stabilization with delta threshold |
| `src/hooks/use-long-press.ts` | New | WS-B.2 D-4 | 500ms long-press gesture with haptic |
| `src/styles/mobile-category-grid.css` | New | WS-B.2 D-5 | Grid layout + card styles + press feedback |
| `src/components/mobile/ThreatPulseBackground.tsx` | New | WS-B.3 D-2 | CSS radial gradient ambient layer |
| `src/components/mobile/DataStaleBanner.tsx` | New | WS-B.3 D-3 (consolidated) | Sticky stale/offline warning banner |
| `src/components/mobile/ConnectivityDot.tsx` | New | WS-B.3 D-4 | 8px reactive dot (green/yellow/red) |
| `src/components/coverage/ThreatPictureCard.tsx` | Modified | WS-B.1 D-10 | Refactor: import `derivePosture` from `threat-utils.ts`, remove local posture logic |
| `src/components/mobile/MobileShell.tsx` | Modified | WS-B.3 | Wire `useDataFreshness`, add `ThreatPulseBackground` (z-0), add `DataStaleBanner` |

## Appendix B: Protective-Ops Resolution Mapping

| Protective-Ops Requirement | Assigned To | Deliverable |
|---------------------------|-------------|-------------|
| C1: Data staleness indicator | WS-B.3 | `useDataFreshness` hook + `DataStaleBanner` component |
| C2: P1 banner persistence | WS-B.1 | `MobileP1Banner` with `dismissedId` state |
| C7: Connectivity indicator dot | WS-B.3 | `ConnectivityDot` component in MobileHeader |
| C3: "Show on Map" from all contexts | Deferred to WS-E.3 | -- |
| C4: GPS center-on-me | Deferred to WS-C.3 | -- |
| C5: Session auto-lock | Deferred to WS-F.4 | -- |
| C6: P1 audio notification | Deferred to WS-F.4 | -- |
