# WS-3.2: Async Search Group in CommandPalette

> **Workstream ID:** WS-3.2
> **Phase:** 3 -- Search Integration
> **Assigned Agent:** `react-developer`
> **Advisory:** `information-architect` (IA-SEARCH: result ranking, snippet display)
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-3.1 (useIntelSearch hook), WS-0.4 (PriorityBadge component), WS-0.2 (OperationalPriority type)
> **Blocks:** WS-3.3 (Search to fast morph navigation)
> **Resolves:** None

## 1. Objective

Add a live backend-powered search group to the existing CommandPalette component so that analysts can search the full intel corpus directly from the palette (Cmd+K). The new `<CommandGroup heading="Intel Search">` appears below the existing Navigation/View/Actions groups and above the AI group. It renders results returned by the `useIntelSearch` hook (WS-3.1) as two-line items showing PriorityBadge, severity dot, title, and a `ts_headline` snippet with bold match highlights. The group handles five visual states: idle (input too short), debouncing/loading, results, empty results, and error. Selecting a result closes the palette and invokes an `onSearchResultSelect` callback that WS-3.3 will wire to the fast morph navigation system.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| New CommandGroup in CommandPalette | Add `<CommandGroup heading="Intel Search">` to `src/components/spatial/CommandPalette.tsx`, positioned between the existing Actions group and the AI group, separated by `<CommandSeparator />`. |
| Search state integration | Consume the `useIntelSearch` hook (WS-3.1) inside CommandPalette, passing `inputValue` as the query. The hook handles debounce (300ms) and the `enabled: query.length >= 3` gate internally. |
| Five visual states | Render appropriate content for each state: (1) **Idle** -- input has fewer than 3 characters, show guidance text. (2) **Loading** -- hook `isLoading` is true, show spinner. (3) **Results** -- render up to 10 `SearchResult` items as `CommandItem` elements. (4) **Empty** -- hook returned zero results, show "No results" message. (5) **Error** -- hook errored, show error message with retry hint. |
| Result item layout | Each result renders as a two-line `CommandItem`: top line has PriorityBadge (sm) + severity color dot (8px) + truncated title; bottom line has the `ts_headline` snippet with `<b>` highlights rendered via `dangerouslySetInnerHTML`. |
| Snippet sanitization utility | Create `sanitizeSnippet(html: string): string` that strips all HTML tags except `<b>` and `</b>`. Exported from `src/lib/sanitize-snippet.ts` for reuse in WS-3.3 and future surfaces. |
| New callback prop | Add `onSearchResultSelect?: (result: SearchResult) => void` to `CommandPaletteProps`. When a search result `CommandItem` is selected, the handler calls `onSearchResultSelect(result)` and closes the palette. WS-3.3 wires this to the morph navigation system. |
| Placeholder input text update | Update the `CommandInput` placeholder from `"Navigate, zoom, or search commands..."` to `"Navigate, zoom, or search intel..."` to signal the new search capability. |
| CSS additions | Add styles to `src/styles/command-palette.css` for the snippet line (smaller font, muted opacity, truncation) and the loading spinner alignment. |
| Accessibility | Each search result `CommandItem` has an `aria-label` combining priority, severity, and title for screen reader announcement. The snippet `dangerouslySetInnerHTML` content is supplementary -- the `aria-label` provides the accessible name. The loading spinner has `aria-label="Searching intel..."`. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Morph navigation on result click | Belongs to WS-3.3. This workstream provides the `onSearchResultSelect` callback interface; WS-3.3 implements the `startMorph(category, { fast: true })` + `setDistrictPreselectedAlertId` logic. |
| Fast morph store changes | Belongs to WS-3.4. The `options.fast` parameter on `startMorph` is added there. |
| Search hook implementation | Belongs to WS-3.1. This workstream consumes the hook's return value (`data`, `isLoading`, `isError`, `error`). |
| Backend search endpoint | Backend Phase C (C.2). This workstream assumes the endpoint exists and returns `SearchResult[]` with `category` included per the validation finding. |
| Search filters (category, severity, date range) | Future enhancement. The initial search group uses the bare `q` parameter only. Advanced filters may be added in a later phase via the command palette's input syntax or a filter popover. |
| Keyboard shortcut for focusing search | The existing Cmd+K shortcut opens the palette. No additional shortcut is needed -- typing 3+ characters automatically triggers the search group. |
| Storybook stories | No Storybook setup exists in this project. |
| Tests | No test infrastructure (`pnpm test:unit` is not configured). Verification is via `pnpm typecheck` and visual inspection. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-3.1 `useIntelSearch` hook | Hook at `src/hooks/use-intel-search.ts` returning `{ data: SearchResult[], isLoading, isError, error }`. Called with `(query: string)`. The hook internally debounces at 300ms and sets `enabled: query.length >= 3`. | Pending (WS-3.1 not yet implemented) |
| WS-3.1 `SearchResult` type | Type with fields: `id: string`, `title: string`, `snippet: string` (ts_headline HTML), `severity: SeverityLevel`, `category: string`, `priority: OperationalPriority`, `score: number`. Exported from `src/hooks/use-intel-search.ts` or `src/lib/interfaces/`. | Pending (WS-3.1 not yet implemented) |
| WS-0.4 `PriorityBadge` | Component at `src/components/coverage/PriorityBadge.tsx`. Used at `size="sm"` for inline display in result rows. | Pending (WS-0.4 not yet implemented) |
| WS-0.2 `OperationalPriority` type | Type union `'P1' \| 'P2' \| 'P3' \| 'P4'` in `src/lib/interfaces/coverage.ts`. | Pending (WS-0.2 not yet implemented) |
| `src/components/spatial/CommandPalette.tsx` | Existing component (341 lines). Three groups: Navigation, View, Actions. One conditional AI group. Glass-styled dialog. Custom `filter={() => 1}` on `<Command>`. Uses `inputValue` state for filtering. [CODEBASE] | Available |
| `src/hooks/use-command-palette.ts` | Hook providing `isOpen`, `setOpen`, `getSuggestions`, `executeById`, `aiEnabled`. [CODEBASE] | Available |
| `src/styles/command-palette.css` | Glass material styling for the palette dialog. Group headings use monospace 0.625rem, uppercase, 0.1em letter-spacing. Items use py-3 px-2. [CODEBASE] | Available |
| `src/lib/interfaces/coverage.ts` | `SEVERITY_COLORS` record mapping `SeverityLevel` to CSS color values. Used for the severity dot fill. [CODEBASE] | Available |
| Backend Phase C (C.2) | `GET /console/search/intel` endpoint returning search results. Must include `category` field per validation finding M-2. | Pending (backend work) |

