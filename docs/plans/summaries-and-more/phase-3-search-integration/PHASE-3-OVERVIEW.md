# Phase 3 Overview -- Search Integration

> **Synthesized by:** CTA + SPO + STW + PMO
> **Date:** 2026-03-05
> **Workstreams:** WS-3.1 through WS-3.4
> **Phase prerequisite:** Phase 0 (WS-0.2 OperationalPriority type, WS-0.4 PriorityBadge component) complete
> **Backend dependency:** Phase C (C.2 -- `/console/search/intel` endpoint)

---

## 1. Executive Summary

Phase 3 replaces the command palette's local-only filtering with a live backend-powered search capability and provides fast, intentional navigation from search results to district views. It delivers four workstreams: a TanStack Query data hook with built-in debounce for full-text search (WS-3.1), an async search results group rendered inside the existing CommandPalette (WS-3.2), a click handler that wires search result selection to the morph navigation system (WS-3.3), and a fast morph extension to the morph state machine that reduces search-initiated navigation from ~1200ms to ~300ms (WS-3.4).

The phase is architecturally self-contained. Unlike Phase 2 (which depends on Phase 1 deliverables), Phase 3 can proceed independently of Phases 1 and 2 -- its only Phase 0 dependencies are the `OperationalPriority` type (WS-0.2) and the `PriorityBadge` component (WS-0.4). The single external dependency is Backend Phase C.2, which provides the `/console/search/intel` endpoint with PostgreSQL full-text search and `ts_headline` snippet generation.

Four cross-workstream conflicts were identified during synthesis (Section 3). All are specification inconsistencies, not design disagreements. The most significant is a hook API shape mismatch between WS-3.1 and WS-3.2 (Conflict 1), where WS-3.2's integration code assumes `useIntelSearch(inputValue)` returning bare TanStack Query results, while WS-3.1 defines `useIntelSearch(params: IntelSearchParams)` returning a composite `UseIntelSearchResult` wrapper. The remaining three are a field name discrepancy (`priority` vs `operationalPriority`), a linked open question pair about `totalCount` exposure, and a debounce mechanism description inconsistency.

Estimated total effort: 2.5 -- 3.5 developer-days for a single React developer. WS-3.4 (fast morph) has no intra-phase dependencies and can be built first. WS-3.1 follows, then WS-3.2, then WS-3.3 -- a strict linear critical path for the search data flow. WS-3.4 is also the highest-risk workstream (it modifies the morph state machine, flagged as HIGH concern in the combined-recommendations validation), but its scope is tightly bounded to timing constants and a single boolean flag.

---

## 2. Key Findings

Findings are grouped by theme, not by workstream.

### Data Architecture

- **Single hook, single consumer pattern.** Unlike the priority feed (Phase 2) where one hook (`usePriorityFeed`) serves multiple consumers (strip, panel, toasts), the `useIntelSearch` hook (WS-3.1) has effectively one consumer: the CommandPalette's Intel Search group (WS-3.2). WS-3.3 consumes search results indirectly via the `onSearchResultSelect` callback, not via a direct hook call. This simplifies the design -- there is no need for a wrapper type like `PriorityFeedSummary` with pre-computed aggregates. `SearchResult[]` is the only data shape.

- **Debounce lives inside the hook, not in consumers.** WS-3.1 D-1 places the 300ms debounce inside `useIntelSearch` using `useState` + `useEffect` + `setTimeout`/`clearTimeout`. This is a self-protecting pattern: every consumer gets debounce automatically, preventing API hammering from future consumers that might forget to debounce. The debounce is on the query parameter, not on the `queryFn` -- TanStack Query only receives stabilized query values, preventing cache pollution from intermediate keystrokes.

- **Composite return type bridges typing and UX states.** WS-3.1 exports `UseIntelSearchResult` wrapping both `queryResult: UseQueryResult<SearchResult[]>` and `debouncedQuery: string`. The `debouncedQuery` field enables WS-3.2 to distinguish three loading sub-states: "user is typing" (raw query !== debounced query), "query is in flight" (both equal but `isFetching`), and "results ready" (`data` populated). Without this, the debounce waiting state and the network loading state would be visually indistinguishable.

- **Query key namespacing follows project conventions.** The `intelSearchKey` factory produces keys under `['intel', 'search', {...params}]`, namespaced separately from `['intel', 'feed']` (general feed) and `['priority', 'feed']` (priority feed, Phase 2). This prevents accidental co-invalidation via TanStack Query's prefix matching, consistent with the pattern established by WS-2.1 D-5.

- **No polling, no window-focus refetch.** Unlike feed hooks that poll at intervals (15-60s) and refetch on window focus, search is purely on-demand. `refetchInterval` is disabled, and `refetchOnWindowFocus` is explicitly `false` (WS-3.1 D-5). This is correct for ephemeral search context -- the user triggers searches by typing, not by waiting.

### Visual & Interaction Design

- **Five visual states in the search group.** WS-3.2 defines a clear state machine for the Intel Search `CommandGroup`: Idle (< 3 chars, guidance text), Loading (spinner + "Searching..."), Results (up to 10 items), Empty ("No intel matches found"), Error ("Search unavailable -- try again"). These states map directly to TanStack Query's `isLoading`, `isError`, `data.length`, and the 3-character gate.

- **Two-line result items are a deliberate departure.** Search result `CommandItem` elements use a two-line layout (title row + snippet row), breaking from the single-line pattern used by command items. This is necessary to show both the alert title and the `ts_headline` keyword-in-context snippet. The layout is scoped via a `search-result-item` CSS class to avoid affecting other command groups (WS-3.2 D-7).

