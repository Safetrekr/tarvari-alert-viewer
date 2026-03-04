# Coverage Data Specification

Reference for building the Coverage Viewer page in tarvari-alert-viewer.
All data lives in the shared Supabase instance — no TarvaRI API calls needed.

---

## Data Source

This app already has a Supabase client at `src/lib/supabase/client.ts` (`getSupabaseBrowserClient()`).
Both tables below are in the same Supabase project the app is already connected to.

---

## Table 1: `intel_sources` (the ~38 sources)

The source registry. Each row is one intelligence feed.

### Columns Used

| Column | Type | Description |
|--------|------|-------------|
| `source_key` | `text` (unique) | Slug identifier, e.g. `nws-alerts`, `usgs-earthquakes` |
| `name` | `text` | Display name, e.g. "NOAA National Weather Service" |
| `category` | `text` | Hazard category (see list below) |
| `status` | `text` | `active` \| `staging` \| `quarantine` \| `disabled` |
| `coverage` | `jsonb` | Geographic/frequency metadata (see shape below) |

### `coverage` JSONB Shape

```json
{
  "geo": "US",            // geographic area: "US", "Global", "EU", "Asia-Pacific", etc.
  "languages": ["en"],    // ISO 639-1 codes
  "frequency": "1min"     // polling cadence: "1min", "5min", "15min", "1hr", "hourly"
}
```

### Query

```typescript
const { data: sources } = await supabase
  .from('intel_sources')
  .select('source_key, name, category, status, coverage')
```

Returns ~38 rows. No pagination needed.

---

## Table 2: `intel_normalized` (parsed intel items with locations)

Individual intel items ingested from sources. Used for the map pins.

### Columns Used

| Column | Type | Description |
|--------|------|-------------|
| `id` | `uuid` | Primary key |
| `title` | `text` | Alert title, e.g. "Tornado Warning - Oklahoma" |
| `severity` | `text` | `Extreme` \| `Severe` \| `Moderate` \| `Minor` \| `Unknown` |
| `category` | `text` | Same categories as sources |
| `source_id` | `uuid` | FK to `intel_sources.id` |
| `geo` | `jsonb` | GeoJSON geometry (see shape below) |
| `ingested_at` | `timestamptz` | When the item was ingested |

### `geo` JSONB Shape (GeoJSON)

```json
{
  "type": "Point",
  "coordinates": [-122.4194, 37.7749]   // [longitude, latitude]
}
```

Can also be `LineString` or `Polygon`, but most are `Point`.

### Query (map pins)

```typescript
const { data: intel } = await supabase
  .from('intel_normalized')
  .select('id, title, severity, category, source_id, geo, ingested_at')
  .not('geo', 'is', null)
  .limit(1000)
```

Optional filters:
```typescript
  .eq('category', 'weather')                    // filter by category
  .eq('severity', 'Extreme')                    // filter by severity
  .gte('ingested_at', '2026-03-01T00:00:00Z')  // date range
  .lte('ingested_at', '2026-03-03T23:59:59Z')
```

---

## Categories

These are the known `category` values across both tables:

| Category | Color Token (suggested) |
|----------|------------------------|
| `weather` | blue |
| `seismic` | red |
| `geological` | orange |
| `health` | green |
| `humanitarian` | blue/indigo |
| `conflict` | red/dark |
| `infrastructure` | yellow |
| `aviation` | cyan |
| `maritime` | teal |
| `disaster` | purple |
| `multi-hazard` | gray |
| `fire` | orange/red |
| `flood` | blue/dark |
| `storm` | blue/light |
| `other` | gray |

---

## Severity Levels

| Level | Color | Meaning |
|-------|-------|---------|
| `Extreme` | Red | Immediate threat to life |
| `Severe` | Orange | Significant threat |
| `Moderate` | Yellow | Potential threat |
| `Minor` | Blue | Minimal impact |
| `Unknown` | Gray | Not yet classified |

---

## Source Status Values

| Status | Meaning |
|--------|---------|
| `active` | Currently polling and ingesting |
| `staging` | Configured but not yet live |
| `quarantine` | Temporarily suspended (errors) |
| `disabled` | Manually turned off |