## 4. Deliverables

### 4.1 Snippet Sanitization Utility

**File:** `src/lib/sanitize-snippet.ts`

**Export:** `sanitizeSnippet(html: string): string`

**Purpose:** The TarvaRI backend's `/console/search/intel` endpoint uses PostgreSQL `ts_headline()` to return snippets with `<b>` tags wrapping matched terms. Since the snippet is rendered via `dangerouslySetInnerHTML`, all tags other than `<b>` and `</b>` must be stripped to prevent XSS.

**Implementation strategy:** Regex-based allowlist. Replace any HTML tag that is not `<b>` or `</b>` (case-insensitive) with an empty string. This is sufficient because:

1. The source is our own PostgreSQL `ts_headline()` function, which only inserts `<b>`/`</b>` (configurable `StartSel`/`StopSel`, defaulting to `<b>`/`</b>`).
2. The allowlist approach is defense-in-depth -- even if the database were compromised or a misconfigured `StartSel` injected other tags, only `<b>` passes through.
3. Entity encoding (`&lt;`, `&amp;`, etc.) is preserved, which is correct behavior for text content.

**Sanitization logic:**

```typescript
/**
 * Sanitize ts_headline HTML snippet to allow only <b> tags.
 *
 * PostgreSQL ts_headline() wraps matched terms in <b></b> by default.
 * This function strips all other HTML tags as a defense-in-depth measure
 * before rendering via dangerouslySetInnerHTML.
 *
 * @param html - Raw HTML string from ts_headline
 * @returns Sanitized HTML with only <b> and </b> tags preserved
 */
export function sanitizeSnippet(html: string): string {
  // Match any HTML tag that is NOT <b> or </b> (case-insensitive)
  return html.replace(/<\/?(?!b\b)[^>]*>/gi, '')
}
```

**Edge cases:**

| Input | Output | Notes |
|-------|--------|-------|
| `<b>earthquake</b> near coast` | `<b>earthquake</b> near coast` | Normal ts_headline output, preserved |
| `<script>alert('xss')</script>` | `alert('xss')` | Script tags stripped |
| `<b>quake</b> <em>strong</em>` | `<b>quake</b> strong` | Non-`<b>` tags stripped |
| `<B>UPPER</B> case` | `<B>UPPER</B> case` | Case-insensitive match preserves uppercase `<B>` |
| `<br/>line break` | `line break` | Self-closing tags stripped |
| `no html at all` | `no html at all` | Plain text passes through unchanged |
| `&lt;b&gt;entity&lt;/b&gt;` | `&lt;b&gt;entity&lt;/b&gt;` | HTML entities preserved (they are text, not tags) |
| `""` (empty string) | `""` | Empty input returns empty output |

### 4.2 Modified CommandPaletteProps

The existing `CommandPaletteProps` interface gains one optional callback:

```typescript
interface CommandPaletteProps {
  onRefresh: () => Promise<void>
  /**
   * Called when a search result is selected from the Intel Search group.
   * WS-3.3 wires this to morph navigation: close palette, determine category,
   * call startMorph(category, { fast: true }), set districtPreselectedAlertId.
   *
   * If not provided, selecting a search result only closes the palette.
   */
  onSearchResultSelect?: (result: SearchResult) => void
}
```

**Rationale for optional callback over direct store coupling:** The CommandPalette is a general-purpose navigation tool. Embedding morph navigation logic directly would tightly couple it to the coverage/district system. The callback pattern keeps the component reusable and delegates navigation decisions to the parent (page.tsx), consistent with how `onRefresh` already works. WS-3.3 will provide the implementation.

### 4.3 Search Group Rendering Logic

The Intel Search group is rendered between the existing Actions group and the AI group. It is always present in the DOM (not conditionally mounted) but its content changes based on the search state.

**Group position in CommandList:**

```
Navigation group
─── separator ───
View group
─── separator ───
Actions group
─── separator ───
Intel Search group    <── NEW
─── separator ───
AI group
```

**State machine for the search group content:**

| State | Condition | Rendered Content |
|-------|-----------|-----------------|
| **Idle** | `inputValue.length < 3` | Single muted text line: "Type 3+ characters to search intel" |
| **Loading** | `inputValue.length >= 3 && isLoading` | Lucide `Loader2` icon with `animate-spin` + "Searching..." text |
| **Results** | `inputValue.length >= 3 && !isLoading && data.length > 0` | Up to 10 `CommandItem` elements, one per `SearchResult` |
| **Empty** | `inputValue.length >= 3 && !isLoading && data.length === 0` | Single muted text line: "No intel matches found" |
| **Error** | `inputValue.length >= 3 && isError` | Single muted text line: "Search unavailable -- try again" |

**Idle state detail:** The idle guidance text is rendered as a disabled `CommandItem` (not selectable) with muted opacity. This keeps it within the cmdk list structure rather than breaking the list semantics.

**Loading state detail:** The spinner uses Lucide `Loader2` (the project already imports this icon in `pipeline-station.tsx` [CODEBASE]) with `animate-spin` class. Rendered as a disabled `CommandItem` so it does not interfere with keyboard navigation.

**Results state detail:** Each `SearchResult` is rendered as an enabled `CommandItem` with `value={result.id}`. The `onSelect` handler calls `onSearchResultSelect?.(result)`, resets `inputValue`, and closes the palette. Results are capped at 10 by the hook's `limit=10` query parameter. The component does not re-slice.

**Empty state detail:** A disabled `CommandItem` with a `Search` icon and text. This state is visually distinct from the idle state by using a different message and icon.

**Error state detail:** A disabled `CommandItem` with an `AlertCircle` icon and text. No retry button -- the user can retry by modifying the query text (which re-triggers the debounced search).

### 4.4 Search Result Item Layout

Each search result renders as a two-line layout within a single `CommandItem`. This is a departure from the single-line pattern used by command items, but is necessary to show both the title and the contextual snippet.

**Visual structure:**

```
┌─────────────────────────────────────────────────────┐
│ [P1 ◇] [●] Title text truncated to one line...     │
│         ...snippet with <b>bold matches</b>...      │
└─────────────────────────────────────────────────────┘
```

**Line 1 (title row):**

- **PriorityBadge:** `<PriorityBadge priority={result.priority} size="sm" />` -- renders the achromatic shape (diamond for P1, triangle for P2, null for P3/P4). Positioned at the start of the row with `shrink-0`.
- **Severity dot:** An 8px circle (`w-2 h-2 rounded-full shrink-0`) filled with the severity color from `SEVERITY_COLORS[result.severity]`. This dot uses the color channel per AD-1 (severity owns color, priority owns shape).
- **Title:** The alert title in `font-mono text-[11px]`, truncated with `truncate` (single-line ellipsis). Color: `rgba(255, 255, 255, 0.35)` (consistent with action command text opacity in the palette).
- **Score indicator (omitted):** The `score` field from `SearchResult` is not displayed. The results are pre-ranked by the backend. Displaying a numeric score would add visual noise without aiding the analyst's decision.

**Line 2 (snippet row):**

