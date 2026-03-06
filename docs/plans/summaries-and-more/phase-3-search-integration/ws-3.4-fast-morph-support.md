# WS-3.4: Fast Morph Support in ui.store

> **Workstream ID:** WS-3.4
> **Phase:** 3 -- Search Integration
> **Assigned Agent:** `react-developer`
> **Advisory:** `world-class-ux-designer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** None (within Phase 3)
> **Blocks:** WS-3.3
> **Resolves:** None

---

## 1. Objective

Extend the morph state machine to support a "fast morph" path that bypasses the `expanding` and `settled` intermediate phases, transitioning directly from `idle` to `entering-district` in 300ms. This enables search-initiated navigation (WS-3.3) to reach the district view without the wayfinding animation that is useful for grid-click navigation but becomes friction when the user has already identified their target via search.

The result: WS-3.3 can call `startMorph(category, { fast: true })` and the user arrives at the district view in ~300ms instead of ~1200ms, while all existing normal morph behavior remains identical.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `MorphState` type extension | Add `fast?: boolean` field to `MorphState` in `src/lib/morph-types.ts`. Defaults to `false`. Tracks whether the current morph is using the fast path. |
| `MORPH_TIMING_FAST` constant | Add a fast-path timing constant to `src/lib/morph-types.ts` with `enteringDistrict: 300` (the only phase that executes in fast morph). |
| `startMorph` signature extension | Change `startMorph(nodeId: NodeId)` to `startMorph(nodeId: NodeId, options?: StartMorphOptions)` in both the `MorphActions` interface and the `UIActions` interface. When `options.fast` is `true`, set `morph.phase` to `'entering-district'` directly (skipping `expanding` and `settled`) and set `morph.fast` to `true`. |
| `useMorphChoreography` fast-path handling | In the forward flow effect: when `phase === 'entering-district'` and `morph.fast === true`, use the fast timing (300ms) instead of the standard timing (600ms). Add URL sync in this branch (since the `settled` phase -- where URL sync normally happens -- is skipped). |
| `useMorphChoreography` public API | Update the hook's `startMorph` wrapper to accept and forward the options parameter. |
| `resetMorph` cleanup | Ensure `resetMorph()` clears `morph.fast` back to `false` so subsequent normal morphs are unaffected. |
| Integration tests | Test both the normal morph path (idle -> expanding -> settled -> entering-district -> district) and the fast morph path (idle -> entering-district -> district) to verify they produce the correct phase sequences and do not interfere with each other. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Search result click handler (WS-3.3) | WS-3.3 is the consumer of `startMorph(category, { fast: true })`. This workstream only provides the primitive. |
| DistrictViewOverlay animation tuning | The overlay's own `motion.div` transition (opacity, 0.5s ease) is independent of the morph timing. If 0.5s feels slow relative to 300ms fast morph, that is a follow-up tuning concern, not a store change. |
| Fast reverse morph | Reverse morph (leaving-district -> idle) is already fast at 400ms. No change needed. The `fast` flag is irrelevant during reverse -- it is consumed only in the forward flow. |
| Reduced-motion interaction with fast morph | `MORPH_TIMING_REDUCED` already sets all durations to 0ms. When `prefersReducedMotion` is true, the choreography hook uses `MORPH_TIMING_REDUCED` regardless of the `fast` flag. No special handling needed. |
| `handleViewDistrict` in page.tsx | The INSPECT -> VIEW DISTRICT flow currently uses normal morph. Converting it to fast morph is a separate UX decision. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|---------------|--------|
| `src/lib/morph-types.ts` | `MorphState`, `MorphActions`, `MorphTimingConfig`, `MORPH_TIMING`, `MORPH_TIMING_REDUCED` types and constants | Available (read in discovery) |
| `src/stores/ui.store.ts` | `startMorph`, `resetMorph`, `setMorphPhase` actions, `INITIAL_MORPH_STATE`, `uiSelectors` | Available (read in discovery) |
| `src/hooks/use-morph-choreography.ts` | Forward flow effect, timer management, URL sync helper, public API | Available (read in discovery) |
| AD-4 (combined-recommendations) | Fast morph decision: 300ms, skip expanding+settled, idle -> entering-district directly | Documented and confirmed |
| Validation finding (HIGH) | Risk acknowledged: fast morph modifies core navigation. Mitigation via timing-only change + integration tests | Documented in combined-recommendations |

---

## 4. Deliverables

### 4.1. Type Extensions (in `src/lib/morph-types.ts`)

#### `StartMorphOptions` type

```typescript
/** Options for startMorph behavior. */
export interface StartMorphOptions {
  /**
   * When true, skip expanding + settled phases and transition
   * directly from idle to entering-district with reduced duration.
   * Used for search-initiated navigation where wayfinding animation
   * adds friction rather than value.
   */
  fast?: boolean
}
```

#### `MorphState` extension

Add `fast` field:

```typescript
export interface MorphState {
  phase: MorphPhase
  direction: MorphDirection
  targetId: NodeId | null
  phaseStartedAt: number | null
  /** Whether this morph uses the fast path (skip expanding + settled). */
  fast: boolean
}
```

#### `MorphActions` signature update

```typescript
export interface MorphActions {
  startMorph: (nodeId: NodeId, options?: StartMorphOptions) => void
  reverseMorph: () => void
  setMorphPhase: (phase: MorphPhase) => void
  resetMorph: () => void
}
```

#### `MORPH_TIMING_FAST` constant

```typescript
/**
 * Fast-path timing for search-initiated navigation.
 * Only enteringDistrict is relevant — expanding and settled are skipped.
 */
