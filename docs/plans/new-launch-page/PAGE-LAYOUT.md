# Page Layout Reference

How the existing TarvaRI console Coverage Viewer is structured, section by section.
Adapt this to the spatial ZUI / @tarva/ui design system as needed.

---

## Page Structure (top to bottom)

### 1. Header
- Title: "Coverage Viewer"
- Subtitle: "Visualize intelligence source geographic coverage and category distribution."
- Info box explaining what "coverage" means

### 2. Overview Stats — 3 metric cards in a row

| Card | Value | Subtitle | Color |
|------|-------|----------|-------|
| Total Sources | `totalSources` | "intelligence sources" | Blue |
| Active Sources | `activeSources` | "X% active" | Green |
| Categories | `categoriesCovered` | "unique categories" | Purple |

### 3. Geographic Distribution Map

- Full-width map showing pins for all `intel_normalized` items with geo data
- Pins colored/styled by severity or category
- Auto-fits bounds to all visible markers
- When a category is selected (from section 4), map filters to that category
- Shows marker count: "X intel locations shown"
- "Show all categories" link when filtered

### 4. Coverage by Category — clickable card grid (3 columns)

One card per unique category. Each card shows:
- Category name (capitalized)
- Source count (large number)
- Active source count
- Geographic regions list (first 3, then "+N more")

Clicking a card toggles it as the active filter for the map + source table.
Clicking again deselects. Selected card gets a ring highlight.

**Category color mapping:**
| Category | Background |
|----------|-----------|
| seismic | red-50 |
| geological | orange-50 |
| disaster | purple-50 |
| humanitarian | blue-50 |
| health | green-50 |
| aviation | cyan-50 |
| maritime | teal-50 |
| infrastructure | yellow-50 |

### 5. Source Details Table

Sortable table with all sources (filtered by selected category if any).

| Column | Sortable | Content |
|--------|----------|---------|
| Source | Yes | `name` + `source_key` (small, gray) |
| Category | Yes | Capitalized category |
| Geographic Coverage | Yes | `coverage.geo` with location icon, or "Not specified" |
| Update Frequency | Yes | `coverage.frequency` with clock icon, or "—" |
| Status | Yes | Colored badge: green=active, red=error, gray=other |

- Shows first 50 rows
- "Showing 50 of N sources" when truncated
- "Clear filter" link in header when category is selected
- Sort toggles asc/desc on same column, defaults asc on new column

---

## Interaction Flow

```
User lands on page
  → useCoverageMetrics() fires → shows stats + category cards + source table
  → useCoverageMapData() fires → shows map pins

User clicks a category card
  → selectedCategory state updates
  → Map re-fetches with category filter
  → Source table filters to that category
  → Card gets ring highlight

User clicks same card again
  → Deselects → back to showing all

User clicks column header
  → Sorts table by that column (asc first, toggles on re-click)
```

---

## States to Handle

| State | UI |
|-------|-----|
| Loading | Spinner + "Loading coverage metrics..." |
| Error | Red banner with error message |
| Empty (no sources) | "No sources found for selected category" with inbox icon |
| Empty map | "No geographic data available for this selection" with location_off icon |
| Success | Full page render |