- **Indentation:** Left-padded to align with the title text (after the PriorityBadge and severity dot). Uses `pl-[28px]` to account for badge width (12px) + gap (4px) + dot width (8px) + gap (4px).
- **Snippet HTML:** Rendered via `dangerouslySetInnerHTML={{ __html: sanitizeSnippet(result.snippet) }}`. The `<b>` tags from `ts_headline` are rendered as bold text within the snippet.
- **Snippet styling:** `font-mono text-[9px] truncate` with color `rgba(255, 255, 255, 0.18)`. The `<b>` tags within the snippet are styled via a CSS rule in `command-palette.css` to `color: rgba(255, 255, 255, 0.35)` and `font-weight: 600` -- making match highlights visually pop against the muted snippet text.
- **Truncation:** The snippet is single-line truncated. `ts_headline` already excerpts a ~120-character fragment; further truncation via CSS handles edge cases.

**Container structure within CommandItem:**

```tsx
<CommandItem
  key={result.id}
  value={result.id}
  onSelect={() => handleSelectSearchResult(result)}
  className="flex-col items-start gap-1 py-2"
>
  {/* Line 1: priority + severity + title */}
  <div className="flex w-full items-center gap-1.5">
    <PriorityBadge priority={result.priority} size="sm" />
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: SEVERITY_COLORS[result.severity] }}
      aria-hidden="true"
    />
    <span className="min-w-0 flex-1 truncate font-mono text-[11px]"
      style={{ color: 'rgba(255, 255, 255, 0.35)' }}
    >
      {result.title}
    </span>
  </div>
  {/* Line 2: snippet */}
  <div
    className="w-full truncate pl-[28px] font-mono text-[9px]"
    style={{ color: 'rgba(255, 255, 255, 0.18)' }}
    dangerouslySetInnerHTML={{ __html: sanitizeSnippet(result.snippet) }}
    aria-hidden="true"
  />
</CommandItem>
```

**Accessibility:** The `CommandItem` receives an `aria-label` that provides a text-only description:

```typescript
aria-label={`${result.priority} ${result.severity}: ${result.title}`}
```

The snippet `div` and the severity dot are `aria-hidden="true"` because the `aria-label` already communicates the essential information. The PriorityBadge component has its own `aria-label` (per WS-0.4 AC-15), but since the parent `CommandItem` has an overriding `aria-label`, the nested one is secondary.

### 4.5 Handling the Result Selection

When a search result is selected (via Enter key or click):

```typescript
const handleSelectSearchResult = useCallback(
  (result: SearchResult) => {
    setInputValue('')
    setOpen(false)
    onSearchResultSelect?.(result)
  },
  [setOpen, onSearchResultSelect],
)
```

This handler:
1. Clears the input (consistent with existing `handleSelect` behavior)
2. Closes the palette dialog
3. Delegates to the optional callback (WS-3.3 provides the implementation)

If `onSearchResultSelect` is not provided (e.g., during development before WS-3.3 is wired), selecting a result simply closes the palette. No error, no-op on the navigation side.

### 4.6 CSS Additions to command-palette.css

Three new rule blocks are added to `src/styles/command-palette.css`:

**Rule 1 -- Snippet bold highlight styling:**

```css
/* ----------------------------------------------------------------
   Search result snippet -- bold highlights from ts_headline
   ---------------------------------------------------------------- */
.command-palette-glass [data-slot="command-item"] .search-snippet b {
  color: rgba(var(--ambient-ink-rgb), 0.55);
  font-weight: 600;
}
```

This makes the `<b>` tags within the snippet visually distinct from the surrounding muted text. The color `0.55` matches the primary text opacity tier used for elevated content in the palette (consistent with the selected item text color in the existing `[data-selected="true"]` rule at line 88 of command-palette.css [CODEBASE]).

**Rule 2 -- Search result item two-line layout:**

```css
/* ----------------------------------------------------------------
   Search result items -- two-line layout override
   ---------------------------------------------------------------- */
.command-palette-glass .search-result-item[data-slot="command-item"] {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding-top: 6px;
  padding-bottom: 6px;
}
```

This overrides the default single-line flex-row layout of `CommandItem` for search results specifically. The `search-result-item` class is added to search result `CommandItem` elements to scope this override.

**Rule 3 -- Loading spinner alignment:**

```css
/* ----------------------------------------------------------------
   Search loading state -- centered spinner
   ---------------------------------------------------------------- */
.command-palette-glass .search-loading[data-slot="command-item"] {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-tertiary, rgba(var(--ambient-ink-rgb), 0.35));
}
```

### 4.7 CommandPalette Imports

The following new imports are added to `CommandPalette.tsx`:

```typescript
import { Loader2, Search, AlertCircle } from 'lucide-react'  // add to existing import
import { useIntelSearch, type SearchResult } from '@/hooks/use-intel-search'
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
import { SEVERITY_COLORS, type SeverityLevel } from '@/lib/interfaces/coverage'
import { sanitizeSnippet } from '@/lib/sanitize-snippet'
```

The `Loader2` icon is used for the loading spinner (consistent with `pipeline-station.tsx` [CODEBASE]). `Search` is used for the empty state icon. `AlertCircle` is used for the error state icon.