export const MORPH_TIMING_FAST: Readonly<MorphTimingConfig> = {
  expanding: 0,      // skipped
  settledHold: 0,    // skipped
  enteringDistrict: 300,
  leavingDistrict: 400,  // reverse is unchanged
} as const
```

### 4.2. Store Changes (in `src/stores/ui.store.ts`)

#### `INITIAL_MORPH_STATE` update

```typescript
const INITIAL_MORPH_STATE: MorphState = {
  phase: 'idle',
  direction: 'forward',
  targetId: null,
  phaseStartedAt: null,
  fast: false,
}
```

#### `UIActions` interface update

```typescript
startMorph: (nodeId: NodeId, options?: StartMorphOptions) => void
```

Import `StartMorphOptions` from `@/lib/morph-types`.

#### `startMorph` action implementation

```typescript
startMorph: (districtId, options) =>
  set((state) => {
    if (state.morph.phase !== 'idle') return // Guard: only start from idle

    state.selectedDistrictId = districtId
    state.morph.direction = 'forward'
    state.morph.targetId = districtId
    state.morph.phaseStartedAt = performance.now()

    if (options?.fast) {
      // Fast path: skip expanding + settled, jump to entering-district
      state.morph.phase = 'entering-district'
      state.morph.fast = true
    } else {
      // Normal path: begin expanding phase
      state.morph.phase = 'expanding'
      state.morph.fast = false
    }
  }),
```

**Key invariant preserved:** `startMorph` still only runs from `idle`. The fast flag changes which phase it transitions to, not whether the guard fires.

#### `resetMorph` -- no code change needed

`resetMorph` already spreads `INITIAL_MORPH_STATE` which now includes `fast: false`:

```typescript
resetMorph: () =>
  set((state) => {
    state.selectedDistrictId = null
    state.morph = { ...INITIAL_MORPH_STATE }
  }),
```

### 4.3. Choreography Hook Changes (in `src/hooks/use-morph-choreography.ts`)

#### Timing selection

The hook currently selects timing based on `prefersReducedMotion`. Add fast-path awareness:

```typescript
const fast = useUIStore((s) => s.morph.fast)

// Timing priority: reduced-motion > fast > normal
const timing = prefersReducedMotion
  ? MORPH_TIMING_REDUCED
  : fast
    ? MORPH_TIMING_FAST
    : MORPH_TIMING