- **Achromatic priority channel enforced in search results.** Consistent with AD-1, search result items render PriorityBadge (shape only, no color) alongside a severity color dot. The snippet text uses a muted opacity tier (`rgba(255, 255, 255, 0.18)`), with `<b>` match highlights elevated to `0.55` opacity. This maintains the established visual hierarchy: severity owns color, priority owns shape.

- **Snippet sanitization is a single-regex allowlist.** WS-3.2 defines `sanitizeSnippet()` as a `<b>`-only HTML tag allowlist via `/<\/?(?!b\b)[^>]*>/gi`. This is defense-in-depth -- the source is our own PostgreSQL `ts_headline()` function, which generates only `<b>` tags. The regex strips any other HTML tag (including `<script>`, `<em>`, `<br/>`) while preserving entity encoding. The function is extracted to `src/lib/sanitize-snippet.ts` for reuse.

### Navigation Architecture

- **Fast morph is a timing-only change, not a phase-sequence change.** WS-3.4 D-2 reuses the existing `entering-district` phase rather than adding a new phase (e.g., `'fast-entering-district'`). When `options.fast` is true, `startMorph` sets the phase directly to `entering-district` (skipping `expanding` and `settled`), and the choreography hook uses `MORPH_TIMING_FAST` (300ms) instead of the standard timing (600ms). Every selector, CSS class, and keyboard handler that references `entering-district` works without modification.

- **Reuses the established `districtPreselectedAlertId` pattern.** WS-3.3 D-1 reuses the same navigation mechanism as the INSPECT -> VIEW DISTRICT flow: set `districtPreselectedAlertId` in the coverage store before calling `startMorph`. The `DistrictViewOverlay` consumes and clears the ID on mount (lines 62-70 of `district-view-overlay.tsx`). Zero changes to the overlay, dock, or content components.

- **Callback prop pattern decouples CommandPalette from store topology.** WS-3.2 D-2 adds `onSearchResultSelect?: (result: SearchResult) => void` as a callback prop on CommandPalette rather than importing `useCoverageStore` and `useUIStore` directly. This keeps CommandPalette as a general-purpose navigation tool without tight coupling to the coverage/district system. WS-3.3 implements the callback in the page-level component.

- **Timing precedence is accessibility-first.** WS-3.4 D-4 defines the timing selection order as: `MORPH_TIMING_REDUCED` (0ms, accessibility) > `MORPH_TIMING_FAST` (300ms, search) > `MORPH_TIMING` (standard). Users who have `prefers-reduced-motion` enabled will never see a 300ms animation, regardless of the fast flag. This satisfies WCAG 2.3.3.

- **URL sync compensates for skipped settled phase.** In the normal morph path, URL sync (`?category=seismic`) happens during the `settled` phase. Fast morph skips `settled`, so WS-3.4 D-5 adds URL sync to the `entering-district` handler when `fast === true`. This is a side effect in the choreography hook (not in the store action), consistent with the existing separation of state mutation from browser API calls.

---

## 3. Cross-Workstream Conflicts

Four conflicts identified. All are resolvable at implementation time without architectural changes.

### Conflict 1: Hook API shape mismatch between WS-3.1 and WS-3.2

**SOWs involved:** WS-3.1, WS-3.2

**WS-3.1 specifies (Section 4.8 / 4.9):**
> `useIntelSearch(params: IntelSearchParams): UseIntelSearchResult`
> Returns a composite object: `{ queryResult: UseQueryResult<SearchResult[]>, debouncedQuery: string }`.
> `IntelSearchParams` is an object with `query: string` plus optional filter fields (`category`, `severity`, `dateFrom`, `dateTo`, `limit`, `offset`).

**WS-3.2 specifies (Section 4.8):**
> ```typescript
> const { data: searchResults, isLoading: isSearching, isError: isSearchError } =
>   useIntelSearch(inputValue)
> ```
> Calls the hook with a bare string argument and destructures a bare TanStack Query result.

**Nature of conflict:** WS-3.2's integration code passes a string where WS-3.1 expects an `IntelSearchParams` object, and destructures `{ data, isLoading, isError }` from a result that WS-3.1 wraps in `{ queryResult, debouncedQuery }`. If implemented literally, WS-3.2 would fail at both call site and destructure.

**Resolution:** WS-3.2 must adapt to WS-3.1's actual API. The corrected integration code:

```typescript
const { queryResult, debouncedQuery } = useIntelSearch({ query: inputValue })
const { data: searchResults, isLoading: isSearching, isError: isSearchError } = queryResult
```

The `debouncedQuery` value can be used to refine the state derivation in Section 4.8 -- specifically, `showSearchIdle` can check `inputValue.length < 3` (immediate feedback) while the loading state can use `debouncedQuery` for the "Searching..." indicator.

**Owner:** react-developer, resolved at WS-3.2 implementation time. Update WS-3.2 SOW Section 4.8 if maintaining living documents.

---

### Conflict 2: Field name discrepancy -- `priority` vs `operationalPriority`

**SOWs involved:** WS-3.1, WS-3.2, WS-3.3

**WS-3.1 specifies (Section 4.4):**
> `SearchResult` has `operationalPriority: OperationalPriority | null` (nullable, following the WS-1.1 naming convention).

**WS-3.2 specifies (Sections 4.4, 4.8, 5):**
> References `result.priority` in the PriorityBadge render (`priority={result.priority}`), in the `aria-label` template (`{result.priority} {result.severity}: {result.title}`), and in the Section 3 Input Dependencies table ("priority: OperationalPriority").

