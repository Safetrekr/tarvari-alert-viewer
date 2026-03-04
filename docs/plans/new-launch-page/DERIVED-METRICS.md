# Derived Metrics

These are computed client-side from the raw Supabase data. No backend aggregation needed.

---

## Overview Stats (3 cards)

Computed from the `intel_sources` query:

```typescript
const totalSources = sources.length;
const activeSources = sources.filter(s => s.status === 'active').length;
const categoriesCovered = new Set(sources.map(s => s.category)).size;
```

| Metric | Value | Label |
|--------|-------|-------|
| Total Sources | `sources.length` | "intelligence sources" |
| Active Sources | count where `status === 'active'` | "X% active" |
| Categories | unique `category` values | "unique categories" |

---

## Coverage by Category (card grid)

Group sources by `category` and aggregate:

```typescript
interface CoverageByCategory {
  category: string;
  sourceCount: number;
  activeSources: number;
  geographicRegions: string[];  // unique coverage.geo values
}

function buildCategoryMetrics(sources: IntelSource[]): CoverageByCategory[] {
  const map = new Map<string, CoverageByCategory>();

  for (const source of sources) {
    const cat = source.category;
    if (!map.has(cat)) {
      map.set(cat, {
        category: cat,
        sourceCount: 0,
        activeSources: 0,
        geographicRegions: [],
      });
    }
    const entry = map.get(cat)!;
    entry.sourceCount++;
    if (source.status === 'active') entry.activeSources++;

    const geo = source.coverage?.geo;
    if (geo && !entry.geographicRegions.includes(geo)) {
      entry.geographicRegions.push(geo);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.sourceCount - a.sourceCount);
}
```

---

## Source Details Table

Flat list from `intel_sources`, mapped to display fields:

```typescript
interface SourceRow {
  sourceKey: string;           // source_key
  name: string;                // name
  category: string;            // category
  status: string;              // status
  geographicCoverage: string;  // coverage?.geo ?? 'Not specified'
  updateFrequency: string;     // coverage?.frequency ?? '—'
}
```

Supports client-side sorting on all columns. Show first 50 rows with "Showing 50 of N" message.

---

## Map Markers

Convert `intel_normalized` rows to pin markers:

```typescript
interface MapMarker {
  id: string;
  lat: number;       // geo.coordinates[1]
  lng: number;       // geo.coordinates[0]
  title: string;
  severity: string;
  category: string;
  sourceId: string;
  ingestedAt: string;
}

function toMarkers(intel: IntelNormalized[]): MapMarker[] {
  return intel
    .filter(item => item.geo?.type === 'Point' && item.geo?.coordinates)
    .map(item => ({
      id: item.id,
      lat: item.geo.coordinates[1],
      lng: item.geo.coordinates[0],
      title: item.title,
      severity: item.severity,
      category: item.category,
      sourceId: item.source_id,
      ingestedAt: item.ingested_at,
    }));
}
```

**Note:** GeoJSON uses `[longitude, latitude]` order. Flip to `[lat, lng]` for most map libraries.

---

## Map Bounds Calculation

```typescript
function calculateBounds(markers: MapMarker[]) {
  if (markers.length === 0) return { center: [0, 0], zoom: 2 };
  if (markers.length === 1) return { center: [markers[0].lng, markers[0].lat], zoom: 8 };

  const lngs = markers.map(m => m.lng);
  const lats = markers.map(m => m.lat);
  return {
    bounds: [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
  };
}
```