```

**Precedence:** `MORPH_TIMING_REDUCED` (all 0ms) takes priority over `MORPH_TIMING_FAST` (300ms entering-district). Users who prefer reduced motion should never see animation, regardless of the fast flag.

#### Forward flow effect -- entering-district branch

The existing `entering-district` handler already works for fast morph because it reads from `timing.enteringDistrict`. With the timing selection above, fast morph uses 300ms and normal morph uses 600ms. No conditional logic needed inside the branch.

However, URL sync must be added to the `entering-district` handler for the fast path, because the `settled` handler (where URL sync normally happens) is skipped:

```typescript
if (phase === 'entering-district') {
  // URL sync: in fast morph, settled phase is skipped, so sync here
  if (fast) {
    syncUrlCategory(targetId)
  }
  clearPhaseTimer()
  phaseTimerRef.current = setTimeout(() => {
    setMorphPhase('district')
  }, timing.enteringDistrict)
}
```

#### Forward flow effect -- expanding and settled branches

No changes needed. In fast morph, `phase` is never set to `expanding` or `settled`, so these branches never execute. The existing code is inert for fast morph.

#### Effect dependency array update

Add `fast` to the forward flow effect's dependency array:

```typescript
}, [phase, direction, targetId, timing, fast, setMorphPhase, clearPhaseTimer])
```

#### Public API update

```typescript
const startMorph = useCallback(
  (nodeId: NodeId, options?: StartMorphOptions) => {
    if (phase !== 'idle') return
    startMorphAction(nodeId, options)
  },
  [phase, startMorphAction],
)
```

Update the `UseMorphChoreographyReturn` interface:

```typescript
interface UseMorphChoreographyReturn {
  phase: MorphPhase
  direction: MorphDirection
  targetId: NodeId | null
  isMorphing: boolean
  startMorph: (nodeId: NodeId, options?: StartMorphOptions) => void
  reverseMorph: () => void
}
```

### 4.4. No Changes to Existing Call Sites

All existing call sites call `startMorph(id)` without the second argument. Because `options` is optional and defaults to `undefined`, `options?.fast` evaluates to `undefined` (falsy), and the normal morph path executes. No existing code needs modification:

- `morph-orchestrator.tsx` -- `handleCapsuleSelect` and `handleIconSelect`: normal morph
- `page.tsx` -- `useInitialDistrictFromUrl`: normal morph (then immediate `setMorphPhase('settled')`)
- `page.tsx` -- `handleViewDistrict`: normal morph

### 4.5. Selector Additions

Add a fast-morph selector to `uiSelectors`:

```typescript
/** Whether the current morph is using the fast path (search-initiated). */
isFastMorph: (state: UIStore): boolean => state.morph.fast,
```

This is informational -- WS-3.3 or the DistrictViewOverlay may use it to adjust behavior (e.g., skip entrance animations). Not required by this workstream but cheap to provide.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `startMorph(id)` (no options) produces the existing phase sequence: idle -> expanding -> settled -> entering-district -> district, with existing timing (400ms + 200ms + 600ms) | Integration test: subscribe to morph.phase, call startMorph, assert phase sequence and approximate timing |
| AC-2 | `startMorph(id, { fast: true })` produces the fast phase sequence: idle -> entering-district -> district, with 300ms entering-district duration | Integration test: subscribe to morph.phase, call startMorph with fast option, assert phase sequence. The `expanding` and `settled` phases must never appear. |
| AC-3 | Fast morph syncs the category to the URL (despite skipping the `settled` phase where URL sync normally occurs) | Integration test: call startMorph with fast option, assert `window.location` search params contain `?category={id}` after entering-district phase begins |
| AC-4 | `resetMorph()` clears `morph.fast` to `false` so the next morph starts clean | Unit test: set morph.fast=true, call resetMorph, assert morph.fast===false |
| AC-5 | Normal morph after a fast morph uses normal timing (not fast) | Integration test: run fast morph to completion, call reverseMorph to return to idle, then call startMorph(id) without fast option. Assert expanding phase appears (confirming normal path). |
| AC-6 | Reverse morph from a fast-morphed district works identically to reverse from a normal-morphed district: leaving-district -> idle | Integration test: fast morph to district, call reverseMorph, assert leaving-district phase then idle |
| AC-7 | `prefersReducedMotion` takes priority over `fast` -- all durations are 0ms regardless of fast flag | Unit test: with prefersReducedMotion=true and fast=true, verify timing used is MORPH_TIMING_REDUCED |
| AC-8 | Existing call sites (`morph-orchestrator.tsx`, `page.tsx`) compile and behave identically without code changes | `pnpm typecheck` passes; manual smoke test: click a category card, verify normal morph animation |
| AC-9 | `MorphState` type includes `fast: boolean`; `StartMorphOptions` type is exported from `morph-types.ts` | TypeScript compilation: import both types in a test file, `pnpm typecheck` passes |
| AC-10 | `pnpm typecheck` passes with zero errors | CI verification |
| AC-11 | `pnpm lint` passes with zero new warnings | CI verification |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | **Store `fast` in `MorphState`, not as a separate `UIState` field** | The fast flag is morph-scoped state -- it describes a property of the current morph transition, not a global UI preference. It has the same lifecycle as `targetId` and `direction`: set by `startMorph`, cleared by `resetMorph`. Storing it inside `MorphState` keeps the morph state machine self-contained and ensures `resetMorph` (which spreads `INITIAL_MORPH_STATE`) clears it automatically. | (1) Separate `UIState` field (`isFastMorph: boolean`) -- rejected because it would need independent cleanup in `resetMorph` and is conceptually coupled to the morph lifecycle. (2) Not stored at all (pass timing config directly to choreography) -- rejected because the choreography hook reads state from the store via subscriptions, not via function arguments. Passing timing config would require a ref or context bridge that adds complexity. |
| D-2 | **Fast morph sets `phase: 'entering-district'` directly in `startMorph`** instead of using a separate "fast-expanding" phase | AD-4 says "skip expanding + settled phases, transition directly idle -> entering-district." Adding a new `MorphPhase` value (e.g., `'fast-entering'`) would require updating every phase guard, selector, and CSS class that references morph phases. The existing `entering-district` phase already triggers the district overlay visibility. By reusing it, the overlay, keyboard handlers, and selectors work without modification. | (1) Add `'fast-entering-district'` phase -- rejected because it would break the `isDistrictView` selector, the `DistrictViewOverlay` visibility check, the Escape key handler, and any CSS selectors targeting `entering-district`. The churn outweighs the benefit. (2) Set phase to `'expanding'` then immediately advance in choreography -- rejected because the expanding phase triggers visual effects (card scaling, sibling fading) that should not flash on screen during fast morph. |
| D-3 | **`MORPH_TIMING_FAST` as a separate constant** rather than inline conditionals in the choreography hook | Follows the existing pattern of `MORPH_TIMING` and `MORPH_TIMING_REDUCED`. Three named timing configs are self-documenting. The choreography hook selects the config once (reduced > fast > normal) and uses it uniformly. No branching inside individual phase handlers. | (1) Inline ternary `fast ? 300 : timing.enteringDistrict` in the entering-district handler -- rejected because it scatters timing knowledge across the handler and makes future tuning harder. (2) Modify `MORPH_TIMING` based on a flag -- rejected because timing constants should be immutable. |
| D-4 | **Timing precedence: reduced-motion > fast > normal** | `MORPH_TIMING_REDUCED` (all 0ms) is an accessibility requirement that overrides all aesthetic timing decisions. A user who has enabled `prefers-reduced-motion` should never see a 300ms animation just because the morph was search-initiated. The fast path is a UX optimization; reduced motion is an accessibility guarantee. | (1) Fast > reduced-motion -- rejected because it would violate reduced-motion preference for some transitions, contradicting WCAG 2.3.3. (2) Combine fast + reduced (use 0ms for fast when reduced-motion is set) -- this is effectively what the chosen approach does, since MORPH_TIMING_REDUCED sets everything to 0. |
| D-5 | **URL sync in entering-district handler (fast path only), not in startMorph** | URL sync via `history.replaceState` is a side effect that belongs in the choreography hook, not in the Zustand store action. The store action should only mutate state. The existing pattern syncs the URL in the `settled` handler; for fast morph (which skips settled), the entering-district handler is the equivalent sync point. | (1) Sync URL in `startMorph` store action -- rejected because store actions should be pure state mutations. The existing `startMorph` does not call `syncUrlCategory`. Mixing state mutation with browser API calls in a Zustand action breaks the separation. (2) Sync URL in a separate effect -- rejected because it would add a third URL sync path (settled, entering-district-fast, new effect) instead of two (settled, entering-district-fast). |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-3.4.1 | Should the `DistrictViewOverlay` entrance animation (currently 0.5s opacity fade) be shortened for fast morph? The morph phase transition is 300ms but the overlay fades in over 500ms, meaning the overlay is still fading when the morph reaches `district` phase. This may feel fine (content appears smoothly) or may feel laggy (user expects instant arrival). Recommend testing with real content before deciding. | world-class-ux-designer | WS-3.3 implementation |
| OQ-3.4.2 | Should `handleViewDistrict` in `page.tsx` (the INSPECT -> VIEW DISTRICT flow from AlertDetailPanel) also use fast morph? The user has already seen the alert on the map and is navigating to its category district. This is conceptually similar to search-initiated navigation: the user knows their target. However, the INSPECT flow includes a camera fly-back animation that may make fast morph feel abrupt. | world-class-ux-designer | Post Phase 3 |
| OQ-3.4.3 | R6 from the combined-recommendations notes that 300ms might feel jarring. If testing reveals this, should the fallback be 400ms (as noted in R6) or should the easing curve be adjusted? The current `entering-district` handler uses whatever easing `motion/react` applies to the overlay. The timing constant here controls the *phase duration* (how long before advancing to `district`), not the animation curve. | world-class-ux-designer | WS-3.3 implementation |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Fast morph introduces a new entry point to `entering-district` that bypasses the `expanding` visual effects (card scale, sibling fade). If any code assumes `expanding` always precedes `entering-district`, it will break. | Low | Medium | Code audit of all `expanding` phase consumers. The `CoverageGrid` component reads `morphPhase` for card styling; verify it handles the case where phase jumps from `idle` to `entering-district` without passing through `expanding`. The `morph-orchestrator.tsx` passes `morphPhase` to `CoverageGrid` but does not gate behavior on `expanding` having occurred. The grid cards use CSS classes keyed on morph phase, so they will simply not apply the expanding styles -- which is the desired behavior for fast morph. |
| R-2 | Adding `fast: boolean` to `MorphState` increases the interface surface. Future store changes must remember to account for the fast field. | Low | Low | `resetMorph` spreads `INITIAL_MORPH_STATE` (which includes `fast: false`), so cleanup is automatic. TypeScript will enforce the field's presence in any code that constructs a `MorphState` literal. |
| R-3 | The `useInitialDistrictFromUrl` hook in `page.tsx` calls `startMorph(districtParam)` then immediately `setMorphPhase('settled')`. With the new `fast` field, this path sets phase to `expanding` (normal path) then immediately overrides to `settled`. The `fast` flag is `false` (no options passed). This existing behavior is unaffected, but it is a non-standard phase progression (expanding -> settled with 0ms delay) that should be documented. | Low | None | This is pre-existing behavior, not introduced by this workstream. The `setMorphPhase('settled')` call directly violates the "only useMorphChoreography calls setMorphPhase" constraint, but it predates this workstream. Flag for future cleanup but do not address here. |
| R-4 | Race condition: if `startMorph(id, { fast: true })` is called and the choreography effect fires before the store update propagates, the `fast` variable in the effect may be stale (still `false` from previous render). | Low | Medium | Zustand state updates are synchronous within the same tick. The Immer middleware produces the new state atomically. React's `useEffect` runs after render, at which point `useUIStore((s) => s.morph.fast)` reflects the new value. Additionally, since `fast` is part of the same atomic state update as `phase`, they are always consistent when the effect fires. Add `fast` to the effect dependency array to ensure re-evaluation. |
| R-5 | The 300ms fast morph duration (from AD-4) might feel jarring with heavy district content that takes time to render. The entering-district phase transition happens at 300ms, but React rendering of `DistrictViewContent` may take longer, causing a flash of incomplete content. | Low | Medium | Per R6 in combined-recommendations: use an ease-out curve, and increase to 400ms if needed. Testing with real district content during WS-3.3 implementation will reveal whether 300ms is sufficient. The `DistrictViewOverlay` uses `Suspense` boundaries (if any) or `useCategoryIntel` loading states that handle async content. |