**WS-3.2 OQ-4 explicitly flags this:**
> "What is the exact field name for priority on `SearchResult` -- `priority` or `operationalPriority`?"

**WS-3.3 specifies (Section 3):**
> References both `priority` (in the `SearchResult` type description) and accesses `result.category` and `result.id` but does not directly access a priority field.

**Nature of conflict:** This is the same naming discrepancy identified as Conflict 1 in Phase 1 (WS-1.1 vs WS-1.3). WS-3.1 uses the established project-wide field name `operationalPriority`; WS-3.2 uses the shorter `priority`.

**Resolution:** WS-3.2 must use `result.operationalPriority`, not `result.priority`. Update all references:
- PriorityBadge render: `priority={result.operationalPriority}`
- Aria-label: `{result.operationalPriority ?? ''} {result.severity}: {result.title}`
- Null guard: `{result.operationalPriority && <PriorityBadge priority={result.operationalPriority} size="sm" />}`

The null guard is important because `SearchResult.operationalPriority` is `OperationalPriority | null` (WS-3.1 D-3), meaning some search results may lack a priority assignment.

**Owner:** react-developer, resolved at WS-3.2 implementation time. This resolves WS-3.2 OQ-4.

---

### Conflict 3: Linked open questions about `totalCount` exposure

**SOWs involved:** WS-3.1, WS-3.2

**WS-3.1 OQ-5 asks:**
> "Should the hook expose `totalCount` from the API response? Currently, `fetchIntelSearch` returns only `SearchResult[]`, discarding `total_count`."

**WS-3.2 OQ-3 asks:**
> "Should the command palette show a 'See all results' item at the bottom of the list when 10 results are returned (implying more exist)?"

**Nature of conflict:** These are causally linked but neither SOW references the other. If WS-3.2 wants "See all results," it needs `totalCount` from WS-3.1. If WS-3.1 decides not to expose `totalCount`, the "See all results" feature is infeasible.

**Resolution:** Defer both. For the initial implementation:
1. WS-3.1 discards `total_count` as specified (returns `SearchResult[]`).
2. WS-3.2 does not show "See all results."

If a "See all results" feature is later desired, WS-3.1's `fetchIntelSearch` can be updated to return `{ results: SearchResult[], totalCount: number }`, and the `UseIntelSearchResult` wrapper can expose it alongside `queryResult` and `debouncedQuery`. This is an additive change.

**Owner:** react-developer. Deferred to post-Phase 3. Log as a backlog item.

---

### Conflict 4: Debounce mechanism description inconsistency

**SOWs involved:** WS-3.1

**WS-3.1 Section 1 (Objective) states:**
> "The debounce is implemented at the hook level using a `useDeferredValue` + local state pattern."

**WS-3.1 Section 2 (Scope) and Section 4.8 (Debounce Implementation) state:**
> "Implemented via `useState` + `useEffect` with a `setTimeout`/`clearTimeout` pattern."
> Section 4.8 explicitly rejects `useDeferredValue` with a multi-paragraph rationale.

**Nature of conflict:** The objective section contradicts the scope and deliverable sections. The scope and deliverable sections are authoritative (they contain the design rationale and the implementation pattern), but the objective section could mislead an implementer who reads only the top of the document.

**Resolution:** Update WS-3.1 Section 1 (Objective) to read: "The debounce is implemented at the hook level using a `useState` + `useEffect` + `setTimeout`/`clearTimeout` pattern so that TanStack Query only fires when the debounced query stabilizes." This is a documentation correction only.

**Owner:** STW. Correct before implementation if maintaining living documents.

---

## 4. Architecture Decisions

Consolidated from all four workstreams. Decisions are grouped thematically.