### 4.8 Hook Integration

The `useIntelSearch` hook is called unconditionally inside the `CommandPalette` component:

```typescript
const { queryResult, debouncedQuery } = useIntelSearch({ query: inputValue })
const { data: searchResults, isLoading: isSearching, isError: isSearchError } = queryResult
```

The hook internally handles the `enabled: debouncedQuery.length >= 3` gate and the 300ms debounce (per WS-3.1). The component does not need to replicate these guards -- it reads the return values and renders the appropriate state. The `debouncedQuery` value can be used to refine the state derivation -- specifically, `showSearchIdle` can check `inputValue.length < 3` (immediate feedback) while the loading state can use `debouncedQuery` for the "Searching..." indicator.

**Render-side state derivation:**

```typescript
const showSearchIdle = inputValue.length < 3
const showSearchLoading = !showSearchIdle && isSearching
const showSearchResults = !showSearchIdle && !isSearching && !isSearchError && searchResults && searchResults.length > 0
const showSearchEmpty = !showSearchIdle && !isSearching && !isSearchError && searchResults && searchResults.length === 0
const showSearchError = !showSearchIdle && isSearchError
```

These boolean flags drive conditional rendering within the search `CommandGroup`. They are derived, not stored -- no additional state is needed.

### 4.9 cmdk Filter Compatibility

The existing `filter={() => 1}` on the `<Command>` component returns 1 for all items, disabling cmdk's built-in search. This means search result `CommandItem` elements are always visible in the list regardless of the input value -- which is correct, because visibility is controlled by the conditional rendering logic in Section 4.3, not by cmdk's filter.

The `value` prop on search result `CommandItem` elements is set to the result `id` (a UUID). This ensures each item has a unique cmdk identity for keyboard navigation and selection, and does not conflict with existing command IDs (which use slugs like `go-to-hub`, `zoom-in`).

No changes to the filter function are needed.

### 4.10 Validation Finding: category Field on SearchResult

The validation finding (MEDIUM) states: "Search results need `category` field for morph target." This is because WS-3.3 calls `startMorph(category)` using the result's category to determine which district to navigate to.