| ID | Decision | Source | Rationale |
|----|----------|--------|-----------|
| **Data Layer** | | | |
| WS-3.1 D-1 | Debounce at 300ms inside the hook using `useState` + `useEffect` + `setTimeout`/`clearTimeout`. | WS-3.1 | Self-protecting: every consumer gets debounce automatically. 300ms is the standard search debounce interval. Prevents cache pollution from intermediate keystrokes. |
| WS-3.1 D-2 | Gate on `debouncedQuery.length >= 3` (not raw `query.length >= 3`). | WS-3.1 | Prevents flash of enabled/disabled state during typing. The debounced value provides a stable gate. |
| WS-3.1 D-3 | `SearchResult.operationalPriority` is `OperationalPriority \| null` (nullable). | WS-3.1 | Search results span all priority levels including unassigned items. Nullable type is honest about the data contract. |
| WS-3.1 D-4 | Return `SearchResult[]` (flat array), not a summary wrapper object. | WS-3.1 | Single consumer (CommandPalette). No pre-computed aggregates needed. |
| WS-3.1 D-5 | No polling. `refetchOnWindowFocus: false`. | WS-3.1 | Search is on-demand. Polling and window-focus refetch add no value for ephemeral search context. |
| WS-3.1 D-6 | Pass `snippet` (raw HTML) through without sanitization. | WS-3.1 | Sanitization is a rendering concern (WS-3.2), not a data-fetching concern. Keeps the hook testable without DOM dependencies. |
| WS-3.1 D-7 | Export `UseIntelSearchResult` composite return type wrapping `UseQueryResult` + `debouncedQuery`. | WS-3.1 | Enables WS-3.2 to distinguish typing, loading, and results-ready states. |
| WS-3.1 D-8 | Query key factory function `intelSearchKey(params)` (not static constant). | WS-3.1 | Parameterized queries need parameterized keys. Factory serves both specific lookup and broad prefix invalidation. |
| WS-3.1 D-9 | CamelCase-to-snake_case param mapping in `fetchIntelSearch`, not a shared utility. | WS-3.1 | Only two fields need mapping (`dateFrom` -> `date_from`, `dateTo` -> `date_to`). Premature abstraction avoided. |
| WS-3.1 D-10 | Default `limit` to 10, `offset` to 0 in `fetchIntelSearch`. | WS-3.1 | 10 results is WS-3.2's display cap. Defaults in the query function ensure consistent behavior. |
| **Visual Design** | | | |
| WS-3.2 D-1 | Position Intel Search group between Actions and AI, not at the top. | WS-3.2 | Quick commands first (always visible), search second (conditional on input), AI last (experimental). Respects information hierarchy. |
| WS-3.2 D-3 | Render snippet via `dangerouslySetInnerHTML` with `<b>`-only sanitizer, not HTML parser. | WS-3.2 | Single-regex sanitizer is sufficient for controlled `ts_headline` output. Avoids dependency weight of `html-react-parser` or `DOMPurify`. |
| WS-3.2 D-4 | Use Lucide `Loader2` with `animate-spin` for loading state. | WS-3.2 | Consistent with existing usage in `pipeline-station.tsx`. Short loading duration makes skeleton inappropriate. |
| WS-3.2 D-5 | `aria-label` on `CommandItem` container, not nested content for screen readers. | WS-3.2 | Prevents noisy announcements from `dangerouslySetInnerHTML` content and decorative elements. |
| WS-3.2 D-6 | Do not display the `score` field in the UI. | WS-3.2 | Results are pre-ranked. Numeric score adds visual noise without aiding analyst decisions. Positional ranking is sufficient. |
| WS-3.2 D-7 | Scope two-line layout via `search-result-item` CSS class, not inline styles. | WS-3.2 | Consistent with existing `command-palette.css` approach. Enables glass-themed hover/selected state overrides. |
| WS-3.2 D-8 | Fixed `pl-[28px]` indentation for snippet alignment. | WS-3.2 | Sufficient because PriorityBadge and severity dot have fixed widths at `sm` size. Simpler than grid or nested flex. |
| **Navigation** | | | |
| WS-3.2 D-2 | Callback prop `onSearchResultSelect` rather than direct store coupling in CommandPalette. | WS-3.2 | Keeps CommandPalette reusable. Delegates navigation decisions to page-level orchestration. Consistent with existing `onRefresh` prop. |
| WS-3.3 D-1 | Reuse `districtPreselectedAlertId` pattern, not a new navigation mechanism. | WS-3.3 | Proven pattern: set ID, start morph, overlay consumes ID on mount. Zero changes to DistrictViewOverlay. |
| WS-3.3 D-2 | Handler defined in CommandPalette.tsx, not in useCommandPalette hook. | WS-3.3 | Search navigation is not a registered command. Mixing it into the command registry hook would blur concerns. Handler is ~5 lines. |
| WS-3.3 D-3 | Use fast morph (`{ fast: true }`) for all search result navigation. | WS-3.3 | Search is intentional, targeted navigation. Standard morph's wayfinding phases are unnecessary. 300ms provides responsive feedback. |
| WS-3.3 D-4 | Close palette before starting morph (Step 2 before Step 3). | WS-3.3 | Palette at z-50 would cover the district entrance animation at z-30. Closing first ensures visual clarity. |
| WS-3.3 D-5 | Rely on `startMorph`'s built-in idle guard; no duplicate guard in handler. | WS-3.3 | Guard exists at ui.store.ts line 104. Duplicate guard requires subscribing to `morph.phase` for no benefit. |
| **Morph State Machine** | | | |
| WS-3.4 D-1 | Store `fast` in `MorphState`, not as a separate `UIState` field. | WS-3.4 | Morph-scoped state with the same lifecycle as `targetId` and `direction`. `resetMorph` clears it automatically. |
| WS-3.4 D-2 | Fast morph sets `phase: 'entering-district'` directly, not a new phase. | WS-3.4 | Reuses existing phase. Avoids breaking selectors, CSS classes, and keyboard handlers that reference `entering-district`. |
| WS-3.4 D-3 | `MORPH_TIMING_FAST` as a separate named constant. | WS-3.4 | Follows `MORPH_TIMING` / `MORPH_TIMING_REDUCED` pattern. Three named configs are self-documenting. |
| WS-3.4 D-4 | Timing precedence: `MORPH_TIMING_REDUCED` > `MORPH_TIMING_FAST` > `MORPH_TIMING`. | WS-3.4 | Accessibility override takes priority. `prefers-reduced-motion` means 0ms always. WCAG 2.3.3. |
| WS-3.4 D-5 | URL sync in `entering-district` handler (fast path only), not in `startMorph` store action. | WS-3.4 | Side effects belong in the choreography hook. Store actions are pure state mutations. Existing pattern syncs in `settled`; fast morph adds a second sync point. |

---

## 5. Cross-Workstream Dependencies

```
Phase 0 Deliverables
  WS-0.2 (OperationalPriority type) ──────┐
  WS-0.4 (PriorityBadge component) ────┐  |
                                        |  |
Backend Phase C.2 ──────────────────┐   |  |
                                    |   |  |
                                    v   v  v
  WS-3.4 (Fast Morph Support)     WS-3.1 (useIntelSearch Hook)
    |                                |
    |                                v
    |                          WS-3.2 (Async Search in CommandPalette)
    |                                |
    +-------->---------+             v
                       +-------> WS-3.3 (Search -> Fast Morph Navigation)
```

**Detailed dependency table:**

| Upstream | Downstream | What Is Needed | Nature |
|----------|-----------|----------------|--------|
| WS-0.2 | WS-3.1 | `OperationalPriority` type for `SearchResult.operationalPriority` field | Hard -- imported in the hook file |
| WS-0.4 | WS-3.2 | `PriorityBadge` component for search result item rendering | Hard -- badge is the visual deliverable |
| Backend C.2 | WS-3.1 | `GET /console/search/intel` endpoint with `ts_headline` snippets, `category`, `severity`, `operational_priority`, `score` | Soft -- hook can be built with MSW mocks (WS-3.1 R-1) |
| WS-3.1 | WS-3.2 | `useIntelSearch` hook, `SearchResult` type, `UseIntelSearchResult` type | Hard -- search group consumes the hook's output |
| WS-3.1 | WS-3.3 | `SearchResult` type (specifically `id` and `category` fields) | Hard -- handler reads result properties |
| WS-3.2 | WS-3.3 | `onSearchResultSelect` callback prop interface; search result `CommandItem` elements with `onSelect` wiring | Hard -- WS-3.3 implements what WS-3.2 exposes |
| WS-3.4 | WS-3.3 | `startMorph(nodeId, options?)` extended signature with `{ fast: true }` support | Soft -- without WS-3.4, standard morph still works correctly (WS-3.3 R-1) |

**Critical path:** WS-3.1 -> WS-3.2 -> WS-3.3

**Independent track:** WS-3.4 has no intra-phase dependencies. It can be built first, in parallel, or even after Phase 3's other workstreams (WS-3.3 gracefully degrades to standard morph).

**External dependencies:**

| Dependency | Required By | Status | Risk |
|------------|-------------|--------|------|
| `OperationalPriority` type (WS-0.2) | WS-3.1 | Phase 0 deliverable | LOW -- local type alias as fallback (WS-3.1 R-7) |
| `PriorityBadge` component (WS-0.4) | WS-3.2 | Phase 0 deliverable | LOW -- text fallback placeholder (WS-3.2 R-2) |
| `/console/search/intel` endpoint | WS-3.1 | Not yet implemented | HIGH -- WS-3.1 R-1. Mitigated by MSW mocks |
| `category` field on search results | WS-3.3 | Validation finding M-2 | MEDIUM -- if absent, morph navigation is blocked (WS-3.1 R-2) |

---

## 6. Consolidated Open Questions

Questions from all four workstreams, deduplicated and grouped. Blocking questions are flagged.

### BLOCKING -- must be resolved before implementation begins

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-B1 | Does the `/console/search/intel` endpoint exist or is it planned? What is the exact response schema? Must include `category` per validation finding M-2 and `operational_priority` per WS-3.1 OQ-1. | WS-3.1 OQ-1 + M-2 | Backend team |
| OQ-B2 | What is the exact `ts_headline` configuration on the backend? Specifically: (a) which HTML tags wrap matched terms (`<b>`, `<mark>`, or custom), (b) what is the snippet length/fragment count, (c) are `StartSel`/`StopSel` configurable? This affects WS-3.2's sanitization allowlist. | WS-3.1 OQ-2 | Backend team |

### NON-BLOCKING -- can be resolved during or after implementation

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-1 | Should the search group be visually collapsed (heading only, no guidance text) when the user has not typed anything, to reduce visual noise? | WS-3.2 OQ-1 | information-architect |
| OQ-2 | Should search results show a category badge or indicator alongside the severity dot? | WS-3.2 OQ-2 | information-architect |
| OQ-3 | Should the hook expose `totalCount` and should the palette show "See all results"? (Linked: WS-3.1 OQ-5 + WS-3.2 OQ-3. See Conflict 3 resolution -- deferred.) | WS-3.1 OQ-5, WS-3.2 OQ-3 | react-developer |
| OQ-4 | Should the 300ms debounce interval be configurable via a `debounceMs` parameter? | WS-3.1 OQ-4 | react-developer |
| OQ-5 | Does the endpoint support multiple category filters (`?category=seismic&category=conflict`) or only a single category? | WS-3.1 OQ-3 | Backend team |
| OQ-6 | When the user is already viewing a district and searches for an alert in a *different* category, should the handler chain a reverse + forward morph, or silently ignore the click? | WS-3.3 Q-1 | react-developer |
| OQ-7 | When the user searches for an alert in the *same* category as the currently open district, should the handler skip the morph entirely and directly set `districtPreselectedAlertId`? | WS-3.3 Q-2 | react-developer |
| OQ-8 | Should `districtPreselectedAlertId` be cleared if the fast morph is silently blocked by the idle guard? | WS-3.3 Q-3 | react-developer |
| OQ-9 | Should the `DistrictViewOverlay` entrance animation (0.5s opacity fade) be shortened for fast morph? The morph phase is 300ms but the overlay fades in over 500ms. | WS-3.4 OQ-3.4.1 | world-class-ux-designer |
| OQ-10 | Should `handleViewDistrict` in `page.tsx` (INSPECT -> VIEW DISTRICT flow) also use fast morph? | WS-3.4 OQ-3.4.2 | world-class-ux-designer |
| OQ-11 | If 300ms feels jarring (R6 from combined-recommendations), should the fallback be 400ms or should the easing curve be adjusted? | WS-3.4 OQ-3.4.3 | world-class-ux-designer |
| OQ-12 | Should `CommandEmpty` behavior change when structured commands match nothing but search results exist? With `filter={() => 1}`, `CommandEmpty` never renders, but verify during implementation. | WS-3.2 OQ-5 | react-developer |