**Impact on WS-3.2:** The `SearchResult` type (defined in WS-3.1) must include a `category: string` field. This workstream consumes the field for the severity dot display but does not directly use it for navigation (that is WS-3.3's responsibility). However, the `onSearchResultSelect` callback passes the full `SearchResult` object, which includes `category`, enabling WS-3.3 to extract it.

**Backend requirement:** The `GET /console/search/intel` response must include `category` in each result. This is a Backend Phase C (C.2) requirement, not a frontend concern for WS-3.2.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | An "Intel Search" `CommandGroup` appears in the command palette between the Actions group and the AI group, separated by `CommandSeparator` elements. | Open palette (Cmd+K). Visually confirm the "INTEL SEARCH" heading appears in the correct position. DOM inspection: `[cmdk-group-heading]` with text "Intel Search" exists between Actions and AI groups. |
| AC-2 | When `inputValue` has fewer than 3 characters, the search group shows the guidance text "Type 3+ characters to search intel". | Open palette and type 0, 1, or 2 characters. Confirm the guidance text appears. Type a 3rd character -- guidance text is replaced by loading or results. |
| AC-3 | When `inputValue` has 3+ characters and the search is loading, a spinning `Loader2` icon with "Searching..." text appears in the search group. | Open palette, type 3+ characters. Observe the spinner during the debounce + fetch period (~300ms debounce + network latency). |
| AC-4 | When search returns results, up to 10 `CommandItem` elements render in the search group, each showing PriorityBadge + severity dot + title on line 1 and snippet on line 2. | Search for a term that returns results. Confirm items appear with the two-line layout. Count items: no more than 10. |
| AC-5 | The severity dot on each result displays the correct color from `SEVERITY_COLORS` based on the result's severity level. | Visually compare dot colors against the severity color reference (red for Extreme, orange for Severe, yellow for Moderate, blue for Minor, gray for Unknown). |
| AC-6 | PriorityBadge renders correctly for each result: diamond for P1, triangle for P2, nothing for P3/P4. | Search for results spanning multiple priority levels. Confirm shape rendering matches AD-1 specification. No color is used on the priority badge. |
| AC-7 | The snippet line renders `<b>` tags as bold text. Match highlights are visually brighter than the surrounding snippet text. | Search for a term. Confirm the matched words appear bolder and brighter in the snippet. DOM inspection: `<b>` elements exist within the snippet container. |
| AC-8 | No HTML tags other than `<b>` and `</b>` survive sanitization in the snippet. | Inject a test result with `snippet: '<script>alert(1)</script><b>test</b>'` via mock data. Confirm the `<script>` tag is stripped and only `<b>test</b>` renders. |
| AC-9 | When search returns zero results, the message "No intel matches found" appears in the search group. | Search for a term that returns no results (e.g., a random UUID string). Confirm the empty state message appears. |
| AC-10 | When the search hook errors, the message "Search unavailable -- try again" appears in the search group. | Simulate a network error (disable the TarvaRI backend). Type 3+ characters. Confirm the error state message appears. |
| AC-11 | Selecting a search result (Enter or click) closes the palette, clears the input, and calls `onSearchResultSelect` with the full `SearchResult` object. | Wire a `console.log` to `onSearchResultSelect` in page.tsx. Select a search result. Confirm the palette closes, input resets, and the console logs the result object with `id`, `title`, `snippet`, `severity`, `category`, `priority`, `score` fields. |
| AC-12 | The `CommandInput` placeholder text reads "Navigate, zoom, or search intel...". | Open the palette. Visually confirm the placeholder text. |
| AC-13 | Keyboard navigation (arrow keys) correctly traverses search result items alongside command items. | Open palette, type a search query. Use arrow keys to navigate between command groups and search results. Confirm focus moves correctly through all groups. |
| AC-14 | Each search result `CommandItem` has an `aria-label` in the format `"{priority} {severity}: {title}"`. | DOM inspection: check `aria-label` attribute on search result items. Screen reader test: announce the result with priority, severity, and title. |
| AC-15 | The loading spinner has `aria-label="Searching intel..."`. | DOM inspection of the loading state item. |
| AC-16 | `pnpm typecheck` passes with no errors. | Run `pnpm typecheck` -- exits with code 0. |
| AC-17 | `pnpm build` completes without errors. | Run `pnpm build` -- exits with code 0. |
| AC-18 | The `sanitizeSnippet` function is exported from `src/lib/sanitize-snippet.ts` and handles all edge cases in Section 4.1. | Import the function in a scratch file. Test each edge case from the table. All produce expected output. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Position the Intel Search group between Actions and AI, not at the top of the palette. | The command palette's primary role is navigation and view control. Search is supplementary -- it activates only when the user types 3+ characters. Placing it after the structured command groups respects the information hierarchy: quick commands first (always visible), search results second (conditional on input), AI last (experimental). If search were at the top, it would push the frequently-used navigation commands below the fold. | (a) Above Navigation -- rejected: disrupts the established group order for the most common use case (quick commands). (b) Below AI -- rejected: AI is the fallback option and should remain last per the existing design. (c) In a separate panel/popover -- rejected: adds UI complexity; the palette is already a search-oriented surface. |
| D-2 | Use a callback prop (`onSearchResultSelect`) rather than coupling the CommandPalette directly to `useCoverageStore` and `useUIStore` for morph navigation. | The CommandPalette is a general-purpose navigation tool that currently has no direct dependency on the coverage/district system. Adding store imports for morph navigation would create a tight coupling that breaks the single-responsibility boundary. The callback pattern (`onSearchResultSelect`) is consistent with the existing `onRefresh` prop and enables the page-level component (which already orchestrates morph + store + camera) to handle navigation decisions. WS-3.3 can implement the callback without modifying CommandPalette. | (a) Direct store coupling inside CommandPalette -- rejected: creates circular dependency risk (palette knows about districts, districts might need palette in future). (b) Event bus / custom event -- rejected: over-engineered for a single callback; harder to type safely. (c) React context -- rejected: the palette is already inside the context tree but does not consume district context; adding it would widen the re-render surface. |
| D-3 | Render the snippet via `dangerouslySetInnerHTML` with a `<b>`-only sanitizer, rather than parsing the HTML into React elements. | The `ts_headline` output is a simple text fragment with `<b>` wrappers. Parsing it into a React element tree (e.g., via `DOMParser` or a library like `html-react-parser`) adds dependency weight and complexity for no practical benefit. The `<b>`-only allowlist sanitizer is a 1-line regex that eliminates all XSS vectors while preserving the bold highlights. The source is our own PostgreSQL instance, so the attack surface is limited to database compromise, which the allowlist mitigates. | (a) `html-react-parser` library -- rejected: adds a dependency (~8KB) for a feature that a single regex handles. (b) `DOMParser` + manual element creation -- rejected: requires client-side DOM API (complicates SSR), more complex code for the same result. (c) Strip all HTML and lose highlights -- rejected: the bold highlights are the primary value of `ts_headline`; displaying plain text would defeat the purpose. |
| D-4 | Use Lucide `Loader2` with `animate-spin` for the loading state, not a custom spinner or skeleton. | The project already uses `Loader2` in `pipeline-station.tsx` [CODEBASE] for loading states. Consistency with existing patterns reduces cognitive load. The `animate-spin` Tailwind utility provides smooth CSS rotation without JavaScript runtime cost. A skeleton (shimmer lines) was considered but is more appropriate for content-shaped placeholders, not a single-line "Searching..." indicator. | (a) Custom SVG spinner -- rejected: unnecessary when Lucide provides one. (b) Skeleton lines mimicking result shape -- rejected: the loading duration is short (~300ms debounce + ~100ms network); skeletons work better for longer loads (>500ms). (c) No loading indicator -- rejected: the 300ms debounce creates a visible gap where the user sees nothing; the spinner confirms the search is in progress. |
| D-5 | Set the `aria-label` on the `CommandItem` container rather than relying on the nested content (PriorityBadge + title + snippet) for screen reader announcement. | The nested content includes `dangerouslySetInnerHTML` (which screen readers would attempt to read as raw text including any residual markup), a decorative dot (`aria-hidden`), and a PriorityBadge with its own `aria-label`. Providing a clean, structured `aria-label` on the container gives screen readers a single, well-formed announcement: `"P1 Extreme: 7.2 earthquake near Istanbul"`. This is clearer than concatenating the nested text nodes. | (a) No aria-label (rely on text content) -- rejected: the snippet HTML and decorative elements would create a noisy announcement. (b) `aria-describedby` pointing to the snippet -- rejected: the snippet is `aria-hidden` and its content is supplementary, not essential for identifying the result. |
| D-6 | Do not display the `score` field from `SearchResult` in the UI. | The score is a relevance ranking number from PostgreSQL's `ts_rank`. Displaying it would add visual noise without helping the analyst decide which result to select -- the results are already sorted by score (most relevant first). In analyst-facing tools, showing a raw numeric score creates false precision ("Is 0.87 good?"). The positional ranking (first result = most relevant) is sufficient. | (a) Show as a relevance bar -- rejected: visual noise in a compact list. (b) Show as a percentage -- rejected: `ts_rank` values are not percentages; converting would be misleading. (c) Show as a star rating -- rejected: inappropriate metaphor for search relevance in an intel context. |
| D-7 | Apply the `search-result-item` CSS class to search result `CommandItem` elements for scoped two-line layout styling, rather than using inline styles for the flex-direction override. | CSS class scoping via `command-palette.css` is consistent with the existing styling approach (all palette styles are in that file, using `[data-slot]` and class selectors). Inline styles would work but would miss the glass-themed hover/selected state overrides that the CSS file already handles. The class-based approach also keeps the JSX cleaner. | (a) Inline `style={{ flexDirection: 'column' }}` -- rejected: misses CSS-side hover state adjustments. (b) Tailwind classes only (`flex flex-col`) -- rejected: Tailwind classes on `CommandItem` may conflict with cmdk's internal class expectations; a scoped CSS class is safer. |
| D-8 | The snippet indentation uses a fixed `pl-[28px]` rather than a CSS Grid or nested flex container. | The indentation aligns the snippet text with the title text (after the PriorityBadge + gap + severity dot + gap). A fixed padding is simpler than adding a Grid or nested flex wrapper and is sufficient because the PriorityBadge and severity dot have fixed widths at `sm` size. If PriorityBadge sizes change, this padding would need to be updated -- but PriorityBadge `sm` is stable (defined in WS-0.4). | (a) CSS Grid with named columns -- rejected: over-engineered for a two-element alignment. (b) Nested flex wrapper with invisible spacer -- rejected: adds DOM nodes for a layout concern. (c) `margin-left: auto` on title -- rejected: does not help align the snippet below the title. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the search group be visually collapsed (heading only, no guidance text) when the user has not typed anything (empty input), to reduce visual noise when the palette is first opened? The current design shows "Type 3+ characters to search intel" even when the input is empty. | information-architect | Phase 3 (resolve before implementation) |
| OQ-2 | Should search results show a category badge or indicator alongside the severity dot? The `category` field is available on `SearchResult` and would help analysts identify the domain of each result. However, adding a category badge increases the visual density of the already-compact result row. | information-architect | Phase 3 (resolve before implementation) |
| OQ-3 | The `useIntelSearch` hook (WS-3.1) returns results with a `limit=10` query parameter. Should the command palette show a "See all results" item at the bottom of the list when 10 results are returned (implying more exist)? If so, what does that item do -- navigate to a full search page, or increase the limit? | react-developer / information-architect | Phase 3 or later (depends on whether a full search page is in scope) |
| OQ-4 | What is the exact field name for priority on `SearchResult` -- `priority` or `operationalPriority`? WS-3.1 description says `priority`, but WS-1.1 established `operationalPriority` as the field name on `IntelFeedItem` and `MapMarker`. If `SearchResult` uses `priority`, there is a naming inconsistency. Confirm with WS-3.1 implementer before WS-3.2 implementation. | WS-3.1 implementer | Phase 3 (resolve before implementation) |
| OQ-5 | Should the palette's `CommandEmpty` component (currently showing "No matching commands") account for the case where structured commands match nothing but search results exist? With the current `filter={() => 1}` implementation, `CommandEmpty` never renders because all items return a score of 1. However, if search results are conditionally rendered (not always in the DOM), cmdk might consider the list "empty" when only search results are present. Test during implementation. | react-developer | Phase 3 (verify during implementation) |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-3.1 (`useIntelSearch` hook) is not implemented when WS-3.2 work begins, blocking the search data source. | High (WS-3.1 is the immediate dependency) | Medium | Build the UI with a mock `useIntelSearch` implementation that returns hardcoded `SearchResult[]` with a simulated 300ms delay. The component structure, CSS, sanitizer, and prop interface can all be completed without the real hook. Swap the mock for the real import when WS-3.1 lands. |
| R-2 | WS-0.4 (`PriorityBadge`) is not implemented when WS-3.2 work begins. | Medium | Low | Render a text-only fallback (`<span className="font-mono text-[9px]">{result.priority}</span>`) in place of the PriorityBadge component. Replace with the real component when WS-0.4 lands. The layout spacing (`pl-[28px]` for snippet indentation) may need minor adjustment when the actual PriorityBadge is integrated, but the difference between the fallback text width and the SVG badge width is under 4px. |
| R-3 | The `SearchResult` type from WS-3.1 does not include a `category` field, breaking the morph navigation in WS-3.3. | Medium (validation finding M-2 flags this) | High (WS-3.3 is blocked) | This workstream does not directly use `category` for navigation (that is WS-3.3). However, the `onSearchResultSelect` callback passes the full `SearchResult` object. If `category` is missing, WS-3.3 cannot determine the morph target. Mitigation: coordinate with WS-3.1 implementer to ensure `category` is included. If the backend endpoint does not return `category`, WS-3.1 can derive it from a local lookup or the field can be added to the API contract before WS-3.3 begins. |
| R-4 | Two-line `CommandItem` layout breaks cmdk's keyboard navigation or selection highlighting. | Low | Medium | The `CommandItem` primitive from `@tarva/ui` (wrapping cmdk) sets `data-selected` on the active item. The CSS override in `command-palette.css` line 86-89 [CODEBASE] applies background color based on `data-selected`. The two-line layout changes `flex-direction` but does not alter the selection mechanism. Test keyboard traversal and visual highlighting during implementation. If issues arise, fall back to a single-line layout with the snippet as a tooltip on hover. |
| R-5 | The `sanitizeSnippet` regex does not correctly handle all HTML edge cases (e.g., attributes on `<b>` tags like `<b class="hl">`). | Low | Low | PostgreSQL `ts_headline` generates bare `<b>` tags without attributes by default. The regex `<\/?(?!b\b)[^>]*>` matches tags that are not `<b>` or `</b>`, which means `<b class="hl">` would be preserved (it starts with `b` followed by a word boundary issue -- `b` followed by a space, not `\b`). Actually, `<b class="hl">` starts with `b ` which passes `(?!b\b)` -- this is correct because `\b` asserts a word boundary after `b`, and `b ` (b-space) does have a word boundary after `b`. So `<b class="hl">` is preserved. This is acceptable -- the tag is still a `<b>` tag. If a stricter policy is needed, the regex can be tightened to `<\/?(?!b>|\bb\s)[^>]*>` in a future iteration. |
| R-6 | The search group adds visual noise to the palette when the user is performing quick navigation (typing short commands like "home" or "zoom in"). | Medium | Low | The idle state shows a single line of guidance text ("Type 3+ characters to search intel"), which is visually muted (`rgba(var(--ambient-ink-rgb), 0.35)`) and does not compete with the command results above it. For very short inputs (1-2 characters), the search group is minimal. For 3+ character inputs, the user has likely transitioned from "quick command" mode to "search" mode. OQ-1 explores collapsing the group entirely for empty input as an alternative. |
| R-7 | The `onSearchResultSelect` callback prop is not wired in page.tsx before WS-3.3, causing search results to close the palette without navigating. | High (expected during WS-3.2) | None | This is the intended behavior during WS-3.2. The prop is optional -- when not provided, selecting a result closes the palette and resets input. This is a safe intermediate state. WS-3.3 wires the callback with morph navigation logic. |
| R-8 | Search results from the backend contain no snippets (empty `snippet` field) for some results, causing blank second lines. | Low | Low | If `snippet` is empty, skip rendering the snippet line entirely (conditional render: `{result.snippet && <div ... />}`). The result item degrades gracefully to a single-line layout matching the command item pattern. |