**Summary:** Two blocking questions (OQ-B1 and OQ-B2) require backend team input before implementation. OQ-B1 encompasses the endpoint's existence, schema, and the critical `category` field (validation finding M-2). All other questions are non-blocking and can be resolved during implementation or deferred to integration testing.

---

## 7. Phase Exit Criteria

All criteria must pass before Phase 3 is considered complete.

| ID | Criterion | Verification |
|----|-----------|-------------|
| PE-1 | `useIntelSearch({ query: 'earthquake' })` returns `UseIntelSearchResult` with `queryResult.data: SearchResult[]` and `debouncedQuery: string` from the live `/console/search/intel` endpoint (or MSW mock). | Unit test + manual verification against TarvaRI backend. |
| PE-2 | `SearchResult` includes all required fields: `id`, `title`, `snippet`, `severity`, `category`, `operationalPriority`, `score`. The `category` field is a required non-nullable string. | `pnpm typecheck` -- verify field access without null checks on `category`. |
| PE-3 | The hook debounces at 300ms: rapid typing produces exactly one fetch for the final stabilized value. | Unit test with `vi.useFakeTimers()` simulating keystroke sequences. |
| PE-4 | The hook does not fetch when the debounced query is fewer than 3 characters. | Unit test: set query to "ab", advance past debounce, assert no fetch. |
| PE-5 | An "Intel Search" `CommandGroup` appears in the command palette between the Actions group and the AI group. | Open palette (Cmd+K). Visually confirm heading position. |
| PE-6 | When input has fewer than 3 characters, the search group shows guidance text "Type 3+ characters to search intel". | Open palette, type 0-2 characters, confirm guidance text. |
| PE-7 | When input has 3+ characters and search is loading, a spinning `Loader2` icon with "Searching..." text appears. | Open palette, type 3+ characters, observe spinner during debounce + fetch. |
| PE-8 | Search results render with PriorityBadge (achromatic shape) + severity color dot + title on line 1 and sanitized snippet on line 2. Up to 10 results shown. | Search for a term with results. Visual inspection of two-line layout and badge rendering. |
| PE-9 | Snippet `<b>` tags render as bold text. No other HTML tags survive sanitization. | Search for a term. Verify bold highlights. Inject mock result with `<script>` tag, verify stripped. |
| PE-10 | When search returns zero results, "No intel matches found" message appears. | Search for a random UUID string. Confirm empty state message. |
| PE-11 | When the search hook errors, "Search unavailable -- try again" message appears. | Disable TarvaRI backend. Type 3+ characters. Confirm error state message. |
| PE-12 | Clicking (or pressing Enter on) a search result closes the palette, triggers fast morph to the result's category district, and pre-selects the alert in the dock panel. | Click a search result. Verify: palette closes, morph animation plays (~300ms), district overlay shows the correct category, dock panel shows the clicked alert. |
| PE-13 | Fast morph completes in ~300ms with phase sequence: `idle` -> `entering-district` -> `district`. No `expanding` or `settled` phases. | Console.log or React DevTools: confirm phase sequence and timing. |
| PE-14 | Fast morph syncs the category to the URL (`?category=seismic`) despite skipping the `settled` phase. | Verify URL params after fast morph completes. |
| PE-15 | `startMorph(id)` (no options) still produces the standard phase sequence: `idle` -> `expanding` -> `settled` -> `entering-district` -> `district`. | Click a category card in the grid. Verify normal morph animation. |
| PE-16 | `resetMorph()` clears `morph.fast` to `false` so subsequent normal morphs are unaffected. | Fast morph to district, reverse morph, then normal morph. Confirm normal morph uses standard timing. |
| PE-17 | `prefersReducedMotion` takes priority over `fast` -- all durations are 0ms regardless of fast flag. | Enable reduced motion in OS settings. Search and click a result. Confirm instant transition. |
| PE-18 | `sanitizeSnippet` is exported from `src/lib/sanitize-snippet.ts` and passes all edge cases from WS-3.2 Section 4.1. | Unit test or manual test of all edge case inputs. |
| PE-19 | The `CommandInput` placeholder text reads "Navigate, zoom, or search intel...". | Open palette. Visually confirm placeholder text. |
| PE-20 | `pnpm typecheck` passes with zero errors. | CLI verification. |
| PE-21 | `pnpm build` completes without errors. | CLI verification. |

---

## 8. Inputs Required by Next Phase

These artifacts or decisions must be finalized during Phase 3 to unblock subsequent work.

| Input | Produced By | Consumed By | Description |
|-------|-------------|-------------|-------------|
| `SearchResult` type | WS-3.1 | Future search surfaces (e.g., dedicated search page, related intel section) | Stable type contract for search result data. |
| `intelSearchKey` query key factory | WS-3.1 | Any future hook that invalidates search caches | Query key factory for cross-hook cache coordination. |
| `sanitizeSnippet` utility | WS-3.2 | Any future surface rendering `ts_headline` HTML snippets | Reusable `<b>`-only sanitizer for server-generated HTML. |
| `StartMorphOptions` type | WS-3.4 | Future morph callers that need non-standard timing (e.g., INSPECT -> VIEW DISTRICT) | Extensible options interface for morph behavior. |
| `MORPH_TIMING_FAST` constant | WS-3.4 | Future timing customization or tuning | Named timing config for search-initiated navigation. |
| `isFastMorph` selector | WS-3.4 | DistrictViewOverlay animation tuning, future conditional behavior based on morph speed | Informational selector indicating fast morph in progress. |
| `onSearchResultSelect` callback pattern | WS-3.2 | Future CommandPalette extensions (e.g., geo summary navigation from palette) | Established callback interface for palette-initiated navigation. |
| Validated `category` field on search results | WS-3.1 + Backend C.2 | Phase 4 geo intelligence (search within region), deferred "Related Intel" feature | Confirmed API contract for category on search results. |

---

## 9. Gaps and Recommendations

### Gap 1: No integration wiring specification for the search-to-morph pipeline

**Description:** Four SOWs define individual pieces (hook, UI, click handler, store extension), but no SOW specifies the full integration wiring in `page.tsx`. WS-3.2 defines the `onSearchResultSelect` callback prop, and WS-3.3 defines the handler logic, but neither specifies the exact page-level code that passes the handler to CommandPalette. The handler requires three store reads (`setDistrictPreselectedAlertId`, `setOpen`, `startMorph`), which WS-3.3 Section 4.3 documents as needed but does not specify where they are obtained in the page-level context.

**Recommendation (CTA):** The handler should be defined in `page.tsx` (which already orchestrates morph + store + camera) and passed as the `onSearchResultSelect` prop to CommandPalette. The three store actions are already available or easily obtained in page.tsx:
- `startMorph` is available from `useUIStore((s) => s.startMorph)` (already obtained in page.tsx at line 251).
- `setDistrictPreselectedAlertId` can be obtained from `useCoverageStore`.
- `setOpen` is available from `useCommandPalette()` or can be accessed via `useUIStore`.

This is a ~10-line wiring task, not a separate workstream, but it should be documented as part of WS-3.3's deliverables.

**Priority:** HIGH -- without this, the implementer must infer the integration pattern.

### Gap 2: WS-3.3 handler placement contradicts WS-3.2 callback design

**Description:** WS-3.2 D-2 defines `onSearchResultSelect` as a callback prop on CommandPalette, explicitly to decouple the palette from store topology. WS-3.3 D-2 states the handler is "defined inside `CommandPalette.tsx`" and imports `useUIStore` and `useCoverageStore` directly. These two decisions contradict: if the handler is inside CommandPalette, the callback prop is unnecessary; if the callback prop is the integration point, the handler should be outside CommandPalette.

**Resolution (CTA):** Follow WS-3.2 D-2 (callback prop pattern). The handler is defined in `page.tsx` and passed as `onSearchResultSelect` to CommandPalette. WS-3.3 D-2's statement about defining the handler "inside CommandPalette.tsx" should be corrected to "inside the page component that renders CommandPalette." The store reads documented in WS-3.3 Section 4.3 are obtained in page.tsx, not in CommandPalette.

**Priority:** MEDIUM -- the two SOWs give conflicting guidance on the same integration point.

### Gap 3: No error boundary or fallback for search hook failure

**Description:** WS-3.2 defines an error state ("Search unavailable -- try again") for when the search hook returns `isError`. However, no SOW addresses the case where the `useIntelSearch` hook itself throws during render (e.g., network error in the query function that escapes TanStack Query's error handling). React error boundaries are not mentioned in any Phase 3 SOW.

**Recommendation (CTA):** TanStack Query's error handling is robust -- errors in `queryFn` are caught and surfaced via `isError` / `error` on the query result, not thrown during render. The risk of an unhandled exception is very low. However, the existing `ErrorBoundary` in the application (if one exists) should wrap the CommandPalette or the search group to prevent a search failure from crashing the entire palette. This is a defensive measure, not a primary deliverable.

**Priority:** LOW -- TanStack Query's error handling covers the primary failure mode.

### Gap 4: No specification for search result keyboard accessibility beyond cmdk defaults

**Description:** WS-3.2 AC-13 states "Keyboard navigation (arrow keys) correctly traverses search result items alongside command items" and relies on cmdk's built-in keyboard handling. WS-3.3 AC-7 states "Pressing Enter on a keyboard-focused search result triggers the same navigation as clicking." Both assume cmdk's default behavior is sufficient, but neither specifies:
- Tab key behavior within the search group
- Screen reader announcement when navigating between command groups and search groups
- Focus management after the palette closes and the morph begins

**Recommendation (SPO):** cmdk's keyboard handling is well-tested and should handle arrow-key traversal and Enter selection correctly. However, focus management after palette close deserves attention: when the palette closes and the morph begins, focus returns to the document body (or the previously focused element). The district overlay should capture focus when it mounts. Verify this during WS-3.3 integration testing.

**Priority:** LOW -- cmdk handles the primary keyboard interactions. Focus management is a polish concern.

### Gap 5: No test infrastructure for Phase 3 deliverables

**Description:** Consistent with Phases 1 and 2, no SOW includes a test plan. WS-3.1 describes 19 acceptance criteria with verification methods including "Unit test with `vi.useFakeTimers()`" but does not specify test file locations or whether `pnpm test:unit` is configured.

**Recommendation (PMO):** If Vitest was set up during Phase 0 (per Phase 0 Gap 1), write targeted tests for:
- **WS-3.1:** Debounce timing (fake timers), normalizer field mapping, enabled gate, query key factory.
- **WS-3.2:** `sanitizeSnippet` edge cases (the function is pure and easily testable).
- **WS-3.4:** Phase sequence verification for both normal and fast morph paths.

If Vitest is not available, verification is via `pnpm typecheck`, `pnpm build`, and manual testing -- adequate for a 4-workstream phase.

**Priority:** MEDIUM -- tests can be written alongside implementation, but explicit guidance reduces ambiguity.

---

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream | Size | Estimate | Complexity Drivers |
|------------|------|----------|--------------------|
| WS-3.4 | S | 0.5 days | Three files modified (`morph-types.ts`, `ui.store.ts`, `use-morph-choreography.ts`). Bounded scope: one boolean flag, one timing constant, one conditional branch in `startMorph`, one URL sync addition. Highest risk in the phase (modifies core navigation), but smallest blast radius. |
| WS-3.1 | S | 0.5 days | Single new file (`use-intel-search.ts`). Follows established hook pattern (`use-intel-feed.ts`, `use-category-intel.ts`). Types, debounce logic, query function, hook -- all well-defined. Blocked on backend endpoint availability (MSW mock as fallback). |
| WS-3.2 | M | 1.0 -- 1.5 days | Modifies `CommandPalette.tsx` (341 lines). New file: `sanitize-snippet.ts`. New CSS rules. Five visual states. Two-line result item layout. Snippet sanitization. Accessibility attributes. Most complex UI work in this phase. |
| WS-3.3 | S | 0.25 days | ~10 lines of wiring code. Three store reads, one callback function, one prop pass-through. No new files. No new components. Entirely dependent on WS-3.1, WS-3.2, and WS-3.4 being complete. |

**Total estimate:** 2.25 -- 2.75 developer-days (single developer).

This aligns with the combined-recommendations estimate of "~3 days" when accounting for context switching, verification, conflict resolution, and integration testing.

### Recommended Sequencing

```
Prerequisite: Phase 0 complete (WS-0.2 + WS-0.4) + OQ-B1/OQ-B2 resolved

Day 1 (morning):
  1. WS-3.4 -- Fast morph support (independent, no intra-phase deps)
     - morph-types.ts: StartMorphOptions, MorphState.fast, MORPH_TIMING_FAST
     - ui.store.ts: startMorph signature extension, INITIAL_MORPH_STATE
     - use-morph-choreography.ts: timing selection, URL sync, public API
     - pnpm typecheck + pnpm build + smoke test normal morph

Day 1 (afternoon):
  2. WS-3.1 -- useIntelSearch hook
     - src/hooks/use-intel-search.ts (single new file)
     - Types, debounce, query function, hook
     - pnpm typecheck + manual verification with MSW or live endpoint

Day 2:
  3. WS-3.2 -- Async search group in CommandPalette (largest workstream)
     - src/lib/sanitize-snippet.ts (new file)
     - CommandPalette.tsx modifications
     - command-palette.css additions
     - Five visual states + result item layout + accessibility
     - pnpm typecheck + pnpm build + visual verification

Day 3 (morning):
  4. WS-3.3 -- Search -> fast morph navigation wiring
     - Handler in page.tsx (Gap 1 resolution)
     - onSearchResultSelect prop pass-through
     - pnpm typecheck + end-to-end verification

Day 3 (afternoon):
  5. Integration verification
     - Full search-to-district flow
     - Fast morph timing verification
     - Normal morph regression test
     - Keyboard navigation through search results
     - Phase exit criteria checklist
```

**Rationale for ordering:**
- WS-3.4 first: zero dependencies, can be verified independently, unblocks WS-3.3's fast morph call. Building it first also de-risks the highest-concern item early.
- WS-3.1 second: the data foundation consumed by WS-3.2 and WS-3.3.
- WS-3.2 third: the largest workstream and the visual integration point. Benefits from WS-3.1 being available.
- WS-3.3 last: pure wiring, smallest scope, requires all other workstreams to be complete.

### Parallelization Opportunities

If two developers are available:

- **Developer A:** WS-3.4 -> WS-3.1 (store + data track)
- **Developer B:** (waits for WS-3.1) -> WS-3.2 -> WS-3.3 (UI + wiring track)

This reduces wall-clock time to ~2 days. The handoff point is the `SearchResult` type and `useIntelSearch` hook from WS-3.1, which Developer B needs for WS-3.2.

Alternatively, Developer B can start WS-3.2 with a mock `useIntelSearch` implementation (WS-3.2 R-1 documents this fallback), swapping the mock for the real import when WS-3.1 merges.

### Risk-Adjusted Timeline

| Risk | Impact on Timeline | Mitigation |
|------|-------------------|------------|
| Backend `/console/search/intel` not ready | +0.5 days (MSW mock setup + later integration) | Build with MSW mocks; integrate when endpoint lands. |
| Two-line `CommandItem` layout breaks cmdk keyboard navigation | +0.25 days (debugging, fallback to single-line) | Test early in WS-3.2. Fallback: snippet as tooltip on hover. |
| Fast morph 300ms feels jarring | +0.25 days (tuning to 400ms, adjusting ease curve) | Per R6 in combined-recommendations: test with real content. |
| WS-0.2 or WS-0.4 from Phase 0 incomplete | +0.5 days | Local type alias fallback (WS-3.1 R-7). Text placeholder for PriorityBadge (WS-3.2 R-2). |

**Worst-case total:** 3.5 developer-days.

### Resource Conflicts

None identified. Phase 3 is independent of Phases 1 and 2. It can execute in parallel with either phase if backend dependencies (A, B, C) are met independently. The only shared resource is the `react-developer` agent -- if a single developer is working Phases 1-3 sequentially, Phase 3 begins after Phase 1 completes (Phase 2 and 3 are independent of each other per the combined-recommendations dependency map).

### Definition of Done

Phase 3 is complete when:
1. All 21 Phase Exit Criteria (Section 7) pass.
2. All 4 Cross-Workstream Conflicts (Section 3) are resolved in code.
3. Both BLOCKING Open Questions (Section 6) have been answered by the backend team.
4. `pnpm typecheck` and `pnpm build` pass with zero errors.
5. The integration wiring (Gap 1) is implemented and tested.
6. Normal morph regression test confirms no behavioral changes to existing grid-click navigation.

---

*End of Phase 3 Overview.*
